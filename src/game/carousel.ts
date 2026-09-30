import type { CarouselBeat, CoachMove, GameState, Mail, NewsArticle, StaffRole } from "./types";
import { TEAM_BY_ID } from "./teams";
import { hashString, mulberry32, type Rng } from "./rng";
import { identityName } from "./engine-util";
import { randomPersonName } from "./people-names";
import { roleLabel } from "./program";

const ROLE_WORD: Record<StaffRole, string> = {
  oc: "offensive coordinator",
  dc: "defensive coordinator",
  rc: "recruiting coordinator",
};

function expectedWinPct(prestige: number) {
  return Math.max(0.32, Math.min(0.86, 0.28 + prestige / 155));
}

function coachNow(state: GameState, teamId: string) {
  if (teamId === state.playerTeamId) return identityName(state.identity);
  const stored = state.teams[teamId]?.coachName;
  if (stored && stored !== "Staff") return stored;
  const rng = mulberry32(state.seed ^ hashString(`burner-coach:${teamId}`));
  const p = randomPersonName(rng);
  return `${p.first} ${p.last}`;
}

function yearNow(state: GameState, teamId: string) {
  const stored = state.teams[teamId]?.coachYear;
  if (stored && stored > 0) return stored;
  const rng = mulberry32(state.seed ^ hashString(`burner-tenure:${teamId}`));
  return 1 + Math.floor(rng() * 12);
}

function schoolName(id: string) {
  return TEAM_BY_ID[id]?.name ?? id;
}

interface Seat {
  id: string;
  coach: string;
  prestige: number;
  wins: number;
  losses: number;
  games: number;
  winPct: number;
  expected: number;
  /** Positive means they finished under the win pace their program should have. */
  gap: number;
  year: number;
}

function seatsOf(state: GameState): Seat[] {
  const out: Seat[] = [];
  for (const [id, t] of Object.entries(state.teams)) {
    if (!t || t.guest || id === state.playerTeamId || !TEAM_BY_ID[id]) continue;
    const games = t.wins + t.losses;
    const winPct = games ? t.wins / games : 0.5;
    const expected = expectedWinPct(t.prestige);
    out.push({
      id,
      coach: coachNow(state, id),
      prestige: t.prestige,
      wins: t.wins,
      losses: t.losses,
      games,
      winPct,
      expected,
      gap: expected - winPct,
      year: yearNow(state, id),
    });
  }
  return out;
}

function freshName(rng: Rng, used: Set<string>) {
  const p = randomPersonName(rng, used);
  const name = `${p.first} ${p.last}`;
  used.add(name.toLowerCase());
  return name;
}

type Reason = "fired" | "nba" | "poached";

interface Vacancy {
  id: string;
  outName: string;
  reason: Reason;
}

interface Hire {
  inName: string;
  fromId?: string;
  promoted: boolean;
  fromBench: boolean;
  staffRole?: StaffRole;
}

/**
 * Turn the coaching carousel once, when the season ends.
 * A bad year can get a coach fired. A good year is what earns a better job.
 * Assistants get some of the open chairs. A few winners leave for the NBA.
 * The user's own job is settled by the contract, not by this.
 */
