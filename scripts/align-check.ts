import assert from "node:assert/strict";
import { conferenceInYear, applyYearRealignment, eraDecadeForSeason } from "../src/game/align";
import { newDynasty, startNextSeason, yourGames } from "../src/game/engine";
import { TEAM_BY_ID } from "../src/game/teams";

function conf(id: string, year: number) {
  return conferenceInYear(id, year);
}

assert.equal(conf("ucla", 1960), "P12");
assert.equal(conf("ucla", 2020), "P12");
assert.equal(conf("ucla", 2024), "B10");
assert.equal(conf("ucla", 2026), "B10");
assert.equal(conf("kentucky", 1960), "SEC");
assert.equal(conf("texas", 1960), "SWC");
assert.equal(conf("texas", 1996), "B12");
assert.equal(conf("texas", 2024), "SEC");
assert.equal(conf("oklahoma", 2020), "B12");
assert.equal(conf("oklahoma", 2024), "SEC");
assert.equal(conf("syracuse", 1960), "IND");
assert.equal(conf("syracuse", 1979), "BE");
assert.equal(conf("syracuse", 2013), "ACC");
assert.equal(conf("arizona", 1960), "MW");
assert.equal(conf("arizona", 1978), "P12");
assert.equal(conf("arizona", 2024), "B12");
assert.equal(conf("missouri", 2011), "B12");
assert.equal(conf("missouri", 2012), "SEC");
assert.equal(conf("maryland", 2013), "ACC");
assert.equal(conf("maryland", 2014), "B10");
assert.equal(conf("gonzaga", 2020), "WCC");
assert.equal(conf("gonzaga", 2024), "P12");
assert.equal(conf("uconn", 2015), "AAC");
assert.equal(conf("uconn", 2020), "BE");
assert.equal(conf("cal", 2023), "P12");
assert.equal(conf("cal", 2024), "ACC");
assert.equal(eraDecadeForSeason(1968, 1960), 1960);
assert.equal(eraDecadeForSeason(1972, 1960), 1970);
assert.equal(eraDecadeForSeason(2026, 1960), 2020);
assert.equal(eraDecadeForSeason(2026, null), null);

const s60 = newDynasty("ucla", 1960, { careerMode: false, eraDecade: 1960, identity: { first: "John", last: "Wood", age: 44, almaMaterId: "ucla" } });
assert.equal(s60.season, 1960);
assert.equal(s60.teams.ucla?.conference, "P12");
assert.equal(s60.teams.kentucky?.conference, "SEC");
assert.equal(s60.teams.texas?.conference, "SWC");
assert.equal(s60.teams.syracuse?.conference, "IND");
assert.equal(s60.teams.kansas?.conference, "B12");
const slope = Object.values(s60.teams).filter((t) => t.conference === "P12").map((t) => t.id).sort();
assert.ok(slope.includes("ucla") && slope.includes("cal") && !slope.includes("arizona"), `pac 1960 ${slope.join(",")}`);
assert.equal(slope.length, 6, `AAWU 1960 was ${slope.length}: ${slope.join(",")}`);

const s20 = newDynasty("ucla", 2020, { careerMode: false, eraDecade: 2020, identity: { first: "Era", last: "Now", age: 44, almaMaterId: "ucla" } });
assert.equal(s20.teams.ucla?.conference, "P12");
assert.equal(s20.teams.texas?.conference, "B12");
assert.equal(s20.teams.oklahoma?.conference, "B12");
assert.equal(s20.teams.gonzaga?.conference, "WCC");

const modern = newDynasty("ucla", 9, { careerMode: false, identity: { first: "Mod", last: "Ern", age: 40, almaMaterId: "ucla" } });
assert.equal(modern.teams.ucla?.conference, TEAM_BY_ID.ucla?.conference);
assert.equal(modern.teams.texas?.conference, "SEC");

let walk = s60;
walk = applyYearRealignment(walk, 1960, 1978);
assert.equal(walk.teams.arizona?.conference, "P12");
assert.equal(walk.teams["georgia-tech"]?.conference, "IND");
walk = applyYearRealignment(walk, 1978, 1979);
assert.equal(walk.teams.syracuse?.conference, "BE");
assert.equal(walk.teams["georgia-tech"]?.conference, "ACC");
assert.ok(walk.news[0]?.headline.toLowerCase().includes("realign") || walk.news[0]?.headline.includes("Salt City") || walk.news[0]?.kicker === "Realignment");

walk = applyYearRealignment(walk, 1979, 1996);
assert.equal(walk.teams.texas?.conference, "B12");
assert.equal(walk.teams.arkansas?.conference, "SEC");
walk = applyYearRealignment(walk, 1996, 2012);
assert.equal(walk.teams.missouri?.conference, "SEC");
walk = applyYearRealignment(walk, 2012, 2024);
assert.equal(walk.teams.ucla?.conference, "B10");
assert.equal(walk.teams.texas?.conference, "SEC");
assert.equal(walk.teams.cal?.conference, "ACC");

const next = startNextSeason({
  ...s60,
  phase: "offseason",
  offseasonReport: { grew: [], graduated: [], incoming: [], walkons: [], pointsEarned: 1 },
  contractReview: null,
});
assert.equal(next.season, 1961);
assert.equal(next.teams.ucla?.conference, "P12");
const ukConf = yourGames(s60).filter((g) => g.kind === "conference");
assert.ok(ukConf.length >= 7, `1960 UCLA conference games ${ukConf.length}`);
assert.ok(ukConf.every((g) => {
  const opp = g.homeId === "ucla" ? g.awayId : g.homeId;
  return s60.teams[opp]?.conference === "P12";
}), "1960 UCLA played a non-Slope conference game");

console.log("ALIGN OK", "1960 Pac", slope.length, "UCLA conf games", ukConf.length, "2024 UCLA", conf("ucla", 2024));
