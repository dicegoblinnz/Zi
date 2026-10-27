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
//   POST /api/campaigns/<id>/maps?for=<map>   the crew's picture of a map
//        under the fog (stage 5), made on her phone with every covered square
//        painted over, the same size as the map's own picture.
//   GET  /api/campaigns/<id>/maps/<map>?k=<key>   a map's picture (&t=1 for
//        the small one), for the GM, or for a player once she's shown the crew
//        that map. The key has to be the map's picture now, so a phone that's
//        behind gets nothing rather than the wrong picture. While a map's under
//        the fog, the only picture a player gets is the crew's.
//
// A picture comes off when she takes its map down or puts another picture on
// it. The world keeps its key in a bin for a day after (binned(), from
// world.js), so Undo can put the map back with its picture, and after that
// the picture goes. A crew's picture that's been made again only waits long
// enough for a phone that's part way through fetching it, since her phone
// makes another whenever it's needed. Ending a campaign takes every picture
// it had (mapsEnd()).
import { MMAX, isKey, keysOf, mapsOf } from "../companion/maps.js";

const PIC_MAX = 8 * 1024 * 1024;
const THUMB_MAX = 400 * 1024;
// The small copy's longest side: her phone makes them 640.
const THUMB_SIDE = 1600;
// Pictures a campaign keeps, counting ones on their way off: each map's own,
// the crew's under the fog, and the ones in the bin.
const MAX_PICS = MMAX.maps * 3;
const DAY = 24 * 3600000;
const CREW_GRACE = 10 * 60000;
const MAP_ID = /^[a-z0-9-]{2,24}$/;
const NOTHING = "That map isn’t here, or it’s got a new picture since.";

const dir = (campId) => `maps/${campId}/`;
const token = (bytes) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// What a picture is, from its first bytes: a JPEG, a WebP or a PNG, or nothing.
export function kindOf(buf) {
  const b = new Uint8Array(buf, 0, Math.min(12, buf.byteLength));
  const at = (i, s) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && at(1, "PNG")) return "image/png";
  if (at(0, "RIFF") && at(8, "WEBP")) return "image/webp";
  return null;
}

// A picture's width and height, read from its first bytes the way its kind
// writes them, or null if they can't be read. A picture that's small to send
// but huge across would freeze a phone that opens it, so the size is checked
// here and not taken on trust.
export function sizeOf(buf, type) {
  const b = new Uint8Array(buf);
  const be = (i) => (b[i] << 8) | b[i + 1];
  const le = (i, n) => [...b.slice(i, i + n)].reduceRight((v, x) => v * 256 + x, 0);
  if (type === "image/png") return b.length >= 24 ? { w: new DataView(buf).getUint32(16), h: new DataView(buf).getUint32(20) } : null;
  if (type === "image/webp") {
    const chunk = String.fromCharCode(...b.slice(12, 16));
    if (chunk === "VP8 " && b.length >= 30) return { w: le(26, 2) & 0x3fff, h: le(28, 2) & 0x3fff };
    if (chunk === "VP8L" && b.length >= 25) {
      const n = le(21, 4);
      return { w: (n % 16384) + 1, h: (Math.floor(n / 16384) % 16384) + 1 };
    }
    if (chunk === "VP8X" && b.length >= 30) return { w: le(24, 3) + 1, h: le(27, 3) + 1 };
    return null;
  }
  // A JPEG: the size in its first frame header, past whatever comes before it.
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) {
      i += 1;
      continue;
    }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) {
      i += 2;
      continue;
    }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: be(i + 5), w: be(i + 7) };
    i += 2 + be(i + 2);
  }
  return null;
}
const fits = (sz, side) => Boolean(sz && sz.w >= 1 && sz.h >= 1 && sz.w <= side && sz.h <= side);

// The world's bin: pictures that have come off it lately, by key and when,
// and whether each was a crew's picture (c).
export function binOf(v) {
  return (Array.isArray(v) ? v : []).filter((x) => x && isKey(x.k) && Number.isFinite(x.at)).slice(-200).map((x) => ({ k: x.k, at: x.at, ...(x.c ? { c: 1 } : {}) }));
}