export function spinCarousel(state: GameState, rng: Rng): GameState {
  if ((state.coachMoves ?? []).some((m) => m.season === state.season)) return state;
  const you = state.playerTeamId;
  const board = seatsOf(state);
  if (!board.length) return state;
  const byId = new Map(board.map((s) => [s.id, s]));
  const used = new Set(board.map((s) => s.coach.toLowerCase()));
  used.add(identityName(state.identity).toLowerCase());

  const vacancies: Vacancy[] = [];
  const vacant = new Set<string>();
  const addVacancy = (id: string, outName: string, reason: Reason) => {
    if (vacant.has(id)) return;
    vacant.add(id);
    vacancies.push({ id, outName, reason });
  };

  let fires = 0;
  for (const s of [...board].sort((a, b) => b.gap - a.gap || b.prestige - a.prestige)) {
    if (fires >= 7 || s.games < 18) continue;
    const bomb = s.gap >= 0.22;
    const high = s.prestige >= 76 && s.winPct < 0.4 && s.year >= 2;
    const bad = s.gap >= 0.16 && s.year >= 2;
    const yearOne = s.year <= 1 && s.gap >= 0.28 && s.prestige >= 76;
    if (!bomb && !high && !bad && !yearOne) continue;
    const chance = yearOne ? 0.35 : bomb || high ? 0.8 : 0.55;
    if (rng() > chance) continue;
    addVacancy(s.id, s.coach, "fired");
    fires += 1;
  }

  let nba = 0;
  for (const s of [...board].filter((s) => !vacant.has(s.id)).sort((a, b) => a.gap - b.gap)) {
    if (nba >= 2 || s.games < 18 || s.prestige < 74 || s.gap > 0) continue;
    const champ = state.selection?.champ === s.id;
    const ncaa = Boolean(state.selection?.ncaa?.some((b) => b.teamId === s.id));
    if (!(champ || (ncaa && s.winPct >= 0.62) || s.winPct >= s.expected + 0.08)) continue;
    const chance = champ ? 0.28 : s.prestige >= 86 && s.winPct >= 0.7 ? 0.16 : 0.07;
    if (rng() > chance) continue;
    addVacancy(s.id, s.coach, "nba");
    nba += 1;
  }

  const hires = new Map<string, Hire>();
  let jumps = 0;
  const jumpers = board
    .filter((s) => !vacant.has(s.id) && s.games >= 18 && s.gap <= -0.06)
    .sort((a, b) => a.gap - b.gap);
  for (const s of jumpers) {
    if (jumps >= 5) break;
    const room = s.gap <= -0.14 ? 22 : 14;
    const spot = vacancies
      .filter((v) => !hires.has(v.id) && v.id !== s.id)
      .map((v) => ({ v, prestige: byId.get(v.id)?.prestige ?? 0 }))
      .filter((x) => x.prestige >= s.prestige + 4 && x.prestige <= s.prestige + room)
      .sort((a, b) => b.prestige - a.prestige)[0];
    if (!spot) continue;
    hires.set(spot.v.id, { inName: s.coach, fromId: s.id, promoted: false, fromBench: false });
    addVacancy(s.id, s.coach, "poached");
    jumps += 1;
  }

  const openSeats = () => vacancies.filter((v) => !hires.has(v.id));
  let leftRole: StaffRole | null = null;
  const yours = state.teams[you];
  const yourGames = (yours?.wins ?? 0) + (yours?.losses ?? 0);
  const yourPct = yourGames ? (yours?.wins ?? 0) / yourGames : 0.5;
  const yourExpected = expectedWinPct(yours?.prestige ?? 60);
  const over = yourPct - yourExpected;
  const review = state.contractReview;
  const userFire = review?.decision === "fire";
  const winRow = review?.results.find((r) => r.kind === "wins");
  const madeNcaa = Boolean(review?.results.some((r) => r.kind === "ncaa" && r.met));
  const meritsOffer =
    !userFire &&
    yourGames >= 18 &&
    (over >= 0.06 || Boolean(review?.standing && (madeNcaa || (winRow && winRow.actual >= winRow.target + 3))));
  if (userFire) addVacancy(you, identityName(state.identity), "fired");

  let reserved: { id: string; outName: string; fallback: string } | null = null;
  if (meritsOffer) {
    const room = over >= 0.14 ? 22 : 14;
    const spot = [...openSeats()]
      .map((v) => ({ v, prestige: state.teams[v.id]?.prestige ?? byId.get(v.id)?.prestige ?? 0 }))
      .filter((x) => x.v.id !== you && x.prestige >= (yours?.prestige ?? 60) + 4 && x.prestige <= (yours?.prestige ?? 60) + room)
      .sort((a, b) => b.prestige - a.prestige)[0];
    if (spot) {
      reserved = { id: spot.v.id, outName: spot.v.outName, fallback: freshName(rng, used) };
      hires.set(spot.v.id, { inName: "", fromId: undefined, promoted: false, fromBench: false });
    }
  }

  const bench = state.staff ? [state.staff.oc, state.staff.dc, state.staff.rc].filter((c) => c && c.rating >= 68) : [];
  bench.sort((a, b) => (b?.rating ?? 0) - (a?.rating ?? 0));
  const star = bench[0];
  if (state.staff && star && openSeats().length && (star.rating >= 82 || yourPct >= yourExpected - 0.02)) {
    const chance = 0.35 + (star.rating - 68) / 80;
    const seat = [...openSeats()].sort((a, b) => (state.teams[b.id]?.prestige ?? 0) - (state.teams[a.id]?.prestige ?? 0))
      .find((v) => v.id !== you && (state.teams[v.id]?.prestige ?? 0) <= (yours?.prestige ?? 60) + 10);
    if (seat && rng() < chance) {
      hires.set(seat.id, { inName: star.name, fromId: you, promoted: true, fromBench: true, staffRole: star.role });
      leftRole = star.role;
      used.add(star.name.toLowerCase());
    }
  }

  const donors = board.filter((s) => !vacant.has(s.id) && s.prestige >= 70);
  for (const seat of openSeats()) {
    const destP = state.teams[seat.id]?.prestige ?? byId.get(seat.id)?.prestige ?? 60;
    const donor = donors.filter((d) => d.prestige >= destP - 4).sort((a, b) => b.prestige - a.prestige)[0];
    const promote = Boolean(donor) && rng() < 0.62;
    hires.set(seat.id, {
      inName: freshName(rng, used),
      fromId: promote ? donor!.id : undefined,
      promoted: promote,
      fromBench: promote,
    });
  }

  const beats: CarouselBeat[] = [];
  for (const v of vacancies) {
    if (reserved && v.id === reserved.id) continue;
    const hire = hires.get(v.id);
    const t = state.teams[v.id];
    if (!hire || !t || !hire.inName) continue;
    const from = hire.fromId ? byId.get(hire.fromId) : undefined;
    const fromSchool = hire.fromId && hire.fromId !== you ? schoolName(hire.fromId) : hire.fromId === you ? schoolName(you) : undefined;
    let kind: CoachMove["kind"] = "fired";
    let note = "";
    if (v.reason === "nba" && !hire.fromId) {
      kind = "nba";
      note = `${v.outName} left for an NBA job. ${hire.inName} is the new coach.`;
    } else if (v.reason === "nba") {
      kind = hire.fromBench ? "promoted" : "jumped";
      note = `${v.outName} left for an NBA job. ${hire.inName}${fromSchool ? ` from ${fromSchool}` : ""} got it.`;
    } else if (hire.fromId && !hire.fromBench) {
      kind = "jumped";
      const rec = from ? `${from.wins}-${from.losses}` : "a good year";
      note = `${hire.inName} earned the job with ${rec} at ${fromSchool}. ${v.outName} is out.`;
    } else if (hire.fromBench) {
      kind = "promoted";
      note = hire.fromId === you
        ? `${hire.inName}, your ${ROLE_WORD[leftRole ?? "oc"]}, got the head job.`
        : `${hire.inName} was promoted off the ${fromSchool} bench. ${v.outName} is out.`;
    } else if (v.reason === "poached") {
      kind = "jumped";
      note = `${v.outName} left for a better job. ${hire.inName} is the replacement.`;
    } else if (v.id === you) {
      kind = "fired";
      note = `${schoolName(you)} hires ${hire.inName} after the seat opens.`;
    } else {
      kind = "fired";
      note = `${v.outName} was fired after ${t.wins}-${t.losses}. ${hire.inName} is the hire.`;
    }
    beats.push({
      id: `car-${state.season}-${v.id}`,
      teamId: v.id,
      school: schoolName(v.id),
      outName: v.outName,
      inName: hire.inName,
      kind,
      fromSchool,
      note,
      record: `${t.wins}-${t.losses}`,
      staffRole: hire.staffRole,
    });
  }

  const userName = identityName(state.identity);
  const userRec = `${yours?.wins ?? 0}-${yours?.losses ?? 0}`;
  if (userFire) {
    const seat = beats.findIndex((b) => b.teamId === you);
    const fireBeat: CarouselBeat = {
      id: `car-${state.season}-you-fire`,
      teamId: you,
      school: schoolName(you),
      outName: userName,
      inName: userName,
      kind: "fired",
      note: `${userRec}. The AD is ready to move on. The jobs below are open if you want one. Staying is still a choice.`,
      record: userRec,
      yours: true,
      decision: "fire",
    };
    if (seat >= 0) beats.splice(seat, 0, fireBeat);
    else beats.push(fireBeat);
  } else if (reserved) {
    const dest = state.teams[reserved.id];
    const offer: CarouselBeat = {
      id: `car-${state.season}-you-offer`,
      teamId: reserved.id,
      school: schoolName(reserved.id),
      outName: reserved.outName,
      inName: userName,
      kind: "jumped",
      fromSchool: schoolName(you),
      note: `${schoolName(reserved.id)} wants you. ${userRec} at ${schoolName(you)} is why the chair is open.`,
      record: dest ? `${dest.wins}-${dest.losses}` : userRec,
      yours: true,
      decision: "offer",
      offerTeamId: reserved.id,
      fallbackName: reserved.fallback,
    };
    const prestige = dest?.prestige ?? 0;
    const at = beats.findIndex((b) => (state.teams[b.teamId]?.prestige ?? 0) < prestige);
    if (at >= 0) beats.splice(at, 0, offer);
    else beats.push(offer);
  }

  if (!beats.length) {
    beats.push({
      id: `car-${state.season}-quiet`,
      teamId: you,
      school: "The carousel",
      outName: "",
      inName: "",
      kind: "fired",
      note: "No chair changed hands. The seats that looked hot stayed put.",
      record: userRec,
      quiet: true,
    });
  }

  beats.push({
    id: `car-${state.season}-recap`,
    teamId: you,
    school: "Recap",
    outName: "",
    inName: "",
    kind: "fired",
    note: "That's the carousel.",
    record: userRec,
    quiet: true,
    recap: true,
  });

  const moving = new Set(beats.filter((b) => !b.quiet && !b.decision).map((b) => b.teamId));
  if (reserved) moving.add(reserved.id);
  const teams = { ...state.teams };
  for (const [id, t] of Object.entries(teams)) {
    if (!t || t.guest || moving.has(id)) continue;
    const year = id === you ? state.contract?.yearOnJob ?? yearNow(state, id) : yearNow(state, id) + 1;
    teams[id] = {
      ...t,
      coachYear: year,
      coachName: id === you ? identityName(state.identity) : t.coachName && t.coachName !== "Staff" ? t.coachName : coachNow(state, id),
    };
  }

  const article: NewsArticle = {
    id: `carousel-${state.season}`,
    week: state.week,
    season: state.season,
    tone: "even",
    kicker: "Carousel",
    headline: "The carousel is open",
    dek: userFire ? "Your seat is part of it." : reserved ? "A better job is going to come up." : "One chair at a time.",
    byline: "The wire",
    outlet: "The News",
    grafs: ["Coaching changes land one at a time. Stay for the whole session."],
    text: "The coaching carousel is open. Jobs move one chair at a time.",
  };

  return {
    ...state,
    teams,
    coachMoves: (state.coachMoves ?? []).filter((m) => m.season !== state.season),
    carousel: { season: state.season, beats, index: 0, done: false },
    news: [article, ...state.news.filter((n) => n.id !== article.id)].slice(0, 60),
    mail: state.mail.filter((m) => m.id !== `asst-job-${state.season}`),
  };
}

