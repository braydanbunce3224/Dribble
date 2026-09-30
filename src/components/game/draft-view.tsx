import { useGame } from "@/game/store";
import { bandLabel, draftWaiting, mockBoard } from "@/game/engine";
import { teamOf } from "@/game/teams";
import { bindTap } from "@/lib/tap";
import { PRO_TEAMS } from "@/game/depth";
import type { DraftPick } from "@/game/types";

function schoolOf(teamId: string) {
  return teamOf(teamId).name;
}

function clubOf(p: DraftPick) {
  return p.proName ?? PRO_TEAMS[(Math.max(1, p.pick) - 1) % PRO_TEAMS.length]?.name ?? "the league";
}

function PickRow({ p, live }: { p: DraftPick; live?: boolean }) {
  return (
    <li className="flex justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className="tabular-nums text-muted">{live ? (p.round === 1 ? "R1" : "R2") : `${p.pick}.`}</span>{" "}
        {live ? `${p.pick} ` : null}
        {p.name}
        {p.yours ? <span className="ml-1 text-xs text-accent">yours</span> : null}
        <span className="mt-0.5 block text-xs text-muted">
          {schoolOf(p.teamId)} · {p.pos}
        </span>
      </span>
      <span className="shrink-0 text-right text-xs text-muted">{clubOf(p)}</span>
    </li>
  );
}

export function DraftView() {
  const { state, talkStay, letGo, setView } = useGame();
  if (!state) return null;
  const d = state.draft;
  const waiting = draftWaiting(state);
  const rows = d?.rows ?? [];
  const open = rows.filter((r) => !r.decided);
  const league = (d?.league ?? []).slice().sort((a, b) => a.pick - b.pick);
  const mock = !league.length ? mockBoard(state).slice(0, 30) : [];
  const history = state.proHistory ?? [];

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Stay or go</p>
        <h1 className="font-display mt-1 text-3xl">Draft</h1>
        <p className="mt-1 text-sm text-muted">
          {waiting
            ? "Underclassmen on your roster have a decision. Talk him into staying, or let him walk."
            : d?.league.length
              ? "The window is closed. Here's who left school — and which NBA club called."
              : "Nobody on your roster is in this draft. The mock is still live."}
        </p>
      </div>

      {open.map((r) => (
        <div key={r.playerId} className="rounded-xl border border-border bg-elevated p-4">
          <p className="font-semibold">
            {r.name} <span className="text-xs font-normal text-muted">{r.pos} · {r.ovr} overall</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {bandLabel(r.band)} · stay {r.stayChance}% · {r.mpg} mpg
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-accent font-semibold text-accent-fg"
              {...bindTap(() => talkStay(r.playerId))}
            >
              Talk him into staying
            </button>
            <button
              type="button"
              className="min-h-12 rounded-lg bg-elevated font-semibold"
              {...bindTap(() => letGo(r.playerId))}
            >
              Let him go
            </button>
          </div>
        </div>
      ))}

      {rows.filter((r) => r.decided).map((r) => (
        <p key={r.playerId} className="text-sm text-muted">
          {r.name} — {r.decided === "stay" ? "coming back" : "declared"}
        </p>
      ))}

      {mock.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Mock draft</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {mock.map((p) => (
              <PickRow key={`${p.playerId}-${p.pick}`} p={p} />
            ))}
          </ul>
        </div>
      )}

      {league.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Draft results · {PRO_TEAMS.length} clubs</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {league.slice(0, 30).map((p) => (
              <PickRow key={`${p.playerId}-${p.pick}`} p={p} live />
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Draft history</p>
          <ul className="mt-3 flex flex-col gap-2">
            {history.slice(0, 6).map((row) => {
              const first = row.picks[0];
              const school = first ? schoolOf(first.teamId) : "";
              return (
                <li key={row.season} className="text-sm">
                  <span className="font-semibold">{row.season}</span>
                  <span className="text-muted">
                    {" "}
                    · {row.picks.length} names
                    {first ? ` · 1. ${first.name}, ${school} — ${clubOf(first)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}