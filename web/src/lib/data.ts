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

/** Ephemeris is required; the horizon mask is optional (no mask = spherical horizon). */
export function loadSiteData(site: Site): Promise<SiteData> {
  let p = cache.get(site.id)
  if (!p) {
    p = Promise.all([
      getJson<Ephem>(`${base}/ephem/${site.id}.json`),
      getJson<HorizonMask>(`${base}/horizon/${site.id}.json`),
    ]).then(([ephem, mask]) => {
      if (!ephem) throw new Error(`No ephemeris for ${site.id}`)
      return { site, ephem, mask }
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
