import { useEffect, useState } from 'react'

function format(d: Date, hour12: boolean, showSeconds: boolean): { time: string; suffix: string } {
  const p = (n: number) => String(n).padStart(2, '0')
  const m = p(d.getMinutes())
  const tail = showSeconds ? `:${p(d.getSeconds())}` : ''
  if (hour12) {
    const suffix = d.getHours() >= 12 ? 'PM' : 'AM'
    const h = d.getHours() % 12 || 12
    return { time: `${h}:${m}${tail}`, suffix }
  }
  return { time: `${p(d.getHours())}:${m}${tail}`, suffix: '' }
}

export function Clock({ hour12, showSeconds = true }: { hour12: boolean; showSeconds?: boolean }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { time, suffix } = format(now, hour12, showSeconds)
  return (
    <div className="clock">
      {time}
      {suffix && <span className="clock-suffix">{suffix}</span>}
    </div>
  )
}
