# Submission copy

The fields below follow the 2026 project form and are ready to paste. Team: Ninjago: Masters of Claudejitzu; members: Islam Sabitov, Amirlan Seitkadyrov, Akezhan Omashev, Shakhnazar Akhmer.

## Project Name

Lunar Landing Site Navigator

### Tagline (chosen by the team)

The Moon gives us a destination.

## Summary

Lunar Landing Site Navigator helps mission planners when a lunar landing date slips. It shows which sites still get enough sunlight and enough time with Earth in view on the new date. It combines hourly Sun and Earth positions from NASA JPL Horizons with LRO LOLA terrain around the polar sites.

Each site gets a GO, RISKY or NO-GO verdict, and the tool suggests a fix: another date, another site or a better spot within 5 km. In a hypothetical example, a two-week delay cuts sunlight at the historical VIPER target on Mons Mouton from 70% to 35%. Landing five days later only just reaches GO; a spot 2.1 km away is GO on the delayed date.

Near the south pole a few days or kilometres can turn GO into NO-GO. At six polar reference points our sunlight averages are within 2.5 percentage points of NASA's LOLA illumination map.

## Project Demonstration

https://youtu.be/Q5i6QY7FjTo

## Project

https://lunar-landing-site-navigator-sigma.vercel.app

The form takes one URL here. The repository and the demo video are linked in Project Details.

## Project Details

### What it does

Lunar Landing Site Navigator helps when a lunar mission's landing date changes. You choose a region, the site you planned to land at and the new landing date in UTC. You can add the original date to see what the delay changed, and set the mission length and the sunlight and Earth-visibility thresholds for GO. The tool ranks every site in the region for that date, gives each one a GO, RISKY or NO-GO verdict and explains why.

Tactics then suggests the next move: the smallest date shift within 30 days that makes your site GO, the best other site for that date, and, for polar sites, a better spot within 5 km. A launch window calendar shows the verdict for every site from 14 days before to 45 days after the chosen date, and a match view compares two to four sites side by side.

### How it works

The catalog has 12 sites: actual landings, historical targets and published reference points for candidate regions near the south pole. Hourly Sun and Earth azimuths and elevations for each site come from NASA JPL Horizons, from 1 November 2026 to 31 December 2028. For the six sites south of 75°S, our Python pipeline reads the 120 m LRO LOLA south-pole DEM and computes the terrain horizon in 360 directions out to 150 km, including lunar curvature and an observer 2 m above the ground.

For every hour of a mission, the browser compares the Sun and Earth with the horizon in their direction. That gives the visible fraction of the solar disk, whether any part of Earth clears the terrain, and the longest stretch of darkness. The mission averages, compared with the user's thresholds, give the verdict. The same calculation drives the ranking, the date suggestions and the calendar.

For the six polar sites we also evaluated 1,361 points on a 240 m grid within 5 km of each site, each with its own LOLA horizon. The app maps sunlight, Earth visibility or ground slope around the site, names the best spot with at least 50% Earth visibility and a slope of 8° or less, and checks that spot for the user's own dates. Custom coordinates get live Horizons data through a server function. South of 83.5°S, a second function computes their LOLA horizon and slope on demand.

### Example

The Demo button loads a hypothetical delay at the historical VIPER target on Mons Mouton. The landing moves from 13 to 27 November 2027, sunlight over a 14-day mission falls from 70% to 35%, and the verdict drops from GO to NO-GO. Landing five days later, on 2 December, only just reaches GO (70.5% against the 70% threshold). Nobile Rim 2 is GO on the delayed date, and so is a spot 2.1 km from Mons Mouton, with 100% sunlight and Earth in view 80% of the time. At the Nobile Rim 1 reference point, which sits on a 13° slope and never sees Earth, a ridge 3.7 km away gets 85% sunlight and 62% Earth visibility instead of 29% and 0%.

### How we checked the numbers

At the six polar reference points, our two-year sunlight averages differ from NASA's long-term LOLA illumination map (PGDA product 69) by -1.0 to +2.5 percentage points. Horizons we re-derived from NASA Moon Trek's LOLA service agree with ours within about 0.2°. For nearby points we rotate the Sun and Earth directions into each point's own frame; at a test point 3.9 km from Haworth they match Horizons queried directly within 0.005°. For terrain-modeled sites, the detail panel has a horizon error check that recomputes the mission with the horizon 0.2° higher and lower and says whether the verdict could change. Under that check the Mons Mouton GO dates are borderline, while the nearby spot's GO holds. The code has 142 automated tests.

### Who it is for

Mission planners can see early, before detailed analysis, how a date change affects sunlight and the direct link to Earth at each candidate site, and share the exact scenario with colleagues. Students and teachers get the same tool with explanations: "Explain the math" puts each site's numbers into the formulas, and a latitude lab shows why the polar Sun circles low along the horizon.

### How it is creative

We present the sites as players in a squad. Each site has a card with stats for sunlight, Earth in view, night survival, time to sunset, time to Earthset and Sun height above the terrain, plus an overall rating. Tactics suggests the next move, and the match view puts sites head to head. This lets someone compare six measures across a dozen sites at a glance, and every number on a card still comes from the Horizons and LOLA calculation.

