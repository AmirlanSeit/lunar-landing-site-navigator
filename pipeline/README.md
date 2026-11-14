# pipeline

Python scripts that produce the real data for `web/public/data/` (format: `PLAN.md` §2.1).

- `fetch_horizons.py` – Sun and Earth az/el from JPL Horizons → `web/public/data/ephem/<id>.json`
- `horizon_mask.py` – terrain horizon from LRO LOLA DEM → `web/public/data/horizon/<id>.json`

Not written yet – owned by ChatGPT Codex (see prompts in `PLAN.md` §5).
