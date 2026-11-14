import { STAT_HELP, STAT_LABELS, type Stats } from '../lib/rating'
import type { Scenario } from '../lib/tactics'

interface Props {
  s: Scenario
  rank: number
  best: boolean
  planned: boolean
  selected: boolean
  inMatch: boolean
  onSelect: () => void
  onToggleMatch: () => void
}

const ORDER: (keyof Stats)[] = ['LGT', 'COM', 'NGT', 'SUN', 'ERT', 'ELV']

export function PlayerCard({ s, rank, best, planned, selected, inMatch, onSelect, onToggleMatch }: Props) {
  const cls = ['card', `v-${s.verdict}`, best && 'best', selected && 'selected'].filter(Boolean).join(' ')
  return (
    <div className={cls} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()}>
      <button
        className={`match-toggle${inMatch ? ' on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleMatch() }}
        title="Add to side-by-side match"
      >
        {inMatch ? '✓ match' : '+ match'}
      </button>
      <div className="card-top">
        <div className="ovr">{s.ovr}<small>OVR</small></div>
        <div className="rank">
          #{rank}
          <div><span className={`verdict ${s.verdict}`}>{s.verdict}</span></div>
        </div>
      </div>
      <h4>{s.data.site.name}</h4>
      <div className="mission">{s.data.site.mission}</div>
      <div className="tags">
        {best && <span className="tag gold">Best pick</span>}
        {planned && <span className="tag">Your plan</span>}
      </div>
      <div className="stats">
        {ORDER.map((k) => (
          <div key={k} title={`${STAT_LABELS[k]}: ${STAT_HELP[k]}`}><b>{s.stats[k]}</b> <span>{k}</span></div>
        ))}
      </div>
    </div>
  )
}
