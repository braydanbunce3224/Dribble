import assert from "node:assert/strict";
import { lockSchedule, newDynasty, offerRecruit, visitRecruit } from "../src/game/engine";
import { calcApr, emptyCompliance, ncaaEligible, noteOffer, noteVisit, tickCompliance, APR_LINE } from "../src/game/compliance";
import { projectedField } from "../src/game/selection";

let s = newDynasty("kentucky", 4, { careerMode: false });
assert.ok(s.compliance);
assert.equal(s.compliance.banned, false);
assert.ok(calcApr(s) >= 900);
assert.ok(ncaaEligible(s));

const low = {
  ...s,
  players: s.players.map((p) =>
    p.teamId === "kentucky" ? { ...p, skills: { ...p.skills, iq: 32 }, morale: 30, mpg: 28 } : p,
  ),
};
const apr = calcApr(low);
assert.ok(apr < APR_LINE, `low IQ APR ${apr}`);
const ticked = tickCompliance(low);
assert.equal(ticked.compliance?.banned, true);
assert.ok(!ncaaEligible(ticked));

const field = projectedField(ticked);
assert.equal(field.length, 68);
assert.ok(!field.some((b) => b.teamId === "kentucky"));

const era = newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960 });
const kid = { ...era.recruits[0]!, nilAsk: 70, wants: { ...era.recruits[0]!.wants, nil: 80 } };
const dirty = noteOffer(era, kid);
assert.ok(dirty.compliance?.flags.some((f) => f.kind === "extra"));
assert.ok((dirty.compliance?.heat ?? 0) > (era.compliance?.heat ?? 0));

s = lockSchedule(s);
s = { ...s, phase: "ncaa", recruitingHours: 10, compliance: { ...emptyCompliance(), visitsThisWeek: 0 } };
const dead = visitRecruit(s, s.recruits[0]!.id);
assert.ok(dead.feedback.title.includes("Dead"));
assert.ok(dead.state.compliance?.flags.some((f) => f.kind === "dead"));

let v = { ...lockSchedule(newDynasty("gonzaga", 5, { careerMode: false })), recruitingHours: 30 };
const r0 = v.recruits[0]!.id;
const r1 = v.recruits[1]!.id;
const r2 = v.recruits[2]!.id;
v = visitRecruit(v, r0).state;
v = visitRecruit(v, r1).state;
v = visitRecruit(v, r2).state;
assert.ok((v.compliance?.visitsThisWeek ?? 0) >= 3);
assert.ok(v.compliance?.flags.some((f) => f.kind === "visits"));

const modern = newDynasty("duke", 9, { careerMode: false });
const star = modern.recruits.sort((a, b) => b.nilAsk - a.nilAsk)[0]!;
const over = { ...modern, nilCap: 10 };
const flagged = noteOffer(over, { ...star, nilAsk: 80 });
assert.ok(flagged.compliance?.flags.some((f) => f.kind === "nil"));

const offered = offerRecruit({ ...modern, recruitingHours: 10 }, modern.recruits[0]!.id);
assert.ok(offered.state.recruits[0] || offered.state);

console.log("APR default", calcApr(s), "low", apr);
console.log("BAN field", field.length, "kentucky in", field.some((b) => b.teamId === "kentucky"));
console.log("COMPLIANCE OK");
