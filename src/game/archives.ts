import type { ArchiveBox, GameState, ProgramLegend, RecapPlayer, SeasonLog } from "./types";
import { teamOf } from "./teams";
import { NIT, CBI } from "./brand";
import { boxFaults, topUp } from "./scoreFloor";

/** National award, 1,800 career points, or an 86-overall senior who actually scored. Not every senior. */
function legendWorthy(state: GameState, p: { teamId: string; year: number; redshirt?: boolean; ovr: number; id: string; stats?: { pts?: number; g?: number }; career?: { pts?: number }; seasonGames?: number }) {
  if (p.teamId !== state.playerTeamId || p.year < 4 || p.redshirt) return false;
  const national = (state.awards ?? []).some(
    (a) => a.playerId === p.id && (a.kind === "poy" || a.kind === "dpoy" || a.kind === "all-american" || a.kind === "freshman"),
  );
  if (national) return true;
  const seasonPts = p.stats?.pts ?? 0;
  const careerPts = (p.career?.pts ?? 0) + seasonPts;
  if (careerPts >= 1800) return true;
  const g = Math.max(1, p.stats?.g || p.seasonGames || 1);
  if (p.ovr >= 86 && (seasonPts / g >= 12 || seasonPts >= 360)) return true;
  return false;
}

function legendReason(state: GameState, p: { id: string; ovr: number; stats?: { pts?: number; g?: number }; career?: { pts?: number }; seasonGames?: number }) {
  const national = (state.awards ?? []).some(
    (a) => a.playerId === p.id && (a.kind === "poy" || a.kind === "dpoy" || a.kind === "all-american" || a.kind === "freshman"),
  );
  if (national) return "National award";
  const careerPts = (p.career?.pts ?? 0) + (p.stats?.pts ?? 0);
  if (careerPts >= 1800) return "1,800 career points";
  return "Program legend";
}

function jersey(name: string, used: Set<string>) {
  let n = 0;
  for (const c of name) n = (n * 33 + c.charCodeAt(0)) % 54;
  let num = String((n % 54) + 1);
  let guard = 0;
  while (used.has(num) && guard++ < 60) {
    n = (n + 7) % 54;
    num = String(n + 1);
  }
  used.add(num);
  return num;
}

function standingsOf(state: GameState) {
  const byConf = new Map<string, { id: string; w: number; l: number }[]>();
  for (const t of Object.values(state.teams)) {
    const rows = byConf.get(t.conference) ?? [];
    rows.push({ id: t.id, w: t.wins, l: t.losses });
    byConf.set(t.conference, rows);
  }
  return [...byConf.entries()].map(([conf, rows]) => ({
    conf,
    rows: rows.sort((a, b) => b.w - b.l - (a.w - a.l) || b.w - a.w),
  }));
}

function yourBoxes(state: GameState) {
  const you = state.playerTeamId;
  return state.results
    .filter((r) => r.homeId === you || r.awayId === you)
    .map((r) => boxFromResult(r));
}

/** Top scorers only. A 0-point companion and a 50-point line never get written. */
export function leaderLine(rows: RecapPlayer[] | undefined): string | undefined {
  const text = [...(rows ?? [])]
    .filter((p) => (p.pts || 0) > 0 && (p.pts || 0) < 50)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 3)
    .map((p) => `${p.name} ${p.pts}`)
    .join(", ");
  return text || undefined;
}

function believablePts(name: string, teamScore: number, week: number) {
  let h = (week + 3) * 17;
  for (const c of name) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const hi = Math.min(42, Math.max(22, Math.round((teamScore || 70) * 0.4)));
  const lo = Math.min(hi, Math.max(16, Math.round((teamScore || 70) * 0.26)));
  return lo + (h % (hi - lo + 1));
}

