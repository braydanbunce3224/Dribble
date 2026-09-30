import type { ComplianceFlag, ComplianceState, GameState, Recruit } from "./types";
import { TEAM_BY_ID } from "./teams";
import { clamp } from "./rng";
import { brief } from "./wire";
import { eraHasNil } from "./era";
import { facilityAprBump } from "./program";
import { coachFirst, complianceFirst, complianceFrom } from "./voices";

export const APR_LINE = 930;
const FLAG_MAX = 8;

export function emptyCompliance(): ComplianceState {
  return { heat: 8, apr: 962, banned: false, flags: [], visitsThisWeek: 0 };
}

function nilEra(state: GameState) {
  return eraHasNil(state.eraDecade);
}

export function calcApr(state: GameState): number {
  const rot = state.players.filter((p) => p.teamId === state.playerTeamId);
  if (!rot.length) return 960;
  let pts = 0;
  for (const p of rot) {
    const eligible = p.skills.iq >= 44 && p.morale >= 38 ? 1 : p.skills.iq >= 38 ? 0.55 : 0.25;
    const retained = p.year < 4 ? 1 : p.skills.iq >= 48 ? 0.95 : 0.7;
    const minutesDrag = p.mpg >= 22 && p.skills.iq < 46 ? 0.08 : 0;
    pts += Math.max(0, eligible + retained - minutesDrag);
  }
  return clamp(Math.round((pts / (2 * rot.length)) * 1000) + facilityAprBump(state), 820, 1000);
}

function pushFlag(flags: ComplianceFlag[], flag: ComplianceFlag): ComplianceFlag[] {
  const next = [flag, ...flags.filter((f) => f.id !== flag.id)];
  return next.slice(0, FLAG_MAX);
}

function withFlag(state: GameState, flag: ComplianceFlag, heatDelta: number): GameState {
  const c = state.compliance ?? emptyCompliance();
  const heat = clamp(c.heat + heatDelta, 0, 100);
  const banned = heat >= 88 || c.apr < APR_LINE;
  return {
    ...state,
    compliance: { ...c, heat, banned, flags: pushFlag(c.flags, flag) },
    adHeat: clamp(state.adHeat - (flag.severity === "major" ? 6 : flag.severity === "notice" ? 2 : 0), 0, 100),
  };
}

export function ncaaEligible(state: GameState, teamId = state.playerTeamId): boolean {
  if (teamId !== state.playerTeamId) return true;
  const c = state.compliance ?? emptyCompliance();
  if (c.banned) return false;
  if (c.apr < APR_LINE) return false;
  return true;
}

export function deadPeriod(state: GameState): boolean {
  return state.phase === "ncaa" || state.phase === "nit" || state.phase === "crown" || state.phase === "selection";
}

export function noteOffer(state: GameState, r: Recruit): GameState {
  if (!nilEra(state) && r.nilAsk >= 36) {
    return withFlag(
      state,
      {
        id: `nil-${r.id}`,
        kind: "extra",
        severity: "major",
        week: state.week,
        text: `Impermissible benefit. ${r.first} ${r.last} was offered money the era does not allow. Bylaw 16.`,
      },
      18,
    );
  }
  if (nilEra(state) && r.nilAsk > state.nilCap + 18) {
    return withFlag(
      state,
      {
        id: `pool-${r.id}`,
        kind: "nil",
        severity: "notice",
        week: state.week,
        text: `${r.first}'s ask sits over the House pool. Extra-benefit risk if a booster fills the gap.`,
      },
      7,
    );
  }
  return state;
}

