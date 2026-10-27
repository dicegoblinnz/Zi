// Places and people, the pages of a campaign's world (stage 3 of
// notes/worlds-plan.md). They're kept in the world with the faction board, so
// the Worker keeps them (src/worker/world.js), only the campaign's GM changes
// them, and the phone and the Worker both change them with apply() in
// board.js, which hands page changes to applyPage() here.
//
// A page: { id, kind, name, about, text, want, comp, c, secret, more, note,
//   hooks, aka, threat, scene, shown, book }
//   kind      "place" or "person"
//   about     what it is or who they are, in a line
//   text      what the crew sees, a few plain sentences, a line to a paragraph
//   want      what a person wants
//   comp      a place's complication, and c its Challenge, both only ever hers
//   secret    its Secret's tag, and more, the rest of it
//   note      her own part, never shown to the crew
//   hooks     [{ id, text }]  trouble that brings the crew in, hers
//   aka       what else it's called, so those names link too
//   threat    a person written as a threat: { c, tags, tele, voice, forms }
//             tags [{ id, text, x, part, note }]  part is comes, keeps, drives
//             or weak (Appendix B's kinds), or "" for one it doesn't sort,
//             x its multiplier and note a word like "first" or "weak point".
//             tele [{ id, text }], its voice and its Forms are only ever hers.
//   scene     the place in Twenty Places it came from, for the live table
//   shown     what the crew's been shown: page (its name, what it is, what the
//             crew sees and what a person wants), then threat and secret
//   book      where it came from, if it's out of the book: { from, key, h, at, was }
//
// Links are [a, b] pairs: two pages, or a page and a faction, both ways.
//
// A change is one of these:
//   { o: "page", p, at? }             a page in the world
//   { o: "unpage", id }               a page out of it, with its links
//   { o: "pset", id, f, v }           one of its words, its Challenge (c) or what else it's called (aka)
//   { o: "pshow", id, p, v }          the crew's been shown it (p "page"), or its threat or Secret
//   { o: "padd", id, l, item, at? }   a hook, or a tag or telegraph on its threat
//   { o: "pedit", id, l, lid, f, v }  one part of one
//   { o: "pdrop", id, l, lid }        one off it
//   { o: "threat", id, t }            a person's threat whole, or t null for none
//   { o: "tset", id, f, v }           its threat's Challenge (c), voice or Forms
//   { o: "link", a, b }               two linked
//   { o: "unlink", a, b }             and not
//   { o: "pbook", id, card, h, at }   the book's page she's now seen

export const PMAX = { name: 60, line: 120, words: 240, text: 1500, more: 1200, note: 2400, forms: 600, pages: 150, hooks: 8, aka: 4, tags: 12, tag: 60, tele: 8, tele1: 300, links: 600 };
export const KINDS = ["place", "person"];
export const PSHOWS = ["page", "threat", "secret"];
export const TAG_PARTS = ["comes", "keeps", "drives", "weak", ""];
export const PAGE_OPS = new Set(["page", "unpage", "pset", "pshow", "padd", "pedit", "pdrop", "threat", "tset", "link", "unlink", "pbook"]);
const LINES = { name: PMAX.name, about: PMAX.line, want: PMAX.words, comp: PMAX.line, secret: PMAX.line };
const PARAS = { text: PMAX.text, more: PMAX.more, note: PMAX.note };
const ID = /^[a-z0-9-]{2,24}$/;
const isId = (v) => ID.test(String(v ?? ""));

// One line of words: no line breaks or control characters, no doubled spaces.
const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// Words a line to a paragraph: each line tidied, and blank ones gone.
const para = (v, max) => String(v ?? "").normalize("NFC").replace(/\r\n?/g, "\n").split("\n").map((l) => line(l, max)).filter(Boolean).join("\n").slice(0, max);
const whole = (v, lo, hi, or) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
const copy = (x) => JSON.parse(JSON.stringify(x));

