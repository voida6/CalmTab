import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { engineById, ENGINES } from '../data/engines'
import { resultUrl, search } from '../lib/search'
import type { Result } from '../lib/search'
import type { IconStyle, LinkItem } from '../lib/types'
import { FolderIcon, MicIcon, SearchIcon } from './Icons'
import { ShortcutIcon } from './ShortcutIcon'

// Minimal typing for the (prefixed) Web Speech API.
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  start: () => void
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onend: () => void
  onerror: () => void
}

interface Props {
  items: LinkItem[]
  iconStyle: IconStyle
  engineId: string
  setEngineId: (id: string) => void
  query: string
  setQuery: (value: string) => void
  /** Breadcrumb of folders the keyboard has stepped into. */
  crumbs: string[]
  /** The search shortcut awaiting a term, if one is locked in. */
  locked: LinkItem | null
  /** Run the locked-in search with the current text. */
  onSubmitLocked: (newTab: boolean) => void
  /** Step into a folder / lock a search — same as pressing the item's key. */
  onActivate: (item: LinkItem, newTab?: boolean) => void
  /** Go somewhere. Supplied by the caller so the overlay can post a message
   *  to its host page instead of navigating this frame. */
  onNavigate: (url: string, newTab: boolean) => void
  /** Walk all the way back to the root. */
  onReset: () => void
  autoFocus?: boolean
}

/**
 * The bar the whole new tab is now built around.
 *
 * Empty, it is just a prompt — the keys do the work, and this is where the
 * breadcrumb and the locked-search state show up. Typed into, it searches
 * everything you have: names, URLs, key paths, inline commands, addresses,
 * and finally the web, so Enter always does something.
 */
