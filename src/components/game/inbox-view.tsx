import { useGame } from "@/game/store";

export function InboxView() {
  const { state, readMail, setView } = useGame();
  if (!state) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="min-h-11 text-sm font-semibold text-accent" onClick={() => setView("hub")}>
          ← Gym
        </button>
        <button type="button" className="min-h-11 text-sm text-muted" onClick={() => setView("schedule")}>
          Schedule
        </button>
      </div>
      <h1 className="font-display text-3xl">Inbox</h1>
      <p className="text-sm text-muted">The AD. Boosters. Fans. They write.</p>
      {state.mail.length === 0 ? (
        <p className="rounded-xl border border-border bg-elevated px-4 py-6 text-sm text-muted">No mail yet. It shows up after games and big weeks.</p>
      ) : (
      <ul className="flex flex-col gap-3">
        {state.mail.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => readMail(m.id)}
              className={`w-full rounded-xl border p-4 text-left ${m.read ? "border-border bg-surface" : "border-accent/40 bg-elevated"}`}
            >
              <p className="text-xs tracking-widest text-muted uppercase">{m.from} · wk {m.week}</p>
              <p className="mt-1 font-semibold">{m.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{m.body}</p>
            </button>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
