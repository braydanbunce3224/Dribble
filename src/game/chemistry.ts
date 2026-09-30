import type { GameState, Player } from "./types";
import { clamp } from "./rng";
import { effectiveMpg, isOut } from "./college";

let cacheKey = "";
let cache = new Map<string, ChemReport>();
let rosters = new Map<string, Player[]>();

export function bustChemCache() {
  cacheKey = "";
  cache = new Map();
  rosters = new Map();
}

function ensureIndex(state: GameState) {
  let h = state.players.length * 2654435761;
  for (const p of state.players) {
    h = (h + p.mpg * 17 + p.morale * 13 + (p.injury ? p.injury.weeksLeft * 29 : 0)) | 0;
  }
  const k = `${state.season}:${state.week}:${state.phase}:${h}:${state.coachSkills?.leadership ?? 50}:${state.depth?.captainId ?? ""}`;
  if (k === cacheKey && rosters.size) return;
  cacheKey = k;
  cache = new Map();
  rosters = new Map();
  for (const p of state.players) {
    const a = rosters.get(p.teamId);
    if (a) a.push(p);
    else rosters.set(p.teamId, [p]);
  }
}

export function teamRoster(state: GameState, teamId: string): Player[] {
  ensureIndex(state);
  return rosters.get(teamId) ?? [];
}

export interface ChemReport {
  score: number;
  label: "Great" | "Good" | "Fine" | "Shaky" | "Bad";
  roles: number;
  continuity: number;
  locker: number;
  trust: number;
  voice: Player | null;
  hog: Player | null;
  note: string;
}

function rotation(players: Player[]) {
  return players
    .filter((p) => !isOut(p) && effectiveMpg(p) > 0)
    .slice()
    .sort((a, b) => effectiveMpg(b) - effectiveMpg(a) || b.ovr - a.ovr)
    .slice(0, 8);
}

export function lockerVoice(players: Player[]): Player | null {
  const pool = players.filter((p) => p.year >= 3);
  if (!pool.length) return players.slice().sort((a, b) => b.skills.iq * b.mpg - a.skills.iq * a.mpg)[0] ?? null;
  return pool.slice().sort((a, b) => b.year * b.skills.iq * (8 + b.mpg) - a.year * a.skills.iq * (8 + a.mpg))[0] ?? null;
}

function rolesScore(rot: Player[]) {
  const total = rot.reduce((n, p) => n + p.mpg, 0);
  let s = 78 - Math.abs(total - 200) / 3.2;
  const starters = rot.slice(0, 5);
  const bench = rot.slice(5);
  for (const p of starters) {
    if (p.mpg > 36) s -= (p.mpg - 36) * 1.6;
    else if (p.mpg < 22) s -= (22 - p.mpg) * 0.9;
  }
  for (const p of bench) {
    if (p.mpg > 22) s -= (p.mpg - 22) * 1.1;
    if (p.mpg < 8) s -= 3;
  }
  const byPos: Record<string, number> = {};
  for (const p of starters) byPos[p.pos] = (byPos[p.pos] ?? 0) + 1;
  for (const n of Object.values(byPos)) if (n >= 3) s -= 8;
  const hog = rot[0];
  if (hog && hog.mpg >= 38 && (rot[1]?.mpg ?? 0) < 16) s -= 10;
  return clamp(Math.round(s), 18, 96);
}

function continuityScore(rot: Player[], week: number) {
  const mpg = rot.reduce((n, p) => n + Math.max(1, p.mpg), 0);
  const ret = rot.filter((p) => p.year >= 2).reduce((n, p) => n + p.mpg, 0);
  const fresh = rot.filter((p) => p.year === 1).reduce((n, p) => n + p.mpg, 0);
  const seniors = rot.filter((p) => p.year >= 4).reduce((n, p) => n + p.mpg, 0);
  let s = 38 + (ret / mpg) * 52;
  const freshShare = fresh / mpg;
  if (freshShare > 0.42) s -= 16;
  else if (freshShare > 0.32) s -= 8;
  if (week > 0 && week < 5) s -= freshShare * 14;
  if (week >= 10) s += Math.min(6, week - 9);
  if (seniors / mpg < 0.08) s -= 6;
  if (seniors / mpg > 0.55) s -= 4;
  return clamp(Math.round(s), 18, 96);
}

function lockerScore(rot: Player[], voice: Player | null) {
  const mpg = rot.reduce((n, p) => n + Math.max(1, p.mpg), 0);
  const weighted = rot.reduce((n, p) => n + p.morale * p.mpg, 0) / mpg;
  let s = weighted;
  const star = rot[0];
  if (star && star.morale < 52) s -= 14;
  else if (star && star.morale < 62) s -= 6;
  if (voice && voice.morale < 50) s -= 12;
  const mean = rot.reduce((n, p) => n + p.morale, 0) / rot.length;
  const spread = Math.sqrt(rot.reduce((n, p) => n + (p.morale - mean) ** 2, 0) / rot.length);
  if (spread > 18) s -= 8;
  return clamp(Math.round(s), 18, 96);
}

