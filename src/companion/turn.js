// The faction turn, once a downtime (stage 2 of notes/worlds-plan.md), the way
// The Faction Turn runs it: hiring first, then every faction's action
// telegraphed to the crew, the crew's action, Obstructs settled first, then the
// actions roll and land, and each outcome goes on the cards.
//
// It's kept in the campaign's world, beside the board (board.js), as doc.turn.
// The GM runs it. The crew's side of it (who the crew's paying, its action and
// its roll) can be set from any phone in the campaign, so a player changes that
// and nothing else. The phone and the Worker (src/worker/world.js) both change
// the world with applyAll(), so a change looks the same on the phone the moment
// it's made as it does once the Worker's got it. A player's phone only ever
// gets the telegraphs she's sent and the crew's own side (forPlayer()).
//
// A turn: { id, n, step, at, hires, acts, def }
//   n      which downtime it is, counting up from 1
//   step   hire (hiring comes first, and she gets the actions ready), tele (the
//          telegraphs are out and the crew's picking its action), land (the
//          actions land) or done
//   hires  [{ id, by, to, text }]  by pays to with an extra resource: by is
//          "crew" or a faction's id, and text is the job
//   acts   one for each faction she's given an action, and the crew's
//   def    { [faction id]: [{ d, v }] }  a faction's Power, rolled once, the
//          first time anyone goes at it this downtime
//
// An act, keyed by who's acting (by: a faction's id, or "crew"):
//   what    agenda (works its agenda ag), new (writes a new agenda, nt at d nd),
//           out (one of the six outcomes, out), comes (comes for the crew, with
//           table, its d12 on the right table, rolled as it's telegraphed), and
//           for the crew back (sets back to's agenda ag), work (works for to)
//           and else (something that isn't a move on a faction, in text)
//   to      the faction it's going at. An Obstruct's act is the action it's
//           stopping (that faction's id), and its to is the same.
//   thing   { l, lid }  the resource or asset it's after, for Destroy and Acquire
//   vs      what it rolls against: power (to's Power), own (one thing out on
//           its own, guarded by the assets in there), face (to's face, a die of
//           vsteps, or to's Power), die (a stake or a person, vsteps), agenda
//           (the agenda's die), act (an Obstruct: the action's dice) or none
//   left    a faction's assets that add Power but don't fit, so they're left out
//   fits    its bond threads that fit, a step each
//   power   the crew's Power in steps, and own: the steps when one of the crew
//           rolls their own permissions instead (who). fit: steps for
//           Reputations and bond threads that fit. slot: a personal slot's in
//           as well, so everything counts twice (slotBy: whose)
//   split   the first die's steps when it splits, and p2 what the second die's
//           for: quiet (keeping its name out of it) or else (p2text)
//   shown   telegraphed to the crew (off-screen otherwise, with no roll)
//   words   what the crew's told, if she'd rather say it herself
//   r       what its dice came up: [[{ d, v }] for each die], vr the same for
//           whatever it's against when that's rolled for it alone
//   again   the crew's rolls again, each paid with 1 Resolve
//   tie     the ties the crew took with an extra resource, one for each die
//   put     whether each die's outcome has gone on the cards
//
// A change is one of these (id is always the turn's, so one from an old turn
// does nothing):
//   { o: "t-start", id }               a new faction turn, once the last one's done
//   { o: "t-step", id, v }             on to the next step (or back to one)
//   { o: "t-act", id, a }              a faction's action, or the crew's (a.by "crew")
//   { o: "t-unact", id, by }           a faction's action taken off, or the crew's
//   { o: "t-hire", id, h }             a payer hires a faction with an extra resource
//   { o: "t-unhire", id, hid }         a hire taken back
//   { o: "t-roll", id, by, r, vr?, def?, at?, again?, real? }   dice, as they came up:
//                                      r its own, vr what it's against, def a
//                                      faction's Power ({ f, r }), at the
//                                      dice of the action an Obstruct's stopping
//   { o: "t-tie", id, p, v }           the crew takes a tie with an extra resource
//   { o: "t-put", id, by, p, v }       a die's outcome has gone on the cards
//   { o: "t-set", id, turn }           the turn as it was, for Undo
import { OUTCOMES, apply as applyBoard, blank as blankBoard, factionOf, find, forPlayer as boardForPlayer, line, moneyOf, readable as readableBoard, stepsOf, undoOf as undoBoard } from "./board.js";
import { stepsToDice } from "./dice.js";

export const STEPS = ["hire", "tele", "land", "done"];
export const MAX = { words: 140, job: 140, about: 120, name: 60, agenda: 120, hires: 24, acts: 64, steps: 36, fit: 12 };
const SIZES = [2, 4, 6, 8, 10, 12];
const ID = /^[a-z0-9-]{2,24}$/;
const isId = (v) => ID.test(String(v ?? ""));
const whole = (v, lo, hi, or) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : or;
};
const size = (v) => (SIZES.includes(Number(v)) ? Number(v) : null);
const yes = (changed = true) => ({ ok: true, changed });
const no = (why) => ({ ok: false, changed: false, why });

