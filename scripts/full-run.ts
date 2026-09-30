import { lockSchedule, newDynasty, setAssistedRecruit, simWeek, startNextSeason } from "../src/game/engine";
import type { GameState } from "../src/game/types";
import { hofScore, playthroughId } from "../src/game/hof";

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null };
}

function runYear(s: GameState) {
  s = setAssistedRecruit(s, true).state;
  s = lockSchedule(s);
  let g = 0;
  while (s.phase !== "offseason" && g++ < 80) s = tick(s);
  if (s.phase !== "offseason") throw new Error(`stuck ${s.phase} w${s.week}`);
  const you = s.teams[s.playerTeamId]!;
  const bid = s.selection?.ncaa.find((b) => b.teamId === s.playerTeamId);
  const row = {
    season: s.season,
    rec: `${you.wins}-${you.losses}`,
    conf: `${you.confW}-${you.confL}`,
    path: bid ? `${bid.seed} ${bid.region}` : s.selection?.nit.includes(s.playerTeamId) ? "NIT" : "home",
    champ: s.selection?.champ ?? "?",
    title: s.selection?.champ === s.playerTeamId,
    field: s.selection?.ncaa.length ?? 0,
  };
  const ties = s.results.filter((r) => r.homeScore === r.awayScore).length;
  const wild = s.results.filter((r) => r.homeScore < 45 || r.awayScore < 45 || r.homeScore > 118 || r.awayScore > 118).length;
  const nan = s.results.some((r) => !Number.isFinite(r.homeScore) || !Number.isFinite(r.awayScore));
  return { s, row, ties, wild, nan };
}

let s = newDynasty("kentucky", 2026, {
  careerMode: false,
  identity: { first: "Hall", last: "Fame", age: 42, almaMaterId: "kentucky" },
});
const years = [];
for (let y = 1; y <= 3; y++) {
  if (y > 1) s = startNextSeason(s);
  const r = runYear(s);
  s = r.s;
  years.push(r.row);
  if (r.ties) console.log("TIES", r.ties);
  if (r.wild) console.log("WILD", r.wild);
  if (r.nan) console.log("NAN scores");
  console.log(`Y${y}`, r.row.season, r.row.rec, "conf", r.row.conf, r.row.path, "champ", r.row.champ, r.row.title ? "TITLE" : "", "field", r.row.field);
}

const hist = s.history;
const fake = {
  id: playthroughId(s),
  coach: "Hall Fame",
  teamId: s.playerTeamId,
  teamName: "Lexington",
  seasons: hist.log.length,
  wins: hist.wins,
  losses: hist.losses,
  titles: hist.titles,
  ncaaBids: hist.ncaaBids,
  confTitles: hist.confTitles,
  careerMode: false,
  eraDecade: null,
  lastSeason: s.season,
  highlight: hist.titles ? "national title" : `${hist.wins}-${hist.losses}`,
  updatedAt: 0,
};
console.log("HOF", fake.seasons, "seasons", fake.wins, fake.losses, "titles", fake.titles, "bids", fake.ncaaBids, "score", hofScore(fake));
if (hist.log.length !== 3) throw new Error(`log ${hist.log.length}`);
if (!s.selection?.champ) throw new Error("no champ year 3");
console.log("FULL RUN OK");
