[![Make.fun](https://make.fun/badge/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Make.fun](https://make.fun/badge/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Make.fun](https://make.fun/badge/gta6-trophy-guide-01)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Atlas — GTA VI Trophy Guide & Platinum Roadmap

The complete GTA VI trophy guide for PlayStation 5: all 55 official trophies, every guide
step cited, a platinum roadmap timeline, and the Leonida Atlas — a map of the ten key
places for the platinum run.

## What is inside

- **315 cited steps** across 55 trophies, from 9 sources (TrueTrophies, Game8, IGN,
  Eurogamer, Push Square, Exophase, PSNProfiles, Rockstar Newswire, GTA Wiki).
- **Audit bar** — 53/55 trophies confirmed, 2 unconfirmed (44, 49), 1 missable (28),
  verified 2026-11-21 against the official 55-trophy list.
- **Platinum roadmap** — five phases, 70–95 h estimated: story, strangers, activities,
  collectibles, then 100% completion.
- **Leonida Atlas** — a stylised map with 10 markers and a legend; click a marker to
  jump to its trophy.
- **Tracker** — tick trophies and individual steps off; progress persists in the
  browser and can be exported/imported. Search across trophies, steps and sources;
  filter by grade and category; spoiler mode blurs story names and descriptions.
- **Time & difficulty per trophy** — community estimates, marked as estimates.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes
`dossier.json` with the vendored make.fun library. The app is plain static files and
loads nothing over the network.

No Rockstar logos or artwork are used. Trophy names, descriptions and grades are from
the official 55-trophy list (2026-11-18).
