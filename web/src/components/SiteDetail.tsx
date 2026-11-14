import { stepHours } from '../lib/metrics'
import type { Scenario } from '../lib/tactics'
import { reasonsFor, type Thresholds } from '../lib/verdict'
import { HorizonView } from './HorizonView'
import { MissionTimeline } from './MissionTimeline'

export function SiteDetail({ s, t }: { s: Scenario; t: Thresholds }) {
  const { site } = s.data
  const lat = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}`
  const lon = `${Math.abs(site.lon).toFixed(2)}°${site.lon < 0 ? 'W' : 'E'}`
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
      </ul>
      <HorizonView data={s.data} m={s.metrics} />
      <div className="chart-caption">What an astronaut would see turning a full circle at the site during the mission.</div>
      <MissionTimeline m={s.metrics} stepHours={stepHours(s.data)} />
    </div>
  )
}
