import type { ConferenceId, GameState, TeamRuntime } from "./types";
import { CONFERENCES, TEAM_BY_ID } from "./teams";
import { brief } from "./wire";

/** Historic leagues reused as facsimile IDs: Plains = Big Eight until 1996, Mountain = WAC until 1999, Gulf = Metro 1975–95. */

const BASE_1960: Record<string, ConferenceId> = {};

function put(conf: ConferenceId, ids: string[]) {
  for (const id of ids) BASE_1960[id] = conf;
}

put("B10", [
  "illinois", "indiana", "iowa", "michigan", "michigan-state", "minnesota",
  "northwestern", "ohio-state", "purdue", "wisconsin",
]);
put("ACC", [
  "clemson", "duke", "maryland", "unc", "nc-state", "south-carolina", "virginia", "wake-forest",
]);
put("SEC", [
  "alabama", "auburn", "florida", "georgia", "georgia-tech", "kentucky", "lsu",
  "ole-miss", "mississippi-state", "tennessee", "tulane", "vanderbilt",
]);
put("P12", ["cal", "stanford", "ucla", "usc", "washington", "washington-state"]);
put("SWC", ["arkansas", "baylor", "rice", "smu", "tcu", "texas", "texas-am", "texas-tech"]);
put("B12", [
  "colorado", "iowa-state", "kansas", "kansas-state", "missouri", "nebraska", "oklahoma", "oklahoma-state",
]);
put("MVC", [
  "bradley", "creighton", "drake", "illinois-state", "indiana-state", "wichita-state",
  "saint-louis", "southern-illinois", "tulsa", "cincinnati",
]);
put("WCC", [
  "gonzaga", "lmu", "pacific", "pepperdine", "portland", "saint-marys",
  "san-diego", "san-francisco", "santa-clara",
]);
put("MW", [
  "air-force", "arizona", "arizona-state", "byu", "colorado-state", "new-mexico",
  "utah", "utep", "wyoming", "hawaii", "san-jose-state", "fresno-state", "utah-state",
  "san-diego-state", "nevada", "unlv", "boise-state",
]);
put("SOC", [
  "west-virginia", "virginia-tech", "davidson", "furman", "citadel", "vmi",
  "western-carolina", "chattanooga", "wofford",
]);
put("A10", [
  "dayton", "duquesne", "fordham", "george-washington", "lasalle", "uri",
  "richmond", "st-bonaventure", "saint-josephs", "umass", "temple",
]);
put("SLAND", ["texas-state"]);
put("ASUN", ["ucf"]);
put("SBC", ["app-state", "arkansas-state", "louisiana", "south-alabama", "troy", "ulm"]);
put("MAC", [
  "akron", "ball-state", "bowling-green", "kent-state", "miami-oh", "ohio", "toledo", "western-michigan",
]);
put("PAT", ["army", "navy", "holy-cross", "bucknell", "colgate", "lafayette", "lehigh"]);
put("IND", [
  "notre-dame", "marquette", "depaul", "syracuse", "pitt", "st-johns", "georgetown",
  "providence", "seton-hall", "uconn", "villanova", "boston-college", "louisville",
  "memphis", "florida-state", "miami", "penn-state", "houston", "oregon", "oregon-state",
  "xavier", "butler", "usf", "rutgers",
]);

type Move = [year: number, team: string, conf: ConferenceId];

