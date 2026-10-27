// The character companion: one of the six crew on your phone, saved on the
// phone and working offline. Every number on a sheet comes from the current
// rules (the JSON the build puts in the page), and only what the player
// changes in play is saved (store.js). Views are HTML strings, and one click
// handler reads data-act. Every change goes through change(), so it saves,
// redraws and can be undone.
import { SIZES, diceLabel, diceRange, diceShapes, rollDie, sizeDown, sizeUp, stepsToDice } from "./dice.js";
import { openStore } from "./store.js";
import { makeSync } from "./sync.js";
import { foldGrown, hasDraft, makeBuilder, normalBuild, sheetOf } from "./builder.js";
import { fromCrew, randomBuild } from "./ways.js";
import { printSheet } from "./print.js";
import { calm, feel, setSound, soundOn, tumble } from "./feel.js";
import { makeLearn } from "./learn.js";
import { grow } from "./grow.js";
import { changesOf, ownChanges, placesOf, said } from "./marks.js";
import { makeDowntime } from "./downtime.js";
import { makeCampaigns } from "./campaigns.js";
import { makeParty } from "./party.js";
import { makeTable } from "./table.js";
import { makeWorld } from "./world.js";
import { threadKey, threadLabel, threadPlace, threadState } from "./threads.js";
import { boxesSaid, isBroken, itS, keyOf, leftOf, nameOf, pieceAt, piecesOf, setTicked, standing, tick as tickBox, tickedOf, yours } from "./armour.js";
import { aura as kitAura, boxes as kitBoxes, crest, die as kitDie, grow as growDie, mini as kitMini, pips as kitPips, plate as kitPlate, resolve as kitResolve, scars as kitScars } from "../kit/kit.js";

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
const INTENTS = { action: ["Hurt", "Pin", "Disarm"], blows: ["Hurt", "Pin", "Disarm"], confidence: ["Frighten", "Taunt"] };
// Five Scars and you're scarred out: the wound die never goes below d12.
const MAX_SCARS = 5;

let view = { name: "list" };
let roll = null; // whatever the open dialog is working on
const ui = { panel: null, tab: "play", open: new Set(), shut: new Set(), toastTimer: 0, stopSpin: null, notesTimer: 0, mode: null, slide: null, reveal: false, seen: null };
const undo = [];

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
};

const builder = makeBuilder({ B: DATA.build, link, icon: ICON, rule: (id) => ruleHtml(id), toast: (m, u) => toast(m, u), onLeave: (key) => nav(key && key !== "new" ? key : ""), onSave: saveBuilt, roll: () => randomBuild(DATA.build, DATA.crew), tools: () => themeButton() });

// ---------------------------------------------------------------- characters

const learn = makeLearn({ crew: CREW, esc, hex, steps, rules: RULE, ruleHtml: (id) => ruleHtml(id), isOpen: (key) => ui.open.has(key), lineOf: (c, key) => lineOf(c, key), lineLabel: (l) => lineLabel(l), throwDie, feel, tumble, calm, icon: ICON, sound: () => soundButton(), render: () => render(), gauge: (wound, floor, fresh) => gauge(wound, floor, fresh ? floor : wound) });

const dt = makeDowntime({ B: DATA.build, esc, hex, steps, link, icon: ICON, lineLabel: (l) => lineLabel(l), throwDie, crewNames: () => new Set(DATA.crew.map((x) => x.name)), isOpen: (key) => ui.open.has(key), rule: (id) => ruleHtml(id) });

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
  // A character's set actions, as the answer picker shows them.
  actions: (ch, c) => c.actions.map((a, i) => ({ i, name: a.name, says: `${steps(stepsNow(c, ch.state, a))} · ${diceLabel(stepsToDice(stepsNow(c, ch.state, a)))}`, dice: stepsToDice(stepsNow(c, ch.state, a)).map((d, j) => kitDie(d, { hide: true, cls: j ? "is-next" : "" })).join("") })),
  answer: (i, tele) => openAction(i, tele),
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
  sync, esc, W: DATA.worlds, icon: ICON,
  list: () => camps.list(),
  campaign: (id) => camps.campaign(id),
  campOf: (ch) => party.campOf(ch),
  crewIn: (id) => party.crewIn(id),
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

// Campaigns: starting one, joining one from its link, and the GM's look at
// her players' characters, drawn with the same pieces as a character here.
const camps = makeCampaigns({
  party,
  table,
  world,
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
    link: (id, text) => link(id, text), steps: (n) => steps(n), crestOf: (c) => crestOf(c), stepsNow: (c, s, a) => stepsNow(c, s, a), lineOf: (c, key) => lineOf(c, key),
    lineLabel: (l) => lineLabel(l), isOut: (s, l) => isOut(s, l), lastRollView: (last) => lastRollView(last), isOpen: (key) => ui.open.has(key),
  },
});

const chars = () => store.data.characters;
const current = () => (view.name === "sheet" ? chars().find((x) => x.id === view.id) ?? null : null);

// Where a character starts: everything full, nothing written in yet. The
// wound die is how hurt they are, d2 to d12, and each Scar is a Catch in
// words. shrugged counts the Hurts this scene that didn't move the wound die
// (Unyielding's first Hurt).
function fresh(c) {
  const n = c.numbers;
  return {
    aura: n.aura, resolve: n.resolve, conf: n.confidence,
    wound: n.wound ?? 2, scars: [], shrugged: 0, blaze: false, dead: false,
    conditions: [], threads: {}, used: {}, crossed: {}, boxes: {}, picked: [],
    asp: c.aspiration.die, aspText: "", notes: "", last: null,
  };
}

// A character saved before 24 Oct 2026 had a Hurt track: boxes filled one a
// Hurt, a Catch written in each full bar, and Scars crossing boxes out for
// good. Every Hurt they'd taken puts the wound die up a size now, each Scar
// is a Scar still (its Catch to write in), and the bars' Catches go into
// Notes in their own words, since the Hurt track's gone. The Armour die's
// gone too: armour's a line on Defend.
function fromHurtTrack(raw, s) {
  const scars = Math.min(MAX_SCARS, Math.max(0, Math.round(Number(raw.scars) || 0)));
  s.scars = Array.from({ length: scars }, () => "");
  let wound = 2 + 2 * scars;
  for (let i = 0; i < Math.max(0, Math.round(Number(raw.hurt) || 0)); i++) wound = sizeUp(wound);
  s.wound = wound;
  const catches = (Array.isArray(raw.catches) ? raw.catches : []).map((x) => String(x ?? "").trim()).filter(Boolean);
  if (catches.length) s.notes = `${String(s.notes ?? "").trim()}${String(s.notes ?? "").trim() ? "\n" : ""}From the old Hurt track: ${catches.join(", ")}.`;
}
const floorOf = (s, c) => Math.min(12, (c.numbers.wound ?? 2) + 2 * Math.min(MAX_SCARS, s.scars.length));

// Fill in anything missing and keep every number inside what the sheet allows
// now, in case the rules changed since this was saved.
// A character built on this phone carries its build, and its sheet's made from
// that against the current rules. The crew's come straight off the chapter.
// What they've grown in downtime goes on top (grow.js).
const grownSheets = new Map();
function sheetFor(ch) {
  const base = ch?.build ? sheetOf(ch, DATA.build) : CREW.get(ch?.crew) ?? null;
  const list = ch?.state?.grown;
  if (!base || !Array.isArray(list) || !list.length) return base;
  const json = JSON.stringify(list);
  const hit = grownSheets.get(ch.id);
  if (hit && hit.base === base && hit.json === json) return hit.sheet;
  const sheet = grow(base, list, DATA.build);
  grownSheets.set(ch.id, { base, json, sheet });
  return sheet;
}

