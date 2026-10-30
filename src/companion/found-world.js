// The founding's world (stage 11 of notes/builder-plan.md): the room as the
// engine has it, built on every phone from the shared seed and what's been
// answered (found-rules.js), so every phone deals the same three cards for a
// turn and nothing has to come from the server to deal. What a card's dealt
// with it (an old power's resources and people, the first with one to
// spare, a founder's size at Local with its seat, and its resources, people
// and d4 agenda with its Want) is dealt here too, on the phone that answers,
// and goes up with the answer, so the room keeps what the crew saw even when
// the tables change between sessions. world-make.js carries it into Build
// the world from here, on a seed of its own.
//
// Pure, with no page, like the engine: found.js draws it, and the tests deal
// it the same way.
import { cardsOf, choose, drawOf, fill, lock, options, rngOf, start } from "./world-engine.js";
import { ASKS, CARDS, OLD_SIZES, PARTS, diceLeft, doneAt, missingOf, onBoard, pickOf, seatAt, seatFree } from "./found-rules.js";

const copy = (x) => JSON.parse(JSON.stringify(x));
// How often a strange line comes up at each of how strange's three marks,
// the engine's own.
const STRANGE = [0.35, 1, 2.5];
// A line's weight for each thing it fits: what the faction or the seat is,
// and what the asking's about.
const FIT = 3;
const FIT_BOARD = 1.5;

// A pick the room keeps, as the engine reads one.
export const asEngine = (p) => (p.own ? { own: true, text: p.text } : { id: p.id, text: p.text, tags: p.tags ?? [], dials: p.dials ?? {}, strange: p.strange === true, why: "", ...(p.roll ? { roll: p.roll } : {}) });
const rowOf = (p) => (p.own ? { own: true, text: p.text } : { id: p.id, text: p.text, ...(p.role ? { role: p.role } : {}), tags: p.tags ?? [], leans: p.leans ?? [], strange: p.strange === true, why: p.why ?? "", ...(p.offers?.length ? { offers: p.offers } : {}) });
const seatRow = (s) => (s.own ? { own: true, text: s.text, notice: s.notice, role: s.role, tags: [] } : { id: s.id, text: s.text, notice: s.notice, role: s.role, tags: s.tags ?? [], strange: s.strange === true, why: "" });

// The keep a die's face picks off the region's d6.
export const roleOf = (T, f, k) => T.regions?.[f.recipe.region]?.d6?.[(f.pool?.[k] ?? 0) - 1] ?? null;
// What the tables call a keep, for a die's label.
export const keepName = (role) => String(role ?? "").replace(/^./, (c) => c.toUpperCase());

// ------------------------------------------------------------ the world

