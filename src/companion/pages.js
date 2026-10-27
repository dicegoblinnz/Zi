// Places and people in a campaign's world (stage 3 of notes/worlds-plan.md):
// pages the GM writes or brings in from the book, linked to each other by
// name, each shown to the crew a part at a time. They're kept in the world
// beside the faction board (board.js keeps both, and hands a page's changes
// here), so her phone and the Worker change them the same way, and
// pagesForPlayer() only ever hands a player what the crew's been shown.
//
// A page: { id, kind, name, aka, line, ch, look, want, twist, here, ground,
//   stakes, clockD, clock, tags, rules, teles, hooks, elsewhere, voice,
//   secret, more, weak, note, shown, book }
//   kind     "place" or "person"
//   aka      other names it goes by, which link to it too, and the crew sees
//            them with it
//   line     what a place is, or who a person is
//   ch       its Challenge (0 for none). A place's comes with it, and a
//            person's comes with them as a threat.
//   look     what a place is like inside, or what you notice first about someone
//   want     what a person wants
//   twist    a place's complication
//   here, ground, stakes   a place's Who's here, The ground and Stakes,
//            each [{ id, text }]
//   clockD, clock   its scene clock: the die, and what happens when it runs out
//   tags     a person as a threat: [{ id, text, x, kind }], x its multiplier,
//            kind "comes", "keeps", "drives", "weak", "power" or ""
//   rules    anything else it does, like Forms
//   teles    its telegraphs: [{ id, text, d, at }], at being what it's aimed at
//   hooks    [{ id, text }]
//   elsewhere, voice, note   hers alone, like its telegraphs and hooks
//   secret, more, weak   its Secret (its hidden tag), the rest of it, and
//            whether it's the weak point
//   shown    what the crew's been shown: page (its name, what it is or who
//            they are, what it's like or what you notice first, and a place's
//            Challenge), then a place's here, ground, stakes, clock, twist and
//            secret, or a person's want, threat and secret
//   book     where it came from, if it's out of the book: { from, key, h, at,
//            was }, the same as a faction's
//
// A change (its o starts with "p-"):
//   { o: "p-new", p, at? }             a page in the world
//   { o: "p-gone", id }                a page out of it
//   { o: "p-set", id, f, v }           one of its words, ch, clockD, aka or weak
//   { o: "p-show", id, p, v }          the crew's been shown it (p "page"), or one part of it
//   { o: "p-add", id, l, item, at? }   a line on one of its lists
//   { o: "p-edit", id, l, lid, f, v }  one part of a line
//   { o: "p-drop", id, l, lid }        a line off it
//   { o: "p-book", id, card, h, at }   the book's version she's now seen

export const PMAX = { pages: 240, name: 60, aka: 4, line: 160, look: 1200, words: 240, rules: 900, elsewhere: 400, secret: 120, more: 1200, note: 1200, item: 400, list: 16, x: 9 };
export const KINDS = ["place", "person"];
export const SHOWN = { place: ["page", "here", "ground", "stakes", "clock", "twist", "secret"], person: ["page", "want", "threat", "secret"] };
const ALL_SHOWN = [...new Set([...SHOWN.place, ...SHOWN.person])];
export const PLISTS = { place: ["here", "ground", "stakes", "teles", "hooks"], person: ["tags", "teles", "hooks"] };
const ALL_LISTS = ["here", "ground", "stakes", "tags", "teles", "hooks"];
export const TAG_KINDS = ["comes", "keeps", "drives", "weak", "power", ""];
// Words that are one line, and words that can run to paragraphs.
const LINES = { name: PMAX.name, line: PMAX.line, want: PMAX.words, twist: PMAX.words, clock: PMAX.words, voice: PMAX.words, secret: PMAX.secret, elsewhere: PMAX.elsewhere };
const PARAS = { look: PMAX.look, rules: PMAX.rules, more: PMAX.more, note: PMAX.note };
const ID = /^[a-z0-9-]{2,24}$/;
const DICE = [2, 4, 6, 8, 10, 12];

export const isPageOp = (op) => typeof op?.o === "string" && op.o.startsWith("p-");

