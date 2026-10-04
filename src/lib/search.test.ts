import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  ancestorNames,
  keyPath,
  looksLikeAddress,
  resolvePath,
  resultUrl,
  search,
  toUrl,
} from './search.ts'
import type { LinkItem } from './types.ts'

const items: LinkItem[] = [
  { id: 'gh', name: 'GitHub', url: 'https://github.com', key: 'g' },
  { id: 'goo', name: 'Google', url: '', key: 'o', folder: true },
  { id: 'mail', name: 'Gmail', url: 'https://mail.google.com', key: 'm', parentId: 'goo' },
  {
    id: 'sheet',
    name: 'Sheets',
    url: 'https://sheets.google.com',
    key: 's',
    parentId: 'goo',
    search: 'https://drive.google.com/?q=%s',
  },
  {
    id: 'yt',
    name: 'YouTube',
    url: 'https://youtube.com',
    key: 'y',
    search: 'https://youtube.com/results?search_query=%s',
  },
  { id: 'nokey', name: 'Unkeyed', url: 'https://nokey.test' },
]

const opts = { engineUrl: 'https://duckduckgo.com/?q=' }
const run = (q: string) => search(items, q, opts)
const kinds = (q: string) => run(q).map((r) => r.kind)

test('a key path is the keys you would actually press', () => {
  assert.equal(keyPath(items, items[0]), 'g')
  assert.equal(keyPath(items, items[2]), 'om')
  // An item with no key of its own is not reachable by keys at all.
  assert.equal(keyPath(items, items[5]), '')
})

test('a key path resolves back to its item', () => {
  assert.equal(resolvePath(items, 'om')?.id, 'mail')
  assert.equal(resolvePath(items, 'o')?.id, 'goo')
  assert.equal(resolvePath(items, 'zz'), undefined)
  // `m` is only bound inside the folder, so it does not resolve from the root.
  assert.equal(resolvePath(items, 'm'), undefined)
})

test('results carry the folders they live in', () => {
  assert.deepEqual(ancestorNames(items, items[2]), ['Google'])
  assert.deepEqual(ancestorNames(items, items[0]), [])
})

test('an exact key path outranks a name match', () => {
  const first = run('om')[0]
  assert.equal(first.kind, 'item')
  assert.equal(first.kind === 'item' && first.item.id, 'mail')
})

test('typing a name finds it', () => {
  const first = run('githu')[0]
  assert.equal(first.kind === 'item' && first.item.id, 'gh')
})

test('a URL fragment finds the shortcut', () => {
  const ids = run('youtube.co')
    .filter((r) => r.kind === 'item')
    .map((r) => (r.kind === 'item' ? r.item.id : ''))
  assert.ok(ids.includes('yt'))
})

test('an inline command runs a search shortcut with its term', () => {
  const first = run('y lofi beats')[0]
  assert.equal(first.kind, 'command')
  assert.equal(
    first.kind === 'command' && first.url,
    'https://youtube.com/results?search_query=lofi%20beats',
  )
})

test('a command path may be typed run together or spaced out', () => {
  for (const q of ['os capybara', 'o s capybara']) {
    const first = run(q)[0]
    assert.equal(first.kind, 'command', q)
    assert.equal(first.kind === 'command' && first.url, 'https://drive.google.com/?q=capybara', q)
  }
})

test('a key path onto a folder is not a command', () => {
  // `o` is a folder, not a search, so "o hello" is just a web search.
  assert.equal(run('o hello')[0].kind !== 'command', true)
})

test('an address offers to open directly, and still offers the web', () => {
  assert.ok(kinds('claude.ai').includes('url'))
  assert.ok(kinds('localhost:3000').includes('url'))
  assert.ok(kinds('https://example.com/a/b').includes('url'))
  // Plain words are not addresses.
  assert.equal(kinds('hello there').includes('url'), false)
  assert.equal(looksLikeAddress('just words'), false)
})

test('a bare host gets a scheme, an explicit one is left alone', () => {
  assert.equal(toUrl('claude.ai'), 'https://claude.ai')
  assert.equal(toUrl('http://example.com'), 'http://example.com')
})

test('the box is never a dead end', () => {
  const results = run('qqqqq nonsense')
  assert.equal(results.length, 1)
  assert.equal(results[0].kind, 'web')
  assert.equal(resultUrl(results[0]), 'https://duckduckgo.com/?q=qqqqq%20nonsense')
})

test('an empty query produces nothing at all', () => {
  assert.deepEqual(run(''), [])
  assert.deepEqual(run('   '), [])
})

test('folders have no destination of their own', () => {
  const folder = run('Google').find((r) => r.kind === 'item' && r.item.folder)
  assert.ok(folder)
  assert.equal(resultUrl(folder), null)
})

test('the web fallback is always last', () => {
  for (const q of ['g', 'github', 'y lofi', 'claude.ai']) {
    const list = run(q)
    assert.equal(list[list.length - 1].kind, 'web', q)
  }
})
