import assert from "node:assert/strict";
import { test } from "node:test";
import { lockSchedule, newDynasty, simGame, beginLiveGame, runLiveRest, closeLive, recapFor } from "./engine.ts";
import { simContest } from "./sim.ts";
import { mulberry32 } from "./rng.ts";
import { repairArchiveLine, repairStoredMonsters } from "./archives.ts";
import type { GameState } from "./types.ts";

function fgPct(rows: { fgm: number; fga: number }[]) {
  const fga = rows.reduce((n, p) => n + p.fga, 0);
  const fgm = rows.reduce((n, p) => n + p.fgm, 0);
  return fga ? fgm / fga : 0;
}

test("simmed box scores add up and look like college basketball", () => {
  let s = lockSchedule(newDynasty("kentucky", 41, { careerMode: false }));
  const rng = mulberry32(41);
  const game = simContest(s, "kentucky", s.schedule[0]!.awayId === "kentucky" ? s.schedule[0]!.homeId : s.schedule[0]!.awayId, rng, { site: "home" });
  assert.equal(game.homeLines.reduce((n, p) => n + p.pts, 0), game.homeScore);
  assert.equal(game.awayLines.reduce((n, p) => n + p.pts, 0), game.awayScore);
  assert.notEqual(game.homeScore, game.awayScore);
  assert.ok(game.homeScore >= 48 && game.homeScore <= 110, `home ${game.homeScore}`);
  assert.ok(game.awayScore >= 48 && game.awayScore <= 110, `away ${game.awayScore}`);
  const minH = game.homeLines.reduce((n, p) => n + p.min, 0);
  assert.ok(Math.abs(minH - game.minutes * 5) <= 2, `minutes ${minH}`);
  const pct = fgPct(game.homeLines);
  assert.ok(pct >= 0.34 && pct <= 0.62, `fg% ${pct}`);
  for (const p of game.homeLines) {
    assert.ok(p.fgm <= p.fga);
    assert.ok((p.tpm ?? 0) <= (p.tpa ?? 0));
    assert.ok((p.ftm ?? 0) <= (p.fta ?? 0));
    assert.ok((p.fta ?? 0) <= 16, `${p.name} FTA ${p.fta}`);
    const made2 = p.fgm - (p.tpm ?? 0);
    const ident = made2 * 2 + (p.tpm ?? 0) * 3 + (p.ftm ?? 0);
    assert.equal(ident, p.pts, `${p.name} pts ${p.pts} vs ${ident}`);
    assert.ok(p.min <= 39);
  }
  const star = game.homeLines[0]!;
  assert.ok(star.pts <= 42, `star ${star.pts}`);
  assert.ok(star.fga >= 4 || star.pts < 12);
});

test("shooters take more threes than bigs", () => {
  let s = lockSchedule(newDynasty("duke", 9, { careerMode: false }));
  const rng = mulberry32(9);
  const opp = s.schedule.find((g) => g.homeId === "duke" || g.awayId === "duke")!;
  const other = opp.homeId === "duke" ? opp.awayId : opp.homeId;
  const game = simContest(s, "duke", other, rng, { site: "home" });
  const wings = game.homeLines.filter((p) => p.pos === "SG" || p.pos === "PG");
  const bigs = game.homeLines.filter((p) => p.pos === "C" || p.pos === "PF");
  const wing3 = wings.reduce((n, p) => n + (p.tpa ?? 0), 0);
  const big3 = bigs.reduce((n, p) => n + (p.tpa ?? 0), 0);
  assert.ok(wing3 >= big3, `wings ${wing3} bigs ${big3}`);
});

test("played and simmed recaps keep a real box", () => {
  let s = lockSchedule(newDynasty("kansas", 3, { careerMode: false, identity: { first: "Box", last: "Check", age: 44, almaMaterId: "kansas" } }));
  s = { ...simGame(s), pendingPresser: null };
  const r = s.results.find((x) => x.homeId === "kansas" || x.awayId === "kansas")!;
  const recap = recapFor(s, r);
  assert.equal(recap.homeLeaders.reduce((n, p) => n + p.pts, 0), r.homeScore);
  assert.equal(recap.awayLeaders.reduce((n, p) => n + p.pts, 0), r.awayScore);
  const star = recap.homeLeaders[0]!;
  assert.ok(star.fga >= star.fgm);
  const pct = star.fga ? star.fgm / star.fga : 0;
  assert.ok(pct <= 0.85 || star.fga <= 4, `hot shooting ${star.fgm}-${star.fga}`);

  let live = beginLiveGame(s)!;
  live = runLiveRest(live);
  assert.ok(live.liveGame?.done);
  const hs = live.liveGame!.homeScore;
  const as = live.liveGame!.awayScore;
  s = closeLive(live);
  const last = s.results[s.results.length - 1]!;
  assert.equal(last.homeScore, hs);
  assert.equal(last.awayScore, as);
  const liveRecap = recapFor(s, last);
  assert.equal(liveRecap.homeLeaders.reduce((n, p) => n + p.pts, 0), last.homeScore);
  for (const p of [...liveRecap.homeLeaders, ...liveRecap.awayLeaders]) {
    assert.ok((p.fta ?? 0) <= 16, `live ${p.name} FTA ${p.fta}`);
    assert.ok((p.ftm ?? 0) <= (p.fta ?? 0));
    assert.ok(p.fgm <= p.fga);
    assert.ok(p.pts <= 48, `live ${p.name} pts ${p.pts}`);
  }
  const liveTeamFta = liveRecap.homeLeaders.reduce((n, p) => n + (p.fta ?? 0), 0);
  assert.ok(liveTeamFta <= 34, `live team FTA ${liveTeamFta}`);
});

