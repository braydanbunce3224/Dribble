import assert from "node:assert/strict";
import { newDynasty, pepTalk, setPlayerMpg } from "../src/game/engine";
import { teamChemistry } from "../src/game/chemistry";

let s = newDynasty("utah-state", 9, { identity: { first: "A", last: "Coach", age: 40, almaMaterId: "utah-state" } });
const base = teamChemistry(s, s.playerTeamId);
assert.ok(base.score >= 50 && base.score <= 90, `base ${base.score}`);
assert.ok(base.voice, "voice");

const hog = s.players.filter((p) => p.teamId === s.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0]!;
s = setPlayerMpg(s, hog.id, 40);
for (const p of s.players.filter((x) => x.teamId === s.playerTeamId && x.id !== hog.id).slice(0, 4)) {
  s = setPlayerMpg(s, p.id, 8);
}
const broken = teamChemistry(s, s.playerTeamId);
assert.ok(broken.score < base.score, `hog ${broken.score} vs ${base.score}`);
assert.ok(broken.roles < base.roles, "roles drop");

const voice = broken.voice!;
s = pepTalk(s, voice.id).state;
const after = teamChemistry(s, s.playerTeamId);
assert.ok(after.locker >= broken.locker, "pep helps locker");
console.log("BASE", base.score, base.label, base.note);
console.log("HOG", broken.score, broken.label, broken.note);
console.log("PEP", after.score, after.locker);
console.log("CHEM OK");
