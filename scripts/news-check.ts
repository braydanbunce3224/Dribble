import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simGame, simWeek } from "../src/game/engine";
import { hydrateNews } from "../src/game/wire";

let s = newDynasty("kentucky", 7, { careerMode: false, identity: { first: "Pat", last: "Riley", age: 44, almaMaterId: "kentucky" } });
assert.ok(s.news[0]?.grafs.length >= 2, "camp copy thin");
assert.ok(s.news[0]?.headline.length > 12, "camp hed");
s = lockSchedule(s);
assert.ok(s.news[0]?.kicker === "Schedule" || s.news[0]?.grafs.length >= 2, "lock copy");
s = { ...simGame(s), pendingPresser: null };
const story = s.news.find((n) => n.resultId);
assert.ok(story, "no game story");
assert.ok(story!.grafs.length >= 3, `grafs ${story!.grafs.length}`);
assert.ok(!/^[^,]+\s+\d+,\s+[^,]+\s+\d+\.$/.test(story!.headline), `still a scoreline: ${story!.headline}`);
assert.ok(story!.byline.includes(" "), "no byline");
assert.ok(story!.dek.length > 4, "no dek");

s = { ...simWeek(s), pendingPresser: null };
assert.ok(s.news.every((n) => n.headline && n.grafs.length), "hole in the wire");

const legacy = hydrateNews([{ week: 3, text: "Durham 79, Chapel Hill 72.", tone: "good" }]);
assert.equal(legacy[0]!.headline.includes("Durham"), true);
assert.ok(legacy[0]!.grafs[0]);

console.log("LEAD", story!.headline);
console.log("DEK", story!.dek);
console.log("GRAF0", story!.grafs[0]!.slice(0, 120));
console.log("NEWS OK");
