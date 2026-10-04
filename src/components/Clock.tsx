import { MINUTE, SECOND, useNow } from '../hooks/useNow'

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
  // Without seconds on screen there is nothing to update 59 times a minute,
  // and this face carries an expensive glow — so only tick as often as the
  // digits actually change.
  const now = useNow(showSeconds ? SECOND : MINUTE)

  const { time, suffix } = format(now, hour12, showSeconds)
  return (
    <div className="clock">
      {time}
      {suffix && <span className="clock-suffix">{suffix}</span>}
    </div>
  )
}
