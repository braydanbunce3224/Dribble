import assert from "node:assert/strict";
import { beginLiveGame, closeLive, lockSchedule, newDynasty, recapFor, runLiveRest, simGame } from "../src/game/engine";
import { simContest } from "../src/game/sim";
import { ftaCap, teamFtaCap } from "../src/game/engine-util";
import { mulberry32 } from "../src/game/rng";
import type { RecapPlayer } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function identPts(p: RecapPlayer) {
  return (p.fgm - (p.tpm ?? 0)) * 2 + (p.tpm ?? 0) * 3 + (p.ftm ?? 0);
}

function checkLines(tag: string, rows: RecapPlayer[], score: number, minutes: number) {
  const cap = ftaCap(minutes);
  const teamCap = teamFtaCap(minutes);
  const pts = rows.reduce((n, p) => n + p.pts, 0);
  if (pts !== score) note(`${tag}: box ${pts} vs score ${score}`);
  const teamFta = rows.reduce((n, p) => n + (p.fta ?? 0), 0);
  if (teamFta > teamCap) note(`${tag}: team FTA ${teamFta}`);
  if (teamFta < 4) note(`${tag}: team FTA too low ${teamFta}`);
  const mins = rows.reduce((n, p) => n + p.min, 0);
  if (Math.abs(mins - minutes * 5) > 8) note(`${tag}: minutes ${mins} vs ${minutes * 5}`);
  const fga = rows.reduce((n, p) => n + p.fga, 0);
  const fgm = rows.reduce((n, p) => n + p.fgm, 0);
  const pct = fga ? fgm / fga : 0;
  if (pct < 0.28 || pct > 0.68) note(`${tag}: FG% ${(pct * 100).toFixed(1)}`);
  for (const p of rows) {
    if (p.fgm > p.fga) note(`${tag}: ${p.name} FG ${p.fgm}-${p.fga}`);
    if ((p.tpm ?? 0) > (p.tpa ?? 0)) note(`${tag}: ${p.name} 3PT`);
    if ((p.ftm ?? 0) > (p.fta ?? 0)) note(`${tag}: ${p.name} FT makes`);
    if ((p.fta ?? 0) > cap) note(`${tag}: ${p.name} FTA ${p.fta} cap ${cap}`);
    if (p.pts > 48) note(`${tag}: ${p.name} ${p.pts} pts`);
    if (p.fga > 30) note(`${tag}: ${p.name} FGA ${p.fga}`);
    if (p.min > minutes - 1) note(`${tag}: ${p.name} ${p.min} min`);
    const id = identPts(p);
    if (Math.abs(id - p.pts) > 1) note(`${tag}: ${p.name} pts ${p.pts} vs shots ${id}`);
  }
}

console.log("— SIM CONTEST SOAK —");
let maxPlayerFta = 0;
let maxTeamFta = 0;
let maxPts = 0;
const scores: number[] = [];
for (let i = 0; i < 48; i++) {
  const seed = 100 + i * 17;
  const team = i % 3 === 0 ? "kentucky" : i % 3 === 1 ? "gonzaga" : "duke";
  const s = lockSchedule(newDynasty(team, seed, { careerMode: false, identity: { first: "Box", last: "Soak", age: 40, almaMaterId: team } }));
  const slot = s.schedule.find((g) => g.homeId === team || g.awayId === team)!;
  const home = slot.homeId;
  const away = slot.awayId;
  const game = simContest(s, home, away, mulberry32(seed ^ 0x51), { site: slot.site });
  scores.push(game.homeScore, game.awayScore);
  checkLines(`sim ${i} H`, game.homeLines, game.homeScore, game.minutes);
  checkLines(`sim ${i} A`, game.awayLines, game.awayScore, game.minutes);
  if (game.homeScore === game.awayScore) note(`sim ${i} tie ${game.homeScore}`);
  if (game.homeScore < 48 || game.awayScore < 48 || game.homeScore > 108 || game.awayScore > 108) {
    note(`sim ${i} score ${game.homeScore}-${game.awayScore}`);
  }
  for (const p of [...game.homeLines, ...game.awayLines]) {
    maxPlayerFta = Math.max(maxPlayerFta, p.fta ?? 0);
    maxPts = Math.max(maxPts, p.pts);
  }
  maxTeamFta = Math.max(
    maxTeamFta,
    game.homeLines.reduce((n, p) => n + (p.fta ?? 0), 0),
    game.awayLines.reduce((n, p) => n + (p.fta ?? 0), 0),
  );
}
const mean = scores.reduce((n, x) => n + x, 0) / scores.length;
console.log("SIM soak mean", mean.toFixed(1), "maxFTA", maxPlayerFta, "maxTeamFTA", maxTeamFta, "maxPts", maxPts);

