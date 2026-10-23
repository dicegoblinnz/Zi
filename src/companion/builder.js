// The character builder: the Quick Build from the rules, one step at a time,
// with the book's own words for each step beside it. It warns but never blocks,
// bar one thing: six permissions is the most a Title holds.
// Drafts are saved on the phone as you go, in one localStorage key, zi-drafts,
// by "new" or by the id of the character being changed, so nothing's lost if
// the page closes. A finished character keeps only what the player chose (its
// build), and sheetOf() turns that into the same full sheet the crew have,
// read against the current rules every time it opens. The guided build goes a
// step at a time, and the other ways in (a blank sheet, one of the crew, or
// random, from ways.js) open with every step on one page. Changing a saved
// character opens on one page too, with everything on their sheet, as many
// Titles as they've earned, and whatever they grew in downtime (foldGrown).

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";
import { MAX_PERMS, STAGES, attunedRoom } from "./grow.js";

const KEY = "zi-drafts";
export const ACTIONS = ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"];
export const MAX_TITLES = 24;
const MAX_ATTUNED = 8;
const MAX_THREADS = 40;
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"];
const ord = (i) => ORD[i] ?? `${i + 1}${(i + 1) % 100 >= 11 && (i + 1) % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][(i + 1) % 10] ?? "th"}`;
// Plain armour and a shield are lines on Defend, so they go on it as they're written in.
export const ARMOUR = /\b(plate|chain|mail|leathers|shield|armou?r|breastplate|hauberk|brigandine)\b/i;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const both = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");

// ---------------------------------------------------------------- the build

const line = () => ({ text: "", on: [] });
const blankTitle = () => ({ arch: "", idea: "", text: "", on: [], perms: [line(), line(), line()] });
const blankThing = () => ({ name: "", stage: "Awakened", catch: "", burden: "", perms: [line(), line()] });
const blankThread = () => ({ person: "", text: "", debt: false, whose: "" });
export function blankBuild() {
  return {
    v: 2,
    titles: [blankTitle(), blankTitle()],
    traits: [],
    actions: [...ACTIONS],
    equipment: [0, 1, 2].map(line),
    utility: [0, 1, 2, 3].map(line),
    keepsake: line(),
    bag: "",
    attuned: [blankThing(), blankThing()],
    threads: [blankThread(), blankThread(), blankThread()],
    connect: [],
    aspiration: "",
    name: "", pronoun: "them", blurb: "", clothes: "", trouble: [],
  };
}

// Fill in anything missing, so an old or damaged build still opens.
const str = (v, max = 160) => (typeof v === "string" ? v.slice(0, max) : "");
const ons = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 12) : []);
// While a character's being changed, a line remembers what it said when the
// change began (was), so whatever's crossed out or strained can follow it when
// it's reworded. It never reaches a saved character.
const was = (x) => (typeof x?.was === "string" && x.was ? { was: x.was.slice(0, 300) } : {});
const fixLine = (x) => ({ text: str(x?.text), on: ons(x?.on), ...was(x) });
// An attuned permission that was on the sheet past what its thing's stage
// holds (downtime's Finish anyway, or a crew sheet that says so) is kept on it.
const fixAttLine = (x) => ({ ...fixLine(x), ...(x?.kept ? { kept: true } : {}) });
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const atLeast = (arr, n, make) => {
  while (arr.length < n) arr.push(make());
  return arr;
};
export function normalBuild(raw) {
  const b = blankBuild();
  const r = raw && typeof raw === "object" ? raw : {};
  // A build from before more Titles came in (v1) kept three threads, or four
  // with a debt, and anything past that never reached the sheet.
  const old = !(Number(r.v) >= 2);
  const titles = list(r.titles, MAX_TITLES);
  if (titles.length) b.titles = titles.map((x) => ({ arch: str(x?.arch, 40), idea: str(x?.idea, 40), text: str(x?.text), on: ons(x?.on), perms: atLeast(list(x?.perms, MAX_PERMS).map(fixLine), 1, line) }));
  b.traits = (Array.isArray(r.traits) ? r.traits : []).filter((t) => t && str(t.name)).slice(0, 24).map((t) => ({
    name: str(t.name, 120), on: ons(t.on), ...(t.own ? { own: { type: str(t.own.type, 120), text: str(t.own.text, 200) } } : {}),
  }));
  // The six set actions are always there, and the rest keep their order, so a
  // crew member made into a build keeps their tiles where they were. A build
  // from before Defend was a set action gets it just before Fight.
  const named = [...new Set((Array.isArray(r.actions) ? r.actions : []).map((a) => str(a, 30).trim()).filter(Boolean))];
  const own = named.filter((a) => !ACTIONS.includes(a)).slice(0, 7);
  const kept = named.filter((a) => ACTIONS.includes(a) || own.includes(a));
  if (kept.length && !kept.includes("Defend")) kept.splice(kept.includes("Fight") ? kept.indexOf("Fight") : kept.length, 0, "Defend");
  b.actions = [...kept, ...ACTIONS.filter((a) => !kept.includes(a))];
  // Before 24 Oct 2026 a piece of plain armour was ticked as armour and made
  // the Armour die a size bigger. It's a line on Defend now.
  b.equipment = b.equipment.map((e, i) => {
    const x = fixLine(r.equipment?.[i]);
    if (r.equipment?.[i]?.armour && x.text.trim() && !x.on.includes("Defend")) x.on.push("Defend");
    return x;
  });
  b.utility = Array.from({ length: Math.max(4, Math.min(8, Array.isArray(r.utility) ? r.utility.length : 0)) }, (_, i) => fixLine(r.utility?.[i]));
  b.keepsake = fixLine(r.keepsake);
  b.bag = str(r.bag, 600);
  if (Array.isArray(r.bagWas)) b.bagWas = r.bagWas.slice(0, 40).map((x) => str(x, 120));
  if (Array.isArray(r.attuned)) {
    b.attuned = r.attuned.slice(0, MAX_ATTUNED).map((x) => ({
      name: str(x?.name, 80), stage: STAGES.includes(x?.stage) ? x.stage : "Awakened", catch: str(x?.catch, 120), burden: str(x?.burden, 120),
      perms: atLeast(list(x?.perms, MAX_PERMS).map(fixAttLine), 2, line),
    }));
  }
  let threads = Array.isArray(r.threads) ? r.threads : null;
  if (threads && old) threads = threads.slice(0, threads.some((t) => t?.debt) ? 4 : 3);
  if (threads) b.threads = threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), debt: Boolean(t?.debt), whose: str(t?.whose, 40), ...was(t) }));
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
  let conf = 6;
  for (let k = 0; k < sum("confidence"); k++) conf = sizeUp(conf);
  return {
    aura: 5 + sum("aura"), resolve: Math.max(1, b.titles.filter((t) => t.arch || t.text.trim()).length),
    stride: 3 + sum("stride"), strideNote: who("stride"),
    confidence: conf, confidenceNote: who("confidence"),
    dressed: b.clothes.trim() ? { die: sizeUp(conf), what: b.clothes.trim() } : null,
    // The wound die starts at d2. A trait like Unyielding says how many Hurts
    // a scene don't move it.
    wound: 2, woundNote: who("shrug"), shrug: sum("shrug"),
    utility: 3 + sum("utility"),
  };
}