/** Rewrite a saved archive string that still says 71 or 73, or lists a 0. */
export function repairArchiveLine(line: string | undefined, homeScore: number, awayScore: number, week = 0): string | undefined {
  if (!line) return undefined;
  const trimmed = line.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) return undefined;
  const teamHi = Math.max(homeScore, awayScore, 0);
  const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  const kept: { name: string; pts: number }[] = [];
  let changed = false;
  for (const part of parts) {
    const m = /^(.*?)[\s]+(\d+)$/.exec(part);
    if (!m) continue;
    const name = m[1]!.trim();
    const pts = Number(m[2]);
    if (!name || pts <= 0) {
      changed = true;
      continue;
    }
    if (pts >= 50) {
      kept.push({ name, pts: believablePts(name, teamHi, week) });
      changed = true;
      continue;
    }
    kept.push({ name, pts });
  }
  if (!kept.length) return undefined;
  if (!changed) return line;
  return kept.map((p) => `${p.name} ${p.pts}`).join(", ");
}

function sideFaulty(rows: RecapPlayer[] | undefined, score: number) {
  if (!rows?.length) return false;
  const sum = rows.reduce((n, p) => n + (p.pts || 0), 0);
  if (sum !== score) return true;
  return boxFaults(rows).some((f) => !f.startsWith("ast ") && !f.includes("chart"));
}

function boxFromResult(r: { id: string; week: number; homeId: string; awayId: string; homeScore: number; awayScore: number; recap?: { homeLeaders?: RecapPlayer[]; awayLeaders?: RecapPlayer[] } }): ArchiveBox {
  const line = leaderLine([...(r.recap?.homeLeaders ?? []), ...(r.recap?.awayLeaders ?? [])]);
  return {
    id: r.id,
    week: r.week,
    homeId: r.homeId,
    awayId: r.awayId,
    home: teamOf(r.homeId).name,
    away: teamOf(r.awayId).name,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    line,
  };
}

/**
 * Already-written 71/73 lines and 0-point companions are repaired on open.
 * A result that is still on the save is rebuilt from the corrected box. A closed year only has the archive string.
 */
export function repairStoredMonsters(state: GameState): GameState {
  let changed = false;
  const results = (state.results ?? []).map((r) => {
    const homeBad = sideFaulty(r.recap?.homeLeaders, r.homeScore);
    const awayBad = sideFaulty(r.recap?.awayLeaders, r.awayScore);
    if (!homeBad && !awayBad) return r;
    const home = (r.recap?.homeLeaders ?? []).map((p) => ({ ...p }));
    const away = (r.recap?.awayLeaders ?? []).map((p) => ({ ...p }));
    if (homeBad) topUp(home, r.homeScore);
    if (awayBad) topUp(away, r.awayScore);
    changed = true;
    return { ...r, recap: { ...r.recap!, homeLeaders: home, awayLeaders: away } };
  });
  const byId = new Map(results.map((r) => [r.id, r]));
  const log = (state.history?.log ?? []).map((row) => {
    if (!row.boxes?.length) return row;
    let rowChanged = false;
    const boxes = row.boxes.map((b) => {
      const res = byId.get(b.id);
      const fromRecap = res?.recap ? leaderLine([...(res.recap.homeLeaders ?? []), ...(res.recap.awayLeaders ?? [])]) : undefined;
      const line = fromRecap ?? repairArchiveLine(b.line, b.homeScore, b.awayScore, b.week);
      if (line === b.line) return b;
      rowChanged = true;
      return { ...b, line };
    });
    if (!rowChanged) return row;
    changed = true;
    return { ...row, boxes };
  });
  let recordBook = state.recordBook;
  if (recordBook?.playerGame && recordBook.playerGame.pts >= 50) {
    recordBook = { ...recordBook, playerGame: undefined };
    changed = true;
  }
  if (!changed) return state;
  return { ...state, results, history: { ...state.history, log }, recordBook };
}

export function seasonSummary(state: GameState) {
  const you = state.teams[state.playerTeamId];
  if (!you) return "";
  const bid = state.selection?.ncaa?.find((b) => b.teamId === you.id);
  const where = bid
    ? `${bid.seed} seed, ${bid.region}${bid.path === "auto" ? ", auto bid" : ", at-large"}`
    : state.selection?.nit?.includes(you.id)
      ? NIT
      : state.selection?.crown?.includes(you.id)
        ? CBI
        : "Selection Sunday";
  return `${you.wins}-${you.losses} (${you.confW}-${you.confL} conference). ${where}.`;
}

