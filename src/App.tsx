import { useEffect, useMemo, useState } from 'react'
import { Clock } from './components/Clock'
import { AnalogClock } from './components/AnalogClock'
import { Greeting } from './components/Greeting'
import { WeatherCard } from './components/WeatherCard'
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
import { paletteFromImage, PALETTE_TOKENS } from './lib/dynamicColor'

function signature(dataUrl: string, scheme: string): string {
  return `${scheme}:${dataUrl.length}:${dataUrl.slice(0, 48)}`
}

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

  // Recompute the palette when the wallpaper image OR the light/dark scheme
  // changes (the signature encodes both, so it's cached otherwise).
  useEffect(() => {
    if (!hasWallpaper) return
    const sig = signature(wallpaper.dataUrl, settings.colorScheme)
    if (wallpaper.sig === sig && wallpaper.palette) return
    let active = true
    paletteFromImage(wallpaper.dataUrl, settings.colorScheme)
      .then((palette) => {
        if (active) setWallpaper((w) => ({ ...w, palette, sig }))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [wallpaper.dataUrl, settings.colorScheme])

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
    if (hasWallpaper) {
      s.setProperty('--wp-image', `url(${wallpaper.dataUrl})`)
      s.setProperty('--wp-blur', `${settings.background.blur}px`)
      s.setProperty('--wp-dim', String(settings.background.dim / 100))
      s.setProperty('--wp-on', '1')
    } else {
      s.setProperty('--wp-on', '0')
      s.removeProperty('--wp-image')
    }
  }, [hasWallpaper, wallpaper.dataUrl, settings.background.blur, settings.background.dim, settings.background.fade])

  // Cache a synchronous snapshot for the boot script to apply on the next load.
  useEffect(() => {
    const boot = {
      useAuto,
      theme: settings.theme,
      vars: useAuto ? wallpaper.palette : null,
      dataUrl: wallpaper.dataUrl,
      blur: settings.background.blur,
      dim: settings.background.dim,
      fade: settings.background.fade,
    }
    try {
      localStorage.setItem('calmtab-boot', JSON.stringify(boot))
    } catch {
      /* localStorage may be full with a large wallpaper; non-fatal */
    }
  }, [
    useAuto,
    settings.theme,
    wallpaper.palette,
    wallpaper.dataUrl,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
  ])

  const openTodos = todos.filter((t) => !t.done).length
  const glass = settings.background.glass && hasWallpaper
  const close = () => setPanel('none')

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
        {settings.clockStyle === 'analog' ? <AnalogClock /> : <Clock hour12={settings.hour12} />}
        <Greeting name={settings.name} tagline={settings.tagline} />
      </div>

      <div className="right-col">
        {settings.show.weather && <WeatherCard city={settings.city} units={settings.units} />}
        {settings.show.search && <SearchBar />}
        {settings.show.quote && <QuoteCard />}
      </div>

      {settings.show.dock && <LinksDock links={links} />}

      <button
        className="corner-btn top-left"
        onClick={() => setPanel('todo')}
        data-label={openTodos ? `${openTodos} open task${openTodos > 1 ? 's' : ''}` : 'Tasks'}
        aria-label="Tasks"
      >
        <ListIcon />
      </button>

      <button
        className="corner-btn top-right-2"
        onClick={toggleAppearance}
        data-label={isLight ? 'Switch to dark' : 'Switch to light'}
        aria-label="Toggle light or dark mode"
      >
        {isLight ? <MoonIcon /> : <SunIcon />}
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

      {panel === 'ai' && <AiToolsMenu onClose={close} />}
      {panel === 'todo' && <TodoPanel todos={todos} setTodos={setTodos} onClose={close} />}
      {panel === 'apps' && <AppsDrawer onClose={close} />}
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
