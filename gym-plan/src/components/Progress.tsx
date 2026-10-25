import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { uid } from '../lib/defaults'
import { addDays, fmtShort, mondayOf, parseDate, todayStr, weekOf } from '../lib/dates'
import { cardioInWeekStart, exerciseHistory, loggedExerciseNames, sessionsInWeekStart, weeklyVolume } from '../lib/logic'
import { MUSCLES } from '../types'
import LineChart from './LineChart'

export default function Progress() {
  const { state, update } = useStore()
  const names = useMemo(() => loggedExerciseNames(state.sessions), [state.sessions])
  const [sel, setSel] = useState('')
  const exName = sel && names.includes(sel) ? sel : names[0] ?? ''
  const hist = exName ? exerciseHistory(state.sessions, exName) : []

  const thisWeek = mondayOf(todayStr())
  const [off, setOff] = useState(0)
  const ws = addDays(thisWeek, off * 7)
  const vol = weeklyVolume(state.sessions, ws)
  const maxSets = Math.max(20, ...MUSCLES.map((m) => vol[m].sets))

  const [bw, setBw] = useState('')
  const [bwDate, setBwDate] = useState(todayStr())
  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date))
  const target = state.settings.targetKg
  const bwPoints = weights.map((w) => ({ x: parseDate(w.date).getTime(), y: w.kg }))
  const lastW = weights[weights.length - 1]
  const targetLine = bwPoints.length
    ? [
        { x: bwPoints[0].x, y: target },
        { x: Math.max(bwPoints[bwPoints.length - 1].x, bwPoints[0].x + 86400000), y: target },
      ]
    : []

  const curWeek = weekOf(state.settings.startDate, todayStr())
  const weeksBack = Math.min(8, Math.max(1, curWeek))
  const adherence = Array.from({ length: weeksBack }, (_, i) => {
    const w = addDays(thisWeek, -(weeksBack - 1 - i) * 7)
    return {
      w,
      lift: sessionsInWeekStart(state.sessions, w).length,
      cardio: cardioInWeekStart(state, w).length,
    }
  })

  const addWeight = () => {
    const kg = Number(bw)
    if (!kg) return
    update((s) => ({ ...s, weights: [...s.weights.filter((x) => x.date !== bwDate), { id: uid(), date: bwDate, kg }] }))
    setBw('')
  }

  return (
    <>
      <header className="hdr">
        <h1>Progress</h1>
      </header>

      <h2>Strength</h2>
      <div className="card">
        {names.length === 0 ? (
          <div className="muted">Finish a workout with weighted sets to see charts.</div>
        ) : (
          <>
            <select className="wideinput" value={exName} onChange={(e) => setSel(e.target.value)}>
              {names.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <LineChart
              series={[
                { label: 'Top weight', color: 'var(--accent)', points: hist.map((h) => ({ x: new Date(h.date).getTime(), y: h.topWeight })) },
                { label: 'Est. 1RM', color: 'var(--blue)', points: hist.map((h) => ({ x: new Date(h.date).getTime(), y: Math.round(h.e1rm * 10) / 10 })) },
              ]}
            />
            <div className="muted small">Estimated 1RM uses Epley: weight × (1 + reps/30), best set per session.</div>
          </>
        )}
      </div>

      <h2>Weekly volume</h2>
      <div className="card">
        <div className="row between">
          <button className="mini" onClick={() => setOff(off - 1)}>
            ‹
          </button>
          <b>
            {fmtShort(ws)} – {fmtShort(addDays(ws, 6))}
            {off === 0 ? ' (this week)' : ''}
          </b>
          <button className="mini" onClick={() => setOff(Math.min(0, off + 1))} disabled={off === 0}>
            ›
          </button>
        </div>
        {MUSCLES.map((m) => (
          <div className="volrow" key={m}>
            <span>{m}</span>
            <div className="bar">
              <div style={{ width: `${(vol[m].sets / maxSets) * 100}%` }} />
            </div>
            <span className="muted">
              {vol[m].sets} sets{vol[m].tonnage ? ` · ${Math.round(vol[m].tonnage).toLocaleString()} kg` : ''}
            </span>
          </div>
        ))}
      </div>

      <h2>Adherence</h2>
      <div className="card">
        {adherence.map((a) => (
          <div className="volrow" key={a.w}>
            <span>{fmtShort(a.w)}</span>
            <div className="bar">
              <div style={{ width: `${Math.min(1, a.lift / 4) * 100}%` }} />
            </div>
            <span className="muted">
              Lift {a.lift}/4 · Cardio {a.cardio}
            </span>
          </div>
        ))}
      </div>

      <h2>Body weight</h2>
      <div className="card">
        <div className="grid3">
          <label className="field">
            Date
            <input type="date" value={bwDate} onChange={(e) => setBwDate(e.target.value)} />
          </label>
          <label className="field">
            kg
            <input type="number" inputMode="decimal" step="0.1" value={bw} onChange={(e) => setBw(e.target.value)} placeholder="e.g. 91.4" />
          </label>
          <button className="btn primary" style={{ alignSelf: 'end' }} onClick={addWeight}>
            Add
          </button>
        </div>
        {lastW && (
          <div className="muted">
            Latest {lastW.kg} kg · {lastW.kg > target ? `${(lastW.kg - target).toFixed(1)} kg above` : `${(target - lastW.kg).toFixed(1)} kg below`} the {target} kg target
          </div>
        )}
        <LineChart
          series={[
            { label: 'Body weight', color: 'var(--accent)', points: bwPoints },
            { label: `Target ${target}`, color: 'var(--amber)', points: targetLine, dashed: true },
          ]}
        />
        {[...weights].reverse().slice(0, 5).map((w) => (
          <div className="row between line" key={w.id}>
            <span>{fmtShort(w.date)}</span>
            <span>
              {w.kg} kg{' '}
              <button className="mini danger" onClick={() => update((s) => ({ ...s, weights: s.weights.filter((x) => x.id !== w.id) }))}>
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
