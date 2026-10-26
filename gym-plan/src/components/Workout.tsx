import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { WARMUP } from '../lib/defaults'
import { fmtDay, isoToDateStr } from '../lib/dates'
import { lastPerformance, suggest } from '../lib/logic'
import { primeAudio, restOverAlert } from '../lib/alert'
import { fmtSets } from './Preview'
import type { ExerciseLog } from '../types'
import { IconCheck, IconChevronDown, IconChevronLeft, IconMinus, IconPlus } from './Icons'

const num = (v: string): number | null => (v === '' || isNaN(Number(v)) ? null : Number(v))

export default function Workout({ onExit }: { onExit: () => void }) {
  const { state, update, updateActive } = useStore()
  const active = state.active!
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null)
  const [warmOpen, setWarmOpen] = useState(true)

  // keep the screen awake while lifting
  useEffect(() => {
    let lock: any = null
    const get = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request('screen')
      } catch {
        /* not supported or denied */
      }
    }
    void get()
    const vis = () => document.visibilityState === 'visible' && get()
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      try {
        lock?.release()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const setEx = (i: number, fn: (e: ExerciseLog) => ExerciseLog) =>
    updateActive((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k === i ? fn(e) : e)) }))

  const startRest = (kind: 'compound' | 'isolation') => {
    const sec = kind === 'compound' ? state.settings.restCompound : state.settings.restIsolation
    setRest({ endsAt: Date.now() + sec * 1000, total: sec })
  }

  const warm = WARMUP[active.focus]
  const warmDone = warm.filter((_, i) => active.warmup[i]).length

  const finish = () => {
    const anyDone = active.exercises.some((e) => e.sets.some((s) => s.done))
    if (!anyDone) {
      if (!confirm('No sets are checked. Discard this workout?')) return
      update((s) => ({ ...s, active: null }))
      onExit()
      return
    }
    if (!confirm('Finish workout and save it?')) return
    update((s) => ({
      ...s,
      sessions: [...s.sessions, { ...active, finished: true, finishedAt: new Date().toISOString() }],
      active: null,
    }))
    onExit()
  }

  const discard = () => {
    if (!confirm('Discard this workout? Nothing will be saved.')) return
    update((s) => ({ ...s, active: null }))
    onExit()
  }

  return (
    <div className="app">
      <main className="page workout">
        <header className="top bar">
          <button className="iconlink back" onClick={onExit}>
            <IconChevronLeft /> Home
          </button>
          <button className="textbtn danger" onClick={discard}>
            Discard
          </button>
        </header>
        <div className="titleblock">
          <div className="eyebrow">{active.deload ? 'Deload session' : 'Session'}</div>
          <h1>{active.dayName}</h1>
        </div>

        <section className="card warm">
          <button className="foldhead" onClick={() => setWarmOpen((o) => !o)}>
            <span>
              <span className="eyebrow">Warm-up</span>
              <b className="mono"> {warmDone}/{warm.length}</b>
            </span>
            <IconChevronDown open={warmOpen} />
          </button>
          {warmOpen &&
            warm.map((w, i) => (
              <label className={`check ${active.warmup[i] ? 'on' : ''}`} key={i}>
                <input
                  type="checkbox"
                  checked={!!active.warmup[i]}
                  onChange={(e) =>
                    updateActive((s) => {
                      const wu = warm.map((_, k) => !!s.warmup[k])
                      wu[i] = e.target.checked
                      return { ...s, warmup: wu }
                    })
                  }
                />
                <span className="box">{active.warmup[i] && <IconCheck size={14} />}</span>
                <span>{w}</span>
              </label>
            ))}
        </section>

        {active.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.exId}
            index={i}
            ex={ex}
            onChange={(fn) => setEx(i, fn)}
            onSetDone={() => {
              primeAudio()
              startRest(ex.kind)
            }}
          />
        ))}

        <button className="btn primary wide lg finish" onClick={finish}>
          Finish workout <IconCheck size={18} />
        </button>
        <div style={{ height: rest ? 110 : 20 }} />
      </main>
      {rest && <RestBar rest={rest} onChange={setRest} />}
    </div>
  )
}