// The room's world: the asking, the ground's seats by their dice, and every
// faction the founding's made so far, in order, each with what's dealt with
// it. Kept for the last few rooms, for the tables they were dealt from,
// since every redraw asks for it.
const memos = new WeakMap();
export function roomWorld(T, f) {
  if (!memos.has(T)) memos.set(T, new Map());
  const memo = memos.get(T);
  const key = JSON.stringify([f.id, f.seed, f.n, f.recipe, f.asking, f.tension, f.pool, f.seats, f.fac]);
  if (!memo.has(key)) {
    memo.set(key, build(T, f));
    if (memo.size > 24) memo.delete(memo.keys().next().value);
  }
  return copy(memo.get(key));
}
function build(T, f) {
  const fac = f.fac ?? [];
  const W = start(T, { recipe: f.recipe, seed: f.seed, factions: fac.length || f.n });
  for (const part of PARTS) {
    const p = pickOf(f, part);
    if (p) choose(T, W, part === "tension" ? "tension" : `ask:${part}`, asEngine(p));
  }
  if (f.pool?.length) {
    W.s = f.pool.length;
    W.seats = Array.from({ length: W.s }, (_, k) => (f.seats?.[k] ? seatRow(f.seats[k]) : null));
  }
  if (fac.length) {
    W.n = fac.length;
    W.factions = W.factions.slice(0, W.n);
    W.made = { ties: [], needs: [] };
    fac.forEach((x, i) => replay(T, W, x, i));
  }
  return W;
}
// One faction's picks onto the world, in the engine's order, and what's dealt
// with it once its card's that far: an old power's resources and people with
// its card, and a founder's at Local, with its agenda at d4, once it's got its
// Want. Its questions are its first threads, and its own Loyalty.
function replay(T, W, x, i) {
  const put = (step, v) => choose(T, W, `f:${i}:${step}`, v);
  if (x.old) {
    const c = x.card;
    if (!c) return;
    put("seat", { k: c.seat });
    put("size", { size: c.size.size, die: c.size.die });
    put("type", rowOf(c.type));
    W.factions[i].exc = null;
    put("method", rowOf(c.method));
    put("want", rowOf(c.want));
    if (c.res?.length && c.assets?.length) {
      put("res", c.res.map(setRow));
      put("assets", c.assets.map(setRow));
    } else dealWith(T, W, i, ["res", "assets"], i === 0 ? { only: "extra" } : {});
    put("name", rowOf(c.name));
    W.factions[i].room = "old";
    return;
  }
  const p = x.picks ?? {};
  const k = p["f-seat"]?.k;
  if (k == null) return;
  put("seat", { k });
  put("size", p["f-seat"].size ?? localOf(T, W, i));
  W.factions[i].exc = null;
  W.factions[i].room = "founder";
  if (p.before?.j != null) W.made.ties.push({ a: p.before.j, b: i, kind: "wildcard", tie: { id: p.before.id ?? `own:before:${i}`, text: p.before.text, back: "", kind: "wildcard", bond: "hostile" }, at: { seat: k }, from: "fd", age: 2 });
  if (p.owes?.j != null) W.made.ties.push({ a: i, b: p.owes.j, kind: "wildcard", tie: { id: p.owes.id ?? `own:owes:${i}`, text: p.owes.text, back: "", kind: "wildcard", bond: "bond" }, at: { seat: k }, from: "fd", age: 2 });
  if (p.never) W.factions[i].loy = [{ ...(p.never.id ? { id: p.never.id } : {}), text: p.never.text, ...(p.never.own ? { own: true } : {}) }];
  for (const step of ["type", "method", "want"]) {
    if (!p[step]) return;
    put(step, rowOf(p[step]));
    if (step === "type") W.factions[i].exc = null;
  }
  const got = p.want.with;
  if (got?.res?.length && got.assets?.length && got.agenda) {
    put("res", got.res.map(setRow));
    put("assets", got.assets.map(setRow));
    put("agenda", { ...setRow(got.agenda), die: 4, aims: got.agenda.aims ?? [], at: got.agenda.at ?? {} });
  } else dealWith(T, W, i, ["res", "assets", "agenda"]);
  if (p.name) put("name", rowOf(p.name));
}
// A resource, an asset or an agenda as the room kept it, as the engine reads one.
const setRow = (x) => ({ ...rowOf(x), ...(x.power != null ? { power: x.power === true } : {}), ...(x.does ? { does: x.does } : {}) });
// A founder's size: Local, at a die the engine deals for it.
const localOf = (T, W, i) => options(T, W, `f:${i}:size`, 4).find((s) => s.size === "local") ?? { size: "local", die: 4 };
// What goes up with a founder's seat: its size, dealt once it sits there.
export function seatSize(T, f, i, k) {
  const W = roomWorld(T, f);
  choose(T, W, `f:${i}:seat`, { k });
  return localOf(T, W, i);
}
// What goes up with a founder's Want: its resources, its people and assets,
// and its agenda at d4, dealt once it wants that.
export function wantWith(T, f, i, want) {
  const W = roomWorld(T, f);
  choose(T, W, `f:${i}:want`, rowOf(want));
  dealWith(T, W, i, ["res", "assets", "agenda"]);
  const x = W.factions[i];
  return x.res && x.assets && x.agenda ? { res: x.res, assets: x.assets, agenda: x.agenda } : null;
}
function dealWith(T, W, i, steps, opts = {}) {
  for (const step of steps) {
    const c = options(T, W, `f:${i}:${step}`, 1, step === "agenda" ? {} : opts)[0];
    if (c == null) return;
    // Every agenda in the founding starts at d4 (the plan's call).
    choose(T, W, `f:${i}:${step}`, step === "agenda" ? { ...c, die: 4 } : c);
  }
}

