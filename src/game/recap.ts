import type { GameRecap, GameResult, GameSlot, GameState, LiveEvent, RecapPlayer, Site } from "./types";
import { TEAM_BY_ID } from "./teams";
import { clamp, hashString, mulberry32, type Rng } from "./rng";
import { gameKindLabel } from "./brand";
import { clampPlayerFta } from "./engine-util";
import { boxFaults, topUp } from "./scoreFloor";

const KIND: Record<GameSlot["kind"], string> = {
  conference: gameKindLabel("conference"),
  noncon: gameKindLabel("noncon"),
  mte: gameKindLabel("mte"),
  "conf-tourney": gameKindLabel("conf-tourney"),
  ncaa: gameKindLabel("ncaa"),
  nit: gameKindLabel("nit"),
  crown: gameKindLabel("crown"),
};

function nameOf(id: string) {
  return TEAM_BY_ID[id]?.name ?? id;
}

function mascotOf(id: string) {
  return TEAM_BY_ID[id]?.mascot ?? nameOf(id);
}

function siteLine(slot: Pick<GameSlot, "kind" | "site"> | undefined, homeId: string) {
  const kind = slot?.kind ?? "noncon";
  const neutral = kind === "mte" || kind === "ncaa" || kind === "nit" || kind === "crown" || kind === "conf-tourney" || slot?.site === "neutral";
  if (neutral) return "on a neutral floor";
  const host = nameOf(homeId);
  if (!host) return "at the host gym";
  return `at ${host}`;
}

function usable(rows: RecapPlayer[] | undefined, score: number): RecapPlayer[] | null {
  if (!rows?.length) return null;
  const pts = rows.reduce((n, p) => n + p.pts, 0);
  if (pts !== score) return null;
  return rows;
}

function rot(state: GameState, teamId: string) {
  return state.players.filter((p) => p.teamId === teamId).sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr);
}

function split(total: number, weights: number[], rng: Rng): number[] {
  const sum = weights.reduce((n, w) => n + w, 0) || 1;
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map((n) => Math.floor(n));
  let left = total - out.reduce((n, x) => n + x, 0);
  const order = raw.map((n, i) => ({ i, frac: n - Math.floor(n) + rng() * 0.02 })).sort((a, b) => b.frac - a.frac);
  for (const o of order) {
    if (left <= 0) break;
    out[o.i]! += 1;
    left--;
  }
  return out;
}

