import assert from "node:assert/strict";
import { beginLiveGame, lockSchedule, newDynasty, runLiveRest, simGame } from "../src/game/engine";
import { buildPresser, gameCtx, shouldHoldPresser } from "../src/game/presser";
import { mulberry32 } from "../src/game/rng";

let hits = 0;
let bland = 0;
const seen = new Set<string>();
for (let seed = 1; seed <= 24; seed++) {
  let s = newDynasty(seed % 2 ? "kentucky" : "gonzaga", seed * 17, {
    careerMode: false,
    identity: { first: "Pat", last: "Lane", age: 44, almaMaterId: seed % 2 ? "kentucky" : "gonzaga" },
  });
  s = lockSchedule(s);
  s = { ...simGame(s), pendingPresser: null };
  const slot = s.schedule.find((g) => g.resultId && (g.homeId === s.playerTeamId || g.awayId === s.playerTeamId));
  if (!slot) continue;
  const ctx = gameCtx(s, slot.id);
  assert.ok(ctx, "ctx");
  const p = buildPresser({ ...s, lastPresserWeek: -9, recentQuestionIds: [] }, slot.id);
  if (!p) continue;
  hits++;
  assert.ok(p.questions.length >= 2 && p.questions.length <= 3, `q ${p.questions.length}`);
  assert.ok(p.kicker && /[0-9]/.test(p.kicker), "kicker");
  for (const q of p.questions) {
    assert.ok(q.from && q.from.includes(","), `from ${q.from}`);
    assert.ok(q.prompt.length > 40, `short prompt ${q.prompt}`);
    assert.ok(!/What'd you like on the tape/.test(q.prompt), `robotic ${q.prompt}`);
    assert.ok(!/Is this who you guys are/.test(q.prompt), `empty ${q.prompt}`);
    assert.ok(!/locker room|in there|this room|a room that/.test(q.prompt), `locker ${q.prompt}`);
    assert.equal(q.choices.length, 4);
    const labels = new Set(q.choices.map((c) => c.label));
    assert.equal(labels.size, 4, "dup answers");
    for (const c of q.choices) {
      assert.ok(c.label.length >= 24, `short answer ${c.label}`);
      if (/That's the job\.|We're not going anywhere\.|Belief is earned/.test(c.label)) bland++;
      seen.add(q.id);
    }
  }
  const hold = shouldHoldPresser(s, ctx!, mulberry32(seed));
  void hold;
}

assert.ok(hits >= 10, `only ${hits} pressers`);
assert.equal(bland, 0, "slogan leftovers");
assert.ok(seen.size >= 6, `variety ${[...seen].join(",")}`);

let live = newDynasty("duke", 5, { careerMode: false, identity: { first: "Cal", last: "Stone", age: 48, almaMaterId: "duke" } });
live = lockSchedule(live);
live = beginLiveGame(live)!;
live = runLiveRest(live);
if (live.pendingPresser) {
  assert.ok(live.pendingPresser.questions[0]?.from);
}

let pace = lockSchedule(
  newDynasty("kentucky", 88, { careerMode: false, identity: { first: "Pat", last: "Lane", age: 44, almaMaterId: "kentucky" } }),
);
let held = 0;
let games = 0;
for (let i = 0; i < 12; i++) {
  pace = simGame(pace);
  games++;
  if (pace.pendingPresser) held++;
  pace = { ...pace, pendingPresser: null, lastPresserWeek: pace.pendingPresser ? pace.week : pace.lastPresserWeek };
}
assert.ok(games >= 8, `pace games ${games}`);
assert.ok(held >= 1, "never held");
assert.ok(held <= Math.max(4, Math.floor(games * 0.45)), `too often ${held}/${games}`);

console.log("PRESSERS", hits, "kinds", [...seen].sort().join(", "), "held", held, "/", games);
console.log("PRESSER OK");
