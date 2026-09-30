import type {
  Feedback, GameState, Player, PortalReason, PortalRole, PortalState, PortalWindow, Recruit, Transfer,
} from "./types";
import { PORTAL_SPRING_HOURS, PORTAL_WINTER_HOURS, SCHOLARSHIPS } from "./types";
import { TEAM_BY_ID, TEAMS } from "./teams";
import { clamp, hashString, mulberry32, pick, type Rng } from "./rng";
import { brief } from "./wire";
import { teamChemistry, bustChemCache } from "./chemistry";
import { noteVisit } from "./compliance";
import { eraHasNil, eraPortal } from "./era";
import { settingsOf } from "./league";
import { adFirst, adFrom, coachFirst } from "./voices";

const MAX_WINTER = 70;
const MAX_SPRING = 110;
const MAX_RESTRICTED = 70;
const MAX_LEAVE_WINTER = 3;
const MAX_LEAVE_SPRING = 4;
const MIN_KEEP = 8;
const MAX_SIGN = 3;
const WINTER_ROSTER = 15;

export function emptyPortal(season: number, window: PortalWindow = "closed"): PortalState {
  return { season, window, transfers: [], hours: 0 };
}

export function portalOf(state: GameState): PortalState {
  return state.portal ?? emptyPortal(state.season, portalEra(state) === "none" ? "none" : "closed");
}

export function portalEra(state: GameState): "none" | "restricted" | "full" {
  return eraPortal(state.eraDecade);
}

export function portalOpen(state: GameState): boolean {
  const w = portalOf(state).window;
  return w === "winter" || w === "spring";
}

export function desiredWindow(state: GameState): PortalWindow {
  const era = portalEra(state);
  if (era === "none") return "none";
  if (state.phase === "offseason") return "spring";
  if (era === "full" && state.phase === "regular" && state.week >= 8 && state.week <= 11) return "winter";
  return "closed";
}

export function reasonLine(t: Transfer): string {
  if (t.reason === "minutes") return "Wants more minutes";
  if (t.reason === "nil") return "The NIL offer wasn't enough";
  if (t.reason === "chemistry") return "Unhappy in the locker room";
  if (t.reason === "scheme") return "Doesn't fit the offense";
  if (t.reason === "hometown") return "Wants to be closer to home";
  if (t.reason === "coaching") return "Lost trust in the staff";
  if (t.reason === "draft") return "Wants a bigger stage for the NBA";
  return "Wants more shots";
}

export function lastFit(t: Transfer): string {
  const school = TEAM_BY_ID[t.fromId]?.name ?? "his last school";
  return `${t.role} at ${school} · ${t.mpg} mpg`;
}

export function yearsLeftOf(p: Player): number {
  const cap = p.usedRedshirt || p.redshirt ? 5 : 4;
  return Math.max(1, cap - p.year + (p.redshirt ? 1 : 0));
}

export function portalInterest(t: Transfer, teamId: string, state: GameState): number {
  if (t.committedTo === teamId) return 99;
  const stored = t.interest[teamId];
  if (typeof stored === "number" && Number.isFinite(stored)) return clamp(stored, 0, 99);
  return portalFit(t, teamId, state);
}

function starsOf(ovr: number): number {
  if (ovr >= 85) return 5;
  if (ovr >= 80) return 4;
  if (ovr >= 74) return 3;
  if (ovr >= 68) return 2;
  return 1;
}

function roleOf(p: Player): PortalRole {
  if (p.mpg >= 24) return "starter";
  if (p.mpg >= 12) return "rotation";
  return "bench";
}

function nilOn(state: GameState) {
  return eraHasNil(state.eraDecade);
}

function posCount(state: GameState, teamId: string, pos: string): number {
  let n = 0;
  const seen = new Set<string>();
  for (const p of state.players) {
    if (p.teamId === teamId && (p.year < 4 || p.redshirt) && p.pos === pos) {
      n++;
      seen.add(p.id);
    }
  }
  for (const t of portalOf(state).transfers) {
    if (t.committedTo === teamId && t.pos === pos && !seen.has(t.playerId)) n++;
  }
  for (const r of state.recruits) {
    if (r.committedTo === teamId && r.pos === pos) n++;
  }
  return n;
}

type TeamLoad = {
  roster: number;
  returning: number;
  pos: Record<string, number>;
  hs: number;
  hsPos: Record<string, number>;
  port: number;
  portPos: Record<string, number>;
};

function emptyLoad(): TeamLoad {
  return { roster: 0, returning: 0, pos: {}, hs: 0, hsPos: {}, port: 0, portPos: {} };
}

