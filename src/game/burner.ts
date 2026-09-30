import type { GameState } from "./types";
import { TEAM_BY_ID } from "./teams";
import { hashString, mulberry32, pick, randInt, type Rng } from "./rng";
import { randomPersonName } from "./people-names";
import { identityName } from "./engine-util";
import { leagueName } from "./align";
import { kenpom, apPoll } from "./ranks";
import { eraHasNil, eraPortal } from "./era";
import { portalOf, portalOpen, reasonLine } from "./portal";

export type BurnerChannel = "carousel" | "portal" | "lounge";
export type BurnerRole = "owner" | "mod" | "regular";

export interface BurnerUser {
  id: string;
  name: string;
  role: BurnerRole;
  color: string;
  flair: string;
  bot?: boolean;
}

export interface BurnerReaction {
  label: string;
  count: number;
}

export interface BurnerEmbedField {
  name: string;
  value: string;
}

export interface BurnerEmbed {
  color: string;
  title: string;
  desc: string;
  fields: BurnerEmbedField[];
  footer: string;
}

export interface BurnerMessage {
  id: string;
  channel: BurnerChannel;
  userId: string;
  body: string;
  minutesAgo: number;
  replyTo?: string;
  reactions?: BurnerReaction[];
  pinned?: boolean;
  embed?: BurnerEmbed;
  system?: boolean;
}

export interface BurnerChannelInfo {
  id: BurnerChannel;
  label: string;
  topic: string;
}

export interface BurnerFeed {
  server: string;
  members: number;
  online: number;
  channels: BurnerChannelInfo[];
  users: BurnerUser[];
  messages: BurnerMessage[];
  tease: string;
}

export interface BurnerSlashCmd {
  id: "hotseats" | "names" | "portal" | "week";
  label: string;
  hint: string;
}

export const BURNER_SLASH: BurnerSlashCmd[] = [
  { id: "hotseats", label: "/hotseats", hint: "who's in trouble" },
  { id: "names", label: "/names", hint: "who should get hired" },
  { id: "portal", label: "/portal", hint: "who's leaving" },
  { id: "week", label: "/week", hint: "the whole board" },
];

interface SchoolBit {
  id: string;
  name: string;
  abbr: string;
  coach: string;
  prestige: number;
  wins: number;
  losses: number;
  confW: number;
  confL: number;
  record: string;
  games: number;
  winPct: number;
  heat: number;
  tenure: number;
  conf: string;
  city: string;
  expected: number;
}

interface JumpBit {
  school: SchoolBit;
  why: string;
}

interface OpeningBit {
  school: SchoolBit;
  why: string;
  candidates: { name: string; from: string; kind: "hc" | "asst" }[];
}

interface PortalBit {
  name: string;
  pos: string;
  fromId: string;
  from: string;
  ovr: number;
  mpg: number;
  reason: string;
  destName: string;
  destAbbr: string;
  committed: boolean;
  live: boolean;
}

const USERS: BurnerUser[] = [
  { id: "trilly", name: "Trilly Donovan", role: "owner", color: "#f0b232", flair: "server owner" },
  { id: "watch", name: "Burner Watch", role: "mod", color: "#5865f2", flair: "app", bot: true },
  { id: "hopper", name: "hopper", role: "mod", color: "#ed4245", flair: "mod" },
  { id: "film", name: "film_nerd", role: "mod", color: "#57f287", flair: "mod" },
  { id: "chief", name: "Chiefbogans", role: "regular", color: "#ff8c4a", flair: "" },
  { id: "spivey", name: "trill Spivey", role: "regular", color: "#5ad0c8", flair: "" },
  { id: "travis", name: "TravisSteeleLover", role: "regular", color: "#7aa2ff", flair: "" },
  { id: "notbb", name: "notbb32", role: "regular", color: "#faa61a", flair: "" },
  { id: "sass", name: "Sassifrass_", role: "regular", color: "#f472b6", flair: "" },
  { id: "warcat", name: "justwarcat", role: "regular", color: "#7dd3fc", flair: "" },
  { id: "bontemps", name: "bontemps", role: "regular", color: "#f5d76e", flair: "" },
  { id: "lando", name: "lando.marshall", role: "regular", color: "#c084fc", flair: "" },
  { id: "reborne", name: "reborne", role: "regular", color: "#fb923c", flair: "" },
  { id: "angelyne", name: "Angelyne-1v1", role: "regular", color: "#f9a8d4", flair: "" },
  { id: "blur", name: "bLuRbonics", role: "regular", color: "#e8b86d", flair: "" },
  { id: "hopscotch", name: "hopscotch_", role: "regular", color: "#dea8fc", flair: "" },
  { id: "kenpom", name: "kenpom_cellar", role: "regular", color: "#3ba55c", flair: "" },
  { id: "midmajor", name: "midmajor_truth", role: "regular", color: "#e67e22", flair: "" },
  { id: "sec", name: "southern_homer", role: "regular", color: "#e91e63", flair: "" },
  { id: "portal", name: "portal_rat", role: "regular", color: "#00b0f4", flair: "" },
  { id: "buyout", name: "buyout_guy", role: "regular", color: "#f1c40f", flair: "" },
  { id: "oldhead", name: "oldhead_64", role: "regular", color: "#95a5a6", flair: "" },
  { id: "a10", name: "tenfold_watcher", role: "regular", color: "#1abc9c", flair: "" },
  { id: "asst", name: "assistant.acc", role: "regular", color: "#3498db", flair: "" },
  { id: "net", name: "net_sheet", role: "regular", color: "#9b59b6", flair: "" },
  { id: "nil", name: "collective_burner", role: "regular", color: "#2ecc71", flair: "" },
  { id: "jay", name: "Jay from the Valley", role: "regular", color: "#e74c3c", flair: "" },
  { id: "west", name: "slope_guy", role: "regular", color: "#1abc9c", flair: "" },
  { id: "lakes", name: "lakes_lurker", role: "regular", color: "#3498db", flair: "" },
  { id: "timeout", name: "timeout_charlie", role: "regular", color: "#e67e22", flair: "" },
  { id: "bracket", name: "bracket_joe", role: "regular", color: "#f39c12", flair: "" },
  { id: "other", name: "the other burner", role: "regular", color: "#bdc3c7", flair: "" },
  { id: "ad", name: "ad_whisperer", role: "regular", color: "#e74c3c", flair: "" },
  { id: "bench", name: "sixth_man_steve", role: "regular", color: "#8e44ad", flair: "" },
  { id: "radio", name: "call_in_dave", role: "regular", color: "#16a085", flair: "" },
  { id: "boost", name: "tipoff_club", role: "regular", color: "#d35400", flair: "" },
  { id: "fresh", name: "freshman_eligibility", role: "regular", color: "#27ae60", flair: "" },
  { id: "packline", name: "packline_paul", role: "regular", color: "#7fdbda", flair: "" },
  { id: "corner", name: "corner_three", role: "regular", color: "#f78da7", flair: "" },
  { id: "dho", name: "dho_dave", role: "regular", color: "#c5a3ff", flair: "" },
  { id: "charge", name: "charge_circle", role: "regular", color: "#ffa07a", flair: "" },
  { id: "bounce", name: "bounce_pass", role: "regular", color: "#7ec8e3", flair: "" },
  { id: "second", name: "second_chance_sue", role: "regular", color: "#e8a838", flair: "" },
  { id: "press", name: "press_break", role: "regular", color: "#6dd3b0", flair: "" },
  { id: "boxone", name: "box_and_one", role: "regular", color: "#d4a5a5", flair: "" },
  { id: "deadball", name: "dead_ball_danny", role: "regular", color: "#a8b5c4", flair: "" },
];

const TRILLY_OPEN = [
  "I've got something on {school} — they've talked to {name}'s people, and I'm not saying it's done, but I'm also not saying it's nothing.",
  "Wouldn't be shocked if {coach} is gone from {school} after this one, because the AD's been on the phone with people he doesn't usually call.",
  "{school} reached out to {name}, and this one actually has legs.",
  "Write it down if you want: I don't have {coach} coaching a game at {school} next November.",
  "I don't have {school} as a firing. I have them as miserable, which is usually how it starts.",
  "The building's over it. You don't go {record} at {school} and call that competing.",
  "{name} to {school} makes a ton of sense, whether the AD has the guts is a different question.",
  "Quiet on {school} today, and that's usually the tell, because they get loud when it's already over.",
  "Keep an eye on {school}. {coach} is in year {tenure}, they're {record}, and they didn't hire him to look like this.",
  "Two people now have {name} on a {school} list. That's all I've got, and that's enough.",
  "If {school} opens it's a real one, and the guys I keep hearing are {cand1} and {cand2}.",
  "Buyout at {school} is real so don't get cute — they can wait, and they also might not.",
  "I'd be stunned if {coach} is still there next November. Stunned.",
  "{name} has been told he's the guy if {school} opens, and the job isn't open. Yet.",
  "Somebody in that building is tired of {record} at {school}, and you can do the math from there.",
  "{coach} still has the boosters and does not have the AD, and those people don't eat lunch together.",
  "They're going to wait until after the tournament at {school}, which is funny because the decision's already made.",
  "{name} is the riser this cycle. {from} is a jump, and {school} is the one that actually gets him to leave.",
  "Don't tweet that {coach} is fired, because he isn't, and he's also not surviving this.",
  "One more like Saturday and {school} is open. They know. He knows.",
  "Hearing {school} is further along than the fanbase thinks, and {name} is in it.",
  "This {school} thing is going to move faster than people in here are ready for.",
  "Heard {name} was in {city} last week, and I'm not saying that's the {school} job — I'm saying that's not a vacation.",
  "{coach} still did the booster breakfast this morning, which tells you he knows what's coming and showed up anyway.",
  "The search firm already has a file on {school}. They don't pay those people to sit around.",
  "People at {school} stopped saying 'next year' this week, and that's new.",
  "{cand1} would take {school}. {cand2} would think about it. That's the board as of tonight.",
  "Vote of confidence coming at {school}, and you already know what that means.",
  "I've got {coach} on the clock at {school} because they don't rebound, they don't guard, and the gym is quiet.",
  "{school} is an NIT team with a dance budget at {record}, and that's how these start.",
  "The AD at {school} asked around on {name} this week, and asking around is how it starts.",
  "I wouldn't run it back at {school}. {record} is not another year of this.",
  "{coach} still has the locker room. He does not have the people who sign the checks.",
  "Three texts this morning on {school} and none of them were 'he's safe.'",
  "If {school} is shopping, they're shopping {name}. I'm not doing a twelve-name mock.",
  "{school} told people they want a teacher, which usually means {name}, and we'll see if they mean it.",
];

const TRILLY_WATCH = [
  "Not a hot seat. Just a year they have to have at {school}, with {coach} in year {tenure}.",
  "{school} needs a tournament and that's October talk, so I'm not putting {coach} on a list.",
  "{coach} is year {tenure} at {school}, and every year like that feels like a referendum until they play — they haven't.",
  "I don't have {school} as a firing. I have them as a place that has to get this one right.",
  "Too early on {coach}. {school} hasn't even tipped, and I'm not doing this yet.",
  "A watch list isn't a hot seat. {school} is on a watch list, and that's it.",
  "Put {school} in a note on your phone, not a list — year {tenure}.",
  "{coach} at {school} is fine until he isn't, and we are not there, we are in October.",
  "Year {tenure} at {school} is always loud in November, which is why I wait until they play.",
  "If {school} stinks in January I'll be here. I'm not doing it in October.",
  "People already want {coach} gone at {school} the way they always do in November, and I'm not joining.",
  "{school} in year {tenure} is a show-me year, so show me they can play first.",
];

const TRILLY_DEST = [
  "Hearing {name} is the lead at {school}, and if you've watched {from} this is not a shock.",
  "{school} likes {name} because {from} spits out coaches, and that's the sell.",
  "Don't sleep on {name} for {school}. The search firm already has the file.",
  "If {school} goes outside it's {name}. In-house I don't have yet.",
  "{name} to {school} has been kicked around, and today it got louder.",
  "I have {name} taking {school} if they offer — he wants it, and the holdup is on their end.",
  "{from} is about to lose {name} if {school} is real. Just saying.",
  "{name} told people he would listen to {school}, and listen is not take, but it's not no.",
  "The {school} people like that {name} actually teaches, which is a weird selling point until you watch the other candidates.",
  "{name} gets kids to compete, and {school} hasn't had that in a minute.",
  "If they want a guy who can coach a halfcourt set it's {name}, and if they want a press conference they'll pick somebody else.",
  "{name} would walk into {city} tomorrow. The job's not open yet.",
  "I keep hearing {name} for {school} from people who don't usually talk, and that's new.",
  "Don't make me do a mock, but if I did one, {name} is 1 on {school}.",
];

const TRILLY_JUMP = [
  "I've liked {name} at {school} for a while because {why}, and if a bigger job calls he picks up.",
  "People keep asking who they should call, so here's one: {name} at {school}, {why}.",
  "I'm not hanging a mock board in here, but if I was, {name} at {school} is on it — {why}.",
  "Keep {name} on a list. He's at {school}, {why}, and that's the kind of coach who survives a real job.",
  "{name} is winning at {school} with nothing ({why}), and somebody with money is going to notice.",
  "If you're an AD putting a list together, {name} at {school} should already be on it, because {why}.",
  "Quiet riser is {name} at {school} — {why} — and don't act surprised in March.",
  "I like {name} more than the splash hires y'all keep posting. {school}, {why}.",
];

const TRILLY_PORTAL = [
  "Hearing {player} is going in, and {from} already knows.",
  "{player} has a visit at {dest}, and that's the one.",
  "{dest} is in it for {player} — not the only one, the one that's serious.",
  "Don't sleep on {player} because he came off the bench. {mpg} a night at {from} is how you lose him.",
  "A few schools are circling {player}, and {dest} actually called.",
  "{player} is gone. {from} can say whatever they want in the scrum.",
  "Hearing {dest} is the favorite for {player}. Not committed. Favorite.",
  "Quiet on {player} the last two days, which is usually a visit.",
  "{from} wants {player} back and he's listening, and I still wouldn't bet on it.",
  "If you're a {dest} guy asking who's in the portal, start with {player}.",
  "Got {player} ({pos}) leaving {from}, and {dest} is all over him.",
  "{player} told a teammate this week, which is how I have it, and {dest} is the pull.",
  "Minutes are the {player} thing — {mpg} a night, and a {pos} who thinks he's a starter.",
  "{player} wants to play, and {mpg} a night at {from} isn't playing, so {dest} will dangle that.",
  "{player} isn't in yet, but he's also not happy, and {from} can read a room.",
  "If {dest} wants a {pos} who can play tomorrow, it's {player}, and they know.",
];

const TRILLY_NIL = [
  "Money's going to decide {player}, and the basketball is second.",
  "{player}'s number is real. {dest} can get there, even if a lot of you think they can't.",
  "The collective at {dest} got told to make {player} happen, and that's as far as I go on money.",
  "If {dest} cheaps out on {player}, somebody else won't.",
  "I'm not posting a number on {player}. I'll just say {dest} isn't the only one who can get there.",
];

