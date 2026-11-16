// The character companion: one of the six crew on your phone, saved on the
// phone and working offline. Every number on a sheet comes from the current
// rules (the JSON the build puts in the page), and only what the player
// changes in play is saved (store.js). Since the new core (16 Nov 2026,
// notes/core-plan.md) every roll's one Root at full, with another brought in
// on a permission and any awakening that fits, and a Root's points are what
// keep a character standing: roots.js has the rules. Views are HTML strings, and
// one click handler reads data-act. Every change goes through change(), so it
// saves, redraws and can be undone. Every explanation's a question bubble
// (tip.js), never a paragraph on the screen.
import { SIZES, diceLabel, diceShapes, fillDice, rollDie, sizeDown, sizeUp, stepsToDice } from "./dice.js";
import { tip } from "./tip.js";
import { readLanes } from "./roller-rules.js";
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
import { makeRoller } from "./roller.js";
import { bondKey, threadKey, threadLabel, threadPlace, threadState } from "./threads.js";
import { boxesSaid, isBroken, itS, leftOf, many, nameOf, pieceAt, piecesOf, setTicked, tick as tickBox, tickedOf, yours } from "./armour.js";
import * as R from "./roots.js";
import { beforeView } from "./before.js";
import { foldGrown, fromBefore, hasDraft, makeBuilder, normalBuild, sheetOf } from "./builder.js";
import { fromCrew, randomBuild } from "./ways.js";
import { makeLearn } from "./learn.js";
import { aura as kitAura, crest, die as kitDie, mini as kitMini, plate as kitPlate, scars as kitScars, sigil, SIGILS } from "../kit/kit.js";

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
// The builder (builder.js), for a new character, changing one, or rebuilding
// one made before Roots.
const builder = makeBuilder({ B: DATA.build, link, icon: ICON, rule: (id) => ruleHtml(id), toast: (m, u) => toast(m, u), onLeave: (key) => nav(key && key !== "new" ? key : ""), onSave: saveBuilt, roll: () => randomBuild(DATA.build, DATA.crew), tools: () => themeButton() });
// The learning round (learn.js): one round with Isolde, Wren and Bram off
// their sheets, saved nowhere.
const learn = makeLearn({ crew: (id) => (CREW.has(id) ? R.rootsSheet(CREW.get(id), [], DATA.build) : null), esc, rules: RULE, ruleHtml: (id) => ruleHtml(id), isOpen: (key) => ui.open.has(key), throwDie, feel, tumble, calm, icon: ICON, sound: () => soundButton(), render: () => render() });


// The dice roller (roller.js): any dice of yours against any of theirs, with
// no telegraph or threat, off the play screen and the Characters list. It's
// only dice, so it never goes through change().
const roller = makeRoller({
  esc, icon: ICON, throwDie, calm, tumble, feel, dialog,
  open: (r) => openRoll(r),
  roll: () => roll,
  redraw: ({ reveal = false } = {}) => {
    if (reveal) ui.reveal = true;
    renderDialog();
  },
  spinning: (stop) => {
    ui.stopSpin?.();
    ui.stopSpin = stop;
  },
});

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
  sheet: (ch) => sheetFor(ch),
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
  // The live table's answer, a roll at the scene and a roll on a Root open
  // the roll card on the Root picked there (prompt 8).
  answer: (root, tele, o = {}) => openAction({ root, tele, rid: tele?.rid ?? o.rid ?? null }),
  work: (root, w) => openAction({ root, work: w }),
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
  // A character on this phone, by id, and a point of Soul paid to roll the
  // crew's dice again (Rolling in downtime). resolve is the points of Soul
  // they've got to pay with, and soul says so.
  character: (id) => {
    const ch = chars().find((x) => x.id === id);
    if (!ch || !normal(ch)) return null;
    return { resolve: ch.state.pts.Soul, die: ch.state.pts.Soul, soul: true };
  },
  spendResolve: (id) => {
    const ch = chars().find((x) => x.id === id);
    if (!ch || !normal(ch) || ch.state.pts.Soul < 1) return false;
    if (current()?.id === ch.id) {
      change("paying a point of Soul to roll the crew’s action again", (s) => {
        R.spendPts(s, "Soul", 1);
        return `Your Soul’s on ${s.pts.Soul}.`;
      }, { say: false });
      return true;
    }
    R.spendPts(ch.state, "Soul", 1);
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
  newBuild: () => {
    if (!hasDraft()) builder.discard("new");
    navBuild("new");
  },
  playCrew: (id) => ACT.play({ dataset: { c: id } }),
  look: {
    link: (id, text) => link(id, text), crestOf: (c) => crestOf(c), lastRollView: (last) => lastRollView(last), isOpen: (key) => ui.open.has(key),
    trackView: (ch, c) => trackView(ch, c, ch.state, true), sheetFolds: (ch, c) => sheetFolds(ch, c, true), archNames: (c) => archNames(c),
  },
});

const chars = () => store.data.characters;
const current = () => (view.name === "sheet" ? chars().find((x) => x.id === view.id) ?? null : null);

// A character built on this phone before the Roots change (or made their own
// from the crew) is shown as it was (before.js) till the player rebuilds them
// on Roots in the builder. One of the crew moves onto Roots by itself,
// keeping everything that still means the same (roots.js, fromOld).
const isBefore = (ch) => Boolean(ch && ch.crew === "own" && (R.isOldBuild(ch.build) || !ch.build));

// A character built on this phone carries its build, and its sheet's made from
// that against the current rules (builder.js). The crew's come straight off
// the chapter. What they've grown in downtime goes on top (roots.js, growRoots).
const sheets = new Map();
function sheetFor(ch) {
  if (!ch || isBefore(ch)) return null;
  const base = ch.build ? sheetOf(ch, DATA.build) : CREW.get(ch.crew) ?? null;
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
// before the new core moves onto it here, once, and says so till it's seen
// (roots.js, normalCore), from stacking, Roots or before.
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
  ch.state = R.normalCore(ch.state, c);
  ch.state.last = lastRoll(ch.state.last);
  delete ch.state.fits;
  return c;
}

