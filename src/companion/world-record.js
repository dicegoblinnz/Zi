// The world builder's record, kept with a campaign's world as doc.build
// (notes/builder-plan.md, The build, kept): the recipe, the dials, the seed,
// what was dealt and the history. board.js hands it every change whose o
// starts with "wb-", so her phone and the Worker change it the same way, and
// only the GM changes it (the Worker only takes a world's changes from her).
// buildForPlayer() is the only part a player ever gets: How it came to be,
// the ages of it she's shown them, never a line that's hers, and never the
// seed or anything dealt.
//
// The record: { recipe, dials, seed, dealt, history, shown, ages, at, world? }
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
//            After the founding's three, each downtime is an age of its own:
//            downtime n's lines are age 3 + n (notes/faction-feel-plan.md)
//   ages     the downtimes in it, [{ n, len }], len being how long the table
//            said it was ("A month", or its own words), only the story's clock
//   shown    the ages the crew's been shown, each a tap of hers (Mo's pick,
//            30 Oct), like [1, 2]
//   world    the whole world it came in with (stage 14), like night-city-2077,
//            whose record has its recipe and history and nothing dealt, and
//   fan      true when that world's fan-made. A player gets the world's id
//            once they've been shown anything at all, for the line saying
//            whose it is, and only for a fan-made one
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
//   { o: "wb-age", dt, len, lines }  downtime dt ends: its age, how long it was,
//                                and what changed in it, shown to the crew,
//                                since it's what they heard. A world with no
//                                record yet gets one.
//   { o: "wb-age-off", dt }      downtime dt's age off it again (the
//                                downtime's dt, since n is each change's own
//                                number on its way up)

// One request carries 200,000 characters (MAX_TEXT in src/worker/index.js),
// so on a big board Done sends the record on its own, after the factions.
export const BMAX = { lines: 80, text: 400, dealt: 150000, depth: 8, list: 256, words: 600, downtimes: 96, more: 600, len: 40 };
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
// The highest age: the founding's three, then a downtime each.
const TOP = 3 + BMAX.downtimes;
// Only ages the record has: the founding's three and the rest, and the
// downtimes in it (b.ages).
const showsOf = (v, b = null) => (v === true ? [0, 1, 2, 3, ...(b?.ages ?? []).map((x) => 3 + x.n)] : Array.isArray(v) ? [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= TOP && (n <= 3 || (b?.ages ?? []).some((x) => 3 + x.n === n))))].sort((a, b) => a - b) : []);
// Every age in the order it's read: the founding's three, each downtime in
// turn, then the rest of it.
export const agesOf = (b) => [1, 2, 3, ...(b?.ages ?? []).map((x) => 3 + x.n), 0];
// A downtime's age, and the downtime an age is.
export const isDowntime = (age) => Number.isInteger(age) && age > 3;
export const downtimeOf = (b, age) => (isDowntime(age) ? (b?.ages ?? []).find((x) => 3 + x.n === age) ?? { n: age - 3, len: "" } : null);

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
  return text ? { id: x.id, text, age: whole(x.age, 0, TOP, 0), ...(x.hers === true ? { hers: true } : {}) } : null;
}

