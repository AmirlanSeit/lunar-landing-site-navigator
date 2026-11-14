# Lunar Landing Site Navigator: team plan (NASA Space Apps 2026)

> **Translation note.** This is the team's working plan, written in Russian on 14 November 2026 at the
> start of the hackathon and translated to English in full; the original is in the git history.
> Some details changed during the build: for example, the Sun/Earth ephemerides were finally written
> by Claude Code in Node.js (`pipeline/fetch_horizons.mjs`) instead of Python, and the data format below
> grew a neighborhood file. The current format is in [`docs/data-format.md`](docs/data-format.md);
> who did what is logged in [`docs/SI_USAGE.md`](docs/SI_USAGE.md).

> **Submission deadline: Sunday 15 November 2026, 23:59 local time of your Local Event.**
> Internal deadline: **Sunday 21:00**, everything submitted; the remaining 3 hours are a buffer.

## 0. What we submit (from the Submission Guide)

| What | Requirement |
|---|---|
| Final Project | Public link without login: the deployed site + the GitHub repository |
| Demo | **Video ≤ 30 s** (any spoken language, but English subtitles) **or ≤ 7 slides** in English. Exceeding the limit = disqualification from global judging |
| Texts | Name, High-Level Summary, Detailed Description, NASA Data, References, Use of SI, all in English |
| SI rules | The solution idea is invented **by the team, not by AI**. AI-written code/data is acknowledged in the README and metadata. AI images carry a watermark. No NASA logos |
| Team | All members are registered for the same Local Event and appear on the Members tab |

Judging: Impact, Creativity, Validity, **Relevance (NASA data as the core, not decoration)** and
Presentation, 5 points each. So two things matter most: **real Horizons + LOLA data** and **a strong demo**.

## 1. What the humans decide themselves (AI stays out of this, as the rules require)

Before work starts, about 20 minutes, humans only:
1. **The idea and the product angle**: who it is primarily for (mission planner / student), what
   "hook" sets it apart, what it is called.
2. Video or slides for the demo, and who leads it.
3. Who presses "Submit", and the time zone of your Local Event.

Below is only the **engineering** breakdown of the task from the challenge statement; AI may do that.

### 1.1 Team decision (14 November)

- **Hero of the demo:** a mission planner whose launch slipped. Teachers and the public are a second
  layer of the same tool.
- **Main scenario:** enter **the new landing date** → the tool picks **the best of the nearby sites**
  for that date.
- **Answer:** **a verdict + why**: numbers, plain words, charts and pictures.
- **Presentation in the style of games (CS2 / FIFA), but it is not a game:**
  - sites are compared **like players**: each has a "card" with stats;
  - **"tactics"**: the tool shows a path to a suitable solution of the choice problem.
- **For students and the public:** the same game-style frame plus an explanation of the math:
  elevation angles, spherical geometry, illumination percentages, why at the pole the Sun circles
  along the horizon.
- **Demo:** a ≤ 30 s video in the YC style: first the problem (in one shot), then the solution.

Details:
- **Mission length:** **14 Earth days** after landing by default; the user can change it.
- **Verdict thresholds** are set by the user with sliders. Defaults:
  - "GO": sunlight > 70% and Earth link > 50%;
  - "RISKY": sunlight 40–70% or Earth link 25–50%;
  - "NO-GO": below that.
- **"Tactics"** shows three things:
  1. the best nearby site for this date, and why;
  2. by how many days to shift the landing so that the chosen site becomes "GO";
  3. the strengths and weaknesses of the sites "as in a match".

## 2. Architecture (the simplest thing that can really be finished)

```
nasa/
├── pipeline/            ← ChatGPT #1 (Codex), Python
│   ├── fetch_horizons.py    Sun/Earth az/el from JPL Horizons → data/ephem/*.json
│   ├── horizon_mask.py      horizon mask from the LOLA DEM → data/horizon/*.json
│   └── README.md
├── web/                 ← Claude, Vite + TypeScript, static site
│   ├── public/data/     ← the pipeline's JSON is copied here
│   ├── api/horizons.ts  ← Vercel proxy for arbitrary coordinates (CORS)
│   └── src/...
├── docs/                ← ChatGPT #2: texts, sources, demo
│   ├── sites-sources.md
│   ├── submission.md        all form fields in English
│   ├── demo-script.md
│   └── SI_USAGE.md          SI usage log (all three write to it)
└── PLAN.md
```

