// Terrain horizons for custom points near the south pole, from the LOLA DEM grids that
// pipeline/terrain_grid.py packs into web/terrain/. Mirrors pipeline/horizon_mask.py
// (stereographic projection, bilinear sampling, 2 m observer, curvature drop) with the
// ray spacing of pipeline/neighborhood.py: 120 m out to 5 km, 240 m to 25 km, 480 m to 150 km.

export interface GridLayout {
  dem: string
  dem_size: number
  pixel_m: number
  lunar_radius_m: number
  fine: { size: number; origin_px: number }
  coarse: { size: number; factor: number }
  supported_lat_deg: number
}

export interface TerrainGrids {
  layout: GridLayout
  /** Heights in 0.5 m units, row-major. */
  fine: Int16Array
  coarse: Int16Array
}

export interface TerrainResult {
  mask_el_deg: number[]
  elevation_m: number
  slope_deg: number
}

/** Custom points at or south of this latitude get a terrain horizon. Keep in sync with grid.json. */
export const TERRAIN_LAT_LIMIT = -83.5
/** Steepest ground this tool treats as a candidate landing spot (same limit as pipeline/neighborhood.py). */
export const MAX_SLOPE_DEG = 8
const OBSERVER_HEIGHT_M = 2

export function hasTerrain(lat: number): boolean {
  return lat <= TERRAIN_LAT_LIMIT
}

/** Undo the row-delta encoding in place: value[c] = sum of stored[0..c] along each row. */
export function decodeRowDeltas(data: Int16Array, size: number): Int16Array {
  for (let r = 0; r < size; r++) {
    const row = r * size
    for (let c = 1; c < size; c++) data[row + c] += data[row + c - 1]
  }
  return data
}

function bilinear(grid: Int16Array, size: number, row: number, col: number): number {
  const r = Math.min(Math.max(row, 0), size - 1)
  const c = Math.min(Math.max(col, 0), size - 1)
  const r0 = Math.floor(r)
  const c0 = Math.floor(c)
  const r1 = Math.min(r0 + 1, size - 1)
  const c1 = Math.min(c0 + 1, size - 1)
  const fr = r - r0
  const fc = c - c0
  return (
    grid[r0 * size + c0] * (1 - fr) * (1 - fc) +
    grid[r0 * size + c1] * (1 - fr) * fc +
    grid[r1 * size + c0] * fr * (1 - fc) +
    grid[r1 * size + c1] * fr * fc
  )
}

/** Full-DEM pixel coordinates (row, column) of a point, south-polar stereographic. */
function pixelOf(g: GridLayout, latRad: number, lonRad: number): [number, number] {
  const rho = 2 * g.lunar_radius_m * Math.tan((Math.PI / 2 + latRad) / 2)
  const center = (g.dem_size - 1) / 2
  return [center - (rho * Math.cos(lonRad)) / g.pixel_m, center + (rho * Math.sin(lonRad)) / g.pixel_m]
}

/** Terrain height in metres at a full-DEM pixel position: 120 m grid where it exists, else 480 m. */
function heightAtPixel(t: TerrainGrids, row: number, col: number): number {
  const { fine, coarse } = t.layout
  const fr = row - fine.origin_px
  const fc = col - fine.origin_px
  if (fr >= 0 && fr <= fine.size - 1 && fc >= 0 && fc <= fine.size - 1) {
    return bilinear(t.fine, fine.size, fr, fc) * 0.5
  }
  const offset = (coarse.factor - 1) / 2
  return bilinear(t.coarse, coarse.size, (row - offset) / coarse.factor, (col - offset) / coarse.factor) * 0.5
}

export function rayDistancesM(): number[] {
  const d: number[] = []
  for (let x = 200; x <= 5000; x += 120) d.push(x)
  for (let x = 5240; x < 25000; x += 240) d.push(x)
  for (let x = 25480; x < 150000; x += 480) d.push(x)
  d.push(150000)
  return d
}

export function terrainAt(t: TerrainGrids, latDeg: number, lonDeg: number): TerrainResult {
  const g = t.layout
  const R = g.lunar_radius_m
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  const [row, col] = pixelOf(g, lat, lon)
  const elevation = heightAtPixel(t, row, col)
  const observer = elevation + OBSERVER_HEIGHT_M

  // Slope from centred differences one pixel apart (as pipeline/neighborhood.py does).
  const dx = (heightAtPixel(t, row, col + 1) - heightAtPixel(t, row, col - 1)) / (2 * g.pixel_m)
  const dy = (heightAtPixel(t, row - 1, col) - heightAtPixel(t, row + 1, col)) / (2 * g.pixel_m)
  const slope = (Math.atan(Math.hypot(dx, dy)) * 180) / Math.PI

  const dist = rayDistancesM()
  const sinD = dist.map((d) => Math.sin(d / R))
  const cosD = dist.map((d) => Math.cos(d / R))
  const drop = dist.map((d) => (d * d) / (2 * R))
  const sinLat = Math.sin(lat)
  const cosLat = Math.cos(lat)
  const mask: number[] = []
  for (let az = 0; az < 360; az++) {
    const a = (az * Math.PI) / 180
    const sinA = Math.sin(a)
    const cosA = Math.cos(a)
    let best = -90
    for (let k = 0; k < dist.length; k++) {
      const sinLat2 = Math.min(1, Math.max(-1, sinLat * cosD[k] + cosLat * sinD[k] * cosA))
      const lat2 = Math.asin(sinLat2)
      const lon2 = lon + Math.atan2(sinA * sinD[k] * cosLat, cosD[k] - sinLat * sinLat2)
      const [r2, c2] = pixelOf(g, lat2, lon2)
      const angle = (Math.atan2(heightAtPixel(t, r2, c2) - observer - drop[k], dist[k]) * 180) / Math.PI
      if (angle > best) best = angle
    }
    mask.push(Math.round(best * 100) / 100)
  }
  return {
    mask_el_deg: mask,
    elevation_m: Math.round(elevation * 10) / 10,
    slope_deg: Math.round(slope * 10) / 10,
  }
}
