import type { AppState, DayDef, ExerciseDef, Kind, Muscle, Region } from '../types'
import { mondayOf, todayStr } from './dates'

let n = 0
export const uid = () => `${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

const ex = (
  name: string, sets: number, repMin: number, repMax: number,
  kind: Kind, muscle: Muscle, region: Region, extra: Partial<ExerciseDef> = {},
): ExerciseDef => ({ id: uid(), name, sets, repMin, repMax, kind, muscle, region, ...extra })

export const defaultPlan = (): DayDef[] => [
  {
    id: 'day1', name: 'Upper A', focus: 'upper',
    exercises: [
      ex('Barbell bench press', 4, 6, 8, 'compound', 'Chest', 'upper'),
      ex('Pull-up or lat pulldown', 4, 8, 10, 'compound', 'Back', 'upper'),
      ex('Incline dumbbell press', 3, 8, 12, 'compound', 'Chest', 'upper'),
      ex('Cable or chest-supported row', 3, 8, 12, 'compound', 'Back', 'upper'),
      ex('Lateral raise', 3, 12, 15, 'isolation', 'Shoulders', 'upper'),
      ex('Triceps pushdown', 3, 10, 12, 'isolation', 'Triceps', 'upper', { note: 'Superset with curl' }),
      ex('Dumbbell curl', 3, 10, 12, 'isolation', 'Biceps', 'upper', { note: 'Superset with pushdown' }),
      ex('Dead bug', 3, 10, 10, 'isolation', 'Abs', 'upper', { note: 'Reps per side' }),
      ex('Crunch', 3, 15, 15, 'isolation', 'Abs', 'upper'),
    ],
  },
  {
    id: 'day2', name: 'Lower A', focus: 'lower',
    exercises: [
      ex('Back squat', 4, 6, 8, 'compound', 'Quads', 'lower'),
      ex('Romanian deadlift', 3, 8, 10, 'compound', 'Hamstrings', 'lower'),
      ex('Leg press', 3, 10, 12, 'compound', 'Quads', 'lower'),
      ex('Walking lunges', 3, 10, 10, 'compound', 'Quads', 'lower', { note: 'Reps per leg' }),
      ex('Standing calf raise', 4, 10, 15, 'isolation', 'Calves', 'lower'),
      ex('Plank', 3, 40, 40, 'isolation', 'Abs', 'lower', { timed: true }),
      ex('Floor leg raise', 3, 12, 12, 'isolation', 'Abs', 'lower'),
    ],
  },
  {
    id: 'day3', name: 'Upper B', focus: 'upper',
    exercises: [
      ex('Overhead press', 4, 6, 8, 'compound', 'Shoulders', 'upper'),
      ex('Barbell row', 4, 6, 8, 'compound', 'Back', 'upper'),
      ex('Machine chest press or cable fly', 3, 10, 12, 'compound', 'Chest', 'upper'),
      ex('Neutral-grip pulldown', 3, 10, 12, 'compound', 'Back', 'upper'),
      ex('Face pull', 3, 15, 15, 'isolation', 'Shoulders', 'upper'),
      ex('EZ-bar curl', 3, 8, 12, 'isolation', 'Biceps', 'upper', { note: 'Superset with extension' }),
      ex('Overhead triceps extension', 3, 8, 12, 'isolation', 'Triceps', 'upper', { note: 'Superset with curl' }),
      ex('Side plank', 3, 30, 30, 'isolation', 'Abs', 'upper', { timed: true, note: 'Seconds per side' }),
      ex('Bicycle crunch', 3, 20, 20, 'isolation', 'Abs', 'upper'),
    ],
  },
  {
    id: 'day4', name: 'Lower B', focus: 'lower',
    exercises: [
      ex('Deadlift or trap bar', 3, 5, 5, 'compound', 'Hamstrings', 'lower'),
      ex('Hip thrust', 3, 8, 12, 'compound', 'Glutes', 'lower'),
      ex('Bulgarian split squat', 3, 8, 10, 'compound', 'Quads', 'lower', { note: 'Reps per leg' }),
      ex('Leg curl', 3, 10, 12, 'isolation', 'Hamstrings', 'lower'),
      ex('Seated calf raise', 3, 12, 15, 'isolation', 'Calves', 'lower'),
      ex('Reverse crunch', 3, 12, 12, 'isolation', 'Abs', 'lower'),
      ex('Bird-dog', 3, 10, 10, 'isolation', 'Abs', 'lower', { note: 'Reps per side' }),
    ],
  },
]

export const WARMUP: Record<Region, string[]> = {
  upper: [
    '5 min light cardio (bike, rower or brisk walk)',
    'Arm circles and band pull-aparts, 1×15',
    'Scapular push-ups or shoulder dislocates, 1×10',
    '1–2 light ramp-up sets of the first lift',
  ],
  lower: [
    '5 min light cardio (bike, rower or brisk walk)',
    'Hip mobility: 90/90 switches, 1×8 per side',
    'Deep bodyweight squat hold, 2×30 s',
    'Glute bridge, 1×15',
    '1–2 light ramp-up sets of the first lift',
  ],
}

export const PHASES = [
  { from: 1, to: 4, name: 'Foundation', desc: 'Learn the lifts, leave 2–3 reps in reserve.' },
  { from: 5, to: 12, name: 'Build', desc: 'Double progression, add load as ranges are topped.' },
  { from: 13, to: 20, name: 'Intensify', desc: 'Push top sets closer to 1 rep in reserve.' },
  { from: 21, to: 24, name: 'Peak & reassess', desc: 'Hold or beat best numbers, review the physique and plan the next block.' },
]
export const phaseOf = (week: number) =>
  PHASES.find((p) => week >= p.from && week <= p.to) ?? { from: 25, to: 99, name: 'Beyond plan', desc: 'Program complete. Keep progressing or start a new block.' }

export const defaultState = (): AppState => ({
  version: 1,
  plan: defaultPlan(),
  sessions: [],
  active: null,
  cardio: [],
  weights: [],
  settings: {
    startDate: mondayOf(todayStr()),
    targetKg: 88,
    restCompound: 120,
    restIsolation: 90,
    deloadEvery: 6,
  },
  deloads: [],
  postponedWeek: null,
})
