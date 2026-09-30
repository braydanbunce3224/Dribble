import type { RecapPlayer } from "./types";

export function boxTotals(rows: RecapPlayer[]): RecapPlayer {
  const sum = (k: keyof RecapPlayer) => rows.reduce((n, p) => n + (Number(p[k]) || 0), 0);
  return {
    id: "totals",
    name: "TEAM",
    pos: "PG",
    min: sum("min"),
    pts: sum("pts"),
    reb: sum("reb"),
    ast: sum("ast"),
    to: sum("to"),
    stl: sum("stl"),
    blk: sum("blk"),
    pf: sum("pf"),
    fgm: sum("fgm"),
    fga: sum("fga"),
    tpm: sum("tpm"),
    tpa: sum("tpa"),
    ftm: sum("ftm"),
    fta: sum("fta"),
  };
}

/** Everyone who played. Do not slice before the team row — a cut list makes the total short of the header. */
export function playedLines(rows: RecapPlayer[] | undefined): RecapPlayer[] {
  return [...(rows ?? [])]
    .filter((p) => (p.min || 0) > 0 || (p.pts || 0) > 0 || (p.fga || 0) > 0 || (p.fta || 0) > 0 || (p.reb || 0) > 0 || (p.ast || 0) > 0)
    .sort((a, b) => b.pts - a.pts || b.min - a.min);
}

export function madeLine(m?: number, a?: number) {
  return `${m ?? 0}–${a ?? 0}`;
}
