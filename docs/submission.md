# Submission copy

The fields below are ready to paste after the team replaces the remaining bracketed placeholders, including [VIDEO LINK]. Team: Ninjago: Masters of Claudejitzu; participant names stay as [MEMBERS] wherever they are needed. Proposed next steps are for the team to review.

## Project Name

Lunar Landing Site Navigator

### Tagline (chosen by the team)

The Moon gives us a destination.

## High-Level Project Summary

Lunar Landing Site Navigator compares lunar landing sites when a mission's landing date changes. It combines NASA JPL Horizons Sun and Earth positions with LRO LOLA terrain to model sunlight and direct Earth visibility for a chosen mission length. Users compare ranked site cards, inspect horizon and timeline views, scan a launch window calendar, and find better spots within 5 km on a terrain map. A built-in example shows a hypothetical two-week delay turning the historical VIPER target at Mons Mouton from GO to NO-GO; the tool then suggests a five-day shift or another site. At the Nobile Rim 1 reference point, a ridge 3.7 km away raises average sunlight from 29% to 85%. Engineers can explore early tradeoffs; students learn the geometry through explanations and a latitude lab. At six polar reference points, our sunlight averages are within 2.5 percentage points of NASA's long-term LOLA illumination map.

## Link to Project Demo

[VIDEO LINK]

## Link to Final Project

Live application: https://lunar-landing-site-navigator-sigma.vercel.app

Source repository: https://github.com/AmirlanSeit/lunar-landing-site-navigator

If the form accepts one URL, paste the live application URL. The repository is also linked in the description below.

## Detailed Project Description

### What the user does

1. Choose a region, a planned site and a new landing date in UTC. Optionally enter the original date to compare before and after the change. Set the mission duration and the sunlight and Earth-visibility thresholds.
2. Read the ranked site cards and their GO, RISKY or NO-GO results. Inspect the reasons, the horizon panorama and the mission timeline. Compare two to four sites side by side.
3. Use Tactics to inspect the best alternative in the region or try the nearest whole-day shift that meets the selected GO thresholds within 30 days in either direction. For the six polar sites, Tactics also names a better spot within 5 km, and the site's Why panel maps sunlight and Earth visibility on a 240 m grid around it.
4. Explore the launch window calendar, covering 14 days before through 45 days after the selected landing date. Clicking a cell sets its date and site as the new plan.
5. Add arbitrary lunar coordinates for a flat-horizon comparison, open Explain the math, or copy a scenario link to revisit the settings.

### How it works

The catalog contains 12 sites, including actual landings, historical targets and published reference points for candidate regions. Node.js scripts obtain hourly, airless Sun and Earth azimuths and elevations from JPL Horizons for 1 November 2026 through 31 December 2028. Python scripts sample the 120 m LRO LOLA south-pole DEM to build terrain horizons for six catalog sites south of 75 degrees south. Each mask has 360 bearings and considers terrain out to 150 km, lunar curvature and an observer 2 m above the DEM surface.

The browser compares the Sun and Earth elevations with the horizon in the corresponding direction. It estimates the visible fraction of the solar disk and whether any part of Earth clears the terrain. These samples produce mission-average sunlight, Earth visibility and dark-interval metrics. The selected thresholds determine the verdict; the same evaluation drives ranking, date suggestions and the calendar. The default mission is 14 days, with GO thresholds of 70% sunlight and 50% Earth visibility. A Vercel function obtains Horizons data for custom coordinates.

For the six polar sites, a precomputed terrain search evaluates 1,361 points on a 240 m grid within 5 km, each with its own LOLA horizon. It rotates the site's Sun and Earth directions into each point's own local frame (near the pole, local north turns by up to about 3 degrees across 5 km; checked against JPL Horizons queried directly at a candidate point, within 0.005 degrees) and averages over the full stored period. The website shows the result as a sunlight or Earth-visibility map and names the best spot with at least 50% Earth visibility and a slope of 8 degrees or less. At the Nobile Rim 1 reference point, which sits on a 13-degree slope and never sees Earth, a ridge 3.7 km north-northwest receives 85% sunlight and 62% Earth visibility instead of 29% and 0%. These are two-year averages, not date-specific verdicts.

### A repeatable example

