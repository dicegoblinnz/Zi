// The live table (stage 8 in notes/app-plan.md): one Durable Object for each
// campaign, reached by its name ("table:<campaign>"), holding the round's
// telegraphs and how each one went, and pushing every change to the phones in
// it over a WebSocket. So the GM sees each answer the moment it's in, rather
// than 20 seconds later, and nothing one campaign does can reach another's
// table.
//
// index.js has already checked that whoever's asking is this campaign's GM or
// one of its players. This file is the rest:
//
//   GET  /api/campaigns/<id>/table   a WebSocket (Upgrade: websocket) that gets
//        the table as it is and then every change, or with no Upgrade, the
//        table once, for a phone whose socket won't connect.
//   POST /api/campaigns/<id>/table   changes from one phone: { dev, ops }. Each
//        carries a number that goes up on that phone, so one sent twice (the
//        signal dropped before the answer came back) counts once. The answer
//        is the table as that phone sees it, with the last number taken (seq)
//        and why any change didn't (no).
//
// Changes come in over plain HTTPS rather than the socket, so the server
// checks who's playing whom against D1 every time, the way the party sheet
// does. The socket only ever carries the table out, plus "ping" from the
// phone, which the object answers without waking up. An idle table costs
// nothing, and its round is kept in the object's own SQLite, so it outlasts a
// dropped connection, a redeploy and the object being put to sleep.
//
// The table screen (a TV, a laptop or a screen shared on a call) never signs
// in. It opens with the campaign's screen code, which index.js hands here
// before it looks at anyone's session:
//
//   GET  /api/screen/<code>   a WebSocket that gets the screen's view and then
//        every change, or with no Upgrade, the view once. The view's
//        screenOf() in table-rules.js, built for the screen alone, and
//        nothing comes back up from a screen. The GM makes a new code with
//        POST /api/campaigns/<id>/screen, and every screen on the old one is
//        told and let go.
import { DurableObject } from "cloudflare:workers";
import { apply, blank, current, forget, fresh, screenOf, viewOf } from "../companion/table-rules.js";
import { hit, seen } from "./auth.js";

const DEV = /^[A-Za-z0-9_-]{8,40}$/;
const MAX_OPS = 60;
const MAX_DEVICES = 64;
// Phones one person keeps open on one table. Past that, the oldest closes.
const MAX_SOCKETS = 6;
// Table screens open on one table at once. Past that, the oldest closes.
const MAX_SCREENS = 8;
// A table screen's code: 12 of these, read off the GM's phone and typed on a
// TV, so there's nothing that looks like something else (no 0 or O, no 1, I
// or L). That's about 59 bits, and wrong codes count against where they
// came from.
const SCREEN_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SCREEN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;
export function screenCode() {
  let code = "";
  while (code.length < 12) {
    // 248 is eight lots of 31, so every letter's as likely as the next.
    for (const b of crypto.getRandomValues(new Uint8Array(16))) if (b < 248 && code.length < 12) code += SCREEN_ABC[b % 31];
  }
  return code;
}

// A phone that's not in the campaign any more is told so, then let go. A
// table screen's told why (reset or ended), so it can say so.
function out(ws, why, key = "") {
  try {
    ws.send(JSON.stringify(key ? { t: "out", why: key } : { t: "out" }));
    ws.close(4404, why);
  } catch {}
}

