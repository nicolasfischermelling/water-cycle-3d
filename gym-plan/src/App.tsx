import { useState } from 'react'
import { useStore } from './store'
import { buildSession } from './lib/logic'
import { todayStr, weekOf } from './lib/dates'
import Home from './components/Home'
import Preview from './components/Preview'
import Workout from './components/Workout'
import PlanEditor from './components/PlanEditor'
import Cardio from './components/Cardio'
import Progress from './components/Progress'
import Program from './components/Program'
import Settings from './components/Settings'

type Tab = 'home' | 'plan' | 'cardio' | 'progress' | 'program' | 'settings'
type View = { name: 'tabs' } | { name: 'preview'; dayId: string } | { name: 'workout' }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'program', label: '24 wks', icon: '🗓️' },
  { id: 'settings', label: 'Data', icon: '⚙️' },
]

export default function App() {
  const { state, update } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>(state.active ? { name: 'workout' } : { name: 'tabs' })

  const startSession = (dayId: string, overrides: Record<string, number | null> = {}) => {
    const day = state.plan.find((d) => d.id === dayId)
    if (!day) return
    const week = weekOf(state.settings.startDate, todayStr())
    update((s) => ({ ...s, active: buildSession(s, day, week, overrides) }))
    setView({ name: 'workout' })
  }

  if (view.name === 'workout' && state.active) {
    return <Workout onExit={() => setView({ name: 'tabs' })} />
  }
  if (view.name === 'preview') {
    const day = state.plan.find((d) => d.id === view.dayId)
    if (day) {
      return (
        <Preview
          day={day}
          onBack={() => setView({ name: 'tabs' })}
          onBegin={(o) => startSession(day.id, o)}
        />
      )
    }
  }

  return (
    <div className="app">
      <main className="page">
        {tab === 'home' && (
          <Home
            onPreview={(id) => setView({ name: 'preview', dayId: id })}
            onQuickStart={startSession}
            onResume={() => setView({ name: 'workout' })}
            goTab={setTab}
          />
        )}
        {tab === 'plan' && <PlanEditor />}
        {tab === 'cardio' && <Cardio />}
        {tab === 'progress' && <Progress />}
        {tab === 'program' && <Program />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
