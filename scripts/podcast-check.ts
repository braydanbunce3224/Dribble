import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simGame, simWeek } from "../src/game/engine";
import { episodesOf, showOf, tickPodcasts } from "../src/game/podcast";
import type { GameState, SelectionBoard } from "../src/game/types";

function dynasty(team: string, seed: number) {
  return newDynasty(team, seed, {
    careerMode: false,
    identity: { first: "Pat", last: "Lane", age: 40, almaMaterId: team },
  });
}

function assertTape(ep: NonNullable<ReturnType<typeof episodesOf>[number]>, label: string) {
  assert.ok(ep.beats.length >= 4, `${label}: thin tape`);
  assert.ok(ep.beats.every((b) => b.speaker && b.line), `${label}: empty beat`);
  assert.equal(ep.beats[0]!.speaker, "Jarred", `${label}: Jarred should open`);
  assert.ok(ep.beats.some((b) => b.speaker === "Trill Raff"), `${label}: no Trill Raff`);
  assert.ok(/jarred|ben|kaleb|trill/i.test(ep.beats.map((b) => b.speaker).join(" ")), `${label}: wrong table`);
  const lens = ep.beats.map((b) => b.line.length);
  assert.ok(Math.max(...lens) >= 90, `${label}: no long lines (${Math.max(...lens)})`);
  assert.ok(Math.min(...lens) <= 40, `${label}: no short lines (${Math.min(...lens)})`);
  assert.ok(new Set(ep.beats.map((b) => b.speaker)).size >= 4, `${label}: missing a host`);
  assert.ok(
    ep.beats.some((b) => /[.?!].*[.?!]/.test(b.line)) && ep.beats.some((b) => !/[.?!]/.test(b.line) || b.line.split(/[.!?]/).filter(Boolean).length === 1),
    `${label}: no sentence variety`,
  );
}

function dump(label: string, ep: NonNullable<ReturnType<typeof episodesOf>[number]>) {
  console.log(`\n--- ${label}: ${ep.title}`);
  for (const b of ep.beats) console.log(`  ${b.speaker}: ${b.line}`);
}

let s = dynasty("kentucky", 11);
const camp = episodesOf(s, "catican");
assert.ok(camp.length >= 1, "no camp episode");
assert.equal(showOf("catican").name, "The Catican");
assertTape(camp[0]!, "camp");
assert.ok(/catican|cats|bbn|jarred/i.test(camp[0]!.beats.map((b) => b.line).join(" ")), "not the Catican");

const sequences = new Set<string>();
for (const seed of [11, 22, 33, 44, 55, 66]) {
  const ep = episodesOf(dynasty("kentucky", seed), "catican")[0]!;
  assertTape(ep, `seed ${seed}`);
  sequences.add(ep.beats.map((b) => b.speaker).join(">"));
}
assert.ok(sequences.size >= 2, `same speaker order every seed: ${[...sequences].join(" | ")}`);

s = lockSchedule(s);
s = { ...simGame(s), pendingPresser: null };
s = { ...simWeek(s), pendingPresser: null };
const eps = episodesOf(s, "catican");
assert.ok(eps.length >= 2, `catalog ${eps.length}`);
assert.ok(eps.every((e) => e.title && e.runtime && e.beats.length >= 4), "hole in the catalog");
const ids = new Set(eps.map((e) => e.id));
assert.equal(ids.size, eps.length, "duplicate episode ids");
assertTape(eps[0]!, "live");

s = dynasty("duke", 22);
s = lockSchedule(s);
s = { ...simWeek(s), pendingPresser: null };
const away = episodesOf(s, "catican")[0];
assert.ok(away, "catican silent if you don't coach kentucky");
assertTape(away!, "away");

const live = lockSchedule(dynasty("kentucky", 19));
const played = { ...simWeek({ ...simGame(live), pendingPresser: null }), pendingPresser: null };
const bye = tickPodcasts({ ...played, week: played.week + 6, phase: "regular" });
assertTape(episodesOf(bye, "catican")[0]!, "bye");

const off = tickPodcasts({ ...played, phase: "offseason" });
assertTape(episodesOf(off, "catican")[0]!, "offseason");

const boardIn: SelectionBoard = {
  autos: {},
  ncaa: [{ teamId: "kentucky", seed: 4, region: "South", path: "at-large" }],
  nit: [],
  crown: [],
};
const marchIn = tickPodcasts({ ...played, phase: "selection", selection: boardIn } as GameState);
assertTape(episodesOf(marchIn, "catican")[0]!, "march-in");

const marchOut = tickPodcasts({ ...played, phase: "selection", selection: { autos: {}, ncaa: [], nit: ["kentucky"], crown: [] } } as GameState);
assertTape(episodesOf(marchOut, "catican")[0]!, "march-out");

const champ = tickPodcasts({
  ...played,
  phase: "ncaa",
  selection: { ...boardIn, ncaa: [{ teamId: "kentucky", seed: 1, region: "South", path: "at-large" }], champ: "kentucky" },
} as GameState);
assertTape(episodesOf(champ, "catican")[0]!, "champ");

dump("CAMP", camp[0]!);
dump("LIVE", eps[0]!);
dump("BYE", episodesOf(bye, "catican")[0]!);
dump("MARCH IN", episodesOf(marchIn, "catican")[0]!);
dump("CHAMP", episodesOf(champ, "catican")[0]!);
dump("OFF", episodesOf(off, "catican")[0]!);

console.log("\nCAMP", camp[0]!.title);
console.log("SEQS", sequences.size, [...sequences].join(" || "));
console.log("LIVE", eps[0]!.title, eps[0]!.runtime);
console.log("PODCAST OK", eps.length);
