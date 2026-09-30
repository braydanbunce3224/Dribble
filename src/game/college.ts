import type {
  DraftPick, DraftRow, GameSlot, GameState, Injury, Mail, Player, Recruit,
} from "./types";
import { TEAM_BY_ID } from "./teams";
import { clamp, hashString, mulberry32, pick, type Rng } from "./rng";
import { brief } from "./wire";
import { coachFirst, trainerFirst, trainerFrom } from "./voices";
import { injuryRiskMod, trainingHealBonus } from "./program";

const PARTS = ["ankle", "knee", "hamstring", "groin", "shoulder", "wrist", "foot", "back"] as const;

export function isOut(p: Player): boolean {
  return Boolean(p.redshirt) || (p.injury != null && p.injury.weeksLeft > 0);
}

export function effectiveMpg(p: Player): number {
  if (isOut(p)) return 0;
  return p.mpg;
}

export function classLabel(p: Player): string {
  const names = ["", "Fr", "So", "Jr", "Sr"];
  const base = names[p.year] ?? `Yr ${p.year}`;
  if (p.redshirt) return "RS";
  const rs = p.usedRedshirt ? "R-" : "";
  if (p.path === "juco") return `${rs}${base} · JUCO`;
  return `${rs}${base}`;
}

export function recruitPathLabel(r: Recruit): string {
  return r.path === "juco" ? "JUCO" : "HS";
}

export function recruitClassRank(a: Recruit, b: Recruit): number {
  return b.stars - a.stars || b.ovr - a.ovr || (b.potential ?? 0) - (a.potential ?? 0) || a.last.localeCompare(b.last);
}

export function nationalBoard(state: GameState, n = 100): Recruit[] {
  return state.recruits.filter((r) => r.path !== "juco").sort(recruitClassRank).slice(0, n);
}

export function playedThisSeason(state: GameState, p: Player): boolean {
  if ((p.seasonGames ?? 0) >= 1 || (p.seasonMinutes ?? 0) > 0) return true;
  const live = state.liveGame;
  if (!live || live.done) return false;
  if (live.homeId !== p.teamId && live.awayId !== p.teamId) return false;
  const lines = live.homeId === p.teamId ? live.homeLines : live.awayLines;
  return Boolean(lines?.some((l) => l.id === p.id && (l.min ?? 0) > 0));
}

export function canRedshirt(state: GameState, p: Player): boolean {
  if (p.usedRedshirt || p.redshirt) return false;
  if (p.year > 3) return false;
  if (p.teamId !== state.playerTeamId) return false;
  if (state.phase === "offseason") return Boolean(state.camp?.locked);
  if (playedThisSeason(state, p)) return false;
  return true;
}

export function setRedshirt(state: GameState, id: string, on: boolean): { state: GameState; feedback: { title: string; detail: string; parts: { label: string; delta: number }[] } } {
  const p = state.players.find((x) => x.id === id);
  if (!p) return { state, feedback: { title: "Gone", detail: "", parts: [] } };
  if (on && !canRedshirt(state, p) && !p.redshirt) {
    const detail = p.usedRedshirt
      ? "He already sat a year."
      : p.year > 3
        ? "Seniors stay eligible."
        : playedThisSeason(state, p)
          ? "He already played. You can't redshirt him now."
          : "Can't redshirt him.";
    return { state, feedback: { title: "Can't redshirt", detail, parts: [] } };
  }
  return {
    state: {
      ...state,
      players: state.players.map((x) => (x.id === id ? { ...x, redshirt: on } : x)),
    },
    feedback: {
      title: on ? `Redshirt ${p.first}` : `${p.first} is active`,
      detail: on ? "He sits this year. Eligibility stays." : "He's back in the rotation.",
      parts: [],
    },
  };
}

export function availableRoster(state: GameState, teamId: string): Player[] {
  return state.players
    .filter((p) => p.teamId === teamId && !isOut(p))
    .sort((a, b) => b.ovr - a.ovr || effectiveMpg(b) - effectiveMpg(a));
}

function injure(p: Player, rng: Rng): Injury {
  const long = rng() < 0.08;
  const weeksLeft = long ? 5 + Math.floor(rng() * 4) : 1 + Math.floor(rng() * 3);
  return { part: pick(rng, [...PARTS]), weeksLeft };
}

