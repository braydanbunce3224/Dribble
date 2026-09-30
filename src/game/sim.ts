import type { GameBox, GameState, Player, RecapPlayer, Site } from "./types";
import { TEAM_BY_ID } from "./teams";
import { logBoxFaults, topUp } from "./scoreFloor";
import { availableRoster, effectiveMpg } from "./college";
import { teamChemistry } from "./chemistry";
import { simBias } from "./league";
import { clamp, gaussian, type Rng } from "./rng";
import { eraPace, eraThreeScale } from "./era";
import { clampPlayerFta, ftaCap, teamFtaCap } from "./engine-util";
import { gymSimEdge } from "./gym";
import { staffDefEdge, staffOffEdge, staffSchemeEdge, fatigueMpg, isStarter } from "./program";
import { rivalryEdge } from "./rivalry";

export interface SimmedGame {
  homeScore: number;
  awayScore: number;
  poss: number;
  minutes: number;
  homeBox: GameBox;
  awayBox: GameBox;
  homeLines: RecapPlayer[];
  awayLines: RecapPlayer[];
  /** Factual possessions from this sim, used by the news. Not flavor. */
  tape?: string[];
}

export function blankLine(p: Player): RecapPlayer {
  return {
    id: p.id,
    name: `${p.first} ${p.last}`,
    pos: p.pos,
    min: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    to: 0,
  };
}

export function rotationOf(state: GameState, teamId: string): Player[] {
  const real = availableRoster(state, teamId)
    .sort((a, b) => {
      const as = teamId === state.playerTeamId && isStarter(state, a.id) ? 1 : 0;
      const bs = teamId === state.playerTeamId && isStarter(state, b.id) ? 1 : 0;
      return bs - as || fatigueMpg(state, b) - fatigueMpg(state, a) || b.ovr - a.ovr;
    })
    .slice(0, 10);
  if (real.length >= 5) return real;
  const pos: Player["pos"][] = ["PG", "SG", "SF", "PF", "C"];
  const fillers: Player[] = Array.from({ length: 8 - real.length }, (_, i) => ({
    id: `wo-${teamId}-${i}`,
    first: "Walk",
    last: `On${i + 1}`,
    pos: pos[i % 5]!,
    year: 2,
    ovr: 60,
    potential: 60,
    morale: 58,
    teamId,
    mpg: 18,
    skills: { shoot: 58, finish: 60, defense: 58, iq: 58 },
    seasonMinutes: 0,
    seasonGames: 0,
    careerMinutes: 0,
    careerGames: 0,
  }));
  return [...real, ...fillers].slice(0, 10);
}

function sk(p: Player, key: keyof Player["skills"]): number {
  return (p.skills?.[key] ?? p.ovr) / 100;
}

function usageW(p: Player): number {
  const usg = p.usage ?? p.mpg * 2.15;
  return Math.max(0.4, p.mpg) * (0.55 + usg / 50) * (0.7 + sk(p, "shoot") * 0.4 + sk(p, "finish") * 0.45);
}

function pickWeighted(rng: Rng, players: Player[], weight: (p: Player) => number): Player {
  const w = players.map(weight);
  let t = rng() * Math.max(0.001, w.reduce((s, n) => s + n, 0));
  for (let i = 0; i < players.length; i++) {
    t -= w[i]!;
    if (t <= 0) return players[i]!;
  }
  return players[0]!;
}

export function onCourtFive(rng: Rng, roster: Player[], target: number[], played: number[]): Player[] {
  if (roster.length <= 5) return roster.slice();
  const picked: Player[] = [];
  const used = new Set<number>();
  for (let k = 0; k < 5; k++) {
    const weights = roster.map((p, i) => {
      if (used.has(i)) return 0;
      const left = Math.max(0.2, (target[i] ?? 12) - (played[i] ?? 0));
      return left * left * (p.mpg + 3);
    });
    const sum = weights.reduce((s, n) => s + n, 0);
    if (sum <= 0) break;
    let t = rng() * sum;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      t -= weights[i]!;
      if (t <= 0) {
        idx = i;
        break;
      }
    }
    used.add(idx);
    picked.push(roster[idx]!);
  }
  return picked;
}

function targetMinutes(roster: Player[], total: number): number[] {
  const raw = roster.map((p, i) => {
    const starter = i < 5 ? 1.18 : 0.72;
    return Math.max(i < 8 ? 4 : 0, effectiveMpg(p) * starter);
  });
  const sum = raw.reduce((s, n) => s + n, 0) || 1;
  let mins = raw.map((n) => (n / sum) * total);
  mins = mins.map((m, i) => (i < 8 ? clamp(m, i < 5 ? 18 : 6, 38) : clamp(m, 0, 16)));
  let drift = total - mins.reduce((s, n) => s + n, 0);
  let guard = 0;
  while (Math.abs(drift) > 0.05 && guard++ < 24) {
    const i = guard % mins.length;
    const next = clamp(mins[i]! + Math.sign(drift) * 0.5, 0, 38);
    drift -= next - mins[i]!;
    mins[i] = next;
  }
  return mins.map((m) => Math.round(m * 10) / 10);
}

