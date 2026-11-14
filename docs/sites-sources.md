# Landing-site sources

Checked on 14 November 2026 by the team (research assisted by ChatGPT; see `docs/SI_USAGE.md`).
12 entries: 3 Apollo landings, 3 Artemis candidate-region reference points, 3 CLPS targets or landings
and 3 international landings. Machine-readable version: [`sites-sources.json`](sites-sources.json);
the website uses the same data in [`web/public/data/sites.json`](../web/public/data/sites.json)
(with east longitude converted to −180…180).

**Coordinates.** Degrees; latitude > 0 is north, < 0 is south. `lon_east` here (and `lon` in the JSON)
is east longitude in [0, 360). West longitudes were converted with `lon_east = (lon_signed + 360) % 360`.
Alternative coordinate pairs in the notes use the same (lat, lon_east) form.

**Artemis regions.** The three region names are confirmed by
[NASA's official list of 28 October 2024](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/).
The numbers come from a peer-reviewed paper, not from NASA: they are published reference points of
the regions, not region boundaries and not approved landing sites. Alternative coordinates from a
non-peer-reviewed preprint are recorded separately; they may describe different reference points of
the same area and must not be averaged. "Artemis" in the mission column refers to the historical 2024
list: in [NASA's 2026 mission architecture](https://www.nasa.gov/missions/artemis/nasas-artemis-iii-mission-to-test-future-moon-lander-operations/)
Artemis III is a demonstration in Earth orbit.

**Elevations.** `elev_m` is the published elevation in metres. Elevations were not reduced to a common
vertical datum, so check each source against the chosen DEM before using them in calculations
(the terrain pipeline does not use `elev_m`; it reads heights from the LOLA DEM). `null` means no
verified value. `source` lists the primary coordinate source first, then confirmations and alternatives.

| id | name | lat | lon_east | elev_m | category | mission | sources | note |
|---|---|---:|---:|---:|---|---|---|---|
| apollo_11 | Apollo 11 – Lunar Module | 0.67416 | 23.47314 | -1926 | apollo_landed | Apollo 11 (1969) | [lroc.asu.edu](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [apollojournals.org](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC 2016, ME/DE421 frame. Older Davies 1987 solution: (0.67409, 23.47298) – do not average. |
| apollo_15 | Apollo 15 – Lunar Module | 26.13239 | 3.6333 | -1931 | apollo_landed | Apollo 15 (1971) | [lroc.asu.edu](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [apollojournals.org](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC 2016, ME/DE421 frame. Older Davies 1987 solution: (26.13224, 3.63400) – do not average. |
| apollo_17 | Apollo 17 – Lunar Module | 20.1911 | 30.7723 | -2626 | apollo_landed | Apollo 17 (1972) | [lroc.asu.edu](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf); [nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html); [apollojournals.org](https://www.apollojournals.org/alsj/alsjcoords.html) | LROC 2016, ME/DE421 frame. Older Davies 1987 solution: (20.18809, 30.77475) – do not average. |
| artemis_haworth | Haworth | -86.75 | 337.2 | null | artemis_region_reference | Artemis candidate region (NASA 2024 list) | [mdpi.com](https://www.mdpi.com/2072-4292/17/9/1579); [nasa.gov](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [preprints.org](https://www.preprints.org/manuscript/202511.1488) | Region reference point from Table 1 of the paper, not an approved landing site. Alternative: (-86.753, 337.164), preprint Table 4. Elevation unverified. |
| artemis_nobile_rim_1 | Nobile Rim 1 | -85.42 | 37.38 | null | artemis_region_reference | Artemis candidate region (NASA 2024 list) | [mdpi.com](https://www.mdpi.com/2072-4292/17/9/1579); [nasa.gov](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [preprints.org](https://www.preprints.org/manuscript/202511.1488) | Region reference point from Table 1 of the paper, not an approved landing site. Alternative: (-85.431, 37.241), preprint Table 4. Elevation unverified. |
| artemis_nobile_rim_2 | Nobile Rim 2 | -83.93 | 58.83 | null | artemis_region_reference | Artemis candidate region (NASA 2024 list) | [mdpi.com](https://www.mdpi.com/2072-4292/17/9/1579); [nasa.gov](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [preprints.org](https://www.preprints.org/manuscript/202511.1488) | Region reference point from Table 1 of the paper, not an approved landing site. Alternative: (-83.963, 58.654), preprint Table 4. Elevation unverified. |
| viper_mons_mouton_target | Mons Mouton – VIPER target | -85.4451243175 | 30.9437378907 | null | clps_historical_target | VIPER (earlier CLPS plan) | [assets.science.nasa.gov](https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/documents/VIPER_Technical_Information_AFPP.pdf) | NASA draft, §5.2, PDF pp. 6–7; ME frame. Planned target of the earlier program, not a landing result. Elevation unverified. |
| im_1_odysseus | IM-1 Odysseus | -80.1276 | 1.4367 | 2579 | clps_landed | Intuitive Machines IM-1 (2024) | [nasa.gov](https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf); [nasa.gov](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | Actual landing, JPL PDF pp. 28–29. NASA/LRO rounds to (-80.13, 1.44). Planned point per JPL: (-80.18, 0.98), 2705 m. |
| im_2_athena | IM-2 Athena – Mons Mouton | -84.7906 | 29.1957 | 5321 | clps_landed | Intuitive Machines IM-2 (2025) | [lroc.im-ldi.com](https://lroc.im-ldi.com/featured_sites/im2/flip-book) | Actual position from LROC: the lander ended up on its side in a 20 m crater. |
| chandrayaan_3 | Chandrayaan-3 – Shiv Shakti Point | -69.373 | 32.319 | 529.2 | international_landed | Chandrayaan-3 / ISRO (2023) | [nasa.gov](https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf); [isro.gov.in](https://www.isro.gov.in/ISRO_EN/Chandrayaan3_Details.html); [hou.usra.edu](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1411.pdf) | Landing point and elevation: JPL PDF p. 25; elevation datum unverified. ISRO planned point: (-69.367621, 32.348126). LPSC 1411 gives 31.319°E – conflicting, not used. |
| change_4 | Chang'e-4 – Statio Tianhe (far side) | -45.4562 | 177.5885 | -5927 | international_landed | Chang'e-4 / CNSA (2019) | [lroc.im-ldi.com](https://lroc.im-ldi.com/images/1168); [lroc.im-ldi.com](https://lroc.im-ldi.com/images/1100); [nature.com](https://www.nature.com/articles/s41467-019-12278-3) | LROC 2020: ±13 m (95%). Elevation from LROC 2019 (lat -45.4561). Liu et al. 2019: (-45.4446, 177.5991), -5935 m – a different cartographic solution. Far side: no direct Earth link expected (control case). |
| slim | SLIM – near Shioli crater | -13.316 | 25.251 | -912 | international_landed | SLIM / JAXA (2024) | [nasa.gov](https://www.nasa.gov/missions/lro/nasas-lro-spots-japans-moon-lander/); [global.jaxa.jp](https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf) | Actual landing per NASA/LRO. JAXA target: (-13.31549, 25.24889) – the planned point, not an alternative landing measurement. |

**Using these points.** A position and an elevation alone are not enough to compute sunlight and
direct-to-Earth visibility: that needs the terrain around the point, the height of the panel or
antenna above the surface, and the time. For polar DEMs see [NASA PGDA](https://pgda.gsfc.nasa.gov/products/78).
Chang'e-4 is on the far side, where no direct Earth link is expected; it is kept as a control case.
