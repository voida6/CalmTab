import { MINUTE, useNow } from '../hooks/useNow'

interface Props {
  /** IANA zone names, e.g. `Europe/London`. */
  zones: string[]
  hour12: boolean
}

/** The label to show for a zone: the city part, with underscores unpicked.
 *  `America/New_York` reads as "New York". */
function zoneLabel(zone: string): string {
  const city = zone.split('/').pop() ?? zone
  return city.replace(/_/g, ' ')
}

/** How far ahead or behind the local day this zone is, in days. Shown so a
 *  time that looks wrong ("it's 3am there?") explains itself. */
function dayShift(now: Date, zone: string): number {
  const there = new Date(now.toLocaleString('en-US', { timeZone: zone }))
  const here = new Date(now.toLocaleString('en-US'))
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((day(there) - day(here)) / 86_400_000)
}

export function WorldClocksWidget({ zones, hour12 }: Props) {
  // MINUTE: no seconds are shown, so there is nothing to update more often.
  const now = useNow(MINUTE)

  if (zones.length === 0) {
    return (
      <div className="card world-card">
        <div className="widget-label">World clocks</div>
        <div className="muted">Add a time zone in Settings → Widgets.</div>
      </div>
    )
  }

  return (
    <div className="card world-card">
      <div className="widget-label">World clocks</div>
      {zones.map((zone) => {
        let time: string
        try {
          time = now.toLocaleTimeString(undefined, {
            timeZone: zone,
            hour: 'numeric',
            minute: '2-digit',
            hour12,
          })
        } catch {
          // An unknown or misspelled zone throws rather than falling back, and
          // one bad entry shouldn't take the whole widget down.
          time = '—'
        }
        const shift = dayShift(now, zone)
        return (
          <div className="row between world-row" key={zone}>
            <span className="world-city">{zoneLabel(zone)}</span>
            <span className="world-time">
              {time}
              {shift !== 0 && (
                <span className="world-shift">{shift > 0 ? '+1 day' : '−1 day'}</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