// A hook, a tag or a telegraph, tidied, or null if it can't go on.
function itemOf(l, x) {
  if (!x || typeof x !== "object" || !isId(x.id)) return null;
  if (l === "tags") {
    const text = line(x.text, PMAX.tag);
    return text ? { id: x.id, text, x: whole(x.x, 1, 9, 1), part: TAG_PARTS.includes(x.part) ? x.part : "", note: line(x.note, 40) } : null;
  }
  const text = line(x.text, l === "tele" ? PMAX.tele1 : PMAX.words);
  return text ? { id: x.id, text } : null;
}
const MAXES = { hooks: PMAX.hooks, tags: PMAX.tags, tele: PMAX.tele };
function listOf(l, raw) {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : []).map((x) => itemOf(l, x)).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, MAXES[l]);
}
function akaOf(raw, name) {
  const out = [];
  for (const a of Array.isArray(raw) ? raw : []) {
    const v = line(a, PMAX.name);
    if (v && v !== name && !out.includes(v)) out.push(v);
  }
  return out.slice(0, PMAX.aka);
}

export function threatOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  return { c: whole(raw.c, 1, 6, 1), tags: listOf("tags", raw.tags), tele: listOf("tele", raw.tele), voice: line(raw.voice, PMAX.words), forms: para(raw.forms, PMAX.forms) };
}

// A page as the book has it, the way it was brought in: words, no ids.
export function bookPageOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = { key: line(raw.key, 80) };
  for (const [k, max] of Object.entries(LINES)) c[k] = line(raw[k], max);
  for (const [k, max] of Object.entries(PARAS)) c[k] = para(raw[k], max);
  c.c = whole(raw.c, 1, 6, 0);
  c.hooks = (Array.isArray(raw.hooks) ? raw.hooks : []).map((h) => line(typeof h === "string" ? h : h?.text, PMAX.words)).filter(Boolean).slice(0, PMAX.hooks);
  c.aka = akaOf(raw.aka, c.name);
  // Its threat, as words and numbers, every tag and telegraph kept in order.
  const t = raw.threat && typeof raw.threat === "object" ? raw.threat : null;
  c.threat = t
    ? {
        c: whole(t.c, 1, 6, 1),
        tags: (Array.isArray(t.tags) ? t.tags : []).slice(0, PMAX.tags).map((g) => itemOf("tags", { ...g, id: "xx" })).filter(Boolean).map(({ id, ...g }) => g),
        tele: (Array.isArray(t.tele) ? t.tele : []).slice(0, PMAX.tele).map((x) => line(typeof x === "string" ? x : x?.text, PMAX.tele1)).filter(Boolean),
        voice: line(t.voice, PMAX.words),
        forms: para(t.forms, PMAX.forms),
      }
    : null;
  return c;
}
function bookOf(b) {
  if (!b || typeof b !== "object") return null;
  const was = bookPageOf(b.was);
  return was ? { from: line(b.from, 40), key: line(b.key, 80), h: line(b.h, 20), at: whole(b.at, 0, Number.MAX_SAFE_INTEGER, 0), was } : null;
}

// A page as it came from somewhere else, tidied so nothing in it is anything
// but words and numbers in the right places.
export function pageOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const p = { id: raw.id, kind: KINDS.includes(raw.kind) ? raw.kind : "person" };
  for (const [k, max] of Object.entries(LINES)) p[k] = line(raw[k], max);
  if (!p.name) return null;
  for (const [k, max] of Object.entries(PARAS)) p[k] = para(raw[k], max);
  p.c = p.kind === "place" ? whole(raw.c, 1, 6, 0) : 0;
  p.hooks = listOf("hooks", raw.hooks);
  p.aka = akaOf(raw.aka, p.name);
  p.threat = p.kind === "person" ? threatOf(raw.threat) : null;
  p.scene = p.kind === "place" && /^s-place-[a-z-]{1,40}$/.test(String(raw.scene ?? "")) ? raw.scene : null;
  const s = raw.shown && typeof raw.shown === "object" ? raw.shown : {};
  p.shown = Object.fromEntries(PSHOWS.map((k) => [k, s[k] === true]));
  p.book = bookOf(raw.book);
  return p;
}

