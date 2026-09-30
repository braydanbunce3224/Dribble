import type { ConferenceId, Difficulty, GameState, LeagueSettings } from "./types";
import { CONFERENCES, TEAM_BY_ID, TEAMS } from "./teams";
import { recordHof } from "./hof";
import { identityName } from "./engine-util";
import { makeContract } from "./contract";
import { eraHasNil } from "./era";

export const DIFFICULTY_OPTS: { id: Difficulty; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "Calls lean your way. Recruits are easier to sign." },
  { id: "realistic", label: "Realistic", hint: "College basketball as it is." },
  { id: "hard", label: "Hard", hint: "Power programs have the edge." },
  { id: "extreme", label: "Extreme", hint: "Mid-majors struggle. Five-stars stay at the big schools." },
  { id: "impossible", label: "Impossible", hint: "The blue bloods get the recruits." },
];

export function defaultSettings(era: number | null): LeagueSettings {
  return {
    difficulty: "realistic",
    godMode: false,
    nilOn: eraHasNil(era),
    flipsOn: true,
    teamColor: true,
    forceWin: false,
    soundOn: true,
    reducedMotion: false,
    largerType: false,
    haptics: true,
    portalStrict: "normal",
  };
}

export function settingsOf(state: GameState): LeagueSettings {
  const base = defaultSettings(state.eraDecade);
  const s = state.settings;
  if (!s) return base;
  return {
    difficulty: DIFFICULTY_OPTS.some((d) => d.id === s.difficulty) ? s.difficulty : base.difficulty,
    godMode: Boolean(s.godMode),
    nilOn: s.nilOn ?? base.nilOn,
    flipsOn: s.flipsOn ?? true,
    teamColor: s.teamColor !== false,
    forceWin: Boolean(s.forceWin),
    soundOn: s.soundOn !== false,
    reducedMotion: Boolean(s.reducedMotion),
    largerType: Boolean(s.largerType),
    haptics: s.haptics !== false,
    portalStrict: s.portalStrict === "open" || s.portalStrict === "tight" ? s.portalStrict : "normal",
    customLeague: s.customLeague && Array.isArray(s.customLeague.teams)
      ? {
          name: String(s.customLeague.name || "Custom").slice(0, 32),
          teams: s.customLeague.teams.filter((id) => typeof id === "string").slice(0, 16),
        }
      : undefined,
  };
}

export function recruitBias(state: GameState): number {
  return { easy: 12, realistic: 0, hard: -8, extreme: -14, impossible: -22 }[settingsOf(state).difficulty];
}

export function signFloor(state: GameState): number {
  return { easy: 58, realistic: 70, hard: 78, extreme: 84, impossible: 90 }[settingsOf(state).difficulty];
}

export function simBias(state: GameState): number {
  return { easy: 0.014, realistic: 0, hard: -0.008, extreme: -0.016, impossible: -0.026 }[settingsOf(state).difficulty];
}

export function prestigeGravity(state: GameState): number {
  return { easy: 0.6, realistic: 1, hard: 1.35, extreme: 1.7, impossible: 2.1 }[settingsOf(state).difficulty];
}

export function goatScore(state: GameState): number {
  const h = state.history;
  const poy = (h.log ?? []).filter((l) => l.poy).length;
  return Math.round(
    h.titles * 24 + (h.finalFour ?? 0) * 10 + (h.elite8 ?? 0) * 5 + (h.sweet16 ?? 0) * 2 + h.confTitles * 6 + h.ncaaBids * 3 + h.wins * 0.18 - h.losses * 0.04 + poy * 5 + h.seasons * 0.8,
  );
}

export function goatLine(state: GameState): string {
  const n = goatScore(state);
  if (n >= 140) return "Hall of Fame career";
  if (n >= 80) return "Solid career";
  if (n >= 40) return "Building a case";
  return "Just getting started";
}

export function retireCoach(state: GameState): GameState {
  recordHof(state);
  return { ...state, retired: true };
}

