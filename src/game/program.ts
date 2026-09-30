import type {
  DepthChart,
  Facilities,
  FacilityKind,
  Feedback,
  GameState,
  Player,
  Pos,
  PracticePlan,
  ProgramEvent,
  StaffBoard,
  StaffCoach,
  StaffRole,
} from "./types";
import { TEAM_BY_ID } from "./teams";
import { rivalryForSlot } from "./rivalry";
import { clamp, hashString, mulberry32, pick, randInt, type Rng } from "./rng";
import { composite, focusSkill } from "./camp";
import { randomPersonName } from "./people-names";

function isOut(p: Player) {
  return Boolean(p.redshirt) || (p.injury != null && p.injury.weeksLeft > 0);
}

const POS: Pos[] = ["PG", "SG", "SF", "PF", "C"];

const OC_SPEC = ["Motion", "Pace", "Post", "Horns", "Transition"];
const DC_SPEC = ["Pack-line", "Pressure", "Switch", "Drop", "Matchup zone"];
const RC_SPEC = ["High school", "Portal", "International", "Midwest", "Prep"];

const ROLE_LABEL: Record<StaffRole, string> = {
  oc: "Offensive coordinator",
  dc: "Defensive coordinator",
  rc: "Recruiting coordinator",
};

export const FACILITY_OPTS: { id: FacilityKind; label: string; hint: string }[] = [
  { id: "practice", label: "Practice gym", hint: "Player development in camp and during the season." },
  { id: "academics", label: "Academic center", hint: "Helps your APR." },
  { id: "locker", label: "Locker room", hint: "Team chemistry." },
  { id: "training", label: "Training room", hint: "Fewer injuries, and they heal faster." },
];

export const PRACTICE_OPTS: { id: PracticePlan; label: string; hint: string }[] = [
  { id: "rest", label: "Rest", hint: "Legs recover. Skill growth slows down." },
  { id: "film", label: "Film", hint: "IQ goes up. Fatigue stays down." },
  { id: "scrimmage", label: "Scrimmage", hint: "A normal week of work." },
  { id: "hard", label: "Hard", hint: "More growth, and more fatigue." },
];

export function roleLabel(role: StaffRole) {
  return ROLE_LABEL[role];
}

function prestigeOf(state: GameState) {
  return state.teams[state.playerTeamId]?.prestige ?? 70;
}

function makeCoach(rng: Rng, role: StaffRole, prestige: number, used: Set<string>): StaffCoach {
  const name = randomPersonName(rng, used);
  used.add(`${name.first} ${name.last}`.toLowerCase());
  const spec = role === "oc" ? pick(rng, OC_SPEC) : role === "dc" ? pick(rng, DC_SPEC) : pick(rng, RC_SPEC);
  const rating = clamp(Math.round(46 + prestige * 0.28 + gaussianish(rng) * 8), 48, 94);
  return {
    id: `st-${role}-${Math.floor(rng() * 1e9).toString(36)}`,
    name: `${name.first} ${name.last}`,
    role,
    rating,
    specialty: spec,
    years: 0,
    from: pick(rng, ["mid-major staff", "high school", "G League", "another D-I bench", "the portal circuit"]),
  };
}

function gaussianish(rng: Rng) {
  return rng() + rng() + rng() - 1.5;
}

export function seedStaff(seed: number, prestige: number): StaffBoard {
  const rng = mulberry32(seed ^ 0x51a7);
  const used = new Set<string>();
  const oc = makeCoach(rng, "oc", prestige, used);
  const dc = makeCoach(rng, "dc", prestige, used);
  const rc = makeCoach(rng, "rc", prestige, used);
  const pool = Array.from({ length: 6 }, (_, i) => makeCoach(rng, (["oc", "dc", "rc"] as const)[i % 3]!, prestige - 4, used));
  return { oc, dc, rc, pool, hiresThisYear: 0 };
}

export function seedFacilities(prestige: number): Facilities {
  const base = prestige >= 90 ? 3 : prestige >= 78 ? 2 : 1;
  return {
    practice: clamp(base + (prestige >= 96 ? 1 : 0), 1, 5),
    academics: clamp(base, 1, 5),
    locker: clamp(base + (prestige >= 88 ? 1 : 0), 1, 5),
    training: clamp(base, 1, 5),
    upgradedThisYear: 0,
  };
}

