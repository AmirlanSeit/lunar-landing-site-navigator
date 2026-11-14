# Lunar Landing Site Navigator

NASA Space Apps Challenge 2026 – challenge "Lunar Landing Site Navigator".

**Live:** https://lunar-landing-site-navigator-sigma.vercel.app

Launch slipped? Enter the new landing date and the tool ranks nearby landing sites like players:
each site gets a card with sunlight, Earth-link and night-survival stats, a GO / RISKY / NO-GO verdict,
the reasons behind it, and tactics (best alternative site, date shift that makes your site work).
Add the original date to see what the slip changed, try any lunar coordinates, and share a scenario
as a link (the URL always mirrors the current scenario). **▶ Demo** loads a real case found in the data:
Mons Mouton is GO on 13 Nov 2027 and NO-GO after a two-week slip.

> **Status:** all data is real – team-verified site coordinates, JPL Horizons Sun/Earth ephemerides,
> LRO LOLA terrain horizons for the polar sites (flat horizon for custom points and low latitudes).

## Layout

| Folder | What | Owner |
|---|---|---|
| `web/` | Vite + React + TypeScript site | Claude Code |
| `web/public/data/` | Site list, ephemerides, horizon masks (format: `PLAN.md` §2.1) | pipeline |
| `pipeline/` | Python: JPL Horizons fetch, LOLA horizon masks | ChatGPT Codex |
| `docs/` | Sources, submission texts, demo script, SI usage log | ChatGPT |

## Run locally

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm test         # logic tests
```

## Data

- **JPL Horizons** – apparent azimuth/elevation of the Sun and Earth from each site (airless, topocentric on the Moon),
  hourly from 2026-11-01 to 2028-12-31. Regenerate with `node pipeline/fetch_horizons.mjs` from the repo root.
  Checked against the Apollo 11 landing (Sun ~10.7° in the east at 20:17 UT) and against 90° − |lat| + 1.54° for every site.
- **LRO LOLA** – south-pole elevation model used to compute each site's terrain horizon.

## Use of Super Intelligence (SI)

This project was built with help from SI tools: Claude Code (Anthropic) wrote most of the code in `web/`,
ChatGPT / Codex (OpenAI) wrote the data pipeline and helped with research and texts.
The idea, product decisions and final review are the team's. Details: [`docs/SI_USAGE.md`](docs/SI_USAGE.md).
