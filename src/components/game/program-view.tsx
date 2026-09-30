import { useGame } from "@/game/store";
import {
  FACILITY_OPTS, PRACTICE_OPTS, captainOf, depthOf, facilitiesOf, facilityStars, injuredOf,
  practiceOf, roleLabel, staffOf, upgradeCost, upcomingEvents, teamLoad,
} from "@/game/engine";
import { bindTap } from "@/lib/tap";
import { unitGrade } from "@/game/sheet";
import type { Pos, StaffRole } from "@/game/types";

const ROLES: StaffRole[] = ["oc", "dc", "rc"];
const POS: Pos[] = ["PG", "SG", "SF", "PF", "C"];

export function ProgramView() {
  const { state, hire, fire, upgrade, setPractice, nameCaptain, nameStarter, setView, loadTournament } = useGame();
  if (!state) return null;
  const staff = staffOf(state);
  const fac = facilitiesOf(state);
  const plan = practiceOf(state);
  const depth = depthOf(state);
  const cap = captainOf(state);
  const hurt = injuredOf(state);
  const load = teamLoad(state);
  const events = upcomingEvents(state);
  const roster = state.players.filter((p) => p.teamId === state.playerTeamId).sort((a, b) => b.ovr - a.ovr);
  const canBuild = state.phase === "offseason" || state.phase === "preseason";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-3xl">Program</h1>
        <p className="mt-1 text-sm text-muted">Staff, facilities, practice, and your starting five.</p>
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Practice this week</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PRACTICE_OPTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`min-h-14 rounded-lg px-3 py-2 text-left ${plan === p.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
              {...bindTap(() => setPractice(p.id))}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className={`block text-xs ${plan === p.id ? "text-accent-fg/80" : "text-muted"}`}>{p.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {load.avg >= 62 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Load</p>
          <p className="mt-1 text-sm">
            Legs {load.avg}
            {load.tired ? ` · ${load.tired} gassed` : ""}.
            {load.avg >= 70 ? " Call a rest week." : " Film or rest if the next one can wait."}
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Calendar</p>
          <ul className="mt-2 space-y-1 text-sm">
            {events.map((ev) => (
              <li key={ev.id} className={ev.done ? "text-muted" : ""}>
                <span className="font-semibold">{ev.title}</span>
                <span className="text-xs text-muted"> · wk {ev.week}{ev.done ? " · done" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hurt.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Trainer</p>
          <ul className="mt-2 space-y-1 text-sm">
            {hurt.map((p) => (
              <li key={p.id}>
                {p.first} {p.last} · {p.injury?.part} · {p.injury?.weeksLeft} week{p.injury?.weeksLeft === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Starting five · captain {cap ? cap.last : "—"}</p>
        {(() => {
          const five = POS.map((pos) => roster.find((p) => p.id === depth.starters[pos])).filter((p): p is NonNullable<typeof p> => Boolean(p));
          const unit = unitGrade(five);
          if (!unit) return null;
          return (
            <p className="mt-2 text-sm">
              Five-man {unit.off} offensive / {unit.def} defensive. {unit.note} Chemistry follows minutes and the locker, not a slider.
            </p>
          );
        })()}
        <button type="button" className="mt-3 min-h-11 rounded-lg bg-bg px-3 text-sm font-semibold" {...bindTap(loadTournament)}>
          Load tournament rotation
        </button>
        <p className="mt-1 text-xs text-muted">Starters, rotation, mop-up. Live games already pull foul-trouble subs and garbage time. Minutes and usage on the roster are what the sim uses.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {POS.map((pos) => {
            const id = depth.starters[pos];
            const on = roster.find((p) => p.id === id);
            const opts = roster.filter((p) => p.pos === pos);
            return (
              <li key={pos} className="rounded-lg bg-bg px-3 py-2">
                <p className="text-xs tracking-[0.14em] text-muted uppercase">{pos} · {on ? `${on.last} ${on.ovr}` : "open"}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {opts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${id === p.id ? "bg-accent text-accent-fg" : "bg-elevated"}`}
                      {...bindTap(() => nameStarter(pos, p.id))}
                    >
                      {p.last}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">Captain</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {roster.filter((p) => p.year >= 2).slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${depth.captainId === p.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
              {...bindTap(() => nameCaptain(p.id))}
            >
              {p.last}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Facilities · donors {state.donorMood}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {FACILITY_OPTS.map((f) => {
            const n = fac[f.id];
            const cost = upgradeCost(n);
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-bg px-3 py-2">
                <div>
                  <p className="font-semibold">{f.label}</p>
                  <p className="text-xs text-muted">{facilityStars(n)} · {f.hint}</p>
                </div>
                <button
                  type="button"
                  disabled={!canBuild || n >= 5}
                  className="min-h-11 shrink-0 rounded-lg bg-elevated px-3 text-xs font-semibold disabled:opacity-40"
                  {...bindTap(() => upgrade(f.id))}
                >
                  {n >= 5 ? "Max" : `+1 · ${cost}`}
                </button>
              </li>
            );
          })}
        </ul>
        {!canBuild && <p className="mt-2 text-xs text-muted">Hard hats wait for camp or the offseason.</p>}
      </div>

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Staff {staff.hiresThisYear ? "· hired this year" : ""}</p>
        {ROLES.map((role) => {
          const seat = staff[role];
          return (
            <div key={role} className="mt-3 border-t border-border pt-3 first:mt-2 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs tracking-[0.14em] text-muted uppercase">{roleLabel(role)}</p>
                  <p className="font-display text-xl">{seat ? seat.name : "Open"}</p>
                  {seat && <p className="text-xs text-muted">{seat.specialty} · {seat.rating} · {seat.years} yr · {seat.from}</p>}
                </div>
                {seat && (
                  <button type="button" className="min-h-10 text-xs text-muted" {...bindTap(() => fire(role))}>
                    Fire
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">Pool</p>
        <ul className="mt-2 flex flex-col gap-1">
          {staff.pool.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg bg-bg px-3 text-left"
                {...bindTap(() => hire(c.id))}
              >
                <span>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="text-xs text-muted">{roleLabel(c.role)} · {c.specialty} · {c.from}</span>
                </span>
                <span className="tabular-nums font-semibold">{c.rating}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="min-h-12 text-sm font-semibold text-accent" {...bindTap(() => setView("roster"))}>
        Open roster
      </button>
    </div>
  );
}
