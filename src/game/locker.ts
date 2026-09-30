import type { Feedback, GameState, Player, PlayerPromise, PromiseKind } from "./types";
import { clamp } from "./rng";
import { bustChemCache } from "./chemistry";

export const PROMISE_OPTS: { kind: PromiseKind; label: string; needNil?: boolean }[] = [
  { kind: "minutes", label: "Promise minutes" },
  { kind: "start", label: "Promise a start" },
  { kind: "develop", label: "Promise development" },
  { kind: "nil", label: "Promise NIL", needNil: true },
];

export function livePromises(state: GameState, playerId?: string) {
  const all = state.promises ?? [];
  return all.filter((p) => p.kept == null && p.season === state.season && (!playerId || p.playerId === playerId));
}

function targetOf(kind: PromiseKind, p: Player, nilCap: number) {
  if (kind === "minutes") return clamp(Math.max(p.mpg + 4, 22), 18, 34);
  if (kind === "start") return 5;
  if (kind === "nil") return clamp(Math.round(nilCap * 0.18 + p.ovr * 0.4), 8, 80);
  return 1;
}

function lineOf(kind: PromiseKind, p: Player, target: number) {
  if (kind === "minutes") return `${p.first} hears ${target} a night.`;
  if (kind === "start") return `${p.first} hears his name in the starting five.`;
  if (kind === "nil") return `${p.first} hears a number.`;
  return `${p.first} wants work in the gym.`;
}

export function makePromise(state: GameState, id: string, kind: PromiseKind): { state: GameState; feedback: Feedback } {
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (kind === "nil" && state.nilCap <= 0) {
    return { state, feedback: { title: "No NIL", detail: "This era doesn't write those checks.", parts: [] } };
  }
  const live = livePromises(state, id);
  if (live.some((x) => x.kind === kind)) {
    return { state, feedback: { title: "Already promised", detail: `${p.first} already has that promise.`, parts: [] } };
  }
  if (live.length >= 2) {
    return { state, feedback: { title: "Two is the cap", detail: "Keep the ones you already made.", parts: [] } };
  }
  const target = targetOf(kind, p, state.nilCap);
  const row: PlayerPromise = {
    id: `pr-${id}-${kind}-${state.season}`,
    playerId: id,
    kind,
    target,
    season: state.season,
    text: lineOf(kind, p, target),
    kept: null,
  };
  const bump = 5 + Math.round(((state.coachSkills?.leadership ?? 50) - 50) / 12);
  bustChemCache();
  return {
    state: {
      ...state,
      promises: [...(state.promises ?? []), row].slice(-40),
      players: state.players.map((x) => (x.id === id ? { ...x, morale: clamp(x.morale + bump, 20, 99) } : x)),
    },
    feedback: {
      title: `Promise to ${p.first}`,
      detail: row.text,
      parts: [{ label: "Confidence", delta: bump }],
    },
  };
}

function starters(state: GameState) {
  return state.players
    .filter((p) => p.teamId === state.playerTeamId && !p.redshirt && !(p.injury && p.injury.weeksLeft > 0))
    .slice()
    .sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr)
    .slice(0, 5)
    .map((p) => p.id);
}

function holding(state: GameState, row: PlayerPromise, p: Player) {
  if (row.kind === "minutes") return p.mpg + 1 >= row.target || (p.seasonMinutes || 0) / Math.max(1, p.seasonGames) >= row.target - 2;
  if (row.kind === "start") return starters(state).includes(p.id);
  if (row.kind === "nil") return state.nilCap >= row.target;
  if (row.kind === "develop") return (p.focus && p.focus !== "balanced") || (state.camp?.spent[p.id] ?? 0) > 0 || (p.growth?.some((g) => g.season === state.season && g.jump > 0) ?? false);
  return true;
}

export function tickPromises(state: GameState): GameState {
  const rows = state.promises ?? [];
  if (!rows.length) return state;
  const live = rows.filter((r) => r.kept == null && r.season === state.season);
  if (!live.length) return state;
  let players = state.players;
  let news = state.news;
  const nextRows = rows.map((row) => {
    if (row.kept != null || row.season !== state.season) return row;
    const p = players.find((x) => x.id === row.playerId);
    if (!p || p.teamId !== state.playerTeamId) return { ...row, kept: false };
    if (state.week < 4) return row;
    if (holding(state, row, p)) return row;
    if (state.week < 8) {
      players = players.map((x) => (x.id === p.id ? { ...x, morale: clamp(x.morale - 2, 20, 99) } : x));
      return row;
    }
    players = players.map((x) => (x.id === p.id ? { ...x, morale: clamp(x.morale - 10, 20, 99) } : x));
    news = [
      {
        id: `broke-${row.id}-${state.week}`,
        week: state.week,
        season: state.season,
        tone: "bad" as const,
        kicker: "Locker",
        headline: `${p.first} ${p.last} heard a broken promise`,
        dek: row.text,
        byline: "Locker room",
        outlet: "The News",
        grafs: [`${p.first} was promised something the staff didn't keep. He hasn't said anything publicly.`],
        text: row.text,
      },
      ...news,
    ].slice(0, 60);
    return { ...row, kept: false };
  });
  bustChemCache();
  return { ...state, players, news, promises: nextRows };
}

