import {
  addNonCon, beginLiveGame, joinMte, lockSchedule, newDynasty, offerRecruit, pepTalk,
  runLivePossession, runLiveRest, scoutRecruit, setAssistedRecruit, signExtension, simWeek,
  startNextSeason, takeContractJob, visitRecruit, yourGames,
} from "../src/game/engine";
import { TEAM_BY_ID, TEAMS, careerEligible } from "../src/game/teams";
import { kenpom, netRanks } from "../src/game/ranks";
import { teamChemistry } from "../src/game/chemistry";
import { ncaaEligible } from "../src/game/compliance";
import { hofScore, playthroughId } from "../src/game/hof";
import { hydrateState } from "../src/game/develop";
import { packedSize } from "../src/game/persist";
import { MAX_GAMES } from "../src/game/types";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(msg: string) {
  issues.push(msg);
  console.log("ISSUE", msg);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

function resolveBoard(s: GameState): GameState {
  const r = s.contractReview;
  if (!r || r.resolved) return s;
  if (r.decision === "extend") {
    const x = signExtension(s);
    if (x.ok) return x.state;
  }
  if (r.decision === "fire") {
    const job = r.jobs[0];
    if (job) {
      const t = takeContractJob(s, job.teamId);
      if (t.ok) return t.state;
    }
    note(`fire with no job ${s.season} ${s.playerTeamId}`);
    return { ...s, contractReview: { ...r, resolved: true } };
  }
  return s;
}

function runYear(s: GameState, tag: string): GameState {
  s = setAssistedRecruit(s, true).state;
  if (s.phase === "preseason") s = lockSchedule(s);
  const scheduled = yourGames(s).filter((g) => !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte")).length;
  if (scheduled !== MAX_GAMES) note(`${tag}: schedule ${scheduled}`);
  let g = 0;
  while (s.phase !== "offseason" && g++ < 90) s = tick(s);
  if (s.phase !== "offseason") note(`${tag}: stuck ${s.phase} w${s.week}`);
  const ncaa = s.selection?.ncaa ?? [];
  if (ncaa.length && ncaa.length !== 68) note(`${tag}: field ${ncaa.length}`);
  if (!s.selection?.champ) note(`${tag}: no champ`);
  const youRec = s.teams[s.playerTeamId];
  if (youRec && youRec.wins + youRec.losses < 18) note(`${tag}: only ${youRec.wins}-${youRec.losses} games`);
  const ids = new Set<string>();
  for (const p of s.players) {
    if (ids.has(p.id)) note(`${tag}: dup player ${p.id}`);
    ids.add(p.id);
    if (!Number.isFinite(p.ovr) || p.ovr < 40 || p.ovr > 99) note(`${tag}: ovr ${p.ovr}`);
    if (!p.first?.trim() || !p.last?.trim()) note(`${tag}: blank name ${p.id}`);
    if (p.year < 1 || p.year > 4) note(`${tag}: year ${p.year} ${p.id}`);
  }
  const by = new Map<string, number>();
  for (const p of s.players) by.set(p.teamId, (by.get(p.teamId) ?? 0) + 1);
  if (tag.endsWith("1") || tag.endsWith("0") || tag === "career-y1" || tag === "era-1960") {
    for (const t of TEAMS) {
      const n = by.get(t.id) ?? 0;
      if (n < 8 || n > 15) note(`${tag}: ${t.id} roster ${n}`);
    }
    const kp = kenpom(s);
    if (kp.length !== TEAMS.length) note(`${tag}: kenpom ${kp.length}`);
    if (netRanks(s).length !== TEAMS.length) note(`${tag}: net ${netRanks(s).length}`);
  }
  const you = s.players.filter((p) => p.teamId === s.playerTeamId);
  if (you.length < 8 || you.length > 15) note(`${tag}: your roster ${you.length}`);
  for (const r of s.results) {
    if (r.homeScore === r.awayScore) note(`${tag}: tie`);
    if (r.homeScore < 15 || r.awayScore < 15 || r.homeScore > 170 || r.awayScore > 170) {
      note(`${tag}: score ${r.homeScore}-${r.awayScore}`);
    }
    if (!Number.isFinite(r.homeScore) || !Number.isFinite(r.awayScore)) note(`${tag}: nan score`);
  }
  const chem = teamChemistry(s, s.playerTeamId);
  if (!Number.isFinite(chem.score)) note(`${tag}: chem nan`);
  if (s.identity.age > 82) note(`${tag}: age ${s.identity.age}`);
  if (s.compliance && !Number.isFinite(s.compliance.apr)) note(`${tag}: apr nan`);
  if (s.contract && s.contract.remaining < 0) note(`${tag}: remaining ${s.contract.remaining}`);
  return s;
}

function line(s: GameState) {
  const t = s.teams[s.playerTeamId]!;
  const school = TEAM_BY_ID[s.playerTeamId]?.name ?? s.playerTeamId;
  return `${s.season} ${school} ${t.wins}-${t.losses} titles ${s.history.titles} bids ${s.history.ncaaBids} age ${s.identity.age} apr ${s.compliance?.apr ?? "-"}`;
}

const YEARS = Number(process.env.YEARS ?? 100);

console.log("— LIVE —");
let liveS = newDynasty("gonzaga", 3, { careerMode: false, identity: { first: "Live", last: "Call", age: 40, almaMaterId: "gonzaga" } });
const mte = joinMte(liveS, "maui");
liveS = mte.state;
liveS = addNonCon(liveS, "duke", 4, "home").state;
if (liveS.phase === "preseason") liveS = lockSchedule(liveS);
let live = beginLiveGame(liveS);
if (!live?.liveGame) note("live game did not start");
else {
  live = runLivePossession(live);
  live = runLivePossession(live);
  if (!live.liveGame?.log.length) note("live log empty");
  liveS = runLiveRest(live);
  if (liveS.liveGame && !liveS.liveGame.done) note("live rest unfinished");
}
const board = [...liveS.recruits].sort((a, b) => b.stars - a.stars);
liveS = scoutRecruit(liveS, board[0]!.id).state;
liveS = offerRecruit(liveS, board[0]!.id).state;
liveS = visitRecruit(liveS, board[0]!.id).state;
const pep = liveS.players.find((p) => p.teamId === liveS.playerTeamId)!;
liveS = pepTalk(liveS, pep.id).state;
console.log("LIVE", liveS.liveGame?.done ? "done" : liveS.liveGame ? "open" : "closed", "hours", liveS.recruitingHours, ncaaEligible(liveS) ? "eligible" : "banned");

console.log("— CAREER 1 —");
const job = TEAMS.filter(careerEligible).sort((a, b) => a.prestige - b.prestige)[2]!;
let c = newDynasty(job.id, 21, { careerMode: true, identity: { first: "Pat", last: "Lane", age: 32, almaMaterId: job.id } });
c = runYear(c, "career-y1");
console.log("CAREER", line(c));

console.log("— ERA 1960 —");
let e = newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "Era", last: "Wood", age: 44, almaMaterId: "ucla" } });
if (e.season !== 1960) note(`era season ${e.season}`);
if (e.nilCap !== 0) note(`era NIL ${e.nilCap}`);
e = runYear(e, "era-1960");
console.log("ERA", line(e));

