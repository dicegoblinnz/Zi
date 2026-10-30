// The founding (stages 9, 11, 13 and 15 of notes/builder-plan.md): the crew
// builds the world with her, live on everyone's phone, as session zero. It's
// kept on the campaign's live table (src/worker/table.js) beside the rounds
// and the faction turn, as doc.found, so every change reaches every phone in
// the campaign as it happens. The Table object applies each change with
// applyFound(), and the phone uses the same rules to show its own changes
// before they've gone up. foundView() is the only part a player gets.
//
// Stage 9 is the room and the asking. She sets it up and opens the room,
// the crew joins from the World tab, and the turns go round the asking:
// what holds it together, what's pulling it apart (the tension, a d12
// rolled as a turn of its own, Mo's pick), who runs it and what a stranger
// notices. Each answer's one of three cards dealt off the tables from the
// shared seed, on every phone alike, or the player's own words. Nothing
// touches the board.
//
// Stage 11 is the ground and the founding. Once the asking's done she rolls
// the ground's dice (a d6 for every seat, rolled on the server), and the
// turns go round again: each player takes a die, its face picks the seat's
// keep off the region's table, and they keep one of the three seats it deals
// (Mo's pick: as it comes, or in their own words). Then she starts the
// founding, the second age: she deals the old powers onto seats, one of three
// whole cards each, and the players found a faction each in reverse order, on
// a free seat, with its three questions (who had the seat before, who it owes
// and what it'll never do) and three cards each for what it is, how it works,
// its Want and its name. What a card's dealt with it (an old power's
// resources and people, and a founder's size at Local with its seat and its
// resources, people and d4 agenda with its Want) comes up with it, dealt on
// the phone that answered from the shared seed (found-world.js), and it's
// kept, so the board the crew saw stays what it was when the tables change
// between sessions. Nothing here is hidden, since the old powers' agendas, Faces and Secrets
// are her pass's, on her phone alone. At the end of any age she can carry it
// into Build the world on her phone, everything the crew made locked, which
// is how it ends till the strife's built.
//
//   found  { id, at, step, recipe, n, seed, clocks, clock, who, outs, turn,
//            asking, tension, last, out, pool, seats, olds, fac }
//     step     "room" (she's set it up and opened it, and the crew's joining),
//              "ask" (the asking, a turn at a time), "asked" (the asking's
//              done), "ground" (the seats, a die at a time), "grounded",
//              "found" (the old powers, then the founders), "founded", or
//              "carried" (she's taken it into Build the world)
//     recipe   { region, era, twist }, n how many factions (4 to 12), and
//              seed the shared seed, three of core.yaml's words, that every
//              phone deals the room's cards from
//     clocks   minutes for each age: the ground, the founding and the strife
//     clock    { age, left, run }: the age that's on, what's left of its
//              clock in ms, and when it was set running (0 while it's
//              stopped). The asking's part of the first age, so its clock
//              starts with the asking and runs on through the ground, and it
//              stops between ages till she starts the next.
//     who      everyone in, in the order turns go round: { key ("user|ch"),
//              user, ch, name, cname, joined }, joined being when they
//              joined the room on their phone (0 till then)
//     outs     who she's taken out, by key, who can't join themselves again
//     turn     { key, part, at, i }: whose turn it is and what for, or null.
//              A part's one of the asking's (PARTS), seat (a die for the
//              ground), old (hers, for old power i, key "") or a founder's
//              (FOUNDER, for faction i)
//     asking   { holds, runs, notices }, each a pick or null, and tension
//     a pick   { id, text, tags, dials, strange, own, roll, real, by,
//                byName, gm, deal, at }: a card off the tables (its row's
//                id and words, the tags and dials it sets, and for the
//                tension its d12, real when it was real dice tapped in) or
//                their own words (own), with whose turn it was, gm when she
//                put it in for them, and deal when it was dealt to finish
//     last     the last answer, { part, key, k, i }, so it can be taken back
//     out      the clock ran out and the turn that was on has finished (or
//              nobody in is left to take what's left), so the rest of the
//              age is dealt on her phone
//     pool     the ground's dice, each a face from 1 to 6, rolled on the
//              server ([] on a phone till its roll comes back)
//     seats    what each die made, by its place in the pool: { id, text,
//              notice, role, tags, strange } off the tables, or { own, text,
//              notice, role } in their own words, with by, byName, gm, deal
//              and at like an answer
//     olds     how many old powers there are, once the founding's started
//     fac      the founding's factions, old powers first, then the founders
//              in reverse order: an old power { old, card, by, gm, deal, at },
//              its card { seat, size, type, method, want, name, res, assets },
//              and a founder { key, name, cname, picks }, its picks by
//              FOUNDER part: f-seat { k, size } (Local, at its die), before
//              { j, id, text } (j null for nobody), owes { j, id, text },
//              never { id, text }, and type, method, want and name, a card
//              each, with their own words as { own, text }, the Want with
//              what's dealt with it, with: { res, assets, agenda }

import { rollDie } from "./dice.js";

export const PARTS = ["holds", "tension", "runs", "notices"];
export const QUESTIONS = ["holds", "runs", "notices"];
export const STEPS = ["room", "ask", "asked", "ground", "grounded", "found", "founded", "carried"];
// The steps a clock runs in, and the ones she can carry it into Build the
// world from: the end of each age.
export const RUNNING = ["ask", "ground", "found"];
export const ENDS = ["asked", "grounded", "founded"];
// A founder's turn, in the brief's order: a free seat, its three questions,
// then what it is, how it works, its Want and its name.
export const FOUNDER = ["f-seat", "before", "owes", "never", "type", "method", "want", "name"];
export const ASKS = ["before", "owes", "never"];
export const CARDS = ["type", "method", "want", "name"];
// The sizes an old power can be (the plan's call), and a founder's.
export const OLD_SIZES = ["city", "great"];
// The most seats a pool holds: twelve factions and two more.
export const MAX_SEATS = 14;
export const AGES = ["The ground", "The founding", "The strife"];
// Minutes on each age's clock to begin with (the plan's call).
export const CLOCKS = [30, 40, 40];
export const DIALS = ["tense", "strange", "rich", "ruled"];
export const REGIONS = ["town", "city", "country", "world", "stars"];
export const MAX = { who: 40, outs: 40, name: 60, text: 160, tags: 8, minutes: 180, add: 60 };
const ID = /^[A-Za-z0-9_-]{6,32}$/;
const ROW = /^[A-Za-z0-9:_.-]{1,160}$/;
const WORD = /^[a-z]{2,20}$/;
// An era or a twist, like medieval or near-future.
const KIND = /^[a-z][a-z-]{1,23}$/;
const SEED = /^[a-z]{2,20}-[a-z]{2,20}-[a-z]{2,20}$/;
// A keep, a type role, or a tag a row carries.
const TAG = /^[a-z][a-z-]{1,23}$/;
const SIZE_WORDS = ["small", "local", "city", "great"];
const MINUTE = 60000;

