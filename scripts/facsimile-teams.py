#!/usr/bin/env python3
"""Rewrite display names in src/game/teams.ts with unlicensed facsimiles. IDs stay."""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

ROOT = Path("/workspace/src/game/teams.ts")
text = ROOT.read_text()

CONFS = [
    ("AE", "North Atlantic", "N. Atl.", 54),
    ("AAC", "Gulf Circuit", "Gulf", 64),
    ("ACC", "Coastal", "Coastal", 76),
    ("ASUN", "Sunshine", "Sun", 52),
    ("A10", "Tenfold", "Tenfold", 64),
    ("BE", "Eastern", "Eastern", 76),
    ("BSKY", "High Country", "High Ctry", 52),
    ("BSOU", "Carolina Hills", "Hills", 52),
    ("B10", "Great Lakes", "Lakes", 77),
    ("B12", "Plains", "Plains", 78),
    ("BW", "Pacific West", "Pac West", 56),
    ("CAA", "Tidewater", "Tidewater", 56),
    ("CUSA", "Mid-South", "Mid-South", 58),
    ("HOR", "Lakeshore", "Shore", 54),
    ("IVY", "Ancient Eight", "Eight", 58),
    ("MAAC", "Metro East", "Metro", 54),
    ("MAC", "Heartland", "Heartland", 56),
    ("MEAC", "Mid-Atlantic", "Mid-Atl", 48),
    ("MVC", "Valley", "Valley", 62),
    ("MW", "Mountain", "Mountain", 64),
    ("NEC", "Northeast Ridge", "Ridge", 48),
    ("OVC", "River", "River", 52),
    ("PAT", "Heritage", "Heritage", 52),
    ("P12", "Pacific Slope", "Slope", 72),
    ("SEC", "Southern", "Southern", 78),
    ("SOC", "Appalachian", "App", 56),
    ("SLAND", "Bayou", "Bayou", 52),
    ("SWAC", "Delta", "Delta", 48),
    ("SUM", "Prairie", "Prairie", 54),
    ("SBC", "Sun Circuit", "Sun Cir", 58),
    ("UAC", "Heartland South", "H. South", 54),
    ("WCC", "Pacific Rim", "Rim", 62),
]

