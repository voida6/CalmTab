import { useEffect, useState } from 'react'

// Build a Material You "flower" / scalloped-circle path: N points on a circle,
// joined by outward semicircular bumps. (chord between points = 2*bumpRadius, so
// each arc is a clean semicircle scallop.)
function scallopPath(radius: number, lobes: number, cx = 100, cy = 100): string {
  const pts: [number, number][] = []
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 - Math.PI / 2
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius])
  }
  const bump = radius * Math.sin(Math.PI / lobes)
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `
  for (let i = 0; i < lobes; i++) {
    const n = pts[(i + 1) % lobes]
    d += `A ${bump.toFixed(2)} ${bump.toFixed(2)} 0 0 1 ${n[0].toFixed(2)} ${n[1].toFixed(2)} `
  }
  return d + 'Z'
}

const FACE = scallopPath(72, 12)

export function AnalogClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const s = now.getSeconds()
  const m = now.getMinutes()
  const h = now.getHours() % 12
  const secAngle = s * 6
  const minAngle = m * 6 + s * 0.1
  const hourAngle = h * 30 + m * 0.5

  return (
    <svg className="analog" viewBox="0 0 200 200" role="img" aria-label="Clock">
      <path className="analog-face" d={FACE} />
      <line className="analog-hour" x1="100" y1="100" x2="100" y2="60" transform={`rotate(${hourAngle} 100 100)`} />
      <line className="analog-min" x1="100" y1="100" x2="100" y2="42" transform={`rotate(${minAngle} 100 100)`} />
      <line className="analog-sec" x1="100" y1="110" x2="100" y2="40" transform={`rotate(${secAngle} 100 100)`} />
      <circle className="analog-cap" cx="100" cy="100" r="5.5" />
    </svg>
  )
}
