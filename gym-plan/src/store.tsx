import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppState, Session } from './types'
import { defaultState } from './lib/defaults'
import { mondayOf, setDateLocale } from './lib/dates'

const KEY = 'gymplan.v1'

export function normalizeState(raw: any): AppState {
  const d = defaultState()
  const s: AppState = {
    ...d,
    ...raw,
    settings: { ...d.settings, ...(raw?.settings ?? {}) },
    plan: Array.isArray(raw?.plan) && raw.plan.length ? raw.plan : d.plan,
    sessions: Array.isArray(raw?.sessions) ? raw.sessions : [],
    cardio: Array.isArray(raw?.cardio) ? raw.cardio : [],
    weights: Array.isArray(raw?.weights) ? raw.weights : [],
    deloads: Array.isArray(raw?.deloads) ? raw.deloads : [],
    active: raw?.active ?? null,
    version: 1,
  }
  s.settings.startDate = mondayOf(s.settings.startDate)
  return s
}

function load(): AppState {
  try {
    const t = localStorage.getItem(KEY)
    if (t) return normalizeState(JSON.parse(t))
  } catch {
    /* fall through to defaults */
  }
  return defaultState()
}

interface Store {
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  updateActive: (fn: (s: Session) => Session) => void
  replace: (s: AppState) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  setDateLocale(state.settings.lang)
  useEffect(() => {
    document.documentElement.lang = state.settings.lang
  }, [state.settings.lang])
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked */
    }
  }, [state])
  const store: Store = {
    state,
    update: (fn) => setState((s) => fn(s)),
    updateActive: (fn) => setState((s) => (s.active ? { ...s, active: fn(s.active) } : s)),
    replace: (s) => setState(normalizeState(s)),
  }
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}
