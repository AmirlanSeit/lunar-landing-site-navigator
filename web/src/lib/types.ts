// Mirrors the data format in docs/data-format.md. Change both together.

export type Category =
  | 'apollo_landed'
  | 'artemis_region_reference'
  | 'clps_historical_target'
  | 'clps_landed'
  | 'international_landed'
  | 'custom'

export const CATEGORY_LABELS: Record<Category, string> = {
  apollo_landed: 'Landed',
  artemis_region_reference: 'Region reference',
  clps_historical_target: 'Planned target',
  clps_landed: 'Landed',
  international_landed: 'Landed',
  custom: 'Custom · flat horizon',
}

export interface Site {
  id: string
  name: string
  lat: number // degrees, south negative
  lon: number // east longitude, -180..180
  elev_m: number | null // null = no verified value
  category: Category
  mission: string
  source: string[] // primary source first
  note: string
}

export interface Track {
  az: number[] // degrees from north, clockwise
  el: number[] // degrees above the spherical horizon
}

export interface Ephem {
  site_id: string
  start_utc: string
  step_min: number
  sun: Track
  earth: Track
  source: string
  mock?: boolean
}

export interface HorizonMask {
  site_id: string
  az_step_deg: number
  mask_el_deg: number[]
  dem: string
  max_range_km: number
  mock?: boolean
}

export interface SiteData {
  site: Site
  ephem: Ephem
  mask: HorizonMask | null
}
