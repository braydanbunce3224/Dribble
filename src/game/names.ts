import { CONFERENCES, TEAMS } from "./teams";
import type { ConferenceId } from "./types";

const KEY = "dribble-2026.names.v1";

export interface NameRow {
  name?: string;
  mascot?: string;
  abbr?: string;
}

export interface ConfRow {
  name?: string;
  short?: string;
}

export interface NamePack {
  kind: "dribble-2026-names";
  version: 1;
  id?: string;
  title: string;
  note?: string;
  teams?: Record<string, NameRow>;
  conferences?: Record<string, ConfRow>;
}

export type ParseResult = { ok: true; pack: NamePack } | { ok: false; error: string };

const BASE_TEAMS = TEAMS.map((t) => ({ id: t.id, name: t.name, mascot: t.mascot, abbr: t.abbr }));
const BASE_CONFS = CONFERENCES.map((c) => ({ id: c.id, name: c.name, short: c.short }));
const KNOWN_IDS = new Set(TEAMS.map((t) => t.id));
const KNOWN_CONFS = new Set(CONFERENCES.map((c) => c.id));

let active: NamePack | null = null;

export function activePack(): NamePack | null {
  return active;
}

export function packTitle(): string {
  return active?.title ?? "Facsimile names";
}

export function snapshotPack(): NamePack {
  if (!active) {
    return { kind: "dribble-2026-names", version: 1, title: "Facsimile names", teams: {} };
  }
  return {
    kind: "dribble-2026-names",
    version: 1,
    id: active.id,
    title: active.title,
    note: active.note,
    teams: active.teams ? { ...active.teams } : undefined,
    conferences: active.conferences ? { ...active.conferences } : undefined,
  };
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function restoreBase() {
  const byId = Object.fromEntries(BASE_TEAMS.map((t) => [t.id, t]));
  for (const t of TEAMS) {
    const b = byId[t.id];
    if (!b) continue;
    t.name = b.name;
    t.mascot = b.mascot;
    t.abbr = b.abbr;
  }
  const conf = Object.fromEntries(BASE_CONFS.map((c) => [c.id, c]));
  for (const c of CONFERENCES) {
    const b = conf[c.id];
    if (!b) continue;
    c.name = b.name;
    c.short = b.short;
  }
}

function paint(pack: NamePack) {
  restoreBase();
  const teams = pack.teams ?? {};
  for (const t of TEAMS) {
    const row = teams[t.id];
    if (!row) continue;
    if (row.name?.trim()) t.name = row.name.trim();
    if (row.mascot?.trim()) t.mascot = row.mascot.trim();
    if (row.abbr?.trim()) t.abbr = row.abbr.trim();
  }
  const confs = pack.conferences ?? {};
  for (const c of CONFERENCES) {
    const row = confs[c.id];
    if (!row) continue;
    if (row.name?.trim()) c.name = row.name.trim();
    if (row.short?.trim()) c.short = row.short.trim();
  }
  active = pack;
}

function asRow(v: unknown): NameRow | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : typeof o.school === "string" ? o.school : undefined;
  const mascot = typeof o.mascot === "string" ? o.mascot : typeof o.nickname === "string" ? o.nickname : undefined;
  const abbr = typeof o.abbr === "string" ? o.abbr : typeof o.abbreviation === "string" ? o.abbreviation : undefined;
  if (!name && !mascot && !abbr) return null;
  return { name, mascot, abbr };
}

function finishPack(
  teams: Record<string, NameRow>,
  conferences: Record<string, ConfRow> | undefined,
  title: string,
  extra?: { id?: string; note?: string },
): ParseResult {
  const hits = Object.keys(teams).filter((id) => KNOWN_IDS.has(id)).length;
  if (hits < 1) return { ok: false, error: "No matching school ids in that pack." };
  return {
    ok: true,
    pack: {
      kind: "dribble-2026-names",
      version: 1,
      id: extra?.id,
      title: title.trim() || "Custom names",
      note: extra?.note,
      teams,
      conferences,
    },
  };
}

function teamsFromUnknown(raw: unknown): Record<string, NameRow> | null {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    const teams: Record<string, NameRow> = {};
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : typeof o.teamId === "string" ? o.teamId : "";
      const row = asRow(o);
      if (id && row) teams[id] = row;
    }
    return teams;
  }
  const teams: Record<string, NameRow> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const row = asRow(v);
    if (row) teams[id] = row;
  }
  return teams;
}

