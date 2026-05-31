import { useState } from 'react'
import type { LinkItem, Settings, ThemeName, Units, WidgetToggles } from '../lib/types'
import { uid } from '../lib/types'
import { PlusIcon, XIcon } from './Icons'

interface Props {
  settings: Settings
  setSettings: (updater: (prev: Settings) => Settings) => void
  links: LinkItem[]
  setLinks: (updater: (prev: LinkItem[]) => LinkItem[]) => void
  onClose: () => void
}

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'purple', label: 'Dusk Purple' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'teal', label: 'Deep Teal' },
]

const WIDGETS: { key: keyof WidgetToggles; label: string }[] = [
  { key: 'weather', label: 'Weather' },
  { key: 'search', label: 'Search bar' },
  { key: 'quote', label: 'Daily quote' },
  { key: 'dock', label: 'Quick links' },
]

export function SettingsPanel({ settings, setSettings, links, setLinks, onClose }: Props) {
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const patch = (p: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...p }))
  const toggleWidget = (key: keyof WidgetToggles) =>
    setSettings((prev) => ({ ...prev, show: { ...prev.show, [key]: !prev.show[key] } }))

  const addLink = () => {
    const name = linkName.trim()
    let url = linkUrl.trim()
    if (!name || !url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    setLinks((prev) => [...prev, { id: uid(), name, url }])
    setLinkName('')
    setLinkUrl('')
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel right">
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
          <label>Theme</label>
          <select value={settings.theme} onChange={(e) => patch({ theme: e.target.value as ThemeName })}>
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>City (for weather)</label>
          <input value={settings.city} onChange={(e) => patch({ city: e.target.value })} />
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
