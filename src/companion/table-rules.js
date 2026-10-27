// The live table: a campaign's rounds of telegraphs, and how each one went
// (stage 8 in notes/app-plan.md). The GM sends the round's telegraphs, each
// aimed at one of the crew, and the player answers it on their phone, or lets
// it land and rolls When it lands once the round's over. The table's Durable
// Object (src/worker/table.js) keeps it and applies every change with these
// rules, and the phone uses the same ones to show its own changes before
// they've gone up.
//
//   a round      { id, n, at, over, tele, acts, held, moved }   over is when it ended, or 0
//     acts       what each of the crew spent their actions on, by "user|ch":
//                { name, more, list }. Everyone's got one action a round, and
//                more holds where any extra ones came from (resolve, held,
//                hiding, fired, trait). An answer is an action too, kept on
//                its telegraph. Each act in list is { id, k, ref, act, steps, t }:
//                  join    their action put into whoever answers telegraph ref,
//                          with act and steps, the set action they put in
//                  work    a roll at a stake or an event (ref): roll { dice, opp,
//                          won, real }, aim (the tag it's going for, or slow or
//                          drive), and did, what it changed
//                  ground  using a piece of the ground (ref), with act
//                  else    something else: act says what (Defend, a set action)
//     held       a stake's or an event's die, rolled once a round: { ref: n }
//     moved      what the end of the round stepped down: [{ ref, from, to, out }]
//   a telegraph  { id, who, does, d, kind, one, at, sent, seen, ans, def, icp }
//     who and does  who's telegraphing and what it's doing, in the GM's words
//     d             how hard: its die
//     kind          "blow" (Defend stops it) or "fear" (fear, lies and
//                   pressure, against Confidence)
//     one           what happens if it lands, when it's only got one answer
//     at            { user, ch, name, player, arch }: the character it's
//                   aimed at, who plays them, and their crest
//     seen          when it reached the player's phone, or 0
//     ans           how someone answered it: { user, ch, name, act, steps,
//                   dice, opp, real, won, at, late }, or null
//     def           their When it lands, once it's landed: { stopped, mine,
//                   v, paid, real, at }, or null
//     icp           a friend who intercepted it, so it comes at them when it
//                   lands: { user, ch, name, free, at }. Fear can't be.
//   the scene    { ground, stakes, events }, face up on every phone
//     ground       { id, name, text }: something in the place to use
//     a stake      { id, name, c, tags, clock, out, note }: what the crew's
//                  after, a Challenge, a tag for each thing in the way
//                  ({ name, gone }), and a clock die, or 0. out: won or lost
//     an event     { id, name, what, d, scene, out }: running on its own die,
//                  and what happens when it steps past d2. scene: it's the
//                  scene clock. out: done
//
// The rules (05-conflict.md): one action a round each, and answering a
// telegraph spends it. Win the answer and it's stopped. Lose it and it lands
// at once, with no defence. Intercepting costs no action. Whatever nobody
// answered lands at the end of the round, and whoever it's aimed at (or
// whoever intercepted it) rolls When it lands. A stake's tags go a win at a
// time, and an event's slowed or driven by beating its die. At the end of the
// round, every clock and event nobody worked steps down a size, and past d2
// the stake's lost or the event happens.

import { applyTurn, forgetTurn, isTurnOp, turnView } from "./turn-rules.js";

export const SIZES = [2, 4, 6, 8, 10, 12];
export const MAX = { who: 60, does: 140, one: 140, name: 60, act: 60, paid: 80, tele: 24, rounds: 12, more: 4, list: 6, ground: 8, stakes: 6, events: 6, tags: 8, text: 140 };
// Where an extra action can come from (Extra actions, in Conflict).
export const MORE = ["resolve", "held", "hiding", "fired", "trait"];
export const ONCE = ["held", "hiding", "fired"];
const ID = /^[A-Za-z0-9_-]{6,32}$/;
// An archetype's name, as the crest draws it.
const ARCH = /^[A-Za-z][A-Za-z' -]{0,23}$/;

export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const num = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== "" ? Math.min(hi, Math.max(lo, n)) : null;
};
const first = (name) => line(name, MAX.name).split(" ")[0] || "";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// "The left Warden" in the middle of a sentence.
export const lower = (name) => String(name ?? "").replace(/^(A|An|The|His|Her|Their|Its) /, (m) => m.toLowerCase());

