// Local-timezone date keys (YYYY-MM-DD). Never use toISOString() for "today":
// it's UTC, so habits/focus would roll over at UTC midnight, not local.

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** The last `n` local dates, oldest first, ending today. */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return localDateStr(d)
  })
}
