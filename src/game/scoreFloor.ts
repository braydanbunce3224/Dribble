import type { RecapPlayer } from "./types";

function sumPts(rows: RecapPlayer[] | undefined) {
  return (rows ?? []).reduce((n, p) => n + (p.pts || 0), 0);
}

function chartPts(p: RecapPlayer) {
  const tpm = p.tpm ?? 0;
  const ftm = p.ftm ?? 0;
  const twos = Math.max(0, (p.fgm || 0) - tpm);
  return twos * 2 + tpm * 3 + ftm;
}

function sync(p: RecapPlayer) {
  if ((p.tpm ?? 0) > (p.tpa ?? 0)) p.tpa = p.tpm ?? 0;
  if ((p.tpm ?? 0) > (p.fgm || 0)) p.fgm = p.tpm ?? 0;
  if ((p.tpa ?? 0) > (p.fga || 0)) p.fga = p.tpa ?? 0;
  if ((p.fgm || 0) > (p.fga || 0)) p.fga = p.fgm || 0;
  if ((p.ftm ?? 0) > (p.fta ?? 0)) p.fta = p.ftm ?? 0;
  if ((p.fta ?? 0) > 16) p.fta = 16;
  if ((p.ftm ?? 0) > (p.fta ?? 0)) p.ftm = p.fta ?? 0;
  p.pts = chartPts(p);
}

const THREE_RATE: Record<string, number> = { PG: 0.4, SG: 0.46, SF: 0.32, PF: 0.14, C: 0.05 };

/** Acceptance faults. A 30–45 point night is fine. One player taking the team offense is not. */
export function boxFaults(lines: RecapPlayer[]): string[] {
  const faults: string[] = [];
  if (!lines.length) return faults;
  if (lines.length < 2) {
    if ((lines[0]?.pts ?? 0) >= 50) faults.push(`${lines[0]!.name} ${lines[0]!.pts} pts`);
    return faults;
  }
  const teamPts = sumPts(lines);
  const teamFga = lines.reduce((n, p) => n + (p.fga || 0), 0);
  const teamFgm = lines.reduce((n, p) => n + (p.fgm || 0), 0);
  for (const p of lines) {
    if (chartPts(p) !== (p.pts || 0)) faults.push(`${p.name} pts ${p.pts} chart ${chartPts(p)}`);
    if ((p.fgm || 0) > (p.fga || 0)) faults.push(`${p.name} fgm>fga`);
    if ((p.tpm ?? 0) > (p.tpa ?? 0)) faults.push(`${p.name} 3s`);
    if ((p.ftm ?? 0) > (p.fta ?? 0)) faults.push(`${p.name} ft`);
    if (teamPts >= 20 && p.pts >= teamPts) faults.push(`${p.name} pts ${p.pts} >= team ${teamPts}`);
    if (teamFgm >= 1 && (p.fgm || 0) > teamFgm) faults.push(`${p.name} fgm ${p.fgm}>team ${teamFgm}`);
    if (teamFga >= 20 && p.fga >= 18 && p.fga >= teamFga * 0.48) faults.push(`${p.name} fga ${p.fga}/${teamFga}`);
    if ((p.fga || 0) >= 25 && p.fgm / p.fga > 0.85) faults.push(`${p.name} ${p.fgm}-${p.fga}`);
    if (p.pts >= 50) faults.push(`${p.name} ${p.pts} pts`);
    if (p.pts >= 40 && (p.reb || 0) === 0 && (p.ast || 0) === 0) faults.push(`${p.name} ${p.pts}/0/0`);
  }
  const ast = lines.reduce((n, p) => n + (p.ast || 0), 0);
  if (teamFgm >= 1 && ast > teamFgm) faults.push(`ast ${ast}>fgm ${teamFgm}`);
  return faults;
}

function needsPaint(lines: RecapPlayer[], target: number) {
  if (target >= 40 && sumPts(lines) < target * 0.45) return true;
  return boxFaults(lines).some((f) => !f.startsWith("ast ") && !f.includes("chart"));
}

function ensureMinutes(lines: RecapPlayer[]) {
  const mins = lines.reduce((n, p) => n + (p.min || 0), 0);
  if (mins >= 25) return;
  const shape = [34, 32, 30, 27, 24, 16, 13, 10, 7, 4, 2, 1, 1];
  lines.forEach((p, i) => {
    p.min = shape[i] ?? 1;
  });
}

