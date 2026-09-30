import assert from "node:assert/strict";
import { beginLiveGame, closeLive, lockSchedule, newDynasty, runLiveRest, simGame, simWeek, startNextSeason } from "../src/game/engine";
import { simContest } from "../src/game/sim";
import { forceEndgameState, endgameMenu } from "../src/game/liveControls";
import { lockGamePlan, queueLate, setLiveCall } from "../src/game/plays";
import { addCustomSchool, unmountCustom } from "../src/game/custom-schools";
import { TEAM_BY_ID, TEAMS } from "../src/game/teams";
import { hydrateState } from "../src/game/develop";
import { mulberry32 } from "../src/game/rng";
import type { GameState } from "../src/game/types";

function finalOf(state: GameState) {
  const live = state.liveGame;
  if (live?.done) return { h: live.homeScore, a: live.awayScore };
  const r = state.results[state.results.length - 1];
  if (!r) throw new Error("no final");
  return { h: r.homeScore, a: r.awayScore };
}

function assertReal(label: string, h: number, a: number) {
  if (h < 40 || a < 40 || h > 130 || a > 130) throw new Error(`${label} ${h}-${a}`);
}

let s = lockSchedule(newDynasty("duke", 11, { careerMode: false }));
for (let i = 0; i < 12; i++) {
  s = simGame(s);
  const r = s.results[s.results.length - 1]!;
  assertReal(`sim ${i}`, r.homeScore, r.awayScore);
}
console.log("12 sim games ok", s.results.slice(-3).map((r) => `${r.homeScore}-${r.awayScore}`).join(" "));

function tipped(seed: number) {
  let g = lockSchedule(newDynasty("gonzaga", seed, { careerMode: false }));
  const started = beginLiveGame(g);
  if (!started?.liveGame) throw new Error("no live");
  return lockGamePlan(started);
}

{
  let g = forceEndgameState(tipped(4));
  const ids = endgameMenu(g).map((x) => x.label);
  assert.ok(ids.includes("Foul up 3"), ids.join(","));
  assert.ok(ids.includes("Don't foul"), ids.join(","));
  g = runLiveRest(queueLate(g, "foul3"));
  g = closeLive(g);
  const f = finalOf(g);
  assertReal("foul3", f.h, f.a);
  console.log("foul3", f.h, f.a);
}
{
  let g = forceEndgameState(tipped(5));
  g = runLiveRest(queueLate(g, "letplay"));
  g = closeLive(g);
  const f = finalOf(g);
  assertReal("letplay", f.h, f.a);
  console.log("letplay", f.h, f.a);
}
{
  let g = forceEndgameState(tipped(6));
  const live = g.liveGame!;
  const youHome = live.homeId === g.playerTeamId;
  g = { ...g, liveGame: { ...live, poss: youHome ? "home" : "away", clock: 40 } };
  assert.ok(endgameMenu(g).some((x) => x.label === "Hold for last"));
  assert.ok(endgameMenu(g).some((x) => x.label === "2-for-1"));
  g = runLiveRest(setLiveCall(g, "off", "delay"));
  g = closeLive(g);
  const f = finalOf(g);
  assertReal("hold", f.h, f.a);
  console.log("hold", f.h, f.a);
}
{
  let g = forceEndgameState(tipped(7));
  const live = g.liveGame!;
  const youHome = live.homeId === g.playerTeamId;
  g = { ...g, liveGame: { ...live, poss: youHome ? "home" : "away", clock: 40 } };
  g = runLiveRest(queueLate(g, "twofor"));
  g = closeLive(g);
  const f = finalOf(g);
  assertReal("twofor", f.h, f.a);
  console.log("twofor", f.h, f.a);
}
{
  let g = forceEndgameState(tipped(8));
  const live = g.liveGame!;
  const youHome = live.homeId === g.playerTeamId;
  const you = youHome ? live.homeScore : live.awayScore;
  const opp = youHome ? live.awayScore : live.homeScore;
  const homeScore = youHome ? opp - 4 : opp;
  const awayScore = youHome ? opp : opp - 4;
  g = { ...g, liveGame: { ...live, poss: youHome ? "away" : "home", clock: 40, homeScore, awayScore } };
  assert.ok(endgameMenu(g).some((x) => x.label === "Intentional foul"), endgameMenu(g).map((x) => x.label).join(","));
  void you;
  g = runLiveRest(setLiveCall(g, "def", "foul"));
  g = closeLive(g);
  const f = finalOf(g);
  assertReal("intentional", f.h, f.a);
  console.log("intentional", f.h, f.a);
}

const base = lockSchedule(newDynasty("kansas", 21, { careerMode: false }));
const rng = mulberry32(21);
let pts = 0;
let fgm = 0;
let fga = 0;
let n = 0;
const opp = base.schedule.find((g) => g.homeId === base.playerTeamId || g.awayId === base.playerTeamId);
if (!opp) throw new Error("no opp");
const oppId = opp.homeId === base.playerTeamId ? opp.awayId : opp.homeId;
for (let i = 0; i < 40; i++) {
  const game = simContest(base, base.playerTeamId, oppId, rng);
  pts += game.homeScore + game.awayScore;
  n += 2;
  for (const row of [...game.homeLines, ...game.awayLines]) {
    fgm += row.fgm;
    fga += row.fga;
  }
  assertReal(`contest ${i}`, game.homeScore, game.awayScore);
}
const ppg = pts / n;
const fg = fgm / fga;
console.log("band", ppg.toFixed(1), "fg", (fg * 100).toFixed(1));
if (ppg < 62 || ppg > 84) throw new Error(`ppg ${ppg}`);
if (fg < 0.38 || fg > 0.52) throw new Error(`fg ${fg}`);

const school = addCustomSchool({
  name: "Test U",
  mascot: "Trials",
  abbr: "TST",
  color: "#0E6B4F",
  city: "Testville",
  stateName: "US",
  conference: "HOR",
});
assert.equal(school.name, "Test U");
assert.ok(TEAMS.some((t) => t.id === school.id));
const dynasty = newDynasty(school.id, 77, { careerMode: false });
assert.ok(dynasty.teams[school.id], "missing from world");
assert.ok(dynasty.schedule.some((g) => g.homeId === school.id || g.awayId === school.id), "missing from schedule");
const raw = JSON.parse(JSON.stringify(dynasty)) as GameState;
unmountCustom(school.id);
assert.equal(TEAM_BY_ID[school.id], undefined);
const loaded = hydrateState(raw);
assert.equal(TEAM_BY_ID[school.id]?.name, "Test U");
assert.ok(loaded.teams[school.id]);
console.log("custom school ok", school.id, "games", dynasty.schedule.filter((g) => g.homeId === school.id || g.awayId === school.id).length);

function runSeason(start: GameState) {
  let cur = start;
  let guard = 0;
  while (cur.phase !== "offseason" && guard++ < 80) cur = { ...simWeek(cur), pendingPresser: null, pendingStory: null };
  assert.equal(cur.phase, "offseason");
  return cur;
}
let year = newDynasty("albany", 9, { careerMode: true });
year = runSeason(year);
year = startNextSeason(year);
year = runSeason(year);
const prior = year.history.log[0]!;
assert.ok(prior.championId, "no champion");
assert.ok((prior.awards ?? []).length > 0, "no awards");
assert.ok((prior.boxes ?? []).length > 0, "no box");
assert.ok((prior.standings ?? []).length > 1, "no standings");
console.log("archive", prior.season, prior.championId, "awards", prior.awards?.length, "boxes", prior.boxes?.length);
console.log("LEFTOVERS OK");
