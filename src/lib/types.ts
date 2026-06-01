export type ThemeName = 'purple' | 'midnight' | 'teal' | 'peach' | 'mint' | 'lavender'
export type Units = 'metric' | 'imperial'
export type ClockStyle = 'digital' | 'analog'
export type ColorScheme = 'dark' | 'light'

// Which manual themes are light (used to flip the color-scheme hint).
export const LIGHT_THEMES: ThemeName[] = ['peach', 'mint', 'lavender']

// Each theme's opposite-scheme counterpart, so a light/dark toggle can swap
// between paired palettes in manual mode.
export const THEME_PAIR: Record<ThemeName, ThemeName> = {
  purple: 'lavender',
  lavender: 'purple',
  teal: 'mint',
  mint: 'teal',
  midnight: 'peach',
  peach: 'midnight',
}

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

export type ColorMode = 'auto' | 'manual'

export interface BackgroundSettings {
  blur: number // px, 0-30
  dim: number // % darkening overlay, 0-80
  glass: boolean // frosted-glass cards
  fade: number // content fade-in duration, ms (0 = instant)
}

export interface Settings {
  name: string
  theme: ThemeName
  colorMode: ColorMode
  colorScheme: ColorScheme // light/dark tones for auto-from-wallpaper
  clockStyle: ClockStyle
  hour12: boolean
  units: Units
  city: string
  tagline: string
  show: WidgetToggles
  background: BackgroundSettings
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'purple',
  colorMode: 'auto',
  colorScheme: 'dark',
  clockStyle: 'digital',
  hour12: false,
  units: 'metric',
  city: 'Melbourne',
  tagline: 'LOCK IN',
  show: { weather: true, search: true, quote: true, dock: true },
  background: { blur: 3, dim: 35, glass: true, fade: 300 },
}

// Wallpaper + its extracted palette live in their own storage key (the data URL
// can be large; keeping it out of `settings` avoids rewriting it on every tweak).
import type { Palette } from './dynamicColor'

export interface WallpaperState {
  dataUrl: string
  palette: Palette | null
  sig: string // signature of the image the palette was computed from
}

export const DEFAULT_WALLPAPER: WallpaperState = { dataUrl: '', palette: null, sig: '' }

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
