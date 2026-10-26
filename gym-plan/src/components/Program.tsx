import { useStore } from '../store'
import { PHASES, phaseOf } from '../lib/defaults'
import { addDays, fmtShort, todayStr, weekOf, weekStartOf } from '../lib/dates'
import { cardioInWeekStart, deloadStatus, sessionsInWeekStart } from '../lib/logic'

export default function Program() {
  const { state } = useStore()
  const cur = weekOf(state.settings.startDate, todayStr())
  const dl = deloadStatus(state, Math.max(1, cur))
  return (
    <>
      <header className="top">
        <div>
          <h1>24-week program</h1>
          <div className="muted">
            {cur < 1 ? 'Not started' : cur > 24 ? 'Program complete' : `Now: week ${cur} · ${phaseOf(cur).name}`}
          </div>
        </div>
      </header>
      <div className="card">
        {PHASES.map((p) => (
          <div key={p.name} className="phase">
            <b>
              Weeks {p.from}–{p.to} · {p.name}
            </b>
            <div className="muted">{p.desc}</div>
          </div>
        ))}
        <div className="muted sm">Next deload due around week {dl.nextDueWeek} (every {state.settings.deloadEvery} weeks, postpone up to 8).</div>
      </div>
      {Array.from({ length: 24 }, (_, i) => i + 1).map((w) => {
        const ws = weekStartOf(state.settings.startDate, w)
        const lift = sessionsInWeekStart(state.sessions, ws).length
        const cardio = cardioInWeekStart(state, ws).length
        const isDeload = state.deloads.includes(w)
        const past = w < cur
        return (
          <div key={w} className={`card weekrow ${w === cur ? 'now' : ''} ${past ? 'past' : ''}`}>
            <div className="wk">W{w}</div>
            <div className="grow">
              <div>
                <b>{phaseOf(w).name}</b>
                {isDeload && <span className="tag">Deload</span>}
                {!isDeload && w === dl.nextDueWeek && w >= cur && <span className="tag soft">Deload due</span>}
              </div>
              <div className="muted sm">
                {fmtShort(ws)} – {fmtShort(addDays(ws, 6))}
              </div>
            </div>
            <div className="muted sm right">
              {w <= cur ? `Lift ${lift}/4` : ''}
              <br />
              {w <= cur ? `Cardio ${cardio}` : ''}
            </div>
          </div>
        )
      })}
    </>
  )
}
