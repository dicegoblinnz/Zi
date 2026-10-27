// The pictures behind a campaign's maps (stage 4 of notes/worlds-plan.md),
// kept in the R2 bucket bound as MAPS (pictures.js). index.js has already
// checked that whoever's asking is this campaign's GM or one of its players,
// and nothing here reads or writes outside this campaign's own folder.
//
//   POST /api/campaigns/<id>/maps/<map>?name=   the GM puts up a picture: a new
//        map with that name, or a new picture for one that's there, keeping
//        its name and pins. The body's the picture itself, shrunk on her phone.
//        It answers with the world as it now stands, the way a change does.
//   GET  /api/campaigns/<id>/maps/<map>?v=      the picture: for the GM, and
//        for a player once the crew's been shown that map. Anyone else gets
//        the same 404 as a map that isn't there. v is the picture's file, so
//        a phone can keep it for good, and a new picture gets a new address.
//
// The Worker works out what the picture is and how big from the picture
// itself, never from what the phone says, and only takes a JPEG, a PNG or a
// WebP. A map that goes out of the world takes its picture with it (world.js),
// and so does ending the campaign.
import { MMAX, findMap, mapsOf, putMap } from "../companion/maps-rules.js";
import { dropPictures, pictureKey } from "./pictures.js";
import { worldWith } from "./world.js";

const MAP_ID = /^[a-z0-9-]{2,24}$/;
// Her phone sends 2560 pixels on the long side, usually well under 2 MB.
const MAX_BYTES = 6 * 1024 * 1024;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const NOT_THERE = "That map isn’t there.";

const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const parse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// What a picture is and its size in pixels, read off its first bytes: a PNG's
// header, a WebP's first chunk, or a JPEG's frame. Anything else is null.
export function pictureOf(b) {
  const ascii = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  const u16be = (i) => (b[i] << 8) | b[i + 1];
  const u16le = (i) => b[i] | (b[i + 1] << 8);
  const u24le = (i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const u32be = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b.length > 24 && b[0] === 0x89 && ascii(1, 3) === "PNG" && ascii(12, 4) === "IHDR") return { kind: "png", w: u32be(16), h: u32be(20) };
  if (b.length > 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 " && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return { kind: "webp", w: u16le(26) & 0x3fff, h: u16le(28) & 0x3fff };
    if (chunk === "VP8L" && b[20] === 0x2f) {
      const bits = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0;
      return { kind: "webp", w: (bits & 0x3fff) + 1, h: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") return { kind: "webp", w: u24le(24) + 1, h: u24le(27) + 1 };
    return null;
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      // Padding, and the markers that have nothing after them.
      if (m === 0xff) {
        i += 1;
        continue;
      }
      if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) {
        i += 2;
        continue;
      }
      // The end, or the picture itself, before any frame said its size.
      if (m === 0xd9 || m === 0xda) return null;
      const len = u16be(i + 2);
      if (len < 2) return null;
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { kind: "jpg", w: u16be(i + 7), h: u16be(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

// Only the GM gets here (index.js turns anyone else away).
export async function putPicture(request, env, url, camp, user, mapId, { json, fail, limited }) {
  if (!env.MAPS) return fail(503, "Maps aren’t switched on yet.");
  if (!MAP_ID.test(mapId)) return fail(404, NOT_THERE);
  if (await limited(env, `maps:${user.id}`, 40, 3600)) return fail(429, "That’s a lot of pictures in an hour. Give it a while.");
  const big = () => fail(413, "That picture’s too big to put up. Try a smaller one.");
  if (Number(request.headers.get("content-length")) > MAX_BYTES) return big();
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return big();
  const pic = bytes.length ? pictureOf(bytes) : null;
  if (!pic || pic.w < 16 || pic.h < 16 || pic.w > MMAX.px || pic.h > MMAX.px) return fail(415, "That didn’t look like a picture it can put up. Try a photo, a JPEG or a PNG.");
  const name = String(url.searchParams.get("name") ?? "");
  const file = `${random(24)}.${pic.kind}`;
  await env.MAPS.put(pictureKey(camp.id, file), bytes, { httpMetadata: { contentType: TYPES[pic.kind] }, customMetadata: { map: mapId, by: user.id } });
  // Then the map in the world, the same careful way a change goes in. If it
  // can't go in, the picture doesn't stay either.
  const done = await worldWith(env, camp, user, (doc) => {
    const r = putMap(doc, { id: mapId, name, file, w: pic.w, h: pic.h, bytes: bytes.length, at: Date.now() });
    if (r.full) return { ok: false, status: 409, error: `That’s ${MMAX.maps} maps, which is as many as a world holds. Take one out first.` };
    return r.ok ? r : { ok: false, status: 400, error: "That didn’t look like a map." };
  });
  if (!done.ok) {
    await dropPictures(env, camp.id, [file]);
    return fail(done.status ?? 400, done.error ?? "That didn’t go up.");
  }
  if (done.old) await dropPictures(env, camp.id, [done.old]);
  return json({ ...done.view, role: camp.role, map: mapId });
}

// The GM's maps, and the ones the crew's been shown for a player. Only the
// maps are read out of the world, so a big world doesn't slow a picture down.
export async function getPicture(request, env, url, camp, mapId, { fail }) {
  if (!env.MAPS || !MAP_ID.test(mapId)) return fail(404, NOT_THERE);
  const row = await env.DB.prepare("SELECT json_extract(data, '$.maps') AS maps FROM world WHERE campaignId = ?1").bind(camp.id).first();
  const m = row?.maps ? findMap({ maps: mapsOf(parse(row.maps)) }, mapId) : null;
  if (!m || (camp.role !== "gm" && !m.shown)) return fail(404, NOT_THERE);
  const obj = await env.MAPS.get(pictureKey(camp.id, m.file), { onlyIf: request.headers });
  if (!obj) return fail(404, NOT_THERE);
  const kept = url.searchParams.get("v") === m.file;
  const headers = new Headers({
    "content-type": TYPES[m.file.split(".").pop()] ?? "application/octet-stream",
    "cache-control": kept ? "private, max-age=31536000, immutable" : "private, no-cache",
    etag: obj.httpEtag,
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "cross-origin-resource-policy": "same-origin",
  });
  // The phone has this one already.
  if (!obj.body) return new Response(null, { status: 304, headers });
  headers.set("content-length", String(obj.size));
  return new Response(obj.body, { headers });
}
