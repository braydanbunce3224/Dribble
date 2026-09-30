import assert from "node:assert/strict";
import {
  beginLiveGame, bookLines, callTimeout, closeLive, conferenceLeaders, leadersOf, lockSchedule,
  newDynasty, rivalryOf, runLivePossession, runLiveRest, simWeek, snapshotLeaders, startNextSeason,
  toughestPlaces,
} from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { packedSize, slimState } from "../src/game/persist";
import { gymLiveEdge } from "../src/game/gym";
import { lockGamePlan } from "../src/game/plays";
import { TEAMS } from "../src/game/teams";
import type { GameState } from "../src/game/types";
import { SAVE_VERSION } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

let s = lockSchedule(newDynasty("kentucky", 88, {
  careerMode: false,
  identity: { first: "Pat", last: "Lane", age: 40, almaMaterId: "kentucky" },
}));
assert.equal(s.version, SAVE_VERSION);
assert.ok(rivalryOf("kentucky", "louisville"));
assert.ok(toughestPlaces(s).length === TEAMS.length);

const live0 = beginLiveGame(s);
assert.ok(live0?.liveGame);
assert.equal(live0!.liveGame!.timeoutsHome, 4);
let live = lockGamePlan(live0!);
live = runLivePossession(live);
const youHome = live.liveGame!.homeId === "kentucky";
const toKey = youHome ? "timeoutsHome" as const : "timeoutsAway" as const;
const beforeTo = live.liveGame![toKey] ?? 4;
live = callTimeout(live);
assert.equal(live.liveGame![toKey], beforeTo - 1, "timeout spends one");
live = runLiveRest(live);
if (live.liveGame && !live.liveGame.done) note("live unfinished");
s = live.liveGame?.done ? closeLive(live) : live;
assert.ok(s.results.length >= 1);
const yours = s.results.find((r) => r.homeId === "kentucky" || r.awayId === "kentucky");
if (yours) {
  assert.ok(s.recordBook, "record book after a game");
  const star = s.players.find((p) => p.teamId === "kentucky" && (p.stats?.g ?? 0) > 0);
  assert.ok(star, "your player got a box");
}

for (let i = 0; i < 8; i++) s = tick(s);
const board = toughestPlaces(s);
assert.ok(board.some((r) => r.streak !== 0), "gym streaks");
const nat = leadersOf(s);
if (!nat.pts.length) {
  const snap = snapshotLeaders(s);
  if (!snap.pts.length) note("no national scorers after 8 weeks");
}
const conf = conferenceLeaders(s);
void conf;
const book = bookLines(s);
assert.ok(book.lines.length >= 1, "book lines");

const edgeHi = gymLiveEdge(s, "duke");
const edgeLo = gymLiveEdge(s, board[board.length - 1]!.id);
assert.ok(edgeHi > edgeLo, "HCA spread");

let rolled = s;
let guard = 0;
while (rolled.phase !== "offseason" && guard++ < 50) rolled = tick(rolled);
if (rolled.contractReview && !rolled.contractReview.resolved) {
  rolled = { ...rolled, contractReview: { ...rolled.contractReview, resolved: true, jobs: [] } };
}
const next = startNextSeason(rolled);
assert.equal(next.teams.kentucky?.homeW, 0);
assert.ok((next.recordBook?.allW ?? 0) + (next.recordBook?.allL ?? 0) > 0, "book survived the year");
assert.ok((next.teams.kentucky?.gymW ?? 0) >= 0);

const hyd = hydrateState(JSON.parse(JSON.stringify(slimState(next))));
assert.equal(hyd.teams.kentucky?.gymW, next.teams.kentucky?.gymW);
const bytes = packedSize(slimState(s));
if (bytes > 3_500_000) note(`save fat ${Math.round(bytes / 1024)}kb`);

const rivalGame = s.schedule.find((g) => rivalryOf(g.homeId, g.awayId) && (g.homeId === "kentucky" || g.awayId === "kentucky"));
console.log(
  "STORE-READY",
  `${s.teams.kentucky!.wins}-${s.teams.kentucky!.losses}`,
  `book ${book.lines.map((l) => l.k).join("/")}`,
  `leaders ${nat.pts[0] ? nat.pts[0].name : "none"}`,
  `timeouts live`,
  rivalGame ? `rivalry ${rivalryOf(rivalGame.homeId, rivalGame.awayId)?.trophy}` : "no UK rival on slate",
  `save ${Math.round(bytes / 1024)}kb`,
);

if (issues.length) {
  for (const i of issues) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("STORE-READY OK");
}
