import type { GameResult, GameState, PodcastBeat } from "./types";

const JARRED = "Jarred";
const BEN = "Ben";
const KALEB = "Kaleb";
const TRILL = "Trill Raff";

type Banks = Record<string, string[]>;

const ORDERS = [
  [JARRED, BEN, KALEB, TRILL, JARRED, BEN, KALEB],
  [JARRED, KALEB, BEN, TRILL, BEN, JARRED, TRILL],
  [JARRED, TRILL, BEN, KALEB, JARRED, BEN, TRILL],
  [JARRED, BEN, TRILL, KALEB, TRILL, BEN, JARRED],
  [JARRED, KALEB, TRILL, BEN, KALEB, JARRED, BEN],
  [JARRED, BEN, KALEB, TRILL, KALEB, BEN, JARRED],
  [JARRED, TRILL, KALEB, BEN, JARRED, KALEB, TRILL],
  [JARRED, KALEB, BEN, TRILL, JARRED, TRILL, BEN],
];

function beat(speaker: string, line: string): PodcastBeat {
  return { speaker, line };
}

function shuffle<T>(rng: () => number, list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = out[i]!;
    out[i] = out[j]!;
    out[j] = t;
  }
  return out;
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

export function assemble(rng: () => number, banks: Banks): PodcastBeat[] {
  const order = pick(rng, ORDERS);
  const bags: Record<string, string[]> = {};
  for (const sp of Object.keys(banks)) bags[sp] = shuffle(rng, banks[sp]!.filter(Boolean));
  const n: Record<string, number> = {};
  const beats = order.map((sp) => {
    const i = n[sp] ?? 0;
    n[sp] = i + 1;
    const bag = bags[sp] ?? ["Yeah."];
    return beat(sp, bag[i % bag.length]!);
  });
  if (!beats.some((b) => b.line.length <= 40)) beats.push(beat(TRILL, "Yeah, I saw it."));
  if (!beats.some((b) => b.line.length >= 90)) {
    beats.splice(2, 0, beat(BEN, banks[BEN]?.find((l) => l.length >= 90) ?? "I watched the whole thing back. It was a normal basketball game, not a crisis, and we can talk about the next one without turning this into a funeral."));
  }
  return beats;
}

export function gameBanks(opts: {
  opp: string;
  score: string;
  won: boolean;
  margin: number;
  where: string;
  lead: string | null;
  pts?: number;
  fg: string;
  reb: number;
  to: number;
  ot: boolean;
  rec: string;
  coach: string;
}): Banks {
  const { opp, score, won, margin, where, lead, pts, fg, reb, to, ot, rec, coach } = opts;
  const boards = reb === 1 ? "1 rebound" : reb > 1 ? `${reb} rebounds` : "";
  const guy = lead && pts ? `${lead} had ${pts}${fg ? ` on ${fg}` : ""}${boards ? ` and ${boards}` : ""}` : "";
  const recSentence = rec ? `They're ${rec}.` : "It's early.";
  const recClause = rec ? `they're ${rec}` : "it's early";
  const jarred = won
    ? [
        `Cats beat ${opp}, ${score}, ${where}.`,
        `${opp}. Final was ${score}.`,
        `They got the win. ${score}.`,
        rec ? `Win. ${score}. ${recSentence}` : `Win. ${score}.`,
        "Alright, we can start.",
      ]
    : [
        `Cats lost to ${opp}, ${score}.`,
        `${opp} got them ${where}. ${score}.`,
        `Not the result. ${score}.`,
        "We should just say what happened.",
        rec ? `Loss. ${recSentence}` : "Loss. Next one matters more.",
      ];
  const kaleb = won
    ? margin >= 14
      ? [
          "That's closer to how they should look.",
          "I'll take a comfortable one. Not every night has to be a movie.",
          "They played like the better team. Good.",
          "Fine by me.",
        ]
      : [
          "A win is a win. I didn't love the last few minutes.",
          "They found enough. That's the job.",
          ot ? "Overtime and they still got it. I'll sleep." : "Messy, and it still counts.",
          "I'm good with it.",
        ]
    : margin <= 5
      ? [
          "They had a chance. That's the annoying part.",
          "One or two plays. I'm not going to pretend it was a blowout.",
          "That one sits with you.",
          "Yeah. Stings.",
        ]
      : [
          "No point dressing that up.",
          `${opp} was better. Move.`,
          "I don't want to relitigate every possession.",
          "Not our night.",
        ];
  const benWin = guy
    ? `${guy}. ${to ? `They still turned it over ${to} times, which is the part I'll mention if I were on the staff. ` : ""}After that, ${opp} didn't have another run. The Cats were steadier ${where}, and ${recClause}. That's a normal good night, not a coronation.`
    : `${to ? `${to} turnovers, and they still won ${score}. ` : `They won ${score} ${where}. `}${opp} hung around early and then the game got away from them. ${recSentence} I don't need it to be perfect. I need it to be a win they can build on.`;
  const benLoss = guy
    ? `${guy}. That wasn't enough, because ${opp} got the looks they wanted and the Cats didn't answer. ${to ? `${to} turnovers made it worse. ` : ""}${margin <= 5 ? "It was right there." : "It wasn't that close."} ${recSentence} ${coach} has to clean up the simple stuff before this becomes a habit.`
    : `${opp} controlled it ${where}. ${to ? `The Cats turned it over ${to} times. ` : ""}Final was ${score}. ${recSentence} No conspiracy. Just a game they didn't play well enough.`;
  const ben = [won ? benWin : benLoss, won
    ? `I liked parts of it and I didn't like parts of it. ${ot ? "They needed overtime, which tells you it wasn't clean. " : ""}${guy || `The score was ${score}`}. ${where === "on the road" ? "Road wins still count extra, even the ugly ones." : "Home should look like that more often."} ${recSentence}`
    : `You can tell when a team is searching, and they were searching. ${guy || `${opp} scored enough and got the stops.`}. ${recSentence} I'm not calling for anybody's job. The film is just going to be uncomfortable.`];
  const trill = [
    won ? "I caught most of the second half." : "I watched it. Wish I hadn't, a little.",
    margin >= 14 && won ? "I could've left during the last few minutes." : "How was the crowd?",
    ot ? "Overtime games age me." : "What did you think of the guard play?",
    "I don't have a big speech.",
    won ? "Good win." : "Rough.",
    "Yeah.",
  ];
  return { [JARRED]: jarred, [KALEB]: kaleb, [BEN]: ben, [TRILL]: trill };
}

