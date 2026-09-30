import { useMemo } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { hofScore, listHof, playthroughId } from "@/game/hof";
import { bindTap } from "@/lib/tap";

export function HofView() {
  const { state, setView, namesStamp } = useGame();
  void namesStamp;
  const rows = useMemo(() => listHof(), [namesStamp, state?.history?.log.length, state?.history?.titles]);
  const youId = state ? playthroughId(state) : "";

  return (
    <div className="px-4 py-6 text-fg">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          className="min-h-11 text-xs tracking-[0.18em] text-muted uppercase"
          {...bindTap(() => setView(state ? "hub" : "title"))}
        >
          Back
        </button>
        <h1 className="font-display mt-1 text-4xl">Hall of Fame</h1>
        <p className="mt-2 text-sm text-muted">
          The jobs that lasted. Ranked by banners, NCAA bids, conference titles, then wins.
        </p>
        {rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-elevated px-4 py-6 text-sm text-muted">
            Finish a season. Conference titles, NCAA bids, and banners land here — ranked across every playthrough on this device.
          </p>
        ) : (
          <ol className="mt-6 flex flex-col gap-2">
            {rows.map((e, i) => {
              const school = TEAM_BY_ID[e.teamId];
              const on = e.id === youId;
              return (
                <li
                  key={e.id}
                  className={`rounded-xl border px-4 py-3 ${on ? "border-accent bg-elevated" : "border-border bg-elevated/70"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-display w-8 text-2xl text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.coach}</p>
                      <p className="text-sm text-muted">
                        {school?.name ?? e.teamName}
                        {e.careerMode ? " · Career" : ""}
                        {e.eraDecade ? ` · ${e.eraDecade}s` : ""}
                        {` · ${e.seasons} season${e.seasons === 1 ? "" : "s"}`}
                      </p>
                      <p className="mt-1 text-xs text-subtle">{e.highlight}</p>
                      <p className="mt-1 text-xs tabular-nums text-muted">
                        {e.wins}-{e.losses}
                        {e.confTitles ? ` · ${e.confTitles} conference` : ""}
                        {e.ncaaBids ? ` · ${e.ncaaBids} NCAA` : ""}
                        {e.titles ? ` · ${e.titles} title${e.titles === 1 ? "" : "s"}` : ""}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums text-accent">{hofScore(e)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