export function rollGameInjuries(state: GameState, slot: GameSlot, rng: Rng): GameState {
  const you = state.playerTeamId;
  const sides = [slot.homeId, slot.awayId];
  let players = state.players;
  let news = state.news;
  let mail = state.mail;
  for (const teamId of sides) {
    const rot = players.filter((p) => p.teamId === teamId && !isOut(p) && p.mpg >= 8);
    for (const p of rot) {
      const chance = (0.012 + p.mpg / 1400 + (p.year === 1 ? 0.004 : 0)) * (teamId === you ? injuryRiskMod(state) : 1);
      if (rng() > chance) continue;
      const injury = injure(p, rng);
      players = players.map((x) => (x.id === p.id ? { ...x, injury, morale: clamp(x.morale - 6, 20, 99) } : x));
      if (teamId !== you) continue;
      const name = `${p.first} ${p.last}`;
      news = [
        brief(
          state.week,
          `${name} to the locker room`,
          [
            `${name} left with ${injury.part === "ankle" || injury.part === "knee" || injury.part === "foot" ? `a ${injury.part}` : `his ${injury.part}`}.`,
            injury.weeksLeft >= 5
              ? "That's a hole. Somebody's minutes just doubled."
              : "He'll miss time. Next man up.",
          ],
          "bad",
          "Trainer",
        ),
        ...news,
      ].slice(0, 60);
      if (p.ovr >= 78 || p.mpg >= 26) {
        mail = [
          {
            id: `inj-${p.id}-${state.week}`,
            from: trainerFrom(state),
            subject: `${p.first} — ${injury.part}`,
            body: `${coachFirst(state)},\n\n${name} is out about ${injury.weeksLeft} week${injury.weeksLeft === 1 ? "" : "s"}. Don't play him until I clear him.\n\n${trainerFirst(state)}`,
            week: state.week,
            read: false,
            tone: "bad",
          } satisfies Mail,
          ...mail,
        ].slice(0, 40);
      }
    }
  }
  return { ...state, players, news, mail };
}

export function tickInjuries(state: GameState): GameState {
  const you = state.playerTeamId;
  let news = state.news;
  const players = state.players.map((p) => {
    if (!p.injury || p.injury.weeksLeft <= 0) return p.injury ? { ...p, injury: null } : p;
    const extra = p.teamId === you ? (trainingHealBonus(state) >= 1 && p.injury.weeksLeft <= 2 ? 1 : trainingHealBonus(state) >= 0.35 && p.injury.weeksLeft === 1 ? 1 : 0) : 0;
    const weeksLeft = p.injury.weeksLeft - 1 - extra;
    if (weeksLeft > 0) return { ...p, injury: { ...p.injury, weeksLeft } };
    if (p.teamId === you) {
      news = [
        brief(
          state.week,
          `${p.first} ${p.last} is cleared`,
          [`The ${p.injury.part} is behind him. He's available. Minutes are still yours to give.`],
          "good",
          "Trainer",
        ),
        ...news,
      ].slice(0, 60);
    }
    return { ...p, injury: null, morale: clamp(p.morale + 3, 20, 99) };
  });
  return { ...state, players, news };
}

export function draftScore(p: Player): number {
  const min = p.seasonMinutes || p.mpg * Math.max(1, p.seasonGames);
  const usage = p.usage ?? p.mpg * 2.15;
  const jump = p.growth?.reduce((n, g) => n + Math.max(0, g.jump), 0) ?? 0;
  const pos = p.pos === "C" || p.pos === "PG" ? 1.5 : 0;
  const fresh = p.year === 1 ? 1 : 0;
  return p.ovr + (p.potential - p.ovr) * 0.22 + Math.min(6, min / 90) + usage * 0.06 + jump * 1.4 + pos + fresh;
}

export function draftBand(p: Player): DraftRow["band"] {
  const s = draftScore(p);
  if (p.ovr >= 87 || s >= 90) return "lottery";
  if (p.ovr >= 83 || s >= 84.5) return "first";
  return "second";
}

export function bandLabel(band: DraftRow["band"]): string {
  if (band === "lottery") return "Lottery";
  if (band === "first") return "First round";
  return "Second round";
}

