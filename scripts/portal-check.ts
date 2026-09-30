import {
  lockSchedule, newDynasty, offerPortal, scoutPortal, signPortal, simWeek, startNextSeason,
  visitPortal, portalOf, portalOpen, settleDraft,
} from "../src/game/engine";
import type { GameState } from "../src/game/types";

const issues: string[] = [];
function note(m: string) {
  issues.push(m);
  console.log("ISSUE", m);
}

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null };
}

console.log("— ERA 1960 none —");
let s = lockSchedule(newDynasty("kentucky", 3, { careerMode: false, eraDecade: 1960, identity: { first: "Era", last: "None", age: 44, almaMaterId: "kentucky" } }));
if (portalOf(s).window !== "none") note(`1960 window ${portalOf(s).window}`);
let g = 0;
while (s.phase === "regular" && s.week < 12 && g++ < 20) s = tick(s);
if (portalOpen(s)) note("1960 portal opened in winter");
console.log("1960", portalOf(s).window, "transfers", portalOf(s).transfers.length);

console.log("— ERA 2010 spring only —");
s = lockSchedule(newDynasty("duke", 9, { careerMode: false, eraDecade: 2010, identity: { first: "Era", last: "Ten", age: 42, almaMaterId: "duke" } }));
g = 0;
while (s.phase === "regular" && s.week < 12 && g++ < 20) s = tick(s);
if (portalOf(s).window === "winter") note("2010 winter window should be closed");
g = 0;
while (s.phase !== "offseason" && g++ < 80) s = tick(s);
if (s.phase !== "offseason") note("2010 never reached offseason");
if (!portalOpen(s) || portalOf(s).window !== "spring") note(`2010 spring ${portalOf(s).window}`);
if (portalOf(s).transfers.length < 20) note(`2010 spring thin ${portalOf(s).transfers.length}`);
console.log("2010 spring", portalOf(s).transfers.length, "hours", portalOf(s).hours);

console.log("— MODERN winter —");
s = lockSchedule(newDynasty("kentucky", 21, { careerMode: false, identity: { first: "Port", last: "Check", age: 40, almaMaterId: "kentucky" } }));
if (portalOpen(s)) note("winter open in preseason/week1");
g = 0;
while (s.phase === "regular" && s.week < 8 && g++ < 20) s = tick(s);
if (s.week < 8) note(`never reached week 8 (w${s.week} ${s.phase})`);
if (!portalOpen(s) || portalOf(s).window !== "winter") note(`week ${s.week} window ${portalOf(s).window}`);
const n = portalOf(s).transfers.length;
if (n < 25 || n > 90) note(`winter pool ${n}`);
const yours = portalOf(s).transfers.filter((t) => t.fromId === s.playerTeamId);
console.log("WINTER", n, "yours", yours.length, "hours", portalOf(s).hours, "week", s.week);
const byTeam = new Map<string, number>();
for (const t of portalOf(s).transfers) byTeam.set(t.fromId, (byTeam.get(t.fromId) ?? 0) + 1);
for (const [id, c] of byTeam) {
  if (c > 3) note(`${id} winter left ${c}`);
}
for (const team of Object.keys(s.teams)) {
  const keep = s.players.filter((p) => p.teamId === team).length;
  if (keep < 8) note(`${team} roster ${keep} after winter`);
}

const t = portalOf(s).transfers.filter((x) => !x.committedTo && x.fromId !== s.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0];
if (!t) note("no unsigned winter name");
else {
  s = { ...s, portal: { ...portalOf(s), hours: 12 } };
  s = scoutPortal(s, t.id).state;
  s = offerPortal(s, t.id).state;
  s = visitPortal(s, t.id).state;
  const signed = signPortal(s, t.id, () => 0).state;
  const on = signed.players.find((p) => p.id === t.playerId);
  if (!on || on.teamId !== s.playerTeamId) note("winter sign did not land on roster");
  else if (on.portalFrom !== t.fromId) note("portalFrom missing");
  else console.log("SIGN", t.first, t.last, "ovr", t.ovr, "from", t.fromId, "mpg", on.mpg);
  s = signed;
}

console.log("— SPRING enroll —");
s = lockSchedule(newDynasty("gonzaga", 33, { careerMode: false, identity: { first: "Spring", last: "Check", age: 41, almaMaterId: "gonzaga" } }));
g = 0;
while (s.phase !== "offseason" && g++ < 90) s = tick(s);
s = settleDraft(s);
if (!portalOpen(s)) note("spring not open in offseason");
const spring = portalOf(s).transfers;
if (spring.length < 30) note(`spring pool ${spring.length}`);
console.log("SPRING", spring.length, "window", portalOf(s).window, "hours", portalOf(s).hours);
const pickT = spring.filter((x) => !x.committedTo).sort((a, b) => a.stars - b.stars || b.ovr - a.ovr)[0];
let signedOk = false;
if (pickT) {
  s = { ...s, portal: { ...portalOf(s), hours: 12 } };
  s = scoutPortal(s, pickT.id).state;
  s = offerPortal(s, pickT.id).state;
  s = signPortal(s, pickT.id, () => 0).state;
  signedOk = portalOf(s).transfers.some((x) => x.id === pickT.id && x.committedTo === s.playerTeamId);
  if (!signedOk) note("spring sign did not commit");
}
const before = s.players.filter((p) => p.teamId === s.playerTeamId).length;
s = startNextSeason(s);
const after = s.players.filter((p) => p.teamId === s.playerTeamId);
if (after.length !== 13) note(`next roster ${after.length}`);
if (portalOpen(s)) note("portal still open in preseason");
if (signedOk && pickT && !after.some((p) => p.id === pickT.playerId)) {
  note("spring commit did not enroll");
}
if (pickT) {
  const landed = after.find((p) => p.id === pickT.playerId);
  if (landed) console.log("ENROLL", landed.first, landed.last, "year", landed.year, "from", landed.portalFrom);
  else console.log("ENROLL missed", pickT.first, "before", before, "after", after.length);
}

if (issues.length) {
  console.log("ISSUES", issues.length);
  process.exit(1);
}
console.log("ISSUES", 0);
