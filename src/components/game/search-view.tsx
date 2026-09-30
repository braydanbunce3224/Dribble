import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { searchPeople } from "@/game/engine";
import { bindTap } from "@/lib/tap";

export function SearchView() {
  const { state, setView, seek, openPlayer, openTeam } = useGame();
  const [q, setQ] = useState(seek || "");
  useEffect(() => {
    if (seek) setQ(seek);
  }, [seek]);
  const hits = useMemo(() => (state ? searchPeople(state, q) : []), [state, q]);
  if (!state) return null;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Find someone</p>
        <h1 className="font-display mt-1 text-3xl">Search</h1>
        <p className="mt-1 text-sm text-muted">Players, recruits, transfers, programs. Type two letters.</p>
      </div>
      <input
        className="h-12 rounded-lg border border-border bg-elevated px-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name or position…"
        autoFocus
      />
      {q.trim().length >= 2 && hits.length === 0 && (
        <p className="rounded-xl border border-border bg-elevated px-4 py-5 text-sm text-muted">Nobody matches. Try a last name or PG / C.</p>
      )}
      <ul className="flex flex-col gap-1">
        {hits.map((h) => (
          <li key={`${h.kind}-${h.id}`}>
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 text-left"
              {...bindTap(() => {
                if (h.kind === "player") openPlayer(h.id);
                else if (h.kind === "team") openTeam(h.id);
                else setView("recruiting");
              })}
            >
              <span>
                <span className="block font-semibold">{h.name}</span>
                <span className="text-xs text-muted">{h.line}</span>
              </span>
              <span className="text-[11px] tracking-[0.14em] text-subtle uppercase">{h.kind}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