export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
export const keyOf = (user, ch) => `${user}|${ch}`;

const yes = () => ({ ok: true });
const no = (why) => ({ ok: false, why });
const gmOnly = () => no("Only the GM can do that.");
const none = () => no("There’s no founding on. It might have ended.");
const notIn = () => no("You need a character in this campaign to join it.");

// ------------------------------------------------------------ the clock

// What's left of the age's clock, in ms.
export function clockLeft(f, now) {
  const c = f?.clock;
  if (!c) return 0;
  return Math.max(0, c.run ? Math.min(c.left, c.left - (now - c.run)) : c.left);
}
// The age that's on has run out of time.
export const timeUp = (f, now) => RUNNING.includes(f?.step) && Boolean(f.clock) && clockLeft(f, now) <= 0;
function stop(f, now) {
  if (!f.clock?.run) return;
  f.clock.left = clockLeft(f, now);
  f.clock.run = 0;
}
function run(f, now) {
  if (f.clock && !f.clock.run && f.clock.left > 0) f.clock.run = now;
}

// ------------------------------------------------------------ where it's got to

export const pickOf = (f, part) => (part === "tension" ? f?.tension ?? null : f?.asking?.[part] ?? null);
const setPick = (f, part, p) => {
  if (part === "tension") f.tension = p;
  else f.asking[part] = p;
};
// What's still to answer, in the book's order.
export const leftOf = (f) => PARTS.filter((p) => !pickOf(f, p));
export const whoOf = (f, key) => f?.who?.find((w) => w.key === key) ?? null;
// Whoever's after them round the table (or the first in, when they're not).
function nextKey(f, from) {
  if (!f.who.length) return null;
  const i = f.who.findIndex((w) => w.key === from);
  return f.who[(i + 1) % f.who.length].key;
}
// The turn moves on: the next part in the book's order, to whoever's next.
// Out of time, the turn that was on is the last, and her phone deals the rest.
function advance(f, from, now) {
  const part = leftOf(f)[0];
  if (!part) {
    f.turn = null;
    f.out = false;
    f.step = "asked";
    stop(f, now);
    return;
  }
  if (timeUp(f, now)) {
    f.turn = null;
    f.out = true;
    return;
  }
  const key = nextKey(f, from);
  f.turn = key ? { key, part, at: now } : null;
}

// The ground's dice still in the pool, by their place in it.
export const diceLeft = (f) => (f?.pool ?? []).map((_, k) => k).filter((k) => !f.seats?.[k]);
// The ground: a die each, round the table, till the pool's empty.
function advanceGround(f, from, now) {
  if (!f.pool?.length) {
    f.turn = null;
    return;
  }
  if (!diceLeft(f).length) {
    f.turn = null;
    f.out = false;
    f.step = "grounded";
    stop(f, now);
    return;
  }
  if (timeUp(f, now)) {
    f.turn = null;
    f.out = true;
    return;
  }
  const key = nextKey(f, from);
  f.turn = key ? { key, part: "seat", at: now } : null;
}

// A faction in the founding, and what's still to answer on it.
export const facOf = (f, i) => f?.fac?.[i] ?? null;
export function missingOf(f, i) {
  const x = facOf(f, i);
  if (!x) return [];
  if (x.old) return x.card ? [] : ["old"];
  return FOUNDER.filter((p) => x.picks?.[p] == null);
}
export const doneAt = (f, i) => missingOf(f, i).length === 0;
// Where a faction sits: an old power's card's seat, or a founder's pick.
export const seatAt = (f, i) => {
  const x = facOf(f, i);
  const k = x?.old ? x.card?.seat : x?.picks?.["f-seat"]?.k;
  return Number.isInteger(k) ? k : null;
};
// A seat nobody in the founding holds, bar faction but.
export const seatFree = (f, k, but = -1) => Boolean(f?.seats?.[k]) && !(f.fac ?? []).some((_, i) => i !== but && seatAt(f, i) === k);
// A faction that's on the board, so a founder's question can name it.
export const onBoard = (f, j, but = -1) => Number.isInteger(j) && j !== but && seatAt(f, j) != null;
// The founding: her old powers first, a card each, then the founders in
// reverse order, a whole faction a turn, each part in the brief's order. A
// founder who isn't in waits, and once nobody in's left to take what's left,
// or the clock's run out, her phone deals the rest. The turn that's on always
// finishes: a founder's whole faction, or her one old power.
function advanceFound(f, now, { finish = true } = {}) {
  const t = f.turn;
  if (finish && t) {
    if (t.part !== "old" && Number.isInteger(t.i)) {
      const next = missingOf(f, t.i)[0];
      if (next) {
        f.turn = { key: t.key, part: next, i: t.i, at: now };
        return;
      }
    }
  }
  const left = (f.fac ?? []).map((_, i) => i).filter((i) => !doneAt(f, i));
  if (!left.length) {
    f.turn = null;
    f.out = false;
    f.step = "founded";
    stop(f, now);
    return;
  }
  if (timeUp(f, now)) {
    f.turn = null;
    f.out = true;
    return;
  }
  const i = left.find((j) => facOf(f, j).old || whoOf(f, facOf(f, j).key));
  if (i == null) {
    f.turn = null;
    f.out = true;
    return;
  }
  const x = facOf(f, i);
  f.out = false;
  f.turn = x.old ? { key: "", part: "old", i, at: now } : { key: x.key, part: missingOf(f, i)[0], i, at: now };
}
// The turn moves on, the way the age that's on moves it.
function moveOn(f, from, now) {
  if (f.step === "ask") advance(f, from, now);
  else if (f.step === "ground") advanceGround(f, from, now);
  else if (f.step === "found") advanceFound(f, now, { finish: false });
}
// Someone's out: their turn goes on to whoever's after them, and in the
// founding, to the next faction someone in can take.
function turnGone(f, i, gone, now) {
  if (f.turn?.key !== gone) return;
  if (f.step === "found") {
    f.turn = null;
    advanceFound(f, now, { finish: false });
    return;
  }
  f.turn = f.who.length ? { key: f.who[i % f.who.length].key, part: f.turn.part, at: now } : null;
}

