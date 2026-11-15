import { useEffect, useMemo, useState } from 'react'
import { loadTerrain } from './data'
import type { Neighborhood } from './neighborhood'
import { spotData } from './spot'
import { evaluate, type Scenario } from './tactics'
import { hasTerrain } from './terrain'
import type { HorizonMask } from './types'
import type { Thresholds } from './verdict'

/**
 * The planned site's "best spot nearby" evaluated for the chosen dates, using that spot's own
 * LOLA terrain horizon (api/terrain.ts). null while loading, outside the terrain zone, or when
 * the best spot is the site itself.
 */
export function useNearbySpot(
  planned: Scenario | null, nb: Neighborhood | null, landing: Date, days: number, t: Thresholds,
): Scenario | null {
  const best = nb && nb.best.distance_km >= 0.25 && hasTerrain(nb.best.lat) ? nb.best : null
  const key = best ? `${best.lat},${best.lon}` : null
  const [mask, setMask] = useState<{ key: string; mask: HorizonMask | null } | null>(null)
  useEffect(() => {
    if (!best || !key) return
    let live = true
    loadTerrain(best).then((m) => live && setMask({ key, mask: m }))
    return () => { live = false }
  }, [best, key])
  const base = planned?.data
  const data = useMemo(
    () => (base && best && mask && mask.key === key && mask.mask ? spotData(base, best, mask.mask) : null),
    [base, best, key, mask],
  )
  return useMemo(() => (data ? evaluate(data, landing, days, t) : null), [data, landing, days, t])
}