// ------------------------------------------------------------ what a turn's dealt

// The ground: three seats for a die, of the keep its face picks, none that's
// in the ground already. When its keep's run out, the rest are whatever
// comes next, each its own keep.
export function seatHand(T, f, k) {
  const role = roleOf(T, f, k);
  const W = roomWorld(T, f);
  const taken = new Set(W.seats.filter(Boolean).map((s) => s.id).filter(Boolean));
  const all = options(T, W, `seat:${k}`, 120).filter((c) => !taken.has(c.id));
  return [...all.filter((c) => c.role === role), ...all.filter((c) => c.role !== role)].slice(0, 3).map((c) => ({ id: c.id, text: c.text, notice: c.notice, role: c.role, tags: c.tags ?? [], ...(c.strange ? { strange: true } : {}) }));
}

// An old power: three whole cards, each on a free seat, City or Great, and
// each a different kind of faction, with how it works, its Want and its name
// as the engine deals them for it. Each card deals from a stream of its own
// (its place in the hand as the step's tries), so the three don't all come
// out the same size wanting the same thing.
export function oldHand(T, f, i) {
  const W = roomWorld(T, f);
  const used = { type: new Set(), method: new Set(), want: new Set(), name: new Set() };
  const out = [];
  options(T, W, `f:${i}:seat`, 3).forEach(({ k }, c) => {
    const W2 = copy(W);
    for (const step of ["size", "type", "method", "want", "name"]) W2.tries[`f:${i}:${step}`] = c;
    choose(T, W2, `f:${i}:seat`, { k });
    const size = options(T, W2, `f:${i}:size`, 4).find((s) => OLD_SIZES.includes(s.size));
    if (!size) return;
    choose(T, W2, `f:${i}:size`, size);
    const card = { seat: k, size };
    for (const step of CARDS) {
      const all = options(T, W2, `f:${i}:${step}`, 6);
      const p = all.find((x) => !used[step].has(x.id)) ?? all[0];
      if (!p) return;
      used[step].add(p.id);
      card[step] = p;
      if (step !== "name") choose(T, W2, `f:${i}:${step}`, p);
      if (step === "type") W2.factions[i].exc = null;
      // Its resources and people come with it, the first old power's with
      // one to spare, so there's always a trade to block (the plan's call).
      if (step === "want") {
        dealWith(T, W2, i, ["res", "assets"], i === 0 ? { only: "extra" } : {});
        card.res = W2.factions[i].res;
        card.assets = W2.factions[i].assets;
        if (!card.res || !card.assets) return;
      }
    }
    out.push(card);
  });
  return out;
}

// A founder's turn: three cards for what it is, how it works, its Want or
// its name, or three lines for one of its questions (j, the faction the
// question names, for who had the seat and who it owes).
export function founderHand(T, f, i, part, j = null) {
  if (CARDS.includes(part)) return options(T, roomWorld(T, f), `f:${i}:${part}`, 3);
  if (ASKS.includes(part)) return linesFor(T, f, i, part, j);
  return [];
}
// The seats a founder can found on: every one nobody holds.
export const freeSeats = (f, i) => (f.seats ?? []).map((_, k) => k).filter((k) => seatFree(f, k, i));
// The factions a founder's question can name: the ones on the board.
export const namable = (f, i) => (f.fac ?? []).map((_, j) => j).filter((j) => onBoard(f, j, i));

