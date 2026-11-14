// Mirrors the data contract in PLAN.md §2.1. Change both together.

export type Category = 'artemis' | 'apollo' | 'clps' | 'international' | 'custom'

export interface Site {
  id: string
  name: string
  lat: number // degrees, south negative
  lon: number // east longitude, -180..180
  elev_m: number
  category: Category
  mission: string
  source: string
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
