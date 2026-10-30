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
// touches the board: once the asking's done, she carries it into Build the
// world on her phone (Mo's pick, till the ground's built).
//
//   found  { id, at, step, recipe, n, seed, clocks, clock, who, outs, turn,
//            asking, tension, last, out }
//     step     "room" (she's set it up and opened it, and the crew's joining),
//              "ask" (the asking, a turn at a time), "asked" (the asking's
//              done) or "carried" (she's taken it into Build the world)
//     recipe   { region, era, twist }, n how many factions (4 to 12), and
//              seed the shared seed, three of core.yaml's words, that every
//              phone deals the room's cards from
//     clocks   minutes for each age: the ground, the founding and the strife
//     clock    { age, left, run }: the age that's on, what's left of its
//              clock in ms, and when it was set running (0 while it's
//              stopped). The asking's part of the first age, so its clock
//              starts with the asking.
//     who      everyone in, in the order turns go round: { key ("user|ch"),
//              user, ch, name, cname, joined }, joined being when they
//              joined the room on their phone (0 till then)
//     outs     who she's taken out, by key, who can't join themselves again
//     turn     { key, part, at }: whose turn it is and what for, or null
//     asking   { holds, runs, notices }, each a pick or null, and tension
//     a pick   { id, text, tags, dials, strange, own, roll, real, by,
//                byName, gm, deal, at }: a card off the tables (its row's
//                id and words, the tags and dials it sets, and for the
//                tension its d12, real when it was real dice tapped in) or
//                their own words (own), with whose turn it was, gm when she
//                put it in for them, and deal when it was dealt to finish
//     last     the last answer, { part, key }, so it can be taken back
//     out      the clock ran out and the turn that was on has finished, so
//              the rest of the asking's dealt on her phone

export const PARTS = ["holds", "tension", "runs", "notices"];
export const QUESTIONS = ["holds", "runs", "notices"];
export const STEPS = ["room", "ask", "asked", "carried"];
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
const notIn = () => no("You need someone playing in the campaign for that.");

// ------------------------------------------------------------ the clock

