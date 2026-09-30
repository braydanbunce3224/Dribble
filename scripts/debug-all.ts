import assert from "node:assert/strict";
import {
  addNonCon, beginLiveGame, closeLive, joinMte, lockSchedule, newDynasty, nextYourGame, offerRecruit,
  pepTalk, resultFor, runLivePossession, runLiveRest, scoutRecruit, setAssistedRecruit, setPlayerMpg,
  signExtension, simGame, simWeek, spendCoachPoint, startNextSeason, takeContractJob, visitRecruit,
  yourGames,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { parseNameText } from "../src/game/names";
import { teamChemistry } from "../src/game/chemistry";
import { kenpom, netRanks, apPoll } from "../src/game/ranks";
import { ncaaEligible } from "../src/game/compliance";
import { reviewContract } from "../src/game/contract";
import { TEAM_BY_ID, TEAMS, careerEligible } from "../src/game/teams";
import { MAX_GAMES } from "../src/game/types";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null };
}

function checkYear(s: GameState, tag: string) {
  if (s.phase !== "offseason") note(`${tag}: phase ${s.phase}`);
  const ncaa = s.selection?.ncaa ?? [];
  if (ncaa.length && ncaa.length !== 68) note(`${tag}: field ${ncaa.length}`);
  if (!s.selection?.champ) note(`${tag}: no champ`);
  const you = s.players.filter((p) => p.teamId === s.playerTeamId);
  if (you.length < 8 || you.length > 15) note(`${tag}: roster ${you.length}`);
  const ids = new Set<string>();
  for (const p of s.players) {
    if (ids.has(p.id)) note(`${tag}: dup ${p.id}`);
    ids.add(p.id);
    if (!Number.isFinite(p.ovr) || p.ovr < 40 || p.ovr > 99) note(`${tag}: ovr ${p.ovr}`);
    if (!p.first?.trim()) note(`${tag}: blank name`);
  }
  for (const r of s.results) {
    if (r.homeScore === r.awayScore) note(`${tag}: tie`);
    if (r.homeScore < 15 || r.awayScore < 15 || r.homeScore > 170 || r.awayScore > 170) {
      note(`${tag}: score ${r.homeScore}-${r.awayScore}`);
    }
    if (!Number.isFinite(r.homeScore)) note(`${tag}: nan`);
  }
  const chem = teamChemistry(s, s.playerTeamId);
  if (!Number.isFinite(chem.score)) note(`${tag}: chem`);
  if (kenpom(s).length !== TEAMS.length) note(`${tag}: kp`);
  if (netRanks(s).length !== TEAMS.length) note(`${tag}: net`);
  if (apPoll(s).length < 25) note(`${tag}: ap`);
  const juco = s.recruits.filter((r) => r.path === "juco").length;
  if (juco !== 28) note(`${tag}: juco class ${juco}`);
  if (!s.draft) note(`${tag}: no stay/go board`);
  const port = s.portal;
  if (!port) note(`${tag}: no portal`);
  else if (s.eraDecade != null && s.eraDecade < 2010) {
    if (port.window !== "none") note(`${tag}: portal ${port.window}`);
  } else if (port.window !== "spring" && port.window !== "closed") note(`${tag}: portal ${port.window}`);
  else if (port.window === "spring" && port.transfers.length < 10) note(`${tag}: spring portal ${port.transfers.length}`);
  const rs = you.filter((p) => p.redshirt);
  if (rs.some((p) => p.year > 3)) note(`${tag}: senior redshirt`);
}

