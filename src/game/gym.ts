import type { GameState, GameResult } from "./types";
import { TEAM_BY_ID, teamOf } from "./teams";
import { clamp } from "./rng";
import { eraOf } from "./era";
import { facilityHca } from "./program";

/** Historical home-court prior (0–100) plus gym names. Real names only when the real pack is on. */
type GymSeed = { prior: number; real: string; fake: string };

const GYMS: Record<string, GymSeed> = {
  duke: { prior: 99, real: "Cameron Indoor Stadium", fake: "The Indoor" },
  kansas: { prior: 98, real: "Allen Fieldhouse", fake: "The Fieldhouse" },
  "iowa-state": { prior: 97, real: "Hilton Coliseum", fake: "Hilton" },
  "new-mexico": { prior: 96, real: "The Pit", fake: "The Pit" },
  kentucky: { prior: 94, real: "Rupp Arena", fake: "The Big House" },
  indiana: { prior: 93, real: "Simon Skjodt Assembly Hall", fake: "Assembly" },
  houston: { prior: 93, real: "Fertitta Center", fake: "Fertitta" },
  gonzaga: { prior: 92, real: "McCarthey Athletic Center", fake: "The Kennel" },
  arizona: { prior: 91, real: "McKale Center", fake: "McKale" },
  purdue: { prior: 90, real: "Mackey Arena", fake: "Mackey" },
  "utah-state": { prior: 90, real: "Dee Glen Smith Spectrum", fake: "The Spectrum" },
  "west-virginia": { prior: 90, real: "WVU Coliseum", fake: "The Coliseum" },
  wisconsin: { prior: 89, real: "Kohl Center", fake: "The Kohl" },
  "san-diego-state": { prior: 89, real: "Viejas Arena", fake: "Viejas" },
  "oklahoma-state": { prior: 88, real: "Gallagher-Iba Arena", fake: "Gallagher" },
  dayton: { prior: 88, real: "UD Arena", fake: "The Arena" },
  tennessee: { prior: 88, real: "Food City Center", fake: "The Hill Gym" },
  louisville: { prior: 88, real: "KFC Yum! Center", fake: "The Falls Arena" },
  "grand-canyon": { prior: 88, real: "Global Credit Union Arena", fake: "The Anthem" },
  "michigan-state": { prior: 87, real: "Breslin Center", fake: "Breslin" },
  arkansas: { prior: 87, real: "Bud Walton Arena", fake: "Bud Walton" },
  "saint-marys": { prior: 87, real: "University Credit Union Pavilion", fake: "The Pavilion" },
  syracuse: { prior: 86, real: "JMA Wireless Dome", fake: "The Dome" },
  illinois: { prior: 86, real: "State Farm Center", fake: "The Hall" },
  auburn: { prior: 86, real: "Neville Arena", fake: "Neville" },
  vcu: { prior: 86, real: "Siegel Center", fake: "The Siegel" },
  creighton: { prior: 86, real: "CHI Health Center", fake: "The Center" },
  unlv: { prior: 86, real: "Thomas & Mack Center", fake: "Thomas & Mack" },
  memphis: { prior: 85, real: "FedExForum", fake: "The Forum" },
  ucla: { prior: 85, real: "Pauley Pavilion", fake: "Pauley" },
  wichita: { prior: 85, real: "Charles Koch Arena", fake: "The Roundhouse" },
  "wichita-state": { prior: 85, real: "Charles Koch Arena", fake: "The Roundhouse" },
  nevada: { prior: 85, real: "Lawlor Events Center", fake: "Lawlor" },
  "ohio-state": { prior: 84, real: "Value City Arena", fake: "Value City" },
  xavier: { prior: 84, real: "Cintas Center", fake: "Cintas" },
  iowa: { prior: 84, real: "Carver-Hawkeye Arena", fake: "Carver" },
  "kansas-state": { prior: 84, real: "Bramlage Coliseum", fake: "Bramlage" },
  alabama: { prior: 84, real: "Coleman Coliseum", fake: "Coleman" },
  baylor: { prior: 84, real: "Foster Pavilion", fake: "Foster" },
  "murray-state": { prior: 84, real: "CFSB Center", fake: "The CFSB" },
  byu: { prior: 84, real: "Marriott Center", fake: "The Marriott" },
  unc: { prior: 83, real: "Dean E. Smith Center", fake: "The Dean" },
  marquette: { prior: 83, real: "Fiserv Forum", fake: "The Forum" },
  "texas-tech": { prior: 83, real: "United Supermarkets Arena", fake: "The United" },
  "boise-state": { prior: 83, real: "ExtraMile Arena", fake: "ExtraMile" },
  butler: { prior: 83, real: "Hinkle Fieldhouse", fake: "Hinkle" },
  uconn: { prior: 82, real: "Harry A. Gampel Pavilion", fake: "Gampel" },
  florida: { prior: 82, real: "Exactech Arena", fake: "The O'Dome" },
  cincinnati: { prior: 82, real: "Fifth Third Arena", fake: "Fifth Third" },
  "st-bonaventure": { prior: 82, real: "Reilly Center", fake: "Reilly" },
  "virginia-tech": { prior: 82, real: "Cassell Coliseum", fake: "Cassell" },
  vermont: { prior: 82, real: "Patrick Gym", fake: "Patrick Gym" },
  "oral-roberts": { prior: 82, real: "Mabee Center", fake: "Mabee" },
  virginia: { prior: 81, real: "John Paul Jones Arena", fake: "JPJ" },
  "texas-am": { prior: 81, real: "Reed Arena", fake: "Reed" },
  "penn-state": { prior: 81, real: "Bryce Jordan Center", fake: "The BJC" },
  providence: { prior: 81, real: "Amica Mutual Pavilion", fake: "The AMP" },
  oregon: { prior: 81, real: "Matthew Knight Arena", fake: "The Knight" },
  "new-mexico-state": { prior: 81, real: "Pan American Center", fake: "The Pan Am" },
  "nc-state": { prior: 80, real: "Lenovo Center", fake: "Reynolds" },
  pitt: { prior: 80, real: "Petersen Events Center", fake: "The Pete" },
  maryland: { prior: 80, real: "Xfinity Center", fake: "Cole" },
  lsu: { prior: 80, real: "Pete Maravich Assembly Center", fake: "The PMAC" },
  "mississippi-state": { prior: 80, real: "Humphrey Coliseum", fake: "The Hump" },
  texas: { prior: 80, real: "Moody Center", fake: "Moody" },
  clemson: { prior: 80, real: "Littlejohn Coliseum", fake: "Littlejohn" },
  "st-johns": { prior: 80, real: "Carnesecca Arena", fake: "Carnesecca" },
  richmond: { prior: 80, real: "Robins Center", fake: "Robins" },
  liberty: { prior: 80, real: "Liberty Arena", fake: "Liberty Arena" },
  hawaii: { prior: 80, real: "Stan Sheriff Center", fake: "The Sheriff" },
  utah: { prior: 80, real: "Jon M. Huntsman Center", fake: "The Huntsman" },
  minnesota: { prior: 80, real: "Williams Arena", fake: "The Barn" },
  belmont: { prior: 80, real: "Curb Event Center", fake: "The Curb" },
  "loyola-chicago": { prior: 80, real: "Joseph J. Gentile Arena", fake: "The Gentile" },
  drake: { prior: 80, real: "Knapp Center", fake: "Knapp" },
  "wake-forest": { prior: 79, real: "Lawrence Joel Veterans Memorial Coliseum", fake: "Joel" },
  fsu: { prior: 79, real: "Tucker Center", fake: "Tucker" },
  "ole-miss": { prior: 79, real: "SJB Pavilion", fake: "The Pavilion" },
  "south-carolina": { prior: 79, real: "Colonial Life Arena", fake: "Colonial Life" },
  oklahoma: { prior: 79, real: "Lloyd Noble Center", fake: "Lloyd Noble" },
  michigan: { prior: 79, real: "Crisler Center", fake: "Crisler" },
  "seton-hall": { prior: 79, real: "Prudential Center", fake: "The Rock" },
  davidson: { prior: 79, real: "John M. Belk Arena", fake: "Belk" },
  "colorado-state": { prior: 79, real: "Moby Arena", fake: "Moby" },
  montana: { prior: 79, real: "Dahlberg Arena", fake: "Dahlberg" },
  villanova: { prior: 78, real: "William B. Finneran Pavilion", fake: "The Pavilion" },
  "notre-dame": { prior: 78, real: "Purcell Pavilion", fake: "Purcell" },
  georgia: { prior: 78, real: "Stegeman Coliseum", fake: "Stegeman" },
  tcu: { prior: 78, real: "Schollmaier Arena", fake: "Schollmaier" },
  nebraska: { prior: 78, real: "Pinnacle Bank Arena", fake: "Pinnacle" },
  washington: { prior: 78, real: "Alaska Airlines Arena", fake: "Hec Ed" },
  wyoming: { prior: 78, real: "Arena-Auditorium", fake: "The AA" },
  princeton: { prior: 78, real: "Jadwin Gymnasium", fake: "Jadwin" },
  akron: { prior: 78, real: "James A. Rhodes Arena", fake: "The JAR" },
  "uc-irvine": { prior: 78, real: "Bren Events Center", fake: "The Bren" },
  "south-dakota-state": { prior: 78, real: "Frost Arena", fake: "Frost" },
  valparaiso: { prior: 78, real: "Athletics-Recreation Center", fake: "The ARC" },
  georgetown: { prior: 77, real: "Capital One Arena", fake: "The Garden" },
  missouri: { prior: 77, real: "Mizzou Arena", fake: "Mizzou Arena" },
  vanderbilt: { prior: 77, real: "Memorial Gymnasium", fake: "Memorial" },
  colorado: { prior: 77, real: "CU Events Center", fake: "The Coors" },
  "washington-state": { prior: 77, real: "Beasley Coliseum", fake: "Beasley" },
  toledo: { prior: 77, real: "Savage Arena", fake: "Savage" },
  "weber-state": { prior: 77, real: "Dee Events Center", fake: "The Dee" },
  "uc-santa-barbara": { prior: 77, real: "The Thunderdome", fake: "The Thunderdome" },
  chattanooga: { prior: 77, real: "McKenzie Arena", fake: "The McKenzie" },
  miami: { prior: 76, real: "Watsco Center", fake: "Watsco" },
  usc: { prior: 76, real: "Galen Center", fake: "Galen" },
  "oregon-state": { prior: 76, real: "Gill Coliseum", fake: "Gill" },
  "georgia-tech": { prior: 75, real: "McCamish Pavilion", fake: "McCamish" },
  "arizona-state": { prior: 75, real: "Desert Financial Arena", fake: "The Wells" },
  "kent-state": { prior: 76, real: "MAC Center", fake: "The MAC" },
  ohio: { prior: 75, real: "Convocation Center", fake: "The Convo" },
  iona: { prior: 76, real: "Hynes Athletics Center", fake: "Hynes" },
  furman: { prior: 76, real: "Timmons Arena", fake: "Timmons" },
  lipscomb: { prior: 76, real: "Allen Arena", fake: "Allen Arena" },
  "eastern-washington": { prior: 75, real: "Reese Court", fake: "Reese" },
  colgate: { prior: 75, real: "Cotterell Court", fake: "Cotterell" },
  wofford: { prior: 75, real: "Jerry Richardson Indoor Stadium", fake: "Richardson" },
  stanford: { prior: 74, real: "Maples Pavilion", fake: "Maples" },
  cal: { prior: 73, real: "Haas Pavilion", fake: "Haas" },
  "boston-college": { prior: 73, real: "Conte Forum", fake: "Conte" },
  smu: { prior: 74, real: "Moody Coliseum", fake: "Moody" },
  buffalo: { prior: 74, real: "Alumni Arena", fake: "Alumni" },
  penn: { prior: 74, real: "The Palestra", fake: "The Palestra" },
  northwestern: { prior: 76, real: "Welsh-Ryan Arena", fake: "Welsh-Ryan" },
  yale: { prior: 72, real: "John J. Lee Amphitheater", fake: "The Lee" },
  harvard: { prior: 70, real: "Lavietes Pavilion", fake: "Lavietes" },
};

