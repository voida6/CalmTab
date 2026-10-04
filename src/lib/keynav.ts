// The keyboard launcher, as a pure function of (items, state, keystroke).
//
// Nothing in this file touches the DOM, storage or React, so the same logic
// drives the new tab and the Alt+K page overlay, and it can be reasoned about
// (and tested) on its own. `useKeyNav` wires it to real key events.
//
// The model is deliberately tiny — three ideas:
//   * every item owns a KEY; pressing it acts on that item
//   * a FOLDER is an item you step into, so keys chain: `g` then `m`
//   * a SEARCH item holds a %s template, so it takes a term before opening
//
// Keys are case-sensitive: `m` and `M` are separate slots, which gives each
// folder 62 of them (a–z, A–Z, 0–9) without ever needing a modifier.

import type { LinkItem } from './types'

/** Characters allowed as a key. Punctuation is reserved for the app's own
 *  commands (`/` search, `Esc` back), so it is excluded here. */
const KEY_CHAR = /^[a-zA-Z0-9]$/

export function isKeyChar(ch: string): boolean {
  return KEY_CHAR.test(ch)
}

// ---------------------------------------------------------------- navigation

export interface NavState {
  /** Folder ids from the root inward; empty means "at the top". */
  path: string[]
  /** Id of a search item that has been locked in and is awaiting its term. */
  locked: string | null
}

export const ROOT_STATE: NavState = { path: [], locked: null }

/** The folder we are currently looking at, or undefined at the root. */
export function currentFolderId(state: NavState): string | undefined {
  return state.path[state.path.length - 1]
}

/** Direct children of a folder, in stored order. Items whose `parentId`
 *  points at a folder that no longer exists are treated as root-level, so a
 *  deleted folder can never strand its contents out of reach. */
export function childrenOf(items: LinkItem[], parentId: string | undefined): LinkItem[] {
  const ids = new Set(items.map((i) => i.id))
  return items.filter((i) => {
    const parent = i.parentId && ids.has(i.parentId) ? i.parentId : undefined
    return parent === parentId
  })
}

/** The item bound to `key` in the folder we are currently in. */
export function resolveKey(
  items: LinkItem[],
  state: NavState,
  key: string,
): LinkItem | undefined {
  return childrenOf(items, currentFolderId(state)).find((i) => i.key === key)
}

/** Names of the folders we have stepped into, for the breadcrumb. */
export function pathNames(items: LinkItem[], state: NavState): string[] {
  return state.path
    .map((id) => items.find((i) => i.id === id)?.name)
    .filter((n): n is string => !!n)
}

// -------------------------------------------------------------------- search

/** Fill a `%s` template. Templates without a placeholder get the term
 *  appended as a query string, which is what most "just paste the search URL"
 *  attempts produce. */
export function searchUrl(template: string, term: string): string {
  const encoded = encodeURIComponent(term)
  return template.includes('%s') ? template.replace(/%s/g, encoded) : template + encoded
}

/** Turn a results URL into a reusable template by replacing the value of its
 *  query parameter with %s. Used by "save this page" when the page is search
 *  results. Returns null when nothing search-shaped is found. */
export function templateFromUrl(rawUrl: string): string | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  // The usual suspects, in the order engines tend to use them.
  const PARAMS = ['q', 'query', 'search_query', 'search', 'k', 's', 'text', 'wd', 'p']
  for (const name of PARAMS) {
    const value = url.searchParams.get(name)
    if (!value) continue
    url.searchParams.set(name, '%s')
    // Re-encoding would turn the placeholder into %25s.
    return url.toString().replace(/%25s/g, '%s')
  }
  return null
}

// ------------------------------------------------------------- key assignment

/** Every key already taken inside a folder. */
export function takenKeys(items: LinkItem[], parentId: string | undefined): Set<string> {
  const taken = new Set<string>()
  for (const i of childrenOf(items, parentId)) if (i.key) taken.add(i.key)
  return taken
}

/** Pick a free key for a new item, preferring letters from its own name so
 *  the binding is memorable ("GitHub" → g, then i, then t...). Falls back to
 *  any free character, and returns undefined only when all 62 are used. */
export function suggestKey(name: string, taken: Set<string>): string | undefined {
  const candidates = [
    ...name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    ...'abcdefghijklmnopqrstuvwxyz0123456789',
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ]
  return candidates.find((c) => !taken.has(c))
}

/** Identifies one key binding. The same character in two different folders is
 *  two different slots, so only a repeat within a single folder is a clash. */
export function slotId(item: Pick<LinkItem, 'parentId' | 'key'>): string {
  // '/' can appear in neither half (ids are generated, keys are alphanumeric),
  // so it is an unambiguous separator.
  return (item.parentId ?? '') + '/' + (item.key ?? '')
}

/** Slots bound more than once. `step` would quietly pick whichever came first,
 *  so the UI flags these rather than letting a key do the wrong thing. */
export function clashingSlots(items: LinkItem[]): Set<string> {
  const counts = new Map<string, number>()
  for (const i of items) {
    if (!i.key) continue
    const slot = slotId(i)
    counts.set(slot, (counts.get(slot) ?? 0) + 1)
  }
  const clashes = new Set<string>()
  for (const [slot, count] of counts) if (count > 1) clashes.add(slot)
  return clashes
}

// ------------------------------------------------------------------- stepping

export type NavAction =
  /** Navigate. `newTab` mirrors the Alt modifier. */
  | { kind: 'open'; url: string; newTab: boolean }
  /** Move within the tree, or lock/unlock a search. */
  | { kind: 'state'; next: NavState }
  /** Hand the keystroke back to the browser. */
  | { kind: 'pass' }

export interface KeyEvent {
  key: string
  altKey: boolean
}

/** Apply one keystroke. `term` is whatever is in the search box, which
 *  matters only for the Backspace-walks-back rule. */
export function step(
  items: LinkItem[],
  state: NavState,
  event: KeyEvent,
  term = '',
): NavAction {
  const { key, altKey } = event

  // Esc, and Backspace on an empty box, walk back out one level at a time:
  // a locked search first, then each enclosing folder.
  if (key === 'Escape' || (key === 'Backspace' && term === '')) {
    if (state.locked) return { kind: 'state', next: { ...state, locked: null } }
    if (state.path.length) {
      return { kind: 'state', next: { ...state, path: state.path.slice(0, -1) } }
    }
    return { kind: 'pass' }
  }

  // While a search is locked in, every character belongs to the term.
  if (state.locked) return { kind: 'pass' }

  if (!isKeyChar(key)) return { kind: 'pass' }

  const target = resolveKey(items, state, key)
  if (!target) return { kind: 'pass' }

  if (target.folder) {
    return { kind: 'state', next: { ...state, path: [...state.path, target.id] } }
  }
  if (target.search) {
    // Alt+key on a search still means "new tab", but there is no term yet, so
    // lock it in and let the box collect one.
    return { kind: 'state', next: { ...state, locked: target.id } }
  }
  if (!target.url) return { kind: 'pass' }
  return { kind: 'open', url: target.url, newTab: altKey }
}

/** Run the locked-in search with `term`. Returns null if nothing is locked. */
export function submitLocked(
  items: LinkItem[],
  state: NavState,
  term: string,
): string | null {
  const item = items.find((i) => i.id === state.locked)
  if (!item?.search) return null
  return searchUrl(item.search, term)
}
