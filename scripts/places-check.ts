import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simWeek, startNextSeason } from "../src/game/engine";
import { hydrateState } from "../src/game/develop";
import { gymLiveEdge, gymName, gymPrior, gymScore, gymSimEdge, toughestPlaces } from "../src/game/gym";
import { TEAMS } from "../src/game/teams";
import type { GameState } from "../src/game/types";

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

const FORTRESS = ["duke", "kansas", "iowa-state", "new-mexico", "kentucky", "indiana", "houston", "gonzaga"];

let s = lockSchedule(newDynasty("dayton", 42, { careerMode: false }));
const camp = toughestPlaces(s);
assert.equal(camp.length, TEAMS.length);
assert.equal(new Set(camp.map((r) => r.id)).size, TEAMS.length);
assert.ok(camp.every((r, i) => r.rank === i + 1));
assert.ok(camp.every((r) => r.hca >= 1.2 && r.hca <= 9.5));
assert.ok(camp.every((r) => r.gym.length > 2));
assert.ok(camp.every((r) => !/tuesday/i.test(r.note) && !/home still counts/i.test(r.note)));
assert.ok(new Set(camp.slice(0, 15).map((r) => r.note)).size >= 10, "top gyms share one blurb");

const topIds = camp.slice(0, 8).map((r) => r.id);
const fortressInTop = FORTRESS.filter((id) => topIds.includes(id));
assert.ok(fortressInTop.length >= 4, `historical gyms in top 8: ${topIds.join(",")} (${fortressInTop.length})`);

const duke0 = camp.find((r) => r.id === "duke")!;
const kansas0 = camp.find((r) => r.id === "kansas")!;
const hilton0 = camp.find((r) => r.id === "iowa-state")!;
const pit0 = camp.find((r) => r.id === "new-mexico")!;
assert.ok(duke0.rank <= 8, `Duke camp ${duke0.rank}`);
assert.ok(kansas0.rank <= 8, `Kansas camp ${kansas0.rank}`);
assert.ok(hilton0.rank <= 8, `Hilton camp ${hilton0.rank}`);
assert.ok(pit0.rank <= 10, `The Pit camp ${pit0.rank}`);
assert.equal(gymName("new-mexico"), "The Pit");
assert.ok(gymName("duke") !== "Duke");
assert.ok(!gymName("duke").toLowerCase().includes("cameron") || gymName("duke") === "The Indoor");

const weak = camp[camp.length - 1]!;
assert.ok(gymLiveEdge(s, duke0.id) > gymLiveEdge(s, weak.id), "live edge follows gym");
assert.ok(gymSimEdge(s, kansas0.id) > gymSimEdge(s, weak.id), "sim edge follows gym");
assert.ok(gymPrior("ucla", 1960) > gymPrior("duke", 1960), "1960s UCLA over Duke");
assert.ok(gymPrior("duke", 2020) > gymPrior("ucla", 1960) - 20, "modern Duke still a gym");

const campOrder = camp.map((r) => r.id).join(",");

for (let i = 0; i < 10; i++) s = tick(s);
const live = toughestPlaces(s);
assert.equal(live.length, TEAMS.length);
const liveOrder = live.map((r) => r.id).join(",");
assert.ok(liveOrder !== campOrder, "board moves after games");
assert.ok(live.some((r) => r.seasonW + r.seasonL > 0), "home games landed");
assert.ok(live.some((r) => r.streak !== 0), "streaks exist");
assert.ok(live.some((r) => r.careerW > 0), "career home wins count");

const withHome = live.filter((r) => r.seasonW + r.seasonL > 0);
assert.ok(withHome.length > 40, `home results ${withHome.length}`);
const hot = live.find((r) => r.streak >= 3);
if (hot) {
  const t = s.teams[hot.id]!;
  assert.equal(t.homeStreak, hot.streak);
  assert.equal(t.homeW, hot.seasonW);
  assert.equal(t.gymW, hot.careerW);
}

