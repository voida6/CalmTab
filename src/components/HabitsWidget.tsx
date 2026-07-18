import { useEffect, useRef, useState } from 'react'
import { useStoredState } from '../hooks/useStoredState'
import { uid, type HabitItem } from '../lib/types'
import { lastNDays, localDateStr } from '../lib/dates'
import { CheckIcon, PlusIcon, XIcon } from './Icons'

function streak(history: string[]): number {
  const set = new Set(history)
  let n = 0
  const d = new Date()
  if (!set.has(localDateStr())) d.setDate(d.getDate() - 1)
  for (;;) {
    if (!set.has(localDateStr(d))) break
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function HabitsWidget() {
  const [habits, setHabits] = useStoredState<HabitItem[]>('habits', [])
  const [draft, setDraft] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const today = localDateStr()
  const days = lastNDays(7)

  useEffect(() => {
    if (showAdd) inputRef.current?.focus()
  }, [showAdd])

  const add = () => {
    const name = draft.trim()
    if (!name) return
    setHabits((prev) => [...prev, { id: uid(), name, history: [] }])
    setDraft('')
    setShowAdd(false)
  }
  const toggle = (id: string) =>
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, history: h.history.includes(today) ? h.history.filter((d) => d !== today) : [...h.history, today] }
          : h,
      ),
    )
  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id))

  return (
    <div className="card habits-card">
      <div className="widget-head">
        <span className="widget-label">Habits</span>
        <button className="btn-ghost" onClick={() => setShowAdd((s) => !s)} aria-label="Add habit">
          <PlusIcon />
        </button>
      </div>
      {habits.map((h) => {
        const done = h.history.includes(today)
        const s = streak(h.history)
        return (
          <div className="habit-row" key={h.id}>
            <button
              className={`todo-check ${done ? 'on' : ''}`}
              onClick={() => toggle(h.id)}
              aria-label={done ? 'Undo' : 'Mark done'}
            >
              {done && <CheckIcon />}
            </button>
            <span className={`habit-name ${done ? 'is-done' : ''}`}>{h.name}</span>
            <div className="habit-dots" title={`${s}-day streak`}>
              {days.map((d) => (
                <span key={d} className={`habit-dot${h.history.includes(d) ? ' done' : ''}`} />
              ))}
            </div>
            <button className="btn-ghost habit-del" onClick={() => remove(h.id)} aria-label="Remove habit">
              <XIcon size={14} />
            </button>
          </div>
        )
      })}
      {showAdd && (
        <div className="row" style={{ marginTop: 6 }}>
          <input
            ref={inputRef}
            className="mini-input"
            placeholder="Add a habit…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
              if (e.key === 'Escape') { setDraft(''); setShowAdd(false) }
            }}
          />
          <button className="btn-pill" onClick={add} aria-label="Confirm">
            <PlusIcon />
          </button>
        </div>
      )}
    </div>
  )
}