const TRILLY_SIT = [
  "{player} sits a year if he leaves {from} — that's still the rule, and y'all are talking like it's Madden.",
  "Transfer talk on {player} is real, and the sit-out is also real, which is why {from} isn't panicking.",
  "If {player} leaves {from} he watches from the bench next year, and most guys blink.",
  "{player} would have to sit, and that's a year of his life most {pos}s aren't giving up.",
  "People in here talking portal on {player} like it's 2024. He sits. That's the sport right now.",
];

const REPLY_BELIEVE = [
  "Trilly hasn't missed one of these in like two years, which is annoying because I wanted him to be wrong.",
  "Y'all laughed last year too and then they fired him in March, so maybe don't laugh.",
  "When he says the building's done, the building's done.",
  "Ok wait — {name} at {school} would actually go crazy, students would show up again.",
  "I called {school} last week and got piled on, so I'm taking this one with a stupid amount of confidence.",
  "Yeah this tracks, they don't rebound and they don't guard.",
  "He's had this one. Screenshot it before hopper deletes it.",
  "You don't go {record} at a place like {school} and keep your job. You just don't.",
  "I'm taking the over on {name} being in {city} by April, and I don't even like betting.",
  "The AD's already shopping. The presser is just the last part of a thing that already happened.",
  "This is how it started at the last one too, and then it was a Sunday night release nobody was ready for.",
  "Yeah I'm in. {coach} is done, they just haven't typed the tweet.",
  "{record} at {school} isn't even a hot take, it's a pink slip with extra steps.",
  "They already know and we already know, so the fans are just the last ones to catch up.",
  "lol {school} twitter is about to be unusable",
  "If Trilly's putting {name} and {school} in the same sentence I believe him, that's kind of the whole point of this room.",
  "This one feels real in the way the quiet ones always do.",
  "Boosters checked out in January and the rest of y'all just caught up, which is a little embarrassing.",
  "I hate that I believe this and I still believe it.",
];

const REPLY_DOUBT = [
  "I'll believe it when they actually fire him.",
  "{school} does this every year and then runs it back like nothing happened.",
  "The buyout is nasty, they're not doing this.",
  "Source: dude's roommate's cousin who went there once.",
  "They've played {games} games. Relax.",
  "{school} is allergic to decisions and always has been.",
  "We've heard this one before, and then it's a vote of confidence and another year of the same thing.",
  "Nah they don't have the stones. They'll punt it to next year and act like that was the plan.",
  "{school} will run it back, hold a press conference, say they believe in {coach}, and we'll all be here again in twelve months.",
  "I need a coach on a plane, not a vibe.",
  "They just gave him an extension two years ago, and that's real money even if this room doesn't want to count it.",
  "Too many people in here treating a rumor like a pink slip.",
  "idk man {school} never pulls the trigger, that's kind of the brand.",
  "I'm not saying he's safe. I'm saying this fanbase cries wolf every November and then nothing happens.",
  "Show me the athletic site graphic. Until then it's just us yelling in a Discord.",
  "They don't fire guys, they 'mutually part ways' in April after another NIT, which is the same thing with worse lighting.",
  "lmao {school} making a decision? In this economy?",
  "I want this to be true and I still don't buy it, which is a miserable place to live.",
  "Does anybody in here remember the last time {school} actually moved on a coach before April? Because I don't.",
];

const REPLY_HOMER = [
  "{school} fans acting shocked at {record} is crazy, they watched this team with their own eyes.",
  "Fire him yesterday. {record} is embarrassing for that job and everybody in that building knows it.",
  "{name} would actually win at {school} because the roster's already there, they just don't compete.",
  "It's the AD, and they're still gonna fire {coach} though.",
  "{record} at {school} isn't a hot take. They can't throw it in the ocean.",
  "How is {coach} still there when the gym's empty and they get killed on the glass every night?",
  "{school} is so back. Wait no they're not. They don't guard anybody.",
  "We should've moved on {coach} two years ago and y'all said be patient, so how's patience going?",
  "If {name} walks in that gym the students show up again, I actually believe that.",
  "That program used to be a night out and now it's a Tuesday NIT game with a drumline that's louder than the crowd.",
  "They're getting walked every night in the paint, and that's a staff problem whether you like {coach} or not.",
  "I'm a {school} guy and even I want him gone, because {record} is humiliating.",
  "Students aren't even standing on made 3s anymore, and that's the tell more than any spreadsheet.",
  "We used to own that building. Now it's visiting fans and a couple boosters who look like they want to leave at halftime.",
  "Patient for WHAT. {record}. I'm done being patient.",
  "Hate this for them but they earned it, because {record} at {school} is a joke.",
  "Can somebody explain to me how {coach} still has a job, because I have watched this team and I do not understand.",
];

const REPLY_BALL = [
  "{school} cannot guard the ball screen, and that's on {coach}, not the scheme.",
  "{name} plays fast and his guys get better, which is a really boring thing that actually wins games, so hire that.",
  "If they hire another guy who walks it up every trip I am logging off and I mean it this time.",
  "{record} with that talent is a staff issue because they don't share the ball and they don't even pretend to.",
  "The computer isn't saving {coach}. Just watch them. Nobody boxes out.",
  "They get cooked on the perimeter every night and we act surprised like it started last Tuesday.",
  "Watch {school} after a make — nobody gets back, and that's teaching, or the lack of it.",
  "{name}'s teams actually pass it, like the extra pass, which is a wild concept over there.",
  "{coach} has been in a 2-3 for {tenure} years and the whole country just shoots it over the top, so maybe try something else.",
  "They live at the charity stripe when they play and they still can't win, which is a special kind of problem.",
  "Somebody tell {school} about a weakside rotation. I'm begging. I'll draw it on a napkin.",
  "{name} runs motion and his bigs can pass, and {school} hasn't had that in a decade.",
  "They don't rebound, they don't get back, and they don't make a free throw, so I'm not sure what the plan is.",
  "I've watched {school} three times this year and I still don't know what they're running, which I think is also their problem.",
  "No spacing. Five guys inside the arc standing around. Just pick a set, I'm not picky.",
  "They can't even get a stop in the last four minutes, and that's a forty-minute problem, not a late-game problem.",
  "{school} on the nail is a layup line. Pack the paint or don't play defense, I don't care, pick one.",
  "Put {name} in that gym and those kids would at least BOX OUT, which is a low bar and still somehow the bar.",
  "That's a brick festival waiting to happen, because nobody can shoot and they still jack it like they can.",
  "Has anybody on that staff watched film of a team that actually closes out, or are we just vibes now?",
];

const REPLY_MONEY = [
  "The buyout at {school} is nasty. They can eat it, they just don't want to, which is different.",
  "Boosters at {school} will write the check the second the students stop showing up, and some of them already have.",
  "It's a money hire. Nobody's doing this for culture, I don't care what the press release says.",
  "{school} can pay it. They just don't want to look panicked on a Tuesday.",
  "Follow the money on {school}, not the quotes.",
  "The golf outing got quiet, and that's when the checks stop.",
  "A vote of confidence means the buyout talk already happened, so you can stop pretending this is about loyalty.",
  "They'll wait until the season ticket deadline. They always do.",
  "lol the money people always show up in these threads right on cue",
  "{school} talking culture while the boosters are in a group chat about {name} is the funniest version of this.",
  "If they wanted him they'd have paid him. They don't. That's the story, and it's not complicated.",
  "Do you know how many times I've heard 'the buyout is too much' right before somebody writes the check? A lot.",
];

const REPLY_PORTAL = [
  "{player} is gonna eat at {dest} if they just get him the ball, because he can actually score it.",
  "{from} fumbled this. {mpg} mpg for a guy that good??",
  "Another one out at {from}, they cannot keep a rotation together to save their lives.",
  "If {dest} gets {player} that's a tournament team, like immediately, not 'in two years if the young guys develop.'",
  "Called it on {player}. Minutes were always the tell.",
  "He's so gone. {mpg} a night and a {pos} who thinks he's a starter is not a guy you keep happy.",
  "{player} as a {pos} with {mpg} a night was never staying and we all knew, so the shock is a bit much.",
  "{dest} needs a {pos} so bad it isn't even funny.",
  "{from} played him {mpg} a night and now they're shocked he's looking, which is a very specific kind of self-own.",
  "Put {player} in a real offense and he's a 15-point guy, and {dest} can actually do that.",
  "That's a scholarship and a starter if {dest} is serious, and if they're not, somebody else will be.",
  "lol {from} really thought {player} was gonna sit behind that rotation",
  "{player} wanted to play. {mpg} a night is not playing. Goodbye.",
  "If I'm {dest} I'm already in the living room. A {pos} who can score? Yes.",
  "Portal season is just {from} leaking talent and acting surprised. Again.",
  "I don't even think this is about money. I think {player} looked at {mpg} minutes and said I'm not doing this again.",
];

const REPLY_VISIT = [
  "Mom posted a heart then deleted it, and if you know, you know that's a visit.",
  "Heard {player} was on campus at {dest} this week. Unofficial. Still counts.",
  "{dest} had him in the living room already, which is further than y'all think.",
  "If he's taking a visit to {dest} in the middle of the year that's not a courtesy, that's a plan.",
  "Quiet usually means the unofficial already happened.",
  "Someone's mom liked a {dest} tweet. You know the one.",
  "When they go quiet on {player} he's already eaten on campus, that's just how this works now.",
  "Unofficial at {dest} and then they act like it came out of nowhere. Classic.",
  "Why would you take a midyear visit to {dest} if you weren't already leaning there?",
];

const REPLY_ARGUE = [
  "You say that every year.",
  "Ok but the buyout though.",
  "I'm not saying he's gone, I'm saying the AD is shopping, which is a different sentence.",
  "This is why hopper muted you last year.",
  "{school} fans always think they're the exception and they never are.",
  "Bro you posted the opposite last week.",
  "Nah that's actually fair.",
  "You're doing too much. It's a rumor mill, not a sentencing.",
  "Sit down, you don't even watch {school}.",
  "Watch a game before you talk scheme, I'm serious.",
  "They haven't even played a real non-con yet. Breathe.",
  "Ok but you're not wrong.",
  "I'm not reading all that. Is he getting fired or not?",
  "Y'all argue like this is a court case and it's basketball.",
  "Nahhh I'm not doing this with you tonight.",
  "That's a take from somebody who watches the score app and nothing else.",
  "anyway.",
  "I said what I said.",
  "It's not that serious and also I still think I'm right.",
  "Can we not do the same argument we did in November, because I remember how it ended and it was boring.",
];

const REPLY_CHAT = [
  "Wait is this the {school} thing again?",
  "lol {school}",
  "I have been in this server too long and I would like to get out, theoretically.",
  "Anyway put a game on.",
  "This is the same cycle as always and I don't know why I keep being surprised.",
  "I'm just here so I don't get fined.",
  "Ok but actually though.",
  "Not a hot take, they just stink.",
  "I can't keep doing this every November, I have a job, allegedly.",
  "Who else is watching this at work?",
  "Hopper is typing, I can feel it in my chest.",
  "This ain't it. Or maybe it is. idk I'm tired.",
  "Call me crazy but I think Trilly's got this one.",
  "I'm logging off. I'm not logging off.",
  "The gif of the guy walking into the ocean is {school} right now.",
  "Y'all not ready for this conversation.",
  "idk man it just feels like {school} is done, even if I can't prove it.",
  "Wait wait wait go back. {name}??",
  "This is so {school} coded I can't even be mad.",
  "My phone buzzed and I knew it was this room, which is a problem I will not be solving tonight.",
  "I need a hobby. Unfortunately this is it.",
  "Ok I'm caught up. He's cooked right?",
  "lmaooo they really going to run it back aren't they",
  "I'm not arguing. I'm just saying {school} doesn't guard, which isn't an argument, it's a weather report.",
  "Tell me I'm wrong. You can't. {record}.",
  "Has anyone in here gone outside today, or are we all just like this?",
];

const SIDE_CHAT = [
  "Put a game on. I want to see if anybody in this country can guard a ball screen.",
  "I have this server open at work, which is a problem I will deal with never.",
  "Hopper is typing. Hide.",
  "We do this every November and then it's quiet until Selection Sunday, and I still come back, so that's on me.",
  "Somebody talk about an actual possession. A paint touch. Anything.",
  "Is anyone watching basketball or are we just doing jobs again?",
  "Raftery would be losing it at this 2-3.",
  "I came in here for jobs and now it's RPI hour, and I'm not leaving, which says more about me than the poll.",
  "Mute. Unmute. Mute. I'm not well.",
  "My lunch break is this room. That's between me and God.",
  "We are never beating the 'no one watches the games' allegations.",
  "Anyway I'm putting the game on. Y'all keep doing jobs.",
  "Selection Sunday people are already in here in November. Sit down.",
  "I opened this for one second and now it's forty minutes later and I have learned nothing except that nobody boxes out.",
  "Does this server make anybody else worse at their actual job, or is that just me?",
];

const HOPPER_LINES = [
  "Jobs in #carousel. Games in lounge. I will start deleting, and I will not feel bad about it.",
  "If you screenshot Trilly I am banning you for a week. You know who you are.",
  "One rumor at a time. This is not a group project.",
  "Keep the names in this room. Lounge is for the games. Last warning.",
  "If I see another vote-of-confidence joke in lounge I'm muting the lot of you.",
  "notbb I swear to God.",
  "justwarcat is allowed to talk. the rest of you are guessing.",
  "bontemps if you're dropping a source, stay in this room.",
  "lando.marshall I can see you typing a novel. shorten it.",
  "reborne you logged off for a reason. stay gone or stay in this room.",
  "Angelyne-1v1 this is not a rec gym. keep the 1v1 talk out of jobs.",
  "bLuRbonics you're funny until you're right, which is worse.",
  "Sassifrass_ I am not doing this with you tonight.",
  "Sassifrass_ we know you bleed {cats}.",
  "Stop posting 'he's done' under every name. Some of these guys still have jobs, as hard as that is for this room to believe.",
  "Take it to lounge. This is the jobs room, not your group chat.",
  "I muted three people last cycle and I will do it again, with joy.",
];

const JUMP_REPLY = [
  "{name} would win 20 at a bigger job and y'all would act like you saw it coming, which you didn't.",
  "Hire {name} before somebody with money does, because he can actually coach.",
  "That's a mid-major guy doing real work. Look at the kids. They compete.",
  "If they call {name} he's answering on the first ring, and I don't think that's even a question.",
  "I've been screaming {name} for two cycles because he gets guys to play, and I will keep screaming.",
  "{name} is winning with walk-ons and a zone. Hire that, I'm tired of explaining it.",
  "Put {name} at a place that can recruit and he's in the dance every year, that's not even a hot take.",
  "Power conference jobs are asleep on {name} the way they always are until March, and then they all call the same week.",
  "He can't recruit five-stars at {from}. He can coach the ones he's got, which is the whole job description if you're paying attention.",
  "My guy {name} would go .500 in a real league and y'all would still sleep, and that's why this sport is like this.",
  "{name} got those kids playing, and that's rare, so that's the hire.",
  "Stop putting assistants on every job. {name} already did it with nothing.",
  "If I'm an AD I'm calling {name} tonight, because {from} is a steal and somebody else is going to notice.",
  "Why are we still pretending the splash hires are better than {name} when the kids at {from} actually play hard?",
];

