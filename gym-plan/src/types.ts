export type Muscle =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs'
export const MUSCLES: Muscle[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs',
]
export type Kind = 'compound' | 'isolation'
export type Region = 'upper' | 'lower'

export interface ExerciseDef {
  id: string
  name: string
  sets: number
  repMin: number
  repMax: number
  kind: Kind
  muscle: Muscle
  region: Region
  timed?: boolean // reps are seconds
  note?: string
}

export interface DayDef {
  id: string
  name: string
  focus: Region
  exercises: ExerciseDef[]
}

export interface SetLog {
  weight: number | null
  reps: number | null
  rir: number | null
  done: boolean
}

export interface ExerciseLog {
  exId: string
  name: string
  muscle: Muscle
  region: Region
  kind: Kind
  timed: boolean
  note?: string
  target: { sets: number; repMin: number; repMax: number }
  sets: SetLog[]
}

export interface Session {
  id: string
  dayId: string
  dayName: string
  focus: Region
  date: string // ISO timestamp of start
  deload: boolean
  warmup: boolean[]
  exercises: ExerciseLog[]
  finished: boolean
  finishedAt?: string
}

export type CardioType = 'run' | 'pool' | 'other'
export type CardioMode = 'zone2' | 'intervals'
export interface CardioLog {
  id: string
  date: string // YYYY-MM-DD
  type: CardioType
  mode: CardioMode
  minutes: number
  avgHr: number | null
  notes: string
}

export interface WeightLog {
  id: string
  date: string // YYYY-MM-DD
  kg: number
}

export interface Settings {
  startDate: string // YYYY-MM-DD, forced to a Monday
  targetKg: number
  restCompound: number
  restIsolation: number
  deloadEvery: number // 6-8
  lang: 'en' | 'es'
}

export interface AppState {
  version: 1
  plan: DayDef[]
  sessions: Session[]
  active: Session | null
  cardio: CardioLog[]
  weights: WeightLog[]
  settings: Settings
  deloads: number[] // program weeks flagged as deload
  postponedWeek: number | null
}
