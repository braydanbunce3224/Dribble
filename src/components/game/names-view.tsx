import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { TEAMS } from "@/game/teams";
import {
  activePack,
  currentAsPack,
  customTemplatePack,
  facsimilePack,
  packTitle,
  packToTxt,
  type NameRow,
} from "@/game/names";
import { bindTap } from "@/lib/tap";
import { PressButton } from "@/components/ui/press-button";

function download(filename: string, body: string, type = "application/json") {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function snapshot(): Record<string, NameRow> {
  const d: Record<string, NameRow> = {};
  for (const t of TEAMS) d[t.id] = { name: t.name, mascot: t.mascot, abbr: t.abbr };
  return d;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function NamesView() {
  const { state, setView, importNames, resetNames, applyRealSchools, namesStamp, toast, namesReturn } = useGame();
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState(snapshot);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [showText, setShowText] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const title = packTitle();
  const pack = activePack();

  useEffect(() => {
    setDraft(snapshot());
  }, [namesStamp]);

  const preview = useMemo(() => {
    const query = q.trim().toLowerCase();
    const featured = ["kentucky", "duke", "unc", "kansas", "ucla", "uconn", "gonzaga", "houston", "purdue", "tennessee"];
    const list = TEAMS.filter((t) => {
      if (!query) return true;
      const row = draft[t.id];
      return (
        t.id.includes(query) ||
        (row?.name ?? t.name).toLowerCase().includes(query) ||
        (row?.mascot ?? t.mascot).toLowerCase().includes(query) ||
        (row?.abbr ?? t.abbr).toLowerCase().includes(query) ||
        t.city.toLowerCase().includes(query)
      );
    });
    const rows = query
      ? list.slice(0, 60)
      : featured.map((id) => list.find((t) => t.id === id)).filter((t): t is (typeof TEAMS)[number] => Boolean(t));
    return { total: query ? list.length : TEAMS.length, rows };
  }, [q, draft, namesStamp]);

  const dirty = useMemo(() => {
    return TEAMS.some((t) => {
      const row = draft[t.id];
      return row?.name !== t.name || row?.mascot !== t.mascot || row?.abbr !== t.abbr;
    });
  }, [draft, namesStamp]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      importNames(await f.text());
    } catch {
      importNames(null);
    } finally {
      setBusy(false);
    }
  }

  function run(fn: () => void | Promise<void>) {
    setBusy(true);
    void Promise.resolve(fn()).finally(() => setBusy(false));
  }

  function markCopied(id: string) {
    setCopied(id);
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  }

  return (
    <div className="px-4 py-6 text-fg">
      <div className="mx-auto max-w-lg">
        <PressButton
          className="min-h-11 text-xs tracking-[0.18em] text-muted uppercase"
          onPress={() => setView(namesReturn || (state ? "hub" : "title"))}
        >
          Back
        </PressButton>
        <h1 className="font-display mt-1 text-4xl">Names</h1>
        <p className="mt-2 text-sm text-muted">
          Real school names load on first launch. Switch to facsimile, import a custom pack, or edit a school below. Packs stay on this device.
        </p>
        <p className="mt-3 rounded-xl border border-border bg-elevated px-3 py-2 text-sm">
          Active: <span className="font-semibold">{title}</span>
          {pack?.note ? <span className="mt-1 block text-xs text-muted">{pack.note}</span> : null}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            className="min-h-12 rounded-lg bg-accent font-semibold text-accent-fg disabled:opacity-50"
            {...bindTap(() => run(() => applyRealSchools()))}
          >
            Restore original school names
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] disabled:opacity-50"
            {...bindTap(() => fileRef.current?.click())}
          >
            Import a text file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="text/plain,.txt,text/csv,.csv,application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              void onFile(f);
            }}
          />
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => setShowPaste((v) => !v))}
          >
            {showPaste ? "Hide paste box" : "Paste a pack"}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(resetNames)}
          >
            Reset to facsimile
          </button>
        </div>

        {showPaste && (
          <div className="mt-3 rounded-xl border border-border bg-elevated p-3">
            <p className="text-xs text-muted">Paste a .txt, CSV, or JSON pack, then import. Unknown ids are skipped.</p>
            <textarea
              className="mt-2 min-h-36 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs text-fg"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={"# title: My custom names\nid,name,mascot,abbr\nkentucky,Kentucky,Wildcats,UK\nduke,Duke,Blue Devils,DUKE"}
            />
            <button
              type="button"
              disabled={busy || !paste.trim()}
              className="mt-2 min-h-11 w-full rounded-lg bg-accent font-semibold text-accent-fg disabled:opacity-50"
              {...bindTap(() => {
                importNames(paste);
                setPaste("");
              })}
            >
              Import pasted pack
            </button>
          </div>
        )}

        <h2 className="font-display mt-8 text-2xl">Text files</h2>
        <p className="mt-1 text-sm text-muted">
          Real school names restores the original schools. Custom template is the shipped facsimile list, ready to edit. Both are plain .txt and importable.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => {
              void fetch("/packs/real-schools.txt")
                .then((r) => r.text())
                .then((t) => download("dribble-real-schools.txt", t, "text/plain"));
            })}
          >
            Download real-schools.txt
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(async () => {
              try {
                const t = await fetch("/packs/real-schools.txt").then((r) => r.text());
                const ok = await copyText(t);
                markCopied(ok ? "real" : "fail");
              } catch {
                markCopied("fail");
              }
            })}
          >
            {copied === "real" ? "Copied real-schools.txt" : "Copy real-schools.txt"}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => {
              if (showText) {
                setShowText(null);
                return;
              }
              void fetch("/packs/real-schools.txt")
                .then((r) => r.text())
                .then((t) => setShowText(t))
                .catch(() => setShowText(packToTxt(currentAsPack("Real school names"))));
            })}
          >
            {showText ? "Hide text file" : "View real-schools.txt"}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => download("dribble-custom-template.txt", packToTxt(customTemplatePack()), "text/plain"))}
          >
            Download custom template.txt
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => download("dribble-facsimile.txt", packToTxt(facsimilePack()), "text/plain"))}
          >
            Download facsimile.txt
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-elevated font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            {...bindTap(() => download("dribble-current-names.txt", packToTxt(currentAsPack()), "text/plain"))}
          >
            Download current names.txt
          </button>
        </div>
        {copied === "fail" && <p className="mt-2 text-sm text-loss">Couldn't copy. Use View and select the text instead.</p>}
        {showText && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre rounded-xl border border-border bg-elevated p-3 text-[11px] leading-5 text-muted">
            {showText}
          </pre>
        )}

        <h2 className="font-display mt-8 text-2xl">Edit a school</h2>
        <p className="mt-1 text-sm text-muted">Search by name, city, or id. Save writes a custom pack on this device.</p>
        <input
          className="mt-3 h-12 w-full rounded-lg border border-border bg-elevated px-3 text-fg"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Lexington, kentucky, UK…"
        />
        {dirty && (
          <button
            type="button"
            disabled={busy}
            className="mt-3 min-h-12 w-full rounded-lg bg-accent font-semibold text-accent-fg disabled:opacity-50"
            {...bindTap(() => {
              importNames({
                kind: "dribble-2026-names",
                version: 1,
                id: "custom",
                title: "Custom names",
                note: "Edited in Names.",
                teams: draft,
              });
            })}
          >
            Save edited names
          </button>
        )}
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-elevated">
          {preview.rows.map((t) => {
            const row = draft[t.id] ?? t;
            return (
              <li key={t.id} className="px-3 py-3">
                <p className="text-[11px] tracking-wide text-subtle uppercase">{t.id}</p>
                <div className="mt-1 grid grid-cols-[1fr_1fr_4.5rem] gap-1.5">
                  <input
                    aria-label={`${t.id} name`}
                    className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-fg"
                    value={row.name ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [t.id]: { ...d[t.id], name: e.target.value } }))}
                  />
                  <input
                    aria-label={`${t.id} mascot`}
                    className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-fg"
                    value={row.mascot ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [t.id]: { ...d[t.id], mascot: e.target.value } }))}
                  />
                  <input
                    aria-label={`${t.id} abbr`}
                    className="h-10 rounded-md border border-border bg-bg px-2 text-sm text-fg uppercase"
                    value={row.abbr ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [t.id]: { ...d[t.id], abbr: e.target.value.slice(0, 5) } }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">
          {q.trim()
            ? `Showing ${preview.rows.length} of ${preview.total} schools.`
            : "Featured schools. Search to edit the rest."}
        </p>

        {toast && <p className="mt-3 text-sm text-loss">{toast}</p>}
      </div>
    </div>
  );
}
