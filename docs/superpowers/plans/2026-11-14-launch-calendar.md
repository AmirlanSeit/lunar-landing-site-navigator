# Launch Window Calendar Implementation Plan

> **For agentic workers:** Execute the bounded tasks below in this session; independently review the final branch before delivery.

**Goal:** Let users compare daily landing windows and select a site/date directly from the calendar.

**Architecture:** A pure builder calls the existing `evaluate()` once per site/day and projects only calendar fields. A memoized React component renders rows in the existing current ranking order; a small App callback changes landing, planned site and selected site together.

**Tech Stack:** Existing React, TypeScript, Vite and Vitest; no new runtime dependencies.

**Spec:** User request in this chat, `README.md`, `PLAN.md` §2.1 and existing `lib/tactics.ts`.

## Global Constraints

- Work only on `feature/launch-calendar`; push that branch and open a PR to `main`.
- Do not modify `web/public/data/`, `pipeline/` or `web/api/`.
- Keep App changes to the import, section insertion after Tactics and onPick callback.
- Default offsets are inclusive −14 through +45, preserving the UTC time of day.
- Reuse `evaluate()` and its verdict/metrics; never copy verdict rules.
- Calendar colors come only from `--go`, `--risky`, `--nogo`, `--panel`, `--line`; text can inherit the existing page style.
- Use accessible buttons, informative tooltips, selected-date highlighting and weekly date labels.
- Confine horizontal overflow to the calendar; memoize calculations and measure under 100 ms for the current catalog.

## Review Focus

- Day shifts across month/year/leap boundaries preserve the UTC time, without mutating landing (Task 1).
- An unavailable full mission window yields null even if its landing hour exists (Task 1).
- User thresholds and duration must affect results through evaluate (Task 1).
- Ranked rows must retain every supplied site, including one with no current-date result (Task 2).
- Mouse and keyboard picks must produce the same date/site; narrow screens must not widen the page (Task 3).

### Task 1: Pure calendar data

**Files:** Create `web/src/lib/calendar.ts` and `calendar.test.ts`.
**Interfaces:** Export `CalendarCell { date: Date; verdict: Verdict; lightPct: number; commPct: number }`, `CalendarRow { site: Site; cells: (CalendarCell | null)[] }`, and the requested `buildCalendar(...): CalendarRow[]`. Preserve input row order.

- [x] Test daily GO/RISKY/NO-GO on synthetic hourly data, unavailable mission boundaries, exact requested inclusive offsets, unchanged input, UTC date transitions, threshold and duration changes.
- [x] Implement with the existing evaluate and project only its verdict/lightPct/commPct.
- [x] Run targeted tests and benchmark actual catalog data for default and maximum UI mission durations.

### Task 2: Calendar presentation

**Files:** Create `web/src/components/LaunchCalendar.tsx` and `LaunchCalendar.css`.
**Interfaces:** Props `{data: SiteData[]; ranked: Scenario[]; landing: Date; days: number; t: Thresholds; onPick: (date: Date, siteId: string) => void}`. Consume Task 1 rows, sort with the supplied ranked order, append unranked rows in input order.

- [x] Memoize buildCalendar by stable data, landing timestamp, duration and threshold values; sort separately using ranked.
- [x] Render section title, one English explanatory sentence, weekly UTC date labels, selected-date marker, status legend and per-cell date/verdict/light/comms tooltips.
- [x] Use native buttons for every date (disabled for null), accessible labels, visible focus, and onPick(date, site.id).
- [x] Use a width-constrained scroll wrapper with sticky row labels and only the required color variables.

### Task 3: Integration and verification

**Files:** Minimal edit to `web/src/App.tsx`; append `docs/SI_USAGE.md`.

- [x] Insert LaunchCalendar after Tactics; pass existing data/ranked/landing/days/t and callback that sets landing/planned/selected.
- [x] Run npm test, npm run lint, npm run build and git diff --check; review the complete diff.
- [x] In npm run dev select South Pole/Haworth, verify GO days exist, click a green cell and observe Tactics GO plus updated date/planned/selected site.
- [x] Verify keyboard activation and phone-width calendar-only horizontal scrolling, save a screenshot and record measured recalculation time.
- [ ] Append factual SI usage, commit intended files, push feature/launch-calendar and open PR to main with verification evidence.

## Verification evidence

- All 112 Vitest tests pass; lint, production build and diff whitespace checks pass.
- Browser: Haworth at 2027-03-15 12:00 UTC → click Athena / 2027-03-11 12:00 UTC → planned and selected Athena, Tactics GO; Tab + Enter selects March 12 and remains GO.
- Calendar row order matches the squad ranking after selection; no browser console errors.
- At viewport widths 390 and 320 px, document scrollWidth equals viewport width; calendar content is 1940 px and scrolls independently.
- Node 24 benchmark, 20 calls per case on real JSON data, 60 columns: South Pole 14-day mission max 8.02 ms; South Pole 60-day mission max 15.71 ms; all 12 sites / 60-day mission max 19.05 ms.
