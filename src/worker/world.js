// A campaign's world, for one campaign (notes/worlds-plan.md): its faction
// board, its places and people (pages.js) and its maps (maps.js, with their
// pictures in src/worker/maps.js). index.js has already checked that whoever's asking is this
// campaign's GM or one of its players, and nothing here reads or changes
// anything but this campaign's world.
//
//   GET  /api/campaigns/<id>/world?v=   the world: the whole of it for the GM,
//        and for a player only what the crew's been shown (forPlayer() in
//        board.js, with pagesForPlayer() in pages.js and buildForPlayer() in
//        world-record.js, which never hands them the seed or anything the
//        world builder dealt), so nothing they haven't been shown ever
//        reaches their phone. With ?v= and nothing they'd see has changed, only { same: true }.
//   POST /api/campaigns/<id>/world      the GM's changes from one phone: { dev, ops }.
//        Each change carries a number that goes up on that phone, so a change
//        sent twice (the signal dropped before the answer came back) counts once.
//        A picture a change takes off a map goes in the world's bin for a day,
//        so Undo can put it back, then off the bucket (binned() in maps.js).
//        When what the crew sees of the maps has changed (fog she's lifted, a
//        map or a pin she's shown), or of How it came to be (an age she's
//        shown them), every phone on the campaign's live table is told to
//        look again, so it's there in a moment (tableWorld()).
//        A whole world (stage 14 of notes/builder-plan.md) is Mo's alone to
//        bring in for now: a change carrying one of its cards, its drawn map
//        or its record, from any other GM, is turned down whole.
import { apply, blank, factionOf, forPlayer, readable } from "../companion/board.js";
import { keysOf, mapOf, mapsForPlayer } from "../companion/maps.js";
import { pageOf } from "../companion/pages.js";
import { buildForPlayer, buildOf } from "../companion/world-record.js";
import { binned, dropPictures } from "./maps.js";
import { tableWorld } from "./table.js";
import wholes from "../generated/worlds-index.json";

const DEV = /^[A-Za-z0-9_-]{8,40}$/;
// What the crew's phones are told to look again for: their maps and their history.
const crewView = (doc) => JSON.stringify([mapsForPlayer(doc), buildForPlayer(doc)]);
const MAX_CHANGES = 200;
// Twenty Places and the whole Bestiary brought in fit with room to spare.
const MAX_DOC = 700000;
const MAX_DEVICES = 64;

// A change that brings in something of a whole world's: a faction or a page
// whose book is the world's, its drawn map, or its record. Each is read the
// way apply() would keep it, so the world's id is checked as it'd be stored.
const WHOLE = new Set(wholes.map((w) => w.id));
const keptFrom = (op) => {
  if (!op || typeof op !== "object") return null;
  const as = (x) => (x && typeof x === "object" && !Array.isArray(x) ? { ...x, id: "whole-check" } : null);
  if (op.o === "new" || op.o === "mini") return factionOf(as(op.f))?.book?.from;
  if (op.o === "p-new") return pageOf(as(op.p))?.book?.from;
  if (op.o === "m-new") return mapOf(as(op.m))?.from;
  if (op.o === "wb-set") return buildOf(op.b)?.world;
  return null;
};
const ofWhole = (op) => WHOLE.has(keptFrom(op) ?? "");

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
function viewOf(camp, row, known = null) {
  const doc = known ?? (row ? readable(parse(row.data)) : blank());
  const world = camp.role === "gm" ? doc : forPlayer(doc);
  return { world, v: stampOf(camp.role === "gm" ? `gm:${row?.version ?? 0}` : `player:${JSON.stringify(world)}`) };
}

export async function showWorld(env, url, camp, user, { json }) {
  const { world, v } = viewOf(camp, await worldRow(env, camp.id));
  if (url.searchParams.get("v") === v) return json({ same: true, v });
  return json({ v, world, role: camp.role });
}

// Only the GM gets here (index.js turns anyone else away). isAdmin() says
// whether she's Mo, asked only when a change brings in a whole world.
export async function changeWorld(request, env, camp, user, { json, fail, body, isAdmin }) {
  const b = await body(request);
  const dev = String(b?.dev ?? "");
  if (!b || !DEV.test(dev) || !Array.isArray(b.ops)) return fail(400, "That didn’t look like a change to the board.");
  if (b.ops.length > MAX_CHANGES) return fail(413, "That’s a lot of changes at once. Send them a few at a time.");
  if (b.ops.some(ofWhole) && !(await isAdmin?.())) return fail(403, "Only Mo can bring that world into a campaign for now.");
  const ops = b.ops.filter((x) => x && typeof x === "object" && Number.isInteger(x.n) && x.n > 0).sort((x, y) => x.n - y.n);
  let row = null;
  let top = 0;
  let doc = null;
  let gone = [];
  let crewMoved = false;
  for (let tries = 0; ; tries++) {
    row = await worldRow(env, camp.id);
    const raw = row ? parse(row.data) ?? {} : {};
    doc = readable(raw);
    const had = keysOf(doc);
    const crewSaw = crewView(doc);
    // Kept with no prototype, so no phone's id can be anything but an entry.
    const seq = Object.assign(Object.create(null), raw.seq && typeof raw.seq === "object" ? raw.seq : {});
    const high = Number(seq[dev]?.n) || 0;
    top = high;
    const now = Date.now();
    let changed = false;
    for (const op of ops) {
      if (op.n <= high) continue;
      top = Math.max(top, op.n);
      // A change that can't be read is skipped, and still counted, so it
      // can't hold up the ones behind it on her phone.
      try {
        changed = apply(doc, op) || changed;
      } catch {}
    }
    if (top === high) break;
    if (changed) {
      doc.by = user.id;
      doc.at = now;
    }
    seq[dev] = { n: top, at: now };
    const devices = Object.entries(seq);
    if (devices.length > MAX_DEVICES) for (const [d] of devices.sort((x, y) => (x[1]?.at ?? 0) - (y[1]?.at ?? 0)).slice(0, devices.length - MAX_DEVICES)) delete seq[d];
    const pics = binned(raw.bin, had, doc, now);
    gone = pics.gone;
    const text = JSON.stringify({ ...doc, seq, bin: pics.bin });
    if (text.length > MAX_DOC) return fail(413, "The world’s full. Take something off it first.");
    const res = row
      ? await env.DB.prepare("UPDATE world SET data = ?2, version = version + 1, updatedAt = ?3 WHERE campaignId = ?1 AND version = ?4").bind(camp.id, text, now, row.version).run()
      : await env.DB.prepare("INSERT INTO world (campaignId, data, version, updatedAt) VALUES (?1, ?2, 1, ?3) ON CONFLICT DO NOTHING").bind(camp.id, text, now).run();
    if (res.meta.changes) {
      row = { data: text, version: (row?.version ?? 0) + 1 };
      crewMoved = changed && crewView(doc) !== crewSaw;
      break;
    }
    // A change from her other phone got in first, so these go on top of it.
    if (tries >= 5) return fail(503, "The board’s being changed from somewhere else too. Try again in a moment.");
  }
  // Pictures a day in the bin come off the bucket, now the world's let them go.
  if (gone.length) await dropPictures(env, camp.id, gone).catch((err) => console.error(`maps bin: ${err?.message ?? err}`));
  if (crewMoved) await tableWorld(env, camp.id);
  // The world as it now stands, without reading it back again.
  return json({ seq: top, ...viewOf(camp, row, doc), role: camp.role });
}
