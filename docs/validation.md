# Independent illumination validation

The six site-center light percentages were compared with NASA GSFC PGDA's LOLA **Average solar illumination, 75S–90S, 120 m/px** raster, `AVGVISIB_75S_120M_201608.IMG`. NASA PGDA describes these south-polar LOLA maps as hourly solar-illumination calculations over the approximately 18.6-year lunar nutation cycle, following Mazarico et al. (2011). The product page links the PDS products and cites the paper. [NASA GSFC PGDA product 69: Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69) · [PDS product label](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/avgvisib_75s_120m_201608.lbl) · [PDS raster](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/avgvisib_75s_120m_201608.img) · [Mazarico et al. (2011), DOI](https://doi.org/10.1016/j.icarus.2010.10.030).

The label specifies 7,624 × 7,624 pixels, 120 m/pixel polar stereographic coordinates, a 1,737.4 km reference sphere, and `SCALING_FACTOR = 0.00004`. I decoded each signed 16-bit pixel as `DN × 0.00004`, then bilinearly sampled the raster at the exact site latitude/longitude using the map's stated projection offsets. The values below show NASA's fraction as a percentage alongside this project's center-site `light_pct` and the difference (ours minus NASA). The local metric uses 19,008 hourly Horizons samples per site (about 2.17 years), the committed 120 m-DEM horizon mask, and the website's fractional solar-disc model.

| Site | NASA LOLA average solar illumination (%) | This project, center (%) | Difference (pp) |
|---|---:|---:|---:|
| Haworth | 10.13 | 10.6 | +0.47 |
| Nobile Rim 1 | 28.28 | 28.7 | +0.42 |
| Nobile Rim 2 | 39.05 | 41.5 | +2.45 |
| VIPER Mons Mouton target | 46.19 | 47.5 | +1.31 |
| IM-1 Odysseus | 37.28 | 39.4 | +2.12 |
| IM-2 Athena | 46.49 | 45.5 | −0.99 |

The largest absolute difference is 2.45 percentage points. This is a plausibility cross-check, not a like-for-like reproduction: the PGDA map represents the long-term LOLA/Mazarico calculation, whereas this project uses a much shorter, fixed 19,008-hour JPL Horizons window and raises the observer 2 m above the DEM. The periods and implementations differ; no values were adjusted to the reference raster.
