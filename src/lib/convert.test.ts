import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convert, findUnit, formatResult, UNIT_GROUPS } from './convert.ts'

const unit = (group: string, id: string) => {
  const u = findUnit(group, id)
  assert.ok(u, `${group}/${id} should exist`)
  return u
}

const near = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  )

test('length converts both ways', () => {
  near(convert(1, unit('length', 'mi'), unit('length', 'km')), 1.609344)
  near(convert(1.609344, unit('length', 'km'), unit('length', 'mi')), 1)
  near(convert(12, unit('length', 'in'), unit('length', 'ft')), 1)
})

test('mass converts both ways', () => {
  near(convert(1, unit('mass', 'lb'), unit('mass', 'oz')), 16)
  near(convert(1, unit('mass', 'st'), unit('mass', 'lb')), 14)
})

test('temperature handles the offset scales', () => {
  // The cases everyone checks a converter with.
  near(convert(0, unit('temperature', 'c'), unit('temperature', 'f')), 32)
  near(convert(100, unit('temperature', 'c'), unit('temperature', 'f')), 212)
  near(convert(-40, unit('temperature', 'c'), unit('temperature', 'f')), -40)
  near(convert(98.6, unit('temperature', 'f'), unit('temperature', 'c')), 37)
  near(convert(0, unit('temperature', 'c'), unit('temperature', 'k')), 273.15)
  near(convert(0, unit('temperature', 'k'), unit('temperature', 'c')), -273.15)
})

test('converting a unit to itself is the identity', () => {
  for (const group of UNIT_GROUPS) {
    for (const u of group.units) {
      near(convert(7.5, u, u), 7.5, 1e-9)
    }
  }
})

test('unknown units are reported, not guessed at', () => {
  assert.equal(findUnit('length', 'furlong'), undefined)
  assert.equal(findUnit('nonsense', 'm'), undefined)
})

test('results are readable rather than floating-point noise', () => {
  // 0.1 + 0.2 style drift must not reach the display.
  assert.equal(formatResult(convert(1, unit('length', 'cm'), unit('length', 'mm'))), '10')
  assert.equal(formatResult(2.5), '2.5')
  assert.equal(formatResult(1 / 3), '0.333333')
  assert.equal(formatResult(0), '0')
  assert.equal(formatResult(NaN), '—')
  assert.equal(formatResult(1e12), '1.0000e+12')
})
