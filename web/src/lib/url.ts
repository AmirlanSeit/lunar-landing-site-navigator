// Scenario state <-> URL query string, so a scenario can be shared as a link.
// Everything is validated on the way in; unknown or malformed values are dropped.
import type { Region } from './data'

export interface CustomPoint {
  lat: string
  lon: string
  name: string
}

export interface UrlState {
  region?: Region
  date?: string // new landing date, YYYY-MM-DDTHH:mm (UTC)
  orig?: string // original landing date, same format
  site?: string // planned site: catalog id, or custom-<n> for the n-th custom point
  sel?: string // site shown in "Why", same reference format
  days?: number
  light?: number
  comm?: number
  explain?: boolean
  custom: CustomPoint[]
}

export const MAX_CUSTOM_POINTS = 4

const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const ID = /^[a-z0-9_-]{1,64}$/i
const REGIONS: Region[] = ['south-pole', 'elsewhere']

function int(value: string | null, min: number, max: number): number | undefined {
  if (value === null || !/^\d{1,3}$/.test(value)) return undefined
  const n = Number(value)
  return n >= min && n <= max ? n : undefined
}

export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search)
  const match = (key: string, re: RegExp) => {
    const v = p.get(key)
    return v !== null && re.test(v) ? v : undefined
  }
  const region = p.get('region') as Region | null
  return {
    region: region && REGIONS.includes(region) ? region : undefined,
    date: match('date', DATE),
    orig: match('orig', DATE),
    site: match('site', ID),
    sel: match('sel', ID),
    days: int(p.get('days'), 1, 60),
    light: int(p.get('light'), 30, 100),
    comm: int(p.get('comm'), 25, 100),
    explain: p.get('explain') === '1' || undefined,
    custom: p.getAll('custom').slice(0, MAX_CUSTOM_POINTS).flatMap((v) => {
      const [lat, lon, ...name] = v.split(',')
      return lat && lon ? [{ lat, lon, name: name.join(',') }] : []
    }),
  }
}

export function buildUrlState(s: UrlState): string {
  const p = new URLSearchParams()
  const put = (key: string, v: string | number | undefined) => v !== undefined && v !== '' && p.set(key, String(v))
  put('region', s.region)
  put('date', s.date)
  put('orig', s.orig)
  put('site', s.site)
  put('sel', s.sel)
  put('days', s.days)
  put('light', s.light)
  put('comm', s.comm)
  if (s.explain) p.set('explain', '1')
  for (const c of s.custom.slice(0, MAX_CUSTOM_POINTS)) {
    p.append('custom', c.name ? `${c.lat},${c.lon},${c.name}` : `${c.lat},${c.lon}`)
  }
  return p.toString()
}

/** "custom-2" -> 2, anything else -> null. */
export function customIndex(ref: string | undefined): number | null {
  const m = ref?.match(/^custom-(\d)$/)
  return m ? Number(m[1]) : null
}
