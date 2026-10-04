// Pure time maths for the clock faces, kept out of the components so it can
// be tested without rendering anything.

const NUMERALS: [number, string][] = [
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** Roman numerals have no zero — the Romans had no use for one — so midnight
 *  and the top of the hour render as `·`, which is at least honest about it. */
export function toRoman(value: number): string {
  if (value <= 0) return '·'
  let n = value
  let out = ''
  for (const [amount, numeral] of NUMERALS) {
    while (n >= amount) {
      out += numeral
      n -= amount
    }
  }
  return out
}

export type Span = 'day' | 'week' | 'year'

export const SPANS: Span[] = ['day', 'week', 'year']

/** How far through `span` the given moment is, as a fraction from 0 to 1. */
export function spanFraction(now: Date, span: Span): number {
  if (span === 'day') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    // Deliberately not `elapsed / 86_400_000` from a fixed epoch: on a
    // daylight-saving boundary the day is 23 or 25 hours long, and measuring
    // against the real midnight keeps the bar honest.
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())
  }

  if (span === 'week') {
    const start = new Date(now)
    // Weeks start on Monday; getDay() calls Sunday 0, so shift it to 6.
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())
  }

  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 1, 0, 1)
  // Computed from real dates rather than 365, so leap years stay honest.
  return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())
}
