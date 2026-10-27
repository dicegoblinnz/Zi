// The world builder's engine (stage 2 of notes/builder-plan.md). It's pure,
// with no page: the same code deals on the phone, in the tests and in
// scripts/deal-world.mjs. Given the tables (public/world-tables.json, read by
// scripts/world-tables.mjs), a recipe (region, era, twist), the dials, a seed
// and the board so far, it deals.
//
// Every word it hands back comes off the tables: rows, their templates and
// the names in them. It writes nothing of its own.
//
// A world in progress, W:
//   seed, recipe { region, era, twist }, n (factions), s (seats: n + 2)
//   dials     { tense, strange, rich, ruled }, each 0 to 2, set by the asking
//             unless they were given (fixed)
//   asking    { holds, runs, notices }, the answers, and tension, the roll
//   seats     the ground, each { id, text, role, notice, tags, ... }
//   factions  each { seat, size, type, exc, method, want, res, assets, agenda,
//             face, secret, name, offers }, dealt in that order, each step
//             reading the card so far. null is still to deal (exc is
//             undefined till it's dealt, and null when there's no exception).
//   web       the ties round the ring, needs the assets with nothing paying
//             for them and who's blocking each one, checks what the checks
//             found, fixes what was dealt again for them, fallbacks what
//             went in from core.yaml when three deals weren't enough
//   tries     how many times each step's been dealt again, locks the steps
//             she's locked. Each step has its own stream of randomness from
//             the seed, its path and its tries, so dealing one again leaves
//             every other step as it was.
//
// A step's path: ask:holds, ask:runs, ask:notices, tension, seat:<k>, and
// f:<i>:<step> for the factions' steps. Picks keep their words, so the world
// keeps what was dealt, never just the seed (the tables change most weeks).

export const REGIONS = ["town", "city", "country", "world", "stars"];
export const SIZES = ["small", "local", "city", "great"];
export const DIALS = ["tense", "strange", "rich", "ruled"];
export const STEPS = ["seat", "size", "type", "exc", "method", "want", "res", "assets", "agenda", "face", "secret", "name"];
// Dealing it all goes round the factions twice: up to their assets, then the
// rest, so an agenda or a Secret can aim at any faction on the board, not
// just the ones dealt before it.
const EARLY = STEPS.slice(0, STEPS.indexOf("agenda"));
const LATE = STEPS.slice(STEPS.indexOf("agenda"));
export const QUESTIONS = ["holds", "runs", "notices"];
export const CHECKS = ["rival", "block", "secret", "unique", "aims", "strange"];
// The bags no two factions share a row from till the bag's empty, and the
// steps they're dealt at.
export const BAGS = { seats: "seat", types: "type", methods: "method", wants: "want", secrets: "secret", agendas: "agenda", exceptions: "exc", names: "name", people: "face" };

// The dials: how strange (how often a strange row comes up), how ruled
// (ruling houses, offices and soldiers), how rich (how many resources) and
// how tense (needs, and how often a wildcard's hostile).
const STRANGE = [0.35, 1, 2.5];
const RULED = [0.6, 1, 1.8];
const RULED_ROLES = new Set(["house", "office", "soldiers"]);
const NEEDS = [1 / 4, 1 / 3, 1 / 2];
const HOSTILE = [1 / 3, 1 / 2, 2 / 3];
const EXTRA = [0.3, 0.5, 0.7];
const EXCEPTION = 1 / 6;
const FIT = 1.5;
const USED = 0.2;

// Randomness: a stream for each step, from the seed and the step's path.
function hashOf(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
export function rngOf(...parts) {
  const next = hashOf(parts.join("|"));
  let a = next();
  let b = next();
  let c = next();
  let d = next();
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
const randOf = (W, path, ...more) => rngOf(W.seed, path, W.tries[path] ?? 0, ...more);

// Draw up to n, each by its weight, none twice.
function draw(cands, rand, n = 1) {
  const pool = cands.filter((c) => c.w > 0);
  const out = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, c) => s + c.w, 0);
    let x = rand() * total;
    let j = 0;
    for (; j < pool.length - 1; j++) {
      x -= pool[j].w;
      if (x < 0) break;
    }
    out.push(pool.splice(j, 1)[0]);
  }
  return out;
}
const pick = (list, rand) => (list.length ? list[Math.floor(rand() * list.length) % list.length] : null);
const shuffle = (list, rand) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// A seed: three words from core.yaml, like ash-lantern-ford.
export function newSeed(T, rand = Math.random) {
  const words = T.core.seeds;
  const out = [];
  while (out.length < 3) {
    const w = words[Math.floor(rand() * words.length) % words.length];
    if (!out.includes(w)) out.push(w);
  }
  return out.join("-");
}

