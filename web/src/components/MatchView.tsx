import { STAT_LABELS, type Stats } from '../lib/rating'
import type { Scenario } from '../lib/tactics'

/** Side-by-side comparison of 2–4 sites, best value per row highlighted. */
export function MatchView({ list }: { list: Scenario[] }) {
  const keys = Object.keys(STAT_LABELS) as (keyof Stats)[]
  const rows: { label: string; values: number[] }[] = [
    { label: 'Overall (OVR)', values: list.map((s) => s.ovr) },
    ...keys.map((k) => ({ label: `${STAT_LABELS[k]} (${k})`, values: list.map((s) => s.stats[k]) })),
  ]
  return (
    <div className="match">
      <table>
        <thead>
          <tr>
            <th />
            {list.map((s) => (
              <th key={s.data.site.id}>{s.data.site.name}<br /><span className={`verdict ${s.verdict}`}>{s.verdict}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const best = Math.max(...r.values)
            return (
              <tr key={r.label}>
                <td>{r.label}</td>
                {r.values.map((v, i) => <td key={i} className={v === best ? 'win' : ''}>{v}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
