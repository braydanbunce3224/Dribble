import type { GameSlot, GameState, MarketSheet } from "./types";
import { TEAM_BY_ID } from "./teams";
import { kenpom } from "./ranks";
import { clamp } from "./rng";

export interface MarketLine {
  slotId: string;
  week: number;
  homeId: string;
  awayId: string;
  kind: GameSlot["kind"];
  site: GameSlot["site"];
  homeSpread: number;
  total: number;
  mlHome: number;
  mlAway: number;
  expHome: number;
  expAway: number;
  pHome: number;
  yours: boolean;
  resultId?: string;
}

export function emptySheet(): MarketSheet {
  return { picks: [], wins: 0, losses: 0, pushes: 0 };
}

function roundHalf(n: number) {
  const r = Math.round(n * 2) / 2;
  return Object.is(r, -0) ? 0 : r;
}

function pythag(pf: number, pa: number) {
  const a = Math.pow(Math.max(1, pf), 10.25);
  const b = Math.pow(Math.max(1, pa), 10.25);
  return a / (a + b);
}

export function american(p: number) {
  const x = clamp(p, 0.08, 0.92);
  if (x >= 0.5) return -Math.round((x / (1 - x)) * 100);
  return Math.round(((1 - x) / x) * 100);
}

function juice(p: number) {
  if (p >= 0.5) return clamp(p + 0.018, 0.5, 0.92);
  return clamp(p - 0.018, 0.08, 0.5);
}

export function hangLine(state: GameState, slot: GameSlot): MarketLine {
  const kp = kenpom(state);
  const home = kp.find((r) => r.id === slot.homeId);
  const away = kp.find((r) => r.id === slot.awayId);
  const neutral = slot.site === "neutral" || slot.kind === "mte" || slot.kind === "ncaa" || slot.kind === "nit" || slot.kind === "crown" || slot.kind === "conf-tourney";
  const hca = neutral ? 0 : 3.2;
  const tempo = ((home?.adjT ?? 68.4) + (away?.adjT ?? 68.4)) / 2;
  const expHome = tempo * ((home?.adjO ?? 100) / 100) * ((away?.adjD ?? 100) / 100) + hca / 2;
  const expAway = tempo * ((away?.adjO ?? 100) / 100) * ((home?.adjD ?? 100) / 100) - hca / 2;
  const margin = expHome - expAway;
  const pHome = juice(pythag(expHome, expAway));
  return {
    slotId: slot.id,
    week: slot.week,
    homeId: slot.homeId,
    awayId: slot.awayId,
    kind: slot.kind,
    site: slot.site,
    homeSpread: roundHalf(-margin),
    total: roundHalf(expHome + expAway),
    mlHome: american(pHome),
    mlAway: american(1 - pHome),
    expHome: Math.round(expHome * 10) / 10,
    expAway: Math.round(expAway * 10) / 10,
    pHome,
    yours: slot.homeId === state.playerTeamId || slot.awayId === state.playerTeamId,
    resultId: slot.resultId,
  };
}

export function weekCard(state: GameState, week = state.week || 1): MarketLine[] {
  const kp = kenpom(state);
  const rank = (id: string) => kp.find((r) => r.id === id)?.rank ?? 200;
  const open = state.schedule.filter((g) => !g.declined && g.week === week);
  const yours = open.filter((g) => g.homeId === state.playerTeamId || g.awayId === state.playerTeamId);
  const rest = open
    .filter((g) => g.homeId !== state.playerTeamId && g.awayId !== state.playerTeamId)
    .sort((a, b) => Math.min(rank(a.homeId), rank(a.awayId)) - Math.min(rank(b.homeId), rank(b.awayId)));
  const seen = new Set<string>();
  const list: GameSlot[] = [];
  for (const g of [...yours, ...rest]) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    list.push(g);
    if (list.length >= 32) break;
  }
  return list.map((g) => hangLine(state, g));
}

export function mlLabel(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function spreadLabel(n: number) {
  if (n === 0) return "PK";
  return n > 0 ? `+${n}` : `${n}`;
}

export function spreadText(homeSpread: number, homeAbbr: string, awayAbbr: string) {
  if (homeSpread === 0) return `${homeAbbr} PK`;
  if (homeSpread < 0) return `${homeAbbr} ${homeSpread}`;
  return `${awayAbbr} ${-homeSpread}`;
}

export function teamAbbr(id: string) {
  return TEAM_BY_ID[id]?.abbr ?? id;
}
