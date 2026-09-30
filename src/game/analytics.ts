import type { GameBox, GameState, RecapPlayer } from "./types";
import { TEAM_BY_ID } from "./teams";
import { kenpom, type KenpomRow } from "./ranks";
import { recapFor } from "./recap";
import { gamePossessions } from "./engine-util";
import { clamp } from "./rng";

export interface FactorSet {
  ts: number;
  tov: number;
  orb: number;
  ftr: number;
  ppp: number;
  poss: number;
  pts: number;
  games: number;
}

export interface TeamTape {
  id: string;
  games: number;
  off: FactorSet;
  def: FactorSet;
  homePpp: number;
  awayPpp: number;
  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;
  pythag: number;
  kp: KenpomRow | null;
  offRank: { ts: number; tov: number; orb: number; ftr: number; ppp: number };
  defRank: { ts: number; tov: number; orb: number; ftr: number; ppp: number };
}

export interface PlayerTape {
  id: string;
  name: string;
  pos: RecapPlayer["pos"];
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  fgm: number;
  fga: number;
  ts: number;
  usg: number;
  p40: number;
}

export interface LogRow {
  resultId: string;
  week: number;
  oppId: string;
  home: boolean;
  won: boolean;
  pf: number;
  pa: number;
  ppp: number;
  oppPpp: number;
  ts: number;
}

export interface MatchupCard {
  oppId: string;
  week: number;
  site: string;
  youAdjO: number;
  youAdjD: number;
  oppAdjO: number;
  oppAdjD: number;
  tempo: number;
  expYou: number;
  expOpp: number;
  note: string;
}

interface Bucket {
  fga: number;
  fta: number;
  to: number;
  orb: number;
  poss: number;
  pts: number;
  games: number;
}

const EMPTY: Bucket = { fga: 0, fta: 0, to: 0, orb: 0, poss: 0, pts: 0, games: 0 };

function addBox(b: Bucket, box: GameBox | undefined, pts: number): Bucket {
  const poss = box?.poss ?? clamp(gamePossessions(box, undefined, pts, pts), 56, 86);
  return {
    fga: b.fga + (box?.fga ?? Math.round(poss * 0.84)),
    fta: b.fta + (box?.fta ?? Math.round(poss * 0.27)),
    to: b.to + (box?.to ?? Math.round(poss * 0.17)),
    orb: b.orb + (box?.orb ?? Math.round(poss * 0.1)),
    poss: b.poss + poss,
    pts: b.pts + pts,
    games: b.games + 1,
  };
}

function factors(b: Bucket): FactorSet {
  const poss = Math.max(1, b.poss);
  const fga = Math.max(1, b.fga);
  const ts = b.pts / (2 * (b.fga + 0.44 * b.fta) || 1);
  return {
    ts,
    tov: b.to / poss,
    orb: (100 * b.orb) / poss,
    ftr: b.fta / fga,
    ppp: b.pts / poss,
    poss: b.games ? b.poss / b.games : 0,
    pts: b.games ? b.pts / b.games : 0,
    games: b.games,
  };
}

function rankDesc(ids: string[], val: (id: string) => number, higher: boolean) {
  const sorted = [...ids].sort((a, b) => (higher ? val(b) - val(a) : val(a) - val(b)));
  const m = new Map<string, number>();
  sorted.forEach((id, i) => m.set(id, i + 1));
  return m;
}

let memoKey = "";
let memoOff = new Map<string, FactorSet>();
let memoDef = new Map<string, FactorSet>();
let memoSplit = new Map<string, { homePpp: number; awayPpp: number; hw: number; hl: number; aw: number; al: number }>();

function stamp(state: GameState) {
  return `${state.seed}:${state.season}:${state.week}:${state.results.length}`;
}

