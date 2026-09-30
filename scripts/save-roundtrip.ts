import assert from "node:assert/strict";

const mem = new Map<string, string>();
const store: Storage = {
  get length() { return mem.size; },
  clear() { mem.clear(); },
  getItem(k) { return mem.get(k) ?? null; },
  key(i) { return [...mem.keys()][i] ?? null; },
  removeItem(k) { mem.delete(k); },
  setItem(k, v) { mem.set(k, String(v)); },
};
(globalThis as { window?: unknown }).window = { localStorage: store, sessionStorage: store };

const { newDynasty, simWeek } = await import("../src/game/engine");
const { deleteSlot, listSaves, loadSave, loadSlot, saveNamed, writeSave } = await import("../src/game/persist");

let s = newDynasty("kentucky", 99, { careerMode: false });
s = simWeek(s);
s = simWeek(s);
writeSave(s);
const auto = loadSave();
assert.ok(auto);
assert.equal(auto!.playerTeamId, "kentucky");
assert.equal(auto!.season, s.season);
assert.equal(auto!.week, s.week);
assert.equal(auto!.identity.last, "Stone");

const named = saveNamed(s, "UK week test");
assert.equal(named.ok, true);
assert.ok(named.id);
const files = listSaves();
assert.ok(files.some((f) => f.auto));
assert.ok(files.some((f) => f.name === "UK week test"));
const loaded = loadSlot(named.id!);
assert.ok(loaded);
assert.equal(loaded!.week, s.week);
assert.equal(loaded!.history.seasons, s.history.seasons);
assert.deepEqual(loaded!.teams.kentucky?.wins, s.teams.kentucky?.wins);

s = { ...s, week: s.week + 3 };
writeSave(s);
const auto2 = loadSave();
assert.equal(auto2!.week, s.week);
const frozen = loadSlot(named.id!);
assert.equal(frozen!.week, loaded!.week, "manual slot must not change when autosave advances");

deleteSlot(named.id!);
assert.equal(listSaves().some((f) => f.id === named.id), false);

console.log("MANUAL SAVE OK", `auto week ${auto2!.week}`, `file week ${frozen!.week}`, `slots ${listSaves().map((f) => f.name).join(", ")}`);
