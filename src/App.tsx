import { useEffect, useMemo, useState } from 'react'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { WeatherCard } from './components/WeatherCard'
import { SearchBar } from './components/SearchBar'
import { QuoteCard } from './components/QuoteCard'
import { LinksDock } from './components/LinksDock'
import { TodoPanel } from './components/TodoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { GearIcon, ListIcon, SparkleIcon } from './components/Icons'
import { useStoredState } from './hooks/useStoredState'
import {
  DEFAULT_LINKS,
  DEFAULT_SETTINGS,
  DEFAULT_WALLPAPER,
  type LinkItem,
  type Settings,
  type TodoItem,
  type WallpaperState,
} from './lib/types'
import { paletteFromImage, PALETTE_TOKENS } from './lib/dynamicColor'

function signature(dataUrl: string): string {
  return `${dataUrl.length}:${dataUrl.slice(0, 48)}`
}

export default function App() {
  const [storedSettings, setSettings] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [todos, setTodos] = useStoredState<TodoItem[]>('todos', [])
  const [links, setLinks] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [wallpaper, setWallpaper] = useStoredState<WallpaperState>('wallpaper', DEFAULT_WALLPAPER)
  const [panel, setPanel] = useState<'none' | 'todo' | 'settings'>('none')
  const [ready, setReady] = useState(false)

  // Trigger the fade-in on the second frame after mount, once the first render
  // has painted at opacity 0 — this makes the transition smooth instead of
  // stuttering against React's initial render and the background repaint.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  // Merge with defaults so settings saved before new fields existed don't crash.
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

  // Recompute the palette whenever the wallpaper image changes (cached via sig).
  useEffect(() => {
    if (!hasWallpaper) return
    if (wallpaper.sig === signature(wallpaper.dataUrl) && wallpaper.palette) return
    let active = true
    paletteFromImage(wallpaper.dataUrl)
      .then((palette) => {
        if (active) setWallpaper((w) => ({ ...w, palette, sig: signature(w.dataUrl) }))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [wallpaper.dataUrl])

  // Apply colors: inline CSS-var overrides for auto mode, else fall back to the
  // named theme (material.css keys off data-theme).
  useEffect(() => {
    const root = document.documentElement
    if (useAuto && wallpaper.palette) {
      for (const token of PALETTE_TOKENS) {
        root.style.setProperty(token, wallpaper.palette[token])
      }
    } else {
      for (const token of PALETTE_TOKENS) root.style.removeProperty(token)
      root.dataset.theme = settings.theme
    }
  }, [useAuto, wallpaper.palette, settings.theme])

  // Keep the background CSS variables in sync (boot.js set them for first paint;
  // the #bg-image / #bg-dim elements render from them). Background appears
  // instantly and correctly blurred — no fade gating needed here.
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

  return (
    <div className={`app ${glass ? 'glass' : ''} ${ready ? 'ready' : ''}`}>
      <div className="hero">
        <Clock />
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
        className="corner-btn bottom-left"
        data-label="AI assistant — soon"
        aria-label="AI assistant"
        onClick={() => alert('AI assistant is coming in a later update ✨')}
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

      {panel === 'todo' && <TodoPanel todos={todos} setTodos={setTodos} onClose={() => setPanel('none')} />}
      {panel === 'settings' && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          links={links}
          setLinks={setLinks}
          wallpaper={wallpaper}
          setWallpaper={setWallpaper}
          onClose={() => setPanel('none')}
        />
      )}
    </div>
  )
}
