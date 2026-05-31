// Storage abstraction. Uses chrome.storage.local inside the extension, and
// falls back to window.localStorage during `npm run dev` (where the chrome API
// is absent). Keep all persisted reads/writes going through here so Phase 2 can
// swap in chrome.storage.sync without touching components.

const hasChrome =
  typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  if (hasChrome) {
    const res = await chrome.storage.local.get(key)
    return (res[key] as T | undefined) ?? fallback
  }
  const raw = localStorage.getItem(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.set({ [key]: value })
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}