# Only when the city is shared, or the real school name *is* the city mark we must not use.
NAME = {
    "kentucky": "Lexington",
    "duke": "Durham",
    "unc": "Chapel Hill",
    "kansas": "Lawrence",
    "ucla": "Westwood",
    "usc": "Exposition",
    "uconn": "Storrs",
    "indiana": "Bloomington",
    "gonzaga": "Spokane",
    "alabama": "Tuscaloosa",
    "auburn": "Plains",
    "florida": "Gainesville",
    "tennessee": "Knoxville",
    "ohio-state": "Columbus",
    "michigan": "Ann Arbor",
    "michigan-state": "East Lansing",
    "purdue": "West Lafayette",
    "villanova": "Main Line",
    "houston": "Bayou City",
    "baylor": "Waco",
    "iowa-state": "Ames",
    "arizona": "Tucson",
    "arizona-state": "Tempe",
    "texas": "Austin",
    "texas-am": "Station",
    "arkansas": "Fayetteville",
    "louisville": "Falls City",
    "notre-dame": "South Bend",
    "syracuse": "Salt City",
    "virginia": "Grounds",
    "wisconsin": "Madison",
    "illinois": "Champaign",
    "creighton": "Omaha West",
    "marquette": "Milwaukee East",
    "st-johns": "Queens",
    "xavier": "Norwood",
    "dayton": "Gem City",
    "memphis": "Bluff City",
    "clemson": "Fort Hill",
    "nc-state": "Raleigh",
    "wake-forest": "Winston",
    "miami": "Coral Gables",
    "pitt": "Steel City",
    "stanford": "The Farm",
    "cal": "Berkeley",
    "oregon": "Eugene",
    "oregon-state": "Corvallis",
    "washington": "Montlake",
    "washington-state": "Pullman",
    "byu": "Provo",
    "utah": "Salt Lake",
    "colorado": "Boulder",
    "oklahoma": "Norman",
    "oklahoma-state": "Stillwater",
    "west-virginia": "Morgantown",
    "lsu": "Bayou Rouge",
    "ole-miss": "Oxford",
    "mississippi-state": "Starkville",
    "missouri": "Flat Branch",
    "south-carolina": "Congaree",
    "vanderbilt": "West End",
    "georgia": "Athens GA",
    "fsu": "Cascades",
    "georgia-tech": "Midtown",
    "penn-state": "University Park",
    "maryland": "College Park",
    "iowa": "Iowa City",
    "minnesota": "Minneapolis",
    "nebraska": "Lincoln",
    "northwestern": "Evanston",
    "rutgers": "Piscataway",
    "saint-marys": "Moraga",
    "san-diego-state": "Mission Valley",
    "texas-tech": "Lubbock",
    "tcu": "Fort Worth",
    "ucf": "Orlando",
    "cincinnati": "Clifton",
    "kansas-state": "Manhattan KS",
    "seton-hall": "South Orange",
    "providence": "College Hill RI",
    "georgetown": "The Harbor",
    "depaul": "Lincoln Park",
    "butler": "Hinkle",
    "boston-college": "Chestnut Hill",
    "smu": "Park Cities",
    "temple": "Broad Street",
    "lasalle": "Olney",
    "saint-josephs": "Overbrook",
    "penn": "University City",
    "drexel": "Powelton",
    "vcu": "Monroe Park",
    "richmond": "The Fan",
    "george-washington": "Foggy Bottom",
    "howard": "Shaw",
    "american": "Tenleytown",
    "loyola-chicago": "Rogers Park",
    "uic": "West Loop",
    "chicago-state": "Pullman IL",
    "lmu": "Playa",
    "northeastern": "Fenway",
    "boston-u": "Kenmore",
    "rice": "Hermann",
    "houston-christian": "Sharpstown",
    "texas-southern": "Third Ward",
    "nc-central": "Hillside",
    "fiu": "Sweetwater",
    "unf": "Northside",
    "jacksonville": "Arlington FL",
    "bellarmine": "Newburg",
    "tennessee-state": "North Nashville",
    "lipscomb": "Green Hills",
    "belmont": "Music Row",
    "georgia-state": "Downtown ATL",
    "coppin-state": "Coppin Heights",
    "morgan-state": "Coldspring",
    "umbc": "Catonsville",
    "loyola-maryland": "Evergreen",
    "san-diego": "Alcala",
    "uc-san-diego": "La Jolla",
    "seattle": "Capitol Hill WA",
    "portland": "West Hills",
    "portland-state": "Park Blocks",
    "tulane": "Uptown",
    "new-orleans": "Lakefront",
    "southern": "Scotlandville",
    "famu": "Frenchtown",
    "cal-baptist": "Magnolia",
    "uc-riverside": "Box Springs",
    "ecu": "Uptown Green",
    "furman": "Poinsett",
    "njit": "University Heights",
    "delaware": "The Green",
    "lafayette": "College Hill PA",
    "stonehill": "Easton Green",
    "wright-state": "Nutter",
    "fairfield": "The Sound",
    "sacred-heart": "Park Avenue",
    "unh": "Durham North",
    "columbia": "Morningside",
    "harvard": "Cambridge",
    "yale": "New Haven",
    "princeton": "Nassau",
    "brown": "College Hill RI",
    "dartmouth": "Hanover",
    "cornell": "Ithaca",
    "army": "The Point",
    "navy": "Annapolis",
    "air-force": "The Academy",
    "unlv": "The Strip",
    "nevada": "Truckee",
    "new-mexico": "Albuquerque",
    "wyoming": "Laramie",
    "boise-state": "Boise",
    "colorado-state": "Fort Collins",
    "utah-state": "Logan",
    "fresno-state": "Fresno",
    "grand-canyon": "Phoenix West",
    "hawaii": "Manoa",
    "pepperdine": "The Bluff",
    "santa-clara": "Mission",
    "san-francisco": "The Hill",
    "pacific": "Stockton",
    "denver": "Capitol Hill CO",
    "virginia-tech": "Blacksburg",
    "liberty": "Lynchburg",
    "jmu": "Harrisonburg",
    "odu": "Hampton Roads",
    "app-state": "Boone",
    "ohio": "Athens OH",
    "georgia": "Athens GA",
    "miami-oh": "Oxford OH",
    "ole-miss": "Oxford MS",
    "vermont": "Burlington",
    "albany": "Albany",
    "maine": "Orono",
    "omaha": "Omaha East",
    "milwaukee": "Milwaukee West",
    "st-bonaventure": "Allegany",
    "uri": "Kingston",
    "fordham": "Rose Hill",
    "george-mason": "Fairfax",
    "davidson": "Davidson",
    "vmi": "Lexington VA",
    "citadel": "The Corps",
    "high-point": "High Point",
    "charleston": "Harbor City",
    "hofstra": "Hempstead",
    "towson": "Towson",
    "uncw": "Wilmington NC",
    "william-mary": "Williamsburg",
    "ncat": "Greensboro East",
    "unc-greensboro": "Greensboro West",
    "elon": "Elon",
    "campbell": "Buies Creek",
    "stony-brook": "Stony Brook",
    "monmouth": "West Long Branch",
    "hampton": "Hampton",
    "bryant": "Smithfield",
    "binghamton": "Vestal",
    "umass-lowell": "Lowell",
    "charlotte": "Charlotte",
    "fau": "Boca Raton",
    "usf": "Tampa",
    "north-texas": "Denton",
    "utsa": "San Antonio",
    "uab": "Birmingham",
    "tulsa": "Tulsa",
    "wichita-state": "Wichita",
    "bradley": "Peoria",
    "drake": "Des Moines",
    "northern-iowa": "Cedar Falls",
    "illinois-state": "Normal",
    "indiana-state": "Terre Haute",
    "murray-state": "Murray",
    "akron": "Akron",
    "kent-state": "Kent",
    "toledo": "Toledo",
    "umass": "Amherst",
    "wofford": "Spartanburg West",
    "usc-upstate": "Spartanburg East",
    "chattanooga": "Chattanooga",
    "western-carolina": "Cullowhee",
    "etsu": "Johnson City",
    "mercer": "Macon",
    "samford": "Homewood",
    "winthrop": "Rock Hill",
    "radford": "Radford",
    "longwood": "Farmville",
}

