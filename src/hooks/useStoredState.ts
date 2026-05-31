import { useEffect, useRef, useState } from 'react'
import { getItem, setItem } from '../lib/storage'

// React state mirrored to persistent storage. Loads the stored value once on
// mount, then writes back on every change (after the initial load completes, so
// we never overwrite stored data with the default before it has loaded).
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const loaded = useRef(false)

  useEffect(() => {
    let active = true
    getItem<T>(key, initial).then((stored) => {
      if (!active) return
      setValue(stored)
      loaded.current = true
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (loaded.current) void setItem(key, value)
  }, [key, value])

  return [value, setValue] as const
}
