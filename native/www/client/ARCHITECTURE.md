# Dribble architecture

Read this before changing the sim. One module per job.

## Live endgame buttons

`src/game/liveControls.ts` is the only list. `endgameMenu()` returns the labels: Foul up 3, Don't foul, Intentional foul, Hold for last, 2-for-1.

`src/components/game/game-view.tsx` renders that list once, in `EndgameBar`. Do not add a second copy in the footer.

`src/game/plays.ts` `queueLate()` applies the choice. `onePoss()` plays it. The 0:12 stop while up 3 uses `FOUL_CLOCK` from `liveControls.ts`.

## Sim odds

Live possessions: `onePoss()` in `src/game/plays.ts`.

Quick-sim: `simContest()` in `src/game/sim.ts`.

Shared line credits and on-court picks: `src/game/sim.ts` (`blankLine`, `credit`, `onCourtFive`). Shared free-throw caps: `src/game/engine-util.ts`.

Do not add a clamp that pulls either engine back to a target average.

## Box scores

`src/game/box.ts` totals a line (TEAM row, FG / 3P / FT / AST / TO / STL / BLK / PF). Live box and the recap both use `playedLines`, so the TEAM row is every player who played, not a sliced top 8. That total is the header.

`src/game/scoreFloor.ts` is the only place that repairs a finished line. A normal possession log is left alone. Any gap between the scoreboard and the box, including overtime, is closed onto that same total. If one player has 70+ points, a 71/0/0, the whole team total, or more than half the shots, `topUp` / `paintTeam` rebuilds a rotation: roughly 44% shooting, no one over the mid-40s, team total unchanged. A 30–45 point night stays. Quick-sim calls `topUp` before the result is saved. `sealLive` does the same.

## 2-for-1

College shot clock is 30 seconds, so the button is not the last 8 seconds. `endgameMenu` shows `2-for-1` only when you have the ball, the lead is 0 to 8, and the clock is 31–40 seconds. `queueLate("twofor")` sets pace to fast and the next possession to an early shot (about 6–9 seconds). A close game parks once per half on that window so the button can appear. Foul up 3, Don't foul, intentional foul, and Hold for last are unchanged. God Mode → Force 2-for-1 sets that exact look.

## Recruiting hours

High school: `scoutRecruit` (1), `offerRecruit` (2), `visitRecruit` (3) in `src/game/engine.ts`. Week pool is `state.recruitingHours`.

Portal hours are separate: `src/game/portal.ts` (`scoutPortal` 1, `offerPortal` 2, `visitPortal` 2).

## Save / load

`src/game/persist.ts`. The store calls `writeSave` / `loadSave`. Do not bump the save shape for a label change.

## Recruiting depth

`src/game/recruit-depth.ts` is the only place that scores a class.

- Pipeline: in-state starts at +8 and gains +2 per remembered in-state sign, cap +16.
- Bond: scout, offer, and visit write memory on that state. It carries into later classes, cap +8.
- Rival battle: a real rival within 8 interest points cuts the sign chance, up to −10.
- Class pressure: the second pledge at a position is −6. The third is −12.
- Lean math on the recruiting card is the same formula as `signChance`.

`interestIn` and `signChance` in `src/game/engine.ts` call that module. Do not add a second lean formula in the view.

## Regression checklist

- Endgame buttons still come only from `endgameMenu`.
- Live possessions still go through `onePoss`. Quick-sim still goes through `simContest`.
- Career jobs stay at or under `CAREER_MAX_PRESTIGE`. Pick a school still lists every Division I program.
- A sign-chance percentage on the recruiting card matches the Lean math line.

## Career vs Pick a school

Career jobs stay at or under `CAREER_MAX_PRESTIGE`. Pick a school lists every Division I program, including commissioner schools. Do not open power-conference jobs on day one of Career.

## Archives

`ensureSelectionArchive` in `src/game/archives.ts` writes the year when Selection Sunday posts the field: record, conference record, bid or NIT/CBI, standings, and your box scores. `stampSeasonArchive` runs again when the season closes and fills the champion, awards, and the final record. Empty copy only shows before that first write. Open Archives from the gym or More. The row lives on `history.log` and reloads with the save.

## Custom schools

`src/game/custom-schools.ts` mounts a school onto the Division I board (`TEAMS` / `TEAM_BY_ID`) and stores it on this device. `newDynasty` builds a roster and a conference schedule for it. A save also carries `customSchools`, so a reload puts the school back. Career prestige stays capped. Add one from Pick a school.

## Platform

The web app is an installable PWA. The platform manifest and icons stay on `/__grok/manifest.webmanifest`. In production a service worker at `/dribble-sw.js` caches the UI shell. The last save stays in IndexedDB / local storage, so the office still opens offline. Live coaching uses one vertical scroll, wrapping buttons (44px), a sticky scoreboard, and safe-area insets. There is no native iOS binary in this build.

## Export / import

Settings exports the full save as JSON and imports it back with the build stamp. A commissioner room code stores that file locally so another session on the device can join. The gym Season card copies or downloads a markdown report (record, SOS, top players, portal, awards). Bug reports include the build id and the last five errors.

