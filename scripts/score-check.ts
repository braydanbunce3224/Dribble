import { mulberry32 } from "../src/game/rng";
import { projectScore } from "../src/game/engine-util";
import { beginLiveGame, lockSchedule, newDynasty, runLiveRest, simGame } from "../src/game/engine";

const rng = mulberry32(99);
const equal: number[] = [];
const mismatch: number[] = [];
let under55 = 0;
let over100 = 0;
let blow40 = 0;
let ties = 0;
for (let i = 0; i < 4000; i++) {
  const a = projectScore(rng, 72, 72, { site: "home" });
  equal.push(a.homeScore, a.awayScore);
  if (a.homeScore === a.awayScore) ties++;
  if (a.homeScore < 55 || a.awayScore < 55) under55++;
  if (a.homeScore > 100 || a.awayScore > 100) over100++;
  if (Math.abs(a.homeScore - a.awayScore) >= 40) blow40++;
  const b = projectScore(rng, 84, 62, { site: "home" });
  mismatch.push(b.homeScore - b.awayScore);
}
const mean = equal.reduce((s, n) => s + n, 0) / equal.length;
const varn = equal.reduce((s, n) => s + (n - mean) ** 2, 0) / equal.length;
const mm = mismatch.reduce((s, n) => s + n, 0) / mismatch.length;
console.log("equal mean", mean.toFixed(1), "sd", Math.sqrt(varn).toFixed(1), "ties", ties, "under55", under55, "over100", over100, "blow40", blow40);
console.log("84 vs 62 home margin", mm.toFixed(1));
if (mean < 70 || mean > 78) throw new Error(`mean ${mean}`);
if (under55 > 40) throw new Error(`too many sub-55 ${under55}`);
if (over100 > 8) throw new Error(`too many 100+ ${over100}`);
if (blow40 > 20) throw new Error(`too many 40-pt ${blow40}`);
if (mm < 10 || mm > 26) throw new Error(`mismatch margin ${mm}`);

let s = lockSchedule(newDynasty("kentucky", 77, { careerMode: false }));
const scores: number[] = [];
for (let i = 0; i < 8; i++) {
  s = simGame(s);
  const r = s.results[s.results.length - 1]!;
  scores.push(r.homeScore, r.awayScore);
  if (r.homeScore < 42 || r.awayScore < 42 || r.homeScore > 112 || r.awayScore > 112) {
    throw new Error(`wild ${r.homeScore}-${r.awayScore}`);
  }
}
console.log("uk 8 games", scores.join(","));

let live = lockSchedule(newDynasty("gonzaga", 12, { careerMode: false }));
live = beginLiveGame(live)!;
live = runLiveRest(live);
const lg = live.liveGame;
if (!lg?.done) throw new Error("live not done");
console.log("live final", lg.homeScore, lg.awayScore);
if (lg.homeScore < 40 || lg.awayScore < 40 || lg.homeScore > 115 || lg.awayScore > 115) {
  throw new Error(`live wild ${lg.homeScore}-${lg.awayScore}`);
}
if (Math.abs(lg.homeScore - lg.awayScore) >= 50) {
  throw new Error(`live blowout ${lg.homeScore}-${lg.awayScore}`);
}
console.log("SCORE OK");
