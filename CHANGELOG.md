# Changelog

## Championship build 32 — QA

QA: Selection/bracket truth, no phantom Test U, hide dev tools, roster minutes, fatigue labels, copy cleanup.

Gym, News, Résumé, and Bracket use one Selection Day status. A school in the field of 68 is listed that way everywhere and sits on the official bracket. A school out of the field says NIT, CBI, or Outside the field — not Home for March.

Add a school starts blank. Submitting a school does not also insert Test U. Old default Test U rows are purged on load.

Settings hides the sandbox, sim test, and force-endgame jumps unless `?dev=1`. About is a player page, not the architecture notes.

A new career opens at 200 minutes or fewer. A crowded rotation trims to 200 before tipoff and says so. Live chips follow minutes: a high-minute player in the second half is not labeled Fresh.

Awards, cup games, whistles, the résumé footer, and the week-one recruiting line use the player copy.

## Championship build 31 — presentation

Win probability treated the clock as minutes, so a 30-point hole at the half still looked like a 30–40% game. The clock is seconds. Down 30 with 20:00 left is now single digits. Up 2 with the ball at 0:09 is the mid-90s. Up 4 at 0:04 is 95% or better. Possession only moves the number inside the last 40 seconds.

"Cut the nets" and national champions only happen after a win in the national title game. A first-round win says the next round. A title-game loss is national runner-up. Conference champions only happen after the conference final (`confAliveBefore` is two teams). A semi says advance. A final loss says conference finalist.

Awards use points, rebounds, assists, team wins, and conference place. A 14-point player on a 9th-place team is not national player of the year. Retired numbers are a national award, 1,800 career points, or an 86-overall senior who scored. The record book shows the live W–L for the current season. The home streak on the record page is the longest streak; the current streak resets after a home loss. Neutral games stay neutral.

God Mode endgame and 2-for-1 jumps are sandbox games. Leaving them does not write a box, a win, or an archive. The floor says "Test game — not counted."

The halftime "mix the plan" line only shows while the second half is still at 20:00. Free throws do not say kick-out, and they do not say "at the line" twice. The named scorer is the player who gets the points. The named fouler is the defender who is charged. Overtime starts with the team that did not just have the ball. Fatigue stays hidden until someone is actually tired. Usage is blank until it is stored, instead of a fake 38.

Architecture and Privacy are separate buttons. After Selection Sunday the bracket says the field is locked. Recruiting shows hours left and a Long shot tag when the chance is under 15, or a 4- or 5-star is well under the sign floor. Sign math is unchanged.

## Player box monsters

A make was scored twice on the sheet: once as field goals or free throws, and again as a raw point add. One shooter could keep that line all night, so a final of 71–68 still showed Keegan Ramirez Jr at 73 or 71, with a teammate on 0. Points now come only from the made twos, threes, and free throws. Anyone still at 50 or on a 40-point 0/0 has those baskets moved to a teammate, and the team total stays the scoreboard. Archive lines drop 0-point names. A saved 71 or 73 is rewritten when the save opens: from the corrected box if that game is still in the file, otherwise the name stays and the number comes down under 50. The single-game record book drops a 50-point entry.

## Sim season

The gym has a Sim season button next to Sim week. It plays the year one week at a time and lists your results as they land (newest first). Tap a line for the box. Stop sim halts after the current week so you can change the rotation, minutes, or a call, then start again. It pauses on Selection Sunday so you can watch the show, then continues through March if you sim again. The year stops itself when the offseason opens.

## Scoreboard and box

The final header was the full scoreboard. The TEAM row added only the players on screen (live box kept 8, recap kept 13), so a couple of bench points showed up as a 4-point desync (68–70 vs 64–66). Both boxes now list everyone who played, and the TEAM row is that full sum. `reconcileFinal` also closes any leftover gap, including overtime, so the header, the TEAM row, and the player points are one number.

## Player lines

Quick-sim logged a 70-point line and did not rebuild it, so 71/0/0 and a 73-point single-game entry could be saved. `simContest` now runs the same `topUp` check as a live final. 70+ points, a 60-point 0/0, or one player taking over half the shots is rebuilt across the rotation. A 30–45 point night is not. The record book will not store a 70-point single-game line.

## Archives

The season row was written only in the offseason, so a year that had already reached Selection Sunday (for example 14–18, 10–4) still showed “Finish a season to fill this.” Selection Sunday now writes the row: record, conference record, bid or NIT/CBI, standings, and box scores. Closing the year updates that same row with the champion and awards. A second season adds a second row. The log is part of the save.
