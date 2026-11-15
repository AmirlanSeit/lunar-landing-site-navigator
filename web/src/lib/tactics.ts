import { computeMetrics, type Metrics } from './metrics'
import { overall, statsFor, type Stats } from './rating'
import type { SiteData } from './types'
import { verdictFor, type Thresholds, type Verdict } from './verdict'

/**
 * A custom polar point without a terrain mask (outside the DEM zone, or the terrain service
 * failed) uses a flat horizon; near the pole that overstates sunlight and Earth visibility.
 */
export function flatHorizonPolar(d: SiteData): boolean {
  return d.site.category === 'custom' && d.site.lat < -75 && !d.mask
}

export interface Scenario {
  data: SiteData
  metrics: Metrics
  stats: Stats
  ovr: number
  verdict: Verdict
}

const VERDICT_RANK: Record<Verdict, number> = { GO: 0, RISKY: 1, 'NO-GO': 2 }

export function evaluate(data: SiteData, landing: Date, days: number, t: Thresholds): Scenario | null {
  const metrics = computeMetrics(data, landing, days)
  if (!metrics) return null
  const stats = statsFor(metrics)
  return { data, metrics, stats, ovr: overall(stats), verdict: verdictFor(metrics, t) }
}

/** Best first: by verdict, then overall rating. */
export function rank(scenarios: Scenario[]): Scenario[] {
  return [...scenarios].sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || b.ovr - a.ovr)
}

/** The site to recommend: a flat-horizon polar point is never compared as an equal to terrain-modeled sites. */
export function bestPick(ranked: Scenario[]): Scenario | undefined {
  return ranked.find((s) => !flatHorizonPolar(s.data)) ?? ranked[0]
}

/** Smallest landing-date shift (whole days, either direction) that turns this site GO. */
export function nearestGoShift(
  data: SiteData,
  landing: Date,
  days: number,
  t: Thresholds,
  searchDays = 30,
): number | null {
  for (let d = 1; d <= searchDays; d++) {
    for (const shift of [d, -d]) {
      const s = evaluate(data, new Date(landing.getTime() + shift * 86400000), days, t)
      if (s?.verdict === 'GO') return shift
    }
  }
  return null
}

/** Where this site beats / trails the field average ("match preview"). */
export function strengthsWeaknesses(s: Scenario, field: Scenario[]) {
  const keys = Object.keys(s.stats) as (keyof Stats)[]
  const diffs = keys.map((k) => ({
    key: k,
    diff: s.stats[k] - field.reduce((sum, f) => sum + f.stats[k], 0) / field.length,
  }))
  diffs.sort((a, b) => b.diff - a.diff)
  return {
    strengths: diffs.filter((d) => d.diff >= 5).slice(0, 2),
    weaknesses: diffs.filter((d) => d.diff <= -5).slice(-2).reverse(),
  }
}