// Every page in a world, and its links, tidied. A link needs both its ends
// in this world.
export function pagesOf(raw, factions = []) {
  const seen = new Set(factions.map((f) => f.id));
  const pages = (Array.isArray(raw?.pages) ? raw.pages : []).map(pageOf).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, PMAX.pages);
  return { pages, links: linksOf(raw?.links, seen) };
}
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
function linksOf(raw, ids) {
  const keys = new Set();
  const out = [];
  for (const l of Array.isArray(raw) ? raw : []) {
    if (!Array.isArray(l) || l.length !== 2) continue;
    const [a, b] = l.map(String);
    if (a === b || !ids.has(a) || !ids.has(b) || keys.has(pairKey(a, b))) continue;
    keys.add(pairKey(a, b));
    out.push(a < b ? [a, b] : [b, a]);
    if (out.length >= PMAX.links) break;
  }
  return out;
}

export const findPage = (doc, id) => doc.pages.find((p) => p.id === id) ?? null;
const exists = (doc, id) => Boolean(findPage(doc, id) || doc.factions.some((f) => f.id === id));
export const linked = (doc, a, b) => doc.links.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
// Everything linked to one page or faction.
export const linksTo = (doc, id) => doc.links.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));

const LIST_OF = (p, l) => (l === "hooks" ? p.hooks : p.threat && (l === "tags" || l === "tele") ? p.threat[l] : null);
const ITEM_FIELDS = { hooks: ["text"], tags: ["text", "x", "part", "note"], tele: ["text"] };

