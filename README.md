# Leonida Platinum — GTA VI Trophy Guide &amp; Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for make.fun's "Build the best GTA 6 trophy guide" bounty ($250 in USDC).

## What this app is

Open `app/index.html` in desktop Chrome with the network off and it just works — plain static files, no build step, no account, no network request. Serve it with any static server (`node serve.ts`, then http://localhost:8080) or open the file directly.

- **Every trophy, official data first.** All 55 trophies with the official name, description and grade exactly as PlayStation publishes them (Exophase and PSNProfiles agree on all 55), plus a guide in my own words for each one. Every guide names its sources beside it — the official list for the name/description/grade, and PowerPyx's launch-week GTA 6 Trophy Guide &amp; Roadmap for the how-to steps and counts.
- **A real tracker.** Tick trophies off and progress saves in the browser (localStorage). Export your progress to a JSON file and import it back, reset when you want a fresh run. Search by name or mission, filter by kind (story, missable, collectibles, activities, crime, side quests, money, explore, misc) and by grade, or show remaining/earned only. Shareable URL parameters (`?seed=…&open=…&spoiler=on`) pre-fill progress and open a guide.
- **Spoiler setting.** Turn on "Hide story spoilers" and every story trophy you have not earned yet hides its name and description until you earn it.
- **Roadmap to the Platinum.** A three-step plan built from the official descriptions — story (60–80 h), the 100% checklist (~100 h), then Strangers &amp; Freaks and cleanup (~10 h), about 200 hours in one playthrough, difficulty 4/10, no online trophies.
- **Missables, flagged honestly.** Exactly one trophy is potentially missable — Positive Mental Attitude, whose Chapter 1 balcony meditation may be required — with the exact steps and the manual-save safety net. The other 54 can all be earned after the story in free-roam. Four trophies whose method no launch-week guide has confirmed yet (In The Beginning…, Bad Luck, I Guess, The Truth Is Out There, Ten Pin) are marked unconfirmed in their guides, with the description-based reading labelled as inference, not fact.
- **Original look, no Rockstar art.** The design, colours and wording are my own; no logo, box art or game screenshot is used.

## Files

- `app/index.html`, `app/app.js`, `app/style.css` — the app (ES module, CSS, no libraries).
- `app/data/trophies.json` — the 55 trophies: official name/description/grade, hidden flag, kind, missable flag, target count, my guide, and a sources list per trophy.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — four renders of the app taken in headless Chrome; `shots.json` records the URL and viewport each one was taken from.

## Verify it yourself

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # builds out/dossier.json
node serve.ts                                            # http://localhost:8080
```

## Sources

- Official trophy list: Exophase — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/ ; PSNProfiles — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- How-to guide: PowerPyx — GTA 6 Trophy Guide &amp; Roadmap — https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- Cross-checks: KeenGamer — https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/ ; GTA Zone — https://gta-zone.com/news/gta-6-trophies-achievements/

Grand Theft Auto VI is a property of Rockstar Games / Take-Two Interactive. This is an unofficial fan guide, not affiliated with or endorsed by Rockstar Games.
