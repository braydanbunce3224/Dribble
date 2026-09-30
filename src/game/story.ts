import type { Feedback, GameState, Player, StoryEvent } from "./types";
import { clamp, hashString, mulberry32, pick } from "./rng";
import { bustChemCache } from "./chemistry";
import { TEAM_BY_ID } from "./teams";

function yours(state: GameState) {
  return state.players.filter((p) => p.teamId === state.playerTeamId && !p.redshirt);
}

function nm(p: Player) {
  return `${p.first} ${p.last}`;
}

function autoPick(ev: StoryEvent) {
  return ev.choices.find((c) => c.tone === "even")?.id ?? ev.choices[0]?.id ?? "even";
}

export function rollStory(state: GameState): GameState {
  if (state.phase !== "regular") return state;
  if (state.pendingStory) return resolveStory(state, autoPick(state.pendingStory)).state;
  const rng = mulberry32(state.seed ^ (state.week * 7919) ^ (state.season * 104729) ^ 0x57);
  if (rng() > 0.22) return state;
  const rot = yours(state).slice().sort((a, b) => b.mpg - a.mpg || b.ovr - a.ovr);
  if (rot.length < 3) return state;
  const star = rot[0]!;
  const bench = rot[rot.length - 1]!;
  const voice = rot.find((p) => p.year >= 3) ?? rot[1]!;
  const frosh = rot.find((p) => p.year === 1) ?? rot[2]!;
  const nilOn = state.nilCap > 0;

  type Kind = "minutes" | "clash" | "flash" | "nil" | "voice" | "homesick" | "rumor";
  const kinds: Kind[] = ["minutes", "clash", "flash", "voice", "homesick", "rumor"];
  if (nilOn) kinds.push("nil");
  const kind = pick(rng, kinds);
  const id = `st-${state.season}-${state.week}-${kind}`;

  let ev: StoryEvent;
  if (kind === "minutes") {
    ev = {
      id,
      week: state.week,
      title: `${star.first} wants more minutes`,
      body: `${nm(star)} is at ${star.mpg} minutes a game and he told a teammate he wants more. It got around the locker room.`,
      playerIds: [star.id],
      choices: [
        { id: "feed", label: `Play ${star.first} more.`, tone: "hot" },
        { id: "even", label: "Leave the rotation alone.", tone: "even" },
        { id: "bench", label: `Sit ${star.first} for a half.`, tone: "cool" },
      ],
    };
  } else if (kind === "clash") {
    ev = {
      id,
      week: state.week,
      title: `${star.first} and ${voice.first} aren't talking`,
      body: `${nm(star)} and ${nm(voice)} got into it after film. Nobody threw a punch. They just stopped speaking, and the locker room noticed.`,
      playerIds: [star.id, voice.id],
      choices: [
        { id: "star", label: `Back ${star.first}.`, tone: "hot" },
        { id: "even", label: "Tell them to handle it.", tone: "even" },
        { id: "voice", label: `Back ${voice.first}.`, tone: "cool" },
      ],
    };
  } else if (kind === "flash") {
    ev = {
      id,
      week: state.week,
      title: `${frosh.first} is playing well`,
      body: `${nm(frosh)} had a good week. The assistants want him in the closing lineup. Those minutes belong to ${nm(star)} right now.`,
      playerIds: [frosh.id, star.id],
      choices: [
        { id: "promote", label: `Close with ${frosh.first}.`, tone: "hot" },
        { id: "even", label: "Give him a few extra minutes.", tone: "even" },
        { id: "hold", label: "Keep the veterans in late.", tone: "cool" },
      ],
    };
  } else if (kind === "nil") {
    ev = {
      id,
      week: state.week,
      title: `Booster wants ${star.first} at dinner`,
      body: `A booster wants ${nm(star)} at dinner Thursday. Compliance called. They didn't ban it. They said be careful.`,
      playerIds: [star.id],
      choices: [
        { id: "go", label: "Let him go. NIL goes up. So does heat.", tone: "hot" },
        { id: "even", label: "Staff only. Keep compliance happy.", tone: "even" },
        { id: "pass", label: "Tell the booster no.", tone: "cool" },
      ],
    };
  } else if (kind === "voice") {
    ev = {
      id,
      week: state.week,
      title: `${voice.first} wants a meeting`,
      body: `${nm(voice)} asked for a meeting. He thinks the staff has lost the locker room. He still wants to be here.`,
      playerIds: [voice.id],
      choices: [
        { id: "listen", label: "Hear him out and change a call.", tone: "hot" },
        { id: "even", label: "Hear him out. Don't change the rotation.", tone: "even" },
        { id: "shut", label: "Tell him the rotation is yours.", tone: "cool" },
      ],
    };
  } else if (kind === "homesick") {
    ev = {
      id,
      week: state.week,
      title: `${bench.first} wants to leave`,
      body: `${nm(bench)} is at ${bench.mpg} minutes a game. His mom called the AD. He wants to go home. He hasn't entered the portal yet.`,
      playerIds: [bench.id],
      choices: [
        { id: "minutes", label: `Promise him ${bench.mpg + 6} minutes.`, tone: "hot" },
        { id: "even", label: "Be honest about the rotation.", tone: "even" },
        { id: "portal", label: "Tell him he can enter the portal.", tone: "cool" },
      ],
    };
  } else {
    ev = {
      id,
      week: state.week,
      title: `Portal rumor on ${star.first}`,
      body: `A national site says ${nm(star)} is looking around. He hasn't said that to you. He's been on his phone all morning.`,
      playerIds: [star.id],
      choices: [
        { id: "podium", label: "Have him deny it publicly.", tone: "hot" },
        { id: "even", label: "Talk to him privately.", tone: "even" },
        { id: "ignore", label: "Ignore it.", tone: "cool" },
      ],
    };
  }

  return { ...state, pendingStory: ev };
}