export const blankScene = () => ({ ground: [], stakes: [], events: [] });
// turn is the faction turn of the downtime that's on, and last what changed
// in the one before (turn-rules.js).
export const blank = () => ({ v: 0, fight: 1, rounds: [], scene: blankScene(), turn: null, last: null });
export const current = (doc) => doc?.rounds?.[doc.rounds.length - 1] ?? null;
// A table from before the scene and the round's actions gets them.
export function fresh(doc) {
  if (!doc.scene || typeof doc.scene !== "object") doc.scene = blankScene();
  for (const k of ["ground", "stakes", "events"]) if (!Array.isArray(doc.scene[k])) doc.scene[k] = [];
  for (const r of doc.rounds ?? []) {
    if (!r.acts || typeof r.acts !== "object") r.acts = {};
    if (!r.held || typeof r.held !== "object") r.held = {};
    if (!Array.isArray(r.moved)) r.moved = [];
  }
  return doc;
}
export const keyOf = (user, ch) => `${user}|${ch}`;
// Who a telegraph lands on: whoever intercepted it, or whoever it's aimed at.
export const landsOn = (t) => t.icp ?? t.at;
// A stake's die is twice its Challenge.
export const dieOf = (el) => (el?.c ? Math.min(12, 2 * el.c) : el?.d ?? 0);
export const sizeUp = (d) => Math.min(12, d + 2);
// Everything on the scene, by its id.
export function findEl(doc, id) {
  const s = doc?.scene;
  for (const k of ["ground", "stakes", "events"]) {
    const el = (s?.[k] ?? []).find((x) => x.id === id);
    if (el) return { el, kind: k === "ground" ? "ground" : k === "stakes" ? "stake" : "event" };
  }
  return null;
}
// How many actions someone's used this round, and how many they've got.
export function spentBy(round, user, ch, { except = null } = {}) {
  const a = round?.acts?.[keyOf(user, ch)];
  const answers = (round?.tele ?? []).filter((t) => t.id !== except && t.ans && t.ans.user === user && t.ans.ch === ch).length;
  return { used: answers + (a?.list?.length ?? 0), have: 1 + (a?.more?.length ?? 0) };
}
// Whoever's put their action into whoever answers this telegraph.
export const joinersOf = (round, id) => Object.entries(round?.acts ?? {}).flatMap(([key, a]) => (a.list ?? []).filter((x) => x.k === "join" && x.ref === id).map((x) => {
  const [user, ch] = key.split("|");
  return { user, ch, name: a.name, act: x.act, steps: x.steps };
}));
// Whether anyone worked a stake or an event this round.
export const workedIn = (round, ref) => Object.values(round?.acts ?? {}).some((a) => (a.list ?? []).some((x) => x.k === "work" && x.ref === ref));

// A telegraph by its id, in any round the table's still got.
export function findTele(doc, id) {
  for (const round of doc?.rounds ?? []) {
    const t = round.tele.find((x) => x.id === id);
    if (t) return { round, t };
  }
  return null;
}

// Where it's got to: coming (nobody's answered it and the round's still on),
// stopped (an answer won), hit (an answer lost, so it landed then and there,
// with no defence), landed (the round ended with nobody answering it, and
// When it lands is still to roll), held (When it lands stopped it) or through.
export function stateOf(t, round) {
  if (t.ans?.won) return "stopped";
  if (t.ans) return "hit";
  if (!round?.over) return "coming";
  if (t.def) return t.def.stopped ? "held" : "through";
  return "landed";
}

// A telegraph the GM sent, aimed at someone playing in the campaign (roster:
// { user, name, ch, cname } for each), or null if it doesn't make sense.
export function teleFrom(x, roster, now) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const who = line(x.who, MAX.who);
  const does = line(x.does, MAX.does);
  const d = Number(x.d);
  if (!who || !does || !SIZES.includes(d)) return null;
  const m = (roster ?? []).find((p) => p.ch && p.user === x.at?.user && p.ch === x.at?.ch);
  if (!m) return null;
  const arch = (Array.isArray(x.at?.arch) ? x.at.arch : []).slice(0, 4).map((a) => line(a, 24)).filter((a) => ARCH.test(a));
  return {
    id: String(x.id), who, does, d, kind: x.kind === "fear" ? "fear" : "blow", one: line(x.one, MAX.one),
    at: { user: m.user, ch: m.ch, name: line(m.cname, MAX.name) || "Someone", player: first(m.name), arch },
    sent: now, seen: 0, ans: null, def: null,
  };
}

