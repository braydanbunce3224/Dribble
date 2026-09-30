import type { GameResult, GameState, Player, PodcastBeat, PodcastEpisode, PodcastShow, PodcastShowId } from "./types";
import { teamOf } from "./teams";
import { hashString, mulberry32, pick, type Rng } from "./rng";
import { identityName } from "./engine-util";
import { portalOf, portalOpen } from "./portal";
import { assemble, byeBanks, campBanks, gameBanks, marchBanks, offseasonBanks, portalLine, youLine } from "./podcast-lines";

const JARRED = "Jarred";
const BEN = "Ben";
const KALEB = "Kaleb";
const TRILL = "Trill Raff";

const DANA = "Dana";
const COLE = "Cole";

export const POD_SHOWS: PodcastShow[] = [
  {
    id: "catican",
    name: "The Catican",
    tagline: "Four friends. They should hang up more.",
    kicker: "Kentucky sports · Unsupervised",
    network: "NoseBleed Boosters",
    homeId: "kentucky",
    hosts: [
      { id: "jarred", name: JARRED },
      { id: "ben", name: BEN },
      { id: "kaleb", name: KALEB },
      { id: "trill", name: TRILL },
    ],
  },
  {
    id: "lockedon",
    name: "Locked On",
    tagline: "Your school. The record. The last game.",
    kicker: "Locked On",
    network: "Locked On",
    homeId: "kentucky",
    hosts: [
      { id: "dana", name: DANA },
      { id: "cole", name: COLE },
    ],
  },
];

const CATICAN_ID = "kentucky";
const RUNTIMES = ["47:19", "51:02", "54:12", "1:02:04", "1:04:33", "1:08:46", "1:10:40", "1:16:21", "1:26:13"];
const TICKER = ["new episode", "they're talking hoops", "Locked On your school", "Ben watched it back", "Kaleb already has a take"];

function paintShow(show: PodcastShow, state?: GameState): PodcastShow {
  if (!state || show.id !== "lockedon") return show;
  const school = teamOf(state.playerTeamId);
  return {
    ...show,
    name: `Locked On ${school.name}`,
    tagline: `${school.name}, every week. Record, last game, what it means.`,
    kicker: `${school.mascot} · Locked On`,
    homeId: state.playerTeamId,
  };
}

export function showOf(id: PodcastShowId, state?: GameState): PodcastShow {
  const base = POD_SHOWS.find((s) => s.id === id) ?? POD_SHOWS[0]!;
  return paintShow(base, state);
}

export function showsFor(state: GameState): PodcastShow[] {
  return POD_SHOWS
    .filter((s) => s.id !== "catican" || state.playerTeamId === CATICAN_ID)
    .map((s) => paintShow(s, state));
}

export function podcastTicker(state?: GameState) {
  const cats = state?.playerTeamId === CATICAN_ID;
  const bits = cats
    ? TICKER
    : ["new episode", "they're talking hoops", "Locked On your school", "the last game", "the record"];
  return bits.join("  ·  ");
}

export function episodesOf(state: GameState, showId?: PodcastShowId): PodcastEpisode[] {
  const all = state.podcasts ?? [];
  if (!showId) return all;
  return all.filter((e) => e.showId === showId);
}

export function podcastTease(state: GameState): { head: string; note: string } {
  const ep = (state.podcasts ?? []).find((e) => state.playerTeamId === CATICAN_ID || e.showId !== "catican");
  if (!ep) {
    const school = teamOf(state.playerTeamId).name;
    return state.playerTeamId === CATICAN_ID
      ? { head: "The Catican", note: "No episode yet. Play a week." }
      : { head: `Locked On ${school}`, note: "No episode yet. Play a week." };
  }
  const show = showOf(ep.showId, state);
  return { head: ep.title, note: `${show.name} · ${ep.runtime}` };
}

function catsTeam(state: GameState) {
  return state.teams[CATICAN_ID];
}

function catsCoach(state: GameState) {
  if (state.playerTeamId === CATICAN_ID) return identityName(state.identity);
  const c = catsTeam(state)?.coachName;
  return c && c !== "Staff" ? c : "Staff";
}

function recordOf(state: GameState, id: string) {
  const t = state.teams[id];
  if (!t) return "";
  return `${t.wins}-${t.losses}`;
}

function starOf(state: GameState, teamId: string): Player | null {
  return state.players.filter((p) => p.teamId === teamId && !p.redshirt).sort((a, b) => b.ovr - a.ovr || b.mpg - a.mpg)[0] ?? null;
}

