import assert from 'node:assert/strict'
import { test } from 'node:test'

import { daysInMonth, monthGrid } from './calendar.ts'

test('month lengths, including February in a leap year', () => {
  assert.equal(daysInMonth(2026, 0), 31) // January
  assert.equal(daysInMonth(2026, 1), 28) // February, common year
  assert.equal(daysInMonth(2028, 1), 29) // February, leap year
  assert.equal(daysInMonth(2026, 3), 30) // April
  // Rolls over correctly at the year boundary.
  assert.equal(daysInMonth(2026, -1), 31) // December 2025
})

test('the grid is always six full weeks', () => {
  for (let month = 0; month < 12; month++) {
    const grid = monthGrid(new Date(2026, month, 1))
    assert.equal(grid.length, 42, `month ${month}`)
  }
})

test('the month starts on the right weekday', () => {
  // 1 July 2026 is a Wednesday, so a Monday-first grid needs two lead cells.
  const grid = monthGrid(new Date(2026, 6, 1))
  const lead = grid.filter((d) => d.month === 'previous')
  assert.equal(lead.length, 2)
  // Those two are the last days of June.
  assert.deepEqual(
    lead.map((d) => d.date),
    [29, 30],
  )
  assert.equal(grid[2].date, 1)
  assert.equal(grid[2].month, 'current')
})

test('a Sunday-first grid shifts the lead by one', () => {
  const monday = monthGrid(new Date(2026, 6, 1), true)
  const sunday = monthGrid(new Date(2026, 6, 1), false)
  assert.equal(monday.filter((d) => d.month === 'previous').length, 2)
  assert.equal(sunday.filter((d) => d.month === 'previous').length, 3)
})

test('exactly one cell is today, and only in the current month', () => {
  const today = new Date(2026, 6, 28)
  const grid = monthGrid(new Date(2026, 6, 1), true, today)
  const marked = grid.filter((d) => d.isToday)
  assert.equal(marked.length, 1)
  assert.equal(marked[0].date, 28)
  assert.equal(marked[0].month, 'current')
})

test('no cell is today when looking at a different month', () => {
  const grid = monthGrid(new Date(2026, 2, 1), true, new Date(2026, 6, 28))
  assert.equal(grid.filter((d) => d.isToday).length, 0)
})

test('a month starting on the week-start day gets no lead cells', () => {
  // 1 June 2026 is a Monday.
  const grid = monthGrid(new Date(2026, 5, 1))
  assert.equal(grid.filter((d) => d.month === 'previous').length, 0)
  assert.equal(grid[0].date, 1)
})