const JUMP_DOUBT = [
  "He'd get eaten alive on the recruiting trail, because coaching and filling a roster are different jobs whether we want them to be or not.",
  "Winning at {from} is not winning up a level. Different animals, different living rooms, different everything.",
  "They always hire the mid-major guy and then fire him for not landing five-stars, and I am so tired of watching that movie.",
  "Love {name}. Don't know if he can close in a living room.",
  "Prove it against a real non-con, then we can talk.",
  "He's a good coach. He's also never had to recruit over the phone against real money, which matters more than this room wants to admit.",
  "I've seen this movie. Mid-major hero, year two, empty living rooms, gone.",
  "idk man {from} isn't the league. Let's not crown him yet.",
  "Can {name} get in a living room in July, or does he just coach the guys who already said yes? That's the question.",
];

const JUMP_BALL = [
  "Watch {name}'s kids — they box out, they get back, they make the extra pass, and that isn't an accident.",
  "{name} runs motion and nobody's talking about it because it's a mid-major, which is the dumbest reason I've heard this week, and I've heard a lot.",
  "His bigs can pass, and that's rarer than a five-star at {from}.",
  "{name} plays fast and his guys get better, and bigger jobs sleep on that until it's too late.",
  "They're in a 2-3 and they still rebound, which is coaching, not scheme twitter.",
  "I put the film on. {name}'s teams just don't quit. Ugly wins. I like that.",
  "Spacing, extra pass, they actually run something, unlike half the jobs in here that just stand around and hope.",
  "{name}'s defense is 'don't get walked,' which is revolutionary I know, and also it works.",
  "Has anybody actually watched {name}'s halfcourt sets, or are we just going off the record?",
];

const REPLY_SHORT = [
  "lmao", "nah", "wait", "bro", "he's done", "cooked", "no shot", "dead",
  "i knew it", "oh they know", "lol", "yeah", "insane", "shut up", "wait wait",
  "come on", "exactly", "please", "not this again", "yup", "send it",
  "lmaooo", "nahhh", "bruh", "idle", "ok", "sure", "wild",
  "i'm in", "he's so done", "lol ok", "and?", "anyway", "what",
  "hold on", "say more", "i'm out", "not him", "this one", "yessir",
  "oh no", "stop", "don't", "maybe", "doubt", "real", "nah dude",
  "wait what", "huh", "ok then", "lmao ok", "sure jan", "who?",
  "go on", "that's crazy", "i can't", "same", "mood",
];

const LOUNGE_OPEN = [
  "anybody got {home} and {away} on?",
  "{away} at {home}. I'm watching if it's on somewhere",
  "I think {home} wins this, but I've been wrong a lot",
  "{away} can hang if they rebound. we'll see",
  "putting {home} / {away} on. no promises",
  "is this one actually close or is the spread lying",
  "{home} at home should be fine. should",
  "who are people taking, {home} or {away}",
  "I'll watch the first half and then decide if I care",
  "game's on. {away} at {home}",
];

const LOUNGE_PLAY = [
  "{home} is settling for jumpers early",
  "{away} is getting to the rim whenever they want",
  "neither team is taking care of the ball",
  "that was a good pass. more of those",
  "{home} keeps switching and it's not working",
  "free throws are going to matter if this stays close",
  "{away} looks comfortable on the road, which is annoying",
  "they need a timeout. that stretch was bad",
  "ok that was a better possession",
  "the big is in foul trouble already",
  "I like {away} if they keep this pace",
  "{home} has no answer for that matchup",
  "second half needs to be cleaner",
  "they're playing hard. the shots just aren't falling",
  "this got ugly fast",
  "somebody box out, please",
];

const LOUNGE_POLL = [
  "{team} at {rank} is a crime. Voters do not watch, and they don't rebound either, which is unrelated but feels true.",
  "Poll's gonna jump {team} if they just handle business, and they should, and they might not.",
  "Unranked {team} at {record} is how you know the poll is a vibes thing.",
  "If {team} is {rank} I don't want to hear about resume ever again.",
  "The committee isn't going to care about that poll slot. They care about the bad loss.",
  "{team} has no quality win and they're {rank}, which is a TV poll, not a basketball poll.",
  "lol {team} at {rank}. Voters watched the highlights.",
  "The poll is not the tournament. I will keep saying it until I die, and then somebody will put it on my stone.",
  "{team} got a logo bump and the resume still stinks at {record}, so maybe we all calm down.",
  "Can somebody show me the quality win that put {team} at {rank}, because I have looked and I cannot find it.",
];

const LOUNGE_YOU = [
  "{coach} at {school} is {record}, and y'all are going to talk about it anyway, so I figured I'd start.",
  "Somebody in here is {coach} lurking. {school} is {record}. Say something.",
  "{school} under {coach} has a look. They compete, which is new, and I don't know if this room is ready to admit it.",
  "I'm not putting {school} on a list. I'm just saying {record} is sitting there.",
  "{school} actually shares the ball under {coach} and the students show up, and that matters more than people in carousel want it to.",
  "If {school} keeps playing like this they're dancing, and that's not a hot take, it's just watching them.",
  "Quiet on {school} in here, which means they're either good or nobody watched, and I think it's the first one.",
  "{school} is {record} and the carousel people still want a splash hire. Watch the games.",
  "I'll say it. {coach} has {school} playing hard. Don't @ me.",
  "I keep waiting for {school} to look like a carousel job and then they go and compete for forty minutes, which is rude of them.",
];

const LOUNGE_ERA_OLD = [
  "Pace is a crime. Somebody score.",
  "No clock, no mercy. I actually love this.",
  "Freshmen sitting is correct. Earn the jersey.",
  "This is halfcourt basketball and I'm not sorry.",
  "Throw it in the post and let the big man work, crazy idea I know.",
  "You had to have a left hand or you sat, and I miss that more than I should.",
  "Walk it up, post up, next possession. I'm at peace.",
  "Nobody's transferring. They're just... playing? Wild.",
  "I don't need a shot clock to know that somebody should probably try to score at some point here.",
];

const LOUNGE_ERA_NIL = [
  "The portal is the sport now and I hate that I believe it.",
  "NIL didn't ruin it. Bad ADs ruined it. NIL just made it loud.",
  "If your coach can't recruit the portal in April he's a historian, and I don't mean that as a compliment.",
  "We used to argue scheme and now we argue collectives, and I miss the 2-3 arguments, which I never thought I'd say.",
  "Kids used to pick a school and stay. Now they pick a minute count.",
  "April is more important than November and I hate typing that.",
  "Roster construction is just portal shopping with extra steps, and everybody in here knows it.",
  "Does anybody miss when a guy picked a school because he liked the gym, or are we past pretending?",
];

const CHIEF_LINES = [
  "I've been on {name} since November and the bigger jobs are asleep, which is their problem, not mine.",
  "This is so obviously happening and half of y'all are still coping, which would be funny if it wasn't every week.",
  "They don't rebound. Fire him. I said it first.",
  "That's a get if they hire {name}, because he can FLAT OUT coach.",
  "Group chat had this last night. Welcome to the read, you're late.",
  "{school} is cooked. I don't need a spreadsheet. Watch them compete, or try to.",
  "Can we talk about a basketball game? A paint touch? No? Ok.",
  "I'm not arguing scheme tonight. {school} is done, they don't guard, that's the whole conversation.",
  "Put the house on {name}. He gets kids to play, and I don't know why that's controversial.",
  "Y'all slow. This was the read on Sunday, they don't have any toughness, and I don't know how else to say it.",
  "{name} wins with junk and a zone, so hire him before a real job does and then act surprised.",
  "I called {school} in the group chat Tuesday and nobody listened, as usual.",
  "Don't talk to me about patience. {school} doesn't even box out.",
  "CHIEF was early. Again. Screenshot it.",
  "Why is this room always two days behind me? I'm asking, I would like an answer.",
];

const SPIVEY_LINES = [
  "Trilly already posted this and y'all are still arguing the 2-3, which is a choice.",
  "Not that trill. Anyway this is real, they don't compete.",
  "Yeah I'm with him. {school} is pretending they have a chance at the dance, and I need them to stop.",
  "They already have the search firm on retainer, btw. They did last time too.",
  "If {name} says yes this thing actually moves, and I think he says yes.",
  "Hopper is gonna mute somebody and I would deserve it, hypothetically.",
  "I've had {school} moving before the weekend. Not a scoop, just a read.",
  "Don't @ me, I'm just here for the jobs.",
  "{name} is the one. He teaches. The rest is noise.",
  "Carousel people need a hobby. Unfortunately this is mine.",
  "{school} hasn't made a free throw in a month and we're talking patience, which is a fascinating use of time.",
  "I'm not doing a thread. I'm just nodding at Trilly.",
  "Anyway {name} would take that job, that's all I got.",
  "Spivey in. This {school} thing is not a bit.",
  "I keep trying to log off and then somebody posts {school} and I'm back, so that's my life now.",
];

const TRAVIS_LINES = [
  "I have a guy for this job. I always have a guy. He teaches.",
  "Don't hire the brand, hire the teacher. {school} never listens, and they should.",
  "Steele would have these guys boxing out in a week, I'm just saying.",
  "If they were serious {name} would already be on a plane.",
  "You can feel a bad hire coming — splash hire over a teacher — and this has that energy.",
  "{school} is about to learn the hard way. Again.",
  "I'm here for the jobs, not the vibes, and the vibes are a bonus I did not ask for.",
  "Hire a teacher or hire the press conference. {school} always picks the press conference.",
  "This is a development job and they're going to chase a guy who sells tickets. Watch.",
  "I said what I said about the hire. Screenshot it.",
  "Steele's whole thing is the kids play hard, and {school} doesn't play hard, so start there.",
  "Stop hiring the guy with the agent. Hire the guy who can teach a closeout.",
  "I'm not even joking. A teacher. A whiteboard. Boxing out. That's the sport.",
  "Would it kill {school} to hire somebody who has actually taught a kid to box out, just once, as a treat?",
];

const NOTBB_LINES = [
  "lol {school}",
  "idk man {name} just gets kids to play, that's it, I don't have a longer version.",
  "{school} fans are not ready for this conversation, and they're going to have it anyway.",
  "Been saying {name} for like two years and y'all still sleeping, which is honestly impressive at this point.",
  "Wait they really going {record} at {school}?? Embarrassing.",
  "notbb take: hire {name} and stop chasing a press conference, I'm tired.",
  "This is the same {school} cycle as always and they never learn, which would be funny if I didn't keep watching.",
  "My guy {name} would have those kids competing in a year, and I don't think that's even close.",
  "Anyway {school} doesn't guard anybody, so the rest of this is just decoration.",
  "Trilly cooking. Rest of y'all arguing a 2-3 nobody runs.",
  "I watched {school} last night and they cannot throw it in the ocean, I don't know how else to say that.",
  "lol the buyout people always show up right on time",
  "Call me crazy but {name} is a real coach and the brand guys aren't, and I will die on this very boring hill.",
  "{record} and people still saying be patient. Patient for what, another Tuesday like this one?",
  "I've been in this server too long for {school} to still be like this.",
  "yall not ready",
  "Hopper mute me I don't care, {school} is done.",
  "Living rooms don't care about your motion. {name} can still coach though.",
  "This is a notbb32 certified {from} bounce if they hire {name}, write it down.",
  "Ok I'm caught up. {coach} is cooked right? Yeah. Cooked.",
  "I say this with love. {school} is a joke right now.",
  "Not a hot take. They stink. {record}. Next.",
  "Wait go back. {name} to {school} would actually go crazy.",
  "I'm just here. Also {school} can't rebound. Related.",
  "Why does every {school} thread turn into the same six posts, we have done this, I was there, it was bad.",
];

function catsName() {
  return TEAM_BY_ID.kentucky?.name ?? "Kentucky";
}

function aboutCats(vars: Record<string, string | number>) {
  const cats = catsName().toLowerCase();
  const blob = `${vars.school ?? ""} ${vars.from ?? ""} ${vars.dest ?? ""} ${vars.home ?? ""} ${vars.away ?? ""} ${vars.team ?? ""}`.toLowerCase();
  return blob.includes(cats) || /\bkentucky\b/.test(blob);
}

function catsVars(vars: Record<string, string | number>) {
  return {
    cats: catsName(),
    catsCity: TEAM_BY_ID.kentucky?.city ?? "Lexington",
    rival: TEAM_BY_ID.louisville?.name ?? "the other school",
    ...vars,
  };
}

const SASS_ALWAYS = [
  "Trilly posted it, y'all argued a zone, Sassifrass_ is clocking in. Hi. {cats} fan. Realist. Let's go.",
  "Notbb can have the chaos. I'll have the point, and the point is somebody in this country has to guard.",
  "I'm not mad. I'm disappointed. And also a little mad. Occupational hazard of caring about {cats}.",
  "Sassifrass_ out. No I'm not. I never log off during basketball season.",
  "Anyway I'm a {cats} fan so take it with that, but I'm not going to lie to you either.",
  "I bleed {cats}. I also have a brain. Those two things are allowed to sit in the same post.",
  "justwarcat actually watched. The rest of this room is vibes, and I say that as somebody who does vibes.",
];

const SASS_UK = [
  "I love {school} and we cannot rebound. Both of those can be true in the same sentence.",
  "We have every resource in {catsCity} and we're {record}. Don't tell me to trust the process, I live this.",
  "Not a homer take. We got walked. I watched it with my own two eyes and I'm still here.",
  "If this was anybody else this room would have {coach} on the clock. Because it's us y'all want to do yoga.",
  "I'm not leaving. I'm also not pretending that was {cats} basketball. We were late on every closeout.",
  "{coach} is ours. I still want a better closeout. That's allowed. That's actually the job of being a fan.",
  "We'll be in the dance because that's the floor here. If we're not, then we have a real problem and I will be loud about it.",
  "You don't know {cats} if you think we panic in November. You also don't know us if you think this is fine.",
  "I have been a {cats} fan through worse. This is still worse than it should be for a program like this.",
  "We don't rebuild, we reload. Cute slogan. Guard somebody.",
  "Oh we're running it back? In {catsCity}? I need a minute and also a rebound.",
  "Hire {name} if that's the guy, but don't tell me we can't get a teacher. We can get whoever we want.",
  "I've got {cats} in my blood and I'm still going to say we stink when we stink. That's the deal.",
  "Y'all would fire a guy for this at a normal school. Because it's {school} everybody wants to write a novel.",
  "I can love this program and still say that was embarrassing. Watch me.",
  "Don't start with me about patience. {school} doesn't even box out, and I say that as somebody who will be there in March anyway.",
  "We should be better than this. That's not panic. That's the standard, and I didn't invent it.",
  "Put {name} on our bench if that's the rumor. I just want the kids to compete. That's it. That's the homer and the realist in one.",
];

