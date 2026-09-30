import assert from "node:assert/strict";
import { addNonCon, joinMte, lockSchedule, newDynasty, yourGames, gamesInWeek } from "../src/game/engine";
import { MAX_GAMES, MAX_PER_WEEK, REGULAR_WEEKS } from "../src/game/types";

function count(s: ReturnType<typeof lockSchedule>, id: string) {
  return s.schedule.filter((g) => !g.declined && (g.homeId === id || g.awayId === id) && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte")).length;
}

function check(label: string, s: ReturnType<typeof lockSchedule>, id: string, opts?: { mte?: number }) {
  const yours = yourGames(s).filter((g) => !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte"));
  assert.equal(s.phase, "regular", label);
  assert.equal(yours.length, MAX_GAMES, `${label} has ${yours.length}`);
  assert.ok(yours.some((g) => g.kind === "conference"), `${label} no conf`);
  assert.ok(yours.some((g) => g.kind === "noncon"), `${label} no noncon`);
  if (opts?.mte != null) {
    const mte = yours.filter((g) => g.kind === "mte").length;
    assert.equal(mte, opts.mte, `${label} mte ${mte}`);
  }
  for (let w = 1; w <= REGULAR_WEEKS; w++) {
    const n = gamesInWeek(s, w, id).length;
    assert.ok(n <= MAX_PER_WEEK, `${label} week ${w} has ${n}`);
  }
  const over = Object.keys(s.teams).filter((tid) => count(s, tid) > MAX_GAMES + 3).length;
  assert.equal(over, 0, `${label} teams way over`);
  console.log(label, `${yours.filter((g) => g.kind === "conference").length}c + ${yours.filter((g) => g.kind === "noncon").length}nc + ${yours.filter((g) => g.kind === "mte").length}mte`);
}

const empty = lockSchedule(newDynasty("kentucky", 11, { careerMode: false }));
check("UK empty", empty, "kentucky");

let partial = newDynasty("albany", 22, { careerMode: true });
partial = addNonCon(partial, "binghamton", 1, "home").state;
partial = addNonCon(partial, "maine", 2, "home").state;
const kept = yourGames(partial).filter((g) => !g.declined && g.kind === "noncon").map((g) => (g.awayId === "albany" ? g.homeId : g.awayId));
const locked = lockSchedule(partial);
check("Albany partial", locked, "albany");
for (const id of kept) {
  assert.ok(
    yourGames(locked).some((g) => !g.declined && (g.homeId === id || g.awayId === id)),
    `kept ${id}`,
  );
}

check("Gonzaga", lockSchedule(newDynasty("gonzaga", 7, { careerMode: false })), "gonzaga");
check("UCLA era", lockSchedule(newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960 })), "ucla");

const maui = joinMte(newDynasty("kentucky", 11, { careerMode: false }), "maui");
assert.match(maui.feedback.title, /In the Island/);
check("UK maui", lockSchedule(maui.state), "kentucky", { mte: 3 });

const tip = joinMte(newDynasty("gonzaga", 9, { careerMode: false }), "rainbow");
assert.match(tip.feedback.title, /In the Pacific/);
check("Gonzaga rainbow", lockSchedule(tip.state), "gonzaga", { mte: 2 });

console.log("FULL BOARD OK");
