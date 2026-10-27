// The faction turn (stage 2 of notes/worlds-plan.md): one downtime's, kept on
// the live table beside the rounds (src/worker/table.js), so every change
// reaches every phone in the campaign as it happens. The Table object applies
// each change with applyTurn(), and the phone uses the same rules to show its
// own changes before they've gone up.
//
// It runs the way The Faction Turn does (20-factions.md), a step at a time:
//   hire  the crew says who it's paying with an extra resource, and the GM
//         who the factions are paying
//   tele  she picks every faction's action, then telegraphs them all at once
//   crew  the crew takes its action, and a player can put a personal slot in
//   land  Obstructs first, then the rest roll and land, and she changes the
//         cards (world.js keeps the board, party.js the party sheet)
// Ending it keeps what changed, for the crew to look back on.
//
//   turn  { id, n, at, step, sent, hires, acts, crew, power, pressure, said }
//     sent      when she telegraphed (0 till then)
//     power     each faction's Power, rolled once a downtime: { <faction>: { d, v } }
//     pressure  the action that's the faction pressure
//     said      what changed, a line each: { id, text, at }
//   a hire  { id, by ("crew" or the faction paying), byName, to, toName, job }
//   an act  { id, f, name, mini, what, at, does, job, steps, split, main, vs,
//             roll, off, comes, faces, vsFaces, real, stop, won, done }
//     what    one of the six outcomes, "agenda" (it works its agenda), "write"
//             (it writes a new one) or "comes" (it comes for the crew)
//     at      what it's after: { f, name, l, lid, act, part, d } (a faction or
//             "crew", in words, a line on its card, the action an Obstruct
//             stops, which part of a faction the crew's going at, and the die
//             a new agenda starts at)
//     steps   its Power plus the bond threads that fit, and split { s, for, d }:
//             one die of s steps (a d of d) with its own intent. main is the
//             rest, as dice.
//     vs      what it rolls against: { k, f, d }, k being "power" (a faction's,
//             rolled once a downtime), "die" (an agenda, a stake, someone),
//             "act" (an Obstruct's: that action's dice) or "none"
//     roll    false when it happens unless someone stops it (a new agenda,
//             Establishing with nobody in the way, coming for the crew)
//     off     it moves off-screen: never telegraphed and never rolled
//     comes   { t, n, text }: the d12 she rolled as she telegraphed it
//     faces   { main, split }: what its dice came up, rolled once, for an
//             Obstruct against it and for its landing alike
//     stop    { by, won }: an Obstruct against it, once that's rolled
//     won     { main, split } once it's landed, and done, its line once
//             she's made its changes on the cards ("" when it's nobody's news)
//   the crew's action  { id, move, at, does, how, who, steps, fits, split,
//             slot, vs, faces, vsFaces, real, by, again, tie, won, done }
//     move    one of the crew's moves on a faction, or "Goal", "Project" or
//             "Else" (anything else the crew's action can be)
//     how     "crew" (its Power and what fits) or "own" (who's permissions)
//     slot    the personal slot put in with it, so everything counts twice
//     vs      as an act's, with set: whether it's known yet. The GM says what
//             it's up against, unless it's a telegraphed action's dice or a
//             die on the party sheet.
//     again   who spent 1 Resolve to roll it again, and tie, which intents an
//             extra resource bought the tie for
import { stepsToDice } from "./dice.js";

export const STEPS = ["hire", "tele", "crew", "land"];
export const OUTCOMES = ["Destroy", "Undermine", "Obstruct", "Influence", "Acquire", "Establish"];
export const WHATS = [...OUTCOMES, "agenda", "write", "comes"];
// The crew's moves on a faction, then the rest of what its action can be.
export const MOVES = [...OUTCOMES, "Set back", "Work for it", "Goal", "Project", "Else"];
export const PARTS = ["power", "thing", "face", "agenda", "act", "goal", "project"];
export const MAX = { name: 60, line: 160, at: 120, comes: 240, acts: 60, hires: 12, said: 80, fits: 12, steps: 36 };
const SIZES = [2, 4, 6, 8, 10, 12];
const LISTS = ["res", "assets", "agendas", "pub", "mor", "loy", "threads"];
const KS = ["power", "die", "act", "none"];
const ID = /^[A-Za-z0-9_-]{6,32}$/;
const FID = /^[a-z0-9-]{2,24}$/;

