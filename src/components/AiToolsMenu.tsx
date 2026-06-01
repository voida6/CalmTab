import { AI_TOOLS } from '../data/aiTools'
import { brandGlyph } from '../data/brandIcons'

export function AiToolsMenu({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="scrim transparent" onClick={onClose} />
      <div className="ai-menu" role="menu">
        <div className="ai-menu-title">AI Tools</div>
        {AI_TOOLS.map((t) => {
          const path = brandGlyph(t.url)
          return (
            <a key={t.name} href={t.url} className="ai-item" role="menuitem">
              <span className="ai-glyph">
                {path ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={path} fill="currentColor" />
                  </svg>
                ) : (
                  <span className="monogram">{t.name[0]}</span>
                )}
              </span>
              <span>{t.name}</span>
            </a>
          )
        })}
      </div>
    </>
  )
}