### What we considered

GO means the mission averages meet the chosen thresholds. It does not promise continuous sunlight, a working radio link or a safe landing. Sunlight here is the visible fraction of the solar disk; panel power is not modeled, and Earth visibility is line of sight without a link budget. Custom points north of 83.5°S and the six lower-latitude sites use a flat horizon, which the app labels. Slope comes from the 120 m DEM, so boulders and small craters are not resolved. The ranking ignores transfer distance and fuel. Candidate-region reference points are not approved landing sites, and the delay scenario is not a record of a real VIPER delay. We tested the interface at desktop and phone widths. The app and repository are in English and use no NASA logos.

### Tools

React 19, TypeScript and Vite for the interface; Vitest and ESLint for checks; Vercel for hosting and the two server functions (Horizons proxy and terrain). Node.js collects the ephemerides, and Python with NumPy and Pillow (OpenJPEG) runs the terrain pipeline. No special hardware.

### Links

- Live app: https://lunar-landing-site-navigator-sigma.vercel.app
- Source code: https://github.com/AmirlanSeit/lunar-landing-site-navigator
- Demo video: https://youtu.be/Q5i6QY7FjTo

### Next steps

Terrain for custom points north of 83.5°S; a date-specific search over every nearby point instead of only the named best spot; uncertainty from landing accuracy and from terrain finer than the DEM; power and communication budgets for a specific mission; and sessions with mission planners and teachers to see how they use the tool.

### Use of SI

The team chose the idea, the users, the features, the candidate sites and the thresholds, and reviewed each result before it went in. Claude Code (Anthropic) wrote most of the interface, the visibility, ranking and tactics logic, the Horizons collection script, the terrain server function and the horizon error check. It also re-checked terrain results against NASA Moon Trek, ran a design review and edited the interface text into plain language. ChatGPT (OpenAI) researched and cross-checked landing-site coordinates and turned the demo script into subtitles. Codex (OpenAI) built the Python LOLA terrain pipeline, the 5 km neighborhood search, the NASA illumination cross-check, custom coordinates and the launch calendar, drafted the submission texts and the demo script, and reviewed the project against the judging criteria. The Sun, Earth and terrain inputs come from the cited NASA data. Every SI contribution is logged in docs/SI_USAGE.md in the repository.

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

The interface loads [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans), [IBM Plex Sans Condensed](https://fonts.google.com/specimen/IBM+Plex+Sans+Condensed) and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) through Google Fonts. All three use the SIL Open Font License 1.1: [IBM Plex license](https://github.com/IBM/plex/blob/master/LICENSE.txt).

Video credits to complete after recording: [VIDEO RECORDING AND EDITING TOOLS]; [VOICE SOURCE AND SI DISCLOSURE, IF APPLICABLE]; [MUSIC TRACK, CREATOR, LICENSE AND URL, OR NO MUSIC]. The recording plan uses the team's own screen capture of the application.

## Use of Super Intelligence (SI)

Tick: Research or Information Gathering; Data Analysis and Interpretation; Coding, Debugging, or Troubleshooting; Writing, Editing, or Translation; Visual Design or Image Creation; Presentation, Video, or Audio; Other Project-Related SI Use (project planning, code review and mock judging). Leave Ideation or Brainstorming, Building SI/ML Into the Project and None unticked: the team chose the idea, and the application itself uses no AI or ML.

The form says judges do not see this answer, so the same information is in the "Use of SI" part of Project Details. The full contribution record is [docs/SI_USAGE.md](https://github.com/AmirlanSeit/lunar-landing-site-navigator/blob/main/docs/SI_USAGE.md). Any SI-generated narration or other added media in the video must be named in the project text and the file metadata.

---

## Team checks before pasting

These notes are not submission-field text.

- The demo numbers, the nearby-spot verdict and the horizon error check were rechecked on the live site on 15 November 2026. The exact scenario is [the built-in two-week-slip example](https://lunar-landing-site-navigator-sigma.vercel.app/?region=south-pole&date=2027-11-27T12:00&orig=2027-11-13T12:00&site=viper_mons_mouton_target). Screen percentages in the description are rounded values.
- The [official Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/#project-page-form-field-instructions), dated 13 November 2026, lists the fields used here. The live form limits Summary to 1,500 characters and suggests 50 to 200 words; the summary above has 149 words and 828 characters, within the team's cap of 150 words.
- Demo must be a public video no longer than 30 seconds or a public presentation of no more than seven slides, including titles and introductions. All written submission materials are in English; use English subtitles for any non-English speech. See [demo requirements](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo).
- The demo video is https://youtu.be/Q5i6QY7FjTo (29 seconds, 1080p). The guide asks for shared files to be set to public access, so keep the video Public on YouTube and check the link in a private window. Review the proposed next steps and confirm the final public links. Paste only the appropriate field content, not these notes. Check that the team name matches the team page exactly.
