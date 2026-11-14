import type { Metrics } from '../lib/metrics'

const W = 720
const ROW = 22
const LABEL = 48

/** Day-by-day strip: sunlight and Earth visibility across the mission. */
export function MissionTimeline({ m, stepHours }: { m: Metrics; stepHours: number }) {
  const n = m.sunFrac.length
  const cw = (W - LABEL) / n
  const days = Math.round(m.windowHours / 24)
  const tickEvery = days > 20 ? 5 : days > 8 ? 2 : 1
  const H = ROW * 2 + 26
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mission timeline of sunlight and Earth visibility">
      <text x={0} y={ROW - 6} fontSize="12" fill="#8a93a8">Sun</text>
      <text x={0} y={ROW * 2 - 2} fontSize="12" fill="#8a93a8">Earth</text>
      {m.sunFrac.map((f, k) => (
        <rect key={`s${k}`} x={LABEL + k * cw} y={2} width={cw + 0.5} height={ROW - 4} fill="var(--sun)" opacity={0.08 + 0.92 * f} />
      ))}
      {m.earthVis.map((v, k) => (
        <rect key={`e${k}`} x={LABEL + k * cw} y={ROW + 2} width={cw + 0.5} height={ROW - 4} fill="var(--earth)" opacity={v ? 0.9 : 0.08} />
      ))}
      {Array.from({ length: days + 1 }, (_, d) => d)
        .filter((d) => d % tickEvery === 0)
        .map((d) => {
          const tx = LABEL + ((d * 24) / stepHours) * cw
          return (
            <g key={d}>
              <line x1={tx} x2={tx} y1={2} y2={ROW * 2} stroke="#ffffff22" />
              <text x={tx} y={H - 4} fontSize="11" fill="#8a93a8" textAnchor="middle">day {d}</text>
            </g>
          )
        })}
    </svg>
  )
}
