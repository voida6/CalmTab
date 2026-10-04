import { SECOND, useNow } from '../hooks/useNow'

// 3x5 dot font. Each string is five rows of three columns, read top to bottom;
// `#` is a lit dot. Small enough to be legible at a glance, which is the whole
// point of a dot-matrix display.
const GLYPHS: Record<string, string> = {
  '0': '###' + '#.#' + '#.#' + '#.#' + '###',
  '1': '..#' + '..#' + '..#' + '..#' + '..#',
  '2': '###' + '..#' + '###' + '#..' + '###',
  '3': '###' + '..#' + '###' + '..#' + '###',
  '4': '#.#' + '#.#' + '###' + '..#' + '..#',
  '5': '###' + '#..' + '###' + '..#' + '###',
  '6': '###' + '#..' + '###' + '#.#' + '###',
  '7': '###' + '..#' + '..#' + '..#' + '..#',
  '8': '###' + '#.#' + '###' + '#.#' + '###',
  '9': '###' + '#.#' + '###' + '..#' + '###',
}

const COLON = '...' + '.#.' + '...' + '.#.' + '...'

function Glyph({ pattern }: { pattern: string }) {
  return (
    <span className="dm-glyph" aria-hidden="true">
      {[...pattern].map((cell, i) => (
        <span key={i} className={`dm-dot${cell === '#' ? ' on' : ''}`} />
      ))}
    </span>
  )
}

export function DotMatrixClock({ hour12 }: { hour12: boolean }) {
  // SECOND so the colon can blink, which is what sells the effect.
  const now = useNow(SECOND)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = pad(hour12 ? now.getHours() % 12 || 12 : now.getHours())
  const minutes = pad(now.getMinutes())

  return (
    <div className="clock clock-dotmatrix" role="img" aria-label={`${hours}:${minutes}`}>
      <Glyph pattern={GLYPHS[hours[0]]} />
      <Glyph pattern={GLYPHS[hours[1]]} />
      <span className={now.getSeconds() % 2 === 0 ? '' : 'dm-dim'}>
        <Glyph pattern={COLON} />
      </span>
      <Glyph pattern={GLYPHS[minutes[0]]} />
      <Glyph pattern={GLYPHS[minutes[1]]} />
      {hour12 && <span className="clock-suffix">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>}
    </div>
  )
}
