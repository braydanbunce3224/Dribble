/** User-facing labels. Internal ids (ncaa, nit, crown, kenpom) stay in saves. */
export const APP_NAME = "Dribble";
export const APP_SHORT = "Dribble";

export const NCAA = "NCAA Tournament";
export const NCAA_SHORT = "NCAA";
export const NIT = "NIT";
export const CBI = "CBI";
export const NET = "NET";
export const KENPOM = "KenPom";
export const AP_POLL = "AP Poll";
export const TOP_100 = "Top 100";
export const FIRST_FOUR = "First Four";
export const SELECTION_SUNDAY = "Selection Sunday";
export const CONFERENCE_TOURNEY = "Conference tournament";

/** @deprecated use NCAA_SHORT */
export const NATIONAL = NCAA_SHORT;
/** @deprecated use NCAA */
export const NATIONAL_TOURNEY = NCAA;
/** @deprecated use NIT */
export const INVITE = NIT;
/** @deprecated use CBI */
export const CROWN = CBI;
export const EVAL_BOARD = NET;
export const EFFICIENCY_BOARD = KENPOM;
export const WRITERS_POLL = AP_POLL;
export const DESK = "The News";
export const SUNDAY_BOARD = "Bracketology";
export const BOARD_100 = TOP_100;
export const PLAY_IN = FIRST_FOUR;
export const SELECTION_DAY = SELECTION_SUNDAY;

export function outletLabel(name?: string) {
  if (!name || name === "Campus Wire" || name === "The wire" || name === "the wire") return DESK;
  return name;
}

export function gameKindLabel(kind: string): string {
  switch (kind) {
    case "conference":
      return "Conference";
    case "noncon":
      return "Non-conference";
    case "mte":
      return "Classic";
    case "conf-tourney":
      return CONFERENCE_TOURNEY;
    case "ncaa":
      return NCAA;
    case "nit":
      return NIT;
    case "crown":
      return CBI;
    default:
      return "College basketball";
  }
}

export function gameKindShort(kind: string): string {
  switch (kind) {
    case "conference":
      return "Conference";
    case "noncon":
      return "Non-con";
    case "mte":
      return "Classic";
    case "conf-tourney":
      return "Conf. tourney";
    case "ncaa":
      return NCAA_SHORT;
    case "nit":
      return NIT;
    case "crown":
      return CBI;
    default:
      return "College basketball";
  }
}

export function phaseLabel(phase: string, week?: number): string {
  switch (phase) {
    case "preseason":
      return "Preseason";
    case "regular":
      return week != null ? `Week ${week}` : "Regular season";
    case "conference":
      return CONFERENCE_TOURNEY;
    case "selection":
      return SELECTION_SUNDAY;
    case "ncaa":
      return NCAA;
    case "nit":
      return NIT;
    case "crown":
      return CBI;
    case "offseason":
      return "Offseason";
    default:
      return phase;
  }
}

export type PostseasonBanner = "national" | "conference" | null;

/** Round copy for a finished NCAA game. A title banner only after the championship game. */
export function ncaaOutcome(slotId: string, youWin: boolean): { banner: PostseasonBanner; label: string } {
  if (slotId.startsWith("ncaa-title-")) {
    return youWin
      ? { banner: "national", label: "National champions" }
      : { banner: null, label: "National runner-up" };
  }
  if (!youWin) return { banner: null, label: "Loss" };
  if (slotId.startsWith("ncaa-ff-")) return { banner: null, label: "Advance to the first round" };
  if (slotId.startsWith("ncaa-64-")) return { banner: null, label: "Advance to the Round of 32" };
  if (slotId.startsWith("ncaa-32-")) return { banner: null, label: "Advance to the Sweet 16" };
  if (slotId.startsWith("ncaa-16-")) return { banner: null, label: "Advance to the Elite Eight" };
  if (slotId.startsWith("ncaa-8-")) return { banner: null, label: "Advance to the Final Four" };
  if (slotId.startsWith("ncaa-f4-")) return { banner: null, label: "Advance to the national championship game" };
  return { banner: null, label: "Advance" };
}

/**
 * Conference tournament copy from how many teams were still alive before this game.
 * Two alive means this game was the final. A semi is not a title.
 */
export function confOutcome(beforeAlive: number, youWin: boolean): { banner: PostseasonBanner; label: string } {
  if (beforeAlive <= 2) {
    return youWin
      ? { banner: "conference", label: "Conference champions" }
      : { banner: null, label: "Conference finalist" };
  }
  if (!youWin) return { banner: null, label: "Loss" };
  if (beforeAlive <= 4) return { banner: null, label: "Advance to the conference final" };
  if (beforeAlive <= 8) return { banner: null, label: "Advance to the semifinals" };
  return { banner: null, label: "Advance" };
}

/** Home / Away / Neutral. Tournament and MTE games are neutral even if a team is listed first. */
export function siteWord(
  slot: { site?: string; kind?: string; homeId: string } | undefined,
  you: string,
): "Home" | "Away" | "Neutral" {
  if (!slot) return "Neutral";
  if (
    slot.site === "neutral" ||
    slot.kind === "mte" ||
    slot.kind === "ncaa" ||
    slot.kind === "nit" ||
    slot.kind === "crown" ||
    slot.kind === "conf-tourney"
  ) {
    return "Neutral";
  }
  return slot.homeId === you ? "Home" : "Away";
}

export function ncaaRoundLabel(slotId: string): string {
  if (slotId.startsWith("ncaa-ff-")) return FIRST_FOUR;
  if (slotId.startsWith("ncaa-64-")) return "1st Round";
  if (slotId.startsWith("ncaa-32-")) return "2nd Round";
  if (slotId.startsWith("ncaa-16-")) return "Sweet 16";
  if (slotId.startsWith("ncaa-8-")) return "Elite Eight";
  if (slotId.startsWith("ncaa-f4-")) return "Final Four";
  if (slotId.startsWith("ncaa-title-")) return "National Championship";
  if (slotId.startsWith("nit-title-")) return `${NIT} championship`;
  if (slotId.startsWith("nit-")) return NIT;
  if (slotId.startsWith("crown-title-")) return `${CBI} championship`;
  if (slotId.startsWith("crown-")) return CBI;
  return NCAA_SHORT;
}

export function ncaaRegionFromSlot(slotId: string): string | null {
  const m = slotId.match(/^ncaa-64-(East|West|South|Midwest)-/);
  return m?.[1] ?? null;
}