const SASS_LENS = [
  "Cute. At {cats} that's a Tuesday problem and we still complain.",
  "{school} playing like that's a standard. We would have that staff in a meeting.",
  "Anyway I'm a {cats} fan so take it with that, but {name} can actually coach.",
  "If {name} can recruit like that I want him in {catsCity}, I'm not even joking.",
  "Y'all comparing {school} to us and I need you to watch a possession first.",
  "{school} could not guard a parked car. We have our own problems but at least we know it.",
  "SEC talk and nobody wants to mention we still have to play these people.",
  "I said {name} two cycles ago and this room talked over me. As a {cats} person I am used to being ignored until I'm right.",
  "If {school} hires another press conference I am going to be so annoying about it. We have done this movie.",
  "Somebody get {name} on the phone before a program with money does. And yes I am looking at my own school too.",
  "{school} fans in here doing the most and they still don't rebound. I would know. I do the most. We rebound more than that.",
  "Has {from} been a better job than people in here want to admit, or am I the only one with eyes? Asking as somebody who watches us every night.",
  "I would like {school} to compete, as a treat. Same speech I give {cats} in February.",
  "Put {name} in that building and those kids would at least close out. Low bar. Still the bar. We don't always clear it either.",
  "I have been too nice in this thread. {school} stinks. I can say that and still be a {cats} homer. Watch.",
  "Living room people can sit down. Can {name} coach? Yes. Would I take him in {catsCity}? Maybe. Next question.",
  "Oh {school} is in here acting brand new, that's cute. Come to our building and then talk.",
  "Don't start with me about {coach}. I have watched this, I have receipts, I am tired, and we still have {rival} on the calendar.",
];

function sassPool(vars: Record<string, string | number>) {
  if (aboutCats(vars)) return [...SASS_UK, ...SASS_ALWAYS];
  return [...SASS_LENS, ...SASS_ALWAYS];
}

const WARCAT_LINES = [
  "Watched {school} last night. They don't have a late-game action and everybody in the building knew it.",
  "{name} can actually teach a closeout. That's the file. The rest of this room is arguing a press conference.",
  "If you watched the last eight minutes you'd stop talking about patience. They don't rebound and they don't guard.",
  "{school} is not a bad job. People just don't like the city. Those are different sentences.",
  "I'm not guessing. {name} wins with toughness and the kids play, and that's been true for two years.",
  "The sheet caught {school} weeks ago. The eye test showed up Tuesday. Now everybody in here is an expert.",
  "Hire a teacher. I keep saying it because this room keeps wanting a brand.",
  "Watch a possession. Just one. Then tell me {coach} has this.",
  "{record} is the symptom. They haven't boxed out since Thanksgiving, that's the disease.",
  "I don't think {name} is a miracle worker. I think he gets five extra possessions a night out of competing, which at that level is the whole sport.",
  "This is a development job and they're going to hire the guy with the agent. I have seen this movie. I did not like the ending.",
  "Living rooms don't put you in the dance. Resume does. {school} doesn't have one yet and that's fine, just don't lie about it.",
  "Can we talk about who actually coaches? {name} does. I don't need a longer version than that.",
  "You can feel a bad hire coming when the first guy in the thread is a logo and not a teacher.",
  "{from} is a real program if you watch them play. This room only notices when a bigger job calls.",
  "I'm going to be boring. They don't guard the nail, they don't close out, and the rest is noise.",
  "Ok. Serious question. Has anybody in here watched {school} on a Tuesday, or are we just going off the record?",
  "justwarcat take, and I will own it: {name} to {school} is the one that actually makes them compete.",
  "Hopper can mute me after. {coach} doesn't have those kids competing, and wishing doesn't put them in the dance.",
  "Not a homer, not a hater. {school} got walked in the paint and that's a coaching problem until it isn't.",
  "Somebody in here said be patient. Patient for what. They've had the same late-clock issue for a month.",
  "I called {name} last cycle and this room talked over me. That's fine. The kids still played for him.",
  "If {school} wants the dance they need a guy who can teach. {name} is that guy. Screenshot it.",
  "I'm not doing chaos tonight. Watch the glass. That's the whole post.",
  "Film doesn't lie on {name}. He teaches, the kids compete, and this server will act shocked when a bigger job calls.",
  "Y'all arguing a 2-3 and {school} hasn't had the athletes for man in two years. That's the actual read.",
  "I've watched {from}. He wins with junk and toughness. That's a coach. Hire him.",
  "Don't @ me with vibes. {school} doesn't box out, {name} would make them, next question.",
];

const BONTEMPS_LINES = [
  "Hearing {name} is on the {school} list. That's been true for a week. This room just caught up.",
  "Not a firing. A conversation. There's a difference, and {school} is in the conversation.",
  "I've had {from} losing {name} if a real job opens. Writing it down again so we have it.",
  "That's a real candidate. I don't need the rest of the paragraph.",
  "AD at {school} asked around on {name}. Asking around is how these start.",
  "{coach} still has the locker room. He does not have the people who write the checks. That's the {school} read.",
  "I'm not doing a mock. {name} is in play at {school}. That's the post.",
  "People in that building are tired. You don't go {record} and call it competing.",
  "Quiet on {school} today, which is usually the tell.",
  "If {school} opens, the first call is {name}. The second call is whoever sells tickets. We'll see which one they make.",
  "bontemps here. {name} has been told he'd be the guy. The job isn't open. Yet.",
  "Stop asking me if he's fired. He isn't. He's also not surviving {record} at a place like {school}.",
  "I don't leak for fun. {from} is about to lose a coach if {school} is serious.",
  "Search firm already has a file. They don't pay those people to sit around.",
  "Heard {name} would listen. Listen is not take. Still matters.",
  "I'm going to be short. {school} is further along than the fanbase thinks.",
  "{cand1} would take it. {cand2} would think about it. That's the board tonight.",
  "This is a jobs post. {name} can coach. The rest is noise you can have in lounge.",
  "Don't tweet he's gone. Tweet that {school} has asked around. Those are different sentences.",
  "I've been on {name} since November. Bigger jobs are asleep. That's their problem.",
  "Two people have {name} on a {school} board tonight. I'm not adding a third for fun.",
  "If {school} does the vote of confidence bit this week, that's the tell. You already know.",
  "I wouldn't run it back. {record} is not another year of this, and I don't think they think it is either.",
  "Hearing the holdup is on their end, not his. {name} would go.",
];

const LANDO_LINES = [
  "Anyway I sat through {school} on a Tuesday and I need somebody to tell me what the plan is, because I couldn't find one.",
  "lando.marshall in. This {school} thing isn't a bit. Those kids can feel it.",
  "I don't even want a firing. I want {school} to look like they care about boxing out, which is a really low bar, and they are still under it.",
  "Brother they hired {coach} to compete and now we're doing this again. I have seen this play.",
  "If {name} walks into that building the whole thing changes. Not the logo. The way they run back on defense.",
  "I'm going to ramble. {school} has money, a gym, and no toughness, and I don't know how you spend all year explaining that.",
  "Short version: hire {name}. Long version: hire {name} before somebody with a pulse does.",
  "I keep trying to watch {school} like a normal person and then they don't close out and I'm back in this server. That's on me.",
  "Has anybody in here actually been to {city}? Because the job is better than this room thinks, and {name} would take it.",
  "I'm not mad at {coach}. I'm mad at the people who keep asking him to do it with nothing. Different complaint.",
  "{record} and we're still doing patience. I ran out of patience in January, politely.",
  "lando take: {from} is a real program if you sit there. This room only cares when a bigger job calls.",
  "Somebody in here said splash hire. I said teacher. We are not the same.",
  "I wrote a longer post and deleted it. {school} doesn't guard. That's the whole essay.",
  "The funny part is {name} would actually like {city}. The unfunny part is {school} might hire a press conference anyway.",
  "Ok I'm caught up. They're cooked, right? Yeah. Cooked. Moving on is allowed.",
  "I have a cousin who went to {school}. He texts me during games. I do not know how to answer him anymore.",
  "Don't make this a referendum on the sport. Make it a referendum on whether {school} can rebound. They cannot.",
  "If I disappear for a week it's because {school} scheduled a Tuesday and I have to lie down after.",
  "Anyway. {name}. Call him. That's the tweet. That's the Discord. That's me done.",
  "I said this last year and I'll say it again, {school} doesn't compete on the glass and everything else is a costume.",
  "Hopper can yell. I'm still going to write the long one. {name} can coach, {school} needs that, goodnight.",
  "There's a version of this where {school} just hires a teacher and we all get to watch basketball. I would like that version.",
  "I'm not a source. I'm a guy who watched {school} fail to box out for forty minutes and now I live here.",
];

const REBORNE_LINES = [
  "I left. I came back. {school} is still like this. I don't know what I expected.",
  "reborne in. Logged off for a reason. Logging back on because they still don't box out.",
  "I used to argue this job. Now I just watch {school} fold and nod.",
  "Been gone two cycles. {coach} is still here. That's the whole post.",
  "I told people I was done with this server. Then {school} went {record} and here I am. Weak.",
  "Don't welcome me back. Hire {name} and I might leave again, which would be a gift to all of us.",
  "I already did this thread last year. Same {school}. Same no toughness. I am so tired.",
  "Came back for one night. {school} still can't throw it in the ocean. I'm going back to bed.",
  "I was happier when I didn't know {coach} still had this job. Ignorance was the move.",
  "reborne take, and I already said it in 2024: {name} can coach, {school} will ignore him, we will do this again.",
  "I logged off so I would stop caring. I failed. {from} is a real program and this room is late.",
  "Short. I came back. They're cooked. Goodnight.",
  "Every time I mute this place {school} finds a new way to not rebound. It's a talent.",
  "I'm not new. I'm returned. {school} needed a teacher last time too.",
  "If {name} gets that job I can log off for real. If they hire a splash I am staying, bitterly.",
  "I quit this sport in February. {record} at {school} pulled me back in. That's embarrassing for me.",
  "The building didn't change while I was gone. The excuses got longer.",
  "I don't have a new take. I have the old one. {name}. Call him. I'm going back to lurking.",
  "Welcome back to me, I guess. {school} still doesn't guard the nail. Hi.",
  "I was out. I'm in. Hopper can mute me, I've been muted before, it didn't take.",
  "Came back to see if {city} got serious. They did not.",
  "I missed nothing except {school} pretending {record} is a process. It isn't.",
];

const ANGELYNE_LINES = [
  "Put {school}'s best guy in a gym. Then talk to me about a 2-3.",
  "Angelyne-1v1. That's a stay-in-front problem. They cannot stay in front of anybody.",
  "Straight up: {name}'s kids compete. {school}'s kids hope. Run it back if you want, the result doesn't change.",
  "I don't need film class. I need to know who can hoop. {name}'s guys can hoop.",
  "That's not a scheme issue. That's nobody who wants to guard for 94 feet. I would know. I play.",
  "1v1 in that gym and {school} gets cooked. That's the program in a sentence.",
  "Hopper can say this isn't a rec gym. The rec gym still has more toughness than {school} right now.",
  "If you can't stay in front of a ball handler, sit down. {coach} has a whole roster that cannot.",
  "I said run it. They ran it. {school} still doesn't compete. Next.",
  "Angelyne take: hire the guy whose players actually want to guard. That's {name}. Screenshot it.",
  "{record} is what happens when nobody in the building can keep a dude in front of them. That's it.",
  "Y'all arguing motion. I'm asking who wins if you throw the keys on the floor. Different sport to this room, same gym.",
  "I've guarded people. {school} has not. That's the energy.",
  "Don't send me a clip of a set. Send me a clip of a closeout. You don't have one. I checked.",
  "Put {name} on that bench and those kids would at least try. Trying is the whole sport at this level.",
  "I'm not doing a zone debate. Can they stay in front? No. Hire {name}. Yes. Bye.",
  "Somebody in here has never been crossed up and it shows. {school} gets crossed up every night.",
  "Straight up respect to {from}. Those kids play. {school} should want that, and they won't, because they never do.",
  "1v1 me in the replies if you think {coach} has this. You don't. He doesn't.",
  "I came here for jobs and stayed because {school} refuses to guard. That's a lifestyle I did not ask for.",
  "Run it back. Same result. They don't compete on the ball. {name} would make them.",
  "Angelyne-1v1 out after this: {school} needs a teacher who cares about the first step. {name} is that. Goodnight.",
];

const BLUR_LINES = [
  "That's a second-side problem and {school} does not have a second side. Comedy, except the standings.",
  "{name} can teach. {coach} can talk. Hire the first one. I will not be taking questions.",
  "Witty version: they don't rebound. Longer version: they don't rebound, they don't have a late-clock action, and {record} is the receipt.",
  "If you watched {from} for a half you'd already know. It's not subtle.",
  "Everybody wants a splash. {name} would just win. I know that's less fun. I also know who makes the tournament.",
  "I would diagram the empty-side stagger but then you'd have to watch basketball, and we can't have that.",
  "Not a rumor. A diagnosis. {school} lost the glass in November. The job follows in March.",
  "bLuRbonics take, filed: {name}. Call him before a school with money does. You will not get a cuter version of this.",
  "They'll fire {coach} for the wrong reason. The right reason is they never close out. You're welcome.",
  "Short: {name}. Medium: he can actually coach. Long: I already said this and y'all wanted a brand.",
  "{school} is running a 2-3 like it's 2008 and the other team has shooters. That's not stubborn. That's a choice.",
  "I like {name} because his kids play on time. Wild concept. Apparently rare.",
  "You can tell who watched. justwarcat watched. The rest of this is karaoke.",
  "If {city} wants a teacher, the list is short and {name} is on it. If they want a press conference, they'll find one. They always do.",
  "Funny thing about {record}: it looks like bad luck until you count the second-chance points. Then it looks like math.",
  "I'm not yelling. I'm annotating. {coach} cannot get a stop in the last four minutes. Annotate that.",
  "Hire the guy whose teams don't turn it over when the shot clock is under eight. That's {name}. That's the whole search.",
  "I said it nicer in October. {school} still doesn't box out. My patience is not a renewable resource.",
  "People in here arguing vibe. The vibe is they don't guard the nail. The hire is {name}. Goodnight from me.",
  "I can do jokes. I can also tell you {from} is a real program and {school} is pretending. Both can be true.",
  "The cut is {name} knows how to use a timeout. {coach} uses them to look busy. Different skill.",
  "Anyway. They're cooked on the glass, {name} would fix it, and I am once again asking this server to watch a game.",
];

const JUMP_WHY = [
  "{record} at a {conf} school that was supposed to be .500",
  "{record} with nobody anybody recruited",
  "winning with walk-ons and a 2-3",
  "took a dead program and got them competing at {record}",
  "nobody on that roster was a five-star and they're {record}",
  "those kids compete every night at {record}",
  "mid-major guy doing bigger-job work at {record}",
  "they're in every game, toughness, {record}",
  "{record} and they actually compete every night",
];