export function staffOf(state: GameState): StaffBoard {
  return state.staff ?? seedStaff(state.seed, prestigeOf(state));
}

export function facilitiesOf(state: GameState): Facilities {
  return state.facilities ?? seedFacilities(prestigeOf(state));
}

export function practiceOf(state: GameState): PracticePlan {
  return state.practice ?? "scrimmage";
}

export function depthOf(state: GameState): DepthChart {
  const d = state.depth ?? { starters: {}, captainId: null };
  const roster = state.players.filter((p) => p.teamId === state.playerTeamId && !isOut(p));
  const starters: Partial<Record<Pos, string>> = { ...d.starters };
  for (const pos of POS) {
    const id = starters[pos];
    if (id && roster.some((p) => p.id === id && p.pos === pos)) continue;
    const best = roster.filter((p) => p.pos === pos).sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr)[0];
    starters[pos] = best?.id;
  }
  const captainId = d.captainId && roster.some((p) => p.id === d.captainId)
    ? d.captainId
    : roster.filter((p) => p.year >= 3).sort((a, b) => b.skills.iq - a.skills.iq || b.ovr - a.ovr)[0]?.id ?? roster[0]?.id ?? null;
  return { starters, captainId };
}

export function staffTease(state: GameState) {
  const s = staffOf(state);
  const names = [s.oc, s.dc, s.rc].filter(Boolean) as StaffCoach[];
  const avg = names.length ? Math.round(names.reduce((n, c) => n + c.rating, 0) / names.length) : 50;
  const star = names.slice().sort((a, b) => b.rating - a.rating)[0];
  return {
    head: star ? `${star.name.split(" ").slice(-1)} · ${avg} ovr` : "No assistants",
    note: star ? ROLE_LABEL[star.role] : "Hire a staff.",
  };
}

export function facilityTease(state: GameState) {
  const f = facilitiesOf(state);
  const avg = Math.round((f.practice + f.academics + f.locker + f.training) / 4);
  const top = FACILITY_OPTS.slice().sort((a, b) => f[b.id] - f[a.id])[0]!;
  return {
    head: `Level ${avg}`,
    note: `${top.label} ${f[top.id]}/5`,
  };
}

export function staffOffEdge(state: GameState) {
  return ((staffOf(state).oc?.rating ?? 50) - 50) * 0.00042;
}

export function staffDefEdge(state: GameState) {
  return ((staffOf(state).dc?.rating ?? 50) - 50) * 0.0004;
}

export function staffRecruitBonus(state: GameState) {
  return Math.round(((staffOf(state).rc?.rating ?? 50) - 50) * 0.1);
}

export function staffHourBonus(state: GameState) {
  const rc = staffOf(state).rc?.rating ?? 50;
  if (rc >= 82) return 2;
  if (rc >= 68) return 1;
  return 0;
}

export function staffSchemeEdge(state: GameState) {
  const oc = staffOf(state).oc;
  const dc = staffOf(state).dc;
  const plan = state.gamePlan;
  let n = 0;
  if (oc && plan) {
    const spec = oc.specialty.toLowerCase();
    const looks = plan.off.join(" ");
    if (spec.includes("motion") && looks.includes("motion")) n += 0.00022;
    if ((spec.includes("pace") || spec.includes("transition")) && (looks.includes("push") || looks.includes("spread"))) n += 0.00022;
    if (spec.includes("post") && looks.includes("post")) n += 0.00022;
    if (spec.includes("horns") && looks.includes("horns")) n += 0.00022;
  }
  if (dc && plan) {
    const spec = dc.specialty.toLowerCase();
    const looks = plan.def.join(" ");
    if (spec.includes("pack") && looks.includes("pack")) n += 0.0002;
    if (spec.includes("pressure") && (looks.includes("press") || looks.includes("trap"))) n += 0.0002;
    if (spec.includes("switch") && looks.includes("switch")) n += 0.0002;
    if (spec.includes("drop") && looks.includes("sag")) n += 0.0002;
    if (spec.includes("zone") && looks.includes("zone")) n += 0.0002;
  }
  return n;
}

export function facilityHca(state: GameState) {
  return (facilitiesOf(state).locker - 1) * 0.0016;
}

