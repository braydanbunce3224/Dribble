import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import {
  beginLiveGame, lockSchedule, newDynasty, offerRecruit, runLivePossession, runLiveRest,
  scoutRecruit, simWeek, visitRecruit,
} from "../src/game/engine";
import { teamChemistry } from "../src/game/chemistry";
import { apPoll, kenpom, netRanks, espnField } from "../src/game/ranks";
import { ncaaEligible } from "../src/game/compliance";
import { TEAMS } from "../src/game/teams";
import { SAVE_VERSION } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

let s = newDynasty("gonzaga", 17, { careerMode: false, identity: { first: "Release", last: "Qa", age: 40, almaMaterId: "gonzaga" } });
assert.equal(s.version, SAVE_VERSION);
assert.ok(s.contract, "contract");
assert.ok(s.compliance, "compliance");
assert.ok(s.contract!.remaining >= 3);
assert.ok(s.compliance!.apr >= 900);
assert.ok(ncaaEligible(s));
assert.equal(s.players.filter((p) => p.teamId === "gonzaga").length, 13);
const chem = teamChemistry(s, "gonzaga");
assert.ok(Number.isFinite(chem.score));

s = lockSchedule(s);
assert.equal(s.phase, "regular");
const yours = s.schedule.filter((g) => g.homeId === "gonzaga" || g.awayId === "gonzaga");
assert.ok(yours.length >= 18, `schedule ${yours.length}`);

for (let i = 0; i < 2; i++) s = { ...simWeek(s), pendingPresser: null };
assert.ok((s.teams.gonzaga!.wins + s.teams.gonzaga!.losses) >= 1);
assert.equal(kenpom(s).length, TEAMS.length);
assert.equal(netRanks(s).length, TEAMS.length);
assert.equal(apPoll(s).length, TEAMS.length);
assert.equal(espnField(s).length, 68);

const r = [...s.recruits].sort((a, b) => b.stars - a.stars)[0]!;
s = { ...s, recruitingHours: 10 };
s = scoutRecruit(s, r.id).state;
s = offerRecruit(s, r.id).state;
s = visitRecruit(s, r.id).state;
assert.ok(s.recruits.find((x) => x.id === r.id)?.offers.includes("gonzaga"));

let live = beginLiveGame(s);
if (live?.liveGame) {
  live = runLivePossession(live);
  s = runLiveRest(live);
  assert.ok(!s.liveGame || s.liveGame.done);
} else {
  note("live game did not start after 2 weeks");
}

for (const t of Object.values(s.teams)) {
  if (!Number.isFinite(t.wins) || t.wins < 0) note(`wins ${t.id}`);
}
for (const p of s.players.filter((x) => x.teamId === "gonzaga")) {
  if (!Number.isFinite(p.ovr) || !p.first) note(`player ${p.id}`);
}

const payload = JSON.stringify(s);
writeFileSync("/tmp/dribble-qa-save.json", payload);
console.log("SAVE", (payload.length / 1024).toFixed(0), "kb", "record", `${s.teams.gonzaga!.wins}-${s.teams.gonzaga!.losses}`, "apr", s.compliance?.apr);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("INVARIANTS OK");
}