// One page change, made to doc. It says whether anything changed.
export function applyPage(doc, op) {
  if (!op || typeof op !== "object") return false;
  const was = JSON.stringify(doc);
  const p = op.id ? findPage(doc, op.id) : null;
  switch (op.o) {
    case "page": {
      const n = pageOf(op.p);
      if (!n || exists(doc, n.id) || doc.pages.length >= PMAX.pages) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= doc.pages.length ? op.at : doc.pages.length;
      doc.pages.splice(at, 0, n);
      break;
    }
    case "unpage": {
      if (!p) return false;
      doc.pages = doc.pages.filter((x) => x !== p);
      doc.links = doc.links.filter(([a, b]) => a !== p.id && b !== p.id);
      break;
    }
    case "pset": {
      if (!p) return false;
      if (op.f === "c") {
        if (p.kind !== "place") return false;
        p.c = whole(op.v, 0, 6, p.c);
        break;
      }
      if (op.f === "aka") {
        p.aka = akaOf(op.v, p.name);
        break;
      }
      if (Object.hasOwn(LINES, op.f)) {
        const v = line(op.v, LINES[op.f]);
        if (op.f === "name" && !v) return false;
        p[op.f] = v;
        if (op.f === "name") p.aka = p.aka.filter((a) => a !== v);
        break;
      }
      if (!Object.hasOwn(PARAS, op.f)) return false;
      p[op.f] = para(op.v, PARAS[op.f]);
      break;
    }
    case "pshow": {
      if (!p || !PSHOWS.includes(op.p)) return false;
      p.shown[op.p] = op.v === true;
      break;
    }
    case "padd": {
      const list = p ? LIST_OF(p, op.l) : null;
      const item = list ? itemOf(op.l, op.item) : null;
      if (!item || list.some((x) => x.id === item.id) || list.length >= MAXES[op.l]) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at < list.length ? op.at : list.length;
      list.splice(at, 0, item);
      break;
    }
    case "pedit": {
      const list = p ? LIST_OF(p, op.l) : null;
      const item = list?.find((x) => x.id === op.lid);
      if (!item || !ITEM_FIELDS[op.l].includes(op.f)) return false;
      const next = itemOf(op.l, { ...item, [op.f]: op.v });
      if (!next) return false;
      Object.assign(item, next);
      break;
    }
    case "pdrop": {
      const list = p ? LIST_OF(p, op.l) : null;
      if (!list) return false;
      const keep = list.filter((x) => x.id !== op.lid);
      if (op.l === "hooks") p.hooks = keep;
      else p.threat[op.l] = keep;
      break;
    }
    case "threat": {
      if (!p || p.kind !== "person") return false;
      p.threat = op.t == null ? null : threatOf(op.t);
      break;
    }
    case "tset": {
      if (!p?.threat) return false;
      if (op.f === "c") p.threat.c = whole(op.v, 1, 6, p.threat.c);
      else if (op.f === "voice") p.threat.voice = line(op.v, PMAX.words);
      else if (op.f === "forms") p.threat.forms = para(op.v, PMAX.forms);
      else return false;
      break;
    }
    case "link": {
      const a = String(op.a ?? "");
      const b = String(op.b ?? "");
      if (a === b || !exists(doc, a) || !exists(doc, b) || linked(doc, a, b) || doc.links.length >= PMAX.links) return false;
      doc.links.push(a < b ? [a, b] : [b, a]);
      break;
    }
    case "unlink": {
      doc.links = doc.links.filter(([x, y]) => pairKey(x, y) !== pairKey(String(op.a ?? ""), String(op.b ?? "")));
      break;
    }
    case "pbook": {
      const card = bookPageOf(op.card);
      if (!p?.book || !card) return false;
      p.book = { ...p.book, h: line(op.h, 20), at: whole(op.at, 0, Number.MAX_SAFE_INTEGER, p.book.at), was: card };
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(doc) !== was;
}

// What puts a page change back, worked out from the world before it's made.
export function undoPage(doc, op) {
  const p = op.id ? findPage(doc, op.id) : null;
  const list = p && op.l ? LIST_OF(p, op.l) : null;
  const item = list?.find((x) => x.id === (op.lid ?? op.item?.id)) ?? null;
  switch (op.o) {
    case "page":
      return op.p?.id ? [{ o: "unpage", id: op.p.id }] : [];
    case "unpage":
      return p ? [{ o: "page", p: copy(p), at: doc.pages.indexOf(p) }, ...linksTo(doc, p.id).map((b) => ({ o: "link", a: p.id, b }))] : [];
    case "pset":
      if (!p) return [];
      return [{ o: "pset", id: p.id, f: op.f, v: op.f === "aka" ? [...p.aka] : p[op.f] }];
    case "pshow":
      return p ? [{ o: "pshow", id: p.id, p: op.p, v: p.shown[op.p] === true }] : [];
    case "padd":
      return op.item?.id ? [{ o: "pdrop", id: op.id, l: op.l, lid: op.item.id }] : [];
    case "pdrop":
      return item ? [{ o: "padd", id: p.id, l: op.l, item: copy(item), at: list.indexOf(item) }] : [];
    case "pedit":
      return item ? [{ o: "pedit", id: p.id, l: op.l, lid: item.id, f: op.f, v: item[op.f] }] : [];
    case "threat":
      return p ? [{ o: "threat", id: p.id, t: p.threat ? copy(p.threat) : null }] : [];
    case "tset":
      return p?.threat ? [{ o: "tset", id: p.id, f: op.f, v: p.threat[op.f] }] : [];
    case "link":
      return linked(doc, op.a, op.b) ? [] : [{ o: "unlink", a: op.a, b: op.b }];
    case "unlink":
      return linked(doc, op.a, op.b) ? [{ o: "link", a: op.a, b: op.b }] : [];
    case "pbook":
      return p?.book ? [{ o: "pbook", id: p.id, card: copy(p.book.was), h: p.book.h, at: p.book.at }] : [];
    default:
      return [];
  }
}

// ------------------------------------------------------------ what the crew sees

// The pages as a player gets them: only the ones the crew's been shown, and
// only what's been shown of each. Her part (her note, hooks, a place's
// complication and Challenge, a threat's telegraphs, voice and Forms) never
// leaves the Worker. A link goes to a player only when both its ends have
// been shown to the crew: two pages, or a page and a faction.
export function pagesForPlayer(doc, seenFactions) {
  const shown = doc.pages.filter((p) => p.shown.page);
  const ids = new Set([...shown.map((p) => p.id), ...seenFactions]);
  return {
    pages: shown.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      about: p.about,
      text: p.text,
      want: p.want,
      comp: "",
      c: 0,
      secret: p.shown.secret ? p.secret : "",
      more: p.shown.secret ? p.more : "",
      note: "",
      hooks: [],
      aka: p.aka,
      threat: p.shown.threat && p.threat ? { c: p.threat.c, tags: p.threat.tags, tele: [], voice: "", forms: "" } : null,
      scene: null,
      shown: { ...p.shown },
      book: null,
    })),
    links: doc.links.filter(([a, b]) => ids.has(a) && ids.has(b)),
  };
}

