// The deck (stage 7 of notes/builder-plan.md, Building by answering): a third
// way to make the factions in Build the world, after the ground. She goes
// through a deck of moments a card at a time, the way a reign goes, and how
// she answers forms the factions, so she never fills one in line by line.
// It's pure, with no page, and plays on top of world-engine.js: an answer
// becomes the engine's own picks, locks, tags and threads (what happened, at
// the top of world-engine.js), and the end deals what's still open around
// what the answers made (dealRest()).
//
// Every word it shows comes off the tables (the moments in core.yaml and the
// packs, and the rows they deal) or is typed by her. It writes nothing of its
// own.
//
// The deck's kept in the world in progress as W.deck, so recordOf(),
// resume() and zi-make keep it:
//   age     the age that's on: 1 long ago, 2 in living memory, 3 this last year
//   pos     how many cards have been answered
//   cards   what was played, a card at a time: the moment (m), who was on it
//           (a brought it, b's the faction it's about, or s the seat nobody
//           holds, and who one of the crew), its voice, which way it went
//           (side), its line of history, what fills its slots (vals), and
//           whether the answer made a Secret (secret)
//   up      the card that's up, once it's dealt, with what it says they've got
//   nots    the moments Not this one's passed over for the card that's up
//   open    a prompt waiting for her, after an answer that asks for a name
//           or a detail: its kind, its question and three suggestions
//   chains  stories an answer started, each waiting to land a few cards on,
//           with its factions and the words it carries
//   voices  who brought each faction's cards in each age, off the pack's
//           people, by "<faction>:<age>". This last year's is its Face.
//   parts   what's formed of each faction, and when: like and keep long ago
//           (what it's like, so how it works and its Want, and what it took),
//           foe and friend in living memory (a rival, and an ally or a debt),
//           agenda, secret and face this last year
//   board   who of the crew's come in by name (in), since the rest of what
//           the board needs is read off it as it stands: the needs blocked
//           by someone, a Secret naming another faction, something strange,
//           and a faction after the crew
//   base    the world before the first card, and log every answer since (its
//           side, how many Not this ones came before it, and its prompt), so
//           Undo plays them all again bar the last, and the same seed and the
//           same answers deal the same deck and the same board
//   closed  the last card's been played, and done, there are no more cards
//
// The screens use startDeck() after the ground, current() for the card that's
// up, answer(), prompted() and fillPrompt(), notThis(), undo(), and finish()
// at the end. playRest() answers the rest at random, historyOf() is How it
// came to be, formedOf() what's formed of each faction, for its tile, and
// playedOf() a card that's been answered, the way it read.
import { QUESTIONS, SIZES, dealOne, dealRest, dealTie, drawOf, fill, fitsRecipe, mendAims, needsOf, options, poolOf, recordOf, resume, rngOf } from "./world-engine.js";

export const MAX = 70;
export const AGES = [1, 2, 3];
export const PARTS = { 1: ["like", "keep"], 2: ["foe", "friend"], 3: ["agenda", "secret", "face"] };
// A chain's next card comes this many cards after the one that started it.
const GAP = [2, 4];
// What's dealt with the ground: who's who, so a card can say who's on it.
const WHO = ["seat", "size", "type", "exc"];
const THINGS = ["res", "asset", "people"];
const WORDS = ["person", "place", "detail"];
// The effects that make a thread, the first of which takes an answer's own
// words for it (thread and back).
const THREADING = new Set(["ally", "debt", "favour", "rival", "grudge", "strain", "block", "friend", "foe"]);
// How the dials weight a moment, by what its answers do: how tense brings
// feuds, how rich deals and debts, how ruled the law, how strange the strange.
const DIAL = [0.6, 1, 1.6];
const STRANGE = [0.35, 1, 2.5];
const HOSTILE = new Set(["rival", "grudge", "strain", "agenda"]);
const RICH = new Set(["gain", "take", "debt", "block"]);
const RULED = new Set(["house", "office", "soldiers"]);

const copy = (x) => JSON.parse(JSON.stringify(x));
const fresh = (W) => W.factions.map((_, i) => i).filter((i) => !W.factions[i].held);
const seatName = (W, k) => (k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "");
const seatOf = (W, i) => W.factions[i]?.seat?.k ?? null;
const freeSeats = (W) => W.seats.map((s, k) => (s && !W.factions.some((f) => f.seat?.k === k) ? k : null)).filter((k) => k != null);
const named = (text) => (text ? { text, name: true } : "");

// The moments a world deals from: core's, and its era's and twist's that fit
// its region and its era.
const decks = new WeakMap();
export function deckOf(T, recipe) {
  const key = `${recipe.region}|${recipe.era}|${recipe.twist ?? ""}`;
  let byKey = decks.get(T);
  if (!byKey) decks.set(T, (byKey = new Map()));
  if (byKey.has(key)) return byKey.get(key);
  const packs = [T.packs[`era:${recipe.era}`], recipe.twist ? T.packs[`twist:${recipe.twist}`] : null].filter((p) => p && p.fits.includes(recipe.region));
  const fits = (m) => fitsRecipe(m, recipe);
  const all = [...(T.core.deck ?? []), ...packs.flatMap((p) => p.deck ?? [])].filter(fits);
  const D = { all, byId: new Map(all.map((m) => [m.id, m])), byKey: new Map(all.filter((m) => m.key).map((m) => [m.key, m])) };
  byKey.set(key, D);
  return D;
}
const momentOf = (T, W, id) => deckOf(T, W.recipe).byId.get(id) ?? null;

// What a faction's called on the cards: its name, or till it's named, what
// it is and where it sits (the bell-founders' guild on the Old Bridge), what
// it is up to its first comma (the millers on the Abbey Orchards, for
// Millers, father to son).
export function calledOf(T, W, i) {
  const f = W.factions[i];
  if (!f) return "";
  const seat = seatName(W, seatOf(W, i));
  if (f.name) return fill(f.name.text, { seat });
  const what = String(f.type?.text ?? "")
    .split(",")[0]
    .trim()
    .replace(/[.]+$/, "")
    .replace(/^(a|an|the)\s+/i, "");
  const type = /^[A-Z][a-z]/.test(what) ? what.charAt(0).toLowerCase() + what.slice(1) : what;
  return fill(T.core.templates.called, { type, seat });
}
const miniCalled = (W, k) => {
  const x = W.minis?.[k];
  return x?.name ? fill(x.name.text, { seat: seatName(W, seatOf(W, x.of)) }) : "";
};