// A row's words with its slots filled. A name keeps its capitals bar a
// leading The, and a line's first letter comes down, unless it starts the
// sentence. Nothing's added but the words in the slots.
export function fill(tpl, vals) {
  const out = String(tpl ?? "").replace(/\{([a-z]+)\}/g, (m, k, at) => {
    const v = vals[k];
    if (v == null) return m;
    const name = typeof v === "object" && v.name;
    let s = String(typeof v === "object" ? v.text : v).replace(/[.]+$/, "");
    if (at > 0) s = name ? s.replace(/^The /, "the ") : s.replace(/^(The|A|An) /, (x) => x.toLowerCase()).replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
    return s;
  });
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// The rows a world deals from: core's, and the era's and the twist's that fit
// its region.
const pools = new WeakMap();
export function poolOf(T, recipe) {
  const key = `${recipe.region}|${recipe.era}|${recipe.twist ?? ""}`;
  let byKey = pools.get(T);
  if (!byKey) pools.set(T, (byKey = new Map()));
  if (byKey.has(key)) return byKey.get(key);
  const region = recipe.region;
  const packs = [T.packs[`era:${recipe.era}`], recipe.twist ? T.packs[`twist:${recipe.twist}`] : null].filter((p) => p && p.fits.includes(region));
  const fits = (r) => !r.regions || r.regions.includes(region);
  const from = (k) => packs.flatMap((p) => p[k] ?? []).filter(fits);
  const pool = {
    seats: from("seats"),
    resources: from("resources"),
    assets: from("assets"),
    types: from("types"),
    methods: [...T.core.methods.filter(fits), ...from("methods")],
    wants: [...T.core.wants.filter(fits), ...from("wants")],
    secrets: [...T.core.secrets.filter(fits), ...from("secrets")],
    agendas: T.core.agendas.filter(fits),
    exceptions: from("exceptions"),
    names: packs.flatMap((p) => p.names.factions).filter(fits),
    people: packs.flatMap((p) => p.names.people).filter(fits),
  };
  byKey.set(key, pool);
  return pool;
}

// Which recipes the tables can deal: an era with its pack in the region, and
// a twist only if its pack fits the region too, so a genre never deals
// without its twist.
export function canDeal(T, { region, era, twist = null }) {
  const e = T.packs[`era:${era}`];
  if (!REGIONS.includes(region) || !e || !e.fits.includes(region)) return false;
  return !twist || Boolean(T.packs[`twist:${twist}`]?.fits.includes(region));
}

// A new world, with nothing dealt: four to twelve factions (the plan's call
// on board size). dials, if they're given, are fixed, and the asking doesn't
// move them.
export function start(T, { recipe, dials = null, seed, factions = 6 }) {
  if (!canDeal(T, recipe)) throw new Error(`the tables can't deal ${recipe.era}${recipe.twist ? ` with ${recipe.twist}` : ""} at ${recipe.region}`);
  const n = Math.max(4, Math.min(12, Math.floor(Number(factions) || 6)));
  const fixed = dials ? Object.fromEntries(DIALS.map((k) => [k, clamp(dials[k] ?? 1)])) : null;
  return {
    v: 1,
    seed: String(seed),
    recipe: { region: recipe.region, era: recipe.era, twist: recipe.twist ?? null },
    n,
    s: n + 2,
    fixed,
    dials: fixed ?? { tense: 1, strange: 1, rich: 1, ruled: 1 },
    tries: {},
    locks: {},
    asking: { holds: null, runs: null, notices: null },
    tension: null,
    seats: Array.from({ length: n + 2 }, () => null),
    factions: Array.from({ length: n }, () => blankFaction()),
    web: null,
    needs: null,
    checks: null,
    fixes: [],
    fallbacks: [],
  };
}
const clamp = (v) => Math.max(0, Math.min(2, Math.round(Number(v) || 0)));
const blankFaction = () => ({ seat: null, size: null, type: null, exc: undefined, method: null, want: null, res: null, assets: null, agenda: null, face: null, secret: null, name: null, offers: [] });

// The dials, from the asking's answers and the tension, unless they're fixed.
function dialsOf(W) {
  if (W.fixed) return { ...W.fixed };
  const d = { tense: 1, strange: 1, rich: 1, ruled: 1 };
  for (const p of [...QUESTIONS.map((q) => W.asking[q]), W.tension]) for (const [k, v] of Object.entries(p?.dials ?? {})) d[k] += v;
  return Object.fromEntries(DIALS.map((k) => [k, clamp(d[k])]));
}

// What's on the board, and on one card, that can steer a step: each tag with
// where it came from, so a step can say why.
function boardOf(T, W) {
  const tags = new Map();
  const reg = T.regions[W.recipe.region];
  tags.set(W.recipe.region, { kind: "region", text: reg?.name ?? W.recipe.region });
  for (const q of QUESTIONS) {
    const a = W.asking[q];
    if (a) for (const t of a.tags) if (!tags.has(t)) tags.set(t, { kind: "answer", text: a.text });
  }
  if (W.tension) for (const t of W.tension.tags) if (!tags.has(t)) tags.set(t, { kind: "tension", text: W.tension.text });
  return { tags };
}
function cardOf(W, i) {
  const f = W.factions[i];
  const tags = new Map();
  const leans = new Map();
  const add = (into, keys, src) => {
    for (const k of keys) if (k && !into.has(k)) into.set(k, src);
  };
  const seat = f.seat ? W.seats[f.seat.k] : null;
  if (seat) add(tags, [seat.role, ...seat.tags], { kind: "seat", text: seat.text, name: true });
  for (const step of ["type", "method", "want"]) {
    const p = f[step];
    if (!p || p.own) continue;
    const src = { kind: step, text: p.text };
    add(tags, [p.role, ...(p.tags ?? [])], src);
    add(leans, p.leans ?? [], src);
  }
  if (f.exc) add(tags, f.exc.gives, { kind: "exception", text: f.exc.reason });
  return { tags, leans, drops: new Set(f.exc?.drops ?? []), size: f.size?.size ?? null, seat };
}
const has = (card, board, t) => Boolean(card?.tags.has(t) || board.tags.has(t));
function fits(row, card, board) {
  if (card?.size && row.sizes && !row.sizes.includes(card.size)) return false;
  if (row.needs.some((t) => !has(card, board, t))) return false;
  if (row.out.some((t) => has(card, board, t))) return false;
  if (card && [row.role, ...row.tags].some((t) => t && card.drops.has(t))) return false;
  return true;
}
function fitOf(row, card, board) {
  let matches = 0;
  let src = null;
  for (const k of [row.role, ...row.tags, ...row.leans]) {
    if (!k) continue;
    const s = card?.tags.get(k) ?? card?.leans.get(k) ?? board.tags.get(k);
    if (s) {
      matches++;
      src ??= s;
    }
  }
  return { matches: Math.min(matches, 3), src };
}
function weightOf(W, row, fit) {
  let w = row.w * (1 + FIT * fit.matches);
  if (row.strange) w *= STRANGE[W.dials.strange];
  if (row.role && RULED_ROLES.has(row.role)) w *= RULED[W.dials.ruled];
  return w;
}
// Why a step went the way it did, when something steered it and the reason
// isn't obvious. An exception always says its reason.
function whyOf(T, src, obvious = false) {
  if (!src || obvious) return "";
  if (src.kind === "exception") return fill(src.text, {});
  const tpl = T.core.because[src.kind] ?? "";
  return tpl ? fill(tpl, { thing: src }) : "";
}
// The because, and what steered the step when it needed one.
const becauseOf = (T, src, obvious = false) => ({ why: whyOf(T, src, obvious), by: src && !obvious ? src.kind : null });

// The rows other factions (or seats) already hold, from one bag.
function usedBy(W, step, but) {
  const ids = new Set();
  if (step === "seat") {
    W.seats.forEach((s, k) => s && k !== but && ids.add(s.id));
    return ids;
  }
  W.factions.forEach((f, i) => {
    if (i === but) return;
    const p = f[step];
    if (step === "face") p?.nameId && ids.add(p.nameId);
    else p?.id && ids.add(p.id);
  });
  return ids;
}
// Candidates from a bag: the rows nobody else holds, or every row once the
// bag's empty.
function bagged(rows, used) {
  const fresh = rows.filter((r) => !used.has(r.id));
  return fresh.length ? fresh : rows;
}
const dealt = (W, i) => W.factions.map((f, j) => (j !== i && f.type ? j : null)).filter((j) => j !== null);

// A step's candidates, each { w, ...the pick }.
function candidates(T, W, path, { only = null } = {}) {
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  const [head, a, b] = path.split(":");
  const strangeOnly = only === "strange";
  const keep = (rows) => (strangeOnly ? rows.filter((r) => r.strange) : rows);
  const of = (r, fit, extra = {}) => ({ w: weightOf(W, r, fit), id: r.id, text: r.text, role: r.role, tags: r.tags, leans: r.leans, offers: r.offers, strange: r.strange, ...extra });
  if (head === "ask") {
    return T.core.asking[a].filter((r) => fits(r, null, board)).map((r) => of(r, fitOf(r, null, board), { dials: r.dials, why: "", by: null }));
  }
  if (head === "seat") {
    const k = Number(a);
    const used = usedBy(W, "seat", k);
    const roles = new Map();
    W.seats.forEach((s, j) => s && j !== k && roles.set(s.role, (roles.get(s.role) ?? 0) + 1));
    return keep(bagged(P.seats.filter((r) => fits(r, null, board)), used)).map((r) => {
      const fit = fitOf(r, null, board);
      return { ...of(r, fit, { notice: r.notice, sizes: r.sizes, ...becauseOf(T, fit.src) }), w: weightOf(W, r, fit) * 0.5 ** (roles.get(r.role) ?? 0) };
    });
  }
  if (head !== "f") return [];
  const i = Number(a);
  const f = W.factions[i];
  const card = cardOf(W, i);
  if (b === "seat") {
    const taken = new Set(W.factions.map((x, j) => (j !== i && x.seat ? x.seat.k : null)));
    return W.seats.map((s, k) => (s && !taken.has(k) ? { w: 1, k } : null)).filter(Boolean);
  }
  if (b === "size") {
    const seat = card.seat;
    return SIZES.map((size) => ({ w: T.core.sizes[size] * (seat?.sizes?.includes(size) ? 3 : 1), size }));
  }
  const pool = (rows, step) => keep(bagged(rows.filter((r) => fits(r, card, board)), usedBy(W, step, i)));
  if (b === "type" || b === "method" || b === "want") {
    const rows = pool(b === "type" ? P.types : b === "method" ? P.methods : P.wants, b);
    return rows.map((r) => {
      const fit = fitOf(r, card, board);
      return of(r, fit, becauseOf(T, fit.src));
    });
  }
  if (b === "exc") {
    const used = usedBy(W, "exc", i);
    const rows = keep(P.exceptions.filter((r) => !used.has(r.id) && fits(r, card, board) && r.when.every((t) => has(card, board, t))));
    return rows.map((r) => ({ w: r.w, id: r.id, text: r.text, reason: r.reason, drops: r.drops, gives: r.gives, strange: r.strange }));
  }
  if (b === "secret") {
    const others = dealt(W, i);
    const rows = pool(P.secrets.filter((r) => (only === "rival" ? r.rival : true) && (!r.rival || others.length)), "secret");
    return rows.map((r) => {
      const fit = fitOf(r, card, board);
      return of(r, fit, { tag: r.tag, more: r.more, ways: r.ways, rival: r.rival, ...becauseOf(T, fit.src) });
    });
  }
  if (b === "agenda") {
    const others = dealt(W, i);
    const can = (aim) => aim === "seat" || (aim === "rival" && others.length) || (aim === "res" && others.some((j) => W.factions[j].res?.length)) || (aim === "asset" && others.some((j) => W.factions[j].assets?.length));
    const rows = pool(P.agendas.filter((r) => (only === "seat" ? r.aims.includes("seat") : true) && r.aims.every(can)), "agenda");
    return rows.map((r) => {
      const fit = fitOf(r, card, board);
      return of(r, fit, { die: r.die, aims: r.aims, ...becauseOf(T, fit.src) });
    });
  }
  if (b === "name") {
    const kind = f.type?.role;
    const own = P.names.filter((r) => !r.role || r.role === kind);
    return pool(own.length ? own : P.names, "name").map((r) => {
      const fit = fitOf(r, card, board);
      return of(r, fit, { why: "", by: null });
    });
  }
  return [];
}

// The fields a pick keeps: its words and what it is, never the row itself.
const KEEP = ["id", "text", "role", "tags", "leans", "offers", "strange", "why", "by", "notice", "sizes", "dials", "tag", "more", "ways", "rival", "die", "aims", "reason", "drops", "gives", "power", "does"];
const keepOf = (c) => Object.fromEntries(KEEP.filter((k) => c[k] !== undefined).map((k) => [k, Array.isArray(c[k]) ? [...c[k]] : c[k]]));

// A whole set, for the steps that deal one: a faction's resources, or its
// assets.
function dealRes(T, W, i, rand) {
  const f = W.factions[i];
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  const card = cardOf(W, i);
  const size = T.book.sizes[f.size.size];
  const count = W.dials.rich === 0 ? size.rlo : W.dials.rich === 2 ? size.rhi : size.rlo + Math.floor(rand() * (size.rhi - size.rlo + 1));
  const elsewhere = new Set(W.factions.flatMap((x, j) => (j !== i && x.res ? x.res.map((r) => r.id) : [])));
  const out = [];
  const rows = P.resources.filter((r) => fits(r, card, board));
  const one = (filter, obvious) => {
    const cands = rows
      .filter((r) => !out.some((o) => o.id === r.id) && filter(r))
      .map((r) => {
        const fit = fitOf(r, card, board);
        return { w: weightOf(W, r, fit) * (elsewhere.has(r.id) ? USED : 1), r, fit };
      });
    const [c] = draw(cands, rand);
    if (!c) return false;
    const plain = obvious(c);
    out.push(keepOf({ id: c.r.id, text: c.r.text, role: c.r.role, tags: c.r.tags, strange: c.r.strange, ...becauseOf(T, c.fit.src, plain) }));
    return true;
  };
  // Where the keep comes from: the first one's its seat's, when there's one.
  if (card.seat) one((r) => r.role === card.seat.role, () => true);
  while (out.length < count && one(() => true, (c) => c.fit.src?.kind === "seat" && c.r.role === card.seat?.role)) {}
  return out;
}
function dealAssets(T, W, i, rand, { only = null } = {}) {
  const f = W.factions[i];
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  const card = cardOf(W, i);
  const people = Math.max(0, Math.min(f.size.die / 2 - 1, f.res?.length ?? 0));
  const held = heldRoles(W, i);
  const elsewhere = new Set(W.factions.flatMap((x, j) => (j !== i && x.assets ? x.assets.map((a) => a.id) : [])));
  const rows = P.assets.filter((r) => fits(r, card, board) && (only !== "strange" || r.strange || r.power));
  const out = [];
  const one = (power) => {
    const cands = rows
      .filter((r) => r.power === power && !out.some((o) => o.role === r.role) && (power || !held.has(r.role)))
      .map((r) => {
        const fit = fitOf(r, card, board);
        return { w: weightOf(W, r, fit) * (elsewhere.has(r.id) ? USED : 1), r, fit };
      });
    const [c] = draw(cands, rand);
    if (!c) return false;
    out.push(assetOf(T, c.r, becauseOf(T, c.fit.src)));
    return true;
  };
  for (let k = 0; k < people && one(true); k++) {}
  const free = Math.max(0, (f.res?.length ?? 0) - out.length);
  let extra = rand() < EXTRA[W.dials.rich] ? 1 : 0;
  if (free >= 4 && W.dials.rich === 2 && rand() < 0.5) extra++;
  if (only === "extra") extra = Math.max(extra, 1);
  // No two factions hold the same asset that does one thing, so a few are
  // left for the board's needs.
  const roles = new Set(rows.filter((r) => !r.power).map((r) => r.role)).size;
  const room = Math.max(0, roles - needsOf(W) - held.size);
  for (let k = 0; k < Math.min(free - extra, room) && one(false); k++) {}
  return out;
}
const assetOf = (T, r, because) => keepOf({ id: r.id, text: r.text, role: r.role, tags: r.tags, offers: r.offers, strange: r.strange, ...because, power: r.power === true, does: r.does ?? T.book.assets[r.role]?.does ?? "" });
// The assets that do one thing anyone else on the board holds, by their role,
// needs included.
function heldRoles(W, but) {
  const roles = new Set();
  W.factions.forEach((f, j) => j !== but && f.assets?.forEach((a) => !a.power && roles.add(a.role)));
  W.needs?.forEach((n) => n.i !== but && roles.add(n.asset.role));
  return roles;
}

// The board so far for an agenda's aim or a Secret's rival: a seat (free ones
// likelier), another faction, or one of theirs.
function aimOf(W, i, aims, rand) {
  const others = dealt(W, i);
  const out = {};
  for (const a of aims) {
    if (a === "seat") {
      const taken = new Set(W.factions.map((f) => f.seat?.k));
      const own = W.factions[i].seat?.k;
      const seats = W.seats.map((s, k) => (s && k !== own ? { w: taken.has(k) ? 1 : 2, k } : null)).filter(Boolean);
      out.seat = draw(seats, rand)[0]?.k ?? own ?? 0;
    } else if (a === "rival") out.rival = pick(others, rand);
    else {
      const list = a === "res" ? "res" : "assets";
      const all = others.flatMap((j) => (W.factions[j][list] ?? []).map((x) => ({ j, id: x.id })));
      out[a] = pick(all, rand);
    }
  }
  return out;
}

// One step, dealt: its first card. The three cards a screen shows are
// options(), and the first of them is always what this deals.
export function options(T, W, path, n = 3, opts = {}) {
  W.dials = dialsOf(W);
  const rand = randOf(W, path, opts.only ?? "");
  const [head, a, b] = path.split(":");
  if (head === "tension") {
    const roll = Math.floor(rand() * 12) % 12;
    const r = T.core.tension[roll];
    return [keepOf({ id: r.id, text: r.text, tags: r.tags, dials: r.dials, strange: r.strange, why: "" })].map((x) => ({ ...x, roll: roll + 1 }));
  }
  if (head === "f" && (b === "res" || b === "assets")) return [b === "res" ? dealRes(T, W, Number(a), rand) : dealAssets(T, W, Number(a), rand, opts)];
  if (head === "f" && b === "exc") {
    // One card in six with an exception that fits it breaks the logic.
    const cands = candidates(T, W, path);
    if (!cands.length || (opts.only !== "exception" && rand() >= EXCEPTION)) return [null];
    const [c] = draw(cands, rand);
    return [c ? keepOf(c) : null];
  }
  if (head === "f" && b === "face") return faces(T, W, Number(a), rand, n);
  // Dealing a step again never hands back the card it's already got, while
  // there's another.
  let all = candidates(T, W, path, opts);
  if (opts.not != null) {
    const other = all.filter((c) => (c.id ?? c.k ?? c.size) !== opts.not);
    if (other.length) all = other;
  }
  const cands = draw(all, rand, n);
  if (head === "f" && b === "seat") return cands.map((c) => ({ k: c.k }));
  if (head === "f" && b === "size") {
    return cands.map((c) => {
      const s = T.book.sizes[c.size];
      const dice = [];
      for (let d = s.lo; d <= s.hi; d += 2) dice.push(d);
      return { size: c.size, die: pick(dice, rngOf(W.seed, path, W.tries[path] ?? 0, c.size)) };
    });
  }
  if (head === "f" && b === "agenda") return cands.map((c) => ({ ...keepOf(c), at: aimOf(W, Number(a), c.aims, rngOf(W.seed, path, W.tries[path] ?? 0, c.id)) }));
  if (head === "f" && b === "secret") return cands.map((c) => ({ ...keepOf(c), at: c.rival ? aimOf(W, Number(a), ["rival"], rngOf(W.seed, path, W.tries[path] ?? 0, c.id)).rival : null }));
  return cands.map((c) => keepOf(c));
}
// A face: a name from the pack and one of the Threat Builder's threats, at
// the Challenge its Power sends.
function faces(T, W, i, rand, n) {
  const f = W.factions[i];
  const P = poolOf(T, W.recipe);
  const likely = new Set(T.core.faces[f.type?.role] ?? []);
  const threats = draw(T.book.threats.map((t) => ({ w: likely.has(t.key) ? 5 : 1, t })), rand, n);
  const names = draw(bagged(P.people, usedBy(W, "face", i)).map((r) => ({ w: r.w, r })), rand, n);
  const out = [];
  for (let k = 0; k < Math.min(threats.length, names.length); k++) {
    const t = threats[k].t;
    out.push({ name: names[k].r.text, nameId: names[k].r.id, threat: t.key, threatName: t.name, is: t.is, ch: Math.max(1, f.size.die / 2), tags: t.tags.map((x) => ({ ...x })), strange: names[k].r.strange });
  }
  return out;
}

// Put a pick on a step. A faction's later steps that aren't locked are dealt
// again, since they read the card so far.
export function choose(T, W, path, value) {
  const [head, a, b] = path.split(":");
  if (head === "ask") W.asking[a] = value;
  else if (head === "tension") W.tension = value;
  else if (head === "seat") W.seats[Number(a)] = value;
  else if (head === "f") {
    const f = W.factions[Number(a)];
    f[b] = value;
    for (const step of STEPS.slice(STEPS.indexOf(b) + 1)) if (!W.locks[`f:${a}:${step}`]) f[step] = step === "exc" ? undefined : null;
  }
  W.just = path;
  W.dials = dialsOf(W);
  W.web = null;
  W.needs = null;
  W.checks = null;
}
export function lock(W, path, on = true) {
  if (on) W.locks[path] = true;
  else delete W.locks[path];
}
// Deal one step again: the next card in its stream that isn't the one it had
// (a set, a Face or a roll included), unless six goes can't find one.
const sameAs = (p) => (p == null ? "" : Array.isArray(p) ? p.map((x) => x.id).join("|") : p.nameId ? `${p.nameId}|${p.threat}` : String(p.id ?? p.k ?? `${p.size}|${p.die}`));
export function redeal(T, W, path) {
  const was = pickAt(W, path);
  let first = null;
  for (let go = 0; go < 6; go++) {
    W.tries[path] = (W.tries[path] ?? 0) + 1;
    [first] = options(T, W, path, 1, { not: was?.id ?? was?.k ?? was?.size ?? null });
    if (was == null || path.endsWith(":exc") || sameAs(first) !== sameAs(was)) break;
  }
  choose(T, W, path, first ?? null);
  return dealRest(T, W);
}
// The pick a step's got now.
export function pickAt(W, path) {
  const [head, a, b] = path.split(":");
  if (head === "ask") return W.asking[a] ?? null;
  if (head === "tension") return W.tension;
  if (head === "seat") return W.seats[Number(a)] ?? null;
  if (head === "f") return W.factions[Number(a)]?.[b] ?? null;
  return null;
}

// Every step still to deal, in order, then the web, the needs and the checks.
export function dealRest(T, W) {
  for (const q of QUESTIONS) if (!W.asking[q]) W.asking[q] = options(T, W, `ask:${q}`, 1)[0] ?? null;
  if (!W.tension) W.tension = options(T, W, "tension", 1)[0];
  W.dials = dialsOf(W);
  for (let k = 0; k < W.s; k++) if (!W.seats[k]) W.seats[k] = options(T, W, `seat:${k}`, 1)[0] ?? null;
  for (let i = 0; i < W.n; i++) dealFaction(T, W, i, EARLY);
  for (let i = 0; i < W.n; i++) dealFaction(T, W, i, LATE);
  if (!W.web) dealWeb(T, W);
  if (!W.needs) dealNeeds(T, W);
  if (!W.checks) runChecks(T, W);
  return W;
}
function dealFaction(T, W, i, steps = STEPS) {
  const f = W.factions[i];
  for (const step of steps) {
    // Everything after a card's seat and size reads them.
    if (step !== "seat" && step !== "size" && (!f.seat || !f.size)) break;
    const path = `f:${i}:${step}`;
    if (step === "exc" ? f.exc !== undefined : f[step] != null) continue;
    f[step] = options(T, W, path, 1)[0] ?? null;
    // When nothing fits, an agenda or a Secret takes core.yaml's fallback,
    // so the card's Face and name still get dealt.
    if (f[step] == null && step === "agenda") f.agenda = fallbackAgenda(T, W, i);
    if (f[step] == null && step === "secret") f.secret = fallbackSecret(T, W, i);
  }
  f.offers = offersOf(W, i);
}
// core.yaml's fallbacks, as a card's pick.
function fallbackAgenda(T, W, i) {
  const F = T.core.fallbacks.agenda;
  return { ...keepOf({ id: F.id, text: F.text, die: F.die, aims: ["seat"], why: "" }), at: aimOf(W, i, ["seat"], rngOf(W.seed, "fallback", "aims", i)) };
}
function fallbackSecret(T, W, i, strange = false) {
  const others = dealt(W, i);
  const F = strange || (T.core.fallbacks.secret.rival && !others.length && !T.core.fallbacks.strange.rival) ? T.core.fallbacks.strange : T.core.fallbacks.secret;
  const at = F.rival && others.length ? (others.includes((i + 1) % W.n) ? (i + 1) % W.n : others[0]) : null;
  return { ...keepOf({ id: F.id, tag: F.tag, text: F.tag, more: F.more, ways: F.ways, rival: F.rival, strange: strange || F.strange, why: "" }), at };
}
// Bond threads the card says have already happened, as cards to keep or
// swipe away, at most two.
function offersOf(W, i) {
  const f = W.factions[i];
  const seen = new Set();
  const out = [];
  for (const p of [f.type, f.method, f.want, ...(f.assets ?? [])]) {
    for (const o of p?.offers ?? []) {
      if (out.length < 2 && !seen.has(o.text)) {
        seen.add(o.text);
        out.push({ ...o });
      }
    }
  }
  return out;
}

// The web: the factions round a ring, each with a rival in the next one, an
// ally or a debt in the one after, and a wildcard in the one after that,
// skipped on boards of four or five, where it comes back round.
function dealWeb(T, W) {
  const rand = randOf(W, "web");
  const ring = shuffle(
    W.factions.map((_, i) => i),
    rand,
  );
  const pairs = new Set();
  const web = [];
  const used = new Set();
  const tie = (kinds, bond, key) => {
    const r2 = rngOf(W.seed, "tie", key, W.tries.web ?? 0);
    const rows = T.core.ties.filter((t) => kinds.includes(t.kind) && (!bond || t.bond === bond));
    const fresh = rows.filter((t) => !used.has(t.id));
    const t = pick(fresh.length ? fresh : rows, r2);
    if (t) used.add(t.id);
    return t;
  };
  const n = ring.length;
  const steps = [
    [1, ["rival"]],
    [2, ["ally", "debt"]],
  ];
  if (n >= 6) steps.push([3, ["wildcard"]]);
  for (const [by, kinds] of steps) {
    for (let p = 0; p < n; p++) {
      const a = ring[p];
      const b = ring[(p + by) % n];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (a === b || pairs.has(key)) continue;
      pairs.add(key);
      const bond = kinds[0] === "wildcard" ? (rand() < HOSTILE[W.dials.tense] ? "hostile" : "bond") : null;
      const t = tie(kinds, bond, key);
      if (!t) continue;
      web.push({ a, b, kind: t.kind, tie: tieOf(t), at: aimsOfTie(W, t, a, b, rngOf(W.seed, "tie-at", key, W.tries.web ?? 0)) });
    }
  }
  W.web = web;
}
const tieOf = (t) => ({ id: t.id, text: t.text, back: t.back, kind: t.kind, bond: t.bond ?? null });
function aimsOfTie(W, t, a, b, rand) {
  const at = {};
  const words = `${t.text} ${t.back ?? ""}`;
  if (words.includes("{res}")) at.res = pick((W.factions[a].res ?? []).map((r) => r.id), rand);
  if (words.includes("{seat}")) at.seat = W.factions[b].seat?.k ?? null;
  return at;
}

// Needs: one faction in three (as tense says) has an asset with nothing
// paying for it, never people, and a faction with an extra resource gets a
// hostile thread toward it, so the obvious trade's blocked.
function extrasOf(W, j) {
  const f = W.factions[j];
  return Math.max(0, (f.res?.length ?? 0) - (f.assets?.length ?? 0));
}
const needsOf = (W) => Math.max(W.n >= 5 ? 1 : 0, Math.round(W.n * NEEDS[W.dials.tense]));
function dealNeeds(T, W, { only = null } = {}) {
  W.needs = [];
  const rand = randOf(W, "needs");
  const count = needsOf(W);
  const order = shuffle(
    W.factions.map((_, i) => i),
    rand,
  ).sort((x, y) => extrasOf(W, x) - extrasOf(W, y));
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  for (const i of order) {
    if (W.needs.length >= count) break;
    if (isHeld(W, `f:${i}:assets`) && only !== "block") continue;
    const card = cardOf(W, i);
    const held = heldRoles(W, i);
    const mine = new Set((W.factions[i].assets ?? []).map((a) => a.role));
    const cands = P.assets
      .filter((r) => !r.power && fits(r, card, board) && !held.has(r.role) && !mine.has(r.role))
      .map((r) => {
        const fit = fitOf(r, card, board);
        return { w: weightOf(W, r, fit), r, fit };
      });
    const [c] = draw(cands, rngOf(W.seed, "need", i, W.tries.needs ?? 0));
    if (!c) continue;
    const need = { i, asset: assetOf(T, c.r, becauseOf(T, c.fit.src)), by: null, tie: null, at: {} };
    // Whoever's got the extra resource, a faction already blocking one less likely.
    const blocking = (j) => W.needs.filter((x) => x.by === j).length;
    const holders = W.factions.map((_, j) => (j !== i && extrasOf(W, j) > 0 ? { w: 1 / (1 + 3 * blocking(j)), j } : null)).filter(Boolean);
    const by = draw(holders, rngOf(W.seed, "block", i, W.tries.needs ?? 0))[0]?.j ?? null;
    if (by != null) {
      const rows = T.core.ties.filter((x) => x.kind === "blocked");
      const fresh = rows.filter((x) => !W.needs.some((y) => y.tie?.id === x.id));
      const t = pick(fresh.length ? fresh : rows, rngOf(W.seed, "blocked", i, W.tries.needs ?? 0));
      if (t) Object.assign(need, { by, tie: tieOf(t), at: aimsOfTie(W, t, by, i, rngOf(W.seed, "blocked-at", i, W.tries.needs ?? 0)) });
    }
    W.needs.push(need);
  }
}

// The checks, before anyone sees the board. Only what fails is dealt again,
// up to three times, then a fallback from core.yaml goes in.
const strangeCount = (W) => {
  let c = W.seats.filter((s) => s?.strange).length;
  for (const f of W.factions) {
    for (const step of ["type", "exc", "method", "want", "agenda", "secret", "name"]) if (f[step]?.strange) c++;
    c += (f.res ?? []).filter((r) => r.strange).length + (f.assets ?? []).filter((a) => a.strange).length;
    if (f.face?.strange) c++;
  }
  return c + (W.needs ?? []).filter((n) => n.asset.strange).length;
};
function passes(T, W, key) {
  if (key === "rival") return W.factions.every((_, i) => (W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i)));
  if (key === "block") return W.n < 5 || (W.needs ?? []).some((n) => n.by != null);
  if (key === "secret") return W.factions.some((f) => f.secret?.at != null);
  if (key === "unique") {
    const seen = new Set();
    for (const r of [...W.factions.flatMap((f) => (f.assets ?? []).filter((a) => !a.power).map((a) => a.role)), ...(W.needs ?? []).map((n) => n.asset.role)]) {
      if (seen.has(r)) return false;
      seen.add(r);
    }
    return true;
  }
  if (key === "aims") return W.factions.every((f, i) => aimOk(W, i, f.agenda));
  if (key === "strange") return strangeCount(W) > 0;
  return true;
}
function aimOk(W, i, ag) {
  if (!ag?.aims?.length) return false;
  return ag.aims.every((a) => {
    const v = ag.at?.[a];
    if (a === "seat") return Number.isInteger(v) && Boolean(W.seats[v]);
    if (a === "rival") return Number.isInteger(v) && v !== i && Boolean(W.factions[v]?.type);
    const list = a === "res" ? "res" : "assets";
    return v && v.j !== i && (W.factions[v.j]?.[list] ?? []).some((x) => x.id === v.id);
  });
}
function runChecks(T, W) {
  W.fixes = [];
  W.fallbacks = [];
  for (const key of CHECKS) {
    for (let t = 1; t <= 3 && !passes(T, W, key); t++) fix(T, W, key, t);
    if (!passes(T, W, key)) fallback(T, W, key);
  }
  W.checks = CHECKS.map((k) => ({ k, ok: passes(T, W, k) }));
}
// What the checks leave alone: a step she's locked, and the one she's just
// picked or dealt again, so Deal again always shows her something new.
const isHeld = (W, path) => Boolean(W.locks[path]) || W.just === path;
// The faction a check deals again, picked from those it's still free to.
function freeFaction(W, step, key, t, ok = () => true) {
  const free = W.factions.map((f, i) => (!isHeld(W, `f:${i}:${step}`) && ok(f, i) ? i : null)).filter((i) => i !== null);
  return pick(free, rngOf(W.seed, "fix", key, t));
}
function redealStep(T, W, i, step, only, key, t) {
  const path = `f:${i}:${step}`;
  W.tries[path] = (W.tries[path] ?? 0) + 1;
  const got = options(T, W, path, 1, { only })[0];
  if (got === undefined || (got === null && step !== "exc")) return false;
  W.factions[i][step] = got;
  if (step === "assets") W.factions[i].offers = offersOf(W, i);
  W.fixes.push({ k: key, path, t });
  return true;
}
// An agenda whose aim's gone (another faction's resource or asset dealt
// again) keeps its card and finds something else to aim at, on the same
// faction if it can.
function reaim(W, i, t) {
  const ag = W.factions[i].agenda;
  if (!ag?.aims?.length) return false;
  const rand = rngOf(W.seed, `f:${i}:agenda`, W.tries[`f:${i}:agenda`] ?? 0, "aim", t);
  const at = { ...(ag.at ?? {}) };
  for (const a of ag.aims) {
    if (aimOk(W, i, { aims: [a], at })) continue;
    const j = at[a]?.j;
    const list = (a === "res" || a === "asset") && j != null && j !== i ? (W.factions[j]?.[a === "res" ? "res" : "assets"] ?? []) : [];
    if (list.length) at[a] = { j, id: pick(list, rand).id };
    else Object.assign(at, aimOf(W, i, [a], rand));
  }
  ag.at = at;
  return aimOk(W, i, ag);
}
// A seat nobody holds, dealt again, which nothing on a card reads.
function redealSeat(T, W, k, only, key, t) {
  const path = `seat:${k}`;
  W.tries[path] = (W.tries[path] ?? 0) + 1;
  const got = options(T, W, path, 1, { only })[0];
  if (!got) return false;
  W.seats[k] = got;
  W.fixes.push({ k: key, path, t });
  return true;
}
function fix(T, W, key, t) {
  if (key === "rival") {
    W.tries.web = (W.tries.web ?? 0) + 1;
    dealWeb(T, W);
    W.fixes.push({ k: key, path: "web", t });
  } else if (key === "block") {
    // With nobody holding an extra resource there's no trade to block, so a
    // faction with an asset that does one thing is dealt its assets again
    // with one resource left over.
    const needy = new Set((W.needs ?? []).map((x) => x.i));
    if (!W.factions.some((_, j) => !needy.has(j) && extrasOf(W, j) > 0)) {
      const i = freeFaction(W, "assets", key, t, (f, j) => !needy.has(j) && (f.res?.length ?? 0) > 0 && (f.assets ?? []).some((a) => !a.power));
      if (i != null) redealStep(T, W, i, "assets", "extra", key, t);
    }
    W.tries.needs = (W.tries.needs ?? 0) + 1;
    dealNeeds(T, W, { only: "block" });
    W.fixes.push({ k: key, path: "needs", t });
  } else if (key === "secret") {
    const i = freeFaction(W, "secret", key, t, (f, j) => dealt(W, j).length > 0);
    if (i != null) redealStep(T, W, i, "secret", "rival", key, t);
  } else if (key === "unique") {
    const seen = new Set();
    W.factions.forEach((f, i) => {
      for (const a of (f.assets ?? []).filter((x) => !x.power)) {
        if (seen.has(a.role) && !isHeld(W, `f:${i}:assets`)) redealStep(T, W, i, "assets", null, key, t);
        seen.add(a.role);
      }
    });
  } else if (key === "aims") {
    W.factions.forEach((f, i) => {
      if (aimOk(W, i, f.agenda)) return;
      if (reaim(W, i, t)) W.fixes.push({ k: key, path: `f:${i}:agenda`, t, aim: true });
      else if (!isHeld(W, `f:${i}:agenda`)) redealStep(T, W, i, "agenda", null, key, t);
    });
  } else if (key === "strange") {
    // A seat nobody holds first, then a Secret, since nothing else on a card
    // reads either of them, so no other step has to be dealt again.
    const taken = new Set(W.factions.map((f) => f.seat?.k));
    const free = W.seats.map((s, k) => (s && !taken.has(k) && !isHeld(W, `seat:${k}`) ? k : null)).filter((k) => k !== null);
    if (t === 1 && free.length && redealSeat(T, W, pick(free, rngOf(W.seed, "fix", key, t)), "strange", key, t)) return;
    const rivals = W.factions.filter((f) => f.secret?.at != null).length;
    const i = freeFaction(W, "secret", key, t, (f) => f.secret?.at == null || rivals > 1);
    if (i != null) redealStep(T, W, i, "secret", "strange", key, t);
  }
}
function fallback(T, W, key) {
  const F = T.core.fallbacks;
  const near = (i) => (i + 1) % W.n;
  W.fallbacks.push(key);
  if (key === "rival") {
    W.factions.forEach((_, i) => {
      if (!(W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i))) W.web.push({ a: i, b: near(i), kind: "rival", tie: tieOf(F.rival), at: aimsOfTie(W, F.rival, i, near(i), rngOf(W.seed, "fallback", i)) });
    });
  } else if (key === "block") {
    const need = W.needs?.[0];
    if (!need) {
      W.fallbacks.pop();
      return;
    }
    const by = W.factions.map((f, j) => ({ j, n: f.res?.length ?? 0 })).filter((x) => x.j !== need.i).sort((x, y) => y.n - x.n)[0]?.j ?? near(need.i);
    Object.assign(need, { by, tie: tieOf(F.block), at: aimsOfTie(W, F.block, by, need.i, rngOf(W.seed, "fallback", "block")) });
  } else if (key === "secret") {
    const i = freeFaction(W, "secret", "fallback", 0, (f, j) => dealt(W, j).length > 0);
    if (i == null) {
      W.fallbacks.pop();
      return;
    }
    W.factions[i].secret = fallbackSecret(T, W, i);
  } else if (key === "unique") {
    // The factions she's locked keep theirs, and the others give theirs up.
    const seen = new Set();
    const locked = (i) => isHeld(W, `f:${i}:assets`);
    W.factions.forEach((f, i) => locked(i) && (f.assets ?? []).forEach((a) => !a.power && seen.add(a.role)));
    W.factions.forEach((f, i) => {
      if (!locked(i)) f.assets = (f.assets ?? []).filter((a) => a.power || (!seen.has(a.role) && seen.add(a.role)));
    });
  } else if (key === "aims") {
    W.factions.forEach((f, i) => {
      if (!aimOk(W, i, f.agenda) && !isHeld(W, `f:${i}:agenda`)) f.agenda = fallbackAgenda(T, W, i);
    });
  } else if (key === "strange") {
    const rivals = W.factions.filter((f) => f.secret?.at != null).length;
    const i = W.factions.findIndex((f, j) => !isHeld(W, `f:${j}:secret`) && (f.secret?.at == null || rivals > 1));
    if (i < 0) {
      W.fallbacks.pop();
      return;
    }
    W.factions[i].secret = fallbackSecret(T, W, i, true);
  }
}

