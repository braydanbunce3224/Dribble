import assert from "node:assert/strict";
import { newDynasty, scholarshipsLeft, setAssistedRecruit, simWeek, lockSchedule } from "../src/game/engine";
import { recruitsFor } from "../src/game/develop";

const s0 = newDynasty("kentucky", 42, { careerMode: false });
const roster = s0.players.filter((p) => p.teamId === "kentucky");
const names = roster.map((p) => `${p.first} ${p.last}`);
assert.equal(new Set(names).size, names.length, `roster names should be unique: ${names.join(", ")}`);
assert.ok(roster.every((p) => p.first.length > 1 && p.last.length > 1));
const classic = new Set(["Jaylen Williams", "Malik Johnson", "Cole Brown", "Amari Davis"]);
assert.ok(names.some((n) => !classic.has(n)) || names.length === 13);

const classNames = recruitsFor(42, 2026).map((r) => `${r.first} ${r.last}`);
assert.equal(new Set(classNames).size, classNames.length, "recruit class names should be unique");
assert.ok(classNames.length > 200);

assert.equal(s0.cpuRecruit, false);
const locked = lockSchedule(s0);
const on = setAssistedRecruit(locked, true);
assert.equal(on.state.cpuRecruit, true);
assert.ok(on.state.recruitingHours < locked.recruitingHours || scholarshipsLeft(on.state) < 13, "staff should spend hours or offer");
const offered = on.state.recruits.filter((r) => r.offers.includes("kentucky")).length;
assert.ok(offered > 0, "staff should put scholarships on the table");

let week = on.state;
for (let i = 0; i < 3; i++) week = simWeek(week);
const laterOffers = week.recruits.filter((r) => r.offers.includes("kentucky")).length;
assert.ok(laterOffers >= offered, "staff keeps offering across weeks");

const off = setAssistedRecruit(week, false);
assert.equal(off.state.cpuRecruit, false);
console.log("PEOPLE + ASSIST OK", names.slice(0, 4).join(" / "), "offers", laterOffers);
