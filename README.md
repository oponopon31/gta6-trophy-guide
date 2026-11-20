# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Platinum — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for make.fun's "Build the best GTA 6 trophy guide" bounty. Every trophy shows its official name, description and grade, with a guide in this guide's own words that cites its sources, plus a roadmap to the platinum, the one possibly missable trophy flagged, and a checklist that saves in your browser.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly in a browser (serve it over HTTP for the data file to load — `file://` may block the local JSON fetch in some browsers). No build step, no network, no account: the app is static files under `app/`.

## What it does

- **All 55 trophies** with official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze), as published on PSN via Exophase and PSNProfiles.
- **Tracker**: tick trophies off; progress saves in localStorage. A slim progress bar stays pinned to the top of the page, and the tracker always tells you the **next trophy up** — the first one you have not earned yet, with its first guide step.
- **Numeric progress**: trophies with a target (250 stunts, 500 profile actions, $250,000 laundered, 100% completion, and more) get a − / + stepper in the guide panel. Reach the target and the trophy is marked earned automatically; the count saves with the rest of your progress.
- **Every checklist row shows its guide**: each row carries a one-line preview of the guide and a "Sources: …" line, so the cited guidance is visible without opening every trophy. Rows are denser and the text is larger, so the list stays readable when the page is shrunk to a screenshot.
- **Search and filters**: by name or mission, by kind (story, missable, collectibles, activities, crime, side quests, money, explore, misc), by grade, and remaining-only / earned-only.
- **Spoiler setting**: "Hide story spoilers" hides the name, description and guide of story trophies you have not earned yet.
- **Roadmap to the platinum**: 3 steps from PowerPyx — story 60–80 hours, 100% checklist ~100 hours, Strangers & Freaks and cleanup ~10 hours; about 200 hours in one playthrough, difficulty 4/10, no online trophies. Each step says what it earns.
- **Missable flag, honestly**: exactly one trophy is possibly missable — **Positive Mental Attitude**, the Chapter 1 balcony meditation — with the exact steps and a manual-save safety net. The other 54 are all earnable in free-roam after the story.
- **Cited guides**: every trophy's guide names its sources beside it. Two trophies whose method no guide has confirmed yet (In The Beginning… and Bad Luck, I Guess) are marked **UNCONFIRMED**, and description-based readings are labelled as inferences, not facts. Two more were confirmed by PowerPyx on 20 Nov 2026: Ten Pin (kick 10 pedestrians from a motorcycle or push bike within 60 seconds) and The Truth Is Out There (the UFO easter egg north-west of the Starlet Motel).
- **Export / import / share**: export progress to a JSON file (earned trophies and numeric counts), import it back, reset, or copy a share link (`?seed=…&open=…&spoiler=on`) that fills progress and opens one trophy.
- **Original look**, no Rockstar logo, box art or game screenshots.

## Files

- `app/index.html` — the page: sticky progress bar, roadmap, tracker controls, checklist, guide panel, sources.
- `app/app.js` — the tracker (ES module, no libraries): rendering, guide previews and source lines, numeric steppers, next-up line, filters, spoiler mode, localStorage, export/import, share-link URL parameters.
- `app/style.css` — the original stylesheet.
- `app/data/trophies.json` — the 55 trophies: official name/description/grade, hidden flag, kind, missable flag, target count, guide, per-trophy source keys, and a confirmation status.
- `main.ts` — Node 22 entrypoint: validates the trophy data (log-only, never throws), copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `vendor/makefun-frontend.ts` (do not edit the vendor file).
- `serve.ts` — small static server for local testing, with GET and HEAD support.
- `shots.json` — the URL and viewport behind each screenshot.
- `screenshots/` — 4 screenshots of the running app (1280×800): (1) checklist with guide previews and sources, progress and filters; (2) one trophy's guide with its sources open; (3) roadmap with all three steps and the missable flag; (4) the spoiler setting at work.

## Verify

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
mkdir -p out2 && MAKEFUN_OUTPUT_DIR=out2 node main.ts # run twice: the two dossier.json files must be byte-identical
node serve.ts                                          # then open http://localhost:8080
```

To check the app offline, open it in headless Chrome with the network blocked (e.g. `--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE localhost"`) and confirm all 55 trophies render, the filters and spoiler toggle work, and export produces a JSON file.

## Sources

- Exophase — Grand Theft Auto VI trophy list: https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — Grand Theft Auto VI trophies: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- PowerPyx — GTA 6 Trophy Guide & Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- GTA Zone — GTA 6 Trophy List: All 55 Trophies and Achievements: https://gta-zone.com/news/gta-6-trophies-achievements/
- GTABase — GTA 6 Trophy Guide & Achievements List: https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series
- Beebom — All GTA 6 Meditation Spots Locations: https://beebom.com/gta-6-meditation-spots-locations/
- TrueAchievements — Grand Theft Auto VI achievements: https://www.trueachievements.com/game/Grand-Theft-Auto-VI/achievements

Names, descriptions and grades are the official list; how-to steps and counts come from PowerPyx, cross-checked against GTA Zone and GTABase, with the meditation details cross-checked against Beebom. Guide facts were checked on 20 Nov 2026; the game launched 19 Nov 2026, so early guides are still being updated — where they stay silent, this guide says so.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
