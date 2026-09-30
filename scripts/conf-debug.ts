import assert from "node:assert/strict";
import { CONFERENCES, TEAMS, TEAM_BY_ID } from "../src/game/teams";
import { lockSchedule, newDynasty, yourGames } from "../src/game/engine";
import { MAX_PER_WEEK, REGULAR_WEEKS } from "../src/game/types";

function expectedConf(n: number) {
  if (n <= 11 && (n - 1) * 2 <= 20) return (n - 1) * 2;
  const once = n - 1;
  if (n % 2 === 0 && once % 2 === 1) return once - 1;
  return once;
}

const s0 = newDynasty("kentucky", 44, { careerMode: false });
const conf = s0.schedule.filter((g) => g.kind === "conference");
const issues: string[] = [];

for (const c of CONFERENCES) {
  const members = TEAMS.filter((t) => t.conference === c.id).map((t) => t.id);
  const exp = expectedConf(members.length);
  console.log(c.id.padEnd(6), String(members.length).padStart(2), "confGames", exp);
}

for (const t of TEAMS) {
  const g = conf.filter((x) => x.homeId === t.id || x.awayId === t.id);
  const members = TEAMS.filter((x) => x.conference === t.conference).map((x) => x.id);
  const exp = expectedConf(members.length);
  if (g.length !== exp) issues.push(`${t.id} conf games ${g.length} expected ${exp}`);
  const opps = new Map<string, number>();
  const homes = new Map<string, number>();
  const byWeek = new Map<number, number>();
  let home = 0;
  let away = 0;
  for (const x of g) {
    const o = x.homeId === t.id ? x.awayId : x.homeId;
    opps.set(o, (opps.get(o) ?? 0) + 1);
    if (x.homeId === t.id) {
      home++;
      homes.set(o, (homes.get(o) ?? 0) + 1);
    } else away++;
    if (TEAM_BY_ID[o]?.conference !== t.conference) issues.push(`${t.id} vs ${o} cross-conf`);
    byWeek.set(x.week, (byWeek.get(x.week) ?? 0) + 1);
    if (x.week < 6 || x.week > REGULAR_WEEKS) issues.push(`${t.id} conf week ${x.week}`);
  }
  const wantEach = exp === (members.length - 1) * 2 ? 2 : exp === members.length - 1 ? 1 : 0;
  if (wantEach === 2) {
    for (const m of members) {
      if (m === t.id) continue;
      const n = opps.get(m) ?? 0;
      if (n !== 2) issues.push(`${t.id} vs ${m} ${n}x want 2`);
    }
    for (const m of members) {
      if (m === t.id) continue;
      const h = homes.get(m) ?? 0;
      if (h !== 1) issues.push(`${t.id} home vs ${m} ${h}`);
    }
  } else if (wantEach === 1) {
    for (const m of members) {
      if (m === t.id) continue;
      const n = opps.get(m) ?? 0;
      if (n !== 1) issues.push(`${t.id} vs ${m} ${n}x want 1`);
    }
  } else {
    let missed = 0;
    for (const m of members) {
      if (m === t.id) continue;
      const n = opps.get(m) ?? 0;
      if (n > 1) issues.push(`${t.id} vs ${m} ${n}x`);
      if (n === 0) missed++;
    }
    const expectMiss = members.length - 1 - exp;
    if (missed !== expectMiss) issues.push(`${t.id} missed ${missed} want ${expectMiss}`);
  }
  for (const [w, n] of byWeek) if (n > 2) issues.push(`${t.id} week ${w} has ${n} conf`);
  if (Math.abs(home - away) > 1) issues.push(`${t.id} unbalanced H/A ${home}-${away}`);
  if (home === 0 || away === 0) issues.push(`${t.id} never ${home === 0 ? "home" : "away"}`);
}

const week6 = conf.filter((g) => g.week === 6 && (g.homeId === "kentucky" || g.awayId === "kentucky"));
if (week6.length > 1) issues.push(`UK week 6 has ${week6.length} league games`);

const s = lockSchedule(s0);
for (const t of TEAMS) {
  for (let w = 1; w <= REGULAR_WEEKS; w++) {
    const n = s.schedule.filter((g) => !g.declined && g.week === w && (g.homeId === t.id || g.awayId === t.id)).length;
    if (n > MAX_PER_WEEK) issues.push(`LOCKED ${t.id} week ${w} has ${n}`);
  }
}

const uk = yourGames(s).filter((g) => !g.declined && g.kind === "conference");
console.log("UK conf weeks", uk.map((g) => g.week).sort((a, b) => a - b).join(","));
console.log("UK H/A", uk.filter((g) => g.homeId === "kentucky").length, uk.filter((g) => g.awayId === "kentucky").length);

if (issues.length) {
  console.log("ISSUES", issues.length);
  for (const i of issues.slice(0, 80)) console.log(" -", i);
  process.exitCode = 1;
} else {
  console.log("CONF SCHEDULE OK");
}

assert.equal(issues.length, 0);
