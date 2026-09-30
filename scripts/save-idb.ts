import assert from "node:assert/strict";

const mem = new Map<string, string>();
let blockSlots = false;
const local: Storage = {
  get length() {
    return mem.size;
  },
  clear() {
    mem.clear();
  },
  getItem(k) {
    return mem.has(k) ? mem.get(k)! : null;
  },
  key(i) {
    return [...mem.keys()][i] ?? null;
  },
  removeItem(k) {
    mem.delete(k);
  },
  setItem(k, v) {
    if (blockSlots && k.startsWith("dribble-2026.slot.")) {
      const e = new Error("quota");
      e.name = "QuotaExceededError";
      throw e;
    }
    mem.set(k, String(v));
  },
};

const files = new Map<string, string>();
function done<T>(result: T) {
  const req = {
    result,
    error: null as unknown,
    onsuccess: null as null | (() => void),
    onerror: null as null | (() => void),
  };
  queueMicrotask(() => req.onsuccess?.());
  return req;
}
const storeApi = {
  put(value: unknown, key: IDBValidKey) {
    files.set(String(key), String(value));
    return done(key);
  },
  get(key: IDBValidKey) {
    return done(files.get(String(key)));
  },
  delete(key: IDBValidKey) {
    files.delete(String(key));
    return done(undefined);
  },
  getAll() {
    return done([...files.values()]);
  },
  getAllKeys() {
    return done([...files.keys()]);
  },
};
const db = {
  objectStoreNames: { contains: (n: string) => n === "files" && filesCreated },
  createObjectStore() {
    filesCreated = true;
    return storeApi;
  },
  transaction() {
    return { objectStore: () => storeApi, onabort: null as null | (() => void) };
  },
};
let filesCreated = false;
(globalThis as { indexedDB?: unknown; window?: unknown }).indexedDB = {
  open() {
    const req = {
      result: db,
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
      onupgradeneeded: null as null | (() => void),
    };
    queueMicrotask(() => {
      if (!filesCreated) req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  },
};
(globalThis as { window?: unknown }).window = { localStorage: local, sessionStorage: local };

const { newDynasty } = await import("../src/game/engine.ts");
const { deleteSlot, loadSave, loadSlot, saveNamed, whenSavesReady, writeSave } = await import("../src/game/persist.ts");

let s = newDynasty("kentucky", 44, { careerMode: false });
assert.equal(writeSave(s), true);
assert.ok(mem.get("dribble-2026.slot.auto"), "first write uses localStorage before IndexedDB is open");
const legacy = mem.get("dribble-2026.slot.auto")!;
assert.ok(legacy.length > 1000);
assert.equal(legacy.trim().startsWith("{"), false, "local fallback stays compressed");

await whenSavesReady();
assert.equal(mem.has("dribble-2026.slot.auto"), false, "old file leaves localStorage");
assert.ok(files.has("dribble-2026.slot.auto"), "IndexedDB keeps the old file");
assert.equal(files.get("dribble-2026.slot.auto"), legacy);
assert.equal(loadSave()?.playerTeamId, "kentucky");
assert.equal(loadSave()?.week, s.week);

blockSlots = true;
s = { ...s, week: s.week + 5 };
assert.equal(writeSave(s), true, "autosave must fit after localStorage is full");
assert.equal(mem.has("dribble-2026.slot.auto"), false);
const stored = files.get("dribble-2026.slot.auto") ?? "";
assert.ok(stored.startsWith("{"), "IndexedDB stores plain JSON");
assert.ok(stored.length > 50_000);
const back = loadSave();
assert.equal(back?.week, s.week);
assert.equal(back?.players.length, s.players.length);

const named = saveNamed(s, "Tape");
assert.equal(named.ok, true, named.error);
assert.ok(named.id);
assert.equal(mem.has(`dribble-2026.slot.${named.id}`), false);
assert.equal(loadSlot(named.id!)?.week, s.week);
deleteSlot(named.id!);
assert.equal(files.has(`dribble-2026.slot.${named.id}`), false);
assert.equal(loadSlot(named.id!), null);

console.log("IDB SAVE OK", `json ${(stored.length / 1024).toFixed(0)}kb`, `legacy ${(legacy.length / 1024).toFixed(0)}kb`);
