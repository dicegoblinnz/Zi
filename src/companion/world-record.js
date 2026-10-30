// The world builder's record, kept with a campaign's world as doc.build
// (notes/builder-plan.md, The build, kept): the recipe, the dials, the seed,
// what was dealt and the history. board.js hands it every change whose o
// starts with "wb-", so her phone and the Worker change it the same way, and
// only the GM changes it (the Worker only takes a world's changes from her).
// buildForPlayer() is the only part a player ever gets: How it came to be,
// the ages of it she's shown them, never a line that's hers, and never the
// seed or anything dealt.
//
// The record: { recipe, dials, seed, dealt, history, shown, at, world? }
//   recipe   { region, era, twist }, by their ids in the tables
//   dials    { tense, strange, rich, ruled }, each 0 to 2
//   seed     its three words, like ash-lantern-ford
//   dealt    what the engine dealt (recordOf() in world-engine.js), plain
//            words and numbers, kept as it came in, within what a world holds
//   history  How it came to be, a line at a time: [{ id, text, age, hers? }],
//            age being 1 long ago, 2 in living memory and 3 this last year
//            when the deck wrote it (the founding's will be its ground, its
//            founding and its strife), or 0. A line that's hers (its answer
//            made a Secret) never leaves her phone, even with its age shown.
//   shown    the ages the crew's been shown, each a tap of hers (Mo's pick,
//            30 Oct), like [1, 2]
//   world    the whole world it came in with (stage 14), like night-city-2077,
//            whose record has its recipe and history and nothing dealt. A
//            player gets it once they've been shown anything at all, for the
//            line saying whose it is
//
// A change (its o starts with "wb-"):
//   { o: "wb-set", b }           the record, whole (Done writes it in one go,
//                                as a POST of its own, since a twelve-faction
//                                record's most of what one POST carries). One
//                                whose dealt is more than a world holds is
//                                turned down whole, never kept without it.
//   { o: "wb-gone" }             the record off the world
//   { o: "wb-line", item, at? }  a line of history
//   { o: "wb-edit", lid, v }     a line's words
//   { o: "wb-drop", lid }        a line off it
//   { o: "wb-show", v, age? }    an age shown to the crew (v true) or hidden
//                                again (false), or with no age every age, or
//                                with v a list, exactly those ages (Undo's)

// One request carries 200,000 characters (MAX_TEXT in src/worker/index.js),
// so on a big board Done sends the record on its own, after the factions.
export const BMAX = { lines: 80, text: 400, dealt: 150000, depth: 8, list: 256, words: 600 };
const REGIONS = ["town", "city", "country", "world", "stars"];
const DIALS = ["tense", "strange", "rich", "ruled"];
const ID = /^[a-z0-9-]{2,24}$/;
const KEY = /^[A-Za-z0-9_:-]{1,32}$/;
const SEED = /^[a-z]{2,12}(?:-[a-z]{2,12}){2}$/;
const TABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export const isBuildOp = (op) => typeof op?.o === "string" && op.o.startsWith("wb-");
const str = (v) => (typeof v === "string" ? v : "");
const line = (v, max) => str(v).normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi, or) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
const tableId = (v) => (typeof v === "string" && v.length <= 24 && TABLE_ID.test(v) ? v : null);
const worldId = (v) => (typeof v === "string" && v.length <= 40 && TABLE_ID.test(v) ? v : null);
// The ages a history can have, in the order they're read, and which of them
// the crew's been shown: a list, each once and in order. An old record's true
// was all of it.
export const AGE_ORDER = [1, 2, 3, 0];
const showsOf = (v) => (v === true ? [0, 1, 2, 3] : Array.isArray(v) ? [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 3))].sort((a, b) => a - b) : []);

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
    for (const [k, x] of Object.entries(v).slice(0, BMAX.list)) if (KEY.test(k) && !NOT_KEYS.has(k)) out[k] = plainOf(x, depth + 1);
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
  return text ? { id: x.id, text, age: whole(x.age, 0, 3, 0), ...(x.hers === true ? { hers: true } : {}) } : null;
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
    shown: showsOf(raw.shown),
    at: whole(raw.at, 0, Number.MAX_SAFE_INTEGER, 0),
    ...(worldId(raw.world) ? { world: raw.world } : {}),
  };
}

// One change, made to doc. It says whether anything changed.
export function applyBuild(doc, op) {
  const b = doc.build;
  const find = (lid) => b?.history.find((x) => x.id === lid) ?? null;
  switch (op.o) {
    case "wb-set": {
      const next = buildOf(op.b);
      const meant = op.b?.dealt && typeof op.b.dealt === "object" && !Array.isArray(op.b.dealt);
      if (!next || (meant && !next.dealt)) return false;
      // A line that's hers stays hers, whatever's sent by a phone that
      // doesn't know it (one on older code, adding a faction).
      if (b) for (const l of next.history) if (!l.hers && b.history.some((x) => x.id === l.id && x.hers)) l.hers = true;
      if (b && JSON.stringify(next) === JSON.stringify(b)) return false;
      doc.build = next;
      return true;
    }
    case "wb-gone":
      if (!b) return false;
      doc.build = null;
      return true;
    case "wb-line": {
      const item = lineOf(op.item);
      const into = b ?? buildOf({});
      if (!item || into.history.some((x) => x.id === item.id) || into.history.length >= BMAX.lines) return false;
      into.history.splice(whole(op.at, 0, into.history.length, into.history.length), 0, item);
      doc.build = into;
      return true;
    }
    case "wb-edit": {
      const l = find(op.lid);
      const v = line(op.v, BMAX.text);
      if (!l || !v || l.text === v) return false;
      l.text = v;
      return true;
    }
    case "wb-drop": {
      const l = find(op.lid);
      if (!l) return false;
      b.history.splice(b.history.indexOf(l), 1);
      return true;
    }
    case "wb-show": {
      if (!b) return false;
      let next;
      if (Array.isArray(op.v)) next = showsOf(op.v);
      else if (op.age == null) next = op.v === true ? showsOf(true) : [];
      else {
        const age = whole(op.age, 0, 3, -1);
        if (age < 0) return false;
        next = op.v === true ? showsOf([...b.shown, age]) : b.shown.filter((x) => x !== age);
      }
      if (next.join() === b.shown.join()) return false;
      b.shown = next;
      return true;
    }
    default:
      return false;
  }
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
      return b ? [{ o: "wb-show", v: [...b.shown] }] : [];
    default:
      return [];
  }
}

// All a player gets of it: the lines of the ages she's shown them, bar any
// that's hers, and which ages those are, and the whole world it came in
// with once they've been shown anything in it.
export function buildForPlayer(doc) {
  const b = doc.build;
  const shown = new Set(b?.shown ?? []);
  const history = (b?.history ?? []).filter((l) => !l.hers && shown.has(l.age)).map(({ id, text, age }) => ({ id, text, age }));
  const world = b?.world && ((doc.factions ?? []).some((f) => f.shown?.card) || (doc.pages ?? []).some((p) => p.shown?.page) || (doc.maps ?? []).some((m) => m.shown)) ? b.world : null;
  return history.length || world ? { history, shown: [...new Set(history.map((l) => l.age))].sort((x, y) => x - y), ...(world ? { world } : {}) } : null;
}
