import { describe, expect, it } from 'vitest'
import { buildCalendar } from './calendar'
import type { SiteData } from './types'
import { DEFAULT_THRESHOLDS } from './verdict'

const START = '2027-01-01T00:00:00Z'

function hourlyData(
  sunEl: (hour: number) => number,
  earthEl: (hour: number) => number = () => 5,
  count = 72,
  start = START,
  id = 'test',
): SiteData {
  const hours = Array.from({ length: count }, (_, hour) => hour)
  return {
    site: {
      id, name: id, lat: -89, lon: 0, elev_m: null, category: 'custom',
      mission: '', source: [], note: '',
    },
    ephem: {
      site_id: id, start_utc: start, step_min: 60, source: 'synthetic test',
      sun: { az: hours.map(() => 90), el: hours.map(sunEl) },
      earth: { az: hours.map(() => 0), el: hours.map(earthEl) },
    },
    mask: null,
  }
}

describe('buildCalendar', () => {
  it('evaluates GO, RISKY and NO-GO days from their full mission metrics', () => {
    // Day 1 is fully lit, day 2 is half lit and day 3 is dark.
    const data = hourlyData((hour) => hour < 36 ? 5 : -5)
    const [{ cells }] = buildCalendar([data], new Date(START), 1, DEFAULT_THRESHOLDS, 0, 2)
    expect(cells.map((cell) => cell?.verdict)).toEqual(['GO', 'RISKY', 'NO-GO'])
    expect(cells.map((cell) => cell?.lightPct)).toEqual([100, 50, 0])
    expect(cells.map((cell) => cell?.commPct)).toEqual([100, 100, 100])
    expect(cells.map((cell) => cell?.date.toISOString())).toEqual([
      '2027-01-01T00:00:00.000Z', '2027-01-02T00:00:00.000Z', '2027-01-03T00:00:00.000Z',
    ])
  })

  it('keeps site input order, including rows with no available dates', () => {
    const later = hourlyData(() => 5, undefined, 72, '2028-01-01T00:00:00Z', 'later')
    const dark = hourlyData(() => -5, undefined, 72, START, 'dark')
    const bright = hourlyData(() => 5, undefined, 72, START, 'bright')
    const rows = buildCalendar([later, dark, bright], new Date(START), 1, DEFAULT_THRESHOLDS, 0, 0)
    expect(rows.map((row) => row.site.id)).toEqual(['later', 'dark', 'bright'])
    expect(rows[0].cells).toEqual([null])
    expect(rows[1].cells[0]?.verdict).toBe('NO-GO')
    expect(rows[2].cells[0]?.verdict).toBe('GO')
  })

  it('uses all 60 inclusive default offsets and preserves the UTC time of day', () => {
    const data = hourlyData(() => 5, undefined, 24 * 90)
    const landing = new Date('2027-01-15T12:34:00Z')
    const [{ cells }] = buildCalendar([data], landing, 1, DEFAULT_THRESHOLDS)
    expect(cells).toHaveLength(60)
    expect(cells[0]?.date.toISOString()).toBe('2027-01-01T12:34:00.000Z')
    expect(cells[14]?.date.toISOString()).toBe(landing.toISOString())
    expect(cells[59]?.date.toISOString()).toBe('2027-03-01T12:34:00.000Z')
    expect(cells.every((cell) => cell?.date.getUTCHours() === 12 && cell.date.getUTCMinutes() === 34)).toBe(true)
  })

  it('returns null before or after coverage and whenever the full mission does not fit', () => {
    const data = hourlyData(() => 5, undefined, 48)
    const [{ cells: oneDay }] = buildCalendar([data], new Date(START), 1, DEFAULT_THRESHOLDS, -1, 2)
    expect(oneDay.map((cell) => cell?.verdict ?? null)).toEqual([null, 'GO', 'GO', null])
    const [{ cells: twoDays }] = buildCalendar([data], new Date(START), 2, DEFAULT_THRESHOLDS, -1, 2)
    expect(twoDays.map((cell) => cell?.verdict ?? null)).toEqual([null, 'GO', null, null])
  })

  it.each([
    ['2028-02-28T23:30:00Z', '2028-02-29T23:30:00.000Z', '2028-03-01T23:30:00.000Z'],
    ['2027-12-31T23:30:00Z', '2028-01-01T23:30:00.000Z', '2028-01-02T23:30:00.000Z'],
  ])('shifts UTC dates across leap/month/year boundaries from %s', (start, next, last) => {
    const data = hourlyData(() => 5, undefined, 72, start)
    const [{ cells }] = buildCalendar([data], new Date(start), 1, DEFAULT_THRESHOLDS, 0, 2)
    expect(cells.map((cell) => cell?.date.toISOString())).toEqual([new Date(start).toISOString(), next, last])
  })

  it('uses the supplied sunlight and Earth-link thresholds', () => {
    const halfLit = hourlyData((hour) => hour % 24 < 12 ? 5 : -5)
    const halfLinked = hourlyData(() => 5, (hour) => hour % 24 < 12 ? 5 : -5)
    const verdict = (data: SiteData, goLight: number, goComm: number) =>
      buildCalendar([data], new Date(START), 1, { goLight, goComm }, 0, 0)[0].cells[0]?.verdict
    expect(verdict(halfLit, 40, 50)).toBe('GO')
    expect(verdict(halfLit, 70, 50)).toBe('RISKY')
    expect(verdict(halfLit, 90, 50)).toBe('NO-GO')
    expect(verdict(halfLinked, 70, 50)).toBe('GO')
    expect(verdict(halfLinked, 70, 75)).toBe('RISKY')
    expect(verdict(halfLinked, 70, 80)).toBe('NO-GO')
  })

  it('changes results when mission duration includes the following dark day', () => {
    const data = hourlyData((hour) => hour < 24 ? 5 : -5)
    const [short] = buildCalendar([data], new Date(START), 1, DEFAULT_THRESHOLDS, 0, 0)
    const [long] = buildCalendar([data], new Date(START), 2, DEFAULT_THRESHOLDS, 0, 0)
    expect(short.cells[0]).toMatchObject({ verdict: 'GO', lightPct: 100 })
    expect(long.cells[0]).toMatchObject({ verdict: 'RISKY', lightPct: 50 })
  })

  it('does not mutate site data, the landing Date or thresholds', () => {
    const data = [hourlyData(() => 5)]
    const landing = new Date(START)
    const thresholds = { ...DEFAULT_THRESHOLDS }
    const before = JSON.stringify({ data, landing, thresholds })
    const rows = buildCalendar(data, landing, 1, thresholds, 0, 1)
    expect(JSON.stringify({ data, landing, thresholds })).toBe(before)
    expect(rows[0].cells[0]?.date).not.toBe(landing)
    expect(rows[0].cells[0]?.date).not.toBe(rows[0].cells[1]?.date)
  })

  it('returns no rows for an empty site list', () => {
    expect(buildCalendar([], new Date(START), 14, DEFAULT_THRESHOLDS)).toEqual([])
  })

  it.each([[2, 1], [0.5, 2], [0, Infinity], [NaN, 0]])('rejects invalid offset ranges %s..%s', (from, to) => {
    expect(() => buildCalendar([], new Date(START), 1, DEFAULT_THRESHOLDS, from, to)).toThrow(RangeError)
  })

  it.each([0, -1, Infinity, NaN])('rejects invalid mission duration %s', (days) => {
    expect(() => buildCalendar([], new Date(START), days, DEFAULT_THRESHOLDS)).toThrow(RangeError)
  })

  it('rejects an invalid landing date', () => {
    expect(() => buildCalendar([], new Date(NaN), 1, DEFAULT_THRESHOLDS)).toThrow(RangeError)
  })
})
