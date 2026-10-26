// The party sheet and the threads between the crew, for one campaign (the rest
// of stage 7 in notes/app-plan.md). index.js has already checked that whoever's
// asking is this campaign's GM or one of its players, and nothing here reads or
// changes anything but this campaign's sheet, players and threads.
//
//   GET  /api/campaigns/<id>/party?v=   the sheet, everyone's Aspiration, and the
//        threads the asker's character has with the rest of the crew, with
//        where each one's got to (the GM gets where every thread's got to).
//        With ?v= and nothing changed since, only { same: true }.
//   POST /api/campaigns/<id>/party      changes from one phone: { dev, ops, face }.
//        Each change carries a number that goes up on that phone, so a change
//        sent twice (the signal dropped before the answer came back) counts once.
//
// A player's phone also sends what it shares with the crew (its face): their
// character's Aspiration, and the threads on their sheet with each of the
// others. A thread only ever goes to the one player it's with.
import { apply, blank, line, readable } from "../companion/party-sheet.js";
import { STATES, bondId, endsOf, moved } from "../companion/threads.js";

const DEV = /^[A-Za-z0-9_-]{8,40}$/;
const MAX_CHANGES = 200;
const MAX_FACE = 24000;
const MAX_DOC = 150000;
const MAX_BONDS = 600;
const MAX_DEVICES = 64;

// FNV-1a, to say whether anything's changed since the phone last looked.
function stampOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
const parse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// The campaign's players, each with the character they play here as one end of
// a thread ("<user>:<character>"), and what their phone last shared.
async function membersOf(env, id) {
  const { results } = await env.DB.prepare(`SELECT m.userId AS id, u.name, m.characterId, m.face, json_extract(ch.data, '$.name') AS cname
    FROM member m JOIN "user" u ON u.id = m.userId
    LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL
    WHERE m.campaignId = ?1 ORDER BY m.joinedAt, m.userId`).bind(id).all();
  return results.map((m) => ({ ...m, end: m.characterId && m.cname != null ? `${m.id}:${m.characterId}` : null }));
}

// What a phone shared, but only while it's still for the character they play here.
function faceOf(m) {
  const f = m.end && m.face ? parse(m.face) : null;
  return f && f.ch === m.characterId ? f : { asp: null, threads: [] };
}

async function partyRow(env, id) {
  return env.DB.prepare("SELECT data, version FROM party WHERE campaignId = ?1").bind(id).first();
}

// The sheet as this one person gets it.
function viewOf(camp, user, members, row, extra = {}) {
  const gm = camp.role === "gm";
  const raw = row ? parse(row.data) : null;
  const doc = raw ? readable(raw) : null;
  const ends = new Set(members.map((m) => m.end).filter(Boolean));
  const mine = members.find((m) => m.id === user.id)?.end ?? null;
  const bonds = doc ? Object.entries(doc.bonds).filter(([, b]) => ends.has(b.a) && ends.has(b.b) && (gm || b.a === mine || b.b === mine)).map(([id, b]) => ({ id, ...b })) : [];
  if (doc) delete doc.bonds;
  const crew = members.map((m) => {
    const face = faceOf(m);
    return {
      id: m.id,
      name: m.name,
      character: m.end ? { id: m.characterId, name: String(m.cname) } : null,
      asp: m.end ? face.asp ?? null : null,
      threads: m.end && mine && m.id !== user.id ? (face.threads || []).filter((t) => t.with === mine).map(({ with: _, ...t }) => t) : [],
    };
  });
  return { party: doc, pv: row?.version ?? 0, gm: { id: camp.gmId, name: camp.gm }, crew, bonds, ...extra };
}

const stamp = (camp, user, members, row) => stampOf(JSON.stringify([row?.version ?? 0, user.id, camp.role, members.map((m) => [m.id, m.name, m.characterId, m.cname, m.face ?? ""])]));

export async function showParty(env, url, camp, user, { json }) {
  const [members, row] = await Promise.all([membersOf(env, camp.id), partyRow(env, camp.id)]);
  const v = stamp(camp, user, members, row);
  if (url.searchParams.get("v") === v) return json({ same: true, v });
  return json({ v, ...viewOf(camp, user, members, row) });
}

// What a player's phone shares with the crew, kept only for the character
// they play here and only with threads to the others in it.
function faceFrom(raw, me, members) {
  if (!raw || typeof raw !== "object") return null;
  const others = new Set(members.filter((m) => m.end && m.id !== me.id).map((m) => m.end));
  const a = raw.asp && typeof raw.asp === "object" ? raw.asp : null;
  const die = Number(a?.die);
  const asp = a ? { text: line(a.text, 160), die: Number.isInteger(die) && die >= 2 && die <= 12 && die % 2 === 0 ? die : 2 } : null;
  const threads = (Array.isArray(raw.threads) ? raw.threads : []).slice(0, 80)
    .filter((t) => t && typeof t === "object" && others.has(String(t.with)))
    .map((t) => ({ with: String(t.with), text: line(t.text, 240), kind: t.kind === "hostile" ? "hostile" : "bond", whose: line(t.whose, 60) || null, strained: t.strained === true }))
    .filter((t) => t.text);
  const text = JSON.stringify({ ch: me.characterId, asp, threads });
  return text.length <= MAX_FACE ? text : null;
}

