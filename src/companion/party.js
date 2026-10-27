// The party sheet on every phone in a campaign, and the threads between the
// crew kept in step on both their phones (the rest of stage 7 in
// notes/app-plan.md).
//
// The party sheet's on a campaign's page for its GM and players, and on the
// Party tab of a character who's playing in one. Anyone in the campaign can
// change it. A change goes to the Worker (src/worker/party.js) as soon as
// there's a signal, and reaches everyone else within 20 seconds while they've
// got the campaign or a character in it open. With no signal, changes wait on
// the phone, numbered, and go up in order when it's back, so nothing's lost and
// nothing counts twice.
//
// A thread with someone else in the campaign is one thread on both phones
// (threads.js). The character's own state still says where each of its threads
// has got to, so the Sheet tab, print and the GM's look read it the way they
// always have, and this keeps it in step three ways: where this phone last
// agreed the thread was with the Worker (base), where the character has it
// now, and where the Worker has it now. Moved here, it goes up. Moved on the
// other phone, it comes down. A thread that's only on the other one's sheet
// shows on this one too, in their words.
//
//   zi-party  for the account signed in on this phone: this phone's own id
//             (dev), the number of its last change, and for each campaign its
//             party sheet as the Worker last sent it, the crew, where their
//             threads have got to, the changes still to go up and what each
//             thread was last agreed as. Each campaign's kept apart, and it all
//             goes when the account's characters leave the phone (sync.js).
import { LISTS, MAX, apply, blank, moneyOf, powerOf, readable, undoOf } from "./party-sheet.js";
import { bondId, mateFor, threadState, wordsKey } from "./threads.js";
import { stepsToDice } from "./dice.js";
import { die as kitDie, grow as growDie, mini as kitMini } from "../kit/kit.js";

