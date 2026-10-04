import type { IconStyle, LinkItem } from '../lib/types'
import { FolderIcon, SearchIcon } from './Icons'
import { ShortcutIcon } from './ShortcutIcon'

interface Props {
  /** Items at the current level — the root, or inside whichever folder the
   *  keyboard has stepped into. */
  links: LinkItem[]
  iconStyle: IconStyle
  /** Draw each item's key in the corner of its tile. */
  showKeys: boolean
  /** Folders and search shortcuts have no destination to follow, so the dock
   *  hands them back to the launcher instead of navigating. */
  onActivate: (item: LinkItem) => void
  /** `row` is the original single-line dock; `grid` wraps onto several rows
   *  and is what sits under the launcher bar. */
  layout?: 'row' | 'grid'
}

export function LinksDock({ links, iconStyle, showKeys, onActivate, layout = 'row' }: Props) {
  if (links.length === 0) return null
  return (
    <nav className={`dock${layout === 'grid' ? ' as-grid' : ''}`}>
      {links.map((l) => {
        const jumps = !l.folder && !l.search
        return (
          <a
            key={l.id}
            // Leaving href off folders and searches also stops middle-click
            // from opening a dead tab.
            href={jumps ? l.url : undefined}
            className={l.folder ? 'is-folder' : l.search ? 'is-search' : undefined}
            data-label={l.name}
            aria-label={l.name}
            style={l.color ? { color: l.color } : undefined}
            onClick={(e) => {
              if (jumps) return
              e.preventDefault()
              onActivate(l)
            }}
          >
            {l.icon ? (
              <span className="dock-emoji">{l.icon}</span>
            ) : l.folder ? (
              <FolderIcon />
            ) : l.search ? (
              <SearchIcon />
            ) : (
              <ShortcutIcon url={l.url} name={l.name} style={iconStyle} />
            )}
            {showKeys && l.key && <span className="key-badge">{l.key}</span>}
          </a>
        )
      })}
    </nav>
  )
}
