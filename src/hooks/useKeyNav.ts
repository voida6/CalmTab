import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ROOT_STATE,
  childrenOf,
  currentFolderId,
  pathNames,
  step,
  submitLocked,
} from '../lib/keynav'
import type { NavState } from '../lib/keynav'
import type { LinkItem } from '../lib/types'

/** True when the keystroke is someone typing into a field. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** The launcher's own box marks itself with `data-keynav`. Characters typed
 *  there are text, but Esc and Backspace still have to walk back out of the
 *  folder or search the user is in — so only those two are intercepted. */
function isLauncherBox(target: EventTarget | null): boolean {
  return (target as HTMLElement | null)?.dataset?.keynav !== undefined
}

interface Options {
  items: LinkItem[]
  enabled: boolean
  /** Called with the term box's current contents; supplied by the UI. */
  term: string
  setTerm: (value: string) => void
  /** Where to send the browser. Defaults to this window / a new tab. */
  navigate?: (url: string, newTab: boolean) => void
  /** A key the launcher had no binding for, pressed outside any text field.
   *  The new tab uses this to hand the keystroke to the search box, so an
   *  unassigned letter starts a query rather than doing nothing. */
  onFallthrough?: (key: string) => void
}

function defaultNavigate(url: string, newTab: boolean) {
  if (newTab) window.open(url, '_blank', 'noopener')
  else window.location.href = url
}

/**
 * Wires the pure launcher in `lib/keynav` to real key events.
 *
 * Returns everything the UI needs to render its current state: which items are
 * on screen, where we are in the folder tree, and which search (if any) has
 * been locked in and is waiting for a term.
 */
export function useKeyNav({
  items,
  enabled,
  term,
  setTerm,
  navigate,
  onFallthrough,
}: Options) {
  const [state, setState] = useState<NavState>(ROOT_STATE)
  const go = navigate ?? defaultNavigate

  // A folder that gets deleted while we are inside it would otherwise trap us.
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id))
    setState((s) => {
      const path = s.path.filter((id) => ids.has(id))
      const locked = s.locked && ids.has(s.locked) ? s.locked : null
      return path.length === s.path.length && locked === s.locked ? s : { path, locked }
    })
  }, [items])

  const reset = useCallback(() => setState(ROOT_STATE), [])

  /** Do to an item exactly what pressing its key would do. Lets the dock's
   *  click handling and the keyboard share one definition of "activate". */
  const activate = useCallback(
    (item: LinkItem, newTab = false) => {
      if (item.folder) {
        setState((s) => ({ ...s, path: [...s.path, item.id] }))
      } else if (item.search) {
        setTerm('')
        setState((s) => ({ ...s, locked: item.id }))
      } else if (item.url) {
        go(item.url, newTab)
      }
    },
    [go, setTerm],
  )

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      // Leave the browser's own chords (Ctrl/Cmd) completely alone.
      if (e.ctrlKey || e.metaKey) return

      const inBox = isLauncherBox(e.target)
      if (isTyping(e.target) && !inBox) return

      // Inside the launcher's own box: once there is text, every character
      // belongs to that text and only the walk-back keys are ours. While the
      // box is still empty a bound key jumps, so the caret can sit there ready
      // to type without costing you single-key navigation.
      if (inBox && term !== '' && e.key !== 'Escape' && e.key !== 'Backspace') return

      const action = step(items, state, { key: e.key, altKey: e.altKey }, term)
      if (action.kind === 'pass') {
        // Nothing is bound to this key.
        //   - in the box: let it type, which starts a query
        //   - outside: hand it to the box, so typing anywhere starts one too
        if (inBox) return
        if (onFallthrough && (e.key === '/' || (e.key.length === 1 && !e.altKey))) {
          e.preventDefault()
          onFallthrough(e.key)
        }
        return
      }
      e.preventDefault()
      if (action.kind === 'state') {
        // Walking out of a locked search discards the half-typed term.
        if (state.locked && !action.next.locked) setTerm('')
        setState(action.next)
      } else {
        go(action.url, action.newTab)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [items, state, enabled, term, setTerm, go, onFallthrough])

  const locked = useMemo(
    () => items.find((i) => i.id === state.locked) ?? null,
    [items, state.locked],
  )

  /** Run the locked-in search. No-op when nothing is locked, so the caller can
   *  wire it straight to the box's Enter handler. */
  const submit = useCallback(
    (newTab = false) => {
      const url = submitLocked(items, state, term)
      if (!url) return false
      go(url, newTab)
      return true
    },
    [items, state, term, go],
  )

  return {
    /** Items to draw at the current level. Keyboard-only entries are left out
     *  — they are still reachable by their key and through search, they just
     *  don't take up a tile. */
    visible: useMemo(
      () => childrenOf(items, currentFolderId(state)).filter((i) => !i.hidden),
      [items, state],
    ),
    /** Folder names from the root inward, for the breadcrumb. */
    crumbs: useMemo(() => pathNames(items, state), [items, state]),
    /** The search item awaiting a term, if any. */
    locked,
    inFolder: state.path.length > 0,
    activate,
    submit,
    reset,
  }
}
