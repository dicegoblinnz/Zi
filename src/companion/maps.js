// Maps in a campaign's world (stage 4 of notes/worlds-plan.md): the GM's own
// pictures, a photo of one she drew or one off her phone, with pins she drops
// that open a page or a faction. They're kept in the world beside the board
// and the pages (board.js keeps all three, and hands a map's changes here), so
// her phone and the Worker change them the same way, and mapsForPlayer() only
// ever hands a player the maps the crew's been shown, with the pins she's
// shown on each.
//
// The picture itself isn't in here. It's in the Worker's bucket, under the
// campaign's id and the map's key, and the Worker only hands it to the
// campaign's GM and, once she's shown the crew the map, its players
// (src/worker/maps.js).
//
// A map: { id, name, key, w, h, of, shown, pins, fog? }
//   key     the picture's name in the bucket, made by the Worker
//   w, h    the picture's size in pixels, so the pins sit right before it's in
//   of      the place's page it's a map of, or ""
//   shown   the crew's been shown it
//   pins    [{ id, x, y, to, name, shown }]
//           x, y   where it is, across and down the picture, from 0 to 1
//           to     what it opens: { k: "p", id } a page, { k: "f", id } a
//                  faction, or null for a pin that's only a name
//           name   what the crew calls it, if she's given it a name of its
//                  own (smoke on the ridge), or "" for the name of what it opens
//           shown  the crew's been shown it: its name, and what it opens once
//                  she's shown them that too
//   fog     only on a map she's covered (stage 5): { c, crew }
//           c      which of its squares are covered, as she's rubbed it
//           crew   { k, c }: the crew's own picture (k), made on her phone with
//                  every covered square painted over, and the fog it was made
//                  with (c), or null till her phone's made one
//
// A change (its o starts with "m-"):
//   { o: "m-new", m, at? }             a map in the world
//   { o: "m-gone", id }                a map out of it
//   { o: "m-set", id, f, v }           its name, or the place it's a map of (of)
//   { o: "m-pic", id, key, w, h }      a new picture for it, its pins where they were
//   { o: "m-show", id, v }             the crew's been shown it, or not
//   { o: "m-pin", id, pin, at? }       a pin on it
//   { o: "m-unpin", id, pid }          a pin off it
//   { o: "m-pinset", id, pid, f, v }   one part of a pin: at ({ x, y }), to, name or shown
//   { o: "m-fog", id, v }              the fog as she's rubbed it, or null to take it off
//   { o: "m-crew", id, key, c }        the crew's picture, made with the fog c
//
// The crew never gets her picture of a map that's under the fog. They get the
// crew's picture and the fog it was made with, so what their phone shows and
// what's in the picture always match, and a pin only once its spot's uncovered.
import { findPage } from "./pages.js";

// A picture's longest side is 4096 pixels (Mo, 27 Oct), which is about the
// most an iPhone can safely shrink and show.
export const MMAX = { maps: 20, pins: 60, name: 60, side: 4096 };
const ID = /^[a-z0-9-]{2,24}$/;
const KEY = /^[A-Za-z0-9_-]{16,32}$/;

export const isMapOp = (op) => typeof op?.o === "string" && op.o.startsWith("m-");

const isId = (v) => typeof v === "string" && ID.test(v);
export const isKey = (v) => typeof v === "string" && KEY.test(v);
// One line of words: no line breaks or control characters, no doubled spaces.
const one = (v, max) => (typeof v === "string" ? v : "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const side = (v) => (Number.isInteger(v) && v >= 1 && v <= MMAX.side ? v : 0);
// Across or down the picture, from 0 to 1, to four places, which is closer
// than a pixel on the biggest picture.
const frac = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(1, Math.max(0, v)) * 10000) / 10000 : null);
const toOf = (v) => (v && typeof v === "object" && (v.k === "p" || v.k === "f") && isId(v.id) ? { k: v.k, id: v.id } : null);

// ------------------------------------------------------------ the fog
//
// The fog's a grid laid over the picture, FOG squares along its longest side
// and as many along the other as keeps them square. Each square's covered or
// not, kept as a bit (1 is covered), eight to a byte with the first square in
// the lowest bit, written out in base64. On the biggest picture a square's 32
// pixels across, so a thumb rubs a few away at a time.
export const FOG = 128;