export function resolveStory(state: GameState, choiceId: string): { state: GameState; feedback: Feedback } {
  const ev = state.pendingStory;
  if (!ev) return { state, feedback: { title: "Nothing to do", detail: "", parts: [] } };
  const choice = ev.choices.find((c) => c.id === choiceId) ?? ev.choices.find((c) => c.tone === "even") ?? ev.choices[0];
  if (!choice) return { state: { ...state, pendingStory: null }, feedback: { title: "Nothing to do", detail: "", parts: [] } };

  const ids = new Set(ev.playerIds);
  let players = state.players;
  let ad = 0;
  let fans = 0;
  let donor = 0;
  const hit = (id: string, n: number) => {
    players = players.map((p) => (p.id === id ? { ...p, morale: clamp(p.morale + n, 20, 99) } : p));
  };
  const bumpMpg = (id: string, n: number) => {
    players = players.map((p) => (p.id === id ? { ...p, mpg: clamp(p.mpg + n, 0, 38) } : p));
  };

  switch (choice.id) {
    case "feed":
      hit(ev.playerIds[0]!, 8);
      bumpMpg(ev.playerIds[0]!, 3);
      fans += 2;
      break;
    case "bench":
      hit(ev.playerIds[0]!, -10);
      bumpMpg(ev.playerIds[0]!, -4);
      ad += 2;
      break;
    case "star":
      hit(ev.playerIds[0]!, 6);
      if (ev.playerIds[1]) hit(ev.playerIds[1], -6);
      break;
    case "voice":
      if (ev.playerIds[1]) hit(ev.playerIds[1], 6);
      hit(ev.playerIds[0]!, -5);
      break;
    case "promote":
      hit(ev.playerIds[0]!, 7);
      bumpMpg(ev.playerIds[0]!, 4);
      if (ev.playerIds[1]) {
        hit(ev.playerIds[1], -4);
        bumpMpg(ev.playerIds[1], -2);
      }
      break;
    case "hold":
      hit(ev.playerIds[0]!, -4);
      if (ev.playerIds[1]) hit(ev.playerIds[1], 3);
      break;
    case "go":
      hit(ev.playerIds[0]!, 6);
      donor += 6;
      ad -= 4;
      break;
    case "pass":
      hit(ev.playerIds[0]!, -3);
      ad += 3;
      donor -= 4;
      break;
    case "listen":
      hit(ev.playerIds[0]!, 5);
      fans += 2;
      break;
    case "shut":
      hit(ev.playerIds[0]!, -6);
      ad += 2;
      break;
    case "minutes":
      hit(ev.playerIds[0]!, 6);
      bumpMpg(ev.playerIds[0]!, 5);
      break;
    case "portal":
      hit(ev.playerIds[0]!, 2);
      ad -= 2;
      break;
    case "podium":
      hit(ev.playerIds[0]!, 4);
      fans += 3;
      break;
    case "ignore":
      hit(ev.playerIds[0]!, -2);
      break;
    default:
      for (const id of ids) hit(id, 2);
      break;
  }

  bustChemCache();
  const school = TEAM_BY_ID[state.playerTeamId]?.name ?? "the office";
  return {
    state: {
      ...state,
      pendingStory: null,
      players,
      adHeat: clamp((state.adHeat ?? 55) + ad, 10, 99),
      fanMood: clamp((state.fanMood ?? 60) + fans, 10, 99),
      donorMood: clamp((state.donorMood ?? 58) + donor, 10, 99),
      news: [
        {
          id: `${ev.id}-out`,
          week: state.week,
          season: state.season,
          tone: (choice.tone === "hot" ? "good" : choice.tone === "cool" ? "bad" : "even") as "good" | "bad" | "even",
          kicker: "Locker",
          headline: ev.title,
          dek: choice.label,
          byline: "Inside the program",
          outlet: school,
          grafs: [ev.body, choice.label],
          text: choice.label,
        },
        ...state.news,
      ].slice(0, 60),
    },
    feedback: {
      title: choice.label,
      detail: ev.title,
      parts: [
        ...(ad ? [{ label: "AD", delta: ad }] : []),
        ...(fans ? [{ label: "Fans", delta: fans }] : []),
        ...(donor ? [{ label: "Donors", delta: donor }] : []),
      ],
    },
  };
}

void hashString;