function applyBeat(state: GameState, beat: CarouselBeat): GameState {
  if (beat.quiet || beat.decision || beat.applied) return state;
  if (beat.teamId === state.playerTeamId && state.contractReview && !state.contractReview.resolved) return state;
  const t = state.teams[beat.teamId];
  if (!t || !beat.inName) return state;
  const move: CoachMove = {
    season: state.season,
    teamId: beat.teamId,
    school: beat.school,
    outName: beat.outName,
    inName: beat.inName,
    kind: beat.kind,
    fromSchool: beat.fromSchool,
    note: beat.note,
  };
  let staff = state.staff;
  let mail: Mail[] = [];
  if (beat.staffRole && staff?.[beat.staffRole]?.name === beat.inName) {
    const role = beat.staffRole;
    staff = { ...staff, [role]: null };
    mail = [{
      id: `asst-job-${state.season}`,
      from: "Your staff",
      subject: `${beat.inName} took a head job`,
      body: `${beat.inName} is leaving to be the head coach at ${beat.school}. The ${roleLabel(role).toLowerCase()} chair is open. Hire before the portal gets loud.`,
      week: state.week,
      read: false,
      tone: "even",
    }];
  }
  return {
    ...state,
    teams: { ...state.teams, [beat.teamId]: { ...t, coachName: beat.inName, coachYear: 1 } },
    staff,
    coachMoves: [move, ...(state.coachMoves ?? []).filter((m) => !(m.season === move.season && m.teamId === move.teamId))].slice(0, 48),
    mail: [...mail, ...state.mail].slice(0, 40),
  };
}

