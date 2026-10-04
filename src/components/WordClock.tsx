import { useNow } from '../hooks/useNow'

const WORDS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

function phrase(d: Date): { lead: string; hour: string } {
  let h = d.getHours()
  let r = Math.round(d.getMinutes() / 5) * 5
  if (r === 60) {
    r = 0
    h += 1
  }
  const cur = WORDS[h % 12]
  const next = WORDS[(h + 1) % 12]
  switch (r) {
    case 0:
      return { lead: '', hour: cur }
    case 5:
      return { lead: 'five past', hour: cur }
    case 10:
      return { lead: 'ten past', hour: cur }
    case 15:
      return { lead: 'quarter past', hour: cur }
    case 20:
      return { lead: 'twenty past', hour: cur }
    case 25:
      return { lead: 'twenty-five past', hour: cur }
    case 30:
      return { lead: 'half past', hour: cur }
    case 35:
      return { lead: 'twenty-five to', hour: next }
    case 40:
      return { lead: 'twenty to', hour: next }
    case 45:
      return { lead: 'quarter to', hour: next }
    case 50:
      return { lead: 'ten to', hour: next }
    default:
      return { lead: 'five to', hour: next }
  }
}

export function WordClock() {
  // The phrase changes on five-minute boundaries, so a coarse tick is plenty;
  // 30s keeps it from lagging a boundary by more than half a tick.
  const now = useNow(30_000)

  const { lead, hour } = phrase(now)
  return (
    <div className="word-clock">
      {lead && <span className="word-lead">{lead}</span>}
      <span className="word-hour">{hour}</span>
      {!lead && <span className="word-lead">o&rsquo;clock</span>}
    </div>
  )
}
