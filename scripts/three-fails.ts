import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simWeek, simGame, beginLiveGame, runLiveRest, closeLive, recapFor, startNextSeason, goOffseason } from "../src/game/engine.ts";
import { simContest } from "../src/game/sim.ts";
import { reconcileFinal, topUp, boxFaults } from "../src/game/scoreFloor.ts";
import { playedLines, boxTotals } from "../src/game/box.ts";
import { mulberry32 } from "../src/game/rng.ts";
import { saveText, readSaveText } from "../src/game/persist.ts";
import type { RecapPlayer } from "../src/game/types.ts";

function sum(rows: { pts: number }[]) {
  return rows.reduce((n, p) => n + p.pts, 0);
}

function line(partial: Partial<RecapPlayer> & { id: string; name: string }): RecapPlayer {
  return {
    pos: "SG",
    min: 28,
    pts: 0,
    reb: 2,
    ast: 1,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    ...partial,
  };
}

const hard = (rows: RecapPlayer[]) => boxFaults(rows).filter((f) => !f.startsWith("ast ") && !f.includes("chart"));

function checkSide(score: number, rows: RecapPlayer[], tag: string) {
  const shown = playedLines(rows);
  assert.equal(sum(rows), score, `${tag} header ${score} vs lines ${sum(rows)}`);
  assert.equal(boxTotals(shown).pts, score, `${tag} TEAM row`);
  assert.equal(hard(rows).length, 0, `${tag} ${hard(rows).join(" | ")}`);
  for (const p of rows) {
    assert.ok(p.pts < 70, `${tag} ${p.name} ${p.pts}`);
    assert.ok(!(p.pts >= 60 && (p.reb || 0) === 0 && (p.ast || 0) === 0), `${tag} ${p.name} ${p.pts}/0/0`);
    assert.ok(p.fgm <= rows.reduce((n, x) => n + x.fgm, 0));
    assert.ok(p.pts <= score);
  }
}

const dynasty = lockSchedule(newDynasty("gonzaga", 30, { careerMode: false }));
const rng = mulberry32(30);
let games = 0;
let ot = 0;
const opp0 = dynasty.schedule.find((g) => g.homeId === "gonzaga" || g.awayId === "gonzaga")!;
const other0 = opp0.homeId === "gonzaga" ? opp0.awayId : opp0.homeId;
for (let i = 0; i < 250 && (games < 8 || ot < 2); i++) {
  const game = simContest(dynasty, "gonzaga", other0, mulberry32(30 + i * 17), { site: i % 2 ? "home" : "away" });
  checkSide(game.homeScore, game.homeLines, `sim ${i} home`);
  checkSide(game.awayScore, game.awayLines, `sim ${i} away`);
  games++;
  if (game.minutes > 40) ot++;
}
assert.ok(games >= 8, `games ${games}`);
assert.ok(ot >= 2, `ot ${ot}`);

const short: RecapPlayer[] = [
  line({ id: "a", name: "Star", pts: 40, fgm: 16, fga: 28, tpm: 4, tpa: 10, ftm: 4, fta: 5, reb: 3, ast: 2, min: 34 }),
  line({ id: "b", name: "Two", pts: 12, fgm: 5, fga: 11, min: 30, reb: 4, ast: 1 }),
  line({ id: "c", name: "Three", pts: 8, fgm: 3, fga: 7, min: 22, reb: 2, ast: 2 }),
  line({ id: "d", name: "Four", pts: 4, fgm: 2, fga: 4, min: 16, reb: 1, ast: 1 }),
  line({ id: "e", name: "Bench", pts: 0, fgm: 0, fga: 1, min: 8, reb: 1, ast: 0 }),
];
assert.equal(sum(short), 64);
const fixed = reconcileFinal(short.map((p) => ({ ...p })), short.map((p) => ({ ...p, id: `x${p.id}` })), 68, 70);
assert.equal(fixed.homeScore, 68);
assert.equal(fixed.awayScore, 70);
assert.equal(sum(short) === 64, true);

const homeGap = short.map((p) => ({ ...p }));
const awayGap = short.map((p) => ({ ...p, id: `y${p.id}`, name: p.name + " A" }));
const synced = reconcileFinal(homeGap, awayGap, 68, 70);
assert.equal(synced.homeScore, sum(homeGap));
assert.equal(synced.awayScore, sum(awayGap));
assert.equal(synced.homeScore, 68);
assert.equal(synced.awayScore, 70);
checkSide(synced.homeScore, homeGap, "gap home");
checkSide(synced.awayScore, awayGap, "gap away");

