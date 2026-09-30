import { useEffect } from "react";
import { useGame } from "@/game/store";
import { bindTap, buzz } from "@/lib/tap";

export function FeedbackToast() {
  const { state, feedback, toast, clearFeedback, clearToast, clearFlash } = useGame();
  const flash = state?.flash ?? null;
  useEffect(() => {
    if (!flash && !feedback && !toast) return;
    if (flash) buzz(flash.kind === "commit" ? 40 : 24);
    const t = window.setTimeout(() => {
      if (flash) clearFlash();
      else if (feedback) clearFeedback();
      else clearToast();
    }, flash ? 5200 : 3200);
    return () => window.clearTimeout(t);
  }, [flash, feedback, toast, clearFeedback, clearToast, clearFlash]);
  if (!flash && !feedback && !toast) return null;
  return (
    <div className="feedback-dock mx-auto max-w-md">
      {flash && (
        <button type="button" {...bindTap(clearFlash)} className="flash-card w-full rounded-xl border bg-elevated p-4 text-left shadow-xl">
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">
            {flash.kind === "commit" ? "Committed" : flash.kind === "flip" ? "Flipped" : "Decommitted"}
          </p>
          <p className="font-display mt-1 text-2xl">{flash.name}</p>
          <p className="mt-1 text-sm text-muted">
            {flash.stars ? `${flash.stars}★ ` : ""}
            {flash.pos ? `${flash.pos} · ` : ""}
            {flash.detail}
          </p>
          <p className="mt-2 text-[11px] text-subtle">Tap to dismiss</p>
        </button>
      )}
      {feedback && !flash && (
        <button type="button" {...bindTap(clearFeedback)} className="w-full rounded-xl border border-border bg-elevated p-4 text-left shadow-xl">
          <p className="font-display text-xl">{feedback.title}</p>
          {feedback.detail && <p className="mt-1 text-sm text-muted">{feedback.detail}</p>}
          {feedback.parts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {feedback.parts.map((p) => (
                <span
                  key={p.label}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.delta > 0 ? "bg-win/20 text-win" : p.delta < 0 ? "bg-loss/20 text-loss" : "bg-elevated text-muted"}`}
                >
                  {p.label} {p.delta > 0 ? `+${p.delta}` : p.delta}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-subtle">Tap to dismiss</p>
        </button>
      )}
      {toast && !feedback && !flash && (
        <button type="button" {...bindTap(clearToast)} className="w-full rounded-xl border border-loss/40 bg-elevated p-3 text-sm text-loss">
          {toast}
        </button>
      )}
    </div>
  );
}
