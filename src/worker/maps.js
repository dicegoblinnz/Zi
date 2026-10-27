// A map's picture, for one campaign (stage 4 of notes/worlds-plan.md). The
// world (world.js) says which maps there are and what the crew's been shown.
// The pictures are in the bucket MAPS, each under its campaign's id, so
// nothing here can reach another campaign's. index.js has already checked
// that whoever's asking is this campaign's GM or one of its players.
//
//   POST /api/campaigns/<id>/maps   the GM puts a picture up, as a form: the
//        picture (pic) and a small one for lists (thumb), both already shrunk
//        on her phone. It answers the picture's key, which her phone then puts
//        on a map in the world.
//   GET  /api/campaigns/<id>/maps/<map>?k=<key>   a map's picture (&t=1 for
//        the small one), for the GM, or for a player once she's shown the crew
//        that map. The key has to be the map's picture now, so a phone that's
//        behind gets nothing rather than the wrong picture.
//
// A picture comes off when she takes its map down or puts another picture on
// it. The world keeps its key in a bin for a day after (binned(), from
// world.js), so Undo can put the map back with its picture, and after that
// the picture goes. Ending a campaign takes every picture it had (mapsEnd()).
import { MMAX, isKey, mapsOf } from "../companion/maps.js";

const PIC_MAX = 8 * 1024 * 1024;
const THUMB_MAX = 400 * 1024;
// Pictures a campaign keeps, counting ones on their way off.
const MAX_PICS = MMAX.maps * 2;
const DAY = 24 * 3600000;
const MAP_ID = /^[a-z0-9-]{2,24}$/;
const NOTHING = "That map isn’t here, or it’s got a new picture since.";

const dir = (campId) => `maps/${campId}/`;
const token = (bytes) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// What a picture is, from its first bytes: a JPEG, a WebP or a PNG, or nothing.
function kindOf(buf) {
  const b = new Uint8Array(buf, 0, Math.min(12, buf.byteLength));
  const at = (i, s) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && at(1, "PNG")) return "image/png";
  if (at(0, "RIFF") && at(8, "WEBP")) return "image/webp";
  return null;
}

// The world's bin: pictures that have come off it lately, by key and when.
export function binOf(v) {
  return (Array.isArray(v) ? v : []).filter((x) => x && isKey(x.k) && Number.isFinite(x.at)).slice(-200).map((x) => ({ k: x.k, at: x.at }));
}

// After a change to the world: pictures it no longer uses go in the bin, and
// ones that have been in it for a day come out to be taken off the bucket.
// had is the world's pictures before the change, doc the world after it.
export function binned(rawBin, had, doc, now) {
  const has = new Set(doc.maps.map((m) => m.key));
  const bin = binOf(rawBin).filter((b) => !has.has(b.k));
  for (const k of had) if (!has.has(k) && !bin.some((b) => b.k === k)) bin.push({ k, at: now });
  return { bin: bin.filter((b) => now - b.at <= DAY), gone: bin.filter((b) => now - b.at > DAY).map((b) => b.k) };
}

export async function dropPictures(env, campId, keys) {
  if (!env.MAPS || !keys.length) return;
  const all = keys.flatMap((k) => [`${dir(campId)}${k}`, `${dir(campId)}${k}.t`]);
  for (let i = 0; i < all.length; i += 1000) await env.MAPS.delete(all.slice(i, i + 1000));
}

