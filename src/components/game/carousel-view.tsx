import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { bindTap } from "@/lib/tap";

const KIND: Record<string, string> = {
  fired: "Fired",
  nba: "NBA",
  jumped: "Better job",
  promoted: "Assistant promoted",
};

export function CarouselView() {
  const { state, advanceCarousel, declineCarouselOffer, takeJob } = useGame();
  if (!state?.carousel) return null;
  const session = state.carousel;
  const beat = session.beats[Math.min(session.index, session.beats.length - 1)];
  if (!beat || session.done) return null;

  const n = session.beats.length;
  const progress = n > 1 ? session.index / (n - 1) : 1;
  const choosing = Boolean(beat.yours && (beat.decision === "fire" || beat.decision === "offer"));
  const here = TEAM_BY_ID[state.playerTeamId];
  const jobs = (state.contractReview?.jobs ?? []).filter((j) => j.teamId !== state.playerTeamId && TEAM_BY_ID[j.teamId]);
  const moves = (state.coachMoves ?? []).filter((m) => m.season === state.season);
  const left = state.snake?.season === state.season;

  return (
    <div className="app-frame sel-show">
      <div className="sel-bar" />
      <div className="app-scroll sel-inner">
        <p className="sel-kicker">Coaching carousel · {state.season}</p>
        <div className="sel-progress" aria-hidden>
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {beat.recap ? (
          <>
            <p className="sel-kicker">Recap</p>
            <h1 className="sel-title">{left ? `You took ${state.snake?.to}` : `You stayed at ${here?.name ?? "your school"}`}</h1>
            <p className="sel-copy">{moves.length ? `${moves.length} chair${moves.length === 1 ? "" : "s"} changed.` : "No other chair changed."}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {moves.map((m) => (
                <li key={`${m.teamId}-${m.inName}`}>
                  <p className="font-semibold">{m.school}</p>
                  <p className="text-sm text-muted">{m.note}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="sel-kicker">
              {session.index + 1} of {n}
              {beat.quiet ? "" : ` · ${KIND[beat.kind] ?? "Move"}`}
            </p>
            <h1 className="sel-title">{choosing ? "Your call" : beat.school}</h1>
            <p className="sel-copy">{beat.note}</p>
            {!beat.quiet && !choosing && (
              <p className="sel-copy">
                {beat.outName} out{beat.inName && beat.inName !== beat.outName ? `. ${beat.inName} in.` : "."}
                {beat.record ? ` ${beat.record}.` : ""}
              </p>
            )}
            {choosing && (
              <div className="mt-4 flex flex-col gap-2">
                {jobs.map((j) => {
                  const t = TEAM_BY_ID[j.teamId];
                  if (!t) return null;
                  return (
                    <button key={j.teamId} type="button" className="sel-btn" {...bindTap(() => takeJob(j.teamId))}>
                      {t.name}
                      <span className="mt-1 block text-xs font-normal">
                        {t.mascot} · rating {t.prestige} · {j.contract.years} years
                      </span>
                    </button>
                  );
                })}
                {!jobs.length && <p className="sel-copy">No chairs called. You can stay.</p>}
              </div>
            )}
          </>
        )}
      </div>
      <div className="sel-actions">
        {choosing && (
          <button type="button" className="sel-btn" {...bindTap(declineCarouselOffer)}>
            Stay at {here?.name ?? "your school"}
          </button>
        )}
        {!choosing && (
          <button type="button" className="sel-btn" {...bindTap(advanceCarousel)}>
            {beat.recap ? "Back to the gym" : "Next opening"}
          </button>
        )}
      </div>
    </div>
  );
}