// Three of a question's lines, a line no other founder's got while there's
// one, weighted to what fits the seat and the faction it names.
function linesFor(T, f, i, part, j) {
  const rows = T.core.founding?.[part] ?? [];
  if (!rows.length) return [];
  const W = roomWorld(T, f);
  const near = new Set();
  const far = new Set();
  const add = (into, xs) => (xs ?? []).forEach((t) => t && into.add(t));
  const seat = W.seats[seatAt(f, i)];
  if (seat) add(near, [seat.role, ...(seat.tags ?? [])]);
  const other = j != null ? W.factions[j] : null;
  for (const s of ["type", "method", "want"]) if (other?.[s] && !other[s].own) add(near, [other[s].role, ...(other[s].tags ?? [])]);
  for (const q of ["holds", "runs", "notices"]) add(far, W.asking[q]?.tags);
  add(far, W.tension?.tags);
  const weigh = (r) => r.w * (1 + FIT * Math.min(2, r.tags.filter((t) => near.has(t)).length) + FIT_BOARD * Math.min(1, r.tags.filter((t) => far.has(t) && !near.has(t)).length)) * (r.strange ? STRANGE[W.dials.strange] : 1);
  const used = new Set((f.fac ?? []).flatMap((x, k) => (k !== i && x.picks?.[part]?.id ? [x.picks[part].id] : [])));
  const fresh = rows.filter((r) => !used.has(r.id));
  const got = drawOf(fresh.map((r) => ({ w: weigh(r), r })), rngOf(f.seed, "fd", i, part, j ?? "-"), 3).map((c) => c.r);
  if (got.length < 3) got.push(...drawOf(rows.filter((r) => !got.includes(r)).map((r) => ({ w: weigh(r), r })), rngOf(f.seed, "fd", i, part, j ?? "-", "again"), 3 - got.length).map((c) => c.r));
  return got.map((r) => ({ id: r.id, text: r.text, tags: r.tags, ...(r.strange ? { strange: true } : {}) }));
}

// ------------------------------------------------------------ out of time

// What her phone deals when the clock's run out, or she taps Deal the rest:
// whatever's left of the age that's on, the way the engine deals it, the
// first card each time, in order. A founder dealt by the tables had nobody
// before it on its seat, and owes one of the factions on the board.
export function restOf(T, f) {
  const g = copy(f);
  if (g.step === "ground") {
    const seats = {};
    for (const k of diceLeft(g)) {
      const c = seatHand(T, g, k)[0];
      if (!c) return null;
      seats[k] = c;
      g.seats[k] = { ...c, deal: true };
    }
    return { o: "fd-rest", seats };
  }
  if (g.step !== "found") return null;
  const fac = {};
  for (const i of g.fac.map((_, i) => i).filter((i) => !doneAt(g, i))) {
    const x = g.fac[i];
    if (x.old) {
      const card = oldHand(T, g, i)[0];
      if (!card) return null;
      fac[i] = { card };
      x.card = card;
      continue;
    }
    const picks = {};
    for (const part of missingOf(g, i)) {
      const p = dealtPart(T, g, i, part);
      if (!p) return null;
      picks[part] = p;
      x.picks[part] = p;
    }
    fac[i] = { picks };
  }
  return { o: "fd-rest", fac };
}
function dealtPart(T, f, i, part) {
  if (part === "f-seat") {
    const c = options(T, roomWorld(T, f), `f:${i}:seat`, 1)[0];
    return c ? { k: c.k, size: seatSize(T, f, i, c.k) } : null;
  }
  if (part === "before") return { j: null };
  if (part === "owes") {
    const board = namable(f, i);
    if (!board.length) return null;
    const j = board[Math.floor(rngOf(f.seed, "fd", i, "owes-who")() * board.length) % board.length];
    const c = linesFor(T, f, i, part, j)[0];
    return c ? { j, ...c } : null;
  }
  if (part === "never") return linesFor(T, f, i, part, null)[0] ?? null;
  const c = founderHand(T, f, i, part)[0] ?? null;
  if (!c || part !== "want") return c;
  const got = wantWith(T, f, i, c);
  return got ? { ...c, with: got } : null;
}

// ------------------------------------------------------------ what every phone shows

// A faction's name in the room: its name once it's got one, or till then
// what it is and where it sits (the bell-founders on the Old Bridge), or for
// a founder with nothing yet, the newcomers.
export function calledIn(T, W, i) {
  const f = W.factions[i];
  if (!f) return "";
  const k = f.seat?.k;
  const seat = k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "";
  if (f.name) return fill(f.name.text, { seat });
  if (f.type && seat) {
    const what = String(f.type.text ?? "").split(",")[0].trim().replace(/[.]+$/, "").replace(/^(a|an|the)\s+/i, "");
    const type = /^[A-Z][a-z]/.test(what) ? what.charAt(0).toLowerCase() + what.slice(1) : what;
    return fill(T.core.templates.called, { type, seat });
  }
  return T.core.templates.newcomer ?? "the newcomers";
}
// A question's line as it reads now, with the names as they are: who had the
// seat holds it toward the newcomers, the newcomers hold who they owe toward
// whoever they owe, and what they'll never do is their own.
export function lineIn(T, W, i, part, text, j = null) {
  const k = W.factions[i]?.seat?.k;
  const seat = k != null && W.seats[k] ? { text: W.seats[k].text, name: true } : "";
  const b = part === "before" ? i : j;
  return fill(text, { seat, ...(b != null ? { b: { text: calledIn(T, W, b), name: true } } : {}) });
}