// What each kind of action can roll against. A faction's best people, its
// face, defend with its Power unless she gives the face a die of its own.
export const VS = {
  agenda: ["agenda"],
  new: ["none"],
  comes: ["none"],
  back: ["agenda"],
  work: ["none"],
  else: ["none"],
  Destroy: ["power", "own", "die"],
  Acquire: ["power", "own", "die"],
  Undermine: ["power", "face", "die"],
  Influence: ["face", "power", "die"],
  Obstruct: ["act"],
  Establish: ["none", "die"],
};
const kindOf = (a) => (a.what === "out" ? a.out : a.what);

// ------------------------------------------------------------ the world

export function blank() {
  return { ...blankBoard(), turn: null };
}

// The world as it came from somewhere else, tidied: the board, and its turn.
export function readable(raw) {
  const doc = readableBoard(raw);
  doc.turn = turnOf(raw?.turn, doc);
  return doc;
}

function turnOf(raw, doc) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  const t = { id: raw.id, n: whole(raw.n, 1, 9999, 1), step: STEPS.includes(raw.step) ? raw.step : "hire", at: whole(raw.at, 0, Number.MAX_SAFE_INTEGER, 0), hires: [], acts: [], def: {} };
  for (const h of Array.isArray(raw.hires) ? raw.hires.slice(0, MAX.hires) : []) {
    const x = hireOf(h);
    if (x && !t.hires.some((y) => y.id === x.id || y.to === x.to)) t.hires.push(x);
  }
  for (const a of Array.isArray(raw.acts) ? raw.acts.slice(0, MAX.acts) : []) {
    const x = a?.by === "crew" ? crewActOf(a, doc, { loose: true }) : factionActOf(a, doc, { loose: true });
    if (x && !t.acts.some((y) => y.by === x.by)) t.acts.push(withRolls(x, a));
  }
  if (raw.def && typeof raw.def === "object") {
    for (const [f, r] of Object.entries(raw.def)) {
      const dice = diceOf(r);
      if (isId(f) && dice) t.def[f] = dice;
    }
  }
  return t;
}

// Dice as they came up: [{ d, v }], every one a real die with a face it has.
function diceOf(r) {
  if (!Array.isArray(r) || !r.length || r.length > 8) return null;
  const out = r.map((x) => ({ d: size(x?.d), v: whole(x?.v, 1, 12, null) })).filter((x) => x.d && x.v != null && x.v <= x.d);
  return out.length === r.length ? out : null;
}
// A roll for an act's dice, die by die: [[{ d, v }]].
function partsOf(r, n = 2) {
  if (!Array.isArray(r) || !r.length || r.length > n) return null;
  const out = r.map(diceOf);
  return out.every(Boolean) ? out : null;
}
function withRolls(x, a) {
  x.r = partsOf(a.r);
  x.vr = diceOf(a.vr);
  x.again = whole(a.again, 0, 99, 0);
  x.real = a.real === true;
  x.tie = [0, 1].map((i) => Array.isArray(a.tie) && a.tie[i] === true);
  x.put = [0, 1].map((i) => Array.isArray(a.put) && a.put[i] === true);
  return x;
}

function hireOf(h) {
  if (!h || typeof h !== "object" || !isId(h.id) || !isId(h.to)) return null;
  const by = h.by === "crew" || isId(h.by) ? h.by : null;
  if (!by || by === h.to) return null;
  return { id: h.id, by, to: h.to, text: line(h.text, MAX.job) };
}

// What every act has, whoever's acting.
function common(raw) {
  const what = String(raw.what ?? "");
  const out = OUTCOMES.includes(raw.out) ? raw.out : null;
  const a = { by: raw.by, what, out: what === "out" ? out : null, to: isId(raw.to) ? raw.to : null, ag: isId(raw.ag) ? raw.ag : null, thing: null, vs: "none", vsteps: whole(raw.vsteps, 1, MAX.steps, 0), there: [], split: null, p2: raw.p2 === "else" ? "else" : "quiet", p2text: line(raw.p2text, MAX.about), words: line(raw.words, MAX.words), shown: true };
  if (raw.thing && (raw.thing.l === "res" || raw.thing.l === "assets") && isId(raw.thing.lid)) a.thing = { l: raw.thing.l, lid: raw.thing.lid };
  const k = kindOf(a);
  if (!VS[k]) return null;
  a.vs = VS[k].includes(raw.vs) ? raw.vs : VS[k][0];
  if (a.vs === "own") a.there = (Array.isArray(raw.there) ? raw.there : []).filter(isId).slice(0, 16);
  if (Number.isInteger(raw.split) && raw.split > 0) a.split = raw.split;
  return a;
}