const KINDS = ["Arena", "Fieldhouse", "Pavilion", "Coliseum", "Center", "Gym"] as const;

function realNamesOn() {
  const duke = TEAM_BY_ID.duke?.name;
  const uk = TEAM_BY_ID.kentucky?.name;
  return duke === "Duke" || uk === "Kentucky";
}

function hashKind(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) | 0;
  return KINDS[Math.abs(h) % KINDS.length]!;
}

export function gymName(id: string) {
  const seed = GYMS[id];
  const school = TEAM_BY_ID[id] ?? teamOf(id);
  if (seed) return realNamesOn() ? seed.real : seed.fake;
  const city = school?.city || school?.name || "Campus";
  return `${city} ${hashKind(id)}`;
}

function eraTilt(id: string, era: number | null) {
  if (era == null || era >= 2020) {
    if (id === "houston" || id === "iowa-state" || id === "tennessee" || id === "alabama" || id === "grand-canyon") return 6;
    if (id === "indiana" || id === "louisville") return -3;
  } else if (era <= 1970) {
    if (id === "ucla" || id === "kentucky" || id === "indiana" || id === "louisville" || id === "nc-state" || id === "houston" || id === "kansas" || id === "maryland") return 8;
    if (id === "duke" || id === "gonzaga" || id === "grand-canyon") return -12;
  } else if (era === 1980) {
    if (id === "duke" || id === "indiana" || id === "kentucky" || id === "georgetown" || id === "unlv" || id === "louisville" || id === "nc-state") return 6;
    if (id === "gonzaga" || id === "houston") return -6;
  } else if (era === 1990 || era === 2000) {
    if (id === "duke" || id === "kansas" || id === "kentucky" || id === "arizona" || id === "uconn" || id === "michigan-state") return 5;
  } else if (era === 2010) {
    if (id === "gonzaga" || id === "wichita-state" || id === "kansas" || id === "duke" || id === "kentucky" || id === "wisconsin") return 5;
    if (id === "indiana") return -2;
  }
  return 0;
}