// The dials the asking's set, the way the engine counts them: each starts
// in the middle, and every answer off the tables nudges it.
export function dialsOf(f) {
  const d = { tense: 1, strange: 1, rich: 1, ruled: 1 };
  for (const part of PARTS) for (const [k, v] of Object.entries(pickOf(f, part)?.dials ?? {})) if (k in d) d[k] += Number(v) || 0;
  return Object.fromEntries(DIALS.map((k) => [k, Math.max(0, Math.min(2, Math.round(d[k])))]));
}

// How many seats the ground has: the factions and two more, with room for
// everyone in to found one beside an old power.
export const poolSize = (f) => Math.min(MAX_SEATS, Math.max(f.n, f.who.length + 1) + 2);
// The founding's factions: every founder in, beside the old powers she set
// up for (her factions less the players, and always at least one, room
// allowing), twelve at most and never more than the seats.
// There's always an old power, since a founder's first question needs a
// faction on the board to owe, so eleven found one at most.
export function shapeOf(f) {
  const seats = f.pool?.length ?? 0;
  const founders = Math.max(0, Math.min(f.who.length, 11, seats - 1));
  const factions = Math.min(12, Math.max(f.n, founders + 1));
  const olds = Math.max(1, Math.min(factions - founders, seats - founders));
  return { olds, founders };
}

// ------------------------------------------------------------ tidying what comes in

