// Generate a Material 3 palette from an image and map it onto our CSS variables.
// Uses Google's material-color-utilities: it picks a seed color from the image,
// then builds tonal palettes we sample at specific tones for a dark UI.
// Type-only import (erased at build) — the actual library is dynamically
// imported inside paletteFromImage so it becomes a separate chunk that loads
// ONLY when extracting a palette from a new wallpaper, not on every new tab.
import type { TonalPalette } from '@material/material-color-utilities'

// The exact set of tokens defined in theme/material.css. Keep in sync.
export type Palette = {
  '--bg': string
  '--surface': string
  '--surface-container': string
  '--surface-container-high': string
  '--primary': string
  '--primary-strong': string
  '--on-surface': string
  '--on-surface-variant': string
  '--outline': string
  '--track': string
}

export const PALETTE_TOKENS = [
  '--bg',
  '--surface',
  '--surface-container',
  '--surface-container-high',
  '--primary',
  '--primary-strong',
  '--on-surface',
  '--on-surface-variant',
  '--outline',
  '--track',
] as const

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function paletteFromImage(dataUrl: string): Promise<Palette> {
  const { sourceColorFromImage, themeFromSourceColor, hexFromArgb } = await import(
    '@material/material-color-utilities'
  )
  const img = await loadImage(dataUrl)
  const source = await sourceColorFromImage(img)
  const { palettes } = themeFromSourceColor(source)
  const hx = (p: TonalPalette, tone: number) => hexFromArgb(p.tone(tone))
  // Dark scheme tones (M3-ish): low-tone neutrals for surfaces, high for text,
  // bright primary tones for accents.
  return {
    '--bg': hx(palettes.neutral, 8),
    '--surface': hx(palettes.neutral, 12),
    '--surface-container': hx(palettes.neutral, 17),
    '--surface-container-high': hx(palettes.neutral, 22),
    '--primary': hx(palettes.primary, 82),
    '--primary-strong': hx(palettes.primary, 70),
    '--on-surface': hx(palettes.neutral, 92),
    '--on-surface-variant': hx(palettes.neutralVariant, 80),
    '--outline': hx(palettes.neutralVariant, 45),
    '--track': hx(palettes.primary, 32),
  }
}
