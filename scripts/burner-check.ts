import assert from "node:assert/strict";
import { lockSchedule, newDynasty, simWeek } from "../src/game/engine";
import { burnerFeed, burnerSlash, staffCoachName } from "../src/game/burner";
import type { GameState } from "../src/game/types";

function tick(s: GameState): GameState {
  return { ...simWeek(s), pendingPresser: null, pendingStory: null };
}

function longBodies(s: GameState, channel?: string) {
  return burnerFeed(s)
    .messages.filter((m) => (!channel || m.channel === channel) && m.body.length > 22)
    .map((m) => m.body);
}

function assertUnique(label: string, lines: string[]) {
  const uniq = new Set(lines);
  if (uniq.size !== lines.length) {
    const seen = new Set<string>();
    const dups = lines.filter((l) => {
      if (seen.has(l)) return true;
      seen.add(l);
      return false;
    });
    throw new Error(`${label} repeats: ${dups.slice(0, 4).join(" | ")}`);
  }
}

let s = lockSchedule(
  newDynasty("kentucky", 2026, {
    careerMode: false,
    identity: { first: "Pat", last: "Lane", age: 41, almaMaterId: "kentucky" },
  }),
);

const pre = burnerFeed(s);
assert.equal(pre.server, "The Burner");
assert.ok(pre.users.some((u) => u.id === "trilly" && u.name === "Trilly Donovan"));
assert.ok(pre.channels.some((c) => c.id === "carousel"));
assert.ok(pre.channels.some((c) => c.id === "portal"));
assert.ok(pre.channels.some((c) => c.id === "lounge"));
assert.ok(pre.messages.length >= 18, `thin feed ${pre.messages.length}`);
assert.ok(pre.users.some((u) => u.name === "Chiefbogans"));
assert.ok(pre.users.some((u) => u.name === "trill Spivey"));
assert.ok(pre.messages.some((m) => m.userId === "chief"), "Chiefbogans silent");
assert.ok(pre.messages.some((m) => m.userId === "spivey"), "trill Spivey silent");
assert.ok(pre.messages.filter((m) => m.userId === "chief").length >= 2, "Chiefbogans too quiet");
assert.ok(pre.users.some((u) => u.name === "TravisSteeleLover"));
assert.ok(pre.messages.some((m) => m.userId === "travis"), "TravisSteeleLover silent");
assert.ok(pre.messages.filter((m) => m.userId === "travis").length >= 2, "TravisSteeleLover too quiet");
assert.ok(pre.users.some((u) => u.name === "notbb32"));
assert.ok(pre.messages.some((m) => m.userId === "notbb"), "notbb32 silent");
assert.ok(pre.messages.filter((m) => m.userId === "notbb").length >= 2, "notbb32 too quiet");
assert.ok(pre.users.some((u) => u.name === "Sassifrass_"));
assert.ok(pre.messages.some((m) => m.userId === "sass"), "Sassifrass_ silent");
assert.ok(pre.messages.filter((m) => m.userId === "sass").length >= 2, "Sassifrass_ too quiet");
assert.ok(pre.users.some((u) => u.name === "justwarcat"));
assert.ok(pre.messages.some((m) => m.userId === "warcat"), "justwarcat silent");
assert.ok(pre.messages.filter((m) => m.userId === "warcat").length >= 2, "justwarcat too quiet");
assert.ok(pre.users.some((u) => u.name === "bontemps"));
assert.ok(pre.messages.some((m) => m.userId === "bontemps"), "bontemps silent");
assert.ok(pre.messages.filter((m) => m.userId === "bontemps").length >= 2, "bontemps too quiet");
assert.ok(pre.users.some((u) => u.name === "lando.marshall"));
assert.ok(pre.messages.some((m) => m.userId === "lando"), "lando.marshall silent");
assert.ok(pre.messages.filter((m) => m.userId === "lando").length >= 2, "lando.marshall too quiet");
assert.ok(pre.users.some((u) => u.name === "reborne"));
assert.ok(pre.messages.some((m) => m.userId === "reborne"), "reborne silent");
assert.ok(pre.messages.filter((m) => m.userId === "reborne").length >= 2, "reborne too quiet");
assert.ok(pre.users.some((u) => u.name === "Angelyne-1v1"));
assert.ok(pre.messages.some((m) => m.userId === "angelyne"), "Angelyne-1v1 silent");
assert.ok(pre.messages.filter((m) => m.userId === "angelyne").length >= 2, "Angelyne-1v1 too quiet");
assert.ok(pre.users.some((u) => u.name === "bLuRbonics"));
assert.ok(pre.messages.some((m) => m.userId === "blur"), "bLuRbonics silent");
assert.ok(pre.messages.filter((m) => m.userId === "blur").length >= 2, "bLuRbonics too quiet");
assert.ok(pre.messages.every((m) => !/\b0-0\b/.test(m.body)), "preseason 0-0 record talk");
assert.ok(pre.messages.every((m) => !/is not what they hired/.test(m.body)));
assert.ok(
  pre.messages.every((m) => !m.reactions || m.reactions.every((r) => !/^(this|facts|fire|W|cooked|L)$/.test(r.label))),
  "text reactions",
);
assert.ok(pre.messages.some((m) => m.reactions?.some((r) => /[🔥💀👀😂]/.test(r.label))), "no emoji reacts");
assert.ok(pre.users.some((u) => u.bot && u.name === "Burner Watch"));
assert.ok(pre.messages.some((m) => m.embed && m.userId === "watch"), "no webhook embed");
{
  const byId = new Map(pre.messages.map((m) => [m.id, m]));
  const replies = pre.messages.filter((m) => m.replyTo);
  assert.ok(replies.length >= 3, "no replies to check");
  for (const m of replies) {
    const parent = byId.get(m.replyTo!);
    assert.ok(parent, `orphan reply ${m.id}`);
    assert.ok(
      m.minutesAgo < parent!.minutesAgo,
      `reply before parent: ${m.id} ${m.minutesAgo} vs ${parent!.id} ${parent!.minutesAgo}`,
    );
  }
}
assert.ok(pre.messages.some((m) => m.system), "no system pin");
assert.ok(pre.messages.every((m) => !m.embed || !m.embed.fields.some((f) => f.value.includes("{"))));
const slash = burnerSlash(s, "hotseats");
assert.equal(slash.command, "/hotseats");
assert.ok(slash.embed.fields[0]!.value.length > 8);
assert.ok(burnerSlash(s, "week").embed.title.toLowerCase().includes("carousel"));
assert.equal(staffCoachName(s, "kentucky"), "Pat Lane");
assert.notEqual(staffCoachName(s, "duke"), "Staff");
assert.notEqual(staffCoachName(s, "duke"), staffCoachName(s, "unc"));