function boxPlayers(state: GameState, teamId: string, score: number, fga: number, minutes: number, rng: Rng): RecapPlayer[] {
  const use = rot(state, teamId).slice(0, 9);
  if (!use.length) return [];
  const minW = use.map((p, i) => Math.max(i < 8 ? 5 : 0, p.mpg * (i < 5 ? 1.15 : 0.75)));
  const mins = split(minutes * 5, minW, rng).map((m, i) => clamp(m, i < 5 ? 16 : 4, 38));
  const usg = use.map((p, i) => Math.max(2, mins[i]! * (0.35 + (p.usage ?? p.mpg * 2.15) / 90 + p.skills.shoot / 400 + p.skills.finish / 380)));
  const fgas = split(Math.max(fga, 48), usg, rng);
  const tpaShare = use.map((p) => {
    const byPos = { PG: 0.4, SG: 0.5, SF: 0.36, PF: 0.18, C: 0.05 }[p.pos];
    return clamp(byPos * (0.4 + p.skills.shoot / 140), 0.04, 0.62);
  });
  const tpas = fgas.map((n, i) => clamp(Math.round(n * tpaShare[i]!), 0, n));
  const tpPct = use.map((p) => clamp(0.29 + (p.skills.shoot - 60) * 0.0035 + rng() * 0.02, 0.2, 0.44));
  const twoPct = use.map((p) => clamp(0.44 + (p.skills.finish - 60) * 0.004 - rng() * 0.02, 0.34, 0.62));
  const ftPct = use.map((p) => clamp(0.69 + (p.skills.shoot - 60) * 0.004, 0.55, 0.88));
  const tpms = tpas.map((n, i) => clamp(Math.round(n * tpPct[i]!), 0, n));
  const twoA = fgas.map((n, i) => n - tpas[i]!);
  const twoM = twoA.map((n, i) => clamp(Math.round(n * twoPct[i]!), 0, n));
  const fgm = twoM.map((n, i) => n + tpms[i]!);
  let pts = fgm.map((_, i) => twoM[i]! * 2 + tpms[i]! * 3);
  const ftas = use.map((p, i) => clamp(Math.round(mins[i]! * (0.12 + p.skills.finish / 500) + rng() * 2), 0, 14));
  const ftms = ftas.map((n, i) => clamp(Math.round(n * ftPct[i]!), 0, n));
  pts = pts.map((n, i) => n + ftms[i]!);
  let drift = score - pts.reduce((s, n) => s + n, 0);
  const order = use.map((_, i) => i).sort((a, b) => usg[b]! - usg[a]!);
  let guard = 0;
  while (drift !== 0 && guard++ < 80) {
    const i = order[guard % order.length]!;
    if (drift >= 2) {
      twoM[i]! += 1;
      fgm[i]! += 1;
      fgas[i]! += 1;
      pts[i]! += 2;
      drift -= 2;
    } else if (drift === 1 && ftas[i]! < 14) {
      ftas[i]! += 1;
      ftms[i]! += 1;
      pts[i]! += 1;
      drift -= 1;
    } else if (drift <= -3 && tpms[i]! > 0) {
      tpms[i]! -= 1;
      fgm[i]! -= 1;
      pts[i]! -= 3;
      drift += 3;
    } else if (drift <= -2 && twoM[i]! > 0) {
      twoM[i]! -= 1;
      fgm[i]! -= 1;
      pts[i]! -= 2;
      drift += 2;
    } else if (drift < 0 && ftms[i]! > 0) {
      ftms[i]! -= 1;
      pts[i]! -= 1;
      drift += 1;
    }
  }
  if (drift > 0) {
    let g = 0;
    while (drift >= 2 && g++ < 40) {
      const i = order[g % order.length]!;
      twoM[i]! += 1;
      fgm[i]! += 1;
      fgas[i]! += 1;
      pts[i]! += 2;
      drift -= 2;
    }
    if (drift === 1) {
      const open = order.find((i) => ftas[i]! < 14);
      if (open != null) {
        ftas[open]! += 1;
        ftms[open]! += 1;
        pts[open]! += 1;
        drift = 0;
      } else {
        pts[order[0]!]! += 1;
        drift = 0;
      }
    }
  } else if (drift < 0) {
    const star = order[0]!;
    pts[star]! = Math.max(0, pts[star]! + drift);
  }
  const rebW = use.map((p, i) => Math.max(1, mins[i]! * (p.pos === "C" ? 0.32 : p.pos === "PF" ? 0.26 : p.pos === "SF" ? 0.16 : 0.1) * (0.8 + p.skills.defense / 280)));
  const rebs = split(clamp(Math.round(30 + rng() * 8), 24, 42), rebW, rng);
  const astW = use.map((p, i) => Math.max(0.5, mins[i]! * (p.pos === "PG" ? 0.26 : p.pos === "SG" ? 0.14 : 0.07) * (p.skills.iq / 70)));
  const madeFg = fgm.reduce((s, n) => s + n, 0);
  const asts = split(clamp(Math.round(madeFg * (0.48 + rng() * 0.1)), 7, 22), astW, rng);
  const toW = use.map((p, i) => Math.max(0.4, mins[i]! * (0.08 + (100 - p.skills.iq) / 400)));
  const tos = split(clamp(Math.round(11 + rng() * 6), 8, 20), toW, rng);
  return clampPlayerFta(
    use.map((p, i) => ({
    id: p.id,
    name: `${p.first} ${p.last}`,
    pos: p.pos,
    min: mins[i]!,
    pts: Math.max(0, pts[i]!),
    reb: rebs[i]!,
    ast: asts[i]!,
    fgm: fgm[i]!,
    fga: Math.max(fgm[i]!, fgas[i]!),
    tpm: tpms[i]!,
    tpa: Math.max(tpms[i]!, tpas[i]!),
    ftm: ftms[i]!,
    fta: Math.max(ftms[i]!, ftas[i]!),
    to: tos[i]!,
  })).sort((a, b) => b.pts - a.pts || b.min - a.min),
    minutes,
  );
}

function biggestRun(log: LiveEvent[]): { side: "home" | "away"; pts: number } | null {
  let best = 0;
  let bestSide: "home" | "away" | null = null;
  let cur = 0;
  let side: "home" | "away" | null = null;
  for (const e of log) {
    if (!e.pts || e.pts <= 0 || !e.poss) {
      continue;
    }
    if (e.poss === side) cur += e.pts;
    else {
      cur = e.pts;
      side = e.poss;
    }
    if (cur > best) {
      best = cur;
      bestSide = side;
    }
  }
  if (!bestSide || best < 6) return null;
  return { side: bestSide, pts: best };
}

