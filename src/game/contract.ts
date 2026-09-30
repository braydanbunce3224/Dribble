import type { CoachContract, ContractClause, ContractReview, ClauseResult, GameState, JobOffer, Mail } from "./types";
import { TEAM_BY_ID, TEAMS } from "./teams";
import { clamp, mulberry32, type Rng } from "./rng";
import { identityName } from "./engine-util";
import { adFirst, adFrom, coachFirst } from "./voices";
import { finishUserCarousel, spinCarousel } from "./carousel";

export function yearsForPrestige(prestige: number) {
  if (prestige >= 82) return 6;
  if (prestige >= 72) return 5;
  if (prestige >= 58) return 4;
  return 3;
}

export function winsTarget(prestige: number, yearOnJob: number) {
  let n = prestige >= 86 ? 24 : prestige >= 78 ? 22 : prestige >= 70 ? 20 : prestige >= 62 ? 18 : prestige >= 54 ? 16 : 14;
  if (yearOnJob <= 1) n = Math.max(10, n - 4);
  return n;
}

export function makeContract(teamId: string, season: number, yearOnJob = 1): CoachContract {
  const prestige = TEAM_BY_ID[teamId]?.prestige ?? 58;
  const years = yearsForPrestige(prestige);
  const wins = winsTarget(prestige, yearOnJob);
  const clauses: ContractClause[] = [{ kind: "wins", target: wins, label: `${wins} wins` }];
  if (prestige >= 70) {
    if (yearOnJob <= 1) clauses.push({ kind: "postseason", target: 1, label: "Make the postseason" });
    else clauses.push({ kind: "ncaa", target: 1, label: "Make the NCAA Tournament" });
  } else {
    const conf = Math.max(6, Math.round(wins * 0.45));
    clauses.push({ kind: "confWins", target: conf, label: `${conf} conference wins` });
  }
  return {
    years,
    remaining: years,
    signedSeason: season,
    yearOnJob,
    clauses,
  };
}

export function openingLetter(state: GameState): { subject: string; body: string } {
  const school = TEAM_BY_ID[state.playerTeamId]?.name ?? "this program";
  const c = state.contract;
  const years = c?.years ?? 4;
  const terms = (c?.clauses ?? [])
    .map((x) => (x.kind === "postseason" ? "a postseason bid" : x.kind === "ncaa" ? "an NCAA bid" : x.label))
    .join(" and ");
  const first = coachFirst(state);
  const helen = adFirst(state);
  return {
    subject: `Welcome to ${school}`,
    body: `${first},\n\nWelcome to ${school}. Your contract is ${years} years. We need ${terms}.\n\nHit those and we'll talk about an extension. Miss them and we'll meet in April.\n\nCall me if something is about to get out before you want it to.\n\n${helen}\nAthletic director`,
  };
}

function actualFor(state: GameState, kind: ContractClause["kind"]): number {
  const t = state.teams[state.playerTeamId];
  if (!t) return 0;
  const sel = state.selection;
  if (kind === "wins") return t.wins;
  if (kind === "confWins") return t.confW;
  if (kind === "ncaa") return sel?.ncaa?.some((b) => b.teamId === t.id) ? 1 : 0;
  if (kind === "confTitle") return sel?.confTourney === t.id || sel?.autos?.[t.conference] === t.id ? 1 : 0;
  if (kind === "postseason") {
    const id = t.id;
    if (sel?.ncaa?.some((b) => b.teamId === id)) return 1;
    if (sel?.nit?.includes(id) || sel?.crown?.includes(id)) return 1;
    return 0;
  }
  return 0;
}

export function clauseLive(state: GameState, clause: ContractClause): ClauseResult {
  const actual = actualFor(state, clause.kind);
  const met = actual >= clause.target;
  return { ...clause, actual, met };
}

export function contractProgress(state: GameState): ClauseResult[] {
  return (state.contract?.clauses ?? []).map((c) => clauseLive(state, c));
}

