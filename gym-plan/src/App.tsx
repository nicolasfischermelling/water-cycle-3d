import { useEffect, useState, type ReactNode } from 'react'
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
import { useT } from './i18n'
import { IconCalendar, IconChart, IconGear, IconHome, IconPlan, IconPulse } from './components/Icons'

type Tab = 'home' | 'plan' | 'cardio' | 'progress' | 'program' | 'settings'
type View = { name: 'tabs' } | { name: 'preview'; dayId: string } | { name: 'workout' }

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Today', icon: <IconHome /> },
  { id: 'plan', label: 'Plan', icon: <IconPlan /> },
  { id: 'cardio', label: 'Cardio', icon: <IconPulse /> },
  { id: 'progress', label: 'Progress', icon: <IconChart /> },
  { id: 'program', label: 'Program', icon: <IconCalendar /> },
  { id: 'settings', label: 'Data', icon: <IconGear /> },
]

export default function App() {
  const { state, update } = useStore()
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>(state.active ? { name: 'workout' } : { name: 'tabs' })

  // each screen starts at the top, otherwise headers stay scrolled out of view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view.name, tab])

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
      return <Preview day={day} onBack={() => setView({ name: 'tabs' })} onBegin={(o) => startSession(day.id, o)} />
    }
  }

  return (
    <div className="app">
      <main className="page" key={tab}>
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
      <nav className="tabbar" aria-label="Main">
        {TABS.map((tb) => (
          <button key={tb.id} className={tab === tb.id ? 'on' : ''} onClick={() => setTab(tb.id)} aria-current={tab === tb.id}>
            {tb.icon}
            <span>{t(tb.label)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