// An answer roll from the phone: the set action, its dice and what the
// telegraph's die came up. Each die beat it, tied or came in under, counted
// here from the numbers, and a tie's only won when the phone says 1 Aura paid
// for it. It's won when a die beat it or won the tie. Several dice on one
// answer are advantage, so the best counts.
export function answerFrom(a) {
  if (!a || typeof a !== "object" || !Array.isArray(a.dice)) return null;
  const opp = num(a.opp, 1, 60);
  if (opp == null) return null;
  const dice = a.dice.slice(0, 12).map((x) => ({ size: Number(x?.size), total: num(x?.total, 0, 60), won: x?.out === "won" }))
    .filter((x) => SIZES.includes(x.size) && x.total != null)
    .map(({ size, total, won }) => ({ size, total, out: total > opp ? "beat" : total === opp ? (won ? "won" : "tie") : "under" }));
  if (!dice.length) return null;
  return { act: line(a.act, MAX.act) || "Their roll", steps: num(a.steps, 1, 99) ?? 1, dice, opp, real: a.real === true, won: dice.some((x) => x.out === "beat" || x.out === "won") };
}

// When it lands, for one telegraph: whether a die stopped it, what that die
// came up (or null when there wasn't one left for it), what the telegraph's
// die came up, and what getting through cost.
// on: what it was rolled with, Defend for a blow or Confidence for fear.
export function defenceFrom(r) {
  if (!r || typeof r !== "object") return null;
  const v = num(r.v, 1, 60);
  if (v == null) return null;
  const mine = r.mine == null ? null : num(r.mine, 0, 60);
  // A die stops a telegraph it beats or ties.
  return { on: r.on === "Confidence" ? "Confidence" : "Defend", stopped: r.stopped === true && mine != null && mine >= v, mine, v, paid: line(r.paid, MAX.paid), real: r.real === true };
}

// A piece of the scene the GM put on the table, or null if it doesn't make
// sense. A stake's Challenge is 1 to 6, so its die's a d2 to a d12.
export function elFrom(x) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const id = String(x.id);
  const name = line(x.name, MAX.name);
  if (!name) return null;
  if (x.t === "ground") return { id, t: "ground", name, text: line(x.text, MAX.text) };
  if (x.t === "stake") {
    const c = num(x.c, 1, 6);
    if (c == null) return null;
    const tags = (Array.isArray(x.tags) ? x.tags : []).slice(0, MAX.tags).map((g) => ({ name: line(typeof g === "string" ? g : g?.name, MAX.name), gone: g?.gone ? 1 : 0 })).filter((g) => g.name);
    const clock = SIZES.includes(Number(x.clock)) ? Number(x.clock) : 0;
    return { id, t: "stake", name, c, tags, clock, out: ["won", "lost"].includes(x.out) ? x.out : "", note: line(x.note, MAX.text) };
  }
  if (x.t === "event") {
    const d = Number(x.d);
    if (!SIZES.includes(d)) return null;
    return { id, t: "event", name, what: line(x.what, MAX.text), d, scene: x.scene === true, out: x.out === "done" ? "done" : "" };
  }
  return null;
}
const LIST = { ground: "ground", stake: "stakes", event: "events" };

// One thing someone spent an action on, from their phone, or null.
function actFrom(x) {
  if (!x || typeof x !== "object" || !ID.test(String(x.id ?? ""))) return null;
  const k = ["join", "work", "ground", "else"].includes(x.k) ? x.k : null;
  if (!k) return null;
  const out = { id: String(x.id), k, act: line(x.act, MAX.act), steps: num(x.steps, 1, 99) ?? 1, t: num(x.t, 0, 1e15) ?? 0 };
  if (k === "else") {
    if (!out.act) return null;
    if (x.set === true) out.set = true;
  } else {
    if (!ID.test(String(x.ref ?? ""))) return null;
    out.ref = String(x.ref);
  }
  if (k === "work") {
    const a = answerFrom({ ...x.roll, act: x.act, steps: x.steps });
    if (!a) return null;
    out.roll = { dice: a.dice, opp: a.opp, won: a.won, real: a.real };
    out.aim = line(x.aim, MAX.name);
  }
  return out;
}
function actsFrom(x) {
  if (!x || typeof x !== "object") return null;
  // Holding last round's, coming out of hiding and cashing in d12 Confidence
  // give one each. Resolve and traits can give more.
  const more = [];
  for (const m of Array.isArray(x.more) ? x.more : []) if (MORE.includes(m) && (ONCE.includes(m) ? !more.includes(m) : true) && more.length < MAX.more) more.push(m);
  const list = [];
  for (const y of (Array.isArray(x.list) ? x.list : []).slice(0, MAX.list)) {
    const a = actFrom(y);
    if (!a) return null;
    if (!list.some((z) => z.id === a.id)) list.push(a);
  }
  return { more, list };
}
// What an act's on, said for a message.
function saidOf(a, doc) {
  const el = a.ref ? findEl(doc, a.ref)?.el : null;
  if (a.k === "join") return "putting it into a friend’s answer";
  if (a.k === "work") return `working ${lower(el?.name ?? "the scene")}`;
  if (a.k === "ground") return `using ${lower(el?.name ?? "the ground")}`;
  return actSaid(a);
}
// Something else, mid-sentence: a set action keeps its capital (Defend,
// Sneak), and anything else doesn't (taking a breath, pull the rope out).
export const actSaid = (a) => (a.set || /^[A-Z][A-Z]/.test(a.act ?? "") ? String(a.act ?? "") : String(a.act ?? "").replace(/^[A-Z]/, (m) => m.toLowerCase()));

