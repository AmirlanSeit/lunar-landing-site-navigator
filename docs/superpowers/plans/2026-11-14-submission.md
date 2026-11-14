# Submission Text and Demo Script Plan

> **For agentic workers:** Draft only documentation from the verified main branch and live site, then review the claims and limits before publishing the PR.

**Goal:** Produce copy-ready English submission fields and a video script shorter than 30 seconds, with a seven-slide fallback.

**Architecture:** Separate submission prose from recording instructions. Link every data/reference source to its actual role and keep proposals clearly distinct from implemented features.

**Tech Stack:** Markdown, repository inspection, official source checks and browser verification.

**Spec:** User request, current main README/PLAN/SI usage/source notes/pipeline and web source; official 2026 Project Submission Guide.

## Global constraints

- Only docs/submission branch; do not modify web/, pipeline/ or README.md.
- Unknown names, team identity and video URL remain bracketed placeholders.
- English deliverables, plain concrete prose, no promotional adjectives or long dash punctuation; use Super Intelligence (SI), not the other common abbreviation.
- Summary must be at most 150 words as requested by the team; the public Guide publishes no numeric text-field limits.
- Video must be at most 30 seconds; each subtitle at most 12 words. The fallback has exactly seven slides including title and team.
- Describe GO as a mission-average threshold verdict, the date slip as a hypothetical scenario, and future work as proposed.

## Review focus

- Distinguish operational interfaces from proposals and historical targets from actual landings.
- Verify every number against the live Demo or repository; keep displayed rounding explicit.
- Distinguish adopted coordinates from rejected/conflicting scientific references.
- Credit direct runtime/development dependencies, pipeline libraries and font licenses without claiming unused packages.
- Check final runtime including titles/transitions and public access to submission links.

### Task 1: Evidence

- [x] Update main and create docs/submission; read project documentation and current implementation.
- [x] Click live Demo and Try that date; record the original/delayed/shifted verdicts and calendar state.
- [x] Inspect the current official Guide and identify actual field names and published limits.
- [x] Complete source and dependency attribution audit, including main's subsequent offline neighborhood pipeline and illumination cross-check.

### Task 2: Drafts

- [x] Write docs/submission.md with all required form fields, three tagline options, traceable sources, limitations, proposed next steps and SI disclosure.
- [x] Write docs/demo-script.md with a 29-second edit, concrete live-site actions, subtitles, recording/export instructions and seven-slide fallback.
- [x] Append a factual contribution to docs/SI_USAGE.md.

### Task 3: Review and delivery

- [x] Independently review scientific claims, source roles, SI attribution, English wording, word counts and timing.
- [x] Verify Markdown links, placeholders, subtitle lengths, summary length, protected-file diff and git diff --check.

Delivery: commit, push docs/submission and create a PR to main describing verified evidence and remaining team placeholders.
