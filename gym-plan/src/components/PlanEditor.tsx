import { useState } from 'react'
import { useStore } from '../store'
import { defaultPlan, uid } from '../lib/defaults'
import { MUSCLES, type ExerciseDef } from '../types'
import { IconChevronDown, IconEdit, IconPlus } from './Icons'
import { muscleKey, useT } from '../i18n'

export default function PlanEditor() {
  const { state, update } = useStore()
  const { t } = useT()
  const [open, setOpen] = useState<string | null>(null)
  const [edit, setEdit] = useState<string | null>(null)

  const patchDay = (dayId: string, fn: (ex: ExerciseDef[]) => ExerciseDef[]) =>
    update((s) => ({ ...s, plan: s.plan.map((d) => (d.id === dayId ? { ...d, exercises: fn(d.exercises) } : d)) }))
  const patchEx = (dayId: string, id: string, p: Partial<ExerciseDef>) =>
    patchDay(dayId, (xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)))

  return (
    <>
      <header className="top">
        <h1>{t('Plan')}</h1>
      </header>
      <p className="muted">{t('Tap a day, then an exercise to rename, swap, or change sets and rep range. Changes apply to future workouts.')}</p>
      {state.plan.map((day) => (
        <div className="card" key={day.id}>
          <button className="row between plain" onClick={() => setOpen(open === day.id ? null : day.id)}>
            <span className="title">{t(day.name)}</span>
            <span className="muted sm row gap0">
              {t('{n} exercises', { n: day.exercises.length })} <IconChevronDown open={open === day.id} />
            </span>
          </button>
          {open === day.id && (
            <>
              <label className="field">
                {t('Day name')}
                <input
                  value={t(day.name)}
                  onChange={(e) => update((s) => ({ ...s, plan: s.plan.map((d) => (d.id === day.id ? { ...d, name: e.target.value } : d)) }))}
                />
              </label>
              {day.exercises.map((x, i) => (
                <div className="exrow" key={x.id}>
                  <button className="plain row between" onClick={() => setEdit(edit === x.id ? null : x.id)}>
                    <span>
                      <b>{t(x.name) || t('Unnamed')}</b>
                      <span className="muted">
                        {' '}
                        · {x.sets}×{x.repMin === x.repMax ? x.repMax : `${x.repMin}–${x.repMax}`}
                        {x.timed ? 's' : ''}
                      </span>
                    </span>
                    <span className="muted">{edit === x.id ? <IconChevronDown open /> : <IconEdit />}</span>
                  </button>
                  {edit === x.id && (
                    <div className="form">
                      <label className="field">
                        {t('Name')}
                        <input value={t(x.name)} onChange={(e) => patchEx(day.id, x.id, { name: e.target.value })} />
                      </label>
                      <div className="grid3">
                        <label className="field">
                          {t('Sets')}
                          <input type="number" inputMode="numeric" min={1} value={x.sets} onChange={(e) => patchEx(day.id, x.id, { sets: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                        <label className="field">
                          {t('Min {u}', { u: x.timed ? t('sec') : t('reps') })}
                          <input type="number" inputMode="numeric" min={1} value={x.repMin} onChange={(e) => patchEx(day.id, x.id, { repMin: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                        <label className="field">
                          {t('Max {u}', { u: x.timed ? t('sec') : t('reps') })}
                          <input type="number" inputMode="numeric" min={1} value={x.repMax} onChange={(e) => patchEx(day.id, x.id, { repMax: Math.max(1, Number(e.target.value) || 1) })} />
                        </label>
                      </div>
                      <div className="grid3">
                        <label className="field">
                          {t('Type')}
                          <select value={x.kind} onChange={(e) => patchEx(day.id, x.id, { kind: e.target.value as ExerciseDef['kind'] })}>
                            <option value="compound">{t('Compound (2 min rest)')}</option>
                            <option value="isolation">{t('Isolation (90 s rest)')}</option>
                          </select>
                        </label>
                        <label className="field">
                          {t('Muscle')}
                          <select value={x.muscle} onChange={(e) => patchEx(day.id, x.id, { muscle: e.target.value as ExerciseDef['muscle'] })}>
                            {MUSCLES.map((m) => (
                              <option key={m} value={m}>{t(muscleKey(m))}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          {t('Region')}
                          <select value={x.region} onChange={(e) => patchEx(day.id, x.id, { region: e.target.value as ExerciseDef['region'] })}>
                            <option value="upper">{t('Upper (+2.5 kg)')}</option>
                            <option value="lower">{t('Lower (+5 kg)')}</option>
                          </select>
                        </label>
                      </div>
                      <label className="check">
                        <input type="checkbox" checked={!!x.timed} onChange={(e) => patchEx(day.id, x.id, { timed: e.target.checked })} />
                        <span>{t('Timed hold (reps are seconds)')}</span>
                      </label>
                      <label className="field">
                        {t('Note')}
                        <input value={x.note ? t(x.note) : ''} onChange={(e) => patchEx(day.id, x.id, { note: e.target.value })} />
                      </label>
                      <div className="row gap">
                        <button className="pillbtn" disabled={i === 0} onClick={() => patchDay(day.id, (xs) => swap(xs, i, i - 1))}>
                          {t('Move up')}
                        </button>
                        <button className="pillbtn" disabled={i === day.exercises.length - 1} onClick={() => patchDay(day.id, (xs) => swap(xs, i, i + 1))}>
                          {t('Move down')}
                        </button>
                        <button
                          className="pillbtn danger"
                          onClick={() => {
                            if (confirm(t('Remove {name}?', { name: t(x.name) }))) patchDay(day.id, (xs) => xs.filter((y) => y.id !== x.id))
                          }}
                        >
                          {t('Remove')}
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
                    { id, name: t('New exercise'), sets: 3, repMin: 8, repMax: 12, kind: 'isolation', muscle: 'Chest', region: day.focus },
                  ])
                  setEdit(id)
                }}
              >
                <IconPlus /> {t('Add exercise')}
              </button>
            </>
          )}
        </div>
      ))}
      <button
        className="btn ghost wide"
        onClick={() => {
          if (confirm(t('Reset all four days to the original plan? Logged history is kept.'))) update((s) => ({ ...s, plan: defaultPlan() }))
        }}
      >
        {t('Reset plan to original')}
      </button>
    </>
  )
}

function swap<T>(arr: T[], a: number, b: number) {
  const c = arr.slice()
  ;[c[a], c[b]] = [c[b], c[a]]
  return c
}
