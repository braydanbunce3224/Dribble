import type { CampJump, CampState, DevFocus, GameState, NewsArticle, Player, PlayerSkills } from "./types";
import { clamp, mulberry32, type Rng } from "./rng";
import { TEAM_BY_ID } from "./teams";

export const FOCUS_OPTS: { id: DevFocus; label: string; hint: string }[] = [
  { id: "balanced", label: "Balanced", hint: "Fill the weakest skill" },
  { id: "shoot", label: "Shoot", hint: "Catch-and-shoot, pull-up" },
  { id: "finish", label: "Finish", hint: "Paint, and-ones, the drop step" },
  { id: "defense", label: "Defense", hint: "On-ball, help, the glass" },
  { id: "iq", label: "IQ", hint: "Reads, the extra pass" },
];

export function focusLabel(id: DevFocus | undefined) {
  return FOCUS_OPTS.find((f) => f.id === id)?.label ?? "Balanced";
}

function lagSkill(p: Player): keyof PlayerSkills {
  const cap = Math.max(p.potential, p.ovr);
  return (["shoot", "finish", "defense", "iq"] as const)
    .map((k) => ({ k, gap: cap - p.skills[k] }))
    .sort((a, b) => b.gap - a.gap)[0]!.k;
}

export function focusSkill(p: Player, focus?: DevFocus): keyof PlayerSkills {
  if (!focus || focus === "balanced") return lagSkill(p);
  return focus;
}

export function composite(s: PlayerSkills) {
  return clamp(Math.round(s.shoot * 0.28 + s.finish * 0.24 + s.defense * 0.28 + s.iq * 0.2), 40, 99);
}

function bump(s: PlayerSkills, key: keyof PlayerSkills, n: number, cap: number): PlayerSkills {
  return { ...s, [key]: clamp(s[key] + n, 40, cap) };
}

export function emptyCamp(season: number): CampState {
  return { season, points: 0, spent: {}, focuses: {}, locked: true, jumps: [] };
}

export function campOf(state: GameState): CampState {
  return state.camp ?? emptyCamp(state.season);
}

export function campWaiting(state: GameState) {
  return state.phase === "offseason" && Boolean(state.camp) && !state.camp!.locked;
}

function campBudget(state: GameState) {
  const you = state.teams[state.playerTeamId];
  const dev = state.coachSkills?.development ?? 46;
  const year = state.history.log[state.history.log.length - 1];
  let n = 5 + Math.floor((dev - 40) / 10);
  if ((you?.wins ?? 0) > (you?.losses ?? 0)) n += 2;
  if (year?.confTitle) n += 1;
  if (year?.title) n += 2;
  return clamp(n, 4, 14);
}

export function openCamp(state: GameState): GameState {
  if (state.camp && state.camp.season === state.season && !state.camp.locked) return state;
  const you = state.playerTeamId;
  const focuses: Record<string, DevFocus> = {};
  for (const p of state.players) {
    if (p.teamId !== you) continue;
    focuses[p.id] = p.focus ?? "balanced";
  }
  return {
    ...state,
    camp: {
      season: state.season,
      points: campBudget(state),
      spent: {},
      focuses,
      locked: false,
      jumps: [],
    },
  };
}

export function setFocus(state: GameState, id: string, focus: DevFocus): GameState {
  const p = state.players.find((x) => x.id === id);
  if (!p || p.teamId !== state.playerTeamId) return state;
  const camp = campOf(state);
  const players = state.players.map((x) => (x.id === id ? { ...x, focus } : x));
  if (state.phase === "offseason" && camp && !camp.locked) {
    return { ...state, players, camp: { ...camp, focuses: { ...camp.focuses, [id]: focus } } };
  }
  return { ...state, players };
}

export function spendCamp(state: GameState, id: string, d: number): { state: GameState; ok: boolean; detail: string } {
  const camp = state.camp;
  if (!camp || camp.locked) return { state, ok: false, detail: "Camp is closed." };
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, ok: false, detail: "He's not in camp." };
  const cur = camp.spent[id] ?? 0;
  const next = clamp(cur + d, 0, 3);
  const cost = next - cur;
  if (cost > camp.points) return { state, ok: false, detail: "No points left." };
  if (next === cur) return { state, ok: false, detail: d > 0 ? "Three points is the cap on one guy." : "Nothing to pull back." };
  return {
    ok: true,
    detail: `${p.first} is on ${next} point${next === 1 ? "" : "s"}.`,
    state: {
      ...state,
      camp: {
        ...camp,
        points: camp.points - cost,
        spent: { ...camp.spent, [id]: next },
      },
    },
  };
}

function gymGain(p: Player, dev: number, rng: Rng): number {
  const gap = Math.max(0, 99 - p.ovr);
  if (gap <= 0) return rng() < 0.06 ? -1 : 0;
  const minutes = p.seasonMinutes || p.mpg * 26;
  const chance = 0.32 + minutes / 900 + (dev - 46) / 160 + (p.morale - 60) / 300;
  if (rng() > chance) return 0;
  return rng() < 0.22 && gap > 4 ? 2 : 1;
}

