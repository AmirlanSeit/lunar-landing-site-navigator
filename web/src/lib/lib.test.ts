import { describe, expect, it } from 'vitest'
import {
  flatPanelPct, hillAngle, maxSunElevation, nominalEarthElevation, sunriseHours, verticalPanelPct,
} from './explain'
import { computeMetrics } from './metrics'
import { bestPick, nearestGoShift, rank, evaluate } from './tactics'
import type { SiteData } from './types'
import { DEFAULT_THRESHOLDS, verdictFor } from './verdict'
import { maskAt, sunFraction } from './visibility'

const START = '2027-01-01T00:00:00Z'

function fake(sunEl: (i: number) => number, earthEl: (i: number) => number, n = 24 * 60, maskEl = 0): SiteData {
  const idx = Array.from({ length: n }, (_, i) => i)
  return {
    site: { id: 'x', name: 'X', lat: -89, lon: 0, elev_m: 0, category: 'custom', mission: '', source: [], note: '' },
    ephem: {
      site_id: 'x', start_utc: START, step_min: 60, source: 'test',
      sun: { az: idx.map(() => 90), el: idx.map(sunEl) },
      earth: { az: idx.map(() => 0), el: idx.map(earthEl) },
    },
    mask: { site_id: 'x', az_step_deg: 1, mask_el_deg: Array(360).fill(maskEl), dem: 'test', max_range_km: 0 },
  }
}

describe('visibility', () => {
  it('interpolates the mask and wraps at 360°', () => {
    const mask = { site_id: 'x', az_step_deg: 1, mask_el_deg: Array.from({ length: 360 }, (_, i) => i), dem: '', max_range_km: 0 }
    expect(maskAt(mask, 10.5)).toBeCloseTo(10.5)
    expect(maskAt(mask, 370)).toBeCloseTo(10)
    expect(maskAt(null, 10)).toBe(0)
  })
  it('counts half the solar disk when the Sun sits on the ridge', () => {
    expect(sunFraction(2, 2)).toBeCloseTo(0.5)
    expect(sunFraction(5, 2)).toBe(1)
    expect(sunFraction(0, 2)).toBe(0)
  })
})

describe('metrics', () => {
  it('always lit, always linked → 100% and GO', () => {
    const m = computeMetrics(fake(() => 5, () => 5), new Date(START), 14)!
    expect(m.lightPct).toBeCloseTo(100)
    expect(m.commPct).toBeCloseTo(100)
    expect(m.sunChangeHours).toBeNull()
    expect(verdictFor(m, DEFAULT_THRESHOLDS)).toBe('GO')
  })
  it('terrain blocks a low Sun', () => {
    const m = computeMetrics(fake(() => 1, () => 5, 24 * 60, 3), new Date(START), 14)!
    expect(m.lightPct).toBe(0)
    expect(verdictFor(m, DEFAULT_THRESHOLDS)).toBe('NO-GO')
  })
  it('finds sunset time and longest darkness', () => {
    // lit for the first 100 h, then dark
    const m = computeMetrics(fake((i) => (i < 100 ? 5 : -5), () => 5), new Date(START), 14)!
    expect(m.sunChangeHours).toBe(100)
    expect(m.longestDarkHours).toBe(14 * 24 - 100)
  })
  it('separates the Sun elevation from its clearance above the terrain', () => {
    // Sun 5° above the level horizon, terrain rising 3°: 5° for panels, 2° of clearance
    const m = computeMetrics(fake(() => 5, () => 5, 24 * 60, 3), new Date(START), 14)!
    expect(m.meanSunElevationLit).toBeCloseTo(5)
    expect(m.meanSunClearanceLit).toBeCloseTo(2)
  })
  it('returns null outside the data range', () => {
    expect(computeMetrics(fake(() => 5, () => 5), new Date('2030-01-01'), 14)).toBeNull()
  })
})

