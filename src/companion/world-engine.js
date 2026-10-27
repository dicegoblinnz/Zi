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
//   seed, recipe { region, era, twist }, n (factions, 4 to 12), s (seats, n + 2)
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
//             she's locked, not the card each step had before it was dealt
//             again. Each step has its own stream of randomness from the
//             seed, its path and its tries, so dealing one again leaves
//             every other step as it was.
//
// A step's path: ask:holds, ask:runs, ask:notices, tension, seat:<k>, and
// f:<i>:<step> for the factions' steps. Picks keep their words, so the world
// keeps what was dealt, never just the seed (the tables change most weeks).
// A pick she writes herself is { own: true, text } and is kept as she wrote
// it: no check deals it again.
//
// The screens (stage 4) use options() for a step's three cards, choose() to
// put one on, lock(), redeal() for Deal again, dealRest(T, W, { finish:
// false }) to deal what's still empty, and dealRest() or dealWorld() to finish
// the board: the web, the needs and the checks. cardsOf() is the board as
// board.js keeps it, recordOf() what was dealt and resume() a world from it.

export const REGIONS = ["town", "city", "country", "world", "stars"];
export const SIZES = ["small", "local", "city", "great"];
export const DIALS = ["tense", "strange", "rich", "ruled"];
export const STEPS = ["seat", "size", "type", "exc", "method", "want", "res", "assets", "agenda", "face", "secret", "name"];
export const QUESTIONS = ["holds", "runs", "notices"];
export const CHECKS = ["whole", "power", "rival", "block", "secret", "unique", "aims", "strange"];
// The bags no two factions share a row from till the bag's empty, and the
// steps they're dealt at. A pick from a bag that had run out says so (again).
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