export function campBanks(star: string | null, bench: string | null): Banks {
  return {
    [JARRED]: [
      "Camp. The Cats haven't played a game.",
      "We're on. No results yet.",
      "Just camp talk.",
      "No score to argue about.",
    ],
    [KALEB]: [
      star ? `If ${star} is the lead guy, I'm comfortable.` : "I've got the Cats until somebody takes it.",
      "It's October. I'm still picking them.",
      "Ask me again in January.",
      "I'm in.",
    ],
    [BEN]: [
      star
        ? `I went through the roster and ${star} is the one I'd give the ball to in November. ${bench ? `${bench} is the other name I kept coming back to, because if those minutes are real the rotation gets interesting. ` : ""}Everybody looks fine in October. The real test is who still wants the ball when the first look isn't there.`
        : "Camp rosters always look deep until somebody has to guard for thirty minutes. I'd rather see who takes the late shot than guess off a practice clip. We do this every fall and then November tells us who was actually ready.",
      "The useful question is minutes, not slogans. Who closes, who sits, who can guard a bigger wing. We won't know for a few weeks, and pretending we do is how people end up surprised in November.",
    ],
    [TRILL]: [
      "So we're guessing.",
      "I miss games already.",
      "Have they even scrimmaged?",
      "Ok.",
    ],
  };
}

export function byeBanks(star: string | null, rec: string): Banks {
  return {
    [JARRED]: [
      "No game this week.",
      rec ? `They're off. Record's ${rec}.` : "Bye week.",
      "Nothing tipped.",
      "Short one.",
    ],
    [KALEB]: [
      star ? `${star} doesn't need a bye-week speech from me.` : "I'm fine. They'll play again.",
      rec ? `${rec} is a real record. Enjoy the quiet.` : "Still the team I'd pick.",
      "We can wait.",
      "Next week.",
    ],
    [BEN]: [
      rec
        ? `They're ${rec}, and a week off is useful if they actually rest. I keep wanting to invent a problem because that's what these shows do, and I'm going to try not to. ${star ? `${star} just needs to stay healthy.` : "The rotation needs the rest more than it needs another take."} We'll know more when they play.`
        : "No game means I don't have a box score to nitpick, which is probably good for everyone in this room. The questions are the same ones: who closes, who defends, who they trust. We get answers when they tip again.",
      "A bye is just a bye. If they use it to clean up the stuff that showed up last time, great. If they just sit, also fine. Not every week needs a crisis.",
    ],
    [TRILL]: [
      "Then why are we taping?",
      "I almost forgot to get on.",
      "Go do something else.",
      "Fair.",
    ],
  };
}

