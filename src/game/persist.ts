import type { GameResult, GameSlot, GameState, Player, Recruit, Transfer } from "./types";
import { SAVE_VERSION } from "./types";
import { hydrateState } from "./develop";
import { identityName } from "./engine-util";
import { restorePack } from "./names";
import type { NamePack } from "./names";
import lz from "lz-string";

const KEY = "dribble-2026.save.v1";
const INDEX_KEY = "dribble-2026.slots.index";
const TUTORIAL_KEY = "dribble-2026.tutorial";
const MAX_MANUAL = 8;
const ROOM = "This device is out of save room. Delete an old file and try again.";

export interface SaveMeta {
  id: string;
  name: string;
  updatedAt: number;
  teamId: string;
  season: number;
  wins: number;
  losses: number;
  coach: string;
  auto?: boolean;
}

let cached: Storage | null | undefined;
const bodies = new Map<string, string>();
let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;
let idbOn = false;
let readyP: Promise<void> | null = null;
let writeGen = 0;
const genByKey = new Map<string, number>();
const fromIdb = new Set<string>();

const DB_NAME = "dribble-2026";
const DB_STORE = "files";

function storage(): Storage | null {
  if (cached !== undefined) return cached;
  try {
    const s = window.localStorage;
    try {
      s.setItem("__d26", "1");
      s.removeItem("__d26");
    } catch (e) {
      // A full disk still has the old files. Don't abandon them for sessionStorage.
      if (!quotaError(e)) throw e;
    }
    cached = s;
    return s;
  } catch {
    try {
      cached = window.sessionStorage;
      return cached;
    } catch {
      cached = null;
      return null;
    }
  }
}