// A clock or an event steps down a size, and past d2 the stake's lost or the
// event happens. It's kept in the round, so a roll that turns up late can put
// it back.
function stepDown(round, el) {
  if (el.out) return;
  if (el.t === "stake") {
    if (!el.clock) return;
    const from = el.clock;
    if (from <= 2) {
      el.clock = 0;
      el.out = "lost";
    } else el.clock = from - 2;
    round.moved.push({ ref: el.id, from, to: el.clock, out: el.out });
  } else if (el.t === "event") {
    const from = el.d;
    if (from <= 2) el.out = "done";
    else el.d = from - 2;
    round.moved.push({ ref: el.id, from, to: el.out ? 0 : el.d, out: el.out });
  }
}
function stepBack(round, el) {
  const i = round.moved.findIndex((m) => m.ref === el.id);
  if (i < 0) return;
  const m = round.moved[i];
  const k = el.t === "stake" ? "clock" : "d";
  // Closed by that step: it's back where it was. Otherwise up by what that
  // step took, so a later round's step still counts.
  if (m.out) {
    if (el.out === m.out) el.out = "";
    el[k] = m.from;
  } else el[k] = Math.min(12, el[k] + (m.from - m.to));
  round.moved.splice(i, 1);
}
// The end of a round: whatever nobody worked steps down.
function endRound(doc, round, now) {
  round.over = now;
  round.moved = [];
  // In the order the scene's laid out: the scene clock, the stakes, then the events.
  const order = [...doc.scene.events.filter((e) => e.scene), ...doc.scene.stakes, ...doc.scene.events.filter((e) => !e.scene)];
  for (const el of order) if (!workedIn(round, el.id)) stepDown(round, el);
}
// A roll at a stake or an event. A stake's die is rolled once a round, the
// first time anyone goes at it, and that roll stands for everyone else, so a
// later roll's judged against it. A win takes the tag it went for (or the
// next one left), and the last one wins the stake. A win on an event slows it
// a size or drives it a size, and driven past d2, it happens.
function doWork(doc, round, x) {
  const hit = findEl(doc, x.ref);
  if (!hit || hit.kind === "ground") return { ...x, did: null };
  const el = hit.el;
  if (round.held[el.id] == null) round.held[el.id] = x.roll.opp;
  const held = round.held[el.id];
  const won = x.roll.dice.some((d) => d.total > held || (d.total === held && d.out === "won"));
  const y = { ...x, roll: { ...x.roll, won }, did: null };
  // Worked late, after the round ended: it didn't step down after all.
  if (round.over) stepBack(round, el);
  if (!won || el.out) return y;
  if (hit.kind === "stake") {
    const tag = el.tags.find((g) => !g.gone && g.name === x.aim) ?? el.tags.find((g) => !g.gone);
    y.did = {};
    if (tag) {
      tag.gone = 1;
      y.did.tag = tag.name;
    }
    if (el.tags.every((g) => g.gone)) {
      el.out = "won";
      y.did.won = 1;
    }
  } else {
    y.did = { d: el.d };
    if (x.aim === "drive") {
      if (el.d <= 2) {
        el.out = "done";
        y.did.out = 1;
      } else el.d -= 2;
    } else el.d = sizeUp(el.d);
    y.did.to = el.d;
  }
  return y;
}
function undoWork(doc, round, x) {
  const hit = findEl(doc, x.ref);
  if (!hit || hit.kind === "ground") return;
  const el = hit.el;
  if (x.did?.tag) {
    const tag = el.tags.find((g) => g.name === x.did.tag);
    if (tag) tag.gone = 0;
  }
  // Something's back in the way, so it isn't won, whoever's roll won it.
  if (el.out === "won" && (x.did?.won || el.tags.some((g) => !g.gone))) {
    el.out = "";
    for (const a of Object.values(round.acts)) for (const y of a.list ?? []) if (y.ref === el.id && y.did?.won) delete y.did.won;
  }
  if (x.did?.d != null) {
    if (x.did.out) {
      if (el.out === "done") el.out = "";
    } else if (x.did.to != null) el.d = Math.max(2, Math.min(12, el.d - (x.did.to - x.did.d)));
    else el.d = x.did.d;
  }
  // Taken back after the round ended, with nobody else at it: it steps down.
  if (round.over && !workedIn(round, el.id)) stepDown(round, el);
}

