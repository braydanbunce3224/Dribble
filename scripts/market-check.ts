import assert from "node:assert/strict";
import { hydrateState } from "../src/game/develop";
import { lockSchedule, newDynasty, simWeek } from "../src/game/engine";
import { american, hangLine, mlLabel, spreadLabel, weekCard } from "../src/game/market";
import * as market from "../src/game/market";

assert.equal(mlLabel(-150), "-150");
assert.equal(mlLabel(180), "+180");
assert.equal(spreadLabel(0), "PK");
assert.equal(spreadLabel(-5.5), "-5.5");
assert.equal(spreadLabel(3), "+3");
assert.ok(american(0.7) < 0);
assert.ok(american(0.3) > 0);
assert.equal("takeLean" in market, false, "takeLean must stay gone");
assert.equal("gradeSheet" in market, false, "gradeSheet must stay gone");

let s = lockSchedule(newDynasty("kentucky", 12, { careerMode: false, identity: { first: "Book", last: "Sheet", age: 40, almaMaterId: "kentucky" } }));
const yours = s.schedule.find((g) => g.homeId === "kentucky" || g.awayId === "kentucky")!;
const line = hangLine(s, yours);
assert.ok(Number.isFinite(line.homeSpread));
assert.ok(line.total > 110 && line.total < 170, `total ${line.total}`);
assert.ok(Number.isFinite(line.mlHome) && Number.isFinite(line.mlAway));
assert.equal(line.yours, true);
assert.ok(line.mlHome !== 0 && line.mlAway !== 0);
assert.ok(Math.sign(line.mlHome) !== Math.sign(line.mlAway) || line.homeSpread === 0);

const card = weekCard(s, yours.week);
assert.ok(card.some((l) => l.yours));
assert.ok(card.every((l) => Number.isFinite(l.mlHome) && Number.isFinite(l.total)));
assert.ok(card.length >= 1);

s = { ...simWeek(s), pendingPresser: null };
const after = hangLine(s, yours);
assert.ok(Number.isFinite(after.mlHome) && Number.isFinite(after.total));
const packed = hydrateState(JSON.parse(JSON.stringify(s)));
assert.ok(packed.teams.kentucky);
const again = hangLine(packed, yours);
assert.ok(Number.isFinite(again.homeSpread));
assert.ok(packed.sheet);

console.log("LINE", line.homeSpread, "O/U", line.total, "ML", line.mlHome, line.mlAway);
console.log("MARKET OK");
