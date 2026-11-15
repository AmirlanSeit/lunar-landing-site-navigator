import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { parseCoordinates } from '../src/lib/coordinates.js'
import { decodeRowDeltas, hasTerrain, terrainAt, TERRAIN_LAT_LIMIT, type GridLayout, type TerrainGrids } from '../src/lib/terrain.js'
import type { HorizonMask } from '../src/lib/types.js'

let grids: Promise<TerrainGrids> | null = null

async function readGrid(file: URL, size: number): Promise<Int16Array> {
  const raw = gunzipSync(await readFile(file))
  const data = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2).slice()
  if (data.length !== size * size) throw new Error(`Unexpected terrain grid size in ${file.pathname}`)
  return decodeRowDeltas(data, size)
}

/** Loaded once per warm function instance (about 30 MB of int16 heights). */
function loadGrids(): Promise<TerrainGrids> {
  grids ??= (async () => {
    const layout = JSON.parse(await readFile(new URL('../terrain/grid.json', import.meta.url), 'utf8')) as GridLayout
    const [fine, coarse] = await Promise.all([
      readGrid(new URL('../terrain/fine.i16.gz', import.meta.url), layout.fine.size),
      readGrid(new URL('../terrain/coarse.i16.gz', import.meta.url), layout.coarse.size),
    ])
    return { layout, fine, coarse }
  })().catch((error: unknown) => {
    grids = null
    throw error
  })
  return grids
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request): Promise<Response> {
  let coordinates
  try {
    coordinates = parseCoordinates(new URL(request.url).searchParams)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Invalid coordinates.', 400)
  }
  if (!hasTerrain(coordinates.lat)) {
    return errorResponse(`Terrain is available only south of ${Math.abs(TERRAIN_LAT_LIMIT)}°S.`, 400)
  }
  try {
    const t = await loadGrids()
    const result = terrainAt(t, coordinates.lat, coordinates.lon)
    const body: HorizonMask = {
      site_id: 'custom',
      az_step_deg: 1,
      mask_el_deg: result.mask_el_deg,
      dem: t.layout.dem,
      max_range_km: 150,
      elevation_m: result.elevation_m,
      slope_deg: result.slope_deg,
    }
    return Response.json(body, { headers: { 'Cache-Control': 'public, s-maxage=31536000, immutable' } })
  } catch {
    return errorResponse('Could not compute the terrain horizon. Please try again.', 500)
  }
}
