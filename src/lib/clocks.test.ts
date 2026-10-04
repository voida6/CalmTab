import assert from 'node:assert/strict'
import { test } from 'node:test'

import { spanFraction, toRoman } from './clocks.ts'

test('roman numerals cover every hour and minute', () => {
  assert.equal(toRoman(1), 'I')
  assert.equal(toRoman(4), 'IV')
  assert.equal(toRoman(9), 'IX')
  assert.equal(toRoman(12), 'XII')
  assert.equal(toRoman(23), 'XXIII')
  assert.equal(toRoman(44), 'XLIV')
  assert.equal(toRoman(59), 'LIX')
})

test('there is no roman zero', () => {
  assert.equal(toRoman(0), '·')
})

test('the day bar runs from midnight to midnight', () => {
  const midnight = new Date(2026, 6, 25, 0, 0, 0)
  const noon = new Date(2026, 6, 25, 12, 0, 0)
  assert.equal(spanFraction(midnight, 'day'), 0)
  assert.ok(Math.abs(spanFraction(noon, 'day') - 0.5) < 1e-9)
})

test('the week starts on Monday', () => {
  // 2026-07-20 is a Monday; the Sunday after is the last day of that week.
  assert.equal(spanFraction(new Date(2026, 6, 20, 0, 0, 0), 'week'), 0)
  const sunday = spanFraction(new Date(2026, 6, 26, 12, 0, 0), 'week')
  assert.ok(sunday > 6 / 7 && sunday < 1, `expected the Sunday to be in the last 7th, got ${sunday}`)
})

test('the year bar accounts for leap years', () => {
  assert.equal(spanFraction(new Date(2026, 0, 1), 'year'), 0)

  // 2028 is a leap year. By 1 March, 60 days have passed rather than 59, out
  // of 366 rather than 365 — so the leap year reads very slightly further
  // along. Measuring against a hardcoded 365 would get this wrong.
  const common = spanFraction(new Date(2027, 2, 1), 'year')
  const leap = spanFraction(new Date(2028, 2, 1), 'year')
  assert.ok(leap > common, `expected ${leap} > ${common}`)
  assert.ok(Math.abs(common - 59 / 365) < 1e-9)
  assert.ok(Math.abs(leap - 60 / 366) < 1e-9)
})
