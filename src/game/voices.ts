import { hashString, mulberry32, pick, type Rng } from "./rng";

const AD: [string, string][] = [
  ["Helen", "Vargas"],
  ["Rick", "Carr"],
  ["Diane", "Hodge"],
  ["Tom", "Brennan"],
  ["Patricia", "Okoye"],
  ["Marcus", "Yates"],
  ["Elaine", "Palmer"],
  ["Bill", "Whitaker"],
  ["Carla", "Santos"],
  ["Greg", "Ingram"],
  ["Nancy", "Cho"],
  ["Ray", "Bennett"],
];

const TRAINERS: [string, string][] = [
  ["Karen", "Mills"],
  ["Doc", "Ruiz"],
  ["Andre", "Peck"],
  ["Liz", "Han"],
];

const COMPLIANCE: [string, string][] = [
  ["Alicia", "Grant"],
  ["Evan", "Cole"],
  ["Priya", "Shah"],
  ["Dan", "Foley"],
];

const FANS: [string, string][] = [
  ["Derek", "section 112"],
  ["Maya", "season tickets since '09"],
  ["Lonnie", "upper deck"],
  ["Angie", "student section"],
  ["TJ", "the call-in show"],
  ["Rosa", "alumni chapter"],
  ["Chris", "row 8"],
  ["Pat", "been coming since the old gym"],
];

const BOOSTERS: [string, string][] = [
  ["Marsha", "tip-off club"],
  ["Earl", "letterwinner '88"],
  ["Diane", "the golf outing"],
  ["Ken", "NIL collective"],
  ["Sharon", "collective"],
  ["Walt", "wrote a check in '98"],
];

type Staff = { first: string; last: string };

function person(rng: Rng, pool: [string, string][]): Staff {
  const [first, last] = pick(rng, pool);
  return { first, last };
}

export function staffOf(state: { seed: number; playerTeamId: string }) {
  const rng = mulberry32(state.seed ^ hashString(`${state.playerTeamId}:staff`));
  return {
    ad: person(rng, AD),
    trainer: person(rng, TRAINERS),
    compliance: person(rng, COMPLIANCE),
  };
}

export function adName(state: { seed: number; playerTeamId: string }) {
  const a = staffOf(state).ad;
  return `${a.first} ${a.last}`;
}

export function adFirst(state: { seed: number; playerTeamId: string }) {
  return staffOf(state).ad.first;
}

export function adFrom(state: { seed: number; playerTeamId: string }) {
  return `${adName(state)}, Athletic Director`;
}

export function trainerFrom(state: { seed: number; playerTeamId: string }) {
  const t = staffOf(state).trainer;
  return `${t.first} ${t.last}, trainer`;
}

export function trainerFirst(state: { seed: number; playerTeamId: string }) {
  return staffOf(state).trainer.first;
}

export function complianceFrom(state: { seed: number; playerTeamId: string }) {
  const c = staffOf(state).compliance;
  return `${c.first} ${c.last}, compliance`;
}

export function complianceFirst(state: { seed: number; playerTeamId: string }) {
  return staffOf(state).compliance.first;
}

export function fanFrom(rng: Rng) {
  const [name, where] = pick(rng, FANS);
  return `${name} · ${where}`;
}

export function boosterFrom(rng: Rng, nil: boolean) {
  const pool = nil ? BOOSTERS.filter((b) => /NIL|collective/i.test(b[1])) : BOOSTERS.filter((b) => !/NIL|collective/i.test(b[1]));
  const [name, where] = pick(rng, pool.length ? pool : BOOSTERS);
  return `${name} · ${where}`;
}

export function coachFirst(state: { identity?: { first?: string; last?: string } }) {
  const first = state.identity?.first?.trim();
  return first || "Coach";
}