// What's left of the age's clock, in ms.
export function clockLeft(f, now) {
  const c = f?.clock;
  if (!c) return 0;
  return Math.max(0, c.run ? c.left - (now - c.run) : c.left);
}
// The asking's clock has run out.
export const timeUp = (f, now) => f?.step === "ask" && Boolean(f.clock) && clockLeft(f, now) <= 0;
function stop(f, now) {
  if (!f.clock?.run) return;
  f.clock.left = clockLeft(f, now);
  f.clock.run = 0;
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

// The dials the asking's set, the way the engine counts them: each starts
// in the middle, and every answer off the tables nudges it.
export function dialsOf(f) {
  const d = { tense: 1, strange: 1, rich: 1, ruled: 1 };
  for (const part of PARTS) for (const [k, v] of Object.entries(pickOf(f, part)?.dials ?? {})) if (k in d) d[k] += Number(v) || 0;
  return Object.fromEntries(DIALS.map((k) => [k, Math.max(0, Math.min(2, Math.round(d[k])))]));
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

// ------------------------------------------------------------ the changes

// One change to the founding, from the GM or a player (who: { user, role,
// ch, cname }, roster: everyone playing someone in the campaign, { user,
// name, ch, cname }). It changes doc, and says why when it can't.
export function applyFound(doc, op, who, roster, now) {
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
      doc.found = { id: String(op.id), at: now, step: "room", recipe, n, seed: String(op.seed), clocks, clock: null, who, outs: [], turn: null, asking: { holds: null, runs: null, notices: null }, tension: null, last: null, out: false };
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
        if (f.step === "ask" && !f.turn && !f.out) advance(f, key, now);
        return yes();
      }
      if (i < 0) return yes();
      const [gone] = f.who.splice(i, 1);
      if (!f.outs.includes(key)) f.outs = [...f.outs, key].slice(-MAX.outs);
      // Their turn goes to whoever was after them.
      if (f.turn?.key === gone.key) f.turn = f.who.length ? { key: f.who[i % f.who.length].key, part: f.turn.part, at: now } : null;
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
    case "fd-answer": {
      if (!f) return none();
      if (f.step !== "ask") return no(f.step === "room" ? "It hasn’t started yet." : "The asking’s done.");
      const part = String(op.part ?? "");
      if (!PARTS.includes(part)) return no("That answer didn’t make sense.");
      const had = pickOf(f, part);
      if (had) return no(had.gm && had.by === myKey ? "Your GM put an answer in for you already." : "That one’s been answered already.");
      if (!f.turn || f.turn.part !== part) return no("It’s not that one’s turn.");
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
      if (!["ask", "asked"].includes(f.step)) return no("It’s on your GM’s phone now, so the asking stays as it is.");
      const l = f.last;
      if (!l || l.part !== op.part || !pickOf(f, l.part)) return no("Only the last answer can be taken back, and only till someone answers after it.");
      if (!gm && myKey !== l.key) return no("That’s not yours to take back.");
      setPick(f, l.part, null);
      f.turn = { key: l.key, part: l.part, at: now };
      f.last = null;
      f.out = false;
      if (f.step === "asked") {
        f.step = "ask";
        if (f.clock && f.clock.left > 0 && !f.clock.run) f.clock.run = now;
      }
      return yes();
    }
    case "fd-rest": {
      if (!gm) return gmOnly();
      if (!f) return none();
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
      if (f.step !== "ask" || !f.clock) return no("The clock only runs while the asking’s on.");
      if (op.do === "stop") stop(f, now);
      else if (op.do === "run") {
        if (!f.clock.run && f.clock.left > 0) f.clock.run = now;
      } else if (op.do === "add") {
        const m = whole(op.m, -MAX.add, MAX.add);
        if (!m) return no("That didn’t make sense.");
        const left = Math.max(0, Math.min(MAX.minutes * MINUTE, clockLeft(f, now) + m * MINUTE));
        f.clock.left = left;
        if (f.clock.run) f.clock.run = now;
        // More time, after it ran out: the turns go round again.
        if (f.out && left > 0) {
          f.out = false;
          if (!f.clock.run) f.clock.run = now;
          advance(f, f.last?.key ?? null, now);
        }
      } else return no("That didn’t make sense.");
      return yes();
    }
    case "fd-carry": {
      if (!gm) return gmOnly();
      if (!f) return none();
      if (f.step === "carried") return yes();
      if (f.step !== "asked") return no("Finish the asking first.");
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
}

export const isFoundOp = (op) => typeof op?.o === "string" && op.o.startsWith("fd-");

// Someone's deleted their account: they're out of the founding, their turn
// goes on round the table, and their answers stay without their name.
export function forgetFound(doc, user) {
  const f = doc.found;
  if (!f) return false;
  let changed = false;
  const theirs = (key) => String(key ?? "").startsWith(`${user}|`);
  const i = f.who.findIndex((w) => theirs(w.key));
  if (i >= 0) {
    const turnGone = theirs(f.turn?.key);
    f.who = f.who.filter((w) => !theirs(w.key));
    if (turnGone) f.turn = f.who.length ? { ...f.turn, key: f.who[i % f.who.length].key } : null;
    changed = true;
  }
  if (f.outs.some(theirs)) {
    f.outs = f.outs.filter((k) => !theirs(k));
    changed = true;
  }
  for (const part of PARTS) {
    const p = pickOf(f, part);
    if (p && theirs(p.by)) {
      setPick(f, part, { ...p, by: "", byName: "Someone who’s left" });
      changed = true;
    }
  }
  if (theirs(f.last?.key)) {
    f.last = null;
    changed = true;
  }
  return changed;
}

// ------------------------------------------------------------ what each phone gets

// The GM gets the lot. A player gets the room as it's played in the open,
// built a field at a time, so nothing the later stages keep for her (her
// pass, the old powers' hidden parts) can reach a player by being added
// here. now is the server's clock, so every phone counts the same time down.
export function foundView(doc, role) {
  const f = doc?.found;
  if (!f) return null;
  const now = Date.now();
  if (role === "gm") return { ...clone(f), now };
  const pick = (p) => (p ? clone(p) : null);
  return {
    id: f.id, at: f.at, step: f.step, recipe: clone(f.recipe), n: f.n, seed: f.seed, clocks: clone(f.clocks),
    clock: clone(f.clock),
    who: f.who.map((w) => ({ key: w.key, user: w.user, ch: w.ch, name: w.name, cname: w.cname, joined: w.joined })),
    outs: clone(f.outs),
    turn: clone(f.turn),
    asking: { holds: pick(f.asking.holds), runs: pick(f.asking.runs), notices: pick(f.asking.notices) },
    tension: pick(f.tension),
    last: clone(f.last), out: f.out === true,
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
  if (!gm && b.step === "room" && (fresh || !inIt(a)) && inIt(b) && !whoOf(b, me)?.joined) {
    lines.push(`${gmName}’s opened the founding. Join it on the World tab.`);
    buzz = true;
  }
  if (!gm && b.step === "ask" && (fresh || a.step === "room") && inIt(b)) lines.push("The founding’s started.");
  if (!gm && b.turn?.key === me && (fresh || a.turn?.key !== me || a.turn?.part !== b.turn.part)) {
    lines.push(b.turn.part === "tension" ? "Your turn: roll the d12 for what’s pulling it apart." : `Your turn: ${ASKED[b.turn.part].charAt(0).toLowerCase()}${ASKED[b.turn.part].slice(1)}`);
    buzz = true;
  }
  if (!fresh && b.out && !a.out) lines.push(gm ? "Time’s up, so the rest of the asking’s dealt." : `Time’s up. The rest of the asking’s dealt on ${gmName}’s phone.`);
  if (!fresh && b.step === "asked" && a.step === "ask") lines.push("That’s the asking done.");
  if (!fresh && !gm && b.step === "carried" && a.step !== "carried") lines.push(`${gmName}’s taking it from here, building the rest on her phone.`);
  return { lines, buzz };
}