export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const whole = (v, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};
const isFid = (v) => FID.test(String(v ?? ""));
const sizes = (v, most = 6) => (Array.isArray(v) && v.length <= most && v.every((x) => SIZES.includes(Number(x))) ? v.map(Number) : null);
export const best = (xs) => Math.max(0, ...xs.filter((x) => Number.isFinite(x)));
const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

const yes = () => ({ ok: true });
const no = (why) => ({ ok: false, why });
const gmOnly = () => no("Only the GM can do that.");
const none = () => no("There’s no faction turn on. It might have ended.");
const notIn = () => no("You need someone playing in the campaign for that.");

// ------------------------------------------------------------ dice

// The dice an action rolls: its steps as the table's dice, less the one die
// it split off, which has an intent of its own.
export function diceOf(steps, split) {
  const s = split ? split.s : 0;
  return { main: stepsToDice(steps - s), split: s ? s * 2 : null };
}
// An act's dice, with the split die's size kept in its split.
function dicedOf(steps, split) {
  const dice = diceOf(steps, split);
  return { main: dice.main, split: split ? { ...split, d: dice.split } : null };
}
// The crew's: two slots on one move count everything twice.
export const crewSteps = (c) => (c ? c.steps * (c.slot ? 2 : 1) : 0);
export const crewDice = (c) => diceOf(crewSteps(c), c?.split && c.split.s < crewSteps(c) ? c.split : null);
// An action's dice as { main, split }, split being the split die's size.
export const shapeOf = (x) => ({ main: x.main, split: x.split == null ? null : typeof x.split === "object" ? x.split.d : x.split });
// Every die an action rolls, the split one last.
export const allDice = (x) => {
  const s = shapeOf(x);
  return [...s.main, ...(s.split ? [s.split] : [])];
};
export const allFaces = (f) => (f ? [...f.main, ...(f.split != null ? [f.split] : [])] : []);

// Faces that fit the dice: each a whole number from 1 to its size.
function facesFor(dice, f) {
  if (!f || typeof f !== "object" || !Array.isArray(f.main) || f.main.length !== dice.main.length) return null;
  const main = f.main.map((v, i) => whole(v, 1, dice.main[i]));
  if (main.some((v) => v == null)) return null;
  if (dice.split == null) return { main, split: null };
  const split = whole(f.split, 1, dice.split);
  return split == null ? null : { main, split };
}
const rollFor = (d, v) => (Array.isArray(v) && v.length === d.length && v.every((x, i) => whole(x, 1, d[i]) != null) ? v.map(Number) : null);

// Beat it and you did it, and ties go to whoever's defending. Several dice on
// one intent are advantage, so the best counts. Only the crew can buy a tie.
export function judge(faces, def, tie = {}) {
  const m = best(faces.main);
  return { main: m > def || (tie.main === true && m === def), split: faces.split == null ? null : faces.split > def || (tie.split === true && faces.split === def) };
}

// ------------------------------------------------------------ tidying what comes in

function atOf(x) {
  const a = x && typeof x === "object" ? x : {};
  return {
    f: a.f === "crew" || isFid(a.f) ? a.f : null,
    name: line(a.name, MAX.at),
    l: LISTS.includes(a.l) ? a.l : null,
    lid: isFid(a.lid) ? a.lid : null,
    act: ID.test(String(a.act ?? "")) ? String(a.act) : null,
    part: PARTS.includes(a.part) ? a.part : null,
    // The die a new agenda starts at.
    d: SIZES.includes(Number(a.d)) ? Number(a.d) : null,
  };
}
function splitOf(x, steps) {
  if (!x || typeof x !== "object") return null;
  const s = whole(x.s, 1, 6);
  const why = line(x.for, MAX.at);
  return s != null && s < steps && why ? { s, for: why } : null;
}
function hireFrom(x) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const by = x.by === "crew" || isFid(x.by) ? x.by : null;
  const job = line(x.job, MAX.line);
  if (!by || !isFid(x.to) || by === x.to || !job) return null;
  return { id: String(x.id), by, byName: by === "crew" ? "The crew" : line(x.byName, MAX.name) || "A faction", to: x.to, toName: line(x.toName, MAX.name) || "A faction", job };
}