function trustScore(rot: Player[], lead: number) {
  const iq = rot.reduce((n, p) => n + p.skills.iq, 0) / rot.length;
  const pos = new Set(rot.slice(0, 5).map((p) => p.pos)).size;
  let s = iq * 0.72 + (pos / 5) * 18 + (lead - 50) * 0.22;
  const top = rot.slice(0, 5);
  let pair = 0;
  let n = 0;
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = top[i]!;
      const b = top[j]!;
      pair += (a.skills.iq + b.skills.iq) / 2 - Math.abs(a.morale - b.morale) / 5;
      n++;
    }
  }
  if (n) s = s * 0.7 + (pair / n) * 0.3;
  return clamp(Math.round(s), 18, 96);
}

export function chemLabel(score: number): ChemReport["label"] {
  if (score >= 80) return "Great";
  if (score >= 68) return "Good";
  if (score >= 55) return "Fine";
  if (score >= 42) return "Shaky";
  return "Bad";
}

export function teamChemistry(state: GameState, teamId: string): ChemReport {
  ensureIndex(state);
  const hit = cache.get(teamId);
  if (hit) return hit;
  const players = rosters.get(teamId) ?? [];
  const rot = rotation(players);
  if (!rot.length) {
    return { score: 55, label: "Fine", roles: 55, continuity: 55, locker: 55, trust: 55, voice: null, hog: null, note: "No rotation yet." };
  }
  const voice = (teamId === state.playerTeamId && state.depth?.captainId
    ? players.find((p) => p.id === state.depth?.captainId) ?? lockerVoice(players)
    : lockerVoice(players));
  const roles = rolesScore(rot);
  const continuity = continuityScore(rot, state.week);
  const locker = lockerScore(rot, voice);
  const trust = trustScore(rot, state.playerTeamId === teamId ? (state.coachSkills?.leadership ?? 50) : 50);
  const score = clamp(Math.round(roles * 0.28 + continuity * 0.22 + locker * 0.28 + trust * 0.22), 18, 96);
  const hog = rot[0] && rot[0].mpg >= 36 ? rot[0] : null;
  const note = diagnose(roles, continuity, locker, trust, rot, voice, hog, state.week);
  const report = { score, label: chemLabel(score), roles, continuity, locker, trust, voice, hog, note };
  cache.set(teamId, report);
  return report;
}

function diagnose(
  roles: number,
  continuity: number,
  locker: number,
  trust: number,
  rot: Player[],
  voice: Player | null,
  hog: Player | null,
  week: number,
): string {
  const pillars: [number, string][] = [
    [roles, "roles"],
    [locker, "locker"],
    [continuity, "continuity"],
    [trust, "trust"],
  ];
  const weakest = pillars.sort((a, b) => a[0] - b[0])[0]!;
  if (hog) return `${hog.first} is taking too many shots.`;
  if (voice && voice.morale < 50) return `${voice.first} isn't happy. Talk to him.`;
  if (weakest[1] === "roles") return "The rotation isn't clear yet.";
  if (weakest[1] === "continuity") {
    return week < 6
      ? "Too many new guys in the lineup."
      : "Nobody has the last shot yet.";
  }
  if (weakest[1] === "locker" && locker < 58) return "The locker room is split.";
  if (trust < 58) return "They don't trust each other yet.";
  if (roles >= 74 && locker >= 74) return "The ball is moving. Roles are set.";
  return "The group is fine. Keep the minutes fair.";
}

export function chemistryEdge(state: GameState, homeId: string, awayId: string) {
  return (teamChemistry(state, homeId).score - teamChemistry(state, awayId).score) / 28;
}

export function applyChemistryWeek(state: GameState): Player[] {
  const you = state.playerTeamId;
  const c = teamChemistry(state, you);
  return state.players.map((p) => {
    if (p.teamId !== you) return p;
    let m = p.morale;
    if (c.score >= 78) m += 1;
    else if (c.score <= 42) m -= p.mpg < 12 ? 2 : 1;
    else if (c.score <= 52) m -= p.mpg < 14 ? 1 : 0;
    if (p.year >= 3 && p.mpg < 14) m -= 1;
    if (p.year === 1 && p.mpg >= 18 && c.roles >= 60) m += 1;
    if (c.hog && p.id !== c.hog.id && p.mpg < 16) m -= 1;
    return { ...p, morale: clamp(m, 18, 99) };
  });
}