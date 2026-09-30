import assert from "node:assert/strict";
import {
  addNonCon, answerNilAsk, answerPresser, beginLiveGame, canRedshirt, closeLive, dropGame,
  dropTarget, forceCommit, hangLine, joinMte, lockCamp, lockSchedule, makePromise, nationalBoard,
  newDynasty, offerPortal, offerRecruit, openDraft, patchSettings, pepTalk, pitchNil, playedThisSeason,
  portalEra, realign, recapFor, retireCoach, runLivePossession, runLiveRest, scoutPortal, scoutRecruit,
  searchPeople, setAssistedRecruit, setFocus, setPlayerMpg, setPlayerUsage, setRedshirt, signPortal,
  signRecruit, simGame, simWeek, spendCamp, spendCoachPoint, startNextSeason, talkStay, visitPortal,
  visitRecruit, weekCard, yourGames, hireStaff, staffOf, setPractice, scoutOpponent,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { packedSize, slimState } from "../src/game/persist";
import { TEAMS } from "../src/game/teams";
import { MAX_GAMES } from "../src/game/types";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

console.log("— new game + schedule —");
let s = newDynasty("gonzaga", 2026, {
  careerMode: false,
  identity: { first: "Pat", last: "Lane", age: 40, almaMaterId: "gonzaga" },
});
assert.equal(s.identity.first, "Pat");
assert.equal(s.players.filter((p) => p.teamId === "gonzaga").length, 13);
const joined = joinMte(s, "maui");
s = joined.state;
s = addNonCon(s, "duke", 5, "home").state;
s = lockSchedule(s);
const board = yourGames(s).filter((g) => !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte"));
if (board.length !== MAX_GAMES) note(`board ${board.length}`);
if (!board.some((g) => g.kind === "mte")) note("no MTE after join");
console.log("BOARD", board.length, "mte", board.filter((g) => g.kind === "mte").length);

console.log("— live call —");
let live = beginLiveGame(s);
assert.ok(live?.liveGame);
live = runLivePossession(live!);
if (!(live.liveGame?.log.length)) note("live log empty");
s = runLiveRest(live);
if (s.liveGame && !s.liveGame.done) note("live unfinished");
s = s.liveGame?.done ? closeLive(s) : s;
const last = s.results.find((r) => r.homeId === "gonzaga" || r.awayId === "gonzaga");
if (!last) note("no live result");
else {
  const rec = recapFor(s, last);
  if (!rec.headline) note("recap blank");
  const hs = rec.homeLeaders.reduce((n, p) => n + p.pts, 0);
  const as = rec.awayLeaders.reduce((n, p) => n + p.pts, 0);
  if (hs !== last.homeScore) note(`box home ${hs} vs ${last.homeScore}`);
  if (as !== last.awayScore) note(`box away ${as} vs ${last.awayScore}`);
}

console.log("— roster / redshirt / usage —");
const kid = s.players.find((p) => p.teamId === "gonzaga" && p.year === 1 && !playedThisSeason(s, p));
if (kid && canRedshirt(s, kid)) {
  s = setRedshirt(s, kid.id, true).state;
  if (!s.players.find((p) => p.id === kid.id)?.redshirt) note("redshirt did not stick");
  s = setRedshirt(s, kid.id, false).state;
}
const vet = s.players.find((p) => p.teamId === "gonzaga" && (p.seasonGames ?? 0) >= 1);
if (vet && canRedshirt(s, vet)) note("redshirt still open after he played");
const star = s.players.filter((p) => p.teamId === "gonzaga").sort((a, b) => b.ovr - a.ovr)[0]!;
s = setPlayerMpg(s, star.id, 32);
s = setPlayerUsage(s, star.id, 28);
s = pepTalk(s, star.id).state;
s = makePromise(s, star.id, "minutes").state;
s = spendCoachPoint(s, "offense").state;

console.log("— recruiting —");
s = { ...s, recruitingHours: 12 };
const top = nationalBoard(s, 100);
if (top.length !== 100) note(`board100 ${top.length}`);
if (top.some((r) => r.stars < 3)) note("board100 has sub-3");
const target = top.find((r) => !r.committedTo)!;
s = scoutRecruit(s, target.id).state;
s = offerRecruit(s, target.id).state;
s = visitRecruit(s, target.id).state;
s = pitchNil(s, target.id).state;
const signed = signRecruit(s, target.id);
s = signed.state;
s = dropTarget(s, top[3]!.id).state;
s = setAssistedRecruit(s, true).state;
const forced = forceCommit(patchSettings(s, { godMode: true }), top[4]!.id);
if (!forced.ok) note(`force ${forced.detail}`);
s = forced.state;
const found = searchPeople(s, target.last);
if (!found.length) note("search miss");

console.log("— odds / god / realign —");
const card = weekCard(s);
if (!card.length) note("odds empty");
const openSlot = s.schedule.find((g) => !g.resultId && !g.declined && (g.homeId === s.playerTeamId || g.awayId === s.playerTeamId));
if (openSlot) {
  const line = hangLine(s, openSlot);
  if (!Number.isFinite(line.homeSpread) || !Number.isFinite(line.total)) note(`spread ${line.homeSpread} total ${line.total}`);
}
s = patchSettings(s, { godMode: true, difficulty: "hard" });

console.log("— staff / practice / scout —");
if (!staffOf(s).oc) note("no OC");
const pool = staffOf(s).pool[0];
if (pool) {
  const h = hireStaff(s, pool.id);
  if (h.state.staff?.[pool.role]?.id !== pool.id) note("hire miss");
  s = h.state;
}
s = setPractice(s, "film").state;
s = { ...s, recruitingHours: 6 };
const sc = scoutOpponent(s);
s = sc.state;
if (searchPeople(s, "gonzaga").every((x) => x.kind !== "team")) note("search teams");

console.log("— play a season —");
let g = 0;
while (s.phase !== "offseason" && g++ < 90) s = tick(s);
if (s.phase !== "offseason") note(`stuck ${s.phase}`);
if (!s.selection?.champ) note("no champ");
if ((s.selection?.ncaa.length ?? 0) !== 68) note(`field ${s.selection?.ncaa.length}`);
console.log("SEASON", s.teams.gonzaga!.wins, "-", s.teams.gonzaga!.losses, "champ", s.selection?.champ);
const moved = realign(s, "gonzaga", "SEC");
if (!moved.ok) note(`realign ${moved.detail}`);
else s = moved.state;

console.log("— draft / camp / NIL / portal —");
s = openDraft(s);
if (s.draft?.rows[0]) {
  const stay = talkStay(s, s.draft.rows[0].playerId);
  s = stay.state;
}
s = setFocus(s, star.id, "shoot");
const camped = spendCamp(s, star.id, 2);
if (camped.ok) s = camped.state;
s = lockCamp(s);
if (s.nilAsks?.[0]) s = answerNilAsk(s, s.nilAsks[0].playerId, true);
if (portalEra(s) === "none") note("modern portal none");
const t = s.portal?.transfers[0];
if (t) {
  s = { ...s, portal: { ...s.portal!, hours: 12 } };
  s = scoutPortal(s, t.id).state;
  s = offerPortal(s, t.id).state;
  s = visitPortal(s, t.id).state;
  s = signPortal(s, t.id).state;
}

console.log("— next year + hydrate —");
s = startNextSeason(s);
if (s.phase !== "preseason") note(`y2 ${s.phase}`);
if (s.identity.age !== 41) note(`age ${s.identity.age}`);
const packed = packedSize(s);
const hyd = hydrateState(JSON.parse(JSON.stringify(slimState(s))));
if (hyd.players.length !== s.players.length) note(`hydrate players ${hyd.players.length}/${s.players.length}`);
if (hyd.identity.last !== "Lane") note("hydrate name");
console.log("PACKED", Math.round(packed / 1024), "kb", "hydrate", hyd.players.length);

console.log("— era + retire —");
let e = newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "J", last: "Wood", age: 44, almaMaterId: "ucla" } });
if (e.nilCap !== 0) note("1960 NIL");
if (portalEra(e) !== "none") note(`1960 portal ${portalEra(e)}`);
e = lockSchedule(e);
e = { ...simGame(e), pendingPresser: null };
const r60 = e.results.find((x) => x.homeId === "ucla" || x.awayId === "ucla");
if (r60) {
  const rec = recapFor(e, r60);
  const threes = rec.homeLeaders.reduce((n, p) => n + (p.tpm ?? 0), 0) + rec.awayLeaders.reduce((n, p) => n + (p.tpm ?? 0), 0);
  if (threes > 4) note(`1960 box threes ${threes}`);
}
const retired = retireCoach(s);
if (!retired.retired) note("retire flag");

if (TEAMS.length !== 365) note(`teams ${TEAMS.length}`);
console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("FEATURE BATTERY OK");
}
