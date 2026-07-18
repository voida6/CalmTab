import { useRef, useState } from 'react'
import type {
  AccentMode,
  CardShape,
  ClockStyle,
  ColorMode,
  IconStyle,
  LinkItem,
  Settings,
  ThemeName,
  Units,
  WallpaperState,
  WeatherSource,
  WidgetToggles,
} from '../lib/types'
import { DEFAULT_WALLPAPER, uid } from '../lib/types'
import { fileToScaledDataUrl, fileFrameDataUrl, videoFrameDataUrl, gradientDataUrl } from '../lib/image'
import { clearAll, getItem, setItem } from '../lib/storage'
import type { PaletteStyle } from '../lib/dynamicColor'
import { GRADIENTS, presetCss } from '../data/gradients'
import { CityInput } from './CityInput'
import { Clock } from './Clock'
import { AnalogClock } from './AnalogClock'
import { WordClock } from './WordClock'
import { FlipClock } from './FlipClock'
import { PlusIcon, XIcon } from './Icons'

interface Props {
  settings: Settings
  setSettings: (updater: (prev: Settings) => Settings) => void
  links: LinkItem[]
  setLinks: (updater: (prev: LinkItem[]) => LinkItem[]) => void
  wallpaper: WallpaperState
  setWallpaper: (updater: (prev: WallpaperState) => WallpaperState) => void
  onClose: () => void
}

type Tab = 'style' | 'wall' | 'clock' | 'widgets' | 'links' | 'about'

const TABS: { id: Tab; label: string }[] = [
  { id: 'style', label: 'Style' },
  { id: 'wall', label: 'Wallpaper' },
  { id: 'clock', label: 'Clock' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'links', label: 'Links' },
  { id: 'about', label: 'More' },
]

const PALETTE_STYLES: { id: PaletteStyle; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'tonal', label: 'Tonal' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'expressive', label: 'Expressive' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'fidelity', label: 'Fidelity' },
  { id: 'mono', label: 'Mono' },
]

// Everything included in a backup file (wallpaper media excluded — too big).
const BACKUP_KEYS = ['settings', 'links', 'widgetOrder', 'todos', 'habits', 'notes', 'focus', 'searchEngine']

// Preview colors for the manual theme chips (bg + accent from material.css).
const THEMES: { id: ThemeName; label: string; bg: string; accent: string }[] = [
  { id: 'purple', label: 'Dusk Purple', bg: '#2a2433', accent: '#c8b6f0' },
  { id: 'midnight', label: 'Midnight', bg: '#1e2433', accent: '#9ec5f5' },
  { id: 'teal', label: 'Deep Teal', bg: '#16292b', accent: '#7ad6d9' },
  { id: 'peach', label: 'Peach', bg: '#fff1ea', accent: '#c2410c' },
  { id: 'mint', label: 'Mint', bg: '#eaf7f1', accent: '#0f7a5a' },
  { id: 'lavender', label: 'Lavender', bg: '#f3eefc', accent: '#6b3fb0' },
]

const CLOCKS: { id: ClockStyle; label: string }[] = [
  { id: 'digital', label: 'Digital' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'analog', label: 'Flower' },
  { id: 'analogClassic', label: 'Classic' },
  { id: 'word', label: 'Word' },
  { id: 'flip', label: 'Flip' },
]

// Scale factor per style so each live preview fits its chip.
const PREVIEW_SCALE: Record<ClockStyle, string> = {
  digital: '0.16',
  minimal: '0.2',
  analog: '0.3',
  analogClassic: '0.3',
  word: '0.34',
  flip: '0.2',
}

function clockPreview(style: ClockStyle, hour12: boolean) {
  switch (style) {
    case 'analog':
      return <AnalogClock face="flower" />
    case 'analogClassic':
      return <AnalogClock face="circle" />
    case 'word':
      return <WordClock />
    case 'flip':
      return <FlipClock hour12={hour12} />
    case 'minimal':
      return <Clock hour12={hour12} showSeconds={false} />
    default:
      return <Clock hour12={hour12} showSeconds />
  }
}

const SHAPES: { id: CardShape; label: string }[] = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'squircle', label: 'Squircle' },
  { id: 'pill', label: 'Pill' },
]

