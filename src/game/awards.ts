import type { Award, GameState, Player } from "./types";
import { TEAM_BY_ID } from "./teams";

function gamesOf(p: Player) {
  return Math.max(1, p.stats?.g || p.seasonGames || 1);
}

function hasBox(p: Player) {
  return (p.stats?.g ?? 0) >= 6 && ((p.stats?.pts ?? 0) > 0 || (p.stats?.reb ?? 0) > 0);
}

function confPlace(state: GameState, teamId: string) {
  const conf = state.teams[teamId]?.conference ?? TEAM_BY_ID[teamId]?.conference;
  if (!conf) return 12;
  const peers = Object.values(state.teams)
    .filter((t) => t.conference === conf && !t.guest)
    .sort((a, b) => b.wins - b.losses - (a.wins - a.losses) || b.confW - a.confW || b.wins - a.wins);
  const i = peers.findIndex((t) => t.id === teamId);
  return i < 0 ? peers.length + 1 : i + 1;
}

function placeBoost(place: number) {
  if (place <= 1) return 1.28;
  if (place <= 3) return 1.12;
  if (place <= 5) return 1;
  if (place <= 8) return 0.78;
  return 0.58;
}

/** A full sample under 5 points a game is not a national scorer. Empty box scores do not win hardware. */
function hardwarePool(pool: Player[]) {
  return pool.filter((p) => {
    const g = gamesOf(p);
    const ppg = (p.stats?.pts ?? 0) / g;
    const rpg = (p.stats?.reb ?? 0) / g;
    const apg = (p.stats?.ast ?? 0) / g;
    if ((p.stats?.pts ?? 0) <= 0 && (p.stats?.reb ?? 0) <= 0 && (p.stats?.ast ?? 0) <= 0) return false;
    if (g >= 10 && ppg < 5 && ppg + rpg * 0.5 + apg * 0.6 < 8) return false;
    return true;
  });
}

function teamFactor(state: GameState, teamId: string) {
  const t = state.teams[teamId];
  const wins = t?.wins ?? 0;
  const losses = t?.losses ?? 0;
  const g = Math.max(1, wins + losses);
  return (0.5 + wins / g) * placeBoost(confPlace(state, teamId));
}

/** National awards use points, rebounds, assists, wins, and conference place. Overall alone cannot win. */
function score(state: GameState, p: Player) {
  const g = gamesOf(p);
  const ppg = (p.stats?.pts ?? 0) / g;
  const rpg = (p.stats?.reb ?? 0) / g;
  const apg = (p.stats?.ast ?? 0) / g;
  const box = ppg * 1.15 + rpg * 0.7 + apg * 0.9;
  const mpg = p.seasonGames > 0 ? p.seasonMinutes / Math.max(1, p.seasonGames) : p.mpg;
  const minuteGate = 0.62 + 0.38 * Math.min(1, mpg / 24);
  const prod = hasBox(p) ? 1 : 0.22;
  return box * teamFactor(state, p.teamId) * minuteGate * prod;
}

function defenseScore(state: GameState, p: Player) {
  const g = gamesOf(p);
  const rpg = (p.stats?.reb ?? 0) / g;
  const mpg = p.seasonGames > 0 ? p.seasonMinutes / Math.max(1, p.seasonGames) : p.mpg;
  const box = (p.skills.defense / 8) * (0.35 + Math.min(1, mpg / 28)) * (1 + rpg / 14);
  return box * teamFactor(state, p.teamId) * (hasBox(p) ? 1 : 0.35);
}

function coachScore(state: GameState, teamId: string) {
  const t = state.teams[teamId];
  if (!t) return 0;
  const g = Math.max(1, t.wins + t.losses);
  return (t.wins / g * 42 + t.wins * 0.35 + t.confW * 0.45) * placeBoost(confPlace(state, teamId));
}

function nm(p: Player) {
  return `${p.first} ${p.last}`;
}

function row(kind: Award["kind"], team: Award["team"], p: Player, you: string): Award {
  return {
    season: 0,
    kind,
    team,
    playerId: p.id,
    teamId: p.teamId,
    name: nm(p),
    pos: p.pos,
    yours: p.teamId === you,
  };
}

export function rollAwards(state: GameState): Award[] {
  const you = state.playerTeamId;
  const pool = state.players.filter((p) => (p.seasonGames ?? 0) >= 6 && !p.redshirt);
  if (pool.length < 20) return [];
  const ranked = hardwarePool(pool).slice().sort((a, b) => score(state, b) - score(state, a) || b.ovr - a.ovr);
  const out: Award[] = [];
  const poy = ranked[0];
  const poyPpg = poy ? (poy.stats?.pts ?? 0) / gamesOf(poy) : 0;
  if (poy && poyPpg >= 5) out.push({ ...row("poy", "", poy, you), season: state.season });

  const dpool = pool.slice().sort((a, b) => defenseScore(state, b) - defenseScore(state, a) || b.ovr - a.ovr);
  if (dpool[0] && dpool[0].id !== poy?.id) out.push({ ...row("dpoy", "", dpool[0], you), season: state.season });
  else if (dpool[1]) out.push({ ...row("dpoy", "", dpool[1], you), season: state.season });

  const frosh = hardwarePool(pool.filter((p) => p.year === 1)).sort((a, b) => score(state, b) - score(state, a))[0];
  if (frosh && (frosh.stats?.pts ?? 0) / gamesOf(frosh) >= 5) out.push({ ...row("freshman", "", frosh, you), season: state.season });

  const aaTeams: Award["team"][] = ["1st", "1st", "1st", "1st", "1st", "2nd", "2nd", "2nd", "2nd", "2nd", "3rd", "3rd", "3rd", "3rd", "3rd"];
  ranked.slice(0, 15).forEach((p, i) => {
    out.push({ ...row("all-american", aaTeams[i] ?? "3rd", p, you), season: state.season });
  });

  const byConf = new Map<string, Player[]>();
  for (const p of pool) {
    const conf = state.teams[p.teamId]?.conference ?? TEAM_BY_ID[p.teamId]?.conference ?? "SEC";
    const a = byConf.get(conf);
    if (a) a.push(p);
    else byConf.set(conf, [p]);
  }
  for (const [, list] of byConf) {
    const top = hardwarePool(list).sort((a, b) => score(state, b) - score(state, a)).slice(0, 10);
    top.forEach((p, i) => {
      out.push({ ...row("all-conf", i < 5 ? "1st" : "2nd", p, you), season: state.season });
    });
  }

  const coachPool = Object.values(state.teams).filter((t) => !t.guest).slice().sort((a, b) => coachScore(state, b.id) - coachScore(state, a.id));
  const coach = coachPool[0];
  if (coach) {
    out.push({
      season: state.season,
      kind: "coach",
      team: "",
      teamId: coach.id,
      name: coach.coachName || TEAM_BY_ID[coach.id]?.name || "Staff",
      yours: coach.id === you,
    });
  }
  return out;
}

export function awardLine(a: Award) {
  if (a.kind === "poy") return `National Player of the Year · ${a.name}`;
  if (a.kind === "dpoy") return `Defensive Player of the Year · ${a.name}`;
  if (a.kind === "freshman") return `Freshman of the Year · ${a.name}`;
  if (a.kind === "coach") return `Coach of the Year · ${a.name}`;
  if (a.kind === "all-american") return `All-American ${a.team} · ${a.name}`;
  return `All-Conference ${a.team} · ${a.name}`;
}

export function yourAwards(state: GameState, season?: number) {
  const yr = season ?? state.season;
  return (state.awards ?? []).filter((a) => a.season === yr && a.yours);
}
