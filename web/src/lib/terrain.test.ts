import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GET } from '../../api/terrain'
import { decodeRowDeltas, hasTerrain, rayDistancesM, terrainAt, type GridLayout, type TerrainGrids } from './terrain'
import { computeMetrics } from './metrics'
import type { Neighborhood } from './neighborhood'
import { rotateTrack, spotData } from './spot'
import type { Ephem, HorizonMask, Site } from './types'

const read = (path: string) => readFileSync(new URL(path, import.meta.url))
const request = (query: string) => new Request(`http://localhost/api/terrain?${query}`)

describe('terrain helpers', () => {
  it('leaves directions unchanged at the same point and turns north near the pole', () => {
    const track = { az: [0, 90, 200.5], el: [1.5, -2, 10] }
    expect(rotateTrack(track, { lat: -85, lon: 30 }, { lat: -85, lon: 30 })).toEqual(track)
    // 1° of longitude at 85°S turns local north by about sin(85°) ≈ 1°
    const moved = rotateTrack({ az: [90], el: [0] }, { lat: -85, lon: 30 }, { lat: -85, lon: 31 })
    expect(Math.abs(moved.az[0] - 90)).toBeGreaterThan(0.9)
    expect(Math.abs(moved.az[0] - 90)).toBeLessThan(1.1)
  })

  it('decodes row deltas', () => {
    const data = Int16Array.from([5, 1, -2, 7, 0, 3])
    // 2 x 2 grid uses the first four values only
    expect(Array.from(decodeRowDeltas(data.slice(0, 4), 2))).toEqual([5, 6, -2, 5])
  })

  it('uses the same ray distances as pipeline/neighborhood.py', () => {
    const d = rayDistancesM()
    expect(d[0]).toBe(200)
    expect(d).toContain(4880)
    expect(d).toContain(5240)
    expect(d).toContain(24920)
    expect(d).toContain(25480)
    expect(d.at(-2)).toBe(149800)
    expect(d.at(-1)).toBe(150000)
    expect(d.length).toBe(41 + 83 + 260 + 1)
  })

  it('covers the Artemis III zone only', () => {
    expect(hasTerrain(-89.9)).toBe(true)
    expect(hasTerrain(-83.5)).toBe(true)
    expect(hasTerrain(-80.1)).toBe(false)
    expect(hasTerrain(20)).toBe(false)
  })

  it('rejects points outside the DEM zone', async () => {
    const res = await GET(request('lat=-70&lon=0'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/83\.5°S/)
  })

  it('rejects invalid coordinates', async () => {
    expect((await GET(request('lat=abc&lon=0'))).status).toBe(400)
  })
})

describe('terrain horizons from the packed LOLA grids', () => {
  const layout = JSON.parse(read('../../terrain/grid.json').toString('utf8')) as GridLayout
  const grid = (file: string, size: number) => {
    const raw = new Uint8Array(read(`../../terrain/${file}`))
    // gunzip through the API's own loader would hide errors here; use node:zlib directly
    return import('node:zlib').then(({ gunzipSync }) => {
      const bytes = gunzipSync(raw)
      return decodeRowDeltas(new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2).slice(), size)
    })
  }
  const sites = (JSON.parse(read('../../public/data/sites.json').toString('utf8')) as Site[]).filter((s) => hasTerrain(s.lat))

  it('includes the catalogue sites inside the zone', () => {
    expect(sites.map((s) => s.id).sort()).toEqual([
      'artemis_haworth', 'artemis_nobile_rim_1', 'artemis_nobile_rim_2', 'im_2_athena', 'viper_mons_mouton_target',
    ])
  })

  it('matches the full-resolution horizon masks within 0.05°', async () => {
    const t: TerrainGrids = {
      layout,
      fine: await grid('fine.i16.gz', layout.fine.size),
      coarse: await grid('coarse.i16.gz', layout.coarse.size),
    }
    for (const site of sites) {
      const ref = JSON.parse(read(`../../public/data/horizon/${site.id}.json`).toString('utf8')) as HorizonMask
      const got = terrainAt(t, site.lat, site.lon)
      const worst = Math.max(...got.mask_el_deg.map((v, i) => Math.abs(v - ref.mask_el_deg[i])))
      expect(worst, site.id).toBeLessThan(0.05)
      expect(got.slope_deg).toBeGreaterThanOrEqual(0)
      expect(got.slope_deg).toBeLessThan(45)
    }
  }, 30_000)

  it('reproduces the pipeline two-year averages at each best spot nearby', async () => {
    const t: TerrainGrids = {
      layout,
      fine: await grid('fine.i16.gz', layout.fine.size),
      coarse: await grid('coarse.i16.gz', layout.coarse.size),
    }
    for (const site of sites) {
      const nb = JSON.parse(read(`../../public/data/neighborhood/${site.id}.json`).toString('utf8')) as Neighborhood
      const ephem = JSON.parse(read(`../../public/data/ephem/${site.id}.json`).toString('utf8')) as Ephem
      const r = terrainAt(t, nb.best.lat, nb.best.lon)
      const mask: HorizonMask = { site_id: 'custom', az_step_deg: 1, mask_el_deg: r.mask_el_deg, dem: 'LOLA', max_range_km: 150 }
      const d = spotData({ site, ephem, mask: null }, nb.best, mask)
      const m = computeMetrics(d, new Date(ephem.start_utc), ephem.sun.el.length / 24)!
      expect(Math.abs(m.lightPct - nb.best.light_pct), site.id).toBeLessThan(0.5)
      expect(Math.abs(m.commPct - nb.best.earth_pct), site.id).toBeLessThan(0.5)
      expect(Math.abs(r.slope_deg - nb.best.slope_deg), site.id).toBeLessThan(0.1)
    }
  }, 60_000)

  it('serves a mask with slope and elevation from the API', async () => {
    const res = await GET(request('lat=-85.4451&lon=30.9437'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as HorizonMask
    expect(body.mask_el_deg).toHaveLength(360)
    expect(body.dem).toMatch(/LDEM_75S_120M/)
    expect(typeof body.slope_deg).toBe('number')
    expect(typeof body.elevation_m).toBe('number')
  }, 30_000)
})
