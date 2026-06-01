import { AI_TOOLS } from '../data/aiTools'
import type { IconStyle } from '../lib/types'
import { ShortcutIcon } from './ShortcutIcon'

export function AiToolsMenu({ iconStyle, onClose }: { iconStyle: IconStyle; onClose: () => void }) {
  return (
    <>
      <div className="scrim transparent" onClick={onClose} />
      <div className="ai-menu" role="menu">
        <div className="ai-menu-title">AI Tools</div>
        {AI_TOOLS.map((t) => (
          <a key={t.name} href={t.url} className="ai-item" role="menuitem">
            <span className="ai-glyph">
              <ShortcutIcon url={t.url} name={t.name} style={iconStyle} />
            </span>
            <span>{t.name}</span>
          </a>
        ))}
      </div>
    </>
  )
}
