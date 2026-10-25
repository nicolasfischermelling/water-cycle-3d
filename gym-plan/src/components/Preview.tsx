import { useState } from 'react'
import type { DayDef } from '../types'
import { useStore } from '../store'
import { fmtDay, isoToDateStr, todayStr, weekOf } from '../lib/dates'
import { deloadSets, deloadStatus, lastPerformance, suggest } from '../lib/logic'

export const fmtSets = (sets: { weight: number | null; reps: number | null; rir: number | null; done: boolean }[], timed: boolean) =>
  sets
    .filter((s) => s.done)
    .map((s) => (timed ? `${s.reps ?? 0}s` : s.weight ? `${s.weight}×${s.reps ?? 0}` : `${s.reps ?? 0} reps`))
    .join(' · ')

interface Props {
  day: DayDef
  onBack: () => void
  onBegin: (overrides: Record<string, number | null>) => void
}

export default function Preview({ day, onBack, onBegin }: Props) {
  const { state } = useStore()
  const week = weekOf(state.settings.startDate, todayStr())
  const deload = deloadStatus(state, week).isDeloadWeek
  const rows = day.exercises.map((def) => {
    const last = lastPerformance(state.sessions, def.name)
    return { def, last, sug: suggest(def, last) }
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
        <header className="hdr">
          <button className="link" onClick={onBack}>
            ‹ Back
          </button>
          <h1>{day.name}</h1>
          <span />
        </header>
        <p className="muted">Review the suggested loads. Edit any weight to override it.</p>
        {deload && <div className="card warn">Deload week: sets reduced by ~40%.</div>}
        {rows.map(({ def, last, sug }) => (
          <div className="card" key={def.id}>
            <div className="row between">
              <div>
                <div className="title">{def.name}</div>
                <div className="muted">
                  {deload ? deloadSets(def.sets) : def.sets} × {def.repMin === def.repMax ? def.repMax : `${def.repMin}–${def.repMax}`}
                  {def.timed ? ' s' : ''}
                  {def.note ? ` · ${def.note}` : ''}
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
            <div className={`chip ${sug.increase ? 'up' : ''}`}>{sug.text}</div>
            {last && (
              <div className="muted small">
                Last {fmtDay(isoToDateStr(last.session.date))}: {fmtSets(last.log.sets, last.log.timed)}
              </div>
            )}
          </div>
        ))}
        <button className="btn primary wide sticky" onClick={begin}>
          Begin workout
        </button>
      </main>
    </div>
  )
}
