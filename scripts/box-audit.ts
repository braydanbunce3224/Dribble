import { runAudit } from "../src/game/audit.ts";

const n = Number(process.argv[2] ?? 40);
const out = runAudit(n);
const fmt = (label: string, block: typeof out.live) => {
  console.log(`\n${label} games=${block.games} sides=${block.n}  10+: ${(block.by10 * 100).toFixed(0)}%  20+: ${(block.by20 * 100).toFixed(0)}%`);
  for (const [k, v] of Object.entries(block.stats)) {
    const pct = k === "fg" || k === "tp" || k === "ft";
    const num = (x: number) => (pct ? `${(x * 100).toFixed(1)}%` : x.toFixed(1));
    console.log(`${k.padEnd(4)} avg ${num(v.avg).padStart(6)}  sd ${num(v.sd).padStart(5)}  ${num(v.min)}–${num(v.max)}`);
  }
};
fmt("LIVE", out.live);
fmt("SIM", out.sim);