function threeShare(p: Player, era: number | null | undefined): number {
  const scale = eraThreeScale(era);
  if (scale <= 0) return 0;
  const byPos = { PG: 0.38, SG: 0.46, SF: 0.36, PF: 0.18, C: 0.05 }[p.pos];
  const shoot = sk(p, "shoot");
  const base = scale * byPos * (0.45 + shoot);
  return clamp(base, 0.02 * scale, 0.62 * scale);
}

function findLine(lines: RecapPlayer[], id: string): RecapPlayer | undefined {
  return lines.find((x) => x.id === id);
}

export function credit(line: RecapPlayer | undefined, patch: Partial<RecapPlayer>) {
  if (!line) return;
  const scoring = "fgm" in patch || "tpm" in patch || "ftm" in patch || "pts" in patch;
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v !== "number" || k === "pts") continue;
    (line as unknown as Record<string, number>)[k] = ((line as unknown as Record<string, number>)[k] ?? 0) + v;
  }
  if (!scoring) return;
  if ((line.tpm ?? 0) > (line.fgm || 0)) line.fgm = line.tpm ?? 0;
  if ((line.tpa ?? 0) > (line.fga || 0)) line.fga = line.tpa ?? 0;
  if ((line.fgm || 0) > (line.fga || 0)) line.fga = line.fgm || 0;
  if ((line.ftm ?? 0) > (line.fta ?? 0)) line.fta = line.ftm ?? 0;
  const tpm = line.tpm ?? 0;
  const ftm = line.ftm ?? 0;
  const twos = Math.max(0, (line.fgm || 0) - tpm);
  line.pts = twos * 2 + tpm * 3 + ftm;
}

function teamDef(on: Player[]): number {
  if (!on.length) return 0.6;
  return on.reduce((s, p) => s + sk(p, "defense"), 0) / on.length;
}

function teamIq(on: Player[]): number {
  if (!on.length) return 0.6;
  return on.reduce((s, p) => s + sk(p, "iq"), 0) / on.length;
}

function boxOf(lines: RecapPlayer[], extraOrb: number): GameBox {
  const fga = lines.reduce((n, p) => n + p.fga, 0);
  const to = lines.reduce((n, p) => n + (p.to ?? 0), 0);
  const fta = lines.reduce((n, p) => n + (p.fta ?? 0), 0);
  const poss = Math.max(40, Math.round(fga - extraOrb + to + 0.475 * fta));
  return { poss, fga, orb: extraOrb, to, fta };
}

function capTeam(lines: RecapPlayer[], lo: number, hi: number) {
  const order = [...lines].sort((a, b) => b.pts - a.pts || b.fga - a.fga);
  const total = () => lines.reduce((s, p) => s + p.pts, 0);
  let guard = 0;
  while (total() > hi && guard++ < 80) {
    const p = order[guard % order.length]!;
    if ((p.ftm ?? 0) > 0) {
      p.ftm = (p.ftm ?? 0) - 1;
      p.fta = Math.max((p.fta ?? 1) - 1, p.ftm ?? 0);
      p.pts -= 1;
    } else if ((p.tpm ?? 0) > 0) {
      p.tpm = (p.tpm ?? 0) - 1;
      p.fgm -= 1;
      p.pts -= 3;
    } else if (p.fgm > 0) {
      p.fgm -= 1;
      p.pts -= 2;
    }
  }
  while (total() < lo && guard++ < 160) {
    const p = order[guard % order.length]!;
    if (!p) break;
    const need = lo - total();
    if (need >= 2 || (p.fta ?? 0) >= 14) {
      p.fgm += 1;
      p.fga += 1;
      p.pts += 2;
    } else {
      p.ftm = (p.ftm ?? 0) + 1;
      p.fta = (p.fta ?? 0) + 1;
      p.pts += 1;
    }
  }
}

function floorTeamFta(lines: RecapPlayer[], min = 4) {
  let fta = lines.reduce((n, p) => n + (p.fta ?? 0), 0);
  if (fta >= min) return lines;
  const order = [...lines].sort((a, b) => b.min - a.min || b.pts - a.pts);
  let i = 0;
  while (fta < min && i < 24) {
    const p = order[i % order.length];
    if (p && p.min > 0) {
      p.fta = (p.fta ?? 0) + 1;
      fta++;
    }
    i++;
  }
  return lines;
}

function finishLines(lines: RecapPlayer[], minutes: number): RecapPlayer[] {
  const live = lines.filter((p) => p.min > 0.4 || p.pts > 0 || p.fga > 0);
  const sum = live.reduce((n, p) => n + p.min, 0) || 1;
  const scaled = live.map((p) => ({ ...p, min: clamp(Math.round((p.min / sum) * minutes * 5), 1, minutes - 2) }));
  let drift = minutes * 5 - scaled.reduce((n, p) => n + p.min, 0);
  let i = 0;
  while (drift !== 0 && scaled.length && i < 40) {
    const row = scaled[i % scaled.length]!;
    if (drift > 0 && row.min < minutes - 2) {
      row.min += 1;
      drift -= 1;
    } else if (drift < 0 && row.min > 1) {
      row.min -= 1;
      drift += 1;
    }
    i++;
  }
  return scaled.sort((a, b) => b.pts - a.pts || b.min - a.min);
}