function defaultPrior(id: string) {
  const p = TEAM_BY_ID[id]?.prestige ?? 55;
  return clamp(36 + (p - 48) * 0.72, 30, 79);
}

export function gymPrior(id: string, era: number | null = null) {
  const base = GYMS[id]?.prior ?? defaultPrior(id);
  return clamp(base + eraTilt(id, era), 24, 100);
}

function isTrueHome(state: GameState, r: GameResult) {
  if (r.homeId == null) return false;
  const slot = state.schedule.find((g) => g.id === r.slotId);
  if (!slot) return true;
  if (slot.site === "neutral") return false;
  if (slot.kind === "ncaa" || slot.kind === "nit" || slot.kind === "crown" || slot.kind === "mte") return false;
  return slot.site === "home";
}

function homeGames(state: GameState, id: string) {
  return state.results.filter((r) => r.homeId === id && isTrueHome(state, r));
}

export interface PlaceRow {
  id: string;
  rank: number;
  gym: string;
  school: string;
  abbr: string;
  prior: number;
  score: number;
  hca: number;
  seasonW: number;
  seasonL: number;
  careerW: number;
  careerL: number;
  streak: number;
  margin: number;
  careerMargin: number;
  last: string;
  note: string;
}

const GYM_LINES: Record<string, string> = {
  duke: "The students stand the whole game.",
  kansas: "You hear the building before tip.",
  "iowa-state": "The floor feels tilted. It isn't.",
  "new-mexico": "Altitude, and the crowd is on the floor.",
  kentucky: "A big house that doesn't get quiet.",
  indiana: "An old hall that still shakes.",
  houston: "A downtown gym that plays bigger than it looks.",
  gonzaga: "A small room. Nobody sits.",
  arizona: "A desert pit. They don't let up.",
  purdue: "They are on you from the opening tip.",
  "utah-state": "A mountain gym. The bus ride is part of it.",
  "west-virginia": "The seats sit on top of the floor.",
  wisconsin: "Loud, patient, and hard to steal one.",
  "san-diego-state": "The student section doesn't blink.",
  "oklahoma-state": "Old, low, and mean.",
  dayton: "A true home floor. They fill it.",
  tennessee: "The crowd is the sixth man.",
  louisville: "A downtown arena that fills up mean.",
  "grand-canyon": "A new building that already travels badly.",
  "michigan-state": "The student section doesn't sit.",
  arkansas: "They come to yell. It shows in the box.",
  "saint-marys": "A small gym that visitors hate.",
  syracuse: "A dome. The noise has nowhere to go.",
  illinois: "Loud under the rafters from the jump.",
  auburn: "The crowd is the whole point.",
  vcu: "They press you into mistakes.",
  creighton: "A downtown crowd that knows the game.",
  unlv: "A big house with an old bite.",
  memphis: "The city shows up. The floor is loud.",
  ucla: "Banners first. Then the game.",
  wichita: "They don't leave early.",
  "wichita-state": "They don't leave early.",
  nevada: "A Reno night. The gym gets after it.",
  "ohio-state": "A big house that gets loud late.",
  xavier: "A true home crowd, right on the floor.",
  iowa: "They stand for the fight song and stay up.",
  "kansas-state": "The building is a pit. Visitors know.",
  alabama: "The students are right on the court.",
  baylor: "New, tight, and loud from the jump.",
  "murray-state": "A mid-major gym that bites.",
  byu: "A huge campus arena. They travel too.",
  unc: "A big house. The crowd knows the game.",
  marquette: "The city shows up for this one.",
  "texas-tech": "They never sit. Neither should you.",
  "boise-state": "A loud gym at the end of a long trip.",
  butler: "An old fieldhouse that still matters.",
  uconn: "A campus gym. The students are the edge.",
  florida: "A big, loud house.",
  cincinnati: "The floor is right on the crowd.",
  "st-bonaventure": "A small room that gets huge.",
  "virginia-tech": "They come ready. The gym is why.",
  vermont: "Tight, loud, and a long trip.",
  "oral-roberts": "The crowd is the edge.",
  virginia: "A modern house with an old bite.",
  "texas-am": "The crowd treats it like a football night.",
  "penn-state": "A big room. It gets loud when it fills.",
  providence: "A downtown night. The building is on you.",
  oregon: "They stand the whole way.",
  "new-mexico-state": "A desert gym. The trip is the tax.",
  "nc-state": "A loud house when the crowd shows.",
  pitt: "A true home gym. They protect it.",
  maryland: "They get after it from the jump.",
  lsu: "The band doesn't stop.",
  "mississippi-state": "Cowbells in a basketball gym.",
  texas: "A new building on a big stage.",
  clemson: "They stand up. The floor feels smaller.",
  "st-johns": "A New York gym. The crowd is close.",
  richmond: "A true mid-major pit.",
  liberty: "A new arena that already bites.",
  hawaii: "An island trip. The gym is the second problem.",
  utah: "Altitude and noise.",
  minnesota: "A raised floor and an old barn.",
  belmont: "A small, mean gym.",
  "loyola-chicago": "A city gym that knows its history.",
  drake: "The city shows up. The gym is loud.",
  "wake-forest": "A big house that can get mean.",
  fsu: "They get loud. The building helps.",
  "ole-miss": "A new floor with an old crowd.",
  "south-carolina": "A big house. They fill it.",
  oklahoma: "A big home floor. They protect it.",
  michigan: "A big house that can turn a game.",
  "seton-hall": "A downtown arena. The city shows.",
  davidson: "A small gym with a real bite.",
  "colorado-state": "Altitude is on the scouting report.",
  montana: "A mountain gym. The trip is long.",
  villanova: "They know every possession.",
  "notre-dame": "A campus gym. The crowd is close.",
  georgia: "An old coliseum. It still bites.",
  tcu: "A tight home floor.",
  nebraska: "A downtown house that gets loud.",
  washington: "An old gym with a real crowd.",
  wyoming: "Altitude, and a long bus ride.",
  princeton: "An old gym. They take it seriously.",
  akron: "A real mid-major gym.",
  "uc-irvine": "They don't give you easy ones.",
  "south-dakota-state": "A long trip north. The gym finishes it.",
  valparaiso: "An old home floor. They protect it.",
  georgetown: "A downtown arena. The city shows.",
  missouri: "They get loud. The building helps.",
  vanderbilt: "The benches are on the floor. So is the crowd.",
  colorado: "Altitude is the extra defender.",
  "washington-state": "A campus coliseum at the end of a long trip.",
  toledo: "A hard home floor.",
  "weber-state": "A mountain gym.",
  "uc-santa-barbara": "The nickname stuck for a reason.",
  chattanooga: "A true home floor.",
  miami: "A loud house when it fills.",
  usc: "A modern campus gym.",
  "oregon-state": "An old coliseum. They still yell.",
  "georgia-tech": "A tight on-campus gym.",
  "arizona-state": "A desert gym that gets loud.",
  "kent-state": "A real home floor.",
  ohio: "They fill it. Visitors feel it.",
  iona: "A small, loud gym.",
  furman: "A true home court.",
  lipscomb: "A small room that bites.",
  "eastern-washington": "A long road trip, then a loud gym.",
  colgate: "A small, old gym.",
  wofford: "A tight gym. The crowd is close.",
  stanford: "A campus pavilion. They protect it.",
  cal: "An old pavilion with a real crowd.",
  "boston-college": "A campus forum. It gets loud.",
  smu: "An old home floor.",
  buffalo: "A cold-weather gym. The crowd stays.",
  penn: "An old cathedral. The seats are on the floor.",
  northwestern: "A tight, loud room.",
  yale: "A small gym. They take it seriously.",
  harvard: "A small campus gym.",
};

