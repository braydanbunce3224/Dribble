import type { GameState, LiveGame, RecapPlayer } from "./types";
import { siteWord } from "./brand";
import { winProb } from "./depth";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pfSum(rows?: RecapPlayer[]) {
  return (rows ?? []).reduce((s, r) => s + (r.pf ?? 0), 0);
}

/**
 * Scorebug win%. Wraps the clock model and then clamps readings that would
 * contradict the scoreboard. Display only — the possession engine does not read this.
 */
export function honestWinPct(live: LiveGame, youHome: boolean): number {
  let p = winProb(live, youHome);
  const you = youHome ? live.homeScore : live.awayScore;
  const them = youHome ? live.awayScore : live.homeScore;
  const diff = you - them;
  const timeLeft = Math.max(0, live.clock) + (live.half === 1 ? 1200 : 0);
  const youPf = pfSum(youHome ? live.homeLines : live.awayLines);
  const themPf = pfSum(youHome ? live.awayLines : live.homeLines);
  if (timeLeft < 900 && youPf >= 10) p -= Math.min(5, youPf - 9);
  if (timeLeft < 900 && themPf >= 10) p += Math.min(5, themPf - 9);
  if (live.lateChoice === "foul3" && diff > 0) p = Math.min(p, 82);
  if (diff <= -25 && timeLeft <= 180) p = Math.min(p, 8);
  if (diff <= -12 && timeLeft <= 45) p = Math.min(p, 18);
  if (diff >= 25 && timeLeft <= 180) p = Math.max(p, 92);
  if (diff >= 8 && timeLeft <= 8) p = Math.max(p, 97);
  return clamp(Math.round(p), 1, 99);
}

/** This season's home / away / neutral record, counted from played games — not a stored streak. */
export function seasonSiteRecord(state: GameState) {
  const you = state.playerTeamId;
  const rec = { homeW: 0, homeL: 0, awayW: 0, awayL: 0, neuW: 0, neuL: 0 };
  for (const r of state.results) {
    if (r.homeId !== you && r.awayId !== you) continue;
    const slot = state.schedule.find((g) => g.id === r.slotId);
    const site = siteWord(slot, you);
    const youScore = r.homeId === you ? r.homeScore : r.awayScore;
    const oppScore = r.homeId === you ? r.awayScore : r.homeScore;
    const won = youScore > oppScore;
    if (site === "Home") {
      if (won) rec.homeW++;
      else rec.homeL++;
    } else if (site === "Away") {
      if (won) rec.awayW++;
      else rec.awayL++;
    } else if (won) rec.neuW++;
    else rec.neuL++;
  }
  return rec;
}

export function siteRecordLine(state: GameState) {
  const s = seasonSiteRecord(state);
  const n = s.homeW + s.homeL + s.awayW + s.awayL + s.neuW + s.neuL;
  if (!n) return "No games yet";
  return `Home ${s.homeW}-${s.homeL} · Away ${s.awayW}-${s.awayL} · Neutral ${s.neuW}-${s.neuL}`;
}