function letterFor(state: GameState, standing: boolean, decision: ContractReview["decision"], results: ClauseResult[], remainingAfter: number, school: string) {
  const missed = results.filter((r) => !r.met).map((r) => r.label);
  const hit = results.filter((r) => r.met).map((r) => r.label);
  const first = coachFirst(state);
  const helen = adFirst(state);
  if (decision === "extend") {
    return `${first},\n\nThe committee wants you back. ${hit.join(" and ") || "This year"} is what we asked for, so there's more time on the deal.\n\nSign it when you're ready. If you're leaving, tell me so I can start the search.\n\n${helen}\nAthletic director`;
  }
  if (decision === "fire") {
    return missed.length
      ? `${first},\n\n${school} is moving on. You missed ${missed.join(" and ")}, and I don't have a way to keep the job open.\n\nThere are a few programs still interested. Call them this week.\n\n${helen}\nAthletic director`
      : `${first},\n\nThe contract is up and they want a new coach. I wish I had a better way to say that.\n\nA few jobs are open if you want to keep coaching. Take a look.\n\n${helen}\nAthletic director`;
  }
  if (!standing) {
    return `${first},\n\nYou're still the coach. ${remainingAfter} year${remainingAfter === 1 ? "" : "s"} left. ${missed.join(" and ")} didn't get done.\n\nWe need those next year.\n\n${helen}\nAthletic director`;
  }
  return `${first},\n\n${remainingAfter} year${remainingAfter === 1 ? "" : "s"} left on the deal. ${hit.join(" and ") || "This year"} is what we hired you to do. Keep going.\n\n${helen}\nAthletic director`;
}

export function jobOffers(state: GameState, rng: Rng, standing: boolean): JobOffer[] {
  const you = TEAM_BY_ID[state.playerTeamId];
  const p = you?.prestige ?? 58;
  const lo = standing ? p - 6 : p - 16;
  const hi = standing ? p + 14 : p + 2;
  const alma = state.identity.almaMaterId;
  const pool = TEAMS.filter((t) => t.id !== state.playerTeamId && t.prestige >= lo && t.prestige <= Math.max(hi, lo + 8));
  const ranked = [...pool].sort((a, b) => {
    const almaBoost = (id: string) => (id === alma ? -30 : 0);
    return Math.abs(a.prestige - p) - Math.abs(b.prestige - p) + almaBoost(a.id) - almaBoost(b.id) || rng() - 0.5;
  });
  const take: JobOffer[] = [];
  const used = new Set<string>();
  if ((state.history.titles ?? 0) >= 1 || (state.history.ncaaBids ?? 0) >= 3) {
    const dream = TEAMS.filter((t) => t.id !== state.playerTeamId && t.prestige >= 84 && !used.has(t.id))
      .sort((a, b) => b.prestige - a.prestige)[0];
    if (dream) {
      take.push({ teamId: dream.id, contract: makeContract(dream.id, state.season + 1, 1) });
      used.add(dream.id);
    }
  }
  if (alma && alma !== state.playerTeamId && TEAM_BY_ID[alma] && !used.has(alma)) {
    take.push({ teamId: alma, contract: makeContract(alma, state.season + 1, 1) });
    used.add(alma);
  }
  for (const t of ranked) {
    if (take.length >= 3) break;
    if (used.has(t.id)) continue;
    take.push({ teamId: t.id, contract: makeContract(t.id, state.season + 1, 1) });
    used.add(t.id);
  }
  if (take.length < 3) {
    const rest = TEAMS.filter((t) => t.id !== state.playerTeamId && !used.has(t.id)).sort(
      (a, b) => Math.abs(a.prestige - p) - Math.abs(b.prestige - p) || rng() - 0.5,
    );
    for (const t of rest) {
      if (take.length >= 3) break;
      take.push({ teamId: t.id, contract: makeContract(t.id, state.season + 1, 1) });
      used.add(t.id);
    }
  }
  return take;
}

