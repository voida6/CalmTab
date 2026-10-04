import { useState } from 'react'
import { MINUTE, useNow } from '../hooks/useNow'
import { monthGrid, WEEKDAYS_MONDAY } from '../lib/calendar'
import { ChevronIcon } from './Icons'

/** A month at a glance, with today marked. Paging is local state, so it
 *  resets to the current month on every new tab — which is what you want from
 *  a glance, rather than something that remembers you were in March. */
export function CalendarWidget() {
  // MINUTE, not SECOND: the only thing that can change is the date, and even
  // that at most once a day.
  const now = useNow(MINUTE)
  const [offset, setOffset] = useState(0)

  const focus = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const cells = monthGrid(focus, true, now)
  const title = focus.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="card calendar-card">
      <div className="row between calendar-head">
        <button
          className="btn-ghost"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Previous month"
        >
          <ChevronIcon size={14} up />
        </button>
        <button
          className="calendar-title"
          onClick={() => setOffset(0)}
          title={offset ? 'Back to this month' : undefined}
        >
          {title}
        </button>
        <button
          className="btn-ghost"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Next month"
        >
          <ChevronIcon size={14} />
        </button>
      </div>

      <div className="calendar-grid" role="grid" aria-label={title}>
        {WEEKDAYS_MONDAY.map((d, i) => (
          // The initials repeat (T, T and S, S), so the key is the position.
          <span key={i} className="calendar-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => (
          <span
            key={i}
            className={`calendar-day${cell.month === 'current' ? '' : ' is-outside'}${
              cell.isToday ? ' is-today' : ''
            }`}
            aria-current={cell.isToday ? 'date' : undefined}
          >
            {cell.date}
          </span>
        ))}
      </div>
    </div>
  )
}
