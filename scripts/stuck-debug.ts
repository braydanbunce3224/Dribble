import { lockSchedule, newDynasty, nextYourGame, beginLiveGame, runLivePossession, closeLive, simWeek, simGame, scoutRecruit, offerRecruit, visitRecruit, dropTarget, pitchNil, searchPeople, recruitingProgress, goatLine, gameOfDay, awardRace, seriesVs, heatMark, signChance, fogTape } from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { recapFor } from "../src/game/engine";
import { slimState, packedSize } from "../src/game/persist";
import { kenpom, netRanks, apPoll } from "../src/game/ranks";
import { teamChemistry } from "../src/game/chemistry";
import { TEAMS } from "../src/game/teams";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function bytes(s: GameState) {
  return JSON.stringify(s).length;
}
function slimBytes(s: GameState) {
  return packedSize(s);
}

function roundtrip(s: GameState, tag: string): GameState {
  try {
    const raw = JSON.stringify(s);
    const next = hydrateState(JSON.parse(raw));
    if (!next.playerTeamId) note(`${tag}: hydrate lost team`);
    if (!next.teams[next.playerTeamId]) note(`${tag}: hydrate lost runtime`);
    return next;
  } catch (e) {
    note(`${tag}: hydrate threw ${e instanceof Error ? e.message : e}`);
    return s;
  }
}

function tryRun(tag: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    note(`${tag}: ${e instanceof Error ? e.stack ?? e.message : e}`);
  }
}

console.log("— STUCK DEBUG —");
let s = newDynasty("duke", 20260111, { careerMode: false, identity: { first: "Coach", last: "Stone", age: 38, almaMaterId: "duke" } });
console.log("newDynasty", (bytes(s) / 1e6).toFixed(2), "MB", "players", s.players.length, "recruits", s.recruits.length, "sked", s.schedule.length);

s = lockSchedule(s);
console.log("lock", (bytes(s) / 1e6).toFixed(2), "MB", "sked", s.schedule.length, "watch", s.watch?.length, "week", s.week, "phase", s.phase);
s = roundtrip(s, "lock");

tryRun("hub accessors", () => {
  goatLine(s);
  gameOfDay(s);
  awardRace(s);
  recruitingProgress(s);
  teamChemistry(s, s.playerTeamId);
  const nxt = nextYourGame(s);
  if (nxt) seriesVs(s, s.playerTeamId, nxt.homeId === s.playerTeamId ? nxt.awayId : nxt.homeId);
  kenpom(s);
  netRanks(s);
  apPoll(s);
  searchPeople(s, "a");
  const r = s.recruits[0];
  if (r) {
    heatMark(r, s.playerTeamId, s);
    signChance(r, s);
    fogTape(r);
  }
});

const t0 = Date.now();
for (let i = 0; i < 4; i++) {
  const a = Date.now();
  try {
    s = { ...simWeek(s), pendingPresser: null, pendingStory: null };
  } catch (e) {
    note(`simWeek ${i}: ${e instanceof Error ? e.message : e}`);
    break;
  }
  const ms = Date.now() - a;
  const mb = bytes(s) / 1e6;
  const slim = slimBytes(s) / 1e6;
  console.log(`week ${s.week} ${s.phase} ${ms}ms mem ${mb.toFixed(2)}MB file ${slim.toFixed(2)}MB results ${s.results.length}`);
  if (ms > 2500) note(`simWeek ${s.week} took ${ms}ms`);
  if (slim > 4.5) note(`slim save ${slim.toFixed(2)}MB over typical 5MB quota at week ${s.week}`);
  s = roundtrip(s, `w${s.week}`);
}
console.log("4 weeks wall", Date.now() - t0, "ms");

tryRun("recruiting", () => {
  const board = s.recruits.filter((r) => !r.committedTo);
  const r = board[0];
  if (!r) throw new Error("empty board");
  s = scoutRecruit(s, r.id).state;
  s = offerRecruit(s, r.id).state;
  s = visitRecruit(s, r.id).state;
  s = pitchNil(s, r.id).state;
  const r2 = board[1];
  if (r2) s = dropTarget(s, r2.id).state;
});

tryRun("live", () => {
  const g = nextYourGame(s);
  if (!g) throw new Error("no next game");
  let live = beginLiveGame(s);
  if (!live?.liveGame) throw new Error("beginLiveGame empty");
  for (let i = 0; i < 8; i++) {
    if (!live.liveGame || live.liveGame.done) break;
    live = runLivePossession(live);
  }
  if (live.liveGame && !live.liveGame.done) {
    /* leave mid-game */
    const mid = roundtrip(live, "live-mid");
    if (!mid.liveGame) note("live-mid: hydrate dropped liveGame");
  }
  // finish via sim rest path is in engine; here just close if done
  if (live.liveGame?.done) s = closeLive(live);
  else s = live;
});

tryRun("simGame", () => {
  const before = s.results.length;
  s = { ...simGame(s), pendingPresser: null, pendingStory: null };
  if (s.results.length <= before) note("simGame added no result");
  const last = s.results[s.results.length - 1];
  if (last) recapFor(s, last);
});

tryRun("ranks after", () => {
  if (kenpom(s).length !== TEAMS.length) note(`kp ${kenpom(s).length}`);
});

const slimTest = slimBytes(s);
console.log("final mem", (bytes(s) / 1e6).toFixed(2), "MB file", (slimTest / 1e6).toFixed(2), "MB");
if (slimTest > 4_500_000) note(`final save ${(slimTest / 1e6).toFixed(2)}MB will miss localStorage`);

console.log(issues.length ? `ISSUES ${issues.length}\n${issues.join("\n")}` : "STUCK DEBUG OK");
process.exit(issues.length ? 1 : 0);