// A faction's action, or null if it doesn't make sense on this board. Read
// loose, as it's kept, it only has to be in the right shape, since play moves
// the board under it (an agenda it climbed past d12, a thing it took).
export function factionActOf(raw, doc, { loose = false } = {}) {
  if (!raw || typeof raw !== "object" || !isId(raw.by)) return null;
  const f = find(doc, raw.by);
  if (!f) return null;
  const a = common(raw);
  if (!a || !["agenda", "new", "out", "comes"].includes(a.what)) return null;
  if (a.what === "out" && !a.out) return null;
  if (a.what === "new") Object.assign(a, { nt: line(raw.nt, MAX.agenda), nd: size(raw.nd) ?? 6 });
  if (a.what === "new" && !a.nt) return null;
  if (a.what === "comes") {
    const tb = raw.table && typeof raw.table === "object" ? raw.table : {};
    a.table = { k: tb.k === "bond" ? "bond" : "hostile", r: whole(tb.r, 1, 12, 1), d2: whole(tb.d2, 0, 2, 0) };
  }
  if (a.what !== "out" || a.out === "Establish") a.to = null;
  else if (a.out === "Obstruct" && isId(raw.act)) a.to = raw.act;
  if (!a.to && a.what === "out" && a.out !== "Establish") return null;
  a.left = (Array.isArray(raw.left) ? raw.left : []).filter(isId).slice(0, 16);
  a.fits = (Array.isArray(raw.fits) ? raw.fits : []).filter(isId).slice(0, 16);
  a.shown = raw.shown !== false;
  if (loose) return a;
  // A mini faction can do its two outcomes, and nothing else.
  if (f.mini && (a.what !== "out" || !f.outs.includes(a.out))) return null;
  if (a.what === "agenda" && !f.agendas.some((x) => x.id === a.ag && !x.done)) return null;
  if (a.what === "new" && f.agendas.length >= 2) return null;
  if (a.to && (!find(doc, a.to) || a.to === f.id)) return null;
  a.left = a.left.filter((id) => f.assets.some((x) => x.id === id && x.power));
  a.fits = a.fits.filter((id) => bondThreads(f).some((x) => x.id === id));
  return a;
}

// The crew's action, or null if it doesn't make sense on this board. Read
// loose, as it's kept, it only has to be in the right shape.
export function crewActOf(raw, doc, { loose = false } = {}) {
  if (!raw || typeof raw !== "object" || raw.by !== "crew") return null;
  const a = common(raw);
  if (!a || !["out", "back", "work", "else"].includes(a.what)) return null;
  if (a.what === "out" && !a.out) return null;
  if (a.what === "else") {
    a.text = line(raw.text, MAX.words);
    if (!a.text) return null;
    a.to = null;
  } else if (!(a.what === "out" && a.out === "Establish")) {
    a.to = a.out === "Obstruct" && isId(raw.act) ? raw.act : a.to;
    if (!a.to || (!loose && !find(doc, a.to))) return null;
  } else a.to = null;
  // Setting back its agenda goes at the one it's working, unless the crew
  // knows which.
  if (a.what === "back" && !loose) {
    const ags = find(doc, a.to)?.agendas.filter((x) => !x.done) ?? [];
    if (!ags.some((x) => x.id === a.ag)) a.ag = ags[0]?.id ?? null;
  }
  Object.assign(a, {
    power: whole(raw.power, 1, MAX.steps, 2),
    own: whole(raw.own, 1, MAX.steps, 0),
    who: line(raw.who, MAX.name),
    fit: whole(raw.fit, 0, MAX.fit, 0),
    slot: raw.slot === true,
    slotBy: line(raw.slotBy, MAX.name),
    about: line(raw.about, MAX.about),
  });
  if (!a.who) a.own = 0;
  return a;
}

// ------------------------------------------------------------ counting it

// A faction's bond threads in its bonds, whole and ready to be a step.
export const bondThreads = (f) => ["pub", "mor", "loy"].flatMap((l) => f[l]).filter((x) => x.kind === "bond" && x.s === "whole");

// How a faction sees whoever's paying it, from its whole threads toward them:
// mostly hostile, and it won't take their money.
export function towardOf(f, who) {
  const t = f.threads.filter((x) => x.to === who && x.s === "whole");
  const bond = t.filter((x) => x.kind === "bond").length;
  const hostile = t.length - bond;
  return bond > hostile ? "friendly" : hostile > bond ? "hostile" : "business";
}

// Its steps: a faction's Power, less the assets that don't fit, plus a step
// for each bond thread that fits. The crew's Power and what fits, or one of
// the crew's own permissions, and a personal slot in counts everything twice.
export function stepsFor(doc, a) {
  if (a.by === "crew") return Math.min(MAX.steps * 2, ((a.who ? a.own : a.power + a.fit) || 1) * (a.slot ? 2 : 1));
  const f = find(doc, a.by);
  if (!f) return 0;
  const fits = new Set(a.fits);
  return 1 + f.assets.filter((x) => x.power && !x.off && !a.left.includes(x.id)).length + bondThreads(f).filter((x) => fits.has(x.id)).length;
}

// Its dice, die by die: one, or two with a split, and each die's its own
// outcome. Steps past a d12 make more dice for the same die, and the best counts.
export function partsFor(doc, a) {
  const steps = stepsFor(doc, a);
  if (!steps) return [];
  const one = a.split && a.split < steps ? a.split : 0;
  return (one ? [one, steps - one] : [steps]).map((s) => ({ steps: s, dice: stepsToDice(s) }));
}

// The steps of whatever it's against when that's rolled for it alone.
function vsSteps(doc, a) {
  const to = find(doc, a.to);
  if (a.vs === "own") return to ? 1 + to.assets.filter((x) => x.power && !x.off && a.there.includes(x.id)).length : 1;
  if (a.vs === "face") return a.vsteps || (to ? stepsOf(to) : 1);
  if (a.vs === "die") return a.vsteps || 3;
  return 0;
}

