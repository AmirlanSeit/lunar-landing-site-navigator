import { hasTerrain } from './terrain'
import type { Ephem, HorizonMask, Site, SiteData } from './types'

const base = `${import.meta.env.BASE_URL}data`
const cache = new Map<string, Promise<SiteData>>()

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  // `vite dev` answers a missing file with index.html (200), so check the type too.
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
  return res.json() as Promise<T>
}

export async function loadSites(): Promise<Site[]> {
  const sites = (await getJson<Site[]>(`${base}/sites.json`)) ?? []
  // Contract is -180..180 east; accept 0..360 too.
  return sites.map((s) => (s.lon > 180 ? { ...s, lon: s.lon - 360 } : s))
}

/**
 * LOLA terrain horizon for a custom point south of 83.5°S (api/terrain.ts). Optional: if the
 * service fails, the point keeps a flat horizon and the UI says so.
 */
const terrainCache = new Map<string, Promise<HorizonMask | null>>()

export function loadTerrain(at: { lat: number; lon: number }): Promise<HorizonMask | null> {
  if (!hasTerrain(at.lat)) return Promise.resolve(null)
  const query = new URLSearchParams({ lat: String(at.lat), lon: String(at.lon) }).toString()
  let p = terrainCache.get(query)
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/api/terrain?${query}`)
        if (!res.ok) return null
        const mask = (await res.json()) as HorizonMask
        return Array.isArray(mask.mask_el_deg) && mask.mask_el_deg.length === 360 ? mask : null
      } catch {
        return null
      }
    })()
    // Only successful masks are kept, so a later attempt can retry after a failure.
    p.then((mask) => mask || terrainCache.delete(query))
    terrainCache.set(query, p)
  }
  return p
}

async function loadCustomData(site: Site): Promise<SiteData> {
  const terrain = loadTerrain(site)
  const params = new URLSearchParams({ lat: String(site.lat), lon: String(site.lon) })
  if (site.elev_m !== null) params.set('elev_m', String(site.elev_m))
  const res = await fetch(`/api/horizons?${params}`).catch(() => {
    throw new Error('Could not reach the Horizons service. Check your connection and try again.')
  })
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : 'Could not load Sun and Earth positions from JPL Horizons. Please try again.'
    throw new Error(message)
  }
  const ephem = await res.json().catch(() => {
    throw new Error('Could not read the Horizons response. Please try again.')
  }) as Ephem
  const mask = await terrain
  if (!mask) return { site, ephem, mask: null }
  const slope = mask.slope_deg === undefined ? '' : `, ground slope ${mask.slope_deg.toFixed(1)}°`
  return { site: { ...site, note: `Custom point: LOLA 120 m terrain horizon${slope}` }, ephem, mask }
}

/** Ephemeris is required; the horizon mask is optional (no mask = spherical horizon). */
export function loadSiteData(site: Site): Promise<SiteData> {
  let p = cache.get(site.id)
  if (!p) {
    p = (site.category === 'custom'
      ? loadCustomData(site)
      : Promise.all([
        getJson<Ephem>(`${base}/ephem/${site.id}.json`),
        getJson<HorizonMask>(`${base}/horizon/${site.id}.json`),
      ]).then(([ephem, mask]) => {
        if (!ephem) throw new Error(`No ephemeris for ${site.id}`)
        return { site, ephem, mask }
      })
    ).catch((error: unknown) => {
      cache.delete(site.id)
      throw error
    })
    cache.set(site.id, p)
  }
  return p
}

export type Region = 'south-pole' | 'elsewhere'

export const REGION_LABELS: Record<Region, string> = {
  'south-pole': 'Lunar South Pole',
  elsewhere: 'Rest of the Moon (Apollo & international)',
}

export function regionOf(site: Site): Region {
  return site.lat < -75 ? 'south-pole' : 'elsewhere'
}
