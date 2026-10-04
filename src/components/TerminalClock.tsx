import { useNow, SECOND } from '../hooks/useNow'

/** Monospace digits with a colon that blinks on the second, the way a
 *  terminal clock does. Each digit sits in a fixed-width cell so the whole
 *  readout stays put instead of jittering as the numbers change. */
export function TerminalClock({ hour12 }: { hour12: boolean }) {
  // SECOND because the colon blinks on the second.
  const now = useNow(SECOND)

  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours()
  const on = now.getSeconds() % 2 === 0

  return (
    <div className="clock clock-terminal">
      <span className="term-digits">{pad(hours)}</span>
      <span className={`term-colon${on ? '' : ' off'}`}>:</span>
      <span className="term-digits">{pad(now.getMinutes())}</span>
      <span className={`term-colon${on ? '' : ' off'}`}>:</span>
      <span className="term-digits">{pad(now.getSeconds())}</span>
      {hour12 && <span className="clock-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
    </div>
  )
}