// What it's against: whose dice, which ones, and what they came up, if they've
// been rolled. kind is power (a faction's Power, rolled once a downtime), roll
// (rolled for this action alone), act (the dice of the action an Obstruct's
// stopping) or none.
export function againstOf(doc, a) {
  const t = doc.turn;
  if (a.vs === "none") return { kind: "none", dice: [], got: null };
  if (a.vs === "power") {
    const to = find(doc, a.to);
    const got = t?.def[a.to] ?? null;
    return { kind: "power", f: a.to, dice: got ? got.map((x) => x.d) : to ? stepsToDice(stepsOf(to)) : [], got };
  }
  if (a.vs === "act") {
    const b = t?.acts.find((x) => x.by === a.to && x.by !== a.by) ?? null;
    return { kind: "act", act: b, dice: b ? partsFor(doc, b).flatMap((p) => p.dice) : [], got: b?.r ? b.r.flat() : null };
  }
  if (a.vs === "agenda") {
    const ag = find(doc, a.to ?? a.by)?.agendas.find((x) => x.id === a.ag) ?? null;
    return { kind: "roll", ag, dice: ag ? [ag.die] : [], got: a.vr };
  }
  return { kind: "roll", dice: stepsToDice(vsSteps(doc, a)), got: a.vr };
}
// The agenda an act's working or setting back. A faction works its own.
export const agendaOf = (doc, a) => find(doc, a.what === "back" ? a.to : a.by)?.agendas.find((x) => x.id === a.ag) ?? null;

const best = (dice) => Math.max(...dice.map((x) => x.v));
// Whether some dice beat others, by their best: 1 they beat, 0 a tie, -1 not.
const beats = (mine, theirs) => Math.sign(best(mine) - best(theirs));

// Every act's result, worked out from the dice: Obstructs first, and then each
// die of every act that's still going against whatever it's against. Ties go
// to the defender, a die that's climbing counts as the defender, and an
// Obstruct's tie goes to the faction that telegraphed the action. The crew can
// take a tie with an extra resource. Each die's state is waiting (not rolled
// yet), won, tie (lost on a tie), lost, stopped or free (no roll needed).
//
// judge() works on acts put the same way whoever's looking: { by, to,
// obstruct, crew, free, n (its dice), r, got (what it's against came up),
// tie }, so the GM's phone and the Worker judge the whole turn, and a
// player's phone can judge the crew's roll before the Worker's answered.
export function judge(acts) {
  const out = new Map();
  const going = new Map();
  const seen = new Set();
  const byOf = new Map(acts.map((a) => [a.by, a]));
  // Who stops a, if anyone: an Obstruct at it that isn't stopped itself and
  // beats its dice. Two Obstructs at each other can't stop each other.
  const stopper = (a) => {
    if (going.has(a.by)) return going.get(a.by);
    if (seen.has(a.by)) return null;
    seen.add(a.by);
    let by = null;
    for (const o of acts) {
      if (o === a || !o.obstruct || o.to !== a.by || !o.r || !a.r) continue;
      if (stopper(o)) continue;
      const c = beats(o.r[0], a.r.flat());
      if (c > 0 || (c === 0 && o.crew && o.tie[0])) {
        by = o.by;
        break;
      }
    }
    going.set(a.by, by);
    return by;
  };
  for (const a of acts) {
    const stopped = stopper(a);
    const got = a.obstruct ? byOf.get(a.to)?.r?.flat() ?? null : a.got;
    const parts = Array.from({ length: a.n }, (_, i) => {
      if (stopped) return { st: "stopped" };
      if (a.free) return { st: "free" };
      const mine = a.r?.[i];
      if (!mine || !got) return { st: "waiting" };
      const c = beats(mine, got);
      const won = c > 0 || (c === 0 && a.crew && a.tie[i]);
      return { st: won ? "won" : c === 0 ? "tie" : "lost", mine: best(mine), theirs: best(got) };
    });
    out.set(a.by, { parts, stopped });
  }
  return out;
}

// The whole turn's results, on the GM's phone and the Worker.
export function resultsOf(doc) {
  const t = doc.turn;
  if (!t) return new Map();
  return judge(t.acts.filter((a) => a.by === "crew" || find(doc, a.by)).map((a) => {
    const vs = againstOf(doc, a);
    return { by: a.by, to: a.to, obstruct: a.vs === "act", crew: a.by === "crew", free: vs.kind === "none" || !a.shown, n: partsFor(doc, a).length, r: a.r, got: vs.kind === "act" ? null : vs.got, tie: a.tie };
  }));
}

// The results on a player's phone: the Worker's (it sees everything, an
// Obstruct she kept off-screen included), unless the crew's just rolled and
// the Worker hasn't answered yet.
export function resultsMine(t) {
  const out = new Map();
  if (!t) return out;
  const local = judge(t.acts.map((a) => ({ by: a.by, to: a.stops ?? a.to, obstruct: a.vs === "act", crew: a.by === "crew", free: a.vs === "none", n: a.parts.length, r: a.r, got: a.vs === "power" ? t.def[a.to] ?? null : a.vs === "act" ? null : a.vr, tie: a.tie })));
  for (const a of t.acts) out.set(a.by, a.res ?? local.get(a.by));
  return out;
}

// The crew's extra resources spent this downtime: one for each faction it's
// paying, and one for each tie it's taken.
export const spentOf = (t) => (t ? t.hires.filter((h) => h.by === "crew").length + (t.acts.find((a) => a.by === "crew")?.tie.filter(Boolean).length ?? 0) : 0);

