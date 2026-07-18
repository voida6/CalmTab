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
  const { themeFromSourceColor, hexFromArgb, TonalPalette } = await import('@material/material-color-utilities')
  const { palettes } = themeFromSourceColor(seed)
  const hx = (p: TonalPalette, tone: number) => hexFromArgb(p.tone(tone))
  // A low-chroma palette in the wallpaper's hue: keeps a hint of colour but
  // reads as a tinted grey rather than a vivid surface.
  const muted = TonalPalette.fromHueAndChroma(palettes.primary.hue, 12)

  if (scheme === 'light') {
    // Light surfaces (high tones) are naturally soft, so the primary palette is
    // gentle here — light-pink / light-blue, etc.
    return {
      '--bg': hx(palettes.primary, 95),
      '--surface': hx(palettes.primary, 97),
      '--surface-container': hx(palettes.primary, 91),
      '--surface-container-high': hx(palettes.primary, 87),
      '--primary': hx(palettes.primary, 42),
      '--primary-strong': hx(palettes.primary, 38),
      '--on-surface': hx(palettes.neutral, 12),
      '--on-surface-variant': hx(palettes.neutralVariant, 35),
      '--outline': hx(palettes.neutralVariant, 60),
      '--track': hx(palettes.primary, 82),
    }
  }
  // Dark surfaces use the MUTED palette (monotone, tinted grey); accent stays vivid.
  return {
    '--bg': hx(muted, 8),
    '--surface': hx(muted, 12),
    '--surface-container': hx(muted, 16),
    '--surface-container-high': hx(muted, 22),
    '--primary': hx(palettes.primary, 82),
    '--primary-strong': hx(palettes.primary, 72),
    '--on-surface': hx(palettes.neutral, 92),
    '--on-surface-variant': hx(palettes.neutralVariant, 80),
    '--outline': hx(palettes.neutralVariant, 45),
    '--track': hx(muted, 30),
  }
}

// Palette personality. 'calm' is CalmTab's hand-tuned default; the rest map
// Google's Material Dynamic Color scheme variants onto our tokens.
export type PaletteStyle = 'calm' | 'tonal' | 'vibrant' | 'expressive' | 'neutral' | 'fidelity' | 'mono'

async function buildFromScheme(
  seed: number,
  scheme: 'dark' | 'light',
  style: Exclude<PaletteStyle, 'calm'>,
): Promise<Palette> {
  const m = await import('@material/material-color-utilities')
  const { Hct, MaterialDynamicColors, hexFromArgb } = m
  const ctors = {
    tonal: m.SchemeTonalSpot,
    vibrant: m.SchemeVibrant,
    expressive: m.SchemeExpressive,
    neutral: m.SchemeNeutral,
    fidelity: m.SchemeFidelity,
    mono: m.SchemeMonochrome,
  } as const
  const isDark = scheme === 'dark'
  const ds = new ctors[style](Hct.fromInt(seed), isDark, 0)
  const c = (dc: { getArgb: (s: typeof ds) => number }) => hexFromArgb(dc.getArgb(ds))
  return {
    '--bg': c(MaterialDynamicColors.background),
    '--surface': c(MaterialDynamicColors.surfaceContainerLow),
    '--surface-container': c(MaterialDynamicColors.surfaceContainer),
    '--surface-container-high': c(MaterialDynamicColors.surfaceContainerHigh),
    '--primary': c(MaterialDynamicColors.primary),
    '--primary-strong': hexFromArgb(ds.primaryPalette.tone(isDark ? 70 : 35)),
    '--on-surface': c(MaterialDynamicColors.onSurface),
    '--on-surface-variant': c(MaterialDynamicColors.onSurfaceVariant),
    '--outline': c(MaterialDynamicColors.outline),
    '--track': c(MaterialDynamicColors.surfaceVariant),
  }
}

export async function paletteFromHex(
  hex: string,
  scheme: 'dark' | 'light',
  style: PaletteStyle = 'calm',
): Promise<Palette> {
  const { argbFromHex } = await import('@material/material-color-utilities')
  if (style === 'calm') return buildFromSeed(argbFromHex(hex), scheme)
  return buildFromScheme(argbFromHex(hex), scheme, style)
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
  const { QuantizerCelebi, Score, Hct, hexFromArgb, argbFromRgb, themeFromSourceColor } = await import(
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
    const quantized = QuantizerCelebi.quantize(pixels, 128)
    // Rank by DOMINANCE (how much of the image a color covers) with a mild
    // chroma weight — so the wallpaper's main colour wins over a small vivid
    // accent. Skip near-grey and near black/white.
    const cands = [...quantized.entries()]
      .map(([argb, pop]) => {
        const h = Hct.fromInt(argb)
        return { argb, score: pop * (h.chroma + 16), chroma: h.chroma, tone: h.tone }
      })
      .filter((c) => c.chroma >= 10 && c.tone >= 12 && c.tone <= 92)
      .sort((a, b) => b.score - a.score)
    let chosen = cands.slice(0, 6).map((c) => c.argb)
    // Fallback for low-colour (greyscale-ish) images.
    if (chosen.length === 0) chosen = Score.score(quantized).slice(0, 6)
    swatches = chosen.map((argb) => ({
      seed: hexFromArgb(argb),
      // Preview the accent Material You actually produces (tone 60).
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