function recipeFrom(x) {
  if (!x || typeof x !== "object" || !REGIONS.includes(x.region) || !KIND.test(String(x.era ?? ""))) return null;
  const twist = x.twist == null || x.twist === "" ? null : KIND.test(String(x.twist)) ? String(x.twist) : undefined;
  return twist === undefined ? null : { region: x.region, era: String(x.era), twist };
}
const clocksFrom = (x) => (Array.isArray(x) && x.length === 3 && x.every((m) => whole(m, 1, MAX.minutes) != null) ? x.map(Number) : null);
function entryOf(m, now = 0) {
  return { key: keyOf(m.user, m.ch), user: String(m.user), ch: String(m.ch), name: line(m.name, MAX.name), cname: line(m.cname, MAX.name), joined: now };
}
// An answer from a phone: a card off the tables, or someone's own words.
// The tension's a card, rolled on a d12.
export function pickFrom(x, part) {
  if (!x || typeof x !== "object") return null;
  const text = line(x.text, MAX.text);
  if (!text) return null;
  if (x.own === true) return part === "tension" ? null : { own: true, text };
  const id = String(x.id ?? "");
  if (!ROW.test(id)) return null;
  const tags = Array.isArray(x.tags) ? x.tags.filter((t) => WORD.test(String(t))).slice(0, MAX.tags).map(String) : [];
  const dials = {};
  for (const [k, v] of Object.entries(x.dials && typeof x.dials === "object" ? x.dials : {})) {
    const n = whole(v, -2, 2);
    if (DIALS.includes(k) && n) dials[k] = n;
  }
  const p = { id, text, tags, dials, strange: x.strange === true };
  if (part === "tension") {
    const roll = whole(x.roll, 1, 12);
    if (roll == null) return null;
    p.roll = roll;
    p.real = x.real === true;
  }
  return p;
}
// Someone's own words in a founding's line, with nothing in it the tables
// would read as a slot.
const ownLine = (v, max = MAX.text) => line(String(v ?? "").replace(/[{}]/g, ""), max);
const tagsFrom = (v) => (Array.isArray(v) ? v.map(String).filter((t) => TAG.test(t)).slice(0, MAX.tags) : []);
// A card off the tables as the room keeps it: its row and words, and what it
// is and what it's about, so every phone deals what's after it the same. Or
// someone's own words. name: it's a name, so it's short.
export function rowFrom(x, { name = false, own = true } = {}) {
  if (!x || typeof x !== "object") return null;
  const max = name ? MAX.name : MAX.text;
  if (x.own === true) {
    const text = ownLine(x.text, max);
    return own && text ? { own: true, text } : null;
  }
  const text = line(x.text, max);
  const id = String(x.id ?? "");
  if (!text || !ROW.test(id)) return null;
  const p = { id, text, tags: tagsFrom(x.tags), leans: tagsFrom(x.leans), strange: x.strange === true };
  if (x.role != null) {
    if (!TAG.test(String(x.role))) return null;
    p.role = String(x.role);
  }
  const why = line(x.why, MAX.text);
  if (why) p.why = why;
  // The bond threads a card offers, kept so the board gets them at the end.
  const offers = Array.isArray(x.offers)
    ? x.offers
        .filter((o) => o && ["pub", "mor", "loy"].includes(o.bond) && ["bond", "hostile"].includes(o.kind) && line(o.text, MAX.text))
        .slice(0, 2)
        .map((o) => ({ bond: o.bond, kind: o.kind, text: line(o.text, MAX.text) }))
    : [];
  if (offers.length) p.offers = offers;
  return p;
}
// A seat a die made: one off the tables, its name and what a stranger
// notices there, or both in their own words.
export function seatFrom(x) {
  if (!x || typeof x !== "object") return null;
  const role = String(x.role ?? "");
  if (!TAG.test(role)) return null;
  if (x.own === true) {
    const text = ownLine(x.text, MAX.name);
    const notice = ownLine(x.notice);
    return text && notice ? { own: true, text, notice, role } : null;
  }
  const p = rowFrom(x, { name: true, own: false });
  const notice = line(x.notice, MAX.text);
  if (!p || !notice) return null;
  return { id: p.id, text: p.text, notice, role, tags: p.tags, strange: p.strange };
}
// A size, and the die it's at.
function sizeFrom(x, sizes = SIZE_WORDS) {
  if (!x || typeof x !== "object" || !sizes.includes(x.size)) return null;
  const die = whole(x.die, 2, 12);
  return die && die % 2 === 0 ? { size: x.size, die } : null;
}
// A set dealt with a card: its resources, or its assets (each with what it
// does, and whether it's people who turn up), off the tables.
const MAX_SET = 9;
function setFrom(v, { assets = false } = {}) {
  if (!Array.isArray(v) || !v.length || v.length > MAX_SET) return null;
  const out = [];
  for (const x of v) {
    const p = rowFrom(x, { own: false });
    if (!p) return null;
    if (assets) {
      p.power = x.power === true;
      const does = line(x.does, MAX.text);
      if (does) p.does = does;
    }
    out.push(p);
  }
  return out;
}
const AIMS = ["seat", "rival", "res", "asset", "who", "thing"];
// A founder's agenda, dealt with its Want: off the tables, at d4, and what
// it's aimed at on the board.
function agendaFrom(x) {
  const p = rowFrom(x, { own: false });
  if (!p || whole(x?.die, 2, 12) !== 4) return null;
  const at = x.at && typeof x.at === "object" ? x.at : {};
  const out = { ...p, die: 4, aims: Array.isArray(x.aims) ? x.aims.map(String).filter((a) => AIMS.includes(a)).slice(0, 4) : [], at: {} };
  if (Number.isInteger(at.seat) && at.seat >= 0 && at.seat < MAX_SEATS) out.at.seat = at.seat;
  if (Number.isInteger(at.rival) && at.rival >= 0 && at.rival < 12) out.at.rival = at.rival;
  for (const k of ["res", "asset"]) if (at[k] && Number.isInteger(at[k].j) && at[k].j >= 0 && at[k].j < 12 && ROW.test(String(at[k].id ?? ""))) out.at[k] = { j: at[k].j, id: String(at[k].id) };
  return out;
}
// What's dealt with a founder's Want: its resources, its people and assets,
// and its agenda.
function withFrom(x) {
  if (!x || typeof x !== "object") return null;
  const res = setFrom(x.res);
  const assets = setFrom(x.assets, { assets: true });
  const agenda = agendaFrom(x.agenda);
  return res && assets && agenda ? { res, assets, agenda } : null;
}
// An old power's card: on a free seat, City or Great, what it is, how it
// works, its Want and its name, every one off the tables, with the
// resources, people and assets dealt with it.
function oldFrom(x, f, i) {
  if (!x || typeof x !== "object") return null;
  const seat = whole(x.seat, 0, (f.pool?.length ?? 1) - 1);
  if (seat == null || !seatFree(f, seat, i)) return null;
  const size = sizeFrom(x.size, OLD_SIZES);
  const card = { seat, size };
  for (const k of CARDS) card[k] = rowFrom(x[k], { name: k === "name", own: false });
  card.res = setFrom(x.res);
  card.assets = setFrom(x.assets, { assets: true });
  return size && CARDS.every((k) => card[k]) && card.res && card.assets ? card : null;
}
// One of a founder's answers, for its part, checked against the founding.
function founderFrom(x, part, f, i) {
  if (!x || typeof x !== "object") return null;
  if (part === "f-seat") {
    // Its seat, and its size dealt with it: Local, at its die.
    const k = whole(x.k, 0, (f.pool?.length ?? 1) - 1);
    const size = sizeFrom(x.size, ["local"]);
    return k != null && seatFree(f, k, i) && size ? { k, size } : null;
  }
  if (ASKS.includes(part)) {
    const j = x.j == null ? null : whole(x.j, 0, f.fac.length - 1);
    if (part === "before" && j == null) return x.j == null ? { j: null } : null;
    if (part !== "never" && (j == null || !onBoard(f, j, i))) return null;
    const p = rowFrom(x, { own: true });
    if (!p) return null;
    const out = p.own ? { own: true, text: p.text } : { id: p.id, text: p.text, tags: p.tags };
    return part === "never" ? out : { j, ...out };
  }
  if (!CARDS.includes(part)) return null;
  const p = rowFrom(x, { name: part === "name" });
  if (!p || part !== "want") return p;
  // A Want comes up with what's dealt with it.
  const got = withFrom(x.with);
  return got ? { ...p, with: got } : null;
}

// ------------------------------------------------------------ the changes