// ------------------------------------------------------------ names that link

// Every name a page or a faction goes by, for linking: its name and what
// else it's called. A name two of them share links to neither. "The" at the
// start of one counts either way, so "the Copper Baths" is the Copper Baths.
export function namesOf(doc) {
  const by = new Map();
  const add = (name, to) => {
    const k = String(name ?? "").replace(/^the\s+/i, "the ").trim();
    if (k.length < 2) return;
    const had = by.get(k);
    if (had === undefined) by.set(k, to);
    else if (had !== to) by.set(k, null);
  };
  for (const f of doc.factions) add(f.name, f.id);
  for (const p of doc.pages) for (const n of [p.name, ...p.aka]) add(n, p.id);
  return [...by.entries()].filter(([, to]) => to).map(([name, to]) => ({ name, to })).sort((x, y) => y.name.length - x.name.length);
}
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A pattern for every name, longest first, whole words only. What comes
// before a name is caught rather than looked behind at, since older phones
// can't look behind.
export function namePattern(names) {
  if (!names.length) return null;
  const alts = names.map(({ name }) => (/^the /.test(name) ? `[Tt]he ${escRe(name.slice(4))}` : escRe(name)));
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${alts.join("|")})(?![\\p{L}\\p{N}])`, "gu");
}
// Where each name is in some words: [{ at, end, to }].
export function mentionsIn(text, names, re) {
  if (!re || !text) return [];
  const out = [];
  const key = new Map(names.map((n) => [n.name, n.to]));
  re.lastIndex = 0;
  for (const m of String(text).matchAll(re)) {
    const to = key.get(m[2].replace(/^the\s+/i, "the "));
    const at = m.index + m[1].length;
    if (to) out.push({ at, end: at + m[2].length, to });
  }
  return out;
}
// Every page and faction one page's words name, and every one whose words
// name it, from whatever of the world this phone has.
export function mentionsOf(doc, id, names, re) {
  const page = findPage(doc, id);
  const faction = doc.factions.find((f) => f.id === id) ?? null;
  const textOf = (x) => (x.kind ? [x.about, x.text, x.want, x.comp, x.secret, x.more, x.note, ...x.hooks.map((h) => h.text), ...(x.threat?.tele ?? []).map((t) => t.text), x.threat?.voice ?? ""] : [x.about, x.want, x.face, x.secret, x.more, x.note]).join("\n");
  const out = new Set();
  if (page || faction) for (const m of mentionsIn(textOf(page ?? faction), names, re)) if (m.to !== id) out.add(m.to);
  const mine = names.filter((n) => n.to === id);
  const re2 = namePattern(mine);
  if (re2) for (const x of [...doc.pages, ...doc.factions]) if (x.id !== id && mentionsIn(textOf(x), mine, re2).length) out.add(x.id);
  return out;
}