export function facilityAprBump(state: GameState) {
  return (facilitiesOf(state).academics - 1) * 6;
}

export function facilityDevBump(state: GameState) {
  return (facilitiesOf(state).practice - 1) * 0.35;
}

export function trainingHealBonus(state: GameState) {
  return facilitiesOf(state).training >= 4 ? 1 : facilitiesOf(state).training >= 3 ? 0.35 : 0;
}

export function injuryRiskMod(state: GameState) {
  const train = facilitiesOf(state).training;
  const plan = practiceOf(state);
  let m = 1 - (train - 1) * 0.08;
  if (plan === "hard") m += 0.28;
  if (plan === "rest") m -= 0.22;
  if (plan === "film") m -= 0.08;
  return clamp(m, 0.55, 1.45);
}

export function refreshStaffPool(state: GameState): GameState {
  const staff = staffOf(state);
  const rng = mulberry32(state.seed ^ (state.season * 7919) ^ 0x51a7 ^ hashString(state.playerTeamId));
  const used = new Set(staff.pool.map((c) => c.name.toLowerCase()));
  for (const seat of [staff.oc, staff.dc, staff.rc]) if (seat) used.add(seat.name.toLowerCase());
  const pool = Array.from({ length: 6 }, (_, i) => makeCoach(rng, (["oc", "dc", "rc"] as const)[i % 3]!, prestigeOf(state) - 2, used));
  return { ...state, staff: { ...staff, pool, hiresThisYear: 0 } };
}

export function hireStaff(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const staff = staffOf(state);
  const cand = staff.pool.find((c) => c.id === id);
  if (!cand) return { state, feedback: { title: "Already gone", detail: "Someone else hired him.", parts: [] } };
  if (staff.hiresThisYear >= 1 && !state.settings?.godMode) {
    return { state, feedback: { title: "One hire a year", detail: "You can hire one assistant per year.", parts: [] } };
  }
  const prev = staff[cand.role];
  const next: StaffBoard = {
    ...staff,
    [cand.role]: { ...cand, years: 0 },
    pool: staff.pool.filter((c) => c.id !== id),
    hiresThisYear: staff.hiresThisYear + 1,
  };
  return {
    state: { ...state, staff: next },
    feedback: {
      title: `Hired ${cand.name.split(" ").slice(-1)}`,
      detail: prev
        ? `${prev.name} is out. ${cand.name} takes ${ROLE_LABEL[cand.role].toLowerCase()} · ${cand.specialty}.`
        : `${cand.name} takes ${ROLE_LABEL[cand.role].toLowerCase()} · ${cand.specialty}.`,
      parts: [{ label: ROLE_LABEL[cand.role], delta: cand.rating - (prev?.rating ?? 50) }],
    },
  };
}

export function fireStaff(state: GameState, role: StaffRole): { state: GameState; feedback: Feedback } {
  const staff = staffOf(state);
  const prev = staff[role];
  if (!prev) return { state, feedback: { title: "Already open", detail: "That job is empty.", parts: [] } };
  return {
    state: { ...state, staff: { ...staff, [role]: null } },
    feedback: {
      title: `Let ${prev.name.split(" ").slice(-1)} go`,
      detail: `${ROLE_LABEL[role]} is open. Hire from the pool.`,
      parts: [{ label: ROLE_LABEL[role], delta: -prev.rating }],
    },
  };
}

export function upgradeCost(level: number) {
  return 8 + level * 5;
}

export function upgradeFacility(state: GameState, kind: FacilityKind): { state: GameState; feedback: Feedback } {
  const f = facilitiesOf(state);
  const level = f[kind];
  const label = FACILITY_OPTS.find((x) => x.id === kind)?.label ?? kind;
  if (level >= 5) return { state, feedback: { title: "Maxed", detail: `${label} is already a 5.`, parts: [] } };
  if (state.phase !== "offseason" && state.phase !== "preseason") {
    return { state, feedback: { title: "In season", detail: "Facility upgrades wait until camp or the offseason.", parts: [] } };
  }
  if (f.upgradedThisYear >= 1 && !state.settings?.godMode) {
    return { state, feedback: { title: "One project", detail: "You can upgrade one building a year.", parts: [] } };
  }
  const cost = upgradeCost(level);
  if (state.donorMood < cost) {
    return { state, feedback: { title: "Donors said no", detail: `Need ${cost} donor mood. You have ${state.donorMood}.`, parts: [] } };
  }
  return {
    state: {
      ...state,
      donorMood: clamp(state.donorMood - cost, 0, 100),
      fanMood: clamp(state.fanMood + 2, 0, 100),
      facilities: { ...f, [kind]: level + 1, upgradedThisYear: f.upgradedThisYear + 1 },
    },
    feedback: {
      title: `${label} → ${level + 1}`,
      detail: `Donors moved ${cost}. The building is better.`,
      parts: [{ label, delta: 1 }],
    },
  };
}