Open the application and click Demo. At the historical VIPER target at Mons Mouton, a hypothetical landing-date change from 13 to 27 November 2027 changes GO to NO-GO. Displayed sunlight falls from 70% to 35% for the 14-day mission. Tactics suggests landing five days later, on 2 December, or inspecting Nobile Rim 2 on the delayed date. The calendar lets users explore the surrounding windows. These are modeled scenarios, not records of an actual VIPER launch delay.

### Who it helps and what the result means

For mission engineers, the prototype makes early sunlight and Earth-visibility tradeoffs easier to inspect and share. For students, the horizon graphics, explanations and latitude lab connect angles and terrain with illumination and communication geometry.

GO means the chosen mission-average thresholds are met. It does not promise uninterrupted sunlight or radio contact. Sunlight is a modeled visible-disk fraction, not generated electrical power; Earth visibility is geometry, not a radio link budget. Custom points and the six lower-latitude catalog sites use a flat horizon. The regional ranking does not calculate transfer distance or fuel requirements. Detailed landing hazards, energy storage and flight constraints need separate analysis.

### Implementation and next steps

The interface uses React, TypeScript and Vite, with Vercel hosting and a server-side Horizons endpoint. Node.js handles ephemeris collection; Python, NumPy and Pillow handle terrain masks and diagnostic plots. Source: https://github.com/AmirlanSeit/lunar-landing-site-navigator

Proposed next steps are terrain masks for custom points, date-specific verdicts for nearby spots, clearer uncertainty estimates, and mission-specific power and communication constraints. These additions are future work for the team to assess.

## NASA Data