function weights(lines: RecapPlayer[]) {
  return lines.map((p) => Math.max(0, p.min || 0));
}

function splitInt(wts: number[], total: number) {
  const sumW = wts.reduce((n, w) => n + w, 0) || 1;
  const raw = wts.map((w) => (total * w) / sumW);
  const base = raw.map((n) => Math.floor(n));
  let left = total - base.reduce((n, x) => n + x, 0);
  const order = raw
    .map((n, i) => ({ i, f: n - Math.floor(n) }))
    .sort((a, b) => b.f - a.f);
  for (const row of order) {
    if (left <= 0) break;
    base[row.i] = (base[row.i] ?? 0) + 1;
    left -= 1;
  }
  return base;
}

function clearShot(p: RecapPlayer) {
  p.pts = 0;
  p.fgm = 0;
  p.fga = 0;
  p.tpm = 0;
  p.tpa = 0;
  p.ftm = 0;
  p.fta = 0;
}

function givePoints(p: RecapPlayer, budget: number) {
  clearShot(p);
  budget = Math.min(budget, 45);
  if (budget <= 0) {
    if ((p.min || 0) >= 10) p.fga = 2;
    return;
  }
  const rate = THREE_RATE[p.pos] ?? 0.28;
  let ftm = Math.min(10, Math.max(0, Math.round(budget * (p.pos === "C" || p.pos === "PF" ? 0.22 : 0.14))));
  if (ftm > budget) ftm = budget;
  let left = budget - ftm;
  let tpm = 0;
  if (rate >= 0.18 && left >= 3) tpm = Math.min(7, Math.floor(Math.round(left * rate) / 3));
  let twoPts = left - tpm * 3;
  if (twoPts < 0) {
    tpm = Math.max(0, tpm - 1);
    twoPts = left - tpm * 3;
  }
  if (twoPts % 2 === 1) {
    if (ftm < 12) {
      ftm += 1;
      twoPts -= 1;
    } else if (tpm > 0) {
      tpm -= 1;
      twoPts += 3;
    }
  }
  if (twoPts < 0) twoPts = 0;
  const fgm2 = Math.floor(twoPts / 2);
  const fgm = fgm2 + tpm;
  let fga = Math.max(fgm, Math.round(fgm / 0.445));
  let tpa = tpm === 0 ? 0 : Math.max(tpm, Math.round(tpm / 0.34));
  if (tpa > fga) fga = tpa;
  const miss3 = Math.max(0, tpa - tpm);
  if (fga - fgm < miss3) fga += miss3 - (fga - fgm);
  while (fgm > 0 && fgm / fga > 0.52) fga += 1;
  const fta = ftm === 0 ? 0 : Math.min(16, Math.max(ftm, Math.round(ftm / 0.73)));
  p.fgm = fgm;
  p.fga = fga;
  p.tpm = tpm;
  p.tpa = tpa;
  p.ftm = Math.min(ftm, fta);
  p.fta = fta;
  sync(p);
}

function pointCap(target: number) {
  return Math.min(45, Math.max(16, Math.round(target * 0.34)));
}

function capBudgets(budgets: number[], target: number) {
  if (budgets.length < 2) return budgets;
  const max = pointCap(target);
  const next = budgets.slice();
  let extra = 0;
  for (let i = 0; i < next.length; i++) {
    const n = next[i] ?? 0;
    if (n > max) {
      extra += n - max;
      next[i] = max;
    }
  }
  let guard = 0;
  let i = 0;
  while (extra > 0 && guard++ < 800) {
    const idx = i % next.length;
    if ((next[idx] ?? 0) < max) {
      next[idx] = (next[idx] ?? 0) + 1;
      extra -= 1;
    }
    i++;
  }
  return next;
}
function nudgeTo(lines: RecapPlayer[], target: number) {
  let guard = 0;
  const cap = lines.length > 1 ? pointCap(target) : Math.min(49, target);
  const hard = 49;
  const order = [...lines].sort((a, b) => (b.min || 0) - (a.min || 0));
  const addBucket = (p: RecapPlayer) => {
    if (p.pts >= 49) return;
    if ((p.fta ?? 0) < 16) {
      p.ftm = (p.ftm ?? 0) + 1;
      p.fta = (p.fta ?? 0) + 1;
      sync(p);
      return;
    }
    if (p.pts <= 47) {
      p.fgm += 1;
      p.fga += 1;
      sync(p);
    }
  };
  while (sumPts(lines) < target && guard++ < 160) {
    const before = sumPts(lines);
    const p = order.find((row) => row.pts < cap && (row.fta ?? 0) < 16) ?? order.find((row) => row.pts < hard);
    if (!p) break;
    addBucket(p);
    if (sumPts(lines) === before) break;
  }
  while (sumPts(lines) > target && guard++ < 200) {
    const p = [...lines].sort((a, b) => b.pts - a.pts)[0];
    if (!p) break;
    if ((p.ftm ?? 0) > 0) p.ftm = (p.ftm ?? 0) - 1;
    else if ((p.tpm ?? 0) > 0) {
      p.tpm = (p.tpm ?? 0) - 1;
      p.fgm = Math.max(0, p.fgm - 1);
    } else if (p.fgm > 0) p.fgm -= 1;
    else break;
    sync(p);
  }
}

