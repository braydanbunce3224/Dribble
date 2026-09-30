import type { CountStats, GameState, LeaderRow, LeaderSnap, Player } from "./types";
import { TEAM_BY_ID } from "./teams";

function rate(n: number, g: number) {
  return g > 0 ? n / g : 0;
}

function row(p: Player, val: number): LeaderRow {
  const t = TEAM_BY_ID[p.teamId];
  return {
    id: p.id,
    name: `${p.first} ${p.last}`,
    teamId: p.teamId,
    abbr: t?.abbr ?? "",
    pos: p.pos,
    val,
    gp: p.stats?.g ?? p.seasonGames ?? 0,
    yours: p.teamId === undefined ? false : false,
  };
}

function qualified(p: Player, minG: number) {
  const s = p.stats;
  if (!s || s.g < minG) return false;
  return s.min / s.g >= 8;
}

function top(players: Player[], n: number, val: (p: Player) => number, minG: number, extra?: (p: Player) => boolean) {
  return players
    .filter((p) => qualified(p, minG) && (!extra || extra(p)))
    .map((p) => ({ p, v: val(p) }))
    .filter((x) => Number.isFinite(x.v) && x.v > 0)
    .sort((a, b) => b.v - a.v || (b.p.stats?.g ?? 0) - (a.p.stats?.g ?? 0))
    .slice(0, n)
    .map((x) => row(x.p, x.v));
}

export function ppg(s: CountStats) {
  return rate(s.pts, s.g);
}

export function snapshotLeaders(state: GameState, n = 25): LeaderSnap {
  const minG = Math.max(3, Math.min(8, Math.floor((state.week || 1) * 0.45)));
  const pool = state.players;
  const mark = (rows: LeaderRow[]) => rows.map((r) => ({ ...r, yours: r.teamId === state.playerTeamId }));
  return {
    week: state.week,
    season: state.season,
    pts: mark(top(pool, n, (p) => ppg(p.stats!), minG)),
    reb: mark(top(pool, n, (p) => rate(p.stats!.reb, p.stats!.g), minG)),
    ast: mark(top(pool, n, (p) => rate(p.stats!.ast, p.stats!.g), minG)),
    fg: mark(top(pool, n, (p) => (p.stats!.fga >= 24 ? p.stats!.fgm / p.stats!.fga : 0), minG, (p) => (p.stats?.fga ?? 0) >= 24)),
    three: mark(top(pool, n, (p) => (p.stats!.tpa >= 12 ? p.stats!.tpm / p.stats!.tpa : 0), minG, (p) => (p.stats?.tpa ?? 0) >= 12)),
  };
}

export function leadersOf(state: GameState): LeaderSnap {
  const live = snapshotLeaders(state);
  if (live.pts.length) return live;
  if (state.leaders && state.leaders.season === state.season) return state.leaders;
  return live;
}

export function conferenceLeaders(state: GameState, n = 15): LeaderSnap {
  const conf = state.teams[state.playerTeamId]?.conference;
  const minG = Math.max(3, Math.min(8, Math.floor((state.week || 1) * 0.45)));
  const pool = state.players.filter((p) => state.teams[p.teamId]?.conference === conf);
  const mark = (rows: LeaderRow[]) => rows.map((r) => ({ ...r, yours: r.teamId === state.playerTeamId }));
  return {
    week: state.week,
    season: state.season,
    pts: mark(top(pool, n, (p) => ppg(p.stats!), minG)),
    reb: mark(top(pool, n, (p) => rate(p.stats!.reb, p.stats!.g), minG)),
    ast: mark(top(pool, n, (p) => rate(p.stats!.ast, p.stats!.g), minG)),
    fg: mark(top(pool, n, (p) => (p.stats!.fga >= 16 ? p.stats!.fgm / p.stats!.fga : 0), minG, (p) => (p.stats?.fga ?? 0) >= 16)),
    three: mark(top(pool, n, (p) => (p.stats!.tpa >= 8 ? p.stats!.tpm / p.stats!.tpa : 0), minG, (p) => (p.stats?.tpa ?? 0) >= 8)),
  };
}

export function fmtRate(n: number, kind: "avg" | "pct") {
  return kind === "pct" ? `${(n * 100).toFixed(1)}%` : n.toFixed(1);
}
