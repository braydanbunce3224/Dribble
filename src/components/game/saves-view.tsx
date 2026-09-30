import { useState } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { bindTap } from "@/lib/tap";
import type { SaveMeta } from "@/game/persist";

export function SavesView() {
  const { state, saves, saveNow, loadFile, dropFile, setView, toast } = useGame();
  const [name, setName] = useState("");
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
        <h1 className="font-display mt-1 text-4xl">Load game</h1>
        <p className="mt-2 text-sm text-muted">Autosave runs in the background. Manual saves stay until you delete them.</p>

        {state && (
          <form
            className="mt-5 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveNow(name);
              setName("");
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Season ${state.season} quick save`}
              className="min-h-12 rounded-lg border border-border bg-elevated px-3 text-fg"
            />
            <button type="submit" className="min-h-12 rounded-lg bg-accent font-semibold text-accent-fg">
              Save now
            </button>
          </form>
        )}

        {toast && <p className="mt-3 text-sm text-loss">{toast}</p>}

        <ul className="mt-6 flex flex-col gap-2">
          {saves.length === 0 && <li className="text-sm text-muted">No saves on this device yet.</li>}
          {saves.map((m) => (
            <SlotRow key={m.id} m={m} onLoad={() => loadFile(m.id)} onDrop={() => dropFile(m.id)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlotRow({ m, onLoad, onDrop }: { m: SaveMeta; onLoad: () => void; onDrop: () => void }) {
  const school = TEAM_BY_ID[m.teamId];
  const when = new Date(m.updatedAt).toLocaleString();
  return (
    <li className="rounded-xl border border-border bg-elevated p-3">
      <p className="font-semibold">
        {m.name} {m.auto ? <span className="text-xs font-normal text-muted">autosave</span> : null}
      </p>
      <p className="mt-1 text-xs text-muted">
        {m.coach} · {school?.name ?? m.teamId} · {m.season} · {m.wins}-{m.losses}
      </p>
      <p className="mt-0.5 text-[11px] text-subtle">{when}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="min-h-11 flex-1 rounded-lg bg-accent font-semibold text-accent-fg" {...bindTap(onLoad)}>
          Load
        </button>
        {!m.auto && (
          <button type="button" className="min-h-11 rounded-lg px-4 text-sm text-loss" {...bindTap(onDrop)}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}
