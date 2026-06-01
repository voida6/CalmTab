import { brandGlyph } from '../data/brandIcons'
import type { IconStyle } from '../lib/types'

function faviconUrl(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
  } catch {
    return ''
  }
}

function Monogram({ name }: { name: string }) {
  return <span className="monogram">{(name.trim()[0] || '?').toUpperCase()}</span>
}

interface Props {
  url: string
  name: string
  style: IconStyle
}

// One shortcut icon: a full-color favicon, or a themed monochrome brand glyph
// (tinted by the palette) with a letter-monogram fallback.
export function ShortcutIcon({ url, name, style }: Props) {
  if (style === 'favicon') {
    const src = faviconUrl(url)
    return src ? <img className="favicon-img" src={src} alt={name} /> : <Monogram name={name} />
  }
  const path = brandGlyph(url)
  return path ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  ) : (
    <Monogram name={name} />
  )
}
