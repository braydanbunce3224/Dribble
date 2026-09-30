import assert from "node:assert/strict";
import { test } from "node:test";
import { crowdFill, distToHoop, lockGamePlan, offeredCalls, playSpot, pressLegal, startLiveGame, stepLive, simRestLive, clockLabel } from "./plays.ts";
import { mulberry32 } from "./rng.ts";
import type { GameState, Player } from "./types.ts";
import { SAVE_VERSION, START_SEASON } from "./types.ts";
import { DEFAULT_COACH } from "./develop.ts";

function player(id: string, teamId: string, pos: Player["pos"], ovr: number): Player {
  return {
    id, teamId, first: "Test", last: id, pos, year: 2, ovr, potential: ovr + 4, mpg: 24,
    skills: { shoot: ovr, finish: ovr, defense: ovr, iq: ovr },
    morale: 70, seasonMinutes: 0, seasonGames: 0, careerMinutes: 0, careerGames: 0,
  } as Player;
}

function stub(): GameState {
  const home = "kentucky";
  const away = "duke";
  const players: Player[] = [];
  for (const team of [home, away]) {
    (["PG", "SG", "SF", "PF", "C"] as const).forEach((pos, i) => {
      players.push(player(`${team}-${pos}`, team, pos, 78 - i));
      players.push(player(`${team}-${pos}b`, team, pos, 70 - i));
    });
  }
  return {
    version: SAVE_VERSION,
    seed: 42,
    season: START_SEASON,
    week: 1,
    phase: "regular",
    playerTeamId: home,
    teams: {},
    players,
    recruits: [],
    schedule: [{
      id: "g1", week: 1, homeId: home, awayId: away, site: "home", kind: "noncon",
    }],
    results: [],
    mail: [],
    news: [],
    identity: { first: "Pat", last: "Test", age: 40, almaMaterId: home },
    careerMode: false,
    eraDecade: null,
    nilCap: 100,
    donorMood: 50,
    adHeat: 50,
    fanMood: 50,
    scholarships: 13,
    recruitingHours: 10,
    cpuRecruit: false,
    pendingPresser: null,
    liveGame: null,
    lastPresserWeek: -1,
    recentQuestionIds: [],
    tutorialDone: true,
    coachSkills: { ...DEFAULT_COACH },
    skillPoints: 0,
    offseasonReport: null,
    history: { seasons: 0, wins: 0, losses: 0, titles: 0, ncaaBids: 0, confTitles: 0, sweet16: 0, elite8: 0, finalFour: 0, nitBids: 0, log: [] },
    selection: null,
    contract: null,
    contractReview: null,
    compliance: null,
    sheet: null,
  } as GameState;
}

test("threes sit outside the arc, twos inside, FTs on the line", () => {
  const rng = mulberry32(7);
  for (const poss of ["home", "away"] as const) {
    for (let i = 0; i < 40; i++) {
      const t = playSpot("three", "spread", poss, rng);
      assert.ok(distToHoop(t.x, t.y, poss) >= 21.5, `3pt too close ${distToHoop(t.x, t.y, poss)}`);
      const two = playSpot("two", "post", poss, rng);
      assert.ok(distToHoop(two.x, two.y, poss) <= 16, `2pt too far ${distToHoop(two.x, two.y, poss)}`);
      const ft = playSpot("ft", "iso", poss, rng);
      const d = distToHoop(ft.x, ft.y, poss);
      assert.ok(d >= 12 && d <= 16, `FT not at the line ${d}`);
      assert.ok(Math.abs(ft.y - 25) < 2);
    }
  }
});

test("home attacks the right hoop, away the left", () => {
  const rng = mulberry32(3);
  const h = playSpot("two", "post", "home", rng);
  const a = playSpot("two", "post", "away", rng);
  assert.ok(h.x > 70, `home 2 at ${h.x}`);
  assert.ok(a.x < 24, `away 2 at ${a.x}`);
});

test("live sim scores, clock, and spots stay consistent with the log", () => {
  let s = startLiveGame(stub())!;
  assert.ok(s.liveGame);
  let lastH = 0;
  let lastA = 0;
  for (let i = 0; i < 36; i++) {
    s = stepLive(s, 1);
    const live = s.liveGame!;
    const play = live.log.find((e: { kind?: string }) => e.kind && e.kind !== "period");
    assert.equal(live.homeScore, live.log[0]!.homeScore);
    assert.equal(live.awayScore, live.log[0]!.awayScore);
    assert.ok(live.homeScore >= lastH);
    assert.ok(live.awayScore >= lastA);
    lastH = live.homeScore;
    lastA = live.awayScore;
    if (play?.kind && play.kind !== "period") {
      assert.ok(play.x != null && play.y != null);
      assert.ok(play.poss === "home" || play.poss === "away");
      const hoopSide = play.poss === "home" ? play.x! > 47 : play.x! < 47;
      if (play.kind === "two" || play.kind === "three" || play.kind === "ft") {
        assert.ok(hoopSide, `${play.kind} on wrong half x=${play.x} poss=${play.poss}`);
      }
      if (play.kind === "three") {
        assert.ok(distToHoop(play.x!, play.y!, play.poss!) >= 21);
        if (play.made) assert.equal(play.pts, 3);
        else assert.equal(play.pts, 0);
      }
    }
    if (live.done) break;
  }
  assert.ok(clockLabel(1, 65).includes("1:05") || clockLabel(1, 65).includes("H1"));
});

test("sim rest finishes with a score", () => {
  let s = startLiveGame(stub())!;
  s = simRestLive(s);
  assert.equal(s.liveGame?.done, true);
  assert.ok((s.liveGame?.homeScore ?? 0) + (s.liveGame?.awayScore ?? 0) > 80);
});

test("pregame lock and crowd fill", () => {
  let s = startLiveGame(stub())!;
  assert.equal(s.liveGame?.planned, false);
  s = lockGamePlan(s);
  assert.equal(s.liveGame?.planned, true);
  const crowd = crowdFill(s, s.liveGame!);
  assert.ok(crowd.home >= 0.28 && crowd.home <= 0.98);
});

test("full-court press is off the board after a miss", () => {
  let s = startLiveGame(stub())!;
  s = lockGamePlan(s);
  const you = s.playerTeamId;
  const live = s.liveGame!;
  const youPoss = live.homeId === you ? "home" as const : "away" as const;
  const themPoss = youPoss === "home" ? "away" as const : "home" as const;

  const missed = {
    ...live,
    poss: themPoss,
    log: [{
      t: "H1 19:40",
      text: "Short.",
      homeScore: 0,
      awayScore: 0,
      kind: "two" as const,
      made: false,
      pts: 0,
      poss: youPoss,
      x: 80,
      y: 25,
    }, ...live.log],
  };
  const afterMiss = { ...s, liveGame: missed };
  assert.equal(pressLegal(afterMiss), false);
  assert.ok(!offeredCalls(afterMiss).some((c) => c.id === "press"), "press offered after a miss");

  const made = {
    ...live,
    poss: themPoss,
    log: [{
      t: "H1 19:40",
      text: "Good.",
      homeScore: 2,
      awayScore: 0,
      kind: "two" as const,
      made: true,
      pts: 2,
      poss: youPoss,
      x: 80,
      y: 25,
    }, ...live.log],
  };
  const afterMake = { ...s, liveGame: made };
  assert.equal(pressLegal(afterMake), true);
});
