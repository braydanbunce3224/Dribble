import assert from "node:assert/strict";
import {
  beginLiveGame, closeLive, lockSchedule, newDynasty, runLiveRest, simGame, simWeek, startNextSeason,
  yourGames,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { packedSize, slimState } from "../src/game/persist";
import { CONFERENCES, TEAMS } from "../src/game/teams";
import { MAX_PER_WEEK } from "../src/game/types";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

console.log("— conference home/away —");
{
  const s = newDynasty("kentucky", 44, { careerMode: false });
  const conf = s.schedule.filter((g) => g.kind === "conference");
  for (const t of TEAMS) {
    const g = conf.filter((x) => x.homeId === t.id || x.awayId === t.id);
    const home = g.filter((x) => x.homeId === t.id).length;
    const away = g.filter((x) => x.awayId === t.id).length;
    if (Math.abs(home - away) > 1) note(`${t.id} H/A ${home}-${away}`);
  }
  const locked = lockSchedule(s);
  for (const t of TEAMS) {
    for (let w = 1; w <= 18; w++) {
      const n = locked.schedule.filter((g) => !g.declined && g.week === w && (g.homeId === t.id || g.awayId === t.id)).length;
      if (n > MAX_PER_WEEK) note(`LOCKED ${t.id} week ${w} has ${n}`);
    }
  }
  const uk = yourGames(locked).filter((g) => !g.declined && g.kind === "conference");
  const ukH = uk.filter((g) => g.homeId === "kentucky").length;
  const ukA = uk.filter((g) => g.awayId === "kentucky").length;
  console.log("UK H/A", ukH, ukA, "conferences", CONFERENCES.length);
}

console.log("— live winner preserved —");
{
  let flips = 0;
  let ties = 0;
  let wild = 0;
  for (let seed = 1; seed <= 24; seed++) {
    let s = lockSchedule(newDynasty(seed % 2 ? "gonzaga" : "duke", seed * 97 + 3, { careerMode: false }));
    const live = beginLiveGame(s);
    if (!live?.liveGame) {
      note(`live ${seed} did not start`);
      continue;
    }
    const done = runLiveRest(live);
    const lg = done.liveGame;
    if (!lg?.done) {
      note(`live ${seed} unfinished`);
      continue;
    }
    if (lg.homeScore === lg.awayScore) {
      ties++;
      note(`live ${seed} tied ${lg.homeScore}-${lg.awayScore}`);
    }
    if (lg.homeScore < 40 || lg.awayScore < 40 || lg.homeScore > 120 || lg.awayScore > 120) {
      wild++;
      note(`live ${seed} wild ${lg.homeScore}-${lg.awayScore}`);
    }
    const closed = closeLive(done);
    const last = closed.results.find((r) => r.slotId === lg.slotId);
    if (!last) {
      note(`live ${seed} no result`);
      continue;
    }
    const liveHomeWon = lg.homeScore > lg.awayScore;
    const recHomeWon = last.homeScore > last.awayScore;
    if (liveHomeWon !== recHomeWon) {
      flips++;
      note(`live ${seed} flip live ${lg.homeScore}-${lg.awayScore} recap ${last.homeScore}-${last.awayScore}`);
    }
    if (last.homeScore !== lg.homeScore || last.awayScore !== lg.awayScore) {
      note(`live ${seed} score rewrite ${lg.homeScore}-${lg.awayScore} -> ${last.homeScore}-${last.awayScore}`);
    }
  }
  console.log("live 24 games flips", flips, "ties", ties, "wild", wild);
}

console.log("— save roundtrip results —");
{
  let s = lockSchedule(newDynasty("ucla", 11, { careerMode: false }));
  for (let i = 0; i < 3; i++) s = { ...simWeek(s), pendingPresser: null, pendingStory: null };
  const packed = JSON.parse(JSON.stringify(slimState(s))) as GameState;
  const hyd = hydrateState(JSON.parse(JSON.stringify({
    ...packed,
    results: s.results.map((r) =>
      r.homeId === s.playerTeamId || r.awayId === s.playerTeamId
        ? r
        : [r.id, r.slotId, r.homeId, r.awayId, r.homeScore, r.awayScore, r.week],
    ),
  })));
  if (hyd.results.length !== s.results.length) note(`results ${hyd.results.length} vs ${s.results.length}`);
  if (hyd.players.length !== s.players.length) note(`players ${hyd.players.length} vs ${s.players.length}`);
  if (hyd.teams.ucla?.wins !== s.teams.ucla?.wins) note("wins lost on hydrate");
  const kb = packedSize(s) / 1024;
  console.log("save", kb.toFixed(0), "kb results", s.results.length, "hydrated", hyd.results.length);
  if (kb > 4500) note(`packed ${kb.toFixed(0)}kb after 3 weeks`);
}

console.log("— beginLive closes a finished game —");
{
  let s = lockSchedule(newDynasty("kansas", 8, { careerMode: false }));
  s = beginLiveGame(s)!;
  s = runLiveRest(s);
  assert.ok(s.liveGame?.done);
  const slot = s.liveGame!.slotId;
  const next = beginLiveGame(s);
  if (!next) note("begin after done returned null");
  else {
    if (next.results.some((r) => r.slotId === slot) === false) note("finished live was not recorded");
    if (next.liveGame?.slotId === slot && !next.liveGame.done) note("restarted the same finished game");
  }
}

console.log("— two-year soak —");
{
  function tick(st: GameState) {
    return { ...simWeek(st), pendingPresser: null, pendingStory: null };
  }
  let s = lockSchedule(newDynasty("kentucky", 77, { careerMode: false }));
  let g = 0;
  while (s.phase !== "offseason" && g++ < 90) s = tick(s);
  if (s.phase !== "offseason") note(`y1 stuck ${s.phase} w${s.week}`);
  if ((s.selection?.ncaa.length ?? 0) !== 68) note(`y1 field ${s.selection?.ncaa.length}`);
  if (!s.selection?.champ) note("y1 no champ");
  const rec = s.teams.kentucky!;
  if (rec.wins + rec.losses < 18) note(`y1 games ${rec.wins}-${rec.losses}`);
  console.log("Y1", rec.wins, "-", rec.losses, "champ", s.selection?.champ, "field", s.selection?.ncaa.length);
  s = startNextSeason(s);
  if (s.phase !== "preseason") note(`y2 phase ${s.phase}`);
  s = lockSchedule(s);
  g = 0;
  while (s.phase !== "offseason" && g++ < 90) s = tick(s);
  if (s.phase !== "offseason") note(`y2 stuck ${s.phase}`);
  if ((s.selection?.ncaa.length ?? 0) !== 68) note(`y2 field ${s.selection?.ncaa.length}`);
  console.log("Y2", s.teams.kentucky!.wins, "-", s.teams.kentucky!.losses, "champ", s.selection?.champ);
}

console.log("ISSUES", issues.length);
if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("RELEASE STRESS OK");
}
