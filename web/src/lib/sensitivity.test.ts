import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { computeMetrics } from './metrics'
import { describeRange, HORIZON_ERROR_DEG, horizonSensitivity } from './sensitivity'
import type { Ephem, HorizonMask, Site, SiteData } from './types'
import { DEFAULT_THRESHOLDS } from './verdict'

const START = '2027-01-01T00:00:00Z'
const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

/** Sun skimming the horizon at changing azimuths, Earth low: both metrics depend on the mask. */
function skimming(mask: number[] | null): SiteData {
  const n = 24 * 30
  const idx = Array.from({ length: n }, (_, i) => i)
  return {
    site: { id: 'x', name: 'X', lat: -89, lon: 0, elev_m: 0, category: 'custom', mission: '', source: [], note: '' },
    ephem: {
      site_id: 'x', start_utc: START, step_min: 60, source: 'test',
      sun: { az: idx.map((i) => (i * 0.5) % 360), el: idx.map((i) => 1.2 * Math.sin(i / 20)) },
      earth: { az: idx.map((i) => (i * 0.3) % 360), el: idx.map((i) => 0.4 * Math.cos(i / 33)) },
    },
    mask: mask && { site_id: 'x', az_step_deg: 1, mask_el_deg: mask, dem: 'test', max_range_km: 150 },
  }
}

const landing = new Date(START)

describe('horizon sensitivity', () => {
  it('is not offered for a flat horizon', () => {
    expect(horizonSensitivity(skimming(null), landing, 14, DEFAULT_THRESHOLDS)).toBeNull()
  })

  it('brackets the nominal result: a higher horizon gives less sunlight and Earth', () => {
    const d = skimming(Array(360).fill(0.3))
    const m = computeMetrics(d, landing, 14)!
    const s = horizonSensitivity(d, landing, 14, DEFAULT_THRESHOLDS)!
    expect(s.errorDeg).toBe(HORIZON_ERROR_DEG)
    expect(s.light[0]).toBeLessThan(m.lightPct)
    expect(s.light[1]).toBeGreaterThan(m.lightPct)
    expect(s.comm[0]).toBeLessThanOrEqual(m.commPct)
    expect(s.comm[1]).toBeGreaterThanOrEqual(m.commPct)
  })

  it('bounds any per-direction horizon error of that size', () => {
    const base = Array.from({ length: 360 }, (_, i) => 0.5 * Math.sin(i / 7))
    const d = skimming(base)
    const s = horizonSensitivity(d, landing, 14, DEFAULT_THRESHOLDS)!
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1
    for (let trial = 0; trial < 20; trial++) {
      const noisy = base.map((v) => v + HORIZON_ERROR_DEG * rand())
      const m = computeMetrics({ ...d, mask: { ...d.mask!, mask_el_deg: noisy } }, landing, 14)!
      expect(m.lightPct).toBeGreaterThanOrEqual(s.light[0] - 1e-9)
      expect(m.lightPct).toBeLessThanOrEqual(s.light[1] + 1e-9)
      expect(m.commPct).toBeGreaterThanOrEqual(s.comm[0] - 1e-9)
      expect(m.commPct).toBeLessThanOrEqual(s.comm[1] + 1e-9)
    }
  })

  it('flags the demo GO dates at Mons Mouton as borderline and the delayed NO-GO as firm', () => {
    const site = (read('../../public/data/sites.json') as Site[]).find((x) => x.id === 'viper_mons_mouton_target')!
    const d: SiteData = {
      site,
      ephem: read('../../public/data/ephem/viper_mons_mouton_target.json') as Ephem,
      mask: read('../../public/data/horizon/viper_mons_mouton_target.json') as HorizonMask,
    }
    const at = (iso: string) => horizonSensitivity(d, new Date(iso), 14, DEFAULT_THRESHOLDS)!
    expect(at('2027-11-13T12:00:00Z').verdicts).toEqual(['RISKY', 'GO']) // original date, 70.2% nominal
    expect(at('2027-12-02T12:00:00Z').verdicts).toEqual(['RISKY', 'GO']) // five-day shift, 70.5% nominal
    expect(at('2027-11-27T12:00:00Z').verdicts).toEqual(['NO-GO', 'NO-GO']) // delayed date, 35% nominal
  })

  it('rounds ranges outward so a dip below a threshold stays visible', () => {
    expect(describeRange('sunlight', [69.5, 74.2])).toBe('sunlight stays within 69–75%')
    expect(describeRange('Earth in view', [100, 100])).toBe('Earth in view stays at 100%')
    expect(describeRange('Earth in view', [99.6, 100])).toBe('Earth in view stays within 99–100%')
    expect(describeRange('sunlight', [70, 70])).toBe('sunlight stays at 70%')
  })
})
