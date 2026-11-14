// "Best spot nearby" data from pipeline/neighborhood.py (web/public/data/neighborhood/<id>.json):
// a 240 m grid of candidate points within a few km of a polar site, each with two-year
// averages computed from LRO LOLA terrain and the site's JPL Horizons ephemeris.

export interface NearbyPoint {
  lat: number
  lon: number
  light_pct: number
  earth_pct: number
  slope_deg: number
}

export interface NearbySpot extends NearbyPoint {
  longest_dark_h: number
}

export interface Neighborhood {
  site_id: string
  radius_km: number
  spacing_m: number
  observer_height_m: number
  dem: string
  notes: string
  center: NearbySpot
  best: NearbySpot & { distance_km: number; bearing_deg: number; no_earth_link_nearby: boolean }
  points: NearbyPoint[]
}

const MOON_RADIUS_KM = 1737.4
const rad = Math.PI / 180
const WINDS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

/** East/north offset in km from `center` (tangent plane – fine for a few km). */
export function offsetKm(center: { lat: number; lon: number }, p: { lat: number; lon: number }): [number, number] {
  return [
    MOON_RADIUS_KM * Math.cos(center.lat * rad) * (p.lon - center.lon) * rad,
    MOON_RADIUS_KM * (p.lat - center.lat) * rad,
  ]
}

/** 16-wind compass label for a bearing in degrees. */
export function compass(bearingDeg: number): string {
  return WINDS[Math.round((((bearingDeg % 360) + 360) % 360) / 22.5) % 16]
}

const cache = new Map<string, Promise<Neighborhood | null>>()

/** Only polar catalog sites have this data; anything else resolves to null. */
export function loadNeighborhood(siteId: string): Promise<Neighborhood | null> {
  if (siteId.startsWith('custom-')) return Promise.resolve(null)
  let p = cache.get(siteId)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/neighborhood/${siteId}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<Neighborhood>) : null))
      .catch(() => null)
    cache.set(siteId, p)
  }
  return p
}