// One thread moved from a player's phone: theirs, with someone else who's
// playing here, from where their phone last saw it to where it is now.
function moveThread(doc, op, me, members, user, now) {
  if (!me?.end) return false;
  const other = members.find((m) => m.end && m.end === op.with && m.id !== user.id);
  const w = line(op.w, 240);
  if (!other || !w || !STATES.includes(op.to) || (op.from != null && !STATES.includes(op.from))) return false;
  const [a, b] = endsOf(me.end, other.end);
  const id = bondId(a, b, w);
  const was = doc.bonds[id];
  const s = was ? moved(was.s, op.from ?? null, op.to) : op.to;
  if (was && was.s === s) return false;
  doc.bonds[id] = { a, b, w: was?.w || w, s, v: (was?.v ?? 0) + 1, by: user.id, at: now };
  return true;
}

export async function changeParty(request, env, camp, user, { json, fail, body }) {
  const b = await body(request);
  const dev = String(b?.dev ?? "");
  if (!b || !DEV.test(dev) || (b.ops != null && !Array.isArray(b.ops))) return fail(400, "That didn’t look like a change to the party sheet.");
  if ((b.ops?.length ?? 0) > MAX_CHANGES) return fail(413, "That’s a lot of changes at once. Send them a few at a time.");
  const members = await membersOf(env, camp.id);
  const me = members.find((m) => m.id === user.id) ?? null;

  // What this player's phone shares, for the character they play here.
  if (b.face !== undefined && me?.end) {
    const face = faceFrom(b.face, me, members);
    if (face && face !== me.face) {
      await env.DB.prepare("UPDATE member SET face = ?3 WHERE campaignId = ?1 AND userId = ?2 AND characterId = ?4").bind(camp.id, user.id, face, me.characterId).run();
      me.face = face;
    }
  }

  const ops = (b.ops ?? []).filter((x) => x && typeof x === "object" && Number.isInteger(x.n) && x.n > 0).sort((x, y) => x.n - y.n);
  let row = null;
  let top = 0;
  for (let tries = 0; ; tries++) {
    row = await partyRow(env, camp.id);
    const raw = row ? parse(row.data) ?? {} : {};
    const doc = row ? readable(raw) : blank();
    const seq = raw.seq && typeof raw.seq === "object" ? raw.seq : {};
    const high = Number(seq[dev]?.n) || 0;
    top = high;
    const now = Date.now();
    let sheet = false;
    let threads = false;
    for (const op of ops) {
      if (op.n <= high) continue;
      top = Math.max(top, op.n);
      if (op.m) threads = moveThread(doc, op, me, members, user, now) || threads;
      else sheet = apply(doc, op) || sheet;
    }
    if (top === high) break;
    // Threads go with the players they're between: one with someone who's
    // left, or who's playing someone else now, is nobody's business here.
    const ends = new Set(members.map((m) => m.end).filter(Boolean));
    for (const [id, x] of Object.entries(doc.bonds)) if (!ends.has(x.a) || !ends.has(x.b)) delete doc.bonds[id];
    const bonds = Object.entries(doc.bonds);
    if (bonds.length > MAX_BONDS) for (const [id] of bonds.sort((x, y) => x[1].at - y[1].at).slice(0, bonds.length - MAX_BONDS)) delete doc.bonds[id];
    if (sheet) {
      doc.by = user.id;
      doc.at = now;
    }
    seq[dev] = { n: top, at: now };
    const devices = Object.entries(seq);
    if (devices.length > MAX_DEVICES) for (const [d] of devices.sort((x, y) => (x[1]?.at ?? 0) - (y[1]?.at ?? 0)).slice(0, devices.length - MAX_DEVICES)) delete seq[d];
    const text = JSON.stringify({ ...doc, seq });
    if (text.length > MAX_DOC) return fail(413, "The party sheet’s full. Take something off it first.");
    const res = row
      ? await env.DB.prepare("UPDATE party SET data = ?2, version = version + 1, updatedAt = ?3 WHERE campaignId = ?1 AND version = ?4").bind(camp.id, text, now, row.version).run()
      : await env.DB.prepare("INSERT INTO party (campaignId, data, version, updatedAt) VALUES (?1, ?2, 1, ?3) ON CONFLICT DO NOTHING").bind(camp.id, text, now).run();
    if (res.meta.changes) {
      row = { data: text, version: (row?.version ?? 0) + 1 };
      break;
    }
    // Someone else's change got in first, so these go on top of theirs.
    if (tries >= 5) return fail(503, "Everyone’s changing the party sheet at once. Try again in a moment.");
  }
  return json({ v: stamp(camp, user, members, row), seq: top, ...viewOf(camp, user, members, row) });
}
