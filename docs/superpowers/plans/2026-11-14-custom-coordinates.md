# Custom Coordinates Implementation Plan

> **For agentic workers:** Implement the tasks below in this session with bounded parallel ownership and an independent branch review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add arbitrary lunar landing coordinates to the squad using real Sun/Earth ephemerides.

**Architecture:** A shared coordinate validator normalizes browser and server input. A Vercel GET handler requests the fixed Horizons observer tables; Vite routes development requests to that same handler. The form preloads custom data before adding a site and changing the planned site/region.

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest 3, Vercel Node functions, Fetch API.

**Spec:** User request in this chat; `PLAN.md` §2.1 and `pipeline/fetch_horizons.mjs` are the data/parameter references.

## Global Constraints

- Work only on `feature/custom-coordinates`; PR targets `main`, never push to `main`.
- Do not modify `pipeline/` or `web/public/data/`; preserve existing `lunar_sites.*`.
- Keep `web/src/App.tsx` changes small: state integration and form insertion.
- UI text is English; category `custom`, source `[]`, note `Custom point – terrain not modeled (flat horizon)`.
- Inputs: latitude −90..90, east longitude −180..360, optional finite elevation in meters; round to four decimals and normalize stored longitude to ±180.
- Fixed Horizons parameters match the pipeline: observer coord@301, GEODETIC, quantity 4, AIRLESS, 2026-11-01 00:00 through 2028-12-31 23:00, 60 m, Sun 10 and Earth 399.
- Response is exactly the ephem contract with site_id `custom`; 19,008 samples per body, two-decimal angles, public s-maxage=86400; 400 validation and 502 upstream failures; function duration 60 s.

## Review Focus

- Empty, nonfinite, duplicate, or just-out-of-range coordinates must fail before contacting Horizons (Task 1).
- Extraneous URL parameters must never change the fixed upstream endpoint, body, dates, or options (Task 2).
- Truncated, malformed, reordered, or nonnumeric observer data must not become a plausible ephemeris (Task 2).
- A failed request must be retryable, with no cached rejected promise or premature squad addition (Task 3).
- Adding another point or changing regions must preserve the intended new planned site and distinct custom coordinates (Tasks 3–4).

---

### Task 1: Shared input contract

**Files:** Create `web/src/lib/coordinates.ts`, `web/src/lib/coordinates.test.ts`.
**Interfaces:** Export `Coordinates { lat: number; lon: number; elev_m: number }` and `parseCoordinates(params: URLSearchParams): Coordinates`; invalid input throws a user-readable Error.

- [x] Test required fields, boundaries, just-outside values before rounding, NaN/Infinity/blank/nondecimal/duplicate input, ignored extra fields, optional elevation, rounding, and east-longitude conversion.
- [x] Implement decimal parsing, finite/range checks before rounding, optional elevation default 0, normalization after rounding.
- [x] Run `npm test -- src/lib/coordinates.test.ts` from `web/` and require all tests to pass.

### Task 2: Horizons server and development bridge

**Files:** Create `web/api/horizons.ts`, `web/src/lib/horizons.ts`, `web/src/lib/horizons.test.ts`, `web/vercel.json`; modify `web/vite.config.ts` and node tsconfig if necessary.
**Interfaces:** Consume Task 1 validator and existing `Ephem`/`Track`; export `GET(request: Request): Promise<Response>`. Parser and fixed URL builder are pure testable functions in `horizons.ts`.

- [x] Implement the pipeline's fixed parameter set and CSV $$SOE/$$EOE parsing, preserving flags/columns, rounding and full sample count; reject invalid rows/timestamps.
- [x] Test exact upstream query allowlist, both bodies, altitude km conversion, extra query immunity, full tables and malformed/truncated/error responses; mock fetch for HTTP/status/timeout behavior.
- [x] Fetch Sun and Earth within one deadline under 60 s and return contract JSON or a comprehensible 400/502 JSON error.
- [x] Configure maxDuration 60 and use GET in `/api/horizons` Vite dev middleware, forwarding response headers/status/body.
- [x] Run targeted Vitest tests and verify TypeScript configuration includes the server handler.

### Task 3: Custom-site form and loading

**Files:** Create `web/src/components/CustomSiteForm.tsx` and scoped styles; modify `web/src/lib/data.ts`; create `web/src/lib/data.test.ts` and custom-site helpers/tests if needed.
**Interfaces:** Form props `onAdd: (site: Site) => void`; form validates using Task 1 and awaits existing `loadSiteData(site)` before calling onAdd. Custom sites have unique IDs, normalized coordinates, null elevation, and the exact required metadata.

- [x] Implement labeled optional Name, Latitude, Longitude, Add to squad, loading/disabled state, accessible errors and flat-terrain note using existing visual tokens.
- [x] Load category `custom` from `/api/horizons?lat=...&lon=...`, adding elevation only when present; return mask null without requesting a static mask.
- [x] Evict failed loads from the promise cache and preserve static-site loading behavior.
- [x] Test custom URL/metadata, null mask, retry after failure, distinct points and unchanged static loading; run targeted tests.

### Task 4: App integration and delivery

**Files:** Minimal edit to `web/src/App.tsx`; append `docs/SI_USAGE.md`; this plan tracks verification.

- [x] Insert form beneath controls, add successful site to state, select its latitude-derived region and mark it Originally planned site; ensure the region effect does not reset the new selection.
- [x] Preserve loaded custom sites when the initial catalog resolves; inspect all final changes independently.
- [x] Run `npm test`, `npm run lint`, `npm run build` and `git diff --check`; require zero failures.
- [x] Run `npm run dev`, add (-89.5, 0) and (0, 0) via the browser, inspect loading/errors/region/planned selection and actual returned angles; verify south-pole Sun max about 2° and high Earth elevation at (0,0).
- [ ] Append factual Codex contribution to SI log, commit only intended files, push feature branch, create PR to main with implementation and verification evidence.