function keyFromLog(log: LiveEvent[], winnerHome: boolean): string | null {
  const scoring = log.filter((e) => (e.pts ?? 0) > 0 && e.text);
  if (!scoring.length) return null;
  const late = [...scoring].reverse().find((e) => e.t.includes("H2") || e.t.includes("OT"));
  const hit = late ?? scoring[scoring.length - 1]!;
  const run = biggestRun(log);
  if (run && run.pts >= 8) {
    const who = run.side === "home" ? "the home side" : "the visitors";
    return `A ${run.pts}-0 run from ${who} flipped the floor. ${hit.text}`;
  }
  return hit.impact ? `${hit.t}: ${hit.impact}` : hit.text;
}

function told(site: string, winner: string, loser: string, how: string) {
  const host = site.replace(/^at /i, "").trim();
  if (/neutral/i.test(site)) return `${winner} ${how} ${loser} on a neutral floor.`;
  if (host && host.toLowerCase() === winner.toLowerCase()) return `${winner} ${how} ${loser} at home.`;
  if (host && host.toLowerCase() === loser.toLowerCase()) return `${winner} ${how} ${loser} on the road.`;
  return `${winner} ${how} ${loser}.`;
}

function marginTone(margin: number, winner: string, loser: string, site: string): { headline: string; lede: string } {
  if (margin <= 3) {
    return {
      headline: `${winner} edges ${loser}`,
      lede: told(site, winner, loser, "beat"),
    };
  }
  if (margin <= 8) {
    return {
      headline: `${winner} holds off ${loser}`,
      lede: told(site, winner, loser, "held off"),
    };
  }
  if (margin <= 15) {
    return {
      headline: `${winner} pulls away from ${loser}`,
      lede: told(site, winner, loser, "pulled away from"),
    };
  }
  return {
    headline: `${winner} rolls past ${loser}`,
    lede: told(site, winner, loser, "rolled past"),
  };
}

