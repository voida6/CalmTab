// Storage abstraction with three backends:
//   - chrome.storage.sync  — small user prefs (settings, links, widget order,
//     search engine) so they roam with the browser profile.
//   - chrome.storage.local — everything else (todos, habits, caches).
//   - IndexedDB            — the wallpaper (multi-MB data URL; too big for
//     chrome.storage.sync and wasteful to rewrite in .local).
// During `npm run dev` (no chrome.* APIs) everything falls back to
// window.localStorage.
//
// subscribe() delivers cross-tab updates: chrome.storage.onChanged for the
// chrome areas, a BroadcastChannel for IndexedDB, and the window `storage`
// event in dev.

const hasChrome =
  typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local
const hasSync = hasChrome && !!chrome.storage.sync

// Keys that roam via chrome.storage.sync. Keep these small (8KB/item quota).
const SYNC_KEYS = new Set(['settings', 'links', 'widgetOrder', 'searchEngine'])
// Keys stored in IndexedDB.
const IDB_KEYS = new Set(['wallpaper', 'wallpaperMedia'])

type Area = 'sync' | 'local'

// ---------------------------------------------------------------- IndexedDB

const DB_NAME = 'calmtab'
const STORE = 'kv'
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function idbGet(key: string): Promise<unknown> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ------------------------------------------------------------ raw chrome/dev

async function rawGet(area: Area, key: string): Promise<unknown> {
  if (hasChrome) {
    const store = area === 'sync' && hasSync ? chrome.storage.sync : chrome.storage.local
    const res = await store.get(key)
    return res[key]
  }
  const raw = localStorage.getItem(area === 'sync' ? `sync:${key}` : key)
  if (raw == null) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

async function rawSet(area: Area, key: string, value: unknown): Promise<void> {
  if (hasChrome) {
    const store = area === 'sync' && hasSync ? chrome.storage.sync : chrome.storage.local
    await store.set({ [key]: value })
  } else {
    localStorage.setItem(area === 'sync' ? `sync:${key}` : key, JSON.stringify(value))
  }
}

async function rawRemove(area: Area, key: string): Promise<void> {
  if (hasChrome) {
    const store = area === 'sync' && hasSync ? chrome.storage.sync : chrome.storage.local
    await store.remove(key)
  } else {
    localStorage.removeItem(area === 'sync' ? `sync:${key}` : key)
  }
}

// -------------------------------------------------------------- subscriptions

type Listener = (value: unknown) => void
const listeners = new Map<string, Set<Listener>>()

function emit(key: string, value: unknown) {
  listeners.get(key)?.forEach((fn) => fn(value))
}

// chrome.storage change events (fires in every tab, including the writer).
if (hasChrome) {
  chrome.storage.onChanged.addListener((changes) => {
    for (const key of Object.keys(changes)) {
      const next = changes[key].newValue
      // Ignore removals (used only during one-off migrations).
      if (next !== undefined) emit(key, next)
    }
  })
} else if (typeof window !== 'undefined') {
  // Dev fallback: `storage` fires in *other* tabs only, which is all we need.
  window.addEventListener('storage', (e) => {
    if (!e.key || e.newValue == null) return
    const key = e.key.startsWith('sync:') ? e.key.slice(5) : e.key
    try {
      emit(key, JSON.parse(e.newValue))
    } catch {
      /* not ours */
    }
  })
}

// IndexedDB has no change events; use a BroadcastChannel (other tabs only).
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('calmtab-kv') : null
channel?.addEventListener('message', (e: MessageEvent) => {
  const key = e.data?.key as string | undefined
  if (!key || !IDB_KEYS.has(key)) return
  idbGet(key)
    .then((v) => v !== undefined && emit(key, v))
    .catch(() => undefined)
})

/** Listen for changes to `key` made by other tabs (or this one, for chrome
 * areas). Returns an unsubscribe function. */
export function subscribe<T>(key: string, cb: (value: T) => void): () => void {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(cb as Listener)
  return () => {
    set!.delete(cb as Listener)
  }
}

// ---------------------------------------------------------------- public API

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  if (IDB_KEYS.has(key)) {
    try {
      const v = await idbGet(key)
      if (v !== undefined) return v as T
      // One-off migration from chrome.storage.local (pre-0.2 releases).
      const legacy = await rawGet('local', key)
      if (legacy !== undefined) {
        await idbSet(key, legacy)
        void rawRemove('local', key)
        return legacy as T
      }
    } catch {
      /* fall through to fallback */
    }
    return fallback
  }

  if (SYNC_KEYS.has(key)) {
    const v = await rawGet('sync', key)
    if (v !== undefined) return v as T
    // One-off migration from the local area (pre-0.2 releases).
    const legacy = await rawGet('local', key)
    if (legacy !== undefined) {
      rawSet('sync', key, legacy).catch(() => undefined)
      return legacy as T
    }
    return fallback
  }

  const v = await rawGet('local', key)
  return (v as T | undefined) ?? fallback
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  if (IDB_KEYS.has(key)) {
    await idbSet(key, value)
    channel?.postMessage({ key })
    return
  }
  if (SYNC_KEYS.has(key)) {
    try {
      await rawSet('sync', key, value)
      return
    } catch {
      // Sync quota/throttle exceeded — keep the data in local instead, and
      // drop the stale sync copy so it can't shadow the newer local value.
      void rawRemove('sync', key).catch(() => undefined)
    }
  }
  await rawSet('local', key, value)
}

/** Wipe everything (used by Settings → Reset). */
export async function clearAll(): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.clear()
    if (hasSync) await chrome.storage.sync.clear()
  } else {
    localStorage.clear()
  }
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* best-effort */
  }
}