// Whether the crew's going at a faction bigger than it is with only its action:
// its Power, or Obstructing its action, since its dice are its Power. That
// takes a personal slot in as well.
export function tooBig(doc, a) {
  if (a.by !== "crew" || a.slot || !a.to || (a.vs !== "power" && a.vs !== "act")) return false;
  const to = find(doc, a.to);
  return Boolean(to) && stepsOf(to) > a.power;
}

// The factions that act this downtime: every one, bar a mini faction made in it.
export const actorsOf = (doc) => doc.factions.filter((f) => !(f.mini && doc.turn && f.born === doc.turn.n));

// ------------------------------------------------------------ changing it

const BOARD = new Set(["new", "gone", "mini", "set", "show", "add", "edit", "drop", "tick", "climb", "die", "move", "book"]);
// The changes a player can make: the crew's side of the faction turn.
export const crewOp = (op) => ["t-act", "t-unact"].includes(op?.o) ? (op.a?.by ?? op.by) === "crew" : ["t-hire", "t-unhire", "t-tie"].includes(op?.o) || (op?.o === "t-roll" && op.by === "crew");
// The ones that spend one of the crew's extra resources.
export const spendOp = (op) => (op?.o === "t-hire" && op.h?.by === "crew") || (op?.o === "t-tie" && op.v === true);

// One change to the world. who: { role }, and ctx: { now, extra, power }, the
// crew's extra resources and its Power in steps off the party sheet, when
// they're known. It says whether it went in, whether anything changed, and why
// when it didn't.
export function applyAll(doc, op, who, ctx = {}) {
  if (!op || typeof op !== "object") return no("That didn’t make sense.");
  const gm = who?.role === "gm";
  if (BOARD.has(op.o)) {
    if (!gm) return no("Only the GM changes the board.");
    const changed = applyBoard(doc, op);
    // A faction off the board takes its action and its hires with it.
    if (changed && op.o === "gone" && doc.turn) {
      doc.turn.acts = doc.turn.acts.filter((a) => a.by !== op.id);
      doc.turn.hires = doc.turn.hires.filter((h) => h.by !== op.id && h.to !== op.id);
    }
    return changed ? yes() : no("");
  }
  if (!String(op.o ?? "").startsWith("t-")) return no("That didn’t make sense.");
  const was = JSON.stringify(doc.turn);
  const r = turnApply(doc, op, who, ctx);
  return r.ok ? yes(JSON.stringify(doc.turn) !== was) : r;
}