function benchOf(state: GameState, teamId: string): Player | null {
  const rot = state.players.filter((p) => p.teamId === teamId && !p.redshirt).sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr);
  return rot[4] ?? rot[rot.length - 1] ?? null;
}

function nm(p: Player) {
  return `${p.first} ${p.last}`;
}

function gameThisWeek(state: GameState, teamId: string): GameResult | undefined {
  return [...state.results].reverse().find((r) => r.week === state.week && (r.homeId === teamId || r.awayId === teamId));
}

function won(r: GameResult, teamId: string) {
  return r.homeId === teamId ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
}

function oppOf(r: GameResult, teamId: string) {
  return r.homeId === teamId ? r.awayId : r.homeId;
}

function scoreLine(r: GameResult, teamId: string) {
  const us = r.homeId === teamId ? r.homeScore : r.awayScore;
  const them = r.homeId === teamId ? r.awayScore : r.homeScore;
  return `${us}-${them}`;
}

function leadName(state: GameState, r: GameResult, teamId: string): { name: string; id: string; pts?: number } | null {
  const rec = r.recap;
  const rows = teamId === r.homeId ? rec?.homeLeaders : rec?.awayLeaders;
  const top = rows?.[0];
  if (top) return { name: top.name, id: top.id, pts: top.pts };
  const p = starOf(state, teamId);
  return p ? { name: nm(p), id: p.id } : null;
}

function catsBox(r: GameResult) {
  const rec = r.recap;
  const home = r.homeId === CATICAN_ID;
  const row = (home ? rec?.homeLeaders : rec?.awayLeaders)?.[0];
  return {
    to: (home ? rec?.homeTo : rec?.awayTo) ?? 0,
    oppTo: (home ? rec?.awayTo : rec?.homeTo) ?? 0,
    orb: (home ? rec?.homeOrb : rec?.awayOrb) ?? 0,
    ppp: (home ? rec?.homePpp : rec?.awayPpp) ?? 0,
    fg: row && row.fga ? `${row.fgm} for ${row.fga}` : "",
    reb: row?.reb ?? 0,
    ast: row?.ast ?? 0,
    ot: (r.minutes ?? 40) > 40,
  };
}

function namesFor(state: GameState, r: GameResult | undefined): PodcastEpisode["names"] {
  const out: NonNullable<PodcastEpisode["names"]> = [];
  const star = starOf(state, CATICAN_ID);
  if (star) out.push({ name: nm(star), id: star.id, kind: "player" });
  const bench = benchOf(state, CATICAN_ID);
  if (bench && bench.id !== star?.id) out.push({ name: nm(bench), id: bench.id, kind: "player" });
  if (r) {
    const lead = leadName(state, r, CATICAN_ID);
    if (lead && !out.some((n) => n.id === lead.id)) out.push({ name: lead.name, id: lead.id, kind: "player" });
  }
  return out.slice(0, 4);
}


function pack(title: string, dek: string, runtime: string, beats: PodcastBeat[], names: PodcastEpisode["names"], resultId?: string) {
  return { title, dek, runtime, beats, names, resultId };
}

function mentionYou(state: GameState): PodcastBeat[] {
  if (state.playerTeamId === CATICAN_ID) return [];
  const played = [...state.results].reverse().find((r) =>
    (r.homeId === CATICAN_ID && r.awayId === state.playerTeamId) || (r.awayId === CATICAN_ID && r.homeId === state.playerTeamId),
  );
  if (!played || played.week !== state.week) return [];
  return [youLine(teamOf(state.playerTeamId).name, won(played, CATICAN_ID))];
}

