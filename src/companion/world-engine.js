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
//   crew      once there's a crew (setCrew()): who, the characters in the
//             campaign, each { k, name, friend, foe } (a friend and a foe
//             among the factions, each { j, id, text, ... } with j the
//             faction, or her own { own, j, text }), and things, what's on
//             the party sheet worth taking ({ l, id, text })
//   tries     how many times each step's been dealt again, locks the steps
//             she's locked, not the card each step had before it was dealt
//             again. Each step has its own stream of randomness from the
//             seed, its path and its tries, so dealing one again leaves
//             every other step as it was.
//
// A step's path: ask:holds, ask:runs, ask:notices, tension, seat:<k>,
// f:<i>:<step> for the factions' steps, and crew:<k>:friend and crew:<k>:foe
// for a character's friend and foe. Picks keep their words, so the world
// keeps what was dealt, never just the seed (the tables change most weeks).
// A pick she writes herself is { own: true, text } and is kept as she wrote
// it: no check deals it again.
//
// The screens (world-make.js) use options() for a step's three cards,
// preview() for a card's words, choose() to put one on, lock(), redeal() for
// Deal again, redealFaction() for dealing what a faction hasn't got locked
// again, dealRest(T, W, { finish: false }) to deal what's still empty, and
// dealRest() or dealWorld() to finish the board: the web, the needs and the
// checks. cardsOf() is the board as board.js keeps it, recordOf() what was
// dealt and resume() a world from it.
//
// Adding a faction to a board that's already there (startAdd()), the board's
// own factions come in held, ahead of the new one (W.add, and W.held of
// them), and so do the seats a build dealt that are on the board as places
// (W.hs of them), with one new seat after them. A held faction or seat is
// read for aims, rivals, ties and the bags, and never dealt, checked or
// changed. The new one gets a rival among them, and an ally or a debt, and
// an agenda only aims at what's on the board. With a crew, it gets one
// thread toward it too, named for a character who hasn't got a friend or a
// foe on the board yet, when there's one.
//
// The crew (stage 6): every character gets a friend and a foe among the
// factions once the board's finished, each that faction's thread toward the
// crew, named for them, and an agenda can aim at a character ({who}) or at
// something on the party sheet worth taking ({thing}), which the crew check
// makes sure one does.