function spreadStat(lines: RecapPlayer[], roster: Player[], key: "stl" | "blk" | "pf" | "reb", total: number, weight: (p: Player) => number) {
  const order = [...lines].filter((l) => l.min > 0);
  if (!order.length || total <= 0) return;
  const weights = order.map((l) => {
    const p = roster.find((r) => r.id === l.id);
    return Math.max(0.2, p ? weight(p) * Math.max(1, l.min) : l.min);
  });
  const sum = weights.reduce((s, n) => s + n, 0) || 1;
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map((n) => Math.floor(n));
  let left = total - out.reduce((s, n) => s + n, 0);
  const frac = raw.map((n, i) => ({ i, f: n - Math.floor(n) })).sort((a, b) => b.f - a.f);
  for (const o of frac) {
    if (left <= 0) break;
    out[o.i]! += 1;
    left--;
  }
  order.forEach((l, i) => {
    if (key === "reb") l.reb += out[i] ?? 0;
    else (l as RecapPlayer)[key] = ((l as RecapPlayer)[key] ?? 0) + (out[i] ?? 0);
  });
}

function shapeShooting(lines: RecapPlayer[], talentGap: number) {
  const sum = (k: keyof RecapPlayer) => lines.reduce((n, p) => n + (Number(p[k]) || 0), 0);
  const fgCap = talentGap >= 8 ? 0.52 : 0.49;
  let guard = 0;
  while (guard++ < 14) {
    const fgm = sum("fgm");
    const fga = sum("fga");
    if (fga < 30 || fgm / fga <= fgCap) break;
    const p = [...lines].filter((x) => x.fgm > 0).sort((a, b) => b.fgm / Math.max(1, b.fga) - a.fgm / Math.max(1, a.fga))[0];
    if (!p) break;
    if ((p.tpm ?? 0) > 0 && p.fgm <= (p.tpm ?? 0)) {
      p.tpm = (p.tpm ?? 0) - 1;
      p.fgm -= 1;
      p.pts = Math.max(0, p.pts - 3);
    } else {
      p.fgm -= 1;
      p.pts = Math.max(0, p.pts - 2);
    }
  }
  guard = 0;
  while (sum("pts") > 86 && guard++ < 8) {
    const p = [...lines].filter((x) => x.fgm > (x.tpm ?? 0) && x.pts >= 2).sort((a, b) => b.pts - a.pts)[0];
    if (!p) break;
    p.fgm -= 1;
    p.pts = Math.max(0, p.pts - 2);
  }
  for (const p of lines) {
    let tpm = p.tpm ?? 0;
    const tpa = p.tpa ?? 0;
    let drop = 0;
    if (tpa >= 6 && tpm >= tpa) drop = 1;
    else if (tpm >= 8) drop = 1;
    if (drop > 0) {
      p.tpm = tpm - drop;
      p.fgm = Math.max(0, p.fgm - drop);
      p.pts = Math.max(0, p.pts - drop * 3);
    }
  }
  guard = 0;
  while (guard++ < 12) {
    const tpm = sum("tpm");
    const tpa = sum("tpa");
    if (tpa < 8 || tpm <= 0) break;
    const pct = tpm / tpa;
    if (tpa >= 18 && pct <= 0.37) break;
    if (tpa < 18 && pct <= 0.4) break;
    const p = [...lines].filter((x) => (x.tpm ?? 0) > 0).sort((a, b) => (b.tpm ?? 0) - (a.tpm ?? 0))[0];
    if (!p) break;
    p.tpm = (p.tpm ?? 0) - 1;
    p.fgm = Math.max(0, p.fgm - 1);
    p.pts = Math.max(0, p.pts - 3);
  }
  guard = 0;
  while (guard++ < 3) {
    const tpm = sum("tpm");
    const tpa = sum("tpa");
    if (tpa < 10 || tpm / tpa >= 0.32) break;
    const p = [...lines].filter((x) => (x.tpa ?? 0) > (x.tpm ?? 0)).sort((a, b) => (b.tpa ?? 0) - (b.tpm ?? 0) - ((a.tpa ?? 0) - (a.tpm ?? 0)))[0];
    if (!p) break;
    p.tpm = (p.tpm ?? 0) + 1;
    p.fgm += 1;
    p.pts += 3;
  }
  guard = 0;
  while (sum("tpa") < 18 && sum("fga") < 62 && sum("fgm") / Math.max(1, sum("fga")) > 0.45 && guard++ < 8) {
    const p = [...lines].sort((a, b) => (a.tpa ?? 0) - (b.tpa ?? 0))[0];
    if (!p) break;
    p.tpa = (p.tpa ?? 0) + 1;
    p.fga += 1;
  }
}

