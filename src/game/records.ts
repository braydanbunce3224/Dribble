import type { CountStats, GameResult, GameState, RecordBook } from "./types";
import { TEAM_BY_ID, teamOf } from "./teams";
import { siteRecordLine } from "./present";

export function emptyBook(teamId: string): RecordBook {
  return { teamId, allW: 0, allL: 0, titles: 0, longestHome: 0 };
}

export function bookOf(state: GameState): RecordBook {
  const you = state.playerTeamId;
  const t = state.teams[you];
  const raw = state.recordBook;
  const base = raw && raw.teamId === you ? raw : emptyBook(you);
  return {
    ...base,
    teamId: you,
    allW: Math.max(base.allW, t?.allWins ?? 0),
    allL: Math.max(base.allL, t?.allLosses ?? 0),
    longestHome: Math.max(base.longestHome ?? 0, t?.homeStreak ?? 0, t?.gymW ? 0 : 0),
    titles: Math.max(base.titles ?? 0, state.history.titles ?? 0),
  };
}

function bumpStats(cur: CountStats | undefined, line: { min?: number; pts?: number; reb?: number; ast?: number; fgm?: number; fga?: number; tpm?: number; tpa?: number; ftm?: number; fta?: number }): CountStats {
  return {
    g: (cur?.g ?? 0) + 1,
    min: (cur?.min ?? 0) + Math.max(0, Math.round(line.min ?? 0)),
    pts: (cur?.pts ?? 0) + (line.pts ?? 0),
    reb: (cur?.reb ?? 0) + (line.reb ?? 0),
    ast: (cur?.ast ?? 0) + (line.ast ?? 0),
    fgm: (cur?.fgm ?? 0) + (line.fgm ?? 0),
    fga: (cur?.fga ?? 0) + (line.fga ?? 0),
    tpm: (cur?.tpm ?? 0) + (line.tpm ?? 0),
    tpa: (cur?.tpa ?? 0) + (line.tpa ?? 0),
    ftm: (cur?.ftm ?? 0) + (line.ftm ?? 0),
    fta: (cur?.fta ?? 0) + (line.fta ?? 0),
  };
}

export function applyPlayerLine(
  stats: CountStats | undefined,
  line: { min?: number; pts?: number; reb?: number; ast?: number; fgm?: number; fga?: number; tpm?: number; tpa?: number; ftm?: number; fta?: number },
) {
  if ((line.min ?? 0) < 1 && (line.pts ?? 0) < 1) return stats;
  return bumpStats(stats, line);
}

export function rollCareer(season: CountStats | undefined, career: CountStats | undefined): CountStats | undefined {
  if (!season || season.g < 1) return career;
  return {
    g: (career?.g ?? 0) + season.g,
    min: (career?.min ?? 0) + season.min,
    pts: (career?.pts ?? 0) + season.pts,
    reb: (career?.reb ?? 0) + season.reb,
    ast: (career?.ast ?? 0) + season.ast,
    fgm: (career?.fgm ?? 0) + season.fgm,
    fga: (career?.fga ?? 0) + season.fga,
    tpm: (career?.tpm ?? 0) + season.tpm,
    tpa: (career?.tpa ?? 0) + season.tpa,
    ftm: (career?.ftm ?? 0) + season.ftm,
    fta: (career?.fta ?? 0) + season.fta,
  };
}

function noteSeason(book: RecordBook, season: number, w: number, l: number) {
  if (book.bestSeason?.season === season) return { season, w, l };
  if (!book.bestSeason || w > book.bestSeason.w || (w === book.bestSeason.w && l < book.bestSeason.l)) {
    return { season, w, l };
  }
  return book.bestSeason;
}

