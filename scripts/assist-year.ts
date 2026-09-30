import { lockSchedule, newDynasty, setAssistedRecruit, simWeek, startNextSeason } from "../src/game/engine";

let s = setAssistedRecruit(lockSchedule(newDynasty("kentucky", 77, { careerMode: false })), true).state;
let g = 0;
while (s.phase !== "offseason" && g++ < 90) s = { ...simWeek(s), pendingPresser: null };
const you = s.playerTeamId;
console.log("end", s.phase, `${s.teams[you]!.wins}-${s.teams[you]!.losses}`, "offers", s.recruits.filter((r) => r.offers.includes(you)).length, "commits", s.recruits.filter((r) => r.committedTo === you).length);
const starter = s.players.filter((p) => p.teamId === you).sort((a, b) => b.ovr - a.ovr)[0]!;
console.log("games", starter.seasonGames, "played", s.teams[you]!.wins + s.teams[you]!.losses);
s = startNextSeason(s);
console.log("incoming", s.offseasonReport?.incoming);
console.log(
  "roster",
  s.players.filter((p) => p.teamId === you).length,
  s.players
    .filter((p) => p.teamId === you)
    .map((p) => `${p.first} ${p.last} y${p.year}`)
    .slice(0, 8),
);
