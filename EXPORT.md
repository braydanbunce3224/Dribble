# Dribble 2026 — source export

College basketball coaching sim. Single-player dynasty. This zip is the **game source** so another model or editor can review and change it. It is not a running build: run `npm install` then `npm run dev`.

## Stack

- React 19 + Zustand + Vite + Tailwind v4
- TypeScript, path alias `@/` → `src/`
- Persistence: localStorage (see `src/game/persist.ts`)
- No multiplayer. Auth/db scaffolding exists under `src/lib/` but the game does not require sign-in.

Dev server: `npm run dev` (port 8080). Typecheck: `npx tsc --noEmit`.

Engine QA (from repo root, after install):

```
node --import ./scripts/ts-register.mjs --experimental-strip-types scripts/mte-check.ts
node --import ./scripts/ts-register.mjs --experimental-strip-types scripts/schedule-30.ts
node --import ./scripts/ts-register.mjs --experimental-strip-types scripts/debug-all.ts
```

## What to edit first

| Area | Path |
|---|---|
| Season sim, schedule, lock, MTE, live close | `src/game/engine.ts` |
| Live possession / padLive / clock | `src/game/plays.ts` |
| Offseason, hydrate, next season | `src/game/develop.ts` |
| Types | `src/game/types.ts` |
| Team list (365 analog schools) | `src/game/teams.ts` |
| Save / quota | `src/game/persist.ts` |
| Store / UI actions | `src/game/store.ts` |
| Screens | `src/components/game/*.tsx` |
| Shell / More menu | `src/components/game/shell.tsx` |
| Odds board (read-only) | `src/game/market.ts`, `src/components/game/market-view.tsx` |
| Styles | `src/styles.css` |

## Product rules (do not break)

- Regular season is **exactly 30 games** after lock: conference + non-con + holiday classics (MTE). Classics **count in the 30**.
- `MAX_GAMES = 30`, `MAX_PER_WEEK = 3` in `src/game/types.ts`.
- Join MTE takes that week, bumps player non-con if needed, never exceeds 30. Dropping one classic game drops the whole event (`dropGame` in `engine.ts`).
- **Betting odds** is a read-only lines board. No bets, no leans, no sheet. Menu label is “Betting odds”; view id stays `"market"`.
- Do not dump the user on the title screen after refresh if a save exists — restore to office / last view.
- Saves must stay under typical localStorage quota. Compact results in `persist.ts`. Do not stop slimming.
- Live `padLive` must **preserve the winner** and keep scores in a college range.
- Conference home/away should stay balanced (`rebalanceHomeAway`).
- Keep changes **minimal**. No new libraries unless required. `develop.ts` may still carry `@ts-nocheck` from a prior restore — prefer not to widen that.

## Views (`View` in types.ts)

`title` `hub` `schedule` `recruiting` `roster` `game` `recap` `inbox` `presser` `news` `standings` `analytics` `market` `bracketology` `contract` `draft` `camp` `awards` `compliance` `hof` `saves` `names` `settings` `search` plus selection / story.

## Engine flow

1. `newDynasty(teamId, seed)` — 365 teams, conference slate already on the board.
2. Preseason: add non-con, join MTE, then `lockSchedule` fills to 30 and sets `phase: "regular"`.
3. `simWeek` / `simGame` / live (`beginLiveGame` → possessions → `closeLive`).
4. Postseason via `src/game/selection.ts` (68-team NCAA, NIT, Crown).
5. Offseason: camp, portal, draft stay/go, `startNextSeason`.

## Not in this zip

- `node_modules/`
- Build output / screenshots / sandbox-only files
- User photo attachments

## License / names

Schools in `teams.ts` are **analog names** by default. `public/packs/real-schools.json` is an optional overlay the player can apply from Names. Do not ship copyrighted 2K/EA assets.