console.log(`— CENTURY ${YEARS} —`);
const t0 = Date.now();
let s = newDynasty("kentucky", 100, { careerMode: false, identity: { first: "Century", last: "Coach", age: 38, almaMaterId: "kentucky" } });
const champs = new Set<string>();
let fires = 0;
let extendsN = 0;
for (let y = 1; y <= YEARS; y++) {
  if (y > 1) {
    const d = s.contractReview?.decision;
    if (d === "fire") fires++;
    if (d === "extend") extendsN++;
    s = resolveBoard(s);
    try {
      s = startNextSeason(s);
    } catch (err) {
      note(`y${y}: next THROW ${err instanceof Error ? err.stack ?? err.message : err}`);
      break;
    }
    if (s.phase === "offseason") note(`y${y}: still offseason after next`);
  }
  try {
    s = runYear(s, `y${y}`);
  } catch (err) {
    note(`y${y}: THROW ${err instanceof Error ? err.stack ?? err.message : err}`);
    console.log(`Y${y} THREW`, s.phase, s.week);
    break;
  }
  if (s.selection?.champ) champs.add(s.selection.champ);
  if (y === 1 || y % 5 === 0 || y === YEARS) {
    try {
      const hyd = hydrateState(JSON.parse(JSON.stringify(s)));
      if (hyd.players.length !== s.players.length) note(`y${y}: hydrate players ${hyd.players.length}`);
      const kb = packedSize(s) / 1024;
      if (kb > 3500) note(`y${y}: packed ${kb.toFixed(0)}kb`);
      console.log(`Y${y}`, line(s), "chem", teamChemistry(s, s.playerTeamId).score, `packed ${kb.toFixed(0)}kb`, `s ${((Date.now() - t0) / 1000).toFixed(1)}`);
    } catch (err) {
      note(`y${y}: hydrate ${err instanceof Error ? err.message : err}`);
      console.log(`Y${y}`, line(s), "chem", teamChemistry(s, s.playerTeamId).score, `s ${((Date.now() - t0) / 1000).toFixed(1)}`);
    }
  } else {
    console.log(`Y${y}`, line(s), `s ${((Date.now() - t0) / 1000).toFixed(1)}`);
  }
}
if (s.history.log.length !== YEARS) note(`log ${s.history.log.length}`);
if (s.identity.age > 82) note(`end age ${s.identity.age}`);
if (YEARS >= 20 && champs.size < 5) note(`only ${champs.size} unique champs in ${YEARS} years`);
if (s.history.titles > Math.max(12, YEARS * 0.45)) note(`too many titles ${s.history.titles}`);
const fake = {
  id: playthroughId(s),
  coach: "Century Coach",
  teamId: s.playerTeamId,
  teamName: TEAM_BY_ID[s.playerTeamId]?.name ?? "",
  seasons: s.history.log.length,
  wins: s.history.wins,
  losses: s.history.losses,
  titles: s.history.titles,
  ncaaBids: s.history.ncaaBids,
  confTitles: s.history.confTitles,
  careerMode: false,
  eraDecade: null as number | null,
  lastSeason: s.season,
  highlight: "",
  updatedAt: 0,
};
console.log("CENTURY", line(s), "unique champs", champs.size, "fires", fires, "extends", extendsN, "hof", hofScore(fake), `${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("CENTURY OK");
}
