import { useEffect, useState } from 'react'

const WORK = 25 * 60
const BREAK = 5 * 60

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function TimerWidget() {
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [left, setLeft] = useState(WORK)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
      // Session finished — switch mode and stop.
      const next = mode === 'work' ? 'break' : 'work'
      setMode(next)
      setLeft(next === 'work' ? WORK : BREAK)
      setRunning(false)
      return
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(id)
  }, [running, left, mode])

  const total = mode === 'work' ? WORK : BREAK
  const reset = () => {
    setRunning(false)
    setLeft(total)
  }
  const switchMode = () => {
    const next = mode === 'work' ? 'break' : 'work'
    setMode(next)
    setLeft(next === 'work' ? WORK : BREAK)
    setRunning(false)
  }
  const pct = Math.round(((total - left) / total) * 100)

  return (
    <div className="card timer-card">
      <div className="widget-head">
        <span className="widget-label">Focus timer</span>
        <button className="mode-pill" onClick={switchMode}>
          {mode === 'work' ? 'Focus' : 'Break'}
        </button>
      </div>
      <div className="timer-time">{mmss(left)}</div>
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="timer-actions">
        <button className="btn-pill" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}
