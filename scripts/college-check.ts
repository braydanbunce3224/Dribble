import assert from "node:assert/strict";
import {
  availableRoster, classLabel, goOffseason, isOut, letGo, lockSchedule, nationalBoard, newDynasty, openDraft,
  setRedshirt, settleDraft, simWeek, startNextSeason, tickInjuries,
} from "../src/game/engine";
import { recruitsFor } from "../src/game/develop";
import { effectiveMpg } from "../src/game/college";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

const rec = recruitsFor(7, 2026);
const juco = rec.filter((r) => r.path === "juco");
const hs = rec.filter((r) => r.path !== "juco");
if (juco.length !== 28) note(`juco pool ${juco.length}`);
if (hs.length !== 228) note(`hs pool ${hs.length}`);
if (!juco.every((r) => r.stars >= 2 && r.stars <= 4)) note("juco stars out of range");
console.log("POOL", "hs", hs.length, "juco", juco.length);

let s = newDynasty("murray-state", 44, { careerMode: false, identity: { first: "College", last: "Check", age: 40, almaMaterId: "murray-state" } });
const j = s.recruits.find((r) => r.path === "juco" && r.stars >= 3)!;
if (!j) note("no juco on the board");
s = {
  ...s,
  recruits: s.recruits.map((r) => (r.id === j.id ? { ...r, committedTo: s.playerTeamId, offers: [s.playerTeamId] } : r)),
  phase: "offseason",
  offseasonReport: { grew: [], graduated: [], incoming: [], walkons: [], pointsEarned: 1 },
  draft: { season: s.season, rows: [], league: [], stayed: [], resolved: true },
};
s = startNextSeason(s);
const arrived = s.players.find((p) => p.last === j.last && p.first === j.first && p.teamId === s.playerTeamId);
if (!arrived) note(`juco ${j.first} ${j.last} did not enroll`);
else if (arrived.year !== 3) note(`juco year ${arrived.year}`);
else if (arrived.path !== "juco") note("juco path missing on roster");
else console.log("JUCO", classLabel(arrived), arrived.ovr);

const fr = s.players.find((p) => p.teamId === s.playerTeamId && p.year === 1 && !p.usedRedshirt);
if (!fr) note("no freshman to redshirt");
else {
  const tagged = setRedshirt(s, fr.id, true);
  s = tagged.state;
  const sat = s.players.find((p) => p.id === fr.id)!;
  if (!sat.redshirt || !isOut(sat) || effectiveMpg(sat) !== 0) note("redshirt did not sit");
  s = {
    ...s,
    phase: "offseason",
    offseasonReport: { grew: [], graduated: [], incoming: [], walkons: [], pointsEarned: 1 },
    draft: { season: s.season, rows: [], league: [], stayed: [], resolved: true },
  };
  s = startNextSeason(s);
  const back = s.players.find((p) => p.id === fr.id);
  if (!back) note("redshirt freshman left");
  else if (back.year !== 1) note(`redshirt advanced to year ${back.year}`);
  else if (!back.usedRedshirt) note("usedRedshirt missing");
  else console.log("RS", classLabel(back), back.year);
}

{
  let g = lockSchedule(newDynasty("kentucky", 77, { careerMode: false, identity: { first: "Red", last: "Shirt", age: 42, almaMaterId: "kentucky" } }));
  g = { ...simWeek(g), pendingPresser: null };
  const played = g.players.find((p) => p.teamId === "kentucky" && (p.seasonGames ?? 0) >= 1);
  if (!played) note("no kentucky player logged a game");
  else {
    const blocked = setRedshirt(g, played.id, true);
    if (blocked.state.players.find((p) => p.id === played.id)?.redshirt) note("redshirt allowed after first game");
    else console.log("RS LOCK", played.last, "games", played.seasonGames);
  }
  const top = nationalBoard(g, 100);
  if (top.length !== 100) note(`board 100 size ${top.length}`);
  const stars = top.map((r) => r.stars);
  if (stars.some((x, i) => i > 0 && x > stars[i - 1]!)) note("board 100 not sorted by stars");
  if (Math.min(...stars) < 3) note(`board 100 includes ${Math.min(...stars)}-star`);
  console.log("BOARD 100", "min stars", Math.min(...stars), "max ovr", Math.max(...top.map((r) => r.ovr)));
}

