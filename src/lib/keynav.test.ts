// Run with: npm test
//
// Covers the launcher's decision-making only — the parts where a wrong answer
// means a keystroke silently opens the wrong site.

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  ROOT_STATE,
  childrenOf,
  clashingSlots,
  searchUrl,
  slotId,
  step,
  submitLocked,
  suggestKey,
  takenKeys,
  templateFromUrl,
} from './keynav.ts'
import type { LinkItem } from './types.ts'

const items: LinkItem[] = [
  { id: 'gh', name: 'GitHub', url: 'https://github.com', key: 'g' },
  { id: 'goo', name: 'Google', url: '', key: 'o', folder: true },
  { id: 'mail', name: 'Gmail', url: 'https://mail.google.com', key: 'm', parentId: 'goo' },
  { id: 'cal', name: 'Calendar', url: 'https://calendar.google.com', key: 'c', parentId: 'goo' },
  {
    id: 'yt',
    name: 'YouTube',
    url: 'https://youtube.com',
    key: 'y',
    search: 'https://youtube.com/results?search_query=%s',
  },
  { id: 'up', name: 'Uppercase', url: 'https://example.com', key: 'M' },
  { id: 'wk', name: 'Wikipedia', url: 'https://wikipedia.org', key: 'w', hidden: true },
]

const press = (key: string, state = ROOT_STATE, alt = false, term = '') =>
  step(items, state, { key, altKey: alt }, term)

test('a key opens the shortcut bound to it', () => {
  assert.deepEqual(press('g'), { kind: 'open', url: 'https://github.com', newTab: false })
})

test('Alt+key asks for a new tab', () => {
  assert.deepEqual(press('g', ROOT_STATE, true), {
    kind: 'open',
    url: 'https://github.com',
    newTab: true,
  })
})

test('keys are case-sensitive, so m and M are different slots', () => {
  assert.deepEqual(press('M'), { kind: 'open', url: 'https://example.com', newTab: false })
  // `m` is only bound inside the Google folder, so at the root it is free.
  assert.deepEqual(press('m'), { kind: 'pass' })
})

test('a folder key steps inside, and the next key resolves there', () => {
  const entered = press('o')
  assert.equal(entered.kind, 'state')
  const inside = entered.kind === 'state' ? entered.next : ROOT_STATE
  assert.deepEqual(inside.path, ['goo'])
  assert.deepEqual(press('m', inside), {
    kind: 'open',
    url: 'https://mail.google.com',
    newTab: false,
  })
  // Root-level keys are not reachable from inside a folder.
  assert.deepEqual(press('g', inside), { kind: 'pass' })
})

test('Esc and Backspace walk back out, innermost first', () => {
  const inside = { path: ['goo'], locked: 'yt' }
  const unlocked = press('Escape', inside)
  assert.deepEqual(unlocked, { kind: 'state', next: { path: ['goo'], locked: null } })
  const out = press('Backspace', { path: ['goo'], locked: null })
  assert.deepEqual(out, { kind: 'state', next: { path: [], locked: null } })
  // Nothing left to walk back to: the browser keeps the keystroke.
  assert.deepEqual(press('Escape'), { kind: 'pass' })
})

test('Backspace with text in the box belongs to the text', () => {
  assert.deepEqual(press('Backspace', { path: ['goo'], locked: null }, false, 'abc'), {
    kind: 'pass',
  })
})

test('a search key locks in rather than opening', () => {
  assert.deepEqual(press('y'), { kind: 'state', next: { path: [], locked: 'yt' } })
})

test('once locked, characters go to the term instead of jumping', () => {
  assert.deepEqual(press('g', { path: [], locked: 'yt' }), { kind: 'pass' })
})

test('submitting a locked search fills the placeholder', () => {
  assert.equal(
    submitLocked(items, { path: [], locked: 'yt' }, 'lofi beats'),
    'https://youtube.com/results?search_query=lofi%20beats',
  )
  assert.equal(submitLocked(items, ROOT_STATE, 'x'), null)
})

test('a keyboard-only shortcut still opens on its key', () => {
  // The whole point: no tile on the page, but the key works exactly as if
  // there were one.
  assert.deepEqual(press('w'), { kind: 'open', url: 'https://wikipedia.org', newTab: false })
})

test('unbound keys are handed back to the browser', () => {
  assert.deepEqual(press('z'), { kind: 'pass' })
  assert.deepEqual(press('/'), { kind: 'pass' })
  assert.deepEqual(press('F5'), { kind: 'pass' })
})

test('a template without %s still takes the term', () => {
  assert.equal(searchUrl('https://example.com/?q=', 'a b'), 'https://example.com/?q=a%20b')
})

test('a results URL becomes a reusable template', () => {
  assert.equal(
    templateFromUrl('https://www.google.com/search?q=capybara&hl=en'),
    'https://www.google.com/search?q=%s&hl=en',
  )
  assert.equal(templateFromUrl('https://example.com/about'), null)
  assert.equal(templateFromUrl('not a url'), null)
})

test('children of a deleted folder fall back to the root', () => {
  const orphaned: LinkItem[] = [{ id: 'x', name: 'X', url: 'https://x.test', parentId: 'gone' }]
  assert.deepEqual(
    childrenOf(orphaned, undefined).map((i) => i.id),
    ['x'],
  )
})

test('suggested keys come from the name, then fall back', () => {
  assert.equal(suggestKey('GitHub', new Set()), 'g')
  assert.equal(suggestKey('GitHub', new Set(['g'])), 'i')
  // Nothing in the name is free, so it drops to the first unused character.
  assert.equal(suggestKey('ab', new Set(['a', 'b'])), 'c')
})

test('taken keys are scoped to one folder', () => {
  assert.deepEqual([...takenKeys(items, 'goo')].sort(), ['c', 'm'])
  // A hidden item still occupies its key, or a new shortcut could be handed
  // one that silently never fires.
  assert.deepEqual([...takenKeys(items, undefined)].sort(), ['M', 'g', 'o', 'w', 'y'])
})

test('clashes are reported per folder, not globally', () => {
  // `m` at the root and `m` inside the Google folder do not collide.
  assert.equal(clashingSlots(items).size, 0)

  const dupeAtRoot = [...items, { id: 'gh2', name: 'Other', url: 'https://o.test', key: 'g' }]
  assert.deepEqual([...clashingSlots(dupeAtRoot)], [slotId({ key: 'g' })])

  const dupeInFolder = [
    ...items,
    { id: 'm2', name: 'Other', url: 'https://o.test', key: 'm', parentId: 'goo' },
  ]
  assert.deepEqual([...clashingSlots(dupeInFolder)], [slotId({ key: 'm', parentId: 'goo' })])
})
