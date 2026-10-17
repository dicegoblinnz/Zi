// The character builder: the Quick Build from the rules, one step at a time,
// with the book's own words for each step beside it. It warns but never blocks.
// Drafts are saved on the phone as you go, in one localStorage key, zi-drafts,
// by "new" or by the id of the character being changed, so nothing's lost if
// the page closes. A finished character keeps only what the player chose (its
// build), and sheetOf() turns that into the same full sheet the crew have,
// read against the current rules every time it opens. The guided build goes a
// step at a time, and the other ways in (a blank sheet, one of the crew, or
// random, from ways.js) open with every step on one page.

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";

const KEY = "zi-drafts";
export const ACTIONS = ["Fight", "Move", "Sneak", "Study", "Talk"];
const ORD = ["first", "second", "third", "fourth"];
export const ARMOUR = /\b(plate|chain|mail|leathers|shield|armou?r|breastplate|hauberk|brigandine)\b/i;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const both = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");

// ---------------------------------------------------------------- the build

const line = () => ({ text: "", on: [] });
const blankTitle = () => ({ arch: "", idea: "", text: "", on: [], perms: [line(), line(), line()] });
export function blankBuild() {
  return {
    v: 1,
    titles: [blankTitle(), blankTitle()],
    traits: [],
    actions: [...ACTIONS],
    equipment: [0, 1, 2].map(() => ({ ...line(), armour: false })),
    utility: [0, 1, 2, 3].map(line),
    keepsake: line(),
    bag: "",
    attuned: [0, 1].map(() => ({ name: "", catch: "", perms: [line(), line()] })),
    threads: [0, 1, 2, 3].map(() => ({ person: "", text: "", debt: false })),
    connect: [],
    aspiration: "",
    name: "", pronoun: "them", blurb: "", clothes: "", trouble: [],
  };
}

// Fill in anything missing, so an old or damaged build still opens.
const str = (v, max = 160) => (typeof v === "string" ? v.slice(0, max) : "");
const ons = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 12) : []);
const fixLine = (x) => ({ text: str(x?.text), on: ons(x?.on) });
export function normalBuild(raw) {
  const b = blankBuild();
  const r = raw && typeof raw === "object" ? raw : {};
  b.titles = b.titles.map((t, i) => {
    const x = r.titles?.[i] ?? {};
    return { arch: str(x.arch, 40), idea: str(x.idea, 40), text: str(x.text), on: ons(x.on), perms: t.perms.map((p, j) => fixLine(x.perms?.[j])) };
  });
  b.traits = (Array.isArray(r.traits) ? r.traits : []).filter((t) => t && str(t.name)).slice(0, 8).map((t) => ({
    name: str(t.name, 60), on: ons(t.on), ...(t.own ? { own: { type: str(t.own.type, 30), text: str(t.own.text) } } : {}),
  }));
  const own = (Array.isArray(r.actions) ? r.actions : []).map((a) => str(a, 30).trim()).filter((a) => a && !ACTIONS.includes(a));
  b.actions = [...ACTIONS, ...new Set(own)].slice(0, 12);
  b.equipment = b.equipment.map((e, i) => ({ ...fixLine(r.equipment?.[i]), armour: Boolean(r.equipment?.[i]?.armour) }));
  b.utility = b.utility.map((u, i) => fixLine(r.utility?.[i]));
  b.keepsake = fixLine(r.keepsake);
  b.bag = str(r.bag, 600);
  b.attuned = b.attuned.map((a, i) => {
    const x = r.attuned?.[i] ?? {};
    return { name: str(x.name, 80), catch: str(x.catch, 80), perms: a.perms.map((p, j) => fixLine(x.perms?.[j])) };
  });
  b.threads = b.threads.map((t, i) => ({ person: str(r.threads?.[i]?.person, 60), text: str(r.threads?.[i]?.text, 200), debt: Boolean(r.threads?.[i]?.debt) }));
  b.connect = (Array.isArray(r.connect) ? r.connect : []).slice(0, 12).map((a) => str(a, 200));
  for (const k of ["aspiration", "name", "blurb", "clothes"]) b[k] = str(r[k], k === "name" ? 40 : 160);
  b.pronoun = ["her", "him", "them"].includes(r.pronoun) ? r.pronoun : "them";
  b.trouble = ons(r.trouble).map((x) => str(x, 120));
  return b;
}

// Every line a set action can carry, by a reference that survives typing:
// t0 a Title, p0.1 a permission on it, r1 a trait, e0 and u2 what you carry,
// k the keepsake, a1.0 a permission on an attuned thing.
export function lineAt(b, ref) {
  const [i, j] = ref.slice(1).split(".").map(Number);
  switch (ref[0]) {
    case "t": return b.titles[i];
    case "p": return b.titles[i]?.perms[j];
    case "r": return b.traits[i];
    case "e": return b.equipment[i];
    case "u": return b.utility[i];
    case "k": return b.keepsake;
    case "a": return b.attuned[i]?.perms[j];
    default: return null;
  }
}

export function numbersOf(b, B) {
  const rule = new Map(B.traits.map((t) => [t.name, t]));
  const fx = (k) => b.traits.filter((t) => !t.own).map((t) => [t.name, rule.get(t.name)?.effects?.[k] ?? 0]).filter(([, v]) => v);
  const sum = (k) => fx(k).reduce((n, [, v]) => n + v, 0);
  const who = (k) => (fx(k).length ? both(fx(k).map(([n]) => n)) : null);
  const plates = b.equipment.filter((x) => x.text.trim() && x.armour).map((x) => x.text.trim());
  let armour = 2;
  for (let k = 0; k < plates.length; k++) armour = sizeUp(armour);
  let conf = 6;
  for (let k = 0; k < sum("confidence"); k++) conf = sizeUp(conf);
  return {
    aura: 5 + sum("aura"), resolve: Math.max(1, b.titles.filter((t) => t.arch || t.text.trim()).length),
    stride: 3 + sum("stride"), strideNote: who("stride"),
    armour, armourNote: plates.length ? both(plates) : null,
    confidence: conf, confidenceNote: who("confidence"),
    dressed: b.clothes.trim() ? { die: sizeUp(conf), what: b.clothes.trim() } : null,
    hurtBars: 3 + sum("hurtBars"), hurtNote: who("hurtBars"),
    utility: 3 + sum("utility"),
  };
}

