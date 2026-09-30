import assert from "node:assert/strict";
import {
  hireStaff, fireStaff, lockSchedule, newDynasty, scoutOpponent, setCaptain, setPractice, setStarter,
  staffOf, facilitiesOf, practiceOf, depthOf, upgradeFacility, simWeek, resumeOf, gameQuad, yourGames,
  tickFatigue, teamLoad, upcomingEvents,
} from "../src/game/engine";
import { seedEvents } from "../src/game/program";
import { hydrateState } from "../src/game/develop";
import { slimState } from "../src/game/persist";
import { SAVE_VERSION } from "../src/game/types";

function tick(s: ReturnType<typeof newDynasty>) {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

let s = newDynasty("gonzaga", 2026, {
  careerMode: false,
  identity: { first: "Pat", last: "Lane", age: 40, almaMaterId: "gonzaga" },
});
assert.equal(s.version, SAVE_VERSION);
assert.ok(staffOf(s).oc);
assert.ok(staffOf(s).dc);
assert.ok(staffOf(s).rc);
assert.ok(staffOf(s).pool.length >= 4);
assert.equal(practiceOf(s), "scrimmage");
const fac = facilitiesOf(s);
assert.ok(fac.practice >= 1 && fac.practice <= 5);

const ocId = staffOf(s).pool.find((c) => c.role === "oc")!.id;
const hired = hireStaff(s, ocId);
assert.ok(hired.state.staff?.oc?.id === ocId);
s = hired.state;
const fired = fireStaff(s, "oc");
assert.equal(fired.state.staff?.oc, null);
s = fired.state;

const kid = s.players.filter((p) => p.teamId === "gonzaga").sort((a, b) => b.ovr - a.ovr)[0]!;
s = setCaptain(s, kid.id).state;
assert.equal(depthOf(s).captainId, kid.id);
s = setStarter(s, kid.pos, kid.id).state;
assert.equal(depthOf(s).starters[kid.pos], kid.id);
const wrong = setStarter(s, kid.pos === "C" ? "PG" : "C", kid.id);
assert.notEqual(wrong.state.depth?.starters[kid.pos === "C" ? "PG" : "C"], kid.id);
s = setPractice(s, "hard").state;
assert.equal(practiceOf(s), "hard");

const up = upgradeFacility(s, "practice");
assert.ok(up.state.facilities!.practice === fac.practice + 1 || up.feedback.title === "Donors said no" || up.feedback.title === "Maxed");
if (up.state.facilities) s = up.state;

s = lockSchedule(s);
const board = yourGames(s).filter((g) => !g.declined);
const q = gameQuad(s, board[0]!, "gonzaga");
assert.ok(q === 1 || q === 2 || q === 3 || q === 4);
const evs = upcomingEvents(s);
assert.ok(evs.some((e) => e.kind === "madness" || e.kind === "media"));
const withRival = seedEvents({
  ...s,
  schedule: [
    ...s.schedule,
    { id: "rv-test", week: 9, homeId: "gonzaga", awayId: "saint-marys", site: "home" as const, kind: "noncon" as const },
  ],
});
assert.ok(withRival.some((e) => e.kind === "rivalry"), "rivalry night should seed when the game is on the board");

s = { ...s, recruitingHours: 8 };
const sc = scoutOpponent(s);
assert.ok(sc.state.scouted || sc.feedback.title === "No tip");
s = sc.state;
const r = resumeOf(s);
assert.ok(r.net >= 1 && r.net <= 365);
assert.ok(r.need.length > 4);

const before = teamLoad(s).avg;
const bye = tickFatigue({ ...s, practice: "rest" });
assert.ok(teamLoad(bye).avg <= before, "rest on a bye should not pile fatigue");

for (let i = 0; i < 3; i++) s = tick(s);
const packed = hydrateState(JSON.parse(JSON.stringify(slimState(s))));
assert.ok(packed.staff?.pool);
assert.ok(packed.facilities);
assert.equal(packed.practice, "hard");

console.log("CHAMP", staffOf(s).oc?.name ?? "open", "fac", facilitiesOf(s).practice, "resume", r.path, r.net, "load", teamLoad(s).avg);
console.log("CHAMP OK");