export function marchBanks(opts: {
  champ: boolean;
  seed?: number;
  region?: string;
  playIn?: boolean;
  nit: boolean;
  opp?: string;
  score?: string;
  won?: boolean;
}): Banks {
  const { champ, seed, region, playIn, nit, opp, score, won } = opts;
  if (champ) {
    return {
      [JARRED]: ["They won it.", "That's the championship.", "I'm going to say it plain. They won.", "Ok. Wow."],
      [KALEB]: ["I had them. I don't need a trophy for saying it.", "Best night of the year.", "That's the whole point of this.", "Yeah. Yeah."],
      [BEN]: [
        "They were the better team when it counted, and that's the only sentence I trust tonight. Everybody's going to add a speech to it by morning. Right now it's just that they played well, they made the plays, and they get to keep the trophy. I'm happy. I don't have a cleaner way to put it.",
        "I keep rewinding the last few minutes because I want to see it again, not because I'm looking for a flaw. They earned it. The other team had chances. The Cats answered. That's a championship game.",
      ],
      [TRILL]: ["I called my dad. He already knew.", "I'm not going to be normal about this.", "Unreal.", "Go Cats."],
    };
  }
  if (seed && region) {
    return {
      [JARRED]: [`They're in. ${seed} seed, ${region}.`, "Selection's out. They made it.", `${seed} in the ${region}.`, "Write the seed down."],
      [KALEB]: [playIn ? "Play-in. Fine. Win it." : "I don't care about the number. They're in.", "Now they have to play.", "Seed arguments are for tomorrow.", "Good."],
      [BEN]: [
        `It's a ${seed} seed in the ${region}${playIn ? ", and they have to play in the play-in, which nobody loves" : ""}. You can be annoyed about the number. The bracket is the bracket. They have a game, they have a path, and none of that matters if they don't show up Thursday. I'm relieved they're in. That's the honest version.`,
        "People are going to spend the night arguing the seed. I'd rather look at who they might see in the second weekend, then go to sleep. They're in the tournament. That was the hurdle. The rest is basketball.",
      ],
      [TRILL]: ["I refreshed it like six times.", "We can breathe, right?", "Ok.", "Screenshot's saved. Don't ask why."],
    };
  }
  const result = opp && score ? (won ? `They beat ${opp} ${score}.` : `${opp} beat them ${score}.`) : "";
  return {
    [JARRED]: [
      nit ? "They're in the other tournament." : "This part of the calendar is miserable.",
      result || "No score in front of me yet.",
      "Say it straight.",
      "Alright.",
    ],
    [KALEB]: [
      nit ? "It's still a game. Play it." : "I don't love the week. I'm still watching.",
      won ? "They're still alive. Next." : "If it's over, it's over. Don't drag it.",
      "One game at a time.",
      "Yeah.",
    ],
    [BEN]: [
      nit
        ? `The NIT isn't the thing we wanted, and pretending otherwise is how you sound ridiculous. ${result || "They still have games."} Show up, play well, and treat it like basketball. That's all I've got that isn't just disappointment.`
        : `${result || "We're waiting on a result."} ${won ? "That's how you stay in it. Don't make it bigger than the next game." : opp ? `${opp} was better tonight. You can be mad tomorrow. Tonight the score is the score.` : "This week is just waiting, and waiting makes everybody mean."} I'll be normal about it when I can.`,
      "March makes people talk like every possession is a referendum. Sometimes it's just a game that went the other way, or a bid that wasn't there. The Cats will be judged on what they actually did. That's fair. The rest is noise.",
    ],
    [TRILL]: ["My phone's been hot all day.", "I don't know what to do with my hands.", "Rough week.", "Still here."],
  };
}

export function offseasonBanks(star: string | null, names: string[]): Banks {
  const list = names.length ? `The names I actually buy are ${names.join(", ")}.` : "Nothing loud has happened yet.";
  return {
    [JARRED]: ["Nobody's playing. Just phones.", "Offseason check-in.", "Gym's empty.", "We'll keep this short."],
    [KALEB]: [
      star ? `If ${star} stays, the winter is a lot simpler.` : "Somebody's going to enter. We'll deal with it.",
      "I can wait for real news.",
      "Rumors aren't a roster.",
      "Sure.",
    ],
    [BEN]: [
      `${list} If they need a piece, they'll try to get a piece. If they don't, leave it alone. I don't want a mock lineup in the group chat. I want to know who's actually on the team when practice starts, and we are not there yet.`,
      star
        ? `${star} is the decision that matters. Everything else is people filling the quiet. ${list} I'll care more when somebody signs.`
        : `Minutes, not graphics. ${list} The portal is a tool. It isn't a personality, and it isn't a finished team.`,
    ],
    [TRILL]: ["I miss games.", "This is just people texting.", "Is that the whole list?", "I'm out after this."],
  };
}

export function youLine(school: string, won: boolean): PodcastBeat {
  return won
    ? beat(BEN, `${school} made them work. Still came up short.`)
    : beat(KALEB, `${school} beat the Cats. That's the score. I'm not adding a speech.`);
}

export function portalLine(): PodcastBeat {
  return beat(JARRED, "Portal's open. If they need somebody, go get somebody. Not a whole episode.");
}
