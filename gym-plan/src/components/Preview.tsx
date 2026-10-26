import { useState } from 'react'
import type { DayDef } from '../types'
import { useStore } from '../store'
import { fmtDay, isoToDateStr, todayStr, weekOf } from '../lib/dates'
import { IconArrow, IconChevronLeft } from './Icons'
import { useT, type T } from '../i18n'
import { deloadSets, deloadStatus, lastPerformance, suggest } from '../lib/logic'

export const fmtSets = (sets: { weight: number | null; reps: number | null; rir: number | null; done: boolean }[], timed: boolean, t: T) =>
  sets
    .filter((s) => s.done)
    .map((s) => (timed ? `${s.reps ?? 0}s` : s.weight ? `${s.weight}×${s.reps ?? 0}` : t('{n} reps', { n: s.reps ?? 0 })))
    .join(' · ')

interface Props {
  day: DayDef
  onBack: () => void
  onBegin: (overrides: Record<string, number | null>) => void
}

export default function Preview({ day, onBack, onBegin }: Props) {
  const { state } = useStore()
  const { t } = useT()
  const week = weekOf(state.settings.startDate, todayStr())
  const deload = deloadStatus(state, week).isDeloadWeek
  const rows = day.exercises.map((def) => {
    const last = lastPerformance(state.sessions, def.name)
    return { def, last, sug: suggest(def, last, t) }
  })
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.def.id, r.sug.weight != null ? String(r.sug.weight) : ''])),
  )

  const begin = () => {
    const o: Record<string, number | null> = {}
    for (const r of rows) {
      const v = vals[r.def.id]
      o[r.def.id] = v === '' || v == null || isNaN(Number(v)) ? null : Number(v)
    }
    onBegin(o)
  }

  return (
    <div className="app">
      <main className="page">
        <header className="top">
          <div>
            <button className="iconlink back" onClick={onBack}>
              <IconChevronLeft /> {t('Back')}
            </button>
            <div className="eyebrow">{t('Preview')}</div>
            <h1>{t(day.name)}</h1>
          </div>
        </header>
        <p className="muted sm lead">{t('Review the suggested loads. Edit any weight to override it.')}</p>
        {deload && (
          <section className="notice warn">
            <div>
              <div className="eyebrow">{t('Deload week')}</div>
              <p>{t('Sets reduced by about 40%.')}</p>
            </div>
          </section>
        )}
        {rows.map(({ def, last, sug }, idx) => (
          <div className="card ex" key={def.id}>
            <div className="exhead">
              <span className="idx">{String(idx + 1).padStart(2, '0')}</span>
              <div className="grow">
                <div className="title">{t(def.name)}</div>
                <div className="meta">
                  <span className="pill">
                    {deload ? deloadSets(def.sets) : def.sets} × {def.repMin === def.repMax ? def.repMax : `${def.repMin}–${def.repMax}`}
                    {def.timed ? ' s' : ''}
                  </span>
                  {def.note && <span className="muted sm">{t(def.note)}</span>}
                </div>
              </div>
              {!def.timed && (
                <label className="kgbox">
                  <input
                    inputMode="decimal"
                    value={vals[def.id] ?? ''}
                    placeholder="kg"
                    onChange={(e) => setVals((v) => ({ ...v, [def.id]: e.target.value }))}
                  />
                  <span>kg</span>
                </label>
              )}
            </div>
            <div className={`hint ${sug.increase ? 'up' : ''}`}>{sug.text}</div>
            {last && (
              <div className="muted sm lastline">
                {t('Last {date}', { date: fmtDay(isoToDateStr(last.session.date)) })} · <span className="mono">{fmtSets(last.log.sets, last.log.timed, t)}</span>
              </div>
            )}
          </div>
        ))}
        <div className="dock">
          <button className="btn primary wide lg" onClick={begin}>
            {t('Begin workout')} <IconArrow />
          </button>
        </div>
      </main>
    </div>
  )
}
