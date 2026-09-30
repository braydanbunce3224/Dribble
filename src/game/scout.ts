import type { Feedback, GameSlot, GameState, ScoutCard } from "./types";
import { TEAM_BY_ID } from "./teams";
import { kenpom, netRanks } from "./ranks";
import { netReleased } from "./calendar";
import { matchup, teamTape } from "./analytics";
import { WEEK_HOURS } from "./types";

export function nextOppId(state: GameState): { slot: GameSlot; oppId: string } | null {
  const you = state.playerTeamId;
  const g = state.schedule
    .filter((x) => !x.resultId && !x.declined && (x.homeId === you || x.awayId === you))
    .sort((a, b) => a.week - b.week)[0];
  if (!g) return null;
  return { slot: g, oppId: g.homeId === you ? g.awayId : g.homeId };
}

export function buildScout(state: GameState, oppId: string, week: number, site: "home" | "away" | "neutral"): ScoutCard {
  const tape = teamTape(state, oppId);
  const kp = kenpom(state).find((r) => r.id === oppId);
  const net = netRanks(state).find((r) => r.id === oppId);
  const card = matchup(state, state.playerTeamId, oppId, week, site);
  const keys: string[] = [];
  if (tape.games) {
    if (tape.off.tov >= 0.2) keys.push("They turn the ball over. Press them.");
    else if (tape.off.tov <= 0.13) keys.push("They take care of the ball. Don't gamble.");
    if (tape.off.ts >= 0.56) keys.push("They can shoot. Contest everything.");
    if (tape.off.orb >= 0.34) keys.push("They crash the offensive glass. Box out.");
    if (tape.def.tov <= 0.14) keys.push("They don't force many turnovers. Beat them in the half court.");
    if (tape.awayW + tape.awayL > 0 && tape.awayPpp + 0.08 < tape.homePpp) keys.push("They struggle on the road.");
  }
  if (kp) {
    if (kp.adjORank <= 40) keys.push(`Top-40 offense on KenPom (${kp.adjORank}). Slow them down.`);
    if (kp.adjDRank <= 40) keys.push(`Top-40 defense on KenPom (${kp.adjDRank}). Move the ball.`);
    if (kp.adjTRank <= 50) keys.push("They want to push the pace.");
    if (kp.adjTRank >= 280) keys.push("They play slow. Use the shot clock.");
  }
  if (!keys.length) keys.push("Small sample. Run your offense.");
  const identity = kp
    ? kp.adjO - kp.adjD >= 8
      ? "Balanced"
      : kp.adjORank < kp.adjDRank
        ? "Offense-first"
        : "Defense-first"
    : "Unknown";
  const pace = kp ? (kp.adjT >= 70 ? "Up-tempo" : kp.adjT <= 64 ? "Half-court" : "Average pace") : "Average pace";
  const shot = tape.games ? (tape.off.ts >= 0.55 ? "They make shots" : tape.off.ts <= 0.5 ? "Cold from the floor" : "Average shooting") : "No sample";
  const defense = tape.games ? (tape.def.tov >= 0.2 ? "They gamble" : tape.def.ppp <= 0.95 ? "They guard" : "Ordinary defense") : "No sample";
  if (net && netReleased(state)) keys.push(`NET ${net.rank} · Q1 ${net.q1w}-${net.q1l}`);
  if (card.note) keys.push(card.note);
  return {
    teamId: oppId,
    week,
    identity,
    keys: keys.slice(0, 5),
    pace,
    shot,
    defense,
  };
}

export function scoutOpponent(state: GameState): { state: GameState; feedback: Feedback } {
  const nxt = nextOppId(state);
  if (!nxt) return { state, feedback: { title: "No tip", detail: "Nobody left on the board.", parts: [] } };
  if ((state.recruitingHours ?? WEEK_HOURS) < 1) {
    return { state, feedback: { title: "No hours", detail: "Scouting spends a recruiting hour.", parts: [] } };
  }
  if (state.scouted?.teamId === nxt.oppId && state.scouted.week === nxt.slot.week) {
    return { state, feedback: { title: "Already in", detail: "The report is on your desk.", parts: [] } };
  }
  const site = nxt.slot.homeId === state.playerTeamId ? "home" : nxt.slot.site === "neutral" ? "neutral" : "away";
  const card = buildScout(state, nxt.oppId, nxt.slot.week, site);
  const school = TEAM_BY_ID[nxt.oppId];
  return {
    state: { ...state, scouted: card, recruitingHours: (state.recruitingHours ?? WEEK_HOURS) - 1 },
    feedback: {
      title: `Scouted ${school?.abbr ?? "them"}`,
      detail: card.keys[0] ?? card.identity,
      parts: [{ label: "Hours", delta: -1 }],
    },
  };
}

export function liveScout(state: GameState): ScoutCard | null {
  const nxt = nextOppId(state);
  if (!nxt) return state.scouted ?? null;
  if (state.scouted?.teamId === nxt.oppId) return state.scouted;
  return null;
}
