import { LEVEL_NAMES, levelReached, type Reference } from '../lib/references'
import { useT } from '../i18n'

/** Level scale for one lift, with the lifter's estimated 1RM marked on it. */
export default function ReferenceBar({ reference, e1rm }: { reference: Reference; e1rm: number | null }) {
  const { t } = useT()
  const { levels } = reference
  const max = levels[4] * 1.12
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
  const idx = e1rm != null ? levelReached(levels, e1rm) : -2
  const next = idx >= -1 && idx < 4 ? { name: LEVEL_NAMES[idx + 1], kg: levels[idx + 1] } : null

  return (
    <div className="refbar">
      <div className="reftrack">
        {[0, ...levels, max].slice(0, 6).map((from, i, arr) => {
          const to = i < 5 ? [0, ...levels, max][i + 1] : max
          return <i key={i} className={`lv s${i}`} style={{ left: pct(from), width: `calc(${pct(to)} - ${pct(from)})` }} />
        })}
        {e1rm != null && (
          <span className="marker" style={{ left: pct(e1rm) }} aria-label={t('Your est. 1RM')}>
            <b>{Math.round(e1rm)}</b>
          </span>
        )}
      </div>
      <div className="reflevels">
        {levels.map((v, i) => (
          <div key={i} className={idx === i ? 'on' : ''}>
            <span>{t(LEVEL_NAMES[i])}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      {e1rm != null && (
        <div className="refnote">
          {idx === -1 ? t('Below Beginner') : t('Level: {level}', { level: t(LEVEL_NAMES[idx]) })}
          {next && ` · ${t('Next: {level} at {kg} kg', { level: t(next.name), kg: next.kg })}`}
        </div>
      )}
      <div className="refsrc">
        {t('Male, 90 kg bodyweight, 1RM in kg, not age-adjusted.')}
        {reference.perDumbbell ? ` ${t('Per dumbbell.')}` : ''}{' '}
        <a href={reference.url} target="_blank" rel="noreferrer">
          Strength Level · {reference.label}
        </a>
      </div>
    </div>
  )
}
