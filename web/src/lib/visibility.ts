import type { HorizonMask } from './types'

// Apparent angular radii seen from the Moon.
export const SUN_RADIUS_DEG = 0.265
export const EARTH_RADIUS_DEG = 0.95

/** Terrain elevation of the local horizon at a given azimuth (0 if no mask). */
export function maskAt(mask: HorizonMask | null, azDeg: number): number {
  if (!mask) return 0
  const n = mask.mask_el_deg.length
  const x = (((azDeg % 360) + 360) % 360) / mask.az_step_deg
  const i = Math.floor(x) % n
  const j = (i + 1) % n
  const f = x - Math.floor(x)
  return mask.mask_el_deg[i] * (1 - f) + mask.mask_el_deg[j] * f
}

/** Fraction of the solar disk above the terrain (linear approximation). */
export function sunFraction(sunEl: number, horizonEl: number): number {
  const f = (sunEl - horizonEl + SUN_RADIUS_DEG) / (2 * SUN_RADIUS_DEG)
  return Math.min(1, Math.max(0, f))
}

/** Direct-to-Earth link possible when any part of Earth clears the terrain. */
export function earthVisible(earthEl: number, horizonEl: number): boolean {
  return earthEl > horizonEl - EARTH_RADIUS_DEG
}