describe('explain math', () => {
  it('Sun barely clears the horizon near the pole', () => {
    expect(maxSunElevation(-89.5)).toBeCloseTo(2.04)
    expect(maxSunElevation(0)).toBe(90)
  })
  it('curvature lowers a distant hill', () => {
    expect(hillAngle(1, 30)).toBeCloseTo(1.44, 1)
    expect(hillAngle(1, 30)).toBeLessThan((Math.atan(1 / 30) * 180) / Math.PI)
  })
  it('flat panels starve at low Sun, vertical ones do not', () => {
    expect(flatPanelPct(2)).toBeCloseTo(3.5, 1)
    expect(verticalPanelPct(2)).toBeGreaterThan(99)
  })
  it('Earth sits overhead at 0°N 0°E and on the horizon at the pole', () => {
    expect(nominalEarthElevation(0, 0)).toBeCloseTo(90)
    expect(nominalEarthElevation(-90, 0)).toBeCloseTo(0)
  })
  it('a lunar sunrise takes about an hour at the equator but most of a day near the pole', () => {
    expect(sunriseHours(0)).toBeGreaterThan(0.9)
    expect(sunriseHours(0)).toBeLessThan(1.2)
    expect(sunriseHours(-86.75)).toBeGreaterThan(17) // Haworth: ~18 h
    expect(sunriseHours(-86.75)).toBeLessThan(20)
  })
})

describe('best pick', () => {
  it('never recommends a flat-horizon polar custom point over terrain-modeled sites', () => {
    // terrain-modeled catalog site lit only half the time; the flat-horizon point looks perfect
    const realData = fake((i) => (i % 48 < 24 ? 3 : -3), () => 3)
    realData.site = { ...realData.site, id: 'artemis_x', category: 'artemis_region_reference' }
    const real = evaluate(realData, new Date(START), 14, DEFAULT_THRESHOLDS)!
    const customData = fake(() => 5, () => 5)
    customData.site = { ...customData.site, id: 'custom-1', category: 'custom', lat: -88 }
    customData.mask = null // flat horizon
    const custom = evaluate(customData, new Date(START), 14, DEFAULT_THRESHOLDS)!
    const ranked = rank([real, custom])
    expect(ranked[0]).toBe(custom) // it still ranks first on its (optimistic) numbers…
    expect(bestPick(ranked)).toBe(real) // …but is not offered as the best pick
    expect(bestPick([custom])).toBe(custom)
  })
  it('treats a custom point with a LOLA terrain mask like any terrain-modeled site', () => {
    const realData = fake((i) => (i % 48 < 24 ? 3 : -3), () => 3)
    realData.site = { ...realData.site, id: 'artemis_x', category: 'artemis_region_reference' }
    const real = evaluate(realData, new Date(START), 14, DEFAULT_THRESHOLDS)!
    const customData = fake(() => 5, () => 5)
    customData.site = { ...customData.site, id: 'custom-1', category: 'custom', lat: -88 }
    customData.mask = { site_id: 'custom', az_step_deg: 1, mask_el_deg: Array(360).fill(0), dem: 'LOLA', max_range_km: 150, slope_deg: 2 }
    const custom = evaluate(customData, new Date(START), 14, DEFAULT_THRESHOLDS)!
    expect(bestPick(rank([real, custom]))).toBe(custom)
  })
})

describe('tactics', () => {
  it('ranks GO above NO-GO', () => {
    const good = evaluate(fake(() => 5, () => 5), new Date(START), 14, DEFAULT_THRESHOLDS)!
    const bad = evaluate(fake(() => -5, () => 5), new Date(START), 14, DEFAULT_THRESHOLDS)!
    expect(rank([bad, good])[0]).toBe(good)
  })
  it('finds the date shift that makes a site GO', () => {
    // dark for the first 10 days, lit afterwards; GO needs ≥70% of 14 days lit,
    // so at most 4.2 dark days in the window → shift by 6 days
    const d = fake((i) => (i < 240 ? -5 : 5), () => 5)
    expect(nearestGoShift(d, new Date(START), 14, DEFAULT_THRESHOLDS)).toBe(6)
  })
})
