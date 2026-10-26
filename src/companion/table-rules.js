// The live table: a campaign's rounds of telegraphs, and how each one went
// (stage 8 in notes/app-plan.md). The GM sends the round's telegraphs, each
// aimed at one of the crew, and the player answers it on their phone, or lets
// it land and rolls When it lands once the round's over. The table's Durable
// Object (src/worker/table.js) keeps it and applies every change with these
// rules, and the phone uses the same ones to show its own changes before
// they've gone up.
//
//   a round      { id, n, at, over, tele }   over is when it ended, or 0
//   a telegraph  { id, who, does, d, kind, one, at, sent, seen, ans, def }
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
//
// The rules (05-conflict.md): win the answer and it's stopped. Lose it and it
// lands at once, with no defence. Whatever nobody answered lands at the end of
// the round, and whoever it's aimed at rolls When it lands.

export const SIZES = [2, 4, 6, 8, 10, 12];
export const MAX = { who: 60, does: 140, one: 140, name: 60, act: 60, paid: 80, tele: 24, rounds: 12 };
const ID = /^[A-Za-z0-9_-]{6,32}$/;
const OUTS = ["beat", "won", "tie", "under"];
// An archetype's name, as the crest draws it.
const ARCH = /^[A-Za-z][A-Za-z' -]{0,23}$/;

export const line = (v, max) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const num = (v, lo, hi) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && v !== null && v !== "" ? Math.min(hi, Math.max(lo, n)) : null;
};
const first = (name) => line(name, MAX.name).split(" ")[0] || "";
// "The left Warden" in the middle of a sentence.
export const lower = (name) => String(name ?? "").replace(/^(A|An|The|His|Her|Their|Its) /, (m) => m.toLowerCase());

export const blank = () => ({ v: 0, fight: 1, rounds: [] });
export const current = (doc) => doc?.rounds?.[doc.rounds.length - 1] ?? null;

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

// An answer roll from the phone: the set action, its dice and what each did
// against the telegraph's die. It's won when a die beat it, or a tie was won
// for 1 Aura. Several dice on one answer are advantage, so the best counts.
export function answerFrom(a) {
  if (!a || typeof a !== "object" || !Array.isArray(a.dice)) return null;
  const dice = a.dice.slice(0, 12).map((x) => ({ size: Number(x?.size), total: num(x?.total, 0, 60), out: OUTS.includes(x?.out) ? x.out : null }))
    .filter((x) => SIZES.includes(x.size) && x.total != null && x.out);
  const opp = num(a.opp, 0, 60);
  if (!dice.length || opp == null) return null;
  return { act: line(a.act, MAX.act) || "Their roll", steps: num(a.steps, 1, 99) ?? 1, dice, opp, real: a.real === true, won: dice.some((x) => x.out === "beat" || x.out === "won") };
}

// When it lands, for one telegraph: whether a die stopped it, what that die
// came up (or null when there wasn't one left for it), what the telegraph's
// die came up, and what getting through cost.
export function defenceFrom(r) {
  if (!r || typeof r !== "object") return null;
  const v = num(r.v, 0, 60);
  if (v == null) return null;
  return { stopped: r.stopped === true, mine: r.mine == null ? null : num(r.mine, 0, 60), v, paid: line(r.paid, MAX.paid), real: r.real === true };
}

const yes = () => ({ ok: true });
const no = (why) => ({ ok: false, why });
const gmOnly = () => no("Only the GM can do that.");

// One change, from the GM or a player (who: { user, role, ch, cname }).
// It changes doc, and says why when it can't.
export function apply(doc, op, who, roster, now) {
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
      if (!tele.length) return no("There’s nobody in the campaign for that round to go to.");
      // The next round starts once the last one's over.
      if (last && !last.over) last.over = now;
      doc.rounds.push({ id: String(op.id), n: (last?.n ?? 0) + 1, at: now, over: 0, tele });
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
      last.tele = last.tele.filter((t) => t !== hit.t);
      return yes();
    }
    case "end": {
      if (!gm) return gmOnly();
      if (last && last.id === op.round && !last.over) last.over = now;
      return yes();
    }
    // That fight's over: the next round's round 1.
    case "fight": {
      if (!gm) return gmOnly();
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
      // late: it came in after the round ended (the phone had no signal).
      t.ans = { user: who.user, ch: who.ch, name: line(who.cname, MAX.name) || "Someone", ...a, at: mine ? t.ans.at : now, late: mine ? t.ans.late : hit.round.over ? 1 : 0 };
      return yes();
    }
    case "defend": {
      if (gm) return no("Your players roll When it lands.");
      if (!who.ch || op.ch !== who.ch) return no("That roll was for someone you’re not playing here now.");
      const hit = findTele(doc, op.id);
      if (!hit) return no("That telegraph’s gone. The GM started a new fight.");
      const t = hit.t;
      if (t.at.user !== who.user || t.at.ch !== who.ch) return no("That one wasn’t aimed at you.");
      if (!hit.round.over || t.ans) return no("That one didn’t land on you at the end of the round.");
      if (op.r == null) {
        t.def = null;
        return yes();
      }
      const r = defenceFrom(op.r);
      if (!r) return no("That roll didn’t make sense.");
      t.def = { ...r, at: now };
      return yes();
    }
  }
  return no("That didn’t make sense.");
}

// What a phone gets: the GM every round of this fight, a player the last two
// (the one on now, and the one before for anything still to roll from it).
// Telegraphs are face up, so everyone sees them all.
export function viewOf(doc, role) {
  const rounds = role === "gm" ? doc.rounds : doc.rounds.slice(-2);
  return { v: doc.v, fight: doc.fight, rounds: JSON.parse(JSON.stringify(rounds)) };
}
