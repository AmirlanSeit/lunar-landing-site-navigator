import type { SiteData } from './types'
import { earthVisible, maskAt, sunFraction } from './visibility'

export interface Metrics {
  lightPct: number // mean fraction of solar disk visible, %
  commPct: number // share of time Earth is in view, %
  meanSunElLit: number // mean sun elevation above terrain while lit, degrees
  longestDarkHours: number
  litAtLanding: boolean
  earthAtLanding: boolean
  /** Hours from landing until the Sun sets (or rises, if landing in dark). null = not within the mission. */
  sunChangeHours: number | null
  earthChangeHours: number | null
  windowHours: number
  /** Per-step series over the mission window, for charts. */
  sunFrac: number[]
  earthVis: boolean[]
  startIdx: number
}

export function stepHours(d: SiteData): number {
  return d.ephem.step_min / 60
}

export function indexAt(d: SiteData, date: Date): number {
  const start = Date.parse(d.ephem.start_utc)
  return Math.round((date.getTime() - start) / (d.ephem.step_min * 60000))
}

export function dataRange(d: SiteData): [Date, Date] {
  const start = Date.parse(d.ephem.start_utc)
  const end = start + (d.ephem.sun.el.length - 1) * d.ephem.step_min * 60000
  return [new Date(start), new Date(end)]
}

/** Metrics for a mission that lands at `landing` and lasts `days`. null if outside the data. */
export function computeMetrics(d: SiteData, landing: Date, days: number): Metrics | null {
  const h = stepHours(d)
  const startIdx = indexAt(d, landing)
  const count = Math.max(1, Math.round((days * 24) / h))
  if (startIdx < 0 || startIdx + count > d.ephem.sun.el.length) return null

  const { sun, earth } = d.ephem
  const sunFrac: number[] = []
  const earthVis: boolean[] = []
  let lightSum = 0
  let commCount = 0
  let elLitSum = 0
  let litSteps = 0
  let dark = 0
  let longestDark = 0

  for (let k = 0; k < count; k++) {
    const i = startIdx + k
    const sunHorizon = maskAt(d.mask, sun.az[i])
    const f = sunFraction(sun.el[i], sunHorizon)
    const e = earthVisible(earth.el[i], maskAt(d.mask, earth.az[i]))
    sunFrac.push(f)
    earthVis.push(e)
    lightSum += f
    if (e) commCount++
    if (f >= 0.5) {
      elLitSum += sun.el[i] - sunHorizon
      litSteps++
      dark = 0
    } else {
      dark++
      longestDark = Math.max(longestDark, dark)
    }
  }

  const firstChange = <T,>(series: T[], same: (v: T) => boolean) => {
    const k = series.findIndex((v) => !same(v))
    return k < 0 ? null : k * h
  }
  const litAtLanding = sunFrac[0] >= 0.5
  const earthAtLanding = earthVis[0]

  return {
    lightPct: (100 * lightSum) / count,
    commPct: (100 * commCount) / count,
    meanSunElLit: litSteps ? elLitSum / litSteps : 0,
    longestDarkHours: longestDark * h,
    litAtLanding,
    earthAtLanding,
    sunChangeHours: firstChange(sunFrac, (f) => f >= 0.5 === litAtLanding),
    earthChangeHours: firstChange(earthVis, (v) => v === earthAtLanding),
    windowHours: count * h,
    sunFrac,
    earthVis,
    startIdx,
  }
}
