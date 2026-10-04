// Tests for the wallpaper accent picking. The Material library itself is not
// exercised here — only the choice of which extracted colours to offer, which
// is where the old behaviour went wrong.

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pickAccents } from './dynamicColor.ts'
import type { Candidate } from './dynamicColor.ts'

let nextArgb = 1
function candidate(part: Partial<Candidate>): Candidate {
  return {
    argb: nextArgb++,
    population: 1000,
    chroma: 50,
    tone: 50,
    hue: 0,
    ...part,
  }
}

test('grey, near-black and near-white are never offered as accents', () => {
  const picks = pickAccents(
    [
      candidate({ chroma: 3, hue: 10 }), // grey
      candidate({ tone: 4, hue: 120 }), // almost black
      candidate({ tone: 97, hue: 240 }), // almost white
    ],
    6,
  )
  assert.deepEqual(picks, [])
})

test('a vivid minority colour can beat a dull dominant one', () => {
  const dull = candidate({ population: 90_000, chroma: 14, hue: 210 })
  const vivid = candidate({ population: 9_000, chroma: 70, hue: 30 })
  // Dominance still counts, but damped: 300*34 vs 95*90.
  assert.deepEqual(pickAccents([dull, vivid], 1), [vivid.argb])
})

test('dominance still counts when the colours are comparably vivid', () => {
  const big = candidate({ population: 90_000, chroma: 60, hue: 210 })
  const small = candidate({ population: 900, chroma: 65, hue: 30 })
  assert.deepEqual(pickAccents([big, small], 1), [big.argb])
})

test('the suggestions are spread across the hue wheel', () => {
  // Five near-identical blues and one orange. The old ranking would have
  // offered five blues; the row should reach the orange instead.
  const blues = [0, 5, 10, 15, 20].map((hue) => candidate({ hue, population: 50_000 }))
  const orange = candidate({ hue: 200, population: 1_000 })
  const picks = pickAccents([...blues, orange], 6)
  assert.equal(picks.length, 2, 'the near-identical blues should collapse to one')
  assert.ok(picks.includes(orange.argb))
})

test('a near-monochrome image still gets a full row rather than one swatch', () => {
  // Nothing here is far enough apart to satisfy the separation rule, but
  // offering a single option would be worse than offering close ones.
  const shades = [0, 4, 8, 12, 16, 20].map((hue) => candidate({ hue }))
  const picks = pickAccents(shades, 6)
  assert.ok(picks.length >= 3, `expected a usable row, got ${picks.length}`)
})

test('never returns more than asked for', () => {
  const spread = [0, 60, 120, 180, 240, 300].map((hue) => candidate({ hue }))
  assert.equal(pickAccents(spread, 3).length, 3)
  assert.equal(pickAccents([], 6).length, 0)
})
