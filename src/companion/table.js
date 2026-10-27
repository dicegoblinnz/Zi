// Telegraphs on phones (stage 8 in notes/app-plan.md). The GM builds the
// round's telegraphs on her campaign's page, each one the kit's telegraph card
// aimed at one of the crew or at the scene (a stake, the scene clock or
// another event, or a part of the place), and sends them. One at someone lands
// on their play screen, where they answer it with the roll card taking its
// die, or let it land and roll When it lands once the round's over. One at a
// stake or a clock is on every phone for anyone to answer, and does what it
// said if it lands. One at a place asks each player whether they're in it,
// and lands on whoever is. However it goes, it's on the GM's page a moment
// later, round by round. A place from Twenty Places brings its own
// telegraphs, ready to send.
//
// The round lives in the campaign's table on the server (src/worker/table.js,
// with the rules in table-rules.js), and while a campaign or a character
// playing in one is open, the phone keeps a WebSocket to it, so changes come
// down the moment they're made. Changes go up over plain HTTPS, numbered, the
// way the party sheet's do. With no signal they wait on the phone and go up
// when it's back, and the server counts each one once. A player with no
// signal can still roll: the answer's kept in their character (state.tele),
// so their Undo takes it back too, and it goes up as soon as it can.
//
//   zi-table  for the account signed in on this phone: this phone's own id
//             (dev), the number of its last change, and for each campaign the
//             table as the server last sent it, the changes still to go up,
//             what this phone's sent for each of its characters' answers,
//             rolls, intercepts and actions, and the GM's round while she
//             builds it. Each campaign's
//             kept apart, and it all goes when the account's characters leave
//             the phone (sync.js).
import { MAX, ONCE, SIZES, actSaid, apply, atName, atPlace, blankScene, current, dieOf, findEl, findTele, fresh, fxSaid, inIt, joinersOf, keyOf, landsOn, lower, onScene, placeOf, spentBy, stateFor, stateOf, workedIn } from "./table-rules.js";
import { turnNews } from "./turn-rules.js";
import { curlyQuotes, readAim, whoAndDoes } from "./aims.js";
import { die as kitDie, tag as kitTag, telegraph as kitTele } from "../kit/kit.js";

const KEY = "zi-table";
// The phone says ping this often, and a socket that hasn't answered in QUIET is dead.
const BEAT = 25000;
const QUIET = 10000;
const MAX_OUT = 60;

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
const newId = () => `${random(8)}${Date.now().toString(36).slice(-4)}`;
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
// Small counts in words, the way Mo says them.
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const words = (n) => WORDS[n] ?? String(n);
const plural = (n, one, many) => `${words(n)} ${n === 1 ? one : many}`;
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
// What a telegraph's trying to do, said by the GM: these start the line, and
// the defence roll reads the first word as a condition when it gets through.
const INTENTS = { blow: ["Hurt", "Pin", "Disarm"], fear: ["Frighten", "Taunt"] };
// A place's pin, drawn the way the kit's telegraph card draws it.
const PIN = `<svg class="zd-aim" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4 C12 21.4 5 14.6 5 9.6 A7 7 0 0 1 19 9.6 C19 14.6 12 21.4 12 21.4 Z"/><circle cx="12" cy="9.6" r="2.6"/></svg>`;

