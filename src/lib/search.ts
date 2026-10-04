// What the launcher bar does once you start typing.
//
// The rule the whole module is built around: the box is never a dead end.
// Whatever you type produces at least one thing Enter can do — one of your
// shortcuts, a search on one of your shortcuts, an address, or the web.
//
// Like keynav.ts this is pure, so it can be tested directly and reused by the
// Alt+K overlay.

// Explicit .ts extension: this module is imported both by Vite and directly by
// Node when `npm test` runs it through type stripping, and Node does not guess
// extensions.
import { childrenOf, searchUrl } from './keynav.ts'
import type { LinkItem } from './types'

// ------------------------------------------------------------------ key paths

/** The keys you would press to reach an item from the root, e.g. "gm". Items
 *  with an unkeyed ancestor have no reachable path and return ''. */
export function keyPath(items: LinkItem[], item: LinkItem): string {
  const parts: string[] = []
  const seen = new Set<string>()
  let cur: LinkItem | undefined = item
  // `seen` guards against a parentId cycle, which would otherwise hang here.
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    if (!cur.key) return ''
    parts.unshift(cur.key)
    cur = cur.parentId ? items.find((i) => i.id === cur!.parentId) : undefined
  }
  return parts.join('')
}

/** Walk a key path from the root: "gm" → the item at `g` then `m`. */
export function resolvePath(items: LinkItem[], path: string): LinkItem | undefined {
  let parentId: string | undefined
  let found: LinkItem | undefined
  for (const key of path) {
    found = childrenOf(items, parentId).find((i) => i.key === key)
    if (!found) return undefined
    parentId = found.id
  }
  return found
}

/** Folder names enclosing an item, outermost first — shown beside a result so
 *  two shortcuts with the same name stay tellable apart. */
export function ancestorNames(items: LinkItem[], item: LinkItem): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  let cur = item.parentId ? items.find((i) => i.id === item.parentId) : undefined
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    names.unshift(cur.name)
    cur = cur.parentId ? items.find((i) => i.id === cur!.parentId) : undefined
  }
  return names
}

// ----------------------------------------------------------------- addresses

// Something the user clearly means as a destination rather than a query:
// a full URL, a bare host with a dot in it, or localhost with a port.
const ADDRESS =
  /^(https?:\/\/\S+|localhost(:\d+)?(\/\S*)?|[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)$/i

export function looksLikeAddress(query: string): boolean {
  return ADDRESS.test(query.trim())
}

export function toUrl(query: string): string {
  const q = query.trim()
  return /^https?:\/\//i.test(q) ? q : `https://${q}`
}

// ------------------------------------------------------------------- results

export type Result =
  /** One of the user's shortcuts or folders. */
  | { kind: 'item'; id: string; item: LinkItem; path: string; where: string[] }
  /** A search shortcut plus a term, typed in one go: `y lofi`. */
  | { kind: 'command'; id: string; item: LinkItem; term: string; url: string }
  /** A typed address. */
  | { kind: 'url'; id: string; url: string }
  /** The catch-all: send this text to the default engine. */
  | { kind: 'web'; id: string; query: string; url: string }

/** Where Enter on this result should take you. Folders have nowhere to go —
 *  they are stepped into instead, which the UI handles. */
export function resultUrl(result: Result): string | null {
  switch (result.kind) {
    case 'item':
      return result.item.folder ? null : result.item.url || null
    case 'command':
    case 'url':
    case 'web':
      return result.url
  }
}

// ------------------------------------------------------------------- scoring

/** Higher is better. Returns 0 for "no match at all". The tiers matter more
 *  than the numbers: an exact key path always beats a fuzzy name hit, because
 *  the keys are the vocabulary the user chose deliberately. */
function score(item: LinkItem, path: string, query: string): number {
  const q = query.toLowerCase()
  const name = item.name.toLowerCase()
  const url = item.url.toLowerCase()

  if (path && path === query) return 100 // exact key path, case-sensitive
  if (name === q) return 95
  if (path && path.startsWith(query)) return 85
  if (name.startsWith(q)) return 80

  // A match at the start of any word ("hub" in "GitHub Enterprise").
  if (name.split(/\s+/).some((w) => w.startsWith(q))) return 70
  if (name.includes(q)) return 60

  // Strip the scheme so "github" matches "https://github.com" strongly.
  if (url.replace(/^https?:\/\/(www\.)?/, '').startsWith(q)) return 55
  if (url.includes(q)) return 40
  return 0
}

// ------------------------------------------------------------------ commands

/** Detect `y lofi` / `g s capybara`: a key path onto a search shortcut,
 *  followed by the term. Tries the shortest path first, so a one-key search
 *  wins over a longer accidental match. */
function parseCommand(
  items: LinkItem[],
  query: string,
): { item: LinkItem; term: string } | null {
  const tokens = query.trim().split(/\s+/)
  if (tokens.length < 2) return null

  for (let i = 1; i < tokens.length; i++) {
    // Keys may be typed run together or spaced out, so the path is the tokens
    // before the split point with their spaces removed.
    const path = tokens.slice(0, i).join('')
    const item = resolvePath(items, path)
    if (item?.search) return { item, term: tokens.slice(i).join(' ') }
  }
  return null
}

// -------------------------------------------------------------------- search

export interface SearchOptions {
  /** Query URL for the fallback engine; the term is appended encoded. */
  engineUrl: string
  /** Cap on how many of the user's own items are listed. */
  limit?: number
}

/**
 * Rank everything the query could mean, best first.
 *
 * The order is deliberate: a command the user spelled out beats a fuzzy name
 * match, a typed address beats a web search, and the web search is always last
 * so Enter on nonsense still does something useful.
 */
export function search(items: LinkItem[], query: string, opts: SearchOptions): Result[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const results: Result[] = []

  const command = parseCommand(items, trimmed)
  if (command) {
    results.push({
      kind: 'command',
      id: `command:${command.item.id}`,
      item: command.item,
      term: command.term,
      url: searchUrl(command.item.search!, command.term),
    })
  }

  const matches = items
    .map((item) => {
      const path = keyPath(items, item)
      return { item, path, score: score(item, path, trimmed) }
    })
    .filter((m) => m.score > 0)
    // Stable sort: equal scores keep the user's own ordering, and shorter
    // names win ties because they are the more specific match.
    .sort((a, b) => b.score - a.score || a.item.name.length - b.item.name.length)
    .slice(0, opts.limit ?? 8)

  for (const m of matches) {
    results.push({
      kind: 'item',
      id: `item:${m.item.id}`,
      item: m.item,
      path: m.path,
      where: ancestorNames(items, m.item),
    })
  }

  if (looksLikeAddress(trimmed)) {
    results.push({ kind: 'url', id: 'url', url: toUrl(trimmed) })
  }

  results.push({
    kind: 'web',
    id: 'web',
    query: trimmed,
    url: opts.engineUrl + encodeURIComponent(trimmed),
  })

  return results
}
