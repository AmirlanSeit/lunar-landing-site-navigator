import type { Ephem, HorizonMask, Site, SiteData } from './types'

const base = `${import.meta.env.BASE_URL}data`
const cache = new Map<string, Promise<SiteData>>()

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json() as Promise<T>
}

export async function loadSites(): Promise<Site[]> {
  return (await getJson<Site[]>(`${base}/sites.json`)) ?? []
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

export type Region = 'south-pole' | 'nearside'

export const REGION_LABELS: Record<Region, string> = {
  'south-pole': 'Lunar South Pole',
  nearside: 'Nearside (Apollo era)',
}

export function regionOf(site: Site): Region {
  return site.lat < -75 ? 'south-pole' : 'nearside'
}
