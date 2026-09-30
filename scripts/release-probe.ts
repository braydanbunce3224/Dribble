import assert from "node:assert/strict";
import { CONFERENCES } from "../src/game/teams";
import { activeLeagueIds, applyYearRealignment, conferenceInYear } from "../src/game/align";
import {
  beginLiveGame, lockSchedule, newDynasty, runLiveRest, signExtension, simWeek, startNextSeason, takeContractJob, yourGames,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { reviewContract } from "../src/game/contract";
import type { GameState } from "../src/game/types";
import { MAX_GAMES } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

const ident = { first: "Pat", last: "Lane", age: 40, almaMaterId: "kentucky" };
const base60 = newDynasty("kentucky", 1960, { careerMode: false, eraDecade: 1960, identity: ident });
const years = [1960, 1964, 1971, 1978, 1979, 1991, 1996, 2004, 2011, 2012, 2013, 2014, 2020, 2023, 2024, 2026];
for (const y of years) {
  const s = y >= 2025
    ? newDynasty("kentucky", y, { careerMode: false, identity: ident })
    : applyYearRealignment(base60, 1960, y);
  for (const t of Object.values(s.teams)) {
    if (!CONFERENCES.some((c) => c.id === t.conference)) note(`${y} ${t.id} bad conf ${t.conference}`);
  }
  const n = new Map<string, number>();
  for (const t of Object.values(s.teams)) n.set(t.conference, (n.get(t.conference) ?? 0) + 1);
  const singles = [...n.entries()].filter(([, c]) => c === 1 && conferenceInYear("kentucky", y) !== "skip");
  const trueSingles = singles.filter(([id]) => id !== "IND" && id !== "SWC");
  if (trueSingles.some(([, c]) => c === 1)) {
    const bad = trueSingles.filter(([, c]) => c === 1);
    if (bad.length) note(`${y} singleton leagues ${bad.map(([id]) => `${id}:${n.get(id)}`).join(",")}`);
  }
  const bids = activeLeagueIds(s.teams);
  if (bids.length < 24) note(`${y} only ${bids.length} bidding leagues`);
  if (bids.includes("IND")) note(`${y} independents bidding`);
}

let ucla60 = lockSchedule(newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "John", last: "Wood", age: 44, almaMaterId: "ucla" } }));
assert.equal(ucla60.teams.ucla?.conference, "P12");
const uclaConf = yourGames(ucla60).filter((g) => g.kind === "conference" && !g.declined);
assert.ok(uclaConf.every((g) => {
  const opp = g.homeId === "ucla" ? g.awayId : g.homeId;
  return ucla60.teams[opp]?.conference === "P12";
}), "UCLA 1960 played outside the Slope");
assert.equal(yourGames(ucla60).filter((g) => !g.declined).length, MAX_GAMES);

let nd = lockSchedule(newDynasty("notre-dame", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "Ara", last: "Par", age: 40, almaMaterId: "notre-dame" } }));
assert.equal(nd.teams["notre-dame"]?.conference, "IND");
const ndLive = yourGames(nd).filter((g) => !g.declined);
assert.equal(ndLive.length, MAX_GAMES, `ND board ${ndLive.length}`);
assert.equal(ndLive.filter((g) => g.kind === "conference").length, 0, "independents should not have league games");

let live = beginLiveGame(ucla60);
assert.ok(live?.liveGame, "1960 live");
ucla60 = runLiveRest(live!);
const threes = (ucla60.liveGame?.log ?? []).filter((e) => e.kind === "three").length;
if (threes > 2) note(`1960 live threes ${threes}`);

let s70 = lockSchedule(newDynasty("indiana", 1970, { careerMode: false, eraDecade: 1970, identity: { first: "Bob", last: "Knight", age: 40, almaMaterId: "indiana" } }));
live = beginLiveGame(s70);
s70 = runLiveRest(live!);
const hs = s70.liveGame?.homeScore ?? 0;
const as = s70.liveGame?.awayScore ?? 0;
if (hs < 40 || as < 40 || hs > 110 || as > 110) note(`1970 wild ${hs}-${as}`);

const hyd = hydrateState(JSON.parse(JSON.stringify(ucla60)));
assert.equal(hyd.teams.ucla?.conference, "P12");
assert.equal(hyd.teams.texas?.conference, "SWC");

let walk = applyYearRealignment(base60, 1960, 1979);
assert.equal(walk.teams.syracuse?.conference, "BE");
assert.equal(walk.teams.ucla?.conference, "P12");
walk = applyYearRealignment(walk, 1979, 2024);
assert.equal(walk.teams.ucla?.conference, "B10");
assert.equal(walk.teams.texas?.conference, "SEC");
assert.equal(walk.news[0]?.kicker, "Realignment");

let y = lockSchedule(newDynasty("kentucky", 42, { careerMode: false, identity: ident }));
let g = 0;
while (y.phase !== "offseason" && g++ < 90) y = tick(y);
assert.equal(y.phase, "offseason", `stuck ${y.phase}`);
assert.equal((y.selection?.ncaa ?? []).length, 68);
const review = reviewContract(y);
if (review.decision === "extend") y = signExtension(y).state;
if (review.decision === "fire" && review.jobs[0]) y = takeContractJob(y, review.jobs[0].teamId).state;
y = startNextSeason(y);
assert.equal(y.phase, "preseason");
assert.equal(y.players.filter((p) => p.teamId === y.playerTeamId).length, 13);

console.log("PROBE OK", issues.length, "1960 UCLA conf", uclaConf.length, "ND", ndLive.length, "1970", hs, as);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
}
