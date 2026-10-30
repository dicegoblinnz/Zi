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
// With a crew (stage 6), after the board there's a screen for each character
// in the campaign: a friend and a foe among the factions, three cards each,
// each card that faction's thread toward the crew, named for them. Adding a
// faction, its ties take one thread toward the crew as well, named for
// someone who's still got no friend or no foe on the board, when there's
// one. The crew's the campaign's characters as this phone last saw it, and
// what's on the party sheet worth taking, which an agenda can be after.
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
// what was dealt it, and who each character's friend and foe is. Adding a
// faction, its ties go on the other factions' cards too, and it joins the
// record's added, with who it's tied to in the crew.
import { QUESTIONS, REGIONS, SIDES, SIZES, STEPS, canDeal, cardsOf, choose, crewKey, dealRest, fill, lock, newSeed, options, pickAt, pickKey, preview, recordOf, redeal, redealFaction, resume, setCrew, start, startAdd, tensionAt } from "./world-engine.js";
import { MAX, apply, readable, undoOf } from "./board.js";
import { PMAX, findPage } from "./pages.js";
import { die as kitDie, mini as kitMini, tag as kitTag } from "../kit/kit.js";
import { stepsToDice } from "./dice.js";
import { drawWeb, webOf } from "./world-web.js";
import { deckOn, deckOver, fixedBy, keptDeck, linesOf, makeAnswer, whoOnly } from "./world-answer.js";
import { BMAX } from "./world-record.js";

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
// The same words, whatever the apostrophes and spaces.
const sameWords = (a, b) => String(a ?? "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase() === String(b ?? "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
// Appendix B's asset by its name, the way the tables key one.
const keyOf = (name) => String(name ?? "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/^(a|an|the)-/, "");
// The asking and the ground, which the deck plays on. A change to them before
// the deck's first answer starts the deck again from them, when she gets back
// to it.
const isGround = (path) => /^(ask|tension|seat)(:|$)/.test(String(path ?? ""));
const unstart = (W, path) => {
  if (isGround(path) && W?.deck && !W.deck.finished && !W.deck.pos) W.deck = null;
};
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
const CHECKS = { whole: "a card with a hole in it", power: "Power that its people didn’t add up to", rival: "a faction with no rival", block: "a trade nobody was blocking", secret: "no Secret naming another faction", unique: "two factions holding the same asset", aims: "an agenda aimed at nothing", crew: "no faction after anything the crew’s got", strange: "nothing strange on the board" };
const FIXED = { whole: "to fill a hole in a card", power: "so its people add up to its Power", rival: "so every faction has a rival", block: "so there’s a trade to block", secret: "so a Secret names another faction", unique: "so no two factions hold the same asset", aims: "so its agenda aims at something", crew: "so a faction’s after something the crew’s got", strange: "so there’s something strange" };
const STEP_NAMES = { seat: "where it sits", size: "its size", type: "what it is", exc: "how it breaks the logic", method: "how it works", want: "its Want", res: "its resources", assets: "its assets", agenda: "its agenda", face: "its Face", secret: "its Secret", name: "its name" };
const SIDE_NAMES = { friend: "friend", foe: "foe" };

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
  // A tap-again is for one thing in one campaign.
  const sureOf = (kind, id) => ui.sure === `${kind}:${id}`;
  const arm = (kind, id) => {
    ui.sure = `${kind}:${id}`;
  };
  let slide = "";
  let moved = false;
  // Done, a moment ago: what takes it back off the board, and the build as it
  // was, so Undo on its note brings her back to it with everything she'd locked.
  let undone = null;
  let fresh = new Set();

  // ------------------------------------------------------------ the tables

  // Fetched once. If it can't be had (no signal and never seen), it says so
  // and tries again when the signal's back, never in a loop.
  function tables() {
    if (T) return T;
    loading ??= fetch("/world-tables.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((j) => {
        if (j?.core && j.packs) {
          T = j;
          failed = false;
        } else failed = true;
        d.quietRender();
      });
    return null;
  }
  addEventListener("online", () => {
    if (T || !failed) return;
    failed = false;
    loading = null;
    d.quietRender();
  });

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
  const entryOf = (id) => {
    const e = load().k[id] ?? null;
    if (e) e.id = id;
    return e;
  };
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
    if (!e) return false;
    // Nothing kept to take back since a reload, on the deck: its last answer.
    if (!s) {
      if (e.at !== "deck" || !A.undoLast(id)) return false;
      ui = { own: "", sure: "", roll: "" };
      keep();
      return true;
    }
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

  // Building by answering (world-answer.js): the deck, after the ground.
  const A = makeAnswer({
    d, esc, plural, entryOf, worldOf, save, snap, sureOf, arm,
    tables: () => T,
    setWorld: (id, W) => {
      live[id] = W;
    },
    unsnap: (id) => {
      undos[id]?.pop();
    },
    changed: (id, say, undoable) => changed(id, say, undoable),
    to: (id, key, dir) => to(id, key, dir),
  });

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
      // What a build dealt a line, found by its words as the card has them,
      // so the checks can see what it is. A line that's been changed since is
      // only its words, bar an asset named the way Appendix B names one.
      const seatName = k >= 0 ? dealt.seats?.[rec?.seat?.k]?.text : rec?.place?.text;
      const seat = seatName ? { text: seatName, name: true } : "";
      const dealtAs = (list, text) => (Array.isArray(list) ? list : []).find((x) => x?.text && sameWords(fill(x.text, { seat }), text)) ?? null;
      const book = (text) => T.book?.assets?.[keyOf(text)] ? keyOf(text) : null;
      return {
        name: f.name,
        about: f.about,
        res: f.res.map((r) => {
          const p = dealtAs(rec?.res, r.text);
          return { id: r.id, text: r.text, role: p?.role ?? null, tags: p?.tags ?? [] };
        }),
        assets: f.assets.filter((a) => !a.off).map((a) => {
          const p = dealtAs(rec?.assets, a.text);
          return { id: a.id, text: a.text, power: a.power, does: a.does, role: p?.role ?? book(a.text) };
        }),
        seat: at.has(pid) ? at.get(pid) : null,
        picks: rec,
      };
    });
    return { held, seats, ids: factions.map((f) => f.id), seatIds };
  }

  // The crew as this phone last saw the campaign: its characters, and what's
  // on its party sheet. Adding a faction, whether each of them has a friend
  // and a foe on the board already, by what the builds kept. A campaign this
  // phone's never seen leaves the crew as the build has it (null).
  function crewNow(id, doc, mode) {
    const camp = d.campaign(id);
    if (!camp || !Array.isArray(camp.players)) return null;
    const has = mode === "add" ? hasOf(doc) : null;
    const who = [];
    for (const p of camp.players) {
      const ch = p?.character;
      if (!ch || typeof ch !== "object" || !ch.id || !String(ch.name ?? "").trim()) continue;
      who.push({ k: ch.id, name: ch.name, ...(has ? { has: has[crewKey(ch.id)] ?? { friend: false, foe: false } } : {}) });
    }
    const sheet = d.partyIn?.(id) ?? null;
    return { who, res: sheet?.res ?? [], assets: sheet?.assets ?? [] };
  }
  function hasOf(doc) {
    const dealt = doc.build?.dealt && typeof doc.build.dealt === "object" ? doc.build.dealt : null;
    const out = {};
    if (!dealt) return out;
    const on = (fid) => Boolean(fid) && doc.factions.some((f) => f.id === fid);
    const ids = Array.isArray(dealt.ids) ? dealt.ids : [];
    const got = (k, side) => {
      (out[k] ??= { friend: false, foe: false })[side] = true;
    };
    for (const c of Array.isArray(dealt.crew?.who) ? dealt.crew.who : []) for (const side of SIDES) if (c?.k && Number.isInteger(c[side]?.j) && on(ids[c[side].j])) got(c.k, side);
    for (const a of Array.isArray(dealt.added) ? dealt.added : []) for (const t of Array.isArray(a?.crew) ? a.crew : []) if (t?.k && SIDES.includes(t.side) && on(a.fid)) got(t.k, t.side);
    // Every faction added that's been tied to one of them, longer than added keeps.
    for (const t of Array.isArray(dealt.ties) ? dealt.ties : []) if (t?.k && SIDES.includes(t.side) && on(t.fid)) got(t.k, t.side);
    return out;
  }
  // The crew as it is now, onto the world in progress. When it's changed,
  // the hands that read it (the agendas', and the crew's own) are dealt anew.
  function crewIn(id, W, mode) {
    const crew = W ? crewNow(id, docOf(id), mode) : null;
    if (!crew || !setCrew(T, W, crew)) return false;
    const e = entryOf(id);
    if (e?.hands) for (const k of Object.keys(e.hands)) if (k.endsWith(":agenda") || k.startsWith("crew:")) delete e.hands[k];
    return true;
  }

  // ------------------------------------------------------------ starting one

  function begin(id, mode) {
    load();
    const n = Math.max(4, Math.min(12, players(id) + 2));
    const e = { id, mode, setup: firstSetup(n), W: null, at: "setup", hands: {}, cut: [], saved: Date.now() };
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
        const W = startAdd(T, { recipe: mix.recipe, dials: mix.dials, seed: newSeed(T), held: held.held, seats: held.seats, asking: mix.asking, tension: mix.tension, crew: crewNow(id, doc, "add") });
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
      W = startAdd(T, { recipe, dials: b?.dials ?? null, seed: newSeed(T), held: held.held, seats: held.seats, asking: b?.dealt?.asking ?? null, tension: b?.dealt?.tension ?? null, crew: crewNow(id, doc, "add") });
    } else W = start(T, { recipe, seed: newSeed(T), factions: e.setup.n, crew: crewNow(id, docOf(id), "world") });
    live[id] = W;
    e.W = recordOf(W);
    e.hands = {};
    e.cut = [];
    return W;
  }
  // The founding's asking (found.js), carried into Build the world: its mix
  // and its factions, with the crew's answers on and locked, so she carries
  // on from the ground. It deals from a seed of its own, never the room's,
  // which every player had, so nobody can deal her factions and Secrets for
  // themselves. Whatever build was on the go for the campaign on this phone goes.
  function fromFound(id, f) {
    if (!T || !f?.recipe || !canDeal(T, f.recipe)) return false;
    const recipe = { region: f.recipe.region, era: f.recipe.era, twist: f.recipe.twist ?? null };
    const e = begin(id, "world");
    e.setup = { ...e.setup, region: recipe.region, ...genreOf(recipe), n: f.n };
    let W;
    try {
      W = start(T, { recipe, seed: newSeed(T), factions: f.n, crew: crewNow(id, docOf(id), "world") });
    } catch {
      forget(id);
      return false;
    }
    const as = (p) => (p.own ? { own: true, text: p.text } : { id: p.id, text: p.text, tags: p.tags ?? [], dials: p.dials ?? {}, strange: p.strange === true, why: "", ...(p.roll ? { roll: p.roll } : {}) });
    for (const q of QUESTIONS) {
      if (!f.asking?.[q]) continue;
      choose(T, W, `ask:${q}`, as(f.asking[q]));
      lock(W, `ask:${q}`);
    }
    if (f.tension) {
      choose(T, W, "tension", as(f.tension));
      lock(W, "tension");
    }
    live[id] = W;
    e.W = recordOf(W);
    e.at = "seat:0";
    e.found = f.id;
    keep();
    return true;
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
    const ground = ["setup", ...ASKING, ...Array.from({ length: W.s }, (_, k) => `seat:${k}`), "deck"];
    // While the deck's on, the factions are what it's forming, so their
    // screens and the board come once it's done.
    if (deckOn(W)) return ground;
    return [...ground, ...Array.from({ length: W.n }, (_, i) => PARTS.map(([p]) => `f:${i}:${p}`)).flat(), "board", ...crewScreens(W)];
  }
  // Next and Back: with a deck played, the board's straight after it, and
  // the factions' screens are a tap from the board.
  function nextOf(e, W, key) {
    const list = screensOf(e, W);
    if (key === "deck" && deckOver(W)) return "board";
    return list[list.indexOf(key) + 1];
  }
  function backOf(e, W, key) {
    const list = screensOf(e, W);
    if (key === "board" && e.mode === "world" && W?.deck) return "deck";
    return list[list.indexOf(key) - 1];
  }
  // A screen for each character in the crew, after the board.
  const crewScreens = (W) => (W?.add ? [] : (W?.crew?.who ?? []).map((c) => `crew:${c.k}`));
  const crewAt = (W, key) => (key?.startsWith("crew:") ? W?.crew?.who?.find((c) => c.k === key.slice(5)) ?? null : null);
  const stageOf = (key) => (key === "setup" ? 0 : key === "board" ? 4 : key.startsWith("crew:") ? 5 : key.startsWith("seat:") ? 2 : key.startsWith("f:") || key === "deck" ? 3 : 1);
  const STAGES = ["Set up", "The asking", "The ground", "The factions", "The board"];
  const stagesOf = (e, W) => (e.mode === "add" ? ADD_STAGES : crewScreens(W).length ? [...STAGES, "The crew"] : STAGES);
  const ADD_STAGES = ["The mix", ...PARTS.map(([, name]) => name), "Its ties"];
  const addStage = (key) => (key === "setup" ? 0 : key === "board" ? 5 : Number(key.split(":")[2]));
  function screenName(e, W, C, key) {
    if (key === "setup") return e.mode === "add" ? "The mix" : "Set up";
    if (key === "board") return e.mode === "add" ? "Its ties" : "The board";
    if (key.startsWith("crew:")) return crewAt(W, key)?.name ?? "The crew";
    if (key === "deck") return W && !W.deck && !whoOnly(W) ? "The factions" : "The deck";
    if (ASK[key]) return ASK[key].short;
    if (key.startsWith("seat:")) return `Seat ${Number(key.split(":")[1]) + 1}`;
    const [, i, p] = key.split(":");
    const part = PARTS[Number(p) - 1][1];
    return e.mode === "add" ? part : `${C?.factions[Number(i)]?.name || `Faction ${Number(i) + 1}`}: ${part.charAt(0).toLowerCase()}${part.slice(1)}`;
  }

  // Arriving at a screen deals whatever it needs that isn't dealt yet, in the
  // engine's order.
  const holes = (W) => (!W.add && (QUESTIONS.some((q) => !W.asking[q]) || !W.tension)) || W.seats.some((s) => !s) || W.factions.some((f) => !f.held && STEPS.some((s) => (s === "exc" ? f.exc === undefined : f[s] == null)));
  // A character still without a friend or a foe, bar one she's locked empty.
  const crewHoles = (W) => !W.add && (W.crew?.who ?? []).some((c) => SIDES.some((side) => !c[side] && !W.locks[`crew:${c.k}:${side}`]));
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
    } else if (key === "deck") {
      for (const k of ASKING) deal(k);
      for (let k = 0; k < W.s; k++) deal(`seat:${k}`);
      if (A.ready(W)) did = true;
    } else if (key.startsWith("f:")) {
      if (holes(W)) {
        dealRest(T, W, { finish: false });
        did = true;
      }
    } else if ((key === "board" || key.startsWith("crew:")) && (holes(W) || !W.checks || crewHoles(W))) {
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
    // A friend's card is gold down its side and a foe's ember, like their threads.
    const kind = path.startsWith("crew:") ? (path.endsWith(":foe") ? " is-hostile" : " is-bond") : "";
    return `<button type="button" class="wk-card${kind}${on ? " is-on" : ""}" data-act="w" data-do="mk-pick" data-p="${esc(path)}" data-c="${i}" aria-pressed="${on}">${inner}</button>`;
  }
  function cardInner(W, path, c, C) {
    const v = preview(T, W, path, c);
    if (!v) return "";
    const [head, , b] = path.split(":");
    const top = marks(v);
    if (head === "ask" || head === "tension") return `<span class="wk-card-w">${esc(v.text)}</span>${nudges(v.dials) || top ? `<span class="wk-card-m">${nudges(v.dials)}${top}</span>` : ""}${why(v)}`;
    if (head === "crew") {
      const mine = marks({ ...v, again: false });
      return `<span class="wk-card-n">${esc(v.name)}</span><em class="wk-card-t">${esc(v.text)}</em>${mine ? `<span class="wk-card-m">${mine}</span>` : ""}${why(v)}`;
    }
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
    // The deck's playing on the asking and the ground, so only what's on stays.
    if (isGround(path) && fixedBy(W)) {
      const on = h.find((c) => pickKey(c) === cur) ?? pickAt(W, path);
      return `<section class="wk-step is-fixed" aria-labelledby="${hid}"><div class="wk-step-h"><h2 id="${hid}">${title}</h2></div>${sub}
        <div class="wk-hand">${on ? `<div class="wk-card is-static is-on">${cardInner(W, path, on, C)}</div>` : ""}</div>${note}</section>`;
    }
    const cards = h.map((c, i) => card(path, c, i, pickKey(c) === cur, cardInner(W, path, c, C))).join("");
    const isFresh = fresh.has(path) ? " is-fresh" : "";
    return `<section class="wk-step${locked ? " is-locked" : ""}${isFresh}" aria-labelledby="${hid}">
      <div class="wk-step-h"><h2 id="${hid}">${title}</h2>${locked ? '<span class="wk-locked">Locked</span>' : ""}</div>${sub}
      <div class="wk-hand${path.endsWith(":size") ? " is-row" : ""}" role="group" aria-labelledby="${hid}">${cards || '<p class="cc-small">Nothing on the tables fits here, so write your own.</p>'}</div>${note}
      ${tools(path, { locked, own, again })}${ui.own === ownKey(path) ? ownForm(W, path) : ""}</section>`;
  }
  function tools(path, { locked, own = true, again = "Deal again", extra = "" }) {
    return `<div class="wk-tools">
      <button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>Lock</span></button>
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
    else if (head === "crew") {
      // Which faction, and the words, named for them the way the tables write it.
      const c = W.crew?.who?.find((x) => x.k === path.split(":")[1]);
      const C = cardsOf(T, W);
      const other = c?.[b === "foe" ? "friend" : "foe"]?.j;
      const at = cur?.j ?? W.factions.findIndex((f, j) => !f.held && j !== other);
      const opts = W.factions.map((f, j) => (f.held ? "" : `<option value="${j}"${j === at ? " selected" : ""}>${esc(C.factions[j]?.name || `Faction ${j + 1}`)}</option>`)).join("");
      const like = b === "foe" ? `like ${c?.name ?? "Vesk"} still owes us for the boat` : `like ${c?.name ?? "Vesk"} got our boy out of the cells`;
      body = `<label class="cc-field">Which faction <select name="j">${opts}</select></label>${field("text", b === "foe" ? "What it holds against them" : "What it owes them", was?.text, MAX.line, ` required placeholder="${esc(like)}"`)}`;
    }
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
    const stages = stagesOf(e, W);
    const now = e.mode === "add" ? addStage(key) : stageOf(key);
    const bars = stages.map((s, k) => `<li${k < now ? ' class="done"' : k === now ? ' class="on"' : ""}></li>`).join("");
    let kicker = e.mode === "add" ? "Adding a faction" : "Building the world";
    let title = "";
    let lead = "";
    if (key === "setup") {
      title = e.mode === "add" ? "Add a faction" : "Build the world";
      lead = e.mode === "add" ? setupLead(e, W) : "Pick where it’s set and what kind of world it is. The tables deal the asking and the ground three cards at a time, then you answer a deck of moments from before the crew turned up, and the factions come out of how you answer.";
    } else if (ASK[key]) {
      kicker = `${kicker} · The asking`;
      title = ASK[key].h;
      lead = key === "tension" ? "Roll the d12 on the book’s tension table, or tap in a roll of your own dice." : key === "ask:holds" ? "Three answers off Building Your World’s tables, or write your own. Each answer sets how tense, strange, rich and ruled it is, and steers what’s dealt after it." : "Pick one of the three, or write your own.";
    } else if (key.startsWith("seat:")) {
      const k = Number(key.split(":")[1]);
      kicker = `The ground · Seat ${k + 1} of ${W.s}`;
      title = "The ground";
      lead = k === 0 ? `The places the factions sit, what each one lives off and what a stranger notices there. There are two more than factions, so there’s always one worth fighting over.` : "Pick one of the three, write your own, or deal again.";
    } else if (key === "deck") {
      const h = A.headOf(W);
      kicker = esc(h.kicker);
      title = esc(h.title);
      lead = h.lead;
    } else if (key.startsWith("f:")) {
      const [, i, p] = key.split(":").map(Number);
      kicker = e.mode === "add" ? `Adding a faction · ${PARTS[p - 1][1]}` : `Faction ${i + 1} of ${W.n} · ${PARTS[p - 1][1]}`;
      title = esc(C.factions[i]?.name || `Faction ${i + 1}`);
      lead = PARTS[p - 1][2];
    } else if (key === "board") {
      kicker = e.mode === "add" ? "Adding a faction · Its ties" : "Building the world · The board";
      title = e.mode === "add" ? "Its ties" : "The board";
      lead = e.mode === "add" ? `Its rival, and its ally or debt, among the factions already on the board, written on both cards${W.crew?.who?.length ? ", and a thread toward the crew" : ""}. Swipe one away to leave it off.` : "Everything the tables dealt, before anyone sees it. Tap a faction to go through it again. Nothing shows on your players’ phones till you show it to them.";
    } else if (key.startsWith("crew:")) {
      const all = crewScreens(W);
      kicker = `The crew · ${all.indexOf(key) + 1} of ${all.length}`;
      title = esc(crewAt(W, key)?.name ?? "");
      lead = all.indexOf(key) === 0 ? "Everyone in the crew gets a friend and a foe among the factions. Each one’s that faction’s thread toward the crew, named for them, so it counts toward how the faction sees the crew." : "A friend and a foe among the factions. Pick one of three, deal again or write your own.";
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
    const next = W ? nextOf(e, W, key) : list[at + 1];
    const back = at > 0 ? `<button type="button" class="button bd-back" data-act="w" data-do="mk-back">Back</button>` : "";
    let go;
    if (key === "deck" && deckOn(W)) {
      go = A.go(e.id, W);
    } else if (key === "setup") {
      const moved = setupMoved(e, W);
      const ok = dealsSetup(e.setup);
      const label = W && moved ? (sureOf("restart", e.id) ? "Tap again to start again" : "Deal a new one") : W ? "Carry on" : "Deal it";
      const small = W && moved ? "What you’ve dealt goes" : e.mode === "add" ? "Where it sits" : "The asking";
      go = `<button type="button" class="button primary bd-next" data-act="w" data-do="mk-next"${ok ? "" : " disabled"}><span>${label}</span><small>${small}</small></button>`;
    } else if (!next) {
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
    const here = (k) => (e.mode === "add" ? k === key : k.startsWith("f:") ? key.startsWith(k.slice(0, -1)) : k === "ask:holds" ? stageOf(key) === 1 : k === "seat:0" ? stageOf(key) === 2 : k.startsWith("crew:") ? stageOf(key) === 5 : k === key);
    const row = (k, label) => `<li><button type="button" class="bd-dot${here(k) ? " is-now" : ""}" data-act="w" data-do="mk-go" data-s="${esc(k)}"${here(k) ? ' aria-current="step"' : ""}><span class="n">${rows.length + 1}</span><span>${esc(label)}</span></button></li>`;
    if (e.mode === "add") for (const k of list) rows.push(row(k, screenName(e, W, C, k)));
    else {
      rows.push(row("setup", "Set up"));
      if (W) {
        rows.push(row("ask:holds", "The asking"));
        rows.push(row("seat:0", "The ground"));
        rows.push(row("deck", "The deck"));
        if (list.includes("board")) {
          for (let i = 0; i < W.n; i++) rows.push(row(`f:${i}:1`, C.factions[i]?.name || `Faction ${i + 1}`));
          rows.push(row("board", "The board"));
          if (crewScreens(W).length) rows.push(row(crewScreens(W)[0], "The crew"));
        }
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
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="mk-all"${dealsSetup(s) ? "" : " disabled"}>${moved && W ? (sureOf("all", id) ? "Tap again to deal a new one" : "Deal a new one, all of it") : "Deal it all"}</button></div></section>`;
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
      const fixed = fixedBy(W) > 0;
      return `<section class="wk-step wk-tension${fresh.has("tension") ? " is-fresh" : ""}${fixed ? " is-fixed" : ""}" aria-labelledby="wk-tension"><div class="wk-step-h"><h2 id="wk-tension">The tension</h2>${locked && !fixed ? '<span class="wk-locked">Locked</span>' : ""}</div>
        <div class="wk-tension-in card">${roll ? kitDie(12, { own: "them", face: roll, label: `The d12 came up ${roll}` }) : `<span class="wk-yours">Yours</span>`}<div><p class="wk-card-w">${esc(t?.text ?? "")}</p>${t ? `<p class="wk-card-m">${nudges(t.dials)}</p>` : ""}</div></div>
        ${fixed ? "" : `${tools("tension", { locked, again: "Roll again", extra: `<button type="button" class="button sm wk-tool" data-act="w" data-do="mk-tap" aria-expanded="${ui.roll === "tension"}"${locked ? " disabled" : ""}>${kitMini(12, { own: "them" })}<span>Tap in a roll</span></button>` })}${tap}${ui.own === ownKey("tension") ? ownForm(W, "tension") : ""}`}</section>${dials(W)}`;
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
      <div class="wk-tools"><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>Lock</span></button>
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
      <div class="wk-tools"><button type="button" class="button sm wk-tool" data-act="w" data-do="mk-lock" data-p="${esc(path)}" aria-pressed="${locked}">${ICON.lock}<span>Lock</span></button>
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

  // The asking and the ground while the deck's playing on them: they stay as
  // they are, unless she starts the deck again.
  function fixedNote(id, W) {
    const n = fixedBy(W);
    const sure = sureOf("restart-deck", id);
    const said = deckOn(W) ? `You’ve answered ${plural(n, "card", "cards")} of the deck, and ${n === 1 ? "it’s" : "they’re"} playing on these, so they stay as they are while it’s on.` : `The deck’s ${plural(n, "card was", "cards were")} played on these, so they stay as they are.`;
    return `<div class="cc-note wk-fixed" role="note"><p>${said} To change them, start the deck again, and your answers go.</p>
      <div class="cc-row"><button type="button" class="button${sure ? " danger" : ""}" data-act="w" data-do="mk-restart">${sure ? "Tap again to start it again" : "Start the deck again"}</button><button type="button" class="button" data-act="w" data-do="mk-go" data-s="deck">Back to the deck</button></div></div>`;
  }

  // What Done does, on the screen that has it, or what's still to come.
  function doneNote(e, W, list, key) {
    if (key !== "board" && list[list.length - 1] !== key) return "";
    if (list[list.length - 1] !== key) {
      const names = (W.crew?.who ?? []).map((c) => c.name);
      return `<p class="cc-small wk-done-note">Next, a friend and a foe among these factions for ${esc(names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0] ?? "the crew")}.</p>`;
    }
    return `<p class="cc-small wk-done-note">${e.mode === "add" ? "It goes on the board hidden from the crew" : `${plural(W.n, "faction", "factions")} go on the board and ${plural(W.s, "seat goes", "seats go")} in as places`}, all hidden from the crew till you show them.</p>`;
  }

  // A character's friend and foe, three cards each.
  function crewBody(id, e, W, C, key, list) {
    const c = crewAt(W, key);
    if (!c) return "";
    const p = (d.campaign(id)?.players ?? []).find((x) => x?.character?.id != null && crewKey(x.character.id) === c.k);
    let crest = "";
    try {
      const sheet = p?.character?.state ? d.normal?.(structuredClone(p.character)) : null;
      crest = sheet ? d.crest?.((sheet.titles ?? []).map((t) => t.archetype).filter(Boolean)) ?? "" : "";
    } catch {
      crest = "";
    }
    const who = `<div class="wk-who card">${crest ? `<span class="wk-who-crest" aria-hidden="true">${crest}</span>` : ""}<div class="wk-who-in"><p class="wb-k">${p?.name ? `Played by ${esc(p.name)}` : "In the crew"}</p><p class="wk-who-n">${esc(c.name)}</p></div></div>`;
    // A side the deck made is what happened, so it's locked, and the screen only deals the other.
    const made = (side) => (c[side]?.made != null && W.locks[`crew:${c.k}:${side}`] ? `<p class="cc-small wk-note wk-made">Card ${c[side].made + 1} of the deck made this one, so it’s locked. Unlock it to deal it again.</p>` : "");
    const friend = step(e, W, C, `crew:${c.k}:friend`, "A friend", { note: `${made("friend")}<p class="cc-small wk-note">That’s a bond thread toward the crew, and it counts toward the faction being friendly.</p>` });
    const foe = step(e, W, C, `crew:${c.k}:foe`, "A foe", { note: `${made("foe")}<p class="cc-small wk-note">That’s a hostile thread toward the crew, and it counts toward the faction being hostile.</p>` });
    return `${who}${friend}${foe}${doneNote(e, W, list, key)}`;
  }

  function boardBody(id, e, W, C, list) {
    const fac = (i) => C.factions[i];
    const name = (i) => esc(fac(i)?.name || `Faction ${i + 1}`);
    // A mini faction a deck's answer made, under its maker: it's got no
    // screens of its own, so it's a card to read.
    const miniTok = (m) => `<li class="wb-tok is-mini"><div class="card wb-tok-a wk-tok is-static"><span class="wb-tok-die">${kitDie(m.die, { own: "them", hide: true })}</span><span class="wb-tok-in"><span class="wb-k">Mini faction of ${name(m.parent)}</span><b class="wb-tok-n">${esc(m.name)}</b>${m.assets[0] ? `<span class="wb-tok-w">${esc(m.assets[0].text)}</span>` : ""}</span></div></li>`;
    const toks = e.mode === "add" ? "" : `<section class="wk-sec" aria-labelledby="wk-facs"><h2 id="wk-facs">The factions</h2><ul class="wb-toks">${C.factions.map((f, i) => `<li class="wb-tok"><button type="button" class="card wb-tok-a wk-tok" data-act="w" data-do="mk-go" data-s="f:${i}:1">
      <span class="wb-tok-die">${f.die ? kitDie(f.die, { own: "them", hide: true }) : ""}</span><span class="wb-tok-in"><span class="wb-k">${esc(cap(f.size ?? ""))}${f.die ? ` · d${f.die}` : ""}</span><b class="wb-tok-n">${esc(f.name)}</b>${f.want ? `<span class="wb-tok-w">${esc(f.want)}</span>` : ""}</span></button></li>${(C.minis ?? []).filter((m) => m.parent === i).map(miniTok).join("")}`).join("")}</ul></section>`;
    // Built by answering: How it came to be is a step back, and it goes on hidden.
    const told = e.mode !== "add" && W.deck ? linesOf(T, W) : [];
    const story = told.length ? `<section class="wk-sec" aria-labelledby="wk-story"><h2 id="wk-story">How it came to be</h2>
      <p class="cc-small">${plural(told.length, "line", "lines")} from the deck, all hidden from the crew till you show them an age at a time on the World screen.${told.some((l) => l.hers) ? ` ${plural(told.filter((l) => l.hers).length, "line made a Secret, so it stays", "lines made Secrets, so they stay")} on your phone.` : ""}</p>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="mk-go" data-s="deck">Read it</button></div></section>` : "";
    const web = (W.web ?? []).map((t) => {
      const key = `w:${t.a}-${t.b}`;
      const one = fac(t.a)?.threads.find((x) => x.tie === key);
      const two = t.kind === "wildcard" ? null : fac(t.b)?.threads.find((x) => x.tie === key);
      const kind = t.kind === "rival" ? "Rivals" : t.kind === "ally" ? "Allies" : t.kind === "debt" ? "A debt" : one?.kind === "hostile" ? "A grudge" : "A favour";
      const inner = `<span class="wk-tie-k">${kind}: ${name(t.a)} and ${name(t.b)}</span>${one ? `<span class="wk-tie-l"><b>${name(t.a)}</b> <em>${esc(one.text)}</em></span>` : ""}${two ? `<span class="wk-tie-l"><b>${name(t.b)}</b> <em>${esc(two.text)}</em></span>` : ""}`;
      return tie(e, key, inner, one?.kind ?? "bond");
    }).join("");
    // Adding a faction, its thread toward the crew, named for one of them.
    const crewTies = e.mode !== "add" ? "" : C.factions.flatMap((f, i) => f.threads.filter((t) => t.to === "crew" && t.tie).map((t) => {
      const c = W.crew?.who?.find((x) => x.k === t.who);
      const inner = `<span class="wk-tie-k">${esc(cap(whose(c?.name ?? "the crew")))} ${t.side === "foe" ? "foe" : "friend"}</span><span class="wk-tie-l"><b>${name(i)}</b> <em>${esc(t.text)}</em></span>`;
      return tie(e, t.tie, inner, t.kind);
    })).join("");
    const needs = (W.needs ?? []).map((n) => {
      const key = `n:${n.i}`;
      const block = n.by != null ? fac(n.by)?.threads.find((x) => x.tie === key) : null;
      const asset = fac(n.i)?.assets.find((a) => a.off);
      const inner = `<span class="wk-tie-k">A need: ${name(n.i)}</span><span class="wk-tie-l"><b>${esc(asset?.text ?? "")}</b>, with nothing paying for it</span>${block ? `<span class="wk-tie-l"><b>${name(n.by)}</b>, with one to spare: <em>${esc(block.text)}</em></span>` : ""}`;
      return block ? tie(e, key, inner, "hostile") : `<li class="wk-tie is-need"><div class="wk-tie-in">${inner}</div></li>`;
    }).join("");
    // The web as it'll be on the board, bar what she's left off: a faction's
    // a tap from its screens, and the crew from theirs.
    let ring = "";
    if (e.mode !== "add" && C.factions.length > 1) {
      const nodes = [...C.factions.map((f, i) => ({ id: `f${i}`, name: f.name || `Faction ${i + 1}`, dice: f.die ? [f.die] : null })), ...(C.minis ?? []).map((m, k) => ({ id: `m${k}`, name: m.name, dice: [m.die], mini: true, parent: `f${m.parent}` }))];
      const threads = C.factions.flatMap((f, i) => f.threads.filter((t) => !(t.tie && e.cut.includes(t.tie))).map((t) => ({ from: `f${i}`, to: t.to === "crew" ? "crew" : `f${t.to}`, kind: t.kind, s: "whole", text: t.text })));
      const crew = crewScreens(W)[0];
      const c = d.crewIn(id);
      ring = `<div class="ww wk-ww">${drawWeb(webOf(nodes, threads), {
        esc,
        uid: "wk",
        attrs: (n) => (n === "crew" ? (crew ? `data-act="w" data-do="mk-go" data-s="${esc(crew)}"` : "disabled") : n.startsWith("m") ? "disabled" : `data-act="w" data-do="mk-go" data-s="f:${n.slice(1)}:1"`),
        label: (nd) => (nd.mini ? `${nd.name}, a mini faction` : `${nd.name}, go through it again`),
        crew: { name: c.name || "The crew", dice: stepsToDice(c.steps), label: crew ? "The crew, a friend and a foe for each of them" : c.name || "The crew" },
      })}</div>`;
    }
    const failed = (W.checks ?? []).filter((c) => !c.ok);
    const fixes = [...new Map((W.fixes ?? []).filter((x) => x.path?.startsWith("f:")).map((x) => [x.path, x])).values()].map((x) => {
      const [, i, s] = x.path.split(":");
      const who = fac(Number(i))?.name || `Faction ${Number(i) + 1}`;
      return `${esc(STEP_NAMES[s] ? `${cap(whose(who))} ${STEP_NAMES[s].replace(/^its /, "")}` : who)} ${FIXED[x.k] ?? ""}`;
    });
    const fall = (W.fallbacks ?? []).length;
    const checks = `<section class="wk-sec" aria-labelledby="wk-checks"><h2 id="wk-checks">The checks</h2>
      <p class="${failed.length ? "cc-note is-warn" : "cc-small"}">${failed.length ? `Still to sort out: ${esc(failed.map((c) => CHECKS[c.k] ?? c.k).join(", "))}. Whatever you’ve locked or written yourself, the checks leave alone.` : e.mode === "add" ? "Its card adds up, it’s got a rival, and everything it’s after is on the board." : `Every faction’s card adds up and has a rival${W.crew ? ", everything it’s after is on the board or the crew’s, and at least one of them’s after something the crew’s got" : ", and everything it’s after is on the board"}.`}</p>
      ${fixes.length ? `<p class="cc-small">Dealt again for them: ${fixes.join(", ")}.</p>` : ""}${fall ? `<p class="cc-small">${plural(fall, "line", "lines")} from the core tables went in where three deals weren’t enough.</p>` : ""}</section>`;
    const say = w.status(id);
    return `${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${toks}
      ${web || crewTies ? (e.mode === "add" ? `<section class="wk-sec" aria-label="Its ties"><ul class="wk-ties">${web}${crewTies}</ul></section>` : `<section class="wk-sec" aria-labelledby="wk-web"><h2 id="wk-web">The web</h2>${ring}<p class="cc-small wk-note">Who’s at whose throat, and who owes whom. Swipe one away to leave it off.</p><ul class="wk-ties">${web}</ul></section>`) : ""}
      ${needs ? `<section class="wk-sec" aria-labelledby="wk-needs"><h2 id="wk-needs">Who needs what</h2><ul class="wk-ties">${needs}</ul></section>` : ""}${checks}${story}
      ${doneNote(e, W, list, "board")}`;
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
        <div class="cc-row"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=${e.mode}" data-act="w" data-do="nav">Carry on</a><button type="button" class="button" data-act="w" data-do="mk-drop-build">${sureOf("drop-build", id) ? "Tap again to drop it" : "Drop it"}</button></div></div></div>`;
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
    // The crew as this phone last saw the campaign: someone who's joined since
    // gets a screen, and someone who's left takes theirs with them.
    if (W && crewIn(id, W, e.mode)) save(id);
    let list = screensOf(e, W);
    if (!list.includes(e.at)) e.at = e.at?.startsWith("crew:") && list.includes("board") ? "board" : deckOn(W) && list.includes("deck") ? "deck" : list[0];
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
    else if (key === "deck") body = A.body(id, e, W);
    else if (key.startsWith("f:")) body = factionBody(e, W, C, key);
    else if (key.startsWith("crew:")) body = crewBody(id, e, W, C, key, list);
    else body = boardBody(id, e, W, C, list);
    if (W && (ASK[key] || key.startsWith("seat:")) && fixedBy(W)) body = `${fixedNote(id, W)}${body}`;
    const rest = W && key !== "board" && key !== "setup" && key !== "deck" && !key.startsWith("crew:") && !fixedBy(W) ? `<div class="wk-rest"><button type="button" class="button" data-act="w" data-do="mk-rest">Deal the rest</button><p class="cc-small">Deals whatever’s still to deal and takes you to the board.</p></div>` : "";
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
    ui.sure = "";
    A.reset();
    slide = dir;
    keep();
    d.render();
    top();
  }
  function changed(id, say = "", undoable = true) {
    // A change anywhere but the crew's screens deals the crew's hands anew,
    // since a card there reads its faction.
    const e = entryOf(id);
    if (e?.hands && !e.at?.startsWith("crew:")) for (const k of Object.keys(e.hands)) if (k.startsWith("crew:")) delete e.hands[k];
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
    if (head === "seat" && !W.factions.some((f) => !f.held && f.seat)) return [];
    // Till they're dealt past who's who (the deck plays on that), a new seat
    // deals who's who again on it, and nothing past it.
    if (head === "seat" && whoOnly(W)) {
      A.dealWho(W);
      return [];
    }
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
      if (!sureOf("drop-build", id)) {
        arm("drop-build", id);
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
        A.reset();
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
          if (!sureOf("restart", id)) {
            arm("restart", id);
            return d.render();
          }
          snap(id);
        }
        ui.sure = "";
        if (!W || setupMoved(e, W)) W = startWorld(id);
        if (!W) return;
        save(id);
      }
      const next = W ? nextOf(e, W, e.at) : null;
      if (next) to(id, next, "next");
    },
    "mk-back": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const back = W ? backOf(e, W, e.at) : null;
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
      if (W && setupMoved(e, W) && !sureOf("all", id)) {
        arm("all", id);
        return d.render();
      }
      snap(id);
      ui.sure = "";
      if (!W || setupMoved(e, W)) W = startWorld(id);
      if (!W) return;
      // A deck that's been answered ends there, and one that hasn't goes.
      if (deckOn(W) && W.deck.pos) A.end(W);
      else {
        if (deckOn(W)) W.deck = null;
        dealRest(T, W);
      }
      e.at = "board";
      slide = "next";
      moved = true;
      changed(id, `Dealt all ${plural(W.n, "faction", "factions")}. Go through them, lock what you like and deal the rest again.`);
    },
    "mk-rest": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      if (!e || !W) return;
      // On the deck it ends the deck there, so it's a tap again.
      if (deckOn(W) && e.at === "deck" && !sureOf("rest", id)) {
        arm("rest", id);
        return d.render();
      }
      snap(id);
      const answered = deckOn(W) && W.deck.pos;
      if (answered) A.end(W);
      else {
        if (deckOn(W)) W.deck = null;
        dealRest(T, W);
      }
      e.at = "board";
      slide = "next";
      moved = true;
      changed(id, answered ? `That’s the deck, at ${plural(W.deck.cards.length, "card", "cards")}, and the rest’s dealt to fit what your answers made.` : "Dealt the rest.");
    },
    "mk-pick": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!e || !W || !path) return;
      const c = e.hands[path]?.[Number(el.dataset.c)];
      if (c == null || pickKey(c) === pickKey(pickAt(W, path))) return;
      if (isGround(path) && fixedBy(W)) return;
      snap(id);
      unstart(W, path);
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
      const again = refit(id, W, `f:${i}:seat`);
      changed(id, again.length ? `Dealt again to fit: ${again.map((x) => STEP_NAMES[x]).slice(0, 3).join(", ")}${again.length > 3 ? " and the rest" : ""}. Lock a card to keep it.` : "");
    },
    "mk-lock": (el, id) => {
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!W || !path || (isGround(path) && fixedBy(W))) return;
      snap(id);
      lock(W, path, !W.locks[path]);
      changed(id);
    },
    "mk-again": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      const path = el.dataset.p;
      if (!e || !W || !path || W.locks[path] || (isGround(path) && fixedBy(W))) return;
      snap(id);
      unstart(W, path);
      delete e.hands[path];
      redeal(T, W, path, { rest: false });
      fresh.add(path);
      const again = refit(id, W, path);
      const set = /:(res|assets)$/.test(path);
      changed(id, `${path === "tension" ? "Rolled again." : set ? "Dealt again." : "Three new cards."}${again.length ? ` What comes after it’s dealt again to fit.` : ""}`);
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
      changed(id, `Dealt ${inline(cardsOf(T, W).factions[i]?.name ?? "it")} again, bar what you’d locked or written.`);
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
      if (!W || !t || fixedBy(W)) return;
      snap(id);
      unstart(W, "tension");
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
      changed(id, `Off its card: ${list[k].text}. The rest of the card stays as it is, and the set’s locked.`);
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
  Object.assign(ACT, A.ACT);

  function submit(kind, form, f, id) {
    if (A.submit(kind, form, f, id)) return;
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
    else if (head === "crew") {
      const j = Number(f.get("j"));
      if (!Number.isInteger(j) || !W.factions[j] || W.factions[j].held) return;
      pick = { own: true, j, text: text("text") };
    } else pick = { own: true, text: text("text") };
    if (!pick.text && !pick.size) return d.toast("Write something in first.", false);
    if (isGround(path) && fixedBy(W)) return;
    snap(id);
    unstart(W, path);
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
    if (deckOn(W)) A.end(W);
    if (holes(W) || !W.checks || crewHoles(W)) dealRest(T, W);
    const C = cardsOf(T, W);
    const doc = docOf(id);
    const cut = new Set(e.cut);
    const room = MAX.factions - doc.factions.length;
    const mine = W.factions.map((f, i) => (f.held ? null : i)).filter((i) => i !== null);
    // The mini factions the deck's answers made, each under its maker.
    const minis = W.add ? [] : C.minis ?? [];
    if (mine.length + minis.length > room) return d.toast(`The board holds ${MAX.factions} factions, and that’s more than it’s got room for.`, false);
    const fid = W.factions.map((f, i) => (f.held ? e.ids?.[i] ?? null : newId()));
    const mid = minis.map(() => newId());
    // The seats: each a place of its own, bar the ones on the board already.
    const pid = W.seats.map((s, k) => (W.add && k < W.hs ? e.seats?.[k] ?? null : s ? newId() : null));
    const used = new Set(W.factions.map((f) => f.seat?.k));
    const ops = [];
    const cutOf = (t) => Boolean(t.tie && cut.has(t.tie));
    // A thread toward a faction that's gone from the board since doesn't go
    // on. One toward the crew always does.
    const there = (j) => j === "crew" || (Boolean(fid[j]) && (!W.factions[j].held || doc.factions.some((f) => f.id === fid[j])));
    const line = (x) => ({ ...x, id: newId() });
    for (const i of mine) {
      const c = C.factions[i];
      const threads = c.threads.filter((t) => !cutOf(t) && there(t.to)).map((t) => line({ text: t.text, kind: t.kind, s: "whole", to: t.to === "crew" ? "crew" : fid[t.to] }));
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
    minis.forEach((m, k) => {
      if (!fid[m.parent]) return;
      ops.push({
        o: "new",
        f: {
          id: mid[k],
          name: m.name,
          about: "",
          want: "",
          face: "",
          secret: "",
          more: "",
          note: "",
          mini: true,
          parent: fid[m.parent],
          outs: m.outs,
          res: m.res.map((r) => line({ text: r.text, x: 1, left: 1 })),
          assets: m.assets.map((a) => line({ text: a.text, does: a.does, power: a.power, x: 1, left: 1, off: false })),
          agendas: [],
          pub: [],
          mor: [],
          loy: m.loy.map((t) => line({ text: t.text, kind: t.kind === "hostile" ? "hostile" : "bond", s: "whole" })),
          threads: [],
          shown: {},
        },
      });
    });
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
        // Who in the crew it's tied to, so the next faction added knows who's still without.
        const crew = C.factions[i].threads.filter((t) => t.to === "crew" && t.who && !cutOf(t)).map((t) => ({ k: t.who, side: t.side }));
        added.push({ ...f, fid: fid[i], pid: k != null ? pid[k] : null, place: k != null && k >= W.hs ? rec.seats[k] : null, crew });
      }
      dealt.added = added.slice(-12);
      dealt.ties = [...(Array.isArray(dealt.ties) ? dealt.ties : []), ...mine.flatMap((i) => C.factions[i].threads.filter((t) => t.to === "crew" && t.who && !cutOf(t)).map((t) => ({ k: t.who, side: t.side, fid: fid[i] })))].slice(-60);
      b = was ? { ...was, dealt, at: Date.now() } : { recipe: W.recipe, dials: W.dials, seed: W.seed, dealt, history: [], shown: false, at: Date.now() };
    } else {
      // Built by answering, How it came to be's the deck's lines, all hidden,
      // the ones that made a Secret hers for good. The record keeps which way
      // each card went, without the world the deck started from.
      const history = W.deck ? linesOf(T, W).map((l) => ({ id: newId(), text: l.text, age: l.age, ...(l.hers ? { hers: true } : {}) })) : doc.build?.history ?? [];
      const dealt = { ...rec, ...(rec.deck ? { deck: keptDeck(rec.deck) } : {}), ids: fid, pages: pid, ...(mid.length ? { mids: mid } : {}) };
      // A record too big for a world is turned down whole, so the deck's cards
      // go first, and the lines are kept.
      if (dealt.deck && JSON.stringify(dealt).length > BMAX.dealt) delete dealt.deck;
      b = { recipe: W.recipe, dials: W.dials, seed: W.seed, dealt, history, shown: W.deck ? [] : doc.build?.shown ?? [], at: Date.now() };
    }
    ops.push({ o: "wb-set", b });
    // What takes it all back off, worked out from the board before it goes on.
    const was = readable(copy(doc));
    const back = [];
    for (const op of ops) {
      const undo = undoOf(was, op);
      if (apply(was, op)) back.unshift(...undo);
    }
    save(id);
    const kept = JSON.stringify(entryOf(id));
    const all = [plural(mine.length, "faction", "factions"), minis.length ? plural(minis.length, "mini faction", "mini factions") : "", plural(places, "place", "places")].filter(Boolean);
    const say = W.add ? `It’s on the board, hidden from the crew: ${C.factions[mine[0]]?.name ?? "the new faction"}.` : `${all.slice(0, -1).join(", ")} and ${all.at(-1)} are on the board, all hidden from the crew.`;
    if (!edit(id, ops, "", { undoable: false, quiet: true })) return d.toast("The board didn’t take that.", false);
    forget(id);
    undone = { id, kept, back, at: Date.now() };
    // Back to the World screen it came from, so Back doesn't come here again.
    const board = `/characters/?camp=${encodeURIComponent(id)}&world`;
    if (history.state?.from === board) history.back();
    else d.go(board, { replace: true });
    d.toast(say, "wkundo");
  }
  // Undo on Done's note: it all comes off the board, and the build's back on
  // her phone at the board screen, as it was.
  function unDone(id) {
    const u = undone;
    undone = null;
    if (!u || u.id !== id || Date.now() - u.at > 10 * 60 * 1000) return false;
    edit(id, u.back, "", { undoable: false, quiet: true });
    load();
    st.k[id] = JSON.parse(u.kept);
    delete live[id];
    keep();
    d.go(`/characters/?camp=${encodeURIComponent(id)}&world&make=${st.k[id].mode}`, { from: `/characters/?camp=${encodeURIComponent(id)}&world` });
    d.toast("Put back. It’s off the board, and the build’s here as you left it.", false);
    return true;
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
      if (x.at?.startsWith("crew:")) return "the crew";
      if (x.at === "deck") return x.W?.deck && !x.W.deck.finished ? `card ${(x.W.deck.pos ?? 0) + 1} of the deck` : "the deck";
      if (x.at?.startsWith("f:")) return x.mode === "add" ? PARTS[Number(x.at.split(":")[2]) - 1][1].toLowerCase() : `faction ${Number(x.at.split(":")[1]) + 1}`;
      if (x.at?.startsWith("seat:")) return "the ground";
      return "the asking";
    };
    if (e) {
      const mode = e.mode;
      return `<div class="wk-start card is-going"><p class="wb-k">The world builder</p><h3>${mode === "add" ? "You’re adding a faction" : "You’re building the world"}</h3>
        <p>It’s on this phone, up to ${esc(where(e))}. Nothing’s on the board till you put it there.</p>
        <div class="cc-row"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=${mode}" data-act="w" data-do="nav">Carry on</a><button type="button" class="button" data-act="w" data-do="mk-drop-build">${sureOf("drop-build", id) ? "Tap again to drop it" : "Drop it"}</button></div></div>`;
    }
    if (empty) {
      return `<div class="wk-start card"><p class="wb-k">The world builder</p><h3>Build the world</h3>
        <p>The tables deal the ground, then you answer a deck of moments from before the crew turned up, and the factions come out of how you answer. Or go a faction at a time, or deal the lot in one tap.</p>
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
    A.after(root, root?.querySelector(".wk[data-wb]")?.dataset.wb);
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
    undo: (id) => unDone(id) || ACT["mk-undo"](null, id),
    title: (mode) => (mode === "add" ? "Adding a faction" : "Building the world"),
    // A campaign that's left the phone takes its build with it.
    drop: (id) => forget(id),
    // The founding's way in (found.js): whether there's a build on the go,
    // and its asking carried in.
    building: (id) => Boolean(entryOf(id)),
    fromFound: (id, f, tablesIn = null) => {
      // The founding's phone has the tables already, and they're the same file.
      if (!T && tablesIn?.core && tablesIn.packs) T = tablesIn;
      return T || tables() ? fromFound(id, f) : false;
    },
    keepOnly(ids) {
      load();
      for (const k of Object.keys(st.k)) if (!ids.includes(k)) delete st.k[k];
      keep();
    },
  };
}