export function reviewContract(state: GameState): ContractReview {
  const c = state.contract ?? makeContract(state.playerTeamId, state.season, 1);
  const results = c.clauses.map((cl) => clauseLive(state, cl));
  const standing = results.every((r) => r.met);
  const remainingAfter = Math.max(0, c.remaining - 1);
  const t = state.teams[state.playerTeamId];
  const winsClause = results.find((r) => r.kind === "wins");
  const catastrophic = Boolean(winsClause && winsClause.actual <= winsClause.target - 8);
  const seasonsHere = (state.history?.log ?? []).filter((row) => row.teamId === state.playerTeamId).length;
  const canFire = seasonsHere > 2;
  const rng = mulberry32(state.seed ^ (state.season * 7919) ^ 0xc0a);
  let decision: ContractReview["decision"] = "continue";
  if (remainingAfter <= 0 && standing) decision = "extend";
  else if (canFire && remainingAfter <= 0) decision = "fire";
  else if (canFire && !standing && state.adHeat < 34 && catastrophic) decision = "fire";
  const school = TEAM_BY_ID[state.playerTeamId]?.name ?? "The school";
  const offer = decision === "extend" ? makeContract(state.playerTeamId, state.season + 1, c.yearOnJob + 1) : undefined;
  const jobs = decision === "fire" || decision === "extend" ? jobOffers(state, rng, standing) : [];
  return {
    season: state.season,
    results,
    standing,
    remainingAfter,
    decision,
    letter: letterFor(state, standing, decision, results, remainingAfter, school),
    offer,
    jobs,
    resolved: decision === "continue",
    record: `${t?.wins ?? 0}-${t?.losses ?? 0}`,
  };
}

export function applyReview(state: GameState): GameState {
  const review = reviewContract(state);
  const contract = state.contract ?? makeContract(state.playerTeamId, state.season, 1);
  let adHeat = state.adHeat;
  if (review.standing) adHeat = clamp(adHeat + 6, 0, 100);
  else adHeat = clamp(adHeat - (review.decision === "fire" ? 18 : 10), 0, 100);
  const you = state.teams[state.playerTeamId]!;
  const base = TEAM_BY_ID[you.id]?.prestige ?? 58;
  const madeNcaa = review.results.some((r) => r.kind === "ncaa" && r.met);
  let prestigeDelta: number;
  if (madeNcaa) {
    const champ = state.selection?.champ === you.id;
    const deepRun = champ || Boolean(state.history.log[state.history.log.length - 1]?.run === "f4");
    if (you.prestige >= 92) prestigeDelta = champ ? 1 : 0;
    else if (you.prestige >= 84) prestigeDelta = deepRun ? 1 : 0;
    else prestigeDelta = 1;
  } else {
    prestigeDelta = review.standing ? 0 : -1;
  }
  const drift = you.prestige - base;
  if (drift >= 12 && prestigeDelta <= 0) prestigeDelta -= 1;
  const next: GameState = {
    ...state,
    adHeat,
    fanMood: clamp(state.fanMood + (review.standing ? 4 : -6), 0, 100),
    donorMood: clamp(state.donorMood + (review.standing ? 3 : -5), 0, 100),
    teams: {
      ...state.teams,
      [you.id]: { ...you, prestige: clamp(you.prestige + prestigeDelta, 38, 99) },
    },
    contract: { ...contract, remaining: review.remainingAfter },
    contractReview: review,
    mail: [
      {
        id: `board-${state.season}`,
        from: adFrom(state),
        subject: review.decision === "fire" ? "I hate this part" : review.decision === "extend" ? "they want you back" : "year in review",
        body: review.letter,
        week: state.week,
        read: false,
        tone: (review.decision === "fire" ? "bad" : review.standing ? "good" : "even") as Mail["tone"],
      },
      ...state.mail,
    ].slice(0, 40),
  };
  const spun = spinCarousel(next, mulberry32(state.seed ^ (state.season * 104729) ^ 0xc0a7));
  const offer = spun.carousel?.beats.find((b) => b.decision === "offer" && b.offerTeamId);
  if (!offer?.offerTeamId || !spun.contractReview) return spun;
  if (spun.contractReview.jobs.some((j) => j.teamId === offer.offerTeamId)) return spun;
  return {
    ...spun,
    contractReview: {
      ...spun.contractReview,
      jobs: [...spun.contractReview.jobs, { teamId: offer.offerTeamId, contract: makeContract(offer.offerTeamId, state.season + 1, 1) }],
    },
  };
}

