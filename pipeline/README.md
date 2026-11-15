# Lunar data pipeline

These scripts generate the real data served from `web/public/data/` in the format fixed by [`docs/data-format.md`](../docs/data-format.md). `fetch_horizons.mjs` supplies Sun/Earth ephemerides (`node pipeline/fetch_horizons.mjs` from the repo root); this README documents the LOLA terrain-mask pipeline.

## LOLA horizon masks

`horizon_mask.py` generates terrain masks for every entry in `web/public/data/sites.json` with latitude south of 75°S. It reads the `LDEM_75S_120M.JP2` LOLA polar GDR, then writes one JSON per qualifying site to `web/public/data/horizon/` using the fixed schema in [`docs/data-format.md`](../docs/data-format.md).

### DEM source

- Product: **LOLA GDR `LDEM_75S_120M`**, PDS dataset ID `LRO-L-LOLA-4-GDR-V1.0`.
- Archive directory and JP2: [PDS Geosciences LOLA polar JP2 directory](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/jp2/) · [direct JP2 file](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/jp2/ldem_75s_120m.jp2).
- The product label describes a 7,624 × 7,624 grid at 120 m/pixel covering 75–90°S. The JP2 is 33,948,010 bytes, small enough to download and process locally. Its companion label and projection metadata are `ldem_75s_120m_jp2.lbl` and `ldem_75s_120m_aux.xml` in the same archive directory.
- The archive directory is under the LOLA-3 volume, while the individual product label identifies the GDR dataset as LOLA-4; the product label's dataset ID is recorded above.
- `pipeline/dem/` is ignored by Git. The script downloads the JP2 there if it is absent or incomplete; the DEM itself is not committed.

### Calculation

- Heights are relative to the 1,737,400 m lunar reference radius. The JP2 stores the PDS signed 16-bit samples shifted into unsigned JPEG 2000 codes; the script converts each code back with `(code - 32768) × 0.5 m`.
- The observer is the bilinearly interpolated DEM height at the site's coordinates plus 2 m. `elev_m` from `sites.json` is not used.
- For each integer bearing 0–359° clockwise from local north, the script computes spherical destination points from 0.2 to 150 km at 120 m intervals, projects those points into the south-polar stereographic DEM, and takes the largest `atan2(height difference − d²/(2R), d)` angle, with `R = 1,737,400 m`.
- Bilinear DEM sampling preserves the map's local terrain profile. Calculating the spherical destination points before projection is essential: the map's grid-up direction changes with longitude and is not generally local north.

### Run

Python 3 with `numpy` and `Pillow` (the Pillow build must include JPEG 2000/OpenJPEG support):

```powershell
python -m pip install numpy Pillow
python pipeline/horizon_mask.py
python pipeline/plot_mask.py
```

The plotter saves a north-up, clockwise-from-north polar PNG for each mask in `pipeline/plots/`. Both `pipeline/dem/` and `pipeline/plots/` are ignored by Git.

## Neighborhood comparison

`neighborhood.py` evaluates a local candidate grid around each site south of 75°S. It reads the same `LDEM_75S_120M` JP2 already used for the horizon masks and the site's committed JPL Horizons ephemeris; it does not change `horizon/` or `ephem/`.

```powershell
python pipeline/neighborhood.py --radius-km 5 --spacing-m 240
python pipeline/plot_neighborhood.py --site-id artemis_nobile_rim_1
python pipeline/plot_neighborhood.py --site-id artemis_haworth
```

The search grid is laid out in local east/north offsets and clipped by great-circle distance, then each coordinate is placed on the lunar sphere with the direct geodesic formula. Each candidate's 360 rays keep the horizon-mask convention: clockwise from local north, spherical destination points, DEM bilinear samples, LOLA terrain height plus a 2 m observer, and the 1,737.4 km lunar radius. Ray samples are 120 m apart from 0.2–5 km, 240 m apart from 5–25 km, and 480 m apart from 25–150 km. Numpy processes six candidate masks at a time and evaluates ephemeris metrics in blocks of 32; the center candidate is replaced with the full 120 m `horizon_mask.py` result. This variable far-field ray spacing reduced the six-site 5 km run to 390.8 seconds on the development laptop while retaining 120 m sampling in the near field.

Sun and Earth directions come from the center-site ephemeris and are rotated into each candidate's own local east/north/up frame (`directions_at`). The bodies' parallax across 5 km is below 0.001°, but near the pole local north itself turns by roughly the longitude difference times sin(latitude), up to about 3° across 5 km, so azimuths must be rotated. (The first version reused the center azimuths unrotated; an external review caught it on 14 November 2026.) Check: at a Haworth candidate 3.9 km from the center, the rotated directions match JPL Horizons queried directly at that point within 0.005°, versus 2.25° in azimuth without rotation. Illumination applies the website's linearly interpolated one-degree horizon, 0.265° solar radius and 0.53° disk diameter; Earth visibility uses the website's 0.95° Earth radius and strict `earth_el > horizon - 0.95` test. Longest darkness counts consecutive hourly samples with a visible solar-disk fraction below 0.5. Slope is the local angle derived from centered 120 m DEM height differences.

