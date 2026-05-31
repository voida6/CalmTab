import type { LinkItem } from '../lib/types'

function favicon(url: string): string {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
  } catch {
    return ''
  }
}

interface Props {
  links: LinkItem[]
}

export function LinksDock({ links }: Props) {
  if (links.length === 0) return null
  return (
    <nav className="dock">
      {links.map((l) => (
        <a key={l.id} href={l.url} title={l.name} aria-label={l.name}>
          <img src={favicon(l.url)} alt={l.name} />
        </a>
      ))}
    </nav>
  )
}
