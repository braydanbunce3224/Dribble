import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simWeek } from "../src/game/engine";
import { activeLeagueIds } from "../src/game/align";
import type { GameState } from "../src/game/types";

function tick(state: GameState): GameState {
  return { ...simWeek(state), pendingPresser: null };
}

let s: GameState = lockSchedule(newDynasty("kentucky", 21, { careerMode: false }));
let guard = 0;
while (s.phase !== "selection" && s.phase !== "ncaa" && s.phase !== "offseason" && guard++ < 80) {
  s = tick(s);
}
assert.notEqual(s.phase, "offseason", "skipped March");
if (s.phase !== "selection" && s.phase !== "ncaa") {
  throw new Error(`stuck in ${s.phase} week ${s.week} after ${guard} ticks`);
}
if (s.phase === "selection") s = tick(s);

const ncaa = s.selection?.ncaa ?? [];
assert.equal(ncaa.length, 68, `field is ${ncaa.length}`);
const autos = ncaa.filter((b) => b.path === "auto");
const al = ncaa.filter((b) => b.path === "at-large");
const liveConfs = activeLeagueIds(s.teams);
assert.equal(autos.length, liveConfs.length, `autos ${autos.length} leagues ${liveConfs.length}`);
assert.equal(al.length, 68 - liveConfs.length, `at-large ${al.length}`);
assert.equal(new Set(ncaa.map((b) => b.teamId)).size, 68, "duplicate bids");
assert.equal(new Set(autos.map((b) => b.teamId)).size, autos.length, "duplicate autos");
assert.ok(ncaa.every((b) => b.seed >= 1 && b.seed <= 16), "seed range");
const ff = ncaa.filter((b) => b.playIn);
assert.equal(ff.length, 8, `First Four is ${ff.length}`);
assert.equal(ff.filter((b) => b.path === "auto").length, 4, "FF autos");
assert.equal(ff.filter((b) => b.path === "at-large").length, 4, "FF at-large");
assert.ok(ff.filter((b) => b.seed === 16).length === 4, "16-seed FF");
assert.ok(ff.filter((b) => b.seed === 11).length === 4, "11-seed FF");
for (const r of ["East", "West", "South", "Midwest"] as const) {
  const rows = ncaa.filter((b) => b.region === r);
  assert.ok(rows.length >= 16, r);
  const seeds = new Set(rows.map((b) => b.seed));
  for (let i = 1; i <= 16; i++) assert.ok(seeds.has(i), `${r} missing ${i}`);
}
const autoConfs = new Set(autos.map((b) => s.teams[b.teamId]?.conference));
assert.equal(autoConfs.size, liveConfs.length, "auto from every live league");
const you = ncaa.find((b) => b.teamId === "kentucky");
assert.ok(you, "Kentucky should be in the field");

guard = 0;
while (!s.selection?.champ && s.phase !== "offseason" && guard++ < 40) {
  s = tick(s);
}
assert.ok(s.selection?.champ, "no NCAA champion");
assert.ok(ncaa.some((b) => b.teamId === s.selection?.champ), "champ was not in the 68");
assert.ok(s.schedule.some((g) => g.id.startsWith("ncaa-ff-") && g.resultId), "First Four not played");
assert.ok(s.schedule.some((g) => g.id.startsWith("ncaa-64-") && g.resultId), "Round of 64 missing");
assert.ok(s.schedule.some((g) => g.id.startsWith("ncaa-title-") && g.resultId), "title game missing");

const r64 = s.schedule.filter((g) => g.id.startsWith("ncaa-64-"));
assert.equal(r64.length, 32, `R64 is ${r64.length}`);

console.log(
  "SELECTION OK",
  s.phase,
  `autos ${autos.length} AL ${al.length}`,
  you ? `UK ${you.seed} ${you.region} ${you.path}${you.playIn ? " FF" : ""}` : "UK out",
  `FF ${ff.length}`,
  `champ ${s.selection.champ}`,
);
