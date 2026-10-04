// Unit conversion. Currencies are handled separately (they need live rates);
// everything here is a fixed ratio and so is pure and testable.

export interface Unit {
  id: string
  label: string
  /** How many base units one of these is worth. */
  ratio: number
  /** Additive offset applied after the ratio — only temperature needs it. */
  offset?: number
}

export interface UnitGroup {
  id: string
  label: string
  units: Unit[]
}

// Each group converts through a base unit: metres, kilograms, litres, Celsius.
export const UNIT_GROUPS: UnitGroup[] = [
  {
    id: 'length',
    label: 'Length',
    units: [
      { id: 'mm', label: 'mm', ratio: 0.001 },
      { id: 'cm', label: 'cm', ratio: 0.01 },
      { id: 'm', label: 'm', ratio: 1 },
      { id: 'km', label: 'km', ratio: 1000 },
      { id: 'in', label: 'in', ratio: 0.0254 },
      { id: 'ft', label: 'ft', ratio: 0.3048 },
      { id: 'mi', label: 'mi', ratio: 1609.344 },
    ],
  },
  {
    id: 'mass',
    label: 'Mass',
    units: [
      { id: 'g', label: 'g', ratio: 0.001 },
      { id: 'kg', label: 'kg', ratio: 1 },
      { id: 'oz', label: 'oz', ratio: 0.028349523125 },
      { id: 'lb', label: 'lb', ratio: 0.45359237 },
      { id: 'st', label: 'stone', ratio: 6.35029318 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      { id: 'ml', label: 'ml', ratio: 0.001 },
      { id: 'l', label: 'L', ratio: 1 },
      { id: 'cup', label: 'cup (US)', ratio: 0.2365882365 },
      { id: 'pt', label: 'pint (US)', ratio: 0.473176473 },
      { id: 'gal', label: 'gallon (US)', ratio: 3.785411784 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    units: [
      { id: 'c', label: '°C', ratio: 1, offset: 0 },
      // F = C * 9/5 + 32, so one Fahrenheit degree is 5/9 of a Celsius one
      // and the scale starts 32 units lower.
      { id: 'f', label: '°F', ratio: 5 / 9, offset: -32 * (5 / 9) },
      { id: 'k', label: 'K', ratio: 1, offset: -273.15 },
    ],
  },
]

export function findUnit(groupId: string, unitId: string): Unit | undefined {
  return UNIT_GROUPS.find((g) => g.id === groupId)?.units.find((u) => u.id === unitId)
}

/** Convert between two units of the same group. Returns null if either unit
 *  is unknown, rather than a silently wrong number. */
export function convert(value: number, from: Unit, to: Unit): number {
  // Into the base unit, then out of it. The offset makes this work for
  // temperature, where the scales don't share a zero.
  const base = value * from.ratio + (from.offset ?? 0)
  return (base - (to.offset ?? 0)) / to.ratio
}

/** Trim a converted value to something readable: enough significant figures to
 *  be useful, without a tail of floating-point noise. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const magnitude = Math.abs(value)
  if (magnitude !== 0 && (magnitude < 0.001 || magnitude >= 1e9)) {
    return value.toExponential(4)
  }
  // toPrecision then strip trailing zeros, so 2.5000 shows as 2.5 but
  // 0.000123456 keeps its digits.
  const precise = Number(value.toPrecision(6))
  return String(precise)
}