// One change to the founding, from the GM or a player (who: { user, role,
// ch, cname }, roster: everyone playing someone in the campaign, { user,
// name, ch, cname }). It changes doc, and says why when it can't. server:
// it's the Table object applying it, so the ground's dice are rolled here
// and nowhere else.
export function applyFound(doc, op, who, roster, now, { server = false } = {}) {
  const gm = who?.role === "gm";
  // A player's phone may not have the whole roster, so who's sending stands in
  // for it there. On the server, who only has a character when D1 says so.
  const me = gm ? null : (roster ?? []).find((m) => m.user === who?.user && m.ch && m.ch === who?.ch) ?? (who?.ch ? { user: who.user, ch: who.ch, cname: who.cname ?? "", name: "" } : null);
  const myKey = me ? keyOf(me.user, me.ch) : null;
  const playing = (key) => (roster ?? []).find((m) => m.ch && keyOf(m.user, m.ch) === key) ?? null;
  const f = doc.found ?? null;
  switch (op?.o) {
    case "fd-open": {
      if (!gm) return gmOnly();
      if (f) return f.id === op.id ? yes() : no("There’s a founding on already. End it first.");
      const recipe = recipeFrom(op.recipe);
      // How many factions: op.n is the phone's own number for the change.
      const n = whole(op.factions, 4, 12);
      const clocks = clocksFrom(op.clocks);
      if (!ID.test(String(op.id ?? "")) || !recipe || n == null || !clocks || !SEED.test(String(op.seed ?? ""))) return no("That founding didn’t make sense.");
      // Everyone playing in the campaign's in, unless she's said otherwise.
      const keys = Array.isArray(op.who) ? op.who.map(String) : (roster ?? []).filter((m) => m.ch).map((m) => keyOf(m.user, m.ch));
      const who = [];
      for (const key of keys) {
        const m = playing(key);
        if (m && !who.some((w) => w.key === key) && who.length < MAX.who) who.push(entryOf(m));
      }
      doc.found = { id: String(op.id), at: now, step: "room", recipe, n, seed: String(op.seed), clocks, clock: null, who, outs: [], turn: null, asking: { holds: null, runs: null, notices: null }, tension: null, last: null, out: false, pool: null, seats: null, olds: 0, fac: [] };
      return yes();
    }
    case "fd-set": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step !== "room") return no("It’s started, so the setup stays as it is.");
      const recipe = op.recipe == null ? f.recipe : recipeFrom(op.recipe);
      const n = op.factions == null ? f.n : whole(op.factions, 4, 12);
      const clocks = op.clocks == null ? f.clocks : clocksFrom(op.clocks);
      if (!recipe || n == null || !clocks) return no("That setup didn’t make sense.");
      Object.assign(f, { recipe, n, clocks });
      return yes();
    }
    case "fd-in": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "carried") return no("It’s on your phone now, so who’s in stays as it is.");
      const key = String(op.key ?? "");
      const i = f.who.findIndex((w) => w.key === key);
      if (op.on === true) {
        f.outs = f.outs.filter((k) => k !== key);
        if (i >= 0) return yes();
        const m = playing(key);
        if (!m) return no("They’re not playing in the campaign now.");
        if (f.who.length >= MAX.who) return no("That’s as many as a founding holds.");
        f.who.push(entryOf(m));
        // Back in the founding, a faction they'd started is theirs again, and
        // someone new gets one of their own while there's a seat for it.
        const fac = f.fac ?? [];
        if (f.step === "found" && !fac.some((x) => x.key === key) && fac.length < 12 && (f.seats ?? []).filter(Boolean).length > fac.length) fac.push({ key, name: line(m.name, MAX.name), cname: line(m.cname, MAX.name), picks: {} });
        if (RUNNING.includes(f.step) && !f.turn && !f.out) moveOn(f, key, now);
        return yes();
      }
      if (i < 0) return yes();
      const [gone] = f.who.splice(i, 1);
      if (!f.outs.includes(key)) f.outs = [...f.outs, key].slice(-MAX.outs);
      // Their last answer stands, but they can't take it back to get a turn.
      if (f.last?.key === key) f.last = null;
      // Their turn goes to whoever was after them.
      turnGone(f, i, gone.key, now);
      return yes();
    }
    case "fd-move": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step !== "room") return no("It’s started, so the turns go round as they are.");
      const i = f.who.findIndex((w) => w.key === op.key);
      if (i > 0) [f.who[i - 1], f.who[i]] = [f.who[i], f.who[i - 1]];
      return yes();
    }
    case "fd-join": {
      if (gm) return no("You run it, so you’re in already.");
      if (!f) return none();
      if (!me) return notIn();
      const w = whoOf(f, myKey);
      if (w) {
        if (!w.joined) w.joined = now;
        return yes();
      }
      if (f.outs.includes(myKey)) return no("Your GM’s left you out of this one.");
      if (f.step !== "room") return no("It’s started. Ask your GM to put you in.");
      if (f.who.length >= MAX.who) return no("That’s as many as a founding holds.");
      f.who.push(entryOf(playing(myKey) ?? me, now));
      return yes();
    }
    case "fd-start": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step !== "room") return yes();
      if (!f.who.length) return no("Put someone in first.");
      f.step = "ask";
      f.clock = { age: 1, left: f.clocks[0] * MINUTE, run: now };
      f.turn = { key: f.who[0].key, part: PARTS[0], at: now };
      return yes();
    }
    case "fd-ground": {
      // The ground's dice: a d6 for every seat, rolled on the server.
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "ground" || f.step === "grounded") return yes();
      if (f.step !== "asked") return no(f.step === "room" || f.step === "ask" ? "Finish the asking first." : "The ground’s been and gone.");
      if (!f.who.length) return no("Put someone in first.");
      const size = poolSize(f);
      f.pool = server ? Array.from({ length: size }, () => rollDie(6)) : [];
      f.seats = Array.from({ length: size }, () => null);
      f.step = "ground";
      f.last = null;
      f.out = false;
      run(f, now);
      // The turns go on round the table from whoever gave the asking's last answer.
      if (timeUp(f, now)) f.out = true;
      else f.turn = { key: nextKey(f, pickOf(f, "notices")?.by || null), part: "seat", at: now };
      return yes();
    }
    case "fd-age": {
      // The founding, the second age: her old powers, then the founders in
      // reverse order of the turns, with its own clock.
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "found" || f.step === "founded") return yes();
      if (f.step !== "grounded") return no("Finish the ground first.");
      if (!f.who.length) return no("Put someone in first.");
      const { olds, founders } = shapeOf(f);
      f.olds = olds;
      f.fac = [...Array.from({ length: olds }, () => ({ old: true, card: null })), ...[...f.who].reverse().slice(0, founders).map((w) => ({ key: w.key, name: w.name, cname: w.cname, picks: {} }))];
      f.step = "found";
      f.clock = { age: 2, left: f.clocks[1] * MINUTE, run: now };
      f.last = null;
      f.out = false;
      f.turn = null;
      advanceFound(f, now, { finish: false });
      return yes();
    }
    case "fd-answer": {
      if (!f) return none();
      if (f.step === "ground") return answerSeat();
      if (f.step === "found") return answerFound();
      if (f.step !== "ask") return no(f.step === "room" ? "It hasn’t started yet." : f.step === "carried" ? "It’s on your GM’s phone now." : "That age is done.");
      const part = String(op.part ?? "");
      if (!PARTS.includes(part)) return no("That answer didn’t make sense.");
      const had = pickOf(f, part);
      if (had) return no(had.gm && had.by === myKey ? "Your GM put an answer in for you already." : "That one’s been answered already.");
      if (!f.turn || f.turn.part !== part) return no("That isn’t up yet.");
      const mine = myKey === f.turn.key;
      if (!gm && !mine) return no("It’s not your turn.");
      const p = pickFrom(op.pick, part);
      if (!p) return no(part === "tension" ? "Roll the d12 for the tension." : "That answer didn’t make sense.");
      setPick(f, part, { ...p, by: f.turn.key, byName: whoOf(f, f.turn.key)?.name ?? "", gm: gm && !mine, at: now });
      f.last = { part, key: f.turn.key };
      advance(f, f.turn.key, now);
      return yes();
    }
    case "fd-back": {
      if (!f) return none();
      if (f.step === "room") return no("It hasn’t started yet.");
      if (f.step === "carried") return no(gm ? "It’s on your phone now, so what’s in stays as it is." : "It’s on your GM’s phone now, so what’s in stays as it is.");
      const l = f.last;
      const lastOnly = () => no("Only the last answer can be taken back, and only till someone answers after it.");
      // It has to be the last answer: its part, and its die or its faction.
      if (!l || l.part !== op.part || (op.die != null && Number(op.die) !== l.k) || (op.i != null && Number(op.i) !== l.i)) return lastOnly();
      if (!gm && (myKey !== l.key || !whoOf(f, l.key))) return l.key === myKey ? lastOnly() : no("That’s not yours to take back.");
      if (PARTS.includes(l.part)) {
        if (!["ask", "asked"].includes(f.step) || !pickOf(f, l.part) || !whoOf(f, l.key)) return lastOnly();
        setPick(f, l.part, null);
        f.turn = { key: l.key, part: l.part, at: now };
        f.last = null;
        f.out = false;
        if (f.step === "asked") {
          f.step = "ask";
          run(f, now);
        }
        return yes();
      }
      if (l.part === "seat") {
        if (!["ground", "grounded"].includes(f.step) || !f.seats?.[l.k] || !whoOf(f, l.key) || (op.die != null && Number(op.die) !== l.k)) return lastOnly();
        f.seats[l.k] = null;
        f.turn = { key: l.key, part: "seat", at: now };
        f.last = null;
        f.out = false;
        if (f.step === "grounded") {
          f.step = "ground";
          run(f, now);
        }
        return yes();
      }
      // The founding: her last old power, or a founder's last answer, and on
      // back through that founder's own answers, one at a time.
      if (!["found", "founded"].includes(f.step) || (op.i != null && Number(op.i) !== l.i)) return lastOnly();
      const x = facOf(f, l.i);
      if (!x) return lastOnly();
      if (l.part === "old") {
        if (!gm || !x.old || !x.card) return lastOnly();
        x.card = null;
        f.turn = { key: "", part: "old", i: l.i, at: now };
        f.last = null;
      } else {
        if (x.old || x.picks?.[l.part] == null || (!gm && !whoOf(f, l.key))) return lastOnly();
        delete x.picks[l.part];
        f.turn = { key: x.key, part: l.part, i: l.i, at: now };
        const before = FOUNDER[FOUNDER.indexOf(l.part) - 1];
        const prev = before ? x.picks[before] : null;
        // The one before it's next to go back, while it's this founder's own.
        f.last = prev && (prev.by === l.key || gm) ? { part: before, key: l.key, i: l.i } : null;
      }
      f.out = false;
      if (f.step === "founded") {
        f.step = "found";
        run(f, now);
      }
      return yes();
    }
    case "fd-rest": {
      // Out of time (or Deal the rest): her phone's dealt whatever's left of
      // the age that's on, the way the engine deals it.
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "ground") return restSeats();
      if (f.step === "found") return restFound();
      if (f.step !== "ask") return f.step === "room" ? no("It hasn’t started yet.") : yes();
      const dealt = {};
      for (const part of leftOf(f)) {
        const p = pickFrom(op.picks?.[part], part);
        if (!p || p.own) return no("Deal all of what’s left.");
        dealt[part] = p;
      }
      for (const [part, p] of Object.entries(dealt)) setPick(f, part, { ...p, by: "", byName: "", gm: false, deal: true, at: now });
      f.last = null;
      advance(f, null, now);
      return yes();
    }
    case "fd-clock": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (!RUNNING.includes(f.step) || !f.clock) return no("The clock only runs while an age is on.");
      if (op.do === "stop") stop(f, now);
      else if (op.do === "run") run(f, now);
      else if (op.do === "add") {
        const m = whole(op.m, -MAX.add, MAX.add);
        if (!m) return no("That didn’t make sense.");
        const left = Math.max(0, Math.min(MAX.minutes * MINUTE, clockLeft(f, now) + m * MINUTE));
        f.clock.left = left;
        if (f.clock.run) f.clock.run = now;
        // More time, after it ran out: the turns go round again.
        if (f.out && left > 0) {
          f.out = false;
          if (!f.clock.run) f.clock.run = now;
          if (f.step === "found") advanceFound(f, now, { finish: false });
          else moveOn(f, f.last?.key ?? null, now);
        }
      } else return no("That didn’t make sense.");
      return yes();
    }
    case "fd-carry": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "carried") return yes();
      if (!ENDS.includes(f.step)) return no("Finish the age that’s on first.");
      f.step = "carried";
      f.turn = null;
      return yes();
    }
    case "fd-end": {
      if (!gm) return gmOnly();
      if (f && op.id != null && f.id !== op.id) return yes();
      doc.found = null;
      return yes();
    }
  }
  return no("That didn’t make sense.");

  // A die taken for a seat: the turn's player's, or hers for them.
  function answerSeat() {
    if (!f.turn || f.turn.part !== "seat" || op.part !== "seat") return no("That isn’t up yet.");
    const mine = myKey === f.turn.key;
    if (!gm && !mine) return no("It’s not your turn.");
    if (!f.pool?.length) return no("The dice are still rolling.");
    const k = whole(op.die, 0, f.pool.length - 1);
    if (k == null) return no("That die didn’t make sense.");
    if (f.seats[k]) return no("Someone’s taken that die.");
    const p = seatFrom(op.pick);
    if (!p) return no("That seat didn’t make sense.");
    if (!p.own && f.seats.some((s) => s && !s.own && s.id === p.id)) return no("That seat’s in the ground already.");
    f.seats[k] = { ...p, by: f.turn.key, byName: whoOf(f, f.turn.key)?.name ?? "", gm: gm && !mine, at: now };
    f.last = { part: "seat", key: f.turn.key, k };
    advanceGround(f, f.turn.key, now);
    return yes();
  }
  // An old power's card (hers), or one of a founder's answers.
  function answerFound() {
    const part = String(op.part ?? "");
    const t = f.turn;
    const i = whole(op.i, 0, (f.fac?.length ?? 1) - 1);
    if (!t || t.part !== part || i == null || t.i !== i) return no("That isn’t up yet.");
    const x = facOf(f, i);
    if (part === "old") {
      if (!gm) return no("That’s your GM’s to deal.");
      const card = oldFrom(op.pick, f, i);
      if (!card) return no("That card didn’t make sense.");
      x.card = card;
      f.last = { part, key: "", i };
      advanceFound(f, now);
      return yes();
    }
    if (!FOUNDER.includes(part) || x?.old) return no("That answer didn’t make sense.");
    const mine = myKey === t.key;
    if (!gm && !mine) return no("It’s not your turn.");
    const p = founderFrom(op.pick, part, f, i);
    if (!p) return no(part === "f-seat" ? "That seat’s taken, or it isn’t one." : "That answer didn’t make sense.");
    x.picks[part] = { ...p, by: t.key, byName: whoOf(f, t.key)?.name ?? x.name ?? "", gm: gm && !mine, at: now };
    f.last = { part, key: t.key, i };
    advanceFound(f, now);
    return yes();
  }
  // The rest of the ground, a seat for every die that's left.
  function restSeats() {
    const left = diceLeft(f);
    if (!left.length) return yes();
    const got = {};
    const ids = new Set(f.seats.filter((s) => s && !s.own).map((s) => s.id));
    for (const k of left) {
      const p = seatFrom(op.seats?.[k]);
      if (!p || p.own || ids.has(p.id)) return no("Deal all of what’s left.");
      ids.add(p.id);
      got[k] = p;
    }
    for (const [k, p] of Object.entries(got)) f.seats[k] = { ...p, by: "", byName: "", gm: false, deal: true, at: now };
    f.last = null;
    f.turn = null;
    advanceGround(f, null, now);
    return yes();
  }
  // The rest of the founding: every old power and every founder's faction
  // that's still to finish, in order, as her phone dealt them.
  function restFound() {
    const left = (f.fac ?? []).map((_, i) => i).filter((i) => !doneAt(f, i));
    if (!left.length) return yes();
    // Checked a faction at a time, on the founding as it'll be, since a
    // later one sits on a seat or names a faction an earlier one made.
    const trial = clone(f);
    for (const i of left) {
      const x = facOf(trial, i);
      const got = op.fac?.[i];
      if (x.old) {
        const card = oldFrom(got?.card, trial, i);
        if (!card) return no("Deal all of what’s left.");
        Object.assign(x, { card, by: "", gm: false, deal: true, at: now });
        continue;
      }
      for (const part of missingOf(trial, i)) {
        const p = founderFrom(got?.picks?.[part], part, trial, i);
        if (!p || p.own) return no("Deal all of what’s left.");
        x.picks[part] = { ...p, by: "", byName: "", gm: false, deal: true, at: now };
      }
    }
    f.fac = trial.fac;
    f.last = null;
    f.turn = null;
    advanceFound(f, now, { finish: false });
    return yes();
  }
}

