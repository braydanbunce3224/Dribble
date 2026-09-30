import assert from "node:assert/strict";
import { addNonCon, dropGame, joinMte, lockSchedule, mteGameCount, newDynasty, yourGames } from "../src/game/engine";
import { MTES } from "../src/game/engine";
import { TEAM_BY_ID, TEAMS } from "../src/game/teams";
import { MAX_GAMES, MAX_PER_WEEK } from "../src/game/types";

assert.ok(MTES.length >= 8, "MTE list is thin");
for (const m of MTES) {
  assert.ok(m.name && m.site && m.week >= 1 && (m.size === 4 || m.size === 8));
  assert.ok(mteGameCount(m) === 2 || mteGameCount(m) === 3);
}

function opp(g: { homeId: string; awayId: string }, you: string) {
  return g.homeId === you ? g.awayId : g.homeId;
}

function regular(s: { schedule: { declined?: boolean; kind: string; homeId: string; awayId: string }[] }, id: string) {
  return s.schedule.filter((g) => !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte") && (g.homeId === id || g.awayId === id));
}

const uk = newDynasty("kentucky", 5, { careerMode: false });
assert.ok(TEAM_BY_ID.kentucky!.prestige >= 78);

const maui = joinMte(uk, "maui");
assert.match(maui.feedback.title, /In the Island/);
assert.match(maui.feedback.detail, /counts in the 30/);
const mauiGames = yourGames(maui.state).filter((g) => g.kind === "mte");
assert.equal(mauiGames.length, 3);
assert.ok(mauiGames.every((g) => g.week === 2 && g.site === "neutral"));
assert.equal(new Set(mauiGames.map((g) => opp(g, "kentucky"))).size, 3);
const field = maui.state.schedule.filter((g) => g.kind === "mte");
assert.equal(field.length, 12, `field ${field.length}`);
const members = new Set(field.flatMap((g) => [g.homeId, g.awayId]));
assert.equal(members.size, 8);
for (const id of members) {
  const n = field.filter((g) => g.homeId === id || g.awayId === id).length;
  assert.equal(n, 3, `${id} mte ${n}`);
}

const again = joinMte(maui.state, "maui");
assert.match(again.feedback.title, /Already in/);

const atlantis = joinMte(maui.state, "atlantis");
assert.match(atlantis.feedback.title, /Week is full/);

const locked = lockSchedule(maui.state);
const still = yourGames(locked).filter((g) => g.kind === "mte");
assert.equal(still.length, 3);
const lockedReg = regular(locked, "kentucky");
assert.equal(lockedReg.length, MAX_GAMES, `UK after maui ${lockedReg.length}`);
assert.ok(lockedReg.some((g) => g.kind === "mte"));
assert.ok(lockedReg.some((g) => g.kind === "conference"));
assert.ok(lockedReg.some((g) => g.kind === "noncon"));
for (let w = 1; w <= 18; w++) {
  const n = locked.schedule.filter((g) => !g.declined && g.week === w && (g.homeId === "kentucky" || g.awayId === "kentucky")).length;
  assert.ok(n <= MAX_PER_WEEK, `week ${w} has ${n}`);
}

const dropped = dropGame(maui.state, mauiGames[0]!.id);
assert.equal(dropped.schedule.filter((g) => g.kind === "mte").length, 0, "drop should clear the classic");

const rainbow = joinMte(uk, "rainbow");
assert.equal(yourGames(rainbow.state).filter((g) => g.kind === "mte").length, 2);

const both = joinMte(rainbow.state, "maui");
assert.match(both.feedback.title, /In the Island/);
const bothLocked = lockSchedule(both.state);
assert.equal(regular(bothLocked, "kentucky").length, MAX_GAMES, `two classics ${regular(bothLocked, "kentucky").length}`);
assert.equal(yourGames(bothLocked).filter((g) => g.kind === "mte").length, 5);

let packed = newDynasty("kentucky", 15, { careerMode: false });
const taken = new Set(["kentucky"]);
for (const t of TEAMS) {
  if (regular(packed, "kentucky").length >= MAX_GAMES) break;
  if (taken.has(t.id)) continue;
  const week = 1 + (taken.size % 5);
  const add = addNonCon(packed, t.id, week, "home");
  if (add.feedback.title === "On the schedule") {
    packed = add.state;
    taken.add(t.id);
  }
}
assert.ok(regular(packed, "kentucky").length >= 20, `padded ${regular(packed, "kentucky").length}`);
const squeezed = joinMte(packed, "maui");
assert.match(squeezed.feedback.title, /In the Island/);
assert.ok(regular(squeezed.state, "kentucky").length <= MAX_GAMES, `join over ${regular(squeezed.state, "kentucky").length}`);
const squeezedLock = lockSchedule(squeezed.state);
assert.equal(regular(squeezedLock, "kentucky").length, MAX_GAMES);
assert.equal(yourGames(squeezedLock).filter((g) => g.kind === "mte").length, 3);

const lowSchool = TEAMS.find((t) => t.prestige >= 56 && t.prestige <= 62) ?? TEAMS.find((t) => t.prestige < 70)!;
const low = newDynasty(lowSchool.id, 8, { careerMode: true });
const denied = joinMte(low, "maui");
assert.match(denied.feedback.title, /said no/);
const open = MTES.filter((m) => m.minPrestige <= low.teams[lowSchool.id]!.prestige).sort((a, b) => a.size - b.size)[0];
assert.ok(open, `${lowSchool.name} prestige ${lowSchool.prestige} cannot enter any MTE`);
const tip = joinMte(low, open.id);
assert.match(tip.feedback.title, new RegExp(`In the ${open.name}`));
assert.equal(yourGames(tip.state).filter((g) => g.kind === "mte").length, mteGameCount(open));
assert.equal(regular(lockSchedule(tip.state), lowSchool.id).length, MAX_GAMES);

console.log(
  "MTES OK",
  MTES.map((m) => m.name).join(" · "),
  `| Maui 3 games vs ${mauiGames.map((g) => TEAM_BY_ID[opp(g, "kentucky")]?.abbr).join(", ")}`,
);