function slotKey(id: string) {
  return `dribble-2026.slot.${id}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (db) return Promise.resolve(db);
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      let req: IDBOpenDBRequest;
      try {
        req = indexedDB.open(DB_NAME, 1);
      } catch {
        resolve(null);
        return;
      }
      req.onupgradeneeded = () => {
        const opened = req.result;
        if (!opened.objectStoreNames.contains(DB_STORE)) opened.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => {
        db = req.result;
        resolve(db);
      };
      req.onerror = () => resolve(null);
    });
  }
  return dbPromise;
}

function idbAll(): Promise<{ keys: string[]; values: string[] } | null> {
  if (!db) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const tx = db!.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const keysReq = store.getAllKeys();
      const valsReq = store.getAll();
      let keys: string[] | null = null;
      let values: string[] | null = null;
      const finish = () => {
        if (!keys || !values) return;
        resolve({ keys, values });
      };
      keysReq.onsuccess = () => {
        keys = Array.from(keysReq.result).map((k) => String(k));
        finish();
      };
      valsReq.onsuccess = () => {
        values = Array.from(valsReq.result as string[]).map((v) => String(v));
        finish();
      };
      keysReq.onerror = () => resolve(null);
      valsReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function moveLocalFile(key: string, raw: string) {
  if (!db) return false;
  const dest = key === KEY || key === "hoops-hero.save.v7" ? slotKey("auto") : key;
  if (!fromIdb.has(dest)) {
    try {
      db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).put(raw, dest);
      bodies.set(dest, raw);
      fromIdb.add(dest);
    } catch {
      return false;
    }
  }
  try {
    storage()?.removeItem(key);
  } catch {
    /* copied already — still try to free the old key next time */
  }
  return true;
}

function migrateLocal() {
  const s = storage();
  if (!s || !db) return;
  const found: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (!k) continue;
    if (k.startsWith("dribble-2026.slot.") || k === KEY || k === "hoops-hero.save.v7") found.push(k);
  }
  const ordered = [
    ...found.filter((k) => k.startsWith("dribble-2026.slot.")),
    ...found.filter((k) => k === KEY || k === "hoops-hero.save.v7"),
  ];
  for (const k of ordered) {
    const raw = s.getItem(k);
    if (raw == null) continue;
    moveLocalFile(k, raw);
  }
}

async function bootSaves() {
  const opened = await openDb();
  if (!opened) return;
  const all = await idbAll();
  if (all) {
    for (let i = 0; i < all.keys.length; i++) {
      const k = all.keys[i]!;
      bodies.set(k, all.values[i] ?? "");
      fromIdb.add(k);
    }
  }
  migrateLocal();
  idbOn = true;
}

/** Resolves once existing files can be read. Safe to call more than once. */
export function whenSavesReady(): Promise<void> {
  if (!readyP) readyP = bootSaves();
  return readyP;
}

export function hasAnySave(): boolean {
  if (readIndex().length > 0) return true;
  if (bodies.has(slotKey("auto"))) return true;
  const s = storage();
  if (!s) return false;
  if (s.getItem(slotKey("auto")) || s.getItem(KEY) || s.getItem("hoops-hero.save.v7")) return true;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith("dribble-2026.slot.")) return true;
  }
  return false;
}

function readRaw(id: string): string | null {
  const key = slotKey(id);
  if (bodies.has(key)) return bodies.get(key) ?? null;
  const s = storage();
  const direct = s?.getItem(key);
  if (direct) return direct;
  if (id !== "auto") return null;
  return s?.getItem(KEY) ?? s?.getItem("hoops-hero.save.v7") ?? null;
}

function readIndex(): SaveMeta[] {
  try {
    const raw = storage()?.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SaveMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(list: SaveMeta[]) {
  const s = storage();
  if (!s) return;
  const text = JSON.stringify(list);
  try {
    s.setItem(INDEX_KEY, text);
  } catch (e) {
    if (!quotaError(e) || !idbOn) throw e;
    const doomed: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && (k.startsWith("dribble-2026.slot.") || k === KEY)) doomed.push(k);
    }
    for (const k of doomed) {
      try {
        s.removeItem(k);
      } catch {
        /* ignore */
      }
    }
    s.setItem(INDEX_KEY, text);
  }
}

function metaOf(state: GameState, id: string, name: string, auto: boolean): SaveMeta {
  const t = state.teams[state.playerTeamId];
  return {
    id,
    name,
    updatedAt: Date.now(),
    teamId: state.playerTeamId,
    season: state.season,
    wins: t?.wins ?? 0,
    losses: t?.losses ?? 0,
    coach: identityName(state.identity),
    auto,
  };
}

function slimInterest(interest: Record<string, number> | undefined, you: string): Record<string, number> {
  const src = interest && typeof interest === "object" ? interest : {};
  const youV = src[you];
  const top = Object.entries(src).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const next: Record<string, number> = {};
  for (const [k, v] of top) next[k] = v;
  if (youV != null) next[you] = youV;
  return next;
}

function slimPlayer(p: Player, you: string): Player | Omit<Player, "skills" | "growth" | "awards"> {
  if (p.teamId === you) return p;
  return {
    id: p.id,
    first: p.first,
    last: p.last,
    pos: p.pos,
    year: p.year,
    ovr: p.ovr,
    potential: p.potential,
    morale: p.morale,
    teamId: p.teamId,
    mpg: p.mpg,
    seasonMinutes: p.seasonMinutes ?? 0,
    seasonGames: p.seasonGames ?? 0,
    careerMinutes: p.careerMinutes ?? 0,
    careerGames: p.careerGames ?? 0,
    usage: p.usage,
    redshirt: p.redshirt || undefined,
    usedRedshirt: p.usedRedshirt || undefined,
    injury: p.injury,
    country: p.country,
    freak: p.freak,
    freakTag: p.freakTag,
    height: p.height,
    portalFrom: p.portalFrom,
    portalSeason: p.portalSeason,
    skills: p.skills,
  } as Player;
}

function slimRecruit(r: Recruit, you: string): Recruit {
  return {
    ...r,
    interest: slimInterest(r.interest, you),
    offers: (r.offers ?? []).slice(0, 8),
    visits: (r.visits ?? []).slice(0, 6),
  };
}

function slimTransfer(t: Transfer, you: string): Transfer {
  return {
    ...t,
    interest: slimInterest(t.interest, you),
    offers: (t.offers ?? []).slice(0, 8),
    visits: (t.visits ?? []).slice(0, 6),
  };
}

function slimResult(r: GameResult, you: string): GameResult {
  const yours = r.homeId === you || r.awayId === you;
  if (yours) return r;
  return {
    id: r.id,
    slotId: r.slotId,
    homeId: r.homeId,
    awayId: r.awayId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    week: r.week,
  };
}

export function slimState(state: GameState): GameState {
  const you = state.playerTeamId;
  const live = state.liveGame
    ? { ...state.liveGame, log: (state.liveGame.log ?? []).slice(-48) }
    : null;
  const teams = Object.fromEntries(
    Object.entries(state.teams).map(([id, t]) => {
      if (id !== you) return [id, { ...t, series: undefined }];
      const series = t.series;
      if (!series || Object.keys(series).length <= 48) return [id, t];
      return [id, { ...t, series: Object.fromEntries(Object.entries(series).slice(-48)) }];
    }),
  );
  return {
    ...state,
    version: SAVE_VERSION,
    teams,
    players: state.players.map((p) => slimPlayer(p, you) as Player),
    recruits: state.recruits.map((r) => slimRecruit(r, you)),
    results: state.results.map((r) => slimResult(r, you)),
    portal: state.portal
      ? { ...state.portal, transfers: (state.portal.transfers ?? []).map((t) => slimTransfer(t, you)) }
      : state.portal,
    news: (state.news ?? []).slice(0, 24),
    podcasts: (state.podcasts ?? []).slice(0, 32),
    coachMoves: (state.coachMoves ?? []).slice(0, 48),
    mail: (state.mail ?? []).slice(0, 24),
    awards: (state.awards ?? []).slice(-80),
    potw: (state.potw ?? []).slice(-24),
    proHistory: (state.proHistory ?? []).slice(0, 24),
    donors: (state.donors ?? []).slice(0, 16),
    liveGame: live,
    recordBook: state.recordBook,
    leaders: state.leaders
      ? {
          ...state.leaders,
          pts: (state.leaders.pts ?? []).slice(0, 25),
          reb: (state.leaders.reb ?? []).slice(0, 25),
          ast: (state.leaders.ast ?? []).slice(0, 25),
          fg: (state.leaders.fg ?? []).slice(0, 25),
          three: (state.leaders.three ?? []).slice(0, 25),
        }
      : state.leaders,
  };
}

const KIND_CODE: Record<string, string> = {
  conference: "c",
  noncon: "n",
  mte: "m",
  "conf-tourney": "t",
  ncaa: "a",
  nit: "i",
  crown: "w",
};

function packCpu(p: Player): unknown[] {
  const sk = p.skills ?? { shoot: p.ovr, finish: p.ovr, defense: p.ovr, iq: p.ovr };
  let flags = 0;
  const extra: Record<string, unknown> = {};
  if (p.redshirt) flags |= 1;
  if (p.usedRedshirt) flags |= 2;
  if (p.freak) flags |= 4;
  if (p.injury && p.injury.weeksLeft > 0) {
    flags |= 8;
    extra.injury = p.injury;
  }
  if (p.portalFrom) {
    flags |= 16;
    extra.portalFrom = p.portalFrom;
    if (p.portalSeason) extra.portalSeason = p.portalSeason;
  }
  if (p.country && p.country !== "US") {
    flags |= 32;
    extra.country = p.country;
  }
  if (p.height) {
    flags |= 64;
    extra.height = p.height;
  }
  if (p.freakTag) {
    flags |= 128;
    extra.freakTag = p.freakTag;
  }
  if (p.path) {
    flags |= 256;
    extra.path = p.path;
  }
  const row: unknown[] = [
    p.id, p.first, p.last, p.pos, p.year, p.ovr, p.potential, p.morale, p.teamId, p.mpg,
    p.seasonMinutes || 0, p.seasonGames || 0, p.careerMinutes || 0, p.careerGames || 0, p.usage ?? 0,
    sk.shoot, sk.finish, sk.defense, sk.iq,
  ];
  if (flags) row.push(flags, extra);
  return row;
}

function packSlot(g: GameSlot, you: string): GameSlot | unknown[] {
  if (g.homeId === you || g.awayId === you || g.cup) return g;
  const code = KIND_CODE[g.kind] ?? "n";
  const row: unknown[] = [g.id, g.week, g.homeId, g.awayId, code];
  const resultId = g.resultId ?? 0;
  const declined = g.declined ? 1 : 0;
  const site = g.site && g.site !== "home" ? g.site : 0;
  if (resultId || declined || site) row.push(resultId);
  if (declined || site) row.push(declined);
  if (site) row.push(site);
  return row;
}
function encode(state: GameState): string {
  const slim = slimState(state);
  const you = slim.playerTeamId;
  return JSON.stringify({
    ...slim,
    players: slim.players.map((p) => (p.teamId === you ? p : packCpu(p))),
    results: slim.results.map((r) => {
      if (r.homeId === you || r.awayId === you) return r;
      if (!r.slotId || r.slotId === r.id || r.id === `res-${r.slotId}`) {
        return [r.id, r.homeId, r.awayId, r.homeScore, r.awayScore, r.week];
      }
      return [r.id, r.slotId, r.homeId, r.awayId, r.homeScore, r.awayScore, r.week];
    }),
    schedule: slim.schedule.map((g: GameSlot) => packSlot(g, you)),
  });
}

function packText(state: GameState): string {
  return lz.compressToUTF16(encode(state));
}

function parseStored(raw: string): unknown {
  const text = raw.trim().startsWith("{") ? raw : lz.decompressFromUTF16(raw);
  if (!text) throw new Error("Empty save.");
  return JSON.parse(text);
}

export function packedSize(state: GameState) {
  return packText(state).length;
}

export function saveText(state: GameState): string {
  return encode(state);
}

export function readSaveText(raw: string): GameState {
  return hydrateSave(parseStored(raw) as GameState);
}

function quotaError(e: unknown) {
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; code?: number; message?: string };
  if (err.name === "QuotaExceededError" || err.code === 22 || err.code === 1014) return true;
  return /quota/i.test(err.message ?? "");
}

function dropOldestManual(keepId?: string) {
  const manuals = readIndex()
    .filter((m) => !m.auto && m.id !== keepId)
    .sort((a, b) => a.updatedAt - b.updatedAt);
  const oldest = manuals[0];
  if (!oldest) return false;
  const key = slotKey(oldest.id);
  bodies.delete(key);
  genByKey.delete(key);
  if (db) {
    try {
      db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).delete(key);
    } catch {
      /* ignore */
    }
  }
  try {
    storage()?.removeItem(key);
  } catch {
    /* ignore */
  }
  writeIndex(readIndex().filter((m) => m.id !== oldest.id));
  return true;
}

function putIdb(key: string, payload: string, state: GameState) {
  if (!db) return false;
  const gen = ++writeGen;
  genByKey.set(key, gen);
  bodies.set(key, payload);
  try {
    const tx = db.transaction(DB_STORE, "readwrite");
    const req = tx.objectStore(DB_STORE).put(payload, key);
    const fail = () => {
      if (genByKey.get(key) !== gen) return;
      try {
        const slim = packText(state);
        storage()?.setItem(key, slim);
        bodies.set(key, slim);
      } catch (err) {
        console.error(err);
      }
    };
    tx.onabort = fail;
    req.onerror = fail;
    return true;
  } catch (err) {
    console.error(err);
    bodies.delete(key);
    return false;
  }
}

function putSlot(id: string, name: string, state: GameState, auto: boolean) {
  const s = storage();
  if (!s && !idbOn) throw new Error("Storage is blocked on this device.");
  const key = slotKey(id);
  const commitIndex = () => {
    const next = [metaOf(state, id, name, auto), ...readIndex().filter((m) => m.id !== id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    writeIndex(next);
  };
  if (idbOn && putIdb(key, encode(state), state)) {
    commitIndex();
    return;
  }
  if (!s) throw new Error("Storage is blocked on this device.");
  const payload = packText(state);
  const commit = () => {
    s.setItem(key, payload);
    bodies.set(key, payload);
    commitIndex();
  };
  try {
    commit();
    return;
  } catch (e) {
    if (!quotaError(e)) throw e;
  }
  try {
    s.removeItem(key);
    s.removeItem(KEY);
  } catch {
    /* ignore */
  }
  try {
    commit();
    return;
  } catch (e) {
    if (!quotaError(e)) throw e;
  }
  while (dropOldestManual(id)) {
    try {
      commit();
      return;
    } catch (e) {
      if (!quotaError(e)) throw e;
    }
  }
  bodies.delete(key);
  throw new Error(ROOM);
}

export function listSaves(): SaveMeta[] {
  return readIndex().sort((a, b) => Number(b.auto) - Number(a.auto) || b.updatedAt - a.updatedAt);
}

function hydrateSave(parsed: GameState): GameState {
  if (!parsed || typeof parsed !== "object") throw new Error("Empty save.");
  const state = hydrateState({
    ...parsed,
    liveGame: parsed.liveGame ?? null,
    lastPresserWeek: parsed.lastPresserWeek ?? -9,
    recentQuestionIds: parsed.recentQuestionIds ?? [],
    namePack: parsed.namePack ?? null,
  });
  if (!state.playerTeamId) throw new Error("Save is missing a team.");
  if (state.namePack?.title) {
    restorePack({
      kind: "dribble-2026-names",
      version: 1,
      id: state.namePack.id,
      title: state.namePack.title,
      note: state.namePack.note,
      teams: state.namePack.teams,
      conferences: state.namePack.conferences,
    } as NamePack);
  }
  return state;
}

export function loadSave(): GameState | null {
  try {
    const raw = readRaw("auto");
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = parseStored(raw);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    return hydrateSave(parsed as GameState);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function loadSlot(id: string): GameState | null {
  try {
    const raw = readRaw(id);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = parseStored(raw);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    return hydrateSave(parsed as GameState);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function writeSave(state: GameState): boolean {
  try {
    const s = storage();
    if (!s) return false;
    const persist = (st: GameState) => {
      putSlot("auto", "Autosave", st, true);
      try {
        s.removeItem(KEY);
      } catch {
        /* ignore */
      }
    };
    try {
      persist(state);
      return true;
    } catch {
      try {
        s.removeItem(KEY);
        persist({
          ...state,
          news: (state.news ?? []).slice(0, 6),
          mail: (state.mail ?? []).slice(0, 8),
          liveGame: state.liveGame ? { ...state.liveGame, log: [] } : null,
        });
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function saveNamed(state: GameState, name: string): { ok: boolean; id?: string; error?: string } {
  const label = name.trim() || `Season ${state.season}`;
  const manuals = readIndex().filter((m) => !m.auto);
  const existing = manuals.find((m) => m.name === label);
  if (!existing && manuals.length >= MAX_MANUAL) {
    return { ok: false, error: `Cap is ${MAX_MANUAL} files. Delete one first.` };
  }
  try {
    const id = existing?.id ?? `m-${Date.now().toString(36)}`;
    putSlot(id, label, state, false);
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : ROOM;
    return { ok: false, error: quotaError(e) ? ROOM : msg };
  }
}

export function deleteSlot(id: string) {
  try {
    if (id === "auto") return;
    const key = slotKey(id);
    bodies.delete(key);
    genByKey.delete(key);
    if (db) {
      try {
        db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).delete(key);
      } catch {
        /* ignore */
      }
    }
    storage()?.removeItem(key);
    writeIndex(readIndex().filter((m) => m.id !== id));
  } catch {
    /* */
  }
}

export function clearSave() {
  try {
    const key = slotKey("auto");
    bodies.delete(key);
    genByKey.delete(key);
    if (db) {
      try {
        db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).delete(key);
      } catch {
        /* ignore */
      }
    }
    storage()?.removeItem(KEY);
    storage()?.removeItem(key);
    writeIndex(readIndex().filter((m) => !m.auto && m.id !== "auto"));
  } catch {
    /* */
  }
}

export function tutorialDone(): boolean {
  try {
    return storage()?.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTutorialDone(done: boolean) {
  try {
    const s = storage();
    if (!s) return;
    if (done) s.setItem(TUTORIAL_KEY, "1");
    else s.removeItem(TUTORIAL_KEY);
  } catch {
    /* */
  }
}

export { MAX_MANUAL };