// The whole world in one go: Deal it all.
export function dealWorld(T, opts) {
  return dealRest(T, start(T, opts));
}

// The world as the board will have it, every slot filled with the words the
// board so far gives it: each faction's card the way board.js keeps one (its
// threads by the index of the faction they're toward), and the seats.
export function cardsOf(T, W) {
  const nameOf = (i) => {
    const f = W.factions[i];
    return f?.name ? fill(f.name.text, { seat: seatName(i) }) : "";
  };
  const seatName = (i) => {
    const k = W.factions[i]?.seat?.k;
    return k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "";
  };
  const asName = (i) => ({ text: nameOf(i), name: true });
  const resText = (j, id) => {
    const r = (W.factions[j]?.res ?? []).find((x) => x.id === id);
    return r ? fill(r.text, { seat: seatName(j) }) : "";
  };
  const assetText = (j, id) => {
    const a = (W.factions[j]?.assets ?? []).find((x) => x.id === id);
    return a ? { text: fill(a.text, { seat: seatName(j) }), name: true } : "";
  };
  const factions = W.factions.map((f, i) => {
    const seat = seatName(i);
    const slot = (at = {}) => ({
      seat: at.seat != null && W.seats[at.seat] ? { text: W.seats[at.seat].text, name: true } : seat,
      rival: at.rival != null ? asName(at.rival) : "",
      res: at.res ? resText(at.res.j, at.res.id) : "",
      asset: at.asset ? assetText(at.asset.j, at.asset.id) : "",
    });
    const threads = [];
    for (const t of W.web ?? []) {
      if (t.a !== i && t.b !== i) continue;
      const other = t.a === i ? t.b : t.a;
      const vals = (me, them) => ({ a: asName(me), b: asName(them), res: t.at?.res ? resText(t.a, t.at.res) : "", seat: t.at?.seat != null && W.seats[t.at.seat] ? { text: W.seats[t.at.seat].text, name: true } : "" });
      if (t.kind === "wildcard") {
        if (t.a === i) threads.push({ text: fill(t.tie.text, vals(i, other)), kind: t.tie.bond, s: "whole", to: other });
      } else {
        const kind = t.kind === "rival" ? "hostile" : "bond";
        const words = t.a === i ? t.tie.text : t.tie.back || t.tie.text;
        threads.push({ text: fill(words, vals(i, other)), kind, s: "whole", to: other });
      }
    }
    for (const n of W.needs ?? []) {
      if (n.by === i && n.tie) threads.push({ text: fill(n.tie.text, { a: asName(i), b: asName(n.i), res: n.at?.res ? resText(i, n.at.res) : "", seat: n.at?.seat != null && W.seats[n.at.seat] ? { text: W.seats[n.at.seat].text, name: true } : seatName(n.i) }), kind: "hostile", s: "whole", to: n.i });
    }
    const secret = f.secret;
    const rival = secret?.at != null ? asName(secret.at) : "";
    const wayOf = (w) => ({ text: fill(w, { rival, seat }), name: /^\{/.test(w) });
    const T2 = T.core.templates;
    return {
      seat: f.seat?.k ?? null,
      size: f.size?.size ?? null,
      die: f.size?.die ?? null,
      steps: 1 + (f.assets ?? []).filter((a) => a.power).length,
      name: nameOf(i),
      about: f.type && f.method ? fill(T2.about, { type: f.type.text, method: f.method.text }) : "",
      want: f.want ? fill(f.want.text, {}) : "",
      face: f.face ? fill(T2.face, { name: { text: f.face.name, name: true }, threat: f.face.threatName }) : "",
      ch: f.face?.ch ?? null,
      threat: f.face ? { key: f.face.threat, name: f.face.threatName, is: f.face.is, tags: f.face.tags } : null,
      secret: secret ? fill(secret.tag, { rival, seat }) : "",
      more: secret ? [secret.more ? fill(secret.more, { rival, seat }) : "", secret.ways?.length === 2 ? fill(T2.ways, { one: wayOf(secret.ways[0]), two: wayOf(secret.ways[1]) }) : ""].filter(Boolean).join(" ") : "",
      res: (f.res ?? []).map((r) => ({ text: fill(r.text, { seat }), x: 1 })),
      assets: [...(f.assets ?? []).map((a) => ({ text: fill(a.text, { seat }), does: a.does, power: a.power, x: 1, off: false })), ...(W.needs ?? []).filter((n) => n.i === i).map((n) => ({ text: fill(n.asset.text, { seat }), does: n.asset.does, power: false, x: 1, off: true }))],
      agendas: f.agenda ? [{ text: fill(f.agenda.text, slot(f.agenda.at)), die: f.agenda.die, then: "" }] : [],
      pub: [],
      mor: [],
      loy: [],
      threads,
      offers: f.offers.map((o) => ({ ...o })),
      exception: f.exc ? { text: f.exc.text, reason: f.exc.reason } : null,
    };
  });
  const seats = W.seats.map((s, k) => (s ? { k, name: s.text, role: s.role, notice: s.notice, tags: s.tags, held: W.factions.findIndex((f) => f.seat?.k === k) } : null)).filter(Boolean);
  return { factions, seats };
}

// What was dealt, as doc.build keeps it: plain words and numbers, nothing of
// the tables but what the picks hold, and whole enough that fromRecord()
// makes it a world to deal from again (Add a faction, or a build carried on).
export function recordOf(W) {
  return JSON.parse(
    JSON.stringify({
      v: 1,
      seed: W.seed,
      recipe: W.recipe,
      n: W.n,
      s: W.s,
      dials: W.dials,
      fixed: W.fixed ?? null,
      asking: W.asking,
      tension: W.tension,
      seats: W.seats,
      factions: W.factions,
      web: W.web,
      needs: W.needs,
      checks: W.checks,
      fixes: W.fixes,
      fallbacks: W.fallbacks,
      tries: W.tries,
      locks: W.locks,
    }),
  );
}
export function fromRecord(rec) {
  const W = JSON.parse(JSON.stringify(rec));
  W.n = W.factions.length;
  W.s = W.seats.length;
  W.fixed = W.fixed && typeof W.fixed === "object" ? W.fixed : null;
  for (const k of ["tries", "locks"]) W[k] = W[k] && typeof W[k] === "object" ? W[k] : {};
  for (const k of ["fixes", "fallbacks"]) W[k] = Array.isArray(W[k]) ? W[k] : [];
  for (const f of W.factions) if (!Array.isArray(f.offers)) f.offers = [];
  return W;
}
