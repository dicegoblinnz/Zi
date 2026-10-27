// A campaign's world, for one campaign (stage 1 of notes/worlds-plan.md): its
// faction board. index.js has already checked that whoever's asking is this
// campaign's GM or one of its players, and nothing here reads or changes
// anything but this campaign's world.
//
//   GET  /api/campaigns/<id>/world?v=   the board: the whole of it for the GM,
//        and for a player only what the crew's been shown (forPlayer() in
//        board.js), so nothing they haven't been shown ever reaches their
//        phone. With ?v= and nothing they'd see has changed, only { same: true }.
//   POST /api/campaigns/<id>/world      the GM's changes from one phone: { dev, ops }.
//        Each change carries a number that goes up on that phone, so a change
//        sent twice (the signal dropped before the answer came back) counts once.
import { apply, blank, forPlayer, readable } from "../companion/board.js";

const DEV = /^[A-Za-z0-9_-]{8,40}$/;
const MAX_CHANGES = 200;
const MAX_DOC = 400000;
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

const worldRow = (env, id) => env.DB.prepare("SELECT data, version FROM world WHERE campaignId = ?1").bind(id).first();

// The board as this one person gets it, and its stamp. A player's stamp is
// made from what they get, so a change to something they haven't been shown
// doesn't even tell them something changed.
function viewOf(camp, row) {
  const doc = row ? readable(parse(row.data)) : blank();
  const world = camp.role === "gm" ? doc : forPlayer(doc);
  return { world, v: stampOf(camp.role === "gm" ? `gm:${row?.version ?? 0}` : `player:${JSON.stringify(world)}`) };
}

export async function showWorld(env, url, camp, user, { json }) {
  const { world, v } = viewOf(camp, await worldRow(env, camp.id));
  if (url.searchParams.get("v") === v) return json({ same: true, v });
  return json({ v, world, role: camp.role });
}

// Only the GM gets here (index.js turns anyone else away).
export async function changeWorld(request, env, camp, user, { json, fail, body }) {
  const b = await body(request);
  const dev = String(b?.dev ?? "");
  if (!b || !DEV.test(dev) || !Array.isArray(b.ops)) return fail(400, "That didn’t look like a change to the board.");
  if (b.ops.length > MAX_CHANGES) return fail(413, "That’s a lot of changes at once. Send them a few at a time.");
  const ops = b.ops.filter((x) => x && typeof x === "object" && Number.isInteger(x.n) && x.n > 0).sort((x, y) => x.n - y.n);
  let row = null;
  let top = 0;
  for (let tries = 0; ; tries++) {
    row = await worldRow(env, camp.id);
    const raw = row ? parse(row.data) ?? {} : {};
    const doc = readable(raw);
    // Kept with no prototype, so no phone's id can be anything but an entry.
    const seq = Object.assign(Object.create(null), raw.seq && typeof raw.seq === "object" ? raw.seq : {});
    const high = Number(seq[dev]?.n) || 0;
    top = high;
    const now = Date.now();
    let changed = false;
    for (const op of ops) {
      if (op.n <= high) continue;
      top = Math.max(top, op.n);
      changed = apply(doc, op) || changed;
    }
    if (top === high) break;
    if (changed) {
      doc.by = user.id;
      doc.at = now;
    }
    seq[dev] = { n: top, at: now };
    const devices = Object.entries(seq);
    if (devices.length > MAX_DEVICES) for (const [d] of devices.sort((x, y) => (x[1]?.at ?? 0) - (y[1]?.at ?? 0)).slice(0, devices.length - MAX_DEVICES)) delete seq[d];
    const text = JSON.stringify({ ...doc, seq });
    if (text.length > MAX_DOC) return fail(413, "The board’s full. Take something off it first.");
    const res = row
      ? await env.DB.prepare("UPDATE world SET data = ?2, version = version + 1, updatedAt = ?3 WHERE campaignId = ?1 AND version = ?4").bind(camp.id, text, now, row.version).run()
      : await env.DB.prepare("INSERT INTO world (campaignId, data, version, updatedAt) VALUES (?1, ?2, 1, ?3) ON CONFLICT DO NOTHING").bind(camp.id, text, now).run();
    if (res.meta.changes) {
      row = { data: text, version: (row?.version ?? 0) + 1 };
      break;
    }
    // A change from her other phone got in first, so these go on top of it.
    if (tries >= 5) return fail(503, "The board’s being changed from somewhere else too. Try again in a moment.");
  }
  return json({ seq: top, ...viewOf(camp, row), role: camp.role });
}