function stayChanceOf(state: GameState, p: Player): number {
  const band = draftBand(p);
  const dev = state.coachSkills?.development ?? 46;
  const lead = state.coachSkills?.leadership ?? 50;
  const titles = state.history?.titles ?? 0;
  const last = p.growth?.[p.growth.length - 1];
  const jump = last?.season === state.season ? last.jump : last?.jump ?? 0;
  const track = (state.offseasonReport?.grew?.length ?? 0) + (state.camp?.jumps?.length ?? 0);
  let n = 42 + (dev - 46) * 0.4 + (lead - 50) * 0.25 + (p.morale - 60) * 0.2 + Math.max(0, p.mpg - 16) * 0.4;
  n += jump * 4 + Math.min(8, track);
  n += Math.min(6, (p.seasonMinutes || 0) / 120);
  if ((state.camp?.spent[p.id] ?? 0) >= 2) n += 4;
  if (band === "lottery") n = 18 + (dev - 46) * 0.2 + (p.morale - 68) * 0.2 + titles * 5 + jump * 3 + Math.min(6, track);
  if (band === "second") n += 18;
  if (p.mpg < 16) n -= 12;
  if (p.year === 1 && band !== "lottery") n += 10;
  if (p.year >= 3 && band !== "lottery") n -= 6;
  if (p.focus && p.focus !== "balanced") n += 3;
  return clamp(Math.round(n), 10, 88);
}

function considering(p: Player, rng: Rng): boolean {
  if (p.year >= 4 || p.redshirt) return false;
  if (p.mpg < 12 && (p.seasonMinutes || 0) < 200) return false;
  const s = draftScore(p);
  if (s >= 90 || p.ovr >= 87) return p.mpg >= 20 || rng() < 0.6;
  if (s >= 84 || (p.ovr >= 83 && p.year >= 2)) return rng() < 0.45;
  if (s >= 81 && p.year >= 3) return rng() < 0.28;
  if (p.potential >= 90 && p.ovr >= 80 && p.year >= 2) return rng() < 0.22;
  return false;
}

function pickFor(band: DraftRow["band"], used: Set<number>, rng: Rng): { round: 1 | 2; pick: number } {
  const slot = (lo: number, hi: number) => {
    let n = lo + Math.floor(rng() * (hi - lo + 1));
    while (used.has(n) && n < 60) n++;
    used.add(n);
    return n;
  };
  if (band === "lottery") {
    const pickN = slot(1, 14);
    return { round: 1, pick: pickN };
  }
  if (band === "first") {
    const pickN = slot(15, 30);
    return { round: 1, pick: pickN };
  }
  const pickN = slot(31, 60);
  return { round: 2, pick: pickN };
}

function toPick(p: Player, teamId: string, band: DraftRow["band"], used: Set<number>, rng: Rng): DraftPick {
  const slot = pickFor(band, used, rng);
  return {
    playerId: p.id,
    name: `${p.first} ${p.last}`,
    pos: p.pos,
    ovr: p.ovr,
    teamId,
    round: slot.round,
    pick: slot.pick,
    yours: teamId === undefined ? false : false,
  };
}