const mid = live.find((r) => r.rank >= 80 && r.rank <= 140 && r.id !== "dayton")!;
const before = gymScore(s, mid.id);
const midTeam = s.teams[mid.id]!;
const boosted: GameState = {
  ...s,
  teams: {
    ...s.teams,
    [mid.id]: {
      ...midTeam,
      homeW: midTeam.homeW + 14,
      homeL: midTeam.homeL,
      homeStreak: Math.max(0, midTeam.homeStreak) + 14,
      gymW: (midTeam.gymW ?? 0) + 14,
      gymL: midTeam.gymL ?? 0,
      gymPf: (midTeam.gymPf ?? 0) + 14 * 82,
      gymPa: (midTeam.gymPa ?? 0) + 14 * 61,
    },
  },
};
const afterBoard = toughestPlaces(boosted);
const climbed = afterBoard.find((r) => r.id === mid.id)!;
assert.ok(gymScore(boosted, mid.id) > before, "winning at home raises the gym");
assert.ok(climbed.rank < mid.rank, `14 home wins ${mid.id} ${mid.rank} → ${climbed.rank}`);
assert.equal(climbed.streak, Math.max(0, midTeam.homeStreak) + 14);

const broken: GameState = {
  ...boosted,
  teams: {
    ...boosted.teams,
    [mid.id]: {
      ...boosted.teams[mid.id]!,
      homeL: (boosted.teams[mid.id]!.homeL ?? 0) + 1,
      gymL: (boosted.teams[mid.id]!.gymL ?? 0) + 1,
      homeStreak: -1,
      gymPa: (boosted.teams[mid.id]!.gymPa ?? 0) + 78,
      gymPf: (boosted.teams[mid.id]!.gymPf ?? 0) + 64,
    },
  },
};
const afterLoss = toughestPlaces(broken).find((r) => r.id === mid.id)!;
assert.equal(afterLoss.streak, -1);
assert.ok(afterLoss.rank >= climbed.rank, `loss ${climbed.rank} → ${afterLoss.rank}`);

const neutHome = s.schedule.find((g) => g.site === "neutral" && g.resultId);
if (neutHome) {
  const t = s.teams[neutHome.homeId]!;
  const row = live.find((r) => r.id === neutHome.homeId)!;
  assert.ok(row.seasonW + row.seasonL <= t.wins + t.losses, "neutral not all home");
}

let rolled = s;
while (rolled.phase !== "offseason" && rolled.week < 40) rolled = tick(rolled);
if (rolled.contractReview && !rolled.contractReview.resolved) {
  rolled = { ...rolled, contractReview: { ...rolled.contractReview, resolved: true, jobs: [] } };
}
const gymBefore = rolled.teams.dayton!;
const next = startNextSeason(rolled);
assert.equal(next.teams.dayton?.homeW, 0);
assert.equal(next.teams.dayton?.homeL, 0);
assert.equal(next.teams.dayton?.gymW ?? 0, gymBefore.gymW ?? 0, "career gym wins survive the calendar");
assert.equal(next.teams.dayton?.homeStreak, gymBefore.homeStreak, "home streak carries");
const hyd = hydrateState(JSON.parse(JSON.stringify(next)));
assert.equal(hyd.teams.dayton?.gymW ?? 0, next.teams.dayton?.gymW ?? 0);

const era60 = newDynasty("ucla", 7, { careerMode: false, eraDecade: 1960 });
const oldBoard = toughestPlaces(era60);
assert.ok(oldBoard.find((r) => r.id === "ucla")!.rank <= 12, "1960s Westwood");
assert.ok(oldBoard.find((r) => r.id === "gonzaga")!.rank > 20, "1960s Kennel isn't a thing yet");

console.log(
  "PLACES OK",
  `camp #1 ${camp[0]!.gym} (${camp[0]!.id})`,
  `week 10 #1 ${live[0]!.gym} W${live[0]!.streak}`,
  `fortress ${fortressInTop.join("/")}`,
  `${mid.id} ${mid.rank}→${climbed.rank} then loss ${afterLoss.rank}`,
  `carry gymW ${next.teams.dayton?.gymW} streak ${next.teams.dayton?.homeStreak}`,
);
