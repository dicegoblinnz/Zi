// The world builder, building alone (stage 5 of notes/builder-plan.md), on the
// World screen: Build the world on an empty board, and Add a faction on any
// board, one brought in from a frame included.
//
// It deals on her phone with the engine (world-engine.js) from
// public/world-tables.json, which the service worker keeps, so once the tables
// have been seen it works with no signal. Every word on a card comes off the
// tables Mo's approved, or she writes it herself. Arriving at a screen deals
// what it needs, in the engine's order: the asking, the ground, then every
// faction round twice (up to its assets, then the rest), so an agenda or a
// Secret can aim at any faction on the board. She goes through the factions
// one at a time. Every step has three cards (or a dealt set) with Lock, Deal
// again and Write my own, the because under each card, and Undo.
//
// A build that isn't finished is kept on her phone, for the account signed in,
// by campaign, till Done sends it as one batch of changes through world.js
// (edit()), which keeps them till there's a signal. It goes when the campaign
// leaves the phone, like zi-world, and when the account does.
//
//   zi-make   { user, k: { <campaign>: entry } }, an entry being:
//     mode    "world" (Build the world) or "add" (Add a faction)
//     setup   what she picked to start: region, genre (or "mix" with era and
//             twist) and how many factions
//     W       the world in progress, as recordOf() keeps it
//     at      the screen she's on
//     hands   each step's three cards as they were dealt, so a tap never
//             shuffles them
//     cut     the threads and bonds she's swiped away
//     mix     adding: where its mix came from ("build" or "frame", and the
//             frame's name)
//     ids     adding: the board's own factions' ids, in the order they're held
//     seats   adding: the pages of the seats a build dealt, in the same order
//
// Done (Put it on the board): the factions go onto the board and the seats
// into the pages as places, all hidden from the crew, and the record into
// doc.build (world-record.js), with the id each faction and seat got beside
// what was dealt it. Adding a faction, its ties go on the other factions'
// cards too, and it joins the record's added.
import { QUESTIONS, REGIONS, SIZES, STEPS, canDeal, cardsOf, choose, dealRest, lock, newSeed, options, pickAt, pickKey, preview, recordOf, redeal, redealFaction, resume, start, startAdd, tensionAt } from "./world-engine.js";
import { MAX, moneyOf } from "./board.js";
import { PMAX, findPage } from "./pages.js";
import { die as kitDie, mini as kitMini, tag as kitTag } from "../kit/kit.js";

const KEY = "zi-make";
const MIX = "mix";
const UNDOS = 25;
const DIE_SIZES = [2, 4, 6, 8, 10, 12];
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
const copy = (x) => JSON.parse(JSON.stringify(x));
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const flat = (t) => String(t ?? "").replace(/[.]+$/, "");
const words = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
// A name inside a sentence, its The coming down, and its 's.
const inline = (name) => String(name ?? "").replace(/^The /, "the ");
const whose = (name) => `${inline(name)}${/s$/.test(name) ? "’" : "’s"}`;

// The book's own questions, in its order: what holds it together and what's
// pulling it apart (the tension), who runs it, and what a stranger notices.
const ASK = {
  "ask:holds": { h: "What holds it together?", short: "What holds it together" },
  tension: { h: "What’s pulling it apart?", short: "What’s pulling it apart" },
  "ask:runs": { h: "Who runs it, really?", short: "Who runs it" },
  "ask:notices": { h: "What does a stranger notice first?", short: "What a stranger notices" },
};
const ASKING = ["ask:holds", "tension", "ask:runs", "ask:notices"];
const DIALS = [["tense", "How tense"], ["strange", "How strange"], ["rich", "How rich"], ["ruled", "How ruled"]];
const DIAL_WORDS = ["low", "middling", "high"];
const NUDGE = { tense: ["calmer", "more tense"], strange: ["less strange", "stranger"], rich: ["poorer", "richer"], ruled: ["less ruled", "more ruled"] };
const PARTS = [
  [1, "Where it sits", "Where it sits decides what it lives off, and how big it is sets its Power."],
  [2, "What it is", "What it is, how it works and what it wants, each one read off its seat and the cards before it."],
  [3, "What it’s got", "Its resources pay for its assets. Its Power is 1 step, plus 1 for each asset that’s people who turn up when it calls."],
  [4, "What it’s up to", "Its agenda, the person the crew deals with and what it’s hiding. Nobody sees its Secret till you show them."],
];
const BONDS = { pub: "Public Sentiment", mor: "Morale", loy: "Loyalty" };
const CHECKS = { whole: "a card with a hole in it", power: "Power that its people didn’t add up to", rival: "a faction with no rival", block: "a trade nobody was blocking", secret: "no Secret naming another faction", unique: "two factions holding the same asset", aims: "an agenda aimed at nothing", strange: "nothing strange on the board" };
const FIXED = { whole: "to fill a hole in a card", power: "so its people add up to its Power", rival: "so every faction has a rival", block: "so there’s a trade to block", secret: "so a Secret names another faction", unique: "so no two factions hold the same asset", aims: "so its agenda aims at something", strange: "so there’s something strange" };
const STEP_NAMES = { seat: "where it sits", size: "its size", type: "what it is", exc: "how it breaks the logic", method: "how it works", want: "its Want", res: "its resources", assets: "its assets", agenda: "its agenda", face: "its Face", secret: "its Secret", name: "its name" };

const ICON = {
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
  deal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="9" height="13" rx="1.2" transform="rotate(-8 8 12.5)"/><rect x="11" y="4.5" width="9" height="13" rx="1.2" transform="rotate(8 15.5 11)"/></svg>',
  pen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  cut: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  keep: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>',
};