function clampFouls(lines: RecapPlayer[]) {
  for (const p of lines) if ((p.pf ?? 0) > 5) p.pf = 5;
  const pfOf = () => lines.reduce((n, p) => n + (p.pf ?? 0), 0);
  let guard = 0;
  while (pfOf() > 21 && guard++ < 40) {
    const p = [...lines].sort((a, b) => (b.pf ?? 0) - (a.pf ?? 0))[0];
    if (!p || (p.pf ?? 0) <= 0) break;
    p.pf = (p.pf ?? 0) - 1;
  }
  guard = 0;
  while (pfOf() < 15 && guard++ < 10) {
    const p = [...lines].filter((x) => (x.pf ?? 0) < 4).sort((a, b) => (a.pf ?? 0) - (b.pf ?? 0))[0];
    if (!p) break;
    p.pf = (p.pf ?? 0) + 1;
  }
}
function trimFreeThrows(lines: RecapPlayer[]) {
  const ftaOf = () => lines.reduce((n, p) => n + (p.fta ?? 0), 0);
  const ftmOf = () => lines.reduce((n, p) => n + (p.ftm ?? 0), 0);
  let guard = 0;
  while (ftaOf() > 25 && guard++ < 40) {
    const p = [...lines].sort((a, b) => (b.fta ?? 0) - (a.fta ?? 0))[0];
    if (!p || (p.fta ?? 0) <= 0) break;
    if ((p.ftm ?? 0) > 0) {
      p.ftm = (p.ftm ?? 0) - 1;
      p.pts = Math.max(0, p.pts - 1);
    }
    p.fta = Math.max(0, (p.fta ?? 0) - 1);
    p.ftm = Math.min(p.ftm ?? 0, p.fta ?? 0);
  }
  guard = 0;
  while (ftaOf() < 15 && guard++ < 12) {
    const p = [...lines].sort((a, b) => (a.fta ?? 0) - (b.fta ?? 0))[0];
    if (!p) break;
    p.fta = (p.fta ?? 0) + 1;
    if ((p.fta ?? 0) % 4 !== 0) {
      p.ftm = (p.ftm ?? 0) + 1;
      p.pts += 1;
    }
  }
  guard = 0;
  while (ftaOf() >= 8 && ftmOf() / Math.max(1, ftaOf()) < 0.69 && guard++ < 8) {
    const p = [...lines].filter((x) => (x.fta ?? 0) > (x.ftm ?? 0)).sort((a, b) => (b.fta ?? 0) - (a.fta ?? 0))[0];
    if (!p) break;
    p.ftm = (p.ftm ?? 0) + 1;
    p.pts += 1;
  }
  guard = 0;
  while (ftaOf() >= 10 && ftmOf() / Math.max(1, ftaOf()) > 0.76 && guard++ < 8) {
    const p = [...lines].filter((x) => (x.ftm ?? 0) > 0).sort((a, b) => (b.ftm ?? 0) - (a.ftm ?? 0))[0];
    if (!p) break;
    p.ftm = (p.ftm ?? 0) - 1;
    p.pts = Math.max(0, p.pts - 1);
  }
}

/** Keep a repaired winner from walking back into the 90s or a 55% night. */
export function parkBox(lines: RecapPlayer[], floor: number) {
  const score = () => lines.reduce((n, p) => n + p.pts, 0);
  const fg = () => {
    const fga = lines.reduce((n, p) => n + p.fga, 0);
    const fgm = lines.reduce((n, p) => n + p.fgm, 0);
    return fga ? fgm / fga : 0;
  };
  let guard = 0;
  while ((score() > 84 || fg() > 0.5) && score() - 2 >= floor && guard++ < 12) {
    const p = [...lines].filter((x) => x.fgm > (x.tpm ?? 0) && x.pts >= 2).sort((a, b) => b.pts - a.pts)[0];
    if (!p) break;
    p.fgm -= 1;
    p.pts = Math.max(0, p.pts - 2);
  }
}

export function parkPair(home: RecapPlayer[], away: RecapPlayer[]) {
  const sc = (rows: RecapPlayer[]) => rows.reduce((n, p) => n + p.pts, 0);
  const leader = sc(home) >= sc(away) ? home : away;
  const trailer = leader === home ? away : home;
  parkBox(trailer, 48);
  parkBox(leader, sc(trailer) + 1);
  for (const lines of [home, away]) {
    for (const p of lines) {
      if (p.fga >= 5 && p.fgm / p.fga > 0.8) p.fga += 1;
      const tpa = p.tpa ?? 0;
      const tpm = p.tpm ?? 0;
      if (tpa >= 6 && tpm >= tpa - 1 && tpm >= 6) {
        p.tpa = tpa + 1;
        p.fga += 1;
      }
    }
  }
}