// One line of words: no line breaks or control characters, no doubled spaces.
// Words that are tidy already, as everything written through here is, and
// made only of letters that can't be written two ways, go straight through,
// so reading a big world back stays quick on the Worker.
const PLAIN = /^[\x20-\x7e\u00a0-\u024f\u2010-\u2026\u00d7]*$/;
const PLAIN_PARAS = /^[\n\x20-\x7e\u00a0-\u024f\u2010-\u2026\u00d7]*$/;
// Words are words, a number becomes its digits, and anything else is nothing.
const str = (v) => (typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "");
const one = (v, max) => {
  if (typeof v === "string" && v.length <= max && PLAIN.test(v) && !/\s\s|^\s|\s$/.test(v)) return v;
  return str(v).normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
};
// Words that keep their paragraphs: a line break stays, and no more than one
// blank line between paragraphs.
const paras = (v, max) => {
  if (typeof v === "string" && v.length <= max && PLAIN_PARAS.test(v) && !/\n\n\n| \n|\n | {2}|^\s|\s$/.test(v)) return v;
  return str(v).normalize("NFC").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
};
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const whole = (v, lo, hi, or) => {
  const n = num(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
const isId = (v) => typeof v === "string" && ID.test(v);
const dieOr = (v, or) => (DICE.includes(num(v)) ? num(v) : or);
const akaOf = (v) => [...new Set((Array.isArray(v) ? v : str(v).split(",")).map((x) => one(x, PMAX.name)).filter(Boolean))].slice(0, PMAX.aka);

// A line on one of a page's lists, tidied, or null if it can't go on.
function itemOf(l, x) {
  if (!x || typeof x !== "object" || !isId(x.id)) return null;
  const text = one(x.text, PMAX.item);
  if (!text) return null;
  if (l === "tags") return { id: x.id, text: one(x.text, PMAX.name), x: whole(x.x, 1, PMAX.x, 1), kind: TAG_KINDS.includes(x.kind) ? x.kind : "" };
  if (l === "teles") return { id: x.id, text, d: dieOr(x.d, 6), at: one(x.at, PMAX.name) };
  return { id: x.id, text };
}

// The words and lists every page has, empty where it's got none.
function wordsOf(raw, into) {
  for (const [k, max] of Object.entries(LINES)) into[k] = one(raw[k], max);
  for (const [k, max] of Object.entries(PARAS)) into[k] = paras(raw[k], max);
  into.aka = akaOf(raw.aka);
  into.ch = whole(raw.ch, 0, 6, 0);
  into.clockD = raw.clockD ? dieOr(raw.clockD, 0) : 0;
  into.weak = raw.weak === true;
  return into;
}

// The book's version of a page, as it was brought in: words and lists, no ids.
export function pageCardOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = wordsOf(raw, { key: one(raw.key, 80), kind: KINDS.includes(raw.kind) ? raw.kind : "place" });
  for (const l of ALL_LISTS) {
    c[l] = (Array.isArray(raw[l]) ? raw[l] : []).slice(0, PMAX.list).map((x) => itemOf(l, typeof x === "string" ? { id: "xx", text: x } : { ...x, id: "xx" })).filter(Boolean).map(({ id, ...rest }) => (l === "tags" || l === "teles" ? rest : rest.text));
  }
  return c;
}

function bookOf(b) {
  if (!b || typeof b !== "object") return null;
  const was = pageCardOf(b.was);
  return was ? { from: one(b.from, 40), key: one(b.key, 80), h: one(b.h, 20), at: whole(b.at, 0, Number.MAX_SAFE_INTEGER, 0), was } : null;
}

// A page as it came from somewhere else, tidied so nothing in it is anything
// but words and numbers in the right places.
export function pageOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id) || !KINDS.includes(raw.kind)) return null;
  const p = wordsOf(raw, { id: raw.id, kind: raw.kind });
  if (!p.name) return null;
  for (const l of ALL_LISTS) {
    const seen = new Set();
    p[l] = PLISTS[p.kind].includes(l) ? (Array.isArray(raw[l]) ? raw[l] : []).map((x) => itemOf(l, x)).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, PMAX.list) : [];
  }
  const s = raw.shown && typeof raw.shown === "object" ? raw.shown : {};
  p.shown = Object.fromEntries(ALL_SHOWN.map((k) => [k, SHOWN[p.kind].includes(k) && s[k] === true]));
  p.book = bookOf(raw.book);
  return p;
}

export function pagesOf(raw) {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : []).map(pageOf).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, PMAX.pages);
}

export const findPage = (doc, id) => doc.pages?.find((p) => p.id === id) ?? null;