function makeCatican(state: GameState, rng: Rng): Omit<PodcastEpisode, "id" | "showId" | "week" | "season" | "phase"> {
  const star = starOf(state, CATICAN_ID);
  const bench = benchOf(state, CATICAN_ID);
  const starN = star ? nm(star) : null;
  const benchN = bench && bench.id !== star?.id ? nm(bench) : null;
  const runtime = pick(rng, RUNTIMES);
  const rec = recordOf(state, CATICAN_ID);

  if (state.phase === "offseason") {
    const portal = portalOf(state).transfers.filter((t) => t.fromId === CATICAN_ID || t.committedTo === CATICAN_ID);
    const names = portal.slice(0, 3).map((t) => `${t.first} ${t.last}`);
    return pack(
      pick(rng, ["nobody's playing", "just phones", "is he staying", "offseason"]),
      names.length ? names.join(", ") : "Quiet so far.",
      runtime,
      assemble(rng, offseasonBanks(starN, names)),
      namesFor(state, undefined),
    );
  }

  if (state.phase === "conference" || state.phase === "selection" || state.phase === "ncaa" || state.phase === "nit" || state.phase === "crown") {
    const sel = state.selection;
    const bid = sel?.ncaa?.find((b) => b.teamId === CATICAN_ID);
    const r = gameThisWeek(state, CATICAN_ID);
    const champ = sel?.champ === CATICAN_ID;
    const title = champ
      ? pick(rng, ["they won it", "that's the one", "championship"])
      : bid
        ? pick(rng, [`${bid.seed} seed`, "they're in", `${bid.region}`])
        : pick(rng, ["this week", "selection", "where they landed"]);
    const dek = champ
      ? "They won the tournament."
      : bid
        ? `${bid.seed} seed, ${bid.region}.`
        : r
          ? `${scoreLine(r, CATICAN_ID)}.`
          : "March.";
    return pack(
      title,
      dek,
      runtime,
      assemble(rng, marchBanks({
        champ: Boolean(champ),
        seed: bid?.seed,
        region: bid?.region,
        playIn: bid?.playIn,
        nit: Boolean(sel?.nit?.includes(CATICAN_ID)),
        opp: r ? teamOf(oppOf(r, CATICAN_ID)).name : undefined,
        score: r ? scoreLine(r, CATICAN_ID) : undefined,
        won: r ? won(r, CATICAN_ID) : undefined,
      })),
      namesFor(state, r),
      r?.id,
    );
  }

  const r = gameThisWeek(state, CATICAN_ID);
  if (!r && !state.results.some((x) => x.homeId === CATICAN_ID || x.awayId === CATICAN_ID)) {
    return pack(
      pick(rng, ["camp", "no games yet", "roster talk", "before they tip"]),
      "They haven't played.",
      runtime,
      assemble(rng, campBanks(starN, benchN)),
      namesFor(state, undefined),
    );
  }
  if (!r) {
    return pack(
      pick(rng, ["no game", "bye week", "off this week", "nothing tipped"]),
      rec ? `They're ${rec}. No game.` : "No game.",
      runtime,
      assemble(rng, byeBanks(starN, rec)),
      namesFor(state, undefined),
    );
  }

  const opp = teamOf(oppOf(r, CATICAN_ID)).name;
  const score = scoreLine(r, CATICAN_ID);
  const w = won(r, CATICAN_ID);
  const margin = Math.abs(r.homeScore - r.awayScore);
  const lead = leadName(state, r, CATICAN_ID);
  const box = catsBox(r);
  const where = r.homeId === CATICAN_ID ? "at home" : "on the road";
  const beats = assemble(rng, gameBanks({
    opp,
    score,
    won: w,
    margin,
    where,
    lead: lead?.name ?? null,
    pts: lead?.pts,
    fg: box.fg,
    reb: box.reb,
    to: box.to,
    ot: box.ot,
    rec,
    coach: catsCoach(state),
  }));
  beats.push(...mentionYou(state));
  if (portalOpen(state) && rng() < 0.35) beats.push(portalLine());
  const title = w
    ? margin >= 16
      ? pick(rng, [lead ? `${lead.name.split(" ")[0]} went off` : `They handled ${opp}`, "Comfortable night", `${opp} had no answer`, where === "at home" ? "Rupp was easy" : `Easy one at ${opp}`, score])
      : pick(rng, [lead ? `${lead.name.split(" ")[0]} and a win` : `Past ${opp}`, "They got it", `${opp}, not comfortably`, "Good enough", score])
    : margin <= 4
      ? pick(rng, [`${opp}, one possession`, "That one stings", "They had the last shot", score, "Should have had it"])
      : pick(rng, [`${opp} got them`, "Not their night", `${opp} was the better team`, "Ugly film", score]);
  return pack(
    title,
    `${score} ${where}.${rec ? ` ${rec}.` : ""}`,
    runtime,
    beats,
    namesFor(state, r),
    r.id,
  );
}

function teamNames(state: GameState, teamId: string, r: GameResult | undefined): PodcastEpisode["names"] {
  const out: NonNullable<PodcastEpisode["names"]> = [];
  const star = starOf(state, teamId);
  if (star) out.push({ name: nm(star), id: star.id, kind: "player" });
  const bench = benchOf(state, teamId);
  if (bench && bench.id !== star?.id) out.push({ name: nm(bench), id: bench.id, kind: "player" });
  if (r) {
    const lead = leadName(state, r, teamId);
    if (lead && !out.some((n) => n.id === lead.id)) out.push({ name: lead.name, id: lead.id, kind: "player" });
  }
  return out.slice(0, 4);
}