function ExerciseCard({
  index,
  ex,
  onChange,
  onSetDone,
}: {
  index: number
  ex: ExerciseLog
  onChange: (fn: (e: ExerciseLog) => ExerciseLog) => void
  onSetDone: () => void
}) {
  const { state } = useStore()
  const last = lastPerformance(state.sessions, ex.name)
  const sug = suggest({ name: ex.name, sets: ex.target.sets, repMax: ex.target.repMax, region: ex.region, timed: ex.timed }, last)
  const lastSets = last?.log.sets.filter((s) => s.done) ?? []
  const target = ex.target.repMin === ex.target.repMax ? `${ex.target.repMax}` : `${ex.target.repMin}–${ex.target.repMax}`

  const patch = (i: number, p: Partial<ExerciseLog['sets'][number]>) =>
    onChange((e) => ({ ...e, sets: e.sets.map((s, k) => (k === i ? { ...s, ...p } : s)) }))

  const toggle = (i: number) => {
    const s = ex.sets[i]
    if (!s.done) {
      const fallback = lastSets[i]?.reps ?? ex.target.repMax
      onChange((e) => ({
        ...e,
        sets: e.sets.map((x, k) => {
          if (k === i) return { ...x, done: true, reps: x.reps ?? fallback }
          if (k === i + 1 && !x.done && x.weight == null && !e.timed) return { ...x, weight: s.weight }
          return x
        }),
      }))
      onSetDone()
    } else {
      patch(i, { done: false })
    }
  }

  const applySuggestion = () => {
    if (sug.weight == null) return
    onChange((e) => ({ ...e, sets: e.sets.map((s) => (s.done ? s : { ...s, weight: sug.weight })) }))
  }

  return (
    <section className="card ex">
      <div className="exhead">
        <span className="idx">{String(index + 1).padStart(2, '0')}</span>
        <div className="grow">
          <div className="title">{ex.name}</div>
          <div className="meta">
            <span className="pill">
              {ex.target.sets} × {target}
              {ex.timed ? ' s' : ''}
            </span>
            {ex.note && <span className="muted sm">{ex.note}</span>}
          </div>
        </div>
      </div>
      {last && (
        <div className="muted sm lastline">
          Last {fmtDay(isoToDateStr(last.session.date))} · <span className="mono">{fmtSets(last.log.sets, last.log.timed)}</span>
        </div>
      )}
      <div className={`hint ${sug.increase ? 'up' : ''}`}>
        <span>{sug.text}</span>
        {sug.weight != null && (
          <button className="textbtn" onClick={applySuggestion}>
            Use {sug.weight} kg
          </button>
        )}
      </div>

      <div className="setgrid head">
        <span>SET</span>
        <span>{ex.timed ? '+KG' : 'KG'}</span>
        <span>{ex.timed ? 'SEC' : 'REPS'}</span>
        <span>RIR</span>
        <span />
      </div>
      {ex.sets.map((s, i) => (
        <div className={`setgrid ${s.done ? 'done' : ''}`} key={i}>
          <span className="sn">{i + 1}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder={lastSets[i]?.weight != null ? String(lastSets[i].weight) : 'kg'}
            value={s.weight ?? ''}
            onChange={(e) => patch(i, { weight: num(e.target.value) })}
          />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder={lastSets[i]?.reps != null ? String(lastSets[i].reps) : String(ex.target.repMax)}
            value={s.reps ?? ''}
            onChange={(e) => patch(i, { reps: num(e.target.value) })}
          />
          <select value={s.rir ?? ''} onChange={(e) => patch(i, { rir: num(e.target.value) })}>
            <option value="">–</option>
            {[0, 1, 2, 3, 4].map((r) => (
              <option key={r} value={r}>
                {r}
                {r === 4 ? '+' : ''}
              </option>
            ))}
          </select>
          <button className={`tick ${s.done ? 'on' : ''}`} onClick={() => toggle(i)} aria-label={`Set ${i + 1} done`}>
            <IconCheck size={22} />
          </button>
        </div>
      ))}
      <div className="row gap">
        <button
          className="pillbtn"
          onClick={() =>
            onChange((e) => ({
              ...e,
              sets: [...e.sets, { weight: e.sets[e.sets.length - 1]?.weight ?? null, reps: null, rir: null, done: false }],
            }))
          }
        >
          <IconPlus /> Set
        </button>
        {ex.sets.length > 1 && (
          <button className="pillbtn" onClick={() => onChange((e) => ({ ...e, sets: e.sets.slice(0, -1) }))}>
            <IconMinus /> Set
          </button>
        )}
      </div>
    </section>
  )
}

function RestBar({
  rest,
  onChange,
}: {
  rest: { endsAt: number; total: number }
  onChange: (r: { endsAt: number; total: number } | null) => void
}) {
  const [, tick] = useState(0)
  const fired = useRef<number | null>(null)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(t)
  }, [])
  const left = Math.ceil((rest.endsAt - Date.now()) / 1000)
  useEffect(() => {
    if (left <= 0 && fired.current !== rest.endsAt) {
      fired.current = rest.endsAt
      restOverAlert()
    }
  })
  const over = left <= 0
  const mm = Math.floor(Math.max(0, left) / 60)
  const ss = String(Math.max(0, left) % 60).padStart(2, '0')
  const pct = Math.max(0, Math.min(1, left / rest.total))
  return (
    <div className={`restbar ${over ? 'over' : ''}`} role="timer">
      <div className="restprog" style={{ width: `${(1 - pct) * 100}%` }} />
      <div className="restrow">
        <div className="restlabel">
          <span className="eyebrow">{over ? 'Rest over' : 'Rest'}</span>
          <div className="clock">{over ? 'GO' : `${mm}:${ss}`}</div>
        </div>
        <button className="pillbtn" onClick={() => onChange({ ...rest, endsAt: rest.endsAt - 15000 })}>
          −15
        </button>
        <button className="pillbtn" onClick={() => onChange({ endsAt: rest.endsAt + 15000, total: rest.total + 15 })}>
          +15
        </button>
        <button className="btn primary sm" onClick={() => onChange(null)}>
          {over ? 'Dismiss' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
