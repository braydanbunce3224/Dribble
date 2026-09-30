import { useGame } from "@/game/store";
import { FOCUS_OPTS, campOf, classLabel } from "@/game/engine";
import { bindTap } from "@/lib/tap";

export function CampView() {
  const { state, setView, setFocus, spendCampPt, lockCampNow, redshirt } = useGame();
  if (!state) return null;
  const camp = campOf(state);
  const roster = state.players.filter((p) => p.teamId === state.playerTeamId).sort((a, b) => (b.potential - b.ovr) - (a.potential - a.ovr) || b.ovr - a.ovr);
  const locked = camp.locked;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{state.season} · training camp</p>
        <h1 className="font-display mt-1 text-3xl">Camp</h1>
        <p className="mt-1 text-sm text-muted">
          {locked
            ? "Camp's over. Redshirt if you're sitting somebody."
            : `${camp.points} point${camp.points === 1 ? "" : "s"} left. Pick a skill to work on, then spend. Three max on one guy.`}
        </p>
      </div>
      {!locked && (
        <button type="button" className="min-h-12 rounded-lg bg-accent font-semibold text-accent-fg" {...bindTap(lockCampNow)}>
          Lock camp
        </button>
      )}
      {locked && camp.jumps.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Improvement</p>
          <ul className="mt-2 space-y-1 text-sm">
            {camp.jumps.slice(0, 8).map((j) => (
              <li key={j.id} className="flex justify-between gap-2">
                <span>{j.name}</span>
                <span className={j.after > j.before ? "text-win" : "text-loss"}>
                  {j.before} → {j.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {roster.map((p) => {
          const spent = camp.spent[p.id] ?? 0;
          const focus = camp.focuses[p.id] ?? p.focus ?? "balanced";
          return (
            <li key={p.id} className="rounded-xl border border-border bg-elevated p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {p.first} {p.last}{" "}
                  <span className="text-xs font-normal text-muted">
                    {classLabel(p)} · {p.ovr} → {p.potential}
                  </span>
                </p>
                <p className="text-xs tabular-nums text-muted">{locked ? `${spent} spent` : `${spent}/3`}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {FOCUS_OPTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={locked}
                    className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${focus === f.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
                    {...bindTap(() => setFocus(p.id, f.id))}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {!locked && (
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="min-h-11 min-w-11 rounded-lg bg-bg font-semibold" {...bindTap(() => spendCampPt(p.id, -1))}>−</button>
                  <span className="text-sm">{spent} pts</span>
                  <button type="button" className="min-h-11 min-w-11 rounded-lg bg-bg font-semibold" {...bindTap(() => spendCampPt(p.id, 1))}>+</button>
                </div>
              )}
              {locked && (p.year < 4 && !p.usedRedshirt) && (
                <button
                  type="button"
                  className="mt-2 min-h-11 w-full rounded-lg bg-bg text-sm font-semibold"
                  {...bindTap(() => redshirt(p.id, !p.redshirt))}
                >
                  {p.redshirt ? "End redshirt" : "Redshirt after camp"}
                </button>
              )}
              {p.growth && p.growth.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  History: {p.growth.slice(-4).map((g) => `${g.season} ${g.ovr}${g.jump ? `(${g.jump > 0 ? "+" : ""}${g.jump})` : ""}`).join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
