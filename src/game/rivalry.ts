import type { GameSlot, GameState } from "./types";
import { TEAM_BY_ID, teamOf } from "./teams";

interface RivalSeed {
  a: string;
  b: string;
  real: string;
  fake: string;
}

const PAIRS: RivalSeed[] = [
  { a: "duke", b: "unc", real: "Tobacco Road", fake: "The Hill Road" },
  { a: "kentucky", b: "louisville", real: "Battle of the Bluegrass", fake: "The River Job" },
  { a: "indiana", b: "purdue", real: "The Old Rivalry", fake: "The Bucket" },
  { a: "kansas", b: "missouri", real: "Border War", fake: "The Line" },
  { a: "kansas", b: "kansas-state", real: "Sunflower Showdown", fake: "The Sunflower" },
  { a: "arizona", b: "arizona-state", real: "Duel in the Desert", fake: "The Desert" },
  { a: "ucla", b: "usc", real: "Crosstown Rivalry", fake: "Crosstown" },
  { a: "michigan", b: "michigan-state", real: "The Rivalry", fake: "The In-State" },
  { a: "ohio-state", b: "michigan", real: "The Rivalry", fake: "The North Game" },
  { a: "illinois", b: "indiana", real: "The Rivalry", fake: "The Neighbor" },
  { a: "illinois", b: "missouri", real: "Braggin' Rights", fake: "Braggin' Rights" },
  { a: "syracuse", b: "georgetown", real: "The Rivalry", fake: "The Big East Night" },
  { a: "uconn", b: "syracuse", real: "The Rivalry", fake: "The East Night" },
  { a: "villanova", b: "st-johns", real: "The Rivalry", fake: "The Garden Night" },
  { a: "xavier", b: "cincinnati", real: "Crosstown Shootout", fake: "Crosstown Shootout" },
  { a: "louisville", b: "cincinnati", real: "The Rivalry", fake: "The River" },
  { a: "memphis", b: "louisville", real: "The Rivalry", fake: "The South Night" },
  { a: "alabama", b: "auburn", real: "Iron Bowl of basketball", fake: "The State Game" },
  { a: "florida", b: "fsu", real: "Sunshine Showdown", fake: "The Sunshine" },
  { a: "tennessee", b: "kentucky", real: "The Rivalry", fake: "The Border" },
  { a: "tennessee", b: "vanderbilt", real: "The Rivalry", fake: "The State" },
  { a: "arkansas", b: "missouri", real: "Battle Line Rivalry", fake: "The Line" },
  { a: "ole-miss", b: "mississippi-state", real: "Egg Bowl of hoops", fake: "The Egg" },
  { a: "lsu", b: "arkansas", real: "The Rivalry", fake: "The Delta" },
  { a: "texas", b: "texas-am", real: "The Rivalry", fake: "The Lone Star" },
  { a: "texas", b: "oklahoma", real: "Red River", fake: "The Red River" },
  { a: "baylor", b: "tcu", real: "The Rivalry", fake: "The Fort Worth Night" },
  { a: "houston", b: "rice", real: "The Rivalry", fake: "The City" },
  { a: "gonzaga", b: "saint-marys", real: "The WCC Rivalry", fake: "The Coast" },
  { a: "utah", b: "byu", real: "Holy War", fake: "The Holy War" },
  { a: "utah", b: "utah-state", real: "The Rivalry", fake: "The State" },
  { a: "unlv", b: "nevada", real: "Battle for Nevada", fake: "Silver State" },
  { a: "new-mexico", b: "new-mexico-state", real: "Rio Grande Rivalry", fake: "The Rio" },
  { a: "colorado", b: "colorado-state", real: "Rocky Mountain Showdown", fake: "The Rockies" },
  { a: "washington", b: "washington-state", real: "Apple Cup of hoops", fake: "The Apple" },
  { a: "oregon", b: "oregon-state", real: "Civil War", fake: "The Civil War" },
  { a: "cal", b: "stanford", real: "Big Game", fake: "The Farm Night" },
  { a: "nc-state", b: "unc", real: "Tobacco Road", fake: "The Hill Road" },
  { a: "nc-state", b: "wake-forest", real: "Tobacco Road", fake: "The Hill Road" },
  { a: "wake-forest", b: "duke", real: "Tobacco Road", fake: "The Hill Road" },
  { a: "pitt", b: "west-virginia", real: "Backyard Brawl", fake: "The Backyard" },
  { a: "pitt", b: "penn-state", real: "The Rivalry", fake: "The State" },
  { a: "iowa", b: "iowa-state", real: "Cy-Hawk", fake: "The State" },
  { a: "wisconsin", b: "minnesota", real: "Border Battle", fake: "The Border" },
  { a: "marquette", b: "wisconsin", real: "The Rivalry", fake: "The State Night" },
  { a: "creighton", b: "nebraska", real: "The Rivalry", fake: "The State" },
  { a: "vcu", b: "richmond", real: "Capital City Classic", fake: "Capital City" },
  { a: "dayton", b: "xavier", real: "The Rivalry", fake: "The Road" },
  { a: "st-bonaventure", b: "canisius", real: "Little Three", fake: "The Little Three" },
  { a: "harvard", b: "yale", real: "The Game", fake: "The Game" },
  { a: "princeton", b: "penn", real: "The Rivalry", fake: "The Palestra Night" },
  { a: "georgetown", b: "villanova", real: "The Rivalry", fake: "The Big East Night" },
  { a: "memphis", b: "uab", real: "The Rivalry", fake: "The South" },
  { a: "wichita-state", b: "missouri-state", real: "I-35 Rivalry", fake: "The I-35" },
  { a: "san-diego-state", b: "unlv", real: "The Rivalry", fake: "The West" },
  { a: "boise-state", b: "nevada", real: "The Rivalry", fake: "The Mountain" },
  { a: "vermont", b: "new-hampshire", real: "The Rivalry", fake: "The North" },
  { a: "murray-state", b: "belmont", real: "The Rivalry", fake: "The OVC Night" },
];