// The dice an action rolls against, worked out where they're known.
function vsOf(x, t, self) {
  const v = x && typeof x === "object" ? x : {};
  const k = KS.includes(v.k) ? v.k : "none";
  if (k === "none") return { k, f: null, d: [], set: true };
  if (k === "act") {
    const target = t.acts.find((a) => a.id === v.act && a.id !== self && !a.off);
    return target ? { k, f: target.f, act: target.id, d: allDice(target), set: true } : null;
  }
  const d = sizes(v.d, 4);
  const f = isFid(v.f) ? v.f : null;
  if (k === "power" && !f) return null;
  return { k, f, d: d ?? [], set: Boolean(d && d.length) };
}

function actFrom(x, t) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? "")) || !isFid(x.f)) return null;
  const name = line(x.name, MAX.name);
  const what = WHATS.includes(x.what) ? x.what : null;
  const steps = whole(x.steps, 1, MAX.steps);
  const does = line(x.does, MAX.line);
  if (!name || !what || steps == null || !does) return null;
  const split = splitOf(x.split, steps);
  const off = x.off === true;
  const at = atOf(x.at);
  const vs = what === "Obstruct" ? vsOf({ k: "act", act: at.act }, t, x.id) : vsOf(x.vs, t, x.id);
  if (!vs || (!off && vs.k !== "none" && !vs.d.length)) return null;
  const hire = t.hires.find((h) => h.id === x.job && h.to === x.f);
  const c = x.comes && typeof x.comes === "object" ? x.comes : null;
  const comes = what === "comes" && c ? { t: c.t === "bond" ? "bond" : "hostile", n: whole(c.n, 1, 12), text: line(c.text, MAX.comes) } : null;
  if (what === "comes" && (!comes || comes.n == null || !comes.text)) return null;
  return {
    id: String(x.id), f: x.f, name, mini: x.mini === true, what, at, does, job: hire ? hire.id : null,
    steps, ...dicedOf(steps, split), vs,
    // Coming for the crew, writing a new agenda and Establishing with nobody
    // in the way happen unless someone stops them.
    roll: !off && vs.k !== "none" && what !== "comes" && what !== "write",
    off, comes,
    faces: null, vsFaces: null, real: false, stop: null, won: null, done: null,
  };
}

function crewFrom(x, t, who, roster) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const move = MOVES.includes(x.move) ? x.move : null;
  const steps = whole(x.steps, 1, MAX.steps);
  const does = line(x.does, MAX.line);
  if (!move || steps == null || !does) return null;
  const at = atOf(x.at);
  // Whose permissions, when one of the crew's plainly the right person for it.
  let own = null;
  if (x.how === "own") {
    const m = (roster ?? []).find((p) => p.user === x.who?.user && p.ch === x.who?.ch) ?? (who?.ch && x.who?.user === who.user && x.who?.ch === who.ch ? { user: who.user, ch: who.ch, cname: who.cname } : null);
    if (!m) return null;
    own = { user: m.user, ch: m.ch, name: line(m.cname, MAX.name) || "Someone" };
  }
  const gm = who?.role === "gm";
  let vs;
  if (move === "Obstruct") vs = vsOf({ k: "act", act: at.act }, t, null);
  else if (move === "Work for it" || move === "Else") vs = { k: "none", f: null, d: [], set: true };
  else {
    vs = vsOf(x.vs, t, null);
    // The Goal's and a project's die are on the party sheet, so anyone can
    // say them. Anything else she says, since it might be on the card of
    // something the crew hasn't been shown.
    if (vs && vs.k !== "none" && !gm && move !== "Goal" && move !== "Project") vs = { ...vs, d: [], set: false };
    if (vs && vs.k === "none" && !gm && move !== "Establish") vs = null;
    // A Power that's been rolled this downtime stands, so that's known.
    const kept = vs?.k === "power" ? t.power[vs.f] : null;
    if (kept) vs = { ...vs, d: [...kept.d], set: true };
  }
  if (!vs) return null;
  const fits = (Array.isArray(x.fits) ? x.fits : []).map((f) => line(f, MAX.name)).filter(Boolean).slice(0, MAX.fits);
  return {
    id: String(x.id), move, at, does, how: own ? "own" : "crew", who: own, steps, fits,
    // Whether there's room to split it is worked out with the slot, which can
    // go in after (crewDice()).
    split: splitOf(x.split, MAX.steps * 2),
    slot: null, vs, faces: null, vsFaces: null, real: false, by: null, again: [], tie: { main: false, split: false }, won: null, done: null,
  };
}