function turnApply(doc, op, who, ctx) {
  const gm = who?.role === "gm";
  const gmOnly = () => no("Only the GM can do that.");
  if (op.o === "t-start") {
    if (!gm) return gmOnly();
    if (!isId(op.id)) return no("That didn’t make sense.");
    if (doc.turn?.id === op.id) return yes(false);
    if (doc.turn && doc.turn.step !== "done") return no("This downtime’s faction turn is still going. Finish it first.");
    doc.turn = { id: op.id, n: (doc.turn?.n ?? 0) + 1, step: "hire", at: Number(ctx.now) || 0, hires: [], acts: [], def: {} };
    return yes();
  }
  if (op.o === "t-set") {
    if (!gm) return gmOnly();
    doc.turn = op.turn == null ? null : turnOf(op.turn, doc);
    return yes();
  }
  const t = doc.turn;
  if (!t || t.id !== op.id) return no("That was for a faction turn that’s over now.");
  switch (op.o) {
    case "t-step": {
      if (!gm) return gmOnly();
      if (!STEPS.includes(op.v)) return no("That didn’t make sense.");
      t.step = op.v;
      return yes();
    }
    case "t-act": {
      const crew = op.a?.by === "crew";
      if (!crew && !gm) return gmOnly();
      if (t.step === "done") return no("That downtime’s over.");
      if (crew && t.step === "land" && !gm) return no("The actions are landing, so the crew’s action stays as it is.");
      const a = crew ? crewActOf(op.a, doc) : factionActOf(op.a, doc);
      if (!a) return no(crew ? "That wasn’t a move the crew can make here." : "That action didn’t make sense for that faction.");
      // The crew's Power is the party sheet's, when it's known here.
      if (crew && Number.isInteger(ctx.power) && ctx.power > 0) a.power = Math.min(MAX.steps, ctx.power);
      // A player only goes at factions the crew knows about: the ones it's
      // been shown, and the ones in the telegraphs.
      if (crew && !gm && a.to && !knownTo(doc, a.to)) return no("The crew doesn’t know about that faction yet.");
      if (crew && a.vs === "act" && !t.acts.some((x) => x.by === a.to && x.shown && (gm || t.step !== "hire"))) return no("The crew can only Obstruct an action that’s been telegraphed.");
      if (!crew && actorsOf(doc).every((f) => f.id !== a.by)) return no("A mini faction doesn’t act in the downtime it’s made.");
      if (tooBig(doc, a)) return no(`${find(doc, a.to).name} is bigger than the crew, so going at its Power takes a personal slot in as well.`);
      const had = t.acts.find((x) => x.by === a.by);
      // Its dice as they were, if it's the same action rolled again. A new
      // action starts unrolled.
      const keep = had && same(had, a) ? { r: had.r, vr: had.vr, again: had.again, real: had.real, tie: had.tie, put: had.put } : {};
      const next = withRolls(a, keep);
      if (had) t.acts[t.acts.indexOf(had)] = next;
      else if (t.acts.length >= MAX.acts) return no("That’s as many actions as a turn holds.");
      else t.acts.push(next);
      return yes();
    }
    case "t-unact": {
      const crew = op.by === "crew";
      if (!crew && !gm) return gmOnly();
      if (crew && t.step === "land" && !gm) return no("The actions are landing, so the crew’s action stays as it is.");
      t.acts = t.acts.filter((a) => a.by !== op.by);
      return yes();
    }
    case "t-hire": {
      if (op.h?.by && op.h.by === op.h.to) return no("A faction can’t pay itself for its own action.");
      const h = hireOf(op.h);
      if (!h) return no("That hire didn’t make sense.");
      if (h.by !== "crew" && !gm) return gmOnly();
      if (t.step !== "hire") return no("Hiring comes first, before the telegraphs go out. Once they’re on the table, nobody can buy one off.");
      if (t.hires.some((x) => x.id === h.id)) return yes(false);
      const to = find(doc, h.to);
      if (!to) return no("That faction isn’t on the board.");
      if (h.by === "crew" && !gm && !knownTo(doc, h.to)) return no("The crew doesn’t know about that faction yet.");
      if (t.hires.some((x) => x.to === h.to)) return no(`${to.name} has already been paid for its action this downtime.`);
      if (h.by === "crew") {
        if (towardOf(to, "crew") === "hostile") return no(`${to.name} won’t take the crew’s money. It’s hostile to you.`);
        if (ctx.extra != null && spentOf(t) >= ctx.extra) return no(ctx.extra ? "That’s all the crew’s extra resources spent this downtime." : "The crew hasn’t got an extra resource to pay with.");
      } else {
        const payer = find(doc, h.by);
        if (!payer) return no("Whoever’s paying isn’t on the board.");
        if (towardOf(to, payer.id) === "hostile") return no(`${to.name} won’t take ${payer.name}’s money. It’s hostile to it.`);
        if (t.hires.filter((x) => x.by === payer.id).length >= moneyOf(payer).extra) return no(`${payer.name} hasn’t got an extra resource left to pay with.`);
      }
      if (t.hires.length >= MAX.hires) return no("That’s as many hires as a turn holds.");
      t.hires.push(h);
      return yes();
    }
    case "t-unhire": {
      const h = t.hires.find((x) => x.id === op.hid);
      if (!h) return yes(false);
      if (h.by !== "crew" && !gm) return gmOnly();
      if (t.step !== "hire" && !gm) return no("The telegraphs are out, so that hire stands.");
      t.hires = t.hires.filter((x) => x !== h);
      return yes();
    }
    case "t-roll": {
      const crew = op.by === "crew";
      if (!crew && !gm) return gmOnly();
      if (t.step !== "land") return no("The dice roll once the actions land.");
      const a = t.acts.find((x) => x.by === op.by);
      if (!a) return no("That action’s not on the table.");
      const parts = partsFor(doc, a);
      const r = op.r == null ? null : partsOf(op.r, parts.length);
      if (op.r != null && (!r || r.length !== parts.length || r.some((dice, i) => dice.map((x) => x.d).join() !== parts[i].dice.join()))) return no("Those dice weren’t the ones it rolls.");
      const vs = againstOf(doc, a);
      // Rolling again is the crew's own dice only, paid with 1 Resolve.
      if (op.again === true) {
        if (!crew) return no("A faction never rolls again.");
        if (!a.r || !r) return no("Roll it first.");
        a.r = r;
        a.again += 1;
        a.tie = [false, false];
        return yes();
      }
      // A roll stands. The GM can put one straight if it went in wrong, or
      // take it back. A roll that doesn't send its own dice is only rolling
      // what it's against.
      if (op.r !== undefined) {
        if (a.r && !gm) return no("Those dice are rolled already.");
        if (op.r === null && !gm) return no("Only the GM can take a roll back.");
        a.r = r;
      }
      if (op.real === true) a.real = true;
      if (op.vr != null) {
        const vr = diceOf(op.vr);
        if (vs.kind !== "roll" || !vr || vr.map((x) => x.d).join() !== vs.dice.join()) return no("Those dice weren’t what it’s against.");
        if (!a.vr || gm) a.vr = vr;
      }
      if (op.def != null) {
        const f = find(doc, op.def.f);
        const dr = diceOf(op.def.r);
        if (!f || !dr || dr.map((x) => x.d).join() !== stepsToDice(stepsOf(f)).join()) return no("That wasn’t its Power.");
        if (!t.def[f.id] || gm) t.def[f.id] = dr;
      }
      // An Obstruct rolls against the action's dice, so they're rolled with
      // it if nobody's rolled them yet. They stand for that action from then on.
      if (op.at != null && vs.kind === "act" && vs.act) {
        const b = vs.act;
        const bp = partsFor(doc, b);
        const br = partsOf(op.at, bp.length);
        if (!br || br.length !== bp.length || br.some((dice, i) => dice.map((x) => x.d).join() !== bp[i].dice.join())) return no("Those dice weren’t that action’s.");
        if (!b.r || gm) b.r = br;
      }
      return yes();
    }
    case "t-tie": {
      if (t.step !== "land") return no("Ties are taken once the actions land.");
      const a = t.acts.find((x) => x.by === "crew");
      const p = whole(op.p, 0, 1, null);
      if (!a || p == null) return no("That didn’t make sense.");
      if (op.v === true && !a.tie[p]) {
        const res = resultsOf(doc).get("crew")?.parts[p];
        if (res?.st !== "tie") return no("That’s not a tie.");
        if (ctx.extra != null && spentOf(t) >= ctx.extra) return no("The crew hasn’t got an extra resource left to take the tie with.");
      }
      a.tie[p] = op.v === true;
      return yes();
    }
    case "t-put": {
      if (!gm) return gmOnly();
      const a = t.acts.find((x) => x.by === op.by);
      const p = whole(op.p, 0, 1, null);
      if (!a || p == null) return no("That didn’t make sense.");
      a.put[p] = op.v === true;
      return yes();
    }
  }
  return no("That didn’t make sense.");
}