- **JPL Horizons.** [API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [observer-system manual](https://ssd.jpl.nasa.gov/horizons/manual.html). The catalog pipeline and custom-coordinate proxy request topocentric Sun and Earth positions from lunar coordinates using an airless model. These positions are the time-dependent input to visibility calculations.
- **LRO LOLA GDR, PDS Geosciences Node.** [LDEM_75S_120M product label](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/jp2/ldem_75s_120m_jp2.lbl), [DEM download](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/jp2/ldem_75s_120m.jp2) and [archive directory](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/jp2/). Dataset `LRO-L-LOLA-4-GDR-V1.0`, product `LDEM_75S_120M`, supplies the 120 m terrain grid used for the six south-pole horizon masks.
- **LROC.** [Coordinates of lunar anthropogenic targets](https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf) supplies the adopted Apollo 11, 15 and 17 landing-module coordinates. The [IM-2 site record](https://lroc.im-ldi.com/featured_sites/im2/flip-book) supplies Athena's touchdown position. [Chang'e-4 location](https://lroc.im-ldi.com/images/1168) and [topography](https://lroc.im-ldi.com/images/1100) supply its adopted position and elevation.
- **NASA Moon Trek.** The [LOLA south-pole elevation service](https://trek.nasa.gov/moon/trekarcgis/rest/services/LRO_LOLA_DEM_SPole45_100mp_v04/ImageServer) was used to check terrain heights, alignment and horizon calculations: horizons re-derived from this service agree with ours within about 0.2 degrees per direction. This checks consistency between LOLA products; it is not an independent assessment of absolute accuracy.
- **NASA GSFC PGDA lunar polar illumination.** [Product 69](https://pgda.gsfc.nasa.gov/products/69) and the [PDS label for AVGVISIB_75S_120M_201608](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/avgvisib_75s_120m_201608.lbl). The average-solar-illumination raster supplies a plausibility cross-check for the six site-center calculations, documented in `docs/validation.md`: our values differ from it by −1.0 to +2.5 percentage points. Its longer averaging period and different calculation settings prevent a like-for-like comparison. It does not replace the hourly Horizons inputs.
- **NASA NSSDC.** [Apollo landing-site coordinates](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html) corroborate the Apollo site records and reference-system context.
- **NASA target and landing records.** The [2024 Artemis candidate-region announcement](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/) provides historical region names. The [VIPER technical information draft, section 5.2](https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/documents/VIPER_Technical_Information_AFPP.pdf) supplies the historical Mons Mouton target. NASA/LRO observations corroborate [Odysseus](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) and supply the adopted actual [SLIM landing position](https://www.nasa.gov/missions/lro/nasas-lro-spots-japans-moon-lander/). Candidate-region reference points are not approved landing sites.

## Space Agency Partner Data and Other References

### Space agency partners

- **ISRO:** [Chandrayaan-3 details](https://www.isro.gov.in/ISRO_EN/Chandrayaan3_Details.html) supplies the planned target for comparison with the actual touchdown coordinate adopted from the JPL report below. Planned and landed locations remain distinct.
- **JAXA:** [SLIM briefing, 25 January 2024](https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf) supplies the planned target. The catalog's actual touchdown position comes from NASA/LRO.

### Scientific and coordinate references

- Hengxi Liu et al. (2025), [Comprehensive Evaluation of the Lunar South Pole Landing Sites Using Self-Organizing Maps for Scientific and Engineering Purposes](https://www.mdpi.com/2072-4292/17/9/1579), Remote Sensing 17(9), 1579. Table 1 supplies the adopted Haworth and Nobile reference coordinates. We use the coordinates, not the paper's self-organizing-map method.
- Chaofa Bian et al. (2025), [Oxide Abundance Inversion in the Lunar Polar Regions Using a 1D-CNN Algorithm](https://www.preprints.org/manuscript/202511.1488), preprint. Table 4 supplies alternative regional coordinates recorded in our source notes. These are not the adopted inputs; the preprint is not peer reviewed.
- Marc Sanchez Net (2025), [Dynamics of a Coherent Reflection on Direct-with-Earth Links between a Planetary Body and an Earth Station](https://www.nasa.gov/wp-content/uploads/2026/02/42-240a.pdf), IPN Progress Report 42-240A. Used for actual IM-1 and Chandrayaan-3 coordinates and elevations. The report is dated 15 February 2025 despite the URL's 2026 directory. Its radio-propagation model is not implemented here.
- Amitabh et al. (2024), [Detecting the effect of Chandrayaan-3 Lander Engine Plume on Lunar Surface dust using Lander Imager, OHRC and NavCam images](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1411.pdf), LPSC abstract 1411. Consulted as a cross-check; its conflicting longitude is documented and is not used as the application's coordinate.
- Jianjun Liu et al. (2019), [Descent trajectory reconstruction and landing site positioning of Chang'E-4 on the lunar farside](https://www.nature.com/articles/s41467-019-12278-3), Nature Communications 10, 4229. Its alternative cartographic solution is recorded separately from the adopted LROC values.
- Davies et al. (1987), historical Apollo coordinate solution cited by the [Apollo Lunar Surface Journal](https://www.apollojournals.org/alsj/alsjcoords.html). Used to document differences from the adopted LROC coordinates, without averaging incompatible solutions.
- Erwan Mazarico et al. (2011), [Illumination conditions of the lunar polar regions using LOLA topography](https://doi.org/10.1016/j.icarus.2010.10.030), Icarus 211, 1066-1081. Credited for the NASA LOLA illumination maps used in the site-center cross-check, as requested by the PGDA product page.
- [NASA PGDA product 78](https://pgda.gsfc.nasa.gov/products/78) was consulted as a polar DEM research reference. The implemented pipeline uses the PDS `LDEM_75S_120M` product listed above.

### Software and libraries

All direct packages declared in `web/package.json` are credited below. Dependency ranges and the resolved JavaScript dependency tree are recorded in the repository's manifest and lockfile.

| Package or tool | Use | Reference |
|---|---|---|
| `react`, `react-dom` | Interface components and browser rendering | [React](https://react.dev/) |
| `vite`, `@vitejs/plugin-react` | Development server, builds and React integration | [Vite](https://vite.dev/), [React plugin](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react) |
| `typescript` | Type checking and compilation tooling | [TypeScript](https://www.typescriptlang.org/) |
| `vitest` | Automated logic tests | [Vitest](https://vitest.dev/) |
| `eslint`, `@eslint/js` | JavaScript and TypeScript lint configuration | [ESLint](https://eslint.org/) |
| `typescript-eslint` | TypeScript lint integration | [typescript-eslint](https://typescript-eslint.io/packages/typescript-eslint) |
| `eslint-plugin-react-hooks` | React Hooks lint rules | [React Hooks lint documentation](https://react.dev/reference/eslint-plugin-react-hooks) |
| `eslint-plugin-react-refresh` | Fast Refresh lint rules | [Maintainer repository](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) |
| `globals` | Environment globals for linting | [Maintainer repository](https://github.com/sindresorhus/globals) |
| `@types/node`, `@types/react`, `@types/react-dom` | Development-time type declarations | [Node types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node), [React types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react), [React DOM types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom) |
| Python 3, NumPy, Pillow | DEM download, array calculations, JPEG 2000 decoding and PNG plots | [Python](https://www.python.org/), [NumPy](https://numpy.org/), [Pillow](https://pillow.readthedocs.io/) |
| Node.js | Ephemeris collection using built-in filesystem, crypto and fetch APIs | [Node.js](https://nodejs.org/) |
| Vercel | Application hosting and the custom-coordinate server function | [Vercel](https://vercel.com/) |

The Python pipeline uses NumPy and Pillow plus Python's standard library. Pillow needs JPEG 2000/OpenJPEG support. The Node.js collection script uses built-in modules and no additional npm package. Package license notices are supplied with their distributions; [NumPy's license](https://github.com/numpy/numpy/blob/main/LICENSE.txt) and [Pillow's license](https://github.com/python-pillow/Pillow/blob/main/LICENSE) are linked for attribution.

### Fonts and media

The interface loads [Rajdhani](https://fonts.google.com/specimen/Rajdhani) and [Inter](https://fonts.google.com/specimen/Inter) through Google Fonts. Both use the SIL Open Font License 1.1: [Rajdhani license](https://github.com/google/fonts/blob/main/ofl/rajdhani/OFL.txt), [Inter license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt).

Video credits to complete after recording: [VIDEO RECORDING AND EDITING TOOLS]; [VOICE SOURCE AND SI DISCLOSURE, IF APPLICABLE]; [MUSIC TRACK, CREATOR, LICENSE AND URL, OR NO MUSIC]. The recording plan uses the team's own screen capture of the application.

## Use of Super Intelligence (SI)

We used Super Intelligence (SI) tools for implementation, research, debugging and documentation. The team chose the project idea, target users, features, candidate sites, thresholds and product direction. The team reviewed the results and made the decisions about what to include.

Claude Code (Anthropic) assisted with the React interface, JPL Horizons collection script, visibility and ranking logic, explanations, scenario links, the before-and-after comparison, the built-in demo, the better-spot map, integration review and independent re-checks of terrain results against NASA Moon Trek. ChatGPT (OpenAI) assisted with source research, landing-coordinate comparisons and documenting conflicts. Codex (OpenAI) assisted with the Python LOLA terrain pipeline, the 5 km neighborhood search, the NASA illumination cross-check, custom-coordinate support, the launch window calendar, tests, verification and these submission materials.

The astronomical and terrain inputs come from the cited data sources. The code and data-processing workflow were developed with SI assistance and are disclosed in the repository. The contribution record is [docs/SI_USAGE.md](https://github.com/AmirlanSeit/lunar-landing-site-navigator/blob/main/docs/SI_USAGE.md). Final wording and the video remain subject to team review. Any SI-generated narration or other added media will be identified in the project description and the relevant file metadata.

---

## Team checks before pasting

These notes are not submission-field text.

- Verified against main commit `c63ae3d` and the live Demo on 14 November 2026; the better-spot map and validation figures were added after review against main commit `0adc0f9`. The exact scenario is [the built-in two-week-slip example](https://lunar-landing-site-navigator-sigma.vercel.app/?region=south-pole&date=2027-11-27T12:00&orig=2027-11-13T12:00&site=viper_mons_mouton_target). Screen percentages in the description are rounded values.
- The [official Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/#project-page-form-field-instructions), dated 13 November 2026, lists the fields used here. It does not publish numeric word or character limits for the text fields. The summary follows the team's requested cap of 150 words; check any counters shown by the live form when pasting.
- Demo must be a public video no longer than 30 seconds or a public presentation of no more than seven slides, including titles and introductions. All written submission materials are in English; use English subtitles for any non-English speech. See [demo requirements](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo).
- Replace the remaining bracketed placeholders, review the proposed next steps and confirm the final public links. Paste only the appropriate field content, not these notes. Check that the team name matches the team page exactly.