function markBeat(state: GameState, index: number, patch: Partial<CarouselBeat>): GameState {
  const session = state.carousel;
  if (!session) return state;
  const beats = session.beats.map((b, i) => (i === index ? { ...b, ...patch } : b));
  return { ...state, carousel: { ...session, beats } };
}

export function carouselWaiting(state: GameState) {
  return state.phase === "offseason" && Boolean(state.carousel && !state.carousel.done && state.carousel.season === state.season);
}

function withRecap(state: GameState): GameState {
  const session = state.carousel;
  if (!session || session.beats.some((b) => b.recap)) return state;
  const you = state.playerTeamId;
  const t = state.teams[you];
  return {
    ...state,
    carousel: {
      ...session,
      beats: [
        ...session.beats,
        {
          id: `car-${session.season}-recap`,
          teamId: you,
          school: "Recap",
          outName: "",
          inName: "",
          kind: "fired",
          note: "That's the carousel.",
          record: `${t?.wins ?? 0}-${t?.losses ?? 0}`,
          quiet: true,
          recap: true,
        },
      ],
    },
  };
}

export function advanceCarousel(state: GameState): GameState {
  state = withRecap(state);
  const session = state.carousel;
  if (!session || session.done) return state;
  const beat = session.beats[session.index];
  if (!beat) return { ...state, carousel: { ...session, done: true } };
  if (beat.yours && (beat.decision === "fire" || beat.decision === "offer")) return state;
  let next = applyBeat(state, beat);
  next = markBeat(next, session.index, { applied: true });
  const index = session.index + 1;
  const done = index >= (next.carousel?.beats.length ?? session.beats.length);
  return { ...next, carousel: { ...next.carousel!, index, done } };
}