// Changing a character starts from their build, or from a crew member's sheet
// made into one that keeps everything, with what they've grown in downtime and
// the Aspiration's words written in. Each thread and thing they carry
// remembers what it said, so whatever's strained or crossed out follows it if
// it's reworded. basisOf() says when any of that has changed, so a change
// that was left part way starts again rather than losing it.
function editBuild(ch) {
  const crew = !ch.build && CREW.get(ch.crew);
  if (!ch.build && !crew) return null;
  const base = ch.build ? normalBuild(ch.build) : fromCrew(crew, DATA.build, { keep: true });
  base.name = ch.name;
  const b = foldGrown(base, ch.state?.grown, DATA.build);
  if (ch.state?.aspText) b.aspiration = String(ch.state.aspText).slice(0, 160);
  for (const t of b.threads) if (t.person.trim() && t.text.trim()) t.was = `${t.person.trim()}|${t.text.trim()}`;
  for (const [where, list] of [["equipment", b.equipment], ["utility", b.utility], ["keepsake", [b.keepsake]]]) for (const x of list) if (x.text.trim()) x.was = `${where}|${x.text.trim()}`;
  b.bagWas = bagLines(b.bag);
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

function normal(ch) {
  const c = ch && sheetFor(ch);
  if (!c) return null;
  const n = c.numbers;
  const raw = ch.state && typeof ch.state === "object" ? ch.state : {};
  const s = Object.assign(fresh(c), raw);
  if (!Number.isFinite(Number(raw.wound)) && ("hurt" in raw || "catches" in raw || typeof raw.scars === "number")) fromHurtTrack(raw, s);
  for (const old of ["hurt", "catches", "armour"]) delete s[old];
  s.aura = clamp(s.aura, 0, n.aura);
  s.resolve = clamp(s.resolve, 0, n.resolve);
  s.conf = even(s.conf, 2, 12);
  s.scars = (Array.isArray(s.scars) ? s.scars : []).slice(0, MAX_SCARS).map((x) => String(x ?? "").slice(0, 80));
  s.wound = even(s.wound, floorOf(s, c), 12);
  s.shrugged = clamp(s.shrugged, 0, 6);
  s.blaze = Boolean(s.blaze);
  s.asp = even(s.asp, 2, 12);
  s.dead = Boolean(s.dead);
  s.conditions = (Array.isArray(s.conditions) ? s.conditions : []).filter((x) => x && x.name).map((x) => ({ name: String(x.name), die: even(x.die, 2, 12), kind: x.kind === "for" ? "for" : "against" }));
  s.picked = (Array.isArray(s.picked) ? s.picked : []).filter((p) => p && p.name && ["equipment", "utility", "bag"].includes(p.where));
  for (const key of ["threads", "used", "crossed", "boxes"]) if (!s[key] || typeof s[key] !== "object") s[key] = {};
  // Boxes ticked on a piece of armour that's still on their sheet and hasn't
  // broken. A broken one's crossed out instead (armour.js).
  for (const [k, v] of Object.entries(s.boxes)) {
    const a = pieceAt(c, k);
    if (!a || s.crossed[k] || !(Number(v) >= 1)) delete s.boxes[k];
    else s.boxes[k] = Math.min(a.boxes - 1, Math.round(Number(v)));
    if (s.boxes[k] === 0) delete s.boxes[k];
  }
  // A thread in play is strained, snapped, or whole again after the sheet said strained.
  for (const [k, v] of Object.entries(s.threads)) if (!["strained", "snapped", "whole"].includes(v)) delete s.threads[k];
  s.grown = (Array.isArray(s.grown) ? s.grown : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  if (s.seen && typeof s.seen !== "object") delete s.seen;
  s.last = lastRoll(s.last);
  ch.state = s;
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
  const message = fn(ch.state, c, ch);
  noteTable(ch.state);
  if (JSON.stringify(ch.state) === before && snapRoll() === rollBefore) return;
  undo.push({ id: ch.id, label, state: before, roll: rollBefore });
  if (undo.length > 60) undo.shift();
  persist();
  render();
  // A Hurt gets a thud, and the one that takes the wound die to d12, or Blazes, a heavier one.
  const was = JSON.parse(before);
  const now = ch.state;
  if ((now.blaze && !was.blaze) || (now.wound === 12 && was.wound < 12)) feel.heavy();
  else if (now.wound > was.wound || now.shrugged > (was.shrugged ?? 0)) feel.hurt();
  if (say && !dialog.open) toast(message || `Done: ${label}.`, true);
}

// A roll answering a telegraph, or When it lands for ones that landed, is
// written into the character with the change that rolled it (table.js), so
// it goes to the GM, and an Undo takes it back from her too.
function noteTable(s) {
  const r = roll;
  if (!r || r.mode !== "result" || r.pick) return;
  if (r.kind === "action" && r.tele) {
    // It's an answer while it's against the telegraph's die, or the number the GM rolled for it.
    const answered = r.opp != null && r.dice.length > 0 && (r.vs === r.tele.d || r.vs === -1);
    table.record(s, r.tele.camp, "a", r.tele.id, answered ? { act: r.name, steps: r.total, dice: r.dice.map((x) => ({ size: x.size, total: x.nat + x.plus, out: outcome(x) })), opp: r.opp, real: Boolean(r.real) } : null);
  }
  if (r.kind === "defence" && r.camp && r.teles?.some(Boolean)) {
    for (const h of blocks(r)) {
      const id = r.teles[h.j];
      if (id) table.record(s, r.camp, "d", id, { on: r.against === "blows" ? "Defend" : "Confidence", stopped: h.by != null, mine: h.mine, v: h.v, paid: r.paid[h.j] || "", real: Boolean(r.real) });
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

function gainAura(s, c, n = 1) {
  const room = c.numbers.aura - s.aura;
  s.aura += Math.min(room, n);
  return n > room ? ` Your Aura’s full, so give ${n - room} to a friend in the scene.` : "";
}
function gainResolve(s, c, n = 1) {
  const room = c.numbers.resolve - s.resolve;
  s.resolve += Math.min(room, n);
  return n > room ? " Your Resolve’s already full." : "";
}

// The learning round's wound die, as a row of five, d4 to d12, one for each
// Hurt it can take before a Hurt at d12 Blazes. The ones under a Scar are
// crossed through, and any that lit up since was glow. (A character's own
// wound die is a kit die that grows, on the play screen.)
const WOUNDS = [4, 6, 8, 10, 12];
const gauge = (wound, floor, was = wound) => `<span class="mini" aria-hidden="true">${WOUNDS.map((d) => `<i${d <= floor && floor > 2 ? ' class="x"' : d <= wound ? ` class="on${d > was ? " is-new" : ""}"` : ""}></i>`).join("")}</span>`;

// A Hurt puts the wound die up a size, and a Hurt at d12 Blazes. Unyielding
// (or anything else that says so) keeps the first Hurt each scene from moving
// it. A vulnerability makes one hit more than one Hurt, so n can be bigger.
// Every size the wound die goes up takes Confidence down a size. On d2 it's
// got nowhere lower to go, and the Hurt's already the cost, so nothing more
// happens.
function takeHurt(s, c, n = 1) {
  const before = s.wound;
  const conf = s.conf;
  let shrugged = 0;
  let up = 0;
  for (let i = 0; i < n && !s.blaze; i++) {
    if (s.shrugged < (c.numbers.shrug ?? 0)) {
      s.shrugged += 1;
      shrugged += 1;
    } else if (s.wound >= 12) s.blaze = true;
    else {
      s.wound = sizeUp(s.wound);
      up += 1;
    }
  }
  for (let i = 0; i < up; i++) s.conf = sizeDown(s.conf);
  const shaken = s.conf < conf ? ` Your Confidence drops to d${s.conf}.` : up ? " Your Confidence is on d2 already." : "";
  const trait = c.numbers.woundNote ? ` (${c.numbers.woundNote.split(":")[0].trim()})` : "";
  const first = shrugged ? `Your first Hurt this scene doesn’t move your wound die${trait}, so your Confidence doesn’t move either. ` : "";
  if (s.blaze) return `${first}A Hurt at d12, so you Blaze.${shaken}`;
  if (s.wound === before) return `${first}It stays a d${s.wound}.`;
  return `${first}You take a Hurt, and your wound die’s a d${s.wound} now.${s.wound === 12 ? " The next one Blazes." : ""}${shaken}`;
}
// A heal, a quick heal or cashing in fired-up Confidence: down a size, never below the Scars.
function healOne(s, c) {
  const floor = floorOf(s, c);
  if (s.wound <= floor) return `Your wound die’s at d${floor}${s.scars.length ? ", and your Scars keep it there" : ""}.`;
  s.wound = sizeDown(s.wound);
  return `Your wound die comes down to d${s.wound}.`;
}

// The end of a scene: Aura's full, 1 Resolve back, Confidence back to where it
// starts, conditions end, once-per-scene traits reset and so does Unyielding's
// first Hurt. The rest roll comes first (restView). A Blaze that's still
// waiting stays until the player chooses.
function endScene(s, c) {
  s.aura = c.numbers.aura;
  gainResolve(s, c, 1);
  s.conf = c.numbers.confidence;
  s.conditions = [];
  s.used = {};
  s.shrugged = 0;
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

function listView() {
  const mine = chars();
  const draft = hasDraft();
  const saved = (ch) => {
    const c = sheetFor(ch);
    const s = ch.state || {};
    return `<li><a class="card cc-saved" href="/characters/?c=${encodeURIComponent(ch.id)}" data-act="nav" data-id="${esc(ch.id)}">
      <span class="die" aria-hidden="true">${esc((ch.name || "?").slice(0, 1))}</span>
      <span class="cc-saved-text"><b>${esc(ch.name)}</b>
      <small>${c ? `${ch.build ? "Your own" : esc(c.name)}${c.title ? ` · <em>${esc(c.title)}</em>` : ""}` : "This sheet isn’t in the rules any more"}</small>
      ${c ? `<small>Aura ${esc(s.aura ?? c.numbers.aura)} · Resolve ${esc(s.resolve ?? c.numbers.resolve)} · Confidence d${esc(s.conf ?? c.numbers.confidence)}</small>` : ""}</span></a></li>`;
  };
  // The other ways in start a new character, so with a draft on the go they
  // ask for a second tap first.
  const way = (w, label) => `<button type="button" class="button" data-act="bway" data-w="${esc(w)}">${ui.sure === `w:${w}` ? `Tap again to bin ${esc(draft?.name || "your draft")}` : label}</button>`;
  const crew = (c) => `<article class="card">
    <div class="art"><span class="die" aria-hidden="true">${esc(c.name.slice(0, 1))}</span></div>
    <div class="body"><h3>${esc(c.name)}</h3><p class="title">${esc(c.title)}</p>
      <div class="chips">${c.archetypes.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>
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
const ruleBox = (id) => `<div class="cc-rule">${ruleHtml(id)}</div>`;

// The trackers on the play screen, as the kit draws them: Confidence and the
// wound die are dice that change shape as they move, with their size written
// big beside them and the Scars beside the wound die, and Aura and Resolve are
// hexes and gems. Tap one for its buttons and its rule.
const quiet = (html) => html.replace('role="img"', 'aria-hidden="true"');
function trackView(ch, c, s) {
  const n = c.numbers;
  const u = lastUndo(ch);
  const stat = (key, label, body) => `<button type="button" class="cc-stat t-${key}${ui.panel === key ? " is-open" : ""}${goldOf(`num:${key}`) ? " is-changed" : ""}" data-act="panel" data-p="${key}" aria-expanded="${ui.panel === key}" aria-controls="cc-panel"><span class="k">${label}${goldDot(`num:${key}`)}</span>${body}</button>`;
  const mood = s.conf <= 2 ? '<span class="cc-mood">Shaken</span>' : s.conf >= 12 ? '<span class="cc-mood is-fired">Fired up</span>' : "";
  const conds = s.conditions.length
    ? `<span class="v cc-conds-now">${s.conditions.map((x) => `<span class="cc-tag is-${x.kind}">${kitMini(x.die, { own: x.kind === "for" ? "you" : "harm" })}<em>${esc(x.name)}</em> d${x.die}</span>`).join("")}</span>`
    : '<span class="v cc-none">None on you</span>';
  return `<div class="cc-track" role="group" aria-label="Confidence, your wound die, Aura, Resolve and conditions">
    ${stat("conf", "Confidence", `${kitDie(s.conf, { hide: true, bare: true })}<span class="cc-now"><span class="v">d${s.conf}</span>${mood}</span>`)}${stat("wound", "Wound die", `${kitDie(s.wound, { own: "harm", hide: true, bare: true })}<span class="cc-now"><span class="v">d${s.wound}</span>${kitScars(s.scars.length)}</span>`)}
    <button type="button" class="cc-undo" data-act="undo"${off(!u)} aria-label="${u ? `Undo ${esc(u.label)}` : "Nothing to undo"}">${ICON.undo}<span aria-hidden="true">Undo</span></button>
    ${stat("aura", "Aura", `<span class="cc-row-in">${quiet(kitAura(s.aura, n.aura))}<span class="v">${s.aura}<small>/${n.aura}</small></span></span>`)}${stat("resolve", "Resolve", `<span class="cc-row-in">${quiet(kitResolve(s.resolve, n.resolve))}<span class="v">${s.resolve}<small>/${n.resolve}</small></span></span>`)}
    ${stat("cond", "Conditions", conds)}
  </div>${ui.panel ? `<div id="cc-panel" class="cc-panel">${goldNow(`num:${ui.panel}`)}${panelView(ui.panel, c, s)}</div>` : ""}`;
}

// A row of dice to set one straight to a size, each in its real shape, with
// the one it's on now lit up.
function ring(act, from, to, now, label) {
  const own = act === "wound-set" ? "harm" : "you";
  return `<div class="cc-ring" role="group" aria-label="${label}">${SIZES.filter((d) => d >= from && d <= to).map((d) => `<button type="button" class="cc-ringbtn" data-act="${act}" data-v="${d}"${pressed(d === now)}>${kitDie(d, { own, label: `d${d}`, state: d === now ? "top" : "" })}</button>`).join("")}</div>`;
}

function panelView(key, c, s) {
  const n = c.numbers;
  if (key === "aura") {
    // A Guardian intercepts for free, so there's nothing to pay.
    const free = c.archetypeRules.some((a) => a.name === "Guardian");
    // Intercept takes blows and other physical telegraphs, never fear.
    const physical = "It’s only for blows and other physical telegraphs, because nobody can step in front of fear, lies or pressure.";
    return `<p><b>Aura ${s.aura} of ${n.aura}.</b></p>
      <div class="cc-row"><button type="button" class="button" data-act="aura" data-d="-1"${off(s.aura < 1)}>Spend 1</button><button type="button" class="button" data-act="aura" data-d="1">Get 1 back</button>${free ? "" : `<button type="button" class="button" data-act="aura" data-d="-1" data-why="intercept"${off(s.aura < 1)}>Intercept for a friend: 1 Aura</button>`}</div>
      ${free ? `<p class="cc-lead">You intercept for free, for every friend within your stride. ${physical} ${link("s-intercept", "Intercept")}</p>` : `<p class="cc-lead">Intercepting takes the dice aimed at a friend within your stride, and they come at you instead. It’s 1 Aura for each friend, and no action. ${physical} ${link("s-intercept", "Intercept")}</p>`}${ruleBox("s-aura")}`;
  }
  if (key === "resolve") {
    return `<p><b>Resolve ${s.resolve} of ${n.resolve}.</b></p>
      <div class="cc-row"><button type="button" class="button" data-act="resolve" data-d="-1"${off(s.resolve < 1)}>Spend 1</button><button type="button" class="button" data-act="resolve" data-d="1">Get 1 back</button></div>${ruleBox("s-resolve")}`;
  }
  if (key === "conf") {
    const start = `d${n.confidence}${n.confidenceNote ? ` (${esc(n.confidenceNote)})` : ""}`;
    const mood = s.conf <= 2 ? '<p class="cc-note is-warn"><b>You’re shaken.</b> You can’t take an action at what the scene’s about unless you spend 1 Resolve to do it. Otherwise your action goes on pulling yourself together, and that brings you back up to d4.</p>'
      : s.conf >= 12 ? '<p class="cc-note"><b>You’re fired up.</b> Cash it in for an extra action, or to step your wound die down a size, and it drops back to d6.</p>' : "";
    return `<p><b>Confidence d${s.conf}.</b> It starts every scene on ${start}${n.dressed ? `, or d${n.dressed.die} in ${esc(n.dressed.what)} when they fit the scene` : ""}, and the phone moves it as you roll and get hurt.</p>${mood}
      ${ring("conf", 2, 12, s.conf, "Confidence")}
      <div class="cc-row">
        ${n.dressed && s.conf === n.confidence ? `<button type="button" class="button" data-act="conf" data-v="${n.dressed.die}">Dressed for it: d${n.dressed.die}</button>` : ""}
        ${s.conf <= 2 ? '<button type="button" class="button" data-act="breath">Pull yourself together: back to d4</button>' : s.conf < 6 ? '<button type="button" class="button" data-act="breath">Take a breath: up to d6</button>' : ""}
        ${s.conf >= 12 ? `<button type="button" class="button" data-act="cash" data-how="action">Cash it in for an extra action</button><button type="button" class="button" data-act="cash" data-how="heal"${off(s.wound <= floorOf(s, c))}>Cash it in: wound die down a size</button>` : ""}
      </div>${ruleBox("s-confidence")}`;
  }
  if (key === "wound") {
    const floor = floorOf(s, c);
    const trait = n.woundNote ? ` (${esc(n.woundNote.split(":")[0].trim())})` : "";
    const shrug = n.shrug ? `<p>${n.shrug > 1 ? `The first ${n.shrug} Hurts` : "The first Hurt"} you take each scene ${n.shrug > 1 ? "don’t" : "doesn’t"} move it${trait}. ${s.shrugged >= n.shrug ? "You’ve had it this scene, so the next one moves it." : "You haven’t taken it yet this scene."}</p>` : "";
    const scars = s.scars.map((x, i) => `<li class="cc-item">${x ? `<p><em>${esc(x)}</em> <small>a Scar</small></p><div class="cc-row"><button type="button" class="button sm" data-act="unscar" data-i="${i}">The story’s taken it away</button></div>`
      : `<form class="cc-form" data-form="scar-text" data-i="${i}"><label class="cc-field">Write this Scar in as a Catch, like <em>a spear through the shoulder</em> <input name="text" maxlength="80" autocomplete="off" required></label><button type="submit" class="button sm">Write it in</button></form>`}</li>`).join("");
    return `<p><b>Wound die d${s.wound}.</b> It starts at d2${floor > 2 ? `, and with ${s.scars.length === 1 ? "your Scar" : `${s.scars.length} Scars`} it never goes below d${floor}` : ""}. Every Hurt puts it up a size, and a Hurt at d12 Blazes. It’s the die a heal has to beat, too.</p>${shrug}
      ${ring("wound-set", floor, 12, s.wound, "Wound die")}
      <div class="cc-row"><button type="button" class="button" data-act="hurt" data-d="1">Take a Hurt</button><button type="button" class="button" data-act="hurt" data-d="-1"${off(s.wound <= floor)}>Heal: down a size</button><button type="button" class="button" data-act="quickheal"${off(s.wound <= floor || s.aura < 1)}>Quick heal: 1 Aura</button></div>
      <p class="cc-lead">At the end of every scene you rest: New scene rolls your Confidence against it, and a win brings it down a size. Downtime clears it to d${floor}.</p>
      ${s.scars.length ? `<h3 class="cc-h3">Scars</h3><ul class="cc-list">${scars}</ul>` : ""}
      ${s.scars.length >= MAX_SCARS ? '<p class="cc-note is-warn">Five Scars, so you’re scarred out. Your wound die never goes below d12, and your next Blaze is your last.</p>' : ""}${ruleBox("s-blaze")}`;
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

// What can't wait: a Blaze. The wound becomes a Scar, a Catch in the
// player's words, unless they choose for their character to die. With five
// Scars it's the last one.
function alertView(ch, c, s) {
  if (!s.blaze) return "";
  const last = s.scars.length >= MAX_SCARS;
  return `<form class="cc-form cc-note is-warn" data-form="scar" role="alert"><p><b>You Blaze.</b> Declare something extraordinary and it happens, no roll. From your very first Blaze you can choose for your character to die.${last ? " With five Scars, this Blaze is your last." : " If you don’t, they leave the scene, and the wound becomes a Scar."}</p>
    ${last ? "" : `<label class="cc-field">The wound, as a Catch, like <em>a spear through the shoulder</em> or <em>can’t stand the dark</em> <input name="scar" maxlength="80" autocomplete="off"></label><p class="cc-lead">Your wound die drops back to d${Math.min(12, floorOf(s, c) + 2)}, and it never goes below that.</p>`}
    <div class="cc-row">${last ? "" : '<button type="submit" class="button primary">Take the Scar and leave the scene</button>'}<button type="button" class="button" data-act="die">${esc(ch.name)} dies</button></div></form>`;
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

// A character on the phone: the play screen first, and the rest of the sheet
// and the rules a tab away.
function characterView(ch, c) {
  const s = ch.state;
  const n = c.numbers;
  // What changes their wound die, like Bram's Unyielding, is named here, and
  // the wound die's own buttons say what it does.
  const facts = [`Stride ${n.stride}${n.strideNote ? ` (${esc(n.strideNote)})` : ""}${gold("num:stride")}`, ...(n.woundNote ? [esc(n.woundNote.split(":")[0].trim())] : [])];
  const changed = changedNote(ch, c);
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
    <p class="cc-small">${ch.name !== c.name ? `${esc(c.name)}’s sheet, from the crew · ` : ""}${c.archetypes.map(esc).join(" · ")}${c.archetypes.length ? " · " : ""}${facts.join(" · ")}</p></div>${was("num:stride")}</header>
  ${saveNote()}${changed}
  ${s.dead ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} died in play.</b> Keep the sheet to remember them, or delete them from this phone at the bottom of the Sheet tab.</p></div>` : ""}
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

// The character's crest: the Zi'Dara diamond with their first Title's
// archetype in it, doubled for one taken twice, and a seal for a second.
function crestOf(c) {
  try {
    return crest(c.titles.map((t) => t.archetype).filter(Boolean), { strict: false, label: `Crest: ${c.archetypes.join(", ") || "no archetype yet"}` });
  } catch {
    return "";
  }
}

// Changing anything on a character, any time, outside downtime too.
const changeLink = (ch) => (canChange(ch) ? `<a class="button cc-change" href="/characters/?build=${encodeURIComponent(ch.id)}" data-act="bopen" data-key="${esc(ch.id)}">Change ${esc(ch.name)}</a>` : "");

function playTab(ch, c) {
  const s = ch.state;
  // Something broken or used up comes off every set action it's on, until it's mended.
  // Each tile shows the dice it rolls, drawn in their real shapes, and past 6
  // steps the next die sits on the first one's shoulder.
  const diceOf = (n, own = "you") => stepsToDice(n).map((d, j) => kitDie(d, { own, hide: true, cls: j ? "is-next" : "" })).join("");
  const tiles = c.actions.map((a, i) => {
    const now = stepsNow(c, s, a);
    return `<button type="button" class="tile card${goldOf(`act:${a.name}`) ? " is-changed" : ""}${now < a.steps ? " is-short" : ""}" data-act="roll" data-a="${i}"><span class="tile-dice" aria-hidden="true">${diceOf(now)}</span><span class="tile-name">${esc(a.name)}</span><span class="tile-says"><span class="tile-steps">${steps(now)}${now < a.steps ? ` <small>${a.steps - now} crossed out</small>` : ""}</span> · <span class="tile-die">${esc(diceLabel(stepsToDice(now)))}</span>${goldDot(`act:${a.name}`)}</span></button>`;
  }).join("");
  const defend = stepsNow(c, s, defendOf(c));
  // What landed on them at the end of a round in their campaign, waiting on this.
  const landed = table.landedFor(ch);
  const owed = landed ? landed.incoming.length + landed.more : 0;
  return `${table.playCard(ch)}${trackView(ch, c, s)}${alertView(ch, c, s)}
  <section class="cc-sec cc-play" aria-labelledby="cc-actions"><h2 id="cc-actions" class="sr-only">Set actions</h2>
    <div class="cc-tiles">${tiles}<button type="button" class="tile card tile-defend${owed ? " is-owed" : ""}" data-act="defence"><span class="tile-dice" aria-hidden="true">${diceOf(defend)}</span><span class="tile-name">When it lands</span><span class="tile-sub">${owed ? `${owed === 1 ? "One’s" : `${cap(["", "", "two", "three", "four", "five", "six"][owed] || String(owed))} have`} landed on ${esc(ch.name)} · ` : ""}Defend ${esc(diceLabel(stepsToDice(defend)))} · Confidence d${s.conf}</span></button></div>
    ${lastRollView(s.last)}
    <div class="cc-row cc-scene"><button type="button" class="button" data-act="scene">New scene</button><button type="button" class="button" data-act="downtime">Downtime</button>${changeLink(ch)}</div>
  </section>`;
}

const lower = (name) => name.replace(/^(A|An|The|His|Her|Their) /, (m) => m.toLowerCase());

// A permission's a button: tap it to read how permissions work.
const permButton = (text, from, id = "") => `<li><button type="button" class="cc-perm" data-act="rule" data-r="perm" data-t="${esc(text)}" data-f="${esc(from)}"><em>${esc(text)}</em></button>${id ? `${gold(id)}${was(id)}` : ""}</li>`;

function sheetTab(ch, c) {
  const s = ch.state;
  const at = placesOf(c);
  const her = c.pronoun === "him" ? "his" : c.pronoun === "her" ? "her" : "their";
  const titles = c.titles.map((t, i) => `<article class="card cc-card"><p class="eyebrow">${ORD[i] ?? ""} Title · ${t.archetypeId ? link(t.archetypeId, esc(t.archetype)) : esc(t.archetype)}${gold(`title:${at.titles[i]}`)}</p>${was(`title:${at.titles[i]}`)}
    <h3><em>${esc(t.name)}</em></h3><ul class="cc-perms">${t.permissions.map((p, j) => permButton(p.text, `${her} ${(ORD[i] ?? "").toLowerCase()} Title, ${t.name}`, `perm:${at.titles[i]}:${at.perms[i][j]}`)).join("")}</ul></article>`).join("");
  const archetypes = c.archetypeRules.map((a) => `<div class="cc-arch"><p><b>${a.id ? link(a.id, esc(a.name)) : esc(a.name)}${a.times > 1 ? `, taken ${a.times === 2 ? "twice" : `${a.times} times`}` : ""}.</b> ${a.summary}${gold(`arch:${a.name}`)}</p>${was(`arch:${a.name}`)}
    ${a.auraHtml ? `<p><b>1 Aura:</b> ${a.auraHtml}</p><button type="button" class="button sm" data-act="arch-aura" data-n="${esc(a.name)}"${off(s.aura < 1)}>Spend 1 Aura on it</button>` : ""}
    ${a.resolveHtml ? `<p><b>1 Resolve:</b> ${a.resolveHtml}</p><button type="button" class="button sm" data-act="arch-resolve" data-n="${esc(a.name)}"${off(s.resolve < 1)}>Spend 1 Resolve on it</button>` : ""}</div>`).join("");

  const traits = c.traits.map((t, i) => {
    const once = /once per scene/i.test(t.type);
    const used = Boolean(s.used[t.name]);
    return `<div class="cc-item"><p><b>${esc(t.name)}</b> <span class="chip sm">${esc(t.type)}</span>${once && used ? ' <span class="chip sm is-used">Used this scene</span>' : ""}${gold(`trait:${at.traits[i]}`)}</p>${was(`trait:${at.traits[i]}`)}<p>${t.html}</p>
      ${t.aura ? `<button type="button" class="button sm" data-act="trait-aura" data-n="${esc(t.name)}"${off(once && used)}>Take ${t.aura} Aura</button>` : once ? `<button type="button" class="button sm" data-act="used" data-n="${esc(t.name)}"${pressed(used)}>${used ? "Used this scene" : "Use it"}</button>` : ""}</div>`;
  }).join("");

  const thing = (where, name, i = -1) => {
    const key = `${where}|${name}`;
    const out = Boolean(s.crossed[key]);
    // A piece of armour has its quality, and a box to tap for every blow it
    // can take. Tapping the piece itself breaks it or mends it outright.
    const a = where === "equipment" && i < 0 ? pieceAt(c, key) : null;
    if (a) {
      const ticked = tickedOf(s, a);
      const marks = Array.from({ length: a.boxes }, (_, j) => `<button type="button" class="cc-box" data-act="box" data-k="${esc(key)}" data-n="${j + 1}"${pressed(j < ticked)} aria-label="${esc(cap(name))}, box ${j + 1} of ${a.boxes}">${kitPlate(j < ticked)}</button>`).join("");
      return `<li class="cc-thing-row cc-armour"><button type="button" class="cc-thing${out ? " is-out" : ""}" data-act="cross" data-k="${esc(key)}"${pressed(out)} aria-label="${esc(nameOf(c, where, name))}: ${out ? "broken, tap to mend it" : `${boxesSaid(s, a)}, tap to break it`}"><span>${esc(name)}</span><small>${esc(a.quality)}${out ? ", broken" : ""}</small></button><span class="cc-boxes" role="group" aria-label="${esc(cap(name))}’s boxes, ${ticked} of ${a.boxes} ticked">${marks}</span></li>`;
    }
    return `<li class="cc-thing-row"><button type="button" class="cc-thing${out ? " is-out" : ""}" data-act="cross" data-k="${esc(key)}"${pressed(out)} aria-label="${esc(name)}: ${out ? "crossed out, tap to bring it back" : "tap to cross it out"}"><span>${esc(name)}</span>${out ? "<small>crossed out</small>" : ""}</button>${i >= 0 ? `<button type="button" class="cc-x sm" data-act="drop" data-i="${i}" aria-label="Take ${esc(name)} off the sheet">${ICON.close}</button>` : ""}</li>`;
  };
  const picked = (where) => s.picked.map((p, i) => ({ ...p, i })).filter((p) => p.where === where);
  const slot = (where, title) => {
    const own = where === "bag" ? c.carry.bag.items ?? [] : c.carry[where].items;
    const extra = picked(where);
    const max = where === "bag" ? c.carry.bag.max : c.carry[where].max;
    const note = where === "bag" ? "" : c.carry[where].note;
    return `<div class="cc-slot"><h3>${title} <small>${own.length + extra.length} of ${max}</small>${gold(`kit:${where}`)}</h3>${was(`kit:${where}`)}
      ${note && !extra.length ? `<p class="cc-lead">${esc(note[0].toUpperCase() + note.slice(1))}.</p>` : ""}
      <ul class="cc-things">${own.map((x) => thing(where, x)).join("")}${extra.map((p) => thing(where, p.name, p.i)).join("")}</ul></div>`;
  };
  const attuned = c.attuned.map((a, i) => `<div class="cc-item"><p><b>${esc(a.name)}</b>${a.props ? ` (${esc(a.props)})` : ""} ${a.stage ? `<span class="chip sm">${esc(a.stage)}</span>` : ""}${gold(`att:${i}`)}</p>${was(`att:${i}`)}
    <ul class="cc-perms">${a.permissions.map((p, j) => permButton(p.text, `${lower(a.name)}, attuned`, `att:${i}:${at.attuned[i][j]}`)).join("")}</ul>${a.catch ? `<p>Its Catch: <em>${esc(a.catch)}</em></p>` : ""}${a.burden ? `<p>Its Burden: <em>${esc(a.burden)}</em></p>` : ""}</div>`).join("");

  // In a campaign, a thread with someone else in it is on both their phones,
  // and one that's only on the other sheet shows here too, in their words.
  const pt = party.threadsOf(ch, c);
  const crewNames = new Set(DATA.crew.map((x) => x.name));
  const inCrew = (person) => (pt ? pt.mate(person) : crewNames.has(person));
  const people = allThreads(ch, c, pt);
  const threads = people.map((p) => `<div class="cc-person"><h3>${esc(p.person)}${inCrew(p.person) ? ' <small>in the crew</small>' : ""}</h3><ul>${p.threads.map((t, j) => threadRow(p, t, t.theirs ? `x${j}` : at.threads[p.person]?.[j] ?? `x${j}`, s)).join("")}</ul></div>`).join("");

  const bites = [
    ...c.attuned.filter((a) => a.catch).map((a) => ({ text: a.catch, from: `the Catch on ${lower(a.name)}` })),
    ...s.scars.filter(Boolean).map((x) => ({ text: x, from: "a Scar" })),
    ...c.trouble.map((x) => ({ text: x, from: `trouble that follows ${c.pronoun}` })),
  ].map((b) => `<li class="cc-item"><p><em>${esc(b.text)}</em> <small>${esc(b.from)}</small></p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Let ${esc(b.text)} bite: +1 Aura">Let it bite: +1 Aura</button><button type="button" class="button sm" data-act="bite" data-big="1" aria-label="A big bite from ${esc(b.text)}: +1 Resolve">A big bite: +1 Resolve</button></div></li>`).join("");

  // The sheet at a glance, then the detail. Every part of it is a fold whose
  // summary reads at a glance, with its buttons a tap away. A fold holding a
  // line the rules have changed opens by itself, until it's closed.
  const marks = Object.keys(ui.gold?.marks ?? {});
  const marked = (...pre) => marks.some((k) => pre.some((p) => k === p || k.startsWith(`${p}:`)));
  const fold = (key, title, glance, body, golden = false) => {
    const id = `sh-${key}`;
    const open = !ui.shut.has(id) && (ui.open.has(id) || golden);
    return `<details class="cc-fold" data-open="${id}"${open ? " open" : ""}><summary><h2 class="cc-fold-t">${title}${golden ? '<span class="cc-gem" aria-hidden="true"></span><span class="sr-only">, changed in the rules</span>' : ""}</h2>${glance ? `<span class="cc-fold-g">${glance}</span>` : ""}</summary><div class="cc-fold-b">${body}</div></details>`;
  };
  const few = (items, max) => (items.length > max ? `${items.slice(0, max).join(" · ")} <small>and ${items.length - max} more</small>` : items.join(" · "));
  const diceAt = (n) => `<span class="cc-act-dice" aria-hidden="true">${stepsToDice(n).map((d, j) => kitDie(d, { hide: true, cls: j ? "is-next" : "" })).join("")}</span>`;

  // Each set action with its dice, and a pip for every line on it, the action
  // included. Something crossed out is struck through until it's mended.
  const acts = c.actions.map((a) => {
    const now = stepsNow(c, s, a);
    const lines = a.lines.map((key) => lineOf(c, key)).filter(Boolean);
    return `<li class="cc-act">${diceAt(now)}<div class="cc-act-in"><p><b>${esc(a.name)}</b> <small>${steps(now)}, ${esc(diceLabel(stepsToDice(now)))}${now < a.steps ? `, ${a.steps - now} crossed out` : ""}</small>${gold(`act:${a.name}`)}</p>${was(`act:${a.name}`)}
      <ul class="cc-act-lines">${lines.map((l) => `<li${isOut(s, l) ? ' class="is-out"' : ""}>${kitPips(1)}<span>${isOut(s, l) ? `<s>${lineLabel(l)}</s>` : lineLabel(l)}</span></li>`).join("")}<li>${kitPips(1)}<span>${lines.length ? "The action" : "The action on its own, with nothing on it yet"}</span></li></ul></div></li>`;
  }).join("");

  // What each fold says while it's shut.
  const actsAt = c.actions.map((a) => {
    const now = stepsNow(c, s, a);
    return `<span class="cc-gl">${kitMini(stepsToDice(now)[0])}<b>${esc(a.name)}</b> <small>${esc(diceLabel(stepsToDice(now)))}</small></span>`;
  }).join("");
  const titlesAt = c.titles.map((t) => `<span class="cc-gl-line"><em>${esc(t.name)}</em> <small>${esc(t.archetype)} · ${t.permissions.length} ${t.permissions.length === 1 ? "permission" : "permissions"}</small></span>`).join("");
  const carried = [...c.carry.equipment.items.map((x) => ["equipment", x]), ...c.carry.utility.items.map((x) => ["utility", x]), ...(c.carry.keepsake ? [["keepsake", c.carry.keepsake]] : []), ...(c.carry.bag.items ?? []).map((x) => ["bag", x]), ...s.picked.map((p) => [p.where, p.name])]
    .map(([where, x]) => (s.crossed[`${where}|${x}`] ? `<s>${esc(nameOf(c, where, x))}</s>` : esc(nameOf(c, where, x))));
  const threadsAt = people.map((p) => {
    const states = p.threads.map((t) => ({ t, st: threadState(s, p.person, t) }));
    const hostile = states.some((x) => x.t.kind === "hostile");
    const worst = states.find((x) => x.st === "snapped") ?? states.find((x) => x.st === "strained");
    return `${esc(p.person)}${hostile || worst ? ` <small>${[hostile ? "hostile" : "", worst ? worst.st : ""].filter(Boolean).join(", ")}</small>` : ""}`;
  });
  const bitesAt = [...c.attuned.filter((a) => a.catch).map((a) => a.catch), ...s.scars.filter(Boolean), ...c.trouble].map((x) => `<em>${esc(x)}</em>`);
  const notesAt = String(s.notes ?? "").trim().split("\n")[0];

  const changeBtn = canChange(ch) ? changeLink(ch) : "";
  return `<div class="cc-changebar">${changeBtn ? `<p class="cc-lead">Add a Title, rewrite a permission or change anything else on ${her} sheet, whenever you like.</p>` : ""}<div class="cc-row">${changeBtn}<button type="button" class="button" data-act="print"${off(ui.printing)}>${ui.printing ? "Filling in the sheet…" : "Print the sheet"}</button></div></div>
  <div class="cc-folds">
  ${fold("acts", "Set actions", `<span class="cc-gl-wrap">${actsAt}</span>`, `<p class="cc-lead">Every line on a set action is a step, and the action’s one more. ${link("s-set-actions", "How set actions work")}</p><ul class="cc-acts">${acts}</ul>`, marked("act"))}
  ${fold("titles", c.titles.length === 1 ? "Title and permissions" : "Titles and permissions", titlesAt, `<p class="cc-lead">Tap a permission to see how it counts.</p>${titles}
    <h3 class="cc-h3">${c.archetypeRules.length > 1 ? "Your archetypes" : "Your archetype"}</h3>${archetypes}`, marked("title", "perm", "arch"))}
  ${c.traits.length ? fold("traits", "Traits", few(c.traits.map((t) => esc(t.name)), 6), traits, marked("trait")) : ""}
  ${fold("kit", "Kit", `${few(carried, 7)}${c.attuned.length ? `<span class="cc-gl-line"><small>Attuned:</small> ${c.attuned.map((a) => esc(a.name)).join(" · ")}</span>` : ""}`, `${slot("equipment", "Equipment")}${slot("utility", "Utility")}
    ${c.carry.keepsake ? `<div class="cc-slot"><h3>Keepsake${gold("kit:keepsake")}</h3>${was("kit:keepsake")}<ul class="cc-things">${thing("keepsake", c.carry.keepsake)}</ul></div>` : ""}
    ${slot("bag", `The bag <span class="cc-small">(${esc(c.carry.bag.name)})</span>`)}
    <form class="cc-form" data-form="pickup"><label class="cc-field">Pick something up <input name="what" maxlength="60" autocomplete="off"></label>
      <label class="cc-field">It goes in <select name="where"><option value="bag">the bag</option><option value="utility">utility</option><option value="equipment">equipment</option></select></label>
      <button type="submit" class="button">Add it</button></form>
    <p class="cc-lead">Tap a thing to cross it out when it breaks or gets used up, and it comes off your set actions until it’s mended. ${piecesOf(c).length ? "Your armour ticks a box for every blow it takes for you, and breaks when the last one goes. " : ""}Your attuned things are magic, and they can’t be broken. ${link("s-armour-quality", "How armour’s boxes work")}</p>
    ${c.attuned.length ? `<h3 class="cc-h3">Attuned</h3>${attuned}` : ""}`, marked("kit", "att"))}
  ${fold("threads", "Threads", few(threadsAt, 5) || "None yet", `<p class="cc-lead">A bond thread’s something good between you. Borrow one of their permissions through it for 1 Aura, or lean on them in the story and strain it for 1 Resolve. You can’t borrow through a strained one, and straining it again before it’s mended snaps it.</p>
    <p class="cc-lead">A hostile thread’s something that’s gone bad, and it bites like a Catch. Doing right by them strains it, and doing right by them again snaps it. ${pt ? `A thread with someone in the crew is on both your sheets, and in ${esc(pt.name)} it’s on both your phones too, so straining it, mending it or snapping it on one does it on the other.` : "A thread with someone in the crew is on both your sheets, so tell them when it changes."} ${link("s-bonds", "How threads work")}</p>
    ${threads}`, marked("thr"))}
  ${fold("trouble", "Catches and trouble", few(bitesAt, 3) || "Bring real trouble on yourself for 1 Aura", `<p class="cc-lead">Let one bite and bring real trouble into the scene, and you take 1 Aura. A big bite that changes the scene or costs you something you wanted pays 1 Resolve instead. Your hostile threads bite the same way, from Threads.</p>${goldOf("trouble") ? `<p>${gold("trouble", "The trouble that follows you changed in the rules")}</p>${was("trouble")}` : ""}
    <ul class="cc-list">${bites}<li class="cc-item"><p>Nothing here fits? Bring real trouble on yourself in the story anyway.</p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Real trouble with no Catch: +1 Aura">+1 Aura</button></div></li></ul>`, marked("trouble"))}
  ${fold("asp", "Aspiration", `<span class="cc-gl">${kitMini(s.asp)}<em>${esc(s.aspText || c.aspiration.text)}</em> <small>d${s.asp}</small></span>`, `${goldOf("asp") ? `<p>${gold("asp", "Its words changed in the rules")}</p>${was("asp")}` : ""}
    <label class="cc-field"><span class="sr-only">Your Aspiration</span><input class="cc-plain" data-in="asp-text" maxlength="120" value="${esc(s.aspText || c.aspiration.text)}" autocomplete="off"></label>
    ${ring("asp-set", 2, 12, s.asp, "Aspiration")}
    <div class="cc-row"><button type="button" class="button" data-act="asp" data-d="-1"${off(s.asp <= 2)}>A setback</button><button type="button" class="button" data-act="asp" data-d="1">It climbs</button></div>
    <p class="cc-lead">When the GM says it’s within reach, roll against its die, and if you beat it, it climbs. ${link("s-aspiration", "How Aspiration works")}</p>
    <details class="cc-rulebox" data-open="asp-good"${ui.open.has("asp-good") ? " open" : ""}><summary>What makes a good Aspiration</summary><div class="cc-rule">${ruleHtml("s-good-aspiration")}</div></details>`, marked("asp"))}
  ${fold("notes", "Notes", notesAt ? esc(notesAt.length > 70 ? `${notesAt.slice(0, 68)}…` : notesAt) : "Nothing written yet", `<label class="sr-only" for="cc-notes">Notes</label><textarea id="cc-notes" data-in="notes" rows="5">${esc(s.notes)}</textarea>`)}
  ${fold("about", `About ${esc(c.name)}`, esc(c.blurb.length > 90 ? `${c.blurb.slice(0, 88)}…` : c.blurb), `<p>${esc(c.blurb)}</p><p><b>Plays like:</b> ${c.playsLike}</p>
    ${c.crewQs.map((x) => `<p><em>${esc(x.q)}</em> ${esc(x.a)}</p>`).join("")}
    ${c.own ? `<p class="cc-lead">${CREW.has(ch.from) ? `Your own now, made from ${link("s-pregens", `${esc(CREW.get(ch.from).name)}’s sheet in the rules`)}.` : `Built on this phone, from the ${link("s-quick", "Quick Build")}.`}</p>` : `<p class="cc-lead">${link("s-pregens", `${esc(c.name)}’s sheet in the rules`)}. Change ${esc(ch.name)} at the top of this tab and ${c.pronoun === "him" ? "he’s" : c.pronoun === "her" ? "she’s" : "they’re"} your own.</p>`}
    <p class="cc-lead">Print, at the top of this tab, fills in the two-page sheet from the <a href="/sheets/">Sheets page</a> with everything here as it stands now.</p>
    <div class="cc-row"><button type="button" class="button danger" data-act="delete">Delete ${esc(ch.name)} from this phone</button></div>`)}
  </div>`;
}

// A character's threads by bond, and in a campaign the ones that are only on
// someone else's sheet with them, under the same name.
function allThreads(ch, c, pt = party.threadsOf(ch, c)) {
  if (!pt?.extra.length) return c.threads;
  const out = c.threads.map((p) => ({ ...p, threads: [...p.threads] }));
  for (const x of pt.extra) {
    const p = out.find((y) => y.person === x.person);
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
// from bond to hostile, and what you can do with it. A bond thread lends a
// permission for 1 Aura while it's whole, and strains for 1 Resolve. A
// hostile thread bites like a Catch, and doing right by them strains it.
function threadRow(p, t, place, s) {
  const key = threadKey(p.person, t);
  const st = threadState(s, p.person, t);
  const id = `thr:${p.person}:${place}`;
  const bond = t.kind !== "hostile";
  const who = esc(p.person);
  const b = (act, label, extra = "", no = false) => `<button type="button" class="button sm" data-act="${act}" data-k="${esc(key)}"${extra}${off(no)}>${label}</button>`;
  const buttons = st === "snapped" ? []
    : bond ? (st === "strained"
      ? [b("strain", "Strain it again: it snaps, +1 Resolve"), b("mend", "Mended")]
      : [b("tborrow", "Borrow a permission: 1 Aura", ` aria-label="Borrow one of ${who}’s permissions: 1 Aura"`, s.aura < 1), b("strain", "Strain it: +1 Resolve")])
    : [b("bite", "It brought trouble: +1 Aura", ` data-big="0" aria-label="Your thread with ${who} brought real trouble: +1 Aura"`), b("bite", "A big bite: +1 Resolve", ` data-big="1" aria-label="A big bite from your thread with ${who}: +1 Resolve"`),
      b("right", st === "strained" ? "Did right by them again: it snaps" : "Did right by them: it strains"), ...(st === "strained" ? [b("wrong", "Wronged them again: it’s whole")] : [])];
  const at = threadPlace(t, st);
  const scale = `<span class="cc-scale" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < 2 ? "is-bond" : i > 2 ? "is-hostile" : "is-neutral"}${i === at ? " on" : ""}"></i>`).join("")}</span>`;
  return `<li class="cc-thread is-${bond ? "bond" : "hostile"} is-${st}"><p><em>${esc(t.text)}</em>${t.whose ? ` <small>(${esc(t.whose)} words)</small>` : ""}${gold(id)}</p>${was(id)}
    <p class="cc-thread-st"><span class="chip sm">${threadLabel(t, st)}</span>${scale}</p>
    ${buttons.length ? `<div class="cc-row">${buttons.join("")}</div>` : ""}</li>`;
}

// The rules a player reaches for mid-round, straight from the book and kept
// in the page, so they read with no signal.
const RULE_GROUPS = [
  ["The round", ["s-round", "s-telegraphs", "s-answering"]],
  ["Rolling", ["s-the-roll", "s-intents", "s-splitting", "s-going-beyond", "s-teamwork", "s-extra-actions"]],
  ["Your numbers", ["s-aura", "s-resolve", "s-confidence"]],
  ["When it lands", ["s-defending", "s-defend", "s-intercept", "s-armour", "s-armour-quality", "s-consequences", "s-fear-gets-through"]],
  ["Wounds", ["s-blaze", "s-healing", "s-vulnerable"]],
  ["Everything else", ["s-conditions", "s-bonds", "s-trouble", "s-aspiration", "s-good-aspiration"]],
  ["Downtime", ["your-slots", "s-downtime-rolls"]],
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

const lineOf = (c, key) => c.lines.find((l) => l.key === key);
const lineLabel = (l) => (l.kind === "title" ? `Title: <em>${esc(l.label)}</em>` : l.kind === "permission" ? `<em>${esc(l.label)}</em>` : l.kind === "attuned" ? `<em>${esc(l.label)}</em> <small>${esc(l.item)}</small>` : esc(l.label));
const lineName = (l) => (l.kind === "attuned" ? `${lower(l.item)} (${l.label})` : l.kind === "title" ? `your Title, ${l.label}` : l.label);
// Something you carry that's crossed out (broken, or used up) isn't a line
// on anything until it's mended. Attuned things can't break.
const isOut = (s, l) => Boolean(l && l.kind === "kit" && Object.keys(s.crossed).some((x) => s.crossed[x] && x.endsWith(`|${l.label}`)));
const outOn = (c, s, a) => a.lines.filter((key) => isOut(s, lineOf(c, key)));
const stepsNow = (c, s, a) => a.steps - outOn(c, s, a).length;
// Every sheet has Defend. One that's lost it (an old build, say) defends on the action alone.
const defendOf = (c) => c.actions.find((a) => a.name === "Defend") ?? { name: "Defend", steps: 1, die: "d2", lines: [] };

// tele: the telegraph it's answering (table.js), whose die it's up against.
function openAction(i, tele = null) {
  openRoll({ kind: "action", mode: "build", a: i, off: new Set(), in: new Set(), borrow: new Set(), other: 0, conds: new Set(), friends: [], handed: 0, extra: -1, via: "resolve", beyond: false, count: null, shape: 0, vs: tele ? tele.d : 0, vsRolled: 4, mark: 0, dice: [], opp: null, oppSize: 0, log: [], pick: null, pads: [], padOpp: false, spinning: false, intents: {}, owns: new Set(), confFrom: null, tele });
}
// A dialog that's open already turns over to the next one.
function openRoll(r) {
  roll = r;
  if (dialog.open) renderDialog(false);
  else openDialog();
}

// Through a bond thread that's whole you can borrow one of their permissions,
// or one of a faction's assets, for 1 Aura. A strained or snapped thread
// lends nothing, and nor does a hostile one.
// In a campaign that includes a thread that's only on the other one's sheet.
const lendersOf = (c, s) => [...new Set(allThreads(current(), c).filter((p) => p.threads.some((t) => t.kind !== "hostile" && threadState(s, p.person, t) === "whole")).map((p) => p.person))];
const borrowedIn = (c, s, r) => [...(r.borrow ?? [])].filter((p) => lendersOf(c, s).includes(p));
function borrowGroup(c, s, r) {
  const lenders = lendersOf(c, s);
  if (!lenders.length) return "";
  return `<h3>Through a bond thread</h3>${lenders.map((p) => `<button type="button" class="cc-line is-aura" data-act="borrow" data-k="${esc(p)}"${pressed(r.borrow.has(p))}><span class="tick" aria-hidden="true"></span><span>Borrow from ${esc(p)} <small>one of their permissions, or a faction’s asset</small></span></button>`).join("")}`;
}

// What a roll does to your Confidence once it's in: up a size when one of
// your dice beat what it was rolled against, down a size when every die
// missed, and nothing when there was nothing to beat. It counts once for the
// action, however many dice won, and it goes on top of the Confidence the
// roll started from, so winning a tie or rolling again moves it again.
function swingOf(r) {
  if (r.opp == null || !r.dice.length || r.dice.some((d) => !d.nat)) return 0;
  return r.dice.some((d) => ["beat", "won"].includes(outcome(d))) ? 1 : -1;
}
// It never goes below d2 or past d12: a miss on d2 leaves it on d2.
function swingRoll(s) {
  const r = roll;
  if (r.confFrom == null) r.confFrom = s.conf;
  const d = swingOf(r);
  s.conf = d > 0 ? sizeUp(r.confFrom) : d < 0 ? sizeDown(r.confFrom) : r.confFrom;
}

// How Confidence moved, and why: where it started, where it is, a line for
// every move.
function swingBlock(from, to, lines, extra = "") {
  const dir = to > from ? " is-up" : to < from ? " is-down" : "";
  return `<div class="cc-swing${dir}"><p class="cc-swing-head"><span class="k">Confidence</span>${kitDie(from, { label: `d${from}`, cls: to === from ? "" : "is-was" })}${to === from ? "" : `<span class="cc-swing-to" aria-hidden="true">→</span><span class="sr-only">to</span>${kitDie(to, { label: `d${to}` })}`}</p>
    ${lines.length ? `<ul>${lines.map((l) => `<li class="${l.d > 0 ? "is-up" : l.d < 0 ? "is-down" : "is-still"}"><span class="cc-swing-mark" aria-hidden="true">${l.d > 0 ? "+" : l.d < 0 ? "−" : "·"}</span><span>${l.d > 0 ? '<span class="sr-only">Up a size: </span>' : l.d < 0 ? '<span class="sr-only">Down a size: </span>' : ""}${l.text}</span></li>`).join("")}</ul>` : ""}${extra}</div>`;
}

function rollSwingView(c, s) {
  const r = roll;
  if (r.spinning || r.mode !== "result" || r.confFrom == null) return "";
  const d = swingOf(r);
  const friends = r.friends.length ? " Everyone who put an action in moves with it." : "";
  if (r.opp == null) return swingBlock(r.confFrom, s.conf, [{ d: 0, text: "There was nothing to beat, so it doesn’t move." }]);
  if (d > 0) return swingBlock(r.confFrom, s.conf, [{ d: 1, text: `One of your dice beat it.${r.confFrom >= 12 ? " d12’s as high as it goes." : ""}${friends}` }]);
  if (r.confFrom <= 2) return swingBlock(r.confFrom, s.conf, [{ d: 0, text: `Every die missed, and d2’s as low as it goes, so it stays there.${friends}` }]);
  return swingBlock(r.confFrom, s.conf, [{ d: -1, text: `Every die missed.${friends}` }]);
}

// Count a roll the way The Core does: 1 for each of your actions, 1 for every
// line that fits (lines on both set actions count once), 1 Aura for anything
// brought in, plus friends' steps, a Leader's steps and conditions.
function counted(r, c, s) {
  const act = c.actions[r.a];
  const extra = r.extra >= 0 ? c.actions[r.extra] : null;
  const free = new Set([...act.lines, ...(extra ? extra.lines : [])]);
  const lines = [...free].filter((k) => !r.off.has(k) && !isOut(s, lineOf(c, k)));
  const brought = [...r.in].filter((k) => !free.has(k));
  const condSteps = s.conditions.filter((x) => r.conds.has(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  const borrowed = borrowedIn(c, s, r);
  const own = extra ? 2 : 1;
  const total = Math.max(1, own + lines.length + brought.length + borrowed.length + r.other + condSteps + r.friends.reduce((a, b) => a + b, 0) + r.handed);
  const splits = own + r.friends.length;
  const { fewest, most } = diceRange(total, splits);
  const count = clamp(r.count ?? fewest, fewest, most);
  const shapes = diceShapes(total, count);
  const shape = clamp(r.shape, 0, shapes.length - 1);
  const dice = shapes[shape] ?? stepsToDice(total);
  const aura = brought.length + borrowed.length + r.other;
  // Shaken on d2: an action at what the scene's about costs 1 Resolve.
  const shaken = s.conf <= 2 && r.shaken !== false;
  const resolve = (r.beyond ? 1 : 0) + (extra && r.via === "resolve" ? 1 : 0) + (shaken ? 1 : 0);
  const fired = Boolean(extra) && r.via === "fired";
  const short = aura > s.aura ? `You’ve got ${s.aura} Aura, and this needs ${aura}.` : resolve > s.resolve ? `You’ve got ${s.resolve} Resolve, and this needs ${resolve}.` : fired && s.conf < 12 ? "Your Confidence has to be on d12 to cash it in." : "";
  return { act, extra, free, lines, brought, borrowed, total, splits, fewest, most, count, shapes, shape, dice, aura, resolve, fired, shaken, short };
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

// The roll card. It counts as you tap: lines on the set action are free, and
// anything brought in is gold, at 1 Aura each.
function buildView(c, s) {
  const r = roll;
  const k = counted(r, c, s);
  const toggle = (l, on, act, aura = false) => lineToggle(s, l, on, act, aura);
  const groups = [["title", "Titles"], ["permission", "Permissions"], ["attuned", "Attuned"], ["trait", "Traits"], ["kit", "What you carry"]].map(([kind, title]) => {
    const list = c.lines.filter((l) => l.kind === kind && !k.free.has(l.key) && (kind !== "trait" || l.step) && !(kind === "kit" && Object.keys(s.crossed).some((x) => s.crossed[x] && x.endsWith(`|${l.label}`))));
    return list.length ? `<h3>${title}</h3>${list.map((l) => toggle(l, r.in.has(l.key), "in", true)).join("")}` : "";
  }).join("");
  const name = k.extra ? (k.extra === k.act ? `${k.act.name}, twice` : `${k.act.name} and ${k.extra.name}`) : k.act.name;
  const vias = [["resolve", "1 Resolve"], ["time", "Taking my time, outside a round"], ["held", "I held my action"], ["hiding", "Coming out of hiding"], ["fired", "Cashing in fired-up Confidence"], ["trait", "A trait, condition or Boon that says so"]];
  const dice = [...k.dice.map((size, i) => [String(i), size, "your "]), ...(r.mark ? [["m", r.mark, "the Mark "]] : [])];
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(name)}</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...k.dice.map((d) => [d, "you"]), ...(r.mark ? [[r.mark, "you", "is-mark"]] : []), ...(r.vs > 0 ? [[r.vs, "them", "is-vs"]] : [])])}<span><b>${steps(k.total)}</b>, ${diceLabel(k.dice)}${r.mark ? `, and the Mark d${r.mark}` : ""}${r.vs > 0 ? ` against their d${r.vs}` : r.vs === -1 ? ` against ${r.vsRolled}` : ""}</span></p>
      ${k.aura || k.resolve ? `<p class="cc-costs">${k.aura ? `<span class="chip is-aura">${k.aura} Aura</span>` : ""}${k.resolve ? `<span class="chip">${k.resolve} Resolve</span>` : ""}</p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">${table.forLine(r)}${goldNow(`act:${k.act.name}`)}
    ${k.act.name === "Defend" ? '<p class="cc-note">Defending this round? There’s nothing to roll yet. When the telegraphs land, tap When it lands and pick Defend, and every line on it counts twice. Roll it here when you’re answering a telegraph by blocking or dodging it.</p>' : ""}
    ${s.conf <= 2 ? `<fieldset class="cc-group"><legend>You’re shaken</legend><button type="button" class="cc-line" data-act="shaken"${pressed(k.shaken)}><span class="tick" aria-hidden="true"></span><span>This action costs 1 Resolve <small>when it’s at what the scene’s about, so tap it off when it isn’t. Or close this and pull yourself together from the Confidence tracker instead. That takes your action and brings you back to d4.</small></span></button></fieldset>` : ""}
    <fieldset class="cc-group"><legend>On your ${esc(k.extra && k.extra !== k.act ? `${k.act.name} and ${k.extra.name}` : k.act.name)}</legend>
      ${k.free.size ? `${[...k.free].map((key) => toggle(lineOf(c, key), !r.off.has(key), "off")).join("")}<p class="cc-lead">Tap a line off when it doesn’t fit this time.</p>` : '<p class="cc-lead">Nothing’s on it yet, so it’s the action on its own.</p>'}</fieldset>
    <fieldset class="cc-group"><legend>What it’s up against</legend>
      <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="vs" data-v="0"${pressed(r.vs === 0)}>Nothing to beat</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="vs" data-v="${d}"${pressed(r.vs === d)} aria-label="Their d${d}">d${d}</button>`).join("")}<button type="button" class="cc-chipbtn" data-act="vs" data-v="-1"${pressed(r.vs === -1)}>Its number this round</button></div>
      ${r.vs === -1 ? `<div class="cc-stepper"><span>The number to beat <small>what it already rolled this round, or the GM’s number</small></span>${stepper("vsRolled", r.vsRolled, 1, 30, "The number to beat")}</div>` : `<p class="cc-lead">Tap its die and the phone rolls it with yours. A threat rolls its defence once a round, and that roll stands for everyone who goes at it.</p>`}
      <details class="cc-mark"${r.mark || ui.open.has("mark") ? " open" : ""} data-open="mark"><summary>Is it Marked?${r.mark ? ` <small>d${r.mark}</small>` : ""}</summary>
        <p class="cc-small">Anyone who goes at a Marked creature rolls the Mark die too, as one more die against it.</p>
        <div class="cc-chips" role="group" aria-label="Its Mark"><button type="button" class="cc-chipbtn" data-act="mark" data-v="0"${pressed(!r.mark)}>No Mark</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="mark" data-v="${d}"${pressed(r.mark === d)} aria-label="Marked d${d}">d${d}</button>`).join("")}</div></details></fieldset>
    <details class="cc-group" data-open="bring"${ui.open.has("bring") ? " open" : ""}><summary>Bring something in <small>1 Aura each${k.aura ? `, ${k.aura} in` : ""}</small></summary>
      <p class="cc-lead">Anything else that fits costs 1 Aura to bring in, even when it plainly fits.</p>${groups}${borrowGroup(c, s, r)}
      <div class="cc-stepper${r.other ? " is-aura" : ""}"><span>Something else that fits <small>the ground, or a threat’s tag you know</small></span>${stepper("other", r.other, 0, 9, "Something else")}</div></details>
    ${s.conditions.length ? `<fieldset class="cc-group"><legend>Conditions on you</legend>${s.conditions.map((x) => `<button type="button" class="cc-line" data-act="cond" data-k="${esc(x.name)}"${pressed(r.conds.has(x.name))}><span class="tick" aria-hidden="true"></span><span><em>${esc(x.name)}</em> d${x.die} <small>${x.kind === "for" ? "one step more" : "one step less"}</small></span></button>`).join("")}<p class="cc-lead">Tap one on when it fits this roll.</p></fieldset>` : ""}
    <details class="cc-group" data-open="more"${ui.open.has("more") ? " open" : ""}><summary>Friends, extra actions and going beyond${r.friends.length || r.handed || k.extra || r.beyond ? " <small>in use</small>" : ""}</summary>
      <h3>Friends joining in</h3>
      ${r.friends.map((f, i) => `<div class="cc-stepper"><span>Friend ${i + 1}’s steps</span>${stepper("friend", f, 1, 18, `Friend ${i + 1}’s steps`, i)}<button type="button" class="cc-x sm" data-act="friend-off" data-i="${i}" aria-label="Friend ${i + 1} drops out">${ICON.close}</button></div>`).join("")}
      <button type="button" class="button sm" data-act="friend-on">A friend joins in</button>
      <p class="cc-lead">Add their set action’s steps, leaving out lines you’ve both got. Every action in the roll gives you a split, and nobody pays Aura for it.</p>
      <div class="cc-stepper"><span>Steps a Leader handed you <small>they don’t give you a split</small></span>${stepper("handed", r.handed, 0, 18, "Steps from a Leader")}</div>
      <h3>Your own extra action</h3>
      <label class="cc-field">Put it into <select data-in="extra"><option value="-1"${r.extra < 0 ? " selected" : ""}>No extra action</option>${c.actions.map((a, i) => `<option value="${i}"${r.extra === i ? " selected" : ""}>${i === r.a ? `${esc(a.name)} again, +1 step` : `${esc(a.name)} as a new approach`}</option>`).join("")}</select></label>
      ${k.extra ? `<label class="cc-field">It comes from <select data-in="via">${vias.map(([v, t]) => `<option value="${v}"${r.via === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>` : ""}
      <h3>Going beyond</h3>
      <button type="button" class="cc-line" data-act="beyond"${pressed(r.beyond)}><span class="tick" aria-hidden="true"></span><span>Go beyond what a permission normally does <small>1 Resolve</small></span></button></details>
    <fieldset class="cc-group"><legend>Your dice</legend>
      ${k.most > k.fewest ? `<div class="cc-stepper"><span>How many dice <small>${k.splits === 1 ? "your action gives you a split" : `${k.splits} splits, one for every action in the roll`}</small></span>${stepper("count", k.count, k.fewest, k.most, "How many dice")}</div>` : ""}
      ${k.shapes.length > 1 ? `<div class="cc-chips" role="group" aria-label="How your steps are shared out">${k.shapes.map((sh, i) => `<button type="button" class="cc-chipbtn" data-act="shape" data-i="${i}"${pressed(i === k.shape)}>${diceLabel(sh)}</button>`).join("")}</div>` : ""}
      <p class="cc-lead">Give every die an intent before you roll: what it’s trying to do, and who it’s aimed at. Tap one in and it’s on the result.</p>
      ${dice.map(([key, size, label]) => intentRow(key, size, label, INTENTS.action, key === "m" ? "mark" : "on")).join("")}</fieldset>
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

// Top faces give Aura back, one each. The +2 is added later and never counts.
// Then Confidence swings with the result.
function settle(s, c, which) {
  const tops = which.filter((i) => roll.dice[i].nat === roll.dice[i].size);
  roll.tops = tops.length;
  // A top face is part of the moment, so it's said out loud with the dice,
  // as well as in how it counted.
  roll.topNote = tops.length ? `${tops.length === 1 ? `Top face on the d${roll.dice[tops[0]].size}` : `${tops.length} top faces`}, so ${tops.length} Aura back.${gainAura(s, c, tops.length)}` : "";
  if (tops.length) roll.log.push(roll.topNote);
  swingRoll(s);
  s.last = lastOf();
}

function go(real) {
  const ch = current();
  const c = normal(ch);
  const k = counted(roll, c, ch.state);
  if (k.short) return;
  change(`rolling ${k.act.name}`, (s) => {
    const r = roll;
    s.aura -= k.aura;
    s.resolve -= k.resolve;
    r.log = [];
    if (k.aura) r.log.push(`Paid ${k.aura} Aura to bring in ${[...k.brought.map((key) => lineName(lineOf(c, key))), ...k.borrowed.map((p) => `one of ${p}’s, through your bond thread`), ...(r.other ? [`${r.other} more thing${r.other > 1 ? "s" : ""} that fit${r.other > 1 ? "" : "s"}`] : [])].join(", ")}.`);
    const why = [r.beyond && "to go beyond", k.extra && r.via === "resolve" && "for the extra action", k.shaken && "to act while you’re shaken"].filter(Boolean);
    if (k.resolve) r.log.push(`Paid ${k.resolve} Resolve ${why.join(" and ")}.`);
    if (k.fired) {
      s.conf = 6;
      r.log.push("Cashed in your Confidence for the extra action, so it’s back to d6.");
    }
    r.name = k.extra ? (k.extra === k.act ? `${k.act.name}, twice` : `${k.act.name} and ${k.extra.name}`) : k.act.name;
    r.total = k.total;
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

function resultView(c, s, ch) {
  const r = roll;
  const outs = r.dice.map(outcome);
  const words = { beat: "Beat it", won: "Tie, won for 1 Aura", tie: "Tie", under: "Under" };
  const picking = r.pick && !r.spinning;
  const plusOk = (d, mark) => !d.plus && Boolean(d.mark) === mark;
  // Each die as the kit draws it, its number on the hub: a top face lights the
  // whole token, a lost one goes dark, and a tie's hub is dashed.
  const stateOf = (d, o) => (d.nat === d.size && !d.plus ? "top" : o === "under" ? "low" : o === "tie" ? "tie" : "");
  const die = (d, i) => {
    const v = d.nat + d.plus;
    if (r.spinning) return kitDie(d.size, { face: d.nat, spin: true, label: `Your d${d.size}, rolling` });
    const drawn = kitDie(d.size, { face: v, state: stateOf(d, outs[i]), label: `${d.mark ? "The Mark" : "Your"} d${d.size} came up ${v}` });
    if (picking && (r.pick.type === "reroll" || plusOk(d, r.pick.mark))) return `<button type="button" class="cc-pickdie" data-act="pick" data-i="${i}" aria-label="The d${d.size} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>`;
    return drawn;
  };
  const against = r.oppSize ? `against their d${r.oppSize}, which came up ${r.spinning ? "…" : r.opp}` : r.opp != null ? `against the ${r.opp} it already rolled` : "with nothing to beat";
  // Their die only goes dark when every one of yours beat it. With a split
  // where one wins and one doesn't, it beat one of yours, so it stays lit,
  // and each of your dice says how it did.
  const theyLost = outs.length > 0 && outs.every((o) => o === "beat" || o === "won");
  const them = r.oppSize ? `<div class="cc-them"${r.spinning ? ' data-act="skip"' : ""}><span class="vs" aria-hidden="true">against</span><span class="k">Their d${r.oppSize}</span>${kitDie(r.oppSize, { own: "them", face: r.opp, spin: r.spinning, state: !r.spinning && theyLost ? "low" : "", label: r.spinning ? `Their d${r.oppSize}, rolling` : `Their d${r.oppSize} came up ${r.opp}` })}</div>`
    : r.opp != null ? `<div class="cc-them"><span class="vs" aria-hidden="true">against</span><span class="k">To beat</span><span class="cc-tobeat">${r.opp}</span></div>` : "";
  const onMark = (a) => /\bMark\b/.test(a.aura);
  // A +2 on Defend or Confidence dice (the Guardian's) shows when the roll's your Defend.
  const guards = (a) => /\b(Armour|Defend|Confidence)\b/.test(a.aura);
  const defending = c.actions[r.a]?.name === "Defend";
  const bonuses = c.archetypeRules.filter((a) => a.bonus && !/\bfriend’s\b/.test(a.aura) && (!guards(a) || (defending && /\b(Defend|Armour)\b/.test(a.aura))) && (!onMark(a) || r.dice.some((d) => d.mark)));
  const canReroll = s.resolve >= 1 && (r.opp == null || outs.some((o) => o === "tie" || o === "under"));
  const offers = r.spinning || picking ? "" : [
    ...outs.map((o, i) => (o === "tie" ? `<button type="button" class="button sm" data-act="win-tie" data-i="${i}"${off(s.aura < 1)}>Win the tie on the d${r.dice[i].size}: 1 Aura</button>` : "")),
    ...bonuses.map((a) => `<button type="button" class="button sm" data-act="plus" data-n="${esc(a.name)}"${off(s.aura < 1 || !r.dice.some((d) => plusOk(d, onMark(a))))}>${esc(a.name)} +${a.bonus} on ${onMark(a) ? "the Mark die" : "a die"}: 1 Aura</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: 1 Resolve</button>` : "",
  ].join("");
  const how = [
    ...(bonuses.length && !r.spinning && !picking ? [`<p class="cc-lead">${bonuses.map((a) => `<b>${esc(a.name)}:</b> ${a.auraHtml}`).join(" ")}</p>`] : []),
    ...(r.log.length ? [`<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`] : []),
  ].join("");
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(r.name)}</h2><p class="cc-small">${steps(r.total)}, ${esc(against)}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.dice.length)}">
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${r.dice.map((d, i) => `<li class="res is-${r.spinning ? "spin" : outs[i] ?? "none"}">${die(d, i)}<span class="res-die">${d.mark ? "Mark " : ""}d${d.size}${d.plus ? ` +${d.plus}` : ""}</span>${d.intent ? `<span class="res-intent">${esc(d.intent)}</span>` : ""}${!r.spinning && outs[i] ? `<b class="res-out">${words[outs[i]]}</b>` : ""}${!r.spinning && d.nat === d.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
    ${them}
    ${r.spinning ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${r.topNote && !r.spinning ? `<p class="cc-topnote">${esc(r.topNote)}</p>` : ""}
    ${r.tele && !r.spinning && !picking && r.opp != null ? table.rollNote(r) : ""}
    ${picking ? `<div class="cc-note" role="status"><p>${r.pick.type === "plus" ? `Tap the ${r.pick.mark ? "Mark die" : "die"} to put +${r.pick.bonus} on.` : "Tap a die to roll it again, or roll them all."}</p><div class="cc-row">${r.pick.type === "reroll" ? '<button type="button" class="button sm" data-act="reroll-all">Roll them all</button>' : ""}<button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>` : rollSwingView(c, s)}
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    <p class="cc-small cc-left">You’ve got ${s.aura} Aura and ${s.resolve} Resolve.</p>
    ${how && !r.spinning ? `<details class="cc-how" data-open="how"${ui.open.has("how") ? " open" : ""}><summary>How it counted</summary>${how}</details>` : ""}
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- defending

// When it lands: your Defend against the blows, or your Confidence against
// fear, lies and pressure, and each die you roll stops one telegraph it
// beats or ties. Letting it ride, it's your Defend as it is. When you took the
// Defend action, every line on your Defend counts twice, and you get one
// split. Your Confidence rolls as it is either way. Every telegraph a die
// stops puts your Confidence up a size, and what gets through can take it
// down: a Hurt that puts your wound die up, or fear you don't hold.
// pre: the telegraphs that landed on this character (table.js), their dice
// and what each was doing, ready to roll against.
function openDefence(pre = null) {
  openRoll({ kind: "defence", mode: "build", against: pre?.against ?? "blows", defend: false, incoming: pre?.incoming ?? [], mine: [], opp: [], pick: null, log: [], spinning: false, padOpp: true, dconds: {}, intents: pre?.intents ?? {}, owns: new Set(), assign: [], paid: [], extra: {}, swap: null, off: new Set(), in: new Set(), borrow: new Set(), other: 0, count: null, shape: 0, confFrom: null, moves: [], camp: pre?.camp ?? null, teles: pre?.teles ?? [], from: pre?.from ?? {} });
}

// A condition is one step on whatever it fits, so Warded makes a d4 Defend a
// d6. The ones that name your Defend or your Confidence start on, and the
// player can tap any of them off or on.
function defenceCondOn(x, r) {
  if (r.dconds && x.name in r.dconds) return r.dconds[x.name];
  const rule = COND.get(x.name);
  return Boolean(rule) && (r.against === "blows" ? /\b(Defend|Armour)\b/ : /\bConfidence\b/).test(rule.passive);
}

// The dice you've got against it. Something brought in for Aura is a step
// once, even when you Defend, and conditions count once.
function defencePool(c, s, r) {
  const d = defendOf(c);
  const blows = r.against === "blows";
  const conds = s.conditions.filter((x) => defenceCondOn(x, r)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  // Defending doubles the lines on your Defend. Confidence rolls as it is.
  const defending = blows && r.defend;
  let lines = [];
  let brought = [];
  let borrowed = [];
  let base = s.conf / 2;
  if (blows) {
    lines = d.lines.filter((k) => !r.off.has(k) && !isOut(s, lineOf(c, k)));
    brought = [...r.in].filter((k) => !d.lines.includes(k));
    borrowed = borrowedIn(c, s, r);
    base = 1 + (defending ? 2 : 1) * lines.length + brought.length + borrowed.length + r.other;
  }
  const total = Math.max(1, base + conds);
  const { fewest, most } = diceRange(total, defending ? 1 : 0);
  const count = clamp(r.count ?? fewest, fewest, most);
  const shapes = diceShapes(total, count);
  const shape = clamp(r.shape, 0, shapes.length - 1);
  const aura = blows ? brought.length + borrowed.length + r.other : 0;
  return { d, lines, brought, borrowed, defending, total, fewest, most, count, shapes, shape, dice: shapes[shape] ?? stepsToDice(total), aura, short: aura > s.aura ? `You’ve got ${s.aura} Aura, and this needs ${aura}.` : "" };
}

// An intent like "pin" or "frighten" is a condition when it gets through, and
// its die is the die that placed it.
function condOf(text) {
  const word = String(text ?? "").trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "");
  if (word.length < 3) return null;
  return DATA.conditions.find((x) => x.kind === "against" && x.name.toLowerCase().startsWith(word) && x.name.length - word.length <= 3) ?? null;
}
// The conditions on you that make a hit one more Hurt, like Exposed.
const vulnsOn = (s) => s.conditions.filter((x) => x.kind === "against" && /\bvulnerable\b/i.test(COND.get(x.name)?.passive ?? "")).map((x) => x.name);

// Each of your dice stops one telegraph. The phone matches them up so the
// most get stopped: the lowest blow takes the lowest roll that stops it, and
// the rolls that can't stop anything go on what's left. A blow with no die
// left for it gets through. The player can swap two.
function assignBest(r) {
  const spare = r.mine.map((d, i) => ({ i, v: d.nat + d.plus })).sort((a, b) => a.v - b.v);
  const hits = r.incoming.map((size, j) => ({ j, v: r.opp[j] })).sort((a, b) => a.v - b.v);
  r.assign = r.incoming.map(() => -1);
  for (const h of hits) {
    const k = spare.findIndex((m) => m.v >= h.v);
    if (k >= 0) r.assign[h.j] = spare.splice(k, 1)[0].i;
  }
  for (const h of hits) if (r.assign[h.j] < 0) r.assign[h.j] = spare.shift()?.i ?? -1;
  r.swap = null;
  r.swapped = false;
}

// Which of your dice stops which telegraph. Ties go to you.
function blocks(r) {
  return r.incoming.map((size, j) => {
    const pair = r.assign[j] ?? -1;
    const mine = r.mine[pair] ? r.mine[pair].nat + r.mine[pair].plus : null;
    return { j, size, v: r.opp[j], pair, mine, by: mine != null && mine >= r.opp[j] ? pair : null, intent: String(r.intents[`d${j}`] ?? "").trim() };
  });
}

function defenceGo(real) {
  const r = roll;
  const ch = current();
  const c = normal(ch);
  if (!r.incoming.length || !c) return;
  const p = defencePool(c, ch.state, r);
  if (p.short) return;
  change("rolling your defence", (s) => {
    s.aura -= p.aura;
    r.log = [];
    if (p.aura) r.log.push(`Paid ${p.aura} Aura to bring in ${[...p.brought.map((key) => lineName(lineOf(c, key))), ...p.borrowed.map((who) => `one of ${who}’s, through your bond thread`), ...(r.other ? [`${r.other} more thing${r.other > 1 ? "s" : ""} that fit${r.other > 1 ? "" : "s"}`] : [])].join(", ")}.`);
    r.total = p.total;
    r.defending = p.defending;
    r.confFrom = null;
    r.moves = [];
    r.mine = p.dice.map((size) => ({ size, nat: 0, plus: 0 }));
    r.opp = r.incoming.map(() => 0);
    r.paid = r.incoming.map(() => "");
    r.extra = {};
    r.pick = null;
    r.real = real;
    if (real) r.mode = "pad";
    else {
      for (const m of r.mine) m.nat = throwDie(m.size);
      r.opp = r.incoming.map((d) => throwDie(d));
      r.mode = "result";
      settleDefence(s, c);
      r.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
  else if (!real && roll?.mode === "result") landed(true);
}

function settleDefence(s, c) {
  assignBest(roll);
  const tops = roll.mine.filter((m) => m.nat === m.size).length;
  roll.tops = tops;
  if (tops) roll.log.push(`${tops === 1 ? "A top face" : `${tops} top faces`} on your ${roll.against === "blows" ? "Defend" : "Confidence"}, so ${tops} Aura back.${gainAura(s, c, tops)}`);
  swingDefence(s);
}

// Every telegraph your defence stops puts your Confidence up a size, from
// where it was when you rolled. A swap or a +2 can change how many that is,
// until you start paying for what got through, and then the dice are settled.
const stoppedOf = (r) => blocks(r).filter((h) => h.by != null);
function swingDefence(s) {
  const r = roll;
  if (r.confFrom == null) r.confFrom = s.conf;
  if (r.paid.some(Boolean)) return;
  let conf = r.confFrom;
  for (let i = 0; i < stoppedOf(r).length; i++) conf = sizeUp(conf);
  s.conf = conf;
}

// A line on a set action, to tap off when it doesn't fit, or to bring in for
// Aura. Something crossed out can't be tapped on until it's mended.
const lineToggle = (s, l, on, act, aura = false, note = "") => (isOut(s, l)
  ? `<button type="button" class="cc-line is-out" disabled aria-pressed="false"><span class="tick" aria-hidden="true"></span><span><s>${lineLabel(l)}</s> <small>crossed out until it’s mended</small></span></button>`
  : `<button type="button" class="cc-line${aura ? " is-aura" : ""}" data-act="${act}" data-k="${l.key}"${pressed(on)}><span class="tick" aria-hidden="true"></span><span>${lineLabel(l)}${note ? ` <small>${note}</small>` : ""}</span></button>`);

function defenceBuild(c, s) {
  const r = roll;
  const p = defencePool(c, s, r);
  const blows = r.against === "blows";
  // Telegraphs that landed say whether they're blows or fear.
  const locked = Boolean(r.teles?.some(Boolean));
  const now = diceLabel(stepsToDice(stepsNow(c, s, p.d)));
  const conds = s.conditions.map((x) => `<button type="button" class="cc-line" data-act="d-cond" data-k="${esc(x.name)}"${pressed(defenceCondOn(x, r))}><span class="tick" aria-hidden="true"></span><span><em>${esc(x.name)}</em> d${x.die} <small>${COND.get(x.name) ? esc(COND.get(x.name).passive.replace(/<[^>]+>/g, "").replace(/\.$/, "")) : x.kind === "for" ? "one step more" : "one step less"}</small></span></button>`).join("");
  const groups = [["title", "Titles"], ["permission", "Permissions"], ["attuned", "Attuned"], ["trait", "Traits"], ["kit", "What you carry"]].map(([kind, title]) => {
    const list = c.lines.filter((l) => l.kind === kind && !p.d.lines.includes(l.key) && (kind !== "trait" || l.step) && !isOut(s, l));
    return list.length ? `<h3>${title}</h3>${list.map((l) => lineToggle(s, l, r.in.has(l.key), "in", true)).join("")}` : "";
  }).join("");
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2>
      <p class="cc-dice" aria-live="polite">${liveDice([...p.dice.map((d) => [d, "you"]), ...r.incoming.map((d, j) => [d, "them", j ? "" : "is-vs"])])}<span><b>${steps(p.total)}</b>, ${diceLabel(p.dice)}, and each die stops one</span></p>
      ${p.aura ? `<p class="cc-costs"><span class="chip is-aura">${p.aura} Aura</span></p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">${table.landLine(r)}
    <p class="cc-lead">Whatever nobody answered lands at the end of the round. Each die you roll stops one telegraph it beats or ties, and everything else gets through. Every one you stop puts your Confidence up a size.</p>
    <fieldset class="cc-group"><legend>What’s coming at you</legend>
      <button type="button" class="cc-line" data-act="d-against" data-v="blows"${pressed(blows)}${off(locked && !blows)}><span class="tick" aria-hidden="true"></span><span>Blows, blades, falling rocks and teeth <small>your Defend, ${esc(now)}</small></span></button>
      <button type="button" class="cc-line" data-act="d-against" data-v="confidence"${pressed(!blows)}${off(locked && blows)}><span class="tick" aria-hidden="true"></span><span>Fear, lies and pressure <small>your Confidence, d${s.conf}</small></span></button>${locked ? `<p class="cc-lead">The GM said what landed, so it’s against your ${blows ? "Defend" : "Confidence"}.</p>` : ""}</fieldset>
    ${blows ? `<fieldset class="cc-group"><legend>How you take it</legend>
      <button type="button" class="cc-line" data-act="d-defend" data-v="0"${pressed(!r.defend)}><span class="tick" aria-hidden="true"></span><span>Let it ride <small>your Defend as it is</small></span></button>
      <button type="button" class="cc-line" data-act="d-defend" data-v="1"${pressed(r.defend)}><span class="tick" aria-hidden="true"></span><span>Defend <small>it took your action: every line on your Defend counts twice, and you get a split</small></span></button></fieldset>
    <fieldset class="cc-group"><legend>On your Defend</legend>
      ${p.d.lines.length ? `${p.d.lines.map((key) => lineOf(c, key)).filter(Boolean).map((l) => lineToggle(s, l, !r.off.has(l.key), "off", false, r.defend ? "counts twice" : "")).join("")}<p class="cc-lead">Tap a line off when it doesn’t fit this time.</p>` : `<p class="cc-lead">Nothing’s on it yet, so it’s the action on its own, a d2${r.defend ? ", even when you Defend" : ""}.</p>`}</fieldset>
    <details class="cc-group" data-open="d-bring"${ui.open.has("d-bring") ? " open" : ""}><summary>Bring something in <small>1 Aura each${p.aura ? `, ${p.aura} in` : ""}</small></summary>
      <p class="cc-lead">Anything else that fits costs 1 Aura to bring in, and it’s a step once, even when you Defend.</p>${groups}${borrowGroup(c, s, r)}
      <div class="cc-stepper${r.other ? " is-aura" : ""}"><span>Something else that fits <small>the ground, or a threat’s tag you know</small></span>${stepper("other", r.other, 0, 9, "Something else")}</div></details>`
    : '<p class="cc-note">Your Confidence rolls as it is, whether you Defend or not. A Bard’s song is what shields you from fear.</p>'}
    ${conds ? `<fieldset class="cc-group"><legend>Conditions on you</legend>${conds}<p class="cc-lead">Each one that fits is a step, so you’re rolling ${diceLabel(p.dice) === `d${p.dice[0]}` ? `a d${p.dice[0]}` : diceLabel(p.dice)}.</p></fieldset>` : ""}
    ${p.most > p.fewest || p.shapes.length > 1 ? `<fieldset class="cc-group"><legend>Your dice</legend>
      ${p.most > p.fewest ? `<div class="cc-stepper"><span>How many dice <small>Defending gives you a split, and more dice stop more</small></span>${stepper("count", p.count, p.fewest, p.most, "How many dice")}</div>` : ""}
      ${p.shapes.length > 1 ? `<div class="cc-chips" role="group" aria-label="How your steps are shared out">${p.shapes.map((sh, i) => `<button type="button" class="cc-chipbtn" data-act="shape" data-i="${i}"${pressed(i === p.shape)}>${diceLabel(sh)}</button>`).join("")}</div>` : ""}</fieldset>` : ""}
    <fieldset class="cc-group"><legend>The dice aimed at you</legend>
      <div class="cc-chips">${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="d-add" data-v="${d}" aria-label="Add a d${d}">+ d${d}</button>`).join("")}</div>
      ${r.incoming.length ? `<div class="cc-incoming">${r.incoming.map((d, j) => intentRow(`d${j}`, d, "their ", INTENTS[r.against], "them", `<button type="button" class="cc-x sm" data-act="d-del" data-i="${j}" aria-label="Take the d${d} off">${ICON.close}</button>`)).join("")}</div>
        <p class="cc-lead">Tap what each one’s trying to do, if the GM said.</p>` : blows ? '<p class="cc-lead">Add each die the GM telegraphed at you that nobody answered, and any you took on when you intercepted for a friend.</p>' : '<p class="cc-lead">Add each die the GM telegraphed at your Confidence that nobody answered. Nobody can intercept fear, lies or pressure, so they’re all aimed at you.</p>'}</fieldset>
  </div>
  <div class="dlg-foot">${p.short ? `<p class="cc-warn" role="alert">${esc(p.short)}</p>` : ""}<button type="button" class="button primary" data-act="d-go"${off(!r.incoming.length || p.short)}>Roll</button><button type="button" class="button" data-act="d-real"${off(!r.incoming.length || p.short)}>Roll real dice</button></div>`;
}

// What one that gets through costs you. Tap it and it's counted. Your armour
// can take a blow instead, a box at a time, with its boxes beside it, and
// anything else you wear or wield can break instead. A vulnerability on you
// makes a hit two Hurts, so a Hurt or a box, one more for each.
function payView(h, r, s, c) {
  const vulns = vulnsOn(s);
  const b = (what, label, no = false, extra = "") => `<button type="button" class="button sm" data-act="d-pay" data-j="${h.j}" data-what="${what}"${extra}${off(no)}>${label}</button>`;
  const box = (a, what) => b(what, `<span>Put it on ${esc(yours(a))}</span>${kitBoxes(tickedOf(s, a), a.boxes, { label: boxesSaid(s, a) })}`, false, ` data-k="${esc(keyOf(a))}"`);
  if (r.paid[h.j]) {
    // A Blaze ends it for your body, but your armour can still take one more.
    const boxes = r.against === "blows" ? standing(c, s) : [];
    const more = r.harm?.[h.j] && (r.extra[h.j] ?? 0) < vulns.length && (!s.blaze || boxes.length);
    return `<span class="res-paid">${esc(r.paid[h.j])}</span>${more ? `<div class="cc-pay cc-more"><p class="cc-small">It’s one more, since you’re ${esc(vulns[r.extra[h.j] ?? 0])}.</p>${s.blaze ? "" : b("vuln", "Another Hurt")}${boxes.map((a) => box(a, "vbox")).join("")}</div>` : ""}`;
  }
  const cond = condOf(h.intent);
  // The Guardian's Resolve: one hit that gets through does nothing.
  const guard = c.archetypeRules.find((a) => /\bgets through to you does nothing\b/i.test(a.resolve ?? ""));
  const pieces = piecesOf(c);
  const gear = [...c.carry.equipment.items, ...s.picked.filter((x) => x.where === "equipment").map((x) => x.name)].filter((x) => !s.crossed[`equipment|${x}`] && !pieces.some((a) => a.name === x));
  // Fear that gets through drops your Confidence a size, or 1 Resolve holds
  // your ground. On d2 it can't drop, so it's a Hurt instead.
  const list = r.against === "blows"
    ? [b("hurt", "Take a Hurt"), ...standing(c, s).map((a) => box(a, "box")), ...gear.map((x) => b("break", `Break ${esc(x)}`, false, ` data-k="${esc(`equipment|${x}`)}"`)), b("asp", "Aspiration down a size", s.asp <= 2), ...(guard ? [b("nothing", `It does nothing: 1 Resolve, ${esc(guard.name)}`, s.resolve < 1)] : [])]
    : [b("shake", s.conf <= 2 ? "A Hurt instead, since you’re on d2" : `Confidence down a size, to d${sizeDown(s.conf)}`), b("hold", "Hold your ground: 1 Resolve", s.resolve < 1)];
  return `<div class="cc-pay">${cond ? b("cond", `<span><em>${esc(cond.name)}</em> d${h.size}</span>`) : ""}${list.join("")}</div>`;
}

function defenceResult(c, s, ch) {
  const r = roll;
  const blows = r.against === "blows";
  const what = blows ? "Defend" : "Confidence";
  const hits = blocks(r);
  const through = hits.filter((h) => h.by == null).length;
  const picking = r.pick && !r.spinning;
  const done = !r.spinning && !picking;
  const canSwap = done && hits.length > 1 && !r.paid.some(Boolean);
  const mine = r.mine.map((m, i) => {
    const v = m.nat + m.plus;
    const label = `<span class="res-die">d${m.size}${m.plus ? ` +${m.plus}` : ""}</span>`;
    if (r.spinning) return `<span class="res-mine">${kitDie(m.size, { face: m.nat, spin: true, label: `Your d${m.size}, rolling` })}${label}</span>`;
    const drawn = kitDie(m.size, { face: v, state: m.nat === m.size && !m.plus ? "top" : "", label: `Your d${m.size} came up ${v}` });
    if (picking && !m.plus) return `<span class="res-mine"><button type="button" class="cc-pickdie" data-act="d-pick" data-i="${i}" aria-label="Your d${m.size} that came up ${v}">${drawn.replace('role="img"', 'aria-hidden="true"')}</button>${label}</span>`;
    return `<span class="res-mine">${drawn}${label}${m.nat === m.size ? '<span class="res-note">Top face</span>' : ""}</span>`;
  }).join("");
  const bonuses = c.archetypeRules.filter((a) => a.bonus && (blows ? /\b(Defend|Armour)\b/ : /\bConfidence\b/).test(a.aura));
  const row = (h) => {
    const note = h.by != null ? `by your ${h.mine}` : h.mine != null ? `your ${h.mine} doesn’t stop it` : "no die left for it";
    const out = r.spinning ? "" : `<b class="res-out">${h.by == null ? "Gets through" : "Stopped"}</b><span class="res-note">${note}</span>`;
    const swap = canSwap ? `<button type="button" class="cc-chipbtn sm cc-swap" data-act="d-swap" data-j="${h.j}"${pressed(r.swap === h.j)} aria-label="Swap the die on their d${h.size}, which came up ${h.v}">Swap</button>` : "";
    return `<li class="res is-${r.spinning ? "spin" : h.by == null ? "through" : "beat"}">${kitDie(h.size, { own: "them", face: h.v, spin: r.spinning, state: !r.spinning && h.by != null ? "low" : "", label: r.spinning ? `Their d${h.size}, rolling` : `Their d${h.size} came up ${h.v}` })}<span class="res-die">their d${h.size}</span>${h.intent ? `<span class="res-intent">${esc(h.intent)}</span>` : ""}${out}${swap}${done && h.by == null ? payView(h, r, s, c) : ""}</li>`;
  };
  const lead = blows
    ? through ? `${through === 1 ? "One gets" : `${through} get`} through. The GM names what each one costs you, and you can offer another that fits, like your shield taking it instead. Tap what it costs and it’s counted. A Hurt takes your Confidence down a size, and your armour or kit taking it doesn’t.` : "Nothing gets through."
    : through ? `Each one that gets through drops your Confidence a size, or you hold your ground for 1 Resolve.${hits.some((h) => h.by == null && condOf(h.intent)) ? " One meant to do something, like frighten you, does that instead, unless you trade it for one of those." : ""}${s.conf <= 2 ? " You’re on d2, so a drop’s a Hurt instead." : ""}` : "Nothing gets through.";
  // How Confidence moved: up a size for each one stopped, then whatever paying
  // for the rest did to it.
  const stopped = hits.filter((h) => h.by != null);
  const capped = stopped.length && r.confFrom + 2 * stopped.length > 12;
  const moves = [...stopped.map((h) => ({ d: 1, text: `Your ${h.mine} stopped their d${h.size}${h.intent ? `, <em>${esc(h.intent)}</em>` : ""}` })), ...(capped ? [{ d: 0, text: "d12’s as high as it goes." }] : []), ...(r.moves ?? [])];
  if (!moves.length) moves.push({ d: 0, text: "Nothing was stopped, so it doesn’t go up." });
  const swing = done && r.confFrom != null ? swingBlock(r.confFrom, s.conf, moves) : "";
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2><p class="cc-small">Your ${what}, ${steps(r.total)}${r.defending ? ", Defending" : ""}. Each die stops one, and ties go to you.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <div class="cc-mine-roll"${r.spinning ? ' data-act="skip"' : ""}><span class="k">Your ${what}</span>${mine}</div>
    ${picking ? `<div class="cc-note" role="status"><p>Tap the die to put +${r.pick.bonus} on.</p><div class="cc-row"><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>` : ""}
    ${done ? `<p class="cc-lead">${lead}</p>` : ""}
    ${canSwap ? `<p class="cc-small" role="status">${r.swap == null ? "The phone’s matched your dice so the most get stopped. Tap Swap on two to trade the dice stopping them." : "Now tap Swap on the other one."}</p>` : ""}
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${hits.map(row).join("")}</ul>
    ${swing}
    ${done && r.camp && r.teles?.some(Boolean) ? table.rollNote(r) : ""}
    ${done && bonuses.length && !r.paid.some(Boolean) ? `<div class="cc-row cc-offers">${bonuses.map((a) => `<button type="button" class="button sm" data-act="plus" data-n="${esc(a.name)}"${off(s.aura < 1 || !r.mine.some((m) => !m.plus))}>${esc(a.name)} +${a.bonus} on your ${what}: 1 Aura</button>`).join("")}</div>` : ""}
    ${r.log.length ? `<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
    <p class="cc-small">Defend ${esc(diceLabel(stepsToDice(stepsNow(c, s, defendOf(c)))))} · Confidence d${s.conf} · Wound d${s.wound} · ${s.aura} Aura · ${s.resolve} Resolve</p>
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- the end of a scene

// At the end of every scene you rest: roll the Confidence you finished on
// against your wound die, before it goes back to where it starts, and a win
// brings your wound down a size. Ties go to the wound, and 1 Resolve rolls
// yours again. With Tend the Crew in the scene you roll two Confidence dice,
// and the best counts. Nothing's counted until the next scene starts, so the
// rest and the new scene are one undo.
const tendsOf = (c) => c.traits.some((t) => t.name === "Tend the Crew" || /\btwo Confidence dice\b/i.test(String(t.html ?? "").replace(/<[^>]+>/g, "")));
const sceneSaid = (s) => `New scene. Aura ${s.aura}, Resolve ${s.resolve} and Confidence d${s.conf}.`;

function newScene() {
  const ch = current();
  const c = normal(ch);
  if (!c) return;
  const s = ch.state;
  if (s.wound <= floorOf(s, c)) return change("starting a new scene", (st, cc) => {
    endScene(st, cc);
    return sceneSaid(st);
  });
  roll = { kind: "rest", mode: "build", two: tendsOf(c), mine: [], opp: 0, conf: s.conf, wound: s.wound, rerolls: 0, real: false, spinning: false, padOpp: false, log: [] };
  openDialog();
}

function restRoll(real, again = false) {
  const r = roll;
  r.real = real;
  r.mine = Array.from({ length: r.two ? 2 : 1 }, () => ({ size: r.conf, nat: 0, plus: 0 }));
  if (!again) r.opp = 0;
  if (real) {
    r.mode = "pad";
    r.padOpp = !again;
  } else {
    for (const m of r.mine) m.nat = throwDie(m.size);
    if (!again) r.opp = throwDie(r.wound);
    r.mode = "result";
    r.spinning = !calm();
  }
  renderDialog();
  if (r.spinning) spin();
  else if (!real) landed(true);
}

function restView(c, s) {
  const r = roll;
  const best = r.mine.length ? Math.max(...r.mine.map((m) => m.nat)) : 0;
  const won = best > r.opp;
  const head = `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">End of the scene</h2><p class="cc-small">You rest before the next one.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>`;
  const resolve = s.resolve - r.rerolls;
  if (r.mode === "pad") {
    const rows = [...r.mine.map((m, i) => [`Your Confidence, a d${m.size}`, `m${i}`, m.size, m.nat]), ...(r.padOpp ? [[`Your wound die, a d${r.wound}`, "opp", r.wound, r.opp]] : [])];
    return padView("End of the scene", rows, r.mine.every((m) => m.nat) && (!r.padOpp || r.opp));
  }
  if (r.mode === "build") {
    return `${head}<div class="dlg-body">
      <p>Roll the Confidence you finished the scene on against your wound die. Beat it and your wound comes down a size, and a tie goes to the wound.</p>
      <p class="cc-dice">${liveDice([...Array.from({ length: r.two ? 2 : 1 }, () => [r.conf, "you"]), [r.wound, "harm", "is-vs"]])}<span>Your Confidence, d${r.conf}${r.two ? " twice" : ""}, against your wound die, d${r.wound}</span></p>
      <button type="button" class="cc-line" data-act="rest-two"${pressed(r.two)}><span class="tick" aria-hidden="true"></span><span>Tend the Crew: roll two, and the best counts <small>when someone in the scene has it</small></span></button>
      <p class="cc-lead">Then it’s a new scene: Aura full, 1 Resolve back and Confidence back to d${c.numbers.confidence}. ${link("s-blaze", "Wounds in the rules")}</p></div>
    <div class="dlg-foot"><button type="button" class="button primary" data-act="rest-go">Roll</button><button type="button" class="button" data-act="rest-real">Roll real dice</button></div>`;
  }
  const spin = r.spinning;
  const first = r.mine.findIndex((m) => m.nat === best);
  const die = (size, nat, cls) => kitDie(size, { own: cls === "them" ? "harm" : "you", face: nat, spin, label: spin ? `A d${size}, rolling` : `A d${size} that came up ${nat}` });
  const verdict = won ? `Your ${best} beats its ${r.opp}, so your wound’s a d${Math.max(floorOf(s, c), sizeDown(r.wound))} for the next scene.`
    : best === r.opp ? `Your ${best} ties it, and a tie goes to the wound, so it stays a d${r.wound}.` : `Its ${r.opp} beats your ${best}, so it stays a d${r.wound}.`;
  const two = r.mine.length > 1;
  const said = won ? (two ? "Your best beats it" : "Beats it") : best === r.opp ? (two ? "Your best ties it" : "A tie") : two ? "Your best doesn’t beat it" : "Under";
  return `${head}<div class="dlg-body cc-moment">
    <div class="cc-stage n${Math.min(4, r.mine.length)}">
    <ul class="cc-res"${spin ? ' data-act="skip"' : ""}>${r.mine.map((m, i) => `<li class="res is-${spin ? "spin" : i === first ? (won ? "beat" : best === r.opp ? "tie" : "under") : "none"}">${die(m.size, m.nat, "on")}<span class="res-die">Confidence d${m.size}</span>${!spin && i === first ? `<b class="res-out">${said}</b>` : ""}</li>`).join("")}</ul>
    <div class="cc-them is-wound"${spin ? ' data-act="skip"' : ""}><span class="vs" aria-hidden="true">against</span><span class="k">Your wound die, d${r.wound}</span>${die(r.wound, r.opp, "them")}</div>
    ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}</div>
    ${spin ? "" : `<p class="cc-lead cc-said" role="status">${esc(verdict)}</p>
      ${!won && resolve >= 1 ? '<div class="cc-row cc-offers"><button type="button" class="button sm" data-act="rest-again">Roll yours again: 1 Resolve</button></div>' : ""}
      ${r.rerolls ? `<ul class="cc-log"><li>Paid ${r.rerolls} Resolve to roll again.</li></ul>` : ""}`}
  </div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="rest-done"${off(spin)}>Start the next scene</button></div>`;
}

function finishRest() {
  const r = roll;
  const ch = current();
  if (!r || r.kind !== "rest" || !ch) return;
  const best = r.mine.length ? Math.max(...r.mine.map((m) => m.nat)) : 0;
  let message = "";
  const last = undo[undo.length - 1];
  change("starting a new scene", (s, c) => {
    s.resolve = Math.max(0, s.resolve - r.rerolls);
    const won = best > r.opp;
    if (won) s.wound = Math.max(floorOf(s, c), sizeDown(s.wound));
    endScene(s, c);
    message = `${sceneSaid(s)} ${won ? `You rested, and your wound’s down to d${s.wound}.` : `Your wound’s still a d${s.wound}.`}`;
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
  <div class="dlg-body cc-rule">${r.perm ? "<p><b>It’s a step on any roll it fits.</b> On the set action you’re rolling, it’s free. Bring it into anything else for 1 Aura.</p>" : ""}${ruleHtml(r.id)}</div>
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
  if (roll.kind === "tele" || roll.kind === "tg-pick") return table.dialog(roll);
  const c = normal(ch);
  if (!c) return "";
  const s = ch.state;
  if (roll.kind === "downtime") return dt.view(c, s, ch, roll);
  if (roll.kind === "rest") return restView(c, s);
  if (roll.kind === "defence") {
    if (roll.mode === "build") return defenceBuild(c, s);
    if (roll.mode === "pad") {
      const rows = [...roll.mine.map((m, i) => [`Your ${roll.against === "blows" ? "Defend" : "Confidence"}, a d${m.size}`, `m${i}`, m.size, m.nat]), ...roll.incoming.map((d, j) => [`Their d${d}${String(roll.intents[`d${j}`] ?? "").trim() ? ` · ${esc(String(roll.intents[`d${j}`]).trim())}` : ""}`, `o${j}`, d, roll.opp[j]])];
      return padView("When it lands", rows, roll.mine.every((m) => m.nat) && roll.opp.every(Boolean));
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

function render() {
  const keep = dialog.open ? null : sig(document.activeElement);
  const ch = current();
  const c = ch ? normal(ch) : null;
  if (c) settleMarks(ch, c);
  else ui.gold = null;
  document.documentElement.classList.toggle("cc-tabbed", view.name === "sheet" && Boolean(c));
  // A character's full screen, without the site's bar, and the builder's,
  // with its own bar of Back and Next at the bottom.
  // A campaign, a look at a player's character and joining are full screen too.
  const camping = view.name === "camp" || view.name === "look" || view.name === "join" || view.name === "world";
  document.documentElement.classList.toggle("cc-full", view.name === "sheet" || view.name === "build" || camping);
  app.innerHTML = view.name === "build" ? builderView() : view.name === "learn" ? learn.view() : view.name === "world" ? world.view(view) : camping ? camps.view(view) : view.name !== "sheet" ? listView() : c ? characterView(ch, c) : missingView(ch);
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
  glow(ch);
  if (dialog.open) renderDialog();
  else refocus(keep);
  if (view.name === "learn") learn.after(app);
}

// Aura and Resolve pop in as they come back, and Confidence and the wound die
// grow into their new shapes. The trackers remember what they showed last
// time, for this character.
function glow(ch) {
  // Behind the roll card nothing's seen, so it glows when the card closes.
  if (dialog.open) return;
  const s = ch?.state;
  const was = ui.seen && ui.seen.id === ch?.id ? ui.seen : null;
  ui.seen = s ? { id: ch.id, aura: s.aura, resolve: s.resolve, wound: s.wound, conf: s.conf, scars: s.scars.length } : null;
  if (!was || !s) return;
  const lit = (sel, from, to) => [...app.querySelectorAll(sel)].slice(from, to).forEach((el) => el.classList.add("is-new"));
  if (s.aura > was.aura) lit(".t-aura .zd-chit", was.aura, s.aura);
  if (s.resolve > was.resolve) lit(".t-resolve .zd-gem", was.resolve, s.resolve);
  if (was.conf != null && s.conf !== was.conf) {
    app.querySelector(".t-conf")?.classList.add(s.conf > was.conf ? "is-up" : "is-down");
    // Confidence and the wound die grow, or shrink, into their new shapes.
    growDie(app.querySelector(".t-conf .zd-die"), was.conf, s.conf);
  }
  if (s.wound !== was.wound) {
    app.querySelector(".t-wound")?.classList.add(s.wound > was.wound ? "is-up" : "is-down");
    growDie(app.querySelector(".t-wound .zd-die"), was.wound, s.wound);
  }
  if (s.scars.length > (was.scars ?? 0)) lit(".t-wound .zd-scars i", was.scars ?? 0, s.scars.length);
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
  const learning = !key && !id && q.has("learn");
  const camp = !key && !id && !learning ? q.get("camp") : null;
  const joining = !key && !id && !learning && !camp && q.has("join");
  if (view.name === "learn" && !learning) learn.stop();
  // Leaving the builder keeps the draft, and coming back reads it again.
  if (view.name === "build" && view.key !== key) builder.close();
  // A Sheet tab fold shut on one character opens as usual on another.
  if (id !== (view.name === "sheet" ? view.id : null)) ui.shut.clear();
  view = key ? { name: "build", key } : learning ? { name: "learn" } : id ? { name: "sheet", id }
    : camp ? (q.get("look") ? { name: "look", id: camp, who: q.get("look") } : q.has("world") ? { name: "world", id: camp, f: q.get("f") || "" } : { name: "camp", id: camp }) : joining ? { name: "join" } : { name: "list" };
  ui.tab = ["sheet", "rules", "party", "world"].includes(q.get("t")) ? q.get("t") : "play";
  ui.panel = null;
  ui.sure = false;
  document.documentElement.classList.toggle("cc-open", Boolean(id || key || learning || camp || joining));
  const ch = current();
  document.title = key ? `${key === "new" ? "Make your own" : "Change a character"} · Zi’Dara` : learning ? "Learn to play · Zi’Dara" : ch ? `${ch.name} · Zi’Dara` : view.name === "world" ? `${world.title(view)} · Zi’Dara` : camp || joining ? `${camps.title(view)} · Zi’Dara` : "Characters · Zi’Dara";
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

// The builder, for a new character or changing one on this phone, the crew
// included. One of the crew becomes your own once a change is saved.
function builderView() {
  const ch = view.key === "new" ? null : chars().find((x) => x.id === view.key);
  if (view.key !== "new" && !canChange(ch)) return missingView(null);
  return builder.view(view.key, ch ? () => editBuild(ch) : null, ch ? { basis: basisOf(ch), crew: ch.build ? null : CREW.get(ch.crew).name } : {});
}
function navBuild(key) {
  history.pushState(null, "", key && key !== "new" ? `/characters/?build=${encodeURIComponent(key)}` : "/characters/?build");
  route();
  scrollTo(0, 0);
  app.querySelector("h1")?.focus({ preventScroll: true });
}
function saveBuilt(build, key, discard, basis) {
  const name = build.name.trim() || "Nameless";
  // What each line said when the change began only matters until it's saved.
  const clean = JSON.parse(JSON.stringify(build, (k, v) => (k === "was" || k === "bagWas" ? undefined : v)));
  let ch = key === "new" ? null : chars().find((x) => x.id === key);
  // They changed somewhere else while this was open (a downtime on another
  // phone or tab, say), so it starts again from them as they are now rather
  // than saving over it.
  if (ch && basis && canChange(ch) && basis !== basisOf(ch)) {
    const [, their] = PRONOUN[sheetFor(ch)?.pronoun] ?? PRONOUN.them;
    discard();
    render();
    scrollTo(0, 0);
    app.querySelector("h1")?.focus({ preventScroll: true });
    toast(`${ch.name}’s sheet changed on another phone or tab while this was open, so your changes here weren’t saved. It starts again from ${their} sheet as it is now.`, false);
    return;
  }
  let became = false;
  if (ch && !sheetFor(ch)) ch = null;
  const isNew = !ch;
  if (ch) {
    // Anything that was full stays full when the sheet's new number is bigger.
    normal(ch);
    const old = sheetFor(ch);
    const was = old.numbers;
    const before = said(old);
    const s = ch.state;
    // One of the crew becomes your own, and stops following the chapter.
    if (!ch.build) {
      ch.from = ch.crew;
      ch.crew = "own";
      ch.hash = "own";
      became = true;
    }
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
    // What they grew in downtime, and the Aspiration's words, are in the build now.
    s.grown = [];
    s.aspText = "";
    const now = sheetFor(ch).numbers;
    for (const [k, n] of [["aura", "aura"], ["resolve", "resolve"], ["conf", "confidence"]]) if (s[k] === was[n]) s[k] = now[n];
    // What they changed in the builder is theirs, so it doesn't get a gold mark,
    // and an undo from before the builder can't bring the old sheet back.
    if (s.seen) s.seen = ownChanges(s.seen, before, said(sheetFor(ch)));
    for (let i = undo.length - 1; i >= 0; i--) if (undo[i].id === ch.id) undo.splice(i, 1);
  } else {
    const tag = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
    ch = { id: `own-${tag}`, crew: "own", name, made: new Date().toISOString(), hash: "own", build: clean };
    ch.state = { ...fresh(sheetFor(ch)), seen: said(sheetFor(ch)) };
    sync.claim(ch);
    chars().push(ch);
  }
  normal(ch);
  ch.saved = new Date().toISOString();
  const kept = store.save();
  discard();
  // Someone made on the way into a campaign goes back there, picked.
  if (isNew && kept && camps.made(ch)) return;
  history.replaceState(null, "", `/characters/?c=${encodeURIComponent(ch.id)}`);
  route();
  scrollTo(0, 0);
  const [they, their] = PRONOUN[ch.build.pronoun] ?? PRONOUN.them;
  toast(kept ? `${name}’s saved ${ch.acct ? "in your account" : "on this phone"}.${became ? ` ${cap(they)}${they === "they" ? "’re" : "’s"} your own now, so ${their} sheet stays as you’ve made it.` : ""}` : "This phone isn’t letting the site save, so they’re gone when you close the page.", false);
}
function nav(id) {
  history.pushState(null, "", id ? `/characters/?c=${encodeURIComponent(id)}` : "/characters/");
  route();
  scrollTo(0, 0);
}

function start(crewId, name) {
  const c = CREW.get(crewId);
  if (!c) return;
  const tag = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
  const id = `${crewId}-${tag}`;
  const ch = { id, crew: crewId, name: name || c.name, made: new Date().toISOString(), hash: c.hash, state: { ...fresh(c), seen: said(c) } };
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

// The end of downtime: what the slots bought goes on the sheet, then it's a
// new scene with Resolve full, all as one change with one undo. A card with
// an empty or unfinished slot asks for a second tap first.
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
    const hurt = s.wound;
    const happened = dt.apply(s, was, d);
    const now = sheetFor(ch);
    endScene(s, now);
    s.resolve = now.numbers.resolve;
    // Downtime clears your wound die to your Scars, free.
    s.wound = floorOf(s, now);
    if (hurt > s.wound) happened.push(`Your wound die’s back to d${s.wound}`);
    if (s.seen) s.seen = ownChanges(s.seen, before, said(now));
    const moved = now.actions.filter((a) => was.actions.some((x) => x.name === a.name && x.steps !== a.steps)).map((a) => `${a.name} is ${steps(a.steps)}, ${a.die}`);
    message = `Downtime’s done. ${[...happened, ...moved].map((x) => `${x}.`).join(" ")} Resolve’s full at ${s.resolve}.`.replace(/\s+/g, " ");
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
    if (name === "other") r.other = clamp(r.other + d, 0, 9);
    if (name === "count") r.count = clamp(p.count + d, p.fewest, p.most);
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

const ACT = {
  k: (el, e) => camps.act(el, e),
  tg: (el, e) => table.act(el, e),
  p: (el, e) => party.act(el, e),
  pundo: () => party.undo(),
  w: (el, e) => world.act(el, e),
  wundo: () => world.undo(),
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
  async print() {
    const ch = current();
    const c = ch && normal(ch);
    if (!c || ui.printing) return;
    ui.printing = true;
    render();
    try {
      const { short } = await printSheet(ch, c, ch.state, { goal: party.goalOf(ch) });
      toast(`${ch.name}’s sheet is filled in and ready to print.${short ? " Notes ran out of room on the paper, so the end got cut off. Copy the rest in by hand from the Sheet tab." : ""}`, false);
    } catch (e) {
      console.warn(e);
      toast("The sheet couldn’t be filled in. Open the companion once with a signal, then try again.", false);
    } finally {
      ui.printing = false;
      render();
    }
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
  aura: (el) => change(Number(el.dataset.d) > 0 ? "getting 1 Aura back" : el.dataset.why === "intercept" ? "intercepting for a friend" : "spending 1 Aura", (s, c) => {
    if (Number(el.dataset.d) > 0) {
      const full = gainAura(s, c);
      return `Aura’s ${s.aura}.${full}`;
    }
    if (s.aura < 1) return "";
    s.aura -= 1;
    if (el.dataset.why === "intercept") return `You step in for them, and Aura’s ${s.aura}. When the telegraphs land, add the dice you took to yours.`;
    return `Aura’s ${s.aura}.`;
  }),
  resolve: (el) => change(Number(el.dataset.d) > 0 ? "getting 1 Resolve back" : "spending 1 Resolve", (s, c) => {
    if (Number(el.dataset.d) > 0) {
      const full = gainResolve(s, c);
      return `Resolve’s ${s.resolve}.${full}`;
    }
    s.resolve = Math.max(0, s.resolve - 1);
    return `Resolve’s ${s.resolve}.`;
  }),
  conf: (el) => change("changing your Confidence", (s) => {
    s.conf = even(el.dataset.v, 2, 12);
    return `Confidence is d${s.conf}.`;
  }),
  "conf-step": (el) => change(Number(el.dataset.d) > 0 ? "Confidence going up" : "Confidence dropping", (s) => {
    s.conf = Number(el.dataset.d) > 0 ? sizeUp(s.conf) : sizeDown(s.conf);
    return `Confidence is d${s.conf}.`;
  }),
  // Take a breath: up a size, as far as d6. On d2 it's pulling yourself together.
  breath: () => change("taking a breath", (s) => {
    if (s.conf >= 6) return "";
    const shaken = s.conf <= 2;
    s.conf = Math.min(6, sizeUp(s.conf));
    return shaken ? `You pull yourself together, and your Confidence is back up to d${s.conf}. That was your action.` : `You take a breath. Confidence is d${s.conf}. That was your action.`;
  }),
  cash: (el) => change("cashing in your Confidence", (s, c) => {
    s.conf = 6;
    if (el.dataset.how === "heal") return `Cashed in, and Confidence is back to d6. ${healOne(s, c)}`;
    return "Cashed in for an extra action this round. Confidence is back to d6.";
  }),
  "wound-set": (el) => change("changing your wound die", (s, c) => {
    s.wound = even(el.dataset.v, floorOf(s, c), 12);
    return `Your wound die’s a d${s.wound}.`;
  }),
  quickheal: () => change("a quick heal", (s, c) => {
    if (s.aura < 1 || s.wound <= floorOf(s, c)) return "";
    s.aura -= 1;
    return `A quick heal for 1 Aura, and it took your action. ${healOne(s, c)}`;
  }),
  "asp-set": (el) => change("changing your Aspiration", (s) => {
    s.asp = even(el.dataset.v, 2, 12);
    return `Your Aspiration’s on d${s.asp}.`;
  }),
  asp: (el) => change(Number(el.dataset.d) > 0 ? "your Aspiration climbing" : "a setback", (s) => {
    if (Number(el.dataset.d) < 0) {
      s.asp = sizeDown(s.asp);
      return `A setback. Your Aspiration’s on d${s.asp}.`;
    }
    if (s.asp >= 12) {
      s.asp = 2;
      return "It climbs past d12 and resolves. Take a new archetype with one permission, name it with a Title, and write your new Aspiration in. It starts at d2. Add the Title with Change, at the top of the Sheet tab.";
    }
    s.asp = sizeUp(s.asp);
    return `It climbs. Your Aspiration’s on d${s.asp}.`;
  }),
  scene: () => newScene(),
  "rest-two"() {
    roll.two = !roll.two;
    renderDialog();
  },
  "rest-go": () => restRoll(false),
  "rest-real": () => restRoll(true),
  "rest-again"() {
    const s = current()?.state;
    if (!s || s.resolve - roll.rerolls < 1) return;
    roll.rerolls += 1;
    restRoll(roll.real, true);
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
  roll: (el) => openAction(Number(el.dataset.a)),
  // When it lands starts with whatever landed on this character, if they're
  // playing in a campaign whose round has just ended.
  defence: () => openDefence(table.landedFor(current())),
  used: (el) => change("using a trait", (s) => {
    const name = el.dataset.n;
    if (s.used[name]) delete s.used[name];
    else s.used[name] = true;
    return s.used[name] ? `${name}’s used for this scene.` : `${name}’s ready again.`;
  }),
  "trait-aura": (el) => change("a trait’s Aura", (s, c) => {
    const t = c.traits.find((x) => x.name === el.dataset.n);
    if (!t) return "";
    if (/once per scene/i.test(t.type)) s.used[t.name] = true;
    return `${t.name}: ${t.aura} Aura.${gainAura(s, c, t.aura)}`;
  }),
  "arch-aura": (el) => change(`1 Aura on your ${el.dataset.n}`, (s) => {
    if (s.aura < 1) return "";
    s.aura -= 1;
    return `Spent 1 Aura on your ${el.dataset.n}. Aura’s ${s.aura}.`;
  }),
  "arch-resolve": (el) => change(`1 Resolve on your ${el.dataset.n}`, (s) => {
    if (s.resolve < 1) return "";
    s.resolve -= 1;
    return `Spent 1 Resolve on your ${el.dataset.n}. Resolve’s ${s.resolve}.`;
  }),
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
  hurt: (el) => change(Number(el.dataset.d) > 0 ? "taking a Hurt" : "a heal", (s, c) => (Number(el.dataset.d) > 0 ? takeHurt(s, c) : healOne(s, c))),
  die: () => change("their death", (s, c, ch) => {
    s.blaze = false;
    s.dead = true;
    return `${ch.name} dies, and what they died for happens.`;
  }),
  // The GM can take a Scar away when the story's earned it: Catch and all.
  unscar: (el) => change("a Scar taken away", (s, c) => {
    const [gone] = s.scars.splice(Number(el.dataset.i), 1);
    if (gone == null) return "";
    return `${gone ? `${cap(gone)} is gone, Catch and all` : "The Scar’s gone"}, so your wound die can come down to d${floorOf(s, c)} now.`;
  }),
  shaken() {
    roll.shaken = !counted(roll, normal(current()), current().state).shaken;
    renderDialog();
  },
  "d-cond"(el) {
    const ch = current();
    const x = ch.state.conditions.find((y) => y.name === el.dataset.k);
    if (!x) return;
    roll.dconds = { ...roll.dconds, [x.name]: !defenceCondOn(x, roll) };
    roll.shape = 0;
    renderDialog();
  },
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
  round: () => change("the end of the round", (s) => {
    const gone = s.conditions.filter((x) => x.die <= 2).map((x) => x.name);
    s.conditions = s.conditions.filter((x) => x.die > 2).map((x) => ({ ...x, die: x.die - 2 }));
    return `End of round. Every condition steps down a size${gone.length ? `, and ${gone.join(" and ")} ${gone.length > 1 ? "are" : "is"} gone` : ""}.`;
  }),
  // A bond thread: strain it for 1 Resolve, and again before it's mended it
  // snaps. A crewmate's thread is on their sheet too, so they're told.
  strain: (el) => change("straining a thread", (s, c) => {
    const found = threadAt(c, el.dataset.k);
    if (!found || found.t.kind === "hostile") return "";
    const st = threadState(s, found.person, found.t);
    if (st === "snapped") return "";
    const snapped = st === "strained";
    s.threads[el.dataset.k] = snapped ? "snapped" : "strained";
    return `${snapped ? "It snaps, so it’s crossed out." : "Strained."} You take 1 Resolve.${gainResolve(s, c)}${tellCrew(found.person, snapped ? "crossed out" : "strained", c)}`;
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
    return `You borrow one of ${found.person}’s permissions for 1 Aura, so it’s a step on the roll it fits. Aura’s ${s.aura}.`;
  }),
  // A Catch, a Scar, trouble or a hostile thread biting. With Aura or Resolve
  // already full there's nothing to save, but the player's still told.
  bite: (el) => {
    const big = el.dataset.big === "1";
    const ch = current();
    const c = ch && normal(ch);
    if (!c) return;
    if (big ? ch.state.resolve >= c.numbers.resolve : ch.state.aura >= c.numbers.aura) return toast(big ? "A big bite. Your Resolve’s already full." : "Real trouble. Your Aura’s full, so give 1 to a friend in the scene.", false);
    change(big ? "a big bite" : "letting it bite", (s) => (big ? `A big bite. You take 1 Resolve.${gainResolve(s, c)}` : `Real trouble. You take 1 Aura.${gainAura(s, c)}`));
  },

  // The roll and defence dialogs.
  close: () => closeDialog(),
  off(el) {
    const k = el.dataset.k;
    if (roll.off.has(k)) roll.off.delete(k);
    else roll.off.add(k);
    roll.shape = 0;
    renderDialog();
  },
  in(el) {
    const k = el.dataset.k;
    if (roll.in.has(k)) roll.in.delete(k);
    else roll.in.add(k);
    roll.shape = 0;
    renderDialog();
  },
  cond(el) {
    const k = el.dataset.k;
    if (roll.conds.has(k)) roll.conds.delete(k);
    else roll.conds.add(k);
    roll.shape = 0;
    renderDialog();
  },
  step(el) {
    stepRoll(el.dataset.n, Number(el.dataset.i), Number(el.dataset.d));
    renderDialog();
  },
  "friend-on"() {
    roll.friends.push(4);
    roll.shape = 0;
    renderDialog();
  },
  "friend-off"(el) {
    roll.friends.splice(Number(el.dataset.i), 1);
    roll.shape = 0;
    renderDialog();
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
    renderDialog();
  },
  "pad-done": () => {
    // The rest roll counts nothing until the next scene starts.
    if (roll?.kind === "rest") {
      roll.mode = "result";
      roll.padOpp = false;
      renderDialog();
      return landed(false);
    }
    change("your roll", (s, c) => {
      roll.mode = "result";
      if (roll.kind === "defence") settleDefence(s, c);
      else settle(s, c, roll.pads);
      roll.pads = [];
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
    if (el.dataset.do !== "open") return learn.act(el);
    e.preventDefault();
    learn.open();
    history.pushState(null, "", "/characters/?learn");
    route();
    scrollTo(0, 0);
  },
  "win-tie": (el) => change("winning a tie", (s) => {
    const d = roll.dice[Number(el.dataset.i)];
    if (s.aura < 1 || !d) return;
    s.aura -= 1;
    d.won = true;
    roll.log.push(`Paid 1 Aura to win the tie on the d${d.size}.`);
    swingRoll(s);
    s.last = lastOf();
  }, { say: false }),
  borrow(el) {
    const k = el.dataset.k;
    if (roll.borrow.has(k)) roll.borrow.delete(k);
    else roll.borrow.add(k);
    roll.shape = 0;
    renderDialog();
  },
  plus(el) {
    const a = normal(current()).archetypeRules.find((x) => x.name === el.dataset.n);
    if (!a) return;
    roll.pick = { type: "plus", name: a.name, bonus: a.bonus, mark: /\bMark\b/.test(a.aura) };
    renderDialog();
  },
  reroll() {
    roll.pick = { type: "reroll" };
    renderDialog();
  },
  "pick-cancel"() {
    roll.pick = null;
    renderDialog();
  },
  pick: (el) => (roll.pick?.type === "reroll" ? reroll([Number(el.dataset.i)]) : plusOn(Number(el.dataset.i))),
  "reroll-all": () => reroll(roll.dice.map((_, i) => i)),
  "d-pick": (el) => plusOn(Number(el.dataset.i)),
  "d-against"(el) {
    if (roll.teles?.some(Boolean)) return;
    if (roll.against !== el.dataset.v) Object.assign(roll, { intents: {}, owns: new Set() });
    roll.against = el.dataset.v;
    Object.assign(roll, { dconds: {}, count: null, shape: 0 });
    renderDialog();
  },
  "d-defend"(el) {
    roll.defend = el.dataset.v === "1";
    Object.assign(roll, { count: null, shape: 0 });
    renderDialog();
  },
  "d-add"(el) {
    roll.incoming.push(Number(el.dataset.v));
    roll.teles?.push(null);
    renderDialog();
  },
  "d-del"(el) {
    const i = Number(el.dataset.i);
    const intents = {};
    const owns = new Set();
    roll.incoming.splice(i, 1);
    roll.teles?.splice(i, 1);
    roll.incoming.forEach((_, j) => {
      const from = `d${j < i ? j : j + 1}`;
      if (from in roll.intents) intents[`d${j}`] = roll.intents[from];
      if (roll.owns.has(from)) owns.add(`d${j}`);
    });
    Object.assign(roll, { intents, owns });
    renderDialog();
  },
  // Tap Swap on one blow, then another, and they trade the rolls blocking them.
  "d-swap"(el) {
    const j = Number(el.dataset.j);
    const first = roll.swap;
    if (first == null || first === j) {
      roll.swap = first === j ? null : j;
      return renderDialog();
    }
    roll.swap = null;
    change("swapping two rolls", (s) => {
      [roll.assign[first], roll.assign[j]] = [roll.assign[j], roll.assign[first]];
      roll.swapped = true;
      swingDefence(s);
    }, { say: false });
  },
  "d-pay"(el) {
    const j = Number(el.dataset.j);
    const what = el.dataset.what;
    const label = { cond: "a condition landing", break: "something breaking", box: "your armour taking it", vbox: "your armour taking one more", hurt: "taking a Hurt", vuln: "another Hurt", nothing: "1 Resolve on a hit", asp: "a setback", shake: "Confidence dropping", hold: "holding your ground" }[what] ?? "what it cost";
    change(label, (s, c) => {
      const r = roll;
      if (!r || (r.paid[j] && what !== "vuln" && what !== "vbox")) return;
      r.harm ??= {};
      const size = r.incoming[j];
      const from = s.conf;
      const wound = s.wound;
      // A Hurt that puts the wound die up takes Confidence down with it.
      const hurt = (n) => {
        const said = takeHurt(s, c);
        if (!/^You take a Hurt/.test(said)) r.log.push(said);
        if (s.wound > wound) r.moves.push(s.conf < from ? { d: -1, text: `${n} put your wound die up to d${s.wound}` } : { d: 0, text: `${n} put your wound die up, and you’re on d2 already` });
        else r.moves.push({ d: 0, text: `${n} didn’t move your wound die, so it doesn’t move either` });
      };
      if (what === "cond") {
        const x = condOf(r.intents[`d${j}`]);
        if (!x) return;
        s.conditions = s.conditions.filter((y) => y.name !== x.name);
        s.conditions.push({ name: x.name, die: size, kind: "against" });
        r.paid[j] = `${x.name} d${size} on you`;
      } else if (what === "break") {
        // Crossed out until it's mended, and off your Defend till then.
        const key = el.dataset.k;
        if (!key || s.crossed[key]) return;
        s.crossed[key] = true;
        const thing = key.split("|").slice(1).join("|");
        r.paid[j] = `${cap(thing)} broken till it’s mended`;
        r.moves.push({ d: 0, text: `${esc(cap(thing))} took the blow, so it doesn’t move` });
      } else if (what === "box" || what === "vbox") {
        // A piece of armour takes it on a box, and its last box breaks it,
        // so it's off your Defend till it's mended. A vulnerability's one
        // more, on this piece or another.
        const a = pieceAt(c, el.dataset.k);
        if (!a || r.against !== "blows" || leftOf(s, a) < 1 || (what === "vbox" && (!r.harm[j] || (r.extra[j] ?? 0) >= vulnsOn(s).length))) return;
        const n = tickBox(s, a);
        const last = n >= a.boxes;
        // Kept short, since the GM's phone keeps 80 letters of it.
        if (what === "vbox") {
          r.extra[j] = (r.extra[j] ?? 0) + 1;
          r.paid[j] = `${r.paid[j]}, and ${yours(a)} took one more${last ? " and broke" : ` (${n} of ${a.boxes})`}`;
        } else r.paid[j] = last ? `${cap(yours(a))} took it and broke` : `${cap(yours(a))} took it: ${n} of ${a.boxes} ticked`;
        r.harm[j] = true;
        r.moves.push({ d: 0, text: `${esc(cap(yours(a)))} took the blow, so it doesn’t move` });
      } else if (what === "vuln") {
        // A vulnerability makes the same hit one more Hurt.
        if (!r.harm[j] || (r.extra[j] ?? 0) >= vulnsOn(s).length) return;
        r.extra[j] = (r.extra[j] ?? 0) + 1;
        r.paid[j] = /^Took (a|\d+) Hurts?$/.test(r.paid[j] ?? "") ? `Took ${Number(r.paid[j].match(/\d+/)?.[0] ?? 1) + 1} Hurts` : `${r.paid[j]}, and a Hurt`;
        hurt(`The Hurt for being ${esc(vulnsOn(s)[r.extra[j] - 1] ?? "vulnerable")}`);
      } else if (what === "nothing" && s.resolve > 0) {
        s.resolve -= 1;
        r.paid[j] = "It does nothing, for 1 Resolve";
      } else if (what === "asp" && s.asp > 2) {
        s.asp = sizeDown(s.asp);
        r.paid[j] = `Aspiration down to d${s.asp}`;
      } else if (what === "shake") {
        // Fear through: a size of Confidence, and on d2 a Hurt instead.
        if (s.conf > 2) {
          s.conf = sizeDown(s.conf);
          r.paid[j] = `Confidence down to d${s.conf}`;
          r.moves.push({ d: -1, text: `Their d${size} got through` });
        } else {
          r.paid[j] = "A Hurt, since you’re on d2";
          r.harm[j] = true;
          hurt(`The Hurt from their d${size}`);
        }
      } else if (what === "hold" && s.resolve > 0) {
        s.resolve -= 1;
        r.paid[j] = "Held your ground for 1 Resolve";
        if (r.against !== "blows") r.moves.push({ d: 0, text: `You held your ground against their d${size}` });
      } else if (what === "hurt") {
        r.paid[j] = "Took a Hurt";
        r.harm[j] = true;
        hurt("The Hurt");
      }
    }, { say: false });
  },
  "d-go": () => defenceGo(false),
  "d-real": () => defenceGo(true),
};

// 1 Aura on the archetype's +2 (or +3 when it's taken twice).
function plusOn(i) {
  const pick = roll.pick;
  if (!pick || pick.type !== "plus") return;
  const list = roll.kind === "defence" ? roll.mine : roll.dice;
  const d = list[i];
  if (!d || d.plus || (roll.kind === "action" && Boolean(d.mark) !== Boolean(pick.mark))) return;
  change(`${pick.name} +${pick.bonus}`, (s) => {
    if (s.aura < 1) return;
    s.aura -= 1;
    d.plus = pick.bonus;
    roll.pick = null;
    roll.log.push(`Paid 1 Aura for ${pick.name} +${pick.bonus} on the d${d.size}${d.nat + d.plus >= d.size && d.nat !== d.size ? ". The +" + pick.bonus + " took it there, so there’s no Aura back" : ""}.`);
    if (roll.kind === "action") {
      swingRoll(s);
      s.last = lastOf();
    } else {
      if (!roll.paid.some(Boolean) && !roll.swapped) assignBest(roll);
      swingDefence(s);
    }
  }, { say: false });
}

// 1 Resolve to roll again: all your dice or just one. Their dice stay put.
function reroll(which) {
  change("rolling again", (s, c) => {
    if (s.resolve < 1) return;
    s.resolve -= 1;
    roll.pick = null;
    roll.log.push(`Paid 1 Resolve to roll ${which.length === roll.dice.length && which.length > 1 ? "them all" : `the d${roll.dice[which[0]].size}`} again.`);
    for (const i of which) Object.assign(roll.dice[i], { nat: 0, plus: 0, won: false });
    if (roll.real) {
      roll.mode = "pad";
      roll.pads = which;
      roll.padOpp = false;
    } else {
      for (const i of which) roll.dice[i].nat = throwDie(roll.dice[i].size);
      settle(s, c, which);
      roll.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
  else if (!roll?.real && roll?.mode === "result") landed(true);
}

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
  if (kind === "name") return start(roll?.crew, String(f.get("name") ?? "").trim().slice(0, 40));
  // A Blaze they live through: the wound becomes a Scar, a Catch, and the
  // wound die drops back to the Scars.
  if (kind === "scar") {
    const text = String(f.get("scar") ?? "").trim().slice(0, 80);
    change("taking a Scar", (s, c) => {
      if (!s.blaze || s.scars.length >= MAX_SCARS) return "";
      s.blaze = false;
      s.scars.push(text);
      s.wound = floorOf(s, c);
      return `You leave the scene with a Scar${text ? `, ${text}` : ""}. Your wound die’s back to d${s.wound}, and it never goes below that.${text ? " Let it bite whenever you like, for 1 Aura." : " Write it in as a Catch on the wound die’s panel."}`;
    });
    return;
  }
  if (kind === "scar-text") {
    const text = String(f.get("text") ?? "").trim().slice(0, 80);
    const i = Number(form.dataset.i);
    if (text) change("writing a Scar in", (s) => {
      if (s.scars[i] == null) return "";
      s.scars[i] = text;
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
    const max = where === "bag" ? c.carry.bag.max : c.carry[where]?.max ?? 0;
    const has = (where === "bag" ? c.carry.bag.items?.length ?? 0 : c.carry[where].items.length) + ch.state.picked.filter((p) => p.where === where).length;
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
  if (key === "extra") {
    roll.extra = Number(el.value);
    roll.shape = 0;
    renderDialog();
  } else if (key === "via") {
    roll.via = el.value;
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
  if (e.target.dataset?.tg != null && roll?.kind === "tele") return table.input(e.target, roll);
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
  if (key.startsWith("bd-")) builder.toggled(e.target);
  if (e.target.open) ui.open.add(key);
  else ui.open.delete(key);
  // A Sheet tab fold the player shut stays shut, even one holding a gold mark,
  // and so does any other fold that's open until it's shut (data-shut).
  if (key.startsWith("sh-") || e.target.hasAttribute("data-shut")) {
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
route();
sync.pull();
