import { useCallback, useEffect, useRef, useState } from 'react'
import { getItem, setItem, subscribe } from '../lib/storage'

// React state mirrored to persistent storage.
//
// - Loads the stored value once on mount. If the user has already changed the
//   value before the (async) load resolves, the stale load is discarded.
// - Subscribes to storage changes so every open tab stays in sync.
// - Writes are debounced (250ms, flushed on pagehide/unmount) so slider drags
//   don't blow through chrome.storage.sync's write-rate quota.
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const loaded = useRef(false)
  const dirty = useRef(false) // user changed the value locally
  const remote = useRef(false) // current update came from another tab
  const lastWritten = useRef<string | null>(null)
  const pending = useRef<T | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    if (pending.current === null) return
    const v = pending.current
    pending.current = null
    lastWritten.current = JSON.stringify(v)
    void setItem(key, v)
  }, [key])

  useEffect(() => {
    let active = true
    getItem<T>(key, initial).then((stored) => {
      loaded.current = true
      if (!active || dirty.current) return // don't clobber an early user edit
      remote.current = true
      setValue(stored)
    })
    const unsub = subscribe<T>(key, (next) => {
      // Ignore the echo of our own write (chrome.storage.onChanged fires in
      // the writing tab too).
      if (JSON.stringify(next) === lastWritten.current) return
      loaded.current = true
      remote.current = true
      setValue(next)
    })
    return () => {
      active = false
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Persist local (non-remote) changes, debounced.
  useEffect(() => {
    if (!dirty.current) return
    if (remote.current) {
      remote.current = false
      return
    }
    pending.current = value
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 250)
  }, [value, flush])

  // Flush pending writes when the tab is closed/hidden or the hook unmounts.
  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    dirty.current = true
    remote.current = false
    setValue(updater as T | ((prev: T) => T))
  }, [])

  return [value, set] as const
}