// ── Starting.
// After the ground: whatever's still to deal of the asking and the seats,
// then each faction's seat, size, what it is and any exception, dealt the
// way they are now, and an empty deck.
export function startDeck(T, W) {
  if (W.deck) return W;
  for (const q of QUESTIONS) if (!W.asking[q]) W.asking[q] = options(T, W, `ask:${q}`, 1)[0] ?? null;
  if (!W.tension) W.tension = options(T, W, "tension", 1)[0] ?? null;
  for (let k = 0; k < W.s; k++) if (!W.seats[k]) W.seats[k] = options(T, W, `seat:${k}`, 1)[0] ?? null;
  for (const i of fresh(W)) {
    const f = W.factions[i];
    for (const step of WHO) {
      if (step === "exc" ? f.exc !== undefined : f[step] != null) continue;
      f[step] = options(T, W, `f:${i}:${step}`, 1)[0] ?? null;
    }
    f.got ??= { res: [], assets: [] };
    f.leans ??= [];
    f.lost ??= { res: 0 };
  }
  W.made ??= { ties: [], needs: [] };
  W.minis ??= [];
  W.web = null;
  W.needs = null;
  W.checks = null;
  W.deck = { v: 1, age: 1, pos: 0, cards: [], up: null, nots: [], open: null, chains: [], voices: {}, parts: {}, board: { in: {} }, log: [], base: null, closed: false, done: false };
  W.deck.base = recordOf({ ...W, deck: null });
  return W;
}

// ── What's formed.
const hasPart = (D, i, p) => D.parts[i]?.[p] != null;
const form = (D, i, p, pos) => {
  if (i == null) return;
  D.parts[i] ??= {};
  D.parts[i][p] ??= pos;
};
// What an age still needs: each faction's parts, its own and any an age
// before it ran out of cards for, and the board's.
function missingOf(T, W, age) {
  const D = W.deck;
  const f = {};
  for (const i of fresh(W)) {
    const left = AGES.filter((a) => a <= age)
      .flatMap((a) => PARTS[a])
      .filter((p) => !hasPart(D, i, p));
    if (left.length) f[i] = left;
  }
  const board = [];
  if (age === 2 && W.made.needs.length < needsOf(W)) board.push("needs");
  if (age === 3) {
    // What's on the board now, since a later card can deal a faction's
    // agenda or Secret again.
    if (!W.factions.some((x) => x.secret?.at != null)) board.push("rival");
    if (!strangeOn(W)) board.push("strange");
    const who = W.crew?.who ?? [];
    if (who.length && !W.factions.some((x) => x.agenda?.aims?.some((a) => a === "who" || a === "thing"))) board.push("after");
    for (const c of who) if (D.board.in[c.k] == null) board.push(`in:${c.k}`);
  }
  return { f, board };
}
// Whether a faction's agenda or Secret is the only one of its kind the board
// has to have: the only agenda after the crew, the only Secret naming
// another faction, or the only strange thing. A later card leaves it be.
function needed(W, i, step) {
  const p = W.factions[i]?.[step];
  if (!p) return false;
  const others = W.factions.filter((_, j) => j !== i);
  if (step === "agenda" && p.aims?.some((a) => a === "who" || a === "thing") && !others.some((x) => x.agenda?.aims?.some((a) => a === "who" || a === "thing"))) return true;
  if (step === "secret" && p.at != null && !others.some((x) => x.secret?.at != null)) return true;
  if (p.strange) {
    const f = W.factions[i];
    const was = f[step];
    f[step] = null;
    const left = strangeOn(W);
    f[step] = was;
    if (!left) return true;
  }
  return false;
}
// Something strange on the board, the way the engine's check counts it.
function strangeOn(W) {
  if (W.seats.some((s) => s?.strange)) return true;
  for (const f of W.factions) {
    if (["type", "exc", "agenda", "secret", "name"].some((k) => f[k]?.strange)) return true;
    if ([...(f.got?.res ?? []), ...(f.got?.assets ?? [])].some((x) => x.strange)) return true;
  }
  return (W.made?.needs ?? []).some((n) => n.asset?.strange);
}
const formedIn = (T, W, age) => {
  const m = missingOf(T, W, age);
  return !Object.keys(m.f).length && !m.board.length;
};

// ── The people on the cards: each faction's voice in each age, and anyone
// a card names, off the pack's people, none twice till they've all been.
function peopleUsed(W) {
  const D = W.deck;
  const used = new Set();
  for (const v of Object.values(D?.voices ?? {})) v?.nameId && used.add(v.nameId);
  for (const f of W.factions) {
    f.voice?.nameId && used.add(f.voice.nameId);
    f.face?.nameId && used.add(f.face.nameId);
  }
  for (const c of D?.cards ?? []) c.vals?.person?.nameId && used.add(c.vals.person.nameId);
  for (const c of D?.chains ?? []) c.words?.person?.nameId && used.add(c.words.person.nameId);
  return used;
}
// Once everyone's been, it's anyone who isn't a faction's Face, so no two
// factions ever share one.
function facesOf(W) {
  const D = W.deck;
  const out = new Set();
  for (const [k, v] of Object.entries(D?.voices ?? {})) if (k.endsWith(":3") && v?.nameId) out.add(v.nameId);
  for (const f of W.factions) for (const x of [f.voice, f.face]) x?.nameId && out.add(x.nameId);
  return out;
}
function peopleOf(T, W, rand, n = 1, not = []) {
  const P = poolOf(T, W.recipe);
  const used = peopleUsed(W);
  for (const x of not) x && used.add(x);
  const left = P.people.filter((r) => !used.has(r.id));
  const faces = facesOf(W);
  const open = P.people.filter((r) => !faces.has(r.id));
  const from = left.length >= n ? left : open.length >= n ? open : P.people;
  return drawOf(from.map((r) => ({ w: r.w, r })), rand, n).map(({ r }) => ({ text: r.text, nameId: r.id }));
}

// ── Holding things: what a faction's sure to hold (got), what it's lost,
// and its size and Power kept in step with them. People who turn up are
// Power: a lot more is a step more, and a lot fewer a step less.
const haveOf = (W, i, what) => {
  const g = W.factions[i]?.got;
  if (!g) return [];
  return what === "res" ? g.res : what === "people" ? g.assets.filter((a) => a.power) : g.assets.filter((a) => !a.power);
};
function refit(T, f) {
  const S = T.book.sizes;
  const got = f.got ?? { res: [], assets: [] };
  const people = got.assets.filter((a) => a.power).length;
  let die = Math.max(2, Math.min(12, f.size?.die ?? 2, 12), 2 * (1 + people));
  die = Math.min(12, die);
  const need = () => Math.max(got.res.length, got.assets.filter((a) => !a.power).length + Math.max(people, die / 2 - 1) + (f.spare ? 1 : 0));
  const holds = (s) => S[s].lo <= die && die <= S[s].hi && S[s].rhi >= need();
  // Too much to pay for at its Power: it's bigger than its die says, so the
  // die comes up to the smallest size that holds it all.
  if (!SIZES.some(holds)) {
    const s = SIZES.find((x) => S[x].rhi >= need()) ?? "great";
    die = Math.max(die, S[s].lo);
  }
  const size = holds(f.size?.size) ? f.size.size : SIZES.find(holds) ?? [...SIZES].reverse().find((x) => S[x].lo <= die && die <= S[x].hi) ?? f.size?.size;
  f.size = { size, die };
}
function holdOf(T, W, i, what, item, { said = false } = {}) {
  const f = W.factions[i];
  if (!f || !item) return false;
  f.got ??= { res: [], assets: [] };
  if (what === "res") {
    if (f.got.res.some((r) => r.id === item.id)) return false;
    f.got.res.push(item);
  } else {
    // Never two of the same on one card.
    if (f.got.assets.some((a) => a.role === item.role)) return false;
    f.got.assets.push(item);
    // People a card says it's got are some it was going to have, if its die
    // has room for them, and any more raise it.
    if (item.power && (!said || f.got.assets.filter((a) => a.power).length > f.size.die / 2 - 1)) f.size = { ...f.size, die: Math.min(12, f.size.die + 2) };
  }
  refit(T, f);
  return true;
}
function dropOf(T, W, i, what, id) {
  const f = W.factions[i];
  if (!f?.got) return null;
  const list = what === "res" ? f.got.res : f.got.assets;
  const k = list.findIndex((x) => x.id === id);
  if (k < 0) return null;
  const [item] = list.splice(k, 1);
  if (item.power) f.size = { ...f.size, die: Math.max(2, f.size.die - 2) };
  refit(T, f);
  return item;
}
function loseOf(T, W, i, what) {
  const f = W.factions[i];
  if (!f) return;
  f.lost ??= { res: 0 };
  if (what === "res") f.lost.res += 1;
  if (what === "people" && f.size.die > 2) {
    f.size = { ...f.size, die: f.size.die - 2 };
    // Fewer than it's sure to hold: one of those goes.
    const people = (f.got?.assets ?? []).filter((a) => a.power);
    if (people.length > f.size.die / 2 - 1) f.got.assets.splice(f.got.assets.indexOf(people[people.length - 1]), 1);
    refit(T, f);
  }
}