export function makeWorldMake(w) {
  const { d, esc, sync, edit, docOf, isGm, newId, plural } = w;
  let T = null;
  let loading = null;
  let failed = false;
  let st = null;
  const live = {};
  const undos = {};
  let ui = { own: "", sure: "", roll: "" };
  let slide = "";
  let moved = false;
  let fresh = new Set();

  // ------------------------------------------------------------ the tables

  function tables() {
    if (T) return T;
    loading ??= fetch("/world-tables.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.core && j.packs) {
          T = j;
          failed = false;
        } else {
          failed = true;
          loading = null;
        }
        d.quietRender();
      })
      .catch(() => {
        failed = true;
        loading = null;
        d.quietRender();
      });
    return null;
  }

  // ------------------------------------------------------------ kept on the phone

  function load() {
    const me = sync.me?.id ?? null;
    if (st && st.user === me) return st;
    const kept = read(KEY);
    st = kept && kept.user === me && me && kept.k && typeof kept.k === "object" ? kept : { user: me, k: {} };
    return st;
  }
  const keep = () => {
    if (st?.user) write(KEY, st);
  };
  addEventListener("storage", (e) => {
    if (e.key === KEY) {
      st = null;
      for (const k of Object.keys(live)) delete live[k];
    }
  });
  const entryOf = (id) => load().k[id] ?? null;
  // The world in progress, picked up from what the phone kept.
  function worldOf(id) {
    const e = entryOf(id);
    if (!e?.W || !T) return null;
    if (!live[id]) {
      try {
        live[id] = resume(T, e.W);
      } catch {
        return null;
      }
    }
    return live[id];
  }
  function save(id) {
    const e = entryOf(id);
    if (!e) return;
    if (live[id]) e.W = recordOf(live[id]);
    e.saved = Date.now();
    keep();
  }
  function snap(id) {
    const e = entryOf(id);
    if (!e) return;
    (undos[id] ??= []).push(JSON.stringify({ W: live[id] ? recordOf(live[id]) : e.W ?? null, hands: e.hands, cut: e.cut, at: e.at, setup: e.setup }));
    if (undos[id].length > UNDOS) undos[id].shift();
  }
  function undo(id) {
    const e = entryOf(id);
    const s = undos[id]?.pop();
    if (!e || !s) return false;
    const was = JSON.parse(s);
    Object.assign(e, { W: was.W, hands: was.hands ?? {}, cut: was.cut ?? [], at: was.at, setup: was.setup });
    delete live[id];
    ui = { own: "", sure: "", roll: "" };
    keep();
    return true;
  }
  function forget(id) {
    load();
    delete st.k[id];
    delete live[id];
    delete undos[id];
    keep();
  }

  // ------------------------------------------------------------ what can deal

  const players = (id) => d.campaign(id)?.players?.length ?? d.list()?.find((x) => x.id === id)?.players ?? 0;
  const regionsThatDeal = () => REGIONS.filter((r) => Object.keys(T.eras).some((era) => canDeal(T, { region: r, era })));
  const genresAt = (region) => Object.values(T.genres).filter((g) => canDeal(T, { region, era: g.era, twist: g.twist }));
  function recipeOf(s) {
    if (!s) return null;
    if (s.genre === MIX) return s.era ? { region: s.region, era: s.era, twist: s.twist || null } : null;
    const g = T.genres[s.genre];
    return g ? { region: s.region, era: g.era, twist: g.twist } : null;
  }
  const dealsSetup = (s) => {
    const r = recipeOf(s);
    return Boolean(r && canDeal(T, r));
  };
  // A recipe's name: the genre it is, or its era and twist.
  function genreName(r) {
    const g = Object.values(T.genres).find((x) => x.era === r.era && (x.twist ?? null) === (r.twist ?? null));
    return g ? g.name : `${T.eras[r.era] ?? r.era}${r.twist ? ` and ${T.twists[r.twist] ?? r.twist}` : ""}`;
  }
  const regionName = (r) => T.regions[r]?.name ?? cap(r);
  // Somewhere that deals, and the first genre that deals there.
  function firstSetup(n) {
    const region = regionsThatDeal()[0] ?? "town";
    return { region, genre: genresAt(region)[0]?.id ?? MIX, era: null, twist: null, n };
  }
  // A setup that's moved to a region where its genre doesn't deal gives way
  // to one that does.
  function settle(s) {
    if (s.genre !== MIX && !genresAt(s.region).some((g) => g.id === s.genre)) s.genre = genresAt(s.region)[0]?.id ?? MIX;
    if (s.genre === MIX) {
      if (!s.era || !canDeal(T, { region: s.region, era: s.era })) s.era = Object.keys(T.eras).find((era) => canDeal(T, { region: s.region, era })) ?? null;
      if (s.twist && !canDeal(T, { region: s.region, era: s.era, twist: s.twist })) s.twist = null;
    }
    return s;
  }

  // Adding to a board: the mix it deals at, from the build kept with the
  // world, or the frame most of its factions came in from.
  function mixOf(doc) {
    const b = doc.build;
    if (b?.recipe?.region && b.recipe.era && canDeal(T, b.recipe)) return { recipe: { region: b.recipe.region, era: b.recipe.era, twist: b.recipe.twist ?? null }, dials: b.dials, from: "build", asking: b.dealt?.asking ?? null, tension: b.dealt?.tension ?? null };
    const count = new Map();
    for (const f of doc.factions) if (f.book?.from && T.frames[f.book.from]) count.set(f.book.from, (count.get(f.book.from) ?? 0) + 1);
    const best = [...count.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
    const fr = best ? T.frames[best] : null;
    if (fr) {
      const recipe = { region: fr.region, era: fr.era, twist: fr.twist ?? null };
      if (canDeal(T, recipe)) return { recipe, dials: { tense: 1, strange: 1, rich: 1, ruled: 1, ...fr.dials }, from: "frame", name: fr.name };
    }
    return null;
  }
  // The board's own factions, held, with what a build dealt them where the
  // world's record has it, and the seats a build dealt that are still places.
  function heldOf(doc) {
    const dealt = doc.build?.dealt && typeof doc.build.dealt === "object" ? doc.build.dealt : {};
    const ids = Array.isArray(dealt.ids) ? dealt.ids : [];
    const pages = Array.isArray(dealt.pages) ? dealt.pages : [];
    const added = Array.isArray(dealt.added) ? dealt.added : [];
    const seats = [];
    const seatIds = [];
    const at = new Map();
    const put = (s, pid) => {
      if (!s || typeof s !== "object" || !s.text || !pid || at.has(pid) || !findPage(doc, pid)) return;
      at.set(pid, seats.length);
      seats.push(copy(s));
      seatIds.push(pid);
    };
    (Array.isArray(dealt.seats) ? dealt.seats : []).forEach((s, k) => put(s, pages[k]));
    for (const a of added) put(a?.place, a?.pid);
    const factions = doc.factions.filter((f) => !f.mini);
    const held = factions.map((f) => {
      const k = ids.indexOf(f.id);
      const rec = k >= 0 ? dealt.factions?.[k] ?? null : added.find((a) => a?.fid === f.id) ?? null;
      const pid = k >= 0 ? pages[rec?.seat?.k] : rec?.pid;
      return {
        name: f.name,
        about: f.about,
        res: f.res.map((r) => ({ id: r.id, text: r.text })),
        assets: f.assets.filter((a) => !a.off).map((a) => ({ id: a.id, text: a.text, power: a.power, does: a.does })),
        seat: at.has(pid) ? at.get(pid) : null,
        picks: rec,
      };
    });
    return { held, seats, ids: factions.map((f) => f.id), seatIds };
  }

  // ------------------------------------------------------------ starting one

  function begin(id, mode) {
    load();
    const n = Math.max(4, Math.min(12, players(id) + 2));
    const e = { mode, setup: firstSetup(n), W: null, at: "setup", hands: {}, cut: [], saved: Date.now() };
    delete live[id];
    delete undos[id];
    if (mode === "add") {
      const doc = docOf(id);
      const mix = mixOf(doc);
      const held = heldOf(doc);
      e.ids = held.ids;
      e.seats = held.seatIds;
      if (mix) {
        e.mix = { from: mix.from, name: mix.name ?? "" };
        e.setup = { ...e.setup, region: mix.recipe.region, ...genreOf(mix.recipe) };
        const W = startAdd(T, { recipe: mix.recipe, dials: mix.dials, seed: newSeed(T), held: held.held, seats: held.seats, asking: mix.asking, tension: mix.tension });
        live[id] = W;
        e.W = recordOf(W);
        e.at = `f:${W.held}:1`;
      }
    }
    st.k[id] = e;
    keep();
    return e;
  }
  const genreOf = (r) => {
    const g = Object.values(T.genres).find((x) => x.era === r.era && (x.twist ?? null) === (r.twist ?? null));
    return g ? { genre: g.id, era: null, twist: null } : { genre: MIX, era: r.era, twist: r.twist ?? null };
  };
  // The world Set up asks for, dealt from a new seed.
  function startWorld(id) {
    const e = entryOf(id);
    const recipe = recipeOf(e.setup);
    if (!recipe || !canDeal(T, recipe)) return null;
    let W;
    if (e.mode === "add") {
      const doc = docOf(id);
      const held = heldOf(doc);
      const b = doc.build?.recipe?.era ? doc.build : null;
      e.ids = held.ids;
      e.seats = held.seatIds;
      e.mix = null;
      W = startAdd(T, { recipe, dials: b?.dials ?? null, seed: newSeed(T), held: held.held, seats: held.seats, asking: b?.dealt?.asking ?? null, tension: b?.dealt?.tension ?? null });
    } else W = start(T, { recipe, seed: newSeed(T), factions: e.setup.n });
    live[id] = W;
    e.W = recordOf(W);
    e.hands = {};
    e.cut = [];
    return W;
  }
  // Whether Set up says something other than the world that's been dealt.
  function setupMoved(e, W) {
    if (!W) return true;
    const r = recipeOf(e.setup);
    return !r || r.region !== W.recipe.region || r.era !== W.recipe.era || (r.twist ?? null) !== (W.recipe.twist ?? null) || (e.mode === "world" && e.setup.n !== W.n);
  }

  // ------------------------------------------------------------ the screens

  function screensOf(e, W) {
    if (e.mode === "add") {
      const i = W ? W.held : 0;
      return ["setup", ...(W ? PARTS.map(([p]) => `f:${i}:${p}`) : []), ...(W ? ["board"] : [])];
    }
    if (!W) return ["setup"];
    return ["setup", ...ASKING, ...Array.from({ length: W.s }, (_, k) => `seat:${k}`), ...Array.from({ length: W.n }, (_, i) => PARTS.map(([p]) => `f:${i}:${p}`)).flat(), "board"];
  }
  const stageOf = (key) => (key === "setup" ? 0 : key === "board" ? 4 : key.startsWith("seat:") ? 2 : key.startsWith("f:") ? 3 : 1);
  const STAGES = ["Set up", "The asking", "The ground", "The factions", "The board"];
  const ADD_STAGES = ["The mix", ...PARTS.map(([, name]) => name), "Its ties"];
  const addStage = (key) => (key === "setup" ? 0 : key === "board" ? 5 : Number(key.split(":")[2]));
  function screenName(e, W, C, key) {
    if (key === "setup") return e.mode === "add" ? "The mix" : "Set up";
    if (key === "board") return e.mode === "add" ? "Its ties" : "The board";
    if (ASK[key]) return ASK[key].short;
    if (key.startsWith("seat:")) return `Seat ${Number(key.split(":")[1]) + 1}`;
    const [, i, p] = key.split(":");
    const part = PARTS[Number(p) - 1][1];
    return e.mode === "add" ? part : `${C?.factions[Number(i)]?.name || `Faction ${Number(i) + 1}`}: ${part.charAt(0).toLowerCase()}${part.slice(1)}`;
  }

  // Arriving at a screen deals whatever it needs that isn't dealt yet, in the
  // engine's order.
  const holes = (W) => (!W.add && (QUESTIONS.some((q) => !W.asking[q]) || !W.tension)) || W.seats.some((s) => !s) || W.factions.some((f) => !f.held && STEPS.some((s) => (s === "exc" ? f.exc === undefined : f[s] == null)));
  function ready(id, W, key) {
    if (!W || key === "setup") return;
    let did = false;
    const deal = (path) => {
      if (pickAt(W, path) != null) return;
      const [c] = options(T, W, path, 1);
      if (c == null) return;
      choose(T, W, path, c);
      did = true;
    };
    if (ASK[key]) deal(key);
    else if (key.startsWith("seat:")) {
      for (const k of ASKING) deal(k);
      for (let k = 0; k < W.s; k++) deal(`seat:${k}`);
    } else if (key.startsWith("f:")) {
      if (holes(W)) {
        dealRest(T, W, { finish: false });
        did = true;
      }
    } else if (key === "board" && (holes(W) || !W.checks)) {
      dealRest(T, W);
      did = true;
    }
    if (did) save(id);
  }

  // A step's three cards, as they were dealt: the one it's got among them,
  // and a new three when it's been dealt again or what it reads has changed.
  function handOf(e, W, path) {
    const cur = pickAt(W, path);
    const key = pickKey(cur);
    let h = e.hands[path];
    if (!Array.isArray(h) || !h.length || (cur != null && !h.some((c) => pickKey(c) === key))) {
      let opts = options(T, W, path, 3);
      // A Face it got before the other factions had theirs keeps its threat,
      // and the other two cards are other threats.
      if (cur != null && path.endsWith(":face") && !opts.some((c) => pickKey(c) === key)) opts = opts.filter((c) => c.threat !== cur.threat);
      h = cur != null && !opts.some((c) => pickKey(c) === key) ? [cur, ...opts].slice(0, 3) : opts;
      e.hands[path] = copy(h);
    }
    return h;
  }

  // ------------------------------------------------------------ drawing it

  const dieOf = (n) => kitDie(n, { own: "them", hide: true });
  const why = (p) => (p?.why ? `<span class="wk-why">${esc(p.why)}</span>` : "");
  const marks = (p) => [p?.strange ? '<span class="wk-mark is-strange">Strange</span>' : "", p?.own ? '<span class="wk-mark is-own">Yours</span>' : "", p?.again ? '<span class="wk-mark">Another faction has it too</span>' : ""].filter(Boolean).join("");
  const nudges = (dials) => Object.entries(dials ?? {}).filter(([k, v]) => NUDGE[k] && v).map(([k, v]) => `<span class="wk-nudge">${NUDGE[k][v > 0 ? 1 : 0]}</span>`).join("");
  const ownKey = (path) => `own:${path}`;

  // One card in a hand: a tap puts it on.
  function card(path, c, i, on, inner) {
    return `<button type="button" class="wk-card${on ? " is-on" : ""}" data-act="w" data-do="mk-pick" data-p="${esc(path)}" data-c="${i}" aria-pressed="${on}">${inner}</button>`;
  }
  function cardInner(W, path, c, C) {
    const v = preview(T, W, path, c);
    if (!v) return "";
    const [head, , b] = path.split(":");
    const top = marks(v);
    if (head === "ask" || head === "tension") return `<span class="wk-card-w">${esc(v.text)}</span>${nudges(v.dials) || top ? `<span class="wk-card-m">${nudges(v.dials)}${top}</span>` : ""}${why(v)}`;
    if (head === "seat" || b === "seat") {
      const where = b === "seat" && W.add ? (v.fresh ? "A new place" : "On the board, and nobody holds it") : "";
      return `<span class="wk-card-n">${esc(v.name)}</span>${v.role ? `<span class="wk-keep">${esc(v.role)}</span>` : ""}${v.notice ? `<span class="wk-notice">${esc(v.notice)}</span>` : ""}${where || top ? `<span class="wk-card-m">${where ? `<span class="wk-mark">${where}</span>` : ""}${top}</span>` : ""}${why(v)}`;
    }
    if (b === "size") return `<span class="wk-card-die">${dieOf(v.die)}</span><span class="wk-card-w"><b>${esc(cap(v.size))}</b>, ${esc(v.word)}</span><span class="wk-small">Power d${v.die}</span>`;
    if (b === "agenda") return `<span class="wk-card-ag">${kitMini(v.die, { own: "them" })}<span class="wk-card-w">${esc(v.text)}</span><small>d${v.die}</small></span>${top ? `<span class="wk-card-m">${top}</span>` : ""}${why(v)}`;
    if (b === "face") {
      const mine = marks({ ...v, strange: false });
      return `<span class="wk-card-w">${esc(v.text)}</span>${v.ch ? `<span class="wk-small">Challenge ${v.ch}${v.threat?.is ? `, ${esc(v.threat.is)}` : ""}</span>` : ""}${v.threat?.tags?.length ? `<span class="wk-tags">${v.threat.tags.map((t) => kitTag(t.text)).join("")}</span>` : ""}${mine ? `<span class="wk-card-m">${mine}</span>` : ""}`;
    }
    if (b === "secret") return `<span class="wk-secret">${esc(v.tag)}</span><span class="wk-more">${esc(v.more)}</span>${top ? `<span class="wk-card-m">${top}</span>` : ""}${why(v)}`;
    if (b === "name") return `<span class="wk-card-n">${esc(v.text)}</span>${top ? `<span class="wk-card-m">${top}</span>` : ""}`;
    return `<span class="wk-card-w">${esc(v.text)}</span>${top ? `<span class="wk-card-m">${top}</span>` : ""}${why(v)}`;
  }
  // A step: its heading, its three cards, and Lock, Deal again and Write my own.
  function step(e, W, C, path, title, { own = true, again = "Deal again", note = "", sub = "" } = {}) {
    const h = handOf(e, W, path);
    const cur = pickKey(pickAt(W, path));
    const locked = Boolean(W.locks[path]);
    const hid = `wk-${path.replace(/:/g, "-")}`;
    const cards = h.map((c, i) => card(path, c, i, pickKey(c) === cur, cardInner(W, path, c, C))).join("");
    const isFresh = fresh.has(path) ? " is-fresh" : "";
    return `<section class="wk-step${locked ? " is-locked" : ""}${isFresh}" aria-labelledby="${hid}">
      <div class="wk-step-h"><h2 id="${hid}">${title}</h2>${locked ? '<span class="wk-locked">Locked</span>' : ""}</div>${sub}
      <div class="wk-hand${path.endsWith(":size") ? " is-row" : ""}" role="group" aria-labelledby="${hid}">${cards || '<p class="cc-small">Nothing on the tables fits here, so write your own.</p>'}</div>${note}
      ${tools(path, { locked, own, again })}${ui.own === ownKey(path) ? ownForm(W, path) : ""}</section>`;
  }
  function tools(path, { locked, own = true, again = "Deal again", extra = "" }) {
    return `<div class="wk-tools">
      <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>${locked ? "Locked" : "Lock"}</span></button>
      <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-again" data-p="${esc(path)}"${locked ? " disabled" : ""}>${ICON.deal}<span>${again}</span></button>
      ${own ? `<button type="button" class="button sm wk-tool" data-act="w" data-do="mk-own" data-p="${esc(path)}" aria-expanded="${ui.own === ownKey(path)}">${ICON.pen}<span>Write my own</span></button>` : ""}${extra}</div>`;
  }
  // Writing her own: whatever the step needs, and it goes on in a tap.
  function ownForm(W, path) {
    const [head, , b] = path.split(":");
    const cur = pickAt(W, path);
    const was = cur?.own ? cur : null;
    const field = (name, label, value = "", max = MAX.line, more = "") => `<label class="cc-field">${label} <input name="${name}" maxlength="${max}" autocomplete="off" value="${esc(value)}"${more}></label>`;
    const dieSel = (name, label, at = 6, from = DIE_SIZES) => `<label class="cc-field">${label} <select name="${name}">${from.map((n) => `<option value="${n}"${n === at ? " selected" : ""}>d${n}</option>`).join("")}</select></label>`;
    let body = "";
    if (head === "ask" || head === "tension") body = field("text", "Your answer", was?.text, 160, " required");
    else if (head === "seat") body = `${field("text", "Its name", was?.text, MAX.name, " required")}${field("notice", "What a stranger notices there", was?.notice, 160)}`;
    else if (b === "size") body = `<label class="cc-field">How big it is <select name="size">${SIZES.map((s) => `<option value="${s}"${s === (cur?.size ?? "local") ? " selected" : ""}>${esc(cap(s))}, ${esc(T.regions[W.recipe.region]?.sizes?.[s] ?? "")}</option>`).join("")}</select></label>${dieSel("die", "Its Power", cur?.die ?? 6)}`;
    else if (b === "type") body = field("text", "What it is", was?.text, MAX.line, ' required placeholder="like A guild of bell-founders"');
    else if (b === "method") body = field("text", "It works through", was?.text, MAX.line, ' required placeholder="like favours owed"');
    else if (b === "want") body = field("text", "What it wants", was?.text, MAX.words, " required");
    else if (b === "agenda") body = `${field("text", "What it’s doing now", was?.text, MAX.line, " required")}${dieSel("die", "It starts at", was?.die ?? 6)}`;
    else if (b === "face") body = field("text", "Who the crew deals with", was?.text, MAX.words, ' required placeholder="like Brother Anselm, the zealot"');
    else if (b === "secret") body = `${field("tag", "Its Secret, as a hidden tag", was?.tag, MAX.line, ' required placeholder="like Owes the Wrong People"')}${field("more", "And the rest of it", was?.more, MAX.words)}`;
    else if (b === "name") body = field("text", "Its name", was?.text, MAX.name, " required");
    return `<form class="cc-form pt-form wk-own" data-form="w-mk-own" data-p="${esc(path)}">${body}
      <div class="cc-row"><button type="submit" class="button primary">Put it on</button><button type="button" class="button" data-act="w" data-do="mk-own" data-p="${esc(path)}">Cancel</button></div></form>`;
  }

  // The dials the asking's set, a pip each for low, middling and high.
  function dials(W) {
    return `<ul class="wk-dials" aria-label="What your answers have set">${DIALS.map(([k, label]) => {
      const v = W.dials[k];
      return `<li><span>${label}</span><span class="wk-pips" role="img" aria-label="${label}: ${DIAL_WORDS[v]}">${[0, 1, 2].map((x) => `<i${x <= v ? ' class="on"' : ""}></i>`).join("")}</span></li>`;
    }).join("")}</ul>`;
  }

  function head(e, W, C, key, list) {
    const at = list.indexOf(key);
    const stages = e.mode === "add" ? ADD_STAGES : STAGES;
    const now = e.mode === "add" ? addStage(key) : stageOf(key);
    const bars = stages.map((s, k) => `<li${k < now ? ' class="done"' : k === now ? ' class="on"' : ""}></li>`).join("");
    let kicker = e.mode === "add" ? "Adding a faction" : "Building the world";
    let title = "";
    let lead = "";
    if (key === "setup") {
      title = e.mode === "add" ? "Add a faction" : "Build the world";
      lead = e.mode === "add" ? setupLead(e, W) : "Pick where it’s set and what kind of world it is. Then the tables deal it a step at a time, three cards at every step, and you keep one, deal again or write your own.";
    } else if (ASK[key]) {
      kicker = `${kicker} · The asking`;
      title = ASK[key].h;
      lead = key === "tension" ? "Roll the d12 on the book’s tension table, or tap in a roll of your own dice." : key === "ask:holds" ? "Three answers off Building Your World’s tables, or write your own. Each answer sets how tense, strange, rich and ruled it is, and steers what’s dealt after it." : "Pick one of the three, or write your own.";
    } else if (key.startsWith("seat:")) {
      const k = Number(key.split(":")[1]);
      kicker = `The ground · Seat ${k + 1} of ${W.s}`;
      title = "The ground";
      lead = k === 0 ? `The places the factions sit, what each one lives off and what a stranger notices there. There are two more than factions, so there’s always one worth fighting over.` : "Pick one of the three, write your own, or deal again.";
    } else if (key.startsWith("f:")) {
      const [, i, p] = key.split(":").map(Number);
      kicker = e.mode === "add" ? `Adding a faction · ${PARTS[p - 1][1]}` : `Faction ${i + 1} of ${W.n} · ${PARTS[p - 1][1]}`;
      title = esc(C.factions[i]?.name || `Faction ${i + 1}`);
      lead = PARTS[p - 1][2];
    } else if (key === "board") {
      kicker = e.mode === "add" ? "Adding a faction · Its ties" : "Building the world · The board";
      title = e.mode === "add" ? "Its ties" : "The board";
      lead = e.mode === "add" ? "Its rival, and its ally or debt, among the factions already on the board, written on both cards. Swipe one away to leave it off." : "Everything the tables dealt, before anyone sees it. Tap a faction to go through it again. Nothing shows on your players’ phones till you show it to them.";
    }
    return `<header class="cc-head bd-head wk-head"><p class="kicker">${kicker}</p><h1 tabindex="-1">${title}</h1>
      <ol class="bd-progress wk-progress" style="--n: ${stages.length}" aria-hidden="true">${bars}</ol>
      <p class="bd-lead">${lead}</p></header>`;
  }
  function setupLead(e, W) {
    if (e.mix && W) return `It’s dealt as ${esc(genreName(W.recipe))} at ${esc(regionName(W.recipe.region))}, ${e.mix.from === "build" ? "the mix this world was built with" : `${esc(whose(e.mix.name))} mix`}, to fit this board. Change it here if you’d rather.`;
    return "This board hasn’t got a mix yet, so pick where it’s set and what kind of world it is. The new faction’s dealt to fit it, with ties to the factions already on the board.";
  }

  // The bar at the bottom: Back, every step a tap away, and Next.
  function bar(e, W, C, key, list) {
    const at = list.indexOf(key);
    const next = list[at + 1];
    const back = at > 0 ? `<button type="button" class="button bd-back" data-act="w" data-do="mk-back">Back</button>` : "";
    let go;
    if (key === "setup") {
      const moved = setupMoved(e, W);
      const ok = dealsSetup(e.setup);
      const label = W && moved ? (ui.sure === "restart" ? "Tap again to start again" : "Deal a new one") : W ? "Carry on" : "Deal it";
      const small = W && moved ? "What you’ve dealt goes" : e.mode === "add" ? "Where it sits" : "The asking";
      go = `<button type="button" class="button primary bd-next" data-act="w" data-do="mk-next"${ok ? "" : " disabled"}><span>${label}</span><small>${small}</small></button>`;
    } else if (key === "board") {
      go = `<button type="button" class="button primary bd-next" data-act="w" data-do="mk-done"><span>Put it on the board</span><small>Hidden from the crew</small></button>`;
    } else {
      const same = key.startsWith("f:") && next?.startsWith(key.slice(0, key.lastIndexOf(":") + 1));
      const label = same ? PARTS[Number(next.split(":")[2]) - 1][1] : next?.startsWith("f:") && e.mode === "world" ? C.factions[Number(next.split(":")[1])]?.name || "The next faction" : screenName(e, W, C, next);
      go = `<button type="button" class="button primary bd-next" data-act="w" data-do="mk-next"><span>Next</span><small>${esc(label)}</small></button>`;
    }
    return `<div class="bd-foot"><div class="bd-foot-in" role="group" aria-label="Steps">${back}${jump(e, W, C, key, list)}${go}</div></div>`;
  }
  function jump(e, W, C, key, list) {
    const rows = [];
    // The row for where she is: the screen, or the stage or faction it's in.
    const here = (k) => (e.mode === "add" ? k === key : k.startsWith("f:") ? key.startsWith(k.slice(0, -1)) : k === "ask:holds" ? stageOf(key) === 1 : k === "seat:0" ? stageOf(key) === 2 : k === key);
    const row = (k, label) => `<li><button type="button" class="bd-dot${here(k) ? " is-now" : ""}" data-act="w" data-do="mk-go" data-s="${esc(k)}"${here(k) ? ' aria-current="step"' : ""}><span class="n">${rows.length + 1}</span><span>${esc(label)}</span></button></li>`;
    if (e.mode === "add") for (const k of list) rows.push(row(k, screenName(e, W, C, k)));
    else {
      rows.push(row("setup", "Set up"));
      if (W) {
        rows.push(row("ask:holds", "The asking"));
        rows.push(row("seat:0", "The ground"));
        for (let i = 0; i < W.n; i++) rows.push(row(`f:${i}:1`, C.factions[i]?.name || `Faction ${i + 1}`));
        rows.push(row("board", "The board"));
      }
    }
    const n = list.indexOf(key) + 1;
    return `<details class="bd-jump"><summary><span class="sr-only">Step </span>${n}<span class="of"> of ${list.length}</span></summary><div class="bd-jumps"><p class="bd-label">Go to a step</p><ol>${rows.join("")}</ol></div></details>`;
  }

  // ------------------------------------------------------------ each screen

  function setupBody(id, e, W) {
    const s = e.setup;
    const deal = regionsThatDeal();
    const regions = REGIONS.map((r) => {
      const ok = deal.includes(r);
      const reg = T.regions[r];
      return `<button type="button" class="wk-pick${s.region === r ? " is-on" : ""}" data-act="w" data-do="mk-set" data-k="region" data-v="${r}" aria-pressed="${s.region === r}"${ok ? "" : " disabled"}><b>${esc(reg?.name ?? cap(r))}</b><span>${ok ? esc(cap(reg?.faction ?? "")) : "Coming, once its tables are in"}</span></button>`;
    }).join("");
    const here = genresAt(s.region);
    const later = Object.values(T.genres).filter((g) => !here.includes(g)).map((g) => g.name);
    const genres = [...here.map((g) => `<button type="button" class="wk-pick${s.genre === g.id ? " is-on" : ""}" data-act="w" data-do="mk-set" data-k="genre" data-v="${esc(g.id)}" aria-pressed="${s.genre === g.id}"><b>${esc(g.name)}</b><span>${esc(g.twist ? `${T.eras[g.era]} and ${T.twists[g.twist]}` : `${T.eras[g.era]} on its own`)}</span></button>`), `<button type="button" class="wk-pick${s.genre === MIX ? " is-on" : ""}" data-act="w" data-do="mk-set" data-k="genre" data-v="${MIX}" aria-pressed="${s.genre === MIX}"><b>Mix your own</b><span>Any era with any twist</span></button>`].join("");
    const chip = (k, v, label, ok, on) => `<button type="button" class="chip pt-chip wk-chip${on ? " is-on" : ""}" data-act="w" data-do="mk-set" data-k="${k}" data-v="${esc(v)}" aria-pressed="${on}"${ok ? "" : " disabled"}>${esc(label)}${ok ? "" : " <small>coming</small>"}</button>`;
    const mix = s.genre === MIX ? `<div class="wk-mix"><p class="bd-label">The era</p><div class="cc-row wk-chips">${Object.entries(T.eras).map(([k, name]) => chip("era", k, name, canDeal(T, { region: s.region, era: k }), s.era === k)).join("")}</div>
      <p class="bd-label">The twist</p><div class="cc-row wk-chips">${chip("twist", "", "No twist", true, !s.twist)}${Object.entries(T.twists).map(([k, name]) => chip("twist", k, name, Boolean(s.era) && canDeal(T, { region: s.region, era: s.era, twist: k }), s.twist === k)).join("")}</div></div>` : "";
    const count = e.mode === "add" ? "" : `<section class="wk-sec" aria-labelledby="wk-count"><h2 id="wk-count">How many factions</h2>
      <div class="wk-count"><button type="button" class="button wk-step-b" data-act="w" data-do="mk-set" data-k="n" data-v="-1" aria-label="One fewer"${s.n <= 4 ? " disabled" : ""}>−</button><output class="wk-count-n" aria-live="polite">${s.n}</output><button type="button" class="button wk-step-b" data-act="w" data-do="mk-set" data-k="n" data-v="1" aria-label="One more"${s.n >= 12 ? " disabled" : ""}>+</button></div>
      <p class="cc-small">It starts at your players and two more, and it’s never fewer than four. There are always two more seats than factions.</p></section>`;
    const moved = W && setupMoved(e, W);
    const all = e.mode === "add" ? "" : `<section class="wk-all card"><h2>Or deal it all in one tap</h2><p>Every step dealt by the tables at once. Then you go through it a faction at a time, lock what you like and deal the rest again.</p>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="mk-all"${dealsSetup(s) ? "" : " disabled"}>${moved && W ? (ui.sure === "all" ? "Tap again to deal a new one" : "Deal a new one, all of it") : "Deal it all"}</button></div></section>`;
    return `${moved && W ? `<div class="cc-note is-warn" role="status"><p>That’s different to the world you’ve dealt. Deal a new one and what you’ve dealt goes, or put these back to carry on.</p></div>` : ""}
      <section class="wk-sec" aria-labelledby="wk-region"><h2 id="wk-region">Where it’s set</h2><div class="wk-picks">${regions}</div></section>
      <section class="wk-sec" aria-labelledby="wk-genre"><h2 id="wk-genre">What kind of world</h2><div class="wk-picks">${genres}</div>${mix}
      ${later.length ? `<p class="cc-small wk-later">Coming as their tables go in: ${esc(later.join(", "))}.</p>` : ""}</section>${count}${all}`;
  }

  function askBody(e, W, C, key) {
    if (key === "tension") {
      const t = W.tension;
      const roll = t?.roll ?? null;
      const tap = ui.roll === "tension" ? `<div class="wk-roll" role="group" aria-label="The roll you got"><p class="cc-small">What did your d12 come up?</p><div class="wk-roll-g">${Array.from({ length: 12 }, (_, k) => `<button type="button" class="button sm" data-act="w" data-do="mk-roll" data-v="${k + 1}">${k + 1}</button>`).join("")}</div></div>` : "";
      const locked = Boolean(W.locks.tension);
      return `<section class="wk-step wk-tension${fresh.has("tension") ? " is-fresh" : ""}" aria-labelledby="wk-tension"><div class="wk-step-h"><h2 id="wk-tension">The tension</h2>${locked ? '<span class="wk-locked">Locked</span>' : ""}</div>
        <div class="wk-tension-in card">${roll ? kitDie(12, { own: "them", face: roll, label: `The d12 came up ${roll}` }) : `<span class="wk-yours">Yours</span>`}<div><p class="wk-card-w">${esc(t?.text ?? "")}</p>${t ? `<p class="wk-card-m">${nudges(t.dials)}</p>` : ""}</div></div>
        ${tools("tension", { locked, again: "Roll again", extra: `<button type="button" class="button sm wk-tool" data-act="w" data-do="mk-tap" aria-expanded="${ui.roll === "tension"}"${locked ? " disabled" : ""}>${kitMini(12, { own: "them" })}<span>Tap in a roll</span></button>` })}${tap}${ui.own === ownKey("tension") ? ownForm(W, "tension") : ""}</section>${dials(W)}`;
    }
    return `${step(e, W, C, key, "Your answer")}${dials(W)}`;
  }

  function seatBody(e, W, C, key) {
    const k = Number(key.split(":")[1]);
    const held = C.seats.find((s) => s.k === k)?.held ?? -1;
    const sub = held >= 0 ? `<p class="cc-small">Held by ${esc(inline(C.factions[held]?.name ?? "a faction"))}, so a new place here deals its card again from its size, bar what you’ve locked.</p>` : "";
    return step(e, W, C, key, `Seat ${k + 1}`, { sub });
  }

  // A faction's header on its screens: its Power, what it is and where it sits.
  function factionTop(W, C, i) {
    const f = C.factions[i];
    if (!f) return "";
    const steps = f.steps;
    const dice = f.die ? kitDie(f.die, { own: "them", label: `Power d${f.die}` }) : "";
    return `<div class="wk-fac card"><div class="wk-fac-die">${dice}</div><div class="wk-fac-in"><p class="wb-k">${esc(f.size ? cap(f.size) : "")}${f.size ? `, ${esc(T.regions[W.recipe.region]?.sizes?.[f.size] ?? "")}` : ""}</p>
      <p class="wk-fac-about">${esc([f.about, f.sits].filter(Boolean).join(" "))}</p>${f.want ? `<p class="wk-fac-want"><em>${esc(f.want)}</em></p>` : ""}<p class="cc-small">${steps} ${steps === 1 ? "step" : "steps"} of Power</p></div></div>`;
  }

  function factionBody(e, W, C, key) {
    const [, i, p] = key.split(":").map(Number);
    const f = W.factions[i];
    const top = factionTop(W, C, i);
    let body = "";
    if (p === 1) {
      body = `${seatStep(e, W, C, i)}${step(e, W, C, `f:${i}:size`, "How big it is", { own: true })}`;
    } else if (p === 2) {
      body = `${step(e, W, C, `f:${i}:type`, "What it is")}${exception(W, i)}${step(e, W, C, `f:${i}:method`, "How it works")}${step(e, W, C, `f:${i}:want`, "What it wants")}`;
    } else if (p === 3) {
      body = `${setStep(e, W, C, i, "res")}${setStep(e, W, C, i, "assets")}`;
    } else {
      body = `${step(e, W, C, `f:${i}:agenda`, "Its agenda")}${step(e, W, C, `f:${i}:face`, "Its Face", { note: '<p class="cc-small wk-note">The person the crew deals with, as one of the Threat Builder’s threats at the Challenge its Power sends.</p>' })}
        ${step(e, W, C, `f:${i}:secret`, "Its Secret", { note: '<p class="cc-small wk-note">A hidden tag, and two ways in the crew could find it.</p>' })}${step(e, W, C, `f:${i}:name`, "Its name")}${offers(e, W, C, i)}`;
    }
    const again = f && !f.held ? `<div class="wk-again"><button type="button" class="button" data-act="w" data-do="mk-refaction" data-i="${i}">${ICON.deal}<span>Deal this faction again</span></button><p class="cc-small">Everything on its card that you haven’t locked or written yourself.</p></div>` : "";
    return `${top}${body}${again}`;
  }
  // Where it sits: the seats nobody else holds. Adding to a board, that's the
  // places a build dealt that nobody holds, and a new one.
  function seatStep(e, W, C, i) {
    if (!W.add) return step(e, W, C, `f:${i}:seat`, "Where it sits", { own: false, again: "Another seat" });
    const fresh = W.hs;
    const path = `f:${i}:seat`;
    const locked = Boolean(W.locks[path]);
    const cur = pickAt(W, path)?.k;
    const taken = new Set(W.factions.map((f, j) => (j !== i ? f.seat?.k : null)));
    const free = W.seats.map((s, k) => (s && k < fresh && !taken.has(k) ? k : null)).filter((k) => k !== null);
    const freshHand = handOf(e, W, `seat:${fresh}`);
    const curFresh = pickKey(W.seats[fresh]);
    const hid = "wk-f-seat";
    const cards = [
      ...free.map((k) => `<button type="button" class="wk-card${cur === k ? " is-on" : ""}" data-act="w" data-do="mk-seat" data-k="${k}" aria-pressed="${cur === k}">${cardInner(W, path, { k }, C)}</button>`),
      ...freshHand.map((c, n) => {
        const on = cur === fresh && pickKey(c) === curFresh;
        const v = preview(T, W, `seat:${fresh}`, c);
        return `<button type="button" class="wk-card${on ? " is-on" : ""}" data-act="w" data-do="mk-seat" data-k="${fresh}" data-c="${n}" aria-pressed="${on}"><span class="wk-card-n">${esc(v.name)}</span>${v.role ? `<span class="wk-keep">${esc(v.role)}</span>` : ""}<span class="wk-notice">${esc(v.notice)}</span><span class="wk-card-m"><span class="wk-mark">A new place</span>${marks(v)}</span></button>`;
      }),
    ].join("");
    const np = `seat:${fresh}`;
    return `<section class="wk-step${locked ? " is-locked" : ""}" aria-labelledby="${hid}"><div class="wk-step-h"><h2 id="${hid}">Where it sits</h2>${locked ? '<span class="wk-locked">Locked</span>' : ""}</div>
      <div class="wk-hand" role="group" aria-labelledby="${hid}">${cards}</div>
      <div class="wk-tools"><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>${locked ? "Locked" : "Lock"}</span></button>
        <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-again" data-p="${np}"${locked ? " disabled" : ""}>${ICON.deal}<span>New places</span></button>
        <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-own" data-p="${np}" aria-expanded="${ui.own === ownKey(np)}">${ICON.pen}<span>Write my own</span></button></div>${ui.own === ownKey(np) ? ownForm(W, np) : ""}</section>`;
  }
  // One in six cards breaks the logic on purpose, with its reason.
  function exception(W, i) {
    const path = `f:${i}:exc`;
    const x = W.factions[i].exc;
    if (!x) return `<div class="wk-break"><button type="button" class="button sm" data-act="w" data-do="mk-break" data-i="${i}">Break the logic</button><span class="cc-small">One card in six breaks it on purpose, with its reason.</span></div>`;
    return `<section class="wk-step wk-exc" aria-labelledby="wk-exc-${i}"><div class="wk-step-h"><h2 id="wk-exc-${i}">It breaks the logic</h2></div>
      <div class="wk-card is-on is-static"><span class="wk-card-w">${esc(cap(flat(x.text)))}, ${esc(flat(x.reason))}.</span></div>
      <div class="wk-tools"><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-break" data-i="${i}">${ICON.deal}<span>Another one</span></button><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-unbreak" data-i="${i}">${ICON.cut}<span>Take it off</span></button></div></section>`;
  }
  // Its resources or its assets: a dealt set, a line each she can take off,
  // and one of her own to add. Her own changes lock the set.
  function setStep(e, W, C, i, l) {
    const path = `f:${i}:${l}`;
    const list = W.factions[i][l] ?? [];
    const v = preview(T, W, path, list) ?? { items: [] };
    const locked = Boolean(W.locks[path]);
    const hid = `wk-${l}-${i}`;
    const f = C.factions[i];
    const lines = v.items.map((x, k) => {
      const p = list[k] ?? {};
      return `<li class="wk-line${p.power ? " is-people" : ""}"><div class="wk-line-in"><p class="wk-line-w"><b>${esc(x.text)}</b>${p.power ? ' <span class="chip sm wb-chip">+1 Power</span>' : ""}${marks(x)}</p>${l === "assets" && !p.power && x.does ? `<p class="pt-does">${esc(x.does)}</p>` : ""}${why(x)}</div>
        <button type="button" class="button sm wk-drop" data-act="w" data-do="mk-drop" data-p="${esc(path)}" data-k="${k}" aria-label="Take ${esc(x.text)} off">${ICON.cut}</button></li>`;
    }).join("");
    let note = "";
    if (l === "res") {
      const paying = (W.factions[i].assets ?? []).length;
      const extra = Math.max(0, list.length - paying);
      note = `<p class="cc-small wk-note">${plural(list.length, "resource", "resources")}${extra ? `, ${extra} of them with nothing to pay for` : ""}.</p>`;
    } else {
      const people = list.filter((a) => a.power).length;
      note = `<p class="cc-small wk-note">${people ? `${plural(people, "lot", "lots")} of people who turn up` : "Nobody who turns up"}, so it’s ${plural(1 + people, "step", "steps")} of Power${f?.die ? `, a d${f.die}` : ""}.</p>`;
    }
    const add = ui.own === ownKey(path)
      ? `<form class="cc-form pt-form wk-own" data-form="w-mk-add" data-p="${esc(path)}"><label class="cc-field">${l === "res" ? "A resource of your own" : "An asset of your own"} <input name="text" maxlength="${MAX.name}" autocomplete="off" required></label>
        ${l === "assets" ? `<label class="cc-field">What it does <input name="does" maxlength="${MAX.words}" autocomplete="off" placeholder="like once a downtime, the law looks the other way"></label><label class="pt-check"><input type="checkbox" name="power"> It’s people who turn up when it calls (+1 Power)</label>` : ""}
        <div class="cc-row"><button type="submit" class="button primary">Add it</button><button type="button" class="button" data-act="w" data-do="mk-own" data-p="${esc(path)}">Cancel</button></div></form>`
      : "";
    return `<section class="wk-step${locked ? " is-locked" : ""}${fresh.has(path) ? " is-fresh" : ""}" aria-labelledby="${hid}"><div class="wk-step-h"><h2 id="${hid}">${l === "res" ? "Its resources" : "Its assets"}</h2>${locked ? '<span class="wk-locked">Locked</span>' : ""}</div>
      ${lines ? `<ul class="wk-lines">${lines}</ul>` : '<p class="cc-small">None yet.</p>'}${note}
      <div class="wk-tools"><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>${locked ? "Locked" : "Lock"}</span></button>
        <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-again" data-p="${esc(path)}"${locked ? " disabled" : ""}>${ICON.deal}<span>Deal again</span></button>
        <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-own" data-p="${esc(path)}" aria-expanded="${ui.own === ownKey(path)}">${ICON.pen}<span>Add your own</span></button></div>${add}</section>`;
  }
  // What the card says has already happened: a bond or two, to keep or swipe away.
  function offers(e, W, C, i) {
    const list = C.factions[i]?.offers ?? [];
    if (!list.length) return "";
    const items = list.map((o) => tie(e, `o:${i}:${o.text}`, `<span class="wk-tie-k">${esc(BONDS[o.bond] ?? "A bond")}, ${o.kind === "hostile" ? "gone bad" : "good for it"}</span><em>${esc(o.text)}</em>`, o.kind)).join("");
    return `<section class="wk-step" aria-labelledby="wk-offers-${i}"><div class="wk-step-h"><h2 id="wk-offers-${i}">What’s already happened</h2></div>
      <p class="cc-small wk-note">Its card says these have happened, so each goes on it as a bond. Swipe one away to leave it off.</p><ul class="wk-ties">${items}</ul></section>`;
  }
  // A thread or a bond she can keep or swipe away.
  function tie(e, key, inner, kind) {
    const cut = e.cut.includes(key);
    return `<li class="wk-tie is-${kind === "hostile" ? "hostile" : "bond"}${cut ? " is-cut" : ""}" data-cut="${esc(key)}"><div class="wk-tie-in">${inner}</div>
      <button type="button" class="button sm wk-tie-b" data-act="w" data-do="mk-cut" data-k="${esc(key)}" aria-pressed="${cut}">${cut ? `${ICON.keep}<span>Keep it</span>` : `${ICON.cut}<span>Leave it off</span>`}</button></li>`;
  }

  function boardBody(id, e, W, C) {
    const fac = (i) => C.factions[i];
    const name = (i) => esc(fac(i)?.name || `Faction ${i + 1}`);
    const toks = e.mode === "add" ? "" : `<section class="wk-sec" aria-labelledby="wk-facs"><h2 id="wk-facs">The factions</h2><ul class="wb-toks">${C.factions.map((f, i) => `<li class="wb-tok"><button type="button" class="card wb-tok-a wk-tok" data-act="w" data-do="mk-go" data-s="f:${i}:1">
      <span class="wb-tok-die">${f.die ? kitDie(f.die, { own: "them", hide: true }) : ""}</span><span class="wb-tok-in"><span class="wb-k">${esc(cap(f.size ?? ""))}${f.die ? ` · d${f.die}` : ""}</span><b class="wb-tok-n">${esc(f.name)}</b>${f.want ? `<span class="wb-tok-w">${esc(f.want)}</span>` : ""}</span></button></li>`).join("")}</ul></section>`;
    const web = (W.web ?? []).map((t) => {
      const key = `w:${t.a}-${t.b}`;
      const one = fac(t.a)?.threads.find((x) => x.tie === key);
      const two = t.kind === "wildcard" ? null : fac(t.b)?.threads.find((x) => x.tie === key);
      const kind = t.kind === "rival" ? "Rivals" : t.kind === "ally" ? "Allies" : t.kind === "debt" ? "A debt" : one?.kind === "hostile" ? "A grudge" : "A favour";
      const inner = `<span class="wk-tie-k">${kind}: ${name(t.a)} and ${name(t.b)}</span>${one ? `<span class="wk-tie-l"><b>${name(t.a)}</b> <em>${esc(one.text)}</em></span>` : ""}${two ? `<span class="wk-tie-l"><b>${name(t.b)}</b> <em>${esc(two.text)}</em></span>` : ""}`;
      return tie(e, key, inner, one?.kind ?? "bond");
    }).join("");
    const needs = (W.needs ?? []).map((n) => {
      const key = `n:${n.i}`;
      const block = n.by != null ? fac(n.by)?.threads.find((x) => x.tie === key) : null;
      const asset = fac(n.i)?.assets.find((a) => a.off);
      const inner = `<span class="wk-tie-k">A need: ${name(n.i)}</span><span class="wk-tie-l"><b>${esc(asset?.text ?? "")}</b>, with nothing paying for it</span>${block ? `<span class="wk-tie-l"><b>${name(n.by)}</b>, with one to spare: <em>${esc(block.text)}</em></span>` : ""}`;
      return block ? tie(e, key, inner, "hostile") : `<li class="wk-tie is-need"><div class="wk-tie-in">${inner}</div></li>`;
    }).join("");
    const failed = (W.checks ?? []).filter((c) => !c.ok);
    const fixes = [...new Map((W.fixes ?? []).filter((x) => x.path?.startsWith("f:")).map((x) => [x.path, x])).values()].map((x) => {
      const [, i, s] = x.path.split(":");
      return `${STEP_NAMES[s] ? `${name(Number(i))}’s ${STEP_NAMES[s].replace(/^its /, "")}` : name(Number(i))} ${FIXED[x.k] ?? ""}`;
    });
    const fall = (W.fallbacks ?? []).length;
    const checks = `<section class="wk-sec" aria-labelledby="wk-checks"><h2 id="wk-checks">The checks</h2>
      <p class="${failed.length ? "cc-note is-warn" : "cc-small"}">${failed.length ? `Still to sort out: ${esc(failed.map((c) => CHECKS[c.k] ?? c.k).join(", "))}. Whatever you’ve locked or written yourself, the checks leave alone.` : e.mode === "add" ? "Its card adds up, it’s got a rival, and everything it’s after is on the board." : "Every faction’s card adds up and has a rival, and everything it’s after is on the board."}</p>
      ${fixes.length ? `<p class="cc-small">Dealt again for them: ${fixes.join(", ")}.</p>` : ""}${fall ? `<p class="cc-small">${plural(fall, "line", "lines")} from the core tables went in where three deals weren’t enough.</p>` : ""}</section>`;
    const say = w.status(id);
    return `${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${toks}
      ${web ? (e.mode === "add" ? `<section class="wk-sec" aria-label="Its ties"><ul class="wk-ties">${web}</ul></section>` : `<section class="wk-sec" aria-labelledby="wk-web"><h2 id="wk-web">The web</h2><p class="cc-small wk-note">Who’s at whose throat, and who owes whom. Swipe one away to leave it off.</p><ul class="wk-ties">${web}</ul></section>`) : ""}
      ${needs ? `<section class="wk-sec" aria-labelledby="wk-needs"><h2 id="wk-needs">Who needs what</h2><ul class="wk-ties">${needs}</ul></section>` : ""}${checks}
      <p class="cc-small wk-done-note">${e.mode === "add" ? "It goes on the board hidden from the crew" : `${plural(W.n, "faction", "factions")} go on the board and ${plural(W.s, "seat goes", "seats go")} in as places`}, all hidden from the crew till you show them.</p>`;
  }

  // ------------------------------------------------------------ the view

  function view(id, mode) {
    load();
    const top = (undoable) => `<div class="cc-topbar"><a class="cc-back" href="/characters/?camp=${encodeURIComponent(id)}&amp;world" data-act="w" data-do="nav">${d.icon.back}The world</a><div class="cc-tools">${undoable ? `<button type="button" class="button sm wk-undo" data-act="w" data-do="mk-undo" data-c="${esc(id)}">${d.icon.undo}<span>Undo</span></button>` : ""}${d.tools()}</div></div>`;
    const note = (t) => `${top(false)}<div class="wk" data-wb="${esc(id)}"><header class="cc-camp-head"><p class="kicker">The world builder</p><h1>${mode === "add" ? "Add a faction" : "Build the world"}</h1></header><div class="cc-note"><p>${t}</p></div></div>`;
    if (!sync.me) return note('Sign in to build a world for your campaign. <a href="/account/">Sign in</a>');
    if (!isGm(id)) return note("Only the campaign’s GM builds its world.");
    if (!tables()) return note(failed ? "The world builder’s tables haven’t reached this phone yet. Open this once with a signal and they’re kept, so it works with no signal after that." : "Getting the tables out…");
    let e = entryOf(id);
    const board = `/characters/?camp=${encodeURIComponent(id)}&amp;world`;
    if (e && e.mode !== mode) {
      return `${top(false)}<div class="wk" data-wb="${esc(id)}"><header class="cc-camp-head"><p class="kicker">The world builder</p><h1>${mode === "add" ? "Add a faction" : "Build the world"}</h1></header>
        <div class="cc-note"><p>${e.mode === "add" ? "You’re adding a faction on this phone already." : "You’re building the world on this phone already."} Carry on with it, or drop it first.</p>
        <div class="cc-row"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=${e.mode}" data-act="w" data-do="nav">Carry on</a><button type="button" class="button" data-act="w" data-do="mk-drop-build">${ui.sure === "drop-build" ? "Tap again to drop it" : "Drop it"}</button></div></div></div>`;
    }
    if (!e && mode === "add" && !docOf(id).factions.some((f) => !f.mini)) return note(`There’s nothing on the board to add to yet. <a href="${board}" data-act="w" data-do="nav">Build the world</a> instead.`);
    if (!e) e = begin(id, mode);
    let W = worldOf(id);
    if (e.W && !W) {
      // Last week's world can't be dealt from this week's tables.
      forget(id);
      e = begin(id, mode);
      W = worldOf(id);
    }
    let list = screensOf(e, W);
    if (!list.includes(e.at)) e.at = list[0];
    ready(id, W, e.at);
    list = screensOf(e, W);
    const C = W ? cardsOf(T, W) : null;
    const key = e.at;
    const go = slide;
    slide = "";
    let body = "";
    if (key === "setup") body = setupBody(id, e, W);
    else if (ASK[key]) body = askBody(e, W, C, key);
    else if (key.startsWith("seat:")) body = seatBody(e, W, C, key);
    else if (key.startsWith("f:")) body = factionBody(e, W, C, key);
    else body = boardBody(id, e, W, C);
    const rest = W && key !== "board" && key !== "setup" ? `<div class="wk-rest"><button type="button" class="button" data-act="w" data-do="mk-rest">Deal the rest</button><p class="cc-small">Deals whatever’s still to deal and takes you to the board.</p></div>` : "";
    keep();
    fresh = new Set();
    return `${top(Boolean(undos[id]?.length))}<div class="wk" data-wb="${esc(id)}">${head(e, W, C, key, list)}
      <div class="bd-body wk-body${go ? ` bd-go-${go}` : ""}">${body}${rest}<p class="cc-lead bd-saved">It’s kept on this phone as you go, signal or not, and nothing goes on the board till you put it there.</p></div>
      ${bar(e, W, C, key, list)}</div>`;
  }

  // ------------------------------------------------------------ taps

  // A new screen starts at its top, with its heading in reach of a screen
  // reader, after the companion's put the focus back where it was.
  function top() {
    scrollTo(0, 0);
    document.querySelector(".wk h1")?.focus({ preventScroll: true });
  }
  function to(id, key, dir = "") {
    const e = entryOf(id);
    if (!e) return;
    e.at = key;
    ui.own = "";
    ui.roll = "";
    slide = dir;
    keep();
    d.render();
    top();
  }
  function changed(id, say = "", undoable = true) {
    save(id);
    ui.sure = "";
    d.render();
    if (moved) {
      moved = false;
      top();
    }
    if (say) d.toast(say, undoable ? "wkundo" : false);
  }
  // A pick that cleared the steps after it on a card (or the card on a seat
  // that changed): they're dealt again to fit, and the screen says which.
  function refit(id, W, path) {
    const [head, a, s] = path.split(":");
    if (head !== "f" && head !== "seat") return [];
    // In the ground, before the factions are dealt, there's nothing to fit.
    if (!W.factions.some((f) => !f.held && f.type)) return [];
    const i = head === "f" ? Number(a) : W.factions.findIndex((f) => !f.held && f.seat?.k === Number(a));
    const before = recordOf(W);
    dealRest(T, W, { finish: false });
    if (i < 0) return [];
    const after = recordOf(W);
    const out = [];
    for (const step of STEPS.slice(STEPS.indexOf(head === "f" ? s : "seat") + 1)) {
      if (step === "exc") continue;
      if (JSON.stringify(before.factions[i]?.[step] ?? null) !== JSON.stringify(after.factions[i]?.[step] ?? null)) {
        out.push(step);
        fresh.add(`f:${i}:${step}`);
      }
    }
    return out;
  }

  const ACT = {
    "mk-start": (el, id) => {
      const e = entryOf(id);
      const mode = el.dataset.m === "add" ? "add" : "world";
      if (mode === "add" && docOf(id).factions.length >= MAX.factions) return d.toast(`That’s ${MAX.factions} factions, which is as many as a board holds.`, false);
      if (!tables()) {
        if (failed) return d.toast("The world builder’s tables haven’t reached this phone yet. Try again with a signal.", false);
      }
      ui.sure = "";
      d.go(`/characters/?camp=${encodeURIComponent(id)}&world&make=${mode}`, { from: location.pathname + location.search });
    },
    "mk-drop-build": (el, id) => {
      if (ui.sure !== "drop-build") {
        ui.sure = "drop-build";
        return d.render();
      }
      ui.sure = "";
      forget(id);
      d.render();
      d.toast("That one’s gone from this phone.", false);
    },
    "mk-undo": (el, id) => {
      if (undo(id)) {
        slide = "";
        d.render();
        d.toast("Put back.", false);
      }
    },
    "mk-next": (el, id) => {
      const e = entryOf(id);
      if (!e) return;
      let W = worldOf(id);
      if (e.at === "setup") {
        if (!dealsSetup(e.setup)) return;
        if (W && setupMoved(e, W)) {
          if (ui.sure !== "restart") {
            ui.sure = "restart";
            return d.render();
          }
          snap(id);
        }
        ui.sure = "";
        if (!W || setupMoved(e, W)) W = startWorld(id);
        if (!W) return;
        save(id);
      }
      const list = screensOf(e, W);
      const next = list[list.indexOf(e.at) + 1];
      if (next) to(id, next, "next");
    },
    "mk-back": (el, id) => {
      const e = entryOf(id);
      const list = screensOf(e, worldOf(id));
      const back = list[list.indexOf(e.at) - 1];
      if (back) to(id, back, "back");
    },
    "mk-go": (el, id) => {
      el.closest("details")?.removeAttribute("open");
      const e = entryOf(id);
      const list = screensOf(e, worldOf(id));
      const k = el.dataset.s;
      if (!list.includes(k)) return;
      to(id, k, list.indexOf(k) > list.indexOf(e.at) ? "next" : "back");
    },
    "mk-set": (el, id) => {
      const e = entryOf(id);
      if (!e) return;
      const s = e.setup;
      const k = el.dataset.k;
      const v = el.dataset.v;
      if (k === "n") s.n = Math.max(4, Math.min(12, s.n + Number(v)));
      else if (k === "region" && REGIONS.includes(v)) s.region = v;
      else if (k === "genre") s.genre = v;
      else if (k === "era") s.era = v;
      else if (k === "twist") s.twist = v || null;
      settle(s);
      ui.sure = "";
      keep();
      d.render();
    },
    "mk-all": (el, id) => {
      const e = entryOf(id);
      if (!e || !dealsSetup(e.setup)) return;
      let W = worldOf(id);
      if (W && setupMoved(e, W) && ui.sure !== "all") {
        ui.sure = "all";
        return d.render();
      }
      snap(id);
      ui.sure = "";
      if (!W || setupMoved(e, W)) W = startWorld(id);
      if (!W) return;
      dealRest(T, W);
      e.at = "board";
      slide = "next";
      moved = true;
      changed(id, `Dealt all ${plural(W.n, "faction", "factions")}. Go through them, lock what you like and deal the rest again.`);
    },
    "mk-rest": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      if (!e || !W) return;
      snap(id);
      dealRest(T, W);
      e.at = "board";
      slide = "next";
      moved = true;
      changed(id, "Dealt the rest.");
    },
    "mk-pick": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!e || !W || !path) return;
      const c = e.hands[path]?.[Number(el.dataset.c)];
      if (c == null || pickKey(c) === pickKey(pickAt(W, path))) return;
      snap(id);
      choose(T, W, path, copy(c));
      const again = refit(id, W, path);
      changed(id, again.length ? `Dealt again to fit: ${again.map((s) => STEP_NAMES[s]).slice(0, 3).join(", ")}${again.length > 3 ? " and the rest" : ""}. Lock a card to keep it.` : "");
    },
    "mk-seat": (el, id) => {
      // Adding to a board: a place nobody holds, or a new one.
      const e = entryOf(id);
      const W = worldOf(id);
      if (!e || !W) return;
      const k = Number(el.dataset.k);
      const i = W.held;
      snap(id);
      if (k === W.hs && el.dataset.c != null) {
        const c = e.hands[`seat:${k}`]?.[Number(el.dataset.c)];
        if (c && pickKey(c) !== pickKey(W.seats[k])) choose(T, W, `seat:${k}`, copy(c));
      }
      if (pickAt(W, `f:${i}:seat`)?.k !== k) choose(T, W, `f:${i}:seat`, { k });
      dealRest(T, W, { finish: false });
      changed(id);
    },
    "mk-lock": (el, id) => {
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!W || !path) return;
      snap(id);
      lock(W, path, !W.locks[path]);
      changed(id);
    },
    "mk-again": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!e || !W || !path || W.locks[path]) return;
      snap(id);
      delete e.hands[path];
      redeal(T, W, path, { rest: false });
      fresh.add(path);
      refit(id, W, path);
      changed(id);
    },
    "mk-refaction": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const i = Number(el.dataset.i);
      if (!e || !W || !W.factions[i]) return;
      snap(id);
      for (const k of Object.keys(e.hands)) if (k.startsWith(`f:${i}:`)) delete e.hands[k];
      redealFaction(T, W, i);
      for (const s of STEPS) if (!W.locks[`f:${i}:${s}`]) fresh.add(`f:${i}:${s}`);
      changed(id, `Dealt ${cardsOf(T, W).factions[i]?.name ?? "it"} again, bar what you’d locked.`);
    },
    "mk-break": (el, id) => {
      const W = worldOf(id);
      const i = Number(el.dataset.i);
      const path = `f:${i}:exc`;
      if (!W) return;
      snap(id);
      if (W.factions[i].exc) {
        W.tries[path] = (W.tries[path] ?? 0) + 1;
        W.not[path] = W.factions[i].exc.id;
      }
      const [x] = options(T, W, path, 1, { only: "exception" });
      if (!x) {
        undos[id]?.pop();
        return d.toast("Nothing on the tables breaks this one’s logic.", false);
      }
      choose(T, W, path, x);
      const again = refit(id, W, path);
      changed(id, again.length ? "It breaks the logic now, and what comes after it’s dealt again to fit." : "");
    },
    "mk-unbreak": (el, id) => {
      const W = worldOf(id);
      const i = Number(el.dataset.i);
      if (!W) return;
      snap(id);
      choose(T, W, `f:${i}:exc`, null, { keep: true });
      changed(id);
    },
    "mk-own": (el, id) => {
      const key = ownKey(el.dataset.p);
      ui.own = ui.own === key ? "" : key;
      d.render();
      if (ui.own) document.querySelector(".wk-own input, .wk-own select")?.focus();
    },
    "mk-tap": () => {
      ui.roll = ui.roll === "tension" ? "" : "tension";
      d.render();
    },
    "mk-roll": (el, id) => {
      const W = worldOf(id);
      const t = tensionAt(T, Number(el.dataset.v));
      if (!W || !t) return;
      snap(id);
      choose(T, W, "tension", t);
      ui.roll = "";
      fresh.add("tension");
      changed(id);
    },
    "mk-drop": (el, id) => {
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!W || !path) return;
      const list = pickAt(W, path) ?? [];
      const k = Number(el.dataset.k);
      if (!list[k]) return;
      snap(id);
      choose(T, W, path, list.filter((_, n) => n !== k), { keep: true });
      lock(W, path, true);
      changed(id, `${list[k].text ? "Taken off" : "Taken off"}. The rest of the card stays as it is, and the set’s locked.`);
    },
    "mk-cut": (el, id) => {
      const e = entryOf(id);
      if (!e) return;
      const k = el.dataset.k;
      snap(id);
      e.cut = e.cut.includes(k) ? e.cut.filter((x) => x !== k) : [...e.cut, k];
      changed(id);
    },
    "mk-done": (el, id) => done(id),
  };

  function submit(kind, form, f, id) {
    const W = worldOf(id);
    const e = entryOf(id);
    const path = form.dataset.p;
    if (!W || !e || !path) return;
    const text = (name, max = MAX.line) => words(f.get(name), max);
    const [head, , b] = path.split(":");
    if (kind === "w-mk-add") {
      const t = text("text", MAX.name);
      if (!t) return;
      const list = [...(pickAt(W, path) ?? [])];
      const item = b === "assets" ? { own: true, text: t, does: text("does", MAX.words), power: f.get("power") === "on", role: null } : { own: true, text: t, role: null };
      snap(id);
      choose(T, W, path, [...list, item], { keep: true });
      lock(W, path, true);
      ui.own = "";
      return changed(id, `${t} goes on its card, and the set’s locked so nothing deals it away.`);
    }
    if (kind !== "w-mk-own") return;
    let pick = null;
    if (head === "ask" || head === "tension") pick = { own: true, text: text("text", 160) };
    else if (head === "seat") pick = { own: true, text: text("text", MAX.name), notice: text("notice", 160), role: null };
    else if (b === "size") {
      const size = SIZES.includes(f.get("size")) ? f.get("size") : "local";
      const die = DIE_SIZES.includes(Number(f.get("die"))) ? Number(f.get("die")) : 6;
      pick = { own: true, size, die };
    } else if (b === "agenda") pick = { own: true, text: text("text"), die: DIE_SIZES.includes(Number(f.get("die"))) ? Number(f.get("die")) : 6, aims: [] };
    else if (b === "secret") pick = { own: true, tag: text("tag"), text: text("tag"), more: text("more", MAX.words) };
    else if (b === "face" || b === "want") pick = { own: true, text: text("text", MAX.words) };
    else if (b === "name") pick = { own: true, text: text("text", MAX.name) };
    else pick = { own: true, text: text("text") };
    if (!pick.text && !pick.size) return d.toast("Write something in first.", false);
    snap(id);
    choose(T, W, path, pick);
    // Adding a faction, a place of her own is where it sits.
    if (W.add && head === "seat" && Number(path.split(":")[1]) === W.hs && pickAt(W, `f:${W.held}:seat`)?.k !== W.hs) choose(T, W, `f:${W.held}:seat`, { k: W.hs });
    delete e.hands[path];
    ui.own = "";
    fresh.add(path);
    const again = refit(id, W, path);
    changed(id, again.length ? `It’s yours, and what comes after it’s dealt again to fit. Lock a card to keep it.` : "It’s yours. The tables won’t deal it away.");
  }

  // ------------------------------------------------------------ Done

  // The board's changes for what was dealt: the factions, hidden, with their
  // threads by the ids they'll have, the seats as places, and the record.
  function done(id) {
    const e = entryOf(id);
    const W = worldOf(id);
    if (!e || !W) return;
    if (holes(W) || !W.checks) dealRest(T, W);
    const C = cardsOf(T, W);
    const doc = docOf(id);
    const cut = new Set(e.cut);
    const room = MAX.factions - doc.factions.length;
    const mine = W.factions.map((f, i) => (f.held ? null : i)).filter((i) => i !== null);
    if (mine.length > room) return d.toast(`The board holds ${MAX.factions} factions, and that’s more than it’s got room for.`, false);
    const fid = W.factions.map((f, i) => (f.held ? e.ids?.[i] ?? null : newId()));
    // The seats: each a place of its own, bar the ones on the board already.
    const pid = W.seats.map((s, k) => (W.add && k < W.hs ? e.seats?.[k] ?? null : s ? newId() : null));
    const used = new Set(W.factions.map((f) => f.seat?.k));
    const ops = [];
    const cutOf = (t) => Boolean(t.tie && cut.has(t.tie));
    // A thread toward a faction that's gone from the board since doesn't go on.
    const there = (j) => Boolean(fid[j]) && (!W.factions[j].held || doc.factions.some((f) => f.id === fid[j]));
    const line = (x) => ({ ...x, id: newId() });
    for (const i of mine) {
      const c = C.factions[i];
      const threads = c.threads.filter((t) => !cutOf(t) && there(t.to)).map((t) => line({ text: t.text, kind: t.kind, s: "whole", to: fid[t.to] }));
      const bonds = { pub: [], mor: [], loy: [] };
      for (const o of c.offers) if (bonds[o.bond] && !cut.has(`o:${i}:${o.text}`)) bonds[o.bond].push(line({ text: o.text, kind: o.kind === "hostile" ? "hostile" : "bond", s: "whole" }));
      ops.push({
        o: "new",
        f: {
          id: fid[i],
          name: c.name,
          about: [c.about, c.sits].filter(Boolean).join(" "),
          want: c.want,
          face: c.face,
          secret: c.secret,
          more: c.more,
          note: "",
          res: c.res.map((r) => line({ text: r.text, x: 1, left: 1 })),
          assets: c.assets.map((a) => line({ text: a.text, does: a.does, power: a.power, x: 1, left: 1, off: a.off })),
          agendas: c.agendas.map((a) => line({ text: a.text, die: a.die, done: false, then: "" })),
          ...bonds,
          threads,
          shown: {},
        },
      });
    }
    // Adding, the factions already there get their side of each tie.
    if (W.add) {
      for (const j of W.factions.map((f, j) => (f.held ? j : null)).filter((j) => j !== null)) {
        if (!fid[j] || !doc.factions.some((f) => f.id === fid[j])) continue;
        for (const t of C.factions[j].threads) if (fid[t.to] && !W.factions[t.to].held && !cutOf(t)) ops.push({ o: "add", id: fid[j], l: "threads", item: line({ text: t.text, kind: t.kind, s: "whole", to: fid[t.to] }) });
      }
    }
    let places = 0;
    W.seats.forEach((s, k) => {
      if (!s || (W.add && k < W.hs)) return;
      // Adding, only the new place it sits on goes in.
      if (W.add && !used.has(k)) return;
      places++;
      ops.push({ o: "p-new", p: { id: pid[k], kind: "place", name: words(s.text, PMAX.name), look: words(s.notice, PMAX.look), shown: {} } });
    });
    // The record, with the ids beside what was dealt.
    const rec = recordOf(W);
    let b;
    if (W.add) {
      const was = doc.build ? copy(doc.build) : null;
      const dealt = was?.dealt && typeof was.dealt === "object" ? was.dealt : { v: 1 };
      const added = Array.isArray(dealt.added) ? dealt.added : [];
      for (const i of mine) {
        const f = rec.factions[i];
        const k = f.seat?.k;
        added.push({ ...f, fid: fid[i], pid: k != null ? pid[k] : null, place: k != null && k >= W.hs ? rec.seats[k] : null });
      }
      dealt.added = added.slice(-12);
      b = was ? { ...was, dealt, at: Date.now() } : { recipe: W.recipe, dials: W.dials, seed: W.seed, dealt, history: [], shown: false, at: Date.now() };
    } else b = { recipe: W.recipe, dials: W.dials, seed: W.seed, dealt: { ...rec, ids: fid, pages: pid }, history: [], shown: false, at: Date.now() };
    ops.push({ o: "wb-set", b });
    const say = W.add ? `It’s on the board, hidden from the crew: ${C.factions[mine[0]]?.name ?? "the new faction"}.` : `${plural(mine.length, "faction", "factions")} and ${plural(places, "place", "places")} are on the board, all hidden from the crew.`;
    if (!edit(id, ops, say)) return d.toast("The board didn’t take that.", false);
    forget(id);
    // Back to the World screen it came from, so Back doesn't come here again.
    const board = `/characters/?camp=${encodeURIComponent(id)}&world`;
    if (history.state?.from === board) history.back();
    else d.go(board, { replace: true });
  }

  // ------------------------------------------------------------ on the World screen

  // The way in on the board: Build the world on an empty one, Add a faction
  // on any other, and a build that's still on this phone to carry on with.
  function entry(id, doc) {
    load();
    const e = entryOf(id);
    const empty = !doc.factions.length;
    const where = (x) => {
      if (!x?.W) return "set up";
      if (x.at === "board") return x.mode === "add" ? "its ties" : "the board";
      if (x.at?.startsWith("f:")) return x.mode === "add" ? PARTS[Number(x.at.split(":")[2]) - 1][1].toLowerCase() : `faction ${Number(x.at.split(":")[1]) + 1}`;
      if (x.at?.startsWith("seat:")) return "the ground";
      return "the asking";
    };
    if (e) {
      const mode = e.mode;
      return `<div class="wk-start card is-going"><p class="wb-k">The world builder</p><h3>${mode === "add" ? "You’re adding a faction" : "You’re building the world"}</h3>
        <p>It’s on this phone, up to ${esc(where(e))}. Nothing’s on the board till you put it there.</p>
        <div class="cc-row"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=${mode}" data-act="w" data-do="nav">Carry on</a><button type="button" class="button" data-act="w" data-do="mk-drop-build">${ui.sure === "drop-build" ? "Tap again to drop it" : "Drop it"}</button></div></div>`;
    }
    if (empty) {
      return `<div class="wk-start card"><p class="wb-k">The world builder</p><h3>Build the world</h3>
        <p>The tables deal it a step at a time, three cards at every step, or all of it in one tap. You keep what you like and deal the rest again.</p>
        <div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="mk-start" data-m="world">Build the world</button></div></div>`;
    }
    return `<div class="wk-start card is-add"><div><p class="wb-k">The world builder</p><h3>Add a faction</h3><p>Dealt to fit this board, with a rival among the factions on it.</p></div>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="mk-start" data-m="add">Add a faction</button></div></div>`;
  }

  // After drawing: the bar's height for the page's padding, and threads and
  // bonds that swipe away under a thumb.
  function after(root) {
    const foot = root?.querySelector(".wk .bd-foot");
    if (foot) document.documentElement.style.setProperty("--bd-bar", `${foot.offsetHeight}px`);
    for (const el of root?.querySelectorAll(".wk-tie[data-cut]") ?? []) swipe(el);
  }
  function swipe(el) {
    if (el.dataset.sw) return;
    el.dataset.sw = "1";
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x0 = null;
    let y0 = 0;
    let dx = 0;
    let on = false;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType === "mouse" || ev.target.closest("button")) return;
      x0 = ev.clientX;
      y0 = ev.clientY;
      dx = 0;
      on = false;
    });
    el.addEventListener("pointermove", (ev) => {
      if (x0 == null) return;
      dx = ev.clientX - x0;
      if (!on && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(ev.clientY - y0) * 1.5) {
        on = true;
        el.setPointerCapture?.(ev.pointerId);
        el.classList.add("is-moving");
      }
      if (on && !still) el.style.transform = `translateX(${dx}px)`;
    });
    const end = () => {
      if (x0 == null) return;
      const go = on && Math.abs(dx) > Math.min(140, el.offsetWidth * 0.33);
      x0 = null;
      el.classList.remove("is-moving");
      el.style.transform = "";
      if (go) el.querySelector(".wk-tie-b")?.click();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", () => {
      x0 = null;
      el.classList.remove("is-moving");
      el.style.transform = "";
    });
  }

  return {
    ACT,
    submit,
    view,
    entry,
    after,
    undo: (id) => ACT["mk-undo"](null, id),
    title: (mode) => (mode === "add" ? "Adding a faction" : "Building the world"),
    // A campaign that's left the phone takes its build with it.
    drop: (id) => forget(id),
    keepOnly(ids) {
      load();
      for (const k of Object.keys(st.k)) if (!ids.includes(k)) delete st.k[k];
      keep();
    },
  };
}
