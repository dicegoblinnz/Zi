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
// A map: { id, name, key, w, h, of, shown, pins }
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
  if (!raw || typeof raw !== "object" || !isId(raw.id) || !isKey(raw.key)) return null;
  const name = one(raw.name, MMAX.name);
  const w = side(raw.w);
  const h = side(raw.h);
  if (!name || !w || !h) return null;
  const seen = new Set();
  const pins = (Array.isArray(raw.pins) ? raw.pins : []).map(pinOf).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, MMAX.pins);
  return { id: raw.id, name, key: raw.key, w, h, of: isId(raw.of) ? raw.of : "", shown: raw.shown === true, pins };
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
      if (!n || findMap(doc, n.id) || doc.maps.length >= MMAX.maps) return false;
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
      Object.assign(m, { key: op.key, w, h });
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

// Every picture the world's maps use, for the Worker's tidying.
export const keysOf = (doc) => new Set((doc.maps ?? []).map((m) => m.key));

// ------------------------------------------------------------ what the crew sees

// The maps as a player gets them: only the ones the crew's been shown, and on
// each only the pins she's shown, by the name the crew knows them by. A pin
// only says what it opens once the crew's been shown that too, and a map only
// says which place it's of once they've been shown the place.
export function mapsForPlayer(doc) {
  return (doc.maps ?? []).filter((m) => m.shown).map((m) => ({
    id: m.id, name: m.name, key: m.key, w: m.w, h: m.h,
    of: m.of && findPage(doc, m.of)?.shown.page ? m.of : "",
    shown: true,
    pins: m.pins.filter((p) => p.shown).map((p) => ({ id: p.id, x: p.x, y: p.y, to: shownToCrew(doc, p.to) ? { ...p.to } : null, name: labelOf(doc, p), shown: true })).filter((p) => p.name),
  }));
}
