import type { PaletteStyle } from './dynamicColor'
export type { PaletteStyle }

export type ThemeName = 'purple' | 'midnight' | 'teal' | 'peach' | 'mint' | 'lavender'
export type Units = 'metric' | 'imperial'
export type ClockStyle =
  | 'digital'
  | 'minimal'
  | 'analog'
  | 'analogClassic'
  | 'word'
  | 'flip'
  | 'terminal'
  | 'binary'
  | 'roman'
  | 'progress'
  | 'segment'
  | 'dotmatrix'
  | 'stack'

/** Where the keyboard goes when a new tab opens.
 *  - `browser`: leave the address bar focused, as a normal new tab does.
 *    Press Esc to hand the keys to CalmTab.
 *  - `page`: keys jump immediately; typing an unbound key starts a search.
 *  - `search`: the search box is focused, so typing always searches. */
export type LauncherFocus = 'browser' | 'page' | 'search'

/** How much of the interface is drawn.
 *  - `full`: everything you have switched on.
 *  - `minimal`: the clock and the launcher, nothing else.
 *  - `bare`: nothing at all. Typing or moving the mouse brings the launcher
 *    back, and it fades away again when you stop. */
export type ChromeLevel = 'full' | 'minimal' | 'bare'
export type ColorScheme = 'dark' | 'light'
export type IconStyle = 'themed' | 'favicon'
export type CardShape = 'rounded' | 'squircle' | 'pill'
export type WeatherSource = 'city' | 'geo'

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

// A dock entry. Every field past `url` is optional, so shortcuts saved by
// pre-0.6 versions stay valid as-is — an item with no `key` simply isn't
// reachable from the keyboard, and one with no `parentId` sits at the root.
export interface LinkItem {
  id: string
  name: string
  url: string // '' for folders, which are containers rather than destinations
  color?: string // custom tint for the dock icon
  icon?: string // custom emoji/character overriding the brand glyph

  // --- keyboard launcher (0.6+) ---
  key?: string // single character that jumps here; CASE-SENSITIVE, so
  // `m` and `M` are two different slots (62 per folder)
  parentId?: string // id of the folder this lives in; absent = root level
  folder?: boolean // true = a group of shortcuts rather than a destination
  search?: string // URL template with a %s placeholder; makes this item a
  // search shortcut that prompts for a term instead of opening
  hidden?: boolean // reachable by its key and by search, but never drawn as a
  // tile — for sites you want on a key without cluttering the page
}

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface WidgetToggles {
  weather: boolean
  forecast: boolean // start the weather details expanded
  pinnedTasks: boolean // show pending tasks under the greeting
  focus: boolean
  timer: boolean // Pomodoro focus timer
  quickTimer: boolean // editable countdown timer
  habits: boolean
  ticker: boolean
  /** @deprecated folded into the launcher bar in 0.6; kept so older stored
   *  settings still parse. */
  search: boolean
  quote: boolean
  notes: boolean
  calendar: boolean
  world: boolean
  converter: boolean
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
  paletteStyle: PaletteStyle // Material scheme personality for auto colors
  clockStyle: ClockStyle
  hour12: boolean
  iconStyle: IconStyle // shortcut icons: themed glyphs or full-color favicons
  cardShape: CardShape
  units: Units
  city: string
  weatherSource: WeatherSource // city name lookup or browser geolocation
  tagline: string
  tickerSymbols: string[] // CoinGecko coin ids (e.g. bitcoin, ethereum)
  worldZones: string[] // IANA time zone names for the world-clocks widget
  compactWidgets: boolean
  ambient: boolean // dim widgets into a screensaver after 1 min idle
  keyNav: boolean // single-key jumping on the new tab
  keyHints: boolean // draw the key badge on each shortcut tile
  launcherFocus: LauncherFocus
  chrome: ChromeLevel
  // Turns off backdrop blur on the remaining large surfaces. Backdrop blur is
  // the most expensive thing the page does; this is the escape hatch.
  reduceEffects: boolean
  // Percentages, applied as CSS variables. `uiScale` zooms the whole page;
  // `clockScale` sizes the clock on top of that, so the two compose.
  uiScale: number // 70-140
  clockScale: number // 50-180
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
  paletteStyle: 'calm',
  clockStyle: 'digital',
  hour12: false,
  iconStyle: 'themed',
  cardShape: 'squircle',
  units: 'metric',
  city: 'Melbourne',
  weatherSource: 'city',
  tagline: 'LOCK IN',
  tickerSymbols: ['bitcoin', 'ethereum'],
  worldZones: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
  compactWidgets: false,
  ambient: true,
  keyNav: true,
  keyHints: true,
  // Typing should land in CalmTab's own search box, not the address bar. A
  // bound key still jumps while that box is empty.
  launcherFocus: 'search',
  uiScale: 100,
  clockScale: 100,
  chrome: 'full',
  reduceEffects: false,
  show: {
    weather: true,
    forecast: false,
    pinnedTasks: false,
    focus: true,
    timer: false,
    quickTimer: false,
    habits: false,
    ticker: false,
    search: false,
    quote: false,
    notes: false,
    calendar: false,
    world: false,
    converter: false,
    dock: true,
  },
  background: { blur: 3, dim: 35, glass: true, cardOpacity: 70, fade: 300 },
}

// Wallpaper + its extracted palette live in their own storage key (the data URL
// can be large; keeping it out of `settings` avoids rewriting it on every tweak).
import type { Palette, Swatch } from './dynamicColor'

export type WallpaperKind = 'image' | 'gif' | 'video'

export interface WallpaperState {
  // Static wallpapers live entirely in `dataUrl`. Animated ones (gif/video)
  // keep their file as a Blob in IndexedDB ('wallpaperMedia'); `dataUrl` then
  // holds a captured still frame used for palette analysis, the boot-script
  // placeholder, and as a fallback while the media loads.
  kind: WallpaperKind
  mediaId: string // changes on every media upload so tabs know to reload
  dataUrl: string
  thumb: string // tiny data URL cached for the pre-paint boot script
  palette: Palette | null
  sig: string // signature of (image + scheme + accent) the palette was built from
  luminance: number // brightness behind the hero region (0-255)
  swatches: Swatch[] // candidate accent colors (seed + preview) from the image
  seed: string // top extracted color (hex)
  analyzedFor: string // dataUrl the analysis (luminance/swatches/seed) was run on
}

export const DEFAULT_WALLPAPER: WallpaperState = {
  kind: 'image',
  mediaId: '',
  dataUrl: '',
  thumb: '',
  palette: null,
  sig: '',
  luminance: 128,
  swatches: [],
  seed: '',
  analyzedFor: '',
}

export const DEFAULT_WIDGET_ORDER = [
  // `search` is deliberately absent: the standalone search widget was folded
  // into the launcher bar in 0.6. The toggle survives in WidgetToggles so
  // stored settings from older versions still parse.
  'weather', 'focus', 'timer', 'habits', 'quickTimer', 'ticker', 'quote', 'notes',
  'calendar', 'world', 'converter',
]

export const DEFAULT_LINKS: LinkItem[] = [
  { id: 'yt', name: 'YouTube', url: 'https://youtube.com', key: 'y' },
  { id: 'li', name: 'LinkedIn', url: 'https://linkedin.com', key: 'l' },
  { id: 'fb', name: 'Facebook', url: 'https://facebook.com', key: 'f' },
  { id: 'rd', name: 'Reddit', url: 'https://reddit.com', key: 'r' },
  { id: 'az', name: 'Amazon', url: 'https://amazon.com', key: 'a' },
]

export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}
