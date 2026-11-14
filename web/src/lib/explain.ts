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

/** Share of full power a flat (horizontal) panel gets: sin(elevation). */
export function flatPanelPct(elDeg: number): number {
  return 100 * Math.max(0, Math.sin(elDeg * rad))
}

/** Share of full power a vertical panel turned toward the Sun gets: cos(elevation). */
export function verticalPanelPct(elDeg: number): number {
  return 100 * Math.max(0, Math.cos(elDeg * rad))
}

/** Where Earth sits in the sky without libration (Earth hangs over 0°N 0°E). */
export function nominalEarthElevation(latDeg: number, lonDeg: number): number {
  return Math.asin(Math.cos(latDeg * rad) * Math.cos(lonDeg * rad)) / rad
}

/** How fast the Sun crosses the lunar sky, degrees per Earth day. */
export const SUN_DEG_PER_DAY = 360 / SYNODIC_MONTH_DAYS

/** Hours the Sun needs to move its own diameter – roughly how long a lunar sunrise lasts. */
export const SUNRISE_HOURS = (SUN_DIAMETER_DEG / SUN_DEG_PER_DAY) * 24
