import { useId } from 'react'
import { useT } from '../i18n'

export interface Series {
  label: string
  color: string
  points: { x: number; y: number }[]
  dashed?: boolean
}

const fmtTick = (ts: number, lang: string) => new Date(ts).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

export default function LineChart({ series, height = 200, unit = 'kg' }: { series: Series[]; height?: number; unit?: string }) {
  const { t, lang } = useT()
  const gid = useId().replace(/:/g, '')
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <div className="muted sm">{t('No data yet.')}</div>
  const W = 340
  const H = height
  const pad = { l: 36, r: 8, t: 10, b: 24 }
  let x0 = Math.min(...all.map((p) => p.x))
  let x1 = Math.max(...all.map((p) => p.x))
  if (x0 === x1) {
    x0 -= 86400000
    x1 += 86400000
  }
  let y0 = Math.min(...all.map((p) => p.y))
  let y1 = Math.max(...all.map((p) => p.y))
  const span = Math.max(1, y1 - y0)
  y0 -= span * 0.12
  y1 += span * 0.12
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r)
  const sy = (y: number) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b)
  const ticks = [0, 1, 2, 3].map((i) => y0 + ((y1 - y0) * i) / 3)
  const sorted = (s: Series) => s.points.slice().sort((a, b) => a.x - b.x)
  const area = series.find((s) => !s.dashed)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: area?.color, stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: area?.color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={pad.l - 6} y={sy(t) + 3.5} textAnchor="end" fill="var(--muted)" fontSize="10" fontFamily="var(--mono)">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        <text x={pad.l} y={H - 6} fill="var(--muted)" fontSize="10" fontFamily="var(--mono)">
          {fmtTick(x0, lang)}
        </text>
        <text x={W - pad.r} y={H - 6} textAnchor="end" fill="var(--muted)" fontSize="10" fontFamily="var(--mono)">
          {fmtTick(x1, lang)}
        </text>
        {area && area.points.length > 1 && (
          <polygon
            fill={`url(#${gid})`}
            points={`${sx(sorted(area)[0].x)},${H - pad.b} ${sorted(area)
              .map((p) => `${sx(p.x)},${sy(p.y)}`)
              .join(' ')} ${sx(sorted(area)[sorted(area).length - 1].x)},${H - pad.b}`}
          />
        )}
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={s.dashed ? 1.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? '5 4' : undefined}
              points={sorted(s)
                .map((p) => `${sx(p.x)},${sy(p.y)}`)
                .join(' ')}
            />
            {!s.dashed &&
              s.points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={s.color} stroke="var(--bg)" strokeWidth="1.5" />)}
          </g>
        ))}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} <em>{unit}</em>
          </span>
        ))}
      </div>
    </div>
  )
}