function practiceRep(state: GameState, plan: PracticePlan): { state: GameState; who: string } {
  if (plan === "rest" || state.phase === "offseason") return { state, who: "" };
  const tag = `wk ${state.week}`;
  const yours = state.players.filter((p) => p.teamId === state.playerTeamId && !p.redshirt && !(p.injury && p.injury.weeksLeft > 0));
  if (yours.some((p) => (p.growth ?? []).some((g) => g.season === state.season && (g.note ?? "").includes(tag)))) return { state, who: "" };
  const pool = yours
    .filter((p) => p.ovr < 99)
    .sort((a, b) => (b.potential - b.ovr) - (a.potential - a.ovr) || b.mpg - a.mpg);
  const p = pool[0];
  if (!p) return { state, who: "" };
  let key = focusSkill(p, p.focus);
  if (!p.focus || p.focus === "balanced") {
    if (plan === "film") key = "iq";
    else if (plan === "hard") key = "finish";
    else key = "shoot";
  }
  const skills = { ...p.skills, [key]: clamp((p.skills?.[key] ?? p.ovr) + 1, 40, 99) };
  const ovr = composite(skills);
  const note = `+1 ${key} from ${plan} · ${tag}`;
  const next = {
    ...p,
    skills,
    ovr,
    potential: Math.max(p.potential, ovr),
    growth: [...(p.growth ?? []), { season: state.season, ovr, focus: p.focus ?? "balanced", jump: Math.max(1, ovr - p.ovr), note }].slice(-8),
  };
  return {
    who: `${p.first} ${p.last}`,
    state: { ...state, players: state.players.map((x) => (x.id === p.id ? next : x)) },
  };
}

export function setPractice(state: GameState, plan: PracticePlan): { state: GameState; feedback: Feedback } {
  const opt = PRACTICE_OPTS.find((p) => p.id === plan);
  const bumped = practiceRep({ ...state, practice: plan }, plan);
  const who = bumped.who;
  return {
    state: bumped.state,
    feedback: {
      title: opt?.label ?? "Practice",
      detail: who ? `${who} ${plan === "rest" ? "" : `+1 from ${opt?.label ?? plan}.`} ${opt?.hint ?? ""}`.trim() : (opt?.hint ?? ""),
      parts: who ? [{ label: who, delta: 1 }] : [],
    },
  };
}

export function setCaptain(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  const depth = depthOf(state);
  return {
    state: { ...state, depth: { ...depth, captainId: id } },
    feedback: { title: `Captain ${p.last}`, detail: `${p.first} ${p.last} is the captain.`, parts: [] },
  };
}

export function setStarter(state: GameState, pos: Pos, id: string): { state: GameState; feedback: Feedback } {
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (p.pos !== pos) return { state, feedback: { title: "Wrong spot", detail: `${p.last} is a ${p.pos}.`, parts: [] } };
  const depth = depthOf(state);
  return {
    state: { ...state, depth: { ...depth, starters: { ...depth.starters, [pos]: id } } },
    feedback: { title: `Start ${p.last}`, detail: `${p.first} ${p.last} starts at ${p.pos}.`, parts: [] },
  };
}

export function fatigueOf(state: GameState, id: string) {
  return state.fatigue?.[id] ?? 0;
}

export function fatigueMpg(state: GameState, p: Player) {
  if (p.teamId !== state.playerTeamId) return p.mpg;
  const f = fatigueOf(state, p.id);
  if (f <= 52) return p.mpg;
  return Math.max(4, p.mpg * (1 - (f - 52) / 170));
}

