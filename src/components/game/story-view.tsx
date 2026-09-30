import { useGame } from "@/game/store";
import { bindTap } from "@/lib/tap";
import { AppFrame } from "@/components/game/app-frame";
import { teamOf } from "@/game/teams";

export function StoryView() {
  const { state, answerStory, setView } = useGame();
  if (!state?.pendingStory) {
    return (
      <AppFrame>
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
          <p className="font-display text-3xl">Nothing going on</p>
          <button type="button" className="min-h-12 rounded-lg bg-accent px-6 font-semibold text-accent-fg" {...bindTap(() => setView("hub"))}>
            Back to the gym
          </button>
        </div>
      </AppFrame>
    );
  }
  const ev = state.pendingStory;
  const school = teamOf(state.playerTeamId);
  return (
    <AppFrame>
      <div className="px-4 py-8">
        <div className="mx-auto flex w-full max-w-lg flex-col">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            {school.name} · week {ev.week} · story
          </p>
          <h1 className="font-display mt-3 text-3xl leading-tight">{ev.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{ev.body}</p>
          <div className="mt-6 flex flex-col gap-2">
            {ev.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                data-story-choice={c.id}
                {...bindTap(() => answerStory(c.id))}
                className="min-h-14 rounded-xl border border-border bg-elevated px-4 py-3 text-left text-sm leading-snug"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
