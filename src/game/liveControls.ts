import type { GameState } from "./types";
import { paintBoard } from "./scoreFloor";

/** Seconds left where "Foul up 3" / "Don't foul" are the only endgame pair. */
export const FOUL_CLOCK = 12;

/** College shot clock is 30s. A 2-for-1 is your ball, ahead or tied, with about 31–40 seconds left. */
export const TWO_FOR_LO = 31;
export const TWO_FOR_HI = 40;

export type EndgameId = "foul" | "foul3" | "letplay" | "hold" | "twofor";

export type EndgameCall = { id: EndgameId; label: string };

export function liveSpot(state: GameState) {
  const live = state.liveGame;
  if (!live) return null;
  const you = state.playerTeamId;
  const youScore = live.homeId === you ? live.homeScore : live.awayScore;
  const oppScore = live.homeId === you ? live.awayScore : live.homeScore;
  const youOff = (live.poss === "home" ? live.homeId : live.awayId) === you;
  return { live, youScore, oppScore, lead: youScore - oppScore, youOff };
}

/** The only list of sideline endgame buttons. */
export function endgameMenu(state: GameState): EndgameCall[] {
  const spot = liveSpot(state);
  if (!spot || !spot.live.planned || spot.live.done) return [];
  const { live, lead, youOff } = spot;
  const out: EndgameCall[] = [];
  const lastMinute = live.half >= 2 && live.clock > 0 && live.clock <= 60;
  if (!youOff && lastMinute && lead <= -1 && lead >= -8) out.push({ id: "foul", label: "Intentional foul" });
  if (!youOff && live.half >= 2 && live.clock > 0 && live.clock <= FOUL_CLOCK && lead === 3) {
    out.push({ id: "foul3", label: "Foul up 3" });
    out.push({ id: "letplay", label: "Don't foul" });
  }
  if (youOff && lastMinute && lead >= 0 && lead <= 3) out.push({ id: "hold", label: "Hold for last" });
  if (youOff && lead >= 0 && lead <= 8 && live.clock >= TWO_FOR_LO && live.clock <= TWO_FOR_HI) {
    out.push({ id: "twofor", label: "2-for-1" });
  }
  return out;
}

/** Drop a live game on the exact foul-up-3 look. No-op if nothing is in progress. */
export function forceEndgameState(state: GameState): GameState {
  const live = state.liveGame;
  if (!live || live.done) return state;
  const youHome = live.homeId === state.playerTeamId;
  let opp = youHome ? live.awayScore : live.homeScore;
  let yours = youHome ? live.homeScore : live.awayScore;
  // Jumping 0:08 onto a 0–0 board used to finish 6–1. Plant a full game first.
  if (opp < 48 || yours < 48) {
    opp = 68;
    yours = 71;
  } else if (yours !== opp + 3) {
    yours = Math.max(48, opp + 3);
  }
  const homeScore = youHome ? yours : opp;
  const awayScore = youHome ? opp : yours;
  return {
    ...state,
    liveGame: {
      ...live,
      planned: true,
      half: Math.max(2, live.half),
      clock: 8,
      poss: youHome ? "away" : "home",
      homeScore,
      awayScore,
      homeLines: paintBoard(live.homeLines, homeScore),
      awayLines: paintBoard(live.awayLines, awayScore),
      parked12: true,
      lateChoice: null,
      sandbox: true,
      log: [
        {
          t: "H2 0:08",
          text: "Late game. Up 3. They have the ball.",
          homeScore,
          awayScore,
          kind: "period" as const,
        },
        ...live.log,
      ].slice(0, 48),
    },
  };
}

/** Drop a live game on a real 2-for-1: your ball, ahead, 0:36. */
export function forceTwoForState(state: GameState): GameState {
  const live = state.liveGame;
  if (!live || live.done) return state;
  const youHome = live.homeId === state.playerTeamId;
  let yours = youHome ? live.homeScore : live.awayScore;
  let opp = youHome ? live.awayScore : live.homeScore;
  if (yours < 48 || opp < 48) {
    yours = 70;
    opp = 68;
  } else if (yours < opp) {
    yours = opp;
  }
  const homeScore = youHome ? yours : opp;
  const awayScore = youHome ? opp : yours;
  return {
    ...state,
    liveGame: {
      ...live,
      planned: true,
      half: Math.max(2, live.half),
      clock: 36,
      poss: youHome ? "home" : "away",
      homeScore,
      awayScore,
      homeLines: paintBoard(live.homeLines, homeScore),
      awayLines: paintBoard(live.awayLines, awayScore),
      lateChoice: null,
      pace: "normal",
      parked2Half: undefined,
      sandbox: true,
      log: [
        {
          t: "H2 0:36",
          text: "2-for-1 window. You have the ball.",
          homeScore,
          awayScore,
          kind: "period" as const,
        },
        ...live.log,
      ].slice(0, 48),
    },
  };
}