Deployment: **Vercel** (free, public link, serverless function for the Horizons proxy).
- Site: **https://lunar-landing-site-navigator-sigma.vercel.app**
- Repository: **https://github.com/AmirlanSeit/lunar-landing-site-navigator**
- Every `git push` to `main` rebuilds the site automatically in about a minute.
- The proxy is needed because the Horizons API sends no CORS header, so a browser cannot call it directly.

### 2.1 Data contract: fixed NOW so that everyone can work in parallel

Claude builds the front end on fake data in this format, Codex generates the real data. The format
changes only by agreement. (Current version: [`docs/data-format.md`](docs/data-format.md).)

All data files live in **`web/public/data/`**. For now they hold placeholders with `"mock": true`,
made by `web/scripts/make-mock-data.mjs`. A real file (without `mock`) is simply dropped on top, and
the site picks it up by itself. While any data has `mock`, the site shows a yellow "Development build"
banner.

**`web/public/data/sites.json`**
```json
[{ "id": "artemis_haworth", "name": "Haworth", "lat": -86.75, "lon": -22.8, "elev_m": null,
   "category": "apollo_landed|artemis_region_reference|clps_historical_target|clps_landed|international_landed|custom",
   "mission": "Artemis candidate region (NASA 2024 list)",
   "source": ["https://... (primary source first)", "https://..."], "note": "..." }]
```
- `lat` in degrees (south negative), `lon` is **east longitude**, −180..180. The site also accepts
  0..360, but the file stores ±180.
- `elev_m` may be `null` when there is no verified elevation. `source` is an array of links.
- Everything visible on the site (`name`, `mission`, `note`) is written in English.
- The list was checked by the teammate's ChatGPT on 14 November: 12 sites. The original with
  explanations is in `docs/sites-sources.md`.

**`data/ephem/<id>.json`**
```json
{ "site_id": "shackleton-rim", "start_utc": "2026-11-01T00:00:00Z", "step_min": 60,
  "sun":   { "az": [/* degrees, from north, clockwise */], "el": [/* degrees */] },
  "earth": { "az": [], "el": [] },
  "source": "JPL Horizons API, observer coord@301, QUANTITIES=4, airless" }
```
- Period: **2026-11-01 → 2028-12-31**, 1-hour step, rounded to 0.01°.
- `el` is above the **spherical** horizon (no terrain and no refraction: the Moon has no atmosphere).

**`data/horizon/<id>.json`**
```json
{ "site_id": "shackleton-rim", "az_step_deg": 1, "mask_el_deg": [/* 360 values */],
  "dem": "LOLA ...", "max_range_km": 150 }
```

**Visibility rules (the same for everyone):**
- The Sun is visible if `sun.el > mask(az) - 0.27` (half the disk, 0.53°). The fraction of the disk
  above the terrain is used to estimate power.
- Earth is visible if `earth.el > mask(az) - 0.95` (Earth seen from the Moon spans ~1.9°).
- If there is no mask (a custom point), `mask = 0`, and the UI says "terrain not modeled".

### 2.2 Product features by priority

| P | Feature | Why |
|---|---|---|
| P0 | **First screen:** new date (+ region, mission length) → ranking of nearby sites with a verdict | the team's main scenario |
| P0 | **Site cards "like players"**: % sunlight, Sun height, % Earth link, time to sunset / Earthset, verdict + "why" in words | comparison, power & comms |
| P0 | **Polar sky map**: horizon silhouette (LOLA) + the Sun and Earth + their paths | main visual, "why" |
| P0 | 2–4 sites side by side (a "match") | "rapid comparison" |
| P0 | Game visual style (CS2 / FIFA) for the whole interface | Creativity |
| P1 | Mission timeline: "light / shadow / link" strips | "why", temporal dynamics |
| P1 | "Tactics": a hint on how to reach a suitable solution | team decision |
| P1 | "Explain the math" layer for students and the public | accessibility, Impact |
| P1 | Arbitrary coordinates (through the Horizons proxy, no terrain) | from the challenge |
| P2 | 3D terrain (Three.js) | only if time remains |

