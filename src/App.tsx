import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from './components/Clock'
import { AnalogClock } from './components/AnalogClock'
import { WordClock } from './components/WordClock'
import { FlipClock } from './components/FlipClock'
import { TerminalClock } from './components/TerminalClock'
import { BinaryClock } from './components/BinaryClock'
import { RomanClock } from './components/RomanClock'
import { ProgressClock } from './components/ProgressClock'
import { SegmentClock } from './components/SegmentClock'
import { DotMatrixClock } from './components/DotMatrixClock'
import { StackClock } from './components/StackClock'
import { Greeting } from './components/Greeting'
import { PinnedTasks } from './components/PinnedTasks'
import { WeatherCard } from './components/WeatherCard'
import { FocusWidget } from './components/FocusWidget'
import { TimerWidget } from './components/TimerWidget'
import { HabitsWidget } from './components/HabitsWidget'
import { QuickTimerWidget } from './components/QuickTimerWidget'
import { TickerWidget } from './components/TickerWidget'
import { QuoteCard } from './components/QuoteCard'
import { LinksDock } from './components/LinksDock'
import { CommandBar } from './components/CommandBar'
import { useKeyNav } from './hooks/useKeyNav'
import { TodoPanel } from './components/TodoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { AiToolsMenu } from './components/AiToolsMenu'
import { AppsDrawer } from './components/AppsDrawer'
import { GearIcon, GridIcon, ListIcon, MoonIcon, SparkleIcon, SunIcon } from './components/Icons'
import { useStoredState } from './hooks/useStoredState'
import {
  BTN_RADIUS,
  CARD_RADIUS,
  DEFAULT_LINKS,
  DEFAULT_SETTINGS,
  DEFAULT_WALLPAPER,
  DEFAULT_WIDGET_ORDER,
  LIGHT_THEMES,
  THEME_PAIR,
  type LauncherFocus,
  type LinkItem,
  type Settings,
  type TodoItem,
  type WallpaperState,
} from './lib/types'
import { analyzeImage, paletteFromHex, PALETTE_TOKENS } from './lib/dynamicColor'
import { thumbFromDataUrl, wallpaperTint } from './lib/image'
import { getItem } from './lib/storage'
import { NotesWidget } from './components/NotesWidget'
import { CalendarWidget } from './components/CalendarWidget'
import { WorldClocksWidget } from './components/WorldClocksWidget'
import { ConverterWidget } from './components/ConverterWidget'

type Panel = 'none' | 'todo' | 'settings' | 'apps' | 'ai'

