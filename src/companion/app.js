// The character companion: one of the six crew on your phone, saved on the
// phone and working offline. Every number on a sheet comes from the current
// rules (the JSON the build puts in the page), and only what the player
// changes in play is saved (store.js). Since the Roots change (8 Nov 2026,
// notes/roots-plan.md) every roll's one Root and one specialty, pitched to
// fit, and the three tracks are what keeps a character standing: roots.js
// has the rules. Views are HTML strings, and one click handler reads
// data-act. Every change goes through change(), so it saves, redraws and can
// be undone.
import { SIZES, diceLabel, diceRange, diceShapes, rollDie, sizeDown, sizeUp, stepsToDice } from "./dice.js";
import { openStore } from "./store.js";
import { makeSync } from "./sync.js";
import { printSheet } from "./print.js";
import { calm, feel, setSound, soundOn, tumble } from "./feel.js";
import { changesOf, ownChanges, placesOf, said } from "./marks.js";
import { makeDowntime } from "./downtime.js";
import { makeCampaigns } from "./campaigns.js";
import { makeParty } from "./party.js";
import { makeTable } from "./table.js";
import { makeWorld } from "./world.js";
import { makeTurn } from "./turn.js";
import { makeFound } from "./found.js";
import { bondKey, threadKey, threadLabel, threadPlace, threadState } from "./threads.js";
import { boxesSaid, isBroken, itS, leftOf, nameOf, pieceAt, piecesOf, setTicked, tick as tickBox, tickedOf, yours } from "./armour.js";
import * as R from "./roots.js";
import { beforeView } from "./before.js";
import { aura as kitAura, crest, die as kitDie, grow as growDie, mini as kitMini, plate as kitPlate, scars as kitScars } from "../kit/kit.js";

const DATA = JSON.parse(document.getElementById("zi-companion").textContent);
const CREW = new Map(DATA.crew.map((c) => [c.id, c]));
const LINK = DATA.links;
const COND = new Map(DATA.conditions.map((x) => [x.name, x]));
const store = openStore();
// Signed in, the characters in the account stay in step with it (sync.js).
const sync = makeSync(store, { onChange: () => {
  if (!dialog.open && !document.querySelector(".cc textarea:focus")) render();
} });
const app = document.getElementById("app");
const dialog = document.getElementById("cc-dialog");
const toastBox = document.getElementById("cc-toast");
const ORD = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty-first", "Twenty-second", "Twenty-third", "Twenty-fourth"];
const RULE = DATA.rules || {};
const TABS = [["play", "Play"], ["sheet", "Sheet"], ["rules", "Rules"]];
// A character playing in a campaign gets the party sheet a tab away too.
const tabsOf = (ch) => (party.campOf(ch) ? [["play", "Play"], ["sheet", "Sheet"], ["party", "Party"], ["world", "World"], ["rules", "Rules"]] : TABS);
// The intents a die can be tapped to, or the player writes their own.
const INTENTS = { Body: ["Hurt", "Pin", "Disarm"], Mind: ["Find out", "Trick", "Unsettle"], Soul: ["Frighten", "Inspire", "Hold them"] };
const TN = (t) => R.TRACK[t].name;

let view = { name: "list" };
let roll = null; // whatever the open dialog is working on
const ui = { panel: null, tab: "play", open: new Set(), shut: new Set(), toastTimer: 0, stopSpin: null, notesTimer: 0, mode: null, slide: null, reveal: false, seen: null };
const undo = [];
// A hit that got through, for change() to give it a thud: 1, or 2 for a
// Blaze or a track on its smallest size.
let thud = 0;