export function parseNamePack(raw: unknown): ParseResult {
  if (raw == null) return { ok: false, error: "That file is empty." };
  if (typeof raw === "string") return parseNameText(raw);
  if (typeof raw !== "object") return { ok: false, error: "That file is empty." };

  if (Array.isArray(raw)) {
    const teams = teamsFromUnknown(raw);
    if (!teams) return { ok: false, error: "No matching school ids in that pack." };
    return finishPack(teams, undefined, "Custom names");
  }

  const o = raw as Record<string, unknown>;
  const extra = {
    id: typeof o.id === "string" ? o.id : undefined,
    note: typeof o.note === "string" ? o.note : undefined,
  };
  const title =
    typeof o.title === "string" && o.title.trim()
      ? o.title.trim()
      : extra.id === "real-schools"
        ? "Real school names"
        : "Custom names";

  if (o.teams && typeof o.teams === "object") {
    const teams = teamsFromUnknown(o.teams);
    if (!teams) return { ok: false, error: "teams must be keyed by school id." };
    const conferences =
      o.conferences && typeof o.conferences === "object" && !Array.isArray(o.conferences)
        ? (o.conferences as Record<string, ConfRow>)
        : undefined;
    if (o.kind && o.kind !== "dribble-2026-names") {
      return { ok: false, error: "Not a Dribble names pack." };
    }
    return finishPack(teams, conferences, title, extra);
  }

  const flat = teamsFromUnknown(o);
  const hits = flat ? Object.keys(flat).filter((id) => KNOWN_IDS.has(id)).length : 0;
  if (flat && hits >= 1) return finishPack(flat, undefined, title, extra);

  return { ok: false, error: "Not a Dribble names pack. Use JSON or CSV with school ids." };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === "," || ch === "\t") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function csvHeaderIndex(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    map[h.trim().toLowerCase().replace(/[\s_]+/g, "")] = i;
  });
  return map;
}

function col(row: string[], idx: Record<string, number>, ...names: string[]): string {
  for (const n of names) {
    const i = idx[n];
    if (i != null && row[i]) return row[i]!.trim();
  }
  return "";
}

export function parseCsvPack(text: string, title = "Custom names"): ParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));
  if (lines.length < 2) return { ok: false, error: "CSV needs a header row and at least one school." };
  const header = parseCsvLine(lines[0]!);
  const idx = csvHeaderIndex(header);
  if (idx.id == null && idx.teamid == null && idx.schoolid == null) {
    return { ok: false, error: "CSV needs an id column (kentucky, duke, unc, …)." };
  }
  const teams: Record<string, NameRow> = {};
  const conferences: Record<string, ConfRow> = {};
  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const id = col(row, idx, "id", "teamid", "schoolid");
    if (!id) continue;
    if (KNOWN_CONFS.has(id as ConferenceId) && !KNOWN_IDS.has(id)) {
      const name = col(row, idx, "name", "conference", "conf");
      const short = col(row, idx, "short", "abbr", "abbreviation");
      if (name || short) conferences[id] = { name: name || undefined, short: short || undefined };
      continue;
    }
    const name = col(row, idx, "name", "school", "schoolname", "team");
    const mascot = col(row, idx, "mascot", "nickname", "nick");
    const abbr = col(row, idx, "abbr", "abbreviation", "code");
    if (!name && !mascot && !abbr) continue;
    teams[id] = { name: name || undefined, mascot: mascot || undefined, abbr: abbr || undefined };
  }
  return finishPack(teams, Object.keys(conferences).length ? conferences : undefined, title);
}

