import { useState } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID, TEAMS } from "@/game/teams";
import { contractProgress, contractLine } from "@/game/contract";
import { dreamJobs, goatLine, settingsOf } from "@/game/engine";
import { bindTap } from "@/lib/tap";

export function ContractView() {
  const { state, setView, signDeal, takeJob, walkDeal, retire, declineCarouselOffer } = useGame();
  const [q, setQ] = useState("");
  if (!state) return null;
  const school = TEAM_BY_ID[state.playerTeamId]!;
  const c = state.contract;
  const review = state.contractReview;
  const live = contractProgress(state);
  const rows = review?.results ?? live;
  const off = state.phase === "offseason" && review && !review.resolved;
  const dreams = dreamJobs(state);
  const god = settingsOf(state).godMode;
  const jump = god
    ? TEAMS.filter((t) => t.id !== state.playerTeamId && t.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{school.name} · contract</p>
        <h1 className="font-display mt-1 text-3xl">Contract</h1>
        <p className="mt-1 text-sm text-muted">{c ? contractLine(c) : "No contract yet."}</p>
        <p className="mt-1 text-xs text-muted">{goatLine(state)}</p>
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">
          {c ? `${c.years}-year deal · year ${c.yearOnJob} on the job` : "Terms"}
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.kind}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{r.label}</span>
                <span className={r.met ? "text-win" : "text-muted"}>
                  {r.kind === "ncaa" || r.kind === "postseason" || r.kind === "confTitle"
                    ? r.met
                      ? "Hit"
                      : "Open"
                    : `${r.actual} / ${r.target}`}
                </span>
              </div>
              <div className="interest-bar mt-1">
                <span style={{ width: `${Math.min(100, r.target ? (r.actual / r.target) * 100 : 0)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {state.phase === "offseason" && (state.coachMoves ?? []).some((m) => m.season === state.season) && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Carousel</p>
          <ul className="mt-3 flex flex-col gap-3">
            {(state.coachMoves ?? []).filter((m) => m.season === state.season).slice(0, 8).map((m) => (
              <li key={`${m.teamId}-${m.inName}`}>
                <p className="text-sm font-semibold">{m.school}</p>
                <p className="text-sm text-muted">{m.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.reportCard && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Season review · {state.reportCard.overall}</p>
          <p className="mt-2 text-sm leading-relaxed">{state.reportCard.letter}</p>
          <ul className="mt-3 space-y-2">
            {state.reportCard.grades.map((g) => (
              <li key={g.label} className="flex justify-between gap-3 text-sm">
                <span>{g.label}</span>
                <span className="tabular-nums font-semibold">{g.letter}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {review && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            {review.decision === "fire" ? "You're out" : review.decision === "extend" ? "Extension" : "Year in review"} · {review.record}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{review.letter}</p>
        </div>
      )}

      {off && review.decision === "extend" && review.offer && (
        <div className="flex flex-col gap-2">
          <button type="button" className="min-h-12 rounded-lg bg-accent font-semibold text-accent-fg" {...bindTap(signDeal)}>
            Sign {review.offer.years} more years
          </button>
          <button type="button" className="min-h-12 rounded-lg bg-elevated font-semibold" {...bindTap(walkDeal)}>
            Walk
          </button>
        </div>
      )}

      {off && review.decision === "fire" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">These jobs are open. Take one, or stay.</p>
          {review.jobs.map((j) => {
            const t = TEAM_BY_ID[j.teamId];
            if (!t) return null;
            return (
              <button
                key={j.teamId}
                type="button"
                className="rounded-xl border border-border bg-elevated p-4 text-left"
                {...bindTap(() => takeJob(j.teamId))}
              >
                <p className="font-display text-2xl">{t.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {t.mascot} · rating {t.prestige} · {j.contract.years} years · {j.contract.clauses.map((x) => x.label).join(" · ")}
                </p>
              </button>
            );
          })}
          <button type="button" className="min-h-12 rounded-lg bg-elevated font-semibold" {...bindTap(declineCarouselOffer)}>
            Stay at {school.name}
          </button>
        </div>
      )}

      {review?.resolved && (
        <p className="text-sm text-muted">Contract is set. Back to the office when you're ready for next season.</p>
      )}

      {dreams.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Dream jobs</p>
          <p className="mt-1 text-sm text-muted">Titles and bids open the blue-blood chairs. Tap one to walk in.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {dreams.map((j) => (
              <li key={j.teamId}>
                <button type="button" className="min-h-12 w-full rounded-lg bg-bg px-3 text-left font-semibold" {...bindTap(() => takeJob(j.teamId))}>
                  {j.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {god && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">God Mode · jump</p>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-border bg-bg px-3"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Any program…"
          />
          {q.trim() && (
            <ul className="mt-2">
              {jump.map((t) => (
                <li key={t.id} className="border-t border-border first:border-t-0">
                  <button type="button" className="flex min-h-12 w-full items-center justify-between text-left text-sm" {...bindTap(() => takeJob(t.id))}>
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-xs text-muted">{t.prestige}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="button" className="min-h-12 rounded-lg bg-elevated font-semibold" {...bindTap(retire)}>
        Retire
      </button>
    </div>
  );
}