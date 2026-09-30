import assert from "node:assert/strict";
import { beginLiveGame, closeLive, lockSchedule, newDynasty, recapFor, runLiveRest, simGame, simWeek } from "../src/game/engine";

let s = lockSchedule(newDynasty("kentucky", 21, { careerMode: false, identity: { first: "Recap", last: "Desk", age: 40, almaMaterId: "kentucky" } }));
s = { ...simGame(s), pendingPresser: null };
const you = s.results.filter((r) => r.homeId === "kentucky" || r.awayId === "kentucky");
assert.ok(you.length >= 1, "no user result");
const first = you[0]!;
assert.ok(first.recap?.headline, "sim recap missing");
assert.ok(first.recap.homeLeaders.length >= 5, "home box thin");
assert.ok(first.recap.awayLeaders.length >= 5, "away box thin");
assert.equal(first.recap.homeLeaders.reduce((n, p) => n + p.pts, 0), first.homeScore);
assert.equal(first.recap.awayLeaders.reduce((n, p) => n + p.pts, 0), first.awayScore);
assert.equal(first.recap.played, false);
const filled = recapFor(s, first);
assert.equal(filled.headline, first.recap.headline);

let live = beginLiveGame(s);
assert.ok(live?.liveGame);
live = runLiveRest(live!);
assert.ok(live.liveGame?.done);
s = closeLive(live);
const played = s.results.filter((r) => r.homeId === "kentucky" || r.awayId === "kentucky");
const last = played[played.length - 1]!;
assert.ok(last.recap?.headline, "live recap missing");
assert.equal(last.recap.played, true);
assert.ok(last.recap.keyPlay.length > 8, "no key play");

s = { ...simWeek(s), pendingPresser: null };
const weekYou = s.results.filter((r) => r.homeId === "kentucky" || r.awayId === "kentucky");
assert.ok(weekYou.every((r) => r.recap?.headline), "sim week recap hole");
console.log("RECAP", first.recap.headline);
console.log("LIVE", last.recap.headline, "played", last.recap.played);
console.log("RECAP OK");
