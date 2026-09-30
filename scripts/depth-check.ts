import assert from "node:assert/strict";
import {
  draftBand, draftScore, holdAccountable, lockCamp, lockSchedule,
  newDynasty, pepTalk, portalHoursBudget, rollAwards,
  signRecruit, patchSettings, forceCommit, realign, goatScore, goatLine,
  mockBoard, winProb, searchPeople, awardRace, settingsOf, gameOfDay,
  signChance, dropTarget, pitchNil, fogTape, traitOf, seriesVs, heatMark, runLabel, isTargeted, simWeek,
} from "../src/game/engine";
import { crowdFill, lockGamePlan, setPlanSlot, startLiveGame } from "../src/game/plays";
import { openCamp } from "../src/game/camp";
import { makeReportCard } from "../src/game/card";
import { PRO_TEAMS, tickDonors, tickFlips } from "../src/game/depth";
import { SAVE_VERSION } from "../src/game/types";
import { mulberry32 } from "../src/game/rng";
import { hydrateState } from "../src/game/develop";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

let s = lockSchedule(newDynasty("kentucky", 77, { careerMode: false, identity: { first: "Depth", last: "Check", age: 40, almaMaterId: "kentucky" } }));
const star = s.players.filter((p) => p.teamId === s.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0]!;
const high = { ...star, ovr: 88, potential: 94, mpg: 32, seasonMinutes: 900, seasonGames: 28, usage: 28, growth: [{ season: s.season, ovr: 88, focus: "shoot" as const, jump: 3 }] };
if (draftBand(high) !== "lottery") note(`star band ${draftBand(high)} score ${draftScore(high)}`);
const jumper = { ...star, ovr: 82, potential: 91, mpg: 30, seasonMinutes: 850, seasonGames: 28, usage: 26, year: 2, growth: [{ season: s.season, ovr: 82, focus: "shoot" as const, jump: 4 }] };
if (draftBand(jumper) === "second") note(`developed 82 should not be second (score ${draftScore(jumper)})`);
console.log("DRAFT", "star", draftBand(high), draftScore(high).toFixed(1), "jump", draftBand(jumper), draftScore(jumper).toFixed(1));

const bench = s.players.filter((p) => p.teamId === s.playerTeamId).sort((a, b) => a.ovr - b.ovr)[0]!;
let t = pepTalk(s, star.id);
if (t.state.talksThisWeek !== 1) note("pep did not count a talk");
t = pepTalk(t.state, star.id);
t = pepTalk(t.state, star.id);
const blocked = pepTalk(t.state, star.id);
if (blocked.state.talksThisWeek !== 3) note(`talk cap ${blocked.state.talksThisWeek}`);
if (!blocked.feedback.title.includes("Three")) note(`pep over cap: ${blocked.feedback.title}`);
const held = holdAccountable({ ...s, talksThisWeek: 0 }, bench.id);
if ((held.state.players.find((p) => p.id === bench.id)?.morale ?? 99) >= bench.morale) note("hold did not drop morale");
console.log("TALK", "cap", blocked.feedback.title, "hold", held.feedback.title);

const rebuild = { ...s, players: s.players.filter((p) => p.teamId !== s.playerTeamId).concat(s.players.filter((p) => p.teamId === s.playerTeamId).slice(0, 8)) };
const fat = portalHoursBudget(s, "winter");
const thin = portalHoursBudget(rebuild, "winter");
if (thin < fat) note(`rebuild hours ${thin} should beat full roster ${fat}`);
if (thin < 6) note(`winter hours ${thin}`);
console.log("PORTAL HOURS", "full", fat, "rebuild", thin);

s = startLiveGame(s)!;
if (!s.liveGame) note("no live game");
else {
  if (s.liveGame.planned) note("live started already planned");
  s = setPlanSlot(s, "off", 0, "post");
  s = lockGamePlan(s);
  if (!s.liveGame?.planned) note("lockGamePlan did not set planned");
  if (s.liveGame?.offCall !== "post") note(`offCall ${s.liveGame?.offCall}`);
  const crowd = crowdFill(s, s.liveGame!);
  if (crowd.home < 0.2 || crowd.home > 1) note(`crowd ${crowd.home}`);
  console.log("GAMEDAY", "planned", s.liveGame.planned, "off", s.liveGame.offCall, "crowd", crowd.home.toFixed(2), crowd.packed ? "packed" : "normal");
}

