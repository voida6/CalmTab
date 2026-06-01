import { APPS } from '../data/apps'
import { brandGlyph } from '../data/brandIcons'
import { XIcon } from './Icons'

export function AppsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel right">
        <div className="row between">
          <h2>Apps</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>
        <div className="apps-grid">
          {APPS.map((a) => {
            const path = brandGlyph(a.url)
            return (
              <a key={a.name} href={a.url} className="app-tile" title={a.name}>
                <span className="app-glyph">
                  {path ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={path} fill="currentColor" />
                    </svg>
                  ) : (
                    <span className="monogram">{a.name[0]}</span>
                  )}
                </span>
                <span className="app-name">{a.name}</span>
              </a>
            )
          })}
        </div>
      </aside>
    </>
  )
}
