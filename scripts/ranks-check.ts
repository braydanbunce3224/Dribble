import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simWeek } from "../src/game/engine";
import { apPoll, cbsField, espnField, kenpom, netRanks } from "../src/game/ranks";
import { TEAMS } from "../src/game/teams";

let s = lockSchedule(newDynasty("kentucky", 11, { careerMode: false }));
for (let i = 0; i < 8; i++) s = { ...simWeek(s), pendingPresser: null };

const kp = kenpom(s);
const net = netRanks(s);
const ap = apPoll(s);
const espn = espnField(s);
const cbs = cbsField(s);

assert.equal(kp.length, TEAMS.length);
assert.equal(net.length, TEAMS.length);
assert.equal(ap.length, TEAMS.length);
assert.equal(new Set(kp.map((r) => r.id)).size, TEAMS.length);
assert.equal(new Set(net.map((r) => r.id)).size, TEAMS.length);
assert.equal(new Set(ap.map((r) => r.id)).size, TEAMS.length);
assert.ok(kp.every((r, i) => i === 0 || kp[i - 1]!.adjEM >= r.adjEM));
assert.ok(net.every((r, i) => i === 0 || net[i - 1]!.net >= r.net));
assert.ok(ap[0]!.points > ap[24]!.points);
assert.equal(espn.length, 68);
assert.equal(cbs.length, 68);
assert.equal(new Set(espn.map((b) => b.teamId)).size, 68);
assert.equal(new Set(cbs.map((b) => b.teamId)).size, 68);
assert.ok(kp[0]!.adjORank >= 1 && kp[0]!.luckRank >= 1);
assert.ok(net[0]!.prevRank >= 1);

const meanEM = kp.reduce((n, r) => n + r.adjEM, 0) / kp.length;
const meanO = kp.reduce((n, r) => n + r.adjO, 0) / kp.length;
const meanD = kp.reduce((n, r) => n + r.adjD, 0) / kp.length;
const meanT = kp.reduce((n, r) => n + r.adjT, 0) / kp.length;
assert.ok(Math.abs(meanEM) < 0.05, `mean AdjEM ${meanEM}`);
assert.ok(Math.abs(meanO - 100) < 0.05, `mean AdjO ${meanO}`);
assert.ok(Math.abs(meanD - 100) < 0.05, `mean AdjD ${meanD}`);
assert.ok(meanT > 63 && meanT < 72, `mean AdjT ${meanT}`);
assert.ok(kp[0]!.adjEM > 8, `top AdjEM ${kp[0]!.adjEM}`);
assert.ok(kp[0]!.adjO > kp[kp.length - 1]!.adjO || kp[0]!.adjD < kp[kp.length - 1]!.adjD, "top not better on either end");
assert.ok(kp.every((r) => r.adjT > 55 && r.adjT < 85), "tempo range");
assert.ok(kp.every((r) => Math.abs(r.luck) < 0.35), "luck range");
assert.ok(s.results.every((r) => r.homeBox && r.awayBox && (r.homeBox.poss ?? 0) >= 50), "boxes on results");

const ukKp = kp.find((r) => r.id === "kentucky")!;
const ukNet = net.find((r) => r.id === "kentucky")!;
const ukAp = ap.find((r) => r.id === "kentucky")!;
assert.ok(ukKp.rank <= 120, `UK KenPom ${ukKp.rank}`);
assert.ok(ukNet.rank <= 120, `UK NET ${ukNet.rank}`);

console.log(
  "RANKS OK",
  `AP #1 ${ap[0]!.id}`,
  `NET #1 ${net[0]!.id} prev ${net[0]!.prevRank}`,
  `KenPom #1 ${kp[0]!.id} EM ${kp[0]!.adjEM.toFixed(1)}`,
  `UK AP ${ukAp.rank} / NET ${ukNet.rank} / KenPom ${ukKp.rank}`,
  `ESPN ${espn.length} CBS ${cbs.length}`,
);
