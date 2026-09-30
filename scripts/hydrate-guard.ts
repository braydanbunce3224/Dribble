import assert from "node:assert/strict";
import { hydrateState } from "../src/game/develop";
import { teamOf } from "../src/game/teams";
import type { GameState } from "../src/game/types";

const empty = hydrateState({} as GameState);
assert.ok(empty.playerTeamId, "no fallback team");
assert.ok(empty.teams[empty.playerTeamId], "no runtime team");
assert.equal(empty.players.length, 0);
assert.equal(empty.news.length, 0);
assert.ok(empty.identity.first);
assert.ok(empty.compliance);
assert.ok(empty.sheet);
assert.ok(empty.contract);

const partial = hydrateState({
  playerTeamId: "kentucky",
  seed: 3,
  season: 2026,
  players: [
    { id: "a", first: "Enzo", last: "Nguyen", teamId: "kentucky", ovr: 82 },
    null,
    { last: "Ghost" },
    { id: "b", teamId: "kentucky", pos: "XX", ovr: "nope" },
  ],
  recruits: [{ id: "r1", first: "Kid" }, { ovr: 99 }],
  results: [{ id: "bad" }, { id: "ok", homeScore: 70, awayScore: 64, homeId: "kentucky", awayId: "duke", slotId: "g1", week: 1 }],
  news: [{ week: 1, text: "Old scoreline.", tone: "even" }],
  teams: { kentucky: { wins: 4 } },
} as unknown as GameState);

assert.equal(partial.playerTeamId, "kentucky");
assert.ok(partial.teams.kentucky);
assert.equal(partial.teams.kentucky.wins, 4);
assert.equal(partial.teams.kentucky.losses, 0);
assert.ok(partial.players.length >= 1);
assert.ok(partial.players.every((p) => p.teamId && p.pos));
assert.equal(partial.results.length, 1);
assert.equal(partial.news[0]?.headline.includes("Old scoreline"), true);
assert.ok(partial.recruits[0]?.interest);
assert.equal(teamOf("not-a-school").mascot, "Club");
assert.equal(teamOf("kentucky").name.length > 0, true);

console.log("HYDRATE", empty.playerTeamId, "players", partial.players.length, "news", partial.news[0]?.headline);
console.log("GUARD OK");
