// Fetches apparent (airless) azimuth/elevation of the Sun and Earth for every
// site in web/public/data/sites.json from the JPL Horizons API and writes
// web/public/data/ephem/<id>.json in the format of docs/data-format.md.
//
// Usage (from repo root):  node pipeline/fetch_horizons.mjs [site_id ...]
// Raw Horizons responses are cached in pipeline/cache/ (git-ignored).
//
// Written with help from Claude Code (SI tool); see docs/SI_USAGE.md.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
const SITES = 'web/public/data/sites.json'
const OUT = 'web/public/data/ephem'
const CACHE = 'pipeline/cache'
const START = '2026-11-01 00:00'
const STOP = '2028-12-31 23:00'
const STEP_MIN = 60
const BODIES = { sun: '10', earth: '399' }

const expected = (Date.parse('2028-12-31T23:00Z') - Date.parse('2026-11-01T00:00Z')) / (STEP_MIN * 60000) + 1

function params(command, site) {
  const altKm = (site.elev_m ?? 0) / 1000
  const p = {
    format: 'json',
    COMMAND: command,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: 'coord@301',
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `${site.lon},${site.lat},${altKm}`, // east longitude, latitude, km
    START_TIME: START,
    STOP_TIME: STOP,
    STEP_SIZE: `${STEP_MIN} m`,
    QUANTITIES: '4', // apparent azimuth & elevation
    ANG_FORMAT: 'DEG',
    CSV_FORMAT: 'YES',
    APPARENT: 'AIRLESS', // the Moon has no atmosphere: no refraction
  }
  return Object.entries(p)
    .map(([k, v]) => `${k}=${encodeURIComponent(k === 'format' ? v : `'${v}'`)}`)
    .join('&')
}

async function horizons(command, site) {
  const query = params(command, site)
  const key = createHash('sha1').update(query).digest('hex').slice(0, 16)
  const cached = `${CACHE}/${site.id}-${command}-${key}.txt`
  if (existsSync(cached)) return readFileSync(cached, 'utf8')

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}?${query}`, { signal: AbortSignal.timeout(180000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body.error) throw new Error(body.error)
      writeFileSync(cached, body.result)
      return body.result
    } catch (e) {
      console.warn(`  ${site.id}/${command} attempt ${attempt} failed: ${e.message}`)
      await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
  throw new Error(`Horizons request failed for ${site.id}/${command}`)
}

/** Rows between $$SOE and $$EOE: "date, flag, flag, az, el," */
function parse(text) {
  const soe = text.indexOf('$$SOE')
  const eoe = text.indexOf('$$EOE')
  if (soe < 0 || eoe < 0) throw new Error(`No ephemeris table in response:\n${text.slice(0, 800)}`)
  const az = []
  const el = []
  for (const line of text.slice(soe + 5, eoe).trim().split('\n')) {
    const cols = line.split(',').map((c) => c.trim())
    const a = Number(cols[3])
    const e = Number(cols[4])
    if (!Number.isFinite(a) || !Number.isFinite(e)) throw new Error(`Bad row: ${line}`)
    az.push(Math.round(a * 100) / 100)
    el.push(Math.round(e * 100) / 100)
  }
  if (az.length !== expected) throw new Error(`Expected ${expected} rows, got ${az.length}`)
  return { az, el }
}

const only = new Set(process.argv.slice(2))
const sites = JSON.parse(readFileSync(SITES, 'utf8')).filter((s) => !only.size || only.has(s.id))
mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })

for (const site of sites) {
  const lon = site.lon > 180 ? site.lon - 360 : site.lon
  const s = { ...site, lon }
  console.log(`${site.id}  (${s.lat}, ${s.lon})`)
  const sun = parse(await horizons(BODIES.sun, s))
  const earth = parse(await horizons(BODIES.earth, s))
  writeFileSync(`${OUT}/${site.id}.json`, JSON.stringify({
    site_id: site.id,
    start_utc: '2026-11-01T00:00:00Z',
    step_min: STEP_MIN,
    sun,
    earth,
    source: 'JPL Horizons API, observer coord@301 (geodetic), QUANTITIES=4, APPARENT=AIRLESS',
  }))
  const max = (a) => Math.max(...a).toFixed(2)
  const min = (a) => Math.min(...a).toFixed(2)
  console.log(`  sun el ${min(sun.el)}..${max(sun.el)}  earth el ${min(earth.el)}..${max(earth.el)}`)
}
