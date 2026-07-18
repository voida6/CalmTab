// Built-in wallpaper gallery: gradient presets rendered to an image on demand
// (no bundled assets). `css` is used for the preview chip; `stops`/`angle`
// feed the canvas renderer.

export interface GradientPreset {
  id: string
  name: string
  stops: string[]
  angle: number
}

export const GRADIENTS: GradientPreset[] = [
  { id: 'dusk',     name: 'Dusk',     stops: ['#2b1e4e', '#7c6bdc', '#e8a0bf'], angle: 135 },
  { id: 'ember',    name: 'Ember',    stops: ['#1a1423', '#7d2a42', '#f2a65a'], angle: 160 },
  { id: 'lagoon',   name: 'Lagoon',   stops: ['#0f2a43', '#1b6f8a', '#7ad6d9'], angle: 120 },
  { id: 'meadow',   name: 'Meadow',   stops: ['#123524', '#2f7d4f', '#b7e4c7'], angle: 140 },
  { id: 'aurora',   name: 'Aurora',   stops: ['#0b1026', '#254d70', '#43b692', '#d9ed92'], angle: 200 },
  { id: 'blossom',  name: 'Blossom',  stops: ['#fdf0f5', '#f5c6da', '#c98bb9'], angle: 150 },
  { id: 'sandbar',  name: 'Sandbar',  stops: ['#fff3e2', '#ffd9a0', '#e8985e'], angle: 130 },
  { id: 'midnight', name: 'Midnight', stops: ['#0d1117', '#1e2433', '#3a4a6b'], angle: 180 },
]

export function presetCss(p: GradientPreset): string {
  return `linear-gradient(${p.angle}deg, ${p.stops.join(', ')})`
}
