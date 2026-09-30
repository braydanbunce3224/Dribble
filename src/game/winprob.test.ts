import assert from "node:assert/strict";
import test from "node:test";
import { winProbBandFails } from "./depth.ts";
import { ncaaOutcome, confOutcome } from "./brand.ts";
import { honestWinPct } from "./present.ts";
import type { LiveGame } from "./types.ts";

test("win probability bands", () => {
  assert.deepEqual(winProbBandFails(), []);
});

test("ncaa title copy", () => {
  assert.equal(ncaaOutcome("ncaa-64-East-1", true).label, "Advance to the Round of 32");
  assert.equal(ncaaOutcome("ncaa-64-East-1", true).banner, null);
  assert.equal(ncaaOutcome("ncaa-32-East-1", true).label, "Advance to the Sweet 16");
  assert.equal(ncaaOutcome("ncaa-16-x", true).label, "Advance to the Elite Eight");
  assert.equal(ncaaOutcome("ncaa-8-x", true).label, "Advance to the Final Four");
  assert.equal(ncaaOutcome("ncaa-f4-x", true).label, "Advance to the national championship game");
  assert.equal(ncaaOutcome("ncaa-title-1", true).banner, "national");
  assert.equal(ncaaOutcome("ncaa-title-1", false).label, "National runner-up");
  assert.equal(ncaaOutcome("ncaa-title-1", false).banner, null);
});

test("conference title copy", () => {
  assert.equal(confOutcome(8, true).label, "Advance to the semifinals");
  assert.equal(confOutcome(4, true).banner, null);
  assert.equal(confOutcome(4, true).label, "Advance to the conference final");
  assert.equal(confOutcome(2, false).label, "Conference finalist");
  assert.equal(confOutcome(2, true).banner, "conference");
  assert.equal(confOutcome(2, true).label, "Conference champions");
});

test("display win% does not contradict a big late deficit", () => {
  const live = {
    slotId: "t",
    homeId: "home",
    awayId: "away",
    homeScore: 50,
    awayScore: 78,
    half: 2,
    clock: 90,
    poss: "away",
    offCall: "motion",
    defCall: "man",
    log: [],
    done: false,
  } as LiveGame;
  const p = honestWinPct(live, true);
  assert.ok(p <= 8, `down 28 with 1:30 should not read ${p}%`);
});
