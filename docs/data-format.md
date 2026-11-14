# Data format

All data the website reads lives in `web/public/data/` and is served as static JSON.
`web/src/lib/types.ts` and `web/src/lib/neighborhood.ts` mirror these formats – change them together.

## `sites.json` – the site catalog

```json
[{ "id": "artemis_haworth", "name": "Haworth", "lat": -86.75, "lon": -22.8, "elev_m": null,
   "category": "artemis_region_reference",
   "mission": "Artemis candidate region (NASA 2024 list)",
   "source": ["https://… (primary coordinate source first)", "https://…"],
   "note": "…" }]
```

- `lat` in degrees, south negative. `lon` is **east** longitude in −180…180 (the site also accepts 0…360).
- `elev_m` may be `null` when no verified value exists. It is informational only: terrain heights come from the DEM.
- `category`: `apollo_landed`, `artemis_region_reference`, `clps_historical_target`, `clps_landed`,
  `international_landed`, or `custom` (user-entered points, never stored in this file).
- Everything shown in the UI (`name`, `mission`, `note`) is in English. Provenance: [`sites-sources.md`](sites-sources.md).

## `ephem/<id>.json` – Sun and Earth positions

```json
{ "site_id": "artemis_haworth", "start_utc": "2026-11-01T00:00:00Z", "step_min": 60,
  "sun":   { "az": [ /* degrees from north, clockwise */ ], "el": [ /* degrees */ ] },
  "earth": { "az": [], "el": [] },
  "source": "JPL Horizons API, observer coord@301 (geodetic), QUANTITIES=4, APPARENT=AIRLESS" }
```

- Hourly from 2026-11-01 00:00 to 2028-12-31 23:00 UTC (19,008 samples), rounded to 0.01°.
- Elevations are above the **spherical** horizon, with no refraction (the Moon has no atmosphere).
- Produced by `pipeline/fetch_horizons.mjs`. Custom points get the same structure from `GET /api/horizons?lat=&lon=`
  (`web/api/horizons.ts`), with `site_id: "custom"`.

## `horizon/<id>.json` – terrain horizon (polar sites only)

```json
{ "site_id": "artemis_haworth", "az_step_deg": 1, "mask_el_deg": [ /* 360 values */ ],
  "dem": "LOLA LDEM_75S_120M", "max_range_km": 150 }
```

- Elevation angle of the highest terrain in each direction, seen from 2 m above the DEM surface,
  including lunar curvature (`pipeline/horizon_mask.py`). Sites without a file use a flat horizon (0°).

## `neighborhood/<id>.json` – best spot within 5 km (polar sites only)

```json
{ "site_id": "…", "radius_km": 5, "spacing_m": 240, "observer_height_m": 2, "dem": "…", "notes": "…",
  "center": { "lat": …, "lon": …, "light_pct": …, "earth_pct": …, "longest_dark_h": …, "slope_deg": … },
  "best":   { …same fields…, "distance_km": …, "bearing_deg": …, "no_earth_link_nearby": false },
  "points": [ { "lat": …, "lon": …, "light_pct": …, "earth_pct": …, "slope_deg": … } ] }
```

- Two-year averages over the full ephemeris period on a 240 m grid (`pipeline/neighborhood.py`).
- `best`: highest `light_pct` among points with `earth_pct ≥ 50` and `slope_deg ≤ 8` (nearest wins ties).

## Visibility rules (shared by the site and the pipeline)

- Visible fraction of the solar disk: `clamp((sun_el − mask(sun_az) + 0.265) / 0.53, 0, 1)`,
  with the mask interpolated linearly in azimuth. Sunlight % is its mean.
- Earth is in view when `earth_el > mask(earth_az) − 0.95` (Earth spans about 1.9° from the Moon).
- `"mock": true` marks placeholder files from `web/scripts/make-mock-data.mjs`; the site shows a
  "Development build" banner while any are loaded. None remain in the published data.
