import { useState } from 'react'
import { useStore } from '../store'
import { uid } from '../lib/defaults'
import { fmtDay, mondayOf, todayStr } from '../lib/dates'
import { cardioInWeekStart } from '../lib/logic'
import { IconClose } from './Icons'
import { useT } from '../i18n'
import type { CardioMode, CardioType } from '../types'

export default function Cardio() {
  const { state, update } = useStore()
  const { t } = useT()
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
      <header className="top">
        <h1>{t('Cardio')}</h1>
      </header>
      <div className="card">
        <b>
          {week.length === 1 ? t('This week: {n} session', { n: week.length }) : t('This week: {n} sessions', { n: week.length })}
        </b>
        <div className="muted">{t('Zone 2: {z}/2 · Target 2 Zone 2 (30–45 min) + 1 optional', { z: z2 })}</div>
      </div>
      <div className="card form">
        <div className="seg">
          {(['run', 'pool', 'other'] as CardioType[]).map((ty) => (
            <button key={ty} className={type === ty ? 'on' : ''} onClick={() => setType(ty)}>
              {t(ty)}
            </button>
          ))}
        </div>
        <div className="seg">
          <button className={mode === 'zone2' ? 'on' : ''} onClick={() => setMode('zone2')}>
            {t('Zone 2')}
          </button>
          <button className={mode === 'intervals' ? 'on' : ''} onClick={() => setMode('intervals')}>
            {t('Intervals')}
          </button>
        </div>
        <div className="grid3">
          <label className="field">
            {t('Date')}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            {t('Minutes')}
            <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </label>
          <label className="field">
            {t('Avg HR')}
            <input type="number" inputMode="numeric" placeholder={t('optional')} value={hr} onChange={(e) => setHr(e.target.value)} />
          </label>
        </div>
        <label className="field">
          {t('Notes')}
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('optional')} />
        </label>
        <button className="btn primary wide" onClick={save}>
          {t('Log cardio')}
        </button>
      </div>
      <h2 className="sec">{t('History')}</h2>
      {[...state.cardio].reverse().map((c) => (
        <div className="card row between" key={c.id}>
          <div>
            <div className="title">
              {fmtDay(c.date)} · {t(c.type)}
            </div>
            <div className="muted">
              {c.minutes} min · {c.mode === 'zone2' ? t('Zone 2') : t('Intervals')}
              {c.avgHr ? ` · ${c.avgHr} bpm` : ''}
              {c.notes ? ` · ${c.notes}` : ''}
            </div>
          </div>
          <button className="pillbtn danger icon" onClick={() => confirm(t('Delete this entry?')) && update((s) => ({ ...s, cardio: s.cardio.filter((x) => x.id !== c.id) }))}>
            <IconClose />
          </button>
        </div>
      ))}
      {state.cardio.length === 0 && <div className="muted">{t('Nothing logged yet.')}</div>}
    </>
  )
}
