import { useStore } from '../store'
import { addDays, fmtDay, fmtShort, isoToDateStr, mondayOf, todayStr, weekOf, weekStartOf } from '../lib/dates'
import { phaseOf } from '../lib/defaults'
import { cardioInWeekStart, deloadStatus, sessionsInWeekStart } from '../lib/logic'
import { IconArrow, IconCheck, IconChevronRight } from './Icons'

interface Props {
  onPreview: (dayId: string) => void
  onQuickStart: (dayId: string) => void
  onResume: () => void
  goTab: (t: 'program') => void
}

export function Segs({ n, total }: { n: number; total: number }) {
  return (
    <div className="segs" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </div>
  )
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
      <header className="top">
        <div>
          <div className="eyebrow">
            {started ? `${phase.name} · ${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}` : 'Program not started'}
          </div>
          <h1>
            {started ? (
              <>
                Week {String(week).padStart(2, '0')}
                {week <= 24 && <span className="of"> / 24</span>}
              </>
            ) : (
              <>Starts {fmtDay(weekStartOf(state.settings.startDate, 1))}</>
            )}
          </h1>
        </div>
        <button className="iconlink" onClick={() => goTab('program')}>
          Program <IconChevronRight />
        </button>
      </header>

      {state.active && (
        <section className="notice live">
          <div>
            <div className="eyebrow">In progress</div>
            <b>{state.active.dayName}</b>
          </div>
          <button className="btn primary sm" onClick={onResume}>
            Resume
          </button>
        </section>
      )}

      {dl.isDeloadWeek && (
        <section className="notice warn">
          <div>
            <div className="eyebrow">Deload week</div>
            <p>Sets cut by about 40%. Keep the loads, leave reps in reserve.</p>
          </div>
          <button className="textbtn" onClick={cancelDeload}>
            Cancel
          </button>
        </section>
      )}
      {dl.due && (
        <section className="notice warn stack">
          <div>
            <div className="eyebrow">Deload recommended</div>
            <p>{dl.weeksSince} training weeks since your last deload. Cut sets by about 40% this week?</p>
          </div>
          <div className="row gap">
            <button className="btn primary sm" onClick={accept}>
              Accept deload
            </button>
            <button className="btn ghost sm" onClick={postpone} disabled={!dl.canPostpone}>
              {dl.canPostpone ? 'Postpone' : 'Cannot postpone'}
            </button>
          </div>
        </section>
      )}

      {!state.active && (
        <section className="hero">
          {next ? (
            <>
              <div className="eyebrow">Next session{dl.isDeloadWeek ? ' · deload' : ''}</div>
              <div className="hero-title">{next.name}</div>
              <div className="hero-meta">
                <span>{next.exercises.length} exercises</span>
                <span>~90 min</span>
              </div>
              <button className="btn primary wide lg" onClick={() => onQuickStart(next.id)}>
                Start workout <IconArrow />
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">Week complete</div>
              <div className="hero-title">All four sessions done</div>
              <div className="hero-meta">
                <span>Add cardio or repeat any day below</span>
              </div>
            </>
          )}
        </section>
      )}

      <section className="stats">
        <div>
          <div className="eyebrow">Lifting</div>
          <div className="num">
            {done.length}
            <span>/4</span>
          </div>
          <Segs n={done.length} total={4} />
        </div>
        <div>
          <div className="eyebrow">Cardio</div>
          <div className="num">
            {cardio.length}
            <span>/3</span>
          </div>
          <Segs n={cardio.length} total={3} />
        </div>
      </section>

      <h2 className="sec">This week</h2>
      <section className="list">
        {state.plan.map((d, i) => {
          const s = done.find((x) => x.dayId === d.id)
          return (
            <div className="li" key={d.id}>
              <span className={`dot ${s ? 'on' : ''}`}>{s ? <IconCheck size={14} /> : i + 1}</span>
              <div className="grow">
                <div className="li-title">{d.name}</div>
                <div className="muted sm">{s ? `Done ${fmtDay(isoToDateStr(s.date))}` : `${d.exercises.length} exercises`}</div>
              </div>
              <button className="textbtn" onClick={() => onPreview(d.id)} disabled={!!state.active}>
                {s ? 'Repeat' : 'Preview'}
              </button>
            </div>
          )
        })}
      </section>

      <h2 className="sec">Cardio</h2>
      <section className="list">
        {cardio.length === 0 && <div className="li muted sm">Nothing logged. Target: 2 Zone 2 sessions plus 1 optional.</div>}
        {cardio.map((c) => (
          <div key={c.id} className="li">
            <div className="grow">
              <div className="li-title cap">{c.type}</div>
              <div className="muted sm">{fmtDay(c.date)}</div>
            </div>
            <div className="right">
              <div className="mono">{c.minutes} min</div>
              <div className="muted sm">{c.mode === 'zone2' ? 'Zone 2' : 'Intervals'}</div>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
