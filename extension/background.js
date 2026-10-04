// Background script for the two keyboard commands.
//
// Deliberately a plain classic script with no imports: the same file runs as a
// Chrome service worker and as a Gecko background script, and neither target
// needs a bundler step to load it.
//
// Permissions note: this uses `activeTab`, which the browser grants for the
// current tab at the moment the user presses the shortcut. That is why CalmTab
// asks for no host access at install time and why adding the overlay does not
// re-prompt anyone who already has the extension.

const api = globalThis.browser ?? globalThis.chrome

// Keep in sync with lib/storage.ts — `links` roams via the sync area, with the
// local area as the fallback when the sync quota is exhausted.
async function readLinks() {
  for (const area of ['sync', 'local']) {
    try {
      const res = await api.storage[area].get('links')
      if (Array.isArray(res.links)) return { links: res.links, area }
    } catch {
      /* area unavailable — try the next one */
    }
  }
  return { links: [], area: 'local' }
}

async function writeLinks(links, area) {
  try {
    await api.storage[area].set({ links })
  } catch {
    // Sync quota or throttle: keep the data rather than lose the shortcut.
    await api.storage.local.set({ links })
  }
}

// Mirrors `suggestKey` in lib/keynav.ts: prefer a letter from the name so the
// binding is memorable, then fall back to any free character.
function suggestKey(name, taken) {
  const candidates =
    name.toLowerCase().replace(/[^a-z0-9]/g, '') +
    'abcdefghijklmnopqrstuvwxyz0123456789' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return [...candidates].find((c) => !taken.has(c))
}

// Mirrors `templateFromUrl` in lib/keynav.ts.
function templateFromUrl(rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  for (const name of ['q', 'query', 'search_query', 'search', 'k', 's', 'text', 'wd', 'p']) {
    if (!url.searchParams.get(name)) continue
    url.searchParams.set(name, '%s')
    return url.toString().replace(/%25s/g, '%s')
  }
  return null
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

/** Alt+K — drop the launcher onto whatever page is in front. */
async function openLauncher(tab) {
  if (!tab?.id) return
  try {
    await api.scripting.executeScript({ target: { tabId: tab.id }, files: ['overlay.js'] })
  } catch {
    // Browser-internal pages (about:, chrome://, the add-on stores) refuse
    // injection by design. Nothing to do but leave the page alone.
  }
}

/** Alt+Shift+K — remember the current page. A results page is saved as a
 *  reusable search rather than a frozen snapshot of one query. */
async function savePage(tab) {
  if (!tab?.url || !/^https?:/.test(tab.url)) return

  const { links, area } = await readLinks()
  const search = templateFromUrl(tab.url)

  // Re-saving a page that is already here would quietly pile up duplicates.
  if (links.some((l) => l.url === tab.url && !l.folder)) return

  const name = (tab.title || new URL(tab.url).hostname).slice(0, 40)
  const taken = new Set(links.filter((l) => !l.parentId && l.key).map((l) => l.key))

  const item = { id: uid(), name, url: tab.url, key: suggestKey(name, taken) }
  if (search) item.search = search

  await writeLinks([...links, item], area)
}

api.commands.onCommand.addListener(async (command) => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  if (command === 'open-launcher') await openLauncher(tab)
  else if (command === 'save-page') await savePage(tab)
})
