import { useEffect, useState } from 'react'
import { fetchWeather, toDisplayTemp, type Weather } from '../lib/weather'
import { getItem, setItem } from '../lib/storage'
import { WeatherIcon } from './WeatherIcon'
import type { Units } from '../lib/types'

const CACHE_KEY = 'weatherCache'

interface Props {
  city: string
  units: Units
  showForecast: boolean
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeatherCard({ city, units, showForecast }: Props) {
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

  const unit = units === 'imperial' ? '°F' : '°'

  return (
    <div className="card">
      <div className="weather-top">
        <div className="weather-title">{wx.description}</div>
        <div className="weather-temp">
          <span className="wx-icon">
            <WeatherIcon code={wx.code} size={40} />
          </span>
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
      {showForecast && wx.forecast && wx.forecast.length > 0 && (
        <div className="forecast-strip">
          {wx.forecast.map((day) => (
            <div className="forecast-day" key={day.date}>
              <span className="forecast-dow">{WEEKDAY[new Date(day.date).getDay()]}</span>
              <span className="forecast-ico">
                <WeatherIcon code={day.code} size={26} />
              </span>
              <span className="forecast-temps">
                {toDisplayTemp(day.maxC, units)}° <span className="muted">{toDisplayTemp(day.minC, units)}°</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
