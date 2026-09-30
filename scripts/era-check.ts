import assert from "node:assert/strict";
import { beginLiveGame, lockSchedule, newDynasty, portalEra, runLiveRest } from "../src/game/engine";
import { eraHasNil, eraHasShotClock, eraHasThree, eraPortal, eraThreeScale } from "../src/game/era";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

assert.equal(eraHasThree(1960), false);
assert.equal(eraHasThree(1970), false);
assert.equal(eraHasThree(1980), true);
assert.equal(eraThreeScale(1960), 0);
assert.ok(eraThreeScale(1980) > 0 && eraThreeScale(1980) < 0.6);
assert.equal(eraHasShotClock(1970), false);
assert.equal(eraHasShotClock(1980), true);
assert.equal(eraHasNil(2010), false);
assert.equal(eraHasNil(2020), true);
assert.equal(eraHasNil(null), true);
assert.equal(eraPortal(2000), "none");
assert.equal(eraPortal(2010), "restricted");
assert.equal(eraPortal(2020), "full");

let s60 = lockSchedule(newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960 }));
if (s60.nilCap !== 0) note(`1960 nilCap ${s60.nilCap}`);
if (portalEra(s60) !== "none") note(`1960 portal ${portalEra(s60)}`);
let live60 = beginLiveGame(s60);
assert.ok(live60?.liveGame, "1960 live");
live60 = runLiveRest(live60!);
const log60 = live60.liveGame?.log ?? [];
const threes60 = log60.filter((e) => e.kind === "three").length;
if (threes60 > 2) note(`1960 live threes ${threes60} / ${log60.length}`);
console.log("1960 threes", threes60, "poss", log60.length, "score", live60.liveGame?.homeScore, live60.liveGame?.awayScore);

let s20 = lockSchedule(newDynasty("gonzaga", 7, { careerMode: false, eraDecade: 2020 }));
if (s20.nilCap < 40) note(`2020 nilCap ${s20.nilCap}`);
if (portalEra(s20) !== "full" && portalEra(s20) !== "closed") note(`2020 portal ${portalEra(s20)}`);
let live20 = beginLiveGame(s20);
assert.ok(live20?.liveGame, "2020 live");
live20 = runLiveRest(live20!);
const log20 = live20.liveGame?.log ?? [];
const threes20 = log20.filter((e) => e.kind === "three").length;
if (threes20 < 4) note(`2020 live threes ${threes20} / ${log20.length}`);
console.log("2020 threes", threes20, "poss", log20.length);

let s10 = newDynasty("virginia", 11, { careerMode: false, eraDecade: 2010 });
if (eraHasNil(s10.eraDecade)) note("2010 NIL");
if (portalEra(s10) !== "restricted" && portalEra(s10) !== "closed" && portalEra(s10) !== "none") {
  note(`2010 portal ${portalEra(s10)}`);
}
s10 = lockSchedule(s10);
if (portalEra(s10) === "none") note("2010 portal missing");
console.log("2010 portal", portalEra(s10), "nil", s10.nilCap);

if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("ERA CHECK OK");
}
