import assert from "node:assert/strict";
import { beginLiveGame, closeLive, goOffseason, lockSchedule, newDynasty, runLivePossession, runLiveRest, simWeek, startNextSeason } from "../src/game/engine";
import { simContest } from "../src/game/sim";
import { boxFaults, topUp } from "../src/game/scoreFloor";
import { endgameMenu, forceEndgameState, forceTwoForState } from "../src/game/liveControls";
import { queueLate } from "../src/game/plays";
import { mulberry32 } from "../src/game/rng";
import { setPractice } from "../src/game/program";
import { portalChance, portalOpen } from "../src/game/portal";
import { hostRoom, readRoom, writeRoom } from "../src/game/sheet";
import type { GameState, RecapPlayer } from "../src/game/types";

const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

function quiet(s: GameState): GameState {
  return { ...s, pendingPresser: null, pendingStory: null };
}

function check(tag: string, lines: RecapPlayer[], team: number) {
  const sum = lines.reduce((n, p) => n + p.pts, 0);
  assert.equal(sum, team, `${tag} sum ${sum} != ${team}`);
  const faults = boxFaults(lines);
  assert.deepEqual(faults, [], `${tag} ${faults.join(" | ")}`);
  const fga = lines.reduce((n, p) => n + p.fga, 0);
  const fgm = lines.reduce((n, p) => n + p.fgm, 0);
  const hog = [...lines].sort((a, b) => b.fga - a.fga)[0];
  if (hog && fga >= 12) assert.ok(hog.fga < fga * 0.8, `${tag} hog ${hog.fga}/${fga}`);
  if (fga >= 30) {
    const fg = fgm / fga;
    assert.ok(fg >= 0.3 && fg <= 0.66, `${tag} fg ${(fg * 100).toFixed(1)}`);
  }
  for (const p of lines) assert.ok(p.pts < 70, `${tag} ${p.name} ${p.pts}`);
}

const monster: RecapPlayer[] = [
  { id: "a", name: "Star", pos: "SG", min: 36, pts: 73, reb: 4, ast: 1, fgm: 36, fga: 38, tpm: 0, tpa: 0, ftm: 1, fta: 1 },
  { id: "b", name: "Two", pos: "PG", min: 32, pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 },
  { id: "c", name: "Three", pos: "SF", min: 30, pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 },
  { id: "d", name: "Four", pos: "PF", min: 28, pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 },
  { id: "e", name: "Five", pos: "C", min: 24, pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 },
  { id: "f", name: "Six", pos: "SG", min: 14, pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 },
];
topUp(monster, 73);
check("monster rebuild", monster, 73);
console.log("monster star", monster.slice().sort((a, b) => b.pts - a.pts)[0]);

let pts = 0;
let fga = 0;
let fgm = 0;
let sides = 0;
for (let i = 0; i < 15; i++) {
  const s = lockSchedule(newDynasty("duke", 400 + i, { careerMode: false }));
  const slot = s.schedule.find((g) => g.homeId === "duke" || g.awayId === "duke")!;
  const g = simContest(s, slot.homeId, slot.awayId, mulberry32(9000 + i), { site: slot.homeId === "duke" ? "home" : "away" });
  check(`sim ${i} home`, g.homeLines, g.homeScore);
  check(`sim ${i} away`, g.awayLines, g.awayScore);
  assert.ok(g.homeScore >= 40 && g.homeScore <= 130, `home ${g.homeScore}`);
  assert.ok(g.awayScore >= 40 && g.awayScore <= 130, `away ${g.awayScore}`);
  for (const lines of [g.homeLines, g.awayLines]) {
    pts += lines.reduce((n, p) => n + p.pts, 0);
    fga += lines.reduce((n, p) => n + p.fga, 0);
    fgm += lines.reduce((n, p) => n + p.fgm, 0);
    sides++;
  }
}
const ppg = pts / sides;
const fg = fgm / fga;
console.log(`sim band ppg ${ppg.toFixed(1)} fg ${(fg * 100).toFixed(1)}% n=${sides}`);
assert.ok(ppg >= 64 && ppg <= 80, `ppg ${ppg}`);
assert.ok(fg >= 0.4 && fg <= 0.5, `fg ${fg}`);

for (let i = 0; i < 4; i++) {
  let s = lockSchedule(newDynasty("kansas", 70 + i, { careerMode: false }));
  const started = beginLiveGame(s);
  assert.ok(started?.liveGame);
  s = forceEndgameState(started!);
  s = runLiveRest(s);
  assert.ok(s.liveGame?.done);
  const hs = s.liveGame!.homeScore;
  const as = s.liveGame!.awayScore;
  assert.ok(hs >= 40 && as >= 40, `forced ${hs}-${as}`);
  check(`forced ${i} home`, s.liveGame!.homeLines ?? [], hs);
  check(`forced ${i} away`, s.liveGame!.awayLines ?? [], as);
  s = closeLive(s);
  const last = s.results[s.results.length - 1]!;
  assert.equal(last.homeScore, hs);
  assert.equal(last.awayScore, as);
}

