// A campaign's world on every phone in it, starting with the faction board
// (stage 1 of notes/worlds-plan.md).
//
// The World screen's off a campaign's page (/characters/?camp=<id>&world, and
// &f=<faction> for one faction's page), and a character playing in a campaign
// has it on its World tab. The board's the crew's own card from the party
// sheet, then every faction as a card. Only the GM changes it. Her changes go
// to the Worker (src/worker/world.js) as soon as there's a signal, numbered, so
// nothing's lost with no signal and nothing counts twice. Everything starts
// hidden from the crew: she shows them a faction in a tap, then each part of
// it in its own tap, and a player's phone only ever gets what's been shown.
// Players' phones check for anything new every 15 seconds while it's open.
//
// A faction she brought in from the book remembers the book's card as it was,
// so when the book changes it she gets a note and picks: take the book's
// changes, or keep hers. Typo fixes go in quietly.
//
//   zi-world  for the account signed in on this phone: this phone's own id
//             (dev), the number of its last change, and for each campaign
//             its board as the Worker last sent it and any changes still to go
//             up. Each campaign's kept apart, and it all goes when the
//             account's characters leave the phone (sync.js).
import { BONDS, MAX, OUTCOMES, PARTS, apply, blank, find, minisOf, moneyOf, readable, standingOf, stepsOf, undoOf } from "./board.js";
import { diceLabel, rollDie, stepsToDice } from "./dice.js";
import { typo } from "./marks.js";
import { die as kitDie, mini as kitMini } from "../kit/kit.js";

