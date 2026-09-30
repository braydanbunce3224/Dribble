/** One rule set for every era check. Decade is frozen on the save. */

export type EraDecade = 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020;

export function eraOf(state: { eraDecade?: number | null } | null | undefined): number | null {
  const n = state?.eraDecade;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** NCAA three-point line: 1986. Frozen 1980s get a half-decade mix. */
export function eraHasThree(era: number | null | undefined): boolean {
  return era == null || era >= 1980;
}

export function eraThreeScale(era: number | null | undefined): number {
  if (era == null || era >= 2010) return 1;
  if (era >= 1990) return 0.72;
  if (era >= 1980) return 0.42;
  return 0;
}

/** NCAA shot clock: 1985. 60s run, 70s stall, both without a clock. */
export function eraHasShotClock(era: number | null | undefined): boolean {
  return era == null || era >= 1980;
}

export function eraPace(era: number | null | undefined): {
  base: number;
  lo: number;
  hi: number;
  scoreLo: number;
  scoreHi: number;
  stall: boolean;
} {
  if (era === 1960) return { base: 72, lo: 65, hi: 80, scoreLo: 55, scoreHi: 99, stall: false };
  if (era === 1970) return { base: 62.5, lo: 56, hi: 70, scoreLo: 48, scoreHi: 86, stall: true };
  if (era === 1980) return { base: 68, lo: 62, hi: 75, scoreLo: 56, scoreHi: 94, stall: false };
  return { base: 68, lo: 60, hi: 76, scoreLo: 58, scoreHi: 86, stall: false };
}

export function eraHasNil(era: number | null | undefined): boolean {
  return era == null || era >= 2020;
}

export function eraPortal(era: number | null | undefined): "none" | "restricted" | "full" {
  if (era != null && era < 2010) return "none";
  if (era === 2010) return "restricted";
  return "full";
}
