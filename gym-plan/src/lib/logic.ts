import type { AppState, DayDef, ExerciseDef, ExerciseLog, Muscle, Session, SetLog } from '../types'
import { MUSCLES } from '../types'
import { addDays, isoToDateStr, mondayOf, weekOf } from './dates'
import { uid } from './defaults'
import { translate, type T } from '../i18n'

export const normName = (s: string) => s.trim().toLowerCase()

// ---------- weeks ----------
export const finishedSessions = (st: AppState) => st.sessions.filter((s) => s.finished)

export const sessionsInWeekStart = (sessions: Session[], weekStart: string) => {
  const end = addDays(weekStart, 6)
  return sessions.filter((s) => {
    const d = isoToDateStr(s.date)
    return s.finished && d >= weekStart && d <= end
  })
}

export const cardioInWeekStart = (st: AppState, weekStart: string) => {
  const end = addDays(weekStart, 6)
  return st.cardio.filter((c) => c.date >= weekStart && c.date <= end)
}

// ---------- deload ----------
export function deloadStatus(st: AppState, week: number) {
  const prev = st.deloads.filter((d) => d < week)
  const lastDeload = prev.length ? Math.max(...prev) : 0
  const weeksSince = week - 1 - lastDeload
  const isDeloadWeek = st.deloads.includes(week)
  const due = !isDeloadWeek && weeksSince >= st.settings.deloadEvery && st.postponedWeek !== week
  return {
    isDeloadWeek,
    due,
    weeksSince,
    canPostpone: weeksSince < 8,
    nextDueWeek: lastDeload + st.settings.deloadEvery + 1,
  }
}

export const deloadSets = (sets: number) => Math.max(1, Math.round(sets * 0.6))

// ---------- history & progression ----------
export interface Last {
  session: Session
  log: ExerciseLog
}

/** Most recent non-deload finished performance of an exercise (matched by name). */
export function lastPerformance(sessions: Session[], name: string): Last | null {
  const key = normName(name)
  const list = sessions
    .filter((s) => s.finished && !s.deload)
    .sort((a, b) => b.date.localeCompare(a.date))
  for (const s of list) {
    const log = s.exercises.find((e) => normName(e.name) === key && e.sets.some((x) => x.done))
    if (log) return { session: s, log }
  }
  return null
}

export interface Suggestion {
  weight: number | null
  text: string
  increase: boolean
}

const tEn: T = (k, p) => translate('en', k, p)

export function suggest(
  def: Pick<ExerciseDef, 'name' | 'sets' | 'repMax' | 'region' | 'timed'>,
  last: Last | null,
  t: T = tEn,
): Suggestion {
  if (!last) {
    return {
      weight: null,
      increase: false,
      text: def.timed
        ? t('No history yet. Start with a hold you can control.')
        : t('No history yet. Pick a load you can lift for the top of the range with 2+ reps in reserve.'),
    }
  }
  const done = last.log.sets.filter((s) => s.done)
  const weights = done.map((s) => s.weight ?? 0)
  const top = Math.max(0, ...weights)
  const allTop = done.length >= def.sets && done.every((s) => (s.reps ?? 0) >= def.repMax)
  const rirOk = done.every((s) => s.rir !== null && s.rir >= 1)
  if (def.timed) {
    return {
      weight: null,
      increase: false,
      text: allTop ? t('Target held on every set. Add 5 s or a small load.') : t('Aim to hold {n} s on every set.', { n: def.repMax }),
    }
  }
  if (allTop && rirOk) {
    const inc = def.region === 'upper' ? 2.5 : 5
    return {
      weight: top + inc,
      increase: true,
      text: t('All sets hit {reps} reps with RIR ≥ 1. Add {inc} kg.', { reps: def.repMax, inc }),
    }
  }
  const repsStr = done.map((s) => s.reps ?? 0).join('/')
  const why = allTop && !rirOk ? t('Top reps hit but RIR missing or 0.') : t('Add reps before adding load.')
  return {
    weight: top > 0 ? top : null,
    increase: false,
    text: `${top > 0 ? t('Keep {w} kg.', { w: top }) : t('Keep load.')} ${why} ${t('Last: {r}.', { r: repsStr })}`,
  }
}

// ---------- sessions ----------
export function buildSession(st: AppState, day: DayDef, week: number, overrides: Record<string, number | null> = {}): Session {
  const deload = deloadStatus(st, week).isDeloadWeek
  const exercises: ExerciseLog[] = day.exercises.map((def) => {
    const sug = suggest(def, lastPerformance(st.sessions, def.name))
    const w = def.id in overrides ? overrides[def.id] : sug.weight
    const nSets = deload ? deloadSets(def.sets) : def.sets
    const sets: SetLog[] = Array.from({ length: nSets }, () => ({
      weight: def.timed ? null : w,
      reps: null,
      rir: null,
      done: false,
    }))
    return {
      exId: def.id,
      name: def.name,
      muscle: def.muscle,
      region: def.region,
      kind: def.kind,
      timed: !!def.timed,
      note: def.note,
      target: { sets: nSets, repMin: def.repMin, repMax: def.repMax },
      sets,
    }
  })
  return {
    id: uid(),
    dayId: day.id,
    dayName: day.name,
    focus: day.focus,
    date: new Date().toISOString(),
    deload,
    warmup: [],
    exercises,
    finished: false,
  }
}

// ---------- stats ----------
export const est1RM = (w: number, reps: number) => (reps <= 1 ? w : w * (1 + reps / 30))

export interface ExPoint {
  date: string
  topWeight: number
  e1rm: number
}

export function exerciseHistory(sessions: Session[], name: string): ExPoint[] {
  const key = normName(name)
  const pts: ExPoint[] = []
  for (const s of sessions.filter((x) => x.finished && !x.deload).sort((a, b) => a.date.localeCompare(b.date))) {
    const log = s.exercises.find((e) => normName(e.name) === key)
    if (!log || log.timed) continue
    const sets = log.sets.filter((x) => x.done && (x.weight ?? 0) > 0 && (x.reps ?? 0) > 0)
    if (!sets.length) continue
    pts.push({
      date: s.date,
      topWeight: Math.max(...sets.map((x) => x.weight!)),
      e1rm: Math.max(...sets.map((x) => est1RM(x.weight!, x.reps!))),
    })
  }
  return pts
}

export const loggedExerciseNames = (sessions: Session[]) => {
  const map = new Map<string, string>()
  for (const s of sessions) {
    if (!s.finished) continue
    for (const e of s.exercises) {
      if (!e.timed && e.sets.some((x) => x.done && (x.weight ?? 0) > 0)) map.set(normName(e.name), e.name)
    }
  }
  return [...map.values()].sort()
}

export function weeklyVolume(sessions: Session[], weekStart: string) {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, { sets: 0, tonnage: 0 }])) as Record<Muscle, { sets: number; tonnage: number }>
  for (const s of sessionsInWeekStart(sessions, weekStart)) {
    for (const e of s.exercises) {
      for (const x of e.sets) {
        if (!x.done) continue
        out[e.muscle].sets += 1
        if (!e.timed) out[e.muscle].tonnage += (x.weight ?? 0) * (x.reps ?? 0)
      }
    }
  }
  return out
}

export const weekIndexNow = (st: AppState, today: string) => weekOf(st.settings.startDate, today)
export const thisMonday = (today: string) => mondayOf(today)
