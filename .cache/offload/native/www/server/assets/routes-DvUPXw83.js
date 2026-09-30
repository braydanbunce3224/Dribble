import { Fragment, useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CalendarDays, ClipboardList, Ellipsis, LayoutGrid, ListOrdered, Mail, Newspaper, Trophy, Users } from "lucide-react";
import { create } from "zustand";
//#region src/game/types.ts
var START_SEASON = 2026;
//#endregion
//#region src/game/teams.ts
var CONFERENCES = [
	{
		id: "AE",
		name: "North Atlantic",
		short: "N. Atl.",
		prestige: 54
	},
	{
		id: "AAC",
		name: "Gulf Circuit",
		short: "Gulf",
		prestige: 64
	},
	{
		id: "ACC",
		name: "Coastal",
		short: "Coastal",
		prestige: 76
	},
	{
		id: "ASUN",
		name: "Sunshine",
		short: "Sun",
		prestige: 52
	},
	{
		id: "A10",
		name: "Tenfold",
		short: "Tenfold",
		prestige: 64
	},
	{
		id: "BE",
		name: "Eastern",
		short: "Eastern",
		prestige: 76
	},
	{
		id: "BSKY",
		name: "High Country",
		short: "High Ctry",
		prestige: 52
	},
	{
		id: "BSOU",
		name: "Carolina Hills",
		short: "Hills",
		prestige: 52
	},
	{
		id: "B10",
		name: "Great Lakes",
		short: "Lakes",
		prestige: 77
	},
	{
		id: "B12",
		name: "Plains",
		short: "Plains",
		prestige: 78
	},
	{
		id: "BW",
		name: "Pacific West",
		short: "Pac West",
		prestige: 56
	},
	{
		id: "CAA",
		name: "Tidewater",
		short: "Tidewater",
		prestige: 56
	},
	{
		id: "CUSA",
		name: "Mid-South",
		short: "Mid-South",
		prestige: 58
	},
	{
		id: "HOR",
		name: "Lakeshore",
		short: "Shore",
		prestige: 54
	},
	{
		id: "IVY",
		name: "Ancient Eight",
		short: "Eight",
		prestige: 58
	},
	{
		id: "MAAC",
		name: "Metro East",
		short: "Metro",
		prestige: 54
	},
	{
		id: "MAC",
		name: "Heartland",
		short: "Heartland",
		prestige: 56
	},
	{
		id: "MEAC",
		name: "Mid-Atlantic",
		short: "Mid-Atl",
		prestige: 48
	},
	{
		id: "MVC",
		name: "Valley",
		short: "Valley",
		prestige: 62
	},
	{
		id: "MW",
		name: "Mountain",
		short: "Mountain",
		prestige: 64
	},
	{
		id: "NEC",
		name: "Northeast Ridge",
		short: "Ridge",
		prestige: 48
	},
	{
		id: "OVC",
		name: "River",
		short: "River",
		prestige: 52
	},
	{
		id: "PAT",
		name: "Heritage",
		short: "Heritage",
		prestige: 52
	},
	{
		id: "P12",
		name: "Pacific Slope",
		short: "Slope",
		prestige: 72
	},
	{
		id: "SEC",
		name: "Southern",
		short: "Southern",
		prestige: 78
	},
	{
		id: "SOC",
		name: "Appalachian",
		short: "App",
		prestige: 56
	},
	{
		id: "SLAND",
		name: "Bayou",
		short: "Bayou",
		prestige: 52
	},
	{
		id: "SWAC",
		name: "Delta",
		short: "Delta",
		prestige: 48
	},
	{
		id: "SUM",
		name: "Prairie",
		short: "Prairie",
		prestige: 54
	},
	{
		id: "SBC",
		name: "Sun Circuit",
		short: "Sun Cir",
		prestige: 58
	},
	{
		id: "UAC",
		name: "Heartland South",
		short: "H. South",
		prestige: 54
	},
	{
		id: "WCC",
		name: "Pacific Rim",
		short: "Rim",
		prestige: 62
	}
];
var RAW = [
	[
		"albany",
		"Albany",
		"Drifts",
		"ALB",
		"AE",
		"Albany",
		"NY",
		"#46166B"
	],
	[
		"binghamton",
		"Vestal",
		"Gulfs",
		"VES",
		"AE",
		"Vestal",
		"NY",
		"#005A43"
	],
	[
		"bryant",
		"Smithfield",
		"Stakes",
		"SMI",
		"AE",
		"Smithfield",
		"RI",
		"#000000"
	],
	[
		"maine",
		"Orono",
		"Quills",
		"ORO",
		"AE",
		"Orono",
		"ME",
		"#003263"
	],
	[
		"umbc",
		"Catonsville",
		"Fields",
		"CAT",
		"AE",
		"Baltimore",
		"MD",
		"#FDB515"
	],
	[
		"umass-lowell",
		"Lowell",
		"Spruce",
		"LOW",
		"AE",
		"Lowell",
		"MA",
		"#003DA5"
	],
	[
		"unh",
		"Durham North",
		"Trenches",
		"DN",
		"AE",
		"Durham",
		"NH",
		"#003087"
	],
	[
		"njit",
		"University Heights",
		"Tills",
		"UH",
		"AE",
		"Newark",
		"NJ",
		"#D22630"
	],
	[
		"vermont",
		"Burlington",
		"Cairns",
		"BUR",
		"AE",
		"Burlington",
		"VT",
		"#154734"
	],
	[
		"charlotte",
		"Charlotte",
		"Branches",
		"CHA",
		"AAC",
		"Charlotte",
		"NC",
		"#005035"
	],
	[
		"ecu",
		"Uptown Green",
		"Scarps",
		"UG",
		"AAC",
		"Greenville",
		"NC",
		"#592A8A"
	],
	[
		"fau",
		"Boca Raton",
		"Roosts",
		"BR",
		"AAC",
		"Boca Raton",
		"FL",
		"#003366"
	],
	[
		"memphis",
		"Bluff City",
		"Bluff",
		"BLF",
		"AAC",
		"Memphis",
		"TN",
		"#0D2240"
	],
	[
		"north-texas",
		"Denton",
		"Trestles",
		"DEN",
		"AAC",
		"Denton",
		"TX",
		"#00853E"
	],
	[
		"rice",
		"Hermann",
		"Drifts",
		"HER",
		"AAC",
		"Houston",
		"TX",
		"#00205B"
	],
	[
		"usf",
		"Tampa",
		"Wicks",
		"TAM",
		"AAC",
		"Tampa",
		"FL",
		"#006747"
	],
	[
		"temple",
		"Broad Street",
		"Drifts",
		"BS",
		"AAC",
		"Philadelphia",
		"PA",
		"#9D2235"
	],
	[
		"uab",
		"Birmingham",
		"Inlets",
		"BIR",
		"AAC",
		"Birmingham",
		"AL",
		"#1E6B52"
	],
	[
		"utsa",
		"San Antonio",
		"Thaws",
		"SA",
		"AAC",
		"San Antonio",
		"TX",
		"#0C2340"
	],
	[
		"tulane",
		"Uptown",
		"Canyons",
		"UPT",
		"AAC",
		"New Orleans",
		"LA",
		"#006747"
	],
	[
		"tulsa",
		"Tulsa",
		"Harbors",
		"TUL",
		"AAC",
		"Tulsa",
		"OK",
		"#002D72"
	],
	[
		"wichita-state",
		"Wichita",
		"Marshes",
		"WIC",
		"AAC",
		"Wichita",
		"KS",
		"#000000"
	],
	[
		"boston-college",
		"Chestnut Hill",
		"Falls",
		"CHL",
		"ACC",
		"Chestnut Hill",
		"MA",
		"#8C2232"
	],
	[
		"cal",
		"Berkeley",
		"Grove",
		"BRK",
		"ACC",
		"Berkeley",
		"CA",
		"#003262"
	],
	[
		"clemson",
		"Fort Hill",
		"Hill",
		"FTH",
		"ACC",
		"Clemson",
		"SC",
		"#F56600"
	],
	[
		"duke",
		"Durham",
		"Hillmen",
		"DUR",
		"ACC",
		"Durham",
		"NC",
		"#003087"
	],
	[
		"fsu",
		"Cascades",
		"Spear",
		"CAS",
		"ACC",
		"Tallahassee",
		"FL",
		"#782F40"
	],
	[
		"georgia-tech",
		"Midtown",
		"Gold",
		"MID",
		"ACC",
		"Atlanta",
		"GA",
		"#B3A369"
	],
	[
		"louisville",
		"Falls City",
		"Falls",
		"FLS",
		"ACC",
		"Louisville",
		"KY",
		"#AD0000"
	],
	[
		"miami",
		"Coral Gables",
		"Gale",
		"CGB",
		"ACC",
		"Coral Gables",
		"FL",
		"#F47321"
	],
	[
		"unc",
		"Chapel Hill",
		"Pines",
		"CHH",
		"ACC",
		"Chapel Hill",
		"NC",
		"#4B9CD3"
	],
	[
		"nc-state",
		"Raleigh",
		"Red",
		"RAL",
		"ACC",
		"Raleigh",
		"NC",
		"#CC0000"
	],
	[
		"notre-dame",
		"South Bend",
		"Gold",
		"SBN",
		"ACC",
		"South Bend",
		"IN",
		"#0C2340"
	],
	[
		"pitt",
		"Steel City",
		"Steel",
		"STL",
		"ACC",
		"Pittsburgh",
		"PA",
		"#003594"
	],
	[
		"smu",
		"Park Cities",
		"Park",
		"PKC",
		"ACC",
		"Dallas",
		"TX",
		"#C8102E"
	],
	[
		"stanford",
		"The Farm",
		"Farm",
		"FRM",
		"ACC",
		"Stanford",
		"CA",
		"#8C1515"
	],
	[
		"syracuse",
		"Salt City",
		"Salt",
		"SLT",
		"ACC",
		"Syracuse",
		"NY",
		"#F76900"
	],
	[
		"virginia",
		"Grounds",
		"Grounds",
		"GRD",
		"ACC",
		"Charlottesville",
		"VA",
		"#232D4B"
	],
	[
		"virginia-tech",
		"Blacksburg",
		"Scarps",
		"BLA",
		"ACC",
		"Blacksburg",
		"VA",
		"#630031"
	],
	[
		"wake-forest",
		"Winston",
		"Old Gold",
		"WIN",
		"ACC",
		"Winston-Salem",
		"NC",
		"#9E7E38"
	],
	[
		"bellarmine",
		"Newburg",
		"Marrows",
		"NEW",
		"ASUN",
		"Louisville",
		"KY",
		"#8C2232"
	],
	[
		"fgcu",
		"Fort Myers",
		"Locks",
		"FM",
		"ASUN",
		"Fort Myers",
		"FL",
		"#002D72"
	],
	[
		"jacksonville",
		"Arlington FL",
		"Shoals",
		"AF",
		"ASUN",
		"Jacksonville",
		"FL",
		"#00539B"
	],
	[
		"lipscomb",
		"Green Hills",
		"Docks",
		"GH",
		"ASUN",
		"Nashville",
		"TN",
		"#331E54"
	],
	[
		"unf",
		"Northside",
		"Surges",
		"NOR",
		"ASUN",
		"Jacksonville",
		"FL",
		"#002855"
	],
	[
		"queens",
		"Charlotte NC",
		"Quarries",
		"CN",
		"ASUN",
		"Charlotte",
		"NC",
		"#003DA5"
	],
	[
		"stetson",
		"DeLand",
		"Coasts",
		"DEL",
		"ASUN",
		"DeLand",
		"FL",
		"#0C2340"
	],
	[
		"west-florida",
		"Pensacola",
		"Isthmus",
		"PEN",
		"ASUN",
		"Pensacola",
		"FL",
		"#00205B"
	],
	[
		"davidson",
		"Davidson",
		"Scree",
		"DAV",
		"A10",
		"Davidson",
		"NC",
		"#AC1A2F"
	],
	[
		"dayton",
		"Gem City",
		"Fly",
		"GEM",
		"A10",
		"Dayton",
		"OH",
		"#CE1141"
	],
	[
		"duquesne",
		"Pittsburgh PA",
		"Wharfs",
		"PP",
		"A10",
		"Pittsburgh",
		"PA",
		"#041E42"
	],
	[
		"fordham",
		"Rose Hill",
		"Isthmus",
		"RH",
		"A10",
		"Bronx",
		"NY",
		"#860038"
	],
	[
		"george-mason",
		"Fairfax",
		"Gulfs",
		"FAI",
		"A10",
		"Fairfax",
		"VA",
		"#006633"
	],
	[
		"george-washington",
		"Foggy Bottom",
		"Crosses",
		"FB",
		"A10",
		"Washington",
		"DC",
		"#003368"
	],
	[
		"lasalle",
		"Olney",
		"Hearths",
		"OLN",
		"A10",
		"Philadelphia",
		"PA",
		"#003087"
	],
	[
		"loyola-chicago",
		"Rogers Park",
		"Trestles",
		"RP",
		"A10",
		"Chicago",
		"IL",
		"#922247"
	],
	[
		"uri",
		"Kingston",
		"Chords",
		"KIN",
		"A10",
		"Kingston",
		"RI",
		"#002147"
	],
	[
		"richmond",
		"The Fan",
		"Cedars",
		"TF",
		"A10",
		"Richmond",
		"VA",
		"#000066"
	],
	[
		"st-bonaventure",
		"Allegany",
		"Folds",
		"ALL",
		"A10",
		"St. Bonaventure",
		"NY",
		"#79232F"
	],
	[
		"saint-josephs",
		"Overbrook",
		"Loam",
		"OVE",
		"A10",
		"Philadelphia",
		"PA",
		"#9D2235"
	],
	[
		"saint-louis",
		"St. Louis",
		"Embers",
		"SL",
		"A10",
		"St. Louis",
		"MO",
		"#003DA5"
	],
	[
		"vcu",
		"Monroe Park",
		"Flats",
		"MP",
		"A10",
		"Richmond",
		"VA",
		"#000000"
	],
	[
		"butler",
		"Hinkle",
		"Hinkle",
		"HNK",
		"BE",
		"Indianapolis",
		"IN",
		"#13294B"
	],
	[
		"creighton",
		"Omaha West",
		"Blue",
		"OMA",
		"BE",
		"Omaha",
		"NE",
		"#005EB8"
	],
	[
		"depaul",
		"Lincoln Park",
		"Lake",
		"LPK",
		"BE",
		"Chicago",
		"IL",
		"#005EB8"
	],
	[
		"georgetown",
		"The Harbor",
		"Harbor",
		"HBR",
		"BE",
		"Washington",
		"DC",
		"#041E42"
	],
	[
		"marquette",
		"Milwaukee East",
		"Gold",
		"MKE",
		"BE",
		"Milwaukee",
		"WI",
		"#003366"
	],
	[
		"providence",
		"College Hill RI",
		"Groves",
		"PVD",
		"BE",
		"Providence",
		"RI",
		"#000000"
	],
	[
		"st-johns",
		"Queens",
		"Red",
		"QNS",
		"BE",
		"Queens",
		"NY",
		"#BA0C2F"
	],
	[
		"seton-hall",
		"South Orange",
		"Ash",
		"SO",
		"BE",
		"South Orange",
		"NJ",
		"#004488"
	],
	[
		"uconn",
		"Storrs",
		"Oaks",
		"STO",
		"BE",
		"Storrs",
		"CT",
		"#000E2F"
	],
	[
		"villanova",
		"Main Line",
		"Navy",
		"MLN",
		"BE",
		"Villanova",
		"PA",
		"#13B5EA"
	],
	[
		"xavier",
		"Norwood",
		"Blue",
		"NORW",
		"BE",
		"Cincinnati",
		"OH",
		"#002857"
	],
	[
		"eastern-washington",
		"Cheney",
		"Groves",
		"CHE",
		"BSKY",
		"Cheney",
		"WA",
		"#A10022"
	],
	[
		"idaho",
		"Moscow",
		"Pines",
		"MOS",
		"BSKY",
		"Moscow",
		"ID",
		"#B3995D"
	],
	[
		"idaho-state",
		"Pocatello",
		"Loam",
		"POC",
		"BSKY",
		"Pocatello",
		"ID",
		"#F47920"
	],
	[
		"montana",
		"Missoula",
		"Rifts",
		"MIS",
		"BSKY",
		"Missoula",
		"MT",
		"#5E5144"
	],
	[
		"montana-state",
		"Bozeman",
		"Ponds",
		"BOZ",
		"BSKY",
		"Bozeman",
		"MT",
		"#00205B"
	],
	[
		"northern-arizona",
		"Flagstaff",
		"Ash",
		"FLA",
		"BSKY",
		"Flagstaff",
		"AZ",
		"#003466"
	],
	[
		"northern-colorado",
		"Greeley",
		"Cliffs",
		"GRE",
		"BSKY",
		"Greeley",
		"CO",
		"#013C65"
	],
	[
		"portland-state",
		"Park Blocks",
		"Tills",
		"PB",
		"BSKY",
		"Portland",
		"OR",
		"#154734"
	],
	[
		"southern-utah",
		"Cedar City",
		"Ferns",
		"CC",
		"BSKY",
		"Cedar City",
		"UT",
		"#C41230"
	],
	[
		"utah-tech",
		"St. George",
		"Fathoms",
		"SG",
		"BSKY",
		"St. George",
		"UT",
		"#C41230"
	],
	[
		"weber-state",
		"Ogden",
		"Strands",
		"OGD",
		"BSKY",
		"Ogden",
		"UT",
		"#4B2682"
	],
	[
		"charleston-southern",
		"North Charleston",
		"Gulfs",
		"NC",
		"BSOU",
		"North Charleston",
		"SC",
		"#002868"
	],
	[
		"gardner-webb",
		"Boiling Springs",
		"Knolls",
		"BOI",
		"BSOU",
		"Boiling Springs",
		"NC",
		"#C41230"
	],
	[
		"high-point",
		"High Point",
		"Groves",
		"HP",
		"BSOU",
		"High Point",
		"NC",
		"#330072"
	],
	[
		"longwood",
		"Farmville",
		"Turns",
		"FAR",
		"BSOU",
		"Farmville",
		"VA",
		"#0033A0"
	],
	[
		"presbyterian",
		"Clinton",
		"Wood",
		"CLI",
		"BSOU",
		"Clinton",
		"SC",
		"#005EB8"
	],
	[
		"radford",
		"Radford",
		"Oaks",
		"RAD",
		"BSOU",
		"Radford",
		"VA",
		"#C41230"
	],
	[
		"unc-asheville",
		"Asheville",
		"Keystones",
		"ASH",
		"BSOU",
		"Asheville",
		"NC",
		"#003DA5"
	],
	[
		"usc-upstate",
		"Spartanburg East",
		"Leas",
		"SE",
		"BSOU",
		"Spartanburg",
		"SC",
		"#006341"
	],
	[
		"winthrop",
		"Rock Hill",
		"Reefs",
		"ROC",
		"BSOU",
		"Rock Hill",
		"SC",
		"#660000"
	],
	[
		"ucla",
		"Westwood",
		"Palms",
		"WWD",
		"B10",
		"Los Angeles",
		"CA",
		"#2D68C4"
	],
	[
		"illinois",
		"Champaign",
		"Orange",
		"CHM",
		"B10",
		"Champaign",
		"IL",
		"#E84A27"
	],
	[
		"indiana",
		"Bloomington",
		"Limestone",
		"BLO",
		"B10",
		"Bloomington",
		"IN",
		"#990000"
	],
	[
		"iowa",
		"Iowa City",
		"River",
		"IC",
		"B10",
		"Iowa City",
		"IA",
		"#000000"
	],
	[
		"maryland",
		"College Park",
		"Shell",
		"CPK",
		"B10",
		"College Park",
		"MD",
		"#E03A3E"
	],
	[
		"michigan",
		"Ann Arbor",
		"Maize",
		"AA",
		"B10",
		"Ann Arbor",
		"MI",
		"#00274C"
	],
	[
		"michigan-state",
		"East Lansing",
		"Green",
		"EL",
		"B10",
		"East Lansing",
		"MI",
		"#18453B"
	],
	[
		"minnesota",
		"Minneapolis",
		"North",
		"MIN",
		"B10",
		"Minneapolis",
		"MN",
		"#7A0019"
	],
	[
		"nebraska",
		"Lincoln",
		"Grain",
		"LNC",
		"B10",
		"Lincoln",
		"NE",
		"#E41C38"
	],
	[
		"northwestern",
		"Evanston",
		"Lake",
		"EVA",
		"B10",
		"Evanston",
		"IL",
		"#4E2A84"
	],
	[
		"ohio-state",
		"Columbus",
		"Scarlet",
		"CLB",
		"B10",
		"Columbus",
		"OH",
		"#BB0000"
	],
	[
		"oregon",
		"Eugene",
		"Fir",
		"EUG",
		"B10",
		"Eugene",
		"OR",
		"#154733"
	],
	[
		"penn-state",
		"University Park",
		"Mountain",
		"UPK",
		"B10",
		"University Park",
		"PA",
		"#041E42"
	],
	[
		"purdue",
		"West Lafayette",
		"Rails",
		"WLA",
		"B10",
		"West Lafayette",
		"IN",
		"#CEB888"
	],
	[
		"rutgers",
		"Piscataway",
		"Wind",
		"PIS",
		"B10",
		"Piscataway",
		"NJ",
		"#CC0033"
	],
	[
		"usc",
		"Exposition",
		"Colonnade",
		"EXP",
		"B10",
		"Los Angeles",
		"CA",
		"#990000"
	],
	[
		"washington",
		"Montlake",
		"Sound",
		"MTK",
		"B10",
		"Seattle",
		"WA",
		"#4B2E83"
	],
	[
		"wisconsin",
		"Madison",
		"Crest",
		"MAD",
		"B10",
		"Madison",
		"WI",
		"#C5050C"
	],
	[
		"arizona",
		"Tucson",
		"Desert",
		"TUC",
		"B12",
		"Tucson",
		"AZ",
		"#CC0033"
	],
	[
		"arizona-state",
		"Tempe",
		"Sun",
		"TEM",
		"B12",
		"Tempe",
		"AZ",
		"#8C1D40"
	],
	[
		"baylor",
		"Waco",
		"Green",
		"WAC",
		"B12",
		"Waco",
		"TX",
		"#154734"
	],
	[
		"byu",
		"Provo",
		"Peak",
		"PRV",
		"B12",
		"Provo",
		"UT",
		"#002E5D"
	],
	[
		"ucf",
		"Orlando",
		"Notches",
		"ORL",
		"B12",
		"Orlando",
		"FL",
		"#000000"
	],
	[
		"cincinnati",
		"Clifton",
		"Sluices",
		"CLF",
		"B12",
		"Cincinnati",
		"OH",
		"#E00122"
	],
	[
		"colorado",
		"Boulder",
		"Flatiron",
		"BLD",
		"B12",
		"Boulder",
		"CO",
		"#CFB87C"
	],
	[
		"houston",
		"Bayou City",
		"Steel",
		"BAY",
		"B12",
		"Houston",
		"TX",
		"#C8102E"
	],
	[
		"iowa-state",
		"Ames",
		"Wind",
		"AME",
		"B12",
		"Ames",
		"IA",
		"#C8102E"
	],
	[
		"kansas",
		"Lawrence",
		"Wheat",
		"LAW",
		"B12",
		"Lawrence",
		"KS",
		"#0051BA"
	],
	[
		"kansas-state",
		"Manhattan KS",
		"Prairie",
		"MHK",
		"B12",
		"Manhattan",
		"KS",
		"#512888"
	],
	[
		"oklahoma-state",
		"Stillwater",
		"Coves",
		"STW",
		"B12",
		"Stillwater",
		"OK",
		"#FF7300"
	],
	[
		"tcu",
		"Fort Worth",
		"Violet",
		"FTW",
		"B12",
		"Fort Worth",
		"TX",
		"#4D1979"
	],
	[
		"texas-tech",
		"Lubbock",
		"Dust",
		"LBB",
		"B12",
		"Lubbock",
		"TX",
		"#CC0000"
	],
	[
		"utah",
		"Salt Lake",
		"Spires",
		"SLC",
		"B12",
		"Salt Lake City",
		"UT",
		"#CC0000"
	],
	[
		"west-virginia",
		"Morgantown",
		"Ridge",
		"MGN",
		"B12",
		"Morgantown",
		"WV",
		"#002855"
	],
	[
		"cal-baptist",
		"Magnolia",
		"Wells",
		"MAG",
		"BW",
		"Riverside",
		"CA",
		"#002D72"
	],
	[
		"cal-poly",
		"San Luis Obispo",
		"Brakes",
		"SLO",
		"BW",
		"San Luis Obispo",
		"CA",
		"#154734"
	],
	[
		"csu-bakersfield",
		"Bakersfield",
		"Hearths",
		"BAK",
		"BW",
		"Bakersfield",
		"CA",
		"#003DA5"
	],
	[
		"csu-fullerton",
		"Fullerton",
		"Veils",
		"FUL",
		"BW",
		"Fullerton",
		"CA",
		"#00274C"
	],
	[
		"csun",
		"Northridge",
		"Flats",
		"NORT",
		"BW",
		"Northridge",
		"CA",
		"#D22030"
	],
	[
		"long-beach-state",
		"Long Beach",
		"Brooks",
		"LB",
		"BW",
		"Long Beach",
		"CA",
		"#000000"
	],
	[
		"sacramento-state",
		"Sacramento",
		"Yards",
		"SAC",
		"BW",
		"Sacramento",
		"CA",
		"#043927"
	],
	[
		"uc-irvine",
		"Irvine",
		"Wisps",
		"IRV",
		"BW",
		"Irvine",
		"CA",
		"#0C2340"
	],
	[
		"uc-riverside",
		"Box Springs",
		"Quills",
		"BOX",
		"BW",
		"Riverside",
		"CA",
		"#003DA5"
	],
	[
		"uc-san-diego",
		"La Jolla",
		"Ferns",
		"LJ",
		"BW",
		"La Jolla",
		"CA",
		"#182B49"
	],
	[
		"uc-santa-barbara",
		"Santa Barbara",
		"Rapids",
		"SB",
		"BW",
		"Santa Barbara",
		"CA",
		"#003660"
	],
	[
		"utah-valley",
		"Orem",
		"Orchards",
		"ORE",
		"BW",
		"Orem",
		"UT",
		"#275D38"
	],
	[
		"campbell",
		"Buies Creek",
		"Reefs",
		"BC",
		"CAA",
		"Buies Creek",
		"NC",
		"#F57E20"
	],
	[
		"charleston",
		"Harbor City",
		"Anvils",
		"HC",
		"CAA",
		"Charleston",
		"SC",
		"#9B2242"
	],
	[
		"drexel",
		"Powelton",
		"Gales",
		"POW",
		"CAA",
		"Philadelphia",
		"PA",
		"#002D72"
	],
	[
		"elon",
		"Elon",
		"Salt",
		"ELO",
		"CAA",
		"Elon",
		"NC",
		"#73000A"
	],
	[
		"hampton",
		"Hampton",
		"Plumes",
		"HAM",
		"CAA",
		"Hampton",
		"VA",
		"#0067A0"
	],
	[
		"hofstra",
		"Hempstead",
		"Frost",
		"HEM",
		"CAA",
		"Hempstead",
		"NY",
		"#003591"
	],
	[
		"monmouth",
		"West Long Branch",
		"Peaks",
		"WLB",
		"CAA",
		"West Long Branch",
		"NJ",
		"#041E42"
	],
	[
		"ncat",
		"Greensboro East",
		"Lagoons",
		"GE",
		"CAA",
		"Greensboro",
		"NC",
		"#004684"
	],
	[
		"northeastern",
		"Fenway",
		"Nimbus",
		"FEN",
		"CAA",
		"Boston",
		"MA",
		"#D41B2C"
	],
	[
		"stony-brook",
		"Stony Brook",
		"Chalk",
		"STON",
		"CAA",
		"Stony Brook",
		"NY",
		"#990000"
	],
	[
		"towson",
		"Towson",
		"Inlets",
		"TOW",
		"CAA",
		"Towson",
		"MD",
		"#000000"
	],
	[
		"uncw",
		"Wilmington NC",
		"Chords",
		"WN",
		"CAA",
		"Wilmington",
		"NC",
		"#003C71"
	],
	[
		"william-mary",
		"Williamsburg",
		"Oxbows",
		"WIL",
		"CAA",
		"Williamsburg",
		"VA",
		"#115740"
	],
	[
		"delaware",
		"The Green",
		"Stacks",
		"TG",
		"CUSA",
		"Newark",
		"DE",
		"#00539F"
	],
	[
		"fiu",
		"Sweetwater",
		"Trenches",
		"SWE",
		"CUSA",
		"Miami",
		"FL",
		"#081E3F"
	],
	[
		"jacksonville-state",
		"Jacksonville AL",
		"Hearths",
		"JA",
		"CUSA",
		"Jacksonville",
		"AL",
		"#C41230"
	],
	[
		"kennesaw-state",
		"Kennesaw",
		"Eddies",
		"KEN",
		"CUSA",
		"Kennesaw",
		"GA",
		"#000000"
	],
	[
		"liberty",
		"Lynchburg",
		"Vales",
		"LYN",
		"CUSA",
		"Lynchburg",
		"VA",
		"#0A254E"
	],
	[
		"middle-tennessee",
		"Murfreesboro",
		"Wells",
		"MUR",
		"CUSA",
		"Murfreesboro",
		"TN",
		"#0066CC"
	],
	[
		"missouri-state",
		"Springfield",
		"Flares",
		"SPR",
		"CUSA",
		"Springfield",
		"MO",
		"#5E0009"
	],
	[
		"new-mexico-state",
		"Las Cruces",
		"Strands",
		"LC",
		"CUSA",
		"Las Cruces",
		"NM",
		"#8B2332"
	],
	[
		"sam-houston",
		"Huntsville TX",
		"Harbors",
		"HT",
		"CUSA",
		"Huntsville",
		"TX",
		"#F47321"
	],
	[
		"wku",
		"Bowling Green KY",
		"Fields",
		"BGK",
		"CUSA",
		"Bowling Green",
		"KY",
		"#C41230"
	],
	[
		"cleveland-state",
		"Cleveland",
		"Lifts",
		"CLE",
		"HOR",
		"Cleveland",
		"OH",
		"#006633"
	],
	[
		"detroit-mercy",
		"Detroit",
		"Washes",
		"DET",
		"HOR",
		"Detroit",
		"MI",
		"#002D72"
	],
	[
		"iu-indy",
		"Indianapolis IN",
		"Sidings",
		"II",
		"HOR",
		"Indianapolis",
		"IN",
		"#9D2235"
	],
	[
		"milwaukee",
		"Milwaukee West",
		"Coves",
		"MW",
		"HOR",
		"Milwaukee",
		"WI",
		"#000000"
	],
	[
		"northern-illinois",
		"DeKalb",
		"Strands",
		"DEK",
		"HOR",
		"DeKalb",
		"IL",
		"#BA0C2F"
	],
	[
		"northern-kentucky",
		"Highland Heights",
		"Vistas",
		"HH",
		"HOR",
		"Highland Heights",
		"KY",
		"#000000"
	],
	[
		"oakland",
		"Rochester",
		"Crags",
		"ROCH",
		"HOR",
		"Rochester",
		"MI",
		"#000000"
	],
	[
		"purdue-fort-wayne",
		"Fort Wayne",
		"Canals",
		"FW",
		"HOR",
		"Fort Wayne",
		"IN",
		"#000000"
	],
	[
		"robert-morris",
		"Moon Township",
		"Cedars",
		"MT",
		"HOR",
		"Moon Township",
		"PA",
		"#14234B"
	],
	[
		"green-bay",
		"Green Bay",
		"Capes",
		"GB",
		"HOR",
		"Green Bay",
		"WI",
		"#006633"
	],
	[
		"wright-state",
		"Nutter",
		"Canals",
		"NUT",
		"HOR",
		"Dayton",
		"OH",
		"#046A38"
	],
	[
		"youngstown-state",
		"Youngstown",
		"Groves",
		"YOU",
		"HOR",
		"Youngstown",
		"OH",
		"#C41230"
	],
	[
		"brown",
		"Providence RI",
		"Shafts",
		"PR",
		"IVY",
		"Providence",
		"RI",
		"#4E3629"
	],
	[
		"columbia",
		"Morningside",
		"Quarries",
		"MOR",
		"IVY",
		"New York",
		"NY",
		"#B9D9EB"
	],
	[
		"cornell",
		"Ithaca",
		"Brakes",
		"ITH",
		"IVY",
		"Ithaca",
		"NY",
		"#B31B1B"
	],
	[
		"dartmouth",
		"Hanover",
		"Scarps",
		"HAN",
		"IVY",
		"Hanover",
		"NH",
		"#00693E"
	],
	[
		"harvard",
		"Cambridge",
		"Yard",
		"CAM",
		"IVY",
		"Cambridge",
		"MA",
		"#A51C30"
	],
	[
		"penn",
		"University City",
		"Salt",
		"UC",
		"IVY",
		"Philadelphia",
		"PA",
		"#011F5B"
	],
	[
		"princeton",
		"Nassau",
		"Orange",
		"NAS",
		"IVY",
		"Princeton",
		"NJ",
		"#E77500"
	],
	[
		"yale",
		"New Haven",
		"Blue",
		"NHV",
		"IVY",
		"New Haven",
		"CT",
		"#00356B"
	],
	[
		"canisius",
		"Buffalo NY",
		"Finches",
		"BN",
		"MAAC",
		"Buffalo",
		"NY",
		"#0C2340"
	],
	[
		"fairfield",
		"The Sound",
		"Ferns",
		"TS",
		"MAAC",
		"Fairfield",
		"CT",
		"#C8102E"
	],
	[
		"iona",
		"New Rochelle",
		"Hatches",
		"NR",
		"MAAC",
		"New Rochelle",
		"NY",
		"#6F2C3F"
	],
	[
		"manhattan",
		"Riverdale",
		"Folds",
		"RIV",
		"MAAC",
		"Riverdale",
		"NY",
		"#00703C"
	],
	[
		"marist",
		"Poughkeepsie",
		"Trails",
		"POU",
		"MAAC",
		"Poughkeepsie",
		"NY",
		"#C8102E"
	],
	[
		"merrimack",
		"North Andover",
		"Shelves",
		"NA",
		"MAAC",
		"North Andover",
		"MA",
		"#0033A0"
	],
	[
		"mount-st-marys",
		"Emmitsburg",
		"Bluffs",
		"EMM",
		"MAAC",
		"Emmitsburg",
		"MD",
		"#0033A0"
	],
	[
		"niagara",
		"Lewiston",
		"Trenches",
		"LEW",
		"MAAC",
		"Lewiston",
		"NY",
		"#582C83"
	],
	[
		"quinnipiac",
		"Hamden",
		"Keystones",
		"HAMD",
		"MAAC",
		"Hamden",
		"CT",
		"#0B2341"
	],
	[
		"rider",
		"Lawrenceville",
		"Branches",
		"LAWR",
		"MAAC",
		"Lawrenceville",
		"NJ",
		"#A32035"
	],
	[
		"sacred-heart",
		"Park Avenue",
		"Hedges",
		"PA",
		"MAAC",
		"Fairfield",
		"CT",
		"#C8102E"
	],
	[
		"saint-peters",
		"Jersey City",
		"Ash",
		"JC",
		"MAAC",
		"Jersey City",
		"NJ",
		"#003DA5"
	],
	[
		"siena",
		"Loudonville",
		"Reefs",
		"LOU",
		"MAAC",
		"Loudonville",
		"NY",
		"#006747"
	],
	[
		"akron",
		"Akron",
		"Harbors",
		"AKR",
		"MAC",
		"Akron",
		"OH",
		"#041E42"
	],
	[
		"ball-state",
		"Muncie",
		"Oxbows",
		"MUN",
		"MAC",
		"Muncie",
		"IN",
		"#BA0C2F"
	],
	[
		"bowling-green",
		"Bowling Green OH",
		"Branches",
		"BGO",
		"MAC",
		"Bowling Green",
		"OH",
		"#FE5000"
	],
	[
		"buffalo",
		"Buffalo Buffalo",
		"Mills",
		"BB",
		"MAC",
		"Buffalo",
		"NY",
		"#005BBB"
	],
	[
		"central-michigan",
		"Mount Pleasant",
		"Stone",
		"MOU",
		"MAC",
		"Mount Pleasant",
		"MI",
		"#6A0032"
	],
	[
		"eastern-michigan",
		"Ypsilanti",
		"Fords",
		"YPS",
		"MAC",
		"Ypsilanti",
		"MI",
		"#006633"
	],
	[
		"kent-state",
		"Kent",
		"Drifts",
		"KENT",
		"MAC",
		"Kent",
		"OH",
		"#002664"
	],
	[
		"umass",
		"Amherst",
		"Piers",
		"AMH",
		"MAC",
		"Amherst",
		"MA",
		"#881C1C"
	],
	[
		"miami-oh",
		"Oxford OH",
		"Capes",
		"OO",
		"MAC",
		"Oxford",
		"OH",
		"#C3142D"
	],
	[
		"ohio",
		"Athens OH",
		"Rapids",
		"AO",
		"MAC",
		"Athens",
		"OH",
		"#00694E"
	],
	[
		"toledo",
		"Toledo",
		"Copper",
		"TOL",
		"MAC",
		"Toledo",
		"OH",
		"#003E7E"
	],
	[
		"western-michigan",
		"Kalamazoo",
		"Runes",
		"KAL",
		"MAC",
		"Kalamazoo",
		"MI",
		"#6C4023"
	],
	[
		"coppin-state",
		"Coppin Heights",
		"Wharfs",
		"CH",
		"MEAC",
		"Baltimore",
		"MD",
		"#0033A0"
	],
	[
		"delaware-state",
		"Dover",
		"Fords",
		"DOV",
		"MEAC",
		"Dover",
		"DE",
		"#C41230"
	],
	[
		"howard",
		"Shaw",
		"Dales",
		"SHA",
		"MEAC",
		"Washington",
		"DC",
		"#003A63"
	],
	[
		"umes",
		"Princess Anne",
		"Turns",
		"PRI",
		"MEAC",
		"Princess Anne",
		"MD",
		"#8C2232"
	],
	[
		"morgan-state",
		"Coldspring",
		"Marrows",
		"COL",
		"MEAC",
		"Baltimore",
		"MD",
		"#F47920"
	],
	[
		"norfolk-state",
		"Norfolk VA",
		"Forks",
		"NV",
		"MEAC",
		"Norfolk",
		"VA",
		"#007A33"
	],
	[
		"nc-central",
		"Hillside",
		"Crosses",
		"HIL",
		"MEAC",
		"Durham",
		"NC",
		"#8C2232"
	],
	[
		"south-carolina-state",
		"Orangeburg",
		"Quarries",
		"ORA",
		"MEAC",
		"Orangeburg",
		"SC",
		"#8C2232"
	],
	[
		"belmont",
		"Music Row",
		"Mills",
		"MR",
		"MVC",
		"Nashville",
		"TN",
		"#002F6C"
	],
	[
		"bradley",
		"Peoria",
		"Vales",
		"PEO",
		"MVC",
		"Peoria",
		"IL",
		"#A50000"
	],
	[
		"drake",
		"Des Moines",
		"Mints",
		"DM",
		"MVC",
		"Des Moines",
		"IA",
		"#004477"
	],
	[
		"evansville",
		"Evansville IN",
		"Locks",
		"EI",
		"MVC",
		"Evansville",
		"IN",
		"#522398"
	],
	[
		"illinois-state",
		"Normal",
		"Leas",
		"NORM",
		"MVC",
		"Normal",
		"IL",
		"#CE1126"
	],
	[
		"indiana-state",
		"Terre Haute",
		"Terraces",
		"TH",
		"MVC",
		"Terre Haute",
		"IN",
		"#0033A0"
	],
	[
		"murray-state",
		"Murray",
		"Oxbows",
		"MURR",
		"MVC",
		"Murray",
		"KY",
		"#002144"
	],
	[
		"northern-iowa",
		"Cedar Falls",
		"Crosses",
		"CF",
		"MVC",
		"Cedar Falls",
		"IA",
		"#4B116F"
	],
	[
		"southern-illinois",
		"Carbondale",
		"Branches",
		"CAR",
		"MVC",
		"Carbondale",
		"IL",
		"#8C2232"
	],
	[
		"uic",
		"West Loop",
		"Pitches",
		"WL",
		"MVC",
		"Chicago",
		"IL",
		"#D50032"
	],
	[
		"valparaiso",
		"Valparaiso",
		"Grain",
		"VAL",
		"MVC",
		"Valparaiso",
		"IN",
		"#492F24"
	],
	[
		"air-force",
		"The Academy",
		"Academy",
		"ACD",
		"MW",
		"Colorado Springs",
		"CO",
		"#003087"
	],
	[
		"grand-canyon",
		"Phoenix West",
		"Sidings",
		"PW",
		"MW",
		"Phoenix",
		"AZ",
		"#522398"
	],
	[
		"hawaii",
		"Manoa",
		"Sable",
		"MAN",
		"MW",
		"Honolulu",
		"HI",
		"#024731"
	],
	[
		"nevada",
		"Truckee",
		"Forges",
		"TRU",
		"MW",
		"Reno",
		"NV",
		"#003366"
	],
	[
		"new-mexico",
		"Albuquerque",
		"Flumes",
		"ALBU",
		"MW",
		"Albuquerque",
		"NM",
		"#BA0C2F"
	],
	[
		"san-jose-state",
		"San Jose",
		"Surges",
		"SJ",
		"MW",
		"San Jose",
		"CA",
		"#0055A5"
	],
	[
		"uc-davis",
		"Davis",
		"Salt",
		"DAVI",
		"MW",
		"Davis",
		"CA",
		"#022851"
	],
	[
		"unlv",
		"The Strip",
		"Neon",
		"STP",
		"MW",
		"Las Vegas",
		"NV",
		"#B10202"
	],
	[
		"utep",
		"El Paso",
		"Wood",
		"EP",
		"MW",
		"El Paso",
		"TX",
		"#FF8200"
	],
	[
		"wyoming",
		"Laramie",
		"Mesas",
		"LAR",
		"MW",
		"Laramie",
		"WY",
		"#492F24"
	],
	[
		"central-connecticut",
		"New Britain",
		"Lamps",
		"NB",
		"NEC",
		"New Britain",
		"CT",
		"#1E4D2B"
	],
	[
		"chicago-state",
		"Pullman IL",
		"Wharfs",
		"PI",
		"NEC",
		"Chicago",
		"IL",
		"#006747"
	],
	[
		"fdu",
		"Teaneck",
		"Sidings",
		"TEA",
		"NEC",
		"Teaneck",
		"NJ",
		"#0033A0"
	],
	[
		"le-moyne",
		"Syracuse NY",
		"Canals",
		"SN",
		"NEC",
		"Syracuse",
		"NY",
		"#006747"
	],
	[
		"liu",
		"Brooklyn",
		"Bolts",
		"BRO",
		"NEC",
		"Brooklyn",
		"NY",
		"#69B3E7"
	],
	[
		"mercyhurst",
		"Erie",
		"Ledges",
		"ERI",
		"NEC",
		"Erie",
		"PA",
		"#006747"
	],
	[
		"new-haven",
		"West Haven",
		"Flumes",
		"WH",
		"NEC",
		"West Haven",
		"CT",
		"#003DA5"
	],
	[
		"stonehill",
		"Easton Green",
		"Pines",
		"EG",
		"NEC",
		"Easton",
		"MA",
		"#4B116F"
	],
	[
		"wagner",
		"Staten Island",
		"Faults",
		"SI",
		"NEC",
		"Staten Island",
		"NY",
		"#004B2D"
	],
	[
		"eastern-illinois",
		"Charleston IL",
		"Oxbows",
		"CI",
		"OVC",
		"Charleston",
		"IL",
		"#003399"
	],
	[
		"lindenwood",
		"St. Charles",
		"Keystones",
		"SC",
		"OVC",
		"St. Charles",
		"MO",
		"#000000"
	],
	[
		"morehead-state",
		"Morehead",
		"Palisades",
		"MORE",
		"OVC",
		"Morehead",
		"KY",
		"#0033A0"
	],
	[
		"semo",
		"Cape Girardeau",
		"Sluices",
		"CG",
		"OVC",
		"Cape Girardeau",
		"MO",
		"#C41230"
	],
	[
		"siue",
		"Edwardsville",
		"Shelves",
		"EDW",
		"OVC",
		"Edwardsville",
		"IL",
		"#C41230"
	],
	[
		"southern-indiana",
		"Evansville Indiana",
		"Drifts",
		"EVAN",
		"OVC",
		"Evansville",
		"IN",
		"#00205B"
	],
	[
		"ut-martin",
		"Martin",
		"Lifts",
		"MAR",
		"OVC",
		"Martin",
		"TN",
		"#F47321"
	],
	[
		"tennessee-state",
		"North Nashville",
		"Knolls",
		"NN",
		"OVC",
		"Nashville",
		"TN",
		"#003087"
	],
	[
		"western-illinois",
		"Macomb",
		"Brooks",
		"MAC",
		"OVC",
		"Macomb",
		"IL",
		"#663399"
	],
	[
		"american",
		"Tenleytown",
		"Lanterns",
		"TEN",
		"PAT",
		"Washington",
		"DC",
		"#C41230"
	],
	[
		"army",
		"The Point",
		"Black",
		"PT",
		"PAT",
		"West Point",
		"NY",
		"#000000"
	],
	[
		"boston-u",
		"Kenmore",
		"Jetties",
		"KENM",
		"PAT",
		"Boston",
		"MA",
		"#CC0000"
	],
	[
		"bucknell",
		"Lewisburg",
		"Compass",
		"LEWI",
		"PAT",
		"Lewisburg",
		"PA",
		"#003366"
	],
	[
		"colgate",
		"Hamilton",
		"Leas",
		"HAMI",
		"PAT",
		"Hamilton",
		"NY",
		"#821019"
	],
	[
		"holy-cross",
		"Worcester",
		"Irons",
		"WOR",
		"PAT",
		"Worcester",
		"MA",
		"#602D2D"
	],
	[
		"lafayette",
		"College Hill PA",
		"Peaks",
		"CHP",
		"PAT",
		"Easton",
		"PA",
		"#8C1D40"
	],
	[
		"lehigh",
		"Bethlehem",
		"Orchards",
		"BET",
		"PAT",
		"Bethlehem",
		"PA",
		"#502D0E"
	],
	[
		"loyola-maryland",
		"Evergreen",
		"Thorns",
		"EVE",
		"PAT",
		"Baltimore",
		"MD",
		"#006747"
	],
	[
		"navy",
		"Annapolis",
		"Anchor",
		"ANN",
		"PAT",
		"Annapolis",
		"MD",
		"#00205B"
	],
	[
		"boise-state",
		"Boise",
		"Thickets",
		"BOIS",
		"P12",
		"Boise",
		"ID",
		"#0033A0"
	],
	[
		"colorado-state",
		"Fort Collins",
		"Quarries",
		"FC",
		"P12",
		"Fort Collins",
		"CO",
		"#1E4D2B"
	],
	[
		"fresno-state",
		"Fresno",
		"Cedars",
		"FRE",
		"P12",
		"Fresno",
		"CA",
		"#C41230"
	],
	[
		"gonzaga",
		"Spokane",
		"Spires",
		"SPK",
		"P12",
		"Spokane",
		"WA",
		"#041E42"
	],
	[
		"oregon-state",
		"Corvallis",
		"Surges",
		"COR",
		"P12",
		"Corvallis",
		"OR",
		"#D73F09"
	],
	[
		"san-diego-state",
		"Mission Valley",
		"Mission",
		"MSV",
		"P12",
		"San Diego",
		"CA",
		"#A6192E"
	],
	[
		"texas-state",
		"San Marcos",
		"Glades",
		"SM",
		"P12",
		"San Marcos",
		"TX",
		"#501214"
	],
	[
		"utah-state",
		"Logan",
		"Vales",
		"LOG",
		"P12",
		"Logan",
		"UT",
		"#0A3055"
	],
	[
		"washington-state",
		"Pullman",
		"Pines",
		"PUL",
		"P12",
		"Pullman",
		"WA",
		"#981E32"
	],
	[
		"alabama",
		"Tuscaloosa",
		"Forge",
		"TUS",
		"SEC",
		"Tuscaloosa",
		"AL",
		"#9E1B32"
	],
	[
		"arkansas",
		"Fayetteville",
		"Hill",
		"FAY",
		"SEC",
		"Fayetteville",
		"AR",
		"#9D2235"
	],
	[
		"auburn",
		"Plains",
		"Plainsmen",
		"PLN",
		"SEC",
		"Auburn",
		"AL",
		"#0C2340"
	],
	[
		"florida",
		"Gainesville",
		"Swamp",
		"GNV",
		"SEC",
		"Gainesville",
		"FL",
		"#0021A5"
	],
	[
		"georgia",
		"Athens GA",
		"Hedge",
		"ATH",
		"SEC",
		"Athens",
		"GA",
		"#BA0C2F"
	],
	[
		"kentucky",
		"Lexington",
		"Stallions",
		"LEX",
		"SEC",
		"Lexington",
		"KY",
		"#0033A0"
	],
	[
		"lsu",
		"Bayou Rouge",
		"Violet",
		"BRG",
		"SEC",
		"Baton Rouge",
		"LA",
		"#461D7C"
	],
	[
		"ole-miss",
		"Oxford MS",
		"Grove",
		"OXF",
		"SEC",
		"Oxford",
		"MS",
		"#CE1126"
	],
	[
		"mississippi-state",
		"Starkville",
		"Maroon",
		"STK",
		"SEC",
		"Starkville",
		"MS",
		"#5D1725"
	],
	[
		"missouri",
		"Flat Branch",
		"Column",
		"FLT",
		"SEC",
		"Columbia",
		"MO",
		"#F1B82D"
	],
	[
		"oklahoma",
		"Norman",
		"Crimson",
		"NRM",
		"SEC",
		"Norman",
		"OK",
		"#841617"
	],
	[
		"south-carolina",
		"Congaree",
		"Garnet",
		"CGR",
		"SEC",
		"Columbia",
		"SC",
		"#73000A"
	],
	[
		"tennessee",
		"Knoxville",
		"Embers",
		"KNX",
		"SEC",
		"Knoxville",
		"TN",
		"#FF8200"
	],
	[
		"texas",
		"Austin",
		"Capitol",
		"AUS",
		"SEC",
		"Austin",
		"TX",
		"#BF5700"
	],
	[
		"texas-am",
		"Station",
		"Twelfth",
		"STA",
		"SEC",
		"College Station",
		"TX",
		"#500000"
	],
	[
		"vanderbilt",
		"West End",
		"Anchor",
		"WEN",
		"SEC",
		"Nashville",
		"TN",
		"#000000"
	],
	[
		"chattanooga",
		"Chattanooga",
		"Scarps",
		"CHAT",
		"SOC",
		"Chattanooga",
		"TN",
		"#00386B"
	],
	[
		"citadel",
		"The Corps",
		"Coasts",
		"TC",
		"SOC",
		"Charleston",
		"SC",
		"#003087"
	],
	[
		"etsu",
		"Johnson City",
		"Folds",
		"JOH",
		"SOC",
		"Johnson City",
		"TN",
		"#041E42"
	],
	[
		"furman",
		"Poinsett",
		"Granite",
		"POI",
		"SOC",
		"Greenville",
		"SC",
		"#582C83"
	],
	[
		"mercer",
		"Macon",
		"Cairns",
		"MACO",
		"SOC",
		"Macon",
		"GA",
		"#F47321"
	],
	[
		"samford",
		"Homewood",
		"Thorns",
		"HOM",
		"SOC",
		"Birmingham",
		"AL",
		"#C41230"
	],
	[
		"tennessee-tech",
		"Cookeville",
		"Chords",
		"COO",
		"SOC",
		"Cookeville",
		"TN",
		"#5E4B1F"
	],
	[
		"unc-greensboro",
		"Greensboro West",
		"Wharfs",
		"GW",
		"SOC",
		"Greensboro",
		"NC",
		"#0F204C"
	],
	[
		"vmi",
		"Lexington VA",
		"Vales",
		"LV",
		"SOC",
		"Lexington",
		"VA",
		"#C41230"
	],
	[
		"western-carolina",
		"Cullowhee",
		"Piers",
		"CUL",
		"SOC",
		"Cullowhee",
		"NC",
		"#594A25"
	],
	[
		"wofford",
		"Spartanburg West",
		"Bights",
		"SW",
		"SOC",
		"Spartanburg",
		"SC",
		"#000000"
	],
	[
		"east-texas-am",
		"Commerce",
		"Wells",
		"COM",
		"SLAND",
		"Commerce",
		"TX",
		"#003087"
	],
	[
		"houston-christian",
		"Sharpstown",
		"Sluices",
		"SHAR",
		"SLAND",
		"Houston",
		"TX",
		"#003087"
	],
	[
		"incarnate-word",
		"San Antonio TX",
		"Locks",
		"SAT",
		"SLAND",
		"San Antonio",
		"TX",
		"#C41230"
	],
	[
		"lamar",
		"Beaumont",
		"Surges",
		"BEA",
		"SLAND",
		"Beaumont",
		"TX",
		"#C41230"
	],
	[
		"new-orleans",
		"Lakefront",
		"Terraces",
		"LAK",
		"SLAND",
		"New Orleans",
		"LA",
		"#0055A5"
	],
	[
		"mcneese",
		"Lake Charles",
		"Leas",
		"LAKE",
		"SLAND",
		"Lake Charles",
		"LA",
		"#005EB8"
	],
	[
		"nicholls",
		"Thibodaux",
		"Shores",
		"THI",
		"SLAND",
		"Thibodaux",
		"LA",
		"#C41230"
	],
	[
		"northwestern-state",
		"Natchitoches",
		"Fjords",
		"NAT",
		"SLAND",
		"Natchitoches",
		"LA",
		"#4B116F"
	],
	[
		"southeastern-louisiana",
		"Hammond",
		"Surges",
		"HAMM",
		"SLAND",
		"Hammond",
		"LA",
		"#006747"
	],
	[
		"sfa",
		"Nacogdoches",
		"Knots",
		"NAC",
		"SLAND",
		"Nacogdoches",
		"TX",
		"#4B116F"
	],
	[
		"am-corpus",
		"Corpus Christi",
		"Flats",
		"CORP",
		"SLAND",
		"Corpus Christi",
		"TX",
		"#0067A0"
	],
	[
		"utrgv",
		"Edinburg",
		"Zephyrs",
		"EDI",
		"SLAND",
		"Edinburg",
		"TX",
		"#F47321"
	],
	[
		"alabama-am",
		"Huntsville AL",
		"Fathoms",
		"HA",
		"SWAC",
		"Huntsville",
		"AL",
		"#660000"
	],
	[
		"alabama-state",
		"Montgomery",
		"Flares",
		"MON",
		"SWAC",
		"Montgomery",
		"AL",
		"#000000"
	],
	[
		"alcorn-state",
		"Lorman",
		"Spruce",
		"LOR",
		"SWAC",
		"Lorman",
		"MS",
		"#4B116F"
	],
	[
		"ark-pine-bluff",
		"Pine Bluff",
		"Docks",
		"PIN",
		"SWAC",
		"Pine Bluff",
		"AR",
		"#000000"
	],
	[
		"bethune-cookman",
		"Daytona Beach",
		"Cliffs",
		"DB",
		"SWAC",
		"Daytona Beach",
		"FL",
		"#8C2232"
	],
	[
		"famu",
		"Frenchtown",
		"Reefs",
		"FREN",
		"SWAC",
		"Tallahassee",
		"FL",
		"#F47321"
	],
	[
		"grambling",
		"Grambling",
		"Shelves",
		"GRA",
		"SWAC",
		"Grambling",
		"LA",
		"#000000"
	],
	[
		"jackson-state",
		"Jackson",
		"Canyons",
		"JAC",
		"SWAC",
		"Jackson",
		"MS",
		"#002D72"
	],
	[
		"mississippi-valley",
		"Itta Bena",
		"Hatches",
		"IB",
		"SWAC",
		"Itta Bena",
		"MS",
		"#C41230"
	],
	[
		"prairie-view",
		"Prairie View",
		"Nimbus",
		"PV",
		"SWAC",
		"Prairie View",
		"TX",
		"#4B116F"
	],
	[
		"southern",
		"Scotlandville",
		"Hatches",
		"SCO",
		"SWAC",
		"Baton Rouge",
		"LA",
		"#72A800"
	],
	[
		"texas-southern",
		"Third Ward",
		"Strands",
		"TW",
		"SWAC",
		"Houston",
		"TX",
		"#6F263D"
	],
	[
		"kansas-city",
		"Kansas City",
		"Gales",
		"KC",
		"SUM",
		"Kansas City",
		"MO",
		"#005EB8"
	],
	[
		"north-dakota",
		"Grand Forks",
		"Copper",
		"GF",
		"SUM",
		"Grand Forks",
		"ND",
		"#009A44"
	],
	[
		"ndsu",
		"Fargo",
		"Bights",
		"FARG",
		"SUM",
		"Fargo",
		"ND",
		"#0A5640"
	],
	[
		"omaha",
		"Omaha East",
		"Gulfs",
		"OE",
		"SUM",
		"Omaha",
		"NE",
		"#000000"
	],
	[
		"oral-roberts",
		"Tulsa OK",
		"Flares",
		"TO",
		"SUM",
		"Tulsa",
		"OK",
		"#00205B"
	],
	[
		"st-thomas",
		"St. Paul",
		"Grain",
		"SP",
		"SUM",
		"St. Paul",
		"MN",
		"#4B116F"
	],
	[
		"south-dakota",
		"Vermillion",
		"Grain",
		"VER",
		"SUM",
		"Vermillion",
		"SD",
		"#C41230"
	],
	[
		"south-dakota-state",
		"Brookings",
		"Wicks",
		"BROO",
		"SUM",
		"Brookings",
		"SD",
		"#0033A0"
	],
	[
		"app-state",
		"Boone",
		"Ports",
		"BOO",
		"SBC",
		"Boone",
		"NC",
		"#000000"
	],
	[
		"arkansas-state",
		"Jonesboro",
		"Veils",
		"JON",
		"SBC",
		"Jonesboro",
		"AR",
		"#CC092F"
	],
	[
		"coastal-carolina",
		"Conway SC",
		"Pitches",
		"CS",
		"SBC",
		"Conway",
		"SC",
		"#006F71"
	],
	[
		"georgia-southern",
		"Statesboro",
		"Thorns",
		"STAT",
		"SBC",
		"Statesboro",
		"GA",
		"#011E41"
	],
	[
		"georgia-state",
		"Downtown ATL",
		"Fjords",
		"DA",
		"SBC",
		"Atlanta",
		"GA",
		"#0039A6"
	],
	[
		"jmu",
		"Harrisonburg",
		"Bights",
		"HAR",
		"SBC",
		"Harrisonburg",
		"VA",
		"#450084"
	],
	[
		"louisiana",
		"Lafayette",
		"Wood",
		"LAF",
		"SBC",
		"Lafayette",
		"LA",
		"#CE181E"
	],
	[
		"ulm",
		"Monroe",
		"Benches",
		"MONR",
		"SBC",
		"Monroe",
		"LA",
		"#8B2332"
	],
	[
		"louisiana-tech",
		"Ruston",
		"Mints",
		"RUS",
		"SBC",
		"Ruston",
		"LA",
		"#003087"
	],
	[
		"marshall",
		"Huntington",
		"Coves",
		"HUN",
		"SBC",
		"Huntington",
		"WV",
		"#00B140"
	],
	[
		"odu",
		"Hampton Roads",
		"Washes",
		"HR",
		"SBC",
		"Norfolk",
		"VA",
		"#003057"
	],
	[
		"south-alabama",
		"Mobile",
		"Leas",
		"MOB",
		"SBC",
		"Mobile",
		"AL",
		"#00205B"
	],
	[
		"southern-miss",
		"Hattiesburg",
		"Frost",
		"HAT",
		"SBC",
		"Hattiesburg",
		"MS",
		"#000000"
	],
	[
		"troy",
		"Troy",
		"Marrows",
		"TRO",
		"SBC",
		"Troy",
		"AL",
		"#8B2332"
	],
	[
		"abilene-christian",
		"Abilene",
		"Notches",
		"ABI",
		"UAC",
		"Abilene",
		"TX",
		"#4B116F"
	],
	[
		"austin-peay",
		"Clarksville",
		"Ash",
		"CLA",
		"UAC",
		"Clarksville",
		"TN",
		"#C41230"
	],
	[
		"central-arkansas",
		"Conway AR",
		"Thaws",
		"CA",
		"UAC",
		"Conway",
		"AR",
		"#4B116F"
	],
	[
		"eastern-kentucky",
		"Richmond KY",
		"Plumes",
		"RK",
		"UAC",
		"Richmond",
		"KY",
		"#8C2232"
	],
	[
		"little-rock",
		"Little Rock",
		"Locks",
		"LR",
		"UAC",
		"Little Rock",
		"AR",
		"#8C2232"
	],
	[
		"north-alabama",
		"Florence",
		"Forks",
		"FLO",
		"UAC",
		"Florence",
		"AL",
		"#4B116F"
	],
	[
		"tarleton",
		"Stephenville",
		"Capes",
		"STE",
		"UAC",
		"Stephenville",
		"TX",
		"#4B116F"
	],
	[
		"ut-arlington",
		"Arlington",
		"Washes",
		"ARL",
		"UAC",
		"Arlington",
		"TX",
		"#0064B1"
	],
	[
		"west-georgia",
		"Carrollton",
		"Grain",
		"CARR",
		"UAC",
		"Carrollton",
		"GA",
		"#C41230"
	],
	[
		"denver",
		"Capitol Hill CO",
		"Ledges",
		"CHC",
		"WCC",
		"Denver",
		"CO",
		"#8B2332"
	],
	[
		"lmu",
		"Playa",
		"Canyons",
		"PLA",
		"WCC",
		"Los Angeles",
		"CA",
		"#8C2232"
	],
	[
		"pacific",
		"Stockton",
		"Shelves",
		"STOC",
		"WCC",
		"Stockton",
		"CA",
		"#F47321"
	],
	[
		"pepperdine",
		"The Bluff",
		"Sand",
		"TB",
		"WCC",
		"Malibu",
		"CA",
		"#00205B"
	],
	[
		"portland",
		"West Hills",
		"Heaths",
		"WES",
		"WCC",
		"Portland",
		"OR",
		"#4B116F"
	],
	[
		"saint-marys",
		"Moraga",
		"Moraga",
		"MORA",
		"WCC",
		"Moraga",
		"CA",
		"#0033A0"
	],
	[
		"san-diego",
		"Alcala",
		"Ledges",
		"ALC",
		"WCC",
		"San Diego",
		"CA",
		"#003087"
	],
	[
		"san-francisco",
		"The Hill",
		"Currents",
		"THE",
		"WCC",
		"San Francisco",
		"CA",
		"#00543C"
	],
	[
		"santa-clara",
		"Mission",
		"Basins",
		"MISS",
		"WCC",
		"Santa Clara",
		"CA",
		"#8C2232"
	],
	[
		"seattle",
		"Capitol Hill WA",
		"Brine",
		"CHW",
		"WCC",
		"Seattle",
		"WA",
		"#AA0000"
	]
];
var PRESTIGE = {
	"uconn": 98,
	"kansas": 97,
	"duke": 96,
	"gonzaga": 96,
	"houston": 95,
	"michigan": 95,
	"unc": 94,
	"florida": 93,
	"villanova": 92,
	"purdue": 92,
	"virginia": 91,
	"baylor": 91,
	"kentucky": 90,
	"arizona": 90,
	"tennessee": 89,
	"alabama": 89,
	"auburn": 88,
	"michigan-state": 88,
	"ucla": 87,
	"creighton": 86,
	"iowa-state": 86,
	"texas-tech": 85,
	"marquette": 85,
	"illinois": 85,
	"san-diego-state": 85,
	"wisconsin": 84,
	"texas": 84,
	"arkansas": 83,
	"oregon": 82,
	"xavier": 82,
	"saint-marys": 82,
	"byu": 81,
	"st-johns": 81,
	"clemson": 81,
	"dayton": 80,
	"memphis": 80,
	"texas-am": 80,
	"miami": 80,
	"iowa": 79,
	"indiana": 78,
	"ohio-state": 78,
	"vcu": 78,
	"utah-state": 78,
	"maryland": 77,
	"boise-state": 77,
	"fau": 77,
	"new-mexico": 77,
	"lsu": 76,
	"oklahoma": 76,
	"tcu": 76,
	"nevada": 76,
	"nc-state": 76,
	"kansas-state": 76,
	"vanderbilt": 76,
	"cincinnati": 75,
	"west-virginia": 75,
	"missouri": 75,
	"mississippi-state": 75,
	"grand-canyon": 75,
	"louisville": 74,
	"georgia": 74,
	"ole-miss": 74,
	"colorado-state": 74,
	"seton-hall": 74,
	"providence": 74,
	"utah": 74,
	"saint-louis": 73,
	"wake-forest": 73,
	"syracuse": 73,
	"south-carolina": 73,
	"drake": 73,
	"liberty": 73,
	"pitt": 73,
	"usc": 72,
	"vermont": 72,
	"uab": 72,
	"smu": 72,
	"arizona-state": 72,
	"fsu": 72,
	"wichita-state": 71,
	"nebraska": 71,
	"princeton": 71,
	"charleston": 71,
	"high-point": 71,
	"colorado": 71,
	"oklahoma-state": 71,
	"northwestern": 70,
	"washington": 70,
	"notre-dame": 70,
	"butler": 70,
	"yale": 70,
	"uc-irvine": 70,
	"north-texas": 70,
	"penn-state": 70,
	"mcneese": 70,
	"santa-clara": 70,
	"st-bonaventure": 70,
	"ucf": 70,
	"virginia-tech": 70,
	"colgate": 69,
	"minnesota": 69,
	"akron": 69,
	"rutgers": 68,
	"uncw": 68,
	"stanford": 68,
	"loyola-chicago": 68,
	"james-madison": 68,
	"jmu": 68,
	"san-francisco": 68,
	"unlv": 68,
	"richmond": 68,
	"cal": 67,
	"furman": 67,
	"davidson": 67,
	"washington-state": 66,
	"oral-roberts": 66,
	"south-dakota-state": 66,
	"hofstra": 66,
	"george-mason": 66,
	"georgia-tech": 66,
	"georgetown": 65,
	"oregon-state": 64,
	"new-mexico-state": 64,
	"utah-valley": 64,
	"boston-college": 64,
	"uc-san-diego": 63,
	"seattle": 63,
	"fresno-state": 62,
	"wyoming": 62,
	"norfolk-state": 60,
	"hawaii": 60,
	"depaul": 58,
	"howard": 58,
	"texas-state": 58,
	"denver": 58,
	"air-force": 52
};
function floorPrestige(id, conf) {
	const override = PRESTIGE[id];
	if (override != null) return override;
	const cp = CONFERENCES.find((c) => c.id === conf)?.prestige ?? 54;
	const n = Array.from(id).reduce((a, ch) => a + ch.charCodeAt(0), 0);
	return Math.max(42, Math.min(72, Math.round(cp * .72 + n % 11 - 4)));
}
var TEAMS = RAW.map(([id, name, mascot, abbr, conference, city, state, color]) => ({
	id,
	name,
	mascot,
	abbr,
	conference,
	city,
	state,
	color,
	prestige: floorPrestige(id, conference)
}));
var TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
function careerEligible(t) {
	return t.prestige <= 62;
}
//#endregion
//#region src/game/rng.ts
function mulberry32(a) {
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hashString(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0;
}
function clamp(n, lo, hi) {
	return Math.max(lo, Math.min(hi, n));
}
function pick(rng, list) {
	return list[Math.floor(rng() * list.length)];
}
function randInt(rng, lo, hi) {
	return lo + Math.floor(rng() * (hi - lo + 1));
}
function gaussian(rng) {
	let u = 0;
	let v = 0;
	while (!u) u = rng();
	while (!v) v = rng();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
//#endregion
//#region src/game/engine-util.ts
function identityName(d) {
	return `${d.first} ${d.last}`.trim() || "Coach Stone";
}
function oneBox(poss, rng) {
	const p = clamp(Math.round(poss), 56, 88);
	const to = clamp(Math.round(p * (.155 + rng() * .07)), 7, 22);
	const fta = clamp(Math.round(p * (.26 + rng() * .18)), 6, 38);
	const orb = clamp(Math.round(p * (.08 + rng() * .06)), 3, 16);
	return {
		poss: p,
		fga: clamp(Math.round(p - to - .475 * fta + orb), 38, 92),
		orb,
		to,
		fta
	};
}
/** Light box that is consistent with Poss ≈ FGA − OR + TO + 0.475×FTA. */
function estimateGameBoxes(hs, as, rng) {
	const gamePoss = clamp((hs + as) / 2.12 + gaussian(rng) * 1.8, 58, 84);
	const drift = rng() < .55 ? 0 : rng() < .5 ? 1 : -1;
	return {
		home: oneBox(gamePoss + drift, rng),
		away: oneBox(gamePoss - drift, rng),
		minutes: 40
	};
}
function liveMinutes(half) {
	return half <= 2 ? 40 : 40 + (half - 2) * 5;
}
function boxFromLive(live) {
	const empty = () => ({
		poss: 0,
		fga: 0,
		orb: 0,
		to: 0,
		fta: 0
	});
	const home = empty();
	const away = empty();
	for (const e of live.log) {
		if (!e.kind || e.kind === "period" || !e.poss) continue;
		const b = e.poss === "home" ? home : away;
		b.poss++;
		if (e.kind === "two" || e.kind === "three") {
			b.fga++;
			if (e.kind === "two" && e.pts === 3) b.fta += 1;
		} else if (e.kind === "ft") b.fta += 2;
		else if (e.kind === "to") b.to++;
	}
	if (home.poss < 20 || away.poss < 20) return estimateGameBoxes(live.homeScore, live.awayScore, () => .37);
	return {
		home,
		away,
		minutes: liveMinutes(live.half)
	};
}
function gamePossessions(home, away, hs = 70, as = 70) {
	if (home && away) return (home.poss + away.poss) / 2;
	if (home) return home.poss;
	if (away) return away.poss;
	return clamp((hs + as) / 2.12, 58, 84);
}
//#endregion
//#region src/game/presser.ts
function gameCtx(state, slotId) {
	const slot = state.schedule.find((g) => g.id === slotId);
	const res = state.results.find((r) => r.slotId === slotId);
	if (!slot || !res) return null;
	const youHome = slot.homeId === state.playerTeamId;
	const youScore = youHome ? res.homeScore : res.awayScore;
	const oppScore = youHome ? res.awayScore : res.homeScore;
	const oppId = youHome ? slot.awayId : slot.homeId;
	const opp = TEAM_BY_ID[oppId];
	const you = state.teams[state.playerTeamId];
	const school = TEAM_BY_ID[state.playerTeamId];
	const star = state.players.filter((p) => p.teamId === state.playerTeamId).sort((a, b) => b.ovr - a.ovr)[0];
	return {
		slotId,
		won: youScore > oppScore,
		margin: Math.abs(youScore - oppScore),
		oppName: opp.name,
		oppPrestige: TEAM_BY_ID[oppId]?.prestige ?? 60,
		youPrestige: school.prestige,
		home: youHome && slot.site === "home",
		conf: slot.kind === "conference" || slot.kind === "conf-tourney",
		youScore,
		oppScore,
		record: `${you.wins}-${you.losses}`,
		star: star ? `${star.first} ${star.last}` : "the lead guard",
		week: slot.week,
		nil: state.nilCap > 0
	};
}
function shouldHoldPresser(state, ctx, rng) {
	const notable = ctx.margin <= 4 || ctx.margin >= 16 || ctx.conf || Math.abs(ctx.youPrestige - ctx.oppPrestige) >= 12 || ctx.week >= 16;
	const since = state.week - (state.lastPresserWeek ?? -9);
	if (notable) return rng() < (since <= 1 ? .45 : .7);
	if (since <= 2) return false;
	return rng() < .2;
}
function C(id, label, tone, morale, ad, fans) {
	return {
		id,
		label,
		tone,
		morale,
		ad,
		fans
	};
}
var FACTORIES = [
	{
		id: "win-close",
		when: (c) => c.won && c.margin <= 5,
		prompt: (c) => `You needed one more stop against ${c.oppName} and you got it, ${c.youScore}-${c.oppScore}. What was the difference?`,
		choices: (c, s) => [
			C("a", "The guys who have been in the gym in June. That's who made the play.", "cool", 4, 2, 2),
			C("b", "We executed the last two possessions. That's the job.", "even", 2, 3, 1),
			C("c", "Luck. We'll take it. Don't ask me to draw it up again.", "even", 1, -1, 2),
			C("d", "They folded. We didn't. That's who we are.", "hot", -2, 0, 4)
		]
	},
	{
		id: "win-blowout",
		when: (c) => c.won && c.margin >= 16,
		prompt: (c) => `${c.oppName} never got in the game. ${c.youScore}-${c.oppScore}. Is that the standard now?`,
		choices: (c) => [
			C("a", "One night. The film will still be ugly in spots.", "cool", 2, 3, 0),
			C("b", "That's how we should look when we play on time.", "even", 3, 2, 2),
			C("c", "We're built for this. The league can take notes.", "hot", 0, 1, 5),
			C("d", "Ask me in March. November blowouts don't hang banners.", "even", 1, 2, -1)
		]
	},
	{
		id: "win-standard",
		when: (c) => c.won && c.margin > 5 && c.margin < 16,
		prompt: (c) => `You beat ${c.oppName} ${c.youScore}-${c.oppScore}. How do you want this locker room to hear it?`,
		choices: () => [
			C("a", "Credit the guys who sat and the ones who played.", "cool", 4, 2, 1),
			C("b", "We're not satisfied. That was a step, not a statement.", "even", 1, 3, 2),
			C("c", "They doubted us. They can keep talking.", "hot", -2, -1, 5),
			C("d", "That's the system. I had them ready.", "hot", -5, -2, 0)
		]
	},
	{
		id: "loss-close",
		when: (c) => !c.won && c.margin <= 5,
		prompt: (c) => `${c.oppName} made one more play. ${c.oppScore}-${c.youScore}. How do you live with that film?`,
		choices: () => [
			C("a", "That's on me. I'll take the last possession.", "cool", 3, 4, 1),
			C("b", "We compete. The result is one night.", "even", 1, 0, 2),
			C("c", "I'm not talking about the officiating. You saw it.", "hot", -1, -4, 3),
			C("d", "We had it. We gave it away. That's the truth.", "hot", -3, -1, 1)
		]
	},
	{
		id: "loss-blowout",
		when: (c) => !c.won && c.margin >= 16,
		prompt: (c) => `That was a ${c.margin}-point night against ${c.oppName}. Are you still the right voice for this locker room?`,
		choices: () => [
			C("a", "Yes. We'll get this fixed on the floor, not on a podium.", "even", 2, 2, 0),
			C("b", "I didn't have them ready. That's the only headline.", "cool", 1, 4, -1),
			C("c", "Some guys didn't show up. That's the truth.", "hot", -6, -3, -2),
			C("d", "Ask the people writing the checks if they still believe. I do.", "hot", -2, -5, 3)
		]
	},
	{
		id: "loss-standard",
		when: (c) => !c.won && c.margin > 5 && c.margin < 16,
		prompt: (c) => `${c.oppName} had the last word, ${c.oppScore}-${c.youScore}. What's the message?`,
		choices: () => [
			C("a", "That's on me. We'll fix the film.", "cool", 2, 3, 1),
			C("b", "We compete. The result is one night.", "even", 1, 0, 2),
			C("c", "I'm not talking about the officiating. You saw it.", "hot", -1, -4, 3),
			C("d", "Minutes will change. The tape was honest.", "hot", -4, 1, 0)
		]
	},
	{
		id: "home-crowd",
		when: (c) => c.home,
		prompt: (c) => `The students waited through ${c.oppName}. What did they just pay to watch?`,
		choices: (c) => [
			C("a", "A team that will play for this building every night.", "cool", 3, 2, 4),
			C("b", c.won ? "A win. That's what they came for." : "A group that still has work to do. We owe them better.", "even", 1, 1, 2),
			C("c", "They were louder than we were. That's on us.", "even", 2, 0, 1),
			C("d", "If they want a show, write the NIL checks.", "hot", 0, -4, 3)
		]
	},
	{
		id: "road",
		when: (c) => !c.home,
		prompt: (c) => `Hostile gym at ${c.oppName}. Did you like how you competed?`,
		choices: (c) => [
			C("a", c.won ? "Loved it. That's a road group." : "We competed. We didn't finish.", "even", 3, 2, 2),
			C("b", "The crowd got to a couple of guys. I'll handle that.", "cool", 1, 3, 0),
			C("c", "This league doesn't scare us. Next building.", "hot", 2, 0, 3),
			C("d", "We came to survive, not to make friends.", "even", 0, 1, 1)
		]
	},
	{
		id: "league",
		when: (c) => c.conf,
		prompt: (c) => `League play is a different animal. What's the message to the rest of the conference after ${c.oppName}?`,
		choices: () => [
			C("a", "We're not going anywhere.", "even", 2, 2, 3),
			C("b", "One league game. There are a lot of them.", "cool", 1, 3, 0),
			C("c", "If you want our gym, bring a better team.", "hot", 1, 0, 4),
			C("d", "The standings will sort it out. I'm not doing the sorting tonight.", "even", 0, 2, -1)
		]
	},
	{
		id: "star",
		when: (c) => true,
		prompt: (c) => `${c.star} had the ball in his hands down the stretch. Is that the plan going forward?`,
		choices: (c) => [
			C("a", `${c.star} earned that. He'll keep it until someone takes it.`, "cool", 4, 1, 2),
			C("b", "Whoever is hot. The playbook is bigger than one name.", "even", 2, 2, 1),
			C("c", "If he wants the shot, he has to guard. That's the deal.", "hot", -2, 2, 0),
			C("d", "I call the play. They run it. Ego doesn't get a vote.", "even", 0, 3, -1)
		]
	},
	{
		id: "ad-watch",
		when: (_c, s) => s.adHeat >= 62 || s.adHeat <= 32,
		prompt: (_c, s) => s.adHeat >= 62 ? "The administration is in the back of the room. Can you still do this job?" : "The AD just nodded through your last three answers. What do they need to hear?",
		choices: () => [
			C("a", "I was hired to build this. I'm still building it.", "even", 2, 3, 1),
			C("b", "Win the next one and this conversation changes.", "even", 1, 2, 2),
			C("c", "If they want a new voice, they know where to find me.", "hot", -3, -5, 2),
			C("d", "Trust the work. March is built in November.", "cool", 2, 4, 2)
		]
	},
	{
		id: "nil",
		when: (c) => c.nil,
		prompt: (c) => `Donors keep asking about the NIL pool after ${c.oppName}. What do you tell them?`,
		choices: () => [
			C("a", "Help us keep the guys who already bled for this place.", "cool", 3, 1, 2),
			C("b", "Write the checks and we'll keep the talent. That's the sport now.", "hot", 1, -3, 4),
			C("c", "Development still beats a contract. I believe that.", "even", 4, 2, -1),
			C("d", "That's above my pay grade. I coach the ones in the gym.", "even", 2, 3, 0)
		]
	},
	{
		id: "fans",
		when: (c) => true,
		prompt: (c, s) => identityName(s.identity) + `, the fan base is ${s.fanMood >= 60 ? "with you" : "restless"}. What do they need to hear?`,
		choices: () => [
			C("a", "Stay with us. This group will give you a reason.", "cool", 2, 2, 4),
			C("b", "Boos don't bother me. Losing does.", "hot", 0, 1, -2),
			C("c", "We're going to play fast, physical, and honest.", "even", 3, 2, 3),
			C("d", "If you're here for a 40-win fairy tale, you're in the wrong gym.", "hot", -1, -2, -3)
		]
	},
	{
		id: "morale",
		when: (_c, s) => {
			const r = s.players.filter((p) => p.teamId === s.playerTeamId);
			return r.reduce((n, p) => n + p.morale, 0) / Math.max(1, r.length) < 58;
		},
		prompt: () => "The body language was obvious. How do you get this room back?",
		choices: () => [
			C("a", "Closed doors. Honest film. Then we go back to work.", "cool", 5, 2, 0),
			C("b", "Minutes will change if the tape says so.", "hot", -3, 2, 0),
			C("c", "I believe in every guy who walked in that locker room.", "cool", 5, 1, 2),
			C("d", "Some of them should be nervous.", "hot", -7, 0, -1)
		]
	},
	{
		id: "belief",
		when: () => true,
		prompt: () => "Last one from the tunnel — a player asked if you still believe in this group.",
		choices: () => [
			C("a", "I believe in every guy who walked in that locker room.", "cool", 5, 1, 2),
			C("b", "Belief is earned on the next possession.", "even", 1, 2, 1),
			C("c", "Minutes will change if the tape says so.", "hot", -3, 2, 0),
			C("d", "Some of them should be nervous.", "hot", -7, 0, -1)
		]
	}
];
function buildPresser(state, slotId) {
	const ctx = gameCtx(state, slotId);
	if (!ctx) return null;
	const rng = mulberry32(state.seed ^ hashString(slotId) ^ state.week * 911 ^ (state.recentQuestionIds?.length ?? 0));
	if (!shouldHoldPresser(state, ctx, rng)) return null;
	const recent = new Set(state.recentQuestionIds ?? []);
	const matched = FACTORIES.filter((f) => f.when(ctx, state));
	const fresh = matched.filter((f) => !recent.has(f.id));
	const questions = [...fresh.length >= 2 ? fresh : matched].sort(() => rng() - .5).slice(0, rng() < .35 ? 1 : 2).map((f) => ({
		id: f.id,
		prompt: f.prompt(ctx, state),
		choices: f.choices(ctx, state, rng).sort(() => rng() - .5)
	}));
	if (!questions.length) return null;
	return {
		gameId: slotId,
		questions,
		asked: 0,
		log: []
	};
}
function rememberQuestions(state, presser) {
	return [...presser.questions.map((q) => q.id), ...state.recentQuestionIds ?? []].slice(0, 16);
}
//#endregion
//#region src/game/mail.ts
function mail(partial) {
	return {
		...partial,
		read: false
	};
}
function afterGameMail(state, ctx) {
	const rng = mulberry32(state.seed ^ hashString(ctx.slotId) ^ 2989);
	const out = [];
	if (rng() < .42) out.push(adNote(state, ctx, rng));
	if (rng() < .34) out.push(fanNote(state, ctx, rng));
	if (rng() < .3) out.push(boosterNote(state, ctx, rng));
	return [...out, ...state.mail].slice(0, 40);
}
function weeklyStakeholderMail(state, week) {
	const rng = mulberry32(state.seed ^ week * 4243);
	if (week < 2) return state.mail;
	if (rng() > .55) return state.mail;
	const t = state.teams[state.playerTeamId];
	const pct = t.wins + t.losses ? t.wins / (t.wins + t.losses) : .5;
	const who = pick(rng, [
		"ad",
		"fan",
		"booster"
	]);
	return [who === "ad" ? adWeekly(state, pct, week, rng) : who === "fan" ? fanWeekly(state, pct, week, rng) : boosterWeekly(state, pct, week, rng), ...state.mail].slice(0, 40);
}
function presserFollowup(state, ad, fans, morale) {
	const rng = mulberry32(state.seed ^ state.week * 17 ^ ad * 9 + fans * 5 + morale);
	const name = identityName(state.identity);
	const school = TEAM_BY_ID[state.playerTeamId];
	if (ad >= 3) return mail({
		id: `press-${state.week}-${state.results.length}-ad`,
		from: "Athletic Director",
		subject: pick(rng, [
			"That's the job",
			"The board heard you",
			"Keep that voice"
		]),
		body: pick(rng, [
			`${name}, that's how you talk for this place. The board texted me before I got back to the suite.`,
			`Clean. Short. No mess for me to clean. Do that again after the next one.`,
			`Donors like a coach who sounds like he has a plan. Tonight you did.`
		]),
		week: state.week,
		tone: "good"
	});
	if (ad <= -3) return mail({
		id: `press-${state.week}-${state.results.length}-ad`,
		from: "Athletic Director",
		subject: pick(rng, [
			"Watch the mic",
			"My phone is hot",
			"Not in my building"
		]),
		body: pick(rng, [
			`You made my night harder. The board watches the podium too. Next time think about who is standing behind the cameras.`,
			`${name}: I don't need a viral clip. I need a coach who doesn't set the alumni on fire.`,
			`If you want to fight the media, do it in my office, not on the record. We're ${school.name}. Act like it.`
		]),
		week: state.week,
		tone: "bad"
	});
	return mail({
		id: `press-${state.week}-${state.results.length}-ad`,
		from: "Athletic Director",
		subject: pick(rng, [
			"Noted",
			"Fine",
			"Just win one"
		]),
		body: pick(rng, [
			`Fine. Just win the next one so I don't have to explain the quotes.`,
			`I can live with that. Don't make me live with a losing streak on top of it.`,
			`Noted. The podium is not the problem. The scoreboard might be.`
		]),
		week: state.week,
		tone: "even"
	});
}
function adNote(state, ctx, rng) {
	const name = identityName(state.identity);
	if (ctx.won && ctx.margin >= 12) return mail({
		id: `adg-${ctx.slotId}`,
		from: "Athletic Director",
		subject: pick(rng, [
			"That's more like it",
			"The suite was loud",
			"Keep stacking"
		]),
		body: pick(rng, [
			`${ctx.youScore}-${ctx.oppScore} against ${ctx.oppName}. That's the version of us I sold in July.`,
			`${name}, the suite stayed on its feet. Do not let this be a one-off.`,
			`I can raise money on nights like this. Give me a few more.`
		]),
		week: ctx.week,
		tone: "good"
	});
	if (!ctx.won && ctx.margin >= 12) return mail({
		id: `adg-${ctx.slotId}`,
		from: "Athletic Director",
		subject: pick(rng, [
			"We need a response",
			"Not why we hired you",
			"Call me tomorrow"
		]),
		body: pick(rng, [
			`${ctx.record} after ${ctx.oppName}. That is not why we hired you. I need a stretch of basketball that looks like a plan.`,
			`I'm going to get questions at breakfast. I need something better than "we'll watch the film."`,
			`${name}: a ${ctx.margin}-point night in this league puts my job next to yours. Fix the thing that is broken.`
		]),
		week: ctx.week,
		tone: "bad"
	});
	if (ctx.won) return mail({
		id: `adg-${ctx.slotId}`,
		from: "Athletic Director",
		subject: pick(rng, [
			"Good",
			"Bank it",
			"On to the next"
		]),
		body: pick(rng, [
			`${ctx.record}. Bank it. Don't get cute with the next one.`,
			`A win is a win. The board likes the column more than the style points.`,
			`We're still in it. Keep the locker room on this side of the ball.`
		]),
		week: ctx.week,
		tone: "good"
	});
	return mail({
		id: `adg-${ctx.slotId}`,
		from: "Athletic Director",
		subject: pick(rng, [
			"Checking in",
			"One night",
			"Get the next"
		]),
		body: pick(rng, [
			`${ctx.record} after ${ctx.oppName}. Get the next one and this stays a footnote.`,
			`I didn't love the body language. I don't need a speech. I need a response on the floor.`,
			`We're still in it if you say we are. Say it in the gym, not in my inbox.`
		]),
		week: ctx.week,
		tone: "even"
	});
}
function fanNote(state, ctx, rng) {
	const from = pick(rng, [
		"Season-ticket holder",
		"Student section",
		"Message board",
		"Alumni chapter"
	]);
	if (ctx.won) return mail({
		id: `fang-${ctx.slotId}`,
		from,
		subject: pick(rng, [
			"That's our team",
			"We felt that one",
			"More of that"
		]),
		body: pick(rng, [
			`${ctx.oppName} came in loud. You sent them out quiet. Do it again Saturday.`,
			`The upper deck was standing. Don't forget who fills it when the weather is bad.`,
			`${ctx.youScore}-${ctx.oppScore}. That's the version we bought tickets for.`
		]),
		week: ctx.week,
		tone: "good"
	});
	return mail({
		id: `fang-${ctx.slotId}`,
		from,
		subject: pick(rng, [
			"Show something",
			"We've seen this",
			"Get mad"
		]),
		body: pick(rng, [
			`We've sat through worse. Don't make us sit through indifferent.`,
			`${ctx.oppName} wanted it more. That's the part I can't explain to the people I dragged here.`,
			`Boos are honest. Take them personally. Then go win.`
		]),
		week: ctx.week,
		tone: "bad"
	});
}
function boosterNote(state, ctx, rng) {
	const nil = ctx.nil;
	const from = nil ? pick(rng, [
		"NIL collective",
		"Lead donor",
		"Collective board"
	]) : pick(rng, [
		"Booster club",
		"Letterwinner",
		"Tip-off club"
	]);
	if (ctx.won) return mail({
		id: `bstr-${ctx.slotId}`,
		from,
		subject: pick(rng, [
			"We're in",
			"That's fundable",
			"Keep feeding us wins"
		]),
		body: nil ? pick(rng, [
			`Nights like ${ctx.oppName} make the phone ring. Keep the roster together and the checks stay easy.`,
			`I can sell this. Don't go cheap in the portal if we're actually trying.`,
			`The collective will do its part if the product looks like this.`
		]) : pick(rng, [
			`That's the kind of night that fills the golf outing. Thank you.`,
			`The tip-off club is happy. Keep them that way.`,
			`I wrote a check in 1998. Nights like this are why.`
		]),
		week: ctx.week,
		tone: "good"
	});
	return mail({
		id: `bstr-${ctx.slotId}`,
		from,
		subject: pick(rng, [
			"Harder to raise",
			"We're watching",
			"Product question"
		]),
		body: nil ? pick(rng, [
			`It's hard to ask people for NIL money after a night like ${ctx.oppName}. Give me something to sell.`,
			`The collective isn't a charity. Put a team on the floor that looks invested.`,
			`We're not walking. We're waiting. Don't make us wait into March.`
		]) : pick(rng, [
			`The golf outing got quieter. Wins talk. This didn't.`,
			`I've been in the building since the old gym. This group looks soft.`,
			`We'll still show up. It would help if they did too.`
		]),
		week: ctx.week,
		tone: "bad"
	});
}
function adWeekly(state, pct, week, rng) {
	const t = state.teams[state.playerTeamId];
	const tone = pct >= .6 ? "good" : pct <= .38 ? "bad" : "even";
	return mail({
		id: `adw-${week}`,
		from: "Athletic Director",
		subject: tone === "good" ? pick(rng, [
			"The building believes",
			"Keep the line moving",
			"Board is calm"
		]) : tone === "bad" ? pick(rng, [
			"We need a response",
			"Temperature check",
			"My week"
		]) : pick(rng, [
			"Checking in",
			"Still in it",
			"Week " + week
		]),
		body: tone === "good" ? pick(rng, [
			`${t.wins}-${t.losses}. Donors are picking up the phone. Keep the locker room on this side of the ball.`,
			`The board likes the direction. Don't give them a reason to start a new conversation.`,
			`Good week. Recruiting is easier when the product matches the brochure.`
		]) : tone === "bad" ? pick(rng, [
			`${t.wins}-${t.losses} is not why we hired you. The fan base is loud. I need a stretch of basketball that looks like a plan.`,
			`I'm taking meetings I don't want to take. Change the temperature.`,
			`This is still your job. Act like you want to keep it.`
		]) : pick(rng, [
			`${t.wins}-${t.losses}. We're still in it. Don't get cute with the schedule or the portal.`,
			`Even week. Even is fine. Drift is not.`,
			`Keep the room together. That's the whole note.`
		]),
		week,
		tone
	});
}
function fanWeekly(state, pct, week, rng) {
	const from = pick(rng, [
		"Season-ticket holder",
		"Student section",
		"Call-in show"
	]);
	const tone = pct >= .6 ? "good" : pct <= .38 ? "bad" : "even";
	return mail({
		id: `fanw-${week}`,
		from,
		subject: tone === "good" ? pick(rng, [
			"We're in",
			"Love this group",
			"Saturday can't come"
		]) : tone === "bad" ? pick(rng, [
			"Show up",
			"Same old",
			"Empty seats"
		]) : pick(rng, [
			"Still here",
			"Week " + week,
			"From the upper deck"
		]),
		body: tone === "good" ? pick(rng, [
			"This team is fun again. Don't overcoach it.",
			"The student line wrapped around the bookstore. That's on you.",
			"Keep playing like you mean it and we'll keep filling it."
		]) : tone === "bad" ? pick(rng, [
			"We're not asking for perfect. We're asking for a pulse.",
			"I can get this product on the radio for free. Give me a reason to pay.",
			"The walkouts started in the second half. That's a choice."
		]) : pick(rng, [
			"We'll be there. Play like you know that.",
			"Not buzzing, not leaving. That's the fan base you have.",
			"Do something worth a text thread."
		]),
		week,
		tone
	});
}
function boosterWeekly(state, pct, week, rng) {
	const nil = state.nilCap > 0;
	const from = nil ? "NIL collective" : "Booster club";
	const tone = pct >= .6 ? "good" : pct <= .38 ? "bad" : "even";
	return mail({
		id: `bstrw-${week}`,
		from,
		subject: tone === "good" ? pick(rng, [
			"Funds are moving",
			"Easy yes",
			"We're aligned"
		]) : tone === "bad" ? pick(rng, [
			"Harder ask",
			"Waiting",
			"Product"
		]) : pick(rng, [
			"Check-in",
			"Still writing",
			"From the club"
		]),
		body: tone === "good" ? nil ? pick(rng, ["The collective had a good week because you did. Keep the roster happy.", "I can make calls when the product looks like a program."]) : pick(rng, ["The tip-off club is in. Don't waste it.", "Wins make the annual drive easy. Thank you."]) : tone === "bad" ? nil ? pick(rng, ["People don't write NIL checks for  .400 basketball. Change the number.", "We're not out. We're tired of selling hope."]) : pick(rng, ["The booster board is restless. A win would help my next meeting.", "I've been patient. Patience has a season too."]) : pick(rng, ["We'll keep doing our part. Do yours on the floor.", "No panic. No parade. Just basketball."]),
		week,
		tone
	});
}
//#endregion
//#region src/game/develop.ts
var FIRST$1 = [
	"Jaylen",
	"Malik",
	"Cole",
	"Amari",
	"Tyler",
	"Isaiah",
	"Cam",
	"Devin",
	"Marcus",
	"Noah",
	"Liam",
	"Jalen",
	"Chris",
	"Anthony",
	"Miles",
	"Owen",
	"Ryan",
	"Kai",
	"Brandon",
	"Darius"
];
var LAST$1 = [
	"Williams",
	"Johnson",
	"Brown",
	"Davis",
	"Miller",
	"Wilson",
	"Moore",
	"Taylor",
	"Anderson",
	"Thomas",
	"Jackson",
	"White",
	"Harris",
	"Martin",
	"Thompson",
	"Garcia",
	"Clark",
	"Lewis",
	"Walker",
	"Young"
];
var SKILL_LABEL = [
	{
		id: "shoot",
		label: "Shoot"
	},
	{
		id: "finish",
		label: "Finish"
	},
	{
		id: "defense",
		label: "Defense"
	},
	{
		id: "iq",
		label: "IQ"
	}
];
var COACH_AXES = [
	{
		id: "offense",
		label: "Offense",
		hint: "Scoring edge on your possessions"
	},
	{
		id: "defense",
		label: "Defense",
		hint: "Makes the other team miss"
	},
	{
		id: "recruiting",
		label: "Recruiting",
		hint: "Offers and visits land harder"
	},
	{
		id: "development",
		label: "Development",
		hint: "Players grow toward potential"
	},
	{
		id: "leadership",
		label: "Leadership",
		hint: "Pep talks and locker-room floor"
	}
];
var DEFAULT_COACH = {
	offense: 48,
	defense: 48,
	recruiting: 50,
	development: 46,
	leadership: 50
};
function emptyHistory() {
	return {
		seasons: 0,
		wins: 0,
		losses: 0,
		titles: 0,
		ncaaBids: 0,
		confTitles: 0,
		log: []
	};
}
function compositeOvr(s) {
	return clamp(Math.round(s.shoot * .28 + s.finish * .24 + s.defense * .28 + s.iq * .2), 40, 99);
}
function skillsFromOvr(ovr, pos, rng) {
	const wobble = () => Math.round(gaussian(rng) * 4);
	const bias = {
		PG: {
			shoot: 2,
			finish: -2,
			defense: -1,
			iq: 4
		},
		SG: {
			shoot: 5,
			finish: -1,
			defense: -1,
			iq: 0
		},
		SF: {
			shoot: 1,
			finish: 1,
			defense: 1,
			iq: 0
		},
		PF: {
			shoot: -3,
			finish: 4,
			defense: 2,
			iq: -1
		},
		C: {
			shoot: -6,
			finish: 6,
			defense: 4,
			iq: -2
		}
	}[pos];
	const raw = {
		shoot: clamp(ovr + wobble() + bias.shoot, 40, 99),
		finish: clamp(ovr + wobble() + bias.finish, 40, 99),
		defense: clamp(ovr + wobble() + bias.defense, 40, 99),
		iq: clamp(ovr + wobble() + bias.iq, 40, 99)
	};
	const diff = ovr - compositeOvr(raw);
	if (diff) {
		raw.shoot = clamp(raw.shoot + diff, 40, 99);
		raw.finish = clamp(raw.finish + Math.round(diff * .6), 40, 99);
	}
	return raw;
}
function potentialFor(ovr, year, rng) {
	return clamp(ovr + (year <= 1 ? randInt(rng, 5, 13) : year === 2 ? randInt(rng, 3, 9) : year === 3 ? randInt(rng, 1, 6) : randInt(rng, 0, 3)), ovr, 99);
}
function makePlayer(opts) {
	const skills = opts.skills ?? skillsFromOvr(opts.ovr, opts.pos, opts.rng);
	const ovr = compositeOvr(skills);
	return {
		id: opts.id,
		first: opts.first,
		last: opts.last,
		pos: opts.pos,
		year: opts.year,
		ovr,
		potential: opts.potential ?? potentialFor(ovr, opts.year, opts.rng),
		morale: opts.morale ?? 68 + randInt(opts.rng, -6, 8),
		teamId: opts.teamId,
		mpg: opts.mpg,
		skills,
		seasonMinutes: 0,
		seasonGames: 0,
		careerMinutes: 0,
		careerGames: 0
	};
}
function ensurePlayer(p, rng) {
	const skills = p.skills ?? skillsFromOvr(p.ovr, p.pos, rng);
	const ovr = p.skills ? compositeOvr(skills) : p.ovr;
	return {
		...p,
		skills,
		ovr,
		potential: p.potential ?? potentialFor(ovr, p.year, rng),
		seasonMinutes: p.seasonMinutes ?? 0,
		seasonGames: p.seasonGames ?? 0,
		careerMinutes: p.careerMinutes ?? 0,
		careerGames: p.careerGames ?? 0
	};
}
function ensureRecruit(r, rng) {
	return {
		...r,
		skills: r.skills ?? skillsFromOvr(r.ovr, r.pos, rng),
		potential: r.potential ?? potentialFor(r.ovr, 1, rng)
	};
}
function hydrateState(state) {
	const rng = mulberry32(state.seed ^ 1307);
	return {
		...state,
		players: state.players.map((p) => ensurePlayer(p, rng)),
		recruits: state.recruits.map((r) => ensureRecruit(r, rng)),
		coachSkills: state.coachSkills ?? { ...DEFAULT_COACH },
		skillPoints: state.skillPoints ?? 0,
		offseasonReport: state.offseasonReport ?? null,
		liveGame: state.liveGame ?? null,
		lastPresserWeek: state.lastPresserWeek ?? -9,
		recentQuestionIds: state.recentQuestionIds ?? [],
		history: {
			...emptyHistory(),
			...state.history,
			log: state.history?.log ?? []
		},
		selection: state.selection ?? null,
		results: (state.results ?? []).map((r) => fillResultBox(r, mulberry32(state.seed ^ hashString(r.id) ^ 2817))),
		teams: Object.fromEntries(Object.entries(state.teams).map(([id, t]) => [id, {
			...t,
			allWins: t.allWins ?? 0,
			allLosses: t.allLosses ?? 0
		}]))
	};
}
function fillResultBox(r, rng) {
	if (r.homeBox && r.awayBox && r.minutes) return r;
	const boxes = estimateGameBoxes(r.homeScore, r.awayScore, rng);
	return {
		...r,
		minutes: r.minutes ?? boxes.minutes,
		homeBox: r.homeBox ?? boxes.home,
		awayBox: r.awayBox ?? boxes.away
	};
}
function bumpSkill(s, key, n, cap) {
	return {
		...s,
		[key]: clamp(s[key] + n, 40, cap)
	};
}
function room(p) {
	return Math.max(0, p.potential - p.ovr);
}
function lagSkill(p) {
	const cap = p.potential;
	return [
		"shoot",
		"finish",
		"defense",
		"iq"
	].map((k) => ({
		k,
		gap: cap - p.skills[k]
	})).sort((a, b) => b.gap - a.gap)[0].k;
}
function inSeasonGrowth(state, teamId, rng) {
	const dev = state.coachSkills?.development ?? 46;
	const lead = state.coachSkills?.leadership ?? 50;
	return state.players.map((raw) => {
		if (raw.teamId !== teamId) return raw;
		let p = ensurePlayer(raw, rng);
		p = {
			...p,
			seasonGames: p.seasonGames + 1,
			seasonMinutes: p.seasonMinutes + p.mpg
		};
		const floor = 22 + Math.round(lead * .08);
		p = {
			...p,
			morale: clamp(p.morale, floor, 99)
		};
		if (p.ovr >= p.potential) return p;
		if (p.seasonGames % 5 !== 0) return p;
		if (p.mpg < 10) return p;
		const chance = .18 + p.mpg / 90 + (dev - 46) / 220 + (p.morale - 60) / 400;
		if (rng() > chance) return p;
		const key = lagSkill(p);
		const skills = bumpSkill(p.skills, key, 1, p.potential);
		return {
			...p,
			skills,
			ovr: compositeOvr(skills)
		};
	});
}
function offseasonGain(p, dev, rng) {
	const gap = room(p);
	if (gap <= 0) return rng() < .08 ? -1 : 0;
	const chance = .35 + (p.seasonMinutes || p.mpg * 26) / 900 + (dev - 46) / 160 + (p.morale - 60) / 300;
	if (rng() > chance) return 0;
	return rng() < .25 && gap > 4 ? 2 : 1;
}
function developRoster(state, rng) {
	const dev = state.coachSkills?.development ?? 46;
	const grew = [];
	const players = state.players.map((raw) => {
		const p = ensurePlayer(raw, rng);
		const g = offseasonGain(p, p.teamId === state.playerTeamId ? dev : 46, rng);
		if (!g) return p;
		const key = g < 0 ? "finish" : lagSkill(p);
		const skills = bumpSkill(p.skills, key, g, p.potential);
		const next = {
			...p,
			skills,
			ovr: compositeOvr(skills)
		};
		if (p.teamId === state.playerTeamId && next.ovr !== p.ovr) grew.push({
			id: p.id,
			name: `${p.first} ${p.last}`,
			before: p.ovr,
			after: next.ovr
		});
		return next;
	});
	grew.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before));
	return {
		players,
		grew
	};
}
function recruitToPlayer(r, teamId, mpg, rng, i) {
	return makePlayer({
		id: `${teamId}-in-${r.id}-${i}`,
		first: r.first,
		last: r.last,
		pos: r.pos,
		year: 1,
		teamId,
		ovr: r.ovr,
		potential: r.potential,
		mpg,
		skills: r.skills,
		rng
	});
}
function walkOn(teamId, prestige, i, rng) {
	const pos = [
		"PG",
		"SG",
		"SF",
		"PF",
		"C"
	][i % 5];
	const ovr = clamp(Math.round(prestige * .4 + 36 + gaussian(rng) * 3 - i), 52, 78);
	return makePlayer({
		id: `${teamId}-wo-${i}-${Math.floor(rng() * 1e6)}`,
		first: pick(rng, FIRST$1),
		last: pick(rng, LAST$1),
		pos,
		year: 1,
		teamId,
		ovr,
		mpg: 6,
		rng
	});
}
function resolveCommits(state, rng) {
	return state.recruits.map((r) => {
		if (r.committedTo) return r;
		const you = r.interest[state.playerTeamId] ?? 0;
		if (r.offers.includes(state.playerTeamId) && you >= 58 && rng() < .42 + you / 400) return {
			...r,
			committedTo: state.playerTeamId
		};
		if (r.stars >= 4 && rng() < .55) {
			const power = pick(rng, TEAMS.filter((t) => t.prestige >= 78).map((t) => t.id));
			return {
				...r,
				committedTo: power
			};
		}
		if (rng() < .35) {
			const school = pick(rng, TEAMS.map((t) => t.id));
			return {
				...r,
				committedTo: school
			};
		}
		return r;
	});
}
function closeSeason(state) {
	const hist = {
		...emptyHistory(),
		...state.history,
		log: [...state.history?.log ?? []]
	};
	if (hist.log.some((l) => l.season === state.season)) return {
		...state,
		history: hist
	};
	const you = state.teams[state.playerTeamId];
	const confLead = [...Object.values(state.teams).filter((t) => t.conference === you.conference)].sort((a, b) => b.confW - a.confW || b.wins - a.wins)[0];
	const sel = state.selection;
	const confTitle = sel?.confTourney === you.id || sel?.autos?.[you.conference] === you.id || confLead?.id === you.id;
	const ncaaBid = Boolean(sel?.ncaa?.some((b) => b.teamId === you.id));
	const title = sel?.champ === you.id;
	const row = {
		season: state.season,
		teamId: you.id,
		wins: you.wins,
		losses: you.losses,
		confW: you.confW,
		confL: you.confL,
		coachName: you.coachName,
		confTitle,
		ncaaBid,
		title
	};
	const teams = Object.fromEntries(Object.values(state.teams).map((t) => [t.id, {
		...t,
		allWins: (t.allWins ?? 0) + t.wins,
		allLosses: (t.allLosses ?? 0) + t.losses
	}]));
	const players = state.players.map((p) => ({
		...p,
		careerGames: (p.careerGames ?? 0) + (p.seasonGames ?? 0),
		careerMinutes: (p.careerMinutes ?? 0) + (p.seasonMinutes ?? 0)
	}));
	return {
		...state,
		teams,
		players,
		history: {
			...hist,
			wins: hist.wins + you.wins,
			losses: hist.losses + you.losses,
			ncaaBids: hist.ncaaBids + (ncaaBid ? 1 : 0),
			confTitles: hist.confTitles + (confTitle ? 1 : 0),
			titles: hist.titles + (title ? 1 : 0),
			log: [...hist.log, row]
		}
	};
}
function enterOffseason(state) {
	if (state.phase === "offseason" && state.offseasonReport) return state;
	const closed = closeSeason(state);
	const { players, grew } = developRoster(closed, mulberry32(closed.seed ^ closed.season * 104729));
	const you = closed.teams[closed.playerTeamId];
	const pointsEarned = 1 + (you.wins > you.losses ? 1 : 0) + (you.confW >= 10 ? 1 : 0);
	const report = {
		grew: grew.slice(0, 12),
		graduated: players.filter((p) => p.teamId === closed.playerTeamId && p.year >= 4).map((p) => ({
			name: `${p.first} ${p.last}`,
			ovr: p.ovr
		})),
		incoming: [],
		walkons: [],
		pointsEarned
	};
	const school = TEAM_BY_ID[closed.playerTeamId];
	const year = closed.history.log[closed.history.log.length - 1];
	const extra = year ? `${year.wins}-${year.losses}${year.confTitle ? ", league title" : ""}${year.ncaaBid ? ", National bid" : ""}${year.title ? ", national title" : ""}.` : "";
	return {
		...closed,
		players,
		phase: "offseason",
		liveGame: null,
		pendingPresser: null,
		skillPoints: (closed.skillPoints ?? 0) + pointsEarned,
		offseasonReport: report,
		news: [{
			week: closed.week,
			text: `Offseason: ${school.name} ${extra} ${pointsEarned} coaching point${pointsEarned === 1 ? "" : "s"} earned.`,
			tone: year?.title || year?.confTitle ? "good" : "even"
		}, ...closed.news].slice(0, 80)
	};
}
function spendCoachPoint(state, axis) {
	if ((state.skillPoints ?? 0) < 1) return {
		state,
		ok: false
	};
	const cur = state.coachSkills ?? { ...DEFAULT_COACH };
	if (cur[axis] >= 99) return {
		state,
		ok: false
	};
	return {
		ok: true,
		state: {
			...state,
			skillPoints: state.skillPoints - 1,
			coachSkills: {
				...cur,
				[axis]: clamp(cur[axis] + 4, 20, 99)
			}
		}
	};
}
function setPlayerMpg(state, id, mpg) {
	return {
		...state,
		players: state.players.map((p) => p.id === id ? {
			...p,
			mpg: clamp(mpg, 0, 38)
		} : p)
	};
}
function nextSeason(state) {
	const rng = mulberry32(state.seed ^ (state.season + 1) * 224737);
	const commits = resolveCommits(state, rng);
	let players = state.players.filter((p) => p.year < 4);
	players = players.map((p) => ({
		...p,
		year: p.year + 1,
		seasonMinutes: 0,
		seasonGames: 0,
		careerMinutes: p.careerMinutes ?? 0,
		careerGames: p.careerGames ?? 0,
		morale: clamp(p.morale + 4, 40, 88)
	}));
	const incoming = [];
	const byTeam = {};
	for (const r of commits) {
		if (!r.committedTo) continue;
		(byTeam[r.committedTo] ??= []).push(r);
	}
	for (const team of TEAMS) {
		const returning = players.filter((p) => p.teamId === team.id).length;
		const spots = Math.max(0, 13 - returning);
		(byTeam[team.id] ?? []).sort((a, b) => b.ovr - a.ovr).slice(0, spots).forEach((r, i) => {
			const p = recruitToPlayer(r, team.id, i < 2 ? 16 : 10, rng, i);
			players.push(p);
			if (team.id === state.playerTeamId) incoming.push({
				name: `${p.first} ${p.last}`,
				ovr: p.ovr
			});
		});
	}
	const walkons = [];
	for (const team of TEAMS) {
		let n = players.filter((p) => p.teamId === team.id).length;
		let i = 0;
		while (n < 13) {
			const p = walkOn(team.id, team.prestige, i++, rng);
			players.push(p);
			n++;
			if (team.id === state.playerTeamId) walkons.push({
				name: `${p.first} ${p.last}`,
				ovr: p.ovr
			});
		}
		players.filter((p) => p.teamId === team.id).sort((a, b) => b.ovr - a.ovr).forEach((p, idx) => {
			p.mpg = idx < 5 ? 28 : idx < 8 ? 18 : 8;
		});
	}
	const teams = Object.fromEntries(Object.values(state.teams).map((t) => [t.id, {
		...t,
		wins: 0,
		losses: 0,
		confW: 0,
		confL: 0,
		homeW: 0,
		homeL: 0,
		homeStreak: 0,
		allWins: t.allWins ?? 0,
		allLosses: t.allLosses ?? 0
	}]));
	const season = state.season + 1;
	const report = {
		...state.offseasonReport ?? {
			grew: [],
			graduated: [],
			incoming: [],
			walkons: [],
			pointsEarned: 0
		},
		incoming,
		walkons
	};
	return {
		...state,
		season,
		week: 0,
		phase: "preseason",
		players,
		recruits: recruitsFor(state.seed, season),
		schedule: [],
		results: [],
		liveGame: null,
		pendingPresser: null,
		recruitingHours: 10,
		offseasonReport: report,
		teams,
		identity: {
			...state.identity,
			age: state.identity.age + 1
		},
		history: {
			...emptyHistory(),
			...state.history,
			seasons: (state.history?.seasons ?? 0) + 1,
			log: state.history?.log ?? []
		},
		news: [{
			week: 0,
			text: `${season} is here. ${incoming.length} newcomers, ${report.graduated.length} gone.`,
			tone: "good"
		}, ...state.news].slice(0, 80)
	};
}
function recruitsFor(seed, season) {
	const rng = mulberry32(seed ^ season * 7919);
	const out = [];
	const counts = {
		5: 8,
		4: 36,
		3: 90,
		2: 70,
		1: 24
	};
	let n = 0;
	const STATES = [
		"CA",
		"TX",
		"NY",
		"FL",
		"IL",
		"OH",
		"PA",
		"GA",
		"NC",
		"VA",
		"IN",
		"KY",
		"KS",
		"AZ",
		"WA",
		"OR",
		"CO",
		"TN",
		"AL",
		"SC",
		"NJ",
		"MA",
		"CT",
		"MD",
		"MO",
		"WI",
		"MI",
		"MN",
		"UT",
		"NV"
	];
	const styles = [
		"motion",
		"spread",
		"post",
		"transition",
		"iso"
	];
	for (const stars of [
		5,
		4,
		3,
		2,
		1
	]) for (let i = 0; i < counts[stars]; i++) {
		n++;
		const pos = [
			"PG",
			"SG",
			"SF",
			"PF",
			"C"
		][n % 5];
		const ovr = clamp(Math.round((stars === 5 ? 88 : stars === 4 ? 80 : stars === 3 ? 72 : stars === 2 ? 64 : 58) + gaussian(rng) * 2.2), 52, 94);
		const skills = skillsFromOvr(ovr, pos, rng);
		const roll = (b) => clamp(Math.round(18 + rng() * 50 + b), 8, 96);
		out.push({
			id: `r-${season}-${n}`,
			first: pick(rng, FIRST$1),
			last: pick(rng, LAST$1),
			pos,
			stars,
			ovr: compositeOvr(skills),
			potential: potentialFor(ovr, 1, rng),
			state: pick(rng, STATES),
			scouted: false,
			offers: [],
			visits: [],
			interest: {},
			committedTo: null,
			nilAsk: Math.round(stars * 18 + rng() * 20),
			wants: {
				home: roll(stars <= 3 ? 14 : -8),
				minutes: roll(stars <= 3 ? 16 : 2),
				scheme: roll(8),
				academics: roll(rng() < .18 ? 28 : -10),
				nil: roll(stars >= 4 ? 22 : -8),
				style: pick(rng, styles)
			},
			skills
		});
	}
	return out;
}
//#endregion
//#region src/game/plays.ts
function clockLabel(half, clock) {
	const m = Math.max(0, Math.floor(clock / 60));
	const s = Math.max(0, clock % 60);
	return `${half >= 3 ? `OT${half - 2}` : `H${half}`} ${m}:${s.toString().padStart(2, "0")}`;
}
function roster(state, teamId) {
	return state.players.filter((p) => p.teamId === teamId).sort((a, b) => b.ovr - a.ovr);
}
function pickPlayer(rng, r, prefer) {
	const pool = prefer ? r.filter((p) => prefer.includes(p.pos)) : r;
	const use = pool.length ? pool : r;
	const w = use.map((p, i) => Math.max(1, p.ovr - i * 2 + p.mpg));
	let t = rng() * w.reduce((s, n) => s + n, 0);
	for (let i = 0; i < use.length; i++) {
		t -= w[i];
		if (t <= 0) return use[i];
	}
	return use[0];
}
function teamOvr(state, teamId) {
	const r = roster(state, teamId).slice(0, 8);
	if (!r.length) return 70;
	return r.reduce((s, p) => s + p.ovr, 0) / r.length;
}
function nm(p) {
	return `${p.first} ${p.last}`;
}
var OFF_META = {
	motion: {
		label: "Motion",
		prefer: null
	},
	pnr: {
		label: "Pick & roll",
		prefer: ["PG", "SG"]
	},
	post: {
		label: "Post up",
		prefer: ["PF", "C"]
	},
	iso: {
		label: "Clear-out",
		prefer: [
			"PG",
			"SG",
			"SF"
		]
	},
	spread: {
		label: "Hunt a three",
		prefer: ["SG", "SF"]
	},
	push: {
		label: "Push tempo",
		prefer: ["PG", "SG"]
	},
	horns: {
		label: "Horns",
		prefer: ["PG", "PF"]
	},
	floppy: {
		label: "Floppy",
		prefer: ["SG", "SF"]
	},
	delay: {
		label: "Hold for last",
		prefer: ["PG", "SG"]
	},
	hammer: {
		label: "Hammer",
		prefer: ["SF", "SG"]
	}
};
var DEF_META = {
	man: { label: "Man" },
	zone: { label: "2-3 zone" },
	press: { label: "Full-court press" },
	pack: { label: "Pack-line" },
	trap: { label: "Sideline trap" },
	switch: { label: "Switch all" },
	foul: { label: "Foul him" },
	sag: { label: "Sag the paint" }
};
/** Matchup swings. Hidden until after the play. */
function clash(off, def) {
	let two = 0, three = 0, to = 0, ft = 0;
	let note = "";
	if (off === "post" && def === "pack") {
		two -= .12;
		three += .05;
		note = "Pack-line fronted the post.";
	} else if (off === "post" && def === "man") {
		two += .11;
		note = "The block was theirs.";
	} else if (off === "post" && def === "zone") {
		two += .08;
		note = "Soft middle. The 5 went to work.";
	} else if (off === "post" && def === "trap") {
		to += .1;
		three += .06;
		note = "They trapped the catch. Kick or die.";
	} else if (off === "spread" && def === "zone") {
		three += .14;
		two -= .06;
		note = "Zone left the corner.";
	} else if (off === "spread" && def === "press") {
		to += .12;
		note = "Press jumped the skip.";
	} else if (off === "spread" && def === "pack") {
		three -= .06;
		note = "Pack-line ran the shooter off the line.";
	} else if (off === "push" && def === "press") {
		two += .1;
		to += .1;
		note = "Press vs the push — live by the break.";
	} else if (off === "push" && def === "sag") {
		two += .08;
		note = "They sagged. The rim was there early.";
	} else if (off === "iso" && def === "trap") {
		to += .14;
		note = "Double came on the clear-out.";
	} else if (off === "iso" && def === "switch") {
		two += .07;
		note = "Switch left a mismatch on an island.";
	} else if (off === "iso" && def === "pack") {
		two -= .07;
		note = "Help sat in the paint. Iso had nowhere.";
	} else if (off === "pnr" && def === "trap") {
		to += .11;
		three += .07;
		note = "Trap on the screen. Pocket or turnover.";
	} else if (off === "pnr" && def === "switch") {
		two += .09;
		note = "Switch. The roll was open.";
	} else if (off === "pnr" && def === "sag") {
		three += .06;
		note = "They sat back. The pull-up was there.";
	} else if (off === "motion" && def === "man") {
		two += .05;
		to -= .04;
		note = "Motion vs man — the cut was on time.";
	} else if (off === "motion" && def === "zone") {
		three += .05;
		note = "Extra pass vs the zone.";
	} else if (off === "horns" && def === "man") {
		two += .08;
		note = "Horns got a dive at the nail.";
	} else if (off === "horns" && def === "zone") {
		two += .06;
		three += .04;
		note = "High post vs zone.";
	} else if (off === "floppy" && def === "zone") {
		three += .12;
		note = "Floppy into a gap in the zone.";
	} else if (off === "floppy" && def === "switch") {
		three -= .05;
		two += .04;
		note = "They switched the screen. Floppy died.";
	} else if (off === "hammer" && def === "zone") {
		three += .1;
		note = "Corner was empty. Hammer.";
	} else if (off === "hammer" && def === "man") {
		two += .08;
		note = "Backdoor cut vs overplay.";
	} else if (off === "delay" && def === "press") {
		to -= .06;
		note = "They pressed a hold. You burned clock.";
	} else if (off === "delay" && def === "foul") {
		ft += .5;
		note = "They sent you to the line on purpose.";
	} else if (def === "foul") {
		ft += .8;
		two -= .2;
		three -= .2;
		note = "Intentional foul. Live at the stripe.";
	} else if (def === "press") {
		to += .07;
		note = "Pressure on the ball.";
	} else if (def === "trap") {
		to += .08;
		note = "Trap came.";
	} else note = "The call was on.";
	return {
		two,
		three,
		to,
		ft,
		note
	};
}
function mix(off, def) {
	const m = {
		two: .4,
		three: .28,
		ft: .14,
		to: .18
	};
	if (off === "post") {
		m.two += .2;
		m.three -= .14;
		m.ft += .06;
	}
	if (off === "spread" || off === "floppy") {
		m.three += .22;
		m.two -= .14;
	}
	if (off === "iso") {
		m.two += .08;
		m.to += .05;
	}
	if (off === "pnr" || off === "horns") {
		m.two += .1;
		m.three += .04;
	}
	if (off === "push") {
		m.two += .08;
		m.three += .06;
		m.to += .05;
	}
	if (off === "hammer") {
		m.three += .1;
		m.two += .06;
	}
	if (off === "delay") {
		m.two += .08;
		m.to -= .06;
		m.three -= .04;
	}
	if (off === "motion") m.to -= .04;
	if (def === "press" || def === "trap") m.to += .1;
	if (def === "zone") {
		m.three += .1;
		m.two -= .08;
	}
	if (def === "pack") {
		m.two -= .08;
		m.three += .05;
	}
	if (def === "foul") {
		m.ft = .85;
		m.two = .05;
		m.three = .05;
		m.to = .05;
	}
	const c = clash(off, def);
	m.to = Math.max(.04, m.to + c.to);
	m.ft = Math.max(.04, m.ft + c.ft * .15);
	const sum = m.two + m.three + m.ft + m.to;
	m.two /= sum;
	m.three /= sum;
	m.ft /= sum;
	m.to /= sum;
	return m;
}
function rollKind(rng, off, def) {
	const m = mix(off, def);
	const x = rng();
	if (x < m.two) return "two";
	if (x < m.two + m.three) return "three";
	if (x < m.two + m.three + m.ft) return "ft";
	return "to";
}
function describe(off, def, kind, made, a, b, defP, and1) {
	const A = nm(a);
	const B = nm(b);
	const D = nm(defP);
	const tag = OFF_META[off].label;
	if (def === "foul") return `${tag}: they grab ${A} before the shot. Line.`;
	if (off === "post") {
		if (kind === "two") return made ? and1 ? `Post: ${A} seals ${D}, finishes, and-one.` : `Post: ${A} drop-steps ${D} and finishes.` : `Post: ${A} backs ${D} down. Short.`;
		if (kind === "three") return made ? `Post: double comes. ${A} kicks ${B} — corner three.` : `Post: kick to ${B}, the three is off.`;
		if (kind === "ft") return `Post: ${A} is hacked on the block.`;
		return `${D} rips the entry to ${A}.`;
	}
	if (off === "pnr") {
		if (kind === "two") return made ? `Pick-and-roll: ${A} turns the corner, lays it in.` : `Pick-and-roll: ${A} rejects it, pull-up rims out.`;
		if (kind === "three") return made ? `Pick-and-roll: ${A} draws two, ${B} pops — three.` : `${B} pops, three from the slot is long.`;
		if (kind === "ft") return `${A} is fouled on the roll.`;
		return `The trap on the screen gets ${A}.`;
	}
	if (off === "spread" || off === "floppy") {
		if (kind === "three") return made ? `${tag}: ${A} skips to ${B} — clean look. Three.` : `${tag}: they hunt it. ${B} misses from the wing.`;
		if (kind === "two") return made ? `${tag}: closeout, ${A} rips middle.` : `${tag}: ${A} drives into help.`;
		if (kind === "ft") return `${A} draws the closeout foul.`;
		return `The skip is picked. ${D} takes it.`;
	}
	if (off === "iso") {
		if (kind === "two") return made ? `Clear-out: ${A} sits ${D} down and gets to the spot.` : `Clear-out: ${A} hunts it. The jumper is short.`;
		if (kind === "three") return made ? `${A} steps behind the arc. Good.` : `${A} settles. No.`;
		if (kind === "ft") return `${A} gets into the body. Line.`;
		return `Doubled in the clear-out. Stolen.`;
	}
	if (off === "push") {
		if (kind === "two") return made ? `Push: ${A} leaks, ${B} hits him in stride.` : `Push: ${A} is off the glass in transition.`;
		if (kind === "three") return made ? `Early clock. ${B} from the slot. Three.` : `Rushed three from ${B}.`;
		if (kind === "ft") return `Transition foul on ${A}.`;
		return `They run into the pressure. Turnover.`;
	}
	if (off === "horns") {
		if (kind === "two") return made ? `Horns: ${A} dives, pocket pass, finish.` : `Horns: the dive is late. ${A} misses.`;
		if (kind === "three") return made ? `Horns: ${B} lifts off the elbow. Three.` : `Horns: elbow three from ${B} is short.`;
		if (kind === "ft") return `Horns: ${A} is cut off at the nail. FTs.`;
		return `Horns entry is jumped.`;
	}
	if (off === "hammer") {
		if (kind === "three") return made ? `Hammer: ${B} in the corner, unnoticed. Three.` : `Hammer: the corner three from ${B} rims out.`;
		if (kind === "two") return made ? `Hammer: ${A} back-cuts ${D} and finishes.` : `Hammer: the backdoor to ${A} is off.`;
		if (kind === "ft") return `Hammer cut, ${A} is chopped.`;
		return `They read the hammer. Stolen.`;
	}
	if (off === "delay") {
		if (kind === "two") return made ? `Hold: clock down, ${A} gets to the rim.` : `Hold: ${A} waits, the jumper is late.`;
		if (kind === "three") return made ? `Hold: ${B} for one. Three.` : `Hold: last-shot three from ${B} is short.`;
		if (kind === "ft") return `They foul ${A} as the clock dies.`;
		return `The hold turns into a trap. Turnover.`;
	}
	if (kind === "two") return made ? `Motion: ${A} cuts, ${B} hits him.` : `Motion: ${A} off the stagger, short.`;
	if (kind === "three") return made ? `Motion: ${B} lifts — three.` : `Motion: extra pass to ${B}, rims out.`;
	if (kind === "ft") return `Motion cut. ${A} at the line.`;
	return `Motion: skip is late. ${D} takes it.`;
}
function hoopFt(poss) {
	return poss === "home" ? {
		x: 88.75,
		y: 25
	} : {
		x: 5.25,
		y: 25
	};
}
/** Place the play on the floor from the outcome — not a random decoration. */
function playSpot(kind, off, poss, rng) {
	const h = hoopFt(poss);
	const dir = poss === "home" ? -1 : 1;
	let x = h.x;
	let y = h.y;
	if (kind === "ft") {
		x = h.x + dir * 13.75;
		y = 25 + (rng() - .5) * .6;
	} else if (kind === "to") {
		if (off === "push") {
			x = 47 + dir * (8 + rng() * 18);
			y = 10 + rng() * 30;
		} else {
			x = h.x + dir * (18 + rng() * 16);
			y = 8 + rng() * 34;
		}
	} else if (kind === "three") {
		if (rng() < .34) {
			x = h.x + dir * 2.2;
			y = rng() < .5 ? 3.2 : 46.8;
		} else if (rng() < .35) {
			x = h.x + dir * 22.4;
			y = 25 + (rng() - .5) * 6;
		} else {
			const ang = (rng() < .5 ? 1 : -1) * (.45 + rng() * .55);
			x = h.x + dir * Math.cos(ang) * 22.6;
			y = h.y + Math.sin(ang) * 22.6;
		}
	} else {
		const d = off === "post" ? 2 + rng() * 4 : off === "pnr" || off === "horns" ? 4 + rng() * 8 : 3 + rng() * 12;
		const ang = (rng() - .5) * 1.6;
		x = h.x + dir * Math.cos(ang) * d;
		y = h.y + Math.sin(ang) * d;
	}
	return {
		x: clamp(x, 1.5, 92.5),
		y: clamp(y, 1.5, 48.5)
	};
}
function impactLine(off, def, kind, made, pts, note, youOff) {
	const call = youOff ? OFF_META[off].label : DEF_META[def].label;
	if (pts > 0) return `${call} worked. ${note} ${pts}.`;
	if (kind === "to") return `${call} got picked. ${note}`;
	if (kind === "ft") return `${call}: the line. ${note}`;
	return made ? `${call}. ${note}` : `${call} didn't get a look. ${note}`;
}
function possSeconds(rng, off, def, clock) {
	if (def === "foul") return Math.min(clock, randInt(rng, 2, 6));
	if (off === "delay") return Math.min(clock, Math.max(6, clock - randInt(rng, 0, 3)));
	let sec = off === "push" ? randInt(rng, 8, 16) : off === "iso" ? randInt(rng, 16, 26) : randInt(rng, 14, 24);
	if (def === "press" || def === "trap") sec = Math.max(8, sec - 4);
	return Math.min(clock, sec);
}
function believeLine(live, rng) {
	if (live.homeId !== "utah-state" && live.awayId !== "utah-state") return null;
	if (rng() > .2) return null;
	return live.homeId === "utah-state" ? "I Believe that we will win — the Spectrum is on its feet." : "The Aggie bench is chirping I Believe on the road.";
}
function startLiveGame(state) {
	const g = state.schedule.find((x) => !x.resultId && !x.declined && (x.homeId === state.playerTeamId || x.awayId === state.playerTeamId) && x.week === state.week) ?? state.schedule.find((x) => !x.resultId && !x.declined && (x.homeId === state.playerTeamId || x.awayId === state.playerTeamId));
	if (!g) return null;
	const home = TEAM_BY_ID[g.homeId];
	const away = TEAM_BY_ID[g.awayId];
	const live = {
		slotId: g.id,
		homeId: g.homeId,
		awayId: g.awayId,
		homeScore: 0,
		awayScore: 0,
		half: 1,
		clock: 1200,
		poss: "home",
		offCall: "motion",
		defCall: "man",
		log: [{
			t: "H1 20:00",
			text: `${away.name} at ${home.name}. Tip to the home side.`,
			homeScore: 0,
			awayScore: 0
		}],
		done: false
	};
	return {
		...state,
		liveGame: live
	};
}
function setLiveCall(state, kind, id) {
	const live = state.liveGame;
	if (!live || live.done) return state;
	if (kind === "off") return {
		...state,
		liveGame: {
			...live,
			offCall: id,
			lastYouOff: id
		}
	};
	return {
		...state,
		liveGame: {
			...live,
			defCall: id,
			lastYouDef: id
		}
	};
}
function liveYouOffense(state) {
	const live = state.liveGame;
	if (!live) return true;
	return (live.poss === "home" ? live.homeId : live.awayId) === state.playerTeamId;
}
function offeredCalls(state) {
	const live = state.liveGame;
	if (!live || live.done) return [];
	const youOff = liveYouOffense(state);
	const rng = mulberry32(state.seed ^ live.clock ^ live.log.length ^ live.half * 17);
	const youScore = live.homeId === state.playerTeamId ? live.homeScore : live.awayScore;
	const trail = (live.homeId === state.playerTeamId ? live.awayScore : live.homeScore) - youScore;
	const late = live.half >= 2 && live.clock <= 90;
	const r = roster(state, state.playerTeamId);
	const big = r.find((p) => p.pos === "C" || p.pos === "PF");
	const wing = r.find((p) => p.pos === "SG" || p.pos === "SF");
	const offPool = [];
	const defPool = [];
	if (youOff) {
		offPool.push("motion", "pnr");
		if (big && (big.skills?.finish ?? big.ovr) >= 58) offPool.push("post", "horns");
		if (wing && (wing.skills?.shoot ?? wing.ovr) >= 58) offPool.push("spread", "floppy", "hammer");
		offPool.push("iso", "push");
		if (late) offPool.push("delay");
		if (trail >= 4) offPool.push("spread", "push", "hammer");
		if (trail <= -6 && live.clock < 40) offPool.push("delay");
	} else {
		defPool.push("man", "zone", "pack");
		if (trail > 0 || live.lastYouOff === "push") defPool.push("press", "trap");
		if (live.lastYouOff === "post") defPool.push("pack", "sag");
		if (live.lastYouOff === "spread" || live.lastYouOff === "floppy") defPool.push("pack", "switch");
		if (late && trail >= 1 && trail <= 3) defPool.push("foul");
		if (trail <= -8) defPool.push("sag", "pack");
		defPool.push("switch");
	}
	const seen = /* @__PURE__ */ new Set();
	const take = [...(youOff ? offPool : defPool).filter((id) => {
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	})].sort(() => rng() - .5).slice(0, 4);
	while (take.length < 4) {
		const extra = youOff ? pick(rng, [
			"motion",
			"pnr",
			"iso",
			"push"
		]) : pick(rng, [
			"man",
			"zone",
			"pack",
			"press"
		]);
		if (!take.includes(extra)) take.push(extra);
		else break;
	}
	return take.slice(0, 4).map((id) => youOff ? {
		id,
		side: "off",
		label: OFF_META[id].label
	} : {
		id,
		side: "def",
		label: DEF_META[id].label
	});
}
function stepLive(state, n = 1) {
	let s = state;
	for (let i = 0; i < n; i++) {
		if (!s.liveGame || s.liveGame.done) break;
		s = onePoss(s);
	}
	return s;
}
function simRestLive(state) {
	let s = state;
	let guard = 0;
	while (s.liveGame && !s.liveGame.done && guard++ < 240) s = onePoss(s);
	return s;
}
function onePoss(state) {
	const live = state.liveGame;
	if (!live || live.done) return state;
	const rng = mulberry32(state.seed ^ hashString(live.slotId) ^ live.homeScore * 13 + live.awayScore * 17 + live.clock + live.half * 1009 + live.log.length);
	const offId = live.poss === "home" ? live.homeId : live.awayId;
	const defId = live.poss === "home" ? live.awayId : live.homeId;
	const youOff = offId === state.playerTeamId;
	const offPlay = youOff ? live.offCall : cpuOff(rng, live.defCall, live.lastYouDef);
	const defPlay = youOff ? cpuDef(rng, live.offCall, live.lastYouOff) : live.defCall;
	const offR = roster(state, offId);
	const defR = roster(state, defId);
	const a = pickPlayer(rng, offR, OFF_META[offPlay].prefer);
	const b = pickPlayer(rng, offR, offPlay === "spread" || offPlay === "floppy" || offPlay === "hammer" ? ["SG", "SF"] : null);
	const d = pickPlayer(rng, defR, null);
	const c = clash(offPlay, defPlay);
	const coach = state.coachSkills;
	const coachOff = youOff ? ((coach?.offense ?? 48) - 50) / 180 : 0;
	const coachDef = !youOff ? ((coach?.defense ?? 48) - 50) / 180 : 0;
	const edge = (teamOvr(state, offId) - teamOvr(state, defId)) / 16 + (offId === live.homeId ? .18 : 0) + coachOff - coachDef;
	const shoot = (a.skills?.shoot ?? a.ovr) / 100;
	const finish = (a.skills?.finish ?? a.ovr) / 100;
	const iq = (a.skills?.iq ?? a.ovr) / 100;
	const dfn = (d.skills?.defense ?? d.ovr) / 100;
	let kind = rollKind(rng, offPlay, defPlay);
	if (kind !== "to" && rng() < clamp(.08 - iq * .07 + c.to * .4, .02, .22)) kind = "to";
	const make2 = clamp(.26 + finish * .3 + edge * .07 - dfn * .14 + c.two + gaussian(rng) * .02, .22, .72);
	const make3 = clamp(.16 + shoot * .3 + edge * .04 - dfn * .1 + c.three + gaussian(rng) * .02, .14, .52);
	let pts = 0;
	let made = false;
	let and1 = false;
	if (kind === "two") {
		made = rng() < make2;
		pts = made ? 2 : 0;
		if (made && rng() < .1 + finish * .08) {
			and1 = true;
			if (rng() < .7) pts = 3;
		}
	} else if (kind === "three") {
		made = rng() < make3;
		pts = made ? 3 : 0;
	} else if (kind === "ft") {
		const ft = clamp(.68 + edge * .03 + (a.skills?.shoot ?? a.ovr) / 400, .52, .88);
		const attempts = defPlay === "foul" ? 2 : 2;
		let n = 0;
		for (let i = 0; i < attempts; i++) if (rng() < ft) n++;
		pts = n;
		made = pts > 0;
	}
	let text = describe(offPlay, defPlay, kind, made, a, b, d, and1);
	if (kind === "ft") text = `${text} ${pts} of 2.`;
	const believe = believeLine(live, rng);
	if (believe && rng() < .35) text = `${text} ${believe}`;
	const impact = impactLine(offPlay, defPlay, kind, made, pts, c.note, youOff);
	const used = possSeconds(rng, offPlay, defPlay, live.clock);
	let clock = live.clock - used;
	let half = live.half;
	const homeScore = live.homeScore + (live.poss === "home" ? pts : 0);
	const awayScore = live.awayScore + (live.poss === "away" ? pts : 0);
	const spot = playSpot(kind, offPlay, live.poss, rng);
	let poss = live.poss === "home" ? "away" : "home";
	const events = [{
		t: clockLabel(half, Math.max(0, clock)),
		text,
		homeScore,
		awayScore,
		impact,
		pts,
		kind,
		made,
		poss: live.poss,
		x: spot.x,
		y: spot.y
	}, ...live.log].slice(0, 48);
	if (clock <= 0) {
		if (half === 1) {
			half = 2;
			clock = 1200;
			poss = "away";
			events.unshift({
				t: "H2 20:00",
				text: `Halftime ${TEAM_BY_ID[live.homeId]?.abbr} ${homeScore}, ${TEAM_BY_ID[live.awayId]?.abbr} ${awayScore}.`,
				homeScore,
				awayScore,
				kind: "period"
			});
		} else if (half === 2 && homeScore === awayScore) {
			half = 3;
			clock = 300;
			poss = "home";
			events.unshift({
				t: "OT 5:00",
				text: "Tied. Five more minutes.",
				homeScore,
				awayScore,
				kind: "period"
			});
		} else if (half >= 3 && homeScore === awayScore && half < 5) {
			half = half + 1;
			clock = 300;
			poss = "home";
			events.unshift({
				t: "OT 5:00",
				text: "Still tied. Another extra session.",
				homeScore,
				awayScore,
				kind: "period"
			});
		} else {
			events.unshift({
				t: "Final",
				text: `Final: ${TEAM_BY_ID[live.homeId]?.name} ${homeScore}, ${TEAM_BY_ID[live.awayId]?.name} ${awayScore}.`,
				homeScore,
				awayScore,
				kind: "period"
			});
			return {
				...state,
				liveGame: {
					...live,
					homeScore,
					awayScore,
					clock: 0,
					log: events,
					done: true,
					poss,
					half
				}
			};
		}
	}
	return {
		...state,
		liveGame: {
			...live,
			homeScore,
			awayScore,
			clock: Math.max(0, clock),
			half,
			poss,
			log: events,
			done: false
		}
	};
}
function cpuOff(rng, userDef, lastDef) {
	const d = lastDef ?? userDef;
	if (d === "zone") return rng() < .55 ? "spread" : "floppy";
	if (d === "press") return rng() < .5 ? "push" : "motion";
	if (d === "pack") return rng() < .5 ? "spread" : "hammer";
	if (d === "trap") return rng() < .5 ? "motion" : "horns";
	if (d === "foul") return "delay";
	return pick(rng, [
		"motion",
		"pnr",
		"post",
		"iso",
		"spread",
		"push",
		"horns"
	]);
}
function cpuDef(rng, userOff, lastOff) {
	const o = lastOff ?? userOff;
	if (o === "post") return rng() < .6 ? "pack" : "sag";
	if (o === "spread" || o === "floppy") return rng() < .55 ? "pack" : "switch";
	if (o === "push") return rng() < .45 ? "press" : "man";
	if (o === "iso") return rng() < .4 ? "trap" : "pack";
	if (o === "delay") return rng() < .35 ? "foul" : "man";
	return pick(rng, [
		"man",
		"man",
		"zone",
		"press",
		"pack",
		"switch"
	]);
}
//#endregion
//#region src/game/selection.ts
var REGIONS = [
	"East",
	"West",
	"South",
	"Midwest"
];
var NCAA_REGIONS = REGIONS;
var PAIR_64 = [
	[1, 16],
	[8, 9],
	[5, 12],
	[4, 13],
	[6, 11],
	[3, 14],
	[7, 10],
	[2, 15]
];
function item(week, text, tone = "even") {
	return {
		week,
		text,
		tone
	};
}
function withNews(state, ...lines) {
	return {
		...state,
		news: [...lines, ...state.news].slice(0, 80)
	};
}
function nextPow2(n) {
	let p = 2;
	while (p < n) p *= 2;
	return p;
}
function ovr$1(state, id) {
	const r = state.players.filter((p) => p.teamId === id).sort((a, b) => b.ovr - a.ovr).slice(0, 8);
	if (!r.length) return 70;
	return r.reduce((s, p) => s + p.ovr, 0) / r.length;
}
function committeeScore(state, id) {
	const t = state.teams[id];
	const conf = CONFERENCES.find((c) => c.id === t.conference);
	const games = state.results.filter((r) => r.homeId === id || r.awayId === id);
	let sos = 0;
	let qw = 0;
	let bad = 0;
	for (const r of games) {
		const oid = r.homeId === id ? r.awayId : r.homeId;
		const o = state.teams[oid];
		if (!o) continue;
		sos += o.prestige + o.wins * .35;
		const won = r.homeId === id && r.homeScore > r.awayScore || r.awayId === id && r.awayScore > r.homeScore;
		if (won && (o.prestige >= 74 || o.wins >= 20)) qw++;
		if (!won && o.prestige < 56) bad++;
	}
	const sosAvg = games.length ? sos / games.length : t.prestige;
	return t.wins * 3.1 - t.losses * 2.5 + t.confW * .9 + t.prestige * .32 + (conf?.prestige ?? 50) * .22 + sosAvg * .5 + qw * 3.8 - bad * 4.5;
}
function rankTeams(state, score) {
	const sc = score ?? ((id) => committeeScore(state, id));
	return Object.values(state.teams).sort((a, b) => sc(b.id) - sc(a.id) || b.wins - a.wins);
}
function confOrder(state, conf) {
	return Object.values(state.teams).filter((t) => t.conference === conf).sort((a, b) => b.confW - a.confW || b.wins - a.wins || committeeScore(state, b.id) - committeeScore(state, a.id));
}
function playNeutral(state, homeId, awayId, week, kind, id, rng) {
	const edge = (ovr$1(state, homeId) - ovr$1(state, awayId)) / 4;
	let hs = clamp(Math.round(70 + edge + gaussian(rng) * 8), 48, 110);
	let as = clamp(Math.round(70 - edge + gaussian(rng) * 8), 48, 110);
	if (hs === as) hs += 1;
	const homeWin = hs > as;
	const boxes = estimateGameBoxes(hs, as, rng);
	const result = {
		id: `res-${id}`,
		slotId: id,
		homeId,
		awayId,
		homeScore: hs,
		awayScore: as,
		week,
		minutes: boxes.minutes,
		homeBox: boxes.home,
		awayBox: boxes.away
	};
	const teams = { ...state.teams };
	const bump = (tid, won) => {
		const t = { ...teams[tid] };
		if (won) t.wins++;
		else t.losses++;
		teams[tid] = t;
	};
	bump(homeId, homeWin);
	bump(awayId, !homeWin);
	const winner = TEAM_BY_ID[homeWin ? homeId : awayId];
	const loser = TEAM_BY_ID[homeWin ? awayId : homeId];
	const label = kind === "conf-tourney" ? "league tournament" : kind === "ncaa" ? "National" : kind === "nit" ? "Invite" : kind === "crown" ? "The Crown" : kind;
	return withNews({
		...state,
		teams,
		results: [...state.results, result]
	}, item(week, `${winner.name} ${homeWin ? hs : as}, ${loser.name} ${homeWin ? as : hs} (${label}).`));
}
function knockout(state, ids, rng) {
	let field = [...ids];
	let s = state;
	let n = 0;
	while (field.length > 1) {
		const next = [];
		for (let i = 0; i < field.length; i += 2) {
			const a = field[i];
			const b = field[i + 1];
			if (!b) {
				next.push(a);
				continue;
			}
			n++;
			s = playNeutral(s, a, b, s.week, "conf-tourney", `cpu-ct-${a}-${b}-${n}`, rng);
			const last = s.results[s.results.length - 1];
			next.push(last.homeScore > last.awayScore ? a : b);
		}
		field = next;
	}
	return {
		state: s,
		winner: field[0]
	};
}
function emptyBoard() {
	return {
		autos: {},
		ncaa: [],
		nit: [],
		crown: []
	};
}
function projectedField(state, score) {
	const autos = {};
	for (const c of CONFERENCES) {
		const lead = confOrder(state, c.id)[0];
		if (lead) autos[c.id] = lead.id;
	}
	return seedField(state, autos, score);
}
function seedField(state, autos, score) {
	const sc = score ?? ((id) => committeeScore(state, id));
	const autoIds = [...new Set(Object.values(autos))];
	const ranked = rankTeams(state, sc);
	const atLarge = ranked.filter((t) => !autoIds.includes(t.id)).slice(0, Math.max(0, 68 - autoIds.length));
	const autoTeams = ranked.filter((t) => autoIds.includes(t.id));
	const fieldIds = /* @__PURE__ */ new Set([...autoIds, ...atLarge.map((t) => t.id)]);
	const ordered = ranked.filter((t) => fieldIds.has(t.id));
	const worstAutos = [...autoTeams].sort((a, b) => sc(a.id) - sc(b.id)).slice(0, 4);
	const worstAl = [...atLarge].sort((a, b) => sc(a.id) - sc(b.id)).slice(0, 4);
	const playInSet = new Set([...worstAutos, ...worstAl].map((t) => t.id));
	const locked = ordered.filter((t) => !playInSet.has(t.id));
	const pathOf = (id) => autoIds.includes(id) ? "auto" : "at-large";
	const pair4 = (teams) => {
		const ids = teams.map((t) => t.id);
		if (ids.length >= 4) return [[ids[0], ids[3]], [ids[1], ids[2]]];
		if (ids.length >= 2) return [[ids[0], ids[1]]];
		return [];
	};
	const ff16 = pair4(worstAutos);
	const ff11 = pair4(worstAl);
	const slots = [];
	let li = 0;
	let n11 = 0;
	let n16 = 0;
	for (let i = 0; i < 64; i++) {
		const seed = Math.floor(i / 4) + 1;
		if (seed === 11 && n11 < ff11.length) slots.push({
			ids: ff11[n11++],
			playIn: true
		});
		else if (seed === 16 && n16 < ff16.length) slots.push({
			ids: ff16[n16++],
			playIn: true
		});
		else {
			const t = locked[li++];
			if (!t) continue;
			slots.push({
				ids: [t.id],
				playIn: false
			});
		}
	}
	const bids = [];
	slots.forEach((slot, i) => {
		const wave = Math.floor(i / 4);
		const pos = i % 4;
		const region = REGIONS[wave % 2 === 0 ? pos : 3 - pos];
		const seed = wave + 1;
		for (const id of slot.ids) bids.push({
			teamId: id,
			seed,
			region,
			path: pathOf(id),
			playIn: slot.playIn
		});
	});
	return bids;
}
function addSlot(week, homeId, awayId, kind, id) {
	return {
		id,
		week,
		homeId,
		awayId,
		site: "neutral",
		kind
	};
}
function ctPrefix(conf) {
	return `ct-${conf}-`;
}
function startUserTourney(state, rng) {
	const conf = state.teams[state.playerTeamId].conference;
	if (state.schedule.some((g) => g.kind === "conf-tourney" && g.id.startsWith(ctPrefix(conf)))) return advanceUserTourney(state);
	let field = confOrder(state, conf).map((t) => t.id);
	if (field.length > 8) field = field.slice(0, 8);
	if (field.length >= 8 && !field.includes(state.playerTeamId)) field = [...field.slice(0, 7), state.playerTeamId];
	if (field.length < 2) {
		const board = {
			...emptyBoard(),
			...state.selection,
			autos: {
				...state.selection?.autos,
				[conf]: field[0] ?? state.playerTeamId
			}
		};
		return {
			...state,
			selection: board
		};
	}
	const size = nextPow2(field.length);
	const week = Math.max(state.week + 1, 19);
	const slots = [];
	for (let i = 0; i < size / 2; i++) {
		const a = field[i];
		const b = field[size - 1 - i];
		if (!a || !b) continue;
		slots.push(addSlot(week, a, b, "conf-tourney", `${ctPrefix(conf)}${week}-${i}`));
	}
	if (!slots.length) {
		const { state: s, winner } = knockout(state, field, rng);
		const board = {
			...emptyBoard(),
			...s.selection,
			autos: {
				...s.selection?.autos,
				[conf]: winner
			},
			confTourney: winner
		};
		return {
			...s,
			selection: board
		};
	}
	const league = CONFERENCES.find((c) => c.id === conf)?.name ?? "League";
	return withNews({
		...state,
		phase: "conference",
		week,
		schedule: [...state.schedule, ...slots],
		recruitingHours: 10
	}, item(week, `${league} tournament is open.`));
}
function tourneySlotMap(state, conf) {
	let field = confOrder(state, conf).map((t) => t.id);
	if (field.length > 8) field = field.slice(0, 8);
	if (field.length >= 8 && !field.includes(state.playerTeamId) && state.schedule.some((g) => g.homeId === state.playerTeamId || g.awayId === state.playerTeamId)) field = [...field.slice(0, 7), state.playerTeamId];
	const map = /* @__PURE__ */ new Map();
	field.forEach((id, i) => map.set(i, id));
	const played = state.schedule.filter((g) => g.kind === "conf-tourney" && g.id.startsWith(ctPrefix(conf)) && g.resultId).sort((a, b) => a.week - b.week);
	for (const g of played) {
		const r = state.results.find((x) => x.id === g.resultId);
		if (!r) continue;
		const winner = r.homeScore > r.awayScore ? r.homeId : r.awayId;
		let hs = -1;
		let as = -1;
		for (const [slot, id] of map) {
			if (id === g.homeId) hs = slot;
			if (id === g.awayId) as = slot;
		}
		if (hs < 0 || as < 0) continue;
		map.set(Math.min(hs, as), winner);
		map.delete(Math.max(hs, as));
	}
	return map;
}
function advanceUserTourney(state) {
	const conf = state.teams[state.playerTeamId].conference;
	const open = state.schedule.filter((g) => g.kind === "conf-tourney" && g.id.startsWith(ctPrefix(conf)) && !g.resultId && !g.declined);
	if (open.length) return {
		...state,
		week: open[0].week,
		phase: "conference"
	};
	const map = tourneySlotMap(state, conf);
	const alive = [...map.entries()].sort((a, b) => a[0] - b[0]);
	if (alive.length <= 1) {
		const champ = alive[0]?.[1] ?? state.playerTeamId;
		const board = {
			...emptyBoard(),
			...state.selection,
			autos: {
				...state.selection?.autos,
				[conf]: champ
			},
			confTourney: champ
		};
		return {
			...state,
			selection: board
		};
	}
	const played = state.schedule.filter((g) => g.kind === "conf-tourney" && g.id.startsWith(ctPrefix(conf)) && g.resultId);
	const week = (played.length ? Math.max(...played.map((g) => g.week)) : state.week) + 1;
	const rs = nextPow2(alive.length);
	const slots = [];
	for (let i = 0; i < rs / 2; i++) {
		const a = map.get(i);
		const b = map.get(rs - 1 - i);
		if (!a || !b) continue;
		slots.push(addSlot(week, a, b, "conf-tourney", `${ctPrefix(conf)}${week}-${i}`));
	}
	if (!slots.length) {
		const champ = alive[0][1];
		const board = {
			...emptyBoard(),
			...state.selection,
			autos: {
				...state.selection?.autos,
				[conf]: champ
			},
			confTourney: champ
		};
		return {
			...state,
			selection: board
		};
	}
	return {
		...state,
		phase: "conference",
		week,
		schedule: [...state.schedule, ...slots]
	};
}
function selectionSunday(state) {
	const ncaa = seedField(state, state.selection?.autos ?? {});
	const inNcaa = new Set(ncaa.map((b) => b.teamId));
	const rest = rankTeams(state).filter((t) => !inNcaa.has(t.id));
	const nit = rest.slice(0, 32).map((t) => t.id);
	const crown = rest.slice(32, 48).map((t) => t.id);
	const board = {
		...emptyBoard(),
		...state.selection,
		ncaa,
		nit,
		crown,
		revealed: false
	};
	return withNews({
		...state,
		selection: board,
		phase: "selection"
	}, item(state.week, "Selection Day. The committee has set the field of 68.", "even"), item(state.week, `68 in the National. ${Object.keys(board.autos).length} auto bids, ${ncaa.filter((b) => b.path === "at-large").length} at-large.`));
}
function revealSelection(state) {
	const sel = state.selection;
	if (!sel?.ncaa.length) return state;
	if (sel.revealed) return {
		...state,
		selection: {
			...sel,
			revealed: true
		}
	};
	const you = sel.ncaa.find((b) => b.teamId === state.playerTeamId);
	const youNit = sel.nit.includes(state.playerTeamId);
	const youCrown = sel.crown.includes(state.playerTeamId);
	const path = you ? `${you.seed} seed, ${you.region}, ${you.path === "auto" ? "auto bid" : "at-large"}${you.playIn ? ", Play-in" : ""}` : youNit ? "The Invite" : youCrown ? "The Crown" : "home for March";
	const tone = you ? "good" : youNit || youCrown ? "even" : "bad";
	return withNews({
		...state,
		selection: {
			...sel,
			revealed: true
		}
	}, item(state.week, `Selection Day: ${TEAM_BY_ID[state.playerTeamId]?.name} — ${path}.`, tone));
}
function startNcaa(state) {
	const ncaa = state.selection?.ncaa ?? [];
	const week = Math.max(state.week + 1, 22);
	const groups = /* @__PURE__ */ new Map();
	for (const b of ncaa.filter((x) => x.playIn)) {
		const key = `${b.region}-${b.seed}`;
		const list = groups.get(key) ?? [];
		list.push(b);
		groups.set(key, list);
	}
	const slots = [];
	for (const [key, teams] of groups) {
		if (teams.length < 2) continue;
		slots.push(addSlot(week, teams[0].teamId, teams[1].teamId, "ncaa", `ncaa-ff-${key}`));
	}
	if (!slots.length) return buildRound64(state, ncaa, week);
	return {
		...state,
		phase: "ncaa",
		week,
		schedule: [...state.schedule, ...slots]
	};
}
function buildRound64(state, ncaa, week) {
	const ff = state.schedule.filter((g) => g.id.startsWith("ncaa-ff-") && g.resultId);
	const out = /* @__PURE__ */ new Set();
	for (const g of ff) {
		const r = state.results.find((x) => x.id === g.resultId);
		if (!r) continue;
		out.add(r.homeScore > r.awayScore ? r.awayId : r.homeId);
	}
	const alive = ncaa.filter((b) => !out.has(b.teamId));
	const slots = [];
	for (const region of REGIONS) {
		const bySeed = /* @__PURE__ */ new Map();
		for (const b of alive.filter((x) => x.region === region)) if (!bySeed.has(b.seed)) bySeed.set(b.seed, b.teamId);
		PAIR_64.forEach(([hi, lo]) => {
			const a = bySeed.get(hi);
			const b = bySeed.get(lo);
			if (!a || !b) return;
			slots.push(addSlot(week, a, b, "ncaa", `ncaa-64-${region}-${hi}`));
		});
	}
	return {
		...state,
		phase: "ncaa",
		week,
		schedule: [...state.schedule, ...slots]
	};
}
function ncaaOpen(state) {
	return state.schedule.filter((g) => g.kind === "ncaa" && !g.resultId && !g.declined);
}
function winnersOfPrefix(state, prefix) {
	return state.schedule.filter((g) => g.id.startsWith(prefix) && g.resultId).map((g) => {
		const r = state.results.find((x) => x.id === g.resultId);
		return r.homeScore > r.awayScore ? r.homeId : r.awayId;
	});
}
function advanceNcaa(state) {
	const open = ncaaOpen(state);
	if (open.length) return {
		...state,
		week: open[0].week,
		phase: "ncaa"
	};
	if (state.schedule.some((g) => g.id.startsWith("ncaa-ff-")) && !state.schedule.some((g) => g.id.startsWith("ncaa-64-"))) return buildRound64(state, state.selection?.ncaa ?? [], state.week + 1);
	for (const r of [
		{
			prefix: "ncaa-64-",
			next: "ncaa-32-",
			need: 32
		},
		{
			prefix: "ncaa-32-",
			next: "ncaa-16-",
			need: 16
		},
		{
			prefix: "ncaa-16-",
			next: "ncaa-8-",
			need: 8
		},
		{
			prefix: "ncaa-8-",
			next: "ncaa-f4-",
			need: 4
		},
		{
			prefix: "ncaa-f4-",
			next: "ncaa-title-",
			need: 2
		}
	]) {
		const played = state.schedule.filter((g) => g.id.startsWith(r.prefix) && g.resultId);
		if (!played.length || played.length < r.need || state.schedule.some((g) => g.id.startsWith(r.next))) continue;
		const winners = winnersOfPrefix(state, r.prefix);
		const week = state.week + 1;
		const slots = [];
		for (let i = 0; i < winners.length; i += 2) {
			const a = winners[i];
			const b = winners[i + 1];
			if (!a || !b) continue;
			slots.push(addSlot(week, a, b, "ncaa", `${r.next}${i}`));
		}
		if (!slots.length) continue;
		return {
			...state,
			phase: "ncaa",
			week,
			schedule: [...state.schedule, ...slots]
		};
	}
	const title = state.schedule.find((g) => g.id.startsWith("ncaa-title-") && g.resultId);
	if (title) {
		const r = state.results.find((x) => x.id === title.resultId);
		const champ = r.homeScore > r.awayScore ? r.homeId : r.awayId;
		const board = {
			...emptyBoard(),
			...state.selection,
			champ
		};
		const tone = champ === state.playerTeamId ? "good" : "even";
		return startNit(withNews({
			...state,
			selection: board
		}, item(state.week, `${TEAM_BY_ID[champ]?.name} wins the National Tournament.`, tone)));
	}
	return startNit(state);
}
function startNit(state) {
	const nit = state.selection?.nit ?? [];
	if (!nit.length) return startCrown(state);
	if (state.schedule.some((g) => g.kind === "nit")) return advanceKo(state, "nit", [
		"nit-32-",
		"nit-16-",
		"nit-8-",
		"nit-4-",
		"nit-title-"
	]);
	const week = state.week + 1;
	const slots = [];
	for (let i = 0; i + 1 < nit.length; i += 2) slots.push(addSlot(week, nit[i], nit[i + 1], "nit", `nit-32-${i}`));
	return withNews({
		...state,
		phase: "nit",
		week,
		schedule: [...state.schedule, ...slots]
	}, item(week, "The Invite field is set."));
}
function advanceKo(state, kind, prefixes) {
	if (!state.schedule.some((g) => g.kind === kind)) return kind === "nit" ? startNit(state) : startCrown(state);
	const open = state.schedule.filter((g) => g.kind === kind && !g.resultId && !g.declined);
	if (open.length) return {
		...state,
		week: open[0].week,
		phase: kind
	};
	for (let i = 0; i < prefixes.length - 1; i++) {
		const cur = prefixes[i];
		const next = prefixes[i + 1];
		if (!state.schedule.filter((g) => g.id.startsWith(cur) && g.resultId).length || state.schedule.some((g) => g.id.startsWith(next))) continue;
		const winners = winnersOfPrefix(state, cur);
		if (winners.length < 2) continue;
		const week = state.week + 1;
		const slots = [];
		for (let j = 0; j < winners.length; j += 2) {
			if (!winners[j + 1]) continue;
			slots.push(addSlot(week, winners[j], winners[j + 1], kind, `${next}${j}`));
		}
		if (slots.length) return {
			...state,
			phase: kind,
			week,
			schedule: [...state.schedule, ...slots]
		};
	}
	const last = prefixes[prefixes.length - 1];
	const final = state.schedule.find((g) => g.id.startsWith(last) && g.resultId);
	if (final) {
		const r = state.results.find((x) => x.id === final.resultId);
		const champ = r.homeScore > r.awayScore ? r.homeId : r.awayId;
		const board = {
			...emptyBoard(),
			...state.selection
		};
		if (kind === "nit") board.nitChamp = champ;
		else board.crownChamp = champ;
		const label = kind === "nit" ? "Invite" : "The Crown";
		const tone = champ === state.playerTeamId ? "good" : "even";
		const next = withNews({
			...state,
			selection: board
		}, item(state.week, `${TEAM_BY_ID[champ]?.name} wins the ${label}.`, tone));
		return kind === "nit" ? startCrown(next) : enterOffseason(next);
	}
	return kind === "nit" ? startCrown(state) : enterOffseason(state);
}
function startCrown(state) {
	const crown = state.selection?.crown ?? [];
	if (!crown.length) return enterOffseason(state);
	if (state.schedule.some((g) => g.kind === "crown")) return advanceKo(state, "crown", [
		"crown-16-",
		"crown-8-",
		"crown-4-",
		"crown-title-"
	]);
	const week = state.week + 1;
	const slots = [];
	for (let i = 0; i + 1 < Math.min(16, crown.length); i += 2) slots.push(addSlot(week, crown[i], crown[i + 1], "crown", `crown-16-${i}`));
	return withNews({
		...state,
		phase: "crown",
		week,
		schedule: [...state.schedule, ...slots]
	}, item(week, "The Crown field is set."));
}
function continuePostseason(state) {
	const leftover = state.schedule.filter((g) => !g.resultId && !g.declined);
	if (leftover.length) {
		const next = leftover.sort((a, b) => a.week - b.week)[0];
		const phase = next.kind === "conf-tourney" ? "conference" : next.kind === "ncaa" ? "ncaa" : next.kind === "nit" ? "nit" : next.kind === "crown" ? "crown" : state.phase;
		return {
			...state,
			week: next.week,
			phase
		};
	}
	const rng = mulberry32(state.seed ^ state.season * 9091 ^ state.results.length);
	const userConf = state.teams[state.playerTeamId].conference;
	let s = state;
	let board = {
		...emptyBoard(),
		...s.selection
	};
	for (const c of CONFERENCES) {
		if (c.id === userConf || board.autos[c.id]) continue;
		const field = confOrder(s, c.id).map((t) => t.id);
		if (!field.length) continue;
		const cut = field.length > 8 ? field.slice(0, 8) : field;
		const k = knockout(s, cut, rng);
		s = k.state;
		board = {
			...emptyBoard(),
			...s.selection,
			autos: {
				...board.autos,
				...s.selection?.autos,
				[c.id]: k.winner
			}
		};
		s = {
			...s,
			selection: board
		};
	}
	if (!board.autos[userConf]) {
		s = s.schedule.some((g) => g.kind === "conf-tourney" && g.id.startsWith(ctPrefix(userConf))) ? advanceUserTourney(s) : startUserTourney(s, rng);
		board = {
			...emptyBoard(),
			...s.selection
		};
		if (!board.autos[userConf]) return s;
	}
	if (!board.ncaa.length) return selectionSunday(s);
	if (s.phase === "selection") return startNcaa(revealSelection(s));
	if (!s.selection?.champ) return advanceNcaa(s);
	if (!s.selection?.nitChamp && (s.selection?.nit.length ?? 0) > 0) return advanceKo(s, "nit", [
		"nit-32-",
		"nit-16-",
		"nit-8-",
		"nit-4-",
		"nit-title-"
	]);
	if (!s.selection?.crownChamp && (s.selection?.crown.length ?? 0) > 0) return advanceKo(s, "crown", [
		"crown-16-",
		"crown-8-",
		"crown-4-",
		"crown-title-"
	]);
	return enterOffseason(s);
}
//#endregion
//#region src/game/engine.ts
var LAST = [
	"Williams",
	"Johnson",
	"Brown",
	"Davis",
	"Miller",
	"Wilson",
	"Moore",
	"Taylor",
	"Anderson",
	"Thomas",
	"Jackson",
	"White",
	"Harris",
	"Martin",
	"Thompson",
	"Garcia",
	"Clark",
	"Lewis",
	"Walker",
	"Young"
];
var FIRST = [
	"Jaylen",
	"Malik",
	"Cole",
	"Amari",
	"Tyler",
	"Isaiah",
	"Cam",
	"Devin",
	"Marcus",
	"Noah",
	"Liam",
	"Jalen",
	"Chris",
	"Anthony",
	"Miles",
	"Owen",
	"Ryan",
	"Kai",
	"Brandon",
	"Darius"
];
var MTES = [
	{
		id: "maui",
		name: "Island Classic",
		site: "Lahaina",
		week: 2,
		size: 8,
		minPrestige: 78
	},
	{
		id: "atlantis",
		name: "Coral Eight",
		site: "Paradise Island",
		week: 2,
		size: 8,
		minPrestige: 76
	},
	{
		id: "charleston",
		name: "Harbor Classic",
		site: "Charleston",
		week: 2,
		size: 8,
		minPrestige: 64
	},
	{
		id: "players-era",
		name: "Desert Festival",
		site: "Las Vegas",
		week: 3,
		size: 8,
		minPrestige: 80
	},
	{
		id: "empire",
		name: "Garden Classic",
		site: "New York",
		week: 2,
		size: 4,
		minPrestige: 72
	},
	{
		id: "legends",
		name: "Borough Classic",
		site: "Brooklyn",
		week: 2,
		size: 4,
		minPrestige: 70
	},
	{
		id: "fort-myers",
		name: "Gulf Tip-Off",
		site: "Fort Myers",
		week: 2,
		size: 4,
		minPrestige: 58
	},
	{
		id: "cancun",
		name: "Caribbean Challenge",
		site: "Cancun",
		week: 3,
		size: 4,
		minPrestige: 62
	},
	{
		id: "wooden",
		name: "Westwood Legacy",
		site: "Anaheim",
		week: 3,
		size: 4,
		minPrestige: 68
	},
	{
		id: "emerald",
		name: "Coast Classic",
		site: "Niceville",
		week: 3,
		size: 4,
		minPrestige: 56
	},
	{
		id: "hof",
		name: "Memorial Classic",
		site: "Kansas City",
		week: 3,
		size: 4,
		minPrestige: 66
	},
	{
		id: "rainbow",
		name: "Pacific Classic",
		site: "Honolulu",
		week: 1,
		size: 4,
		minPrestige: 60
	},
	{
		id: "cleveland",
		name: "Lakefront Classic",
		site: "Cleveland",
		week: 2,
		size: 4,
		minPrestige: 48
	},
	{
		id: "sunshine",
		name: "Citrus Slam",
		site: "Daytona Beach",
		week: 1,
		size: 4,
		minPrestige: 50
	}
];
function ovrOf(t, players) {
	const r = players.filter((p) => p.teamId === t.id).sort((a, b) => b.ovr - a.ovr).slice(0, 8);
	if (!r.length) return 70;
	return r.reduce((s, p) => s + p.ovr, 0) / r.length;
}
function rosterFor(seed, teamId, prestige) {
	const rng = mulberry32(seed ^ hashString(teamId));
	const out = [];
	for (let i = 0; i < 13; i++) {
		const pos = [
			"PG",
			"SG",
			"SF",
			"PF",
			"C"
		][i % 5];
		const ovr = clamp(Math.round(prestige * .55 + 28 + gaussian(rng) * 4 - i * .7), 52, 96);
		out.push(makePlayer({
			id: `${teamId}-p${i}`,
			first: pick(rng, FIRST),
			last: pick(rng, LAST),
			pos,
			year: 1 + i % 4,
			teamId,
			ovr,
			mpg: i < 5 ? 28 : i < 8 ? 18 : 8,
			rng
		}));
	}
	return out;
}
function roundRobinRounds(ids) {
	const teams = [...ids];
	if (teams.length % 2 === 1) teams.push("BYE");
	const n = teams.length;
	const half = n / 2;
	const arr = [...teams];
	const rounds = [];
	for (let r = 0; r < n - 1; r++) {
		const pairs = [];
		for (let i = 0; i < half; i++) {
			const a = arr[i];
			const b = arr[n - 1 - i];
			if (a !== "BYE" && b !== "BYE") pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
		}
		rounds.push(pairs);
		const last = arr.pop();
		arr.splice(1, 0, last);
	}
	return rounds;
}
function confSchedule(seed, _teams) {
	const rng = mulberry32(seed ^ 49407);
	const slots = [];
	let n = 0;
	const confWeeks = [];
	for (let w = 6; w <= 18; w++) confWeeks.push(w);
	for (const conf of CONFERENCES) {
		const members = TEAMS.filter((t) => t.conference === conf.id).map((t) => t.id);
		if (members.length < 2) continue;
		roundRobinRounds(members).forEach((pairs, r) => {
			const week = confWeeks[r % confWeeks.length];
			for (const [a, b] of pairs) {
				const homeFirst = rng() > .5;
				slots.push({
					id: `c${n++}`,
					week,
					homeId: homeFirst ? a : b,
					awayId: homeFirst ? b : a,
					site: "home",
					kind: "conference"
				});
			}
		});
	}
	return slots;
}
function isRegular(g) {
	return !g.declined && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte");
}
function teamGames(schedule, id) {
	return schedule.filter((g) => isRegular(g) && (g.homeId === id || g.awayId === id));
}
function weekLoad(schedule, id, week) {
	return teamGames(schedule, id).filter((g) => g.week === week).length;
}
function fillRegularSeason(state) {
	const rng = mulberry32(state.seed ^ state.season * 30 ^ 30);
	const slots = [...state.schedule];
	const ids = Object.keys(state.teams);
	let n = slots.length;
	const need = (id) => 30 - teamGames(slots, id).length;
	for (let pass = 0; pass < 40; pass++) {
		let added = 0;
		const short = ids.filter((id) => need(id) > 0).sort((a, b) => need(b) - need(a));
		for (const a of short) {
			if (need(a) <= 0) continue;
			const already = new Set(teamGames(slots, a).flatMap((g) => [g.homeId, g.awayId]));
			const candidates = short.filter((b) => b !== a && need(b) > 0 && !already.has(b));
			if (!candidates.length) continue;
			const pa = TEAM_BY_ID[a]?.prestige ?? 60;
			candidates.sort((x, y) => Math.abs((TEAM_BY_ID[x]?.prestige ?? 60) - pa) - Math.abs((TEAM_BY_ID[y]?.prestige ?? 60) - pa) || rng() - .5);
			let placed = false;
			for (const b of candidates.slice(0, 12)) {
				for (let w = 1; w <= 18; w++) {
					if (weekLoad(slots, a, w) >= 3 || weekLoad(slots, b, w) >= 3) continue;
					const homeFirst = rng() > .45;
					slots.push({
						id: `n${n++}`,
						week: w,
						homeId: homeFirst ? a : b,
						awayId: homeFirst ? b : a,
						site: "home",
						kind: "noncon"
					});
					added++;
					placed = true;
					break;
				}
				if (placed) break;
			}
		}
		if (!added) break;
	}
	return slots;
}
function coachName(identity) {
	return identityName(identity);
}
function newDynasty(teamId, seed, opts) {
	const identity = opts.identity ?? {
		first: "Coach",
		last: "Stone",
		age: 38,
		almaMaterId: teamId
	};
	const eraDecade = opts.eraDecade ?? null;
	const nilOn = eraDecade == null || eraDecade >= 2020;
	const teams = {};
	const players = [];
	for (const t of TEAMS) {
		teams[t.id] = {
			id: t.id,
			conference: t.conference,
			prestige: t.prestige,
			wins: 0,
			losses: 0,
			confW: 0,
			confL: 0,
			homeW: 0,
			homeL: 0,
			homeStreak: 0,
			coachName: t.id === teamId ? coachName(identity) : "Staff",
			allWins: 0,
			allLosses: 0
		};
		players.push(...rosterFor(seed, t.id, t.prestige));
	}
	const schedule = confSchedule(seed, teams);
	return {
		version: 13,
		seed,
		season: START_SEASON,
		week: 0,
		phase: "preseason",
		playerTeamId: teamId,
		teams,
		players,
		recruits: recruitsFor(seed, START_SEASON),
		schedule,
		results: [],
		mail: [],
		news: [{
			week: 0,
			text: `${START_SEASON} camp is open.`,
			tone: "even"
		}],
		identity,
		careerMode: opts.careerMode,
		eraDecade,
		nilCap: nilOn ? 100 : 0,
		donorMood: 58,
		adHeat: 55,
		fanMood: 60,
		scholarships: 13,
		recruitingHours: 10,
		cpuRecruit: true,
		pendingPresser: null,
		liveGame: null,
		lastPresserWeek: -1,
		recentQuestionIds: [],
		tutorialDone: false,
		coachSkills: { ...DEFAULT_COACH },
		skillPoints: 0,
		offseasonReport: null,
		history: emptyHistory(),
		selection: null
	};
}
function yourGames(state) {
	return state.schedule.filter((g) => g.homeId === state.playerTeamId || g.awayId === state.playerTeamId);
}
function gamesInWeek(state, week) {
	return yourGames(state).filter((g) => g.week === week && !g.declined);
}
function canAddGame(state, oppId, week, _site) {
	if (state.phase !== "preseason") return "Schedule is locked.";
	if (oppId === state.playerTeamId) return "That's you.";
	if (!TEAM_BY_ID[oppId]) return "No such school.";
	if (yourGames(state).filter((g) => !g.declined).length >= 30) return "Board is full.";
	if (gamesInWeek(state, week).length >= 3) return "Week is full.";
	if (yourGames(state).some((g) => !g.declined && (g.homeId === oppId || g.awayId === oppId))) return "Already on the board.";
	return null;
}
function addNonCon(state, oppId, week, site) {
	const err = canAddGame(state, oppId, week, site);
	if (err) return {
		state,
		feedback: {
			title: "Can't add",
			detail: err,
			parts: []
		}
	};
	const you = TEAM_BY_ID[state.playerTeamId];
	const opp = TEAM_BY_ID[oppId];
	const rng = mulberry32(state.seed ^ hashString(oppId) ^ week);
	const gap = opp.prestige - you.prestige;
	if (gap > 8 && rng() < Math.min(.72, .2 + gap / 40)) return {
		state: {
			...state,
			schedule: [...state.schedule, {
				id: `x${state.schedule.length}`,
				week,
				homeId: site === "away" ? oppId : state.playerTeamId,
				awayId: site === "away" ? state.playerTeamId : oppId,
				site,
				kind: "noncon",
				declined: true
			}]
		},
		feedback: {
			title: "They declined",
			detail: `${opp.name} passed. Prestige gap is ${gap}.`,
			parts: [{
				label: "Gap",
				delta: gap
			}]
		}
	};
	const homeId = site === "away" ? oppId : state.playerTeamId;
	const awayId = site === "away" ? state.playerTeamId : oppId;
	const slot = {
		id: `u${state.schedule.length}`,
		week,
		homeId,
		awayId,
		site: site === "neutral" ? "neutral" : "home",
		kind: "noncon"
	};
	return {
		state: {
			...state,
			schedule: [...state.schedule, slot]
		},
		feedback: {
			title: "Added",
			detail: `${opp.name} · week ${week}.`,
			parts: []
		}
	};
}
function dropGame(state, id) {
	if (state.phase !== "preseason") return state;
	return {
		...state,
		schedule: state.schedule.filter((g) => g.id !== id || g.kind === "conference")
	};
}
function joinMte(state, mteId) {
	const m = MTES.find((x) => x.id === mteId);
	if (!m) return {
		state,
		feedback: {
			title: "No event",
			detail: "",
			parts: []
		}
	};
	const you = state.teams[state.playerTeamId];
	if (you.prestige < m.minPrestige) return {
		state,
		feedback: {
			title: `${m.name} said no`,
			detail: `Need prestige ${m.minPrestige}. You are ${you.prestige}.`,
			parts: []
		}
	};
	if (yourGames(state).some((g) => g.kind === "mte" && g.id.startsWith(`mte-${m.id}`))) return {
		state,
		feedback: {
			title: "Already in",
			detail: `${m.name} is on the board.`,
			parts: []
		}
	};
	const games = m.size >= 8 ? 3 : 2;
	if (gamesInWeek(state, m.week).length + games > 3) return {
		state,
		feedback: {
			title: "Week is full",
			detail: `Week ${m.week} cannot take ${games} more.`,
			parts: []
		}
	};
	const rng = mulberry32(state.seed ^ hashString(m.id) ^ state.season);
	const pool = TEAMS.filter((t) => t.id !== state.playerTeamId && t.prestige >= m.minPrestige - 8).sort((a, b) => Math.abs(a.prestige - you.prestige) - Math.abs(b.prestige - you.prestige) || rng() - .5).slice(0, 24);
	const taken = new Set(yourGames(state).flatMap((g) => [g.homeId, g.awayId]));
	const opps = [];
	for (const t of pool) {
		if (opps.length >= games) break;
		if (taken.has(t.id)) continue;
		opps.push(t.id);
	}
	if (opps.length < games) return {
		state,
		feedback: {
			title: "Field is thin",
			detail: "Not enough schools for that field.",
			parts: []
		}
	};
	const slots = opps.map((id, i) => ({
		id: `mte-${m.id}-${i}`,
		week: m.week,
		homeId: state.playerTeamId,
		awayId: id,
		site: "neutral",
		kind: "mte"
	}));
	return {
		state: {
			...state,
			schedule: [...state.schedule, ...slots]
		},
		feedback: {
			title: `In the ${m.name}`,
			detail: `${games} games, week ${m.week}, ${m.site}.`,
			parts: [{
				label: "Games",
				delta: games
			}]
		}
	};
}
function lockSchedule(state) {
	if (state.phase !== "preseason") return state;
	const schedule = fillRegularSeason(state);
	return {
		...state,
		schedule,
		phase: "regular",
		week: 1,
		recruitingHours: 10,
		news: [{
			week: 1,
			text: `${state.season} is underway.`,
			tone: "even"
		}, ...state.news].slice(0, 80)
	};
}
function newsFor(state, slot, result) {
	const hw = result.homeScore > result.awayScore;
	const winner = TEAM_BY_ID[hw ? result.homeId : result.awayId]?.name ?? "";
	const loser = TEAM_BY_ID[hw ? result.awayId : result.homeId]?.name ?? "";
	const hs = hw ? result.homeScore : result.awayScore;
	const ls = hw ? result.awayScore : result.homeScore;
	const tone = slot.homeId === state.playerTeamId || slot.awayId === state.playerTeamId ? (hw ? slot.homeId : slot.awayId) === state.playerTeamId ? "good" : "bad" : "even";
	return {
		...state,
		news: [{
			week: result.week,
			text: `${winner} ${hs}, ${loser} ${ls}.`,
			tone
		}, ...state.news].slice(0, 80)
	};
}
function bumpMinutes(state, teamId) {
	return state.players.map((p) => {
		if (p.teamId !== teamId) return p;
		const add = Math.max(0, Math.round(p.mpg));
		return {
			...p,
			seasonMinutes: (p.seasonMinutes ?? 0) + add,
			seasonGames: (p.seasonGames ?? 0) + 1
		};
	});
}
function simSlot(state, slot, rng, forced) {
	let hs;
	let as;
	if (forced) {
		hs = forced.homeScore;
		as = forced.awayScore;
	} else {
		const home = state.teams[slot.homeId];
		const away = state.teams[slot.awayId];
		let hEdge = (ovrOf(home, state.players) - ovrOf(away, state.players)) / 4;
		if (slot.site === "home") hEdge += 1.4;
		if (slot.homeId === state.playerTeamId || slot.awayId === state.playerTeamId) {
			const youHome = slot.homeId === state.playerTeamId;
			const off = ((state.coachSkills?.offense ?? 48) - 50) / 18;
			const def = ((state.coachSkills?.defense ?? 48) - 50) / 18;
			hEdge += youHome ? off + def : -(off + def);
		}
		const homeScore = clamp(Math.round(71 + hEdge + gaussian(rng) * 8), 48, 112);
		const awayScore = clamp(Math.round(71 - hEdge + gaussian(rng) * 8), 48, 112);
		const homeWin = homeScore === awayScore ? rng() > .5 : homeScore > awayScore;
		hs = homeWin ? Math.max(homeScore, awayScore + 1) : Math.min(homeScore, awayScore - 1);
		as = homeWin ? Math.min(awayScore, hs - 1) : Math.max(awayScore, hs + 1);
	}
	const boxes = forced?.homeBox && forced.awayBox ? {
		home: forced.homeBox,
		away: forced.awayBox,
		minutes: forced.minutes ?? 40
	} : estimateGameBoxes(hs, as, rng);
	const homeWin = hs > as;
	const result = {
		id: `res-${slot.id}`,
		slotId: slot.id,
		homeId: slot.homeId,
		awayId: slot.awayId,
		homeScore: hs,
		awayScore: as,
		week: slot.week,
		minutes: boxes.minutes,
		homeBox: boxes.home,
		awayBox: boxes.away
	};
	const nextTeams = { ...state.teams };
	const apply = (id, won, homeGame) => {
		const t = { ...nextTeams[id] };
		if (won) t.wins++;
		else t.losses++;
		if (slot.kind === "conference") {
			if (won) t.confW++;
			else t.confL++;
		}
		if (homeGame) {
			if (won) {
				t.homeW++;
				t.homeStreak = Math.max(0, t.homeStreak) + 1;
			} else {
				t.homeL++;
				t.homeStreak = Math.min(0, t.homeStreak) - 1;
			}
		}
		nextTeams[id] = t;
	};
	apply(slot.homeId, homeWin, slot.site === "home");
	apply(slot.awayId, !homeWin, false);
	const youIn = slot.homeId === state.playerTeamId || slot.awayId === state.playerTeamId;
	let players = state.players;
	if (youIn) players = bumpMinutes({
		...state,
		players
	}, state.playerTeamId);
	let next = newsFor({
		...state,
		teams: nextTeams,
		players,
		results: [...state.results, result],
		schedule: state.schedule.map((g) => g.id === slot.id ? {
			...g,
			resultId: result.id
		} : g),
		liveGame: state.liveGame?.slotId === slot.id ? null : state.liveGame
	}, slot, result);
	if (youIn) {
		const ctx = gameCtx(next, slot.id);
		if (ctx) {
			next = {
				...next,
				mail: afterGameMail(next, ctx)
			};
			const prng = mulberry32(next.seed ^ hashString(slot.id) ^ 81);
			if (ctx && shouldHoldPresser(next, ctx, prng)) {
				const presser = buildPresser(next, slot.id);
				if (presser) next = {
					...next,
					pendingPresser: presser,
					recentQuestionIds: rememberQuestions(next, presser)
				};
			}
		}
	}
	return next;
}
function closeLive(state) {
	const live = state.liveGame;
	if (!live) return state;
	const slot = state.schedule.find((g) => g.id === live.slotId);
	if (!slot) return {
		...state,
		liveGame: null
	};
	const rng = mulberry32(state.seed ^ hashString(slot.id) ^ 17);
	const boxes = boxFromLive(live);
	return simSlot(state, slot, rng, {
		homeScore: live.homeScore,
		awayScore: live.awayScore,
		homeBox: boxes.home,
		awayBox: boxes.away,
		minutes: boxes.minutes
	});
}
function beginLiveGame(state) {
	return startLiveGame(state);
}
function runLivePossession(state) {
	const next = stepLive(state);
	if (next.liveGame?.done) return closeLive(next);
	return next;
}
function runLiveRest(state) {
	const next = simRestLive(state);
	if (next.liveGame?.done) return closeLive(next);
	return next;
}
function openThisWeek(state) {
	return state.schedule.filter((g) => !g.resultId && !g.declined && g.week === state.week);
}
function regularLeft(state) {
	return state.schedule.some((g) => isRegular(g) && !g.resultId);
}
function simGame(state) {
	if (state.liveGame && !state.liveGame.done) return runLiveRest(state);
	if (state.liveGame?.done) state = closeLive(state);
	const next = yourGames(state).filter((g) => !g.resultId && !g.declined).sort((a, b) => a.week - b.week)[0];
	if (!next) {
		if (state.phase === "regular" && !regularLeft(state)) return continuePostseason({
			...state,
			phase: "conference"
		});
		if (state.phase !== "regular" && state.phase !== "preseason" && state.phase !== "offseason") return continuePostseason(state);
		return state;
	}
	const rng = mulberry32(state.seed ^ hashString(next.id) ^ state.results.length);
	let s = simSlot({
		...state,
		week: next.week
	}, next, rng);
	if (s.phase === "regular") s = {
		...s,
		players: inSeasonGrowth(s, s.playerTeamId, rng)
	};
	return s;
}
function simWeek(state) {
	if (state.phase === "preseason") return lockSchedule(state);
	if (state.phase === "offseason") return state;
	if (state.liveGame && !state.liveGame.done) state = runLiveRest(state);
	if (state.liveGame?.done) state = closeLive(state);
	let s = state;
	const rng = mulberry32(s.seed ^ s.week * 104729 ^ s.results.length);
	if (s.phase === "regular") {
		const open = openThisWeek(s);
		for (const g of open) {
			if (s.schedule.find((x) => x.id === g.id)?.resultId) continue;
			s = simSlot(s, g, rng);
		}
		s = {
			...s,
			players: inSeasonGrowth(s, s.playerTeamId, rng),
			recruitingHours: 10,
			mail: weeklyStakeholderMail(s, s.week)
		};
		s = cpuRecruitWeek(s, rng);
		if (!regularLeft(s)) return continuePostseason({
			...s,
			phase: "conference"
		});
		const later = s.schedule.filter((g) => isRegular(g) && !g.resultId).sort((a, b) => a.week - b.week)[0];
		return {
			...s,
			week: later ? later.week : s.week + 1,
			phase: "regular"
		};
	}
	const leftover = s.schedule.filter((g) => !g.resultId && !g.declined);
	if (leftover.length) {
		const week = leftover.sort((a, b) => a.week - b.week)[0].week;
		s = {
			...s,
			week
		};
		for (const g of leftover.filter((x) => x.week === week)) {
			if (s.schedule.find((x) => x.id === g.id)?.resultId) continue;
			s = simSlot(s, g, rng);
		}
	}
	return continuePostseason(s);
}
function cpuRecruitWeek(state, rng) {
	const recruits = state.recruits.map((r) => {
		if (r.committedTo) return r;
		const interest = { ...r.interest };
		for (const t of TEAMS) {
			if (rng() > .08) continue;
			const cur = interest[t.id] ?? 18;
			interest[t.id] = clamp(cur + randInt(rng, 1, 4) + (t.prestige > 80 ? 2 : 0), 0, 99);
		}
		let committedTo = r.committedTo;
		const best = Object.entries(interest).sort((a, b) => b[1] - a[1])[0];
		if (best && best[1] >= 88 && rng() < .12 && best[0] !== state.playerTeamId) committedTo = best[0];
		return {
			...r,
			interest,
			committedTo
		};
	});
	return {
		...state,
		recruits
	};
}
function goOffseason(state) {
	return enterOffseason(state);
}
function startNextSeason(state) {
	const rolled = nextSeason(state.phase === "offseason" ? state : enterOffseason(state));
	return {
		...rolled,
		schedule: confSchedule(rolled.seed ^ rolled.season, rolled.teams),
		week: 0,
		phase: "preseason",
		selection: null,
		recruitingHours: 10
	};
}
function interestIn(r, teamId) {
	if (r.committedTo === teamId) return 99;
	const base = r.interest[teamId] ?? 22;
	const offered = r.offers.includes(teamId) ? 8 : 0;
	const visited = r.visits.includes(teamId) ? 10 : 0;
	return clamp(base + offered + visited, 0, 99);
}
function scholarshipsLeft(state) {
	const offered = state.recruits.filter((r) => r.offers.includes(state.playerTeamId) && !r.committedTo).length;
	const committed = state.recruits.filter((r) => r.committedTo === state.playerTeamId).length;
	const roster = state.players.filter((p) => p.teamId === state.playerTeamId && p.year < 4).length;
	return Math.max(0, 13 - roster - committed - offered);
}
function spendHours(state, n) {
	if (state.recruitingHours < n) return null;
	return {
		...state,
		recruitingHours: state.recruitingHours - n
	};
}
function scoutRecruit(state, id) {
	const r = state.recruits.find((x) => x.id === id);
	if (!r) return {
		state,
		feedback: {
			title: "Gone",
			detail: "",
			parts: []
		}
	};
	if (r.scouted) return {
		state,
		feedback: {
			title: "Already scouted",
			detail: `${r.first} ${r.last}`,
			parts: []
		}
	};
	const paid = spendHours(state, 1);
	if (!paid) return {
		state,
		feedback: {
			title: "No hours",
			detail: "Wait until next week.",
			parts: []
		}
	};
	const rec = paid.recruitingHours;
	const recruits = paid.recruits.map((x) => x.id === id ? {
		...x,
		scouted: true,
		interest: {
			...x.interest,
			[state.playerTeamId]: clamp((x.interest[state.playerTeamId] ?? 22) + 3, 0, 99)
		}
	} : x);
	return {
		state: {
			...paid,
			recruitingHours: rec,
			recruits
		},
		feedback: {
			title: `Scouted ${r.first}`,
			detail: `Wants ${r.wants.style}.`,
			parts: [{
				label: "Hours",
				delta: -1
			}]
		}
	};
}
function offerRecruit(state, id) {
	const r = state.recruits.find((x) => x.id === id);
	if (!r) return {
		state,
		feedback: {
			title: "Gone",
			detail: "",
			parts: []
		}
	};
	if (r.offers.includes(state.playerTeamId)) return {
		state,
		feedback: {
			title: "Already offered",
			detail: `${r.first} ${r.last}`,
			parts: []
		}
	};
	if (scholarshipsLeft(state) <= 0) return {
		state,
		feedback: {
			title: "No scholarships",
			detail: "The paper stays in the drawer.",
			parts: []
		}
	};
	const paid = spendHours(state, 2);
	if (!paid) return {
		state,
		feedback: {
			title: "No hours",
			detail: "Wait until next week.",
			parts: []
		}
	};
	const bump = 10 + Math.round(((state.coachSkills?.recruiting ?? 50) - 50) / 8);
	const recruits = paid.recruits.map((x) => {
		if (x.id !== id) return x;
		const interest = {
			...x.interest,
			[state.playerTeamId]: clamp((x.interest[state.playerTeamId] ?? 22) + bump, 0, 99)
		};
		return {
			...x,
			offers: [...x.offers, state.playerTeamId],
			interest
		};
	});
	return {
		state: {
			...paid,
			recruits
		},
		feedback: {
			title: `Offered ${r.first} ${r.last}`,
			detail: "The scholarship is on the table.",
			parts: [{
				label: "Hours",
				delta: -2
			}]
		}
	};
}
function visitRecruit(state, id) {
	const r = state.recruits.find((x) => x.id === id);
	if (!r) return {
		state,
		feedback: {
			title: "Gone",
			detail: "",
			parts: []
		}
	};
	const paid = spendHours(state, 3);
	if (!paid) return {
		state,
		feedback: {
			title: "No hours",
			detail: "Wait until next week.",
			parts: []
		}
	};
	const bump = 8 + Math.round(((state.coachSkills?.recruiting ?? 50) - 50) / 10);
	const recruits = paid.recruits.map((x) => {
		if (x.id !== id) return x;
		const visits = x.visits.includes(state.playerTeamId) ? x.visits : [...x.visits, state.playerTeamId];
		const interest = {
			...x.interest,
			[state.playerTeamId]: clamp((x.interest[state.playerTeamId] ?? 22) + bump, 0, 99)
		};
		return {
			...x,
			visits,
			interest
		};
	});
	return {
		state: {
			...paid,
			recruits
		},
		feedback: {
			title: `Visited ${r.first}`,
			detail: "The living room meeting is done.",
			parts: [{
				label: "Hours",
				delta: -3
			}]
		}
	};
}
function pepTalk(state, id) {
	const p = state.players.find((x) => x.id === id);
	if (!p) return {
		state,
		feedback: {
			title: "Gone",
			detail: "",
			parts: []
		}
	};
	const bump = 6 + Math.round(((state.coachSkills?.leadership ?? 50) - 50) / 8);
	return {
		state: {
			...state,
			players: state.players.map((x) => x.id === id ? {
				...x,
				morale: clamp(x.morale + bump, 20, 99)
			} : x)
		},
		feedback: {
			title: `Check-in with ${p.first}`,
			detail: "Morale ticks up. Minutes still do the rest.",
			parts: [{
				label: "Morale",
				delta: bump
			}]
		}
	};
}
function unreadMail(state) {
	return state.mail.filter((m) => !m.read).length;
}
function markRead(state, id) {
	return {
		...state,
		mail: state.mail.map((m) => m.id === id ? {
			...m,
			read: true
		} : m)
	};
}
function answerPresser(state, id) {
	const p = state.pendingPresser;
	if (!p) return {
		state,
		feedback: {
			title: "No presser",
			detail: "",
			parts: []
		}
	};
	const q = p.questions[p.asked];
	const c = q?.choices.find((x) => x.id === id);
	if (!q || !c) return {
		state,
		feedback: {
			title: "Pick one",
			detail: "",
			parts: []
		}
	};
	const log = [...p.log, {
		question: q.prompt,
		answer: c.label,
		morale: c.morale,
		ad: c.ad,
		fans: c.fans
	}];
	const asked = p.asked + 1;
	const done = asked >= p.questions.length;
	let next = {
		...state,
		adHeat: clamp(state.adHeat + c.ad, 0, 100),
		fanMood: clamp(state.fanMood + c.fans, 0, 100),
		donorMood: clamp(state.donorMood + Math.round(c.ad * .35), 0, 100),
		players: state.players.map((pl) => pl.teamId === state.playerTeamId ? {
			...pl,
			morale: clamp(pl.morale + c.morale, 20, 99)
		} : pl),
		pendingPresser: done ? null : {
			...p,
			asked,
			log
		},
		lastPresserWeek: done ? state.week : state.lastPresserWeek
	};
	if (done) {
		const sumAd = log.reduce((n, x) => n + x.ad, 0);
		const sumFans = log.reduce((n, x) => n + x.fans, 0);
		const sumMorale = log.reduce((n, x) => n + x.morale, 0);
		next = {
			...next,
			mail: [presserFollowup(next, sumAd, sumFans, sumMorale), ...next.mail].slice(0, 40)
		};
	}
	return {
		state: next,
		feedback: {
			title: c.tone === "hot" ? "Said it" : "Noted",
			detail: c.label,
			parts: [{
				label: "AD",
				delta: c.ad
			}, {
				label: "Fans",
				delta: c.fans
			}]
		}
	};
}
function recordLine(t) {
	const career = (t.allWins ?? 0) + (t.allLosses ?? 0) > 0 ? ` · ${t.allWins}-${t.allLosses} all-time` : "";
	return `${t.wins}-${t.losses}${career}`;
}
//#endregion
//#region src/game/persist.ts
var KEY = "dribble-2026.save.v1";
var INDEX_KEY = "dribble-2026.slots.index";
var TUTORIAL_KEY = "dribble-2026.tutorial";
var cached;
function storage() {
	if (cached !== void 0) return cached;
	try {
		const s = window.localStorage;
		s.setItem("__d26", "1");
		s.removeItem("__d26");
		cached = s;
		return s;
	} catch {
		try {
			cached = window.sessionStorage;
			return cached;
		} catch {
			cached = null;
			return null;
		}
	}
}
function slotKey(id) {
	return `dribble-2026.slot.${id}`;
}
function readIndex() {
	try {
		const raw = storage()?.getItem(INDEX_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeIndex(list) {
	storage()?.setItem(INDEX_KEY, JSON.stringify(list));
}
function metaOf(state, id, name, auto) {
	const t = state.teams[state.playerTeamId];
	return {
		id,
		name,
		updatedAt: Date.now(),
		teamId: state.playerTeamId,
		season: state.season,
		wins: t?.wins ?? 0,
		losses: t?.losses ?? 0,
		coach: identityName(state.identity),
		auto
	};
}
function putSlot(id, name, state, auto) {
	const s = storage();
	if (!s) throw new Error("Storage is blocked on this device.");
	const payload = JSON.stringify({
		...state,
		version: 13
	});
	s.setItem(slotKey(id), payload);
	writeIndex([metaOf(state, id, name, auto), ...readIndex().filter((m) => m.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt));
}
function listSaves() {
	return readIndex().sort((a, b) => Number(b.auto) - Number(a.auto) || b.updatedAt - a.updatedAt);
}
function loadSave() {
	try {
		const raw = storage()?.getItem(KEY) ?? storage()?.getItem(slotKey("auto"));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.playerTeamId) return null;
		return hydrateState({
			...parsed,
			liveGame: parsed.liveGame ?? null,
			lastPresserWeek: parsed.lastPresserWeek ?? -9,
			recentQuestionIds: parsed.recentQuestionIds ?? []
		});
	} catch {
		return null;
	}
}
function loadSlot(id) {
	try {
		const raw = storage()?.getItem(slotKey(id)) ?? (id === "auto" ? storage()?.getItem(KEY) : null);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.playerTeamId) return null;
		return hydrateState({
			...parsed,
			liveGame: parsed.liveGame ?? null,
			lastPresserWeek: parsed.lastPresserWeek ?? -9,
			recentQuestionIds: parsed.recentQuestionIds ?? []
		});
	} catch {
		return null;
	}
}
function writeSave(state) {
	try {
		const s = storage();
		if (!s) return;
		const payload = JSON.stringify({
			...state,
			version: 13
		});
		s.setItem(KEY, payload);
		putSlot("auto", "Autosave", state, true);
	} catch {}
}
function saveNamed(state, name) {
	const label = name.trim() || `Season ${state.season}`;
	if (readIndex().filter((m) => !m.auto).length >= 8) return {
		ok: false,
		error: `Cap is 8 manual files. Delete one first.`
	};
	try {
		const id = `m-${Date.now().toString(36)}`;
		putSlot(id, label, state, false);
		return {
			ok: true,
			id
		};
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Couldn't write that file."
		};
	}
}
function deleteSlot(id) {
	try {
		if (id === "auto") return;
		storage()?.removeItem(slotKey(id));
		writeIndex(readIndex().filter((m) => m.id !== id));
	} catch {}
}
function tutorialDone() {
	try {
		return storage()?.getItem(TUTORIAL_KEY) === "1";
	} catch {
		return false;
	}
}
function setTutorialDone(done) {
	try {
		const s = storage();
		if (!s) return;
		if (done) s.setItem(TUTORIAL_KEY, "1");
		else s.removeItem(TUTORIAL_KEY);
	} catch {}
}
//#endregion
//#region src/game/store.ts
function persist(s) {
	writeSave(s);
}
function afterSimView(next) {
	if (next.pendingPresser) return "presser";
	if (next.phase === "selection" && !next.selection?.revealed) return "selection";
	if (next.phase === "selection") return "bracketology";
	return "hub";
}
function apply(get, set, next, extra) {
	persist(next);
	set({
		state: next,
		...extra
	});
}
var useGame = create((set, get) => ({
	hydrated: false,
	view: "title",
	state: null,
	selectedTeamId: null,
	selectMode: "dynasty",
	eraDecade: null,
	draftCoach: {
		first: "",
		last: "",
		age: 38,
		almaMaterId: ""
	},
	toast: null,
	feedback: null,
	starting: false,
	saves: [],
	hydrate: () => set({
		hydrated: true,
		saves: listSaves()
	}),
	refreshSaves: () => set({ saves: listSaves() }),
	setView: (view) => set({ view }),
	openSelect: (mode) => set({
		view: mode === "eras" ? "eras" : mode === "dynasty" ? "select" : "create",
		selectMode: mode,
		selectedTeamId: null,
		eraDecade: mode === "eras" ? get().eraDecade : null,
		toast: null,
		starting: false
	}),
	pickEra: (d) => set({
		eraDecade: d,
		selectMode: "eras",
		view: "create",
		selectedTeamId: null
	}),
	setDraftCoach: (p) => set({ draftCoach: {
		...get().draftCoach,
		...p
	} }),
	pickTeam: (id) => set({ selectedTeamId: id }),
	startDynasty: (teamId) => {
		if (get().starting) return;
		const school = TEAM_BY_ID[teamId];
		if (!school) return;
		const mode = get().selectMode;
		if (mode === "career" && !careerEligible(school)) {
			set({ toast: `Career starts at prestige 62 and under.` });
			return;
		}
		set({
			starting: true,
			selectedTeamId: teamId,
			toast: null
		});
		window.setTimeout(() => {
			try {
				const d = get().draftCoach;
				const identity = {
					first: d.first.trim() || "Coach",
					last: d.last.trim() || "Stone",
					age: Math.max(28, Math.min(64, d.age || 38)),
					almaMaterId: d.almaMaterId && TEAM_BY_ID[d.almaMaterId] ? d.almaMaterId : teamId
				};
				const state = newDynasty(teamId, (Date.now() ^ Math.random() * 1e9) >>> 0, {
					careerMode: mode === "career",
					identity,
					eraDecade: mode === "eras" ? get().eraDecade : null
				});
				persist(state);
				set({
					starting: false,
					state,
					view: tutorialDone() ? "schedule" : "tutorial",
					feedback: {
						title: `${identityName(identity)} at ${school.name}`,
						detail: identity.almaMaterId && identity.almaMaterId !== teamId ? `${TEAM_BY_ID[identity.almaMaterId]?.name} is still home. That job will reach further later.` : "Alma mater is this campus — they'll remember.",
						parts: [{
							label: "Prestige",
							delta: school.prestige
						}]
					}
				});
			} catch (e) {
				console.error(e);
				set({
					starting: false,
					toast: "Couldn't start that job."
				});
			}
		}, 40);
	},
	continueSave: () => {
		const state = loadSave();
		if (!state) {
			set({
				toast: "No save on this device.",
				saves: listSaves(),
				view: listSaves().length ? "saves" : "title"
			});
			return;
		}
		set({
			state,
			view: state.pendingPresser ? "presser" : state.phase === "selection" && !state.selection?.revealed ? "selection" : state.phase === "preseason" ? "schedule" : "hub",
			saves: listSaves()
		});
	},
	openSaves: () => set({
		view: "saves",
		saves: listSaves()
	}),
	saveNow: (name) => {
		const s = get().state;
		if (!s) {
			set({ toast: "Nothing to save yet." });
			return;
		}
		persist(s);
		const res = saveNamed(s, name ?? "");
		if (!res.ok) {
			set({
				toast: res.error ?? "Couldn't save.",
				saves: listSaves()
			});
			return;
		}
		set({
			saves: listSaves(),
			feedback: {
				title: "Saved",
				detail: name?.trim() ? `Wrote “${name.trim()}”.` : `Season ${s.season} is on this device.`,
				parts: [{
					label: "Files",
					delta: 1
				}]
			}
		});
	},
	loadFile: (id) => {
		const state = loadSlot(id);
		if (!state) {
			set({
				toast: "That file is gone.",
				saves: listSaves()
			});
			return;
		}
		set({
			state,
			view: state.pendingPresser ? "presser" : state.phase === "preseason" ? "schedule" : "hub",
			saves: listSaves(),
			toast: null
		});
	},
	dropFile: (id) => {
		deleteSlot(id);
		set({ saves: listSaves() });
	},
	leaveToTitle: () => {
		const s = get().state;
		if (s) persist(s);
		if (typeof window !== "undefined" && location.hash.startsWith("#hh-")) history.replaceState(null, "", `${location.pathname}${location.search}`);
		set({
			view: "title",
			state: null,
			starting: false,
			selectedTeamId: null,
			toast: null
		});
	},
	showTutorial: () => set({ view: "tutorial" }),
	skipTutorial: () => {
		setTutorialDone(true);
		const s = get().state;
		if (s) persist({
			...s,
			tutorialDone: true
		});
		set({
			view: "schedule",
			state: s ? {
				...s,
				tutorialDone: true
			} : s
		});
	},
	finishTutorial: () => {
		setTutorialDone(true);
		const s = get().state;
		if (s) persist({
			...s,
			tutorialDone: true
		});
		set({
			view: "hub",
			state: s ? {
				...s,
				tutorialDone: true
			} : s
		});
	},
	lock: () => {
		const s = get().state;
		if (!s) return;
		apply(get, set, lockSchedule(s), {
			view: "hub",
			feedback: {
				title: "Season is live",
				detail: "Weeks will move when you sim.",
				parts: []
			}
		});
	},
	addGame: (oppId, site, week) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = addNonCon(s, oppId, week, site);
		apply(get, set, state, { feedback });
	},
	drop: (id) => {
		const s = get().state;
		if (!s) return;
		apply(get, set, dropGame(s, id));
	},
	join: (mteId) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = joinMte(s, mteId);
		apply(get, set, state, { feedback });
	},
	simWeek: () => {
		const s = get().state;
		if (!s) return;
		if (s.phase === "selection" && !s.selection?.revealed) {
			set({ view: "selection" });
			return;
		}
		const next = simWeek(s);
		apply(get, set, next, { view: afterSimView(next) });
	},
	simGame: () => {
		const s = get().state;
		if (!s) return;
		if (s.phase === "selection" && !s.selection?.revealed) {
			set({ view: "selection" });
			return;
		}
		const next = simGame(s);
		apply(get, set, next, { view: afterSimView(next) });
	},
	playGame: () => {
		const s = get().state;
		if (!s) return;
		if (s.phase === "selection" && !s.selection?.revealed) {
			set({ view: "selection" });
			return;
		}
		if (s.phase === "preseason") {
			set({ toast: "Lock the schedule first." });
			return;
		}
		const next = beginLiveGame(s);
		if (!next) {
			set({ toast: "No game to play." });
			return;
		}
		apply(get, set, next, { view: "game" });
	},
	callOff: (id) => {
		const s = get().state;
		if (!s) return;
		apply(get, set, setLiveCall(s, "off", id));
	},
	callDef: (id) => {
		const s = get().state;
		if (!s) return;
		apply(get, set, setLiveCall(s, "def", id));
	},
	runPlay: () => {
		const s = get().state;
		if (!s) return;
		apply(get, set, runLivePossession(s), { view: "game" });
	},
	runCall: (side, id) => {
		const s = get().state;
		if (!s) return;
		apply(get, set, runLivePossession(setLiveCall(s, side, id)), { view: "game" });
	},
	simRest: () => {
		const s = get().state;
		if (!s) return;
		apply(get, set, runLiveRest(s), { view: "game" });
	},
	leaveGame: () => {
		const s = get().state;
		if (!s) return;
		const next = {
			...s,
			liveGame: s.liveGame?.done ? null : s.liveGame
		};
		apply(get, set, next, { view: afterSimView(next) });
	},
	finishSelectionShow: () => {
		const s = get().state;
		if (!s) return;
		apply(get, set, revealSelection(s), { view: "bracketology" });
	},
	scout: (id) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = scoutRecruit(s, id);
		apply(get, set, state, { feedback });
	},
	offer: (id) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = offerRecruit(s, id);
		apply(get, set, state, { feedback });
	},
	visit: (id) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = visitRecruit(s, id);
		apply(get, set, state, { feedback });
	},
	pep: (id) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = pepTalk(s, id);
		apply(get, set, state, { feedback });
	},
	bumpMinutes: (id, d) => {
		const s = get().state;
		if (!s) return;
		const p = s.players.find((x) => x.id === id);
		if (!p) return;
		apply(get, set, setPlayerMpg(s, id, p.mpg + d), { feedback: {
			title: `${p.first} minutes`,
			detail: `${Math.max(4, Math.min(36, p.mpg + d))} mpg. Playing time feeds development.`,
			parts: [{
				label: "MPG",
				delta: d
			}]
		} });
	},
	spendSkill: (axis) => {
		const s = get().state;
		if (!s) return;
		const { state, ok } = spendCoachPoint(s, axis);
		if (!ok) {
			set({ toast: s.skillPoints < 1 ? "No coaching points left." : "That skill is maxed." });
			return;
		}
		apply(get, set, state, { feedback: {
			title: "Skill spent",
			detail: "That point is on your tree now.",
			parts: [{
				label: axis,
				delta: 4
			}]
		} });
	},
	goOffseason: () => {
		const s = get().state;
		if (!s) return;
		apply(get, set, goOffseason(s), { view: "hub" });
	},
	nextSeason: () => {
		const s = get().state;
		if (!s) return;
		const next = startNextSeason(s);
		apply(get, set, next, {
			view: "schedule",
			feedback: {
				title: `${next.season} is open`,
				detail: next.offseasonReport?.incoming.length ? `${next.offseasonReport.incoming.map((x) => x.name).join(", ")} signed.` : "Build the schedule. Seniors are gone. The new class is on campus.",
				parts: [{
					label: "Season",
					delta: 1
				}]
			}
		});
	},
	answer: (id) => {
		const s = get().state;
		if (!s) return;
		const { state, feedback } = answerPresser(s, id);
		apply(get, set, state, {
			feedback,
			view: state.pendingPresser ? "presser" : "hub"
		});
	},
	readMail: (id) => {
		const s = get().state;
		if (!s) return;
		apply(get, set, markRead(s, id));
	},
	clearFeedback: () => set({ feedback: null }),
	clearToast: () => set({ toast: null })
}));
//#endregion
//#region src/components/ui/press-button.tsx
function PressButton({ onPress, className, children, disabled }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		disabled,
		className,
		onClick: onPress,
		children
	});
}
//#endregion
//#region src/components/game/title-flow.tsx
var ERAS = [
	{
		decade: 1960,
		kicker: "Westwood's decade",
		blurb: "Westwood owns March. No three-point line, no shot clock, no NIL. The lane belongs to the bigs, and most of the country still plays in regional leagues.",
		tags: [
			"No 3-point line",
			"No shot clock",
			"No NIL"
		]
	},
	{
		decade: 1970,
		kicker: "After the dynasty",
		blurb: "The last Westwood banners, then the field cracks open. Bloomington, Milwaukee, and the independents punch up. Still no threes and no player pay — just the paint and the whistle.",
		tags: [
			"No 3-point line",
			"No NIL",
			"Independents matter"
		]
	},
	{
		decade: 1980,
		kicker: "The arc arrives",
		blurb: "1986 paints the three-point line. The Eastern league goes prime time. The Strip, The Harbor, and Bloomington set the tone. NIL does not exist; TV money does.",
		tags: [
			"3s from 1986",
			"No NIL",
			"Big East rise"
		]
	},
	{
		decade: 1990,
		kicker: "The modern game",
		blurb: "Threes are standard. Durham, Lexington, The Strip, Ann Arbor. Recruiting is the whole job and the shoe companies already know your living room. Players still cannot be paid.",
		tags: [
			"3-point line",
			"No NIL",
			"Recruiting is king"
		]
	},
	{
		decade: 2e3,
		kicker: "One-and-done",
		blurb: "The NBA age rule turns rosters over every spring. Mid-majors steal March. Analytics creep onto the bench. NIL is still a rumor in the booster club.",
		tags: [
			"3-point line",
			"No NIL",
			"Freshman stars"
		]
	},
	{
		decade: 2010,
		kicker: "Portal years",
		blurb: "The three-point boom and the transfer portal (2018). Main Line, Grounds, Spokane. You develop or you reload. Pay-for-play is coming — it is not here yet.",
		tags: [
			"3-point line",
			"No NIL",
			"Transfer portal"
		]
	},
	{
		decade: 2020,
		kicker: "NIL and the carousel",
		blurb: "Name, image, and likeness is live. Conferences realign, the portal is a second recruiting season, and every AD has a donor on speed dial. This is the modern job.",
		tags: [
			"3-point line",
			"NIL is live",
			"Portal + realignment"
		]
	}
];
function eraMeta(decade) {
	return ERAS.find((e) => e.decade === decade) ?? null;
}
function TitleFlow() {
	const { view } = useGame();
	if (view === "create") return /* @__PURE__ */ jsx(CreateCoach, {});
	if (view === "select") return /* @__PURE__ */ jsx(TeamSelect, {});
	if (view === "eras") return /* @__PURE__ */ jsx(EraSelect, {});
	return /* @__PURE__ */ jsx(TitleScreen, {});
}
var BTN = "relative z-20 flex min-h-14 w-full items-center justify-center rounded-lg px-5 py-3.5 text-center text-base font-semibold no-underline";
function clearMenuHash() {
	if (typeof window === "undefined") return;
	if (location.hash.startsWith("#hh-")) history.replaceState(null, "", `${location.pathname}${location.search}`);
}
function TitleScreen() {
	const { openSelect, continueSave, openSaves, toast, saves } = useGame();
	const has = typeof window !== "undefined" && Boolean(loadSave());
	const files = saves.length > 0 || has;
	function menu(id) {
		if (id === "career") openSelect("career");
		else if (id === "dynasty") openSelect("dynasty");
		else if (id === "eras") openSelect("eras");
		else if (id === "continue") continueSave();
		else if (id === "saves") openSaves();
	}
	useEffect(() => {
		const apply = () => {
			const h = location.hash.replace(/^#/, "");
			const g = useGame.getState();
			if (h === "hh-career") g.openSelect("career");
			else if (h === "hh-dynasty") g.openSelect("dynasty");
			else if (h === "hh-eras") g.openSelect("eras");
			else if (h === "hh-continue") g.continueSave();
			else if (h === "hh-saves") g.openSaves();
		};
		window.addEventListener("hashchange", apply);
		return () => window.removeEventListener("hashchange", apply);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ jsx("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-0 bg-cover bg-center",
				style: { backgroundImage: "url(/title-bg.jpg)" }
			}),
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/80" }),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-[2] mx-auto flex min-h-dvh max-w-lg flex-col justify-start px-6 pt-12 pb-[calc(6rem+env(safe-area-inset-bottom)+var(--vv-bottom,0px))]",
				children: [
					/* @__PURE__ */ jsxs("h1", {
						className: "font-display text-[clamp(2.5rem,10vw,4rem)] leading-[0.9] font-medium",
						children: [
							"Dribble",
							/* @__PURE__ */ jsx("br", {}),
							"2026"
						]
					}),
					/* @__PURE__ */ jsxs("nav", {
						className: "relative z-20 mt-8 flex flex-col gap-3",
						"aria-label": "Main menu",
						children: [
							/* @__PURE__ */ jsx("a", {
								href: "#hh-career",
								className: `${BTN} bg-accent text-accent-fg`,
								onClick: () => menu("career"),
								children: "Career"
							}),
							/* @__PURE__ */ jsx("a", {
								href: "#hh-dynasty",
								className: `${BTN} bg-bg/80 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]`,
								onClick: () => menu("dynasty"),
								children: "Pick a school"
							}),
							/* @__PURE__ */ jsx("a", {
								href: "#hh-eras",
								className: `${BTN} bg-bg/80 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]`,
								onClick: () => menu("eras"),
								children: "Eras"
							}),
							has && /* @__PURE__ */ jsx("a", {
								href: "#hh-continue",
								className: `${BTN} bg-bg/80 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]`,
								onClick: () => menu("continue"),
								children: "Continue"
							}),
							files && /* @__PURE__ */ jsx("a", {
								href: "#hh-saves",
								className: `${BTN} bg-bg/80 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]`,
								onClick: () => menu("saves"),
								children: "Files"
							})
						]
					}),
					toast && /* @__PURE__ */ jsx("p", {
						className: "mt-3 text-sm text-loss",
						children: toast
					})
				]
			})
		]
	});
}
function EraSelect() {
	const { pickEra, setView } = useGame();
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-dvh bg-bg px-4 py-6 pb-[calc(4rem+env(safe-area-inset-bottom)+var(--vv-bottom,0px))] text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-xl",
			children: [
				/* @__PURE__ */ jsx(PressButton, {
					className: "min-h-11 text-xs tracking-[0.18em] text-muted uppercase",
					onPress: () => {
						if (location.hash.startsWith("#hh-")) history.replaceState(null, "", `${location.pathname}${location.search}`);
						setView("title");
					},
					children: "Back"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-1 text-4xl",
					children: "Eras"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted",
					children: "Pick a decade and walk into that version of college basketball. Rules, money, and the powers of the day follow the year you choose. Modern Career and Pick a school stay in today."
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "mt-6 flex flex-col gap-3",
					children: ERAS.map((era) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(PressButton, {
						onPress: () => pickEra(era.decade),
						className: "flex min-h-28 w-full touch-manipulation flex-col rounded-xl border border-border bg-elevated p-4 text-left",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "font-display text-3xl leading-none",
									children: [era.decade, "s"]
								}), /* @__PURE__ */ jsx("span", {
									className: "text-[11px] tracking-[0.14em] text-accent uppercase",
									children: era.kicker
								})]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "mt-2 text-sm leading-snug text-muted",
								children: era.blurb
							}),
							/* @__PURE__ */ jsx("span", {
								className: "mt-3 flex flex-wrap gap-1.5",
								children: era.tags.map((tag) => /* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold tracking-wide text-fg/80 uppercase",
									children: tag
								}, tag))
							})
						]
					}) }, era.decade))
				})
			]
		})
	});
}
function CreateCoach() {
	const { draftCoach, setDraftCoach, setView, selectMode, eraDecade } = useGame();
	const [q, setQ] = useState("");
	const alma = draftCoach.almaMaterId ? TEAM_BY_ID[draftCoach.almaMaterId] : null;
	const list = useMemo(() => {
		const query = q.trim().toLowerCase();
		if (!query) return [];
		return TEAMS.filter((t) => t.name.toLowerCase().includes(query) || t.city.toLowerCase().includes(query) || t.abbr.toLowerCase().includes(query)).slice(0, 12);
	}, [q]);
	const nextLabel = selectMode === "career" ? "Choose first job" : "Pick a school";
	const backTo = selectMode === "eras" ? "eras" : "title";
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-dvh bg-bg px-4 py-6 pb-16 text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-xl",
			children: [
				/* @__PURE__ */ jsx(PressButton, {
					className: "min-h-11 text-xs tracking-[0.18em] text-muted uppercase",
					onPress: () => {
						if (backTo === "title") clearMenuHash();
						setView(backTo);
					},
					children: "Back"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-1 text-4xl",
					children: "Create a coach"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted",
					children: selectMode === "career" ? "First jobs are lower-prestige schools. Name and alma mater are optional." : selectMode === "eras" && eraDecade ? `You'll walk into the ${eraDecade}s — ${eraMeta(eraDecade)?.kicker ?? "a different college game"}. Alma mater still pulls that program toward you.` : "Name, age, and alma mater. That school reaches further for you on the carousel."
				}),
				/* @__PURE__ */ jsx(PressButton, {
					className: "mt-5 min-h-14 w-full touch-manipulation rounded-lg bg-accent px-5 font-semibold text-accent-fg",
					onPress: () => setView("select"),
					children: nextLabel
				}),
				/* @__PURE__ */ jsx("label", {
					className: "mt-6 block text-[11px] tracking-[0.16em] text-subtle uppercase",
					children: "First name"
				}),
				/* @__PURE__ */ jsx("input", {
					className: "mt-2 h-12 w-full rounded-lg border border-border bg-elevated px-3 text-fg",
					value: draftCoach.first,
					onChange: (e) => setDraftCoach({ first: e.target.value.slice(0, 18) }),
					placeholder: "First"
				}),
				/* @__PURE__ */ jsx("label", {
					className: "mt-4 block text-[11px] tracking-[0.16em] text-subtle uppercase",
					children: "Last name"
				}),
				/* @__PURE__ */ jsx("input", {
					className: "mt-2 h-12 w-full rounded-lg border border-border bg-elevated px-3 text-fg",
					value: draftCoach.last,
					onChange: (e) => setDraftCoach({ last: e.target.value.slice(0, 20) }),
					placeholder: "Last"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 text-[11px] tracking-[0.16em] text-subtle uppercase",
					children: "Age"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-2 flex items-center gap-3",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "h-12 w-14 rounded-lg bg-elevated",
							onClick: () => setDraftCoach({ age: Math.max(28, draftCoach.age - 1) }),
							children: "−"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "font-display min-w-16 text-center text-3xl",
							children: draftCoach.age
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "h-12 w-14 rounded-lg bg-elevated",
							onClick: () => setDraftCoach({ age: Math.min(64, draftCoach.age + 1) }),
							children: "+"
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-6 text-[11px] tracking-[0.16em] text-subtle uppercase",
					children: "Alma mater"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: "Optional. Search to pick. They will reach further when that job opens."
				}),
				alma && /* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-accent",
					children: [
						alma.name,
						" · ",
						alma.mascot,
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "ml-3 text-xs text-muted underline",
							onClick: () => setDraftCoach({ almaMaterId: "" }),
							children: "Clear"
						})
					]
				}),
				/* @__PURE__ */ jsx("input", {
					className: "mt-2 h-12 w-full rounded-lg border border-border bg-elevated px-3 text-fg",
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search Kentucky, Gonzaga, Albany…"
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "mt-2",
					children: list.map((t) => /* @__PURE__ */ jsx("li", {
						className: "border-b border-border",
						children: /* @__PURE__ */ jsxs(PressButton, {
							onPress: () => {
								setDraftCoach({ almaMaterId: t.id });
								setQ("");
							},
							className: "flex min-h-14 w-full items-center gap-3 px-1 py-2 text-left",
							children: [/* @__PURE__ */ jsx("span", {
								className: "size-2.5 shrink-0 rounded-full",
								style: { background: t.color }
							}), /* @__PURE__ */ jsxs("span", {
								className: "flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block font-semibold",
									children: t.name
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-xs text-muted",
									children: [
										t.city,
										" · prestige ",
										t.prestige
									]
								})]
							})]
						})
					}, t.id))
				})
			]
		})
	});
}
function TeamSelect() {
	const { selectedTeamId, pickTeam, startDynasty, setView, selectMode, eraDecade, draftCoach, toast } = useGame();
	const career = selectMode === "career";
	const [q, setQ] = useState("");
	const [conf, setConf] = useState("ALL");
	const pool = career ? TEAMS.filter(careerEligible) : TEAMS;
	const list = useMemo(() => {
		const base = conf === "ALL" ? pool : pool.filter((t) => t.conference === conf);
		const query = q.trim().toLowerCase();
		return [...query ? base.filter((t) => t.name.toLowerCase().includes(query) || t.mascot.toLowerCase().includes(query) || t.city.toLowerCase().includes(query)) : base].sort((a, b) => a.prestige - b.prestige);
	}, [
		conf,
		q,
		pool
	]);
	const picked = selectedTeamId ? TEAM_BY_ID[selectedTeamId] : null;
	const alma = draftCoach.almaMaterId ? TEAM_BY_ID[draftCoach.almaMaterId] : null;
	const backTo = career || selectMode === "eras" ? "create" : "title";
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-dvh bg-bg px-4 py-6 pb-28 text-fg",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-xl",
			children: [
				/* @__PURE__ */ jsx(PressButton, {
					className: "min-h-11 text-xs tracking-[0.18em] text-muted uppercase",
					onPress: () => {
						if (backTo === "title") clearMenuHash();
						setView(backTo);
					},
					children: "Back"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-1 text-4xl",
					children: career ? "First job" : eraDecade ? `${eraDecade}s · ${eraMeta(eraDecade)?.kicker ?? "job"}` : "Take the job"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-2 text-sm text-muted",
					children: [career ? `Career opens at prestige 62 and under. ${pool.length} schools.` : eraDecade ? eraMeta(eraDecade)?.blurb ?? "Tap a school, then take the job." : "Tap a school, then take the job.", alma ? ` Alma mater: ${alma.name}.` : ""]
				}),
				!career && /* @__PURE__ */ jsx(PressButton, {
					className: "mt-2 min-h-11 text-sm text-accent underline",
					onPress: () => setView("create"),
					children: "Edit coach"
				}),
				toast && /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-loss",
					children: toast
				}),
				career && pool.length === 0 && /* @__PURE__ */ jsx("p", {
					className: "mt-4 text-sm text-loss",
					children: "No eligible jobs. Go back and pick a school instead."
				}),
				/* @__PURE__ */ jsx("input", {
					className: "mt-4 h-12 w-full rounded-lg border border-border bg-elevated px-3",
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search Albany, Vermont…"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex gap-2 overflow-x-auto pb-2",
					children: [/* @__PURE__ */ jsx(Chip, {
						on: conf === "ALL",
						onClick: () => setConf("ALL"),
						label: "All"
					}), CONFERENCES.filter((c) => pool.some((t) => t.conference === c.id)).map((c) => /* @__PURE__ */ jsx(Chip, {
						on: conf === c.id,
						onClick: () => setConf(c.id),
						label: c.short
					}, c.id))]
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "mt-2 space-y-2",
					children: list.slice(0, 40).map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(PressButton, {
						onPress: () => pickTeam(t.id),
						className: `flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${selectedTeamId === t.id ? "border-accent bg-elevated" : "border-border bg-elevated/60"}`,
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "size-3 shrink-0 rounded-full",
								style: { background: t.color }
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block font-semibold",
									children: t.name
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-xs text-muted",
									children: [
										t.mascot,
										" · ",
										t.city,
										" · ",
										t.prestige
									]
								})]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold tracking-wider text-accent uppercase",
								children: selectedTeamId === t.id ? "Selected" : "Pick"
							})
						]
					}) }, t.id))
				})
			]
		}), picked && /* @__PURE__ */ jsxs("div", {
			className: "fixed inset-x-4 top-[38%] z-40 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-border bg-elevated p-5 shadow-2xl",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-[11px] tracking-[0.16em] text-muted uppercase",
					children: career ? "Career" : "Dynasty"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "font-display mt-1 text-3xl",
					children: picked.name
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						picked.mascot,
						" · prestige ",
						picked.prestige
					]
				}),
				/* @__PURE__ */ jsx(PressButton, {
					className: "mt-4 min-h-14 w-full touch-manipulation rounded-lg bg-accent font-semibold text-accent-fg",
					onPress: () => startDynasty(picked.id),
					children: "Take this job"
				}),
				/* @__PURE__ */ jsx(PressButton, {
					className: "mt-2 min-h-11 w-full text-sm text-muted",
					onPress: () => pickTeam(null),
					children: "Pick a different school"
				})
			]
		})]
	});
}
function Chip({ on, onClick, label }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		className: `h-9 shrink-0 rounded-full px-3 text-sm font-semibold ${on ? "bg-accent text-accent-fg" : "bg-elevated text-fg"}`,
		children: label
	});
}
//#endregion
//#region src/lib/tap.ts
var lastAt = /* @__PURE__ */ new WeakMap();
var DUP_MS = 80;
function guard(el) {
	const now = performance.now();
	if (now - (lastAt.get(el) ?? 0) < DUP_MS) return false;
	lastAt.set(el, now);
	return true;
}
/** Visual press only. Never preventDefault — that ate menu taps on iPhone. */
function installIosTaps() {
	return () => {};
}
function bindTap(fn) {
	return { onClick: (e) => {
		e.stopPropagation();
		if (!guard(e.currentTarget)) return;
		fn();
	} };
}
//#endregion
//#region src/components/game/shell.tsx
var PRIMARY = [
	{
		id: "hub",
		label: "Office",
		icon: LayoutGrid
	},
	{
		id: "roster",
		label: "Roster",
		icon: Users
	},
	{
		id: "schedule",
		label: "Games",
		icon: CalendarDays
	},
	{
		id: "recruiting",
		label: "Recruit",
		icon: ClipboardList
	}
];
var MORE = [
	{
		id: "inbox",
		label: "Inbox",
		icon: Mail,
		hint: "AD and donor mail"
	},
	{
		id: "standings",
		label: "Ranks",
		icon: ListOrdered,
		hint: "Eval, Efficiency, Writers — every team"
	},
	{
		id: "bracketology",
		label: "Bracket",
		icon: Trophy,
		hint: "The Desk and Sunday Board"
	},
	{
		id: "news",
		label: "News",
		icon: Newspaper,
		hint: "National headlines"
	},
	{
		id: "saves",
		label: "Saves",
		icon: ClipboardList,
		hint: "Manual files and load"
	}
];
var MORE_VIEWS = /* @__PURE__ */ new Set([
	"inbox",
	"standings",
	"bracketology",
	"news",
	"bracket",
	"team",
	"saves",
	"selection"
]);
function Shell({ children }) {
	const { state, view, setView, leaveToTitle, showTutorial } = useGame();
	const [moreOpen, setMoreOpen] = useState(false);
	if (!state) return /* @__PURE__ */ jsx(Fragment$1, { children });
	const team = TEAM_BY_ID[state.playerTeamId];
	const rt = state.teams[state.playerTeamId];
	const unread = unreadMail(state);
	const moreOn = MORE_VIEWS.has(view);
	function go(id) {
		setMoreOpen(false);
		setView(id);
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-dvh w-full max-w-full flex-col overflow-x-clip bg-bg text-fg",
		children: [
			/* @__PURE__ */ jsx("header", {
				className: "chrome-header sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)]",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-5xl items-center gap-2 px-3 py-2",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "size-2.5 shrink-0 rounded-full",
							style: { background: team.color }
						}),
						/* @__PURE__ */ jsx("span", {
							className: "font-display min-w-0 flex-1 truncate text-lg",
							children: team.name
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "hidden text-xs text-muted tabular-nums sm:inline",
							children: [
								rt.wins,
								"-",
								rt.losses
							]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							"aria-label": unread ? `Inbox, ${unread} unread` : "Inbox",
							...bindTap(() => go("inbox")),
							className: "relative flex size-11 shrink-0 items-center justify-center rounded-lg text-fg",
							children: [/* @__PURE__ */ jsx(Mail, { className: "size-5" }), unread > 0 && /* @__PURE__ */ jsx("span", {
								className: "absolute top-1.5 right-1.5 min-w-4 rounded-full bg-loss px-1 text-center text-[10px] leading-4 font-bold text-fg",
								children: unread
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "min-h-11 shrink-0 px-2 text-xs text-muted",
							...bindTap(leaveToTitle),
							children: "Title"
						})
					]
				})
			}),
			/* @__PURE__ */ jsx("main", {
				className: "mx-auto min-w-0 w-full max-w-5xl flex-1 px-3 py-4 pb-[calc(var(--dock-h)+1.25rem)]",
				children
			}),
			moreOpen && /* @__PURE__ */ jsxs("div", {
				className: "fixed inset-0 z-50",
				role: "dialog",
				"aria-label": "More",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "absolute inset-x-0 top-0 bg-bg/70",
					style: { bottom: "var(--dock-h)" },
					"aria-label": "Close",
					...bindTap(() => setMoreOpen(false))
				}), /* @__PURE__ */ jsx("div", {
					className: "more-sheet",
					children: /* @__PURE__ */ jsxs("div", {
						className: "more-sheet-card",
						children: [/* @__PURE__ */ jsx("p", {
							className: "shrink-0 px-4 pt-3 pb-2 text-[11px] tracking-[0.16em] text-muted uppercase",
							children: "More"
						}), /* @__PURE__ */ jsxs("ul", {
							className: "more-sheet-list flex flex-col",
							children: [MORE.map((item) => {
								const Icon = item.icon;
								return /* @__PURE__ */ jsx("li", {
									className: "border-t border-border first:border-t-0",
									children: /* @__PURE__ */ jsxs("button", {
										type: "button",
										...bindTap(() => go(item.id)),
										className: "flex min-h-14 w-full items-center gap-3 px-4 text-left",
										children: [
											/* @__PURE__ */ jsx(Icon, { className: "size-4 shrink-0 text-muted" }),
											/* @__PURE__ */ jsxs("span", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "block font-semibold",
													children: item.label
												}), /* @__PURE__ */ jsx("span", {
													className: "block truncate text-xs text-muted",
													children: item.hint
												})]
											}),
											item.id === "inbox" && unread > 0 && /* @__PURE__ */ jsx("span", {
												className: "rounded-full bg-loss px-2 py-0.5 text-[11px] font-bold",
												children: unread
											})
										]
									})
								}, item.id);
							}), /* @__PURE__ */ jsx("li", {
								className: "border-t border-border",
								children: /* @__PURE__ */ jsx("button", {
									type: "button",
									...bindTap(() => {
										setMoreOpen(false);
										showTutorial();
									}),
									className: "flex min-h-12 w-full items-center px-4 text-sm text-muted",
									children: "Tutorial"
								})
							})]
						})]
					})
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "dock",
				"aria-label": "Main",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto grid max-w-5xl grid-cols-5",
					children: [PRIMARY.map((item) => {
						const Icon = item.icon;
						const on = view === item.id;
						return /* @__PURE__ */ jsxs("button", {
							type: "button",
							...bindTap(() => go(item.id)),
							className: `flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] leading-tight font-semibold ${on ? "text-fg" : "text-muted"}`,
							children: [/* @__PURE__ */ jsx(Icon, { className: "size-4 shrink-0" }), /* @__PURE__ */ jsx("span", {
								className: "max-w-full truncate",
								children: item.label
							})]
						}, item.id);
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						...bindTap(() => setMoreOpen((v) => !v)),
						className: `flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[11px] leading-tight font-semibold ${moreOn || moreOpen ? "text-fg" : "text-muted"}`,
						children: [/* @__PURE__ */ jsxs("span", {
							className: "relative",
							children: [/* @__PURE__ */ jsx(Ellipsis, { className: "size-4" }), unread > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 size-1.5 rounded-full bg-loss" })]
						}), "More"]
					})]
				})
			})
		]
	});
}
//#endregion
//#region src/components/game/hub.tsx
function Hub() {
	const { state, simWeek, simGame, playGame, setView, showTutorial, nextSeason, spendSkill, saveNow } = useGame();
	if (!state) return null;
	const t = state.teams[state.playerTeamId];
	const school = TEAM_BY_ID[state.playerTeamId];
	const next = yourGames(state).find((g) => !g.resultId && !g.declined);
	const opp = next ? TEAM_BY_ID[next.homeId === state.playerTeamId ? next.awayId : next.homeId] : null;
	const off = state.phase === "offseason";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs tracking-[0.18em] text-muted uppercase",
					children: identityName(state.identity)
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-1 text-4xl",
					children: school.name
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						recordLine(t),
						" · ",
						school.conference,
						" · prestige ",
						t.prestige,
						" · ",
						state.season,
						state.identity.almaMaterId && state.identity.almaMaterId !== state.playerTeamId ? ` · alma mater ${TEAM_BY_ID[state.identity.almaMaterId]?.name}` : ""
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-1 text-xs text-muted",
					children: [
						"Career ",
						state.history.wins,
						"-",
						state.history.losses,
						state.history.seasons ? ` · ${state.history.seasons} season${state.history.seasons === 1 ? "" : "s"}` : "",
						state.history.confTitles ? ` · ${state.history.confTitles} league title${state.history.confTitles === 1 ? "" : "s"}` : "",
						state.history.ncaaBids ? ` · ${state.history.ncaaBids} National bid${state.history.ncaaBids === 1 ? "" : "s"}` : "",
						state.history.titles ? ` · ${state.history.titles} national title${state.history.titles === 1 ? "" : "s"}` : ""
					]
				})
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-2 text-center",
				children: [
					/* @__PURE__ */ jsx(Stat, {
						label: "AD",
						value: state.adHeat
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Fans",
						value: state.fanMood
					}),
					/* @__PURE__ */ jsx(Stat, {
						label: "Donors",
						value: state.donorMood
					})
				]
			}),
			off && state.offseasonReport && /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: "Development report"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "font-display mt-1 text-2xl",
						children: [state.season, " film"]
					}),
					/* @__PURE__ */ jsxs("ul", {
						className: "mt-3 space-y-1 text-sm",
						children: [state.offseasonReport.grew.length === 0 && /* @__PURE__ */ jsx("li", {
							className: "text-muted",
							children: "Nobody took a leap. Minutes and morale feed the next jump."
						}), state.offseasonReport.grew.map((g) => /* @__PURE__ */ jsxs("li", { children: [
							g.name,
							" ",
							/* @__PURE__ */ jsxs("span", {
								className: g.after > g.before ? "text-win" : "text-loss",
								children: [
									g.before,
									" → ",
									g.after
								]
							})
						] }, g.id))]
					}),
					state.offseasonReport.graduated.length > 0 && /* @__PURE__ */ jsxs("p", {
						className: "mt-3 text-xs text-muted",
						children: ["Out: ", state.offseasonReport.graduated.map((g) => g.name).join(", ")]
					})
				]
			}),
			state.history.log.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs tracking-widest text-muted uppercase",
					children: "Trophy room"
				}), /* @__PURE__ */ jsx("ul", {
					className: "mt-3 space-y-1.5 text-sm",
					children: state.history.log.slice().reverse().map((y) => /* @__PURE__ */ jsxs("li", {
						className: "flex flex-wrap justify-between gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-semibold",
							children: y.season
						}), /* @__PURE__ */ jsxs("span", {
							className: "tabular-nums text-muted",
							children: [
								y.wins,
								"-",
								y.losses,
								y.confTitle ? " · league" : "",
								y.ncaaBid ? " · National" : "",
								y.title ? " · title" : ""
							]
						})]
					}, y.season))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-xs tracking-widest text-muted uppercase",
					children: [
						"Coach skills · ",
						state.skillPoints ?? 0,
						" pts"
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-3 flex flex-col gap-2",
					children: COACH_AXES.map((a) => {
						const v = state.coachSkills?.[a.id] ?? 48;
						return /* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: !state.skillPoints,
							...bindTap(() => spendSkill(a.id)),
							className: "rounded-lg bg-bg px-3 py-2 text-left disabled:opacity-60",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "flex justify-between text-sm font-semibold",
									children: [/* @__PURE__ */ jsx("span", { children: a.label }), /* @__PURE__ */ jsx("span", {
										className: "tabular-nums",
										children: v
									})]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "mt-0.5 block text-[11px] text-muted",
									children: a.hint
								}),
								/* @__PURE__ */ jsx("span", {
									className: "interest-bar mt-1 block",
									children: /* @__PURE__ */ jsx("span", { style: { width: `${v}%` } })
								})
							]
						}, a.id);
					})
				})]
			}),
			state.phase === "selection" && state.selection && !state.selection.revealed && /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: "Selection Day"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "font-display mt-1 text-2xl",
						children: "The envelope is on the desk."
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-muted",
						children: "League tournaments are in. The committee set the field of 68. Watch the reveal before March tips."
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "mt-3 min-h-11 rounded-lg bg-accent px-3 font-semibold text-accent-fg",
						...bindTap(() => setView("selection")),
						children: "Watch Selection Day"
					})
				]
			}),
			state.phase === "selection" && state.selection?.revealed && /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: "Selection Day"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "font-display mt-1 text-2xl",
						children: (() => {
							const bid = state.selection.ncaa.find((b) => b.teamId === state.playerTeamId);
							if (bid) return `${bid.seed} seed · ${bid.region}${bid.playIn ? " · Play-in" : ""}`;
							if (state.selection.nit.includes(state.playerTeamId)) return "Invite bid";
							if (state.selection.crown.includes(state.playerTeamId)) return "The Crown";
							return "Home for March";
						})()
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							state.selection.ncaa.filter((b) => b.path === "auto").length,
							" auto bids · ",
							state.selection.ncaa.filter((b) => b.path === "at-large").length,
							" at-large. Sim week to tip the Play-in."
						]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "mt-3 min-h-11 rounded-lg bg-accent px-3 font-semibold text-accent-fg",
						...bindTap(() => setView("bracketology")),
						children: "Open the board"
					})
				]
			}),
			(state.phase === "ncaa" || state.phase === "nit" || state.phase === "crown" || state.phase === "conference") && /* @__PURE__ */ jsxs("p", {
				className: "text-sm text-muted",
				children: [
					state.phase === "conference" ? "League tournament." : state.phase === "ncaa" ? "National Tournament." : state.phase === "nit" ? "The Invite." : "The Crown.",
					" ",
					"Sim week to play the round; Play game when it's yours."
				]
			}),
			next && opp && /* @__PURE__ */ jsxs("div", {
				className: "rounded-xl border border-border bg-elevated p-4",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-xs tracking-widest text-muted uppercase",
						children: "Next"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "font-display mt-1 text-2xl",
						children: opp.name
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm text-muted",
						children: [
							"Week ",
							next.week,
							" · ",
							next.site,
							" · ",
							next.kind
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					off ? /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-12 rounded-lg bg-accent font-semibold text-accent-fg col-span-2",
						...bindTap(nextSeason),
						children: "Next season"
					}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "min-h-12 rounded-lg bg-accent font-semibold text-accent-fg",
							...bindTap(playGame),
							children: "Play game"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "min-h-12 rounded-lg bg-elevated font-semibold",
							...bindTap(simGame),
							children: "Sim game"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "min-h-12 rounded-lg bg-elevated font-semibold",
							...bindTap(simWeek),
							children: "Sim week"
						})
					] }),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "min-h-12 rounded-lg bg-elevated font-semibold",
						...bindTap(() => setView("inbox")),
						children: ["Inbox", unreadMail(state) ? ` (${unreadMail(state)})` : ""]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-12 rounded-lg bg-elevated font-semibold",
						...bindTap(() => saveNow()),
						children: "Save now"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-12 rounded-lg bg-elevated font-semibold",
						...bindTap(() => setView("saves")),
						children: "Files"
					})
				]
			}),
			state.phase === "preseason" && /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "Lock the schedule from the Schedule tab when the non-con is set."
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl bg-elevated py-3",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-[11px] tracking-widest text-muted uppercase",
			children: label
		}), /* @__PURE__ */ jsx("p", {
			className: "font-display mt-1 text-2xl",
			children: value
		})]
	});
}
//#endregion
//#region src/components/game/schedule-view.tsx
function ScheduleView() {
	const { state, addGame, drop, join, lock } = useGame();
	const [q, setQ] = useState("");
	const [sort, setSort] = useState("rating");
	const [week, setWeek] = useState(1);
	const [site, setSite] = useState("home");
	if (!state) return null;
	const you = state.teams[state.playerTeamId];
	const yours = yourGames(state).sort((a, b) => a.week - b.week);
	const live = yours.filter((g) => !g.declined);
	const opps = useMemo(() => {
		const taken = new Set(yours.flatMap((g) => [g.homeId, g.awayId]));
		let list = TEAMS.filter((t) => t.id !== state.playerTeamId && !taken.has(t.id));
		const query = q.trim().toLowerCase();
		if (query) list = list.filter((t) => t.name.toLowerCase().includes(query) || t.city.toLowerCase().includes(query));
		if (sort === "rating") list = [...list].sort((a, b) => b.prestige - a.prestige);
		else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
		return list.slice(0, 40);
	}, [
		q,
		sort,
		yours,
		state.playerTeamId
	]);
	const weekCount = gamesInWeek(state, week).length;
	const locked = state.phase !== "preseason";
	const addErr = (id) => canAddGame(state, id, week, site);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl",
				children: "Schedule"
			}), /* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					live.length,
					"/",
					30,
					" games · ",
					30,
					"-game regular season · max ",
					3,
					" per week"
				]
			})] }),
			/* @__PURE__ */ jsx("ul", {
				className: "divide-y divide-border rounded-xl border border-border",
				children: yours.map((g) => {
					const opp = TEAM_BY_ID[g.homeId === state.playerTeamId ? g.awayId : g.homeId];
					return /* @__PURE__ */ jsxs("li", {
						className: "flex items-center gap-2 px-3 py-2.5",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "w-10 text-xs text-muted",
								children: ["Wk ", g.week]
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "flex-1 text-sm",
								children: [
									opp?.name,
									" · ",
									g.kind,
									" · ",
									g.site,
									g.declined && /* @__PURE__ */ jsx("span", {
										className: "ml-2 text-loss",
										children: "declined"
									}),
									g.resultId && /* @__PURE__ */ jsx("span", {
										className: "ml-2 text-win",
										children: "final"
									})
								]
							}),
							!locked && g.kind !== "conference" && /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "text-xs text-muted",
								onClick: () => drop(g.id),
								children: "Drop"
							})
						]
					}, g.id);
				})
			}),
			!locked && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-12 rounded-lg bg-accent font-semibold text-accent-fg",
					...bindTap(lock),
					children: "Lock schedule and start season"
				}),
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-display text-2xl",
						children: "Add a game"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							className: `h-10 rounded-full px-3 text-sm font-semibold ${sort === "rating" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
							onClick: () => setSort("rating"),
							children: "Sort by rating"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: `h-10 rounded-full px-3 text-sm font-semibold ${sort === "name" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
							onClick: () => setSort("name"),
							children: "Sort by name"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ jsx("select", {
							className: "h-11 flex-1 rounded-lg border border-border bg-elevated px-2",
							value: week,
							onChange: (e) => setWeek(Number(e.target.value)),
							children: Array.from({ length: 18 }, (_, i) => i + 1).map((w) => /* @__PURE__ */ jsxs("option", {
								value: w,
								children: [
									"Week ",
									w,
									" (",
									gamesInWeek(state, w).length,
									"/",
									3,
									")"
								]
							}, w))
						}), /* @__PURE__ */ jsxs("select", {
							className: "h-11 w-28 rounded-lg border border-border bg-elevated px-2",
							value: site,
							onChange: (e) => setSite(e.target.value),
							children: [
								/* @__PURE__ */ jsx("option", {
									value: "home",
									children: "Home"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "away",
									children: "Away"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "neutral",
									children: "Neutral"
								})
							]
						})]
					}),
					weekCount >= 3 && /* @__PURE__ */ jsxs("p", {
						className: "mt-2 text-sm text-loss",
						children: [
							"Week ",
							week,
							" is full."
						]
					}),
					/* @__PURE__ */ jsx("input", {
						className: "mt-3 h-12 w-full rounded-lg border border-border bg-elevated px-3",
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search a school…"
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-2",
						children: opps.map((t) => {
							const gap = t.prestige - you.prestige;
							const err = addErr(t.id);
							return /* @__PURE__ */ jsxs("li", {
								className: "flex items-center gap-2 border-b border-border py-2",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "flex-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "block font-semibold",
										children: t.name
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-xs text-muted",
										children: [
											"Rating ",
											t.prestige,
											gap > 8 ? " · may decline" : ""
										]
									})]
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: Boolean(err),
									onClick: () => addGame(t.id, site, week),
									className: "min-h-10 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg disabled:opacity-40",
									children: "Add"
								})]
							}, t.id);
						})
					})
				] }),
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h2", {
						className: "font-display text-2xl",
						children: "Holiday events"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-muted",
						children: "MTEs. 8-team fields play 3, 4-team fields play 2 — all that week, neutral."
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-2 space-y-2",
						children: MTES.map((m) => {
							const inIt = yours.some((g) => g.kind === "mte" && g.id.startsWith(`mte-${m.id}`));
							const games = m.size >= 8 ? 3 : 2;
							const tooSmall = you.prestige < m.minPrestige;
							const weekFull = gamesInWeek(state, m.week).length + games > 3 && !inIt;
							return /* @__PURE__ */ jsxs("li", {
								className: "flex items-center justify-between gap-2 rounded-xl border border-border bg-elevated px-3 py-2",
								children: [/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
									className: "block font-semibold",
									children: m.name
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-xs text-muted",
									children: [
										m.site,
										" · Wk ",
										m.week,
										" · ",
										games,
										" games · min ",
										m.minPrestige,
										tooSmall ? " · prestige short" : ""
									]
								})] }), inIt ? /* @__PURE__ */ jsx("span", {
									className: "text-xs font-semibold text-win",
									children: "In"
								}) : /* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: tooSmall || weekFull,
									...bindTap(() => join(m.id)),
									className: "min-h-10 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg disabled:opacity-40",
									children: "Join"
								})]
							}, m.id);
						})
					})
				] })
			] })
		]
	});
}
//#endregion
//#region src/components/game/recruiting-view.tsx
function RecruitingView() {
	const { state, scout, offer, visit } = useGame();
	const [tab, setTab] = useState("board");
	const [sort, setSort] = useState("interest");
	const [q, setQ] = useState("");
	if (!state) return null;
	const you = state.playerTeamId;
	const left = scholarshipsLeft(state);
	const rows = useMemo(() => {
		let list = state.recruits.filter((r) => !r.committedTo || r.committedTo === you);
		const query = q.trim().toLowerCase();
		if (query) list = list.filter((r) => `${r.first} ${r.last}`.toLowerCase().includes(query) || r.pos.toLowerCase() === query);
		if (sort === "interest") list = [...list].sort((a, b) => interestIn(b, you) - interestIn(a, you) || b.stars - a.stars);
		else list = [...list].sort((a, b) => b.stars - a.stars || b.ovr - a.ovr);
		return list.slice(0, tab === "espn" ? 100 : 60);
	}, [
		state.recruits,
		sort,
		q,
		you,
		tab
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl",
				children: "Recruiting"
			}), /* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					left,
					" scholarships left · ",
					state.recruitingHours,
					"h this week",
					left <= 0 ? " · offers are closed until a spot opens" : ""
				]
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-semibold ${tab === "board" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
						onClick: () => setTab("board"),
						children: "Board"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-semibold ${tab === "espn" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
						onClick: () => setTab("espn"),
						children: "Board 100"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-semibold ${sort === "interest" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
						onClick: () => setSort("interest"),
						children: "Sort by interest"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `h-10 rounded-full px-3 text-sm font-semibold ${sort === "stars" ? "bg-accent text-accent-fg" : "bg-elevated"}`,
						onClick: () => setSort("stars"),
						children: "Sort by stars"
					})
				]
			}),
			/* @__PURE__ */ jsx("input", {
				className: "h-12 rounded-lg border border-border bg-elevated px-3",
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Search a recruit…"
			}),
			/* @__PURE__ */ jsx("ul", {
				className: "flex flex-col gap-2",
				children: rows.map((r, i) => {
					const interest = interestIn(r, you);
					const offered = r.offers.includes(you);
					return /* @__PURE__ */ jsxs("li", {
						className: "rounded-xl border border-border bg-elevated p-3",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex-1",
									children: [/* @__PURE__ */ jsxs("p", {
										className: "font-semibold",
										children: [
											tab === "espn" ? /* @__PURE__ */ jsxs("span", {
												className: "mr-2 text-xs text-muted",
												children: ["#", i + 1]
											}) : null,
											r.first,
											" ",
											r.last
										]
									}), /* @__PURE__ */ jsxs("p", {
										className: "text-xs text-muted",
										children: [
											r.stars,
											"★ ",
											r.pos,
											" · ",
											r.state,
											" · ovr ",
											r.ovr,
											" · pot ",
											r.potential,
											r.scouted ? ` · wants ${topNeed(r.wants)}` : " · scout to see wants",
											r.scouted && r.skills ? ` · shoot ${r.skills.shoot} / finish ${r.skills.finish} / def ${r.skills.defense} / IQ ${r.skills.iq}` : ""
										]
									})]
								}), /* @__PURE__ */ jsx("span", {
									className: "text-xs font-bold text-accent",
									children: interest
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "interest-bar mt-2",
								"aria-label": `Interest ${interest}`,
								children: /* @__PURE__ */ jsx("span", { style: { width: `${interest}%` } })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
										...bindTap(() => scout(r.id)),
										children: "Scout"
									}),
									/* @__PURE__ */ jsx("button", {
										type: "button",
										disabled: left <= 0 && !offered,
										className: "min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] disabled:opacity-40",
										...bindTap(() => offer(r.id)),
										children: offered ? "Offered" : left <= 0 ? "No scholarships" : "Offer"
									}),
									/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "min-h-10 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg",
										...bindTap(() => visit(r.id)),
										children: "Visit"
									})
								]
							})
						]
					}, r.id);
				})
			})
		]
	});
}
function topNeed(w) {
	const e = [
		["home", w.home],
		["minutes", w.minutes],
		["scheme", w.scheme],
		["academics", w.academics],
		["NIL", w.nil]
	];
	e.sort((a, b) => b[1] - a[1]);
	return e[0][0];
}
//#endregion
//#region src/components/game/inbox-view.tsx
function InboxView() {
	const { state, readMail, setView } = useGame();
	if (!state) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-11 text-sm font-semibold text-accent",
					onClick: () => setView("hub"),
					children: "← Office"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-11 text-sm text-muted",
					onClick: () => setView("schedule"),
					children: "Schedule"
				})]
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl",
				children: "Inbox"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "AD, donors, and campus. Use Office or the tab bar to leave the mail."
			}),
			/* @__PURE__ */ jsx("ul", {
				className: "flex flex-col gap-3",
				children: state.mail.map((m) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => readMail(m.id),
					className: `w-full rounded-xl border p-4 text-left ${m.read ? "border-border bg-surface" : "border-accent/40 bg-elevated"}`,
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs tracking-widest text-muted uppercase",
							children: [
								m.from,
								" · wk ",
								m.week
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 font-semibold",
							children: m.subject
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: m.body
						})
					]
				}) }, m.id))
			})
		]
	});
}
//#endregion
//#region src/components/game/presser-view.tsx
function PresserView() {
	const { state, answer, setView } = useGame();
	if (!state?.pendingPresser) return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-fg",
		children: [/* @__PURE__ */ jsx("p", {
			className: "font-display text-3xl",
			children: "Podium's clear"
		}), /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "min-h-12 rounded-lg bg-accent px-6 font-semibold text-accent-fg",
			...bindTap(() => setView("hub")),
			children: "Back to office"
		})]
	});
	const p = state.pendingPresser;
	const q = p.questions[p.asked];
	const school = TEAM_BY_ID[state.playerTeamId];
	if (!q) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-dvh flex-col bg-bg px-4 py-8 text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex w-full max-w-lg flex-1 flex-col",
			children: [
				/* @__PURE__ */ jsxs("p", {
					className: "text-xs tracking-[0.18em] text-muted uppercase",
					children: [
						school.name,
						" · question ",
						p.asked + 1,
						" of ",
						p.questions.length
					]
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-3 text-3xl leading-tight",
					children: q.prompt
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-muted",
					children: "Say it. The room, the AD, and the fans will take it how they take it."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 flex flex-col gap-2",
					children: q.choices.map((c) => /* @__PURE__ */ jsx("button", {
						type: "button",
						...bindTap(() => answer(c.id)),
						className: "min-h-14 rounded-xl border border-border bg-elevated px-4 py-3 text-left text-sm leading-snug",
						children: c.label
					}, c.id))
				})
			]
		})
	});
}
//#endregion
//#region src/components/game/roster-view.tsx
function RosterView() {
	const { state, pep, bumpMinutes } = useGame();
	const [open, setOpen] = useState(null);
	if (!state) return null;
	const roster = state.players.filter((p) => p.teamId === state.playerTeamId).sort((a, b) => b.ovr - a.ovr);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
			className: "font-display text-3xl",
			children: "Roster"
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: "OVR walks toward potential. Minutes feed growth. Tap a player for the skill chart."
		})] }), /* @__PURE__ */ jsx("ul", {
			className: "flex flex-col gap-2",
			children: roster.map((p) => {
				const room = p.potential - p.ovr;
				const on = open === p.id;
				return /* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					...bindTap(() => setOpen(on ? null : p.id)),
					className: `flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${on ? "border-accent bg-elevated" : "border-border bg-elevated"}`,
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-8 text-xs text-muted",
							children: p.pos
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "flex-1",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "block font-semibold",
								children: [
									p.first,
									" ",
									p.last
								]
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-xs text-muted",
								children: [
									"Yr ",
									p.year,
									" · ",
									p.ovr,
									" ovr · pot ",
									p.potential,
									room > 0 ? ` · +${room} room` : " · maxed",
									" · ",
									p.mpg,
									" mpg"
								]
							})]
						}),
						/* @__PURE__ */ jsx("span", {
							className: `text-sm font-semibold ${p.morale >= 70 ? "text-win" : p.morale < 50 ? "text-loss" : "text-muted"}`,
							children: p.morale
						})
					]
				}), on && /* @__PURE__ */ jsxs("div", {
					className: "mt-2 rounded-xl border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted",
							children: [
								p.seasonMinutes,
								" min this year · growth walks to ",
								p.potential
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex flex-col gap-2",
							children: SKILL_LABEL.map((s) => {
								const v = p.skills?.[s.id] ?? p.ovr;
								return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between text-[11px] tracking-wide text-muted uppercase",
									children: [/* @__PURE__ */ jsx("span", { children: s.label }), /* @__PURE__ */ jsx("span", {
										className: "tabular-nums text-fg",
										children: v
									})]
								}), /* @__PURE__ */ jsx("div", {
									className: "interest-bar mt-1",
									children: /* @__PURE__ */ jsx("span", { style: { width: `${v}%` } })
								})] }, s.id);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-4 flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-xs text-muted",
									children: "Minutes"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "min-h-11 min-w-11 rounded-lg bg-bg font-semibold",
									...bindTap(() => bumpMinutes(p.id, -2)),
									children: "−"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "tabular-nums font-semibold",
									children: p.mpg
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "min-h-11 min-w-11 rounded-lg bg-bg font-semibold",
									...bindTap(() => bumpMinutes(p.id, 2)),
									children: "+"
								})
							]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "mt-3 min-h-12 w-full rounded-lg bg-accent font-semibold text-accent-fg",
							...bindTap(() => pep(p.id)),
							children: "Check in"
						})
					]
				})] }, p.id);
			})
		})]
	});
}
//#endregion
//#region src/game/ranks.ts
function locOf(slot, resultHomeId, teamId) {
	if (slot?.site === "neutral") return "neutral";
	return resultHomeId === teamId ? "home" : "away";
}
function allLines(state, maxWeek = Infinity) {
	const m = /* @__PURE__ */ new Map();
	for (const id of Object.keys(state.teams)) m.set(id, []);
	const slotById = new Map(state.schedule.map((g) => [g.id, g]));
	for (const r of state.results) {
		if (r.week > maxWeek) continue;
		const slot = slotById.get(r.slotId);
		const kind = slot?.kind ?? "noncon";
		const push = (id, home) => {
			m.get(id).push({
				oppId: home ? r.awayId : r.homeId,
				won: home ? r.homeScore > r.awayScore : r.awayScore > r.homeScore,
				loc: locOf(slot, r.homeId, id),
				pf: home ? r.homeScore : r.awayScore,
				pa: home ? r.awayScore : r.homeScore,
				kind,
				week: r.week,
				poss: gamePossessions(r.homeBox, r.awayBox, r.homeScore, r.awayScore),
				minutes: r.minutes ?? 40
			});
		};
		push(r.homeId, true);
		push(r.awayId, false);
	}
	return m;
}
function ovr(state, id) {
	const r = state.players.filter((p) => p.teamId === id).sort((a, b) => b.ovr - a.ovr).slice(0, 8);
	if (!r.length) return 70;
	return r.reduce((s, p) => s + p.ovr, 0) / r.length;
}
function avg(xs) {
	if (!xs.length) return 0;
	return xs.reduce((n, x) => n + x, 0) / xs.length;
}
function rankBy(ids, value, higher = true) {
	const sorted = [...ids].sort((a, b) => higher ? value(b) - value(a) : value(a) - value(b));
	const m = /* @__PURE__ */ new Map();
	sorted.forEach((id, i) => m.set(id, i + 1));
	return m;
}
var memoKey = "";
var memoKp = null;
var memoNet = null;
var memoAp = null;
function stamp(state) {
	return `${state.season}:${state.week}:${state.results.length}:${state.selection?.ncaa.length ?? 0}`;
}
function kenpom(state) {
	const k = stamp(state);
	if (memoKp && memoKey === k) return memoKp;
	const lines = allLines(state);
	const ids = Object.keys(state.teams);
	const MU = 100;
	const AVG_T = 67.3;
	const HCA = 1.4;
	const ITER = 18;
	const PRIOR_W = 3.5;
	const now = state.week;
	const priorO = /* @__PURE__ */ new Map();
	const priorD = /* @__PURE__ */ new Map();
	const priorT = /* @__PURE__ */ new Map();
	const adjO = /* @__PURE__ */ new Map();
	const adjD = /* @__PURE__ */ new Map();
	const adjT = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const em = (ovr(state, id) - 70) * .95;
		const o = MU + em * .55;
		const d = MU - em * .45;
		priorO.set(id, o);
		priorD.set(id, d);
		priorT.set(id, AVG_T);
		adjO.set(id, o);
		adjD.set(id, d);
		adjT.set(id, AVG_T);
	}
	const recency = (week) => Math.pow(.94, Math.max(0, now - week));
	for (let it = 0; it < ITER; it++) {
		const nextO = /* @__PURE__ */ new Map();
		const nextD = /* @__PURE__ */ new Map();
		const nextT = /* @__PURE__ */ new Map();
		for (const id of ids) {
			const games = lines.get(id) ?? [];
			let nO = (priorO.get(id) ?? MU) * PRIOR_W;
			let dO = PRIOR_W;
			let nD = (priorD.get(id) ?? MU) * PRIOR_W;
			let dD = PRIOR_W;
			let nT = (priorT.get(id) ?? AVG_T) * PRIOR_W;
			let dT = PRIOR_W;
			for (const g of games) {
				const w = recency(g.week);
				const poss = Math.max(40, g.poss);
				const rawO = g.pf / poss * 100;
				const rawD = g.pa / poss * 100;
				const hcaO = g.loc === "home" ? HCA : g.loc === "away" ? -1.4 : 0;
				const hcaD = g.loc === "home" ? -1.4 : g.loc === "away" ? HCA : 0;
				const oppD = adjD.get(g.oppId) ?? MU;
				const oppO = adjO.get(g.oppId) ?? MU;
				const oppT = adjT.get(g.oppId) ?? AVG_T;
				nO += (rawO - hcaO - (oppD - MU)) * w;
				dO += w;
				nD += (rawD - hcaD - (oppO - MU)) * w;
				dD += w;
				const rawT = poss * 40 / Math.max(40, g.minutes);
				nT += (2 * rawT - oppT) * w;
				dT += w;
			}
			nextO.set(id, nO / dO);
			nextD.set(id, nD / dD);
			nextT.set(id, nT / dT);
		}
		let sO = 0;
		let sD = 0;
		let sT = 0;
		for (const id of ids) {
			sO += nextO.get(id);
			sD += nextD.get(id);
			sT += nextT.get(id);
		}
		const mO = sO / ids.length;
		const mD = sD / ids.length;
		const mT = sT / ids.length;
		for (const id of ids) {
			adjO.set(id, nextO.get(id) - mO + MU);
			adjD.set(id, nextD.get(id) - mD + MU);
			adjT.set(id, nextT.get(id) - mT + AVG_T);
		}
	}
	const luckOf = (id) => {
		const t = state.teams[id];
		const games = lines.get(id) ?? [];
		const gp = games.length;
		if (!gp) return 0;
		let exp = 0;
		for (const g of games) {
			const poss = Math.max(40, g.poss);
			const o = g.pf / poss * 100;
			const d = g.pa / poss * 100;
			const pO = o ** 10.25;
			const pD = d ** 10.25;
			exp += pO / (pO + pD + 1e-9);
		}
		return t.wins / gp - exp / gp;
	};
	const sosEM = (id) => {
		const gs = lines.get(id) ?? [];
		if (!gs.length) return 0;
		return avg(gs.map((g) => (adjO.get(g.oppId) ?? MU) - (adjD.get(g.oppId) ?? MU)));
	};
	const oppO = (id) => {
		const gs = lines.get(id) ?? [];
		if (!gs.length) return MU;
		return avg(gs.map((g) => adjO.get(g.oppId) ?? MU));
	};
	const oppD = (id) => {
		const gs = lines.get(id) ?? [];
		if (!gs.length) return MU;
		return avg(gs.map((g) => adjD.get(g.oppId) ?? MU));
	};
	const ncsos = (id) => {
		const gs = (lines.get(id) ?? []).filter((g) => g.kind !== "conference" && g.kind !== "conf-tourney");
		if (!gs.length) return sosEM(id);
		return avg(gs.map((g) => (adjO.get(g.oppId) ?? MU) - (adjD.get(g.oppId) ?? MU)));
	};
	const rO = rankBy(ids, (id) => adjO.get(id));
	const rD = rankBy(ids, (id) => adjD.get(id), false);
	const rT = rankBy(ids, (id) => adjT.get(id));
	const rL = rankBy(ids, luckOf);
	const rS = rankBy(ids, sosEM);
	const rSO = rankBy(ids, oppO);
	const rSD = rankBy(ids, oppD, false);
	const rN = rankBy(ids, ncsos);
	const rows = ids.map((id) => {
		const t = state.teams[id];
		const o = adjO.get(id);
		const d = adjD.get(id);
		return {
			id,
			rank: 0,
			wins: t.wins,
			losses: t.losses,
			conf: confName(t.conference),
			adjEM: o - d,
			adjO: o,
			adjORank: rO.get(id),
			adjD: d,
			adjDRank: rD.get(id),
			adjT: adjT.get(id),
			adjTRank: rT.get(id),
			luck: luckOf(id),
			luckRank: rL.get(id),
			sosEM: sosEM(id),
			sosRank: rS.get(id),
			oppO: oppO(id),
			oppORank: rSO.get(id),
			oppD: oppD(id),
			oppDRank: rSD.get(id),
			ncsos: ncsos(id),
			ncsosRank: rN.get(id)
		};
	});
	rows.sort((a, b) => b.adjEM - a.adjEM || b.wins - a.wins);
	memoKey = k;
	memoKp = rows.map((row, i) => ({
		...row,
		rank: i + 1
	}));
	memoNet = null;
	memoAp = null;
	return memoKp;
}
function quadOf(oppRank, loc) {
	if (loc === "home") {
		if (oppRank <= 30) return 1;
		if (oppRank <= 75) return 2;
		if (oppRank <= 160) return 3;
		return 4;
	}
	if (loc === "neutral") {
		if (oppRank <= 50) return 1;
		if (oppRank <= 100) return 2;
		if (oppRank <= 200) return 3;
		return 4;
	}
	if (oppRank <= 75) return 1;
	if (oppRank <= 135) return 2;
	if (oppRank <= 240) return 3;
	return 4;
}
function buildNet(state, maxWeek) {
	const kp = kenpom(state);
	const seed = new Map(kp.map((r) => [r.id, r.rank]));
	const lines = allLines(state, maxWeek);
	const field = projectedField(state);
	const pathOf = new Map(field.map((b) => [b.teamId, b.path]));
	const rows = Object.keys(state.teams).map((id) => {
		const t = state.teams[id];
		const games = lines.get(id) ?? [];
		const q = {
			1: [0, 0],
			2: [0, 0],
			3: [0, 0],
			4: [0, 0]
		};
		for (const g of games) {
			const band = quadOf(seed.get(g.oppId) ?? 200, g.loc);
			if (g.won) q[band][0]++;
			else q[band][1]++;
		}
		const gp = t.wins + t.losses;
		const wp = gp ? t.wins / gp : .5;
		const pf = games.reduce((n, g) => n + g.pf, 0);
		const pa = games.reduce((n, g) => n + g.pa, 0);
		const em = games.length ? (pf - pa) / games.length : (ovr(state, id) - 70) * .4;
		const sos = games.length ? avg(games.map((g) => state.teams[g.oppId]?.prestige ?? 60)) : t.prestige;
		const q1 = q[1][0] * 3.4 - q[1][1] * .6;
		const q4 = q[4][0] * .2 - q[4][1] * 4.2;
		const road = games.filter((g) => g.loc !== "home" && g.won).length * 1.1;
		const net = wp * 42 + em * 1.35 + (sos - 64) * .55 + q1 + q4 + road + (ovr(state, id) - 70) * .35;
		return {
			id,
			rank: 0,
			prevRank: 0,
			wins: t.wins,
			losses: t.losses,
			net,
			q1w: q[1][0],
			q1l: q[1][1],
			q2w: q[2][0],
			q2l: q[2][1],
			q3w: q[3][0],
			q3l: q[3][1],
			q4w: q[4][0],
			q4l: q[4][1],
			nonD1w: 0,
			nonD1l: 0,
			path: pathOf.get(id) ?? null
		};
	});
	rows.sort((a, b) => b.net - a.net || b.wins - a.wins);
	return rows.map((row, i) => ({
		...row,
		rank: i + 1
	}));
}
function netRanks(state) {
	const k = stamp(state);
	if (memoNet && memoKey === k) return memoNet;
	const current = buildNet(state, Infinity);
	let out;
	if (state.week <= 1 || !state.results.length) out = current.map((r) => ({
		...r,
		prevRank: r.rank
	}));
	else {
		const prev = buildNet(state, state.week - 1);
		const prevMap = new Map(prev.map((r) => [r.id, r.rank]));
		out = current.map((r) => ({
			...r,
			prevRank: prevMap.get(r.id) ?? r.rank
		}));
	}
	memoKey = k;
	memoNet = out;
	return out;
}
function apPoll(state) {
	const k = stamp(state);
	if (memoAp && memoKey === k) return memoAp;
	const net = netRanks(state);
	const netOf = new Map(net.map((r) => [r.id, r.rank]));
	const lines = allLines(state);
	const scored = Object.keys(state.teams).map((id) => {
		const t = state.teams[id];
		const n = netOf.get(id) ?? 200;
		const games = lines.get(id) ?? [];
		const qw = games.filter((g) => g.won && (netOf.get(g.oppId) ?? 200) <= 25).length;
		const recW = games.slice(-5).filter((g) => g.won).length;
		return {
			id,
			score: t.prestige * .9 + ovr(state, id) * .25 + t.wins * 4.2 - t.losses * 2.6 + qw * 6.5 + recW * 1.8 - n * .08,
			wins: t.wins,
			losses: t.losses
		};
	});
	scored.sort((a, b) => b.score - a.score || b.wins - a.wins);
	const voters = 62;
	const rows = scored.map((row, i) => {
		const rank = i + 1;
		const share = Math.max(.02, 1 - i * .031);
		const first = rank <= 8 ? Math.round(voters * share * (rank === 1 ? .55 : .12 / rank)) : 0;
		const points = rank <= 25 ? Math.round((26 - rank) * voters * (.92 + row.score % 7 * .004)) : rank <= 40 ? Math.max(1, 22 - (rank - 25) * 2) : 0;
		return {
			id: row.id,
			rank,
			wins: row.wins,
			losses: row.losses,
			points,
			first
		};
	});
	memoKey = k;
	memoAp = rows;
	return rows;
}
function espnField(state) {
	if (state.selection?.ncaa.length) return state.selection.ncaa;
	const ap = apPoll(state);
	const apRank = new Map(ap.map((r) => [r.id, r.rank]));
	return projectedField(state, (id) => committeeScore(state, id) + (80 - Math.min(80, apRank.get(id) ?? 80)) * .45);
}
function cbsField(state) {
	if (state.selection?.ncaa.length) return state.selection.ncaa;
	const net = netRanks(state);
	const kp = kenpom(state);
	const n = new Map(net.map((r) => [r.id, r.rank]));
	const e = new Map(kp.map((r) => [r.id, r.adjEM]));
	return projectedField(state, (id) => (e.get(id) ?? 0) * 2.4 - (n.get(id) ?? 200) * .55 + committeeScore(state, id) * .25);
}
function bubbleLists(state, field, order) {
	const inField = new Set(field.map((b) => b.teamId));
	const lastFourIn = field.filter((b) => b.path === "at-large").sort((a, b) => {
		const ra = order.find((r) => r.id === a.teamId)?.rank ?? 99;
		return (order.find((r) => r.id === b.teamId)?.rank ?? 99) - ra;
	}).slice(0, 4).map((b) => b.teamId);
	const out = order.filter((r) => !inField.has(r.id)).map((r) => r.id);
	return {
		lastFourIn,
		firstFourOut: out.slice(0, 4),
		nextFourOut: out.slice(4, 8),
		seedList: [...field.map((b) => b.teamId), ...out]
	};
}
function teamLabel(id, mascot = false) {
	const t = TEAM_BY_ID[id];
	if (!t) return id;
	return mascot ? `${t.name} ${t.mascot}` : t.name;
}
function recOf(state, id) {
	const t = state.teams[id];
	return t ? `${t.wins}-${t.losses}` : "";
}
function confName(id) {
	return CONFERENCES.find((c) => c.id === id)?.short ?? id;
}
function netCutoff(rows) {
	const als = rows.filter((r) => r.path === "at-large");
	if (!als.length) return 68;
	return Math.max(...als.map((r) => r.rank));
}
//#endregion
//#region src/components/game/ranks-view.tsx
function RanksView() {
	const { state } = useGame();
	const [tab, setTab] = useState("net");
	const [q, setQ] = useState("");
	if (!state) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "chip-row",
				children: [
					["net", "Eval"],
					["kenpom", "Efficiency"],
					["ap", "Writers"]
				].map(([id, label]) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: `min-h-11 rounded-full px-4 text-sm font-semibold ${tab === id ? "bg-accent text-accent-fg" : "bg-elevated"}`,
					...bindTap(() => setTab(id)),
					children: label
				}, id))
			}),
			/* @__PURE__ */ jsx("input", {
				className: "h-11 rounded-lg border border-border bg-elevated px-3 text-sm",
				placeholder: "Find a team",
				value: q,
				onChange: (e) => setQ(e.target.value)
			}),
			tab === "net" && /* @__PURE__ */ jsx(NetBoard, { q }),
			tab === "kenpom" && /* @__PURE__ */ jsx(KenpomBoard, { q }),
			tab === "ap" && /* @__PURE__ */ jsx(ApBoard, { q })
		]
	});
}
function matchQ(id, q) {
	if (!q.trim()) return true;
	const t = TEAM_BY_ID[id];
	const s = q.trim().toLowerCase();
	return Boolean(t && `${t.name} ${t.mascot} ${t.abbr} ${t.conference}`.toLowerCase().includes(s));
}
function NetBoard({ q }) {
	const { state } = useGame();
	const rows = useMemo(() => state ? netRanks(state) : [], [state]);
	if (!state) return null;
	const you = state.playerTeamId;
	const cut = netCutoff(rows);
	const shown = rows.filter((r) => matchQ(r.id, q));
	return /* @__PURE__ */ jsxs("div", {
		className: "rank-board rank-bo",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "bo-top",
			children: [/* @__PURE__ */ jsx("p", {
				className: "bo-brand",
				children: "Eval Board"
			}), /* @__PURE__ */ jsxs("p", {
				className: "bo-sub",
				children: [
					"National evaluation ranks with tournament résumés · Week ",
					state.week,
					" · ",
					state.results.length,
					" games · all ",
					rows.length,
					" teams"
				]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "rank-scroller",
			children: /* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("th", { children: "Rank" }),
				/* @__PURE__ */ jsx("th", { children: "Team" }),
				/* @__PURE__ */ jsx("th", { children: "Record" }),
				/* @__PURE__ */ jsx("th", { children: "Q1" }),
				/* @__PURE__ */ jsx("th", { children: "Q2" }),
				/* @__PURE__ */ jsx("th", { children: "Q3" }),
				/* @__PURE__ */ jsx("th", { children: "Q4" }),
				/* @__PURE__ */ jsx("th", { children: "Non-D1" })
			] }) }), /* @__PURE__ */ jsx("tbody", { children: shown.map((r) => /* @__PURE__ */ jsxs(Fragment, { children: [r.rank === cut + 1 && !q.trim() && /* @__PURE__ */ jsx("tr", {
				className: "bo-cut",
				children: /* @__PURE__ */ jsxs("td", {
					colSpan: 8,
					children: ["Current National Tournament cutoff · last at-large is Eval ", cut]
				})
			}), /* @__PURE__ */ jsxs("tr", {
				id: `net-${r.id}`,
				className: r.id === you ? "you" : void 0,
				children: [
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [r.rank, r.prevRank !== r.rank && /* @__PURE__ */ jsxs("span", {
							className: `prev ${r.prevRank > r.rank ? "up" : "down"}`,
							children: [
								r.prevRank,
								" ",
								r.prevRank > r.rank ? "▲" : "▼"
							]
						})]
					}),
					/* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", {
						className: "bo-name",
						children: teamLabel(r.id, true)
					}) }),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.wins,
							"-",
							r.losses
						]
					}),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.q1w,
							"-",
							r.q1l
						]
					}),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.q2w,
							"-",
							r.q2l
						]
					}),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.q3w,
							"-",
							r.q3l
						]
					}),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.q4w,
							"-",
							r.q4l
						]
					}),
					/* @__PURE__ */ jsxs("td", {
						className: "tabular-nums",
						children: [
							r.nonD1w,
							"-",
							r.nonD1l
						]
					})
				]
			})] }, r.id)) })] })
		})]
	});
}
function KenpomBoard({ q }) {
	const { state } = useGame();
	const rows = useMemo(() => state ? kenpom(state) : [], [state]);
	if (!state) return null;
	const you = state.playerTeamId;
	const shown = rows.filter((r) => matchQ(r.id, q));
	const em = (n, d = 2) => `${n > 0 ? "+" : ""}${n.toFixed(d)}`;
	const luck = (n) => `${n > 0 ? "+" : ""}${n.toFixed(3)}`;
	return /* @__PURE__ */ jsxs("div", {
		className: "rank-board rank-kp",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "kp-top",
				children: /* @__PURE__ */ jsx("p", {
					className: "kp-brand",
					children: "Efficiency"
				})
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "kp-title",
				children: [state.season, " Adjusted college basketball ratings"]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "kp-meta",
				children: [
					"Adjusted to average D-I on a neutral floor. Recent games weighted more. Through week ",
					state.week,
					" (",
					state.results.length,
					" games) · ",
					rows.length,
					" teams"
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "rank-scroller",
				children: /* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
					/* @__PURE__ */ jsx("th", { children: "Rk" }),
					/* @__PURE__ */ jsx("th", { children: "Team" }),
					/* @__PURE__ */ jsx("th", { children: "Conf" }),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "W-L"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "AdjEM"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "AdjO"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "AdjD"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "AdjT"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "Luck"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "SOS"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "OppO"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "OppD"
					}),
					/* @__PURE__ */ jsx("th", {
						className: "num",
						children: "NCSOS"
					})
				] }) }), /* @__PURE__ */ jsx("tbody", { children: shown.map((r) => /* @__PURE__ */ jsxs("tr", {
					id: `kp-${r.id}`,
					className: r.id === you ? "you" : void 0,
					children: [
						/* @__PURE__ */ jsx("td", {
							className: "tabular-nums",
							children: r.rank
						}),
						/* @__PURE__ */ jsx("td", {
							className: "kp-name",
							children: TEAM_BY_ID[r.id]?.name
						}),
						/* @__PURE__ */ jsx("td", { children: r.conf }),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [
								r.wins,
								"-",
								r.losses
							]
						}),
						/* @__PURE__ */ jsx("td", {
							className: "num tabular-nums",
							children: em(r.adjEM)
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [r.adjO.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.adjORank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [r.adjD.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.adjDRank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [r.adjT.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.adjTRank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [luck(r.luck), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.luckRank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [em(r.sosEM), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.sosRank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [r.oppO.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.oppORank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [r.oppD.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.oppDRank
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "num tabular-nums",
							children: [em(r.ncsos), /* @__PURE__ */ jsx("span", {
								className: "sub",
								children: r.ncsosRank
							})]
						})
					]
				}, r.id)) })] })
			})
		]
	});
}
function ApBoard({ q }) {
	const { state } = useGame();
	const rows = useMemo(() => state ? apPoll(state) : [], [state]);
	if (!state) return null;
	const you = state.playerTeamId;
	const shown = rows.filter((r) => matchQ(r.id, q));
	return /* @__PURE__ */ jsxs("div", {
		className: "rank-board rank-ap",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-end justify-between px-3 pt-3 pb-2",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-xs font-bold tracking-[0.22em] text-ap-gold",
				children: "WRITERS POLL"
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-xs text-ap-fg/70",
				children: [
					"Men's basketball · ",
					rows.length,
					" teams"
				]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "rank-scroller",
			children: /* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
				/* @__PURE__ */ jsx("th", { children: "Rk" }),
				/* @__PURE__ */ jsx("th", { children: "Team" }),
				/* @__PURE__ */ jsx("th", { children: "Rec" }),
				/* @__PURE__ */ jsx("th", { children: "Pts" }),
				/* @__PURE__ */ jsx("th", { children: "1st" })
			] }) }), /* @__PURE__ */ jsx("tbody", { children: shown.map((r) => /* @__PURE__ */ jsxs(Fragment, { children: [
				r.rank === 26 && !q.trim() && /* @__PURE__ */ jsx("tr", {
					className: "ap-cut",
					children: /* @__PURE__ */ jsx("td", {
						colSpan: 5,
						children: "Others receiving votes"
					})
				}),
				r.rank === 41 && !q.trim() && /* @__PURE__ */ jsx("tr", {
					className: "ap-cut",
					children: /* @__PURE__ */ jsx("td", {
						colSpan: 5,
						children: "Unranked ballot"
					})
				}),
				/* @__PURE__ */ jsxs("tr", {
					id: `ap-${r.id}`,
					className: r.id === you ? "you" : void 0,
					children: [
						/* @__PURE__ */ jsx("td", {
							className: "tabular-nums",
							children: r.rank
						}),
						/* @__PURE__ */ jsx("td", {
							className: "font-semibold",
							children: TEAM_BY_ID[r.id]?.name
						}),
						/* @__PURE__ */ jsx("td", {
							className: "tabular-nums",
							children: recOf(state, r.id)
						}),
						/* @__PURE__ */ jsx("td", {
							className: "tabular-nums",
							children: r.points || "—"
						}),
						/* @__PURE__ */ jsx("td", {
							className: "tabular-nums",
							children: r.first || "—"
						})
					]
				})
			] }, r.id)) })] })
		})]
	});
}
//#endregion
//#region src/components/game/bracket-view.tsx
function BracketView() {
	const { state } = useGame();
	const [tab, setTab] = useState("espn");
	if (!state) return null;
	const locked = Boolean(state.selection?.ncaa.length);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-w-0 max-w-full flex-col gap-3 overflow-x-clip",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "chip-row",
				children: [["espn", "The Desk"], ["cbs", "Sunday Board"]].map(([id, label]) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: `min-h-11 rounded-full px-4 text-sm font-semibold ${tab === id ? "bg-accent text-accent-fg" : "bg-elevated"}`,
					...bindTap(() => setTab(id)),
					children: label
				}, id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "min-w-0 text-xs text-muted",
				children: locked ? "Official field after Selection Day." : "If the dance started today. The Desk leans résumé; Sunday Board leans Eval and Efficiency."
			}),
			tab === "espn" ? /* @__PURE__ */ jsx(EspnBoard, {}) : /* @__PURE__ */ jsx(CbsBoard, {})
		]
	});
}
function regionTeams(field, region) {
	return field.filter((b) => b.region === region);
}
function seedTeams(rows, seed) {
	return rows.filter((b) => b.seed === seed);
}
function names(ids, auto, outlet) {
	return ids.map((id) => {
		const t = TEAM_BY_ID[id];
		if (!t) return id;
		return outlet === "espn" && auto ? t.name.toUpperCase() : t.name;
	}).join(" / ");
}
function EspnBoard() {
	const { state } = useGame();
	const [region, setRegion] = useState("East");
	const field = useMemo(() => state ? espnField(state) : [], [state]);
	const bubble = useMemo(() => {
		if (!state) return null;
		return bubbleLists(state, field, apPoll(state));
	}, [state, field]);
	if (!state || !bubble) return null;
	const you = state.playerTeamId;
	const rows = regionTeams(field, region);
	const sixtyEight = field.slice().sort((a, b) => a.seed - b.seed || a.region.localeCompare(b.region));
	return /* @__PURE__ */ jsxs("div", {
		className: "rank-espn",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "espn-top",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "espn-mark",
						children: "THE DESK"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "espn-title",
						children: "BRACKET"
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "espn-by",
						children: ["If the dance started today · ", state.season]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "chip-row espn-regions",
				children: NCAA_REGIONS.map((r) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: region === r ? "on" : "",
					...bindTap(() => setRegion(r)),
					children: r
				}, r))
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "espn-region",
				children: [/* @__PURE__ */ jsxs("h2", { children: [region.toUpperCase(), " REGION"] }), PAIR_64.map(([hi, lo]) => {
					const a = seedTeams(rows, hi);
					const b = seedTeams(rows, lo);
					return /* @__PURE__ */ jsxs("div", {
						className: "espn-pair",
						children: [/* @__PURE__ */ jsx(EspnGame, {
							seed: hi,
							bids: a,
							you,
							rec: a[0] ? recOf(state, a[0].teamId) : ""
						}), /* @__PURE__ */ jsx(EspnGame, {
							seed: lo,
							bids: b,
							you,
							rec: b[0] ? recOf(state, b[0].teamId) : ""
						})]
					}, `${region}-${hi}`);
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "espn-bubble",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "LAST FOUR IN" }), bubble.lastFourIn.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "FIRST FOUR OUT" }), bubble.firstFourOut.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "NEXT FOUR OUT" }), bubble.nextFourOut.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] })
				]
			}),
			/* @__PURE__ */ jsxs("details", {
				className: "espn-field",
				children: [/* @__PURE__ */ jsx("summary", { children: "Field of 68" }), /* @__PURE__ */ jsx("ul", { children: sixtyEight.map((b) => /* @__PURE__ */ jsxs("li", { children: [
					/* @__PURE__ */ jsx("span", { children: b.seed }),
					" ",
					TEAM_BY_ID[b.teamId]?.abbr ?? b.teamId
				] }, `${b.region}-${b.teamId}`)) })]
			})
		]
	});
}
function EspnGame({ seed, bids, you, rec }) {
	const auto = bids.some((x) => x.path === "auto");
	const mine = bids.some((x) => x.teamId === you);
	return /* @__PURE__ */ jsxs("div", {
		className: `espn-game ${mine ? "you" : ""}`,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "seed",
				children: seed
			}),
			/* @__PURE__ */ jsx("span", {
				className: `name ${auto ? "auto" : ""}`,
				children: names(bids.map((x) => x.teamId), auto, "espn") || "—"
			}),
			/* @__PURE__ */ jsx("span", {
				className: "rec",
				children: rec
			})
		]
	});
}
function CbsBoard() {
	const { state } = useGame();
	const [region, setRegion] = useState("East");
	const field = useMemo(() => state ? cbsField(state) : [], [state]);
	const bubble = useMemo(() => {
		if (!state) return null;
		return bubbleLists(state, field, netRanks(state));
	}, [state, field]);
	if (!state || !bubble) return null;
	const you = state.playerTeamId;
	return /* @__PURE__ */ jsxs("div", {
		className: "rank-cbs",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "cbs-top",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "cbs-mark",
						children: "SUNDAY BOARD"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "cbs-title",
						children: "National Tournament Bracket"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "cbs-by",
						children: [
							"Simulation desk · ",
							state.season,
							" field of 68"
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "chip-row cbs-regions",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: region === "all" ? "on" : "",
					...bindTap(() => setRegion("all")),
					children: "Seed lines"
				}), NCAA_REGIONS.map((r) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: region === r ? "on" : "",
					...bindTap(() => setRegion(r)),
					children: r
				}, r))]
			}),
			region === "all" ? Array.from({ length: 16 }, (_, i) => i + 1).map((seed) => /* @__PURE__ */ jsxs("section", {
				className: "cbs-line",
				children: [/* @__PURE__ */ jsxs("h3", { children: [seed, "-line"] }), /* @__PURE__ */ jsx("div", {
					className: "cbs-line-grid",
					children: NCAA_REGIONS.map((r) => {
						const teams = seedTeams(regionTeams(field, r), seed);
						const mine = teams.some((b) => b.teamId === you);
						return /* @__PURE__ */ jsxs("div", {
							className: `cbs-cell ${mine ? "you" : ""}`,
							children: [/* @__PURE__ */ jsx("span", {
								className: "reg",
								children: r
							}), teams.length ? teams.map((b) => /* @__PURE__ */ jsxs("span", {
								className: "block",
								children: [/* @__PURE__ */ jsx("span", {
									className: "cbs-name",
									children: TEAM_BY_ID[b.teamId]?.name
								}), /* @__PURE__ */ jsxs("span", {
									className: "cbs-rec",
									children: [
										recOf(state, b.teamId),
										b.path === "auto" ? " · AUTO" : "",
										b.playIn ? " · FF" : ""
									]
								})]
							}, b.teamId)) : /* @__PURE__ */ jsx("span", {
								className: "cbs-name",
								children: "—"
							})]
						}, r);
					})
				})]
			}, seed)) : /* @__PURE__ */ jsxs("section", {
				className: "cbs-line",
				children: [/* @__PURE__ */ jsxs("h3", { children: [region, " region"] }), PAIR_64.map(([hi, lo]) => {
					const a = seedTeams(regionTeams(field, region), hi);
					const b = seedTeams(regionTeams(field, region), lo);
					return /* @__PURE__ */ jsxs("div", {
						className: "cbs-pair",
						children: [/* @__PURE__ */ jsx(CbsGame, {
							seed: hi,
							bids: a,
							you,
							rec: a[0] ? recOf(state, a[0].teamId) : ""
						}), /* @__PURE__ */ jsx(CbsGame, {
							seed: lo,
							bids: b,
							you,
							rec: b[0] ? recOf(state, b[0].teamId) : ""
						})]
					}, `${region}-${hi}`);
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "cbs-bubble",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "LAST FOUR IN" }), bubble.lastFourIn.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "FIRST FOUR OUT" }), bubble.firstFourOut.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: "NEXT FOUR OUT" }), bubble.nextFourOut.map((id) => /* @__PURE__ */ jsxs("p", { children: [
						teamLabel(id),
						" ",
						recOf(state, id)
					] }, id))] })
				]
			})
		]
	});
}
function CbsGame({ seed, bids, you, rec }) {
	const mine = bids.some((x) => x.teamId === you);
	return /* @__PURE__ */ jsxs("div", {
		className: `cbs-game ${mine ? "you" : ""}`,
		children: [/* @__PURE__ */ jsx("span", {
			className: "seed-num",
			children: seed
		}), /* @__PURE__ */ jsx("span", { children: bids.length ? bids.map((b) => /* @__PURE__ */ jsxs("span", {
			className: "block",
			children: [/* @__PURE__ */ jsx("span", {
				className: "cbs-name",
				children: TEAM_BY_ID[b.teamId]?.name
			}), /* @__PURE__ */ jsxs("span", {
				className: "cbs-rec",
				children: [
					rec,
					b.path === "auto" ? " · AUTO" : "",
					b.playIn ? " · FF" : ""
				]
			})]
		}, b.teamId)) : /* @__PURE__ */ jsx("span", {
			className: "cbs-name",
			children: "—"
		}) })]
	});
}
//#endregion
//#region src/components/game/more-views.tsx
function MoreViews() {
	const { view } = useGame();
	if (view === "standings") return /* @__PURE__ */ jsx(RanksView, {});
	if (view === "news") return /* @__PURE__ */ jsx(News, {});
	if (view === "bracketology") return /* @__PURE__ */ jsx(BracketView, {});
	if (view === "bracket") return /* @__PURE__ */ jsx(BracketView, {});
	return /* @__PURE__ */ jsx(RanksView, {});
}
function News() {
	const { state } = useGame();
	if (!state) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ jsx("h1", {
			className: "font-display text-3xl",
			children: "News"
		}), /* @__PURE__ */ jsx("ul", {
			className: "flex flex-col gap-2",
			children: state.news.map((n, i) => /* @__PURE__ */ jsxs("li", {
				className: "rounded-xl border border-border bg-elevated p-3",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted",
					children: ["Week ", n.week]
				}), /* @__PURE__ */ jsx("p", {
					className: `mt-1 text-sm ${n.tone === "good" ? "text-win" : n.tone === "bad" ? "text-loss" : ""}`,
					children: n.text
				})]
			}, `${n.week}-${i}`))
		})]
	});
}
//#endregion
//#region src/components/game/feedback.tsx
function FeedbackToast() {
	const { feedback, toast, clearFeedback, clearToast } = useGame();
	if (!feedback && !toast) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "feedback-dock fixed inset-x-3 z-50 mx-auto max-w-md",
		children: [feedback && /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: clearFeedback,
			className: "w-full rounded-xl border border-border bg-elevated p-4 text-left shadow-xl",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-display text-xl",
					children: feedback.title
				}),
				feedback.detail && /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: feedback.detail
				}),
				feedback.parts.length > 0 && /* @__PURE__ */ jsx("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: feedback.parts.map((p) => /* @__PURE__ */ jsxs("span", {
						className: `rounded-full px-2.5 py-1 text-xs font-semibold ${p.delta > 0 ? "bg-win/20 text-win" : p.delta < 0 ? "bg-loss/20 text-loss" : "bg-elevated text-muted"}`,
						children: [
							p.label,
							" ",
							p.delta > 0 ? `+${p.delta}` : p.delta
						]
					}, p.label))
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-[11px] text-subtle",
					children: "Tap to dismiss"
				})
			]
		}), toast && !feedback && /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: clearToast,
			className: "w-full rounded-xl border border-loss/40 bg-elevated p-3 text-sm text-loss",
			children: toast
		})]
	});
}
//#endregion
//#region src/components/game/tutorial.tsx
var STEPS = [
	{
		title: "Office",
		body: "The office is home. Play the next game and call every possession — motion, post, press — or sim it. The play you call is the play they run."
	},
	{
		title: "Schedule",
		body: "Sort opponents by rating. You only get two games a week and 31 on the year. Bigger schools can decline if your prestige is too low."
	},
	{
		title: "Recruiting",
		body: "Sort by interest. The bar is their lean toward you. Visit without an offer if you want — it still moves the bar. Offers spend a scholarship. Zero left means the paper stays in the drawer."
	},
	{
		title: "Roster",
		body: "Tap a player for the skill chart — shoot, finish, defense, IQ — plus potential. Minutes you give them feed growth. Check-ins raise morale. Seniors leave after the offseason; OVR walks toward potential."
	},
	{
		title: "Inbox",
		body: "The AD and donors write. Use Inbox in the tab bar — or Back to office — so you're never stuck in the mail."
	},
	{
		title: "March",
		body: "After league tournaments, Selection Day names the 68. Ranks, news, and Bracket live under More. The Invite and The Crown sit behind the National cut."
	}
];
function Tutorial() {
	const { skipTutorial, finishTutorial } = useGame();
	const [i, setI] = useState(0);
	const step = STEPS[i];
	const last = i === STEPS.length - 1;
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-dvh flex-col bg-bg px-5 py-10 text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex w-full max-w-lg flex-1 flex-col",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs tracking-[0.18em] text-muted uppercase",
						children: "How this job works"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-11 text-sm text-muted",
						onClick: skipTutorial,
						children: "Skip tutorial"
					})]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "mt-6 text-xs text-subtle",
					children: [
						i + 1,
						" / ",
						STEPS.length
					]
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-2 text-4xl",
					children: step.title
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-4 text-base leading-relaxed text-muted",
					children: step.body
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-auto flex gap-2 pt-10",
					children: [i > 0 && /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-12 flex-1 rounded-lg bg-elevated font-semibold",
						onClick: () => setI(i - 1),
						children: "Back"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "min-h-12 flex-[2] rounded-lg bg-accent font-semibold text-accent-fg",
						onClick: () => last ? finishTutorial() : setI(i + 1),
						children: last ? "Take the job" : "Next"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/components/game/game-view.tsx
function GameView() {
	const { state, runCall, simRest, leaveGame } = useGame();
	const live = state?.liveGame;
	if (!state || !live) return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-fg",
		children: [/* @__PURE__ */ jsx("p", {
			className: "font-display text-3xl",
			children: "Game's over"
		}), /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "min-h-12 rounded-lg bg-accent px-6 font-semibold text-accent-fg",
			...bindTap(leaveGame),
			children: "Office"
		})]
	});
	const home = TEAM_BY_ID[live.homeId];
	const away = TEAM_BY_ID[live.awayId];
	const youHome = live.homeId === state.playerTeamId;
	const youOff = liveYouOffense(state);
	const last = live.log.find((e) => e.kind && e.kind !== "period") ?? live.log[0];
	const calls = offeredCalls(state);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-dvh flex-col bg-bg px-4 pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom)+var(--vv-bottom,0px))] text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex w-full max-w-lg flex-1 flex-col",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs tracking-[0.18em] text-muted uppercase",
					children: clockLabel(live.half, live.clock)
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ jsx(ScoreCard, {
						name: home.abbr,
						score: live.homeScore,
						you: youHome,
						color: home.color,
						hasBall: live.poss === "home"
					}), /* @__PURE__ */ jsx(ScoreCard, {
						name: away.abbr,
						score: live.awayScore,
						you: !youHome,
						color: away.color,
						hasBall: live.poss === "away"
					})]
				}),
				/* @__PURE__ */ jsx(Gamecast, {
					live,
					homeColor: home.color,
					awayColor: away.color
				}),
				last && /* @__PURE__ */ jsxs("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ jsxs("p", {
						className: "text-sm leading-relaxed",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-xs text-muted",
							children: [last.t, " · "]
						}), last.text]
					}), last.impact && /* @__PURE__ */ jsx("p", {
						className: `mt-2 text-sm font-semibold ${(last.pts ?? 0) > 0 ? "text-win" : "text-loss"}`,
						children: last.impact
					})]
				}),
				live.done ? /* @__PURE__ */ jsxs("div", {
					className: "mt-8",
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-display text-3xl",
						children: "Final"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "mt-4 min-h-12 w-full rounded-lg bg-accent font-semibold text-accent-fg",
						...bindTap(leaveGame),
						children: "Continue"
					})]
				}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx("p", {
						className: "mt-6 text-[11px] tracking-[0.16em] text-subtle uppercase",
						children: youOff ? "Your ball — pick a call" : "Them — pick a defense"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: calls.map((c) => /* @__PURE__ */ jsx("button", {
							type: "button",
							...bindTap(() => runCall(c.side, c.id)),
							className: "min-h-14 rounded-xl border border-border bg-elevated px-3 py-3 text-left text-sm font-semibold",
							children: c.label
						}, String(c.id)))
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "mt-3 min-h-11 w-full text-sm text-muted",
						...bindTap(simRest),
						children: "Sim rest of game"
					})
				] }),
				/* @__PURE__ */ jsx("ul", {
					className: "mt-6 max-h-40 space-y-2 overflow-auto text-xs text-muted",
					children: live.log.filter((e) => e !== last).slice(0, 10).map((e, i) => /* @__PURE__ */ jsxs("li", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "text-subtle",
							children: e.t
						}),
						" · ",
						e.text
					] }, `${e.t}-${i}`))
				})
			]
		})
	});
}
function ScoreCard({ name, score, you, color, hasBall }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `rounded-xl border px-3 py-3 ${you ? "border-accent bg-elevated" : "border-border bg-surface"}`,
		children: [/* @__PURE__ */ jsxs("p", {
			className: "flex items-center gap-2 text-[11px] tracking-widest uppercase",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "size-2 rounded-full",
					style: { background: color }
				}),
				name,
				" ",
				you ? "· you" : "",
				hasBall && /* @__PURE__ */ jsx("span", {
					className: "ml-auto text-[10px] tracking-normal text-accent",
					children: "ball"
				})
			]
		}), /* @__PURE__ */ jsx("p", {
			className: "font-display mt-1 text-4xl tabular-nums",
			children: score
		})]
	});
}
function Gamecast({ live, homeColor, awayColor }) {
	const marks = live.log.filter((e) => e.kind && e.kind !== "period" && e.x != null && e.y != null).slice(0, 12);
	const last = marks[0];
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-4 overflow-hidden rounded-xl border border-border bg-[#1a3a24]",
		children: [/* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 94 50",
			className: "block h-auto w-full",
			role: "img",
			"aria-label": "Gamecast floor",
			children: [
				/* @__PURE__ */ jsx("rect", {
					width: "94",
					height: "50",
					fill: "#1a3a24"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: "1",
					y: "1",
					width: "92",
					height: "48",
					fill: "none",
					stroke: "rgba(242,241,236,0.35)",
					strokeWidth: "0.4"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: "47",
					y1: "1",
					x2: "47",
					y2: "49",
					stroke: "rgba(242,241,236,0.28)",
					strokeWidth: "0.3"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: "47",
					cy: "25",
					r: "6",
					fill: "none",
					stroke: "rgba(242,241,236,0.28)",
					strokeWidth: "0.3"
				}),
				/* @__PURE__ */ jsx(Key, { x: 0 }),
				/* @__PURE__ */ jsx(Key, { x: 75 }),
				/* @__PURE__ */ jsx(Arc, {
					cx: 5.25,
					right: false
				}),
				/* @__PURE__ */ jsx(Arc, {
					cx: 88.75,
					right: true
				}),
				/* @__PURE__ */ jsx(Hoop, { cx: 5.25 }),
				/* @__PURE__ */ jsx(Hoop, { cx: 88.75 }),
				marks.slice().reverse().map((e, i) => /* @__PURE__ */ jsx(Mark, {
					e,
					homeColor,
					awayColor,
					dim: e !== last
				}, `${e.t}-${i}`))
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between bg-black/35 px-3 py-1.5 text-[10px] tracking-widest text-[#d5e0d4] uppercase",
			children: [/* @__PURE__ */ jsx("span", { children: "Gamecast" }), /* @__PURE__ */ jsxs("span", { children: [last?.kind === "three" ? "3PT" : last?.kind === "two" ? "2PT" : last?.kind === "ft" ? "FT" : last?.kind === "to" ? "TO" : "LIVE", last && last.kind !== "period" ? last.made ? " · good" : last.kind === "to" ? "" : " · miss" : ""] })]
		})]
	});
}
function Key({ x }) {
	return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
		x: x + 1,
		y: "16",
		width: "18",
		height: "18",
		fill: "none",
		stroke: "rgba(242,241,236,0.28)",
		strokeWidth: "0.3"
	}), /* @__PURE__ */ jsx("circle", {
		cx: x + 19,
		cy: "25",
		r: "6",
		fill: "none",
		stroke: "rgba(242,241,236,0.22)",
		strokeWidth: "0.3"
	})] });
}
function Arc({ cx, right }) {
	const s = right ? 1 : -1;
	return /* @__PURE__ */ jsx("path", {
		d: `M ${cx + s * 3} 3.2 L ${cx + s * 3} 8 A 22.15 22.15 0 0 ${right ? 1 : 0} ${cx + s * 3} 42 L ${cx + s * 3} 46.8`,
		fill: "none",
		stroke: "rgba(242,241,236,0.32)",
		strokeWidth: "0.3"
	});
}
function Hoop({ cx }) {
	return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
		x1: cx < 47 ? 1 : 93,
		y1: "17",
		x2: cx < 47 ? 1 : 93,
		y2: "33",
		stroke: "rgba(242,241,236,0.4)",
		strokeWidth: "0.5"
	}), /* @__PURE__ */ jsx("circle", {
		cx,
		cy: "25",
		r: "0.9",
		fill: "none",
		stroke: "#c45c3e",
		strokeWidth: "0.35"
	})] });
}
function Mark({ e, homeColor, awayColor, dim }) {
	const fill = e.poss === "away" ? awayColor : homeColor;
	const r = e.kind === "three" ? 1.35 : 1.1;
	if (e.kind === "to") return /* @__PURE__ */ jsxs("g", {
		opacity: dim ? .35 : 1,
		transform: `translate(${e.x}, ${e.y})`,
		children: [/* @__PURE__ */ jsx("line", {
			x1: -1.2,
			y1: -1.2,
			x2: 1.2,
			y2: 1.2,
			stroke: "#c48982",
			strokeWidth: "0.45"
		}), /* @__PURE__ */ jsx("line", {
			x1: 1.2,
			y1: -1.2,
			x2: -1.2,
			y2: 1.2,
			stroke: "#c48982",
			strokeWidth: "0.45"
		})]
	});
	return /* @__PURE__ */ jsx("circle", {
		cx: e.x,
		cy: e.y,
		r,
		fill: e.made ? fill : "none",
		stroke: fill,
		strokeWidth: "0.45",
		opacity: dim ? .4 : 1
	});
}
//#endregion
//#region src/components/game/selection-show.tsx
var ORDER = [
	"intro",
	"ones",
	"twos",
	"threes",
	"rest",
	"you"
];
function SelectionShow() {
	const { state, finishSelectionShow, setView } = useGame();
	const [beat, setBeat] = useState("intro");
	const field = state?.selection?.ncaa ?? [];
	const youId = state?.playerTeamId ?? "";
	const you = field.find((b) => b.teamId === youId);
	const bySeed = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		for (const b of field) {
			const list = m.get(b.seed) ?? [];
			list.push(b);
			m.set(b.seed, list);
		}
		return m;
	}, [field]);
	if (!state) return null;
	const i = ORDER.indexOf(beat);
	function next() {
		const n = ORDER[i + 1];
		if (!n) {
			finishSelectionShow();
			return;
		}
		setBeat(n);
	}
	const nit = state.selection?.nit.includes(youId);
	const crown = state.selection?.crown.includes(youId);
	const school = TEAM_BY_ID[youId];
	return /* @__PURE__ */ jsxs("div", {
		className: "sel-show",
		children: [/* @__PURE__ */ jsx("div", { className: "sel-bar" }), /* @__PURE__ */ jsxs("div", {
			className: "sel-inner",
			children: [
				/* @__PURE__ */ jsxs("p", {
					className: "sel-kicker",
					children: ["Selection Day · ", state.season]
				}),
				beat === "intro" && /* @__PURE__ */ jsxs("div", {
					className: "sel-beat",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "sel-title",
						children: "The committee has set the field."
					}), /* @__PURE__ */ jsx("p", {
						className: "sel-copy",
						children: "68 teams. Four 1-seeds. Play-in in Dayton. Your name is in the envelope — or it isn’t."
					})]
				}),
				beat === "ones" && /* @__PURE__ */ jsx(SeedLine, {
					n: 1,
					rows: bySeed.get(1) ?? [],
					youId,
					rec: (id) => recOf(state, id)
				}),
				beat === "twos" && /* @__PURE__ */ jsx(SeedLine, {
					n: 2,
					rows: bySeed.get(2) ?? [],
					youId,
					rec: (id) => recOf(state, id)
				}),
				beat === "threes" && /* @__PURE__ */ jsx(SeedLine, {
					n: 3,
					rows: bySeed.get(3) ?? [],
					youId,
					rec: (id) => recOf(state, id)
				}),
				beat === "rest" && /* @__PURE__ */ jsxs("div", {
					className: "sel-beat",
					children: [
						/* @__PURE__ */ jsx("h1", {
							className: "sel-title",
							children: "The rest of the field"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "sel-rest",
							children: Array.from({ length: 13 }, (_, x) => x + 4).map((seed) => /* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("span", {
								className: "sel-seed-n",
								children: seed
							}), (bySeed.get(seed) ?? []).map((b) => /* @__PURE__ */ jsxs("span", {
								className: b.teamId === youId ? "sel-you" : "",
								children: [TEAM_BY_ID[b.teamId]?.abbr ?? b.teamId, b.playIn ? "*" : ""]
							}, b.teamId))] }, seed))
						}),
						/* @__PURE__ */ jsx("p", {
							className: "sel-copy",
							children: "* Play-in"
						})
					]
				}),
				beat === "you" && /* @__PURE__ */ jsxs("div", {
					className: "sel-beat sel-envelope",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "sel-kicker",
							children: "Your envelope"
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "sel-title",
							children: you ? `${you.seed} seed · ${you.region}` : nit ? "The Invite" : crown ? "The Crown" : "Home for March"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "sel-copy",
							children: [
								school?.name,
								" ",
								recOf(state, youId),
								you ? ` · ${you.path === "auto" ? "auto bid" : "at-large"}${you.playIn ? " · Play-in" : ""}` : ""
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "sel-actions",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "sel-btn",
							...bindTap(next),
							children: beat === "intro" ? "Open the envelope" : beat === "you" ? "See the bracket" : "Next"
						}),
						beat !== "you" && /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "sel-skip",
							...bindTap(finishSelectionShow),
							children: "Skip to the board"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "sel-skip",
							...bindTap(() => setView("hub")),
							children: "Office"
						})
					]
				})
			]
		})]
	});
}
function SeedLine({ n, rows, youId, rec }) {
	const byRegion = (r) => rows.filter((b) => b.region === r);
	return /* @__PURE__ */ jsxs("div", {
		className: "sel-beat",
		children: [/* @__PURE__ */ jsxs("h1", {
			className: "sel-title",
			children: [
				"The ",
				n,
				"-seeds"
			]
		}), /* @__PURE__ */ jsx("ul", {
			className: "sel-quad",
			children: NCAA_REGIONS.map((region) => {
				const bids = byRegion(region);
				return /* @__PURE__ */ jsxs("li", {
					className: bids.some((b) => b.teamId === youId) ? "sel-you-card" : "",
					children: [/* @__PURE__ */ jsx("p", {
						className: "sel-reg",
						children: region
					}), bids.map((b) => /* @__PURE__ */ jsxs("p", {
						className: "sel-team",
						children: [TEAM_BY_ID[b.teamId]?.name, /* @__PURE__ */ jsx("span", { children: rec(b.teamId) })]
					}, b.teamId))]
				}, region);
			})
		})]
	});
}
//#endregion
//#region src/lib/safari.ts
/**
* visualViewport events (not window.scroll):
*
* resize — size changed (keyboard, URL bar, pinch). iOS offsetTop is often
*   stale in the callback (WebKit 237851); read after a double rAF.
* scroll — visual rect moved over the layout rect (keyboard slide, pinch pan).
*   offsetTop/offsetLeft change; pageTop/window.scrollY are the DOCUMENT
*   and must not drive the dock (schedule scroll would shove the tabs).
*
* Dock gap uses offsetTop, never pageTop. Pinch-zoom (scale ≠ 1) is ignored
* so a pan does not look like a keyboard. Scroll writes are skipped if
* nothing changed so 60fps pans do not thrash CSS.
*/
function installSafariChrome() {
	const root = document.documentElement;
	if ((() => {
		try {
			return window.self !== window.top;
		} catch {
			return true;
		}
	})()) root.classList.add("is-framed");
	let raf = 0;
	let raf2 = 0;
	let lastGap = -1;
	let lastTop = -1;
	let lastHeight = -1;
	const measure = () => {
		raf = 0;
		raf2 = 0;
		const vv = window.visualViewport;
		let gap = 0;
		let top = 0;
		let height = window.innerHeight;
		if (vv) {
			top = Math.round(vv.offsetTop);
			height = Math.round(vv.height);
			if (!(vv.scale > 1.02 || vv.scale < .98)) gap = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
		}
		if (gap === lastGap && top === lastTop && height === lastHeight) return;
		lastGap = gap;
		lastTop = top;
		lastHeight = height;
		root.style.setProperty("--vv-bottom", `${gap}px`);
		root.style.setProperty("--vv-top", `${top}px`);
		root.style.setProperty("--vv-height", `${height}px`);
		root.classList.toggle("vv-keyboard", gap > 80);
	};
	const onResize = () => {
		if (raf) return;
		raf = requestAnimationFrame(() => {
			raf2 = requestAnimationFrame(measure);
		});
	};
	const onScroll = () => {
		if (raf) return;
		raf = requestAnimationFrame(measure);
	};
	const opts = { passive: true };
	onResize();
	window.visualViewport?.addEventListener("resize", onResize, opts);
	window.visualViewport?.addEventListener("scroll", onScroll, opts);
	window.addEventListener("orientationchange", onResize, opts);
	window.addEventListener("resize", onResize, opts);
	document.addEventListener("focusin", onResize, opts);
	document.addEventListener("focusout", onResize, opts);
	return () => {
		if (raf) cancelAnimationFrame(raf);
		if (raf2) cancelAnimationFrame(raf2);
		window.visualViewport?.removeEventListener("resize", onResize);
		window.visualViewport?.removeEventListener("scroll", onScroll);
		window.removeEventListener("orientationchange", onResize);
		window.removeEventListener("resize", onResize);
		document.removeEventListener("focusin", onResize);
		document.removeEventListener("focusout", onResize);
	};
}
//#endregion
//#region src/components/game/saves-view.tsx
function SavesView() {
	const { state, saves, saveNow, loadFile, dropFile, setView, toast } = useGame();
	const [name, setName] = useState("");
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-dvh bg-bg px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom)+var(--vv-bottom,0px))] text-fg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-lg",
			children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-11 text-xs tracking-[0.18em] text-muted uppercase",
					...bindTap(() => setView(state ? "hub" : "title")),
					children: "Back"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-1 text-4xl",
					children: "Saves"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted",
					children: "Autosave runs in the background. Manual files stay until you delete them."
				}),
				state && /* @__PURE__ */ jsxs("form", {
					className: "mt-5 flex flex-col gap-2",
					onSubmit: (e) => {
						e.preventDefault();
						saveNow(name);
						setName("");
					},
					children: [/* @__PURE__ */ jsx("input", {
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: `Season ${state.season} quick save`,
						className: "min-h-12 rounded-lg border border-border bg-elevated px-3 text-fg"
					}), /* @__PURE__ */ jsx("button", {
						type: "submit",
						className: "min-h-12 rounded-lg bg-accent font-semibold text-accent-fg",
						children: "Save now"
					})]
				}),
				toast && /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-loss",
					children: toast
				}),
				/* @__PURE__ */ jsxs("ul", {
					className: "mt-6 flex flex-col gap-2",
					children: [saves.length === 0 && /* @__PURE__ */ jsx("li", {
						className: "text-sm text-muted",
						children: "No files on this device yet."
					}), saves.map((m) => /* @__PURE__ */ jsx(SlotRow, {
						m,
						onLoad: () => loadFile(m.id),
						onDrop: () => dropFile(m.id)
					}, m.id))]
				})
			]
		})
	});
}
function SlotRow({ m, onLoad, onDrop }) {
	const school = TEAM_BY_ID[m.teamId];
	const when = new Date(m.updatedAt).toLocaleString();
	return /* @__PURE__ */ jsxs("li", {
		className: "rounded-xl border border-border bg-elevated p-3",
		children: [
			/* @__PURE__ */ jsxs("p", {
				className: "font-semibold",
				children: [
					m.name,
					" ",
					m.auto ? /* @__PURE__ */ jsx("span", {
						className: "text-xs font-normal text-muted",
						children: "autosave"
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-xs text-muted",
				children: [
					m.coach,
					" · ",
					school?.name ?? m.teamId,
					" · ",
					m.season,
					" · ",
					m.wins,
					"-",
					m.losses
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-0.5 text-[11px] text-subtle",
				children: when
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-11 flex-1 rounded-lg bg-accent font-semibold text-accent-fg",
					...bindTap(onLoad),
					children: "Load"
				}), !m.auto && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "min-h-11 rounded-lg px-4 text-sm text-loss",
					...bindTap(onDrop),
					children: "Delete"
				})]
			})
		]
	});
}
//#endregion
//#region src/game/App.tsx
function GameApp() {
	const { hydrate, view, state, starting } = useGame();
	useEffect(() => {
		hydrate();
	}, [hydrate]);
	useEffect(() => installIosTaps(), []);
	useEffect(() => installSafariChrome(), []);
	if (view === "saves") return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(SavesView, {}), /* @__PURE__ */ jsx(FeedbackToast, {})] });
	if (view === "title" || view === "create" || view === "select" || view === "eras" || !state) return /* @__PURE__ */ jsxs(Fragment$1, { children: [starting && view !== "title" && /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 text-fg",
		children: [/* @__PURE__ */ jsx("p", {
			className: "font-display text-3xl",
			children: "Loading the board"
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-2 text-sm text-muted",
			children: "365 teams. One job."
		})]
	}), /* @__PURE__ */ jsx(TitleFlow, {})] });
	if (view === "tutorial") return /* @__PURE__ */ jsx(Tutorial, {});
	if (view === "selection") return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(SelectionShow, {}), /* @__PURE__ */ jsx(FeedbackToast, {})] });
	if (view === "game") return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(GameView, {}), /* @__PURE__ */ jsx(FeedbackToast, {})] });
	if (view === "presser") return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(PresserView, {}), /* @__PURE__ */ jsx(FeedbackToast, {})] });
	return /* @__PURE__ */ jsxs(Shell, { children: [
		view === "hub" && /* @__PURE__ */ jsx(Hub, {}),
		view === "roster" && /* @__PURE__ */ jsx(RosterView, {}),
		view === "schedule" && /* @__PURE__ */ jsx(ScheduleView, {}),
		view === "recruiting" && /* @__PURE__ */ jsx(RecruitingView, {}),
		view === "inbox" && /* @__PURE__ */ jsx(InboxView, {}),
		(view === "standings" || view === "news" || view === "bracketology" || view === "bracket" || view === "team") && /* @__PURE__ */ jsx(MoreViews, {}),
		/* @__PURE__ */ jsx(FeedbackToast, {})
	] });
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Home() {
	return /* @__PURE__ */ jsx(GameApp, {});
}
//#endregion
export { Home as component };
