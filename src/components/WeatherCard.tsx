import { useEffect, useState } from 'react'
import { fetchWeather, toDisplayTemp, type Weather } from '../lib/weather'
import { getItem, setItem } from '../lib/storage'
import { WeatherIcon } from './WeatherIcon'
import { ChevronIcon } from './Icons'
import type { Units } from '../lib/types'

const CACHE_KEY = 'weatherCache'
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  city: string
  units: Units
  expanded: boolean // start with the detail open
}

function hourLabel(iso: string): string {
  const h = new Date(iso).getHours()
  return `${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}`
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WeatherCard({ city, units, expanded }: Props) {
  const [wx, setWx] = useState<Weather | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(expanded)
  const [view, setView] = useState<'hourly' | 'week'>('hourly')

  useEffect(() => setOpen(expanded), [expanded])

  useEffect(() => {
    let active = true
    getItem<Weather | null>(CACHE_KEY, null).then((cached) => {
      if (active && cached && cached.city.toLowerCase() === city.toLowerCase()) setWx(cached)
    })
    fetchWeather(city)
      .then((fresh) => {
        if (!active) return
        if (fresh) {
          setWx(fresh)
          setError(false)
          void setItem(CACHE_KEY, fresh)
        } else {
          setError(true)
        }
      })
      .catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [city])

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

          {view === 'hourly' && wx.hourly && wx.hourly.length > 0 && (
            <div className="wx-hourly">
              {wx.hourly.map((h) => (
                <div className="wx-hour" key={h.time}>
                  <span className="wx-hour-t">{hourLabel(h.time)}</span>
                  <WeatherIcon code={h.code} size={22} />
                  <span className="wx-hour-temp">
                    {t(h.tempC)}
                    {unit}
                  </span>
                </div>
              ))}
            </div>
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
