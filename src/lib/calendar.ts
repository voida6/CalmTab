// Month-grid maths, kept out of the component so it can be tested without
// rendering — off-by-one errors in calendars are easy to make and hard to spot.

export interface Day {
  date: number // day of the month
  month: 'previous' | 'current' | 'next'
  isToday: boolean
}

/** Days in a month. `month` is 0-indexed, as `Date` uses. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month + 1, 0).getDate()
}

/**
 * A six-row grid for the month containing `focus`, padded with the tail of the
 * previous month and the head of the next so every row is full.
 *
 * Always six rows (42 cells): a month can span six weeks, and a grid that
 * changes height as you page through the year looks broken.
 */
export function monthGrid(focus: Date, weekStartsMonday = true, today = new Date()): Day[] {
  const year = focus.getFullYear()
  const month = focus.getMonth()

  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sunday
  // How many cells of the previous month to show before the 1st.
  const lead = weekStartsMonday ? (firstWeekday + 6) % 7 : firstWeekday

  const thisMonth = daysInMonth(year, month)
  const prevMonth = daysInMonth(year, month - 1)

  const sameDay = (d: number, m: 'previous' | 'current' | 'next') => {
    if (m !== 'current') return false
    return (
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    )
  }

  const cells: Day[] = []
  for (let i = lead; i > 0; i--) {
    cells.push({ date: prevMonth - i + 1, month: 'previous', isToday: false })
  }
  for (let d = 1; d <= thisMonth; d++) {
    cells.push({ date: d, month: 'current', isToday: sameDay(d, 'current') })
  }
  let next = 1
  while (cells.length < 42) {
    cells.push({ date: next++, month: 'next', isToday: false })
  }
  return cells
}

export const WEEKDAYS_MONDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
export const WEEKDAYS_SUNDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
