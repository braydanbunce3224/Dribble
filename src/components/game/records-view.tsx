import { useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { bookLines, conferenceLeaders, fmtRate, leadersOf, rivalryTease, yourRivals } from "@/game/engine";
import { bindTap } from "@/lib/tap";
import type { LeaderRow, LeaderSnap } from "@/game/types";

type Board = "book" | "nat" | "conf" | "rivals";

export function RecordsView() {
  const { state, setView } = useGame();
  const [tab, setTab] = useState<Board>("book");
  if (!state) return null;
  const book = bookLines(state);
  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">The room</p>
        <h1 className="font-display mt-1 text-3xl">Record book</h1>
        <p className="mt-1 text-sm text-muted">{book.school} · this job, this device. Leaders update as the games land.</p>
      </div>
      <div className="chip-row">
        {([
          ["book", "Program"],
          ["nat", "National"],
          ["conf", "Conference"],
          ["rivals", "Rivals"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${tab === id ? "bg-accent text-accent-fg" : "bg-elevated"}`}
            {...bindTap(() => setTab(id))}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "book" && <BookPanel />}
      {tab === "nat" && <LeadersPanel snap={leadersOf(state)} label="National" />}
      {tab === "conf" && <LeadersPanel snap={conferenceLeaders(state)} label="Conference" />}
      {tab === "rivals" && <RivalsPanel />}
    </div>
  );
}

function BookPanel() {
  const { state } = useGame();
  if (!state) return null;
  const { lines } = bookLines(state);
  if (!lines.length) {
    return <p className="rounded-xl border border-border bg-elevated px-4 py-5 text-sm text-muted">Play a game. The book starts blank on purpose.</p>;
  }
  return (
    <ul className="rounded-xl border border-border bg-elevated divide-y divide-border">
      {lines.map((r) => (
        <li key={r.k} className="flex items-baseline justify-between gap-3 px-4 py-3">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">{r.k}</span>
          <span className="text-right font-semibold">{r.v}</span>
        </li>
      ))}
    </ul>
  );
}

function LeadersPanel({ snap, label }: { snap: LeaderSnap; label: string }) {
  const cats: { id: keyof Pick<LeaderSnap, "pts" | "reb" | "ast" | "fg" | "three">; name: string; kind: "avg" | "pct" }[] = [
    { id: "pts", name: "Points", kind: "avg" },
    { id: "reb", name: "Rebounds", kind: "avg" },
    { id: "ast", name: "Assists", kind: "avg" },
    { id: "fg", name: "FG%", kind: "pct" },
    { id: "three", name: "3P%", kind: "pct" },
  ];
  const [cat, setCat] = useState<(typeof cats)[number]["id"]>("pts");
  const rows = snap[cat] ?? [];
  const meta = cats.find((c) => c.id === cat)!;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{label} · through week {snap.week} · {snap.season}. Need a handful of games to show.</p>
      <div className="chip-row">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${cat === c.id ? "bg-accent text-accent-fg" : "bg-elevated"}`}
            {...bindTap(() => setCat(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-elevated px-4 py-5 text-sm text-muted">Nobody's qualified yet. Sim a few weeks.</p>
      ) : (
        <ol className="rounded-xl border border-border bg-elevated divide-y divide-border">
          {rows.map((r, i) => (
            <LeaderLine key={r.id} r={r} i={i} kind={meta.kind} />
          ))}
        </ol>
      )}
    </div>
  );
}

function LeaderLine({ r, i, kind }: { r: LeaderRow; i: number; kind: "avg" | "pct" }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${r.yours ? "font-semibold" : ""}`}>
      <span className="w-6 tabular-nums text-muted">{i + 1}</span>
      <span className="min-w-0 flex-1 truncate">
        {r.name}
        <span className="ml-2 text-xs font-normal text-muted">{r.abbr} · {r.pos} · {r.gp} gp</span>
      </span>
      <span className="tabular-nums">{fmtRate(r.val, kind)}</span>
    </li>
  );
}

function RivalsPanel() {
  const { state } = useGame();
  const rows = useMemo(() => (state ? yourRivals(state.playerTeamId) : []), [state]);
  if (!state) return null;
  if (!rows.length) {
    return <p className="rounded-xl border border-border bg-elevated px-4 py-5 text-sm text-muted">This job doesn't come with a listed rival. The league still keeps score.</p>;
  }
  const tease = rivalryTease(state);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{tease.head} · {tease.note}</p>
      <ul className="rounded-xl border border-border bg-elevated divide-y divide-border">
        {rows.map((r) => {
          const mark = state.teams[state.playerTeamId]?.series?.[r.oppId];
          const opp = TEAM_BY_ID[r.oppId];
          return (
            <li key={r.oppId} className="flex items-baseline justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-semibold">{opp?.name ?? r.oppId}</span>
                <span className="text-xs text-muted">{r.trophy}</span>
              </span>
              <span className="tabular-nums">{mark && mark.w + mark.l > 0 ? `${mark.w}-${mark.l}` : "—"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
