# Dribble improvement checklist

## Phase 1 — contradictory state (this pass)

- [x] Blank alma mater stays unset. Job pick does not write the campus in.
- [x] Five fouls removes a player from the floor and the next possession. The foul prompt uses the current count, not a stale 2.
- [x] A commit is Verbal until signing day when flips are on, otherwise Signed. Those two words are not shown together.
- [x] The win projection is labeled a projection. It is not "AD wants," and it is not the contract.
- [x] Sign stays disabled until interest meets the difficulty floor. The missing number is visible before the click.
- [x] Minutes no longer change usage.
- [x] Intentional-foul lines follow the team that fouled.
- [x] Regression tests in `src/game/consistency.test.ts`.

## Still open

- [ ] One ruleset across possession coaching, quick sim, week sim, season sim, and resumed games. Minutes, shot charts, and double-counting are not fully audited.
- [ ] Optional Casual / Head Coach / Full Control onboarding, one modal at a time.
- [ ] Gym rebuilt around the next decision and a weekly digest.
- [ ] Program cards, coach archetypes, and a reputation that moves with results.
- [ ] Play-call explanations, opponent adjustments, and distinct persistent plan vs next possession.
- [ ] Full Coaching, Coach Moments, and Quick Sim on the same game, with honest sim labels.
- [ ] Gamecast driven by recorded events, with reduced motion.
- [ ] Recruiting board, comparison, NIL, and transfers on one scholarship ledger.
- [ ] One rotation screen for minutes, usage, and subs.
- [ ] Development, morale, promises, and a Coach Office with separate contract vs projection vs stretch goals.
- [ ] Facilities, schedule goals, and a career history built only from saved events.
- [ ] Postgame report tied to specific possessions.
- [ ] Reduced-effects reading mode and the accessibility list.
- [ ] Autosave status, migrations, export/import checks, and atomic season advance beyond what already exists.
- [ ] Season-distribution balance runs.

## Verified

- Blank alma mater, minutes vs usage, sign floor, verbal vs signed, projection label, foul-out selection, and foul wording. `node --import ./scripts/ts-register.mjs --experimental-strip-types --test src/game/consistency.test.ts`
- `tsc --noEmit` clean.

## Not verified this pass

- A full live game with a real foul-out, injury, timeout, overtime, save/resume, export/import, or a narrow viewport.
- Older saves that already stored the campus as the alma mater. New jobs stay blank. An old file cannot tell a real choice from the old default.
