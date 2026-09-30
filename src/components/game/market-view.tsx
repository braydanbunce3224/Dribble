import { useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { hangLine, mlLabel, spreadLabel, weekCard } from "@/game/market";
import { bindTap } from "@/lib/tap";
import type { GameSlot } from "@/game/types";
import { gameKindShort } from "@/game/brand";

function kindLabel(kind: GameSlot["kind"]) {
  return gameKindShort(kind);
}

function OddsCard({ slot, yours }: { slot: GameSlot; yours: boolean }) {
  const { state } = useGame();
  if (!state) return null;
  const line = hangLine(state, slot);
  const home = TEAM_BY_ID[slot.homeId];
  const away = TEAM_BY_ID[slot.awayId];
  const settled = Boolean(slot.resultId);
  const res = settled ? state.results.find((r) => r.slotId === slot.id) : null;
  const awaySpread = spreadLabel(line.homeSpread === 0 ? 0 : -line.homeSpread);
  const homeSpread = spreadLabel(line.homeSpread);

  return (
    <article className={`mkt-card ${yours ? "is-yours" : ""} ${settled ? "is-settled" : ""}`}>
      <p className="mkt-kicker">
        Week {slot.week} · {kindLabel(slot.kind)}
        {slot.site === "neutral" || slot.kind === "mte" || slot.kind === "ncaa" || slot.kind === "nit" || slot.kind === "crown" || slot.kind === "conf-tourney" ? " · Neutral" : ""}
        {yours ? " · Your game" : ""}
        {res ? ` · Final ${res.awayScore}–${res.homeScore}` : ""}
      </p>
      <div className="mkt-odds" role="table" aria-label="Odds">
        <div className="mkt-odds-head" role="row">
          <span role="columnheader" className="mkt-odds-team">
            Team
          </span>
          <span role="columnheader">Spread</span>
          <span role="columnheader">ML</span>
          <span role="columnheader">Total</span>
        </div>
        <div className="mkt-odds-row" role="row">
          <span className="mkt-odds-team" role="cell">
            <span className="mkt-dot" style={{ background: away?.color }} />
            <span className="mkt-odds-name">{away?.name ?? slot.awayId}</span>
          </span>
          <span className="tabular-nums" role="cell">
            {awaySpread}
          </span>
          <span className="tabular-nums" role="cell">
            {mlLabel(line.mlAway)}
          </span>
          <span className="tabular-nums" role="cell">
            O {line.total}
          </span>
        </div>
        <div className="mkt-odds-row" role="row">
          <span className="mkt-odds-team" role="cell">
            <span className="mkt-dot" style={{ background: home?.color }} />
            <span className="mkt-odds-name">{home?.name ?? slot.homeId}</span>
          </span>
          <span className="tabular-nums" role="cell">
            {homeSpread}
          </span>
          <span className="tabular-nums" role="cell">
            {mlLabel(line.mlHome)}
          </span>
          <span className="tabular-nums" role="cell">
            U {line.total}
          </span>
        </div>
      </div>
      <p className="mkt-exp text-muted">
        Projected {line.expAway.toFixed(0)}–{line.expHome.toFixed(0)} · {Math.round(line.pHome * 100)}% home
      </p>
    </article>
  );
}

export function MarketView() {
  const { state, setView } = useGame();
  const liveWeek = Math.max(1, state?.week || 1);
  const [week, setWeek] = useState(liveWeek);
  const maxWeek = useMemo(() => {
    if (!state) return liveWeek;
    const fromSked = state.schedule.reduce((m, g) => Math.max(m, g.week || 0), 1);
    return Math.max(liveWeek, fromSked, 1);
  }, [state, liveWeek]);
  const card = useMemo(() => (state ? weekCard(state, week) : []), [state, week]);
  if (!state) return null;

  return (
    <div className="mkt-sheet">
      <p className="mkt-kicker">Odds</p>
      <h1 className="font-display text-3xl">Betting odds</h1>
      <p className="mt-1 text-sm text-muted">
        Spread, moneyline, over/under. No betting.
      </p>

      <div className="mkt-week">
        <button
          type="button"
          className="mkt-week-btn"
          disabled={week <= 1}
          {...bindTap(() => setWeek((w) => Math.max(1, w - 1)))}
        >
          ←
        </button>
        <p className="mkt-week-label">Week {week}</p>
        <button
          type="button"
          className="mkt-week-btn"
          disabled={week >= maxWeek}
          {...bindTap(() => setWeek((w) => Math.min(maxWeek, w + 1)))}
        >
          →
        </button>
      </div>

      <div className="mkt-list">
        {card.length === 0 && <p className="text-sm text-muted">No numbers this week. Begin the season or sim.</p>}
        {card.map((line) => {
          const slot = state.schedule.find((g) => g.id === line.slotId);
          if (!slot) return null;
          return <OddsCard key={slot.id} slot={slot} yours={line.yours} />;
        })}
      </div>

      <button type="button" className="mkt-link" {...bindTap(() => setView("analytics"))}>
        Open the stats
      </button>
    </div>
  );
}
