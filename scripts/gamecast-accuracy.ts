import assert from "node:assert/strict";
import { distToHoop, playSpot, startLiveGame, stepLive, simRestLive, clockLabel } from "../src/game/plays";
import { mulberry32 } from "../src/game/rng";
import type { GameState, Player } from "../src/game/types";
import { SAVE_VERSION, START_SEASON } from "../src/game/types";
import { DEFAULT_COACH } from "../src/game/develop";

function player(id: string, teamId: string, pos: Player["pos"], ovr: number): Player {
  return {
    id, teamId, first: "Test", last: id, pos, year: 2, ovr, potential: ovr + 4, mpg: 24,
    skills: { shoot: ovr, finish: ovr, defense: ovr, iq: ovr },
    morale: 70, seasonMinutes: 0, seasonGames: 0,
  };
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
    schedule: [{ id: "g1", week: 1, homeId: home, awayId: away, site: "home", kind: "noncon" }],
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
    history: { seasons: 0, titles: 0, ncaaBids: 0, confTitles: 0 },
    contract: null,
    contractReview: null,
    compliance: null,
  } as GameState;
}

{
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
  console.log("spots: 3s outside arc, 2s in paint, FTs on the line");
}

{
  const rng = mulberry32(3);
  const h = playSpot("two", "post", "home", rng);
  const a = playSpot("two", "post", "away", rng);
  assert.ok(h.x > 70, `home 2 at ${h.x}`);
  assert.ok(a.x < 24, `away 2 at ${a.x}`);
  console.log("sides: home right hoop, away left hoop");
}

{
  let s = startLiveGame(stub())!;
  assert.ok(s.liveGame);
  let lastH = 0;
  let lastA = 0;
  for (let i = 0; i < 36; i++) {
    s = stepLive(s, 1);
    const live = s.liveGame!;
    const play = live.log.find((e) => e.kind && e.kind !== "period");
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
      if (play.kind === "two" && play.made) assert.ok((play.pts ?? 0) >= 2);
      if (play.kind === "two" && !play.made) assert.equal(play.pts, 0);
      if (play.kind === "to") assert.equal(play.pts, 0);
      if (play.kind === "ft") assert.ok((play.pts ?? 0) <= 2);
    }
    assert.ok(live.clock >= 0);
    if (!live.done) assert.match(clockLabel(live.half, live.clock), /^(H1|H2|OT\d) \d+:\d{2}$/);
  }
  console.log("live: scoreboard matches log, clock legal, spots match kind");
}

{
  let s = startLiveGame(stub())!;
  s = simRestLive(s);
  const live = s.liveGame!;
  assert.equal(live.done, true);
  const fin = live.log[0]!;
  assert.equal(fin.t, "Final");
  assert.equal(fin.homeScore, live.homeScore);
  assert.equal(fin.awayScore, live.awayScore);
  assert.ok(live.homeScore + live.awayScore > 40, "final too low for a full game");
  console.log(`final: ${live.homeScore}-${live.awayScore} matches log`);
}

console.log("GAMECAST ACCURACY OK");