let live = lockSchedule(newDynasty("gonzaga", 11, { careerMode: false }));
const tip = beginLiveGame(live);
assert.ok(tip?.liveGame);
live = forceTwoForState(tip!);
const menu = endgameMenu(live);
assert.ok(menu.some((m) => m.label === "2-for-1"), `menu ${menu.map((m) => m.label).join(",")}`);
const clock0 = live.liveGame!.clock;
const queued = queueLate(live, "twofor");
assert.equal(queued.liveGame?.pace, "fast");
assert.equal(queued.liveGame?.offCall, "push");
assert.equal(queued.liveGame?.lateChoice, "twofor");
const played = runLivePossession(queued);
const used = clock0 - (played.liveGame?.clock ?? 0);
assert.ok(used >= 4 && used <= 12, `2-for-1 used ${used}s`);
assert.ok((played.liveGame?.log ?? []).some((e) => e.text.includes("2-for-1")), "log missing 2-for-1");
assert.ok((played.liveGame?.homeScore ?? 0) >= 48 && (played.liveGame?.homeScore ?? 0) < 140);

const you = live.playerTeamId;
const youHome = live.liveGame!.homeId === you;
const wrong: GameState = {
  ...live,
  liveGame: {
    ...live.liveGame!,
    clock: 8 * 60,
    half: 2,
    poss: youHome ? "home" : "away",
    homeScore: youHome ? 50 : 62,
    awayScore: youHome ? 62 : 50,
    planned: true,
    done: false,
    lateChoice: null,
  },
};
assert.equal(endgameMenu(wrong).some((m) => m.id === "twofor"), false, "2-for-1 showed down 12 at 8:00");

let foul = beginLiveGame(lockSchedule(newDynasty("villanova", 4, { careerMode: false })))!;
foul = forceEndgameState(foul);
const foulMenu = endgameMenu(foul);
assert.ok(foulMenu.some((m) => m.label === "Foul up 3"));
assert.ok(foulMenu.some((m) => m.label === "Don't foul"));
assert.equal(foulMenu.some((m) => m.id === "twofor"), false);
const held = runLivePossession(queueLate(foul, "letplay"));
assert.ok((held.liveGame?.log ?? []).some((e) => e.text.includes("Don't foul")));

const base = lockSchedule(newDynasty("dayton", 8, { careerMode: true }));
const before = base.players.filter((p) => p.teamId === "dayton").map((p) => p.skills.iq + p.skills.shoot + p.skills.finish + p.skills.defense);
const film = setPractice(base, "film");
const after = film.state.players.filter((p) => p.teamId === "dayton").map((p) => p.skills.iq + p.skills.shoot + p.skills.finish + p.skills.defense);
assert.ok(after.some((n, i) => n === (before[i] ?? 0) + 1), "practice did not move a rating");
assert.ok(film.feedback.parts.some((p) => p.delta === 1));
assert.ok(film.state.players.some((p) => p.growth?.some((g) => g.note?.includes("+1") && g.note.includes("film"))));
assert.equal(setPractice(film.state, "rest").state.practice, "rest");

const code = hostRoom("abc");
writeRoom(code, "{\"ok\":true}");
assert.equal(readRoom(code), "{\"ok\":true}");

console.log("box, 2-for-1, practice, room ok");

let year = lockSchedule(newDynasty("belmont", 21, { careerMode: true }));
let guard = 0;
while (year.phase !== "offseason" && guard++ < 48) {
  if (portalOpen(year)) break;
  year = quiet(simWeek(year));
}
if (portalOpen(year)) {
  const t = year.portal?.transfers?.[0];
  if (t) {
    const chance = portalChance(year, t);
    assert.ok(chance >= 1 && chance <= 96, `land ${chance}`);
    console.log("portal land", chance, t.first, t.last);
  } else console.log("portal open, no names yet");
} else console.log("portal not open in this run", year.phase, year.week);

guard = 0;
while (year.phase !== "offseason" && guard++ < 48) year = quiet(simWeek(year));
if (year.phase !== "offseason") year = goOffseason(year);
assert.ok((year.history.log ?? []).length >= 1, "no archive row");
const row = year.history.log[year.history.log.length - 1]!;
assert.ok(row.championId, "no champion");
assert.ok((row.boxes ?? []).length > 0, "no boxes");
assert.ok((row.standings ?? []).length > 0, "no standings");
year = startNextSeason(year);
guard = 0;
while (year.phase !== "offseason" && guard++ < 48) year = quiet(simWeek(year));
if (year.phase !== "offseason") year = goOffseason(year);
assert.ok(year.history.log.length >= 2, `log ${year.history.log.length}`);
const prior = year.history.log[0]!;
assert.ok(prior.championId && (prior.boxes ?? []).length > 0);
console.log("archives", year.history.log.map((r) => `${r.season} champ ${r.championId} boxes ${r.boxes?.length} awards ${r.awards?.length}`).join(" | "));
console.log("HOLDBACK OK");
