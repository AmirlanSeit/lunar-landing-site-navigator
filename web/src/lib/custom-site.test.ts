import { describe, expect, it } from 'vitest'
import { createCustomSite } from './custom-site'
import { regionOf } from './data'

describe('custom site metadata', () => {
  it('normalizes coordinates and preserves the custom-site contract', () => {
    const site = createCustomSite({ name: '  Polar scout  ', lat: '-89.50004', lon: '337.2' })
    expect(site).toEqual({
      id: expect.stringMatching(/^custom-/),
      name: 'Polar scout',
      lat: -89.5,
      lon: -22.8,
      elev_m: null,
      category: 'custom',
      mission: 'User-defined landing site',
      source: [],
      note: 'Custom point – terrain not modeled (flat horizon)',
    })
    expect(regionOf(site)).toBe('south-pole')
  })

  it('supplies a readable coordinate name when Name is omitted', () => {
    const site = createCustomSite({ name: '  ', lat: '-89.5', lon: '337.2' })
    expect(site.name).toBe('Custom (89.5°S, 22.8°W)')
  })

  it('keeps separately added points distinct even when they have the same name', () => {
    const polar = createCustomSite({ name: 'Scout', lat: '-89.5', lon: '0' })
    const equatorial = createCustomSite({ name: 'Scout', lat: '0', lon: '0' })
    const repeat = createCustomSite({ name: 'Scout', lat: '0', lon: '0' })
    expect(new Set([polar.id, equatorial.id, repeat.id]).size).toBe(3)
    expect(regionOf(equatorial)).toBe('elsewhere')
  })

  it('rejects invalid coordinates before creating a site', () => {
    expect(() => createCustomSite({ name: '', lat: '', lon: '0' })).toThrow()
    expect(() => createCustomSite({ name: '', lat: '90.00001', lon: '0' })).toThrow()
    expect(() => createCustomSite({ name: '', lat: '0', lon: '361' })).toThrow()
  })
})
