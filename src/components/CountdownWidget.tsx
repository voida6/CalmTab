import type { CountdownSettings } from '../lib/types'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

export function CountdownWidget({ countdown }: { countdown: CountdownSettings }) {
  if (!countdown.date) {
    return (
      <div className="card countdown-card">
        <div className="widget-label">Countdown</div>
        <div className="muted">Set a date in Settings.</div>
      </div>
    )
  }
  const days = daysUntil(countdown.date)
  const value = days === 0 ? 'Today' : Math.abs(days)
  const unit = days === 0 ? '' : Math.abs(days) === 1 ? 'day' : 'days'
  const suffix = days < 0 ? 'ago' : days > 0 ? 'to go' : '🎉'

  return (
    <div className="card countdown-card">
      <div className="widget-label">{countdown.label || 'Countdown'}</div>
      <div className="countdown-main">
        <span className="countdown-num">{value}</span>
        {unit && <span className="countdown-unit">{unit}</span>}
      </div>
      <div className="muted">{suffix}</div>
    </div>
  )
}
