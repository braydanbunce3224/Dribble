import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { classLabel, isStarter, captainOf, fatigueOf, playerAwardsOf, settingsOf } from "@/game/engine";
import { SKILL_LABEL } from "@/game/develop";
import { bindTap } from "@/lib/tap";

function pct(m?: number, a?: number) {
  if (!a) return "—";
  return `${(((m ?? 0) / a) * 100).toFixed(1)}`;
}

export function PlayerView() {
  const { state, focusPlayerId, openTeam, setView, editRating } = useGame();
  if (!state) return null;
  const p = state.players.find((x) => x.id === focusPlayerId) ?? state.players.find((x) => x.teamId === state.playerTeamId);
  if (!p) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl">Gone</h1>
        <button type="button" className="min-h-12 text-sm font-semibold text-accent" {...bindTap(() => setView("roster"))}>
          Roster
        </button>
      </div>
    );
  }
  const school = TEAM_BY_ID[p.teamId];
  const cap = captainOf(state);
  const st = isStarter(state, p.id);
  const fat = fatigueOf(state, p.id);
  const g = p.stats?.g ?? 0;
  const cg = p.career?.g ?? 0;
  const awards = playerAwardsOf(p, state);
  const usage = p.usage != null && p.usage > 0 ? String(p.usage) : "—";
  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => (p.teamId === state.playerTeamId ? setView("roster") : openTeam(p.teamId)))}>
        ← {p.teamId === state.playerTeamId ? "Roster" : school?.abbr ?? "Team"}
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">
          {p.pos} · {classLabel(p)}
          {p.height ? ` · ${p.height}` : ""}
          {st ? " · starter" : ""}
          {cap?.id === p.id ? " · captain" : ""}
          {p.redshirt ? " · redshirt" : ""}
        </p>
        <h1 className="font-display mt-1 text-3xl">{p.first} {p.last}</h1>
        <p className="mt-1 text-sm text-muted">
          {school?.name} · {p.ovr} ovr · {p.potential} pot · confidence {p.morale}
          {p.country && p.country !== "US" ? ` · ${p.country}` : ""}
          {p.path === "juco" ? " · JUCO" : ""}
          {p.portalFrom ? ` · portal from ${TEAM_BY_ID[p.portalFrom]?.abbr ?? p.portalFrom}` : ""}
        </p>
      </div>
      {p.injury && p.injury.weeksLeft > 0 && (
        <p className="text-sm text-loss">{p.injury.part} · {p.injury.weeksLeft} week{p.injury.weeksLeft === 1 ? "" : "s"}</p>
      )}
      {p.teamId === state.playerTeamId && fat > 40 && (
        <p className="text-xs text-muted">Legs {fat}. Rest week if he's dragging.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Stat k="PPG" v={g ? (p.stats!.pts / g).toFixed(1) : "—"} />
        <Stat k="RPG" v={g ? (p.stats!.reb / g).toFixed(1) : "—"} />
        <Stat k="APG" v={g ? (p.stats!.ast / g).toFixed(1) : "—"} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat k="MPG" v={g && p.stats?.min ? (p.stats.min / g).toFixed(1) : p.mpg.toFixed(1)} />
        <Stat k="USG" v={String(usage)} />
        <Stat k="FG%" v={pct(p.stats?.fgm, p.stats?.fga)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat k="3P%" v={pct(p.stats?.tpm, p.stats?.tpa)} />
        <Stat k="FT%" v={pct(p.stats?.ftm, p.stats?.fta)} />
        <Stat k="Games" v={g ? String(g) : "—"} />
      </div>
      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Skills</p>
        <div className="mt-3 flex flex-col gap-2">
          {SKILL_LABEL.map((s) => {
            const v = p.skills?.[s.id] ?? p.ovr;
            return (
              <div key={s.id}>
                <div className="flex justify-between text-xs tracking-wide text-muted uppercase">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-fg">{v}</span>
                </div>
                <div className="interest-bar mt-1">
                  <span style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {p.growth && p.growth.length > 0 && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Development log</p>
          <ul className="mt-2 space-y-1 text-sm">
            {p.growth.slice(-6).map((x, i) => (
              <li key={`${x.season}-${i}`}>{x.season} · {x.ovr} ovr{x.note ? ` · ${x.note}` : ` · +${x.jump}`}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Ceiling {p.potential}. Freshmen climb slower. Seniors spike. Bench minutes stall growth. A redshirt or an injury pauses it.
            {p.mpg >= 28 ? " Star minutes." : p.mpg >= 16 ? " Rotation minutes." : " Mop-up minutes."}
          </p>
        </div>
      )}
      {p.teamId === state.playerTeamId && settingsOf(state).godMode && (
        <div className="flex gap-2">
          <button type="button" className="min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold" {...bindTap(() => editRating(p.id, -1))}>Rating −</button>
          <button type="button" className="min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold" {...bindTap(() => editRating(p.id, 1))}>Rating +</button>
        </div>
      )}
      {cg > 0 && p.career && (
        <p className="text-xs text-muted">
          Career {cg} g · {(p.career.pts / cg).toFixed(1)} ppg · {(p.career.reb / cg).toFixed(1)} rpg · {(p.career.ast / cg).toFixed(1)} apg
          {p.career.fga ? ` · ${pct(p.career.fgm, p.career.fga)} FG` : ""}
        </p>
      )}
      {awards.length > 0 && (
        <p className="text-xs text-muted">{awards.join(" · ")}</p>
      )}
      <button type="button" className="min-h-12 rounded-lg bg-elevated font-semibold" {...bindTap(() => openTeam(p.teamId))}>
        {school?.name ?? "Program"}
      </button>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border bg-elevated px-3 py-2">
      <p className="text-[11px] tracking-[0.14em] text-muted uppercase">{k}</p>
      <p className="font-display text-2xl tabular-nums">{v}</p>
    </div>
  );
}
