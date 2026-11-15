// How much the verdict depends on the terrain horizon being right.
//
// Horizons re-derived from NASA Moon Trek's LOLA service agree with ours within about 0.2°
// per direction (docs/validation.md). Sunlight and Earth visibility can only fall when the
// horizon rises, so recomputing the mission with the whole horizon raised and lowered by that
// amount bounds the result for any per-direction error up to that size.
import { computeMetrics } from './metrics'
import type { SiteData } from './types'
import { verdictFor, type Thresholds, type Verdict } from './verdict'

export const HORIZON_ERROR_DEG = 0.2

export interface HorizonSensitivity {
  errorDeg: number
  /** [horizon raised, horizon lowered], in % */
  light: [number, number]
  comm: [number, number]
  verdicts: [Verdict, Verdict]
}

function shifted(d: SiteData, deltaDeg: number): SiteData {
  if (!d.mask) return d
  return { ...d, mask: { ...d.mask, mask_el_deg: d.mask.mask_el_deg.map((v) => v + deltaDeg) } }
}

/** null for flat-horizon sites (no terrain model to be wrong about) or dates outside the data. */
export function horizonSensitivity(
  d: SiteData, landing: Date, days: number, t: Thresholds, errorDeg = HORIZON_ERROR_DEG,
): HorizonSensitivity | null {
  if (!d.mask) return null
  const high = computeMetrics(shifted(d, errorDeg), landing, days)
  const low = computeMetrics(shifted(d, -errorDeg), landing, days)
  if (!high || !low) return null
  return {
    errorDeg,
    light: [high.lightPct, low.lightPct],
    comm: [high.commPct, low.commPct],
    verdicts: [verdictFor(high, t), verdictFor(low, t)],
  }
}

/**
 * "sunlight stays within 69–75%" or "Earth in view stays at 100%". Bounds are rounded outward,
 * so a range that dips below a threshold never displays as if it did not.
 */
export function describeRange(label: string, [a, b]: [number, number]): string {
  const lo = Math.floor(Math.min(a, b) + 1e-9)
  const hi = Math.ceil(Math.max(a, b) - 1e-9)
  return lo === hi ? `${label} stays at ${lo}%` : `${label} stays within ${lo}–${hi}%`
}