ABBR = {
    "kentucky": "LEX",
    "duke": "DUR",
    "unc": "CHH",
    "kansas": "LAW",
    "ucla": "WWD",
    "usc": "EXP",
    "uconn": "STO",
    "indiana": "BLO",
    "gonzaga": "SPK",
    "alabama": "TUS",
    "auburn": "PLN",
    "florida": "GNV",
    "tennessee": "KNX",
    "ohio-state": "CLB",
    "michigan": "AA",
    "michigan-state": "EL",
    "purdue": "WLA",
    "villanova": "MLN",
    "houston": "BAY",
    "baylor": "WAC",
    "iowa-state": "AME",
    "arizona": "TUC",
    "arizona-state": "TEM",
    "texas": "AUS",
    "texas-am": "STA",
    "arkansas": "FAY",
    "louisville": "FLS",
    "notre-dame": "SBN",
    "syracuse": "SLT",
    "virginia": "GRD",
    "wisconsin": "MAD",
    "illinois": "CHM",
    "creighton": "OMA",
    "marquette": "MKE",
    "st-johns": "QNS",
    "xavier": "NOR",
    "dayton": "GEM",
    "memphis": "BLF",
    "clemson": "FTH",
    "nc-state": "RAL",
    "wake-forest": "WIN",
    "miami": "CGB",
    "pitt": "STL",
    "stanford": "FRM",
    "cal": "BRK",
    "oregon": "EUG",
    "oregon-state": "COR",
    "washington": "MTK",
    "washington-state": "PUL",
    "byu": "PRV",
    "utah": "SLC",
    "colorado": "BLD",
    "oklahoma": "NRM",
    "oklahoma-state": "STW",
    "west-virginia": "MGN",
    "lsu": "BRG",
    "ole-miss": "OXF",
    "mississippi-state": "STK",
    "missouri": "FLT",
    "south-carolina": "CGR",
    "vanderbilt": "WEN",
    "georgia": "ATH",
    "fsu": "CAS",
    "georgia-tech": "MID",
    "penn-state": "UPK",
    "maryland": "CPK",
    "iowa": "IC",
    "minnesota": "MIN",
    "nebraska": "LNC",
    "northwestern": "EVA",
    "rutgers": "PIS",
    "saint-marys": "MOR",
    "san-diego-state": "MSV",
    "texas-tech": "LBB",
    "tcu": "FTW",
    "ucf": "ORL",
    "cincinnati": "CLF",
    "kansas-state": "MHK",
    "seton-hall": "SO",
    "providence": "PVD",
    "georgetown": "HBR",
    "depaul": "LPK",
    "butler": "HNK",
    "boston-college": "CHL",
    "smu": "PKC",
    "harvard": "CAM",
    "yale": "NHV",
    "princeton": "NAS",
    "army": "PT",
    "navy": "ANN",
    "air-force": "ACD",
    "unlv": "STP",
    "gonzaga": "SPK",
}

