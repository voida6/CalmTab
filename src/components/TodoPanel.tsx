import { useState } from 'react'
import type { TodoItem } from '../lib/types'
import { uid } from '../lib/types'
import { CheckIcon, PlusIcon, XIcon } from './Icons'

interface Props {
  todos: TodoItem[]
  setTodos: (updater: (prev: TodoItem[]) => TodoItem[]) => void
  onClose: () => void
}

export function TodoPanel({ todos, setTodos, onClose }: Props) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const text = draft.trim()
    if (!text) return
    setTodos((prev) => [...prev, { id: uid(), text, done: false }])
    setDraft('')
  }

  const toggle = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id))

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel left">
        <div className="row between">
          <h2>Tasks</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="row">
          <input
            className="search-input"
            style={{ background: 'var(--surface-container)', borderRadius: 12, padding: '10px 12px' }}
            placeholder="Add a task…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="btn-pill" onClick={add} aria-label="Add task">
            <PlusIcon />
          </button>
        </div>

        <div>
          {todos.length === 0 && <div className="muted">Nothing here yet. Add your first task.</div>}
          {todos.map((t) => (
            <div key={t.id} className={`todo-item ${t.done ? 'done' : ''}`}>
              <button
                className={`todo-check ${t.done ? 'on' : ''}`}
                onClick={() => toggle(t.id)}
                aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.done && <CheckIcon />}
              </button>
              <span className="todo-text">{t.text}</span>
              <button className="btn-ghost" onClick={() => remove(t.id)} aria-label="Delete task">
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