/** Fix impossible lines only. Team totals come from the possessions. */
export function finishRealism(homeLines: RecapPlayer[], awayLines: RecapPlayer[], _homeR: Player[], _awayR: Player[], _rng: Rng) {
  const legal = (lines: RecapPlayer[]) => {
    for (const p of lines) {
      if ((p.tpm ?? 0) > (p.tpa ?? 0)) p.tpm = p.tpa ?? 0;
      if (p.fgm > p.fga) p.fgm = p.fga;
      if ((p.ftm ?? 0) > (p.fta ?? 0)) p.ftm = p.fta ?? 0;
      if ((p.pf ?? 0) > 5) p.pf = 5;
      if (p.fga >= 5 && p.fgm / Math.max(1, p.fga) > 0.85) p.fga += 1;
      if ((p.tpa ?? 0) >= 6 && (p.tpm ?? 0) >= (p.tpa ?? 0)) {
        p.tpa = (p.tpa ?? 0) + 1;
        p.fga += 1;
      }
    }
    let fgm = lines.reduce((n, p) => n + p.fgm, 0);
    let ast = lines.reduce((n, p) => n + p.ast, 0);
    const order = [...lines].sort((a, b) => b.ast - a.ast);
    while (ast > fgm && order.length) {
      const p = order.find((x) => x.ast > 0);
      if (!p) break;
      p.ast -= 1;
      ast -= 1;
    }
  };
  legal(homeLines);
  legal(awayLines);
}