// ------------------------------------------------------------ where it's got to

export const rolled = (x) => x?.won != null;
export const landed = (a) => rolled(a) || a?.stop?.won === true;
// An action's state: planned (not telegraphed yet), coming, stopped, won,
// lost (it landed and missed), or done.
export function stateOfAct(a, t) {
  if (a.done != null) return "done";
  if (a.stop?.won) return "stopped";
  if (a.won) return a.won.main ? "won" : "lost";
  return t?.sent && !a.off ? "coming" : "planned";
}
// What an action's dice are going at came up, once it has.
export function defOf(t, x) {
  if (!x?.vs) return null;
  if (x.vs.k === "power") {
    const p = t.power?.[x.vs.f];
    return p ? best(p.v) : null;
  }
  if (x.vs.k === "act") {
    const target = t.acts.find((a) => a.id === x.vs.act);
    return target?.faces ? best(allFaces(target.faces)) : null;
  }
  if (x.vs.k === "die") return x.vsFaces ? best(x.vsFaces) : null;
  return null;
}
// The extra resources the crew's spent this downtime: a faction paid, and a tie.
export const spentOf = (t) => (t ? t.hires.filter((h) => h.by === "crew").length + (t.crew ? Number(t.crew.tie.main) + Number(t.crew.tie.split) : 0) : 0);
// Who's going at what: an Obstruct against an action has to be settled first.
const stoppers = (t, a) => [...t.acts.filter((x) => x.what === "Obstruct" && !x.off && x.vs.act === a.id), ...(t.crew?.move === "Obstruct" && t.crew.vs.act === a.id ? [t.crew] : [])];

// ------------------------------------------------------------ the changes

// Set the defender's roll on what's going at it, the first time anything goes
// at it this downtime. A faction's Power, once rolled, stands all downtime.
function defend(t, x, op) {
  const vs = x.vs;
  if (vs.k === "none") return { def: null };
  if (vs.k === "act") {
    const target = t.acts.find((a) => a.id === vs.act);
    if (!target) return { why: "That action’s gone." };
    if (rolled(target)) return { why: `${target.name}’s action has landed already.` };
    if (!target.faces) {
      const f = facesFor(shapeOf(target), op.tFaces);
      if (!f) return { why: `That roll for ${target.name}’s dice didn’t make sense.` };
      target.faces = f;
      target.real = op.real === true;
    }
    return { def: best(allFaces(target.faces)), target };
  }
  if (vs.k === "power") {
    const kept = t.power[vs.f];
    if (kept) return { def: best(kept.v) };
    const v = rollFor(vs.d, op.vsFaces);
    if (!v) return { why: "That roll for its Power didn’t make sense." };
    t.power[vs.f] = { d: [...vs.d], v };
    return { def: best(v) };
  }
  const v = rollFor(vs.d, op.vsFaces);
  if (!v) return { why: "That roll for what it’s up against didn’t make sense." };
  x.vsFaces = v;
  return { def: best(v) };
}