const INDEX = (() => {
  const m = new Map<string, RivalSeed>();
  for (const p of PAIRS) {
    m.set(`${p.a}|${p.b}`, p);
    m.set(`${p.b}|${p.a}`, p);
  }
  return m;
})();

function realNamesOn() {
  return TEAM_BY_ID.duke?.name === "Duke" || TEAM_BY_ID.kentucky?.name === "Kentucky";
}

export function rivalryOf(a: string, b: string) {
  const seed = INDEX.get(`${a}|${b}`);
  if (!seed) return null;
  return {
    a: seed.a,
    b: seed.b,
    trophy: realNamesOn() ? seed.real : seed.fake,
  };
}

export function isRivalryGame(homeId: string, awayId: string) {
  return Boolean(rivalryOf(homeId, awayId));
}

export function rivalryForSlot(g: Pick<GameSlot, "homeId" | "awayId">) {
  return rivalryOf(g.homeId, g.awayId);
}

export function yourRivals(teamId: string) {
  const out: { oppId: string; trophy: string }[] = [];
  for (const p of PAIRS) {
    if (p.a === teamId) out.push({ oppId: p.b, trophy: realNamesOn() ? p.real : p.fake });
    else if (p.b === teamId) out.push({ oppId: p.a, trophy: realNamesOn() ? p.real : p.fake });
  }
  return out;
}

export function rivalryEdge(homeId: string, awayId: string) {
  return rivalryOf(homeId, awayId) ? 0.012 : 0;
}

export function rivalryLine(state: GameState, homeId: string, awayId: string) {
  const r = rivalryOf(homeId, awayId);
  if (!r) return null;
  const mark = state.teams[homeId]?.series?.[awayId];
  const home = teamOf(homeId);
  const away = teamOf(awayId);
  const series = mark && mark.w + mark.l > 0 ? `${mark.w}-${mark.l}` : null;
  return series
    ? `${r.trophy} · ${home.abbr} ${series} vs ${away.abbr}`
    : r.trophy;
}

export function rivalryTease(state: GameState) {
  const you = state.playerTeamId;
  const next = state.schedule.find((g) => !g.resultId && !g.declined && (g.homeId === you || g.awayId === you));
  if (next) {
    const r = rivalryForSlot(next);
    if (r) {
      const opp = next.homeId === you ? next.awayId : next.homeId;
      return { head: r.trophy, note: `Week ${next.week} · ${teamOf(opp).name}` };
    }
  }
  const rivals = yourRivals(you);
  if (!rivals.length) return { head: "No listed rival", note: "No rivalry game on the schedule." };
  const first = rivals[0]!;
  const mark = state.teams[you]?.series?.[first.oppId];
  return {
    head: first.trophy,
    note: mark && mark.w + mark.l > 0
      ? `${teamOf(first.oppId).name} · ${mark.w}-${mark.l}`
      : `${teamOf(first.oppId).name} · waiting`,
  };
}
