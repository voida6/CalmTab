import { useEffect, useState } from 'react'
import { Clock } from './components/Clock'
import { Greeting } from './components/Greeting'
import { WeatherCard } from './components/WeatherCard'
import { SearchBar } from './components/SearchBar'
import { QuoteCard } from './components/QuoteCard'
import { LinksDock } from './components/LinksDock'
import { TodoPanel } from './components/TodoPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { GearIcon, ListIcon, SparkleIcon } from './components/Icons'
import { useStoredState } from './hooks/useStoredState'
import { DEFAULT_LINKS, DEFAULT_SETTINGS, type LinkItem, type Settings, type TodoItem } from './lib/types'

export default function App() {
  const [settings, setSettings] = useStoredState<Settings>('settings', DEFAULT_SETTINGS)
  const [todos, setTodos] = useStoredState<TodoItem[]>('todos', [])
  const [links, setLinks] = useStoredState<LinkItem[]>('links', DEFAULT_LINKS)
  const [panel, setPanel] = useState<'none' | 'todo' | 'settings'>('none')

  // Apply the selected theme to the document root; material.css keys off this.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const openTodos = todos.filter((t) => !t.done).length

  return (
    <div className="app">
      <div className="hero">
        <Clock />
        <Greeting name={settings.name} tagline={settings.tagline} />
      </div>

      <div className="right-col">
        {settings.show.weather && <WeatherCard city={settings.city} units={settings.units} />}
        {settings.show.search && <SearchBar />}
        {settings.show.quote && <QuoteCard />}
      </div>

      {settings.show.dock && <LinksDock links={links} />}

      <button
        className="corner-btn top-left"
        onClick={() => setPanel('todo')}
        title={openTodos ? `${openTodos} open task(s)` : 'Tasks'}
        aria-label="Tasks"
      >
        <ListIcon />
      </button>

      <button
        className="corner-btn bottom-left"
        title="AI assistant (coming soon)"
        aria-label="AI assistant"
        onClick={() => alert('AI assistant is coming in a later update ✨')}
      >
        <SparkleIcon />
      </button>

      <button
        className="corner-btn bottom-right"
        onClick={() => setPanel('settings')}
        title="Settings"
        aria-label="Settings"
      >
        <GearIcon />
      </button>

      {panel === 'todo' && <TodoPanel todos={todos} setTodos={setTodos} onClose={() => setPanel('none')} />}
      {panel === 'settings' && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          links={links}
          setLinks={setLinks}
          onClose={() => setPanel('none')}
        />
      )}
    </div>
  )
}
