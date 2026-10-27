// Telegraphs on phones (stage 8 in notes/app-plan.md). The GM builds the
// round's telegraphs on her campaign's page, each one the kit's telegraph card
// aimed at one of the crew, and sends them. Each lands on its player's play
// screen, where they answer it with the roll card taking its die, or let it
// land and roll When it lands once the round's over. However it goes, it's on
// the GM's page a moment later, round by round.
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
//             what this phone's sent for each of its characters' answers and
//             rolls, and the GM's round while she builds it. Each campaign's
//             kept apart, and it all goes when the account's characters leave
//             the phone (sync.js).
import { MAX, SIZES, apply, current, findTele, lower, stateOf } from "./table-rules.js";
import { turnNews } from "./turn-rules.js";
import { die as kitDie, telegraph as kitTele } from "../kit/kit.js";

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
    const doc = { v: k.view?.v ?? 0, fight: k.view?.fight ?? 1, rounds: structuredClone(k.view?.rounds ?? []), turn: structuredClone(k.view?.turn ?? null), last: structuredClone(k.view?.last ?? null) };
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
      const backs = new Set(kk.out.filter((o) => (o.o === "answer" && o.a == null) || (o.o === "defend" && o.r == null)).map((o) => o.n));
      const said = (r.got.no ?? []).filter((x) => x.why && !backs.has(x.n));
      if (Number.isInteger(r.got.seq)) kk.out = kk.out.filter((o) => o.n > r.got.seq);
      if (said.length) d.toast(said.map((x) => x.why).slice(-2).join(" "));
      take(id, r.got);
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
    const was = k.view ? { v: k.view.v, fight: k.view.fight, rounds: k.view.rounds, turn: k.view.turn ?? null, last: k.view.last ?? null } : null;
    k.view = { v: Number(got.v) || 0, fight: Number(got.fight) || 1, rounds: got.rounds, turn: got.turn ?? null, last: got.last ?? null };
    k.at = Date.now();
    net.why = "";
    const said = news(id, k, was, k.view);
    keep();
    if (said.length) {
      d.toast(said.slice(-2).join(" "));
      if (said.buzz) feel.tele?.();
    }
    d.quietRender();
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
    // One the GM took back, that was coming at this player's character.
    if (!gm && mine && was) {
      const ids = new Set(now.rounds.flatMap((r) => r.tele.map((t) => t.id)));
      for (const r of was.rounds) {
        if (!now.rounds.some((x) => x.id === r.id)) continue;
        for (const t of r.tele) if (!ids.has(t.id) && t.at.user === me() && t.at.ch === mine.id) out.push(`${cap(gmName(id))} took back ${lower(t.who)}’s telegraph at ${mine.name}.`);
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

  // How one telegraph went, for the GM (forGm) or for the player whose phone it
  // is (mine: it's aimed at their character).
  function verdict(t, round, { forGm = false, mine = false, ch = null } = {}) {
    const s = stateOf(t, round);
    const you = !forGm && t.ans && t.ans.user === me() && ch && t.ans.ch === ch.id;
    const what = t.kind === "fear" ? "Confidence" : "Defend";
    if (s === "stopped") {
      const who = you ? "You" : t.ans.name;
      const forWhom = !you && mine ? " for you" : forGm && t.ans.ch !== t.at.ch ? ` for ${t.at.name}` : "";
      return `<div class="tg-v is-good">${diceRow(t.ans)}<p><b>Stopped.</b> ${esc(who)} answered it${esc(forWhom)} with ${esc(t.ans.act)}: ${bestOf(t.ans)} against its ${t.ans.opp}.${realNote(t.ans)}${forGm && t.ans.late ? ' <span class="tg-real">after the round ended</span>' : ""}</p></div>`;
    }
    if (s === "hit") {
      const whose = you ? "Your" : `${t.ans.name}’s`;
      // Answered by whoever it was aimed at, it hit them. Answered for a
      // friend, it might've hit whoever got in the way, and the GM says which.
      const own = t.ans.user === t.at.user && t.ans.ch === t.at.ch;
      const hit = own ? `so it hit ${esc(mine ? "you" : t.at.name)} with no defence.${forGm ? " Say what it costs." : mine ? " The GM says what it costs." : ""}` : `so it landed with no defence.${forGm ? " Say who it hit and what it costs." : " The GM says who it hit."}`;
      return `<div class="tg-v is-bad">${diceRow(t.ans)}<p><b>It landed then and there.</b> ${esc(whose)} ${esc(t.ans.act)} came up ${bestOf(t.ans)} against its ${t.ans.opp}, ${hit}${realNote(t.ans)}${forGm && t.ans.late ? ' <span class="tg-real">after the round ended</span>' : ""}</p></div>`;
    }
    if (s === "landed") {
      return forGm
        ? `<div class="tg-v is-bad"><p><b>It landed.</b> ${esc(t.at.name)} rolls When it lands next.</p></div>`
        : mine ? `<div class="tg-v is-bad"><p><b>It landed on you.</b> Roll When it lands, against your ${what}.</p></div>`
          : `<div class="tg-v is-bad"><p><b>It landed on ${esc(t.at.name)}.</b></p></div>`;
    }
    if (s === "held") {
      const whose = mine ? "Your" : `${t.at.name}’s`;
      return `<div class="tg-v is-good"><p><b>Stopped when it landed.</b> ${esc(whose)} ${what} came up ${t.def.mine} against its ${t.def.v}.${realNote(t.def)}</p></div>`;
    }
    if (s === "through") {
      const whose = mine ? "your" : `${t.at.name}’s`;
      const how = t.def.mine == null ? `There was no die left on ${esc(whose)} ${what} for it.` : `${esc(cap(whose))} ${what} came up ${t.def.mine} against its ${t.def.v}.`;
      return `<div class="tg-v is-bad"><p><b>It got through.</b> ${how}${t.def.paid ? ` <span class="tg-paid">${esc(t.def.paid)}</span>` : ""}${realNote(t.def)}</p></div>`;
    }
    return "";
  }

  // A telegraph drawn with the kit, with where it's got to under it.
  function card(t, round, extra = "", { lit: on = false } = {}) {
    const s = stateOf(t, round);
    const face = t.ans ? t.ans.opp : t.def ? t.def.v : null;
    const when = s === "coming" ? (t.kind === "fear" ? "Lands on Confidence at the end of the round" : "") : { stopped: "Stopped", hit: "Landed", landed: "Landed", held: "Landed, and stopped", through: "Landed, and got through" }[s];
    return `<li class="tg${on ? " is-lit" : ""}" data-tg="${esc(t.id)}">${kitTele({ who: t.who, does: t.does, at: t.at.name, atCrest: t.at.arch ?? [], d: t.d, round: round.n, one: t.one, face, state: s === "coming" ? "" : s, when, extra, strict: false })}</li>`;
  }
  const takeLit = (id) => {
    const on = lit.has(id);
    lit.delete(id);
    return on;
  };

  // How a round's going, in a line.
  function tally(round) {
    const n = { stopped: 0, through: 0, rolling: 0, coming: 0 };
    for (const t of round.tele) {
      const s = stateOf(t, round);
      if (s === "stopped" || s === "held") n.stopped += 1;
      else if (s === "coming") n.coming += 1;
      else if (s === "landed") n.rolling += 1;
      else n.through += 1;
    }
    const parts = [n.stopped && `${words(n.stopped)} stopped`, n.through && `${words(n.through)} got through`, n.rolling && `${words(n.rolling)} still to roll When it lands`, n.coming && `${words(n.coming)} still coming`].filter(Boolean);
    return `${cap(plural(round.tele.length, "telegraph", "telegraphs"))}${parts.length ? `: ${andList(parts)}` : ""}.`;
  }

  // ------------------------------------------------------------ the GM's round

  const sure = (key, yes, no) => (ui.sure === key ? yes : no);
  // The round she's building, as cards.
  function draftCard(id, t, n) {
    const p = rosterOf(id).find((x) => x.user === t.at?.user && x.ch === t.at?.ch);
    const extra = `<div class="tg-do"><button type="button" class="button sm" data-act="tg" data-do="edit" data-id="${esc(t.id)}">Change it</button><button type="button" class="button sm" data-act="tg" data-do="drop" data-id="${esc(t.id)}">Take it off</button>${p ? "" : '<p class="cc-warn">Whoever this was aimed at isn’t playing here now.</p>'}</div>`;
    return `<li class="tg is-draft">${kitTele({ who: t.who, does: t.does, at: p?.cname ?? "someone who’s gone", atCrest: t.at?.arch ?? [], d: t.d, round: n, one: t.one, when: t.kind === "fear" ? "Lands on Confidence at the end of the round" : "", extra, strict: false })}</li>`;
  }

  // The GM's live cards: who's got it, and how each one went.
  function gmCard(id, t, round, live) {
    const s = stateOf(t, round);
    let extra = verdict(t, round, { forGm: true });
    if (s === "coming") {
      const queued = waiting(id, (o) => o.o === "round" || o.o === "add");
      const where = queued ? `Goes to ${esc(t.at.player || t.at.name)}’s phone when you’ve got a signal.` : t.seen ? `On ${esc(t.at.player || t.at.name)}’s phone.` : `Not on ${esc(t.at.player || t.at.name)}’s phone yet. It’ll get there when ${esc(t.at.player || "they")} opens ${esc(t.at.name)} or the campaign.`;
      extra = `<div class="tg-v is-wait"><p>${where}</p>${live ? `<div class="tg-do"><button type="button" class="button sm" data-act="tg" data-do="take" data-id="${esc(t.id)}">${sure(`take-${t.id}`, "Tap again to take it back", "Take it back")}</button></div>` : ""}</div>`;
    }
    return card(t, round, extra, { lit: takeLit(t.id) });
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
        <ol class="tg-list">${last.tele.map((t) => gmCard(id, t, last, true)).join("")}</ol>
        <div class="cc-row tg-bar"><button type="button" class="button" data-act="tg" data-do="compose">Telegraph something else</button><button type="button" class="button primary" data-act="tg" data-do="end">${sure("end", "Tap again to end it", `End round ${n}`)}</button></div>
        <p class="cc-small">Ending it lands whatever’s still coming, and each of them rolls When it lands on their phone.</p>`;
    } else if (last) {
      body = `${head(`Round ${last.n}`)}<p class="cc-small tg-sum" aria-live="polite">Over. ${tally(last)}</p>${sending}
        <ol class="tg-list">${last.tele.map((t) => gmCard(id, t, last, false)).join("")}</ol>
        <div class="cc-row tg-bar"><button type="button" class="button primary" data-act="tg" data-do="compose">Telegraph round ${last.n + 1}</button><button type="button" class="button" data-act="tg" data-do="fight">${sure("fight", "Tap again: the next one’s round 1", "That fight’s over")}</button></div>`;
    } else {
      body = `${head("Telegraphs")}${lead("Telegraph the round from here and each one goes to the phone of whoever it’s aimed at. They answer it there, or let it land, and you see how it went as it happens.")}
        <div class="cc-row tg-bar"><button type="button" class="button primary" data-act="tg" data-do="compose">Telegraph something</button></div>`;
    }
    // Earlier rounds of this fight, a line each.
    const earlier = doc.rounds.slice(0, building || !last ? doc.rounds.length : -1).reverse();
    const past = earlier.length ? `<details class="cc-group tg-past" data-open="tg-past"${d.isOpen("tg-past") ? " open" : ""}><summary>Earlier this fight <small>${earlier.length === 1 ? `round ${earlier[0].n}` : `rounds ${earlier[earlier.length - 1].n} to ${earlier[0].n}`}</small></summary>
      <ul class="tg-earlier">${earlier.map((r) => `<li><b>Round ${r.n}</b> ${tally(r)}<ul>${r.tele.map((t) => `<li>${esc(cap(t.who))}’s d${t.d} at ${esc(t.at.name)}: ${esc(pastLine(t, r))}</li>`).join("")}</ul></li>`).join("")}</ul></details>` : "";
    return `<section class="cc-sec tg-sec" aria-labelledby="tg-h">${body}${ui.note ? `<div class="cc-note is-warn" role="alert"><p>${esc(ui.note)}</p></div>` : ""}${past}</section>`;
  }
  function pastLine(t, round) {
    const s = stateOf(t, round);
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
    const at = last.tele.filter((t) => t.at.user === me() && t.at.ch === ch.id);
    const open = at.filter((t) => ["coming", "landed"].includes(stateOf(t, last)));
    if (!open.length) return "";
    const coming = open.filter((t) => stateOf(t, last) === "coming").length;
    const text = coming ? `Round ${last.n}: ${plural(coming, "telegraph’s", "telegraphs are")} coming at ${esc(ch.name)}.` : `Round ${last.n}’s over and ${words(open.length)} landed on ${esc(ch.name)}.`;
    return `<div class="cc-note tg-point" role="status"><p>${text} ${coming ? (coming === 1 ? "Answer it" : "Answer them") : "Roll When it lands"} on ${esc(ch.name)}’s play screen.</p></div>`;
  }

  // ------------------------------------------------------------ on the play screen

  // Whatever's coming at this character, at the top of their Play tab, and the
  // rest of the round below it, face up, since anyone can answer any of it.
  function playCard(ch) {
    const id = d.campOf(ch);
    if (!id || !sync.me) return "";
    const k = camp(id);
    const doc = local(id);
    const last = current(doc);
    if (!last) return "";
    const isMine = (t) => t.at.user === me() && t.at.ch === ch.id;
    // Anything from an earlier round that landed and still needs its roll.
    const earlier = doc.rounds.slice(0, -1).map((r) => ({ r, list: r.tele.filter((t) => isMine(t) && stateOf(t, r) === "landed") })).filter((x) => x.list.length);
    const owed = earlier.flatMap((x) => x.list);
    const at = last.tele.filter(isMine);
    const others = last.tele.filter((t) => !isMine(t));
    if (!at.length && !owed.length && !others.length) return "";
    const queued = k.out.some((o) => o.o === "answer" || o.o === "defend");
    const wait = queued ? `<p class="cc-small tg-wait">${online() ? "Sending it to " : "It goes up to "}${esc(gmName(id))}${online() ? "…" : " when you’ve got a signal."}</p>` : "";
    const mineCard = (t, round) => {
      const s = stateOf(t, round);
      let extra = verdict(t, round, { mine: true, ch });
      if (s === "coming") extra = `<div class="tg-do"><button type="button" class="button primary" data-act="tg" data-do="answer" data-id="${esc(t.id)}">Answer it</button><p class="cc-small">Or let it land, and roll When it lands when the round ends.</p></div>`;
      if (s === "landed") extra += `<div class="tg-do"><button type="button" class="button primary" data-act="tg" data-do="land" data-k="${t.kind}">When it lands</button></div>`;
      return card(t, round, extra, { lit: takeLit(t.id) });
    };
    const other = (t) => {
      const s = stateOf(t, last);
      const state = { coming: "", stopped: "Stopped", hit: "Landed", landed: "Landed", held: "Stopped when it landed", through: "Got through" }[s];
      return `<li class="tg-row${s === "coming" ? "" : ` is-${s}`}">${kitDie(t.d, { own: "them", hide: true })}<p><b>${esc(t.who)}</b> at ${esc(t.at.name)} <small>${esc(t.does)}</small>${state ? ` <span class="tg-chip">${state}</span>` : ""}</p>${s === "coming" ? `<button type="button" class="button sm" data-act="tg" data-do="answer" data-id="${esc(t.id)}">Answer it for ${esc(t.at.name)}</button>` : ""}</li>`;
    };
    const coming = at.some((t) => stateOf(t, last) === "coming") || owed.length;
    const head = `<div class="tg-head"><h2 id="tg-play-h">${last.over ? `Round ${last.n}’s over` : coming ? "Coming at you" : at.length ? "This round" : "Coming at the crew"}</h2>${netLine(id, k)}</div>`;
    const owedHtml = earlier.map((x) => `<p class="cc-small">From round ${x.r.n}:</p><ol class="tg-list">${x.list.map((t) => mineCard(t, x.r)).join("")}</ol>`).join("");
    const atHtml = at.length ? `<ol class="tg-list">${at.map((t) => mineCard(t, last)).join("")}</ol>` : last.over ? "" : `<p class="cc-small">Nothing’s aimed at ${esc(ch.name)} this round.</p>`;
    const rest = others.length ? `<h3 class="tg-h3">${at.length || owed.length ? "The rest of the round" : "Coming at the crew"}</h3><ul class="tg-rows">${others.map(other).join("")}</ul>` : "";
    return `<section class="cc-sec tg-play" aria-labelledby="tg-play-h">${head}${wait}${owedHtml}${atHtml}${rest}</section>`;
  }

  // The telegraphs that landed on this character and still need When it lands:
  // the blows (Defend) or the fear (Confidence), ready for the defence roll.
  function landedFor(ch, kind = null) {
    const id = ch ? d.campOf(ch) : null;
    if (!id) return null;
    const doc = local(id);
    const list = doc.rounds.flatMap((r) => r.tele.filter((t) => t.at.user === me() && t.at.ch === ch.id && stateOf(t, r) === "landed"));
    const blows = list.filter((t) => t.kind !== "fear");
    const fear = list.filter((t) => t.kind === "fear");
    const pick = kind === "fear" ? fear : kind === "blow" ? blows : blows.length ? blows : fear;
    if (!pick.length) return null;
    return {
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
  function record(s, id, kind, teleId, val) {
    if (!id || !teleId) return;
    const t = s.tele && typeof s.tele === "object" && s.tele.c === id ? s.tele : { c: id, a: {}, d: {} };
    t.a = t.a && typeof t.a === "object" ? t.a : {};
    t.d = t.d && typeof t.d === "object" ? t.d : {};
    const keepIds = new Set(local(id).rounds.flatMap((r) => r.tele.map((x) => x.id)));
    for (const part of ["a", "d"]) for (const x of Object.keys(t[part])) if (!keepIds.has(x)) delete t[part][x];
    // An answer keeps the time it was first rolled, so one paid for or
    // rolled again later still says when it happened.
    if (val == null) delete t[kind][teleId];
    else t[kind][teleId] = kind === "a" ? { ...val, t: t.a[teleId]?.t ?? Date.now() } : val;
    s.tele = t;
  }

  // A character's been saved: what it rolled against the table goes up, and
  // anything it's taken back (an Undo) comes off.
  function soon(ch) {
    const id = ch ? d.campOf(ch) : null;
    if (!id || !sync.me || roleIn(id) !== "player") return;
    const k = camp(id);
    const t = ch.state?.tele;
    const want = {};
    if (t && t.c === id) {
      for (const [x, v] of Object.entries(t.a ?? {})) want[`${ch.id}|a|${x}`] = v;
      for (const [x, v] of Object.entries(t.d ?? {})) want[`${ch.id}|d|${x}`] = v;
    }
    const doc = local(id);
    let queued = false;
    for (const [key, v] of Object.entries(want)) {
      const h = JSON.stringify(v);
      if (k.sent[key] === h) continue;
      const [, part, x] = key.split("|");
      const hit = findTele(doc, x);
      // One the table hasn't got any more is nobody's business now.
      if (!hit) continue;
      k.sent[key] = h;
      // The table has it already, from this player's other phone.
      if (sameAs(hit.t, part, v, ch.id)) continue;
      k.out.push(part === "a" ? { o: "answer", id: x, ch: ch.id, a: v, n: ++st.n, at: Date.now() } : { o: "defend", id: x, ch: ch.id, r: v, n: ++st.n, at: Date.now() });
      queued = true;
    }
    for (const key of Object.keys(k.sent)) {
      if (!key.startsWith(`${ch.id}|`) || key in want) continue;
      const [, part, x] = key.split("|");
      delete k.sent[key];
      // Taken back, while the table still has it.
      if (!findTele(doc, x)) continue;
      k.out.push(part === "a" ? { o: "answer", id: x, ch: ch.id, a: null, n: ++st.n, at: Date.now() } : { o: "defend", id: x, ch: ch.id, r: null, n: ++st.n, at: Date.now() });
      queued = true;
    }
    if (!queued) return;
    keep();
    flush(id);
  }

  // Whether the table's got this answer, or this When it lands, already.
  function sameAs(t, part, v, chId) {
    const dice = (list) => JSON.stringify((list ?? []).map((x) => [x.size, x.total]));
    if (part === "a") return Boolean(t.ans && t.ans.user === me() && t.ans.ch === chId && t.ans.act === v.act && t.ans.opp === v.opp && dice(t.ans.dice) === dice(v.dice));
    return Boolean(t.def && t.at.user === me() && t.def.stopped === v.stopped && t.def.mine === v.mine && t.def.v === v.v && t.def.paid === (v.paid || ""));
  }

  // What the roll card says about an answer, or a When it lands, and where it's got to.
  function rollNote(r) {
    const id = r.kind === "defence" ? r.camp : r.tele?.camp;
    if (!id) return "";
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
    const said = won ? "<b>Stopped.</b> It never lands." : tie ? "<b>A tie’s a loss</b>, so it lands now, unless you win the tie for 1 Aura." : "<b>It lands now</b>, and there’s no defence against it. The GM says what it costs.";
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
    const t = r.tele;
    if (!t) return "";
    return `<p class="tg-for"><span class="k">Answering</span> ${esc(t.who)}’s d${t.d}${t.atName && !t.mine ? ` at ${esc(t.atName)}` : ""}: <em>${esc(t.does)}</em></p>`;
  }

  // ------------------------------------------------------------ the dialogs

  // Telegraphing something: the card as it'll go out, then who it's from, who
  // it's at, how hard and what it's doing.
  function composerView(r) {
    const id = r.camp;
    const f = r.f;
    const roster = rosterOf(id);
    const doc = local(id);
    const last = current(doc);
    const n = r.live ? last?.n ?? 1 : (last && !last.over ? last.n : (last?.n ?? 0) + 1);
    const target = roster.find((p) => p.user === f.at?.user && p.ch === f.at?.ch) ?? null;
    const known = threatsOf(id);
    const preview = kitTele({ who: f.who || "Who’s telegraphing", does: f.does || "What it’s doing", at: target?.cname ?? "who it’s aimed at", atCrest: crestOf(id, target) ?? [], d: f.d || 6, round: n, one: f.one, when: f.kind === "fear" ? "Lands on Confidence at the end of the round" : "", strict: false });
    const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
    const verbs = INTENTS[f.kind === "fear" ? "fear" : "blow"];
    return `<div class="dlg-head"><div class="cc-live"><p class="kicker tg-k">Round ${n}${r.live ? " · on now" : ""}</p><h2 id="dlg-title">${r.edit ? "Change the telegraph" : "Telegraph"}</h2></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>
    <div class="dlg-body tg-compose">
      <div class="tg-preview" aria-hidden="true">${preview}</div>
      <fieldset class="cc-group"><legend>Who it’s aimed at</legend>
        <div class="tg-targets">${roster.map((p) => `<button type="button" class="tg-target" data-act="tg" data-do="at" data-user="${esc(p.user)}" data-ch="${esc(p.ch)}"${pressed(target === p)}>${crestHtml(id, p)}<span><b>${esc(p.cname)}</b><small>${esc(first(p.name))}</small></span></button>`).join("")}</div></fieldset>
      <fieldset class="cc-group"><legend>How hard</legend>
        <div class="tg-sizes">${SIZES.map((x) => `<button type="button" class="tg-size" data-act="tg" data-do="d" data-d="${x}"${pressed(f.d === x)} aria-label="A d${x}">${kitDie(x, { own: "them", hide: true, bare: true })}<span>d${x}</span></button>`).join("")}</div></fieldset>
      <label class="tg-label" for="tg-who">Who’s telegraphing</label>
      <input id="tg-who" data-tg="who" maxlength="${MAX.who}" autocomplete="off" placeholder="The left Warden" value="${esc(f.who)}">
      ${known.length ? `<div class="cc-chips tg-known" role="group" aria-label="Who’s telegraphed already">${known.map((x) => `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="who" data-who="${esc(x.who)}" data-d="${x.d}"${pressed(f.who === x.who)}>${esc(x.who)} <small>d${x.d}</small></button>`).join("")}</div>` : ""}
      <label class="tg-label" for="tg-does">What it’s doing</label>
      <input id="tg-does" data-tg="does" maxlength="${MAX.does}" autocomplete="off" placeholder="${esc(target ? `Pin ${target.cname} against the wall` : "Pin her against the wall")}" value="${esc(f.does)}">
      <div class="cc-chips tg-verbs" role="group" aria-label="Start it with">${verbs.map((v) => `<button type="button" class="cc-chipbtn sm" data-act="tg" data-do="verb" data-v="${v}">${v}${target ? ` ${esc(target.cname)}` : ""}</button>`).join("")}</div>
      <fieldset class="cc-group"><legend>What lands</legend>
        <button type="button" class="cc-line" data-act="tg" data-do="kind" data-k="blow"${pressed(f.kind !== "fear")}><span class="tick" aria-hidden="true"></span><span>A blow <small>blades, falling rocks and teeth, stopped by their Defend</small></span></button>
        <button type="button" class="cc-line" data-act="tg" data-do="kind" data-k="fear"${pressed(f.kind === "fear")}><span class="tick" aria-hidden="true"></span><span>Fear, lies or pressure <small>against their Confidence</small></span></button></fieldset>
      <details class="cc-group" data-open="tg-one"${f.one || d.isOpen("tg-one") ? " open" : ""}><summary>Only one answer? <small>what happens if it lands</small></summary>
        <label class="cc-field" for="tg-one">If it lands</label><input id="tg-one" data-tg="one" maxlength="${MAX.one}" autocomplete="off" placeholder="The household clock drops two sizes" value="${esc(f.one)}"></details>
      ${r.live ? `<p class="cc-small">It goes out now. The round can change while someone’s still got an action to answer it with.</p>` : ""}
    </div>
    <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}<button type="button" class="button primary" data-act="tg" data-do="save">${r.edit ? "Save it" : r.live ? "Send it now" : "Add it to the round"}</button></div>`;
  }

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
    const forOther = !(t.at.user === me() && t.at.ch === ch.id);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${forOther ? `Answer it for ${esc(t.at.name)}` : "Answer it"}</h2><p class="cc-small">Spend your action on it.</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>
    <div class="dlg-body tg-pick">
      <ol class="tg-list">${card(t, hit.round)}</ol>
      <p class="cc-lead">Pick the set action that fits the way you’re stopping it: dodge it, block it, talk them down, or get your shot in first. Win and it never lands. Lose and it lands now, with no defence.${forOther ? ` If you put yourself in the way and lose, it lands on you.` : ""}</p>
      <div class="tg-acts">${d.actions(ch, c).map((a) => `<button type="button" class="tile card tg-act" data-act="tg" data-do="with" data-a="${a.i}"><span class="tile-dice" aria-hidden="true">${a.dice}</span><span class="tile-name">${esc(a.name)}</span><span class="tile-says">${esc(a.says)}</span></button>`).join("")}</div>
      <details class="cc-group" data-open="tg-rule"${d.isOpen("tg-rule") ? " open" : ""}><summary>How answering works</summary><div class="cc-rule">${d.rule("s-answering")}</div></details>
    </div>`;
  }

  function dialog(r) {
    if (r.kind === "tele") return composerView(r);
    if (r.kind === "tg-pick") return pickView(r);
    return "";
  }

  // Typing in the composer changes the card as it goes, without drawing the
  // whole dialog again, so the keyboard stays put.
  function input(el, r) {
    const key = el.dataset.tg;
    if (!["who", "does", "one"].includes(key)) return;
    r.f[key] = el.value;
    r.err = "";
    const box = el.closest(".dlg-body")?.querySelector(".tg-preview");
    if (!box) return;
    const id = r.camp;
    const target = rosterOf(id).find((p) => p.user === r.f.at?.user && p.ch === r.f.at?.ch) ?? null;
    const doc = local(id);
    const last = current(doc);
    const n = r.live ? last?.n ?? 1 : (last && !last.over ? last.n : (last?.n ?? 0) + 1);
    box.innerHTML = kitTele({ who: r.f.who || "Who’s telegraphing", does: r.f.does || "What it’s doing", at: target?.cname ?? "who it’s aimed at", atCrest: crestOf(id, target) ?? [], d: r.f.d || 6, round: n, one: r.f.one, when: r.f.kind === "fear" ? "Lands on Confidence at the end of the round" : "", strict: false });
  }

  function compose(id, draft = null) {
    const doc = local(id);
    const last = current(doc);
    const live = Boolean(last && !last.over) && !draft;
    const f = draft ? { who: draft.who, does: draft.does, d: draft.d, kind: draft.kind, one: draft.one ?? "", at: draft.at ? { user: draft.at.user, ch: draft.at.ch } : null }
      : { who: "", does: "", d: 0, kind: "blow", one: "", at: null };
    // The one she telegraphed last, ready to go again.
    if (!draft) {
      const known = threatsOf(id)[0];
      if (known) Object.assign(f, { who: known.who, d: known.d });
      const roster = rosterOf(id);
      if (roster.length === 1) f.at = { user: roster[0].user, ch: roster[0].ch };
    }
    ui.sure = "";
    d.openDialog({ kind: "tele", camp: id, live, edit: draft?.id ?? null, f, err: "" });
  }

  function save(r) {
    const id = r.camp;
    const f = r.f;
    const roster = rosterOf(id);
    const target = roster.find((p) => p.user === f.at?.user && p.ch === f.at?.ch) ?? null;
    const err = !f.who.trim() ? "Say who’s telegraphing." : !target ? "Pick who it’s aimed at." : !f.d ? "Pick its die." : !f.does.trim() ? "Say what it’s doing." : "";
    if (err) {
      r.err = err;
      return d.renderDialog();
    }
    const t = { id: r.edit || newId(), who: f.who.trim().slice(0, MAX.who), does: f.does.trim().slice(0, MAX.does), d: f.d, kind: f.kind === "fear" ? "fear" : "blow", one: f.one.trim().slice(0, MAX.one), at: { user: target.user, ch: target.ch, arch: crestOf(id, target) ?? [] } };
    const k = camp(id);
    if (r.live) push(id, { o: "add", tele: t });
    else {
      const i = k.drafts.findIndex((x) => x.id === t.id);
      if (i >= 0) k.drafts[i] = t;
      else k.drafts.push(t);
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
      const roster = rosterOf(id);
      const ok = k.drafts.filter((t) => roster.some((p) => p.user === t.at?.user && p.ch === t.at?.ch));
      if (!ok.length) {
        ui.note = "Nobody it’s aimed at is playing here now. Change them, or take them off.";
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
      d.answer(Number(el.dataset.a), { camp: r.camp, id: t.id, d: t.d, who: t.who, does: t.does, atName: t.at.name, mine: t.at.user === me() && t.at.ch === ch.id });
    },
    land: (el) => {
      const pre = landedFor(d.current(), el.dataset.k === "fear" ? "fear" : "blow");
      if (pre) d.defend(pre);
    },
  };

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
      if (id && view.name !== "sheet") {
        if (roleIn(id) == null) return watch(null);
      }
      watch(sync.me && !sync.out ? id : null);
    },
    section,
    pointer,
    playCard,
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
