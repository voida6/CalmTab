import { useEffect, useState } from 'react'
import { fetchWeather, describeCode, toDisplayTemp, type Weather } from '../lib/weather'
import { getItem, setItem } from '../lib/storage'
import type { Units } from '../lib/types'

const CACHE_KEY = 'weatherCache'

interface Props {
  city: string
  units: Units
}

export function WeatherCard({ city, units }: Props) {
  const [wx, setWx] = useState<Weather | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    // Show cached data instantly, then refresh in the background.
    getItem<Weather | null>(CACHE_KEY, null).then((cached) => {
      if (active && cached && cached.city.toLowerCase() === city.toLowerCase()) {
        setWx(cached)
      }
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

  const { icon } = describeCode(wx.code)
  const unit = units === 'imperial' ? '°F' : '°'

  return (
    <div className="card">
      <div className="weather-top">
        <div className="weather-title">{wx.description}</div>
        <div className="weather-temp">
          <span className="wx-icon">{icon}</span>
          <span>
            {toDisplayTemp(wx.tempC, units)}
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
          Min: {toDisplayTemp(wx.minC, units)}
          {unit} | Max: {toDisplayTemp(wx.maxC, units)}
          {unit}
        </span>
        <span className="chip">{wx.city}</span>
      </div>
    </div>
  )
}