function runYear(s: GameState, tag: string): GameState {
  s = setAssistedRecruit(s, true).state;
  if (s.phase === "preseason") s = lockSchedule(s);
  const n = yourGames(s).filter((g) => !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte")).length;
  if (n !== MAX_GAMES) note(`${tag}: board ${n}`);
  const first = nextYourGame(s);
  if (first && first.week > 2 && s.phase === "regular") note(`${tag}: opened week ${first.week}`);
  let g = 0;
  while (s.phase !== "offseason" && g++ < 90) s = tick(s);
  checkYear(s, tag);
  return s;
}

console.log("— LIVE / SIM GAME —");
let s = lockSchedule(newDynasty("kentucky", 81, { careerMode: false, identity: { first: "Pat", last: "Debug", age: 41, almaMaterId: "kentucky" } }));
assert.equal(s.week, 1);
const g0 = nextYourGame(s)!;
assert.ok(g0.week <= 2, `next ${g0.week}`);
s = simGame(s);
assert.ok(s.teams.kentucky!.wins + s.teams.kentucky!.losses >= 1, "sim game no record");
const played = yourGames(s).find((g) => g.id === g0.id);
assert.ok(played?.resultId, "sim game no resultId");
assert.ok(resultFor(s, played!), "calendar missing final");
let live = beginLiveGame(s);
assert.ok(live?.liveGame, "live start");
live = runLivePossession(live!);
assert.ok((live.liveGame?.log.length ?? 0) > 0, "live log");
s = runLiveRest(live);
if (s.liveGame?.done) s = closeLive(s);
const recAfter = s.teams.kentucky!.wins + s.teams.kentucky!.losses;
assert.ok(recAfter >= 2, `after live ${recAfter}`);

const star = [...s.recruits].sort((a, b) => b.stars - a.stars)[0]!;
s = { ...s, recruitingHours: 10 };
s = scoutRecruit(s, star.id).state;
s = offerRecruit(s, star.id).state;
s = visitRecruit(s, star.id).state;
assert.ok(s.recruits.find((r) => r.id === star.id)?.offers.includes("kentucky"));
const pep = s.players.find((p) => p.teamId === "kentucky")!;
s = pepTalk(s, pep.id).state;
s = setPlayerMpg(s, pep.id, 30);
s = spendCoachPoint(s, "offense").state;

console.log("— SIM GAME THROUGH YEAR —");
let sg = lockSchedule(newDynasty("duke", 55, { careerMode: false }));
let nSim = 0;
while (nextYourGame(sg) && nSim++ < 40) {
  sg = { ...simGame(sg), pendingPresser: null };
}
if (sg.phase === "regular" && !nextYourGame(sg)) {
  sg = { ...simGame(sg), pendingPresser: null };
}
if (sg.phase === "regular") note("sim-game: still regular after 30");
let g = 0;
while (sg.phase !== "offseason" && g++ < 40) sg = tick(sg);
checkYear(sg, "sim-game-year");
  const youO = sg.players.filter((p) => p.teamId === "duke").sort((a, b) => b.ovr - a.ovr).slice(0, 8);
  const cpuO = sg.players.filter((p) => p.teamId === "boston-college").sort((a, b) => b.ovr - a.ovr).slice(0, 8);
  const avg = (ps: typeof youO) => ps.reduce((n, p) => n + p.ovr, 0) / Math.max(1, ps.length);
  console.log("OVR duke", avg(youO).toFixed(1), "bc", avg(cpuO).toFixed(1));
  if (sg.teams.duke!.losses === 0 && sg.teams.duke!.wins >= 32) note("sim-game-year undefeated 32+");
  const sample = sg.results.filter((r) => r.homeId === "duke" || r.awayId === "duke").slice(0, 6);
  console.log("DUKE scores", sample.map((r) => `${r.homeScore}-${r.awayScore}`).join(" "));
const finals = yourGames(sg).filter((x) => x.resultId && resultFor(sg, x));
if (finals.length < 18) note(`sim-game-year calendar finals ${finals.length}`);
console.log("SIMGAME", sg.phase, sg.teams.duke!.wins, "-", sg.teams.duke!.losses, "finals", finals.length);

console.log("— CAREER —");
const job = TEAMS.filter(careerEligible).sort((a, b) => a.prestige - b.prestige)[1]!;
let c = runYear(newDynasty(job.id, 9, { careerMode: true, identity: { first: "C", last: "Mode", age: 33, almaMaterId: job.id } }), "career");
console.log("CAREER", job.id, c.teams[c.playerTeamId]!.wins, "-", c.teams[c.playerTeamId]!.losses);

console.log("— ERA —");
let e = newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "J", last: "Wood", age: 44, almaMaterId: "ucla" } });
if (e.nilCap !== 0) note("era NIL on");
e = runYear(e, "era");
console.log("ERA", e.teams.ucla!.wins, "-", e.teams.ucla!.losses);

console.log("— FULL YEAR + NEXT —");
s = setAssistedRecruit(s, true).state;
g = 0;
while (s.phase !== "offseason" && g++ < 90) s = tick(s);
checkYear(s, "y1");
const review = reviewContract(s);
console.log("BOARD", review.decision, review.record, "eligible", ncaaEligible(s));
if (review.decision === "extend") s = signExtension(s).state;
if (review.decision === "fire" && review.jobs[0]) s = takeContractJob(s, review.jobs[0].teamId).state;
s = startNextSeason(s);
if (s.phase !== "preseason") note(`y2 phase ${s.phase}`);
if (s.players.filter((p) => p.teamId === s.playerTeamId).length !== 13) note("y2 roster");
s = lockSchedule(s);
if (nextYourGame(s)!.week > 2) note(`y2 week ${nextYourGame(s)!.week}`);
const mte = joinMte({ ...s, phase: "preseason", schedule: s.schedule.filter((x) => x.kind === "conference") } as GameState, "maui");
void mte;

console.log("— HYDRATE / NAMES —");
const packed = JSON.parse(JSON.stringify(s)) as GameState;
const hyd = hydrateState(packed);
assert.equal(hyd.players.length, s.players.length);
assert.ok(hyd.contract);
assert.ok(hyd.compliance);
const txt = "id,name,mascot,abbr,city\nkentucky,Kentucky,Wildcats,UK,Lexington\n";
const parsed = parseNameText(txt);
if ("error" in parsed) note(`names ${parsed.error}`);

console.log("— MTE / ADD —");
let pre = newDynasty("gonzaga", 4, { careerMode: false });
pre = addNonCon(pre, "duke", 1, "home").state;
pre = joinMte(pre, "maui").state;
pre = lockSchedule(pre);
const kinds = new Set(yourGames(pre).map((x) => x.kind));
if (!kinds.has("mte")) note("mte missing after lock");
if (!kinds.has("noncon")) note("noncon missing");
console.log("GONZAGA kinds", [...kinds].join(","), "n", yourGames(pre).filter((x) => !x.declined).length);

console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("DEBUG ALL OK");
}