function recentForm(state: GameState, teamId: string) {
  const games = state.results.filter((r) => r.homeId === teamId || r.awayId === teamId).slice(-5);
  let w = 0;
  let l = 0;
  for (const r of games) {
    if (won(r, teamId)) w += 1;
    else l += 1;
  }
  return { w, l, n: games.length };
}

function streakLine(state: GameState, teamId: string) {
  const games = state.results.filter((r) => r.homeId === teamId || r.awayId === teamId);
  if (!games.length) return "";
  const lastWin = won(games[games.length - 1]!, teamId);
  let n = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    if (won(games[i]!, teamId) !== lastWin) break;
    n += 1;
  }
  if (n < 2) return "";
  return `${n}-game ${lastWin ? "winning" : "losing"} streak`;
}

const LOCKED_TIMES = ["26:40", "29:18", "31:55", "34:02", "36:44", "38:11", "41:07"];

function say(speaker: string, line: string): PodcastBeat {
  return { speaker, line };
}

function makeLockedOn(state: GameState, rng: Rng): Omit<PodcastEpisode, "id" | "showId" | "week" | "season" | "phase"> {
  const id = state.playerTeamId;
  const school = teamOf(id);
  const name = school.name;
  const runtime = pick(rng, LOCKED_TIMES);
  const rt = state.teams[id];
  const rec = recordOf(state, id);
  const conf = rt && rt.confW + rt.confL > 0 ? `${rt.confW}-${rt.confL} in conference` : "";
  const home = rt ? `${rt.homeW}-${rt.homeL} at home` : "";
  const form = recentForm(state, id);
  const formLine = form.n ? `Last ${form.n} is ${form.w}-${form.l}.` : "";
  const streak = streakLine(state, id);
  const star = starOf(state, id);
  const starN = star ? nm(star) : null;
  const coach = identityName(state.identity);

  if (state.phase === "offseason") {
    const portal = portalOf(state).transfers.filter((t) => t.fromId === id || t.committedTo === id);
    const leaving = portal.filter((t) => t.fromId === id).map((t) => `${t.first} ${t.last}`);
    const arriving = portal.filter((t) => t.committedTo === id).map((t) => `${t.first} ${t.last}`);
    const bits = [
      leaving.length ? `Out: ${leaving.slice(0, 3).join(", ")}.` : "Nobody notable has left.",
      arriving.length ? `In: ${arriving.slice(0, 3).join(", ")}.` : "Nobody has signed in yet.",
    ].join(" ");
    return pack(
      pick(rng, [
        leaving[0] ? `${leaving[0].split(" ")[0]} is out` : "Summer desk",
        arriving[0] ? `${arriving[0].split(" ")[0]} is in` : "Who's coming back",
        starN ? `${starN.split(" ")[0]} and the summer` : "No games, just the roster",
        "The portal, then the gym",
        rec ? `They finished ${rec}` : "Offseason, no spin",
      ]),
      bits,
      runtime,
      [
        say(DANA, `Locked On ${name}. The season is over. ${rec ? `They finished ${rec}.` : "The record is in the book."}`),
        say(COLE, bits),
        say(DANA, starN ? `${starN} is the name that decides how next winter feels.` : "The roster is the whole show until they tip again."),
        say(COLE, `${coach} has the summer. Minutes, not rumors, are what we'll grade.`),
        say(DANA, "We'll be back when there's a game that counts."),
      ],
      teamNames(state, id, undefined),
    );
  }

  if (state.phase === "conference" || state.phase === "selection" || state.phase === "ncaa" || state.phase === "nit" || state.phase === "crown") {
    const sel = state.selection;
    const bid = sel?.ncaa?.find((b) => b.teamId === id);
    const r = gameThisWeek(state, id);
    const champ = sel?.champ === id;
    const opp = r ? teamOf(oppOf(r, id)).name : "";
    const score = r ? scoreLine(r, id) : "";
    const w = r ? won(r, id) : false;
    const lead = r ? leadName(state, r, id) : null;
    const title = champ
      ? pick(rng, ["They cut the nets", "Banner night", "That's the one", `${name} won it`])
      : bid
        ? pick(rng, [
            `${bid.seed} line, ${bid.region}`,
            bid.playIn ? "Play-in first" : `A ${bid.seed} seed`,
            "The committee's number",
            `${bid.region} bracket`,
          ])
        : r
          ? pick(rng, w
              ? [`Past ${opp}`, `${opp}, and they're still alive`, score, "March win"]
              : [`${opp} ends it`, `Out to ${opp}`, score, "Season's over"])
          : pick(rng, ["March, no game yet", "Waiting on the bracket", rec ? `The résumé is ${rec}` : "Selection week"]);
    const dek = champ
      ? `National champions. ${rec}.`
      : bid
        ? `${bid.seed} seed, ${bid.region}. ${rec}.`
        : r
          ? `${score} against ${opp}.`
          : rec;
    return pack(
      title,
      dek,
      runtime,
      [
        say(DANA, champ
          ? `Locked On ${name}. They won the tournament. ${rec ? `The year ends ${rec}.` : ""}`.trim()
          : bid
            ? `Locked On ${name}. The committee put them on the ${bid.seed} line in ${bid.region}${bid.playIn ? ", play-in" : ""}.`
            : `Locked On ${name}. March, and the résumé is ${rec || "still thin"}.`),
        say(COLE, r
          ? `${w ? "Win" : "Loss"} against ${opp}, ${score}. ${lead?.pts ? `${lead.name} had ${lead.pts}.` : ""} ${formLine}`.replace(/\s+/g, " ").trim()
          : `${formLine || "No game in the book this week."} ${conf}`.trim()),
        say(DANA, sel?.nit?.includes(id) && !bid
          ? "No NCAA bid. The NIT is the season they have left."
          : champ
            ? "That's the banner. Everything else was a step."
            : bid
              ? `A ${bid.seed} is the job in front of them, not a trophy.`
              : "The bracket is the performance now. The regular season is context."),
        say(COLE, streak ? `${streak}. ${home}.` : home || "One game at a time from here."),
        say(DANA, "That's the show. Same team next time."),
      ],
      teamNames(state, id, r),
      r?.id,
    );
  }

  const r = gameThisWeek(state, id);
  const played = state.results.some((x) => x.homeId === id || x.awayId === id);
  if (!r && !played) {
    const exp = state.expectations;
    return pack(
      pick(rng, [
        starN ? `${starN.split(" ")[0]} is the plan` : "Before they tip",
        exp ? `Win total: ${exp.wins}` : "Camp, not results",
        "No games yet",
        "The rotation is a guess",
      ]),
      exp ? `Win total: ${exp.wins}.` : "No games yet.",
      runtime,
      [
        say(DANA, `Locked On ${name}. They have not played a game that counts.`),
        say(COLE, starN ? `${starN} is the first option. The rest of the rotation has to prove it.` : "The rotation is still a guess."),
        say(DANA, exp ? `The preseason win total is ${exp.wins}. ${exp.note}` : `${coach} does not have a result to hide behind yet.`),
        say(COLE, "Camp talk is cheap. The first loss or the first comfortable win will tell us more than this episode."),
        say(DANA, "We'll do this every week once the ball is live."),
      ],
      teamNames(state, id, undefined),
    );
  }
  if (!r) {
    return pack(
      pick(rng, [
        "Bye week",
        "Nothing tipped",
        streak || "A week off the floor",
        rec ? `${rec}, and they sit` : "Off this week",
      ]),
      rec ? `${rec}. No game this week.` : "No game this week.",
      runtime,
      [
        say(DANA, `Locked On ${name}. Bye week. ${rec ? `They're ${rec}.` : "No line in the book yet."}`),
        say(COLE, [formLine, conf, home, streak].filter(Boolean).join(" ") || "Nothing new on the floor."),
        say(DANA, starN ? `The week off does not change what ${starN} has to be when they play again.` : "An off week does not move the résumé."),
        say(COLE, "We'll pick it up when they actually tip."),
      ],
      teamNames(state, id, undefined),
    );
  }

  const opp = teamOf(oppOf(r, id)).name;
  const score = scoreLine(r, id);
  const w = won(r, id);
  const margin = Math.abs(r.homeScore - r.awayScore);
  const where = r.homeId === id ? "at home" : "on the road";
  const lead = leadName(state, r, id);
  const row = (r.homeId === id ? r.recap?.homeLeaders : r.recap?.awayLeaders)?.[0];
  const fg = row && row.fga ? `${row.fgm} for ${row.fga}` : "";
  const boards = row?.reb ? `${row.reb} rebounds` : "";
  const dimes = row?.ast ? `${row.ast} assists` : "";
  const guy = lead
    ? `${lead.name}${lead.pts != null ? ` had ${lead.pts}` : ""}${fg ? ` on ${fg}` : ""}${boards ? `, ${boards}` : ""}${dimes ? `, ${dimes}` : ""}.`
    : "No one line jumped off the box.";
  const read = w
    ? margin >= 16
      ? "They looked like the better team for most of the night. That's the version you want on film."
      : margin <= 4
        ? "A win, and it was tight. The record will not say how nervous it was."
        : "They got it done. Not a masterpiece, and it still counts."
    : margin <= 4
      ? "They had a real chance. One or two possessions the other way and this episode sounds different."
      : `${opp} was the better team. No reason to dress the margin up.`;
  const first = lead?.name.split(" ")[0];
  const title = w
    ? margin >= 16
      ? pick(rng, [
          first ? `${first}'s night` : `They rolled ${opp}`,
          `${opp} never had it`,
          `${margin} points, no drama`,
          `Comfortable one against ${opp}`,
          score,
        ])
      : margin <= 4
        ? pick(rng, [
            `${opp}, one possession`,
            first ? `${first} at the end` : `${name} survives`,
            "It was tight",
            `${score}, and thinner than that`,
            `Survived ${opp}`,
          ])
        : pick(rng, [
            `Past ${opp}`,
            first ? `${first} showed up` : "They got the win",
            where === "at home" ? "Home win" : `Road win at ${opp}`,
            streak || score,
            `Not pretty, still ${opp}`,
          ])
    : margin <= 4
      ? pick(rng, [
          `${opp} by a possession`,
          "They had it",
          first ? `${first} wasn't enough` : `${score} the wrong way`,
          `One or two plays against ${opp}`,
          "That one sits",
        ])
      : pick(rng, [
          `${opp} was better`,
          `Not ${name}'s night`,
          first ? `Quiet night for ${first}` : `${opp} ran them off it`,
          where === "at home" ? `Home loss to ${opp}` : `Road loss at ${opp}`,
          score,
        ]);
  return pack(
    title,
    `${score} ${where}. ${rec ? `Season ${rec}.` : ""}`.trim(),
    runtime,
    [
      say(DANA, `Locked On ${name}. ${w ? "Win" : "Loss"} ${where} against ${opp}, ${score}. ${rec ? `The year is ${rec}.` : ""}`.replace(/\s+/g, " ").trim()),
      say(COLE, [conf, home, formLine, streak].filter(Boolean).join(" ") || "Still early."),
      say(DANA, guy),
      say(COLE, read),
      say(DANA, `${coach} does not get a trophy for the explanation. The next game is the correction.`),
      say(COLE, "That's the performance. We'll be back after the next one."),
    ],
    teamNames(state, id, r),
    r.id,
  );
}

function buildEpisode(state: GameState, show: PodcastShow, rng: Rng): PodcastEpisode {
  const body = show.id === "lockedon" ? makeLockedOn(state, rng) : makeCatican(state, rng);
  const week = state.phase === "preseason" ? 0 : state.week;
  return {
    id: `${show.id}-${state.season}-${week}-${state.phase}-${state.results.length}`,
    showId: show.id,
    week,
    season: state.season,
    phase: state.phase,
    ...body,
  };
}

export function catalogOf(state: GameState, showId: PodcastShowId): PodcastEpisode[] {
  const stored = episodesOf(state, showId);
  if (showId !== "lockedon" || stored.length > 0) return stored;
  const roll = mulberry32(state.seed ^ hashString("locked-live") ^ state.results.length ^ state.week);
  return [buildEpisode(state, showOf("lockedon", state), roll)];
}

export function tickPodcasts(state: GameState, rng?: Rng): GameState {
  const roll = rng ?? mulberry32(state.seed ^ (state.week * 104729) ^ hashString("pod") ^ state.results.length);
  let list = state.podcasts ?? [];
  for (const show of showsFor(state)) {
    const ep = buildEpisode(state, show, roll);
    list = [ep, ...list.filter((e) => e.id !== ep.id)];
  }
  if (state.playerTeamId !== CATICAN_ID) list = list.filter((e) => e.showId !== "catican");
  return { ...state, podcasts: list.slice(0, 40) };
}

export function hydratePodcasts(raw: GameState["podcasts"]): PodcastEpisode[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && e.id && e.showId && e.title && Array.isArray(e.beats) && e.beats.length);
}