// The founding as every phone draws it: each faction's card so far, with
// what it's been dealt and the threads its questions wrote, and the seats.
export function roomBoard(T, f) {
  const W = roomWorld(T, f);
  const C = cardsOf(T, W);
  const sizes = T.regions?.[f.recipe.region]?.sizes ?? {};
  const factions = (f.fac ?? []).map((x, i) => {
    const w = W.factions[i];
    const c = C.factions[i];
    const p = x.picks ?? {};
    // The threads its questions wrote: the ones it holds (a grudge toward
    // whoever took a seat it had, and toward whoever it owes), and the ones
    // held toward it.
    const holds = [];
    const toward = [];
    (f.fac ?? []).forEach((y, j) => {
      const b = y.picks?.before;
      if (b?.j != null) {
        const t = { text: lineIn(T, W, j, "before", b.text), kind: "hostile", from: b.j, to: j, part: "before" };
        if (b.j === i) holds.push(t);
        if (j === i) toward.push(t);
      }
      const o = y.picks?.owes;
      if (o?.j != null) {
        const t = { text: lineIn(T, W, j, "owes", o.text, o.j), kind: "bond", from: j, to: o.j, part: "owes" };
        if (j === i) holds.push(t);
        if (o.j === i) toward.push(t);
      }
    });
    const size = w?.size?.size ?? null;
    return {
      i,
      old: x.old === true,
      key: x.key ?? "",
      who: x.name ?? "",
      done: doneAt(f, i),
      seat: w?.seat?.k ?? null,
      name: calledIn(T, W, i),
      named: Boolean(w?.name),
      about: c?.about ?? "",
      sits: c?.sits ?? "",
      want: c?.want ?? "",
      size,
      sizeWord: size ? sizes[size] ?? size : "",
      die: w?.size?.die ?? null,
      steps: c?.steps ?? 1,
      res: c?.res?.map((r) => r.text) ?? [],
      assets: c?.assets?.map((a) => ({ text: a.text, power: a.power === true })) ?? [],
      agenda: !x.old && w?.agenda ? { text: c?.agendas?.[0]?.text ?? "", die: w.agenda.die } : null,
      holds,
      toward,
      loy: p.never ? lineIn(T, W, i, "never", p.never.text) : "",
    };
  });
  const seats = W.seats.map((s, k) => (s ? { k, name: fill(s.text, {}), notice: s.notice ?? "", role: s.role ?? "", own: Boolean(s.own), strange: Boolean(s.strange), held: (f.fac ?? []).findIndex((_, i) => seatAt(f, i) === k) } : null));
  return { factions, seats, W };
}

// ------------------------------------------------------------ carrying it on

// The room's world for Build the world (world-make.js): everything the crew
// made in the open, locked, on a seed of her own, so her phone deals the
// rest (the old powers' agendas, every Face and Secret, the web round what
// the founding wrote, the checks and the crew's friends and foes) and
// nobody who had the room's seed can deal it for themselves.
export function carriedWorld(T, f, seed) {
  const W = roomWorld(T, f);
  W.seed = String(seed);
  W.tries = {};
  W.not = {};
  for (const q of ["holds", "runs", "notices"]) if (W.asking[q]) lock(W, `ask:${q}`);
  if (W.tension) lock(W, "tension");
  W.seats.forEach((s, k) => s && lock(W, `seat:${k}`));
  W.factions.forEach((x, i) => {
    if (!x.room) return;
    for (const step of ["seat", "size", "type", "exc", "method", "want", "res", "assets", ...(x.room === "founder" ? ["agenda"] : []), "name"]) {
      if (step === "exc" ? x.exc !== undefined : x[step] != null) lock(W, `f:${i}:${step}`);
    }
  });
  return W;
}