const PLAIN_HOME = [
  "Home court is worth a few points.",
  "Their building. Road teams don't like it.",
  "Not a famous gym. Still a hard place to play.",
  "The crowd is close to the floor.",
  "On-campus gym. They defend it.",
  "They win here more often than they should.",
];

function plainHome(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) | 0;
  return PLAIN_HOME[Math.abs(h) % PLAIN_HOME.length]!;
}

function streakNote(id: string, streak: number, prior: number, careerPct: number, careerG: number) {
  if (streak >= 20) return "Long home winning streak.";
  if (streak >= 12) return `${streak} straight at home.`;
  if (streak >= 8) return `${streak} straight at home. It's loud.`;
  if (streak >= 5) return `${streak} straight at home.`;
  if (streak <= -5) return "They've been losing at home.";
  if (streak <= -3) return "The crowd's been thin lately.";
  if (careerG >= 24 && careerPct >= 0.88) return "One of the hardest places to play.";
  if (careerG >= 12 && careerPct < 0.45) return "Not the home court it used to be.";
  return GYM_LINES[id] ?? (prior >= 90
    ? "Hard place to play. The crowd is the difference."
    : prior >= 82
      ? "They protect this floor."
      : plainHome(id));
}

export function gymScore(state: GameState, id: string) {
  const t = state.teams[id];
  const era = eraOf(state);
  const prior = gymPrior(id, era);
  const seasonW = t?.homeW ?? 0;
  const seasonL = t?.homeL ?? 0;
  const seasonG = seasonW + seasonL;
  const careerW = t?.gymW ?? 0;
  const careerL = t?.gymL ?? 0;
  const careerG = careerW + careerL;
  const careerPct = careerG ? careerW / careerG : prior / 100;
  const seasonPct = seasonG ? seasonW / seasonG : careerPct;
  const streak = t?.homeStreak ?? 0;
  const streakPts = streak > 0
    ? Math.min(18, Math.log2(1 + streak) * 5.1)
    : streak < 0
      ? -Math.min(12, Math.log2(1 - streak) * 4)
      : 0;
  const games = homeGames(state, id);
  const seasonMargin = games.length
    ? games.reduce((n, r) => n + (r.homeScore - r.awayScore), 0) / games.length
    : 0;
  const careerMargin = careerG && t
    ? ((t.gymPf ?? 0) - (t.gymPa ?? 0)) / careerG
    : seasonMargin;
  const marginPts = clamp(seasonG ? seasonMargin : careerMargin, -14, 20) * 0.55;
  const weight = clamp(careerG / 36, 0, 0.74);
  const prestige = t?.prestige ?? TEAM_BY_ID[id]?.prestige ?? 55;
  return (
    prior * (1 - weight) * 0.88
    + careerPct * 100 * weight * 0.72
    + seasonPct * 20
    + streakPts
    + marginPts
    + (prestige - 60) * 0.07
  );
}