const KEY = "zi-party";
const POLL = 20000;
const SIZES = [2, 4, 6, 8, 10, 12];

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const online = () => navigator.onLine !== false;
const time = (ms) => new Date(ms).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "";
const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const newId = () => `${random(6)}${Date.now().toString(36).slice(-3)}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Words someone wrote, put inside a sentence, without a full stop of their own.
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "");

// What each list's lines are called, one and more.
const NAMES = {
  reps: ["Reputation", "Reputations"],
  res: ["resource", "resources"],
  assets: ["asset", "assets"],
  projects: ["project", "projects"],
  holdings: ["holding", "holdings"],
  people: ["person the crew relies on", "people the crew relies on"],
  changed: ["line on What has changed", "lines on What has changed"],
};

export function makeParty(d) {
  const { esc, sync, store } = d;
  const P = d.P ?? { start: { res: [], assets: [] }, assets: [], sizes: {}, goals: [], rep: "", people: "" };
  let st = null;
  let ui = { editing: "", sure: "", adding: "" };
  const undos = [];
  const notices = [];
  let watching = null;
  let timer = 0;
  const soonTimers = {};
  const busy = {};
  const again = {};
  const shown = {};
  // What's just changed on someone else's phone, lit for one redraw.
  const lit = {};

  // ------------------------------------------------------------ kept on the phone

  function load() {
    const me = sync.me?.id ?? null;
    if (st && st.user === me) return st;
    const kept = read(KEY);
    st = kept && kept.user === me && me && kept.k && typeof kept.dev === "string" && Number.isInteger(kept.n) ? kept : { user: me, dev: random(16), n: 0, k: {} };
    return st;
  }
  const keep = () => {
    if (st?.user) write(KEY, st);
  };
  const camp = (id) => {
    load();
    st.k[id] ??= { doc: null, pv: 0, v: "", at: 0, crew: [], gm: null, bonds: {}, out: [], base: {}, face: "" };
    lit[id] ??= [];
    return st.k[id];
  };
  const me = () => sync.me?.id ?? null;
  const whoIs = (k, id) => (!id ? "" : id === me() ? "you" : first(k.gm?.id === id ? k.gm.name : k.crew.find((m) => m.id === id)?.name));

  // The sheet as everyone else will see it once this phone's changes are in:
  // the Worker's, or the book's new crew on one nobody's touched, with
  // whatever's still to go up on top.
  function docOf(id) {
    const k = camp(id);
    const doc = k.doc ? readable(structuredClone(k.doc)) : blank();
    if (!doc.made && !k.out.some((o) => o.o === "start")) apply(doc, { o: "start", ...P.start });
    for (const o of k.out) if (!o.m) apply(doc, o);
    return doc;
  }

  // Which campaign a character plays in, if this phone knows.
  function campOf(ch) {
    if (!ch || !sync.me) return null;
    const hit = d.list()?.find((x) => x.role === "player" && x.character?.id === ch.id);
    if (hit) return hit.id;
    if (d.list()) return null;
    load();
    return Object.keys(st.k).find((id) => st.k[id].crew.some((m) => m.id === me() && m.character?.id === ch.id)) ?? null;
  }
  // The character this phone's player plays in a campaign, if it's on this
  // phone. The campaign list's the freshest word on it (it changes the moment
  // they bring someone else), and the party sheet's crew after that.
  function myCharIn(id) {
    if (!sync.me) return null;
    const listed = d.list()?.find((x) => x.id === id);
    const charId = listed ? (listed.role === "player" ? listed.character?.id : null) : camp(id).crew.find((m) => m.id === me())?.character?.id;
    return charId ? store.data.characters.find((c) => c.id === charId && c.acct === me()) ?? null : null;
  }
  // The others in the campaign who are playing someone.
  const matesOf = (k) => k.crew.filter((m) => m.id !== me() && m.character);
  const mateName = (m) => m.character.name;

  // ------------------------------------------------------------ threads

  // Every thread between this player's character and someone else in the
  // campaign: the ones on their sheet with that someone's name, and the ones
  // on the other sheet with theirs that this sheet hasn't got.
  function sharedOf(k, ch, c) {
    const mine = `${me()}:${ch.id}`;
    const mates = matesOf(k);
    const out = [];
    for (const m of mates) {
      const other = `${m.id}:${m.character.id}`;
      const seen = new Set();
      for (const p of c.threads) {
        if (mateFor(p.person, mates, mateName) !== m) continue;
        for (const t of p.threads) {
          if (seen.has(wordsKey(t.text))) continue;
          seen.add(wordsKey(t.text));
          out.push({ id: bondId(mine, other, t.text), with: other, person: p.person, t, own: true, mate: m });
        }
      }
      // Theirs go under the name this sheet already knows them by, if it does.
      const person = c.threads.find((p) => mateFor(p.person, mates, mateName) === m)?.person ?? m.character.name;
      for (const t of m.threads ?? []) {
        if (seen.has(wordsKey(t.text))) continue;
        seen.add(wordsKey(t.text));
        out.push({ id: bondId(mine, other, t.text), with: other, person, t: { text: t.text, kind: t.kind === "hostile" ? "hostile" : "bond", whose: t.whose || null, strained: t.strained === true, theirs: true }, own: false, mate: m });
      }
    }
    return out;
  }
  // A thread set where it's got to, the way the Sheet tab keeps it.
  function setThread(s, person, t, to) {
    const key = `${person}|${t.text}`;
    if (to === (t.strained ? "strained" : "whole")) delete s.threads[key];
    else s.threads[key] = to;
  }

  // What this phone's player shares with the crew: their Aspiration, and the
  // threads on their sheet with each of the others.
  function faceOf(k, ch, c) {
    const s = ch.state;
    const mates = matesOf(k);
    const threads = [];
    for (const p of c.threads) {
      const m = mateFor(p.person, mates, mateName);
      if (!m) continue;
      for (const t of p.threads) threads.push({ with: `${m.id}:${m.character.id}`, text: t.text, kind: t.kind, whose: t.whose || `${ch.name}’s`, strained: Boolean(t.strained) });
    }
    // Which character it's for, so one shared just before a switch can't land on the next.
    return { ch: ch.id, asp: { text: s.aspText || c.aspiration?.text || "", die: s.asp }, threads };
  }

  // Threads moved on this phone since it last agreed with the Worker, ready to
  // go up. One the Worker's never heard of is still where the sheets start it,
  // so there's nothing to send till it moves. One this phone's meeting for the
  // first time somewhere else (strained before the campaign, say) goes up as
  // it is, and the Worker keeps whichever's further on.
  function noteMoves(k, ch, c) {
    for (const x of sharedOf(k, ch, c)) {
      const now = threadState(ch.state, x.person, x.t);
      const start = x.t.strained ? "strained" : "whole";
      const base = k.base[x.id];
      const there = k.bonds[x.id];
      if (base === undefined && (there ? there.s === now : now === start)) {
        k.base[x.id] = now;
        continue;
      }
      if (base === now) continue;
      k.out.push({ n: ++st.n, m: 1, ch: ch.id, id: x.id, with: x.with, w: x.t.text, from: base ?? null, to: now });
      k.base[x.id] = now;
    }
  }

  // Threads the Worker has somewhere else, brought onto this character's
  // sheet, unless there's a change of this phone's still going up, or one made
  // while the answer was on its way (that goes up next).
  function merge(id, k, ch) {
    const c = d.normal(ch);
    if (!c) return false;
    const changed = [];
    for (const x of sharedOf(k, ch, c)) {
      const there = k.bonds[x.id];
      if (!there || k.out.some((o) => o.m && o.id === x.id)) continue;
      const now = threadState(ch.state, x.person, x.t);
      if (k.base[x.id] !== undefined && now !== k.base[x.id]) {
        again[id] = true;
        continue;
      }
      if (there.s !== now) {
        setThread(ch.state, x.person, x.t, there.s);
        changed.push({ person: x.person, t: x.t, to: there.s });
        const who = whoIs(k, there.by);
        const from = who === "you" ? "your other phone" : who ? `${who}’s phone` : "another phone";
        notices.push({ id, kind: "thread", text: there.s === "snapped" ? `Your thread with ${x.person} snapped, from ${from}.` : there.s === "strained" ? `Your thread with ${x.person}’s strained now, from ${from}.` : `Your thread with ${x.person}’s whole again, from ${from}.` });
      }
      k.base[x.id] = there.s;
    }
    if (changed.length) d.saved(ch, changed);
    return changed.length > 0;
  }

  // ------------------------------------------------------------ the Worker

  async function call(method, path, body) {
    const res = await fetch(path, { method, cache: "no-store", credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, got: await res.json().catch(() => ({})) };
  }

  // What changed on the sheet, from someone else's phone, said in a line.
  function saidOf(was, now, who) {
    const by = who ? cap(who) : "Someone";
    const g0 = was.goal;
    const g = now.goal;
    if (g.done && !g0.done) return `The Goal’s done. ${by} took it past d12.`;
    if (g.text !== g0.text && g.die === 2 && !g.done && g0.done) return `${by} wrote the next Goal: ${bare(g.text)}.`;
    if (g.die !== g0.die) return `${by} ${g.die > g0.die ? "took the Goal up" : "knocked the Goal back"} to d${g.die}.`;
    if (g.text !== g0.text) return g.text ? `${by} wrote the Goal: ${bare(g.text)}.` : `${by} rubbed out the Goal’s words.`;
    if (now.name !== was.name) return now.name ? `${by} named the crew ${bare(now.name)}.` : `${by} rubbed out the crew’s name.`;
    for (const l of LISTS) {
      const before = new Map(was[l].map((x) => [x.id, x]));
      const after = new Map(now[l].map((x) => [x.id, x]));
      const added = now[l].find((x) => !before.has(x.id));
      if (added) return `${by} added ${bare(added.text)} to the party sheet.`;
      const gone = was[l].find((x) => !after.has(x.id));
      if (gone) return `${by} took ${bare(gone.text)} off the party sheet.`;
      if (l === "projects") {
        const moved = now.projects.find((x) => before.get(x.id) && (before.get(x.id).die !== x.die || before.get(x.id).done !== x.done));
        if (moved) return moved.done ? `${bare(moved.text)} is done. ${by} took it past d12.` : `${by} took ${bare(moved.text)} to d${moved.die}.`;
      }
    }
    return JSON.stringify(content(was)) === JSON.stringify(content(now)) ? "" : `${by} changed the party sheet.`;
  }
  // What's written on the sheet, without who changed it last or when.
  const content = (doc) => ({ name: doc.name, goal: doc.goal, ...Object.fromEntries(LISTS.map((l) => [l, doc[l]])) });
  // What lights up for a moment when someone else changes it.
  function litOf(was, now) {
    const lit = [];
    if (JSON.stringify(was.goal) !== JSON.stringify(now.goal)) lit.push("goal");
    if (was.name !== now.name) lit.push("name");
    for (const l of LISTS) {
      const before = new Map(was[l].map((x) => [x.id, JSON.stringify(x)]));
      for (const x of now[l]) if (before.get(x.id) !== JSON.stringify(x)) lit.push(`${l}:${x.id}`);
    }
    return lit;
  }

  // was is the sheet this phone was showing before the Worker answered, with
  // its own changes in, so only someone else's show up as news.
  function take(id, k, got, was) {
    const hadAt = k.doc?.at ?? 0;
    // The first time this phone sees a campaign's sheet, nothing's news.
    const known = k.doc != null || k.v !== "";
    k.doc = got.party ?? null;
    k.pv = Number(got.pv) || 0;
    k.v = typeof got.v === "string" ? got.v : "";
    k.crew = Array.isArray(got.crew) ? got.crew : [];
    k.gm = got.gm ?? null;
    k.bonds = Object.fromEntries((Array.isArray(got.bonds) ? got.bonds : []).map((b) => [b.id, b]));
    k.at = Date.now();
    const now = docOf(id);
    if (known && (k.doc?.at ?? 0) > hadAt) {
      const said = saidOf(was, now, k.doc?.by && k.doc.by !== me() ? whoIs(k, k.doc.by) : "");
      if (said) {
        lit[id] = litOf(was, now);
        notices.push({ id, kind: "sheet", text: said });
      }
    }
  }

  // One campaign's party sheet and threads, sent and fetched. Only one at a
  // time for each campaign, and one asked for while it's going runs after.
  async function syncNow(id) {
    if (!id || !sync.me || sync.out || !online()) return;
    if (busy[id]) {
      again[id] = true;
      return;
    }
    busy[id] = true;
    try {
      const k = camp(id);
      const ch = myCharIn(id);
      const c = ch ? d.normal(ch) : null;
      let face = null;
      if (c) {
        noteMoves(k, ch, c);
        face = JSON.stringify(faceOf(k, ch, c));
      }
      const sending = k.out.length > 0 || (face != null && face !== k.face);
      keep();
      const path = `/api/campaigns/${encodeURIComponent(id)}/party`;
      const r = await call(sending ? "POST" : "GET", sending ? path : `${path}${k.v ? `?v=${encodeURIComponent(k.v)}` : ""}`, sending ? { dev: st.dev, ops: k.out.slice(0, 200), ...(face != null && face !== k.face ? { face: JSON.parse(face) } : {}) } : null).catch(() => ({ ok: false, status: 0, got: {} }));
      if (r.status === 401) return d.signedOut();
      if (r.status === 404) {
        delete st.k[id];
        keep();
        return d.gone(id);
      }
      // Changes the Worker can't take (the sheet's full) come off this phone,
      // with why, so they don't hold up the rest.
      if (sending && (r.status === 400 || r.status === 413)) {
        k.out = k.out.filter((o) => o.m);
        keep();
        d.toast(r.got.error || "The party sheet didn’t take that.", false);
        return d.render();
      }
      if (!r.ok) return;
      const was = docOf(id);
      if (Number.isInteger(r.got.seq)) k.out = k.out.filter((o) => o.n > r.got.seq);
      if (k.out.length) again[id] = true;
      if (sending && face != null) k.face = face;
      if (r.got.same) {
        k.at = Date.now();
        keep();
        return;
      }
      take(id, k, r.got, was);
      if (ch) {
        merge(id, k, ch);
        // Who's in the campaign decides what goes in the face, so a crew that's
        // only just come in sends it again.
        const next = JSON.stringify(faceOf(k, ch, d.normal(ch) ?? c));
        if (next !== k.face) again[id] = true;
      }
      keep();
      show(id);
    } finally {
      busy[id] = false;
      if (again[id]) {
        again[id] = false;
        setTimeout(() => syncNow(id), 50);
      }
    }
  }
  function soon(id, ms = 600) {
    if (!id) return;
    clearTimeout(soonTimers[id]);
    soonTimers[id] = setTimeout(() => syncNow(id), ms);
  }
  // Notices go out as toasts on the screens they're about, and the page redraws.
  function show(id) {
    const here = watching === id;
    const sheetOpen = d.viewing() === "party" || d.viewing() === "camp";
    const say = notices.splice(0).filter((x) => x.id === id && here && (x.kind === "thread" ? d.viewing() !== "camp" : sheetOpen)).map((x) => x.text);
    d.quietRender();
    if (say.length) d.toast(say.slice(-2).join(" "), false);
  }

  // While a campaign, or a character playing in one, is on the screen, it
  // checks for changes now and then.
  function route(view, ch) {
    load();
    const id = view.name === "camp" || view.name === "look" ? view.id : view.name === "sheet" && ch ? campOf(ch) : null;
    if (id === watching) return;
    clearInterval(timer);
    timer = 0;
    watching = id;
    ui = { editing: "", sure: "", adding: "" };
    if (!id) return;
    syncNow(id);
    timer = setInterval(() => {
      if (document.visibilityState === "visible") syncNow(id);
    }, POLL);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && watching) syncNow(watching);
  });
  // Another tab on this phone changed it: read it again before the next change.
  addEventListener("storage", (e) => {
    if (e.key === KEY) st = null;
  });
  // Back online, everything that's waiting goes up, from any campaign.
  addEventListener("online", () => {
    load();
    for (const id of Object.keys(st.k)) if (st.k[id].out.length || id === watching) syncNow(id);
  });

  // ------------------------------------------------------------ changing it

  function edit(id, ops, say, { undoable = true } = {}) {
    const k = camp(id);
    const before = docOf(id);
    const test = docOf(id);
    const did = ops.filter((op) => apply(test, op));
    if (!did.length) return false;
    const back = undoable ? did.flatMap((op, i) => undoOf(i ? docAfter(before, did.slice(0, i)) : before, op)) : [];
    if (!k.doc?.made && !k.out.some((o) => o.o === "start")) k.out.push({ n: ++st.n, o: "start", res: P.start.res, assets: P.start.assets });
    for (const op of did) k.out.push({ ...op, n: ++st.n });
    keep();
    if (back.length) {
      undos.push({ id, ops: back.reverse() });
      if (undos.length > 30) undos.shift();
    }
    ui.sure = "";
    d.render();
    soon(id);
    if (say) d.toast(say, back.length ? "pundo" : false);
    return true;
  }
  const docAfter = (doc, ops) => {
    const copy = structuredClone(doc);
    for (const op of ops) apply(copy, op);
    return copy;
  };
  function undo() {
    const u = undos.pop();
    if (!u) return;
    edit(u.id, u.ops, "", { undoable: false });
    d.toast("Undone.", false);
  }

  const goalSay = (doc, op) => {
    const g = docAfter(doc, [op]).goal;
    if (g.done) return "The Goal climbed past d12, so the crew’s done it.";
    if (op.by === -1) return doc.goal.done ? "Not done yet. The Goal’s back at d12." : `A setback. The Goal’s back to d${g.die}.`;
    return `The Goal’s at d${g.die} now.`;
  };

  const ACT = {
    climb(el, id) {
      const doc = docOf(id);
      const by = Number(el.dataset.by) === -1 ? -1 : 1;
      const pid = el.dataset.id || null;
      const op = { o: "climb", by, ...(pid ? { id: pid } : {}) };
      if (!pid) return edit(id, [op], goalSay(doc, op));
      const p = doc.projects.find((x) => x.id === pid);
      if (!p) return;
      const next = docAfter(doc, [op]).projects.find((x) => x.id === pid);
      edit(id, [op], next.done ? `${bare(p.text)} is done, so what you wrote happens.` : by === -1 ? `A setback. ${bare(p.text)} is back to d${next.die}.` : `${bare(p.text)} is at d${next.die} now.`);
    },
    die(el, id) {
      const v = Number(el.dataset.v);
      edit(id, [{ o: "die", v }], `The Goal’s at d${v}.`);
    },
    edit(el) {
      ui.editing = ui.editing === el.dataset.k ? "" : el.dataset.k;
      ui.sure = "";
      d.render();
      requestAnimationFrame(() => document.querySelector(`[data-pk="${CSS.escape(el.dataset.k)}"] input:not([type=checkbox])`)?.focus());
    },
    cancel() {
      ui.editing = "";
      ui.sure = "";
      d.render();
    },
    drop(el, id) {
      const key = `${el.dataset.l}:${el.dataset.id}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return d.render();
      }
      const item = docOf(id)[el.dataset.l]?.find((x) => x.id === el.dataset.id);
      ui.editing = "";
      if (item) edit(id, [{ o: "drop", l: el.dataset.l, id: item.id }], `Off the party sheet: ${bare(item.text)}.`);
    },
    pick(el, id) {
      const a = P.assets[Number(el.dataset.i)];
      if (!a) return;
      edit(id, [{ o: "add", l: "assets", item: { id: newId(), text: a.name, does: a.does, power: a.power } }], `On the party sheet: ${bare(a.name)}.${a.power ? " It adds Power." : ""}`);
    },
    paid(el, id) {
      const a = docOf(id).assets.find((x) => x.id === el.dataset.id);
      if (!a) return;
      edit(id, [{ o: "edit", l: "assets", id: a.id, f: "off", v: !a.off }], a.off ? `${bare(a.text)} counts again, now something’s paying for it.` : `${bare(a.text)} stops counting till something pays for it.`);
    },
    camp(el, id, e) {
      e.preventDefault();
      d.go(`/characters/?camp=${encodeURIComponent(id)}`);
    },
  };

  function act(el, e) {
    const id = el.closest("[data-pt]")?.dataset.pt;
    if (el.dataset.do === "undo") return undo();
    if (!id) return;
    ACT[el.dataset.do]?.(el, id, e);
  }

  function submit(kind, form, f) {
    const id = form.closest("[data-pt]")?.dataset.pt;
    if (!id) return;
    const doc = docOf(id);
    const text = (name, max = MAX.line) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    ui.editing = "";
    if (kind === "p-name") {
      const v = text("name", MAX.name);
      if (!edit(id, [{ o: "name", v }], v ? `The crew’s called ${bare(v)} now.` : "The crew’s got no name again.")) d.render();
    } else if (kind === "p-goal") {
      const v = text("goal", MAX.goal);
      if (!edit(id, [{ o: "goal", v }], v ? `The Goal: ${bare(v)}.` : "The Goal’s words are rubbed out.")) d.render();
    } else if (kind === "p-next") {
      const v = text("goal", MAX.goal);
      if (!v) return d.toast("Write the next Goal first.", false);
      edit(id, [{ o: "next", v }], `The next Goal’s at d2: ${bare(v)}.`);
    } else if (kind === "p-add") {
      const l = form.dataset.l;
      if (!LISTS.includes(l)) return;
      const item = { id: newId(), text: text("text", l === "assets" ? MAX.asset : l === "changed" ? MAX.goal : MAX.line) };
      if (!item.text) return d.toast("Write it in first.", false);
      if (l === "assets") Object.assign(item, { does: text("does", MAX.does), power: f.get("power") === "on" });
      if (l === "projects") Object.assign(item, { then: text("then", MAX.then), die: Number(f.get("die")) || 2 });
      const max = l === "projects" ? MAX.projects : MAX.list;
      if (doc[l].length >= max) return d.toast(`That’s ${max} ${NAMES[l][1]} already, which is as many as the sheet holds. Take one off first.`, false);
      if (edit(id, [{ o: "add", l, item }], `On the party sheet: ${bare(item.text)}.`)) form.reset();
    } else if (kind === "p-line") {
      const l = form.dataset.l;
      const item = doc[l]?.find((x) => x.id === form.dataset.id);
      if (!item) return d.render();
      const ops = [];
      const put = (field, v) => {
        if (v !== item[field]) ops.push({ o: "edit", l, id: item.id, f: field, v });
      };
      put("text", text("text", l === "assets" ? MAX.asset : l === "changed" ? MAX.goal : MAX.line));
      if (l === "assets") {
        put("does", text("does", MAX.does));
        put("power", f.get("power") === "on");
      }
      if (l === "projects") {
        put("then", text("then", MAX.then));
        const die = Number(f.get("die"));
        if (die && die !== item.die) ops.push({ o: "die", id: item.id, v: die });
      }
      if (!ops.length || !edit(id, ops, "Changed on the party sheet.")) d.render();
    }
  }

  // ------------------------------------------------------------ drawing it

  const fold = (key, title, glance, body, lit = false) => {
    const k = `pt-${key}`;
    return `<details class="cc-fold pt-fold${lit ? " is-new" : ""}" data-open="${k}"${d.isOpen(k) ? " open" : ""}><summary><h3 class="cc-fold-t">${title}</h3><span class="cc-fold-g">${glance}</span></summary><div class="cc-fold-b">${body}</div></details>`;
  };
  const few = (items, max) => (items.length > max ? `${items.slice(0, max).join(" · ")} <small>and ${items.length - max} more</small>` : items.join(" · "));
  // A rule from the book, opened on a tap, with no signal needed.
  const ruleLink = (id, text) => `<button type="button" class="pt-reword pt-rule" data-act="rule" data-r="${id}">${text}</button>`;

  // A line on one of the lists: its words, and Change, which opens it up to
  // rewrite or take off the sheet.
  function lineView(id, l, x, k, extra = "") {
    const key = `${l}:${x.id}`;
    const glow = lit[id].includes(key) ? " is-new" : "";
    if (ui.editing === key) return `<li class="pt-line is-editing" data-pk="${esc(key)}">${lineForm(l, x)}</li>`;
    const body = l === "assets"
      ? `<p><b>${esc(x.text)}</b>${x.power && !/^\+1 Power/.test(x.does) ? ' <span class="chip sm pt-chip">+1 Power</span>' : ""}${x.off ? ' <span class="chip sm pt-chip is-off">Nothing’s paying for it</span>' : ""}</p>${x.does ? `<p class="pt-does">${esc(x.does)}</p>` : ""}`
      : `<p>${l === "reps" ? `<em>${esc(x.text)}</em>` : esc(x.text)}</p>`;
    return `<li class="pt-line${glow}${x.off ? " is-off" : ""}" data-pk="${esc(key)}"><div class="pt-line-in">${body}${extra}</div><button type="button" class="button sm pt-change" data-act="p" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(x.text)}">Change</button></li>`;
  }
  function lineForm(l, x) {
    const sure = ui.sure === `${l}:${x.id}`;
    const words = l === "assets" ? "What it’s called" : l === "projects" ? "What it is" : "Its words";
    const extra = l === "assets"
      ? `<label class="cc-field">What it does <input name="does" maxlength="${MAX.does}" autocomplete="off" value="${esc(x.does)}"></label>
        <label class="pt-check"><input type="checkbox" name="power"${x.power ? " checked" : ""}> It adds Power (people who turn up when the crew calls)</label>`
      : l === "projects"
        ? `<label class="cc-field">What happens when it’s done <input name="then" maxlength="${MAX.then}" autocomplete="off" value="${esc(x.then)}"></label>
          <label class="cc-field">Its die <select name="die">${SIZES.map((s) => `<option value="${s}"${s === x.die ? " selected" : ""}>d${s}</option>`).join("")}</select></label>`
        : "";
    return `<form class="cc-form pt-form" data-form="p-line" data-l="${l}" data-id="${esc(x.id)}">
      <label class="cc-field">${words} <input name="text" maxlength="${l === "assets" ? MAX.asset : MAX.line}" autocomplete="off" required value="${esc(x.text)}"></label>${extra}
      <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="p" data-do="cancel">Cancel</button>
      <button type="button" class="button danger" data-act="p" data-do="drop" data-l="${l}" data-id="${esc(x.id)}">${sure ? "Tap again to take it off" : "Take it off the sheet"}</button></div></form>`;
  }
  function addForm(l, label, hint) {
    const extra = l === "assets"
      ? `<label class="cc-field">What it does <input name="does" maxlength="${MAX.does}" autocomplete="off"></label>
        <label class="pt-check"><input type="checkbox" name="power"> It adds Power (people who turn up when the crew calls)</label>`
      : l === "projects"
        ? `<label class="cc-field">What happens when it’s done <input name="then" maxlength="${MAX.then}" autocomplete="off"></label>
          <label class="cc-field">Start it at <select name="die">${SIZES.slice(0, 5).map((s) => `<option value="${s}">d${s}</option>`).join("")}</select></label>
          <p class="cc-small">If the crew’s already partway there, start it higher: a d6, or a d10 when one more push would do it.</p>`
        : "";
    return `<form class="cc-form pt-form pt-add" data-form="p-add" data-l="${l}">
      <label class="cc-field">${label} <input name="text" maxlength="${l === "assets" ? MAX.asset : MAX.line}" autocomplete="off"${hint ? ` placeholder="${esc(hint)}"` : ""}></label>${extra}
      <div class="cc-row"><button type="submit" class="button">Add it</button></div></form>`;
  }

  // A die that climbs, with a row of its sizes to set it straight to one.
  function ladder(g) {
    return `<div class="cc-ring pt-ladder" role="group" aria-label="Set the Goal’s die">${SIZES.map((s) => `<button type="button" class="cc-ringbtn" data-act="p" data-do="die" data-v="${s}"${s === g.die && !g.done ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${kitDie(s, { label: `d${s}`, state: s === g.die ? "top" : s > g.die ? "low" : "" })}</button>`).join("")}</div>`;
  }

  // What makes a good Goal, from the book, under wherever the words are
  // written. While there's no Goal yet it's open till someone shuts it, and
  // when its words are being changed it's shut till someone opens it. The two
  // have their own keys, since a fold drawn open counts as opened.
  function goodGoal(first) {
    const k = first ? "pt-good-new" : "pt-good";
    const open = first ? !d.isShut?.(k) : d.isOpen(k);
    return `<details class="cc-rulebox pt-good" data-open="${k}"${first ? " data-shut" : ""}${open ? " open" : ""}><summary>What makes a good Goal</summary><div class="cc-rule">${d.rule("s-good-goal")}</div></details>`;
  }

  function goalView(id, doc, k) {
    const g = doc.goal;
    const glow = lit[id].includes("goal") ? " is-new" : "";
    const idea = P.goals?.[0] ?? "";
    const editing = ui.editing === "goal";
    const words = !g.text || editing
      ? `<form class="cc-form pt-form" data-form="p-goal"><label class="cc-field">${g.text ? "The Goal’s words" : "The Goal"} <input name="goal" maxlength="${MAX.goal}" autocomplete="off" required value="${esc(g.text)}"${idea ? ` placeholder="like ${esc(idea)}"` : ""}></label>
        <div class="cc-row"><button type="submit" class="button">${g.text ? "Save" : "Write it in"}</button>${editing ? '<button type="button" class="button" data-act="p" data-do="cancel">Cancel</button>' : ""}</div></form>`
      : `<p class="pt-goal-words"><em>${esc(g.text)}</em></p>`;
    if (g.done) {
      return `<div class="pt-goal card is-done${glow}" data-pk="goal">
        <div class="pt-goal-top">${kitDie(12, { label: "d12, climbed past", state: "top" })}<div><p class="pt-k">The Party Goal <span class="chip sm pt-chip">Done</span></p>${words}</div></div>
        <p><b>The crew’s done it.</b> Play the moment out, then:</p>
        <ol class="pt-steps">
          <li><p>The crew earns a Reputation, what the city says about it now.</p>
            <form class="cc-form pt-form" data-form="p-add" data-l="reps"><label class="cc-field">A new Reputation <input name="text" maxlength="${MAX.line}" autocomplete="off"${P.rep ? ` placeholder="like ${esc(P.rep)}"` : ""}></label><div class="cc-row"><button type="submit" class="button">Add it</button></div></form></li>
          <li><p>It picks two: a new resource, a new asset (it’ll need something paying for it) or a new holding. They go on below.</p></li>
          <li><p>Everyone writes a new thread, to someone the Goal brought into their life. It goes on their own sheet, with Change on the Sheet tab.</p></li>
          <li><p>Then write the next Goal, at d2.</p>
            <form class="cc-form pt-form" data-form="p-next"><label class="cc-field">The next Goal <input name="goal" maxlength="${MAX.goal}" autocomplete="off" required></label><div class="cc-row"><button type="submit" class="button primary">Start it at d2</button></div></form>${goodGoal(true)}</li>
        </ol>
        <div class="cc-row"><button type="button" class="button" data-act="p" data-do="climb" data-by="-1">Not done yet</button></div></div>`;
    }
    return `<div class="pt-goal card${glow}" data-pk="goal">
      <div class="pt-goal-top"><span class="pt-goal-die">${kitDie(g.die, { hide: true })}</span><div class="pt-goal-in"><p class="pt-k">The Party Goal <span class="pt-at">d${g.die}</span></p>${words}
        ${g.text && !editing ? `<button type="button" class="pt-reword" data-act="p" data-do="edit" data-k="goal">Change its words</button>` : ""}</div></div>
      ${!g.text || editing ? goodGoal(!g.text) : ""}
      ${ladder(g)}
      <div class="cc-row pt-climb"><button type="button" class="button" data-act="p" data-do="climb" data-by="-1"${g.die <= 2 ? " disabled" : ""}>A setback</button><button type="button" class="button primary" data-act="p" data-do="climb" data-by="1">${g.die >= 12 ? "It climbs past d12" : "It climbs"}</button></div>
      <p class="cc-lead pt-how">When the GM says it’s within reach, roll against its die, and if you beat it, it climbs.</p>${ruleLink("s-goal", "How the Goal works")}</div>`;
  }

  function projectView(id, p, k) {
    const key = `projects:${p.id}`;
    if (ui.editing === key) return `<li class="pt-line is-editing" data-pk="${esc(key)}">${lineForm("projects", p)}</li>`;
    const glow = lit[id].includes(key) ? " is-new" : "";
    return `<li class="pt-project${p.done ? " is-done" : ""}${glow}" data-pk="${esc(key)}">
      <div class="pt-project-top">${kitDie(p.die, { label: p.done ? `d${p.die}, done` : `d${p.die}`, state: p.done ? "top" : "" })}<div class="pt-line-in"><p><b>${esc(p.text)}</b>${p.done ? ' <span class="chip sm pt-chip">Done</span>' : ""}</p>
        ${p.then ? `<p class="pt-does">${p.done ? "It happens:" : "When it’s done:"} ${esc(p.then)}</p>` : ""}</div></div>
      <div class="cc-row">${p.done ? `<button type="button" class="button" data-act="p" data-do="climb" data-by="-1" data-id="${esc(p.id)}">Not done yet</button>`
        : `<button type="button" class="button sm" data-act="p" data-do="climb" data-by="-1" data-id="${esc(p.id)}"${p.die <= 2 ? " disabled" : ""}>A setback</button><button type="button" class="button sm" data-act="p" data-do="climb" data-by="1" data-id="${esc(p.id)}">${p.die >= 12 ? "It climbs past d12" : "It climbs"}</button>`}
        <button type="button" class="button sm" data-act="p" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(p.text)}">Change</button></div></li>`;
  }

  // The party sheet, as Appendix A lays out the crew page, with the Goal at
  // the top since it's what the table reaches for most.
  function sheet(id, { tab = false } = {}) {
    load();
    const k = camp(id);
    const doc = docOf(id);
    const steps = powerOf(doc);
    const dice = stepsToDice(steps);
    const power = dice[0];
    const adds = doc.assets.filter((a) => a.power && !a.off).length;
    const money = moneyOf(doc);
    const waiting = k.out.filter((o) => !o.m).length;
    const status = [
      !online() ? (k.at ? `No signal, so this is the party sheet as it was at ${time(k.at)}.` : "No signal, and this phone hasn’t seen this party sheet yet.") : "",
      waiting ? (online() ? "Sending your changes…" : `${waiting === 1 ? "Your change goes" : "Your changes go"} up when you’ve got a signal.`) : "",
      doc.by && doc.at ? `Last changed by ${esc(whoIs(k, doc.by) || "someone")} at ${time(doc.at)}.` : "",
    ].filter(Boolean).join(" ");

    const nameEditing = ui.editing === "name";
    const crew = `<div class="pt-crew card${lit[id].includes("name") ? " is-new" : ""}" data-pk="name">
      <div class="pt-crew-in"><p class="pt-k">The crew</p>
        ${nameEditing ? `<form class="cc-form pt-form" data-form="p-name"><label class="cc-field">The crew’s name <input name="name" maxlength="${MAX.name}" autocomplete="off" value="${esc(doc.name)}"></label>
          <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="p" data-do="cancel">Cancel</button></div></form>`
          : `<p class="pt-name${doc.name ? "" : " is-none"}">${doc.name ? esc(doc.name) : "No name yet"}</p><button type="button" class="pt-reword" data-act="p" data-do="edit" data-k="name">${doc.name ? "Rename it" : "Name the crew"}</button>`}
      </div>
      <div class="pt-power" role="img" aria-label="Power ${dice.map((x) => `d${x}`).join(" and ")}">${dice.map((x) => kitDie(x, { hide: true, cls: x === power ? "" : "is-next" })).join("")}<span class="pt-power-k">Power</span><span class="pt-power-v">${dice.map((x) => `d${x}`).join(" + ")}</span></div>
      <p class="pt-size">${esc(steps <= 6 ? P.sizes?.[power] ?? "" : P.sizes?.[12] ?? "")} <small>${adds ? `1 step, plus ${adds} for ${adds === 1 ? "an asset that adds" : "assets that add"} Power.` : "1 step, and no assets that add Power yet."}</small></p></div>`;

    const moneyLine = money.short
      ? `<p class="pt-money is-short">${money.res} ${money.res === 1 ? "resource" : "resources"} and ${money.paying} ${money.paying === 1 ? "asset" : "assets"}, so ${money.short === 1 ? "one asset isn’t" : `${money.short} assets aren’t`} paid for. Tap Nothing’s paying for it on the one the crew picks, and it stops counting till something pays for it.</p>`
      : money.extra
        ? `<p class="pt-money">${money.res} ${money.res === 1 ? "resource" : "resources"} paying for ${money.paying} ${money.paying === 1 ? "asset" : "assets"}, so ${money.extra === 1 ? "there’s 1 extra resource" : `there are ${money.extra} extra resources`} to spend this downtime.</p>`
        : money.res ? `<p class="pt-money">${money.res} ${money.res === 1 ? "resource pays" : "resources pay"} for ${money.paying} ${money.paying === 1 ? "asset" : "assets"}, so there’s no extra resource yet.</p>` : "";

    const list = (l, items, extra = () => "") => (items.length ? `<ul class="pt-lines">${items.map((x) => lineView(id, l, x, k, extra(x))).join("")}</ul>` : "");
    const listLit = (l) => lit[id].some((x) => x.startsWith(`${l}:`));
    const none = "None yet";

    const reps = fold("reps", "Reputations", doc.reps.length ? few(doc.reps.map((x) => `<em>${esc(x.text)}</em>`), 3) : none,
      `<p class="cc-lead">What the city says about the crew, one line each${P.rep ? `, like <em>${esc(P.rep)}</em>` : "."} Each one’s a step on any crew roll it fits, and the crew earns one every time a Goal’s done.</p>
      ${list("reps", doc.reps)}${addForm("reps", "A new Reputation", "")}`, listLit("reps"));

    const res = fold("res", "Resources", doc.res.length ? `${few(doc.res.map((x) => esc(x.text)), 4)}${money.extra ? ` <small>· ${money.extra} extra</small>` : ""}` : none,
      `<p class="cc-lead">Where the crew’s money comes from, one line each. Every asset needs one paying for it, every downtime, and one that isn’t paying for anything is an extra resource.</p>
      ${moneyLine}${list("res", doc.res)}${addForm("res", "A new resource", "")}`, listLit("res"));

    const assets = fold("assets", "Assets", doc.assets.length ? `${few(doc.assets.map((x) => (x.off ? `<s>${esc(x.text)}</s>` : esc(x.text))), 4)}${money.short ? " <small>· not all paid for</small>" : ""}` : none,
      `<p class="cc-lead">What the crew can do, one line each, with what it does. One that’s people who’ll turn up when the crew calls adds Power, and one with nothing paying for it stops counting till something does.</p>
      ${moneyLine}${list("assets", doc.assets, (a) => `<div class="cc-row"><button type="button" class="button sm" data-act="p" data-do="paid" data-id="${esc(a.id)}" aria-pressed="${a.off}">${a.off ? "Something’s paying for it again" : "Nothing’s paying for it"}</button></div>`)}
      ${addForm("assets", "A new asset of the crew’s own", "")}<p class="cc-small">Or pick one of the twelve, under Crew assets to pick from.</p>`, listLit("assets"));

    const grows = fold("grows", "How it grows · What an extra resource can buy", "When the Goal’s done, a Reputation and two picks",
      `<div class="pt-rules"><h4>How it grows</h4>${d.rule("s-crew-grows")}<h4>What an extra resource can buy</h4>${d.rule("s-crew-wealth")}</div>`);

    const projects = fold("projects", "Projects", doc.projects.length ? `<span class="cc-gl-wrap">${doc.projects.map((p) => `<span class="cc-gl">${kitMini(p.die)}${esc(p.text)} <small>${p.done ? "done" : `d${p.die}`}</small></span>`).join("")}</span>` : none,
      `<p class="cc-lead">Anything the crew, or one of them, sets out to build or bring about over time. It starts at d2 and climbs like the Goal, and past d12 it’s done and what you wrote happens. Keep two or three on the go, at most.</p>${ruleLink("s-projects", "How projects work")}
      ${doc.projects.length ? `<ul class="pt-lines">${doc.projects.map((p) => projectView(id, p, k)).join("")}</ul>` : ""}
      ${doc.projects.length >= 3 ? '<p class="cc-small">Any more than two or three and none of them gets anywhere.</p>' : ""}
      ${doc.projects.length < MAX.projects ? addForm("projects", "A new project: what it is", "") : ""}`, listLit("projects"));

    // Every player's Aspiration, read off their own sheets: this phone's
    // player's straight off theirs, and everyone else's as their phone shared it.
    const mineCh = myCharIn(id);
    const mineC = mineCh ? d.normal(mineCh) : null;
    const asps = k.crew.filter((m) => m.character).map((m) => {
      const own = m.id === me() && mineC;
      const a = own ? { text: mineCh.state.aspText || mineC.aspiration?.text || "", die: mineCh.state.asp } : m.asp;
      return { name: m.character.name, player: m.id === me() ? "you" : first(m.name), a };
    });
    const aspsFold = fold("asps", "Aspirations", asps.length ? `<span class="cc-gl-wrap">${asps.map((x) => `<span class="cc-gl">${x.a ? kitMini(x.a.die) : ""}${esc(x.name)} <small>${x.a ? `d${x.a.die}` : "not shared yet"}</small></span>`).join("")}</span>` : online() ? "Nobody’s playing in it yet" : "They show up when you’ve got a signal",
      `<p class="cc-lead">Every player’s, where everyone can see them. Each one changes on its player’s own sheet.</p>
      ${asps.length ? `<ul class="pt-lines">${asps.map((x) => `<li class="pt-line pt-asp">${x.a ? kitMini(x.a.die) : ""}<div class="pt-line-in"><p><b>${esc(x.name)}</b> <small>${esc(x.player)}${x.a ? ` · d${x.a.die}` : ""}</small></p><p>${x.a ? `<em>${esc(x.a.text)}</em>` : "Shows up when their phone’s opened the campaign."}</p></div></li>`).join("")}</ul>` : ""}`);

    const holdings = fold("holdings", "Party holdings", doc.holdings.length ? few(doc.holdings.map((x) => esc(x.text)), 4) : none,
      `<p class="cc-lead">Big things the crew owns together, like a horse, a cart, a small boat or a house. Whoever’s using one can bring it into a roll it fits for 1 Aura, the same as the ground. Nothing has to pay for a holding.</p>
      ${list("holdings", doc.holdings)}${addForm("holdings", "A new holding", "like a horse and cart")}`, listLit("holdings"));

    const people = fold("people", "People the crew relies on", doc.people.length ? few(doc.people.map((x) => esc(x.text)), 4) : none,
      `<p class="cc-lead">The people the crew leans on${P.people ? `, like ${esc(P.people.charAt(0).toLowerCase() + P.people.slice(1))}` : "."}</p>
      ${list("people", doc.people)}${addForm("people", "Someone the crew relies on", "")}`, listLit("people"));

    const changed = fold("changed", "What has changed", doc.changed.length ? few(doc.changed.map((x) => esc(x.text)), 2) : "Nothing yet",
      `<p class="cc-lead">A line for every faction’s agenda that’s happened: how the world’s changed, in one sentence. The GM writes it when it happens.</p>
      ${list("changed", doc.changed)}${addForm("changed", "Something that’s changed in the world", "")}`, listLit("changed"));

    const onSheet = new Set(doc.assets.map((a) => a.text.toLowerCase()));
    const pick = fold("pick", "Crew assets to pick from", "All twelve, for when the crew grows",
      `${d.rule("s-crew-tags")}<ul class="pt-lines">${(P.assets ?? []).map((a, i) => `<li class="pt-line pt-pick"><div class="pt-line-in"><p><b>${esc(a.name)}</b></p><p class="pt-does">${esc(a.does)}</p></div>
        ${onSheet.has(a.name.toLowerCase()) ? '<span class="chip sm pt-chip is-on">On the sheet</span>' : `<button type="button" class="button sm" data-act="p" data-do="pick" data-i="${i}" aria-label="Put ${esc(a.name)} on the party sheet">Add it</button>`}</li>`).join("")}</ul>`);

    lit[id] = [];
    return `<section class="cc-sec pt" data-pt="${esc(id)}" aria-labelledby="pt-h-${esc(id)}">
      <h2 id="pt-h-${esc(id)}"${tab ? ' class="sr-only"' : ""}>The party sheet</h2>${status ? `<p class="cc-small pt-status">${status}</p>` : ""}
      ${goalView(id, doc, k)}
      ${crew}
      <div class="cc-folds pt-folds">${reps}${res}${assets}${grows}${projects}${aspsFold}${holdings}${people}${changed}${pick}</div>
      ${tab ? "" : `<p class="cc-small">Everyone in the campaign can change it, and it changes on every phone in it.</p>`}</section>`;
  }

  // The Party tab of a character who's playing in a campaign.
  function tabView(ch) {
    const id = campOf(ch);
    if (!id) return `<div class="cc-note"><p>${esc(ch.name)} isn’t playing in a campaign on this phone.</p></div>`;
    const item = d.list()?.find((x) => x.id === id);
    const name = item?.name ?? "the campaign";
    return `<div class="pt-tab" data-pt="${esc(id)}"><p class="cc-small pt-where">${esc(ch.name)} plays in <a href="/characters/?camp=${encodeURIComponent(id)}" data-act="p" data-do="camp">${esc(name)}</a>${item?.gm ? `, run by ${esc(item.gm)}` : ""}.</p>
      ${sheet(id, { tab: true })}</div>`;
  }

  // The Goal's die grows into its new shape when it moves.
  function after(app) {
    for (const el of app.querySelectorAll(".pt[data-pt]")) {
      const id = el.dataset.pt;
      const svg = el.querySelector(".pt-goal-die .zd-die");
      const now = Number(svg?.dataset.d) || null;
      const was = shown[id];
      shown[id] = now;
      if (was && now && was !== now) growDie(svg, was, now);
    }
  }

  // ------------------------------------------------------------ for the rest of the companion

  // The threads in a campaign for one character, for its Sheet tab: whether
  // a name's someone else in the campaign, and the threads that are only on
  // their sheet, in their words.
  function threadsOf(ch, c) {
    const id = campOf(ch);
    if (!id) return null;
    const k = camp(id);
    const mates = matesOf(k);
    const extra = [];
    for (const x of sharedOf(k, ch, c)) {
      if (x.own) continue;
      let p = extra.find((y) => y.person === x.person);
      if (!p) extra.push((p = { person: x.person, threads: [] }));
      p.threads.push(x.t);
    }
    const item = d.list()?.find((x) => x.id === id);
    return { id, name: item?.name ?? "the campaign", mate: (person) => Boolean(mateFor(person, mates, mateName)), extra };
  }
  // A thread on the GM's look at a player's character, where the campaign
  // has it, which can be ahead of what their phone last sent.
  function bondFor(id, who, charId, person, t) {
    load();
    const k = st.k[id];
    if (!k) return null;
    const m = mateFor(person, k.crew.filter((x) => x.id !== who && x.character), mateName);
    if (!m) return null;
    return k.bonds[bondId(`${who}:${charId}`, `${m.id}:${m.character.id}`, t.text)]?.s ?? null;
  }

  return {
    sheet,
    tabView,
    after,
    act,
    submit,
    route,
    campOf,
    threadsOf,
    bondFor,
    undo,
    // The Party Goal, for printing a character's sheet.
    goalOf(ch) {
      const id = campOf(ch);
      return id ? docOf(id).goal : null;
    },
    goalIn: (id) => docOf(id).goal,
    // The crew's own card, for the top of the faction board (world.js), and
    // its resources and assets, for a mini faction of its own.
    crewIn(id) {
      const doc = docOf(id);
      return { name: doc.name, steps: powerOf(doc), reps: doc.reps.length, assets: doc.assets.length, money: moneyOf(doc), res: doc.res, list: doc.assets };
    },
    // Changes from the faction turn (world.js): a line on What has changed,
    // and a resource and an asset handed to a mini faction of the crew's own.
    // They go up like any change here, and what puts them back comes back, for
    // the world's Undo.
    change(id, ops) {
      const before = docOf(id);
      const test = docOf(id);
      const did = ops.filter((op) => apply(test, op));
      if (!did.length) return null;
      const back = did.flatMap((op, i) => undoOf(i ? docAfter(before, did.slice(0, i)) : before, op)).reverse();
      const kk = camp(id);
      if (!kk.doc?.made && !kk.out.some((o) => o.o === "start")) kk.out.push({ n: ++st.n, o: "start", res: P.start.res, assets: P.start.assets });
      for (const op of did) kk.out.push({ ...op, n: ++st.n });
      keep();
      soon(id);
      return back;
    },
    // The party sheet fetched once, for a screen that shows the crew's card
    // without keeping the sheet in step.
    peek(id) {
      soon(id, 50);
    },
    // A character's been saved here, so anything it changed in a campaign
    // goes up a moment later.
    soon(ch) {
      soon(campOf(ch));
    },
    drop(id) {
      load();
      delete st.k[id];
      keep();
    },
    // Only the campaigns this phone's player is still in.
    keepOnly(ids) {
      load();
      for (const id of Object.keys(st.k)) if (!ids.includes(id)) delete st.k[id];
      keep();
    },
  };
}