const MOVES: Move[] = [
  [1964, "georgia-tech", "IND"],
  [1964, "oregon", "P12"],
  [1964, "oregon-state", "P12"],
  [1966, "tulane", "IND"],
  [1964, "louisville", "MVC"],
  [1968, "west-virginia", "IND"],
  [1971, "south-carolina", "IND"],
  [1971, "houston", "SWC"],
  [1975, "louisville", "AAC"],
  [1975, "cincinnati", "AAC"],
  [1975, "memphis", "AAC"],
  [1975, "tulane", "AAC"],
  [1976, "west-virginia", "A10"],
  [1976, "penn-state", "A10"],
  [1978, "arizona", "P12"],
  [1978, "arizona-state", "P12"],
  [1978, "virginia-tech", "AAC"],
  [1978, "florida-state", "AAC"],
  [1978, "south-carolina", "AAC"],
  [1979, "georgia-tech", "ACC"],
  [1979, "boston-college", "BE"],
  [1979, "uconn", "BE"],
  [1979, "georgetown", "BE"],
  [1979, "providence", "BE"],
  [1979, "st-johns", "BE"],
  [1979, "seton-hall", "BE"],
  [1979, "syracuse", "BE"],
  [1980, "villanova", "BE"],
  [1982, "pitt", "BE"],
  [1982, "temple", "A10"],
  [1990, "penn-state", "B10"],
  [1991, "florida-state", "ACC"],
  [1991, "arkansas", "SEC"],
  [1991, "south-carolina", "SEC"],
  [1991, "miami", "BE"],
  [1995, "rutgers", "BE"],
  [1995, "west-virginia", "BE"],
  [1995, "notre-dame", "BE"],
  [1995, "virginia-tech", "BE"],
  [1995, "louisville", "CUSA"],
  [1995, "cincinnati", "CUSA"],
  [1995, "memphis", "CUSA"],
  [1995, "tulane", "CUSA"],
  [1995, "usf", "CUSA"],
  [1995, "houston", "CUSA"],
  [1996, "baylor", "B12"],
  [1996, "texas", "B12"],
  [1996, "texas-am", "B12"],
  [1996, "texas-tech", "B12"],
  [1996, "rice", "MW"],
  [1996, "smu", "MW"],
  [1996, "tcu", "MW"],
  [1999, "air-force", "MW"],
  [1999, "byu", "MW"],
  [1999, "colorado-state", "MW"],
  [1999, "new-mexico", "MW"],
  [1999, "utah", "MW"],
  [1999, "unlv", "MW"],
  [1999, "san-diego-state", "MW"],
  [1999, "wyoming", "MW"],
  [2000, "virginia-tech", "BE"],
  [2004, "miami", "ACC"],
  [2004, "virginia-tech", "ACC"],
  [2005, "boston-college", "ACC"],
  [2005, "louisville", "BE"],
  [2005, "cincinnati", "BE"],
  [2005, "marquette", "BE"],
  [2005, "depaul", "BE"],
  [2011, "nebraska", "B10"],
  [2011, "colorado", "P12"],
  [2011, "utah", "P12"],
  [2011, "byu", "WCC"],
  [2012, "texas-am", "SEC"],
  [2012, "missouri", "SEC"],
  [2012, "tcu", "B12"],
  [2012, "west-virginia", "B12"],
  [2013, "syracuse", "ACC"],
  [2013, "pitt", "ACC"],
  [2013, "notre-dame", "ACC"],
  [2013, "louisville", "BE"],
  [2013, "uconn", "AAC"],
  [2013, "cincinnati", "AAC"],
  [2013, "memphis", "AAC"],
  [2013, "houston", "AAC"],
  [2013, "smu", "AAC"],
  [2013, "ucf", "AAC"],
  [2013, "temple", "AAC"],
  [2013, "usf", "AAC"],
  [2013, "tulane", "AAC"],
  [2013, "tulsa", "AAC"],
  [2013, "butler", "BE"],
  [2013, "xavier", "BE"],
  [2013, "creighton", "BE"],
  [2014, "maryland", "B10"],
  [2014, "rutgers", "B10"],
  [2014, "louisville", "ACC"],
  [2020, "uconn", "BE"],
  [2023, "houston", "B12"],
  [2023, "cincinnati", "B12"],
  [2023, "ucf", "B12"],
  [2023, "byu", "B12"],
  [2024, "ucla", "B10"],
  [2024, "usc", "B10"],
  [2024, "oregon", "B10"],
  [2024, "washington", "B10"],
  [2024, "cal", "ACC"],
  [2024, "stanford", "ACC"],
  [2024, "smu", "ACC"],
  [2024, "arizona", "B12"],
  [2024, "arizona-state", "B12"],
  [2024, "utah", "B12"],
  [2024, "colorado", "B12"],
  [2024, "texas", "SEC"],
  [2024, "oklahoma", "SEC"],
  [2013, "texas-state", "SBC"],
  [2024, "texas-state", "P12"],
  [2024, "washington-state", "P12"],
  [2024, "gonzaga", "P12"],
  [2024, "boise-state", "P12"],
  [2024, "colorado-state", "P12"],
  [2024, "fresno-state", "P12"],
  [2024, "san-diego-state", "P12"],
  [2024, "utah-state", "P12"],
];

