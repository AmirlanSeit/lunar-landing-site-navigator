# 29-second project demo

Project: Lunar Landing Site Navigator

Team: Ninjago: Masters of Claudejitzu

Members: [MEMBERS]

Chosen tagline: The Moon gives us a destination.

Public demo URL: [VIDEO LINK]

Subtitle file ready to import: [`demo-subtitles.srt`](demo-subtitles.srt) (8 cues, 0:00–0:29).

Use a team name of at most four words in the opening cue. Choose a tagline of at most eight words: the four-word project name and tagline must fit within the 12-word title subtitle. Replace the placeholders before recording. Do not include identifiable names, voices, or images of members younger than 18 in the recording or slides.

## Scenario and verified numbers

This is a hypothetical two-week landing delay using calculated NASA-data-based conditions at the historical VIPER target near Mons Mouton. It is not a claim about an actual VIPER launch, landing, or mission delay.

Open the [live site](https://lunar-landing-site-navigator-sigma.vercel.app) and click **Demo: a two-week slip at the south pole**. The button selects the South Pole region, Mons Mouton, a 14-day mission, and GO thresholds of at least 70% sunlight and 50% Earth visibility. The original date is 13 November 2027 at 12:00 UTC; the delayed date is 27 November 2027 at 12:00 UTC.

The following values were checked in the live Demo and the resulting **Try that date** state on 14 November 2026. Percentages are the rounded values displayed by the interface, except where the calendar tooltip is identified.

| Site and scenario | Landing date, UTC | Verdict | Sunlight | Earth visibility |
|---|---|---|---|---|
| Mons Mouton, original | 2027-11-13 12:00 | GO | 70% | 100% |
| Mons Mouton, two-week delay | 2027-11-27 12:00 | NO-GO | 35% | 100% |
| Mons Mouton, suggested five-day shift | 2027-12-02 12:00 | GO | 70.5% in calendar tooltip | 100% |
| Nobile Rim 2, alternative on delayed date | 2027-11-27 12:00 | GO | 70% | 77% |
| Mons Mouton reference point → best spot 2.1 km ENE (Why panel map) | all dates, Nov 2026 – Dec 2028 | no verdict: two-year averages | 48% → 80% | 100% → 68% |

The sunlight metric is the mission-average fraction of the solar disk visible above the modeled horizon. Earth visibility is the fraction of hourly samples with Earth in view. GO means that both mission-average thresholds pass. It does not mean continuous sunlight, verified radio performance, or a safe landing.

Use the [delayed scenario link](https://lunar-landing-site-navigator-sigma.vercel.app/?region=south-pole&date=2027-11-27T12%3A00&orig=2027-11-13T12%3A00&site=viper_mons_mouton_target&days=14&light=70&comm=50) to reset the conditions between takes. The final recording should still show the Demo click.

Evidence in the repository: [Demo settings](../web/src/App.tsx), [metric definitions](../web/src/lib/metrics.ts), [verdict thresholds](../web/src/lib/verdict.ts), [date-shift search](../web/src/lib/tactics.ts), [calendar calculation](../web/src/lib/calendar.ts), and [site provenance](sites-sources.md). The numerical inputs are the [Mons Mouton ephemeris](../web/public/data/ephem/viper_mons_mouton_target.json) and [terrain horizon](../web/public/data/horizon/viper_mons_mouton_target.json), with the [pipeline notes](../pipeline/README.md) documenting the LOLA source and calculation.

## Final edit timeline

The final edit is exactly **29 seconds**, from **0:00 through 0:29**. Cut the recorded actions into these slots; do not attempt a single uninterrupted take. Each row contains one English subtitle cue, with at most 12 words after placeholders are replaced. Optional narration reads the same cue.

| Start | End | Picture and action | English subtitle |
|---|---|---|---|
| 0:00 | 0:02 | Plain team card. Show the team name without faces, member names, or logos. | Ninjago: Masters of Claudejitzu |
| 0:02 | 0:05 | Close-up of the original and delayed dates. Keep the small label "Hypothetical date slip" visible. | Imagine a two-week delay that cuts available sunlight. |
| 0:05 | 0:09 | Project title card. Put the chosen tagline immediately below the title. | Lunar Landing Site Navigator. The Moon gives us a destination. |
| 0:09 | 0:13 | Show the Demo click, then cut to the settled Tactics panel. Frame Mons Mouton's original GO, delayed NO-GO, and 70% to 35% comparison. | The demo changes sunlight from 70% to 35%: NO-GO. |
| 0:13 | 0:16 | Click **Try that date**. Hold on the new date, 2 December at 12:00 UTC, and Mons Mouton's GO. Add a small label: "GO = mission-average thresholds". | Try five days later: December 2 returns GO. |
| 0:16 | 0:19 | Scroll to the calendar. Frame the Mons Mouton row and selected 2 December column; hover its cell to show the tooltip. | Compare daily landing windows in the calendar. |
| 0:19 | 0:24 | In the **Why** panel for Mons Mouton, frame the "Within 5 km: where is it better?" map with its summary line and the ★. Hover the ★ cell. Add a small label: "Two-year averages". | Or move 2.1 km: two-year sunlight rises from 48% to 80%. |
| 0:24 | 0:29 | End card with text credits for JPL Horizons and LRO LOLA, the line "Checked against NASA's LOLA illumination map", and the project URL. Use no agency logos. Stop at 0:29. | NASA Horizons and LOLA data. Next: terrain for any point. |

Nobile Rim 2 is a verified alternative on the delayed date, but leave that branch out of this 29-second cut. The main sequence follows one site and one corrective action.

## Capture and export

1. Open the live site in a clean browser window. Close notifications and hide bookmarks or other personal information. Use a 1920 x 1080 recording canvas at 30 frames per second. Increase the page zoom until the dates and verdicts are readable in the intended crop.
2. Record the browser with OBS Studio, or Xbox Game Bar on Windows. Disable camera capture. Keep microphone capture off unless an eligible adult has agreed to narrate and to the required use of their voice. Record each action with a few seconds before and after it; these extra seconds are editing material, not part of the final runtime.
3. Capture four screen clips: Demo and the changed verdict; **Try that date** and the recovered GO; the calendar; the "Within 5 km" map. Wait for data and animations to settle. For the map clip, select Mons Mouton's card (or click **Show the map** in its "Better spot nearby" tactic) so the **Why** panel describes the same site; its summary should read 48% → best spot 2.1 km ENE, 80%.
4. Assemble the clips and plain title cards in Clipchamp or CapCut. Crop and zoom the relevant panels rather than showing unreadable full-page footage. Use cuts; any transition must stay inside its assigned slot. The timeline ends at 0:29, which is 870 frames at 30 frames per second. Do not append an outro or credits after that point.
5. Burn the English subtitle cues into the video. Use a readable font, strong contrast, and no more than two lines per cue. Keep each complete cue at or below 12 words, including substituted names and taglines. Keep subtitles away from the dates, verdicts, and buttons being demonstrated.
6. Use no music unless its license permits the intended use and the team can supply the required attribution. A silent recording with subtitles is sufficient. Do not display NASA logos, flags, or mission emblems.
7. If the team chooses a Super Intelligence (SI) generated voice, disclose that use in both the project description and the audio/video metadata before publishing. This is a conditional instruction, not a claim that such a voice was used. Any SI-generated images or video must carry a visible generation watermark. Screen recordings of the working site do not need synthetic artwork.
8. Export an MP4 at 1920 x 1080 and 30 frames per second. Play the exported file from start to finish and verify that its full runtime is 29 seconds, including every title and transition. Check the numbers, subtitle spelling, and readability at normal playback speed.
9. Upload the export to a public host and replace [VIDEO LINK]. Test the link in a private browser window with no account signed in. Provide the demo link separately from the live project's link; neither should require permission, registration, or a password.

## Exactly seven slides if video is unavailable

Use this deck instead of the video if recording is not ready. The seven-slide count includes the title and team slides. Do not add a cover, credits page, or appendix.

| Slide | Title | Content and visual |
|---|---|---|
| 1 | Lunar Landing Site Navigator | The Moon gives us a destination. and the public live-site URL. Plain title treatment, without NASA logos. |
| 2 | The team | Ninjago: Masters of Claudejitzu and [MEMBERS]. Replace member credits only with information permitted by the event's age and consent rules. Do not include identifiable minors' names or likenesses. |
| 3 | A delayed landing changes the conditions | Explain the hypothetical Mons Mouton date slip: 13 to 27 November 2027. Show 70% to 35% sunlight and GO to NO-GO for the same 14-day window length. Identify Mons Mouton as a historical VIPER target. |
| 4 | Compare sites and dates | Show the flow: set a date, compare sunlight and Earth visibility, try a suggested shift or select a calendar cell. State the 70% sunlight and 50% Earth-visibility thresholds. |
| 5 | The working result | Use three readable screenshots: the delayed NO-GO, the five-day shift to 2 December with GO, and the "Within 5 km" map (best spot 2.1 km ENE, two-year sunlight 48% → 80%). Note that GO tests mission averages, not continuous coverage or landing safety, and that the map shows two-year averages. |
| 6 | NASA data behind the comparison | Name JPL Horizons for hourly Sun/Earth positions and LRO LOLA for polar terrain horizons. State that the six site reference points' sunlight averages are within 2.5 percentage points of NASA's long-term LOLA illumination map (different periods and settings; map squares are not separately validated). Link the relevant sources from the submission references. Explain that custom points currently use a flat horizon. |
| 7 | Proposed next steps | Terrain for custom points, date-specific verdicts for nearby spots, and explicit uncertainty estimates. Keep these labeled as proposals. Include the live-project link and public source repository. |

Upload the deck to a public host and place that URL in the Project Demo field instead of [VIDEO LINK]. Test access without signing in. These seven slides are the entire fallback demo.

## Official requirements used

The [2026 Project Submission Guide, demo section](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo) permits a video of at most 30 seconds or a deck of at most seven slides, counting title and introduction slides. Exceeding those limits makes a project ineligible for Global Judging. English is required for the project page and linked materials; other-language video speech requires English subtitles. The timeline above follows the Guide's suggested introduction, problem, title, demonstration, and future sequence.

The [2026 Participant Terms and Conditions](https://www.spaceappschallenge.org/legal/) govern third-party rights and the use of people's names, voices, and likenesses. In particular, exclude identifiable people under 18 and secure the required consent for featured adults. These recording rules also apply to the seven-slide fallback.