const yes = () => ({ ok: true });
const no = (why) => ({ ok: false, why });
const gmOnly = () => no("Only the GM can do that.");

// One change, from the GM or a player (who: { user, role, ch, cname }).
// It changes doc, and says why when it can't. phoneNow is the sending phone's
// clock when it sent the batch, to tell when an answer was rolled.
export function apply(doc, op, who, roster, now, { phoneNow = null } = {}) {
  fresh(doc);
  if (isTurnOp(op)) return applyTurn(doc, op, who, roster, now);
  const gm = who?.role === "gm";
  const last = current(doc);
  switch (op?.o) {
    case "round": {
      if (!gm) return gmOnly();
      if (!ID.test(String(op.id ?? ""))) return no("That round didn’t make sense.");
      // Sent twice, when the signal dropped before the answer came back.
      if (doc.rounds.some((r) => r.id === op.id)) return yes();
      const tele = [];
      for (const x of (Array.isArray(op.tele) ? op.tele : []).slice(0, MAX.tele)) {
        const t = teleFrom(x, roster, now);
        if (t && !tele.some((y) => y.id === t.id) && !findTele(doc, t.id)) tele.push(t);
      }
      // A round with nothing telegraphed still runs the scene's clocks.
      const scene = [...doc.scene.stakes, ...doc.scene.events].some((el) => !el.out);
      if (!tele.length && !scene) return no("There’s nobody in the campaign for that round to go to.");
      // The next round starts once the last one's over.
      if (last && !last.over) endRound(doc, last, now);
      doc.rounds.push({ id: String(op.id), n: (last?.n ?? 0) + 1, at: now, over: 0, tele, acts: {}, held: {}, moved: [] });
      if (doc.rounds.length > MAX.rounds) doc.rounds.splice(0, doc.rounds.length - MAX.rounds);
      return yes();
    }
    // The round can change while someone's still got an action.
    case "add": {
      if (!gm) return gmOnly();
      const t = teleFrom(op.tele, roster, now);
      if (!t) return no("That telegraph didn’t go out. Whoever it was aimed at isn’t playing here now.");
      if (findTele(doc, t.id)) return yes();
      if (!last || last.over) return no("That round’s over, so it didn’t go out. Send it in the next one.");
      if (last.tele.length >= MAX.tele) return no(`A round holds ${MAX.tele} telegraphs at most.`);
      last.tele.push(t);
      return yes();
    }
    case "take": {
      if (!gm) return gmOnly();
      const hit = findTele(doc, op.id);
      if (!hit) return yes();
      if (hit.round !== last || last.over) return no("That round’s over, so it stays as it went.");
      if (hit.t.ans) return no(`${hit.t.ans.name} answered it already, so it stays.`);
      if (hit.t.icp) return no(`${hit.t.icp.name} took it already, so it stays.`);
      last.tele = last.tele.filter((t) => t !== hit.t);
      return yes();
    }
    case "end": {
      if (!gm) return gmOnly();
      if (last && last.id === op.round && !last.over) endRound(doc, last, now);
      return yes();
    }
    // That fight's over: the next round's round 1. It names the fight it's
    // ending, so it can't end a newer one.
    case "fight": {
      if (!gm) return gmOnly();
      if (op.fight != null && Number(op.fight) !== Number(doc.fight)) return yes();
      doc.rounds = [];
      doc.fight = (Number(doc.fight) || 1) + 1;
      return yes();
    }
    case "answer": {
      if (gm) return no("Your players answer the telegraphs.");
      if (!who.ch || op.ch !== who.ch) return no("That answer was for someone you’re not playing here now.");
      const hit = findTele(doc, op.id);
      if (!hit) return no("That telegraph’s gone. The GM took it back or started a new fight.");
      const t = hit.t;
      const mine = Boolean(t.ans && t.ans.user === who.user && t.ans.ch === who.ch);
      if (t.ans && !mine) return no(`${t.ans.name} answered ${lower(t.who)} first.`);
      if (t.def) return no("It’s landed already.");
      if (op.a == null) {
        if (mine) t.ans = null;
        return yes();
      }
      const a = answerFrom(op.a);
      if (!a) return no("That answer didn’t make sense.");
      if (a.opp > t.d) return no(`That answer was against a ${a.opp}, and ${lower(t.who)}’s d${t.d} can’t roll that.`);
      // One action a round: answering spends it, unless they've got another.
      const acts = hit.round.acts?.[keyOf(who.user, who.ch)];
      if ((acts?.list ?? []).some((x) => x.k === "join" && x.ref === t.id)) return no(`You put your action into whoever answers ${lower(t.who)}, so you can’t answer it as well.`);
      const sp = spentBy(hit.round, who.user, who.ch, { except: t.id });
      if (sp.used >= sp.have) return no(`You’ve spent your action this round${acts?.list?.length ? ` on ${saidOf(acts.list[acts.list.length - 1], doc)}` : ""}. Got another? Say where it came from on your phone.`);
      // When it was rolled, by the phone's clock, put on the server's: so an
      // answer rolled in the round with no signal isn't late when it arrives.
      // A couple of seconds' grace for the time it took to get here.
      const timed = Number.isFinite(Number(op.a.t)) && Number.isFinite(Number(phoneNow));
      const rolled = timed ? now - Math.min(7 * 86400000, Math.max(0, Number(phoneNow) - Number(op.a.t))) : now;
      // Whoever put their action in with them, and the phone counted.
      const counted = new Set((Array.isArray(op.a.with) ? op.a.with : []).slice(0, 8).map((x) => keyOf(x?.user, x?.ch)));
      const joined = joinersOf(hit.round, t.id).filter((j) => counted.has(keyOf(j.user, j.ch)) && !(j.user === who.user && j.ch === who.ch));
      t.ans = { user: who.user, ch: who.ch, name: line(who.cname, MAX.name) || "Someone", ...a, ...(joined.length ? { with: joined.map((j) => ({ user: j.user, ch: j.ch, name: line(j.name, MAX.name) || "Someone", act: j.act, steps: j.steps })) } : {}), at: rolled, late: hit.round.over && rolled > hit.round.over + (timed ? 2000 : 0) ? 1 : 0 };
      return yes();
    }
    case "defend": {
      if (gm) return no("Your players roll When it lands.");
      if (!who.ch || op.ch !== who.ch) return no("That roll was for someone you’re not playing here now.");
      const hit = findTele(doc, op.id);
      if (!hit) return no("That telegraph’s gone. The GM started a new fight.");
      const t = hit.t;
      const on = landsOn(t);
      if (on.user !== who.user || on.ch !== who.ch) return no(t.icp && t.at.user === who.user && t.at.ch === who.ch ? `${t.icp.name} took that one for you.` : "That one wasn’t aimed at you.");
      if (!hit.round.over || t.ans) return no("That one didn’t land on you at the end of the round.");
      if (op.r == null) {
        t.def = null;
        return yes();
      }
      const r = defenceFrom(op.r);
      if (!r) return no("That roll didn’t make sense.");
      if (r.v > t.d) return no(`That roll was against a ${r.v}, and ${lower(t.who)}’s d${t.d} can’t roll that.`);
      if ((r.on === "Confidence") !== (t.kind === "fear")) return no(t.kind === "fear" ? `${cap(lower(t.who))} was fear, so it’s against Confidence.` : `${cap(lower(t.who))} was a blow, so it’s against Defend.`);
      t.def = { ...r, at: now };
      return yes();
    }
    // Intercept: a friend's telegraph comes at you instead, for 1 Aura (free
    // for a Guardian), any time before it lands. The phone pays the Aura.
    // Fear's inside their head, so nobody can.
    case "icp": {
      if (gm) return no("Your players intercept.");
      if (!who.ch || op.ch !== who.ch) return no("That was for someone you’re not playing here now.");
      const hit = findTele(doc, op.id);
      if (!hit) return no("That telegraph’s gone. The GM took it back or started a new fight.");
      const t = hit.t;
      const mine = Boolean(t.icp && t.icp.user === who.user && t.icp.ch === who.ch);
      if (op.off) {
        if (!mine) return yes();
        if (hit.round.over || t.def) return no(`${cap(lower(t.who))} landed on you already, so it’s yours.`);
        delete t.icp;
        return yes();
      }
      // Already theirs: it's only whether it's paid for that changes.
      if (mine) {
        t.icp.free = op.free === true;
        t.icp.paid = op.paid !== false;
        return yes();
      }
      if (hit.round.over) return no(`Round ${hit.round.n}’s over, so it’s too late to take ${lower(t.who)}.`);
      if (t.kind === "fear") return no("Nobody can intercept fear, lies or pressure. It’s inside their head.");
      if (t.at.user === who.user && t.at.ch === who.ch) return no("That one’s aimed at you already.");
      if (t.ans) return no(`${t.ans.name} answered ${lower(t.who)} already.`);
      if (t.icp) return no(`${t.icp.name} took ${lower(t.who)} first.`);
      t.icp = { user: who.user, ch: who.ch, name: line(who.cname, MAX.name) || "Someone", free: op.free === true, paid: op.paid !== false, at: now };
      return yes();
    }
    // What someone spent their actions on this round, all of it at once, as
    // their phone has it: anything taken back comes off, and its roll's undone.
    case "acts": {
      if (gm) return no("Your players say what they’re doing.");
      if (!who.ch || op.ch !== who.ch) return no("That was for someone you’re not playing here now.");
      const round = doc.rounds.find((r) => r.id === op.round);
      if (!round) return no("That round’s gone. The GM started a new fight.");
      const key = keyOf(who.user, who.ch);
      const was = round.acts[key]?.list ?? [];
      const next = op.x == null ? { more: [], list: [] } : actsFrom(op.x);
      if (!next) return no("That didn’t make sense.");
      const bare = (a) => JSON.stringify({ ...a, did: undefined, late: undefined, at: undefined, roll: a.roll ? { ...a.roll, won: undefined } : undefined });
      const same = (a, b) => Boolean(a && b) && bare(a) === bare(b);
      const kept = was.filter((a) => next.list.some((b) => b.id === a.id && same(a, b)));
      const gone = was.filter((a) => !kept.includes(a));
      const added = next.list.filter((b) => !kept.some((a) => a.id === b.id));
      // When each was done, by the phone's clock: one done after the round
      // ended doesn't count.
      const timed = Number.isFinite(Number(phoneNow));
      const doneAt = (a) => (timed && a.t ? now - Math.min(7 * 86400000, Math.max(0, Number(phoneNow) - a.t)) : now);
      for (const a of added) {
        if (round.over && doneAt(a) > round.over + 2000) return no(`Round ${round.n}’s over, so that didn’t count. Tell the GM what you did.`);
        if (a.k === "join") {
          const t = round.tele.find((x) => x.id === a.ref);
          if (!t) return no("That telegraph’s gone. The GM took it back.");
          if (t.ans) return no(`${t.ans.name} answered ${lower(t.who)} already, so it’s too late to put your action in.`);
          if (added.some((b) => b !== a && b.k === "join" && b.ref === a.ref) || kept.some((b) => b.k === "join" && b.ref === a.ref)) return no("You’re in on that one already.");
        } else {
          const hit = findEl(doc, a.ref);
          if (!hit || (a.k === "ground") !== (hit.kind === "ground")) return no("That’s gone from the scene.");
          // Settled, unless it was the end of this round that settled it and
          // this roll's from the round, turning up late.
          const closed = round.over && round.moved.some((m) => m.ref === hit.el.id && m.out);
          if (a.k === "work" && hit.el.out && !closed) return no(`${cap(lower(hit.el.name))}’s settled already.`);
          // Once its die's rolled this round, everyone's judged against that.
          // Before, the roll has to be one its die could make: late, the die
          // it had before the round ended.
          const die = Math.max(dieOf(hit.el), round.over ? round.moved.find((m) => m.ref === hit.el.id)?.from ?? 0 : 0);
          if (a.k === "work" && round.held[hit.el.id] == null && a.roll.opp > die) return no(`That roll was against a ${a.roll.opp}, and ${lower(hit.el.name)}’s d${die} can’t roll that.`);
        }
      }
      // Someone counted in an answer is in it.
      for (const a of gone) {
        const t = a.k === "join" ? round.tele.find((x) => x.id === a.ref) : null;
        if (t?.ans?.with?.some((w) => w.user === who.user && w.ch === who.ch)) return no(`${t.ans.name} answered ${lower(t.who)} with you in it, so it stays.`);
      }
      const sp = spentBy({ ...round, acts: { [key]: next } }, who.user, who.ch);
      if (sp.used > sp.have) return no(sp.have === 1 ? "You’ve got one action this round. Got another? Say where it came from." : `You’ve got ${sp.have} actions this round, and that’s more.`);
      round.acts[key] = { name: line(who.cname, MAX.name) || "Someone", more: next.more, list: [...kept] };
      for (const a of gone) if (a.k === "work") undoWork(doc, round, a);
      for (const a of added) {
        const late = round.over ? 1 : 0;
        round.acts[key].list.push(a.k === "work" ? { ...doWork(doc, round, a), at: now, late } : { ...a, at: now, late });
      }
      const order = new Map(next.list.map((a, i) => [a.id, i]));
      round.acts[key].list.sort((x, y) => order.get(x.id) - order.get(y.id));
      if (!round.acts[key].list.length && !round.acts[key].more.length) delete round.acts[key];
      return yes();
    }
    // The scene: the GM puts a piece of it on, changes it, or takes it off.
    case "put": {
      if (!gm) return gmOnly();
      const el = elFrom(op.el);
      if (!el) return no("That didn’t make sense.");
      const list = doc.scene[LIST[el.t]];
      const at = findEl(doc, el.id);
      if (at && LIST[at.kind] !== LIST[el.t]) doc.scene[LIST[at.kind]] = doc.scene[LIST[at.kind]].filter((x) => x.id !== el.id);
      const i = list.findIndex((x) => x.id === el.id);
      if (i < 0 && list.length >= MAX[LIST[el.t]]) return no(`The scene holds ${MAX[LIST[el.t]]} ${el.t === "ground" ? "pieces of ground" : LIST[el.t]} at most.`);
      // There's one scene clock.
      if (el.t === "event" && el.scene) for (const e of doc.scene.events) if (e.id !== el.id) e.scene = false;
      if (i < 0) list.push(el);
      else list[i] = el;
      return yes();
    }
    case "drop": {
      if (!gm) return gmOnly();
      for (const k of ["ground", "stakes", "events"]) doc.scene[k] = doc.scene[k].filter((x) => x.id !== op.id);
      return yes();
    }
    case "clear": {
      if (!gm) return gmOnly();
      doc.scene = blankScene();
      return yes();
    }
  }
  return no("That didn’t make sense.");
}

