import { useEffect, useState } from 'react'
import { useStoredState } from '../hooks/useStoredState'

const WORK = 25 * 60
const BREAK = 5 * 60
const R = 52
const CIRC = 2 * Math.PI * R

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function TimerWidget() {
  const [mode, setMode] = useStoredState<'work' | 'break'>('pomodoroMode', 'work')
  const [left, setLeft] = useStoredState('pomodoroLeft', WORK)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const handler = () => setRunning((r) => !r)
    window.addEventListener('calmtab:focus-timer', handler)
    return () => window.removeEventListener('calmtab:focus-timer', handler)
  }, [])

  useEffect(() => {
    if (!running) return
    if (left <= 0) {
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
  const frac = Math.min(1, Math.max(0, (total - left) / total))
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

  return (
    <div className="card timer-card">
      <div className="widget-head">
        <span className="widget-label">Focus timer</span>
        <button className="mode-pill" onClick={switchMode}>
          {mode === 'work' ? 'Focus' : 'Break'}
        </button>
      </div>
      <div className="timer-ring-wrap">
        <svg className="timer-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="ring-track" cx="60" cy="60" r={R} />
          <circle
            className={`ring-fill ${running ? 'running' : ''}`}
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - frac)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="timer-time">{mmss(left)}</div>
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