s = lockSchedule(newDynasty("kentucky", 91, { careerMode: false, identity: { first: "Hurt", last: "Check", age: 41, almaMaterId: "kentucky" } }));
const star = s.players.filter((p) => p.teamId === "kentucky").sort((a, b) => b.ovr - a.ovr)[0]!;
s = {
  ...s,
  players: s.players.map((p) => (p.id === star.id ? { ...p, injury: { part: "ankle", weeksLeft: 2 } } : p)),
};
if (availableRoster(s, "kentucky").some((p) => p.id === star.id)) note("injured star still in rotation");
if (effectiveMpg({ ...star, injury: { part: "ankle", weeksLeft: 2 } }) !== 0) note("injured mpg");
s = tickInjuries(s);
const w1 = s.players.find((p) => p.id === star.id)?.injury?.weeksLeft;
if (w1 !== 1) note(`tick 2→1 got ${w1}`);
s = tickInjuries(s);
if (s.players.find((p) => p.id === star.id)?.injury) note("injury did not clear");
else console.log("INJ", "cleared after 2 ticks");

s = newDynasty("duke", 12, { careerMode: false, identity: { first: "Draft", last: "Check", age: 39, almaMaterId: "duke" } });
const kid = s.players.filter((p) => p.teamId === "duke" && p.year < 4).sort((a, b) => b.ovr - a.ovr)[0]!;
s = {
  ...s,
  players: s.players.map((p) =>
    p.id === kid.id
      ? { ...p, ovr: 91, potential: 95, mpg: 34, year: 1, morale: 70, skills: { shoot: 91, finish: 91, defense: 90, iq: 92 } }
      : p,
  ),
};
s = goOffseason(s);
if (!s.draft) note("no draft board");
const row = s.draft?.rows.find((r) => r.playerId === kid.id);
if (!row) note("lottery freshman not on stay/go board");
else {
  console.log("DRAFT", row.name, row.band, "stay", row.stayChance);
  const gone = letGo(s, kid.id);
  s = gone.state;
  if (s.players.some((p) => p.id === kid.id)) note("declare did not remove player");
  if (!s.draft?.league.some((p) => p.playerId === kid.id && p.yours)) note("declare missing from league board");
  else console.log("GO", kid.first, "pick", s.draft.league.find((p) => p.playerId === kid.id)?.pick);
}

s = newDynasty("kansas", 22, { careerMode: false, identity: { first: "Stay", last: "Check", age: 40, almaMaterId: "kansas" } });
const stayKid = s.players.filter((p) => p.teamId === "kansas" && p.year < 4).sort((a, b) => b.ovr - a.ovr)[0]!;
s = {
  ...s,
  players: s.players.map((p) => (p.id === stayKid.id ? { ...p, ovr: 83, potential: 88, mpg: 30, year: 2, morale: 80 } : p)),
};
s = goOffseason(s);
s = settleDraft(s);
if (!s.draft?.resolved) note("settleDraft left board open");
console.log("SETTLE", "stayed", s.draft?.stayed.length, "league", s.draft?.league.length, "resolved", s.draft?.resolved);

s = lockSchedule(newDynasty("gonzaga", 5, { careerMode: false }));
let g = 0;
while (s.phase !== "offseason" && g++ < 90) s = { ...simWeek(s), pendingPresser: null };
if (s.phase !== "offseason") note(`year stuck ${s.phase}`);
s = settleDraft(s);
const you = s.players.filter((p) => p.teamId === s.playerTeamId);
if (you.length < 8 || you.length > 15) note(`offseason roster ${you.length}`);
const injured = you.filter((p) => p.injury && p.injury.weeksLeft > 0).length;
console.log("YEAR", s.teams[s.playerTeamId]?.wins, "-", s.teams[s.playerTeamId]?.losses, "roster", you.length, "hurt", injured, "draft rows", s.draft?.rows.length ?? 0);
s = startNextSeason(s);
if (s.players.filter((p) => p.teamId === s.playerTeamId).length !== 13) note(`next season roster ${s.players.filter((p) => p.teamId === s.playerTeamId).length}`);
if (s.recruits.filter((r) => r.path === "juco").length !== 28) note("next class missing juco");

if (issues.length) {
  console.log("ISSUES", issues.length);
  process.exit(1);
}
console.log("ISSUES", 0);
