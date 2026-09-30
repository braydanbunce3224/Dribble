import assert from "node:assert/strict";
import { newDynasty, simWeek, startNextSeason } from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import type { GameState } from "../src/game/types";

function runSeason(start: GameState): GameState {
  let s = start;
  let guard = 0;
  while (s.phase !== "offseason" && guard++ < 80) {
    s = { ...simWeek(s), pendingPresser: null };
  }
  assert.equal(s.phase, "offseason", `did not reach offseason (phase=${s.phase} week=${s.week})`);
  return s;
}

const start = newDynasty("kentucky", 2026, { careerMode: false });
assert.equal(start.history.seasons, 0);
assert.equal(start.history.log.length, 0);
assert.equal(start.identity.age, 38);

const years: GameState[] = [];
let s = start;
for (let i = 0; i < 4; i++) {
  s = runSeason(s);
  years.push(s);
  const log = s.history.log;
  assert.equal(log.length, i + 1, `log length after year ${i + 1}`);
  const last = log[log.length - 1]!;
  assert.equal(last.season, start.season + i);
  assert.equal(last.wins + last.losses, last.wins + last.losses);
  assert.ok(last.wins + last.losses >= 8, `too few games ${last.wins}-${last.losses}`);
  const you = s.teams[s.playerTeamId]!;
  assert.equal(you.allWins, log.reduce((n, y) => n + y.wins, 0));
  assert.equal(s.history.wins, you.allWins);
  const roster = s.players.filter((p) => p.teamId === s.playerTeamId);
  assert.ok(roster.some((p) => (p.careerGames ?? 0) > 0), "no career games recorded");
  s = startNextSeason(s);
  assert.equal(s.history.seasons, i + 1);
  assert.equal(s.identity.age, 38 + i + 1);
  assert.equal(s.teams[s.playerTeamId]!.wins, 0);
  assert.equal(s.teams[s.playerTeamId]!.allWins, you.allWins);
  assert.equal(s.history.log.length, i + 1);
}

const raw = JSON.stringify(s);
const loaded = hydrateState(JSON.parse(raw) as GameState);
assert.equal(loaded.history.seasons, 4);
assert.equal(loaded.history.log.length, 4);
assert.equal(loaded.history.wins, loaded.history.log.reduce((n, y) => n + y.wins, 0));
assert.equal(loaded.identity.age, 42);
assert.equal(loaded.season, start.season + 4);

const sumW = loaded.history.log.reduce((n, y) => n + y.wins, 0);
const sumL = loaded.history.log.reduce((n, y) => n + y.losses, 0);
console.log("SEASONS", loaded.history.log.map((y) => `${y.season} ${y.wins}-${y.losses}${y.confTitle ? " conf" : ""}${y.ncaaBid ? " NCAA" : ""}${y.title ? " TITLE" : ""}`).join(" | "));
console.log("CAREER", `${sumW}-${sumL}`, "bids", loaded.history.ncaaBids, "league", loaded.history.confTitles, "titles", loaded.history.titles);
console.log("AGE", loaded.identity.age, "YEAR", loaded.season, "ALL-TIME", `${loaded.teams[loaded.playerTeamId]!.allWins}-${loaded.teams[loaded.playerTeamId]!.allLosses}`);
console.log("HISTORY RETENTION OK");