export function signExtension(state: GameState): { state: GameState; ok: boolean } {
  const review = state.contractReview;
  if (!review?.offer || review.resolved) return { state, ok: false };
  const offer = review.offer;
  return {
    ok: true,
    state: {
      ...state,
      contract: { ...offer, remaining: offer.years, yearOnJob: (state.contract?.yearOnJob ?? 1) + 1 },
      contractReview: { ...review, resolved: true, decision: "extend" },
      adHeat: clamp(state.adHeat + 4, 0, 100),
    },
  };
}

export function takeContractJob(state: GameState, teamId: string): { state: GameState; ok: boolean } {
  const review = state.contractReview;
  const offer = review?.jobs.find((j) => j.teamId === teamId);
  if (!offer || !TEAM_BY_ID[teamId]) return { state, ok: false };
  const prev = state.playerTeamId;
  const name = identityName(state.identity);
  const school = TEAM_BY_ID[teamId]!;
  const loyal = state.players
    .filter((p) => p.teamId === prev && p.morale >= 72 && p.year < 4 && !(p.injury && p.injury.weeksLeft > 0))
    .sort((a, b) => b.morale - a.morale || b.ovr - a.ovr)
    .slice(0, 2);
  const followIds = new Set(loyal.map((p) => p.id));
  const followed = loyal.map((p) => `${p.first} ${p.last}`).join(" and ");
  const moved: GameState = {
    ...state,
    playerTeamId: teamId,
    contract: { ...offer.contract, remaining: offer.contract.years, yearOnJob: 1 },
    contractReview: review ? { ...review, resolved: true } : null,
    snake:
      review && (review.decision !== "fire" || review.abrupt)
        ? { season: state.season, coach: name, from: TEAM_BY_ID[prev]?.name ?? "the last job", to: school.name }
        : state.snake ?? null,
    adHeat: 58,
    fanMood: 56,
    donorMood: 54,
    players: state.players.map((p) =>
      followIds.has(p.id) ? { ...p, teamId, portalFrom: prev, portalSeason: state.season } : p,
    ),
    teams: {
      ...state.teams,
      [prev]: { ...state.teams[prev]!, coachName: "Staff" },
      [teamId]: { ...state.teams[teamId]!, coachName: name, coachYear: 1 },
    },
    mail: [
      {
        id: `hire-${state.season}-${teamId}`,
        from: adFrom(state),
        subject: `Welcome to ${school.name}`,
        body: `${name.split(" ")[0] || "Coach"},\n\n${school.name} is yours. ${offer.contract.years} years. We need ${offer.contract.clauses.map((c) => (c.kind === "postseason" ? "a postseason bid" : c.kind === "ncaa" ? "an NCAA bid" : c.label)).join(" and ")}.${followed ? `\n\n${followed} came with you.` : ""}\n\nCome by the office when you get in.\n\n${adFirst(state)}\nAthletic director`,
        week: 0,
        read: false,
        tone: "good" as const,
      },
      ...state.mail,
    ].slice(0, 40),
  };
  return { ok: true, state: finishUserCarousel(moved) };
}

export function walkContract(state: GameState): GameState {
  const review = state.contractReview;
  if (!review || review.resolved) return state;
  const rng = mulberry32(state.seed ^ 0x11a);
  const jobs = review.jobs.length ? review.jobs : jobOffers(state, rng, review.standing);
  return {
    ...state,
    contractReview: {
      ...review,
      decision: "fire",
      abrupt: true,
      jobs,
      resolved: false,
      letter: `${coachFirst(state)},\n\nYou walked. That's your right. The deal's void.\n\nThree chairs if you still want one. Call me if you want to talk before you pick.\n\n${adFirst(state)}`,
    },
  };
}

export function contractLine(c: CoachContract | null | undefined) {
  if (!c) return "No paper yet";
  const left = c.remaining;
  return `${left} year${left === 1 ? "" : "s"} left · ${c.clauses.map((x) => x.label).join(" · ")}`;
}