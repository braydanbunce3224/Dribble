import { beginLiveGame, lockSchedule, newDynasty, runLiveRest } from "./engine";
import { lockGamePlan } from "./plays";
import { mulberry32 } from "./rng";
import { simContest } from "./sim";
import { TEAMS } from "./teams";
import type { RecapPlayer } from "./types";

export type SideStat = {
  pts: number;
  fg: number;
  tpa: number;
  tp: number;
  fta: number;
  ft: number;
  ast: number;
  to: number;
  stl: number;
  blk: number;
  reb: number;
  pf: number;
  poss: number;
};

export type StatLine = {
  avg: number;
  sd: number;
  min: number;
  max: number;
};

function side(lines: RecapPlayer[]): SideStat {
  const g = (k: keyof RecapPlayer) => lines.reduce((n, p) => n + (Number(p[k]) || 0), 0);
  const fga = g("fga");
  const tpa = g("tpa");
  const fta = g("fta");
  const to = g("to");
  const orb = Math.round(g("reb") * 0.28);
  return {
    pts: g("pts"),
    fg: fga ? g("fgm") / fga : 0,
    tpa,
    tp: tpa ? g("tpm") / tpa : 0,
    fta,
    ft: fta ? g("ftm") / fta : 0,
    ast: g("ast"),
    to,
    reb: g("reb"),
    stl: g("stl"),
    blk: g("blk"),
    pf: g("pf"),
    poss: Math.max(1, Math.round(fga - orb + to + 0.44 * fta)),
  };
}

function line(rows: SideStat[], key: keyof SideStat): StatLine {
  const vals = rows.map((r) => r[key]);
  const avg = vals.reduce((n, v) => n + v, 0) / Math.max(1, vals.length);
  const sd = Math.sqrt(vals.reduce((n, v) => n + (v - avg) ** 2, 0) / Math.max(1, vals.length));
  return { avg, sd, min: Math.min(...vals), max: Math.max(...vals) };
}

export function summarize(rows: SideStat[], margins: number[]) {
  const keys: (keyof SideStat)[] = ["pts", "fg", "tpa", "tp", "fta", "ft", "ast", "to", "stl", "blk", "reb", "pf", "poss"];
  const stats = Object.fromEntries(keys.map((k) => [k, line(rows, k)])) as Record<keyof SideStat, StatLine>;
  const n = Math.max(1, margins.length);
  const margin = line(margins.map((m) => ({ pts: m }) as SideStat), "pts");
  const bucket = (lo: number, hi: number) => margins.filter((m) => m >= lo && m <= hi).length / n;
  return {
    n: rows.length,
    games: margins.length,
    stats: { ...stats, margin },
    by10: margins.filter((m) => m >= 10).length / n,
    by20: margins.filter((m) => m >= 20).length / n,
    buckets: {
      close: bucket(1, 7),
      mid: bucket(8, 14),
      big: bucket(15, 19),
      blow: bucket(20, 200),
    },
  };
}

export function auditGaps(live: ReturnType<typeof summarize>, sim: ReturnType<typeof summarize>) {
  const keys = ["pts", "fg", "tpa", "tp", "fta", "ft", "ast", "to", "stl", "blk", "reb", "pf", "poss", "margin"] as const;
  const flags: string[] = [];
  for (const k of keys) {
    const a = live.stats[k].avg;
    const b = sim.stats[k].avg;
    const pct = k === "fg" || k === "tp" || k === "ft";
    const gap = Math.abs(a - b);
    const big = pct ? gap >= 0.04 : gap >= Math.max(2.5, Math.abs(b) * 0.12);
    if (big) flags.push(`${k} live ${pct ? (a * 100).toFixed(1) + "%" : a.toFixed(1)} vs sim ${pct ? (b * 100).toFixed(1) + "%" : b.toFixed(1)}`);
  }
  return flags;
}

export function runAudit(n = 100) {
  const liveRows: SideStat[] = [];
  const simRows: SideStat[] = [];
  const liveMargins: number[] = [];
  const simMargins: number[] = [];
  for (let i = 0; i < n; i++) {
    const home = TEAMS[i % TEAMS.length]!.id;
    const away = TEAMS[(i * 17 + 5) % TEAMS.length]!.id;
    const id = home === away ? TEAMS[(i + 1) % TEAMS.length]!.id : home;
    const opp = away === id ? TEAMS[(i + 3) % TEAMS.length]!.id : away;
    let s = lockSchedule(newDynasty(id, 3000 + i, { careerMode: true, identity: { first: "Pat", last: "Rivers", age: 40, almaMaterId: id } }));
    const slot = s.schedule.find((g) => g.homeId === s.playerTeamId || g.awayId === s.playerTeamId);
    s = { ...s, phase: "regular", week: slot?.week ?? 1 };
    let live = beginLiveGame(s);
    if (live && live.liveGame) {
      const done = runLiveRest(lockGamePlan(live));
      const L = done.liveGame!;
      liveRows.push(side(L.homeLines ?? []), side(L.awayLines ?? []));
      liveMargins.push(Math.abs((L.homeScore ?? 0) - (L.awayScore ?? 0)));
    }
    const sim = simContest(s, id, opp, mulberry32(8000 + i * 13), { site: "home" });
    simRows.push(side(sim.homeLines), side(sim.awayLines));
    simMargins.push(Math.abs(sim.homeScore - sim.awayScore));
  }
  return { live: summarize(liveRows, liveMargins), sim: summarize(simRows, simMargins) };
}