export function stampBook(state: GameState, result: GameResult): RecordBook {
  const you = state.playerTeamId;
  const inGame = result.homeId === you || result.awayId === you;
  const book = bookOf(state);
  if (!inGame) return book;
  const youHome = result.homeId === you;
  const pf = youHome ? result.homeScore : result.awayScore;
  const pa = youHome ? result.awayScore : result.homeScore;
  const won = pf > pa;
  const oppId = youHome ? result.awayId : result.homeId;
  const t = state.teams[you];
  const next: RecordBook = {
    ...book,
    allW: book.allW + (won ? 1 : 0),
    allL: book.allL + (won ? 0 : 1),
    longestHome: Math.max(book.longestHome ?? 0, t?.homeStreak ?? 0),
  };
  if (won) {
    const margin = pf - pa;
    const prev = book.biggestWin;
    if (!prev || margin > prev.pf - prev.pa || (margin === prev.pf - prev.pa && pf > prev.pf)) {
      next.biggestWin = { season: state.season, oppId, pf, pa };
    }
  } else {
    const margin = pa - pf;
    const prev = book.worstLoss;
    if (!prev || margin > prev.pa - prev.pf) {
      next.worstLoss = { season: state.season, oppId, pf, pa };
    }
  }
  const recap = result.recap;
  const lines = youHome ? recap?.homeLeaders : recap?.awayLeaders;
  const star = [...(lines ?? [])].sort((a, b) => b.pts - a.pts)[0];
  if (star && star.pts >= 20 && star.pts < 70) {
    const prev = book.playerGame;
    if (!prev || star.pts > prev.pts) {
      next.playerGame = { name: star.name, pts: star.pts, season: state.season, oppId };
    }
  }
  const w = t?.wins ?? 0;
  const l = t?.losses ?? 0;
  next.bestSeason = noteSeason(book, state.season, w, l);
  return next;
}

export function closeSeasonBook(state: GameState): RecordBook {
  const book = bookOf(state);
  const t = state.teams[state.playerTeamId];
  const w = t?.wins ?? 0;
  const l = t?.losses ?? 0;
  const next = { ...book, bestSeason: noteSeason(book, state.season, w, l) };
  next.titles = Math.max(book.titles ?? 0, state.history.titles ?? 0);
  next.longestHome = Math.max(book.longestHome ?? 0, t?.homeStreak ?? 0);
  return next;
}

export function bookLines(state: GameState) {
  const book = bookOf(state);
  const school = teamOf(book.teamId);
  const live = state.teams[state.playerTeamId];
  const best = book.bestSeason && live && book.bestSeason.season === state.season
    ? { season: state.season, w: live.wins, l: live.losses }
    : book.bestSeason;
  const lines: { k: string; v: string }[] = [
    { k: "This job", v: `${book.allW}-${book.allL}` },
    { k: "This season", v: siteRecordLine(state) },
  ];
  if (best) lines.push({ k: "Best season", v: `${best.season} · ${best.w}-${best.l}` });
  if (book.biggestWin) {
    const opp = TEAM_BY_ID[book.biggestWin.oppId]?.name ?? book.biggestWin.oppId;
    lines.push({ k: "Biggest win", v: `${book.biggestWin.pf}–${book.biggestWin.pa} vs ${opp} (${book.biggestWin.season})` });
  }
  if (book.worstLoss) {
    const opp = TEAM_BY_ID[book.worstLoss.oppId]?.name ?? book.worstLoss.oppId;
    lines.push({ k: "Worst loss", v: `${book.worstLoss.pf}–${book.worstLoss.pa} vs ${opp} (${book.worstLoss.season})` });
  }
  if (book.playerGame && book.playerGame.pts < 70) {
    lines.push({ k: "Single-game", v: `${book.playerGame.name} ${book.playerGame.pts} vs ${TEAM_BY_ID[book.playerGame.oppId]?.abbr ?? ""} (${book.playerGame.season})` });
  }
  if ((book.longestHome ?? 0) > 0) lines.push({ k: "Longest home win streak", v: `W${book.longestHome}` });
  const cur = live?.homeStreak ?? 0;
  if (cur > 0) lines.push({ k: "Current home streak", v: `W${cur}` });
  else if (cur < 0) lines.push({ k: "Current home streak", v: `L${Math.abs(cur)}` });
  if ((book.titles ?? 0) > 0) lines.push({ k: "Titles here", v: String(book.titles) });
  return { school: school.name, lines, book };
}
