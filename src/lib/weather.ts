// Weather via Open-Meteo (no API key). Two calls: geocode a city name to
// coordinates, then fetch the current conditions + today's min/max.

export interface DayForecast {
  date: string // ISO date
  code: number
  minC: number
  maxC: number
}

export interface HourForecast {
  time: string // ISO datetime
  code: number
  tempC: number
}

export interface Weather {
  city: string
  lat: number // kept so refreshes can skip the geocoding call
  lon: number
  tempC: number
  minC: number
  maxC: number
  humidity: number
  code: number
  description: string
  feelsLikeC: number
  windKmh: number
  uv: number
  sunrise: string // ISO
  sunset: string // ISO
  forecast: DayForecast[] // 7 days
  hourly: HourForecast[] // next ~24h
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
  return fetchWeatherAt(place.latitude, place.longitude, place.name)
}

// Fetch by coordinates directly (geolocation mode, or a cached geocode).
export async function fetchWeatherAt(lat: number, lon: number, label: string): Promise<Weather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
    `&longitude=${lon}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
    '&hourly=temperature_2m,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max' +
    '&forecast_days=7&timezone=auto'
  const res = await fetch(url)
  if (!res.ok) return null
  const d = (await res.json()) as {
    current: {
      temperature_2m: number
      relative_humidity_2m: number
      apparent_temperature: number
      weather_code: number
      wind_speed_10m: number
    }
    hourly: { time: string[]; temperature_2m: number[]; weather_code: number[] }
    daily: {
      time: string[]
      weather_code: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      sunrise: string[]
      sunset: string[]
      uv_index_max: number[]
    }
  }
  const { label: codeLabel } = describeCode(d.current.weather_code)

  // 7-day outlook (today + next 6).
  const forecast: DayForecast[] = d.daily.time.slice(0, 7).map((date, i) => ({
    date,
    code: d.daily.weather_code[i],
    maxC: d.daily.temperature_2m_max[i],
    minC: d.daily.temperature_2m_min[i],
  }))

  // Next ~24 hours starting from the current hour.
  const now = Date.now()
  let start = d.hourly.time.findIndex((t) => new Date(t).getTime() >= now - 3_600_000)
  if (start < 0) start = 0
  const hourly: HourForecast[] = d.hourly.time.slice(start, start + 24).map((time, i) => ({
    time,
    code: d.hourly.weather_code[start + i],
    tempC: d.hourly.temperature_2m[start + i],
  }))

  return {
    city: label,
    lat,
    lon,
    tempC: d.current.temperature_2m,
    humidity: d.current.relative_humidity_2m,
    feelsLikeC: d.current.apparent_temperature,
    windKmh: d.current.wind_speed_10m,
    uv: d.daily.uv_index_max[0],
    sunrise: d.daily.sunrise[0],
    sunset: d.daily.sunset[0],
    code: d.current.weather_code,
    description: codeLabel,
    maxC: d.daily.temperature_2m_max[0],
    minC: d.daily.temperature_2m_min[0],
    forecast,
    hourly,
    fetchedAt: Date.now(),
  }
}

export function toDisplayTemp(c: number, units: 'metric' | 'imperial'): number {
  return units === 'imperial' ? Math.round((c * 9) / 5 + 32) : Math.round(c)
}