// Someone's deleted their account: the telegraphs aimed at them go, and their
// answers to anyone else's stay as how it went, but not who answered.
export function forget(doc, user) {
  let changed = forgetTurn(doc, user);
  for (const r of doc.rounds) {
    const kept = r.tele.filter((t) => t.at.user !== user);
    if (kept.length !== r.tele.length) changed = true;
    r.tele = kept;
    for (const t of r.tele) {
      if (t.ans?.user === user) {
        t.ans = { ...t.ans, user: "", ch: "", name: "Someone who’s left" };
        changed = true;
      }
      if (t.ans?.with?.some((w) => w.user === user)) {
        t.ans.with = t.ans.with.map((w) => (w.user === user ? { ...w, user: "", ch: "", name: "Someone who’s left" } : w));
        changed = true;
      }
      if (t.icp?.user === user) {
        delete t.icp;
        changed = true;
      }
    }
    for (const key of Object.keys(r.acts ?? {})) {
      if (key.startsWith(`${user}|`)) {
        delete r.acts[key];
        changed = true;
      }
    }
  }
  return changed;
}

// What a phone gets: the GM every round of this fight, a player the last two
// (the one on now, and the one before for anything still to roll from it,
// and no further, so a table rolling real dice isn't nagged round after
// round). Telegraphs are face up, so everyone sees them all.
export function viewOf(doc, role) {
  const rounds = role === "gm" ? doc.rounds : doc.rounds.slice(-2);
  return { v: doc.v, fight: doc.fight, rounds: JSON.parse(JSON.stringify(rounds)), scene: JSON.parse(JSON.stringify(doc.scene ?? blankScene())), ...turnView(doc, role) };
}
