// The faction board, one for each campaign (stage 1 of notes/worlds-plan.md):
// every faction's card the way What a Faction Is lays it out, and what the
// crew's been shown of each. The Worker keeps it (src/worker/world.js) and only
// the campaign's GM changes it, a piece at a time. The phone and the Worker
// both change it with apply(), so a change looks the same on her phone the
// moment it's made as it does once the Worker's got it.
//
// A card: { id, name, about, want, face, secret, more, note, mini, parent,
//   outs, res, assets, agendas, pub, mor, loy, threads, shown, book }
//   about     what it is, in a line, like "A merchant guild. It works through money."
//   secret    its Secret's tag, and more, the rest of it
//   note      the GM's own, never shown to the crew
//   mini      a mini faction, made by parent (another faction's id, or "crew"),
//             with outs, the two outcomes it can do
//   res       [{ id, text, x, left }]  x is its multiplier, left the ticks it's got
//   assets    [{ id, text, does, power, x, left, off }]  off: nothing's paying for it
//   agendas   [{ id, text, die, done, then }]  two at most, then is what the book adds
//   pub, mor, loy   its bonds (Public Sentiment, Morale, Loyalty): [{ id, text, kind, s }]
//   threads   toward the crew or another faction: [{ id, text, kind, s, to }]
//   shown     what the crew's been shown: card (its name, what it is, Want and
//             Face), then power, res, assets, agenda, bonds, threads and secret
//   book      where it came from, if it's out of the book: { from, key, h, at, was },
//             was being the book's card as it was brought in, h its hash and at
//             when the build that had it was made
//
// A change is one of these:
//   { o: "new", f, at?, kids? }        a faction on the board (kids: mini factions it made, back to it)
//   { o: "gone", id }                  a faction off it (its mini factions stay, on their own)
//   { o: "mini", id, f, res, asset }   a mini faction made by id, which hands over a resource and an asset
//   { o: "set", id, f, v }             one of its words: name, about, want, face, secret, more, note, or outs
//   { o: "show", id, p, v }            the crew's been shown it (p "card"), or one part of it
//   { o: "add", id, l, item, at? }     a line on one of its lists
//   { o: "edit", id, l, lid, f, v }    one part of a line
//   { o: "drop", id, l, lid }          a line off it
//   { o: "tick", id, l, lid, by }      a win ticks one off (by 1, and the last takes it off), or one comes back
//   { o: "climb", id, lid, by }        an agenda up or down one: past d12 it's happened
//   { o: "die", id, lid, v, done? }    an agenda set straight to a size
//   { o: "move", id, l, lid, to, at? } a resource or an asset goes to another faction
//   { o: "book", id, card, h, at }     the book's card she's now seen (with her pick made in changes before it)
//
// A board out of the book comes in as one "new" for each card, so it's undone
// the same way.

export const MAX = { name: 60, line: 120, words: 240, note: 600, factions: 48, list: 16, agendas: 2, minis: 3, x: 9 };
export const PARTS = ["power", "res", "assets", "agenda", "bonds", "threads", "secret"];
export const SHOWS = ["card", ...PARTS];
export const BONDS = [["pub", "Public Sentiment"], ["mor", "Morale"], ["loy", "Loyalty"]];
export const LISTS = ["res", "assets", "agendas", "pub", "mor", "loy", "threads"];
export const OUTCOMES = ["Destroy", "Undermine", "Obstruct", "Influence", "Acquire", "Establish"];
export const STATES = ["whole", "strained", "snapped"];
const WORDS = { name: MAX.name, about: MAX.line, want: MAX.words, face: MAX.words, secret: MAX.line, more: MAX.words, note: MAX.note };
const FIELDS = { res: ["text", "x"], assets: ["text", "does", "power", "x", "off"], agendas: ["text", "then"], pub: ["text", "kind", "s"], mor: ["text", "kind", "s"], loy: ["text", "kind", "s"], threads: ["text", "kind", "s", "to"] };
const ID = /^[a-z0-9-]{2,24}$/;

// One line of words: no line breaks or control characters, no doubled spaces.
export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi, or) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
// A die that climbs: d2 to d12.
const size = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 2 && n <= 12 && n % 2 === 0 ? n : null;
};
const isId = (v) => ID.test(String(v ?? ""));