export class Table extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.doc = null;
    this.meta = null;
    // What the table screens were last sent: { n, h }, kept as 'screen'.
    this.shown = null;
    // The phones' heartbeat, answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  load() {
    if (this.doc) return this.doc;
    const sql = this.ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
    const row = sql.exec("SELECT v FROM kv WHERE k = 'doc'").toArray()[0];
    let doc = null;
    try {
      doc = row ? JSON.parse(row.v) : null;
    } catch {}
    this.doc = doc && Array.isArray(doc.rounds) ? doc : { ...blank(), seq: {} };
    if (!this.doc.seq || typeof this.doc.seq !== "object") this.doc.seq = {};
    // A table from before the scene, the round's actions and the faction turn.
    fresh(this.doc);
    this.doc.turn ??= null;
    this.doc.last ??= null;
    const meta = sql.exec("SELECT v FROM kv WHERE k = 'meta'").toArray()[0];
    try {
      this.meta = meta ? JSON.parse(meta.v) : null;
    } catch {
      this.meta = null;
    }
    return this.doc;
  }

  save() {
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('doc', ?)", JSON.stringify(this.doc));
  }

  // The campaign's name and its crew, for the table screen, from the Worker
  // whenever it's got them (a change from a phone, or a screen opening), and
  // kept with the table so a screen still has them after the object's slept.
  // True when they've changed.
  keepMeta(meta) {
    if (!meta || typeof meta !== "object") return false;
    const next = JSON.stringify(meta);
    if (next === JSON.stringify(this.meta ?? null)) return false;
    this.meta = meta;
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('meta', ?)", next);
    return true;
  }

  // The screen's view as it'll go out, with a number of its own that only
  // moves on when something a screen shows has changed, so nothing the crew
  // can't see (the faction turn, say) turns up on a screen as a change.
  // moved: it's changed since the screens last had it. null when it couldn't
  // be built, which is logged and never holds up the phones.
  screenNow() {
    let view;
    let body;
    try {
      view = screenOf(this.doc, this.meta);
      body = JSON.stringify(view);
    } catch (err) {
      console.error(`table screen: ${err?.message ?? err}`);
      return null;
    }
    const sql = this.ctx.storage.sql;
    if (!this.shown) {
      try {
        this.shown = JSON.parse(sql.exec("SELECT v FROM kv WHERE k = 'screen'").toArray()[0]?.v ?? "null");
      } catch {}
      if (!this.shown || typeof this.shown !== "object") this.shown = { n: 0, h: "" };
    }
    const h = hashOf(body);
    const moved = h !== this.shown.h;
    if (moved) {
      this.shown = { n: (Number(this.shown.n) || 0) + 1, h };
      sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('screen', ?)", JSON.stringify(this.shown));
    }
    return { moved, view: { v: this.shown.n, ...view } };
  }

  // Every table screen open on this table gets the screen's view, when
  // there's something new on it.
  toScreens() {
    const screens = this.ctx.getWebSockets("screen");
    if (!screens.length) return;
    const now = this.screenNow();
    if (now?.moved) send(screens, JSON.stringify({ t: "view", ...now.view }));
  }

  // Everyone with a phone open on this table right now.
  here() {
    return new Set(this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment()?.user).filter(Boolean));
  }

  // A telegraph's on its player's phone once that phone has the round.
  markSeen(users, now) {
    const r = current(this.doc);
    if (!r || r.over) return false;
    let changed = false;
    for (const t of r.tele) {
      if (!t.seen && users.has(t.at.user)) {
        t.seen = now;
        changed = true;
      }
    }
    return changed;
  }

  // Every phone gets the table as its owner sees it: the GM the whole fight,
  // a player the round that's on and the one before. A table screen gets the
  // screen's view.
  broadcast() {
    const gm = JSON.stringify({ t: "view", ...viewOf(this.doc, "gm") });
    const player = JSON.stringify({ t: "view", ...viewOf(this.doc, "player") });
    for (const ws of this.ctx.getWebSockets()) {
      const role = ws.deserializeAttachment()?.role;
      if (role === "screen") continue;
      try {
        ws.send(role === "gm" ? gm : player);
      } catch {}
    }
    this.toScreens();
  }

  // A table screen's socket, handed over by the Worker with the code it
  // opened with and the campaign's name and crew. The code's checked again
  // before it's let in, against D1 and against the last code this table was
  // told about, so one reset a moment ago (after the Worker checked, or
  // while D1 was answering) gets nothing, and a D1 that can't answer lets
  // nobody in. A screen reset from here on is let go by screenOff().
  async screen(who) {
    if (who.camp && this.env.DB) {
      const still = await this.env.DB.prepare("SELECT 1 AS ok FROM campaign WHERE id = ?1 AND screen = ?2").bind(who.camp, who.code).first().catch(() => null);
      if (!still) return new Response(null, { status: 404 });
    }
    this.load();
    const latest = this.ctx.storage.sql.exec("SELECT v FROM kv WHERE k = 'code'").toArray()[0]?.v;
    if (latest && latest !== who.code) return new Response(null, { status: 404 });
    const theirs = this.ctx.getWebSockets("screen");
    for (const ws of theirs.slice(0, Math.max(0, theirs.length - (MAX_SCREENS - 1)))) {
      try {
        ws.close(4000, "Opened somewhere else");
      } catch {}
    }
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, ["screen"]);
    server.serializeAttachment({ role: "screen", code: who.code });
    // The crew's fresh from D1, so any other screens get a new face too.
    this.keepMeta(who.meta);
    const now = this.screenNow();
    if (now) send(now.moved ? this.ctx.getWebSockets("screen") : [server], JSON.stringify({ t: "view", ...now.view }));
    return new Response(null, { status: 101, webSocket: client });
  }

  // A phone's socket, handed over by the Worker with who it is, or a table
  // screen's (its names can be any letters, so that header's URI-encoded).
  async fetch(request) {
    if (request.headers.get("upgrade") !== "websocket") return new Response(null, { status: 426 });
    let who = null;
    try {
      const screen = request.headers.get("x-zi-screen");
      who = screen ? { ...JSON.parse(decodeURIComponent(screen)), role: "screen" } : JSON.parse(request.headers.get("x-zi-who") || "null");
    } catch {}
    if (who?.role === "screen") return SCREEN.test(String(who.code ?? "")) ? this.screen(who) : new Response(null, { status: 400 });
    if (!who?.user || !["gm", "player"].includes(who.role)) return new Response(null, { status: 400 });
    const theirs = this.ctx.getWebSockets(`u:${who.user}`);
    for (const ws of theirs.slice(0, Math.max(0, theirs.length - (MAX_SOCKETS - 1)))) {
      try {
        ws.close(4000, "Opened somewhere else");
      } catch {}
    }
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [`u:${who.user}`]);
    server.serializeAttachment({ user: who.user, role: who.role });
    // Checked again now it's open: someone taken out a moment ago, after the
    // Worker checked but before this, is let go. Anyone taken out from here
    // on is let go by left().
    if (who.camp && this.env.DB) {
      const still = await this.env.DB.prepare(`SELECT 1 AS ok FROM campaign c WHERE c.id = ?1 AND (c.gmId = ?2 OR EXISTS (SELECT 1 FROM member m WHERE m.campaignId = c.id AND m.userId = ?2))`).bind(who.camp, who.user).first().catch(() => ({ ok: 1 }));
      if (!still) {
        out(server, "Not in the campaign");
        return new Response(null, { status: 101, webSocket: client });
      }
    }
    this.load();
    if (who.role === "player" && this.markSeen(new Set([who.user]), Date.now())) {
      this.doc.v += 1;
      this.save();
      this.broadcast();
    } else {
      server.send(JSON.stringify({ t: "view", ...viewOf(this.doc, who.role) }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  // A phone that says anything but ping gets the table again, and so does a
  // table screen.
  async webSocketMessage(ws, message) {
    if (message === "ping") return ws.send("pong");
    const a = ws.deserializeAttachment();
    const doc = this.load();
    if (a?.role !== "screen") return ws.send(JSON.stringify({ t: "view", ...viewOf(doc, a?.role === "gm" ? "gm" : "player") }));
    const now = this.screenNow();
    if (now) send(now.moved ? this.ctx.getWebSockets("screen") : [ws], JSON.stringify({ t: "view", ...now.view }));
  }

  async webSocketClose() {}
  async webSocketError() {}

  // The table once, for a phone whose socket won't connect.
  async view(who) {
    this.load();
    if (who.role === "player" && this.markSeen(new Set([who.user]), Date.now())) {
      this.doc.v += 1;
      this.save();
      this.broadcast();
    }
    return viewOf(this.doc, who.role);
  }

  // The screen's view once, for a table screen whose socket won't connect.
  async screenView(meta) {
    this.load();
    this.keepMeta(meta);
    const now = this.screenNow();
    if (!now) throw new Error("the table screen's view couldn't be built");
    if (now.moved) send(this.ctx.getWebSockets("screen"), JSON.stringify({ t: "view", ...now.view }));
    return now.view;
  }

  // Changes from one phone, applied in order, each once. meta's the
  // campaign's name and crew, for the table screen.
  async change(who, roster, dev, ops, phoneNow = null, meta = null) {
    const doc = this.load();
    const crewChanged = this.keepMeta(meta);
    const now = Date.now();
    const was = JSON.stringify([doc.fight, doc.rounds, doc.scene, doc.turn ?? null, doc.last ?? null]);
    // Each phone's last change, under a key no phone can turn into anything else.
    const key = `d:${dev}`;
    const high = Number(doc.seq[key]?.n) || 0;
    let top = high;
    const no = [];
    try {
      for (const op of ops) {
        if (op.n <= high) continue;
        top = Math.max(top, op.n);
        const res = apply(doc, op, who, roster, now, { phoneNow });
        if (!res.ok) no.push({ n: op.n, o: String(op.o ?? ""), why: res.why });
      }
    } catch (err) {
      // Half a batch is never kept: the table goes back to what's stored.
      this.doc = null;
      throw err;
    }
    if (top > high) {
      doc.seq[key] = { n: top, at: now };
      const devices = Object.entries(doc.seq);
      if (devices.length > MAX_DEVICES) for (const [d] of devices.sort((x, y) => (x[1]?.at ?? 0) - (y[1]?.at ?? 0)).slice(0, devices.length - MAX_DEVICES)) delete doc.seq[d];
    }
    // Whoever's got the table open has whatever's just been sent at them.
    const people = this.here();
    if (who.role === "player") people.add(who.user);
    this.markSeen(people, now);
    const changed = JSON.stringify([doc.fight, doc.rounds, doc.scene, doc.turn ?? null, doc.last ?? null]) !== was;
    if (changed) doc.v += 1;
    if (changed || top > high) this.save();
    if (changed) this.broadcast();
    else if (crewChanged) this.toScreens();
    return { seq: top, no, ...viewOf(doc, who.role) };
  }

  // Someone's left the campaign, or been taken out: their phones stop hearing
  // it, and they're off the table screen's crew. When their account's gone
  // (erase), so are the telegraphs aimed at them and their name on anyone
  // else's.
  async left(user, { erase = false } = {}) {
    for (const ws of this.ctx.getWebSockets(`u:${user}`)) out(ws, "Not in the campaign");
    this.load();
    const crew = Array.isArray(this.meta?.crew) ? this.meta.crew : [];
    const gone = crew.some((c) => String(c.key).startsWith(`${user}|`)) && this.keepMeta({ ...this.meta, crew: crew.filter((c) => !String(c.key).startsWith(`${user}|`)) });
    if (erase && forget(this.doc, user)) {
      this.doc.v += 1;
      this.save();
      this.broadcast();
    } else if (gone) this.toScreens();
  }

  // The screen's got a new code (made, or reset): the table keeps it, so a
  // screen on any other one can't get in, and every screen on another code
  // is told and let go.
  async screenOff(keep) {
    this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('code', ?)", String(keep));
    for (const ws of this.ctx.getWebSockets("screen")) if (ws.deserializeAttachment()?.code !== keep) out(ws, "The screen's link was reset", "reset");
  }

  // The campaign's ended: everyone's phone stops hearing it, and it's gone.
  async end() {
    for (const ws of this.ctx.getWebSockets()) out(ws, "The campaign ended", ws.deserializeAttachment()?.role === "screen" ? "ended" : "");
    this.doc = null;
    this.meta = null;
    this.shown = null;
    await this.ctx.storage.deleteAll();
  }
}

// One message to several sockets, any of which might've just gone.
function send(sockets, text) {
  for (const ws of sockets) {
    try {
      ws.send(text);
    } catch {}
  }
}
// FNV-1a, to tell whether the screen's view has changed.
function hashOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// ---------------------------------------------------------------- the Worker's side

const tableOf = (env, id) => env.TABLE.getByName(`table:${id}`);

// Everyone in the campaign who's playing someone, in the order they joined:
// who they are and who they play, and for the table screen's crests, who
// their character started as from the book (or "own"), the archetypes on
// their own build's Titles and the ones they've grown in downtime.
async function rosterOf(env, id) {
  const { results } = await env.DB.prepare(`SELECT m.userId AS user, u.name, m.characterId AS ch, json_extract(ch.data, '$.name') AS cname,
      json_extract(ch.data, '$.crew') AS crew,
      (SELECT json_group_array(json_extract(t.value, '$.arch')) FROM json_each(ch.data, '$.build.titles') t WHERE t.type = 'object') AS built,
      (SELECT json_group_array(json_extract(g.value, '$.arch')) FROM json_each(ch.data, '$.state.grown') g WHERE CASE WHEN g.type = 'object' THEN json_extract(g.value, '$.k') = 'title' ELSE 0 END) AS grown
    FROM member m JOIN "user" u ON u.id = m.userId
    LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL
    WHERE m.campaignId = ?1 ORDER BY m.joinedAt, m.userId`).bind(id).all();
  return results.filter((m) => m.ch && m.cname != null).map((m) => ({ user: String(m.user), name: String(m.name ?? ""), ch: String(m.ch), cname: String(m.cname), crew: String(m.crew ?? ""), built: archsOf(m.built), grown: archsOf(m.grown) }));
}
// An archetype's name, the way the crest reads it.
const ARCH = /^[A-Za-z][A-Za-z' -]{0,23}$/;
function archsOf(json) {
  try {
    const list = JSON.parse(json || "[]");
    return Array.isArray(list) ? list.filter((a) => typeof a === "string" && ARCH.test(a)).slice(0, 8) : [];
  } catch {
    return [];
  }
}
// What the table screen knows about the campaign: its name, and its crew by
// their characters' names, never their accounts' (table-rules.js, screenOf()).
const metaOf = (camp, roster) => ({
  name: String(camp.name ?? ""),
  crew: roster.map((m) => ({ key: `${m.user}|${m.ch}`, name: m.cname.slice(0, 60), crew: /^[a-z]{1,24}$/.test(m.crew) ? m.crew : "", arch: m.built, grown: m.grown })),
});

export async function tableRoute(request, env, method, camp, user, { json, fail, body, origins, limited }) {
  if (!env.TABLE) return fail(503, "Live play isn’t switched on here yet.");
  const gm = camp.role === "gm";
  if (method === "GET" && (request.headers.get("upgrade") || "").toLowerCase() === "websocket") {
    // Only the site's own pages open a socket with someone's sign-in.
    if (!origins.includes(request.headers.get("origin"))) return fail(403, "That came from somewhere else.");
    if (await limited(env, `sock:${user.id}`, 240, 600)) return fail(429, "That’s a lot of reconnecting. Give it a minute.");
    const who = JSON.stringify({ user: user.id, role: gm ? "gm" : "player", camp: camp.id });
    return tableOf(env, camp.id).fetch(new Request("https://table/socket", { headers: { upgrade: "websocket", "x-zi-who": who } }));
  }
  if (method === "GET") return json(await tableOf(env, camp.id).view({ user: user.id, role: gm ? "gm" : "player" }));
  if (method === "POST") {
    const b = await body(request);
    const dev = String(b?.dev ?? "");
    if (!b || !DEV.test(dev) || !Array.isArray(b.ops)) return fail(400, "That didn’t look like a change to the round.");
    if (b.ops.length > MAX_OPS) return fail(413, "That’s a lot of changes at once. Send them a few at a time.");
    const ops = b.ops.filter((x) => x && typeof x === "object" && Number.isInteger(x.n) && x.n > 0).sort((x, y) => x.n - y.n);
    // Who's playing whom, from D1 every time: the round's targets, and the
    // character a player's answering as.
    const roster = await rosterOf(env, camp.id);
    const me = gm ? null : roster.find((m) => m.user === user.id) ?? null;
    const who = { user: user.id, role: gm ? "gm" : "player", ch: me?.ch ?? null, cname: me?.cname ?? "" };
    const phoneNow = Number.isFinite(Number(b.now)) ? Number(b.now) : null;
    return json(await tableOf(env, camp.id).change(who, roster, dev, ops, phoneNow, metaOf(camp, roster)));
  }
  return fail(404, "There’s nothing here.");
}

// A table screen, opened with its code and no sign-in. Codes that don't work
// count against the address they came from, the way join links do, so
// nobody can guess at them.
const BAD_SCREEN = "That code didn’t work. Your GM might’ve reset it, so ask them for the new one.";
export async function screenRoute(request, env, code, { json, fail, origins, limited }) {
  if (!env.TABLE) return fail(503, "Live play isn’t switched on here yet.");
  const misses = `screen-miss:${request.headers.get("cf-connecting-ip") || "here"}`;
  if ((await seen(env, misses, 900)) >= 20) return fail(429, "That’s a lot of tries. Wait a few minutes and try again.");
  const want = String(code ?? "").toUpperCase();
  const camp = SCREEN.test(want) && (await env.DB.prepare("SELECT id, name FROM campaign WHERE screen = ?1").bind(want).first());
  if (!camp) {
    await hit(env, misses, 900);
    return fail(404, BAD_SCREEN);
  }
  const socket = (request.headers.get("upgrade") || "").toLowerCase() === "websocket";
  // Only the site's own pages open a screen's socket.
  if (socket && !origins.includes(request.headers.get("origin"))) return fail(403, "That came from somewhere else.");
  if (socket ? await limited(env, `sock:screen:${camp.id}`, 120, 600) : await limited(env, `screen:${camp.id}`, 400, 600)) return fail(429, socket ? "That’s a lot of reconnecting. Give it a minute." : "That’s a lot of looking. Give it a minute.");
  // The crew fresh from D1, or, if it can't say, whatever the table kept.
  const meta = await rosterOf(env, camp.id).then((roster) => metaOf(camp, roster), (err) => {
    console.error(`table screen crew: ${err?.message ?? err}`);
    return null;
  });
  if (!socket) return json(await tableOf(env, camp.id).screenView(meta));
  const who = encodeURIComponent(JSON.stringify({ code: want, camp: camp.id, meta }));
  return tableOf(env, camp.id).fetch(new Request("https://table/socket", { headers: { upgrade: "websocket", "x-zi-screen": who } }));
}

// The screen's code was reset, so every screen on the old one goes.
export async function tableScreenOff(env, campaignId, keep) {
  if (!env.TABLE) return;
  await tableOf(env, campaignId).screenOff(keep).catch((err) => console.error(`table screen off: ${err?.message ?? err}`));
}

// Someone's out of a campaign, so their phones stop hearing its table. When
// their account's gone too (erase), the table forgets them.
export async function tableLeft(env, campaignId, userId, { erase = false } = {}) {
  if (!env.TABLE) return;
  await tableOf(env, campaignId).left(userId, { erase }).catch((err) => console.error(`table left: ${err?.message ?? err}`));
}

// A campaign's ended, so its table goes too.
export async function tableEnd(env, campaignId) {
  if (!env.TABLE) return;
  await tableOf(env, campaignId).end().catch((err) => console.error(`table end: ${err?.message ?? err}`));
}
