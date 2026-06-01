import { useState } from 'react'
import { useStoredState } from '../hooks/useStoredState'
import { uid, type HabitItem } from '../lib/types'
import { CheckIcon, PlusIcon, XIcon } from './Icons'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// Count consecutive days completed, ending today or yesterday.
function streak(history: string[]): number {
  const set = new Set(history)
  let n = 0
  const d = new Date()
  if (!set.has(todayStr())) d.setDate(d.getDate() - 1) // allow streak if today not yet done
  for (;;) {
    const key = d.toISOString().slice(0, 10)
    if (!set.has(key)) break
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function HabitsWidget() {
  const [habits, setHabits] = useStoredState<HabitItem[]>('habits', [])
  const [draft, setDraft] = useState('')
  const today = todayStr()

  const add = () => {
    const name = draft.trim()
    if (!name) return
    setHabits((prev) => [...prev, { id: uid(), name, history: [] }])
    setDraft('')
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
      <div className="widget-label">Habits</div>
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
            {s > 0 && <span className="habit-streak">🔥 {s}</span>}
            <button className="btn-ghost habit-del" onClick={() => remove(h.id)} aria-label="Remove habit">
              <XIcon size={14} />
            </button>
          </div>
        )
      })}
      <div className="row" style={{ marginTop: 6 }}>
        <input
          className="mini-input"
          placeholder="Add a habit…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn-pill" onClick={add} aria-label="Add habit">
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}
