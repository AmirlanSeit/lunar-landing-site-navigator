// Date-specific conditions at a point near a catalog site (the "best spot nearby").
// The Sun and Earth are effectively at infinity for a few-km baseline, so their directions
// only need re-expressing in the point's own east/north/up frame. Near the pole local north
// turns by up to about 3° across 5 km. Mirrors directions_at() in pipeline/neighborhood.py.
import type { HorizonMask, SiteData, Track } from './types'

type LatLon = { lat: number; lon: number }
type Vec = [number, number, number]

const rad = Math.PI / 180

/** Rows: local east, north, up unit vectors in the Moon-fixed frame. */
function enuBasis(p: LatLon): [Vec, Vec, Vec] {
  const sLat = Math.sin(p.lat * rad)
  const cLat = Math.cos(p.lat * rad)
  const sLon = Math.sin(p.lon * rad)
  const cLon = Math.cos(p.lon * rad)
  return [
    [-sLon, cLon, 0],
    [-sLat * cLon, -sLat * sLon, cLat],
    [cLat * cLon, cLat * sLon, sLat],
  ]
}

/** Azimuth/elevation seen at `from`, re-expressed at `to` (degrees, 0.01° rounding as in the data). */
export function rotateTrack(track: Track, from: LatLon, to: LatLon): Track {
  const [fe, fn, fu] = enuBasis(from)
  const [te, tn, tu] = enuBasis(to)
  // Combined 3x3 matrix M[i][j] = to_i · from_j, so local = M · enu_from.
  const rows = [te, tn, tu].map((t) => [fe, fn, fu].map((f) => t[0] * f[0] + t[1] * f[1] + t[2] * f[2]))
  const az: number[] = []
  const el: number[] = []
  for (let i = 0; i < track.az.length; i++) {
    const a = track.az[i] * rad
    const e = track.el[i] * rad
    const v = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)]
    const x = rows[0][0] * v[0] + rows[0][1] * v[1] + rows[0][2] * v[2]
    const y = rows[1][0] * v[0] + rows[1][1] * v[1] + rows[1][2] * v[2]
    const z = rows[2][0] * v[0] + rows[2][1] * v[1] + rows[2][2] * v[2]
    az.push(Math.round((((Math.atan2(x, y) / rad) % 360) + 360) % 360 * 100) / 100)
    el.push(Math.round((Math.asin(Math.min(1, Math.max(-1, z))) / rad) * 100) / 100)
  }
  return { az, el }
}

/** The catalog site's data moved to a nearby point with that point's own terrain horizon. */
export function spotData(base: SiteData, at: LatLon, mask: HorizonMask): SiteData {
  return {
    site: { ...base.site, id: `${base.site.id}@spot`, name: `${base.site.name} · nearby spot`, lat: at.lat, lon: at.lon },
    ephem: {
      ...base.ephem,
      sun: rotateTrack(base.ephem.sun, base.site, at),
      earth: rotateTrack(base.ephem.earth, base.site, at),
    },
    mask,
  }
}