## 3. Who does what

### 🟣 Claude (Claude Code): lead engineer for `web/`, integration, deployment
The heaviest coding part, so the whole front end is Claude's; data and texts go to ChatGPT.

| Task | Model / effort |
|---|---|
| Scaffold, repository, structure, mock data | **Sonnet 5.5 / medium** |
| Sky map, metrics, comparison, timeline | **Sonnet 5.5 / medium** |
| Visibility geometry, hard bugs, final integration | **Opus 5.5 / high** (only for these parts) |
| Small text and style edits | **Sonnet 5.5 / low** |

How to save Claude's usage limit: a new session for each large stage, no subagents, no Fast mode,
never paste large JSON files in full.

Installed skills: `writing-plans`, `systematic-debugging` and `verification-before-completion` from
superpowers (in `.claude/skills/`), plus the built-in `dataviz` (charts) and `run` (checking the site
in a browser). Superpowers' brainstorming and TDD were not installed: the first generates ideas (by
the rules, humans come up with the idea), and TDD would not pay off within 34 hours.

### 🟢 ChatGPT #1 (team lead's account): data in `pipeline/` through **Codex**
Codex is included in Plus. Open the session in the project folder; touch only `pipeline/` and
`web/public/data/`.
**Model:** the newest GPT-5.x-Codex in the list; **reasoning: high** for the horizon geometry,
**medium** for the Horizons download. The exact model names in November 2026 were unknown to Claude;
pick the top Codex model in the picker.

### 🔵 ChatGPT #2 (teammate's account): research, texts, demo in `docs/`
Regular chat. **Thinking + web search** for checking coordinates and sources, normal mode for texts.
On Sunday the teammate is also the main tester: checks the site from a phone and from someone else's
computer.

## 4. Timeline

| When | Claude | ChatGPT #1 (Codex) | ChatGPT #2 | Humans |
|---|---|---|---|---|
| **Sat, now → +1 h** | GitHub repository, `web/` scaffold, mock data per the contract | – | site list with coordinates and sources | **decide the idea and the name** (§1) |
| **Sat +1 → +7 h** | sky map, metrics, comparison | `fetch_horizons.py` → ephem JSON for all sites | texts for the "explain" mode, submission draft | follow along, test |
| **Sat evening** | connect real data, **deploy v1 to Vercel** | `horizon_mask.py` on LOLA (start) | check v1 in the browser, bug list | first live link ✅ |
| **Sun morning → 14:00** | timeline, custom coordinates, "explain" mode, polish | horizon masks done + check against Quickmap | demo script, References, NASA Data | screenshots / screen recording |
| **Sun 14:00** | **feature freeze**, bugs only | – | – | – |
| **Sun 14 → 19** | fixes, README with SI notes | – | final texts, slides / subtitles | record the ≤ 30 s video |
| **Sun 19 → 21** | final deploy, check the link in incognito | – | paste everything into the form | **Submit** ✅ |

## 5. Ready-made prompts

### → ChatGPT #1 (Codex), task 1: ephemerides
```
Project: a web app for comparing lunar landing sites (NASA Space Apps 2026,
challenge "Lunar Landing Site Navigator"). You are responsible only for the pipeline/ folder.
Read PLAN.md, section 2.1: it is the strict data-format contract.

Task: pipeline/fetch_horizons.py (Python 3, only requests + the standard library).
- Reads web/public/data/sites.json and, for each site, calls the JPL Horizons API twice
  (https://ssd.jpl.nasa.gov/api/horizons.api): COMMAND='10' (Sun) and COMMAND='399' (Earth),
  CENTER='coord@301', COORD_TYPE='GEODETIC', SITE_COORD='<lon_east>,<lat>,<alt_km>',
  EPHEM_TYPE='OBSERVER', QUANTITIES='4', ANG_FORMAT='DEG', CSV_FORMAT='YES', APPARENT='AIRLESS',
  STEP_SIZE='1 h', from 2026-11-01 to 2028-12-31. If you hit the response line limit, split into chunks.
- Writes web/public/data/ephem/<id>.json strictly per the contract. Caches raw responses in pipeline/cache/.
- Check the longitude sign for body 301 (is east positive?) and the SITE_COORD format in the Horizons
  documentation. Sanity test: at Apollo 11 (0.674N, 23.473E) the Sun's elevation should be small and
  positive on the morning of 20 July 1969 UTC, so give the script a flag for an arbitrary date range.
- In pipeline/README.md: how to run it, what was checked, a note that the code was written with SI.
Change nothing outside pipeline/ and web/public/data/.
```

