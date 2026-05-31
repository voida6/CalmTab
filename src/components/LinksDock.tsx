import type { LinkItem } from '../lib/types'
import { brandGlyph } from '../data/brandIcons'

interface Props {
  links: LinkItem[]
}

export function LinksDock({ links }: Props) {
  if (links.length === 0) return null
  return (
    <nav className="dock">
      {links.map((l) => {
        const path = brandGlyph(l.url)
        return (
          <a key={l.id} href={l.url} data-label={l.name} aria-label={l.name}>
            {path ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={path} fill="currentColor" />
              </svg>
            ) : (
              <span className="monogram">{(l.name.trim()[0] || '?').toUpperCase()}</span>
            )}
          </a>
        )
      })}
    </nav>
  )
}
