import type { IconStyle, LinkItem } from '../lib/types'
import { ShortcutIcon } from './ShortcutIcon'

interface Props {
  links: LinkItem[]
  iconStyle: IconStyle
}

export function LinksDock({ links, iconStyle }: Props) {
  if (links.length === 0) return null
  return (
    <nav className="dock">
      {links.map((l) => (
        <a
          key={l.id}
          href={l.url}
          data-label={l.name}
          aria-label={l.name}
          style={l.color ? { color: l.color } : undefined}
        >
          {l.icon ? (
            <span className="dock-emoji">{l.icon}</span>
          ) : (
            <ShortcutIcon url={l.url} name={l.name} style={iconStyle} />
          )}
        </a>
      ))}
    </nav>
  )
}