### → ChatGPT #1 (Codex), task 2: LOLA horizon mask
```
Task: pipeline/horizon_mask.py. For each site in web/public/data/sites.json with lat < -80,
compute the horizon mask from LOLA terrain (NASA LRO):
- Find and download a suitable LOLA polar DEM of the south pole (PDS Geosciences LOLA GDR
  polar or NASA PGDA south pole DEMs). Take a resolution that a laptop can really process
  (60–240 m/pixel is enough) and crop ~150 km around the sites. Record the exact product and URL in the README.
- For each azimuth 0..359 (1° step), march a ray out to 150 km and take the maximum terrain elevation
  angle, accounting for the Moon's curvature (R = 1737.4 km; drop ≈ d²/2R), relative to an observer
  at the site's height + 2 m (height of panels/antenna).
- Write web/public/data/horizon/<id>.json per the contract in PLAN.md 2.1.
- Make pipeline/plot_mask.py: a PNG plot of the mask for a visual check against Quickmap.
Reasoning: high. If the DEM is too heavy, say so and propose an option instead of silently simplifying.
```

### → ChatGPT #2 (teammate), task 1: sites and sources
```
For NASA Space Apps 2026 we are building a tool to compare lunar landing sites
(challenge "Lunar Landing Site Navigator"): where the Sun and Earth are above the horizon,
how much light there is for solar panels, and when there is a direct link to Earth.

Collect 10–12 sites with VERIFIED coordinates (selenographic latitude and
EAST longitude, elevation if available) and a link to the primary source (NASA, LROC/ASU, ISRO, ESA,
papers):
- 2–3 Apollo sites (for contrast with the pole: Apollo 11, 15, 17);
- Artemis III candidate regions near the south pole (from NASA's official list);
- CLPS targets near the pole (for example, Mons Mouton / VIPER, Intuitive Machines sites);
- Chandrayaan-3 and other international landings or targets.
Return a Markdown table (id, name, lat, lon_east, elev_m, category, mission, source_url, note)
and the same list in JSON with the schema:
{id, name, lat, lon, elev_m, category, mission, source, note}.
If sources disagree, give both. Invent nothing: no source means mark it "unverified".
```

### → ChatGPT #2, task 2 (Sunday): texts and demo
```
Here is our project: <link to the site> and <README>. Write in English:
1) Project Name + tagline; 2) High-Level Summary (≤150 words); 3) Detailed Description
(what it does, how it works, benefits, stack); 4) NASA Data (JPL Horizons, LOLA/LRO, Quickmap/Moon Trek
for cross-checking, with URLs); 5) References (all libraries, data, images);
6) a video script of exactly 30 seconds following the Submission Guide timing (0:00 team,
0:02 problem, 0:05 name, 0:10 demo, 0:20 future) + English subtitles
OR a 7-slide structure. Texts in plain human language, without advertising clichés.
```

## 6. Working rules for all three
1. **Each AI touches only its own folder.** Shared files (`PLAN.md`, the contract) are changed only by a human.
2. Any AI that did something adds 1–2 lines to `docs/SI_USAGE.md`: what it did and with which tool.
   The "Use of SI" field is assembled from this.
3. Everything that goes to the judges is in English. Internal notes in whatever language is convenient.
4. AI-generated images only with an "AI-generated" watermark. We do not use NASA logos.
5. On Sunday at 14:00 we freeze features. After that, only bugs and the demo.