// One change to the faction turn, from the GM or a player (who: { user, role,
// ch, cname }, roster: everyone playing someone in the campaign). It changes
// doc, and says why when it can't.
export function applyTurn(doc, op, who, roster, now) {
  const gm = who?.role === "gm";
  // A player's phone may not have the whole roster, so who's sending stands in
  // for it there. On the server, who only has a character when D1 says so.
  const me = gm ? null : (roster ?? []).find((m) => m.user === who?.user && m.ch && m.ch === who?.ch) ?? (who?.ch ? { user: who.user, ch: who.ch, cname: who.cname } : null);
  const t = doc.turn ?? null;
  const act = (id) => t?.acts.find((a) => a.id === id) ?? null;
  switch (op?.o) {
    case "ft-start": {
      if (!gm) return gmOnly();
      if (!ID.test(String(op.id ?? ""))) return no("That downtime didn’t make sense.");
      if (t) return t.id === op.id ? yes() : no("There’s a downtime on already.");
      doc.turn = { id: String(op.id), n: (Number(doc.last?.n) || 0) + 1, at: now, step: "hire", sent: 0, hires: [], acts: [], crew: null, power: {}, pressure: null, said: [] };
      return yes();
    }
    case "ft-hire": {
      if (!t) return none();
      if (t.sent) return no("The telegraphs have gone out, so the hiring’s done for this downtime.");
      const h = hireFrom(op.h);
      if (!h) return no("That didn’t look like someone being paid.");
      if (h.by !== "crew" && !gm) return gmOnly();
      if (!gm && !me) return notIn();
      if (t.hires.some((x) => x.id === h.id)) return yes();
      if (t.hires.length >= MAX.hires) return no("That’s as much hiring as one downtime holds.");
      if (t.hires.some((x) => x.to === h.to)) return no(`${h.toName}’s been paid already. It’s only got the one action.`);
      t.hires.push(h);
      return yes();
    }
    case "ft-unhire": {
      if (!t) return none();
      const h = t.hires.find((x) => x.id === op.id);
      if (!h) return yes();
      if (h.by !== "crew" && !gm) return gmOnly();
      if (!gm && !me) return notIn();
      if (t.sent) return no("The telegraphs have gone out, so the hiring’s done for this downtime.");
      t.hires = t.hires.filter((x) => x !== h);
      for (const a of t.acts) if (a.job === h.id) a.job = null;
      return yes();
    }
    case "ft-act": {
      if (!gm) return gmOnly();
      if (!t) return none();
      const a = actFrom(op.a, t);
      if (!a) return no("That action didn’t make sense.");
      const old = act(a.id);
      if (old && (old.faces || landed(old) || old.done != null)) return no(`${old.name}’s action has been rolled, so it stays as it was.`);
      if (t.acts.some((x) => x.f === a.f && x.id !== a.id)) return no(`${a.name}’s got its action already. Nothing buys a faction a second one.`);
      if (!old && t.acts.length >= MAX.acts) return no("That’s as many actions as one downtime holds.");
      if (a.what === "Obstruct" && a.vs.act && act(a.vs.act)?.f === a.f) return no("A faction can’t stop its own action.");
      if (old) t.acts[t.acts.indexOf(old)] = a;
      else t.acts.push(a);
      if (a.off && t.pressure === a.id) t.pressure = null;
      return yes();
    }
    case "ft-drop": {
      if (!gm) return gmOnly();
      const a = act(op.id);
      if (!a) return yes();
      if (a.faces || landed(a) || a.done != null) return no(`${a.name}’s action has been rolled, so it stays.`);
      const by = stoppers(t, a)[0];
      if (by) return no(`${by.name ?? "The crew"}’s trying to stop it. Change that first.`);
      t.acts = t.acts.filter((x) => x !== a);
      if (t.pressure === a.id) t.pressure = null;
      return yes();
    }
    case "ft-pressure": {
      if (!gm) return gmOnly();
      if (!t) return none();
      if (op.id == null) t.pressure = null;
      else {
        const a = act(op.id);
        if (!a || a.off) return no("The faction pressure has to be one the crew can see coming.");
        t.pressure = a.id;
      }
      return yes();
    }
    case "ft-send": {
      if (!gm) return gmOnly();
      if (!t) return none();
      if (t.sent) return yes();
      t.sent = now;
      t.step = "crew";
      return yes();
    }
    case "ft-step": {
      if (!gm) return gmOnly();
      if (!t) return none();
      if (!STEPS.includes(op.step)) return no("That step didn’t make sense.");
      if (!t.sent && (op.step === "crew" || op.step === "land")) return no("Telegraph the factions’ actions first.");
      if (t.sent && op.step === "hire") return no("The telegraphs have gone out, so the hiring’s done for this downtime.");
      t.step = op.step;
      return yes();
    }
    case "ft-crew": {
      if (!t) return none();
      if (!gm && !me) return notIn();
      if (!t.sent) return no("The crew’s action comes once the factions’ actions are telegraphed.");
      if (t.crew && (rolled(t.crew) || t.crew.done != null)) return no("The crew’s action has been rolled already.");
      if (op.c == null) {
        t.crew = null;
        return yes();
      }
      const c = crewFrom(op.c, t, who, roster);
      if (!c) return no("That didn’t look like the crew’s action.");
      // A slot that's in stays in, and so does the die she said, when it's
      // going at the same thing.
      c.slot = t.crew?.slot ?? null;
      const was = t.crew?.vs;
      if (was?.set && !c.vs.set && was.k === c.vs.k && was.f === c.vs.f && t.crew.at.part === c.at.part && t.crew.at.lid === c.at.lid) c.vs = { ...was };
      t.crew = c;
      return yes();
    }
    case "ft-slot": {
      if (!t?.crew) return no("There’s no crew action to put it in yet.");
      if (gm) return no("A personal slot’s a player’s to put in.");
      if (!me) return notIn();
      const c = t.crew;
      if (rolled(c)) return no("The crew’s action has been rolled already.");
      if (op.on === true) {
        if (c.slot && c.slot.user !== who.user) return no(`${c.slot.name}’s put a slot in already. Two slots count everything twice, and that’s as far as it goes.`);
        c.slot = { user: me.user, ch: me.ch, name: line(me.cname, MAX.name) || "Someone" };
      } else if (c.slot?.user === who.user) c.slot = null;
      return yes();
    }
    case "ft-vs": {
      if (!gm) return gmOnly();
      const c = t?.crew;
      if (!c) return no("There’s no crew action yet.");
      if (rolled(c)) return no("The crew’s action has been rolled already.");
      if (c.vs.k === "act" || c.vs.k === "none") return no("Nothing to say there. It’s worked out already.");
      const d = sizes(op.d, 4);
      if (!d || !d.length) return no("Pick what it’s up against.");
      const k = op.k === "power" || op.k === "die" ? op.k : c.vs.k;
      c.vs = { ...c.vs, k, d, set: true };
      return yes();
    }
    case "ft-croll": {
      const c = t?.crew;
      if (!c) return no("There’s no crew action to roll.");
      if (!gm && !me) return notIn();
      if (rolled(c)) return yes();
      if (!c.vs.set) return no("The GM’s still to say what it’s up against.");
      const dice = crewDice(c);
      const faces = facesFor(dice, op.faces);
      if (c.vs.k === "none") {
        c.won = { main: true, split: dice.split ? true : null };
        c.by = { user: who.user, name: gm ? "The GM" : line(who.cname, MAX.name) || "Someone" };
        return yes();
      }
      if (!faces) return no("That roll didn’t fit the crew’s dice.");
      const got = defend(t, c, op);
      if (got.why) return no(got.why);
      c.faces = faces;
      c.real = op.real === true;
      c.by = { user: who.user, name: gm ? "The GM" : line(who.cname, MAX.name) || "Someone" };
      c.won = judge(faces, got.def, c.tie);
      if (got.target) got.target.stop = { by: "crew", won: c.won.main };
      return yes();
    }
    case "ft-again": {
      const c = t?.crew;
      if (gm) return no("Resolve’s a player’s to spend.");
      if (!me) return notIn();
      if (!c || !c.faces || c.done != null) return no("There’s nothing of the crew’s to roll again.");
      const faces = facesFor(crewDice(c), op.faces);
      if (!faces) return no("That roll didn’t fit the crew’s dice.");
      if (c.again.length >= 6) return no("That’s a lot of Resolve. The roll stands.");
      c.faces = faces;
      c.again.push({ user: me.user, name: line(me.cname, MAX.name) || "Someone" });
      c.won = judge(faces, defOf(t, c), c.tie);
      if (c.vs.k === "act") {
        const target = act(c.vs.act);
        if (target && !rolled(target)) target.stop = { by: "crew", won: c.won.main };
      }
      return yes();
    }
    case "ft-tie": {
      const c = t?.crew;
      if (!gm && !me) return notIn();
      if (!c?.faces || c.done != null) return no("There’s no tie of the crew’s to take.");
      const which = op.which === "split" ? "split" : "main";
      const def = defOf(t, c);
      const face = which === "split" ? c.faces.split : best(c.faces.main);
      if (face !== def) return no("That one wasn’t a tie.");
      if (c.tie[which]) return yes();
      c.tie[which] = true;
      c.won = judge(c.faces, def, c.tie);
      if (c.vs.k === "act" && which === "main") {
        const target = act(c.vs.act);
        if (target && !rolled(target)) target.stop = { by: "crew", won: c.won.main };
      }
      return yes();
    }
    case "ft-land": {
      if (!gm) return gmOnly();
      const a = act(op.id);
      if (!a) return no("That action’s gone.");
      if (!t.sent) return no("Telegraph the factions’ actions first.");
      if (rolled(a)) return yes();
      if (a.stop?.won) return no(`${a.name}’s action was stopped, so it doesn’t land.`);
      // Obstructs go first: anything going at this one is settled before it lands.
      const first = stoppers(t, a).find((x) => !rolled(x));
      if (first) return no(first === t.crew ? "The crew’s trying to stop it, so the crew rolls first." : `${first.name}’s trying to stop it, so that goes first.`);
      if (a.off || !a.roll) {
        a.won = { main: true, split: a.split ? true : null };
        return yes();
      }
      if (!a.faces) {
        const f = facesFor(shapeOf(a), op.faces);
        if (!f) return no(`That roll didn’t fit ${a.name}’s dice.`);
        a.faces = f;
        a.real = op.real === true;
      }
      const got = defend(t, a, op);
      if (got.why) {
        if (!a.stop) a.faces = null;
        return no(got.why);
      }
      a.won = judge(a.faces, got.def);
      if (got.target) got.target.stop = { by: a.id, won: a.won.main };
      return yes();
    }
    case "ft-done": {
      if (!gm) return gmOnly();
      if (!t) return none();
      const x = op.id === "crew" ? t.crew : act(op.id);
      if (!x) return no("That action’s gone.");
      if (x.done != null) return yes();
      if (!landed(x) && !(op.id === "crew" && rolled(x))) return no("It hasn’t landed yet.");
      const text = line(op.line, MAX.line);
      x.done = text;
      if (text && t.said.length < MAX.said) t.said.push({ id: op.id === "crew" ? `crew-${t.id}`.slice(0, 32) : x.id, text, at: now });
      return yes();
    }
    case "ft-say": {
      if (!gm) return gmOnly();
      if (!t) return none();
      const text = line(op.line, MAX.line);
      if (!ID.test(String(op.id ?? "")) || !text) return no("Say what changed first.");
      if (t.said.some((x) => x.id === op.id)) return yes();
      if (t.said.length >= MAX.said) return no("That’s as much as one downtime holds.");
      t.said.push({ id: String(op.id), text, at: now });
      return yes();
    }
    case "ft-end": {
      if (!gm) return gmOnly();
      if (!t) return yes();
      if (t.said.length || t.acts.some((a) => a.done != null) || t.crew?.done != null) doc.last = { n: t.n, at: t.at, over: now, said: t.said };
      doc.turn = null;
      return yes();
    }
  }
  return no("That didn’t make sense.");
}

