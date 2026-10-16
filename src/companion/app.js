// The character companion: one of the six crew on your phone, saved on the
// phone and working offline. Every number on a sheet comes from the current
// rules (the JSON the build puts in the page), and only what the player
// changes in play is saved (store.js). Views are HTML strings, and one click
// handler reads data-act. Every change goes through change(), so it saves,
// redraws and can be undone.
import { SIZES, diceLabel, diceRange, diceShapes, rollDie, sizeDown, sizeUp, stepsToDice } from "./dice.js";
import { openStore } from "./store.js";

const DATA = JSON.parse(document.getElementById("zi-companion").textContent);
const CREW = new Map(DATA.crew.map((c) => [c.id, c]));
const LINK = DATA.links;
const COND = new Map(DATA.conditions.map((x) => [x.name, x]));
const store = openStore();
const app = document.getElementById("app");
const dialog = document.getElementById("cc-dialog");
const toastBox = document.getElementById("cc-toast");
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const ORD = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

let view = { name: "list" };
let roll = null; // whatever the open dialog is working on
const ui = { panel: null, open: new Set(), toastTimer: 0, spinTimer: 0, notesTimer: 0, mode: null };
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
const link = (id, text) => `<a href="${esc(LINK[id] ?? "/rules/")}">${text}</a>`;
const hex = (text, cls = "") => `<span class="hex${cls ? ` ${cls}` : ""}">${esc(text)}</span>`;
const off = (no) => (no ? " disabled" : "");
const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
const ICON = {
  undo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
};

// ---------------------------------------------------------------- characters

const chars = () => store.data.characters;
const current = () => (view.name === "sheet" ? chars().find((x) => x.id === view.id) ?? null : null);

// Where a character starts: everything full, nothing written in yet.
function fresh(c) {
  const n = c.numbers;
  return {
    aura: n.aura, resolve: n.resolve, conf: n.confidence, armour: n.armour,
    hurt: 0, catches: [], scars: 0, blaze: false, dead: false,
    conditions: [], threads: {}, used: {}, crossed: {}, picked: [],
    asp: c.aspiration.die, aspText: "", notes: "", last: null,
  };
}

// Fill in anything missing and keep every number inside what the sheet allows
// now, in case the rules changed since this was saved.
function normal(ch) {
  const c = ch && CREW.get(ch.crew);
  if (!c) return null;
  const n = c.numbers;
  const s = Object.assign(fresh(c), ch.state && typeof ch.state === "object" ? ch.state : {});
  s.aura = clamp(s.aura, 0, n.aura);
  s.resolve = clamp(s.resolve, 0, n.resolve);
  s.conf = even(s.conf, 2, 12);
  s.armour = even(s.armour, 2, Math.max(2, n.armour));
  s.scars = clamp(s.scars, 0, n.hurtBars * 3);
  s.hurt = clamp(s.hurt, 0, n.hurtBars * 3 - s.scars);
  s.catches = (Array.isArray(s.catches) ? s.catches : []).slice(0, n.hurtBars).map(String);
  s.asp = even(s.asp, 2, 12);
  s.dead = Boolean(s.dead);
  s.conditions = (Array.isArray(s.conditions) ? s.conditions : []).filter((x) => x && x.name).map((x) => ({ name: String(x.name), die: even(x.die, 2, 12), kind: x.kind === "for" ? "for" : "against" }));
  s.picked = (Array.isArray(s.picked) ? s.picked : []).filter((p) => p && p.name && ["equipment", "utility", "bag"].includes(p.where));
  for (const key of ["threads", "used", "crossed"]) if (!s[key] || typeof s[key] !== "object") s[key] = {};
  ch.state = s;
  return c;
}

function persist() {
  const ch = current();
  if (ch) ch.saved = new Date().toISOString();
  store.save();
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
  if (JSON.stringify(ch.state) === before && snapRoll() === rollBefore) return;
  undo.push({ id: ch.id, label, state: before, roll: rollBefore });
  if (undo.length > 60) undo.shift();
  persist();
  render();
  if (say && !dialog.open) toast(message || `Done: ${label}.`, true);
}

const lastUndo = (ch) => [...undo].reverse().find((u) => u.id === ch?.id);
function undoLast() {
  const ch = current();
  const u = lastUndo(ch);
  if (!u) return;
  undo.splice(undo.lastIndexOf(u), 1);
  ch.state = JSON.parse(u.state);
  if (dialog.open && roll) roll = unsnapRoll(u.roll) ?? roll;
  if (roll) roll.spinning = false;
  persist();
  render();
  if (!dialog.open) toast(`Undone: ${u.label}.`, false);
}