function buildLoads(state: GameState): Map<string, TeamLoad> {
  const loads = new Map<string, TeamLoad>();
  const get = (id: string) => {
    let x = loads.get(id);
    if (!x) {
      x = emptyLoad();
      loads.set(id, x);
    }
    return x;
  };
  const onRoster = new Set<string>();
  for (const p of state.players) {
    onRoster.add(p.id);
    const x = get(p.teamId);
    x.roster++;
    if (p.year < 4 || p.redshirt) {
      x.returning++;
      x.pos[p.pos] = (x.pos[p.pos] ?? 0) + 1;
    }
  }
  for (const t of portalOf(state).transfers) {
    if (!t.committedTo || onRoster.has(t.playerId)) continue;
    const x = get(t.committedTo);
    x.port++;
    x.portPos[t.pos] = (x.portPos[t.pos] ?? 0) + 1;
  }
  for (const r of state.recruits) {
    if (!r.committedTo) continue;
    const x = get(r.committedTo);
    x.hs++;
    x.hsPos[r.pos] = (x.hsPos[r.pos] ?? 0) + 1;
  }
  return loads;
}

function posOf(load: TeamLoad | undefined, pos: string): number {
  if (!load) return 0;
  return (load.pos[pos] ?? 0) + (load.portPos[pos] ?? 0) + (load.hsPos[pos] ?? 0);
}

function spotsFrom(load: TeamLoad | undefined, winter: boolean): number {
  if (!load) return winter ? WINTER_ROSTER : SCHOLARSHIPS;
  if (winter) return Math.max(0, WINTER_ROSTER - load.roster - load.port);
  return Math.max(0, SCHOLARSHIPS - load.returning - load.hs - load.port);
}

function creditCommit(loads: Map<string, TeamLoad>, t: Transfer, teamId: string, winter: boolean) {
  const x = loads.get(teamId) ?? emptyLoad();
  if (winter) {
    x.roster++;
    x.returning++;
    x.pos[t.pos] = (x.pos[t.pos] ?? 0) + 1;
  } else {
    x.port++;
    x.portPos[t.pos] = (x.portPos[t.pos] ?? 0) + 1;
  }
  loads.set(teamId, x);
}

export function portalFit(t: Transfer, teamId: string, state: GameState, load?: TeamLoad): number {
  const school = TEAM_BY_ID[teamId];
  const from = TEAM_BY_ID[t.fromId];
  const prestige = school?.prestige ?? 60;
  let n = 30 + (prestige - 50) * 0.2;
  if (teamId === state.playerTeamId) n += ((state.coachSkills?.recruiting ?? 50) - 50) * 0.48;
  if (t.stars >= 4 && prestige < 70) n -= (t.stars - 3) * 11;
  if (t.stars >= 5 && prestige < 82) n -= 14;
  const atPos = load ? posOf(load, t.pos) : posCount(state, teamId, t.pos);
  if (atPos >= 4) n -= 18;
  else if (atPos >= 3) n -= 9;
  if (t.wants.minutes > 62 && atPos >= 3) n -= 10;
  if (school?.state && from?.state && school.state === from.state) n += t.wants.home * 0.12;
  if (!nilOn(state) && t.wants.nil > 60) n -= 8;
  else n += clamp((state.nilCap - t.nilAsk) / 14, -6, 7);
  if (t.boomerang && teamId === state.playerTeamId) n += 12;
  if (teamId === t.fromId) n -= 24;
  return clamp(Math.round(n), 8, 88);
}

function pickReason(p: Player, teamId: string, state: GameState, rng: Rng): PortalReason {
  const t = state.teams[teamId];
  const chem = teamChemistry(state, teamId);
  const played = (t?.wins ?? 0) + (t?.losses ?? 0);
  const winPct = played ? (t!.wins / played) : 0.5;
  const scores: [PortalReason, number][] = [
    ["minutes", p.ovr - 52 - p.mpg],
    ["chemistry", 64 - p.morale + (chem.score < 48 ? 8 : 0)],
    ["role", p.mpg >= 28 && chem.hog?.id === p.id ? 9 : p.mpg < 12 ? 14 : 2],
    ["nil", nilOn(state) && p.ovr >= 76 ? 11 : 0],
    ["hometown", 5 + (rng() < 0.2 ? 8 : 0)],
    ["draft", p.ovr >= 82 && p.year >= 2 ? 10 : 0],
    ["scheme", 4 + (p.skills.shoot >= 78 && p.mpg < 18 ? 8 : 0)],
    ["coaching", played > 8 && winPct < 0.35 ? 12 : 0],
  ];
  scores.sort((a, b) => b[1] - a[1] || rng() - 0.5);
  return scores[0]![0];
}

