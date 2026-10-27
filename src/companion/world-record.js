// The world builder's record, kept with a campaign's world as doc.build
// (notes/builder-plan.md, The build, kept): the recipe, the dials, the seed,
// what was dealt and the history. board.js hands it every change whose o
// starts with "wb-", so her phone and the Worker change it the same way, and
// only the GM changes it (the Worker only takes a world's changes from her).
// buildForPlayer() is the only part a player ever gets: How it came to be,
// the history, once she's shown it, and never the seed or anything dealt.
//
// The record: { recipe, dials, seed, dealt, history, shown, at }
//   recipe   { region, era, twist }, by their ids in the tables
//   dials    { tense, strange, rich, ruled }, each 0 to 2
//   seed     its three words, like ash-lantern-ford
//   dealt    what the engine dealt (recordOf() in world-engine.js), plain
//            words and numbers, kept as it came in, within what a world holds
//   history  How it came to be, a line at a time: [{ id, text, age }], age
//            being 1 for the ground, 2 the founding, 3 the strife, or 0
//   shown    whether the crew's been shown the history
//
// A change (its o starts with "wb-"):
//   { o: "wb-set", b }           the record, whole (Done writes it in one go)
//   { o: "wb-gone" }             the record off the world
//   { o: "wb-line", item, at? }  a line of history
//   { o: "wb-edit", lid, v }     a line's words
//   { o: "wb-drop", lid }        a line off it
//   { o: "wb-show", v }          the history shown to the crew, or hidden again

// dealt's cap leaves room in one request for the board Done sends with it (a
// twelve-faction world comes to about a third of it).
export const BMAX = { lines: 80, text: 400, dealt: 100000, depth: 8, list: 128, keys: 256, words: 600 };
const REGIONS = ["town", "city", "country", "world", "stars"];
const DIALS = ["tense", "strange", "rich", "ruled"];
const ID = /^[a-z0-9-]{2,24}$/;
const KEY = /^[A-Za-z0-9_:-]{1,32}$/;
const SEED = /^[a-z]{2,12}(?:-[a-z]{2,12}){2}$/;
const TABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isBuildOp = (op) => typeof op?.o === "string" && op.o.startsWith("wb-");
const str = (v) => (typeof v === "string" ? v : "");
const line = (v, max) => str(v).normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi, or) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
const tableId = (v) => (typeof v === "string" && v.length <= 24 && TABLE_ID.test(v) ? v : null);

// What was dealt, kept as plain words and numbers: nothing deeper, longer or
// bigger than a world can hold, and nothing but data.
function plainOf(v, depth = 0) {
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return line(v, BMAX.words);
  if (depth >= BMAX.depth) return null;
  if (Array.isArray(v)) return v.slice(0, BMAX.list).map((x) => plainOf(x, depth + 1));
  if (typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v).slice(0, BMAX.keys)) if (KEY.test(k) && !(k in Object.prototype) && k !== "prototype") out[k] = plainOf(x, depth + 1);
    return out;
  }
  return null;
}
function dealtOf(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const d = plainOf(v);
  return JSON.stringify(d).length <= BMAX.dealt ? d : null;
}
function lineOf(x) {
  if (!x || typeof x !== "object" || !ID.test(str(x.id))) return null;
  const text = line(x.text, BMAX.text);
  return text ? { id: x.id, text, age: whole(x.age, 0, 3, 0) } : null;
}

// A record as it came from somewhere else, tidied, or null.
export function buildOf(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw.recipe && typeof raw.recipe === "object" ? raw.recipe : {};
  const d = raw.dials && typeof raw.dials === "object" ? raw.dials : {};
  const seen = new Set();
  return {
    recipe: { region: REGIONS.includes(r.region) ? r.region : "", era: tableId(r.era) ?? "", twist: tableId(r.twist) },
    dials: Object.fromEntries(DIALS.map((k) => [k, whole(d[k], 0, 2, 1)])),
    seed: SEED.test(str(raw.seed)) ? raw.seed : "",
    dealt: dealtOf(raw.dealt),
    history: (Array.isArray(raw.history) ? raw.history : []).map(lineOf).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, BMAX.lines),
    shown: raw.shown === true,
    at: whole(raw.at, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

// One change, made to doc. It says whether anything changed.
export function applyBuild(doc, op) {
  const was = JSON.stringify(doc.build ?? null);
  const b = doc.build;
  const find = (lid) => b?.history.find((x) => x.id === lid) ?? null;
  switch (op.o) {
    case "wb-set": {
      // A record whose dealt is too big or isn't a record goes in whole or
      // not at all, so Done never saves half a build.
      const next = buildOf(op.b);
      if (!next || (op.b.dealt != null && !next.dealt)) return false;
      doc.build = next;
      break;
    }
    case "wb-gone":
      doc.build = null;
      break;
    case "wb-line": {
      const item = lineOf(op.item);
      const into = b ?? buildOf({});
      if (!item || into.history.some((x) => x.id === item.id) || into.history.length >= BMAX.lines) return false;
      into.history.splice(whole(op.at, 0, into.history.length, into.history.length), 0, item);
      doc.build = into;
      break;
    }
    case "wb-edit": {
      const l = find(op.lid);
      const v = line(op.v, BMAX.text);
      if (!l || !v) return false;
      l.text = v;
      break;
    }
    case "wb-drop": {
      const l = find(op.lid);
      if (!l) return false;
      b.history.splice(b.history.indexOf(l), 1);
      break;
    }
    case "wb-show":
      if (!b) return false;
      b.shown = op.v === true;
      break;
    default:
      return false;
  }
  return JSON.stringify(doc.build ?? null) !== was;
}

// What puts a change back, worked out from the record before it's made.
export function undoBuild(doc, op) {
  const b = doc.build;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const l = b?.history.find((x) => x.id === op.lid) ?? null;
  switch (op.o) {
    case "wb-set":
      return b ? [{ o: "wb-set", b: copy(b) }] : [{ o: "wb-gone" }];
    case "wb-gone":
      return b ? [{ o: "wb-set", b: copy(b) }] : [];
    case "wb-line":
      return !op.item?.id ? [] : b ? [{ o: "wb-drop", lid: op.item.id }] : [{ o: "wb-gone" }];
    case "wb-edit":
      return l ? [{ o: "wb-edit", lid: l.id, v: l.text }] : [];
    case "wb-drop":
      return l ? [{ o: "wb-line", item: copy(l), at: b.history.indexOf(l) }] : [];
    case "wb-show":
      return b ? [{ o: "wb-show", v: b.shown }] : [];
    default:
      return [];
  }
}

// All a player gets of it: the history, once she's shown it.
export function buildForPlayer(doc) {
  const b = doc.build;
  if (!b?.shown || !b.history.length) return null;
  return { history: b.history.map(({ id, text, age }) => ({ id, text, age })), shown: true };
}
