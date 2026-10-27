// Maps in a campaign's world (stage 4 of notes/worlds-plan.md): the GM's own
// pictures, several to a world, with pins she drops that open pages. They're
// kept in the world beside the board and the pages (board.js keeps all three,
// and hands a map's changes here), so her phone and the Worker change them the
// same way, and mapsForPlayer() only ever hands a player what the crew's been
// shown.
//
// A map: { id, name, file, w, h, bytes, at, shown, pins }
//   file     its picture in the Worker's R2 bucket, in the campaign's own
//            folder (src/worker/maps.js). Only the Worker sets it, with w and h
//            (the picture's size in pixels), bytes and at, when the picture
//            goes up, so no change from a phone can point a map at anything else.
//   shown    whether the crew's been shown it
//   pins     [{ id, x, y, label, to, shown }]
//            x, y   where it sits, from 0 to 1 across and down the picture
//            label  its name on the map. Empty, it's the name of what it opens.
//            to     the page or faction it opens, { k: "p" or "f", id }, or null
//            shown  whether the crew's been shown it
//
// A change (its o starts with "m-"):
//   { o: "m-set", id, f: "name", v }    its name
//   { o: "m-show", id, v }              the crew's been shown it, or not
//   { o: "m-gone", id }                 a map out of the world, picture and all
//   { o: "m-pin", id, pin, at? }        a pin on it, or one moved or changed
//   { o: "m-unpin", id, pin }           a pin off it
//   { o: "m-pin-show", id, pin, v }     the crew's been shown a pin, or not
//
// A map only ever comes into the world with its picture, through the Worker
// (putMap()), so there's no change for that.

export const MMAX = { maps: 12, pins: 80, name: 60, label: 40, px: 4096 };
const ID = /^[a-z0-9-]{2,24}$/;
const FILE = /^[a-z0-9]{16,40}\.(jpg|png|webp)$/;

export const isMapOp = (op) => typeof op?.o === "string" && op.o.startsWith("m-");

// One line of words: no line breaks or control characters, no doubled spaces.
const line = (v, max) => String(typeof v === "string" || typeof v === "number" ? v : "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};
const isId = (v) => typeof v === "string" && ID.test(v);
// Where a pin sits, kept to four places, which is under a pixel on any
// picture the Worker takes.
const spot = (v) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(Math.min(1, Math.max(0, n)) * 10000) / 10000 : null;
};
const toOf = (v) => (v && typeof v === "object" && (v.k === "p" || v.k === "f") && isId(v.id) ? { k: v.k, id: v.id } : null);

export function pinOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const x = spot(raw.x);
  const y = spot(raw.y);
  if (x == null || y == null) return null;
  return { id: raw.id, x, y, label: line(raw.label, MMAX.label), to: toOf(raw.to), shown: raw.shown === true };
}

export function mapOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id) || typeof raw.file !== "string" || !FILE.test(raw.file)) return null;
  const w = whole(raw.w, 1, MMAX.px);
  const h = whole(raw.h, 1, MMAX.px);
  if (!w || !h) return null;
  const seen = new Set();
  return {
    id: raw.id,
    name: line(raw.name, MMAX.name) || "A map",
    file: raw.file,
    w,
    h,
    bytes: whole(raw.bytes, 0, 1e9) ?? 0,
    at: whole(raw.at, 0, Number.MAX_SAFE_INTEGER) ?? 0,
    shown: raw.shown === true,
    pins: (Array.isArray(raw.pins) ? raw.pins : []).map(pinOf).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, MMAX.pins),
  };
}

export function mapsOf(raw) {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : []).map(mapOf).filter((m) => m && !seen.has(m.id) && seen.add(m.id)).slice(0, MMAX.maps);
}

export const findMap = (doc, id) => doc.maps?.find((m) => m.id === id) ?? null;

// What a pin opens, as the world has it: a page or a faction, with its name,
// or null when it opens nothing or what it opened has gone.
export function targetOf(doc, to) {
  if (!to) return null;
  if (to.k === "p") {
    const page = doc.pages?.find((p) => p.id === to.id);
    return page ? { kind: "p", id: page.id, name: page.name, page } : null;
  }
  const f = doc.factions?.find((x) => x.id === to.id);
  return f ? { kind: "f", id: f.id, name: f.name, f } : null;
}
// Whether the crew can open what a pin opens.
export const openToCrew = (t) => Boolean(t && (t.kind === "f" ? t.f.shown?.card : t.page.shown?.page));
// A pin's name on the map: its own, or what it opens.
export const labelOf = (doc, pin) => pin.label || targetOf(doc, pin.to)?.name || "";

// Every pin that opens this page or faction ({ kind: "p" or "f", id }), with
// its map, for "On the map" on the page.
export function pinsTo(doc, target) {
  const out = [];
  for (const m of doc.maps ?? []) for (const pin of m.pins) if (pin.to && pin.to.k === target.kind && pin.to.id === target.id) out.push({ map: m, pin });
  return out;
}

