import { useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { TEAM_BY_ID } from "@/game/teams";
import { nextYourGame, liveScout } from "@/game/engine";
import { gameLog, matchup, playerTape, tapeLine, teamTape } from "@/game/analytics";
import { clutchSplit, confSplit, downloadText, rosterCsv, searchTape } from "@/game/sheet";
import { bindTap } from "@/lib/tap";

function pct(rank: number, n = 365) {
  return Math.round(100 * (1 - (rank - 1) / Math.max(1, n - 1)));
}

function Bar({
  label,
  rank,
  fmt,
}: {
  label: string;
  value: number;
  rank: number;
  goodHigh: boolean;
  fmt: string;
}) {
  const p = pct(rank);
  return (
    <div className="tape-factor">
      <div className="tape-factor-top">
        <span>{label}</span>
        <span className="tabular-nums">{fmt}</span>
      </div>
      <span className="interest-bar">
        <span style={{ width: `${Math.max(8, p)}%` }} className={p >= 50 ? "is-good" : "is-thin"} />
      </span>
      <p className="tape-rank">{rank} national</p>
    </div>
  );
}

export function AnalyticsView() {
  const { state, openRecap, openPlayer, exportLeague } = useGame();
  const [q, setQ] = useState("");
  if (!state) return null;
  const you = state.playerTeamId;
  const tape = useMemo(() => teamTape(state, you), [state, you]);
  const players = useMemo(() => playerTape(state, you), [state, you]);
  const log = useMemo(() => gameLog(state, you), [state, you]);
  const next = nextYourGame(state);
  const scout = next ? matchup(state, you, next.homeId === you ? next.awayId : next.homeId, next.week, next.homeId === you ? "home" : next.site === "neutral" ? "neutral" : "away") : null;
  const school = TEAM_BY_ID[you];
  const t = state.teams[you];
  const kp = tape.kp;

  return (
    <div className="tape-sheet">
      <p className="tape-kicker">Stats</p>
      <h1 className="font-display text-3xl">{school?.name ?? "Analytics"}</h1>
      <p className="mt-1 text-sm text-muted">
        {t ? `${t.wins}-${t.losses}` : "No record"} · {tapeLine(tape)}
      </p>

      {kp && (
        <div className="tape-em">
          <div>
            <p className="tape-kicker">AdjEM</p>
            <p className="tape-big tabular-nums">
              {kp.adjEM >= 0 ? "+" : ""}
              {kp.adjEM.toFixed(1)}
            </p>
            <p className="text-xs text-muted">{kp.rank} national</p>
          </div>
          <div>
            <p className="tape-kicker">AdjO</p>
            <p className="tape-mid tabular-nums">{kp.adjO.toFixed(1)}</p>
            <p className="text-xs text-muted">{kp.adjORank} · offense</p>
          </div>
          <div>
            <p className="tape-kicker">AdjD</p>
            <p className="tape-mid tabular-nums">{kp.adjD.toFixed(1)}</p>
            <p className="text-xs text-muted">{kp.adjDRank} · defense</p>
          </div>
          <div>
            <p className="tape-kicker">Tempo</p>
            <p className="tape-mid tabular-nums">{kp.adjT.toFixed(1)}</p>
            <p className="text-xs text-muted">{kp.adjTRank} · poss/40</p>
          </div>
        </div>
      )}

      {scout && (
        <div className="tape-match">
          <p className="tape-kicker">Next · week {scout.week}</p>
          <p className="font-display mt-1 text-2xl">
            {TEAM_BY_ID[scout.oppId]?.name} · {scout.expYou}–{scout.expOpp}
          </p>
          <p className="mt-1 text-sm text-muted">
            Your {scout.youAdjO.toFixed(1)} AdjO vs their {scout.oppAdjD.toFixed(1)} AdjD · {scout.tempo.toFixed(1)} possessions
          </p>
          <p className="mt-2 text-sm">{scout.note}</p>
          <ScoutAction />
        </div>
      )}

      <section>
        <p className="tape-kicker">Four factors · offense</p>
        <div className="tape-grid">
          <Bar label="True shooting" value={tape.off.ts} rank={tape.offRank.ts} goodHigh fmt={`${(tape.off.ts * 100).toFixed(1)}%`} />
          <Bar label="Turnover rate" value={tape.off.tov} rank={tape.offRank.tov} goodHigh={false} fmt={`${(tape.off.tov * 100).toFixed(1)}%`} />
          <Bar label="Off. boards / 100" value={tape.off.orb} rank={tape.offRank.orb} goodHigh fmt={tape.off.orb.toFixed(1)} />
          <Bar label="FT rate" value={tape.off.ftr} rank={tape.offRank.ftr} goodHigh fmt={tape.off.ftr.toFixed(2)} />
        </div>
      </section>

      <section>
        <p className="tape-kicker">Four factors · defense</p>
        <div className="tape-grid">
          <Bar label="TS% allowed" value={tape.def.ts} rank={tape.defRank.ts} goodHigh={false} fmt={`${(tape.def.ts * 100).toFixed(1)}%`} />
          <Bar label="TOs forced" value={tape.def.tov} rank={tape.defRank.tov} goodHigh fmt={`${(tape.def.tov * 100).toFixed(1)}%`} />
          <Bar label="OR allowed / 100" value={tape.def.orb} rank={tape.defRank.orb} goodHigh={false} fmt={tape.def.orb.toFixed(1)} />
          <Bar label="FT rate allowed" value={tape.def.ftr} rank={tape.defRank.ftr} goodHigh={false} fmt={tape.def.ftr.toFixed(2)} />
        </div>
      </section>

      <div className="tape-splits">
        <div>
          <p className="tape-kicker">Home</p>
          <p className="tabular-nums">
            {tape.homeW}-{tape.homeL} · {tape.homePpp.toFixed(2)} PPP
          </p>
        </div>
        <div>
          <p className="tape-kicker">Road</p>
          <p className="tabular-nums">
            {tape.awayW}-{tape.awayL} · {tape.awayPpp.toFixed(2)} PPP
          </p>
        </div>
        <div>
          <p className="tape-kicker">Luck</p>
          <p className="tabular-nums">{kp ? `${kp.luck >= 0 ? "+" : ""}${kp.luck.toFixed(3)}` : "—"}</p>
        </div>
        <div>
          <p className="tape-kicker">Conference</p>
          <p className="tabular-nums">{confSplit(state).w}-{confSplit(state).l}</p>
        </div>
        <div>
          <p className="tape-kicker">Clutch · 5 pts</p>
          <p className="tabular-nums">{clutchSplit(state).w}-{clutchSplit(state).l}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold" {...bindTap(() => downloadText(`${school?.abbr ?? "roster"}-roster.csv`, rosterCsv(state), "text/csv"))}>
          Export roster CSV
        </button>
        <button type="button" className="min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold" {...bindTap(() => downloadText("dribble-league.json", exportLeague(), "application/json"))}>
          Export league JSON
        </button>
      </div>
      <div>
        <input className="h-12 w-full rounded-lg border border-border bg-elevated px-3" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search play-by-play, a name, a school…" />
        {q.trim().length >= 2 && (
          <ul className="mt-2 space-y-1 text-sm">
            {searchTape(state, q).length === 0 ? <li className="text-muted">Nothing in the log.</li> : searchTape(state, q).map((row) => (
              <li key={row.id}>
                <button type="button" className="min-h-11 text-left" {...bindTap(() => openRecap(row.id))}>{row.line}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="tape-box">
        <p className="tape-box-h">Rotation · advanced</p>
        {players.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">Boxes fill after a final. Sim or play.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="tape-name">Player</th>
                <th>GP</th>
                <th>MIN</th>
                <th>PTS</th>
                <th>P40</th>
                <th>TS%</th>
                <th>USG</th>
              </tr>
            </thead>
            <tbody>
              {players.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td className="tape-name">
                    <button type="button" className="text-left font-semibold" {...bindTap(() => openPlayer(p.id))}>
                      <span className="recap-pos">{p.pos}</span>
                      {p.name}
                    </button>
                  </td>
                  <td>{p.gp}</td>
                  <td>{p.min}</td>
                  <td>{p.pts}</td>
                  <td>{p.p40.toFixed(1)}</td>
                  <td>{(p.ts * 100).toFixed(1)}</td>
                  <td>{p.usg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="tape-box">
        <p className="tape-box-h">Game log</p>
        {log.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">No games yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Wk</th>
                <th className="tape-name">Opp</th>
                <th></th>
                <th>Score</th>
                <th>PPP</th>
                <th>TS%</th>
              </tr>
            </thead>
            <tbody>
              {log.map((g) => (
                <tr key={g.resultId}>
                  <td>{g.week}</td>
                  <td className="tape-name">
                    <button type="button" className="tape-link" {...bindTap(() => openRecap(g.resultId, "analytics"))}>
                      {g.home ? "vs" : "@"} {TEAM_BY_ID[g.oppId]?.abbr ?? g.oppId}
                    </button>
                  </td>
                  <td className={g.won ? "text-win" : "text-loss"}>{g.won ? "W" : "L"}</td>
                  <td className="tabular-nums">
                    {g.pf}–{g.pa}
                  </td>
                  <td>{g.ppp.toFixed(2)}</td>
                  <td>{(g.ts * 100).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ScoutAction() {
  const { state, scoutOpp } = useGame();
  if (!state) return null;
  const card = liveScout(state);
  if (card) {
    return (
      <ul className="mt-3 space-y-1 text-xs text-muted">
        {card.keys.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
    );
  }
  return (
    <button type="button" className="mt-3 min-h-11 w-full rounded-lg bg-bg text-sm font-semibold" {...bindTap(scoutOpp)}>
      Spend an hour · scout them
    </button>
  );
}