const WIDGETS: { key: keyof WidgetToggles; label: string }[] = [
  { key: 'weather', label: 'Weather' },
  { key: 'forecast', label: 'Weather details (start open)' },
  { key: 'pinnedTasks', label: 'Pin tasks under greeting' },
  { key: 'focus', label: 'Daily focus' },
  { key: 'timer', label: 'Pomodoro' },
  { key: 'quickTimer', label: 'Timer' },
  { key: 'habits', label: 'Habits' },
  { key: 'ticker', label: 'Crypto ticker' },
  { key: 'search', label: 'Search bar' },
  { key: 'quote', label: 'Daily quote' },
  { key: 'notes', label: 'Notes' },
  { key: 'dock', label: 'Quick links' },
]

const MAX_VIDEO_MB = 80
const MAX_GIF_MB = 30

export function SettingsPanel({ settings, setSettings, links, setLinks, wallpaper, setWallpaper, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('style')
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [importError, setImportError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...p }))
  const patchBg = (p: Partial<Settings['background']>) =>
    setSettings((prev) => ({ ...prev, background: { ...prev.background, ...p } }))
  const toggleWidget = (key: keyof WidgetToggles) =>
    setSettings((prev) => ({ ...prev, show: { ...prev.show, [key]: !prev.show[key] } }))

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`Video too large (max ${MAX_VIDEO_MB} MB)`)
        const frame = await videoFrameDataUrl(file)
        await setItem('wallpaperMedia', file)
        setWallpaper(() => ({ ...DEFAULT_WALLPAPER, kind: 'video', mediaId: uid(), dataUrl: frame }))
      } else if (file.type === 'image/gif') {
        if (file.size > MAX_GIF_MB * 1024 * 1024) throw new Error(`GIF too large (max ${MAX_GIF_MB} MB)`)
        const frame = await fileFrameDataUrl(file)
        await setItem('wallpaperMedia', file)
        setWallpaper(() => ({ ...DEFAULT_WALLPAPER, kind: 'gif', mediaId: uid(), dataUrl: frame }))
      } else {
        const dataUrl = await fileToScaledDataUrl(file)
        setWallpaper(() => ({ ...DEFAULT_WALLPAPER, dataUrl }))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not load that file')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const pickGradient = (stops: string[], angle: number) => {
    try {
      const dataUrl = gradientDataUrl(stops, angle)
      setWallpaper(() => ({ ...DEFAULT_WALLPAPER, dataUrl }))
    } catch {
      /* canvas unsupported — ignore */
    }
  }

  const removeWallpaper = () => {
    setWallpaper(() => ({ ...DEFAULT_WALLPAPER }))
    void setItem('wallpaperMedia', null)
  }

  const addLink = () => {
    const name = linkName.trim()
    let url = linkUrl.trim()
    if (!name || !url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    setLinks((prev) => [...prev, { id: uid(), name, url }])
    setLinkName('')
    setLinkUrl('')
  }

  const exportBackup = async () => {
    const data: Record<string, unknown> = { _calmtab: 1, exportedAt: new Date().toISOString() }
    for (const k of BACKUP_KEYS) {
      const v = await getItem<unknown>(k, null)
      if (v != null) data[k] = v
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `calmtab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>
      if (!data || typeof data !== 'object' || !('_calmtab' in data)) throw new Error('bad')
      for (const k of BACKUP_KEYS) {
        if (data[k] != null) await setItem(k, data[k])
      }
      location.reload()
    } catch {
      setImportError('That file is not a valid CalmTab backup.')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  const resetAll = async () => {
    if (!window.confirm('Reset CalmTab completely? This clears all settings, tasks, habits and the wallpaper.')) return
    await clearAll()
    location.reload()
  }

  const version =
    (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.().version) || 'dev'

  const hasWallpaper = !!wallpaper.dataUrl
  const auto = settings.colorMode === 'auto' && hasWallpaper

  return (
    <>
      <div className="scrim transparent" onClick={onClose} />
      <aside className="panel anchor-br settings-panel">
        <div className="row between">
          <h2>Settings</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="tab-bar" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab-btn ${tab === t.id ? 'on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================= STYLE ================= */}
        {tab === 'style' && (
          <>
            <div className="field">
              <label>Color source</label>
              <div className="seg-row">
                <button
                  className={`seg-btn ${settings.colorMode === 'auto' ? 'on' : ''}`}
                  onClick={() => patch({ colorMode: 'auto' as ColorMode })}
                >
                  From wallpaper
                </button>
                <button
                  className={`seg-btn ${settings.colorMode === 'manual' ? 'on' : ''}`}
                  onClick={() => patch({ colorMode: 'manual' as ColorMode })}
                >
                  Theme
                </button>
              </div>
              {settings.colorMode === 'auto' && !hasWallpaper && (
                <span className="muted">Add a wallpaper to generate colors — using the theme below until then.</span>
              )}
            </div>

            {auto && (
              <>
                <div className="row between" style={{ padding: '2px 0' }}>
                  <span>Light mode</span>
                  <button
                    className={`toggle ${settings.colorScheme === 'light' ? 'on' : ''}`}
                    onClick={() => patch({ colorScheme: settings.colorScheme === 'light' ? 'dark' : 'light' })}
                    aria-label="Toggle light mode"
                  />
                </div>
                <div className="field">
                  <label>Accent</label>
                  <div className="swatch-row">
                    <button
                      className={`swatch auto ${settings.accentMode === 'auto' ? 'active' : ''}`}
                      onClick={() => patch({ accentMode: 'auto' as AccentMode })}
                      title="Auto from wallpaper"
                      aria-label="Auto accent"
                    >
                      A
                    </button>
                    {(wallpaper.swatches || [])
                      .filter((sw) => sw && typeof sw === 'object' && sw.seed)
                      .map((sw) => (
                        <button
                          key={sw.seed}
                          className={`swatch ${
                            settings.accentMode === 'custom' &&
                            settings.accentColor.toLowerCase() === sw.seed.toLowerCase()
                              ? 'active'
                              : ''
                          }`}
                          style={{ background: sw.color }}
                          onClick={() => patch({ accentMode: 'custom' as AccentMode, accentColor: sw.seed })}
                          title={sw.color}
                          aria-label={`Accent ${sw.color}`}
                        />
                      ))}
                    <label className="swatch custom" title="Custom color">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => patch({ accentMode: 'custom' as AccentMode, accentColor: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
                <div className="field">
                  <label>Palette style</label>
                  <div className="seg-row wrap">
                    {PALETTE_STYLES.map((ps) => (
                      <button
                        key={ps.id}
                        className={`seg-btn small ${settings.paletteStyle === ps.id ? 'on' : ''}`}
                        onClick={() => patch({ paletteStyle: ps.id })}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                  <span className="muted">How boldly the wallpaper color is applied to surfaces.</span>
                </div>
              </>
            )}

            {(settings.colorMode === 'manual' || !hasWallpaper) && (
              <div className="field">
                <label>Theme</label>
                <div className="theme-grid">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={`theme-chip ${settings.theme === t.id ? 'active' : ''}`}
                      style={{ background: t.bg }}
                      onClick={() => patch({ theme: t.id })}
                      aria-label={t.label}
                      title={t.label}
                    >
                      <span className="theme-dot" style={{ background: t.accent }} />
                      <span className="theme-name" style={{ color: t.accent }}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>Card shape</label>
              <div className="seg-row">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    className={`seg-btn shape-${s.id} ${settings.cardShape === s.id ? 'on' : ''}`}
                    onClick={() => patch({ cardShape: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Shortcut icons</label>
              <div className="seg-row">
                <button
                  className={`seg-btn ${settings.iconStyle === 'themed' ? 'on' : ''}`}
                  onClick={() => patch({ iconStyle: 'themed' as IconStyle })}
                >
                  Themed
                </button>
                <button
                  className={`seg-btn ${settings.iconStyle === 'favicon' ? 'on' : ''}`}
                  onClick={() => patch({ iconStyle: 'favicon' as IconStyle })}
                >
                  Favicons
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= WALLPAPER ================= */}
        {tab === 'wall' && (
          <>
            <div className="field">
              <label>Wallpaper</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                hidden
                onChange={onPickFile}
              />
              {hasWallpaper && (
                <div className="wp-preview" style={{ backgroundImage: `url(${wallpaper.thumb || wallpaper.dataUrl})` }}>
                  {wallpaper.kind !== 'image' && <span className="wp-badge">{wallpaper.kind === 'video' ? 'Video' : 'GIF'}</span>}
                </div>
              )}
              <div className="row">
                <button className="btn-pill" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Loading…' : hasWallpaper ? 'Replace' : 'Upload image / GIF / video'}
                </button>
                {hasWallpaper && (
                  <button className="btn-ghost" onClick={removeWallpaper}>
                    Remove
                  </button>
                )}
              </div>
              {uploadError && <span className="field-error">{uploadError}</span>}
              <span className="muted">Images, GIFs, or muted looping videos (mp4/webm).</span>
            </div>

            <div className="field">
              <label>Gallery</label>
              <div className="gallery-grid">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    className="gallery-chip"
                    style={{ background: presetCss(g) }}
                    onClick={() => pickGradient(g.stops, g.angle)}
                    title={g.name}
                    aria-label={`Wallpaper ${g.name}`}
                  />
                ))}
              </div>
            </div>

            {hasWallpaper && (
              <>
                <div className="field">
                  <label>Blur — {settings.background.blur}px</label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={settings.background.blur}
                    onChange={(e) => patchBg({ blur: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label>Dim — {settings.background.dim}%</label>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={settings.background.dim}
                    onChange={(e) => patchBg({ dim: Number(e.target.value) })}
                  />
                </div>
                <div className="row between" style={{ padding: '2px 0' }}>
                  <span>Frosted-glass cards</span>
                  <button
                    className={`toggle ${settings.background.glass ? 'on' : ''}`}
                    onClick={() => patchBg({ glass: !settings.background.glass })}
                    aria-label="Toggle frosted glass"
                  />
                </div>
                {settings.background.glass && (
                  <div className="field">
                    <label>Card opacity — {settings.background.cardOpacity}%</label>
                    <input
                      type="range"
                      min={30}
                      max={100}
                      value={settings.background.cardOpacity}
                      onChange={(e) => patchBg({ cardOpacity: Number(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}

            <div className="field">
              <label>Fade-in — {settings.background.fade === 0 ? 'instant' : settings.background.fade + 'ms'}</label>
              <input
                type="range"
                min={0}
                max={1500}
                step={50}
                value={settings.background.fade}
                onChange={(e) => patchBg({ fade: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        {/* ================= CLOCK ================= */}
        {tab === 'clock' && (
          <>
            <div className="field">
              <label>Clock style</label>
              <div className="clock-grid">
                {CLOCKS.map((c) => (
                  <button
                    key={c.id}
                    className={`clock-chip ${settings.clockStyle === c.id ? 'active' : ''}`}
                    onClick={() => patch({ clockStyle: c.id })}
                    aria-label={c.label}
                  >
                    <span className="clock-prev" style={{ '--prev-scale': PREVIEW_SCALE[c.id] } as React.CSSProperties}>
                      {clockPreview(c.id, settings.hour12)}
                    </span>
                    <span className="clock-chip-name">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {['digital', 'minimal', 'flip'].includes(settings.clockStyle) && (
              <div className="row between" style={{ padding: '2px 0' }}>
                <span>12-hour (AM/PM)</span>
                <button
                  className={`toggle ${settings.hour12 ? 'on' : ''}`}
                  onClick={() => patch({ hour12: !settings.hour12 })}
                  aria-label="Toggle 12-hour clock"
                />
              </div>
            )}
            <div className="row between" style={{ padding: '2px 0' }}>
              <span>Ambient screensaver (1 min idle)</span>
              <button
                className={`toggle ${settings.ambient ? 'on' : ''}`}
                onClick={() => patch({ ambient: !settings.ambient })}
                aria-label="Toggle ambient screensaver"
              />
            </div>
            <div className="field">
              <label>Your name</label>
              <input value={settings.name} placeholder="(optional)" onChange={(e) => patch({ name: e.target.value })} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input value={settings.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
            </div>
          </>
        )}

        {/* ================= WIDGETS ================= */}
        {tab === 'widgets' && (
          <>
            <div className="row between" style={{ padding: '2px 0' }}>
              <span>Compact mode</span>
              <button
                className={`toggle ${settings.compactWidgets ? 'on' : ''}`}
                onClick={() => patch({ compactWidgets: !settings.compactWidgets })}
                aria-label="Toggle compact widgets"
              />
            </div>
            <div className="field">
              {WIDGETS.map((w) => (
                <div key={w.key} className="row between" style={{ padding: '5px 0' }}>
                  <span>{w.label}</span>
                  <button
                    className={`toggle ${settings.show[w.key] ? 'on' : ''}`}
                    onClick={() => toggleWidget(w.key)}
                    aria-label={`Toggle ${w.label}`}
                  />
                </div>
              ))}
            </div>

            {settings.show.weather && (
              <>
                <div className="field">
                  <label>Weather location</label>
                  <div className="seg-row">
                    <button
                      className={`seg-btn ${settings.weatherSource === 'city' ? 'on' : ''}`}
                      onClick={() => patch({ weatherSource: 'city' as WeatherSource })}
                    >
                      City
                    </button>
                    <button
                      className={`seg-btn ${settings.weatherSource === 'geo' ? 'on' : ''}`}
                      onClick={() => patch({ weatherSource: 'geo' as WeatherSource })}
                    >
                      My location
                    </button>
                  </div>
                </div>
                {settings.weatherSource === 'city' && (
                  <div className="field">
                    <label>City</label>
                    <CityInput value={settings.city} onChange={(city) => patch({ city })} />
                  </div>
                )}
                <div className="field">
                  <label>Units</label>
                  <div className="seg-row">
                    <button
                      className={`seg-btn ${settings.units === 'metric' ? 'on' : ''}`}
                      onClick={() => patch({ units: 'metric' as Units })}
                    >
                      °C
                    </button>
                    <button
                      className={`seg-btn ${settings.units === 'imperial' ? 'on' : ''}`}
                      onClick={() => patch({ units: 'imperial' as Units })}
                    >
                      °F
                    </button>
                  </div>
                </div>
              </>
            )}

            {settings.show.ticker && (
              <div className="field">
                <label>Crypto (CoinGecko ids, comma-separated)</label>
                <input
                  placeholder="bitcoin, ethereum, solana"
                  value={settings.tickerSymbols.join(', ')}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      tickerSymbols: e.target.value
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
            )}
          </>
        )}

        {/* ================= LINKS ================= */}
        {tab === 'links' && (
          <div className="field">
            <label>Quick links</label>
            <span className="muted">Give any link its own emoji or tint.</span>
            {links.map((l) => (
              <div key={l.id} className="row link-row">
                <input
                  className="link-icon-input"
                  maxLength={2}
                  placeholder="✦"
                  value={l.icon ?? ''}
                  title="Custom emoji/character"
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((x) => (x.id === l.id ? { ...x, icon: e.target.value || undefined } : x)),
                    )
                  }
                />
                <input
                  type="color"
                  className="link-color-input"
                  value={l.color ?? '#8b8b95'}
                  title="Custom tint"
                  onChange={(e) =>
                    setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, color: e.target.value } : x)))
                  }
                />
                <span className="link-name">{l.name}</span>
                {(l.color || l.icon) && (
                  <button
                    className="btn-ghost"
                    title="Reset custom style"
                    aria-label={`Reset style for ${l.name}`}
                    onClick={() =>
                      setLinks((prev) =>
                        prev.map((x) => (x.id === l.id ? { ...x, color: undefined, icon: undefined } : x)),
                      )
                    }
                  >
                    ↺
                  </button>
                )}
                <button
                  className="btn-ghost"
                  onClick={() => setLinks((prev) => prev.filter((x) => x.id !== l.id))}
                  aria-label={`Remove ${l.name}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder="Name" value={linkName} onChange={(e) => setLinkName(e.target.value)} style={{ flex: 1 }} />
              <input placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ flex: 1.4 }} />
              <button className="btn-pill" onClick={addLink} aria-label="Add link">
                <PlusIcon />
              </button>
            </div>
          </div>
        )}
        {/* ================= MORE / ABOUT ================= */}
        {tab === 'about' && (
          <>
            <div className="field">
              <label>Shortcuts</label>
              <div className="about-row"><span>AI tools</span><span><kbd>Ctrl</kbd> + <kbd>K</kbd></span></div>
              <div className="about-row"><span>Settings</span><span><kbd>Ctrl</kbd> + <kbd>,</kbd></span></div>
              <div className="about-row"><span>Focus timer</span><span><kbd>T</kbd></span></div>
              <div className="about-row"><span>Close panel</span><span><kbd>Esc</kbd></span></div>
            </div>

            <div className="field">
              <label>Backup</label>
              <input ref={importRef} type="file" accept="application/json" hidden onChange={importBackup} />
              <div className="row">
                <button className="btn-pill" onClick={exportBackup}>Export</button>
                <button className="btn-pill" onClick={() => importRef.current?.click()}>Import</button>
              </div>
              {importError && <span className="field-error">{importError}</span>}
              <span className="muted">Settings, links, tasks, habits and notes (wallpaper files not included).</span>
            </div>

            <div className="field">
              <label>Danger zone</label>
              <button className="btn-ghost danger" onClick={resetAll}>Reset everything…</button>
            </div>

            <div className="about-foot">
              <span className="muted">CalmTab v{version} — local-first, no tracking.</span>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