// ── A card's words and its line, with what fills its slots: the factions by
// what they're called now, the seats, and the things and people the card
// named, so the history reads with the names they've got by the end.
function valsOf(T, W, c) {
  const v = (x) => named(x?.text ?? "");
  const crew = (k) => W.crew?.who?.find((x) => x.k === k)?.name ?? W.crew?.seen?.who?.[k] ?? "";
  return {
    a: named(calledOf(T, W, c.a)),
    b: c.b != null ? named(calledOf(T, W, c.b)) : c.s != null ? seatName(W, c.s) : "",
    seat: seatName(W, seatOf(W, c.a)),
    res: v(c.vals?.res),
    asset: v(c.vals?.asset),
    people: v(c.vals?.people),
    person: v(c.vals?.person),
    place: v(c.vals?.place),
    detail: v(c.vals?.detail),
    who: c.who ? named(crew(c.who)) : "",
    mini: c.vals?.mini != null ? named(miniCalled(W, c.vals.mini)) : "",
  };
}
export const lineOf = (T, W, c) => fill(c.line, valsOf(T, W, c));
// Its because: "because" and its line, for a step it steered or a thing it
// made. A line that starts with a name keeps its capitals.
const leadsWithName = (line) => /^\{[a-z]+\}/.test(String(line ?? ""));
const whyOf = (T, W, c) => fill(T.core.because.moment ?? "because {thing}", { thing: { text: lineOf(T, W, c), name: leadsWithName(c.line) } });