function chanceToEnter(p: Player, teamId: string, state: GameState, winter: boolean): number {
  const chem = teamChemistry(state, teamId);
  const prestige = TEAM_BY_ID[teamId]?.prestige ?? 60;
  let c = 0.018;
  if (p.mpg < 10 && p.ovr >= 70) c += 0.09;
  if (p.mpg < 16 && p.ovr >= 78) c += 0.07;
  if (p.morale < 50) c += 0.11;
  else if (p.morale < 58) c += 0.045;
  if (chem.score < 45) c += 0.035;
  if (chem.hog && chem.hog.id !== p.id && p.ovr >= 74 && p.mpg < 18) c += 0.05;
  if (prestige < 62 && p.ovr >= 80) c += 0.045;
  if (p.year === 1) c *= 0.55;
  if (p.redshirt) c *= 0.4;
  if (winter) c *= 0.72;
  if (portalEra(state) === "restricted") c *= 0.7;
  return c;
}

function eligible(p: Player, draftIds: Set<string>): boolean {
  if (p.year >= 4 && !p.redshirt) return false;
  if (draftIds.has(p.id)) return false;
  if (p.injury && p.injury.weeksLeft >= 6) return false;
  return true;
}

function wantsOf(p: Player, rng: Rng): Transfer["wants"] {
  const roll = (b: number) => clamp(Math.round(22 + rng() * 48 + b), 10, 96);
  return {
    home: roll(p.mpg < 14 ? 8 : -4),
    minutes: roll(p.mpg < 16 ? 20 : 4),
    scheme: roll(6),
    academics: roll(-6),
    nil: roll(p.ovr >= 78 ? 16 : -4),
    style: pick(rng, ["motion", "spread", "post", "transition", "iso"] as const),
  };
}

function toTransfer(p: Player, reason: PortalReason, window: "winter" | "spring", you: string, rng: Rng): Transfer {
  return {
    id: `t-${p.id}`,
    playerId: p.id,
    first: p.first,
    last: p.last,
    pos: p.pos,
    year: p.year,
    ovr: p.ovr,
    potential: p.potential,
    stars: starsOf(p.ovr),
    mpg: p.mpg,
    morale: p.morale,
    skills: p.skills,
    fromId: p.teamId,
    reason,
    role: roleOf(p),
    yearsLeft: yearsLeftOf(p),
    path: p.path,
    usedRedshirt: p.usedRedshirt,
    redshirt: p.redshirt,
    scouted: false,
    offers: [],
    visits: [],
    interest: {},
    committedTo: null,
    nilAsk: Math.round(starsOf(p.ovr) * 16 + rng() * 18),
    wants: wantsOf(p, rng),
    window,
    boomerang: p.portalFrom === you,
    seasonMinutes: p.seasonMinutes,
    seasonGames: p.seasonGames,
    careerMinutes: p.careerMinutes,
    careerGames: p.careerGames,
    injury: p.injury ?? null,
  };
}

