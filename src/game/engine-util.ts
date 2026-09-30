import type { CoachIdentity, GameBox, LiveGame, RecapPlayer, Site } from "./types";
import { clamp, gaussian, type Rng } from "./rng";
import { eraPace } from "./era";

export function identityName(d?: CoachIdentity | null) {
  if (!d) return "Coach Stone";
  return `${d.first ?? ""} ${d.last ?? ""}`.trim() || "Coach Stone";
}

/** Name a writer uses after a quote. Last name, exactly as entered. */
export function coachSaid(d?: CoachIdentity | null) {
  const last = (d?.last ?? "").trim();
  const first = (d?.first ?? "").trim();
  return last || first || "the coach";
}

function oneBox(poss: number, rng: Rng): GameBox {
  const p = clamp(Math.round(poss), 56, 88);
  const to = clamp(Math.round(p * (0.155 + rng() * 0.07)), 7, 22);
  const fta = clamp(Math.round(p * (0.18 + rng() * 0.14)), 8, 32);
  const orb = clamp(Math.round(p * (0.08 + rng() * 0.06)), 3, 16);
  const fga = clamp(Math.round(p - to - 0.475 * fta + orb), 38, 92);
  return { poss: p, fga, orb, to, fta };
}

/** Light box that is consistent with Poss ≈ FGA − OR + TO + 0.475×FTA. */
export function estimateGameBoxes(hs: number, as: number, rng: Rng): { home: GameBox; away: GameBox; minutes: number } {
  const gamePoss = clamp((hs + as) / 2.12 + gaussian(rng) * 1.8, 58, 84);
  const drift = rng() < 0.55 ? 0 : rng() < 0.5 ? 1 : -1;
  return { home: oneBox(gamePoss + drift, rng), away: oneBox(gamePoss - drift, rng), minutes: 40 };
}

export function liveMinutes(half: number) {
  return half <= 2 ? 40 : 40 + (half - 2) * 5;
}

export function boxFromLive(live: LiveGame): { home: GameBox; away: GameBox; minutes: number } {
  const minutes = liveMinutes(live.half);
  const fromLines = (rows: RecapPlayer[] | undefined): GameBox | null => {
    if (!rows?.length) return null;
    const fga = rows.reduce((n, p) => n + p.fga, 0);
    const to = rows.reduce((n, p) => n + (p.to ?? 0), 0);
    const fta = rows.reduce((n, p) => n + (p.fta ?? 0), 0);
    if (fga + to + fta < 20) return null;
    const orb = clamp(Math.round(fga * 0.12), 3, 16);
    const poss = Math.max(40, Math.round(fga - orb + to + 0.475 * fta));
    return { poss, fga, orb, to, fta: clamp(fta, 6, teamFtaCap(minutes)) };
  };
  const linedHome = fromLines(live.homeLines);
  const linedAway = fromLines(live.awayLines);
  if (linedHome && linedAway) return { home: linedHome, away: linedAway, minutes };

  const empty = (): GameBox => ({ poss: 0, fga: 0, orb: 0, to: 0, fta: 0 });
  const home = empty();
  const away = empty();
  for (const e of live.log) {
    if (!e.kind || e.kind === "period" || !e.poss) continue;
    const b = e.poss === "home" ? home : away;
    b.poss++;
    if (e.kind === "two" || e.kind === "three") {
      b.fga++;
      if (e.kind === "two" && e.pts === 3) b.fta += 1;
    } else if (e.kind === "ft") {
      b.fta += 2;
    } else if (e.kind === "to") {
      b.to++;
    }
  }
  if (home.poss < 20 || away.poss < 20) {
    return estimateGameBoxes(live.homeScore, live.awayScore, () => 0.37);
  }
  return { home, away, minutes };
}

export function gamePossessions(home?: GameBox, away?: GameBox, hs = 70, as = 70) {
  if (home && away) return (home.poss + away.poss) / 2;
  if (home) return home.poss;
  if (away) return away.poss;
  return clamp((hs + as) / 2.12, 58, 84);
}

export function ftaCap(minutes: number) {
  return minutes > 40 ? 20 : 16;
}

export function teamFtaCap(minutes: number) {
  return minutes > 40 ? 40 : 34;
}

