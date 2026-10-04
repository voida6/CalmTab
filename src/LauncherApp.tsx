import { useEffect, useRef, useState } from 'react'
import { CommandBar } from './components/CommandBar'
import { LinksDock } from './components/LinksDock'
import { useKeyNav } from './hooks/useKeyNav'
import { useStoredState } from './hooks/useStoredState'
import { DEFAULT_LINKS, DEFAULT_SETTINGS } from './lib/types'
import type { LinkItem, Settings } from './lib/types'

/** Ask the content script that framed us to act. It owns the host page; this
 *  frame deliberately has no way to navigate it directly. */
function post(message: Record<string, unknown>) {
  window.parent.postMessage(message, '*')
}

/**
 * The Alt+K overlay: the same shortcuts, the same keys, the same launcher as
 * the new tab — just without the clock, the weather and the wallpaper.
 *
 * It renders inside an iframe injected by extension/overlay.js, so navigation
 * and dismissal are messages rather than direct calls.
 */
export default function LauncherApp() {
  const [settings] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [links] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [engineId, setEngineId] = useStoredState<string>('searchEngine', 'google')
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const keynav = useKeyNav({
    items: links,
    enabled: true,
    term: query,
    setTerm: setQuery,
    navigate: (url, newTab) => post({ type: 'calmtab:open', url, newTab }),
    // Typing anywhere in the overlay goes to the box — there is nothing else
    // here it could belong to.
    onFallthrough: (key) => {
      input.current?.focus()
      if (key !== '/') setQuery((q) => q + key)
    },
  })

  // Esc walks back out of a search, then out of each folder, and once there is
  // nothing left to walk back to it closes the overlay. `useKeyNav` registers
  // its listener first (its hook runs above), so by the time this one fires,
  // `defaultPrevented` already tells us whether the launcher consumed the key.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) post({ type: 'calmtab:close' })
    }
    window.addEventListener('keydown', onKeyDown)
    window.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="launcher-page">
      <CommandBar
        ref={input}
        items={links}
        iconStyle={settings.iconStyle}
        engineId={engineId}
        setEngineId={setEngineId}
        query={query}
        setQuery={setQuery}
        crumbs={keynav.crumbs}
        locked={keynav.locked}
        onSubmitLocked={(newTab) => keynav.submit(newTab)}
        onActivate={keynav.activate}
        onNavigate={(url, newTab) => post({ type: 'calmtab:open', url, newTab })}
        onReset={() => {
          keynav.reset()
          setQuery('')
        }}
        autoFocus
      />

      {/* Results take the grid's place, so the panel never grows a scrollbar. */}
      {!query.trim() && (
        <LinksDock
          links={keynav.visible}
          iconStyle={settings.iconStyle}
          showKeys
          onActivate={keynav.activate}
          layout="grid"
        />
      )}

      <p className="launcher-hint">
        {keynav.locked
          ? 'Type your search, then Enter'
          : 'Press a key to jump · Alt opens a new tab · Esc closes'}
      </p>
    </div>
  )
}
