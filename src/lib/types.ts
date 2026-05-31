export type ThemeName = 'purple' | 'midnight' | 'teal'
export type Units = 'metric' | 'imperial'

export interface LinkItem {
  id: string
  name: string
  url: string
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface WidgetToggles {
  weather: boolean
  search: boolean
  quote: boolean
  dock: boolean
}

export interface Settings {
  name: string
  theme: ThemeName
  units: Units
  city: string
  tagline: string
  show: WidgetToggles
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'purple',
  units: 'metric',
  city: 'Melbourne',
  tagline: 'LOCK IN',
  show: { weather: true, search: true, quote: true, dock: true },
}

export const DEFAULT_LINKS: LinkItem[] = [
  { id: 'yt', name: 'YouTube', url: 'https://youtube.com' },
  { id: 'li', name: 'LinkedIn', url: 'https://linkedin.com' },
  { id: 'fb', name: 'Facebook', url: 'https://facebook.com' },
  { id: 'rd', name: 'Reddit', url: 'https://reddit.com' },
  { id: 'az', name: 'Amazon', url: 'https://amazon.com' },
]

export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}