MASCOTS = [
    "Anvils", "Ash", "Basins", "Beacons", "Bights", "Bluffs", "Brakes", "Brine",
    "Cairns", "Canals", "Canyons", "Capes", "Cedars", "Chalk", "Channels", "Cinders",
    "Cliffs", "Coals", "Coasts", "Compass", "Copper", "Coves", "Crags", "Crests",
    "Currents", "Dales", "Docks", "Drifts", "Dunes", "Eddies", "Embers", "Falls",
    "Fathoms", "Faults", "Ferns", "Fields", "Finches", "Fjords", "Flares", "Flints",
    "Flumes", "Folds", "Fords", "Forges", "Forks", "Frost", "Gales", "Gates",
    "Glaciers", "Glades", "Grain", "Granite", "Groves", "Gulfs", "Harbors", "Hatches",
    "Havens", "Hearths", "Heaths", "Hedges", "Hollows", "Inlets", "Irons", "Isles",
    "Isthmus", "Jetties", "Keeps", "Keystones", "Kilns", "Knolls", "Knots", "Lagoons",
    "Lamps", "Lanterns", "Leas", "Ledges", "Lees", "Lifts", "Loam", "Locks",
    "Looms", "Maples", "Marrows", "Marshes", "Mesas", "Mills", "Mints", "Moors",
    "Nimbus", "Notches", "Oaks", "Oats", "Orchards", "Oxbows", "Palisades", "Peaks",
    "Piers", "Pines", "Pitches", "Plumes", "Ponds", "Ports", "Quarries", "Quills",
    "Rapids", "Reefs", "Rests", "Ridges", "Rifts", "Rills", "Rises", "Roosts",
    "Runes", "Sable", "Salt", "Sand", "Scarps", "Scree", "Shafts", "Shears",
    "Shelves", "Shoals", "Shores", "Sidings", "Sluices", "Spires", "Spruce", "Spurs",
    "Stacks", "Stakes", "Steppes", "Stone", "Strands", "Surges", "Switches", "Terraces",
    "Thaws", "Thickets", "Thorns", "Tills", "Timber", "Torches", "Trails", "Trenches",
    "Trestles", "Tuff", "Turns", "Vales", "Veils", "Vistas", "Washes", "Wells",
    "Wharfs", "Wicks", "Wind", "Wisps", "Wood", "Yards", "Zephyrs", "Anchors",
    "Benches", "Bolts", "Branches", "Brooks", "Chords", "Crosses", "Flats",
]

FAMOUS_MASCOT = {
    "kentucky": "Stallions",
    "duke": "Hillmen",
    "unc": "Pines",
    "kansas": "Wheat",
    "ucla": "Palms",
    "uconn": "Oaks",
    "indiana": "Limestone",
    "gonzaga": "Spires",
    "alabama": "Forge",
    "auburn": "Plainsmen",
    "florida": "Swamp",
    "tennessee": "Embers",
    "ohio-state": "Scarlet",
    "michigan": "Maize",
    "michigan-state": "Green",
    "purdue": "Rails",
    "villanova": "Navy",
    "houston": "Steel",
    "baylor": "Green",
    "iowa-state": "Wind",
    "arizona": "Desert",
    "texas": "Capitol",
    "arkansas": "Hill",
    "louisville": "Falls",
    "notre-dame": "Gold",
    "wisconsin": "Crest",
    "illinois": "Orange",
    "creighton": "Blue",
    "virginia": "Grounds",
    "lsu": "Violet",
    "georgia": "Hedge",
    "oregon": "Fir",
    "byu": "Peak",
    "utah": "Spires",
    "oklahoma": "Crimson",
    "west-virginia": "Ridge",
    "texas-am": "Twelfth",
    "clemson": "Hill",
    "miami": "Gale",
    "syracuse": "Salt",
    "stanford": "Farm",
    "cal": "Grove",
    "usc": "Colonnade",
    "marquette": "Gold",
    "st-johns": "Red",
    "xavier": "Blue",
    "dayton": "Fly",
    "memphis": "Bluff",
    "san-diego-state": "Mission",
    "texas-tech": "Dust",
    "tcu": "Violet",
    "kansas-state": "Prairie",
    "georgetown": "Harbor",
    "depaul": "Lake",
    "butler": "Hinkle",
    "penn-state": "Mountain",
    "maryland": "Shell",
    "iowa": "River",
    "minnesota": "North",
    "nebraska": "Grain",
    "northwestern": "Lake",
    "saint-marys": "Gael",  # still close. use "Moraga"
    "arizona-state": "Sun",
    "colorado": "Flatiron",
    "washington": "Sound",
    "ole-miss": "Grove",
    "mississippi-state": "Maroon",
    "missouri": "Column",
    "south-carolina": "Garnet",
    "vanderbilt": "Anchor",
    "fsu": "Spear",
    "georgia-tech": "Gold",
    "nc-state": "Red",
    "wake-forest": "Old Gold",
    "pitt": "Steel",
    "smu": "Park",
    "harvard": "Yard",
    "yale": "Blue",
    "princeton": "Orange",
    "air-force": "Academy",
    "army": "Black",
    "navy": "Anchor",
    "unlv": "Neon",
}
FAMOUS_MASCOT["saint-marys"] = "Moraga"

