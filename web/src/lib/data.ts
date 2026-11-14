import type { Ephem, HorizonMask, Site, SiteData } from './types'

const base = `${import.meta.env.BASE_URL}data`
const cache = new Map<string, Promise<SiteData>>()

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json() as Promise<T>
}

export async function loadSites(): Promise<Site[]> {
  const sites = (await getJson<Site[]>(`${base}/sites.json`)) ?? []
  // Contract is -180..180 east; accept 0..360 too.
  return sites.map((s) => (s.lon > 180 ? { ...s, lon: s.lon - 360 } : s))
}

async function loadCustomData(site: Site): Promise<SiteData> {
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
  return { site, ephem, mask: null }
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