export function gridOf(w, h) {
  const long = Math.max(w, h, 1);
  return { gw: Math.max(1, Math.min(w, Math.round((FOG * w) / long))), gh: Math.max(1, Math.min(h, Math.round((FOG * h) / long))) };
}
const bytesOf = (gw, gh) => Math.ceil((gw * gh) / 8);
const spareOf = (gw, gh) => (gw * gh) % 8;

// The fog's squares as bytes, or null if it isn't a fog for a picture this
// size. The bits past the last square are always 0, so a fog's only ever
// written one way, and two that cover the same squares read the same.
export function fogBits(c, w, h) {
  if (typeof c !== "string" || c.length > 8192) return null;
  const { gw, gh } = gridOf(w, h);
  let s = "";
  try {
    s = atob(c);
  } catch {
    return null;
  }
  if (s.length !== bytesOf(gw, gh)) return null;
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  const spare = spareOf(gw, gh);
  if (spare) b[b.length - 1] &= (1 << spare) - 1;
  return b;
}
export function fogText(b) {
  let s = "";
  for (let i = 0; i < b.length; i += 4096) s += String.fromCharCode(...b.subarray(i, i + 4096));
  return btoa(s);
}
// A fog over all of the picture, or (on false) none of it.
export function fogFull(w, h, on = true) {
  const { gw, gh } = gridOf(w, h);
  const b = new Uint8Array(bytesOf(gw, gh));
  if (on) {
    b.fill(255);
    const spare = spareOf(gw, gh);
    if (spare) b[b.length - 1] = (1 << spare) - 1;
  }
  return fogText(b);
}
const tidyFog = (c, w, h) => {
  const b = fogBits(c, w, h);
  return b ? fogText(b) : null;
};
// Whether square (i, j) is covered, and whether a spot (x and y from 0 to 1) is.
export const squareCovered = (b, gw, i, j) => ((b[(j * gw + i) >> 3] >> ((j * gw + i) & 7)) & 1) === 1;
export function spotCovered(b, w, h, x, y) {
  const { gw, gh } = gridOf(w, h);
  return squareCovered(b, gw, Math.min(gw - 1, Math.max(0, Math.floor(x * gw))), Math.min(gh - 1, Math.max(0, Math.floor(y * gh))));
}
// Whether fog a covers any square that fog b leaves uncovered.
export function coversMore(a, b, w, h) {
  const x = fogBits(a, w, h);
  const y = fogBits(b, w, h);
  if (!x || !y) return true;
  for (let i = 0; i < x.length; i++) if (x[i] & ~y[i]) return true;
  return false;
}
// Whether two pictures' fogs are laid out the same, so one's fog fits the other.
const sameGrid = (w1, h1, w2, h2) => {
  const a = gridOf(w1, h1);
  const b = gridOf(w2, h2);
  return a.gw === b.gw && a.gh === b.gh;
};
// How much of it's covered, from 0 to 1.
export function coveredShare(c, w, h) {
  const b = fogBits(c, w, h);
  if (!b) return 1;
  const { gw, gh } = gridOf(w, h);
  let n = 0;
  for (const x of b) for (let v = x; v; v &= v - 1) n++;
  return n / (gw * gh);
}

// A map's fog, tidied, or null for a map that isn't covered at all. A fog
// that doesn't fit the picture covers all of it, so nothing shows by mistake.
function fogOf(raw, w, h) {
  if (!raw || typeof raw !== "object") return null;
  const c = tidyFog(raw.c, w, h) ?? fogFull(w, h);
  const crew = raw.crew && typeof raw.crew === "object" && isKey(raw.crew.k) ? tidyFog(raw.crew.c, w, h) : null;
  return { c, crew: crew ? { k: raw.crew.k, c: crew } : null };
}

// A pin, tidied, or null if it can't go on. One that opens nothing needs a name.
function pinOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const x = frac(raw.x);
  const y = frac(raw.y);
  if (x === null || y === null) return null;
  const to = toOf(raw.to);
  const name = one(raw.name, MMAX.name);
  if (!to && !name) return null;
  return { id: raw.id, x, y, to, name, shown: raw.shown === true };
}

