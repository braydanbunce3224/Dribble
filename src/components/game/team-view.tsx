import { useMemo } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { leagueName } from "@/game/align";
import { apPoll, kenpom, netRanks, recOf, gameQuad } from "@/game/ranks";
import { gymName, gymOf } from "@/game/gym";
import { seriesVs, classLabel } from "@/game/engine";
import { bindTap } from "@/lib/tap";
import { netHoldLine, netReleased, weekDateLabel } from "@/game/calendar";

export function TeamView() {
  const { state, focusTeamId, openPlayer, setView, openTeam, openRecap, openRanks } = useGame();
  if (!state) return null;
  const id = focusTeamId && state.teams[focusTeamId] ? focusTeamId : state.playerTeamId;
  const school = TEAM_BY_ID[id];
  const t = state.teams[id];
  const you = state.playerTeamId;
  const roster = useMemo(
    () => state.players.filter((p) => p.teamId === id).sort((a, b) => b.ovr - a.ovr),
    [state.players, id],
  );
  const net = useMemo(() => netRanks(state).find((r) => r.id === id), [state, id]);
  const kp = useMemo(() => kenpom(state).find((r) => r.id === id), [state, id]);
  const ap = useMemo(() => apPoll(state).find((r) => r.id === id), [state, id]);
  const series = id !== you ? seriesVs(state, you, id) : null;
  const gym = gymOf(state, id);
  const recent = useMemo(
    () => state.results.filter((r) => r.homeId === id || r.awayId === id).slice(-5).reverse(),
    [state.results, id],
  );
  const left = state.schedule
    .filter((g) => !g.resultId && !g.declined && (g.homeId === id || g.awayId === id))
    .sort((a, b) => a.week - b.week)
    .slice(0, 6);
  const netLive = netReleased(state);
  if (!school || !t) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl">Missing school</h1>
        <button type="button" className="min-h-12 text-sm font-semibold text-accent" {...bindTap(() => setView("standings"))}>
          Ranks
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => setView("standings"))}>
        ← Ranks
      </button>
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{leagueName(t.conference, state.season)}</p>
        <h1 className="font-display mt-1 text-3xl">{school.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {school.mascot} · {school.city}, {school.state} · {recOf(state, id)}
          {t.confW + t.confL > 0 ? ` · ${t.confW}-${t.confL} league` : ""}
          {` · prestige ${t.prestige}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat k="NET" v={net && netLive ? String(net.rank) : "—"} />
        <Stat k="KenPom" v={kp ? String(kp.rank) : "—"} />
        <Stat k="AP" v={ap && ap.rank <= 25 ? String(ap.rank) : "—"} />
      </div>
      {!netLive && <p className="text-xs text-muted">{netHoldLine(state.season)}</p>}
      <button type="button" className="min-h-11 self-start text-sm font-semibold text-accent" {...bindTap(() => openRanks("sheet", id))}>
        NET team sheet
      </button>
      {kp && (
        <p className="text-xs text-muted">
          AdjO {kp.adjO.toFixed(1)} (#{kp.adjORank}) · AdjD {kp.adjD.toFixed(1)} (#{kp.adjDRank}) · {kp.adjEM >= 0 ? "+" : ""}{kp.adjEM.toFixed(1)} EM
        </p>
      )}
      {series && (
        <p className="text-sm text-muted">
          Series vs you {series.aWins}-{series.bWins}
          {series.last ? ` · last ${series.last}` : ""}
        </p>
      )}
      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{gymName(id)}</p>
        <p className="font-display mt-1 text-2xl">{gym ? `#${gym.rank} gym` : "Home floor"}</p>
        {gym && (
          <p className="mt-1 text-xs text-muted">
            +{gym.hca.toFixed(1)} HCA · {gym.seasonW}-{gym.seasonL} this year · {gym.note}
          </p>
        )}
      </div>
      {recent.length > 0 && (
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Last five</p>
          <ul className="mt-2 space-y-1 text-sm">
            {recent.map((r) => {
              const home = r.homeId === id;
              const won = home ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
              const opp = home ? r.awayId : r.homeId;
              const sch = TEAM_BY_ID[opp];
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className="min-h-11 text-left"
                    {...bindTap(() => (r.recap ? openRecap(r.id) : openTeam(opp)))}
                  >
                    <span className={won ? "text-win font-semibold" : "text-loss font-semibold"}>{won ? "W" : "L"}</span>
                    {" "}{home ? "vs" : "@"} {sch?.abbr ?? opp} {home ? r.homeScore : r.awayScore}–{home ? r.awayScore : r.homeScore}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Roster</p>
        <ul className="mt-2 flex flex-col gap-1">
          {roster.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-border bg-elevated px-3 text-left"
                {...bindTap(() => openPlayer(p.id))}
              >
                <span>
                  <span className="font-semibold">{p.last}</span>
                  <span className="text-xs text-muted"> {p.first} · {p.pos} · {classLabel(p)}</span>
                </span>
                <span className="tabular-nums font-semibold">{p.ovr}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {left.length > 0 && (
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Coming up</p>
          <ul className="mt-2 space-y-1 text-sm">
            {left.map((g) => {
              const opp = g.homeId === id ? g.awayId : g.homeId;
              const sch = TEAM_BY_ID[opp];
              const q = netLive ? gameQuad(state, g, id) : null;
              return (
                <li key={g.id}>
                  <button type="button" className="min-h-11 text-left font-semibold" {...bindTap(() => openTeam(opp))}>
                    {weekDateLabel(state.season, g.week)} {g.homeId === id ? "vs" : "@"} {sch?.abbr ?? opp}
                    {q ? ` · Q${q}` : ""}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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
