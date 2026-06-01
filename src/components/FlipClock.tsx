import { useEffect, useState } from 'react'

// A flip-card digit. Re-keying the inner span on value change replays the
// CSS flip-in animation, giving the split-flap feel without heavy 3D logic.
function Digit({ value }: { value: string }) {
  return (
    <span className="flip-card">
      <span key={value} className="flip-digit">
        {value}
      </span>
      <span className="flip-seam" />
    </span>
  )
}

export function FlipClock({ hour12 }: { hour12: boolean }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const p = (n: number) => String(n).padStart(2, '0')
  const h = hour12 ? now.getHours() % 12 || 12 : now.getHours()
  const hh = p(h)
  const mm = p(now.getMinutes())
  const suffix = hour12 ? (now.getHours() >= 12 ? 'PM' : 'AM') : ''

  return (
    <div className="flip-clock">
      <Digit value={hh[0]} />
      <Digit value={hh[1]} />
      <span className="flip-colon">:</span>
      <Digit value={mm[0]} />
      <Digit value={mm[1]} />
      {suffix && <span className="flip-suffix">{suffix}</span>}
    </div>
  )
}
