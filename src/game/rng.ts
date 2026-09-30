export type Rng = () => number;

export function mulberry32(a: number): Rng {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function pick<T>(rng: Rng, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

export function randInt(rng: Rng, lo: number, hi: number) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function gaussian(rng: Rng) {
  let u = 0;
  let v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