const MOVES_BY_TEAM = new Map<string, Move[]>();
for (const m of MOVES) {
  const list = MOVES_BY_TEAM.get(m[1]) ?? [];
  list.push(m);
  MOVES_BY_TEAM.set(m[1], list);
}

export function conferencePlaysLeague(conf: ConferenceId): boolean {
  return conf !== "IND";
}

export function activeLeagueIds(teams: Record<string, { conference: ConferenceId }>): ConferenceId[] {
  const n = new Map<ConferenceId, number>();
  for (const t of Object.values(teams)) n.set(t.conference, (n.get(t.conference) ?? 0) + 1);
  return CONFERENCES.map((c) => c.id).filter((id) => conferencePlaysLeague(id) && (n.get(id) ?? 0) >= 2);
}

export function conferenceInYear(teamId: string, year: number): ConferenceId {
  const modern = TEAM_BY_ID[teamId]?.conference ?? "SEC";
  if (year >= 2025) return modern;
  let conf = BASE_1960[teamId] ?? modern;
  const list = MOVES_BY_TEAM.get(teamId);
  if (list) {
    for (const [y, , next] of list) {
      if (y <= year) conf = next;
    }
  }
  return conf;
}

export function eraDecadeForSeason(season: number, started: number | null): number | null {
  if (started == null) return null;
  const d = Math.floor(season / 10) * 10;
  if (d < 1960) return 1960;
  if (d > 2020) return 2020;
  return d;
}

export function leagueName(conf: ConferenceId, year?: number): string {
  if (conf === "B12" && year != null && year < 1996) return "Plains Eight";
  if (conf === "P12" && year != null && year < 1978) return "Pacific Eight";
  if (conf === "P12" && year != null && year < 2011) return "Pacific Ten";
  if (conf === "MW" && year != null && year < 1999) return "Western Athletic";
  if (conf === "AAC" && year != null && year >= 1975 && year < 1995) return "Metro";
  if (conf === "AAC" && year != null && year >= 2013) return CONFERENCES.find((c) => c.id === "AAC")?.name ?? "Gulf Circuit";
  return CONFERENCES.find((c) => c.id === conf)?.name ?? conf;
}

export function alignTeamsForYear(
  teams: Record<string, TeamRuntime>,
  year: number,
): Record<string, TeamRuntime> {
  let next = teams;
  let copied = false;
  for (const t of Object.values(teams)) {
    const conf = conferenceInYear(t.id, year);
    if (conf === t.conference) continue;
    if (!copied) {
      next = { ...teams };
      copied = true;
    }
    next[t.id] = { ...t, conference: conf };
  }
  return next;
}

export function applyYearRealignment(state: GameState, fromYear: number, toYear: number): GameState {
  if (fromYear === toYear) return state;
  const moved: { id: string; from: ConferenceId; to: ConferenceId }[] = [];
  const teams = { ...state.teams };
  for (const t of Object.values(state.teams)) {
    const prev = conferenceInYear(t.id, fromYear);
    const next = conferenceInYear(t.id, toYear);
    if (prev === next) continue;
    teams[t.id] = { ...t, conference: next };
    moved.push({ id: t.id, from: prev, to: next });
  }
  if (!moved.length) return { ...state, teams };
  const byDest = new Map<ConferenceId, string[]>();
  for (const m of moved) {
    const list = byDest.get(m.to) ?? [];
    list.push(TEAM_BY_ID[m.id]?.name ?? m.id);
    byDest.set(m.to, list);
  }
  const bits = [...byDest.entries()]
    .slice(0, 6)
    .map(([conf, names]) => `${names.slice(0, 4).join(", ")} ${names.length > 4 ? `and ${names.length - 4} more ` : ""}to the ${leagueName(conf, toYear)}`);
  const headline = moved.length === 1
    ? `${TEAM_BY_ID[moved[0]!.id]?.name ?? moved[0]!.id} joins the ${leagueName(moved[0]!.to, toYear)}`
    : `Realignment, ${toYear}`;
  const graf = bits.join(". ") + ".";
  const news = [brief(0, headline, [graf, "They'll print a new pocket schedule in August."], "even", "Realignment"), ...state.news].slice(0, 60);
  return { ...state, teams, news };
}
