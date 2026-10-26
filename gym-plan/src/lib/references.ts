/**
 * Strength reference standards: Strength Level, male, 90 kg bodyweight row, 1RM in kg,
 * levels [Beginner, Novice, Intermediate, Advanced, Elite].
 *
 * Values were collected on 2026-10-26 from web search summaries of the "By Bodyweight" tables on
 * strengthlevel.com (the pages themselves could not be opened from the build environment), so they
 * should be spot-checked against the source URL. Strength Level data is user-logged, not age-adjusted.
 * Exercises without a verified equivalent have no entry on purpose.
 */
export type Levels = [number, number, number, number, number]

export interface Reference {
  /** Name of the matching lift on Strength Level */
  label: string
  levels: Levels
  url: string
  /** Dumbbell lifts are per dumbbell (Strength Level convention) */
  perDumbbell?: boolean
}

const sl = (slug: string) => `https://strengthlevel.com/strength-standards/${slug}/kg`

// keyed by lower-cased default exercise name
export const REFERENCES: Record<string, Reference> = {
  'barbell bench press': { label: 'Bench Press', levels: [65, 85, 109, 137, 165], url: sl('bench-press') },
  'pull-up or lat pulldown': { label: 'Lat Pulldown', levels: [52, 70, 92, 116, 142], url: sl('lat-pulldown') },
  'incline dumbbell press': { label: 'Incline Dumbbell Bench Press', levels: [25, 33, 44, 55, 68], url: sl('incline-dumbbell-bench-press'), perDumbbell: true },
  'cable or chest-supported row': { label: 'Seated Cable Row', levels: [53, 72, 96, 122, 150], url: sl('seated-cable-row') },
  'lateral raise': { label: 'Dumbbell Lateral Raise', levels: [6, 11, 18, 27, 37], url: sl('dumbbell-lateral-raise'), perDumbbell: true },
  'triceps pushdown': { label: 'Tricep Pushdown', levels: [25, 41, 62, 87, 115], url: sl('tricep-pushdown') },
  'dumbbell curl': { label: 'Dumbbell Curl', levels: [9, 16, 24, 34, 45], url: sl('dumbbell-curl'), perDumbbell: true },
  'back squat': { label: 'Squat', levels: [87, 115, 148, 186, 226], url: sl('squat') },
  'romanian deadlift': { label: 'Romanian Deadlift', levels: [75, 104, 139, 179, 221], url: sl('romanian-deadlift') },
  'leg press': { label: 'Sled Leg Press', levels: [127, 184, 255, 338, 429], url: sl('sled-leg-press') },
  'standing calf raise': { label: 'Machine Calf Raise', levels: [57, 99, 155, 224, 302], url: sl('calf-raise') },
  'overhead press': { label: 'Military Press', levels: [41, 54, 70, 88, 108], url: sl('military-press') },
  'barbell row': { label: 'Bent Over Row', levels: [56, 75, 99, 125, 154], url: sl('bent-over-row') },
  'machine chest press or cable fly': { label: 'Chest Press (machine)', levels: [45, 68, 98, 132, 171], url: sl('chest-press') },
  'face pull': { label: 'Face Pull', levels: [18, 32, 51, 75, 101], url: sl('face-pull') },
  'ez-bar curl': { label: 'EZ Bar Curl', levels: [28, 38, 51, 65, 80], url: sl('ez-bar-curl') },
  'overhead triceps extension': { label: 'Cable Overhead Tricep Extension', levels: [18, 31, 48, 70, 94], url: sl('cable-overhead-tricep-extension') },
  'deadlift or trap bar': { label: 'Deadlift', levels: [102, 134, 172, 215, 260], url: sl('deadlift') },
  'hip thrust': { label: 'Hip Thrust', levels: [68, 111, 168, 236, 311], url: sl('hip-thrust') },
  'leg curl': { label: 'Lying Leg Curl', levels: [35, 51, 73, 98, 125], url: sl('lying-leg-curl') },
  'seated calf raise': { label: 'Seated Calf Raise', levels: [37, 64, 102, 149, 201], url: sl('seated-calf-raise') },
}

export const LEVEL_NAMES = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'] as const

export const referenceFor = (name: string): Reference | null => REFERENCES[name.trim().toLowerCase()] ?? null

/** Index of the highest level reached (0-4), or -1 when below Beginner. */
export const levelReached = (levels: Levels, e1rm: number) => {
  let idx = -1
  levels.forEach((v, i) => {
    if (e1rm >= v) idx = i
  })
  return idx
}