export function parseNameText(raw: string): ParseResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "That file is empty." };
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return parseNamePack(JSON.parse(text) as unknown);
    } catch {
      return { ok: false, error: "That JSON didn't parse." };
    }
  }
  const titleLine = text.split(/\r?\n/).find((l) => /^\s*#\s*title:/i.test(l));
  const title = titleLine ? titleLine.replace(/^\s*#\s*title:\s*/i, "").trim() : "Custom names";
  return parseCsvPack(text, title || "Custom names");
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function packToTxt(pack: NamePack): string {
  const head = [
    "# Dribble names pack",
    "# kind: dribble-2026-names",
    `# title: ${pack.title}`,
    pack.note ? `# note: ${pack.note}` : "",
    "# Import this .txt in School names (file, paste, or copy).",
    "",
  ].filter((l) => l !== "");
  return `${head.join("\n")}\n${packToCsv(pack)}`;
}

export function packToCsv(pack: NamePack): string {
  const lines = ["id,name,mascot,abbr"];
  const teams = pack.teams ?? {};
  for (const t of TEAMS) {
    const row = teams[t.id];
    if (!row) continue;
    lines.push(
      [t.id, csvCell(row.name ?? ""), csvCell(row.mascot ?? ""), csvCell(row.abbr ?? "")].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function restorePack(pack: NamePack) {
  paint({
    kind: "dribble-2026-names",
    version: 1,
    id: pack.id,
    title: pack.title.trim() || "Facsimile names",
    note: pack.note,
    teams: pack.teams ?? {},
    conferences: pack.conferences,
  });
  try {
    storage()?.setItem(KEY, JSON.stringify(active));
  } catch {
    /* private mode */
  }
}

export function applyNamePack(pack: NamePack): number {
  const incoming = pack.teams ?? {};
  const hits = Object.keys(incoming).filter((id) => KNOWN_IDS.has(id)).length;
  const merged = currentAsPack(pack.title.trim() || "Custom names");
  merged.id = pack.id ?? "custom";
  merged.note = pack.note;
  for (const [id, row] of Object.entries(incoming)) {
    if (!KNOWN_IDS.has(id)) continue;
    merged.teams![id] = {
      name: row.name?.trim() || merged.teams![id]?.name,
      mascot: row.mascot?.trim() || merged.teams![id]?.mascot,
      abbr: row.abbr?.trim() || merged.teams![id]?.abbr,
    };
  }
  if (pack.conferences) {
    merged.conferences = { ...(merged.conferences ?? {}) };
    for (const [id, row] of Object.entries(pack.conferences)) {
      merged.conferences[id] = {
        name: row.name?.trim() || merged.conferences[id]?.name,
        short: row.short?.trim() || merged.conferences[id]?.short,
      };
    }
  }
  paint(merged);
  try {
    storage()?.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* private mode */
  }
  return hits;
}

export function resetNames() {
  const pack = facsimilePack();
  paint(pack);
  try {
    storage()?.setItem(KEY, JSON.stringify(pack));
  } catch {
    /* ignore */
  }
}

export async function ensureDefaultNames(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (storage()?.getItem(KEY)) return false;
    if (active?.id) return false;
    const parsed = await loadRealSchoolsPack();
    if (!parsed.ok) return false;
    restorePack(parsed.pack);
    return true;
  } catch {
    return false;
  }
}

export function loadSavedNames() {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return;
    const parsed = parseNamePack(JSON.parse(raw));
    if (parsed.ok) paint(parsed.pack);
  } catch {
    /* bad save */
  }
}

export function currentAsPack(title = packTitle()): NamePack {
  const teams: Record<string, NameRow> = {};
  for (const t of TEAMS) teams[t.id] = { name: t.name, mascot: t.mascot, abbr: t.abbr };
  const conferences: Record<string, ConfRow> = {};
  for (const c of CONFERENCES) conferences[c.id as ConferenceId] = { name: c.name, short: c.short };
  return {
    kind: "dribble-2026-names",
    version: 1,
    id: active?.id,
    title,
    note: active?.note,
    teams,
    conferences,
  };
}

export function facsimilePack(): NamePack {
  const teams: Record<string, NameRow> = {};
  for (const t of BASE_TEAMS) teams[t.id] = { name: t.name, mascot: t.mascot, abbr: t.abbr };
  const conferences: Record<string, ConfRow> = {};
  for (const c of BASE_CONFS) conferences[c.id] = { name: c.name, short: c.short };
  return {
    kind: "dribble-2026-names",
    version: 1,
    id: "facsimile",
    title: "Facsimile names",
    note: "Shipped Dribble names. Edit and re-import as a custom pack.",
    teams,
    conferences,
  };
}

export function customTemplatePack(): NamePack {
  const pack = facsimilePack();
  pack.id = "custom-template";
  pack.title = "Custom names";
  pack.note = "Edit name, mascot, and abbr for any school id, then import this file in Names.";
  return pack;
}

export function examplePackJson(): string {
  return JSON.stringify(
    {
      kind: "dribble-2026-names",
      version: 1,
      title: "My custom names",
      teams: {
        kentucky: { name: "Kentucky", mascot: "Wildcats", abbr: "UK" },
        duke: { name: "Duke", mascot: "Blue Devils", abbr: "DUKE" },
        unc: { name: "North Carolina", mascot: "Tar Heels", abbr: "UNC" },
      },
    },
    null,
    2,
  );
}

export async function loadRealSchoolsPack(): Promise<ParseResult> {
  const urls = ["/packs/real-schools.json", "./packs/real-schools.json"];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return parseNamePack(await res.json());
    } catch {
      /* next */
    }
  }
  try {
    const mod = await import("./packs/real-schools.json");
    return parseNamePack((mod as { default?: unknown }).default ?? mod);
  } catch {
    return { ok: false, error: "Real Schools pack isn't on this build." };
  }
}

if (typeof window !== "undefined") loadSavedNames();
