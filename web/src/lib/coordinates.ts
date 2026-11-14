export interface Coordinates {
  lat: number
  lon: number
  elev_m: number
}

// Number() alone also accepts blanks and hexadecimal; coordinates are decimal.
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
const round4 = (value: number) => Number(value.toFixed(4)) || 0

/** Validate before rounding, then store east longitude in the contract's ±180 range. */
export function parseCoordinates(params: URLSearchParams): Coordinates {
  function read(key: string, label: string, min?: number, max?: number): number {
    const values = params.getAll(key)
    if (values.length > 1) throw new Error(`${label} must be provided only once.`)
    if (key === 'elev_m' && values.length === 0) return 0

    const raw = values[0]?.trim() ?? ''
    const value = Number(raw)
    const requirement = min === undefined ? 'a finite number in meters' : `a number from ${min} to ${max}`
    if (!decimal.test(raw) || !Number.isFinite(value)
      || (min !== undefined && value < min) || (max !== undefined && value > max)) {
      throw new Error(`${label} must be ${requirement}.`)
    }
    return round4(value)
  }

  const lat = read('lat', 'Latitude', -90, 90)
  const lon = read('lon', 'Longitude', -180, 360)
  const elev_m = read('elev_m', 'Elevation')
  return { lat, lon: round4(lon > 180 ? lon - 360 : lon), elev_m }
}
