# Lunar data pipeline

These scripts generate the real data served from `web/public/data/` in the format fixed by `PLAN.md` §2.1. `fetch_horizons.mjs` supplies Sun/Earth ephemerides (`node pipeline/fetch_horizons.mjs` from the repo root); this README documents the LOLA terrain-mask pipeline.

## LOLA horizon masks

`horizon_mask.py` generates terrain masks for every entry in `web/public/data/sites.json` with latitude south of 75°S. It reads the `LDEM_75S_120M.JP2` LOLA polar GDR, then writes one JSON per qualifying site to `web/public/data/horizon/` using the fixed schema in `PLAN.md` §2.1.

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

### Sanity checks recorded 2026-11-14

- All six sites below 75°S were read from `sites.json`; DEM heights recovered for IM-2 Athena and IM-1 Odysseus are 5,321.5 m and 2,582.6 m respectively, consistent with their site records. The other four DEM heights are 1,625.1 m (Haworth), 5,830.5 m (Nobile Rim 1), 1,018.7 m (Nobile Rim 2), and 6,296.4 m (VIPER Mons Mouton target).
- **IM-2 sanity-check discrepancy:** at the recorded touchdown coordinates, the mask has median 0.79°, only 55.3% of bearings at or below 1°, a 90th percentile of 3.10°, and a maximum of 4.06°. A 0.2–20 km ray comparison using Moon Trek's 100 m LOLA service gives median 0.78°, 55.6% at or below 1°, and the same 4.06° maximum, so the higher directions are present in the terrain source and are not a projection or sampling artifact.
- The 40 × 40 km LOLA verification window also contains a 6,907.5 m peak at (-84.83568°, 38.25210°), 24.84 km from the IM-2 touchdown coordinates; Moon Trek returns 6,907 m there. A diagnostic mask with the observer moved to that peak has 98.89% of bearings below 1° (99.17% at or below 1°) and a 1.04° maximum. The prompt's "almost everywhere below 1°" expectation fits this high point, but not the IM-2 touchdown point in `sites.json`. The committed mask remains at the recorded touchdown coordinates; no coordinates or angles were adjusted to force the sanity check.
- The largest mask value among the six sites is 15.35° at Nobile Rim 1 (the requested approximately 15° sanity bound); the other site maxima range from 4.06° to 10.53°.
- Silhouette check: NASA Moon Trek's [south-pole LOLA ImageServer](https://trek.nasa.gov/moon/trekarcgis/rest/services/LRO_LOLA_DEM_SPole45_100mp_v04/ImageServer) returns 5,323 m at IM-2 Athena, 1.5 m above the PDS DEM's bilinear value. A 40 × 40 km elevation window centered on Athena shows the same crater and ridge pattern in the two grids (height correlation 0.99998). This is a visual/grid-alignment check, not an independent accuracy assessment, because both products use LOLA data.

## SI disclosure

The horizon-mask implementation and its plots were created with help from ChatGPT Codex (GPT-6). The team selected the candidate-site list and reviewed the DEM choice and the mask outputs.