/** Stay at the current school. Offers are optional, including a firing. */
export function stayAtSchool(state: GameState): GameState {
  state = withRecap(state);
  const session = state.carousel;
  const review = state.contractReview;
  const name = identityName(state.identity);
  const school = schoolName(state.playerTeamId);
  if (!session || session.done) {
    if (!review || review.resolved) return state;
    return { ...state, contractReview: { ...review, resolved: true, decision: "continue" } };
  }
  const beat = session.beats[session.index];
  if (!beat?.yours) {
    if (!review || review.resolved) return state;
    return { ...state, contractReview: { ...review, resolved: true, decision: "continue" } };
  }

  let beats = session.beats.map((b) => ({ ...b }));
  let next = state;

  if (beat.decision === "offer") {
    const hired: CarouselBeat = {
      ...beat,
      yours: false,
      decision: undefined,
      inName: beat.fallbackName || beat.inName,
      kind: "promoted",
      note: `${beat.school} moved on. ${beat.fallbackName || "The search"} got the job.`,
      applied: false,
    };
    beats[session.index] = hired;
    next = applyBeat({ ...state, carousel: { ...session, beats } }, hired);
    beats = (next.carousel?.beats ?? beats).map((b, i) =>
      i === session.index ? { ...b, applied: true, decision: undefined, inName: hired.inName, note: hired.note } : b,
    );
  } else {
    beats = beats.filter((b, i) => i === session.index || b.recap || b.yours || b.teamId !== state.playerTeamId);
    const at = beats.findIndex((b) => b.id === beat.id);
    if (at >= 0) {
      beats[at] = { ...beats[at]!, applied: true, decision: undefined, note: `You stayed at ${school}.` };
    }
    next = {
      ...state,
      contractReview: review ? { ...review, resolved: true, decision: "continue", letter: `${name.split(" ")[0] || "Coach"},\n\nYou stayed. The chair is still yours.\n\n${school}` } : review,
    };
  }

  const at = Math.max(0, beats.findIndex((b) => b.id === beat.id));
  const index = at + 1;
  const done = index >= beats.length;
  return { ...next, carousel: { ...(next.carousel ?? session), beats, index, done } };
}

export function declineCarouselOffer(state: GameState): GameState {
  return stayAtSchool(state);
}

/** Call after the user actually changes schools. Steps off their carousel card. */
export function finishUserCarousel(state: GameState): GameState {
  const session = state.carousel;
  if (!session || session.done) return state;
  const beat = session.beats[session.index];
  if (!beat?.yours) return state;
  const beats = session.beats.map((b, i) => (i === session.index ? { ...b, applied: true } : b));
  const index = session.index + 1;
  return { ...state, carousel: { ...session, beats, index, done: index >= beats.length } };
}
