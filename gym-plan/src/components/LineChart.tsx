export interface Series {
  label: string
  color: string
  points: { x: number; y: number }[]
  dashed?: boolean
}

const fmtTick = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export default function LineChart({ series, height = 200, unit = 'kg' }: { series: Series[]; height?: number; unit?: string }) {
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <div className="muted">No data yet.</div>
  const W = 340
  const H = height
  const pad = { l: 38, r: 10, t: 10, b: 24 }
  let x0 = Math.min(...all.map((p) => p.x))
  let x1 = Math.max(...all.map((p) => p.x))
  if (x0 === x1) {
    x0 -= 86400000
    x1 += 86400000
  }
  let y0 = Math.min(...all.map((p) => p.y))
  let y1 = Math.max(...all.map((p) => p.y))
  const span = Math.max(1, y1 - y0)
  y0 -= span * 0.1
  y1 += span * 0.1
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r)
  const sy = (y: number) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b)
  const ticks = [0, 1, 2, 3].map((i) => y0 + ((y1 - y0) * i) / 3)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
            <text x={pad.l - 4} y={sy(t) + 4} textAnchor="end" fill="var(--muted)" fontSize="10">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        <text x={pad.l} y={H - 6} fill="var(--muted)" fontSize="10">
          {fmtTick(x0)}
        </text>
        <text x={W - pad.r} y={H - 6} textAnchor="end" fill="var(--muted)" fontSize="10">
          {fmtTick(x1)}
        </text>
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeDasharray={s.dashed ? '5 4' : undefined}
              points={s.points
                .slice()
                .sort((a, b) => a.x - b.x)
                .map((p) => `${sx(p.x)},${sy(p.y)}`)
                .join(' ')}
            />
            {!s.dashed && s.points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} ({unit})
          </span>
        ))}
      </div>
    </div>
  )
}