function collectEntries(state: GameState, window: "winter" | "spring", cap: number, perTeam: number, rng: Rng): { transfers: Transfer[]; gone: Set<string> } {
  const draftIds = new Set((state.draft?.rows ?? []).map((r) => r.playerId));
  const already = new Set(portalOf(state).transfers.map((t) => t.playerId));
  const byTeam = new Map<string, Player[]>();
  for (const p of state.players) {
    const list = byTeam.get(p.teamId) ?? [];
    list.push(p);
    byTeam.set(p.teamId, list);
  }
  const order = [...byTeam.keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  const out: Transfer[] = [];
  const gone = new Set<string>();
  const you = state.playerTeamId;
  for (const teamId of order) {
    if (out.length >= cap) break;
    const roster = byTeam.get(teamId) ?? [];
    let kept = roster.length;
    let left = 0;
    const cands = roster
      .filter((p) => eligible(p, draftIds) && !already.has(p.id))
      .sort((a, b) => chanceToEnter(b, teamId, state, window === "winter") - chanceToEnter(a, teamId, state, window === "winter"));
    for (const p of cands) {
      if (out.length >= cap || left >= perTeam || kept <= MIN_KEEP) break;
      if (rng() > chanceToEnter(p, teamId, state, window === "winter")) continue;
      out.push(toTransfer(p, pickReason(p, teamId, state, rng), window, you, rng));
      gone.add(p.id);
      left++;
      kept--;
    }
  }
  return { transfers: out, gone };
}

function newsForOpen(state: GameState, transfers: Transfer[], window: "winter" | "spring"): GameState {
  const you = state.playerTeamId;
  const yours = transfers.filter((t) => t.fromId === you);
  const head = transfers.slice().sort((a, b) => b.ovr - a.ovr)[0];
  let news = state.news;
  let mail = state.mail;
  if (head) {
    const school = TEAM_BY_ID[head.fromId]?.name ?? "a mid-major";
    news = [
      brief(
        state.week,
        window === "winter" ? "The portal opened" : "Spring portal is live",
        [
          `${transfers.length} names hit the portal. ${head.first} ${head.last} out of ${school} is the one everyone will call first.`,
          yours.length
            ? `${yours.map((t) => t.first).join(", ")} walked out of your locker room. You can chase them or let somebody else have them.`
            : "Nobody from your roster walked in the first wave. That's a good morning. It might not last.",
        ],
        yours.length ? "bad" : "even",
        "Portal",
      ),
      ...news,
    ].slice(0, 60);
  }
  for (const t of yours.slice(0, 3)) {
    mail = [
      {
        id: `port-out-${t.playerId}-${state.season}`,
        from: adFrom(state),
        subject: `${t.first} just entered`,
        body: `${coachFirst(state)},\n\n${t.first} ${t.last} entered the portal. ${reasonLine(t)}.\n\nThe scholarship is open. If you want him back, we can talk. It uses portal hours, not recruiting hours.\n\n${adFirst(state)}`,
        week: state.week,
        read: false,
        tone: "bad" as const,
      },
      ...mail,
    ].slice(0, 40);
  }
  return { ...state, news, mail };
}

function seedInterest(transfers: Transfer[], state: GameState): Transfer[] {
  const loads = buildLoads(state);
  return transfers.map((t) => {
    const interest = { ...t.interest };
    for (const school of TEAMS) {
      if (school.id === t.fromId) continue;
      if (school.prestige < 58 && t.stars >= 4) continue;
      interest[school.id] = portalFit(t, school.id, state, loads.get(school.id));
    }
    return { ...t, interest };
  });
}

export function tickPortal(state: GameState, rng: Rng): GameState {
  const era = portalEra(state);
  const want = desiredWindow(state);
  const prev = portalOf(state);
  if (era === "none") {
    if (prev.window === "none" && prev.transfers.length === 0) return state;
    return { ...state, portal: emptyPortal(state.season, "none") };
  }

  let s = state;
  if (want === "winter" && prev.window !== "winter") s = openWindow(s, "winter", rng);
  else if (want === "spring" && prev.window !== "spring") s = openWindow(s, "spring", rng);
  else if (want === "closed" && prev.window === "winter") {
    s = { ...s, portal: { ...portalOf(s), window: "closed", hours: 0 } };
  }

  const cur = portalOf(s);
  if (cur.window !== "winter" && cur.window !== "spring") return s;

  const hours = hoursBudget(s, cur.window);
  s = { ...s, portal: { ...portalOf(s), hours: cur.window === "spring" && prev.window === "spring" ? cur.hours : hours } };
  s = cpuPortalWeek(s, rng);
  if (s.cpuRecruit) s = assistPortalWeek(s, rng);
  return s;
}

function openWindow(state: GameState, window: "winter" | "spring", rng: Rng): GameState {
  const cap = portalEra(state) === "restricted" ? MAX_RESTRICTED : window === "winter" ? MAX_WINTER : MAX_SPRING;
  const strict = settingsOf(state).portalStrict ?? "normal";
  const bump = strict === "open" ? 1 : strict === "tight" ? -1 : 0;
  const perTeam = Math.max(1, (window === "winter" ? MAX_LEAVE_WINTER : MAX_LEAVE_SPRING) + bump);
  const held = window === "spring"
    ? portalOf(state).transfers.filter((t) => !t.committedTo).map((t) => ({ ...t, window: "spring" as const }))
    : [];
  const skip = new Set(held.map((t) => t.playerId));
  const { transfers, gone } = collectEntries(state, window, Math.max(0, cap - held.length), perTeam, rng);
  const fresh = seedInterest(transfers.filter((t) => !skip.has(t.playerId)), state);
  const all = [...held, ...fresh];
  const hours = hoursBudget(state, window);
  const next: GameState = {
    ...state,
    players: state.players.filter((p) => !gone.has(p.id)),
    portal: { season: state.season, window, transfers: all, hours },
  };
  bustChemCache();
  return newsForOpen(next, fresh, window);
}

function spotsOf(state: GameState, teamId: string): number {
  const roster = state.players.filter((p) => p.teamId === teamId).length;
  const port = portalOf(state).transfers.filter((t) => t.committedTo === teamId && !state.players.some((p) => p.id === t.playerId)).length;
  if (portalOf(state).window === "winter") {
    return Math.max(0, WINTER_ROSTER - roster - port);
  }
  const hs = state.recruits.filter((r) =>
    r.committedTo === teamId && !state.players.some((p) => p.teamId === teamId && p.first === r.first && p.last === r.last),
  ).length;
  const returning = state.players.filter((p) => p.teamId === teamId && (p.year < 4 || p.redshirt)).length;
  return Math.max(0, SCHOLARSHIPS - returning - hs - port);
}

function hoursBudget(state: GameState, window: "winter" | "spring"): number {
  const base = window === "spring" ? PORTAL_SPRING_HOURS : PORTAL_WINTER_HOURS;
  const spots = spotsOf(state, state.playerTeamId);
  return clamp(base + Math.min(4, Math.max(0, spots)), 4, 14);
}

export function portalHoursBudget(state: GameState, window: "winter" | "spring") {
  return hoursBudget(state, window);
}

function toPlayer(t: Transfer, teamId: string, mpg: number, bumpYear: boolean, season: number): Player {
  const year = bumpYear
    ? t.redshirt
      ? t.year
      : Math.min(4, t.year + 1)
    : t.year;
  return {
    id: t.playerId,
    first: t.first,
    last: t.last,
    pos: t.pos,
    year,
    ovr: t.ovr,
    potential: t.potential,
    morale: clamp(t.morale + 6, 30, 88),
    teamId,
    mpg,
    skills: t.skills,
    seasonMinutes: bumpYear ? 0 : t.seasonMinutes,
    seasonGames: bumpYear ? 0 : t.seasonGames,
    careerMinutes: t.careerMinutes,
    careerGames: t.careerGames,
    path: t.path,
    redshirt: bumpYear ? false : Boolean(t.redshirt),
    usedRedshirt: bumpYear ? Boolean(t.usedRedshirt || t.redshirt) : Boolean(t.usedRedshirt),
    injury: bumpYear ? null : t.injury ?? null,
    portalFrom: t.fromId,
    portalSeason: season,
  };
}

function rebalanceCpu(state: GameState, teamId: string): GameState {
  if (teamId === state.playerTeamId) return state;
  const roster = state.players.filter((p) => p.teamId === teamId).sort((a, b) => b.ovr - a.ovr);
  const mpgFor = (p: Player, i: number) => (p.redshirt || (p.injury && p.injury.weeksLeft > 0) ? 0 : i < 5 ? 28 : i < 8 ? 18 : 8);
  const ids = new Map(roster.map((p, i) => [p.id, mpgFor(p, i)]));
  return {
    ...state,
    players: state.players.map((p) => (ids.has(p.id) ? { ...p, mpg: ids.get(p.id)! } : p)),
  };
}

function applyCommit(state: GameState, id: string, teamId: string): GameState {
  const portal = portalOf(state);
  const row = portal.transfers.find((t) => t.id === id);
  if (!row || row.committedTo) return state;
  const winter = row.window === "winter" && state.phase === "regular";
  const transfers = portal.transfers.map((t) => (t.id === id ? { ...t, committedTo: teamId } : t));
  let s: GameState = { ...state, portal: { ...portal, transfers } };
  if (winter) {
    const mpg = teamId === state.playerTeamId ? 10 : 16;
    s = { ...s, players: [...s.players, toPlayer(row, teamId, mpg, false, state.season)] };
    s = rebalanceCpu(s, teamId);
    bustChemCache();
  }
  if (teamId === state.playerTeamId || row.fromId === state.playerTeamId) {
    const school = TEAM_BY_ID[teamId]?.name ?? "a new school";
    const from = TEAM_BY_ID[row.fromId]?.name ?? "his last stop";
    s = {
      ...s,
      news: [
        brief(
          s.week,
          `${row.first} ${row.last} lands`,
          [
            `${row.first} is headed to ${school} out of ${from}. ${reasonLine(row)}.`,
            winter ? "He can play this week if you give him minutes." : "He enrolls when camp opens.",
          ],
          teamId === state.playerTeamId ? "good" : "even",
          "Portal",
        ),
        ...s.news,
      ].slice(0, 60),
    };
  }
  return s;
}

function cpuPortalWeek(state: GameState, rng: Rng): GameState {
  const portal = portalOf(state);
  if (portal.window !== "winter" && portal.window !== "spring") return state;
  let s = state;
  const winter = portal.window === "winter";
  const loads = buildLoads(s);
  const live = portal.transfers.filter((t) => !t.committedTo);
  for (const t of live) {
    let best: { id: string; prestige: number; heat: number } | null = null;
    for (const school of TEAMS) {
      if (school.id === t.fromId || school.id === s.playerTeamId) continue;
      const load = loads.get(school.id);
      if (spotsFrom(load, winter) <= 0) continue;
      const stored = t.interest[school.id];
      const heat = typeof stored === "number" && Number.isFinite(stored)
        ? stored
        : portalFit(t, school.id, s, load);
      if (!best || heat > best.heat) best = { id: school.id, prestige: school.prestige, heat };
    }
    if (!best) continue;
    if (t.stars >= 5 && best.prestige < 80 && rng() > 0.08) continue;
    if (t.stars >= 4 && best.prestige < 68 && rng() > 0.12) continue;
    const p = best.heat >= 78 ? 0.22 : best.heat >= 68 ? 0.12 : best.heat >= 58 ? 0.05 : 0;
    const late = portal.window === "spring" ? 0.08 : s.week >= 10 ? 0.06 : 0;
    if (rng() < p + late) {
      s = applyCommit(s, t.id, best.id);
      creditCommit(loads, t, best.id, winter);
    }
  }
  return s;
}

function spendPortal(state: GameState, n: number): GameState | null {
  const p = portalOf(state);
  if (p.hours < n) return null;
  return { ...state, portal: { ...p, hours: p.hours - n } };
}

function signedThisWindow(state: GameState): number {
  const p = portalOf(state);
  const you = state.playerTeamId;
  return p.transfers.filter((t) => t.committedTo === you && t.window === (p.window === "closed" ? t.window : p.window)).length;
}

export function portalPaper(state: GameState): { offered: number; incoming: number } {
  const you = state.playerTeamId;
  const p = portalOf(state);
  return {
    offered: p.transfers.filter((t) => t.offers.includes(you) && !t.committedTo).length,
    incoming: p.transfers.filter((t) => t.committedTo === you && !state.players.some((x) => x.id === t.playerId && x.teamId === you)).length,
  };
}

function bumpInterest(t: Transfer, teamId: string, n: number, state: GameState): Transfer {
  const cur = portalInterest(t, teamId, state);
  return { ...t, interest: { ...t.interest, [teamId]: clamp(cur + n, 0, 99) } };
}

export function scoutPortal(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const p = portalOf(state);
  const t = p.transfers.find((x) => x.id === id);
  if (!t) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (!portalOpen(state)) return { state, feedback: { title: "Portal's closed", detail: "Winter is weeks 8–11. Spring is the offseason.", parts: [] } };
  if (t.scouted) return { state, feedback: { title: "Already scouted", detail: `${t.first} ${t.last}`, parts: [] } };
  const paid = spendPortal(state, 1);
  if (!paid) return { state, feedback: { title: "No portal hours", detail: "High-school hours don't spend here.", parts: [] } };
  const you = state.playerTeamId;
  const transfers = portalOf(paid).transfers.map((x) => (x.id === id ? { ...bumpInterest(x, you, 3, paid), scouted: true } : x));
  return {
    state: { ...paid, portal: { ...portalOf(paid), transfers } },
    feedback: { title: `Scouted ${t.first}`, detail: `${reasonLine(t)}. ${lastFit(t)}.`, parts: [{ label: "Portal hours", delta: -1 }] },
  };
}

export function offerPortal(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const t = portalOf(state).transfers.find((x) => x.id === id);
  if (!t) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (!portalOpen(state)) return { state, feedback: { title: "Portal's closed", detail: "", parts: [] } };
  if (t.offers.includes(state.playerTeamId)) return { state, feedback: { title: "Already offered", detail: `${t.first} ${t.last}`, parts: [] } };
  if (t.committedTo) return { state, feedback: { title: "He's gone", detail: "Somebody else got him.", parts: [] } };
  if (portalOf(state).window === "winter") {
    if (spotsOf(state, state.playerTeamId) <= 0) {
      return { state, feedback: { title: "No room", detail: "Fifteen on the floor is enough. Someone has to leave.", parts: [] } };
    }
  } else {
    const { incoming, offered } = portalPaper(state);
    const roster = state.players.filter((p) => p.teamId === state.playerTeamId && (p.year < 4 || p.redshirt)).length;
    const hs = state.recruits.filter((r) => r.committedTo === state.playerTeamId || r.offers.includes(state.playerTeamId)).length;
    if (SCHOLARSHIPS - roster - hs - incoming - offered <= 0) {
      return { state, feedback: { title: "No scholarships", detail: "You're out of paper. Cut an offer or wait for a spot.", parts: [] } };
    }
  }
  if (signedThisWindow(state) >= MAX_SIGN) {
    return { state, feedback: { title: "That's enough", detail: "Three from this window. Don't build a superteam in May.", parts: [] } };
  }
  const paid = spendPortal(state, 2);
  if (!paid) return { state, feedback: { title: "No portal hours", detail: "Wait for the next week, or the spring pot.", parts: [] } };
  const nilBump = !nilOn(state) ? (t.wants.nil > 60 ? -3 : 0) : clamp(Math.round((state.nilCap - t.nilAsk) / 12), -4, 5);
  const bump = 10 + Math.round(((state.coachSkills?.recruiting ?? 50) - 50) / 8) + nilBump;
  const you = state.playerTeamId;
  const transfers = portalOf(paid).transfers.map((x) => {
    if (x.id !== id) return x;
    return { ...bumpInterest(x, you, bump, paid), offers: [...x.offers, you] };
  });
  return {
    state: { ...paid, portal: { ...portalOf(paid), transfers } },
    feedback: { title: `Offered ${t.first} ${t.last}`, detail: `${reasonLine(t)}. Position crowding still counts.`, parts: [{ label: "Portal hours", delta: -2 }] },
  };
}

export function visitPortal(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const t = portalOf(state).transfers.find((x) => x.id === id);
  if (!t) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (!portalOpen(state)) return { state, feedback: { title: "Portal's closed", detail: "", parts: [] } };
  const fake = { first: t.first, last: t.last, nilAsk: t.nilAsk } as Recruit;
  const noted = noteVisit(state, fake);
  if (noted.blocked) return { state: noted.state, feedback: { title: "Dead period", detail: noted.blocked, parts: [] } };
  const paid = spendPortal(noted.state, 2);
  if (!paid) return { state: noted.state, feedback: { title: "No portal hours", detail: "", parts: [] } };
  const bump = 8 + Math.round(((state.coachSkills?.recruiting ?? 50) - 50) / 10);
  const you = state.playerTeamId;
  const transfers = portalOf(paid).transfers.map((x) => {
    if (x.id !== id) return x;
    const visits = x.visits.includes(you) ? x.visits : [...x.visits, you];
    return { ...bumpInterest({ ...x, visits }, you, bump, paid), visits };
  });
  return {
    state: { ...paid, portal: { ...portalOf(paid), transfers } },
    feedback: { title: `Visited ${t.first}`, detail: lastFit(t), parts: [{ label: "Portal hours", delta: -2 }] },
  };
}

export function portalChance(state: GameState, t: Transfer): number {
  if (t.committedTo === state.playerTeamId) return 100;
  if (t.committedTo) return 0;
  let chance = portalInterest(t, state.playerTeamId, state);
  if (!t.offers.includes(state.playerTeamId)) chance -= 22;
  if (!t.visits.includes(state.playerTeamId) && t.stars >= 4) chance -= 14;
  if (posCount(state, state.playerTeamId, t.pos) >= 4) chance -= 10;
  const strict = settingsOf(state).portalStrict ?? "normal";
  if (strict === "tight") chance -= 12;
  if (strict === "open") chance += 8;
  return clamp(Math.round(chance), t.offers.includes(state.playerTeamId) ? 4 : 1, 96);
}

export function portalAfford(state: GameState, t: Transfer): "fits" | "tight" | "over" | "off" {
  if (!nilOn(state) || state.settings?.nilOn === false) return "off";
  if (t.nilAsk <= state.nilCap * 0.55) return "fits";
  if (t.nilAsk <= state.nilCap) return "tight";
  return "over";
}

export function signPortal(state: GameState, id: string, rng?: Rng): { state: GameState; feedback: Feedback } {
  const t = portalOf(state).transfers.find((x) => x.id === id);
  if (!t) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (!portalOpen(state)) return { state, feedback: { title: "Portal's closed", detail: "", parts: [] } };
  if (t.committedTo) return { state, feedback: { title: "He's gone", detail: "", parts: [] } };
  if (!t.offers.includes(state.playerTeamId)) return { state, feedback: { title: "Offer first", detail: "The scholarship has to be on the table.", parts: [] } };
  if (signedThisWindow(state) >= MAX_SIGN) {
    return { state, feedback: { title: "That's enough", detail: "Three from this window.", parts: [] } };
  }
  if (spotsOf(state, state.playerTeamId) <= 0) {
    return { state, feedback: { title: "No room", detail: "Roster's full.", parts: [] } };
  }
  const heat = portalInterest(t, state.playerTeamId, state);
  let chance = heat;
  if (!t.visits.includes(state.playerTeamId) && t.stars >= 4) chance -= 14;
  if (posCount(state, state.playerTeamId, t.pos) >= 4) chance -= 10;
  const roll = rng ?? mulberry32(state.seed ^ hashString(id) ^ (state.week + 3) * 104729);
  if (roll() * 100 >= chance) {
    const transfers = portalOf(state).transfers.map((x) => (x.id === id ? bumpInterest(x, state.playerTeamId, 4, state) : x));
    return {
      state: { ...state, portal: { ...portalOf(state), transfers } },
      feedback: { title: `${t.first} is still talking`, detail: `Fit was ${heat}. Visit him or wait. Stars don't jump for mid-majors without a number.`, parts: [] },
    };
  }
  const next = applyCommit(state, id, state.playerTeamId);
  return {
    state: next,
    feedback: {
      title: `${t.first} is in`,
      detail: t.window === "winter" ? "He's on the roster. Minutes are yours to give." : "He enrolls when camp opens.",
      parts: [{ label: "Portal", delta: 1 }],
    },
  };
}

function staffPortalScore(state: GameState, t: Transfer): number {
  const you = state.playerTeamId;
  const prestige = TEAM_BY_ID[you]?.prestige ?? 60;
  const target = prestige >= 88 ? 5 : prestige >= 78 ? 4 : prestige >= 64 ? 3 : 2;
  const int = portalInterest(t, you, state);
  const posGap = 4 - posCount(state, you, t.pos);
  let score = t.stars * 12 - Math.abs(t.stars - target) * 10 + int + posGap * 8 + (t.scouted ? 4 : 0);
  if (t.fromId === you) score += 14;
  if (t.boomerang) score += 8;
  return score;
}

export function assistPortalWeek(state: GameState, rng: Rng): GameState {
  if (!state.cpuRecruit || !portalOpen(state)) return state;
  let s = state;
  const you = s.playerTeamId;
  let guard = 0;
  while (portalOf(s).hours > 0 && guard++ < 14) {
    const live = portalOf(s).transfers.filter((t) => !t.committedTo);
    if (!live.length) break;
    const ranked = [...live].sort((a, b) => staffPortalScore(s, b) - staffPortalScore(s, a));
    const top = ranked[0];
    if (!top) break;
    if (!top.scouted && portalOf(s).hours >= 1) {
      const next = scoutPortal(s, top.id);
      if (portalOf(next.state).hours < portalOf(s).hours) {
        s = next.state;
        continue;
      }
    }
    if (!top.offers.includes(you) && portalOf(s).hours >= 2) {
      const next = offerPortal(s, top.id);
      if (portalOf(next.state).hours < portalOf(s).hours) {
        s = next.state;
        continue;
      }
    }
    if (top.offers.includes(you) && !top.visits.includes(you) && portalOf(s).hours >= 2) {
      const next = visitPortal(s, top.id);
      if (portalOf(next.state).hours < portalOf(s).hours) {
        s = next.state;
        continue;
      }
    }
    if (top.offers.includes(you) && portalInterest(top, you, s) >= 60) {
      const next = signPortal(s, top.id, rng);
      s = next.state;
      if (next.feedback.title.includes("in")) continue;
      break;
    }
    break;
  }
  return s;
}

export function enrollPortal(state: GameState, rng: Rng): GameState {
  let s = state;
  const portal = portalOf(s);
  const loads = buildLoads(s);
  for (const t of portal.transfers) {
    if (t.committedTo) continue;
    let best: { id: string; prestige: number; heat: number } | null = null;
    for (const school of TEAMS) {
      if (school.id === t.fromId || school.id === s.playerTeamId) continue;
      if (spotsFrom(loads.get(school.id), false) <= 0) continue;
      const stored = t.interest[school.id];
      const heat = typeof stored === "number" && Number.isFinite(stored)
        ? stored
        : portalFit(t, school.id, s, loads.get(school.id));
      if (!best || heat > best.heat) best = { id: school.id, prestige: school.prestige, heat };
    }
    if (!best) continue;
    if (t.stars >= 5 && best.prestige < 78 && rng() > 0.15) continue;
    if (t.stars >= 4 && best.prestige < 64 && rng() > 0.2) continue;
    if (rng() < 0.72 || t.stars >= 3) {
      s = applyCommit(s, t.id, best.id);
      creditCommit(loads, t, best.id, false);
    }
  }
  const done = portalOf(s);
  const incoming: Player[] = [];
  const counts = new Map<string, number>();
  const onRoster = new Set<string>();
  for (const p of s.players) {
    counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    onRoster.add(p.id);
  }
  const you = s.playerTeamId;
  const pending = done.transfers
    .filter((t) => t.committedTo && !onRoster.has(t.playerId))
    .sort((a, b) => {
      const aYou = a.committedTo === you ? 1 : 0;
      const bYou = b.committedTo === you ? 1 : 0;
      if (aYou !== bYou) return bYou - aYou;
      return b.ovr - a.ovr;
    });
  for (const t of pending) {
    const teamId = t.committedTo!;
    const n = counts.get(teamId) ?? 0;
    if (n >= SCHOLARSHIPS && teamId !== you) continue;
    if (n >= SCHOLARSHIPS + 3) continue;
    incoming.push(toPlayer(t, teamId, 12, true, s.season + 1));
    counts.set(teamId, n + 1);
  }
  if (incoming.length) {
    s = { ...s, players: [...s.players, ...incoming] };
    const teams = new Set(incoming.map((p) => p.teamId));
    for (const id of teams) s = rebalanceCpu(s, id);
    bustChemCache();
  }
  return { ...s, portal: emptyPortal(s.season + 1, portalEra(s) === "none" ? "none" : "closed") };
}

export function ensurePortal(raw: GameState["portal"], season: number, era: GameState["eraDecade"]): PortalState {
  if (!raw || typeof raw !== "object") {
    const window: PortalWindow = eraPortal(era) === "none" ? "none" : "closed";
    return emptyPortal(season, window);
  }
  const window = raw.window === "winter" || raw.window === "spring" || raw.window === "none" || raw.window === "closed" ? raw.window : "closed";
  const transfers = Array.isArray(raw.transfers)
    ? raw.transfers.filter((t) => t && t.id && t.playerId && t.first)
    : [];
  return {
    season: Number(raw.season) || season,
    window,
    transfers,
    hours: Number.isFinite(raw.hours) ? Math.max(0, raw.hours) : 0,
  };
}