export function openDraft(state: GameState): GameState {
  if (state.draft && state.draft.season === state.season) return state;
  const rng = mulberry32(state.seed ^ (state.season * 224737) ^ 0xd17);
  const used = new Set<number>();
  const league: DraftPick[] = [];
  const rows: DraftRow[] = [];
  const gone = new Set<string>();
  const you = state.playerTeamId;

  const MAX_DECLARE_PER_TEAM = 3;
  const DRAFT_MIN_KEEP = 9;
  const rosterLeft = new Map<string, number>();
  const declaredFrom = new Map<string, number>();
  for (const p of state.players) {
    rosterLeft.set(p.teamId, (rosterLeft.get(p.teamId) ?? 0) + 1);
  }
  const order = [...state.players].sort((a, b) => draftScore(b) - draftScore(a));

  for (const p of order) {
    if (!considering(p, rng)) continue;
    const band = draftBand(p);
    if (p.teamId === you) {
      rows.push({
        playerId: p.id,
        name: `${p.first} ${p.last}`,
        pos: p.pos,
        year: p.year,
        ovr: p.ovr,
        potential: p.potential,
        mpg: p.mpg,
        band,
        stayChance: stayChanceOf(state, p),
        talked: false,
      });
      continue;
    }
    const stay = stayChanceOf(state, p);
    const stays = rng() * 100 < stay && band !== "lottery";
    if (stays) continue;
    const left = rosterLeft.get(p.teamId) ?? 0;
    const already = declaredFrom.get(p.teamId) ?? 0;
    if (already >= MAX_DECLARE_PER_TEAM || left - 1 < DRAFT_MIN_KEEP) continue;
    declaredFrom.set(p.teamId, already + 1);
    rosterLeft.set(p.teamId, left - 1);
    gone.add(p.id);
    league.push({ ...toPick(p, p.teamId, band, used, rng), yours: false });
  }
  league.sort((a, b) => a.pick - b.pick || a.round - b.round);

  const players = state.players.filter((p) => !gone.has(p.id));
  const resolved = rows.length === 0;
  let news = state.news;
  if (league[0]) {
    const school = TEAM_BY_ID[league[0].teamId]?.name ?? "a mid-major";
    news = [
      brief(
        state.week,
        `${league[0].name} is gone`,
        [
          `${league[0].name} out of ${school} is a ${league[0].round === 1 ? "first-round" : "second-round"} name. The stay-or-go window is open.`,
          rows.length
            ? "Your own guys have a decision. Talk to them or let them walk."
            : "Nobody in your locker room has a decision to make.",
        ],
        "even",
        "Draft",
      ),
      ...news,
    ].slice(0, 60);
  } else if (rows.length) {
    news = [
      brief(
        state.week,
        "Stay or go",
        ["An underclassman on your roster has a decision. The league is watching the podium."],
        "even",
        "Draft",
      ),
      ...news,
    ].slice(0, 60);
  }

  return {
    ...state,
    players,
    news,
    draft: { season: state.season, rows, league, stayed: [], resolved },
  };
}

function finishIfDone(state: GameState): GameState {
  const d = state.draft;
  if (!d) return state;
  if (d.rows.some((r) => !r.decided)) return { ...state, draft: { ...d, resolved: false } };
  return { ...state, draft: { ...d, resolved: true } };
}

function applyGo(state: GameState, row: DraftRow): GameState {
  const d = state.draft;
  if (!d) return state;
  const rng = mulberry32(state.seed ^ hashString(row.playerId) ^ 0x90);
  const used = new Set(d.league.map((p) => p.pick));
  const p = state.players.find((x) => x.id === row.playerId);
  const pickN = toPick(
    p ?? {
      id: row.playerId,
      first: row.name.split(" ")[0] ?? row.name,
      last: row.name.split(" ").slice(1).join(" ") || row.name,
      pos: row.pos,
      ovr: row.ovr,
      year: row.year,
      potential: row.potential,
      mpg: row.mpg,
      morale: 70,
      teamId: state.playerTeamId,
      skills: { shoot: row.ovr, finish: row.ovr, defense: row.ovr, iq: row.ovr },
      seasonMinutes: 0,
      seasonGames: 0,
      careerMinutes: 0,
      careerGames: 0,
    },
    state.playerTeamId,
    row.band,
    used,
    rng,
  );
  pickN.yours = true;
  const rows = d.rows.map((r) => (r.playerId === row.playerId ? { ...r, decided: "go" as const } : r));
  const school = TEAM_BY_ID[state.playerTeamId]?.name ?? "your program";
  return finishIfDone({
    ...state,
    players: state.players.filter((x) => x.id !== row.playerId),
    draft: { ...d, rows, league: [...d.league, pickN].sort((a, b) => a.pick - b.pick) },
    news: [
      brief(
        state.week,
        `${row.name} declares`,
        [
          `${row.name} is leaving ${school}. The league has him as a ${bandLabel(row.band).toLowerCase()} name.`,
          "The scholarship opens. Next season's class has to replace him.",
        ],
        "bad",
        "Draft",
      ),
      ...state.news,
    ].slice(0, 60),
  });
}

function applyStay(state: GameState, row: DraftRow): GameState {
  const d = state.draft;
  if (!d) return state;
  const rows = d.rows.map((r) => (r.playerId === row.playerId ? { ...r, decided: "stay" as const } : r));
  return finishIfDone({
    ...state,
    players: state.players.map((p) =>
      p.id === row.playerId ? { ...p, morale: clamp(p.morale + 8, 20, 99) } : p,
    ),
    draft: { ...d, rows, stayed: [...d.stayed, { name: row.name, teamId: state.playerTeamId }] },
    news: [
      brief(
        state.week,
        `${row.name} is back`,
        [`${row.name} shut the draft talk down. He's in the gym this summer.`],
        "good",
        "Draft",
      ),
      ...state.news,
    ].slice(0, 60),
  });
}