// Whether two versions of an act roll the same dice against the same thing,
// so its roll can stand.
function same(a, b) {
  const k = (x) => JSON.stringify([x.what, x.out, x.to, x.ag, x.vs, x.split, x.left, x.fits, x.there, x.vsteps, x.power, x.own, x.who, x.fit, x.slot]);
  return k(a) === k(b);
}

// Whether the crew knows about a faction: it's been shown it, or it's in a
// telegraph that's out.
export function knownTo(doc, id) {
  if (find(doc, id)?.shown.card) return true;
  const t = doc.turn;
  if (!t || t.step === "hire") return false;
  return t.acts.some((a) => a.by !== "crew" && a.shown && (a.by === id || a.to === id));
}

// What puts a change back, worked out from the world before it's made.
export function undoAll(doc, op) {
  if (BOARD.has(op?.o)) return undoBoard(doc, op);
  const t = doc.turn;
  const copy = (x) => JSON.parse(JSON.stringify(x));
  switch (op?.o) {
    case "t-start":
      return [{ o: "t-set", id: op.id, turn: t ? copy(t) : null }];
    case "t-step":
      return t ? [{ o: "t-step", id: t.id, v: t.step }] : [];
    case "t-act":
    case "t-unact": {
      const by = op.a?.by ?? op.by;
      const had = t?.acts.find((a) => a.by === by);
      return t ? [had ? { o: "t-act", id: t.id, a: copy(had) } : { o: "t-unact", id: t.id, by }] : [];
    }
    case "t-hire":
      return t && op.h?.id ? [{ o: "t-unhire", id: t.id, hid: op.h.id }] : [];
    case "t-unhire": {
      const h = t?.hires.find((x) => x.id === op.hid);
      return h ? [{ o: "t-hire", id: t.id, h: copy(h) }] : [];
    }
    case "t-tie": {
      const a = t?.acts.find((x) => x.by === "crew");
      return a ? [{ o: "t-tie", id: t.id, p: op.p, v: a.tie[op.p] === true }] : [];
    }
    case "t-put": {
      const a = t?.acts.find((x) => x.by === op.by);
      return a ? [{ o: "t-put", id: t.id, by: op.by, p: op.p, v: a.put[op.p] === true }] : [];
    }
    // A roll's put back by the GM, so it stands as rolled.
    default:
      return [];
  }
}

// ------------------------------------------------------------ what the crew sees

// The world as a player gets it: the board the crew's been shown, and of the
// faction turn, the crew's own side and, once they're out, the telegraphs
// she's sent, with the names in them. What she's paying factions to do, the
// actions she's keeping off-screen and how she counted any faction's dice
// never leave the Worker.
export function forPlayer(doc) {
  const board = boardForPlayer(doc);
  const t = doc.turn;
  if (!t) return { ...board, turn: null };
  const out = t.step !== "hire";
  const acts = t.acts.filter((a) => a.by === "crew" || (out && a.shown && find(doc, a.by)));
  const name = (id) => (id === "crew" ? "The crew" : find(doc, id)?.name ?? "");
  const shownActs = new Set(acts.map((a) => a.by));
  const results = resultsOf(doc);
  const def = {};
  const view = acts.map((a) => {
    const res = results.get(a.by);
    const vs = againstOf(doc, a);
    if (vs.kind === "power" && t.def[a.to]) def[a.to] = t.def[a.to];
    const ag = a.what === "agenda" || a.what === "back" ? agendaOf(doc, a) : null;
    const thing = a.thing ? find(doc, a.to)?.[a.thing.l].find((x) => x.id === a.thing.lid) : null;
    const v = {
      by: a.by, byName: name(a.by), what: a.what, out: a.out, to: a.to, toName: a.to ? name(a.to) : "",
      vs: a.vs, vsDice: vs.dice, vr: a.vr, thingText: thing?.text ?? "", agText: ag?.text ?? "", agDie: ag?.die ?? 0,
      parts: partsFor(doc, a).map((p) => ({ steps: p.steps, dice: p.dice })), split: a.split, p2: a.p2, p2text: a.p2text, words: a.words,
      shown: true, r: a.r, again: a.again, real: a.real, tie: a.tie, put: a.put,
      // An Obstruct's at an action the crew can see, or it says nothing of it.
      stops: a.vs === "act" && shownActs.has(a.to) ? a.to : null,
      // How it went, worked out on the whole turn, and who stopped it, if the
      // crew can see who.
      res: res ? { parts: res.parts, stopped: res.stopped && (res.stopped === "crew" || shownActs.has(res.stopped)) ? res.stopped : res.stopped ? "someone" : null } : null,
    };
    if (a.what === "new") Object.assign(v, { nt: a.nt, nd: a.nd });
    if (a.what === "comes") v.table = a.table;
    if (a.by === "crew") Object.assign(v, { ag: a.ag, thing: a.thing, vsteps: a.vsteps, power: a.power, own: a.own, who: a.who, fit: a.fit, slot: a.slot, slotBy: a.slotBy, about: a.about, text: a.text ?? "" });
    return v;
  });
  return {
    ...board,
    turn: { id: t.id, n: t.n, step: t.step, at: t.at, hires: t.hires.filter((h) => h.by === "crew").map((h) => ({ ...h, toName: name(h.to) })), acts: view, def, mine: true },
  };
}