// One change to a page. It says whether anything changed, comparing only the
// page it's on, so a big world stays quick on the Worker.
export function applyPage(doc, op) {
  doc.pages ??= [];
  const p = op.id ? findPage(doc, op.id) : null;
  const was = p ? JSON.stringify(p) : "";
  const list = p && PLISTS[p.kind].includes(op.l) ? p[op.l] : null;
  switch (op.o) {
    case "p-new": {
      const n = pageOf(op.p);
      if (!n || findPage(doc, n.id) || doc.pages.length >= PMAX.pages) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= doc.pages.length ? op.at : doc.pages.length;
      doc.pages.splice(at, 0, n);
      return true;
    }
    case "p-gone":
      if (!p) return false;
      doc.pages.splice(doc.pages.indexOf(p), 1);
      return true;
    case "p-set": {
      if (!p || typeof op.f !== "string") return false;
      if (Object.hasOwn(LINES, op.f)) {
        const v = one(op.v, LINES[op.f]);
        if (op.f === "name" && !v) return false;
        p[op.f] = v;
      } else if (Object.hasOwn(PARAS, op.f)) p[op.f] = paras(op.v, PARAS[op.f]);
      else if (op.f === "aka") p.aka = akaOf(op.v);
      else if (op.f === "ch") p.ch = whole(op.v, 0, 6, p.ch);
      else if (op.f === "clockD") p.clockD = op.v ? dieOr(op.v, p.clockD) : 0;
      else if (op.f === "weak") p.weak = op.v === true;
      else return false;
      break;
    }
    case "p-show":
      if (!p || !SHOWN[p.kind].includes(op.p)) return false;
      p.shown[op.p] = op.v === true;
      break;
    case "p-add": {
      const it = list ? itemOf(op.l, op.item) : null;
      if (!it || list.some((x) => x.id === it.id) || list.length >= PMAX.list) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= list.length ? op.at : list.length;
      list.splice(at, 0, it);
      break;
    }
    case "p-edit": {
      const it = list?.find((x) => x.id === op.lid);
      if (!it || typeof op.f !== "string" || op.f === "id" || !Object.hasOwn(it, op.f)) return false;
      if ((op.f === "d" && !DICE.includes(Number(op.v))) || (op.f === "x" && whole(op.v, 1, PMAX.x, 0) === 0) || (op.f === "kind" && !TAG_KINDS.includes(op.v))) return false;
      const next = itemOf(op.l, { ...it, [op.f]: op.v });
      if (!next) return false;
      Object.assign(it, next);
      break;
    }
    case "p-drop": {
      const it = list?.find((x) => x.id === op.lid);
      if (!it) return false;
      list.splice(list.indexOf(it), 1);
      break;
    }
    case "p-book": {
      const card = pageCardOf(op.card);
      if (!p?.book || !card) return false;
      p.book = { ...p.book, h: one(op.h, 20), at: whole(op.at, 0, Number.MAX_SAFE_INTEGER, p.book.at), was: card };
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(p) !== was;
}

// What puts a change back, worked out from the world before it's made.
export function undoPage(doc, op) {
  const p = op.id ? findPage(doc, op.id) : null;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const it = p && Array.isArray(p[op.l]) ? p[op.l].find((x) => x.id === (op.lid ?? op.item?.id)) : null;
  switch (op.o) {
    case "p-new":
      return op.p?.id ? [{ o: "p-gone", id: op.p.id }] : [];
    case "p-gone":
      return p ? [{ o: "p-new", p: copy(p), at: doc.pages.indexOf(p) }] : [];
    case "p-set":
      return p ? [{ o: "p-set", id: p.id, f: op.f, v: op.f === "aka" ? [...p.aka] : p[op.f] }] : [];
    case "p-show":
      return p ? [{ o: "p-show", id: p.id, p: op.p, v: p.shown[op.p] === true }] : [];
    case "p-add":
      return op.item?.id ? [{ o: "p-drop", id: op.id, l: op.l, lid: op.item.id }] : [];
    case "p-drop":
      return it ? [{ o: "p-add", id: p.id, l: op.l, item: copy(it), at: p[op.l].indexOf(it) }] : [];
    case "p-edit":
      return it ? [{ o: "p-edit", id: p.id, l: op.l, lid: it.id, f: op.f, v: it[op.f] }] : [];
    case "p-book":
      return p?.book ? [{ o: "p-book", id: p.id, card: copy(p.book.was), h: p.book.h, at: p.book.at }] : [];
    default:
      return [];
  }
}

// ------------------------------------------------------------ what the crew sees

// The pages as a player gets them: only the ones the crew's been shown, and
// only the parts of each it's been shown. Her telegraphs, hooks, notes, voice
// and Elsewhere never leave the Worker, and nor does a part she hasn't shown.
export function pagesForPlayer(doc) {
  return (doc.pages ?? []).filter((p) => p.shown.page).map((p) => {
    const s = p.shown;
    const place = p.kind === "place";
    return {
      id: p.id, kind: p.kind, name: p.name, aka: p.aka, line: p.line,
      ch: place || s.threat ? p.ch : 0,
      look: p.look,
      want: s.want ? p.want : "",
      twist: s.twist ? p.twist : "",
      here: s.here ? p.here : [],
      ground: s.ground ? p.ground : [],
      stakes: s.stakes ? p.stakes : [],
      clockD: s.clock ? p.clockD : 0,
      clock: s.clock ? p.clock : "",
      tags: s.threat ? p.tags : [],
      rules: s.threat ? p.rules : "",
      teles: [], hooks: [], elsewhere: "", voice: "", note: "",
      secret: s.secret ? p.secret : "",
      more: s.secret ? p.more : "",
      weak: s.secret ? p.weak : false,
      shown: { ...s },
      book: null,
    };
  });
}

// ------------------------------------------------------------ names link themselves

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "The Copper Baths" in the middle of a sentence is "the Copper Baths", and
// "A priest of the Order" is "a priest of the Order".
const keyName = (s) => s.replace(/^(the|an|a) /i, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()).replace(/’/g, "'");
const pattern = (n) => (/^(The|An|A) /.test(n) ? `[${n[0]}${n[0].toLowerCase()}]${reEsc(n.slice(1))}` : reEsc(n)).replace(/'/g, "['’]");

// Every faction's and page's name, and the other names a page goes by, so any
// of them written on another page links to it. A name that starts with The
// links without it too, when what's left is two words or more ("Harbour
// Guild"). Longer names win where two could start at the same word.
export function linker(doc, hrefOf) {
  const by = new Map();
  const put = (name, entry) => {
    const n = String(name ?? "").trim();
    if (n.length < 3) return;
    const k = keyName(n);
    if (!by.has(k)) by.set(k, entry);
    const rest = n.match(/^The (\S+(?: \S+)+)$/)?.[1];
    if (rest && !by.has(keyName(rest))) by.set(keyName(rest), entry);
  };
  for (const f of doc.factions ?? []) put(f.name, { kind: "f", id: f.id, name: f.name });
  for (const p of doc.pages ?? []) {
    const entry = { kind: "p", id: p.id, name: p.name, page: p };
    put(p.name, entry);
    for (const a of p.aka ?? []) put(a, entry);
  }
  const names = [...by.keys()].sort((a, b) => b.length - a.length);
  // The name and what's just before it (the start, or anything but a letter
  // or digit), since older phones can't look behind.
  const re = names.length ? new RegExp(`(^|[^\\p{L}\\p{N}])(${names.map(pattern).join("|")})(?![\\p{L}\\p{N}])`, "gu") : null;
  const at = (m) => by.get(keyName(m)) ?? null;

  // Words with their links: each name linked the first time it's in them,
  // never to the page they're on, and *italics* kept.
  function rich(text, self = "") {
    const used = new Set([self]);
    return String(text ?? "").split(/(\*[^*\n]+\*)/g).map((seg, i) => {
      const em = i % 2 === 1;
      const s = em ? seg.slice(1, -1) : seg;
      let out = "";
      let last = 0;
      if (re) {
        for (const m of s.matchAll(re)) {
          const e = at(m[2]);
          if (!e || used.has(e.id)) continue;
          used.add(e.id);
          const start = m.index + m[1].length;
          out += `${esc(s.slice(last, start))}<a class="wl" href="${esc(hrefOf(e))}" data-act="w" data-do="nav">${esc(m[2])}</a>`;
          last = start + m[2].length;
        }
      }
      out += esc(s.slice(last));
      return em ? `<em>${out}</em>` : out;
    }).join("");
  }
  // Paragraphs, each with its links.
  const block = (text, self = "") => String(text ?? "").split(/\n\s*\n/).filter((x) => x.trim()).map((x) => `<p>${x.split("\n").map((l) => rich(l, self)).join("<br>")}</p>`).join("");
  return { rich, block, at, has: (id) => [...by.values()].some((e) => e.id === id) };
}

// Everything that's written on a faction or a page, for finding who mentions whom.
export function textOf(x) {
  if (x.kind) return [x.line, x.look, x.want, x.twist, x.clock, x.rules, x.elsewhere, x.voice, x.secret, x.more, x.note, ...ALL_LISTS.flatMap((l) => (x[l] ?? []).map((i) => `${i.text} ${i.at ?? ""}`))].join("\n");
  return [x.about, x.want, x.face, x.secret, x.more, x.note, ...(x.agendas ?? []).map((a) => `${a.text} ${a.then ?? ""}`), ...["pub", "mor", "loy", "threads"].flatMap((l) => (x[l] ?? []).map((t) => t.text))].join("\n");
}

// The factions and pages that mention this one by any of its names.
export function mentionsOf(doc, target) {
  const names = [target.name, ...(target.aka ?? [])].map((n) => String(n ?? "").trim()).filter((n) => n.length >= 3);
  for (const n of [...names]) {
    const rest = n.match(/^The (\S+(?: \S+)+)$/)?.[1];
    if (rest) names.push(rest);
  }
  if (!names.length) return [];
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${names.map((n) => pattern(keyName(n))).join("|")})(?![\\p{L}\\p{N}])`, "u");
  const out = [];
  for (const f of doc.factions ?? []) if (f.id !== target.id && re.test(textOf(f))) out.push({ kind: "f", id: f.id, name: f.name });
  for (const p of doc.pages ?? []) if (p.id !== target.id && re.test(textOf(p))) out.push({ kind: "p", id: p.id, name: p.name, page: p });
  return out;
}