const camped = openCamp({ ...s, phase: "offseason", offseasonReport: { grew: [], graduated: [], incoming: [], walkons: [], pointsEarned: 2 } });
if (!camped.camp || camped.camp.locked) note("camp did not open");
const locked = lockCamp(camped);
if (!locked.camp?.locked) note("camp did not lock");
const awards = rollAwards(s);
if (awards.length && !awards.some((a) => a.kind === "poy")) note("awards missing POY");
const card = makeReportCard(locked);
if (!card.grades.length) note("empty report card");
console.log("CAMP/AWARDS", "points", camped.camp?.points, "jumps", locked.camp?.jumps.length, "grades", card.grades.length);

console.log("— HE DEPTH —");
if (SAVE_VERSION < 26) note(`SAVE_VERSION ${SAVE_VERSION}`);
if (PRO_TEAMS.length !== 30) note(`pro clubs ${PRO_TEAMS.length}`);
let d = { ...s, liveGame: null, settings: s.settings ?? { difficulty: "realistic" as const, godMode: false, nilOn: true, flipsOn: true, teamColor: true, forceWin: false } };
if (!d.settings) note("no settings");
const intl = d.recruits.filter((r) => r.country && r.country !== "US");
const freaks = d.recruits.filter((r) => r.freak);
const tall = d.recruits.filter((r) => r.height);
if (intl.length < 8) note(`intl class ${intl.length}`);
if (freaks.length < 1) note(`freaks ${freaks.length}`);
if (tall.length < 100) note(`heights ${tall.length}`);
const mock = mockBoard(d);
if (mock.length < 10) note(`mock ${mock.length}`);
if (!mock[0]?.proName) note("mock missing pro name");
if (mock.some((p) => !p.teamId)) note("mock missing school");
const forced = forceCommit(d, d.recruits[0]!.id);
if (forced.ok) note("force without god");
d = patchSettings(d, { godMode: true, difficulty: "easy" });
if (!settingsOf(d).godMode) note("god patch");
const forced2 = forceCommit(d, d.recruits[0]!.id);
if (!forced2.ok) note("force with god failed");
const pledge = d.recruits.filter((r) => !r.committedTo && r.stars >= 3)[3]!;
const heated = {
  ...d,
  recruits: d.recruits.map((r) => r.id === pledge.id ? { ...r, offers: [d.playerTeamId], interest: { [d.playerTeamId]: 92 } } : r),
};
const signed = signRecruit(heated, pledge.id);
if (signed.state.recruits.find((r) => r.id === pledge.id)?.committedTo !== d.playerTeamId) note("sign did not land");
if (!signed.state.flash) note("no commit flash");
const moved = realign({ ...d, phase: "preseason" }, "kentucky", "B10");
if (!moved.ok) note(`realign ${moved.detail}`);
const noGodMove = realign(patchSettings({ ...d, phase: "preseason" }, { godMode: false }), "kentucky", "B10");
if (noGodMove.ok) note("realign without god");
d = startLiveGame(d)!;
if (d.liveGame) {
  const p = winProb(d.liveGame, true);
  if (p < 1 || p > 99) note(`winProb ${p}`);
}
const g = goatScore(d);
if (!Number.isFinite(g)) note("goat");
if (!goatLine(d).trim()) note(`goatLine ${goatLine(d)}`);
const found = searchPeople(d, d.players[0]!.last.slice(0, 4));
if (!found.length) note("search empty");
const race = awardRace(d, 5);
if (!Array.isArray(race)) note("race");
const gotd = gameOfDay(d);
if (gotd && (gotd.homeId === d.playerTeamId || gotd.awayId === d.playerTeamId)) note("gotd is yours");
const rng = mulberry32(9);
const flipped = tickFlips(patchSettings(d, { flipsOn: true }), rng);
if (!flipped.recruits) note("flips");
const donors = tickDonors(patchSettings({ ...d, phase: "offseason", nilCap: 100 }, { nilOn: true }), rng);
if ((donors.donors ?? []).length < 1) note("no donors");
const offNil = tickDonors(patchSettings(d, { nilOn: false }), rng);
if ((offNil.nilAsks ?? []).length) note("nil asks when off");
const round = hydrateState(JSON.parse(JSON.stringify(d)) as typeof d);
if (!round.settings) note("hydrate dropped settings");
if (round.version && round.version < 0) note("hydrate version");
console.log("HE", "intl", intl.length, "freaks", freaks.length, "pro", PRO_TEAMS.length, "goat", g, "sign", signed.feedback.title);