// Everything that can go on a set action, in the sheet's order. The builder
// and the saved sheet both read this, so their steps always agree. A Title
// counts once it has a name, an archetype or a permission, and an attuned
// thing once it has a name or a permission that counts. An attuned thing
// holds what its stage allows (Attunement's table): a permission past that
// counts once it's got its Catch, its Burden or both, or when it's kept,
// because it was already on the sheet.
const titleIn = (t) => Boolean(t.text.trim() || t.arch || t.perms.some((p) => p.text.trim()));
const titleName = (t) => t.text.trim() || t.arch || "Untitled";
const attunedName = (a) => a.name.trim() || "Something attuned";
const roomOf = (a) => attunedRoom({ stage: a.stage, catch: a.catch.trim(), burden: a.burden.trim(), permissions: a.perms.filter((p) => p.text.trim()) });
const fits = (a, j) => {
  const r = roomOf(a);
  return j < r.base || (j < r.all && !r.missing.length);
};
const counts = (a, j) => Boolean(a.perms[j]?.kept) || fits(a, j);
// Everything on a thing's lines stays on the sheet, whatever its stage holds:
// one of the crew made into a build keeps what the chapter gives them.
export function keepAttuned(b) {
  for (const a of b.attuned) a.perms.forEach((p, j) => {
    if (p.text.trim() && !fits(a, j)) p.kept = true;
  });
  return b;
}
const thingIn = (a) => Boolean(a.name.trim() || a.perms.some((p, j) => p.text.trim() && counts(a, j)));
function linesOf(b, B) {
  const out = [];
  const max = numbersOf(b, B).utility;
  b.titles.forEach((t, i) => titleIn(t) && out.push({ ref: `t${i}`, kind: "title", label: titleName(t), i }));
  b.titles.forEach((t, i) => titleIn(t) && t.perms.forEach((p, j) => p.text.trim() && out.push({ ref: `p${i}.${j}`, kind: "permission", label: p.text.trim(), i })));
  b.traits.forEach((t, i) => out.push({ ref: `r${i}`, kind: "trait", label: t.name }));
  b.equipment.forEach((x, i) => x.text.trim() && out.push({ ref: `e${i}`, kind: "kit", label: x.text.trim() }));
  b.utility.slice(0, max).forEach((x, i) => x.text.trim() && out.push({ ref: `u${i}`, kind: "kit", label: x.text.trim() }));
  if (b.keepsake.text.trim()) out.push({ ref: "k", kind: "kit", label: b.keepsake.text.trim() });
  b.attuned.forEach((a, i) => a.perms.forEach((p, j) => p.text.trim() && counts(a, j) && out.push({ ref: `a${i}.${j}`, kind: "attuned", label: p.text.trim(), item: attunedName(a), i })));
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
      resolve: rule.resolve ?? "", resolveHtml: rule.resolveHtml ?? "",
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
    return { name, props: null, stage: a.stage || "Awakened", catch: a.catch.trim() || null, burden: a.burden.trim() || null, permissions: perms.map((l) => ({ text: l.label, key: add(l.ref, "attuned", l.label, { item: name }) })) };
  });
  const actions = b.actions.map((name) => {
    const on = [...keyOf].filter(([ref]) => lineAt(b, ref)?.on.includes(name)).map(([, key]) => key);
    return { name, steps: on.length + 1, die: diceLabel(stepsToDice(on.length + 1)), lines: on };
  });
  // A thread in someone else's words says whose, the way the crew's do.
  const threads = [];
  for (const th of b.threads) {
    const person = th.person.trim();
    if (!person || !th.text.trim()) continue;
    let g = threads.find((x) => x.person === person);
    if (!g) threads.push((g = { person, threads: [] }));
    g.threads.push({ text: th.text.trim(), note: [th.whose.trim(), th.debt ? "a debt" : ""].filter(Boolean).join(", ") || null, debt: th.debt });
  }
  const plays = [...new Set(b.titles.map((t) => IDEA.get(t.idea)?.playsLike).filter(Boolean))];
  const names = [...taken.keys()];
  delete numbers.utility;
  return {
    id: ch.id, name: ch.name, own: true,
    title: titles[0]?.name ?? "",
    blurb: b.blurb.trim() || (plays.length ? `${cap(plays.join(", and "))}.` : ""),
    archetypes: names.length === 1 && taken.get(names[0]) > 1 ? [`${names[0]}, ${taken.get(names[0]) === 2 ? "twice" : `${taken.get(names[0])} times`}`] : names,
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

// What the builder flags. Nothing here stops a save. A new character is held
// to the Quick Build's numbers. A saved one that's grown isn't, so it's only
// flagged for what makes no sense on any sheet.
export function checksOf(b, B, { changing = false } = {}) {
  const out = [];
  const n = numbersOf(b, B);
  if (!changing && b.titles.length > 2) out.push({ step: 0, text: `You’ve got ${b.titles.length} Titles. The quick build gives you two.` });
  b.titles.forEach((t, i) => {
    const which = `Your ${ord(i)} Title`;
    if (!t.arch) out.push({ step: 0, text: `${which} hasn’t got an archetype.` });
    if (!t.text.trim()) out.push({ step: 1, text: `${which} hasn’t got a name.` });
    const perms = t.perms.filter((p) => p.text.trim());
    if (changing && !perms.length) out.push({ step: 1, text: `${which} hasn’t got a permission.` });
    if (!changing && perms.length !== 3) out.push({ step: 1, text: `${which} has ${perms.length} permission${perms.length === 1 ? "" : "s"}. The quick build gives it three.` });
    // A permission goes on two set actions at most, Defend included.
    for (const p of perms) {
      const on = b.actions.filter((a) => p.on.includes(a));
      if (on.length > 2) out.push({ step: 3, text: `“${p.text.trim()}” is on ${on.length} set actions. A permission goes on two at most, Defend included, so keep it on the two it helps most.` });
    }
  });
  // An attuned thing's permissions go on two set actions at most, like any permission.
  b.attuned.forEach((t) => t.perms.forEach((p, j) => {
    if (!p.text.trim() || !counts(t, j)) return;
    const on = b.actions.filter((a) => p.on.includes(a));
    if (on.length > 2) out.push({ step: 4, text: `“${p.text.trim()}” on ${attunedName(t)} is on ${on.length} set actions. A permission goes on two at most, Defend included, so keep it on the two it helps most.` });
  }));
  // The same permission never counts twice on one set action, even from two Titles.
  for (const a of b.actions) {
    const words = new Map();
    for (const t of b.titles) for (const p of t.perms) {
      const w = p.text.trim();
      if (w && titleIn(t) && p.on.includes(a)) words.set(w.toLowerCase(), [w, (words.get(w.toLowerCase())?.[1] ?? 0) + 1]);
    }
    for (const [w, n] of words.values()) if (n > 1) out.push({ step: 3, text: `“${w}” is on your ${a} ${n === 2 ? "twice" : `${n} times`}, and the same permission only counts once on a set action. Take one off, or use a different word.` });
  }
  const traits = b.traits.length;
  if (!changing && traits !== 2) out.push({ step: 2, text: `You’ve got ${traits} trait${traits === 1 ? "" : "s"}. You start with two.` });
  if (!changing && !b.keepsake.text.trim()) out.push({ step: 4, text: "You haven’t got a keepsake yet." });
  const att = b.attuned.filter((a) => a.name.trim());
  if (!changing && att.length !== 2) out.push({ step: 4, text: `You’ve attuned ${att.length} thing${att.length === 1 ? "" : "s"}. You start with 2 slots.` });
  b.attuned.forEach((a) => {
    const name = cap(a.name.trim() || "Your attuned thing");
    const filled = a.perms.map((p, j) => [p, j]).filter(([p]) => p.text.trim());
    if (a.name.trim() && !filled.length) out.push({ step: 4, text: `${name} needs a permission.` });
    const r = roomOf(a);
    const over = filled.filter(([, j]) => !counts(a, j));
    if (over.some(([, j]) => j >= r.all)) out.push({ step: 4, text: `${name} holds ${r.all} at ${r.stage}, so the rest stay off the sheet until it goes up a stage.` });
    else if (over.length) out.push({ step: 4, text: r.stage === "Awakened" ? `${name} only gets a second permission with a Catch.` : `${name} needs ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))} to hold more than ${r.base}.` });
    const kept = filled.filter(([p, j]) => p.kept && !fits(a, j));
    if (kept.some(([, j]) => j >= r.all)) out.push({ step: 4, text: `${name} has more on it than ${r.stage} holds. It goes up a stage once it’s got its material.` });
    else if (kept.length) out.push({ step: 4, text: `${name} has more on it than ${r.stage} holds without ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))}.` });
  });
  if (b.utility.slice(n.utility).some((u) => u.text.trim())) out.push({ step: 4, text: `You can carry ${n.utility} utility items, so the last one won’t go on the sheet.` });
  if (bagOf(b).length > 10) out.push({ step: 4, text: `Your bag holds 10, so the last ${bagOf(b).length - 10} won’t go in.` });
  const room = b.threads.some((t) => t.debt) ? 4 : 3;
  const threads = b.threads.filter((t) => t.person.trim() && t.text.trim()).length;
  if (!changing && threads < 3) out.push({ step: 5, text: `You’ve written ${threads} thread${threads === 1 ? "" : "s"}. You start with three.` });
  if (!changing && threads > room) out.push({ step: 5, text: `You’ve written ${threads} threads. You start with three, or four if one’s a debt.` });
  if (!b.aspiration.trim()) out.push({ step: 6, text: "You haven’t written your Aspiration." });
  if (!b.name.trim()) out.push({ step: 7, text: "Your character needs a name." });
  return out;
}

// ---------------------------------------------------------------- downtime's growth

// What a character grew in downtime (state.grown, grow.js) written into their
// build, so it can be changed like anything else. Each entry lands where it
// sat on the sheet: a permission after the Title's others, a new Title last,
// and so on, so the sheet it makes is the one the player already had.
export function foldGrown(raw, grown, B) {
  const b = normalBuild(raw);
  if (!Array.isArray(grown) || !grown.length) return b;
  const rule = new Map(B.traits.map((t) => [t.name, t]));
  // Empty lines aren't on the sheet, so they go first, and a grown line's
  // place among the rest is its place on the sheet. On an attuned thing a
  // permission's place decides whether it counts, so the ones on the sheet
  // go first, what downtime grew after them, and any that were waiting for
  // room (written in the builder past what the thing held) last, so a waiting
  // one never takes a grown one's place. Everything that was on the sheet is
  // kept on it at the end, even past what the thing's stage holds, since
  // downtime's Finish anyway can put it there.
  for (const t of b.titles) t.perms = atLeast(t.perms.filter((p) => p.text.trim()), 1, line);
  const onSheet = new Set();
  const waiting = new Map();
  for (const a of b.attuned) {
    const on = a.perms.filter((p, j) => p.text.trim() && counts(a, j));
    waiting.set(a, a.perms.filter((p, j) => p.text.trim() && !counts(a, j)));
    for (const p of on) onSheet.add(p);
    a.perms = on;
  }
  const titleAt = (k) => b.titles[b.titles.map((t, i) => (titleIn(t) ? i : -1)).filter((i) => i >= 0)[k]];
  const thingAt = (k) => b.attuned[b.attuned.map((a, i) => (thingIn(a) ? i : -1)).filter((i) => i >= 0)[k]];
  const onto = (perms, text, on) => {
    const p = { text, on };
    const free = perms.findIndex((x) => !x.text.trim());
    if (free >= 0) perms[free] = p;
    else if (perms.length < MAX_PERMS) perms.push(p);
    else return null;
    return p;
  };
  for (const g of grown) {
    if (!g || typeof g !== "object") continue;
    const text = str(String(g.text ?? "").trim());
    const on = ons(g.on);
    if (g.k === "perm") {
      const t = titleAt(g.t);
      if (t && text) onto(t.perms, text, on);
    } else if (g.k === "swap") {
      const t = titleAt(g.t);
      const filled = t ? t.perms.filter((p) => p.text.trim()) : [];
      const p = filled.find((x) => x.text.trim() === g.from) ?? (Number.isInteger(g.j) ? filled[g.j] : null);
      if (p && text) Object.assign(p, { text, on });
    } else if (g.k === "att") {
      const a = thingAt(g.a);
      if (!a) continue;
      if (g.up) a.stage = STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(a.stage) + 1)];
      // At Tempered the Catch becomes the Burden, and Perfected wants a Catch again.
      if (g.burden && !a.burden.trim()) {
        a.burden = str(String(g.burden).trim(), 120);
        if (a.stage === "Tempered") a.catch = "";
      }
      if (g.catch && !a.catch.trim()) a.catch = str(String(g.catch).trim(), 120);
      const p = text ? onto(a.perms, text, on) : null;
      if (p) onSheet.add(p);
    } else if (g.k === "trait") {
      const name = str(String(g.name ?? "").trim(), 120);
      if (!name || b.traits.some((t) => t.name === name)) continue;
      const r = g.own ? null : rule.get(name);
      const step = r ? r.step : /\+1 step\b/.test(String(g.own?.text ?? ""));
      b.traits.push({ name, on: step ? on : [], ...(g.own ? { own: { type: str(g.own.type, 120), text: str(g.own.text, 200) } } : {}) });
    } else if (g.k === "thread") {
      const person = str(String(g.person ?? "").trim(), 120);
      if (person && text) b.threads.push({ person, text: str(text, 200), debt: false, whose: "" });
    } else if (g.k === "title") {
      if (!text || b.titles.length >= MAX_TITLES) continue;
      const perm = str(String(g.perm ?? "").trim());
      b.titles.push({ arch: str(String(g.arch ?? ""), 40), idea: "", text, on, perms: [perm ? { text: perm, on: ons(g.permOn) } : line()] });
    }
  }
  for (const a of b.attuned) {
    // Six is the most anything holds, so a waiting line with no room left goes.
    a.perms = [...a.perms, ...(waiting.get(a) ?? [])].slice(0, MAX_PERMS);
    a.perms.forEach((p, j) => {
      if (onSheet.has(p) && !fits(a, j)) p.kept = true;
    });
    atLeast(a.perms, 2, line);
  }
  return normalBuild(b);
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
const PRO = { her: ["she", "her", "she’s"], him: ["he", "his", "he’s"], them: ["they", "their", "they’re"] };
const PRICE = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };

export function makeBuilder({ B, link, icon, onSave, onLeave, toast, roll }) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const TRAIT = new Map(B.traits.map((t) => [t.name, t]));
  let slotKey = "new";
  let d = null; // { step, deep: {}, page, way, from, build, basis }
  let meta = {}; // for a saved character: { basis, crew }, crew being the crew member's name when they're still one
  let saveTimer = 0;
  let refreshTimer = 0;
  let sure = false; // Roll again has been tapped once over changes
  let rolled = ""; // the random build as it was rolled
  let dropping = ""; // a Title, attuned thing or thread tapped once to take it off

  const changing = () => slotKey !== "new";
  const save = () => {
    clearTimeout(saveTimer);
    const all = readDrafts();
    all[slotKey] = { step: d.step, deep: d.deep, page: d.page, way: d.way, from: d.from, build: d.build, ...(d.basis ? { basis: d.basis } : {}) };
    writeDrafts(all);
  };
  const saveSoon = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  };
  // A change opens on one page with everything on the sheet. One left part
  // way, to a character who's changed since (a downtime, say), starts again
  // from them as they are now, so nothing they've grown is lost.
  function open(key, from, m = {}) {
    slotKey = key || "new";
    let kept = readDrafts()[slotKey];
    const stale = Boolean(kept && changing() && kept.basis !== m.basis);
    if (stale) kept = null;
    const start = kept ? null : typeof from === "function" ? from() : from;
    d = kept
      ? { step: Math.min(7, Math.max(0, Number(kept.step) || 0)), deep: kept.deep && typeof kept.deep === "object" ? kept.deep : {}, page: Boolean(kept.page), way: WAYS.includes(kept.way) ? kept.way : "", from: str(kept.from, 40), build: normalBuild(kept.build), basis: str(kept.basis, 40) }
      : { step: 0, deep: {}, page: Boolean(start), way: "", from: "", build: normalBuild(start ?? blankBuild()), basis: str(m.basis, 40) };
    sure = false;
    dropping = "";
    if (stale) {
      const [, their] = PRO[d.build.pronoun] ?? PRO.them;
      toast(`${d.build.name || "Your character"}’s sheet has changed since you left this, so it starts again from ${their} sheet as it is now.`, false);
    }
  }
  // A new character from one of the other ways in, on one page. It takes the
  // place of any draft of a new one, so the list asks first.
  function begin(build, way, from = "") {
    clearTimeout(saveTimer);
    slotKey = "new";
    d = { step: 0, deep: {}, page: true, way, from, build: normalBuild(build) };
    sure = false;
    dropping = "";
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
  // Leaving the builder keeps the draft, and coming back reads it again.
  function close() {
    if (d) save();
    d = null;
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
  // Adding and taking off. Something with words in it asks for a second tap
  // before it goes.
  const dropBtn = (kind, i, label) => `<button type="button" class="button sm" data-act="b" data-b="drop${kind}" data-i="${i}">${dropping === `${kind}${i}` ? "Tap again to take it off" : label}</button>`;
  const canDrop = (kind) => (kind === "title" ? b().titles.length > (changing() ? 1 : 2) : kind === "att" ? changing() || b().attuned.length > 2 : changing() || b().threads.length > 3);
  const addTitle = () => (b().titles.length < MAX_TITLES ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addtitle">Add another Title</button></div>${changing() ? '<p class="cc-lead">A Title earned in play comes with one permission, and Resolve goes up by one with it.</p>' : ""}` : "");

  const backLink = () => `<a class="cc-back" href="/characters/${slotKey === "new" ? "" : `?c=${encodeURIComponent(slotKey)}`}" data-act="b" data-b="leave">${icon.back}${slotKey === "new" ? "Characters" : esc(b().name || "Back")}</a>`;
  const kicker = () => (slotKey === "new" ? "Make your own" : `Changing ${esc(b().name || "your character")}`);
  const dropEdit = () => (slotKey === "new" ? "" : '<button type="button" class="button sm" data-act="b" data-b="dropedit">Drop these changes</button>');
  const saveLabel = () => (changing() ? "Save the changes" : "Save and play");
  // One of the crew being changed stops following the chapter once it's saved.
  function crewNote() {
    if (!meta.crew || !changing()) return "";
    const [, their, theyre] = PRO[b().pronoun] ?? PRO.them;
    const name = esc(b().name || meta.crew);
    return `<div class="cc-note" role="status"><p>${name}’s sheet comes straight off the chapter for now, so when the rules change, ${their} sheet changes too. Save a change here and ${theyre} your own. ${cap(their)} sheet stops following the chapter, and ${their} Aura, wound die and everything else in play stay as they are.</p></div>`;
  }

  function head() {
    const i = d.step;
    const dots = STEPS.map((s, k) => `<li><button type="button" class="bd-dot${k === i ? " is-now" : ""}" data-act="b" data-b="go" data-s="${k}" aria-label="Step ${k + 1}: ${s.name}"${k === i ? ' aria-current="step"' : ""}>${k + 1}</button></li>`).join("");
    return `${backLink()}<header class="cc-head bd-head"><p class="kicker">${kicker()} · Step ${i + 1} of 8</p>
      <h1 tabindex="-1">${STEPS[i].name}</h1><ol class="bd-dots" aria-label="Steps">${dots}</ol></header>${crewNote()}`;
  }

  function foot() {
    const i = d.step;
    const next = i < 7 ? `<button type="button" class="button primary" data-act="b" data-b="go" data-s="${i + 1}">Next: ${STEPS[i + 1].name}</button>` : `<button type="button" class="button primary" data-act="b" data-b="save">${saveLabel()}</button>`;
    return `<div class="bd-foot">${i ? `<button type="button" class="button" data-act="b" data-b="go" data-s="${i - 1}">Back</button>` : ""}${next}</div>
      <p class="cc-lead">${link(STEPS[i].rules, "Read this step in the rules")}. Your work’s saved on this phone as you go.</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">See it all on one page</button>${dropEdit()}</div>`;
  }

  // Every step on one page, for a blank sheet, one of the crew, random, or
  // changing a saved character.
  function pageView() {
    const [, their] = PRO[b().pronoun] ?? PRO.them;
    const title = changing() ? `Change anything on ${their} sheet` : { blank: "A blank sheet", crew: `From ${esc(d.from || "the crew")}`, random: "Random" }[d.way] ?? "All on one page";
    const parts = BODIES.map((body, i) => `<section class="bd-part" aria-labelledby="bd-part-${i}">${part(i)}</section>`).join("");
    return `${backLink()}<header class="cc-head bd-head"><p class="kicker">${kicker()} · All on one page</p><h1 tabindex="-1">${title}</h1>
      <div class="cc-row">${d.way === "random" ? `<button type="button" class="button" data-act="b" data-b="reroll">${sure ? "Tap again to lose your changes" : "Roll again"}</button>` : ""}<button type="button" class="button" data-act="b" data-b="page">Go step by step</button></div></header>
      ${crewNote()}
      <div class="bd-body bd-page">${parts}</div>
      <div class="bd-foot"><button type="button" class="button primary" data-act="b" data-b="save">${saveLabel()}</button></div>
      <p class="cc-lead">${link("s-quick", "The Quick Build in the rules")}. Your work’s saved on this phone as you go.</p>
      ${dropEdit() ? `<div class="cc-row">${dropEdit()}</div>` : ""}`;
  }

  // Step 1: two archetypes, and a Title idea for each, and any Titles earned since.
  function stepArch() {
    const x = b();
    const taken = new Map();
    for (const t of x.titles) if (t.arch) taken.set(t.arch, (taken.get(t.arch) ?? 0) + 1);
    const raised = [...taken].filter(([a, n]) => n > 1 && /^\+2\b/.test(ARCH.get(a)?.aura ?? ""));
    const card = (t, i) => {
      const a = ARCH.get(t.arch);
      const fits = B.ideas.filter((idea) => d.deep[0] || !a || idea.archetypes.includes(t.arch));
      const groups = [...new Set(fits.map((idea) => idea.group))];
      const ideaChips = groups.map((g) => `${groups.length > 1 || d.deep[0] ? `<p class="bd-label">${esc(g)}</p>` : ""}<div class="cc-chips">${fits.filter((idea) => idea.group === g).map((idea) => chip(esc(idea.name), `data-b="idea" data-t="${i}" data-v="${idea.id}"`, t.idea === idea.id)).join("")}</div>`).join("");
      const idea = IDEA.get(t.idea);
      return `<fieldset class="cc-group bd-card"><legend>Your ${ord(i)} Title</legend>
        ${t.text.trim() ? `<p class="cc-small"><em>${esc(t.text.trim())}</em></p>` : ""}
        <p class="bd-label" id="bd-arch-${i}">Archetype</p><div class="cc-chips" role="group" aria-labelledby="bd-arch-${i}">${B.archetypes.map((r) => chip(esc(r.name), `data-b="arch" data-t="${i}" data-v="${esc(r.name)}"`, t.arch === r.name)).join("")}</div>
        ${a ? `<div class="bd-rule"><p>${a.summary}</p>${a.auraHtml ? `<p><b>1 Aura:</b> ${a.auraHtml}</p>` : ""}${a.resolveHtml ? `<p><b>1 Resolve:</b> ${a.resolveHtml}</p>` : ""}<p class="cc-small">${link(a.id, `The ${esc(a.name)} in full`)}</p></div>` : ""}
        ${a || d.deep[0] ? `<p class="bd-label">A Title idea, if you like</p>${fits.length ? ideaChips : `<p class="cc-lead">None of the ideas lists the ${esc(t.arch)}, so write your own Title on the next step, or open the full build to see every idea.</p>`}
        ${idea ? `<p class="cc-small">${esc(cap(idea.playsLike))}. ${link(idea.id, `The ${esc(idea.name)} idea`)}</p>` : ""}` : ""}
        ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
    };
    return `${how(0)}${x.titles.map(card).join("")}
      ${raised.map(([a, n]) => `<p class="cc-note" role="status">${esc(a)} ${n === 2 ? "twice" : `${n} times`}, so your +2 is a +${n + 1}.</p>`).join("")}
      ${addTitle()}${deepBtn(0, "Show every Title idea")}`;
  }

  // Step 2: name each Title and give it its permissions, three to start and
  // six at the most.
  function stepTitles() {
    const x = b();
    const card = (t, i) => {
      const idea = IDEA.get(t.idea);
      const used = new Set(t.perms.map((p) => p.text.trim().toLowerCase()));
      const offer = (list) => `<div class="cc-chips">${list.map((p) => chip(`<em>${esc(p)}</em>`, `data-b="perm" data-t="${i}" data-v="${esc(p)}"`, used.has(p.toLowerCase()))).join("")}</div>`;
      return `<fieldset class="cc-group bd-card"><legend>Your ${ord(i)} Title</legend>
        <p class="cc-small">${t.arch ? `${esc(t.arch)}${idea ? `, from the ${esc(idea.name)} idea` : ""}` : "No archetype yet"}</p>
        ${field(`t${i}.text`, "Your Title", t.text, { ph: "Make it specific: the best blade in the Low Market", max: 80 })}
        ${idea ? `<p class="cc-small">Or take one of the idea’s:</p><div class="cc-chips">${idea.titles.map((name) => chip(esc(name), `data-b="title" data-t="${i}" data-v="${esc(name)}"`, t.text.trim() === name)).join("")}</div>` : ""}
        <p class="bd-label">${!changing() && i < 2 ? "Three permissions" : "Its permissions, up to six"}</p>
        ${t.perms.map((p, j) => field(`t${i}.p${j}`, `Permission ${j + 1}`, p.text, { ph: "one word, or a doing word and how, what or where", max: 80 })).join("")}
        ${t.perms.length < MAX_PERMS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addperm" data-t="${i}">Add a permission</button></div>` : '<p class="cc-lead">Six is the most a Title holds.</p>'}
        ${idea ? `<p class="cc-small">Tap one of the ${esc(idea.name)} idea’s to add it, or tap it again to take it off.</p>${offer(idea.permissions)}` : ""}
        ${d.deep[1] ? B.permIdeas.map((g) => `<p class="bd-label">${esc(g.for)}</p>${offer(g.perms)}`).join("") : ""}
        ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
    };
    return `${how(1)}${x.titles.map(card).join("")}${addTitle()}
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
    // Picked ones the ideas don't suggest still show, so they can come off.
    const mine = showAll ? [] : x.traits.filter((t) => !t.own && !suggested.includes(t.name));
    // Traits written by hand, in the builder or in downtime. The form adds
    // one, and the same name again rewords it.
    const owns = x.traits.filter((t) => t.own);
    const own = owns.length === 1 ? owns[0] : null;
    return `${how(2)}
      <p class="cc-note" role="status">You’ve picked ${x.traits.length}${changing() ? "" : " of 2"}${x.traits.length ? `: ${esc(both(x.traits.map((t) => t.name)))}` : ""}.</p>
      ${owns.length ? `<h2>Your own</h2><div class="bd-traits">${owns.map((o) => `<button type="button" class="bd-trait" data-act="b" data-b="trait" data-v="${esc(o.name)}" aria-pressed="true"><b>${esc(o.name)}</b> <small>${esc(o.own.type)}</small><span>${esc(o.own.text)}</span></button>`).join("")}</div><p class="cc-lead">Tap one to take it off.</p>` : ""}
      ${mine.length ? `<h2>Yours</h2><div class="bd-traits">${mine.map((t) => (TRAIT.has(t.name) ? card(TRAIT.get(t.name)) : `<button type="button" class="bd-trait" data-act="b" data-b="trait" data-v="${esc(t.name)}" aria-pressed="true"><b>${esc(t.name)}</b></button>`)).join("")}</div>` : ""}
      ${suggested.length ? `<h2>From your Title ideas</h2><div class="bd-traits">${suggested.map((n) => card(TRAIT.get(n))).join("")}</div>` : ""}
      ${showAll ? groups.map((g) => `<h2>${esc(g || "Traits")}</h2><div class="bd-traits">${B.traits.filter((t) => t.group === g).map(card).join("")}</div>`).join("") : ""}
      ${d.deep[2] ? `<fieldset class="cc-group bd-card"><legend>Write your own</legend><p class="cc-lead">A name, a type and one line. If it changes a number, tell your GM which.${owns.length > 1 ? " Give it the name of one of yours to reword that one." : ""}</p>
        ${field("own.name", "Name", own?.name ?? "", { max: 40 })}
        <label class="cc-field" for="b-own-type">Type</label><select id="b-own-type" data-bin="own.type">${["Passive", "Triggered", "Invoked", "Once per scene", "Once per downtime"].map((k) => `<option${own?.own.type === k ? " selected" : ""}>${k}</option>`).join("")}</select>
        ${field("own.text", "What it does", own?.own.text ?? "", { max: 120 })}
        <div class="cc-row"><button type="button" class="button" data-act="b" data-b="own">${own ? "Update it" : "Add it"}</button>${own ? '<button type="button" class="button" data-act="b" data-b="own" data-v="new">Add it as another</button>' : ""}</div></fieldset>` : ""}
      ${deepBtn(2, suggested.length ? "Show all the traits, or write your own" : "Write your own trait")}`;
  }

  // Step 4: set actions. Lines from every Title, the permissions and the traits.
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
    // A permission on more than two set actions says so right there.
    const over = (l) => {
      const n = l.kind === "permission" || l.kind === "attuned" ? x.actions.filter((a) => lineAt(x, l.ref)?.on.includes(a)).length : 0;
      return n > 2 ? `<p class="cc-warn">It’s on ${n}. A permission goes on two at most.</p>` : "";
    };
    return rows.length ? `<ul class="bd-lines">${rows.map((l) => `<li><p>${say(l)}</p>${toggles(l.ref, l.label)}${over(l)}</li>`).join("")}</ul>` : "";
  }
  function stepActions() {
    const x = b();
    const own = x.actions.filter((a) => !ACTIONS.includes(a));
    return `${how(3)}${tiles(x.actions)}
      <h2>What goes on each</h2><p class="cc-lead">Tap the set actions each line helps nearly every time you do them. A Title or a trait goes on every one it fits, and a permission goes on two at most, Defend included, so pick the two it helps most. Plain armour and a shield go on your Defend, on the next step.</p>
      ${lineRows(["title", "permission", "trait"]) || '<p class="cc-lead">Your Titles, permissions and traits show up here once you’ve written them.</p>'}
      <h2>One of your own</h2><p class="cc-lead">Something you do all the time, like Locks or Ward, or Shoot if you’d rather keep it apart from Fight.</p>
      <div class="cc-form">${field("newact", "Its name", "", { max: 30, ph: "Locks" })}<button type="button" class="button" data-act="b" data-b="addact">Add it</button></div>
      ${own.length ? `<div class="cc-chips">${own.map((a) => `<button type="button" class="cc-chipbtn" data-act="b" data-b="dropact" data-a="${esc(a)}" aria-label="Take off ${esc(a)}">${esc(a)} ×</button>`).join("")}</div>` : ""}`;
  }

  // Step 5: what you carry, and the attuned things.
  function stepCarry() {
    const x = b();
    const n = numbersOf(x, B);
    atLeast(x.utility, Math.min(8, n.utility), line);
    const group = (name) => B.items.find((g) => g.group === name)?.items ?? [];
    const has = new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim().toLowerCase()).filter(Boolean));
    const offer = (kind, label, list) => `<p class="bd-label">${label}</p><div class="cc-chips">${list.map((v) => chip(esc(v), `data-b="fillany" data-k="${kind}" data-v="${esc(v)}"`, has.has(v.toLowerCase()))).join("")}</div>`;
    const slot = (kind, i, label) => {
      const ref = `${kind}${i}`;
      const item = lineAt(x, ref);
      return `<div class="bd-slot">${field(ref, label, item.text, { max: 60, ph: "Type it, or tap one below" })}
        ${toggles(ref, item.text || label)}</div>`;
    };
    const things = [...new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim()).filter(Boolean))];
    const yours = (i, a) => (things.length ? `<p class="bd-label">Or one of yours</p><div class="cc-chips">${things.map((v) => chip(esc(v), `data-b="fill" data-p="a${i}.name" data-v="${esc(v)}"`, a.name.trim() === v)).join("")}</div>` : "");
    const catches = (i, a) => `<div class="cc-chips">${B.catches.map((c) => chip(esc(c.name), `data-b="fill" data-p="a${i}.catch" data-v="${esc(c.name)}"`, a.catch.trim() === c.name)).join("")}</div>`;
    const drop = (i) => (canDrop("att") ? `<div class="cc-row">${dropBtn("att", i, "Take it off")}</div>` : "");
    // The Quick Build's: Awakened, one permission, and a second with a Catch.
    const quick = (a, i) => `<fieldset class="cc-group bd-card bd-att"><legend>Attuned thing ${i + 1}</legend>
      ${field(`a${i}.name`, "What it is", a.name, { max: 60, ph: "a perfect set of picks" })}${yours(i, a)}
      ${field(`a${i}.p0`, "Its permission", a.perms[0].text, { max: 80, ph: "what the thing itself does" })}${toggles(`a${i}.0`, a.perms[0].text || "its permission")}
      ${field(`a${i}.catch`, "Its Catch, if you’d like a second permission", a.catch, { max: 60, ph: "Wanted" })}${catches(i, a)}
      <div class="bd-perm2">${field(`a${i}.p1`, "Its second permission", a.perms[1].text, { max: 80, ph: "it comes with the Catch" })}${toggles(`a${i}.1`, a.perms[1].text || "its second permission")}</div>${drop(i)}</fieldset>`;
    // A saved character's, at any stage, with up to six permissions.
    const grown = (a, i) => {
      const r = roomOf(a);
      const off = (j) => (j >= r.all ? "until it goes up a stage" : `until it’s got ${both(r.missing.map((m) => (m === "catch" ? "its Catch" : "its Burden")))}`);
      return `<fieldset class="cc-group bd-card bd-att is-grown"><legend>Attuned thing ${i + 1}</legend>
        ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a perfect set of picks" })}${yours(i, a)}
        <p class="bd-label" id="bd-stage-${i}">Its stage</p><div class="cc-chips" role="group" aria-labelledby="bd-stage-${i}">${STAGES.map((st) => chip(st, `data-b="stage" data-i="${i}" data-v="${st}"`, r.stage === st)).join("")}</div>
        <p class="cc-small">${r.stage} holds ${r.base}, and ${r.base} more with ${PRICE[r.stage]}. ${link("attunement-stages", "The three stages")}</p>
        ${field(`a${i}.catch`, "Its Catch", a.catch, { max: 80, ph: "Wanted" })}${catches(i, a)}
        ${r.stage !== "Awakened" || a.burden.trim() ? field(`a${i}.burden`, "Its Burden <small>a cost for good, like <em>Bad Knee</em></small>", a.burden, { max: 80, ph: "Bad Knee" }) : ""}
        ${a.perms.map((p, j) => `<div class="bd-slot">${field(`a${i}.p${j}`, `Permission ${j + 1}${p.text.trim() && !counts(a, j) ? ` <small>off the sheet ${off(j)}</small>` : p.text.trim() && !fits(a, j) ? ` <small>past what ${r.stage} holds</small>` : ""}`, p.text, { max: 80, ph: "what the thing itself does" })}${toggles(`a${i}.${j}`, p.text || `permission ${j + 1}`)}</div>`).join("")}
        ${a.perms.length < MAX_PERMS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addattperm" data-i="${i}">Add a permission</button></div>` : '<p class="cc-lead">Six permissions is the most anything holds.</p>'}
        ${drop(i)}</fieldset>`;
    };
    return `${how(4)}
      <section aria-labelledby="bd-eq"><h2 id="bd-eq">3 equipment</h2><p class="cc-lead">What you wear or wield. Each piece of plain armour, and a shield, is a line on your Defend, so it goes on as you write it in.</p>
        ${x.equipment.map((e, i) => slot("e", i, `Equipment ${i + 1}`)).join("")}
        ${offer("e", "Weapons", group("Weapons"))}${offer("e", "Armour and wearables", group("Armour & wearables"))}</section>
      <section aria-labelledby="bd-ut"><h2 id="bd-ut">${n.utility} utility items</h2><p class="cc-lead">Tools and things you use up.</p>
        ${x.utility.slice(0, n.utility).map((u, i) => slot("u", i, `Utility ${i + 1}`)).join("")}
        ${offer("u", "Tools", group("Tools"))}${offer("u", "Foci", group("Foci"))}${offer("u", "Things you use up", B.usedUp.map((u) => u.name))}</section>
      <section aria-labelledby="bd-ks"><h2 id="bd-ks">A keepsake</h2><p class="cc-lead">Something that matters to your character.</p>
        <div class="bd-slot">${field("k", "Keepsake", x.keepsake.text, { max: 60, ph: "Type it, or tap one below" })}${toggles("k", x.keepsake.text || "your keepsake")}</div>
        ${offer("k", "Keepsakes", B.keepsakes.map((k) => k.name))}${offer("k", "Signature things", group("Signature"))}</section>
      <section aria-labelledby="bd-at"><h2 id="bd-at">${changing() ? "Attuned things" : "Attune two things"}</h2><p class="cc-lead">${changing() ? "Each one holds what its stage allows, and they don’t count towards what you carry." : "They start at Awakened with one permission each, and they don’t count towards what you carry."}</p>
        ${x.attuned.map((a, i) => (changing() ? grown(a, i) : quick(a, i))).join("")}
        ${x.attuned.length < MAX_ATTUNED ? '<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addatt">Attune another thing</button></div>' : ""}</section>
      ${d.deep[4] ? `<section aria-labelledby="bd-bag"><h2 id="bd-bag">Your bag</h2>${field("bag", "Up to 10 more things, one a line", x.bag, { area: true, max: 600 })}</section>` : ""}
      ${deepBtn(4, "Pack your bag too")}`;
  }

  // Step 6: three threads, and the Connect questions in the full build. A
  // saved character keeps every thread they've got, the ones in a crewmate's
  // words included.
  function stepThreads() {
    const x = b();
    const room = x.threads.some((t) => t.debt) ? 4 : 3;
    const row = (t, i) => `<fieldset class="cc-group bd-card"><legend>Thread ${i + 1}</legend>${t.whose.trim() ? `<p class="cc-small">In ${esc(t.whose.trim())} words.</p>` : ""}
      ${field(`th${i}.person`, "Who with", t.person, { max: 60, ph: i === 2 ? "someone outside the crew" : "someone in the crew" })}
      ${field(`th${i}.text`, "What’s true between you", t.text, { max: 200, ph: "a debt, a rescue, a secret or a shared past" })}
      <div class="cc-row">${chip("It’s a debt", `data-b="debt" data-i="${i}"`, t.debt, "sm")}${canDrop("thread") ? dropBtn("thread", i, "Take it off") : ""}</div></fieldset>`;
    return `${how(5)}${x.threads.map(row).join("")}
      ${!changing() && room === 4 ? '<p class="cc-note" role="status">One’s a debt, so you’ve got room for a fourth.</p>' : ""}
      ${x.threads.length < MAX_THREADS ? '<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addthread">Add a thread</button></div>' : ""}
      ${d.deep[5] ? `<section aria-labelledby="bd-connect"><h2 id="bd-connect">Connect</h2><p class="cc-lead">Answer at least two, and name someone in the crew in each. A good answer can become a thread.</p>
        ${B.connect.map((q, i) => field(`cq${i}`, esc(q), x.connect[i] ?? "", { max: 200 })).join("")}</section>` : ""}
      ${deepBtn(5, "Answer the Connect questions")}`;
  }

  // Step 7: one thing you want.
  function stepAsp() {
    return `${how(6)}${field("asp", changing() ? "Your Aspiration <small>its die’s on the Sheet tab</small>" : "Your Aspiration, at d2", b().aspiration, { max: 120, ph: "Own the score of a lifetime" })}`;
  }

  // Step 8: the numbers, a name, and a last look.
  function stepCheck() {
    const x = b();
    const n = numbersOf(x, B);
    const checks = checksOf(x, B, { changing: changing() });
    const trouble = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.trouble ?? []))];
    const num = (k, v, note) => `<li><span class="k">${k}</span> <b>${v}</b>${note ? ` <small>(${esc(note)})</small>` : ""}</li>`;
    return `${how(7)}
      <fieldset class="cc-group bd-card"><legend>Who they are</legend>
        ${field("name", "Name", x.name, { max: 40 })}
        <p class="bd-label" id="bd-pro">Call them</p><div class="cc-chips" role="group" aria-labelledby="bd-pro">${[["her", "she, her"], ["him", "he, him"], ["them", "they, them"]].map(([v, l]) => chip(l, `data-b="pronoun" data-v="${v}"`, x.pronoun === v)).join("")}</div>
        ${field("blurb", "One line about them, if you like", x.blurb, { max: 160 })}</fieldset>
      <h2>Your numbers</h2><ul class="bd-nums">
        ${num("Aura", n.aura)}${num("Resolve", n.resolve, "one for each Title")}${num("Stride", n.stride, n.strideNote)}
        ${num("Wound die", `d${n.wound}`, n.shrug ? `${n.woundNote}: ${n.shrug > 1 ? `the first ${n.shrug} Hurts each scene don’t` : "the first Hurt each scene doesn’t"} move it` : null)}${num("Confidence", `d${n.confidence}`, n.confidenceNote ? `${n.confidenceNote}, every scene` : "every scene")}</ul>
      ${field("clothes", "Clothes that fit some scenes, if you’ve got them", x.clothes, { max: 60, ph: "a fine coat" })}
      <p class="cc-lead">In them, Confidence starts a size up when they fit the scene.</p>
      <h2>Set actions</h2>${tiles(x.actions)}
      ${trouble.length || x.trouble.length || changing() ? `<h2>Trouble that follows you</h2><p class="cc-lead">If you like. Let it cause real trouble and you take 1 Aura.</p>${trouble.length || x.trouble.length ? `<div class="cc-chips">${[...new Set([...trouble, ...x.trouble])].map((t) => chip(`<em>${esc(t)}</em>`, `data-b="trouble" data-v="${esc(t)}"`, x.trouble.includes(t))).join("")}</div>` : ""}
        <div class="cc-form">${field("newtrouble", "Or write your own", "", { max: 120, ph: "owes the wrong people" })}<button type="button" class="button" data-act="b" data-b="addtrouble">Add it</button></div>` : ""}
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
  // from is the build to start from, or a function that makes it, only called
  // when there's no draft to carry on with.
  function view(key, from, m = {}) {
    meta = m;
    if (!d || slotKey !== (key || "new")) open(key, from, m);
    if (d.page) return pageView();
    return `${head()}<div class="bd-body">${BODIES[d.step]()}</div>${foot()}`;
  }

  // Everything typed goes straight into the draft. Nothing redraws mid-word.
  function input(el) {
    const x = b();
    const path = el.dataset.bin;
    const v = el.value;
    const set = (obj, key) => {
      if (obj) obj[key] = v;
    };
    let m;
    if ((m = path.match(/^t(\d+)\.text$/))) set(x.titles[m[1]], "text");
    else if ((m = path.match(/^t(\d+)\.p(\d+)$/))) set(x.titles[m[1]]?.perms[m[2]], "text");
    else if ((m = path.match(/^([eu])(\d+)$/))) {
      const item = lineAt(x, path);
      if (!item) return;
      const was = ARMOUR.test(item.text);
      item.text = v;
      // Armour going in puts it on Defend, and taking it out takes it off.
      if (m[1] === "e" && was !== ARMOUR.test(v)) {
        item.on = ARMOUR.test(v) ? [...new Set([...item.on, "Defend"])] : item.on.filter((a) => a !== "Defend");
        document.querySelector(`[data-b="on"][data-l="${path}"][data-a="Defend"]`)?.setAttribute("aria-pressed", String(item.on.includes("Defend")));
      }
    } else if (path === "k") x.keepsake.text = v;
    else if ((m = path.match(/^a(\d+)\.(name|catch|burden)$/))) set(x.attuned[m[1]], m[2]);
    else if ((m = path.match(/^a(\d+)\.p(\d+)$/))) {
      const p = x.attuned[m[1]]?.perms[m[2]];
      if (!p) return;
      p.text = v;
      if (!v.trim()) delete p.kept;
    }
    else if ((m = path.match(/^th(\d+)\.(person|text)$/))) set(x.threads[m[1]], m[2]);
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
    const armed = dropping;
    dropping = "";
    // After adding or taking something off, the cursor goes where it went.
    const where = el.closest(".bd-part")?.getAttribute("aria-labelledby");
    let then = null;
    const focusIn = (...sels) => () => {
      const scope = (where && document.querySelector(`.bd-part[aria-labelledby="${where}"]`)) || document.querySelector(".bd-body");
      sels.map((s) => scope?.querySelector(s)).find(Boolean)?.focus();
    };
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
      return onSave(normalBuild(x), slotKey, () => discard(), d.basis);
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
        if (free < 0 && perms.length >= MAX_PERMS) return toast("Six is the most a Title holds. Tap one to take it off first, or change one by hand.", false);
        if (free < 0) return toast(!changing() && perms.length === 3 ? "That Title’s got three. Tap one to take it off first, or change one by hand." : "That Title’s lines are full. Tap Add a permission for another, or tap one to take it off.", false);
        perms[free] = { text: v, on: [] };
      }
    } else if (k === "addperm") {
      // The one hard stop: six permissions is the most a Title holds.
      const perms = x.titles[i]?.perms;
      if (!perms) return;
      if (perms.length >= MAX_PERMS) return toast("Six is the most a Title holds.", false);
      perms.push(line());
      then = focusIn(`#b-t${i}-p${perms.length - 1}`);
    } else if (k === "addtitle") {
      if (x.titles.length >= MAX_TITLES) return;
      // A Title earned in play comes with one permission. The Quick Build's come with three.
      x.titles.push(changing() ? { ...blankTitle(), perms: [line()] } : blankTitle());
      const n = x.titles.length - 1;
      then = focusIn(`#b-t${n}-text`, `[data-b="arch"][data-t="${n}"]`);
    } else if (k === "droptitle" || k === "dropatt" || k === "dropthread") {
      const kind = k.slice(4);
      const arr = kind === "title" ? x.titles : kind === "att" ? x.attuned : x.threads;
      const it = arr[i];
      if (!it || !canDrop(kind)) return;
      const full = kind === "title" ? titleIn(it) : kind === "att" ? Boolean(it.name.trim() || it.perms.some((p) => p.text.trim())) : Boolean(it.person.trim() || it.text.trim());
      if (full && armed !== `${kind}${i}`) {
        dropping = `${kind}${i}`;
        return render();
      }
      arr.splice(i, 1);
      then = focusIn(`[data-b="add${kind}"]`);
    } else if (k === "addatt") {
      if (x.attuned.length >= MAX_ATTUNED) return;
      x.attuned.push(blankThing());
      then = focusIn(`#b-a${x.attuned.length - 1}-name`);
    } else if (k === "addattperm") {
      const perms = x.attuned[i]?.perms;
      if (!perms) return;
      if (perms.length >= MAX_PERMS) return toast("Six permissions is the most anything holds.", false);
      perms.push(line());
      then = focusIn(`#b-a${i}-p${perms.length - 1}`);
    } else if (k === "stage") {
      if (x.attuned[i] && STAGES.includes(v)) x.attuned[i].stage = v;
    } else if (k === "addthread") {
      if (x.threads.length >= MAX_THREADS) return;
      x.threads.push(blankThread());
      then = focusIn(`#b-th${x.threads.length - 1}-person`);
    } else if (k === "trait") {
      const at = x.traits.findIndex((t) => t.name === v);
      if (at >= 0) x.traits.splice(at, 1);
      else x.traits.push({ name: v, on: [] });
    } else if (k === "own") {
      const name = value("b-own-name").trim();
      const text = value("b-own-text").trim();
      if (!name) return toast("Give your trait a name first.", false);
      const own = { type: value("b-own-type") || "Passive", text };
      const owns = x.traits.filter((t) => t.own);
      const same = x.traits.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());
      // With one of your own, the form rewords it. Otherwise, or with Add it
      // as another, it's a new one, unless the name's already yours.
      const at = v !== "new" && owns.length === 1 ? x.traits.indexOf(owns[0]) : same;
      if (at >= 0 && !x.traits[at].own && v !== "new") return toast(`${name} is already one of your traits.`, false);
      if (v === "new" && same >= 0) return toast(`${name} is already one of your traits.`, false);
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
      if ((m = path.match(/^a(\d+)\.(name|catch)$/))) {
        if (x.attuned[m[1]]) x.attuned[m[1]][m[2]] = v;
      } else {
        const item = lineAt(x, path);
        if (!item) return;
        item.text = v;
        if (path[0] === "e" && ARMOUR.test(v) && !item.on.includes("Defend")) item.on.push("Defend");
      }
    } else if (k === "fillany") {
      const kind = el.dataset.k;
      const list = kind === "e" ? x.equipment : kind === "u" ? x.utility.slice(0, numbersOf(x, B).utility) : [x.keepsake];
      const at = list.findIndex((it) => it.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) Object.assign(list[at], { text: "", on: [] });
      else {
        const free = kind === "k" ? 0 : list.findIndex((it) => !it.text.trim());
        if (free < 0) return toast("That’s full. Tap one to take it off, or change one by hand.", false);
        list[free].text = v;
        // Plain armour and a shield are lines on Defend.
        if (kind === "e" && ARMOUR.test(v) && !list[free].on.includes("Defend")) list[free].on.push("Defend");
      }
    } else if (k === "debt") {
      x.threads[i].debt = !x.threads[i].debt;
      // A debt makes room for a fourth thread in the Quick Build.
      if (!changing() && x.threads.some((t) => t.debt) && x.threads.length < 4) x.threads.push(blankThread());
    } else if (k === "addtrouble") {
      const t = value("b-newtrouble").trim().replace(/\s+/g, " ").slice(0, 120);
      if (!t) return toast("Type the trouble first.", false);
      if (!x.trouble.includes(t)) x.trouble = [...x.trouble, t].slice(0, 12);
    } else if (k === "pronoun") x.pronoun = v;
    else if (k === "trouble") x.trouble = x.trouble.includes(v) ? x.trouble.filter((t) => t !== v) : [...x.trouble, v];
    save();
    render();
    then?.();
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

  return { view, act, input, toggled, open, begin, discard, close, flush: () => d && save(), get step() { return d?.step ?? 0; } };
}
