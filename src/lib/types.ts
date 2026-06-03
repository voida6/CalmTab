export type ThemeName = 'purple' | 'midnight' | 'teal' | 'peach' | 'mint' | 'lavender'
export type Units = 'metric' | 'imperial'
export type ClockStyle = 'digital' | 'minimal' | 'analog' | 'analogClassic' | 'word' | 'flip'
export type ColorScheme = 'dark' | 'light'
export type IconStyle = 'themed' | 'favicon'
export type CardShape = 'rounded' | 'squircle' | 'pill'

// Card corner radius per shape (applied to --radius-card).
export const CARD_RADIUS: Record<CardShape, string> = {
  rounded: '14px',
  squircle: '30px',
  pill: '999px',
}

// Smaller radius applied to buttons/icon tiles so the shape reads on small
// square elements (squircle stays distinct from a full circle).
export const BTN_RADIUS: Record<CardShape, string> = {
  rounded: '12px',
  squircle: '18px',
  pill: '999px',
}

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
  forecast: boolean // 3-day strip on the weather card
  focus: boolean
  timer: boolean // Pomodoro focus timer
  quickTimer: boolean // editable countdown timer
  habits: boolean
  ticker: boolean
  search: boolean
  quote: boolean
  dock: boolean
}

export interface FocusState {
  date: string // YYYY-MM-DD the focus belongs to
  text: string
  done: boolean
}

export const DEFAULT_FOCUS: FocusState = { date: '', text: '', done: false }

export interface HabitItem {
  id: string
  name: string
  history: string[] // YYYY-MM-DD dates completed
}

export type ColorMode = 'auto' | 'manual'

export interface BackgroundSettings {
  blur: number // px, 0-30
  dim: number // % darkening overlay, 0-80
  glass: boolean // frosted-glass cards
  cardOpacity: number // % surface opacity for glass cards, 30-100
  fade: number // content fade-in duration, ms (0 = instant)
}

export type AccentMode = 'auto' | 'custom'

export interface Settings {
  name: string
  theme: ThemeName
  colorMode: ColorMode
  colorScheme: ColorScheme // light/dark tones for auto-from-wallpaper
  accentMode: AccentMode // 'auto' = from wallpaper, 'custom' = chosen color
  accentColor: string // hex seed used when accentMode === 'custom'
  clockStyle: ClockStyle
  hour12: boolean
  iconStyle: IconStyle // shortcut icons: themed glyphs or full-color favicons
  cardShape: CardShape
  units: Units
  city: string
  tagline: string
  tickerSymbols: string[] // CoinGecko coin ids (e.g. bitcoin, ethereum)
  show: WidgetToggles
  background: BackgroundSettings
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'purple',
  colorMode: 'auto',
  colorScheme: 'dark',
  accentMode: 'auto',
  accentColor: '#7c6bdc',
  clockStyle: 'digital',
  hour12: false,
  iconStyle: 'themed',
  cardShape: 'squircle',
  units: 'metric',
  city: 'Melbourne',
  tagline: 'LOCK IN',
  tickerSymbols: ['bitcoin', 'ethereum'],
  show: {
    weather: true,
    forecast: false,
    focus: true,
    timer: false,
    quickTimer: false,
    habits: false,
    ticker: false,
    search: false,
    quote: false,
    dock: true,
  },
  background: { blur: 3, dim: 35, glass: true, cardOpacity: 70, fade: 300 },
}

// Wallpaper + its extracted palette live in their own storage key (the data URL
// can be large; keeping it out of `settings` avoids rewriting it on every tweak).
import type { Palette, Swatch } from './dynamicColor'

export interface WallpaperState {
  dataUrl: string
  palette: Palette | null
  sig: string // signature of (image + scheme + accent) the palette was built from
  luminance: number // brightness behind the hero region (0-255)
  swatches: Swatch[] // candidate accent colors (seed + preview) from the image
  seed: string // top extracted color (hex)
  analyzedFor: string // dataUrl the analysis (luminance/swatches/seed) was run on
}

export const DEFAULT_WALLPAPER: WallpaperState = {
  dataUrl: '',
  palette: null,
  sig: '',
  luminance: 128,
  swatches: [],
  seed: '',
  analyzedFor: '',
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
