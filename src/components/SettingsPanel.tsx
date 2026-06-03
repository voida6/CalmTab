import { useRef, useState } from 'react'
import type {
  AccentMode,
  CardShape,
  ClockStyle,
  ColorMode,
  ColorScheme,
  IconStyle,
  LinkItem,
  Settings,
  ThemeName,
  Units,
  WallpaperState,
  WidgetToggles,
} from '../lib/types'
import { DEFAULT_WALLPAPER, uid } from '../lib/types'
import { fileToScaledDataUrl } from '../lib/image'
import { CityInput } from './CityInput'
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

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'purple', label: 'Dusk Purple (dark)' },
  { id: 'midnight', label: 'Midnight (dark)' },
  { id: 'teal', label: 'Deep Teal (dark)' },
  { id: 'peach', label: 'Peach (light)' },
  { id: 'mint', label: 'Mint (light)' },
  { id: 'lavender', label: 'Lavender (light)' },
]

const WIDGETS: { key: keyof WidgetToggles; label: string }[] = [
  { key: 'weather', label: 'Weather' },
  { key: 'forecast', label: '3-day forecast' },
  { key: 'focus', label: 'Daily focus' },
  { key: 'timer', label: 'Pomodoro' },
  { key: 'quickTimer', label: 'Timer' },
  { key: 'habits', label: 'Habits' },
  { key: 'ticker', label: 'Crypto ticker' },
  { key: 'search', label: 'Search bar' },
  { key: 'quote', label: 'Daily quote' },
  { key: 'dock', label: 'Quick links' },
]