// ── Dealing the card that's up.
// Who's on a card: the faction that's least formed (the focus), and the one
// with the most still to form alongside it that it hasn't met much, or a
// seat nobody holds, and one of the crew on a crew moment.
function tally(W) {
  const D = W.deck;
  const seen = new Map();
  const met = new Map();
  const add = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const c of D.cards) {
    add(seen, c.a);
    if (c.b != null) {
      add(seen, c.b);
      add(met, c.a < c.b ? `${c.a}-${c.b}` : `${c.b}-${c.a}`);
    }
    if (c.s != null) add(seen, `s${c.s}`);
  }
  return { seen: (i) => seen.get(i) ?? 0, met: (i, j) => (i == null || j == null ? 0 : met.get(i < j ? `${i}-${j}` : `${j}-${i}`) ?? 0) };
}
function focusOf(W, miss, rand) {
  const t = tally(W);
  let best = null;
  let bw = -Infinity;
  for (const [k, parts] of Object.entries(miss.f)) {
    const i = Number(k);
    const w = parts.length * 10 - t.seen(i) + rand();
    if (w > bw) [bw, best] = [w, i];
  }
  return best;
}
function whoFor(W, miss, rand, any = false) {
  const who = W.crew?.who ?? [];
  if (!who.length) return null;
  const out = who.filter((c) => miss.board.includes(`in:${c.k}`));
  const list = out.length ? out : any || miss.board.includes("after") ? who : [];
  return list.length ? list[Math.floor(rand() * list.length) % list.length].k : null;
}
function castsOf(T, W, m, focus, miss, rand, t, { last = false } = {}) {
  const kindOf = (i) => W.factions[i]?.type?.role ?? null;
  const fits = (i, kinds) => !kinds || kinds.includes(kindOf(i));
  const all = fresh(W);
  const missN = (i) => miss.f[i]?.length ?? 0;
  // The best one to have alongside: whoever the card does most for, then
  // whoever it's met least and been on fewest cards, then chance.
  const best = (list, castOf) => {
    let got = null;
    let bw = -Infinity;
    for (const j of list) {
      const cast = castOf(j);
      const forms = (formsOf(W, m, cast, m.answers[0], miss, focus) + formsOf(W, m, cast, m.answers[1], miss, focus)) / 2;
      const w = 4 * forms + missN(j) - 1.5 * t.met(cast.a, cast.b) - 0.3 * t.seen(cast.s === j ? `s${j}` : j) + rand();
      if (w > bw) [bw, got] = [w, cast];
    }
    return got;
  };
  const seats = () => freeSeats(W);
  const out = [];
  const who = m.crew ? whoFor(W, miss, rand, last) : null;
  if (m.crew && who == null) return out;
  for (const role of focus == null ? [null] : ["a", "b"]) {
    let cast = null;
    if (role === "a") {
      if (!fits(focus, m.a)) continue;
      cast = m.seat ? best(seats(), (k) => ({ a: focus, b: null, s: k, who })) : best(all.filter((j) => j !== focus && fits(j, m.b)), (j) => ({ a: focus, b: j, s: null, who }));
    } else if (role === "b") {
      if (m.seat || !fits(focus, m.b)) continue;
      cast = best(all.filter((j) => j !== focus && fits(j, m.a)), (j) => ({ a: j, b: focus, s: null, who }));
    } else {
      // No focus: whoever's been on fewest cards brings it.
      const a = best(all.filter((j) => fits(j, m.a)), (j) => ({ a: j, b: null, s: null, who }))?.a ?? null;
      if (a == null) continue;
      cast = m.seat ? best(seats(), (k) => ({ a, b: null, s: k, who })) : best(all.filter((j) => j !== a && fits(j, m.b)), (j) => ({ a, b: j, s: null, who }));
    }
    if (cast) out.push(cast);
  }
  return out;
}
// The tags a card's on: the board's (its region, the asking and the
// tension), and its factions' (their seats, what they are and what they did).
function boardTags(W) {
  return [W.recipe.region, ...QUESTIONS.flatMap((q) => W.asking[q]?.tags ?? []), ...(W.tension?.tags ?? [])];
}
function factionTags(W, i) {
  const f = W.factions[i];
  if (!f) return [];
  const s = f.seat ? W.seats[f.seat.k] : null;
  return [s?.role, ...(s?.tags ?? []), f.type?.role, ...(f.type?.tags ?? []), ...(f.leans ?? []).flatMap((l) => l.tags ?? [])].filter(Boolean);
}
function castTags(W, cast) {
  const s = cast.s != null ? W.seats[cast.s] : null;
  return new Set([...boardTags(W), ...factionTags(W, cast.a), ...(cast.b != null ? factionTags(W, cast.b) : [s?.role, ...(s?.tags ?? [])])].filter(Boolean));
}
const fitsBoard = (W, m, cast) => {
  if (!m.needs.length && !m.out.length) return true;
  const tags = castTags(W, cast);
  return m.needs.every((x) => tags.has(x)) && !m.out.some((x) => tags.has(x));
};
// How much of what's still missing an answer forms: two for the focus's
// parts, one for anyone else's, and one and a half for the board's.
function formsOf(W, m, cast, ans, miss, focus) {
  const on = (x) => (x === "a" ? cast.a : x === "b" ? cast.b : null);
  const got = new Set();
  let n = 0;
  const mark = (i, p) => {
    const k = `${i}:${p}`;
    if (i == null || got.has(k) || !miss.f[i]?.includes(p)) return;
    got.add(k);
    n += i === focus ? 2 : 1;
  };
  const board = (p) => {
    if (got.has(p) || !miss.board.includes(p)) return;
    got.add(p);
    n += 1.5;
  };
  for (const fx of ans.does) {
    const X = on(fx.on);
    const Y = on(fx.to ?? fx.from);
    if (fx.k === "gain" || fx.k === "take") mark(X, "keep");
    else if (fx.k === "lean") mark(X, "like");
    else if (fx.k === "rival") (mark(X, "foe"), mark(Y, "foe"));
    else if (fx.k === "ally" || fx.k === "debt") (mark(X, "friend"), mark(Y, "friend"));
    else if (fx.k === "block") Y != null && !W.made.needs.some((x) => x.i === Y) && board("needs");
    else if (fx.k === "agenda") (mark(X, "agenda"), fx.to === "who" && board("after"));
    else if (fx.k === "secret") (mark(X, "secret"), Y != null && board("rival"));
    else if (fx.k === "face") mark(X, "face");
  }
  // Whoever brings a card this last year is its Face.
  if (m.age === 3) mark(cast.a, "face");
  if (m.strange) board("strange");
  if (m.crew && cast.who) board(`in:${cast.who}`);
  return n;
}
function weightOf(W, m, cast) {
  const d = W.dials;
  const ks = new Set(m.answers.flatMap((x) => x.does.map((f) => f.k)));
  let w = m.w;
  if ([...ks].some((k) => HOSTILE.has(k))) w *= DIAL[d.tense];
  if ([...ks].some((k) => RICH.has(k))) w *= DIAL[d.rich];
  if (m.tags.includes("law") || m.tags.includes("crown") || [m.a, m.b].some((x) => x?.some((k) => RULED.has(k)))) w *= DIAL[d.ruled];
  if (m.strange) w *= STRANGE[d.strange];
  // A seat nobody holds comes up less for each of the last three cards that
  // was about one, so the cards don't sit on the same ground.
  if (m.seat) w *= 0.35 ** W.deck.cards.slice(-3).filter((c) => c.s != null).length;
  if (m.tags.length) {
    const tags = castTags(W, cast);
    w *= 1 + 0.5 * Math.min(3, m.tags.filter((x) => tags.has(x)).length);
  }
  return w;
}
// The next card: the one that does most for whatever's least formed in its
// age, a moment at a time, never one that's been played, never one Not this
// one passed over while there's another.
function pickCard(T, W) {
  const D = W.deck;
  const M = deckOf(T, W.recipe);
  const miss = missingOf(T, W, D.age);
  const r = (k) => rngOf(W.seed, "deck", D.pos, D.nots.length, k);
  // Not this one deals another card for the same faction, so the focus
  // doesn't move with it.
  const focus = focusOf(W, miss, rngOf(W.seed, "deck", D.pos, "focus"));
  const t = tally(W);
  const used = new Set(D.cards.map((c) => c.m));
  const crew = Boolean(W.crew?.who?.length);
  const hand = (f, nots) => {
    const rand = r(`cast:${f}:${nots ? 1 : 0}`);
    const out = [];
    for (const m of M.all) {
      if (m.age !== D.age || m.chain || m.last || used.has(m.id) || (nots && D.nots.includes(m.id)) || (m.crew && !crew)) continue;
      for (const cast of castsOf(T, W, m, f, miss, rand, t)) {
        if (!fitsBoard(W, m, cast)) continue;
        const s = (formsOf(W, m, cast, m.answers[0], miss, f) + formsOf(W, m, cast, m.answers[1], miss, f)) / 2;
        if (s > 0) out.push({ w: s * s * weightOf(W, m, cast), m, cast });
      }
    }
    return out;
  };
  let cands = hand(focus, true);
  if (!cands.length && focus != null) cands = hand(null, true);
  // Not this one's been through every card there is: back round to them.
  if (!cands.length && D.nots.length) cands = hand(focus, false);
  const rand = r("pick");
  while (cands.length) {
    const [c] = drawOf(cands, rand);
    const up = upOf(T, W, c.m, c.cast);
    if (up) return up;
    cands = cands.filter((x) => x !== c);
  }
  return null;
}
// The deck's last card, how things stood when the crew turned up.
function lastOf(T, W) {
  const D = W.deck;
  const M = deckOf(T, W.recipe);
  const used = new Set(D.cards.map((c) => c.m));
  const miss = { f: {}, board: [] };
  const rand = rngOf(W.seed, "deck", "last", D.pos, D.nots.length);
  const t = tally(W);
  const hand = (nots) => {
    const out = [];
    for (const m of M.all) {
      if (!m.last || used.has(m.id) || (nots && D.nots.includes(m.id)) || (m.crew && !W.crew?.who?.length)) continue;
      for (const cast of castsOf(T, W, m, null, miss, rand, t, { last: true })) if (fitsBoard(W, m, cast)) out.push({ w: weightOf(W, m, cast), m, cast });
    }
    return out;
  };
  // Not this one's been through every last card there is: back round to them.
  let cands = hand(true);
  if (!cands.length && D.nots.length) cands = hand(false);
  while (cands.length) {
    const [c] = drawOf(cands, rand);
    const up = upOf(T, W, c.m, c.cast);
    if (up) return up;
    cands = cands.filter((x) => x !== c);
  }
  return null;
}
// The card, dealt: its voice, and what it says they've got ({res}, {asset},
// {people}: one they're sure to hold, or one dealt for them that they'll
// hold once it's answered), and anyone it names.
function upOf(T, W, m, cast, chain = null) {
  const D = W.deck;
  const rand = (k) => rngOf(W.seed, "deck", "up", D.pos, D.nots.length, m.id, k);
  const up = { m: m.id, age: m.age, a: cast.a, b: cast.b ?? null, s: cast.s ?? null, who: cast.who ?? null, chain: chain ? chain.from : null, last: m.last === true, words: copy(chain?.words ?? {}), voice: null, res: null, asset: null, people: null };
  up.voice = D.voices[`${cast.a}:${m.age}`] ?? peopleOf(T, W, rand("voice"))[0] ?? null;
  if (!up.voice) return null;
  for (const what of THINGS) {
    const whose = m[what];
    if (!whose) continue;
    if (whose === "seat") {
      const item = dealOne(T, W, cast.a, "res", { seat: cast.s, rand: rand(what), strange: m.strange });
      if (!item) return null;
      up.res = { on: null, item: { ...item, text: fill(item.text, { seat: seatName(W, cast.s) }) }, fresh: true };
      continue;
    }
    const i = whose === "a" ? cast.a : cast.b;
    const have = haveOf(W, i, what);
    if (have.length) up[what] = { on: i, item: copy(have[Math.floor(rand(what)() * have.length) % have.length]), fresh: false };
    else {
      const item = dealOne(T, W, i, what, { rand: rand(what), strange: m.strange });
      if (!item) return null;
      up[what] = { on: i, item, fresh: true };
    }
  }
  if (m.person && !up.words.person) {
    const p = peopleOf(T, W, rand("person"), 1, [up.voice.nameId])[0];
    if (!p) return null;
    up.words.person = p;
  }
  return up;
}
// The card that's up, dealt the first time it's asked for. The age moves on
// once it's formed for every faction and the board, a chain that's due
// lands first, and once everything's formed and every chain's landed, the
// last card, and then there are none.
function cardUp(T, W) {
  const D = W.deck;
  if (!D || D.done || D.open) return null;
  if (D.up) return D.up;
  while (D.age < 3 && formedIn(T, W, D.age)) D.age++;
  const formed = D.age === 3 && formedIn(T, W, 3);
  const late = D.pos + D.chains.length >= MAX;
  const due = D.chains
    .map((c) => ({ c, m: momentOf(T, W, c.m) }))
    .filter(({ c, m }) => m && (formed || late || (c.due <= D.pos && m.age <= D.age)))
    .sort((x, y) => x.c.due - y.c.due || x.c.from - y.c.from)[0];
  if (due) {
    const up = upOf(T, W, due.m, due.c, due.c);
    if (up) return (D.up = up);
    D.chains = D.chains.filter((c) => c !== due.c);
    return cardUp(T, W);
  }
  if (D.pos >= MAX) return end(D);
  const up = formed ? null : pickCard(T, W);
  if (up) return (D.up = up);
  // Nothing left can form what this age still needs: on to the next.
  if (!formed && D.age < 3) {
    D.age++;
    return cardUp(T, W);
  }
  if (!D.closed) {
    const last = lastOf(T, W);
    if (last) return (D.up = last);
  }
  return end(D);
}
const end = (D) => {
  D.done = true;
  D.up = null;
  return null;
};
const touchesOf = (up, ans) => {
  const out = new Set([up.a]);
  for (const fx of ans.does) for (const x of [fx.on, fx.to, fx.from]) if (x === "a" || (x === "b" && up.b != null)) out.add(x === "a" ? up.a : up.b);
  if (up.b != null) out.add(up.b);
  return [...out];
};
// The card that's up, as a screen shows it: who's bringing it, their words,
// and the two answers, each with the factions it touches, or null when a
// prompt's waiting or there are no more cards.
export function current(T, W) {
  const up = cardUp(T, W);
  if (!up) return null;
  const m = momentOf(T, W, up.m);
  const c = { ...up, vals: { res: up.res && { text: up.res.item.text }, asset: up.asset && { text: up.asset.item.text }, people: up.people && { text: up.people.item.text }, person: up.words.person, place: up.words.place, detail: up.words.detail } };
  return {
    pos: W.deck.pos,
    age: m.age,
    m: m.id,
    chain: up.chain != null,
    from: up.chain,
    last: m.last,
    strange: m.strange,
    voice: up.voice.text,
    speaker: fill(T.core.templates.voice, { name: named(up.voice.text), faction: named(calledOf(T, W, up.a)) }),
    text: fill(m.text, valsOf(T, W, c)),
    a: up.a,
    b: up.b,
    s: up.s,
    who: up.who,
    answers: m.answers.map((ans) => ({ text: ans.text, touches: touchesOf(up, ans), prompt: Boolean(ans.prompt) })),
  };
}