function sprinkle(lines: RecapPlayer[]) {
  const fgm = lines.reduce((n, p) => n + p.fgm, 0);
  let astLeft = Math.min(fgm, Math.round(fgm * 0.58));
  for (const p of lines) p.ast = 0;
  const passers = [...lines].sort((a, b) => (b.min || 0) - (a.min || 0));
  let i = 0;
  while (astLeft > 0 && passers.length && i < 100) {
    const p = passers[i % passers.length]!;
    const cap = Math.max(1, Math.round((p.min || 8) / 6));
    if ((p.ast || 0) < cap) {
      p.ast = (p.ast || 0) + 1;
      astLeft -= 1;
    }
    i++;
  }
  const misses = lines.reduce((n, p) => n + Math.max(0, p.fga - p.fgm), 0);
  const rebNow = lines.reduce((n, p) => n + (p.reb || 0), 0);
  if (rebNow === 0 || rebNow > misses + fgm + 8) {
    const total = Math.max(8, Math.round(misses * 0.7 + 6));
    const w = lines.map((p) => (p.pos === "C" ? 3.2 : p.pos === "PF" ? 2.2 : 1) * Math.max(1, p.min || 1));
    const parts = splitInt(w, total);
    lines.forEach((p, idx) => {
      p.reb = Math.min(18, parts[idx] ?? 0);
    });
  }
  const toNow = lines.reduce((n, p) => n + (p.to || 0), 0);
  if (toNow === 0) {
    const total = Math.max(6, Math.round(lines.reduce((n, p) => n + p.fga, 0) * 0.16));
    const parts = splitInt(lines.map((p) => Math.max(1, p.min || 1)), total);
    lines.forEach((p, idx) => {
      p.to = Math.min(8, parts[idx] ?? 0);
    });
  }
}

/** Rebuild a collapsed or one-player box into a normal college line that still totals `target`. */
export function paintTeam(lines: RecapPlayer[], target: number) {
  if (!lines.length || target < 0) return;
  ensureMinutes(lines);
  const w = weights(lines);
  const budgets = capBudgets(splitInt(w, target), target);
  lines.forEach((p, i) => givePoints(p, budgets[i] ?? 0));
  nudgeTo(lines, target);
  sprinkle(lines);
}

function addDistributed(lines: RecapPlayer[], target: number) {
  let guard = 0;
  while (sumPts(lines) < target && guard++ < 50) {
    const need = target - sumPts(lines);
    const fga = Math.max(1, lines.reduce((n, p) => n + p.fga, 0));
    const w = weights(lines);
    const wSum = w.reduce((n, x) => n + x, 0) || 1;
    const capPts = pointCap(target);
    let best = 0;
    let room = -Infinity;
    lines.forEach((p, i) => {
      if (p.pts >= capPts && lines.some((row) => row.pts < capPts)) return;
      const cap = Math.min(0.36, Math.max(0.12, ((w[i] ?? 0) / wSum) * 2.1));
      const slack = cap - p.fga / fga;
      if (slack > room) {
        room = slack;
        best = i;
      }
    });
    const p = lines[best]!;
    if (need === 1) {
      p.ftm = (p.ftm ?? 0) + 1;
      p.fta = Math.min(16, Math.max((p.fta ?? 0) + 1, p.ftm ?? 0));
    } else {
      p.fgm += 1;
      p.fga += 1;
      const fgm = lines.reduce((n, x) => n + x.fgm, 0);
      const att = lines.reduce((n, x) => n + x.fga, 0);
      if (att >= 10 && fgm / att > 0.5) {
        const q = lines[(best + 1) % lines.length]!;
        q.fga += 1;
      }
    }
    sync(p);
  }
}

