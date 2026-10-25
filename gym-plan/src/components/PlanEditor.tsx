import { useState } from 'react'
import { useStore } from '../store'
import { defaultPlan, uid } from '../lib/defaults'
import { MUSCLES, type ExerciseDef } from '../types'

export default function PlanEditor() {
  const { state, update } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const [edit, setEdit] = useState<string | null>(null)

  const patchDay = (dayId: string, fn: (ex: ExerciseDef[]) => ExerciseDef[]) =>
    update((s) => ({ ...s, plan: s.plan.map((d) => (d.id === dayId ? { ...d, exercises: fn(d.exercises) } : d)) }))
  const patchEx = (dayId: string, id: string, p: Partial<ExerciseDef>) =>
    patchDay(dayId, (xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)))

  return (
    <>
      <header className="hdr">
        <h1>Plan</h1>
      </header>
      <p className="muted">Tap a day, then an exercise to rename, swap, or change sets and rep range. Changes apply to future workouts.</p>
      {state.plan.map((day) => (
        <div className="card" key={day.id}>
          <button className="row between plain" onClick={() => setOpen(open === day.id ? null : day.id)}>
            <span className="title">{day.name}</span>
            <span className="muted">{day.exercises.length} exercises {open === day.id ? '▲' : '▼'}</span>
          </button>
          {open === day.id && (
            <>
              <label className="field">
                Day name
                <input
                  value={day.name}
                  onChange={(e) => update((s) => ({ ...s, plan: s.plan.map((d) => (d.id === day.id ? { ...d, name: e.target.value } : d)) }))}
                />
              </label>
              {day.exercises.map((x, i) => (
                <div className="exrow" key={x.id}>
                  <button className="plain row between" onClick={() => setEdit(edit === x.id ? null : x.id)}>
                    <span>
                      <b>{x.name || 'Unnamed'}</b>
                      <span className="muted">
                        {' '}
                        · {x.sets}×{x.repMin === x.repMax ? x.repMax : `${x.repMin}–${x.repMax}`}
                        {x.timed ? 's' : ''}
                      </span>
                    </span>
                    <span className="muted">{edit === x.id ? '▲' : '✎'}</span>
                  </button>
                  {edit === x.id && (
                    <div className="form">
                      <label className="field">
                        Name
                        <input value={x.name} onChange={(e) => patchEx(day.id, x.id, { name: e.target.value })} />
                      </label>
                      <div className="grid3">
                        <label className="field">
                          Sets
                          <input type="number" inputMode="numeric" min={1} value={x.sets} onChange={(e) => patchEx(day.id, x.id, { sets: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                        <label className="field">
                          Min {x.timed ? 'sec' : 'reps'}
                          <input type="number" inputMode="numeric" min={1} value={x.repMin} onChange={(e) => patchEx(day.id, x.id, { repMin: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                        <label className="field">
                          Max {x.timed ? 'sec' : 'reps'}
                          <input type="number" inputMode="numeric" min={1} value={x.repMax} onChange={(e) => patchEx(day.id, x.id, { repMax: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                      </div>
                      <div className="grid3">
                        <label className="field">
                          Type
                          <select value={x.kind} onChange={(e) => patchEx(day.id, x.id, { kind: e.target.value as ExerciseDef['kind'] })}>
                            <option value="compound">Compound (2 min rest)</option>
                            <option value="isolation">Isolation (90 s rest)</option>
                          </select>
                        </label>
                        <label className="field">
                          Muscle
                          <select value={x.muscle} onChange={(e) => patchEx(day.id, x.id, { muscle: e.target.value as ExerciseDef['muscle'] })}>
                            {MUSCLES.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Region
                          <select value={x.region} onChange={(e) => patchEx(day.id, x.id, { region: e.target.value as ExerciseDef['region'] })}>
                            <option value="upper">Upper (+2.5 kg)</option>
                            <option value="lower">Lower (+5 kg)</option>
                          </select>
                        </label>
                      </div>
                      <label className="check">
                        <input type="checkbox" checked={!!x.timed} onChange={(e) => patchEx(day.id, x.id, { timed: e.target.checked })} />
                        <span>Timed hold (reps are seconds)</span>
                      </label>
                      <label className="field">
                        Note
                        <input value={x.note ?? ''} onChange={(e) => patchEx(day.id, x.id, { note: e.target.value })} />
                      </label>
                      <div className="row gap">
                        <button className="mini" disabled={i === 0} onClick={() => patchDay(day.id, (xs) => swap(xs, i, i - 1))}>
                          ▲ Up
                        </button>
                        <button className="mini" disabled={i === day.exercises.length - 1} onClick={() => patchDay(day.id, (xs) => swap(xs, i, i + 1))}>
                          ▼ Down
                        </button>
                        <button
                          className="mini danger"
                          onClick={() => {
                            if (confirm(`Remove ${x.name}?`)) patchDay(day.id, (xs) => xs.filter((y) => y.id !== x.id))
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                className="btn ghost wide"
                onClick={() => {
                  const id = uid()
                  patchDay(day.id, (xs) => [
                    ...xs,
                    { id, name: 'New exercise', sets: 3, repMin: 8, repMax: 12, kind: 'isolation', muscle: 'Chest', region: day.focus },
                  ])
                  setEdit(id)
                }}
              >
                + Add exercise
              </button>
            </>
          )}
        </div>
      ))}
      <button
        className="btn ghost wide"
        onClick={() => {
          if (confirm('Reset all four days to the original plan? Logged history is kept.')) update((s) => ({ ...s, plan: defaultPlan() }))
        }}
      >
        Reset plan to original
      </button>
    </>
  )
}

function swap<T>(arr: T[], a: number, b: number) {
  const c = arr.slice()
  ;[c[a], c[b]] = [c[b], c[a]]
  return c
}