// After a change to the world: pictures it no longer uses go in the bin, and
// ones that have been in it for a day come out to be taken off the bucket.
// had is the world's pictures before the change (keysOf()), doc the world
// after it. A crew's picture goes in as if it's been there all but ten
// minutes of the day.
export function binned(rawBin, had, doc, now) {
  const has = keysOf(doc);
  const bin = binOf(rawBin).filter((b) => !has.has(b.k));
  for (const [k, kind] of had) if (!has.has(k) && !bin.some((b) => b.k === k)) bin.push(kind === "crew" ? { k, at: now - DAY + CREW_GRACE, c: 1 } : { k, at: now });
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
  // The crew's picture of a map under the fog goes up each time she
  // uncovers some, so there's room for a lot more of those in an hour.
  const forId = new URL(request.url).searchParams.get("for") ?? "";
  if (forId && !MAP_ID.test(forId)) return fail(404, NOTHING);
  if (await limited(env, forId ? `mapfog:${user.id}` : `map:${user.id}`, forId ? 600 : 40, 3600)) return fail(429, "That’s a lot of pictures at once. Give it a while.");
  // Its size up front, so nothing's read that's too big to keep.
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return fail(411, "That didn’t look like a picture.");
  if (length > PIC_MAX + THUMB_MAX + 65536) return fail(413, "That picture’s too big to put up.");
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
  const size = sizeOf(picBytes, type);
  if (!fits(size, MMAX.side) || !fits(sizeOf(thumbBytes, small), THUMB_SIDE)) return fail(400, `That picture’s bigger than a map can be, ${MMAX.side} across. Put it up from the World screen, which shrinks it first.`);

  // Pictures nothing in the world uses any more go first: ones put up over a
  // day ago that never got onto a map (her phone lost its signal on the way
  // and never got it back), and ones that have been in the bin for a day.
  const now = Date.now();
  const { maps, bin } = await mapsIn(env, camp.id);
  if (forId) {
    const m = maps.find((x) => x.id === forId);
    if (!m?.fog) return fail(409, "That map isn’t under the fog any more.");
    if (size.w !== m.w || size.h !== m.h) return fail(400, "That picture isn’t the same size as the map’s.");
  }
  const used = new Set(keysOf({ maps }).keys());
  for (const b of bin) if (now - b.at <= DAY) used.add(b.k);
  // A crew's picture in the bin is on its way off in minutes, so it doesn't
  // count against what a world holds, and one whose minutes are up goes now.
  const going = new Set(bin.filter((b) => b.c).map((b) => b.k));
  const listed = await listAll(env, camp.id);
  const old = [];
  let kept = 0;
  for (const o of listed) {
    const k = o.key.slice(dir(camp.id).length).replace(/\.t$/, "");
    if (!used.has(k) && (now - o.uploaded.getTime() > DAY || going.has(k))) old.push(o.key);
    else if (!o.key.endsWith(".t") && !going.has(k)) kept++;
  }
  for (let i = 0; i < old.length; i += 1000) await env.MAPS.delete(old.slice(i, i + 1000));
  if (kept >= MAX_PICS) return fail(409, "That’s as many pictures as a world holds. Take a map down first.");

  const key = token(12);
  await env.MAPS.put(`${dir(camp.id)}${key}`, picBytes, { httpMetadata: { contentType: type } });
  await env.MAPS.put(`${dir(camp.id)}${key}.t`, thumbBytes, { httpMetadata: { contentType: small } });
  return json({ key });
}

// The GM's for any map in the world, and a player's for a map the crew's been
// shown. Under the fog a player only ever gets the crew's picture, never hers.
export async function getPicture(url, env, camp, mapId, { fail }) {
  if (!env.MAPS || !MAP_ID.test(mapId)) return fail(404, NOTHING);
  const m = (await mapsIn(env, camp.id)).maps.find((x) => x.id === mapId);
  const k = url.searchParams.get("k") ?? "";
  const crew = m?.fog ? m.fog.crew?.k ?? "" : m?.key;
  const ok = m && isKey(k) && (camp.role === "gm" ? k === m.key || k === crew : m.shown && k === crew);
  if (!ok) return fail(404, NOTHING);
  const obj = await env.MAPS.get(`${dir(camp.id)}${k}${url.searchParams.get("t") === "1" ? ".t" : ""}`);
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