function applyPoints(p: Player, n: number, focus: DevFocus, rng: Rng): Player {
  if (n <= 0) return p;
  let skills = { ...p.skills };
  let potential = p.potential;
  for (let i = 0; i < n; i++) {
    const key = focusSkill({ ...p, skills, potential, focus }, focus);
    const cap = 99;
    skills = bump(skills, key, 1, cap);
    const ovr = composite(skills);
    if (ovr >= potential) potential = clamp(potential + 1, ovr, 99);
  }
  const ovr = composite(skills);
  return { ...p, skills, ovr, potential: Math.max(potential, ovr), focus };
}

function recordGrowth(p: Player, before: number, season: number, focus: DevFocus): Player {
  const jump = p.ovr - before;
  const row = { season, ovr: p.ovr, focus, jump };
  const growth = [...(p.growth ?? []).filter((g) => g.season !== season), row].slice(-12);
  return { ...p, growth };
}

export function lockCamp(state: GameState, rng?: Rng): GameState {
  const camp = state.camp;
  if (camp && camp.locked && camp.season === state.season && camp.jumps.length) return state;
  const r = rng ?? mulberry32(state.seed ^ (state.season * 104729) ^ 0xc4);
  const you = state.playerTeamId;
  const devYou = state.coachSkills?.development ?? 46;
  const spent = { ...(camp?.spent ?? {}) };
  let points = camp?.points ?? 0;
  if (!camp?.locked) {
    const yours = state.players
      .filter((p) => p.teamId === you)
      .slice()
      .sort((a, b) => (b.potential - b.ovr) - (a.potential - a.ovr) || b.ovr - a.ovr);
    for (const p of yours) {
      if (points <= 0) break;
      const have = spent[p.id] ?? 0;
      if (have >= 3) continue;
      if (p.potential - p.ovr < 1 && p.ovr >= 88) continue;
      const add = Math.min(points, 3 - have, p.potential - p.ovr >= 4 ? 2 : 1);
      if (add <= 0) continue;
      spent[p.id] = have + add;
      points -= add;
    }
  }

  const jumps: CampJump[] = [];
  const players = state.players.map((p) => {
    const before = p.ovr;
    const staff = p.teamId === you ? devYou : 46;
    const g = gymGain(p, staff, r);
    const key = focusSkill(p, camp?.focuses[p.id] ?? p.focus);
    let skills = p.skills;
    if (g) skills = bump(skills, g < 0 ? "finish" : key, g, 99);
    let next: Player = { ...p, skills, ovr: composite(skills), focus: camp?.focuses[p.id] ?? p.focus ?? "balanced" };
    const extra = p.teamId === you ? (spent[p.id] ?? 0) : (p.potential - p.ovr >= 3 && r() < 0.35 ? 1 : 0);
    next = applyPoints(next, extra, next.focus ?? "balanced", r);
    next = recordGrowth(next, before, state.season, next.focus ?? "balanced");
    if (p.teamId === you && next.ovr !== before) {
      jumps.push({ id: p.id, name: `${p.first} ${p.last}`, before, after: next.ovr, skill: key });
    }
    return next;
  });
  jumps.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before));

  const report = {
    ...(state.offseasonReport ?? { grew: [], graduated: [], incoming: [], walkons: [], pointsEarned: 0 }),
    grew: jumps.slice(0, 12).map((j) => ({ id: j.id, name: j.name, before: j.before, after: j.after })),
  };

  const school = TEAM_BY_ID[you]?.name ?? "Camp";
  return {
    ...state,
    players,
    offseasonReport: report,
    camp: {
      season: state.season,
      points,
      spent,
      focuses: camp?.focuses ?? {},
      locked: true,
      jumps: jumps.slice(0, 16),
    },
    news: [
      {
        id: `camp-${state.season}`,
        week: state.week,
        season: state.season,
        tone: (jumps.some((j) => j.after - j.before >= 2) ? "good" : "even") as NewsArticle["tone"],
        kicker: "Camp",
        headline: `${school} closed camp`,
        dek: jumps[0] ? `${jumps[0].name} ${jumps[0].before} → ${jumps[0].after}.` : "The gym work was quiet.",
        byline: "Camp notebook",
        outlet: "The News",
        grafs: [
          jumps[0]
            ? `${jumps[0].name} took the biggest jump. Redshirt calls come after you've seen the film.`
            : "Nobody leapt. Minutes and morale still feed the next one.",
        ],
        text: jumps[0] ? `${jumps[0].name} ${jumps[0].before} → ${jumps[0].after}.` : "No jumps in camp.",
      },
      ...state.news,
    ].slice(0, 60),
  };
}

export function lastJump(p: Player) {
  const g = p.growth?.[p.growth.length - 1];
  return g?.jump ?? 0;
}