export const isTurnOp = (op) => typeof op?.o === "string" && op.o.startsWith("ft-");

// Someone's deleted their account: their name comes off the crew's action.
export function forgetTurn(doc, user) {
  const c = doc.turn?.crew;
  if (!c) return false;
  let changed = false;
  const gone = (x) => {
    if (x?.user !== user) return x;
    changed = true;
    return { ...x, user: "", ch: "", name: "Someone who’s left" };
  };
  c.slot = gone(c.slot);
  c.who = gone(c.who);
  c.by = gone(c.by);
  c.again = c.again.map(gone);
  return changed;
}

// ------------------------------------------------------------ what each phone gets

// The GM gets the lot. A player gets nothing of the factions' actions till
// she's telegraphed them, and never the ones that move off-screen, who paid a
// faction unless it was the crew, or what an action's up against till it's
// rolled, since a die can give away a Power the crew hasn't been shown.
export function turnView(doc, role) {
  const last = doc.last ? clone(doc.last) : null;
  const t = doc.turn;
  if (!t) return { turn: null, last };
  if (role === "gm") return { turn: clone(t), last };
  const shown = t.sent ? t.acts.filter((a) => !a.off) : [];
  const ours = new Set(t.hires.filter((h) => h.by === "crew").map((h) => h.id));
  const seen = new Set();
  const acts = shown.map((a) => {
    const out = clone(a);
    out.job = ours.has(a.job) ? a.job : null;
    if (!rolled(a) && a.vs.k !== "act") out.vs = { ...a.vs, d: [] };
    if (a.vs.k === "power" && rolled(a)) seen.add(a.vs.f);
    return out;
  });
  const crew = clone(t.crew);
  if (crew?.vs.k === "power" && (crew.vs.set || rolled(crew))) seen.add(crew.vs.f);
  return {
    turn: {
      id: t.id, n: t.n, at: t.at, step: t.step, sent: t.sent,
      hires: clone(t.hires.filter((h) => h.by === "crew")),
      acts, crew,
      power: Object.fromEntries(Object.entries(t.power).filter(([f]) => seen.has(f)).map(([f, p]) => [f, clone(p)])),
      pressure: shown.some((a) => a.id === t.pressure) ? t.pressure : null,
      said: clone(t.said),
    },
    last,
  };
}

