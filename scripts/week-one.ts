import assert from "node:assert/strict";
import { lockSchedule, newDynasty, nextYourGame, simGame, simWeek, yourGames } from "../src/game/engine";

let s = lockSchedule(newDynasty("kentucky", 44, { careerMode: false }));
const first = nextYourGame(s);
assert.ok(first, "no next game");
assert.ok(first!.week <= 2, `season opened week ${first!.week}`);
assert.equal(s.week, first!.week, `state.week ${s.week} vs next ${first!.week}`);
const weeks = yourGames(s).filter((g) => !g.declined).map((g) => g.week);
assert.ok(weeks.some((w) => w <= 2), `user weeks ${[...new Set(weeks)].sort((a, b) => a - b).join(",")}`);

const rec0 = s.teams.kentucky!.wins + s.teams.kentucky!.losses;
s = simGame(s);
const rec1 = s.teams.kentucky!.wins + s.teams.kentucky!.losses;
assert.equal(rec1, rec0 + 1, `sim game did not count (${rec0} -> ${rec1})`);
const after = nextYourGame(s);
assert.ok(after, "no game after sim");
assert.notEqual(after!.id, first!.id, "next game did not advance");

s = simGame(s);
assert.equal(s.teams.kentucky!.wins + s.teams.kentucky!.losses, rec0 + 2);

const beforeWeek = s.week;
s = simWeek(s);
assert.ok(s.week >= beforeWeek, `week did not move (${beforeWeek} -> ${s.week})`);
assert.ok((s.potw ?? []).length >= 1, "no POTW after sim week");
assert.ok(s.news.some((n) => n.kicker === "Takes" || n.outlet === "Takes" || /timeline/i.test(n.headline)), "no weekly take");

console.log("WEEK ONE OK", `open wk ${first!.week}`, `record ${s.teams.kentucky!.wins}-${s.teams.kentucky!.losses}`, `next wk ${nextYourGame(s)?.week}`, `potw ${s.potw?.[0]?.name ?? "none"}`);
