import { useStoredState } from '../hooks/useStoredState'
import { DEFAULT_FOCUS, type FocusState } from '../lib/types'
import { CheckIcon } from './Icons'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FocusWidget() {
  const [focus, setFocus] = useStoredState<FocusState>('focus', DEFAULT_FOCUS)
  const isToday = focus.date === today()
  const text = isToday ? focus.text : ''
  const done = isToday ? focus.done : false

  const update = (patch: Partial<Pick<FocusState, 'text' | 'done'>>) =>
    setFocus({ date: today(), text: patch.text ?? text, done: patch.done ?? done })

  return (
    <div className="card focus-card">
      <div className="widget-head">
        <span className="widget-label">Today&rsquo;s focus</span>
        {text.trim() && (
          <button
            className={`todo-check ${done ? 'on' : ''}`}
            onClick={() => update({ done: !done })}
            aria-label={done ? 'Mark not done' : 'Mark done'}
          >
            {done && <CheckIcon />}
          </button>
        )}
      </div>
      <input
        className={`focus-input ${done ? 'is-done' : ''}`}
        value={text}
        placeholder="What's your focus today?"
        onChange={(e) => update({ text: e.target.value })}
      />
    </div>
  )
}
