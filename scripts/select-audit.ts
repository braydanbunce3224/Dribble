import { lockSchedule, newDynasty, setAssistedRecruit, simWeek, startNextSeason } from "../src/game/engine";
import { committeeScore } from "../src/game/selection";
import { kenpom, netRanks } from "../src/game/ranks";
import { packedSize } from "../src/game/persist";
import { hydrateState } from "../src/game/develop";
import type { GameState } from "../src/game/types";

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

function toSelection(s: GameState): GameState {
  s = setAssistedRecruit(s, true).state;
  if (s.phase === "preseason") s = lockSchedule(s);
  let g = 0;
  while (s.phase !== "selection" && s.phase !== "offseason" && g++ < 90) s = tick(s);
  if (s.phase === "selection" && !s.selection?.revealed) s = tick(s);
  return s;
}

function report(s: GameState, tag: string) {
  const you = s.playerTeamId;
  const t = s.teams[you]!;
  const bid = s.selection?.ncaa.find((b) => b.teamId === you);
  const kp = kenpom(s);
  const net = netRanks(s);
  const kr = kp.findIndex((r) => r.id === you) + 1;
  const nr = net.findIndex((r) => r.id === you) + 1;
  const ranked = Object.values(s.teams).sort((a, b) => committeeScore(s, b.id) - committeeScore(s, a.id));
  const cr = ranked.findIndex((x) => x.id === you) + 1;
  const path = bid ? `${bid.seed} ${bid.region} ${bid.path}${bid.playIn ? " FF" : ""}` : s.selection?.nit.includes(you) ? "NIT" : s.selection?.crown.includes(you) ? "CBI" : "home";
  console.log(
    tag,
    `${t.wins}-${t.losses}`,
    `conf ${t.confW}-${t.confL}`,
    `KP ${kr}`,
    `NET ${nr}`,
    `committee ${cr} (${committeeScore(s, you).toFixed(1)})`,
    path,
    `field ${s.selection?.ncaa.length}`,
    `file ${(packedSize(s) / 1e6).toFixed(2)}MB`,
  );
  return { path, wins: t.wins, losses: t.losses, kr, cr };
}

const issues: string[] = [];
const schools = ["kentucky", "duke", "gonzaga", "virginia", "vermont"] as const;
for (const id of schools) {
  let s = newDynasty(id, 2026 + id.length, { careerMode: false });
  s = toSelection(s);
  const r = report(s, id);
  if (id === "kentucky" || id === "duke") {
    if (r.wins - r.losses >= 8 && r.path === "NIT") issues.push(`${id} ${r.wins}-${r.losses} went NIT (KP ${r.kr} committee ${r.cr})`);
    if (r.wins >= 22 && !r.path.includes("East") && !r.path.includes("West") && !r.path.includes("South") && !r.path.includes("Midwest") && r.path !== "NIT" && r.path !== "CBI" && r.path !== "home") {
      /* seed line already has region */
    }
    if (r.wins >= 22 && r.path === "NIT") issues.push(`${id} ${r.wins}-${r.losses} should be in the 68`);
  }
  const raw = JSON.stringify(s);
  const back = hydrateState(JSON.parse(raw));
  if (back.playerTeamId !== s.playerTeamId) issues.push(`${id} hydrate lost team`);
  if (back.selection?.ncaa.length !== s.selection?.ncaa.length) issues.push(`${id} hydrate field ${back.selection?.ncaa.length}`);
}

let s = newDynasty("kentucky", 9, { careerMode: false });
for (let y = 1; y <= 2; y++) {
  if (y > 1) s = startNextSeason(s);
  s = toSelection(s);
  report(s, `UK y${y} sel`);
  let g = 0;
  while (s.phase !== "offseason" && g++ < 40) s = tick(s);
  report(s, `UK y${y} off`);
  if (packedSize(s) > 4_500_000) issues.push(`y${y} file ${(packedSize(s) / 1e6).toFixed(2)}MB`);
}

console.log(issues.length ? `ISSUES\n${issues.join("\n")}` : "SELECT AUDIT OK");
if (issues.length) process.exit(1);