### Center cross-check and neighborhood results (2026-11-14)

At the center, computed results use the already committed one-degree horizon mask and match the site metric values to <0.01 percentage point before rounding. The user-provided rounded reference values are reproduced within 0.5 percentage point:

| Site | Reference light / Earth (%) | Center light / Earth (%) | Best light / Earth (%) | Light gain |
|---|---:|---:|---:|---:|
| Haworth | 11 / 42 | 10.6 / 42.5 | 59.0 / 68.2 | +48.4 pp |
| Nobile Rim 1 | 29 / 0 | 28.7 / 0.0 | 85.0 / 61.5 | +56.3 pp |
| Nobile Rim 2 | 42 / 64 | 41.5 / 63.8 | 53.2 / 83.3 | +11.7 pp |
| VIPER Mons Mouton target | 48 / 100 | 47.5 / 100.0 | 80.3 / 67.8 | +32.8 pp |
| IM-1 Odysseus | 39 / 100 | 39.4 / 100.0 | 52.4 / 100.0 | +13.0 pp |
| IM-2 Athena | 46 / 95 | 45.5 / 94.6 | 52.0 / 75.9 | +6.5 pp |

Every selected best point has slope ≤8° and Earth visibility ≥50%. The maximum measured slope on a selected point is 4.79°. Largest light gains are at Nobile Rim 1 (+56.3 pp) and Haworth (+48.4 pp); their heatmaps are [`Nobile Rim 1`](../docs/images/neighborhood-artemis_nobile_rim_1.png) and [`Haworth`](../docs/images/neighborhood-artemis_haworth.png). Each PNG is under 300 KB and includes both markers, a 0–100% scale and the requested attribution.

An independent center-value comparison with NASA's LOLA average solar illumination product is in [`docs/validation.md`](../docs/validation.md). The PDS raster and map label were sampled at each center coordinate; the largest difference from this approximately 2.17-year Horizons series is 2.45 percentage points.

### Sanity checks recorded 2026-11-14

- All six sites below 75°S were read from `sites.json`; DEM heights recovered for IM-2 Athena and IM-1 Odysseus are 5,321.5 m and 2,582.6 m respectively, consistent with their site records. The other four DEM heights are 1,625.1 m (Haworth), 5,830.5 m (Nobile Rim 1), 1,018.7 m (Nobile Rim 2), and 6,296.4 m (VIPER Mons Mouton target).
- **IM-2 sanity-check discrepancy:** at the recorded touchdown coordinates, the mask has median 0.79°, only 55.3% of bearings at or below 1°, a 90th percentile of 3.10°, and a maximum of 4.06°. A 0.2–20 km ray comparison using Moon Trek's 100 m LOLA service gives median 0.78°, 55.6% at or below 1°, and the same 4.06° maximum, so the higher directions are present in the terrain source and are not a projection or sampling artifact.
- The 40 × 40 km LOLA verification window also contains a 6,907.5 m peak at (-84.83568°, 38.25210°), 24.84 km from the IM-2 touchdown coordinates; Moon Trek returns 6,907 m there. A diagnostic mask with the observer moved to that peak has 98.89% of bearings below 1° (99.17% at or below 1°) and a 1.04° maximum. The prompt's "almost everywhere below 1°" expectation fits this high point, but not the IM-2 touchdown point in `sites.json`. The committed mask remains at the recorded touchdown coordinates; no coordinates or angles were adjusted to force the sanity check.
- The largest mask value among the six sites is 15.35° at Nobile Rim 1 (the requested approximately 15° sanity bound); the other site maxima range from 4.06° to 10.53°.
- Silhouette check: NASA Moon Trek's [south-pole LOLA ImageServer](https://trek.nasa.gov/moon/trekarcgis/rest/services/LRO_LOLA_DEM_SPole45_100mp_v04/ImageServer) returns 5,323 m at IM-2 Athena, 1.5 m above the PDS DEM's bilinear value. A 40 × 40 km elevation window centered on Athena shows the same crater and ridge pattern in the two grids (height correlation 0.99998). This is a visual/grid-alignment check, not an independent accuracy assessment, because both products use LOLA data.

## SI disclosure

The horizon-mask and neighborhood implementations and their plots were created with help from SI. The team selected the candidate-site list and reviewed the DEM choice, formulas, and outputs.

## Packed DEM for on-demand terrain (`terrain_grid.py`)

`python pipeline/terrain_grid.py` writes `web/terrain/`: `fine.i16.gz` (the 120 m DEM cropped to 3,372 × 3,372 pixels, covering every point south of 83.5°S plus 5 km), `coarse.i16.gz` (the whole DEM averaged over 4 × 4 pixel blocks, 480 m) and `grid.json`. Heights are int16 PDS codes stored as row differences, which gzip to 16.7 MB in total. `web/api/terrain.ts` uses the fine grid where a ray sample falls inside it and the coarse grid beyond. The script then rebuilds the catalog horizons inside the zone with this scheme: the largest difference from the full-resolution masks is 0.04° and the two-year averages change by at most 0.1 percentage points.
