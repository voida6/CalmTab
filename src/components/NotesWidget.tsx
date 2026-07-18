import { useStoredState } from '../hooks/useStoredState'

// Free-form scratchpad. Persisted (and synced across tabs) automatically.
export function NotesWidget() {
  const [notes, setNotes] = useStoredState<string>('notes', '')
  return (
    <div className="card notes-card">
      <div className="widget-label">Notes</div>
      <textarea
        className="notes-input"
        value={notes}
        placeholder="Jot something down…"
        rows={4}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  )
}
