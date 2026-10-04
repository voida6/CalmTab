import { useState } from 'react'
import { useNow, MINUTE } from '../hooks/useNow'
import { SPANS, spanFraction } from '../lib/clocks'
import type { Span } from '../lib/clocks'

/**
 * The time, with a bar underneath showing how much of the day (or week, or
 * year) has gone. Click the label to change which.
 */
export function ProgressClock({ hour12 }: { hour12: boolean }) {
  // MINUTE because no seconds are shown and the bar moves imperceptibly slowly
  // — a minute of a day is 0.07% of the width.
  const now = useNow(MINUTE)
  const [span, setSpan] = useState<Span>('day')

  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours()
  const percent = spanFraction(now, span) * 100

  return (
    <div className="clock clock-progress">
      <div className="progress-time">
        {hour12 ? hours : pad(hours)}:{pad(now.getMinutes())}
        {hour12 && <span className="clock-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={`Progress through the ${span}`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <button
        className="progress-label"
        onClick={() => setSpan((s) => SPANS[(SPANS.indexOf(s) + 1) % SPANS.length])}
        title="Show a different span"
      >
        {percent.toFixed(1)}% of the {span}
      </button>
    </div>
  )
}
