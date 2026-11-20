[![Make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/oponopon31/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Platinum — GTA 6 Trophy Guide & Tracker

An offline web app that guides and tracks all 55 PlayStation 5 trophies of
Grand Theft Auto VI: the official list with saved progress, filters and a
spoiler setting, a roadmap to the platinum, and a guide to each trophy in our
own words that cites its sources.

## What it does

- **Checklist** of all 55 official trophies (1 platinum, 2 gold, 6 silver,
  46 bronze) with their official name, description and grade. Each row shows
  a one-line guide preview and its sources. Progress is saved in the browser
  (localStorage) and can be exported to a file, imported back, or shared as
  a link.
- **Guide panel** for every trophy: the full guide, its sources with links,
  and — for trophies with a PSN count — a numeric stepper (for example
  0 / 18 meditation spots). Reaching the target marks the trophy earned.
- **Roadmap** to the platinum in three steps, each with an "Earns:" line, and
  the one possibly missable trophy flagged: Positive Mental Attitude.
- **Filters** by grade and kind, text search, and a spoiler setting that
  hides story trophies until they are earned.
- **Sticky progress bar** on every view: earned count, percent, and a
  dynamic "Next up" (the first unearned trophy and its first step).

## Sources and honesty

Names, descriptions and grades are the official PlayStation list, as
published by Exophase and PSNProfiles (the two agree on all 55). Guides are
this entry's own words; each one cites its sources beside it. Two trophies
are **unconfirmed** and flagged as such in the guide: In The Beginning… and
Bad Luck, I Guess. Two more were confirmed from PowerPyx shortly before this
entry was built: Ten Pin (kick 10 pedestrians from a bike within 60 seconds)
and The Truth Is Out There (the UFO northwest of the Starlet Motel after
02:00).

## Run it

```sh
node serve.ts        # serves app/ at http://127.0.0.1:8123/
```

Open the address in desktop Chrome. The guide works offline from its own
files and makes no network request at run time.

## Hand in

```sh
node main.ts         # writes the dossier to /output (or $MAKEFUN_OUTPUT_DIR)
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`
(the kit's copy, unchanged). `shots.json` lists the four screenshots and the
state each one was taken in.

## License

MIT. See LICENSE.