row_re = re.compile(
    r'\["([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\]'
)
rows = row_re.findall(text)
assert len(rows) >= 350, f"parsed {len(rows)}"

city_ids: dict[str, list[str]] = defaultdict(list)
for tid, name, mascot, abbr, conf, city, state, color in rows:
    city_ids[city].append(tid)

used_names: set[str] = set()
used_abbr: set[str] = set()


def unique_name(tid: str, city: str, state: str) -> str:
    if tid in NAME:
        n = NAME[tid]
    elif len(city_ids[city]) == 1:
        n = city
    else:
        n = f"{city} {state}"
    if n in used_names:
        n = f"{city} {state}"
        if n in used_names:
            n = f"{city} {tid.split('-')[-1].title()}"
    used_names.add(n)
    return n


def make_abbr(tid: str, name: str) -> str:
    if tid in ABBR:
        a = ABBR[tid]
        if a not in used_abbr and 2 <= len(a) <= 4:
            used_abbr.add(a)
            return a
    letters = re.sub(r"[^A-Za-z]", "", name).upper()
    words = [w for w in re.split(r"[\s\-]+", name) if w]
    cands = []
    if len(words) >= 2:
        cands.append("".join(w[0] for w in words).upper()[:4])
    cands.append(letters[:3])
    cands.append(letters[:4])
    slug = re.sub(r"[^a-z]", "", tid)[:4].upper()
    cands.append(slug)
    for c in cands:
        if 2 <= len(c) <= 4 and c not in used_abbr:
            used_abbr.add(c)
            return c
    i = 0
    while True:
        c = f"{slug[:3]}{i}"[:4]
        if c not in used_abbr:
            used_abbr.add(c)
            return c
        i += 1


def make_mascot(tid: str, original: str) -> str:
    if tid in FAMOUS_MASCOT:
        return FAMOUS_MASCOT[tid]
    h = sum(ord(c) * (i + 3) for i, c in enumerate(tid))
    for k in range(len(MASCOTS)):
        m = MASCOTS[(h + k) % len(MASCOTS)]
        if m.lower() == original.lower():
            continue
        if m.lower() in original.lower() or original.lower() in m.lower():
            continue
        return m
    return "Forge"


out_rows = []
for tid, name, mascot, abbr, conf, city, state, color in rows:
    n = unique_name(tid, city, state)
    m = make_mascot(tid, mascot)
    a = make_abbr(tid, n)
    out_rows.append((tid, n, m, a, conf, city, state, color))

conf_block = "export const CONFERENCES: Conference[] = [\n"
for cid, name, short, prestige in CONFS:
    conf_block += f'  {{ id: "{cid}", name: "{name}", short: "{short}", prestige: {prestige} }},\n'
conf_block += "];"

raw_block = "const RAW: [string, string, string, string, ConferenceId, string, string, string][] = [\n"
for tid, n, m, a, conf, city, state, color in out_rows:
    raw_block += f'  ["{tid}", "{n}", "{m}", "{a}", "{conf}", "{city}", "{state}", "{color}"],\n'
raw_block += "];"

text2 = re.sub(
    r"export const CONFERENCES: Conference\[\] = \[[\s\S]*?\];",
    conf_block,
    text,
    count=1,
)
text2 = re.sub(
    r"const RAW: \[string, string, string, string, ConferenceId, string, string, string\]\[\] = \[[\s\S]*?\];",
    raw_block,
    text2,
    count=1,
)
ROOT.write_text(text2)
print(f"rewrote {len(out_rows)} teams")
names = [r[1] for r in out_rows]
assert len(names) == len(set(names)), "duplicate names: " + str([n for n in names if names.count(n) > 1][:8])
abbrs = [r[3] for r in out_rows]
assert len(abbrs) == len(set(abbrs)), "duplicate abbr"
assert all(2 <= len(r[3]) <= 4 for r in out_rows), "bad abbr length"
for tid in ["kentucky", "duke", "unc", "kansas", "ucla", "uconn", "alabama", "gonzaga", "harvard", "army", "albany", "yale"]:
    row = next(r for r in out_rows if r[0] == tid)
    print(f"  {tid:16} -> {row[1]:22} {row[2]:12} {row[3]}")
