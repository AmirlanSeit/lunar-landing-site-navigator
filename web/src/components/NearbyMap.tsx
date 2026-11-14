import { useMemo, useState, type PointerEvent } from 'react'
import { compass, offsetKm, type NearbyPoint, type Neighborhood } from '../lib/neighborhood'

type Metric = 'light' | 'earth'

const SIZE = 360 // the SVG is exactly the map square, so pointer math stays simple

// One hue per metric, dark (low – recedes into the dark surface) to bright (high).
const RAMPS: Record<Metric, string[]> = {
  light: ['#1b1e2a', '#3a3424', '#6e5a1f', '#a9851f', '#e0b32c', '#ffd54a', '#fff0b3'],
  earth: ['#1b1e2a', '#162a4a', '#184f95', '#2a78d6', '#5598e7', '#9ec5f4', '#cde2fb'],
}
const LABELS: Record<Metric, string> = { light: 'Sunlight', earth: 'Earth in view' }

function rampColor(stops: string[], pct: number): string {
  const t = (Math.min(100, Math.max(0, pct)) / 100) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t))
  const f = t - i
  const rgb = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16))
  const [a, b] = [rgb(stops[i]), rgb(stops[i + 1])]
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`
}

function describe(nb: Neighborhood, p: NearbyPoint) {
  // The best spot uses the pipeline's great-circle distance and bearing, so this line always
  // matches the summary above (a bearing near a compass boundary could otherwise flip label).
  const isBest = p.lat === nb.best.lat && p.lon === nb.best.lon
  const [e, n] = offsetKm(nb.center, p)
  const km = isBest ? nb.best.distance_km : Math.hypot(e, n)
  const bearing = isBest ? nb.best.bearing_deg : (Math.atan2(e, n) * 180) / Math.PI
  const where = km < 0.05 ? 'the reference point' : `${km.toFixed(1)} km ${compass(bearing)}`
  return `${where} · sunlight ${p.light_pct.toFixed(0)}% · Earth in view ${p.earth_pct.toFixed(0)}% · slope ${p.slope_deg.toFixed(1)}°`
}

/** Heat map of two-year sunlight / Earth-link averages on a 240 m grid around a polar site. */
export function NearbyMap({ nb }: { nb: Neighborhood }) {
  const [metric, setMetric] = useState<Metric>('light')
  const [hover, setHover] = useState<NearbyPoint | null>(null)

  const geo = useMemo(() => {
    const step = nb.spacing_m / 1000
    const r = nb.radius_km + step / 2
    const toX = (eKm: number) => ((eKm + r) / (2 * r)) * SIZE
    const toY = (nKm: number) => ((r - nKm) / (2 * r)) * SIZE
    const cell = (step / (2 * r)) * SIZE
    const byKey = new Map<string, NearbyPoint>()
    const items = nb.points.map((p) => {
      const [e, n] = offsetKm(nb.center, p)
      byKey.set(`${Math.round(e / step)},${Math.round(n / step)}`, p)
      return { p, x: toX(e), y: toY(n) }
    })
    const at = (p: NearbyPoint) => {
      const [e, n] = offsetKm(nb.center, p)
      return { x: toX(e), y: toY(n) }
    }
    return { step, r, cell, byKey, items, at, kmPx: SIZE / (2 * r) }
  }, [nb])

  const cells = useMemo(
    () => geo.items.map(({ p, x, y }) => (
      <rect
        key={`${p.lat},${p.lon}`} x={x - geo.cell / 2 + 0.5} y={y - geo.cell / 2 + 0.5}
        width={geo.cell - 1} height={geo.cell - 1} rx={1}
        fill={rampColor(RAMPS[metric], metric === 'light' ? p.light_pct : p.earth_pct)}
      />
    )),
    [geo, metric],
  )

  function onMove(ev: PointerEvent<SVGSVGElement>) {
    const box = ev.currentTarget.getBoundingClientRect()
    const e = ((ev.clientX - box.left) / box.width) * 2 * geo.r - geo.r
    const n = geo.r - ((ev.clientY - box.top) / box.height) * 2 * geo.r
    setHover(geo.byKey.get(`${Math.round(e / geo.step)},${Math.round(n / geo.step)}`) ?? null)
  }

  const best = geo.at(nb.best)
  const center = geo.at(nb.center)
  const hovered = hover ? geo.at(hover) : null
  const c = nb.center
  const b = nb.best

  return (
    <div className="nearby" id="nearby-map">
      <div className="nearby-head">
        <h3>Within {nb.radius_km} km: where is it better?</h3>
        <div className="nearby-toggle" role="group" aria-label="Map metric">
          {(Object.keys(LABELS) as Metric[]).map((m) => (
            <button key={m} aria-pressed={metric === m} className={metric === m ? 'on' : ''} onClick={() => setMetric(m)}>
              {LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <p className="nearby-summary">
        Reference point: sunlight {c.light_pct.toFixed(0)}%, Earth in view {c.earth_pct.toFixed(0)}%.
        {' '}Best spot within {nb.radius_km} km: <b>{b.distance_km.toFixed(1)} km {compass(b.bearing_deg)}</b>,
        {' '}sunlight <b>{b.light_pct.toFixed(0)}%</b>, Earth in view <b>{b.earth_pct.toFixed(0)}%</b>, slope {b.slope_deg.toFixed(1)}°.
      </p>
      <svg
        className="nearby-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img"
        aria-label={`${LABELS[metric]} map within ${nb.radius_km} km of the site`}
        onPointerMove={onMove} onPointerDown={onMove /* tap to inspect on touch screens */} onPointerLeave={() => setHover(null)}
      >
        <rect width={SIZE} height={SIZE} fill="#0b0e17" />
        {cells}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={nb.radius_km * geo.kmPx} fill="none" stroke="#ffffff33" strokeDasharray="4 4" />
        {hovered && (
          <rect x={hovered.x - geo.cell / 2} y={hovered.y - geo.cell / 2} width={geo.cell} height={geo.cell} fill="none" stroke="#fff" strokeWidth={1.5} />
        )}
        <circle cx={center.x} cy={center.y} r={6} fill="none" stroke="#0b0e17" strokeWidth={4} />
        <circle cx={center.x} cy={center.y} r={6} fill="none" stroke="#fff" strokeWidth={2} />
        <text x={best.x} y={best.y + 6} textAnchor="middle" fontSize="18" fill="#fff" stroke="#0b0e17" strokeWidth={3} paintOrder="stroke">★</text>
        <text x={14} y={22} fontSize="13" fill="#e8ebf3" stroke="#0b0e17" strokeWidth={3} paintOrder="stroke">N ↑</text>
        <line x1={14} x2={14 + geo.kmPx} y1={SIZE - 14} y2={SIZE - 14} stroke="#e8ebf3" strokeWidth={2} />
        <text x={14} y={SIZE - 20} fontSize="11" fill="#e8ebf3" stroke="#0b0e17" strokeWidth={3} paintOrder="stroke">1 km</text>
      </svg>
      <div className="nearby-legend">
        <span>0%</span>
        <i style={{ background: `linear-gradient(90deg, ${RAMPS[metric].join(', ')})` }} />
        <span>100% {LABELS[metric].toLowerCase()}</span>
        <span className="nearby-keys">○ reference point · ★ best spot</span>
      </div>
      <p className="nearby-readout" aria-live="polite">
        {hover ? `Hovered: ${describe(nb, hover)}` : `★ Best spot: ${describe(nb, nb.best)}`}
      </p>
      <p className="chart-caption">
        Each square is {nb.spacing_m} m: two-year averages (Nov 2026 – Dec 2028, hourly) from LRO LOLA terrain and
        JPL Horizons, not a verdict for your dates. Validation covers the six site reference points only: their averages
        differ from NASA's long-term LOLA illumination map by at most 2.5 percentage points (periods and settings differ);
        individual squares are not separately validated.
      </p>
    </div>
  )
}
