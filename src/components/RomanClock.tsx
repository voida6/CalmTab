import { useNow, MINUTE } from '../hooks/useNow'
import { toRoman } from '../lib/clocks'

export function RomanClock({ hour12 }: { hour12: boolean }) {
  // MINUTE because only hours and minutes are shown.
  const now = useNow(MINUTE)

  const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours()
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      className="clock clock-roman"
      role="img"
      aria-label={`${pad(hours)}:${pad(now.getMinutes())}`}
    >
      <span>{toRoman(hours)}</span>
      <span className="roman-sep">·</span>
      <span>{toRoman(now.getMinutes())}</span>
      {hour12 && <span className="clock-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
    </div>
  )
}
