import { describe, expect, it } from 'vitest'
import { compass, offsetKm } from './neighborhood'

describe('neighborhood helpers', () => {
  it('labels bearings on a 16-wind compass', () => {
    expect(compass(0)).toBe('N')
    expect(compass(348.69)).toBe('NNW') // Nobile Rim 1 best spot
    expect(compass(100.62)).toBe('E') // Haworth best spot
    expect(compass(359)).toBe('N')
    expect(compass(-90)).toBe('W')
  })

  it('converts small lat/lon offsets to east/north km', () => {
    const [e, n] = offsetKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })
    expect(e).toBeCloseTo(0)
    expect(n).toBeCloseTo(30.32, 1) // 1° of latitude on the Moon
    // near the pole a degree of longitude is short: cos(85°) ≈ 0.087
    const [e2] = offsetKm({ lat: -85, lon: 30 }, { lat: -85, lon: 31 })
    expect(e2).toBeCloseTo(30.32 * Math.cos((85 * Math.PI) / 180), 2)
  })
})