async function listAll(env, campId) {
  const out = [];
  let cursor;
  do {
    const page = await env.MAPS.list({ prefix: dir(campId), limit: 1000, cursor });
    out.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return out;
}

// Only the world's maps and its bin, so a picture's quick to hand over on a
// world that's full of pages.
async function mapsIn(env, campId) {
  const row = await env.DB.prepare("SELECT data FROM world WHERE campaignId = ?1").bind(campId).first();
  let raw = null;
  try {
    raw = row ? JSON.parse(row.data) : null;
  } catch {}
  return { maps: mapsOf(raw?.maps), bin: binOf(raw?.bin) };
}

// Only the GM gets here (index.js turns anyone else away).
export async function putPicture(request, env, camp, user, { json, fail, limited }) {
  if (!env.MAPS) return fail(503, "Maps aren’t switched on here yet.");
  if (await limited(env, `map:${user.id}`, 40, 3600)) return fail(429, "That’s a lot of pictures at once. Give it a while.");
  if (Number(request.headers.get("content-length") || 0) > PIC_MAX + THUMB_MAX + 65536) return fail(413, "That picture’s too big to put up.");
  let form = null;
  try {
    form = await request.formData();
  } catch {}
  const pic = form?.get("pic");
  const thumb = form?.get("thumb");
  if (!(pic instanceof Blob) || !(thumb instanceof Blob)) return fail(400, "That didn’t look like a picture.");
  if (pic.size > PIC_MAX || thumb.size > THUMB_MAX) return fail(413, "That picture’s too big to put up.");
  const [picBytes, thumbBytes] = await Promise.all([pic.arrayBuffer(), thumb.arrayBuffer()]);
  const type = kindOf(picBytes);
  const small = kindOf(thumbBytes);
  if (!type || !small) return fail(400, "That isn’t a picture the site can show. Try a photo, a JPEG or a PNG.");

  // Pictures nothing in the world uses any more go first: ones put up over a
  // day ago that never got onto a map (her phone lost its signal on the way
  // and never got it back), and ones that have been in the bin for a day.
  const now = Date.now();
  const { maps, bin } = await mapsIn(env, camp.id);
  const used = new Set(maps.map((m) => m.key));
  for (const b of bin) if (now - b.at <= DAY) used.add(b.k);
  const listed = await listAll(env, camp.id);
  const old = [];
  let kept = 0;
  for (const o of listed) {
    const k = o.key.slice(dir(camp.id).length).replace(/\.t$/, "");
    if (!used.has(k) && now - o.uploaded.getTime() > DAY) old.push(o.key);
    else if (!o.key.endsWith(".t")) kept++;
  }
  for (let i = 0; i < old.length; i += 1000) await env.MAPS.delete(old.slice(i, i + 1000));
  if (kept >= MAX_PICS) return fail(409, "That’s as many pictures as a world holds. Take a map down first.");

  const key = token(12);
  await env.MAPS.put(`${dir(camp.id)}${key}`, picBytes, { httpMetadata: { contentType: type } });
  await env.MAPS.put(`${dir(camp.id)}${key}.t`, thumbBytes, { httpMetadata: { contentType: small } });
  return json({ key });
}

// The GM's for any map in the world, and a player's for a map the crew's been shown.
export async function getPicture(url, env, camp, mapId, { fail }) {
  if (!env.MAPS || !MAP_ID.test(mapId)) return fail(404, NOTHING);
  const m = (await mapsIn(env, camp.id)).maps.find((x) => x.id === mapId);
  if (!m || (camp.role !== "gm" && !m.shown) || m.key !== url.searchParams.get("k")) return fail(404, NOTHING);
  const obj = await env.MAPS.get(`${dir(camp.id)}${m.key}${url.searchParams.get("t") === "1" ? ".t" : ""}`);
  if (!obj) return fail(404, "That picture isn’t here any more.");
  // Her phone keeps it for no signal itself (mapsui.js), so nothing in
  // between keeps a copy.
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}

// A campaign that's ended takes every picture it had with it.
export async function mapsEnd(env, campId) {
  if (!env.MAPS) return;
  try {
    const keys = (await listAll(env, campId)).map((o) => o.key);
    for (let i = 0; i < keys.length; i += 1000) await env.MAPS.delete(keys.slice(i, i + 1000));
  } catch (err) {
    console.error(`maps end: ${err?.message ?? err}`);
  }
}
