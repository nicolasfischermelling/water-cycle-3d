import { useStore } from '../store'
import { PHASES, phaseOf } from '../lib/defaults'
import { addDays, fmtShort, todayStr, weekOf, weekStartOf } from '../lib/dates'
import { useT } from '../i18n'
import { cardioInWeekStart, deloadStatus, sessionsInWeekStart } from '../lib/logic'

export default function Program() {
  const { state } = useStore()
  const { t } = useT()
  const cur = weekOf(state.settings.startDate, todayStr())
  const dl = deloadStatus(state, Math.max(1, cur))
  return (
    <>
      <header className="top">
        <div>
          <h1>{t('24-week program')}</h1>
          <div className="muted">
            {cur < 1 ? t('Not started') : cur > 24 ? t('Program complete') : t('Now: week {n} · {phase}', { n: cur, phase: t(phaseOf(cur).name) })}
          </div>
        </div>
      </header>
      <div className="card">
        {PHASES.map((p) => (
          <div key={p.name} className="phase">
            <b>
              {t('Weeks {a}–{b} · {name}', { a: p.from, b: p.to, name: t(p.name) })}
            </b>
            <div className="muted">{t(p.desc)}</div>
          </div>
        ))}
        <div className="muted sm">{t('Next deload due around week {n} (every {k} weeks, postpone up to 8).', { n: dl.nextDueWeek, k: state.settings.deloadEvery })}</div>
      </div>
      {Array.from({ length: 24 }, (_, i) => i + 1).map((w) => {
        const ws = weekStartOf(state.settings.startDate, w)
        const lift = sessionsInWeekStart(state.sessions, ws).length
        const cardio = cardioInWeekStart(state, ws).length
        const isDeload = state.deloads.includes(w)
        const past = w < cur
        return (
          <div key={w} className={`card weekrow ${w === cur ? 'now' : ''} ${past ? 'past' : ''}`}>
            <div className="wk">{t('W{n}', { n: w })}</div>
            <div className="grow">
              <div>
                <b>{t(phaseOf(w).name)}</b>
                {isDeload && <span className="tag">{t('Deload')}</span>}
                {!isDeload && w === dl.nextDueWeek && w >= cur && <span className="tag soft">{t('Deload due')}</span>}
              </div>
              <div className="muted sm">
                {fmtShort(ws)} – {fmtShort(addDays(ws, 6))}
              </div>
            </div>
            <div className="muted sm right">
              {w <= cur ? t('Lift {n}/4', { n: lift }) : ''}
              <br />
              {w <= cur ? t('Cardio {n}', { n: cardio }) : ''}
            </div>
          </div>
        )
      })}
    </>
  )
}