function toast(message, canUndo) {
  toastBox.innerHTML = `<p>${esc(message)}</p>${canUndo ? '<button type="button" class="button" data-act="undo">Undo</button>' : ""}`;
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

// The Hurt track: bars of three boxes, filled in order. A Scar crosses out a box
// for good, from the end. A bar's full when every open box in it is filled.
function hurtInfo(s, c) {
  const bars = c.numbers.hurtBars;
  const open = bars * 3 - s.scars;
  const full = [];
  for (let b = 0; b < bars; b++) {
    const boxes = [b * 3, b * 3 + 1, b * 3 + 2].filter((i) => i < open);
    full.push(boxes.length > 0 && boxes.every((i) => i < s.hurt));
  }
  const fullBars = full.filter(Boolean).length;
  return { bars, open, full, fullBars, needsCatch: fullBars > s.catches.length, wound: Math.min(12, 6 + 2 * s.catches.length) };
}
function takeHurt(s, c) {
  const before = hurtInfo(s, c);
  if (s.hurt >= before.open) {
    s.blaze = true;
    return "Every box is full, so you Blaze.";
  }
  s.hurt += 1;
  const after = hurtInfo(s, c);
  if (after.fullBars > before.fullBars && after.needsCatch) {
    s.conf = sizeDown(s.conf);
    return `That fills a bar, so write a Catch in it. Your Confidence drops to d${s.conf}.`;
  }
  return `You take a Hurt. That’s ${s.hurt} of ${after.open}.`;
}

// The end of a scene: Aura's full, 1 Resolve back, Confidence back to where it
// starts, the loose boxes clear, conditions end and once-per-scene traits reset.
// A Blaze that's still waiting stays until the player chooses.
function endScene(s, c) {
  const { open } = hurtInfo(s, c);
  s.aura = c.numbers.aura;
  gainResolve(s, c, 1);
  s.conf = c.numbers.confidence;
  s.hurt = Math.min(open, 3 * s.catches.length);
  s.conditions = [];
  s.used = {};
}

// ---------------------------------------------------------------- the list

function saveNote() {
  if (!store.ok) return '<div class="cc-note is-warn" role="alert"><p>This phone isn’t letting the site save anything, so whatever you change here is gone when you close the page. Private browsing usually does that.</p></div>';
  if (store.broken) return '<div class="cc-note is-warn" role="alert"><p>Something saved on this phone couldn’t be read, so it’s been put to one side and you’re starting a fresh list.</p></div>';
  return "";
}

function listView() {
  const mine = chars();
  const saved = (ch) => {
    const c = CREW.get(ch.crew);
    const s = ch.state || {};
    return `<li><a class="card cc-saved" href="/characters/?c=${encodeURIComponent(ch.id)}" data-act="nav" data-id="${esc(ch.id)}">
      <span class="die" aria-hidden="true">${esc((ch.name || "?").slice(0, 1))}</span>
      <span class="cc-saved-text"><b>${esc(ch.name)}</b>
      <small>${c ? `${esc(c.name)} · <em>${esc(c.title)}</em>` : "This sheet isn’t in the rules any more"}</small>
      ${c ? `<small>Aura ${esc(s.aura ?? c.numbers.aura)} · Resolve ${esc(s.resolve ?? c.numbers.resolve)} · Confidence d${esc(s.conf ?? c.numbers.confidence)}</small>` : ""}</span></a></li>`;
  };
  const crew = (c) => `<article class="card">
    <div class="art"><span class="die" aria-hidden="true">${esc(c.name.slice(0, 1))}</span></div>
    <div class="body"><h3>${esc(c.name)}</h3><p class="title">${esc(c.title)}</p>
      <div class="chips">${c.archetypes.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>
      <p class="blurb">${esc(c.blurb)}</p>
      <button type="button" class="button primary" data-act="play" data-c="${esc(c.id)}">Play ${esc(c.name)}</button></div></article>`;
  return `<header class="cc-intro"><p class="kicker">Your phone at the table</p><h1>Characters</h1>
    <p class="lede">Pick one of the crew, give them a name and play them from your phone. The counting’s done for you, and they’re saved on this phone, signal or not.</p></header>
    ${saveNote()}
    ${mine.length ? `<section class="cc-sec" aria-labelledby="cc-mine"><h2 id="cc-mine">On this phone</h2><ul class="cc-mine">${mine.map(saved).join("")}</ul></section>` : ""}
    <section class="cc-sec" aria-labelledby="cc-crew"><h2 id="cc-crew">Pick from the crew</h2>
      <p class="cc-lead">Six ready-made characters, straight off their sheets in the ${link("s-pregens", "rules")}. Building your own comes later.</p>
      <div class="crew">${DATA.crew.map(crew).join("")}</div></section>`;
}

// ---------------------------------------------------------------- the sheet

function missingView(ch) {
  return `<a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a>
    <div class="cc-note is-warn"><p>${ch ? `${esc(ch.name)}’s sheet isn’t in the rules any more, so there’s nothing to play from.` : "That character isn’t saved on this phone."}</p>
    ${ch ? '<div class="cc-row"><button type="button" class="button" data-act="delete">Delete them from this phone</button></div>' : ""}</div>`;
}

function stripView(ch, c, s) {
  const n = c.numbers;
  const u = lastUndo(ch);
  const cell = (key, label, value, sub = "") => `<button type="button" class="cc-stat${ui.panel === key ? " is-open" : ""}" data-act="panel" data-p="${key}" aria-expanded="${ui.panel === key}" aria-controls="cc-panel"><span class="k">${label}</span><span class="v">${value}${sub ? `<small>${sub}</small>` : ""}</span></button>`;
  return `<div class="cc-strip" role="group" aria-label="Aura, Resolve, Confidence and Armour">
    ${cell("aura", "Aura", s.aura, `/${n.aura}`)}${cell("resolve", "Resolve", s.resolve, `/${n.resolve}`)}${cell("conf", "Confidence", `d${s.conf}`)}${cell("armour", "Armour", `d${s.armour}`)}
    <button type="button" class="cc-undo" data-act="undo"${off(!u)} aria-label="${u ? `Undo ${esc(u.label)}` : "Nothing to undo"}">${ICON.undo}</button>
  </div>${ui.panel ? `<div id="cc-panel" class="cc-panel">${panelView(ui.panel, c, s)}</div>` : ""}`;
}

function ring(act, from, to, now, label) {
  return `<div class="cc-ring" role="group" aria-label="${label}">${SIZES.filter((d) => d >= from && d <= to).map((d) => `<button type="button" class="hexbtn${d === now ? " on" : ""}" data-act="${act}" data-v="${d}"${pressed(d === now)}>d${d}</button>`).join("")}</div>`;
}

function panelView(key, c, s) {
  const n = c.numbers;
  if (key === "aura") {
    return `<p><b>Aura ${s.aura} of ${n.aura}.</b> You’re full at the start of every scene, and every top face you roll gives 1 back. ${link("s-aura", "How Aura works")}</p>
      <div class="cc-row"><button type="button" class="button" data-act="aura" data-d="-1"${off(s.aura < 1)}>Spend 1</button><button type="button" class="button" data-act="aura" data-d="1">Get 1 back</button></div>`;
  }
  if (key === "resolve") {
    return `<p><b>Resolve ${s.resolve} of ${n.resolve}.</b> You get 1 back at the end of a scene, and all of it after downtime. ${link("s-resolve", "How Resolve works")}</p>
      <div class="cc-row"><button type="button" class="button" data-act="resolve" data-d="-1"${off(s.resolve < 1)}>Spend 1</button><button type="button" class="button" data-act="resolve" data-d="1">Get 1 back</button></div>`;
  }
  if (key === "conf") {
    const start = `d${n.confidence}${n.confidenceNote ? ` (${esc(n.confidenceNote)})` : ""}`;
    const mood = s.conf === 2 ? " You’re shaken, so going at a threat costs 1 Resolve each time." : s.conf === 12 ? " You’re fired up." : "";
    return `<p><b>Confidence d${s.conf}.</b> It starts every scene on ${start}${n.dressed ? `, or d${n.dressed.die} in ${esc(n.dressed.what)} when they fit the scene` : ""}.${mood} ${link("s-confidence", "How Confidence works")}</p>
      ${ring("conf", 2, 12, s.conf, "Confidence")}
      <div class="cc-row">
        ${n.dressed && s.conf === n.confidence ? `<button type="button" class="button" data-act="conf" data-v="${n.dressed.die}">Dressed for it: d${n.dressed.die}</button>` : ""}
        ${s.conf < 6 ? '<button type="button" class="button" data-act="breath">Take a breath</button>' : ""}
        ${s.conf === 12 ? '<button type="button" class="button" data-act="cash" data-how="action">Cash it in for an extra action</button><button type="button" class="button" data-act="cash" data-how="heal">Cash it in to clear a box</button>' : ""}
      </div>`;
  }
  return `<p><b>Armour d${s.armour}</b>${s.armour < n.armour ? `, down from d${n.armour}` : ""}${n.armourNote ? `, from ${esc(n.armourNote)}` : ""}. A purse of gold spent at a smith, or a downtime slot on upkeep, puts it back to full. ${link("s-armour", "How Armour works")}</p>
    ${ring("armour-set", 2, n.armour, s.armour, "Armour")}
    <div class="cc-row"><button type="button" class="button" data-act="armour" data-d="-1"${off(s.armour <= 2)}>Step it down</button><button type="button" class="button" data-act="armour" data-d="full"${off(s.armour >= n.armour)}>Back to full</button></div>`;
}

function lastRollView(last) {
  if (!last) return "";
  const outs = last.dice.map((d) => d.out).filter(Boolean);
  const beat = outs.filter((o) => o === "beat" || o === "won").length;
  const verdict = last.opp == null ? "" : outs.length === 1 ? { beat: "Beat it.", won: "Won the tie.", tie: "A tie.", under: "Under." }[outs[0]] : `${beat} of ${outs.length} beat it.`;
  return `<p class="cc-last"><span class="k">Last roll</span> <b>${esc(last.name)}</b>, ${steps(last.steps)}: ${last.dice.map((d) => `${d.total} on the ${d.mark ? "Mark " : ""}d${d.size}`).join(", ")}${last.opp != null ? `, against ${last.opp}` : ""}. ${verdict}</p>`;
}

function sheetView(ch, c) {
  const s = ch.state;
  const n = c.numbers;
  const her = c.pronoun === "him" ? "his" : c.pronoun === "her" ? "her" : "their";
  const facts = [`Stride ${n.stride}${n.strideNote ? ` (${esc(n.strideNote)})` : ""}`, `${n.hurtBars} Hurt bars${n.hurtNote ? ` (${esc(n.hurtNote)})` : ""}`];
  const hi = hurtInfo(s, c);

  const tiles = c.actions.map((a, i) => `<button type="button" class="tile card" data-act="roll" data-a="${i}"><span class="tile-name">${esc(a.name)}</span><span class="tile-die hex on">${esc(a.die)}</span><span class="tile-steps">${steps(a.steps)}</span></button>`).join("");

  const titles = c.titles.map((t, i) => `<article class="card cc-card"><p class="eyebrow">${ORD[i] ?? ""} Title · ${t.archetypeId ? link(t.archetypeId, esc(t.archetype)) : esc(t.archetype)}</p>
    <h3><em>${esc(t.name)}</em></h3><ul class="cc-perms">${t.permissions.map((p) => `<li><em>${esc(p.text)}</em></li>`).join("")}</ul></article>`).join("");
  const archetypes = c.archetypeRules.map((a) => `<div class="cc-arch"><p><b>${a.id ? link(a.id, esc(a.name)) : esc(a.name)}${a.times > 1 ? `, taken ${a.times === 2 ? "twice" : `${a.times} times`}` : ""}.</b> ${a.summary}</p>
    <p><b>1 Aura:</b> ${a.auraHtml}</p><button type="button" class="button sm" data-act="arch-aura" data-n="${esc(a.name)}"${off(s.aura < 1)}>Spend 1 Aura on it</button></div>`).join("");

  const traits = c.traits.map((t) => {
    const once = /once per scene/i.test(t.type);
    const used = Boolean(s.used[t.name]);
    return `<div class="cc-item"><p><b>${esc(t.name)}</b> <span class="chip sm">${esc(t.type)}</span>${once && used ? ' <span class="chip sm is-used">Used this scene</span>' : ""}</p><p>${t.html}</p>
      ${t.aura ? `<button type="button" class="button sm" data-act="trait-aura" data-n="${esc(t.name)}"${off(once && used)}>Take ${t.aura} Aura</button>` : once ? `<button type="button" class="button sm" data-act="used" data-n="${esc(t.name)}"${pressed(used)}>${used ? "Used this scene" : "Use it"}</button>` : ""}</div>`;
  }).join("");

  const thing = (where, name, i = -1) => {
    const key = `${where}|${name}`;
    const out = Boolean(s.crossed[key]);
    return `<li class="cc-thing-row"><button type="button" class="cc-thing${out ? " is-out" : ""}" data-act="cross" data-k="${esc(key)}"${pressed(out)} aria-label="${esc(name)}: ${out ? "crossed out, tap to bring it back" : "tap to cross it out"}"><span>${esc(name)}</span>${out ? "<small>crossed out</small>" : ""}</button>${i >= 0 ? `<button type="button" class="cc-x sm" data-act="drop" data-i="${i}" aria-label="Take ${esc(name)} off the sheet">${ICON.close}</button>` : ""}</li>`;
  };
  const picked = (where) => s.picked.map((p, i) => ({ ...p, i })).filter((p) => p.where === where);
  const slot = (where, title) => {
    const own = where === "bag" ? [] : c.carry[where].items;
    const extra = picked(where);
    const max = where === "bag" ? c.carry.bag.max : c.carry[where].max;
    const note = where === "bag" ? "" : c.carry[where].note;
    return `<div class="cc-slot"><h3>${title} <small>${own.length + extra.length} of ${max}</small></h3>
      ${note && !extra.length ? `<p class="cc-lead">${esc(note[0].toUpperCase() + note.slice(1))}.</p>` : ""}
      <ul class="cc-things">${own.map((x) => thing(where, x)).join("")}${extra.map((p) => thing(where, p.name, p.i)).join("")}</ul></div>`;
  };
  const attuned = c.attuned.map((a) => `<div class="cc-item"><p><b>${esc(a.name)}</b>${a.props ? ` (${esc(a.props)})` : ""} ${a.stage ? `<span class="chip sm">${esc(a.stage)}</span>` : ""}</p>
    <ul class="cc-perms">${a.permissions.map((p) => `<li><em>${esc(p.text)}</em></li>`).join("")}</ul>${a.catch ? `<p>Its Catch: <em>${esc(a.catch)}</em></p>` : ""}</div>`).join("");

  const bars = Array.from({ length: hi.bars }, (_, b) => `<div class="cc-bar${hi.full[b] ? " is-full" : ""}"><span class="cc-boxes" aria-hidden="true">${[0, 1, 2].map((j) => {
    const i = b * 3 + j;
    return `<span class="box${i >= hi.open ? " x" : i < s.hurt ? " on" : ""}"></span>`;
  }).join("")}</span>${s.catches[b] ? `<span class="cc-catch"><em>${esc(s.catches[b])}</em><button type="button" class="button sm" data-act="heal-catch" data-b="${b}">Healed in downtime</button></span>` : ""}</div>`).join("");

  const conds = s.conditions.map((x, i) => {
    const rule = COND.get(x.name);
    const what = rule ? `One step ${x.kind === "for" ? "more" : "less"} on ${rule.passive} Spend it and ${rule.active}` : "";
    return `<li class="cc-cond is-${x.kind}">${hex(`d${x.die}`, "on")}<div><p><b><em>${esc(x.name)}</em></b> <small>${x.kind === "for" ? "for you" : "against you"}</small></p>${what ? `<p class="cc-lead">${what}</p>` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="cond-down" data-i="${i}">Down a size</button><button type="button" class="button sm" data-act="cond-off" data-i="${i}">Spent or broken</button></div></div></li>`;
  }).join("");
  const condOptions = ["against", "for"].map((kind) => `<optgroup label="${kind === "for" ? "For you" : "Against you"}">${DATA.conditions.filter((x) => x.kind === kind).map((x) => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("")}</optgroup>`).join("");

  const crewNames = new Set(DATA.crew.map((x) => x.name));
  const threads = c.threads.map((p) => `<div class="cc-person"><h3>${esc(p.person)}${crewNames.has(p.person) ? ' <small>in the crew</small>' : ""}</h3><ul>${p.threads.map((t) => {
    const key = `${p.person}|${t.text}`;
    const st = s.threads[key];
    const note = t.note ? t.note.replace(/^(.+’s)(?=,|$)/, "$1 words").replace(/^debt$/, "a debt") : "";
    return `<li class="cc-thread${st ? ` is-${st}` : ""}"><p><em>${esc(t.text)}</em>${note ? ` <small>(${esc(note)})</small>` : ""}${st ? ` <span class="chip sm">${st === "strained" ? "Strained" : "Snapped"}</span>` : ""}</p>
      ${st === "snapped" ? "" : `<div class="cc-row"><button type="button" class="button sm" data-act="strain" data-k="${esc(key)}">${st ? "Strain it again: it snaps, +1 Resolve" : "Strain it: +1 Resolve"}</button>${st ? `<button type="button" class="button sm" data-act="mend" data-k="${esc(key)}">Mended</button>` : ""}</div>`}</li>`;
  }).join("")}</ul></div>`).join("");

  const bites = [
    ...c.attuned.filter((a) => a.catch).map((a) => ({ text: a.catch, from: `the Catch on ${a.name.replace(/^(His|Her|Their) /, (m) => m.toLowerCase())}` })),
    ...s.catches.map((x) => ({ text: x, from: "a Catch on your Hurt track" })),
    ...c.trouble.map((x) => ({ text: x, from: `trouble that follows ${c.pronoun}` })),
  ].map((b) => `<li class="cc-item"><p><em>${esc(b.text)}</em> <small>${esc(b.from)}</small></p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Let ${esc(b.text)} bite: +1 Aura">Let it bite: +1 Aura</button><button type="button" class="button sm" data-act="bite" data-big="1" aria-label="A big bite from ${esc(b.text)}: +1 Resolve">A big bite: +1 Resolve</button></div></li>`).join("");

  const changed = ch.hash !== c.hash ? `<div class="cc-note" role="status"><p>${esc(c.name)}’s sheet has changed in the rules since this phone last opened it. Every number here is already the new one, so check anything you’ve picked still suits ${c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them"}.</p><div class="cc-row"><a class="button" href="/changes/">See what’s changed</a><button type="button" class="button" data-act="seen">Got it</button></div></div>` : "";

  return `<a class="cc-back" href="/characters/" data-act="nav">${ICON.back}Characters</a>
  <header class="cc-head"><h1>${esc(ch.name)}</h1><p class="cc-title"><em>${esc(c.title)}</em></p>
    <div class="chips">${c.archetypes.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>
    <p class="cc-small">${ch.name !== c.name ? `${esc(c.name)}’s sheet, from the crew · ` : ""}${facts.join(" · ")}</p></header>
  ${saveNote()}${changed}
  ${s.dead ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} died in play.</b> Keep the sheet to remember them, or delete them from this phone at the bottom of the page.</p></div>` : ""}
  ${stripView(ch, c, s)}
  <section class="cc-sec cc-play" aria-labelledby="cc-actions"><h2 id="cc-actions" class="sr-only">Set actions</h2>
    <div class="cc-tiles">${tiles}<button type="button" class="tile card tile-defend" data-act="defence"><span class="tile-name">When it lands</span><span class="tile-sub">Armour d${s.armour} · Confidence d${s.conf}</span></button></div>
    ${lastRollView(s.last)}
    <div class="cc-row cc-scene"><button type="button" class="button" data-act="scene">New scene</button><button type="button" class="button" data-act="downtime">After downtime</button></div>
  </section>

  <section class="cc-sec" aria-labelledby="cc-titles"><h2 id="cc-titles">Titles and permissions</h2>${titles}
    <h3 class="cc-h3">${c.archetypeRules.length > 1 ? "Your archetypes" : "Your archetype"}</h3>${archetypes}</section>

  <section class="cc-sec" aria-labelledby="cc-traits"><h2 id="cc-traits">Traits</h2>${traits}</section>

  <section class="cc-sec" aria-labelledby="cc-kit"><h2 id="cc-kit">Kit</h2>
    ${slot("equipment", "Equipment")}${slot("utility", "Utility")}
    ${c.carry.keepsake ? `<div class="cc-slot"><h3>Keepsake</h3><ul class="cc-things">${thing("keepsake", c.carry.keepsake)}</ul></div>` : ""}
    ${slot("bag", `The bag <span class="cc-small">(${esc(c.carry.bag.name)})</span>`)}
    <form class="cc-form" data-form="pickup"><label class="cc-field">Pick something up <input name="what" maxlength="60" autocomplete="off"></label>
      <label class="cc-field">It goes in <select name="where"><option value="bag">the bag</option><option value="utility">utility</option><option value="equipment">equipment</option></select></label>
      <button type="submit" class="button">Add it</button></form>
    <p class="cc-lead">Tap a thing to cross it out when it breaks or gets used up. Your attuned things are magic, and they can’t be broken.</p>
    ${c.attuned.length ? `<h3 class="cc-h3">Attuned</h3>${attuned}` : ""}</section>

  <section class="cc-sec" aria-labelledby="cc-hurt"><h2 id="cc-hurt">Hurt and conditions</h2>
    <p class="cc-small">${s.hurt} of ${hi.open} boxes filled${s.scars ? `, ${s.scars} crossed out with Scars` : ""}. Your wound die’s a d${hi.wound}. At the end of a scene you drop back to 3 boxes for each Catch. ${link("s-blaze", "How Hurt works")}</p>
    <div class="cc-bars">${bars}</div>
    ${hi.needsCatch ? `<form class="cc-form cc-note" data-form="catch"><label class="cc-field">That bar’s full. Write the injury in it, like <em>cracked ribs</em> or <em>can’t stand the dark</em>. <input name="catch" maxlength="60" autocomplete="off" required></label><button type="submit" class="button primary">Write it in</button></form>` : ""}
    ${s.blaze ? `<div class="cc-note is-warn" role="alert"><p><b>You Blaze.</b> Declare something extraordinary and it happens, no roll. From your very first Blaze you can choose for your character to die. If you don’t, they leave the scene and take a Scar, which crosses out a box for good.</p>
      <div class="cc-row"><button type="button" class="button primary" data-act="scar">Take a Scar and leave the scene</button><button type="button" class="button" data-act="die">${esc(ch.name)} dies</button></div></div>` : ""}
    ${s.scars >= hi.bars * 3 ? '<p class="cc-note is-warn">Every box is crossed out. You’re scarred out, and your next Blaze is your last.</p>' : ""}
    <div class="cc-row"><button type="button" class="button" data-act="hurt" data-d="1">Take a Hurt</button><button type="button" class="button" data-act="hurt" data-d="-1"${off(s.hurt < 1)}>Clear a box</button>${s.scars ? '<button type="button" class="button" data-act="unscar">The story earned a Scar back</button>' : ""}</div>
    <h3 class="cc-h3">Conditions</h3>
    ${conds ? `<ul class="cc-conds">${conds}</ul><div class="cc-row"><button type="button" class="button" data-act="round">End of round: every condition down a size</button></div>` : '<p class="cc-lead">Nothing on you right now.</p>'}
    <form class="cc-form" data-form="cond">
      <label class="cc-field">Add a condition <select name="pick">${condOptions}</select></label>
      <label class="cc-field">Its die <select name="die">${SIZES.map((d) => `<option value="${d}"${d === 6 ? " selected" : ""}>d${d}</option>`).join("")}</select></label>
      <details class="cc-own"><summary>Or write your own</summary>
        <label class="cc-field">Its name <input name="own" maxlength="30" autocomplete="off"></label>
        <label class="cc-field">It’s <select name="kind"><option value="against">against you</option><option value="for">for you</option></select></label></details>
      <button type="submit" class="button">Add it</button></form>
    <p class="cc-lead">${link("s-conditions", "How conditions work")}</p></section>

  <section class="cc-sec" aria-labelledby="cc-threads"><h2 id="cc-threads">Threads</h2>
    <p class="cc-lead">Lean on someone in the story and strain a thread for 1 Resolve. Strain it again before it’s mended and it snaps. A thread with someone in the crew is on both your sheets, so tell them when you strain it. ${link("s-bonds", "How threads work")}</p>
    ${threads}</section>

  <section class="cc-sec" aria-labelledby="cc-trouble"><h2 id="cc-trouble">Catches and trouble</h2>
    <p class="cc-lead">Let one bite and bring real trouble into the scene, and you take 1 Aura. A big bite that changes the scene or costs you something you wanted pays 1 Resolve instead.</p>
    <ul class="cc-list">${bites}<li class="cc-item"><p>Nothing here fits? Bring real trouble on yourself in the story anyway.</p><div class="cc-row"><button type="button" class="button sm" data-act="bite" data-big="0" aria-label="Real trouble with no Catch: +1 Aura">+1 Aura</button></div></li></ul></section>

  <section class="cc-sec" aria-labelledby="cc-asp"><h2 id="cc-asp">Aspiration</h2>
    <label class="cc-field"><span class="sr-only">Your Aspiration</span><input class="cc-plain" data-in="asp-text" maxlength="120" value="${esc(s.aspText || c.aspiration.text)}" autocomplete="off"></label>
    ${ring("asp-set", 2, 12, s.asp, "Aspiration")}
    <div class="cc-row"><button type="button" class="button" data-act="asp" data-d="-1"${off(s.asp <= 2)}>A setback</button><button type="button" class="button" data-act="asp" data-d="1">It climbs</button></div>
    <p class="cc-lead">When the GM says it’s within reach, roll against its die, and if you beat it, it climbs. ${link("s-aspiration", "How Aspiration works")}</p></section>

  <section class="cc-sec" aria-labelledby="cc-notes-h"><h2 id="cc-notes-h">Notes</h2>
    <label class="sr-only" for="cc-notes">Notes</label><textarea id="cc-notes" data-in="notes" rows="5">${esc(s.notes)}</textarea></section>

  <section class="cc-sec" aria-labelledby="cc-about"><h2 id="cc-about">About ${esc(c.name)}</h2>
    <p>${esc(c.blurb)}</p><p><b>Plays like:</b> ${c.playsLike}</p>
    ${c.crewQs.map((x) => `<p><em>${esc(x.q)}</em> ${esc(x.a)}</p>`).join("")}
    <p class="cc-lead">${link("s-pregens", `${esc(c.name)}’s sheet in the rules`)}</p>
    <div class="cc-row"><button type="button" class="button danger" data-act="delete">Delete ${esc(ch.name)} from this phone</button></div></section>`;
}

// ---------------------------------------------------------------- rolling

const lineOf = (c, key) => c.lines.find((l) => l.key === key);
const lineLabel = (l) => (l.kind === "title" ? `Title: <em>${esc(l.label)}</em>` : l.kind === "permission" ? `<em>${esc(l.label)}</em>` : l.kind === "attuned" ? `<em>${esc(l.label)}</em> <small>${esc(l.item)}</small>` : esc(l.label));
const lower = (name) => name.replace(/^(A|An|The|His|Her|Their) /, (m) => m.toLowerCase());
const lineName = (l) => (l.kind === "attuned" ? `${lower(l.item)} (${l.label})` : l.kind === "title" ? `your Title, ${l.label}` : l.label);

function openAction(i) {
  roll = { kind: "action", mode: "build", a: i, off: new Set(), in: new Set(), other: 0, conds: new Set(), friends: [], handed: 0, extra: -1, via: "resolve", beyond: false, count: null, shape: 0, vs: 0, vsRolled: 4, mark: 0, dice: [], opp: null, oppSize: 0, log: [], pick: null, pads: [], padOpp: false, spinning: false };
  openDialog();
}

// Count a roll the way The Core does: 1 for each of your actions, 1 for every
// line that fits (lines on both set actions count once), 1 Aura for anything
// brought in, plus friends' steps, a Leader's steps and conditions.
function counted(r, c, s) {
  const act = c.actions[r.a];
  const extra = r.extra >= 0 ? c.actions[r.extra] : null;
  const free = new Set([...act.lines, ...(extra ? extra.lines : [])]);
  const lines = [...free].filter((k) => !r.off.has(k));
  const brought = [...r.in].filter((k) => !free.has(k));
  const condSteps = s.conditions.filter((x) => r.conds.has(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  const own = extra ? 2 : 1;
  const total = Math.max(1, own + lines.length + brought.length + r.other + condSteps + r.friends.reduce((a, b) => a + b, 0) + r.handed);
  const splits = own + r.friends.length;
  const { fewest, most } = diceRange(total, splits);
  const count = clamp(r.count ?? fewest, fewest, most);
  const shapes = diceShapes(total, count);
  const shape = clamp(r.shape, 0, shapes.length - 1);
  const dice = shapes[shape] ?? stepsToDice(total);
  const aura = brought.length + r.other;
  const shaken = s.conf <= 2 && r.shaken !== false;
  const resolve = (r.beyond ? 1 : 0) + (extra && r.via === "resolve" ? 1 : 0) + (shaken ? 1 : 0);
  const fired = Boolean(extra) && r.via === "fired";
  const short = aura > s.aura ? `You’ve got ${s.aura} Aura, and this needs ${aura}.` : resolve > s.resolve ? `You’ve got ${s.resolve} Resolve, and this needs ${resolve}.` : fired && s.conf < 12 ? "Your Confidence has to be on d12 to cash it in." : "";
  return { act, extra, free, lines, brought, total, splits, fewest, most, count, shapes, shape, dice, aura, resolve, fired, shaken, short };
}

const stepper = (name, value, min, max, label, i = "") => `<span class="cc-step"><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${i}" data-d="-1" aria-label="${label}: one less"${off(value <= min)}>−</button><output>${value}</output><button type="button" class="cc-stepbtn" data-act="step" data-n="${name}" data-i="${i}" data-d="1" aria-label="${label}: one more"${off(value >= max)}>+</button></span>`;

function buildView(c, s) {
  const r = roll;
  const k = counted(r, c, s);
  const toggle = (l, on, act) => `<button type="button" class="cc-line" data-act="${act}" data-k="${l.key}"${pressed(on)}><span class="tick" aria-hidden="true"></span><span>${lineLabel(l)}</span></button>`;
  const groups = [["title", "Titles"], ["permission", "Permissions"], ["attuned", "Attuned"], ["trait", "Traits"], ["kit", "What you carry"]].map(([kind, title]) => {
    const list = c.lines.filter((l) => l.kind === kind && !k.free.has(l.key) && (kind !== "trait" || l.step) && !(kind === "kit" && Object.keys(s.crossed).some((x) => s.crossed[x] && x.endsWith(`|${l.label}`))));
    return list.length ? `<h3>${title}</h3>${list.map((l) => toggle(l, r.in.has(l.key), "in")).join("")}` : "";
  }).join("");
  const name = k.extra ? (k.extra === k.act ? `${k.act.name}, twice` : `${k.act.name} and ${k.extra.name}`) : k.act.name;
  const vias = [["resolve", "1 Resolve"], ["time", "Taking my time, outside a round"], ["held", "I held my action"], ["hiding", "Coming out of hiding"], ["fired", "Cashing in fired-up Confidence"], ["trait", "A trait, condition or Boon that says so"]];
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(name)}</h2>
      <p class="cc-dice" aria-live="polite">${k.dice.map((d) => hex(`d${d}`, "on")).join("")}<span><b>${steps(k.total)}</b>, ${diceLabel(k.dice)}${r.mark ? `, and the Mark d${r.mark}` : ""}</span></p>
      ${k.aura || k.resolve ? `<p class="cc-costs">${k.aura ? `<span class="chip">${k.aura} Aura</span>` : ""}${k.resolve ? `<span class="chip">${k.resolve} Resolve</span>` : ""}</p>` : ""}</div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <fieldset class="cc-group"><legend>On your ${esc(k.extra && k.extra !== k.act ? `${k.act.name} and ${k.extra.name}` : k.act.name)}</legend>
      ${k.free.size ? `${[...k.free].map((key) => toggle(lineOf(c, key), !r.off.has(key), "off")).join("")}<p class="cc-lead">Tap a line off when it doesn’t fit this time.</p>` : '<p class="cc-lead">Nothing’s on it yet, so it’s the action on its own.</p>'}</fieldset>
    ${s.conf <= 2 ? `<fieldset class="cc-group"><legend>You’re shaken</legend><button type="button" class="cc-line" data-act="shaken"${pressed(k.shaken)}><span class="tick" aria-hidden="true"></span><span>Going at a threat costs 1 Resolve <small>in a fight or face to face, every time. Tap it off when this isn’t going at a threat.</small></span></button></fieldset>` : ""}
    <details class="cc-group" data-open="bring"${ui.open.has("bring") ? " open" : ""}><summary>Bring something in <small>1 Aura each${k.aura ? `, ${k.aura} in` : ""}</small></summary>
      <p class="cc-lead">Anything else that fits costs 1 Aura to bring in, even when it plainly fits.</p>${groups}
      <div class="cc-stepper"><span>Something else that fits <small>the ground, a threat’s tag you know, or a friend’s permission through a thread that isn’t strained</small></span>${stepper("other", r.other, 0, 9, "Something else")}</div></details>
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
      <p class="cc-lead">Give every die an intent before you roll: what it’s trying to do, and who it’s aimed at.</p></fieldset>
    <fieldset class="cc-group"><legend>What it’s up against</legend>
      <div class="cc-chips"><button type="button" class="cc-chipbtn" data-act="vs" data-v="0"${pressed(r.vs === 0)}>Nothing to beat</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="vs" data-v="${d}"${pressed(r.vs === d)}>d${d}</button>`).join("")}<button type="button" class="cc-chipbtn" data-act="vs" data-v="-1"${pressed(r.vs === -1)}>A number it already rolled</button></div>
      ${r.vs === -1 ? `<div class="cc-stepper"><span>The number to beat</span>${stepper("vsRolled", r.vsRolled, 1, 30, "The number to beat")}</div>` : ""}
      <p class="cc-lead">A threat rolls its defence once a round, and that roll stands for everyone who goes at it.</p>
      <p class="cc-small">Is it Marked? Anyone who goes at a Marked creature rolls the Mark die too, as one more die against it.</p>
      <div class="cc-chips" role="group" aria-label="Its Mark"><button type="button" class="cc-chipbtn" data-act="mark" data-v="0"${pressed(!r.mark)}>No Mark</button>${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="mark" data-v="${d}"${pressed(r.mark === d)} aria-label="Marked d${d}">d${d}</button>`).join("")}</div></fieldset>
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
function settle(s, c, which) {
  const tops = which.filter((i) => roll.dice[i].nat === roll.dice[i].size);
  if (tops.length) roll.log.push(`${tops.length === 1 ? `Top face on the d${roll.dice[tops[0]].size}` : `${tops.length} top faces`}, so ${tops.length} Aura back.${gainAura(s, c, tops.length)}`);
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
    if (k.aura) r.log.push(`Paid ${k.aura} Aura to bring in ${[...k.brought.map((key) => lineName(lineOf(c, key))), ...(r.other ? [`${r.other} more thing${r.other > 1 ? "s" : ""} that fit${r.other > 1 ? "" : "s"}`] : [])].join(", ")}.`);
    const why = [r.beyond && "to go beyond", k.extra && r.via === "resolve" && "for the extra action", k.shaken && "to go at it while you’re shaken"].filter(Boolean);
    if (k.resolve) r.log.push(`Paid ${k.resolve} Resolve ${why.join(" and ")}.`);
    if (k.fired) {
      s.conf = 6;
      r.log.push("Cashed in your Confidence for the extra action, so it’s back to d6.");
    }
    r.name = k.extra ? (k.extra === k.act ? `${k.act.name}, twice` : `${k.act.name} and ${k.extra.name}`) : k.act.name;
    r.total = k.total;
    r.dice = k.dice.map((size) => ({ size, nat: 0, plus: 0, won: false }));
    if (r.mark) r.dice.push({ size: r.mark, nat: 0, plus: 0, won: false, mark: true });
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
}