// Everything that can go on a set action, in the sheet's order. The builder
// and the saved sheet both read this, so their steps always agree. A Title
// counts once it has a name, an archetype or a permission, and an attuned
// thing once it has a name or a permission that counts.
const titleIn = (t) => Boolean(t.text.trim() || t.arch || t.perms.some((p) => p.text.trim()));
const titleName = (t) => t.text.trim() || t.arch || "Untitled";
const attunedName = (a) => a.name.trim() || "Something attuned";
function linesOf(b, B) {
  const out = [];
  const max = numbersOf(b, B).utility;
  b.titles.forEach((t, i) => titleIn(t) && out.push({ ref: `t${i}`, kind: "title", label: titleName(t), i }));
  b.titles.forEach((t, i) => titleIn(t) && t.perms.forEach((p, j) => p.text.trim() && out.push({ ref: `p${i}.${j}`, kind: "permission", label: p.text.trim(), i })));
  b.traits.forEach((t, i) => out.push({ ref: `r${i}`, kind: "trait", label: t.name }));
  b.equipment.forEach((x, i) => x.text.trim() && out.push({ ref: `e${i}`, kind: "kit", label: x.text.trim() }));
  b.utility.slice(0, max).forEach((x, i) => x.text.trim() && out.push({ ref: `u${i}`, kind: "kit", label: x.text.trim() }));
  if (b.keepsake.text.trim()) out.push({ ref: "k", kind: "kit", label: b.keepsake.text.trim() });
  b.attuned.forEach((a, i) => a.perms.forEach((p, j) => p.text.trim() && (j === 0 || a.catch.trim()) && out.push({ ref: `a${i}.${j}`, kind: "attuned", label: p.text.trim(), item: attunedName(a), i })));
  return out;
}
const bagOf = (b) => b.bag.split("\n").map((x) => x.trim()).filter(Boolean);
const stepsOf = (b, B, name) => 1 + linesOf(b, B).filter((l) => lineAt(b, l.ref)?.on.includes(name)).length;

// The full sheet, the same shape as the crew's (scripts/build-content.mjs).
const made = new Map();
export function sheetOf(ch, B) {
  const json = JSON.stringify(ch.build);
  const hit = made.get(ch.id);
  if (hit && hit.json === json && hit.name === ch.name) return hit.sheet;
  const sheet = makeSheet(ch, normalBuild(ch.build), B);
  made.set(ch.id, { json, name: ch.name, sheet });
  return sheet;
}