export function simContest(
  state: GameState,
  homeId: string,
  awayId: string,
  rng: Rng,
  opts: { site?: Site; youOff?: number; youDef?: number; youHome?: boolean; tempo?: number } = {},
): SimmedGame {
  const homeR = rotationOf(state, homeId);
  const awayR = rotationOf(state, awayId);
  const era = state.eraDecade;
  const pace = eraPace(era);
  const styleOf = () => {
    const r = rng();
    if (r < 0.16) return "press" as const;
    if (r < 0.32) return "pack" as const;
    if (r < 0.5) return "push" as const;
    if (r < 0.66) return "slow" as const;
    return "normal" as const;
  };
  const homeStyle = styleOf();
  const awayStyle = styleOf();
  let possN = pace.base + (opts.tempo ?? 0) + gaussian(rng) * 3.6;
  if (homeStyle === "push") possN += 4;
  if (awayStyle === "push") possN += 4;
  if (homeStyle === "slow") possN -= 4;
  if (awayStyle === "slow") possN -= 4;
  possN = clamp(possN, pace.lo - 6, pace.hi + 4);
  let n = Math.round(possN);
  const minutes0 = 40;
  const homeT = targetMinutes(homeR, minutes0 * 5);
  const awayT = targetMinutes(awayR, minutes0 * 5);
  const homePlayed = homeR.map(() => 0);
  const awayPlayed = awayR.map(() => 0);
  const homeLines = homeR.map(blankLine);
  const awayLines = awayR.map(blankLine);
  let homeOrb = 0;
  let awayOrb = 0;
  const homeChem = teamChemistry(state, homeId).score;
  const awayChem = teamChemistry(state, awayId).score;
  const homeCourt = opts.site === "neutral" ? 0 : gymSimEdge(state, homeId) + rivalryEdge(homeId, awayId);
  const homeName = TEAM_BY_ID[homeId]?.name ?? "Home";
  const awayName = TEAM_BY_ID[awayId]?.name ?? "Away";
  const beats: { i: number; ot: boolean; home: boolean; hs: number; as: number; pts: number; text: string }[] = [];
  let hsRun = 0;
  let asRun = 0;
  let trip = 0;
  let atPlay = 0;
  let inOt = false;
  const bump = (home: boolean, pts: number, text: string) => {
    if (pts > 0) {
      if (home) hsRun += pts;
      else asRun += pts;
    }
    beats.push({ i: atPlay, ot: inOt, home, hs: hsRun, as: asRun, pts, text });
  };
  let youH = 0;
  let youA = 0;
  if (opts.youHome === true) {
    youH += ((opts.youOff ?? 48) - 50) * 0.0011 + simBias(state) + staffOffEdge(state) + staffSchemeEdge(state);
    youA -= ((opts.youDef ?? 48) - 50) * 0.001 + staffDefEdge(state);
  } else if (opts.youHome === false) {
    youA += ((opts.youOff ?? 48) - 50) * 0.0011 + simBias(state) + staffOffEdge(state) + staffSchemeEdge(state);
    youH -= ((opts.youDef ?? 48) - 50) * 0.001 + staffDefEdge(state);
  }

  const tickMin = (side: "home" | "away", five: Player[], dt: number) => {
    const roster = side === "home" ? homeR : awayR;
    const played = side === "home" ? homePlayed : awayPlayed;
    const lines = side === "home" ? homeLines : awayLines;
    for (const p of five) {
      const i = roster.findIndex((x) => x.id === p.id);
      if (i < 0) continue;
      played[i] = (played[i] ?? 0) + dt;
      const line = lines[i];
      if (line) line.min += dt;
    }
  };

  const possOnce = (offHome: boolean, depth = 0) => {
    const offR = offHome ? homeR : awayR;
    const defR = offHome ? awayR : homeR;
    const offP = offHome ? homePlayed : awayPlayed;
    const defP = offHome ? awayPlayed : homePlayed;
    const offT = offHome ? homeT : awayT;
    const defT = offHome ? awayT : homeT;
    const offL = offHome ? homeLines : awayLines;
    const defL = offHome ? awayLines : homeLines;
    const on = onCourtFive(rng, offR, offT, offP);
    const defOn = onCourtFive(rng, defR, defT, defP);
    if (!on.length) return;
    atPlay = trip;
    const dt = 40 / Math.max(60, n);
    tickMin("home", offHome ? on : defOn, dt);
    tickMin("away", offHome ? defOn : on, dt);

    const def = teamDef(defOn);
    const iq = teamIq(on);
    const chem = ((offHome ? homeChem : awayChem) - 60) / 400;
    const hc = offHome ? homeCourt : -homeCourt * 0.35;
    const you = offHome ? youH : youA;
    const offOvr = on.reduce((s, p) => s + p.ovr, 0) / Math.max(1, on.length);
    const defOvr = defOn.reduce((s, p) => s + p.ovr, 0) / Math.max(1, defOn.length);
    const talent = (offOvr - defOvr) / 280;
    const dStyle = offHome ? awayStyle : homeStyle;
    const oStyle = offHome ? homeStyle : awayStyle;
    let toRate = 0.145 - (iq - 0.58) * 0.08 + (def - 0.58) * 0.04 - talent * 0.45 + (dStyle === "press" ? 0.06 : 0);
    toRate = clamp(toRate, 0.06, 0.28);
    let shooter = pickWeighted(rng, on, (p) => usageW(p));
    if ((findLine(offL, shooter.id)?.pts ?? 0) >= 42) {
      const cooler = on.filter((p) => p.id !== shooter.id && (findLine(offL, p.id)?.pts ?? 0) < 42);
      if (cooler.length) shooter = pickWeighted(rng, cooler, (p) => usageW(p));
      else {
        const other = on.filter((p) => p.id !== shooter.id).sort((a, b) => (findLine(offL, a.id)?.pts ?? 0) - (findLine(offL, b.id)?.pts ?? 0))[0];
        if (other) shooter = other;
      }
    }
    const sLine = findLine(offL, shooter.id);
    const mates = on.filter((p) => p.id !== shooter.id);
    const pass = () => {
      if (!mates.length) return;
      const guard = mates.some((p) => p.pos === "PG" || p.pos === "SG");
      const rate = 0.4 + iq * 0.1 + (guard ? 0.04 : 0);
      if (rng() > rate) return;
      const passer = pickWeighted(rng, mates, (p) => sk(p, "iq") * (p.pos === "PG" ? 2.4 : p.pos === "SG" ? 1.5 : 0.7) * Math.max(8, p.mpg));
      credit(findLine(offL, passer.id), { ast: 1 });
    };
    const putback = () => {
      if (depth >= 2) return;
      if (offHome) homeOrb++;
      else awayOrb++;
      const rebounder = pickWeighted(rng, on, (p) => (p.pos === "C" ? 3.3 : p.pos === "PF" ? 2.4 : 1) * (0.55 + sk(p, "finish")));
      credit(findLine(offL, rebounder.id), { reb: 1 });
      possOnce(offHome, depth + 1);
    };
    const defBoard = () => {
      if (!defOn.length) return;
      const rebounder = pickWeighted(rng, defOn, (p) => (p.pos === "C" ? 3.3 : p.pos === "PF" ? 2.4 : 1) * (0.55 + sk(p, "defense")));
      credit(findLine(defL, rebounder.id), { reb: 1 });
    };

    if (rng() < toRate) {
      credit(sLine, { to: 1 });
      let thief: Player | undefined;
      if (defOn.length && rng() < 0.55) {
        thief = pickWeighted(rng, defOn, (p) => (p.skills?.defense ?? 60) * (p.pos === "PG" || p.pos === "SG" ? 1.8 : 0.65));
        credit(findLine(defL, thief.id), { stl: 1 });
      }
      const who = `${shooter.first} ${shooter.last}`;
      bump(offHome, 0, thief ? `${thief.first} ${thief.last} stole it from ${who}` : `${who} turned it over`);
      return;
    }

    const foulSomeone = () => {
      if (!defOn.length) return;
      const who = pickWeighted(rng, defOn, (p) => (p.pos === "C" || p.pos === "PF" ? 1.35 : 1));
      const row = findLine(defL, who.id);
      if ((row?.pf ?? 0) < 5) credit(row, { pf: 1 });
    };
    const looseFoul = () => {
      if (rng() < (dStyle === "press" ? 0.14 : 0.09)) foulSomeone();
    };

    const ftr = clamp(0.12 + sk(shooter, "finish") * 0.1 + (dStyle === "press" ? 0.05 : 0) - def * 0.03, 0.06, 0.34);
    const playerCap = ftaCap(minutes0);
    const sideCap = teamFtaCap(minutes0);
    const already = sLine?.fta ?? 0;
    const teamFta = offL.reduce((n, p) => n + (p.fta ?? 0), 0);
    const ftRoom = Math.min(playerCap - already, sideCap - teamFta);
    if (ftRoom >= 2 && rng() < ftr * 0.7) {
      const attempts = ftRoom >= 2 && rng() < 0.12 ? Math.min(3, ftRoom) : Math.min(2, ftRoom);
      const ft = clamp(0.72 + (sk(shooter, "shoot") - 0.68) * 0.5, 0.52, 0.88);
      credit(sLine, { fta: attempts });
      let made = 0;
      for (let i = 0; i < attempts; i++) if (rng() < ft) made++;
      credit(sLine, { ftm: made, pts: made });
      if (made > 0) bump(offHome, made, `${shooter.first} ${shooter.last} made ${made} of ${attempts} free throws`);
      foulSomeone();
      return;
    }

    let share = threeShare(shooter, era);
    if (dStyle === "pack") share *= 0.55;
    if (oStyle === "push") share *= 1.12;
    const want3 = rng() < share;
    if (want3) {
      const make3 = clamp(
        0.33 + (sk(shooter, "shoot") - 0.55) * 0.14 - (def - 0.58) * 0.04 + hc * 0.15 + you * 0.2 + talent * 0.45 + chem * 0.06 + gaussian(rng) * 0.015,
        0.2,
        0.48,
      );
      credit(sLine, { fga: 1, tpa: 1 });
      if (rng() < make3) {
        credit(sLine, { fgm: 1, tpm: 1, pts: 3 });
        bump(offHome, 3, `${shooter.first} ${shooter.last} hit a three`);
        pass();
      } else if (rng() < clamp(0.32 + (sk(on.find((p) => p.pos === "C" || p.pos === "PF") ?? shooter, "finish") - 0.55) * 0.16 - def * 0.06, 0.22, 0.4)) {
        putback();
      } else {
        if (rng() < 0.1 && defOn.length) {
          const big = pickWeighted(rng, defOn, (p) => (p.skills?.defense ?? 60) * (p.pos === "C" ? 2.2 : p.pos === "PF" ? 1.4 : 0.35));
          credit(findLine(defL, big.id), { blk: 1 });
          bump(offHome, 0, `${big.first} ${big.last} blocked ${shooter.first} ${shooter.last}`);
        }
        defBoard();
      }
      looseFoul();
      return;
    }

    const make2 = clamp(
      0.46 + (sk(shooter, "finish") - 0.55) * 0.14 - (def - 0.58) * 0.05 + hc * 0.2 + you * 0.25 + talent * 0.7 + chem * 0.08 + gaussian(rng) * 0.012,
      0.28,
      0.66,
    );
    credit(sLine, { fga: 1 });
    if (rng() < make2) {
      credit(sLine, { fgm: 1, pts: 2 });
      let got = 2;
      let how = `${shooter.first} ${shooter.last} scored`;
      if ((sLine?.fta ?? 0) < ftaCap(minutes0) && rng() < 0.05 + sk(shooter, "finish") * 0.04) {
        const ft = clamp(0.72 + (sk(shooter, "shoot") - 0.68) * 0.5, 0.52, 0.88);
        credit(sLine, { fta: 1 });
        if (rng() < ft) {
          credit(sLine, { ftm: 1, pts: 1 });
          got = 3;
          how = `${shooter.first} ${shooter.last} scored and made the free throw`;
        } else how = `${shooter.first} ${shooter.last} scored and missed the free throw`;
        foulSomeone();
      }
      bump(offHome, got, how);
      pass();
    } else if (rng() < clamp(0.28 + (sk(on.find((p) => p.pos === "C" || p.pos === "PF") ?? shooter, "finish") - 0.55) * 0.12 - def * 0.04, 0.16, 0.4)) {
      putback();
    } else {
      if (rng() < 0.08 && defOn.length) {
        const big = pickWeighted(rng, defOn, (p) => (p.skills?.defense ?? 60) * (p.pos === "C" ? 2.2 : p.pos === "PF" ? 1.4 : 0.35));
        credit(findLine(defL, big.id), { blk: 1 });
        bump(offHome, 0, `${big.first} ${big.last} blocked ${shooter.first} ${shooter.last}`);
      }
      defBoard();
    }
    looseFoul();
  };

  let extra = 0;
  const runHalf = (count: number) => {
    for (let i = 0; i < count; i++) {
      trip += 1;
      possOnce(true);
      trip += 1;
      possOnce(false);
    }
  };
  const firstHalfCut = Math.round(n / 2) * 2;
  runHalf(Math.round(n / 2));
  runHalf(n - Math.round(n / 2));
  const score = (lines: RecapPlayer[]) => lines.reduce((s, p) => s + p.pts, 0);
  let hs = score(homeLines);
  let as = score(awayLines);
  let minutes = 40;
  while (hs === as && extra < 3) {
    extra++;
    inOt = true;
    minutes += 5;
    n += 8;
    runHalf(4);
    hs = score(homeLines);
    as = score(awayLines);
  }
  if (hs === as) {
    if (rng() > 0.5) {
      const star = homeLines.slice().sort((a, b) => b.fga - a.fga)[0];
      if (star) {
        credit(star, { ftm: 1, fta: 1, pts: 1 });
        bump(true, 1, `${star.name} made the free throw`);
      }
      hs += 1;
    } else {
      const star = awayLines.slice().sort((a, b) => b.fga - a.fga)[0];
      if (star) {
        credit(star, { ftm: 1, fta: 1, pts: 1 });
        bump(false, 1, `${star.name} made the free throw`);
      }
      as += 1;
    }
  }

  finishRealism(homeLines, awayLines, homeR, awayR, rng);
  hs = score(homeLines);
  as = score(awayLines);
  if (hs === as) {
    const homeSide = rng() > 0.5;
    const star = (homeSide ? homeLines : awayLines).slice().sort((a, b) => b.fga - a.fga)[0];
    if (star) {
      credit(star, { ftm: 1, fta: 1, pts: 1 });
      bump(homeSide, 1, `${star.name} made the free throw`);
    }
  }

  const homeDone = clampPlayerFta(finishLines(homeLines, minutes), minutes);
  const awayDone = clampPlayerFta(finishLines(awayLines, minutes), minutes);
  topUp(homeDone, homeDone.reduce((n, p) => n + p.pts, 0));
  topUp(awayDone, awayDone.reduce((n, p) => n + p.pts, 0));
  logBoxFaults("sim home", homeDone);
  logBoxFaults("sim away", awayDone);
  const homeScore = homeDone.reduce((n, p) => n + p.pts, 0);
  const awayScore = awayDone.reduce((n, p) => n + p.pts, 0);
  return {
    homeScore,
    awayScore,
    poss: n,
    minutes,
    homeBox: boxOf(homeDone, homeOrb),
    awayBox: boxOf(awayDone, awayOrb),
    homeLines: homeDone,
    awayLines: awayDone,
    tape: distillTape(beats, homeScore, awayScore, firstHalfCut, homeName, awayName),
  };
}