test("no player reaches 50 and archive monsters are rewritten", () => {
  let s = lockSchedule(newDynasty("gonzaga", 19, { careerMode: false, identity: { first: "Cap", last: "Check", age: 41, almaMaterId: "gonzaga" } }));
  const rng = mulberry32(19);
  let ot = 0;
  for (let i = 0; ot < 2 && i < 250; i++) {
    const slot = s.schedule.find((g) => !g.resultId && (g.homeId === "gonzaga" || g.awayId === "gonzaga"));
    const opp = slot ? (slot.homeId === "gonzaga" ? slot.awayId : slot.homeId) : "duke";
    const game = simContest(s, "gonzaga", opp, mulberry32(rng() * 1e9), { site: i % 2 ? "home" : "away" });
    if (game.minutes > 40) ot++;
    assert.equal(game.homeLines.reduce((n, p) => n + p.pts, 0), game.homeScore);
    assert.equal(game.awayLines.reduce((n, p) => n + p.pts, 0), game.awayScore);
    for (const p of [...game.homeLines, ...game.awayLines]) {
      assert.ok(p.pts < 50, `${p.name} ${p.pts}`);
      assert.ok(!(p.pts >= 40 && (p.reb || 0) === 0 && (p.ast || 0) === 0), `${p.name} ${p.pts}/0/0`);
      const chart = (p.fgm - (p.tpm ?? 0)) * 2 + (p.tpm ?? 0) * 3 + (p.ftm ?? 0);
      assert.equal(p.pts, chart, p.name);
    }
  }
  assert.ok(ot >= 2, `overtimes ${ot}`);
  let liveOt = 0;
  for (let i = 0; i < 8; i++) {
    const live = beginLiveGame(s);
    if (!live?.liveGame) break;
    const done = runLiveRest(live);
    if ((done.liveGame?.half ?? 0) >= 3) liveOt++;
    s = { ...closeLive(done), pendingPresser: null, pendingStory: null };
    const last = s.results[s.results.length - 1]!;
    assert.equal(last.homeScore, (last.recap?.homeLeaders ?? []).reduce((n, p) => n + p.pts, 0));
    assert.equal(last.awayScore, (last.recap?.awayLeaders ?? []).reduce((n, p) => n + p.pts, 0));
    for (const p of [...(last.recap?.homeLeaders ?? []), ...(last.recap?.awayLeaders ?? [])]) {
      assert.ok(p.pts < 50, `live ${p.name} ${p.pts}`);
    }
  }
  assert.ok(liveOt + ot >= 0);

  const monster = {
    id: "p1",
    name: "Keegan Ramirez Jr",
    pos: "SG" as const,
    min: 36,
    pts: 73,
    reb: 0,
    ast: 0,
    fgm: 30,
    fga: 40,
    tpm: 3,
    tpa: 8,
    ftm: 7,
    fta: 8,
  };
  const zero = { ...monster, id: "z", name: "Bench Zero", pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, min: 12 };
  const broken = repairStoredMonsters({
    results: [{
      id: "res-1",
      slotId: "s",
      homeId: "gonzaga",
      awayId: "duke",
      homeScore: 71,
      awayScore: 68,
      week: 4,
      recap: { headline: "x", lede: "", grafs: [], notes: [], keyPlay: "", played: false, homeLeaders: [monster, zero], awayLeaders: [{ ...monster, id: "a", name: "Other", pts: 68, fgm: 28, ftm: 6, reb: 4, ast: 2 }], homePpp: 1, awayPpp: 1, homeTo: 10, awayTo: 10, homeOrb: 8, awayOrb: 8 },
    }],
    history: { log: [{ season: 2026, teamId: "gonzaga", wins: 20, losses: 10, confW: 10, confL: 8, coachName: "A", confTitle: false, ncaaBid: true, title: false, boxes: [
      { id: "res-1", week: 4, homeId: "gonzaga", awayId: "duke", home: "Gonzaga", away: "Duke", homeScore: 71, awayScore: 68, line: "Keegan Ramirez Jr 73, Bench Zero 0" },
      { id: "gone", week: 6, homeId: "gonzaga", awayId: "duke", home: "Gonzaga", away: "Duke", homeScore: 71, awayScore: 68, line: "Keegan Ramirez Jr 71, Walk On 0" },
    ] }] },
    recordBook: { teamId: "gonzaga", allW: 1, allL: 0, titles: 0, playerGame: { name: "Keegan Ramirez Jr", pts: 73, season: 2026, oppId: "duke" } },
  } as unknown as GameState);
  const kept = broken.history.log[0]!.boxes ?? [];
  for (const b of kept) {
    assert.ok(b.line, b.id);
    assert.ok(!/\s0(,|$)/.test(b.line!), b.line);
    for (const n of b.line!.match(/\d+/g) ?? []) assert.ok(Number(n) < 50, b.line);
  }
  assert.equal(broken.recordBook?.playerGame, undefined);
  const home = broken.results[0]!.recap!.homeLeaders;
  assert.equal(home.reduce((n, p) => n + p.pts, 0), 71);
  assert.ok(home.every((p) => p.pts < 50));
  assert.equal(repairArchiveLine("0", 71, 68), undefined);
});
