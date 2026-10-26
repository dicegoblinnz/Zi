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
import { DurableObject } from "cloudflare:workers";
import { apply, blank, current, viewOf } from "../companion/table-rules.js";

const DEV = /^[A-Za-z0-9_-]{8,40}$/;
const MAX_OPS = 60;
const MAX_DEVICES = 64;
// Phones one person keeps open on one table. Past that, the oldest closes.
const MAX_SOCKETS = 6;

// A phone that's not in the campaign any more is told so, then let go.
function out(ws, why) {
  try {
    ws.send(JSON.stringify({ t: "out" }));
    ws.close(4404, why);
  } catch {}
}

export class Table extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.doc = null;
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
    return this.doc;
  }

  save() {
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('doc', ?)", JSON.stringify(this.doc));
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
  // a player the round that's on and the one before.
  broadcast() {
    const gm = JSON.stringify({ t: "view", ...viewOf(this.doc, "gm") });
    const player = JSON.stringify({ t: "view", ...viewOf(this.doc, "player") });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(ws.deserializeAttachment()?.role === "gm" ? gm : player);
      } catch {}
    }
  }

  // A phone's socket, handed over by the Worker with who it is.
  async fetch(request) {
    if (request.headers.get("upgrade") !== "websocket") return new Response(null, { status: 426 });
    let who = null;
    try {
      who = JSON.parse(request.headers.get("x-zi-who") || "null");
    } catch {}
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

  // A phone that says anything but ping gets the table again.
  async webSocketMessage(ws, message) {
    if (message === "ping") return ws.send("pong");
    const a = ws.deserializeAttachment();
    ws.send(JSON.stringify({ t: "view", ...viewOf(this.load(), a?.role === "gm" ? "gm" : "player") }));
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

  // Changes from one phone, applied in order, each once.
  async change(who, roster, dev, ops) {
    const doc = this.load();
    const now = Date.now();
    const was = JSON.stringify([doc.fight, doc.rounds]);
    const high = Number(doc.seq[dev]?.n) || 0;
    let top = high;
    const no = [];
    for (const op of ops) {
      if (op.n <= high) continue;
      top = Math.max(top, op.n);
      const res = apply(doc, op, who, roster, now);
      if (!res.ok) no.push({ n: op.n, o: String(op.o ?? ""), why: res.why });
    }
    if (top > high) {
      doc.seq[dev] = { n: top, at: now };
      const devices = Object.entries(doc.seq);
      if (devices.length > MAX_DEVICES) for (const [d] of devices.sort((x, y) => (x[1]?.at ?? 0) - (y[1]?.at ?? 0)).slice(0, devices.length - MAX_DEVICES)) delete doc.seq[d];
    }
    // Whoever's got the table open has whatever's just been sent at them.
    const people = this.here();
    if (who.role === "player") people.add(who.user);
    this.markSeen(people, now);
    const changed = JSON.stringify([doc.fight, doc.rounds]) !== was;
    if (changed) doc.v += 1;
    if (changed || top > high) this.save();
    if (changed) this.broadcast();
    return { seq: top, no, ...viewOf(doc, who.role) };
  }

  // Someone's left the campaign, or been taken out: their phones stop hearing it.
  async left(user) {
    for (const ws of this.ctx.getWebSockets(`u:${user}`)) out(ws, "Not in the campaign");
  }

  // The campaign's ended: everyone's phone stops hearing it, and it's gone.
  async end() {
    for (const ws of this.ctx.getWebSockets()) out(ws, "The campaign ended");
    this.doc = null;
    await this.ctx.storage.deleteAll();
  }
}

// ---------------------------------------------------------------- the Worker's side

const tableOf = (env, id) => env.TABLE.getByName(`table:${id}`);

// Everyone in the campaign who's playing someone: who they are and who they play.
async function rosterOf(env, id) {
  const { results } = await env.DB.prepare(`SELECT m.userId AS user, u.name, m.characterId AS ch, json_extract(ch.data, '$.name') AS cname
    FROM member m JOIN "user" u ON u.id = m.userId
    LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL
    WHERE m.campaignId = ?1`).bind(id).all();
  return results.filter((m) => m.ch && m.cname != null).map((m) => ({ user: String(m.user), name: String(m.name ?? ""), ch: String(m.ch), cname: String(m.cname) }));
}

export async function tableRoute(request, env, method, camp, user, { json, fail, body, origins, limited }) {
  if (!env.TABLE) return fail(503, "Live play isn’t switched on here yet.");
  const gm = camp.role === "gm";
  if (method === "GET" && (request.headers.get("upgrade") || "").toLowerCase() === "websocket") {
    // Only the site's own pages open a socket with someone's sign-in.
    if (!origins.includes(request.headers.get("origin"))) return fail(403, "That came from somewhere else.");
    if (await limited(env, `sock:${user.id}`, 240, 600)) return fail(429, "That’s a lot of reconnecting. Give it a minute.");
    const who = JSON.stringify({ user: user.id, role: gm ? "gm" : "player" });
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
    return json(await tableOf(env, camp.id).change(who, roster, dev, ops));
  }
  return fail(404, "There’s nothing here.");
}

// Someone's out of a campaign, so their phones stop hearing its table.
export async function tableLeft(env, campaignId, userId) {
  if (!env.TABLE) return;
  await tableOf(env, campaignId).left(userId).catch((err) => console.error(`table left: ${err?.message ?? err}`));
}

// A campaign's ended, so its table goes too.
export async function tableEnd(env, campaignId) {
  if (!env.TABLE) return;
  await tableOf(env, campaignId).end().catch((err) => console.error(`table end: ${err?.message ?? err}`));
}