// A map as it came from somewhere else, tidied so nothing in it is anything
// but words and numbers in the right places.
export function mapOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const name = one(raw.name, MMAX.name);
  const w = side(raw.w);
  const h = side(raw.h);
  if (!name || !w || !h) return null;
  const fog = fogOf(raw.fog, w, h);
  // A crew's map that's still all under the fog hasn't got a picture yet.
  const key = isKey(raw.key) ? raw.key : "";
  if (!key && !fog) return null;
  const seen = new Set();
  const pins = (Array.isArray(raw.pins) ? raw.pins : []).map(pinOf).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, MMAX.pins);
  return { id: raw.id, name, key, w, h, of: isId(raw.of) ? raw.of : "", shown: raw.shown === true, pins, ...(fog ? { fog } : {}) };
}

export function mapsOf(raw) {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : []).map(mapOf).filter((m) => m && !seen.has(m.id) && seen.add(m.id)).slice(0, MMAX.maps);
}

export const findMap = (doc, id) => doc.maps?.find((m) => m.id === id) ?? null;

// One change to a map. It says whether anything changed, comparing only the
// map it's on, so a big world stays quick on the Worker.
export function applyMap(doc, op) {
  doc.maps ??= [];
  const m = op.id ? findMap(doc, op.id) : null;
  const was = m ? JSON.stringify(m) : "";
  const pin = m && op.pid ? m.pins.find((p) => p.id === op.pid) : null;
  switch (op.o) {
    case "m-new": {
      const n = mapOf(op.m);
      if (!n || !n.key || findMap(doc, n.id) || doc.maps.length >= MMAX.maps) return false;
      // Her phone makes the crew's picture again, since one from before
      // (a map taken down and put back) may have gone from the bucket.
      if (n.fog) n.fog.crew = null;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= doc.maps.length ? op.at : doc.maps.length;
      doc.maps.splice(at, 0, n);
      return true;
    }
    case "m-gone":
      if (!m) return false;
      doc.maps.splice(doc.maps.indexOf(m), 1);
      return true;
    case "m-set":
      if (!m) return false;
      if (op.f === "name") {
        const v = one(op.v, MMAX.name);
        if (!v) return false;
        m.name = v;
      } else if (op.f === "of") m.of = isId(op.v) ? op.v : "";
      else return false;
      break;
    case "m-pic": {
      const w = side(op.w);
      const h = side(op.h);
      if (!m || !isKey(op.key) || !w || !h) return false;
      // The crew's picture was made from the old one, so her phone makes
      // another. The fog stays if the new picture's laid out the same, and
      // otherwise (one turned on its side, say) covers all of it.
      if (m.fog) m.fog = { c: sameGrid(m.w, m.h, w, h) ? tidyFog(m.fog.c, w, h) ?? fogFull(w, h) : fogFull(w, h), crew: null };
      Object.assign(m, { key: op.key, w, h });
      break;
    }
    case "m-fog": {
      if (!m) return false;
      if (op.v === null) {
        if (!m.fog) return false;
        delete m.fog;
        break;
      }
      const c = tidyFog(op.v, m.w, m.h);
      if (!c) return false;
      // Fog back over anything the crew's picture shows takes that picture
      // off them straight away, so they see fog till her phone's made
      // another. Only uncovering more keeps it till then.
      const crew = m.fog?.crew;
      m.fog = { c, crew: crew && c !== fogFull(m.w, m.h) && !coversMore(c, crew.c, m.w, m.h) ? crew : null };
      break;
    }
    case "m-crew": {
      // Never her own picture, or any other map's, and never one that shows
      // a square she's covered since it was made.
      const c = m?.fog && isKey(op.key) ? tidyFog(op.c, m.w, m.h) : null;
      if (!c || coversMore(m.fog.c, c, m.w, m.h) || doc.maps.some((x) => x.key === op.key || (x !== m && x.fog?.crew?.k === op.key))) return false;
      m.fog.crew = { k: op.key, c };
      break;
    }
    case "m-show":
      if (!m) return false;
      m.shown = op.v === true;
      break;
    case "m-pin": {
      const p = m ? pinOf(op.pin) : null;
      if (!p || m.pins.some((x) => x.id === p.id) || m.pins.length >= MMAX.pins) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= m.pins.length ? op.at : m.pins.length;
      m.pins.splice(at, 0, p);
      break;
    }
    case "m-unpin":
      if (!pin) return false;
      m.pins.splice(m.pins.indexOf(pin), 1);
      break;
    case "m-pinset": {
      if (!pin) return false;
      let next = null;
      if (op.f === "at") next = pinOf({ ...pin, x: op.v?.x, y: op.v?.y });
      else if (op.f === "to") next = pinOf({ ...pin, to: op.v });
      else if (op.f === "name") next = pinOf({ ...pin, name: op.v });
      else if (op.f === "shown") next = { ...pin, shown: op.v === true };
      if (!next) return false;
      Object.assign(pin, next);
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(m) !== was;
}

// What puts a change back, worked out from the world before it's made.
export function undoMap(doc, op) {
  const m = op.id ? findMap(doc, op.id) : null;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const pin = m && (op.pid || op.pin?.id) ? m.pins.find((p) => p.id === (op.pid ?? op.pin.id)) : null;
  switch (op.o) {
    case "m-new":
      return op.m?.id ? [{ o: "m-gone", id: op.m.id }] : [];
    case "m-gone":
      return m ? [{ o: "m-new", m: copy(m), at: doc.maps.indexOf(m) }] : [];
    case "m-set":
      return m ? [{ o: "m-set", id: m.id, f: op.f, v: m[op.f] }] : [];
    case "m-pic":
      return m ? [{ o: "m-pic", id: m.id, key: m.key, w: m.w, h: m.h }] : [];
    case "m-show":
      return m ? [{ o: "m-show", id: m.id, v: m.shown }] : [];
    case "m-pin":
      return m && op.pin?.id ? [{ o: "m-unpin", id: m.id, pid: op.pin.id }] : [];
    case "m-unpin":
      return pin ? [{ o: "m-pin", id: m.id, pin: copy(pin), at: m.pins.indexOf(pin) }] : [];
    case "m-pinset":
      if (!pin) return [];
      return [{ o: "m-pinset", id: m.id, pid: pin.id, f: op.f, v: op.f === "at" ? { x: pin.x, y: pin.y } : op.f === "to" ? copy(pin.to) : pin[op.f] }];
    // Her phone makes the crew's picture again for the fog that's back.
    case "m-fog":
      return m ? [{ o: "m-fog", id: m.id, v: m.fog ? m.fog.c : null }] : [];
    default:
      return [];
  }
}

// ------------------------------------------------------------ reading a pin

// What a pin opens: the page or the faction, if it's still in the world.
export function targetOf(doc, to) {
  if (!to) return null;
  return to.k === "p" ? findPage(doc, to.id) : doc.factions?.find((f) => f.id === to.id) ?? null;
}
// Whether the crew's been shown what a pin opens.
export function shownToCrew(doc, to) {
  const t = targetOf(doc, to);
  return Boolean(t && (to.k === "p" ? t.shown.page : t.shown.card));
}
// The pin's name as the crew sees it: her name for it, or the name of what it opens.
export const labelOf = (doc, pin) => pin.name || targetOf(doc, pin.to)?.name || "";

// Every picture the world's maps use, for the Worker's tidying: each map's
// own ("map"), and the crew's of one under the fog ("crew").
export function keysOf(doc) {
  const out = new Map();
  for (const m of doc.maps ?? []) {
    out.set(m.key, "map");
    if (m.fog?.crew) out.set(m.fog.crew.k, "crew");
  }
  return out;
}

// ------------------------------------------------------------ what the crew sees

// The maps as a player gets them: only the ones the crew's been shown, and on
// each only the pins she's shown, by the name the crew knows them by. A pin
// only says what it opens once the crew's been shown that too, and a map only
// says which place it's of once they've been shown the place. Under the fog
// it's the crew's picture and the fog that was made with (all of it covered,
// with no picture, till her phone's made one), and a pin's only there once
// its spot's uncovered.
export function mapsForPlayer(doc) {
  return (doc.maps ?? []).filter((m) => m.shown).map((m) => {
    const seen = m.fog ? m.fog.crew?.c ?? fogFull(m.w, m.h) : null;
    const b = seen ? fogBits(seen, m.w, m.h) : null;
    return {
      id: m.id, name: m.name, key: m.fog ? m.fog.crew?.k ?? "" : m.key, w: m.w, h: m.h,
      of: m.of && findPage(doc, m.of)?.shown.page ? m.of : "",
      shown: true,
      pins: m.pins.filter((p) => p.shown && !(seen && (!b || spotCovered(b, m.w, m.h, p.x, p.y)))).map((p) => ({ id: p.id, x: p.x, y: p.y, to: shownToCrew(doc, p.to) ? { ...p.to } : null, name: labelOf(doc, p), shown: true })).filter((p) => p.name),
      ...(seen ? { fog: { c: seen, crew: null } } : {}),
    };
  });
}