export function blank() {
  return { factions: [], by: null, at: 0 };
}

// A line on one of a card's lists, tidied, or null if it can't go on.
function itemOf(l, x) {
  if (!x || typeof x !== "object" || !isId(x.id)) return null;
  const id = x.id;
  const text = line(x.text, l === "res" || l === "assets" ? MAX.name : MAX.line);
  if (!text) return null;
  if (l === "res" || l === "assets") {
    const times = whole(x.x, 1, MAX.x, 1);
    const out = { id, text, x: times, left: whole(x.left, 1, times, times) };
    if (l === "assets") Object.assign(out, { does: line(x.does, MAX.words), power: x.power === true, off: x.off === true });
    return out;
  }
  if (l === "agendas") {
    const die = size(x.die) ?? 2;
    return { id, text, die, done: x.done === true && die === 12, then: line(x.then, MAX.words) };
  }
  const t = { id, text, kind: x.kind === "hostile" ? "hostile" : "bond", s: STATES.includes(x.s) ? x.s : "whole" };
  if (l === "threads") t.to = x.to === "crew" || isId(x.to) ? x.to : "crew";
  return t;
}

// A card from the book, as it was brought in: words and lines, no ids.
export function cardOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = { key: line(raw.key, 60) };
  for (const [k, max] of Object.entries(WORDS)) c[k] = line(raw[k], max);
  const list = (l, keep) => (Array.isArray(raw[l]) ? raw[l] : []).slice(0, MAX.list).map((x) => itemOf(l, { ...x, id: "xx" })).filter(Boolean).map((x) => keep(x));
  c.res = list("res", (x) => ({ text: x.text, x: x.x }));
  c.assets = list("assets", (x) => ({ text: x.text, does: x.does, power: x.power, x: x.x }));
  c.agendas = list("agendas", (x) => ({ text: x.text, die: x.die, then: x.then })).slice(0, MAX.agendas);
  for (const l of ["pub", "mor", "loy", "threads"]) c[l] = list(l, (x) => ({ text: x.text, kind: x.kind, s: x.s }));
  return c;
}

function bookOf(b) {
  if (!b || typeof b !== "object") return null;
  const was = cardOf(b.was);
  return was ? { from: line(b.from, 40), key: line(b.key, 60), h: line(b.h, 20), at: whole(b.at, 0, Number.MAX_SAFE_INTEGER, 0), was } : null;
}

// A faction as it came from somewhere else, tidied so nothing in it is
// anything but words and numbers in the right places.
export function factionOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const f = { id: raw.id };
  for (const [k, max] of Object.entries(WORDS)) f[k] = line(raw[k], max);
  if (!f.name) return null;
  f.mini = raw.mini === true;
  f.parent = f.mini && (raw.parent === "crew" || isId(raw.parent)) && raw.parent !== raw.id ? raw.parent : null;
  f.outs = f.mini && Array.isArray(raw.outs) ? [...new Set(raw.outs.filter((o) => OUTCOMES.includes(o)))].slice(0, 2) : [];
  for (const l of LISTS) {
    const seen = new Set();
    f[l] = (Array.isArray(raw[l]) ? raw[l] : []).map((x) => itemOf(l, x)).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, l === "agendas" ? MAX.agendas : MAX.list);
  }
  const s = raw.shown && typeof raw.shown === "object" ? raw.shown : {};
  f.shown = Object.fromEntries(SHOWS.map((p) => [p, s[p] === true]));
  f.book = bookOf(raw.book);
  return f;
}

// A board as it came from somewhere else, tidied.
export function readable(raw) {
  const doc = blank();
  if (!raw || typeof raw !== "object") return doc;
  const seen = new Set();
  doc.factions = (Array.isArray(raw.factions) ? raw.factions : []).map(factionOf).filter((f) => f && !seen.has(f.id) && seen.add(f.id)).slice(0, MAX.factions);
  // A mini faction's maker has to be on the board, and not a mini faction itself.
  for (const f of doc.factions) if (f.parent && f.parent !== "crew" && !doc.factions.some((p) => p.id === f.parent && !p.mini)) f.parent = null;
  doc.by = typeof raw.by === "string" ? raw.by : null;
  doc.at = Number(raw.at) || 0;
  return doc;
}

