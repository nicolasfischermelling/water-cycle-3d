import { useStore } from '../store'
import { addDays, fmtDay, fmtShort, mondayOf, todayStr, weekOf, weekStartOf } from '../lib/dates'
import { phaseOf } from '../lib/defaults'
import { cardioInWeekStart, deloadStatus, sessionsInWeekStart } from '../lib/logic'
import { isoToDateStr } from '../lib/dates'

interface Props {
  onPreview: (dayId: string) => void
  onQuickStart: (dayId: string) => void
  onResume: () => void
  goTab: (t: 'program') => void
}

export default function Home({ onPreview, onQuickStart, onResume, goTab }: Props) {
  const { state, update } = useStore()
  const today = todayStr()
  const week = weekOf(state.settings.startDate, today)
  const ws = mondayOf(today)
  const phase = phaseOf(week)
  const done = sessionsInWeekStart(state.sessions, ws)
  const cardio = cardioInWeekStart(state, ws)
  const dl = deloadStatus(state, week)
  const doneIds = new Set(done.map((s) => s.dayId))
  const next = state.plan.find((d) => !doneIds.has(d.id))
  const started = week >= 1

  const accept = () => update((s) => ({ ...s, deloads: [...new Set([...s.deloads, week])] }))
  const postpone = () => update((s) => ({ ...s, postponedWeek: week }))
  const cancelDeload = () => update((s) => ({ ...s, deloads: s.deloads.filter((w) => w !== week) }))

  return (
    <>
      <header className="hdr">
        <div>
          <h1>{started ? (week <= 24 ? `Week ${week} of 24` : `Week ${week}`) : 'Starts soon'}</h1>
          <div className="muted">
            {started ? `${phase.name} · ${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}` : `Program starts ${fmtDay(weekStartOf(state.settings.startDate, 1))}`}
          </div>
        </div>
        <button className="link" onClick={() => goTab('program')}>
          Program ›
        </button>
      </header>

      {state.active && (
        <div className="card accent">
          <div className="row between">
            <div>
              <b>Workout in progress</b>
              <div className="muted">{state.active.dayName}</div>
            </div>
            <button className="btn primary" onClick={onResume}>
              Resume
            </button>
          </div>
        </div>
      )}

      {dl.isDeloadWeek && (
        <div className="card warn">
          <b>Deload week</b>
          <div className="muted">Sets are cut by ~40%. Keep loads, leave reps in reserve.</div>
          <button className="btn small ghost" onClick={cancelDeload}>
            Cancel deload
          </button>
        </div>
      )}
      {dl.due && (
        <div className="card warn">
          <b>Deload recommended</b>
          <div className="muted">
            {dl.weeksSince} training weeks since your last deload. Cut sets by ~40% this week?
          </div>
          <div className="row gap">
            <button className="btn primary" onClick={accept}>
              Accept deload
            </button>
            <button className="btn ghost" onClick={postpone} disabled={!dl.canPostpone}>
              {dl.canPostpone ? 'Postpone' : 'Cannot postpone'}
            </button>
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card stat">
          <div className="big">
            {done.length}
            <span>/4</span>
          </div>
          <div className="muted">Lifting this week</div>
          <Bar v={done.length / 4} />
        </div>
        <div className="card stat">
          <div className="big">
            {cardio.length}
            <span>/2–3</span>
          </div>
          <div className="muted">Cardio this week</div>
          <Bar v={Math.min(1, cardio.length / 2)} />
        </div>
      </div>

      {!state.active && (
        <div className="card">
          {next ? (
            <>
              <div className="muted">Next suggested</div>
              <div className="title">{next.name}</div>
              <div className="muted">
                {next.exercises.length} exercises · ~90 min
                {dl.isDeloadWeek ? ' · deload' : ''}
              </div>
              <button className="btn primary wide" onClick={() => onQuickStart(next.id)}>
                Quick start
              </button>
            </>
          ) : (
            <>
              <div className="title">All 4 lifting sessions done</div>
              <div className="muted">Add cardio, rest, or repeat any day below.</div>
            </>
          )}
        </div>
      )}

      <h2>This week</h2>
      {state.plan.map((d) => {
        const s = done.find((x) => x.dayId === d.id)
        return (
          <div className="card row between" key={d.id}>
            <div>
              <div className="title">
                {s ? '✅' : '⬜'} {d.name}
              </div>
              <div className="muted">{s ? `Done ${fmtDay(isoToDateStr(s.date))}` : `${d.exercises.length} exercises`}</div>
            </div>
            <button className="btn ghost" onClick={() => onPreview(d.id)} disabled={!!state.active}>
              {s ? 'Repeat' : 'Preview'}
            </button>
          </div>
        )
      })}

      <h2>Cardio</h2>
      <div className="card">
        {cardio.length === 0 && <div className="muted">None logged this week. Target: 2 Zone 2 sessions + 1 optional.</div>}
        {cardio.map((c) => (
          <div key={c.id} className="row between line">
            <span>
              {fmtDay(c.date)} · {c.type}
            </span>
            <span className="muted">
              {c.minutes} min · {c.mode === 'zone2' ? 'Zone 2' : 'Intervals'}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function Bar({ v }: { v: number }) {
  return (
    <div className="bar">
      <div style={{ width: `${Math.round(Math.min(1, v) * 100)}%` }} />
    </div>
  )
}
