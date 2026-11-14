import { compass, type Neighborhood } from '../lib/neighborhood'
import { STAT_LABELS } from '../lib/rating'
import { strengthsWeaknesses, type Scenario } from '../lib/tactics'
import { formatHours, reasonsFor, type Thresholds } from '../lib/verdict'

interface Props {
  ranked: Scenario[]
  planned: Scenario | null
  shiftDays: number | null
  landing: Date
  /** The planned site evaluated on the original (pre-slip) date, if one was given. */
  before: Scenario | null
  original: Date | null
  /** "Best spot nearby" data for the planned site (polar catalog sites only). */
  nearby: Neighborhood | null
  t: Thresholds
  onTryDate: (d: Date) => void
  onSelect: (id: string) => void
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export function TacticsBoard({ ranked, planned, shiftDays, landing, before, original, nearby, t, onTryDate, onSelect }: Props) {
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
          {before && original && (
            <p className="slip">
              Original date ({fmtDate(original)}): <span className={`verdict ${before.verdict}`}>{before.verdict}</span>
              {' '}→ new date: <span className={`verdict ${planned.verdict}`}>{planned.verdict}</span>
              {' '}(sunlight {Math.round(before.metrics.lightPct)}% → {Math.round(planned.metrics.lightPct)}%)
            </p>
          )}
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

      {planned && nearby && (
        <div className="tactic">
          <h3>Better spot nearby</h3>
          {nearby.best.distance_km < 0.25 ? (
            <p>This is already the best spot within {nearby.radius_km} km.</p>
          ) : (
            <>
              <div className="big">
                Move {nearby.best.distance_km.toFixed(1)} km {compass(nearby.best.bearing_deg)}
                {' '}<span className="bearing" style={{ transform: `rotate(${nearby.best.bearing_deg}deg)` }} aria-hidden="true">↑</span>
              </div>
              <ul>
                <li>Sunlight {nearby.center.light_pct.toFixed(0)}% → <b>{nearby.best.light_pct.toFixed(0)}%</b></li>
                <li>Earth link {nearby.center.earth_pct.toFixed(0)}% → <b>{nearby.best.earth_pct.toFixed(0)}%</b></li>
                <li>Longest night {formatHours(nearby.center.longest_dark_h)} → {formatHours(nearby.best.longest_dark_h)}, slope {nearby.best.slope_deg.toFixed(1)}°</li>
              </ul>
              <p className="fine">Two-year averages over LRO LOLA terrain – a few kilometres change everything at the pole.</p>
            </>
          )}
          <button onClick={() => {
            onSelect(planned.data.site.id)
            setTimeout(() => document.getElementById('nearby-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
          }}>Show the map</button>
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