function trimTo(lines: RecapPlayer[], target: number) {
  let guard = 0;
  while (sumPts(lines) > target && guard++ < 120) {
    const p = [...lines].sort((a, b) => b.pts - a.pts)[0];
    if (!p || p.pts <= 0) break;
    if ((p.ftm ?? 0) > 0) p.ftm = (p.ftm ?? 0) - 1;
    else if ((p.tpm ?? 0) > 0) {
      p.tpm = (p.tpm ?? 0) - 1;
      p.fgm = Math.max(0, p.fgm - 1);
    } else if (p.fgm > 0) p.fgm -= 1;
    else break;
    sync(p);
  }
}

function diluteShots(lines: RecapPlayer[]) {
  let guard = 0;
  while (guard++ < 40) {
    const teamFga = lines.reduce((n, p) => n + (p.fga || 0), 0);
    const hog = [...lines].sort((a, b) => b.fga - a.fga)[0];
    if (!hog || teamFga < 20 || hog.fga < 18 || hog.fga < teamFga * 0.42) break;
    const cold = [...lines].filter((p) => p !== hog).sort((a, b) => a.fga - b.fga)[0];
    if (!cold) break;
    cold.fga += 1;
  }
}

function touchBoards(lines: RecapPlayer[]) {
  const fgm = lines.reduce((n, p) => n + p.fgm, 0);
  let ast = lines.reduce((n, p) => n + (p.ast || 0), 0);
  for (const p of lines) {
    if ((p.pts || 0) < 8) continue;
    if ((p.reb || 0) > 0 || (p.ast || 0) > 0) continue;
    if ((p.pos === "PG" || p.pos === "SG") && ast < fgm) {
      p.ast = 1;
      ast += 1;
    } else p.reb = 1;
  }
}

function moveBucket(from: RecapPlayer, to: RecapPlayer) {
  if ((from.ftm ?? 0) > 0 && from.pts - ((from.tpm ?? 0) > 0 ? 0 : 2) >= 0 && from.pts % 2 === 1) {
    from.ftm = (from.ftm ?? 0) - 1;
    sync(from);
    to.ftm = (to.ftm ?? 0) + 1;
    to.fta = Math.max(to.fta ?? 0, to.ftm ?? 0);
    sync(to);
    return;
  }
  if ((from.tpm ?? 0) > 0 && from.pts >= 3) {
    from.tpm = (from.tpm ?? 0) - 1;
    from.fgm = Math.max(0, from.fgm - 1);
    sync(from);
    to.tpm = (to.tpm ?? 0) + 1;
    to.tpa = Math.max(to.tpa ?? 0, to.tpm ?? 0);
    to.fgm += 1;
    to.fga = Math.max(to.fga, to.fgm, to.tpa ?? 0);
    sync(to);
    return;
  }
  if (from.fgm > 0 && from.pts >= 2) {
    from.fgm -= 1;
    if ((from.tpm ?? 0) > from.fgm) from.tpm = from.fgm;
    sync(from);
    to.fgm += 1;
    to.fga = Math.max(to.fga, to.fgm);
    sync(to);
  }
}

