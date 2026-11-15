import { stepHours } from '../lib/metrics'
import { MAX_SLOPE_DEG } from '../lib/terrain'
import type { Scenario } from '../lib/tactics'
import { useNeighborhood } from '../lib/useNeighborhood'
import { reasonsFor, type Thresholds } from '../lib/verdict'
import { ExplainMath } from './ExplainMath'
import { HorizonView } from './HorizonView'
import { MissionTimeline } from './MissionTimeline'
import { NearbyMap } from './NearbyMap'

export function SiteDetail({ s, t, explain }: { s: Scenario; t: Thresholds; explain: boolean }) {
  const { site } = s.data
  const nearby = useNeighborhood(site.id)
  const lat = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}`
  const lon = `${Math.abs(site.lon).toFixed(2)}°${site.lon < 0 ? 'W' : 'E'}`
  // Polar catalog sites: slope from the neighborhood grid; custom points: from api/terrain.ts.
  const slope = s.data.mask?.slope_deg ?? nearby?.center.slope_deg
  return (
    <div className="detail">
      <div className="detail-head">
        <div>
          <h2>{site.name} <span className={`verdict ${s.verdict}`}>{s.verdict}</span></h2>
          <div className="coords">{site.mission} · {lat}, {lon}</div>
        </div>
        <div className="ovr">{s.ovr}<small>OVR</small></div>
      </div>
      <ul className="reasons">
        {reasonsFor(s.metrics, t).map((r) => (
          <li key={r.text} className={r.good ? 'good' : ''}>{r.text}</li>
        ))}
        {slope !== undefined && (
          <li className={slope <= MAX_SLOPE_DEG ? 'good' : ''}>
            Ground slope {slope.toFixed(1)}° (LRO LOLA, 120 m grid),{' '}
            {slope <= MAX_SLOPE_DEG ? 'within' : 'steeper than'} the {MAX_SLOPE_DEG}° this tool accepts for a landing spot
          </li>
        )}
      </ul>
      <HorizonView data={s.data} m={s.metrics} />
      <div className="chart-caption">What an astronaut would see turning a full circle at the site during the mission.</div>
      <div className="chart-scroll" tabIndex={0} role="region" aria-label="Mission timeline (scrolls sideways on small screens)">
        <MissionTimeline m={s.metrics} stepHours={stepHours(s.data)} />
      </div>
      {nearby && <NearbyMap nb={nearby} />}
      {explain && <ExplainMath s={s} />}
      <div className="sources">
        {site.note && <p>{site.note}</p>}
        {site.source.length > 0 && (
          <p>
            Sources:{' '}
            {site.source.map((url, i) => (
              <span key={url}>{i > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer">[{i + 1}] {new URL(url).hostname.replace(/^www\./, '')}</a></span>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}