export function gradePromises(state: GameState): GameState {
  const rows = state.promises ?? [];
  if (!rows.length) return state;
  let players = state.players;
  const graded = rows.map((row) => {
    if (row.kept != null || row.season !== state.season) return row;
    const p = players.find((x) => x.id === row.playerId);
    if (!p) return { ...row, kept: false };
    const ok = holding(state, row, p);
    if (ok) players = players.map((x) => (x.id === p.id ? { ...x, morale: clamp(x.morale + 4, 20, 99) } : x));
    else players = players.map((x) => (x.id === p.id ? { ...x, morale: clamp(x.morale - 12, 20, 99) } : x));
    return { ...row, kept: ok };
  });
  bustChemCache();
  return { ...state, players, promises: graded };
}

export function promiseLine(state: GameState) {
  const rows = (state.promises ?? []).filter((p) => p.season === state.season);
  if (!rows.length) return "No promises made.";
  const kept = rows.filter((r) => r.kept === true).length;
  const broke = rows.filter((r) => r.kept === false).length;
  const live = rows.filter((r) => r.kept == null).length;
  if (live) return `${live} live promise${live === 1 ? "" : "s"}. The locker room is counting.`;
  if (broke) return `${kept} kept · ${broke} broken.`;
  return `${kept} kept. The locker room remembers.`;
}

const TALK_CAP = 3;

export function talksLeft(state: GameState) {
  return Math.max(0, TALK_CAP - (state.talksThisWeek ?? 0));
}

export function holdAccountable(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (talksLeft(state) <= 0) {
    return { state, feedback: { title: "Three talks", detail: "The locker room heard you enough this week.", parts: [] } };
  }
  const rot = state.players
    .filter((x) => x.teamId === state.playerTeamId && !x.redshirt)
    .slice()
    .sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr);
  const star = rot[0];
  const isStar = star?.id === id;
  bustChemCache();
  const players = state.players.map((x) => {
    if (x.teamId !== state.playerTeamId) return x;
    if (x.id === id) return { ...x, morale: clamp(x.morale + (isStar ? -6 : -4), 20, 99) };
    if (isStar) return { ...x, morale: clamp(x.morale + 1, 20, 99) };
    if (star && x.id === star.id) return { ...x, morale: clamp(x.morale + 2, 20, 99) };
    return x;
  });
  return {
    state: { ...state, players, talksThisWeek: (state.talksThisWeek ?? 0) + 1, adHeat: clamp((state.adHeat ?? 55) + 1, 10, 99) },
    feedback: {
      title: isStar ? `Held ${p.first}` : `Called ${p.first} up`,
      detail: isStar
        ? "The engine got the message. The rest of the locker room sat up."
        : "Film doesn't lie. Minutes stay earned.",
      parts: [{ label: "Confidence", delta: isStar ? -6 : -4 }, { label: "AD", delta: 1 }],
    },
  };
}

export function pepTalk(state: GameState, id: string): { state: GameState; feedback: Feedback } {
  const p = state.players.find((x) => x.id === id && x.teamId === state.playerTeamId);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (talksLeft(state) <= 0) {
    return { state, feedback: { title: "Three talks", detail: "The locker room heard you enough this week.", parts: [] } };
  }
  const lead = state.coachSkills?.leadership ?? 50;
  const bump = clamp(3 + Math.round((lead - 50) / 10), 1, 8);
  bustChemCache();
  return {
    state: {
      ...state,
      talksThisWeek: (state.talksThisWeek ?? 0) + 1,
      players: state.players.map((x) => (x.id === id ? { ...x, morale: clamp(x.morale + bump, 20, 99) } : x)),
    },
    feedback: {
      title: `Talked to ${p.first}`,
      detail: "A short one. The film still matters more.",
      parts: [{ label: "Confidence", delta: bump }],
    },
  };
}
