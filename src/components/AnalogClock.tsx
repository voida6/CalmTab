import { useEffect, useState } from 'react'

// Material You "flower" / scalloped-circle path.
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

const FLOWER = scallopPath(72, 12)

interface Props {
  face?: 'flower' | 'circle'
}

export function AnalogClock({ face = 'flower' }: Props) {
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

  // Tick marks for the classic (circle) face.
  const ticks =
    face === 'circle'
      ? Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180
          const outer = 84
          const inner = i % 3 === 0 ? 72 : 77
          return {
            x1: 100 + Math.sin(a) * outer,
            y1: 100 - Math.cos(a) * outer,
            x2: 100 + Math.sin(a) * inner,
            y2: 100 - Math.cos(a) * inner,
            major: i % 3 === 0,
          }
        })
      : []

  return (
    <svg className="analog" viewBox="0 0 200 200" role="img" aria-label="Clock">
      {face === 'flower' ? (
        <path className="analog-face" d={FLOWER} />
      ) : (
        <circle className="analog-face" cx="100" cy="100" r="90" />
      )}
      {ticks.map((t, i) => (
        <line key={i} className={t.major ? 'analog-tick major' : 'analog-tick'} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
      <line className="analog-hour" x1="100" y1="100" x2="100" y2="60" transform={`rotate(${hourAngle} 100 100)`} />
      <line className="analog-min" x1="100" y1="100" x2="100" y2="42" transform={`rotate(${minAngle} 100 100)`} />
      <line className="analog-sec" x1="100" y1="112" x2="100" y2="38" transform={`rotate(${secAngle} 100 100)`} />
      <circle className="analog-cap" cx="100" cy="100" r="5.5" />
    </svg>
  )
}
