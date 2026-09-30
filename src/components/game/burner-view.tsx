import { useMemo, useState } from "react";
import { Flame, Hash, Users } from "lucide-react";
import { useGame } from "@/game/store";
import { bindTap } from "@/lib/tap";
import {
  BURNER_SLASH,
  burnerFeed,
  burnerSlash,
  formatAgo,
  type BurnerChannel,
  type BurnerEmbed,
  type BurnerMessage,
  type BurnerSlashCmd,
  type BurnerUser,
} from "@/game/burner";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function DiscordText({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z][\w-]*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} className="bn-at">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function EmbedCard({ embed, ephemeral }: { embed: BurnerEmbed; ephemeral?: boolean }) {
  return (
    <div className={`bn-embed ${ephemeral ? "is-eph" : ""}`} style={{ borderLeftColor: embed.color }}>
      <p className="bn-embed-title">{embed.title}</p>
      {embed.desc ? (
        <p className="bn-embed-desc">
          <DiscordText text={embed.desc} />
        </p>
      ) : null}
      <div className="bn-embed-fields">
        {embed.fields.map((f) => (
          <div key={f.name} className="bn-embed-field">
            <p className="bn-embed-k">{f.name}</p>
            <p className="bn-embed-v">{f.value}</p>
          </div>
        ))}
      </div>
      <p className="bn-embed-foot">{embed.footer}</p>
    </div>
  );
}

function groupMessages(list: BurnerMessage[]) {
  const ordered = [...list].sort((a, b) => {
    if (a.replyTo === b.id) return 1;
    if (b.replyTo === a.id) return -1;
    if (a.minutesAgo !== b.minutesAgo) return b.minutesAgo - a.minutesAgo;
    return a.id.localeCompare(b.id);
  });
  const groups: { userId: string; items: BurnerMessage[]; system?: boolean }[] = [];
  for (const m of ordered) {
    if (m.system) {
      groups.push({ userId: m.userId, items: [m], system: true });
      continue;
    }
    const last = groups[groups.length - 1];
    const close = last && !last.system && last.userId === m.userId && Math.abs(last.items[0]!.minutesAgo - m.minutesAgo) < 8;
    if (close) last.items.push(m);
    else groups.push({ userId: m.userId, items: [m] });
  }
  return groups;
}

function Avatar({ user, size = "md" }: { user: BurnerUser; size?: "sm" | "md" }) {
  return (
    <span className={`bn-av ${size === "sm" ? "is-sm" : ""}`} style={{ background: user.color }} aria-hidden>
      {initials(user.name)}
    </span>
  );
}

function UserTags({ user }: { user: BurnerUser }) {
  return (
    <>
      {user.bot && <span className="bn-tag is-bot">APP</span>}
      {user.role === "owner" && !user.bot && <span className="bn-tag">owner</span>}
      {user.role === "mod" && !user.bot && <span className="bn-tag is-mod">mod</span>}
    </>
  );
}

