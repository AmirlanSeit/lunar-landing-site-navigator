import { describe, expect, it } from 'vitest'
import { computeMetrics } from './metrics'
import { nearestGoShift, rank, evaluate } from './tactics'
import type { SiteData } from './types'
import { DEFAULT_THRESHOLDS, verdictFor } from './verdict'
import { maskAt, sunFraction } from './visibility'

const START = '2027-01-01T00:00:00Z'

function fake(sunEl: (i: number) => number, earthEl: (i: number) => number, n = 24 * 60, maskEl = 0): SiteData {
  const idx = Array.from({ length: n }, (_, i) => i)
  return {
    site: { id: 'x', name: 'X', lat: -89, lon: 0, elev_m: 0, category: 'custom', mission: '', source: '', note: '' },
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
  it('returns null outside the data range', () => {
    expect(computeMetrics(fake(() => 5, () => 5), new Date('2030-01-01'), 14)).toBeNull()
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
