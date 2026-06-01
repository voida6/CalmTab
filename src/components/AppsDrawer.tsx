import { APPS } from '../data/apps'
import type { IconStyle } from '../lib/types'
import { ShortcutIcon } from './ShortcutIcon'
import { XIcon } from './Icons'

export function AppsDrawer({ iconStyle, onClose }: { iconStyle: IconStyle; onClose: () => void }) {
  return (
    <>
      <div className="scrim transparent" onClick={onClose} />
      <aside className="panel anchor-tr">
        <div className="row between">
          <h2>Apps</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>
        <div className="apps-grid">
          {APPS.map((a) => (
            <a key={a.name} href={a.url} className="app-tile" title={a.name}>
              <span className="app-glyph">
                <ShortcutIcon url={a.url} name={a.name} style={iconStyle} />
              </span>
              <span className="app-name">{a.name}</span>
            </a>
          ))}
        </div>
      </aside>
    </>
  )
}
