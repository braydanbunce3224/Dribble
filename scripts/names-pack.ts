import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TEAM_BY_ID } from "../src/game/teams";
import { applyNamePack, parseCsvPack, parseNamePack, parseNameText, packToCsv, resetNames } from "../src/game/names";

const raw = JSON.parse(readFileSync("public/packs/real-schools.json", "utf8"));
const parsed = parseNamePack(raw);
assert.equal(parsed.ok, true, "pack should parse");
if (!parsed.ok) throw new Error(parsed.error);
assert.equal(TEAM_BY_ID.kentucky?.name, "Lexington");
const n = applyNamePack(parsed.pack);
assert.equal(n, 365);
assert.equal(TEAM_BY_ID.kentucky?.name, "Kentucky");
assert.equal(TEAM_BY_ID.duke?.name, "Duke");
assert.equal(TEAM_BY_ID.unc?.abbr, "UNC");
assert.equal(TEAM_BY_ID.ucla?.mascot, "Bruins");
resetNames();
assert.equal(TEAM_BY_ID.kentucky?.name, "Lexington");

const txt = readFileSync("public/packs/real-schools.txt", "utf8");
const txtParsed = parseNameText(txt);
assert.equal(txtParsed.ok, true, "txt should parse");
if (!txtParsed.ok) throw new Error(txtParsed.error);
assert.equal(txtParsed.pack.title, "Real school names");
applyNamePack(txtParsed.pack);
assert.equal(TEAM_BY_ID.kentucky?.name, "Kentucky");
assert.equal(TEAM_BY_ID.duke?.mascot, "Blue Devils");
resetNames();

const csv = readFileSync("public/packs/real-schools.csv", "utf8");
const csvParsed = parseCsvPack(csv, "Real school names");
assert.equal(csvParsed.ok, true, "csv should parse");
if (!csvParsed.ok) throw new Error(csvParsed.error);
applyNamePack(csvParsed.pack);
assert.equal(TEAM_BY_ID.kentucky?.name, "Kentucky");
assert.equal(TEAM_BY_ID.duke?.mascot, "Blue Devils");
const dumped = packToCsv(csvParsed.pack);
assert.match(dumped, /^id,name,mascot,abbr\n/);
assert.match(dumped, /kentucky,Kentucky,Wildcats,UK/);
resetNames();

const pasted = parseNameText(`{
  "title": "Partial",
  "teams": { "kentucky": { "name": "Cats", "mascot": "Blue", "abbr": "CAT" } }
}`);
assert.equal(pasted.ok, true);
if (!pasted.ok) throw new Error(pasted.error);
applyNamePack(pasted.pack);
assert.equal(TEAM_BY_ID.kentucky?.name, "Cats");
assert.equal(TEAM_BY_ID.duke?.name, "Durham");
resetNames();

applyNamePack(parsed.pack);
assert.equal(TEAM_BY_ID.duke?.name, "Duke");
applyNamePack(pasted.pack);
assert.equal(TEAM_BY_ID.kentucky?.name, "Cats");
assert.equal(TEAM_BY_ID.duke?.name, "Duke", "partial import should overlay, not reset others");
resetNames();

const arrayPack = parseNamePack([{ id: "unc", name: "North Carolina", mascot: "Tar Heels", abbr: "UNC" }]);
assert.equal(arrayPack.ok, true);
if (!arrayPack.ok) throw new Error(arrayPack.error);
applyNamePack(arrayPack.pack);
assert.equal(TEAM_BY_ID.unc?.name, "North Carolina");
resetNames();

const template = JSON.parse(readFileSync("public/packs/custom-template.json", "utf8"));
const tpl = parseNamePack(template);
assert.equal(tpl.ok, true);
if (!tpl.ok) throw new Error(tpl.error);
assert.equal(Object.keys(tpl.pack.teams ?? {}).length, 365);
assert.equal(tpl.pack.teams?.kentucky?.name, "Lexington");

console.log("NAMES PACK OK", parsed.pack.title, n, "json/csv/paste/array/template");
