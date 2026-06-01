import { useEffect, useRef, useState } from 'react'

interface GeoResult {
  id: number
  name: string
  admin1?: string
  country?: string
}

interface Props {
  value: string
  onChange: (city: string) => void
}

// City field with type-ahead suggestions from Open-Meteo's geocoding API.
export function CityInput({ value, onChange }: Props) {
  const [text, setText] = useState(value)
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => setText(value), [value])

  const search = (q: string) => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          'https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' +
            encodeURIComponent(q),
        )
        const data = (await res.json()) as { results?: GeoResult[] }
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 280)
  }

  const pick = (r: GeoResult) => {
    onChange(r.name)
    setText(r.name)
    setResults([])
    setOpen(false)
  }

  return (
    <div className="city-input">
      <input
        value={text}
        placeholder="Start typing a city…"
        onChange={(e) => {
          setText(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => {
          // commit free-text and close (delay so a click registers first)
          setTimeout(() => setOpen(false), 150)
          if (text.trim() && text !== value) onChange(text.trim())
        }}
      />
      {open && results.length > 0 && (
        <div className="city-suggestions">
          {results.map((r) => (
            <button
              key={r.id}
              className="city-suggestion"
              onMouseDown={(e) => {
                e.preventDefault()
                pick(r)
              }}
            >
              <span>{r.name}</span>
              <span className="muted">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