function rollup(state: GameState) {
  const k = stamp(state);
  if (memoKey === k && memoOff.size) return;
  const ids = Object.keys(state.teams);
  const offB = new Map<string, Bucket>();
  const defB = new Map<string, Bucket>();
  const split = new Map<string, { hp: number; hn: number; ap: number; an: number; hw: number; hl: number; aw: number; al: number }>();
  for (const id of ids) {
    offB.set(id, { ...EMPTY });
    defB.set(id, { ...EMPTY });
    split.set(id, { hp: 0, hn: 0, ap: 0, an: 0, hw: 0, hl: 0, aw: 0, al: 0 });
  }
  for (const r of state.results) {
    const homeB = r.homeBox;
    const awayB = r.awayBox;
    offB.set(r.homeId, addBox(offB.get(r.homeId) ?? { ...EMPTY }, homeB, r.homeScore));
    defB.set(r.homeId, addBox(defB.get(r.homeId) ?? { ...EMPTY }, awayB, r.awayScore));
    offB.set(r.awayId, addBox(offB.get(r.awayId) ?? { ...EMPTY }, awayB, r.awayScore));
    defB.set(r.awayId, addBox(defB.get(r.awayId) ?? { ...EMPTY }, homeB, r.homeScore));
    const possH = Math.max(1, homeB?.poss ?? gamePossessions(homeB, awayB, r.homeScore, r.awayScore));
    const possA = Math.max(1, awayB?.poss ?? possH);
    const hs = split.get(r.homeId)!;
    const as = split.get(r.awayId)!;
    const homeWin = r.homeScore > r.awayScore;
    hs.hp += r.homeScore / possH;
    hs.hn++;
    if (homeWin) hs.hw++;
    else hs.hl++;
    as.ap += r.awayScore / possA;
    as.an++;
    if (homeWin) as.al++;
    else as.aw++;
  }
  memoOff = new Map(ids.map((id) => [id, factors(offB.get(id) ?? { ...EMPTY })]));
  memoDef = new Map(ids.map((id) => [id, factors(defB.get(id) ?? { ...EMPTY })]));
  memoSplit = new Map(
    ids.map((id) => {
      const s = split.get(id)!;
      return [id, {
        homePpp: s.hn ? s.hp / s.hn : 0,
        awayPpp: s.an ? s.ap / s.an : 0,
        hw: s.hw,
        hl: s.hl,
        aw: s.aw,
        al: s.al,
      }];
    }),
  );
  memoKey = k;
}

export function teamTape(state: GameState, teamId: string): TeamTape {
  rollup(state);
  const ids = Object.keys(state.teams).filter((id) => !state.teams[id]?.guest);
  const off = memoOff.get(teamId) ?? factors({ ...EMPTY });
  const def = memoDef.get(teamId) ?? factors({ ...EMPTY });
  const sp = memoSplit.get(teamId) ?? { homePpp: 0, awayPpp: 0, hw: 0, hl: 0, aw: 0, al: 0 };
  const rTs = rankDesc(ids, (id) => memoOff.get(id)?.ts ?? 0, true);
  const rTov = rankDesc(ids, (id) => memoOff.get(id)?.tov ?? 1, false);
  const rOrb = rankDesc(ids, (id) => memoOff.get(id)?.orb ?? 0, true);
  const rFtr = rankDesc(ids, (id) => memoOff.get(id)?.ftr ?? 0, true);
  const rPpp = rankDesc(ids, (id) => memoOff.get(id)?.ppp ?? 0, true);
  const dTs = rankDesc(ids, (id) => memoDef.get(id)?.ts ?? 1, false);
  const dTov = rankDesc(ids, (id) => memoDef.get(id)?.tov ?? 0, true);
  const dOrb = rankDesc(ids, (id) => memoDef.get(id)?.orb ?? 1, false);
  const dFtr = rankDesc(ids, (id) => memoDef.get(id)?.ftr ?? 1, false);
  const dPpp = rankDesc(ids, (id) => memoDef.get(id)?.ppp ?? 1, false);
  const kp = kenpom(state).find((r) => r.id === teamId) ?? null;
  const t = state.teams[teamId];
  const gp = (t?.wins ?? 0) + (t?.losses ?? 0);
  const pythag = gp ? (t!.wins - (kp?.luck ?? 0) * gp) : 0;
  return {
    id: teamId,
    games: off.games,
    off,
    def,
    homePpp: sp.homePpp,
    awayPpp: sp.awayPpp,
    homeW: sp.hw,
    homeL: sp.hl,
    awayW: sp.aw,
    awayL: sp.al,
    pythag,
    kp,
    offRank: { ts: rTs.get(teamId) ?? 365, tov: rTov.get(teamId) ?? 365, orb: rOrb.get(teamId) ?? 365, ftr: rFtr.get(teamId) ?? 365, ppp: rPpp.get(teamId) ?? 365 },
    defRank: { ts: dTs.get(teamId) ?? 365, tov: dTov.get(teamId) ?? 365, orb: dOrb.get(teamId) ?? 365, ftr: dFtr.get(teamId) ?? 365, ppp: dPpp.get(teamId) ?? 365 },
  };
}