export const CommandBar = forwardRef<HTMLInputElement, Props>(function CommandBar(
  {
    items,
    iconStyle,
    engineId,
    setEngineId,
    query,
    setQuery,
    crumbs,
    locked,
    onSubmitLocked,
    onActivate,
    onNavigate,
    onReset,
    autoFocus,
  },
  ref,
) {
  const [cursor, setCursor] = useState(0)
  const [listening, setListening] = useState(false)
  const recog = useRef<SpeechRecognitionLike | null>(null)
  const engine = engineById(engineId)

  // A locked search owns the text: it is a term for that site, not a query to
  // be matched against everything.
  const results = useMemo<Result[]>(
    () => (locked ? [] : search(items, query, { engineUrl: engine.url })),
    [items, query, locked, engine.url],
  )

  // Keep the highlight on the best match as the query changes under it.
  useEffect(() => setCursor(0), [query, locked])

  const open = (result: Result, newTab: boolean) => {
    // A folder is stepped into rather than opened, which also clears the query
    // so its contents are what you see next.
    if (result.kind === 'item' && result.item.folder) {
      setQuery('')
      onActivate(result.item)
      return
    }
    const url = resultUrl(result)
    if (url) onNavigate(url, newTab)
  }

  /** Tab accepts the highlighted row: a search shortcut locks in so you can
   *  keep typing the term, anything else just opens. */
  const accept = (result: Result) => {
    if (result.kind === 'item' && (result.item.search || result.item.folder)) {
      setQuery('')
      onActivate(result.item)
      return true
    }
    return false
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const newTab = e.ctrlKey || e.metaKey

    if (e.key === 'Escape') {
      // Clear the text first; only once the box is empty does Esc walk back
      // out of the folder or search, which the global handler does.
      if (query) {
        e.preventDefault()
        e.stopPropagation()
        setQuery('')
      }
      return
    }

    if (locked) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmitLocked(newTab)
      }
      return
    }

    if (!results.length) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setCursor((c) => (c + delta + results.length) % results.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      open(results[cursor], newTab)
      return
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      // Only swallow Tab when it actually did something, so it still moves
      // focus normally on a plain result.
      if (accept(results[cursor])) e.preventDefault()
    }
  }

  const toggleVoice = () => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
      SpeechRecognition?: new () => SpeechRecognitionLike
    }
    const Ctor = w.webkitSpeechRecognition ?? w.SpeechRecognition
    if (!Ctor) return // gracefully no-op where unsupported
    if (listening) {
      recog.current?.onend?.()
      return
    }
    const r = new Ctor()
    r.lang = 'en-US'
    r.interimResults = false
    r.onresult = (ev) => setQuery(ev.results[0][0].transcript)
    r.onend = () => {
      setListening(false)
      recog.current = null
    }
    r.onerror = () => setListening(false)
    recog.current = r
    setListening(true)
    r.start()
  }

  const placeholder = locked
    ? `Search ${locked.name}…`
    : crumbs.length
      ? `Search in ${crumbs[crumbs.length - 1]}…`
      : 'Press a key, or type to search…'

  return (
    <div className={`command${results.length ? ' has-results' : ''}`}>
      <div className="command-input-row">
        {locked ? (
          <span className="command-lock">
            <SearchIcon size={15} />
            {locked.name}
          </span>
        ) : (
          <span className="engine-select" title={`Search with ${engine.name}`}>
            <img src={engine.favicon} alt="" />
            <select
              value={engineId}
              onChange={(e) => setEngineId(e.target.value)}
              aria-label="Fallback search engine"
            >
              {ENGINES.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.name}
                </option>
              ))}
            </select>
          </span>
        )}

        {/* Breadcrumb doubles as the way back out for people who'd rather
            click than press Esc. */}
        {crumbs.map((name, i) => (
          <button key={`${name}-${i}`} className="crumb" onClick={onReset} title="Back to the top">
            {name}
          </button>
        ))}

        <input
          ref={ref}
          // Tells the global key handler this box belongs to the launcher, so
          // Esc and Backspace still walk back out from inside it.
          data-keynav=""
          className="command-input"
          value={query}
          placeholder={placeholder}
          aria-label="Search your shortcuts or the web"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <button
          className={`icon-inline ${listening ? 'mic-active' : ''}`}
          onClick={toggleVoice}
          title="Voice search"
          aria-label="Voice search"
        >
          <MicIcon />
        </button>
      </div>

      {results.length > 0 && (
        <ul className="command-results" role="listbox">
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === cursor}>
              <button
                className={`command-result${i === cursor ? ' is-cursor' : ''}`}
                // Hovering moves the highlight so mouse and keyboard never
                // disagree about what Enter would open.
                onMouseMove={() => setCursor(i)}
                onClick={(e) => open(r, e.ctrlKey || e.metaKey)}
              >
                <ResultIcon result={r} iconStyle={iconStyle} engineName={engine.name} />
                <span className="command-result-text">
                  <span className="command-result-title">{resultTitle(r, engine.name)}</span>
                  <span className="command-result-sub">{resultSubtitle(r)}</span>
                </span>
                {r.kind === 'item' && r.path && <span className="key-badge">{r.path}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

function ResultIcon({
  result,
  iconStyle,
  engineName,
}: {
  result: Result
  iconStyle: IconStyle
  engineName: string
}) {
  if (result.kind === 'item') {
    if (result.item.folder) return <FolderIcon size={18} />
    return <ShortcutIcon url={result.item.url} name={result.item.name} style={iconStyle} />
  }
  if (result.kind === 'command') {
    return <ShortcutIcon url={result.item.url} name={result.item.name} style={iconStyle} />
  }
  if (result.kind === 'url') return <ShortcutIcon url={result.url} name={engineName} style={iconStyle} />
  return <SearchIcon size={18} />
}

function resultTitle(result: Result, engineName: string): string {
  switch (result.kind) {
    case 'item':
      return result.item.name
    case 'command':
      return result.term
    case 'url':
      return result.url.replace(/^https?:\/\//, '')
    case 'web':
      return `${result.query} — ${engineName}`
  }
}

function resultSubtitle(result: Result): string {
  switch (result.kind) {
    case 'item':
      // Show where it lives if it's nested, otherwise where it goes.
      return result.where.length
        ? result.where.join(' › ')
        : result.item.url.replace(/^https?:\/\/(www\.)?/, '')
    case 'command':
      return `Search ${result.item.name}`
    case 'url':
      return 'Open this address'
    case 'web':
      return 'Search the web'
  }
}
