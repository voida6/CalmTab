import type { TodoItem } from '../lib/types'
import { CheckIcon } from './Icons'

interface Props {
  todos: TodoItem[]
  setTodos: (updater: (prev: TodoItem[]) => TodoItem[]) => void
}

// Pending tasks shown under the greeting (over the wallpaper, so it uses --on-bg).
export function PinnedTasks({ todos, setTodos }: Props) {
  const pending = todos.filter((t) => !t.done).slice(0, 5)
  if (pending.length === 0) return null

  const toggle = (id: string) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)))

  return (
    <div className="pinned-tasks">
      {pending.map((t) => (
        <button key={t.id} className="pinned-task" onClick={() => toggle(t.id)}>
          <span className="pinned-check">
            <CheckIcon size={12} />
          </span>
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  )
}
