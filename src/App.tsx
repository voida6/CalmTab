import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from './components/Clock'
import { AnalogClock } from './components/AnalogClock'
import { WordClock } from './components/WordClock'
import { FlipClock } from './components/FlipClock'
import { Greeting } from './components/Greeting'
import { PinnedTasks } from './components/PinnedTasks'
import { WeatherCard } from './components/WeatherCard'
import { FocusWidget } from './components/FocusWidget'
import { TimerWidget } from './components/TimerWidget'
import { HabitsWidget } from './components/HabitsWidget'
import { QuickTimerWidget } from './components/QuickTimerWidget'
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
  DEFAULT_WIDGET_ORDER,
  LIGHT_THEMES,
  THEME_PAIR,
  type LinkItem,
  type Settings,
  type TodoItem,
  type WallpaperState,
} from './lib/types'
import { analyzeImage, paletteFromHex, PALETTE_TOKENS } from './lib/dynamicColor'
import { thumbFromDataUrl } from './lib/image'
import { getItem } from './lib/storage'
import { NotesWidget } from './components/NotesWidget'

type Panel = 'none' | 'todo' | 'settings' | 'apps' | 'ai'

export default function App() {
  const [storedSettings, setSettings] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [todos, setTodos] = useStoredState<TodoItem[]>('todos', [])
  const [links, setLinks] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [wallpaper, setWallpaper] = useStoredState<WallpaperState>('wallpaper', DEFAULT_WALLPAPER)
  const [widgetOrder, setWidgetOrder] = useStoredState<string[]>('widgetOrder', DEFAULT_WIDGET_ORDER)
  const [panel, setPanel] = useState<Panel>('none')
  const [ready, setReady] = useState(false)
  const [idle, setIdle] = useState(false)
  const [dragOver, setDragOver] = useState(-1)
  const dragSrc = useRef(-1)

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
      // GIFs animate straight from CSS background-image; videos keep the still
      // frame here as a backdrop while the <video> element loads on top.
      const bgSrc = wallpaper.kind === 'gif' && mediaUrl ? mediaUrl : wallpaper.dataUrl
      s.setProperty('--wp-image', `url(${bgSrc})`)
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
    wallpaper.kind,
    mediaUrl,
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
      // Tiny thumbnail, not the full image: keeps the boot cache well under
      // the localStorage quota no matter the wallpaper size.
      dataUrl: wallpaper.thumb,
      isThumb: true,
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
    wallpaper.thumb,
    wallpaper.luminance,
    settings.background.blur,
    settings.background.dim,
    settings.background.fade,
    settings.background.cardOpacity,
  ])

  // Widgets added in newer versions won't be in a stored order — append them.
  const fullWidgetOrder = useMemo(
    () => [...widgetOrder, ...DEFAULT_WIDGET_ORDER.filter((k) => !widgetOrder.includes(k))],
    [widgetOrder],
  )

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
      if (e.key === 't' && !meta && !e.altKey && !typing) {
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
      case 'search':  return settings.show.search  ? <SearchBar /> : null
      case 'quote':   return settings.show.quote   ? <QuoteCard /> : null
      case 'notes':   return settings.show.notes   ? <NotesWidget /> : null
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
    <div className={`app ${glass ? 'glass' : ''} ${ready ? 'ready' : ''} ${isLight ? 'light' : ''} ${settings.compactWidgets ? 'compact' : ''} ${idle && panel === 'none' ? 'ambient' : ''}`}>
      <div className="hero">
        {renderClock()}
        <Greeting name={settings.name} tagline={settings.tagline} />
        {settings.show.pinnedTasks && <PinnedTasks todos={todos} setTodos={setTodos} />}
      </div>

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