export function playerTape(state: GameState, teamId: string): PlayerTape[] {
  const acc = new Map<string, PlayerTape & { tmFga: number; tmMin: number }>();
  for (const r of state.results) {
    if (r.homeId !== teamId && r.awayId !== teamId) continue;
    const recap = recapFor(state, r);
    const mine = r.homeId === teamId ? recap.homeLeaders : recap.awayLeaders;
    if (!mine.length) continue;
    const tmFga = mine.reduce((n, p) => n + p.fga, 0);
    const tmMin = mine.reduce((n, p) => n + p.min, 0);
    for (const p of mine) {
      const cur = acc.get(p.id) ?? {
        id: p.id,
        name: p.name,
        pos: p.pos,
        gp: 0,
        min: 0,
        pts: 0,
        reb: 0,
        ast: 0,
        fgm: 0,
        fga: 0,
        ts: 0,
        usg: 0,
        p40: 0,
        tmFga: 0,
        tmMin: 0,
      };
      cur.gp += 1;
      cur.min += p.min;
      cur.pts += p.pts;
      cur.reb += p.reb;
      cur.ast += p.ast;
      cur.fgm += p.fgm;
      cur.fga += p.fga;
      cur.tmFga += tmFga;
      cur.tmMin += tmMin;
      acc.set(p.id, cur);
    }
  }
  return [...acc.values()]
    .map((p) => {
      const ts = p.fga ? p.pts / (2 * p.fga) : 0;
      const usg = p.min > 0 && p.tmFga > 0 ? (100 * p.fga * (p.tmMin / 5)) / (p.min * p.tmFga) : 0;
      const p40 = p.min > 0 ? (p.pts / p.min) * 40 : 0;
      return { id: p.id, name: p.name, pos: p.pos, gp: p.gp, min: p.min, pts: p.pts, reb: p.reb, ast: p.ast, fgm: p.fgm, fga: p.fga, ts, usg, p40 };
    })
    .sort((a, b) => b.pts - a.pts || b.min - a.min);
}

export function gameLog(state: GameState, teamId: string): LogRow[] {
  const out: LogRow[] = [];
  for (const r of state.results) {
    if (r.homeId !== teamId && r.awayId !== teamId) continue;
    const home = r.homeId === teamId;
    const box = home ? r.homeBox : r.awayBox;
    const oppBox = home ? r.awayBox : r.homeBox;
    const pf = home ? r.homeScore : r.awayScore;
    const pa = home ? r.awayScore : r.homeScore;
    const poss = Math.max(1, box?.poss ?? gamePossessions(box, oppBox, pf, pa));
    const oppPoss = Math.max(1, oppBox?.poss ?? poss);
    const fga = Math.max(1, box?.fga ?? 60);
    const fta = box?.fta ?? 16;
    out.push({
      resultId: r.id,
      week: r.week,
      oppId: home ? r.awayId : r.homeId,
      home,
      won: pf > pa,
      pf,
      pa,
      ppp: pf / poss,
      oppPpp: pa / oppPoss,
      ts: pf / (2 * (fga + 0.44 * fta)),
    });
  }
  return out.sort((a, b) => b.week - a.week || b.resultId.localeCompare(a.resultId));
}

export function matchup(state: GameState, youId: string, oppId: string, week: number, site: string): MatchupCard {
  const kp = kenpom(state);
  const you = kp.find((r) => r.id === youId);
  const opp = kp.find((r) => r.id === oppId);
  const youAdjO = you?.adjO ?? 100;
  const youAdjD = you?.adjD ?? 100;
  const oppAdjO = opp?.adjO ?? 100;
  const oppAdjD = opp?.adjD ?? 100;
  const tempo = ((you?.adjT ?? 68) + (opp?.adjT ?? 68)) / 2;
  const expYou = Math.round(tempo * (youAdjO / 100) * (oppAdjD / 100));
  const expOpp = Math.round(tempo * (oppAdjO / 100) * (youAdjD / 100));
  const floor = site === "home" ? "at home" : site === "away" ? "on the road" : "on a neutral floor";
  const edge = expYou - expOpp;
  const note = edge >= 8
    ? `Favored by ${edge} ${floor}. Win the rebounding.`
    : edge <= -8
      ? `Underdog by ${-edge} ${floor}. You'll need extra possessions.`
      : `Toss-up ${floor}. The team that executes wins it.`;
  return { oppId, week, site, youAdjO, youAdjD, oppAdjO, oppAdjD, tempo, expYou, expOpp, note };
}

export function tapeLine(tape: TeamTape) {
  if (!tape.games) return "No games yet.";
  if (!tape.kp) return `${tape.games} games · ${tape.off.ppp.toFixed(2)} PPP`;
  const em = `${tape.kp.adjEM >= 0 ? "+" : ""}${tape.kp.adjEM.toFixed(1)}`;
  return `${em} AdjEM · ${tape.kp.rank} national · ${tape.off.ppp.toFixed(2)} PPP`;
}

export function teamName(id: string) {
  return TEAM_BY_ID[id]?.name ?? id;
}