export function SettingsPanel({ settings, setSettings, links, setLinks, wallpaper, setWallpaper, onClose }: Props) {
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
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
    try {
      const dataUrl = await fileToScaledDataUrl(file)
      // Reset so the new image is re-analyzed and its palette rebuilt.
      setWallpaper(() => ({ ...DEFAULT_WALLPAPER, dataUrl }))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeWallpaper = () => setWallpaper(() => ({ ...DEFAULT_WALLPAPER }))

  const addLink = () => {
    const name = linkName.trim()
    let url = linkUrl.trim()
    if (!name || !url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    setLinks((prev) => [...prev, { id: uid(), name, url }])
    setLinkName('')
    setLinkUrl('')
  }

  const hasWallpaper = !!wallpaper.dataUrl

  return (
    <>
      <div className="scrim transparent" onClick={onClose} />
      <aside className="panel anchor-br">
        <div className="row between">
          <h2>Settings</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="field">
          <label>Your name</label>
          <input value={settings.name} placeholder="(optional)" onChange={(e) => patch({ name: e.target.value })} />
        </div>

        <div className="field">
          <label>Tagline</label>
          <input value={settings.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
        </div>

        <div className="field">
          <label>Clock</label>
          <select value={settings.clockStyle} onChange={(e) => patch({ clockStyle: e.target.value as ClockStyle })}>
            <option value="digital">Digital</option>
            <option value="minimal">Minimal (HH:MM)</option>
            <option value="analog">Analog (flower)</option>
            <option value="analogClassic">Analog (classic)</option>
            <option value="word">Word clock</option>
            <option value="flip">Flip clock</option>
          </select>
          {['digital', 'minimal', 'flip'].includes(settings.clockStyle) && (
            <div className="row between" style={{ padding: '8px 0 2px' }}>
              <span>12-hour (AM/PM)</span>
              <button
                className={`toggle ${settings.hour12 ? 'on' : ''}`}
                onClick={() => patch({ hour12: !settings.hour12 })}
                aria-label="Toggle 12-hour clock"
              />
            </div>
          )}
        </div>

        <div className="field">
          <label>Card shape</label>
          <select value={settings.cardShape} onChange={(e) => patch({ cardShape: e.target.value as CardShape })}>
            <option value="rounded">Rounded</option>
            <option value="squircle">Squircle</option>
            <option value="pill">Pill / Circle</option>
          </select>
        </div>

        <div className="field">
          <label>Shortcut icons</label>
          <select value={settings.iconStyle} onChange={(e) => patch({ iconStyle: e.target.value as IconStyle })}>
            <option value="themed">Themed (match palette)</option>
            <option value="favicon">Favicons (full color)</option>
          </select>
        </div>

        {/* ---------- Background ---------- */}
        <div className="field">
          <label>Background</label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
          <div className="row">
            <button className="btn-pill" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Loading…' : hasWallpaper ? 'Replace image' : 'Upload image'}
            </button>
            {hasWallpaper && (
              <button className="btn-ghost" onClick={removeWallpaper}>
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="field">
          <label>Fade-in speed — {settings.background.fade === 0 ? 'instant' : settings.background.fade + 'ms'}</label>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={settings.background.fade}
            onChange={(e) => patchBg({ fade: Number(e.target.value) })}
          />
        </div>

        {hasWallpaper && (
          <>
            <div className="field">
              <label>Background blur — {settings.background.blur}px</label>
              <input
                type="range"
                min={0}
                max={30}
                value={settings.background.blur}
                onChange={(e) => patchBg({ blur: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Dim overlay — {settings.background.dim}%</label>
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

        {/* ---------- Color ---------- */}
        <div className="field">
          <label>Color mode</label>
          <select value={settings.colorMode} onChange={(e) => patch({ colorMode: e.target.value as ColorMode })}>
            <option value="auto">Auto (from wallpaper)</option>
            <option value="manual">Manual theme</option>
          </select>
          {settings.colorMode === 'auto' && !hasWallpaper && (
            <span className="muted">Upload a wallpaper to generate colors. Using the manual theme until then.</span>
          )}
          {settings.colorMode === 'auto' && hasWallpaper && (
            <div className="row between" style={{ padding: '8px 0 2px' }}>
              <span>Light mode</span>
              <button
                className={`toggle ${settings.colorScheme === 'light' ? 'on' : ''}`}
                onClick={() =>
                  patch({ colorScheme: settings.colorScheme === 'light' ? 'dark' : ('light' as ColorScheme) })
                }
                aria-label="Toggle light mode"
              />
            </div>
          )}
        </div>

        {settings.colorMode === 'auto' && hasWallpaper && (
          <div className="field">
            <label>Accent color</label>
            <div className="swatch-row">
              <button
                className={`swatch auto ${settings.accentMode === 'auto' ? 'active' : ''}`}
                onClick={() => patch({ accentMode: 'auto' as AccentMode })}
                title="Auto from wallpaper"
                aria-label="Auto accent"
              >
                A
              </button>
              {(wallpaper.swatches || []).filter((sw) => sw && typeof sw === 'object' && sw.seed).map((sw) => (
                <button
                  key={sw.seed}
                  className={`swatch ${
                    settings.accentMode === 'custom' && settings.accentColor.toLowerCase() === sw.seed.toLowerCase()
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
        )}

        {(settings.colorMode === 'manual' || !hasWallpaper) && (
          <div className="field">
            <label>Theme</label>
            <select value={settings.theme} onChange={(e) => patch({ theme: e.target.value as ThemeName })}>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>City (for weather)</label>
          <CityInput value={settings.city} onChange={(city) => patch({ city })} />
        </div>

        <div className="field">
          <label>Units</label>
          <select value={settings.units} onChange={(e) => patch({ units: e.target.value as Units })}>
            <option value="metric">Celsius</option>
            <option value="imperial">Fahrenheit</option>
          </select>
        </div>

        <div className="field">
          <label>Widgets</label>
          {WIDGETS.map((w) => (
            <div key={w.key} className="row between" style={{ padding: '6px 0' }}>
              <span>{w.label}</span>
              <button
                className={`toggle ${settings.show[w.key] ? 'on' : ''}`}
                onClick={() => toggleWidget(w.key)}
                aria-label={`Toggle ${w.label}`}
              />
            </div>
          ))}
        </div>

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

        <div className="field">
          <label>Quick links</label>
          {links.map((l) => (
            <div key={l.id} className="row between" style={{ padding: '4px 0' }}>
              <span className="muted">{l.name}</span>
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
      </aside>
    </>
  )
}
