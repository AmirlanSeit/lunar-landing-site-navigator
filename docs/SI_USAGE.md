# SI usage log

Every SI tool that contributes something adds a line here. This becomes the "Use of SI" field of the submission.

| Date | Tool | What it did | Human decision / review |
|---|---|---|---|
| 2026-11-14 | Claude Code (Opus 5.5) | Read the challenge, judging and submission guides; drafted the team work plan and the data contract (`PLAN.md`) | Team chose the idea, target user, verdict rules and "tactics" features |
| 2026-11-14 | Claude Code (Opus 5.5) | Wrote `pipeline/fetch_horizons.mjs`, fetched hourly Sun/Earth az/el for 12 sites from JPL Horizons, validated against Apollo 11 and the max-Sun-height formula | Team review |
| 2026-11-14 | ChatGPT (teammate's account) | Compiled and cross-checked 12 landing-site coordinates with primary sources (LROC, NASA/JPL, ISRO, JAXA, papers), flagged conflicts and unverified elevations (`docs/sites-sources.md`) | Team chose which sites to include |
| 2026-11-14 | Claude Code (Opus 5.5) | Converted the verified site list to the data contract (English text, ±180° longitude), showed sources and notes in the UI | Team review |
| 2026-11-14 | Claude Code (Opus 5.5) | Built the "Explain the math" layer: coach notes with site-specific formulas, interactive latitude lab, stat tooltips | Team chose education/math as the angle and what to explain |
| 2026-11-14 | Claude Code (Opus 5.5) | Scaffolded `web/` (React + TS): visibility/metrics/verdict/tactics logic with tests, player-card UI, horizon panorama, mission timeline, match view, placeholder data generator | Team reviews in the browser |
| 2026-11-14 | Codex (OpenAI) | Added custom-coordinate entry, a validated Vercel/Vite JPL Horizons proxy with flat-horizon data, and validation/parser/loading tests; checked real polar and equatorial points in the browser | Team requested the feature; PR review pending |