export function talkStay(state: GameState, id: string, rng?: Rng): { state: GameState; feedback: { title: string; detail: string; parts: { label: string; delta: number }[] } } {
  const d = state.draft;
  const row = d?.rows.find((r) => r.playerId === id);
  if (!d || !row || row.decided) return { state, feedback: { title: "No decision", detail: "", parts: [] } };
  const roll = rng ?? mulberry32(state.seed ^ hashString(id) ^ (state.week + 19) * 104729);
  const hit = roll() * 100 < row.stayChance;
  if (hit) {
    const next = applyStay(state, row);
    return { state: next, feedback: { title: `${row.name} stays`, detail: "He's staying. He'll be in the gym this summer.", parts: [{ label: "Confidence", delta: 8 }] } };
  }
  const next = applyGo(state, { ...row, stayChance: Math.max(8, row.stayChance - 10) });
  return { state: next, feedback: { title: `${row.name} is leaving`, detail: "He heard you. He's still declaring.", parts: [] } };
}

export function letGo(state: GameState, id: string): { state: GameState; feedback: { title: string; detail: string; parts: { label: string; delta: number }[] } } {
  const row = state.draft?.rows.find((r) => r.playerId === id);
  if (!row || row.decided) return { state, feedback: { title: "No decision", detail: "", parts: [] } };
  return { state: applyGo(state, row), feedback: { title: `${row.name} declares`, detail: `${bandLabel(row.band)}. The scholarship opens.`, parts: [] } };
}

export function settleDraft(state: GameState): GameState {
  let s = state.draft ? state : openDraft(state);
  const d = s.draft;
  if (!d || d.resolved) return { ...s, draft: d ? { ...d, resolved: true } : d };
  const rng = mulberry32(s.seed ^ 0x5e11 ^ s.season);
  for (const row of d.rows) {
    if (row.decided) continue;
    const hit = rng() * 100 < row.stayChance;
    const next = hit ? applyStay(s, row) : applyGo(s, row);
    s = next;
  }
  const done = s.draft;
  return { ...s, draft: done ? { ...done, resolved: true } : done };
}

export function draftWaiting(state: GameState): boolean {
  return Boolean(state.draft && !state.draft.resolved && state.draft.rows.some((r) => !r.decided));
}

export function makeJuco(season: number, n: number, stars: number, rng: Rng, _used: Set<string>, name: { first: string; last: string }): Recruit {
  const pos = (["PG", "SG", "SF", "PF", "C"] as const)[n % 5];
  const base = stars === 4 ? 80 : stars === 3 ? 74 : 68;
  const ovr = clamp(Math.round(base + (rng() - 0.5) * 5), 60, 86);
  const roll = (b: number) => clamp(Math.round(22 + rng() * 48 + b), 10, 96);
  const STATES = ["TX", "CA", "FL", "KS", "OK", "MO", "IA", "IL", "MS", "AL", "GA", "NC", "AZ", "WA", "OR"];
  return {
    id: `r-${season}-j-${n}`,
    first: name.first,
    last: name.last,
    pos,
    stars,
    ovr,
    potential: clamp(ovr + Math.floor(rng() * 5), ovr, 90),
    state: pick(rng, STATES),
    scouted: false,
    offers: [],
    visits: [],
    interest: {},
    committedTo: null,
    nilAsk: Math.round(stars * 16 + rng() * 18),
    wants: {
      home: roll(-6),
      minutes: roll(22),
      scheme: roll(4),
      academics: roll(-4),
      nil: roll(stars >= 3 ? 10 : -6),
      style: pick(rng, ["motion", "spread", "post", "transition", "iso"] as const),
    },
    skills: {
      shoot: clamp(ovr + Math.round((rng() - 0.5) * 8), 48, 92),
      finish: clamp(ovr + Math.round((rng() - 0.5) * 8) + 3, 48, 92),
      defense: clamp(ovr + Math.round((rng() - 0.5) * 8), 48, 92),
      iq: clamp(ovr + Math.round((rng() - 0.5) * 6) + 2, 48, 92),
    },
    path: "juco",
  };
}
