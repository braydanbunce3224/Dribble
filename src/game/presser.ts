import type { GameSlot, GameState } from "./types";
import { TEAM_BY_ID } from "./teams";
import { gameKindLabel } from "./brand";

export interface GameCtx {
  slotId: string;
  won: boolean;
  margin: number;
  oppName: string;
  oppMascot: string;
  oppPrestige: number;
  youPrestige: number;
  home: boolean;
  conf: boolean;
  youScore: number;
  oppScore: number;
  record: string;
  star: string;
  starFirst: string;
  starPts: number;
  starReb: number;
  starAst: number;
  week: number;
  nil: boolean;
  kind: GameSlot["kind"];
  ot: boolean;
  site: "home" | "away" | "neutral";
  schoolName: string;
  coachLast: string;
  coachFirst: string;
  youWins: number;
  youLosses: number;
  confW: number;
  confL: number;
  streak: number;
  injured: string | null;
  injuredPart: string | null;
  freshman: string | null;
  keyPlay: string;
  adHeat: number;
  fanMood: number;
  avgMorale: number;
  kindLabel: string;
  youTo: number;
  oppTo: number;
  youOrb: number;
  oppOrb: number;
  played: number;
}

function youStreak(state: GameState, won: boolean) {
  const you = state.playerTeamId;
  const games = state.results.filter((r) => r.homeId === you || r.awayId === you).slice(-8);
  let n = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    const r = games[i]!;
    const youHome = r.homeId === you;
    const youWin = youHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    if (youWin !== won) break;
    n++;
  }
  return n;
}

/** Box context for postgame mail. There is no press conference. */
export function gameCtx(state: GameState, slotId: string): GameCtx | null {
  const slot = state.schedule.find((g) => g.id === slotId);
  const res = state.results.find((r) => r.slotId === slotId);
  if (!slot || !res) return null;
  const youHome = slot.homeId === state.playerTeamId;
  const youScore = youHome ? res.homeScore : res.awayScore;
  const oppScore = youHome ? res.awayScore : res.homeScore;
  const oppId = youHome ? slot.awayId : slot.homeId;
  const opp = TEAM_BY_ID[oppId];
  const school = TEAM_BY_ID[state.playerTeamId];
  const you = state.teams[state.playerTeamId]!;
  const recap = res.recap;
  const leads = youHome ? recap?.homeLeaders : recap?.awayLeaders;
  const starLine = leads?.[0];
  const rosterStar = state.players.filter((p) => p.teamId === state.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0];
  const starName = starLine?.name ?? (rosterStar ? `${rosterStar.first} ${rosterStar.last}` : "the lead guard");
  const starFirst = starName.split(" ")[0] ?? "He";
  const hurt = state.players.find((p) => p.teamId === state.playerTeamId && p.injury && p.injury.weeksLeft > 0);
  const frosh = state.players
    .filter((p) => p.teamId === state.playerTeamId && p.year === 1 && !p.redshirt)
    .sort((a, b) => b.ovr - a.ovr)[0];
  const yours = state.players.filter((p) => p.teamId === state.playerTeamId);
  const avgMorale = yours.reduce((n, p) => n + p.morale, 0) / Math.max(1, yours.length);
  const won = youScore > oppScore;
  const site: "home" | "away" | "neutral" =
    slot.site === "neutral" || slot.kind === "mte" || slot.kind === "ncaa" || slot.kind === "nit" || slot.kind === "crown" || slot.kind === "conf-tourney"
      ? "neutral"
      : youHome
        ? "home"
        : "away";
  return {
    slotId,
    won,
    margin: Math.abs(youScore - oppScore),
    oppName: opp?.name ?? oppId,
    oppMascot: opp?.mascot ?? "them",
    oppPrestige: opp?.prestige ?? 60,
    youPrestige: school?.prestige ?? 60,
    home: site === "home",
    conf: slot.kind === "conference" || slot.kind === "conf-tourney",
    youScore,
    oppScore,
    record: `${you.wins}-${you.losses}`,
    star: starName,
    starFirst,
    starPts: starLine?.pts ?? 0,
    starReb: starLine?.reb ?? 0,
    starAst: starLine?.ast ?? 0,
    week: slot.week,
    nil: state.nilCap > 0,
    kind: slot.kind,
    ot: (res.minutes ?? 40) > 40,
    site,
    schoolName: school?.name ?? "this program",
    coachLast: state.identity.last || "Coach",
    coachFirst: state.identity.first || "Coach",
    youWins: you.wins,
    youLosses: you.losses,
    confW: you.confW,
    confL: you.confL,
    streak: youStreak(state, won),
    injured: hurt ? `${hurt.first} ${hurt.last}` : null,
    injuredPart: hurt?.injury?.part ?? null,
    freshman: frosh ? `${frosh.first} ${frosh.last}` : null,
    keyPlay: recap?.keyPlay ?? "",
    adHeat: state.adHeat ?? 55,
    fanMood: state.fanMood ?? 60,
    avgMorale,
    kindLabel: gameKindLabel(slot.kind),
    youTo: (youHome ? recap?.homeTo : recap?.awayTo) ?? 0,
    oppTo: (youHome ? recap?.awayTo : recap?.homeTo) ?? 0,
    youOrb: (youHome ? recap?.homeOrb : recap?.awayOrb) ?? 0,
    oppOrb: (youHome ? recap?.awayOrb : recap?.homeOrb) ?? 0,
    played: you.wins + you.losses,
  };
}