/** Write the year the moment the committee posts the field. Empty Archives is only for a season that has not reached this. */
export function ensureSelectionArchive(state: GameState): GameState {
  const base = repairStoredMonsters(state);
  const you = base.teams[base.playerTeamId];
  if (!you) return base;
  const log = base.history?.log ?? [];
  const prev = log.find((row) => row.season === base.season);
  if (prev?.counted) return base;
  const boxes = yourBoxes(base);
  const bid = Boolean(base.selection?.ncaa?.some((b) => b.teamId === you.id));
  const row: SeasonLog = {
    season: base.season,
    teamId: you.id,
    wins: you.wins,
    losses: you.losses,
    confW: you.confW,
    confL: you.confL,
    coachName: you.coachName,
    confTitle: base.selection?.confTourney === you.id,
    ncaaBid: bid,
    title: false,
    run: bid ? "bid" : base.selection?.nit?.includes(you.id) ? "nit" : base.selection?.crown?.includes(you.id) ? "crown" : undefined,
    summary: seasonSummary(base),
    standings: standingsOf(base),
    boxes,
  };
  const nextLog = log.filter((r) => r.season !== base.season);
  nextLog.push({ ...prev, ...row, awards: prev?.awards, championId: prev?.championId, legends: prev?.legends });
  nextLog.sort((a, b) => a.season - b.season);
  return { ...base, history: { ...base.history, log: nextLog } };
}
export function stampSeasonArchive(state: GameState): GameState {
  const base = repairStoredMonsters(state);
  const log = base.history?.log ?? [];
  if (!log.length) return base;
  const last = log[log.length - 1]!;
  const realChamp = base.selection?.champ || "";
  const invented = Boolean(last.championId) && !realChamp;
  if (last.boxes && last.boxes.length > 0 && last.summary && !invented && (!realChamp || last.championId === realChamp)) return base;
  const you = base.playerTeamId;
  const yours = base.results.filter((r) => r.homeId === you || r.awayId === you);
  const boxes = yours.map((r) => boxFromResult(r));
  const championId = realChamp || undefined;
  const awards = (state.awards ?? [])
    .filter((a) => a.season === state.season)
    .slice(0, 28)
    .map((a) => ({ name: a.name, kind: a.kind, teamId: a.teamId }));
  const byConf = new Map<string, { id: string; w: number; l: number }[]>();
  for (const t of Object.values(state.teams)) {
    const rows = byConf.get(t.conference) ?? [];
    rows.push({ id: t.id, w: t.wins, l: t.losses });
    byConf.set(t.conference, rows);
  }
  const standings = [...byConf.entries()].map(([conf, rows]) => ({
    conf,
    rows: rows.sort((a, b) => b.w - b.l - (a.w - a.l) || b.w - a.w),
  }));
  const leaders = state.players
    .filter((p) => (p.stats?.pts ?? 0) > 0)
    .sort((a, b) => (b.stats?.pts ?? 0) - (a.stats?.pts ?? 0))
    .slice(0, 8)
    .map((p) => ({ name: `${p.first} ${p.last}`, teamId: p.teamId, pts: p.stats?.pts ?? 0 }));
  const used = new Set((state.legends ?? []).filter((g) => g.teamId === you).map((g) => g.number));
  const retiring = state.players
    .filter((p) => legendWorthy(state, p))
    .sort((a, b) => (b.stats?.pts ?? 0) - (a.stats?.pts ?? 0) || b.ovr - a.ovr)
    .slice(0, 2);
  const fresh: ProgramLegend[] = retiring.map((p) => ({
    name: `${p.first} ${p.last}`,
    number: jersey(`${p.first} ${p.last}`, used),
    teamId: you,
    season: state.season,
    note: `${legendReason(state, p)} · ${p.pos} · ${p.ovr} ovr`,
  }));
  const legends = [...(state.legends ?? []).filter((g) => !fresh.some((f) => f.name === g.name && f.season === g.season)), ...fresh].slice(-80);
  const row: SeasonLog = {
    ...last,
    championId,
    awards: awards.length ? awards : last.awards,
    standings,
    boxes: boxes.length ? boxes : last.boxes,
    leaders,
    legends: fresh,
    summary: seasonSummary(base) || last.summary,
  };
  const nextLog = log.slice();
  nextLog[nextLog.length - 1] = row;
  return {
    ...base,
    legends,
    history: { ...base.history, log: nextLog },
  };
}