function makeSheet(ch, b, B) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const TRAIT = new Map(B.traits.map((t) => [t.name, t]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const lines = [];
  const keyOf = new Map();
  const add = (ref, kind, label, extra = {}) => {
    const key = `l${lines.length}`;
    lines.push({ key, kind, label, ...extra });
    keyOf.set(ref, key);
    return key;
  };
  const numbers = numbersOf(b, B);
  const all = linesOf(b, B);
  const titles = all.filter((l) => l.kind === "title").map((l) => {
    const t = b.titles[l.i];
    return { name: l.label, archetype: t.arch || "", archetypeId: ARCH.get(t.arch)?.id ?? null, i: l.i, key: add(l.ref, "title", l.label) };
  });
  for (const x of titles) {
    x.permissions = all.filter((l) => l.kind === "permission" && l.i === x.i).map((l) => ({ text: l.label, key: add(l.ref, "permission", l.label, { title: x.name }) }));
  }
  const taken = new Map();
  for (const x of titles) if (x.archetype) taken.set(x.archetype, (taken.get(x.archetype) ?? 0) + 1);
  const archetypeRules = [...taken].map(([name, times]) => {
    const rule = ARCH.get(name) ?? {};
    const bonus = times + 1;
    return {
      name, id: rule.id ?? null, times, summary: rule.summary ?? "",
      aura: times > 1 && rule.aura ? rule.aura.replace(/\+2\b/, `+${bonus}`) : rule.aura ?? "",
      auraHtml: times > 1 && rule.auraHtml ? rule.auraHtml.replace(/\+2\b/, `+${bonus}`) : rule.auraHtml ?? "",
      bonus: /^\+2\b/.test(rule.aura ?? "") ? bonus : 0,
    };
  });
  const traits = b.traits.map((t, i) => {
    const rule = t.own ? null : TRAIT.get(t.name);
    const text = t.own?.text ?? "";
    const step = rule ? rule.step : /\+1 step\b/.test(text);
    return {
      name: t.name, type: rule?.type ?? t.own?.type ?? "", html: rule?.html ?? esc(text), step,
      aura: rule ? rule.aura : Number(text.match(/\bGain (\d+) Aura\b/)?.[1] ?? 0), key: add(`r${i}`, "trait", t.name, { step }),
    };
  });
  const kit = all.filter((l) => l.kind === "kit");
  for (const l of kit) add(l.ref, "kit", l.label);
  const carry = {
    equipment: { items: kit.filter((l) => l.ref[0] === "e").map((l) => l.label), max: 3, note: null },
    utility: { items: kit.filter((l) => l.ref[0] === "u").map((l) => l.label), max: numbers.utility, note: null },
    keepsake: b.keepsake.text.trim() || null,
    bag: { name: "a bag", max: 10, items: bagOf(b).slice(0, 10) },
  };
  const attuned = b.attuned.map((a, i) => ({ a, i, perms: all.filter((l) => l.kind === "attuned" && l.i === i) })).filter(({ a, perms }) => a.name.trim() || perms.length).map(({ a, perms }) => {
    const name = attunedName(a);
    return { name, props: null, stage: "Awakened", catch: a.catch.trim() || null, permissions: perms.map((l) => ({ text: l.label, key: add(l.ref, "attuned", l.label, { item: name }) })) };
  });
  const actions = b.actions.map((name) => {
    const on = [...keyOf].filter(([ref]) => lineAt(b, ref)?.on.includes(name)).map(([, key]) => key);
    return { name, steps: on.length + 1, die: diceLabel(stepsToDice(on.length + 1)), lines: on };
  });
  const threads = [];
  const room = b.threads.some((t) => t.debt) ? 4 : 3;
  for (const th of b.threads.slice(0, room)) {
    const person = th.person.trim();
    if (!person || !th.text.trim()) continue;
    let g = threads.find((x) => x.person === person);
    if (!g) threads.push((g = { person, threads: [] }));
    g.threads.push({ text: th.text.trim(), note: th.debt ? "a debt" : null, debt: th.debt });
  }
  const plays = [...new Set(b.titles.map((t) => IDEA.get(t.idea)?.playsLike).filter(Boolean))];
  const names = [...taken.keys()];
  delete numbers.utility;
  return {
    id: ch.id, name: ch.name, own: true,
    title: titles[0]?.name ?? "",
    blurb: b.blurb.trim() || (plays.length ? `${cap(plays.join(", and "))}.` : ""),
    archetypes: names.length === 1 && taken.get(names[0]) > 1 ? [`${names[0]}, twice`] : names,
    hash: ch.hash,
    pronoun: b.pronoun,
    playsLike: esc(plays.join(", and ") || both(names) || "your own"),
    titles: titles.map(({ name, archetype, archetypeId, key, permissions }) => ({ name, archetype, archetypeId, key, permissions })),
    archetypeRules, traits, actions, lines, carry, attuned, numbers, threads,
    crewQs: B.connect.map((q, i) => ({ q, a: (b.connect[i] ?? "").trim() })).filter((x) => x.a),
    aspiration: { text: b.aspiration.trim(), die: 2 },
    trouble: b.trouble,
  };
}

// What the builder flags. Nothing here stops a save.
export function checksOf(b, B) {
  const out = [];
  const n = numbersOf(b, B);
  b.titles.forEach((t, i) => {
    const which = `Your ${ORD[i]} Title`;
    if (!t.arch) out.push({ step: 0, text: `${which} hasn’t got an archetype.` });
    if (!t.text.trim()) out.push({ step: 1, text: `${which} hasn’t got a name.` });
    const perms = t.perms.filter((p) => p.text.trim());
    if (perms.length !== 3) out.push({ step: 1, text: `${which} has ${perms.length} permission${perms.length === 1 ? "" : "s"}. The quick build gives it three.` });
    for (const p of perms) if (!/\s/.test(p.text.trim())) out.push({ step: 1, text: `“${p.text.trim()}” looks short. A permission needs a doing word and how, what or where.` });
  });
  const traits = b.traits.length;
  if (traits !== 2) out.push({ step: 2, text: `You’ve got ${traits} trait${traits === 1 ? "" : "s"}. You start with two.` });
  if (!b.keepsake.text.trim()) out.push({ step: 4, text: "You haven’t got a keepsake yet." });
  const att = b.attuned.filter((a) => a.name.trim());
  if (att.length !== 2) out.push({ step: 4, text: `You’ve attuned ${att.length} thing${att.length === 1 ? "" : "s"}. You start with 2 slots.` });
  b.attuned.forEach((a) => {
    if (a.name.trim() && !a.perms[0].text.trim()) out.push({ step: 4, text: `${cap(a.name.trim())} needs a permission.` });
    if (a.perms[1].text.trim() && !a.catch.trim()) out.push({ step: 4, text: `${cap(a.name.trim() || "Your attuned thing")} only gets a second permission with a Catch.` });
  });
  if (b.utility.slice(n.utility).some((u) => u.text.trim())) out.push({ step: 4, text: `You can carry ${n.utility} utility items, so the last one won’t go on the sheet.` });
  if (bagOf(b).length > 10) out.push({ step: 4, text: `Your bag holds 10, so the last ${bagOf(b).length - 10} won’t go in.` });
  const room = b.threads.some((t) => t.debt) ? 4 : 3;
  const threads = b.threads.slice(0, room).filter((t) => t.person.trim() && t.text.trim()).length;
  if (threads < 3) out.push({ step: 5, text: `You’ve written ${threads} thread${threads === 1 ? "" : "s"}. You start with three.` });
  if (!b.aspiration.trim()) out.push({ step: 6, text: "You haven’t written your Aspiration." });
  if (!b.name.trim()) out.push({ step: 7, text: "Your character needs a name." });
  return out;
}

// ---------------------------------------------------------------- drafts

function readDrafts() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
function writeDrafts(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
const blankJson = JSON.stringify(blankBuild());
export const hasDraft = () => {
  const d = readDrafts().new;
  if (!d || JSON.stringify(normalBuild(d.build)) === blankJson) return null;
  return { name: str(d.build?.name, 40) };
};

// ---------------------------------------------------------------- the screens

const WAYS = ["blank", "crew", "random"];
const STEPS = [
  { name: "Archetypes", rules: "s-title" },
  { name: "Titles and permissions", rules: "s-writing-permissions" },
  { name: "Traits", rules: "s-traits" },
  { name: "Set actions", rules: "s-step-set-actions" },
  { name: "What you carry", rules: "s-items" },
  { name: "Threads", rules: "s-bonds" },
  { name: "Aspiration", rules: "s-aspiration" },
  { name: "Check it and play", rules: "s-starting-numbers" },
];

export function makeBuilder({ B, link, icon, onSave, onLeave, toast, roll }) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const TRAIT = new Map(B.traits.map((t) => [t.name, t]));
  let slotKey = "new";
  let d = null; // { step, deep: {}, page, way, from, build }
  let saveTimer = 0;
  let refreshTimer = 0;
  let sure = false; // Roll again has been tapped once over changes
  let rolled = ""; // the random build as it was rolled

  const save = () => {
    clearTimeout(saveTimer);
    const all = readDrafts();
    all[slotKey] = { step: d.step, deep: d.deep, page: d.page, way: d.way, from: d.from, build: d.build };
    writeDrafts(all);
  };
  const saveSoon = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  };
  function open(key, from) {
    slotKey = key || "new";
    const kept = readDrafts()[slotKey];
    d = kept
      ? { step: Math.min(7, Math.max(0, Number(kept.step) || 0)), deep: kept.deep && typeof kept.deep === "object" ? kept.deep : {}, page: Boolean(kept.page), way: WAYS.includes(kept.way) ? kept.way : "", from: str(kept.from, 40), build: normalBuild(kept.build) }
      : { step: from ? 7 : 0, deep: {}, page: false, way: "", from: "", build: normalBuild(from ?? blankBuild()) };
    sure = false;
  }
  // A new character from one of the other ways in, on one page. It takes the
  // place of any draft of a new one, so the list asks first.
  function begin(build, way, from = "") {
    clearTimeout(saveTimer);
    slotKey = "new";
    d = { step: 0, deep: {}, page: true, way, from, build: normalBuild(build) };
    sure = false;
    rolled = way === "random" ? JSON.stringify(d.build) : "";
    save();
  }
  function discard(key = slotKey) {
    clearTimeout(saveTimer);
    const all = readDrafts();
    delete all[key];
    writeDrafts(all);
    if (key === slotKey) d = null;
  }

  const b = () => d.build;
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const chip = (label, attrs, on = false, cls = "") => `<button type="button" class="cc-chipbtn${cls ? ` ${cls}` : ""}" data-act="b" ${attrs}${pressed(on)}>${label}</button>`;
  const field = (path, label, value, { ph = "", max = 120, area = false } = {}) => {
    const id = `b-${path.replace(/\./g, "-")}`;
    const input = area
      ? `<textarea id="${id}" data-bin="${path}" rows="4" maxlength="${max}" placeholder="${esc(ph || " ")}">${esc(value)}</textarea>`
      : `<input id="${id}" data-bin="${path}" value="${esc(value)}" maxlength="${max}" autocomplete="off" placeholder="${esc(ph || " ")}">`;
    return `<label class="cc-field" for="${id}">${label}</label>${input}`;
  };
  // The book's words for each step are open a step at a time, and closed on
  // one page, where they'd bury the sheet.
  const howOpen = (i) => (d.page ? d.deep[`how${i}`] === true : d.deep[`how${i}`] !== false);
  const how = (i) => `<details class="bd-how" data-open="bd-how-${i}"${howOpen(i) ? " open" : ""}><summary>How this step works</summary><p>${B.quick[i]}</p></details>`;
  const deepBtn = (i, label) => `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="${i}"${pressed(d.deep[i])}>${d.deep[i] ? "Back to the quick build" : label}</button></div>`;
  const toggles = (ref, label) => {
    const l = lineAt(b(), ref);
    return `<div class="bd-on" role="group" aria-label="Set actions for ${esc(label)}">${b().actions.map((a) => chip(esc(a), `data-b="on" data-l="${ref}" data-a="${esc(a)}"`, l?.on.includes(a), "sm")).join("")}</div>`;
  };

  const backLink = () => `<a class="cc-back" href="/characters/${slotKey === "new" ? "" : `?c=${encodeURIComponent(slotKey)}`}" data-act="b" data-b="leave">${icon.back}${slotKey === "new" ? "Characters" : esc(b().name || "Back")}</a>`;
  const kicker = () => (slotKey === "new" ? "Make your own" : `Changing ${esc(b().name || "your character")}`);
  const dropEdit = () => (slotKey === "new" ? "" : '<button type="button" class="button sm" data-act="b" data-b="dropedit">Drop these changes</button>');

  function head() {
    const i = d.step;
    const dots = STEPS.map((s, k) => `<li><button type="button" class="bd-dot${k === i ? " is-now" : ""}" data-act="b" data-b="go" data-s="${k}" aria-label="Step ${k + 1}: ${s.name}"${k === i ? ' aria-current="step"' : ""}>${k + 1}</button></li>`).join("");
    return `${backLink()}<header class="cc-head bd-head"><p class="kicker">${kicker()} · Step ${i + 1} of 8</p>
      <h1 tabindex="-1">${STEPS[i].name}</h1><ol class="bd-dots" aria-label="Steps">${dots}</ol></header>`;
  }

  function foot() {
    const i = d.step;
    const next = i < 7 ? `<button type="button" class="button primary" data-act="b" data-b="go" data-s="${i + 1}">Next: ${STEPS[i + 1].name}</button>` : `<button type="button" class="button primary" data-act="b" data-b="save">Save and play</button>`;
    return `<div class="bd-foot">${i ? `<button type="button" class="button" data-act="b" data-b="go" data-s="${i - 1}">Back</button>` : ""}${next}</div>
      <p class="cc-lead">${link(STEPS[i].rules, "Read this step in the rules")}. Your work’s saved on this phone as you go.</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">See it all on one page</button>${dropEdit()}</div>`;
  }

  // Every step on one page, for a blank sheet, one of the crew or random.
  function pageView() {
    const title = { blank: "A blank sheet", crew: `From ${esc(d.from || "the crew")}`, random: "Random" }[d.way] ?? "All on one page";
    const parts = BODIES.map((body, i) => `<section class="bd-part" aria-labelledby="bd-part-${i}">${part(i)}</section>`).join("");
    return `${backLink()}<header class="cc-head bd-head"><p class="kicker">${kicker()} · All on one page</p><h1 tabindex="-1">${title}</h1>
      <div class="cc-row">${d.way === "random" ? `<button type="button" class="button" data-act="b" data-b="reroll">${sure ? "Tap again to lose your changes" : "Roll again"}</button>` : ""}<button type="button" class="button" data-act="b" data-b="page">Go step by step</button></div></header>
      <div class="bd-body bd-page">${parts}</div>
      <div class="bd-foot"><button type="button" class="button primary" data-act="b" data-b="save">Save and play</button></div>
      <p class="cc-lead">${link("s-quick", "The Quick Build in the rules")}. Your work’s saved on this phone as you go.</p>
      ${dropEdit() ? `<div class="cc-row">${dropEdit()}</div>` : ""}`;
  }

  // Step 1: two archetypes, and a Title idea for each.
  function stepArch() {
    const x = b();
    const same = x.titles[0].arch && x.titles[0].arch === x.titles[1].arch && /^\+2\b/.test(ARCH.get(x.titles[0].arch)?.aura ?? "");
    const card = (t, i) => {
      const a = ARCH.get(t.arch);
      const fits = B.ideas.filter((idea) => d.deep[0] || !a || idea.archetypes.includes(t.arch));
      const groups = [...new Set(fits.map((idea) => idea.group))];
      const ideaChips = groups.map((g) => `${groups.length > 1 || d.deep[0] ? `<p class="bd-label">${esc(g)}</p>` : ""}<div class="cc-chips">${fits.filter((idea) => idea.group === g).map((idea) => chip(esc(idea.name), `data-b="idea" data-t="${i}" data-v="${idea.id}"`, t.idea === idea.id)).join("")}</div>`).join("");
      const idea = IDEA.get(t.idea);
      return `<fieldset class="cc-group bd-card"><legend>Your ${ORD[i]} Title</legend>
        <p class="bd-label" id="bd-arch-${i}">Archetype</p><div class="cc-chips" role="group" aria-labelledby="bd-arch-${i}">${B.archetypes.map((r) => chip(esc(r.name), `data-b="arch" data-t="${i}" data-v="${esc(r.name)}"`, t.arch === r.name)).join("")}</div>
        ${a ? `<div class="bd-rule"><p>${a.summary}</p>${a.auraHtml ? `<p><b>1 Aura:</b> ${a.auraHtml}</p>` : ""}<p class="cc-small">${link(a.id, `The ${esc(a.name)} in full`)}</p></div>` : ""}
        ${a || d.deep[0] ? `<p class="bd-label">A Title idea, if you like</p>${fits.length ? ideaChips : `<p class="cc-lead">None of the ideas lists the ${esc(t.arch)}, so write your own Title on the next step, or open the full build to see every idea.</p>`}
        ${idea ? `<p class="cc-small">${esc(cap(idea.playsLike))}. ${link(idea.id, `The ${esc(idea.name)} idea`)}</p>` : ""}` : ""}</fieldset>`;
    };
    return `${how(0)}${x.titles.map(card).join("")}
      ${same ? `<p class="cc-note" role="status">${esc(x.titles[0].arch)} twice, so your +2 is a +3.</p>` : ""}
      ${deepBtn(0, "Show every Title idea")}`;
  }

  // Step 2: name each Title and give it three permissions.
  function stepTitles() {
    const x = b();
    const card = (t, i) => {
      const idea = IDEA.get(t.idea);
      const used = new Set(t.perms.map((p) => p.text.trim().toLowerCase()));
      const offer = (list) => `<div class="cc-chips">${list.map((p) => chip(`<em>${esc(p)}</em>`, `data-b="perm" data-t="${i}" data-v="${esc(p)}"`, used.has(p.toLowerCase()))).join("")}</div>`;
      return `<fieldset class="cc-group bd-card"><legend>Your ${ORD[i]} Title</legend>
        <p class="cc-small">${t.arch ? `${esc(t.arch)}${idea ? `, from the ${esc(idea.name)} idea` : ""}` : "No archetype yet"}</p>
        ${field(`t${i}.text`, "Your Title", t.text, { ph: "Make it specific: the best blade in the Low Market", max: 80 })}
        ${idea ? `<p class="cc-small">Or take one of the idea’s:</p><div class="cc-chips">${idea.titles.map((name) => chip(esc(name), `data-b="title" data-t="${i}" data-v="${esc(name)}"`, t.text.trim() === name)).join("")}</div>` : ""}
        <p class="bd-label">Three permissions</p>
        ${t.perms.map((p, j) => field(`t${i}.p${j}`, `Permission ${j + 1}`, p.text, { ph: "a doing word, and how, what or where", max: 80 })).join("")}
        ${idea ? `<p class="cc-small">Tap one of the ${esc(idea.name)} idea’s to add it, or tap it again to take it off.</p>${offer(idea.permissions)}` : ""}
        ${d.deep[1] ? B.permIdeas.map((g) => `<p class="bd-label">${esc(g.for)}</p>${offer(g.perms)}`).join("") : ""}</fieldset>`;
    };
    return `${how(1)}${x.titles.map(card).join("")}
      <section class="bd-test" aria-labelledby="bd-test-h"><h2 id="bd-test-h">The quick test</h2><ol>${B.quickTest.map((q) => `<li>${q}</li>`).join("")}</ol><p>Four yeses and it’s a permission.</p></section>
      ${deepBtn(1, "Show more permission ideas")}`;
  }

  // Step 3: two traits.
  function stepTraits() {
    const x = b();
    const picked = new Set(x.traits.map((t) => t.name));
    const suggested = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.traits ?? []))].filter((n) => TRAIT.has(n));
    const card = (t) => `<button type="button" class="bd-trait" data-act="b" data-b="trait" data-v="${esc(t.name)}"${pressed(picked.has(t.name))}><b>${esc(t.name)}</b> <small>${esc(t.type)}</small><span>${t.html.replace(/<a [^>]*>|<\/a>/g, "")}</span></button>`;
    const showAll = d.deep[2] || !suggested.length;
    const groups = [...new Set(B.traits.map((t) => t.group))];
    const own = x.traits.find((t) => t.own);
    return `${how(2)}
      <p class="cc-note" role="status">You’ve picked ${x.traits.length} of 2${x.traits.length ? `: ${esc(both(x.traits.map((t) => t.name)))}` : ""}.</p>
      ${own ? `<h2>Your own</h2><div class="bd-traits"><button type="button" class="bd-trait" data-act="b" data-b="trait" data-v="${esc(own.name)}" aria-pressed="true"><b>${esc(own.name)}</b> <small>${esc(own.own.type)}</small><span>${esc(own.own.text)}</span></button></div><p class="cc-lead">Tap it to take it off.</p>` : ""}
      ${suggested.length ? `<h2>From your Title ideas</h2><div class="bd-traits">${suggested.map((n) => card(TRAIT.get(n))).join("")}</div>` : ""}
      ${showAll ? groups.map((g) => `<h2>${esc(g || "Traits")}</h2><div class="bd-traits">${B.traits.filter((t) => t.group === g).map(card).join("")}</div>`).join("") : ""}
      ${d.deep[2] ? `<fieldset class="cc-group bd-card"><legend>Write your own</legend><p class="cc-lead">A name, a type and one line. If it changes a number, tell your GM which.</p>
        ${field("own.name", "Name", own?.name ?? "", { max: 40 })}
        <label class="cc-field" for="b-own-type">Type</label><select id="b-own-type" data-bin="own.type">${["Passive", "Triggered", "Invoked", "Once per scene", "Once per downtime"].map((k) => `<option${own?.own.type === k ? " selected" : ""}>${k}</option>`).join("")}</select>
        ${field("own.text", "What it does", own?.own.text ?? "", { max: 120 })}
        <div class="cc-row"><button type="button" class="button" data-act="b" data-b="own">${own ? "Update it" : "Add it"}</button></div></fieldset>` : ""}
      ${deepBtn(2, suggested.length ? "Show all the traits, or write your own" : "Write your own trait")}`;
  }

  // Step 4: set actions. Lines from both Titles, the permissions and the traits.
  function tiles(names) {
    const x = b();
    return `<div class="cc-tiles bd-tiles">${names.map((a) => {
      const s = stepsOf(x, B, a);
      return `<div class="tile card"><span class="tile-name">${esc(a)}</span><span class="tile-steps">${s} step${s === 1 ? "" : "s"}</span><span class="hex tile-die">${diceLabel(stepsToDice(s))}</span></div>`;
    }).join("")}</div>`;
  }
  function lineRows(kinds) {
    const x = b();
    const rows = linesOf(x, B).filter((l) => kinds.includes(l.kind));
    const say = (l) => (l.kind === "title" ? `Title: <em>${esc(l.label)}</em>` : l.kind === "permission" || l.kind === "attuned" ? `<em>${esc(l.label)}</em>` : esc(l.label));
    return rows.length ? `<ul class="bd-lines">${rows.map((l) => `<li><p>${say(l)}</p>${toggles(l.ref, l.label)}</li>`).join("")}</ul>` : "";
  }
  function stepActions() {
    const x = b();
    const own = x.actions.filter((a) => !ACTIONS.includes(a));
    return `${how(3)}${tiles(x.actions)}
      <h2>What goes on each</h2><p class="cc-lead">Tap a set action under each line if it’d help nearly every time you do it. A line can go on as many as it fits.</p>
      ${lineRows(["title", "permission", "trait"]) || '<p class="cc-lead">Your Titles, permissions and traits show up here once you’ve written them.</p>'}
      <h2>One of your own</h2><p class="cc-lead">Something you do all the time, like Locks or Ward, or Shoot if you’d rather keep it apart from Fight.</p>
      <div class="cc-form">${field("newact", "Its name", "", { max: 30, ph: "Locks" })}<button type="button" class="button" data-act="b" data-b="addact">Add it</button></div>
      ${own.length ? `<div class="cc-chips">${own.map((a) => `<button type="button" class="cc-chipbtn" data-act="b" data-b="dropact" data-a="${esc(a)}" aria-label="Take off ${esc(a)}">${esc(a)} ×</button>`).join("")}</div>` : ""}`;
  }

  // Step 5: what you carry, and two attuned things.
  function stepCarry() {
    const x = b();
    const n = numbersOf(x, B);
    const group = (name) => B.items.find((g) => g.group === name)?.items ?? [];
    const has = new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim().toLowerCase()).filter(Boolean));
    const offer = (kind, label, list) => `<p class="bd-label">${label}</p><div class="cc-chips">${list.map((v) => chip(esc(v), `data-b="fillany" data-k="${kind}" data-v="${esc(v)}"`, has.has(v.toLowerCase()))).join("")}</div>`;
    const slot = (kind, i, label) => {
      const ref = `${kind}${i}`;
      const item = lineAt(x, ref);
      return `<div class="bd-slot">${field(ref, label, item.text, { max: 60, ph: "Type it, or tap one below" })}
        ${kind === "e" ? `<div class="cc-row">${chip("Armour a size bigger", `data-b="armour" data-i="${i}"`, item.armour, "sm")}</div>` : ""}
        ${toggles(ref, item.text || label)}</div>`;
    };
    const things = [...new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim()).filter(Boolean))];
    const att = (a, i) => `<fieldset class="cc-group bd-card bd-att"><legend>Attuned thing ${i + 1}</legend>
      ${field(`a${i}.name`, "What it is", a.name, { max: 60, ph: "a perfect set of picks" })}
      ${things.length ? `<p class="bd-label">Or one of yours</p><div class="cc-chips">${things.map((v) => chip(esc(v), `data-b="fill" data-p="a${i}.name" data-v="${esc(v)}"`, a.name.trim() === v)).join("")}</div>` : ""}
      ${field(`a${i}.p0`, "Its permission", a.perms[0].text, { max: 80, ph: "what the thing itself does" })}${toggles(`a${i}.0`, a.perms[0].text || "its permission")}
      ${field(`a${i}.catch`, "Its Catch, if you’d like a second permission", a.catch, { max: 60, ph: "Wanted" })}
      <div class="cc-chips">${B.catches.map((c) => chip(esc(c.name), `data-b="fill" data-p="a${i}.catch" data-v="${esc(c.name)}"`, a.catch.trim() === c.name)).join("")}</div>
      <div class="bd-perm2">${field(`a${i}.p1`, "Its second permission", a.perms[1].text, { max: 80, ph: "it comes with the Catch" })}${toggles(`a${i}.1`, a.perms[1].text || "its second permission")}</div></fieldset>`;
    return `${how(4)}
      <section aria-labelledby="bd-eq"><h2 id="bd-eq">3 equipment</h2><p class="cc-lead">What you wear or wield. Each piece of plain armour makes your Armour a size bigger.</p>
        ${x.equipment.map((e, i) => slot("e", i, `Equipment ${i + 1}`)).join("")}
        ${offer("e", "Weapons", group("Weapons"))}${offer("e", "Armour and wearables", group("Armour & wearables"))}</section>
      <section aria-labelledby="bd-ut"><h2 id="bd-ut">${n.utility} utility items</h2><p class="cc-lead">Tools and things you use up.</p>
        ${x.utility.slice(0, n.utility).map((u, i) => slot("u", i, `Utility ${i + 1}`)).join("")}
        ${offer("u", "Tools", group("Tools"))}${offer("u", "Foci", group("Foci"))}${offer("u", "Things you use up", B.usedUp.map((u) => u.name))}</section>
      <section aria-labelledby="bd-ks"><h2 id="bd-ks">A keepsake</h2><p class="cc-lead">Something that matters to your character.</p>
        <div class="bd-slot">${field("k", "Keepsake", x.keepsake.text, { max: 60, ph: "Type it, or tap one below" })}${toggles("k", x.keepsake.text || "your keepsake")}</div>
        ${offer("k", "Keepsakes", B.keepsakes.map((k) => k.name))}${offer("k", "Signature things", group("Signature"))}</section>
      <section aria-labelledby="bd-at"><h2 id="bd-at">Attune two things</h2><p class="cc-lead">They start at Awakened with one permission each, and they don’t count towards what you carry.</p>
        ${x.attuned.map(att).join("")}</section>
      ${d.deep[4] ? `<section aria-labelledby="bd-bag"><h2 id="bd-bag">Your bag</h2>${field("bag", "Up to 10 more things, one a line", x.bag, { area: true, max: 600 })}</section>` : ""}
      ${deepBtn(4, "Pack your bag too")}`;
  }

  // Step 6: three threads, and the Connect questions in the full build.
  function stepThreads() {
    const x = b();
    const room = x.threads.some((t) => t.debt) ? 4 : 3;
    const row = (t, i) => `<fieldset class="cc-group bd-card"><legend>Thread ${i + 1}</legend>
      ${field(`th${i}.person`, "Who with", t.person, { max: 60, ph: i === 2 ? "someone outside the crew" : "someone in the crew" })}
      ${field(`th${i}.text`, "What’s true between you", t.text, { max: 200, ph: "a debt, a rescue, a secret or a shared past" })}
      <div class="cc-row">${chip("It’s a debt", `data-b="debt" data-i="${i}"`, t.debt, "sm")}</div></fieldset>`;
    return `${how(5)}${x.threads.slice(0, room).map(row).join("")}
      ${room === 4 ? '<p class="cc-note" role="status">One’s a debt, so you’ve got room for a fourth.</p>' : ""}
      ${d.deep[5] ? `<section aria-labelledby="bd-connect"><h2 id="bd-connect">Connect</h2><p class="cc-lead">Answer at least two, and name someone in the crew in each. A good answer can become a thread.</p>
        ${B.connect.map((q, i) => field(`cq${i}`, esc(q), x.connect[i] ?? "", { max: 200 })).join("")}</section>` : ""}
      ${deepBtn(5, "Answer the Connect questions")}`;
  }

  // Step 7: one thing you want.
  function stepAsp() {
    return `${how(6)}${field("asp", "Your Aspiration, at d2", b().aspiration, { max: 120, ph: "Own the score of a lifetime" })}`;
  }

  // Step 8: the numbers, a name, and a last look.
  function stepCheck() {
    const x = b();
    const n = numbersOf(x, B);
    const checks = checksOf(x, B);
    const trouble = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.trouble ?? []))];
    const num = (k, v, note) => `<li><span class="k">${k}</span> <b>${v}</b>${note ? ` <small>(${esc(note)})</small>` : ""}</li>`;
    return `${how(7)}
      <fieldset class="cc-group bd-card"><legend>Who they are</legend>
        ${field("name", "Name", x.name, { max: 40 })}
        <p class="bd-label" id="bd-pro">Call them</p><div class="cc-chips" role="group" aria-labelledby="bd-pro">${[["her", "she, her"], ["him", "he, him"], ["them", "they, them"]].map(([v, l]) => chip(l, `data-b="pronoun" data-v="${v}"`, x.pronoun === v)).join("")}</div>
        ${field("blurb", "One line about them, if you like", x.blurb, { max: 160 })}</fieldset>
      <h2>Your numbers</h2><ul class="bd-nums">
        ${num("Aura", n.aura)}${num("Resolve", n.resolve, "one for each Title")}${num("Stride", n.stride, n.strideNote)}
        ${num("Hurt", `${n.hurtBars} bars`, n.hurtNote)}${num("Armour", `d${n.armour}`, n.armourNote)}${num("Confidence", `d${n.confidence}`, n.confidenceNote ? `${n.confidenceNote}, every scene` : "every scene")}</ul>
      ${field("clothes", "Clothes that fit some scenes, if you’ve got them", x.clothes, { max: 60, ph: "a fine coat" })}
      <p class="cc-lead">In them, Confidence starts a size up when they fit the scene.</p>
      <h2>Set actions</h2>${tiles(x.actions)}
      ${trouble.length ? `<h2>Trouble that follows you</h2><p class="cc-lead">If you like. Let it cause real trouble and you take 1 Aura.</p><div class="cc-chips">${trouble.map((t) => chip(`<em>${esc(t)}</em>`, `data-b="trouble" data-v="${esc(t)}"`, x.trouble.includes(t))).join("")}</div>` : ""}
      ${checks.length ? `<div class="cc-note is-warn"><p>A few things to look at. You can save anyway, and change them later.</p><ul class="bd-checks">${checks.map((c) => `<li>${esc(c.text)} <button type="button" class="button sm" data-act="b" data-b="go" data-s="${c.step}">${d.page ? STEPS[c.step].name : `Step ${c.step + 1}`}</button></li>`).join("")}</ul></div>` : '<p class="cc-note" role="status">Everything adds up.</p>'}`;
  }

  const BODIES = [stepArch, stepTitles, stepTraits, stepActions, stepCarry, stepThreads, stepAsp, stepCheck];
  const part = (i) => `<h2 id="bd-part-${i}" tabindex="-1">${STEPS[i].name}</h2>${BODIES[i]().replace(/<(\/?)h2\b/g, "<$1h3")}`;
  // Typing on one page redraws the parts that add it all up (the set actions
  // and the last look) after a pause, but only below where you're typing, so
  // nothing moves under the keyboard.
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!d?.page) return;
      const at = document.activeElement?.closest(".bd-part");
      const from = at ? Number(at.getAttribute("aria-labelledby").slice("bd-part-".length)) : -1;
      for (const i of [3, 7]) {
        const el = i > from && document.querySelector(`.bd-part[aria-labelledby="bd-part-${i}"]`);
        if (el) el.innerHTML = part(i);
      }
    }, 400);
  }
  function view(key, from) {
    if (!d || slotKey !== (key || "new")) open(key, from);
    if (d.page) return pageView();
    return `${head()}<div class="bd-body">${BODIES[d.step]()}</div>${foot()}`;
  }

  // Everything typed goes straight into the draft. Nothing redraws mid-word.
  function input(el) {
    const x = b();
    const path = el.dataset.bin;
    const v = el.value;
    let m;
    if ((m = path.match(/^t(\d)\.text$/))) x.titles[m[1]].text = v;
    else if ((m = path.match(/^t(\d)\.p(\d)$/))) x.titles[m[1]].perms[m[2]].text = v;
    else if ((m = path.match(/^([eu])(\d)$/))) {
      const item = lineAt(x, path);
      const was = ARMOUR.test(item.text);
      item.text = v;
      if (m[1] === "e" && was !== ARMOUR.test(v)) {
        item.armour = ARMOUR.test(v);
        document.querySelector(`[data-b="armour"][data-i="${m[2]}"]`)?.setAttribute("aria-pressed", String(item.armour));
      }
    } else if (path === "k") x.keepsake.text = v;
    else if ((m = path.match(/^a(\d)\.name$/))) x.attuned[m[1]].name = v;
    else if ((m = path.match(/^a(\d)\.catch$/))) x.attuned[m[1]].catch = v;
    else if ((m = path.match(/^a(\d)\.p(\d)$/))) x.attuned[m[1]].perms[m[2]].text = v;
    else if ((m = path.match(/^th(\d)\.(person|text)$/))) x.threads[m[1]][m[2]] = v;
    else if ((m = path.match(/^cq(\d+)$/))) x.connect[m[1]] = v;
    else if (["asp", "name", "blurb", "clothes", "bag"].includes(path)) x[path === "asp" ? "aspiration" : path] = v;
    else return; // newact and own.* are read when their button's tapped
    saveSoon();
    if (d.page) refreshSoon();
  }

  const value = (id) => document.getElementById(id)?.value ?? "";
  // Taps. Each one changes the draft, saves it and redraws.
  function act(el, e, render, focusTop) {
    const x = b();
    const k = el.dataset.b;
    const i = Number(el.dataset.t ?? el.dataset.i ?? 0);
    const v = el.dataset.v ?? "";
    if (k !== "reroll") sure = false;
    if (k === "leave") {
      e.preventDefault();
      save();
      return onLeave(slotKey);
    }
    if (k === "dropedit") {
      const key = slotKey;
      discard();
      return onLeave(key);
    }
    if (k === "go") {
      d.step = Math.min(7, Math.max(0, Number(el.dataset.s)));
      if (d.page) {
        const h = document.getElementById(`bd-part-${d.step}`);
        h?.scrollIntoView({ block: "start" });
        return h?.focus({ preventScroll: true });
      }
      save();
      render();
      return focusTop();
    }
    if (k === "reroll") {
      if (JSON.stringify(x) !== rolled && !sure) {
        sure = true;
        return render();
      }
      sure = false;
      d.build = normalBuild(roll());
      rolled = JSON.stringify(d.build);
      save();
      return render();
    }
    if (k === "page") {
      d.page = !d.page;
      d.step = 0;
      save();
      render();
      return focusTop();
    }
    if (k === "save") {
      save();
      return onSave(normalBuild(x), slotKey, () => discard());
    }
    if (k === "deep") d.deep[el.dataset.s] = !d.deep[el.dataset.s];
    else if (k === "arch") {
      const t = x.titles[i];
      t.arch = t.arch === v ? "" : v;
      if (t.idea && !IDEA.get(t.idea)?.archetypes.includes(t.arch)) t.idea = "";
    } else if (k === "idea") x.titles[i].idea = x.titles[i].idea === v ? "" : v;
    else if (k === "title") x.titles[i].text = v;
    else if (k === "perm") {
      const perms = x.titles[i].perms;
      const at = perms.findIndex((p) => p.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) perms[at] = { text: "", on: [] };
      else {
        const free = perms.findIndex((p) => !p.text.trim());
        if (free < 0) return toast("That Title’s got three. Tap one to take it off first, or change one by hand.", false);
        perms[free] = { text: v, on: [] };
      }
    } else if (k === "trait") {
      const at = x.traits.findIndex((t) => t.name === v);
      if (at >= 0) x.traits.splice(at, 1);
      else x.traits.push({ name: v, on: [] });
    } else if (k === "own") {
      const name = value("b-own-name").trim();
      const text = value("b-own-text").trim();
      if (!name) return toast("Give your trait a name first.", false);
      const own = { type: value("b-own-type") || "Passive", text };
      const at = x.traits.findIndex((t) => t.own);
      if (at >= 0) x.traits[at] = { ...x.traits[at], name, own };
      else x.traits.push({ name, on: [], own });
    } else if (k === "on") {
      const l = lineAt(x, el.dataset.l);
      if (!l) return;
      const a = el.dataset.a;
      l.on = l.on.includes(a) ? l.on.filter((y) => y !== a) : [...l.on, a];
    } else if (k === "addact") {
      const name = value("b-newact").trim().replace(/\s+/g, " ").slice(0, 30);
      if (!name) return toast("Type the set action’s name first.", false);
      if (x.actions.some((a) => a.toLowerCase() === name.toLowerCase())) return toast(`You’ve already got ${name}.`, false);
      x.actions.push(cap(name));
    } else if (k === "dropact") {
      const a = el.dataset.a;
      x.actions = x.actions.filter((y) => y !== a);
      for (const l of linesOf(x, B)) {
        const it = lineAt(x, l.ref);
        it.on = it.on.filter((y) => y !== a);
      }
    } else if (k === "fill") {
      const path = el.dataset.p;
      let m;
      if ((m = path.match(/^a(\d)\.(name|catch)$/))) x.attuned[m[1]][m[2]] = v;
      else {
        const item = lineAt(x, path);
        item.text = v;
        if (path[0] === "e") item.armour = ARMOUR.test(v);
      }
    } else if (k === "fillany") {
      const kind = el.dataset.k;
      const list = kind === "e" ? x.equipment : kind === "u" ? x.utility.slice(0, numbersOf(x, B).utility) : [x.keepsake];
      const at = list.findIndex((it) => it.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) Object.assign(list[at], { text: "", on: [] }, kind === "e" ? { armour: false } : {});
      else {
        const free = kind === "k" ? 0 : list.findIndex((it) => !it.text.trim());
        if (free < 0) return toast("That’s full. Tap one to take it off, or change one by hand.", false);
        list[free].text = v;
        if (kind === "e") list[free].armour = ARMOUR.test(v);
      }
    } else if (k === "armour") x.equipment[i].armour = !x.equipment[i].armour;
    else if (k === "debt") x.threads[i].debt = !x.threads[i].debt;
    else if (k === "pronoun") x.pronoun = v;
    else if (k === "trouble") x.trouble = x.trouble.includes(v) ? x.trouble.filter((t) => t !== v) : [...x.trouble, v];
    save();
    render();
  }

  // The details boxes remember being closed, so the book's words stay out of
  // the way once you've read them.
  function toggled(el) {
    const m = el.dataset.open?.match(/^bd-how-(\d)$/);
    if (!m || !d) return;
    const key = `how${m[1]}`;
    if (el.open === howOpen(m[1])) return;
    d.deep[key] = el.open;
    saveSoon();
  }

  return { view, act, input, toggled, open, begin, discard, flush: () => d && save(), get step() { return d?.step ?? 0; } };
}
