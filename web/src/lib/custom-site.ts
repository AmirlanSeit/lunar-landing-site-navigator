import { parseCoordinates } from './coordinates'
import type { Site } from './types'

export function createCustomSite(input: { name: string; lat: string; lon: string }): Site {
  const { lat, lon } = parseCoordinates(new URLSearchParams({ lat: input.lat, lon: input.lon }))
  const label = `${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`
  return {
    id: `custom-${crypto.randomUUID()}`,
    name: input.name.trim() || `Custom (${label})`,
    lat,
    lon,
    elev_m: null,
    category: 'custom',
    mission: 'User-defined landing site',
    source: [],
    note: 'Custom point – terrain not modeled (flat horizon)',
  }
}