function distillTape(
  beats: { i: number; ot: boolean; home: boolean; hs: number; as: number; pts: number; text: string }[],
  finalH: number,
  finalA: number,
  firstHalfCut: number,
  homeName: string,
  awayName: string,
): string[] {
  const lastScore = [...beats].reverse().find((b) => b.pts > 0);
  const scoresOk = Boolean(lastScore && lastScore.hs === finalH && lastScore.as === finalA);
  const when = (b: { i: number; ot: boolean }) =>
    b.ot ? "in overtime" : b.i <= firstHalfCut ? "in the first half" : b.i > firstHalfCut * 1.7 ? "late in the second half" : "in the second half";
  const say = (b: { i: number; ot: boolean; hs: number; as: number; text: string }) =>
    scoresOk ? `${b.text} ${when(b)} (${homeName} ${b.hs}, ${awayName} ${b.as})` : `${b.text} ${when(b)}`;
  const out: string[] = [];
  const halfBeat = [...beats].reverse().find((b) => b.pts > 0 && !b.ot && b.i <= firstHalfCut);
  if (halfBeat && scoresOk) out.push(`Halftime was ${halfBeat.hs}–${halfBeat.as}.`);
  let bestPts = 0;
  let bestFrom = 0;
  let bestTo = -1;
  let cur = 0;
  let side: boolean | null = null;
  let start = 0;
  beats.forEach((b, idx) => {
    if (b.pts <= 0) {
      cur = 0;
      side = null;
      return;
    }
    if (b.home === side) cur += b.pts;
    else {
      cur = b.pts;
      side = b.home;
      start = idx;
    }
    if (cur > bestPts) {
      bestPts = cur;
      bestFrom = start;
      bestTo = idx;
    }
  });
  if (bestPts >= 8 && bestTo >= bestFrom) {
    const slice = beats.slice(bestFrom, bestTo + 1).filter((b) => b.pts > 0);
    const who = slice[0]?.home ? homeName : awayName;
    const bits = slice.slice(0, 4).map((b) => b.text).join(", then ");
    out.push(`${who} put together a ${bestPts}–0 run: ${bits}.`);
  }
  const swing = beats.find((b) => b.text.includes("stole") || b.text.includes("blocked"));
  if (swing) out.push(`${say(swing)}.`);
  const closing = beats.filter((b) => b.pts > 0).slice(-4);
  for (const b of closing) out.push(`${say(b)}.`);
  return out.slice(0, 8);
}

export function scaleLiveMinutes(lines: RecapPlayer[], minutes: number): RecapPlayer[] {
  return finishLines(lines, minutes);
}
