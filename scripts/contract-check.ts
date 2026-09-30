import assert from "node:assert/strict";
import { newDynasty, signExtension, takeContractJob, startNextSeason } from "../src/game/engine";
import { makeContract, reviewContract, applyReview } from "../src/game/contract";
import { TEAM_BY_ID } from "../src/game/teams";

const low = makeContract("albany", 2026, 1);
assert.ok(low.years >= 3 && low.years <= 4);
assert.equal(low.remaining, 3);
assert.ok(low.clauses.some((c) => c.kind === "wins" && c.target <= 12));
assert.ok(low.clauses.some((c) => c.kind === "confWins"));

const blue = makeContract("kentucky", 2026, 1);
assert.equal(blue.years, 6);
assert.ok(blue.clauses.some((c) => c.kind === "postseason"));
const blue2 = makeContract("kentucky", 2026, 3);
assert.ok(blue2.clauses.some((c) => c.kind === "ncaa"));

let s = newDynasty("albany", 7, { careerMode: true, identity: { first: "Pat", last: "Lane", age: 34, almaMaterId: "albany" } });
assert.ok(s.contract);
assert.equal(s.contract.remaining, 3);
assert.ok(s.mail.some((m) => /years/.test(m.body) && /desk|welcome|keys/i.test(m.subject + m.body)));

s = {
  ...s,
  teams: { ...s.teams, albany: { ...s.teams.albany!, wins: 20, losses: 11, confW: 12, confL: 4 } },
  selection: { autos: {}, ncaa: [], nit: ["albany"], crown: [] },
};
let reviewed = applyReview(s);
assert.equal(reviewed.contractReview?.decision, "continue");
assert.equal(reviewed.contract?.remaining, 2);
assert.ok(reviewed.contractReview?.standing);

s = {
  ...s,
  contract: { ...s.contract!, remaining: 1, yearOnJob: 3 },
  teams: { ...s.teams, albany: { ...s.teams.albany!, wins: 6, losses: 24, confW: 2, confL: 14 } },
  selection: { autos: {}, ncaa: [], nit: [], crown: [] },
  adHeat: 28,
};
reviewed = applyReview(s);
assert.equal(reviewed.contractReview?.decision, "fire");
assert.ok((reviewed.contractReview?.jobs.length ?? 0) >= 2);
const job = reviewed.contractReview!.jobs[0]!;
const taken = takeContractJob(reviewed, job.teamId);
assert.ok(taken.ok);
assert.equal(taken.state.playerTeamId, job.teamId);
assert.equal(taken.state.contract?.yearOnJob, 1);
assert.ok(taken.state.contractReview?.resolved);
assert.notEqual(TEAM_BY_ID[taken.state.playerTeamId]?.name, "Albany");

let k = newDynasty("kentucky", 8, { careerMode: false, identity: { first: "Cal", last: "Stone", age: 44, almaMaterId: "kentucky" } });
k = {
  ...k,
  contract: { ...k.contract!, remaining: 1, yearOnJob: 4 },
  teams: { ...k.teams, kentucky: { ...k.teams.kentucky!, wins: 28, losses: 5, confW: 16, confL: 2 } },
  selection: {
    autos: { SEC: "kentucky" },
    ncaa: [{ teamId: "kentucky", seed: 1, region: "South", path: "auto" }],
    nit: [],
    crown: [],
    champ: "kentucky",
    confTourney: "kentucky",
  },
};
const ext = applyReview(k);
assert.equal(ext.contractReview?.decision, "extend");
assert.ok(ext.contractReview?.offer);
const signed = signExtension(ext);
assert.ok(signed.ok);
assert.equal(signed.state.contract?.remaining, signed.state.contract?.years);
const next = startNextSeason(signed.state);
assert.equal(next.phase, "preseason");
assert.equal(next.playerTeamId, "kentucky");

const blocked = startNextSeason(reviewed);
assert.equal(blocked.playerTeamId, "albany");

console.log("LOW", low.years, low.clauses.map((c) => c.label).join(" / "));
console.log("BLUE", blue.years, blue.clauses.map((c) => c.label).join(" / "));
console.log("FIRE", reviewed.contractReview?.jobs.map((j) => TEAM_BY_ID[j.teamId]?.name).join(", "));
console.log("EXT", ext.contractReview?.offer?.years, "years");
console.log("CONTRACT OK");