// Changing a character starts from their build, or from a crew member's sheet
// made into one that keeps everything, with what they've grown in downtime and
// the Aspiration's words written in. One built before Roots is rebuilt on it
// (fromBefore), with what they'd grown then folded in first. Each thread and
// thing they carry remembers what it said, so whatever's strained or crossed
// out follows it if it's reworded. basisOf() says when any of that has
// changed, so a change that was left part way starts again rather than
// losing it.
function editBuild(ch) {
  const crew = !ch.build && CREW.get(ch.crew);
  if (!ch.build && !crew) return null;
  const b = isBefore(ch) ? fromBefore(withOldGrowth(ch.build, ch.state?.grown)) : foldGrown(ch.build ? normalBuild(ch.build) : fromCrew(crew, DATA.build, { keep: true }), ch.state?.grown, DATA.build);
  b.name = ch.name;
  if (ch.state?.aspText) b.aspiration = String(ch.state.aspText).slice(0, 160);
  for (const t of b.threads) if (t.person.trim() && t.text.trim()) t.was = `${t.person.trim()}|${t.text.trim()}`;
  for (const [where, list] of [["equipment", b.equipment], ["utility", b.utility], ["keepsake", [b.keepsake]]]) for (const x of list) if (x.text.trim()) x.was = `${where}|${x.text.trim()}`;
  b.bagWas = bagLines(b.bag);
  return b;
}
// What a character built before Roots grew in downtime then, written into
// their old build so the rebuild has all of it: permissions and Titles,
// swaps, attuned things' permissions and stages, and threads. Traits are gone.
function withOldGrowth(raw, grown) {
  const b = JSON.parse(JSON.stringify(raw && typeof raw === "object" ? raw : {}));
  b.titles = Array.isArray(b.titles) ? b.titles : [];
  b.attuned = Array.isArray(b.attuned) ? b.attuned : [];
  b.threads = Array.isArray(b.threads) ? b.threads : [];
  const said = (x) => String(typeof x === "string" ? x : x?.text ?? "").trim();
  const titleAt = (k) => b.titles.filter((t) => said(t) || t?.arch || (t?.perms ?? []).some(said))[k];
  const thingAt = (k) => b.attuned.filter((a) => said(a?.name) || (a?.perms ?? []).some(said))[k];
  for (const g of Array.isArray(grown) ? grown : []) {
    if (!g || typeof g !== "object") continue;
    const text = String(g.text ?? "").trim();
    if (g.k === "perm" && text) titleAt(g.t)?.perms?.push({ text, on: g.on ?? [] });
    else if (g.k === "swap" && text) {
      const t = titleAt(g.t);
      const p = t?.perms?.find((x) => said(x) === g.from) ?? t?.perms?.filter(said)[g.j];
      if (p) Object.assign(p, { text, on: g.on ?? [] });
    } else if (g.k === "att") {
      const a = thingAt(g.a);
      if (!a) continue;
      if (g.up) a.stage = R.STAGES[Math.min(2, R.STAGES.indexOf(a.stage ?? "Awakened") + 1)];
      if (g.catch && !a.catch) a.catch = g.catch;
      if (g.burden && !a.burden) a.burden = g.burden;
      if (text) (a.perms = a.perms ?? []).push({ text, on: g.on ?? [] });
    } else if (g.k === "thread" && text && g.person) b.threads.push({ person: g.person, text, kind: g.kind === "hostile" ? "hostile" : "bond" });
    else if (g.k === "title" && text) b.titles.push({ arch: g.arch ?? "", idea: "", text, on: g.on ?? [], perms: g.perm ? [{ text: g.perm, on: g.permOn ?? [] }] : [] });
  }
  return b;
}
const bagLines = (bag) => String(bag ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
function basisOf(ch) {
  const text = JSON.stringify([ch.crew, ch.name, ch.build ?? null, ch.state?.grown ?? [], ch.state?.aspText ?? ""]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
const canChange = (ch) => Boolean(ch && (ch.build || CREW.has(ch.crew)));

// The last roll keeps a name and numbers only, the way the roll card saves it
// (lastOf), so nothing else in it can reach the screen, and what went into it
// (picks: its Root and the things in it by their keys) for Again.
function lastRoll(l) {
  if (!l || typeof l !== "object" || !Array.isArray(l.dice)) return null;
  const int = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
  const pk = l.picks;
  const p = pk && typeof pk === "object" && R.ROOTS.includes(pk.root) ? {
    root: pk.root,
    bring: (Array.isArray(pk.bring) ? pk.bring : []).filter((b) => b && R.ROOTS.includes(b.root)).slice(0, 2).map((b) => ({ root: b.root, perm: String(b.perm ?? "").slice(0, 160), pay: b.pay === "aura" ? "aura" : "pt" })),
    awk: (Array.isArray(pk.awk) ? pk.awk : []).filter((w) => w && typeof w.key === "string").slice(0, 12).map((w) => ({ key: w.key.slice(0, 160), aura: int(w.aura) })),
  } : null;
  return {
    name: String(l.name ?? "").slice(0, 80), steps: int(l.steps),
    dice: l.dice.slice(0, 24).map((d) => ({ size: int(d?.size), total: int(d?.total), out: ["beat", "won", "tie", "under"].includes(d?.out) ? d.out : null, mark: Boolean(d?.mark), ...(Number.isInteger(d?.vs) ? { vs: int(d.vs) } : {}) })),
    opp: l.opp == null ? null : int(l.opp), at: int(l.at), ...(p ? { picks: p } : {}), ...(Number.isInteger(l.heal) ? { heal: int(l.heal) } : {}),
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
// it goes to the GM, and an Undo takes it back from her too. When it lands
// says, for each telegraph, the die that stopped it or that it rode on: the
// track for its Root, or Defend's.
function noteTable(s) {
  const r = roll;
  if (!r || r.mode !== "result" || r.pick) return;
  // The telegraph or the stake is what it's first up against, and only the
  // dice aimed at it go to the GM. The rest went at other things.
  const first = r.kind === "action" ? r.foes?.[0] : null;
  const at0 = r.kind === "action" ? (r.dice ?? []).filter((x) => x.at === 0) : [];
  const rolled = () => at0.map((x) => ({ size: x.size, total: x.nat + x.plus, out: outcome(x) }));
  if (r.kind === "action" && r.tele) {
    // It's an answer while it's against the telegraph's die, or the number the GM rolled for it.
    const answered = first?.v != null && at0.length > 0 && (first.size === r.tele.d || !first.size);
    // Whoever put their action in, while their steps are still in it.
    const with_ = r.friends.length ? (r.tele.with ?? []).map((w) => ({ user: w.user, ch: w.ch })) : [];
    const g = r.groups.main;
    const bring = Object.keys(g.bring ?? {}).filter((x) => x !== g.root);
    table.record(s, r.tele.camp, "a", r.tele.id, answered ? { root: g.root, ...(bring.length ? { bring } : {}), steps: Math.max(1, r.total - r.friends.reduce((t, f) => t + (Number(f) || 0), 0)), ...(r.tele.rid ? { rid: r.tele.rid } : {}), dice: rolled(), opp: first.v, real: Boolean(r.real), ...(with_.length ? { with: with_ } : {}) } : null);
  }
  // A roll at a stake or an event on the live table's scene is an action.
  if (r.kind === "action" && r.work) {
    const worked = first?.v != null && at0.length > 0 && (first.size === r.work.d || !first.size);
    table.noteWork(s, r, worked ? { id: r.work.actId, k: "work", ref: r.work.ref, root: r.groups.main.root, steps: r.total, ...(r.work.rid ? { rid: r.work.rid } : {}), roll: { dice: rolled(), opp: first.v, real: Boolean(r.real) }, aim: r.work.aim } : null);
  }
  if (r.kind === "defence" && r.camp && r.teles?.some(Boolean)) {
    for (const h of blocks(r)) {
      const id = r.teles[h.j];
      const m = h.pair != null ? r.mine[h.pair] : null;
      // Its Root or Defend, and what got through in numbers: the hits, the
      // points off each Root, armour's boxes, and a wound or a Scar.
      const on = m?.src === "defend" ? "Defend" : m?.root ?? r.incoming[h.j].at;
      const x = r.cost?.[h.j] ?? {};
      const got = h.by == null ? { hits: h.hits, ...(Object.keys(x.lost ?? {}).length ? { lost: x.lost } : {}), ...(x.box ? { box: x.box } : {}), ...(x.wound ? { wound: x.wound } : {}), ...(x.scar ? { scar: x.scar } : {}) } : {};
      if (id) table.record(s, r.camp, "d", id, { on, stopped: h.by != null, mine: r.incoming[h.j].nodef ? null : h.mine, v: h.v, paid: r.paid[h.j] || "", real: Boolean(r.real), ...got });
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
// A hit that gets through to a Root, or more than one, each a point off it,
// or 2 points of another Root each (on). At 0 it wounds it, and on a wounded
// Root at 0 it's a Scar, waiting for its Catch. It says what happened.
function hitAt(c, s, root, n = 1, on = null) {
  const h = R.takeHits(c, s, root, n, { on });
  if (!h.ok) return `Your ${on} hasn’t got ${2 * n} points to take it with.`;
  if (h.on) {
    thud = Math.max(thud, 1);
    return `You take it on your ${h.on}, 2 for 1, so it’s on ${s.pts[h.on]}, and your ${root} stays on ${s.pts[root]}.`;
  }
  thud = Math.max(thud, h.scar || h.wound ? 2 : h.lost ? 1 : 0);
  if (h.scar) return `${h.lost ? `Your ${root}’s down to 0, and` : `Your ${root} was ${R.WOUNDS[root]} with nothing left, so`} that’s a Scar. Write it in, and you leave the scene.`;
  if (h.wound) return `${h.lost ? `Your ${root}’s down to 0, and` : `Your ${root} had nothing left, so`} you’re ${R.WOUNDS[root]}. It heals only to ${R.capOf(c, s, root)} now, and the next hit there is a Scar.`;
  if (h.lost) return `Your ${root}’s on ${s.pts[root]}.${s.pts[root] ? "" : ` The next hit there leaves you ${R.WOUNDS[root]}.`}`;
  return "";
}
// A point back on a Root, as far as it can hold. Nothing heals a Scar.
function backOne(c, s, root, cap = R.capOf(c, s, root)) {
  if (s.pts[root] >= cap) return `Your ${root}’s on ${s.pts[root]}, as far as it goes.`;
  s.pts[root] += 1;
  return `Your ${root}’s on ${s.pts[root]}.`;
}
// The end of a scene: Aura's full, conditions end, and so does anything that
// only lasted the round or the scene. The rest roll and Toll come first
// (restView, sceneEnd). A Scar that's still waiting stays until the player
// chooses.
function endScene(s, c) {
  R.doneActing(s, c);
  s.aura = R.auraMax(c, s);
  s.conditions = [];
  delete s.firm;
  delete s.firmPaid;
  delete s.blazing;
  // What the Boons give once a scene comes back.
  delete s.tough;
  delete s.beyond;
  delete s.elem;
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

function listView() {
  const mine = chars();
  const saved = (ch) => {
    const c = sheetFor(ch);
    const s = c ? R.normalCore(R.isOldState(ch.state) ? R.fromOld(ch.state, c) : ch.state, c) : null;
    const small = isBefore(ch) ? "Your own, from before the Roots change"
      : c ? `${ch.build ? "Your own" : esc(c.name)}${c.title ? ` · <em>${esc(c.title)}</em>` : ""}` : "This sheet isn’t in the rules any more";
    return `<li><a class="card cc-saved" href="/characters/?c=${encodeURIComponent(ch.id)}" data-act="nav" data-id="${esc(ch.id)}">
      <span class="die" aria-hidden="true">${esc((ch.name || "?").slice(0, 1))}</span>
      <span class="cc-saved-text"><b>${esc(ch.name)}</b>
      <small>${small}</small>
      ${s ? `<small>${glancePts(c, s)} · Aura ${s.aura}</small>` : ""}</span></a></li>`;
  };
  const draft = hasDraft();
  // The other ways in start a new character, so with a draft on the go they
  // ask for a second tap first.
  const way = (w, label) => `<button type="button" class="button" data-act="bway" data-w="${esc(w)}">${ui.sure === `w:${w}` ? `Tap again to bin ${esc(draft?.name || "your draft")}` : label}</button>`;
  const crew = (c) => `<article class="card">
    <div class="art"><span class="die" aria-hidden="true">${esc(c.name.slice(0, 1))}</span></div>
    <div class="body"><h3>${esc(c.name)}</h3><p class="title">${esc(c.title)}</p>
      <div class="chips">${archNames(R.rootsSheet(c)).map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>
      <p class="blurb">${esc(c.blurb)}</p>
      <div class="cc-row"><button type="button" class="button primary" data-act="play" data-c="${esc(c.id)}">Play ${esc(c.name)}</button>${way(c.id, `Make your own from ${esc(c.name)}`)}</div></div></article>`;
  return `<header class="cc-intro"><p class="kicker">Your phone at the table</p><h1>Characters</h1>
    <p class="lede">Build your own or pick one of the crew, and play them from your phone. The counting’s done for you, and they’re saved on this phone, signal or not.</p>
    <p class="cc-paper">Playing on paper? Print a character sheet and the player reference from the <a href="/sheets/">Sheets page</a>.</p></header>
    ${saveNote()}
    ${accountNote()}
    ${camps.section()}
    ${mine.length ? `<section class="cc-sec" aria-labelledby="cc-mine"><h2 id="cc-mine">On this phone</h2><ul class="cc-mine">${mine.map(saved).join("")}</ul></section>` : ""}
    <section class="cc-sec" aria-labelledby="cc-learn"><h2 id="cc-learn">Learn to play</h2>
      <p class="cc-lead">New to Zi’Dara? Play one round on your phone first. The brute swings his club at Isolde, and you answer it with Wren and Bram.</p>
      <div class="cc-row"><a class="button${mine.length ? "" : " primary"}" href="/characters/?learn" data-act="learn" data-do="open">Play the learning round</a></div></section>
    <section class="cc-sec" aria-labelledby="cc-dice"><h2 id="cc-dice">Dice roller</h2>
      <p class="cc-lead">Any dice you like, yours against theirs, all rolled together. You don’t need a character for it.</p>
      <div class="cc-row"><button type="button" class="button" data-act="dz" data-dz="open" data-from="list">Roll some dice</button></div></section>
    <section class="cc-sec" aria-labelledby="cc-own"><h2 id="cc-own">Make your own</h2>
      <p class="cc-lead">Build a character step by step. It follows the ${link("s-quick", "Quick Build")}, with the rules for each step right there, and it’s saved on this phone as you go.</p>
      <div class="cc-row">${draft ? `<a class="button primary" href="/characters/?build" data-act="bopen">Carry on with ${esc(draft.name || "your character")}</a><button type="button" class="button" data-act="bdrop">${ui.sure === true ? "Tap again to bin it" : "Start again"}</button>` : '<a class="button primary" href="/characters/?build" data-act="bopen">Build a character</a>'}</div>
      <p class="cc-lead">Or have the whole sheet on one page: start blank, let the dice pick everything, or start from one of the crew below.</p>
      <div class="cc-row">${way("blank", "A blank sheet")}${way("random", "Random")}</div></section>
    <section class="cc-sec" aria-labelledby="cc-crew"><h2 id="cc-crew">Pick from the crew</h2>
      <p class="cc-lead">Six ready-made characters, straight off their sheets in the ${link("s-pregens", "rules")}.</p>
      <div class="crew">${DATA.crew.map(crew).join("")}</div></section>`;
}

// ---------------------------------------------------------------- the sheet

function missingView(ch) {
  return `<a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a>
    <div class="cc-note is-warn"><p>${ch ? `${esc(ch.name)}’s sheet isn’t in the rules any more, so there’s nothing to play from.` : "That character isn’t saved on this phone."}</p>
    ${ch ? '<div class="cc-row"><button type="button" class="button" data-act="delete">Delete them from this phone</button></div>' : ""}</div>`;
}

// A rule from the book, kept in the page so it reads offline.
const ruleHtml = (id) => `${RULE[id]?.html ?? ""}<p class="cc-small">${link(id, RULE[id] ? `${esc(RULE[id].title)} in the rules` : "Read it in the rules")}</p>`;
// A rule from the book as a question bubble: its paragraphs and each of its
// points a line, then where it is in the rules.
const tipLines = (html) => String(html ?? "").replace(/<\/?(ul|ol)(\s[^>]*)?>/g, "").split(/<\/p>|<\/li>/).map((x) => x.replace(/<(p|li)(\s[^>]*)?>/g, "").trim()).filter(Boolean);
const ruleTip = (id, label = "", key = "") => tip(key || `r-${id}`, [...tipLines(RULE[id]?.html), link(id, `${esc(RULE[id]?.title ?? "It")} in the rules`)], label || RULE[id]?.title || "The rules");

// The trackers on the play screen, on the new core: Body, Mind and Soul as
// the points each one's got left, out of what it can hold, with its wound,
// its Scars and a plate for every box of armour on it, then Aura's hexes,
// Undo, and the conditions with any Toll. Tap one for its buttons and its
// rule. A GM's look at a player's character draws the same thing with
// nothing to tap.
const quiet = (html) => html.replace('role="img"', 'aria-hidden="true"');
const platesOf = (c, s, root) => piecesOf(c).filter((a) => (a.root ?? "Body") === root).map((a) => Array.from({ length: a.boxes }, (_, j) => kitPlate(j < tickedOf(s, a))).join("")).join("");
// A Root's points as a row of pips: the points it's got, the room it's got to
// heal, what a wound shuts away till it's cleared, and what's locked.
function pipsOf(c, s, root) {
  const n = c.roots[root] ?? 0;
  const cap = R.capOf(c, s, root);
  const open = Math.max(0, n - R.lockedOf(c, s)[root]);
  return `<span class="cc-pips${n > 12 ? " is-many" : ""}" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < s.pts[root] ? "on" : i < cap ? "" : i < open ? "shut" : "lock"}"></i>`).join("")}</span>`;
}
const ptsSaid = (c, s, root) => `${s.pts[root]} of ${R.capOf(c, s, root)}`;
// Each Root's points, for a line: "Body 7/10, Bloodied · Mind 5/5 · Soul 0/0".
const glancePts = (c, s) => R.ROOTS.map((r) => `${r} ${s.pts[r]}/${R.capOf(c, s, r)}${s.wound[r] ? `, ${R.WOUNDS[r]}` : ""}`).join(" · ");
function trackView(ch, c, s, look = false) {
  const u = look ? null : lastUndo(ch);
  const max = R.auraMax(c, s);
  const stat = (key, label, body, cls = "", gid = `num:${key}`) => (look
    ? `<div class="cc-stat t-${key.toLowerCase()}${cls}"><span class="k">${label}</span>${body}</div>`
    : `<button type="button" class="cc-stat t-${key.toLowerCase()}${cls}${ui.panel === key ? " is-open" : ""}${goldOf(gid) ? " is-changed" : ""}" data-act="panel" data-p="${key}" aria-expanded="${ui.panel === key}" aria-controls="cc-panel"><span class="k">${label}${goldDot(gid)}</span>${body}</button>`);
  const root = (r) => {
    const plates = platesOf(c, s, r);
    const says = s.blaze === r ? "a Scar" : s.wound[r] ? R.WOUNDS[r] : !s.pts[r] ? "exposed" : "";
    return stat(r, r, `<span class="cc-now"><span class="v">${s.pts[r]}<small>/${R.capOf(c, s, r)}</small></span>${says ? `<span class="cc-mood${s.wound[r] || s.blaze === r ? " is-hurt" : ""}">${says}</span>` : ""}${s.scars[r].length ? kitScars(s.scars[r].length) : ""}${plates ? `<span class="cc-plates" aria-hidden="true">${plates}</span>` : ""}</span>${pipsOf(c, s, r)}`, " is-trk", `root:${r}`);
  };
  const conds = [
    s.toll ? `<span class="cc-tag is-toll"><em>Toll</em> ${s.toll}</span>` : "",
    ...s.conditions.map((x) => `<span class="cc-tag is-${x.kind}">${kitMini(x.die, { own: x.kind === "for" ? "you" : "harm" })}<em>${esc(x.name)}</em> d${x.die}</span>`),
  ].join("");
  const condsV = conds ? `<span class="v cc-conds-now">${conds}</span>` : `<span class="v cc-none">None on ${look ? "them" : "you"}</span>`;
  const over = s.aura > max;
  const label = look ? `${esc(ch.name)}’s Body, Mind, Soul, Aura and conditions` : "Body, Mind, Soul, Aura and conditions";
  return `<div class="cc-track is-roots is-core${look ? " is-look" : ""}" role="group" aria-label="${label}">
    ${R.ROOTS.map(root).join("")}
    ${stat("aura", over ? "Aura <small>while acting</small>" : "Aura", `<span class="cc-row-in">${quiet(kitAura(s.aura, Math.max(max, s.aura)))}<span class="v">${s.aura}<small>/${max}</small></span></span>`, over ? " is-over" : "")}
    ${look ? "" : `<button type="button" class="cc-undo" data-act="undo"${off(!u)} aria-label="${u ? `Undo ${esc(u.label)}` : "Nothing to undo"}">${ICON.undo}<span aria-hidden="true">Undo</span></button>`}
    ${stat("cond", s.toll ? "Conditions and Toll" : "Conditions", condsV)}
  </div>${!look && ui.panel ? `<div id="cc-panel" class="cc-panel">${goldNow(R.ROOTS.includes(ui.panel) ? `root:${ui.panel}` : `num:${ui.panel}`)}${panelView(ui.panel, c, s)}</div>` : ""}`;
}

// Regen's Root: the one that's lost most, the first of them on a tie.
const regenRoot = (c, s) => R.ROOTS.filter((r) => s.pts[r] < R.capOf(c, s, r)).sort((a, b) => (R.capOf(c, s, b) - s.pts[b]) - (R.capOf(c, s, a) - s.pts[a]))[0] ?? null;

// The Boons that get Aura back: 1 when a threat falls to you, and 1 past
// your maximum when a scene starts somewhere your Title belongs.
function auraBoons(c, s) {
  const threat = R.boonCount(c, "Beat a threat") > 0;
  const elem = R.boonCount(c, "In your element") > 0;
  if (!threat && !elem) return "";
  const said = [threat ? `${esc(cap(R.boonSaid(c, "Beat a threat")))}: 1 Aura whenever a threat of any kind falls to you, a monster, a locked door, a puzzle or an argument.` : "", elem ? `${esc(cap(R.boonSaid(c, "In your element")))}: start a scene somewhere your Title belongs and take 1 Aura, even past your maximum.` : ""];
  return `<div class="cc-row">${threat ? `<button type="button" class="button" data-act="aura" data-d="1" data-why="threat">A threat fell to me: 1 Aura</button>` : ""}${elem ? `<button type="button" class="button" data-act="elem"${off(s.elem)}>In my element: 1 Aura${s.elem ? ", taken this scene" : ", even past my maximum"}</button>` : ""}${tip("pa-boons", said, threat && elem ? "Your Boons that get Aura back" : "Your Boon that gets Aura back")}</div>`;
}

// What each tracker opens: its buttons, then its rule from the book.
function panelView(key, c, s) {
  if (key === "aura") {
    const max = R.auraMax(c, s);
    // A Guardian intercepts for free, so there's nothing to pay.
    const free = isA(c, "Guardian");
    return `<p><b>Aura ${s.aura} of ${max}${s.acting ? ", and you’re acting" : ""}.</b> ${ruleTip("s-aura", "How Aura works", "pa-aura")}</p>
      <div class="cc-row">${s.acting ? `<button type="button" class="button primary" data-act="acting" data-v="0">I’ve finished acting${s.aura > max ? `: ${s.aura - max} goes` : ""}</button>` : '<button type="button" class="button" data-act="acting" data-v="1">I’m acting now</button>'}</div>
      <div class="cc-row"><button type="button" class="button" data-act="aura" data-d="-1"${off(s.aura < 1)}>Spend 1</button><button type="button" class="button" data-act="aura" data-d="1">Get 1 back</button>${free ? "" : `<button type="button" class="button" data-act="aura" data-d="-1" data-why="intercept"${off(s.aura < 1)}>Intercept for a friend: 1 Aura</button>`}
        <button type="button" class="button" data-act="aura" data-d="-1" data-why="quick"${off(s.aura < 1)}>Quick heal a friend: 1 Aura</button></div>
      ${auraBoons(c, s)}
      <p class="cc-small">${free ? "You intercept for free." : "Intercepting’s 1 Aura for each friend, and no action."} ${tip("pa-icept", [free ? "As a Guardian you intercept for free, for every friend within your stride." : "Intercepting takes the blows aimed at a friend within your stride, and they come at your Body instead. It’s 1 Aura for each friend, and no action.", "It’s only for what’s at their Body, because nobody can step in front of fear or despair.", "A quick heal’s 1 Aura and your action, and someone you can reach gets a point back on one of their Roots, no roll and no Toll.", link("s-intercept", "Intercept in the rules")], "Intercepts and quick heals")}</p>`;
  }
  if (R.ROOTS.includes(key)) {
    const root = key;
    const n = c.roots[root];
    const cap = R.capOf(c, s, root);
    const locks = R.awakeningsOf(c, s).filter((w) => w.works && w.root === root);
    const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === root);
    const others = R.ROOTS.filter((x) => x !== root && s.pts[x] >= 2);
    const scars = s.scars[root].map((x, i) => `<li class="cc-item">${x ? `<p><em>${esc(x)}</em> <small>a Scar, locking a point</small></p><div class="cc-row"><button type="button" class="button sm" data-act="unscar" data-r="${root}" data-i="${i}">The story’s taken it away</button></div>`
      : `<form class="cc-form" data-form="scar-text" data-r="${root}" data-i="${i}"><label class="cc-field">Write this Scar in as a Catch, like <em>a spear through the shoulder</em> <input name="text" maxlength="80" autocomplete="off" required></label><button type="submit" class="button sm">Write it in</button></form>`}</li>`).join("");
    const armour = pieces.map((a) => {
      const ticked = tickedOf(s, a);
      const key2 = `equipment|${a.name}`;
      const marks = Array.from({ length: a.boxes }, (_, j) => `<button type="button" class="cc-box" data-act="box" data-k="${esc(key2)}" data-n="${j + 1}"${pressed(j < ticked)} aria-label="${esc(cap2(a.name))}, box ${j + 1} of ${a.boxes}">${kitPlate(j < ticked)}</button>`).join("");
      return `<li class="cc-thing-row cc-armour"><span class="cc-thing${isBroken(s, a) ? " is-out" : ""}"><span>${esc(a.name)}</span><small>${esc(a.quality)}${a.when ? `, ${esc(a.when)}` : ""}${isBroken(s, a) ? ", broken" : ""}</small></span><span class="cc-boxes" role="group" aria-label="${esc(cap2(a.name))}’s boxes, ${ticked} of ${a.boxes} ticked">${marks}</span></li>`;
    }).join("");
    const locked = [...locks.map((w) => `<em>${esc(w.name)}</em>`), ...(s.scars[root].length ? [`${s.scars[root].length === 1 ? "a Scar" : `${s.scars[root].length} Scars`}`] : [])];
    const regen = R.boonCount(c, "Regen") ? `<div class="cc-row"><button type="button" class="button" data-act="regen"${off(!regenRoot(c, s))}>End of a round: ${esc(R.boonSaid(c, "Regen"))}</button></div><p class="cc-small">${regenRoot(c, s) ? `It rolls your ${regenRoot(c, s)}.` : "All three are full."} ${tip(`pa-regen-${root}`, "At the end of each round, roll the Root that’s lost most, and a top face is a point back.", `How ${esc(R.boonSaid(c, "Regen"))} works`)}</p>` : "";
    return `<p><b>${root} ${ptsSaid(c, s, root)}.</b> ${n ? `It rolls ${steps(n)}, ${diceLabel(stepsToDice(n))}, however many points it’s got left.` : "It’s 0, so it rolls a d2, and its first hit wounds it."}${s.wound[root] ? ` You’re <b>${R.WOUNDS[root]}</b>${n ? `, so it heals only to ${cap} till downtime or a moment in the story clears it` : " till downtime or a moment in the story clears it"}.` : ""}${locked.length ? ` ${andList(locked)} lock${locked.length === 1 && !s.scars[root].length ? "s" : ""} ${R.lockedOf(c, s)[root] === 1 ? "a point" : `${R.lockedOf(c, s)[root]} points`} of it.` : ""} ${tip(`pa-${root}`, [n ? `A ${root} of ${n} is ${n} steps of dice, ${n} points to take hits with, and ${n} to spend pushing yourself, less what’s locked.` : `A ${root} of 0 rolls a d2, and it’s got no points, so its first hit wounds it, unless you take it on another Root for 2 points.`, `A hit that gets through takes a point. A hit on it at 0 wounds it, and a hit on it wounded at 0 is a Scar, and you leave the scene.`, "Pushing never hurts you: you can’t spend points you haven’t got.", link("s-tracks", "Your points in the rules")], `How your ${root} works`)}</p>
      <div class="cc-row"><button type="button" class="button" data-act="hit" data-r="${root}"${off(s.out || s.blaze)}>A hit gets through</button>${others.map((x) => `<button type="button" class="button" data-act="hit" data-r="${root}" data-on="${x}"${off(s.out || s.blaze)}>Take it on your ${x}: 2 points</button>`).join("")}</div>
      <div class="cc-row"><button type="button" class="button" data-act="spend" data-r="${root}"${off(s.pts[root] < 1)}>Spend a point</button><button type="button" class="button" data-act="back" data-r="${root}"${off(s.pts[root] >= cap)}>A point back</button><button type="button" class="button" data-act="healin"${off(!R.ROOTS.some((x) => s.pts[x] < R.capOf(c, s, x)))}>A heal</button>${root === "Mind" ? `<button type="button" class="button" data-act="breath"${off(s.pts.Mind >= Math.ceil(cap / 2))}>Take a breath: a point back, up to ${Math.ceil(cap / 2)}</button>` : ""}</div>
      ${s.wound[root] ? `<div class="cc-row"><button type="button" class="button" data-act="blaze" data-r="${root}"${off(!R.canBlaze(s, root))}>Take the Blaze</button><button type="button" class="button" data-act="unwound" data-r="${root}">The story clears it</button>${tip(`pa-blaze-${root}`, ["While you’re wounded you can go out on your own terms: take the Scar, say something extraordinary and it happens, no roll, then leave the scene. It’s your action.", "From your very first Blaze, you can choose for your character to die instead.", link("s-blaze", "Wounds, Scars and the Blaze in the rules")], "The Blaze")}</div>` : ""}
      ${regen}
      ${pieces.length ? `<h3 class="cc-h3">Armour on your ${root} ${tip(`pa-arm-${root}`, [`Offer it when a hit gets through to your ${root}, and tick a box instead of losing a point.`, "Its last box breaks it, till it’s mended in downtime."], "How armour’s boxes work")}</h3><ul class="cc-things">${armour}</ul>` : ""}
      ${s.scars[root].length ? `<h3 class="cc-h3">Scars</h3><ul class="cc-list">${scars}</ul>` : ""}`;
  }
  // Conditions: what each one does behind its ?, and a form to add one. Toll
  // sits here too, with what a heal loses for it.
  const conds = s.conditions.map((x, i) => {
    const rule = COND.get(x.name);
    const what = rule ? `${rule.passive} Spend it and ${rule.active}` : "";
    return `<li class="cc-cond is-${x.kind}">${kitDie(x.die, { own: x.kind === "for" ? "you" : "harm", label: `d${x.die}`, cls: "cc-cond-die" })}<div><p><b><em>${esc(x.name)}</em></b> <small>${x.kind === "for" ? "for you" : "against you"}</small>${what ? ` ${tip(`pa-cond-${i}`, what, `What ${x.name} does`)}` : ""}</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="cond-down" data-i="${i}">Down a size</button><button type="button" class="button sm" data-act="cond-off" data-i="${i}">Spent or broken</button></div></div></li>`;
  }).join("");
  const options = ["against", "for"].map((kind) => `<optgroup label="${kind === "for" ? "For you" : "Against you"}">${DATA.conditions.filter((x) => x.kind === kind).map((x) => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("")}</optgroup>`).join("");
  const toll = `<div class="cc-toll"><p><b>Toll ${s.toll}.</b> ${s.toll ? `The next heal from someone else loses ${R.TOLL_STEP * s.toll}.` : "Your next heal’s whole."} ${tip("pa-toll", ["Every heal you take from someone or something else is 1 more Toll, and a heal loses 5 for each Toll you’ve already got.", "It drops by 1 at the end of each scene, and downtime clears it.", link("s-healing", "Healing in the rules")], "Toll")}</p><div class="cc-row"><button type="button" class="button sm" data-act="toll" data-d="-1"${off(!s.toll)}>One less</button><button type="button" class="button sm" data-act="toll" data-d="1">One more</button></div></div>`;
  return `${toll}${conds ? `<ul class="cc-conds">${conds}</ul><div class="cc-row"><button type="button" class="button" data-act="round">End of round: every condition down a size</button></div>` : `<p><b>No conditions on you right now.</b> ${ruleTip("s-conditions", "How conditions work", "pa-cond")}</p>`}
    <form class="cc-form" data-form="cond">
      <label class="cc-field">Add a condition <select name="pick">${options}</select></label>
      <label class="cc-field">Its die <select name="die">${SIZES.map((d) => `<option value="${d}"${d === 6 ? " selected" : ""}>d${d}</option>`).join("")}</select></label>
      <details class="cc-own"><summary>Or write your own</summary>
        <label class="cc-field">Its name <input name="own" maxlength="30" autocomplete="off"></label>
        <label class="cc-field">It’s <select name="kind"><option value="against">against you</option><option value="for">for you</option></select></label></details>
      <button type="submit" class="button">Add it</button></form>`;
}
const cap2 = (s) => cap(String(s));

// What can't wait: a Scar. The hit that did it, or the Blaze they took, is
// written as a Catch on that Root, locking a point for good, and they leave
// the scene, or the character dies (their call). A Scar that would lock the
// Root's last point is the last: they die or retire. Out of the scene, they
// wait for the next one.
function alertView(ch, c, s) {
  if (s.blaze) {
    const r = s.blaze;
    const last = R.lastScar(c, s, r);
    const chose = s.blazing === true;
    return `<form class="cc-form cc-note is-warn" data-form="scar" role="alert"><p><b>${chose ? `You Blaze, on your ${r}.` : `A Scar on your ${r}.`}</b> ${chose ? "Say something extraordinary, and it happens, no roll. " : `Your ${r} was ${R.WOUNDS[r]} with nothing left, and that hit’s a Scar. `}From your very first Blaze you can choose for your character to die.${last ? ` This Scar would lock your ${r}’s last point, so ${esc(ch.name)} dies or retires, your call, once it’s done.` : ` If you don’t, you leave the scene, and the Scar locks a point of your ${r} for good.`}</p>
      ${last ? "" : `<label class="cc-field">${chose ? "The Scar it leaves" : "The hit that did it"}, as a Catch, like <em>a spear through the shoulder</em> or <em>can’t stand the dark</em> <input name="scar" maxlength="80" autocomplete="off"></label>`}
      <div class="cc-row">${last ? `<button type="button" class="button" data-act="die" data-how="retire">${esc(ch.name)} retires</button>` : '<button type="submit" class="button primary">Take the Scar and leave the scene</button>'}<button type="button" class="button" data-act="die">${esc(ch.name)} dies</button>${chose ? '<button type="button" class="button" data-act="unblaze">Not yet</button>' : ""}</div></form>`;
  }
  if (s.out && !s.dead) return `<div class="cc-note is-warn" role="status"><p><b>You’ve left the scene.</b> You’re back for the next one, with a New scene.</p><div class="cc-row"><button type="button" class="button sm" data-act="scene">New scene</button></div></div>`;
  // Acting: Aura can go past the maximum till they've finished.
  const max = R.auraMax(c, s);
  if (s.acting) return `<div class="cc-note cc-acting" role="status"><p><b>You’re acting.</b> ${s.aura > max ? `You’ve got ${s.aura} Aura, ${s.aura - max} over your ${max}. Spend it before you finish, or it’s gone.` : "Aura can go past your maximum till you’ve finished."}</p><div class="cc-row"><button type="button" class="button sm" data-act="acting" data-v="0">I’ve finished acting</button></div></div>`;
  return "";
}

// A row of dice to set something straight to a size, each in its real shape,
// with the one it's on now lit up.
function ring(act, from, to, now, label, low = from) {
  return `<div class="cc-ring" role="group" aria-label="${label}">${SIZES.filter((d) => d >= from && d <= to).map((d) => `<button type="button" class="cc-ringbtn" data-act="${act}" data-v="${d}"${pressed(d === now)}${off(d < low)} aria-label="d${d}">${kitDie(d, { label: `d${d}`, state: d === now ? "top" : d < low ? "low" : "" })}</button>`).join("")}</div>`;
}

// The last roll, from what normal() keeps of it. A GM sees her players' too
// (look.js), so every number's made a number here before it's drawn.
function lastRollView(last) {
  if (!last || !Array.isArray(last.dice)) return "";
  const p = lastParts(last);
  return `<p class="cc-last"><span class="k">Last roll</span> <b>${esc(last.name)}</b>, ${p.steps}: ${p.dice}${p.against}. ${p.verdict ? `${p.verdict}.` : ""}</p>`;
}
// How the last roll went: its steps, each die, what they were up against (one
// thing, or several) and how many won.
function lastParts(last) {
  const num = (v) => Number(v) || 0;
  const outs = last.dice.map((d) => d.out).filter(Boolean);
  const beat = outs.filter((o) => o === "beat" || o === "won").length;
  const vs = [...new Set(last.dice.filter((d) => d.out && Number.isInteger(d.vs)).map((d) => num(d.vs)))];
  const against = vs.length > 1 ? `, against ${andList(vs.map(String))}` : vs.length ? `, against ${vs[0]}` : last.opp != null ? `, against ${num(last.opp)}` : "";
  const verdict = !outs.length ? "" : outs.length === 1 ? ({ beat: "Beat it", won: "Won the tie", tie: "A tie", under: "Under" }[outs[0]] ?? "") : vs.length > 1 ? `${beat} of ${outs.length} won` : `${beat} of ${outs.length} beat it`;
  return { steps: steps(num(last.steps)), dice: last.dice.map((d) => `${num(d.total)} on the ${d.mark ? "Mark " : ""}d${num(d.size)}`).join(", "), against, verdict };
}

// The note a saved character gets once they've moved onto the new core (16
// Nov): what's new in a line, the lines on their sheet that changed (each
// with its gold mark), and what came across. Got it puts it away, gold marks
// and all. What's theirs to choose stays till they've chosen (chooseNote).
// One from before stacking or before Roots moves onto the core on its way.
function movedNote(ch, c) {
  const s = ch.state;
  if (!s.core && !s.moved && !s.stacked) return "";
  const [, their] = PRONOUN[c.pronoun] ?? PRONOUN.them;
  const d = ui.gold;
  const n = d ? Object.keys(d.marks).length : 0;
  const list = d ? Object.entries(d.marks).map(([id, m]) => `<li><b>${esc(d.names[id] ?? id)}.</b> ${m.was == null ? `New: ${esc(m.now)}` : `It was ${esc(m.was)}, and now it’s ${esc(m.now)}.`}</li>`).join("") : "";
  const scars = R.ROOTS.reduce((t, r) => t + s.scars[r].length, 0);
  const what = tip("mv-what", [
    "A roll’s one Root at full, the one that fits how you’re doing it. Nothing else on your sheet is counted.",
    "A Root’s number is its dice, its health and what you spend. A hit takes a point, and at 0 the next one wounds it.",
    "Bring in another Root on a permission that explains it, for a point of that Root or 3 Aura. Each awakening locks a point of its Root and is 2 steps on a roll it fits.",
    "There are no tracks and no extra actions. More dice is how you do more.",
    link("s-roots", "The Core in the rules"),
  ], "What’s new in the rules");
  return `<div class="cc-note is-gold cc-moved" role="status"><p><b>${esc(ch.name)}’s on the new core.</b> Every roll’s one Root at full, and a Root’s points are ${their} health. ${what} Every Title’s 5 now, every Root started full and Aura’s full.${scars ? ` ${scars === 1 ? "The Scar’s" : "The Scars are"} on the Root ${scars === 1 ? "its track was" : "their tracks were"} for.` : ""}</p>
    ${n ? `<p>${n === 1 ? "One line" : `${n} lines`} on ${their} sheet changed, each with a gold mark.</p><details class="cc-own" data-open="g-list"${ui.open.has("g-list") ? " open" : ""}><summary>Old and new</summary><ul class="cc-golds">${list}</ul></details>` : ""}
    ${d?.gone.length ? `<p>Gone from the sheet: ${d.gone.map((x) => `<s>${esc(x.was)}</s>`).join(", ")}.</p>` : ""}
    <div class="cc-row"><a class="button" href="/changes/">See what’s changed</a><button type="button" class="button" data-act="moved">Got it</button></div></div>`;
}

// What moving onto the new core left for the player to choose (roots.js,
// choicesOf): a Title's 3 made 5 the way it was spread, to check, an
// awakening's Root guessed, a Title that was on one Root, an archetype that's
// gone, and points left to spend. Each one's done with Change, or kept.
function chooseNote(ch, c) {
  const s = ch.state;
  if (!s.choose?.length) return "";
  const [, their] = PRONOUN[c.pronoun] ?? PRONOUN.them;
  const rows = s.choose.map((x, i) => {
    const keep = (label) => `<button type="button" class="button" data-act="choose" data-i="${i}">${label}</button>`;
    if (x.k === "five" || x.k === "spread") {
      const t = c.titles[x.t];
      const said = x.k === "spread" ? `puts all 5 on ${their} ${esc(x.root)}, the way it was.` : `puts 5 on ${their} Roots now: ${esc(spreadSaid(t ?? {}))}, the way its 3 were.`;
      return `<li class="cc-item"><p><em>${esc(t?.text ?? t?.name ?? "A Title")}</em> ${said}</p><div class="cc-row">${changeLink(ch, "Spread it")}${keep("Keep it")}</div></li>`;
    }
    if (x.k === "lock") return `<li class="cc-item"><p><em>${esc(x.name)}</em> locks a point of ${their} ${esc(x.root)}, ${their} biggest Root, till you say which it fits.</p><div class="cc-row">${changeLink(ch, "Pick its Root")}${keep("Keep it")}</div></li>`;
    if (x.k === "arch") return `<li class="cc-item"><p>The ${esc(x.name)} isn’t one of the archetypes any more, so it’s got no Trait or abilities on ${their} sheet.</p><div class="cc-row">${changeLink(ch, "Pick another")}${keep("Later")}</div></li>`;
    if (x.k === "points") return `<li class="cc-item"><p>${x.left === 1 ? "There’s 1 point" : `There are ${x.left} points`} left to spend on ${their} sheet.</p><div class="cc-row">${changeLink(ch, x.left === 1 ? "Spend it" : "Spend them")}${keep("Later")}</div></li>`;
    return "";
  }).join("");
  return `<section class="cc-note cc-choose" aria-labelledby="cc-choose-t"><h2 class="cc-h3"><span id="cc-choose-t">Yours to choose</span> ${tip("mv-choose", ["A Title puts 5 on your Roots, spread however you like. One that put 3 has had 2 more spread the way the 3 were, so check it suits them.", "An awakening locks a point of the Root it fits. One that didn’t say locks your biggest till you pick.", "An archetype that’s gone from the book does nothing till you swap it in Change.", link("s-step-roots", "Roots in the rules")], "What’s yours to choose")}</h2><ul class="cc-list">${rows}</ul></section>`;
}

// A character on the phone: the play screen first, and the rest of the sheet
// and the rules a tab away.
function characterView(ch, c) {
  const s = ch.state;
  const n = c.numbers;
  const facts = [`Stride ${n.stride}${n.strideNote ? ` (${esc(n.strideNote)})` : ""}${gold("num:stride")}`];
  const changed = `${s.core || s.moved || s.stacked ? movedNote(ch, c) : changedNote(ch, c)}${chooseNote(ch, c)}`;
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

// Changing anything on a character, any time, outside downtime too.
const changeLink = (ch, label = "") => (canChange(ch) ? `<a class="button cc-change" href="/characters/?build=${encodeURIComponent(ch.id)}" data-act="bopen" data-key="${esc(ch.id)}">${label ? esc(label) : `Change ${esc(ch.name)}`}</a>` : "");

// The play screen: the trackers, then the three Roots as big tiles, each with
// the dice it rolls and the points it's got left (a tap opens the roll card
// on it, ready to roll), Again with the last roll's Root and what came in
// with it, When it lands and the dice roller, the archetypes with their
// Traits and abilities, and the attuned things with what each awakening
// locks.
function playTab(ch, c) {
  const s = ch.state;
  const roots = R.ROOTS.map((root) => {
    const n = c.roots[root];
    const hurt = s.wound[root] ? `, ${R.WOUNDS[root]}` : "";
    return `<button type="button" class="tile card is-root${goldOf(`root:${root}`) ? " is-changed" : ""}${s.wound[root] ? " is-hurt" : ""}" data-act="roll" data-r="${root}"><span class="tile-dice" aria-hidden="true">${n ? diceOf(n) : kitDie(2, { hide: true })}</span><span class="tile-name">${root}${goldDot(`root:${root}`)}</span><span class="tile-says"><span class="tile-steps">${n ? steps(n) : "nothing yet"}</span><span class="tile-die">${n ? esc(diceLabel(stepsToDice(n))) : "a d2"}</span><span class="tile-pts">${ptsSaid(c, s, root)} left${hurt}</span></span></button>`;
  }).join("");
  // What landed on them at the end of a round in their campaign, waiting on this.
  const landed = table.landedFor(ch);
  const owed = landed ? landed.incoming.length + landed.more : 0;
  return `${table.playCard(ch)}${trackView(ch, c, s)}${alertView(ch, c, s)}
  <section class="cc-sec cc-play" aria-labelledby="cc-roll-t"><h2 class="cc-h3 cc-play-h"><span id="cc-roll-t">Roll</span> <small>tap the Root that fits</small> ${tip("pl-roll", ["Pick the Root that fits how you’re doing it, and all of it goes on, whatever points it’s got left.", "Bring in another Root on a permission that explains it, for a point of that Root or 3 Aura, and any awakening that fits is 2 steps more.", `Vesk picking a lock is her Body, 11 steps, a d12 and a d10. Over Lord Vane’s roof with her grappling line, its awakening makes it 13, two d12s and a d2.`, link("how-permissions-stack", "How a roll adds up, in the rules")], "How a roll adds up")}</h2>
    <div class="cc-tiles cc-roots">${roots}</div>
    ${againTile(ch, c, s)}
    <div class="cc-tiles cc-more"><button type="button" class="tile card tile-defend${owed ? " is-owed" : ""}" data-act="defence"><span class="tile-dice" aria-hidden="true">${R.ROOTS.filter((r) => c.roots[r]).slice(0, 3).map((r, j) => kitDie(stepsToDice(c.roots[r])[0], { hide: true, cls: j ? "is-next" : "" })).join("")}</span><span class="tile-name">When it lands</span><span class="tile-sub">${owed ? `${owed === 1 ? "One’s" : `${cap(["", "", "two", "three", "four", "five", "six"][owed] || String(owed))} have`} landed on ${esc(ch.name)}` : "Your Roots, or Defend"}</span></button><button type="button" class="tile card tile-free" data-act="dz" data-dz="open" data-from="play"><span class="tile-dice" aria-hidden="true">${kitDie(6, { hide: true })}${kitDie(8, { own: "them", hide: true, cls: "is-next" })}</span><span class="tile-name">Dice roller</span><span class="tile-sub">Any dice, yours against theirs</span></button></div>
    <div class="cc-row cc-scene"><button type="button" class="button" data-act="scene">New scene</button><button type="button" class="button" data-act="downtime">Downtime</button>${changeLink(ch)}</div>
  </section>
  ${abilitiesView(ch, c, s)}
  ${attunedView(ch, c, s)}`;
}

// Again: the last roll's Root, and what was brought in and woken, in one
// tap, counted on the sheet as it is now, with how it went last time.
function againTile(ch, c, s) {
  const p = s.last?.picks;
  if (!p) return "";
  const g = pickedGroup(c, s, p);
  const k = R.countRoll(c, s, asRoll(g));
  const name = rollName({ heal: false }, k, c, s);
  const last = lastParts(s.last);
  const how = last.verdict ? `${last.verdict.toLowerCase()}${last.against}` : last.dice;
  const cost = [k.aura ? `${k.aura} Aura` : "", ...R.ROOTS.filter((x) => k.points[x]).map((x) => `a point of ${x}`)].filter(Boolean);
  return `<button type="button" class="tile card tile-again" data-act="again"><span class="tile-dice" aria-hidden="true">${diceOf(k.total)}</span><span class="tile-name"><span class="tile-k">Again</span> ${esc(name)}</span><span class="tile-says"><span class="tile-steps">${steps(k.total)}, ${esc(diceLabel(stepsToDice(k.total)))}${cost.length ? `, ${esc(andList(cost))}` : ""}</span> · <span class="tile-last">last time ${esc(how)}</span></span></button>`;
}

// Each archetype: its Trait, always on and free, and the abilities this
// character's got, each paid in Aura, 1 for most. Pay again and you get it
// again. Push goes on a die once you've rolled, so it's on the roll card and
// When it lands. where keeps the ids apart when it's drawn twice (the play
// screen and the Sheet tab, or the GM's look).
const sigilOf = (name) => (SIGILS[name] ? sigil(name, { cls: "cc-sigil" }) : "");
// A line from the book that might hold *italics* the way the chapters write them.
const md = (text) => esc(text).replace(/\*([^*]+)\*/g, "<em>$1</em>");
const sentence = (text) => (/[.?]$/.test(String(text ?? "").trim()) ? md(text) : `${md(text)}.`);
function abilitiesView(ch, c, s, look = false, where = "pl") {
  const list = R.archetypesOf(c, DATA.build);
  if (!list.length) return "";
  const arch = (a) => {
    const t = a.trait ?? {};
    return `<div class="cc-arch"><p class="cc-arch-h">${sigilOf(a.name)}<b>${a.id ? link(a.id, esc(a.name)) : esc(a.name)}</b>${a.times > 1 ? ` <small>${TIMES[a.times] ?? `${a.times} times`}</small>` : ""}${gold(`arch:${a.name}`)}</p>${was(`arch:${a.name}`)}
    ${t.name ? `<p class="cc-trait"><span class="k">Trait</span> <b><em>${esc(t.name)}</em></b>${t.text ? ` ${t.text}` : ""}</p>` : ""}
    ${a.name === "Shadow" ? `<p class="cc-pool">${s.pool?.length ? `<b>${look ? "Their" : "Your"} shadow pool:</b> ${s.pool.map((d) => kitMini(d, { own: "you" })).join("")} ${esc(andList(s.pool.map((d) => `d${d}`)))}.${look ? "" : ` Add ${s.pool.length === 1 ? "it" : "them"} to any roll from the roll card.`}` : `<b>${look ? "Their" : "Your"} shadow pool’s empty.</b>`}</p>` : ""}
    <ul class="cc-abils">${a.abilities.map((x, j) => `<li class="cc-abil"><p><b>${esc(x.name)}</b> <small>${x.push ? "on a die once you’ve rolled, " : ""}${auraCost(x.cost)}</small> ${x.html}</p>${look || x.push ? "" : `<div class="cc-row"><button type="button" class="button sm is-aura" data-act="ability" data-a="${esc(a.name)}" data-j="${j}"${off(s.aura < x.cost)}>Pay for ${esc(x.name)}: ${auraCost(x.cost)}</button></div>`}</li>`).join("")}</ul></div>`;
  };
  const ask = look ? "" : tip(`${where}-abil`, ["A Trait’s always on, and it’s free.", "Each ability’s paid in Aura, 1 for most, each time you use it. Pay again and you get it again.", "Push goes on a die once you’ve rolled, from the roll card or When it lands.", link("s-abilities", "Abilities in the rules")], "How archetypes work");
  return `<section class="cc-sec cc-abilities" aria-labelledby="${where}-ab-t"><h2 class="cc-h3"><span id="${where}-ab-t">${list.length > 1 ? "Your archetypes" : "Your archetype"}</span> ${ask}</h2>
    ${list.map(arch).join("")}</section>`;
}

// Each attuned thing and its awakenings: each locks a point of the Root it
// fits while it's attuned, and it's 2 steps on a roll it fits, and 2 more
// for each Aura, from the roll card. One with nothing free to lock does
// nothing till there is.
function attunedView(ch, c, s, look = false, where = "pl") {
  if (!c.attuned.length) return "";
  const woke = R.awakeningsOf(c, s);
  const thing = (a, i) => {
    const wakes = woke.filter((w) => w.a === i).map((w) => `<li class="cc-wake${w.works ? " is-on" : ""}"><p><b><em>${esc(w.name)}</em></b> <small>${w.root ? `locks a point of ${w.root}` : "no Root yet"}${w.works ? "" : ", nothing free to lock"}</small> ${sentence(w.text)}</p></li>`).join("");
    const room = R.attunedRoom(a);
    return `<div class="cc-attuned"><p class="cc-arch-h"><b>${esc(a.name)}</b>${a.props ? ` <small>(${esc(a.props)})</small>` : ""} <span class="chip sm">${esc(a.stage)}</span>${gold(`att:${i}`)}</p>${was(`att:${i}`)}
      <ul class="cc-wakes">${wakes}</ul>
      ${a.catch ? `<p>Its Catch: <em>${esc(a.catch)}</em></p>` : ""}${a.burden ? `<p>Its Burden: <em>${esc(a.burden)}</em></p>` : ""}
      ${look ? "" : `<p class="cc-small">${room.n} of ${room.all} awakenings at ${esc(a.stage)}.</p>`}</div>`;
  };
  const ask = look ? "" : tip(`${where}-att`, ["Each awakening locks a point of the Root it fits for as long as it’s attuned, and it’s 2 steps on any roll it fits. Each Aura you put on it is 2 more.", "Attuned things can’t break, and they don’t touch your Aura.", link("s-attunement", "Attunement in the rules")], "How attunement works");
  return `<section class="cc-sec cc-attune" aria-labelledby="${where}-at-t"><h2 class="cc-h3"><span id="${where}-at-t">Attuned</span> ${ask}</h2>
    ${c.attuned.map(thing).join("")}</section>`;
}

const lower = (name) => name.replace(/^(A|An|The|His|Her|Their) /, (m) => m.toLowerCase());

// A permission's a button: tap it to read how permissions work. Its Root's
// beside it.
const permButton = (p, from, id = "") => `<li><button type="button" class="cc-perm" data-act="rule" data-r="perm" data-t="${esc(p.text)}" data-f="${esc(from)}" data-root="${esc(p.root)}"><em>${esc(p.text)}</em></button> <small class="cc-perm-at">${esc(p.root || "no Root yet")}</small>${id ? `${gold(id)}${was(id)}` : ""}</li>`;
// A Title's spread, the way the sheet writes it: Body 3, or Mind 2, Body 1.
const spreadSaid = (t) => R.ROOTS.filter((r) => (t.roots?.[r] ?? 0) > 0).sort((a, b) => t.roots[b] - t.roots[a]).map((r) => `${r} ${t.roots[r]}`).join(", ") || "nothing on a Root";
// Where each Root's points came from, the way How it adds up writes it: 3
// from the first Title, 1 from the second, then each permission on it.
function rootFrom(c, root, whose = "your") {
  const n = c.titles.map((t, i) => [t.roots?.[root] ?? 0, i]).filter(([v]) => v > 0);
  const titles = n.map(([v, i], k) => `${v} from ${whose} ${(ORD[i] ?? "next").toLowerCase()}${k ? "" : " Title"}`);
  const perms = c.titles.flatMap((t) => t.permissions.filter((p) => p.root === root).map((p) => `<em>${esc(p.text)}</em>`));
  return [...titles, ...perms].join(", ") || "nothing yet";
}
// What each thing carried says on its own line.
const ROOM = { equipment: 3, utility: 3 };

function sheetTab(ch, c) {
  const s = ch.state;
  const [, her] = PRONOUN[c.pronoun] ?? PRONOUN.them;
  const changeBtn = changeLink(ch);
  return `${putBackView(ch, c, s)}<div class="cc-changebar"><div class="cc-row">${changeBtn}<button type="button" class="button" data-act="print"${off(ui.printing)}>${ui.printing ? "Filling in the sheet…" : "Print the sheet"}</button>${changeBtn ? tip("sh-change", [`Add a Title, rewrite a permission or change anything else on ${her} sheet, whenever you like.`, "Print fills in the two-page sheet with everything here as it stands now."], "Changing and printing") : ""}</div></div>
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

  // The Roots, each with the dice it rolls on its own and where its points
  // came from.
  const whose = look ? her : "your";
  const rootRows = R.ROOTS.map((root) => `<li class="cc-act">${diceAt(c.roots[root])}<div class="cc-act-in"><p><b>${root} ${c.roots[root]}</b> <small>${c.roots[root] ? `${steps(c.roots[root])}, ${diceLabel(stepsToDice(c.roots[root]))}` : "a d2 on its own"}, holds ${R.capOf(c, { ...s, wound: {} }, root)}${s.wound[root] ? `, ${R.WOUNDS[root]}` : ""}</small>${g(`root:${root}`)}</p><p class="cc-from">${rootFrom(c, root, whose)}</p></div></li>`).join("");
  const rootsAt = `<span class="cc-gl-wrap">${R.ROOTS.map((root) => `<span class="cc-gl">${kitMini(Math.min(12, Math.max(2, c.roots[root] * 2)))}<b>${root}</b> <small>${s.pts[root]}/${R.capOf(c, s, root)}</small></span>`).join("")}</span>`;

  const titles = c.titles.map((t, i) => `<article class="card cc-card"><p class="eyebrow">${ORD[i] ?? ""} Title · ${esc(spreadSaid(t))}${g(`title:${at.titles[i]}`)}</p>
    <h3><em>${esc(t.text ?? t.name)}</em></h3><ul class="cc-perms">${t.permissions.map((p, j) => permButton(p, `${her} ${(ORD[i] ?? "").toLowerCase()} Title, ${t.text ?? t.name}`, look ? "" : `perm:${at.titles[i]}:${at.perms[i][j]}`)).join("")}</ul>
    ${(t.boons ?? []).length ? `<ul class="cc-boons">${t.boons.map((b, k) => `<li><p><b>${esc(b.name || `The ${b.lever} Boon`)}</b> <small>${esc([b.name ? `${b.lever} Boon` : "", b.on].filter(Boolean).join(", "))}</small>${g(`boon:${at.titles[i]}:${at.boons[i][k]}`)}</p><p class="cc-lead">${esc(cap(b.text))}.</p></li>`).join("")}</ul>` : ""}</article>`).join("");
  const titlesAt = c.titles.map((t) => `<span class="cc-gl-line"><em>${esc(t.text ?? t.name)}</em> <small>${esc(spreadSaid(t))} · ${t.permissions.length} ${t.permissions.length === 1 ? "permission" : "permissions"}${t.boons?.length ? ` · ${t.boons.length} ${t.boons.length === 1 ? "Boon" : "Boons"}` : ""}</small></span>`).join("");
  // Every archetype with the abilities it's got, at a glance.
  const archAt = R.archetypesOf(c, DATA.build).map((a) => `${esc(a.times > 1 ? `${a.name} ${TIMES[a.times] ?? `${a.times} times`}` : a.name)}${a.abilities.length ? ` <small>${esc(a.abilities.map((x) => x.name).join(", "))}</small>` : ""}`);
  // A fold's ? goes first in its body.
  const ask = (key, html, label) => (look ? "" : `<span class="cc-fold-ask">${tip(`sh-${key}`, html, label)}</span>`);

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
    const max = where === "bag" ? c.carry.bag?.max ?? 10 : ROOM[where] + (where === "utility" ? c.numbers.kit ?? 0 : 0);
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

  const scarList = R.ROOTS.flatMap((r) => s.scars[r].map((x) => ({ text: x || "a Scar not written in yet", from: `a Scar on your ${r}` })));
  const bites = [
    ...c.attuned.filter((a) => a.catch).map((a) => ({ text: a.catch, from: `the Catch on ${lower(a.name)}` })),
    ...scarList,
    ...c.trouble.map((x) => ({ text: x, from: `trouble that follows ${c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them"}` })),
  ].map((b) => `<li class="cc-item"><p><em>${esc(b.text)}</em> <small>${esc(b.from)}</small></p>${look ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Let ${esc(b.text)} bite: +1 Aura">Let it bite: +1 Aura</button><button type="button" class="button sm" data-act="bite" data-big="1" aria-label="A big bite from ${esc(b.text)}: a point of Soul back">A big bite: a point of Soul back</button></div>`}</li>`).join("");
  const bitesAt = [...c.attuned.filter((a) => a.catch).map((a) => a.catch), ...scarList.map((x) => x.text), ...c.trouble].map((x) => `<em>${esc(x)}</em>`);
  const notesAt = String(s.notes ?? "").trim().split("\n")[0];

  return `${fold("roots", "Roots", rootsAt, `${ask("roots", ["A Title puts 5 on your Roots, spread however you like, and a permission puts 1 on its Root. Nothing else does.", "A Root’s number is its dice, its health and what you spend, less a point for each awakening on it and each Scar.", "A roll’s one Root at full, the one that fits how you’re doing it.", link("how-permissions-stack", "How a roll adds up, in the rules")], "Where your Roots come from")}<ul class="cc-acts">${rootRows}</ul>`, marked("root"))}
  ${fold("titles", c.titles.length === 1 ? "Title and permissions" : "Titles and permissions", titlesAt, `${ask("titles", ["A permission’s what you can do, and what explains bringing another Root in on a roll. It’s never counted. Going beyond what it does is 1 Aura.", ...(c.titles.some((t) => t.boons?.length) ? ["A Boon takes two of its Title’s six slots, and it does what it says without adding a step."] : []), link("s-writing-permissions", "Permissions in the rules")], "How Titles and permissions count")}${titles}`, marked("title", "perm", "boon"))}
  ${fold("arch", archAt.length > 1 ? "Archetypes" : "Archetype", few(archAt, 4), `${ask("arch", ["A Trait’s always on, and it’s free.", "Each ability’s paid in Aura, 1 for most, each time you use it. Pay again and you get it again.", link("s-abilities", "Abilities in the rules")], "How archetypes work")}${abilitiesView(ch, c, s, look, look ? "lk" : "sh").replace(/<section[^>]*>|<\/section>|<h2[^>]*>.*?<\/h2>/gs, "")}`, marked("arch"))}
  ${fold("kit", "Kit", few(carried, 7), `${ask("kit", ["What you carry does what it is, and it’s never steps on a roll.", "Tap a thing to cross it out when it breaks or gets used up, till it’s mended.", ...(piecesOf(c).length ? ["Armour ticks a box for every hit it takes for you on its Root, instead of you losing a point, and breaks when the last one goes."] : []), link("s-armour-quality", "How armour’s boxes work")], "How your kit counts")}${slot("equipment", "Equipment")}${slot("utility", "Utility")}
    ${c.carry.keepsake ? `<div class="cc-slot"><h3>Keepsake${g("kit:keepsake")}</h3><ul class="cc-things">${thing("keepsake", c.carry.keepsake)}</ul></div>` : ""}
    ${slot("bag", `The bag <span class="cc-small">(${esc(c.carry.bag?.name ?? "a bag")})</span>`)}
    ${look ? "" : `<form class="cc-form" data-form="pickup"><label class="cc-field">Pick something up <input name="what" maxlength="60" autocomplete="off"></label>
      <label class="cc-field">It goes in <select name="where"><option value="bag">the bag</option><option value="utility">utility</option><option value="equipment">equipment</option></select></label>
      <button type="submit" class="button">Add it</button></form>`}`, marked("kit"))}
  ${c.attuned.length ? fold("att", "Attuned", c.attuned.map((a) => `${esc(a.name)} <small>${esc(a.stage)}${a.awakenings.length ? ` · ${esc(a.awakenings.map((w) => w.name).join(", "))}` : ""}</small>`).join(" · "), `${ask("att", ["Each awakening locks a point of the Root it fits while it’s attuned, and it’s 2 steps on a roll it fits, and 2 more for each Aura.", "Attuned things can’t break, and they don’t touch your Aura.", link("s-attunement", "Attunement in the rules")], "How attunement works")}${attunedView(ch, c, s, look, look ? "lk" : "sh").replace(/<section[^>]*>|<\/section>|<h2[^>]*>.*?<\/h2>/gs, "")}`, marked("att")) : ""}
  ${fold("threads", "Threads", few(threadsAt, 5) || "None yet", `${ask("threads", ["A bond thread’s something good between you. Borrow one thing off their sheet through it for 1 Aura, like a permission that brings a Root in, or lean on them in the story and strain it, and you get a point of Soul back. You can’t borrow through a strained one, and straining it again before it’s mended snaps it.", "A hostile thread’s something that’s gone bad, and it bites like a Catch. Doing right by them strains it, and doing right by them again snaps it.", pt ? `A thread with someone in the crew is on both your sheets, and in ${esc(pt.name)} it’s on both your phones too, so straining it, mending it or snapping it on one does it on the other.` : "A thread with someone in the crew is on both your sheets, so tell them when it changes.", link("s-bonds", "How threads work")], "How threads work")}
    ${threads}`, marked("thr"))}
  ${fold("trouble", "Catches and trouble", few(bitesAt, 3) || (look ? "None" : "Bring real trouble on yourself for 1 Aura"), `${ask("trouble", ["Let one bite and bring real trouble into the scene, and you take 1 Aura.", "A big bite that changes the scene or costs you something you wanted gets you a point of Soul back instead. Your hostile threads bite the same way, from Threads.", link("s-trouble", "Catches and trouble in the rules")], "How a Catch bites")}${look ? "" : `${goldOf("trouble") ? `<p>${gold("trouble", "The trouble that follows you changed in the rules")}</p>${was("trouble")}` : ""}`}
    <ul class="cc-list">${bites}${look ? "" : `<li class="cc-item"><p>Nothing here fits? Bring real trouble on yourself in the story anyway.</p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Real trouble with no Catch: +1 Aura">+1 Aura</button></div></li>`}</ul>`, marked("trouble"))}
  ${fold("asp", "Aspiration", `<span class="cc-gl">${kitMini(s.asp)}<em>${esc(s.aspText || c.aspiration.text)}</em> <small>d${s.asp}</small></span>`, look ? `<p><em>${esc(s.aspText || c.aspiration.text)}</em>, d${s.asp}.</p>` : `${ask("asp", ["When the GM says it’s within reach, roll against its die, and if you beat it, it climbs.", "Past d12, it’s a new Title, archetype or attuned thing, and a new Aspiration at d2.", link("s-aspiration", "How Aspiration works")], "How your Aspiration climbs")}${goldOf("asp") ? `<p>${gold("asp", "Its words changed in the rules")}</p>${was("asp")}` : ""}
    <label class="cc-field"><span class="sr-only">Your Aspiration</span><input class="cc-plain" data-in="asp-text" maxlength="120" value="${esc(s.aspText || c.aspiration.text)}" autocomplete="off"></label>
    ${ring("asp-set", 2, 12, s.asp, "Aspiration")}
    <div class="cc-row"><button type="button" class="button" data-act="asp" data-d="-1"${off(s.asp <= 2)}>A setback</button><button type="button" class="button" data-act="asp" data-d="1">It climbs</button></div>
    <details class="cc-rulebox" data-open="asp-good"${ui.open.has("asp-good") ? " open" : ""}><summary>What makes a good Aspiration</summary><div class="cc-rule">${ruleHtml("s-good-aspiration")}</div></details>`, marked("asp"))}
  ${look ? (notesAt ? fold("notes", "Notes", esc(notesAt.length > 70 ? `${notesAt.slice(0, 68)}…` : notesAt), `<p class="cc-notes-read">${esc(s.notes).replace(/\n/g, "<br>")}</p>`) : "")
    : fold("notes", "Notes", notesAt ? esc(notesAt.length > 70 ? `${notesAt.slice(0, 68)}…` : notesAt) : "Nothing written yet", `<label class="sr-only" for="cc-notes">Notes</label><textarea id="cc-notes" data-in="notes" rows="5">${esc(s.notes)}</textarea>`)}
  ${look ? "" : fold("about", `About ${esc(c.name)}`, esc(c.blurb.length > 90 ? `${c.blurb.slice(0, 88)}…` : c.blurb), `<p>${esc(c.blurb)}</p><p><b>Plays like:</b> ${c.playsLike}</p>
    ${c.crewQs.map((x) => `<p><em>${esc(x.q)}</em> ${esc(x.a)}</p>`).join("")}
    <p class="cc-lead">${link("s-pregens", `${esc(c.name)}’s sheet in the rules`)}. Print, at the top of this tab, fills in the two-page sheet from the <a href="/sheets/">Sheets page</a> with everything here as it stands now.</p>
    <div class="cc-row"><button type="button" class="button danger" data-act="delete">Delete ${esc(ch.name)} from this phone</button></div>`)}`;
}

// What a character grew in downtime before the Roots change, waiting to go
// back on the new sheet: each permission with the Root it fits now, each
// attuned permission as an awakening, a Title with all 3 on the Root it fits
// (spread it with Change) and its permission's Root, and its archetype as one
// of theirs. The old traits don't come across, so they're let go. None of it
// takes a slot: they earned it already.
function putBackView(ch, c, s) {
  if (!s.before?.length) return "";
  const rootPick = (name, now = "") => `<select name="${name}">${R.ROOTS.map((r) => `<option${r === now ? " selected" : ""}>${r}</option>`).join("")}</select>`;
  const row = (g) => {
    const head = (what, text) => `<p><b>${what}</b> <em>${esc(text)}</em></p>`;
    const form = (fields, label = "Put it back") => `<form class="cc-form cc-putback" data-form="putback" data-n="${g.n}">${fields}<div class="cc-row"><button type="submit" class="button sm primary">${label}</button><button type="button" class="button sm" data-act="letgo" data-n="${g.n}">Let it go</button></div></form>`;
    if (g.k === "perm" || g.k === "swap") {
      const t = c.titles[g.t];
      return `<li class="cc-item">${head("A permission", g.text)}${form(`<label class="cc-field">On <select name="t">${c.titles.map((x, i) => `<option value="${i}"${i === g.t ? " selected" : ""}${R.slotsOf(x) >= R.MAX_PERMS ? " disabled" : ""}>${esc(x.text ?? x.name)}</option>`).join("")}</select></label>
        <label class="cc-field">Its Root ${rootPick("root", R.mostOf(t?.roots ?? {}))}</label>`)}</li>`;
    }
    if (g.k === "att") {
      return `<li class="cc-item">${head("On an attuned thing", g.text)}${form(`<label class="cc-field">On <select name="a">${c.attuned.map((a, i) => `<option value="${i}"${i === (g.a ?? 0) ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label>
        <label class="cc-field">As an awakening that locks a point of ${rootPick("aroot", R.bestRoot(c))}</label>
        <label class="cc-field">What it does <input name="does" maxlength="200" autocomplete="off" placeholder="2 steps on every roll you make with it"></label>`)}</li>`;
    }
    if (g.k === "title") {
      return `<li class="cc-item">${head(`A Title${g.arch ? `, and the ${esc(g.arch)} archetype` : ""}`, g.text)}${form(`<label class="cc-field">All ${R.TITLE_ROOTS} on ${rootPick("root")}</label>
        ${g.perm ? `<p class="cc-small">Its permission, <em>${esc(g.perm)}</em>:</p><label class="cc-field">Its Root ${rootPick("proot")}</label>` : ""}`)}</li>`;
    }
    const what = g.k === "trait" ? `The trait ${esc(g.name ?? "")}` : "Something from before";
    return `<li class="cc-item"><p><b>${what}</b>${g.k === "trait" ? " <small>old traits don’t come across</small>" : ""}</p><div class="cc-row"><button type="button" class="button sm" data-act="letgo" data-n="${g.n}">Let it go</button></div></li>`;
  };
  return `<section class="cc-note is-gold cc-before" aria-labelledby="cc-before-t"><h2 class="cc-h3"><span id="cc-before-t">Grown before the Roots change</span> ${tip("sh-before", ["Put each one back on the new sheet, on the Root it fits. It doesn’t take a slot, because it’s already earned.", `A Title goes back with all ${R.TITLE_ROOTS} on one Root, and you can spread it with Change.`, link("s-writing-permissions", "Writing permissions")], "Putting it back")}</h2>
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
// thing off their sheet for 1 Aura while it's whole, and straining it puts
// gets a point of Soul back. A hostile thread bites like a Catch, and doing
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
      ? [b("strain", "Strain it again: it snaps, a point of Soul back"), b("mend", "Mended")]
      : [b("strain", "Strain it: a point of Soul back")])
    : [b("bite", "It brought trouble: +1 Aura", ` data-big="0" aria-label="Your thread with ${who} brought real trouble: +1 Aura"`), b("bite", "A big bite: a point of Soul back", ` data-big="1" aria-label="A big bite from your thread with ${who}: a point of Soul back"`),
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
  ["Rolling", ["s-roots", "s-permissions", "how-permissions-stack", "s-building-die", "s-bring", "s-the-roll", "s-intents", "s-splitting", "s-going-beyond", "s-teamwork"]],
  ["The round", ["s-round", "s-telegraphs", "s-actions", "s-answering", "s-extra-actions"]],
  ["Aura and your points", ["s-aura", "getting-it-back", "s-tracks", "s-abilities"]],
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

// The roll card on the new core (16 Nov, notes/core-plan.md): one Root at
// full, whatever points it's got left, so tapping a Root's tile opens it
// ready to roll. On top, if the player likes: another Root brought in on a
// permission that explains it, paid with a point of that Root or 3 Aura, and
// any awakening that fits, 2 steps, and 2 more for each Aura on it. Nothing
// else on the sheet is ever counted. The dice split any way at all. What it's
// up against is a list, each thing rolled once, and every die says which one
// it's at (readLanes reads the throw).
//
// A roll's made of groups, each a Root with what's brought in and what's
// woken (the roll card's one, keyed "main", and When it lands's, one for each
// Root something's landing on and one for Defend), so the same pieces build
// them all.
//
// tele: the telegraph it's answering (table.js), whose die is the first thing
// it's up against, with whoever's put their action in (with), whose steps go
// in as friends'. work: a stake or an event on the live table's scene, and
// its die, or the number it already rolled this round (held), which stands.
// picks: a Root and what was brought in and woken, for Again.
const MAX_FOES = 8;
// The most dice a roll can be split into, and the ways of sharing them a
// card offers at once (the most even first).
const MOST_DICE = 24;
const SHAPES_SHOWN = 8;
const freshGroup = (root) => ({ root, bring: {}, awk: {}, count: null, shape: 0 });
function openAction({ root = null, tele = null, work = null, picks = null, heal = false, rid = null } = {}) {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const first = tele ? { die: tele.d, n: null, mark: 0 } : work ? (work.held != null ? { die: 0, n: work.held, mark: 0 } : { die: work.d, n: null, mark: 0 }) : null;
  const g = picks ? pickedGroup(c, ch.state, picks) : freshGroup(R.ROOTS.includes(root) ? root : R.bestRoot(c));
  openRoll({
    kind: "action", mode: "build", groups: { main: g }, heal: heal && isA(c, "Healer"),
    friends: (tele?.with ?? []).map((w) => w.steps), handed: 0, conds: new Set(), pool: {}, beyond: false,
    against: first ? [first] : [], aim: {}, fixed: Boolean(first),
    work, tele, rid, dice: [], foes: [], log: [], pick: null, pads: [], padFoes: [], spinning: false, intents: {}, owns: new Set(),
  });
}
// A dialog that's open already turns over to the next one.
function openRoll(r) {
  roll = r;
  if (dialog.open) renderDialog(false);
  else openDialog();
}
// The last roll's picks, on the sheet as it is now: a permission that's gone
// is the player's own words now, and an awakening that's gone stays out.
function pickedGroup(c, s, picks) {
  const perms = new Map(R.thingsOf(c, s).filter((x) => x.kind === "perm").map((x) => [x.key, x]));
  const woke = new Set(R.awakeningsOf(c, s).filter((w) => w.works).map((w) => w.key));
  const g = freshGroup(R.ROOTS.includes(picks.root) ? picks.root : R.bestRoot(c));
  for (const b of picks.bring ?? []) {
    if (!R.ROOTS.includes(b.root) || b.root === g.root) continue;
    g.bring[b.root] = perms.has(b.perm) ? { perm: b.perm, own: "", pay: b.pay === "aura" ? "aura" : "pt" } : { perm: "", own: String(b.perm ?? "").slice(0, 80), pay: b.pay === "aura" ? "aura" : "pt" };
  }
  for (const w of picks.awk ?? []) if (woke.has(w.key)) g.awk[w.key] = clamp(w.aura, 0, 9);
  return g;
}

const isA = (c, name) => c.archetypes.some((a) => a.name === name);
// A group as countRoll() takes it: each Root brought in on its permission (a
// key off the sheet, or the player's own words for a friend's or a truth),
// each awakening with the Aura on it, and anything else the roll has.
const asRoll = (g, more = {}) => ({
  root: g.root,
  bring: Object.entries(g.bring).map(([root, b]) => ({ root, perm: b.perm || b.own.trim(), pay: b.pay })),
  awk: Object.entries(g.awk).map(([key, aura]) => ({ key, aura })),
  ...more,
});
// What the player's split their steps into: the table's dice, or as many as
// they like, each a d2 at least and a d12 at most. A heal and the end of a
// scene are never split.
function shaped(total, g, unsplit = false) {
  const base = stepsToDice(total);
  const fewest = base.length;
  const most = unsplit ? fewest : Math.max(fewest, Math.min(total, MOST_DICE));
  const count = clamp(g.count ?? fewest, fewest, most);
  const shapes = unsplit ? [base] : diceShapes(total, count).slice(0, SHAPES_SHOWN);
  const shape = clamp(g.shape ?? 0, 0, shapes.length - 1);
  return { fewest, most, count, shapes, shape, split: shapes[shape] ?? base };
}
// A friend's permission borrowed through a bond thread is 1 Aura on top.
const borrowsOf = (g) => Object.values(g.bring).filter((b) => b.borrow).length;
// What a short roll needs, said as a line.
function shortSaid(s, k, aura) {
  const perm = k.short.find((x) => x.startsWith("a permission"));
  if (perm) return `Name the permission that brings in your ${perm.split(" ").pop()}.`;
  const out = k.short.filter((x) => !/ Aura$/.test(x) && x !== "no Root");
  if (aura > s.aura) out.push(`${aura} Aura`);
  return out.length ? `This needs ${andList(out)}, and you haven’t got ${out.length > 1 ? "them" : "it"}.` : "";
}

// Count the roll card the way How a roll adds up does (roots.js), then the
// dice it makes: as the player split them, and a Shadow's pool dice as dice
// of their own on the end.
function counted(r, c, s) {
  const g = r.groups.main;
  const plus = (Number(r.handed) || 0) + r.friends.reduce((t, f) => t + (Number(f) || 0), 0);
  const k = R.countRoll(c, s, asRoll(g, { conds: [...r.conds], pool: Object.entries(r.pool ?? {}).map(([i, how]) => ({ i: Number(i), die: how === "die" })), plus }));
  const free = r.beyond && R.freeBeyond(c, s);
  // On top of what bringing in and waking costs: going beyond, and borrowing.
  const aura = k.aura + (r.beyond && !free ? 1 : 0) + borrowsOf(g);
  const sh = shaped(k.total, g, r.heal);
  return { ...k, ...sh, aura, free, plusSteps: plus, dice: [...sh.split, ...k.poolDice], short: shortSaid(s, k, aura) };
}
const andList = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");
// A roll's name: its Root, what's brought in and what's woken. "Body, with
// Mind and Long shot", or "Soul, a heal".
const NAME_MAX = 60;
function rollName(r, k, c, s) {
  const woke = R.awakeningsOf(c, s);
  const names = [...k.brought.map((b) => b.root), ...k.awk.map((w) => woke.find((x) => x.key === w.key)?.name ?? w.name)];
  let tail = r.heal ? ", a heal" : names.length ? `, with ${andList(names)}` : "";
  if (k.root.length + tail.length > NAME_MAX) tail = `${tail.slice(0, NAME_MAX - k.root.length - 1).replace(/\s+\S*$/, "")}…`;
  return `${k.root}${tail}`;
}

// A roll's name in its card's head: the Root big, and what it's for after
// it, so a long one doesn't fill a small phone.
const nameHead = (name) => {
  const [root, ...rest] = String(name ?? "").split(", ");
  return `${esc(root)}${rest.length ? `<span class="cc-live-for">, ${esc(rest.join(", "))}</span>` : ""}`;
};
const stepper = (name, value, min, max, label, i = "") => `<span class="cc-step"><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${esc(i)}" data-d="-1" aria-label="${label}: one less"${off(value <= min)}>−</button><output>${value}</output><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${esc(i)}" data-d="1" aria-label="${label}: one more"${off(value >= max)}>+</button></span>`;

// The dice a roll card's about to roll, front and centre in its head, in
// their real shapes: [size, whose, class]. Theirs come after an "against".
const liveDice = (list) => `<span class="cc-dice-row" aria-hidden="true">${list.map(([d, own, cls = ""]) => `${cls === "is-vs" ? '<span class="cc-vs">against</span>' : ""}${kitDie(d, { own, hide: true, cls })}`).join("")}</span>`;

// A die's intent: tap one of the usual ones, or write your own.
function intentRow(key, size, label, presets, cls = "on", extra = "") {
  const own = roll.owns.has(key);
  const value = roll.intents[key] ?? "";
  const name = `${label}d${size}`; // "your d6", "the Mark d10", "their d8"
  const chip = (p) => `<button type="button" class="cc-chipbtn sm" data-act="intent" data-k="${key}" data-v="${esc(p)}"${pressed(!own && value === p)}>${esc(p)}</button>`;
  return `<div class="cc-intent">${kitDie(size, { own: cls === "them" ? "them" : "you", label: name, cls: "cc-intent-die" })}<div class="cc-intent-in">${extra}<div class="cc-chips" role="group" aria-label="What ${esc(name)} is for">${presets.map(chip).join("")}<button type="button" class="cc-chipbtn sm" data-act="intent" data-k="${key}" data-v=""${pressed(own)}>Your own</button></div>
    ${own ? `<input class="cc-own-intent" data-in="intent" data-k="${key}" value="${esc(value)}" maxlength="40" autocomplete="off" placeholder="What it’s trying to do" aria-label="What ${esc(name)} is for, in your words">` : ""}</div></div>`;
}
// What it's up against, as each row and chip names it, numbered when two
// look the same.
const foeName = (t) => (t.die ? `their d${t.die}` : `a ${t.n} to beat`);
const foeTag = (r, j) => {
  const base = foeName(r.against[j] ?? {});
  return r.against.filter((x) => foeName(x) === base).length > 1 ? `${base} (${j + 1})` : base;
};
// Which thing each die's at: the one it's been aimed at, or the first.
const aimOf = (r, i) => (r.against.length ? clamp(r.aim[i] ?? 0, 0, r.against.length - 1) : -1);

// Through a bond thread that's whole you can borrow one thing off their
// sheet, for 1 Aura, and their permission can bring a Root of yours in. A
// strained or snapped thread lends nothing, and nor does a hostile one. In a
// campaign that includes a thread that's only on the other one's sheet.
const lendersOf = (c, s) => [...new Set(allThreads(current(), c).filter((p) => p.threads.some((t) => t.kind !== "hostile" && threadState(s, p.person, t) === "whole")).map((p) => p.person))];
// The Root pick, what's brought in and what's woken, for any group: the roll
// card's and each of When it lands's. key names the group, and where keeps
// the question bubbles' ids apart.
const permsBy = (c, s, root) => {
  const all = R.thingsOf(c, s).filter((x) => x.kind === "perm");
  return [...all.filter((x) => x.root === root), ...all.filter((x) => x.root !== root)];
};
function bringView(c, s, g, key, where) {
  const others = R.ROOTS.filter((root) => root !== g.root);
  const lenders = lendersOf(c, s);
  const row = (root) => {
    const b = g.bring[root];
    const head = `<button type="button" class="cc-line${b ? " is-in" : ""}" data-act="bring" data-g="${key}" data-v="${root}"${pressed(Boolean(b))}><span class="tick" aria-hidden="true"></span><span>Bring in your ${root} <small>+${steps(c.roots[root])}, ${s.pts[root]} ${s.pts[root] === 1 ? "point" : "points"} left</small></span></button>`;
    if (!b) return head;
    const perm = (x) => `<button type="button" class="cc-pick is-${b.perm === x.key ? "in" : "out"}" data-act="bperm" data-g="${key}" data-r="${root}" data-v="${esc(x.key)}"${pressed(b.perm === x.key)}><em>${esc(x.name)}</em> <small>${esc(x.root ?? "")}</small></button>`;
    const pay = (v, label, no) => `<button type="button" class="cc-chipbtn sm" data-act="bpay" data-g="${key}" data-r="${root}" data-v="${v}"${pressed(b.pay === v)}${off(no)}>${label}</button>`;
    return `${head}<div class="cc-bring">
      <p class="cc-pick-h">What explains it</p><div class="cc-picks">${permsBy(c, s, root).map(perm).join("")}</div>
      <details class="cc-own" data-open="bown-${key}-${root}"${ui.open.has(`bown-${key}-${root}`) || b.own || b.borrow ? " open" : ""}><summary>A friend’s, or a truth you were told</summary>
        <label class="cc-field cc-own-perm">In your own words <input data-in="bown" data-g="${key}" data-r="${root}" maxlength="80" autocomplete="off" value="${esc(b.own)}"></label>
        ${lenders.length ? `<div class="cc-chips" role="group" aria-label="Borrowed through a bond thread">${lenders.map((p) => `<button type="button" class="cc-chipbtn sm" data-act="bborrow" data-g="${key}" data-r="${root}" data-v="${esc(p)}"${pressed(b.borrow === p)}>Borrowed from ${esc(p)}, 1 Aura</button>`).join("")}</div>` : ""}</details>
      <div class="cc-chips" role="group" aria-label="Paying to bring in your ${root}">${pay("pt", `1 point of ${root}`, s.pts[root] < 1)}${pay("aura", "3 Aura", false)}</div></div>`;
  };
  const ask = tip(`${where}-bring`, [
    "Name the permission that explains how another Root gets in on it, and all of that Root goes on the roll.",
    "Pay 1 point of the Root you bring in, or 3 Aura. Spent or lost points never make it smaller on a roll.",
    "A friend’s permission through a bond thread is 1 Aura more, and so’s nothing else.",
    link("s-bring", "Bringing in a Root, in the rules"),
  ], "Bringing in a Root");
  return `<fieldset class="cc-group cc-bringgrp" aria-labelledby="${where}-br-t"><legend><span id="${where}-br-t">Bring in a Root</span> ${ask}</legend>${others.map(row).join("")}</fieldset>`;
}
function awakeView(c, s, g, key, where) {
  const list = R.awakeningsOf(c, s);
  if (!list.length) return "";
  const row = (w) => {
    const on = w.key in g.awk;
    const chip = `<button type="button" class="cc-pick k-awk is-${on ? "in" : "out"}" data-act="awk" data-g="${key}" data-k="${esc(w.key)}"${pressed(on)}${off(!w.works)}><svg class="cc-pick-hex" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l5 9-5 9H7l-5-9z"/></svg><em>${esc(w.name)}</em> <small>${w.works ? `${lower(w.thing)}, +${R.AWK_STEPS * (1 + (g.awk[w.key] ?? 0))}` : `nothing free on your ${esc(w.root ?? "Root")} to lock`}</small></button>`;
    return `<div class="cc-awkrow">${chip}${on ? `<div class="cc-stepper is-aura"><span>Aura on it <small>2 more steps each</small></span>${stepper("awk", g.awk[w.key], 0, 9, `Aura on ${w.name}`, `${key}|${w.key}`)}</div>` : ""}</div>`;
  };
  return `<fieldset class="cc-group" aria-labelledby="${where}-awk-t"><legend><span id="${where}-awk-t">Awakenings that fit</span> ${tip(`${where}-awk`, ["Tap one in when it fits what you’re doing, and it’s 2 steps. Each Aura you put on it is 2 more.", "Each one locks a point of its Root while it’s attuned, and one with nothing free to lock does nothing till there is.", link("s-attunement", "Attunement in the rules")], "Awakenings")}</legend>${list.map(row).join("")}</fieldset>`;
}
// The split: how many dice, and how the steps are shared between them. More
// dice is how you do more, since every die's an intent.
function splitView(sh, key, label) {
  if (sh.most <= sh.fewest) return "";
  return `<div class="cc-stepper"><span>${label} <small>${sh.fewest === sh.count ? "the table’s dice" : "split your way"}</small></span>${stepper("count", sh.count, sh.fewest, sh.most, label, key)}</div>
    ${sh.shapes.length > 1 ? `<div class="cc-chips" role="group" aria-label="How the steps are shared out">${sh.shapes.map((x, i) => `<button type="button" class="cc-chipbtn" data-act="shape" data-g="${key}" data-i="${i}"${pressed(i === sh.shape)}>${diceLabel(x)}</button>`).join("")}</div>` : ""}`;
}

// What it's up against: a row for each thing, its die or its number, and its
// Mark if it's got one, with a tap to add another.
function foesView(r, k, where) {
  const many = r.against.length > 1;
  const rows = r.against.map((t, j) => {
    const fixed = j === 0 && r.fixed;
    const at = k.dice.filter((_, i) => aimOf(r, i) === j).length;
    const head = t.die ? kitDie(t.die, { own: "them", label: `Their d${t.die}` }) : `<span class="cc-tobeat" aria-hidden="true">${t.n}</span>`;
    return `<li class="cc-foe">${head}<div class="cc-foe-in"><p><b>${cap(foeTag(r, j))}</b>${fixed ? ` <small>${r.tele ? "what you’re answering" : "what you’re working"}</small>` : ""}${many ? ` <small>${at ? `${at === 1 ? "one die" : `${at} dice`} at it` : "no dice at it yet"}</small>` : ""}</p>
      <div class="cc-foe-do">${t.die ? `<label class="cc-mini-field">Marked <select data-in="foe-mark" data-j="${j}" aria-label="${esc(cap(foeTag(r, j)))}’s Mark"><option value="0"${t.mark ? "" : " selected"}>no</option>${SIZES.map((d) => `<option value="${d}"${t.mark === d ? " selected" : ""}>d${d}</option>`).join("")}</select></label>` : stepper("foe", t.n, 1, 30, "The number to beat", j)}</div></div>
      ${fixed ? "" : `<button type="button" class="cc-x sm" data-act="foe-del" data-j="${j}" aria-label="Take ${esc(foeTag(r, j))} off">${ICON.close}</button>`}</li>`;
  }).join("");
  const add = r.against.length < MAX_FOES ? `<div class="cc-chips cc-addfoe" role="group" aria-label="Add something it’s up against">${SIZES.map((d) => `<button type="button" class="cc-chipbtn sm" data-act="foe-add" data-v="${d}" aria-label="Add their d${d}">+ d${d}</button>`).join("")}<button type="button" class="cc-chipbtn sm" data-act="foe-add" data-v="n">+ a number</button></div>` : "";
  const ask = tip(`${where}-vs`, [
    "Tap its die and the phone rolls it with yours. Beat it and you did it. A tie goes to them, unless you pay 1 Aura to win it.",
    "A threat rolls its defence once a round, and that roll stands for everyone who goes at it, so a number it’s rolled already goes in as a number.",
    "Going at more than one thing? Every die’s an intent, so add each one and give every die a target in Your dice.",
    link("s-the-roll", "The roll in the rules"),
  ], "How it’s up against things");
  return `<fieldset class="cc-group cc-foes-group" aria-labelledby="${where}-vs-t"><legend><span id="${where}-vs-t">Up against</span> ${ask}</legend>
    ${rows ? `<ul class="cc-foes">${rows}</ul>` : '<p class="cc-small">Nothing to beat yet.</p>'}${add}</fieldset>`;
}

// Your dice: how many, how the steps are shared out, and what each one's for
// and at. It's folded away till there's more than one thing to aim at, or
// it's opened.
function diceView(c, s, r, k, where) {
  const many = r.against.length > 1;
  const presets = INTENTS[r.groups.main.root] ?? INTENTS.Body;
  const aims = (i, size) => (many ? `<div class="cc-chips cc-aims" role="group" aria-label="What your d${size} is at">${r.against.map((t, j) => `<button type="button" class="cc-chipbtn sm" data-act="aim" data-i="${i}" data-j="${j}"${pressed(aimOf(r, i) === j)}>At ${esc(foeTag(r, j))}</button>`).join("")}</div>` : "");
  const rows = k.dice.map((size, i) => intentRow(String(i), size, "your ", presets, "on", aims(i, size))).join("");
  const marks = r.against.map((t, j) => (t.mark ? intentRow(`m${j}`, t.mark, "the Mark ", presets, "mark", `<p class="cc-small">At ${esc(foeTag(r, j))}, when anything goes at it</p>`) : "")).join("");
  const open = !ui.shut.has("rc-dice") && (ui.open.has("rc-dice") || many);
  return `<details class="cc-group cc-dicefold" data-open="rc-dice" data-shut${open ? " open" : ""}><summary>Your dice <small>${diceLabel(k.dice)}${many ? ", each at its target" : ", split or give them intents"}</small></summary>
    <span class="cc-group-ask">${tip(`${where}-dice`, ["Split your steps into as many dice as you like, a d2 at the smallest. Every die’s an intent, so more dice is how you do more.", "Give every die an intent before you roll: what it’s trying to do, and who it’s at. Whatever you gave it, that’s what happens if it wins.", link("s-splitting", "Splitting in the rules")], "Splitting and intents")}</span>
    ${splitView(k, "main", "How many dice")}
    ${rows}${marks}</details>`;
}

// The roll card: the Root, what's brought in and woken, what it's up against,
// your dice, and the rest a fold away. The steps, the dice and what it costs
// stay in the head as you tap.
function buildView(c, s) {
  const r = roll;
  const g = r.groups.main;
  const k = counted(r, c, s);
  const name = rollName(r, k, c, s);
  const rootChip = (root) => `<button type="button" class="cc-chipbtn" data-act="root" data-g="main" data-v="${root}"${pressed(g.root === root)}>${root} <small>${c.roots[root]}</small></button>`;
  const costs = [k.aura ? `<span class="chip is-aura">${k.aura} Aura</span>` : "", ...R.ROOTS.filter((x) => k.points[x]).map((x) => `<span class="chip is-track">${k.points[x] === 1 ? "a point" : `${k.points[x]} points`} of ${x}</span>`)].join("");
  const foesShown = r.heal ? [] : r.against.map((t) => (t.die ? [t.die, "them", "is-them"] : null)).filter(Boolean);
  if (foesShown.length) foesShown[0][2] = "is-vs";
  const against = !r.heal && r.against.length ? ` against ${andList(r.against.map((_, j) => foeTag(r, j)))}` : "";
  const marks = r.heal ? [] : r.against.filter((t) => t.mark).map((t) => [t.mark, "you", "is-mark"]);
  const healing = isA(c, "Healer") && !r.tele && !r.work ? `<div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="heal-on" data-v="0"${pressed(!r.heal)}>Doing something</button><button type="button" class="cc-chipbtn" data-act="heal-on" data-v="1"${pressed(r.heal)}>A heal</button>${tip("rc-heal", ["A heal’s your action: your Root at full and never split. Your patient gets back what it rolls, less 5 for each Toll they’ve got.", ...(healBonus(c) ? [`Your ${andList(healBonus(c, true))} add${healBonus(c, true).length === 1 ? "s" : ""} ${healBonus(c)} to what it rolls, before any Toll comes off.`] : []), ...(healEase(c) ? ["Your heals ignore a step of Toll."] : []), link("s-healing", "Healing in the rules")], "A heal")}</div>` : "";
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${nameHead(name)}</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...k.dice.map((d) => [d, "you"]), ...marks, ...foesShown])}<span><b>${steps(k.total)}</b>, ${diceLabel(k.dice)}${marks.length ? `, and the Mark d${marks.map((m) => m[0]).join(" and d")}` : ""}${esc(against)}</span></p>
      ${costs ? `<p class="cc-costs">${costs}</p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">${table.forLine(r)}
    ${healing}
    <div class="cc-chips cc-rootpick" role="group" aria-label="Your Root, how you’re doing it">${R.ROOTS.map(rootChip).join("")}${tip("rc-root", ["Pick the Root that fits how you’re doing it, and all of it goes on, whatever points it’s got left.", "Vesk picking a lock is her Body, 11 steps, a d12 and a d10.", link("how-permissions-stack", "How a roll adds up, in the rules")], "Your Root")}</div>
    ${bringView(c, s, g, "main", "rc")}
    ${awakeView(c, s, g, "main", "rc")}
    ${s.conditions.length ? `<fieldset class="cc-group" aria-labelledby="rc-cond-t"><legend><span id="rc-cond-t">Conditions on you</span> ${tip("rc-cond", "Tap one on when it fits this roll: one for you is a step more, and one against you a step less.", "Conditions on a roll")}</legend><div class="cc-picks">${s.conditions.map((x) => `<button type="button" class="cc-pick is-${r.conds.has(x.name) ? "in" : "out"}" data-act="cond" data-k="${esc(x.name)}"${pressed(r.conds.has(x.name))}><em>${esc(x.name)}</em> <small>d${x.die}, ${x.kind === "for" ? "a step more" : "a step less"}</small></button>`).join("")}</div></fieldset>` : ""}
    ${s.pool?.length && !r.heal ? poolGroup(s, r) : ""}
    ${r.heal ? "" : foesView(r, k, "rc")}
    ${r.heal ? "" : diceView(c, s, r, k, "rc")}
    <details class="cc-group" data-open="more"${ui.open.has("more") ? " open" : ""}><summary>Friends and going beyond${r.friends.length || r.handed || r.beyond ? " <small>in use</small>" : ""}</summary>
      <span class="cc-group-ask">${tip("rc-more", ["A friend who puts their action into the same thing brings the Root that fits how they’re helping, all of it, and anything they bring in on top. Nobody pays Aura for the combo itself.", "Steps a Leader handed you don’t have to fit anything.", "Going beyond what something normally does is 1 Aura, and it’s no step.", link("s-teamwork", "Working together in the rules")], "Friends and going beyond")}</span>
      <h3>Friends joining in</h3>
      ${r.friends.map((f, i) => `<div class="cc-stepper"><span>Friend ${i + 1}’s steps <small>their Root and what they brought in</small></span>${stepper("friend", f, 1, 40, `Friend ${i + 1}’s steps`, i)}<button type="button" class="cc-x sm" data-act="friend-off" data-i="${i}" aria-label="Friend ${i + 1} drops out">${ICON.close}</button></div>`).join("")}
      <button type="button" class="button sm" data-act="friend-on">A friend joins in</button>
      <div class="cc-stepper"><span>Steps a Leader handed you</span>${stepper("handed", r.handed, 0, 30, "Steps from a Leader")}</div>
      <h3>Going beyond</h3>
      <button type="button" class="cc-line is-aura" data-act="beyond"${pressed(r.beyond)}><span class="tick" aria-hidden="true"></span><span>Go beyond what it normally does <small>${R.freeBeyond(c, s) ? `free once a scene, with ${esc(R.boonSaid(c, "Going beyond"))}, and no step` : "1 Aura, and no step"}</small></span></button></details>
  </div>
  <div class="dlg-foot">${k.short ? `<p class="cc-warn" role="alert">${esc(k.short)}</p>` : ""}
    <button type="button" class="button primary" data-act="go"${off(k.short)}>Roll</button><button type="button" class="button" data-act="go-real"${off(k.short)}>Roll real dice</button></div>`;
}

// A Healer's heals: the flat bonus their awakenings put on every heal roll,
// and the steps of Toll their Trait and attunements ignore.
const healers = (c) => R.awakeningsOf(c, {}).filter((w) => w.works);
function healBonus(c, names = false) {
  const list = healers(c).map((w) => ({ w, n: Number(String(w.text).match(/\badd (\d+) to what every heal/i)?.[1] ?? 0) })).filter((x) => x.n > 0);
  return names ? list.map((x) => `<em>${esc(x.w.name)}</em>`) : list.reduce((t, x) => t + x.n, 0);
}
function healEase(c) {
  const toll = (t) => /\bignore a step of Toll\b/i.test(String(t ?? ""));
  return R.archetypesOf(c, DATA.build).filter((a) => toll(a.trait?.text)).length + healers(c).filter((w) => toll(w.text)).length;
}

// How a die of yours did against the thing it's at.
function outcome(d) {
  const f = roll?.foes?.[d.at];
  if (!f || f.v == null) return null;
  const t = d.nat + d.plus;
  return t > f.v ? "beat" : t === f.v ? (d.won ? "won" : "tie") : "under";
}
const lastOf = () => ({ name: roll.name, steps: roll.total, dice: roll.dice.map((d) => ({ size: d.size, total: d.nat + d.plus, out: outcome(d), mark: Boolean(d.mark), ...(roll.foes?.[d.at]?.v != null ? { vs: roll.foes[d.at].v } : {}) })), opp: roll.foes?.[0]?.v ?? null, at: Date.now(), ...(roll.picks ? { picks: roll.picks } : {}), ...(roll.heal ? { heal: roll.healed } : {}) });

// The Aura a throw pays, as the dice land: 1 for every die that won and 1
// for every top face. Anything added after the roll pays nothing more.
function auraSaid(won, tops, n, s, c, over) {
  const said = [won ? `${won === 1 ? "One die" : `${won} dice`} won` : "", tops ? `${tops === 1 ? "a top face" : `${tops} top faces`}` : ""].filter(Boolean).join(" and ");
  const max = R.auraMax(c, s);
  return `${cap(said)}, so ${n} Aura.${s.acting && s.aura > max ? ` You’re on ${s.aura} while you’re acting, past your ${max}.` : over}`;
}
// The throw as readLanes reads it: a lane for each thing it's up against,
// with the dice of yours at it (keep says which), and one for dice at nothing,
// which only their top faces pay for.
function lanesOf(r, keep = () => true) {
  const at = (j) => r.dice.map((d, i) => ({ d, i })).filter(({ d, i }) => d.at === j && keep(i)).map(({ d }) => ({ size: d.size, v: d.nat }));
  const lanes = r.foes.map((f, j) => ({ mine: at(j), theirs: f.v != null ? [{ size: f.size || 0, v: f.v }] : [], def: "them" }));
  lanes.push({ mine: at(-1), theirs: [], def: "them" });
  return lanes.filter((l) => l.mine.length);
}
function settle(s, c, which) {
  const r = roll;
  const set = new Set(which);
  // With the Ties Boon a tie's a win as it lands, so it pays like one.
  const ties = R.boonCount(c, "Ties") > 0;
  let boon = 0;
  if (ties) for (const i of which) {
    const d = r.dice[i];
    const f = r.foes[d.at];
    if (f?.v != null && d.nat === f.v) {
      d.won = "boon";
      boon += 1;
    }
  }
  const read = readLanes(lanesOf(r, (i) => set.has(i)));
  const won = read.wins + boon;
  const n = read.aura + boon;
  r.tops = read.tops;
  r.auraNote = "";
  if (n) {
    const over = gainAura(s, c, n);
    r.auraNote = auraSaid(won, read.tops, n, s, c, over);
    r.log.push(r.auraNote);
  }
  if (r.heal) r.healed = r.dice.reduce((t, d) => t + d.nat + d.plus, 0) + healBonus(c);
  s.last = lastOf();
}

function go(real) {
  const ch = current();
  const c = normal(ch);
  const k = counted(roll, c, ch.state);
  if (k.short) return;
  const name = rollName(roll, k, c, ch.state);
  change(`rolling ${name}`, (s) => {
    const r = roll;
    const g = r.groups.main;
    R.payFor(c, s, { ok: true, points: k.points, aura: k.aura });
    // An action's your own turn: Aura can go past your maximum till you've finished.
    s.acting = true;
    r.log = [];
    const woke = R.awakeningsOf(c, s);
    r.log.push(`${k.root} ${k.rootN}${k.brought.map((b) => `, your ${b.root} ${b.steps} brought in`).join("")}${k.awk.map((w) => `, ${woke.find((x) => x.key === w.key)?.name ?? w.name} ${w.steps}`).join("")}${k.plusSteps ? `, ${steps(k.plusSteps)} from friends` : ""}. ${steps(k.total)}.`);
    const perm = (b) => R.thingsOf(c, s).find((x) => x.key === b.perm)?.name ?? b.perm;
    for (const b of k.brought) r.log.push(`Your ${b.root} came in on ${perm(b)}, for ${b.pay === "aura" ? `${R.BRING_AURA} Aura` : `a point of ${b.root}`}.`);
    const awkAura = k.awk.reduce((t, w) => t + w.aura, 0);
    if (awkAura) r.log.push(`Put ${awkAura} Aura into your awakenings.`);
    if (borrowsOf(g)) r.log.push(`Paid ${borrowsOf(g)} Aura to borrow through a bond thread.`);
    if (r.beyond && !k.free) r.log.push("Paid 1 Aura to go beyond.");
    if (r.beyond && k.free) {
      s.beyond = true;
      r.log.push(`Went beyond for nothing, with ${R.boonSaid(c, "Going beyond")}. That’s your free go this scene.`);
    }
    // A shadow die's gone once it's used.
    if (k.pool.length) {
      const used = new Set(k.pool.map((x) => x.i));
      r.log.push(`Used your ${andList(k.pool.map((x) => (x.die ? `shadow d${x.size}` : `shadow d${x.size} as ${steps(x.size / 2)}`)))}.`);
      s.pool = (s.pool ?? []).filter((_, i) => !used.has(i));
      if (!s.pool.length) delete s.pool;
      r.pool = {};
    }
    r.name = name;
    r.total = k.total;
    r.picks = { root: g.root, bring: asRoll(g).bring, awk: asRoll(g).awk };
    const intent = (key) => String(r.intents[key] ?? "").trim();
    r.dice = k.dice.map((size, i) => ({ size, nat: 0, plus: 0, won: false, intent: r.heal ? "" : intent(i), at: r.heal ? -1 : aimOf(r, i) }));
    // Anyone going at a Marked thing rolls its Mark die too, one more die at it.
    if (!r.heal) r.against.forEach((t, j) => {
      if (t.mark && r.dice.some((d) => d.at === j && !d.mark)) r.dice.push({ size: t.mark, nat: 0, plus: 0, won: false, mark: true, intent: intent(`m${j}`), at: j });
    });
    r.foes = r.heal ? [] : r.against.map((t, j) => ({ size: t.die || 0, v: t.die ? null : t.n, used: r.dice.some((d) => d.at === j) }));
    r.real = real;
    r.pick = null;
    if (real) {
      r.mode = "pad";
      r.pads = r.dice.map((_, i) => i);
      r.padFoes = r.foes.flatMap((f, j) => (f.size && f.used ? [j] : []));
    } else {
      for (const d of r.dice) d.nat = throwDie(d.size);
      for (const f of r.foes) if (f.size && f.used) f.v = throwDie(f.size);
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
// the same archetype taken again, paid in Aura. One about defence dice goes
// on When it lands, and the rest on an action.
const pushesOf = (c, defence) => R.archetypesOf(c, DATA.build).flatMap((a) => a.abilities.filter((x) => x.push).map((x) => ({ arch: a.name, cost: x.cost, bonus: x.push, html: x.html, text: x.text }))).filter((p) => /\bdefen[cs]e\b|\bDefend\b/i.test(p.text) === defence);
// The rest of an archetype's abilities, paid for from a roll card.
const otherAbilities = (c) => R.archetypesOf(c, DATA.build).flatMap((a) => a.abilities.map((x, j) => ({ ...x, j, arch: a.name })).filter((x) => !x.push));
// A number said out loud: an 8, an 11, an 18, and a for the rest.
const aNum = (n) => `${/^(8|11|18)$|^8\d$/.test(String(n)) ? "an" : "a"} ${n}`;
const auraCost = (n) => `${n} Aura`;

// A Shadow's pool on the roll card: each die left out, as steps (a d8's 4),
// or as its own die on the end.
function poolGroup(s, r) {
  const row = (d, i) => {
    const how = r.pool?.[i];
    const chip = (v, label) => `<button type="button" class="cc-chipbtn sm" data-act="pool" data-i="${i}" data-v="${v}"${pressed((how ?? "") === v)}>${label}</button>`;
    return `<div class="cc-pool-row">${kitMini(d, { own: "you" })}<div class="cc-chips" role="group" aria-label="Your shadow d${d}">${chip("", "Not this time")}${chip("steps", `As ${steps(d / 2)}`)}${chip("die", `As its own d${d}`)}</div></div>`;
  };
  return `<fieldset class="cc-group" aria-labelledby="rc-pool-t"><legend><span id="rc-pool-t">Your shadow pool</span> ${tip("rc-pool", ["What you saw from hiding. Add them to any roll, as steps or as their own dice, and a die’s gone once you use it.", link("a-shadow", "Shadow in the rules")], "Your shadow pool")}</legend>${s.pool.map(row).join("")}</fieldset>`;
}

// A Gambler's flip, inside a change: a die comes up its size plus 1, take
// away what it rolled. A flipped die never pays Aura, so nothing's settled
// again. which is a list of your dice, or "them:j" for what you're up against.
function flipOn(which) {
  const r = roll;
  r.pick = null;
  r.flips = (r.flips ?? 0) + 1;
  if (typeof which === "string") {
    const f = r.foes[Number(which.split(":")[1] ?? 0)];
    if (!f?.size || f.v == null) return;
    f.v = f.size + 1 - f.v;
    r.log.push(`Flipped their d${f.size}, so it’s ${aNum(f.v)} now.`);
    return;
  }
  const flipped = which.map((i) => r.dice[i]).filter(Boolean);
  for (const d of flipped) {
    d.nat = d.size + 1 - d.nat;
    d.flip = true;
  }
  r.log.push(flipped.length === 1 ? `Flipped your d${flipped[0].size}, so it’s ${aNum(valOf(flipped[0]))} now. A flipped die never pays Aura.` : `Flipped every die of yours: ${andList(flipped.map((d) => `the d${d.size}’s ${aNum(valOf(d))}`))}. A flipped die never pays Aura.`);
}

// What a pick on a die is waiting for: which die to flip, roll again or Push.
function pickNote(c, s) {
  const p = roll.pick;
  if (!p) return "";
  if (p.type === "flip") return `<div class="cc-note" role="status"><p>Tap a die to flip it, yours${roll.foes?.some((f) => f.size && f.v != null) ? " or theirs" : ""}. It comes up its size plus 1, take away what it rolled, so a 2 on a d10 is a 9. A flipped die never pays Aura.</p><div class="cc-row"><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
  if (p.type === "reroll") return `<div class="cc-note" role="status"><p>Tap a die to roll it again, or roll them all. It’s a point of Soul either way.</p><div class="cc-row"><button type="button" class="button sm" data-act="reroll-all">Roll them all</button><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
  return `<div class="cc-note" role="status"><p>Tap the die to put +${p.bonus} on, for ${esc(p.arch)}’s Push, ${auraCost(p.cost)}.</p><div class="cc-row"><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
}

function resultView(c, s, ch) {
  const r = roll;
  const outs = r.dice.map(outcome);
  const words = { beat: "Beat it", won: "Tie, won for 1 Aura", tie: "Tie", under: "Under" };
  const wordOf = (o, d) => (o === "won" && d.won === "boon" ? "Tie, won by your Boon" : words[o]);
  const picking = r.pick && !r.spinning;
  const many = r.foes.length > 1;
  // Each die as the kit draws it, its number on the hub: a top face lights the
  // whole token, a lost one goes dark, and a tie's hub is dashed.
  const stateOf = (d, o) => (d.nat === d.size && !d.plus && !d.flip ? "top" : o === "under" ? "low" : o === "tie" ? "tie" : "");
  const die = (d, i) => {
    const v = d.nat + d.plus;
    if (r.spinning) return kitDie(d.size, { face: d.nat, spin: true, label: `Your d${d.size}, rolling` });
    const drawn = kitDie(d.size, { face: v, state: stateOf(d, outs[i]), label: `${d.mark ? "The Mark" : "Your"} d${d.size} came up ${v}` });
    if (picking) return `<button type="button" class="cc-pickdie" data-act="pick" data-i="${i}" aria-label="The d${d.size} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>`;
    return drawn;
  };
  // What had dice at it. Anything nobody went at is left out.
  const used = r.foes.map((f, j) => ({ f, j })).filter(({ f }) => f.used);
  const only = used.length === 1 ? used[0].f : null;
  const against = r.heal ? "a heal" : !used.length ? "with nothing to beat" : only ? (only.size ? `against their d${only.size}, which came up ${r.spinning ? "…" : only.v}` : `against the ${only.v} to beat`) : `against ${andList(used.map(({ f }) => (f.size ? `their d${f.size}` : `a ${f.v}`)))}`;
  const flipping = picking && r.pick.type === "flip";
  // What it was up against, each one under "against". Their die only goes
  // dark when every one of yours at it beat it.
  const foeOf = ({ f, j }) => {
    const mine = outs.filter((o, i) => r.dice[i].at === j && o);
    const lost = mine.length > 0 && mine.every((o) => o === "beat" || o === "won");
    if (!f.size) return `<div class="cc-them"><span class="vs" aria-hidden="true">against</span><span class="k">To beat</span><span class="cc-tobeat">${f.v}</span></div>`;
    const theirs = kitDie(f.size, { own: "them", face: f.v, spin: r.spinning && f.used, state: !r.spinning && lost ? "low" : "", label: r.spinning ? `Their d${f.size}, rolling` : f.v == null ? `Their d${f.size}, not rolled` : `Their d${f.size} came up ${f.v}` });
    return `<div class="cc-them"${r.spinning ? ' data-act="skip"' : ""}><span class="vs" aria-hidden="true">against</span><span class="k">${esc(cap(foeTag(r, j)))}</span>${flipping && f.v != null ? `<button type="button" class="cc-pickdie" data-act="pick" data-i="them:${j}" aria-label="Their d${f.size} that came up ${f.v}">${theirs.replace('role="img"', 'aria-hidden="true"')}</button>` : theirs}</div>`;
  };
  const them = used.length ? `<div class="cc-foes-now${many ? " is-many" : ""}">${used.map(foeOf).join("")}</div>` : "";
  const pushes = pushesOf(c, false).filter((p) => !r.heal || /\bheal/i.test(p.text));
  const canReroll = s.pts.Soul >= 1 && !r.heal && (!used.length || outs.some((o) => o === "tie" || o === "under"));
  const hidden = r.dice.filter((d) => !d.mark).map((d) => d.size);
  const offers = r.spinning || r.pick ? "" : [
    ...outs.map((o, i) => (o === "tie" ? `<button type="button" class="button sm" data-act="win-tie" data-i="${i}"${off(s.aura < 1)}>Win the tie on the d${r.dice[i].size}: 1 Aura</button>` : "")),
    isA(c, "Gambler") && !r.flips ? `<button type="button" class="button sm" data-act="flip">Flip a die, your one this round</button>` : "",
    isA(c, "Shadow") && !r.pooled && hidden.length && !r.heal ? `<button type="button" class="button sm" data-act="hid">Got into hiding: your ${andList(hidden.map((d) => `d${d}`))} into your shadow pool</button>` : "",
    ...pushes.map((p) => `<button type="button" class="button sm is-aura" data-act="push" data-a="${esc(p.arch)}"${off(s.aura < p.cost)}>${esc(p.arch)}’s Push: +${p.bonus} on a die, ${auraCost(p.cost)}</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: a point of Soul</button>` : "",
  ].join("");
  const others = otherAbilities(c);
  const how = [
    ...(pushes.length && !r.spinning && !r.pick ? [`<p class="cc-lead">${pushes.map((p) => `<b>${esc(p.arch)}’s Push:</b> ${p.html}`).join(" ")}</p>`] : []),
    ...(r.log.length ? [`<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`] : []),
  ].join("");
  // A heal: what it heals, for the patient's phone, or this one's own.
  const ease = healEase(c);
  const heal = r.heal && !r.spinning ? `<div class="cc-note is-gold cc-healnote" role="status"><p><b>It heals ${r.healed}.</b>${healBonus(c) ? ` That’s ${r.healed - healBonus(c)} rolled and ${healBonus(c)} from ${andList(healBonus(c, true))}.` : ""} Your patient gets it back across their Roots, less 5 for each Toll they’ve got${ease ? `, and your heals ignore ${ease === 1 ? "a step" : `${ease} steps`} of it` : ""}. Then it’s 1 more Toll for them.</p>
    <div class="cc-row"><button type="button" class="button sm" data-act="heal" data-v="${r.healed}" data-self="1">It’s for me</button>${tip("rs-heal", ["On their phone, they tap their Root, then A heal, and put in what it heals.", "Healing yourself is your heal like any other, but it isn’t from someone else, so it gives you no Toll.", link("s-healing", "Healing in the rules")], "Getting the heal to them")}</div></div>` : "";
  // The telegraph or the stake it was answering only hears about the dice at it.
  const toTable = (r.tele || r.work) && !r.spinning && !r.pick && r.foes[0]?.v != null ? table.rollNote({ ...r, dice: r.dice.filter((d) => d.at === 0), opp: r.foes[0].v }) : "";
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${nameHead(r.name)}</h2><p class="cc-small">${steps(r.total)}, ${esc(against)}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.dice.length)}">
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${r.dice.map((d, i) => `<li class="res is-${r.spinning ? "spin" : outs[i] ?? "none"}">${die(d, i)}<span class="res-die">${d.mark ? "Mark " : ""}d${d.size}${d.plus ? ` +${d.plus}` : ""}</span>${many && d.at >= 0 ? `<span class="res-at">at ${esc(foeTag(r, d.at))}</span>` : ""}${d.intent ? `<span class="res-intent">${esc(d.intent)}</span>` : ""}${!r.spinning && outs[i] ? `<b class="res-out">${wordOf(outs[i], d)}</b>` : ""}${!r.spinning && d.nat === d.size && !d.flip ? '<span class="res-note">Top face</span>' : ""}${!r.spinning && d.flip ? '<span class="res-note">Flipped</span>' : ""}</li>`).join("")}</ul>
    ${them}
    ${r.spinning ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${r.auraNote && !r.spinning ? `<p class="cc-topnote">${esc(r.auraNote)}</p>` : ""}
    ${heal}
    ${toTable}
    ${r.spinning ? "" : pickNote(c, s) || payNote(c, s)}
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    <p class="cc-small cc-left">You’ve got ${s.aura} Aura${s.acting ? ", and you’re acting" : ""}. ${glancePts(c, s)}.</p>
    ${others.length && !r.spinning && !r.pick ? `<details class="cc-how" data-open="abil"${ui.open.has("abil") ? " open" : ""}><summary>Pay for an ability</summary>${others.map((x) => `<p><b>${esc(x.arch)}, ${esc(x.name)}:</b> ${x.html}</p><div class="cc-row"><button type="button" class="button sm is-aura" data-act="ability" data-a="${esc(x.arch)}" data-j="${x.j}"${off(s.aura < x.cost)}>Pay for ${esc(x.name)}: ${auraCost(x.cost)}</button></div>`).join("")}</details>` : ""}
    ${how && !r.spinning ? `<details class="cc-how" data-open="how"${ui.open.has("how") ? " open" : ""}><summary>How it counted</summary>${how}</details>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- a heal

// A heal coming in, on the patient's phone: what it heals (what was rolled
// and any bonus), whether it's from someone or something else (1 more Toll
// once it's done), whether their heals ignore a step of Toll, and where it
// goes, the most room first unless the player shares it out themselves.
// self: a Healer's own heal on themselves.
function openHeal(amount = 0, self = false) {
  openRoll({ kind: "heal", amount: clamp(amount, 0, 99), other: !self, ease: 0, spread: null });
}
function healPlan(c, s, r) {
  const toll = Math.max(0, s.toll - r.ease);
  const net = Math.max(0, r.amount - R.TOLL_STEP * toll);
  const room = Object.fromEntries(R.ROOTS.map((x) => [x, Math.max(0, R.capOf(c, s, x) - s.pts[x])]));
  let spread = r.spread;
  if (!spread) {
    const copy = JSON.parse(JSON.stringify(s));
    spread = R.healBy(c, copy, r.amount, null, { ease: r.ease }).healed;
  }
  const given = R.ROOTS.reduce((t, x) => t + Math.min(room[x], spread[x] ?? 0), 0);
  return { toll, net, room, spread, given, left: Math.max(0, net - given) };
}
function healView(c, s) {
  const r = roll;
  const p = healPlan(c, s, r);
  const row = (root) => `<div class="cc-stepper"><span>Your ${root} <small>${s.pts[root]} now, room for ${p.room[root]}</small></span>${stepper("hspread", Math.min(p.spread[root] ?? 0, p.room[root]), 0, Math.min(p.room[root], (p.spread[root] ?? 0) + p.left), `Healed on your ${root}`, root)}</div>`;
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">A heal</h2><p class="cc-small">${p.net ? `${p.net} to share out` : "Nothing gets through the Toll"}${s.toll ? `, with ${s.toll} Toll on you` : ""}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <div class="cc-stepper"><span>What it heals <small>what was rolled, and any bonus</small></span>${stepper("hamount", r.amount, 0, 99, "What it heals")}</div>
    <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="hother" data-v="1"${pressed(r.other)}>From someone or something else</button><button type="button" class="cc-chipbtn" data-act="hother" data-v="0"${pressed(!r.other)}>My own</button>${tip("hl-toll", ["Every heal you take from someone or something else is 1 more Toll, and a heal loses 5 for each Toll you’ve already got.", "Toll drops by 1 at the end of each scene, and downtime clears it.", link("s-healing", "Healing in the rules")], "Toll")}</div>
    ${s.toll ? `<button type="button" class="cc-line" data-act="hease"${pressed(r.ease > 0)}><span class="tick" aria-hidden="true"></span><span>Their heals ignore a step of Toll <small>a Healer’s Trait, or an attuned thing that says so</small></span></button>` : ""}
    ${p.toll || p.left ? `<p class="cc-small">${p.toll ? `${r.amount}, less ${R.TOLL_STEP * p.toll} for ${p.toll} Toll, is ${p.net}. ` : ""}${p.left ? `${p.left} won’t fit anywhere, so it’s lost.` : ""}</p>` : ""}
    ${R.ROOTS.filter((x) => c.roots[x] > 0).map(row).join("")}
    ${R.ROOTS.some((x) => s.wound[x]) ? `<p class="cc-small">A wounded Root heals only to half what it can hold, so ${andList(R.ROOTS.filter((x) => s.wound[x]).map((x) => `your ${x} stops at ${R.capOf(c, s, x)}`))}.</p>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="heal-take"${off(!r.amount)}>Take it</button></div>`;
}
function takeHeal() {
  const r = roll;
  if (r?.kind !== "heal") return;
  let message = "";
  const last = undo[undo.length - 1];
  change("a heal", (s, c) => {
    const p = healPlan(c, s, r);
    const spread = Object.fromEntries(R.ROOTS.map((x) => [x, Math.min(p.room[x], p.spread[x] ?? 0)]));
    const h = R.healBy(c, s, r.amount, spread, { other: r.other, ease: r.ease });
    const back = R.ROOTS.filter((x) => h.healed[x]).map((x) => `your ${x} to ${s.pts[x]}`);
    message = `${back.length ? `It heals ${h.amount}: ${andList(back)}.` : "Nothing got through the Toll."}${r.other ? ` That’s ${h.toll} Toll on you now.` : ""}`;
    return message;
  }, { say: false });
  closeDialog();
  toast(message || "A heal.", undo[undo.length - 1] !== last);
}

// ---------------------------------------------------------------- when it lands

// When it lands: whatever nobody answered rolls against the Root it's at,
// each Root once, at full, split however the player likes, and each die
// stops one telegraph there that it meets or beats. Defend as your action and
// a Root that fits how you're defending rolls on top, and each of those dice
// stops one too. A Root can bring another in on its roll the usual way. What
// gets through is a hit, or more for a deadly threat and a vulnerability on
// you, each settled on its own: a point off its Root, a box of armour there,
// 2 for 1 on another Root, the condition it was going for, or something else.
// pre: the telegraphs that landed on this character (table.js), their dice,
// the Root each one's at, what each was doing and how many hits it is,
// ready to roll against. The table aimed them, so their Roots stay as they are.
function openDefence(pre = null) {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const incoming = (pre?.incoming ?? []).map((d, j) => ({ d, at: R.ROOTS.includes(pre?.roots?.[j]) ? pre.roots[j] : "Body", intent: String(pre.intents?.[`d${j}`] ?? "").slice(0, 40), fixed: Boolean(pre?.teles?.[j]), hits: clamp(pre?.hits?.[j] ?? 1, 1, 9), ...(pre?.nodef?.[j] ? { nodef: true } : {}) }));
  const at = incoming.find((x) => !x.nodef)?.at ?? incoming[0]?.at ?? "Body";
  const groups = Object.fromEntries([...R.ROOTS.map((root) => [root, freshGroup(root)]), ["defend", freshGroup(at)]]);
  openRoll({ kind: "defence", mode: "build", incoming, add: at, addHits: 1, defend: Boolean(pre?.defend), groups, mine: [], opp: [], assign: [], done: [], paid: [], pick: null, log: [], spinning: false, padOpp: true, swap: null, camp: pre?.camp ?? null, teles: pre?.teles ?? [], from: pre?.from ?? {}, intents: {}, owns: new Set() });
}

// The dice you've got against it: each Root something's at, at full, and
// Defend's Root on top when it was your action, each with what's brought in
// and woken, and what it all costs.
function defencePool(c, s, r) {
  const keys = [...R.ROOTS.filter((root) => r.incoming.some((x) => x.at === root && !x.nodef)), ...(r.defend ? ["defend"] : [])];
  const groups = keys.map((key) => {
    const g = r.groups[key];
    const k = R.countRoll(c, s, asRoll(g));
    const sh = shaped(k.total, g);
    return { key, g, root: g.root, k, ...sh, dice: sh.split, aura: k.aura + borrowsOf(g) };
  });
  const points = Object.fromEntries(R.ROOTS.map((x) => [x, groups.reduce((t, x2) => t + (x2.k.points[x] ?? 0), 0)]));
  const aura = groups.reduce((t, x) => t + x.aura, 0);
  const need = groups.flatMap((x) => x.k.short.filter((y) => /^a permission/.test(y)));
  const short = [...need, ...R.ROOTS.filter((x) => points[x] > s.pts[x]).map((x) => `${points[x]} ${points[x] === 1 ? "point" : "points"} of ${x}`), ...(aura > s.aura ? [`${aura} Aura`] : [])];
  return { groups, points, aura, short: short.length ? `${/^a permission/.test(short[0]) ? "Name the permission that brings it in" : `You need ${andList(short)}`}.` : "" };
}

// An intent like "pin" or "frighten" is a condition when it gets through, and
// its die is the die that placed it.
function condOf(text) {
  const word = String(text ?? "").trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "");
  if (word.length < 3) return null;
  return DATA.conditions.find((x) => x.kind === "against" && x.name.toLowerCase().startsWith(word) && x.name.length - word.length <= 3) ?? null;
}
// The conditions on you that make a hit one more, like Exposed.
const vulnsOn = (s) => s.conditions.filter((x) => x.kind === "against" && /\bvulnerable\b/i.test(COND.get(x.name)?.passive ?? "")).map((x) => x.name);

const valOf = (m) => m.nat + m.plus;
// Can this die stop that telegraph? A Root's roll only stops what's at it.
// One whose answer lost landed then and there, so nothing rolls against it.
const fits = (m, tele) => !tele.nodef && (m.src === "root" ? m.root === tele.at : true);
// Each of your dice stops one telegraph. The phone matches them up so the
// most get stopped: the lowest telegraph takes the lowest roll that can stop
// it, a Root's own die before Defend's on a tie, since Defend's can go
// anywhere. A die left over goes on what got through, so it says what it came
// up against. The player can swap two.
function assignBest(r) {
  r.assign = r.incoming.map(() => null);
  const used = new Set();
  const order = r.incoming.map((_, j) => j).sort((a, b) => r.opp[a] - r.opp[b] || a - b);
  for (const j of order) {
    const can = r.mine.map((m, i) => ({ m, i })).filter(({ m, i }) => !used.has(i) && fits(m, r.incoming[j]) && valOf(m) >= r.opp[j]).sort((a, b) => valOf(a.m) - valOf(b.m) || (a.m.src === "root" ? -1 : 1) - (b.m.src === "root" ? -1 : 1));
    if (can[0]) {
      r.assign[j] = can[0].i;
      used.add(can[0].i);
    }
  }
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

// Which of your dice stops which telegraph. Ties go to you. What gets through
// is hits: the telegraph's own, and one more for each vulnerability on you.
function blocks(r) {
  return r.incoming.map((x, j) => {
    const pair = r.assign[j];
    const mine = pair != null && r.mine[pair] ? valOf(r.mine[pair]) : null;
    const by = mine != null && mine >= r.opp[j] ? pair : null;
    return { j, size: x.d, at: x.at, v: r.opp[j], pair, mine, by, intent: x.intent, hits: by == null ? x.hits + (r.vulns?.length ?? 0) : 0 };
  });
}
// How many Scars each Root has, to tell when a hit's left one.
const scarCount = (s) => Object.fromEntries(R.ROOTS.map((k) => [k, Array.isArray(s.scars?.[k]) ? s.scars[k].length : 0]));
const hitsLeft = (r, h) => Math.max(0, h.hits - (r.done[h.j] ?? 0));
const paying = (r) => r.done.some(Boolean);

function defenceGo(real) {
  const r = roll;
  const ch = current();
  const c = normal(ch);
  if (!r.incoming.length || !c) return;
  const p = defencePool(c, ch.state, r);
  if (p.short) return;
  change("rolling your defence", (s) => {
    // The telegraphs land at the end of the round, once everyone's acted.
    const over = s.acting ? R.doneActing(s, c) : 0;
    r.log = [];
    if (over) r.log.push(`You’d finished acting, so the ${over} Aura over your ${R.auraMax(c, s)} went.`);
    for (const x of R.ROOTS) if (p.points[x]) {
      s.pts[x] -= p.points[x];
      r.log.push(`Paid ${p.points[x]} ${p.points[x] === 1 ? "point" : "points"} of ${x} to bring it in.`);
    }
    if (p.aura) {
      s.aura -= p.aura;
      r.log.push(`Paid ${p.aura} Aura for what you brought in and woke.`);
    }
    r.mine = p.groups.flatMap((x) => x.dice.map((size) => ({ size, nat: 0, plus: 0, src: x.key === "defend" ? "defend" : "root", root: x.root })));
    r.defName = p.groups.find((x) => x.key === "defend") ? `Defend on your ${r.groups.defend.root} for ${steps(p.groups.find((x) => x.key === "defend").k.total)}` : "";
    r.rolled = p.groups.filter((x) => x.key !== "defend").map((x) => `your ${x.root} for ${steps(x.k.total)}`);
    r.vulns = vulnsOn(s);
    r.opp = r.incoming.map(() => 0);
    r.done = r.incoming.map(() => 0);
    r.paid = r.incoming.map(() => "");
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
  if (!paying(r)) assignBest(r);
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
  const hitChips = (j, now, fixed) => `<div class="cc-chips" role="group" aria-label="How many hits it is"><span class="cc-small">Hits</span>${[1, 2, 3, 4].map((n) => `<button type="button" class="cc-chipbtn sm" data-act="d-hits" data-j="${j}" data-v="${n}"${pressed(now === n)}${off(fixed && n !== now)}>${n}</button>`).join("")}</div>`;
  const rows = r.incoming.map((x, j) => `<li class="cc-inc"><div class="cc-inc-in">${kitDie(x.d, { own: "them", label: `Their d${x.d}` })}<div><p><b>Their d${x.d}</b> ${x.intent ? `<small>${esc(x.intent)}</small>` : ""}${x.hits > 1 ? ` <small>${x.hits} hits</small>` : ""}</p>
    <div class="cc-chips" role="group" aria-label="Where their d${x.d} is aimed">${R.ROOTS.map((root) => rootChip(root, "d-at", x.at, ` data-j="${j}"${off(x.fixed && root !== x.at)}`)).join("")}</div>${x.fixed ? "" : hitChips(j, x.hits, x.fixed)}</div>
    ${r.teles?.[j] ? "" : `<button type="button" class="cc-x sm" data-act="d-del" data-i="${j}" aria-label="Take their d${x.d} off">${ICON.close}</button>`}</div></li>`).join("");
  const costs = [p.aura ? `<span class="chip is-aura">${p.aura} Aura</span>` : "", ...R.ROOTS.filter((x) => p.points[x]).map((x) => `<span class="chip is-track">${p.points[x] === 1 ? "a point" : `${p.points[x]} points`} of ${x}</span>`)].join("");
  const group = (x) => {
    const g = x.g;
    const at = x.key === "defend";
    const open = ui.open.has(`dl-more-${x.key}`);
    return `<fieldset class="cc-group" aria-labelledby="dl-${x.key}-t"><legend><span id="dl-${x.key}-t">${at ? "Your Defend" : `Your ${x.root}`}</span> <small>${steps(x.k.total)}, ${diceLabel(x.dice)}</small></legend>
      ${at ? `<div class="cc-chips cc-rootpick" role="group" aria-label="Defend’s Root">${R.ROOTS.map((root) => `<button type="button" class="cc-chipbtn" data-act="root" data-g="defend" data-v="${root}"${pressed(g.root === root)}>${root} <small>${c.roots[root]}</small></button>`).join("")}</div>` : `<p class="cc-small">Stops one telegraph ${AT[x.root]} for each die. ${x.k.rootN ? "" : "Your Root’s 0, so it’s a d2."}</p>`}
      ${splitView(x, x.key, "How many dice")}
      <details class="cc-own" data-open="dl-more-${x.key}"${open ? " open" : ""}><summary>Bring a Root in, or an awakening</summary>${bringView(c, s, g, x.key, `dl-${x.key}`)}${awakeView(c, s, g, x.key, `dl-${x.key}`)}</details></fieldset>`;
  };
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...p.groups.flatMap((x) => x.dice.map((d) => [d, "you"])), ...r.incoming.map((x, j) => [x.d, "them", j ? "is-them" : "is-vs"])])}<span>${p.groups.length ? andList(p.groups.map((x) => `${x.key === "defend" ? "Defend" : `your ${x.root}`} ${diceLabel(x.dice)}`)) : "Nothing’s coming at you yet"}</span></p>
      ${costs ? `<p class="cc-costs">${costs}</p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <fieldset class="cc-group" aria-labelledby="dl-in-t"><legend><span id="dl-in-t">What’s coming at you</span> ${tip("dl-in", ["Add each telegraph that landed on you, with its die and the Root it’s at.", "Blows and teeth are at your Body, fear, lies and pressure at your Mind, and despair, temptation and curses at your Soul.", "A deadly threat’s telegraph says how many hits it is. A vulnerability on you is one more, and the phone adds that."], "What’s coming at you")}</legend>
      ${rows ? `<ul class="cc-incs">${rows}</ul>` : ""}
      <div class="cc-chips" role="group" aria-label="Where the next one’s aimed">${R.ROOTS.map((root) => rootChip(root, "d-add-at", r.add)).join("")}</div>
      <div class="cc-chips" role="group" aria-label="Its die">${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="d-add" data-v="${d}" aria-label="Add their d${d} ${AT[r.add]}">+ d${d}</button>`).join("")}</div></fieldset>
    ${p.groups.filter((x) => x.key !== "defend").map(group).join("") || `<p class="cc-small">Nothing to roll yet. ${ruleTip("s-defending", "How When it lands works", "dl-tr")}</p>`}
    <fieldset class="cc-group" aria-labelledby="dl-df-t"><legend><span id="dl-df-t">Did you Defend?</span> ${tip("dl-df", ["Defend as your action and a Root that fits how you’re defending rolls on top of the Root they’re landing on.", "Each of its dice stops one telegraph it meets or beats, as long as how you’re defending fits it.", link("s-defend", "Defend in the rules")], "How Defend works")}</legend>
      <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="d-defend" data-v="0"${pressed(!r.defend)}>No, I let it ride</button><button type="button" class="cc-chipbtn" data-act="d-defend" data-v="1"${pressed(r.defend)}>I Defended as my action</button></div></fieldset>
    ${p.groups.filter((x) => x.key === "defend").map(group).join("")}
  </div>
  <div class="dlg-foot">${p.short ? `<p class="cc-warn" role="alert">${esc(p.short)}</p>` : ""}<button type="button" class="button primary" data-act="d-go"${off(!r.incoming.length || p.short)}>Roll</button><button type="button" class="button" data-act="d-real"${off(!r.incoming.length || p.short)}>Roll real dice</button></div>`;
}

// A hit at a Root, as its button says it: a point off, the wound it'd leave,
// or the Scar.
const hitSaid = (s, root) => (s.pts[root] > 0 ? `Your ${root} takes it: ${s.pts[root]} to ${s.pts[root] - 1}` : !s.wound[root] ? `Your ${root} takes it: you’re ${R.WOUNDS[root]}` : `Your ${root} takes it: a Scar, and you leave the scene`);
// What got through, a hit at a time: a point off its Root (a wound at 0, and
// a Scar on a wounded Root at 0), a box on armour on that Root, 2 for 1 off
// another Root that's got them, Toughness or Stand firm, the condition it
// was going for, or whatever else the GM names.
function payView(h, r, s, c) {
  const left = hitsLeft(r, h);
  const said = r.paid[h.j] ? `<p class="cc-paid">${esc(r.paid[h.j])}</p>` : "";
  if (!left) return said;
  if (s.out || s.blaze) return `${said}<p class="cc-small">You’re ${s.out ? "out of" : "leaving"} the scene, so ${left === 1 ? "the last hit does" : `the last ${left} do`} nothing.</p>`;
  const root = h.at;
  const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === root && leftOf(s, a) > 0);
  const cond = condOf(h.intent);
  const b = (what, label, extra = "", no = false) => `<button type="button" class="button sm" data-act="d-pay" data-j="${h.j}" data-what="${what}"${extra}${off(no)}>${label}</button>`;
  // The Toughness Boon: the first hit each scene (one for each) takes no point.
  const tough = R.boonCount(c, "Toughness") > (s.tough ?? 0);
  const shrug = cond && R.shrugs(c, cond.name);
  const whole = !(r.done[h.j] ?? 0);
  return `${said}<p class="cc-small">${left === h.hits ? `${h.hits === 1 ? "A hit" : `${h.hits} hits`}${r.vulns?.length && h.hits > 1 ? `, with ${andList(r.vulns)}` : ""}` : `${left} more`} to settle.</p><div class="cc-row cc-pays">
    ${tough ? b("tough", `${esc(R.boonSaid(c, "Toughness"))}: your first hit this scene takes no point`) : ""}
    ${(s.firm ?? 0) > 0 ? b("firm", `Stand firm: ${s.firmPaid ? "this one takes nothing" : "1 point for the two of them"}`) : ""}
    ${b("hit", hitSaid(s, root))}
    ${pieces.map((a) => b("box", `${cap(yours(a))} take${many(a) ? "" : "s"} it: tick a box${a.when ? `, ${esc(a.when)}` : ""}`, ` data-k="${esc(`equipment|${a.name}`)}"`)).join("")}
    ${R.ROOTS.filter((x) => x !== root && s.pts[x] >= 2).map((x) => b("two", `2 for 1: 2 points of ${x}`, ` data-on="${x}"`)).join("")}
    ${cond && !shrug && whole ? b("cond", `${esc(cond.name)} d${h.size} on you instead`) : ""}
    ${whole ? b("else", "Something else the GM names") : ""}</div>${shrug ? `<p class="cc-small">${esc(cond.name)} can’t touch you, with ${esc(R.boonSaid(c, "Conditions"))}.</p>` : ""}`;
}

function defenceResult(c, s, ch) {
  const r = roll;
  const hs = blocks(r);
  const spin = r.spinning;
  const picking = r.pick && !spin;
  const nameOfDie = (m) => (m.src === "root" ? `Your ${m.root}` : "Your Defend");
  const mineDie = (m, i) => {
    const v = valOf(m);
    const label = `${nameOfDie(m)} d${m.size}`;
    if (spin) return kitDie(m.size, { face: m.nat, spin: true, label: `${label}, rolling` });
    const drawn = kitDie(m.size, { face: v, state: m.nat === m.size && !m.plus ? "top" : "", label: `${label} came up ${v}` });
    if (picking) return `<button type="button" class="cc-pickdie" data-act="pick" data-i="${i}" aria-label="${label} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>`;
    return drawn;
  };
  const row = (h) => {
    const stopped = h.by != null;
    const m = h.pair != null ? r.mine[h.pair] : null;
    const by = m ? `${m.src === "root" ? `your ${m.root}` : "your Defend"}’s ${valOf(m)}` : "";
    const swapBtn = m && !paying(r) ? `<button type="button" class="button sm" data-act="d-swap" data-j="${h.j}"${pressed(r.swap === h.j)}>${r.swap === h.j ? "Swap with…" : "Swap"}</button>` : "";
    return `<li class="cc-hit is-${stopped ? "stopped" : "through"}"><div class="cc-hit-in">${kitDie(h.size, { own: "them", face: spin ? null : h.v, spin, label: spin ? `Their d${h.size}, rolling` : `Their d${h.size} ${AT[h.at]} came up ${h.v}` })}
      <div><p><b>Their d${h.size}</b> <small>${AT[h.at]}${h.intent ? `, ${esc(h.intent)}` : ""}</small></p>
      ${spin ? "" : `<p>${stopped ? `Stopped by ${by}.` : r.incoming[h.j]?.nodef ? "The answer to it lost, so it landed then and there." : `It got through${m ? `: ${by} against its ${h.v}` : ""}.`}</p>`}</div>${spin ? "" : swapBtn}</div>
      ${spin || stopped || picking ? "" : payView(h, r, s, c)}</li>`;
  };
  const pushes = pushesOf(c, true);
  const anyThrough = hs.some((h) => h.by == null);
  const canReroll = s.pts.Soul >= 1 && anyThrough && !paying(r);
  const offers = spin || r.pick || paying(r) ? "" : [
    ...pushes.map((p) => `<button type="button" class="button sm is-aura" data-act="push" data-a="${esc(p.arch)}"${off(s.aura < p.cost)}>${esc(p.arch)}’s Push: +${p.bonus} on a die, ${auraCost(p.cost)}</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: a point of Soul</button>` : "",
  ].join("");
  const others = otherAbilities(c);
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2><p class="cc-small">You rolled ${andList([...(r.rolled ?? []), ...(r.defName ? [esc(r.defName)] : [])])}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.mine.length)}">
    <ul class="cc-res"${spin ? ' data-act="skip"' : ""}>${r.mine.map((m, i) => `<li class="res is-${spin ? "spin" : hs.some((h) => h.by === i) ? "beat" : "none"}">${mineDie(m, i)}<span class="res-die">${m.src === "root" ? m.root : "Defend"} d${m.size}${m.plus ? ` +${m.plus}` : ""}</span>${!spin && m.nat === m.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
    ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${r.auraNote && !spin ? `<p class="cc-topnote">${esc(r.auraNote)}</p>` : ""}
    ${spin ? "" : pickNote(c, s) || payNote(c, s)}
    <ul class="cc-hits">${hs.map(row).join("")}</ul>
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    <p class="cc-small cc-left">You’ve got ${s.aura} Aura. ${glancePts(c, s)}.</p>
    ${others.length && !spin && !r.pick ? `<details class="cc-how" data-open="abil"${ui.open.has("abil") ? " open" : ""}><summary>Pay for an ability</summary>${others.map((x) => `<p><b>${esc(x.arch)}, ${esc(x.name)}:</b> ${x.html}</p><div class="cc-row"><button type="button" class="button sm is-aura" data-act="ability" data-a="${esc(x.arch)}" data-j="${x.j}"${off(s.aura < x.cost)}>Pay for ${esc(x.name)}: ${auraCost(x.cost)}</button></div>`).join("")}</details>` : ""}
    ${r.log.length && !spin ? `<details class="cc-how" data-open="how"${ui.open.has("how") ? " open" : ""}><summary>How it counted</summary><ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></details>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- abilities

// Paying for an ability, away from a roll: its price in Aura, 1 for most.
// Stand firm makes the next two hits that get through this round take 1
// point between them.
function abilityView(c, s) {
  const r = roll;
  const a = R.archetypesOf(c, DATA.build).find((x) => x.name === r.a);
  const x = a?.abilities[r.j];
  if (!x) return "";
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(x.name)}</h2><p class="cc-small">${esc(a.name)}, ${auraCost(x.cost)}</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body"><p>${x.html}</p>
    <p class="cc-small">You’ve got ${s.aura} Aura. ${ruleTip("s-abilities", "How abilities work", "ab-how")}</p>
    ${s.aura >= x.cost ? `<div class="cc-row"><button type="button" class="button is-aura" data-act="pay-way">Pay ${auraCost(x.cost)}</button></div>` : `<p class="cc-note is-warn">You need ${auraCost(x.cost)} for it, and you’ve got ${s.aura}.</p>`}</div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- the end of a scene

// At the end of every scene you rest: roll each Root that's below what it can
// hold, unsplit (Body 8 is a d12 and a d4), and get back what you roll, as
// far as it can hold, half while it's wounded. Toll drops by 1. Then Aura's
// full and conditions end.
const sceneSaid = (c, s) => `New scene. Aura ${s.aura}, ${glancePts(c, s)}.`;
function newScene() {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const s = ch.state;
  const list = R.restOf(c, s);
  if (!list.length) return change("starting a new scene", (st, cc) => {
    const was = st.toll;
    R.sceneEnd(cc, st, {});
    endScene(st, cc);
    return `${sceneSaid(cc, st)}${was ? ` Your Toll’s ${st.toll}.` : ""}`;
  });
  roll = { kind: "rest", mode: "build", list: list.map((root) => ({ root, dice: fillDice(c.roots[root]).map((size) => ({ size, nat: 0 })) })), real: false, spinning: false, log: [] };
  openDialog();
}
const restDice = (r) => r.list.flatMap((x, i) => x.dice.map((d, j) => ({ ...d, i, j })));
function restRoll(real) {
  const r = roll;
  r.real = real;
  for (const x of r.list) for (const d of x.dice) d.nat = 0;
  if (real) r.mode = "pad";
  else {
    for (const x of r.list) for (const d of x.dice) d.nat = throwDie(d.size);
    r.mode = "result";
    r.spinning = !calm();
    r.tops = restDice(r).filter((d) => d.nat === d.size).length;
  }
  renderDialog();
  if (r.spinning) spin();
  else if (!real) landed(true);
}
function restView(c, s) {
  const r = roll;
  const head = `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">End of the scene</h2><p class="cc-small">You rest before the next one.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>`;
  if (r.mode === "pad") return padView("End of the scene", restDice(r).map((d) => [`Your ${r.list[d.i].root}, a d${d.size}`, `r${d.i}.${d.j}`, d.size, d.nat]), restDice(r).every((d) => d.nat));
  const more = R.restBonus(c);
  if (r.mode === "build") {
    return `${head}<div class="dlg-body">
      <p>Roll each Root that’s below what it can hold, unsplit, and get back what you roll${more ? `, and ${more} more each with your Recovery Boon` : ""}. ${ruleTip("s-healing", "How resting works", "rs-how")}</p>
      ${r.list.map((x) => `<p class="cc-dice">${liveDice(x.dice.map((d) => [d.size, "you"]))}<span>Your ${x.root}, ${s.pts[x.root]} of ${R.capOf(c, s, x.root)}${s.wound[x.root] ? `, ${R.WOUNDS[x.root]}` : ""}</span></p>`).join("")}
      <p class="cc-small">Then it’s a new scene: Aura full, conditions gone${s.toll ? `, and your Toll drops to ${s.toll - 1}` : ""}.</p></div>
    <div class="dlg-foot"><button type="button" class="button primary" data-act="rest-go">Roll</button><button type="button" class="button" data-act="rest-real">Roll real dice</button></div>`;
  }
  const spin = r.spinning;
  const back = (x) => Math.max(0, Math.min(R.capOf(c, s, x.root) - s.pts[x.root], x.dice.reduce((t, d) => t + d.nat, 0) + more));
  return `${head}<div class="dlg-body cc-moment">
    ${r.list.map((x) => `<div class="cc-stage n${Math.min(4, x.dice.length)}"><p class="cc-rest-h"><b>Your ${x.root}</b>${spin ? "" : ` <span class="res-out">${back(x) ? `rolled ${x.dice.reduce((t, d) => t + d.nat, 0)}${more ? ` and ${more} more` : ""}, so it’s on ${s.pts[x.root] + back(x)} of ${R.capOf(c, s, x.root)}` : `it’s on ${s.pts[x.root]}, as far as it goes`}</span>`}</p>
      <ul class="cc-res"${spin ? ' data-act="skip"' : ""}>${x.dice.map((d) => `<li class="res is-${spin ? "spin" : "beat"}">${kitDie(d.size, { face: d.nat, spin, label: spin ? `Your ${x.root} d${d.size}, rolling` : `Your ${x.root} d${d.size} came up ${d.nat}`, state: !spin && d.nat === d.size ? "top" : "" })}<span class="res-die">d${d.size}</span></li>`).join("")}</ul></div>`).join("")}
    ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}
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
    const rolls = Object.fromEntries(r.list.map((x) => [x.root, x.dice.reduce((t, d) => t + d.nat, 0)]));
    const h = R.sceneEnd(c, s, rolls);
    endScene(s, c);
    const ups = R.ROOTS.filter((x) => h.healed[x]);
    message = `${sceneSaid(c, s)} ${ups.length ? `You rested: ${andList(ups.map((x) => `your ${x} got ${h.healed[x]} back`))}.` : "Nothing more fitted this time."}`;
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
  <div class="dlg-body cc-rule">${r.perm ? `<p><b>It put 1 on your ${R.ROOTS.includes(r.root) ? esc(r.root) : "Root"}</b>, and it’s a step on any roll it fits, with its Title. It does what it says for free, and going beyond that is 1 Aura.</p>` : ""}${ruleHtml(r.id)}</div>
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
  if (roll.kind === "dice") return roller.view(roll);
  const c = normal(ch);
  if (!c) return "";
  const s = ch.state;
  if (roll.kind === "downtime") return dt.view(c, s, ch, roll);
  if (roll.kind === "rest") return restView(c, s);
  if (roll.kind === "heal") return healView(c, s);
  if (roll.kind === "ability") return abilityView(c, s);
  if (roll.kind === "defence") {
    if (roll.mode === "build") return defenceBuild(c, s);
    if (roll.mode === "pad") {
      const mine = roll.pads ?? roll.mine.map((_, i) => i);
      const rows = [...mine.map((i) => [`Your ${roll.mine[i].src === "root" ? roll.mine[i].root : "Defend"}, a d${roll.mine[i].size}`, `m${i}`, roll.mine[i].size, roll.mine[i].nat]), ...(roll.padOpp ? roll.incoming.map((x, j) => [`Their d${x.d} ${AT[x.at]}${x.intent ? ` · ${esc(x.intent)}` : ""}`, `o${j}`, x.d, roll.opp[j]]) : [])];
      return padView("When it lands", rows, mine.every((i) => roll.mine[i].nat) && (!roll.padOpp || roll.opp.every(Boolean)));
    }
    return defenceResult(c, s, ch);
  }
  if (roll.mode === "build") return buildView(c, s);
  if (roll.mode === "pad") {
    const rows = roll.pads.map((i) => [`${roll.dice[i].mark ? "The Mark" : "Your"} d${roll.dice[i].size}${roll.dice[i].intent ? ` · ${esc(roll.dice[i].intent)}` : ""}`, `p${i}`, roll.dice[i].size, roll.dice[i].nat]);
    for (const j of roll.padFoes ?? []) rows.push([esc(cap(foeTag(roll, j))), `f${j}`, roll.foes[j].size, roll.foes[j].v ?? 0]);
    return padView(roll.name, rows, roll.pads.every((i) => roll.dice[i].nat) && (roll.padFoes ?? []).every((j) => roll.foes[j].v));
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

// The builder, for a new character or changing one on this phone, the crew
// included, or rebuilding one made before Roots. One of the crew becomes your
// own once a change is saved.
function builderView() {
  const ch = view.key === "new" ? null : chars().find((x) => x.id === view.key);
  if (view.key !== "new" && !canChange(ch)) return missingView(null);
  return builder.view(view.key, ch ? () => editBuild(ch) : null, ch ? { basis: basisOf(ch), crew: ch.build ? null : CREW.get(ch.crew).name, before: isBefore(ch) } : {});
}
function navBuild(key) {
  history.pushState(null, "", key && key !== "new" ? `/characters/?build=${encodeURIComponent(key)}` : "/characters/?build");
  route();
  scrollTo(0, 0);
  app.querySelector("h1")?.focus({ preventScroll: true });
}
// Saving from the builder. A new character's made with every Root full and
// Aura full. A change keeps everything in play (points, Scars, Aura, what's crossed out
// and strained), with what's crossed out or strained following a line that's
// been reworded, and one of the crew becomes your own. One built before
// Roots moves onto it the way the crew did (roots.js, fromOld), with what it
// grew then in its new build.
function saveBuilt(build, key, discard, basis) {
  const name = build.name.trim() || "Nameless";
  // What each line said when the change began, and which set actions a
  // rebuilt permission was on, only matter until it's saved.
  const clean = JSON.parse(JSON.stringify(build, (k, v) => (k === "was" || k === "bagWas" || k === "from" ? undefined : v)));
  let ch = key === "new" ? null : chars().find((x) => x.id === key);
  // They changed somewhere else while this was open (a downtime on another
  // phone or tab, say), so it starts again from them as they are now rather
  // than saving over it.
  if (ch && basis && canChange(ch) && basis !== basisOf(ch)) {
    const [, their] = PRONOUN[sheetFor(ch)?.pronoun ?? ch.build?.pronoun] ?? PRONOUN.them;
    discard();
    render();
    scrollTo(0, 0);
    app.querySelector("h1")?.focus({ preventScroll: true });
    toast(`${ch.name}’s sheet changed on another phone or tab while this was open, so your changes here weren’t saved. It starts again from ${their} sheet as it is now.`, false);
    return;
  }
  let became = false;
  const rebuilt = Boolean(ch && isBefore(ch));
  if (ch && !rebuilt && !sheetFor(ch)) ch = null;
  const isNew = !ch;
  if (ch) {
    const old = rebuilt ? null : (normal(ch), sheetFor(ch));
    const before = old ? said(old) : null;
    const s = ch.state && typeof ch.state === "object" ? ch.state : (ch.state = {});
    // One of the crew becomes your own, and stops following the chapter.
    if (!ch.build) {
      ch.from = ch.crew;
      ch.crew = "own";
      became = true;
    }
    ch.hash = "own";
    // Whatever's strained or crossed out follows a line that's been reworded.
    const move = (map, from, to) => {
      if (map && from && to && from !== to && map[from] != null && map[to] == null) {
        map[to] = map[from];
        delete map[from];
      }
    };
    for (const t of build.threads) move(s.threads, t.was, `${t.person.trim()}|${t.text.trim()}`);
    for (const [where, list] of [["equipment", build.equipment], ["utility", build.utility], ["keepsake", [build.keepsake]]]) for (const x of list) move(s.crossed, x.was, `${where}|${x.text.trim()}`);
    // A piece of armour's ticked boxes follow it too.
    if (s.boxes) for (const x of build.equipment) move(s.boxes, x.was, `equipment|${x.text.trim()}`);
    // The bag's one box of lines, so a line's only followed when none were added or taken out.
    const bagNow = bagLines(clean.bag);
    if (Array.isArray(build.bagWas) && build.bagWas.length === bagNow.length) build.bagWas.forEach((x, i) => move(s.crossed, `bag|${x}`, `bag|${bagNow[i]}`));
    ch.build = clean;
    ch.name = name;
    if (rebuilt) {
      // Their state moves onto Roots here, and what they grew is in the build now.
      normal(ch);
      ch.state.grown = [];
      delete ch.state.before;
      ch.state.aspText = "";
      ch.state.seen = said(sheetFor(ch));
    } else {
      // What they grew in downtime, and the Aspiration's words, are in the build now.
      s.grown = [];
      s.aspText = "";
      // Full Aura stays full when the sheet's maximum changes.
      const now = sheetFor(ch).numbers;
      if (s.aura === old.numbers.aura) s.aura = now.aura;
      // What they changed in the builder is theirs, so it doesn't get a gold
      // mark, and an undo from before the builder can't bring the old sheet back.
      if (s.seen) s.seen = ownChanges(s.seen, before, said(sheetFor(ch)));
    }
    for (let i = undo.length - 1; i >= 0; i--) if (undo[i].id === ch.id) undo.splice(i, 1);
  } else {
    const tag = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
    ch = { id: `own-${tag}`, crew: "own", name, made: new Date().toISOString(), hash: "own", build: clean };
    const c = sheetFor(ch);
    ch.state = { ...R.freshCore(c), seen: said(c) };
    sync.claim(ch);
    chars().push(ch);
  }
  normal(ch);
  ch.saved = new Date().toISOString();
  const kept = store.save();
  discard();
  // Someone made on the way into a campaign goes back there, picked.
  if (isNew && kept && camps.made(ch)) return;
  if (!isNew) party.soon(ch);
  history.replaceState(null, "", `/characters/?c=${encodeURIComponent(ch.id)}`);
  route();
  scrollTo(0, 0);
  const [they, their] = PRONOUN[clean.pronoun] ?? PRONOUN.them;
  toast(kept ? `${name}’s saved ${ch.acct ? "in your account" : "on this phone"}.${became ? ` ${cap(they)}${they === "they" ? "’re" : "’s"} your own now, so ${their} sheet stays as you’ve made it.` : rebuilt ? ` ${cap(they)}${they === "they" ? "’re" : "’s"} on Roots now.` : ""}` : "This phone isn’t letting the site save, so they’re gone when you close the page.", false);
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
  // The builder's full screen too, with its own bar of Back and Next at the bottom.
  document.documentElement.classList.toggle("cc-full", view.name === "sheet" || view.name === "build" || camping);
  app.innerHTML = view.name === "build" ? builderView() : view.name === "learn" ? learn.view() : view.name === "world" ? world.view(view) : camping ? camps.view(view) : view.name === "camps" ? camps.page() : view.name !== "sheet" ? listView()
    : c ? characterView(ch, c) : isBefore(ch) ? beforeView(ch, { esc, link, back: ICON.back, tools: `${soundButton()}${themeButton()}`, crew: CREW }) : missingView(ch);
  document.documentElement.classList.toggle("cc-building", Boolean(app.querySelector(".bd-foot")));
  // With the dice in a dock above the bar, a toast sits above them both.
  document.documentElement.classList.toggle("cc-docked", Boolean(app.querySelector(".bd-rail")));
  if (view.name === "build") builder.after(app);
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
  if (view.name === "learn") learn.after(app);
}

// Aura pops in as it comes back, and a Root's points light up or go dark as
// they come and go. The trackers remember what they showed last time, for
// this character.
function glow(ch) {
  // Behind the roll card nothing's seen, so it glows when the card closes.
  if (dialog.open) return;
  const s = ch?.state;
  const was = ui.seen && ui.seen.id === ch?.id ? ui.seen : null;
  ui.seen = s?.pts ? { id: ch.id, aura: s.aura, pts: { ...s.pts }, scars: R.ROOTS.map((r) => s.scars[r].length) } : null;
  if (!was || !s?.pts) return;
  const lit = (sel, from, to) => [...app.querySelectorAll(sel)].slice(from, to).forEach((el) => el.classList.add("is-new"));
  if (s.aura > was.aura) lit(".t-aura .zd-chit", was.aura, s.aura);
  R.ROOTS.forEach((r, i) => {
    const at = `.t-${r.toLowerCase()}`;
    if (s.pts[r] !== was.pts[r]) {
      app.querySelector(at)?.classList.add(s.pts[r] > was.pts[r] ? "is-up" : "is-down");
      lit(`${at} .cc-pips i`, Math.min(s.pts[r], was.pts[r]), Math.max(s.pts[r], was.pts[r]));
    }
    if (s.scars[r].length > was.scars[i]) lit(`${at} .zd-scars i`, was.scars[i], s.scars[r].length);
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
  const key = q.has("build") ? q.get("build") || "new" : null;
  const building = Boolean(key);
  const learning = !building && !id && q.has("learn");
  const camp = !building && !id && !learning ? q.get("camp") : null;
  const joining = !building && !id && !learning && !camp && q.has("join");
  // Campaigns on a page of their own, the top bar's Campaigns (Mo's 1 Nov pick).
  const listing = !building && !id && !learning && !camp && !joining && q.has("camps");
  if (view.name === "learn" && !learning) learn.stop();
  // Leaving the builder keeps the draft, and coming back reads it again.
  if (view.name === "build" && view.key !== key) builder.close();
  // A Sheet tab fold shut on one character opens as usual on another.
  if (id !== (view.name === "sheet" ? view.id : null)) ui.shut.clear();
  view = building ? { name: "build", key } : learning ? { name: "learn" } : id ? { name: "sheet", id }
    : camp ? (q.get("look") ? { name: "look", id: camp, who: q.get("look") } : q.has("world") ? { name: "world", id: camp, f: q.get("f") || "", p: q.get("p") || "", m: q.get("m") || "", pin: q.get("pin") || "", make: q.get("make") || "" } : { name: "camp", id: camp }) : joining ? { name: "join" } : listing ? { name: "camps" } : { name: "list" };
  // Characters and Campaigns are both this page, so the bar says which it is.
  for (const a of document.querySelectorAll(".topnav a[href^='/characters/']")) {
    if ((a.getAttribute("href") === "/characters/?camps") === listing) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  ui.tab = ["sheet", "rules", "party", "world"].includes(q.get("t")) ? q.get("t") : "play";
  ui.panel = null;
  ui.sure = false;
  document.documentElement.classList.toggle("cc-open", Boolean(id || building || learning || camp || joining));
  const ch = current();
  document.title = building ? `${key === "new" ? "Make your own" : "Change a character"} · Zi’Dara` : learning ? "Learn to play · Zi’Dara" : ch ? `${ch.name} · Zi’Dara` : view.name === "world" ? `${world.title(view)} · Zi’Dara` : camp || joining ? `${camps.title(view)} · Zi’Dara` : listing ? "Campaigns · Zi’Dara" : "Characters · Zi’Dara";
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
  const ch = { id, crew: crewId, name: name || c.name, made: new Date().toISOString(), hash: c.hash, state: { ...R.freshCore(c), seen: said(c) } };
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

// The end of downtime: what the slots bought goes on the sheet, everything's
// put back (every Root full, wounds and Toll cleared, roots.js downtimeRest),
// then it's a new scene, all as one change with one undo. A card with an
// empty or unfinished slot asks for a second tap first.
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
    R.downtimeRest(now, s);
    endScene(s, now);
    if (s.seen) s.seen = ownChanges(s.seen, before, said(now));
    message = `Downtime’s done. ${happened.map((x) => `${x}.`).join(" ")}`.replace(/\s+/g, " ").trim();
    return message;
  }, { say: false });
  dt.done(ch);
  closeDialog();
  toast(message || "Downtime’s done.", undo[undo.length - 1] !== last);
}

// A stepper on an open dialog: the roll card's how many dice (for any group),
// Aura on an awakening, friends and a Leader's steps, a number to beat, and a
// heal's amount and where it goes.
function stepRoll(name, i, d) {
  const r = roll;
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const s = ch.state;
  if (name === "count") {
    const g = r.groups?.[i];
    if (!g) return;
    const total = r.kind === "defence" ? R.countRoll(c, s, asRoll(g)).total : counted(r, c, s).total;
    const now = shaped(total, g, r.heal);
    g.count = clamp(now.count + d, now.fewest, now.most);
    g.shape = 0;
    return;
  }
  if (name === "awk") {
    const [key, ...rest] = String(i).split("|");
    const g = r.groups?.[key];
    const k = rest.join("|");
    if (g && k in g.awk) g.awk[k] = clamp(g.awk[k] + d, 0, 9);
    if (g) g.count = null;
    return;
  }
  if (name === "hamount") {
    r.amount = clamp(r.amount + d, 0, 99);
    r.spread = null;
    return;
  }
  if (name === "hspread") {
    const p = healPlan(c, s, r);
    r.spread = { ...Object.fromEntries(R.ROOTS.map((x) => [x, Math.min(p.room[x], p.spread[x] ?? 0)])) };
    const cur = r.spread[i] ?? 0;
    r.spread[i] = clamp(cur + d, 0, Math.min(p.room[i], cur + p.left));
    return;
  }
  const n = Number(i);
  if (name === "handed") r.handed = clamp(r.handed + d, 0, 30);
  if (name === "foe" && r.against[n]) r.against[n].n = clamp(r.against[n].n + d, 1, 30);
  if (name === "friend" && r.friends[n] != null) r.friends[n] = clamp(r.friends[n] + d, 1, 40);
  if (name !== "foe" && r.groups?.main) r.groups.main.count = null;
}

// Toggle something in a Set on the open roll, and count it again.
const flip = (set, k) => {
  if (set.has(k)) set.delete(k);
  else set.add(k);
};
const recount = () => {
  for (const g of Object.values(roll.groups ?? {})) g.shape = 0;
  renderDialog();
};

// A die picked on a roll card: rolled again, flipped, or with a Push put on
// it, paid as it goes on.
function pickDie(i) {
  const p = roll?.pick;
  if (!p) return;
  if (p.type === "flip") return change("flipping a die", (s) => {
    flipOn(typeof i === "string" ? i : [i]);
    s.last = lastOf();
  }, { say: false });
  if (typeof i === "string") return;
  if (p.type === "reroll") return reroll([i]);
  const list = roll.kind === "defence" ? roll.mine : roll.dice;
  if (!list[i] || p.type !== "push") return;
  change(`${p.arch}’s Push`, (s) => {
    if (s.aura < p.cost) return;
    s.aura -= p.cost;
    list[i].plus += p.bonus;
    roll.log.push(`Paid ${auraCost(p.cost)} for ${p.arch}’s Push: +${p.bonus} on the d${list[i].size}, so it’s ${valOf(list[i])}. A number added after the roll doesn’t pay Aura.`);
    roll.pick = null;
    afterPlus(s);
  }, { say: false });
}
// After a die's been added to, the roll's said again, and When it lands is
// matched up again, as long as nothing's been paid for yet.
function afterPlus(s) {
  if (roll.kind === "action") {
    if (roll.heal) roll.healed = roll.dice.reduce((t, d) => t + d.nat + d.plus, 0) + healBonus(normal(current()));
    s.last = lastOf();
  } else if (!paying(roll) && !roll.swapped) assignBest(roll);
}

// A point of Soul to roll again: all your dice or just one. Their dice stay
// put. It works in downtime too, where there's no Aura.
function reroll(which) {
  change("rolling again", (s, c) => {
    if (!R.spendPts(s, "Soul", 1)) return;
    const list = roll.kind === "defence" ? roll.mine : roll.dice;
    roll.pick = null;
    roll.log.push(`Paid a point of Soul to roll ${which.length === list.length && which.length > 1 ? "them all" : `the d${list[which[0]].size}`} again. Your Soul’s on ${s.pts.Soul}.`);
    for (const i of which) Object.assign(list[i], { nat: 0, plus: 0, won: false, flip: false });
    if (roll.real) {
      roll.mode = "pad";
      roll.pads = which;
      roll.padOpp = false;
      roll.padFoes = [];
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

// An ability paid for in Aura: from the play screen's own card, or from
// inside a roll. Stand firm makes the next two hits that get through take 1
// point between them, and a Gambler's flips go on the roll they're paid in.
function payAbility() {
  const inRoll = roll?.kind !== "ability";
  const p = inRoll ? roll?.pay : roll;
  const c = normal(current());
  const a = c && p ? R.archetypesOf(c, DATA.build).find((x) => x.name === p.a) : null;
  const x = a?.abilities[p.j];
  if (!x) return;
  let message = "";
  change(`paying for ${x.name}`, (s) => {
    if (s.aura < x.cost) return "";
    s.aura -= x.cost;
    if (/\bnext two hits that get through\b/i.test(x.text)) {
      s.firm = (s.firm ?? 0) + 2;
      delete s.firmPaid;
    }
    message = `Paid ${auraCost(x.cost)} for ${x.name}.${s.firm && /\bnext two hits\b/i.test(x.text) ? ` The next ${s.firm} hits that get through to you this round take 1 point between them.` : ""} Aura’s ${s.aura}.`;
    if (inRoll) {
      roll.log.push(message);
      roll.pay = null;
      if (roll.kind === "action" && roll.dice?.length) {
        if (/\bflip every die\b/i.test(x.text)) {
          flipOn(roll.dice.map((_, i) => i));
          s.last = lastOf();
        } else if (/\bflip one more die\b/i.test(x.text)) roll.pick = { type: "flip", die: null };
      }
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
  return `<div class="cc-note" role="status"><p><b>${esc(x.name)}:</b> ${x.html}</p><div class="cc-row"><button type="button" class="button sm is-aura" data-act="pay-way"${off(s.aura < x.cost)}>Pay ${auraCost(x.cost)}</button><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>`;
};

const ACT = {
  k: (el, e) => camps.act(el, e),
  tg: (el, e) => table.act(el, e),
  p: (el, e) => party.act(el, e),
  pundo: () => party.undo(),
  w: (el, e) => world.act(el, e),
  ft: (el, e) => turn.act(el, e),
  fd: (el, e) => found.act(el, e),
  dz: (el, e) => roller.act(el, e),
  wundo: () => world.undo(),
  wkundo: () => world.makeUndo(),
  b: (el, e) => builder.act(el, e, render, () => {
    scrollTo(0, 0);
    app.querySelector("h1")?.focus({ preventScroll: true });
  }),
  bopen(el, e) {
    e.preventDefault();
    // A new character with nothing in it yet starts guided, even if an empty
    // one-page sheet was opened and left.
    if (!el.dataset.key && !hasDraft()) builder.discard("new");
    navBuild(el.dataset.key || "new");
  },
  bway(el) {
    const w = el.dataset.w;
    if (hasDraft() && ui.sure !== `w:${w}`) {
      ui.sure = `w:${w}`;
      return render();
    }
    ui.sure = false;
    const c = CREW.get(w);
    if (c) builder.begin(fromCrew(c, DATA.build), "crew", c.name);
    else if (w === "random") builder.begin(randomBuild(DATA.build, DATA.crew), "random");
    else builder.begin(null, "blank");
    navBuild("new");
  },
  bdrop() {
    if (ui.sure !== true) {
      ui.sure = true;
      return render();
    }
    ui.sure = false;
    builder.discard("new");
    navBuild("new");
  },
  learn(el, e) {
    if (el.dataset.do !== "open") return learn.act(el);
    e.preventDefault();
    learn.open();
    history.pushState(null, "", "/characters/?learn");
    route();
    scrollTo(0, 0);
  },
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
    builder.discard(ch.id);
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
    delete s.stacked;
    delete s.core;
    s.seen = said(c);
    ch.hash = c.hash;
    for (const key of [...ui.open]) if (key.startsWith("g-")) ui.open.delete(key);
    return "";
  }, { say: false }),
  // Something moving onto stacking left to choose, kept as it is: a Title
  // left all 3 on one Root, or points left for later.
  choose: (el) => change("keeping it as it is", (s) => {
    const i = Number(el.dataset.i);
    if (!s.choose?.[i]) return "";
    const [x] = s.choose.splice(i, 1);
    return x.k === "spread" ? `It stays all 3 on your ${x.root}. You can spread it any time with Change.` : "They’ll wait. Spend them any time with Change.";
  }),
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
    roll = el.dataset.r === "perm" ? { kind: "rule", id: "how-permissions-stack", perm: true, text: el.dataset.t, from: el.dataset.f, root: el.dataset.root } : { kind: "rule", id: el.dataset.r };
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
    return over ? `You’ve finished acting, so the ${over} Aura over your ${R.auraMax(c, s)} is gone.` : "You’ve finished acting.";
  }),
  aura: (el) => {
    const d = Number(el.dataset.d);
    const why = el.dataset.why;
    change(d > 0 ? (why === "threat" ? "a threat falling to you" : "getting 1 Aura back") : why === "intercept" ? "intercepting for a friend" : why === "quick" ? "a quick heal for a friend" : "spending 1 Aura", (s, c) => {
      if (d > 0) return `${why === "threat" ? "It fell to you, so you get 1 Aura." : "You get 1 Aura back."}${gainAura(s, c, 1)} Aura’s ${s.aura}.`;
      if (s.aura < 1) return "";
      s.aura -= 1;
      if (why === "intercept") return `1 Aura to intercept for a friend. Their blows come at your Body instead, and your Body rolls for them when they land. Aura’s ${s.aura}.`;
      if (why === "quick") return `1 Aura and your action for a quick heal. Your friend gets a point back on one of their Roots, no roll, and no Toll. Aura’s ${s.aura}.`;
      return `Spent 1 Aura. Aura’s ${s.aura}.`;
    });
  },
  // In your element: 1 Aura at the start of a scene, even past the maximum.
  elem: () => change("being in your element", (s, c) => {
    if (s.elem || !R.boonCount(c, "In your element")) return "";
    s.elem = true;
    s.aura += 1;
    return `You’re in your element, so 1 Aura, even past your ${R.auraMax(c, s)}. Aura’s ${s.aura}.`;
  }),
  // Regen: at the end of a round, the Root that's lost most is rolled,
  // unsplit, and a top face is a point back.
  regen: () => change("your Regen", (s, c) => {
    const r = regenRoot(c, s);
    if (!r || !R.boonCount(c, "Regen")) return "";
    const dice = fillDice(c.roots[r]);
    const rolled = dice.map((d) => throwDie(d));
    const tops = rolled.filter((v, i) => v === dice[i]).length;
    if (!tops) return `Your ${r} rolled ${andList(rolled.map(String))}, and no top face, so it stays on ${s.pts[r]}.`;
    s.pts[r] = Math.min(R.capOf(c, s, r), s.pts[r] + tops);
    return `Your ${r} rolled a top face, so it’s on ${s.pts[r]}.`;
  }),
  hit: (el) => {
    const r = el.dataset.r;
    const on = el.dataset.on || null;
    if (!R.ROOTS.includes(r)) return;
    return change(on ? `a hit at your ${r}, taken on your ${on}` : `a hit at your ${r}`, (s, c) => hitAt(c, s, r, 1, on));
  },
  spend: (el) => change("spending a point", (s) => {
    const r = el.dataset.r;
    if (!R.spendPts(s, r, 1)) return "";
    return `You spend a point of ${r}, so it’s on ${s.pts[r]}.${s.pts[r] ? "" : ` The next hit there leaves you ${R.WOUNDS[r]}.`}`;
  }),
  back: (el) => change("a point back", (s, c) => backOne(c, s, el.dataset.r)),
  breath: () => change("taking a breath", (s, c) => {
    const half = Math.ceil(R.capOf(c, s, "Mind") / 2);
    if (s.pts.Mind >= half) return "";
    return `You take a breath. It takes your action. ${backOne(c, s, "Mind", half)}`;
  }),
  // A heal coming in, from the Root's panel.
  healin: () => openHeal(0, false),
  heal: (el) => openHeal(Number(el.dataset.v) || 0, el.dataset.self === "1"),
  "heal-take": () => takeHeal(),
  hother(el) {
    roll.other = el.dataset.v === "1";
    renderDialog();
  },
  hease() {
    roll.ease = roll.ease ? 0 : 1;
    roll.spread = null;
    renderDialog();
  },
  "heal-on"(el) {
    roll.heal = el.dataset.v === "1";
    roll.groups.main.count = null;
    recount();
  },
  toll: (el) => change("changing your Toll", (s) => {
    s.toll = clamp(s.toll + Number(el.dataset.d), 0, 99);
    return `Your Toll’s ${s.toll}.`;
  }),
  // The Blaze: while you're wounded, take the Scar on your own terms. It's
  // your action, and it waits for its Catch like any Scar.
  blaze: (el) => change("taking the Blaze", (s) => {
    const r = el.dataset.r;
    if (!R.blazeOn(s, r)) return "";
    s.blazing = true;
    ui.panel = null;
    return `You Blaze on your ${r}. Say something extraordinary, and it happens.`;
  }),
  unblaze: () => change("not yet", (s) => {
    if (!s.blazing) return "";
    s.blaze = null;
    delete s.blazing;
    return "Not yet, then.";
  }),
  // A moment in the story clears a wound, when the GM says so.
  unwound: (el) => change("a wound clearing", (s, c) => {
    const r = el.dataset.r;
    if (!s.wound[r]) return "";
    s.wound[r] = false;
    return `You’re not ${R.WOUNDS[r]} any more, so your ${r} heals as far as ${R.capOf(c, s, r)} again.`;
  }),
  // The GM can take a Scar away when the story's earned it: Catch and all,
  // and the point it locked comes back.
  unscar: (el) => change("a Scar taken away", (s) => {
    const r = el.dataset.r;
    const [gone] = (s.scars[r] ?? []).splice(Number(el.dataset.i), 1);
    if (gone == null) return "";
    return `${gone ? `${cap(gone)} is gone, Catch and all` : "The Scar’s gone"}, and the point it locked on your ${r} is back.`;
  }),
  die: (el) => change(el.dataset.how === "retire" ? "their retiring" : "their death", (s, c, ch) => {
    s.blaze = null;
    delete s.blazing;
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
  "rest-done": () => finishRest(),
  downtime() {
    const ch = current();
    const c = normal(ch);
    if (!c) return;
    // Downtime's card is the slots, and everything's put back when it's done.
    // A card that can't be drawn still puts everything back.
    try {
      roll = dt.start(ch);
      dt.view(c, ch.state, ch, roll);
    } catch (e) {
      console.warn(e);
      roll = null;
      return change("downtime", (s, cc) => {
        R.downtimeRest(cc, s);
        endScene(s, cc);
        return `Downtime. Every Root’s full, ${R.ROOTS.some((r) => s.scars[r].length) ? "bar what your Scars lock, " : ""}your wounds and Toll are gone, and Aura’s full.`;
      });
    }
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
  // A Root, and the roll card on it, to tap in whatever fits.
  roll: (el) => openAction({ root: el.dataset.r }),
  // Again: the last roll's Root and everything that went into it.
  again: () => {
    const p = current()?.state?.last?.picks;
    if (p) openAction({ picks: p });
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
  "pay-way": () => payAbility(),
  // A Catch, a Scar, trouble or a hostile thread biting. A big bite gets a
  // point of Soul back instead of the Aura.
  bite: (el) => {
    const big = el.dataset.big === "1";
    const ch = current();
    const c = ch && normal(ch);
    if (!c) return;
    if (big ? ch.state.pts.Soul >= R.capOf(c, ch.state, "Soul") : !ch.state.acting && ch.state.aura >= R.auraMax(c, ch.state)) return toast(big ? `A big bite. Your Soul’s on ${ch.state.pts.Soul}, as far as it goes.` : "Real trouble. Your Aura’s full, so give 1 to a friend in the scene.", false);
    change(big ? "a big bite" : "letting it bite", (s) => (big ? `A big bite. A point of Soul back: ${backOne(c, s, "Soul")}` : `Real trouble. You take 1 Aura.${gainAura(s, c)}`));
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
  // A bond thread: strain it and you get a point of Soul back, and again
  // before it's mended it snaps. A crewmate's thread is on their sheet too,
  // so they're told.
  strain: (el) => change("straining a thread", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || found.t.kind === "hostile") return "";
    const st = threadState(s, found.person, found.t);
    if (st === "snapped") return "";
    const snapped = st === "strained";
    s.threads[el.dataset.k] = snapped ? "snapped" : "strained";
    return `${snapped ? "It snaps, so it’s crossed out." : "Strained."} A point of Soul back: ${backOne(c, s, "Soul")}${tellCrew(found.person, snapped ? "crossed out" : "strained", c)}`;
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
  // A group's Root: the roll card's, or Defend's. Bringing in the Root it's
  // on now makes no sense, so that comes out.
  root(el) {
    const g = roll?.groups?.[el.dataset.g || "main"];
    if (!g || !R.ROOTS.includes(el.dataset.v)) return;
    g.root = el.dataset.v;
    delete g.bring[g.root];
    g.count = null;
    recount();
  },
  // Bringing a Root in: on, then the permission that explains it and how
  // it's paid, a point of it if it's got one, or 3 Aura.
  bring(el) {
    const g = roll?.groups?.[el.dataset.g];
    const r = el.dataset.v;
    if (!g || !R.ROOTS.includes(r) || r === g.root) return;
    if (g.bring[r]) delete g.bring[r];
    else {
      const s = current()?.state;
      g.bring[r] = { perm: "", own: "", borrow: "", pay: (s?.pts?.[r] ?? 0) >= 1 ? "pt" : "aura" };
    }
    g.count = null;
    recount();
  },
  bperm(el) {
    const b = roll?.groups?.[el.dataset.g]?.bring?.[el.dataset.r];
    if (!b) return;
    b.perm = b.perm === el.dataset.v ? "" : el.dataset.v;
    if (b.perm) {
      b.own = "";
      b.borrow = "";
    }
    renderDialog();
  },
  bpay(el) {
    const b = roll?.groups?.[el.dataset.g]?.bring?.[el.dataset.r];
    if (!b) return;
    b.pay = el.dataset.v === "aura" ? "aura" : "pt";
    renderDialog();
  },
  bborrow(el) {
    const b = roll?.groups?.[el.dataset.g]?.bring?.[el.dataset.r];
    if (!b) return;
    b.borrow = b.borrow === el.dataset.v ? "" : el.dataset.v;
    if (b.borrow) {
      b.perm = "";
      if (!b.own.trim()) b.own = `${el.dataset.v}’s permission`;
    }
    renderDialog();
  },
  // An awakening in or out of a group, 2 steps.
  awk(el) {
    const g = roll?.groups?.[el.dataset.g];
    const k = el.dataset.k;
    if (!g) return;
    if (k in g.awk) delete g.awk[k];
    else g.awk[k] = 0;
    g.count = null;
    recount();
  },
  cond(el) {
    flip(roll.conds, el.dataset.k);
    roll.groups.main.count = null;
    recount();
  },
  step(el) {
    stepRoll(el.dataset.n, el.dataset.i, Number(el.dataset.d));
    renderDialog();
  },
  "friend-on"() {
    roll.friends.push(3);
    roll.groups.main.count = null;
    recount();
  },
  "friend-off"(el) {
    roll.friends.splice(Number(el.dataset.i), 1);
    roll.groups.main.count = null;
    recount();
  },
  beyond() {
    roll.beyond = !roll.beyond;
    renderDialog();
  },
  shape(el) {
    const g = roll?.groups?.[el.dataset.g || "main"];
    if (!g) return;
    g.shape = Number(el.dataset.i);
    renderDialog();
  },
  // Something more it's up against. With dice to spare, the last die that
  // shares its target goes at the new one.
  "foe-add"(el) {
    const r = roll;
    if (!r?.against || r.against.length >= MAX_FOES) return;
    const v = el.dataset.v;
    r.against.push(v === "n" ? { die: 0, n: 4, mark: 0 } : { die: even(v, 2, 12), n: null, mark: 0 });
    const j = r.against.length - 1;
    if (j > 0) {
      const ch = current();
      const k = counted(r, normal(ch), ch.state);
      const aims = k.dice.map((_, i) => aimOf(r, i));
      for (let i = aims.length - 1; i >= 0; i--) {
        if (aims.filter((a) => a === aims[i]).length > 1) {
          r.aim[i] = j;
          break;
        }
      }
    }
    renderDialog();
  },
  "foe-del"(el) {
    const r = roll;
    const j = Number(el.dataset.j);
    if (!r?.against?.[j] || (j === 0 && r.fixed)) return;
    r.against.splice(j, 1);
    for (const [i, a] of Object.entries(r.aim)) {
      if (a === j) delete r.aim[i];
      else if (a > j) r.aim[i] = a - 1;
    }
    renderDialog();
  },
  aim(el) {
    roll.aim[el.dataset.i] = Number(el.dataset.j);
    renderDialog();
  },
  go: () => go(false),
  "go-real": () => go(true),
  pad(el) {
    const key = el.dataset.k;
    const v = Number(el.dataset.v);
    if (key[0] === "f") roll.foes[Number(key.slice(1))].v = v;
    else if (key[0] === "p") roll.dice[Number(key.slice(1))].nat = v;
    else if (key[0] === "m") roll.mine[Number(key.slice(1))].nat = v;
    else if (key[0] === "o") roll.opp[Number(key.slice(1))] = v;
    else if (key[0] === "r") {
      const [i, j] = key.slice(1).split(".").map(Number);
      if (roll.list[i]?.dice[j]) roll.list[i].dice[j].nat = v;
    }
    renderDialog();
  },
  "pad-done": () => {
    // The rest roll counts nothing until the next scene starts.
    if (roll?.kind === "rest") {
      roll.mode = "result";
      roll.tops = restDice(roll).filter((d) => d.nat === d.size).length;
      renderDialog();
      return landed(false);
    }
    change("your roll", (s, c) => {
      roll.mode = "result";
      if (roll.kind === "defence") settleDefence(s, c, roll.pads ?? null);
      else settle(s, c, roll.pads);
      roll.pads = roll.kind === "defence" ? null : [];
      roll.padOpp = false;
      roll.padFoes = [];
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
  pool(el) {
    const i = Number(el.dataset.i);
    roll.pool = { ...(roll.pool ?? {}) };
    if (el.dataset.v) roll.pool[i] = el.dataset.v;
    else delete roll.pool[i];
    renderDialog();
  },
  hid: () => change("getting into hiding", (s) => {
    const dice = roll.dice.filter((d) => !d.mark).map((d) => d.size);
    if (!dice.length || roll.pooled) return;
    // The pool starts again with the dice you hid with.
    s.pool = dice.slice(0, 12);
    roll.pooled = true;
    roll.log.push(`You’re hidden, so your ${andList(dice.map((d) => `d${d}`))} go${dice.length === 1 ? "es" : ""} in your shadow pool.`);
  }, { say: false }),
  flip() {
    if (!roll || roll.flips) return;
    roll.pick = { type: "flip", die: null };
    renderDialog();
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
    roll.pick = { type: "push", arch: p.arch, cost: p.cost, bonus: p.bonus, die: null };
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
  pick: (el) => pickDie(String(el.dataset.i).startsWith("them") ? String(el.dataset.i) : Number(el.dataset.i)),
  "reroll-all": () => reroll((roll.kind === "defence" ? roll.mine : roll.dice).map((_, i) => i)),
  "d-at"(el) {
    const x = roll.incoming[Number(el.dataset.j)];
    if (!x || x.fixed || !R.ROOTS.includes(el.dataset.v)) return;
    x.at = el.dataset.v;
    renderDialog();
  },
  "d-add-at"(el) {
    roll.add = el.dataset.v;
    renderDialog();
  },
  "d-add"(el) {
    roll.incoming.push({ d: Number(el.dataset.v), at: roll.add, intent: "", fixed: false, hits: 1 });
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
    recount();
  },
  // How many hits a telegraph is: a deadly threat's says so on it.
  "d-hits"(el) {
    const x = roll.incoming[Number(el.dataset.j)];
    if (!x || x.fixed) return;
    x.hits = clamp(el.dataset.v, 1, 9);
    renderDialog();
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
      toast("A Root’s roll only stops what’s at that Root, so those two can’t swap.", false);
      return renderDialog();
    }
    change("swapping two rolls", () => {
      [roll.assign[first], roll.assign[j]] = [roll.assign[j], roll.assign[first]];
      roll.swapped = true;
    }, { say: false });
  },
  // A hit that got through, settled one at a time: a point off its Root, a
  // box of armour there, 2 for 1 on another Root, Toughness or Stand firm,
  // or the whole telegraph as the condition it was going for, or something
  // else the GM names.
  "d-pay"(el) {
    const j = Number(el.dataset.j);
    const what = el.dataset.what;
    const label = { tough: "your Toughness taking it", hit: "a hit getting through", box: "your armour taking it", two: "2 for 1", firm: "standing firm", cond: "a condition landing", else: "what it cost" }[what] ?? "what it cost";
    change(label, (s, c) => {
      const r = roll;
      const h = r ? blocks(r)[j] : null;
      if (!h || h.by != null || !hitsLeft(r, h) || s.out || s.blaze) return;
      const root = h.at;
      // What it cost in numbers, for the live table: the state before, and
      // after, below.
      const was = { pts: { ...s.pts }, wound: { ...s.wound }, scars: scarCount(s), blaze: s.blaze };
      const add = (said, n = 1) => {
        r.done[j] = (r.done[j] ?? 0) + n;
        r.paid[j] = (r.paid[j] ? `${r.paid[j]}, ${said}` : cap(said)).slice(0, 80);
      };
      if (what === "tough") {
        if (R.boonCount(c, "Toughness") <= (s.tough ?? 0)) return;
        s.tough = (s.tough ?? 0) + 1;
        add(`${R.boonSaid(c, "Toughness")} took one`);
      } else if (what === "firm") {
        if (!(s.firm > 0)) return;
        s.firm -= 1;
        if (!s.firmPaid) {
          r.log.push(hitAt(c, s, root, 1));
          s.firmPaid = true;
          add(`stood firm, a point of ${root}`);
        } else add("stood firm, nothing");
        if (!s.firm) {
          delete s.firm;
          delete s.firmPaid;
        }
      } else if (what === "hit") {
        const said = hitAt(c, s, root, 1);
        r.log.push(said);
        add(s.blaze ? `a Scar on ${root}` : s.wound[root] && !s.pts[root] && /wound|Bloodied|Frayed|Hollow/.test(said) && !/on \d/.test(said) ? `${R.WOUNDS[root]}` : `${root} to ${s.pts[root]}`);
      } else if (what === "box") {
        // A piece of armour on that Root takes it on a box, and its last box
        // breaks it.
        const a = pieceAt(c, el.dataset.k);
        if (!a || leftOf(s, a) < 1 || (a.root ?? "Body") !== root) return;
        const n = tickBox(s, a);
        add(n >= a.boxes ? `${yours(a)} took one and broke` : `${yours(a)} took one`);
      } else if (what === "two") {
        const on = el.dataset.on;
        const said = hitAt(c, s, root, 1, on);
        if (/hasn’t got/.test(said)) return;
        add(`2 for 1, ${on} to ${s.pts[on]}`);
      } else if (what === "cond") {
        const x = condOf(r.incoming[j].intent);
        if (!x || R.shrugs(c, x.name) || r.done[j]) return;
        s.conditions = s.conditions.filter((y) => y.name !== x.name);
        s.conditions.push({ name: x.name, die: r.incoming[j].d, kind: "against" });
        add(`${x.name} d${r.incoming[j].d} on you`, hitsLeft(r, h));
      } else if (what === "else") {
        if (r.done[j]) return;
        add("something else, the GM’s call", hitsLeft(r, h));
      }
      const x = (r.cost ??= [])[j] ??= { lost: {}, box: 0, wound: "", scar: "" };
      for (const k of R.ROOTS) {
        const n = was.pts[k] - s.pts[k];
        if (n > 0) x.lost[k] = (x.lost[k] ?? 0) + n;
        if (s.wound[k] && !was.wound[k]) x.wound = k;
      }
      if (what === "box") x.box += 1;
      const now = scarCount(s);
      const scarred = R.ROOTS.find((k) => now[k] > was.scars[k]) ?? (s.blaze && s.blaze !== was.blaze ? s.blaze : "");
      if (scarred) x.scar = scarred;
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
  // A Scar they live through: a Catch in their words on that Root, locking a
  // point of it for good, and they leave the scene.
  if (kind === "scar") {
    const text = String(f.get("scar") ?? "").trim().slice(0, 80);
    change("taking a Scar", (s, c) => {
      const r = s.blaze;
      if (!r || !R.takeScar(c, s, r, text)) return "";
      delete s.blazing;
      return `You leave the scene with a Scar on your ${r}${text ? `, ${text}` : ""}. It locks a point of it for good, so it holds ${R.capOf(c, s, r)} now.${text ? " Let it bite whenever you like, for 1 Aura." : ` Write it in as a Catch on your ${r}’s panel.`}`;
    });
    return;
  }
  if (kind === "scar-text") {
    const text = String(f.get("text") ?? "").trim().slice(0, 80);
    const t = form.dataset.r;
    const i = Number(form.dataset.i);
    if (text && R.ROOTS.includes(t)) change("writing a Scar in", (s) => {
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
    const max = where === "bag" ? c.carry.bag?.max ?? 10 : (ROOM[where] ?? 0) + (where === "utility" ? c.numbers.kit ?? 0 : 0);
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
    const ch = current();
    const c = ch ? normal(ch) : null;
    if (kindOf === "against" && c && R.shrugs(c, name)) return toast(`${name} can’t touch you, with ${R.boonSaid(c, "Conditions")}.`, false);
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
        if (!R.ROOTS.includes(root) || !c.titles[t] || R.slotsOf(c.titles[t]) >= R.MAX_PERMS) return "";
        s.grown.push({ k: "perm", t, text: g.text, root });
        said = `${cap(g.text)} is back on ${c.titles[t].text ?? c.titles[t].name}, on your ${root}.`;
      } else if (g.k === "att") {
        const a = Number(get("a")) || 0;
        if (!c.attuned[a]) return "";
        if (g.up) s.grown.push({ k: "stage", a, to: R.STAGES[Math.min(2, R.STAGES.indexOf(c.attuned[a].stage) + 1)], catch: g.catch || "", burden: g.burden || "" });
        if (g.text) s.grown.push({ k: "awk", a, name: String(g.text).slice(0, 80), root: R.ROOTS.includes(get("aroot")) ? get("aroot") : R.bestRoot(c), text: get("does") || g.text, catch: g.up ? "" : g.catch || "", burden: g.up ? "" : g.burden || "" });
        said = `${g.text ? cap(g.text) : "Its stage"} is back on ${lower(c.attuned[a].name)}.`;
      } else if (g.k === "title") {
        if (!R.ROOTS.includes(root)) return "";
        const perm = g.perm && R.ROOTS.includes(get("proot")) ? { text: g.perm, root: get("proot") } : null;
        s.grown.push({ k: "title", text: g.text, roots: { Body: 0, Mind: 0, Soul: 0, [root]: R.TITLE_ROOTS }, perm });
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
  if (key === "foe-mark" && roll?.against) {
    const t = roll.against[Number(el.dataset.j)];
    if (!t) return;
    t.mark = SIZES.includes(Number(el.value)) ? Number(el.value) : 0;
    renderDialog();
  } else if (key === "asp-text") {
    const ch = current();
    if (!ch) return;
    ch.state.aspText = el.value.trim();
    persist();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.dataset?.bin) return builder.input(e.target);
  if (e.target.dataset?.tg != null && ["tele", "tg-el", "tg-else"].includes(roll?.kind)) return table.input(e.target, roll);
  if (e.target.dataset?.ft != null && String(roll?.kind).startsWith("ft-")) return turn.input(e.target, roll);
  if (e.target.dataset?.dt != null && roll?.kind === "downtime") return dt.input(e.target, roll);
  // A permission in the player's own words brings a Root in, without the
  // card being drawn again, so the keyboard stays where it is.
  if (e.target.dataset?.in === "bown" && roll?.groups) {
    const b = roll.groups[e.target.dataset.g]?.bring?.[e.target.dataset.r];
    if (!b) return;
    b.own = e.target.value.slice(0, 80);
    if (b.own.trim()) b.perm = "";
    for (const el of dialog.querySelectorAll(`[data-act="bperm"][data-g="${e.target.dataset.g}"][data-r="${e.target.dataset.r}"]`)) {
      el.classList.replace("is-in", "is-out");
      el.setAttribute("aria-pressed", "false");
    }
    const ch = current();
    const c = normal(ch);
    const short = roll.kind === "defence" ? defencePool(c, ch.state, roll).short : counted(roll, c, ch.state).short;
    for (const btn of dialog.querySelectorAll('.dlg-foot [data-act="go"], .dlg-foot [data-act="go-real"], .dlg-foot [data-act="d-go"], .dlg-foot [data-act="d-real"]')) btn.disabled = Boolean(short) || (roll.kind === "defence" && !roll.incoming.length);
    const warn = dialog.querySelector(".dlg-foot .cc-warn");
    if (warn && !short) warn.remove();
    return;
  }
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
  if (key.startsWith("bd-")) builder.toggled(e.target);
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
// Closing the page mid-build keeps the draft.
addEventListener("pagehide", () => builder.flush());
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
// From the home page: one of the crew to play (?play=vesk), or a way in to
// make your own (?way=random or ?way=blank), the same as tapping it on the
// list. The address goes back to the list first, so a reload or Back doesn't
// do it again.
const asked = new URLSearchParams(location.search);
const playing = asked.get("play");
const way = asked.get("way");
if (playing != null || way != null) history.replaceState(null, "", "/characters/");
route();
if (CREW.has(playing)) ACT.play({ dataset: { c: playing } });
else if (way === "random" || way === "blank") {
  ACT.bway({ dataset: { w: way } });
  // With a draft on the go, its button asks for a second tap first, so show it.
  if (view.name === "list") app.querySelector(`[data-act="bway"][data-w="${way}"]`)?.scrollIntoView({ block: "center" });
}
sync.pull();