export const REGIONS = ["town", "city", "country", "world", "stars"];
export const SIZES = ["small", "local", "city", "great"];
export const DIALS = ["tense", "strange", "rich", "ruled"];
export const STEPS = ["seat", "size", "type", "exc", "method", "want", "res", "assets", "agenda", "face", "secret", "name"];
// Dealing goes round the factions twice: up to their assets, then the rest,
// so an agenda or a Secret can aim at any faction on the board, not just the
// ones dealt before it.
const EARLY = STEPS.slice(0, STEPS.indexOf("agenda"));
const LATE = STEPS.slice(STEPS.indexOf("agenda"));
export const QUESTIONS = ["holds", "runs", "notices"];
export const CHECKS = ["whole", "power", "rival", "block", "secret", "unique", "aims", "crew", "strange"];
export const SIDES = ["friend", "foe"];
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
// How much a row's weight goes up for each thing it fits: on the card (its
// seat, what it is, how it works and what it wants), or on the board (the
// asking and the tension). The card's what a step reads, so it counts for
// more, and a board's answers flavour every faction on it without making
// them all the same.
const FIT = 3;
const FIT_BOARD = 1.5;
const SEAT_FIT = 8;
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
// sentence. A slot's 's follows its words: a name that ends in s takes just
// the apostrophe (the Salt Brothers' barges), and one that ends in 's takes
// nothing more (Saint Ancel's). Nothing's added but the words in the slots,
// and a slot with nothing to fill it stays as it is, so it can't hide.
export function fill(tpl, vals) {
  const out = String(tpl ?? "").replace(/\{([a-z]+)\}(['’]s\b)?/g, (m, k, poss, at) => {
    const v = vals[k];
    const text = v == null ? "" : typeof v === "object" ? String(v.text ?? "") : String(v);
    if (!text) return m;
    let s = text.replace(/[.]+$/, "");
    if (at > 0) s = typeof v === "object" && v.name ? s.replace(/^The /, "the ") : s.replace(/^(The|A|An) /, (x) => x.toLowerCase()).replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
    // A name that already has its The after one doesn't take a second
    // (The {seat} Company on the Old Bridge is the Old Bridge Company).
    if (/(^|[^\p{L}])[Tt]he $/u.test(String(tpl).slice(0, at))) s = s.replace(/^[Tt]he /, "");
    if (!poss) return s;
    if (/['’]s$/.test(s)) return s;
    return /s$/.test(s) ? s + poss[0] : s + poss;
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
export function start(T, { recipe, dials = null, seed, factions = 6, crew = null }) {
  if (!canDeal(T, recipe)) throw new Error(`the tables can't deal ${recipe.era}${recipe.twist ? ` with ${recipe.twist}` : ""} at ${recipe.region}`);
  const n = Math.max(4, Math.min(12, Math.floor(Number(factions) || 6)));
  const fixed = dials ? Object.fromEntries(DIALS.map((k) => [k, clamp(dials[k] ?? 1)])) : null;
  const W = {
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
    crew: null,
  };
  if (crew) setCrew(T, W, crew);
  return W;
}
const clamp = (v) => Math.max(0, Math.min(2, Math.round(Number(v) || 0)));
const blankFaction = () => ({ seat: null, size: null, type: null, exc: undefined, method: null, want: null, res: null, assets: null, agenda: null, face: null, secret: null, name: null, offers: [] });

// A world for adding factions to a board that's there (Add a faction): the
// board's factions held, ahead of add new ones, and the seats a build dealt
// that are places on the board, with one new seat after them. A held
// faction: { name, about, res: [{ id, text }], assets: [{ id, text, power }],
// seat (a held seat's index, or null), picks (what a build dealt it, when
// the board has its record: rows by step, for the bags and the tags) }. The
// build's asking and tension, when there's one, steer it the way they did
// the board, and its dials (or a frame's) are fixed.
export function startAdd(T, { recipe, dials = null, seed, held = [], seats = [], asking = null, tension = null, add = 1, crew = null }) {
  const W = start(T, { recipe, dials: dials ?? { tense: 1, strange: 1, rich: 1, ruled: 1 }, seed, crew });
  const hs = seats.filter(Boolean).length;
  W.add = true;
  W.held = held.length;
  W.hs = hs;
  W.n = held.length + Math.max(1, Math.min(4, Math.floor(Number(add) || 1)));
  W.s = hs + 1;
  W.seats = [...seats.filter(Boolean).map((s) => copyOf(s)), null];
  W.factions = [...held.map((h) => heldOf(h, hs)), ...Array.from({ length: W.n - held.length }, () => blankFaction())];
  for (const q of QUESTIONS) W.asking[q] = asking?.[q] ? copyOf(asking[q]) : null;
  W.tension = tension ? copyOf(tension) : null;
  return W;
}
const copyOf = (x) => JSON.parse(JSON.stringify(x));
function heldOf(h, hs) {
  const p = h.picks && typeof h.picks === "object" ? h.picks : {};
  const row = (s) => (p[s] && typeof p[s] === "object" ? copyOf(p[s]) : null);
  const words = (v) => String(v ?? "").trim();
  return {
    ...blankFaction(),
    held: true,
    seat: Number.isInteger(h.seat) && h.seat >= 0 && h.seat < hs ? { k: h.seat } : null,
    exc: null,
    // Counted as dealt, so it can be a rival or have its things aimed at.
    type: row("type") ?? { own: true, text: words(h.about) || words(h.name) },
    method: row("method"),
    want: row("want"),
    res: (Array.isArray(h.res) ? h.res : []).filter((r) => r?.id && words(r.text)).map((r) => ({ id: String(r.id), text: words(r.text), role: r.role ?? null, tags: Array.isArray(r.tags) ? [...r.tags] : [] })),
    assets: (Array.isArray(h.assets) ? h.assets : []).filter((a) => a?.id && words(a.text)).map((a) => ({ id: String(a.id), text: words(a.text), role: a.role ?? null, power: a.power === true, does: words(a.does) })),
    agenda: row("agenda"),
    face: row("face"),
    secret: row("secret"),
    name: { ...(row("name") ?? {}), own: true, text: words(h.name) },
  };
}
const adding = (W) => W.add === true;
const fresh = (W) => W.factions.map((_, i) => i).filter((i) => !W.factions[i].held);

// The crew, once there's one: the characters in the campaign and what the
// party sheet's got. crew is { who: [{ k, name, has? }], res: [{ id, text }],
// assets: [{ id, text, power }] }, k being the character's id and has, when
// a faction's being added, whether they've got a friend and a foe on the
// board already. A character keeps the friend and foe they were dealt while
// they're still in it. What's worth taking leaves out the new crew's card,
// people who turn up and the assets that are what the crew's like (core's
// crew.qualities). It says whether anything changed.
const loose = (t) => String(t ?? "").toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
const assetKey = (t) => loose(t).replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/^(a|an|the)-/, "");
// A character's key in a path (crew:<k>:friend): their id, letters, numbers,
// hyphens and underscores only.
export const crewKey = (k) => String(k ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48);
export function setCrew(T, W, crew) {
  const key = crewKey;
  const line = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const was = new Map((W.crew?.who ?? []).map((c) => [c.k, c]));
  const seen = new Set();
  const who = [];
  for (const c of Array.isArray(crew?.who) ? crew.who : []) {
    const k = key(c?.k);
    const name = line(c?.name);
    if (!k || !name || seen.has(k) || who.length >= 30) continue;
    seen.add(k);
    const old = was.get(k);
    const has = c.has ? { has: { friend: c.has.friend === true, foe: c.has.foe === true } } : old?.has ? { has: { ...old.has } } : {};
    who.push({ k, name, friend: old?.friend ?? null, foe: old?.foe ?? null, ...has });
  }
  const qualities = new Set(T.core.crew?.qualities ?? []);
  const things = [];
  for (const l of ["res", "assets"]) {
    const start = new Set((T.book.start?.[l] ?? []).map(loose));
    for (const x of Array.isArray(crew?.[l]) ? crew[l] : []) {
      const text = line(x?.text);
      if (!x?.id || !text || start.has(loose(text))) continue;
      if (l === "assets" && (x.power === true || qualities.has(assetKey(text)))) continue;
      if (!things.some((t) => t.l === l && t.id === String(x.id))) things.push({ l, id: String(x.id), text });
    }
  }
  const before = W.crew ?? null;
  // Everyone and everything the build's ever had, by name, so a card she's
  // locked still reads right when what it's after has gone.
  const known = { who: { ...(before?.seen?.who ?? {}) }, things: { ...(before?.seen?.things ?? {}) } };
  for (const c of who) known.who[c.k] = c.name;
  for (const t of things) known.things[`${t.l}:${t.id}`] = t.text;
  const next = who.length || things.length || Object.keys(known.who).length || Object.keys(known.things).length ? { who, things, seen: known } : null;
  const ids = (c) => JSON.stringify([(c?.who ?? []).map((x) => x.k), (c?.things ?? []).map((x) => `${x.l}:${x.id}`)]);
  const changed = JSON.stringify(next) !== JSON.stringify(before);
  W.crew = next;
  // Who's in it, or what it's got, is what the crew check looks at. An
  // agenda after someone who's left goes after someone else, or, with nobody
  // left, is dealt again when it's next needed, unless she's locked it.
  if (ids(next) !== ids(before)) {
    W.checks = null;
    for (const i of fresh(W)) {
      const ag = W.factions[i].agenda;
      if (!aimsCrew(ag) || aimOk(W, i, ag) || reaim(W, i, 0)) continue;
      if (!W.locks[`f:${i}:agenda`]) W.factions[i].agenda = null;
    }
  }
  return changed;
}
const isCrewAim = (a) => a === "who" || a === "thing";
const aimsCrew = (ag) => Boolean(ag && !own(ag) && ag.aims?.some(isCrewAim));
const hasCrew = (W) => Boolean(W.crew?.who?.length || W.crew?.things?.length);
const crewOf = (W, k) => (W.crew?.who ?? []).find((c) => c.k === k) ?? null;
// A faction's name, the way its card has it, its seat and all.
const seatText = (W, i) => {
  const k = W.factions[i]?.seat?.k;
  return k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "";
};
const nameAt = (W, i) => (W.factions[i]?.name ? fill(W.factions[i].name.text, { seat: seatText(W, i) }) : "");
const rivals = (W, a, b) => (W.web ?? []).some((t) => t.kind === "rival" && ((t.a === a && t.b === b) || (t.a === b && t.b === a)));
// A step on a held faction or seat, which never changes.
function isHeld(W, path) {
  const [head, a] = path.split(":");
  if (head === "f") return Boolean(W.factions[Number(a)]?.held);
  return head === "seat" && adding(W) && Number(a) < W.hs;
}

// A world from what was dealt (recordOf()), to carry on with.
export function resume(T, rec) {
  const W = start(T, { recipe: rec.recipe, dials: rec.fixed ?? null, seed: rec.seed, factions: rec.add ? 4 : rec.n });
  if (rec.add) {
    const int = (v, lo) => Math.max(lo, Math.floor(Number(v) || 0));
    W.add = true;
    W.held = int(rec.held, 0);
    W.hs = int(rec.hs, 0);
    W.n = int(rec.n, W.held + 1);
    W.s = int(rec.s, W.hs + 1);
    W.seats = Array.from({ length: W.s }, () => null);
    W.factions = Array.from({ length: W.n }, () => blankFaction());
  }
  for (const k of ["tries", "locks", "not"]) W[k] = rec[k] && typeof rec[k] === "object" ? { ...rec[k] } : {};
  for (const q of QUESTIONS) W.asking[q] = rec.asking?.[q] ?? null;
  W.tension = rec.tension ?? null;
  W.seats = W.seats.map((_, k) => rec.seats?.[k] ?? null);
  W.factions = W.factions.map((_, i) => ({ ...blankFaction(), ...(rec.factions?.[i] ?? {}), offers: rec.factions?.[i]?.offers ?? [] }));
  for (const k of ["web", "needs", "checks"]) W[k] = rec[k] ?? null;
  W.fixes = rec.fixes ?? [];
  W.fallbacks = rec.fallbacks ?? [];
  const names = (v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string")) : {});
  W.crew = rec.crew && typeof rec.crew === "object" && Array.isArray(rec.crew.who) ? { who: rec.crew.who.filter((c) => c?.k && c.name).map((c) => ({ ...c, friend: c.friend ?? null, foe: c.foe ?? null })), things: Array.isArray(rec.crew.things) ? rec.crew.things.filter((t) => t?.id) : [], seen: { who: names(rec.crew.seen?.who), things: names(rec.crew.seen?.things) } } : null;
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
// The card so far, for a step: only the steps that come before it, so a
// type dealt again reads its seat and size, and never the method and Want it
// had. With no step, the whole card.
function cardOf(W, i, step = null) {
  const f = W.factions[i];
  const at = step ? STEPS.indexOf(step) : -1;
  const before = (s) => at < 0 || STEPS.indexOf(s) < at;
  const tags = new Map();
  const leans = new Map();
  const add = (into, keys, src) => {
    for (const k of keys) if (k && !into.has(k)) into.set(k, src);
  };
  const seat = f.seat && before("seat") ? W.seats[f.seat.k] : null;
  if (seat) add(tags, [seat.role, ...(seat.tags ?? [])], { kind: "seat", text: seat.text, name: true });
  for (const s of ["type", "method", "want"]) {
    const p = f[s];
    if (!p || p.own || !before(s)) continue;
    const src = { kind: s, text: p.text };
    add(tags, [p.role, ...(p.tags ?? [])], src);
    add(leans, p.leans ?? [], src);
  }
  const exc = before("exc") ? f.exc : null;
  if (exc) add(tags, exc.gives ?? [], { kind: "exception", text: exc.reason });
  return { tags, leans, drops: new Set(exc?.drops ?? []), size: before("size") ? f.size?.size ?? null : null, seat };
}
const has = (card, board, t) => Boolean(card?.tags.has(t) || board.tags.has(t));
function fits(row, card, board) {
  if (card?.size && row.sizes && !row.sizes.includes(card.size)) return false;
  if (row.needs.some((t) => !has(card, board, t))) return false;
  if (row.out.some((t) => has(card, board, t))) return false;
  if (card && [row.role, ...row.tags].some((t) => t && card.drops.has(t))) return false;
  return true;
}
// What a row fits, on the card and on the board, and what steered it: the
// card's reason before the board's, since it's the more particular one.
function fitOf(row, card, board) {
  let onCard = 0;
  let onBoard = 0;
  let src = null;
  let boardSrc = null;
  for (const k of [row.role, ...row.tags, ...row.leans]) {
    if (!k) continue;
    const s = card?.tags.get(k) ?? card?.leans.get(k);
    if (s) {
      onCard++;
      src ??= s;
      continue;
    }
    const b = board.tags.get(k);
    if (b) {
      onBoard++;
      boardSrc ??= b;
    }
  }
  return { card: Math.min(onCard, 3), board: Math.min(onBoard, 2), src: src ?? boardSrc };
}
function weightOf(W, row, fit) {
  let w = row.w * (1 + FIT * fit.card + FIT_BOARD * fit.board);
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
// A seat an agenda can aim at: not its own, and when it's being added to a
// board, one that's on it (a held seat), never the new one nobody holds.
const seatToAim = (W, i, k) => k !== W.factions[i]?.seat?.k && (!adding(W) || k < W.hs);
const nameKey = (t) => String(t ?? "").toLowerCase().replace(/[’']/g, "'").replace(/^the\s+/, "").replace(/\s+/g, " ").trim();

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
  const card = cardOf(W, i, b);
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
  // What sits on a seat is likelier to live off it, so a type that leans to
  // its seat's keep counts eight times over: the toll-farmers take the ford.
  if (b === "type") {
    return pool(P.types, b).map((x) => {
      const c = ofRow(x);
      if (card.seat && [x.r.role, ...x.r.tags, ...x.r.leans].includes(card.seat.role)) c.w *= SEAT_FIT;
      return c;
    });
  }
  if (b === "method" || b === "want") return pool(b === "method" ? P.methods : P.wants, b).map((x) => ofRow(x));
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
    const seats = W.seats.some((s, k) => s && seatToAim(W, i, k));
    const can = (aim) => (aim === "seat" && seats) || (aim === "rival" && others.length) || (aim === "res" && others.some((j) => W.factions[j].res?.length)) || (aim === "asset" && others.some((j) => W.factions[j].assets?.length)) || (aim === "who" && W.crew?.who?.length > 0) || (aim === "thing" && W.crew?.things?.length > 0);
    // Wanting something the crew's got comes up less for each faction that
    // already does, so the board isn't all about the crew.
    const after = W.factions.filter((x, j) => j !== i && aimsCrew(x.agenda)).length;
    return pool(P.agendas.filter((r) => r.aims.every(can) && (only !== "crew" || r.aims.some(isCrewAim))), "agenda").map((x) => {
      const c = ofRow(x, { die: x.r.die, aims: x.r.aims });
      if (x.r.aims.some(isCrewAim)) c.w *= 0.5 ** after;
      return c;
    });
  }
  // A name's one to four words the way it reads on the card, its seat and
  // all, so there's never a Lords of the Street of Smiths.
  if (b === "name") {
    const kind = f.type?.role;
    const seat = card.seat ? { text: card.seat.text, name: true } : "";
    const short = (r) => fill(r.text, { seat }).split(/\s+/).filter(Boolean).length <= 4;
    const mine = (r) => !r.role || r.role === kind;
    // Never a name a faction on the board's already got.
    const taken = new Set(W.factions.filter((x, j) => j !== i && x.name?.own).map((x) => nameKey(x.name.text)));
    const free = (r) => !taken.has(nameKey(fill(r.text, { seat })));
    for (const test of [(r) => mine(r) && short(r), short, mine, () => true]) {
      const got = pool(P.names.filter((r) => free(r) && test(r)), "name");
      if (got.length) return got.map((x) => ofRow(x, { why: "", by: null }));
    }
    return [];
  }
  return [];
}

// The fields a pick keeps: its words and what it is, never the row itself.
const KEEP = ["id", "text", "role", "tags", "leans", "offers", "strange", "again", "why", "by", "notice", "sizes", "dials", "tag", "more", "ways", "rival", "die", "aims", "reason", "drops", "gives", "power", "does"];
const keepOf = (c) => Object.fromEntries(KEEP.filter((k) => c[k] !== undefined).map((k) => [k, Array.isArray(c[k]) ? c[k].map((x) => (x && typeof x === "object" ? { ...x } : x)) : c[k]]));
// A friend or a foe is told apart by its faction and its row.
const keyOfPick = (p) => (p?.j != null ? `${p.j}|${p.id ?? ""}` : p?.id ?? p?.k ?? p?.size ?? p?.nameId ?? null);

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
  // Where the keep comes from: the first one's its seat's, when there's one,
  // and the next's one it leans to by what it is or how it works.
  if (card.seat) one((r) => r.role === card.seat.role, () => true);
  if (out.length < count) one((r) => card.leans.has(r.role), () => false);
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
  const leaned = (r) => card.leans.has(r.role);
  const one = (power, test = null) => {
    const cands = rows
      .filter((r) => r.power === power && !out.some((o) => o.role === r.role) && (power || !held.has(r.role)) && (!test || test(r)))
      .map((r) => {
        const fit = fitOf(r, card, board);
        return { w: weightOf(W, r, fit) * (elsewhere.has(r.id) ? USED : 1), r, fit };
      });
    const [c] = draw(cands, rand);
    if (!c) return false;
    out.push(assetOf(T, c.r, becauseOf(T, c.fit.src)));
    return true;
  };
  // Who turns up first is who it leans to by what it is or how it works, and
  // the first thing it can do is too, when there's one, so a knight's
  // household calls its retainers before anyone else.
  let called = people > 0 && one(true, leaned) ? 1 : 0;
  for (; called < people && one(true); called++) {}
  const free = Math.max(0, (f.res?.length ?? 0) - out.length);
  let extra = rand() < EXTRA[W.dials.rich] ? 1 : 0;
  if (free >= 4 && W.dials.rich === 2 && rand() < 0.5) extra++;
  if (only === "extra") extra = Math.max(extra, 1);
  // No two factions hold the same asset that does one thing, so a few are
  // left for the board's needs.
  const roles = new Set(rows.filter((r) => !r.power).map((r) => r.role)).size;
  const room = Math.max(0, roles - needsOf(W) - held.size);
  const most = Math.min(free - extra, room);
  let does = most > 0 && one(false, leaned) ? 1 : 0;
  for (; does < most && one(false); does++) {}
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
      const seats = W.seats.map((s, k) => (s && seatToAim(W, i, k) ? { w: taken.has(k) ? 1 : 2, k } : null)).filter(Boolean);
      out.seat = draw(seats, rand)[0]?.k ?? mine ?? 0;
    } else if (a === "rival") out.rival = pick(others, rand);
    else if (a === "who" || a === "thing") {
      // One of the crew, or what they've got, and the ones nobody's after yet likelier.
      const list = a === "who" ? W.crew?.who ?? [] : W.crew?.things ?? [];
      const keyOf = (x) => (a === "who" ? x.k : `${x.l}:${x.id}`);
      const aimed = (x) => W.factions.filter((f, j) => j !== i && aimsCrew(f.agenda) && (a === "who" ? f.agenda.at?.who === x.k : f.agenda.at?.thing && `${f.agenda.at.thing.l}:${f.agenda.at.thing.id}` === keyOf(x))).length;
      const got = draw(list.map((x) => ({ w: 1 / (1 + 3 * aimed(x)), x })), rand)[0]?.x ?? null;
      out[a] = got ? (a === "who" ? got.k : { l: got.l, id: got.id }) : null;
    } else {
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
  if (head === "crew") return crewCards(T, W, path, n, not, opts);
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
  // Only the threats core.yaml gives its kind of faction, when it gives some,
  // so a guild's face is never the pack or the swarm, or the ones its type's
  // own row gives, so a coven's is likeliest a sorcerer.
  const own = f.type?.id ? P.types.find((r) => r.id === f.type.id)?.faces : null;
  const likely = new Set(own?.length ? own : T.core.faces[f.type?.role] ?? []);
  const tries = W.tries[path] ?? 0;
  const threats = draw(
    (likely.size ? T.book.threats.filter((t) => likely.has(t.key)) : T.book.threats).map((t) => ({ w: 1, t })),
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

// A character's friend or foe: a faction and the thread it has toward the
// crew, named for them. Each card's a different faction, never the one
// that's their other side, and the factions already someone's friend (or
// foe) less likely, so it spreads round the board. A foe's likelier to be a
// faction that's after them, or their friend's rival, and it says so. The
// words are a row off core's crew tables that fits the faction, from a bag
// shared by the characters, so no two get the same line till it's empty. The
// factions have a stream, and each one's words a stream of their own, so the
// first card's the same however many are drawn. Adding a faction, only the
// new one can be.
function crewCards(T, W, path, n, not, { only = null } = {}) {
  const [, k, side] = path.split(":");
  const c = crewOf(W, k);
  if (!c || !SIDES.includes(side)) return [];
  const other = side === "friend" ? "foe" : "friend";
  const rows = T.core.crew?.[side === "friend" ? "friends" : "foes"] ?? [];
  const used = new Set(W.crew.who.filter((x) => x.k !== k && x[side] && !own(x[side])).map((x) => x[side].id));
  const board = boardOf(T, W);
  const tries = W.tries[path] ?? 0;
  const wasJ = not != null ? Number(String(not).split("|")[0]) : null;
  let cands = fresh(W)
    .filter((j) => (only == null || j === only) && W.factions[j].type && c[other]?.j !== j)
    .map((j) => {
      const f = W.factions[j];
      const on = W.crew.who.filter((x) => x.k !== k && x[side]?.j === j).length;
      let w = 0.25 ** on;
      let src = null;
      const after = aimsCrew(f.agenda) && f.agenda.at?.who === k;
      // One that's after them is likeliest of all, however many it's already a foe to.
      if (side === "foe" && after) {
        w = 12;
        src = { kind: "after", text: c.name, name: true };
      } else if (side === "foe" && c.friend?.j != null && rivals(W, j, c.friend.j)) {
        w *= 3;
        src = { kind: "rivalof", text: nameAt(W, c.friend.j), name: true };
      } else if (side === "friend" && after) w *= 0.2;
      return { w, j, src };
    });
  if (wasJ != null && cands.some((x) => x.j !== wasJ)) cands = cands.filter((x) => x.j !== wasJ);
  const out = [];
  // No two cards in a hand with the same words, while there are others.
  const inHand = new Set();
  for (const x of draw(cands, rngOf(W.seed, path, tries, "who"), n)) {
    const card = cardOf(W, x.j);
    // A foe that's after them reads its agenda too, so its words fit what it's after.
    const ag = W.factions[x.j].agenda;
    if (side === "foe" && x.src?.kind === "after") for (const t of ag.tags ?? []) if (!card.tags.has(t)) card.tags.set(t, x.src);
    let list = bagged(rows.filter((r) => fits(r, card, board)), used).map((y) => {
      const fit = fitOf(y.r, card, board);
      return { w: weightOf(W, y.r, fit), ...y, fit };
    });
    if (list.some((y) => !inHand.has(y.r.id))) list = list.filter((y) => !inHand.has(y.r.id));
    const [got] = draw(list, rngOf(W.seed, path, tries, "row", x.j));
    if (!got) continue;
    inHand.add(got.r.id);
    // The because is why it's that faction, when there's a reason: the words
    // are the faction's own business.
    out.push({ j: x.j, ...keepOf({ id: got.r.id, text: got.r.text, tags: got.r.tags, strange: got.r.strange, again: got.again, ...becauseOf(T, x.src) }) });
  }
  return out;
}
// Whether a friend or a foe still fits: its faction's still one she's
// building, it isn't their other side too, and its words still suit the
// faction's card. One that doesn't is dealt again, unless she's locked it or
// written it herself.
export function crewFits(T, W, k, side) {
  const c = crewOf(W, k);
  const p = c?.[side];
  if (!p) return false;
  const f = W.factions[p.j];
  if (!f || f.held || !f.type) return false;
  if (own(p)) return true;
  if (c[side === "friend" ? "foe" : "friend"]?.j === p.j) return false;
  const row = (T.core.crew?.[side === "friend" ? "friends" : "foes"] ?? []).find((r) => r.id === p.id);
  return Boolean(row && fits(row, cardOf(W, p.j), boardOf(T, W)));
}
// A foe that said why it was picked (after them, or their friend's rival)
// stops saying so once it isn't, and stays.
function crewWhy(W, c) {
  const p = c.foe;
  if (!p || own(p) || !p.by) return;
  const f = W.factions[p.j];
  const still = p.by === "after" ? aimsCrew(f?.agenda) && f.agenda.at?.who === c.k : p.by === "rivalof" ? c.friend?.j != null && rivals(W, p.j, c.friend.j) : true;
  if (!still) Object.assign(p, { why: "", by: null });
}
// Every character's friend and foe that isn't dealt yet, or doesn't fit any
// more, a character at a time, friend first, since a foe reads the friend. Adding a faction, it's
// one thread toward the crew on the new one: named for whoever's after it,
// or someone who's still got no friend or no foe on the board, or anyone.
function dealCrew(T, W) {
  if (!W.crew?.who?.length) return;
  if (adding(W)) {
    const i = fresh(W)[0];
    if (i == null || !W.factions[i].type) return;
    // One it's got already stays, or is dealt again for the same one of
    // them when its words don't fit the card any more.
    const tied = W.crew.who.flatMap((c) => SIDES.filter((s) => c[s]?.j === i).map((s) => [c, s]));
    if (tied.length) {
      const [c, s] = tied[0];
      if (!W.locks[`crew:${c.k}:${s}`] && !crewFits(T, W, c.k, s)) c[s] = crewCards(T, W, `crew:${c.k}:${s}`, 1, null, { only: i })[0] ?? c[s];
      return;
    }
    const rand = randOf(W, "crew");
    const ag = W.factions[i].agenda;
    let c = aimsCrew(ag) ? crewOf(W, ag.at?.who) : null;
    let side = c ? "foe" : null;
    if (!c) {
      const lacks = W.crew.who.filter((x) => !x.has?.friend || !x.has?.foe);
      c = pick(lacks.length ? lacks : W.crew.who, rand);
      const can = SIDES.filter((s) => !c.has?.[s]);
      side = can.length === 1 ? can[0] : rand() < HOSTILE[W.dials.tense] ? "foe" : "friend";
    }
    const path = `crew:${c.k}:${side}`;
    if (!W.locks[path]) c[side] = crewCards(T, W, path, 1, null, { only: i })[0] ?? null;
    return;
  }
  for (const c of W.crew.who) {
    for (const side of SIDES) {
      const path = `crew:${c.k}:${side}`;
      if (W.locks[path] || (c[side] && crewFits(T, W, c.k, side))) continue;
      c[side] = crewCards(T, W, path, 1, W.not[path] ?? null)[0] ?? null;
    }
    crewWhy(W, c);
  }
}

// Put a pick on a step. A faction's later steps that aren't locked or hers
// are dealt again, since they read the card so far, and so are those of the
// faction sitting on a seat that changes. An answer that changes moves the dials for
// what's dealt from then on, and leaves what's dealt as it is. keep leaves
// the later steps alone, for her own changes to a set she's been dealt (a
// resource or an asset added or taken off). A held faction or seat never
// changes.
export function choose(T, W, path, value, { keep = false } = {}) {
  const [head, a, b] = path.split(":");
  // What she's written herself stays, like what she's locked.
  const mine = (p) => own(p) || (Array.isArray(p) && p.some(own));
  const clear = (i, from) => {
    for (const step of STEPS.slice(STEPS.indexOf(from) + 1)) if (!W.locks[`f:${i}:${step}`] && !mine(W.factions[i][step])) W.factions[i][step] = step === "exc" ? undefined : null;
  };
  if (head === "seat" && adding(W) && Number(a) < W.hs) return;
  if (head === "f" && W.factions[Number(a)]?.held) return;
  // A friend or a foe is only theirs: nothing else on the board reads it.
  if (head === "crew") {
    const c = crewOf(W, a);
    if (c && SIDES.includes(b)) c[b] = value;
    return;
  }
  if (head === "ask") W.asking[a] = value;
  else if (head === "tension") W.tension = value;
  else if (head === "seat") {
    W.seats[Number(a)] = value;
    W.factions.forEach((f, i) => !f.held && f.seat?.k === Number(a) && clear(i, "seat"));
  } else if (head === "f") {
    W.factions[Number(a)][b] = value;
    if (!keep) clear(Number(a), b);
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
// while there's another. A locked step stays as it is. rest: false leaves
// what's still to deal alone, for a screen that deals as she gets to it.
export function redeal(T, W, path, { finish = true, rest = true } = {}) {
  if (W.locks[path] || isHeld(W, path)) return W;
  const was = keyOfPick(pickAt(W, path));
  W.tries[path] = (W.tries[path] ?? 0) + 1;
  if (was != null) W.not[path] = was;
  else delete W.not[path];
  const [first] = options(T, W, path, 1);
  choose(T, W, path, first ?? null);
  return rest ? dealRest(T, W, { finish }) : W;
}
// Every step on one faction's card dealt again but what she's locked or
// written herself, each to a card it hasn't had: "locking what she likes and
// dealing the rest again".
export function redealFaction(T, W, i, { finish = false } = {}) {
  const f = W.factions[i];
  if (!f || f.held) return W;
  for (const step of STEPS) {
    const path = `f:${i}:${step}`;
    if (W.locks[path] || own(f[step]) || (Array.isArray(f[step]) && f[step].some(own))) continue;
    const was = keyOfPick(f[step]);
    W.tries[path] = (W.tries[path] ?? 0) + 1;
    if (was != null) W.not[path] = was;
    else delete W.not[path];
    f[step] = step === "exc" ? undefined : null;
  }
  W.web = null;
  W.needs = null;
  W.checks = null;
  return dealRest(T, W, { finish });
}
// What tells two picks apart, for a screen's hand of cards: a row's id, a
// seat's place, a size, a Face's name, or her own words.
export const pickKey = (p) => (p?.own ? `own:${p.text ?? p.tag ?? p.size ?? ""}` : keyOfPick(p));

// The tension at a real roll of the d12, tapped in.
export function tensionAt(T, roll) {
  const k = Math.floor(Number(roll));
  const r = T.core.tension[k - 1];
  return r ? { ...keepOf({ id: r.id, text: r.text, tags: r.tags, dials: r.dials, strange: r.strange, why: "" }), roll: k } : null;
}

// The pick a step's got now.
export function pickAt(W, path) {
  const [head, a, b] = path.split(":");
  if (head === "ask") return W.asking[a] ?? null;
  if (head === "tension") return W.tension;
  if (head === "seat") return W.seats[Number(a)] ?? null;
  if (head === "f") return W.factions[Number(a)]?.[b] ?? null;
  if (head === "crew") return crewOf(W, a)?.[b] ?? null;
  return null;
}

// Every step still to deal, in order. Finishing deals the web, the needs and
// the checks too, before anyone sees the board.
export function dealRest(T, W, { finish = true } = {}) {
  // Adding to a board, the asking's the board's own, or there isn't one.
  if (!adding(W)) {
    for (const q of QUESTIONS) if (!W.asking[q]) W.asking[q] = options(T, W, `ask:${q}`, 1)[0] ?? null;
    if (!W.tension) W.tension = options(T, W, "tension", 1)[0] ?? null;
  }
  W.dials = dialsOf(W);
  for (let k = 0; k < W.s; k++) if (!W.seats[k]) W.seats[k] = options(T, W, `seat:${k}`, 1)[0] ?? null;
  for (const i of fresh(W)) dealFaction(T, W, i, EARLY);
  for (const i of fresh(W)) dealFaction(T, W, i, LATE);
  if (!finish) return W;
  if (!W.web) dealWeb(T, W);
  if (!W.needs) dealNeeds(T, W);
  if (!W.checks) runChecks(T, W);
  dealCrew(T, W);
  return W;
}
function dealFaction(T, W, i, steps = STEPS) {
  const f = W.factions[i];
  // A card with a hole in its first half waits for the whole check.
  if (steps === LATE && EARLY.some((s) => s !== "exc" && f[s] == null)) return;
  for (const step of steps) {
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
  if (adding(W)) return dealTies(T, W);
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
// Adding to a board: each new faction's rival is one of the factions already
// there, and its ally or debt another, when there's one, each a thread both
// ways like the ring's.
function dealTies(T, W) {
  const web = [];
  const used = new Set();
  const there = W.factions.map((_, j) => j).filter((j) => W.factions[j].held);
  for (const a of fresh(W)) {
    const order = shuffle(there, rngOf(W.seed, "web", a, W.tries.web ?? 0));
    [["rival"], ["ally", "debt"]].forEach((kinds, s) => {
      const b = order[s];
      if (b == null) return;
      const key = `${b}-${a}`;
      const t = tieFor(T, W, kinds, null, a, b, used, rngOf(W.seed, "tie", key, W.tries.web ?? 0));
      if (!t) return;
      used.add(t.id);
      web.push({ a, b, kind: t.kind, tie: tieOf(t), at: aimsOfTie(W, t, a, b, rngOf(W.seed, "tie-at", key, W.tries.web ?? 0)) });
    });
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
// Adding to a board, each new faction has its own chance of one, as tense says.
const needsOf = (W) => (adding(W) ? fresh(W).filter((i) => rngOf(W.seed, "need-of", i, W.tries.needs ?? 0)() < NEEDS[W.dials.tense]).length : Math.max(W.n >= 5 ? 1 : 0, Math.round(W.n * NEEDS[W.dials.tense])));
function dealNeeds(T, W, { only = null } = {}) {
  W.needs = [];
  const rand = randOf(W, "needs");
  const count = needsOf(W);
  const order = shuffle(fresh(W), rand).sort((x, y) => extrasOf(W, x) - extrasOf(W, y));
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
    const [c] = draw(cands, rngOf(W.seed, "need", i, W.tries.needs ?? 0));
    if (!c) continue;
    const need = { i, asset: assetOf(T, c.r, becauseOf(T, c.fit.src)), by: null, tie: null, at: {} };
    // Whoever's got the extra resource, a faction already blocking one less likely.
    const blocking = (j) => W.needs.filter((x) => x.by === j).length;
    const holders = W.factions.map((_, j) => (j !== i && extrasOf(W, j) > 0 ? { w: 1 / (1 + 3 * blocking(j)), j } : null)).filter(Boolean);
    const by = draw(holders, rngOf(W.seed, "block", i, W.tries.needs ?? 0))[0]?.j ?? null;
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
// Adding to a board, only the new factions are checked, and the board-wide
// checks (a blocked trade, a Secret naming another faction, something
// strange) are the board's own business.
function passes(T, W, key) {
  const mine = fresh(W);
  if (adding(W) && ["block", "secret", "strange"].includes(key)) return true;
  if (key === "whole") return mine.every((i) => STEPS.every((s) => s === "exc" || W.factions[i][s] != null));
  if (key === "power") return mine.every((i) => powerOk(W, i));
  if (key === "rival") return (adding(W) && !W.held) || mine.every((i) => (W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i)));
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
  if (key === "aims") return mine.every((i) => own(W.factions[i].agenda) || aimOk(W, i, W.factions[i].agenda));
  // Once there's a crew, one faction wants something it's got: one of the
  // characters, or something on the party sheet worth taking.
  if (key === "crew") return adding(W) || !hasCrew(W) || mine.some((i) => aimsCrew(W.factions[i].agenda) && aimOk(W, i, W.factions[i].agenda));
  if (key === "strange") return strangeCount(W) > 0;
  return true;
}
function aimOk(W, i, ag) {
  if (!ag?.aims?.length) return false;
  return ag.aims.every((a) => {
    const v = ag.at?.[a];
    if (a === "seat") return Number.isInteger(v) && Boolean(W.seats[v]) && (!adding(W) || v < W.hs);
    if (a === "rival") return Number.isInteger(v) && v !== i && Boolean(W.factions[v]?.type);
    if (a === "who") return typeof v === "string" && Boolean(crewOf(W, v));
    if (a === "thing") return Boolean(v) && (W.crew?.things ?? []).some((t) => t.l === v.l && t.id === v.id);
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
  const free = W.factions.map((f, i) => (!f.held && !lockedOrOwn(W, i, step) && ok(f, i) ? i : null)).filter((i) => i !== null);
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
// An agenda whose aim's gone (another faction's resource or asset dealt
// again) keeps its card, locked or not, and finds something else to aim at,
// on the same faction if it can.
function reaim(W, i, t) {
  const ag = W.factions[i].agenda;
  if (!ag?.aims?.length || own(ag)) return false;
  const rand = rngOf(W.seed, `f:${i}:agenda`, W.tries[`f:${i}:agenda`] ?? 0, "aim", t);
  const at = { ...(ag.at ?? {}) };
  for (const a of ag.aims) {
    if (aimOk(W, i, { aims: [a], at })) continue;
    const j = at[a]?.j;
    const list = (a === "res" || a === "asset") && j != null && j !== i ? (W.factions[j]?.[a === "res" ? "res" : "assets"] ?? []) : [];
    if (list.length) at[a] = { j, id: pick(list, rand).id };
    else {
      // With nobody in the crew to go after now, it keeps who it was after.
      const got = aimOf(W, i, [a], rand);
      if (isCrewAim(a) && got[a] == null) continue;
      Object.assign(at, got);
    }
  }
  ag.at = at;
  return aimOk(W, i, ag);
}
function fix(T, W, key, t) {
  if (key === "whole") {
    // The first step a card's missing, dealt again, and the rest after it.
    for (const i of fresh(W)) {
      const step = STEPS.find((s) => s !== "exc" && W.factions[i][s] == null);
      if (step && redealStep(T, W, i, step, null, key, t)) dealFaction(T, W, i);
    }
  } else if (key === "power") {
    for (const i of fresh(W)) if (!powerOk(W, i)) redealStep(T, W, i, "assets", null, key, t);
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
    // The board's own factions first, since theirs are what they are.
    const seen = new Set((W.needs ?? []).map((n) => n.asset.role));
    const roles = (i) => (W.factions[i].assets ?? []).filter((a) => !a.power && a.role).map((a) => a.role);
    for (const i of W.factions.map((_, j) => j).filter((j) => W.factions[j].held)) for (const r of roles(i)) seen.add(r);
    for (const i of fresh(W)) {
      const f = W.factions[i];
      if ((f.assets ?? []).filter((a) => !a.power && a.role && !own(a)).some((a) => seen.has(a.role))) redealStep(T, W, i, "assets", null, key, t);
      for (const r of roles(i)) seen.add(r);
    }
  } else if (key === "aims") {
    for (const i of fresh(W)) {
      const f = W.factions[i];
      if (own(f.agenda) || aimOk(W, i, f.agenda)) continue;
      if (reaim(W, i, t)) W.fixes.push({ k: key, path: `f:${i}:agenda`, t, aim: true });
      else redealStep(T, W, i, "agenda", null, key, t);
    }
  } else if (key === "crew") {
    const i = freeFaction(W, "agenda", key, t);
    if (i != null) redealStep(T, W, i, "agenda", "crew", key, t);
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
  // Adding to a board, the one next to a new faction is one already there.
  const near = (i) => (adding(W) && W.held ? i % W.held : (i + 1) % W.n);
  const used = () => W.fallbacks.push(key);
  if (key === "power") {
    // The die comes down to the people it's got, and the size with it.
    W.factions.forEach((f, i) => {
      if (f.held || powerOk(W, i)) return;
      const die = Math.min(12, 2 * (1 + f.assets.filter((a) => a.power).length));
      const size = [...SIZES].reverse().find((s) => T.book.sizes[s].lo <= die && die <= T.book.sizes[s].hi) ?? f.size.size;
      f.size = { size, die };
      used();
    });
  } else if (key === "rival") {
    W.factions.forEach((f, i) => {
      if (f.held || (W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i))) return;
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
    for (const f of W.factions) if (f.held) for (const a of f.assets ?? []) if (!a.power && a.role) seen.add(a.role);
    W.factions.forEach((f, i) => {
      if (f.held || lockedOrOwn(W, i, "assets")) return;
      const before = (f.assets ?? []).length;
      f.assets = (f.assets ?? []).filter((a) => a.power || !a.role || own(a) || (!seen.has(a.role) && seen.add(a.role)));
      if (f.assets.length !== before) used();
    });
  } else if (key === "aims") {
    W.factions.forEach((f, i) => {
      if (f.held || own(f.agenda) || aimOk(W, i, f.agenda) || lockedOrOwn(W, i, "agenda")) return;
      // Adding to a board with no seat on it to aim at, there's nothing for
      // the fallback to take.
      if (!W.seats.some((s, k) => s && seatToAim(W, i, k))) return;
      f.agenda = { ...keepOf({ id: F.agenda.id, text: F.agenda.text, die: F.agenda.die, aims: ["seat"], why: "" }), at: aimOf(W, i, ["seat"], rngOf(W.seed, "fallback", "aims", i)) };
      used();
    });
  } else if (key === "crew") {
    // One of the characters when there's one, or else what's on the party sheet.
    const i = freeFaction(W, "agenda", "fallback", 1);
    if (i == null) return;
    const aim = W.crew.who.length ? "who" : "thing";
    const row = F[aim];
    if (!row) return;
    W.factions[i].agenda = { ...keepOf({ id: row.id, text: row.text, die: row.die, aims: [aim], why: "" }), at: aimOf(W, i, [aim], rngOf(W.seed, "fallback", "crew", i)) };
    used();
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
  // A resource or an asset in another line is named the way its card names
  // it, capitals and all, like the book writes a permission.
  const resText = (j, id) => {
    const r = (W.factions[j]?.res ?? []).find((x) => x.id === id);
    return r ? { text: fill(r.text, { seat: seatName(j) }), name: true } : "";
  };
  const assetText = (j, id) => {
    const a = (W.factions[j]?.assets ?? []).find((x) => x.id === id);
    return a ? { text: fill(a.text, { seat: seatName(j) }), name: true } : "";
  };
  const T2 = T.core.templates;
  // One of the crew by name, and what the party sheet calls what they've got,
  // without its A or The, since it's "the crew's" in the line.
  const whoText = (k) => {
    const name = crewOf(W, k)?.name ?? W.crew?.seen?.who?.[k];
    return name ? { text: name, name: true } : "";
  };
  const thingText = (t) => {
    const text = (W.crew?.things ?? []).find((y) => y.l === t?.l && y.id === t?.id)?.text ?? W.crew?.seen?.things?.[`${t?.l}:${t?.id}`];
    return text ? { text: text.replace(/^(an?|the)\s+/i, ""), name: true } : "";
  };
  const factions = W.factions.map((f, i) => {
    const seat = seatName(i);
    const slot = (at = {}) => ({
      seat: at.seat != null ? seatAt(at.seat) : seat,
      rival: at.rival != null ? asName(at.rival) : "",
      res: at.res ? resText(at.res.j, at.res.id) : "",
      asset: at.asset ? assetText(at.asset.j, at.asset.id) : "",
      who: at.who != null ? whoText(at.who) : "",
      thing: at.thing ? thingText(at.thing) : "",
    });
    const threads = [];
    for (const t of W.web ?? []) {
      if (t.a !== i && t.b !== i) continue;
      const other = t.a === i ? t.b : t.a;
      const vals = (me, them) => ({ a: asName(me), b: asName(them), res: t.at?.res ? resText(t.a, t.at.res) : "", seat: seatAt(t.at?.seat) });
      // Each thread says which tie it's from (tie), the web's by its pair, so
      // a screen can leave one off.
      const tie = `w:${t.a}-${t.b}`;
      if (t.kind === "wildcard") {
        if (t.a === i) threads.push({ text: fill(t.tie.text, vals(i, other)), kind: t.tie.bond, s: "whole", to: other, tie });
      } else {
        const words = t.a === i ? t.tie.text : t.tie.back || t.tie.text;
        threads.push({ text: fill(words, vals(i, other)), kind: t.kind === "rival" ? "hostile" : "bond", s: "whole", to: other, tie });
      }
    }
    for (const n of W.needs ?? []) {
      if (n.by === i && n.tie) threads.push({ text: fill(n.tie.text, { a: asName(i), b: asName(n.i), res: n.at?.res ? resText(i, n.at.res) : "", seat: seatAt(n.at?.seat) }), kind: "hostile", s: "whole", to: n.i, tie: `n:${n.i}` });
    }
    // Its threads toward the crew, as a character's friend or foe, named for them.
    for (const c of W.crew?.who ?? []) {
      for (const side of SIDES) {
        const p = c[side];
        if (!p || p.j !== i) continue;
        const text = own(p) ? String(p.text ?? "").trim() : fill(p.text, { who: { text: c.name, name: true } });
        if (text) threads.push({ text, kind: side === "foe" ? "hostile" : "bond", s: "whole", to: "crew", tie: `c:${c.k}:${side}`, who: c.k, side });
      }
    }
    const secret = f.secret;
    const rival = secret?.at != null ? asName(secret.at) : "";
    const wayOf = (w) => ({ text: fill(w, { rival, seat }), name: /^\{/.test(w) });
    const ways = secret?.ways?.length === 2 ? fill(T2.ways, { one: wayOf(secret.ways[0]), two: wayOf(secret.ways[1]) }) : "";
    // Her own Face is her words, with no threat behind it till she gives it one.
    const ownFace = own(f.face);
    return {
      held: f.held === true,
      seat: f.seat?.k ?? null,
      size: f.size?.size ?? null,
      die: f.size?.die ?? null,
      steps: 1 + (f.assets ?? []).filter((a) => a.power).length,
      name: nameOf(i),
      about: f.type && f.method ? fill(T2.about, { type: f.type.text, method: f.method.text }) : f.type && own(f.type) && !f.held ? fill(f.type.text, {}) : "",
      // Where it sits, a line to go after what it is, so the seat's name on
      // its card links to the seat's page.
      sits: seat && T2.seat ? fill(T2.seat, { seat }) : "",
      want: f.want ? fill(f.want.text, {}) : "",
      face: f.face ? (ownFace ? String(f.face.text ?? "").trim() : fill(T2.face, { name: { text: f.face.name, name: true }, threat: f.face.threatName })) : "",
      ch: ownFace ? null : f.face?.ch ?? null,
      threat: f.face && !ownFace ? { key: f.face.threat, name: f.face.threatName, is: f.face.is, tags: f.face.tags } : null,
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

// A card's words, the way the board will have them with this pick on its
// step, for a screen's three cards before one's on: each with its because,
// whether it's strange, dealt again from a bag that ran out, or hers.
export function preview(T, W, path, pick) {
  if (!pick) return null;
  const [head, a, b] = path.split(":");
  const base = { why: pick.why ?? "", strange: Boolean(pick.strange), again: Boolean(pick.again), own: Boolean(pick.own) };
  if (head === "ask" || head === "tension") return { ...base, text: fill(pick.text, {}), dials: pick.dials ?? {}, roll: pick.roll ?? null };
  if (head === "seat") return { ...base, name: fill(pick.text, {}), role: pick.role ?? "", notice: pick.notice ?? "" };
  if (head === "crew") {
    const c = crewOf(W, a);
    const text = pick.own ? String(pick.text ?? "").trim() : fill(pick.text, { who: { text: c?.name ?? "", name: true } });
    return { ...base, j: pick.j, name: nameAt(W, pick.j), text, kind: b === "foe" ? "hostile" : "bond" };
  }
  if (head !== "f") return null;
  const i = Number(a);
  if (b === "seat") {
    const s = W.seats[pick.k];
    return { ...base, k: pick.k, name: s ? fill(s.text, {}) : "", role: s?.role ?? "", notice: s?.notice ?? "", strange: Boolean(s?.strange), own: Boolean(s?.own), fresh: adding(W) && pick.k >= W.hs };
  }
  if (b === "size") return { ...base, size: pick.size, word: T.regions[W.recipe.region]?.sizes?.[pick.size] ?? "", die: pick.die };
  if (b === "type" || b === "method" || b === "want") return { ...base, text: fill(pick.text, {}) };
  if (b === "exc") return { ...base, text: pick.text ?? "", reason: pick.reason ?? "" };
  const W2 = { ...W, factions: W.factions.map((f, j) => (j === i ? { ...f, [b]: pick } : f)) };
  const C = cardsOf(T, W2).factions[i];
  const item = (x, k, list) => ({ text: list[k]?.text ?? "", why: x?.why ?? "", strange: Boolean(x?.strange), own: Boolean(x?.own) });
  if (b === "res") return { ...base, items: pick.map((x, k) => item(x, k, C.res)) };
  if (b === "assets") return { ...base, items: pick.map((x, k) => ({ ...item(x, k, C.assets), does: C.assets[k]?.does ?? "", power: C.assets[k]?.power === true })) };
  if (b === "agenda") return { ...base, text: C.agendas[0]?.text ?? "", die: pick.die ?? null };
  if (b === "face") return { ...base, text: C.face, ch: C.ch, threat: C.threat };
  if (b === "secret") return { ...base, tag: C.secret, more: C.more };
  if (b === "name") return { ...base, text: C.name };
  return null;
}

// What was dealt, as doc.build keeps it: plain words and numbers, nothing of
// the tables but what the picks hold, and all resume() needs to carry on.
export function recordOf(W) {
  return JSON.parse(
    JSON.stringify({
      v: 1,
      seed: W.seed,
      recipe: W.recipe,
      ...(adding(W) ? { add: true, held: W.held, hs: W.hs } : {}),
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
      crew: W.crew ?? null,
    }),
  );
}
