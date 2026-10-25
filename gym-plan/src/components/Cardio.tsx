import { useState } from 'react'
import { useStore } from '../store'
import { uid } from '../lib/defaults'
import { fmtDay, mondayOf, todayStr } from '../lib/dates'
import { cardioInWeekStart } from '../lib/logic'
import type { CardioMode, CardioType } from '../types'

export default function Cardio() {
  const { state, update } = useStore()
  const [date, setDate] = useState(todayStr())
  const [type, setType] = useState<CardioType>('run')
  const [mode, setMode] = useState<CardioMode>('zone2')
  const [minutes, setMinutes] = useState('40')
  const [hr, setHr] = useState('')
  const [notes, setNotes] = useState('')

  const week = cardioInWeekStart(state, mondayOf(todayStr()))
  const z2 = week.filter((c) => c.mode === 'zone2').length

  const save = () => {
    const m = Number(minutes)
    if (!m || m <= 0) return
    update((s) => ({
      ...s,
      cardio: [
        ...s.cardio,
        { id: uid(), date, type, mode, minutes: m, avgHr: hr ? Number(hr) : null, notes: notes.trim() },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }))
    setHr('')
    setNotes('')
  }

  return (
    <>
      <header className="hdr">
        <h1>Cardio</h1>
      </header>
      <div className="card">
        <b>
          This week: {week.length} session{week.length === 1 ? '' : 's'}
        </b>
        <div className="muted">Zone 2: {z2}/2 · Target 2 Zone 2 (30–45 min) + 1 optional</div>
      </div>
      <div className="card form">
        <div className="seg">
          {(['run', 'pool', 'other'] as CardioType[]).map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="seg">
          <button className={mode === 'zone2' ? 'on' : ''} onClick={() => setMode('zone2')}>
            Zone 2
          </button>
          <button className={mode === 'intervals' ? 'on' : ''} onClick={() => setMode('intervals')}>
            Intervals
          </button>
        </div>
        <div className="grid3">
          <label className="field">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            Minutes
            <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </label>
          <label className="field">
            Avg HR
            <input type="number" inputMode="numeric" placeholder="optional" value={hr} onChange={(e) => setHr(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
        </label>
        <button className="btn primary wide" onClick={save}>
          Log cardio
        </button>
      </div>
      <h2>History</h2>
      {[...state.cardio].reverse().map((c) => (
        <div className="card row between" key={c.id}>
          <div>
            <div className="title">
              {fmtDay(c.date)} · {c.type}
            </div>
            <div className="muted">
              {c.minutes} min · {c.mode === 'zone2' ? 'Zone 2' : 'Intervals'}
              {c.avgHr ? ` · ${c.avgHr} bpm` : ''}
              {c.notes ? ` · ${c.notes}` : ''}
            </div>
          </div>
          <button className="mini danger" onClick={() => confirm('Delete this entry?') && update((s) => ({ ...s, cardio: s.cardio.filter((x) => x.id !== c.id) }))}>
            ✕
          </button>
        </div>
      ))}
      {state.cardio.length === 0 && <div className="muted">Nothing logged yet.</div>}
    </>
  )
}