console.log("— ENGINE SIM GAME —");
let eg = lockSchedule(newDynasty("kansas", 44, { careerMode: false, identity: { first: "Pat", last: "Lane", age: 41, almaMaterId: "kansas" } }));
for (let i = 0; i < 10; i++) {
  eg = { ...simGame(eg), pendingPresser: null };
  const r = eg.results.filter((x) => x.homeId === "kansas" || x.awayId === "kansas").at(-1);
  if (!r) {
    note(`engine ${i}: no result`);
    continue;
  }
  const rec = recapFor(eg, r);
  checkLines(`eng ${i} H`, rec.homeLeaders, r.homeScore, r.minutes ?? 40);
  checkLines(`eng ${i} A`, rec.awayLeaders, r.awayScore, r.minutes ?? 40);
}

console.log("— LIVE REST —");
let liveMaxFta = 0;
let liveMaxTeam = 0;
for (let i = 0; i < 12; i++) {
  const team = i % 2 === 0 ? "ucla" : "arizona";
  let s = lockSchedule(newDynasty(team, 200 + i * 13, { careerMode: false, identity: { first: "Live", last: "Box", age: 39, almaMaterId: team } }));
  const started = beginLiveGame(s);
  assert.ok(started?.liveGame, `live ${i} start`);
  s = runLiveRest(started!);
  assert.ok(s.liveGame?.done, `live ${i} not done`);
  const lg = s.liveGame!;
  for (const p of [...(lg.homeLines ?? []), ...(lg.awayLines ?? [])]) {
    liveMaxFta = Math.max(liveMaxFta, p.fta ?? 0);
    if ((p.fta ?? 0) > 16) note(`live lines ${i} ${p.name} FTA ${p.fta}`);
  }
  liveMaxTeam = Math.max(
    liveMaxTeam,
    (lg.homeLines ?? []).reduce((n, p) => n + (p.fta ?? 0), 0),
    (lg.awayLines ?? []).reduce((n, p) => n + (p.fta ?? 0), 0),
  );
  s = closeLive(s);
  const last = s.results.at(-1)!;
  const rec = recapFor(s, last);
  checkLines(`live ${i} H`, rec.homeLeaders, last.homeScore, last.minutes ?? 40);
  checkLines(`live ${i} A`, rec.awayLeaders, last.awayScore, last.minutes ?? 40);
}
console.log("LIVE maxFTA", liveMaxFta, "maxTeamFTA", liveMaxTeam);

console.log("— FOUL SPAM —");
let foul = lockSchedule(newDynasty("kentucky", 7, { careerMode: false, identity: { first: "Hack", last: "AShaq", age: 44, almaMaterId: "kentucky" } }));
foul = beginLiveGame(foul)!;
foul = { ...foul, liveGame: { ...foul.liveGame!, planned: true, defCall: "foul" } };
foul = runLiveRest(foul);
foul = foul.liveGame?.done ? closeLive(foul) : foul;
const hacked = foul.results.at(-1);
if (hacked) {
  const rec = recapFor(foul, hacked);
  const mx = Math.max(...[...rec.homeLeaders, ...rec.awayLeaders].map((p) => p.fta ?? 0));
  const teamMx = Math.max(
    rec.homeLeaders.reduce((n, p) => n + (p.fta ?? 0), 0),
    rec.awayLeaders.reduce((n, p) => n + (p.fta ?? 0), 0),
  );
  console.log("FOUL-SPAM max player FTA", mx, "team", teamMx, "score", `${hacked.homeScore}-${hacked.awayScore}`);
  if (mx > 16) note(`foul-spam player FTA ${mx}`);
  if (teamMx > 36) note(`foul-spam team FTA ${teamMx}`);
  checkLines("foul H", rec.homeLeaders, hacked.homeScore, hacked.minutes ?? 40);
  checkLines("foul A", rec.awayLeaders, hacked.awayScore, hacked.minutes ?? 40);
} else {
  note("foul-spam produced no result");
}

console.log("— ERA 1960 / 1987 / 2026 —");
for (const [year, decade] of [[1960, 1960], [1987, 1980], [2026, null]] as const) {
  let s = lockSchedule(newDynasty("ucla", year, { careerMode: false, eraDecade: decade, identity: { first: "Era", last: "Box", age: 50, almaMaterId: "ucla" } }));
  s = { ...simGame(s), pendingPresser: null };
  const r = s.results.find((x) => x.homeId === "ucla" || x.awayId === "ucla");
  if (!r) {
    note(`era ${year}: no game`);
    continue;
  }
  const rec = recapFor(s, r);
  checkLines(`era${year} H`, rec.homeLeaders, r.homeScore, r.minutes ?? 40);
  checkLines(`era${year} A`, rec.awayLeaders, r.awayScore, r.minutes ?? 40);
  const threes = rec.homeLeaders.reduce((n, p) => n + (p.tpa ?? 0), 0);
  if (year === 1960 && threes > 4) note(`era 1960 3PA ${threes}`);
  if (year === 2026 && threes < 8) note(`era 2026 3PA ${threes}`);
  console.log("ERA", year, `${r.homeScore}-${r.awayScore}`, "3PA", threes);
}

console.log("MAX player FTA", Math.max(maxPlayerFta, liveMaxFta), "team", Math.max(maxTeamFta, liveMaxTeam));
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("BOX CHECK OK");
}
