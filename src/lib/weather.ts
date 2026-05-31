// Weather via Open-Meteo (no API key). Two calls: geocode a city name to
// coordinates, then fetch the current conditions + today's min/max.

export interface Weather {
  city: string
  tempC: number
  minC: number
  maxC: number
  humidity: number
  code: number
  description: string
  fetchedAt: number
}

interface GeocodeResult {
  latitude: number
  longitude: number
  name: string
}

// WMO weather interpretation codes -> label + emoji.
const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌦️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy Snow', icon: '❄️' },
  80: { label: 'Showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Violent Showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm', icon: '⛈️' },
}

export function describeCode(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: 'Unknown', icon: '🌡️' }
}

async function geocode(city: string): Promise<GeocodeResult | null> {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' +
    encodeURIComponent(city)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { results?: GeocodeResult[] }
  return data.results?.[0] ?? null
}

export async function fetchWeather(city: string): Promise<Weather | null> {
  const place = await geocode(city)
  if (!place) return null
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    '&current=temperature_2m,relative_humidity_2m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min&timezone=auto'
  const res = await fetch(url)
  if (!res.ok) return null
  const d = (await res.json()) as {
    current: { temperature_2m: number; relative_humidity_2m: number; weather_code: number }
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[] }
  }
  const { label } = describeCode(d.current.weather_code)
  return {
    city: place.name,
    tempC: d.current.temperature_2m,
    humidity: d.current.relative_humidity_2m,
    code: d.current.weather_code,
    description: label,
    maxC: d.daily.temperature_2m_max[0],
    minC: d.daily.temperature_2m_min[0],
    fetchedAt: Date.now(),
  }
}

export function toDisplayTemp(c: number, units: 'metric' | 'imperial'): number {
  return units === 'imperial' ? Math.round((c * 9) / 5 + 32) : Math.round(c)
}