function MessageBody({
  m,
  users,
  byId,
}: {
  m: BurnerMessage;
  users: Map<string, BurnerUser>;
  byId: Map<string, BurnerMessage>;
}) {
  const parent = m.replyTo ? byId.get(m.replyTo) : null;
  const parentUser = parent ? users.get(parent.userId) : null;
  return (
    <div className="bn-body">
      {parent && parentUser && (
        <p className="bn-reply">
          <span className="bn-reply-name" style={{ color: parentUser.color }}>
            {parentUser.name}
          </span>
          <span>{parent.body}</span>
        </p>
      )}
      {m.body ? (
        <p className="bn-text">
          <DiscordText text={m.body} />
        </p>
      ) : null}
      {m.embed ? <EmbedCard embed={m.embed} /> : null}
      {m.reactions && m.reactions.length > 0 && (
        <div className="bn-reacts">
          {m.reactions.map((r) => (
            <span key={r.label} className="bn-react">
              {r.label} <b>{r.count}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BurnerView() {
  const { state, setView } = useGame();
  const [channel, setChannel] = useState<BurnerChannel>("carousel");
  const [slashId, setSlashId] = useState<BurnerSlashCmd["id"] | null>(null);
  const feed = useMemo(
    () => (state ? burnerFeed(state) : null),
    [state, state?.season, state?.week, state?.phase, state?.results.length, state?.portal?.window, state?.portal?.transfers.length],
  );
  const slash = state && slashId ? burnerSlash(state, slashId) : null;
  if (!state || !feed) return null;
  const users = new Map(feed.users.map((u) => [u.id, u]));
  const byId = new Map(feed.messages.map((m) => [m.id, m]));
  const inChannel = feed.messages.filter((m) => m.channel === channel);
  const pinned = inChannel.filter((m) => m.pinned);
  const rest = inChannel.filter((m) => !m.pinned);
  const groups = groupMessages(rest);
  const info = feed.channels.find((c) => c.id === channel)!;
  const pinnedOnline = ["trilly", "watch", "hopper", "film", "chief", "spivey", "travis"];
  const onlineUsers = [
    ...feed.users.filter((u) => pinnedOnline.includes(u.id)),
    ...feed.users.filter((u) => !pinnedOnline.includes(u.id)).slice(0, 9),
  ];

  return (
    <div className="burner">
      <header className="bn-top">
        <button type="button" className="bn-back" {...bindTap(() => setView("hub"))}>
          Gym
        </button>
        <span className="bn-mark" aria-hidden>
          <Flame className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="bn-server">{feed.server}</p>
          <p className="bn-meta">
            {feed.online} online · {feed.members} members
          </p>
        </div>
      </header>

      <div className="bn-layout">
        <aside className="bn-side" aria-label="Channels">
          <p className="bn-cat">Rumors</p>
          {feed.channels.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`bn-ch ${c.id === channel ? "is-on" : ""}`}
              {...bindTap(() => setChannel(c.id))}
            >
              <Hash className="size-3.5 shrink-0" />
              {c.label}
            </button>
          ))}
          <p className="bn-cat">Apps</p>
          <p className="bn-app-note">Burner Watch</p>
        </aside>

        <section className="bn-main">
          <div className="bn-head">
            <h1 className="bn-title">
              <Hash className="size-4" />
              {info.label}
            </h1>
            <p className="bn-topic">{info.topic}</p>
          </div>

          <div className="bn-tabs" role="tablist" aria-label="Channels">
            {feed.channels.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === channel}
                className={`bn-tab ${c.id === channel ? "is-on" : ""}`}
                {...bindTap(() => setChannel(c.id))}
              >
                #{c.label}
              </button>
            ))}
          </div>

          {pinned.map((m) => {
            const u = users.get(m.userId);
            if (!u) return null;
            return (
              <article key={m.id} className="bn-pin">
                <p className="bn-pin-k">Pinned</p>
                <div className="bn-row is-pin">
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="bn-line">
                      <span className="bn-name" style={{ color: u.color }}>
                        {u.name}
                      </span>
                      <UserTags user={u} />
                      <span className="bn-ago">{formatAgo(m.minutesAgo)}</span>
                    </p>
                    <MessageBody m={m} users={users} byId={byId} />
                  </div>
                </div>
              </article>
            );
          })}

          <div className="bn-feed">
            {groups.map((g) => {
              const u = users.get(g.userId);
              if (!u) return null;
              const first = g.items[0]!;
              if (g.system) {
                return (
                  <p key={first.id} className="bn-sys">
                    {first.body}
                  </p>
                );
              }
              return (
                <article key={first.id} className="bn-row">
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="bn-line">
                      <span className="bn-name" style={{ color: u.color }}>
                        {u.name}
                      </span>
                      <UserTags user={u} />
                      <span className="bn-ago">{formatAgo(first.minutesAgo)}</span>
                    </p>
                    {g.items.map((m) => (
                      <MessageBody key={m.id} m={m} users={users} byId={byId} />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="bn-dock-chat">
            {slash && (
              <div className="bn-eph">
                <p className="bn-eph-k">{slash.note}</p>
                <EmbedCard embed={slash.embed} ephemeral />
              </div>
            )}
            <div className="bn-slash" aria-label="Slash commands">
              {BURNER_SLASH.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`bn-slash-btn ${slashId === c.id ? "is-on" : ""}`}
                  {...bindTap(() => setSlashId(slashId === c.id ? null : c.id))}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="bn-members" aria-label="Members">
          <p className="bn-cat">
            <Users className="size-3" /> Online — {feed.online}
          </p>
          {onlineUsers.map((u) => (
            <div key={u.id} className="bn-mem">
              <Avatar user={u} size="sm" />
              <span className="bn-mem-name" style={{ color: u.color }}>
                {u.name}
              </span>
              {u.bot ? <span className="bn-tag is-bot">APP</span> : u.flair ? <span className="bn-flair">{u.flair}</span> : null}
            </div>
          ))}
          <p className="bn-foot">Inspired by the college hoops rumor mill. Parody. Not affiliated.</p>
        </aside>
      </div>
    </div>
  );
}