export function patchSettings(state: GameState, patch: Partial<LeagueSettings>): GameState {
  const next = { ...settingsOf(state), ...patch };
  let nilCap = state.nilCap;
  if (patch.nilOn === false) nilCap = 0;
  else if (patch.nilOn === true) nilCap = Math.max(state.nilCap, 100);
  return { ...state, settings: next, nilCap };
}

export function realign(state: GameState, teamId: string, conference: ConferenceId): { state: GameState; ok: boolean; detail: string } {
  if (!settingsOf(state).godMode) return { state, ok: false, detail: "God Mode is off." };
  if (state.phase !== "offseason" && state.phase !== "preseason") {
    return { state, ok: false, detail: "Move teams in the offseason or before you begin the season." };
  }
  const t = state.teams[teamId];
  if (!t) return { state, ok: false, detail: "No such program." };
  if (!CONFERENCES.some((c) => c.id === conference)) return { state, ok: false, detail: "No such league." };
  if (t.conference === conference) return { state, ok: false, detail: "Already there." };
  const from = t.conference;
  const dest = Object.values(state.teams).filter((x) => x.conference === conference);
  const src = Object.values(state.teams).filter((x) => x.conference === from);
  if (src.length <= 6) return { state, ok: false, detail: "That league is already thin." };
  const swap = dest.sort((a, b) => Math.abs(a.prestige - t.prestige) - Math.abs(b.prestige - t.prestige))[0];
  const teams = { ...state.teams, [teamId]: { ...t, conference } };
  if (swap && dest.length >= 14) {
    teams[swap.id] = { ...swap, conference: from };
    return {
      state: { ...state, teams },
      ok: true,
      detail: `${TEAM_BY_ID[teamId]?.name ?? teamId} to ${conference}. ${TEAM_BY_ID[swap.id]?.name ?? swap.id} slides the other way.`,
    };
  }
  return {
    state: { ...state, teams },
    ok: true,
    detail: `${TEAM_BY_ID[teamId]?.name ?? teamId} is now ${conference}.`,
  };
}

export function dreamJobs(state: GameState): { teamId: string; name: string }[] {
  const titles = state.history.titles ?? 0;
  const bids = state.history.ncaaBids ?? 0;
  if (titles < 1 && bids < 3) return [];
  const you = state.playerTeamId;
  return TEAMS.filter((t) => t.id !== you && t.prestige >= 84)
    .sort((a, b) => b.prestige - a.prestige)
    .slice(0, 2)
    .map((t) => ({ teamId: t.id, name: t.name }));
}

export function openDreamJob(state: GameState, teamId: string): { state: GameState; ok: boolean } {
  const hit = dreamJobs(state).some((j) => j.teamId === teamId);
  if (!hit && !settingsOf(state).godMode) return { state, ok: false };
  const school = TEAM_BY_ID[teamId];
  if (!school) return { state, ok: false };
  const nextTeams = { ...state.teams };
  const old = nextTeams[state.playerTeamId];
  if (old) nextTeams[state.playerTeamId] = { ...old, coachName: "Staff" };
  const incoming = nextTeams[teamId] ?? {
    id: teamId,
    conference: school.conference,
    prestige: school.prestige,
    wins: 0,
    losses: 0,
    confW: 0,
    confL: 0,
    homeW: 0,
    homeL: 0,
    homeStreak: 0,
    gymW: 0,
    gymL: 0,
    gymPf: 0,
    gymPa: 0,
    coachName: identityName(state.identity),
    allWins: 0,
    allLosses: 0,
  };
  nextTeams[teamId] = { ...incoming, coachName: identityName(state.identity) };
  return {
    ok: true,
    state: {
      ...state,
      playerTeamId: teamId,
      teams: nextTeams,
      contract: makeContract(teamId, state.season + (state.phase === "offseason" ? 1 : 0), 1),
      contractReview: state.contractReview ? { ...state.contractReview, resolved: true, jobs: [] } : null,
    },
  };
}
