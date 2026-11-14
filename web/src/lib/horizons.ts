import type { Coordinates } from './coordinates'
import type { Track } from './types'

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
export const START_UTC = '2026-11-01T00:00:00Z'
export const STEP_MIN = 60
export const HORIZONS_SOURCE = 'JPL Horizons API, observer coord@301 (geodetic), QUANTITIES=4, APPARENT=AIRLESS'
const START_MS = Date.parse(START_UTC)
const EXPECTED_ROWS = (Date.parse('2028-12-31T23:00:00Z') - START_MS) / (STEP_MIN * 60000) + 1
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Keep the observer parameters in sync with pipeline/fetch_horizons.mjs. */
export function buildHorizonsUrl(command: '10' | '399', site: Coordinates): string {
  const params = {
    format: 'json',
    COMMAND: command,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: 'coord@301',
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `${site.lon},${site.lat},${site.elev_m / 1000}`,
    START_TIME: '2026-11-01 00:00',
    STOP_TIME: '2028-12-31 23:00',
    STEP_SIZE: `${STEP_MIN} m`,
    QUANTITIES: '4',
    ANG_FORMAT: 'DEG',
    CSV_FORMAT: 'YES',
    APPARENT: 'AIRLESS',
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(key === 'format' ? value : `'${value}'`)}`)
    .join('&')
  return `${API}?${query}`
}

/** Pipeline CSV layout: date, illumination flag, visibility flag, az, el, */
export function parseHorizonsTable(text: string): Track {
  const soe = text.indexOf('$$SOE')
  const eoe = text.indexOf('$$EOE')
  if (soe < 0 || eoe <= soe) throw new Error('Horizons returned no ephemeris table.')
  const rows = text.slice(soe + 5, eoe).trim().split('\n')
  if (rows.length !== EXPECTED_ROWS) throw new Error(`Expected ${EXPECTED_ROWS} Horizons rows, got ${rows.length}.`)

  const az: number[] = []
  const el: number[] = []
  for (const [i, line] of rows.entries()) {
    const cols = line.split(',').map((col) => col.trim())
    const date = new Date(START_MS + i * STEP_MIN * 60000)
    const iso = date.toISOString()
    const expectedDate = `${iso.slice(0, 4)}-${MONTHS[date.getUTCMonth()]}-${iso.slice(8, 10)} ${iso.slice(11, 16)}`
    if (cols[0] !== expectedDate) throw new Error(`Unexpected Horizons timestamp at row ${i + 1}.`)
    if (cols.length !== 6 || cols[5] !== '' || !cols[3] || !cols[4]) {
      throw new Error(`Incomplete Horizons row ${i + 1}.`)
    }
    const a = Number(cols[3])
    const e = Number(cols[4])
    if (!Number.isFinite(a) || !Number.isFinite(e) || a < 0 || a > 360 || e < -90 || e > 90) {
      throw new Error(`Invalid Horizons angles at row ${i + 1}.`)
    }
    az.push(Math.round(a * 100) / 100)
    el.push(Math.round(e * 100) / 100)
  }
  return { az, el }
}