export default function App() {
  const [storedSettings, setSettings, settingsHydrated] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [todos, setTodos] = useStoredState<TodoItem[]>('todos', [])
  const [links, setLinks] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [wallpaper, setWallpaper, wallpaperHydrated] = useStoredState<WallpaperState>('wallpaper', DEFAULT_WALLPAPER)
  const [widgetOrder, setWidgetOrder] = useStoredState<string[]>('widgetOrder', DEFAULT_WIDGET_ORDER)
  const [panel, setPanel] = useState<Panel>('none')
  const [ready, setReady] = useState(false)
  const [idle, setIdle] = useState(false)
  const [dragOver, setDragOver] = useState(-1)
  // One box, two jobs: a query to search with, or the term for a locked-in
  // search shortcut. They never apply at the same time, so one state serves.
  const [query, setQuery] = useState('')
  const [engineId, setEngineId] = useStoredState<string>('searchEngine', 'google')
  const dragSrc = useRef(-1)
  const commandInput = useRef<HTMLInputElement>(null)
  const appRef = useRef<HTMLDivElement>(null)

  // Focus has to be decided on the very first render — by the time
  // chrome.storage resolves, the caret has already gone somewhere. The boot
  // cache is synchronous, so it answers in time; a first-ever run falls back
  // to the default.
  const [initialFocus] = useState<LauncherFocus>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('calmtab-boot') || 'null')
      return cached?.launcherFocus ?? DEFAULT_SETTINGS.launcherFocus
    } catch {
      return DEFAULT_SETTINGS.launcherFocus
    }
  })

  // Storage is async, so the first renders hold DEFAULT_SETTINGS /
  // DEFAULT_WALLPAPER — i.e. the purple theme and no wallpaper. Anything that
  // writes CSS variables must wait for the real values, otherwise it undoes
  // what boot.js painted and the page flashes the defaults until storage
  // answers (very visible when the machine is throttled).
  const hydrated = settingsHydrated && wallpaperHydrated

  // Hold the fade-in until the real settings are in: the wallpaper boot.js
  // painted is already on screen, so waiting shows a finished page instead of
  // one that restyles itself (glass vs plain, scale, theme) mid-fade.
  useEffect(() => {
    if (!hydrated) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [hydrated])

  // Safety net: storage can fail outright (IndexedDB is unavailable in some
  // profiles), and an invisible page is a worse failure than a restyle.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 800)
    return () => window.clearTimeout(t)
  }, [])

  // `browser` leaves the address bar alone on purpose. `page` tries to claim
  // the keyboard so a single key jumps straight away.
  useEffect(() => {
    if (initialFocus === 'page') appRef.current?.focus({ preventScroll: true })
  }, [initialFocus])

  // `search` starts with the input's own autoFocus, but on a new tab the
  // browser parks the caret in the address bar and does so *after* the page's
  // first render on a slow (power-saving) machine, so autoFocus alone loses the
  // race. Keep asking for the caret for a short while, and stop the moment
  // anything else on the page has it — the user clicking elsewhere wins.
  useEffect(() => {
    if (initialFocus !== 'search') return
    let tries = 0
    const id = setInterval(() => {
      const el = commandInput.current
      const active = document.activeElement
      const idle = !active || active === document.body || active === document.documentElement
      if (!el || active === el || !idle || ++tries > 20) {
        clearInterval(id)
        return
      }
      el.focus({ preventScroll: true })
    }, 50)
    return () => clearInterval(id)
  }, [initialFocus])

  const settings = useMemo<Settings>(() => {
    const merged: Settings = {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      show: { ...DEFAULT_SETTINGS.show, ...storedSettings.show },
      background: { ...DEFAULT_SETTINGS.background, ...storedSettings.background },
    }
    // `minimal: boolean` became `chrome: 'full' | 'minimal' | 'bare'`. Anyone
    // who had it switched on keeps the mode they chose.
    const legacyMinimal = (storedSettings as { minimal?: boolean }).minimal
    if (legacyMinimal && storedSettings.chrome === undefined) merged.chrome = 'minimal'
    return merged
  }, [storedSettings])

  // The keyboard launcher. Declared early so its key listener is registered
  // before the app's own single-letter shortcuts below, letting a bound key
  // win over them (they check `defaultPrevented`).
  const keynav = useKeyNav({
    items: links,
    // An open panel owns the keyboard; jumping out from under a settings
    // field the user is filling in would be hostile.
    enabled: settings.keyNav && panel === 'none',
    term: query,
    setTerm: setQuery,
    onFallthrough: useCallback(
      (key: string) => {
        // An unbound key isn't nothing — it's the start of a search. `/` just
        // opens the box; anything else seeds it with what was typed.
        commandInput.current?.focus()
        if (key !== '/') setQuery((q) => q + key)
      },
      [setQuery],
    ),
  })

  const hasWallpaper = !!wallpaper.dataUrl

  // Animated wallpapers: load the stored media Blob and expose an object URL.
  const [mediaUrl, setMediaUrl] = useState('')
  useEffect(() => {
    if (wallpaper.kind === 'image' || !wallpaper.mediaId) {
      setMediaUrl('')
      return
    }
    let active = true
    let url = ''
    getItem<Blob | null>('wallpaperMedia', null).then((blob) => {
      if (!active || !blob) return
      url = URL.createObjectURL(blob)
      setMediaUrl(url)
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
      setMediaUrl('')
    }
  }, [wallpaper.kind, wallpaper.mediaId])
  const useAuto = settings.colorMode === 'auto' && hasWallpaper && !!wallpaper.palette
  const accentSeed = settings.accentMode === 'custom' ? settings.accentColor : wallpaper.seed

  // 1) Analyze a new wallpaper once: brightness (for text contrast) + candidate
  // accent colors. Clears the palette so it rebuilds from the fresh analysis.
  useEffect(() => {
    if (!hasWallpaper) return
    // Re-analyze if not yet done, or if the stored swatches are in an older
    // format (objects expected) — guards against a crash after the schema change.
    const swatchesValid = (wallpaper.swatches || []).every((s) => s && typeof s === 'object' && 'seed' in s)
    if (wallpaper.analyzedFor === wallpaper.dataUrl && swatchesValid) return
    let active = true
    analyzeImage(wallpaper.dataUrl)
      .then((a) => {
        if (!active) return
        setWallpaper((w) => ({
          ...w,
          luminance: a.luminance,
          swatches: a.swatches,
          seed: a.seed,
          analyzedFor: w.dataUrl,
          palette: null,
          sig: '',
        }))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [wallpaper.dataUrl])

  // 1b) Keep a tiny thumbnail alongside the wallpaper. boot.js paints it
  // (blurred) on the very first frame; the full image would overflow the
  // localStorage boot cache. Also covers wallpapers saved by older versions.
  useEffect(() => {
    if (!hasWallpaper || wallpaper.thumb) return
    let active = true
    thumbFromDataUrl(wallpaper.dataUrl)
      .then((thumb) => {
        if (active) setWallpaper((w) => (w.dataUrl === wallpaper.dataUrl ? { ...w, thumb } : w))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [hasWallpaper, wallpaper.dataUrl, wallpaper.thumb])

  // 1c) The wallpaper boiled down to a colour and a gradient, for the *next*
  // load's boot snapshot — cheap enough to redo each time rather than store.
  // Seeded from the current snapshot so it is known on the first render, not
  // one async hop later; the theme background must never get a turn.
  const [tint, setTint] = useState<{ bg: string; grad: string }>(() => {
    try {
      const b = JSON.parse(localStorage.getItem('calmtab-boot') || 'null')
      return { bg: b?.bg || '', grad: b?.bgGrad || '' }
    } catch {
      return { bg: '', grad: '' }
    }
  })
  useEffect(() => {
    if (!hydrated) return // the default wallpaper is empty; don't drop the seed
    if (!wallpaper.thumb) {
      setTint({ bg: '', grad: '' })
      return
    }
    let active = true
    wallpaperTint(wallpaper.thumb)
      .then((t) => active && setTint(t))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [hydrated, wallpaper.thumb])

  // 2) Build the palette from the chosen seed (image's or a custom color) for the
  // current light/dark scheme. Cached via a signature of those inputs.
  useEffect(() => {
    if (!hasWallpaper) return
    if (settings.accentMode === 'auto' && !wallpaper.seed) return // wait for analysis
    const seed = accentSeed || '#7c6bdc'
    const sig = `${settings.colorScheme}:${settings.accentMode}:${seed}:${settings.paletteStyle}`
    if (wallpaper.sig === sig && wallpaper.palette) return
    let active = true
    paletteFromHex(seed, settings.colorScheme, settings.paletteStyle)
      .then((palette) => {
        if (active) setWallpaper((w) => ({ ...w, palette, sig }))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [hasWallpaper, accentSeed, wallpaper.seed, settings.colorScheme, settings.accentMode, settings.paletteStyle])

  // Hero text contrast: pick light/dark text for clock/greeting based on how
  // bright the wallpaper is behind them (accounting for the dim overlay).
  useEffect(() => {
    if (!hydrated) return
    const s = document.documentElement.style
    if (hasWallpaper) {
      const effLum = (wallpaper.luminance ?? 128) * (1 - (settings.background.dim / 100) * 0.9)
      const light = effLum < 140
      s.setProperty('--on-bg', light ? '#f3f3f6' : '#17181c')
      s.setProperty('--on-bg-shadow', light ? '0 2px 14px rgba(0,0,0,0.55)' : '0 1px 10px rgba(255,255,255,0.5)')
    } else {
      s.removeProperty('--on-bg')
      s.removeProperty('--on-bg-shadow')
    }
  }, [hydrated, hasWallpaper, wallpaper.luminance, settings.background.dim])

  // Size controls, as plain multipliers. `--ui-scale` drives a `zoom` on the
  // app shell; `--clock-scale` multiplies the clock's own font size on top.
  useEffect(() => {
    if (!hydrated) return
    const s = document.documentElement.style
    s.setProperty('--ui-scale', String(settings.uiScale / 100))
    s.setProperty('--clock-scale', String(settings.clockScale / 100))
  }, [hydrated, settings.uiScale, settings.clockScale])

  // Card corner shape -> --radius-card (cards) and --radius-btn (buttons/tiles).
  useEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--radius-card', CARD_RADIUS[settings.cardShape])
    s.setProperty('--radius-btn', BTN_RADIUS[settings.cardShape])
  }, [settings.cardShape])

  // Apply colors: inline CSS-var overrides for auto mode, else named theme.
  useEffect(() => {
    if (!hydrated) return
    const root = document.documentElement
    if (useAuto && wallpaper.palette) {
      for (const token of PALETTE_TOKENS) root.style.setProperty(token, wallpaper.palette[token])
    } else {
      for (const token of PALETTE_TOKENS) root.style.removeProperty(token)
      root.dataset.theme = settings.theme
    }
    // Whatever the theme says, the page background behind a wallpaper should be
    // the wallpaper's own colour: it is what shows through in the moments the
    // image layer has nothing to paint (a swap, a decode), and the theme colour
    // showing there is the flash.
    if (hasWallpaper && tint.bg) {
      root.style.setProperty('--bg', tint.bg)
      root.style.setProperty('--bg-grad', tint.grad || 'none')
    } else {
      root.style.removeProperty('--bg-grad')
    }
  }, [hydrated, useAuto, wallpaper.palette, settings.theme, hasWallpaper, tint])

  // GIFs animate straight from CSS background-image; videos keep the still
  // frame here as a backdrop while the <video> element loads on top.
  const bgSrc = hasWallpaper ? (wallpaper.kind === 'gif' && mediaUrl ? mediaUrl : wallpaper.dataUrl) : ''

  // Don't hand the full wallpaper to CSS until it has decoded. Assigning an
  // undecoded background-image leaves that layer with nothing to paint for as
  // long as the decode takes — a full-size photo is tens of milliseconds at
  // best — and what shows through the hole is the page background. That gap,
  // between boot.js's thumbnail and the real image, is the flash. Until it is
  // ready the thumbnail boot.js painted stays up, blur and all.
  const [decodedSrc, setDecodedSrc] = useState('')
  useEffect(() => {
    if (!hydrated || !bgSrc) return
    let active = true
    const done = () => {
      if (active) setDecodedSrc(bgSrc)
    }
    const img = new Image()
    img.src = bgSrc
    if (img.decode) img.decode().then(done, done)
    else if (img.complete) done()
    else img.onload = img.onerror = done
    return () => {
      active = false
    }
  }, [hydrated, bgSrc])

  // Keep the background CSS variables in sync (boot.js set them for first paint).
  useEffect(() => {
    if (!hydrated) return
    const s = document.documentElement.style
    s.setProperty('--fade', `${settings.background.fade}ms`)
    s.setProperty('--card-opacity', `${settings.background.cardOpacity}%`)
    if (!hasWallpaper) {
      s.setProperty('--wp-on', '0')
      s.removeProperty('--wp-image')
      return
    }
    s.setProperty('--wp-dim', String(settings.background.dim / 100))
    s.setProperty('--wp-on', '1')
    // Still on boot.js's thumbnail: leave its (deliberately heavier) blur alone,
    // or the upscaling it hides becomes visible.
    if (decodedSrc !== bgSrc) return
    s.setProperty('--wp-image', `url(${bgSrc})`)
    s.setProperty('--wp-blur', `${settings.background.blur}px`)
    // With no blur the layer must be full size or it would visibly pixelate.
    // With any blur, quarter size costs a sixteenth of the pixels and looks
    // the same, because the output is blurred either way.
    s.setProperty('--wp-shrink', settings.background.blur > 0 ? '4' : '1')
  }, [
    hydrated,
    hasWallpaper,
    bgSrc,
    decodedSrc,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
    settings.background.cardOpacity,
  ])

  // Cache a synchronous snapshot for the boot script to apply on the next load.
  useEffect(() => {
    // Never cache the defaults: that would hand the next load the very flash
    // this snapshot exists to prevent.
    if (!hydrated) return
    const effLum = (wallpaper.luminance ?? 128) * (1 - (settings.background.dim / 100) * 0.9)
    const lightText = effLum < 140
    const boot = {
      useAuto,
      theme: settings.theme,
      vars: useAuto ? wallpaper.palette : null,
      // Tiny thumbnail, not the full image: keeps the boot cache well under
      // the localStorage quota no matter the wallpaper size.
      dataUrl: wallpaper.thumb,
      isThumb: true,
      // Painted as the page background before anything decodes, so the first
      // frame is the wallpaper's own colour rather than the theme's (which is
      // what produced the purple flash on a slow first paint).
      bg: hasWallpaper ? tint.bg : null,
      bgGrad: hasWallpaper ? tint.grad : null,
      blur: settings.background.blur,
      dim: settings.background.dim,
      fade: settings.background.fade,
      cardOpacity: settings.background.cardOpacity,
      // Cached so the first painted frame is already at the chosen size,
      // rather than snapping once React mounts.
      uiScale: settings.uiScale,
      clockScale: settings.clockScale,
      // Not used by boot.js — read by App on the next load to decide where
      // the caret goes before storage has resolved.
      launcherFocus: settings.launcherFocus,
      onBg: hasWallpaper ? (lightText ? '#f3f3f6' : '#17181c') : null,
      onBgShadow: hasWallpaper
        ? lightText
          ? '0 2px 14px rgba(0,0,0,0.55)'
          : '0 1px 10px rgba(255,255,255,0.5)'
        : null,
    }
    try {
      localStorage.setItem('calmtab-boot', JSON.stringify(boot))
    } catch {
      /* localStorage may be full with a large wallpaper; non-fatal */
    }
  }, [
    hydrated,
    useAuto,
    hasWallpaper,
    settings.theme,
    wallpaper.palette,
    wallpaper.thumb,
    wallpaper.luminance,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
    settings.background.cardOpacity,
    settings.uiScale,
    settings.clockScale,
    settings.launcherFocus,
    tint,
  ])

  // Widgets added in newer versions won't be in a stored order — append them.
  const fullWidgetOrder = useMemo(
    () => [...widgetOrder, ...DEFAULT_WIDGET_ORDER.filter((k) => !widgetOrder.includes(k))],
    [widgetOrder],
  )

  // Bare mode shows nothing until you ask for it. Moving the mouse or touching
  // the keyboard reveals the launcher; it fades out again a few seconds later.
  // Typing is excluded from the timeout — a query on screen keeps it up.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    if (settings.chrome !== 'bare') {
      setRevealed(false)
      return
    }
    let hide = 0
    const wake = () => {
      setRevealed(true)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setRevealed(false), 2600)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const
    for (const e of events) window.addEventListener(e, wake, { passive: true })
    return () => {
      window.clearTimeout(hide)
      for (const e of events) window.removeEventListener(e, wake)
    }
  }, [settings.chrome])

  // Anything typed keeps the page up regardless of the timer above.
  useEffect(() => {
    if (query) setRevealed(true)
  }, [query])

  // Ambient screensaver: after 1 min without input, dim everything but the
  // hero (clock + greeting), which drifts slowly. Any input wakes it.
  useEffect(() => {
    if (!settings.ambient) {
      setIdle(false)
      return
    }
    let t = 0
    const arm = () => {
      setIdle(false)
      window.clearTimeout(t)
      t = window.setTimeout(() => setIdle(true), 60_000)
    }
    const evs = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const
    for (const e of evs) window.addEventListener(e, arm, { passive: true })
    arm()
    return () => {
      window.clearTimeout(t)
      for (const e of evs) window.removeEventListener(e, arm)
    }
  }, [settings.ambient])

  const openTodos = todos.filter((t) => !t.done).length
  const glass = settings.background.glass && hasWallpaper
  const close = () => setPanel('none')

  const minimal = settings.chrome !== 'full'
  const bare = settings.chrome === 'bare'
  // Checked against the toggles rather than by rendering, so the rail can be
  // left out of the DOM entirely and the main column centres on the page.
  const hasWidgets =
    !minimal &&
    fullWidgetOrder.some((key) => !!settings.show[key as keyof typeof settings.show])
  // The shortcut grid steps aside while results are on screen, so the two
  // never compete for the same patch of the page.
  const showGrid = !minimal && settings.show.dock && !query.trim()

  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours()
      const s = document.documentElement.style
      if (h >= 5 && h < 8) {
        s.setProperty('--tod-color', '#ff9a45')
        s.setProperty('--tod-opacity', String(0.06 + (7 - h) * 0.015))
      } else if (h >= 17 && h < 20) {
        s.setProperty('--tod-color', '#ff5e35')
        s.setProperty('--tod-opacity', String(0.04 + (h - 17) * 0.02))
      } else if (h < 5 || h >= 20) {
        s.setProperty('--tod-color', '#1a2d50')
        s.setProperty('--tod-opacity', '0.07')
      } else {
        s.setProperty('--tod-opacity', '0')
      }
    }
    apply()
    const id = setInterval(apply, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      const tag = (document.activeElement as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'Escape') { setPanel('none'); return }
      if (meta && e.key === 'k') { e.preventDefault(); setPanel((p) => (p === 'ai' ? 'none' : 'ai')); return }
      if (meta && e.key === ',') { e.preventDefault(); setPanel((p) => (p === 'settings' ? 'none' : 'settings')); return }
      // `t` focuses the timer — but only if the launcher hasn't already
      // claimed the keystroke for a shortcut bound to `t`.
      if (e.key === 't' && !meta && !e.altKey && !typing && !e.defaultPrevented) {
        window.dispatchEvent(new Event('calmtab:focus-timer'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const renderClock = () => {
    switch (settings.clockStyle) {
      case 'analog':
        return <AnalogClock face="flower" />
      case 'analogClassic':
        return <AnalogClock face="circle" />
      case 'word':
        return <WordClock />
      case 'flip':
        return <FlipClock hour12={settings.hour12} />
      case 'terminal':
        return <TerminalClock hour12={settings.hour12} />
      case 'binary':
        return <BinaryClock hour12={settings.hour12} />
      case 'roman':
        return <RomanClock hour12={settings.hour12} />
      case 'progress':
        return <ProgressClock hour12={settings.hour12} />
      case 'segment':
        return <SegmentClock hour12={settings.hour12} showSeconds />
      case 'dotmatrix':
        return <DotMatrixClock hour12={settings.hour12} />
      case 'stack':
        return <StackClock hour12={settings.hour12} />
      case 'minimal':
        return <Clock hour12={settings.hour12} showSeconds={false} />
      default:
        return <Clock hour12={settings.hour12} showSeconds />
    }
  }

  const renderWidget = (key: string) => {
    switch (key) {
      case 'weather': return settings.show.weather ? <WeatherCard city={settings.city} units={settings.units} source={settings.weatherSource} expanded={settings.show.forecast} /> : null
      case 'focus':   return settings.show.focus   ? <FocusWidget /> : null
      case 'timer':   return settings.show.timer   ? <TimerWidget /> : null
      case 'habits':  return settings.show.habits  ? <HabitsWidget /> : null
      case 'quickTimer': return settings.show.quickTimer ? <QuickTimerWidget /> : null
      case 'ticker':  return settings.show.ticker  ? <TickerWidget symbols={settings.tickerSymbols} /> : null
      case 'quote':   return settings.show.quote   ? <QuoteCard /> : null
      case 'notes':   return settings.show.notes   ? <NotesWidget /> : null
      case 'calendar': return settings.show.calendar ? <CalendarWidget /> : null
      case 'world':   return settings.show.world   ? <WorldClocksWidget zones={settings.worldZones} hour12={settings.hour12} /> : null
      case 'converter': return settings.show.converter ? <ConverterWidget /> : null
      default: return null
    }
  }

  // Light/dark quick toggle. With a wallpaper in auto mode it flips the palette
  // tones; otherwise it swaps the manual theme to its paired light/dark variant.
  const effectiveAuto = settings.colorMode === 'auto' && hasWallpaper
  const isLight = effectiveAuto ? settings.colorScheme === 'light' : LIGHT_THEMES.includes(settings.theme)
  const toggleAppearance = () => {
    if (effectiveAuto) {
      setSettings((s) => ({ ...s, colorScheme: s.colorScheme === 'light' ? 'dark' : 'light' }))
    } else {
      setSettings((s) => ({ ...s, theme: THEME_PAIR[s.theme] }))
    }
  }

  return (
    <div
      ref={appRef}
      className={`app ${glass ? 'glass' : ''} ${ready ? 'ready' : ''} ${isLight ? 'light' : ''} ${settings.compactWidgets ? 'compact' : ''} ${minimal ? 'minimal' : ''} ${bare ? 'bare' : ''} ${revealed ? 'revealed' : ''} ${settings.reduceEffects ? 'plain' : ''} ${idle && panel === 'none' ? 'ambient' : ''}`}
      // Focus target for `page` mode, so keys reach the launcher rather than
      // the address bar. Whether the browser allows this on a new tab is up to
      // the browser — Firefox and Zen usually keep the address bar.
      tabIndex={-1}
    >
      {/* The launcher is the point of the page now, so it sits in the middle
          column with the clock above it and the shortcuts below. Widgets moved
          to their own rail on the right. */}
      <div className="main-col">
        {/* Bare mode shows nothing at all — not even the clock — until you
            move the mouse or start typing. */}
        {!bare && (
          <div className="hero">
            {renderClock()}
            <Greeting name={settings.name} tagline={settings.tagline} />
            {!minimal && settings.show.pinnedTasks && (
              <PinnedTasks todos={todos} setTodos={setTodos} />
            )}
          </div>
        )}

        <CommandBar
          ref={commandInput}
          items={links}
          iconStyle={settings.iconStyle}
          engineId={engineId}
          setEngineId={setEngineId}
          query={query}
          setQuery={setQuery}
          crumbs={keynav.crumbs}
          locked={keynav.locked}
          onSubmitLocked={(newTab) => keynav.submit(newTab)}
          onActivate={keynav.activate}
          onNavigate={(url, newTab) => {
            if (newTab) window.open(url, '_blank', 'noopener')
            else window.location.href = url
          }}
          onReset={() => {
            keynav.reset()
            setQuery('')
          }}
          autoFocus={initialFocus === 'search'}
        />

        {/* Typing replaces the grid with results, so the two never compete
            for the same patch of screen. */}
        {showGrid && (
          <LinksDock
            links={keynav.visible}
            iconStyle={settings.iconStyle}
            showKeys={settings.keyNav && settings.keyHints}
            onActivate={keynav.activate}
            layout="grid"
          />
        )}
      </div>

      {hasWidgets && (
      <div className="right-col">
        {fullWidgetOrder.map((key, i) => {
          const content = renderWidget(key)
          if (!content) return null
          return (
            <div
              key={key}
              className={`widget-slot${dragOver === i ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => { dragSrc.current = i }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver(-1)}
              onDrop={() => {
                if (dragSrc.current !== i) {
                  // Reorder the merged list (stored order may lack newer widgets).
                  const next = [...fullWidgetOrder]
                  const [moved] = next.splice(dragSrc.current, 1)
                  next.splice(i, 0, moved)
                  setWidgetOrder(() => next)
                }
                setDragOver(-1)
              }}
              onDragEnd={() => setDragOver(-1)}
            >
              {content}
            </div>
          )
        })}
      </div>
      )}

      {!minimal && (
        <>
          <button
            className="corner-btn top-left"
            onClick={() => setPanel('todo')}
            data-label={openTodos ? `${openTodos} open task${openTodos > 1 ? 's' : ''}` : 'Tasks'}
            aria-label="Tasks"
          >
            <ListIcon />
          </button>

          <button
            className={`appearance-switch ${isLight ? 'is-light' : 'is-dark'}`}
            onClick={toggleAppearance}
            data-label={isLight ? 'Switch to dark' : 'Switch to light'}
            aria-label="Toggle light or dark mode"
            role="switch"
            aria-checked={isLight}
          >
            <span className="end-icon left">
              <SunIcon size={13} />
            </span>
            <span className="end-icon right">
              <MoonIcon size={13} />
            </span>
            <span className="appearance-knob">{isLight ? <SunIcon size={14} /> : <MoonIcon size={14} />}</span>
          </button>

          <button
            className="corner-btn top-right"
            onClick={() => setPanel('apps')}
            data-label="Apps"
            aria-label="Apps"
          >
            <GridIcon />
          </button>

          <button
            className="corner-btn bottom-left"
            data-label="AI Tools"
            aria-label="AI Tools"
            onClick={() => setPanel(panel === 'ai' ? 'none' : 'ai')}
          >
            <SparkleIcon />
          </button>
        </>
      )}

      {/* Settings survives minimal mode, but fades out until the mouse moves —
          otherwise the only way back would be a keyboard shortcut nobody
          remembers, and the mode would be a trap. */}
      <button
        className={`corner-btn bottom-right${minimal ? ' peek' : ''}`}
        onClick={() => setPanel('settings')}
        data-label="Settings"
        aria-label="Settings"
      >
        <GearIcon />
      </button>

      {wallpaper.kind === 'video' && mediaUrl &&
        createPortal(
          <video className="bg-video" src={mediaUrl} autoPlay loop muted playsInline />,
          document.body,
        )}

      {panel === 'ai' && <AiToolsMenu iconStyle={settings.iconStyle} onClose={close} />}
      {panel === 'todo' && <TodoPanel todos={todos} setTodos={setTodos} onClose={close} />}
      {panel === 'apps' && <AppsDrawer iconStyle={settings.iconStyle} onClose={close} />}
      {panel === 'settings' && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          links={links}
          setLinks={setLinks}
          wallpaper={wallpaper}
          setWallpaper={setWallpaper}
          onClose={close}
        />
      )}
    </div>
  )
}