/** A 30–45 night stays. Anything at 50 or a 40-point 0/0 is moved onto a teammate. */
function shedOver(lines: RecapPlayer[], target: number) {
  let guard = 0;
  while (guard++ < 48) {
    const hot = [...lines].sort((a, b) => b.pts - a.pts)[0];
    if (!hot || hot.pts < 50) break;
    const cold = [...lines].filter((p) => p !== hot && p.pts < 45).sort((a, b) => a.pts - b.pts || (b.min || 0) - (a.min || 0))[0];
    if (!cold) break;
    const before = hot.pts;
    moveBucket(hot, cold);
    if (hot.pts >= before) break;
  }
  for (const p of lines) {
    if ((p.pts || 0) < 40) continue;
    if ((p.reb || 0) > 0 || (p.ast || 0) > 0) continue;
    if (p.pos === "PG" || p.pos === "SG") p.ast = 1;
    else p.reb = 1;
  }
  if (lines.length > 1 && sumPts(lines) !== target) nudgeTo(lines, target);
  guard = 0;
  while (guard++ < 24) {
    const hot = [...lines].sort((a, b) => b.pts - a.pts)[0];
    if (!hot || hot.pts < 50) break;
    const cold = [...lines].filter((p) => p !== hot && p.pts < 45).sort((a, b) => a.pts - b.pts)[0];
    if (!cold) break;
    const before = hot.pts;
    moveBucket(hot, cold);
    if (hot.pts >= before) break;
  }
}

/** Move a box to an exact total. A monster line is rebuilt. A normal box only gains or loses the gap. */
export function topUp(lines: RecapPlayer[], target: number) {
  if (!lines.length) return;
  for (const p of lines) sync(p);
  const have = sumPts(lines);
  if (have === target && boxFaults(lines).length === 0) {
    touchBoards(lines);
    return;
  }
  if (needsPaint(lines, target)) paintTeam(lines, target);
  else if (have > target) trimTo(lines, target);
  else if (have < target) addDistributed(lines, target);
  if (boxFaults(lines).some((f) => !f.startsWith("ast ") && !f.includes("chart") && !f.includes(" fga "))) paintTeam(lines, target);
  diluteShots(lines);
  const ast = lines.reduce((n, p) => n + (p.ast || 0), 0);
  const fgm = lines.reduce((n, p) => n + p.fgm, 0);
  if (ast > fgm) {
    const order = [...lines].sort((a, b) => (b.ast || 0) - (a.ast || 0));
    let extra = ast - fgm;
    for (const p of order) {
      if (extra <= 0) break;
      const cut = Math.min(extra, p.ast || 0);
      p.ast = (p.ast || 0) - cut;
      extra -= cut;
    }
  }
  touchBoards(lines);
  shedOver(lines, target);
}

/**
 * Completed games only. A normal 60–80 final is left alone.
 * Single-digit boards (a forced finish that started at 0–0) get lifted.
 * A box that collapsed under a real scoreboard is put back — across the rotation, not one shooter.
 */
export function reconcileFinal(
  homeLines: RecapPlayer[],
  awayLines: RecapPlayer[],
  boardH: number,
  boardA: number,
): { homeScore: number; awayScore: number } {
  if (homeLines.length && sumPts(homeLines) !== boardH) topUp(homeLines, boardH);
  if (awayLines.length && sumPts(awayLines) !== boardA) topUp(awayLines, boardA);
  let hs = homeLines.length ? sumPts(homeLines) : boardH;
  let as = awayLines.length ? sumPts(awayLines) : boardA;
  if (hs < 40 || as < 40) {
    const add = 62 - Math.min(hs, as);
    if (add > 0) {
      if (homeLines.length) topUp(homeLines, hs + add);
      else hs += add;
      if (awayLines.length) topUp(awayLines, as + add);
      else as += add;
    }
  }
  hs = homeLines.length ? sumPts(homeLines) : hs;
  as = awayLines.length ? sumPts(awayLines) : as;
  if (hs === as) {
    if (homeLines.length) topUp(homeLines, hs + 1);
    else hs += 1;
  }
  hs = homeLines.length ? sumPts(homeLines) : hs;
  as = awayLines.length ? sumPts(awayLines) : as;
  if (homeLines.length) topUp(homeLines, hs);
  if (awayLines.length) topUp(awayLines, as);
  hs = homeLines.length ? sumPts(homeLines) : hs;
  as = awayLines.length ? sumPts(awayLines) : as;
  return { homeScore: hs, awayScore: as };
}

export function paintBoard(lines: RecapPlayer[] | undefined, target: number): RecapPlayer[] | undefined {
  if (!lines?.length) return lines;
  const rows = lines.map((p) => ({ ...p }));
  topUp(rows, target);
  return rows;
}

export function logBoxFaults(tag: string, lines: RecapPlayer[] | undefined) {
  if (!lines?.length) return;
  const faults = boxFaults(lines);
  if (faults.length) console.warn(`[box] ${tag}: ${faults.join(" | ")}`);
}
