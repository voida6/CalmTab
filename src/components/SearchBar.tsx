import { useRef, useState } from 'react'
import { MicIcon } from './Icons'

interface Engine {
  id: string
  name: string
  url: string
  favicon: string
}

const ENGINES: Engine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', favicon: 'https://www.google.com/favicon.ico' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', favicon: 'https://www.bing.com/favicon.ico' },
  { id: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', favicon: 'https://duckduckgo.com/favicon.ico' },
]

// Minimal typing for the (prefixed) Web Speech API.
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  start: () => void
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onend: () => void
  onerror: () => void
}

export function SearchBar() {
  const [engineId, setEngineId] = useState('google')
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const recogRef = useRef<SpeechRecognitionLike | null>(null)

  const engine = ENGINES.find((e) => e.id === engineId) ?? ENGINES[0]

  const submit = () => {
    const q = query.trim()
    if (!q) return
    window.location.href = engine.url + encodeURIComponent(q)
  }

  const toggleVoice = () => {
    const Ctor =
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition ??
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
    if (!Ctor) return // gracefully no-op where unsupported

    if (listening) {
      recogRef.current?.onend?.()
      return
    }
    const recog = new Ctor()
    recog.lang = 'en-US'
    recog.interimResults = false
    recog.onresult = (e) => setQuery(e.results[0][0].transcript)
    recog.onend = () => {
      setListening(false)
      recogRef.current = null
    }
    recog.onerror = () => setListening(false)
    recogRef.current = recog
    setListening(true)
    recog.start()
  }

  return (
    <div className="card search">
      <span className="engine-select">
        <img src={engine.favicon} alt={engine.name} />
        <select value={engineId} onChange={(e) => setEngineId(e.target.value)} aria-label="Search engine">
          {ENGINES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </span>
      <input
        className="search-input"
        placeholder="Search the web…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        autoFocus
      />
      <button
        className={`icon-inline ${listening ? 'mic-active' : ''}`}
        onClick={toggleVoice}
        title="Voice search"
        aria-label="Voice search"
      >
        <MicIcon />
      </button>
      <button className="open-btn" onClick={submit}>
        Open
      </button>
    </div>
  )
}