const monster = [
  line({ id: "m", name: "Monster", pos: "SG", pts: 73, fgm: 28, fga: 40, tpm: 5, tpa: 12, ftm: 12, fta: 14, reb: 0, ast: 0, min: 40 }),
  line({ id: "n", name: "Other", pts: 0, fgm: 0, fga: 2, min: 20, reb: 4, ast: 0 }),
];
topUp(monster, 73);
assert.equal(sum(monster), 73);
assert.ok(monster.every((p) => p.pts < 70), monster.map((p) => p.pts).join(","));
assert.equal(hard(monster).length, 0, hard(monster).join(" | "));

const blank = [
  line({ id: "z", name: "Blank", pts: 71, fgm: 25, fga: 36, tpm: 7, tpa: 14, ftm: 14, fta: 16, reb: 0, ast: 0, min: 38 }),
  line({ id: "y", name: "Mate", pts: 8, fgm: 4, fga: 8, min: 24, reb: 3, ast: 2 }),
];
topUp(blank, 79);
assert.equal(sum(blank), 79);
assert.ok(!blank.some((p) => p.pts >= 60 && (p.reb || 0) === 0 && (p.ast || 0) === 0));
assert.ok(blank.every((p) => p.pts < 70));

let live = beginLiveGame(lockSchedule(newDynasty("duke", 8, { careerMode: false })))!;
live = runLiveRest(live);
assert.ok(live.liveGame?.done);
const liveLinesH = playedLines(live.liveGame!.homeLines);
const liveLinesA = playedLines(live.liveGame!.awayLines);
assert.equal(boxTotals(liveLinesH).pts, live.liveGame!.homeScore);
assert.equal(boxTotals(liveLinesA).pts, live.liveGame!.awayScore);
if ((live.liveGame!.half ?? 2) > 2) ot++;
live = closeLive(live);
const last = live.results[live.results.length - 1]!;
const recap = recapFor(live, last);
assert.equal(sum(recap.homeLeaders), last.homeScore);
assert.equal(sum(recap.awayLeaders), last.awayScore);
assert.equal(boxTotals(playedLines(recap.homeLeaders)).pts, last.homeScore);
checkSide(last.homeScore, recap.homeLeaders, "live recap home");
checkSide(last.awayScore, recap.awayLeaders, "live recap away");

let season = lockSchedule(newDynasty("utah-state", 12, { careerMode: false }));
assert.equal(season.history.log.length, 0);
let guard = 0;
while (season.phase !== "selection" && season.phase !== "offseason" && guard++ < 48) {
  season = simWeek(season);
}
assert.equal(season.phase, "selection", `phase ${season.phase} week ${season.week}`);
assert.ok(season.history.log.length >= 1, "archive empty at Selection Sunday");
const row = season.history.log.find((r) => r.season === season.season)!;
const you = season.teams[season.playerTeamId]!;
assert.equal(row.wins, you.wins);
assert.equal(row.losses, you.losses);
assert.equal(row.confW, you.confW);
assert.equal(row.confL, you.confL);
assert.ok(row.summary && row.summary.includes(`${you.wins}-${you.losses}`));
assert.ok((row.boxes?.length ?? 0) >= 1);
assert.ok((row.standings?.length ?? 0) >= 1);
const reloaded = readSaveText(saveText(season));
assert.equal(reloaded.history.log.length, season.history.log.length);
assert.equal(reloaded.history.log[0]!.wins, row.wins);

let second = season;
let g2 = 0;
while (second.phase !== "offseason" && g2++ < 40) second = simWeek(second);
assert.equal(second.phase, "offseason");
second = startNextSeason(second.phase === "offseason" ? second : goOffseason(second));
assert.ok(second.history.log.length >= 1);
guard = 0;
while (second.phase !== "selection" && second.phase !== "offseason" && guard++ < 48) second = simWeek(second);
assert.equal(second.phase, "selection");
const years = new Set(second.history.log.map((r) => r.season));
assert.ok(years.size >= 2, `seasons ${[...years].join(",")}`);
const again = readSaveText(saveText(second));
assert.ok(again.history.log.length >= 2);

console.log(`ok games=${games} ot=${ot} record=${row.wins}-${row.losses} conf=${row.confW}-${row.confL} years=${[...years].join(",")}`);
void rng;
void simGame;
void goOffseason;
