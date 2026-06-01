import { useEffect, useState } from 'react'

function format(d: Date, hour12: boolean): { time: string; suffix: string } {
  const p = (n: number) => String(n).padStart(2, '0')
  const m = p(d.getMinutes())
  const s = p(d.getSeconds())
  if (hour12) {
    const suffix = d.getHours() >= 12 ? 'PM' : 'AM'
    const h = d.getHours() % 12 || 12
    return { time: `${h}:${m}:${s}`, suffix }
  }
  return { time: `${p(d.getHours())}:${m}:${s}`, suffix: '' }
}

export function Clock({ hour12 }: { hour12: boolean }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { time, suffix } = format(now, hour12)
  return (
    <div className="clock">
      {time}
      {suffix && <span className="clock-suffix">{suffix}</span>}
    </div>
  )
}
