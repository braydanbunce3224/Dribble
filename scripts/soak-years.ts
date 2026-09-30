import assert from "node:assert/strict";
import {
  addNonCon, beginLiveGame, goOffseason, joinMte, lockSchedule, newDynasty, offerRecruit,
  pepTalk, runLivePossession, runLiveRest, scoutRecruit, setAssistedRecruit, setPlayerMpg,
  simGame, simWeek, spendCoachPoint, startNextSeason, visitRecruit,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { apPoll, kenpom, netRanks } from "../src/game/ranks";
import { TEAM_BY_ID, TEAMS, careerEligible } from "../src/game/teams";
import { parseNameText, applyNamePack, resetNames } from "../src/game/names";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(msg: string) {
  issues.push(msg);
  console.log("ISSUE", msg);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null };
}

function finite(n: number, label: string) {
  if (!Number.isFinite(n)) note(`${label} is ${n}`);
}

function checkRosterNation(s: GameState, tag: string) {
  const byTeam = new Map<string, number>();
  const ids = new Set<string>();
  for (const p of s.players) {
    if (ids.has(p.id)) note(`${tag}: duplicate player id ${p.id}`);
    ids.add(p.id);
    if (p.year < 1 || p.year > 4) note(`${tag}: ${p.first} ${p.last} year ${p.year}`);
    if (p.ovr < 40 || p.ovr > 99) note(`${tag}: ovr ${p.ovr} ${p.first}`);
    if (p.mpg < 0 || p.mpg > 40) note(`${tag}: mpg ${p.mpg}`);
    if (!p.first?.trim() || !p.last?.trim()) note(`${tag}: blank name ${p.id}`);
    byTeam.set(p.teamId, (byTeam.get(p.teamId) ?? 0) + 1);
  }
  for (const t of TEAMS) {
    const n = byTeam.get(t.id) ?? 0;
    const lo = s.phase === "offseason" ? 8 : 10;
    if (n < lo || n > 15) note(`${tag}: ${t.id} roster size ${n}`);
  }
  const you = s.players.filter((p) => p.teamId === s.playerTeamId);
  const names = you.map((p) => `${p.first} ${p.last}`.toLowerCase());
  if (new Set(names).size !== names.length) note(`${tag}: duplicate names on your roster ${names.join(", ")}`);
}

function checkResults(s: GameState, tag: string) {
  for (const r of s.results) {
    if (r.homeScore === r.awayScore) note(`${tag}: tie ${r.id} ${r.homeScore}-${r.awayScore}`);
    if (r.homeScore < 15 || r.awayScore < 15 || r.homeScore > 170 || r.awayScore > 170) {
      note(`${tag}: wild score ${r.homeScore}-${r.awayScore} ${r.id}`);
    }
    finite(r.homeScore, `${tag} homeScore`);
    finite(r.awayScore, `${tag} awayScore`);
    if (!r.homeBox || !r.awayBox) note(`${tag}: missing box ${r.id}`);
  }
}

function checkRanks(s: GameState, tag: string) {
  const kp = kenpom(s);
  const net = netRanks(s);
  const ap = apPoll(s);
  if (kp.length !== 365) note(`${tag}: kenpom ${kp.length}`);
  if (net.length !== 365) note(`${tag}: net ${net.length}`);
  if (ap.length < 25) note(`${tag}: ap ${ap.length}`);
  const row = kp[0];
  if (row) {
    finite(row.adjEM, `${tag} adjEM`);
    finite(row.adjO, `${tag} adjO`);
    finite(row.adjD, `${tag} adjD`);
    finite(row.adjT, `${tag} adjT`);
  }
  const em = kp.reduce((n, r) => n + r.adjEM, 0) / kp.length;
  if (Math.abs(em) > 0.6) note(`${tag}: kenpom mean AdjEM ${em.toFixed(3)}`);
}

function runTo(s: GameState, pred: (x: GameState) => boolean, cap = 90): GameState {
  let g = 0;
  while (!pred(s) && g++ < cap) s = tick(s);
  if (!pred(s)) note(`stuck phase=${s.phase} week=${s.week} after ${g} ticks`);
  return s;
}

function seasonLine(s: GameState) {
  const you = s.teams[s.playerTeamId]!;
  const bid = s.selection?.ncaa.find((b) => b.teamId === s.playerTeamId);
  return `${s.season} ${you.wins}-${you.losses} conf ${you.confW}-${you.confL} ${bid ? `${bid.seed} ${bid.region}` : s.selection?.nit.includes(s.playerTeamId) ? "NIT" : s.selection?.crown.includes(s.playerTeamId) ? "CBI" : "home"} champ ${s.selection?.champ ?? "?"}`;
}

