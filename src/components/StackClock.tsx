import { MINUTE, useNow } from '../hooks/useNow'

/**
 * Hours over minutes, left-aligned in a tall block, with the date alongside.
 * Reads more like a poster than a clock, and takes far less horizontal room
 * than the wide faces — useful once the launcher and grid share the column.
 */
export function StackClock({ hour12 }: { hour12: boolean }) {
  const now = useNow(MINUTE)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours()

  return (
    <div className="clock clock-stack">
      <div className="stack-digits">
        <span>{hour12 ? hours : pad(hours)}</span>
        <span>{pad(now.getMinutes())}</span>
      </div>
      <div className="stack-side">
        {hour12 && <span className="stack-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
        <span className="stack-day">
          {now.toLocaleDateString(undefined, { weekday: 'long' })}
        </span>
        <span className="stack-date">
          {now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
        </span>
      </div>
    </div>
  )
}