// A short tumble before the dice settle. A tap skips it.
function spin() {
  const started = performance.now();
  clearTimeout(ui.spinTimer);
  const tick = () => {
    if (!roll?.spinning) return;
    if (performance.now() - started > 650) {
      roll.spinning = false;
      renderDialog();
      return;
    }
    for (const el of dialog.querySelectorAll("[data-spin]")) el.textContent = 1 + Math.floor(Math.random() * Number(el.dataset.spin));
    ui.spinTimer = setTimeout(tick, 60);
  };
  tick();
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
  const die = (d, i) => {
    if (r.spinning) return `<span class="hex big on" data-spin="${d.size}">${d.nat}</span>`;
    if (picking && (r.pick.type === "reroll" || plusOk(d, r.pick.mark))) return `<button type="button" class="hex big on" data-act="pick" data-i="${i}" aria-label="The d${d.size} that came up ${d.nat + d.plus}">${d.nat + d.plus}</button>`;
    return `<span class="hex big on">${d.nat + d.plus}</span>`;
  };
  const against = r.oppSize ? `against their d${r.oppSize}, which came up ${r.spinning ? "…" : r.opp}` : r.opp != null ? `against the ${r.opp} it already rolled` : "with nothing to beat";
  const onMark = (a) => /\bMark\b/.test(a.aura);
  const bonuses = c.archetypeRules.filter((a) => a.bonus && !/\b(Armour|Confidence|friend’s)/.test(a.aura) && (!onMark(a) || r.dice.some((d) => d.mark)));
  const canReroll = s.resolve >= 1 && (r.opp == null || outs.some((o) => o === "tie" || o === "under"));
  const offers = r.spinning || picking ? "" : [
    ...outs.map((o, i) => (o === "tie" ? `<button type="button" class="button sm" data-act="win-tie" data-i="${i}"${off(s.aura < 1)}>Win the tie on the d${r.dice[i].size}: 1 Aura</button>` : "")),
    ...bonuses.map((a) => `<button type="button" class="button sm" data-act="plus" data-n="${esc(a.name)}"${off(s.aura < 1 || !r.dice.some((d) => plusOk(d, onMark(a))))}>${esc(a.name)} +${a.bonus} on ${onMark(a) ? "the Mark die" : "a die"}: 1 Aura</button>`),
    canReroll ? `<button type="button" class="button sm" data-act="reroll">Roll again: 1 Resolve</button>` : "",
  ].join("");
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">${esc(r.name)}</h2><p class="cc-small">${steps(r.total)}, ${esc(against)}.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${r.dice.map((d, i) => `<li class="res is-${r.spinning ? "spin" : outs[i] ?? "none"}">${die(d, i)}<span class="res-die">${d.mark ? "Mark " : ""}d${d.size}${d.plus ? ` +${d.plus}` : ""}</span>${!r.spinning && outs[i] ? `<b class="res-out">${words[outs[i]]}</b>` : ""}${!r.spinning && d.nat === d.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
    ${r.spinning ? '<p class="cc-small">Tap the dice to skip.</p>' : ""}
    ${picking ? `<div class="cc-note" role="status"><p>${r.pick.type === "plus" ? `Tap the ${r.pick.mark ? "Mark die" : "die"} to put +${r.pick.bonus} on.` : "Tap a die to roll it again, or roll them all."}</p><div class="cc-row">${r.pick.type === "reroll" ? '<button type="button" class="button sm" data-act="reroll-all">Roll them all</button>' : ""}<button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>` : ""}
    ${offers ? `<div class="cc-row cc-offers">${offers}</div>` : ""}
    ${bonuses.length && !r.spinning && !picking ? `<p class="cc-lead">${bonuses.map((a) => `<b>${esc(a.name)}:</b> ${a.auraHtml}`).join(" ")}</p>` : ""}
    ${r.log.length ? `<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
    <p class="cc-small">You’ve got ${s.aura} Aura and ${s.resolve} Resolve.</p>
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
}

// ---------------------------------------------------------------- defending

function openDefence() {
  roll = { kind: "defence", mode: "build", against: "armour", defend: false, incoming: [], mine: [], opp: [], pick: null, log: [], spinning: false, padOpp: true, dconds: {} };
  openDialog();
}

// A condition is one step on whatever it fits, so Warded makes a d2 Armour a
// d4. The ones that name your Armour or Confidence start on, and the player
// can tap any of them off or on.
function defenceCondOn(x, r) {
  if (r.dconds && x.name in r.dconds) return r.dconds[x.name];
  const rule = COND.get(x.name);
  return Boolean(rule) && new RegExp(`\\b${r.against === "armour" ? "Armour" : "Confidence"}\\b`).test(rule.passive);
}
function defenceDie(s, r) {
  const base = r.against === "armour" ? s.armour : s.conf;
  const shift = s.conditions.filter((x) => defenceCondOn(x, r)).reduce((t, x) => t + (x.kind === "for" ? 2 : -2), 0);
  return even(base + shift, 2, 12);
}

// Which of your rolls stops which die. Ties go to you. Letting it ride, your
// one roll stands against them all. Defending, each die gets its own roll, and
// they're matched up so the most get stopped.
function blocks(r) {
  const mine = r.mine.map((d, i) => ({ i, v: d.nat + d.plus }));
  const hits = r.incoming.map((size, j) => ({ j, size, v: r.opp[j], by: null }));
  if (!r.defend) {
    for (const h of hits) if (mine[0] && h.v <= mine[0].v) h.by = 0;
    return hits;
  }
  const spare = [...mine].sort((a, b) => a.v - b.v);
  for (const h of [...hits].sort((a, b) => a.v - b.v)) {
    const k = spare.findIndex((m) => m.v >= h.v);
    if (k >= 0) h.by = spare.splice(k, 1)[0].i;
  }
  return hits;
}

function defenceGo(real) {
  const r = roll;
  if (!r.incoming.length) return;
  change("rolling your defence", (s, c) => {
    const size = defenceDie(s, r);
    r.size = size;
    r.mine = Array.from({ length: r.defend ? r.incoming.length : 1 }, () => ({ size, nat: 0, plus: 0 }));
    r.opp = r.incoming.map(() => 0);
    r.log = [];
    r.pick = null;
    r.real = real;
    if (real) r.mode = "pad";
    else {
      for (const m of r.mine) m.nat = throwDie(size);
      r.opp = r.incoming.map((d) => throwDie(d));
      r.mode = "result";
      settleDefence(s, c);
      r.spinning = !calm();
    }
  }, { say: false });
  if (roll?.spinning) spin();
}

function settleDefence(s, c) {
  const tops = roll.mine.filter((m) => m.nat === m.size).length;
  if (tops) roll.log.push(`${tops === 1 ? "A top face" : `${tops} top faces`} on your ${roll.against === "armour" ? "Armour" : "Confidence"}, so ${tops} Aura back.${gainAura(s, c, tops)}`);
}

function defenceBuild(s) {
  const r = roll;
  const die = defenceDie(s, r);
  const conds = s.conditions.map((x) => `<button type="button" class="cc-line" data-act="d-cond" data-k="${esc(x.name)}"${pressed(defenceCondOn(x, r))}><span class="tick" aria-hidden="true"></span><span><em>${esc(x.name)}</em> d${x.die} <small>${x.kind === "for" ? "one step more" : "one step less"}${COND.get(x.name) ? ` on ${esc(COND.get(x.name).passive.replace(/<[^>]+>/g, "").replace(/\.$/, ""))}` : ""}</small></span></button>`).join("");
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2><p class="cc-small">Whatever nobody answered lands at the end of the round.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <fieldset class="cc-group"><legend>What’s coming at you</legend>
      <button type="button" class="cc-line" data-act="d-against" data-v="armour"${pressed(r.against === "armour")}><span class="tick" aria-hidden="true"></span><span>Blows, blades, falling rocks and teeth <small>your Armour, d${s.armour}</small></span></button>
      <button type="button" class="cc-line" data-act="d-against" data-v="confidence"${pressed(r.against === "confidence")}><span class="tick" aria-hidden="true"></span><span>Fear, lies and pressure <small>your Confidence, d${s.conf}</small></span></button></fieldset>
    ${conds ? `<fieldset class="cc-group"><legend>Conditions on you</legend>${conds}<p class="cc-lead">Each one that fits is a step on the die you roll, so you’re rolling a d${die}.</p></fieldset>` : ""}
    <fieldset class="cc-group"><legend>How you take it</legend>
      <button type="button" class="cc-line" data-act="d-defend" data-v="0"${pressed(!r.defend)}><span class="tick" aria-hidden="true"></span><span>Let it ride <small>one roll against the lot</small></span></button>
      <button type="button" class="cc-line" data-act="d-defend" data-v="1"${pressed(r.defend)}><span class="tick" aria-hidden="true"></span><span>Defend <small>a roll for every die, and it takes your action</small></span></button></fieldset>
    <fieldset class="cc-group"><legend>The dice aimed at you</legend>
      <div class="cc-chips">${SIZES.map((d) => `<button type="button" class="cc-chipbtn" data-act="d-add" data-v="${d}" aria-label="Add a d${d}">+ d${d}</button>`).join("")}</div>
      ${r.incoming.length ? `<ul class="cc-incoming">${r.incoming.map((d, i) => `<li>${hex(`d${d}`, "on")}<button type="button" class="cc-x sm" data-act="d-del" data-i="${i}" aria-label="Take the d${d} off">${ICON.close}</button></li>`).join("")}</ul>` : '<p class="cc-lead">Add each die the GM telegraphed at you that nobody answered.</p>'}</fieldset>
  </div>
  <div class="dlg-foot"><button type="button" class="button primary" data-act="d-go"${off(!r.incoming.length)}>Roll</button><button type="button" class="button" data-act="d-real"${off(!r.incoming.length)}>Roll real dice</button></div>`;
}

function defenceResult(c, s, ch) {
  const r = roll;
  const what = r.against === "armour" ? "Armour" : "Confidence";
  const hits = blocks(r);
  const through = hits.filter((h) => h.by == null).length;
  const picking = r.pick && !r.spinning;
  const mine = r.mine.map((m, i) => {
    const v = m.nat + m.plus;
    if (r.spinning) return `<span class="hex big on" data-spin="${m.size}">${m.nat}</span>`;
    if (picking && !m.plus) return `<button type="button" class="hex big on" data-act="d-pick" data-i="${i}" aria-label="Your ${what} roll of ${v}">${v}</button>`;
    return `<span class="hex big on">${v}</span>${m.nat === m.size ? '<span class="res-note">Top face</span>' : ""}`;
  }).join("");
  const bonuses = c.archetypeRules.filter((a) => a.bonus && new RegExp(`\\b${what}\\b`).test(a.aura));
  const costs = r.against === "armour"
    ? `<p class="cc-lead">${through ? `${through === 1 ? "One gets" : `${through} get`} through. The GM names what each one costs you, and you can offer another that fits.` : "Nothing gets through."}</p>
      ${through ? `<div class="cc-row"><button type="button" class="button sm" data-act="armour" data-d="-1"${off(s.armour <= 2)}>Armour down a size</button><button type="button" class="button sm" data-act="hurt" data-d="1">Take a Hurt</button><button type="button" class="button sm" data-act="asp" data-d="-1"${off(s.asp <= 2)}>Aspiration down a size</button></div>` : ""}`
    : through
      ? `<p class="cc-lead">For each one that gets through, you choose.${s.conf <= 2 ? " Nothing takes your Confidence below d2, so it’s a Hurt or 1 Resolve." : ""}</p>
        <div class="cc-row"><button type="button" class="button sm" data-act="conf-step" data-d="-1"${off(s.conf <= 2)}>Let it shake you: down a size</button><button type="button" class="button sm" data-act="hurt" data-d="1">Bury it: take a Hurt</button><button type="button" class="button sm" data-act="resolve" data-d="-1"${off(s.resolve < 1)}>Hold your ground: 1 Resolve</button></div>`
      : `<p class="cc-lead">You stopped all of it. If that’s everything that came at your Confidence this round, it goes up a size.</p><div class="cc-row"><button type="button" class="button sm" data-act="conf-step" data-d="1"${off(s.conf >= 12)}>Confidence up a size</button></div>`;
  return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">When it lands</h2><p class="cc-small">Your ${what}, ${r.defend ? "a roll for every die" : "one roll against the lot"}. Ties go to you.</p></div>
    <button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button></div>
  <div class="dlg-body">
    <div class="cc-mine-roll"${r.spinning ? ' data-act="skip"' : ""}><span class="k">Your d${r.size}</span>${mine}</div>
    ${picking ? `<div class="cc-note" role="status"><p>Tap the ${what} roll to put +${r.pick.bonus} on.</p><div class="cc-row"><button type="button" class="button sm" data-act="pick-cancel">Never mind</button></div></div>` : ""}
    <ul class="cc-res"${r.spinning ? ' data-act="skip"' : ""}>${hits.map((h) => `<li class="res is-${r.spinning ? "spin" : h.by == null ? "through" : "beat"}">${r.spinning ? `<span class="hex big" data-spin="${h.size}">${h.v}</span>` : hex(h.v, "big")}<span class="res-die">their d${h.size}</span>${r.spinning ? "" : `<b class="res-out">${h.by == null ? "Gets through" : "Stopped"}</b>${r.defend && h.by != null ? `<span class="res-note">by your ${r.mine[h.by].nat + r.mine[h.by].plus}</span>` : ""}`}</li>`).join("")}</ul>
    ${!r.spinning && !picking && bonuses.length ? `<div class="cc-row cc-offers">${bonuses.map((a) => `<button type="button" class="button sm" data-act="plus" data-n="${esc(a.name)}"${off(s.aura < 1 || !r.mine.some((m) => !m.plus))}>${esc(a.name)} +${a.bonus} on your ${what}: 1 Aura</button>`).join("")}</div>` : ""}
    ${r.spinning ? "" : `<h3 class="cc-h3">What it costs</h3>${costs}`}
    ${r.log.length ? `<ul class="cc-log">${r.log.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
    <p class="cc-small">Armour d${s.armour} · Confidence d${s.conf} · ${s.hurt} of ${hurtInfo(s, c).open} boxes · ${s.aura} Aura · ${s.resolve} Resolve</p>
  </div>
  <div class="dlg-foot"><button type="button" class="button" data-act="undo"${off(!lastUndo(ch))}>Undo</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
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
  const c = normal(ch);
  if (!c) return "";
  const s = ch.state;
  if (roll.kind === "defence") {
    if (roll.mode === "build") return defenceBuild(s);
    if (roll.mode === "pad") {
      const rows = [...roll.mine.map((m, i) => [`Your ${roll.against === "armour" ? "Armour" : "Confidence"}, a d${m.size}`, `m${i}`, m.size, m.nat]), ...roll.incoming.map((d, j) => [`Their d${d}`, `o${j}`, d, roll.opp[j]])];
      return padView("When it lands", rows, roll.mine.every((m) => m.nat) && roll.opp.every(Boolean));
    }
    return defenceResult(c, s, ch);
  }
  if (roll.mode === "build") return buildView(c, s);
  if (roll.mode === "pad") {
    const rows = roll.pads.map((i) => [`${roll.dice[i].mark ? "The Mark" : "Your"} d${roll.dice[i].size}`, `p${i}`, roll.dice[i].size, roll.dice[i].nat]);
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
  if (now && mode === ui.mode) now.scrollTop = top;
  ui.mode = mode;
  refocus(keep);
}

function render() {
  const keep = dialog.open ? null : sig(document.activeElement);
  const ch = current();
  const c = ch ? normal(ch) : null;
  app.innerHTML = view.name !== "sheet" ? listView() : c ? sheetView(ch, c) : missingView(ch);
  if (dialog.open) renderDialog();
  else refocus(keep);
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
  clearTimeout(ui.spinTimer);
  dialog.close();
  dialog.innerHTML = "";
  roll = null;
  render();
  if (ui.returnFocus?.isConnected) ui.returnFocus.focus({ preventScroll: true });
}

function route() {
  const id = new URLSearchParams(location.search).get("c");
  view = id ? { name: "sheet", id } : { name: "list" };
  ui.panel = null;
  document.documentElement.classList.toggle("cc-open", Boolean(id));
  const ch = current();
  document.title = ch ? `${ch.name} · Zi’Dara` : "Characters · Zi’Dara";
  render();
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
  chars().push({ id, crew: crewId, name: name || c.name, made: new Date().toISOString(), hash: c.hash, state: fresh(c) });
  store.save();
  clearTimeout(ui.spinTimer);
  dialog.close();
  dialog.innerHTML = "";
  roll = null;
  history.replaceState(null, "", `/characters/?c=${encodeURIComponent(id)}`);
  route();
  scrollTo(0, 0);
  app.querySelector(".tile")?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- doing things

function stepRoll(name, i, d) {
  const r = roll;
  const k = counted(r, normal(current()), current().state);
  if (name === "other") r.other = clamp(r.other + d, 0, 9);
  if (name === "handed") r.handed = clamp(r.handed + d, 0, 18);
  if (name === "vsRolled") r.vsRolled = clamp(r.vsRolled + d, 1, 30);
  if (name === "friend") r.friends[i] = clamp(r.friends[i] + d, 1, 18);
  if (name === "count") r.count = clamp(k.count + d, k.fewest, k.most);
  if (name !== "vsRolled") r.shape = 0;
}

const ACT = {
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
  delete() {
    const ch = current();
    if (!ch || !confirm(`Delete ${ch.name} from this phone? You can’t get them back.`)) return;
    store.data.characters = chars().filter((x) => x.id !== ch.id);
    store.save();
    nav("");
  },
  seen() {
    const ch = current();
    const c = normal(ch);
    ch.hash = c.hash;
    persist();
    render();
  },
  panel(el) {
    ui.panel = ui.panel === el.dataset.p ? null : el.dataset.p;
    render();
  },
  undo: () => undoLast(),
  aura: (el) => change(Number(el.dataset.d) > 0 ? "getting 1 Aura back" : "spending 1 Aura", (s, c) => {
    if (Number(el.dataset.d) > 0) {
      const full = gainAura(s, c);
      return `Aura’s ${s.aura}.${full}`;
    }
    s.aura = Math.max(0, s.aura - 1);
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
  breath: () => change("taking a breath", (s) => {
    s.conf = Math.min(6, sizeUp(s.conf));
    return `You take a breath. Confidence is d${s.conf}. That was your action.`;
  }),
  cash: (el) => change("cashing in your Confidence", (s) => {
    s.conf = 6;
    if (el.dataset.how === "heal") {
      s.hurt = Math.max(0, s.hurt - 1);
      return "Cashed in. You clear a box, and Confidence is back to d6.";
    }
    return "Cashed in for an extra action this round. Confidence is back to d6.";
  }),
  armour: (el) => change(el.dataset.d === "full" ? "mending your Armour" : "your Armour stepping down", (s, c) => {
    s.armour = el.dataset.d === "full" ? c.numbers.armour : sizeDown(s.armour);
    return `Armour is d${s.armour}.`;
  }),
  "armour-set": (el) => change("changing your Armour", (s, c) => {
    s.armour = even(el.dataset.v, 2, c.numbers.armour);
    return `Armour is d${s.armour}.`;
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
      return "It climbs past d12 and resolves. Take a new archetype with one permission, name it with a Title, and write your new Aspiration in. It starts at d2. Building’s coming to the companion later, so put the new Title in your notes for now.";
    }
    s.asp = sizeUp(s.asp);
    return `It climbs. Your Aspiration’s on d${s.asp}.`;
  }),
  scene: () => change("starting a new scene", (s, c) => {
    endScene(s, c);
    return `New scene. Aura ${s.aura}, Resolve ${s.resolve}, Confidence d${s.conf}, and the loose boxes are clear.`;
  }),
  downtime: () => change("downtime", (s, c) => {
    endScene(s, c);
    s.resolve = c.numbers.resolve;
    return `After downtime. Resolve’s full at ${s.resolve}. A Catch on your Hurt track takes a downtime slot to heal, and so does putting your Armour back to full.`;
  }),
  roll: (el) => openAction(Number(el.dataset.a)),
  defence: () => openDefence(),
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
  cross: (el) => change("crossing something out", (s) => {
    const key = el.dataset.k;
    if (s.crossed[key]) delete s.crossed[key];
    else s.crossed[key] = true;
    return s.crossed[key] ? "Crossed out until it’s mended or replaced." : "It’s back.";
  }),
  drop: (el) => change("taking something off", (s) => {
    s.picked.splice(Number(el.dataset.i), 1);
    return "Taken off your sheet.";
  }),
  hurt: (el) => change(Number(el.dataset.d) > 0 ? "taking a Hurt" : "clearing a box", (s, c) => {
    if (Number(el.dataset.d) > 0) return takeHurt(s, c);
    s.hurt = Math.max(0, s.hurt - 1);
    return `A box clears. That’s ${s.hurt} filled.`;
  }),
  scar: () => change("taking a Scar", (s, c) => {
    s.blaze = false;
    s.scars = Math.min(c.numbers.hurtBars * 3, s.scars + 1);
    s.hurt = Math.min(s.hurt, c.numbers.hurtBars * 3 - s.scars);
    return "You leave the scene with a Scar, and a box is crossed out for good.";
  }),
  die: () => change("their death", (s, c, ch) => {
    s.blaze = false;
    s.dead = true;
    return `${ch.name} dies, and what they died for happens.`;
  }),
  unscar: () => change("a Scar earned back", (s) => {
    s.scars = Math.max(0, s.scars - 1);
    return "The story’s earned it back, so the box opens again.";
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
    renderDialog();
  },
  "heal-catch": (el) => change("healing a Catch", (s) => {
    const [gone] = s.catches.splice(Number(el.dataset.b), 1);
    s.hurt = Math.max(0, s.hurt - 3);
    return `${gone} is healed, and its bar clears.`;
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
  round: () => change("the end of the round", (s) => {
    const gone = s.conditions.filter((x) => x.die <= 2).map((x) => x.name);
    s.conditions = s.conditions.filter((x) => x.die > 2).map((x) => ({ ...x, die: x.die - 2 }));
    return `End of round. Every condition steps down a size${gone.length ? `, and ${gone.join(" and ")} ${gone.length > 1 ? "are" : "is"} gone` : ""}.`;
  }),
  strain: (el) => change("straining a thread", (s, c) => {
    const key = el.dataset.k;
    const person = key.split("|")[0];
    const snapped = s.threads[key] === "strained";
    s.threads[key] = snapped ? "snapped" : "strained";
    const crew = DATA.crew.some((x) => x.name === person) ? ` Tell ${person}’s player, so it’s ${snapped ? "crossed out" : "strained"} on their sheet too.` : "";
    return `${snapped ? "It snaps." : "Strained."} You take 1 Resolve.${gainResolve(s, c)}${crew}`;
  }),
  mend: (el) => change("mending a thread", (s) => {
    delete s.threads[el.dataset.k];
    return "Mended. It’s whole again.";
  }),
  bite: (el) => change(el.dataset.big === "1" ? "a big bite" : "letting it bite", (s, c) => (el.dataset.big === "1" ? `A big bite. You take 1 Resolve.${gainResolve(s, c)}` : `Real trouble. You take 1 Aura.${gainAura(s, c)}`)),

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
  "pad-done": () => change("your roll", (s, c) => {
    roll.mode = "result";
    if (roll.kind === "defence") settleDefence(s, c);
    else settle(s, c, roll.pads);
    roll.pads = [];
    roll.padOpp = false;
  }, { say: false }),
  skip() {
    roll.spinning = false;
    clearTimeout(ui.spinTimer);
    renderDialog();
  },
  "win-tie": (el) => change("winning a tie", (s) => {
    const d = roll.dice[Number(el.dataset.i)];
    if (s.aura < 1 || !d) return;
    s.aura -= 1;
    d.won = true;
    roll.log.push(`Paid 1 Aura to win the tie on the d${d.size}.`);
    s.last = lastOf();
  }, { say: false }),
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
    roll.against = el.dataset.v;
    roll.dconds = {};
    renderDialog();
  },
  "d-defend"(el) {
    roll.defend = el.dataset.v === "1";
    renderDialog();
  },
  "d-add"(el) {
    roll.incoming.push(Number(el.dataset.v));
    renderDialog();
  },
  "d-del"(el) {
    roll.incoming.splice(Number(el.dataset.i), 1);
    renderDialog();
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
    if (roll.kind === "action") s.last = lastOf();
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
  if (kind === "name") return start(roll?.crew, String(f.get("name") ?? "").trim().slice(0, 40));
  if (kind === "catch") {
    const text = String(f.get("catch") ?? "").trim();
    if (text) change("writing a Catch", (s) => {
      s.catches.push(text);
      return `${text} is written in. Let it bite whenever you like, for 1 Aura.`;
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
    const has = (where === "bag" ? 0 : c.carry[where].items.length) + ch.state.picked.filter((p) => p.where === where).length;
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
