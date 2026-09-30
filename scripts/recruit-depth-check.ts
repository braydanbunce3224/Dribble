import assert from "node:assert/strict";
import { lockSchedule, newDynasty, offerRecruit, scoutRecruit, signChance, signRecruit, interestIn } from "../src/game/engine";
import { classPressure, classShapeLine, leanMathLine, pipelineMemoryLine, signParts } from "../src/game/recruit-depth";
import { TEAM_BY_ID } from "../src/game/teams";

let s = lockSchedule(newDynasty("kentucky", 77, { careerMode: false }));
const home = TEAM_BY_ID.kentucky!.state;
const kid = s.recruits.find((r) => r.state === home && !r.committedTo)!;
assert.ok(kid, "in-state recruit");
const before = interestIn(kid, "kentucky", s);
s = scoutRecruit(s, kid.id).state;
s = offerRecruit(s, kid.id).state;
const after = s.recruits.find((r) => r.id === kid.id)!;
const heated = interestIn(after, "kentucky", s);
assert.ok(heated > before, `bond should warm interest ${before} -> ${heated}`);
assert.match(pipelineMemoryLine(s), /Memory:/);
assert.match(classShapeLine(s), /Class shape/);

const chance = signChance(after, s);
const parts = signParts(after, s, heated);
assert.equal(chance, parts.chance);
assert.match(leanMathLine(after, s, heated), new RegExp(`${chance}% to sign`));

const pos = after.pos;
const clones = s.recruits.filter((r) => r.id !== after.id && r.pos === pos && !r.committedTo).slice(0, 2);
let pressed = s;
for (const c of clones) {
  pressed = {
    ...pressed,
    recruits: pressed.recruits.map((r) => (r.id === c.id ? { ...r, committedTo: "kentucky", offers: r.offers.includes("kentucky") ? r.offers : [...r.offers, "kentucky"] } : r)),
  };
}
const press = classPressure(pressed, pos);
assert.ok(press.penalty >= 6, `pressure ${press.penalty}`);
const crowded = signChance(pressed.recruits.find((r) => r.id === after.id)!, pressed);
assert.ok(crowded < chance, `class pressure should cut sign chance ${chance} -> ${crowded}`);
assert.match(leanMathLine(pressed.recruits.find((r) => r.id === after.id)!, pressed, interestIn(pressed.recruits.find((r) => r.id === after.id)!, "kentucky", pressed)), /class pressure/);

const rival = {
  ...after,
  interest: { ...after.interest, louisville: 90 },
};
const battle = signParts(rival, s, interestIn(rival, "kentucky", s));
assert.ok(battle.rival > 0, "rival battle");
assert.match(leanMathLine(rival, s, interestIn(rival, "kentucky", s)), /rival battle/);
const clear = signParts(after, s, interestIn(after, "kentucky", s));
assert.ok(battle.chance < clear.chance, "rival cuts the chance");

console.log("RECRUIT DEPTH OK", { before, heated, chance, crowded, rival: battle.rival });