export const find = (doc, id) => doc.factions.find((f) => f.id === id) ?? null;
export const minisOf = (doc, id) => doc.factions.filter((f) => f.mini && f.parent === id);

// One change, made to doc. It says whether anything changed.
export function apply(doc, op) {
  if (!op || typeof op !== "object") return false;
  const was = JSON.stringify(doc);
  const f = op.id ? find(doc, op.id) : null;
  switch (op.o) {
    case "new": {
      const n = factionOf(op.f);
      if (!n || find(doc, n.id) || doc.factions.length >= MAX.factions) return false;
      if (n.parent && n.parent !== "crew" && !doc.factions.some((p) => p.id === n.parent && !p.mini)) n.parent = null;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at <= doc.factions.length ? op.at : doc.factions.length;
      doc.factions.splice(at, 0, n);
      if (!n.mini) for (const k of Array.isArray(op.kids) ? op.kids : []) {
        const kid = find(doc, k);
        if (kid?.mini && !kid.parent) kid.parent = n.id;
      }
      break;
    }
    case "gone": {
      if (!f) return false;
      doc.factions = doc.factions.filter((x) => x !== f);
      for (const x of doc.factions) if (x.parent === f.id) x.parent = null;
      break;
    }
    case "mini": {
      // Making one is Establish: the maker hands over one of its resources and
      // one of its assets, and it can have three at most.
      if (!f || f.mini || minisOf(doc, f.id).length >= MAX.minis || doc.factions.length >= MAX.factions) return false;
      const n = factionOf({ ...op.f, mini: true, parent: f.id });
      if (!n || find(doc, n.id)) return false;
      const res = f.res.find((x) => x.id === op.res);
      const asset = f.assets.find((x) => x.id === op.asset);
      if (res && !n.res.some((x) => x.id === res.id)) {
        f.res = f.res.filter((x) => x !== res);
        n.res.unshift(res);
      }
      if (asset && !n.assets.some((x) => x.id === asset.id)) {
        f.assets = f.assets.filter((x) => x !== asset);
        n.assets.unshift({ ...asset, off: false });
      }
      const kin = minisOf(doc, f.id);
      const after = kin.length ? kin[kin.length - 1] : f;
      doc.factions.splice(doc.factions.indexOf(after) + 1, 0, n);
      break;
    }
    case "set": {
      if (!f) return false;
      if (op.f === "outs") {
        if (!f.mini || !Array.isArray(op.v)) return false;
        f.outs = [...new Set(op.v.filter((o) => OUTCOMES.includes(o)))].slice(0, 2);
        break;
      }
      if (!Object.hasOwn(WORDS, op.f)) return false;
      const v = line(op.v, WORDS[op.f]);
      if (op.f === "name" && !v) return false;
      f[op.f] = v;
      break;
    }
    case "show": {
      if (!f || !SHOWS.includes(op.p)) return false;
      f.shown[op.p] = op.v === true;
      break;
    }
    case "add": {
      if (!f || !LISTS.includes(op.l)) return false;
      const list = f[op.l];
      const item = itemOf(op.l, op.item);
      if (!item || list.some((x) => x.id === item.id) || list.length >= (op.l === "agendas" ? MAX.agendas : MAX.list)) return false;
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at < list.length ? op.at : list.length;
      list.splice(at, 0, item);
      break;
    }
    case "edit": {
      if (!f || !LISTS.includes(op.l) || !FIELDS[op.l].includes(op.f)) return false;
      const item = f[op.l].find((x) => x.id === op.lid);
      if (!item) return false;
      let next;
      if (op.f === "x") {
        // A bigger multiplier adds ticks, and a smaller one never leaves more
        // ticks than it holds.
        const x = whole(op.v, 1, MAX.x, null);
        if (x == null) return false;
        next = itemOf(op.l, { ...item, x, left: Math.min(x, Math.max(1, item.left + x - item.x)) });
      } else next = itemOf(op.l, { ...item, [op.f]: op.v });
      if (!next) return false;
      Object.assign(item, next);
      break;
    }
    case "drop": {
      if (!f || !LISTS.includes(op.l)) return false;
      f[op.l] = f[op.l].filter((x) => x.id !== op.lid);
      break;
    }
    case "tick": {
      if (!f || (op.l !== "res" && op.l !== "assets")) return false;
      const item = f[op.l].find((x) => x.id === op.lid);
      if (!item) return false;
      if (op.by === -1) {
        if (item.left >= item.x) return false;
        item.left += 1;
      } else if (item.left <= 1) f[op.l] = f[op.l].filter((x) => x !== item);
      else item.left -= 1;
      break;
    }
    case "climb": {
      // Past d12 it's happened. A step back from that is the d12 again, and
      // nothing goes below d2.
      const a = f?.agendas.find((x) => x.id === op.lid);
      if (!a) return false;
      if (op.by === -1) {
        if (a.done) a.done = false;
        else a.die = Math.max(2, a.die - 2);
      } else if (!a.done) {
        if (a.die >= 12) a.done = true;
        else a.die += 2;
      }
      break;
    }
    case "die": {
      const a = f?.agendas.find((x) => x.id === op.lid);
      const v = size(op.v);
      if (!a || v == null) return false;
      a.die = v;
      a.done = op.done === true && v === 12;
      break;
    }
    case "move": {
      const to = find(doc, op.to);
      if (!f || !to || to === f || (op.l !== "res" && op.l !== "assets")) return false;
      const item = f[op.l].find((x) => x.id === op.lid);
      if (!item || to[op.l].some((x) => x.id === item.id) || to[op.l].length >= MAX.list) return false;
      f[op.l] = f[op.l].filter((x) => x !== item);
      const at = Number.isInteger(op.at) && op.at >= 0 && op.at < to[op.l].length ? op.at : to[op.l].length;
      to[op.l].splice(at, 0, op.l === "assets" ? { ...item, off: false } : item);
      break;
    }
    case "book": {
      const card = cardOf(op.card);
      if (!f?.book || !card) return false;
      f.book = { ...f.book, h: line(op.h, 20), at: whole(op.at, 0, Number.MAX_SAFE_INTEGER, f.book.at), was: card };
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(doc) !== was;
}

// What puts a change back, worked out from the board before it's made.
export function undoOf(doc, op) {
  const f = op.id ? find(doc, op.id) : null;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const item = f && op.l && Array.isArray(f[op.l]) ? f[op.l].find((x) => x.id === (op.lid ?? op.item?.id)) : null;
  switch (op.o) {
    case "new":
      return op.f?.id ? [{ o: "gone", id: op.f.id }] : [];
    case "gone":
      return f ? [{ o: "new", f: copy(f), at: doc.factions.indexOf(f), kids: minisOf(doc, f.id).map((x) => x.id) }] : [];
    case "mini": {
      if (!f || !op.f?.id) return [];
      const back = [{ o: "gone", id: op.f.id }];
      for (const [l, lid] of [["res", op.res], ["assets", op.asset]]) {
        const x = f[l].find((y) => y.id === lid);
        if (x) back.push({ o: "add", id: f.id, l, item: copy(x), at: f[l].indexOf(x) });
      }
      return back;
    }
    case "set":
      return f ? [{ o: "set", id: f.id, f: op.f, v: op.f === "outs" ? [...f.outs] : f[op.f] }] : [];
    case "show":
      return f ? [{ o: "show", id: f.id, p: op.p, v: f.shown[op.p] === true }] : [];
    case "add":
      return op.item?.id ? [{ o: "drop", id: op.id, l: op.l, lid: op.item.id }] : [];
    case "drop":
      return item ? [{ o: "add", id: f.id, l: op.l, item: copy(item), at: f[op.l].indexOf(item) }] : [];
    case "edit":
      if (!item) return [];
      // A multiplier goes back with its ticks where they were, worked out the
      // way apply() moves them.
      if (op.f === "x") {
        const x = whole(op.v, 1, MAX.x, item.x);
        const left = Math.min(x, Math.max(1, item.left + x - item.x));
        const back = Math.min(item.x, Math.max(1, left + item.x - x)) - item.left;
        return [{ o: "edit", id: f.id, l: op.l, lid: item.id, f: "x", v: item.x }, ...Array.from({ length: Math.abs(back) }, () => ({ o: "tick", id: f.id, l: op.l, lid: item.id, by: back > 0 ? 1 : -1 }))];
      }
      return [{ o: "edit", id: f.id, l: op.l, lid: item.id, f: op.f, v: item[op.f] }];
    case "tick":
      if (!item) return [];
      if (op.by === -1) return [{ o: "tick", id: f.id, l: op.l, lid: item.id, by: 1 }];
      return item.left <= 1 ? [{ o: "add", id: f.id, l: op.l, item: copy(item), at: f[op.l].indexOf(item) }] : [{ o: "tick", id: f.id, l: op.l, lid: item.id, by: -1 }];
    case "climb":
      return [{ o: "climb", id: op.id, lid: op.lid, by: op.by === -1 ? 1 : -1 }];
    case "die": {
      const a = f?.agendas.find((x) => x.id === op.lid);
      return a ? [{ o: "die", id: f.id, lid: a.id, v: a.die, done: a.done }] : [];
    }
    case "move":
      return item ? [{ o: "move", id: op.to, l: op.l, lid: item.id, to: f.id, at: f[op.l].indexOf(item) }, ...(op.l === "assets" && item.off ? [{ o: "edit", id: f.id, l: "assets", lid: item.id, f: "off", v: true }] : [])] : [];
    case "book":
      return f?.book ? [{ o: "book", id: f.id, card: copy(f.book.was), h: f.book.h, at: f.book.at }] : [];
    default:
      return [];
  }
}

// ------------------------------------------------------------ reading a card

// Its Power: 1 step, plus each asset that adds Power and has something paying
// for it. A mini faction's is the same, with its one asset.
export const stepsOf = (f) => 1 + f.assets.filter((a) => a.power && !a.off).length;

// What pays for what. Every asset needs a resource paying for it, and one
// that isn't paying for anything is an extra resource.
export function moneyOf(f) {
  const paying = f.assets.filter((a) => !a.off).length;
  return { res: f.res.length, assets: f.assets.length, paying, extra: Math.max(0, f.res.length - paying), short: Math.max(0, paying - f.res.length) };
}

// How it sees the crew, from its whole threads toward them: mostly bond
// threads and it's friendly, mostly hostile and it's hostile, and none, or as
// many of each, and it does business.
export function standingOf(f) {
  const t = f.threads.filter((x) => x.to === "crew" && x.s === "whole");
  const bond = t.filter((x) => x.kind === "bond").length;
  const hostile = t.length - bond;
  return bond > hostile ? "friendly" : hostile > bond ? "hostile" : "business";
}

// ------------------------------------------------------------ what the crew sees

// The board as a player gets it: only the factions the crew's been shown, and
// only the parts of each that it's been shown. Nothing else leaves the Worker.
// Power's shown with the assets that add it, and the rest of the assets on
// their own. A thread toward a faction the crew hasn't been shown stays hidden.
export function forPlayer(doc) {
  const seen = new Set(doc.factions.filter((f) => f.shown.card).map((f) => f.id));
  return {
    factions: doc.factions.filter((f) => f.shown.card).map((f) => {
      const s = f.shown;
      return {
        id: f.id,
        name: f.name,
        about: f.about,
        want: f.want,
        face: f.face,
        secret: s.secret ? f.secret : "",
        more: s.secret ? f.more : "",
        note: "",
        mini: f.mini,
        parent: f.parent === "crew" || seen.has(f.parent) ? f.parent : null,
        outs: f.outs,
        res: s.res ? f.res : [],
        assets: f.assets.filter((a) => (a.power ? s.power : s.assets)),
        agendas: s.agenda ? f.agendas : [],
        pub: s.bonds ? f.pub : [],
        mor: s.bonds ? f.mor : [],
        loy: s.bonds ? f.loy : [],
        threads: s.threads ? f.threads.filter((t) => t.to === "crew" || seen.has(t.to)) : [],
        shown: { ...s },
        book: null,
      };
    }),
    by: null,
    at: 0,
  };
}
