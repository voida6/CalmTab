import { useEffect, useState } from 'react'
import { fetchWeather, fetchWeatherAt, toDisplayTemp, type Weather } from '../lib/weather'
import { getItem, setItem } from '../lib/storage'
import { WeatherIcon } from './WeatherIcon'
import { ChevronIcon } from './Icons'
import type { Units, WeatherSource } from '../lib/types'

const CACHE_KEY = 'weatherCache'
const TTL = 15 * 60 * 1000 // serve cached weather for 15 min before refetching
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GEO_LABEL = 'My location'

interface Props {
  city: string
  units: Units
  source: WeatherSource
  expanded: boolean // start with the detail open
}

interface WeatherCache {
  wx: Weather
  key: string // 'geo' or the lowercased city the data belongs to
}

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      maximumAge: 10 * 60 * 1000,
      timeout: 10_000,
    }),
  )
}

function hourLabel(iso: string): string {
  const h = new Date(iso).getHours()
  return `${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}`
}

// Smooth temperature sparkline for the next 24h.
function TempCurve({
  hours,
  t,
  unit,
}: {
  hours: { time: string; tempC: number }[]
  t: (c: number) => number
  unit: string
}) {
  const n = hours.length
  if (n < 2) return null
  const W = 288
  const H = 96
  const padX = 14
  const top = 16
  const bottom = 26
  const temps = hours.map((h) => h.tempC)
  let min = Math.min(...temps)
  let max = Math.max(...temps)
  if (max - min < 2) {
    max += 1
    min -= 1
  }
  const x = (i: number) => padX + (i * (W - padX * 2)) / (n - 1)
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (H - top - bottom)

  let d = `M ${x(0).toFixed(1)} ${y(temps[0]).toFixed(1)}`
  for (let i = 1; i < n; i++) {
    const ex = (x(i - 1) + x(i)) / 2
    const ey = (y(temps[i - 1]) + y(temps[i])) / 2
    d += ` Q ${x(i - 1).toFixed(1)} ${y(temps[i - 1]).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
  }
  d += ` L ${x(n - 1).toFixed(1)} ${y(temps[n - 1]).toFixed(1)}`
  const area = `${d} L ${x(n - 1).toFixed(1)} ${H - bottom + 10} L ${x(0).toFixed(1)} ${H - bottom + 10} Z`

  return (
    <svg className="wx-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Hourly temperature">
      <defs>
        <linearGradient id="wx-curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="wx-area" d={area} fill="url(#wx-curve-fill)" />
      <path className="wx-line" d={d} />
      {hours.map(
        (hh, i) =>
          i % 4 === 0 && (
            <g key={hh.time}>
              <circle cx={x(i)} cy={y(temps[i])} r="2.6" className="wx-dot" />
              <text x={x(i)} y={y(temps[i]) - 7} className="wx-tval">
                {t(temps[i])}
                {unit}
              </text>
              <text x={x(i)} y={H - 6} className="wx-tlab">
                {hourLabel(hh.time)}
              </text>
            </g>
          ),
      )}
    </svg>
  )
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WeatherCard({ city, units, source, expanded }: Props) {
  const [wx, setWx] = useState<Weather | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(expanded)
  const [view, setView] = useState<'hourly' | 'week'>('hourly')

  useEffect(() => setOpen(expanded), [expanded])

  useEffect(() => {
    let active = true
    const cacheKey = source === 'geo' ? 'geo' : city.toLowerCase()

    const refresh = async () => {
      // Legacy cache entries (pre-0.2) were a bare Weather object.
      const raw = await getItem<WeatherCache | Weather | null>(CACHE_KEY, null)
      const cached: WeatherCache | null =
        raw && 'wx' in raw ? raw : raw ? { wx: raw as Weather, key: (raw as Weather).city.toLowerCase() } : null
      const hit = cached && cached.key === cacheKey ? cached.wx : null
      if (hit && active) setWx(hit)
      // Fresh enough — skip the network entirely.
      if (hit && Date.now() - hit.fetchedAt < TTL) return

      let fresh: Weather | null = null
      if (source === 'geo') {
        const pos = await currentPosition()
        fresh = await fetchWeatherAt(pos.coords.latitude, pos.coords.longitude, GEO_LABEL)
      } else if (hit && hit.lat != null) {
        // Same city as last time — reuse its coordinates, skip geocoding.
        fresh = await fetchWeatherAt(hit.lat, hit.lon, hit.city)
      } else {
        fresh = await fetchWeather(city)
      }
      if (!active) return
      if (fresh) {
        setWx(fresh)
        setError(false)
        void setItem(CACHE_KEY, { wx: fresh, key: cacheKey } satisfies WeatherCache)
      } else {
        setError(true)
      }
    }

    refresh().catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [city, source])

  if (!wx) {
    return (
      <div className="card">
        <div className="muted">{error ? 'Weather unavailable' : 'Loading weather…'}</div>
      </div>
    )
  }

  const unit = units === 'imperial' ? '°F' : '°'
  const t = (c: number) => toDisplayTemp(c, units)
  const wind = units === 'imperial' ? `${Math.round(wx.windKmh * 0.621)} mph` : `${Math.round(wx.windKmh)} km/h`

  return (
    <div className={`card weather-card ${open ? 'open' : ''}`}>
      <div className="weather-top">
        <div className="weather-title">{wx.description}</div>
        <div className="weather-temp">
          <span className="wx-icon">
            <WeatherIcon code={wx.code} size={40} />
          </span>
          <span>
            {t(wx.tempC)}
            {unit}
          </span>
        </div>
      </div>
      <div className="weather-row">
        <span>Humidity</span>
        <div className="humidity-track">
          <div className="humidity-fill" style={{ width: `${wx.humidity}%` }} />
        </div>
        <span>{wx.humidity}%</span>
      </div>
      <div className="weather-meta">
        <span className="chip">
          {t(wx.minC)}
          {unit} / {t(wx.maxC)}
          {unit}
        </span>
        <span className="chip">{wx.city}</span>
        <button className="wx-toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Hide details' : 'Show details'}>
          {open ? 'Less' : 'More'} <ChevronIcon size={14} up={open} />
        </button>
      </div>

      <div className="weather-expand">
        <div className="weather-expand-inner">
          {wx.feelsLikeC != null && (
            <div className="wx-stats">
              <div>
                <span className="wx-k">Feels</span>
                <span className="wx-v">
                  {t(wx.feelsLikeC)}
                  {unit}
                </span>
              </div>
              <div>
                <span className="wx-k">Wind</span>
                <span className="wx-v">{wind}</span>
              </div>
              <div>
                <span className="wx-k">UV</span>
                <span className="wx-v">{Math.round(wx.uv ?? 0)}</span>
              </div>
              <div>
                <span className="wx-k">Sun</span>
                <span className="wx-v">
                  {wx.sunrise ? clock(wx.sunrise) : '—'} / {wx.sunset ? clock(wx.sunset) : '—'}
                </span>
              </div>
            </div>
          )}

          <div className="wx-seg">
            <button className={view === 'hourly' ? 'on' : ''} onClick={() => setView('hourly')}>
              Hourly
            </button>
            <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>
              7-day
            </button>
          </div>

          {view === 'hourly' && wx.hourly && wx.hourly.length > 1 && (
            <TempCurve hours={wx.hourly} t={t} unit={unit} />
          )}

          {view === 'week' && wx.forecast && wx.forecast.length > 0 && (
            <div className="wx-week">
              {wx.forecast.map((day, i) => (
                <div className="wx-wrow" key={day.date}>
                  <span className="wx-wday">{i === 0 ? 'Today' : WEEKDAY[new Date(day.date).getDay()]}</span>
                  <WeatherIcon code={day.code} size={22} />
                  <span className="wx-wtemp">
                    {t(day.maxC)}
                    {unit} <span className="muted">{t(day.minC)}{unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