console.log("— soak 1: Lexington, assisted recruiting, 5 seasons —");
resetNames();
let s = newDynasty("kentucky", 77, { careerMode: false, identity: { first: "Test", last: "Coach", age: 40, almaMaterId: "kentucky" } });
assert.equal(s.cpuRecruit, false);
checkRosterNation(s, "y0-pre");

const mte = joinMte(s, "maui");
s = mte.state;
if (!s.schedule.some((g) => g.kind === "mte")) note("MTE did not land (prestige/week?) " + mte.feedback.title);
const add = addNonCon(s, "duke", 4, "home");
s = add.state;

s = setAssistedRecruit(s, true).state;
assert.equal(s.cpuRecruit, true);
s = lockSchedule(s);
assert.equal(s.phase, "regular");
const yourN = s.schedule.filter((g) => !g.declined && (g.homeId === s.playerTeamId || g.awayId === s.playerTeamId) && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte")).length;
if (yourN < 28 || yourN > 32) note(`schedule length ${yourN}`);

const live = beginLiveGame(s);
if (!live?.liveGame) note("could not start live game");
else {
  let g = live;
  for (let i = 0; i < 8; i++) g = runLivePossession(g);
  if (!g.liveGame) note("live game vanished after 8 possessions");
  else {
    finite(g.liveGame.homeScore, "live home");
    finite(g.liveGame.awayScore, "live away");
    if (!g.liveGame.log.length) note("live game has no events");
  }
  s = runLiveRest(g);
  if (s.liveGame && !s.liveGame.done) note("live rest did not finish");
}

const youId = s.playerTeamId;
const pepTarget = s.players.find((p) => p.teamId === youId);
if (pepTarget) {
  const before = pepTarget.morale;
  s = pepTalk(s, pepTarget.id).state;
  if ((s.players.find((p) => p.id === pepTarget.id)?.morale ?? 0) < before) note("pep talk dropped morale");
  s = setPlayerMpg(s, pepTarget.id, 32);
}
s = spendCoachPoint({ ...s, skillPoints: 2 }, "recruiting").state;
if ((s.coachSkills.recruiting ?? 0) <= 50) note("coach point did not land");

s = runTo(s, (x) => x.phase === "selection" || x.phase === "ncaa" || x.phase === "offseason");
if (s.phase === "selection") {
  if (!s.selection?.ncaa.length) note("selection with empty field");
  if (s.selection?.ncaa.length !== 68) note(`field ${s.selection?.ncaa.length}`);
  if (s.selection?.revealed) note("selection already revealed before show");
  s = tick(s);
}
checkRanks(s, "mid-march");
s = runTo(s, (x) => x.phase === "offseason", 50);
if (s.phase !== "offseason") note("never reached offseason year 1");
if (!s.selection?.champ) note("no national champ");
if (s.selection?.champ && !s.selection.ncaa.some((b) => b.teamId === s.selection?.champ)) note("champ not in the 68");
checkResults(s, "y1");
checkRosterNation(s, "y1");
const y1juco = s.recruits.filter((r) => r.path === "juco").length;
if (y1juco !== 28) note(`y1 juco class ${y1juco}`);
if (!s.draft) note("y1 missing stay/go board");
const y1offers = s.recruits.filter((r) => r.offers.includes(youId)).length;
const y1commits = s.recruits.filter((r) => r.committedTo === youId).length;
const playedY1 = s.teams[youId]!.wins + s.teams[youId]!.losses;
const yours = s.players.filter((p) => p.teamId === youId);
const starter = [...yours].sort((a, b) => b.ovr - a.ovr)[0];
const maxGames = Math.max(0, ...yours.map((p) => p.seasonGames ?? 0));
if (playedY1 - maxGames > 3) note(`seasonGames max ${maxGames} vs played ${playedY1}`);
console.log("Y1", seasonLine(s), "offers", y1offers, "commits", y1commits, "games", starter?.seasonGames);
if (y1offers === 0) note("assisted recruiting never offered");
if (y1commits < 1) note("assisted recruiting never signed");
const y1rec = s.teams[youId]!;
if (y1rec.wins >= 35 && y1rec.losses <= 1) note(`dynasty too easy Y1 ${y1rec.wins}-${y1rec.losses}`);
const liveRes = s.results[0];
if (liveRes && Math.abs(liveRes.homeScore - liveRes.awayScore) >= 36) {
  note(`live blowout ${liveRes.homeScore}-${liveRes.awayScore}`);
}

const lines: string[] = [seasonLine(s)];
let emptyAssisted = 0;
for (let year = 2; year <= 5; year++) {
  s = startNextSeason(s);
  if (s.phase !== "preseason") note(`y${year} not preseason`);
  if (s.week !== 0) note(`y${year} week ${s.week}`);
  if (s.teams[youId]!.wins !== 0) note(`y${year} wins not reset`);
  if (year === 2 && (s.offseasonReport?.incoming.length ?? 0) < 1) {
    note(`assisted incoming ${s.offseasonReport?.incoming.length ?? 0}`);
  }
  checkRosterNation(s, `y${year}-pre`);
  const roster = s.players.filter((p) => p.teamId === youId);
  if (roster.length !== 13) note(`y${year} your roster ${roster.length}`);
  s = setAssistedRecruit(s, true).state;
  s = lockSchedule(s);
  s = runTo(s, (x) => x.phase === "offseason", 120);
  if (s.phase !== "offseason") note(`y${year} stuck ${s.phase}`);
  if (!s.selection?.champ) note(`y${year} no champ`);
  const ncaa = s.selection?.ncaa ?? [];
  if (ncaa.length && ncaa.length !== 68) note(`y${year} field ${ncaa.length}`);
  if (s.history.log.length !== year) note(`y${year} log ${s.history.log.length}`);
  const last = s.history.log[s.history.log.length - 1];
  if (last && last.wins + last.losses < 20) note(`y${year} too few games ${last.wins}-${last.losses}`);
  checkResults(s, `y${year}`);
  lines.push(seasonLine(s));
  console.log(`Y${year}`, seasonLine(s));
  const rec = s.teams[youId]!;
  if (rec.losses === 0 && rec.wins >= 32) note(`dynasty undefeated Y${year} ${rec.wins}-${rec.losses}`);
  const yCommits = s.recruits.filter((r) => r.committedTo === youId).length;
  if (yCommits < 1) emptyAssisted++;
}
if (emptyAssisted >= 3) note(`assisted classes empty in ${emptyAssisted} seasons`);

const loaded = hydrateState(JSON.parse(JSON.stringify(s)) as GameState);
if (loaded.history.log.length !== 5) note(`hydrate log ${loaded.history.log.length}`);
if (loaded.identity.age !== 44) note(`age ${loaded.identity.age}`);
checkRanks(loaded, "y5");

console.log("— soak 2: career mid-major, manual recruit, 2 seasons —");
const careerTeam = TEAMS.filter(careerEligible).sort((a, b) => a.prestige - b.prestige)[3] ?? TEAMS[0]!;
let c = newDynasty(careerTeam.id, 101, { careerMode: true, identity: { first: "Pat", last: "Lane", age: 32, almaMaterId: careerTeam.id } });
assert.equal(c.careerMode, true);
c = lockSchedule(c);
const board = [...c.recruits].sort((a, b) => b.stars - a.stars);
let rec = scoutRecruit(c, board[0]!.id);
c = rec.state;
rec = offerRecruit(c, board[0]!.id);
c = rec.state;
rec = visitRecruit(c, board[0]!.id);
c = rec.state;
if (c.recruitingHours < 0) note("hours went negative");
c = tick(c);
c = simGame(c);
c = runTo(c, (x) => x.phase === "offseason", 120);
if (c.phase !== "offseason") note(`career stuck ${c.phase}`);
checkRosterNation(c, "career");
console.log("CAREER", TEAM_BY_ID[careerTeam.id]?.name, seasonLine(c));
c = startNextSeason(c);
c = lockSchedule(c);
c = runTo(c, (x) => x.phase === "offseason", 120);
console.log("CAREER Y2", seasonLine(c));

console.log("— soak 3: 1980s era one season —");
let e = newDynasty("indiana", 1980, { careerMode: false, eraDecade: 1980 });
if (e.nilCap !== 0) note(`1980s NIL cap ${e.nilCap}`);
e = lockSchedule(e);
e = runTo(e, (x) => x.phase === "offseason", 120);
if (e.phase !== "offseason") note(`era stuck ${e.phase}`);
console.log("ERA 1980", seasonLine(e));

console.log("— soak 4: names pack mid-dynasty —");
const pack = parseNameText("id,name,mascot,abbr\nkentucky,Kentucky,Wildcats,UK\nduke,Duke,Blue Devils,DUKE\n");
if (pack.ok) applyNamePack(pack.pack);
if (TEAM_BY_ID.kentucky?.name !== "Kentucky") note("names pack did not apply");
resetNames();

if (s.history.titles > 5) note(`too many titles in 5 years: ${s.history.titles}`);
const champs = new Set(
  [s, c, e].map((x) => x.selection?.champ).filter(Boolean),
);
console.log("CHAMPS", [...champs].join(", "));
console.log("LINES", lines.join(" || "));
console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("SOAK OK");
}
