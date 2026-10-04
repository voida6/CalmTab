export interface Engine {
  id: string
  name: string
  /** Query URL; the term is appended encoded. */
  url: string
  favicon: string
}

// The fallback engines offered when a typed query matches none of the user's
// own shortcuts. A user-defined search shortcut can be chosen instead.
export const ENGINES: Engine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    favicon: 'https://www.google.com/favicon.ico',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    favicon: 'https://www.bing.com/favicon.ico',
  },
  {
    id: 'ddg',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    favicon: 'https://duckduckgo.com/favicon.ico',
  },
]

export function engineById(id: string): Engine {
  return ENGINES.find((e) => e.id === id) ?? ENGINES[0]
}
