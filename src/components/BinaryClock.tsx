import { useNow, SECOND } from '../hooks/useNow'

// A BCD binary clock: one column per decimal digit of HH:MM:SS, each column a
// stack of bits with the most significant at the top. Four rows is enough for
// any digit 0-9, and columns that can never exceed 5 (the tens of minutes and
// seconds) simply leave their top cells empty.
const ROWS = [8, 4, 2, 1]

function digits(value: number): [number, number] {
  return [Math.floor(value / 10), value % 10]
}

export function BinaryClock({ hour12 }: { hour12: boolean }) {
  // SECOND because the seconds columns change.
  const now = useNow(SECOND)

  const hours = hour12 ? now.getHours() % 12 || 12 : now.getHours()
  const columns = [
    ...digits(hours),
    ...digits(now.getMinutes()),
    ...digits(now.getSeconds()),
  ]
  // The largest value each column ever holds, so we can hide bits that could
  // never light up rather than showing rows of permanently dead dots.
  const ceilings = [hour12 ? 1 : 2, 9, 5, 9, 5, 9]

  const label = columns.join('')

  return (
    <div
      className="clock clock-binary"
      role="img"
      aria-label={`Binary clock reading ${label}`}
    >
      {columns.map((digit, col) => (
        <div className="bin-col" key={col}>
          {ROWS.map((bit) => {
            if (bit > ceilings[col]) return <span className="bin-cell" key={bit} />
            const lit = (digit & bit) !== 0
            return <span className={`bin-dot${lit ? ' on' : ''}`} key={bit} />
          })}
          <span className="bin-label">{digit}</span>
        </div>
      ))}
    </div>
  )
}
