// The textbook math behind the "Explain" layer. Kept separate so the numbers
// shown to students are the same ones the tests check.

export const MOON_RADIUS_KM = 1737.4
export const MAX_SOLAR_DECLINATION_DEG = 1.54 // tilt of the Moon's axis to the ecliptic
export const SYNODIC_MONTH_DAYS = 29.530589
export const SUN_DIAMETER_DEG = 0.53

const rad = Math.PI / 180

/** Highest the Sun can ever get at this latitude: 90° − |lat| + axial tilt. */
export function maxSunElevation(latDeg: number): number {
  return Math.min(90, 90 - Math.abs(latDeg) + MAX_SOLAR_DECLINATION_DEG)
}

/** Elevation angle of a hilltop, including the drop of the curved lunar surface. */
export function hillAngle(heightKm: number, distanceKm: number): number {
  const drop = (distanceKm * distanceKm) / (2 * MOON_RADIUS_KM)
  return Math.atan((heightKm - drop) / distanceKm) / rad
}

/** Ideal geometric factor for a flat (horizontal) panel: sin(elevation). Not electrical power. */
export function flatPanelPct(elDeg: number): number {
  return 100 * Math.max(0, Math.sin(elDeg * rad))
}

/** Ideal geometric factor for a vertical panel turned toward the Sun: cos(elevation). */
export function verticalPanelPct(elDeg: number): number {
  return 100 * Math.max(0, Math.cos(elDeg * rad))
}

/** Where Earth sits in the sky without libration (Earth hangs over 0°N 0°E). */
export function nominalEarthElevation(latDeg: number, lonDeg: number): number {
  return Math.asin(Math.cos(latDeg * rad) * Math.cos(lonDeg * rad)) / rad
}

/** How fast the Sun's hour angle advances in the lunar sky, degrees per Earth day. */
export const SUN_DEG_PER_DAY = 360 / SYNODIC_MONTH_DAYS

/**
 * How fast the Sun climbs while crossing a flat horizon, degrees per Earth day. With the Moon's
 * small solar declination the Sun rises roughly due east, so the vertical rate is the hour-angle
 * rate times cos(latitude): full speed at the equator, almost nothing near the pole.
 */
export function sunriseRateDegPerDay(latDeg: number): number {
  return SUN_DEG_PER_DAY * Math.cos(latDeg * rad)
}

/** Hours for the whole solar disk to clear a flat horizon at this latitude (terrain changes it). */
export function sunriseHours(latDeg: number): number {
  return (SUN_DIAMETER_DEG / sunriseRateDegPerDay(latDeg)) * 24
}
