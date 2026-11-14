import { describe, expect, it } from 'vitest'
import { buildUrlState, customIndex, parseUrlState, type UrlState } from './url'

describe('scenario URL', () => {
  it('round-trips a full scenario', () => {
    const state: UrlState = {
      region: 'south-pole', date: '2027-11-27T12:00', orig: '2027-11-13T12:00',
      site: 'viper_mons_mouton_target', sel: 'custom-0', days: 21, light: 60, comm: 40, explain: true,
      custom: [{ lat: '-89.5', lon: '0', name: 'Ridge, east side' }, { lat: '0', lon: '0', name: '' }],
    }
    expect(parseUrlState(`?${buildUrlState(state)}`)).toEqual(state)
  })

  it('drops malformed or out-of-range values', () => {
    const s = parseUrlState('?region=mars&date=2027-11-27&days=0&light=999&comm=abc&site=<script>&explain=yes')
    expect(s).toEqual({
      region: undefined, date: undefined, orig: undefined, site: undefined, sel: undefined,
      days: undefined, light: undefined, comm: undefined, explain: undefined, custom: [],
    })
  })

  it('keeps at most four custom points and skips incomplete ones', () => {
    const q = ['-89,0', '-88', '-87,1', '-86,2', '-85,3', '-84,4'].map((c) => `custom=${c}`).join('&')
    expect(parseUrlState(`?${q}`).custom.map((c) => c.lat)).toEqual(['-89', '-87', '-86'])
  })

  it('omits empty fields from the link', () => {
    expect(buildUrlState({ date: '2027-01-01T00:00', custom: [] })).toBe('date=2027-01-01T00%3A00')
  })

  it('recognises custom point references', () => {
    expect(customIndex('custom-2')).toBe(2)
    expect(customIndex('apollo_11')).toBeNull()
    expect(customIndex(undefined)).toBeNull()
  })
})
