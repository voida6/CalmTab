// Material 3 palette + image analysis. Uses Google's material-color-utilities,
// dynamically imported so it only loads when a wallpaper/color actually changes.
import type { TonalPalette } from '@material/material-color-utilities'

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

// Map a seed color's tonal palettes onto our CSS tokens for a light/dark scheme.
async function buildFromSeed(seed: number, scheme: 'dark' | 'light'): Promise<Palette> {
  const { themeFromSourceColor, hexFromArgb } = await import('@material/material-color-utilities')
  const { palettes } = themeFromSourceColor(seed)
  const hx = (p: TonalPalette, tone: number) => hexFromArgb(p.tone(tone))
  if (scheme === 'light') {
    return {
      '--bg': hx(palettes.neutral, 96),
      '--surface': hx(palettes.neutral, 98),
      '--surface-container': hx(palettes.neutral, 92),
      '--surface-container-high': hx(palettes.neutral, 88),
      '--primary': hx(palettes.primary, 40),
      '--primary-strong': hx(palettes.primary, 45),
      '--on-surface': hx(palettes.neutral, 12),
      '--on-surface-variant': hx(palettes.neutralVariant, 35),
      '--outline': hx(palettes.neutralVariant, 60),
      '--track': hx(palettes.primary, 85),
    }
  }
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

export async function paletteFromHex(hex: string, scheme: 'dark' | 'light'): Promise<Palette> {
  const { argbFromHex } = await import('@material/material-color-utilities')
  return buildFromSeed(argbFromHex(hex), scheme)
}

export interface Swatch {
  seed: string // raw extracted color used as the Material You seed
  color: string // preview of the accent it actually produces (so the dot matches)
}

export interface ImageAnalysis {
  seed: string // top extracted source color (hex)
  swatches: Swatch[] // ranked candidate colors for quick-pick
  luminance: number // 0-255 average brightness behind the hero (left-center) region
}

// Analyze a wallpaper: brightness behind the hero text + candidate accent colors.
export async function analyzeImage(dataUrl: string): Promise<ImageAnalysis> {
  const { QuantizerCelebi, Score, hexFromArgb, argbFromRgb, themeFromSourceColor } = await import(
    '@material/material-color-utilities'
  )
  const img = await loadImage(dataUrl)
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return { seed: '#7c7c8a', swatches: [], luminance: 128 }
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data

  // Average luminance over the left-center band where the clock/greeting sit.
  const x1 = Math.floor(size * 0.5)
  const y0 = Math.floor(size * 0.25)
  const y1 = Math.floor(size * 0.82)
  let sum = 0
  let count = 0
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < x1; x++) {
      const i = (y * size + x) * 4
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      count++
    }
  }
  const luminance = count ? sum / count : 128

  // Candidate accent colors (Material's quantize + score).
  const pixels: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue
    pixels.push(argbFromRgb(data[i], data[i + 1], data[i + 2]))
  }
  let swatches: Swatch[] = []
  let seed = '#7c7c8a'
  try {
    const ranked = Score.score(QuantizerCelebi.quantize(pixels, 96))
    swatches = ranked.slice(0, 6).map((argb) => ({
      seed: hexFromArgb(argb),
      // Preview the accent Material You will actually produce (tone 60), so the
      // dot color matches the theme instead of the raw (often muted) pixel.
      color: hexFromArgb(themeFromSourceColor(argb).palettes.primary.tone(60)),
    }))
    seed = swatches[0]?.seed ?? seed
  } catch {
    /* fall back to defaults */
  }
  return { seed, swatches, luminance }
}

// Build a palette directly from the image's top seed (used for "auto" accent).
export async function paletteFromImage(dataUrl: string, scheme: 'dark' | 'light'): Promise<Palette> {
  const { seed } = await analyzeImage(dataUrl)
  return paletteFromHex(seed, scheme)
}