// A card that's been answered, the way it read: who brought it, their words
// and the answer, with the names they've got now, and its line.
export function playedOf(T, W, pos) {
  const c = W.deck?.cards[pos];
  const m = c ? momentOf(T, W, c.m) : null;
  if (!m) return null;
  return {
    pos,
    age: c.age,
    speaker: fill(T.core.templates.voice, { name: named(c.voice?.text ?? ""), faction: named(calledOf(T, W, c.a)) }),
    text: fill(m.text, valsOf(T, W, c)),
    answer: m.answers[c.side]?.text ?? "",
    line: lineOf(T, W, c),
  };
}

// ── Answering.
// An answer: what the card said they've got is theirs, what it does is
// done, its line goes into the history, the chain it starts waits to land,
// and its prompt, if it's got one, waits for her.
export function answer(T, W, side) {
  const D = W.deck;
  if (!D || D.open || D.done) return null;
  const up = cardUp(T, W);
  if (!up) return null;
  const m = momentOf(T, W, up.m);
  const k = side === 1 ? 1 : 0;
  const ans = m.answers[k];
  const pos = D.pos;
  const r = (x) => rngOf(W.seed, "deck", "fx", pos, x);
  // Whether the answer made a Secret is stamped on the card, so its line stays
  // hers whatever the tables become (secret).
  const card = { m: m.id, age: m.age, a: up.a, b: up.b, s: up.s, who: up.who, side: k, voice: copy(up.voice), line: ans.line, vals: {}, chain: up.chain, secret: ans.does.some((fx) => fx.k === "secret") };
  // Who brought it, and this last year, its Face.
  D.voices[`${up.a}:${m.age}`] ??= copy(up.voice);
  if (m.age === 3 && !W.factions[up.a].voice) {
    W.factions[up.a].voice = { name: up.voice.text, nameId: up.voice.nameId ?? null };
    form(D, up.a, "face", pos);
  }
  for (const what of THINGS) {
    const x = up[what];
    if (!x) continue;
    card.vals[what] = { text: x.item.text };
    if (x.fresh && x.on != null) holdOf(T, W, x.on, what, { ...x.item, made: pos, age: m.age }, { said: true });
  }
  for (const w of WORDS) if (up.words[w]) card.vals[w] = copy(up.words[w]);
  const ctx = { T, W, D, m, ans, up, card, pos, r, first: ans.does.findIndex((f) => THREADING.has(f.k)) };
  ans.does.forEach((fx, n) => doFx(ctx, fx, n));
  // What it made reads its line as it stands now it's all done.
  for (const f of W.factions) {
    for (const l of f.leans ?? []) if (l.made === pos) l.text = lineOf(T, W, card);
    for (const x of [f.agenda, f.secret, ...(f.got?.res ?? []), ...(f.got?.assets ?? [])]) if (x?.made === pos && x.by === "moment") x.why = whyOf(T, W, card);
  }
  if (m.crew && up.who) D.board.in[up.who] ??= pos;
  if (up.chain != null) D.chains = D.chains.filter((c) => !(c.from === up.chain && c.m === m.id));
  D.cards.push(card);
  D.log.push({ side: k, nots: D.nots.length });
  D.pos += 1;
  D.up = null;
  D.nots = [];
  if (m.last) D.closed = true;
  if (ans.then && D.pos + GAP[1] < MAX) {
    const t = deckOf(T, W.recipe).byKey.get(ans.then);
    if (t) D.chains.push({ m: t.id, a: up.a, b: up.b, s: up.s, who: up.who, words: copy(up.words), from: pos, due: D.pos + GAP[0] - 1 + Math.floor(r("then")() * (GAP[1] - GAP[0] + 1)) });
  }
  if (ans.prompt) D.open = openOf(T, W, ans.prompt, card, pos);
  return { line: lineOf(T, W, card), prompt: D.open ? copy(D.open) : null };
}
// A card's own words for its first thread, with what the card named filled
// in, and the faction it's toward (and the crew's) left to fill as they're
// called by the end.
function ownWords(ctx, n) {
  const { ans, card, W, T } = ctx;
  if (!ans.thread || n !== ctx.first) return null;
  const v = valsOf(T, W, card);
  const keep = (s) => (s ? fill(s, { res: v.res, asset: v.asset, people: v.people, person: v.person, place: v.place, detail: v.detail, seat: card.s != null ? seatName(W, card.s) : v.seat }) : "");
  return { text: keep(ans.thread), back: keep(ans.back) };
}
function tieUp(ctx, fx, X, Y, n) {
  const { T, W, m, card, pos, r } = ctx;
  if (X == null || Y == null || X === Y) return;
  const kind = fx.k === "grudge" || fx.k === "favour" ? "wildcard" : fx.k;
  const bond = fx.k === "grudge" ? "hostile" : fx.k === "favour" ? "bond" : null;
  const words = ownWords(ctx, n);
  const t = words ? { tie: { id: `${m.id}:${card.side}`, text: words.text, back: words.back, kind, bond }, at: {} } : dealTie(T, W, [kind], bond, X, Y, r(`tie:${n}`));
  if (!t) return;
  // A hostile thread across a bond strains it.
  if (kind === "rival" || bond === "hostile") {
    for (const old of W.made.ties) {
      const bonded = old.kind === "ally" || old.kind === "debt" || (old.kind === "wildcard" && old.tie?.bond === "bond");
      if (bonded && old.s !== "strained" && ((old.a === X && old.b === Y) || (old.a === Y && old.b === X))) old.s = "strained";
    }
  }
  W.made.ties.push({ a: X, b: Y, kind, tie: t.tie, at: t.at ?? {}, from: pos, age: m.age });
}
function doFx(ctx, fx, n) {
  const { T, W, D, m, ans, up, card, pos, r } = ctx;
  const on = (x) => (x === "a" ? up.a : x === "b" ? up.b : null);
  const X = on(fx.on);
  const rand = r(`fx:${n}`);
  const src = { kind: "moment", text: lineOf(T, W, card), name: leadsWithName(card.line) };
  const opts = { tags: ans.tags, src, rand, strange: m.strange };
  const made = () => ({ why: whyOf(T, W, card), by: "moment", made: pos });
  switch (fx.k) {
    case "gain": {
      // The seat's own, when the card's about one and named what it gives.
      let item = fx.what === "res" && up.res && up.res.on == null && !ctx.seatTaken ? up.res.item : null;
      if (item) ctx.seatTaken = true;
      else item = dealOne(T, W, X, fx.what, opts);
      if (!item) return;
      if (holdOf(T, W, X, fx.what, { ...item, made: pos, age: m.age })) form(D, X, "keep", pos);
      card.vals[fx.what] ??= { text: item.text };
      return;
    }
    case "take": {
      const Y = on(fx.from);
      const x = up[fx.what];
      let item = x && x.on === Y ? dropOf(T, W, Y, fx.what, x.item.id) : null;
      if (!item) {
        item = dealOne(T, W, Y, fx.what, opts);
        if (item) loseOf(T, W, Y, fx.what);
      }
      if (!item) return;
      if (holdOf(T, W, X, fx.what, { ...item, text: fill(item.text, { seat: seatName(W, seatOf(W, Y)) }), made: pos, age: m.age })) form(D, X, "keep", pos);
      card.vals[fx.what] ??= { text: item.text };
      return;
    }
    case "lose": {
      const x = up[fx.what];
      if (!(x && x.on === X && dropOf(T, W, X, fx.what, x.item.id))) loseOf(T, W, X, fx.what);
      return;
    }
    case "rival":
    case "ally":
    case "debt":
    case "grudge":
    case "favour": {
      const Y = on(fx.to);
      tieUp(ctx, fx, X, Y, n);
      if (fx.k === "rival") (form(D, X, "foe", pos), form(D, Y, "foe", pos));
      if (fx.k === "ally" || fx.k === "debt") (form(D, X, "friend", pos), form(D, Y, "friend", pos));
      return;
    }
    case "strain": {
      const Y = on(fx.to);
      const bond = W.made.ties.find((t) => t.s !== "strained" && (((t.kind === "ally" || t.kind === "debt") && ((t.a === X && t.b === Y) || (t.a === Y && t.b === X))) || (t.kind === "wildcard" && t.tie?.bond === "bond" && t.a === X && t.b === Y)));
      if (bond) bond.s = "strained";
      else tieUp(ctx, { ...fx, k: "grudge" }, X, Y, n);
      return;
    }
    case "block": {
      const Y = on(fx.to);
      if (Y == null || W.made.needs.some((x) => x.i === Y)) return;
      const asset = dealOne(T, W, Y, "asset", opts);
      if (!asset) return;
      const words = ownWords(ctx, n);
      const t = words ? { tie: { id: `${m.id}:${card.side}`, text: words.text, back: "", kind: "blocked", bond: null }, at: {} } : dealTie(T, W, ["blocked"], null, X, Y, r(`tie:${n}`));
      if (!t) return;
      W.made.needs.push({ i: Y, asset: { ...asset, made: pos }, by: X, tie: t.tie, at: t.at ?? {}, from: pos, age: m.age });
      W.factions[X].spare = true;
      refit(T, W.factions[X]);
      return;
    }
    case "agenda": {
      const at = {};
      if (fx.to === "seat") at.seat = up.s;
      else if (fx.to === "who") at.who = up.who;
      else {
        const Y = on(fx.to);
        at.rival = Y;
        // Its seat's Y's too, so an agenda can be to move in on it.
        at.seat = seatOf(W, Y);
        for (const what of ["res", "asset"]) {
          const x = up[what];
          if (x && x.on === Y && haveOf(W, Y, what).some((h) => h.id === x.item.id)) at[what] = { j: Y, id: x.item.id };
        }
      }
      // A later card's agenda takes the place of what it had, unless that's
      // the only one on the board after the crew, or the only strange thing.
      if (needed(W, X, "agenda")) return;
      const pick = dealOne(T, W, X, "agenda", { ...opts, at });
      if (!pick) return;
      W.factions[X].agenda = { ...pick, ...made() };
      W.locks[`f:${X}:agenda`] = true;
      form(D, X, "agenda", pos);
      return;
    }
    case "secret": {
      const Y = fx.to ? on(fx.to) : null;
      if (needed(W, X, "secret")) return;
      let pick = dealOne(T, W, X, "secret", { ...opts, at: Y != null ? { rival: Y } : null });
      if (!pick && Y != null) pick = dealOne(T, W, X, "secret", opts);
      if (!pick) return;
      W.factions[X].secret = { ...pick, ...made() };
      W.locks[`f:${X}:secret`] = true;
      form(D, X, "secret", pos);
      return;
    }
    case "lean": {
      W.factions[X].leans.push({ tags: [...fx.tags], text: src.text, name: src.name, age: m.age, made: pos });
      form(D, X, "like", pos);
      return;
    }
    case "mini": {
      if (W.minis.filter((x) => x.of === X).length >= 3) return;
      const res = dealOne(T, W, X, "res", opts);
      const asset = dealOne(T, W, X, "asset", opts) ?? dealOne(T, W, X, "people", opts);
      const name = miniNames(T, W, X, rand, 1)[0];
      if (!res || !asset || !name) return;
      const loy = T.core.loyal?.length ? T.core.loyal[Math.floor(rand() * T.core.loyal.length) % T.core.loyal.length] : null;
      W.minis.push({ of: X, name: name.pick, res, asset, outs: [...fx.outs], loy: loy ? { id: loy.id, text: loy.text } : null, made: pos, age: m.age });
      // It handed over a resource of its own to start it off.
      W.factions[X].lost.res += 1;
      card.vals.mini = W.minis.length - 1;
      return;
    }
    case "friend":
    case "foe": {
      const c = W.crew?.who?.find((x) => x.k === up.who);
      if (!c || X == null || c[fx.k === "friend" ? "foe" : "friend"]?.j === X) return;
      const words = ownWords(ctx, n);
      const pick = words ? { id: `${m.id}:${card.side}`, text: words.text, why: "", by: null } : options(T, W, `crew:${c.k}:${fx.k}`, 1, { only: X })[0] ?? null;
      if (!pick) return;
      c[fx.k] = { ...pick, j: X, made: pos };
      W.locks[`crew:${c.k}:${fx.k}`] = true;
      return;
    }
    case "face": {
      // The person the card names, or the one her prompt names when it's in.
      if (ans.prompt?.kind === "person") {
        card.face = X;
        return;
      }
      const p = up.words.person;
      if (!p || X == null) return;
      W.factions[X].voice = { name: p.text, nameId: p.nameId ?? null };
      form(D, X, "face", pos);
      return;
    }
  }
}