const JUMP_WHY_SOFT = [
  "he's been winning with walk-ons and toughness",
  "the program was dead and it isn't anymore",
  "somebody with money is going to steal him",
  "the kids play hard and they compete",
  "they compete every night, which is the tell",
  "he won with junk when nobody was watching",
];

function rngFor(state: GameState, key: string) {
  return mulberry32(state.seed ^ hashString(`${key}:${state.season}:${state.week}:${state.phase}`));
}

function shuffled<T>(rng: Rng, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function fill(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{([a-z0-9]+)\}/gi, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

function takeTpl(rng: Rng, list: string[], used: Set<string>) {
  const unused = list.filter((l) => !used.has(l));
  const pool = unused.length ? unused : list;
  const t = pick(rng, pool);
  used.add(t);
  return t;
}

export function staffCoachName(state: GameState, teamId: string) {
  if (teamId === state.playerTeamId) return identityName(state.identity);
  const stored = state.teams[teamId]?.coachName;
  if (stored && stored !== "Staff") return stored;
  const rng = mulberry32(state.seed ^ hashString(`burner-coach:${teamId}`));
  const p = randomPersonName(rng);
  return `${p.first} ${p.last}`;
}

function tenureOf(state: GameState, teamId: string) {
  const rng = mulberry32(state.seed ^ hashString(`burner-tenure:${teamId}`));
  return 1 + Math.floor(rng() * 16);
}

function expectedWinPct(prestige: number) {
  return Math.max(0.32, Math.min(0.86, 0.28 + prestige / 155));
}

function tooEarly(state: GameState) {
  return state.phase === "preseason" || (state.phase === "regular" && state.week < 5);
}

function schoolBit(state: GameState, id: string): SchoolBit | null {
  const t = state.teams[id];
  const seed = TEAM_BY_ID[id];
  if (!t || !seed) return null;
  const games = t.wins + t.losses;
  const winPct = games ? t.wins / games : 0.5;
  const expected = expectedWinPct(t.prestige);
  const heatBase = expected - winPct;
  const heat =
    games < 6
      ? 0
      : heatBase + (t.prestige >= 78 && winPct < 0.45 ? 0.12 : 0) + (t.losses - t.wins >= 6 ? 0.1 : 0);
  return {
    id,
    name: seed.name,
    abbr: seed.abbr,
    coach: staffCoachName(state, id),
    prestige: t.prestige,
    wins: t.wins,
    losses: t.losses,
    confW: t.confW,
    confL: t.confL,
    record: `${t.wins}-${t.losses}`,
    games,
    winPct,
    heat,
    tenure: tenureOf(state, id),
    conf: leagueName(t.conference, state.season),
    city: seed.city,
    expected,
  };
}

function allSchools(state: GameState): SchoolBit[] {
  const out: SchoolBit[] = [];
  for (const id of Object.keys(state.teams)) {
    const s = schoolBit(state, id);
    if (s) out.push(s);
  }
  return out;
}

function asstName(state: GameState, schoolId: string, salt: string) {
  const rng = mulberry32(state.seed ^ hashString(`burner-asst:${schoolId}:${salt}`));
  const p = randomPersonName(rng);
  return `${p.first} ${p.last}`;
}

function destForPos(state: GameState, pos: string, fromId: string, rng: Rng, counts: Map<string, number>) {
  const need: { id: string; score: number }[] = [];
  for (const id of Object.keys(state.teams)) {
    if (id === fromId) continue;
    const t = state.teams[id]!;
    const n = counts.get(`${id}:${pos}`) ?? 0;
    const score = t.prestige - n * 8 + rng() * 6;
    need.push({ id, score });
  }
  need.sort((a, b) => b.score - a.score);
  return need[0]?.id ?? Object.keys(state.teams)[0]!;
}

function posCounts(state: GameState) {
  const m = new Map<string, number>();
  for (const p of state.players) {
    if (p.mpg < 16) continue;
    const k = `${p.teamId}:${p.pos}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function rumoredPortal(state: GameState, rng: Rng): PortalBit[] {
  const live = portalOpen(state);
  const bits: PortalBit[] = [];
  const counts = posCounts(state);
  if (live) {
    const ranked = [...portalOf(state).transfers].sort((a, b) => b.ovr - a.ovr);
    for (const t of ranked) {
      if (bits.length >= 7) break;
      const destId = t.committedTo || t.offers[0] || destForPos(state, t.pos, t.fromId, rng, counts);
      const dest = TEAM_BY_ID[destId];
      bits.push({
        name: `${t.first} ${t.last}`,
        pos: t.pos,
        fromId: t.fromId,
        from: TEAM_BY_ID[t.fromId]?.name ?? t.fromId,
        ovr: t.ovr,
        mpg: t.mpg,
        reason: reasonLine(t),
        destName: dest?.name ?? "a bigger job",
        destAbbr: dest?.abbr ?? "HM",
        committed: Boolean(t.committedTo),
        live: true,
      });
    }
  }
  const scored = state.players
    .filter((p) => p.teamId && (p.year < 4 || p.redshirt))
    .map((p) => {
      const bench = p.ovr >= 74 && p.mpg < 17 ? 18 : 0;
      const mood = p.morale < 58 ? 14 : 0;
      const star = p.ovr >= 80 ? 6 : 0;
      return { p, score: bench + mood + star + (100 - p.morale) * 0.2 };
    })
    .filter((x) => x.score >= 16)
    .sort((a, b) => b.score - a.score);
  for (const { p } of scored) {
    if (bits.length >= 10) break;
    if (bits.some((b) => b.name === `${p.first} ${p.last}`)) continue;
    const destId = destForPos(state, p.pos, p.teamId, rng, counts);
    const dest = TEAM_BY_ID[destId];
    bits.push({
      name: `${p.first} ${p.last}`,
      pos: p.pos,
      fromId: p.teamId,
      from: TEAM_BY_ID[p.teamId]?.name ?? p.teamId,
      ovr: p.ovr,
      mpg: Math.round(p.mpg),
      reason: p.morale < 52 ? "locker room went cold" : p.mpg < 14 ? "wants a real role" : "looking at his options",
      destName: dest?.name ?? "a high major",
      destAbbr: dest?.abbr ?? "HM",
      committed: false,
      live: false,
    });
  }
  return bits.slice(0, 10);
}

export interface CarouselLand {
  hot: SchoolBit[];
  jump: JumpBit[];
  openings: OpeningBit[];
  you: SchoolBit | null;
}

export function carouselLand(state: GameState): CarouselLand {
  const rng = rngFor(state, "land");
  const schools = allSchools(state);
  const you = schools.find((s) => s.id === state.playerTeamId) ?? null;
  const hot = [...schools].sort((a, b) => b.heat - a.heat).filter((s) => s.games >= 6 && s.heat > 0.12).slice(0, 6);
  const jump: JumpBit[] = [...schools]
    .filter((s) => s.prestige < 74 && s.games >= 5 && s.winPct > s.expected + 0.12)
    .sort((a, b) => b.winPct - a.winPct)
    .slice(0, 4)
    .map((s) => ({
      school: s,
      why: fill(pick(rng, JUMP_WHY), { record: s.record, conf: s.conf }),
    }));
  if (jump.length < 3) {
    const extra = [...schools].filter((s) => s.prestige < 70 && s.id !== state.playerTeamId).sort((a, b) => b.prestige - a.prestige);
    for (const s of extra) {
      if (jump.some((j) => j.school.id === s.id)) continue;
      jump.push({ school: s, why: pick(rng, JUMP_WHY_SOFT) });
      if (jump.length >= 4) break;
    }
  }
  const openPool =
    state.phase === "offseason"
      ? hot.filter((s) => s.heat > 0.14 || s.prestige >= 76)
      : hot.filter((s) => s.heat > 0.2 || (s.prestige >= 80 && s.winPct < 0.42 && s.games >= 8));
  const openings: OpeningBit[] = [];
  for (const school of openPool.slice(0, 4)) {
    const cands: OpeningBit["candidates"] = [];
    for (const j of shuffled(rng, jump).slice(0, 2)) {
      cands.push({ name: j.school.coach, from: j.school.name, kind: "hc" });
    }
    const blue = shuffled(rng, schools.filter((s) => s.prestige >= 78 && s.id !== school.id)).slice(0, 2);
    for (const b of blue) {
      cands.push({ name: asstName(state, b.id, school.id), from: `${b.name} staff`, kind: "asst" });
    }
    openings.push({
      school,
      why: school.games ? `${school.record}, ${school.tenure} years in` : `${school.tenure} years in and the building is restless`,
      candidates: cands.slice(0, 3),
    });
  }
  return { hot, jump, openings, you };
}

function fieldOrDash(lines: string[], empty = "nothing I'm putting my name on") {
  const t = lines.filter(Boolean).join("\n");
  return t || empty;
}

export function landscapeEmbed(state: GameState, land?: CarouselLand): BurnerEmbed {
  const L = land ?? carouselLand(state);
  const moved = (state.coachMoves ?? []).filter((m) => m.season === state.season);
  const fields = [
    {
      name: "Hot seats",
      value: fieldOrDash(
        L.hot.slice(0, 4).map((s) => `${s.name} (${s.record})`),
        "Too early. Ask after they play a month.",
      ),
    },
    { name: "On the board", value: fieldOrDash(L.jump.slice(0, 3).map((j) => `${j.school.coach} — ${j.school.name}`)) },
    { name: "Openings", value: fieldOrDash(L.openings.slice(0, 3).map((o) => `${o.school.name} · ${o.why}`), "none I believe in") },
  ];
  if (moved.length) {
    fields.unshift({
      name: "Already moved",
      value: fieldOrDash(moved.slice(0, 4).map((m) => `${m.school}: ${m.note}`)),
    });
  }
  return {
    color: "#f0b232",
    title: `The carousel · Week ${state.week}`,
    desc: moved.length ? "These jobs already turned over." : "Don't put this on Twitter.",
    fields,
    footer: "Burner Watch",
  };
}

export function portalEmbed(state: GameState): BurnerEmbed {
  const rng = rngFor(state, "slash-portal");
  const bits = rumoredPortal(state, rng);
  const era = eraPortal(state.eraDecade);
  const lines = bits.slice(0, 5).map((b) => `${b.name} · ${b.pos} · ${b.from} → ${b.destName}`);
  return {
    color: "#5ad0c8",
    title: era === "none" ? "Transfer sit-outs" : portalOpen(state) ? `${portalOf(state).window} portal` : "Portal watch",
    desc:
      era === "none"
        ? "He still sits a year. @Portal stop talking like it's a video game."
        : "Names Burner Watch will stand on. If it isn't here, I don't have it.",
    fields: [{ name: "Names", value: fieldOrDash(lines) }],
    footer: `Burner Watch · ${state.season}`,
  };
}

export function burnerSlash(state: GameState, id: BurnerSlashCmd["id"]): { command: string; embed: BurnerEmbed; note: string } {
  const land = carouselLand(state);
  if (id === "hotseats") {
    const moved = (state.coachMoves ?? []).filter((m) => m.season === state.season);
    const turned = state.phase === "offseason" && moved.length > 0;
    return {
      command: "/hotseats",
      note: "Burner Watch",
      embed: {
        color: "#ed4245",
        title: "Hot seats",
        desc: turned ? "These seats already turned over." : "Who's in trouble. Nobody's been fired yet.",
        fields: [
          {
            name: turned ? "Out" : "Watching",
            value: fieldOrDash(
              turned
                ? moved.slice(0, 6).map((m) => `${m.school} · ${m.outName} out · ${m.inName} in`)
                : land.hot.slice(0, 6).map((s) => `${s.name} · ${s.coach} · ${s.record}`),
              "Too early. They haven't played a month.",
            ),
          },
        ],
        footer: "Burner Watch",
      },
    };
  }
  if (id === "names") {
    return {
      command: "/names",
      note: "Burner Watch",
      embed: {
        color: "#57f287",
        title: "On the board",
        desc: "Should already have a bigger job.",
        fields: [{ name: "The list", value: fieldOrDash(land.jump.slice(0, 4).map((j) => `${j.school.coach} · ${j.school.name} · ${j.why}`)) }],
        footer: "Burner Watch",
      },
    };
  }
  if (id === "portal") {
    return { command: "/portal", note: "Burner Watch", embed: portalEmbed(state) };
  }
  return { command: "/week", note: "Burner Watch", embed: landscapeEmbed(state, land) };
}

export function formatAgo(mins: number) {
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function react(rng: Rng, big: boolean): BurnerReaction[] {
  const pool = big
    ? [["🔥", 5, 21], ["💀", 3, 15], ["👀", 4, 17], ["😂", 3, 14], ["🚨", 2, 9], ["💯", 2, 11], ["😭", 2, 10], ["🫡", 1, 7]]
    : [["😂", 1, 6], ["💀", 1, 5], ["👍", 1, 5], ["😭", 1, 5], ["🧢", 1, 4], ["🗿", 1, 3], ["👀", 1, 4]];
  const n = big ? randInt(rng, 2, 4) : randInt(rng, 0, 2);
  return shuffled(rng, pool)
    .slice(0, n)
    .map(([label, lo, hi]) => ({ label: String(label), count: randInt(rng, Number(lo), Number(hi)) }));
}

class Thread {
  msgs: BurnerMessage[] = [];
  used = new Set<string>();
  n = 0;
  rng: Rng;
  channel: BurnerChannel;
  t0: number;
  clock: number;
  ctx: Record<string, string | number> = {};
  constructor(rng: Rng, channel: BurnerChannel, t0: number) {
    this.rng = rng;
    this.channel = channel;
    this.t0 = t0;
    this.clock = t0;
  }
  add(userId: string, body: string, opts?: { replyTo?: string; pinned?: boolean; big?: boolean; ago?: number; embed?: BurnerEmbed; system?: boolean }) {
    const clean = body.replace(/\s+/g, " ").trim();
    if (!clean && !opts?.embed && !opts?.system) return "";
    if (clean.length > 22 && this.msgs.some((m) => m.body === clean)) return "";
    this.n += 1;
    const id = `${this.channel}-${this.n}`;
    let ago = opts?.ago != null ? Math.max(1, opts.ago) : Math.max(1, this.clock - randInt(this.rng, 2, 9));
    if (opts?.replyTo) {
      const parent = this.msgs.find((m) => m.id === opts.replyTo);
      if (parent && ago >= parent.minutesAgo) ago = Math.max(1, parent.minutesAgo - randInt(this.rng, 1, 3));
    }
    if (ago < this.clock) this.clock = ago;
    this.msgs.push({
      id,
      channel: this.channel,
      userId,
      body: clean,
      minutesAgo: ago,
      replyTo: opts?.replyTo,
      pinned: opts?.pinned,
      embed: opts?.embed,
      system: opts?.system,
      reactions:
        opts?.system || opts?.embed
          ? opts?.big
            ? react(this.rng, true)
            : undefined
          : this.rng() < (opts?.big ? 0.95 : 0.45)
            ? react(this.rng, Boolean(opts?.big))
            : undefined,
    });
    return id;
  }
  tpl(list: string[], vars: Record<string, string | number>) {
    return fill(takeTpl(this.rng, list, this.used), vars);
  }
}

function speaker(rng: Rng, ids: string[]) {
  return pick(rng, ids);
}

function other(rng: Rng, ids: string[], skip: string) {
  const pool = ids.filter((id) => id !== skip);
  return pick(rng, pool.length ? pool : ids);
}

function eggVars(bits: Record<string, string | number>): Record<string, string | number> {
  return {
    school: "that job",
    coach: "that staff",
    name: "the mid-major guy",
    record: "the record",
    from: "a mid-major",
    games: 0,
    tenure: 4,
    cand1: "the first guy",
    cand2: "the second guy",
    player: "that kid",
    dest: "a bigger job",
    pos: "wing",
    mpg: 12,
    city: "town",
    cats: catsName(),
    catsCity: TEAM_BY_ID.kentucky?.city ?? "Lexington",
    rival: TEAM_BY_ID.louisville?.name ?? "the other school",
    ...bits,
  };
}

function liveLines(list: string[], games: number) {
  if (games >= 6) return list;
  return list.filter((l) => !/\{record\}|fire him|0-0/.test(l));
}

function sheetLine(
  era: number | null | undefined,
  aName: string,
  aRank: number,
  aEm: number,
  b?: { name: string; rank: number; em: number },
) {
  const old = era != null && era < 2010;
  if (b) {
    if (old) return `${aName} is RPI ${aRank} and ${b.name} is ${b.rank}, and the committee actually watches that number, fight me`;
    return `${aName} is ${aRank} on the sheet, ${b.name} is ${b.rank}, and efficiency says ${aEm >= b.em ? aName : b.name} even if you don't want it to`;
  }
  const em = `${aEm >= 0 ? "+" : ""}${aEm.toFixed(1)}`;
  if (old) return `${aName} is sitting around RPI ${aRank}, which is the number that gets you in or leaves you home`;
  return `${aName} is ${aRank} on the sheet (${em}), and the box score is a liar`;
}

function lastUserMsg(th: Thread) {
  for (let i = th.msgs.length - 1; i >= 0; i--) {
    const m = th.msgs[i]!;
    if (!m.system && m.body) return m.id;
  }
  return undefined;
}

const EGG_IDS = ["chief", "spivey", "travis", "notbb", "sass", "warcat", "bontemps", "lando", "reborne", "angelyne", "blur"] as const;

function eggPool(id: string, vars: Record<string, string | number> = {}) {
  if (id === "chief") return CHIEF_LINES;
  if (id === "spivey") return SPIVEY_LINES;
  if (id === "travis") return TRAVIS_LINES;
  if (id === "sass") return sassPool(vars);
  if (id === "warcat") return WARCAT_LINES;
  if (id === "bontemps") return BONTEMPS_LINES;
  if (id === "lando") return LANDO_LINES;
  if (id === "reborne") return REBORNE_LINES;
  if (id === "angelyne") return ANGELYNE_LINES;
  if (id === "blur") return BLUR_LINES;
  return NOTBB_LINES;
}

function dropEgg(th: Thread, vars: Record<string, string | number>, early: boolean, replyTo?: string) {
  const games = Number(vars.games ?? 0);
  const who = pick(th.rng, [...EGG_IDS]);
  const v = who === "sass" ? catsVars(vars) : vars;
  th.add(who, th.tpl(liveLines(eggPool(who, v), early ? 0 : games), v), replyTo ? { replyTo } : undefined);
}

function casualLines(kind: "job" | "watch" | "portal" | "jump"): string[] {
  if (kind === "portal") {
    return [
      "yeah {player} didn't look happy",
      "{mpg} minutes will do that",
      "I figured {from} was going to lose him",
      "{dest} makes sense if they need a {pos}",
      "not shocked",
      "his teammates probably knew",
      "is this a visit or is he actually gone",
      "{player} can play. the minutes were the issue",
      "{from} is going to say they wanted him back",
      "I'd take him if I was {dest}",
      "wait, {player}?",
      "that roster was crowded. somebody had to go",
    ];
  }
  if (kind === "watch") {
    return [
      "way too early",
      "{school} hasn't even played",
      "somebody wants a firing every October",
      "let them tip first",
      "{coach} might be fine",
      "check back in January",
      "it's a watch list, not a pink slip",
      "we do this every year",
    ];
  }
  if (kind === "jump") {
    return [
      "{name} is a good coach. a bigger job is different",
      "I've seen {from}. they play hard",
      "he might get a call. he might not",
      "winning there doesn't automatically travel",
      "I like him. not sure the money people will",
      "{record} is a real season",
      "has anybody watched them, or just the record",
      "he'd be a fine hire. not a splashy one",
    ];
  }
  return [
    "yeah that tracks",
    "I'll believe it when the school says it",
    "{record} is a problem if it holds",
    "{coach} might survive this",
    "not the wildest thing this week",
    "who else is even available",
    "{name} would be fine there",
    "the fans are louder than the results right now",
    "has anyone actually watched them lately",
    "they looked ordinary last time I saw them",
    "could just be a bad roster",
    "this rumor shows up every year",
    "if the buyout is big, they're staying",
    "I don't hate it",
    "is that sourced or a feeling",
    "{school} fans are going to be loud either way",
    "wait until the season's over",
    "lol ok",
    "not shocked",
    "maybe",
  ];
}

function voiceReply(
  th: Thread,
  userId: string,
  vars: Record<string, string | number>,
  kind: "job" | "watch" | "portal" | "jump",
  g: number,
) {
  const rng = th.rng;
  if (userId !== "hopper" && rng() < 0.58) return th.tpl(casualLines(kind), userId === "sass" ? catsVars(vars) : vars);
  if (userId === "notbb" && rng() < 0.78) return th.tpl(liveLines(NOTBB_LINES, g), vars);
  if (userId === "sass" && rng() < 0.78) return th.tpl(liveLines(sassPool(vars), g), catsVars(vars));
  if (userId === "warcat" && rng() < 0.82) return th.tpl(liveLines(WARCAT_LINES, g), vars);
  if (userId === "bontemps" && rng() < 0.82) return th.tpl(liveLines(BONTEMPS_LINES, g), vars);
  if (userId === "lando" && rng() < 0.82) return th.tpl(liveLines(LANDO_LINES, g), vars);
  if (userId === "reborne" && rng() < 0.82) return th.tpl(liveLines(REBORNE_LINES, g), vars);
  if (userId === "angelyne" && rng() < 0.82) return th.tpl(liveLines(ANGELYNE_LINES, g), vars);
  if (userId === "blur" && rng() < 0.84) return th.tpl(liveLines(BLUR_LINES, g), vars);
  if (userId === "chief" && rng() < 0.62) return th.tpl(liveLines(CHIEF_LINES, g), vars);
  if (userId === "spivey" && rng() < 0.62) return th.tpl(liveLines(SPIVEY_LINES, g), vars);
  if (userId === "travis" && rng() < 0.62) return th.tpl(liveLines(TRAVIS_LINES, g), vars);
  if (userId === "hopper" && rng() < 0.55) return th.tpl(HOPPER_LINES, catsVars(vars));
  if (userId === "film" && rng() < 0.78) return th.tpl(liveLines(kind === "jump" ? JUMP_BALL : REPLY_BALL, g), vars);
  if (userId === "buyout" && rng() < 0.72) return th.tpl(REPLY_MONEY, vars);
  if (kind === "portal") return th.tpl(rng() < 0.42 ? REPLY_VISIT : REPLY_PORTAL, vars);
  if (kind === "jump") return th.tpl(pick(rng, [JUMP_REPLY, JUMP_DOUBT, JUMP_BALL, REPLY_CHAT]), vars);
  if (kind === "watch") return th.tpl(liveLines(pick(rng, [REPLY_DOUBT, REPLY_ARGUE, REPLY_CHAT, SIDE_CHAT]), 0), vars);
  return th.tpl(
    liveLines(pick(rng, [REPLY_BELIEVE, REPLY_DOUBT, REPLY_HOMER, REPLY_BALL, REPLY_MONEY, REPLY_CHAT, REPLY_ARGUE]), g),
    vars,
  );
}

function around(
  th: Thread,
  talkers: string[],
  scoop: string,
  vars: Record<string, string | number>,
  kind: "job" | "watch" | "portal" | "jump",
  early = false,
) {
  const rng = th.rng;
  th.ctx = { ...vars };
  const games = Number(vars.games ?? 0);
  const a = speaker(rng, talkers);
  const b = other(rng, talkers, a);
  const c = other(rng, talkers, a === b ? a : b);
  const g = early ? 0 : games;
  const say = (id: string) => voiceReply(th, id, vars, kind, g);

  if (kind === "portal") {
    const shape = randInt(rng, 0, 7);
    if (shape <= 1) {
      th.add(a, say(a), { replyTo: scoop });
      if (rng() < 0.55) th.add(b, th.tpl(REPLY_SHORT, {}));
    } else if (shape === 2) {
      th.add(a, th.tpl(REPLY_VISIT, vars), { replyTo: scoop });
      th.add(b, say(b));
      if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
    } else if (shape === 3) {
      th.add("film", th.tpl(REPLY_PORTAL, vars), { replyTo: scoop });
      th.add(a, th.tpl(
        [
          "{player} wanted minutes, and they never learn, that's the whole sport now",
          "lol {from} really thought he was staying, which is cute",
          "{mpg} a night and they're shocked he's looking? ok",
        ],
        vars,
      ));
    } else if (shape === 4) {
      th.add("portal", th.tpl(REPLY_PORTAL, vars), { replyTo: scoop });
      dropEgg(th, vars, early, scoop);
    } else if (shape === 5) {
      const who = pick(th.rng, ["notbb", "sass", "warcat", "bontemps", "lando", "reborne", "angelyne", "blur"]);
      th.add(who, th.tpl(liveLines(eggPool(who, vars), g), who === "sass" ? catsVars(vars) : vars), { replyTo: scoop });
      th.add(a, th.tpl(REPLY_PORTAL, vars));
    } else {
      th.add(a, th.tpl(REPLY_PORTAL, vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_VISIT, vars));
      if (rng() < 0.45) th.add(c, th.tpl(REPLY_CHAT, vars));
    }
    return;
  }

  if (kind === "jump") {
    const shape = randInt(rng, 0, 13);
    if (shape === 0) {
      th.add(a, say(a), { replyTo: scoop });
      if (rng() < 0.5) th.add(b, th.tpl(REPLY_SHORT, {}));
    } else if (shape === 1) {
      const r1 = th.add(a, th.tpl(JUMP_REPLY, vars), { replyTo: scoop });
      th.add(b, th.tpl(JUMP_DOUBT, vars), { replyTo: r1 });
      if (rng() < 0.5) th.add(a, th.tpl(["Watch him coach and then talk, I'm serious", "You didn't watch {from} and it shows", "Film doesn't lie on this one", "Ok but he wins, so maybe start there"], vars));
    } else if (shape === 2) {
      th.add("film", th.tpl(JUMP_BALL, vars), { replyTo: scoop });
      th.add(a, say(a));
    } else if (shape === 3) {
      dropEgg(th, vars, early, scoop);
      th.add(a, th.tpl(rng() < 0.5 ? JUMP_DOUBT : REPLY_CHAT, vars));
    } else if (shape === 4) {
      th.add("travis", th.tpl(liveLines(TRAVIS_LINES, g), vars), { replyTo: scoop });
      th.add(a, th.tpl(["Not the Steele thing again", "He has a guy. He always has a guy, that's the bit", "Travis please", "Ok but hire a teacher though, I'm not even fighting you"], vars));
    } else if (shape === 5) {
      th.add("midmajor", th.tpl(JUMP_REPLY, vars), { replyTo: scoop });
      th.add(b, th.tpl(JUMP_DOUBT, vars));
      if (rng() < 0.4) th.add("notbb", th.tpl(liveLines(NOTBB_LINES, g), vars));
    } else if (shape === 6) {
      th.add("sass", th.tpl(liveLines(sassPool(vars), g), catsVars(vars)), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_ARGUE, vars));
    } else if (shape === 7) {
      th.add("warcat", th.tpl(liveLines(WARCAT_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else if (shape === 8) {
      th.add("bontemps", th.tpl(liveLines(BONTEMPS_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else if (shape === 9) {
      th.add("lando", th.tpl(liveLines(LANDO_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else if (shape === 10) {
      th.add("reborne", th.tpl(liveLines(REBORNE_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else if (shape === 11) {
      th.add("angelyne", th.tpl(liveLines(ANGELYNE_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else if (shape === 12) {
      th.add("blur", th.tpl(liveLines(BLUR_LINES, g), vars), { replyTo: scoop });
      th.add(b, th.tpl(rng() < 0.5 ? JUMP_REPLY : REPLY_CHAT, vars));
    } else {
      th.add(a, th.tpl(JUMP_REPLY, vars), { replyTo: scoop });
      if (rng() < 0.4) th.add("hopper", th.tpl(HOPPER_LINES, catsVars(vars)));
      if (rng() < 0.35) th.add(c, th.tpl(REPLY_SHORT, {}));
    }
    return;
  }

  if (kind === "watch") {
    const shape = randInt(rng, 0, 11);
    if (shape === 0) {
      th.add(a, say(a), { replyTo: scoop });
      if (rng() < 0.4) th.add(b, th.tpl(REPLY_SHORT, {}));
    } else if (shape === 1) {
      th.add("film", th.tpl(liveLines(REPLY_BALL, 0), vars), { replyTo: scoop });
      th.add(a, th.tpl(
        [
          "Too early for film class, {school} hasn't even tipped",
          "We have not played a game. Sit down.",
          "It's October and you're already diagramming, touch grass",
        ],
        vars,
      ));
    } else if (shape === 2) {
      th.add(a, th.tpl(
        [
          "Year they have to have, that's October talk and we do it anyway",
          "A watch list is not a firing, y'all cannot read",
          "Every November, every year, {school} is fine until they aren't",
        ],
        vars,
      ), { replyTo: scoop });
      dropEgg(th, vars, true, scoop);
    } else if (shape === 3) {
      th.add(a, th.tpl(REPLY_ARGUE, vars), { replyTo: scoop });
      th.add(b, th.tpl(SIDE_CHAT, vars));
    } else if (shape === 4) {
      th.add("sass", th.tpl(liveLines(sassPool(vars), 0), catsVars(vars)), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 5) {
      th.add("warcat", th.tpl(liveLines(WARCAT_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 6) {
      th.add("bontemps", th.tpl(liveLines(BONTEMPS_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 7) {
      th.add("lando", th.tpl(liveLines(LANDO_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 8) {
      th.add("reborne", th.tpl(liveLines(REBORNE_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 9) {
      th.add("angelyne", th.tpl(liveLines(ANGELYNE_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else if (shape === 10) {
      th.add("blur", th.tpl(liveLines(BLUR_LINES, 0), vars), { replyTo: scoop });
      th.add(b, th.tpl(REPLY_CHAT, vars));
    } else {
      th.add(b, say(b), { replyTo: scoop });
      if (rng() < 0.45) th.add(a, th.tpl(REPLY_SHORT, {}));
    }
    return;
  }

  const shape = randInt(rng, 0, 21);
  if (shape === 0) {
    th.add(a, say(a), { replyTo: scoop });
    if (rng() < 0.5) th.add(b, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 1) {
    const r1 = th.add(a, th.tpl(liveLines(REPLY_HOMER, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(REPLY_ARGUE, vars), { replyTo: r1 });
    if (rng() < 0.4) th.add(a, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 2) {
    th.add("film", th.tpl(liveLines(REPLY_BALL, g), vars), { replyTo: scoop });
    th.add(a, th.tpl(["You watched one clip", "Ok film nerd", "I'm not watching forty minutes of this", "Scheme talk already??"], vars));
    th.add("film", th.tpl(
      [
        "I watched {school} get walked in the paint three nights this month, sit down",
        "One clip? I've got a half of them not rotating",
        "They don't guard the nail for forty minutes, that's not a clip, that's the team",
      ],
      vars,
    ));
  } else if (shape === 3) {
    th.add("buyout", th.tpl(REPLY_MONEY, vars), { replyTo: scoop });
    th.add(a, say(a));
    if (rng() < 0.5) dropEgg(th, vars, early, scoop);
  } else if (shape === 4) {
    th.add(a, th.tpl(REPLY_BELIEVE, vars), { replyTo: scoop });
    th.add("hopper", th.tpl(HOPPER_LINES, catsVars(vars)));
    th.add(b, th.tpl(rng() < 0.5 ? SIDE_CHAT : REPLY_CHAT, vars));
  } else if (shape === 5) {
    th.add(a, th.tpl(REPLY_DOUBT, vars), { replyTo: scoop });
    th.add(b, th.tpl(liveLines(REPLY_BALL, g), vars));
    th.add(a, th.tpl(REPLY_ARGUE, vars));
  } else if (shape === 6) {
    th.add(a, th.tpl(
      [
        "Here comes the vote of confidence, kiss of death",
        "lmaooo the 'we believe in {coach}' tweet is loading",
        "They're gonna run it back and then fire him in March, bookmark this",
      ],
      vars,
    ), { replyTo: scoop });
    th.add("buyout", th.tpl(REPLY_MONEY, vars));
    th.add(b, th.tpl(liveLines(REPLY_HOMER, g), vars));
  } else if (shape === 7) {
    dropEgg(th, vars, early, scoop);
    th.add(a, say(a));
    if (rng() < 0.45) th.add(b, th.tpl(REPLY_ARGUE, vars));
  } else if (shape === 8) {
    th.add(a, th.tpl(
      [
        "Is {name} actually leaving {from}, or is this just a list?",
        "Wait, is {name} the guy, or are we chasing a splash hire again?",
        "{name} to {school} feels real, or I'm bored, 50/50",
      ],
      vars,
    ), { replyTo: scoop });
    th.add(b, say(b));
    th.add(a, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 9) {
    th.add("travis", th.tpl(liveLines(TRAVIS_LINES, g), vars), { replyTo: scoop });
    th.add(a, th.tpl(["Not the Steele thing again", "He has a guy, he always has a guy", "Travis. Please.", "Ok hire a teacher, we get it"], vars));
    th.add("travis", th.tpl(["Hire a teacher. Start there.", "I said what I said", "A whiteboard and boxing out, that's the sport"], vars));
  } else if (shape === 10) {
    th.add(a, th.tpl(liveLines(REPLY_HOMER, g), vars), { replyTo: scoop });
    th.add("kenpom", th.tpl(
      [
        "{school} is cooked on the sheet and y'all just caught up",
        "The computer had {school} dead two weeks ago",
        "Efficiency said this. Box score people are late.",
      ],
      vars,
    ));
    th.add(b, th.tpl(REPLY_ARGUE, vars));
  } else if (shape === 11) {
    th.add("notbb", th.tpl(liveLines(NOTBB_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_ARGUE : REPLY_CHAT, vars));
    if (rng() < 0.45) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 12) {
    th.add(a, th.tpl(REPLY_CHAT, vars), { replyTo: scoop });
    th.add(b, say(b));
    th.add(c, th.tpl(rng() < 0.5 ? REPLY_SHORT : SIDE_CHAT, vars));
  } else if (shape === 13) {
    th.add(a, say(a), { replyTo: scoop });
    th.add(b, th.tpl(REPLY_BELIEVE, vars));
    th.add("notbb", th.tpl(liveLines(NOTBB_LINES, g), vars));
  } else if (shape === 14) {
    th.add("sass", th.tpl(liveLines(sassPool(vars), g), catsVars(vars)), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_ARGUE : REPLY_CHAT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 15) {
    th.add("warcat", th.tpl(liveLines(WARCAT_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_BALL : REPLY_CHAT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 16) {
    th.add("bontemps", th.tpl(liveLines(BONTEMPS_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_CHAT : REPLY_DOUBT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 17) {
    th.add("lando", th.tpl(liveLines(LANDO_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_ARGUE : REPLY_CHAT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 18) {
    th.add("reborne", th.tpl(liveLines(REBORNE_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_CHAT : REPLY_DOUBT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 19) {
    th.add("angelyne", th.tpl(liveLines(ANGELYNE_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_BALL : REPLY_CHAT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else if (shape === 20) {
    th.add("blur", th.tpl(liveLines(BLUR_LINES, g), vars), { replyTo: scoop });
    th.add(b, th.tpl(rng() < 0.5 ? REPLY_BALL : REPLY_CHAT, vars));
    if (rng() < 0.4) th.add(c, th.tpl(REPLY_SHORT, {}));
  } else {
    th.add(a, th.tpl(REPLY_BELIEVE, vars), { replyTo: scoop });
    th.add(b, th.tpl(liveLines(REPLY_HOMER, g), vars));
    th.add(c, th.tpl(liveLines(REPLY_BALL, g), vars));
    if (rng() < 0.4) dropEgg(th, vars, early);
  }
}

function ensureEggs(th: Thread, vars: Record<string, string | number>, early: boolean) {
  const v = { ...vars, ...th.ctx };
  const games = Number(v.games ?? 0);
  const anchor = lastUserMsg(th);
  for (const id of EGG_IDS) {
    let have = th.msgs.filter((m) => m.userId === id).length;
    while (have < 2) {
      const casual = have === 0 || th.rng() < 0.65;
      const line = casual
        ? th.tpl(casualLines("job"), id === "sass" ? catsVars(v) : v)
        : th.tpl(liveLines(eggPool(id, v), early ? 0 : games), id === "sass" ? catsVars(v) : v);
      th.add(id, line, anchor ? { replyTo: anchor } : undefined);
      have++;
    }
  }
}

function talkersOf(rng: Rng) {
  const pinned = ["chief", "spivey", "travis", "notbb", "sass", "warcat", "bontemps", "lando", "reborne", "angelyne", "blur", "hopper", "film"];
  const rest = shuffled(
    rng,
    USERS.filter((u) => u.id !== "trilly" && !u.bot && !pinned.includes(u.id)).map((u) => u.id),
  );
  return [...pinned, ...rest].slice(0, 18);
}

function jobVars(open: OpeningBit, land: CarouselLand): Record<string, string | number> {
  const cand = open.candidates[0];
  const cand2 = open.candidates[1];
  return {
    school: open.school.name,
    coach: open.school.coach,
    record: open.school.record,
    tenure: open.school.tenure,
    name: cand?.name ?? "a mid-major guy",
    from: cand?.from ?? "a mid-major",
    cand1: cand?.name ?? "the mid-major guy",
    cand2: cand2?.name ?? "an assistant with a file",
    games: open.school.games,
    city: open.school.city,
    conf: open.school.conf,
  };
}

function buildCarousel(state: GameState, land: CarouselLand, rng: Rng, talkers: string[]) {
  const th = new Thread(rng, "carousel", 19 * 60 + randInt(rng, 20, 180));
  const early = tooEarly(state);
  const hotNames = land.hot.slice(0, 4).map((s) => s.name).join(", ") || "nobody. too early.";
  const jumpNames = land.jump.slice(0, 3).map((j) => `${j.school.coach} (${j.school.name})`).join(", ") || "a short list";
  th.add("watch", "Burner Watch pinned a message.", { system: true, ago: 22 * 60 });
  th.add("watch", `week ${state.week}.`, {
    pinned: true,
    big: true,
    ago: 21 * 60,
    embed: landscapeEmbed(state, land),
  });
  th.add(
    "trilly",
    early
      ? `No hot seats yet, they haven't played. Names I'm on: ${jumpNames}. Don't put me on Twitter.`
      : `Hot seats: ${hotNames}. Names I'm on: ${jumpNames}. More as I get it — don't put me on Twitter.`,
    { big: true },
  );

  if (state.snake && state.snake.season === state.season) {
    const s = state.snake;
    const scoop = th.add("trilly", `${s.coach} left ${s.from} for ${s.to}. I'm not dressing that up.`, { big: true, ago: 12 });
    th.add("hopper", `${s.from} was a launch pad. That's the whole story.`, { replyTo: scoop, ago: 10 });
    th.add("reborne", `Snake. Smiled for the camera in October and already had the next job in his head.`, { replyTo: scoop, ago: 8 });
    th.add("blur", `${s.coach} used ${s.from} to get a bigger chair. Don't call it a fit.`, { replyTo: scoop, ago: 6 });
    th.add("angelyne", `The kids stay. He doesn't. ${s.to} can have him.`, { replyTo: scoop, ago: 5 });
    th.add("sass", `I knew ${s.from} was a stepping stone the day he took it. Congratulations, I guess.`, { replyTo: scoop, ago: 4 });
  }

  if (early) {
    th.add("trilly", "Too early to fire anybody. Names below — ask me again after somebody loses six.", { big: true });
    th.add(speaker(rng, talkers), "Every year somebody wants a guy fired in November, and every year I have to read it.");
    if (rng() < 0.4) th.add(speaker(rng, talkers), th.tpl(REPLY_SHORT, {}));
    const watch = [...(land.you ? [land.you] : []), ...allSchools(state)]
      .filter((s, i, a) => s.prestige >= 76 && s.tenure >= 4 && a.findIndex((x) => x.id === s.id) === i)
      .slice(0, 2);
    for (const seat of watch) {
      const vars = {
        school: seat.name,
        coach: seat.coach,
        record: "hasn't tipped",
        tenure: seat.tenure,
        name: land.jump[0]?.school.coach ?? "a mid-major guy",
        from: land.jump[0]?.school.name ?? "a mid-major",
        cand1: land.jump[0]?.school.coach ?? "the mid-major guy",
        cand2: land.jump[1]?.school.coach ?? "an assistant with a file",
        games: seat.games,
        city: seat.city,
      };
      const scoop = th.add("trilly", th.tpl(TRILLY_WATCH, vars), { big: true });
      around(th, talkers, scoop, vars, "watch", true);
    }
    for (const j of land.jump.slice(0, 2)) {
      const vars = {
        school: j.school.name,
        coach: j.school.coach,
        name: j.school.coach,
        from: j.school.name,
        games: j.school.games,
        city: j.school.city,
        record: j.school.record,
        tenure: j.school.tenure,
        why: j.why,
        conf: j.school.conf,
      };
      const scoop = th.add("trilly", th.tpl(TRILLY_JUMP, vars), { big: true });
      around(th, talkers, scoop, vars, "jump", true);
    }
  }

  land.openings.forEach((open, i) => {
    const vars = jobVars(open, land);
    const scoop = th.add("trilly", th.tpl(liveLines(TRILLY_OPEN, open.school.games), vars), { big: true });
    if (i === 0 && open.candidates[0] && rng() < 0.55) th.add("trilly", th.tpl(TRILLY_DEST, vars), { big: true });
    if (i < 2) around(th, talkers, scoop, vars, "job", early);
    else if (rng() < 0.6) th.add(speaker(rng, talkers), th.tpl(rng() < 0.5 ? REPLY_BELIEVE : REPLY_BALL, vars), { replyTo: scoop });
  });

  if (land.you && land.you.id === state.playerTeamId) {
    const y = land.you;
    if (y.heat > 0.1 && y.games >= 4) {
      const scoop = th.add(
        "trilly",
        `I don't have ${y.name} as a firing. The internet is yelling because they're ${y.record} and they don't rebound, and yelling isn't a source.`,
        { big: true },
      );
      around(th, talkers, scoop, { school: y.name, games: y.games, coach: y.coach, record: y.record, name: y.coach, city: y.city }, "job", false);
    } else if (y.games >= 5 && y.winPct > y.expected + 0.08) {
      th.add("trilly", `${y.coach} at ${y.name} is going to start showing up on lists if this holds — ${y.record}, they compete, and people notice.`, { big: true });
      th.add(speaker(rng, talkers), `Leave ${y.coach} alone. ${y.name} actually plays hard.`);
    }
  }

  if (!land.openings.length && !early) {
    th.add("trilly", "No openings I believe in tonight. Lots of noise, and noise isn't a job.");
    th.add(speaker(rng, talkers), rng() < 0.5 ? "Slow night in here, I'm going back to lounge." : th.tpl(SIDE_CHAT, {}));
    const j = land.jump[0];
    if (j) {
      const vars = { school: j.school.name, name: j.school.coach, from: j.school.name, games: j.school.games, city: j.school.city, coach: j.school.coach, record: j.school.record, why: j.why };
      const scoop = th.add("trilly", th.tpl(TRILLY_JUMP, vars), { big: true });
      around(th, talkers, scoop, vars, "jump", early);
    }
  }

  if (state.phase === "ncaa" || state.phase === "conference" || state.phase === "selection") {
    th.add("trilly", "ADs wait until they're out, that's the rule, and it doesn't mean they haven't already decided.");
    th.add(speaker(rng, talkers), "Don't fire a guy during the tournament. Wait until Monday, then fire him.");
  }

  if (state.phase === "offseason") {
    th.add("trilly", "Carousel's open. If I put a coach and a school in the same sentence, read it twice.");
    th.add(speaker(rng, talkers), "offseason in here is a contact sport lmao");
  }

  const seat = land.openings[0]?.school ?? land.hot[0] ?? land.you;
  const jump = land.jump[0];
  ensureEggs(
    th,
    eggVars({
      school: seat?.name ?? "that job",
      coach: seat?.coach ?? "that staff",
      record: seat && seat.games >= 6 ? seat.record : "hasn't tipped",
      tenure: seat?.tenure ?? 4,
      games: seat?.games ?? 0,
      name: jump?.school.coach ?? "the mid-major guy",
      from: jump?.school.name ?? "a mid-major",
      city: seat?.city ?? "town",
    }),
    early,
  );

  return th.msgs;
}

function buildPortal(state: GameState, rng: Rng, talkers: string[]) {
  const th = new Thread(rng, "portal", 17 * 60 + randInt(rng, 10, 140));
  const era = eraPortal(state.eraDecade);
  const nil = eraHasNil(state.eraDecade);
  const early = tooEarly(state);
  if (era === "none") {
    th.add(
      "trilly",
      "transfers still sit a year. if you're in here talking about a guy hopping schools in april and playing in november, you're in the wrong decade.",
      { pinned: true, big: true, ago: 20 * 60 },
    );
    const bits = rumoredPortal(state, rng).slice(0, 3);
    for (const b of bits) {
      const vars = {
        player: b.name,
        from: b.from,
        dest: b.destName,
        pos: b.pos,
        mpg: b.mpg,
        school: b.from,
        name: b.name,
        coach: "the staff",
        record: `${b.mpg} mpg`,
        games: 8,
      };
      const scoop = th.add("trilly", th.tpl(TRILLY_SIT, vars), { big: true });
      if (rng() < 0.7) around(th, talkers, scoop, vars, "portal", false);
      else th.add(speaker(rng, talkers), `${b.name} sitting a year at ${b.destName} is a real ask. most guys aren't doing that`);
    }
    th.add("oldhead", "back when you picked a school you stayed. wild concept i know");
    if (rng() < 0.5) th.add(speaker(rng, talkers), th.tpl(REPLY_SHORT, {}));
    return th.msgs;
  }

  const bits = rumoredPortal(state, rng);
  const live = portalOpen(state);
  th.add(
    "trilly",
    live
      ? `${portalOf(state).window} portal is open. names below are names i believe. if i don't have it, i don't post it.`
      : "portal isn't open yet. some of these guys are going to be in it. some of you are going to be wrong about which ones.",
    { pinned: true, big: true, ago: 20 * 60 },
  );
  th.add("watch", "portal collector", { embed: portalEmbed(state), big: true, ago: 19 * 60 });

  if (!bits.length) {
    th.add("trilly", "quiet tonight. not every night is a frenzy.");
    th.add(speaker(rng, talkers), "thank god. my phone needed a night off");
    return th.msgs;
  }

  const take = bits.slice(0, 4);
  take.forEach((b, i) => {
    const vars = {
      player: b.name,
      from: b.from,
      dest: b.destName,
      pos: b.pos,
      mpg: b.mpg,
      school: b.from,
      name: b.name,
      coach: "the staff",
      record: `${b.mpg} mpg`,
      games: 8,
    };
    const scoop = th.add("trilly", th.tpl(TRILLY_PORTAL, vars), { big: true });
    if (nil && rng() < 0.35) th.add("trilly", th.tpl(TRILLY_NIL, vars));
    if (i < 2) around(th, talkers, scoop, vars, "portal", early);
    else if (rng() < 0.55) th.add(speaker(rng, talkers), th.tpl(REPLY_PORTAL, vars), { replyTo: scoop });
    if (b.fromId === state.playerTeamId) {
      th.add(speaker(rng, talkers), `that's one of ${identityName(state.identity)}'s. ${b.from} about to come in here and deny it`);
    }
  });
  return th.msgs;
}

function buildLounge(state: GameState, land: CarouselLand, rng: Rng, talkers: string[]) {
  const th = new Thread(rng, "lounge", 9 * 60 + randInt(rng, 5, 80));
  const you = land.you;
  const kp = kenpom(state);
  const ap = apPoll(state);
  const a = speaker(rng, talkers);
  const b = other(rng, talkers, a);
  const weekGames = state.schedule.filter(
    (g) => g.week === state.week && !g.resultId && (g.kind === "conference" || g.kind === "noncon" || g.kind === "mte"),
  );
  const pickGame = weekGames.length ? pick(rng, weekGames) : null;
  if (pickGame) {
    const home = TEAM_BY_ID[pickGame.homeId]?.name ?? "Home";
    const away = TEAM_BY_ID[pickGame.awayId]?.name ?? "Away";
    const openId = th.add(a, th.tpl(LOUNGE_OPEN, { home, away }));
    th.add(b, th.tpl(LOUNGE_PLAY, { home, away }), { replyTo: openId });
    if (rng() < 0.7) th.add(other(rng, talkers, b), th.tpl(LOUNGE_PLAY, { home, away }));
    if (rng() < 0.4) th.add(speaker(rng, talkers), th.tpl(REPLY_SHORT, {}));
    const hk = kp.find((r) => r.id === pickGame.homeId);
    const ak = kp.find((r) => r.id === pickGame.awayId);
    if (hk && ak && rng() < 0.8) {
      const sheet = th.add(
        "kenpom",
        sheetLine(state.eraDecade, home, hk.rank, hk.adjEM, { name: away, rank: ak.rank, em: ak.adjEM }),
      );
      if (rng() < 0.55) {
        th.add(
          speaker(rng, talkers),
          th.tpl(
            [
              "the computer doesn't play. watch the glass",
              "sheet is a liar if nobody boxes out",
              "ok but have you watched {home} guard a ball screen",
              "numbers people always show up right on time",
            ],
            { home, away },
          ),
          { replyTo: sheet },
        );
      }
    }
    if (rng() < 0.4) th.add("notbb", th.tpl(LOUNGE_PLAY, { home, away }), { replyTo: openId });
    if (rng() < 0.58) {
      th.add(
        "warcat",
        th.tpl(
          liveLines(
            [
              "Watch {home} on a ball screen. That's the game. The rest is decoration.",
              "{away} doesn't close out and this room is going to act surprised in March.",
              "I had {home} on the sheet already. The eye test caught up tonight.",
              "Serious question. Has {away} guarded the nail once in the last two weeks?",
              "That's a coaching game. {home} competed. {away} hoped. Hope doesn't travel.",
              "I'm not doing chaos. {home} boxed out, {away} didn't, next.",
              "If you're only in here for jobs, skip this one. {home} actually played.",
              "{away} has no late-clock action. Everybody in that building knew it.",
            ],
            6,
          ),
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    if (rng() < 0.5) {
      th.add(
        "bontemps",
        th.tpl(
          [
            "That's a resume game. {home} needed it. {away} let them have it.",
            "I'm not doing jobs in lounge. {home} competed. That's the note.",
            "Hearing {away} is further along than people in here want to admit. Watch the glass.",
            "Quiet night if you're only here for firings. {home} just played basketball.",
          ],
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    if (rng() < 0.5) {
      th.add(
        "lando",
        th.tpl(
          [
            "Anyway I had {home} on in the background and then I didn't, because they actually played.",
            "Brother {away} did not close out. I sat through it. I cannot sit through it twice.",
            "lando.marshall in lounge against my will. {home} boxed out. Rare. I'm going back to jobs.",
            "I wrote a longer thing about {away} and deleted it. They don't rebound. That's the essay.",
          ],
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    if (rng() < 0.48) {
      th.add(
        "reborne",
        th.tpl(
          [
            "I left this server and {home} is still the only team that boxed out. I don't know what I expected.",
            "reborne in lounge. I was gone. {away} still doesn't guard. I'm going back to bed.",
            "Came back for one night. {home} competed. {away} hoped. Same sport I quit.",
            "I muted this place. {away} pulled me back in. That's embarrassing for me.",
          ],
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    if (rng() < 0.48) {
      th.add(
        "angelyne",
        th.tpl(
          [
            "1v1 in that gym and {away} gets cooked. {home} at least stayed in front.",
            "Angelyne-1v1. That's a stay-in-front game. {home} did. {away} did not.",
            "Straight up {home} wanted it. Run it back if you want, I already know.",
            "Don't send me a set. {away} couldn't keep a dude in front of them. That's the game.",
          ],
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    if (rng() < 0.5) {
      th.add(
        "blur",
        th.tpl(
          [
            "I would explain why {away} lost but then you'd have to watch the empty side. {home} actually did.",
            "Funny thing about {away}: it looks like bad luck until you count the second chances. Then it's math.",
            "bLuRbonics in lounge: {home} closed out. {away} did karaoke. Same sport, different effort.",
            "Not a vibe take. {home} got stops. {away} did not. Annotate that.",
          ],
          { home, away },
        ),
        { replyTo: openId },
      );
    }
    {
      const catsIn = pickGame.homeId === "kentucky" || pickGame.awayId === "kentucky";
      const catsYou = you?.id === "kentucky" ? you : null;
      const sassV = catsVars({
        school: catsIn ? catsName() : home,
        home,
        away,
        name: catsYou?.coach ?? "that guy",
        coach: catsYou?.coach ?? "the staff",
        record: catsYou?.record ?? "the record",
        games: catsYou?.games ?? 0,
      });
      if (catsIn || rng() < 0.55) {
        th.add("sass", th.tpl(liveLines(sassPool(sassV), catsYou?.games ?? 0), sassV));
      }
    }
    if (rng() < 0.35) th.add(speaker(rng, talkers), th.tpl(SIDE_CHAT, {}));
  } else {
    th.add(
      speaker(rng, talkers),
      rng() < 0.5
        ? th.tpl(["no games tonight and we're still in here talking zone defense. this is a lifestyle", "dead night. still here. send help", "no ball and we're arguing a 2-3. i need a hobby"], {})
        : th.tpl(SIDE_CHAT, {}),
    );
  }

  const last = [...state.results].reverse().find((r) => r.homeId === state.playerTeamId || r.awayId === state.playerTeamId);
  if (you && you.games >= 1) {
    const youId = th.add(speaker(rng, talkers), th.tpl(LOUNGE_YOU, { coach: you.coach, school: you.name, record: you.record }));
    if (last) {
      const youHome = last.homeId === you.id;
      const pf = youHome ? last.homeScore : last.awayScore;
      const pa = youHome ? last.awayScore : last.homeScore;
      const opp = TEAM_BY_ID[youHome ? last.awayId : last.homeId]?.name ?? "them";
      const won = pf > pa;
      th.add(
        other(rng, talkers, a),
        won
          ? th.tpl(
              [
                `${you.name} took care of ${opp} ${pf}-${pa}. they actually boxed out`,
                `${you.name} ${pf}-${pa} over ${opp}. they competed. carousel people can sit a night`,
                `that's a win. ${you.name} ${pf}-${pa}. they competed. rare around here`,
              ],
              {},
            )
          : th.tpl(
              [
                `${opp} sent ${you.name} home ${pa}-${pf}. got walked in the paint`,
                `${you.name} dropped that one ${pf}-${pa} to ${opp}. wait until the bus is back before you fire anybody`,
                `ugly night. ${opp} ${pa}-${pf}. ${you.name} couldn't throw it in the ocean`,
              ],
              {},
            ),
        { replyTo: youId },
      );
    }
    const yk = kp.find((r) => r.id === you.id);
    if (yk && rng() < 0.7) {
      th.add("kenpom", sheetLine(state.eraDecade, you.name, yk.rank, yk.adjEM));
    }
  }

  const apRow = ap[randInt(rng, 0, Math.min(12, Math.max(0, ap.length - 1)))];
  if (apRow && rng() < 0.75) {
    const team = TEAM_BY_ID[apRow.id]?.name ?? "that team";
    const pollId = th.add(
      speaker(rng, talkers),
      th.tpl(liveLines(LOUNGE_POLL, apRow.wins + apRow.losses), { team, rank: apRow.rank, record: `${apRow.wins}-${apRow.losses}` }),
    );
    if (rng() < 0.7) th.add("bracket", th.tpl(["poll is not the tournament. resume is. i will die on this hill", "voters don't put you in the dance. the committee does", "logo poll. resume still stinks"], { team }), { replyTo: pollId });
    if (rng() < 0.45) th.add(speaker(rng, talkers), th.tpl(["voters don't watch the glass. they watch the tv timeout", "that poll slot is a vibes number", "unranked or {rank} i don't care. watch them play"], { team, rank: apRow.rank }));
  }

  if (eraHasNil(state.eraDecade)) {
    if (rng() < 0.45) th.add(speaker(rng, talkers), th.tpl(LOUNGE_ERA_NIL, {}));
    if (rng() < 0.35) {
      const old = th.add("oldhead", "liked it better when kids picked a school and stayed. nobody asked me");
      th.add(speaker(rng, talkers), "nobody asked you and you're still in here. respect", { replyTo: old });
    }
  } else if (rng() < 0.65) {
    th.add(speaker(rng, talkers), th.tpl(LOUNGE_ERA_OLD, {}));
    if (rng() < 0.4) th.add("oldhead", "throw it inside and let the big man work. that's basketball");
  }

  if (rng() < 0.32) th.add("hopper", th.tpl(HOPPER_LINES, catsVars({})));
  else if (rng() < 0.25) th.add("hopper", "scoops in #carousel. lounge is for the games. if I see another buyout in here i'm muting");

  ensureEggs(
    th,
    eggVars({
      school: you?.name ?? "this team",
      coach: you?.coach ?? "the coach",
      record: you && you.games >= 1 ? you.record : "hasn't tipped",
      name: you?.coach ?? "the coach",
      games: you?.games ?? 0,
      city: you?.city ?? "town",
    }),
    tooEarly(state),
  );
  return th.msgs;
}

export function burnerTease(state: GameState) {
  const land = carouselLand(state);
  const top = land.openings[0]?.school ?? land.hot[0];
  if (top) return { head: `${top.name} is in trouble`, note: `${top.coach} · ${top.record} · Trilly's posting` };
  const jump = land.jump[0];
  if (jump) return { head: `${jump.school.coach} is getting looks`, note: `${jump.school.name} · Trilly's posting` };
  if (portalOpen(state)) {
    const n = portalOf(state).transfers.filter((t) => !t.committedTo).length;
    return { head: `${n} names in the portal`, note: "Trilly's posting" };
  }
  return { head: "Trilly's in the server", note: "carousel, portal rumors, the usual" };
}

function orderReplies(msgs: BurnerMessage[]) {
  const byId = new Map(msgs.map((m) => [m.id, m]));
  for (const m of msgs) {
    if (!m.replyTo) continue;
    const parent = byId.get(m.replyTo);
    if (parent && m.minutesAgo >= parent.minutesAgo) m.minutesAgo = Math.max(1, parent.minutesAgo - 1);
  }
  return msgs;
}

export function burnerFeed(state: GameState): BurnerFeed {
  const rng = rngFor(state, "feed");
  const land = carouselLand(state);
  const talkers = talkersOf(rng);
  const era = eraPortal(state.eraDecade);
  const channels: BurnerChannelInfo[] = [
    {
      id: "carousel",
      label: "carousel",
      topic: "jobs, hot seats, who should get hired. Trilly posts. y'all react.",
    },
    {
      id: "portal",
      label: era === "none" ? "transfers" : "portal",
      topic:
        era === "none"
          ? "guys changing schools still sit a year. talk like it."
          : "visits, who's leaving, who actually has a job. if Trilly didn't post it, it didn't happen.",
    },
    {
      id: "lounge",
      label: "lounge",
      topic: "the games. keep the scoops in the other rooms.",
    },
  ];
  const messages = orderReplies([
    ...buildCarousel(state, land, rng, talkers),
    ...buildPortal(state, rng, talkers),
    ...buildLounge(state, land, rng, talkers),
  ]);
  const members = 640 + (state.seed % 280);
  const online = 38 + ((state.week * 7 + (state.seed % 40)) % 52);
  return {
    server: "The Burner",
    members,
    online,
    channels,
    users: USERS,
    messages,
    tease: burnerTease(state).head,
  };
}