export function toughestPlaces(state: GameState): PlaceRow[] {
  const era = eraOf(state);
  const rows: PlaceRow[] = Object.keys(state.teams).map((id) => {
    const t = state.teams[id]!;
    const school = TEAM_BY_ID[id] ?? teamOf(id);
    const prior = gymPrior(id, era);
    const seasonW = t.homeW ?? 0;
    const seasonL = t.homeL ?? 0;
    const careerW = t.gymW ?? 0;
    const careerL = t.gymL ?? 0;
    const careerG = careerW + careerL;
    const careerPct = careerG ? careerW / careerG : prior / 100;
    const games = homeGames(state, id);
    const last = games[games.length - 1];
    const seasonMargin = games.length
      ? games.reduce((n, r) => n + (r.homeScore - r.awayScore), 0) / games.length
      : 0;
    const careerMargin = careerG ? ((t.gymPf ?? 0) - (t.gymPa ?? 0)) / careerG : seasonMargin;
    const score = gymScore(state, id);
    return {
      id,
      rank: 0,
      gym: gymName(id),
      school: school?.name ?? id,
      abbr: school?.abbr ?? id.slice(0, 3).toUpperCase(),
      prior,
      score,
      hca: gymHcaPoints(score),
      seasonW,
      seasonL,
      careerW,
      careerL,
      streak: t.homeStreak ?? 0,
      margin: seasonMargin,
      careerMargin,
      last: last ? `${last.homeScore}–${last.awayScore}` : "—",
      note: streakNote(id, t.homeStreak ?? 0, prior, careerPct, careerG),
    };
  });
  rows.sort((a, b) => b.score - a.score || b.prior - a.prior || a.school.localeCompare(b.school));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function gymHcaPoints(score: number) {
  return clamp(1.6 + ((score - 38) / 62) * 7.4, 1.2, 9.4);
}

/** Possession edge for the live gamecast. Replaces the old flat .08. */
export function gymLiveEdge(state: GameState, homeId: string) {
  const s = gymScore(state, homeId);
  const fac = homeId === state.playerTeamId ? facilityHca(state) : 0;
  return clamp(0.04 + ((s - 40) / 70) * 0.11 + fac * 8, 0.035, 0.16);
}

/** Make-rate bump used by the box sim. */
export function gymSimEdge(state: GameState, homeId: string) {
  const s = gymScore(state, homeId);
  const fac = homeId === state.playerTeamId ? facilityHca(state) : 0;
  return clamp(0.011 + ((s - 40) / 70) * 0.022 + fac, 0.01, 0.038);
}

/** Score-projection multiplier. Neutral stays 1. */
export function gymScoreMult(state: GameState, homeId: string) {
  const s = gymScore(state, homeId);
  return clamp(1.008 + ((s - 40) / 70) * 0.022, 1.007, 1.032);
}

export function gymCrowd(state: GameState, homeId: string) {
  const t = state.teams[homeId];
  const s = gymScore(state, homeId);
  const streak = t?.homeStreak ?? 0;
  const fill = clamp(0.32 + ((s - 35) / 70) * 0.62 + Math.min(0.12, Math.max(0, streak) * 0.012), 0.28, 0.99);
  return { fill, packed: fill >= 0.82 || streak >= 8 };
}

export function gymTease(state: GameState) {
  const board = toughestPlaces(state);
  const top = board[0];
  const you = board.find((r) => r.id === state.playerTeamId);
  const next = state.schedule.find((g) => !g.resultId && !g.declined && (g.homeId === state.playerTeamId || g.awayId === state.playerTeamId));
  if (next && next.homeId !== state.playerTeamId && next.site === "home") {
    const road = board.find((r) => r.id === next.homeId);
    if (road) {
      return {
        head: `#${road.rank} ${road.gym}`,
        note: road.streak > 0
          ? `${road.school} · ${road.streak} in a row at home`
          : `${road.school} · ${road.hca.toFixed(1)} pts of home court`,
      };
    }
  }
  if (you && you.rank <= 25) {
    return {
      head: `Yours is #${you.rank}`,
      note: you.streak > 0 ? `${you.gym} · ${you.streak} straight` : `${you.gym} · ${you.note}`,
    };
  }
  return {
    head: top ? `#1 ${top.gym}` : "Gyms",
    note: top
      ? top.streak > 0
        ? `${top.school} · ${top.streak} in a row`
        : `${top.school} · toughest home court`
      : "Home court, ranked.",
  };
}

export function gymOf(state: GameState, id: string) {
  return toughestPlaces(state).find((r) => r.id === id) ?? null;
}