// ── Prompts.
// A name or a detail, asked after an answer: three suggestions dealt off the
// tables to fit, none of them filled in. A name for a faction is its name
// step's three, a mini faction's off the pack's faction names, a person off
// its people, a place off its seats the board hasn't got, and a detail off
// the moment's own ideas.
function miniNames(T, W, of, rand, n = 3) {
  const P = poolOf(T, W.recipe);
  const kind = W.factions[of]?.type?.role ?? null;
  const tags = new Set([...boardTags(W), ...factionTags(W, of)]);
  const taken = new Set([...W.factions.map((f) => f.name?.id), ...(W.minis ?? []).map((x) => x.name?.id)].filter(Boolean));
  const ok = (row) => row.needs.every((t) => tags.has(t)) && !row.out.some((t) => tags.has(t));
  const fits = P.names.filter((row) => ok(row) && !taken.has(row.id));
  const mine = fits.filter((row) => !row.role || row.role === kind);
  const list = mine.length >= n ? mine : fits.length >= n ? fits : P.names;
  const seat = seatName(W, seatOf(W, of));
  return drawOf(list.map((row) => ({ w: row.w, row })), rand, n).map(({ row }) => ({ text: fill(row.text, { seat }), pick: { id: row.id, text: row.text, role: row.role, strange: row.strange } }));
}
function placesOf(T, W, rand, n = 3) {
  const P = poolOf(T, W.recipe);
  const on = new Set(W.seats.filter(Boolean).map((s) => s.text));
  const left = P.seats.filter((s) => !on.has(s.text));
  return drawOf((left.length >= n ? left : P.seats).map((s) => ({ w: s.w, s })), rand, n).map(({ s }) => ({ text: fill(s.text, {}) }));
}
function openOf(T, W, p, card, pos) {
  const rand = rngOf(W.seed, "deck", "prompt", pos);
  let ideas = [];
  if (p.kind === "name") {
    if (p.of === "mini") ideas = card.vals.mini != null ? miniNames(T, W, W.minis[card.vals.mini].of, rand) : [];
    else {
      const i = p.of === "b" ? card.b : card.a;
      const seat = seatName(W, seatOf(W, i));
      ideas = options(T, W, `f:${i}:name`, 3).map((x) => ({ text: fill(x.text, { seat }), pick: x }));
    }
  } else if (p.kind === "person") ideas = peopleOf(T, W, rand, 3);
  else if (p.kind === "place") ideas = placesOf(T, W, rand);
  else if (p.kind === "detail") ideas = drawOf(p.ideas.map((text) => ({ w: 1, text })), rand, 3).map(({ text }) => ({ text }));
  return { pos, kind: p.kind, of: p.of ?? null, ask: p.ask, ideas };
}
export const prompted = (W) => (W.deck?.open ? copy(W.deck.open) : null);
// Her answer to it: a suggestion tapped ({ pick }), her own words ({ text }),
// or skipped. What she writes is hers, so nothing deals over it, and a name
// she picks is what the answer made, so it's locked. A skipped name's dealt
// at the end, and a skipped person, place or detail is the first suggestion,
// so whatever comes after it in its chain can say it.
export function fillPrompt(T, W, v = {}) {
  const D = W.deck;
  const o = D?.open;
  if (!o) return W;
  const own = typeof v.text === "string" ? v.text.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const tapped = !own && Number.isInteger(v.pick) ? o.ideas[v.pick] ?? null : null;
  const card = D.cards[o.pos];
  if (o.kind === "name") {
    if (o.of === "mini") {
      const x = W.minis[card.vals.mini];
      if (x && (own || tapped)) x.name = own ? { own: true, text: own } : copy(tapped.pick);
    } else {
      const i = o.of === "b" ? card.b : card.a;
      if (own || tapped) {
        W.factions[i].name = own ? { own: true, text: own } : copy(tapped.pick);
        W.locks[`f:${i}:name`] = true;
      }
    }
  } else {
    const got = own ? { text: own } : tapped ? copy(tapped) : o.ideas[0] ? { ...copy(o.ideas[0]), dealt: true } : null;
    if (got) {
      card.vals[o.kind] = got;
      for (const c of D.chains) if (c.from === o.pos) c.words[o.kind] = copy(got);
      if (o.kind === "person" && card.face != null) {
        W.factions[card.face].voice = { name: got.text, nameId: got.nameId ?? null };
        form(D, card.face, "face", o.pos);
      }
    }
  }
  card.prompt = { kind: o.kind, text: own || tapped?.text || null, own: Boolean(own), skip: !own && !tapped };
  D.log[D.log.length - 1].prompt = own ? { text: own } : tapped ? { pick: v.pick } : { skip: true };
  D.open = null;
  return W;
}