export function makeTable(d) {
  const { esc, sync, store, feel } = d;
  let st = null;
  let ui = { sure: "", note: "" };
  // The campaign whose table this phone's watching, and its socket.
  const net = { id: null, ws: null, open: false, tries: 0, timer: 0, steady: 0, beat: 0, wait: 0, failed: 0, why: "", hold: false, parked: false };
  const busy = {};
  const again = {};
  const retry = {};
  // Cards that changed on someone else's phone, lit for one redraw.
  const lit = new Set();

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
  function camp(id) {
    load();
    st.k[id] ??= { view: null, at: 0, out: [], sent: {}, drafts: [], said: [] };
    const k = st.k[id];
    for (const f of ["out", "drafts", "said"]) if (!Array.isArray(k[f])) k[f] = [];
    if (!k.sent || typeof k.sent !== "object") k.sent = {};
    return k;
  }
  const me = () => sync.me?.id ?? null;

  // The campaign as this phone last saw it (campaigns.js): whether this player
  // runs it, and everyone in it who's playing someone.
  const info = (id) => d.campaign(id);
  const roleIn = (id) => info(id)?.campaign?.role ?? d.list()?.find((x) => x.id === id)?.role ?? null;
  function rosterOf(id) {
    return (info(id)?.players ?? []).filter((p) => p.character?.id).map((p) => ({ user: p.id, name: p.name, ch: p.character.id, cname: String(p.character.name ?? "") }));
  }
  // Who this phone's player is in a campaign, the way the server sees them.
  function whoIn(id) {
    const role = roleIn(id);
    if (role === "gm") return { user: me(), role: "gm", ch: null, cname: "" };
    const listed = d.list()?.find((x) => x.id === id)?.character ?? info(id)?.players?.find((p) => p.id === me())?.character ?? null;
    return { user: me(), role: "player", ch: listed?.id ?? null, cname: String(listed?.name ?? "") };
  }
  const gmName = (id) => first(info(id)?.campaign?.gm ?? d.list()?.find((x) => x.id === id)?.gm) || "your GM";

  // The table as everyone will see it once this phone's changes are in: the
  // server's, with whatever's still to go up on top.
  function local(id) {
    const k = camp(id);
    const doc = fresh({ v: k.view?.v ?? 0, fight: k.view?.fight ?? 1, rounds: structuredClone(k.view?.rounds ?? []), scene: structuredClone(k.view?.scene ?? blankScene()), turn: structuredClone(k.view?.turn ?? null), last: structuredClone(k.view?.last ?? null) });
    const who = whoIn(id);
    const roster = rosterOf(id);
    for (const op of k.out) apply(doc, op, who, roster, op.at || Date.now());
    return doc;
  }
  const waiting = (id, test = () => true) => camp(id).out.some(test);

  // ------------------------------------------------------------ the server

  // A request that hangs gives up after 12 seconds, so one stuck on a bad
  // signal doesn't hold up the rest. Sending again is safe: each change
  // counts once.
  async function call(method, path, body) {
    const res = await fetch(path, { method, cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout?.(12000), headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, got: await res.json().catch(() => ({})) };
  }
  const path = (id) => `/api/campaigns/${encodeURIComponent(id)}/table`;

  // A change from this phone: numbered, kept, and sent as soon as there's a signal.
  function push(id, op) {
    const k = camp(id);
    k.out.push({ ...op, n: ++st.n, at: Date.now() });
    keep();
    flush(id);
  }

  // Everything waiting for one campaign goes up, one batch at a time.
  async function flush(id) {
    if (!id || !sync.me || sync.out || !online()) return;
    const k = camp(id);
    if (!k.out.length) return;
    if (busy[id]) {
      again[id] = true;
      return;
    }
    busy[id] = true;
    let ok = false;
    try {
      const batch = k.out.slice(0, MAX_OUT);
      const last = batch[batch.length - 1].n;
      // The phone's clock goes with them, so the server can tell when an
      // answer was rolled, signal or not.
      const r = await call("POST", path(id), { dev: st.dev, now: Date.now(), ops: batch.map(({ at, ...op }) => op) }).catch(() => ({ ok: false, status: 0, got: {} }));
      if (r.status === 401) return d.signedOut();
      if (r.status === 404) return d.gone(id);
      // Changes the server can't take come off this phone, with why, so they
      // don't hold up the rest. Any made while they were on their way stay.
      if (r.status === 400 || r.status === 413) {
        camp(id).out = camp(id).out.filter((o) => o.n > last);
        keep();
        d.toast(r.got.error || "The round didn’t take that.");
        return d.quietRender();
      }
      if (r.status === 503) {
        net.why = r.got.error || "";
        return d.quietRender();
      }
      if (!r.ok) return;
      ok = true;
      const kk = camp(id);
      // Why anything this phone sent didn't count. Taking back an answer to a
      // telegraph that's gone says nothing.
      const backs = new Set(kk.out.filter((o) => (o.o === "answer" && o.a == null) || (o.o === "defend" && o.r == null) || (o.o === "acts" && o.x == null)).map((o) => o.n));
      const said = (r.got.no ?? []).filter((x) => x.why && !backs.has(x.n));
      // An intercept or an action the table wouldn't take comes off the
      // character, and an intercept's Aura comes back.
      const turned = (r.got.no ?? []).map((x) => batch.find((o) => o.n === x.n)).filter((o) => o && (o.o === "icp" || (o.o === "acts" && o.x != null)));
      if (Number.isInteger(r.got.seq)) kk.out = kk.out.filter((o) => o.n > r.got.seq);
      if (said.length) d.toast(said.map((x) => x.why).slice(-2).join(" "));
      take(id, r.got);
      for (const o of turned) undoTurned(id, o);
    } finally {
      busy[id] = false;
      retry[id] = ok ? 0 : Math.min(60000, (retry[id] || 2500) * 2);
      if (again[id] || (ok && camp(id).out.length)) {
        again[id] = false;
        setTimeout(() => flush(id), 50);
      } else if (!ok && camp(id).out.length && online()) {
        setTimeout(() => flush(id), retry[id]);
      }
    }
  }

  // The table once, for a phone whose socket won't connect, and to find out
  // why it won't.
  async function pull(id) {
    if (!id || !sync.me || sync.out || !online()) return;
    const r = await call("GET", path(id)).catch(() => ({ ok: false, status: 0, got: {} }));
    if (r.status === 401) return d.signedOut();
    if (r.status === 404) return d.gone(id);
    if (r.status === 503) {
      net.why = r.got.error || "";
      return d.quietRender();
    }
    if (r.ok) take(id, r.got);
  }

  // The table from the server. Anything new that matters to this phone's
  // player is said in a toast, and the cards it touched light up.
  function take(id, got) {
    if (!got || !Array.isArray(got.rounds)) return;
    const k = camp(id);
    if (k.view && Number(got.v) < Number(k.view.v) && got.fight === k.view.fight) return;
    const was = k.view ? { v: k.view.v, fight: k.view.fight, rounds: k.view.rounds, scene: k.view.scene, turn: k.view.turn ?? null, last: k.view.last ?? null } : null;
    k.view = { v: Number(got.v) || 0, fight: Number(got.fight) || 1, rounds: got.rounds, scene: got.scene && typeof got.scene === "object" ? got.scene : blankScene(), turn: got.turn ?? null, last: got.last ?? null };
    k.at = Date.now();
    net.why = "";
    const said = news(id, k, was, k.view);
    keep();
    if (said.length) {
      d.toast(said.slice(-2).join(" "));
      if (said.buzz) feel.tele?.();
    }
    d.quietRender();
    const cur = d.current();
    if (cur) setTimeout(() => catchUp(cur), 0);
  }

  // What's new since the phone last looked, said for whoever's holding it.
  function news(id, k, was, now) {
    const out = [];
    const gm = roleIn(id) === "gm";
    const mine = myCharacter(id);
    const before = new Map((was?.rounds ?? []).flatMap((r) => r.tele.map((t) => [t.id, { t, r }])));
    const said = new Set(k.said);
    for (const round of now.rounds) {
      for (const t of round.tele) {
        const old = before.get(t.id);
        if (t.at.k) {
          sceneNews(t, round, old, { id, gm, mine, said, k, now, out });
          continue;
        }
        const at = mine && t.at.user === me() && t.at.ch === mine.id;
        const s = stateOf(t, round);
        const sWas = old ? stateOf(old.t, old.r) : null;
        if (!gm && at && !said.has(t.id) && s === "coming") {
          out.push(`${cap(t.who)}’s telegraphing at ${mine.name}: a d${t.d}.`);
          out.buzz = true;
          k.said.push(t.id);
          lit.add(t.id);
          continue;
        }
        if (!old || s === sWas) continue;
        lit.add(t.id);
        const by = t.ans && t.ans.user !== me() ? t.ans.name : null;
        if (gm) {
          if (s === "stopped") out.push(`${t.ans.name} answered ${lower(t.who)} and stopped it.`);
          else if (s === "hit") out.push(`${t.ans.name} answered ${lower(t.who)}, and it landed.`);
          else if (s === "held") out.push(`${t.at.name} stopped ${lower(t.who)} when it landed.`);
          else if (s === "through") out.push(`${cap(t.who)} got through to ${t.at.name}.`);
        } else if (at) {
          if (s === "landed") {
            out.push(`${cap(t.who)}’s d${t.d} landed on ${mine.name}. Roll When it lands.`);
            out.buzz = true;
          } else if (by && s === "stopped") out.push(`${by} answered ${lower(t.who)} for ${mine.name} and stopped it.`);
          else if (by && s === "hit") out.push(`${by} answered ${lower(t.who)} for ${mine.name}, and it landed on ${mine.name}.`);
        }
      }
    }
    // A friend stepping in front of one, and what the end of a round did to the scene.
    for (const round of now.rounds) {
      for (const t of round.tele) {
        const old = before.get(t.id)?.t;
        if (!t.icp || !old || old.icp) continue;
        if (gm) out.push(`${t.icp.name} took ${lower(t.who)} for ${t.at.name}.`);
        else if (mine && t.at.user === me() && t.at.ch === mine.id && t.icp.user !== me()) out.push(`${t.icp.name}’s taking ${lower(t.who)} for ${mine.name}, so it lands on ${t.icp.name}.`);
      }
      const oldRound = (was?.rounds ?? []).find((r) => r.id === round.id);
      if (round.over && oldRound && !oldRound.over) {
        for (const m of round.moved ?? []) {
          const el = [...(now.scene?.stakes ?? []), ...(now.scene?.events ?? [])].find((x) => x.id === m.ref);
          if (!el) continue;
          out.push(movedSaid(el, m));
        }
      }
    }
    // One the GM took back, that was coming at this player's character.
    if (!gm && mine && was) {
      const ids = new Set(now.rounds.flatMap((r) => r.tele.map((t) => t.id)));
      for (const r of was.rounds) {
        if (!now.rounds.some((x) => x.id === r.id)) continue;
        for (const t of r.tele) {
          if (ids.has(t.id)) continue;
          if (t.at.user === me() && t.at.ch === mine.id) out.push(`${cap(gmName(id))} took back ${lower(t.who)}’s telegraph at ${mine.name}.`);
          else if (atPlace(t) && t.there?.[keyOf(me(), mine.id)]?.in) out.push(`${cap(gmName(id))} took back ${lower(t.who)}, at ${t.at.name}.`);
        }
      }
    }
    // The faction turn, in downtime (turn.js). Nothing's news the first time
    // a phone sees the table.
    if (was) {
      const ft = turnNews(was, now, { gm, me: me() });
      out.push(...ft.lines);
      if (ft.buzz) out.buzz = true;
    }
    if (k.said.length > 120) k.said = k.said.slice(-120);
    return out;
  }
  // News of one at the scene. At a stake or a clock: what it did when it
  // landed, on every phone. At a place: it's coming at a player while they're
  // in it, then how it went for them, and for the GM, who got in or out of it
  // and how each of them got on.
  function sceneNews(t, round, old, { id, gm, mine, said, k, now, out }) {
    const by = t.ans && t.ans.user !== me() ? t.ans.name : null;
    const s = stateOf(t, round);
    const sWas = old ? stateOf(old.t, old.r) : null;
    if (old && s !== sWas) {
      lit.add(t.id);
      if (gm && s === "stopped") out.push(`${t.ans.name} answered ${lower(t.who)} and stopped it.`);
      else if (gm && s === "hit") out.push(`${t.ans.name} answered ${lower(t.who)}, and it landed.`);
    }
    if (onScene(t)) {
      if (old && t.did && !old.t.did) {
        lit.add(t.id);
        out.push(`${cap(lower(t.who))} landed: ${didSaid(t, now)}.`);
      }
      return;
    }
    const key = mine ? keyOf(me(), mine.id) : "";
    const p = key ? t.there?.[key] : null;
    if (!gm && p) {
      const ms = stateFor(t, round, key);
      const msWas = old ? stateFor(old.t, old.r, key) : null;
      if (!said.has(t.id) && ms === "coming") {
        if (p.in) {
          out.push(`${cap(lower(t.who))}, a d${t.d} at ${t.at.name}. You’re in it unless you say you’re out.`);
          out.buzz = true;
        }
        k.said.push(t.id);
        lit.add(t.id);
        return;
      }
      // The GM put them in or out of it by hand.
      const w = old?.t.there?.[key];
      if (w && Boolean(w.in) !== Boolean(p.in) && p.gm) {
        lit.add(t.id);
        out.push(`${cap(gmName(id))} says ${mine.name}’s ${p.in ? "" : "not "}${t.at.where}.`);
      }
      if (!old || ms === msWas) return;
      if (ms === "landed") {
        out.push(`${cap(lower(t.who))} landed on ${mine.name}. Roll When it lands.`);
        out.buzz = true;
      } else if (by && ms === "hit") out.push(`${by} answered ${lower(t.who)}, and it landed on ${mine.name} then and there.`);
      else if (by && ms === "stopped") out.push(`${by} answered ${lower(t.who)} and stopped it.`);
      return;
    }
    if (!gm || !old) return;
    for (const [key2, q] of Object.entries(t.there ?? {})) {
      const w = old.t.there?.[key2];
      if (w && Boolean(w.in) !== Boolean(q.in) && !q.gm) {
        lit.add(t.id);
        out.push(q.in ? `${q.name}’s ${t.at.where}.` : `${q.name}’s not ${t.at.where} any more.`);
      }
      if (q.def && !w?.def) {
        lit.add(t.id);
        out.push(q.def.stopped ? `${q.name} stopped ${lower(t.who)} when it landed.` : `${cap(lower(t.who))} got through to ${q.name}.`);
      }
    }
  }

  // The character this phone's player plays in a campaign, if it's here.
  function myCharacter(id) {
    const who = whoIn(id);
    return who.ch ? store.data.characters.find((c) => c.id === who.ch && c.acct === me()) ?? null : null;
  }

  // ------------------------------------------------------------ the socket

  const socketUrl = (id) => `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${path(id)}`;

  // hold: waiting out the backoff before the next try, so a socket that keeps
  // failing can't be retried on every redraw. parked: this socket was closed
  // because the same person opened the table on too many phones, so it waits
  // to be looked at again rather than knocking another one off.
  function watch(id) {
    if (net.id === id) return ensure();
    shut();
    Object.assign(net, { id, tries: 0, failed: 0, why: "", hold: false, parked: false });
    if (!id) return;
    ensure();
    flush(id);
  }
  function shut() {
    clearTimeout(net.timer);
    clearTimeout(net.steady);
    clearInterval(net.beat);
    clearTimeout(net.wait);
    const ws = net.ws;
    net.ws = null;
    net.open = false;
    net.hold = false;
    if (ws) {
      try {
        ws.close(1000, "Done");
      } catch {}
    }
  }
  function ensure() {
    // net.why: the server's said live play isn't on here, so there's no point trying.
    if (!net.id || net.ws || net.hold || net.parked || net.why || !sync.me || sync.out || !online() || document.visibilityState === "hidden") return;
    connect(net.id);
  }
  function connect(id) {
    let ws;
    try {
      ws = new WebSocket(socketUrl(id));
    } catch {
      return later();
    }
    net.ws = ws;
    net.open = false;
    let opened = false;
    ws.addEventListener("open", () => {
      if (net.ws !== ws) return;
      opened = true;
      net.open = true;
      net.failed = 0;
      // The backoff starts again only once a socket's stayed up a while.
      clearTimeout(net.steady);
      net.steady = setTimeout(() => {
        if (net.ws === ws) net.tries = 0;
      }, 10000);
      beat(ws);
      flush(id);
      d.quietRender();
    });
    ws.addEventListener("message", (e) => {
      if (net.ws !== ws) return;
      if (e.data === "pong") return clearTimeout(net.wait);
      let m = null;
      try {
        m = JSON.parse(e.data);
      } catch {}
      if (m?.t === "view") take(id, m);
      // Taken out, or the campaign's ended.
      if (m?.t === "out") {
        shut();
        d.gone(id);
      }
    });
    ws.addEventListener("close", (e) => {
      if (net.ws !== ws) return;
      net.ws = null;
      net.open = false;
      clearTimeout(net.steady);
      clearInterval(net.beat);
      clearTimeout(net.wait);
      if (e.code === 4000) net.parked = true;
      // A socket that never opened might be turned away (signed out, not in
      // the campaign, live play not on here): asking plainly says which, and
      // gets the table meanwhile.
      if (!opened) {
        net.failed += 1;
        pull(id);
      }
      later();
      d.quietRender();
    });
  }
  function later() {
    clearTimeout(net.timer);
    const ms = Math.min(30000, 1000 * 2 ** Math.min(5, net.tries));
    net.tries += 1;
    net.hold = true;
    net.timer = setTimeout(() => {
      net.hold = false;
      ensure();
    }, ms);
  }
  // A ping now, and a socket that doesn't answer in QUIET is dead.
  function ping(ws) {
    try {
      ws.send("ping");
    } catch {}
    clearTimeout(net.wait);
    net.wait = setTimeout(() => {
      if (net.ws === ws) ws.close();
    }, QUIET);
  }
  function beat(ws) {
    clearInterval(net.beat);
    net.beat = setInterval(() => {
      if (net.ws === ws && net.open) ping(ws);
    }, BEAT);
  }
  // Everything waiting to go up, from every campaign.
  function flushAll() {
    load();
    for (const id of Object.keys(st.k)) if (st.k[id].out.length) flush(id);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    net.parked = false;
    ensure();
    if (net.ws && net.open) {
      // A phone that's been asleep might have a dead socket, or have missed a change.
      ping(net.ws);
      try {
        net.ws.send("view");
      } catch {}
    }
    flushAll();
  });
  addEventListener("online", () => {
    clearTimeout(net.timer);
    Object.assign(net, { tries: 0, hold: false, parked: false });
    ensure();
    flushAll();
    d.quietRender();
  });
  addEventListener("offline", () => {
    shut();
    d.quietRender();
  });
  // Another tab on this phone changed it: read it again before the next change.
  addEventListener("storage", (e) => {
    if (e.key === KEY) st = null;
  });

  // How the phone's getting on with the table, said in a line.
  function netLine(id, k) {
    if (net.why) return `<p class="tg-net is-off">${esc(net.why)}</p>`;
    if (!online()) return `<p class="tg-net is-off"><span aria-hidden="true"></span>No signal${k.at ? `, so this is how it was at ${time(k.at)}` : ""}.</p>`;
    if (net.id === id && net.open) return '<p class="tg-net is-live"><span aria-hidden="true"></span>Live</p>';
    return `<p class="tg-net is-wait"><span aria-hidden="true"></span>${net.failed > 1 ? "Can’t reach the table right now. It’ll keep trying." : "Connecting…"}</p>`;
  }

  // ------------------------------------------------------------ the cards

  // The best a roll did against the telegraph's die.
  const bestOf = (a) => Math.max(...a.dice.filter((x) => x.out === "beat" || x.out === "won").map((x) => x.total), ...(a.won ? [] : a.dice.map((x) => x.total)));
  const realNote = (x) => (x?.real ? ' <span class="tg-real">real dice</span>' : "");
  const diceRow = (a) => `<span class="tg-dice" aria-hidden="true">${a.dice.map((x) => kitDie(x.size, { face: x.total, hide: true, state: x.out === "under" || x.out === "tie" ? "low" : "" })).join("")}</span>`;

  // ------------------------------------------------------------ at the scene
  // The kit card's mark for what it's at: the crew's crest, a clock face for a
  // stake or an event, and a pin for a place.
  const aimOf = (t) => (onScene(t) ? "stake" : atPlace(t) ? "place" : "someone");
  // What goes on the card's Only one answer line. One at a stake or an event
  // says what it does if it lands.
  function oneOf(t) {
    if (!onScene(t)) return t.one ?? "";
    if (t.fx && "tag" in t.fx && !t.fx.tag) return "If it lands, there’s a new tag in its way.";
    return t.fx ? `If it lands, ${fxSaid(t)}.` : "";
  }
  // Where one at a place has got to for this phone's character, or where any
  // other telegraph's got to.
  const stateHere = (t, round, chId) => (atPlace(t) ? stateFor(t, round, keyOf(me(), chId)) : stateOf(t, round));
  // What one at a stake or an event did when it landed, in a sentence. doc's
  // the table, for the scene as it is now.
  function didSaid(t, doc) {
    const did = t.did;
    if (!did) return "";
    const el = findEl(doc, t.at.ref)?.el;
    const name = lower(el?.name ?? t.at.name);
    if (did.none) {
      return { won: `the crew had ${name} already, so it did nothing`, lost: `${name} was lost already, so it did nothing`, done: `${name} had happened already, so it did nothing`, full: `${name} can’t hold another tag, so it did nothing`, clock: `${name} hasn’t got a clock to drop, so it did nothing` }[did.none] ?? `${name}’s gone from the scene, so it did nothing`;
    }
    if (did.tag) return fxSaid({ ...t, fx: { tag: did.tag } }).replace(/ goes in the way /, " is in the way ").replace(/^it’s a new tag/, "there’s a new tag");
    if (did.out === "lost") return `${name}’s clock ran out, so it’s lost`;
    if (did.out === "done") return el?.scene ? `the scene clock’s run out${el.what ? `: ${String(el.what).replace(/[.\s]+$/, "")}` : ""}` : `${name} happened${el?.what ? `: ${String(el.what).replace(/[.\s]+$/, "")}` : ""}`;
    return el?.t === "stake" ? `${name}’s clock dropped to d${did.to}` : `${name} dropped to d${did.to}`;
  }
  // Everyone a telegraph at a place landed on, by name.
  const namesIn = (t) => andList(inIt(t).map((p) => p.name));

  // How one telegraph went, for the GM (forGm) or for the player whose phone it
  // is (mine: it's aimed at their character).
  function verdict(t, round, { forGm = false, mine = false, ch = null, doc = null } = {}) {
    if (onScene(t)) return sceneVerdict(t, round, { forGm, ch, doc });
    if (atPlace(t)) return placeVerdict(t, round, { forGm, ch });
    const s = stateOf(t, round);
    const you = !forGm && t.ans && t.ans.user === me() && ch && t.ans.ch === ch.id;
    const what = t.kind === "fear" ? "Confidence" : "Defend";
    // Whoever put their action in with the one who rolled it.
    const withWho = t.ans?.with?.length ? `, with ${andList(t.ans.with.map((w) => (ch && w.user === me() && w.ch === ch.id ? "you" : w.name)))} in it,` : "";
    if (s === "stopped") {
      const who = you ? "You" : t.ans.name;
      const forWhom = !you && mine ? " for you" : forGm && t.ans.ch !== t.at.ch ? ` for ${t.at.name}` : "";
      return `<div class="tg-v is-good">${diceRow(t.ans)}<p><b>Stopped.</b> ${esc(who)} answered it${esc(forWhom)}${esc(withWho)} with ${esc(t.ans.act)}: ${bestOf(t.ans)} against its ${t.ans.opp}.${realNote(t.ans)}${forGm && t.ans.late ? ' <span class="tg-real">after the round ended</span>' : ""}</p></div>`;
    }
    if (s === "hit") {
      const whose = you ? "Your" : `${t.ans.name}’s`;
      // Answered by whoever it was aimed at, it hit them. Answered for a
      // friend, it might've hit whoever got in the way, and the GM says which.
      const at = landsOn(t);
      const own = t.ans.user === at.user && t.ans.ch === at.ch;
      const hit = own ? `so it hit ${esc(mine ? "you" : at.name)} with no defence.${forGm ? " Say what it costs." : mine ? " The GM says what it costs." : ""}` : `so it landed with no defence.${forGm ? " Say who it hit and what it costs." : " The GM says who it hit."}`;
      return `<div class="tg-v is-bad">${diceRow(t.ans)}<p><b>It landed then and there.</b> ${esc(whose)} ${esc(t.ans.act)}${esc(withWho)} came up ${bestOf(t.ans)} against its ${t.ans.opp}, ${hit}${realNote(t.ans)}${forGm && t.ans.late ? ' <span class="tg-real">after the round ended</span>' : ""}</p></div>`;
    }
    // Who it lands on: whoever intercepted it, or whoever it's aimed at.
    const on = landsOn(t);
    const onName = on.name;
    if (s === "landed") {
      const took = t.icp ? ` ${esc(t.icp.name)} took it for ${esc(t.at.name)}.` : "";
      return forGm
        ? `<div class="tg-v is-bad"><p><b>It landed.</b>${took} ${esc(onName)} rolls When it lands next.</p></div>`
        : mine ? `<div class="tg-v is-bad"><p><b>It landed on you.</b>${t.icp ? ` You took it for ${esc(t.at.name)}.` : ""} Roll When it lands, against your ${what}.</p></div>`
          : `<div class="tg-v is-bad"><p><b>It landed on ${esc(onName)}.</b>${t.icp && ch && isAt(t.at, ch.id) ? ` ${esc(t.icp.name)} took it for you.` : ""}</p></div>`;
    }
    if (s === "held") {
      const whose = mine ? "Your" : `${onName}’s`;
      return `<div class="tg-v is-good"><p><b>Stopped when it landed.</b> ${esc(whose)} ${what} came up ${t.def.mine} against its ${t.def.v}.${realNote(t.def)}</p></div>`;
    }
    if (s === "through") {
      const whose = mine ? "your" : `${onName}’s`;
      const how = t.def.mine == null ? `There was no die left on ${esc(whose)} ${what} for it.` : `${esc(cap(whose))} ${what} came up ${t.def.mine} against its ${t.def.v}.`;
      return `<div class="tg-v is-bad"><p><b>It got through.</b> ${how}${t.def.paid ? ` <span class="tg-paid">${esc(t.def.paid)}</span>` : ""}${realNote(t.def)}</p></div>`;
    }
    return "";
  }
  // Who answered it and how, the same for one at the scene as for anyone.
  function answered(t, ch, forGm) {
    const you = !forGm && t.ans && ch && t.ans.user === me() && t.ans.ch === ch.id;
    const withWho = t.ans?.with?.length ? `, with ${andList(t.ans.with.map((w) => (ch && w.user === me() && w.ch === ch.id ? "you" : w.name)))} in it,` : "";
    const late = forGm && t.ans?.late ? ' <span class="tg-real">after the round ended</span>' : "";
    return { you, withWho, late };
  }
  // One at a stake or an event: stopped, or it did what it said.
  function sceneVerdict(t, round, { forGm, ch, doc }) {
    const s = stateOf(t, round);
    const did = cap(didSaid(t, doc ?? { scene: blankScene() }));
    const { you, withWho, late } = answered(t, ch, forGm);
    if (s === "stopped") return `<div class="tg-v is-good">${diceRow(t.ans)}<p><b>Stopped.</b> ${esc(you ? "You" : t.ans.name)} answered it${esc(withWho)} with ${esc(t.ans.act)}: ${bestOf(t.ans)} against its ${t.ans.opp}.${realNote(t.ans)}${late}</p></div>`;
    if (s === "hit") return `<div class="tg-v is-bad">${diceRow(t.ans)}<p><b>It landed then and there.</b> ${esc(you ? "Your" : `${t.ans.name}’s`)} ${esc(t.ans.act)}${esc(withWho)} came up ${bestOf(t.ans)} against its ${t.ans.opp}.${did ? ` ${esc(did)}.` : ""}${realNote(t.ans)}${late}</p></div>`;
    if (s === "through") return `<div class="tg-v is-bad"><p><b>It landed.</b>${did ? ` ${esc(did)}.` : ""}</p></div>`;
    return "";
  }
  // One at a place: who was in it, and how each of them got on. For a player,
  // just their own.
  function placeVerdict(t, round, { forGm, ch }) {
    const s = stateOf(t, round);
    const what = t.kind === "fear" ? "Confidence" : "Defend";
    const { you, withWho, late } = answered(t, ch, forGm);
    if (s === "stopped") return `<div class="tg-v is-good">${diceRow(t.ans)}<p><b>Stopped.</b> ${esc(you ? "You" : t.ans.name)} answered it${esc(withWho)} with ${esc(t.ans.act)}: ${bestOf(t.ans)} against its ${t.ans.opp}.${realNote(t.ans)}${late}</p></div>`;
    if (forGm) {
      if (s === "hit") {
        const on = inIt(t);
        return `<div class="tg-v is-bad">${diceRow(t.ans)}<p><b>It landed then and there.</b> ${esc(t.ans.name)}’s ${esc(t.ans.act)}${esc(withWho)} came up ${bestOf(t.ans)} against its ${t.ans.opp}, ${on.length ? `so it hit ${esc(namesIn(t))} with no defence. Say what it costs.` : `but nobody was ${esc(t.at.where)}.`}${realNote(t.ans)}${late}</p></div>`;
      }
      if (s === "coming") return "";
      if (s === "clear") return `<div class="tg-v is-good"><p><b>It landed on nobody.</b> Nobody was ${esc(t.at.where)}.</p></div>`;
      const lines = inIt(t).map((p) => {
        if (!p.def) return `${esc(p.name)} rolls When it lands next.`;
        if (p.def.stopped) return `${esc(p.name)} stopped it when it landed: ${p.def.mine} against its ${p.def.v}.${realNote(p.def)}`;
        return `It got through to ${esc(p.name)}: ${p.def.mine == null ? `no die left on their ${what}` : `${p.def.mine} against its ${p.def.v}`}.${p.def.paid ? ` <span class="tg-paid">${esc(p.def.paid)}</span>` : ""}${realNote(p.def)}`;
      });
      return `<div class="tg-v ${s === "held" ? "is-good" : "is-bad"}"><p><b>It landed on ${esc(namesIn(t))}.</b></p>${lines.map((x) => `<p>${x}</p>`).join("")}</div>`;
    }
    const ms = ch ? stateFor(t, round, keyOf(me(), ch.id)) : s;
    const p = ch ? t.there?.[keyOf(me(), ch.id)] : null;
    if (ms === "hit") return `<div class="tg-v is-bad">${diceRow(t.ans)}<p><b>It landed then and there.</b> ${esc(you ? "Your" : `${t.ans.name}’s`)} ${esc(t.ans.act)}${esc(withWho)} came up ${bestOf(t.ans)} against its ${t.ans.opp}, so it hit you with no defence. The GM says what it costs.${realNote(t.ans)}</p></div>`;
    if (ms === "clear") return `<div class="tg-v is-good"><p><b>It missed you.</b> ${round?.over || t.ans ? "You were out of it when it landed." : "You’re out of it."}</p></div>`;
    if (ms === "landed") return `<div class="tg-v is-bad"><p><b>It landed on you.</b> Roll When it lands, against your ${what}.</p></div>`;
    if (ms === "held") return `<div class="tg-v is-good"><p><b>Stopped when it landed.</b> Your ${what} came up ${p.def.mine} against its ${p.def.v}.${realNote(p.def)}</p></div>`;
    if (ms === "through") return `<div class="tg-v is-bad"><p><b>It got through.</b> ${p.def.mine == null ? `There was no die left on your ${what} for it.` : `Your ${what} came up ${p.def.mine} against its ${p.def.v}.`}${p.def.paid ? ` <span class="tg-paid">${esc(p.def.paid)}</span>` : ""}${realNote(p.def)}</p></div>`;
    return "";
  }

  // A telegraph drawn with the kit, with where it's got to under it. ch: the
  // character whose phone it is, so one at a place shows how it went for them.
  function card(t, round, extra = "", { lit: on = false, ch = null } = {}) {
    const s = ch ? stateHere(t, round, ch.id) : stateOf(t, round);
    const mine = ch && atPlace(t) ? t.there?.[keyOf(me(), ch.id)] : null;
    const face = t.ans ? t.ans.opp : t.def ? t.def.v : mine?.def ? mine.def.v : null;
    const coming = t.kind === "fear" ? (atPlace(t) ? "Hits whoever’s there, against Confidence" : "Lands on Confidence at the end of the round") : atPlace(t) ? "Hits whoever’s there when it lands" : "";
    const when = s === "coming" ? (onScene(t) ? "" : coming) : { stopped: "Stopped", hit: "Landed", landed: "Landed", held: "Landed, and stopped", through: onScene(t) ? "Landed" : "Landed, and got through", clear: ch ? "Landed, and missed you" : "Landed on nobody" }[s];
    return `<li class="tg${on ? " is-lit" : ""}" data-tg="${esc(t.id)}">${kitTele({ who: t.who, does: t.does, at: atName(t), atCrest: t.at.k ? null : t.at.arch ?? [], aim: aimOf(t), d: t.d, round: round.n, one: oneOf(t), face, state: s === "coming" ? "" : s, when, extra, strict: false })}</li>`;
  }
  const takeLit = (id) => {
    const on = lit.has(id);
    lit.delete(id);
    return on;
  };

  // How a round's going, in a line.
  function tally(round) {
    const n = { stopped: 0, through: 0, rolling: 0, coming: 0, clear: 0 };
    for (const t of round.tele) {
      const s = stateOf(t, round);
      if (s === "stopped" || s === "held") n.stopped += 1;
      else if (s === "coming") n.coming += 1;
      else if (s === "landed") n.rolling += 1;
      else if (s === "clear") n.clear += 1;
      else n.through += 1;
    }
    const parts = [n.stopped && `${words(n.stopped)} stopped`, n.through && `${words(n.through)} got through`, n.clear && `${words(n.clear)} landed on nobody`, n.rolling && `${words(n.rolling)} still to roll When it lands`, n.coming && `${words(n.coming)} still coming`].filter(Boolean);
    return `${cap(plural(round.tele.length, "telegraph", "telegraphs"))}${parts.length ? `: ${andList(parts)}` : ""}.`;
  }

  // ------------------------------------------------------------ actions and the scene

  // Where an extra action came from (Extra actions, in Conflict).
  const MORES = [["resolve", "1 Resolve"], ["held", "I held last round"], ["hiding", "Out of hiding"], ["fired", "Cashing in d12 Confidence"], ["trait", "A trait or a Boon"]];
  const moreName = (k) => ({ resolve: "1 Resolve", held: "held last round", hiding: "out of hiding", fired: "fired-up Confidence", trait: "a trait or a Boon" })[k] ?? k;
  const isAt = (x, chId) => Boolean(x && x.user === me() && x.ch === chId);
  // Everything that lands on this character: aimed at them and nobody took
  // it, taken by them for a friend, or at a place they're in.
  const landsHere = (t, chId) => (atPlace(t) ? Boolean(t.there?.[keyOf(me(), chId)]?.in) : isAt(landsOn(t), chId));
  const outcome = (won) => (won ? "stopped" : "it landed");

  // One thing someone spent an action on, in a line. you: it's this phone's.
  function actLine(a, doc, round) {
    const el = a.ref ? findEl(doc, a.ref)?.el : null;
    if (a.k === "join") {
      const t = round.tele.find((x) => x.id === a.ref);
      const who = t ? lower(t.who) : "a telegraph";
      if (t?.ans && t.ans.with?.some((w) => w.user === a.user && w.ch === a.ch)) return `in on ${who} with ${t.ans.name}: ${outcome(t.ans.won)}`;
      return `${a.act} into whoever answers ${who}`;
    }
    if (a.k === "work") {
      const name = lower(el?.name ?? "something on the scene");
      // Not judged by the table yet.
      if (a.did === undefined) return `${el?.t === "event" ? "engaging" : "working"} ${name} with ${a.act}`;
      const did = a.did?.won ? (el?.t === "stake" ? `won it${a.did.tag ? `, ${a.did.tag} gone` : ""}` : "") : a.did?.tag ? `${a.did.tag} gone` : a.did?.out ? "driven, and it happens" : a.did?.d != null ? `${a.aim === "drive" ? "driven" : "slowed"} to d${el?.d ?? "?"}` : "it held";
      return `${el?.t === "event" ? "engaging" : "working"} ${name} with ${a.act}: ${did}`;
    }
    if (a.k === "ground") return `using ${lower(el?.name ?? "the ground")}${a.act ? `, with ${a.act}` : ""}`;
    return actSaid(a);
  }
  // Everything one of the crew's done this round, answers first.
  function doneBy(doc, round, user, ch) {
    const out = round.tele.filter((t) => t.ans && t.ans.user === user && t.ans.ch === ch).map((t) => `answering ${lower(t.who)} with ${t.ans.act}: ${outcome(t.ans.won)}`);
    const a = round.acts?.[keyOf(user, ch)];
    for (const x of a?.list ?? []) out.push(actLine({ ...x, user, ch }, doc, round));
    return { lines: out, more: a?.more ?? [] };
  }
  // The intercepts this character's made this round, and whether a friend's
  // already paid for: one friend for each Aura.
  function paidFor(doc, round, chId, friend) {
    return round.tele.some((t) => t.icp && isAt(t.icp, chId) && !t.icp.free && t.at.user === friend.user && t.at.ch === friend.ch);
  }
  const guardianOf = (c) => c.archetypeRules.some((a) => a.name === "Guardian");
  // What the end of a round did to a stake's clock or an event, in a sentence.
  function movedSaid(el, m) {
    const name = cap(lower(el.name));
    if (m.out === "lost") return `${name} is lost. Its clock ran out.`;
    if (m.out === "done") return `${el.scene ? "The scene clock’s run out" : `${name} happened`}${el.what ? `: ${el.what}` : ""}.`;
    return `${el.t === "stake" ? `${name}’s clock` : name} stepped down to d${m.to}.`;
  }
  // Everyone but this character who's put their action into whoever answers
  // a telegraph in the round that's on.
  const friendsIn = (doc, hit, ch) => (hit.round.id === current(doc)?.id && !hit.round.over ? joinersOf(hit.round, hit.t.id).filter((j) => !(j.user === me() && j.ch === ch.id)) : []);

  // A stake, an event or a piece of the ground, drawn as a card. For the GM
  // it has her controls, and for a player in a round that's on, a way to
  // spend their action on it.
  function elCard(id, el, { gm = false, round = null, live = false, can = false, doc = null, h = 4 } = {}) {
    if (el.t === "ground") {
      const act = !gm && live && can ? `<button type="button" class="button sm" data-act="tg" data-do="use" data-el="${esc(el.id)}">Use it</button>` : "";
      const tools = gm ? `<div class="sc-do"><button type="button" class="button sm" data-act="tg" data-do="sc-edit" data-el="${esc(el.id)}">Change it</button></div>` : "";
      return `<li class="sc-ground"><p><b>${esc(el.name)}</b>${el.text ? ` ${esc(el.text)}` : ""}</p>${act}${tools}</li>`;
    }
    const stake = el.t === "stake";
    const die = stake ? dieOf(el) : el.d;
    const who = round ? Object.values(round.acts ?? {}).filter((a) => (a.list ?? []).some((x) => x.k === "work" && x.ref === el.id)).map((a) => a.name) : [];
    const held = round?.held?.[el.id];
    const moved = round?.over ? round.moved?.find((m) => m.ref === el.id) : null;
    // How it works, for the players. The GM only gets what's happening.
    const how = gm ? "" : stake ? (el.clock ? "Its clock steps down at the end of every round nobody works it." : "Every win takes one thing in its way.") : "It steps down a size at the end of every round nobody engages it.";
    const state = el.out === "won" ? "The crew’s got it." : el.out === "lost" ? "Lost. The clock ran out." : el.out === "done" ? `It’s happened${el.what ? `: ${esc(el.what)}` : "."}` : who.length ? (round?.over ? `${esc(andList(who))} ${stake ? "worked" : "engaged"} it in round ${round.n}${held != null ? `, and its die came up ${held}` : ""}.` : `${esc(andList(who))} ${who.length === 1 ? "is" : "are"} at it this round${held != null ? `, and its die came up ${held}, which stands` : ""}.`) : moved ? `Nobody ${stake ? "worked" : "engaged"} it, so ${stake ? "its clock" : "it"} stepped down to d${moved.to}.` : how;
    const tags = stake ? `<div class="sc-tags">${el.tags.map((g, i) => (gm ? `<button type="button" class="sc-tag" data-act="tg" data-do="sc-tag" data-el="${esc(el.id)}" data-i="${i}"${pressedAttr(Boolean(g.gone))} aria-label="${esc(g.name)}${g.gone ? ", gone, tap to put it back" : ", tap when it’s gone"}">${kitTag(g.name, { kind: g.gone ? "threat gone" : "threat" })}</button>` : kitTag(g.name, { kind: g.gone ? "threat gone" : "threat" }))).join("")}</div>` : "";
    const clock = stake && el.clock ? `<span class="sc-clock">${kitDie(el.clock, { own: "harm", hide: true, label: `Its clock, d${el.clock}` })}<small>clock</small></span>` : "";
    // The GM's: step its die (or a stake's clock) by hand, or change it.
    const step = (k, n, label) => `<button type="button" class="cc-x sm sc-step" data-act="tg" data-do="sc-step" data-el="${esc(el.id)}" data-k="${k}" data-d="${n}" aria-label="${label} ${n > 0 ? "up" : "down"} a size">${n > 0 ? "+" : "−"}</button>`;
    const stepper = (k, now, label) => `<div class="sc-stepper" role="group" aria-label="${label}">${step(k, -1, label)}<span class="sc-stepv">${k === "clock" ? "clock " : ""}d${now}</span>${step(k, 1, label)}</div>`;
    const gmTools = gm ? `<div class="sc-do">${el.out ? "" : stake ? (el.clock ? stepper("clock", el.clock, "Its clock") : "") : stepper("d", el.d, "Its die")}<button type="button" class="button sm" data-act="tg" data-do="sc-edit" data-el="${esc(el.id)}">Change it</button></div>` : "";
    const act = !gm && live && can && !el.out ? `<button type="button" class="button sm sc-work" data-act="tg" data-do="work" data-el="${esc(el.id)}">${stake ? "Work it" : "Engage it"}</button>` : "";
    const sub = stake ? `Challenge ${el.c}, a d${die}${el.note ? ` · ${esc(el.note)}` : ""}` : el.out ? "" : `${el.scene ? "When it runs out" : "When it steps past d2"}: ${esc(el.what || "it happens")}`;
    // A scene clock says so, unless that's its name.
    const kicker = el.scene && !/^(the )?scene clock$/i.test(el.name.trim()) ? '<p class="sc-k">Scene clock</p>' : "";
    return `<li class="sc-el is-${el.t}${el.scene ? " is-clock" : ""}${el.out ? ` is-${el.out}` : ""}">
      <div class="sc-top">${kitDie(die, { own: stake ? "them" : el.scene ? "harm" : "them", hide: true, label: stake ? `${el.name}, Challenge ${el.c}, a d${die}` : `${el.name}, d${die}` })}<div class="sc-name">${kicker}<h${h} class="sc-n">${esc(el.name)}</h${h}>${sub ? `<p class="sc-sub">${sub}</p>` : ""}</div>${clock}</div>
      ${tags}${state ? `<p class="sc-state">${state}</p>` : ""}${act}${gmTools}</li>`;
  }
  const pressedAttr = (on) => ` aria-pressed="${on ? "true" : "false"}"`;

  // The scene on the table: the scene clock first, then the stakes, the
  // events and the ground. glance: a line that reads with it shut.
  function sceneParts(doc) {
    const s = doc.scene;
    const clocks = s.events.filter((e) => e.scene);
    return { clocks, stakes: s.stakes, events: s.events.filter((e) => !e.scene), ground: s.ground, any: s.stakes.length + s.events.length + s.ground.length > 0 };
  }
  function sceneGlance(doc) {
    const p = sceneParts(doc);
    const bits = [];
    if (p.any && doc.scene.place?.name) bits.push(doc.scene.place.name);
    for (const e of p.clocks) bits.push(e.out ? "the scene clock’s run out" : `scene clock d${e.d}`);
    if (p.stakes.length) bits.push(plural(p.stakes.length, "stake", "stakes"));
    if (p.events.length) bits.push(plural(p.events.length, "event", "events"));
    if (p.ground.length) bits.push("the ground");
    return bits.join(" · ");
  }
  function sceneList(id, doc, opts) {
    const p = sceneParts(doc);
    const list = (title, els) => (els.length ? `<p class="sc-h">${title}</p><ul class="sc-list">${els.map((el) => elCard(id, el, { ...opts, doc })).join("")}</ul>` : "");
    return `${p.clocks.length ? `<ul class="sc-list">${p.clocks.map((el) => elCard(id, el, { ...opts, doc })).join("")}</ul>` : ""}${list(p.stakes.length === 1 ? "The stake" : "The stakes", p.stakes)}${list(p.events.length === 1 ? "An event" : "Events", p.events)}${list("The ground", p.ground)}`;
  }

  // The scene on the GM's page, with everything she needs to set it.
  function gmScene(id, doc, last) {
    const p = sceneParts(doc);
    const live = Boolean(last && !last.over);
    const body = p.any ? sceneList(id, doc, { gm: true, round: last, live }) : `<p class="cc-lead">Put the scene on the table, and every phone sees it: what the crew’s after and what’s in the way, what’s running out, and what’s there to use. Each player can spend their action on it, and whatever nobody works steps down at the end of the round.</p>`;
    return `<div class="tg-scene" aria-labelledby="sc-h"><div class="tg-head"><h3 id="sc-h">The scene</h3>${p.any ? `<p class="cc-small">${esc(sceneGlance(doc))}</p>` : ""}</div>${body}
      <div class="cc-row sc-add"><button type="button" class="button sm" data-act="tg" data-do="sc-place">${p.any ? "Another place" : "From a place in the book"}</button><button type="button" class="button sm" data-act="tg" data-do="sc-new" data-t="stake">Add a stake</button><button type="button" class="button sm" data-act="tg" data-do="sc-new" data-t="event">${p.clocks.length ? "Add an event" : "Add an event or scene clock"}</button><button type="button" class="button sm" data-act="tg" data-do="sc-new" data-t="ground">Add the ground</button>${p.any ? `<button type="button" class="button sm" data-act="tg" data-do="sc-clear">${sure("sc-clear", "Tap again to clear it", "Clear the scene")}</button>` : ""}</div></div>`;
  }

  // Who's done what this round, on the GM's page.
  function crewLine(id, doc, round) {
    const roster = rosterOf(id);
    if (!roster.length) return "";
    const rows = roster.map((p) => {
      const done = doneBy(doc, round, p.user, p.ch);
      const took = round.tele.filter((t) => t.icp && t.icp.user === p.user && t.icp.ch === p.ch).map((t) => `took ${lower(t.who)} for ${t.at.name}${t.icp.free ? ", free" : t.icp.paid === false ? " on the same Aura" : ""}`);
      const extra = done.more.length ? `<small>${done.more.length === 1 ? "An extra action" : `${cap(words(done.more.length))} extra actions`}: ${esc(done.more.map(moreName).join(", "))}</small>` : "";
      const said = [...done.lines, ...took];
      return `<li><b>${esc(p.cname)}</b>${said.length ? said.map((x) => `<span class="tg-did">${esc(cap(x))}</span>`).join("") : '<span class="tg-did tg-none">Hasn’t acted yet</span>'}${extra}</li>`;
    }).join("");
    return `<div class="tg-crew"><h3 class="tg-h3">The crew this round</h3><ul class="tg-crewlist">${rows}</ul></div>`;
  }

  // The player's action this round, under what's coming at them: what it's
  // on, or what it could go on, and where another one came from.
  function actionPanel(ch, id, doc, last) {
    if (!last || last.over) return "";
    const c = d.normal(ch);
    const s = ch.state;
    const rec = actsIn(s, id, last.id);
    const sp = spentBy({ ...last, acts: { ...last.acts, [keyOf(me(), ch.id)]: rec } }, me(), ch.id);
    const done = doneBy(doc, { ...last, acts: { ...last.acts, [keyOf(me(), ch.id)]: rec } }, me(), ch.id);
    const left = sp.have - sp.used;
    // How the table judged each one, once it has.
    const judged = last.acts?.[keyOf(me(), ch.id)]?.list ?? [];
    const backs = rec.list.map((a) => `<li><span>${esc(cap(actLine({ ...a, did: judged.find((x) => x.id === a.id)?.did, user: me(), ch: ch.id }, doc, last)))}</span>${a.k === "work" && a.roll ? "" : `<button type="button" class="button sm" data-act="tg" data-do="unact" data-a="${esc(a.id)}">Take it back</button>`}</li>`).join("");
    const answers = last.tele.filter((t) => t.ans && isAt(t.ans, ch.id)).map((t) => `<li><span>${esc(cap(`answering ${lower(t.who)} with ${t.ans.act}: ${outcome(t.ans.won)}`))}</span></li>`).join("");
    const head = left > 0 ? (sp.used ? `<b>${left === 1 ? "One more action" : `${cap(words(left))} more actions`}</b> to spend this round.` : "<b>Your action’s still yours.</b> Answer one telegraph, put it into a friend’s answer, or do something else.") : `<b>${sp.have === 1 ? "Your action’s spent" : "Your actions are spent"}</b> this round.`;
    const more = rec.more.length ? `<p class="cc-small">${sp.have === 2 ? "An extra action" : `${cap(words(rec.more.length))} extra actions`} from ${esc(andList(rec.more.map(moreName)))}.</p>` : "";
    const canFire = s.conf >= 12;
    const extra = `<details class="tg-more" data-open="tg-more"${d.isOpen("tg-more") ? " open" : ""}><summary>Got another action?</summary><div class="cc-chips">${MORES.filter(([k]) => k !== "fired" || canFire).map(([k, label]) => `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="more" data-k="${k}"${(k === "resolve" && s.resolve < 1) || (ONCE.includes(k) && rec.more.includes(k)) ? " disabled" : ""}>${esc(label)}</button>`).join("")}</div><p class="cc-small">Holding your action last round, coming out of hiding, 1 Resolve, d12 Confidence or a trait that says so.</p></details>`;
    return `<div class="tg-yours" role="group" aria-label="Your action this round"><p class="tg-yours-head">${head}</p>${answers || backs ? `<ul class="tg-done">${answers}${backs}</ul>` : ""}${more}
      ${left > 0 ? `<div class="cc-row"><button type="button" class="button" data-act="tg" data-do="else">Something else</button></div>` : ""}${extra}</div>`;
  }

  // ------------------------------------------------------------ the GM's round

  const sure = (key, yes, no) => (ui.sure === key ? yes : no);
  // A telegraph she's building, as it'll go out: what it's at, named the way
  // the scene names it now.
  function asSent(id, t) {
    const k = t.at?.k;
    if (k === "stake" || k === "event") return { ...t, at: { ...t.at, name: findEl(local(id), t.at.ref)?.el.name ?? "something that’s gone" } };
    if (k === "place") return t;
    const p = rosterOf(id).find((x) => x.user === t.at?.user && x.ch === t.at?.ch);
    return { ...t, at: { ...(t.at ?? {}), name: p?.cname ?? "someone who’s gone", arch: t.at?.arch ?? [] } };
  }
  // Whether one she's built can still go out: whoever it's at is playing here,
  // or whatever it's at is still on the scene and not settled.
  function draftOk(id, t) {
    const k = t.at?.k;
    if (k === "stake" || k === "event") {
      const hit = findEl(local(id), t.at.ref);
      return Boolean(hit && hit.kind === k && !hit.el.out);
    }
    if (k === "place") return true;
    return rosterOf(id).some((p) => p.user === t.at?.user && p.ch === t.at?.ch);
  }
  // The round she's building, as cards.
  function draftCard(id, t, n) {
    const v = asSent(id, t);
    const warn = draftOk(id, t) ? "" : t.at?.k ? "What this was aimed at has gone from the scene, or it’s settled." : "Whoever this was aimed at isn’t playing here now.";
    const extra = `<div class="tg-do"><button type="button" class="button sm" data-act="tg" data-do="edit" data-id="${esc(t.id)}">Change it</button><button type="button" class="button sm" data-act="tg" data-do="drop" data-id="${esc(t.id)}">Take it off</button>${warn ? `<p class="cc-warn">${warn}</p>` : ""}</div>`;
    const when = atPlace(v) ? (t.kind === "fear" ? "Hits whoever’s there, against Confidence" : "Hits whoever’s there when it lands") : t.kind === "fear" && !onScene(v) ? "Lands on Confidence at the end of the round" : "";
    return `<li class="tg is-draft">${kitTele({ who: t.who, does: t.does, at: atName(v), atCrest: v.at.k ? null : v.at.arch, aim: aimOf(v), d: t.d, round: n, one: oneOf(v), when, extra, strict: false })}</li>`;
  }

  // The GM's live cards: who's got it, and how each one went.
  function gmCard(id, t, round, live) {
    const s = stateOf(t, round);
    let extra = verdict(t, round, { forGm: true, doc: local(id) });
    if (s === "coming") {
      const queued = waiting(id, (o) => o.o === "round" || o.o === "add");
      const scene = Boolean(t.at.k);
      const where = scene ? (queued ? "Goes to every phone when you’ve got a signal." : "On every phone.")
        : queued ? `Goes to ${esc(t.at.player || t.at.name)}’s phone when you’ve got a signal.` : t.seen ? `On ${esc(t.at.player || t.at.name)}’s phone.` : `Not on ${esc(t.at.player || t.at.name)}’s phone yet. It’ll get there when ${esc(t.at.player || "they")} opens ${esc(t.at.name)} or the campaign.`;
      const took = t.icp ? ` ${esc(t.icp.name)}’s taking it for ${esc(t.at.name)}${t.icp.free ? ", free" : t.icp.paid === false ? " on the same Aura" : ", for 1 Aura"}, so it lands on ${esc(t.icp.name)}.` : "";
      const ins = joinersOf(round, t.id);
      const inOn = ins.length ? ` ${ins.length === 1 ? `${esc(ins[0].name)}’s put an action` : `${esc(andList(ins.map((j) => j.name)))} have put their actions`} into whoever answers it.` : "";
      const lands = onScene(t) ? " Anyone can answer it." : atPlace(t) ? ` Each of them says whether they’re ${esc(t.at.where)}, and it lands on whoever is.` : "";
      extra = `<div class="tg-v is-wait"><p>${where}${lands}${took}${inOn}</p>${atPlace(t) ? thereChips(id, t, round) : ""}${live && !t.icp ? `<div class="tg-do"><button type="button" class="button sm" data-act="tg" data-do="take" data-id="${esc(t.id)}">${sure(`take-${t.id}`, "Tap again to take it back", "Take it back")}</button></div>` : ""}</div>`;
    } else if (atPlace(t) && round.over && !t.ans && s !== "held" && s !== "through") extra += thereChips(id, t, round);
    return card(t, round, extra, { lit: takeLit(t.id) });
  }
  // Who's in a place, on the GM's card, each a tap to put them in or out by
  // hand: for what the story does that the phones don't. Not once they've
  // rolled When it lands.
  function thereChips(id, t, round) {
    const people = new Map(Object.entries(t.there ?? {}));
    for (const p of rosterOf(id)) if (!people.has(keyOf(p.user, p.ch))) people.set(keyOf(p.user, p.ch), { name: p.cname, in: 0 });
    if (!people.size) return "";
    const chips = [...people].map(([key, p]) => {
      const [user, ch] = key.split("|");
      return `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="gthere" data-id="${esc(t.id)}" data-user="${esc(user)}" data-ch="${esc(ch)}"${pressedAttr(Boolean(p.in))}${p.def ? " disabled" : ""} aria-label="${esc(p.name)}, ${p.in ? `${esc(t.at.where)}` : "out of it"}">${esc(p.name)}</button>`;
    }).join("");
    return `<div class="tg-there"><p class="tg-q">${esc(cap(t.at.where))}?</p><div class="cc-chips" role="group" aria-label="${esc(`Who’s ${t.at.where}`)}">${chips}</div><p class="cc-small">${round.over ? "Not right? Tap someone to put them in or out." : "Tap someone to put them in or out by hand."}</p></div>`;
  }

  // The round on the GM's campaign page, at the top, since it's what she taps
  // most in a fight.
  function section(id) {
    if (roleIn(id) !== "gm") return "";
    const k = camp(id);
    const roster = rosterOf(id);
    const doc = local(id);
    const last = current(doc);
    const live = Boolean(last && !last.over);
    const building = !live && k.drafts.length > 0;
    const n = live ? last.n : (last?.n ?? 0) + 1;
    const head = (title) => `<div class="tg-head"><h2 id="tg-h">${title}</h2>${netLine(id, k)}</div>`;
    const sending = waiting(id) ? `<p class="cc-small tg-wait">${online() ? "Sending…" : "It goes out when you’ve got a signal."}</p>` : "";
    const lead = (text) => `<p class="cc-lead">${text}</p>`;
    let body = "";
    if (!roster.length && !last && !building) {
      return `<section class="cc-sec tg-sec" aria-labelledby="tg-h">${head("Telegraphs")}${lead("Once your players join with their characters, you can telegraph at them from here. Each one goes to the phone of whoever it’s aimed at, and you see how they answer it.")}</section>`;
    }
    if (building) {
      body = `${head(`Round ${n}`)}<p class="cc-small tg-sum">Not sent yet. Put in everything that’s coming this round, then send it.</p>
        <ol class="tg-list">${k.drafts.map((t) => draftCard(id, t, n)).join("")}</ol>
        <div class="cc-row tg-bar"><button type="button" class="button" data-act="tg" data-do="compose">Telegraph something else</button><button type="button" class="button primary" data-act="tg" data-do="send">Send round ${n}</button></div>`;
    } else if (live) {
      body = `${head(`Round ${n}`)}<p class="cc-small tg-sum" aria-live="polite">${tally(last)}</p>${sending}
        <ol class="tg-list">${last.tele.map((t) => gmCard(id, t, last, true)).join("")}</ol>${crewLine(id, doc, last)}
        <div class="cc-row tg-bar"><button type="button" class="button" data-act="tg" data-do="compose">Telegraph something else</button><button type="button" class="button primary" data-act="tg" data-do="end">${sure("end", "Tap again to end it", `End round ${n}`)}</button></div>
        <p class="cc-small">Ending it lands whatever’s still coming, and each of them rolls When it lands on their phone.</p>`;
    } else if (last) {
      body = `${head(`Round ${last.n}`)}<p class="cc-small tg-sum" aria-live="polite">Over. ${tally(last)}${moves(doc, last)}</p>${sending}
        <ol class="tg-list">${last.tele.map((t) => gmCard(id, t, last, false)).join("")}</ol>${crewLine(id, doc, last)}
        <div class="cc-row tg-bar"><button type="button" class="button primary" data-act="tg" data-do="compose">Telegraph round ${last.n + 1}</button>${sceneOnly(doc) ? `<button type="button" class="button" data-act="tg" data-do="send">Round ${last.n + 1}, with only the scene</button>` : ""}<button type="button" class="button" data-act="tg" data-do="fight">${sure("fight", "Tap again: the next one’s round 1", "That fight’s over")}</button></div>`;
    } else {
      body = `${head("Telegraphs")}${lead("Telegraph the round from here and each one goes to the phone of whoever it’s aimed at. They answer it there, or let it land, and you see how it went as it happens.")}
        <div class="cc-row tg-bar"><button type="button" class="button primary" data-act="tg" data-do="compose">Telegraph something</button>${sceneOnly(doc) ? '<button type="button" class="button" data-act="tg" data-do="send">Start round 1 with only the scene</button>' : ""}</div>`;
    }
    // Earlier rounds of this fight, a line each.
    const earlier = doc.rounds.slice(0, building || !last ? doc.rounds.length : -1).reverse();
    const past = earlier.length ? `<details class="cc-group tg-past" data-open="tg-past"${d.isOpen("tg-past") ? " open" : ""}><summary>Earlier this fight <small>${earlier.length === 1 ? `round ${earlier[0].n}` : `rounds ${earlier[earlier.length - 1].n} to ${earlier[0].n}`}</small></summary>
      <ul class="tg-earlier">${earlier.map((r) => `<li><b>Round ${r.n}</b> ${tally(r)}<ul>${r.tele.map((t) => `<li>${esc(cap(t.who))}’s d${t.d} at ${esc(atName(t))}: ${esc(pastLine(t, r, doc))}</li>`).join("")}</ul></li>`).join("")}</ul></details>` : "";
    return `<section class="cc-sec tg-sec" aria-labelledby="tg-h">${body}${ui.note ? `<div class="cc-note is-warn" role="alert"><p>${esc(ui.note)}</p></div>` : ""}${gmScene(id, doc, last)}${past}</section>`;
  }
  // A round can go out with nothing telegraphed, when the scene's got something running.
  const sceneOnly = (doc) => [...doc.scene.stakes, ...doc.scene.events].some((el) => !el.out);
  // What the end of a round stepped down, in a line.
  function moves(doc, round) {
    const said = (round.moved ?? []).map((m) => {
      const el = findEl(doc, m.ref)?.el;
      return el ? movedSaid(el, m) : "";
    }).filter(Boolean);
    return said.length ? ` ${esc(said.join(" "))}` : "";
  }
  function pastLine(t, round, doc) {
    const s = stateOf(t, round);
    if (onScene(t) && (s === "hit" || s === "through")) return `${s === "hit" ? `${t.ans?.name}’s answer lost, so it landed` : "landed"}${t.did ? `, and ${didSaid(t, doc)}` : ""}`;
    if (atPlace(t) && s !== "stopped" && s !== "coming") return s === "clear" ? "landed on nobody" : s === "hit" ? `${t.ans?.name}’s answer lost, so it landed on ${namesIn(t) || "nobody"}` : `landed on ${namesIn(t)}${s === "landed" ? ", When it lands not all rolled" : s === "held" ? ", and stopped" : ", and got through"}`;
    return { stopped: `stopped by ${t.ans?.name}`, hit: `${t.ans?.name}’s answer lost, so it landed`, landed: "landed, When it lands not rolled", held: "landed, and stopped", through: `got through${t.def?.paid ? ` (${t.def.paid.toLowerCase()})` : ""}`, coming: "still coming" }[s];
  }

  // A player's campaign page says what's coming at them, and where to answer it.
  function pointer(id) {
    if (roleIn(id) !== "player") return "";
    const ch = myCharacter(id);
    if (!ch) return "";
    const doc = local(id);
    const last = current(doc);
    if (!last) return "";
    const at = last.tele.filter((t) => landsHere(t, ch.id));
    const open = at.filter((t) => ["coming", "landed"].includes(stateHere(t, last, ch.id)));
    if (!open.length) return "";
    const coming = open.filter((t) => stateHere(t, last, ch.id) === "coming").length;
    const text = coming ? `Round ${last.n}: ${plural(coming, "telegraph’s", "telegraphs are")} coming at ${esc(ch.name)}.` : `Round ${last.n}’s over and ${words(open.length)} landed on ${esc(ch.name)}.`;
    return `<div class="cc-note tg-point" role="status"><p>${text} ${coming ? (coming === 1 ? "Answer it" : "Answer them") : "Roll When it lands"} on ${esc(ch.name)}’s play screen.</p></div>`;
  }

  // ------------------------------------------------------------ on the play screen

  // Whatever's coming at this character, at the top of their Play tab, then
  // their action this round, the rest of the round, face up, since anyone can
  // answer any of it, and the scene.
  function playCard(ch) {
    const id = d.campOf(ch);
    if (!id || !sync.me) return "";
    const k = camp(id);
    const doc = local(id);
    const last = current(doc);
    const scene = sceneParts(doc);
    if (!last && !scene.any) return "";
    const live = Boolean(last && !last.over);
    const key = keyOf(me(), ch.id);
    // Aimed at them, one they took for a friend, or one at a place they were
    // in when it went out (it stays put while they get in and out of it).
    const isMine = (t) => isAt(t.at, ch.id) || isAt(t.icp, ch.id) || Boolean(atPlace(t) && t.there?.[key]);
    // Anything from an earlier round that landed on them and still needs its roll.
    const earlier = doc.rounds.slice(0, -1).map((r) => ({ r, list: r.tele.filter((t) => landsHere(t, ch.id) && stateHere(t, r, ch.id) === "landed") })).filter((x) => x.list.length);
    const owed = earlier.flatMap((x) => x.list);
    const at = last ? last.tele.filter(isMine) : [];
    const others = last ? last.tele.filter((t) => !isMine(t)) : [];
    const rec = last ? actsIn(ch.state, id, last.id) : { more: [], list: [] };
    const mineNow = last ? { ...last, acts: { ...last.acts, [keyOf(me(), ch.id)]: rec } } : null;
    const sp = mineNow ? spentBy(mineNow, me(), ch.id) : { used: 0, have: 1 };
    const can = live && sp.used < sp.have;
    const c = d.normal(ch);
    const queued = k.out.some((o) => ["answer", "defend", "icp", "acts"].includes(o.o));
    const wait = queued ? `<p class="cc-small tg-wait">${online() ? "Sending it to " : "It goes up to "}${esc(gmName(id))}${online() ? "…" : " when you’ve got a signal."}</p>` : "";
    const joined = (t) => rec.list.some((a) => a.k === "join" && a.ref === t.id);
    const answerBtn = (t, label, primary = false) => (can && !joined(t) ? `<button type="button" class="button${primary ? " primary" : " sm"}" data-act="tg" data-do="answer" data-id="${esc(t.id)}">${label}</button>` : "");
    const mineCard = (t, round) => {
      if (atPlace(t)) return placeCard(t, round);
      const s = stateOf(t, round);
      let extra = verdict(t, round, { mine: landsHere(t, ch.id), ch });
      if (s === "coming") {
        const took = isAt(t.icp, ch.id);
        const note = took ? `<p class="cc-small">You took it for ${esc(t.at.name)}, so it comes at you when it lands.</p>` : t.icp ? `<p class="cc-small">${esc(t.icp.name)}’s taking it for you, so it lands on ${esc(t.icp.name)}.</p>` : `<p class="cc-small">${can ? "Or let it land, and roll When it lands when the round ends." : "Your action’s spent, so it lands at the end of the round, and you roll When it lands then."}</p>`;
        const back = took ? `<button type="button" class="button sm" data-act="tg" data-do="icp-off" data-id="${esc(t.id)}">Give it back</button>` : "";
        extra = `<div class="tg-do">${answerBtn(t, "Answer it", !took)}${back}${note}</div>`;
      }
      if (s === "landed" && landsHere(t, ch.id)) extra += `<div class="tg-do"><button type="button" class="button primary" data-act="tg" data-do="land" data-k="${t.kind}">When it lands</button></div>`;
      return card(t, round, extra, { lit: takeLit(t.id) });
    };
    // One at a place: whether they're in it, said with a tap, and getting out
    // gets them clear. It lands on them only if they're still in it.
    const placeCard = (t, round) => {
      const s = stateFor(t, round, key);
      const inNow = Boolean(t.there?.[key]?.in);
      let extra = verdict(t, round, { ch });
      if (s === "coming") {
        const say = inNow ? `You’re ${esc(t.at.where)}, so it lands on you at the end of the round. ${can && !joined(t) ? "Answer it, or get out of there and it can’t touch you." : "Get out of there and it can’t touch you."}` : "You’re out of it, so it can’t touch you.";
        extra = `<div class="tg-in"><p class="tg-q" id="tg-q-${esc(t.id)}">${esc(cap(t.at.where))}?</p><div class="tg-in-btns" role="group" aria-labelledby="tg-q-${esc(t.id)}"><button type="button" class="cc-chipbtn" data-act="tg" data-do="there" data-id="${esc(t.id)}" data-v="1"${pressedAttr(inNow)}>I’m in it</button><button type="button" class="cc-chipbtn" data-act="tg" data-do="there" data-id="${esc(t.id)}" data-v="0"${pressedAttr(!inNow)}>I’m out of it</button></div></div>
          <div class="tg-do">${answerBtn(t, "Answer it", inNow)}<p class="cc-small">${say}</p></div>`;
      }
      if (s === "landed") extra += `<div class="tg-do"><button type="button" class="button primary" data-act="tg" data-do="land" data-k="${t.kind}">When it lands</button></div>`;
      return card(t, round, extra, { lit: takeLit(t.id), ch });
    };
    // A friend's: answer it for them, put your action into whoever does, or
    // take it for them (blows only, since fear's inside their head).
    const takeBtn = (t) => {
      if (!live || t.at.k || t.kind === "fear" || t.ans || t.icp || isAt(t.at, ch.id)) return "";
      const free = guardianOf(c);
      const paid = !free && paidFor(doc, last, ch.id, t.at);
      const label = free ? "Take it, free" : paid ? "Take it, already paid" : "Take it: 1 Aura";
      return `<button type="button" class="button sm" data-act="tg" data-do="icp" data-id="${esc(t.id)}"${!free && !paid && ch.state.aura < 1 ? " disabled" : ""}>${label}</button>`;
    };
    // Everyone else's, a row each. One at a stake or a clock is anyone's to
    // answer, and says what it does if it lands, then what it did.
    const other = (t) => {
      const s = stateOf(t, last);
      const scene = onScene(t);
      const state = { coming: "", stopped: "Stopped", hit: "Landed", landed: "Landed", held: "Stopped when it landed", through: scene ? "Landed" : "Got through", clear: "Landed on nobody" }[s];
      const ins = joinersOf(last, t.id).filter((j) => !(j.user === me() && j.ch === ch.id));
      const chips = [t.icp ? `${t.icp.name}’s taking it` : "", ins.length && s === "coming" ? `${andList(ins.map((j) => j.name))} ${ins.length === 1 ? "is" : "are"} in on it` : ""].filter(Boolean).map((x) => `<span class="tg-chip">${esc(x)}</span>`).join("");
      const btns = s === "coming" ? (joined(t) ? `<span class="tg-chip is-mine">You’re in on it</span><button type="button" class="button sm" data-act="tg" data-do="unact" data-a="${esc(rec.list.find((a) => a.k === "join" && a.ref === t.id).id)}">Take it back</button>` : `${answerBtn(t, t.at.k ? "Answer it" : `Answer it for ${esc(t.at.name)}`)}${can ? `<button type="button" class="button sm" data-act="tg" data-do="join" data-id="${esc(t.id)}">Put your action in</button>` : ""}${takeBtn(t)}`) : "";
      const fx = scene ? (s === "coming" ? `If it lands, ${fxSaid(t)}.` : t.did ? `${cap(didSaid(t, doc))}.` : "") : "";
      return `<li class="tg-row${s === "coming" ? "" : ` is-${s}`}${scene ? " is-scene" : ""}">${kitDie(t.d, { own: "them", hide: true })}<p><b>${esc(t.who)}</b> at ${esc(atName(t))} <small>${esc(t.does)}</small>${fx ? `<small class="tg-fx">${esc(fx)}</small>` : ""}${state ? ` <span class="tg-chip">${state}</span>` : ""}${chips}</p>${btns ? `<div class="tg-row-do">${btns}</div>` : ""}</li>`;
    };
    const coming = at.some((t) => stateHere(t, last, ch.id) === "coming" && landsHere(t, ch.id)) || owed.length;
    const title = !last ? "The scene" : last.over ? `Round ${last.n}’s over` : coming ? "Coming at you" : at.length ? "This round" : `Round ${last.n}`;
    const head = `<div class="tg-head"><h2 id="tg-play-h">${title}</h2>${netLine(id, k)}</div>`;
    const owedHtml = earlier.map((x) => `<p class="cc-small">From round ${x.r.n}:</p><ol class="tg-list">${x.list.map((t) => mineCard(t, x.r)).join("")}</ol>`).join("");
    const atHtml = !last ? "" : at.length ? `<ol class="tg-list">${at.map((t) => mineCard(t, last)).join("")}</ol>` : last.over ? "" : `<p class="cc-small">Nothing’s aimed at ${esc(ch.name)} this round.</p>`;
    const restTitle = at.length || owed.length ? "The rest of the round" : others.every((t) => !t.at.k) ? "Coming at the crew" : others.every((t) => t.at.k) ? "At the scene" : "The rest of the round";
    const rest = others.length ? `<h3 class="tg-h3">${restTitle}</h3><ul class="tg-rows">${others.map(other).join("")}</ul>` : "";
    const sceneHtml = scene.any ? `<details class="tg-scenefold" data-open="tg-scene"${d.isOpen("tg-scene") || (live && can && !at.length) ? " open" : ""}><summary><h3 class="sc-k">The scene</h3> <small>${esc(sceneGlance(doc))}</small></summary>${sceneList(id, doc, { round: last, live, can })}</details>` : "";
    return `<section class="cc-sec tg-play" aria-labelledby="tg-play-h">${head}${wait}${owedHtml}${atHtml}${last ? actionPanel(ch, id, doc, last) : ""}${rest}${sceneHtml}</section>`;
  }

  // The telegraphs that landed on this character and still need When it lands:
  // the blows (Defend) or the fear (Confidence), ready for the defence roll.
  function landedFor(ch, kind = null) {
    const id = ch ? d.campOf(ch) : null;
    if (!id) return null;
    const doc = local(id);
    const list = doc.rounds.flatMap((r) => r.tele.filter((t) => landsHere(t, ch.id) && stateHere(t, r, ch.id) === "landed").map((t) => ({ ...t, round: r })));
    const blows = list.filter((t) => t.kind !== "fear");
    const fear = list.filter((t) => t.kind === "fear");
    const pick = kind === "fear" ? fear : kind === "blow" ? blows : blows.length ? blows : fear;
    if (!pick.length) return null;
    // Defending was their action in the round these landed in.
    const defending = pick[0].kind !== "fear" && actsIn(ch.state, id, pick[0].round.id).list.some((a) => a.k === "else" && a.act === "Defend");
    return {
      defend: defending,
      camp: id,
      against: pick[0].kind === "fear" ? "confidence" : "blows",
      incoming: pick.map((t) => t.d),
      intents: Object.fromEntries(pick.map((t, j) => [`d${j}`, String(t.does).slice(0, 40)])),
      teles: pick.map((t) => t.id),
      from: Object.fromEntries(pick.map((t) => [t.id, { who: t.who, d: t.d, does: t.does }])),
      more: kind ? 0 : (pick === blows ? fear.length : 0),
    };
  }

  // ------------------------------------------------------------ answers and rolls

  // An answer or a defence roll, written into the character as part of the
  // change that rolled it, so the character's Undo takes it back too. Only
  // what the table still has is kept.
  // a: answers and d: When it lands, by telegraph; i: intercepts, by
  // telegraph; x: what the character spent their actions on, by round.
  function record(s, id, kind, key, val) {
    if (!id || !key) return;
    const t = s.tele && typeof s.tele === "object" && s.tele.c === id ? s.tele : { c: id, a: {}, d: {} };
    for (const part of ["a", "d", "i", "x", "w"]) t[part] = t[part] && typeof t[part] === "object" ? t[part] : {};
    const doc = local(id);
    const keepIds = new Set(doc.rounds.flatMap((r) => r.tele.map((x) => x.id)));
    const keepRounds = new Set(doc.rounds.map((r) => r.id));
    for (const part of ["a", "d", "i", "w"]) for (const x of Object.keys(t[part])) if (!keepIds.has(x)) delete t[part][x];
    for (const x of Object.keys(t.x)) if (!keepRounds.has(x)) delete t.x[x];
    // An answer keeps the time it was first rolled, so one paid for or
    // rolled again later still says when it happened.
    if (val == null) delete t[kind][key];
    else t[kind][key] = kind === "a" ? { ...val, t: t.a[key]?.t ?? Date.now() } : val;
    s.tele = t;
  }
  // What a character's spent their actions on in a round, as the phone has it.
  const actsIn = (s, id, roundId) => {
    const x = s?.tele?.c === id ? s.tele.x?.[roundId] : null;
    return { more: Array.isArray(x?.more) ? [...x.more] : [], list: Array.isArray(x?.list) ? x.list.map((a) => ({ ...a })) : [] };
  };
  const setActs = (s, id, roundId, rec) => record(s, id, "x", roundId, rec.list.length || rec.more.length ? rec : null);

  // A character's been saved: what it rolled against the table goes up, and
  // anything it's taken back (an Undo) comes off.
  function soon(ch) {
    const id = ch ? d.campOf(ch) : null;
    if (!id || !sync.me || roleIn(id) !== "player") return;
    const k = camp(id);
    const t = ch.state?.tele;
    const want = {};
    if (t && t.c === id) {
      for (const part of ["a", "d", "i", "x"]) for (const [x, v] of Object.entries(t[part] ?? {})) want[`${ch.id}|${part}|${x}`] = v;
    }
    const doc = local(id);
    let queued = false;
    for (const [key, v] of Object.entries(want)) {
      const h = JSON.stringify(v);
      if (k.sent[key] === h) continue;
      const [, part, x] = key.split("|");
      const hit = part === "x" ? doc.rounds.find((r) => r.id === x) : findTele(doc, x);
      // One the table hasn't got any more is nobody's business now.
      if (!hit) continue;
      k.sent[key] = h;
      // The table has it already, from this player's other phone.
      if (sameAs(hit, part, v, ch.id)) continue;
      k.out.push({ ...opFor(part, x, ch.id, v), n: ++st.n, at: Date.now() });
      queued = true;
    }
    for (const key of Object.keys(k.sent)) {
      if (!key.startsWith(`${ch.id}|`) || key in want) continue;
      const [, part, x] = key.split("|");
      delete k.sent[key];
      // Taken back, while the table still has it.
      if (!(part === "x" ? doc.rounds.some((r) => r.id === x) : findTele(doc, x))) continue;
      k.out.push({ ...opFor(part, x, ch.id, null), n: ++st.n, at: Date.now() });
      queued = true;
    }
    if (!queued) return;
    keep();
    flush(id);
  }

  // The change that sends one of a character's parts up, or takes it back.
  function opFor(part, x, ch, v) {
    if (part === "a") return { o: "answer", id: x, ch, a: v };
    if (part === "d") return { o: "defend", id: x, ch, r: v };
    if (part === "i") return v ? { o: "icp", id: x, ch, free: Boolean(v.free), paid: Boolean(v.paid) } : { o: "icp", id: x, ch, off: true };
    return { o: "acts", round: x, ch, x: v };
  }

  // Whether the table's got this answer, When it lands, intercept or round's
  // actions already (hit's the telegraph, or the round for actions).
  function sameAs(hit, part, v, chId) {
    const dice = (list) => JSON.stringify((list ?? []).map((x) => [x.size, x.total]));
    const t = hit.t ?? hit;
    if (part === "a") return Boolean(t.ans && t.ans.user === me() && t.ans.ch === chId && t.ans.act === v.act && t.ans.opp === v.opp && dice(t.ans.dice) === dice(v.dice));
    if (part === "i") return Boolean(t.icp && t.icp.user === me() && t.icp.ch === chId && Boolean(t.icp.free) === Boolean(v.free) && Boolean(t.icp.paid) === Boolean(v.paid));
    if (part === "x") {
      const a = hit.acts?.[keyOf(me(), chId)];
      const bare = (list) => JSON.stringify((list ?? []).map((y) => [y.id, y.k, y.ref ?? "", y.act, y.aim ?? "", dice(y.roll?.dice), y.roll?.opp ?? null]));
      return Boolean(a) && JSON.stringify(a.more) === JSON.stringify(v.more ?? []) && bare(a.list) === bare(v.list);
    }
    const def = atPlace(t) ? t.there?.[keyOf(me(), chId)]?.def : landsOn(t).user === me() ? t.def : null;
    return Boolean(def && def.stopped === v.stopped && def.mine === v.mine && def.v === v.v && def.paid === (v.paid || ""));
  }

  // What the roll card says about an answer, or a When it lands, and where it's got to.
  function rollNote(r) {
    const id = r.kind === "defence" ? r.camp : r.tele?.camp ?? r.work?.camp;
    if (!id) return "";
    if (r.work) {
      const queuedW = camp(id).out.some((o) => o.o === "acts");
      const sentW = queuedW ? (online() ? `Sending it to ${gmName(id)}…` : `It goes up to ${gmName(id)} when you’ve got a signal.`) : `${gmName(id)} has it.`;
      // Once the table has it, it's the table's call: someone else's roll at
      // it might have got there first, and that's the number that stands.
      const doc = local(id);
      const round = doc.rounds.find((x) => x.id === r.work.round);
      const ch = d.current();
      const judged = ch ? round?.acts?.[keyOf(me(), ch.id)]?.list?.find((a) => a.id === r.work.actId) : null;
      const el = findEl(doc, r.work.ref)?.el;
      const stood = round?.held?.[r.work.ref];
      const won = judged?.roll ? Boolean(judged.roll.won) : r.dice.some((x) => {
        const v = x.nat + x.plus;
        return v > r.opp || (v === r.opp && x.won);
      });
      const did = judged?.did;
      const gone = did?.tag || r.work.aim;
      const first = judged && stood != null && stood !== r.opp ? ` Someone got to it first this round, and its die came up ${stood}, so that’s the number you had to beat.` : "";
      const said = won
        ? r.work.event
          ? did?.out ? `<b>You beat it.</b> It happens${el?.what ? `: ${esc(String(el.what).replace(/[.\s]+$/, ""))}.` : "."}` : `<b>You beat it.</b> It ${r.work.aim === "drive" ? "steps down" : "steps back up"} a size.`
          : did?.won ? `<b>You beat it.</b> ${gone ? `<em>${esc(gone)}</em> was the last thing in its way` : "Nothing’s in its way now"}, so it’s the crew’s.` : `<b>You beat it.</b> ${gone ? `<em>${esc(gone)}</em>’s gone.` : "One thing in its way’s gone."}`
        : `<b>It held.</b>${r.work.event || el?.clock ? " You worked it, though, so it doesn’t step down this round." : ""}`;
      return `<div class="tg-v ${won ? "is-good" : "is-bad"} tg-verdict"><p>${said}${first}</p><p class="cc-small" role="status">${esc(sentW)}</p></div>`;
    }
    const gm = gmName(id);
    const queued = camp(id).out.some((o) => o.o === "answer" || o.o === "defend");
    const sent = queued ? (online() ? `Sending it to ${gm}…` : `It goes up to ${gm} when you’ve got a signal.`) : `${gm} has it.`;
    if (r.kind === "defence") return `<p class="cc-small tg-sent" role="status">${esc(sent)}</p>`;
    const outs = r.dice.map((x) => {
      const t = x.nat + x.plus;
      return t > r.opp ? "beat" : t === r.opp ? (x.won ? "won" : "tie") : "under";
    });
    const won = outs.some((o) => o === "beat" || o === "won");
    const tie = !won && outs.includes("tie");
    const aim = r.tele?.aim ?? "";
    const lands = aim === "stake" || aim === "event" ? `<b>It lands now</b>, and ${esc(r.tele.fx)}.` : aim === "place" ? `<b>It lands now</b> on whoever’s ${esc(r.tele.where)}, with no defence. The GM says what it costs.` : "<b>It lands now</b>, and there’s no defence against it. The GM says what it costs.";
    const said = won ? "<b>Stopped.</b> It never lands." : tie ? "<b>A tie’s a loss</b>, so it lands now, unless you win the tie for 1 Aura." : lands;
    return `<div class="tg-v ${won ? "is-good" : "is-bad"} tg-verdict"><p>${said}</p><p class="cc-small" role="status">${esc(sent)}</p></div>`;
  }

  // What landed, at the top of When it lands.
  function landLine(r) {
    const list = (r.teles ?? []).filter(Boolean).map((x) => r.from?.[x]).filter(Boolean);
    if (!list.length) return "";
    return `<p class="tg-for"><span class="k">Landed on you</span> ${list.map((f) => `${esc(f.who)}’s d${f.d}: <em>${esc(f.does)}</em>`).join("<br>")}</p>`;
  }

  // The telegraph a roll card's answering, at the top of the card.
  function forLine(r) {
    if (r.work) {
      const w = r.work;
      return `<p class="tg-for"><span class="k">${w.event ? "Engaging" : "Working"}</span> ${esc(w.name)}, a d${w.d}${w.held != null ? `, and its ${w.held} stands this round` : ""}${w.aim ? `: ${w.event ? (w.aim === "drive" ? "driving it" : "slowing it") : `going for <em>${esc(w.aim)}</em>`}` : ""}</p>`;
    }
    const t = r.tele;
    if (!t) return "";
    return `<p class="tg-for"><span class="k">Answering</span> ${esc(t.who)}’s d${t.d}${t.atName && !t.mine ? ` at ${esc(t.atName)}` : ""}: <em>${esc(t.does)}</em></p>`;
  }

  // ------------------------------------------------------------ the dialogs

  // The composer's fields as the telegraph they'll make, with what it's aimed
  // at named the way the scene names it.
  function fromFields(id, f) {
    const k = f.at?.k;
    const t = { who: f.who.trim(), does: f.does.trim(), d: f.d, kind: f.kind === "fear" ? "fear" : "blow", one: f.one.trim() };
    if (k === "stake" || k === "event") {
      const el = findEl(local(id), f.at.ref)?.el ?? null;
      Object.assign(t, { kind: "blow", one: "", at: { k, ref: f.at.ref, name: el?.name ?? "something that’s gone" } });
      t.fx = k === "event" || (f.fx === "clock" && el?.clock) ? { by: f.by === 2 ? 2 : 1 } : { tag: f.tag.replace(/,/g, "").trim().slice(0, MAX.tag) };
    } else if (k === "place") {
      const p = placeOf(f.where);
      t.at = { k, name: p?.name ?? "everyone where it lands", where: p?.where ?? "where it lands" };
    } else {
      const p = rosterOf(id).find((x) => x.user === f.at?.user && x.ch === f.at?.ch);
      t.at = p ? { user: p.user, ch: p.ch, name: p.cname, arch: crestOf(id, p) ?? [] } : null;
    }
    return t;
  }
  // The card as it'll go out, while she builds it.
  function previewOf(id, f, n) {
    const t = fromFields(id, f);
    const shown = { ...t, who: t.who || "Who’s telegraphing", does: t.does || "What it’s doing" };
    const when = atPlace(t) ? (t.kind === "fear" ? "Hits whoever’s there, against Confidence" : "Hits whoever’s there when it lands") : t.kind === "fear" && !onScene(t) ? "Lands on Confidence at the end of the round" : "";
    return kitTele({ who: shown.who, does: shown.does, at: t.at ? atName(shown) : "who or what it’s aimed at", atCrest: t.at?.k ? null : t.at?.arch ?? [], aim: t.at ? aimOf(t) : "someone", d: f.d || 6, round: n, one: t.at ? oneOf(shown) : t.one, when, strict: false });
  }
  // The place on the scene's own telegraphs, each with what it's aimed at
  // found on the scene as it is: its stake (if she kept it on), the scene
  // clock, a part of the place, or one of the crew. A place from Twenty Places
  // has the book's, read by the build. One of her place pages has its own,
  // read here the same way (aims.js), and one she's written that doesn't say
  // what it's at waits for her to aim it.
  function pageTeles(id, sp, doc) {
    const stakes = doc.scene.stakes.map((x) => x.name);
    return (d.pageTeles?.(id, sp.id) ?? []).filter((t) => SIZES.includes(Number(t.d)) && String(t.text ?? "").trim()).map((t) => {
      const line = curlyQuotes(String(t.text).replace(/\*/g, "").replace(/\s+/g, " ").trim());
      const a = readAim(t.at, stakes, line);
      return { line, ...whoAndDoes(line, sp.name), d: Number(t.d), ...(a.why ? { kind: /\bConfidence\b/.test(String(t.at ?? "")) ? "fear" : "blow", aim: "crew", one: "" } : a) };
    });
  }
  function bookTeles(id) {
    const doc = local(id);
    const sp = doc.scene.place;
    const place = sp?.page ? { name: sp.name, tele: pageTeles(id, sp, doc) } : (d.places ?? []).find((p) => p.id === sp?.id);
    if (!place) return { place: null, list: [] };
    const list = [];
    (place.tele ?? []).forEach((b, i) => {
      if (b.aim === "stake") {
        const el = doc.scene.stakes.find((s) => s.name === b.stake && !s.out);
        if (el) list.push({ ...b, i, ref: el.id, at: lower(el.name) });
      } else if (b.aim === "clock") {
        const el = doc.scene.events.find((e) => e.scene && !e.out);
        if (el) list.push({ ...b, i, ref: el.id, at: lower(el.name) });
      } else list.push({ ...b, i, at: b.aim === "place" ? b.place : "one of the crew" });
    });
    return { place, list };
  }
  // How the book's telegraph goes, under its words.
  function bookSays(b) {
    const against = b.aim === "crew" || b.aim === "place" ? `, against ${b.kind === "fear" ? "Confidence" : "Defend"}` : "";
    const lands = b.aim === "stake" ? " · a new tag in its way if it lands" : b.aim === "clock" ? " · it drops a size if it lands" : b.one ? ` · ${b.one}` : "";
    return `d${b.d} at ${b.at}${against}${lands}`;
  }

  // Telegraphing something: the card as it'll go out, then the place's own
  // telegraphs if one from the book's on the scene, who or what it's at, how
  // hard, who's doing it and what.
  function composerView(r) {
    const id = r.camp;
    const f = r.f;
    const roster = rosterOf(id);
    const doc = local(id);
    const last = current(doc);
    const n = r.live ? last?.n ?? 1 : (last && !last.over ? last.n : (last?.n ?? 0) + 1);
    const k = f.at?.k ?? "";
    const target = k ? null : roster.find((p) => p.user === f.at?.user && p.ch === f.at?.ch) ?? null;
    const el = k === "stake" || k === "event" ? findEl(doc, f.at.ref)?.el ?? null : null;
    const known = threatsOf(id);
    const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
    const verbs = INTENTS[f.kind === "fear" ? "fear" : "blow"];
    const book = r.edit ? { place: null, list: [] } : bookTeles(id);
    const bookHtml = book.list.length ? `<div class="tg-book"><p class="tg-tlabel">From ${esc(book.place.name)}</p><ul class="tg-booklist">${book.list.map((b) => `<li><button type="button" class="tg-bookt" data-act="tg" data-do="book" data-i="${b.i}"${pressed(f.book === b.i)}>${kitDie(b.d, { own: "them", hide: true, bare: true })}<span><span class="tg-bookline">${esc(b.line)}</span><small>${esc(bookSays(b))}</small></span></button></li>`).join("")}</ul></div>` : "";
    // The scene: its open stakes, the scene clock and the events, and a place.
    const s = doc.scene;
    const open = [...s.events.filter((e) => e.scene), ...s.stakes, ...s.events.filter((e) => !e.scene)].filter((x) => !x.out);
    const sceneBtn = (x) => {
      const stake = x.t === "stake";
      const kind = stake ? "stake" : "event";
      const sub = stake ? `stake, a d${dieOf(x)}${x.clock ? `, clock d${x.clock}` : ""}` : x.scene && /^(the )?scene clock$/i.test(x.name.trim()) ? `d${x.d}` : `${x.scene ? "scene clock" : "event"}, d${x.d}`;
      return `<button type="button" class="tg-target is-scene" data-act="tg" data-do="tgt" data-k="${kind}" data-ref="${esc(x.id)}"${pressed(k === kind && f.at.ref === x.id)}>${kitDie(stake ? dieOf(x) : x.d, { own: x.scene ? "harm" : "them", hide: true, bare: true })}<span><b>${esc(x.name)}</b><small>${esc(sub)}</small></span></button>`;
    };
    const placeBtn = `<button type="button" class="tg-target is-scene" data-act="tg" data-do="tgt" data-k="place"${pressed(k === "place")}>${PIN}<span><b>A place</b><small>whoever’s in it</small></span></button>`;
    // What it does if it lands, by what it's at.
    let fx = "";
    if (k === "stake") {
      const clock = Boolean(el?.clock);
      const byClock = clock && f.fx === "clock";
      fx = `<fieldset class="cc-group"><legend>If it lands</legend>
        <button type="button" class="cc-line" data-act="tg" data-do="fx" data-v="tag"${pressed(!byClock)}><span class="tick" aria-hidden="true"></span><span>A new tag in its way <small>one more thing to strip before it’s the crew’s</small></span></button>
        ${!byClock ? `<label class="tg-label" for="tg-tag">What goes in its way</label><input id="tg-tag" data-tg="tag" maxlength="${MAX.tag}" autocomplete="off" placeholder="Gone to Change" value="${esc(f.tag)}">` : ""}
        ${clock ? `<button type="button" class="cc-line" data-act="tg" data-do="fx" data-v="clock"${pressed(byClock)}><span class="tick" aria-hidden="true"></span><span>Its clock drops <small>on top of its step at the end of the round</small></span></button>` : ""}
        ${byClock ? sizesHtml(f.by) : ""}</fieldset>`;
    } else if (k === "event") {
      fx = `<fieldset class="cc-group"><legend>If it lands <small>it drops on top of its step at the end of the round</small></legend>${sizesHtml(f.by)}</fieldset>`;
    } else if (k === "place") {
      fx = `<label class="tg-label" for="tg-where">Where it lands</label><input id="tg-where" data-tg="where" maxlength="${MAX.name}" autocomplete="off" placeholder="on the burning stair" value="${esc(f.where)}">
        <p class="cc-small tg-hint">Everyone’s in it when it goes out, and each player says on their phone if they’re not. Getting out gets them clear.</p>`;
    }
    const crewOrPlace = !k || k === "place";
    return `<div class="dlg-head"><div class="cc-live"><p class="kicker tg-k">Round ${n}${r.live ? " · on now" : ""}</p><h2 id="dlg-title">${r.edit ? "Change the telegraph" : "Telegraph"}</h2></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>
    <div class="dlg-body tg-compose">
      <div class="tg-preview" aria-hidden="true">${previewOf(id, f, n)}</div>
      ${bookHtml}
      <fieldset class="cc-group"><legend>Who or what it’s aimed at</legend>
        ${roster.length ? `<p class="tg-tlabel">The crew</p><div class="tg-targets">${roster.map((p) => `<button type="button" class="tg-target" data-act="tg" data-do="at" data-user="${esc(p.user)}" data-ch="${esc(p.ch)}"${pressed(target === p)}>${crestHtml(id, p)}<span><b>${esc(p.cname)}</b><small>${esc(first(p.name))}</small></span></button>`).join("")}</div>` : ""}
        <p class="tg-tlabel">The scene</p><div class="tg-targets">${open.map(sceneBtn).join("")}${placeBtn}</div></fieldset>
      ${fx}
      <fieldset class="cc-group"><legend>How hard</legend>
        <div class="tg-sizes">${SIZES.map((x) => `<button type="button" class="tg-size" data-act="tg" data-do="d" data-d="${x}"${pressed(f.d === x)} aria-label="A d${x}">${kitDie(x, { own: "them", hide: true, bare: true })}<span>d${x}</span></button>`).join("")}</div></fieldset>
      <label class="tg-label" for="tg-who">Who’s telegraphing</label>
      <input id="tg-who" data-tg="who" maxlength="${MAX.who}" autocomplete="off" placeholder="The left Warden" value="${esc(f.who)}">
      ${known.length ? `<div class="cc-chips tg-known" role="group" aria-label="Who’s telegraphed already">${known.map((x) => `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="who" data-who="${esc(x.who)}" data-d="${x.d}"${pressed(f.who === x.who)}>${esc(x.who)} <small>d${x.d}</small></button>`).join("")}</div>` : ""}
      <label class="tg-label" for="tg-does">What it’s doing</label>
      <input id="tg-does" data-tg="does" maxlength="${MAX.does}" autocomplete="off" placeholder="${esc(target ? `Pin ${target.cname} against the wall` : k === "stake" ? "Head for the door with it" : k === "event" ? "Bring word the watch is coming" : k === "place" ? "Bring the stair down in flames" : "Pin her against the wall")}" value="${esc(f.does)}">
      ${!k ? `<div class="cc-chips tg-verbs" role="group" aria-label="Start it with">${verbs.map((v) => `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="verb" data-v="${v}">${v}${target ? ` ${esc(target.cname)}` : ""}</button>`).join("")}</div>` : ""}
      ${crewOrPlace ? `<fieldset class="cc-group"><legend>What lands</legend>
        <button type="button" class="cc-line" data-act="tg" data-do="kind" data-k="blow"${pressed(f.kind !== "fear")}><span class="tick" aria-hidden="true"></span><span>A blow <small>blades, falling rocks and teeth, stopped by ${k === "place" ? "each one’s" : "their"} Defend</small></span></button>
        <button type="button" class="cc-line" data-act="tg" data-do="kind" data-k="fear"${pressed(f.kind === "fear")}><span class="tick" aria-hidden="true"></span><span>Fear, lies or pressure <small>against ${k === "place" ? "each one’s" : "their"} Confidence</small></span></button></fieldset>
      <details class="cc-group" data-open="tg-one"${f.one || d.isOpen("tg-one") ? " open" : ""}><summary>Only one answer? <small>what happens if it lands</small></summary>
        <label class="cc-field" for="tg-one">If it lands</label><input id="tg-one" data-tg="one" maxlength="${MAX.one}" autocomplete="off" placeholder="The household clock drops two sizes" value="${esc(f.one)}"></details>` : `<p class="cc-small tg-hint">There’s no defence against it. Anyone can answer it with their action, and if nobody does, it does what it said when the round ends.</p>`}
      ${r.live ? `<p class="cc-small">It goes out now. The round can change while someone’s still got an action to answer it with.</p>` : ""}
    </div>
    <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}<button type="button" class="button primary" data-act="tg" data-do="save">${r.edit ? "Save it" : r.live ? "Send it now" : "Add it to the round"}</button></div>`;
  }
  // How many sizes a clock drops if it lands.
  const sizesHtml = (by) => `<div class="cc-chips" role="group" aria-label="How far it drops"><button type="button" class="cc-chipbtn" data-act="tg" data-do="by" data-v="1"${pressedAttr(by !== 2)}>A size</button><button type="button" class="cc-chipbtn" data-act="tg" data-do="by" data-v="2"${pressedAttr(by === 2)}>Two sizes</button></div>`;

  // Who's telegraphed already this fight, newest first, with the die they used.
  function threatsOf(id) {
    const k = camp(id);
    const seen = new Map();
    const all = [...k.drafts].reverse().concat(local(id).rounds.slice().reverse().flatMap((r) => [...r.tele].reverse()));
    for (const t of all) if (t.who && !seen.has(t.who)) seen.set(t.who, { who: t.who, d: t.d });
    return [...seen.values()].slice(0, 6);
  }
  // A player's crest, from their character's sheet on the GM's phone.
  function crestOf(id, p) {
    if (!p) return null;
    const pl = info(id)?.players?.find((x) => x.id === p.user);
    try {
      const c = pl?.character && typeof pl.character === "object" && pl.character.state ? d.normal(structuredClone(pl.character)) : null;
      return c ? c.titles.map((t) => t.archetype).filter(Boolean) : null;
    } catch {
      return null;
    }
  }
  function crestHtml(id, p) {
    const arch = crestOf(id, p);
    return `<span class="tg-crest" aria-hidden="true">${d.crest(arch ?? [])}</span>`;
  }

  // Answering: the telegraph, and the set action that fits the way you're
  // stopping it.
  function pickView(r) {
    const ch = d.current();
    const c = ch ? d.normal(ch) : null;
    const id = r.camp;
    const doc = local(id);
    const hit = findTele(doc, r.id);
    if (!c || !hit) {
      return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Answer it</h2></div><button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>
        <div class="dlg-body"><p class="cc-lead">That telegraph’s gone. The GM might have taken it back.</p></div>`;
    }
    const t = hit.t;
    const forOther = !t.at.k && !(t.at.user === me() && t.at.ch === ch.id);
    const ins = friendsIn(doc, hit, ch);
    const combo = ins.length ? `<p class="cc-lead"><b>${ins.length === 1 ? `${esc(ins[0].name)}’s` : `${esc(andList(ins.map((j) => j.name)))} are`} in on it</b>, so ${ins.reduce((n, j) => n + j.steps, 0)} more steps go into your roll as a combo.</p>` : "";
    const lead = onScene(t) ? `Pick the set action that fits the way you’re stopping it. Win and it never lands. Lose and it lands now, and ${esc(fxSaid(t))}.`
      : atPlace(t) ? `Pick the set action that fits the way you’re stopping it. Win and it never lands, on anyone. Lose and it lands now on whoever’s ${esc(t.at.where)}, with no defence.`
        : `Pick the set action that fits the way you’re stopping it: dodge it, block it, talk them down, or get your shot in first. Win and it never lands. Lose and it lands now, with no defence.${forOther ? ` If you put yourself in the way and lose, it lands on you.` : ""}`;
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${forOther ? `Answer it for ${esc(t.at.name)}` : "Answer it"}</h2><p class="cc-small">Spend your action on it.</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>
    <div class="dlg-body tg-pick">
      <ol class="tg-list">${card(t, hit.round)}</ol>
      ${combo}<p class="cc-lead">${lead}</p>
      <div class="tg-acts">${d.actions(ch, c).map((a) => `<button type="button" class="tile card tg-act" data-act="tg" data-do="with" data-a="${a.i}"><span class="tile-dice" aria-hidden="true">${a.dice}</span><span class="tile-name">${esc(a.name)}</span><span class="tile-says">${esc(a.says)}</span></button>`).join("")}</div>
      <details class="cc-group" data-open="tg-rule"${d.isOpen("tg-rule") ? " open" : ""}><summary>How answering works</summary><div class="cc-rule">${d.rule("s-answering")}</div></details>
    </div>`;
  }

  // ------------------------------------------------------------ actions, in dialogs

  // A set action to put in, as the answer picker draws them.
  const tiles = (ch, c, doIt) => `<div class="tg-acts">${d.actions(ch, c).map((a) => `<button type="button" class="tile card tg-act" data-act="tg" data-do="${doIt}" data-a="${a.i}"><span class="tile-dice" aria-hidden="true">${a.dice}</span><span class="tile-name">${esc(a.name)}</span><span class="tile-says">${esc(a.says)}</span></button>`).join("")}</div>`;
  const head = (title, sub = "") => `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${title}</h2>${sub ? `<p class="cc-small">${sub}</p>` : ""}</div><button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>`;
  const goneView = (title, why) => `${head(title)}<div class="dlg-body"><p class="cc-lead">${why}</p></div>`;

  // Putting your action into whoever answers a friend's telegraph.
  function joinView(r) {
    const ch = d.current();
    const c = ch ? d.normal(ch) : null;
    const hit = findTele(local(r.camp), r.id);
    if (!c || !hit) return goneView("Put your action in", "That telegraph’s gone. The GM might have taken it back.");
    const t = hit.t;
    return `${head("Put your action in", "It’s a combo: one roll between you.")}
    <div class="dlg-body tg-pick">
      <ol class="tg-list">${card(t, hit.round)}</ol>
      <p class="cc-lead">Whoever answers ${esc(lower(t.who))} rolls it with your steps in, and you both move with the roll: up a size if a die wins, down a size if they all miss. Pick the set action you’re putting in.</p>
      ${tiles(ch, c, "jwith")}
      <details class="cc-group" data-open="tg-rule-c"${d.isOpen("tg-rule-c") ? " open" : ""}><summary>How working together works</summary><div class="cc-rule">${d.rule("s-teamwork")}</div></details>
    </div>`;
  }

  // Working a stake or engaging an event: what you're going for, then the set action.
  function workView(r) {
    const ch = d.current();
    const c = ch ? d.normal(ch) : null;
    const doc = local(r.camp);
    const hit = findEl(doc, r.el);
    const last = current(doc);
    if (!c || !hit || hit.kind === "ground" || !last || last.over) return goneView("Work it", "That’s gone from the scene, or the round’s over.");
    const el = hit.el;
    const stake = hit.kind === "stake";
    const aims = stake ? el.tags.filter((g) => !g.gone).map((g) => [g.name, `<em>${esc(g.name)}</em>`]) : [["slow", "Slow it"], ["drive", "Drive it"]];
    if (!r.aim && aims.length) r.aim = aims[0][0];
    const held = last.held?.[el.id];
    return `${head(stake ? `Work ${esc(lower(el.name))}` : `Engage ${esc(lower(el.name))}`, "Spend your action on it.")}
    <div class="dlg-body tg-pick">
      <ul class="sc-list">${elCard(r.camp, el, { round: last, doc, h: 3 })}</ul>
      ${aims.length > 1 || !stake ? `<fieldset class="cc-group"><legend>${stake ? "What you’re going for" : "Which way"}</legend><div class="cc-chips">${aims.map(([v, label]) => `<button type="button" class="cc-chipbtn" data-act="tg" data-do="aim" data-v="${esc(v)}"${pressedAttr(r.aim === v)}>${label}</button>`).join("")}</div></fieldset>` : ""}
      <p class="cc-lead">${stake ? `Beat its d${dieOf(el)} and ${r.aim ? `<em>${esc(r.aim)}</em>’s gone` : "it’s yours"}.` : `Beat its d${el.d} and it ${r.aim === "drive" ? "steps down a size, and past d2 it happens" : "steps back up a size"}.`} ${held != null ? `Its die came up ${held} this round, and that’s the number to beat for everyone.` : "Its die’s rolled once a round, the first time anyone goes at it, and that roll stands."}${!stake || el.clock ? " Win or lose, it’s been worked, so it doesn’t step down this round." : ""}</p>
      ${tiles(ch, c, "wwith")}
      <details class="cc-group" data-open="tg-rule-s"${d.isOpen("tg-rule-s") ? " open" : ""}><summary>How stakes, clocks and events work</summary><div class="cc-rule">${d.rule("s-stakes")}</div></details>
    </div>`;
  }

  // Something else: the scene, a set action, Defend, or anything at all.
  function elseView(r) {
    const ch = d.current();
    const c = ch ? d.normal(ch) : null;
    const doc = local(r.camp);
    const last = current(doc);
    if (!c || !last || last.over) return goneView("Something else", "The round’s over.");
    const scene = sceneParts(doc);
    const open = [...scene.clocks, ...scene.stakes, ...scene.events].filter((el) => !el.out);
    const plain = [["Defend", "Defend", "every line on your Defend counts twice when the telegraphs land"], ["Move", "Move", "further than your stride"], ["Taking a breath", "Take a breath", "your Confidence comes up a size, as far as d6"]];
    return `${head("Something else", "Spend your action on it.")}
    <div class="dlg-body tg-pick tg-else">
      ${open.length ? `<h3 class="tg-h3">The scene</h3><div class="cc-chips">${open.map((el) => `<button type="button" class="cc-chipbtn" data-act="tg" data-do="work" data-el="${esc(el.id)}">${el.t === "stake" ? "Work" : "Engage"} ${esc(lower(el.name))}</button>`).join("")}</div>` : ""}
      ${scene.ground.length ? `<h3 class="tg-h3">The ground</h3><div class="cc-chips">${scene.ground.map((el) => `<button type="button" class="cc-chipbtn" data-act="tg" data-do="use" data-el="${esc(el.id)}">Use ${esc(lower(el.name))}</button>`).join("")}</div>` : ""}
      <h3 class="tg-h3">Or one of these</h3>
      <div class="tg-options">${plain.map(([v, label, say]) => `<button type="button" class="tg-option" data-act="tg" data-do="other" data-v="${esc(v)}"><b>${label}</b><small>${say}</small></button>`).join("")}</div>
      <h3 class="tg-h3">Or roll a set action</h3><p class="cc-small">Go at a threat, strip a tag, lead, heal, whatever it is. It goes down as your action, then the roll card opens.</p>
      ${tiles(ch, c, "owith")}
      <label class="tg-label" for="tg-else-text">Or say what it is</label>
      <div class="tg-else-row"><input id="tg-else-text" data-tg="else" maxlength="${MAX.act}" autocomplete="off" placeholder="Pull the rope out of my bag" value="${esc(r.text ?? "")}"><button type="button" class="button" data-act="tg" data-do="other-text">That’s it</button></div>
    </div>`;
  }

  // The GM putting a piece of the scene on, or changing one.
  function elView(r) {
    const f = r.f;
    const T = { stake: "A stake", event: f.scene ? "The scene clock" : "An event", ground: "The ground" }[f.t];
    const sizes = (doIt, now, none = "") => `<div class="cc-chips">${none ? `<button type="button" class="cc-chipbtn" data-act="tg" data-do="${doIt}" data-v="0"${pressedAttr(!now)}>${none}</button>` : ""}${SIZES.map((x) => `<button type="button" class="cc-chipbtn" data-act="tg" data-do="${doIt}" data-v="${x}"${pressedAttr(now === x)} aria-label="d${x}">d${x}</button>`).join("")}</div>`;
    const field = (key, label, ph, max = MAX.name) => `<label class="tg-label" for="sc-${key}">${label}</label><input id="sc-${key}" data-tg="${key}" maxlength="${max}" autocomplete="off" placeholder="${esc(ph)}" value="${esc(f[key] ?? "")}">`;
    let body = "";
    if (f.t === "stake") {
      body = `${field("name", "What the crew’s after", "Dace’s satchel")}
        <fieldset class="cc-group"><legend>Its Challenge <small>a die twice the number</small></legend><div class="cc-chips">${[1, 2, 3, 4, 5, 6].map((x) => `<button type="button" class="cc-chipbtn" data-act="tg" data-do="sc-c" data-v="${x}"${pressedAttr(f.c === x)}>${x} <small>d${2 * x}</small></button>`).join("")}</div></fieldset>
        ${field("tags", "What’s in the way <small>a tag for each, with commas</small>", "Locked, Guarded", 600)}
        <fieldset class="cc-group"><legend>A clock on it? <small>it steps down every round nobody works it</small></legend>${sizes("sc-clock", f.clock, "No clock")}</fieldset>
        ${field("note", "A note <small>where it is, or what it’s for</small>", "it’s in the changing-room cupboards", MAX.text)}`;
    } else if (f.t === "event") {
      body = `${field("name", "What’s running", "The other buyer")}
        ${field("what", f.scene ? "What happens when it runs out" : "What happens when it steps past d2", "Dace signs with them", MAX.text)}
        <fieldset class="cc-group"><legend>Its die</legend>${sizes("sc-d", f.d)}</fieldset>
        <button type="button" class="cc-line" data-act="tg" data-do="sc-scene"${pressedAttr(Boolean(f.scene))}><span class="tick" aria-hidden="true"></span><span>It’s the scene clock <small>an event on the whole scene, face up from the start, and when it runs out the scene turns</small></span></button>`;
    } else {
      body = `${field("name", "What’s there to use", "The Hot Pool")}${field("text", "What it does", "shove someone in and they’ll come out pink and gasping", MAX.text)}`;
    }
    return `${head(r.edit ? `Change it: ${T.toLowerCase()}` : T)}<div class="dlg-body tg-compose">${body}</div>
      <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}${r.edit ? `<button type="button" class="button" data-act="tg" data-do="sc-off">${r.sure ? "Tap again to take it off" : "Take it off the table"}</button>` : ""}<button type="button" class="button primary" data-act="tg" data-do="sc-save">${r.edit ? "Save it" : "Put it on the table"}</button></div>`;
  }

  // One of the book's twenty places: its ground, its stakes and its scene clock.
  function placeView(r) {
    const any = sceneParts(local(r.camp)).any;
    return `${head("From a place in the book", "Its ground, its stakes and its scene clock go on the table.")}<div class="dlg-body">
      ${any ? '<p class="cc-note is-warn">It takes the place of the scene that’s on now.</p>' : ""}
      <ul class="sc-places">${(d.places ?? []).map((p, i) => `<li><button type="button" class="sc-place" data-act="tg" data-do="sc-pick" data-i="${i}"><b>${esc(p.name)}</b><small>${esc(andList(p.stakes.map((s) => lower(s.name))))} · scene clock d${p.clock.d}</small></button></li>`).join("")}</ul></div>`;
  }

  // The change that writes one of a character's actions this round.
  function spend(ch, id, roundId, label, fn) {
    d.change(label, (s, c) => {
      const rec = actsIn(s, id, roundId);
      const said = fn(rec, s, c);
      if (said === false) return "";
      setActs(s, id, roundId, rec);
      return said;
    });
  }
  // Whether this character's got an action left this round, as the phone has it.
  function leftFor(ch, id, round) {
    const rec = actsIn(ch.state, id, round.id);
    const sp = spentBy({ ...round, acts: { ...round.acts, [keyOf(me(), ch.id)]: rec } }, me(), ch.id);
    return sp.have - sp.used;
  }

  // A turned-down intercept comes off with its Aura back, and turned-down
  // actions go back to what the table has.
  function undoTurned(id, o) {
    d.mutate(o.ch, (s, c) => {
      const hit = o.o === "icp" ? findTele(local(id), o.id) : null;
      if (o.o === "icp" && o.off) {
        // A give-back the table wouldn't take, since it had landed: it's
        // still theirs, and so is what they paid for it.
        const t = hit?.t;
        if (!t?.icp || !isAt(t.icp, o.ch) || s.tele?.i?.[o.id]) return;
        const paid = !t.icp.free && t.icp.paid !== false;
        record(s, id, "i", o.id, { free: Boolean(t.icp.free), paid: paid ? 1 : 0 });
        if (paid) s.aura = Math.max(0, s.aura - 1);
      } else if (o.o === "icp") {
        const was = s.tele?.c === id ? s.tele.i?.[o.id] : null;
        if (!was) return;
        const still = was.paid && hit ? hit.round.tele.find((t) => t.id !== o.id && s.tele.i?.[t.id] && t.at.user === hit.t.at.user && t.at.ch === hit.t.at.ch) : null;
        if (still) s.tele.i[still.id] = { ...s.tele.i[still.id], paid: 1 };
        else if (was.paid) s.aura = Math.min(c.numbers.aura, s.aura + 1);
        record(s, id, "i", o.id, null);
      } else {
        const round = local(id).rounds.find((r) => r.id === o.round);
        const has = round?.acts?.[keyOf(me(), o.ch)];
        // An extra action the table didn't take gives back what it cost.
        const kept = [...(has?.more ?? [])];
        for (const m of o.x?.more ?? []) {
          const i = kept.indexOf(m);
          if (i >= 0) kept.splice(i, 1);
          else if (m === "resolve") s.resolve = Math.min(c.numbers.resolve, s.resolve + 1);
          else if (m === "fired" && s.conf === 6) s.conf = 12;
        }
        record(s, id, "x", o.round, has ? { more: [...has.more], list: has.list.map(({ did, at, late, ...a }) => ({ ...a, ...(a.roll ? { roll: { dice: a.roll.dice, opp: a.roll.opp, real: a.roll.real } } : {}) })) } : null);
      }
    });
  }

  // Someone else rolled an answer this character put their action into: they
  // move with it, up a size for a win and down a size for a miss. How far it
  // moved them is kept in the character (state.tele.w, by telegraph), so when
  // that answer's taken back or rolled again, the move goes back or changes
  // with it.
  function catchUp(ch) {
    const id = ch ? d.campOf(ch) : null;
    if (!id || roleIn(id) !== "player" || d.current()?.id !== ch.id) return;
    const doc = local(id);
    const had = ch.state.tele?.c === id ? ch.state.tele.w ?? {} : {};
    const sig = (a) => `${a.won ? 1 : 0}:${a.opp}:${(a.dice ?? []).map((x) => x.total).join(",")}`;
    const want = new Map();
    for (const r of doc.rounds) for (const t of r.tele) if (t.ans && t.ans.user !== me() && t.ans.with?.some((w) => isAt(w, ch.id))) want.set(t.id, t);
    const ids = new Set(doc.rounds.flatMap((r) => r.tele.map((t) => t.id)));
    const before = new Set(camp(id).said.filter((x) => x.startsWith("combo:")).map((x) => x.slice(6)));
    const moved = [...want.values()].filter((t) => had[t.id]?.sig !== sig(t.ans) && !(before.has(t.id) && !had[t.id]));
    const back = Object.keys(had).filter((x) => ids.has(x) && !want.has(x));
    if (!moved.length && !back.length) return;
    d.change("moving with a friend’s answer", (s) => {
      const said = [];
      const clamp = (n) => Math.max(2, Math.min(12, n));
      for (const x of back) {
        const was = s.tele?.w?.[x];
        if (!was) continue;
        s.conf = clamp(s.conf - was.by);
        record(s, id, "w", x, null);
        said.push(`That answer with you in it was taken back, so you’re on d${s.conf}.`);
      }
      for (const t of moved) {
        const was = s.tele?.c === id ? s.tele.w?.[t.id] : null;
        if (was) s.conf = clamp(s.conf - was.by);
        const from = s.conf;
        s.conf = t.ans.won ? Math.min(12, from + 2) : Math.max(2, from - 2);
        record(s, id, "w", t.id, { sig: sig(t.ans), by: s.conf - from });
        said.push(`${t.ans.name} ${was ? "rolled it again" : `answered ${lower(t.who)} with you in it`}, ${t.ans.won ? "and stopped it" : "and every die missed"}, so you’re ${s.conf === from ? `still on d${from}` : `on d${s.conf}`}.`);
      }
      return said.join(" ");
    });
  }

  // The scene, changed on the GM's phone and sent.
  const putEl = (id, el) => push(id, { o: "put", el });

  // A roll at the scene, written into the character's actions for the round
  // with the change that rolled it, so Undo takes it back from the table too.
  // It keeps the time it was first rolled.
  function noteWork(s, r, entry) {
    const w = r.work;
    if (!w?.camp || !w.round) return;
    const rec = actsIn(s, w.camp, w.round);
    const i = rec.list.findIndex((a) => a.id === w.actId);
    if (entry) {
      const t0 = i >= 0 ? rec.list[i].t : Date.now();
      if (i >= 0) rec.list[i] = { ...entry, t: t0 };
      else rec.list.push({ ...entry, t: t0 });
    } else if (i >= 0) rec.list.splice(i, 1);
    else return;
    setActs(s, w.camp, w.round, rec);
  }

  function dialog(r) {
    if (r.kind === "tele") return composerView(r);
    if (r.kind === "tg-pick") return pickView(r);
    if (r.kind === "tg-join") return joinView(r);
    if (r.kind === "tg-work") return workView(r);
    if (r.kind === "tg-else") return elseView(r);
    if (r.kind === "tg-el") return elView(r);
    if (r.kind === "tg-place") return placeView(r);
    return "";
  }

  // Typing in the composer changes the card as it goes, without drawing the
  // whole dialog again, so the keyboard stays put.
  function input(el, r) {
    const key = el.dataset.tg;
    if (r.kind === "tg-el") {
      if (["name", "tags", "note", "what", "text"].includes(key)) r.f[key] = el.value;
      r.err = "";
      return;
    }
    if (r.kind === "tg-else") {
      if (key === "else") r.text = el.value;
      return;
    }
    if (!["who", "does", "one", "tag", "where"].includes(key)) return;
    r.f[key] = el.value;
    r.err = "";
    const box = el.closest(".dlg-body")?.querySelector(".tg-preview");
    if (!box) return;
    const doc = local(r.camp);
    const last = current(doc);
    const n = r.live ? last?.n ?? 1 : (last && !last.over ? last.n : (last?.n ?? 0) + 1);
    box.innerHTML = previewOf(r.camp, r.f, n);
  }

  // A new telegraph, or a draft to change, or one written already somewhere
  // else (a place's or a person's page) for her to aim and send.
  function compose(id, draft = null, given = null) {
    const doc = local(id);
    const last = current(doc);
    const live = Boolean(last && !last.over) && !draft;
    const base = { who: "", does: "", d: 0, kind: "blow", one: "", at: null, fx: "tag", tag: "", by: 1, where: "", book: -1 };
    const f = draft ? { ...base, who: draft.who, does: draft.does, d: draft.d, kind: draft.kind, one: draft.one ?? "" } : base;
    if (draft?.at?.k === "stake" || draft?.at?.k === "event") Object.assign(f, { at: { k: draft.at.k, ref: draft.at.ref }, fx: draft.fx?.by && draft.at.k === "stake" ? "clock" : "tag", tag: draft.fx?.tag ?? "", by: draft.fx?.by === 2 ? 2 : 1 });
    else if (draft?.at?.k === "place") Object.assign(f, { at: { k: "place" }, where: draft.at.where ?? "" });
    else if (draft?.at) f.at = { user: draft.at.user, ch: draft.at.ch };
    // The one she telegraphed last, ready to go again.
    if (!draft) {
      const known = given ? null : threatsOf(id)[0];
      if (known) Object.assign(f, { who: known.who, d: known.d });
      if (given) Object.assign(f, { who: String(given.who ?? "").slice(0, MAX.who), does: String(given.does ?? "").slice(0, MAX.does), d: SIZES.includes(given.d) ? given.d : 0, kind: given.kind === "fear" ? "fear" : "blow" });
      const roster = rosterOf(id);
      if (roster.length === 1) f.at = { user: roster[0].user, ch: roster[0].ch };
      if (given?.text && given.at != null) aimGiven(id, f, given);
    }
    ui.sure = "";
    d.openDialog({ kind: "tele", camp: id, live, edit: draft?.id ?? null, f, err: "" });
  }

  // One written on a page, aimed the way it says: at a stake or the scene
  // clock that's on the table, or a part of the place, and then it reads like
  // the book's own, who and what they do. One at someone, or at something
  // that isn't on the table, waits for her to aim it.
  function aimGiven(id, f, given) {
    const doc = local(id);
    const line = curlyQuotes(String(given.text).replace(/\*/g, "").replace(/\s+/g, " ").trim());
    const a = readAim(given.at, doc.scene.stakes.filter((x) => !x.out).map((x) => x.name), line);
    if (a.why || a.aim === "crew") return;
    if (a.aim === "stake") {
      const el = doc.scene.stakes.find((x) => x.name === a.stake && !x.out);
      if (!el) return;
      Object.assign(f, { at: { k: "stake", ref: el.id }, fx: "tag", tag: a.tag });
    } else if (a.aim === "clock") {
      const el = doc.scene.events.find((e) => e.scene && !e.out);
      if (!el) return;
      f.at = { k: "event", ref: el.id };
    } else f.at = { k: "place" };
    if (a.aim === "place") f.where = placeOf(a.place)?.where ?? "";
    const wd = whoAndDoes(line, f.who || given.page || "");
    Object.assign(f, { who: wd.who.slice(0, MAX.who), does: wd.does.slice(0, MAX.does), kind: a.kind, one: a.one ?? "" });
  }

  function save(r) {
    const id = r.camp;
    const f = r.f;
    const k = f.at?.k;
    const made = fromFields(id, f);
    const target = k ? null : rosterOf(id).find((p) => p.user === f.at?.user && p.ch === f.at?.ch) ?? null;
    const gone = (k === "stake" || k === "event") && !draftOk(id, { at: { k, ref: f.at.ref } });
    const err = !f.who.trim() ? "Say who’s telegraphing."
      : !k && !target ? "Pick who or what it’s aimed at."
        : gone ? "That’s gone from the scene, or it’s settled. Pick something else."
          : k === "stake" && made.fx?.tag === "" ? "Say what goes in its way if it lands."
            : k === "place" && !placeOf(f.where) ? "Say where it lands."
              : !f.d ? "Pick its die." : !f.does.trim() ? "Say what it’s doing." : "";
    if (err) {
      r.err = err;
      return d.renderDialog();
    }
    const at = k === "stake" || k === "event" ? { k, ref: f.at.ref } : k === "place" ? { k, name: made.at.name, where: made.at.where } : { user: target.user, ch: target.ch, arch: crestOf(id, target) ?? [] };
    const t = { id: r.edit || newId(), who: f.who.trim().slice(0, MAX.who), does: f.does.trim().slice(0, MAX.does), d: f.d, kind: made.kind, one: made.one.slice(0, MAX.one), at, ...(made.fx ? { fx: made.fx } : {}) };
    const kept = camp(id);
    if (r.live) push(id, { o: "add", tele: t });
    else {
      const i = kept.drafts.findIndex((x) => x.id === t.id);
      if (i >= 0) kept.drafts[i] = t;
      else kept.drafts.push(t);
      keep();
    }
    d.closeDialog();
  }

  // ------------------------------------------------------------ taps

  const ACT = {
    compose: () => compose(d.viewId()),
    edit: (el) => {
      const id = d.viewId();
      const draft = camp(id).drafts.find((x) => x.id === el.dataset.id);
      if (draft) compose(id, draft);
    },
    drop: (el) => {
      const k = camp(d.viewId());
      k.drafts = k.drafts.filter((x) => x.id !== el.dataset.id);
      keep();
      d.render();
    },
    send: () => {
      const id = d.viewId();
      const k = camp(id);
      const ok = k.drafts.filter((t) => draftOk(id, t));
      const scene = sceneParts(local(id));
      if (!ok.length && (k.drafts.length || !(scene.stakes.length + scene.events.length + scene.clocks.length))) {
        ui.note = k.drafts.length ? "None of these can go out: whoever or whatever they’re aimed at isn’t here now. Change them, or take them off." : "Telegraph something, or put the scene on the table, first.";
        return d.render();
      }
      ui.note = "";
      k.drafts = k.drafts.filter((t) => !ok.includes(t));
      push(id, { o: "round", id: newId(), tele: ok });
      d.render();
    },
    take: (el) => {
      const key = `take-${el.dataset.id}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return d.render();
      }
      ui.sure = "";
      push(d.viewId(), { o: "take", id: el.dataset.id });
      d.render();
    },
    end: () => {
      if (ui.sure !== "end") {
        ui.sure = "end";
        return d.render();
      }
      ui.sure = "";
      const id = d.viewId();
      const last = current(local(id));
      if (last && !last.over) push(id, { o: "end", round: last.id });
      d.render();
    },
    fight: () => {
      if (ui.sure !== "fight") {
        ui.sure = "fight";
        return d.render();
      }
      ui.sure = "";
      const id = d.viewId();
      push(id, { o: "fight", fight: local(id).fight });
      d.render();
    },
    // In the composer.
    who: (el) => {
      const r = d.roll();
      Object.assign(r.f, { who: el.dataset.who, d: Number(el.dataset.d) || r.f.d });
      d.renderDialog();
    },
    at: (el) => {
      const r = d.roll();
      r.f.at = { user: el.dataset.user, ch: el.dataset.ch };
      r.err = "";
      d.renderDialog();
    },
    // Aimed at the scene: a stake, the scene clock or an event, or a place.
    tgt: (el) => {
      const r = d.roll();
      const k = el.dataset.k;
      r.f.at = k === "place" ? { k } : { k, ref: el.dataset.ref };
      r.err = "";
      d.renderDialog();
      if (k === "place" && !r.f.where) document.getElementById("tg-where")?.focus({ preventScroll: true });
    },
    fx: (el) => {
      const r = d.roll();
      r.f.fx = el.dataset.v === "clock" ? "clock" : "tag";
      r.err = "";
      d.renderDialog();
    },
    by: (el) => {
      const r = d.roll();
      r.f.by = Number(el.dataset.v) === 2 ? 2 : 1;
      d.renderDialog();
    },
    // One of the place's own telegraphs, from the book: everything filled in,
    // and one at the crew waits for her to pick who.
    book: (el) => {
      const r = d.roll();
      const b = bookTeles(r.camp).list.find((x) => x.i === Number(el.dataset.i));
      if (!b) return;
      Object.assign(r.f, { who: b.who, does: b.does, d: b.d, kind: b.kind, one: b.one ?? "", book: b.i });
      if (b.aim === "stake") Object.assign(r.f, { at: { k: "stake", ref: b.ref }, fx: "tag", tag: b.tag, by: 1 });
      else if (b.aim === "clock") Object.assign(r.f, { at: { k: "event", ref: b.ref }, by: 1 });
      else if (b.aim === "place") Object.assign(r.f, { at: { k: "place" }, where: placeOf(b.place)?.where ?? "" });
      else if (r.f.at?.k) {
        const roster = rosterOf(r.camp);
        r.f.at = roster.length === 1 ? { user: roster[0].user, ch: roster[0].ch } : null;
      }
      r.err = "";
      d.renderDialog();
    },
    // A player says whether they're in a place it's aimed at.
    there: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const hit = id ? findTele(local(id), el.dataset.id) : null;
      if (!hit || !atPlace(hit.t)) return;
      push(id, { o: "there", id: hit.t.id, ch: ch.id, in: el.dataset.v === "1" });
      d.render();
    },
    // The GM puts someone in or out of it by hand.
    gthere: (el) => {
      const id = d.viewId();
      const hit = findTele(local(id), el.dataset.id);
      if (!hit || !atPlace(hit.t)) return;
      const was = hit.t.there?.[keyOf(el.dataset.user, el.dataset.ch)];
      push(id, { o: "there", id: hit.t.id, user: el.dataset.user, ch: el.dataset.ch, in: !was?.in });
      d.render();
    },
    d: (el) => {
      const r = d.roll();
      r.f.d = Number(el.dataset.d);
      r.err = "";
      d.renderDialog();
    },
    verb: (el) => {
      const r = d.roll();
      const target = rosterOf(r.camp).find((p) => p.user === r.f.at?.user && p.ch === r.f.at?.ch);
      r.f.does = `${el.dataset.v}${target ? ` ${target.cname}` : ""}`;
      d.renderDialog();
      const box = document.getElementById("tg-does");
      if (box) {
        box.focus({ preventScroll: true });
        box.setSelectionRange(box.value.length, box.value.length);
      }
    },
    kind: (el) => {
      const r = d.roll();
      r.f.kind = el.dataset.k === "fear" ? "fear" : "blow";
      d.renderDialog();
    },
    save: () => save(d.roll()),
    // On the play screen.
    answer: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      if (!id) return;
      d.openDialog({ kind: "tg-pick", camp: id, id: el.dataset.id });
    },
    with: (el) => {
      const r = d.roll();
      const ch = d.current();
      const hit = findTele(local(r.camp), r.id);
      if (!hit || !ch) return;
      const t = hit.t;
      const ins = friendsIn(local(r.camp), hit, ch).map((j) => ({ user: j.user, ch: j.ch, name: j.name, steps: j.steps }));
      d.answer(Number(el.dataset.a), { camp: r.camp, id: t.id, d: t.d, who: t.who, does: t.does, atName: atName(t), mine: isAt(t.at, ch.id), aim: t.at.k ?? "", fx: fxSaid(t), where: t.at.where ?? "", ...(ins.length ? { with: ins } : {}) });
    },
    land: (el) => {
      const pre = landedFor(d.current(), el.dataset.k === "fear" ? "fear" : "blow");
      if (pre) d.defend(pre);
    },
    // Their action, spent on something: a friend's answer, the scene, the
    // ground or something else. Taking one back frees it.
    join: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      if (id) d.openDialog({ kind: "tg-join", camp: id, id: el.dataset.id });
    },
    jwith: (el) => {
      const r = d.roll();
      const ch = d.current();
      const c = ch ? d.normal(ch) : null;
      const doc = local(r.camp);
      const last = current(doc);
      const hit = findTele(doc, r.id);
      const a = c ? d.actions(ch, c).find((x) => x.i === Number(el.dataset.a)) : null;
      if (!hit || !a || !last || hit.round !== last || last.over) return d.closeDialog();
      const steps = Math.max(1, Number(a.n) || 1);
      d.closeDialog();
      spend(ch, r.camp, last.id, "putting your action in", (rec) => {
        if (rec.list.some((x) => x.k === "join" && x.ref === hit.t.id)) return false;
        rec.list.push({ id: newId(), k: "join", ref: hit.t.id, act: a.name, steps, t: Date.now() });
        return `Your ${a.name} goes in with whoever answers ${lower(hit.t.who)}.`;
      });
    },
    work: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      if (!id) return;
      const last = current(local(id));
      if (!last || last.over) return d.toast("There’s no round on, so there’s nothing to spend an action on yet.");
      if (leftFor(ch, id, last) < 1) return d.toast("Your action’s spent this round. Got another one? Open Got another action and say where it came from.");
      d.openDialog({ kind: "tg-work", camp: id, el: el.dataset.el, aim: "" });
    },
    aim: (el) => {
      const r = d.roll();
      r.aim = el.dataset.v;
      d.renderDialog();
    },
    wwith: (el) => {
      const r = d.roll();
      const doc = local(r.camp);
      const hit = findEl(doc, r.el);
      const last = current(doc);
      if (!hit || !last || last.over) return d.closeDialog();
      const event = hit.kind === "event";
      d.work(Number(el.dataset.a), { camp: r.camp, round: last.id, ref: hit.el.id, name: hit.el.name, event, d: event ? hit.el.d : dieOf(hit.el), held: last.held?.[hit.el.id] ?? null, aim: r.aim || "", actId: newId() });
    },
    use: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const doc = id ? local(id) : null;
      const last = doc ? current(doc) : null;
      const hit = doc ? findEl(doc, el.dataset.el) : null;
      if (!hit || !last || last.over) return;
      if (leftFor(ch, id, last) < 1) return d.toast("Your action’s spent this round. Got another one? Open Got another action and say where it came from.");
      if (d.roll()?.kind === "tg-else") d.closeDialog();
      spend(ch, id, last.id, `using ${lower(hit.el.name)}`, (rec) => {
        rec.list.push({ id: newId(), k: "ground", ref: hit.el.id, act: "", t: Date.now() });
        return `Your action’s on ${lower(hit.el.name)}. Bring it into your roll when you make it.`;
      });
    },
    else: () => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      if (id) d.openDialog({ kind: "tg-else", camp: id, text: "" });
    },
    other: (el) => otherAct(el.dataset.v, true, ["Defend", "Move"].includes(el.dataset.v)),
    "other-text": () => {
      const text = String(d.roll()?.text ?? "").trim();
      if (!text) return document.getElementById("tg-else-text")?.focus();
      otherAct(text);
    },
    owith: (el) => {
      const ch = d.current();
      const c = ch ? d.normal(ch) : null;
      const a = c ? d.actions(ch, c).find((x) => x.i === Number(el.dataset.a)) : null;
      if (!a) return;
      otherAct(a.name, false, true);
      d.answer(a.i, null);
    },
    unact: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const last = id ? current(local(id)) : null;
      if (!last) return;
      spend(ch, id, last.id, "taking an action back", (rec) => {
        const i = rec.list.findIndex((x) => x.id === el.dataset.a);
        if (i < 0) return false;
        rec.list.splice(i, 1);
        return "Taken back. That action’s yours again.";
      });
    },
    more: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const last = id ? current(local(id)) : null;
      const k = el.dataset.k;
      if (!last || last.over || !MORES.some(([x]) => x === k)) return;
      spend(ch, id, last.id, "an extra action", (rec, s) => {
        if (rec.more.length >= MAX.more || (ONCE.includes(k) && rec.more.includes(k))) return false;
        if (k === "resolve") {
          if (s.resolve < 1) return false;
          s.resolve -= 1;
        }
        if (k === "fired") {
          if (s.conf < 12) return false;
          s.conf = 6;
        }
        rec.more.push(k);
        return `Another action this round, from ${moreName(k)}.${k === "resolve" ? ` Resolve’s ${s.resolve}.` : k === "fired" ? " Your Confidence is back to d6." : ""}`;
      });
    },
    // Intercepting a friend's telegraph: 1 Aura, once for each friend a
    // round, and free for a Guardian.
    icp: (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const doc = id ? local(id) : null;
      const hit = doc ? findTele(doc, el.dataset.id) : null;
      if (!hit || hit.round.over || hit.t.icp || hit.t.ans || hit.t.kind === "fear") return;
      d.change(`taking ${lower(hit.t.who)} for ${hit.t.at.name}`, (s, c) => {
        const free = guardianOf(c);
        const paid = !free && !paidFor(doc, hit.round, ch.id, hit.t.at);
        if (paid && s.aura < 1) return "";
        if (paid) s.aura -= 1;
        record(s, id, "i", hit.t.id, { free, paid: paid ? 1 : 0 });
        return `You step in front of ${lower(hit.t.who)} for ${hit.t.at.name}${free ? ", free, as a Guardian" : paid ? ` for 1 Aura. Aura’s ${s.aura}` : ", already paid for"}. It comes at you when it lands.`;
      });
    },
    "icp-off": (el) => {
      const ch = d.current();
      const id = ch ? d.campOf(ch) : null;
      const hit = id ? findTele(local(id), el.dataset.id) : null;
      if (!hit || hit.round.over) return;
      d.change("giving it back", (s, c) => {
        const was = s.tele?.c === id ? s.tele.i?.[hit.t.id] : null;
        if (!was) return "";
        // Still taking another one for the same friend, it carries the Aura now.
        const still = was.paid ? hit.round.tele.find((t) => t.id !== hit.t.id && s.tele.i?.[t.id] && t.at.user === hit.t.at.user && t.at.ch === hit.t.at.ch) : null;
        if (still) s.tele.i[still.id] = { ...s.tele.i[still.id], paid: 1 };
        else if (was.paid) s.aura = Math.min(c.numbers.aura, s.aura + 1);
        record(s, id, "i", hit.t.id, null);
        return `It’s back on ${hit.t.at.name}.${was.paid && !still ? ` Your Aura’s back too: ${s.aura}.` : ""}`;
      });
    },
    // The GM's scene.
    "sc-new": (el) => {
      const t = el.dataset.t;
      const f = t === "stake" ? { t, name: "", c: 3, tags: "", clock: 0, note: "" } : t === "event" ? { t, name: "", what: "", d: 8, scene: !sceneParts(local(d.viewId())).clocks.length } : { t: "ground", name: "", text: "" };
      d.openDialog({ kind: "tg-el", camp: d.viewId(), edit: null, f, err: "" });
    },
    "sc-edit": (el) => {
      const hit = findEl(local(d.viewId()), el.dataset.el);
      if (!hit) return;
      const e = hit.el;
      const f = e.t === "stake" ? { t: "stake", name: e.name, c: e.c, tags: e.tags.map((g) => g.name).join(", "), clock: e.clock, note: e.note, gone: e.tags.filter((g) => g.gone).map((g) => g.name), by: Object.fromEntries(e.tags.filter((g) => g.by).map((g) => [g.name, g.by])), out: e.out } : e.t === "event" ? { t: "event", name: e.name, what: e.what, d: e.d, scene: e.scene, out: e.out } : { t: "ground", name: e.name, text: e.text };
      d.openDialog({ kind: "tg-el", camp: d.viewId(), edit: e.id, f, err: "" });
    },
    "sc-c": (el) => setF("c", Number(el.dataset.v)),
    "sc-d": (el) => setF("d", Number(el.dataset.v)),
    "sc-clock": (el) => setF("clock", Number(el.dataset.v)),
    "sc-scene": () => setF("scene", !d.roll().f.scene),
    "sc-save": () => {
      const r = d.roll();
      const f = r.f;
      const name = String(f.name ?? "").trim();
      if (!name) {
        r.err = f.t === "stake" ? "Say what the crew’s after." : f.t === "event" ? "Say what’s running." : "Say what’s there to use.";
        return d.renderDialog();
      }
      const tags = String(f.tags ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, MAX.tags);
      // A tag a telegraph put there keeps saying so, as long as it's kept its name.
      const got = tags.map((g) => ({ name: g, gone: (f.gone ?? []).includes(g) ? 1 : 0, ...(f.by?.[g] ? { by: f.by[g] } : {}) }));
      // Won stays won while nothing new's in the way, and lost stays lost
      // unless she's given it a clock again.
      const out = f.out === "won" ? (got.every((g) => g.gone) ? "won" : "") : f.out === "lost" ? (f.clock ? "" : "lost") : "";
      const el = f.t === "stake" ? { id: r.edit || newId(), t: "stake", name, c: f.c, tags: got, clock: f.clock || 0, note: String(f.note ?? "").trim(), out }
        : f.t === "event" ? { id: r.edit || newId(), t: "event", name, what: String(f.what ?? "").trim(), d: f.d, scene: Boolean(f.scene), out: f.out ?? "" }
          : { id: r.edit || newId(), t: "ground", name, text: String(f.text ?? "").trim() };
      putEl(r.camp, el);
      d.closeDialog();
    },
    // Taking one off, from its dialog, with a second tap.
    "sc-off": () => {
      const r = d.roll();
      if (!r?.edit) return;
      if (!r.sure) {
        r.sure = true;
        return d.renderDialog();
      }
      push(r.camp, { o: "drop", id: r.edit });
      d.closeDialog();
    },
    "sc-clear": () => {
      if (ui.sure !== "sc-clear") {
        ui.sure = "sc-clear";
        return d.render();
      }
      ui.sure = "";
      push(d.viewId(), { o: "clear" });
      d.render();
    },
    "sc-tag": (el) => {
      const id = d.viewId();
      const hit = findEl(local(id), el.dataset.el);
      const g = hit?.el.tags?.[Number(el.dataset.i)];
      if (!g) return;
      const e = structuredClone(hit.el);
      e.tags[Number(el.dataset.i)].gone = g.gone ? 0 : 1;
      e.out = e.tags.length && e.tags.every((x) => x.gone) ? "won" : e.out === "won" ? "" : e.out;
      putEl(id, e);
      d.render();
    },
    "sc-step": (el) => {
      const id = d.viewId();
      const hit = findEl(local(id), el.dataset.el);
      if (!hit) return;
      const e = structuredClone(hit.el);
      const k = el.dataset.k === "clock" ? "clock" : "d";
      const up = Number(el.dataset.d) > 0;
      if (up) e[k] = Math.min(12, e[k] + 2);
      else if (e[k] <= 2) {
        if (k === "clock") e.clock = 0;
        e.out = k === "clock" ? "lost" : "done";
      } else e[k] -= 2;
      putEl(id, e);
      d.render();
    },
    "sc-place": () => d.openDialog({ kind: "tg-place", camp: d.viewId() }),
    "sc-pick": (el) => {
      const p = d.places?.[Number(el.dataset.i)];
      const id = d.roll()?.camp;
      if (!p || !id) return;
      d.closeDialog();
      setScene(id, p);
    },
  };
  // A place on the table: its ground, its stakes and its scene clock, in
  // place of whatever scene was there. A place in the book, or one of the
  // GM's own pages on her World screen (places.js).
  function setScene(id, p) {
    // Which place it is, so its telegraphs are ready in the composer: one of
    // the book's, or one of her pages (places.js says which).
    const place = p.place ?? (/^s-place-/.test(String(p.id ?? "")) ? { id: p.id, name: p.name } : null);
    push(id, { o: "clear", ...(place ? { place } : {}) });
    for (const g of p.ground) putEl(id, { id: newId(), t: "ground", name: g.name, text: g.text });
    for (const s of p.stakes) putEl(id, { id: newId(), t: "stake", name: s.name, c: s.c, tags: s.tags.map((x) => ({ name: x, gone: 0 })), clock: 0, note: s.note, out: "" });
    if (p.clock) putEl(id, { id: newId(), t: "event", name: "The scene clock", what: p.clock.what, d: p.clock.d, scene: true, out: "" });
    const bits = [p.ground.length ? "its ground" : "", p.stakes.length ? plural(p.stakes.length, "stake", "stakes") : "", p.clock ? `the scene clock on d${p.clock.d}` : ""].filter(Boolean);
    d.toast(`${p.name} is on the table: ${bits.join(", ").replace(/, ([^,]*)$/, " and $1")}.${place && (p.tele ?? p.teles ?? []).length ? " Its telegraphs are ready when you telegraph." : ""}`);
  }
  // The composer's chips for a piece of the scene.
  function setF(key, v) {
    const r = d.roll();
    if (!r?.f) return;
    r.f[key] = v;
    r.err = "";
    d.renderDialog();
  }
  // Something else, said in words or picked: their action this round.
  function otherAct(what, close = true, set = false) {
    const ch = d.current();
    const id = ch ? d.campOf(ch) : null;
    const last = id ? current(local(id)) : null;
    if (!last || last.over) return;
    if (leftFor(ch, id, last) < 1) return d.toast("Your action’s spent this round. Got another one? Open Got another action and say where it came from.");
    if (close) d.closeDialog();
    spend(ch, id, last.id, "your action", (rec) => {
      rec.list.push({ id: newId(), k: "else", act: what, ...(set ? { set: true } : {}), t: Date.now() });
      return what === "Defend" ? "You’re Defending this round. When the telegraphs land, every line on your Defend counts twice." : `Your action’s on ${actSaid({ act: what, set })}.`;
    });
  }

  let started = false;
  return {
    route(view, ch) {
      load();
      // Whatever didn't go up last time the page was open goes now, wherever it's from.
      if (!started && sync.me && !sync.out) {
        started = true;
        flushAll();
      }
      // The World screen too, for the faction turn.
      const id = view.name === "camp" || view.name === "look" || view.name === "world" ? view.id : view.name === "sheet" && ch ? d.campOf(ch) : null;
      if (ch && view.name === "sheet") setTimeout(() => catchUp(ch), 0);
      if (id && view.name !== "sheet") {
        if (roleIn(id) == null) return watch(null);
      }
      watch(sync.me && !sync.out ? id : null);
    },
    section,
    pointer,
    playCard,
    composeFrom: (id, f) => compose(id, null, f),
    setScene: (id, p) => setScene(id, p),
    sceneOf: (id) => local(id).scene,
    catchUp,
    // For the faction turn (turn.js), which is kept with the table.
    local: (id) => local(id),
    push: (id, op) => push(id, op),
    whoIn: (id) => whoIn(id),
    roleIn: (id) => roleIn(id),
    rosterOf: (id) => rosterOf(id),
    gmName: (id) => gmName(id),
    waiting: (id) => camp(id).out.length,
    // Whether a change would be taken, tried on the table as this phone has it.
    check: (id, op) => apply(local(id), op, whoIn(id), rosterOf(id), Date.now()),
    seenAt: (id) => camp(id).at,
    landedFor,
    dialog,
    input,
    record,
    noteWork,
    soon,
    rollNote,
    forLine,
    landLine,
    act(el, e) {
      ACT[el.dataset.do]?.(el, e);
    },
    drop(id) {
      load();
      delete st.k[id];
      keep();
      if (net.id === id) watch(null);
    },
    keepOnly(ids) {
      load();
      for (const id of Object.keys(st.k)) if (!ids.includes(id)) delete st.k[id];
      keep();
    },
  };
}
