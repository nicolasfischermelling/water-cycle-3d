import { useRef } from 'react'
import { useStore, normalizeState } from '../store'
import { defaultState } from '../lib/defaults'
import { mondayOf, todayStr } from '../lib/dates'

export default function Settings() {
  const { state, update, replace } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const st = state.settings
  const set = (p: Partial<typeof st>) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }))

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gym-plan-backup-${todayStr()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }

  const importData = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      if (!raw || !Array.isArray(raw.plan) || !Array.isArray(raw.sessions)) throw new Error('bad shape')
      if (!confirm(`Replace ALL current data with this backup (${raw.sessions.length} workouts)?`)) return
      replace(normalizeState(raw))
      alert('Backup restored.')
    } catch {
      alert('That file is not a valid Gym Plan backup.')
    }
  }

  return (
    <>
      <header className="top">
        <h1>Settings & data</h1>
      </header>
      <div className="card form">
        <label className="field">
          Program start (any date, snaps to Monday)
          <input type="date" value={st.startDate} onChange={(e) => e.target.value && set({ startDate: mondayOf(e.target.value) })} />
        </label>
        <div className="grid3">
          <label className="field">
            Target kg
            <input type="number" inputMode="decimal" value={st.targetKg} onChange={(e) => set({ targetKg: Number(e.target.value) || 0 })} />
          </label>
          <label className="field">
            Rest: compound (s)
            <input type="number" inputMode="numeric" value={st.restCompound} onChange={(e) => set({ restCompound: Number(e.target.value) || 0 })} />
          </label>
          <label className="field">
            Rest: isolation (s)
            <input type="number" inputMode="numeric" value={st.restIsolation} onChange={(e) => set({ restIsolation: Number(e.target.value) || 0 })} />
          </label>
        </div>
        <label className="field">
          Deload prompt every
          <select value={st.deloadEvery} onChange={(e) => set({ deloadEvery: Number(e.target.value) })}>
            {[6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} weeks
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="sec">Backup</h2>
      <div className="card form">
        <div className="muted">All data lives only on this device. Export a backup regularly.</div>
        <button className="btn primary wide" onClick={exportData}>
          Export backup (JSON)
        </button>
        <button className="btn ghost wide" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importData(f)
            e.target.value = ''
          }}
        />
        <button
          className="btn ghost wide danger"
          onClick={() => {
            if (confirm('Delete ALL data on this device? Export a backup first.') && confirm('Really delete everything?')) replace(defaultState())
          }}
        >
          Erase all data
        </button>
      </div>
    </>
  )
}
