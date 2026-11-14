import { evaluate } from './tactics'
import type { Site, SiteData } from './types'
import type { Thresholds, Verdict } from './verdict'

export interface CalendarCell {
  date: Date
  verdict: Verdict
  lightPct: number
  commPct: number
}

export interface CalendarRow {
  site: Site
  cells: (CalendarCell | null)[]
}

/** One landing window per UTC day; null means the full mission is outside the data. */
export function buildCalendar(
  data: SiteData[],
  landing: Date,
  days: number,
  t: Thresholds,
  fromOffset = -14,
  toOffset = 45,
): CalendarRow[] {
  const landingTime = landing.getTime()
  if (!Number.isFinite(landingTime) || !Number.isFinite(days) || days <= 0) {
    throw new RangeError('A valid landing date and positive mission duration are required.')
  }
  if (!Number.isInteger(fromOffset) || !Number.isInteger(toOffset) || fromOffset > toOffset) {
    throw new RangeError('Calendar offsets must be ascending whole days.')
  }

  return data.map((siteData) => ({
    site: siteData.site,
    cells: Array.from({ length: toOffset - fromOffset + 1 }, (_, index) => {
      const date = new Date(landingTime + (fromOffset + index) * 86400000)
      const scenario = evaluate(siteData, date, days, t)
      return scenario ? {
        date,
        verdict: scenario.verdict,
        lightPct: scenario.metrics.lightPct,
        commPct: scenario.metrics.commPct,
      } : null
    }),
  }))
}
