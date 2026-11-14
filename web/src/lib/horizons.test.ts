import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../../api/horizons'
import { buildHorizonsUrl, HORIZONS_SOURCE, parseHorizonsTable, START_UTC } from './horizons'

// Horizons' fixed CSV format includes two flag columns and a trailing comma.
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const rows = Array.from({ length: 19008 }, (_, i) => {
  const date = new Date(Date.parse(START_UTC) + i * 3600000)
  const iso = date.toISOString()
  const timestamp = `${iso.slice(0, 4)}-${months[date.getUTCMonth()]}-${iso.slice(8, 10)} ${iso.slice(11, 16)}`
  return ` ${timestamp},*,m, 359.9999, -1.23456,`
})
const table = (lines = rows) => `Horizons observer metadata\n$$SOE\n${lines.join('\n')}\n$$EOE\nEnd metadata`
const validTable = table()
const request = (query = 'lat=-89.5&lon=0') => new Request(`http://localhost/api/horizons?${query}`)

function changedRow(value: string) {
  return table([value, ...rows.slice(1)])
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Horizons query', () => {
  it.each(['10', '399'] as const)('uses only the pipeline parameter set for body %s', (body) => {
    const url = new URL(buildHorizonsUrl(body, { lat: -89.5, lon: -22.8, elev_m: 1234.5 }))
    expect(`${url.origin}${url.pathname}`).toBe('https://ssd.jpl.nasa.gov/api/horizons.api')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      format: 'json', COMMAND: `'${body}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'",
      EPHEM_TYPE: "'OBSERVER'", CENTER: "'coord@301'", COORD_TYPE: "'GEODETIC'",
      SITE_COORD: "'-22.8,-89.5,1.2345'", START_TIME: "'2026-11-01 00:00'",
      STOP_TIME: "'2028-12-31 23:00'", STEP_SIZE: "'60 m'", QUANTITIES: "'4'",
      ANG_FORMAT: "'DEG'", CSV_FORMAT: "'YES'", APPARENT: "'AIRLESS'",
    })
  })
})

describe('Horizons table parser', () => {
  it('extracts all 19,008 hourly rows, skips flags and rounds to hundredths', () => {
    const track = parseHorizonsTable(validTable.replace(/\n/g, '\r\n'))
    expect(track.az).toHaveLength(19008)
    expect(track.el).toHaveLength(19008)
    expect(track.az[0]).toBe(360)
    expect(track.el[0]).toBe(-1.23)
    expect(track.el[19007]).toBe(-1.23)
  })

  it.each(['No data', '$$EOE\n$$SOE', '$$SOE\nmissing end'])('rejects missing or reversed markers: %s', (text) => {
    expect(() => parseHorizonsTable(text)).toThrow(/table/)
  })

  it('rejects a truncated response and an empty table', () => {
    expect(() => parseHorizonsTable(table(rows.slice(1)))).toThrow(/19008/)
    expect(() => parseHorizonsTable(table([]))).toThrow(/19008/)
  })

  it.each([
    ' 2026-Nov-01 00:00,*,m, , 1,',
    ' 2026-Nov-01 00:00,*,m, 1, ,',
    ' 2026-Nov-01 00:00,*,m, 1,',
    ' 2026-Nov-01 00:00,*,m, 1, 2, extra,',
  ])('rejects incomplete CSV values: %s', (row) => {
    expect(() => parseHorizonsTable(changedRow(row))).toThrow(/Incomplete/)
  })

  it.each(['NaN, 1', '1, Infinity', 'n.a., 1', '-0.1, 0', '360.1, 0', '1, -90.1', '1, 90.1'])('rejects invalid angles: %s', (angles) => {
    expect(() => parseHorizonsTable(changedRow(` 2026-Nov-01 00:00,*,m, ${angles},`))).toThrow(/angles/)
  })

  it('rejects shifted or reordered timestamps even when the row count is correct', () => {
    expect(() => parseHorizonsTable(changedRow(rows[1]))).toThrow(/timestamp/)
    expect(() => parseHorizonsTable(table([rows[1], rows[0], ...rows.slice(2)]))).toThrow(/timestamp/)
  })
})

describe('Horizons GET', () => {
  it('returns contract JSON, rounded coordinates, both bodies and shared-cache headers', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ result: validTable }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await GET(request('lat=-89.50004&lon=337.2&elev_m=1234.56789&url=https://example.com&COMMAND=499&STEP_SIZE=1'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=86400')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const urls = fetchMock.mock.calls.map(([url]) => new URL(url))
    expect(urls.map((url) => url.searchParams.get('COMMAND'))).toEqual(["'10'", "'399'"])
    expect(urls[0].searchParams.get('SITE_COORD')).toBe("'-22.8,-89.5,1.2345679'")
    expect(urls.every((url) => url.hostname === 'ssd.jpl.nasa.gov' && !url.searchParams.has('url'))).toBe(true)
    expect(urls[0].searchParams.get('STEP_SIZE')).toBe("'60 m'")
    const json = await response.json()
    expect(Object.keys(json).sort()).toEqual(['earth', 'site_id', 'source', 'start_utc', 'step_min', 'sun'])
    expect(json).toMatchObject({ site_id: 'custom', start_utc: START_UTC, step_min: 60, source: HORIZONS_SOURCE })
    expect(json.sun.az).toHaveLength(19008)
    expect(json.earth.el).toHaveLength(19008)
  })

  it.each(['', 'lat=91&lon=0', 'lat=0&lon=361', 'lat=NaN&lon=0', 'lat=0&lon=0&elev_m=Infinity'])('returns 400 without fetching for bad input: %s', async (query) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await GET(request(query))
    expect(response.status).toBe(400)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).error).toEqual(expect.any(String))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    () => new Response('Unavailable', { status: 503 }),
    () => Response.json({ error: 'Cannot compute ephemeris' }),
    () => Response.json({ result: '$$SOE\ntruncated\n$$EOE' }),
    () => Response.json({ result: null }),
    () => Response.json(null),
    () => new Response('Not JSON'),
  ])('returns 502 for unsuccessful or invalid upstream responses', async (upstream) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => upstream()))
    const response = await GET(request())
    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).error).toMatch(/JPL Horizons.*try again/)
  })

  it('returns 502 on network failure and cancels the companion request', async () => {
    const signals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, init: RequestInit) => {
      signals.push(init.signal as AbortSignal)
      throw new Error('Network unavailable')
    }))
    const response = await GET(request())
    expect(response.status).toBe(502)
    expect(signals).toHaveLength(2)
    expect(signals.every((signal) => signal.aborted)).toBe(true)
  })

  it('stops both pending fetches at 55 seconds, before the function limit', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
    })))
    const pending = GET(request())
    await vi.advanceTimersByTimeAsync(55_000)
    const response = await pending
    expect(response.status).toBe(502)
    expect(vi.getTimerCount()).toBe(0)
  })
})
