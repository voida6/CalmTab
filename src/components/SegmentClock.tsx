import { SECOND, useNow } from '../hooks/useNow'

// A seven-segment display, drawn with divs rather than a font so the unlit
// segments can stay faintly visible — which is what makes it read as a real
// LCD rather than just blocky text.
//
//   aaa
//  f   b
//   ggg
//  e   c
//   ddd
const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const

const DIGITS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

function Digit({ value }: { value: string }) {
  const lit = DIGITS[value] ?? ''
  return (
    <span className="seg-digit" aria-hidden="true">
      {SEGMENTS.map((s) => (
        <span key={s} className={`seg seg-${s}${lit.includes(s) ? ' on' : ''}`} />
      ))}
    </span>
  )
}

export function SegmentClock({ hour12, showSeconds }: { hour12: boolean; showSeconds: boolean }) {
  const now = useNow(SECOND)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = pad(hour12 ? now.getHours() % 12 || 12 : now.getHours())
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())

  return (
    <div
      className="clock clock-segment"
      role="img"
      aria-label={`${hours}:${minutes}${showSeconds ? `:${seconds}` : ''}`}
    >
      <Digit value={hours[0]} />
      <Digit value={hours[1]} />
      <span className="seg-colon" aria-hidden="true">
        <i />
        <i />
      </span>
      <Digit value={minutes[0]} />
      <Digit value={minutes[1]} />
      {showSeconds && (
        <>
          <span className="seg-colon" aria-hidden="true">
            <i />
            <i />
          </span>
          <Digit value={seconds[0]} />
          <Digit value={seconds[1]} />
        </>
      )}
      {hour12 && <span className="clock-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
    </div>
  )
}
