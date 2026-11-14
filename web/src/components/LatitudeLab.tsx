import { useEffect, useState } from 'react'
import { flatPanelPct, maxSunElevation, verticalPanelPct } from '../lib/explain'

// Side view of the Moon lit from the right: drag the latitude and watch the
// angle between the local horizon and the sunlight shrink toward the pole.
const W = 460
const H = 300
const CX = 190
const CY = 150
const R = 110
const ARC = 38

export function LatitudeLab({ siteLat, siteName }: { siteLat: number; siteName: string }) {
  const [lat, setLat] = useState(siteLat)
  useEffect(() => setLat(siteLat), [siteLat])

  const phi = (lat * Math.PI) / 180
  const p = { x: CX + R * Math.cos(phi), y: CY - R * Math.sin(phi) } // observer (SVG y grows down)
  const up = { x: Math.cos(phi), y: -Math.sin(phi) }
  // horizon direction on the sunward side
  const t = { x: Math.abs(Math.sin(phi)), y: lat >= 0 ? Math.cos(phi) : -Math.cos(phi) }
  const el = 90 - Math.abs(lat)
  const arcStart = { x: p.x + ARC * t.x, y: p.y + ARC * t.y }
  const arcEnd = { x: p.x + ARC, y: p.y }
  const sweep = lat < 0 ? 1 : 0
  const rays = [-80, -40, 0, 40, 80]

  return (
    <div className="lab">
      <div className="lab-text">
        <h3>🧪 Latitude lab</h3>
        <p>
          Sunlight hits the Moon almost exactly side-on. Your <b>horizon</b> is the line touching the surface where you
          stand. The further you go from the equator, the more that line tilts toward the Sun – and the lower the Sun sits.
        </p>
        <label htmlFor="lab-lat">Latitude: <b>{Math.abs(lat).toFixed(1)}°{lat < 0 ? 'S' : 'N'}</b></label>
        <input id="lab-lat" type="range" min={-90} max={90} step={0.5} value={lat} onChange={(e) => setLat(+e.target.value)} />
        <button className="link" onClick={() => setLat(siteLat)}>Back to {siteName}</button>
        <code>Sun height = 90° − |lat| = {el.toFixed(1)}° (up to {maxSunElevation(lat).toFixed(1)}° with the 1.5° tilt)</code>
        <p>
          Ideal geometric factor: flat panel <b>{Math.round(flatPanelPct(el))}%</b> · vertical panel <b>{Math.round(verticalPanelPct(el))}%</b>
        </p>
      </div>
      <svg className="chart lab-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sunlight angle versus latitude on the Moon">
        {rays.map((dy) => (
          <line key={dy} x1={W} x2={CX + Math.sqrt(Math.max(0, R * R - dy * dy))} y1={CY + dy} y2={CY + dy} stroke="var(--sun)" strokeOpacity={0.35} strokeDasharray="6 5" />
        ))}
        <circle cx={W - 14} cy={CY} r={10} fill="var(--sun)" />
        <circle cx={CX} cy={CY} r={R} fill="#2b3040" stroke="#9aa3b5" />
        <path d={`M${CX},${CY - R} A${R},${R} 0 0 0 ${CX},${CY + R} Z`} fill="#0d1018" opacity={0.85} />
        <line x1={CX} x2={CX + R + 6} y1={CY} y2={CY} stroke="#ffffff22" />
        <text x={CX + 4} y={CY - 4} fontSize="11" fill="#8a93a8">equator</text>
        {/* incoming ray to the observer */}
        <line x1={W - 24} x2={p.x} y1={p.y} y2={p.y} stroke="var(--sun)" strokeWidth={2} />
        {/* local horizon (tangent) and local "up" */}
        <line x1={p.x - 70 * t.x} y1={p.y - 70 * t.y} x2={p.x + 70 * t.x} y2={p.y + 70 * t.y} stroke="var(--go)" strokeWidth={2} />
        <line x1={p.x} y1={p.y} x2={p.x + 40 * up.x} y2={p.y + 40 * up.y} stroke="#fff" strokeDasharray="3 3" />
        <path d={`M${arcStart.x},${arcStart.y} A${ARC},${ARC} 0 0 ${sweep} ${arcEnd.x},${arcEnd.y}`} fill="none" stroke="var(--sun)" strokeWidth={2} />
        <circle cx={p.x} cy={p.y} r={5} fill="#fff" />
        <text x={p.x + ARC + 6} y={p.y + (lat >= 0 ? 14 : -6)} fontSize="13" fill="var(--sun)" fontWeight={700}>{el.toFixed(1)}°</text>
        <text x={p.x - 70 * t.x - 4} y={p.y - 70 * t.y + (lat >= 0 ? -6 : 14)} fontSize="11" fill="var(--go)" textAnchor="end">your horizon</text>
      </svg>
    </div>
  )
}