// Tests can line up the numbers the next dice roll, in order: your dice first,
// then a Mark die if there is one, then whatever they're up against.
const queued = [];
window.ziCompanion = { setDice: (list) => queued.splice(0, queued.length, ...list.map(Number)) };
const throwDie = (size) => (queued.length ? Math.min(size, Math.max(1, queued.shift())) : rollDie(size));

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(v)) ? Math.round(Number(v)) : lo));
const even = (v, lo, hi) => clamp(Math.round(Number(v) / 2) * 2, lo, hi);
const steps = (n) => `${n} step${n === 1 ? "" : "s"}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const PRONOUN = { her: ["she", "her"], him: ["he", "his"], them: ["they", "their"] };
const link = (id, text) => `<a href="${esc(LINK[id] ?? "/rules/")}">${text}</a>`;
const hex = (text, cls = "") => `<span class="hex${cls ? ` ${cls}` : ""}">${esc(text)}</span>`;
const off = (no) => (no ? " disabled" : "");
const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
const ICON = {
  undo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>',
  sound: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  sheet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>',
  rules: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
  sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  party: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V3.5"/><path d="M6 4h12l-3 4.5 3 4.5H6"/></svg>',
  // A folded map, for the world.
  world: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z"/><path d="M9 4v13.6M15 6.4V20"/></svg>',
  // A screen on its stand, for the table screen.
  screen: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8.5 20.5h7M12 16.5v4"/></svg>',
};

// ---------------------------------------------------------------- characters

const dt = makeDowntime({ B: DATA.build, esc, steps, link, icon: ICON, throwDie, crewNames: () => new Set(DATA.crew.map((x) => x.name)), isOpen: (key) => ui.open.has(key), rule: (id) => ruleHtml(id) });


// The party sheet on every phone in a campaign, and threads between the crew
// kept in step on both their phones (party.js).
const party = makeParty({
  sync, store, esc, P: DATA.party,
  list: () => camps.list(),
  normal: (ch) => normal(ch),
  render: () => render(),
  quietRender: () => {
    if (!dialog.open && !document.activeElement?.matches?.("#app input:not([type=radio]):not([type=checkbox]), #app textarea, #app select")) render();
  },
  toast: (m, u) => toast(m, u),
  go: (url, o) => goTo(url, o),
  rule: (id) => ruleHtml(id),
  isOpen: (key) => ui.open.has(key),
  isShut: (key) => ui.shut.has(key),
  viewing: () => (view.name === "sheet" ? ui.tab : view.name),
  // Threads moved on another phone, written into this character. Each undo
  // waiting for this character gets them too, so an undo here takes back only
  // what was done here and never someone else's move.
  saved: (ch, moved = []) => {
    for (const u of undo) {
      if (u.id !== ch.id) continue;
      const s = JSON.parse(u.state);
      s.threads = s.threads && typeof s.threads === "object" ? s.threads : {};
      for (const x of moved) {
        const key = threadKey(x.person, x.t);
        if (x.to === (x.t.strained ? "strained" : "whole")) delete s.threads[key];
        else s.threads[key] = x.to;
      }
      u.state = JSON.stringify(s);
    }
    ch.saved = new Date().toISOString();
    store.save();
  },
  signedOut: () => {
    sync.signedOutHere();
    render();
  },
  gone: (id) => camps.gone(id),
});

// Telegraphs on phones (table.js): the GM's round on her campaign's page, and
// each telegraph on the play screen of whoever it's aimed at.
const table = makeTable({
  sync, store, esc, feel, icon: ICON,
  campaign: (id) => camps.campaign(id),
  list: () => camps.list(),
  campOf: (ch) => party.campOf(ch),
  normal: (ch) => normal(ch),
  crest: (arch) => crest(arch, { size: "sm", strict: false, label: "" }),
  current: () => current(),
  viewId: () => view.id,
  isOpen: (key) => ui.open.has(key),
  rule: (id) => ruleHtml(id),
  roll: () => roll,
  render: () => render(),
  quietRender: () => {
    if (!dialog.open && !document.activeElement?.matches?.("#app input:not([type=radio]):not([type=checkbox]), #app textarea, #app select")) render();
  },
  toast: (m) => toast(m, false),
  openDialog: (r) => openRoll(r),
  renderDialog: () => renderDialog(),
  closeDialog: () => closeDialog(),
  // The twenty places, for the GM's scene.
  places: DATA.places ?? [],
  // The telegraphs on one of her place pages, for the composer when that
  // place is on the table (places.js).
  pageTeles: (id, pid) => world.docIn(id)?.pages?.find((p) => p.id === pid)?.teles ?? [],
  // A change to the character that's open, saved and undoable like any other.
  change: (label, fn) => change(label, fn),
  // A change to one of this phone's characters the table turned down: no undo.
  mutate: (id, fn) => {
    const ch = store.data.characters.find((x) => x.id === id);
    const c = ch ? normal(ch) : null;
    if (!c) return;
    fn(ch.state, c);
    store.save();
    if (!dialog.open) render();
  },
  // A character's specialties, as the answer picker shows them: each one's
  // a roll on the Root it's usually rolled with, changed on the roll card.
  actions: (ch, c) => c.specialties.map((sp, i) => {
    const root = R.rootFor(c, sp.name);
    const n = c.roots[root] + sp.steps;
    return { i, name: sp.name, n: sp.steps, says: `${root} ${c.roots[root]} and ${sp.steps} · ${diceLabel(stepsToDice(n))}`, dice: stepsToDice(n).map((d, j) => kitDie(d, { hide: true, cls: j ? "is-next" : "" })).join("") };
  }),
  answer: (i, tele) => openAction({ spec: normal(current())?.specialties[i]?.name ?? "", tele }),
  work: (i, w) => openAction({ spec: normal(current())?.specialties[i]?.name ?? "", work: w }),
  defend: (pre) => openDefence(pre),
  signedOut: () => {
    sync.signedOutHere();
    render();
  },
  gone: (id) => camps.gone(id),
});

// A campaign's world, starting with the faction board (world.js): the World
// screen off a campaign's page, and the World tab of a character in one.
const world = makeWorld({
  sync, esc, W: DATA.worlds, wholes: DATA.wholes ?? [], icon: ICON,
  // The faction turn, at the top of the World screen and tab (turn.js).
  turnSection: (id) => turn.section(id),
  // The founding, at the top of a player's World tab (found.js).
  foundSection: (id) => found.tab(id),
  // A telegraph off a place's or a person's page, onto the live table's round,
  // and a place of hers onto its scene.
  tele: (id, f) => table.composeFrom(id, f),
  scene: (id, p) => table.setScene(id, p),
  sceneOf: (id) => table.sceneOf(id),
  turnGlance: (id) => turn.glance(id),
  list: () => camps.list(),
  campaign: (id) => camps.campaign(id),
  campOf: (ch) => party.campOf(ch),
  crewIn: (id) => party.crewIn(id),
  // The world builder's crew step: what's on the party sheet, and each
  // character's crest off their sheet.
  partyIn: (id) => party.docIn(id),
  normal: (ch) => normal(ch),
  crest: (arch) => crest(arch, { size: "sm", strict: false, label: "" }),
  peek: (id) => party.peek(id),
  tools: () => themeButton(),
  rule: (id) => ruleHtml(id),
  isOpen: (key) => ui.open.has(key),
  viewing: () => (view.name === "sheet" ? ui.tab : view.name),
  render: () => render(),
  quietRender: () => {
    if (!dialog.open && !document.activeElement?.matches?.("#app input:not([type=radio]):not([type=checkbox]), #app textarea, #app select")) render();
  },
  toast: (m, u) => toast(m, u),
  go: (url, o) => goTo(url, o),
  signedOut: () => {
    sync.signedOutHere();
    render();
  },
  gone: (id) => camps.gone(id),
});

// The faction turn, each downtime from the board (turn.js), kept with the
// campaign's live table so it reaches every phone as it happens.
const turn = makeTurn({
  sync, esc, W: DATA.worlds, icon: ICON,
  table: () => table,
  world: () => world,
  party: () => party,
  isOpen: (key) => ui.open.has(key),
  roll: () => roll,
  render: () => render(),
  renderDialog: () => renderDialog(),
  openDialog: (r) => openRoll(r),
  closeDialog: () => closeDialog(),
  toast: (m, u) => toast(m, u),
  calm: () => calm(),
  tumble: (where, done) => tumble(where, done),
  // A character on this phone, by id, and 1 Resolve paid to roll the crew's
  // dice again (Rolling in downtime): a size off their Resolve, never below
  // its smallest.
  character: (id) => {
    const ch = chars().find((x) => x.id === id);
    if (!ch || !normal(ch)) return null;
    return { resolve: R.roomOf(ch.state, "resolve"), die: ch.state.tracks.resolve };
  },
  spendResolve: (id) => {
    const ch = chars().find((x) => x.id === id);
    if (!ch || !normal(ch) || R.roomOf(ch.state, "resolve") < 1) return false;
    if (current()?.id === ch.id) {
      change("paying 1 Resolve to roll the crew’s action again", (s) => {
        R.payTrack(s, "resolve");
        return `Your Resolve’s a d${s.tracks.resolve}.`;
      }, { say: false });
      return true;
    }
    R.payTrack(ch.state, "resolve");
    ch.saved = new Date().toISOString();
    store.save();
    party.soon(ch);
    return true;
  },
});

// The founding (found.js): the crew builds the world with her, live on
// everyone's phone, kept with the campaign's live table like the faction turn.
const found = makeFound({
  esc, icon: ICON,
  table: () => table,
  world: () => world,
  isOpen: (key) => ui.open.has(key),
  render: () => render(),
  quietRender: () => {
    if (!dialog.open && !document.activeElement?.matches?.("#app input:not([type=radio]):not([type=checkbox]), #app textarea, #app select")) render();
  },
  toast: (m, u) => toast(m, u),
  go: (url, o) => goTo(url, o),
  calm: () => calm(),
  tumble: (where, done) => tumble(where, done),
});

// Campaigns: starting one, joining one from its link, and the GM's look at
// her players' characters, drawn with the same pieces as a character here.
const camps = makeCampaigns({
  party,
  table,
  world,
  found,
  sync, store, esc, ICON,
  render: () => render(),
  go: (url, o) => goTo(url, o),
  toast: (m) => toast(m, false),
  openDialog: (r) => {
    roll = r;
    openDialog();
    dialog.querySelector("input:not([type=radio])")?.focus();
  },
  renderDialog: () => renderDialog(),
  leaveDialog: (url) => leaveDialog(url),
  roll: () => roll,
  tools: () => themeButton(),
  crew: () => DATA.crew,
  sheetFor: (ch) => sheetFor(ch),
  normal: (ch) => normal(ch),
  crestOf: (c) => crestOf(c),
  // The builder's on the new rules in stage 4 of notes/roots-plan.md, so
  // making someone new is one of the crew for now.
  newBuild: () => goTo("/characters/?build"),
  playCrew: (id) => ACT.play({ dataset: { c: id } }),
  look: {
    link: (id, text) => link(id, text), crestOf: (c) => crestOf(c), lastRollView: (last) => lastRollView(last), isOpen: (key) => ui.open.has(key),
    trackView: (ch, c) => trackView(ch, c, ch.state, true), sheetFolds: (ch, c) => sheetFolds(ch, c, true), archNames: (c) => archNames(c),
  },
});

const chars = () => store.data.characters;
const current = () => (view.name === "sheet" ? chars().find((x) => x.id === view.id) ?? null : null);

// A character built on this phone before the Roots change (or made their own
// from the crew) can't follow the chapter, so it's shown as it was till the
// builder can rebuild it (before.js). One of the crew moves onto Roots,
// keeping everything that still means the same (roots.js, fromOld).
const isBefore = (ch) => Boolean(ch && ch.crew === "own" && (R.isOldBuild(ch.build) || !ch.build));

// The crew's sheets come straight off the chapter, and what they've grown in
// downtime goes on top (roots.js, growRoots).
const sheets = new Map();
function sheetFor(ch) {
  if (!ch || isBefore(ch)) return null;
  const base = CREW.get(ch.crew) ?? null;
  if (!base) return null;
  const grown = Array.isArray(ch.state?.grown) ? ch.state.grown : [];
  const json = JSON.stringify(grown);
  const hit = sheets.get(ch.id);
  if (hit && hit.base === base && hit.json === json) return hit.sheet;
  const sheet = R.rootsSheet(base, grown, DATA.build);
  sheets.set(ch.id, { base, json, sheet });
  return sheet;
}

// Fill in anything missing and keep every number inside what the sheet allows
// now, in case the rules changed since this was saved. A character saved
// before Roots moves onto it here, once, and says so till it's seen.
function normal(ch) {
  if (!ch || isBefore(ch)) return null;
  let c = sheetFor(ch);
  if (!c) return null;
  const raw = ch.state && typeof ch.state === "object" ? ch.state : {};
  if (R.isOldState(raw)) {
    ch.state = R.fromOld(raw, c);
    ch.hash = c.hash;
    c = sheetFor(ch);
  }
  ch.state = R.normalRoots(ch.state, c);
  ch.state.last = lastRoll(ch.state.last);
  return c;
}

// The last roll keeps a name and numbers only, the way the roll card saves it
// (lastOf), so nothing else in it can reach the screen.
function lastRoll(l) {
  if (!l || typeof l !== "object" || !Array.isArray(l.dice)) return null;
  const int = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
  return {
    name: String(l.name ?? "").slice(0, 80), steps: int(l.steps),
    dice: l.dice.slice(0, 24).map((d) => ({ size: int(d?.size), total: int(d?.total), out: ["beat", "won", "tie", "under"].includes(d?.out) ? d.out : null, mark: Boolean(d?.mark) })),
    opp: l.opp == null ? null : int(l.opp), at: int(l.at),
  };
}

function persist() {
  const ch = current();
  if (ch) ch.saved = new Date().toISOString();
  store.save();
  // A thread or the Aspiration moved here goes to the rest of the crew too,
  // and an answer to a telegraph, or When it lands, goes to the GM.
  if (ch) {
    party.soon(ch);
    table.soon(ch);
  }
}

const snapRoll = () => (roll ? JSON.stringify(roll, (k, v) => (v instanceof Set ? { set: [...v] } : v)) : null);
const unsnapRoll = (json) => (json ? JSON.parse(json, (k, v) => (v && typeof v === "object" && Array.isArray(v.set) ? new Set(v.set) : v)) : null);


// Every change in play comes through here: it saves, redraws and can be undone.
function change(label, fn, { say = true } = {}) {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const before = JSON.stringify(ch.state);
  const rollBefore = snapRoll();
  thud = 0;
  const message = fn(ch.state, c, ch);
  noteTable(ch.state);
  if (JSON.stringify(ch.state) === before && snapRoll() === rollBefore) return;
  undo.push({ id: ch.id, label, state: before, roll: rollBefore });
  if (undo.length > 60) undo.shift();
  persist();
  render();
  // A hit that gets through gets a thud, and a Blaze or a track down to its
  // smallest size a heavier one.
  if (thud > 1) feel.heavy();
  else if (thud) feel.hurt();
  thud = 0;
  if (say && !dialog.open) toast(message || `Done: ${label}.`, true);
}

// A roll answering a telegraph, or When it lands for ones that landed, is
// written into the character with the change that rolled it (table.js), so
// it goes to the GM, and an Undo takes it back from her too. Till stage 4 of
// notes/roots-plan.md the table reads a telegraph at Body as a blow, on
// Defend, and one at Mind or Soul as fear, on Confidence.
function noteTable(s) {
  const r = roll;
  if (!r || r.mode !== "result" || r.pick) return;
  const rolled = () => r.dice.map((x) => ({ size: x.size, total: x.nat + x.plus, out: outcome(x) }));
  if (r.kind === "action" && r.tele) {
    // It's an answer while it's against the telegraph's die, or the number the GM rolled for it.
    const answered = r.opp != null && r.dice.length > 0 && (r.vs === r.tele.d || r.vs === -1);
    // Whoever put their action in, while their steps are still in it.
    const with_ = r.friends.length ? (r.tele.with ?? []).map((w) => ({ user: w.user, ch: w.ch })) : [];
    table.record(s, r.tele.camp, "a", r.tele.id, answered ? { act: r.name, steps: r.total, dice: rolled(), opp: r.opp, real: Boolean(r.real), ...(with_.length ? { with: with_ } : {}) } : null);
  }
  // A roll at a stake or an event on the live table's scene is an action.
  if (r.kind === "action" && r.work) {
    const worked = r.opp != null && r.dice.length > 0 && (r.vs === r.work.d || r.vs === -1);
    table.noteWork(s, r, worked ? { id: r.work.actId, k: "work", ref: r.work.ref, act: r.name, steps: r.total, roll: { dice: rolled(), opp: r.opp, real: Boolean(r.real) }, aim: r.work.aim } : null);
  }
  if (r.kind === "defence" && r.camp && r.teles?.some(Boolean)) {
    for (const h of blocks(r)) {
      const id = r.teles[h.j];
      if (id) table.record(s, r.camp, "d", id, { on: r.incoming[h.j].at === "Body" ? "Defend" : "Confidence", stopped: h.by != null, mine: h.mine, v: h.v, paid: r.paid[h.j] || "", real: Boolean(r.real) });
    }
  }
}

const lastUndo = (ch) => [...undo].reverse().find((u) => u.id === ch?.id);
function undoLast() {
  const ch = current();
  const u = lastUndo(ch);
  if (!u) return;
  undo.splice(undo.lastIndexOf(u), 1);
  // What's typed (notes, the Aspiration's words) isn't in the undo list, so it stays.
  ch.state = { ...JSON.parse(u.state), notes: ch.state.notes, aspText: ch.state.aspText };
  ui.stopSpin?.();
  ui.stopSpin = null;
  if (dialog.open && roll) roll = unsnapRoll(u.roll) ?? roll;
  if (roll) roll.spinning = false;
  persist();
  render();
  if (!dialog.open) toast(`Undone: ${u.label}.`, false);
}

// canUndo is true for the character's own Undo, or the name of another one
// (the party sheet's is "pundo").
function toast(message, canUndo) {
  toastBox.innerHTML = `<p>${esc(message)}</p>${canUndo ? `<button type="button" class="button" data-act="${canUndo === true ? "undo" : esc(canUndo)}">Undo</button>` : ""}`;
  toastBox.classList.add("show");
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => toastBox.classList.remove("show"), 6000);
}

// Aura coming in: past the maximum while you're acting, and otherwise the
// rest's for a friend.
function gainAura(s, c, n = 1) {
  const over = R.gainAura(s, c, n);
  return over ? ` Your Aura’s full, so give ${over} to a friend in the scene.` : "";
}
// A hit that gets through to a Root: its track down a size, or more for a
// vulnerability, and a Blaze at its smallest. It says what happened.
function hitAt(s, t, sizes = 1) {
  const r = R.hitTrack(s, t, sizes);
  thud = Math.max(thud, r.blaze || r.to <= R.lowOf(s, t) ? 2 : r.to < r.from ? 1 : 0);
  if (r.blaze) return `${r.to < r.from ? `Your ${TN(t)}’s down to d${r.to}, and that` : `Your ${TN(t)} was on d${r.from}, so that`} hit Blazes.`;
  return `Your ${TN(t)} drops to d${r.to}.${r.to <= R.lowOf(s, t) ? ` The next hit there Blazes.` : ""}`;
}
// Up a size, as far as d12. Nothing heals a Scar.
function upOne(s, t) {
  if (!R.trackUp(s, t)) return `Your ${TN(t)}’s on d12 already.`;
  return `Your ${TN(t)} comes up to d${s.tracks[t]}.`;
}
// The end of a scene: Aura's full, what was held in the attuned thing is
// gone, conditions end, and so does anything that only lasted the round.
// The rest roll comes first (restView). A Blaze that's still waiting stays
// until the player chooses.
function endScene(s, c) {
  R.doneActing(s, c);
  s.aura = c.numbers.aura;
  s.store = {};
  s.conditions = [];
  delete s.firm;
}


// ---------------------------------------------------------------- gold marks

// What's changed in the rules since this phone last saw a character's sheet
// (marks.js). A character saved before the marks came in starts its list the
// first time it opens, unless its crew sheet has changed since, and then it
// gets the old note until the player says they've seen it. Typo fixes are
// taken in quietly.
function settleMarks(ch, c) {
  const s = ch.state;
  ui.gold = null;
  if (!s.seen) {
    if (ch.hash !== c.hash) return;
    s.seen = said(c);
    store.save();
    return;
  }
  const d = changesOf(s.seen, c);
  const real = Object.keys(d.marks).length + d.gone.length;
  if (d.quiet.length || (!real && ch.hash !== c.hash)) {
    for (const id of d.quiet) s.seen[id] = d.now[id];
    if (!real) ch.hash = c.hash;
    store.save();
  }
  if (real) ui.gold = d;
}
const goldOf = (id) => ui.gold?.marks[id] ?? null;
// A gold mark beside a changed line, and what it said and says now under it
// once it's tapped. On a tile or a tracker it's a corner, and the card or
// panel it opens says old and new.
const gold = (id, label = "") => (goldOf(id) ? `<button type="button" class="cc-gold${label ? " has-label" : ""}" data-act="gold" data-k="${esc(id)}" aria-expanded="${ui.open.has(`g-${id}`)}"${label ? "" : ` aria-label="${esc(ui.gold.names[id] ?? "This line")}, changed in the rules: old and new"`}><span class="cc-gem" aria-hidden="true"></span>${label ? `<span>${label}</span>` : ""}</button>` : "");
const wasNow = (m) => `<div class="cc-was" role="note">${m.was == null ? "<p><b>New</b> in the rules</p>" : `<p><b>Was</b> ${esc(m.was)}</p>`}<p><b>Now</b> ${esc(m.now)}</p></div>`;
const was = (id) => (goldOf(id) && ui.open.has(`g-${id}`) ? wasNow(goldOf(id)) : "");
const goldNow = (id) => (goldOf(id) ? wasNow(goldOf(id)) : "");
const goldDot = (id) => (goldOf(id) ? '<span class="cc-gem is-corner" aria-hidden="true"></span><span class="sr-only">, changed in the rules</span>' : "");

function changedNote(ch, c) {
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";
  if (!ui.gold) {
    if (ch.state.seen || ch.hash === c.hash) return "";
    return `<div class="cc-note" role="status"><p>${esc(c.name)}’s sheet has changed in the rules since this phone last opened it. Every number here is already the new one, so check anything you’ve picked still suits ${them}.</p><div class="cc-row"><a class="button" href="/changes/">See what’s changed</a><button type="button" class="button" data-act="seen">Got it</button></div></div>`;
  }
  const d = ui.gold;
  const n = Object.keys(d.marks).length;
  const list = Object.entries(d.marks).map(([id, m]) => `<li><b>${esc(d.names[id] ?? id)}.</b> ${m.was == null ? `New: ${esc(m.now)}` : `It was ${esc(m.was)}, and now it’s ${esc(m.now)}.`}</li>`).join("");
  return `<div class="cc-note is-gold" role="status"><p><b>Changed in the rules.</b> ${n ? `${n === 1 ? "One line" : `${n} lines`} on ${esc(ch.name)}’s sheet ${n === 1 ? "has" : "have"} changed since this phone last opened ${them}, each with a gold mark. Every number here is already the new one.` : ""}</p>
    ${d.gone.length ? `<p>Gone from the sheet: ${d.gone.map((x) => `<s>${esc(x.was)}</s>`).join(", ")}.</p>` : ""}
    ${n ? `<details class="cc-own" data-open="g-list"${ui.open.has("g-list") ? " open" : ""}><summary>Old and new</summary><ul class="cc-golds">${list}</ul></details>` : ""}
    <div class="cc-row"><a class="button" href="/changes/">See the change log</a><button type="button" class="button" data-act="seen">Got it</button></div></div>`;
}

// ---------------------------------------------------------------- the list

function saveNote() {
  if (!store.ok) return '<div class="cc-note is-warn" role="alert"><p>This phone isn’t letting the site save anything, so whatever you change here is gone when you close the page. Private browsing usually does that.</p></div>';
  if (store.broken) return '<div class="cc-note is-warn" role="alert"><p>Something saved on this phone couldn’t be read, so it’s been put to one side and you’re starting a fresh list.</p></div>';
  return "";
}

// Signing in keeps the characters in an account, on every phone (sync.js).
function accountNote() {
  const me = sync.me;
  if (!me) return '<p class="cc-acct"><a href="/account/">Sign in</a> to keep your characters on every phone you use, and to start a campaign or join one.</p>';
  if (sync.out) return '<div class="cc-note is-warn" role="status"><p>You’ve been signed out on this phone. Your characters are still here, and they’ll catch up with your account when you <a href="/account/">sign in</a> again.</p></div>';
  const loose = sync.loose();
  if (!loose.length) return `<p class="cc-acct">Signed in as ${esc(me.name)}, so your characters are on every phone you sign in on. <a href="/account/">Account</a></p>`;
  const n = loose.length;
  return `<div class="cc-note" role="status"><p>${n === 1 ? `${esc(loose[0].name)} is` : `${n} characters are`} only on this phone. Move them into your account to have them on every phone you sign in on.</p>
    <div class="cc-row"><button type="button" class="button primary" data-act="movein">Move ${n === 1 ? esc(loose[0].name) : `all ${n}`} into your account</button></div></div>`;
}

// Archetypes once each, "twice" for one taken twice: "Shadow twice",
// "Guardian · Leader".
const TIMES = ["", "", "twice", "three times", "four times", "five times", "six times"];
const archNames = (c) => R.archetypesOf(c, DATA.build).map((a) => (a.times > 1 ? `${a.name} ${TIMES[a.times] ?? `${a.times} times`}` : a.name));
// A track's die and its size, for a glance.
const glanceTracks = (s) => R.TRACKS.map((t) => `${TN(t)} d${s.tracks[t]}`).join(" · ");

function listView() {
  const mine = chars();
  const saved = (ch) => {
    const c = sheetFor(ch);
    const s = c ? R.normalRoots(R.isOldState(ch.state) ? R.fromOld(ch.state, c) : ch.state, c) : null;
    const small = isBefore(ch) ? "Your own, from before the Roots change"
      : c ? `${esc(c.name)}${c.title ? ` · <em>${esc(c.title)}</em>` : ""}` : "This sheet isn’t in the rules any more";
    return `<li><a class="card cc-saved" href="/characters/?c=${encodeURIComponent(ch.id)}" data-act="nav" data-id="${esc(ch.id)}">
      <span class="die" aria-hidden="true">${esc((ch.name || "?").slice(0, 1))}</span>
      <span class="cc-saved-text"><b>${esc(ch.name)}</b>
      <small>${small}</small>
      ${s ? `<small>${glanceTracks(s)} · Aura ${s.aura}</small>` : ""}</span></a></li>`;
  };
  const crew = (c) => `<article class="card">
    <div class="art"><span class="die" aria-hidden="true">${esc(c.name.slice(0, 1))}</span></div>
    <div class="body"><h3>${esc(c.name)}</h3><p class="title">${esc(c.title)}</p>
      <div class="chips">${archNames(R.rootsSheet(c)).map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>
      <p class="blurb">${esc(c.blurb)}</p>
      <div class="cc-row"><button type="button" class="button primary" data-act="play" data-c="${esc(c.id)}">Play ${esc(c.name)}</button></div></div></article>`;
  return `<header class="cc-intro"><p class="kicker">Your phone at the table</p><h1>Characters</h1>
    <p class="lede">Pick one of the crew and play them from your phone. The counting’s done for you, and they’re saved on this phone, signal or not.</p>
    <p class="cc-paper">Playing on paper? Print a character sheet and the player reference from the <a href="/sheets/">Sheets page</a>.</p></header>
    ${saveNote()}
    ${accountNote()}
    ${camps.section()}
    ${mine.length ? `<section class="cc-sec" aria-labelledby="cc-mine"><h2 id="cc-mine">On this phone</h2><ul class="cc-mine">${mine.map(saved).join("")}</ul></section>` : ""}
    <section class="cc-sec" aria-labelledby="cc-crew"><h2 id="cc-crew">Pick from the crew</h2>
      <p class="cc-lead">Six ready-made characters, straight off their sheets in the ${link("s-pregens", "rules")}.</p>
      <div class="crew">${DATA.crew.map(crew).join("")}</div></section>
    <section class="cc-sec" aria-labelledby="cc-own"><h2 id="cc-own">Make your own</h2>
      <p class="cc-lead">Building your own character, and the learning round, are coming back on the new rules: Roots, specialties and three tracks. Till then, play one of the crew. Building one yourself is in the ${link("s-quick", "Quick Build")}.</p></section>`;
}

// ---------------------------------------------------------------- the sheet

function missingView(ch) {
  return `<a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a>
    <div class="cc-note is-warn"><p>${ch ? `${esc(ch.name)}’s sheet isn’t in the rules any more, so there’s nothing to play from.` : "That character isn’t saved on this phone."}</p>
    ${ch ? '<div class="cc-row"><button type="button" class="button" data-act="delete">Delete them from this phone</button></div>' : ""}</div>`;
}

// A rule from the book, kept in the page so it reads offline.
const ruleHtml = (id) => `${RULE[id]?.html ?? ""}<p class="cc-small">${link(id, RULE[id] ? `${esc(RULE[id].title)} in the rules` : "Read it in the rules")}</p>`;
const ruleBox = (id) => `<div class="cc-rule">${ruleHtml(id)}</div>`;

// The trackers on the play screen, as the kit draws them: Stamina,
// Confidence and Resolve as dice that change shape as they move, each with
// its Scars and a plate for every box of armour on its Root, then Aura's
// hexes and the conditions. Tap one for its buttons and its rule. A GM's look
// at a player's character draws the same thing with nothing to tap.
const quiet = (html) => html.replace('role="img"', 'aria-hidden="true"');
const platesOf = (c, s, root) => piecesOf(c).filter((a) => (a.root ?? "Body") === root).map((a) => Array.from({ length: a.boxes }, (_, j) => kitPlate(j < tickedOf(s, a))).join("")).join("");
function trackView(ch, c, s, look = false) {
  const n = c.numbers;
  const u = look ? null : lastUndo(ch);
  const max = n.aura;
  const stat = (key, label, body, cls = "") => (look
    ? `<div class="cc-stat t-${key}${cls}"><span class="k">${label}</span>${body}</div>`
    : `<button type="button" class="cc-stat t-${key}${cls}${ui.panel === key ? " is-open" : ""}${goldOf(`num:${key}`) ? " is-changed" : ""}" data-act="panel" data-p="${key}" aria-expanded="${ui.panel === key}" aria-controls="cc-panel"><span class="k">${label}${goldDot(`num:${key}`)}</span>${body}</button>`);
  const track = (t) => {
    const root = R.TRACK[t].root;
    const d = s.tracks[t];
    const low = R.lowOf(s, t);
    const plates = platesOf(c, s, root);
    const says = s.blaze === t ? "Blaze" : d <= low ? "next hit Blazes" : "";
    return stat(t, `${TN(t)} <small>${root}</small>`, `${kitDie(d, { hide: true, bare: true, state: d <= low ? "low" : "" })}<span class="cc-now"><span class="v">d${d}</span>${s.scars[t].length ? kitScars(s.scars[t].length) : ""}${plates ? `<span class="cc-plates" aria-hidden="true">${plates}</span>` : ""}${says ? `<span class="cc-mood">${says}</span>` : ""}</span>`, " is-trk");
  };
  const conds = s.conditions.length
    ? `<span class="v cc-conds-now">${s.conditions.map((x) => `<span class="cc-tag is-${x.kind}">${kitMini(x.die, { own: x.kind === "for" ? "you" : "harm" })}<em>${esc(x.name)}</em> d${x.die}</span>`).join("")}</span>`
    : `<span class="v cc-none">None on ${look ? "them" : "you"}</span>`;
  const over = s.aura > max;
  const label = look ? `${esc(ch.name)}’s Stamina, Confidence, Resolve, Aura and conditions` : "Stamina, Confidence, Resolve, Aura and conditions";
  return `<div class="cc-track is-roots${look ? " is-look" : ""}" role="group" aria-label="${label}">
    ${R.TRACKS.map(track).join("")}
    ${stat("aura", over ? "Aura <small>while acting</small>" : "Aura", `<span class="cc-row-in">${quiet(kitAura(s.aura, Math.max(max, s.aura)))}<span class="v">${s.aura}<small>/${max}</small></span></span>`, over ? " is-over" : "")}
    ${look ? "" : `<button type="button" class="cc-undo" data-act="undo"${off(!u)} aria-label="${u ? `Undo ${esc(u.label)}` : "Nothing to undo"}">${ICON.undo}<span aria-hidden="true">Undo</span></button>`}
    ${stat("cond", "Conditions", conds)}
  </div>${!look && ui.panel ? `<div id="cc-panel" class="cc-panel">${goldNow(`num:${ui.panel}`)}${panelView(ui.panel, c, s)}</div>` : ""}`;
}

// A row of dice to set a track straight to a size, each in its real shape,
// with the one it's on now lit up and the sizes a Scar's locked crossed out.
function ring(act, from, to, now, label, low = from) {
  return `<div class="cc-ring" role="group" aria-label="${label}">${SIZES.filter((d) => d >= from && d <= to).map((d) => `<button type="button" class="cc-ringbtn" data-act="${act}" data-v="${d}"${pressed(d === now)}${off(d < low)} aria-label="d${d}${d < low ? ", locked by a Scar" : ""}">${kitDie(d, { label: `d${d}`, state: d === now ? "top" : d < low ? "low" : "" })}</button>`).join("")}</div>`;
}

// What each tracker opens: its buttons, then its rule from the book.
function panelView(key, c, s) {
  const n = c.numbers;
  if (key === "aura") {
    const max = n.aura;
    // A Guardian intercepts for free, so there's nothing to pay.
    const free = c.archetypes.some((a) => a.name === "Guardian");
    const blows = "It’s only for what’s at their Body, because nobody can step in front of fear or despair.";
    const bought = R.actionsMax(c) - 1;
    return `<p><b>Aura ${s.aura} of ${max}${s.acting ? ", and you’re acting" : ""}.</b> ${s.acting ? `While you’re acting it can go past ${max}. Once you’ve finished, anything over ${max} is gone, so spend it first, on another action or on your attuned thing.` : `It’s full at the start of every scene, and every die of yours that wins gives 1 back, and so does every top face.`}</p>
      <div class="cc-row">${s.acting ? `<button type="button" class="button primary" data-act="acting" data-v="0">I’ve finished acting${s.aura > max ? `: ${s.aura - max} goes` : ""}</button>` : '<button type="button" class="button" data-act="acting" data-v="1">I’m acting now</button>'}</div>
      <div class="cc-row"><button type="button" class="button" data-act="aura" data-d="-1"${off(s.aura < 1)}>Spend 1</button><button type="button" class="button" data-act="aura" data-d="1">Get 1 back</button>${free ? "" : `<button type="button" class="button" data-act="aura" data-d="-1" data-why="intercept"${off(s.aura < 1)}>Intercept for a friend: 1 Aura</button>`}
        <button type="button" class="button" data-act="aura" data-d="-3" data-why="extra"${off(s.aura < 3 || bought < 1)}>An extra action: 3 Aura</button></div>
      <p class="cc-lead">${bought >= 1 ? `With ${c.archetypes.length} archetypes you can buy ${bought === 1 ? "one extra action" : `${bought} extra actions`} a round.` : "With one archetype, there’s no extra action to buy."} ${free ? `You intercept for free, for every friend within your stride. ${blows}` : `Intercepting takes the blows aimed at a friend within your stride, and they come at you instead. It’s 1 Aura for each friend, and no action. ${blows}`} ${link("s-intercept", "Intercept")}</p>${ruleBox("s-aura")}`;
  }
  if (R.TRACKS.includes(key)) {
    const t = key;
    const root = R.TRACK[t].root;
    const low = R.lowOf(s, t);
    const d = s.tracks[t];
    const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === root);
    const ways = R.twoForOne(s, t);
    const scars = s.scars[t].map((x, i) => `<li class="cc-item">${x ? `<p><em>${esc(x)}</em> <small>a Scar, locking d${2 + 2 * i}</small></p><div class="cc-row"><button type="button" class="button sm" data-act="unscar" data-t="${t}" data-i="${i}">The story’s taken it away</button></div>`
      : `<form class="cc-form" data-form="scar-text" data-t="${t}" data-i="${i}"><label class="cc-field">Write this Scar in as a Catch, like <em>a spear through the shoulder</em> <input name="text" maxlength="80" autocomplete="off" required></label><button type="submit" class="button sm">Write it in</button></form>`}</li>`).join("");
    const armour = pieces.map((a) => {
      const ticked = tickedOf(s, a);
      const key2 = `equipment|${a.name}`;
      const marks = Array.from({ length: a.boxes }, (_, j) => `<button type="button" class="cc-box" data-act="box" data-k="${esc(key2)}" data-n="${j + 1}"${pressed(j < ticked)} aria-label="${esc(cap(a.name))}, box ${j + 1} of ${a.boxes}">${kitPlate(j < ticked)}</button>`).join("");
      return `<li class="cc-thing-row cc-armour"><span class="cc-thing${isBroken(s, a) ? " is-out" : ""}"><span>${esc(a.name)}</span><small>${esc(a.quality)}${a.when ? `, ${esc(a.when)}` : ""}${isBroken(s, a) ? ", broken" : ""}</small></span><span class="cc-boxes" role="group" aria-label="${esc(cap(a.name))}’s boxes, ${ticked} of ${a.boxes} ticked">${marks}</span></li>`;
    }).join("");
    return `<p><b>${TN(t)} d${d}.</b> Your ${root}’s track. It starts at d12, every hit that gets through to your ${root} drops it a size, and a hit at d${low} Blazes.${low > 2 ? ` Your Scars lock everything below d${low}.` : ""} It’s the die you roll when the telegraphs land at your ${root}, and it pays for your archetypes’ abilities.</p>
      ${ring("track-set", 2, 12, d, TN(t), low).replace(/data-act="track-set"/g, `data-act="track-set" data-t="${t}"`)}
      <div class="cc-row"><button type="button" class="button" data-act="hit" data-t="${t}">A hit gets through</button><button type="button" class="button" data-act="up" data-t="${t}"${off(d >= 12)}>Up a size</button><button type="button" class="button" data-act="quickheal" data-t="${t}"${off(d >= 12 || s.aura < 1)}>Quick heal: 1 Aura</button>${t === "confidence" ? `<button type="button" class="button" data-act="breath"${off(d >= 6)}>Take a breath: up to d6</button>` : ""}</div>
      ${ways.length ? `<p class="cc-lead">Or take a hit here standing up, 2 for 1, and your ${TN(t)} stays put:</p><div class="cc-row">${ways.map((w) => `<button type="button" class="button sm" data-act="two" data-t="${t}" data-w="${esc(JSON.stringify(w))}">${R.payLabel(w)}</button>`).join("")}</div>` : ""}
      ${pieces.length ? `<h3 class="cc-h3">Armour on your ${root}</h3><p class="cc-lead">Offer it when a hit gets through to your ${root}, and tick a box instead of your ${TN(t)} dropping. Its last box breaks it, till it’s mended in downtime.</p><ul class="cc-things">${armour}</ul>` : ""}
      ${s.scars[t].length ? `<h3 class="cc-h3">Scars</h3><ul class="cc-list">${scars}</ul>` : ""}
      ${R.lastBlaze(s, t) ? `<p class="cc-note is-warn">Five Scars on your ${TN(t)}, so the next Blaze there is your last.</p>` : ""}${ruleBox("s-tracks")}`;
  }
  // Conditions: each one's rule beside it, and a form to add one.
  const conds = s.conditions.map((x, i) => {
    const rule = COND.get(x.name);
    const what = rule ? `${rule.passive} Spend it and ${rule.active}` : "";
    return `<li class="cc-cond is-${x.kind}">${kitDie(x.die, { own: x.kind === "for" ? "you" : "harm", label: `d${x.die}`, cls: "cc-cond-die" })}<div><p><b><em>${esc(x.name)}</em></b> <small>${x.kind === "for" ? "for you" : "against you"}</small></p>${what ? `<p class="cc-lead">${what}</p>` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="cond-down" data-i="${i}">Down a size</button><button type="button" class="button sm" data-act="cond-off" data-i="${i}">Spent or broken</button></div></div></li>`;
  }).join("");
  const options = ["against", "for"].map((kind) => `<optgroup label="${kind === "for" ? "For you" : "Against you"}">${DATA.conditions.filter((x) => x.kind === kind).map((x) => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("")}</optgroup>`).join("");
  return `${conds ? `<ul class="cc-conds">${conds}</ul><div class="cc-row"><button type="button" class="button" data-act="round">End of round: every condition down a size</button></div>` : '<p><b>Nothing on you right now.</b></p>'}
    <form class="cc-form" data-form="cond">
      <label class="cc-field">Add a condition <select name="pick">${options}</select></label>
      <label class="cc-field">Its die <select name="die">${SIZES.map((d) => `<option value="${d}"${d === 6 ? " selected" : ""}>d${d}</option>`).join("")}</select></label>
      <details class="cc-own"><summary>Or write your own</summary>
        <label class="cc-field">Its name <input name="own" maxlength="30" autocomplete="off"></label>
        <label class="cc-field">It’s <select name="kind"><option value="against">against you</option><option value="for">for you</option></select></label></details>
      <button type="submit" class="button">Add it</button></form>${ruleBox("s-conditions")}`;
}

// What can't wait: a Blaze. Something extraordinary, then the character dies
// (their call) or leaves the scene with a Scar on that track, a Catch in the
// player's words that locks the track's smallest open size. A Scar that would
// lock its last size is the last Blaze: they die or retire.
function alertView(ch, c, s) {
  if (s.blaze) {
    const t = s.blaze;
    const last = R.lastBlaze(s, t);
    const next = R.lowOf(s, t) + 2;
    return `<form class="cc-form cc-note is-warn" data-form="scar" role="alert"><p><b>You Blaze, at your ${TN(t)}.</b> Declare something extraordinary and it happens, no roll. From your very first Blaze you can choose for your character to die.${last ? ` Your ${TN(t)} has five Scars, so this is your last Blaze: ${esc(ch.name)} dies or retires, your call, once the extraordinary thing’s done.` : ` If you don’t, they leave the scene, and your ${TN(t)} takes a Scar.`}</p>
      ${last ? "" : `<label class="cc-field">The hit that did it, as a Catch, like <em>a spear through the shoulder</em> or <em>can’t stand the dark</em> <input name="scar" maxlength="80" autocomplete="off"></label><p class="cc-lead">It locks your ${TN(t)}’s d${next - 2} for good, and it starts again on d${next}.</p>`}
      <div class="cc-row">${last ? `<button type="button" class="button" data-act="die" data-how="retire">${esc(ch.name)} retires</button>` : '<button type="submit" class="button primary">Take the Scar and leave the scene</button>'}<button type="button" class="button" data-act="die">${esc(ch.name)} dies</button></div></form>`;
  }
  // Acting: Aura can go past the maximum till they've finished.
  if (s.acting) return `<div class="cc-note cc-acting" role="status"><p><b>You’re acting.</b> ${s.aura > c.numbers.aura ? `You’ve got ${s.aura} Aura, ${s.aura - c.numbers.aura} over your ${c.numbers.aura}. Spend it on another action or pump it into your attuned thing before you finish, or it’s gone.` : "Aura can go past your maximum till you’ve finished."}</p><div class="cc-row"><button type="button" class="button sm" data-act="acting" data-v="0">I’ve finished acting</button></div></div>`;
  return "";
}

// The last roll, from what normal() keeps of it. A GM sees her players' too
// (look.js), so every number's made a number here before it's drawn.
function lastRollView(last) {
  if (!last || !Array.isArray(last.dice)) return "";
  const num = (v) => Number(v) || 0;
  const outs = last.dice.map((d) => d.out).filter(Boolean);
  const beat = outs.filter((o) => o === "beat" || o === "won").length;
  const verdict = last.opp == null ? "" : outs.length === 1 ? ({ beat: "Beat it.", won: "Won the tie.", tie: "A tie.", under: "Under." }[outs[0]] ?? "") : `${beat} of ${outs.length} beat it.`;
  return `<p class="cc-last"><span class="k">Last roll</span> <b>${esc(last.name)}</b>, ${steps(num(last.steps))}: ${last.dice.map((d) => `${num(d.total)} on the ${d.mark ? "Mark " : ""}d${num(d.size)}`).join(", ")}${last.opp != null ? `, against ${num(last.opp)}` : ""}. ${verdict}</p>`;
}

// The note a character from before the Roots change gets once: they're on
// the new rules now, and what they grew before is waiting to go back on.
function movedNote(ch, c) {
  const s = ch.state;
  if (!s.moved) return "";
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";
  return `<div class="cc-note is-gold" role="status"><p><b>${esc(ch.name)}’s on the new rules.</b> Every roll’s a Root and a specialty now, and Stamina, Confidence and Resolve keep ${them} standing. Every track starts at d12 and Aura’s full. Threads, the Aspiration, what ${c.pronoun === "him" ? "he’s" : c.pronoun === "her" ? "she’s" : "they’ve"} picked up and the notes all came across.${s.scars.stamina.length ? " The old wound die’s Scars are on Stamina now." : ""}${s.before?.length ? ` What ${c.pronoun === "him" ? "he" : c.pronoun === "her" ? "she" : "they"} grew in downtime before is at the top of the Sheet tab, to put back on.` : ""}</p>
    <div class="cc-row"><a class="button" href="/changes/">See what’s changed</a><button type="button" class="button" data-act="moved">Got it</button></div></div>`;
}

// A character on the phone: the play screen first, and the rest of the sheet
// and the rules a tab away.
function characterView(ch, c) {
  const s = ch.state;
  const n = c.numbers;
  const facts = [`Stride ${n.stride}${n.strideNote ? ` (${esc(n.strideNote)})` : ""}${gold("num:stride")}`];
  const changed = s.moved ? movedNote(ch, c) : changedNote(ch, c);
  const list = tabsOf(ch);
  // A link to the Party tab, on a phone that hasn't found the campaign yet,
  // shows Play until it does.
  const tab = list.some(([t]) => t === ui.tab) ? ui.tab : "play";
  const body = tab === "sheet" ? sheetTab(ch, c) : tab === "rules" ? rulesTab() : tab === "party" ? party.tabView(ch) : tab === "world" ? world.tabView(ch) : playTab(ch, c);
  const tabs = list.map(([t, label]) => `<a href="/characters/?c=${encodeURIComponent(ch.id)}${t === "play" ? "" : `&amp;t=${t}`}" data-act="tab" data-t="${t}"${tab === t ? ' aria-current="page"' : ""}>${ICON[t]}<span>${label}</span></a>`).join("");
  const slide = ui.slide;
  ui.slide = null;
  return `<div class="cc-topbar"><a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a><div class="cc-tools">${soundButton()}${themeButton()}</div></div>
  <header class="cc-head cc-char">${crestOf(c)}<div class="cc-who"><h1>${esc(ch.name)}</h1><p class="cc-title"><em>${esc(c.title)}</em></p>
    <p class="cc-small">${ch.name !== c.name ? `${esc(c.name)}’s sheet, from the crew · ` : ""}${archNames(c).map(esc).join(" · ")}${c.archetypes.length ? " · " : ""}${facts.join(" · ")}</p></div>${was("num:stride")}</header>
  ${saveNote()}${changed}
  ${s.dead ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} ${s.retired ? "retired" : "died"} in play.</b> Keep the sheet to remember them, or delete them from this phone at the bottom of the Sheet tab.</p></div>` : ""}
  <div class="cc-page${slide ? ` cc-go-${slide}` : ""}">${body}</div>
  <nav class="cc-tabs" aria-label="${esc(ch.name)}"><div class="cc-tabs-in">${tabs}</div></nav>`;
}

// Sound and buzz are off until the player turns them on.
const soundButton = () => `<button type="button" class="cc-sound" data-act="sound" aria-pressed="${soundOn()}">${soundOn() ? ICON.sound : ICON.mute}<span>Sound</span></button>`;

// A character opens full screen, without the site's bar, so the light switch
// comes with it. It's the same switch: the choice is kept as zi-theme.
const lightOn = () => document.documentElement.getAttribute("data-theme") === "light";
const themeButton = () => `<button type="button" class="cc-theme" data-act="theme" aria-label="${lightOn() ? "Switch to dark mode" : "Switch to light mode"}">${lightOn() ? ICON.moon : ICON.sun}</button>`;
function flipTheme() {
  const root = document.documentElement;
  const light = !lightOn();
  if (light) root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem("zi-theme", light ? "light" : "dark");
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f5f2f7" : "#120d18");
  document.querySelector(".theme-toggle")?.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
}

// The character's crest: the Zi'Dara diamond with their first archetype in
// it, doubled for one taken twice, and a seal for a second.
function crestOf(c) {
  try {
    return crest(c.archetypes.map((a) => a.name), { strict: false, label: `Crest: ${archNames(c).join(", ") || "no archetype yet"}` });
  } catch {
    return "";
  }
}

// The dice a number of steps rolls, drawn in their real shapes, the next one
// on the first one's shoulder past 6 steps.
const diceOf = (n, own = "you") => stepsToDice(n).map((d, j) => kitDie(d, { own, hide: true, cls: j ? "is-next" : "" })).join("");

// The play screen: the trackers, then every specialty as a roll on the Root
// it's usually rolled with (tap it to pitch it however fits), the three Roots
// on their own, When it lands, the archetypes' abilities and the attuned
// thing, which holds Aura or spends it.
function playTab(ch, c) {
  const s = ch.state;
  const specs = c.specialties.map((sp, i) => {
    const root = R.rootFor(c, sp.name);
    const n = c.roots[root] + sp.steps;
    return `<button type="button" class="tile card${goldOf(`spec:${sp.name}`) ? " is-changed" : ""}" data-act="roll" data-s="${i}"><span class="tile-dice" aria-hidden="true">${diceOf(n)}</span><span class="tile-name">${esc(sp.name)}</span><span class="tile-says"><span class="tile-steps">${esc(root)} ${c.roots[root]} and ${sp.steps}</span> · <span class="tile-die">${esc(diceLabel(stepsToDice(n)))}</span>${goldDot(`spec:${sp.name}`)}</span></button>`;
  }).join("");
  const roots = R.ROOTS.map((root) => {
    const n = c.roots[root];
    return `<button type="button" class="tile card is-root${goldOf(`root:${root}`) ? " is-changed" : ""}" data-act="roll" data-r="${root}"><span class="tile-dice" aria-hidden="true">${n ? diceOf(n) : kitDie(2, { hide: true })}</span><span class="tile-name">${root}</span><span class="tile-says"><span class="tile-steps">${n ? steps(n) : "nothing yet"}</span>${goldDot(`root:${root}`)}</span></button>`;
  }).join("");
  // What landed on them at the end of a round in their campaign, waiting on this.
  const landed = table.landedFor(ch);
  const owed = landed ? landed.incoming.length + landed.more : 0;
  return `${table.playCard(ch)}${trackView(ch, c, s)}${alertView(ch, c, s)}
  <section class="cc-sec cc-play" aria-labelledby="cc-specs-h"><h2 id="cc-specs-h" class="cc-h3 cc-play-h">Roll a specialty <small>or tap a Root</small></h2>
    <div class="cc-tiles cc-spectiles">${specs}</div>
    <div class="cc-tiles cc-roots">${roots}</div>
    <div class="cc-tiles"><button type="button" class="tile card tile-defend${owed ? " is-owed" : ""}" data-act="defence"><span class="tile-dice" aria-hidden="true">${R.TRACKS.map((t, j) => kitDie(s.tracks[t], { hide: true, cls: j ? "is-next" : "" })).join("")}</span><span class="tile-name">When it lands</span><span class="tile-sub">${owed ? `${owed === 1 ? "One’s" : `${cap(["", "", "two", "three", "four", "five", "six"][owed] || String(owed))} have`} landed on ${esc(ch.name)} · ` : ""}${glanceTracks(s)}</span></button></div>
    ${lastRollView(s.last)}
    <div class="cc-row cc-scene"><button type="button" class="button" data-act="scene">New scene</button><button type="button" class="button" data-act="downtime">Downtime</button></div>
  </section>
  ${abilitiesView(ch, c, s)}
  ${attunedView(ch, c, s)}`;
}

// Each archetype's abilities, paid in sizes: 1 off its home track, or 2 from
// the other two in any mix (2 for 1). Pay again and you get it again. Push
// goes on a die once you've rolled, so it's on the roll card and When it lands.
function abilitiesView(ch, c, s, look = false) {
  const list = R.archetypesOf(c, DATA.build);
  if (!list.length) return "";
  const arch = (a) => `<div class="cc-arch"><p class="cc-arch-h"><b>${a.id ? link(a.id, esc(a.name)) : esc(a.name)}</b>${a.times > 1 ? ` <small>${TIMES[a.times] ?? `${a.times} times`}</small>` : ""} <span class="chip sm">Home: ${TN(a.home)}</span>${gold(`arch:${a.name}`)}</p>${was(`arch:${a.name}`)}
    ${a.for ? `<p class="cc-lead">${esc(a.for)}.</p>` : ""}
    <ul class="cc-abils">${a.abilities.map((x, j) => {
      const ways = R.payWays(s, a.home);
      return `<li class="cc-abil"><p><b>${esc(x.name)}</b> <small>1 ${TN(a.home)}</small> ${x.html}</p>${look || x.push ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="ability" data-a="${esc(a.name)}" data-j="${j}"${off(!ways.length)}>Pay for ${esc(x.name)}</button></div>`}</li>`;
    }).join("")}</ul></div>`;
  return `<section class="cc-sec cc-abilities" aria-labelledby="cc-ab-h"><h2 id="cc-ab-h" class="cc-h3">${list.length > 1 ? "Your archetypes" : "Your archetype"}</h2>
    ${look ? "" : `<p class="cc-lead">Each ability’s 1 off its home track, or 2 from your other two. Paying never takes a track below its smallest size. Push goes on a die once you’ve rolled, from the roll card. ${link("s-abilities", "Abilities")}</p>`}
    ${list.map(arch).join("")}</section>`;
}

// The attuned thing: its own way to Aura, and its awakenings. A passive one
// holds Aura, pumped in while you're acting, free and no action, and works
// for as much as it holds. An active one spends it. It all empties at the
// end of the scene.
function attunedView(ch, c, s, look = false) {
  if (!c.attuned.length) return "";
  const passives = R.passivesOf(c);
  const thing = (a, i) => {
    const seen = new Set();
    const wakes = a.awakenings.map((w) => {
      if (w.kind === "passive") {
        const p = passives.find((x) => x.key === `${i}|${w.name}`);
        if (seen.has(p.key)) return "";
        seen.add(p.key);
        const held = s.store[p.key] ?? 0;
        return `<li class="cc-wake is-passive"><p><b><em>${esc(w.name)}</em></b> <small>passive${p.holds > R.HOLDS ? `, twice, so it holds ${p.holds}` : ""}</small> ${esc(w.text)}.</p>
          <p class="cc-held"><span class="k">Holding</span>${quiet(kitAura(held, p.holds))}<span class="v">${held}<small>/${p.holds}</small></span></p>
          ${look ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="pump" data-k="${esc(p.key)}"${off(s.aura < 1 || held >= p.holds)}>Pump 1 Aura in</button></div>`}</li>`;
      }
      return `<li class="cc-wake is-active"><p><b><em>${esc(w.name)}</em></b> <small>active</small> ${esc(w.text)}.</p>
        ${look ? "" : `<div class="cc-row">${[1, 2, 3].filter((k) => k === 1 || k <= s.aura).map((k) => `<button type="button" class="button sm" data-act="wake" data-a="${i}" data-n="${esc(w.name)}" data-v="${k}"${off(s.aura < k)}>Use it: ${k} Aura</button>`).join("")}</div>`}</li>`;
    }).join("");
    const room = R.attunedRoom(a);
    return `<div class="cc-attuned"><p class="cc-arch-h"><b>${esc(a.name)}</b>${a.props ? ` <small>(${esc(a.props)})</small>` : ""} <span class="chip sm">${esc(a.stage)}</span>${gold(`att:${i}`)}</p>${was(`att:${i}`)}
      ${a.aura ? `<p><b>Its Aura:</b> ${esc(a.aura)}</p>${look ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="its-aura" data-a="${i}">It happened: +1 Aura</button></div>`}` : ""}
      <ul class="cc-wakes">${wakes}</ul>
      ${a.catch ? `<p>Its Catch: <em>${esc(a.catch)}</em></p>` : ""}${a.burden ? `<p>Its Burden: <em>${esc(a.burden)}</em></p>` : ""}
      ${look ? "" : `<p class="cc-small">${room.n} of ${room.all} awakenings at ${esc(a.stage)}.</p>`}</div>`;
  };
  return `<section class="cc-sec cc-attune" aria-labelledby="cc-at-h"><h2 id="cc-at-h" class="cc-h3">Attuned</h2>
    ${look ? "" : `<p class="cc-lead">It’s an item on any roll it fits, and it can’t break. Pump Aura into a passive awakening while you’re acting, and it holds it till the scene ends. ${link("s-attunement", "Attunement")}</p>`}
    ${c.attuned.map(thing).join("")}</section>`;
}


const lower = (name) => name.replace(/^(A|An|The|His|Her|Their) /, (m) => m.toLowerCase());

// A permission's a button: tap it to read how permissions work.
const permButton = (p, from, id = "") => `<li><button type="button" class="cc-perm" data-act="rule" data-r="perm" data-t="${esc(p.text)}" data-f="${esc(from)}"><em>${esc(p.text)}</em></button> <small class="cc-perm-at">${esc(p.root)}, ${esc(p.specialty)}</small>${id ? `${gold(id)}${was(id)}` : ""}</li>`;
// What each thing carried says on its own line.
const ROOM = { equipment: 3, utility: 3 };

function sheetTab(ch, c) {
  const s = ch.state;
  return `${putBackView(ch, c, s)}<div class="cc-changebar"><div class="cc-row"><button type="button" class="button" data-act="print"${off(ui.printing)}>${ui.printing ? "Filling in the sheet…" : "Print the sheet"}</button></div></div>
  <div class="cc-folds">${sheetFolds(ch, c)}</div>`;
}

// The sheet at a glance, then the detail. Every part of it is a fold whose
// summary reads at a glance, with its buttons a tap away. A fold holding a
// line the rules have changed opens by itself, until it's closed. A GM's
// look at a player's character draws the same folds with nothing to tap.
function sheetFolds(ch, c, look = false) {
  const s = ch.state;
  const at = placesOf(c);
  const her = c.pronoun === "him" ? "his" : c.pronoun === "her" ? "her" : "their";
  const marks = look ? [] : Object.keys(ui.gold?.marks ?? {});
  const marked = (...pre) => marks.some((k) => pre.some((p) => k === p || k.startsWith(`${p}:`)));
  const fold = (key, title, glance, body, golden = false) => {
    const id = `${look ? "lk" : "sh"}-${key}`;
    const open = !ui.shut.has(id) && (ui.open.has(id) || golden);
    return `<details class="cc-fold" data-open="${id}"${open ? " open" : ""}><summary><h2 class="cc-fold-t">${title}${golden ? '<span class="cc-gem" aria-hidden="true"></span><span class="sr-only">, changed in the rules</span>' : ""}</h2>${glance ? `<span class="cc-fold-g">${glance}</span>` : ""}</summary><div class="cc-fold-b">${body}</div></details>`;
  };
  const few = (items, max) => (items.length > max ? `${items.slice(0, max).join(" · ")} <small>and ${items.length - max} more</small>` : items.join(" · "));
  const diceAt = (n) => `<span class="cc-act-dice" aria-hidden="true">${n ? diceOf(n) : kitDie(2, { hide: true })}</span>`;
  const g = (id) => (look ? "" : `${gold(id)}${was(id)}`);

  // Roots and specialties, each with the dice it rolls on its own.
  const rootRows = R.ROOTS.map((root) => `<li class="cc-act">${diceAt(c.roots[root])}<div class="cc-act-in"><p><b>${root}</b> <small>${c.roots[root] ? `${steps(c.roots[root])}, ${diceLabel(stepsToDice(c.roots[root]))}` : "nothing yet"}</small>${g(`root:${root}`)}</p></div></li>`).join("");
  const specRows = c.specialties.map((sp) => `<li class="cc-spec"><b>${esc(sp.name)}</b> <span>${sp.steps}</span>${g(`spec:${sp.name}`)}</li>`).join("");
  const rootsAt = `<span class="cc-gl-wrap">${R.ROOTS.map((root) => `<span class="cc-gl">${kitMini(Math.min(12, Math.max(2, c.roots[root] * 2)))}<b>${root}</b> <small>${c.roots[root]}</small></span>`).join("")}</span>`;

  const titles = c.titles.map((t, i) => `<article class="card cc-card"><p class="eyebrow">${ORD[i] ?? ""} Title · ${esc(t.root)}; ${esc((t.specialties ?? []).join(", "))}${g(`title:${at.titles[i]}`)}</p>
    <h3><em>${esc(t.name)}</em></h3><ul class="cc-perms">${t.permissions.map((p, j) => permButton(p, `${her} ${(ORD[i] ?? "").toLowerCase()} Title, ${t.name}`, look ? "" : `perm:${at.titles[i]}:${at.perms[i][j]}`)).join("")}</ul></article>`).join("");
  const titlesAt = c.titles.map((t) => `<span class="cc-gl-line"><em>${esc(t.name)}</em> <small>${esc(t.root)} · ${t.permissions.length} ${t.permissions.length === 1 ? "permission" : "permissions"}</small></span>`).join("");

  const thing = (where, name, i = -1) => {
    const key = `${where}|${name}`;
    const out = Boolean(s.crossed[key]);
    // A piece of armour has its quality, its Root and a box to tap for every
    // blow it can take. Tapping the piece itself breaks it or mends it outright.
    const a = where === "equipment" && i < 0 ? pieceAt(c, key) : null;
    const tag = look ? "span" : "button";
    const act = (attrs) => (look ? "" : ` type="button" ${attrs}`);
    if (a) {
      const ticked = tickedOf(s, a);
      const marks2 = Array.from({ length: a.boxes }, (_, j) => (look ? `<span class="cc-box">${kitPlate(j < ticked)}</span>` : `<button type="button" class="cc-box" data-act="box" data-k="${esc(key)}" data-n="${j + 1}"${pressed(j < ticked)} aria-label="${esc(cap(name))}, box ${j + 1} of ${a.boxes}">${kitPlate(j < ticked)}</button>`)).join("");
      return `<li class="cc-thing-row cc-armour"><${tag} class="cc-thing${out ? " is-out" : ""}"${act(`data-act="cross" data-k="${esc(key)}"${pressed(out)} aria-label="${esc(nameOf(c, where, name))}: ${out ? "broken, tap to mend it" : `${boxesSaid(s, a)}, tap to break it`}"`)}><span>${esc(name)}</span><small>${esc(a.quality)}, on ${esc(a.root ?? "Body")}${a.when ? `, ${esc(a.when)}` : ""}${out ? ", broken" : ""}</small></${tag}><span class="cc-boxes" role="group" aria-label="${esc(cap(name))}’s boxes, ${ticked} of ${a.boxes} ticked">${marks2}</span></li>`;
    }
    return `<li class="cc-thing-row"><${tag} class="cc-thing${out ? " is-out" : ""}"${act(`data-act="cross" data-k="${esc(key)}"${pressed(out)} aria-label="${esc(name)}: ${out ? "crossed out, tap to bring it back" : "tap to cross it out"}"`)}><span>${esc(name)}</span>${out ? "<small>crossed out</small>" : ""}</${tag}>${i >= 0 && !look ? `<button type="button" class="cc-x sm" data-act="drop" data-i="${i}" aria-label="Take ${esc(name)} off the sheet">${ICON.close}</button>` : ""}</li>`;
  };
  const picked = (where) => s.picked.map((p, i) => ({ ...p, i })).filter((p) => p.where === where);
  const slot = (where, title) => {
    const own = where === "bag" ? c.carry.bag?.items ?? [] : c.carry[where] ?? [];
    const extra = picked(where);
    const max = where === "bag" ? c.carry.bag?.max ?? 10 : ROOM[where];
    return `<div class="cc-slot"><h3>${title} <small>${own.length + extra.length} of ${max}</small>${g(`kit:${where}`)}</h3>
      <ul class="cc-things">${own.map((x) => thing(where, x)).join("")}${extra.map((p) => thing(where, p.name, p.i)).join("")}</ul></div>`;
  };
  const carried = [...(c.carry.equipment ?? []).map((x) => ["equipment", x]), ...(c.carry.utility ?? []).map((x) => ["utility", x]), ...(c.carry.keepsake ? [["keepsake", c.carry.keepsake]] : []), ...(c.carry.bag?.items ?? []).map((x) => ["bag", x]), ...s.picked.map((p) => [p.where, p.name])]
    .map(([where, x]) => (s.crossed[`${where}|${x}`] ? `<s>${esc(nameOf(c, where, x))}</s>` : esc(nameOf(c, where, x))));

  // In a campaign, a thread with someone else in it is on both their phones,
  // and one that's only on the other sheet shows here too, in their words.
  const pt = look ? null : party.threadsOf(ch, c);
  const crewNames = new Set(DATA.crew.map((x) => x.name));
  const inCrew = (person) => (pt ? pt.mate(person) : crewNames.has(person));
  const people = allThreads(ch, c, pt);
  const threads = people.map((p) => `<div class="cc-person"><h3>${esc(p.person)}${inCrew(p.person) ? ' <small>in the crew</small>' : ""}</h3><ul>${p.threads.map((t, j) => threadRow(p, t, t.theirs ? `x${j}` : at.threads[p.person]?.[j] ?? `x${j}`, s, look)).join("")}</ul></div>`).join("");
  const threadsAt = people.map((p) => {
    const states = p.threads.map((t) => ({ t, st: threadState(s, p.person, t) }));
    const hostile = states.some((x) => x.t.kind === "hostile");
    const worst = states.find((x) => x.st === "snapped") ?? states.find((x) => x.st === "strained");
    return `${esc(p.person)}${hostile || worst ? ` <small>${[hostile ? "hostile" : "", worst ? worst.st : ""].filter(Boolean).join(", ")}</small>` : ""}`;
  });

  const scarList = R.TRACKS.flatMap((t) => s.scars[t].map((x) => ({ text: x || "a Scar not written in yet", from: `a Scar on ${TN(t)}` })));
  const bites = [
    ...c.attuned.filter((a) => a.catch).map((a) => ({ text: a.catch, from: `the Catch on ${lower(a.name)}` })),
    ...scarList,
    ...c.trouble.map((x) => ({ text: x, from: `trouble that follows ${c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them"}` })),
  ].map((b) => `<li class="cc-item"><p><em>${esc(b.text)}</em> <small>${esc(b.from)}</small></p>${look ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Let ${esc(b.text)} bite: +1 Aura">Let it bite: +1 Aura</button><button type="button" class="button sm" data-act="bite" data-big="1" aria-label="A big bite from ${esc(b.text)}: Resolve up a size">A big bite: Resolve up a size</button></div>`}</li>`).join("");
  const bitesAt = [...c.attuned.filter((a) => a.catch).map((a) => a.catch), ...scarList.map((x) => x.text), ...c.trouble].map((x) => `<em>${esc(x)}</em>`);
  const notesAt = String(s.notes ?? "").trim().split("\n")[0];
  const archAt = archNames(c).map(esc);

  return `${fold("roots", "Roots and specialties", rootsAt, `<p class="cc-lead">A roll’s one Root and one specialty, plus 1 for each item that fits. ${link("how-permissions-stack", "How it adds up")}</p><ul class="cc-acts">${rootRows}</ul><h3 class="cc-h3">Specialties</h3><ul class="cc-specs">${specRows}</ul>`, marked("root", "spec"))}
  ${fold("titles", c.titles.length === 1 ? "Title and permissions" : "Titles and permissions", titlesAt, `<p class="cc-lead">A Title’s 1 on its Root and 1 on each of its three specialties. A permission’s 1 on a Root and 1 on a specialty, and it does what it says. Tap one to see how it counts.</p>${titles}`, marked("title", "perm"))}
  ${fold("arch", archAt.length > 1 ? "Archetypes" : "Archetype", few(archAt, 4), abilitiesView(ch, c, s, look).replace(/<section[^>]*>|<\/section>|<h2[^>]*>.*?<\/h2>/g, ""), marked("arch"))}
  ${fold("kit", "Kit", few(carried, 7), `${slot("equipment", "Equipment")}${slot("utility", "Utility")}
    ${c.carry.keepsake ? `<div class="cc-slot"><h3>Keepsake${g("kit:keepsake")}</h3><ul class="cc-things">${thing("keepsake", c.carry.keepsake)}</ul></div>` : ""}
    ${slot("bag", `The bag <span class="cc-small">(${esc(c.carry.bag?.name ?? "a bag")})</span>`)}
    ${look ? "" : `<form class="cc-form" data-form="pickup"><label class="cc-field">Pick something up <input name="what" maxlength="60" autocomplete="off"></label>
      <label class="cc-field">It goes in <select name="where"><option value="bag">the bag</option><option value="utility">utility</option><option value="equipment">equipment</option></select></label>
      <button type="submit" class="button">Add it</button></form>
    <p class="cc-lead">Tap a thing to cross it out when it breaks or gets used up, and it’s not an item on your rolls till it’s mended. ${piecesOf(c).length ? "Armour ticks a box for every hit it takes for you on its Root, and breaks when the last one goes. " : ""}${link("s-armour-quality", "How armour’s boxes work")}</p>`}`, marked("kit"))}
  ${c.attuned.length ? fold("att", "Attuned", c.attuned.map((a) => `${esc(a.name)} <small>${esc(a.stage)}</small>`).join(" · "), attunedView(ch, c, s, look).replace(/<section[^>]*>|<\/section>|<h2[^>]*>.*?<\/h2>/g, ""), marked("att")) : ""}
  ${fold("threads", "Threads", few(threadsAt, 5) || "None yet", `${look ? "" : `<p class="cc-lead">A bond thread’s something good between you. Borrow one of their specialties through it for 1 Aura, or lean on them in the story and strain it, and your Resolve comes up a size. You can’t borrow through a strained one, and straining it again before it’s mended snaps it.</p>
    <p class="cc-lead">A hostile thread’s something that’s gone bad, and it bites like a Catch. Doing right by them strains it, and doing right by them again snaps it. ${pt ? `A thread with someone in the crew is on both your sheets, and in ${esc(pt.name)} it’s on both your phones too, so straining it, mending it or snapping it on one does it on the other.` : "A thread with someone in the crew is on both your sheets, so tell them when it changes."} ${link("s-bonds", "How threads work")}</p>`}
    ${threads}`, marked("thr"))}
  ${fold("trouble", "Catches and trouble", few(bitesAt, 3) || (look ? "None" : "Bring real trouble on yourself for 1 Aura"), `${look ? "" : `<p class="cc-lead">Let one bite and bring real trouble into the scene, and you take 1 Aura. A big bite that changes the scene or costs you something you wanted puts your Resolve up a size instead. Your hostile threads bite the same way, from Threads.</p>${goldOf("trouble") ? `<p>${gold("trouble", "The trouble that follows you changed in the rules")}</p>${was("trouble")}` : ""}`}
    <ul class="cc-list">${bites}${look ? "" : `<li class="cc-item"><p>Nothing here fits? Bring real trouble on yourself in the story anyway.</p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Real trouble with no Catch: +1 Aura">+1 Aura</button></div></li>`}</ul>`, marked("trouble"))}
  ${fold("asp", "Aspiration", `<span class="cc-gl">${kitMini(s.asp)}<em>${esc(s.aspText || c.aspiration.text)}</em> <small>d${s.asp}</small></span>`, look ? `<p><em>${esc(s.aspText || c.aspiration.text)}</em>, d${s.asp}.</p>` : `${goldOf("asp") ? `<p>${gold("asp", "Its words changed in the rules")}</p>${was("asp")}` : ""}
    <label class="cc-field"><span class="sr-only">Your Aspiration</span><input class="cc-plain" data-in="asp-text" maxlength="120" value="${esc(s.aspText || c.aspiration.text)}" autocomplete="off"></label>
    ${ring("asp-set", 2, 12, s.asp, "Aspiration")}
    <div class="cc-row"><button type="button" class="button" data-act="asp" data-d="-1"${off(s.asp <= 2)}>A setback</button><button type="button" class="button" data-act="asp" data-d="1">It climbs</button></div>
    <p class="cc-lead">When the GM says it’s within reach, roll against its die, and if you beat it, it climbs. Past d12, it’s a new Title, archetype or attuned thing, and a new Aspiration at d2. ${link("s-aspiration", "How Aspiration works")}</p>
    <details class="cc-rulebox" data-open="asp-good"${ui.open.has("asp-good") ? " open" : ""}><summary>What makes a good Aspiration</summary><div class="cc-rule">${ruleHtml("s-good-aspiration")}</div></details>`, marked("asp"))}
  ${look ? (notesAt ? fold("notes", "Notes", esc(notesAt.length > 70 ? `${notesAt.slice(0, 68)}…` : notesAt), `<p class="cc-notes-read">${esc(s.notes).replace(/\n/g, "<br>")}</p>`) : "")
    : fold("notes", "Notes", notesAt ? esc(notesAt.length > 70 ? `${notesAt.slice(0, 68)}…` : notesAt) : "Nothing written yet", `<label class="sr-only" for="cc-notes">Notes</label><textarea id="cc-notes" data-in="notes" rows="5">${esc(s.notes)}</textarea>`)}
  ${look ? "" : fold("about", `About ${esc(c.name)}`, esc(c.blurb.length > 90 ? `${c.blurb.slice(0, 88)}…` : c.blurb), `<p>${esc(c.blurb)}</p><p><b>Plays like:</b> ${c.playsLike}</p>
    ${c.crewQs.map((x) => `<p><em>${esc(x.q)}</em> ${esc(x.a)}</p>`).join("")}
    <p class="cc-lead">${link("s-pregens", `${esc(c.name)}’s sheet in the rules`)}. Print, at the top of this tab, fills in the two-page sheet from the <a href="/sheets/">Sheets page</a> with everything here as it stands now.</p>
    <div class="cc-row"><button type="button" class="button danger" data-act="delete">Delete ${esc(ch.name)} from this phone</button></div>`)}`;
}

// What a character grew in downtime before the Roots change, waiting to go
// back on the new sheet: each permission with the Root and specialty it fits
// now, each attuned permission as an awakening, a Title with its Root and
// three specialties, its archetype as one of theirs. Traits are gone from the
// rules, so they're let go. None of it takes a slot: they earned it already.
function putBackView(ch, c, s) {
  if (!s.before?.length) return "";
  const rootPick = (name, now = "") => `<select name="${name}">${R.ROOTS.map((r) => `<option${r === now ? " selected" : ""}>${r}</option>`).join("")}</select>`;
  const specPick = (name) => `<input name="${name}" maxlength="40" autocomplete="off" list="cc-speclist" required>`;
  const row = (g) => {
    const head = (what, text) => `<p><b>${what}</b> <em>${esc(text)}</em></p>`;
    const form = (fields, label = "Put it back") => `<form class="cc-form cc-putback" data-form="putback" data-n="${g.n}">${fields}<div class="cc-row"><button type="submit" class="button sm primary">${label}</button><button type="button" class="button sm" data-act="letgo" data-n="${g.n}">Let it go</button></div></form>`;
    if (g.k === "perm" || g.k === "swap") {
      const t = c.titles[g.t];
      return `<li class="cc-item">${head("A permission", g.text)}${form(`<label class="cc-field">On <select name="t">${c.titles.map((x, i) => `<option value="${i}"${i === g.t ? " selected" : ""}${x.permissions.length >= R.MAX_PERMS ? " disabled" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <label class="cc-field">Its Root ${rootPick("root", t?.root)}</label><label class="cc-field">Its specialty ${specPick("spec")}</label>`)}</li>`;
    }
    if (g.k === "att") {
      return `<li class="cc-item">${head("On an attuned thing", g.text)}${form(`<label class="cc-field">On <select name="a">${c.attuned.map((a, i) => `<option value="${i}"${i === (g.a ?? 0) ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label>
        <label class="cc-field">As an awakening that’s <select name="kind"><option value="passive">passive: it holds Aura</option><option value="active">active: it spends it</option></select></label>
        <label class="cc-field">What it does <input name="does" maxlength="200" autocomplete="off" placeholder="+1 on one die of every roll with it, for each Aura in it"></label>`)}</li>`;
    }
    if (g.k === "title") {
      return `<li class="cc-item">${head(`A Title${g.arch ? `, and the ${esc(g.arch)} archetype` : ""}`, g.text)}${form(`<label class="cc-field">Its Root ${rootPick("root")}</label>
        <label class="cc-field">Its three specialties ${specPick("s1")} ${specPick("s2")} ${specPick("s3")}</label>
        ${g.perm ? `<p class="cc-lead">Its permission, <em>${esc(g.perm)}</em>:</p><label class="cc-field">Its Root ${rootPick("proot")}</label><label class="cc-field">Its specialty ${specPick("pspec")}</label>` : ""}`)}</li>`;
    }
    const what = g.k === "trait" ? `The trait ${esc(g.name ?? "")}` : "Something from before";
    return `<li class="cc-item"><p><b>${what}</b>${g.k === "trait" ? " <small>traits are gone from the rules</small>" : ""}</p><div class="cc-row"><button type="button" class="button sm" data-act="letgo" data-n="${g.n}">Let it go</button></div></li>`;
  };
  return `<section class="cc-note is-gold cc-before" aria-labelledby="cc-before-h"><h2 id="cc-before-h" class="cc-h3">Grown before the Roots change</h2>
    <p class="cc-lead">Put each one back on the new sheet, with the Root and specialty it fits. It doesn’t take a slot, because it’s already earned. ${link("s-writing-permissions", "Writing permissions")}</p>
    <datalist id="cc-speclist">${c.specialties.map((x) => `<option value="${esc(x.name)}">`).join("")}</datalist>
    <ul class="cc-list">${s.before.map(row).join("")}</ul></section>`;
}

// A character's threads by bond, and in a campaign the ones that are only on
// someone else's sheet with them, under the same name.
function allThreads(ch, c, pt = party.threadsOf(ch, c)) {
  if (!pt?.extra.length) return c.threads;
  const out = c.threads.map((p) => ({ ...p, threads: [...p.threads] }));
  for (const x of pt.extra) {
    const p = out.find((y) => bondKey(y.person) === bondKey(x.person));
    if (p) p.threads.push(...x.threads);
    else out.push({ person: x.person, threads: [...x.threads] });
  }
  return out;
}
// A thread by its key (person|words), and the sheet it's on.
function threadAt(c, key) {
  for (const p of allThreads(current(), c)) for (const t of p.threads) if (threadKey(p.person, t) === key) return { person: p.person, t };
  return null;
}
// Whole again: back to how the sheet has it, or marked whole when the sheet says strained.
function setWhole(s, found) {
  const key = threadKey(found.person, found.t);
  if (found.t.strained) s.threads[key] = "whole";
  else delete s.threads[key];
}
// Who else needs to know. In a campaign, someone else in it sees it on their
// phone, and out of one, a thread with one of the crew needs saying out loud.
const tellCrew = (person, how, c) => {
  const pt = c ? party.threadsOf(current(), c) : null;
  if (pt) return !pt.mate(person) ? "" : navigator.onLine === false ? ` It goes to ${person}’s phone when you’ve got a signal.` : ` It’s ${how} on ${person}’s sheet too.`;
  return DATA.crew.some((x) => x.name === person) ? ` Tell ${person}’s player, so it’s ${how} on their sheet too.` : "";
};

// One thread on the Sheet tab: its truth, whose words they are, where it sits
// from bond to hostile, and what you can do with it. A bond thread lends one
// of their specialties for 1 Aura while it's whole, and straining it puts
// your Resolve up a size. A hostile thread bites like a Catch, and doing
// right by them strains it.
function threadRow(p, t, place, s, look = false) {
  const key = threadKey(p.person, t);
  const st = threadState(s, p.person, t);
  const id = `thr:${p.person}:${place}`;
  const bond = t.kind !== "hostile";
  const who = esc(p.person);
  const b = (act, label, extra = "", no = false) => `<button type="button" class="button sm" data-act="${act}" data-k="${esc(key)}"${extra}${off(no)}>${label}</button>`;
  const buttons = look || st === "snapped" ? []
    : bond ? (st === "strained"
      ? [b("strain", "Strain it again: it snaps, Resolve up a size"), b("mend", "Mended")]
      : [b("tborrow", "Borrow a specialty: 1 Aura", ` aria-label="Borrow one of ${who}’s specialties: 1 Aura"`, s.aura < 1), b("strain", "Strain it: Resolve up a size")])
    : [b("bite", "It brought trouble: +1 Aura", ` data-big="0" aria-label="Your thread with ${who} brought real trouble: +1 Aura"`), b("bite", "A big bite: Resolve up a size", ` data-big="1" aria-label="A big bite from your thread with ${who}: Resolve up a size"`),
      b("right", st === "strained" ? "Did right by them again: it snaps" : "Did right by them: it strains"), ...(st === "strained" ? [b("wrong", "Wronged them again: it’s whole")] : [])];
  const at = threadPlace(t, st);
  const scale = `<span class="cc-scale" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < 2 ? "is-bond" : i > 2 ? "is-hostile" : "is-neutral"}${i === at ? " on" : ""}"></i>`).join("")}</span>`;
  return `<li class="cc-thread is-${bond ? "bond" : "hostile"} is-${st}"><p><em>${esc(t.text)}</em>${t.whose ? ` <small>(${esc(t.whose)} words)</small>` : ""}${look ? "" : gold(id)}</p>${look ? "" : was(id)}
    <p class="cc-thread-st"><span class="chip sm">${threadLabel(t, st)}</span>${scale}</p>
    ${buttons.length ? `<div class="cc-row">${buttons.join("")}</div>` : ""}</li>`;
}

// The rules a player reaches for mid-round, straight from the book and kept
// in the page, so they read with no signal.
const RULE_GROUPS = [
  ["Rolling", ["s-roots", "s-permissions", "how-permissions-stack", "s-building-die", "s-the-roll", "s-intents", "s-splitting", "s-going-beyond", "s-teamwork"]],
  ["The round", ["s-round", "s-telegraphs", "s-actions", "s-answering", "s-extra-actions"]],
  ["Aura and the tracks", ["s-aura", "getting-it-back", "s-tracks", "s-abilities"]],
  ["When it lands", ["s-defending", "s-defend", "s-intercept", "s-armour", "s-armour-quality", "s-consequences", "s-fear-gets-through"]],
  ["Wounds", ["s-blaze", "s-healing", "s-vulnerable"]],
  ["Attunement", ["s-attunement", "attunement-stages"]],
  ["Everything else", ["s-conditions", "s-bonds", "s-trouble", "s-aspiration", "s-good-aspiration"]],
  ["Downtime", ["your-slots", "recover", "grow", "s-downtime-attunement", "s-downtime-rolls"]],
];
function rulesTab() {
  const box = (key, title, html) => `<details class="cc-rulebox" data-open="${key}"${ui.open.has(key) ? " open" : ""}><summary>${title}</summary><div class="cc-rule">${html}</div></details>`;
  const conds = ["against", "for"].map((kind) => `<h3>${kind === "for" ? "For you" : "Against you"}</h3><ul class="cc-list">${DATA.conditions.filter((x) => x.kind === kind).map((x) => `<li class="cc-item"><p><b><em>${esc(x.name)}</em></b> ${x.passive} Spend it and ${x.active}</p></li>`).join("")}</ul>`).join("");
  return `<section class="cc-sec cc-rules" aria-labelledby="cc-rules-h"><h2 id="cc-rules-h">Rules on tap</h2>
    <p class="cc-lead">Straight from the book, and they work with no signal. The whole book’s in the <a href="/rules/">rules</a>.</p>
    ${RULE_GROUPS.map(([title, ids]) => `<h3 class="cc-h3">${title}</h3>${ids.filter((id) => RULE[id]).map((id) => box(`r-${id}`, esc(RULE[id].title), ruleHtml(id))).join("")}`).join("")}
    <h3 class="cc-h3">Conditions</h3>${box("r-conds", "Conditions to start with", conds)}</section>`;
}


// ---------------------------------------------------------------- rolling

// tele: the telegraph it's answering (table.js), whose die it's up against,
// with whoever's put their action in (with), whose steps go in as friends'.
// work: a stake or an event on the live table's scene, and its die, or the
// number it already rolled this round (held), which stands.
function openAction({ root = null, spec = "", tele = null, work = null } = {}) {
  const c = normal(current());
  if (!c) return;
  const sp = spec && c.specialties.some((x) => R.specKey(x.name) === R.specKey(spec)) ? spec : "";
  openRoll({ kind: "action", mode: "build", root: R.ROOTS.includes(root) ? root : sp ? R.rootFor(c, sp) : R.bestRoot(c), spec: sp, pitch: false, items: new Set(), other: 0, borrow: new Set(), beyond: false, extra: [], friends: (tele?.with ?? []).map((w) => w.steps), handed: 0, conds: new Set(), count: null, shape: 0, vs: tele ? tele.d : work ? (work.held != null ? -1 : work.d) : 0, vsRolled: work?.held ?? 4, work, mark: 0, dice: [], opp: null, oppSize: 0, log: [], pick: null, pads: [], padOpp: false, spinning: false, intents: {}, owns: new Set(), tele });
}
// A dialog that's open already turns over to the next one.
function openRoll(r) {
  roll = r;
  if (dialog.open) renderDialog(false);
  else openDialog();
}

// Through a bond thread that's whole you can borrow one of their specialties,
// or one of a faction's assets, for 1 Aura. A strained or snapped thread
// lends nothing, and nor does a hostile one.
// In a campaign that includes a thread that's only on the other one's sheet.
const lendersOf = (c, s) => [...new Set(allThreads(current(), c).filter((p) => p.threads.some((t) => t.kind !== "hostile" && threadState(s, p.person, t) === "whole")).map((p) => p.person))];
const borrowedIn = (c, s, r) => [...(r.borrow ?? [])].filter((p) => lendersOf(c, s).includes(p));
function borrowGroup(c, s, r) {
  const lenders = lendersOf(c, s);
  if (!lenders.length) return "";
  return `<h3>Through a bond thread</h3>${lenders.map((p) => `<button type="button" class="cc-line is-aura" data-act="borrow" data-k="${esc(p)}"${pressed(r.borrow.has(p))}><span class="tick" aria-hidden="true"></span><span>Borrow from ${esc(p)} <small>one of their specialties, or a faction’s asset</small></span></button>`).join("")}`;
}

// Count a roll the way Steps and Dice does (roots.js), then the dice it
// makes: one split for every action in it, and past 6 steps more dice.
function counted(r, c, s) {
  const k = R.countRoll(c, s, { root: r.root, spec: r.spec, items: [...r.items], other: r.other, borrow: borrowedIn(c, s, r), pitch: r.pitch, beyond: r.beyond, extra: r.extra, friends: r.friends, handed: r.handed, conds: [...r.conds] });
  const { fewest, most } = diceRange(k.total, k.splits);
  const count = clamp(r.count ?? fewest, fewest, most);
  const shapes = diceShapes(k.total, count);
  const shape = clamp(r.shape, 0, shapes.length - 1);
  const dice = shapes[shape] ?? stepsToDice(k.total);
  const canBuy = R.actionsMax(c) - 1;
  const short = k.aura > s.aura ? `You’ve got ${s.aura} Aura, and this needs ${k.aura}.`
    : k.bought > canBuy ? (canBuy ? `With ${c.archetypes.length} archetypes you can buy ${canBuy === 1 ? "one extra action" : `${canBuy} extra actions`} a round.` : "With one archetype there’s no extra action to buy. Hold your action, come out of hiding, or take your time.") : "";
  return { ...k, fewest, most, count, shapes, shape, dice, short };
}
const andList = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");
// "Body and Locks", "Body, Stealth and Knives", "Body and Locks, twice".
function rollName(r, k) {
  const specs = [k.spec?.name, ...k.extras.filter((x) => !x.again).map((x) => x.spec)].filter(Boolean);
  const again = k.extras.filter((x) => x.again).length;
  return `${andList([r.root, ...specs])}${again ? (again === 1 ? ", twice" : `, ${again + 1} times`) : ""}`;
}

const stepper = (name, value, min, max, label, i = "") => `<span class="cc-step"><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${i}" data-d="-1" aria-label="${label}: one less"${off(value <= min)}>−</button><output>${value}</output><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${i}" data-d="1" aria-label="${label}: one more"${off(value >= max)}>+</button></span>`;

// The dice a roll card's about to roll, front and centre in its head, in
// their real shapes: [size, whose, class]. Theirs comes after an "against".
const liveDice = (list) => `<span class="cc-dice-row" aria-hidden="true">${list.map(([d, own, cls = ""]) => `${cls === "is-vs" ? '<span class="cc-vs">against</span>' : ""}${kitDie(d, { own, hide: true, cls })}`).join("")}</span>`;

// A die's intent: tap one of the usual ones, or write your own.
function intentRow(key, size, label, presets, cls = "on", extra = "") {
  const own = roll.owns.has(key);
  const value = roll.intents[key] ?? "";
  const name = `${label}d${size}`; // "your d6", "the Mark d10", "their d8"
  const chip = (p) => `<button type="button" class="cc-chipbtn sm" data-act="intent" data-k="${key}" data-v="${esc(p)}"${pressed(!own && value === p)}>${esc(p)}</button>`;
  return `<div class="cc-intent">${kitDie(size, { own: cls === "them" ? "them" : "you", label: name, cls: "cc-intent-die" })}<div class="cc-chips" role="group" aria-label="What ${esc(name)} is for">${presets.map(chip).join("")}<button type="button" class="cc-chipbtn sm" data-act="intent" data-k="${key}" data-v=""${pressed(own)}>Your own</button></div>${extra}
    ${own ? `<input class="cc-own-intent" data-in="intent" data-k="${key}" value="${esc(value)}" maxlength="40" autocomplete="off" placeholder="What it’s trying to do" aria-label="What ${esc(name)} is for, in your words">` : ""}</div>`;
}
// Where an extra action came from. Only 3 Aura counts against the cap.
const VIAS = [["aura", "3 Aura"], ["held", "I held my action"], ["hiding", "Coming out of hiding"], ["time", "Taking my time, outside a round"], ["boon", "A Boon that says so"]];

// The roll card: a Root and a specialty that fit how you're doing it, the
// items you're using, and anything else that fits for 1 Aura. It counts as
// you tap.
function buildView(c, s) {
  const r = roll;
  const k = counted(r, c, s);
  const items = R.itemsOf(c, s);
  const name = rollName(r, k);
  const rootChip = (root) => `<button type="button" class="cc-chipbtn" data-act="root" data-v="${root}"${pressed(r.root === root)}>${root} <small>${c.roots[root]}</small></button>`;
  const specChip = (sp) => `<button type="button" class="cc-chipbtn" data-act="spec" data-v="${esc(sp.name)}"${pressed(R.specKey(r.spec) === R.specKey(sp.name))}>${esc(sp.name)} <small>${sp.steps}</small></button>`;
  const dice = [...k.dice.map((size, i) => [String(i), size, "your "]), ...(r.mark ? [["m", r.mark, "the Mark "]] : [])];
  const extraRow = (x, i) => `<div class="cc-extra"><label class="cc-field">Extra action ${i + 1} brings <select data-in="xspec" data-i="${i}"><option value=""${!x.spec ? " selected" : ""}>${esc(k.spec?.name ?? r.root)} again, +1 step</option>${c.specialties.filter((sp) => R.specKey(sp.name) !== R.specKey(r.spec)).map((sp) => `<option value="${esc(sp.name)}"${R.specKey(x.spec) === R.specKey(sp.name) ? " selected" : ""}>${esc(sp.name)}, ${steps(sp.steps)}</option>`).join("")}</select></label>
    <label class="cc-field">It comes from <select data-in="xvia" data-i="${i}">${VIAS.map(([v, t]) => `<option value="${v}"${x.via === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
    <button type="button" class="cc-x sm" data-act="x-del" data-i="${i}" aria-label="Take extra action ${i + 1} out">${ICON.close}</button></div>`;
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(name)}</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...k.dice.map((d) => [d, "you"]), ...(r.mark ? [[r.mark, "you", "is-mark"]] : []), ...(r.vs > 0 ? [[r.vs, "them", "is-vs"]] : [])])}<span><b>${steps(k.total)}</b>, ${diceLabel(k.dice)}${r.mark ? `, and the Mark d${r.mark}` : ""}${r.vs > 0 ? ` against their d${r.vs}` : r.vs === -1 ? ` against ${r.vsRolled}` : ""}</span></p>
      ${k.aura ? `<p class="cc-costs"><span class="chip is-aura">${k.aura} Aura</span></p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">${table.forLine(r)}
    <fieldset class="cc-group"><legend>Your Root <small>how you’re doing it</small></legend><div class="cc-chips" role="group">${R.ROOTS.map(rootChip).join("")}</div></fieldset>
    <fieldset class="cc-group"><legend>Your specialty <small>what you’re doing</small></legend><div class="cc-chips" role="group">${c.specialties.map(specChip).join("")}<button type="button" class="cc-chipbtn" data-act="spec" data-v=""${pressed(!r.spec)}>None that fits</button></div>
      ${k.spec ? `<button type="button" class="cc-line is-aura" data-act="pitch"${pressed(r.pitch)}><span class="tick" aria-hidden="true"></span><span>I’m making a case for it <small>1 Aura. If it plainly fits, it’s free.</small></span></button>` : '<p class="cc-lead">Nothing fits? Your Root on its own still has a go, and every roll’s at least a d2.</p>'}</fieldset>
    ${items.length ? `<fieldset class="cc-group"><legend>Items you’re using <small>1 each when it fits</small></legend>${items.map((x) => `<button type="button" class="cc-line" data-act="item" data-k="${esc(x.key)}"${pressed(r.items.has(x.key))}><span class="tick" aria-hidden="true"></span><span>${esc(nameOf(c, x.where, x.name))}${x.where === "attuned" ? " <small>attuned</small>" : ""}</span></button>`).join("")}</fieldset>` : ""}
    <fieldset class="cc-group"><legend>What it’s up against</legend>
      <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="vs" data-v="0"${pressed(r.vs === 0)}>Nothing to beat</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="vs" data-v="${d}"${pressed(r.vs === d)} aria-label="Their d${d}">d${d}</button>`).join("")}<button type="button" class="cc-chipbtn" data-act="vs" data-v="-1"${pressed(r.vs === -1)}>Its number this round</button></div>
      ${r.vs === -1 ? `<div class="cc-stepper"><span>The number to beat <small>what it already rolled this round, or the GM’s number</small></span>${stepper("vsRolled", r.vsRolled, 1, 30, "The number to beat")}</div>` : `<p class="cc-lead">Tap its die and the phone rolls it with yours. A threat rolls its defence once a round, and that roll stands for everyone who goes at it.</p>`}
      <details class="cc-mark"${r.mark || ui.open.has("mark") ? " open" : ""} data-open="mark"><summary>Is it Marked?${r.mark ? ` <small>d${r.mark}</small>` : ""}</summary>
        <p class="cc-small">Anyone who goes at a Marked creature rolls the Mark die too, as one more die against it.</p>
        <div class="cc-chips" role="group" aria-label="Its Mark"><button type="button" class="cc-chipbtn" data-act="mark" data-v="0"${pressed(!r.mark)}>No Mark</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="mark" data-v="${d}"${pressed(r.mark === d)} aria-label="Marked d${d}">d${d}</button>`).join("")}</div></details></fieldset>
    <details class="cc-group" data-open="bring"${ui.open.has("bring") ? " open" : ""}><summary>Bring something in <small>1 Aura and a step each${k.other + k.borrowed ? `, ${k.other + k.borrowed} in` : ""}</small></summary>
      <p class="cc-lead">Anything else that fits: the ground (a chandelier, a crowd, the rain), a threat’s tag you know about, or a Catch turned your way for a moment.</p>
      <div class="cc-stepper${r.other ? " is-aura" : ""}"><span>Something that fits</span>${stepper("other", r.other, 0, 9, "Something brought in")}</div>${borrowGroup(c, s, r)}</details>
    ${s.conditions.length ? `<fieldset class="cc-group"><legend>Conditions on you</legend>${s.conditions.map((x) => `<button type="button" class="cc-line" data-act="cond" data-k="${esc(x.name)}"${pressed(r.conds.has(x.name))}><span class="tick" aria-hidden="true"></span><span><em>${esc(x.name)}</em> d${x.die} <small>${x.kind === "for" ? "one step more" : "one step less"}</small></span></button>`).join("")}<p class="cc-lead">Tap one on when it fits this roll.</p></fieldset>` : ""}
    <details class="cc-group" data-open="more"${ui.open.has("more") ? " open" : ""}><summary>Friends, extra actions and going beyond${r.friends.length || r.handed || r.extra.length || r.beyond ? " <small>in use</small>" : ""}</summary>
      <h3>Friends joining in</h3>
      ${r.friends.map((f, i) => `<div class="cc-stepper"><span>Friend ${i + 1}’s steps <small>their specialty and their items</small></span>${stepper("friend", f, 1, 18, `Friend ${i + 1}’s steps`, i)}<button type="button" class="cc-x sm" data-act="friend-off" data-i="${i}" aria-label="Friend ${i + 1} drops out">${ICON.close}</button></div>`).join("")}
      <button type="button" class="button sm" data-act="friend-on">A friend joins in</button>
      <p class="cc-lead">It’s one Root a roll, yours, and every action in it brings a specialty and the items it’s using. Every action gives you a split, and nobody pays Aura for it.</p>
      <div class="cc-stepper"><span>Steps a Leader handed you <small>they don’t give you a split</small></span>${stepper("handed", r.handed, 0, 18, "Steps from a Leader")}</div>
      <h3>Your own extra action</h3>
      ${r.extra.map(extraRow).join("")}
      <button type="button" class="button sm" data-act="x-add">${r.extra.length ? "Another extra action" : "An extra action goes in"}</button>
      <p class="cc-lead">Another specialty brings its steps as a new approach, and the same one again is 1 more. The most actions you can have in a round is one for each archetype, so you can buy ${R.actionsMax(c) - 1 === 1 ? "one" : R.actionsMax(c) - 1} for 3 Aura each. Holding, hiding and a Boon are on top.</p>
      <h3>Going beyond</h3>
      <button type="button" class="cc-line is-aura" data-act="beyond"${pressed(r.beyond)}><span class="tick" aria-hidden="true"></span><span>Go beyond what it normally does <small>1 Aura, and no step</small></span></button></details>
    <fieldset class="cc-group"><legend>Your dice</legend>
      ${k.most > k.fewest ? `<div class="cc-stepper"><span>How many dice <small>${k.splits === 1 ? "your action gives you a split" : `${k.splits} splits, one for every action in the roll`}</small></span>${stepper("count", k.count, k.fewest, k.most, "How many dice")}</div>` : ""}
      ${k.shapes.length > 1 ? `<div class="cc-chips" role="group" aria-label="How your steps are shared out">${k.shapes.map((sh, i) => `<button type="button" class="cc-chipbtn" data-act="shape" data-i="${i}"${pressed(i === k.shape)}>${diceLabel(sh)}</button>`).join("")}</div>` : ""}
      <p class="cc-lead">Give every die an intent before you roll: what it’s trying to do, and who it’s aimed at. Tap one in and it’s on the result.</p>
      ${dice.map(([key, size, label]) => intentRow(key, size, label, INTENTS[r.root] ?? INTENTS.Body, key === "m" ? "mark" : "on")).join("")}</fieldset>
  </div>
  <div class="dlg-foot">${k.short ? `<p class="cc-warn" role="alert">${esc(k.short)}</p>` : ""}
    <button type="button" class="button primary" data-act="go"${off(k.short)}>Roll</button><button type="button" class="button" data-act="go-real"${off(k.short)}>Roll real dice</button></div>`;
}

function outcome(d) {
  if (roll.opp == null) return null;
  const t = d.nat + d.plus;
  return t > roll.opp ? "beat" : t === roll.opp ? (d.won ? "won" : "tie") : "under";
}
const lastOf = () => ({ name: roll.name, steps: roll.total, dice: roll.dice.map((d) => ({ size: d.size, total: d.nat + d.plus, out: outcome(d), mark: Boolean(d.mark) })), opp: roll.opp, at: Date.now() });

// The Aura a throw pays, as the dice land: 1 for every die that won and 1
// for every top face. Anything added after the roll pays nothing more.
function auraSaid(won, tops, n, s, c, over) {
  const said = [won ? `${won === 1 ? "One die" : `${won} dice`} won` : "", tops ? `${tops === 1 ? "a top face" : `${tops} top faces`}` : ""].filter(Boolean).join(" and ");
  const max = c.numbers.aura;
  return `${cap(said)}, so ${n} Aura.${s.acting && s.aura > max ? ` You’re on ${s.aura} while you’re acting, past your ${max}.` : over}`;
}
function settle(s, c, which) {
  let won = 0;
  let tops = 0;
  let n = 0;
  for (const i of which) {
    const d = roll.dice[i];
    const win = roll.opp != null && d.nat > roll.opp;
    won += win ? 1 : 0;
    tops += d.nat === d.size ? 1 : 0;
    n += R.paysOf(d.nat, d.size, win);
  }
  roll.tops = tops;
  roll.auraNote = "";
  if (n) {
    const over = gainAura(s, c, n);
    roll.auraNote = auraSaid(won, tops, n, s, c, over);
    roll.log.push(roll.auraNote);
  }
  s.last = lastOf();
}

function go(real) {
  const ch = current();
  const c = normal(ch);
  const k = counted(roll, c, ch.state);
  if (k.short) return;
  change(`rolling ${rollName(roll, k)}`, (s) => {
    const r = roll;
    s.aura -= k.aura;
    // An action's your own turn: Aura can go past your maximum till you've finished.
    s.acting = true;
    r.log = [];
    const paidFor = [k.spec && r.pitch && `making the case for ${k.spec.name}`, k.other && `${k.other === 1 ? "something" : `${k.other} things`} brought in`, ...k.borrowed ? borrowedIn(c, s, r).map((p) => `one of ${p}’s specialties`) : [], r.beyond && "going beyond", k.bought && (k.bought === 1 ? "an extra action" : `${k.bought} extra actions`)].filter(Boolean);
    if (k.aura) r.log.push(`Paid ${k.aura} Aura for ${andList(paidFor)}.`);
    r.name = rollName(r, k);
    r.total = k.total;
    r.used = [...r.items];
    const intent = (key) => String(r.intents[key] ?? "").trim();
    r.dice = k.dice.map((size, i) => ({ size, nat: 0, plus: 0, won: false, intent: intent(i) }));
    if (r.mark) r.dice.push({ size: r.mark, nat: 0, plus: 0, won: false, mark: true, intent: intent("m") });
    r.oppSize = r.vs > 0 ? r.vs : 0;
    r.opp = r.vs === -1 ? r.vsRolled : null;
    r.real = real;
    r.pick = null;
    if (real) {
      r.mode = "pad";
      r.pads = r.dice.map((_, i) => i);
      r.padOpp = r.oppSize > 0;
    } else {
      for (const d of r.dice) d.nat = throwDie(d.size);
      if (r.oppSize) r.opp = throwDie(r.oppSize);
      r.mode = "result";
      settle(s, c, r.dice.map((_, i) => i));
      r.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
  else if (!real && roll?.mode === "result") landed(true);
}

// The Sigil dice tumble and land one after another, with a knock each when
// sound's on. A tap skips it.
function spin() {
  ui.stopSpin?.();
  ui.stopSpin = tumble(dialog, () => {
    ui.stopSpin = null;
    if (!roll?.spinning) return;
    roll.spinning = false;
    ui.reveal = true;
    renderDialog();
    landed(false);
  });
}

// The dice have settled: a knock if they were rolled with no tumble, and a
// chime and a buzz for any top face, as the Aura comes back.
function landed(knock) {
  if (knock) feel.land();
  if (roll?.tops) feel.top();
}

function padView(title, rows, ready) {
  const pad = ([label, key, size, value]) => `<fieldset class="cc-pad"><legend>${label}</legend><div class="cc-nums">${Array.from({ length: size }, (_, j) => `<button type="button" class="cc-num" data-act="pad" data-k="${key}" data-v="${j + 1}"${pressed(value === j + 1)}>${j + 1}</button>`).join("")}</div></fieldset>`;
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(title)}</h2><p class="cc-small">Roll them, then tap what each one came up.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">${rows.map(pad).join("")}</div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="pad-done"${off(!ready)}>See how it went</button></div>`;
}

// Push from an archetype, on a roll's die once it's landed: +2, or more for
// the same archetype taken again, paid out of the tracks. One about defence
// dice goes on When it lands, and the rest on an action.
const pushesOf = (c, defence) => R.archetypesOf(c, DATA.build).flatMap((a) => a.abilities.filter((x) => x.push).map((x) => ({ arch: a.name, home: a.home, bonus: x.push, html: x.html, text: x.text }))).filter((p) => /\bdefen[cs]e\b|\bDefend\b|\btrack\b/i.test(p.text) === defence);
// A passive awakening holding Aura that adds to a die, on a roll its thing's in.
const wakesOn = (c, s, r, defence) => R.passivesOf(c).filter((w) => R.addsToDie(w) && (s.store[w.key] ?? 0) > 0 && (defence ? R.onDefence(w) : !R.onDefence(w) && (r.used ?? []).includes(`attuned|${w.a}`)));
// The rest of an archetype's abilities, paid for from a roll card.
const otherAbilities = (c) => R.archetypesOf(c, DATA.build).flatMap((a) => a.abilities.map((x, j) => ({ ...x, j, arch: a.name, home: a.home })).filter((x) => !x.push));

// What a pick on a die is waiting for: which die, then for a Push, how to pay.
function pickNote(c, s, list) {
  const p = roll.pick;
  if (!p) return "";
  if (p.type === "reroll") return `<div class="cc-note" role="status"><p>Tap a die to roll it again, or roll them all. It’s 1 Resolve either way.</p><div class="cc-row"><button type="button" class="button sm" data-act="reroll-all">Roll them all</button><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
  if (p.die == null) return `<div class="cc-note" role="status"><p>Tap the die to put +${p.bonus} on.</p><div class="cc-row"><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
  const ways = R.payWays(s, p.home);
  return `<div class="cc-note" role="status"><p>+${p.bonus} on your d${list[p.die].size}, for ${esc(p.arch)}’s Push. Pay for it:</p><div class="cc-row">${ways.map((w) => `<button type="button" class="button sm" data-act="push-pay" data-w="${esc(JSON.stringify(w))}">${R.payLabel(w)}</button>`).join("")}<button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div>${ways.length ? "" : "<p>None of your tracks has a size to pay with.</p>"}</div>`;
}

function resultView(c, s, ch) {
  const r = roll;
  const outs = r.dice.map(outcome);
  const words = { beat: "Beat it", won: "Tie, won for 1 Aura", tie: "Tie", under: "Under" };
  const picking = r.pick && !r.spinning && (r.pick.type === "reroll" || r.pick.die == null);
  // Each die as the kit draws it, its number on the hub: a top face lights the
  // whole token, a lost one goes dark, and a tie's hub is dashed.
  const stateOf = (d, o) => (d.nat === d.size && !d.plus ? "top" : o === "under" ? "low" : o === "tie" ? "tie" : "");
  const die = (d, i) => {
    const v = d.nat + d.plus;
    if (r.spinning) return kitDie(d.size, { face: d.nat, spin: true, label: `Your d${d.size}, rolling` });
    const drawn = kitDie(d.size, { face: v, state: stateOf(d, outs[i]), label: `${d.mark ? "The Mark" : "Your"} d${d.size} came up ${v}` });
    if (picking) return `<button type="button" class="cc-pickdie" data-act="pick" data-i="${i}" aria-label="The d${d.size} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>`;
    return drawn;
  };
  const against = r.oppSize ? `against their d${r.oppSize}, which came up ${r.spinning ? "…" : r.opp}` : r.opp != null ? `against the ${r.opp} it already rolled` : "with nothing to beat";
  // Their die only goes dark when every one of yours beat it.
  const theyLost = outs.length > 0 && outs.every((o) => o === "beat" || o === "won");
  const them = r.oppSize ? `<div class="cc-them"${r.spinning ? ' data-act="skip"' : ""}><span class="vs" aria-hidden="true">against</span><span class="k">Their d${r.oppSize}</span>${kitDie(r.oppSize, { own: "them", face: r.opp, spin: r.spinning, state: !r.spinning && theyLost ? "low" : "", label: r.spinning ? `Their d${r.oppSize}, rolling` : `Their d${r.oppSize} came up ${r.opp}` })}</div>`
    : r.opp != null ? `<div class="cc-them"><span class="vs" aria-hidden="true">against</span><span class="k">To beat</span><span class="cc-tobeat">${r.opp}</span></div>` : "";
  const pushes = pushesOf(c, false);
  const wakes = wakesOn(c, s, r, false);
  const actives = c.attuned.flatMap((a, i) => ((r.used ?? []).includes(`attuned|${i}`) ? a.awakenings.filter((w) => w.kind === "active").map((w) => ({ a: i, w })) : []));
  const canReroll = R.roomOf(s, "resolve") >= 1 && (r.opp == null || outs.some((o) => o === "tie" || o === "under"));
  const offers = r.spinning || r.pick ? "" : [
    ...outs.map((o, i) => (o === "tie" ? `<button type="button" class="button sm" data-act="win-tie" data-i="${i}"${off(s.aura < 1)}>Win the tie on the d${r.dice[i].size}: 1 Aura</button>` : "")),
    ...pushes.map((p) => `<button type="button" class="button sm" data-act="push" data-a="${esc(p.arch)}"${off(!R.payWays(s, p.home).length)}>${esc(p.arch)}’s Push: +${p.bonus} on a die</button>`),
    ...wakes.map((w) => `<button type="button" class="button sm is-aura" data-act="wakeplus" data-k="${esc(w.key)}">${esc(w.name)}: +${s.store[w.key]} on a die</button>`),
    ...actives.map(({ a, w }) => `<button type="button" class="button sm is-aura" data-act="wake" data-a="${a}" data-n="${esc(w.name)}" data-v="1"${off(s.aura < 1)}>${esc(w.name)}: 1 Aura</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: 1 Resolve</button>` : "",
  ].join("");
  const others = otherAbilities(c);
  const how = [
    ...(pushes.length && !r.spinning && !r.pick ? [`<p class="cc-lead">${pushes.map((p) => `<b>${esc(p.arch)}’s Push:</b> ${p.html}`).join(" ")}</p>`] : []),
    ...(r.log.length ? [`<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`] : []),
  ].join("");
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(r.name)}</h2><p class="cc-small">${steps(r.total)}, ${esc(against)}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.dice.length)}">
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${r.dice.map((d, i) => `<li class="res is-${r.spinning ? "spin" : outs[i] ?? "none"}">${die(d, i)}<span class="res-die">${d.mark ? "Mark " : ""}d${d.size}${d.plus ? ` +${d.plus}` : ""}</span>${d.intent ? `<span class="res-intent">${esc(d.intent)}</span>` : ""}${!r.spinning && outs[i] ? `<b class="res-out">${words[outs[i]]}</b>` : ""}${!r.spinning && d.nat === d.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
    ${them}
    ${r.spinning ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${r.auraNote && !r.spinning ? `<p class="cc-topnote">${esc(r.auraNote)}</p>` : ""}
    ${(r.tele || r.work) && !r.spinning && !r.pick && r.opp != null ? table.rollNote(r) : ""}
    ${r.spinning ? "" : pickNote(c, s, r.dice) || payNote(c, s)}
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    <p class="cc-small cc-left">You’ve got ${s.aura} Aura${s.acting ? ", and you’re acting" : ""}. ${glanceTracks(s)}.</p>
    ${others.length && !r.spinning && !r.pick ? `<details class="cc-how" data-open="abil"${ui.open.has("abil") ? " open" : ""}><summary>Pay for an ability</summary>${others.map((x) => `<p><b>${esc(x.arch)}, ${esc(x.name)}:</b> ${x.html}</p><div class="cc-row"><button type="button" class="button sm" data-act="ability" data-a="${esc(x.arch)}" data-j="${x.j}"${off(!R.payWays(s, x.home).length)}>Pay for ${esc(x.name)}</button></div>`).join("")}</details>` : ""}
    ${how && !r.spinning ? `<details class="cc-how" data-open="how"${ui.open.has("how") ? " open" : ""}><summary>How it counted</summary>${how}</details>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- when it lands

// When it lands: whatever nobody answered rides on your tracks, each rolled
// once for the Root it's at, and each die stops one telegraph there that it
// meets or beats. Defend as your action and a Root and a specialty roll with
// them, your armour as items, and each of those dice stops one too. What
// gets through costs a size off its track, unless armour on that Root takes
// it, you pay 2 for 1, or something else the GM names lands instead.
// pre: the telegraphs that landed on this character (table.js), their dice
// and what each was doing, ready to roll against. Till stage 4 the table
// says blows and fear, so fear comes in at Mind and can be moved to Soul.
function openDefence(pre = null) {
  const c = normal(current());
  if (!c) return;
  const at = pre?.against === "confidence" ? "Mind" : "Body";
  // A blow from the live table stays at Body. Fear can go at Mind or Soul,
  // but never Body (stage 4 of notes/roots-plan.md aims them at a Root).
  const incoming = (pre?.incoming ?? []).map((d, j) => ({ d, at, intent: String(pre.intents?.[`d${j}`] ?? "").slice(0, 40), fixed: Boolean(pre?.teles?.[j]) && at === "Body", fear: Boolean(pre?.teles?.[j]) && at !== "Body" }));
  const armour = piecesOf(c).filter((a) => (a.root ?? "Body") === "Body" && !isBroken(current().state, a)).map((a) => `equipment|${a.name}`);
  openRoll({ kind: "defence", mode: "build", incoming, add: at, defend: Boolean(pre?.defend), root: "Body", spec: "", items: new Set(armour), count: null, shape: 0, mine: [], opp: [], assign: [], paid: [], harm: {}, extra: {}, pick: null, log: [], spinning: false, padOpp: true, swap: null, camp: pre?.camp ?? null, teles: pre?.teles ?? [], from: pre?.from ?? {}, intents: {}, owns: new Set() });
}

// The dice you've got against it: one track for each Root something's at,
// and Defend's Root and specialty on top when it was your action.
function defencePool(c, s, r) {
  const roots = R.ROOTS.filter((root) => r.incoming.some((x) => x.at === root));
  const tracks = roots.map((root) => ({ t: R.trackAt[root], root, size: s.tracks[R.trackAt[root]] }));
  if (!r.defend) return { tracks, def: null };
  const k = R.countRoll(c, s, { root: r.root, spec: r.spec, items: [...r.items], conds: [] });
  const { fewest, most } = diceRange(k.total, 1);
  const count = clamp(r.count ?? fewest, fewest, most);
  const shapes = diceShapes(k.total, count);
  const shape = clamp(r.shape, 0, shapes.length - 1);
  return { tracks, def: { ...k, fewest, most, count, shapes, shape, dice: shapes[shape] ?? stepsToDice(k.total) } };
}

// An intent like "pin" or "frighten" is a condition when it gets through, and
// its die is the die that placed it.
function condOf(text) {
  const word = String(text ?? "").trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "");
  if (word.length < 3) return null;
  return DATA.conditions.find((x) => x.kind === "against" && x.name.toLowerCase().startsWith(word) && x.name.length - word.length <= 3) ?? null;
}
// The conditions on you that make a hit one more size, like Exposed.
const vulnsOn = (s) => s.conditions.filter((x) => x.kind === "against" && /\bvulnerable\b/i.test(COND.get(x.name)?.passive ?? "")).map((x) => x.name);

const valOf = (m) => m.nat + m.plus;
// Can this die stop that telegraph? A track only stops what's at its own Root.
const fits = (m, tele) => (m.src === "track" ? m.root === tele.at : true);
// Each of your dice stops one telegraph. The phone matches them up so the
// most get stopped: the lowest telegraph takes the lowest roll that stops it,
// tracks first since they only stop their own Root, then Defend's dice on
// what's at its Root, then anywhere. A die left over goes on what got through,
// so it says what it came up against. The player can swap two.
function assignBest(r) {
  r.assign = r.incoming.map(() => null);
  const used = new Set();
  const order = r.incoming.map((_, j) => j).sort((a, b) => r.opp[a] - r.opp[b]);
  const pass = (ok) => {
    for (const j of order) {
      if (r.assign[j] != null) continue;
      const can = r.mine.map((m, i) => ({ m, i })).filter(({ m, i }) => !used.has(i) && fits(m, r.incoming[j]) && valOf(m) >= r.opp[j] && ok(m, r.incoming[j])).sort((a, b) => valOf(a.m) - valOf(b.m));
      if (can[0]) {
        r.assign[j] = can[0].i;
        used.add(can[0].i);
      }
    }
  };
  pass((m) => m.src === "track");
  pass((m, tele) => m.src === "defend" && tele.at === r.root);
  pass((m) => m.src === "defend");
  for (const j of order) {
    if (r.assign[j] != null) continue;
    const spare = r.mine.map((m, i) => ({ m, i })).filter(({ m, i }) => !used.has(i) && fits(m, r.incoming[j])).sort((a, b) => valOf(b.m) - valOf(a.m))[0];
    if (spare) {
      r.assign[j] = spare.i;
      used.add(spare.i);
    }
  }
  r.swap = null;
  r.swapped = false;
}

// Which of your dice stops which telegraph. Ties go to you.
function blocks(r) {
  return r.incoming.map((x, j) => {
    const pair = r.assign[j];
    const mine = pair != null && r.mine[pair] ? valOf(r.mine[pair]) : null;
    return { j, size: x.d, at: x.at, v: r.opp[j], pair, mine, by: mine != null && mine >= r.opp[j] ? pair : null, intent: x.intent };
  });
}

function defenceGo(real) {
  const r = roll;
  const ch = current();
  const c = normal(ch);
  if (!r.incoming.length || !c) return;
  const p = defencePool(c, ch.state, r);
  change("rolling your defence", (s) => {
    // The telegraphs land at the end of the round, once everyone's acted.
    const over = s.acting ? R.doneActing(s, c) : 0;
    r.log = [];
    if (over) r.log.push(`You’d finished acting, so the ${over} Aura over your ${c.numbers.aura} went.`);
    r.mine = [...p.tracks.map((x) => ({ size: x.size, nat: 0, plus: 0, src: "track", root: x.root, t: x.t })), ...(p.def ? p.def.dice.map((size) => ({ size, nat: 0, plus: 0, src: "defend" })) : [])];
    r.defName = p.def ? `${r.root}${p.def.spec ? ` and ${p.def.spec.name}` : ""}` : "";
    r.opp = r.incoming.map(() => 0);
    r.paid = r.incoming.map(() => "");
    r.harm = {};
    r.extra = {};
    r.pick = null;
    r.real = real;
    if (real) r.mode = "pad";
    else {
      for (const m of r.mine) m.nat = throwDie(m.size);
      r.opp = r.incoming.map((x) => throwDie(x.d));
      r.mode = "result";
      settleDefence(s, c);
      r.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
  else if (!real && roll?.mode === "result") landed(true);
}

// Every die that stops one pays 1 Aura, the same as any win, and every top
// face pays too. You're not acting, so it stops at your maximum.
function settleDefence(s, c, which = null) {
  const r = roll;
  if (!r.paid.some(Boolean)) assignBest(r);
  const stops = new Set(blocks(r).filter((h) => h.by != null).map((h) => h.by));
  const list = which ?? r.mine.map((_, i) => i);
  const won = list.filter((i) => stops.has(i)).length;
  const tops = list.filter((i) => r.mine[i].nat === r.mine[i].size).length;
  const n = list.reduce((t, i) => t + R.paysOf(r.mine[i].nat, r.mine[i].size, stops.has(i)), 0);
  r.tops = tops;
  r.auraNote = "";
  if (n) {
    const over = gainAura(s, c, n);
    r.auraNote = auraSaid(won, tops, n, s, c, over).replace(/^One die won/, "One die stopped one").replace(/^(\d+) dice won/, "$1 dice stopped one each");
    r.log.push(r.auraNote);
  }
}

const AT = { Body: "at your Body", Mind: "at your Mind", Soul: "at your Soul" };
function defenceBuild(c, s) {
  const r = roll;
  const p = defencePool(c, s, r);
  const rootChip = (root, act, now, extra = "") => `<button type="button" class="cc-chipbtn sm" data-act="${act}" data-v="${root}"${extra}${pressed(now === root)}>${root}</button>`;
  const rows = r.incoming.map((x, j) => `<li class="cc-inc"><div class="cc-inc-in">${kitDie(x.d, { own: "them", label: `Their d${x.d}` })}<div><p><b>Their d${x.d}</b> ${x.intent ? `<small>${esc(x.intent)}</small>` : ""}</p>
    <div class="cc-chips" role="group" aria-label="Where their d${x.d} is aimed">${R.ROOTS.map((root) => rootChip(root, "d-at", x.at, ` data-j="${j}"${off(x.fixed ? root !== x.at : x.fear && root === "Body")}`)).join("")}</div></div>
    ${r.teles?.[j] ? "" : `<button type="button" class="cc-x sm" data-act="d-del" data-i="${j}" aria-label="Take their d${x.d} off">${ICON.close}</button>`}</div></li>`).join("");
  const items = R.itemsOf(c, s);
  const armourNote = (x) => {
    const a = x.where === "equipment" ? pieceAt(c, x.key) : null;
    return a ? ` <small>armour on ${esc(a.root ?? "Body")}</small>` : x.where === "attuned" ? " <small>attuned</small>" : "";
  };
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...p.tracks.map((x) => [x.size, "you"]), ...(p.def ? p.def.dice.map((d) => [d, "you"]) : []), ...r.incoming.map((x, j) => [x.d, "them", j ? "is-them" : "is-vs"])])}<span>${p.tracks.length ? andList(p.tracks.map((x) => `your ${TN(x.t)} d${x.size}`)) : "Nothing’s coming at you yet"}${p.def ? `, and Defend ${diceLabel(p.def.dice)}` : ""}</span></p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <fieldset class="cc-group"><legend>What’s coming at you</legend>
      ${rows ? `<ul class="cc-incs">${rows}</ul>` : '<p class="cc-lead">Add each telegraph that landed on you, with its die and the Root it’s at.</p>'}
      <div class="cc-chips" role="group" aria-label="Where the next one’s aimed">${R.ROOTS.map((root) => rootChip(root, "d-add-at", r.add)).join("")}</div>
      <div class="cc-chips" role="group" aria-label="Its die">${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="d-add" data-v="${d}" aria-label="Add their d${d} ${AT[r.add]}">+ d${d}</button>`).join("")}</div>
      <p class="cc-lead">Blows and teeth are at your Body, fear, lies and pressure at your Mind, and despair, temptation and curses at your Soul.</p></fieldset>
    <fieldset class="cc-group"><legend>Your tracks <small>each one rolled once</small></legend>
      ${p.tracks.length ? p.tracks.map((x) => `<p>${kitDie(x.size, { label: `${TN(x.t)} d${x.size}`, cls: "cc-inline-die" })} <b>${TN(x.t)} d${x.size}</b> <small>stops one telegraph ${AT[x.root]}</small></p>`).join("") : '<p class="cc-lead">Nothing to roll yet.</p>'}</fieldset>
    <fieldset class="cc-group"><legend>Did you Defend?</legend>
      <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="d-defend" data-v="0"${pressed(!r.defend)}>No, it rides on my tracks</button><button type="button" class="cc-chipbtn" data-act="d-defend" data-v="1"${pressed(r.defend)}>I Defended as my action</button></div>
      ${r.defend ? `<p class="cc-lead">A Root and a specialty that fit how you’re defending, with your armour as items. Each die stops one telegraph it beats or ties, as long as how you’re defending fits it.</p>
        <div class="cc-chips" role="group" aria-label="Defend’s Root">${R.ROOTS.map((root) => `<button type="button" class="cc-chipbtn" data-act="d-root" data-v="${root}"${pressed(r.root === root)}>${root} <small>${c.roots[root]}</small></button>`).join("")}</div>
        <div class="cc-chips" role="group" aria-label="Defend’s specialty">${c.specialties.map((sp) => `<button type="button" class="cc-chipbtn" data-act="d-spec" data-v="${esc(sp.name)}"${pressed(R.specKey(r.spec) === R.specKey(sp.name))}>${esc(sp.name)} <small>${sp.steps}</small></button>`).join("")}<button type="button" class="cc-chipbtn" data-act="d-spec" data-v=""${pressed(!r.spec)}>None that fits</button></div>
        ${items.length ? items.map((x) => `<button type="button" class="cc-line" data-act="d-item" data-k="${esc(x.key)}"${pressed(r.items.has(x.key))}><span class="tick" aria-hidden="true"></span><span>${esc(nameOf(c, x.where, x.name))}${armourNote(x)}</span></button>`).join("") : ""}
        ${p.def && p.def.most > p.def.fewest ? `<div class="cc-stepper"><span>How many dice <small>your action gives you a split</small></span>${stepper("count", p.def.count, p.def.fewest, p.def.most, "How many dice")}</div>` : ""}
        ${p.def && p.def.shapes.length > 1 ? `<div class="cc-chips" role="group" aria-label="How Defend’s steps are shared out">${p.def.shapes.map((sh, i) => `<button type="button" class="cc-chipbtn" data-act="shape" data-i="${i}"${pressed(i === p.def.shape)}>${diceLabel(sh)}</button>`).join("")}</div>` : ""}
        <p class="cc-small">${steps(p.def.total)}, ${diceLabel(p.def.dice)}.</p>` : ""}</fieldset>
    ${ruleBox("s-defending")}
  </div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="d-go"${off(!r.incoming.length)}>Roll</button><button type="button" class="button" data-act="d-real"${off(!r.incoming.length)}>Roll real dice</button></div>`;
}

// What got through, and what it costs: a size off its track (or more for a
// vulnerability), a box on armour on that Root, 2 for 1 from the other two
// tracks, Stand firm, the condition it was going for, or whatever else the
// GM names.
function payView(h, r, s, c) {
  const t = R.trackAt[h.at];
  if (r.paid[h.j]) {
    const vulns = vulnsOn(s);
    const more = r.harm[h.j] && (r.extra[h.j] ?? 0) < vulns.length;
    return `<p class="cc-paid">${esc(r.paid[h.j])}</p>${more ? `<div class="cc-row"><button type="button" class="button sm" data-act="d-pay" data-j="${h.j}" data-what="vuln">${esc(vulns[r.extra[h.j] ?? 0])}: one more size off your ${TN(t)}</button>${piecesOf(c).filter((a) => (a.root ?? "Body") === h.at && leftOf(s, a) > 0).map((a) => `<button type="button" class="button sm" data-act="d-pay" data-j="${h.j}" data-what="vbox" data-k="${esc(`equipment|${a.name}`)}">Or one more box on ${esc(yours(a))}</button>`).join("")}</div>` : ""}`;
  }
  const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === h.at && leftOf(s, a) > 0);
  const cond = condOf(h.intent);
  const ways = R.twoForOne(s, t);
  const low = R.lowOf(s, t);
  const b = (what, label, extra = "", no = false) => `<button type="button" class="button sm" data-act="d-pay" data-j="${h.j}" data-what="${what}"${extra}${off(no)}>${label}</button>`;
  return `<div class="cc-row cc-pays">
    ${b("hit", s.tracks[t] <= low ? `Your ${TN(t)} takes it, and you Blaze` : `Your ${TN(t)} takes it: down to d${sizeDown(s.tracks[t])}`)}
    ${pieces.map((a) => b("box", `${cap(yours(a))} take${many(a) ? "" : "s"} it: tick a box${a.when ? `, ${esc(a.when)}` : ""}`, ` data-k="${esc(`equipment|${a.name}`)}"`)).join("")}
    ${ways.map((w) => b("two", `2 for 1: ${R.payLabel(w)}`, ` data-w="${esc(JSON.stringify(w))}"`)).join("")}
    ${(s.firm ?? 0) > 0 ? b("firm", `Stand firm: it does nothing (${s.firm} left)`) : ""}
    ${cond ? b("cond", `${esc(cond.name)} d${h.size} on you`) : ""}
    ${b("else", "Something else the GM names")}</div>`;
}
const many = (a) => !/^(a|an) /i.test(a.name) && /[^s]s$/i.test(String(a.name).trim());

function defenceResult(c, s, ch) {
  const r = roll;
  const hs = blocks(r);
  const spin = r.spinning;
  const picking = r.pick && !spin && (r.pick.type === "reroll" || r.pick.die == null);
  const mineDie = (m, i) => {
    const v = valOf(m);
    const label = m.src === "track" ? `Your ${TN(m.t)} d${m.size}` : `Your Defend d${m.size}`;
    if (spin) return kitDie(m.size, { face: m.nat, spin: true, label: `${label}, rolling` });
    const drawn = kitDie(m.size, { face: v, state: m.nat === m.size && !m.plus ? "top" : "", label: `${label} came up ${v}` });
    if (picking) return `<button type="button" class="cc-pickdie" data-act="pick" data-i="${i}" aria-label="${label} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>`;
    return drawn;
  };
  const row = (h) => {
    const stopped = h.by != null;
    const m = h.pair != null ? r.mine[h.pair] : null;
    const by = m ? (m.src === "track" ? `your ${TN(m.t)}’s ${valOf(m)}` : `your Defend’s ${valOf(m)}`) : "";
    const swapBtn = m && !r.paid.some(Boolean) ? `<button type="button" class="button sm" data-act="d-swap" data-j="${h.j}"${pressed(r.swap === h.j)}>${r.swap === h.j ? "Swap with…" : "Swap"}</button>` : "";
    return `<li class="cc-hit is-${stopped ? "stopped" : "through"}"><div class="cc-hit-in">${kitDie(h.size, { own: "them", face: spin ? null : h.v, spin, label: spin ? `Their d${h.size}, rolling` : `Their d${h.size} ${AT[h.at]} came up ${h.v}` })}
      <div><p><b>Their d${h.size}</b> <small>${AT[h.at]}${h.intent ? `, ${esc(h.intent)}` : ""}</small></p>
      ${spin ? "" : `<p>${stopped ? `Stopped by ${by}.` : `It got through${m ? `: ${by} against its ${h.v}` : ""}.`}</p>`}</div>${spin ? "" : swapBtn}</div>
      ${spin || stopped || picking ? "" : payView(h, r, s, c)}</li>`;
  };
  const pushes = pushesOf(c, true);
  const wakes = wakesOn(c, s, r, true);
  const anyThrough = hs.some((h) => h.by == null);
  const canReroll = R.roomOf(s, "resolve") >= 1 && anyThrough && !r.paid.some(Boolean);
  const offers = spin || r.pick || r.paid.some(Boolean) ? "" : [
    ...pushes.map((p) => `<button type="button" class="button sm" data-act="push" data-a="${esc(p.arch)}"${off(!R.payWays(s, p.home).length)}>${esc(p.arch)}’s Push: +${p.bonus} on a die</button>`),
    ...wakes.map((w) => `<button type="button" class="button sm is-aura" data-act="wakeplus" data-k="${esc(w.key)}">${esc(w.name)}: +${s.store[w.key]} on a die</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: 1 Resolve</button>` : "",
  ].join("");
  const others = otherAbilities(c);
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2><p class="cc-small">You rolled ${andList([...r.mine.filter((m) => m.src === "track").map((m) => `your ${TN(m.t)}`), ...(r.defName ? [`your Defend, ${esc(r.defName)}`] : [])])}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.mine.length)}">
    <ul class="cc-res"${spin ? ' data-act="skip"' : ""}>${r.mine.map((m, i) => `<li class="res is-${spin ? "spin" : hs.some((h) => h.by === i) ? "beat" : "none"}">${mineDie(m, i)}<span class="res-die">${m.src === "track" ? TN(m.t) : "Defend"} d${m.size}${m.plus ? ` +${m.plus}` : ""}</span>${!spin && m.nat === m.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
    ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${r.auraNote && !spin ? `<p class="cc-topnote">${esc(r.auraNote)}</p>` : ""}
    ${spin ? "" : pickNote(c, s, r.mine) || payNote(c, s)}
    <ul class="cc-hits">${hs.map(row).join("")}</ul>
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    <p class="cc-small cc-left">You’ve got ${s.aura} Aura. ${glanceTracks(s)}.</p>
    ${others.length && !spin && !r.pick ? `<details class="cc-how" data-open="abil"${ui.open.has("abil") ? " open" : ""}><summary>Pay for an ability</summary>${others.map((x) => `<p><b>${esc(x.arch)}, ${esc(x.name)}:</b> ${x.html}</p><div class="cc-row"><button type="button" class="button sm" data-act="ability" data-a="${esc(x.arch)}" data-j="${x.j}"${off(!R.payWays(s, x.home).length)}>Pay for ${esc(x.name)}</button></div>`).join("")}</details>` : ""}
    ${r.log.length && !spin ? `<details class="cc-how" data-open="how"${ui.open.has("how") ? " open" : ""}><summary>How it counted</summary><ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></details>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- abilities

// Paying for an ability, away from a roll: 1 off its home track, or 2 from
// the other two in any mix. Stand firm keeps the next two hits that get
// through this round from doing anything.
function abilityView(c, s) {
  const r = roll;
  const a = R.archetypesOf(c, DATA.build).find((x) => x.name === r.a);
  const x = a?.abilities[r.j];
  if (!x) return "";
  const ways = R.payWays(s, a.home);
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(x.name)}</h2><p class="cc-small">${esc(a.name)}, 1 ${TN(a.home)}</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body"><p>${x.html}</p>
    <p class="cc-lead">Pay 1 off your ${TN(a.home)}, or 2 from your other two. Pay again and you get it again.</p>
    ${ways.length ? `<div class="cc-row">${ways.map((w) => `<button type="button" class="button" data-act="pay-way" data-w="${esc(JSON.stringify(w))}">${R.payLabel(w)}</button>`).join("")}</div>` : `<p class="cc-note is-warn">None of your tracks has a size to pay with. Paying never takes a track below its smallest size.</p>`}
    ${ruleBox("s-abilities")}</div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- the end of a scene

// At the end of every scene you rest: roll each track that's below d12, and a
// 4 or more puts it up a size. A d2 can't roll a 4, so it waits for downtime.
// Then Aura's full, the attuned thing's empty and conditions end.
const sceneSaid = (s) => `New scene. Aura ${s.aura}, ${glanceTracks(s)}.`;
function newScene() {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const s = ch.state;
  const list = R.restsOf(s);
  if (!list.length) return change("starting a new scene", (st, cc) => {
    endScene(st, cc);
    return sceneSaid(st);
  });
  roll = { kind: "rest", mode: "build", list: list.map((t) => ({ t, size: s.tracks[t], nat: 0 })), rerolls: 0, real: false, spinning: false, log: [] };
  openDialog();
}
function restRoll(real, which = null) {
  const r = roll;
  r.real = real;
  const go2 = which ?? r.list.map((_, i) => i);
  for (const i of go2) r.list[i].nat = 0;
  if (real) {
    r.mode = "pad";
    r.pads = go2;
  } else {
    for (const i of go2) r.list[i].nat = throwDie(r.list[i].size);
    r.mode = "result";
    r.spinning = !calm();
    r.tops = 0;
  }
  renderDialog();
  if (r.spinning) spin();
  else if (!real) landed(true);
}
function restView(c, s) {
  const r = roll;
  const head = `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">End of the scene</h2><p class="cc-small">You rest before the next one.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>`;
  if (r.mode === "pad") return padView("End of the scene", r.pads.map((i) => [`Your ${TN(r.list[i].t)}, a d${r.list[i].size}`, `r${i}`, r.list[i].size, r.list[i].nat]), r.pads.every((i) => r.list[i].nat));
  const waits = R.TRACKS.filter((t) => s.tracks[t] <= 2);
  if (r.mode === "build") {
    return `${head}<div class="dlg-body">
      <p>Roll each track that’s below d12, and a 4 or more puts it up a size.${waits.length ? ` Your ${andList(waits.map(TN))} ${waits.length > 1 ? "are" : "is"} on d2, which can’t roll a 4, so ${waits.length > 1 ? "they wait" : "it waits"} for downtime.` : ""}</p>
      <p class="cc-dice">${liveDice(r.list.map((x) => [x.size, "you"]))}<span>${andList(r.list.map((x) => `your ${TN(x.t)} d${x.size}`))}</span></p>
      <p class="cc-lead">Then it’s a new scene: Aura full, your attuned thing empty and conditions gone. ${link("s-healing", "Healing in the rules")}</p></div>
    <div class="dlg-foot"><button type="button" class="button primary" data-act="rest-go">Roll</button><button type="button" class="button" data-act="rest-real">Roll real dice</button></div>`;
  }
  const spin = r.spinning;
  const up = (x) => x.nat >= R.RESTS_ON;
  const resolveLeft = R.roomOf(s, "resolve") - r.rerolls;
  return `${head}<div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.list.length)}">
    <ul class="cc-res"${spin ? ' data-act="skip"' : ""}>${r.list.map((x, i) => `<li class="res is-${spin ? "spin" : up(x) ? "beat" : "under"}">${kitDie(x.size, { face: x.nat, spin, label: spin ? `Your ${TN(x.t)} d${x.size}, rolling` : `Your ${TN(x.t)} d${x.size} came up ${x.nat}`, state: !spin && x.nat === x.size ? "top" : "" })}<span class="res-die">${TN(x.t)} d${x.size}</span>${spin ? "" : `<b class="res-out">${up(x) ? `Up to d${sizeUp(x.size)}` : "Stays"}</b>`}${!spin && !up(x) && resolveLeft >= 1 ? `<button type="button" class="button sm" data-act="rest-again" data-i="${i}">Roll again: 1 Resolve</button>` : ""}</li>`).join("")}</ul>
    ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${spin ? "" : `${r.rerolls ? `<ul class="cc-log"><li>Paid ${r.rerolls} Resolve to roll again.</li></ul>` : ""}`}
  </div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="rest-done"${off(spin)}>Start the next scene</button></div>`;
}
function finishRest() {
  const r = roll;
  const ch = current();
  if (!r || r.kind !== "rest" || !ch) return;
  let message = "";
  const last = undo[undo.length - 1];
  change("starting a new scene", (s, c) => {
    for (let i = 0; i < r.rerolls; i++) R.payTrack(s, "resolve");
    const ups = r.list.filter((x) => x.nat >= R.RESTS_ON).map((x) => x.t);
    for (const t of ups) R.trackUp(s, t);
    endScene(s, c);
    message = `${sceneSaid(s)} ${ups.length ? `You rested, and your ${andList(ups.map(TN))} came up a size.` : "Nothing came back this time."}`;
    return message;
  }, { say: false });
  closeDialog();
  toast(message || "New scene.", undo[undo.length - 1] !== last);
}

// ---------------------------------------------------------------- rules on tap

function ruleView() {
  const r = roll;
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${r.perm ? `<em>${esc(r.text)}</em>` : esc(RULE[r.id]?.title ?? "The rules")}</h2>${r.perm ? `<p class="cc-small">A permission on ${esc(r.from)}</p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-rule">${r.perm ? "<p><b>It’s already in your numbers:</b> 1 on its Root and 1 on its specialty. It does what it says for free, and going beyond that is 1 Aura.</p>" : ""}${ruleHtml(r.id)}</div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="close">Got it</button></div>`;
}


// ---------------------------------------------------------------- naming

function nameView() {
  const c = CREW.get(roll.crew);
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";
  return `<form class="cc-dlgform" data-form="name">
    <div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Play ${esc(c.name)}</h2></div><button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
    <div class="dlg-body"><label class="cc-field" for="cc-name">What do you want to call ${them}?</label>
      <input id="cc-name" name="name" value="${esc(c.name)}" maxlength="40" autocomplete="off" required>
      <p class="cc-lead">Keep ${esc(c.name)} or give ${them} a name of your own. The sheet’s the same either way, straight from the rules.</p></div>
    <div class="dlg-foot"><button type="submit" class="button primary">Start playing</button></div></form>`;
}

// ---------------------------------------------------------------- drawing

const sig = (el) => (el && el.dataset && el.dataset.act ? Object.entries(el.dataset).sort().join("|") : el && el.id ? `#${el.id}` : null);
function refocus(key) {
  if (!key) return;
  const scope = dialog.open ? dialog : document;
  const el = key.startsWith("#") ? scope.querySelector(key) : [...scope.querySelectorAll("[data-act]")].find((x) => sig(x) === key && !x.disabled);
  el?.focus({ preventScroll: true });
}

function dialogView() {
  if (!roll) return "";
  const ch = current();
  if (roll.kind === "name") return nameView();
  if (roll.kind === "rule") return ruleView();
  if (roll.kind === "camp") return camps.dialog(roll);
  if (roll.kind === "tele" || String(roll.kind).startsWith("tg-")) return table.dialog(roll);
  if (String(roll.kind).startsWith("ft-")) return turn.dialog(roll);
  const c = normal(ch);
  if (!c) return "";
  const s = ch.state;
  if (roll.kind === "downtime") return dt.view(c, s, ch, roll);
  if (roll.kind === "rest") return restView(c, s);
  if (roll.kind === "ability") return abilityView(c, s);
  if (roll.kind === "defence") {
    if (roll.mode === "build") return defenceBuild(c, s);
    if (roll.mode === "pad") {
      const mine = roll.pads ?? roll.mine.map((_, i) => i);
      const rows = [...mine.map((i) => [`Your ${roll.mine[i].src === "track" ? TN(roll.mine[i].t) : "Defend"}, a d${roll.mine[i].size}`, `m${i}`, roll.mine[i].size, roll.mine[i].nat]), ...(roll.padOpp ? roll.incoming.map((x, j) => [`Their d${x.d} ${AT[x.at]}${x.intent ? ` · ${esc(x.intent)}` : ""}`, `o${j}`, x.d, roll.opp[j]]) : [])];
      return padView("When it lands", rows, mine.every((i) => roll.mine[i].nat) && (!roll.padOpp || roll.opp.every(Boolean)));
    }
    return defenceResult(c, s, ch);
  }
  if (roll.mode === "build") return buildView(c, s);
  if (roll.mode === "pad") {
    const rows = roll.pads.map((i) => [`${roll.dice[i].mark ? "The Mark" : "Your"} d${roll.dice[i].size}${roll.dice[i].intent ? ` · ${esc(roll.dice[i].intent)}` : ""}`, `p${i}`, roll.dice[i].size, roll.dice[i].nat]);
    if (roll.padOpp) rows.push([`Their d${roll.oppSize}`, "opp", roll.oppSize, roll.opp ?? 0]);
    return padView(roll.name, rows, roll.pads.every((i) => roll.dice[i].nat) && (!roll.padOpp || roll.opp));
  }
  return resultView(c, s, ch);
}

function renderDialog(keepFocus = true) {
  if (!dialog.open) return;
  const body = dialog.querySelector(".dlg-body");
  const top = body ? body.scrollTop : 0;
  const keep = keepFocus ? sig(document.activeElement) : null;
  dialog.innerHTML = dialogView();
  const now = dialog.querySelector(".dlg-body");
  const mode = roll ? `${roll.kind}:${roll.mode}` : null;
  // The card turns over when the dialog moves on, and what the dice did comes
  // up once they've landed.
  if (now && mode === ui.mode) now.scrollTop = top;
  else if (now && ui.mode) now.classList.add("cc-flip");
  if (now && ui.reveal) now.classList.add("cc-reveal");
  ui.reveal = false;
  ui.mode = mode;
  refocus(keep);
  if (!dialog.contains(document.activeElement)) (dialog.querySelector(".dlg-body button:not(:disabled)") ?? dialog.querySelector(".dlg-foot .primary"))?.focus({ preventScroll: true });
}

// The builder and the learning round come back on the new rules in stage 4
// of notes/roots-plan.md. Till then a link to either says so.
function comingView(name) {
  return `<a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a>
    <header class="cc-intro"><h1>${name === "learn" ? "Learn to play" : "Make your own"}</h1></header>
    <div class="cc-note" role="status"><p>${name === "learn" ? "The learning round’s coming back on the new sheets, with Roots, specialties and three tracks." : "The builder’s coming back on the new rules, with Roots, specialties and three tracks."} Till then, play one of the crew, straight off their sheet.</p>
    <div class="cc-row"><a class="button primary" href="/characters/" data-act="nav">Pick from the crew</a></div></div>`;
}

function render() {
  const keep = dialog.open ? null : sig(document.activeElement);
  const ch = current();
  const c = ch ? normal(ch) : null;
  if (c) settleMarks(ch, c);
  else ui.gold = null;
  document.documentElement.classList.toggle("cc-tabbed", view.name === "sheet" && Boolean(c));
  // A character's full screen, without the site's bar. A campaign, a look at
  // a player's character and joining are full screen too.
  const camping = view.name === "camp" || view.name === "look" || view.name === "join" || view.name === "world";
  document.documentElement.classList.toggle("cc-full", view.name === "sheet" || camping);
  app.innerHTML = view.name === "build" || view.name === "learn" ? comingView(view.name) : view.name === "world" ? world.view(view) : camping ? camps.view(view) : view.name !== "sheet" ? listView()
    : c ? characterView(ch, c) : isBefore(ch) ? beforeView(ch, { esc, link, back: ICON.back, tools: `${soundButton()}${themeButton()}`, crew: CREW }) : missingView(ch);
  if (camping) camps.after(app);
  // A campaign, or a character playing in one, keeps its party sheet and
  // threads in step while it's open.
  party.route(view, ch);
  party.after(app);
  // And its live table, the round's telegraphs, over a socket.
  table.route(view, ch);
  // And its world, on the World screen or a World tab.
  world.route(view, ch);
  world.after(app);
  turn.after(app);
  found.after(app);
  glow(ch);
  if (dialog.open) renderDialog();
  else refocus(keep);
}

// Aura pops in as it comes back, and the tracks grow or shrink into their new
// shapes. The trackers remember what they showed last time, for this character.
function glow(ch) {
  // Behind the roll card nothing's seen, so it glows when the card closes.
  if (dialog.open) return;
  const s = ch?.state;
  const was = ui.seen && ui.seen.id === ch?.id ? ui.seen : null;
  ui.seen = s?.tracks ? { id: ch.id, aura: s.aura, tracks: { ...s.tracks }, scars: R.TRACKS.map((t) => s.scars[t].length) } : null;
  if (!was || !s?.tracks) return;
  const lit = (sel, from, to) => [...app.querySelectorAll(sel)].slice(from, to).forEach((el) => el.classList.add("is-new"));
  if (s.aura > was.aura) lit(".t-aura .zd-chit", was.aura, s.aura);
  R.TRACKS.forEach((t, i) => {
    if (s.tracks[t] !== was.tracks[t]) {
      app.querySelector(`.t-${t}`)?.classList.add(s.tracks[t] > was.tracks[t] ? "is-up" : "is-down");
      growDie(app.querySelector(`.t-${t} .zd-die`), was.tracks[t], s.tracks[t]);
    }
    if (s.scars[t].length > was.scars[i]) lit(`.t-${t} .zd-scars i`, was.scars[i], s.scars[t].length);
  });
}

function openDialog() {
  ui.returnFocus = document.activeElement;
  ui.mode = null;
  if (!history.state?.dlg) history.pushState({ dlg: true }, "");
  dialog.innerHTML = "";
  dialog.setAttribute("aria-labelledby", "dlg-title");
  dialog.showModal();
  renderDialog(false);
  const first = dialog.querySelector(".dlg-body button, .dlg-body input") ?? dialog.querySelector("button");
  first?.focus({ preventScroll: true });
}

function closeDialog(fromHistory = false) {
  if (!dialog.open) return;
  if (!fromHistory && history.state?.dlg) {
    history.back();
    return;
  }
  ui.stopSpin?.();
  ui.stopSpin = null;
  dialog.close();
  dialog.innerHTML = "";
  roll = null;
  render();
  if (ui.returnFocus?.isConnected) ui.returnFocus.focus({ preventScroll: true });
}

function route() {
  const q = new URLSearchParams(location.search);
  const id = q.get("c");
  const building = q.has("build");
  const learning = !building && !id && q.has("learn");
  const camp = !building && !id && !learning ? q.get("camp") : null;
  const joining = !building && !id && !learning && !camp && q.has("join");
  // A Sheet tab fold shut on one character opens as usual on another.
  if (id !== (view.name === "sheet" ? view.id : null)) ui.shut.clear();
  view = building ? { name: "build" } : learning ? { name: "learn" } : id ? { name: "sheet", id }
    : camp ? (q.get("look") ? { name: "look", id: camp, who: q.get("look") } : q.has("world") ? { name: "world", id: camp, f: q.get("f") || "", p: q.get("p") || "", m: q.get("m") || "", pin: q.get("pin") || "", make: q.get("make") || "" } : { name: "camp", id: camp }) : joining ? { name: "join" } : { name: "list" };
  ui.tab = ["sheet", "rules", "party", "world"].includes(q.get("t")) ? q.get("t") : "play";
  ui.panel = null;
  ui.sure = false;
  document.documentElement.classList.toggle("cc-open", Boolean(id || building || learning || camp || joining));
  const ch = current();
  document.title = building ? "Make your own · Zi’Dara" : learning ? "Learn to play · Zi’Dara" : ch ? `${ch.name} · Zi’Dara` : view.name === "world" ? `${world.title(view)} · Zi’Dara` : camp || joining ? `${camps.title(view)} · Zi’Dara` : "Characters · Zi’Dara";
  camps.route(view);
  render();
}

// Somewhere else in the companion, as a new step in the history or in place of
// this one. from says where it came from, for a Back that goes the same way.
function goTo(url, { replace = false, from = null } = {}) {
  history[replace ? "replaceState" : "pushState"](from ? { from } : null, "", url);
  route();
  scrollTo(0, 0);
}

// Leaving a dialog for another page: the dialog's step in the history becomes
// that page, so Back goes to where the dialog was opened.
function leaveDialog(url) {
  ui.stopSpin?.();
  ui.stopSpin = null;
  if (dialog.open) dialog.close();
  dialog.innerHTML = "";
  roll = null;
  goTo(url, { replace: Boolean(history.state?.dlg) });
}

function nav(id) {
  history.pushState(null, "", id ? `/characters/?c=${encodeURIComponent(id)}` : "/characters/");
  route();
  scrollTo(0, 0);
}

function start(crewId, name) {
  const base = CREW.get(crewId);
  if (!base) return;
  const c = R.rootsSheet(base, [], DATA.build);
  const tag = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
  const id = `${crewId}-${tag}`;
  const ch = { id, crew: crewId, name: name || c.name, made: new Date().toISOString(), hash: c.hash, state: { ...R.freshRoots(c), seen: said(c) } };
  sync.claim(ch);
  chars().push(ch);
  store.save();
  ui.stopSpin?.();
  ui.stopSpin = null;
  dialog.close();
  dialog.innerHTML = "";
  roll = null;
  if (camps.made(ch)) return;
  history.replaceState(null, "", `/characters/?c=${encodeURIComponent(id)}`);
  route();
  scrollTo(0, 0);
  app.querySelector(".tile")?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- doing things

// The end of downtime: every track up a size to start with, then what the
// slots bought goes on the sheet, then it's a new scene, all as one change
// with one undo. A card with an empty or unfinished slot asks for a second
// tap first.
function finishDowntime(ch, c) {
  const d = roll;
  if (!d.sure && dt.warnings(d, c, ch.state).length) {
    d.sure = true;
    return renderDialog();
  }
  let message = "";
  const last = undo[undo.length - 1];
  change("downtime", (s, was) => {
    const before = said(was);
    const happened = dt.apply(s, was, d);
    const now = sheetFor(ch);
    endScene(s, now);
    if (s.seen) s.seen = ownChanges(s.seen, before, said(now));
    message = `Downtime’s done. ${happened.map((x) => `${x}.`).join(" ")}`.replace(/\s+/g, " ").trim();
    return message;
  }, { say: false });
  dt.done(ch);
  closeDialog();
  toast(message || "Downtime’s done.", undo[undo.length - 1] !== last);
}

function stepRoll(name, i, d) {
  const r = roll;
  if (r.kind === "defence") {
    const p = defencePool(normal(current()), current().state, r);
    if (name === "count" && p.def) r.count = clamp(p.def.count + d, p.def.fewest, p.def.most);
    r.shape = 0;
    return;
  }
  const k = counted(r, normal(current()), current().state);
  if (name === "other") r.other = clamp(r.other + d, 0, 9);
  if (name === "handed") r.handed = clamp(r.handed + d, 0, 18);
  if (name === "vsRolled") r.vsRolled = clamp(r.vsRolled + d, 1, 30);
  if (name === "friend") r.friends[i] = clamp(r.friends[i] + d, 1, 18);
  if (name === "count") r.count = clamp(k.count + d, k.fewest, k.most);
  if (name !== "vsRolled") r.shape = 0;
}

// Toggle something in a Set on the open roll, and count it again.
const flip = (set, k) => {
  if (set.has(k)) set.delete(k);
  else set.add(k);
};
const recount = () => {
  roll.shape = 0;
  renderDialog();
};


// A die picked on a roll card: rolled again, or with a Push or an awakening
// put on it. A Push still wants paying once its die's picked.
function pickDie(i) {
  const p = roll?.pick;
  if (!p) return;
  if (p.type === "reroll") return reroll([i]);
  const list = roll.kind === "defence" ? roll.mine : roll.dice;
  if (!list[i]) return;
  if (p.type === "push") {
    p.die = i;
    return renderDialog();
  }
  if (p.type === "wake") change(`${p.name} on a die`, (s) => {
    list[i].plus += p.bonus;
    roll.log.push(`${p.name} put +${p.bonus} on the d${list[i].size}, so it’s ${valOf(list[i])}. A number added after the roll doesn’t pay Aura.`);
    roll.pick = null;
    afterPlus(s);
  }, { say: false });
}
// After a die's been added to, the roll's said again, and When it lands is
// matched up again, as long as nothing's been paid for yet.
function afterPlus(s) {
  if (roll.kind === "action") s.last = lastOf();
  else if (!roll.paid.some(Boolean) && !roll.swapped) assignBest(roll);
}

// 1 Resolve to roll again: all your dice or just one. Their dice stay put.
function reroll(which) {
  change("rolling again", (s, c) => {
    if (!R.payTrack(s, "resolve")) return;
    const list = roll.kind === "defence" ? roll.mine : roll.dice;
    roll.pick = null;
    roll.log.push(`Paid 1 Resolve to roll ${which.length === list.length && which.length > 1 ? "them all" : `the d${list[which[0]].size}`} again. Your Resolve’s a d${s.tracks.resolve}.`);
    for (const i of which) Object.assign(list[i], { nat: 0, plus: 0, won: false });
    if (roll.real) {
      roll.mode = "pad";
      roll.pads = which;
      roll.padOpp = false;
    } else {
      for (const i of which) list[i].nat = throwDie(list[i].size);
      if (roll.kind === "defence") settleDefence(s, c, which);
      else settle(s, c, which);
      roll.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
  else if (!roll?.real && roll?.mode === "result") landed(true);
}

// An ability paid for: from the play screen's own card, or from inside a
// roll. Stand firm keeps the next two hits that get through from doing
// anything this round.
function payAbility(w) {
  const inRoll = roll?.kind !== "ability";
  const p = inRoll ? roll?.pay : roll;
  const c = normal(current());
  const a = c && p ? R.archetypesOf(c, DATA.build).find((x) => x.name === p.a) : null;
  const x = a?.abilities[p.j];
  if (!x) return;
  let message = "";
  change(`paying for ${x.name}`, (s) => {
    if (!R.payWith(s, w)) return "";
    if (/\bnext two hits that get through\b/i.test(x.text)) s.firm = (s.firm ?? 0) + 2;
    message = `Paid ${R.payLabel(w)} for ${x.name}.${s.firm && /\bnext two hits\b/i.test(x.text) ? ` The next ${s.firm} hits that get through to you this round do nothing.` : ""} ${glanceTracks(s)}.`;
    if (inRoll) {
      roll.log.push(message);
      roll.pay = null;
    }
    return message;
  }, { say: false });
  if (!inRoll) {
    closeDialog();
    if (message) toast(message, true);
  }
}
const payNote = (c, s) => {
  const p = roll?.pay;
  if (!p) return "";
  const a = R.archetypesOf(c, DATA.build).find((x) => x.name === p.a);
  const x = a?.abilities[p.j];
  if (!x) return "";
  const ways = R.payWays(s, a.home);
  return `<div class="cc-note" role="status"><p><b>${esc(x.name)}:</b> ${x.html}</p><div class="cc-row">${ways.map((w) => `<button type="button" class="button sm" data-act="pay-way" data-w="${esc(JSON.stringify(w))}">${R.payLabel(w)}</button>`).join("")}<button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
};

const ACT = {
  k: (el, e) => camps.act(el, e),
  tg: (el, e) => table.act(el, e),
  p: (el, e) => party.act(el, e),
  pundo: () => party.undo(),
  w: (el, e) => world.act(el, e),
  ft: (el, e) => turn.act(el, e),
  fd: (el, e) => found.act(el, e),
  wundo: () => world.undo(),
  wkundo: () => world.makeUndo(),
  async print() {
    const ch = current();
    const c = ch && normal(ch);
    if (!c || ui.printing) return;
    ui.printing = true;
    render();
    try {
      const { short } = await printSheet(ch, c, ch.state, { goal: party.goalOf(ch), B: DATA.build });
      toast(`${ch.name}’s sheet is filled in and ready to print.${short ? " Notes ran out of room on the paper, so the end got cut off. Copy the rest in by hand from the Sheet tab." : ""}`, false);
    } catch (e) {
      console.warn(e);
      toast("The sheet couldn’t be filled in. Open the companion once with a signal, then try again.", false);
    } finally {
      ui.printing = false;
      render();
    }
  },
  nav(el, e) {
    e.preventDefault();
    nav(el.dataset.id || "");
  },
  play(el) {
    roll = { kind: "name", crew: el.dataset.c };
    openDialog();
    const input = dialog.querySelector("#cc-name");
    input?.focus();
    input?.select();
  },
  movein(el) {
    el.disabled = true;
    sync.moveIn().then((n) => {
      render();
      toast(sync.unsent() ? "They’re in your account, and they’ll finish going up when there’s a signal." : `${n === 1 ? "It’s" : `All ${n} are`} in your account now.`, false);
    }, () => render());
  },
  delete() {
    const ch = current();
    if (!ch || !confirm(ch.acct ? `Delete ${ch.name}? They go from your account too, so they’re gone from every phone you sign in on. You can’t get them back.` : `Delete ${ch.name} from this phone? You can’t get them back.`)) return;
    store.data.characters = chars().filter((x) => x.id !== ch.id);
    sync.gone(ch);
    store.save();
    nav("");
  },
  // The player's seen what changed in the rules, so the gold marks go.
  seen: () => change("seeing what’s changed", (s, c, ch) => {
    s.seen = said(c);
    ch.hash = c.hash;
    for (const key of [...ui.open]) if (key.startsWith("g-")) ui.open.delete(key);
    return "";
  }, { say: false }),
  // And that they're on the new rules: from here on, a change in the rules
  // gets its gold marks the usual way.
  moved: () => change("seeing the new rules", (s, c, ch) => {
    delete s.moved;
    s.seen = said(c);
    ch.hash = c.hash;
    return "";
  }, { say: false }),
  gold(el) {
    const key = `g-${el.dataset.k}`;
    if (ui.open.has(key)) ui.open.delete(key);
    else ui.open.add(key);
    render();
  },
  panel(el) {
    ui.panel = ui.panel === el.dataset.p ? null : el.dataset.p;
    render();
  },
  tab(el, e) {
    e.preventDefault();
    const ch = current();
    if (!ch || ui.tab === el.dataset.t) return;
    const at = (t) => tabsOf(ch).findIndex(([key]) => key === t);
    ui.slide = at(el.dataset.t) > at(ui.tab) ? "next" : "back";
    ui.tab = el.dataset.t;
    ui.panel = null;
    history.replaceState(history.state, "", `/characters/?c=${encodeURIComponent(ch.id)}${ui.tab === "play" ? "" : `&t=${ui.tab}`}`);
    render();
    scrollTo(0, 0);
  },
  rule(el) {
    roll = el.dataset.r === "perm" ? { kind: "rule", id: "how-permissions-stack", perm: true, text: el.dataset.t, from: el.dataset.f } : { kind: "rule", id: el.dataset.r };
    openDialog();
  },
  intent(el) {
    const k = el.dataset.k;
    const v = el.dataset.v;
    if (!v) {
      if (roll.owns.has(k)) {
        roll.owns.delete(k);
        delete roll.intents[k];
      } else {
        roll.owns.add(k);
        roll.intents[k] = "";
      }
    } else {
      roll.owns.delete(k);
      if (roll.intents[k] === v) delete roll.intents[k];
      else roll.intents[k] = v;
    }
    renderDialog();
    if (!v && roll.owns.has(k)) dialog.querySelector(`input[data-in="intent"][data-k="${k}"]`)?.focus();
  },
  undo: () => undoLast(),
  // Acting: Aura can go past the maximum till you've finished, and then
  // anything over it's gone.
  acting: (el) => change(el.dataset.v === "1" ? "acting" : "finishing acting", (s, c) => {
    if (el.dataset.v === "1") {
      s.acting = true;
      return "You’re acting. Aura can go past your maximum till you’ve finished.";
    }
    const over = R.doneActing(s, c);
    return over ? `You’ve finished acting, so the ${over} Aura over your ${c.numbers.aura} is gone.` : "You’ve finished acting.";
  }),
  aura: (el) => {
    const d = Number(el.dataset.d);
    const why = el.dataset.why;
    change(d > 0 ? "getting 1 Aura back" : why === "intercept" ? "intercepting for a friend" : why === "extra" ? "an extra action" : "spending 1 Aura", (s, c) => {
      if (d > 0) return `You get 1 Aura back.${gainAura(s, c, 1)} Aura’s ${s.aura}.`;
      if (s.aura < -d) return "";
      s.aura += d;
      if (why === "intercept") return `1 Aura to intercept for a friend. Their blows come at your Body instead, and your Stamina rolls for them when they land. Aura’s ${s.aura}.`;
      if (why === "extra") return `3 Aura for an extra action. Aura’s ${s.aura}.`;
      return `Spent 1 Aura. Aura’s ${s.aura}.`;
    });
  },
  "track-set": (el) => {
    const t = el.dataset.t;
    change(`changing your ${TN(t)}`, (s) => {
      s.tracks[t] = even(el.dataset.v, R.lowOf(s, t), 12);
      return `Your ${TN(t)}’s a d${s.tracks[t]}.`;
    });
  },
  hit: (el) => change(`a hit at your ${R.TRACK[el.dataset.t].root}`, (s) => hitAt(s, el.dataset.t)),
  up: (el) => change("a size back", (s) => upOne(s, el.dataset.t)),
  quickheal: (el) => change("a quick heal", (s) => {
    const t = el.dataset.t;
    if (s.aura < 1 || s.tracks[t] >= 12) return "";
    s.aura -= 1;
    return `1 Aura and your action for a quick heal. ${upOne(s, t)}`;
  }),
  breath: () => change("taking a breath", (s) => {
    if (s.tracks.confidence >= 6) return "";
    R.trackUp(s, "confidence");
    return `You take a breath, and your Confidence comes up to d${s.tracks.confidence}. It takes your action.`;
  }),
  two: (el) => change("2 for 1", (s) => {
    const w = JSON.parse(el.dataset.w);
    if (!R.payWith(s, w)) return "";
    return `You take it standing up: ${R.payLabel(w)}, and your ${TN(el.dataset.t)} stays where it is.`;
  }),
  // The GM can take a Scar away when the story's earned it: Catch and all.
  unscar: (el) => change("a Scar taken away", (s) => {
    const t = el.dataset.t;
    const [gone] = s.scars[t].splice(Number(el.dataset.i), 1);
    if (gone == null) return "";
    return `${gone ? `${cap(gone)} is gone, Catch and all` : "The Scar’s gone"}, so your ${TN(t)} can go as low as d${R.lowOf(s, t)} again.`;
  }),
  die: (el) => change(el.dataset.how === "retire" ? "their retiring" : "their death", (s, c, ch) => {
    s.blaze = null;
    s.dead = true;
    if (el.dataset.how === "retire") {
      s.retired = true;
      return `${ch.name} retires, once the extraordinary thing’s done.`;
    }
    return `${ch.name} dies, and what they died for happens.`;
  }),
  "asp-set": (el) => change("changing your Aspiration", (s) => {
    s.asp = even(el.dataset.v, 2, 12);
    return `Your Aspiration’s at d${s.asp}.`;
  }),
  asp: (el) => change(Number(el.dataset.d) > 0 ? "your Aspiration climbing" : "a setback", (s) => {
    if (Number(el.dataset.d) < 0) {
      s.asp = sizeDown(s.asp);
      return `A setback. Your Aspiration steps down to d${s.asp}.`;
    }
    if (s.asp >= 12) {
      s.asp = 2;
      return "It climbs past d12 and resolves. Take a new Title with one permission, a new archetype or a new attuned thing in downtime, and write your new Aspiration in. It starts at d2.";
    }
    s.asp = sizeUp(s.asp);
    return `It climbs to d${s.asp}.`;
  }),
  scene: () => newScene(),
  "rest-go": () => restRoll(false),
  "rest-real": () => restRoll(true),
  "rest-again"(el) {
    const s = current()?.state;
    if (!s || R.roomOf(s, "resolve") - roll.rerolls < 1) return;
    roll.rerolls += 1;
    restRoll(roll.real, [Number(el.dataset.i)]);
  },
  "rest-done": () => finishRest(),
  downtime() {
    const ch = current();
    if (!normal(ch)) return;
    roll = dt.start(ch);
    openDialog();
  },
  dt(el) {
    const ch = current();
    const c = normal(ch);
    if (!c || roll?.kind !== "downtime") return;
    if (el.dataset.do === "finish") return finishDowntime(ch, c);
    dt.act(el, roll, c, ch.state);
    renderDialog();
  },
  // A specialty, rolled on its usual Root, or a Root on its own.
  roll: (el) => {
    const c = normal(current());
    if (!c) return;
    if (el.dataset.r) openAction({ root: el.dataset.r });
    else openAction({ spec: c.specialties[Number(el.dataset.s)]?.name ?? "" });
  },
  // When it lands starts with whatever landed on this character, if they're
  // playing in a campaign whose round has just ended.
  defence: () => openDefence(table.landedFor(current())),
  // An ability: its own card from the play screen, or paid inside a roll.
  ability(el) {
    if (dialog.open && roll && (roll.kind === "action" || roll.kind === "defence")) {
      roll.pay = { a: el.dataset.a, j: Number(el.dataset.j) };
      roll.pick = null;
      return renderDialog();
    }
    roll = { kind: "ability", a: el.dataset.a, j: Number(el.dataset.j) };
    openDialog();
  },
  "pay-way": (el) => payAbility(JSON.parse(el.dataset.w)),
  pump: (el) => change("pumping Aura in", (s, c) => {
    const w = R.passivesOf(c).find((x) => x.key === el.dataset.k);
    if (!w || s.aura < 1 || (s.store[w.key] ?? 0) >= w.holds) return "";
    s.aura -= 1;
    s.store[w.key] = (s.store[w.key] ?? 0) + 1;
    return `1 Aura into ${w.name}. It’s holding ${s.store[w.key]} of ${w.holds} till the scene ends. Aura’s ${s.aura}.`;
  }),
  wake: (el) => change(`using ${el.dataset.n}`, (s) => {
    const n = Number(el.dataset.v) || 1;
    if (s.aura < n) return "";
    s.aura -= n;
    const said = `${n} Aura on ${el.dataset.n}.`;
    if (dialog.open && roll?.log) roll.log.push(said);
    return `${said} Aura’s ${s.aura}.`;
  }),
  "its-aura": (el) => change("its own way to Aura", (s, c) => `${cap(lower(c.attuned[Number(el.dataset.a)]?.name ?? "It"))} gets you 1 Aura.${gainAura(s, c, 1)}`),
  // A Catch, a Scar, trouble or a hostile thread biting. A big bite puts
  // Resolve up a size instead of the Aura.
  bite: (el) => {
    const big = el.dataset.big === "1";
    const ch = current();
    const c = ch && normal(ch);
    if (!c) return;
    if (big ? ch.state.tracks.resolve >= 12 : !ch.state.acting && ch.state.aura >= c.numbers.aura) return toast(big ? "A big bite. Your Resolve’s on d12 already." : "Real trouble. Your Aura’s full, so give 1 to a friend in the scene.", false);
    change(big ? "a big bite" : "letting it bite", (s) => (big ? `A big bite. ${upOne(s, "resolve")}` : `Real trouble. You take 1 Aura.${gainAura(s, c)}`));
  },
  cross: (el) => change("crossing something out", (s, c) => {
    const key = el.dataset.k;
    const a = pieceAt(c, key);
    if (a) return setTicked(s, a, isBroken(s, a) ? 0 : a.boxes) ? `${cap(yours(a, { quality: true }))}: ${itS(a)} broken till ${itS(a)} mended.` : `${cap(yours(a, { quality: true }))}: mended, every box clear.`;
    if (s.crossed[key]) delete s.crossed[key];
    else s.crossed[key] = true;
    return s.crossed[key] ? "Crossed out until it’s mended or replaced." : "It’s back.";
  }),
  // A box on a piece of armour: tap one to tick it and every box before it,
  // or a ticked one to clear it and every box after it.
  box: (el) => change("a box on your armour", (s, c) => {
    const a = pieceAt(c, el.dataset.k);
    if (!a) return "";
    const n = Number(el.dataset.n);
    const to = setTicked(s, a, n <= tickedOf(s, a) ? n - 1 : n);
    return to >= a.boxes ? `That’s the last box on ${yours(a, { quality: true })}, so ${itS(a)} broken till ${itS(a)} mended.` : `${cap(yours(a, { quality: true }))}: ${boxesSaid(s, a)}.`;
  }),
  drop: (el) => change("taking something off", (s) => {
    s.picked.splice(Number(el.dataset.i), 1);
    return "Taken off your sheet.";
  }),
  "cond-down": (el) => change("a condition stepping down", (s) => {
    const x = s.conditions[Number(el.dataset.i)];
    if (!x) return "";
    if (x.die <= 2) {
      s.conditions.splice(Number(el.dataset.i), 1);
      return `${x.name} fades away.`;
    }
    x.die -= 2;
    return `${x.name} is d${x.die}.`;
  }),
  "cond-off": (el) => change("a condition ending", (s) => {
    const [x] = s.conditions.splice(Number(el.dataset.i), 1);
    return x ? `${x.name}’s gone.` : "";
  }),
  // The end of a round: conditions step down, and Stand firm's done.
  round: () => change("the end of the round", (s) => {
    const gone = s.conditions.filter((x) => x.die <= 2).map((x) => x.name);
    s.conditions = s.conditions.filter((x) => x.die > 2).map((x) => ({ ...x, die: x.die - 2 }));
    delete s.firm;
    return `End of round. Every condition steps down a size${gone.length ? `, and ${gone.join(" and ")} ${gone.length > 1 ? "are" : "is"} gone` : ""}.`;
  }),
  // A bond thread: strain it and your Resolve comes up a size, and again
  // before it's mended it snaps. A crewmate's thread is on their sheet too,
  // so they're told.
  strain: (el) => change("straining a thread", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || found.t.kind === "hostile") return "";
    const st = threadState(s, found.person, found.t);
    if (st === "snapped") return "";
    const snapped = st === "strained";
    s.threads[el.dataset.k] = snapped ? "snapped" : "strained";
    return `${snapped ? "It snaps, so it’s crossed out." : "Strained."} ${upOne(s, "resolve")}${tellCrew(found.person, snapped ? "crossed out" : "strained", c)}`;
  }),
  mend: (el) => change("mending a thread", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found) return "";
    setWhole(s, found);
    return `Mended. It’s whole again.${tellCrew(found.person, "whole", c)}`;
  }),
  // A hostile thread: doing right by them strains it, and doing right by them
  // again snaps it, and the grudge is over. Wronging them again first makes
  // it whole.
  right: (el) => change("doing right by them", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || found.t.kind !== "hostile") return "";
    const st = threadState(s, found.person, found.t);
    if (st === "snapped") return "";
    s.threads[el.dataset.k] = st === "strained" ? "snapped" : "strained";
    return `${st === "strained" ? "You did right by them again, so it snaps, and the grudge is over." : "You did right by them, so it’s strained. Do it again and it snaps."}${tellCrew(found.person, st === "strained" ? "crossed out" : "strained", c)}`;
  }),
  wrong: (el) => change("wronging them again", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || found.t.kind !== "hostile") return "";
    setWhole(s, found);
    return `You wronged them again, so it’s whole.${tellCrew(found.person, "whole", c)}`;
  }),
  // Borrowing through a bond thread, away from the roll card.
  tborrow: (el) => change("borrowing through a thread", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || s.aura < 1 || !lendersOf(c, s).includes(found.person)) return "";
    s.aura -= 1;
    return `You borrow one of ${found.person}’s specialties for 1 Aura, so it’s a step on the roll it fits. Aura’s ${s.aura}.`;
  }),
  // Something from before the Roots change that isn't going back on.
  letgo: (el) => change("letting it go", (s) => {
    const n = Number(el.dataset.n);
    if (!s.before?.some((g) => g.n === n)) return "";
    s.before = s.before.filter((g) => g.n !== n);
    if (!s.before.length) delete s.before;
    return "Let go.";
  }),

  // The roll and defence dialogs.
  close: () => closeDialog(),
  root(el) {
    roll.root = el.dataset.v;
    recount();
  },
  spec(el) {
    roll.spec = el.dataset.v;
    if (!roll.spec) roll.pitch = false;
    recount();
  },
  pitch() {
    roll.pitch = !roll.pitch;
    renderDialog();
  },
  item(el) {
    flip(roll.items, el.dataset.k);
    recount();
  },
  "x-add"() {
    roll.extra.push({ spec: "", via: R.actionsMax(normal(current())) > 1 ? "aura" : "held" });
    recount();
  },
  "x-del"(el) {
    roll.extra.splice(Number(el.dataset.i), 1);
    recount();
  },
  borrow(el) {
    flip(roll.borrow, el.dataset.k);
    recount();
  },
  cond(el) {
    flip(roll.conds, el.dataset.k);
    recount();
  },
  step(el) {
    stepRoll(el.dataset.n, Number(el.dataset.i), Number(el.dataset.d));
    renderDialog();
  },
  "friend-on"() {
    roll.friends.push(3);
    recount();
  },
  "friend-off"(el) {
    roll.friends.splice(Number(el.dataset.i), 1);
    recount();
  },
  beyond() {
    roll.beyond = !roll.beyond;
    renderDialog();
  },
  shape(el) {
    roll.shape = Number(el.dataset.i);
    renderDialog();
  },
  vs(el) {
    roll.vs = Number(el.dataset.v);
    renderDialog();
  },
  mark(el) {
    roll.mark = Number(el.dataset.v);
    renderDialog();
  },
  go: () => go(false),
  "go-real": () => go(true),
  pad(el) {
    const key = el.dataset.k;
    const v = Number(el.dataset.v);
    if (key === "opp") roll.opp = v;
    else if (key[0] === "p") roll.dice[Number(key.slice(1))].nat = v;
    else if (key[0] === "m") roll.mine[Number(key.slice(1))].nat = v;
    else if (key[0] === "o") roll.opp[Number(key.slice(1))] = v;
    else if (key[0] === "r") roll.list[Number(key.slice(1))].nat = v;
    renderDialog();
  },
  "pad-done": () => {
    // The rest roll counts nothing until the next scene starts.
    if (roll?.kind === "rest") {
      roll.mode = "result";
      roll.pads = null;
      renderDialog();
      return landed(false);
    }
    change("your roll", (s, c) => {
      roll.mode = "result";
      if (roll.kind === "defence") settleDefence(s, c, roll.pads ?? null);
      else settle(s, c, roll.pads);
      roll.pads = roll.kind === "defence" ? null : [];
      roll.padOpp = false;
    }, { say: false });
    landed(false);
  },
  skip() {
    ui.stopSpin?.();
    ui.stopSpin = null;
    if (!roll?.spinning) return;
    roll.spinning = false;
    ui.reveal = true;
    renderDialog();
    landed(true);
  },
  theme() {
    flipTheme();
    render();
  },
  sound() {
    setSound(!soundOn());
    render();
    feel.hello();
  },
  learn(el, e) {
    e.preventDefault();
    goTo("/characters/?learn");
  },
  "win-tie": (el) => change("winning a tie", (s) => {
    const d = roll.dice[Number(el.dataset.i)];
    if (s.aura < 1 || !d) return;
    s.aura -= 1;
    d.won = true;
    roll.log.push(`Paid 1 Aura to win the tie on the d${d.size}. A tie you bought doesn’t pay Aura back.`);
    s.last = lastOf();
  }, { say: false }),
  push(el) {
    const p = pushesOf(normal(current()), roll.kind === "defence").find((x) => x.arch === el.dataset.a);
    if (!p) return;
    roll.pick = { type: "push", arch: p.arch, home: p.home, bonus: p.bonus, die: null };
    roll.pay = null;
    renderDialog();
  },
  "push-pay"(el) {
    const p = roll?.pick;
    if (!p || p.type !== "push" || p.die == null) return;
    const w = JSON.parse(el.dataset.w);
    const list = roll.kind === "defence" ? roll.mine : roll.dice;
    change(`${p.arch}’s Push`, (s) => {
      if (!R.payWith(s, w)) return;
      list[p.die].plus += p.bonus;
      roll.log.push(`Paid ${R.payLabel(w)} for ${p.arch}’s Push: +${p.bonus} on the d${list[p.die].size}, so it’s ${valOf(list[p.die])}. A number added after the roll doesn’t pay Aura.`);
      roll.pick = null;
      afterPlus(s);
    }, { say: false });
  },
  wakeplus(el) {
    const s = current().state;
    const w = R.passivesOf(normal(current())).find((x) => x.key === el.dataset.k);
    if (!w || !(s.store[w.key] > 0)) return;
    roll.pick = { type: "wake", key: w.key, name: w.name, bonus: s.store[w.key], die: null };
    roll.pay = null;
    renderDialog();
  },
  reroll() {
    roll.pick = { type: "reroll" };
    roll.pay = null;
    renderDialog();
  },
  "pick-cancel"() {
    roll.pick = null;
    roll.pay = null;
    renderDialog();
  },
  pick: (el) => pickDie(Number(el.dataset.i)),
  "reroll-all": () => reroll((roll.kind === "defence" ? roll.mine : roll.dice).map((_, i) => i)),
  "d-at"(el) {
    const x = roll.incoming[Number(el.dataset.j)];
    if (!x || x.fixed || (x.fear && el.dataset.v === "Body") || !R.ROOTS.includes(el.dataset.v)) return;
    x.at = el.dataset.v;
    renderDialog();
  },
  "d-add-at"(el) {
    roll.add = el.dataset.v;
    renderDialog();
  },
  "d-add"(el) {
    roll.incoming.push({ d: Number(el.dataset.v), at: roll.add, intent: "", fixed: false });
    roll.teles?.push(null);
    renderDialog();
  },
  "d-del"(el) {
    const i = Number(el.dataset.i);
    roll.incoming.splice(i, 1);
    roll.teles?.splice(i, 1);
    renderDialog();
  },
  "d-defend"(el) {
    roll.defend = el.dataset.v === "1";
    roll.count = null;
    recount();
  },
  // Defend's Root: the armour on it comes along as items.
  "d-root"(el) {
    const c = normal(current());
    roll.root = el.dataset.v;
    roll.items = new Set(piecesOf(c).filter((a) => (a.root ?? "Body") === roll.root && !isBroken(current().state, a)).map((a) => `equipment|${a.name}`));
    roll.count = null;
    recount();
  },
  "d-spec"(el) {
    roll.spec = el.dataset.v;
    roll.count = null;
    recount();
  },
  "d-item"(el) {
    flip(roll.items, el.dataset.k);
    roll.count = null;
    recount();
  },
  // Tap Swap on one telegraph, then another, and they trade the dice on them,
  // as long as each die can stop what it's swapped onto.
  "d-swap"(el) {
    const j = Number(el.dataset.j);
    const first = roll.swap;
    if (first == null || first === j) {
      roll.swap = first === j ? null : j;
      return renderDialog();
    }
    roll.swap = null;
    const a = roll.assign[first];
    const b = roll.assign[j];
    if ((a != null && !fits(roll.mine[a], roll.incoming[j])) || (b != null && !fits(roll.mine[b], roll.incoming[first]))) {
      toast("A track only stops what’s at its own Root, so those two can’t swap.", false);
      return renderDialog();
    }
    change("swapping two rolls", () => {
      [roll.assign[first], roll.assign[j]] = [roll.assign[j], roll.assign[first]];
      roll.swapped = true;
    }, { say: false });
  },
  "d-pay"(el) {
    const j = Number(el.dataset.j);
    const what = el.dataset.what;
    const label = { hit: "a hit getting through", box: "your armour taking it", vbox: "your armour taking one more", vuln: "one more size", two: "2 for 1", firm: "standing firm", cond: "a condition landing", else: "what it cost" }[what] ?? "what it cost";
    change(label, (s, c) => {
      const r = roll;
      if (!r || (r.paid[j] && what !== "vuln" && what !== "vbox")) return;
      const tele = r.incoming[j];
      const t = R.trackAt[tele.at];
      if (what === "hit") {
        r.log.push(hitAt(s, t));
        r.paid[j] = s.blaze === t ? `${TN(t)} took it, and Blazed` : `${TN(t)} down to d${s.tracks[t]}`;
        r.harm[j] = true;
      } else if (what === "box" || what === "vbox") {
        // A piece of armour on that Root takes it on a box, and its last box
        // breaks it. A vulnerability's one more, on this piece or another.
        const a = pieceAt(c, el.dataset.k);
        if (!a || leftOf(s, a) < 1 || (a.root ?? "Body") !== tele.at) return;
        if (what === "vbox" && (!r.harm[j] || (r.extra[j] ?? 0) >= vulnsOn(s).length)) return;
        const n = tickBox(s, a);
        const last = n >= a.boxes;
        // Kept short, since the GM's phone keeps 80 letters of it.
        if (what === "vbox") {
          r.extra[j] = (r.extra[j] ?? 0) + 1;
          r.paid[j] = `${r.paid[j]}, and ${yours(a)} took one more${last ? " and broke" : ""}`.slice(0, 80);
        } else r.paid[j] = last ? `${cap(yours(a))} took it and broke` : `${cap(yours(a))} took it: ${n} of ${a.boxes} ticked`;
        r.harm[j] = true;
      } else if (what === "vuln") {
        if (!r.harm[j] || (r.extra[j] ?? 0) >= vulnsOn(s).length) return;
        r.extra[j] = (r.extra[j] ?? 0) + 1;
        r.log.push(hitAt(s, t));
        r.paid[j] = `${r.paid[j]}, and one more size`.slice(0, 80);
      } else if (what === "two") {
        const w = JSON.parse(el.dataset.w);
        if (!R.payWith(s, w)) return;
        r.paid[j] = `2 for 1: ${R.payLabel(w)}`;
      } else if (what === "firm") {
        if (!(s.firm > 0)) return;
        s.firm -= 1;
        if (!s.firm) delete s.firm;
        r.paid[j] = "Stood firm, so it did nothing";
      } else if (what === "cond") {
        const x = condOf(tele.intent);
        if (!x) return;
        s.conditions = s.conditions.filter((y) => y.name !== x.name);
        s.conditions.push({ name: x.name, die: tele.d, kind: "against" });
        r.paid[j] = `${x.name} d${tele.d} on you`;
      } else if (what === "else") r.paid[j] = "Something else, the GM’s call";
    }, { say: false });
  },
  "d-go": () => defenceGo(false),
  "d-real": () => defenceGo(true),
};

document.addEventListener("click", (e) => {
  if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled || !ACT[el.dataset.act]) return;
  if (!el.closest("#app, #cc-dialog, #cc-toast")) return;
  ACT[el.dataset.act](el, e);
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const f = new FormData(form);
  const kind = form.dataset.form;
  if (kind.startsWith("k-")) return camps.submit(kind, form, f);
  if (kind.startsWith("p-")) return party.submit(kind, form, f);
  if (kind.startsWith("w-")) return world.submit(kind, form, f);
  if (kind.startsWith("ft-")) return turn.submit(kind, form, f);
  if (kind.startsWith("fd-")) return found.submit(kind, form, f);
  if (kind === "name") return start(roll?.crew, String(f.get("name") ?? "").trim().slice(0, 40));
  // A Blaze they live through: a Scar on that track, a Catch in their words,
  // and the track's on its smallest open size.
  if (kind === "scar") {
    const text = String(f.get("scar") ?? "").trim().slice(0, 80);
    change("taking a Scar", (s) => {
      const t = s.blaze;
      if (!t || !R.scarOn(s, t, text)) return "";
      return `You leave the scene with a Scar on your ${TN(t)}${text ? `, ${text}` : ""}. Its d${R.lowOf(s, t) - 2} is locked for good, and it’s on d${s.tracks[t]}.${text ? " Let it bite whenever you like, for 1 Aura." : ` Write it in as a Catch on your ${TN(t)}’s panel.`}`;
    });
    return;
  }
  if (kind === "scar-text") {
    const text = String(f.get("text") ?? "").trim().slice(0, 80);
    const t = form.dataset.t;
    const i = Number(form.dataset.i);
    if (text && R.TRACKS.includes(t)) change("writing a Scar in", (s) => {
      if (s.scars[t][i] == null) return "";
      s.scars[t][i] = text;
      return `${cap(text)} is written in. Let it bite whenever you like, for 1 Aura.`;
    });
    return;
  }
  if (kind === "pickup") {
    const name = String(f.get("what") ?? "").trim();
    const where = String(f.get("where"));
    const ch = current();
    const c = normal(ch);
    if (!name || !c) return;
    const max = where === "bag" ? c.carry.bag?.max ?? 10 : ROOM[where] ?? 0;
    const has = (where === "bag" ? c.carry.bag?.items?.length ?? 0 : (c.carry[where] ?? []).length) + ch.state.picked.filter((p) => p.where === where).length;
    if (has >= max) return toast(`There’s no room. That’s ${max} of ${max} already.`, false);
    change("picking something up", (s) => {
      s.picked.push({ where, name });
      return `${name} goes in ${where === "bag" ? "the bag" : `your ${where}`}.`;
    });
    return;
  }
  if (kind === "cond") {
    const own = String(f.get("own") ?? "").trim();
    const name = own || String(f.get("pick"));
    const kindOf = own ? (f.get("kind") === "for" ? "for" : "against") : COND.get(name)?.kind ?? "against";
    const die = even(f.get("die"), 2, 12);
    change("adding a condition", (s) => {
      s.conditions = s.conditions.filter((x) => x.name !== name);
      s.conditions.push({ name, die, kind: kindOf });
      return `${name} d${die}. It steps down a size at the end of every round.`;
    });
    return;
  }
  // Something grown before the Roots change, back on the new sheet.
  if (kind === "putback") {
    const n = Number(form.dataset.n);
    const get = (k) => String(f.get(k) ?? "").trim();
    change("putting it back", (s, c) => {
      const g = s.before?.find((x) => x.n === n);
      if (!g) return "";
      const root = get("root");
      let said = "";
      if (g.k === "perm" || g.k === "swap") {
        const t = Number(get("t"));
        if (!R.ROOTS.includes(root) || !get("spec") || !c.titles[t] || c.titles[t].permissions.length >= R.MAX_PERMS) return "";
        s.grown.push({ k: "perm", t, text: g.text, root, spec: get("spec").slice(0, 40) });
        said = `${cap(g.text)} is back on ${c.titles[t].name}, on your ${root} and your ${get("spec")}.`;
      } else if (g.k === "att") {
        const a = Number(get("a")) || 0;
        if (!c.attuned[a]) return "";
        if (g.up) s.grown.push({ k: "stage", a, to: R.STAGES[Math.min(2, R.STAGES.indexOf(c.attuned[a].stage) + 1)], catch: g.catch || "", burden: g.burden || "" });
        if (g.text) s.grown.push({ k: "awk", a, name: String(g.text).slice(0, 80), kind: get("kind") === "active" ? "active" : "passive", text: get("does") || g.text, catch: g.up ? "" : g.catch || "", burden: g.up ? "" : g.burden || "" });
        said = `${g.text ? cap(g.text) : "Its stage"} is back on ${lower(c.attuned[a].name)}.`;
      } else if (g.k === "title") {
        const specs = ["s1", "s2", "s3"].map(get).filter(Boolean).map((x) => x.slice(0, 40));
        if (!R.ROOTS.includes(root) || specs.length < 3) return "";
        const perm = g.perm && R.ROOTS.includes(get("proot")) && get("pspec") ? { text: g.perm, root: get("proot"), spec: get("pspec").slice(0, 40) } : null;
        s.grown.push({ k: "title", text: g.text, root, specs, perm });
        if (g.arch) s.grown.push({ k: "arch", arch: g.arch });
        said = `${cap(g.text)} is back on your sheet${g.arch ? `, and so is the ${g.arch}` : ""}.`;
      } else return "";
      s.before = s.before.filter((x) => x.n !== n);
      if (!s.before.length) delete s.before;
      return said;
    });
  }
});

document.addEventListener("change", (e) => {
  if (e.target.dataset?.dt != null && roll?.kind === "downtime") {
    dt.input(e.target, roll);
    if (e.target.tagName === "SELECT") renderDialog();
    return;
  }
  const el = e.target.closest("[data-in]");
  if (!el) return;
  const key = el.dataset.in;
  if ((key === "xspec" || key === "xvia") && roll?.extra) {
    const x = roll.extra[Number(el.dataset.i)];
    if (!x) return;
    if (key === "xspec") x.spec = el.value;
    else x.via = el.value;
    recount();
  } else if (key === "asp-text") {
    const ch = current();
    if (!ch) return;
    ch.state.aspText = el.value.trim();
    persist();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.dataset?.tg != null && ["tele", "tg-el", "tg-else"].includes(roll?.kind)) return table.input(e.target, roll);
  if (e.target.dataset?.ft != null && String(roll?.kind).startsWith("ft-")) return turn.input(e.target, roll);
  if (e.target.dataset?.dt != null && roll?.kind === "downtime") return dt.input(e.target, roll);
  if (e.target.dataset?.in === "intent" && roll?.intents) {
    roll.intents[e.target.dataset.k] = e.target.value.slice(0, 40);
    return;
  }
  if (e.target.dataset?.in !== "notes") return;
  const ch = current();
  if (!ch) return;
  ch.state.notes = e.target.value;
  clearTimeout(ui.notesTimer);
  ui.notesTimer = setTimeout(persist, 400);
});

document.addEventListener("toggle", (e) => {
  const key = e.target.dataset?.open;
  if (!key) return;
  if (e.target.open) ui.open.add(key);
  else ui.open.delete(key);
  // A Sheet tab fold the player shut stays shut, even one holding a gold mark,
  // and so does any other fold that's open until it's shut (data-shut).
  if (key.startsWith("sh-") || key.startsWith("lk-") || e.target.hasAttribute("data-shut")) {
    if (e.target.open) ui.shut.delete(key);
    else ui.shut.add(key);
  }
}, true);

dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) closeDialog();
});
addEventListener("popstate", () => {
  if (dialog.open) closeDialog(true);
  else route();
});
addEventListener("storage", (e) => {
  if (e.key !== "zi-characters" || dialog.open) return;
  const latest = openStore();
  store.data = latest.data;
  render();
});

if (history.state?.dlg) history.replaceState(null, "");
route();
sync.pull();