const KEY = "zi-world";
const POLL = 15000;
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
// Words someone wrote, put inside a sentence, without a full stop of their own.
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const keyOf = (t) => String(t ?? "").normalize("NFKD").toLowerCase().replace(/['’‘`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const ago = (die) => ({ 2: "years off", 4: "a season or more away", 6: "a month or two away", 8: "a week or two away", 10: "days away", 12: "any day now" })[die] ?? "";

// What each part of a card's called, and the lists in it.
const PART_NAMES = { card: "it", power: "its Power", res: "its resources", assets: "its other assets", agenda: "its agendas", bonds: "its bonds", threads: "its threads", secret: "its Secret" };
const STANDING = { friendly: "Friendly to the crew", business: "Does business with the crew", hostile: "Hostile to the crew" };

export function makeWorld(d) {
  const { esc, sync } = d;
  const W = d.W ?? { boards: [], build: { what: [], how: [], agendas: [] }, sizes: [], assets: [], link: "" };
  let st = null;
  let ui = { editing: "", sure: "", note: "" };
  const undos = [];
  const notices = [];
  let watching = null;
  let onCamp = null;
  let timer = 0;
  const soonTimers = {};
  const busy = {};
  const again = {};
  // What's just been shown to a player, lit for one redraw.
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
    st.k[id] ??= { doc: null, v: "", at: 0, role: null, out: [] };
    lit[id] ??= [];
    return st.k[id];
  };
  const item = (id) => d.list()?.find((x) => x.id === id) ?? null;
  const roleIn = (id) => item(id)?.role ?? d.campaign(id)?.campaign?.role ?? (st?.k[id]?.role || null);
  const isGm = (id) => roleIn(id) === "gm";
  const nameOf = (id) => item(id)?.name ?? d.campaign(id)?.campaign?.name ?? "the campaign";
  const gmName = (id) => first(item(id)?.gm ?? d.campaign(id)?.campaign?.gm ?? "") || "Your GM";

  // The board as everyone will see it once this phone's changes are in.
  function docOf(id) {
    const k = camp(id);
    const doc = k.doc ? readable(structuredClone(k.doc)) : blank();
    for (const o of k.out) apply(doc, o);
    return doc;
  }

  // ------------------------------------------------------------ in step with the Worker

  async function call(method, path, body) {
    const ctl = new AbortController();
    const stop = setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await fetch(path, { method, cache: "no-store", credentials: "same-origin", signal: ctl.signal, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      return { ok: res.ok, status: res.status, got: await res.json().catch(() => ({})) };
    } finally {
      clearTimeout(stop);
    }
  }

  // What's new for a player: a faction they've just been shown, or a part of one.
  function newsOf(id, was, now) {
    const said = [];
    const keys = [];
    const before = new Map(was.factions.map((f) => [f.id, f]));
    for (const f of now.factions) {
      const b = before.get(f.id);
      if (!b) {
        said.push(`${gmName(id)} showed you ${bare(f.name)}.`);
        keys.push(f.id);
        continue;
      }
      const parts = PARTS.filter((p) => f.shown[p] && !b.shown[p]);
      if (parts.length) {
        said.push(parts.length === 1 ? `You’ve found out ${bare(f.name)}’s ${PART_NAMES[parts[0]].replace(/^its /, "")}.` : `You’ve found out more about ${bare(f.name)}.`);
        keys.push(f.id);
      }
    }
    return { said, keys };
  }

  function take(id, k, got) {
    const was = k.doc ? readable(structuredClone(k.doc)) : null;
    k.doc = got.world ?? null;
    k.v = typeof got.v === "string" ? got.v : "";
    k.role = got.role === "gm" || got.role === "player" ? got.role : k.role;
    k.at = Date.now();
    if (k.role !== "gm" && was && k.doc) {
      const news = newsOf(id, was, readable(structuredClone(k.doc)));
      if (news.said.length) {
        lit[id] = news.keys;
        notices.push({ id, text: news.said.slice(-2).join(" ") });
      }
    }
  }

  // One campaign's board, sent and fetched. Only one at a time for each
  // campaign, and one asked for while it's going runs after.
  async function syncNow(id) {
    if (!id || !sync.me || sync.out || !online()) return;
    if (busy[id]) {
      again[id] = true;
      return;
    }
    busy[id] = true;
    try {
      const k = camp(id);
      const sending = k.out.length > 0;
      const path = `/api/campaigns/${encodeURIComponent(id)}/world`;
      // Changes go up in batches the Worker takes, and after one it couldn't,
      // one at a time, so only that one's lost.
      const batch = [];
      let size = 0;
      for (const o of k.out) {
        size += JSON.stringify(o).length;
        if (batch.length && (size > 100000 || batch.length >= 200 || k.solo)) break;
        batch.push(o);
      }
      const r = await call(sending ? "POST" : "GET", sending ? path : `${path}${k.v ? `?v=${encodeURIComponent(k.v)}` : ""}`, sending ? { dev: st.dev, ops: batch } : null).catch(() => ({ ok: false, status: 0, got: {} }));
      if (r.status === 401) return d.signedOut();
      if (r.status === 404) {
        delete st.k[id];
        keep();
        return d.gone(id);
      }
      // A change the Worker can't take (the board's full) comes off this
      // phone, with why, so it doesn't hold up the rest. In a batch it's found
      // by sending them one at a time. If the board's not hers to change any
      // more, none of them can go.
      if (sending && (r.status === 400 || r.status === 403 || r.status === 413)) {
        if (r.status !== 403 && batch.length > 1) {
          k.solo = true;
          again[id] = true;
          return;
        }
        k.out = r.status === 403 ? [] : k.out.filter((o) => o !== batch[0]);
        keep();
        d.toast(r.got.error || "The board didn’t take that.", false);
        if (k.out.length) again[id] = true;
        return d.render();
      }
      if (!r.ok) return;
      if (sending && !k.out.some((o) => o.n > batch[batch.length - 1].n)) delete k.solo;
      if (Number.isInteger(r.got.seq)) k.out = k.out.filter((o) => o.n > r.got.seq);
      if (k.out.length) again[id] = true;
      if (r.got.same) {
        k.at = Date.now();
        keep();
        return;
      }
      take(id, k, r.got);
      keep();
      if (k.role === "gm") quietBook(id);
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
  function show(id) {
    const say = notices.splice(0).filter((x) => x.id === id && watching === id).map((x) => x.text);
    d.quietRender();
    if (say.length) d.toast(say.slice(-2).join(" "), false);
  }

  // The campaign a view's about: the World screen's, a World tab's, or the
  // campaign page's (fetched once there, for its glance).
  let started = false;
  function route(view, ch) {
    load();
    // Changes left waiting on this phone go up as soon as any page of the
    // companion opens, not only that campaign's.
    if (!started && sync.me) {
      started = true;
      for (const id of Object.keys(st.k)) if (st.k[id].out.length) soon(id, 800);
    }
    const tab = view.name === "sheet" && ch && d.viewing() === "world" ? d.campOf(ch) : null;
    const id = view.name === "world" ? view.id : tab;
    const campId = view.name === "camp" ? view.id : null;
    if (campId && campId !== onCamp) soon(campId, 300);
    onCamp = campId;
    if (id === watching) return;
    clearInterval(timer);
    timer = 0;
    watching = id;
    ui = { editing: "", sure: "", note: "" };
    if (!id) return;
    syncNow(id);
    d.peek(id);
    // A typo the book's fixed since she last looked goes in quietly.
    if (isGm(id)) quietBook(id);
    timer = setInterval(() => {
      if (document.visibilityState === "visible") syncNow(id);
    }, POLL);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && watching) syncNow(watching);
  });
  addEventListener("storage", (e) => {
    if (e.key === KEY) st = null;
  });
  // Back online, everything that's waiting goes up, from any campaign.
  addEventListener("online", () => {
    load();
    for (const id of Object.keys(st.k)) if (st.k[id].out.length || id === watching) syncNow(id);
  });

  // ------------------------------------------------------------ changing it

  function edit(id, ops, say, { undoable = true, quiet = false } = {}) {
    const k = camp(id);
    let doc = docOf(id);
    const did = [];
    const back = [];
    for (const op of ops) {
      const before = undoable ? undoOf(doc, op) : [];
      if (!apply(doc, op)) continue;
      did.push(op);
      back.unshift(...before);
    }
    if (!did.length) return false;
    for (const op of did) k.out.push({ ...op, n: ++st.n });
    keep();
    if (undoable && back.length) {
      undos.push({ id, ops: back });
      if (undos.length > 30) undos.shift();
    }
    if (!quiet) {
      ui.sure = "";
      d.render();
      if (say) d.toast(say, back.length && undoable ? "wundo" : false);
    }
    soon(id);
    return true;
  }
  function undo() {
    const u = undos.pop();
    if (!u) return;
    ui.editing = "";
    if (edit(u.id, u.ops, "", { undoable: false })) d.toast("Put back.", false);
  }

  // A card out of the book, as a faction on the board with ids of its own and
  // nothing shown to the crew yet.
  function fromCard(card, from) {
    const ids = (l, more = {}) => (card[l] ?? []).map((x) => ({ ...x, id: newId(), ...more }));
    const { h, at, ...was } = card;
    return {
      id: newId(), name: card.name, about: "", want: card.want, face: card.face, secret: card.secret, more: card.more, note: card.note,
      res: ids("res").map((x) => ({ ...x, left: x.x })), assets: ids("assets").map((x) => ({ ...x, left: x.x, off: false })),
      agendas: ids("agendas", { done: false }), pub: ids("pub"), mor: ids("mor"), loy: ids("loy"), threads: ids("threads", { to: "crew" }),
      shown: {}, book: { from, key: card.key, h, at, was },
    };
  }
  const boardOf = (from) => W.boards.find((b) => b.id === from) ?? null;
  const bookCard = (f) => boardOf(f.book?.from)?.cards.find((c) => c.key === f.book.key) ?? null;

  // What the book's changed on a card she brought in, since she brought it in
  // (or last looked): each change in words, and the changes to her card that
  // take it. A typo fix is quiet, and only goes in where her words are still
  // the book's old ones.
  function bookNews(f) {
    const now = bookCard(f);
    // A phone on an older build than the one that last saw the card says nothing.
    if (!now || !f.book || now.h === f.book.h || (now.at ?? 0) < (f.book.at ?? 0)) return null;
    const was = f.book.was;
    const real = [];
    const quiet = [];
    const realOps = [];
    const quietOps = [];
    for (const [k, label] of [["name", "Its name"], ["want", "Want"], ["face", "Face"], ["secret", "Its Secret"], ["more", "The rest of its Secret"], ["note", "The book’s note"]]) {
      const a = was[k] ?? "";
      const b = now[k] ?? "";
      if (keyOf(a) === keyOf(b) && a === b) continue;
      if (typo(a, b)) {
        quiet.push(k);
        if (f[k] === a) quietOps.push({ o: "set", id: f.id, f: k, v: b });
      } else {
        real.push(`${label}: ${b ? `<em>${esc(bare(b))}</em>` : "nothing"}${a ? ` <small>(was <em>${esc(bare(a))}</em>)</small>` : ""}`);
        if (f[k] !== b && (k !== "name" || b)) realOps.push({ o: "set", id: f.id, f: k, v: b });
      }
    }
    const LIST_NAMES = { res: "Resources", assets: "Assets", agendas: "Agendas", pub: "Public Sentiment", mor: "Morale", loy: "Loyalty", threads: "Threads toward the crew" };
    for (const l of Object.keys(LIST_NAMES)) {
      const a = was[l] ?? [];
      const b = now[l] ?? [];
      const mine = f[l];
      const gone = a.filter((x) => !b.some((y) => keyOf(y.text) === keyOf(x.text)));
      const added = b.filter((y) => !a.some((x) => keyOf(x.text) === keyOf(y.text)));
      const said = [];
      // A line that's only had a typo fixed keeps its place.
      for (const x of [...gone]) {
        const y = added.find((z) => typo(x.text, z.text));
        if (!y) continue;
        gone.splice(gone.indexOf(x), 1);
        added.splice(added.indexOf(y), 1);
        quiet.push(l);
        const hers = mine.find((m) => m.text === x.text);
        if (hers) quietOps.push({ o: "edit", id: f.id, l, lid: hers.id, f: "text", v: y.text });
      }
      for (const x of gone) {
        said.push(`<s>${esc(x.text)}</s> gone`);
        const hers = mine.find((m) => keyOf(m.text) === keyOf(x.text));
        if (hers) realOps.push({ o: "drop", id: f.id, l, lid: hers.id });
      }
      for (const y of added) {
        said.push(`<em>${esc(y.text)}</em> new`);
        if (!mine.some((m) => keyOf(m.text) === keyOf(y.text))) {
          const base = { id: newId(), ...y };
          const it = l === "res" ? { ...base, left: y.x } : l === "assets" ? { ...base, left: y.x, off: false } : l === "agendas" ? { ...base, done: false } : l === "threads" ? { ...base, to: "crew" } : base;
          realOps.push({ o: "add", id: f.id, l, item: it });
        }
      }
      // The same line, changed: a multiplier, what it does, whether it adds
      // Power, a thread's kind, or what an agenda adds. An agenda's die and a
      // line's ticks are play's, so they stay.
      for (const y of b) {
        const x = a.find((z) => keyOf(z.text) === keyOf(y.text));
        const hers = mine.find((m) => keyOf(m.text) === keyOf(y.text));
        if (!x) continue;
        for (const fld of ["x", "does", "power", "kind", "then"]) {
          if (!(fld in y) || x[fld] === y[fld]) continue;
          const small = typeof y[fld] === "string" && typo(x[fld] ?? "", y[fld]);
          if (small) {
            quiet.push(`${l}.${fld}`);
            if (hers && hers[fld] === x[fld]) quietOps.push({ o: "edit", id: f.id, l, lid: hers.id, f: fld, v: y[fld] });
            continue;
          }
          said.push(`<em>${esc(y.text)}</em>: ${fld === "x" ? `×${y.x}` : fld === "power" ? (y.power ? "adds Power" : "doesn’t add Power") : fld === "kind" ? y.kind : esc(bare(y[fld]) || "nothing")}`);
          if (hers && hers[fld] !== y[fld]) realOps.push({ o: "edit", id: f.id, l, lid: hers.id, f: fld, v: y[fld] });
        }
      }
      if (said.length) real.push(`${LIST_NAMES[l]}: ${said.join(", ")}`);
    }
    const { h, at, ...card } = now;
    return { real, realOps, quietOps, book: { o: "book", id: f.id, card, h, at } };
  }
  // Typo fixes and changes that don't touch her card go in without a word.
  function quietBook(id) {
    if (!isGm(id)) return;
    const doc = docOf(id);
    const ops = [];
    for (const f of doc.factions) {
      const news = bookNews(f);
      if (news && !news.real.length) ops.push(...news.quietOps, news.book);
    }
    if (ops.length) edit(id, ops, "", { undoable: false, quiet: true });
  }

  // ------------------------------------------------------------ taps

  const roll = (n) => rollDie(n) - 1;
  const ACT = {
    // Every link here: back where it came from if that's where it goes, or on
    // to it, remembering where it came from.
    nav(el) {
      const href = el.getAttribute("href");
      if (!href) return;
      if (history.state?.from === href) return history.back();
      d.go(href, { from: location.pathname + location.search });
    },
    edit(el) {
      ui.editing = el.dataset.k;
      ui.sure = "";
      d.render();
      requestAnimationFrame(() => document.querySelector("#app .wb-editing input:not([type=checkbox]):not([type=radio]), #app .wb-editing textarea")?.focus());
    },
    cancel() {
      ui.editing = "";
      d.render();
    },
    bring(el, id) {
      const b = boardOf(el.dataset.b);
      if (!b) return;
      const doc = docOf(id);
      const have = new Set(doc.factions.filter((f) => f.book?.from === b.id).map((f) => f.book.key));
      const cards = b.cards.filter((c) => !have.has(c.key));
      if (!cards.length) return d.toast(`${b.name}’s board is already on yours.`, false);
      if (doc.factions.length && ui.sure !== `bring-${b.id}`) {
        ui.sure = `bring-${b.id}`;
        return d.render();
      }
      if (doc.factions.length + cards.length > MAX.factions) return d.toast(`That’s more than the ${MAX.factions} factions a board holds. Take some off first.`, false);
      edit(id, cards.map((c) => ({ o: "new", f: fromCard(c, b.id) })), `${cards.map((c) => bare(c.name)).join(", ").replace(/, ([^,]*)$/, " and $1")} ${cards.length === 1 ? "is" : "are"} on the board. Nothing’s shown to the crew yet.`);
    },
    show(el, id) {
      const f = find(docOf(id), el.dataset.f);
      if (!f) return;
      const p = el.dataset.p;
      const v = !f.shown[p];
      // The Secret takes a second tap to show.
      if (v && p === "secret" && ui.sure !== `secret-${f.id}`) {
        ui.sure = `secret-${f.id}`;
        return d.render();
      }
      const part = PART_NAMES[p].replace(/^its /, "");
      const many = ["res", "assets", "agenda", "bonds", "threads"].includes(p);
      const say = p === "card" ? (v ? `The crew can see ${bare(f.name)} now: its name, what it is, its Want and its Face.` : `${bare(f.name)}’s hidden from the crew again.`)
        : v ? `The crew can see ${bare(f.name)}’s ${part} now.` : `${bare(f.name)}’s ${part} ${many ? "are" : "is"} hidden from the crew again.`;
      edit(id, [{ o: "show", id: f.id, p, v }], say);
    },
    tick(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const x = f?.[el.dataset.l]?.find((y) => y.id === el.dataset.lid);
      if (!x) return;
      const by = Number(el.dataset.by) === -1 ? -1 : 1;
      const say = by === -1 ? `One back on ${bare(x.text)}.` : x.left <= 1 ? `${bare(x.text)}’s gone from ${bare(f.name)}’s card.` : `${bare(x.text)} has ${x.left - 1} of ${x.x} left.`;
      edit(id, [{ o: "tick", id: f.id, l: el.dataset.l, lid: x.id, by }], say);
    },
    paid(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const a = f?.assets.find((y) => y.id === el.dataset.lid);
      if (!a) return;
      edit(id, [{ o: "edit", id: f.id, l: "assets", lid: a.id, f: "off", v: !a.off }], a.off ? `Something’s paying for ${bare(a.text)} again.` : `Nothing’s paying for ${bare(a.text)}, so it stops counting.`);
    },
    climb(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const a = f?.agendas.find((y) => y.id === el.dataset.lid);
      if (!a) return;
      const by = Number(el.dataset.by) === -1 ? -1 : 1;
      const say = by === 1 ? (a.die >= 12 ? `${bare(a.text)}: it’s happened.` : `${bare(a.text)} climbs to d${a.die + 2}.`) : a.done ? `${bare(a.text)} hasn’t happened yet. It’s back at d12.` : `${bare(a.text)} steps back to d${Math.max(2, a.die - 2)}.`;
      edit(id, [{ o: "climb", id: f.id, lid: a.id, by }], say);
    },
    strain(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const t = f?.[el.dataset.l]?.find((y) => y.id === el.dataset.lid);
      if (!t) return;
      const to = el.dataset.to === "mend" ? "whole" : t.s === "strained" ? "snapped" : "strained";
      edit(id, [{ o: "edit", id: f.id, l: el.dataset.l, lid: t.id, f: "s", v: to }], to === "whole" ? `Mended: ${bare(t.text)}.` : to === "snapped" ? `Snapped: ${bare(t.text)}.` : `Strained: ${bare(t.text)}. It stops counting till it’s mended.`);
    },
    drop(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const x = f?.[el.dataset.l]?.find((y) => y.id === el.dataset.lid);
      if (!x) return;
      if (ui.sure !== `drop-${x.id}`) {
        ui.sure = `drop-${x.id}`;
        return d.render();
      }
      ui.editing = "";
      edit(id, [{ o: "drop", id: f.id, l: el.dataset.l, lid: x.id }], `${bare(x.text)}’s off ${bare(f.name)}’s card.`);
    },
    pick(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const a = W.assets[Number(el.dataset.i)];
      if (!f || !a) return;
      if (f.assets.length >= MAX.list) return d.toast(`That’s ${MAX.list} assets already, which is as many as a card holds.`, false);
      edit(id, [{ o: "add", id: f.id, l: "assets", item: { id: newId(), text: a.text, does: a.does, power: a.power, x: 1, left: 1, off: false } }], `${bare(f.name)} has ${bare(a.text)} now${a.power ? ", and it adds Power" : ""}. It needs something paying for it.`);
    },
    gone(el, id) {
      const doc = docOf(id);
      const f = find(doc, el.dataset.f);
      if (!f) return;
      if (ui.sure !== `gone-${f.id}`) {
        ui.sure = `gone-${f.id}`;
        return d.render();
      }
      ui.editing = "";
      if (edit(id, [{ o: "gone", id: f.id }], `${bare(f.name)}’s off the board.${minisOf(doc, f.id).length ? " Its mini factions stay, on their own now." : ""}`)) d.go(`/characters/?camp=${encodeURIComponent(id)}&world`, { replace: true });
    },
    book(el, id) {
      const f = find(docOf(id), el.dataset.f);
      const news = f ? bookNews(f) : null;
      if (!news) return d.render();
      if (el.dataset.take === "1") edit(id, [...news.quietOps, ...news.realOps, news.book], `${bare(f.name)} has the book’s changes now.`);
      else edit(id, [...news.quietOps, news.book], `${bare(f.name)} stays the way you’ve got it.`);
    },
    // Building a Faction's tables, rolled into the form for a new faction.
    rollnew(el) {
      const form = el.closest("form");
      if (!form) return;
      const w = W.build.what[roll(12)];
      const h = W.build.how[roll(12)];
      const a = W.build.agendas[roll(12)];
      const put = (name, v) => {
        const input = form.elements.namedItem(name);
        if (input) input.value = v ?? "";
      };
      if (w) {
        put("is", w.is);
        put("want", w.wants);
      }
      if (h) {
        put("works", h.works);
        put("secret", h.secret);
      }
      if (a) {
        put("agenda", a.text);
        put("die", String(a.die));
      }
      d.toast("Rolled. Keep what fits and change the rest.", false);
    },
    top() {
      scrollTo({ top: 0, behavior: "smooth" });
    },
  };

  function act(el, e) {
    if (el.dataset.do === "undo") return undo();
    const id = el.closest("[data-wb]")?.dataset.wb ?? el.dataset.c;
    if (!ACT[el.dataset.do]) return;
    if (el.tagName === "A") {
      if (e?.metaKey || e?.ctrlKey || e?.shiftKey) return;
      e?.preventDefault?.();
    }
    ACT[el.dataset.do](el, id, e);
  }

  function submit(kind, form, f) {
    const id = form.closest("[data-wb]")?.dataset.wb;
    if (!id) return;
    const doc = docOf(id);
    const fac = form.dataset.f ? find(doc, form.dataset.f) : null;
    const text = (name, max = MAX.line) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const has = (name) => f.get(name) === "on";
    ui.editing = "";
    if (kind === "w-new") {
      const name = text("name", MAX.name);
      if (!name) return d.toast("Give it a name first.", false);
      if (doc.factions.length >= MAX.factions) return d.toast(`That’s ${MAX.factions} factions, which is as many as a board holds.`, false);
      const is = bare(text("is"));
      const works = bare(text("works"));
      const about = [is ? `${is}.` : "", works ? `It works through ${works.charAt(0).toLowerCase()}${works.slice(1)}.` : ""].filter(Boolean).join(" ");
      const agenda = text("agenda");
      const secret = text("secret", MAX.words);
      const tag = secret.match(/^(.+?[.?])\s+(.*)$/);
      const fid = newId();
      const ok = edit(id, [{ o: "new", f: {
        id: fid, name, about: about.slice(0, MAX.line), want: text("want", MAX.words), face: text("face", MAX.words),
        secret: tag ? bare(tag[1]) : bare(secret), more: tag ? tag[2] : "",
        agendas: agenda ? [{ id: newId(), text: bare(agenda), die: Number(f.get("die")) || 2, done: false, then: "" }] : [],
        res: [], assets: [], pub: [], mor: [], loy: [], threads: [], shown: {},
      } }], `${bare(name)}’s on the board. Give it resources and assets on its card. Nothing’s shown to the crew yet.`);
      if (ok) d.go(`/characters/?camp=${encodeURIComponent(id)}&world&f=${encodeURIComponent(fid)}`);
      return;
    }
    if (!fac) return d.render();
    if (kind === "w-words") {
      const name = text("name", MAX.name);
      if (!name) return d.toast("It needs a name.", false);
      const ops = [];
      for (const [k, max] of [["name", MAX.name], ["about", MAX.line], ["want", MAX.words], ["face", MAX.words]]) {
        const v = text(k, max);
        if (v !== fac[k]) ops.push({ o: "set", id: fac.id, f: k, v });
      }
      if (!ops.length || !edit(id, ops, `${bare(name)}’s card is changed.`)) d.render();
      return;
    }
    if (kind === "w-secret" || kind === "w-note") {
      const ops = kind === "w-note" ? [{ o: "set", id: fac.id, f: "note", v: text("note", MAX.note) }] : [{ o: "set", id: fac.id, f: "secret", v: bare(text("secret")) }, { o: "set", id: fac.id, f: "more", v: text("more", MAX.words) }];
      if (!edit(id, ops.filter((op) => op.v !== fac[op.f]), kind === "w-note" ? "Your note’s saved. Only you see it." : `${bare(fac.name)}’s Secret is changed.`)) d.render();
      return;
    }
    if (kind === "w-outs") {
      const outs = OUTCOMES.filter((o) => has(`out-${o}`));
      if (outs.length !== 2) return d.toast("A mini faction picks two of the six outcomes, and only two.", false);
      if (!edit(id, [{ o: "set", id: fac.id, f: "outs", v: outs }], `${bare(fac.name)} can ${outs.join(" and ")} now, and nothing else.`)) d.render();
      return;
    }
    if (kind === "w-mini") {
      const name = text("name", MAX.name);
      if (!name) return d.toast("Give the mini faction a name first.", false);
      const outs = OUTCOMES.filter((o) => has(`out-${o}`));
      if (outs.length !== 2) return d.toast("Pick two of the six outcomes for it, and only two.", false);
      const loy = text("loy");
      const mid = newId();
      const ok = edit(id, [{ o: "mini", id: fac.id, res: String(f.get("res") ?? ""), asset: String(f.get("asset") ?? ""), f: {
        id: mid, name, about: "", want: "", face: "", secret: "", more: "", outs,
        loy: loy ? [{ id: newId(), text: bare(loy), kind: f.get("kind") === "hostile" ? "hostile" : "bond", s: "whole" }] : [],
        res: [], assets: [], agendas: [], pub: [], mor: [], threads: [], shown: {},
      } }], `${bare(fac.name)} made ${bare(name)}. It sits out this downtime, and takes its own action from the next.`);
      if (ok) d.go(`/characters/?camp=${encodeURIComponent(id)}&world&f=${encodeURIComponent(mid)}`);
      return;
    }
    const l = form.dataset.l;
    if (!["res", "assets", "agendas", "pub", "mor", "loy", "threads"].includes(l)) return d.render();
    const max = l === "res" || l === "assets" ? MAX.name : MAX.line;
    if (kind === "w-add") {
      const words = bare(text("text", max));
      if (!words) return d.toast("Write it in first.", false);
      if (fac[l].length >= (l === "agendas" ? MAX.agendas : MAX.list)) return d.toast(l === "agendas" ? "A faction can have two agendas on the go, never more." : `That’s ${MAX.list} already, which is as many as a card holds.`, false);
      const times = Math.min(MAX.x, Math.max(1, Number(f.get("x")) || 1));
      const it = { id: newId(), text: words };
      if (l === "res") Object.assign(it, { x: times, left: times });
      if (l === "assets") Object.assign(it, { x: times, left: times, does: text("does", MAX.words), power: has("power"), off: false });
      if (l === "agendas") Object.assign(it, { die: Number(f.get("die")) || 2, done: false, then: "" });
      if (["pub", "mor", "loy", "threads"].includes(l)) Object.assign(it, { kind: f.get("kind") === "hostile" ? "hostile" : "bond", s: "whole" });
      if (l === "threads") it.to = String(f.get("to") || "crew");
      const said = { res: `${bare(fac.name)} has ${bare(words)} now.`, assets: `${bare(fac.name)} has ${bare(words)} now${it.power ? ", and it adds Power" : ""}.`, agendas: `${bare(fac.name)}’s working on ${bare(words)}, at d${it.die}.`, threads: `${bare(fac.name)} wrote a ${it.kind} thread.` }[l] ?? `A ${it.kind} thread on ${bare(fac.name)}’s ${BONDS.find(([k]) => k === l)?.[1]}.`;
      if (edit(id, [{ o: "add", id: fac.id, l, item: it }], said)) form.reset();
      return;
    }
    if (kind === "w-line") {
      const x = fac[l].find((y) => y.id === form.dataset.lid);
      if (!x) return d.render();
      const ops = [];
      const put = (fld, v) => {
        if (v !== x[fld]) ops.push({ o: "edit", id: fac.id, l, lid: x.id, f: fld, v });
      };
      const words = bare(text("text", max));
      if (!words) return d.toast("It needs its words. Take it off the card instead, if it’s gone.", false);
      put("text", words);
      if (l === "res" || l === "assets") put("x", Math.min(MAX.x, Math.max(1, Number(f.get("x")) || 1)));
      if (l === "assets") {
        put("does", text("does", MAX.words));
        put("power", has("power"));
        put("off", has("off"));
      }
      if (l === "agendas") put("then", text("then", MAX.words));
      if (["pub", "mor", "loy", "threads"].includes(l)) put("kind", f.get("kind") === "hostile" ? "hostile" : "bond");
      if (l === "threads") put("to", String(f.get("to") || "crew"));
      const give = String(f.get("give") ?? "");
      if ((l === "res" || l === "assets") && give && give !== fac.id) ops.push({ o: "move", id: fac.id, l, lid: x.id, to: give });
      if (l === "agendas") {
        const v = Number(f.get("die"));
        if (v && v !== x.die) ops.push({ o: "die", id: fac.id, lid: x.id, v });
      }
      const to = give ? find(doc, give) : null;
      if (!ops.length || !edit(id, ops, to ? `${bare(x.text)}’s ${bare(to.name)}’s now.` : `Changed on ${bare(fac.name)}’s card.`)) d.render();
    }
  }

  // ------------------------------------------------------------ drawing it

  const them = (dice, opts = {}) => dice.map((x, i) => kitDie(x, { own: "them", hide: true, cls: i ? "is-next" : "", ...opts })).join("");
  const powerDice = (f) => stepsToDice(stepsOf(f));
  const crewDice = (steps) => stepsToDice(steps);
  // A fold that reads at a glance while it's shut. On a faction's page its
  // parts sit straight under the faction's name, so their headings are h2s.
  const fold = (key, title, glance, body, badge = "", h = 3) => {
    const k = `wb-${key}`;
    return `<details class="cc-fold wb-fold" data-open="${k}"${d.isOpen(k) ? " open" : ""}><summary><h${h} class="cc-fold-t">${title}${badge}</h${h}><span class="cc-fold-g">${glance}</span></summary><div class="cc-fold-b">${body}</div></details>`;
  };
  const part = (key, title, glance, body, badge = "") => fold(key, title, glance, body, badge, 2);
  const few = (items, n) => (items.length > n ? `${items.slice(0, n).join(" · ")} <small>and ${items.length - n} more</small>` : items.join(" · "));
  const topbar = (href, label) => `<div class="cc-topbar"><a class="cc-back" href="${esc(href)}" data-act="w" data-do="nav">${d.icon.back}${esc(label)}</a><div class="cc-tools">${d.tools()}</div></div>`;
  const ruleLink = (id, text) => `<button type="button" class="pt-reword pt-rule" data-act="rule" data-r="${id}">${text}</button>`;
  const sure = (key, yes, no) => (ui.sure === key ? yes : no);
  const editingKey = (f, k) => `${f.id}:${k}`;
  // Whether the crew's seen this part, as a badge in its heading (the GM's).
  const badge = (f, p) => `<span class="wb-badge${f.shown.card && f.shown[p] ? " is-on" : ""}">${f.shown.card && f.shown[p] ? "Shown" : "Hidden"}</span>`;

  // The crew's own card, at the top of the board: the party sheet's.
  function crewCard(id) {
    const c = d.crewIn(id);
    const dice = crewDice(c.steps);
    const bits = [c.reps ? plural(c.reps, "Reputation", "Reputations") : "No Reputations yet", plural(c.money.res, "resource", "resources"), plural(c.assets, "asset", "assets")];
    return `<div class="wb-crew card"><div class="wb-crew-die" role="img" aria-label="The crew’s Power, ${diceLabel(dice)}">${dice.map((x, i) => kitDie(x, { hide: true, cls: i ? "is-next" : "" })).join("")}</div>
      <div class="wb-crew-in"><p class="wb-k">The crew</p><p class="wb-crew-n">${c.name ? esc(c.name) : "Your crew"} <small>${diceLabel(dice)}</small></p><p class="cc-small">${bits.join(" · ")}</p></div>
      <a class="pt-reword wb-crew-a" href="/characters/?camp=${encodeURIComponent(id)}" data-act="w" data-do="nav">On the party sheet</a></div>`;
  }

  // A faction on the board, a glance and a tap to its page.
  function token(id, f, doc, gm) {
    const maker = f.mini ? (f.parent === "crew" ? "the crew" : find(doc, f.parent)?.name ?? "") : "";
    const kicker = f.mini ? `Mini faction${maker ? ` of ${esc(maker)}` : ""}` : "Faction";
    const powerShown = gm || f.shown.power;
    const dice = powerDice(f);
    const ag = (gm || f.shown.agenda) && f.agendas[0];
    const standing = gm || f.shown.threads ? standingOf(f) : null;
    const bits = [
      ag ? `<span class="cc-gl">${kitMini(ag.die, { own: "them" })}${esc(ag.text)} <small>${ag.done ? "happened" : `d${ag.die}`}</small></span>` : "",
      standing ? `<span class="wb-stand is-${standing}">${STANDING[standing]}</span>` : "",
    ].filter(Boolean).join("");
    const shown = gm ? `<span class="wb-badge${f.shown.card ? " is-on" : ""}">${f.shown.card ? "Shown" : "Hidden"}</span>` : "";
    const glow = lit[id]?.includes(f.id) ? " is-new" : "";
    return `<li class="wb-tok${f.mini ? " is-mini" : ""}${glow}"><a class="card wb-tok-a" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;f=${encodeURIComponent(f.id)}" data-act="w" data-do="nav">
      <span class="wb-tok-die" role="img" aria-label="${powerShown ? `Power ${diceLabel(dice)}` : "Power not known"}">${powerShown ? them(dice) : '<span class="wb-unknown" aria-hidden="true">?</span>'}</span>
      <span class="wb-tok-in"><span class="wb-k">${kicker}${shown}</span><b class="wb-tok-n">${esc(f.name)}</b>${f.want ? `<span class="wb-tok-w">${esc(f.want)}</span>` : ""}${bits ? `<span class="cc-gl-wrap wb-tok-m">${bits}</span>` : ""}</span></a></li>`;
  }

  function status(id) {
    const k = camp(id);
    const waiting = k.out.length;
    return [
      !online() ? (k.at ? `No signal, so this is the board as it was at ${time(k.at)}.` : "No signal, and this phone hasn’t seen this board yet.") : "",
      waiting ? (online() ? "Sending your changes…" : `${waiting === 1 ? "Your change goes" : "Your changes go"} up when you’ve got a signal.`) : "",
    ].filter(Boolean).join(" ");
  }

  // The board: the crew's card, then every faction (each mini faction under
  // the faction that made it), and for the GM, what she can bring in or add.
  function boardBody(id) {
    const gm = isGm(id);
    const doc = docOf(id);
    const k = camp(id);
    const order = [];
    for (const f of doc.factions) {
      if (f.mini && f.parent && f.parent !== "crew" && find(doc, f.parent)) continue;
      order.push(f);
      if (!f.mini) order.push(...minisOf(doc, f.id));
    }
    const list = order.length ? `<ul class="wb-toks">${order.map((f) => token(id, f, doc, gm)).join("")}</ul>` : "";
    const say = status(id);
    if (!gm) {
      const none = !k.at && online() ? '<p class="cc-lead">Opening the board…</p>' : !order.length ? `<p class="cc-lead">${esc(gmName(id))} hasn’t shown you any of the world yet. The factions you find out about show up here, with whatever you’ve found out about each one.</p>` : "";
      lit[id] = [];
      return `${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${crewCard(id)}${list}${none}`;
    }
    const shownCount = doc.factions.filter((f) => f.shown.card).length;
    const lead = order.length
      ? `<p class="cc-small wb-sum">${plural(doc.factions.length, "faction", "factions")} on the board, ${shownCount ? `${shownCount} shown to the crew` : "none of them shown to the crew yet"}.</p>`
      : '<p class="cc-lead">Nothing on the board yet. Bring in a board from the book, or start with a faction of your own. Nothing on it shows on your players’ phones till you show it to them.</p>';
    return `${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${lead}${crewCard(id)}${list}
      <div class="cc-folds wb-adds">${bringFold(id, doc)}${newFold(id, doc)}</div>
      <p class="cc-small">${ruleLink("s-faction-board", "What a faction is")} ${ruleLink("s-faction-build", "Building a faction")}</p>`;
  }

  function bringFold(id, doc) {
    const have = new Map();
    for (const f of doc.factions) if (f.book) have.set(f.book.from, (have.get(f.book.from) ?? 0) + 1);
    const cards = W.boards.map((b) => {
      const n = have.get(b.id) ?? 0;
      const all = n >= b.cards.length;
      return `<li class="wb-bring card"><p class="wb-k">${esc(b.kind)}</p><h4>${esc(b.name)}</h4><p>${esc(b.pitch)}</p>
        <p class="cc-small">${b.cards.map((c) => esc(c.name)).join(" · ")}</p>
        <div class="cc-row">${all ? '<span class="chip sm pt-chip is-on">On your board</span>' : `<button type="button" class="button${doc.factions.length ? "" : " primary"}" data-act="w" data-do="bring" data-b="${esc(b.id)}">${sure(`bring-${b.id}`, `Tap again to add ${n ? "the rest" : `its ${b.cards.length}`}`, n ? "Bring in the rest" : "Bring in its board")}</button>`}
        <a class="pt-reword" href="${esc(b.link)}">Read it in the book</a></div></li>`;
    }).join("");
    return fold("bring", "Bring in a board from the book", doc.factions.length ? "The Steeplands and the five frames" : `${W.boards.length} ready to go`, `<p class="cc-lead">Each one comes in as its factions’ cards, the way the book writes them, and they’re yours to change from then on. If the book changes one later, you’ll get a note and you pick which to keep. They’re in the book for anyone to read, so change whatever you’d rather keep a surprise.</p><ul class="wb-brings">${cards}</ul>`);
  }

  function newFold(id, doc) {
    const sizes = W.sizes.map((s) => `<li><b>${esc(s.size)}</b> Power ${esc(s.power)}, ${esc(s.res)} resources. <small>${esc(s.eg)}</small></li>`).join("");
    const opts = (rows, f) => rows.map((r) => `<option value="${esc(f(r))}"></option>`).join("");
    return fold("new", "A faction of your own", "Rolled or picked off the book’s tables", `<form class="cc-form pt-form wb-new" data-form="w-new">
      <p class="cc-lead">Roll on the book’s tables, or read down them and pick. Then it’s on the board, and you give it its resources and assets on its card. Its Power counts itself.</p>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="rollnew">Roll on the tables</button></div>
      <label class="cc-field">Its name <input name="name" maxlength="${MAX.name}" autocomplete="off" required></label>
      <label class="cc-field">What it is <input name="is" maxlength="${MAX.line}" autocomplete="off" list="wb-is"></label><datalist id="wb-is">${opts(W.build.what, (r) => r.is)}</datalist>
      <label class="cc-field">What it wants <input name="want" maxlength="${MAX.words}" autocomplete="off" list="wb-wants"></label><datalist id="wb-wants">${opts(W.build.what, (r) => r.wants)}</datalist>
      <label class="cc-field">How it works <input name="works" maxlength="${MAX.line}" autocomplete="off" list="wb-works"></label><datalist id="wb-works">${opts(W.build.how, (r) => r.works)}</datalist>
      <label class="cc-field">Its secret <input name="secret" maxlength="${MAX.words}" autocomplete="off" list="wb-secrets"></label><datalist id="wb-secrets">${opts(W.build.how, (r) => r.secret)}</datalist>
      <label class="cc-field">What it’s doing now, its agenda <input name="agenda" maxlength="${MAX.line}" autocomplete="off" list="wb-agendas"></label><datalist id="wb-agendas">${opts(W.build.agendas, (r) => r.text)}</datalist>
      <label class="cc-field">Its agenda starts at <select name="die">${SIZES.map((s) => `<option value="${s}"${s === 6 ? " selected" : ""}>d${s}, ${ago(s)}</option>`).join("")}</select></label>
      <label class="cc-field">Its face, the person the crew deals with <input name="face" maxlength="${MAX.words}" autocomplete="off"></label>
      <div class="cc-row"><button type="submit" class="button primary">Put it on the board</button></div>
      <details class="cc-group wb-sizes" data-open="wb-sizes"${d.isOpen("wb-sizes") ? " open" : ""}><summary>How big it is</summary><ul>${sizes}</ul></details></form>`);
  }

  // ------------------------------------------------------------ one faction's page

  // A line on a resource or asset list: its words, its ticks, and what's
  // tapped most (a win ticks one off), with Change for the rest.
  function lineView(id, f, l, x, gm, doc) {
    const key = editingKey(f, `${l}:${x.id}`);
    if (gm && ui.editing === key) return `<li class="pt-line wb-editing">${lineForm(f, l, x, doc)}</li>`;
    const ticks = x.x > 1 ? `<span class="wb-ticks" role="img" aria-label="${x.left} of ${x.x} left">${Array.from({ length: x.x }, (_, i) => `<i class="${i < x.left ? "is-on" : ""}"></i>`).join("")}</span>` : "";
    const chips = l === "assets" ? `${x.power && !/^\+1 Power/.test(x.does) ? ' <span class="chip sm wb-chip">+1 Power</span>' : ""}${x.off ? ' <span class="chip sm pt-chip is-off">Nothing’s paying for it</span>' : ""}` : "";
    const body = `<p><b>${esc(x.text)}</b>${x.x > 1 ? ` <small>×${x.x}</small>` : ""}${chips}</p>${ticks}${l === "assets" && x.does ? `<p class="pt-does">${esc(x.does)}</p>` : ""}`;
    if (!gm) return `<li class="pt-line${x.off ? " is-off" : ""}"><div class="pt-line-in">${body}</div></li>`;
    const short = l === "assets" && (moneyOf(f).short > 0 || x.off);
    return `<li class="pt-line${x.off ? " is-off" : ""}"><div class="pt-line-in">${body}</div>
      <div class="cc-row wb-line-row"><button type="button" class="button sm" data-act="w" data-do="tick" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(x.id)}">${x.left <= 1 ? "A win takes it" : "A win ticks one off"}</button>${x.left < x.x ? `<button type="button" class="button sm" data-act="w" data-do="tick" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(x.id)}" data-by="-1">One back</button>` : ""}
      ${short ? `<button type="button" class="button sm" data-act="w" data-do="paid" data-f="${esc(f.id)}" data-lid="${esc(x.id)}" aria-pressed="${x.off}">${x.off ? "Something’s paying for it" : "Nothing’s paying for it"}</button>` : ""}
      <button type="button" class="button sm" data-act="w" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(x.text)}">Change</button></div></li>`;
  }
  function giveTo(f, doc) {
    const others = doc.factions.filter((y) => y.id !== f.id);
    return others.length ? `<label class="cc-field">Give it to another faction <select name="give"><option value="">No, it stays with ${esc(f.name)}</option>${others.map((y) => `<option value="${esc(y.id)}">${esc(y.name)}</option>`).join("")}</select></label>` : "";
  }
  const timesField = (x) => `<label class="cc-field">Its multiplier, the wins it takes <select name="x">${Array.from({ length: MAX.x }, (_, i) => i + 1).map((n) => `<option value="${n}"${n === (x?.x ?? 1) ? " selected" : ""}>×${n}</option>`).join("")}</select></label>`;
  function lineForm(f, l, x, doc) {
    const del = `<button type="button" class="button danger" data-act="w" data-do="drop" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(x.id)}">${sure(`drop-${x.id}`, "Tap again to take it off", "Take it off the card")}</button>`;
    const extra = l === "res" ? `${timesField(x)}${giveTo(f, doc)}`
      : l === "assets" ? `<label class="cc-field">What it does <input name="does" maxlength="${MAX.words}" autocomplete="off" value="${esc(x.does)}"></label>
        <label class="pt-check"><input type="checkbox" name="power"${x.power ? " checked" : ""}> It adds Power (people who turn up when it calls)</label>
        <label class="pt-check"><input type="checkbox" name="off"${x.off ? " checked" : ""}> Nothing’s paying for it</label>${timesField(x)}${giveTo(f, doc)}`
      : l === "agendas" ? `<label class="cc-field">Its die <select name="die">${SIZES.map((s) => `<option value="${s}"${s === x.die ? " selected" : ""}>d${s}, ${ago(s)}</option>`).join("")}</select></label>
        <label class="cc-field">What happens when it does <input name="then" maxlength="${MAX.words}" autocomplete="off" value="${esc(x.then)}"></label>`
      : `${kindField(x.kind)}${l === "threads" ? toField(f, doc, x.to) : ""}`;
    return `<form class="cc-form pt-form" data-form="w-line" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(x.id)}">
      <label class="cc-field">Its words <input name="text" maxlength="${l === "res" || l === "assets" ? MAX.name : MAX.line}" autocomplete="off" required value="${esc(x.text)}"></label>${extra}
      <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button>${del}</div></form>`;
  }
  const kindField = (kind = "bond") => `<fieldset class="wb-kind"><legend>Which kind</legend><label class="pt-check"><input type="radio" name="kind" value="bond"${kind !== "hostile" ? " checked" : ""}> Bond, good for it</label><label class="pt-check"><input type="radio" name="kind" value="hostile"${kind === "hostile" ? " checked" : ""}> Hostile, gone bad for it</label></fieldset>`;
  const toField = (f, doc, to = "crew") => `<label class="cc-field">Toward <select name="to"><option value="crew"${to === "crew" ? " selected" : ""}>The crew</option>${doc.factions.filter((y) => y.id !== f.id).map((y) => `<option value="${esc(y.id)}"${to === y.id ? " selected" : ""}>${esc(y.name)}</option>`).join("")}</select></label>`;
  function addForm(f, l, label, doc) {
    const extra = l === "res" ? timesField()
      : l === "assets" ? `<label class="cc-field">What it does <input name="does" maxlength="${MAX.words}" autocomplete="off" placeholder="like once a downtime, the law looks the other way"></label>
        <label class="pt-check"><input type="checkbox" name="power"> It adds Power (people who turn up when it calls)</label>${timesField()}`
      : l === "agendas" ? `<label class="cc-field">It starts at <select name="die">${SIZES.map((s) => `<option value="${s}"${s === 6 ? " selected" : ""}>d${s}, ${ago(s)}</option>`).join("")}</select></label>`
      : `${kindField()}${l === "threads" ? toField(f, doc) : ""}`;
    return `<form class="cc-form pt-form pt-add" data-form="w-add" data-f="${esc(f.id)}" data-l="${l}">
      <label class="cc-field">${label} <input name="text" maxlength="${l === "res" || l === "assets" ? MAX.name : MAX.line}" autocomplete="off"></label>${extra}
      <div class="cc-row"><button type="submit" class="button">Add it</button></div></form>`;
  }
  // Show it to the crew, or hide it again: the top of each part, the GM's.
  function shower(f, p) {
    if (!f.shown.card && p !== "card") return `<p class="cc-small wb-show">Show the crew ${esc(f.name)} first, then this.</p>`;
    const on = f.shown[p];
    const label = on ? "Hide it from the crew" : p === "secret" ? sure(`secret-${f.id}`, "Tap again to show the Secret", "Show the crew its Secret") : "Show the crew";
    return `<div class="wb-show${on ? " is-on" : ""}"><p class="cc-small">${on ? "The crew’s been shown this." : "Only you see this."}</p><button type="button" class="button sm${on ? "" : p === "secret" ? " danger" : " primary"}" data-act="w" data-do="show" data-f="${esc(f.id)}" data-p="${p}" aria-pressed="${on}">${label}</button></div>`;
  }

  function threadLine(id, f, l, t, gm, doc) {
    const key = editingKey(f, `${l}:${t.id}`);
    if (gm && ui.editing === key) return `<li class="pt-line wb-editing">${lineForm(f, l, t, doc)}</li>`;
    const toward = l === "threads" ? (t.to === "crew" ? "toward the crew" : `toward ${esc(find(doc, t.to)?.name ?? "a faction that’s gone")}`) : "";
    const state = t.s === "whole" ? "" : ` <span class="chip sm wb-chip is-${t.s}">${t.s === "strained" ? "Strained" : "Snapped"}</span>`;
    const words = `<p class="wb-thread is-${t.kind}${t.s === "snapped" ? " is-snapped" : ""}"><span class="wb-kind-mark">${t.kind === "hostile" ? "Hostile" : "Bond"}</span> <em>${esc(t.text)}</em>${state}${toward ? ` <small>${toward}</small>` : ""}</p>`;
    if (!gm) return `<li class="pt-line"><div class="pt-line-in">${words}</div></li>`;
    const moves = t.s === "snapped" ? `<button type="button" class="button sm" data-act="w" data-do="drop" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(t.id)}">${sure(`drop-${t.id}`, "Tap again to take it off", "Take it off")}</button>`
      : `<button type="button" class="button sm" data-act="w" data-do="strain" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(t.id)}">${t.s === "strained" ? "Strain it again, it snaps" : "Strain it"}</button>${t.s === "strained" ? `<button type="button" class="button sm" data-act="w" data-do="strain" data-to="mend" data-f="${esc(f.id)}" data-l="${l}" data-lid="${esc(t.id)}">Mend it</button>` : ""}`;
    return `<li class="pt-line"><div class="pt-line-in">${words}</div><div class="cc-row wb-line-row">${moves}<button type="button" class="button sm" data-act="w" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(t.text)}">Change</button></div></li>`;
  }

  function factionView(id, fid) {
    const gm = isGm(id);
    const doc = docOf(id);
    const f = find(doc, fid);
    // A player who came from a character's World tab goes back to it.
    const from = String(history.state?.from ?? "");
    const tab = /^\/characters\/\?c=[^&]+&t=world$/.test(from);
    const top = topbar(tab ? from : `/characters/?camp=${encodeURIComponent(id)}&world`, tab ? "The world" : "The board");
    if (!f) {
      return `${top}<header class="cc-camp-head"><p class="kicker">Faction</p><h1>Not on the board</h1></header>
        <div class="cc-note is-warn"><p>${camp(id).at || !online() ? "That faction isn’t on the board any more, or the crew hasn’t been shown it." : "Opening the board…"}</p></div>`;
    }
    const maker = f.mini ? (f.parent === "crew" ? "the crew" : find(doc, f.parent)?.name ?? "") : "";
    const dice = powerDice(f);
    const steps = stepsOf(f);
    const money = moneyOf(f);
    const standing = standingOf(f);
    const say = status(id);

    // Its words: name, what it is, Want and Face.
    const wordsKey = editingKey(f, "words");
    const words = gm && ui.editing === wordsKey
      ? `<form class="cc-form pt-form wb-editing" data-form="w-words" data-f="${esc(f.id)}">
        <label class="cc-field">Its name <input name="name" maxlength="${MAX.name}" autocomplete="off" required value="${esc(f.name)}"></label>
        <label class="cc-field">What it is <input name="about" maxlength="${MAX.line}" autocomplete="off" value="${esc(f.about)}" placeholder="like A merchant guild. It works through money."></label>
        <label class="cc-field">Want, the thing it always wants <input name="want" maxlength="${MAX.words}" autocomplete="off" value="${esc(f.want)}"></label>
        <label class="cc-field">Face, the person the crew deals with <input name="face" maxlength="${MAX.words}" autocomplete="off" value="${esc(f.face)}"></label>
        <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button></div></form>`
      : `<dl class="wb-words">${f.want ? `<div><dt>Want</dt><dd><em>${esc(f.want)}</em></dd></div>` : ""}${f.face ? `<div><dt>Face</dt><dd>${esc(f.face)}</dd></div>` : ""}</dl>
        ${gm ? `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(wordsKey)}">Change its name, Want and Face</button>` : ""}`;
    const powerShown = gm || f.shown.power;
    const head = `<header class="cc-camp-head wb-head"><p class="kicker is-gm">${f.mini ? `Mini faction${maker ? ` of ${esc(maker)}` : ""}` : "Faction"}</p><h1>${esc(f.name)}</h1>${f.about ? `<p class="cc-small">${esc(f.about)}</p>` : ""}</header>
      <div class="wb-card card" data-glow="${lit[id]?.includes(f.id) ? "1" : ""}">
        <div class="wb-card-top"><div class="wb-card-die" role="img" aria-label="${powerShown ? `Power ${diceLabel(dice)}` : "Power not known"}">${powerShown ? them(dice) : '<span class="wb-unknown" aria-hidden="true">?</span>'}</div>
          <div class="wb-card-p"><p class="wb-k">Power</p><p class="wb-card-v">${powerShown ? diceLabel(dice) : "Not known"}</p>${powerShown ? `<p class="cc-small">${steps} ${steps === 1 ? "step" : "steps"}</p>` : ""}</div>
          ${gm || f.shown.threads ? `<span class="wb-stand is-${standing}">${STANDING[standing]}</span>` : ""}</div>
        ${words}</div>`;
    const showCard = gm ? `<div class="wb-show wb-show-card${f.shown.card ? " is-on" : ""}"><p>${f.shown.card ? "The crew can see it: its name, what it is, its Want and its Face, and whatever else you’ve shown them." : "The crew can’t see it yet. Show it when they find out it’s there."}</p>
      <button type="button" class="button${f.shown.card ? "" : " primary"}" data-act="w" data-do="show" data-f="${esc(f.id)}" data-p="card" aria-pressed="${f.shown.card}">${f.shown.card ? "Hide it from the crew" : `Show the crew ${esc(f.name)}`}</button></div>` : "";

    // The book's changed it since she brought it in.
    const news = gm ? bookNews(f) : null;
    const bookNote = news?.real.length ? `<div class="cc-note is-gold wb-book" role="status"><p><b>The book’s changed ${esc(f.name)} since you brought it in.</b></p><ul>${news.real.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="book" data-f="${esc(f.id)}" data-take="1">Take the book’s changes</button><button type="button" class="button" data-act="w" data-do="book" data-f="${esc(f.id)}" data-take="0">Keep mine</button></div>
      <p class="cc-small">Taking them only changes what the book changed. Your ticks, threads and agendas’ dice stay where play’s put them.</p></div>` : "";

    const parts = [];
    const powerAssets = f.assets.filter((a) => a.power);
    const otherAssets = f.assets.filter((a) => !a.power);
    const list = (l, items) => (items.length ? `<ul class="pt-lines">${items.map((x) => lineView(id, f, l, x, gm, doc)).join("")}</ul>` : "");
    const moneyLine = gm ? (money.short ? `<p class="pt-money is-short">${plural(money.res, "resource", "resources")} and ${plural(money.paying, "asset", "assets")}, so ${money.short === 1 ? "one asset isn’t" : `${money.short} aren’t`} paid for. ${esc(f.name)} picks which goes unpaid: tap Nothing’s paying for it on that one, and it stops counting.</p>` : money.extra ? `<p class="pt-money">${plural(money.res, "resource", "resources")} paying for ${plural(money.paying, "asset", "assets")}, so ${money.extra === 1 ? "there’s 1 extra resource" : `there are ${money.extra} extra resources`} to spend this downtime.</p>` : money.res ? `<p class="pt-money">${plural(money.res, "resource pays", "resources pay")} for ${plural(money.paying, "asset", "assets")}, with nothing extra.</p>` : "") : "";

    if (gm || f.shown.power) {
      const adds = powerAssets.filter((a) => !a.off).length;
      parts.push(part(`power-${f.id}`, "Power", `${diceLabel(dice)} <small>· ${adds ? `1 step, plus ${plural(adds, "asset", "assets")} that add Power` : "1 step, and nothing adding Power"}</small>`,
        `${gm ? shower(f, "power") : ""}<p class="cc-lead">What it rolls when it acts and defends with: 1 step, plus each asset that adds Power and has something paying for it.</p>${moneyLine}${list("assets", powerAssets)}${gm ? addForm(f, "assets", "Someone who turns up when it calls", doc).replace('name="power">', 'name="power" checked>') : ""}`,
        gm ? badge(f, "power") : ""));
    }
    if (gm || f.shown.res) {
      parts.push(part(`res-${f.id}`, "Resources", f.res.length ? `${few(f.res.map((x) => `${esc(x.text)}${x.x > 1 ? ` ×${x.x}` : ""}`), 4)}${gm && money.extra ? ` <small>· ${money.extra} extra</small>` : ""}` : "None",
        `${gm ? shower(f, "res") : ""}<p class="cc-lead">Where its money comes from, one line each. Every asset needs one paying for it, every downtime.</p>${moneyLine}${list("res", f.res)}${gm ? addForm(f, "res", "A new resource", doc) : ""}${ruleLink("s-wealth", "Resources and assets")}`,
        gm ? badge(f, "res") : ""));
    }
    if (gm || f.shown.assets) {
      const onCard = new Set(f.assets.map((a) => keyOf(a.text)));
      const groups = [...new Set(W.assets.map((a) => a.group))];
      const picks = gm ? `<details class="cc-group wb-picks" data-open="wb-picks-${esc(f.id)}"${d.isOpen(`wb-picks-${f.id}`) ? " open" : ""}><summary>Assets to pick from <small>Appendix B</small></summary>${groups.map((g) => `<h3>${esc(g)}</h3><ul class="pt-lines">${W.assets.map((a, i) => (a.group === g ? `<li class="pt-line pt-pick"><div class="pt-line-in"><p><b>${esc(a.text)}</b></p><p class="pt-does">${esc(a.does)}</p></div>${onCard.has(keyOf(a.text)) ? '<span class="chip sm pt-chip is-on">On the card</span>' : `<button type="button" class="button sm" data-act="w" data-do="pick" data-f="${esc(f.id)}" data-i="${i}" aria-label="Give ${esc(f.name)} ${esc(a.text)}">Add it</button>`}</li>` : "")).join("")}</ul>`).join("")}</details>` : "";
      parts.push(part(`assets-${f.id}`, "Other assets", otherAssets.length ? few(otherAssets.map((x) => (x.off ? `<s>${esc(x.text)}</s>` : esc(x.text))), 4) : "None",
        `${gm ? shower(f, "assets") : ""}<p class="cc-lead">What it can do besides turning up, one line each, and each one does exactly what it says.</p>${list("assets", otherAssets)}${gm ? addForm(f, "assets", "A new asset", doc) : ""}${picks}`,
        gm ? badge(f, "assets") : ""));
    }
    if (gm || f.shown.agenda) {
      const agendas = f.agendas.map((a) => {
        const key = editingKey(f, `agendas:${a.id}`);
        if (gm && ui.editing === key) return `<li class="pt-line wb-editing">${lineForm(f, "agendas", a, doc)}</li>`;
        return `<li class="pt-project wb-agenda${a.done ? " is-done" : ""}"><div class="pt-project-top">${kitDie(a.die, { own: "them", label: a.done ? `d${a.die}, past it` : `d${a.die}`, state: a.done ? "top" : "" })}<div class="pt-line-in"><p><b>${esc(a.text)}</b>${a.done ? ' <span class="chip sm pt-chip">It’s happened</span>' : ""}</p><p class="pt-does">${a.done ? "Past d12." : `d${a.die}, ${ago(a.die)}.`}${a.then ? ` ${esc(a.then)}` : ""}</p></div></div>
          ${a.done && gm ? `<div class="pt-rules">${d.rule("when-an-agenda-happens")}</div>` : ""}
          ${gm ? `<div class="cc-row">${a.done ? `<button type="button" class="button sm" data-act="w" data-do="climb" data-f="${esc(f.id)}" data-lid="${esc(a.id)}" data-by="-1">Not yet</button><button type="button" class="button sm" data-act="w" data-do="drop" data-f="${esc(f.id)}" data-l="agendas" data-lid="${esc(a.id)}">${sure(`drop-${a.id}`, "Tap again to take it off", "It’s done with, take it off")}</button>`
            : `<button type="button" class="button sm" data-act="w" data-do="climb" data-f="${esc(f.id)}" data-lid="${esc(a.id)}" data-by="-1"${a.die <= 2 ? " disabled" : ""}>Set back</button><button type="button" class="button sm primary" data-act="w" data-do="climb" data-f="${esc(f.id)}" data-lid="${esc(a.id)}" data-by="1">${a.die >= 12 ? "It happens" : "It climbs"}</button>`}
            <button type="button" class="button sm" data-act="w" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(a.text)}">Change</button></div>` : ""}</li>`;
      }).join("");
      parts.push(part(`agenda-${f.id}`, "Agendas", f.agendas.length ? `<span class="cc-gl-wrap">${f.agendas.map((a) => `<span class="cc-gl">${kitMini(a.die, { own: "them" })}${esc(a.text)} <small>${a.done ? "happened" : `d${a.die}`}</small></span>`).join("")}</span>` : "None on the go",
        `${gm ? shower(f, "agenda") : ""}<p class="cc-lead">What it’s doing right now. Its die climbs as it works at it, and past d12 it happens. Two at most.</p>${agendas ? `<ul class="pt-lines">${agendas}</ul>` : ""}${gm && f.agendas.length < MAX.agendas ? addForm(f, "agendas", "A new agenda", doc) : ""}${ruleLink("s-agendas", "How agendas work")}`,
        gm ? badge(f, "agenda") : ""));
    }
    if (gm || f.shown.bonds) {
      const groups = BONDS.map(([l, label]) => `<div class="wb-bond"><h3>${label}</h3>${f[l].length ? `<ul class="pt-lines">${f[l].map((t) => threadLine(id, f, l, t, gm, doc)).join("")}</ul>` : '<p class="cc-small">None yet.</p>'}${gm ? addForm(f, l, `A thread on ${label}`, doc) : ""}</div>`).join("");
      const count = f.pub.length + f.mor.length + f.loy.length;
      parts.push(part(`bonds-${f.id}`, "Bonds", count ? BONDS.filter(([l]) => f[l].length).map(([l, label]) => `${label} <small>${f[l].length}</small>`).join(" · ") : "No threads yet",
        `${gm ? shower(f, "bonds") : ""}<p class="cc-lead">Public Sentiment, Morale and Loyalty. A bond thread’s a step on any roll it fits, and a hostile one’s a vulnerability, so a win against it that fits ticks once more.</p>${groups}${ruleLink("s-faction-bonds", "How bonds work")}`,
        gm ? badge(f, "bonds") : ""));
    }
    if (gm || f.shown.threads) {
      const crewT = f.threads.filter((t) => t.to === "crew");
      const others = f.threads.filter((t) => t.to !== "crew" && find(doc, t.to));
      parts.push(part(`threads-${f.id}`, "Threads", `${STANDING[standing]}${others.length ? ` <small>· ${plural(others.length, "toward another faction", "toward other factions")}</small>` : ""}`,
        `${gm ? shower(f, "threads") : ""}<p class="cc-lead">How it sees the crew, and the factions it cares about. Mostly bond threads toward the crew and it’s friendly, mostly hostile and it’s hostile, and otherwise it does business.</p>
        ${crewT.length || others.length ? `<ul class="pt-lines">${[...crewT, ...others].map((t) => threadLine(id, f, "threads", t, gm, doc)).join("")}</ul>` : '<p class="cc-small">None yet.</p>'}${gm ? addForm(f, "threads", "A new thread", doc) : ""}${ruleLink("s-standing", "How a faction sees the crew")}`,
        gm ? badge(f, "threads") : ""));
    }
    if (gm || f.shown.secret) {
      const key = editingKey(f, "secret");
      const body = gm && ui.editing === key
        ? `<form class="cc-form pt-form wb-editing" data-form="w-secret" data-f="${esc(f.id)}"><label class="cc-field">Its Secret, the hidden tag <input name="secret" maxlength="${MAX.line}" autocomplete="off" value="${esc(f.secret)}"></label>
          <label class="cc-field">The rest of it <input name="more" maxlength="${MAX.words}" autocomplete="off" value="${esc(f.more)}"></label>
          <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button></div></form>`
        : `${f.secret ? `<p class="wb-secret"><em>${esc(f.secret)}.</em> ${esc(f.more)}</p>` : '<p class="cc-small">No Secret written yet.</p>'}${gm ? `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">Change its Secret</button>` : ""}`;
      parts.push(part(`secret-${f.id}`, "Secret", f.secret ? `<em>${esc(f.secret)}</em>` : "Not written yet", `${gm ? shower(f, "secret") : ""}${body}`, gm ? badge(f, "secret") : ""));
    }
    if (f.mini) {
      const key = editingKey(f, "outs");
      const outsBody = gm && ui.editing === key
        ? `<form class="cc-form pt-form wb-editing" data-form="w-outs" data-f="${esc(f.id)}"><fieldset class="wb-outs"><legend>The two outcomes it can do</legend>${OUTCOMES.map((o) => `<label class="pt-check"><input type="checkbox" name="out-${o}"${f.outs.includes(o) ? " checked" : ""}> ${o}</label>`).join("")}</fieldset>
          <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button></div></form>`
        : `<p>${f.outs.length ? `${f.outs.join(" and ")}, and nothing else.` : "Not picked yet."}</p>${gm ? `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">Change them</button>` : ""}`;
      parts.push(part(`outs-${f.id}`, "What it can do", f.outs.length ? f.outs.join(" and ") : "Not picked yet", `<p class="cc-lead">A mini faction picks two of the six outcomes, and those are the only things it can do. Its Power doesn’t add to its maker’s.</p>${outsBody}${ruleLink("s-mini-factions", "Mini factions")}`));
    } else if (gm) {
      const kids = minisOf(doc, f.id);
      const can = kids.length < MAX.minis;
      const form = can ? `<form class="cc-form pt-form pt-add" data-form="w-mini" data-f="${esc(f.id)}">
        <p class="cc-lead">Making one is Establish: ${esc(f.name)}’s action, and it hands over one of its own resources and one of its own assets.</p>
        <label class="cc-field">Its name <input name="name" maxlength="${MAX.name}" autocomplete="off" placeholder="like The Night Boats"></label>
        <label class="cc-field">The resource it hands over <select name="res"><option value="">None</option>${f.res.map((x) => `<option value="${esc(x.id)}">${esc(x.text)}</option>`).join("")}</select></label>
        <label class="cc-field">The asset it hands over <select name="asset"><option value="">None</option>${f.assets.map((x) => `<option value="${esc(x.id)}">${esc(x.text)}${x.power ? " (+1 Power)" : ""}</option>`).join("")}</select></label>
        <fieldset class="wb-outs"><legend>The two outcomes it can do</legend>${OUTCOMES.map((o) => `<label class="pt-check"><input type="checkbox" name="out-${o}"> ${o}</label>`).join("")}</fieldset>
        <label class="cc-field">Its Loyalty thread toward ${esc(f.name)} <input name="loy" maxlength="${MAX.line}" autocomplete="off" placeholder="like The Guild pays better than the river ever did"></label>${kindField()}
        <div class="cc-row"><button type="submit" class="button">Make it</button></div></form>` : `<p class="cc-small">That’s three, which is as many as a faction can make.</p>`;
      parts.push(part(`minis-${f.id}`, "Mini factions", kids.length ? few(kids.map((x) => esc(x.name)), 3) : "None yet",
        `${kids.length ? `<ul class="wb-toks">${kids.map((x) => token(id, x, doc, gm)).join("")}</ul>` : ""}${form}${ruleLink("s-mini-factions", "Mini factions")}`));
    }
    if (gm) {
      const key = editingKey(f, "note");
      const body = ui.editing === key
        ? `<form class="cc-form pt-form wb-editing" data-form="w-note" data-f="${esc(f.id)}"><label class="cc-field">Your note <textarea name="note" maxlength="${MAX.note}" rows="4">${esc(f.note)}</textarea></label>
          <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button></div></form>`
        : `${f.note ? `<p>${esc(f.note)}</p>` : '<p class="cc-small">Nothing yet.</p>'}<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">${f.note ? "Change it" : "Write one"}</button>`;
      parts.push(part(`note-${f.id}`, "Your note", f.note ? esc(f.note.slice(0, 80)) + (f.note.length > 80 ? "…" : "") : "Only you see it", `<p class="cc-lead">Anything you want to remember about it. It never goes to the crew.</p>${body}`));
    }
    const source = gm && f.book ? boardOf(f.book.from) : null;
    const hidden = !gm && PARTS.some((p) => !f.shown[p]);
    const end = gm ? `<section class="cc-sec" aria-labelledby="wb-off"><h2 id="wb-off" class="sr-only">Taking it off</h2>${source ? `<p class="cc-small">From ${esc(source.name)}. <a class="pt-reword" href="${esc(source.link)}">Read it in the book</a></p>` : ""}
      <div class="cc-row"><button type="button" class="button danger" data-act="w" data-do="gone" data-f="${esc(f.id)}">${sure(`gone-${f.id}`, "Tap again to take it off the board", "Take it off the board")}</button></div></section>`
      : hidden ? `<p class="cc-small wb-more">There’s more to ${esc(f.name)} you haven’t found out yet.</p>` : "";
    if (!gm) lit[id] = [];
    return `${top}<div class="wb" data-wb="${esc(id)}">${head}${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${showCard}${bookNote}<div class="cc-folds wb-parts">${parts.join("")}</div>${end}</div>`;
  }

  // ------------------------------------------------------------ the screens

  function view(v) {
    load();
    if (!sync.me) {
      return `${topbar("/characters/", "Characters")}<header class="cc-camp-head"><p class="kicker">The world</p><h1>${esc(nameOf(v.id))}</h1></header><div class="cc-note is-warn"><p>Sign in to see your campaigns. <a href="/account/">Sign in</a></p></div>`;
    }
    if (v.f) return factionView(v.id, v.f);
    const gm = isGm(v.id);
    return `${topbar(`/characters/?camp=${encodeURIComponent(v.id)}`, nameOf(v.id))}
      <header class="cc-camp-head wb-head"><p class="kicker${gm ? " is-gm" : ""}">The world</p><h1>${esc(nameOf(v.id))}</h1>${gm ? "" : `<p class="cc-small">What ${esc(gmName(v.id))}’s shown the crew so far.</p>`}</header>
      ${d.turnSection?.(v.id) ?? ""}
      <section class="cc-sec wb-sec" data-wb="${esc(v.id)}" aria-labelledby="wb-h"><h2 id="wb-h">The board</h2>${boardBody(v.id)}</section>`;
  }

  // The World tab of a character who's playing in a campaign.
  function tabView(ch) {
    const id = d.campOf(ch);
    if (!id) return `<div class="cc-note"><p>${esc(ch.name)} isn’t playing in a campaign on this phone.</p></div>`;
    return `<div class="wb-tab" data-wb="${esc(id)}"><p class="cc-small pt-where">${esc(ch.name)} plays in <a href="/characters/?camp=${encodeURIComponent(id)}&amp;world" data-act="w" data-do="nav">${esc(nameOf(id))}</a>. This is what ${esc(gmName(id))}’s shown the crew of its world.</p>
      ${d.turnSection?.(id) ?? ""}
      <section class="cc-sec wb-sec" aria-labelledby="wb-h"><h2 id="wb-h">The board</h2>${boardBody(id)}</section></div>`;
  }

  // The way in from the campaign's page, with a glance at the board.
  function tile(id) {
    load();
    const k = camp(id);
    const doc = docOf(id);
    const gm = isGm(id);
    const n = doc.factions.length;
    const shown = doc.factions.filter((f) => f.shown.card).length;
    const glance = gm
      ? n ? `${plural(n, "faction", "factions")} on the board, ${shown ? `${shown} shown to the crew` : "none shown to the crew yet"}.` : "Nothing on the board yet. Bring in a board from the book, or make your own."
      : n ? `${esc(gmName(id))}’s shown the crew ${plural(n, "faction", "factions")}.` : k.at ? `${esc(gmName(id))} hasn’t shown the crew any of the world yet.` : "Whatever the crew’s been shown of the world.";
    const turn = d.turnGlance?.(id) ?? "";
    return `<section class="cc-sec wb-tile" aria-labelledby="wb-tile-${esc(id)}"><a class="card wb-tile-a" href="/characters/?camp=${encodeURIComponent(id)}&amp;world" data-act="w" data-do="nav">
      <span class="wb-tile-mark" aria-hidden="true">${d.icon.world}</span><span class="wb-tile-in"><h2 id="wb-tile-${esc(id)}">The world</h2><span class="cc-small">${turn ? `<b class="wb-tile-turn">${esc(turn)}</b> ` : ""}${glance}</span></span></a></section>`;
  }

  // What's just been shown to a player lights up for a moment.
  function after(app) {
    const el = app.querySelector(".wb-card");
    if (!el) return;
    if (el.dataset.glow) el.classList.add("is-new");
  }

  return {
    view,
    tabView,
    tile,
    after,
    act,
    submit,
    route,
    undo,
    // For the faction turn (turn.js): the board as this phone has it, and the
    // GM's changes to it.
    docIn: (id) => docOf(id),
    edit: (id, ops, say, o) => edit(id, ops, say, o),
    title(v) {
      if (v.f) return find(docOf(v.id), v.f)?.name ?? "A faction";
      return `The world · ${nameOf(v.id)}`;
    },
    drop(id) {
      load();
      delete st.k[id];
      keep();
    },
    keepOnly(ids) {
      load();
      for (const id of Object.keys(st.k)) if (!ids.includes(id)) delete st.k[id];
      keep();
    },
  };
}