export const isFoundOp = (op) => typeof op?.o === "string" && op.o.startsWith("fd-");

// Someone's deleted their account: they're out of the founding, their turn
// goes on round the table, and their answers stay without their name. A
// faction they were founding stays, without them, for her phone to finish.
export function forgetFound(doc, user) {
  const f = doc.found;
  if (!f) return false;
  let changed = false;
  const now = Date.now();
  const theirs = (key) => String(key ?? "").startsWith(`${user}|`);
  const gone = "Someone who’s left";
  const i = f.who.findIndex((w) => theirs(w.key));
  if (i >= 0) {
    const key = f.who[i].key;
    f.who = f.who.filter((w) => !theirs(w.key));
    turnGone(f, i, key, now);
    changed = true;
  }
  if (f.outs.some(theirs)) {
    f.outs = f.outs.filter((k) => !theirs(k));
    changed = true;
  }
  const unname = (p) => {
    if (p && theirs(p.by)) {
      Object.assign(p, { by: "", byName: gone });
      changed = true;
    }
  };
  for (const part of PARTS) {
    const p = pickOf(f, part);
    if (p && theirs(p.by)) {
      setPick(f, part, { ...p, by: "", byName: gone });
      changed = true;
    }
  }
  for (const s of f.seats ?? []) unname(s);
  for (const x of f.fac ?? []) {
    for (const p of Object.values(x.picks ?? {})) unname(p);
    if (!x.old && theirs(x.key)) {
      // The turn on it moves on first, since it was theirs.
      if (f.turn && f.turn.i != null && facOf(f, f.turn.i) === x) {
        f.turn = null;
        advanceFound(f, now, { finish: false });
      }
      Object.assign(x, { key: "", name: gone, cname: "" });
      changed = true;
    }
  }
  if (f.turn && theirs(f.turn.key)) {
    f.turn = null;
    if (f.step === "found") advanceFound(f, now, { finish: false });
    changed = true;
  }
  if (theirs(f.last?.key)) {
    f.last = null;
    changed = true;
  }
  return changed;
}