console.log("— HE BEAT —");
const raw = d.recruits.find((r) => !r.scouted && !r.committedTo)!;
if (fogTape(raw).includes(`ovr ${raw.ovr}`)) note("fog leaked ovr");
const seen = fogTape({ ...raw, scouted: true });
if (!seen.includes(`ovr ${raw.ovr}`)) note(`fog after scout ${seen}`);
const chance = signChance({ ...raw, offers: [d.playerTeamId], interest: { [d.playerTeamId]: 80 } }, d);
if (chance < 5 || chance > 96) note(`signChance ${chance}`);
const dropped = dropTarget(d, raw.id);
if (!dropped.state.recruits.find((r) => r.id === raw.id)?.dropped) note("drop did not mark");
const droppedRow = dropped.state.recruits.find((r) => r.id === raw.id)!;
if (isTargeted(droppedRow, d.playerTeamId)) note("dropped still targeted");
const nilState = { ...d, nilCap: 40, settings: { ...settingsOf(d), nilOn: true } };
const pitched = pitchNil(nilState, raw.id);
if (pitched.state.nilCap !== 30) note(`nil pitch cap ${pitched.state.nilCap}`);
const starP = d.players.filter((p) => p.teamId === d.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0]!;
const trait = traitOf(starP);
if (trait && typeof trait !== "string") note("trait");
if (!d.watch || d.watch.length < 5) note(`watch ${d.watch?.length ?? 0}`);
if (runLabel("f4") !== "Final Four") note(`runLabel ${runLabel("f4")}`);
const vsEmpty = seriesVs(d, d.playerTeamId, "duke");
const withSeries = {
  ...d,
  teams: {
    ...d.teams,
    [d.playerTeamId]: {
      ...d.teams[d.playerTeamId]!,
      series: { duke: { w: 8, l: 3, last: "74-70", lastWin: true, streak: 2 } },
    },
  },
};
const vs = seriesVs(withSeries, d.playerTeamId, "duke");
if (!vs || vs.aWins !== 8 || vs.last !== "74-70") note(`series ${JSON.stringify(vs)}`);
const arrow = heatMark({ ...raw, heatWas: 40, interest: { [d.playerTeamId]: 70 } }, d.playerTeamId, d);
if (arrow !== "up") note(`heatMark ${arrow}`);
if (vsEmpty && vsEmpty.aWins + vsEmpty.bWins < 0) note("series empty");
let weeked = simWeek({ ...s, liveGame: null });
const played = weeked.results.filter((r) => r.homeId === weeked.playerTeamId || r.awayId === weeked.playerTeamId)[0];
if (played) {
  const oppId = played.homeId === weeked.playerTeamId ? played.awayId : played.homeId;
  const liveVs = seriesVs(weeked, weeked.playerTeamId, oppId);
  if (!liveVs || liveVs.aWins + liveVs.bWins < 1) note(`live series ${JSON.stringify(liveVs)}`);
}
const takes = weeked.news.filter((n) => n.kicker === "Takes");
if (!takes[0]?.names?.length) note("takes missing names");
console.log("BEAT", "fog", fogTape(raw), "chance", chance, "trait", trait, "watch", d.watch?.length, "series", vs?.aWins, "takes", takes[0]?.names?.[0]?.name);

if (issues.length) {
  console.log("ISSUES", issues.length);
  process.exit(1);
}
console.log("ISSUES 0");
assert.equal(issues.length, 0);

