import { useEffect, useMemo, useState } from 'react'
import { Clock } from './components/Clock'
import { AnalogClock } from './components/AnalogClock'
import { WordClock } from './components/WordClock'
import { FlipClock } from './components/FlipClock'
import { Greeting } from './components/Greeting'
import { WeatherCard } from './components/WeatherCard'
import { FocusWidget } from './components/FocusWidget'
import { TimerWidget } from './components/TimerWidget'
import { HabitsWidget } from './components/HabitsWidget'
import { CountdownWidget } from './components/CountdownWidget'
import { TickerWidget } from './components/TickerWidget'
import { SearchBar } from './components/SearchBar'
import { QuoteCard } from './components/QuoteCard'
import { LinksDock } from './components/LinksDock'
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
  LIGHT_THEMES,
  THEME_PAIR,
  type LinkItem,
  type Settings,
  type TodoItem,
  type WallpaperState,
} from './lib/types'
import { analyzeImage, paletteFromHex, PALETTE_TOKENS } from './lib/dynamicColor'

type Panel = 'none' | 'todo' | 'settings' | 'apps' | 'ai'

export default function App() {
  const [storedSettings, setSettings] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [todos, setTodos] = useStoredState<TodoItem[]>('todos', [])
  const [links, setLinks] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [wallpaper, setWallpaper] = useStoredState<WallpaperState>('wallpaper', DEFAULT_WALLPAPER)
  const [panel, setPanel] = useState<Panel>('none')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  const settings = useMemo<Settings>(
    () => ({
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      show: { ...DEFAULT_SETTINGS.show, ...storedSettings.show },
      background: { ...DEFAULT_SETTINGS.background, ...storedSettings.background },
    }),
    [storedSettings],
  )

  const hasWallpaper = !!wallpaper.dataUrl
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

  // 2) Build the palette from the chosen seed (image's or a custom color) for the
  // current light/dark scheme. Cached via a signature of those inputs.
  useEffect(() => {
    if (!hasWallpaper) return
    if (settings.accentMode === 'auto' && !wallpaper.seed) return // wait for analysis
    const seed = accentSeed || '#7c6bdc'
    const sig = `${settings.colorScheme}:${settings.accentMode}:${seed}`
    if (wallpaper.sig === sig && wallpaper.palette) return
    let active = true
    paletteFromHex(seed, settings.colorScheme)
      .then((palette) => {
        if (active) setWallpaper((w) => ({ ...w, palette, sig }))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [hasWallpaper, accentSeed, wallpaper.seed, settings.colorScheme, settings.accentMode])

  // Hero text contrast: pick light/dark text for clock/greeting based on how
  // bright the wallpaper is behind them (accounting for the dim overlay).
  useEffect(() => {
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
  }, [hasWallpaper, wallpaper.luminance, settings.background.dim])

  // Card corner shape -> --radius-card (cards) and --radius-btn (buttons/tiles).
  useEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--radius-card', CARD_RADIUS[settings.cardShape])
    s.setProperty('--radius-btn', BTN_RADIUS[settings.cardShape])
  }, [settings.cardShape])

  // Apply colors: inline CSS-var overrides for auto mode, else named theme.
  useEffect(() => {
    const root = document.documentElement
    if (useAuto && wallpaper.palette) {
      for (const token of PALETTE_TOKENS) root.style.setProperty(token, wallpaper.palette[token])
    } else {
      for (const token of PALETTE_TOKENS) root.style.removeProperty(token)
      root.dataset.theme = settings.theme
    }
  }, [useAuto, wallpaper.palette, settings.theme])

  // Keep the background CSS variables in sync (boot.js set them for first paint).
  useEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--fade', `${settings.background.fade}ms`)
    s.setProperty('--card-opacity', `${settings.background.cardOpacity}%`)
    if (hasWallpaper) {
      s.setProperty('--wp-image', `url(${wallpaper.dataUrl})`)
      s.setProperty('--wp-blur', `${settings.background.blur}px`)
      s.setProperty('--wp-dim', String(settings.background.dim / 100))
      s.setProperty('--wp-on', '1')
    } else {
      s.setProperty('--wp-on', '0')
      s.removeProperty('--wp-image')
    }
  }, [
    hasWallpaper,
    wallpaper.dataUrl,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
    settings.background.cardOpacity,
  ])

  // Cache a synchronous snapshot for the boot script to apply on the next load.
  useEffect(() => {
    const effLum = (wallpaper.luminance ?? 128) * (1 - (settings.background.dim / 100) * 0.9)
    const lightText = effLum < 140
    const boot = {
      useAuto,
      theme: settings.theme,
      vars: useAuto ? wallpaper.palette : null,
      dataUrl: wallpaper.dataUrl,
      blur: settings.background.blur,
      dim: settings.background.dim,
      fade: settings.background.fade,
      cardOpacity: settings.background.cardOpacity,
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
    useAuto,
    hasWallpaper,
    settings.theme,
    wallpaper.palette,
    wallpaper.dataUrl,
    wallpaper.luminance,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
    settings.background.cardOpacity,
  ])

  const openTodos = todos.filter((t) => !t.done).length
  const glass = settings.background.glass && hasWallpaper
  const close = () => setPanel('none')

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
      case 'minimal':
        return <Clock hour12={settings.hour12} showSeconds={false} />
      default:
        return <Clock hour12={settings.hour12} showSeconds />
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
    <div className={`app ${glass ? 'glass' : ''} ${ready ? 'ready' : ''}`}>
      <div className="hero">
        {renderClock()}
        <Greeting name={settings.name} tagline={settings.tagline} />
      </div>

      <div className="right-col">
        {settings.show.weather && (
          <WeatherCard city={settings.city} units={settings.units} showForecast={settings.show.forecast} />
        )}
        {settings.show.focus && <FocusWidget />}
        {settings.show.timer && <TimerWidget />}
        {settings.show.habits && <HabitsWidget />}
        {settings.show.countdown && <CountdownWidget countdown={settings.countdown} />}
        {settings.show.ticker && <TickerWidget symbols={settings.tickerSymbols} />}
        {settings.show.search && <SearchBar />}
        {settings.show.quote && <QuoteCard />}
      </div>

      {settings.show.dock && <LinksDock links={links} iconStyle={settings.iconStyle} />}

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

      <button
        className="corner-btn bottom-right"
        onClick={() => setPanel('settings')}
        data-label="Settings"
        aria-label="Settings"
      >
        <GearIcon />
      </button>

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
