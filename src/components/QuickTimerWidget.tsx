import { useEffect, useState } from 'react'
import { useStoredState } from '../hooks/useStoredState'

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// Short, dependency-free chime when the timer finishes.
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.value = 660
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
    o.start()
    o.stop(ctx.currentTime + 0.72)
    setTimeout(() => ctx.close(), 900)
  } catch {
    /* audio not available — silent */
  }
}

const PRESETS = [5, 10, 15, 25]

export function QuickTimerWidget() {
  const [mins, setMins] = useStoredState('timerMinutes', 5)
  const total = Math.max(1, mins) * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)

  // Keep the clock synced to the chosen minutes while idle (covers the async
  // stored-value load). Gated on `started`, so it never affects a run.
  useEffect(() => {
    if (!started) setLeft(Math.max(1, mins) * 60)
  }, [mins, started])

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      setRunning(false)
      chime()
      return
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(id)
  }, [running, left])

  const done = started && !running && left <= 0
  const pct = total > 0 ? Math.round(((total - left) / total) * 100) : 0
  // Update minutes AND the displayed time together so the edit view never flickers.
  const setM = (v: number) => {
    const nv = Math.min(180, Math.max(1, v))
    setMins(nv)
    setLeft(nv * 60)
  }
  // Reset: restart the same duration in place. Clear: stop and return to setup.
  const restart = () => {
    setRunning(false)
    setLeft(total)
  }
  const clear = () => {
    setStarted(false)
    setRunning(false)
    setLeft(total)
  }

  return (
    <div className={`card timer-card ${done ? 'is-done' : ''}`}>
      <div className="widget-label">Timer</div>
      <div className="timer-time">{done ? "Time's up" : mmss(left)}</div>

      {!started ? (
        <>
          <div className="timer-edit">
            <button className="step" onClick={() => setM(mins - 1)} aria-label="Decrease minutes">
              −
            </button>
            <span className="timer-mins">{mins} min</span>
            <button className="step" onClick={() => setM(mins + 1)} aria-label="Increase minutes">
              +
            </button>
          </div>
          <div className="timer-presets">
            {PRESETS.map((p) => (
              <button key={p} className={`preset ${mins === p ? 'on' : ''}`} onClick={() => setM(p)}>
                {p}m
              </button>
            ))}
          </div>
          <div className="timer-actions">
            <button
              className="btn-pill"
              onClick={() => {
                setStarted(true)
                setRunning(true)
              }}
            >
              Start
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="timer-bar">
            <div className="timer-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="timer-actions">
            {!done && (
              <button className="btn-pill" onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : 'Resume'}
              </button>
            )}
            <button className="btn-ghost" onClick={restart}>
              Reset
            </button>
            <button className="btn-ghost" onClick={clear}>
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}
