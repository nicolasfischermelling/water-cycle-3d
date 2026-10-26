import { useStore } from '../store'
import { addDays, fmtDay, fmtShort, isoToDateStr, mondayOf, todayStr, weekOf, weekStartOf } from '../lib/dates'
import { phaseOf } from '../lib/defaults'
import { cardioInWeekStart, deloadStatus, sessionsInWeekStart } from '../lib/logic'
import { IconArrow, IconCheck, IconChevronRight } from './Icons'
import { useT } from '../i18n'

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
  const { t, lang } = useT()
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
            {started ? `${t(phase.name)} · ${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}` : t('Program not started')}
          </div>
          <h1>
            {started ? (
              <>
                {t('Week {n}', { n: String(week).padStart(2, '0') })}
                {week <= 24 && <span className="of"> / 24</span>}
              </>
            ) : (
              <>{t('Starts {date}', { date: fmtDay(weekStartOf(state.settings.startDate, 1)) })}</>
            )}
          </h1>
        </div>
        <div className="headtools">
          <div className="langswitch" role="group" aria-label="Language">
            {(['en', 'es'] as const).map((l) => (
              <button key={l} className={lang === l ? 'on' : ''} onClick={() => update((s) => ({ ...s, settings: { ...s.settings, lang: l } }))}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="iconlink" onClick={() => goTab('program')}>
            {t('Program')} <IconChevronRight />
          </button>
        </div>
      </header>

      {state.active && (
        <section className="notice live">
          <div>
            <div className="eyebrow">{t('In progress')}</div>
            <b>{state.active.dayName}</b>
          </div>
          <button className="btn primary sm" onClick={onResume}>
            {t('Resume')}
          </button>
        </section>
      )}

      {dl.isDeloadWeek && (
        <section className="notice warn">
          <div>
            <div className="eyebrow">{t('Deload week')}</div>
            <p>{t('Sets cut by about 40%. Keep the loads, leave reps in reserve.')}</p>
          </div>
          <button className="textbtn" onClick={cancelDeload}>
            {t('Cancel')}
          </button>
        </section>
      )}
      {dl.due && (
        <section className="notice warn stack">
          <div>
            <div className="eyebrow">{t('Deload recommended')}</div>
            <p>{t('{n} training weeks since your last deload. Cut sets by about 40% this week?', { n: dl.weeksSince })}</p>
          </div>
          <div className="row gap">
            <button className="btn primary sm" onClick={accept}>
              {t('Accept deload')}
            </button>
            <button className="btn ghost sm" onClick={postpone} disabled={!dl.canPostpone}>
              {dl.canPostpone ? t('Postpone') : t('Cannot postpone')}
            </button>
          </div>
        </section>
      )}

      {!state.active && (
        <section className="hero">
          {next ? (
            <>
              <div className="eyebrow">{t('Next session')}{dl.isDeloadWeek ? ` · ${t('deload')}` : ''}</div>
              <div className="hero-title">{t(next.name)}</div>
              <div className="hero-meta">
                <span>{t('{n} exercises', { n: next.exercises.length })}</span>
                <span>~90 min</span>
              </div>
              <button className="btn primary wide lg" onClick={() => onQuickStart(next.id)}>
                {t('Start workout')} <IconArrow />
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">{t('Week complete')}</div>
              <div className="hero-title">{t('All four sessions done')}</div>
              <div className="hero-meta">
                <span>{t('Add cardio or repeat any day below')}</span>
              </div>
            </>
          )}
        </section>
      )}

      <section className="stats">
        <div>
          <div className="eyebrow">{t('Lifting')}</div>
          <div className="num">
            {done.length}
            <span>/4</span>
          </div>
          <Segs n={done.length} total={4} />
        </div>
        <div>
          <div className="eyebrow">{t('Cardio')}</div>
          <div className="num">
            {cardio.length}
            <span>/3</span>
          </div>
          <Segs n={cardio.length} total={3} />
        </div>
      </section>

      <h2 className="sec">{t('This week')}</h2>
      <section className="list">
        {state.plan.map((d, i) => {
          const s = done.find((x) => x.dayId === d.id)
          return (
            <div className="li" key={d.id}>
              <span className={`dot ${s ? 'on' : ''}`}>{s ? <IconCheck size={14} /> : i + 1}</span>
              <div className="grow">
                <div className="li-title">{t(d.name)}</div>
                <div className="muted sm">{s ? t('Done {date}', { date: fmtDay(isoToDateStr(s.date)) }) : t('{n} exercises', { n: d.exercises.length })}</div>
              </div>
              <button className="textbtn" onClick={() => onPreview(d.id)} disabled={!!state.active}>
                {s ? t('Repeat') : t('Preview')}
              </button>
            </div>
          )
        })}
      </section>

      <h2 className="sec">{t('Cardio')}</h2>
      <section className="list">
        {cardio.length === 0 && <div className="li muted sm">{t('Nothing logged. Target: 2 Zone 2 sessions plus 1 optional.')}</div>}
        {cardio.map((c) => (
          <div key={c.id} className="li">
            <div className="grow">
              <div className="li-title cap">{t(c.type)}</div>
              <div className="muted sm">{fmtDay(c.date)}</div>
            </div>
            <div className="right">
              <div className="mono">{c.minutes} min</div>
              <div className="muted sm">{c.mode === 'zone2' ? t('Zone 2') : t('Intervals')}</div>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