// Someone's left the campaign, or been taken out of it: they're out of the
// founding too, and their turn goes on round the table. What they answered
// stands, by their name, and a faction they were founding waits for her
// phone to finish it.
export function leftFound(doc, user) {
  const f = doc.found;
  if (!f) return false;
  const theirs = (key) => String(key ?? "").startsWith(`${user}|`);
  const i = f.who.findIndex((w) => theirs(w.key));
  if (i < 0) return false;
  const key = f.who[i].key;
  f.who = f.who.filter((w) => !theirs(w.key));
  turnGone(f, i, key, Date.now());
  if (theirs(f.last?.key)) f.last = null;
  return true;
}

// ------------------------------------------------------------ what each phone gets

// What a player gets of the room's picks, a field at a time.
const KEEP = ["id", "text", "notice", "role", "tags", "leans", "strange", "own", "why", "offers", "dials", "roll", "real", "k", "j", "size", "with", "die", "aims", "power", "does", "by", "byName", "gm", "deal", "at"];
const kept = (p) => (p && typeof p === "object" ? clone(Object.fromEntries(KEEP.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]))) : null);
const cardOf = (c) => (c ? { seat: c.seat, size: c.size ? { size: c.size.size, die: c.size.die } : null, ...Object.fromEntries(CARDS.map((k) => [k, kept(c[k])])), res: (c.res ?? []).map(kept), assets: (c.assets ?? []).map(kept) } : null);

