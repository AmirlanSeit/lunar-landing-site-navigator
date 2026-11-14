import { STAT_LABELS } from '../lib/rating'
import { strengthsWeaknesses, type Scenario } from '../lib/tactics'
import { reasonsFor, type Thresholds } from '../lib/verdict'

interface Props {
  ranked: Scenario[]
  planned: Scenario | null
  shiftDays: number | null
  landing: Date
  t: Thresholds
  onTryDate: (d: Date) => void
  onSelect: (id: string) => void
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export function TacticsBoard({ ranked, planned, shiftDays, landing, t, onTryDate, onSelect }: Props) {
  const best = ranked[0]
  if (!best) return null
  const sw = planned ? strengthsWeaknesses(planned, ranked) : null
  const shiftedDate = shiftDays === null ? null : new Date(landing.getTime() + shiftDays * 86400000)

  return (
    <div className="tactics">
      <div className="tactic">
        <h3>Best pick for this date</h3>
        <div className="big">{best.data.site.name} <span className={`verdict ${best.verdict}`}>{best.verdict}</span></div>
        <ul>
          {reasonsFor(best.metrics, t).slice(0, 2).map((r) => <li key={r.text}>{r.text}</li>)}
        </ul>
        <button onClick={() => onSelect(best.data.site.id)}>See why</button>
      </div>

      {planned && (
        <div className="tactic">
          <h3>Your planned site</h3>
          <div className="big">{planned.data.site.name} <span className={`verdict ${planned.verdict}`}>{planned.verdict}</span></div>
          {planned.verdict === 'GO' ? (
            <p>Still a GO on the new date – no change needed.</p>
          ) : shiftDays !== null && shiftedDate ? (
            <>
              <p>
                Becomes <b>GO</b> if you land <b>{Math.abs(shiftDays)} day{Math.abs(shiftDays) === 1 ? '' : 's'} {shiftDays > 0 ? 'later' : 'earlier'}</b>
                {' '}({fmtDate(shiftedDate)}).
              </p>
              <button onClick={() => onTryDate(shiftedDate)}>Try that date</button>
            </>
          ) : (
            <p>No GO date within ±30 days – switch to the best pick or relax the thresholds.</p>
          )}
        </div>
      )}

      {planned && sw && (
        <div className="tactic">
          <h3>Match preview vs. the field</h3>
          <ul>
            {sw.strengths.map((d) => <li key={d.key}>Stronger at <b>{STAT_LABELS[d.key]}</b> (+{Math.round(d.diff)})</li>)}
            {sw.weaknesses.map((d) => <li key={d.key}>Weaker at <b>{STAT_LABELS[d.key]}</b> ({Math.round(d.diff)})</li>)}
            {!sw.strengths.length && !sw.weaknesses.length && <li>About average on every stat.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
