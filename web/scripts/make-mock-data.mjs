// Generates PLACEHOLDER ephemeris and horizon files so the UI can be built before
// the real pipeline (JPL Horizons + LOLA) lands. Every file it writes has "mock": true.
// It never overwrites a file that lacks that flag, so real data is safe.
//
// Geometry: simple analytic model of the sub-solar and sub-Earth points
// (synodic month, solar declination ±1.54°, optical libration ±6.7° / ±7.9°).
// Good enough to look right, NOT good enough to plan with.
//
// Usage: node scripts/make-mock-data.mjs   (run from web/)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

const DATA = 'public/data'
const START = Date.UTC(2026, 10, 1) // 2026-11-01
const END = Date.UTC(2028, 11, 31, 23)
const STEP_MIN = 60
const DAY = 86400000
const NEW_MOON = Date.UTC(2026, 10, 9, 7) // approx. new moon, 2026-11-09
const rad = Math.PI / 180

function azEl(latDeg, lonDeg, subLatDeg, subLonDeg) {
  const phi = latDeg * rad
  const beta = subLatDeg * rad
  const dl = (subLonDeg - lonDeg) * rad
  const sinEl = Math.sin(phi) * Math.sin(beta) + Math.cos(phi) * Math.cos(beta) * Math.cos(dl)
  const az = Math.atan2(
    Math.sin(dl) * Math.cos(beta),
    Math.cos(phi) * Math.sin(beta) - Math.sin(phi) * Math.cos(beta) * Math.cos(dl),
  )
  return [((az / rad) + 360) % 360, Math.asin(sinEl) / rad]
}

function seeded(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296)
}

const r2 = (x) => Math.round(x * 100) / 100

function canWrite(path) {
  if (!existsSync(path)) return true
  return JSON.parse(readFileSync(path, 'utf8')).mock === true
}

const sites = JSON.parse(readFileSync(`${DATA}/sites.json`, 'utf8'))
mkdirSync(`${DATA}/ephem`, { recursive: true })
mkdirSync(`${DATA}/horizon`, { recursive: true })

for (const s of sites) {
  const ephemPath = `${DATA}/ephem/${s.id}.json`
  if (canWrite(ephemPath)) {
    const sun = { az: [], el: [] }
    const earth = { az: [], el: [] }
    for (let t = START; t <= END; t += STEP_MIN * 60000) {
      const days = (t - NEW_MOON) / DAY
      const sunLon = 180 - (360 * days) / 29.530589
      const sunLat = 1.54 * Math.sin((2 * Math.PI * days) / 346.62)
      const earthLat = 6.68 * Math.sin((2 * Math.PI * days) / 27.2122)
      const earthLon = 7.9 * Math.sin((2 * Math.PI * days) / 27.5546 + 1.1)
      const [sa, se] = azEl(s.lat, s.lon, sunLat, sunLon)
      const [ea, ee] = azEl(s.lat, s.lon, earthLat, earthLon)
      sun.az.push(r2(sa)); sun.el.push(r2(se))
      earth.az.push(r2(ea)); earth.el.push(r2(ee))
    }
    writeFileSync(ephemPath, JSON.stringify({
      site_id: s.id,
      start_utc: new Date(START).toISOString().replace('.000', ''),
      step_min: STEP_MIN,
      sun,
      earth,
      source: 'MOCK analytic model – replace with JPL Horizons output',
      mock: true,
    }))
  }

  const maskPath = `${DATA}/horizon/${s.id}.json`
  if (canWrite(maskPath)) {
    const rnd = seeded(s.id)
    const polar = s.lat < -75
    const base = polar ? 0.6 + rnd() * 1.2 : 0.1
    const waves = Array.from({ length: 5 }, (_, k) => ({
      k: k + 1,
      a: (polar ? 1.6 : 0.25) * rnd() / (k + 1) ** 0.6,
      p: rnd() * 2 * Math.PI,
    }))
    const mask = Array.from({ length: 360 }, (_, az) => {
      const v = waves.reduce((sum, w) => sum + w.a * Math.sin(w.k * az * rad + w.p), base)
      return r2(Math.max(0, v))
    })
    writeFileSync(maskPath, JSON.stringify({
      site_id: s.id,
      az_step_deg: 1,
      mask_el_deg: mask,
      dem: 'MOCK random terrain – replace with LOLA horizon mask',
      max_range_km: 0,
      mock: true,
    }))
  }
}
console.log(`mock data written for ${sites.length} sites`)