// A turn as a player's phone keeps it, tidied: what forPlayer() sent.
export function playerTurnOf(raw) {
  if (!raw || typeof raw !== "object" || !isId(raw.id)) return null;
  return { ...raw, n: whole(raw.n, 1, 9999, 1), step: STEPS.includes(raw.step) ? raw.step : "hire", hires: Array.isArray(raw.hires) ? raw.hires : [], acts: Array.isArray(raw.acts) ? raw.acts : [], def: raw.def && typeof raw.def === "object" ? raw.def : {} };
}

// A player's phone keeps the world as forPlayer() sent it, and puts the crew's
// own changes on it at once, the way they'll come back from the Worker: so the
// crew's action and its roll show the moment they're made, with no signal too.
// What it can't know (what a faction's guarding a thing with), it leaves for
// the Worker to fill in.
export function applyMine(doc, op) {
  const t = doc.turn;
  if (!t || t.id !== op?.id || !crewOp(op)) return false;
  const was = JSON.stringify(t);
  const crew = t.acts.find((a) => a.by === "crew") ?? null;
  const name = (id) => doc.factions.find((f) => f.id === id)?.name ?? t.acts.find((a) => a.by === id)?.byName ?? t.acts.find((a) => a.to === id)?.toName ?? "";
  switch (op.o) {
    case "t-act": {
      if (t.step === "land" || t.step === "done") return false;
      const a = crewActOf(op.a, doc, { loose: true });
      if (!a) return false;
      const parts = partsFor(doc, a).map((p) => ({ steps: p.steps, dice: p.dice }));
      const at = a.vs === "act" ? t.acts.find((x) => x.by === a.to && x.by !== "crew") : null;
      const vsDice = at ? at.parts.flatMap((p) => p.dice) : crew && crew.to === a.to && crew.vs === a.vs ? crew.vsDice : [];
      const v = { ...a, byName: "The crew", toName: a.to ? name(a.to) : "", vsDice, parts, stops: at ? at.by : null, thingText: "", agText: "", agDie: 0, r: null, vr: null, again: 0, real: false, tie: [false, false], put: [false, false], res: null };
      if (crew) t.acts[t.acts.indexOf(crew)] = v;
      else t.acts.push(v);
      break;
    }
    case "t-unact":
      if (t.step === "land" || t.step === "done") return false;
      t.acts = t.acts.filter((a) => a.by !== "crew");
      break;
    case "t-hire": {
      const h = hireOf(op.h);
      if (!h || h.by !== "crew" || t.step !== "hire" || t.hires.some((x) => x.id === h.id || x.to === h.to)) return false;
      t.hires.push({ ...h, toName: name(h.to) });
      break;
    }
    case "t-unhire":
      if (t.step !== "hire") return false;
      t.hires = t.hires.filter((h) => h.id !== op.hid);
      break;
    case "t-tie": {
      const p = whole(op.p, 0, 1, null);
      if (!crew || p == null || t.step !== "land") return false;
      crew.tie = [...crew.tie];
      crew.tie[p] = op.v === true;
      crew.res = null;
      break;
    }
    case "t-roll": {
      if (!crew || t.step !== "land") return false;
      const r = op.r == null ? null : partsOf(op.r, crew.parts.length);
      if (op.r != null && !r) return false;
      if (op.again === true) {
        if (!r) return false;
        crew.r = r;
        crew.again = (crew.again ?? 0) + 1;
        crew.tie = [false, false];
      } else if (r && !crew.r) crew.r = r;
      if (op.real === true) crew.real = true;
      if (op.vr != null && !crew.vr) crew.vr = diceOf(op.vr);
      if (op.def != null && !t.def[op.def.f]) t.def = { ...t.def, [op.def.f]: diceOf(op.def.r) };
      const at = crew.vs === "act" ? t.acts.find((x) => x.by === crew.stops) : null;
      if (op.at != null && at && !at.r) at.r = partsOf(op.at, at.parts.length);
      // Worked out again here till the Worker's answer comes back.
      crew.res = null;
      if (at) at.res = null;
      break;
    }
    default:
      return false;
  }
  return JSON.stringify(t) !== was;
}

// A faction made in this downtime's turn sits it out.
export function bornNow(doc) {
  return doc.turn && doc.turn.step !== "done" ? doc.turn.n : 0;
}
export { factionOf };
