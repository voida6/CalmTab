import { useEffect, useState } from 'react'

// One timer for the whole page.
//
// Every clock face used to run its own `setInterval(…, 1000)`. With the
// Settings panel open that meant eleven of them at once — ten live previews
// plus the real clock — each waking the page and re-rendering on its own
// schedule. Worse, faces that only show hours and minutes were re-rendering
// sixty times more often than they had anything new to say.
//
// So: a single timer, aligned to the next real second boundary, with
// subscribers grouped by the resolution they actually need. A minute-only
// clock is notified once a minute, and then only when the minute changes.

type Listener = (now: Date) => void

const listeners = new Map<Listener, number>() // listener -> resolution in ms
const lastSent = new Map<Listener, number>()

let timer: ReturnType<typeof setTimeout> | undefined

function tick() {
  const now = new Date()
  const time = now.getTime()

  for (const [listener, resolution] of listeners) {
    // Which "slot" of this resolution we are in. Only notify when it changes,
    // so a minute-resolution listener stays quiet for 59 of every 60 ticks.
    const slot = Math.floor(time / resolution)
    if (lastSent.get(listener) === slot) continue
    lastSent.set(listener, slot)
    listener(now)
  }

  schedule()
}

function schedule() {
  if (!listeners.size) {
    timer = undefined
    return
  }
  // Fire just after the next whole second rather than every 1000ms from an
  // arbitrary start, so the displayed second flips when the real one does and
  // doesn't drift.
  const delay = 1000 - (Date.now() % 1000) + 5
  timer = setTimeout(tick, delay)
}

function subscribe(listener: Listener, resolution: number): () => void {
  listeners.set(listener, resolution)
  lastSent.set(listener, Math.floor(Date.now() / resolution))
  if (timer === undefined) schedule()
  return () => {
    listeners.delete(listener)
    lastSent.delete(listener)
    if (!listeners.size && timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }
}

/** Resolutions, named so call sites read as intent rather than arithmetic. */
export const SECOND = 1000
export const MINUTE = 60_000

/**
 * The current time, refreshed at `resolution`.
 *
 * Ask for the coarsest resolution the face actually needs: a clock showing
 * only hours and minutes should pass `MINUTE`, and will then re-render once a
 * minute instead of sixty times.
 */
export function useNow(resolution: number = SECOND): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => subscribe(setNow, resolution), [resolution])
  return now
}
