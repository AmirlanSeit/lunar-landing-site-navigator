import { parseCoordinates } from '../src/lib/coordinates.js'
import { buildHorizonsUrl, HORIZONS_SOURCE, parseHorizonsTable, START_UTC, STEP_MIN } from '../src/lib/horizons.js'
import type { Ephem } from '../src/lib/types.js'

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

  // Both full-period requests share one deadline, leaving time to return a 502
  // before Vercel's 60-second execution limit.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55_000)
  try {
    const tracks = await Promise.all((['10', '399'] as const).map(async (command) => {
      const response = await fetch(buildHorizonsUrl(command, coordinates), { signal: controller.signal })
      if (!response.ok) throw new Error(`Horizons HTTP ${response.status}`)
      const body: unknown = await response.json()
      if (typeof body !== 'object' || body === null || 'error' in body || !('result' in body) || typeof body.result !== 'string') {
        throw new Error('Horizons returned an invalid response.')
      }
      return parseHorizonsTable(body.result)
    }))
    const ephem: Ephem = {
      site_id: 'custom',
      start_utc: START_UTC,
      step_min: STEP_MIN,
      sun: tracks[0],
      earth: tracks[1],
      source: HORIZONS_SOURCE,
    }
    return Response.json(ephem, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
  } catch {
    return errorResponse('JPL Horizons is unavailable or returned incomplete data. Please try again.', 502)
  } finally {
    clearTimeout(timeout)
    controller.abort()
  }
}
