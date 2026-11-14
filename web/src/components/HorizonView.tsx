import type { Metrics } from '../lib/metrics'
import type { SiteData } from '../lib/types'
import { maskAt } from '../lib/visibility'

// 360° panorama of the local horizon: terrain silhouette, Sun and Earth tracks over the mission.
const W = 720
const H = 260
const PAD_L = 34
const PAD_B = 22

export function HorizonView({ data, m }: { data: SiteData; m: Metrics }) {
  const { sun, earth } = data.ephem
  const idx = Array.from({ length: m.sunFrac.length }, (_, k) => m.startIdx + k)
  const maxEl = Math.max(
    ...idx.map((i) => Math.max(sun.el[i], earth.el[i])),
    ...(data.mask?.mask_el_deg ?? [0]),
  )
  const top = Math.min(90, Math.max(6, Math.ceil(maxEl + 1)))
  const bottom = -Math.max(3, Math.ceil(top * 0.08))
  const x = (az: number) => PAD_L + (az / 360) * (W - PAD_L)
  const y = (el: number) => (H - PAD_B) * (1 - (el - bottom) / (top - bottom))

  const terrain = Array.from({ length: 361 }, (_, az) => `${x(az)},${y(maskAt(data.mask, az))}`)
  const terrainPath = `M${x(0)},${y(bottom)} L${terrain.join(' L')} L${x(360)},${y(bottom)} Z`
  const gridStep = top > 30 ? 15 : top > 12 ? 5 : 1
  const grid: number[] = []
  for (let g = Math.ceil(bottom / gridStep) * gridStep; g <= top; g += gridStep) grid.push(g)
  const i0 = m.startIdx

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Horizon panorama with Sun and Earth tracks">
        <defs>
          <clipPath id="plot-area"><rect x={PAD_L} y={0} width={W - PAD_L} height={H - PAD_B} /></clipPath>
        </defs>
        <rect x={PAD_L} y={0} width={W - PAD_L} height={H - PAD_B} fill="#0b1020" />
        {grid.map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W} y1={y(g)} y2={y(g)} stroke={g === 0 ? '#5b6680' : '#1c2338'} strokeDasharray={g === 0 ? '4 4' : undefined} />
            <text x={PAD_L - 6} y={y(g) + 4} fontSize="11" fill="#8a93a8" textAnchor="end">{g}°</text>
          </g>
        ))}
        <g clipPath="url(#plot-area)">
        {idx.map((i, k) => (
          <circle key={`e${k}`} cx={x(earth.az[i])} cy={y(earth.el[i])} r={1.6} fill="var(--earth)" opacity={m.earthVis[k] ? 0.85 : 0.18} />
        ))}
        {idx.map((i, k) => (
          <circle key={`s${k}`} cx={x(sun.az[i])} cy={y(sun.el[i])} r={1.6} fill="var(--sun)" opacity={m.sunFrac[k] >= 0.5 ? 0.9 : 0.18} />
        ))}
        <path d={terrainPath} fill="var(--terrain)" stroke="#9aa3b5" strokeWidth={1} />
        <circle cx={x(earth.az[i0])} cy={y(earth.el[i0])} r={7} fill="var(--earth)" stroke="#fff" strokeWidth={1.5} />
        <circle cx={x(sun.az[i0])} cy={y(sun.el[i0])} r={7} fill="var(--sun)" stroke="#fff" strokeWidth={1.5} />
        </g>
        {['N', 'E', 'S', 'W', 'N'].map((d, k) => (
          <text key={k} x={x(k * 90)} y={H - 6} fontSize="12" fill="#8a93a8" textAnchor="middle">{d}</text>
        ))}
      </svg>
      <div className="legend">
        <span><i style={{ background: 'var(--sun)' }} />Sun path (bright = above terrain)</span>
        <span><i style={{ background: 'var(--earth)' }} />Earth path (bright = link possible)</span>
        <span><i style={{ background: 'var(--terrain)', borderRadius: 2 }} />
          {data.mask ? `Terrain horizon${data.mask.mock ? ' (placeholder)' : ' (LRO LOLA)'}` : 'Flat horizon (terrain not modeled)'}
        </span>
        <span>Big dots = at landing · dashed = flat-Moon horizon</span>
      </div>
    </div>
  )
}