// ── Not this one, Undo and the end.
// Not this one: another card for the same need, and nothing else changes. A
// chain's card can't be passed over, since every chain lands.
export function notThis(T, W) {
  const D = W.deck;
  const up = cardUp(T, W);
  if (!up || up.chain != null) return W;
  D.nots.push(up.m);
  D.up = null;
  return W;
}
// The deck played again from the world before its first card, answer by
// answer: the same seed and answers deal the same deck and the same board.
// The last answer's prompt stays open when it hadn't been answered yet.
export function replay(T, base, log) {
  // A copy, so playing it again never touches the base it came from.
  const W = resume(T, copy(base));
  startDeck(T, W);
  const all = log ?? [];
  for (let n = 0; n < all.length; n++) {
    const e = all[n];
    for (let x = 0; x < (e.nots ?? 0); x++) notThis(T, W);
    if (!answer(T, W, e.side)) break;
    if (W.deck.open && (e.prompt || n < all.length - 1)) fillPrompt(T, W, e.prompt ?? { skip: true });
  }
  return W;
}
// Undo: the last answer taken back, with its prompt, and the card it
// answered up again, Not this ones and all.
export function undo(T, W) {
  const D = W.deck;
  if (!D?.base || !D.log.length) return W;
  const last = D.log[D.log.length - 1];
  const back = replay(T, D.base, D.log.slice(0, -1));
  for (let n = 0; n < (last.nots ?? 0); n++) notThis(T, back);
  return back;
}
export const doneOf = (W) => Boolean(W.deck?.done);
// The end: whatever's still open on every card is dealt to fit what the
// answers made. Names first, so every line and every because reads with the
// names they'll have, then the rest, the web round the threads that
// happened, the needs, the checks and the crew. What the answers made is
// locked, since it's what happened.
export function finish(T, W) {
  const D = W.deck;
  if (!D) return dealRest(T, W);
  if (D.open) fillPrompt(T, W, { skip: true });
  D.done = true;
  D.up = null;
  for (const i of fresh(W)) if (!W.factions[i].name) W.factions[i].name = options(T, W, `f:${i}:name`, 1)[0] ?? null;
  mend(T, W);
  freshen(T, W);
  dealRest(T, W);
  // A thread that named a resource a later card took off its faction names
  // one it's got now.
  for (const i of fresh(W)) mendAims(W, i);
  return W;
}
// What the board has to have that the answers didn't make, dealt around
// them the way the engine's checks would if the answers hadn't locked it:
// a faction after the crew (whichever the deck made a foe of one of them,
// then a friend, then anyone, or after something on the party sheet when
// there's nobody in the crew yet), a Secret naming another faction, and
// something strange.
function mend(T, W) {
  const rand = (k) => rngOf(W.seed, "deck", "mend", k);
  const crewAim = (ag) => ag?.aims?.some((a) => a === "who" || a === "thing");
  const who = W.crew?.who ?? [];
  const things = W.crew?.things ?? [];
  if (who.length && !W.factions.some((f) => crewAim(f.agenda))) {
    const sides = [...who.filter((c) => c.foe?.made != null).map((c) => [c.foe.j, c.k]), ...who.filter((c) => c.friend?.made != null).map((c) => [c.friend.j, c.k])];
    const [j, k] = sides.find(([x]) => !needed(W, x, "agenda")) ?? [fresh(W).find((x) => !needed(W, x, "agenda")), who[0].k];
    const pick = j != null ? dealOne(T, W, j, "agenda", { at: { who: k }, rand: rand("crew") }) : null;
    if (pick) W.factions[j].agenda = pick;
  } else if (things.length && !W.factions.some((f) => crewAim(f.agenda))) {
    // Nobody in the crew yet, but something on their party sheet's worth taking.
    const j = fresh(W).find((x) => !needed(W, x, "agenda"));
    const t = things[Math.floor(rand("thing")() * things.length) % things.length];
    const pick = j != null ? dealOne(T, W, j, "agenda", { at: { thing: { l: t.l, id: t.id } }, rand: rand("crew") }) : null;
    if (pick) W.factions[j].agenda = pick;
  }
  const others = (i) => fresh(W).filter((x) => x !== i);
  if (!W.factions.some((f) => f.secret?.at != null)) {
    const i = fresh(W).find((x) => !needed(W, x, "secret"));
    const pick = i != null ? dealOne(T, W, i, "secret", { at: { rival: others(i)[Math.floor(rand("who")() * others(i).length)] }, rand: rand("rival") }) : null;
    if (pick) W.factions[i].secret = pick;
  }
  if (!strangeOn(W)) {
    const i = fresh(W).find((x) => !needed(W, x, "secret"));
    const pick = i != null ? dealOne(T, W, i, "secret", { rand: rand("strange"), strange: true }) : null;
    if (pick?.strange) W.factions[i].secret = pick;
  }
}
// Every line that steers a step, and every because of a thing a card made,
// with the names as they are now.
function freshen(T, W) {
  const D = W.deck;
  const why = (x) => {
    const c = D.cards[x?.made];
    if (c && x.by === "moment") x.why = whyOf(T, W, c);
  };
  for (const f of W.factions) {
    for (const l of f.leans ?? []) {
      const c = D.cards[l.made];
      if (c) l.text = lineOf(T, W, c);
    }
    for (const x of [f.agenda, f.secret, ...(f.got?.res ?? []), ...(f.got?.assets ?? [])]) why(x);
  }
  for (const n of W.made?.needs ?? []) why(n.asset);
}
// The rest of the deck answered at random, and the end. Prompts are a
// suggestion or skipped, and nots is how often Not this one's tapped first.
export function playRest(T, W, rand = Math.random, { nots = 0, finishing = true } = {}) {
  for (let guard = 0; guard < 4 * MAX; guard++) {
    if (W.deck.open) {
      const n = W.deck.open.ideas.length;
      fillPrompt(T, W, n && rand() < 0.65 ? { pick: Math.floor(rand() * n) % n } : { skip: true });
      continue;
    }
    const up = cardUp(T, W);
    if (!up) break;
    if (nots && up.chain == null && rand() < nots) {
      notThis(T, W);
      continue;
    }
    answer(T, W, rand() < 0.5 ? 0 : 1);
  }
  return finishing ? finish(T, W) : W;
}

// ── What it all came to.
// How it came to be: a line of history for every answer, by age, then by
// when it was answered, with the names they've got now.
export function historyOf(T, W) {
  const D = W.deck;
  if (!D) return [];
  return D.cards
    .map((c, pos) => ({ pos, age: c.age, text: lineOf(T, W, c), a: c.a, b: c.b, m: c.m, side: c.side }))
    .sort((x, y) => x.age - y.age || x.pos - y.pos);
}
// What's formed of each faction, for its tile: what it's called now, and
// each part with when it formed, and what's still to form (the age that's
// on's, and any an age before it ran out of cards for).
export function formedOf(T, W) {
  const D = W.deck;
  if (!D) return null;
  const miss = missingOf(T, W, D.age);
  return {
    age: D.age,
    pos: D.pos,
    done: D.done,
    factions: fresh(W).map((i) => ({ i, name: calledOf(T, W, i), parts: { ...(D.parts[i] ?? {}) }, left: miss.f[i] ?? [] })),
    board: miss.board,
  };
}