/** College games don't hand one guy 30 free throws. Park extras on teammates. */
export function clampPlayerFta(lines: RecapPlayer[], minutes = 40): RecapPlayer[] {
  const cap = ftaCap(minutes);
  const out = lines.map((p) => ({ ...p, fta: Math.max(0, p.fta ?? 0), ftm: Math.max(0, p.ftm ?? 0) }));
  let poolA = 0;
  let poolM = 0;
  for (const p of out) {
    const fta0 = p.fta ?? 0;
    const ftm0 = Math.min(p.ftm ?? 0, fta0);
    p.ftm = ftm0;
    if (fta0 <= cap) continue;
    const extra = fta0 - cap;
    const extraM = Math.max(0, ftm0 - cap);
    p.fta = cap;
    p.ftm = Math.min(ftm0, cap);
    p.pts = Math.max(0, p.pts - extraM);
    poolA += extra;
    poolM += extraM;
  }
  if (poolA > 0) {
    const order = out.map((_, i) => i).sort((a, b) => (out[b]!.min || out[b]!.pts) - (out[a]!.min || out[a]!.pts));
    let guard = 0;
    while (poolA > 0 && guard++ < 80) {
      let gave = false;
      for (const i of order) {
        if (poolA <= 0) break;
        const p = out[i]!;
        if ((p.fta ?? 0) >= cap) continue;
        p.fta = (p.fta ?? 0) + 1;
        poolA -= 1;
        if (poolM > 0) {
          p.ftm = (p.ftm ?? 0) + 1;
          p.pts += 1;
          poolM -= 1;
        }
        gave = true;
      }
      if (!gave) break;
    }
  }
  if (poolM > 0) {
    const star = [...out].sort((a, b) => b.pts - a.pts)[0];
    if (star) {
      const twos = Math.floor(poolM / 2);
      if (twos) {
        star.fgm += twos;
        star.fga += twos;
        star.pts += twos * 2;
      }
    }
  }
  return out.map((p) => ({ ...p, ftm: Math.min(p.ftm ?? 0, p.fta ?? 0) }));
}

/** Shared-pace score. Both teams live on the same possession count. */
export function projectScore(
  rng: Rng,
  homeOvr: number,
  awayOvr: number,
  opts: {
    site?: Site;
    era?: number | null;
    homeChem?: number;
    awayChem?: number;
    youOff?: number;
    youDef?: number;
    youHome?: boolean;
    hca?: number;
  } = {},
): { homeScore: number; awayScore: number; poss: number } {
  const pace = eraPace(opts.era ?? null);
  const poss = clamp(pace.base + gaussian(rng) * 2.2, pace.lo, pace.hi);
  const old = opts.era != null && opts.era < 1980;
  const chemH = ((opts.homeChem ?? 60) - 60) * 0.05;
  const chemA = ((opts.awayChem ?? 60) - 60) * 0.05;
  let youH = 0;
  let youA = 0;
  if (opts.youHome === true) {
    youH += ((opts.youOff ?? 48) - 50) * 0.06;
    youA -= ((opts.youDef ?? 48) - 50) * 0.05;
  } else if (opts.youHome === false) {
    youA += ((opts.youOff ?? 48) - 50) * 0.06;
    youH -= ((opts.youDef ?? 48) - 50) * 0.05;
  }
  const avg = 107;
  const offH = avg + (homeOvr - 72) * 0.58 + chemH + youH;
  const defH = avg - (homeOvr - 72) * 0.5;
  const offA = avg + (awayOvr - 72) * 0.58 + chemA + youA;
  const defA = avg - (awayOvr - 72) * 0.5;
  const homeCourt = opts.site === "neutral" ? 1 : (opts.hca ?? 1.014);
  let hPpp = ((offH * defA) / (avg * 100)) * homeCourt;
  let aPpp = (offA * defH) / (avg * 100) / (opts.site === "neutral" ? 1 : 1.01);
  hPpp *= 1 + gaussian(rng) * 0.065;
  aPpp *= 1 + gaussian(rng) * 0.065;
  hPpp = clamp(hPpp, 0.82, 1.22);
  aPpp = clamp(aPpp, 0.82, 1.22);
  let hs = Math.round(poss * hPpp);
  let as = Math.round(poss * aPpp);
  const lo = old ? 55 : 58;
  const hi = old ? 99 : 92;
  hs = clamp(hs, lo, hi);
  as = clamp(as, lo, hi);
  if (hs === as) {
    if (rng() > 0.5) hs += 1;
    else as += 1;
  }
  if (Math.abs(hs - as) >= 14 && rng() < 0.1) {
    const leader = hs > as ? "h" : "a";
    const pull = 5 + Math.round(rng() * 4);
    if (leader === "h") {
      hs = Math.max(as + 1, hs - pull);
      as = Math.min(hs - 1, as + Math.round(pull * 0.45));
    } else {
      as = Math.max(hs + 1, as - pull);
      hs = Math.min(as - 1, hs + Math.round(pull * 0.45));
    }
  }
  return { homeScore: hs, awayScore: as, poss: Math.round(poss) };
}