// The GM gets the lot. A player gets the room as it's played in the open,
// built a field at a time, so nothing the later stages keep for her (her
// pass, the old powers' hidden parts) can reach a player by being added
// here. now is the server's clock, so every phone counts the same time down.
export function foundView(doc, role) {
  const f = doc?.found;
  if (!f) return null;
  const now = Date.now();
  if (role === "gm") return { ...clone(f), now };
  return {
    id: f.id, at: f.at, step: f.step, recipe: clone(f.recipe), n: f.n, seed: f.seed, clocks: clone(f.clocks),
    clock: clone(f.clock),
    who: f.who.map((w) => ({ key: w.key, user: w.user, ch: w.ch, name: w.name, cname: w.cname, joined: w.joined })),
    outs: clone(f.outs),
    turn: clone(f.turn),
    asking: { holds: kept(f.asking.holds), runs: kept(f.asking.runs), notices: kept(f.asking.notices) },
    tension: kept(f.tension),
    last: clone(f.last), out: f.out === true,
    pool: f.pool ? [...f.pool] : null,
    seats: f.seats ? f.seats.map(kept) : null,
    olds: f.olds ?? 0,
    fac: (f.fac ?? []).map((x) => (x.old ? { old: true, card: cardOf(x.card), ...(x.deal ? { deal: true } : {}) } : { key: x.key, name: x.name, cname: x.cname, picks: Object.fromEntries(Object.entries(x.picks ?? {}).filter(([p]) => FOUNDER.includes(p)).map(([p, v]) => [p, kept(v)])) })),
    now,
  };
}

// ------------------------------------------------------------ what's new

// The book's questions, the way a turn asks them.
export const ASKED = {
  holds: "What holds it together?",
  tension: "What’s pulling it apart?",
  runs: "Who runs it, really?",
  notices: "What does a stranger notice first?",
};
// What each age is called in a line.
const AGE_OF = { ask: "the asking", ground: "the ground", found: "the founding" };

// What changed between the founding the phone had and the one it's got now,
// said for whoever's holding it (me, their key, and gmName, the GM's first
// name): { lines, buzz }.
export function foundNews(a, b, { gm = false, me = null, gmName = "Your GM" } = {}) {
  const lines = [];
  let buzz = false;
  const inIt = (f) => Boolean(me && f?.who?.some((w) => w.key === me));
  if (!b) {
    if (a && !gm && a.step !== "carried") lines.push(`${gmName}’s ended the founding.`);
    return { lines, buzz };
  }
  const fresh = !a || a.id !== b.id;
  const moved = (from, to) => !fresh && a.step === from && b.step === to;
  if (!gm && b.step === "room" && (fresh || !inIt(a)) && inIt(b) && !whoOf(b, me)?.joined) {
    lines.push(`${gmName}’s opened the founding. Join it on the World tab.`);
    buzz = true;
  }
  if (!gm && b.step === "ask" && (fresh || a.step === "room") && inIt(b)) lines.push("The founding’s started.");
  if (!gm && moved("asked", "ground") && inIt(b)) lines.push(`${gmName}’s rolled the ground’s dice.`);
  if (!gm && moved("grounded", "found") && inIt(b)) lines.push(`${gmName}’s started the founding’s second age.`);
  const t = b.turn;
  if (!gm && t?.key === me) {
    if (PARTS.includes(t.part) && (fresh || a.turn?.key !== me || a.turn?.part !== t.part)) {
      lines.push(t.part === "tension" ? "Your turn: roll the d12 for what’s pulling it apart." : `Your turn: ${ASKED[t.part].charAt(0).toLowerCase()}${ASKED[t.part].slice(1)}`);
      buzz = true;
    } else if (t.part === "seat" && (fresh || a.turn?.key !== me || a.turn?.part !== "seat")) {
      lines.push("Your turn: take a die for a seat.");
      buzz = true;
    } else if (FOUNDER.includes(t.part) && (fresh || a.turn?.key !== me || a.turn?.i !== t.i)) {
      lines.push("Your turn: found your faction.");
      buzz = true;
    }
  }
  if (!fresh && b.out && !a.out) {
    if (b.step === "ask") lines.push(gm ? "Time’s up, so the rest of the asking’s dealt." : `Time’s up. The rest of the asking’s dealt on ${gmName}’s phone.`);
    else if (AGE_OF[b.step]) lines.push(gm ? `The tables are dealing the rest of ${AGE_OF[b.step]}.` : `The rest of ${AGE_OF[b.step]}’s dealt on ${gmName}’s phone.`);
  }
  if (moved("ask", "asked")) lines.push("That’s the asking done.");
  if (moved("ground", "grounded")) lines.push("That’s the ground done.");
  if (moved("found", "founded")) lines.push("That’s the founding done.");
  if (!fresh && !gm && b.step === "carried" && a.step !== "carried") lines.push(`${gmName}’s taking it from here, building the rest on her phone.`);
  return { lines, buzz };
}