export function isStarter(state: GameState, id: string) {
  const d = depthOf(state);
  return Object.values(d.starters).includes(id);
}

export function tickFatigue(state: GameState): GameState {
  const plan = practiceOf(state);
  const you = state.playerTeamId;
  const games = state.schedule.filter(
    (g) => g.week === state.week && g.resultId && !g.declined && (g.homeId === you || g.awayId === you),
  ).length;
  const next: Record<string, number> = { ...(state.fatigue ?? {}) };
  for (const p of state.players) {
    if (p.teamId !== you) continue;
    let f = next[p.id] ?? 18;
    const out = isOut(p);
    if (games && !out) f += p.mpg * 0.28 * Math.min(games, 3);
    if (plan === "hard") f += 8;
    else if (plan === "scrimmage") f += 3;
    else if (plan === "film") f -= 4;
    else f -= 14;
    if (out) f -= 8;
    if (!games) f -= 6;
    next[p.id] = clamp(Math.round(f), 0, 96);
  }
  return { ...state, fatigue: next };
}

export function teamLoad(state: GameState) {
  const kids = state.players.filter((p) => p.teamId === state.playerTeamId && !isOut(p));
  if (!kids.length) return { avg: 0, tired: 0, gassed: [] as Player[] };
  const avg = Math.round(kids.reduce((n, p) => n + fatigueOf(state, p.id), 0) / kids.length);
  const gassed = kids.filter((p) => fatigueOf(state, p.id) >= 68).sort((a, b) => fatigueOf(state, b.id) - fatigueOf(state, a.id));
  return { avg, tired: gassed.length, gassed };
}

export function tickStaffYears(state: GameState): GameState {
  const staff = staffOf(state);
  const bump = (c: StaffCoach | null) => (c ? { ...c, years: c.years + 1, rating: clamp(c.rating + (c.years >= 2 && c.rating < 90 ? 1 : 0), 40, 95) } : c);
  return {
    ...state,
    staff: { ...staff, oc: bump(staff.oc), dc: bump(staff.dc), rc: bump(staff.rc), hiresThisYear: 0 },
    facilities: { ...facilitiesOf(state), upgradedThisYear: 0 },
  };
}

function eventMail(state: GameState, ev: ProgramEvent): GameState {
  return {
    ...state,
    mail: [
      {
        id: ev.id,
        from: TEAM_BY_ID[state.playerTeamId]?.name ?? "School",
        subject: ev.title.toLowerCase(),
        body: ev.body,
        week: state.week,
        read: false,
        tone: ev.kind === "senior" ? "even" as const : "good" as const,
      },
      ...state.mail,
    ].slice(0, 28),
    fanMood: clamp(state.fanMood + (ev.kind === "madness" ? 4 : ev.kind === "senior" ? 3 : 2), 0, 100),
  };
}

export function rematchEvents(state: GameState): ProgramEvent[] {
  const fresh = seedEvents(state);
  const prev = state.events ?? [];
  return fresh.map((ev) => {
    const old = prev.find((p) => p.kind === ev.kind && p.season === ev.season);
    return old ? { ...ev, done: old.done, id: old.id } : ev;
  });
}

export function seedEvents(state: GameState): ProgramEvent[] {
  const school = TEAM_BY_ID[state.playerTeamId];
  const lastHome = state.schedule
    .filter((g) => g.homeId === state.playerTeamId && (g.kind === "conference" || g.kind === "noncon") && !g.declined)
    .sort((a, b) => b.week - a.week)[0];
  const events: ProgramEvent[] = [
    {
      id: `ev-mad-${state.season}`,
      kind: "madness",
      week: 0,
      season: state.season,
      title: "Midnight Madness",
      body: `${school?.name ?? "The program"} opens the year at midnight. The gym will be packed.`,
      done: false,
    },
    {
      id: `ev-media-${state.season}`,
      kind: "media",
      week: 1,
      season: state.season,
      title: "Media day",
      body: "Media day. Local writers, and maybe a national outlet. Don't promise a title unless you mean it.",
      done: false,
    },
  ];
  if (lastHome) {
    events.push({
      id: `ev-senior-${state.season}`,
      kind: "senior",
      week: lastHome.week,
      season: state.season,
      title: "Senior night",
      body: "Seniors are honored before tip. Play them.",
      done: false,
    });
  }
  const you = state.playerTeamId;
  const rivalGame = state.schedule
    .filter((g) => !g.declined && (g.homeId === you || g.awayId === you) && rivalryForSlot(g))
    .sort((a, b) => a.week - b.week)[0];
  if (rivalGame) {
    const trophy = rivalryForSlot(rivalGame)?.trophy ?? "Rivalry night";
    events.push({
      id: `ev-rival-${state.season}`,
      kind: "rivalry",
      week: rivalGame.week,
      season: state.season,
      title: trophy,
      body: `${trophy} week. Expect a big crowd. Stick to the game plan.`,
      done: false,
    });
  }
  return events;
}