export function buildRecap(
  state: GameState,
  slot: Pick<GameSlot, "kind" | "site" | "week"> | undefined,
  result: GameResult,
  rng: Rng,
  log?: LiveEvent[],
  lines?: { home: RecapPlayer[]; away: RecapPlayer[] },
): GameRecap {
  const kind = slot?.kind ?? "noncon";
  const home = nameOf(result.homeId);
  const away = nameOf(result.awayId);
  const homeWin = result.homeScore > result.awayScore;
  const winnerId = homeWin ? result.homeId : result.awayId;
  const loserId = homeWin ? result.awayId : result.homeId;
  const winner = nameOf(winnerId);
  const loser = nameOf(loserId);
  const ws = homeWin ? result.homeScore : result.awayScore;
  const ls = homeWin ? result.awayScore : result.homeScore;
  const margin = ws - ls;
  const minutes = result.minutes ?? (log?.some((e) => e.t.startsWith("OT")) ? 45 : 40);
  const homeBox = result.homeBox;
  const awayBox = result.awayBox;
  const homePoss = homeBox?.poss ?? clamp(Math.round((result.homeScore + result.awayScore) / 2.12), 60, 80);
  const awayPoss = awayBox?.poss ?? homePoss;
  const homeLeaders = clampPlayerFta(
    usable(lines?.home, result.homeScore) ?? boxPlayers(state, result.homeId, result.homeScore, homeBox?.fga ?? 62, minutes, rng),
    minutes,
  );
  const awayLeaders = clampPlayerFta(
    usable(lines?.away, result.awayScore) ?? boxPlayers(state, result.awayId, result.awayScore, awayBox?.fga ?? 62, minutes, rng),
    minutes,
  );
  const lockSide = (rows: RecapPlayer[], score: number) => {
    const sum = rows.reduce((n, p) => n + p.pts, 0);
    if (sum !== score || boxFaults(rows).some((f) => !f.startsWith("ast ") && !f.includes("chart"))) topUp(rows, score);
  };
  lockSide(homeLeaders, result.homeScore);
  lockSide(awayLeaders, result.awayScore);
  const star = (homeWin ? homeLeaders : awayLeaders)[0];
  const floor = siteLine(slot ? { kind, site: slot.site } : { kind, site: "home" }, result.homeId);
  const tone = marginTone(margin, winner, loser, floor);
  const played = Boolean(log && log.length > 8);
  const keyPlay = (played ? keyFromLog(log!, homeWin) : null)
    ?? (star
      ? `${star.name} had ${star.pts} for the ${mascotOf(winnerId)} on ${star.fgm}-${star.fga} from the floor.`
      : `${winner} ${ws}, ${loser} ${ls}.`);
  const homePpp = Math.round((result.homeScore / homePoss) * 100) / 100;
  const awayPpp = Math.round((result.awayScore / awayPoss) * 100) / 100;
  const you = state.playerTeamId;
  const youWin = winnerId === you;
  const youIn = result.homeId === you || result.awayId === you;
  const grafs: string[] = [];
  grafs.push(`${KIND[kind]} · week ${result.week} · ${floor}.`);
  if (star) {
    grafs.push(
      `${star.name} led ${winner} with ${star.pts} points (${star.fgm}-${star.fga} FG${star.tpm != null ? `, ${star.tpm}-${star.tpa} 3PT` : ""}${star.ftm != null ? `, ${star.ftm}-${star.fta} FT` : ""}) in ${star.min} minutes.`,
    );
  }
  const pppLine = homeWin
    ? `${home} scored ${homePpp.toFixed(2)} points per possession. ${away} scored ${awayPpp.toFixed(2)}.`
    : `${away} scored ${awayPpp.toFixed(2)} points per possession. ${home} scored ${homePpp.toFixed(2)}.`;
  grafs.push(pppLine);
  if (youIn) {
    grafs.push(youWin ? "You got the win." : "You took the loss.");
  }
  const notes: string[] = [
    `${mascotOf(result.homeId)} ${homeBox?.fga ?? "—"} shots, ${homeBox?.to ?? "—"} turnovers, ${homeBox?.orb ?? "—"} offensive boards.`,
    `${mascotOf(result.awayId)} ${awayBox?.fga ?? "—"} shots, ${awayBox?.to ?? "—"} turnovers, ${awayBox?.orb ?? "—"} offensive boards.`,
  ];
  if (minutes > 40) notes.push(`Went to overtime (${minutes} minutes).`);
  if (margin <= 3) notes.push("Decided by one possession.");
  else if (margin >= 18) notes.push(`Won by ${margin}. It was over early.`);
  const run = played ? biggestRun(log!) : null;
  if (run) notes.push(`${run.pts}-0 run for the ${run.side === "home" ? mascotOf(result.homeId) : mascotOf(result.awayId)}.`);
  const shots = (log ?? []).filter((e) => (e.kind === "two" || e.kind === "three") && Number.isFinite(e.x) && Number.isFinite(e.y)).map((e) => ({
    x: e.x as number,
    y: e.y as number,
    made: Boolean(e.made),
    three: e.kind === "three",
    home: e.poss === "home",
  }));

  return {
    headline: `${tone.headline}, ${ws}–${ls}`,
    lede: tone.lede,
    grafs,
    notes,
    keyPlay,
    played,
    homeLeaders,
    awayLeaders,
    homePpp,
    awayPpp,
    homeTo: homeBox?.to ?? 0,
    awayTo: awayBox?.to ?? 0,
    homeOrb: homeBox?.orb ?? 0,
    awayOrb: awayBox?.orb ?? 0,
    shots: shots.length ? shots.slice(0, 80) : undefined,
  };
}

export function recapFor(state: GameState, result: GameResult): GameRecap {
  if (result.recap?.headline && result.recap.homeLeaders?.length) return result.recap;
  const slot = state.schedule.find((g) => g.id === result.slotId);
  const rng = mulberry32(state.seed ^ hashString(result.id) ^ 0x1ec);
  return buildRecap(state, slot, result, rng);
}

export function withRecap(state: GameState, result: GameResult, log?: LiveEvent[], lines?: { home: RecapPlayer[]; away: RecapPlayer[] }): GameResult {
  if (result.recap?.headline) return result;
  const youIn = result.homeId === state.playerTeamId || result.awayId === state.playerTeamId;
  if (!youIn) return result;
  const slot = state.schedule.find((g) => g.id === result.slotId);
  const rng = mulberry32(state.seed ^ hashString(result.id) ^ 0x1ec);
  return { ...result, recap: buildRecap(state, slot, result, rng, log, lines) };
}
