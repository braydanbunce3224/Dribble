import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simGame } from "../src/game/engine";
import { gameLog, matchup, playerTape, teamTape } from "../src/game/analytics";

let s = lockSchedule(newDynasty("kentucky", 44, { careerMode: false, identity: { first: "Tape", last: "Room", age: 41, almaMaterId: "kentucky" } }));
for (let i = 0; i < 4; i++) s = { ...simGame(s), pendingPresser: null };

const tape = teamTape(s, "kentucky");
assert.ok(tape.games >= 4, `games ${tape.games}`);
assert.ok(Number.isFinite(tape.off.ts) && tape.off.ts > 0.35 && tape.off.ts < 0.75, `ts ${tape.off.ts}`);
assert.ok(Number.isFinite(tape.off.ppp) && tape.off.ppp > 0.7 && tape.off.ppp < 1.4, `ppp ${tape.off.ppp}`);
assert.ok(tape.offRank.ts >= 1 && tape.offRank.ts <= 365);
assert.ok(tape.kp && Number.isFinite(tape.kp.adjEM));

const players = playerTape(s, "kentucky");
assert.ok(players.length >= 5, `rotation ${players.length}`);
const pts = players.reduce((n, p) => n + p.pts, 0);
const scored = s.results.filter((r) => r.homeId === "kentucky" || r.awayId === "kentucky").reduce((n, r) => n + (r.homeId === "kentucky" ? r.homeScore : r.awayScore), 0);
assert.equal(pts, scored);
assert.ok(players[0]!.usg > 10 && players[0]!.usg < 45, `usg ${players[0]!.usg}`);

const log = gameLog(s, "kentucky");
assert.equal(log.length, tape.games);
assert.ok(log.every((g) => Number.isFinite(g.ppp)));

const opp = log[0]!.oppId;
const m = matchup(s, "kentucky", opp, 1, "home");
assert.ok(m.expYou >= 50 && m.expOpp >= 50);
console.log("TAPE", tape.kp?.rank, "AdjEM", tape.kp?.adjEM.toFixed(1), "PPP", tape.off.ppp.toFixed(2), "TS", (tape.off.ts * 100).toFixed(1), "USG", players[0]!.name, players[0]!.usg.toFixed(1));
console.log("ANALYTICS OK");