// Draw up to n, each by its weight, none twice. The first drawn is the same
// however many are drawn.
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
// sentence. Nothing's added but the words in the slots, and a slot with
// nothing to fill it stays as it is, so it can't hide.
export function fill(tpl, vals) {
  const out = String(tpl ?? "").replace(/\{([a-z]+)\}/g, (m, k, at) => {
    const v = vals[k];
    const text = v == null ? "" : typeof v === "object" ? String(v.text ?? "") : String(v);
    if (!text) return m;
    let s = text.replace(/[.]+$/, "");
    if (at > 0) s = typeof v === "object" && v.name ? s.replace(/^The /, "the ") : s.replace(/^(The|A|An) /, (x) => x.toLowerCase()).replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
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
    dials: fixed ? { ...fixed } : { tense: 1, strange: 1, rich: 1, ruled: 1 },
    tries: {},
    locks: {},
    not: {},
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

// A world from what was dealt (recordOf()), to carry on with.
export function resume(T, rec) {
  const W = start(T, { recipe: rec.recipe, dials: rec.fixed ?? null, seed: rec.seed, factions: rec.n });
  for (const k of ["tries", "locks", "not"]) W[k] = rec[k] && typeof rec[k] === "object" ? { ...rec[k] } : {};
  for (const q of QUESTIONS) W.asking[q] = rec.asking?.[q] ?? null;
  W.tension = rec.tension ?? null;
  W.seats = W.seats.map((_, k) => rec.seats?.[k] ?? null);
  W.factions = W.factions.map((_, i) => ({ ...blankFaction(), ...(rec.factions?.[i] ?? {}), offers: rec.factions?.[i]?.offers ?? [] }));
  for (const k of ["web", "needs", "checks"]) W[k] = rec[k] ?? null;
  W.fixes = rec.fixes ?? [];
  W.fallbacks = rec.fallbacks ?? [];
  W.dials = dialsOf(W);
  return W;
}

// The dials, from the asking's answers and the tension, unless they're fixed.
function dialsOf(W) {
  if (W.fixed) return { ...W.fixed };
  const d = { tense: 1, strange: 1, rich: 1, ruled: 1 };
  for (const p of [...QUESTIONS.map((q) => W.asking[q]), W.tension]) for (const [k, v] of Object.entries(p?.dials ?? {})) if (k in d) d[k] += Number(v) || 0;
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
    if (a) for (const t of a.tags ?? []) if (!tags.has(t)) tags.set(t, { kind: "answer", text: a.text });
  }
  if (W.tension) for (const t of W.tension.tags ?? []) if (!tags.has(t)) tags.set(t, { kind: "tension", text: W.tension.text });
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
  if (seat) add(tags, [seat.role, ...(seat.tags ?? [])], { kind: "seat", text: seat.text, name: true });
  for (const step of ["type", "method", "want"]) {
    const p = f[step];
    if (!p || p.own) continue;
    const src = { kind: step, text: p.text };
    add(tags, [p.role, ...(p.tags ?? [])], src);
    add(leans, p.leans ?? [], src);
  }
  if (f.exc) add(tags, f.exc.gives ?? [], { kind: "exception", text: f.exc.reason });
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
    W.seats.forEach((s, k) => s && k !== but && s.id && ids.add(s.id));
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
// bag's empty, each of those marked as dealt again.
function bagged(rows, used) {
  const fresh = rows.filter((r) => !used.has(r.id));
  return fresh.length ? fresh.map((r) => ({ r, again: false })) : rows.map((r) => ({ r, again: true }));
}
const dealt = (W, i) => W.factions.map((f, j) => (j !== i && f.type ? j : null)).filter((j) => j !== null);
const own = (p) => Boolean(p?.own);

// A step's candidates, each { w, ...the pick }.
function candidates(T, W, path, { only = null } = {}) {
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  const [head, a, b] = path.split(":");
  const strangeOnly = only === "strange";
  const keep = (list) => (strangeOnly ? list.filter((x) => x.r.strange) : list);
  const of = (r, fit, extra = {}) => ({ w: weightOf(W, r, fit), id: r.id, text: r.text, role: r.role, tags: r.tags, leans: r.leans, offers: r.offers, strange: r.strange, ...extra });
  if (head === "ask") {
    return T.core.asking[a].filter((r) => fits(r, null, board)).map((r) => of(r, fitOf(r, null, board), { dials: r.dials, why: "", by: null }));
  }
  if (head === "seat") {
    const k = Number(a);
    const roles = new Map();
    W.seats.forEach((s, j) => s && j !== k && roles.set(s.role, (roles.get(s.role) ?? 0) + 1));
    return keep(bagged(P.seats.filter((r) => fits(r, null, board)), usedBy(W, "seat", k))).map(({ r, again }) => {
      const fit = fitOf(r, null, board);
      return { ...of(r, fit, { notice: r.notice, sizes: r.sizes, again, ...becauseOf(T, fit.src) }), w: weightOf(W, r, fit) * 0.5 ** (roles.get(r.role) ?? 0) };
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
  const ofRow = ({ r, again }, extra = {}) => {
    const fit = fitOf(r, card, board);
    return of(r, fit, { again, ...becauseOf(T, fit.src), ...extra });
  };
  if (b === "type" || b === "method" || b === "want") return pool(b === "type" ? P.types : b === "method" ? P.methods : P.wants, b).map((x) => ofRow(x));
  if (b === "exc") {
    // An exception's never dealt twice: with none fresh, there isn't one.
    const used = usedBy(W, "exc", i);
    return P.exceptions.filter((r) => !used.has(r.id) && fits(r, card, board) && r.when.every((t) => has(card, board, t)) && (!strangeOnly || r.strange)).map((r) => ({ w: r.w, id: r.id, text: r.text, reason: r.reason, drops: r.drops, gives: r.gives, strange: r.strange }));
  }
  if (b === "secret") {
    const others = dealt(W, i);
    return pool(P.secrets.filter((r) => (only === "rival" ? r.rival : true) && (!r.rival || others.length)), "secret").map((x) => ofRow(x, { tag: x.r.tag, more: x.r.more, ways: x.r.ways, rival: x.r.rival }));
  }
  if (b === "agenda") {
    const others = dealt(W, i);
    const can = (aim) => aim === "seat" || (aim === "rival" && others.length) || (aim === "res" && others.some((j) => W.factions[j].res?.length)) || (aim === "asset" && others.some((j) => W.factions[j].assets?.length));
    return pool(P.agendas.filter((r) => r.aims.every(can)), "agenda").map((x) => ofRow(x, { die: x.r.die, aims: x.r.aims }));
  }
  if (b === "name") {
    const kind = f.type?.role;
    const mine = P.names.filter((r) => !r.role || r.role === kind);
    return pool(mine.length ? mine : P.names, "name").map((x) => ofRow(x, { why: "", by: null }));
  }
  return [];
}

// The fields a pick keeps: its words and what it is, never the row itself.
const KEEP = ["id", "text", "role", "tags", "leans", "offers", "strange", "again", "why", "by", "notice", "sizes", "dials", "tag", "more", "ways", "rival", "die", "aims", "reason", "drops", "gives", "power", "does"];
const keepOf = (c) => Object.fromEntries(KEEP.filter((k) => c[k] !== undefined).map((k) => [k, Array.isArray(c[k]) ? c[k].map((x) => (x && typeof x === "object" ? { ...x } : x)) : c[k]]));
const keyOfPick = (p) => p?.id ?? p?.k ?? p?.size ?? p?.nameId ?? null;

// A whole set, for the steps that deal one: a faction's resources, or its
// assets.
function dealRes(T, W, i, rand, { only = null } = {}) {
  const f = W.factions[i];
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  const card = cardOf(W, i);
  const size = T.book.sizes[f.size.size];
  // One with a resource to spare holds as many as its size can.
  const count = only === "extra" || W.dials.rich === 2 ? size.rhi : W.dials.rich === 0 ? size.rlo : size.rlo + Math.floor(rand() * (size.rhi - size.rlo + 1));
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
    out.push(keepOf({ id: c.r.id, text: c.r.text, role: c.r.role, tags: c.r.tags, strange: c.r.strange, ...becauseOf(T, c.fit.src, obvious(c)) }));
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
  const rows = P.assets.filter((r) => fits(r, card, board));
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
// The assets that do one thing held anywhere else on the board, by their
// role, and every need, its own included.
function heldRoles(W, but) {
  const roles = new Set();
  W.factions.forEach((f, j) => j !== but && f.assets?.forEach((a) => !a.power && a.role && roles.add(a.role)));
  W.needs?.forEach((n) => n.asset.role && roles.add(n.asset.role));
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
      const mine = W.factions[i].seat?.k;
      const seats = W.seats.map((s, k) => (s && k !== mine ? { w: taken.has(k) ? 1 : 2, k } : null)).filter(Boolean);
      out.seat = draw(seats, rand)[0]?.k ?? mine ?? 0;
    } else if (a === "rival") out.rival = pick(others, rand);
    else {
      const list = a === "res" ? "res" : "assets";
      const all = others.flatMap((j) => (W.factions[j][list] ?? []).filter((x) => x.id).map((x) => ({ j, id: x.id })));
      out[a] = pick(all, rand);
    }
  }
  return out;
}

// A step's cards: up to n, the first being what dealing picks. After Deal
// again, the card it had before isn't one of them while there's another.
export function options(T, W, path, n = 3, opts = {}) {
  W.dials = dialsOf(W);
  const rand = randOf(W, path, opts.only ?? "");
  const not = opts.not ?? W.not[path] ?? null;
  const [head, a, b] = path.split(":");
  if (head === "tension") {
    const rows = T.core.tension.map((r, k) => ({ r, k }));
    const left = rows.length > 1 && not != null ? rows.filter((x) => x.r.id !== not) : rows;
    const x = left[Math.floor(rand() * left.length) % left.length];
    return x ? [{ ...keepOf({ id: x.r.id, text: x.r.text, tags: x.r.tags, dials: x.r.dials, strange: x.r.strange, why: "" }), roll: x.k + 1 }] : [];
  }
  if (head === "f" && (b === "res" || b === "assets")) return [b === "res" ? dealRes(T, W, Number(a), rand, opts) : dealAssets(T, W, Number(a), rand, opts)];
  if (head === "f" && b === "exc") {
    // One card in six with an exception that fits it breaks the logic.
    let cands = candidates(T, W, path, opts);
    if (not != null && cands.some((c) => c.id !== not)) cands = cands.filter((c) => c.id !== not);
    if (!cands.length || (opts.only !== "exception" && rand() >= EXCEPTION)) return [null];
    const [c] = draw(cands, rand);
    return [c ? keepOf(c) : null];
  }
  if (head === "f" && b === "face") return faces(T, W, Number(a), path, n, not);
  let all = candidates(T, W, path, opts);
  if (not != null) {
    const other = all.filter((c) => keyOfPick(c) !== not);
    if (other.length) all = other;
  }
  const cands = draw(all, rand, n);
  const sub = (c) => rngOf(W.seed, path, W.tries[path] ?? 0, keyOfPick(c));
  if (head === "f" && b === "seat") return cands.map((c) => ({ k: c.k }));
  if (head === "f" && b === "size") {
    return cands.map((c) => {
      const s = T.book.sizes[c.size];
      const dice = [];
      for (let d = s.lo; d <= s.hi; d += 2) dice.push(d);
      return { size: c.size, die: pick(dice, sub(c)) };
    });
  }
  if (head === "f" && b === "agenda") return cands.map((c) => ({ ...keepOf(c), at: aimOf(W, Number(a), c.aims, sub(c)) }));
  if (head === "f" && b === "secret") return cands.map((c) => ({ ...keepOf(c), at: c.rival ? aimOf(W, Number(a), ["rival"], sub(c)).rival : null }));
  return cands.map((c) => keepOf(c));
}
// A face: a name from the pack and one of the Threat Builder's threats, at
// the Challenge its Power sends. The threats and the names have a stream each,
// so the first card's the same however many are drawn.
function faces(T, W, i, path, n, not) {
  const f = W.factions[i];
  const P = poolOf(T, W.recipe);
  const likely = new Set(T.core.faces[f.type?.role] ?? []);
  const tries = W.tries[path] ?? 0;
  const threats = draw(
    T.book.threats.map((t) => ({ w: likely.has(t.key) ? 5 : 1, t })),
    rngOf(W.seed, path, tries, "threat"),
    n,
  );
  let names = bagged(P.people, usedBy(W, "face", i));
  if (not != null && names.some((x) => x.r.id !== not)) names = names.filter((x) => x.r.id !== not);
  const drawn = draw(
    names.map((x) => ({ w: x.r.w, ...x })),
    rngOf(W.seed, path, tries, "name"),
    n,
  );
  const out = [];
  for (let k = 0; k < Math.min(threats.length, drawn.length); k++) {
    const t = threats[k].t;
    const r = drawn[k].r;
    out.push({ name: r.text, nameId: r.id, again: drawn[k].again, threat: t.key, threatName: t.name, is: t.is, ch: Math.max(1, f.size.die / 2), tags: t.tags.map((x) => ({ ...x })), strange: r.strange });
  }
  return out;
}

// Put a pick on a step. A faction's later steps that aren't locked are dealt
// again, since they read the card so far, and so are those of the faction
// sitting on a seat that changes. An answer that changes moves the dials for
// what's dealt from then on, and leaves what's dealt as it is.
export function choose(T, W, path, value) {
  const [head, a, b] = path.split(":");
  const clear = (i, from) => {
    for (const step of STEPS.slice(STEPS.indexOf(from) + 1)) if (!W.locks[`f:${i}:${step}`]) W.factions[i][step] = step === "exc" ? undefined : null;
  };
  if (head === "ask") W.asking[a] = value;
  else if (head === "tension") W.tension = value;
  else if (head === "seat") {
    W.seats[Number(a)] = value;
    W.factions.forEach((f, i) => f.seat?.k === Number(a) && clear(i, "seat"));
  } else if (head === "f") {
    W.factions[Number(a)][b] = value;
    clear(Number(a), b);
  }
  W.dials = dialsOf(W);
  W.web = null;
  W.needs = null;
  W.checks = null;
}
export function lock(W, path, on = true) {
  if (on) W.locks[path] = true;
  else delete W.locks[path];
}
// Deal one step again: the next card in its stream, never the one it had
// while there's another. A locked step stays as it is.
export function redeal(T, W, path, { finish = true } = {}) {
  if (W.locks[path]) return W;
  const was = keyOfPick(pickAt(W, path));
  W.tries[path] = (W.tries[path] ?? 0) + 1;
  if (was != null) W.not[path] = was;
  else delete W.not[path];
  const [first] = options(T, W, path, 1);
  choose(T, W, path, first ?? null);
  return dealRest(T, W, { finish });
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

// Every step still to deal, in order. Finishing deals the web, the needs and
// the checks too, before anyone sees the board.
export function dealRest(T, W, { finish = true } = {}) {
  for (const q of QUESTIONS) if (!W.asking[q]) W.asking[q] = options(T, W, `ask:${q}`, 1)[0] ?? null;
  if (!W.tension) W.tension = options(T, W, "tension", 1)[0] ?? null;
  W.dials = dialsOf(W);
  for (let k = 0; k < W.s; k++) if (!W.seats[k]) W.seats[k] = options(T, W, `seat:${k}`, 1)[0] ?? null;
  for (let i = 0; i < W.n; i++) dealFaction(T, W, i);
  if (!finish) return W;
  if (!W.web) dealWeb(T, W);
  if (!W.needs) dealNeeds(T, W);
  if (!W.checks) runChecks(T, W);
  return W;
}
function dealFaction(T, W, i) {
  const f = W.factions[i];
  for (const step of STEPS) {
    if (step === "exc" ? f.exc !== undefined : f[step] != null) continue;
    f[step] = options(T, W, `f:${i}:${step}`, 1)[0] ?? null;
    if (f[step] == null && step !== "exc") break;
  }
  f.offers = offersOf(W, i);
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
      const t = tieFor(T, W, kinds, bond, a, b, used, rngOf(W.seed, "tie", key, W.tries.web ?? 0));
      if (!t) continue;
      used.add(t.id);
      web.push({ a, b, kind: t.kind, tie: tieOf(t), at: aimsOfTie(W, t, a, b, rngOf(W.seed, "tie-at", key, W.tries.web ?? 0)) });
    }
  }
  W.web = web;
}
// A tie for a pair: one whose slots the pair can fill, fresh while there's one.
function tieFor(T, W, kinds, bond, a, b, used, rand) {
  const can = (t) => {
    const words = `${t.text} ${t.back ?? ""}`;
    return (!words.includes("{res}") || (W.factions[a].res ?? []).length > 0) && (!words.includes("{seat}") || W.factions[b].seat != null);
  };
  const rows = T.core.ties.filter((t) => kinds.includes(t.kind) && (!bond || t.bond === bond) && can(t));
  const fresh = rows.filter((t) => !used.has(t.id));
  return pick(fresh.length ? fresh : rows, rand);
}
const tieOf = (t) => ({ id: t.id, text: t.text, back: t.back ?? "", kind: t.kind, bond: t.bond ?? null });
function aimsOfTie(W, t, a, b, rand) {
  const at = {};
  const words = `${t.text} ${t.back ?? ""}`;
  if (words.includes("{res}")) at.res = pick((W.factions[a].res ?? []).map((r) => r.id).filter(Boolean), rand);
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
  const rand = randOf(W, "needs", only ?? "");
  const count = needsOf(W);
  const order = shuffle(
    W.factions.map((_, i) => i),
    rand,
  ).sort((x, y) => extrasOf(W, x) - extrasOf(W, y));
  const P = poolOf(T, W.recipe);
  const board = boardOf(T, W);
  for (const i of order) {
    if (W.needs.length >= count) break;
    if (W.locks[`f:${i}:assets`] || (W.factions[i].assets ?? []).some(own) || !W.factions[i].type) continue;
    const card = cardOf(W, i);
    const held = heldRoles(W, i);
    const mine = new Set((W.factions[i].assets ?? []).map((a) => a.role));
    const cands = P.assets
      .filter((r) => !r.power && fits(r, card, board) && !held.has(r.role) && !mine.has(r.role))
      .map((r) => {
        const fit = fitOf(r, card, board);
        return { w: weightOf(W, r, fit), r, fit };
      });
    const [c] = draw(cands, rngOf(W.seed, "need", i, W.tries.needs ?? 0, only ?? ""));
    if (!c) continue;
    const need = { i, asset: assetOf(T, c.r, becauseOf(T, c.fit.src)), by: null, tie: null, at: {} };
    // Whoever's got the extra resource, a faction already blocking one less likely.
    const blocking = (j) => W.needs.filter((x) => x.by === j).length;
    const holders = W.factions.map((_, j) => (j !== i && extrasOf(W, j) > 0 ? { w: 1 / (1 + 3 * blocking(j)), j } : null)).filter(Boolean);
    const by = draw(holders, rngOf(W.seed, "block", i, W.tries.needs ?? 0, only ?? ""))[0]?.j ?? null;
    if (by != null) {
      const fresh = new Set(W.needs.map((x) => x.tie?.id).filter(Boolean));
      const t = tieFor(T, W, ["blocked"], null, by, i, fresh, rngOf(W.seed, "blocked", i, W.tries.needs ?? 0));
      if (t) Object.assign(need, { by, tie: tieOf(t), at: aimsOfTie(W, t, by, i, rngOf(W.seed, "blocked-at", i, W.tries.needs ?? 0)) });
    }
    W.needs.push(need);
  }
}

// The checks, before anyone sees the board. Only what fails is dealt again,
// up to three times, then a fallback from core.yaml goes in. What she's
// locked or written herself is never dealt again or replaced, and a check
// that still fails says so (ok: false) for the screen to show.
const strangeCount = (W) => {
  let c = W.seats.filter((s) => s?.strange).length;
  for (const f of W.factions) {
    for (const step of ["type", "exc", "method", "want", "agenda", "secret", "name", "face"]) if (f[step]?.strange) c++;
    c += (f.res ?? []).filter((r) => r.strange).length + (f.assets ?? []).filter((a) => a.strange).length;
  }
  return c + (W.needs ?? []).filter((n) => n.asset.strange).length;
};
const lockedOrOwn = (W, i, step) => Boolean(W.locks[`f:${i}:${step}`]) || own(W.factions[i][step]);
// A dealt card's people reach the die its size picked.
const powerOk = (W, i) => {
  const f = W.factions[i];
  if (!f.size || !f.assets || lockedOrOwn(W, i, "size") || lockedOrOwn(W, i, "assets") || f.assets.some(own)) return true;
  return f.size.die === 2 * (1 + f.assets.filter((a) => a.power).length);
};
function passes(T, W, key) {
  if (key === "whole") return W.factions.every((f) => STEPS.every((s) => s === "exc" || f[s] != null));
  if (key === "power") return W.factions.every((_, i) => powerOk(W, i));
  if (key === "rival") return W.factions.every((_, i) => (W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i)));
  if (key === "block") return W.n < 5 || (W.needs ?? []).some((n) => n.by != null && n.by !== n.i && extrasOf(W, n.by) > 0);
  if (key === "secret") return W.factions.some((f) => f.secret?.at != null || (own(f.secret) && f.secret.rival));
  if (key === "unique") {
    const seen = new Set();
    for (const r of [...W.factions.flatMap((f) => (f.assets ?? []).filter((a) => !a.power && a.role && !own(a)).map((a) => a.role)), ...(W.needs ?? []).map((n) => n.asset.role)]) {
      if (seen.has(r)) return false;
      seen.add(r);
    }
    return true;
  }
  if (key === "aims") return W.factions.every((f, i) => own(f.agenda) || aimOk(W, i, f.agenda));
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
    return Boolean(v) && v.j !== i && (W.factions[v.j]?.[list] ?? []).some((x) => x.id === v.id);
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
// A faction a check can deal again, from those it's free to.
function freeFaction(W, step, key, t, ok = () => true) {
  const free = W.factions.map((f, i) => (!lockedOrOwn(W, i, step) && ok(f, i) ? i : null)).filter((i) => i !== null);
  return pick(free, rngOf(W.seed, "fix", key, t));
}
function redealStep(T, W, i, step, only, key, t) {
  if (lockedOrOwn(W, i, step)) return false;
  const path = `f:${i}:${step}`;
  if (step === "assets" && !only && (W.needs ?? []).some((n) => n.by === i)) only = "extra";
  W.tries[path] = (W.tries[path] ?? 0) + 1;
  const got = options(T, W, path, 1, { only })[0];
  if (got == null && step !== "exc") return false;
  W.factions[i][step] = got ?? null;
  W.factions[i].offers = offersOf(W, i);
  if (step === "res") mendAims(W, i);
  W.fixes.push({ k: key, path, t });
  return true;
}
// A tie that named one of a faction's resources it's since lost names one
// it's got now.
function mendAims(W, i) {
  const ids = (W.factions[i].res ?? []).map((r) => r.id).filter(Boolean);
  const mend = (t, key) => {
    if (t.at?.res != null && !ids.includes(t.at.res)) t.at.res = pick(ids, rngOf(W.seed, "mend", key, W.tries[`f:${i}:res`] ?? 0)) ?? null;
  };
  for (const t of W.web ?? []) if (t.a === i) mend(t, `${t.a}-${t.b}`);
  for (const n of W.needs ?? []) if (n.by === i) mend(n, `need-${n.i}`);
}
function fix(T, W, key, t) {
  if (key === "whole") {
    // The first step a card's missing, dealt again, and the rest after it.
    W.factions.forEach((f, i) => {
      const step = STEPS.find((s) => s !== "exc" && f[s] == null);
      if (step && redealStep(T, W, i, step, null, key, t)) dealFaction(T, W, i);
    });
  } else if (key === "power") {
    W.factions.forEach((_, i) => {
      if (!powerOk(W, i)) redealStep(T, W, i, "assets", null, key, t);
    });
  } else if (key === "rival") {
    W.tries.web = (W.tries.web ?? 0) + 1;
    dealWeb(T, W);
    W.fixes.push({ k: key, path: "web", t });
  } else if (key === "block") {
    // With nobody holding an extra resource there's no trade to block, so a
    // faction is dealt its assets again with one resource left over: one
    // with an asset that does one thing, or else one whose people take
    // every resource it's got, dealt as many as its size holds first.
    const needy = new Set((W.needs ?? []).map((x) => x.i));
    if (!W.factions.some((_, j) => !needy.has(j) && extrasOf(W, j) > 0)) {
      const oneThing = (f) => (f.assets ?? []).some((a) => !a.power);
      const room = (f, j) => !lockedOrOwn(W, j, "res") && !(f.res ?? []).some(own) && (f.res?.length ?? 0) < (T.book.sizes[f.size?.size]?.rhi ?? 0);
      const i = freeFaction(W, "assets", key, t, (f, j) => !needy.has(j) && (f.res?.length ?? 0) > 0 && !(f.assets ?? []).some(own) && (oneThing(f) || room(f, j)));
      if (i != null && (oneThing(W.factions[i]) || redealStep(T, W, i, "res", "extra", key, t))) redealStep(T, W, i, "assets", "extra", key, t);
    }
    W.tries.needs = (W.tries.needs ?? 0) + 1;
    dealNeeds(T, W, { only: "block" });
    W.fixes.push({ k: key, path: "needs", t });
  } else if (key === "secret") {
    const i = freeFaction(W, "secret", key, t, (f, j) => dealt(W, j).length > 0);
    if (i != null) redealStep(T, W, i, "secret", "rival", key, t);
  } else if (key === "unique") {
    const seen = new Set((W.needs ?? []).map((n) => n.asset.role));
    W.factions.forEach((f, i) => {
      const roles = (f.assets ?? []).filter((a) => !a.power && a.role && !own(a)).map((a) => a.role);
      if (roles.some((r) => seen.has(r))) redealStep(T, W, i, "assets", null, key, t);
      for (const r of (W.factions[i].assets ?? []).filter((a) => !a.power && a.role).map((a) => a.role)) seen.add(r);
    });
  } else if (key === "aims") {
    W.factions.forEach((f, i) => {
      if (!own(f.agenda) && !aimOk(W, i, f.agenda)) redealStep(T, W, i, "agenda", null, key, t);
    });
  } else if (key === "strange") {
    // Only a Secret or a name, since nothing else on the card reads them, and
    // never the only Secret naming another faction.
    const step = t === 2 ? "name" : "secret";
    const rivals = W.factions.filter((f) => f.secret?.at != null).length;
    const i = freeFaction(W, step, key, t, (f) => step !== "secret" || f.secret?.at == null || rivals > 1);
    if (i != null) redealStep(T, W, i, step, "strange", key, t);
  }
}
function fallback(T, W, key) {
  const F = T.core.fallbacks;
  const near = (i) => (i + 1) % W.n;
  const used = () => W.fallbacks.push(key);
  if (key === "power") {
    // The die comes down to the people it's got, and the size with it.
    W.factions.forEach((f, i) => {
      if (powerOk(W, i)) return;
      const die = Math.min(12, 2 * (1 + f.assets.filter((a) => a.power).length));
      const size = [...SIZES].reverse().find((s) => T.book.sizes[s].lo <= die && die <= T.book.sizes[s].hi) ?? f.size.size;
      f.size = { size, die };
      used();
    });
  } else if (key === "rival") {
    W.factions.forEach((_, i) => {
      if ((W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i))) return;
      W.web.push({ a: i, b: near(i), kind: "rival", tie: tieOf(F.rival), at: aimsOfTie(W, F.rival, i, near(i), rngOf(W.seed, "fallback", i)) });
      used();
    });
  } else if (key === "block") {
    const need = W.needs?.[0];
    if (!need) return;
    const by = W.factions.map((f, j) => ({ j, x: extrasOf(W, j), n: f.res?.length ?? 0 })).filter((x) => x.j !== need.i).sort((x, y) => y.x - x.x || y.n - x.n)[0]?.j ?? near(need.i);
    Object.assign(need, { by, tie: tieOf(F.block), at: aimsOfTie(W, F.block, by, need.i, rngOf(W.seed, "fallback", "block")) });
    used();
  } else if (key === "secret") {
    const i = freeFaction(W, "secret", "fallback", 0, (f, j) => dealt(W, j).length > 0);
    if (i == null) return;
    W.factions[i].secret = { ...keepOf({ id: F.secret.id, tag: F.secret.tag, text: F.secret.tag, more: F.secret.more, ways: F.secret.ways, rival: true, strange: F.secret.strange, why: "" }), at: near(i) };
    used();
  } else if (key === "unique") {
    const seen = new Set((W.needs ?? []).map((n) => n.asset.role));
    W.factions.forEach((f, i) => {
      if (lockedOrOwn(W, i, "assets")) return;
      const before = (f.assets ?? []).length;
      f.assets = (f.assets ?? []).filter((a) => a.power || !a.role || own(a) || (!seen.has(a.role) && seen.add(a.role)));
      if (f.assets.length !== before) used();
    });
  } else if (key === "aims") {
    W.factions.forEach((f, i) => {
      if (own(f.agenda) || aimOk(W, i, f.agenda) || lockedOrOwn(W, i, "agenda")) return;
      f.agenda = { ...keepOf({ id: F.agenda.id, text: F.agenda.text, die: F.agenda.die, aims: ["seat"], why: "" }), at: aimOf(W, i, ["seat"], rngOf(W.seed, "fallback", "aims", i)) };
      used();
    });
  } else if (key === "strange") {
    const rivals = W.factions.filter((f) => f.secret?.at != null).length;
    const i = W.factions.findIndex((f, j) => !lockedOrOwn(W, j, "secret") && (f.secret?.at == null || rivals > 1));
    if (i < 0) return;
    W.factions[i].secret = { ...keepOf({ id: F.strange.id, tag: F.strange.tag, text: F.strange.tag, more: F.strange.more, ways: F.strange.ways, rival: F.strange.rival, strange: true, why: "" }), at: F.strange.rival ? near(i) : null };
    used();
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
  const seatName = (i) => {
    const k = W.factions[i]?.seat?.k;
    return k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "";
  };
  const nameOf = (i) => {
    const f = W.factions[i];
    return f?.name ? fill(f.name.text, { seat: seatName(i) }) : "";
  };
  const asName = (i) => ({ text: nameOf(i), name: true });
  const seatAt = (k) => (k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "");
  const resText = (j, id) => {
    const r = (W.factions[j]?.res ?? []).find((x) => x.id === id);
    return r ? fill(r.text, { seat: seatName(j) }) : "";
  };
  const assetText = (j, id) => {
    const a = (W.factions[j]?.assets ?? []).find((x) => x.id === id);
    return a ? fill(a.text, { seat: seatName(j) }) : "";
  };
  const T2 = T.core.templates;
  const factions = W.factions.map((f, i) => {
    const seat = seatName(i);
    const slot = (at = {}) => ({
      seat: at.seat != null ? seatAt(at.seat) : seat,
      rival: at.rival != null ? asName(at.rival) : "",
      res: at.res ? resText(at.res.j, at.res.id) : "",
      asset: at.asset ? assetText(at.asset.j, at.asset.id) : "",
    });
    const threads = [];
    for (const t of W.web ?? []) {
      if (t.a !== i && t.b !== i) continue;
      const other = t.a === i ? t.b : t.a;
      const vals = (me, them) => ({ a: asName(me), b: asName(them), res: t.at?.res ? resText(t.a, t.at.res) : "", seat: seatAt(t.at?.seat) });
      if (t.kind === "wildcard") {
        if (t.a === i) threads.push({ text: fill(t.tie.text, vals(i, other)), kind: t.tie.bond, s: "whole", to: other });
      } else {
        const words = t.a === i ? t.tie.text : t.tie.back || t.tie.text;
        threads.push({ text: fill(words, vals(i, other)), kind: t.kind === "rival" ? "hostile" : "bond", s: "whole", to: other });
      }
    }
    for (const n of W.needs ?? []) {
      if (n.by === i && n.tie) threads.push({ text: fill(n.tie.text, { a: asName(i), b: asName(n.i), res: n.at?.res ? resText(i, n.at.res) : "", seat: seatAt(n.at?.seat) }), kind: "hostile", s: "whole", to: n.i });
    }
    const secret = f.secret;
    const rival = secret?.at != null ? asName(secret.at) : "";
    const wayOf = (w) => ({ text: fill(w, { rival, seat }), name: /^\{/.test(w) });
    const ways = secret?.ways?.length === 2 ? fill(T2.ways, { one: wayOf(secret.ways[0]), two: wayOf(secret.ways[1]) }) : "";
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
      secret: secret ? fill(secret.tag ?? secret.text, { rival, seat }) : "",
      more: secret ? [secret.more ? fill(secret.more, { rival, seat }) : "", ways].filter(Boolean).join(" ") : "",
      res: (f.res ?? []).map((r) => ({ text: fill(r.text, { seat }), x: 1 })),
      assets: [...(f.assets ?? []).map((a) => ({ text: fill(a.text, { seat }), does: a.does ?? "", power: a.power === true, x: 1, off: false })), ...(W.needs ?? []).filter((n) => n.i === i).map((n) => ({ text: fill(n.asset.text, { seat }), does: n.asset.does, power: false, x: 1, off: true }))],
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
// the tables but what the picks hold, and all resume() needs to carry on.
export function recordOf(W) {
  return JSON.parse(
    JSON.stringify({
      v: 1,
      seed: W.seed,
      recipe: W.recipe,
      n: W.n,
      s: W.s,
      fixed: W.fixed,
      dials: W.dials,
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
      not: W.not,
    }),
  );
}
