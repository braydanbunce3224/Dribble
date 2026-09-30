import { useGame } from "@/game/store";
import { APR_LINE, complianceLabel, complianceNote } from "@/game/compliance";
import { eraHasNil } from "@/game/era";
import { bindTap } from "@/lib/tap";

export function ComplianceView() {
  const { state, setView } = useGame();
  if (!state) return null;
  const c = state.compliance;
  if (!c) return null;
  const nilOn = eraHasNil(state.eraDecade);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("hub"))}>
        ← Gym
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">NCAA · Indianapolis</p>
        <h1 className="font-display mt-1 text-3xl">Compliance</h1>
        <p className="mt-1 text-sm text-muted">{complianceNote(state)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-elevated py-3">
          <p className="text-xs tracking-widest text-muted uppercase">APR</p>
          <p className={`font-display mt-1 text-2xl ${c.apr < APR_LINE ? "text-loss" : ""}`}>{c.apr}</p>
        </div>
        <div className="rounded-xl bg-elevated py-3">
          <p className="text-xs tracking-widest text-muted uppercase">Scrutiny</p>
          <p className="font-display mt-1 text-2xl">{c.heat}</p>
        </div>
        <div className="rounded-xl bg-elevated py-3">
          <p className="text-xs tracking-widest text-muted uppercase">Status</p>
          <p className="font-display mt-1 text-2xl">{complianceLabel(c)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">NCAA rules</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-semibold text-fg">APR 930.</span> Drop under that and you can't play in the NCAA Tournament. Playing guys who can't stay eligible pulls the number down.
          </li>
          <li>
            <span className="font-semibold text-fg">{nilOn ? "NIL pool." : "No NIL."}</span>{" "}
            {nilOn
              ? `Revenue share is a cap. Asking a recruit for more than you can pay is an extra-benefit violation.`
              : `This era does not allow paying players. Offer a kid money and it's an extra-benefit violation.`}
          </li>
          <li>
            <span className="font-semibold text-fg">Dead period.</span> Official visits during the NCAA Tournament, NIT, and CBI are a violation.
          </li>
          <li>
            <span className="font-semibold text-fg">Contact limit.</span> Three home visits in a week and compliance starts counting the flights.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Violations</p>
        {c.flags.length === 0 && <p className="mt-2 text-sm text-muted">No flags. Keep it that way.</p>}
        <ul className="mt-3 flex flex-col gap-3">
          {c.flags.map((f) => (
            <li key={f.id}>
              <p className="text-[11px] tracking-widest text-muted uppercase">
                {f.severity} · {f.kind} · wk {f.week}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}