export function tickEvents(state: GameState): GameState {
  const live = (state.events?.length ? state.events : seedEvents(state)).map((e) => ({ ...e }));
  let s: GameState = { ...state, events: live };
  for (const ev of live) {
    if (ev.done || ev.season !== s.season) continue;
    const onWeek = ev.week === s.week || (ev.kind === "media" && s.phase !== "preseason" && s.week >= 1 && ev.week <= s.week);
    if (!onWeek && !(ev.week === 0 && s.phase === "preseason" && s.week === 0)) continue;
    if (s.phase === "preseason" && ev.kind !== "madness") continue;
    if (s.phase !== "preseason" && ev.kind === "madness") continue;
    ev.done = true;
    s = eventMail(s, ev);
    if (ev.kind === "senior") {
      const seniors = s.players.filter((p) => p.teamId === s.playerTeamId && p.year >= 4);
      s = {
        ...s,
        players: s.players.map((p) => (seniors.some((x) => x.id === p.id) ? { ...p, morale: clamp(p.morale + 4, 20, 99) } : p)),
      };
    }
    if (ev.kind === "madness") {
      s = {
        ...s,
        players: s.players.map((p) => (p.teamId === s.playerTeamId ? { ...p, morale: clamp(p.morale + 2, 20, 99) } : p)),
      };
    }
  }
  return s;
}

export function reseatProgram(state: GameState, teamId: string): GameState {
  const prestige = state.teams[teamId]?.prestige ?? TEAM_BY_ID[teamId]?.prestige ?? 70;
  return {
    ...state,
    staff: seedStaff(state.seed ^ hashString(teamId) ^ state.season, prestige),
    facilities: seedFacilities(prestige),
    practice: "scrimmage",
    depth: { starters: {}, captainId: null },
    fatigue: {},
    scouted: null,
    events: [],
  };
}

export function ensureProgram(state: GameState): GameState {
  const prestige = prestigeOf(state);
  return {
    ...state,
    staff: state.staff ?? seedStaff(state.seed, prestige),
    facilities: state.facilities ?? seedFacilities(prestige),
    practice: state.practice ?? "scrimmage",
    depth: state.depth ?? { starters: {}, captainId: null },
    fatigue: state.fatigue ?? {},
    scouted: state.scouted ?? null,
    events: state.events ?? [],
  };
}

export function tickProgramWeek(state: GameState): GameState {
  let s = ensureProgram(state);
  s = tickFatigue(s);
  s = tickEvents(s);
  return s;
}

export function tickProgramYear(state: GameState): GameState {
  let s = ensureProgram(state);
  s = tickStaffYears(s);
  s = refreshStaffPool(s);
  s = { ...s, practice: "scrimmage", fatigue: {}, scouted: null, events: [] };
  return s;
}

export function upcomingEvents(state: GameState) {
  const list = (state.events?.length ? state.events : seedEvents(state)).filter((e) => e.season === state.season);
  return list.slice().sort((a, b) => a.week - b.week);
}

export function practiceLine(plan: PracticePlan) {
  return PRACTICE_OPTS.find((p) => p.id === plan)?.hint ?? "";
}

export function facilityStars(n: number) {
  return `${"●".repeat(n)}${"○".repeat(Math.max(0, 5 - n))}`;
}

export function injuredOf(state: GameState): Player[] {
  return state.players.filter((p) => p.teamId === state.playerTeamId && p.injury && p.injury.weeksLeft > 0);
}

export function captainOf(state: GameState): Player | null {
  const id = depthOf(state).captainId;
  if (!id) return null;
  return state.players.find((p) => p.id === id) ?? null;
}