export function noteVisit(state: GameState, r: Recruit): { state: GameState; blocked?: string } {
  if (deadPeriod(state)) {
    return {
      state: withFlag(
        state,
        {
          id: `dead-${state.week}`,
          kind: "dead",
          severity: "notice",
          week: state.week,
          text: "Recruiting calendar is dead through March. Official visits in this window are a violation.",
        },
        9,
      ),
      blocked: "Dead period. The NCAA calendar is closed through March.",
    };
  }
  const c = state.compliance ?? emptyCompliance();
  const visits = c.visitsThisWeek + 1;
  let next: GameState = { ...state, compliance: { ...c, visitsThisWeek: visits } };
  if (visits >= 3) {
    next = withFlag(
      next,
      {
        id: `vis-${state.week}`,
        kind: "visits",
        severity: visits >= 4 ? "major" : "notice",
        week: state.week,
        text: `${visits} official visits this week. The NCAA limits contact. Compliance is watching the flight logs.`,
      },
      visits >= 4 ? 12 : 5,
    );
  }
  void r;
  return { state: next };
}

export function tickCompliance(state: GameState): GameState {
  const c = state.compliance ?? emptyCompliance();
  const apr = calcApr(state);
  let heat = clamp(c.heat - 2, 0, 100);
  let flags = c.flags;
  let banned = c.banned;
  if (apr < APR_LINE) {
    flags = pushFlag(flags, {
      id: `apr-${state.season}`,
      kind: "apr",
      severity: "major",
      week: state.week,
      text: `APR ${apr} is under the 930 line. Bylaw 14: no NCAA championship until the rate recovers.`,
    });
    heat = clamp(heat + 8, 0, 100);
    banned = true;
  } else if (apr < 950) {
    flags = pushFlag(flags, {
      id: `aprw-${state.season}`,
      kind: "apr",
      severity: "watch",
      week: state.week,
      text: `APR ${apr} is above 930 but thin. Minutes on low-IQ players will put you under the line.`,
    });
  } else if (apr >= APR_LINE && heat < 88) {
    banned = false;
  }
  if (heat >= 88) banned = true;
  const next: GameState = {
    ...state,
    compliance: { ...c, apr, heat, banned, flags, visitsThisWeek: 0 },
  };
  if (banned && !c.banned) {
    return {
      ...next,
      mail: [
        {
          id: `comp-ban-${state.season}-${state.week}`,
          from: complianceFrom(state),
          subject: "I need you to read this",
          body: apr < APR_LINE
            ? `${coachFirst(state)},\n\nAPR is ${apr}. The line is 930. That's the NCAA, not me.\n\nYou can still play the conference tournament. You cannot play the NCAA Tournament until this number comes back. Call me before you talk to the kids.\n\n${complianceFirst(state)}`
            : `${coachFirst(state)},\n\nThe file is too hot. The NCAA will not certify a tournament bid while this case is open. I'm on your side. I also have a job.\n\nCome by. We'll go through it line by line.\n\n${complianceFirst(state)}`,
          week: state.week,
          read: false,
          tone: "bad" as const,
        },
        ...state.mail,
      ].slice(0, 40),
      news: [
        brief(
          state.week,
          `${TEAM_BY_ID[state.playerTeamId]?.name ?? "The program"} is ineligible for the NCAA Tournament`,
          [
            apr < APR_LINE
              ? `APR ${apr}. The 930 line is the NCAA's, not a suggestion. Conference tournament is still on the table. Selection Sunday is not.`
              : `The file is too hot. The NCAA will not certify a tournament bid while this case is open.`,
          ],
          "bad",
          "Compliance",
        ),
        ...state.news,
      ].slice(0, 60),
    };
  }
  return next;
}

export function complianceLabel(c: ComplianceState) {
  if (c.banned) return "Ineligible";
  if (c.heat >= 70) return "Notice";
  if (c.heat >= 42 || c.apr < 950) return "Watch";
  return "Clean";
}

export function complianceNote(state: GameState) {
  const c = state.compliance ?? emptyCompliance();
  const top = c.flags[0];
  if (c.banned && c.apr < APR_LINE) return `APR ${c.apr}. Under 930. No NCAA Tournament.`;
  if (c.banned) return "The NCAA file is too hot. No postseason.";
  if (top) return top.text;
  return `APR ${c.apr}. No NCAA issues.`;
}