const again = burnerFeed(s);
assert.deepEqual(
  again.messages.map((m) => m.body),
  pre.messages.map((m) => m.body),
  "same week must be stable",
);

assertUnique("pre carousel", longBodies(s, "carousel"));
assertUnique("pre portal", longBodies(s, "portal"));
assertUnique("pre lounge", longBodies(s, "lounge"));

for (let i = 0; i < 8; i++) s = tick(s);
const mid = burnerFeed(s);
assert.ok(mid.messages.length >= 20, `mid thin ${mid.messages.length}`);
assert.notDeepEqual(
  mid.messages.map((m) => m.body),
  pre.messages.map((m) => m.body),
  "later week must change the chat",
);
assert.ok(mid.messages.every((m) => !m.body.includes("{")));
assertUnique("mid carousel", longBodies(s, "carousel"));
assertUnique("mid portal", longBodies(s, "portal"));
assertUnique("mid lounge", longBodies(s, "lounge"));
assert.ok(
  mid.messages.some((m) => /Pat Lane|Lexington/.test(m.body)),
  "user job missing from chatter",
);

const era = lockSchedule(
  newDynasty("ucla", 1960, {
    careerMode: false,
    eraDecade: 1960,
    identity: { first: "John", last: "Wood", age: 48, almaMaterId: "ucla" },
  }),
);
const old = burnerFeed(era);
assert.ok(old.channels.some((c) => c.id === "portal" && c.label === "transfers"));
assert.ok(!old.messages.some((m) => /\bNIL\b/.test(m.body)), "NIL in 1960");
assert.ok(old.messages.some((m) => /sit/i.test(m.body)), "no sit-out talk in 1960");
assert.ok(old.messages.every((m) => !m.body.includes("{")));

console.log("FEED", pre.messages.length, "MID", mid.messages.length, "ERA", old.messages.length);
console.log("BURNER OK");
