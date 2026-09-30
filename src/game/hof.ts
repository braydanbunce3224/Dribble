import type { GameState } from "./types";
import { TEAM_BY_ID } from "./teams";
import { identityName } from "./engine-util";

const KEY = "dribble-2026.hof.v1";
const MAX = 12;

export interface HofEntry {
  id: string;
  coach: string;
  teamId: string;
  teamName: string;
  seasons: number;
  wins: number;
  losses: number;
  titles: number;
  ncaaBids: number;
  confTitles: number;
  careerMode: boolean;
  eraDecade: number | null;
  lastSeason: number;
  highlight: string;
  updatedAt: number;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hofScore(e: HofEntry) {
  return e.titles * 1000 + e.ncaaBids * 70 + e.confTitles * 40 + e.wins * 2 - e.losses + e.seasons * 8;
}

export function playthroughId(state: GameState) {
  return `${state.seed}:${state.identity.first}:${state.identity.last}:${state.careerMode ? "c" : state.playerTeamId}:${state.eraDecade ?? "now"}`;
}

function highlightOf(state: GameState) {
  const hist = state.history;
  const log = hist.log ?? [];
  const banner = [...log].reverse().find((l) => l.title);
  if (banner) return `${banner.season} national title`;
  const poy = [...log].reverse().find((l) => l.poy);
  if (poy?.poy) return `${poy.season} ${poy.poy} POY`;
  const league = [...log].reverse().find((l) => l.confTitle);
  if (hist.titles > 1) return `${hist.titles} national titles`;
  if (league) return `${league.season} conference title`;
  const bid = [...log].reverse().find((l) => l.ncaaBid);
  if (bid) return `${bid.season} NCAA bid`;
  const best = [...log].sort((a, b) => b.wins - a.wins || a.losses - b.losses)[0];
  if (best) return `${best.season} ${best.wins}-${best.losses}`;
  return `${hist.wins}-${hist.losses}`;
}

export function listHof(): HofEntry[] {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HofEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice().sort((a, b) => hofScore(b) - hofScore(a) || b.updatedAt - a.updatedAt).slice(0, MAX);
  } catch {
    return [];
  }
}

function writeHof(list: HofEntry[]) {
  try {
    storage()?.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* private mode */
  }
}

export function recordHof(state: GameState): HofEntry[] {
  const log = state.history?.log ?? [];
  if (log.length < 1) return listHof();
  const school = TEAM_BY_ID[state.playerTeamId];
  const entry: HofEntry = {
    id: playthroughId(state),
    coach: identityName(state.identity),
    teamId: state.playerTeamId,
    teamName: school?.name ?? state.playerTeamId,
    seasons: log.length,
    wins: state.history.wins,
    losses: state.history.losses,
    titles: state.history.titles,
    ncaaBids: state.history.ncaaBids,
    confTitles: state.history.confTitles,
    careerMode: state.careerMode,
    eraDecade: state.eraDecade,
    lastSeason: log[log.length - 1]?.season ?? state.season,
    highlight: highlightOf(state),
    updatedAt: Date.now(),
  };
  const rest = listHof().filter((e) => e.id !== entry.id);
  const next = [entry, ...rest].sort((a, b) => hofScore(b) - hofScore(a) || b.updatedAt - a.updatedAt).slice(0, MAX);
  writeHof(next);
  return next;
}