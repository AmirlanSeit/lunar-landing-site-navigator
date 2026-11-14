import { describe, expect, it } from 'vitest'
import { parseCoordinates } from './coordinates'

describe('custom coordinate validation', () => {
  it('rounds coordinates and elevation to four decimals', () => {
    expect(parseCoordinates(new URLSearchParams({
      lat: '-89.512345', lon: '270.123456', elev_m: '-1234.56789',
    }))).toEqual({ lat: -89.5123, lon: -89.8765, elev_m: -1234.5679 })
  })

  it.each([
    ['-90', '-180', -90, -180],
    ['90', '180', 90, 180],
    ['0', '360', 0, 0],
    ['-0', '-0', 0, 0],
    [' 1e1 ', ' .5 ', 10, 0.5],
  ])('accepts valid latitude %s and east longitude %s', (lat, lon, expectedLat, expectedLon) => {
    expect(parseCoordinates(new URLSearchParams({ lat, lon })))
      .toEqual({ lat: expectedLat, lon: expectedLon, elev_m: 0 })
  })

  it.each(['', 'lon=0', 'lat=0', 'lat=&lon=0', 'lat=0&lon=', 'lat=0&lon=0&elev_m='])(
    'rejects missing or empty input: %s', (query) => {
    expect(() => parseCoordinates(new URLSearchParams(query))).toThrow()
  })

  it.each(['NaN', 'Infinity', '-Infinity', '1e309', '0x10', '1,5', '12m', ' ', "0'&COMMAND=399"])(
    'rejects nonfinite or nondecimal numbers: %s', (value) => {
    for (const field of ['lat', 'lon', 'elev_m']) {
      const params = new URLSearchParams({ lat: '0', lon: '0', [field]: value })
      expect(() => parseCoordinates(params)).toThrow()
    }
  })

  it.each([
    ['lat', '90.00001'], ['lat', '-90.00001'],
    ['lon', '360.00001'], ['lon', '-180.00001'],
  ])('checks %s range before rounding %s', (field, value) => {
    expect(() => parseCoordinates(new URLSearchParams({ lat: '0', lon: '0', [field]: value })))
      .toThrow()
  })

  it.each(['lat', 'lon', 'elev_m'])('rejects ambiguous repeated %s', (field) => {
    const params = new URLSearchParams({ lat: '0', lon: '0', elev_m: '0' })
    params.append(field, '1')
    expect(() => parseCoordinates(params)).toThrow(/only once/)
  })

  it('ignores all unrelated parameters', () => {
    expect(parseCoordinates(new URLSearchParams({
      lat: '0', lon: '0', url: 'https://example.com', COMMAND: '499', STEP_SIZE: '1 s',
    }))).toEqual({ lat: 0, lon: 0, elev_m: 0 })
  })
})