// One change to a map. It says whether anything changed, comparing only the
// map it's on.
export function applyMap(doc, op) {
  doc.maps ??= [];
  const m = isId(op.id) ? findMap(doc, op.id) : null;
  if (!m) return false;
  const was = JSON.stringify(m);
  switch (op.o) {
    case "m-set": {
      if (op.f !== "name") return false;
      const v = line(op.v, MMAX.name);
      if (!v) return false;
      m.name = v;
      break;
    }
    case "m-show":
      m.shown = op.v === true;
      break;
    case "m-gone":
      doc.maps.splice(doc.maps.indexOf(m), 1);
      return true;
    case "m-pin": {
      const p = pinOf(op.pin);
      if (!p) return false;
      const old = m.pins.find((x) => x.id === p.id);
      // A pin that's there moves or changes, and keeps whether the crew's
      // been shown it. One that isn't goes on.
      if (old) Object.assign(old, { x: p.x, y: p.y, label: p.label, to: p.to });
      else {
        if (m.pins.length >= MMAX.pins) return false;
        const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= m.pins.length ? op.at : m.pins.length;
        m.pins.splice(at, 0, p);
      }
      break;
    }
    case "m-unpin": {
      const i = m.pins.findIndex((x) => x.id === op.pin);
      if (i < 0) return false;
      m.pins.splice(i, 1);
      break;
    }
    case "m-pin-show": {
      const p = m.pins.find((x) => x.id === op.pin);
      if (!p) return false;
      p.shown = op.v === true;
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(m) !== was;
}

// What puts a change back, worked out from the world before it's made. A map
// out of the world takes its picture with it, so that one can't be put back.
export function undoMap(doc, op) {
  const m = isId(op.id) ? findMap(doc, op.id) : null;
  if (!m) return [];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  switch (op.o) {
    case "m-set":
      return [{ o: "m-set", id: m.id, f: "name", v: m.name }];
    case "m-show":
      return [{ o: "m-show", id: m.id, v: m.shown }];
    case "m-pin": {
      const old = m.pins.find((x) => x.id === op.pin?.id);
      if (old) return [{ o: "m-pin", id: m.id, pin: copy(old) }];
      return op.pin?.id ? [{ o: "m-unpin", id: m.id, pin: op.pin.id }] : [];
    }
    case "m-unpin": {
      const old = m.pins.find((x) => x.id === op.pin);
      return old ? [{ o: "m-pin", id: m.id, pin: copy(old), at: m.pins.indexOf(old) }] : [];
    }
    case "m-pin-show": {
      const old = m.pins.find((x) => x.id === op.pin);
      return old ? [{ o: "m-pin-show", id: m.id, pin: old.id, v: old.shown }] : [];
    }
    default:
      return [];
  }
}

// A picture that's gone up, as a map in the world (the Worker's alone): a new
// map with its name, or a new picture for one that's there, keeping its name,
// its pins and what the crew's been shown. It says which picture it replaced,
// for the Worker to take away.
export function putMap(doc, { id, name, file, w, h, bytes, at }) {
  doc.maps ??= [];
  const n = mapOf({ id, name, file, w, h, bytes, at, shown: false, pins: [] });
  if (!n) return { ok: false };
  const m = findMap(doc, id);
  if (m) {
    const old = m.file === n.file ? null : m.file;
    Object.assign(m, { file: n.file, w: n.w, h: n.h, bytes: n.bytes, at: n.at });
    return { ok: true, added: false, old };
  }
  if (doc.maps.length >= MMAX.maps) return { ok: false, full: true };
  doc.maps.push(n);
  return { ok: true, added: true, old: null };
}

// The maps as a player gets them: only the ones the crew's been shown, and on
// each only the pins it's been shown. A pin's own name comes with it, and
// what it opens (and that name, when it hasn't got its own) only once the
// crew's been shown that too, so a player's phone never learns there's a page
// behind a pin, or its name, till it can open it.
export function mapsForPlayer(doc) {
  const pages = new Map((doc.pages ?? []).map((p) => [p.id, p]));
  const facs = new Map((doc.factions ?? []).map((f) => [f.id, f]));
  const target = (to) => {
    if (!to) return null;
    if (to.k === "p") return pages.has(to.id) ? { kind: "p", name: pages.get(to.id).name, page: pages.get(to.id) } : null;
    return facs.has(to.id) ? { kind: "f", name: facs.get(to.id).name, f: facs.get(to.id) } : null;
  };
  return (doc.maps ?? []).filter((m) => m.shown).map((m) => ({
    id: m.id,
    name: m.name,
    file: m.file,
    w: m.w,
    h: m.h,
    bytes: 0,
    at: m.at,
    shown: true,
    pins: m.pins.filter((p) => p.shown).map((p) => {
      const t = target(p.to);
      const open = openToCrew(t);
      return { id: p.id, x: p.x, y: p.y, label: p.label || (open ? t.name : ""), to: open ? p.to : null, shown: true };
    }),
  }));
}
