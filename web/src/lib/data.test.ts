import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Ephem, HorizonMask, Site } from './types'

const ephem: Ephem = {
  site_id: 'custom',
  start_utc: '2026-11-01T00:00:00Z',
  step_min: 60,
  sun: { az: [180], el: [1.5] },
  earth: { az: [0], el: [3] },
  source: 'test Horizons response',
}
const custom: Site = {
  id: 'custom-polar', name: 'Polar scout', lat: -89.5, lon: 0, elev_m: null,
  category: 'custom', mission: 'User-defined landing site', source: [],
  note: 'Custom point – terrain not modeled (flat horizon)',
}
const fetchMock = vi.fn<typeof fetch>()
let loadSiteData: typeof import('./data').loadSiteData

beforeEach(async () => {
  vi.resetModules()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  ;({ loadSiteData } = await import('./data'))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('custom-site loading', () => {
  it('requests the same-origin proxy, keeps site_id custom, and never requests a terrain mask', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    const data = await loadSiteData(custom)
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/horizons?lat=-89.5&lon=0')
    expect(data).toEqual({ site: custom, ephem, mask: null })
  })

  it.each([0, 1234.5, -100])('includes an explicitly supplied elevation of %s meters', async (elev_m) => {
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    await loadSiteData({ ...custom, elev_m })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`/api/horizons?lat=-89.5&lon=0&elev_m=${elev_m}`)
  })

  it('shares pending and successful requests for a site', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    const first = loadSiteData(custom)
    expect(loadSiteData(custom)).toBe(first)
    await first
    expect(loadSiteData(custom)).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('loads distinct custom points independently', async () => {
    const equatorial = { ...custom, id: 'custom-equatorial', lat: 0 }
    fetchMock.mockImplementation(async () => Response.json(ephem))
    const [polarData, equatorialData] = await Promise.all([loadSiteData(custom), loadSiteData(equatorial)])
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/horizons?lat=-89.5&lon=0', '/api/horizons?lat=0&lon=0',
    ])
    expect(polarData.site).toBe(custom)
    expect(equatorialData.site).toBe(equatorial)
  })

  it('surfaces a proxy error and permits retrying the same site', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'JPL Horizons is unavailable. Please try again.' }, { status: 502 }))
    await expect(loadSiteData(custom)).rejects.toThrow('JPL Horizons is unavailable. Please try again.')
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    await expect(loadSiteData(custom)).resolves.toEqual({ site: custom, ephem, mask: null })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('explains a network failure and does not cache the rejection', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(loadSiteData(custom)).rejects.toThrow('Check your connection and try again.')
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    await expect(loadSiteData(custom)).resolves.toHaveProperty('mask', null)
  })

  it('shows a useful error if the gateway returns HTML instead of JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<h1>Bad gateway</h1>', { status: 502 }))
    await expect(loadSiteData(custom)).rejects.toThrow('Could not load Sun and Earth positions from JPL Horizons.')
  })

  it('does not cache an unreadable successful response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('invalid json', { status: 200 }))
    await expect(loadSiteData(custom)).rejects.toThrow('Could not read the Horizons response.')
    fetchMock.mockResolvedValueOnce(Response.json(ephem))
    await expect(loadSiteData(custom)).resolves.toHaveProperty('ephem', ephem)
  })
})

describe('catalog loading', () => {
  const knownSite: Site = { ...custom, id: 'apollo_11', category: 'apollo_landed' }

  it('continues to load known ephemerides and masks from static files', async () => {
    const knownEphem = { ...ephem, site_id: knownSite.id }
    const mask: HorizonMask = { site_id: knownSite.id, az_step_deg: 1, mask_el_deg: [2], dem: 'test', max_range_km: 150 }
    fetchMock.mockResolvedValueOnce(Response.json(knownEphem)).mockResolvedValueOnce(Response.json(mask))
    await expect(loadSiteData(knownSite)).resolves.toEqual({ site: knownSite, ephem: knownEphem, mask })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/data/ephem/apollo_11.json', '/data/horizon/apollo_11.json',
    ])
  })

  it('keeps a missing static horizon optional', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(ephem)).mockResolvedValueOnce(new Response(null, { status: 404 }))
    await expect(loadSiteData(knownSite)).resolves.toHaveProperty('mask', null)
  })

  it('keeps a missing static ephemeris an error', async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 404 }))
    await expect(loadSiteData(knownSite)).rejects.toThrow('No ephemeris for apollo_11')
  })

  it('continues to normalize catalog east longitudes to ±180', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ ...knownSite, lon: 337.2 }]))
    const { loadSites } = await import('./data')
    const sites = await loadSites()
    expect(sites[0].lon).toBeCloseTo(-22.8)
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/data/sites.json')
  })
})