// A record as it came from somewhere else, tidied, or null.
export function buildOf(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw.recipe && typeof raw.recipe === "object" ? raw.recipe : {};
  const d = raw.dials && typeof raw.dials === "object" ? raw.dials : {};
  const seen = new Set();
  const ns = new Set();
  const ages = (Array.isArray(raw.ages) ? raw.ages : []).map((x) => ({ n: whole(x?.n, 1, BMAX.downtimes, 0), len: line(x?.len, BMAX.len) })).filter((x) => x.n && !ns.has(x.n) && ns.add(x.n)).sort((x, y) => x.n - y.n);
  const lines = (Array.isArray(raw.history) ? raw.history : []).map(lineOf).filter((x) => x && !seen.has(x.id) && seen.add(x.id));
  return {
    recipe: { region: REGIONS.includes(r.region) ? r.region : "", era: tableId(r.era) ?? "", twist: tableId(r.twist) },
    dials: Object.fromEntries(DIALS.map((k) => [k, whole(d[k], 0, 2, 1)])),
    seed: SEED.test(str(raw.seed)) ? raw.seed : "",
    dealt: dealtOf(raw.dealt),
    // The founding's lines, then what changed each downtime, each in its own cap.
    history: [...lines.filter((l) => l.age <= 3).slice(0, BMAX.lines), ...lines.filter((l) => l.age > 3 && ns.has(l.age - 3)).slice(-BMAX.more)],
    shown: showsOf(raw.shown, { ages }),
    ages,
    at: whole(raw.at, 0, Number.MAX_SAFE_INTEGER, 0),
    ...(worldId(raw.world) ? { world: raw.world, ...(raw.fan === true ? { fan: true } : {}) } : {}),
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
      if (!item || item.age > 3 || into.history.some((x) => x.id === item.id) || into.history.filter((x) => x.age <= 3).length >= BMAX.lines) return false;
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
      if (Array.isArray(op.v)) next = showsOf(op.v, b);
      else if (op.age == null) next = op.v === true ? showsOf(true, b) : [];
      else {
        const age = whole(op.age, 0, TOP, -1);
        if (age < 0 || (isDowntime(age) && !b.ages.some((x) => 3 + x.n === age))) return false;
        next = op.v === true ? showsOf([...b.shown, age], b) : b.shown.filter((x) => x !== age);
      }
      if (next.join() === b.shown.join()) return false;
      b.shown = next;
      return true;
    }
    case "wb-age": {
      const n = whole(op.dt, 1, BMAX.downtimes, 0);
      const into = b ?? buildOf({});
      if (!n || into.ages.some((x) => x.n === n)) return false;
      const age = 3 + n;
      const lines = (Array.isArray(op.lines) ? op.lines : []).map((x) => lineOf({ id: x?.id, text: x?.text, age })).filter((l) => l && !into.history.some((y) => y.id === l.id)).slice(0, BMAX.lines);
      into.ages = [...into.ages, { n, len: line(op.len, BMAX.len) }].sort((x, y) => x.n - y.n);
      into.history.push(...lines);
      // Past what a record holds, the oldest downtime's lines go first.
      const over = into.history.filter((l) => l.age > 3).length - BMAX.more;
      if (over > 0) {
        const old = new Set(into.history.filter((l) => l.age > 3).slice(0, over).map((l) => l.id));
        into.history = into.history.filter((l) => !old.has(l.id));
      }
      into.shown = showsOf([...into.shown, age], into);
      doc.build = into;
      return true;
    }
    case "wb-age-off": {
      const n = whole(op.dt, 1, BMAX.downtimes, 0);
      if (!b || !b.ages.some((x) => x.n === n)) return false;
      b.ages = b.ages.filter((x) => x.n !== n);
      b.history = b.history.filter((l) => l.age !== 3 + n);
      b.shown = b.shown.filter((x) => x !== 3 + n);
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
    case "wb-age":
      return b ? [{ o: "wb-age-off", dt: op.dt }] : [{ o: "wb-gone" }];
    case "wb-age-off": {
      const a = b?.ages.find((x) => x.n === op.dt);
      return a ? [{ o: "wb-age", dt: a.n, len: a.len, lines: b.history.filter((l) => l.age === 3 + a.n).map(({ id, text }) => ({ id, text })) }] : [];
    }
    default:
      return [];
  }
}

// All a player gets of it: the lines of the ages she's shown them, bar any
// that's hers, and which ages those are, and a fan-made world it came in
// with once they've been shown anything in it.
export function buildForPlayer(doc) {
  const b = doc.build;
  const shown = new Set(b?.shown ?? []);
  const history = (b?.history ?? []).filter((l) => !l.hers && shown.has(l.age)).map(({ id, text, age }) => ({ id, text, age }));
  const world = b?.world && b.fan && ((doc.factions ?? []).some((f) => f.shown?.card) || (doc.pages ?? []).some((p) => p.shown?.page) || (doc.maps ?? []).some((m) => m.shown)) ? b.world : null;
  // The downtimes the crew can read, with how long each was.
  const ages = (b?.ages ?? []).filter((x) => history.some((l) => l.age === 3 + x.n)).map(({ n, len }) => ({ n, len }));
  return history.length || world ? { history, shown: [...new Set(history.map((l) => l.age))].sort((x, y) => x - y), ...(ages.length ? { ages } : {}), ...(world ? { world } : {}) } : null;
}