// ------------------------------------------------------------ what's new

const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
// The crew's roll, in a line.
export function crewResult(c) {
  if (!c?.won) return "";
  if (c.vs.k === "none") return "it happens";
  const parts = [c.won.main ? "it worked" : "it didn’t work"];
  if (c.won.split != null) parts.push(`${c.split?.for ? `“${c.split.for}”` : "the split die"} ${c.won.split ? "worked too" : "didn’t"}`);
  return parts.join(", and ");
}

// What changed between the turn the phone had and the one it's got now, said
// for whoever's holding it: { lines, buzz }.
export function turnNews(was, now, { gm = false, me = null } = {}) {
  const lines = [];
  let buzz = false;
  const a = was?.turn ?? null;
  const b = now?.turn ?? null;
  if (!b) {
    if (a && !gm && now?.last && now.last.n === a.n) lines.push("Downtime’s over. What changed is on the World tab.");
    return { lines, buzz };
  }
  if (!a || a.id !== b.id) {
    if (!gm) lines.push("Downtime’s started. Every faction’s about to take its action.");
    if (!gm && b.sent) {
      lines.push(`The factions have moved: ${b.acts.length === 1 ? "one action’s" : `${b.acts.length} actions are`} telegraphed.`);
      buzz = true;
    }
    return { lines, buzz };
  }
  if (!gm && b.sent && !a.sent) {
    lines.push(b.acts.length ? `The factions have moved: ${b.acts.length === 1 ? "one action’s" : `${b.acts.length} actions are`} telegraphed.` : "The factions have moved, all of them off where the crew can’t see.");
    buzz = true;
  }
  const ca = a.crew;
  const cb = b.crew;
  if (cb && cb.id !== ca?.id && gm) lines.push(cb.vs.set ? `The crew’s going at ${cb.at.name || "something"}.` : `The crew’s going at ${cb.at.name || "something"}. Say what it’s up against.`);
  if (cb?.slot && !ca?.slot && cb.slot.user !== me) lines.push(`${cb.slot.name} put a personal slot into the crew’s action, so everything counts twice.`);
  if (cb && !gm && cb.vs.set && ca && !ca.vs.set && ca.id === cb.id) lines.push("The GM’s said what the crew’s up against. Roll it.");
  if (cb?.won && !ca?.won && cb.by?.user !== me) lines.push(`${cb.by?.name ?? "Someone"} rolled the crew’s action: ${crewResult(cb)}.`);
  if (cb?.again.length > (ca?.again.length ?? 0) && cb.again[cb.again.length - 1].user !== me) lines.push(`${cb.again[cb.again.length - 1].name} spent 1 Resolve to roll the crew’s action again: ${crewResult(cb)}.`);
  if (gm) {
    const paid = b.hires.filter((h) => h.by === "crew" && !a.hires.some((x) => x.id === h.id));
    if (paid.length) lines.push(`The crew’s paying ${andList(paid.map((h) => h.toName))}.`);
  }
  if (!gm) {
    const before = new Set(a.said.map((x) => x.id));
    for (const x of b.said) if (!before.has(x.id)) lines.push(x.text);
  }
  return { lines, buzz };
}
