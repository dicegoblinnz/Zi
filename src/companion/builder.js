// The character builder: the Quick Build from the rules, one step to a screen
// on a phone held in one hand, with the book's own words for each step. It
// warns but never blocks, bar two things: six permissions is the most a Title
// holds, and a permission goes on two set actions at most.
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
import { threadNote } from "./threads.js";
import { SIGILS, aura as kitAura, crest, die as kitDie, grow as growDie, resolve as kitResolve, sigil } from "../kit/kit.js";

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
// A thread is a bond thread or a hostile thread (threads.js). Whose is set
// when it's in a crewmate's words, and strained only when a crew sheet says
// so: what happens in play is kept in the character's state.
const blankThread = (kind = "bond") => ({ person: "", text: "", kind, whose: "" });
// A permission goes on two set actions at most, Defend included.
export const MAX_ON = 2;
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
    // One attuned thing to start, and more later, in downtime.
    attuned: [blankThing()],
    // Two bond threads with the crew, and a hostile thread with anyone.
    threads: [blankThread(), blankThread(), blankThread("hostile")],
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
const kindOf = (t) => (t?.kind === "hostile" || (t?.kind !== "bond" && t?.debt) ? "hostile" : "bond");
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
  // Before 26 Oct 2026 a thread could be a debt. A debt's a hostile thread
  // now, and every other thread from then is a bond thread.
  if (threads) b.threads = threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), kind: kindOf(t), whose: str(t?.whose, 40), ...(t?.strained ? { strained: true } : {}), ...was(t) }));
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
// A permission, on a Title (p0.1) or an attuned thing (a0.0), and how many of
// the set actions it's on.
const isPerm = (ref) => /^[pa]\d/.test(ref);
const onCount = (b, l) => (l ? b.actions.filter((a) => l.on.includes(a)).length : 0);
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
  // Each thread says bond or hostile, and whose it is when it's in someone
  // else's words, the way the crew's do.
  const threads = [];
  for (const th of b.threads) {
    const person = th.person.trim();
    if (!person || !th.text.trim()) continue;
    let g = threads.find((x) => x.person === person);
    if (!g) threads.push((g = { person, threads: [] }));
    const t = { text: th.text.trim(), kind: th.kind, whose: th.whose.trim() || null, strained: Boolean(th.strained) };
    g.threads.push({ ...t, note: threadNote(t) });
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

// The threads that are written in, by kind.
export function threadCount(b) {
  const filled = b.threads.filter((t) => t.person.trim() && t.text.trim());
  const hostile = filled.filter((t) => t.kind === "hostile").length;
  return { bonds: filled.length - hostile, hostile };
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
    if (!t.arch) out.push({ step: 0, t: i, text: `${which} hasn’t got an archetype.` });
    if (!t.text.trim()) out.push({ step: 1, t: i, text: `${which} hasn’t got a name.` });
    const perms = t.perms.filter((p) => p.text.trim());
    if (changing && !perms.length) out.push({ step: 1, t: i, text: `${which} hasn’t got a permission.` });
    if (!changing && perms.length !== 3) out.push({ step: 1, t: i, text: `${which} has ${perms.length} permission${perms.length === 1 ? "" : "s"}. The quick build gives it three.` });
    // A permission goes on two set actions at most, Defend included.
    for (const p of perms) {
      const on = b.actions.filter((a) => p.on.includes(a));
      if (on.length > MAX_ON) out.push({ step: 3, text: `“${p.text.trim()}” is on ${on.length} set actions. A permission goes on two at most, Defend included, so keep it on the two it helps most.` });
    }
  });
  // An attuned thing's permissions go on two set actions at most, like any permission.
  b.attuned.forEach((t) => t.perms.forEach((p, j) => {
    if (!p.text.trim() || !counts(t, j)) return;
    const on = b.actions.filter((a) => p.on.includes(a));
    if (on.length > MAX_ON) out.push({ step: 4, kit: "a", text: `“${p.text.trim()}” on ${attunedName(t)} is on ${on.length} set actions. A permission goes on two at most, Defend included, so keep it on the two it helps most.` });
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
  if (!changing && !b.keepsake.text.trim()) out.push({ step: 4, kit: "k", text: "You haven’t got a keepsake yet." });
  // One attuned thing to start. More come later, in downtime, so a saved
  // character can have as many as they've earned.
  const att = b.attuned.filter((a) => a.name.trim());
  if (!changing && !att.length) out.push({ step: 4, kit: "a", text: "You haven’t attuned anything yet. You start with one thing." });
  if (!changing && att.length > 1) out.push({ step: 4, kit: "a", text: `You’ve attuned ${att.length} things. You start with one, and you can attune more later, in downtime.` });
  b.attuned.forEach((a) => {
    const name = cap(a.name.trim() || "Your attuned thing");
    const filled = a.perms.map((p, j) => [p, j]).filter(([p]) => p.text.trim());
    if (a.name.trim() && !filled.length) out.push({ step: 4, kit: "a", text: `${name} needs a permission.` });
    const r = roomOf(a);
    const over = filled.filter(([, j]) => !counts(a, j));
    if (over.some(([, j]) => j >= r.all)) out.push({ step: 4, kit: "a", text: `${name} holds ${r.all} at ${r.stage}, so the rest stay off the sheet until it goes up a stage.` });
    else if (over.length) out.push({ step: 4, kit: "a", text: r.stage === "Awakened" ? `${name} only gets a second permission with a Catch.` : `${name} needs ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))} to hold more than ${r.base}.` });
    const kept = filled.filter(([p, j]) => p.kept && !fits(a, j));
    if (kept.some(([, j]) => j >= r.all)) out.push({ step: 4, kit: "a", text: `${name} has more on it than ${r.stage} holds. It goes up a stage once it’s got its material.` });
    else if (kept.length) out.push({ step: 4, kit: "a", text: `${name} has more on it than ${r.stage} holds without ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))}.` });
  });
  if (b.utility.slice(n.utility).some((u) => u.text.trim())) out.push({ step: 4, kit: "u", text: `You can carry ${n.utility} utility items, so the last one won’t go on the sheet.` });
  if (bagOf(b).length > 10) out.push({ step: 4, kit: "u", text: `Your bag holds 10, so the last ${bagOf(b).length - 10} won’t go in.` });
  // Two bond threads with the crew to start. A hostile thread lets you write a
  // third bond thread, and three is the most.
  const { bonds, hostile } = threadCount(b);
  if (!changing && bonds < 2) out.push({ step: 5, text: `You’ve written ${bonds === 1 ? "one bond thread" : `${bonds} bond threads`}. You start with two, with the crew.` });
  if (!changing && bonds > 3) out.push({ step: 5, text: `You’ve written ${bonds} bond threads. Three is the most you start with.` });
  else if (!changing && bonds === 3 && !hostile) out.push({ step: 5, text: "A third bond thread comes with a hostile thread, so write one, or take the third bond thread off." });
  if (!changing && hostile > 1) out.push({ step: 5, text: `You’ve written ${hostile} hostile threads. You start with one.` });
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
      if (person && text) b.threads.push({ person, text: str(text, 200), kind: g.kind === "hostile" ? "hostile" : "bond", whose: "" });
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
//
// One step to a screen, for a phone held in one hand, the way a character
// opens: full screen, the crest at the top filling in as the archetypes go on,
// the step's first sentence from the book with the rest of it a tap away, and
// Back and Next in a bar at the bottom, under the thumb. The first two steps
// take one Title at a time, and What you carry one part at a time, and Next
// walks through them before the next step. Everything you pick is a card or a
// piece from the kit: archetypes by their sigils, Title ideas, items, Catches
// and the crew questions as cards, and the set actions as the dice they roll,
// each one growing into its next shape as a line goes on (after()). A blank
// sheet, one of the crew, random and changing a character use the same pieces
// with every step on one page.

const WAYS = ["blank", "crew", "random"];
const STEPS = [
  { name: "Archetypes", short: "Archetypes" },
  { name: "Titles and permissions", short: "Titles" },
  { name: "Traits", short: "Traits" },
  { name: "Set actions", short: "Set actions" },
  { name: "What you carry", short: "What you carry" },
  { name: "Threads", short: "Threads" },
  { name: "Aspiration", short: "Aspiration" },
  { name: "Check it and play", short: "Check it" },
];
// What you carry, a part to a screen.
const KIT = [["e", "Equipment"], ["u", "Utility"], ["k", "Keepsake"], ["a", "Attuned"]];
const PRO = { her: ["she", "her", "she’s"], him: ["he", "his", "he’s"], them: ["they", "their", "they’re"] };
const PRICE = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };
// A link inside a card would be a link inside a button, so cards keep the words only.
const unlink = (html) => String(html ?? "").replace(/<a [^>]*>|<\/a>/g, "");

export function makeBuilder({ B, link, icon, onSave, onLeave, toast, roll, tools = () => "" }) {
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
  let slide = ""; // "next" or "back": the way the next screen comes in
  let shown = null; // each set action's dice as last drawn, so a change grows them

  // The steps a tap away from the bar close again with a tap anywhere else,
  // or Escape, which puts the cursor back on them.
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const menu = document.querySelector(".bd-jump[open]");
      if (menu && !menu.contains(e.target)) menu.removeAttribute("open");
    });
    document.addEventListener("keydown", (e) => {
      const menu = e.key === "Escape" && document.querySelector(".bd-jump[open]");
      if (!menu) return;
      menu.removeAttribute("open");
      menu.querySelector("summary")?.focus();
    });
  }

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
    slide = "";
    shown = null;
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
    slide = "";
    shown = null;
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
  const sigilOf = (name) => (Object.hasOwn(SIGILS, name) ? sigil(name) : "");
  // Which Title the first two steps are on, and which part of what you carry.
  const tabOf = () => Math.min(Math.max(0, Number(d.deep.tab) || 0), Math.max(0, b().titles.length - 1));
  const kitOf = () => (KIT.some(([k]) => k === d.deep.kit) ? d.deep.kit : "e");
  const kitAt = () => KIT.findIndex(([k]) => k === kitOf());

  // The book's words for each step: its first sentence on the screen, and the
  // rest a tap away, remembered open once it's been opened.
  const how = (i) => (B.quick[i]?.more ? `<details class="bd-how" data-open="bd-how-${i}"${d.deep[`how${i}`] === true ? " open" : ""}><summary>How this step works</summary><p>${B.quick[i].more}</p></details>` : "");
  // A permission's on two set actions at most, so once it's on two the rest
  // look full, and tapping one says why it won't go on.
  const toggles = (ref, label) => {
    const l = lineAt(b(), ref);
    const full = isPerm(ref) && onCount(b(), l) >= MAX_ON;
    return `<div class="bd-on" role="group" aria-label="Set actions for ${esc(label)}">${b().actions.map((a) => {
      const on = Boolean(l?.on.includes(a));
      return chip(esc(a), `data-b="on" data-l="${ref}" data-a="${esc(a)}"${full && !on ? ' aria-disabled="true"' : ""}`, on, `sm${full && !on ? " is-full" : ""}`);
    }).join("")}</div>`;
  };
  // Adding and taking off. Something with words in it asks for a second tap
  // before it goes.
  const dropBtn = (kind, i, label) => `<button type="button" class="button sm" data-act="b" data-b="drop${kind}" data-i="${i}">${dropping === `${kind}${i}` ? "Tap again to take it off" : label}</button>`;
  const canDrop = (kind) => (kind === "title" ? b().titles.length > (changing() ? 1 : 2) : kind === "att" ? changing() || b().attuned.length > 1 : changing() || b().threads.length > 3);
  const addTitle = () => (b().titles.length < MAX_TITLES ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addtitle">Add another Title</button></div>${changing() ? '<p class="cc-lead">A Title earned in play comes with one permission, and Resolve goes up by one with it.</p>' : ""}` : "");
  // A card to tap: picked, it's edged in gold with a gold diamond in its corner.
  const card = (cls, attrs, on, inner) => `<button type="button" class="bd-tok ${cls}" data-act="b" ${attrs}${pressed(on)}>${inner}</button>`;

  const backLink = () => `<a class="cc-back" href="/characters/${slotKey === "new" ? "" : `?c=${encodeURIComponent(slotKey)}`}" data-act="b" data-b="leave">${icon.back}${slotKey === "new" ? "Characters" : esc(b().name || "Back")}</a>`;
  const kicker = () => (slotKey === "new" ? "Make your own" : `Changing ${esc(b().name || "your character")}`);
  const dropEdit = () => (slotKey === "new" ? "" : '<button type="button" class="button sm" data-act="b" data-b="dropedit">Drop these changes</button>');
  const saveLabel = () => (changing() ? "Save the changes" : "Save and play");
  // The crest fills in as the archetypes go on: the first Title's in the
  // middle, doubled when it's taken twice, and a second one in the seal.
  function crestNow() {
    const arch = b().titles.map((t) => t.arch).filter((a) => Object.hasOwn(SIGILS, a));
    try {
      return crest(arch, { strict: false, label: arch.length ? `Crest: ${both([...new Set(arch)])}` : "Crest, waiting on an archetype" });
    } catch {
      return "";
    }
  }
  // One of the crew being changed stops following the chapter once it's saved.
  function crewNote() {
    if (!meta.crew || !changing()) return "";
    const [, their, theyre] = PRO[b().pronoun] ?? PRO.them;
    const name = esc(b().name || meta.crew);
    return `<div class="cc-note" role="status"><p>${name}’s sheet comes straight off the chapter for now, so when the rules change, ${their} sheet changes too. Save a change here and ${theyre} your own. ${cap(their)} sheet stops following the chapter, and ${their} Aura, wound die and everything else in play stay as they are.</p></div>`;
  }

  const topbar = () => `<div class="cc-topbar">${backLink()}<div class="cc-tools">${tools()}</div></div>`;
  function head() {
    const i = d.step;
    const bars = STEPS.map((s, k) => `<li${k < i ? ' class="done"' : k === i ? ' class="on"' : ""}></li>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · Step ${i + 1} of 8</p><h1 tabindex="-1">${STEPS[i].name}</h1></div></div>
      <ol class="bd-progress" aria-hidden="true">${bars}</ol>
      <p class="bd-lead">${B.quick[i]?.lead ?? ""}</p>${how(i)}</header>${crewNote()}`;
  }

  // Where Next and Back go: through the Titles on the first two steps and the
  // parts of what you carry, then on to the next step.
  function within(fwd) {
    const x = b();
    if (d.step <= 1) {
      const t = tabOf() + (fwd ? 1 : -1);
      return t >= 0 && t < x.titles.length ? { tab: t, label: `${cap(ord(t))} Title` } : null;
    }
    if (d.step === 4) {
      const k = kitAt() + (fwd ? 1 : -1);
      return k >= 0 && k < KIT.length ? { kit: KIT[k][0], label: KIT[k][1] } : null;
    }
    return null;
  }
  // The bar at the bottom: Back, the steps a tap away, and Next.
  function bar() {
    const i = d.step;
    const ahead = within(true);
    const back = !d.page && (i > 0 || within(false));
    const next = d.page || (i === 7 && !ahead)
      ? `<button type="button" class="button primary bd-next" data-act="b" data-b="save">${saveLabel()}</button>`
      : `<button type="button" class="button primary bd-next" data-act="b" data-b="next"><span>Next</span><small>${esc(ahead ? ahead.label : STEPS[i + 1].short)}</small></button>`;
    const reroll = d.page && d.way === "random" ? `<button type="button" class="button bd-back" data-act="b" data-b="reroll">${sure ? "Tap again to lose your changes" : "Roll again"}</button>` : "";
    return `<div class="bd-foot"><div class="bd-foot-in" role="group" aria-label="${d.page ? "Save" : "Steps"}">
      ${back ? '<button type="button" class="button bd-back" data-act="b" data-b="back">Back</button>' : ""}${reroll}${jump()}${next}</div></div>`;
  }
  // Every step, or every part on one page, a tap from the bar.
  function jump() {
    const i = d.step;
    const rows = STEPS.map((s, k) => {
      const now = !d.page && k === i;
      return `<li><button type="button" class="bd-dot${now ? " is-now" : ""}" data-act="b" data-b="go" data-s="${k}"${now ? ' aria-current="step"' : ""}><span class="n">${k + 1}</span><span>${s.name}</span></button></li>`;
    }).join("");
    return `<details class="bd-jump"><summary>${d.page ? "Parts" : `<span class="sr-only">Step </span>${i + 1}<span class="of"> of 8</span>`}</summary><div class="bd-jumps"><p class="bd-label">${d.page ? "Go to a part" : "Go to a step"}</p><ol>${rows}</ol></div></details>`;
  }

  // Every step on one page, for a blank sheet, one of the crew, random, or
  // changing a saved character.
  function pageView() {
    const [, their] = PRO[b().pronoun] ?? PRO.them;
    const title = changing() ? `Change anything on ${their} sheet` : { blank: "A blank sheet", crew: `From ${esc(d.from || "the crew")}`, random: "Random" }[d.way] ?? "All on one page";
    const parts = BODIES.map((body, i) => `<section class="bd-part" aria-labelledby="bd-part-${i}">${part(i)}</section>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · All on one page</p><h1 tabindex="-1">${title}</h1></div></div>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">Go step by step</button></div></header>
      ${crewNote()}
      <div class="bd-body bd-page">${parts}</div>
      <p class="cc-lead bd-saved">${link("s-quick", "The Quick Build in the rules")}. Your work’s saved on this phone as you go.</p>
      ${dropEdit() ? `<div class="cc-row">${dropEdit()}</div>` : ""}${bar()}`;
  }

  // The first two steps go a Title at a time: a switch at the top for each
  // one, showing its archetype on step 1 and its name on step 2.
  function titleSwitch() {
    const x = b();
    if (x.titles.length < 2) return "";
    const at = tabOf();
    return `<div class="bd-switch" role="group" aria-label="Your Titles">${x.titles.map((t, i) => {
      const says = d.step === 1 ? t.text.trim() || "No name yet" : t.arch || "No archetype yet";
      return `<button type="button" class="bd-seg" data-act="b" data-b="tab" data-t="${i}"${i === at ? ' aria-current="true"' : ""}>${t.arch ? `<span class="bd-sig">${sigilOf(t.arch)}</span>` : ""}<span class="bd-seg-text"><small>${cap(ord(i))} Title</small><b>${esc(says)}</b></span></button>`;
    }).join("")}</div>`;
  }
  const whichTitles = () => (d.page ? b().titles.map((_, i) => i) : [tabOf()]);
  // The same archetype more than once raises its +2.
  function raised() {
    const taken = new Map();
    for (const t of b().titles) if (t.arch) taken.set(t.arch, (taken.get(t.arch) ?? 0) + 1);
    return [...taken].filter(([a, n]) => n > 1 && /^\+2\b/.test(ARCH.get(a)?.aura ?? "")).map(([a, n]) => `<p class="cc-note" role="status">${esc(a)} ${n === 2 ? "twice" : `${n} times`}, so your +2 is a +${n + 1}.</p>`).join("");
  }

  // Step 1: an archetype for each Title, picked by its sigil and what it's
  // for, then a Title idea if you like.
  function stepArch() {
    return `${d.page ? "" : titleSwitch()}${whichTitles().map((i) => archOf(b().titles[i], i)).join("")}${raised()}${addTitle()}`;
  }
  function archOf(t, i) {
    const a = ARCH.get(t.arch);
    // A step at a time, a Title with no archetype shows every card. On one
    // page they wait behind a tap, so the page isn't seventeen cards a Title.
    const picking = d.deep[`pick${i}`] === true || (!a && !d.page);
    const legend = `Your ${ord(i)} Title`;
    const grid = picking ? `<p class="bd-label" id="bd-archs-${i}">${a ? "Pick a different archetype" : "Pick its archetype"}</p><div class="bd-archs" role="group" aria-labelledby="bd-archs-${i}">${B.archetypes.map((r) => card("bd-arch", `data-b="arch" data-t="${i}" data-v="${esc(r.name)}"`, t.arch === r.name, `<span class="bd-sig">${sigilOf(r.name)}</span><b>${esc(r.name)}</b><span class="bd-for">${esc(r.for)}</span>`)).join("")}</div>` : "";
    const chosen = a ? `<div class="bd-chosen" tabindex="-1" role="group" aria-label="${esc(`${cap(legend.toLowerCase())}: ${a.name}`)}"><span class="bd-sig is-on">${sigilOf(a.name)}</span><span class="bd-chosen-text"><b>${esc(a.name)}</b><span class="bd-for">${esc(a.for)}</span></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">${picking ? "Keep it" : "Change"}</button></div>
      <details class="bd-more" data-open="bd-arch-${i}"${d.deep[`archmore${i}`] === true ? " open" : ""}><summary>What the ${esc(a.name)} does</summary><p>${a.summary}</p>${a.auraHtml ? `<p><b>1 Aura:</b> ${a.auraHtml}</p>` : ""}${a.resolveHtml ? `<p><b>1 Resolve:</b> ${a.resolveHtml}</p>` : ""}<p class="cc-small">${link(a.id, `The ${esc(a.name)} in full`)}</p></details>` : "";
    const none = !a && !picking ? `<div class="bd-chosen is-none"><span class="bd-sig"></span><span class="bd-chosen-text"><b>No archetype yet</b></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">Pick one</button></div>` : "";
    return `<fieldset class="bd-title"><legend${d.page ? "" : ' class="sr-only"'}>${legend}</legend>
      ${t.text.trim() && d.page ? `<p class="cc-small"><em>${esc(t.text.trim())}</em></p>` : ""}${chosen}${none}${grid}${a && !picking ? ideasOf(t, i) : ""}
      ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
  }
  // Title ideas as cards: the ones that suit the archetype, or every one.
  function ideasOf(t, i) {
    const all = d.deep[0] === true;
    const fits = B.ideas.filter((idea) => all || idea.archetypes.includes(t.arch));
    const groups = [...new Set(fits.map((idea) => idea.group))];
    const one = (idea) => card("bd-idea", `data-b="idea" data-t="${i}" data-v="${idea.id}"`, t.idea === idea.id, `<b>${esc(idea.name)}</b><span class="bd-for">${esc(cap(idea.playsLike))}</span>`);
    const list = all ? groups.map((g) => `<p class="bd-label">${esc(g)}</p><div class="bd-cards">${fits.filter((idea) => idea.group === g).map(one).join("")}</div>`).join("") : `<div class="bd-cards">${fits.map(one).join("")}</div>`;
    return `<p class="bd-label">A Title idea, if you like</p>
      ${fits.length ? list : `<p class="cc-lead">None of the ideas lists the ${esc(t.arch)}, so write your own Title on the next step, or look through every idea.</p>`}
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="0"${pressed(all)}>${all ? `Just the ${esc(t.arch)}’s ideas` : "Every Title idea"}</button></div>`;
  }

  // Step 2: name each Title and give it its permissions, three to start and
  // six at the most.
  function stepTitles() {
    return `${d.page ? "" : titleSwitch()}${whichTitles().map((i) => titleOf(b().titles[i], i)).join("")}${addTitle()}
      <details class="bd-more" data-open="bd-test"${d.deep.test === true ? " open" : ""}><summary>Is it a permission? The quick test</summary><ol>${B.quickTest.map((q) => `<li>${q}</li>`).join("")}</ol><p>Four yeses and it’s a permission.</p></details>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="1"${pressed(d.deep[1])}>${d.deep[1] ? "Fewer permission ideas" : "More permission ideas"}</button></div>`;
  }
  function titleOf(t, i) {
    const idea = IDEA.get(t.idea);
    const used = new Set(t.perms.map((p) => p.text.trim().toLowerCase()));
    const offer = (list) => `<div class="cc-chips bd-perms">${list.map((p) => chip(`<em>${esc(p)}</em>`, `data-b="perm" data-t="${i}" data-v="${esc(p)}"`, used.has(p.toLowerCase()))).join("")}</div>`;
    return `<fieldset class="bd-title"><legend${d.page ? "" : ' class="sr-only"'}>Your ${ord(i)} Title</legend>
      <p class="bd-from">${t.arch ? `<span class="bd-sig">${sigilOf(t.arch)}</span><span>${esc(t.arch)}${idea ? `, from the ${link(idea.id, `${esc(idea.name)} idea`)}` : ""}</span>` : "<span>No archetype yet</span>"}</p>
      ${field(`t${i}.text`, "Your Title", t.text, { ph: "Make it specific: the best blade in the Low Market", max: 80 })}
      ${idea ? `<p class="bd-label">Or one of the ${esc(idea.name)} idea’s Titles</p><div class="bd-cards is-one">${idea.titles.map((name) => card("bd-name", `data-b="title" data-t="${i}" data-v="${esc(name)}"`, t.text.trim() === name, `<em>${esc(name)}</em>`)).join("")}</div>` : ""}
      <p class="bd-label">${!changing() && i < 2 ? "Three permissions" : "Its permissions, up to six"}</p>
      ${t.perms.map((p, j) => field(`t${i}.p${j}`, `Permission ${j + 1}`, p.text, { ph: "one word, or a doing word and how, what or where", max: 80 })).join("")}
      ${t.perms.length < MAX_PERMS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addperm" data-t="${i}">Add a permission</button></div>` : '<p class="cc-lead">Six is the most a Title holds.</p>'}
      ${idea ? `<p class="cc-small">Tap one of the ${esc(idea.name)} idea’s permissions to put it in, and tap it again to take it out.</p>${offer(idea.permissions)}` : ""}
      ${d.deep[1] ? B.permIdeas.map((g) => `<p class="bd-label">${esc(g.for)}</p>${offer(g.perms)}`).join("") : ""}
      ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
  }

  // Step 3: two traits, as cards.
  function stepTraits() {
    const x = b();
    const picked = new Set(x.traits.map((t) => t.name));
    const suggested = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.traits ?? []))].filter((n) => TRAIT.has(n));
    const one = (t) => card("bd-trait", `data-b="trait" data-v="${esc(t.name)}"`, picked.has(t.name), `<b>${esc(t.name)} <small>${esc(t.type)}</small></b><span class="bd-for">${unlink(t.html)}</span>`);
    const showAll = d.deep[2] || !suggested.length;
    const groups = [...new Set(B.traits.map((t) => t.group))];
    // Picked ones the ideas don't suggest still show, so they can come off.
    const mine = showAll ? [] : x.traits.filter((t) => !t.own && !suggested.includes(t.name));
    // Traits written by hand, in the builder or in downtime. The form adds
    // one, and the same name again rewords it.
    const owns = x.traits.filter((t) => t.own);
    const own = owns.length === 1 ? owns[0] : null;
    return `<p class="cc-note bd-count-note" role="status">You’ve picked ${x.traits.length}${changing() ? "" : " of 2"}${x.traits.length ? `: ${esc(both(x.traits.map((t) => t.name)))}` : ""}.</p>
      ${owns.length ? `<h2>Your own</h2><div class="bd-cards">${owns.map((o) => card("bd-trait", `data-b="trait" data-v="${esc(o.name)}"`, true, `<b>${esc(o.name)} <small>${esc(o.own.type)}</small></b><span class="bd-for">${esc(o.own.text)}</span>`)).join("")}</div><p class="cc-lead">Tap one to take it off.</p>` : ""}
      ${mine.length ? `<h2>Yours</h2><div class="bd-cards">${mine.map((t) => (TRAIT.has(t.name) ? one(TRAIT.get(t.name)) : card("bd-trait", `data-b="trait" data-v="${esc(t.name)}"`, true, `<b>${esc(t.name)}</b>`))).join("")}</div>` : ""}
      ${suggested.length ? `<h2>From your Title ideas</h2><div class="bd-cards">${suggested.map((n) => one(TRAIT.get(n))).join("")}</div>` : ""}
      ${showAll ? groups.map((g) => `<h2>${esc(g || "Traits")}</h2><div class="bd-cards">${B.traits.filter((t) => t.group === g).map(one).join("")}</div>`).join("") : ""}
      ${d.deep[2] ? `<fieldset class="bd-box"><legend>Write your own</legend><p class="cc-lead">A name, a type and one line. If it changes a number, tell your GM which.${owns.length > 1 ? " Give it the name of one of yours to reword that one." : ""}</p>
        ${field("own.name", "Name", own?.name ?? "", { max: 40 })}
        <label class="cc-field" for="b-own-type">Type</label><select id="b-own-type" data-bin="own.type">${["Passive", "Triggered", "Invoked", "Once per scene", "Once per downtime"].map((k) => `<option${own?.own.type === k ? " selected" : ""}>${k}</option>`).join("")}</select>
        ${field("own.text", "What it does", own?.own.text ?? "", { max: 120 })}
        <div class="cc-row"><button type="button" class="button" data-act="b" data-b="own">${own ? "Update it" : "Add it"}</button>${own ? '<button type="button" class="button" data-act="b" data-b="own" data-v="new">Add it as another</button>' : ""}</div></fieldset>` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="2"${pressed(d.deep[2])}>${d.deep[2] ? "Just the ones from your ideas" : suggested.length ? "Every trait, or write your own" : "Write your own trait"}</button></div>`;
  }

  // The set actions as the dice they roll, read off every line on them. On
  // the steps where lines go on, they ride in a dock just above the bar.
  function tiles(names, { rail = false } = {}) {
    const x = b();
    // The dock can scroll sideways with a lot of set actions, so it takes the keyboard too.
    return `<div class="bd-tiles${rail ? ' bd-rail" tabindex="0"' : ' bd-grid"'} role="list" aria-label="Your set actions">${names.map((a) => {
      const s = stepsOf(x, B, a);
      const dice = stepsToDice(s);
      return `<div class="tile" role="listitem"><span class="tile-dice" data-for="${esc(a)}" aria-hidden="true">${dice.map((n, j) => kitDie(n, { hide: true, cls: j ? "is-next" : "" })).join("")}</span><span class="tile-name">${esc(a)}</span><span class="tile-says"><span class="tile-steps">${s} step${s === 1 ? "" : "s"}</span><span class="tile-dot">, </span><span class="tile-die">${diceLabel(dice)}</span></span></div>`;
    }).join("")}</div>`;
  }
  // Each Title with its permissions under it, then the traits, and a chip for
  // every set action on each.
  function lineRows(kinds) {
    const x = b();
    const rank = (l) => (l.kind === "title" ? l.i * 2 : l.kind === "permission" ? l.i * 2 + 1 : 1e4);
    const rows = linesOf(x, B).filter((l) => kinds.includes(l.kind)).sort((p, q) => rank(p) - rank(q));
    const say = (l) => (l.kind === "title" ? `<small>${cap(ord(l.i))} Title</small><em>${esc(l.label)}</em>` : l.kind === "permission" ? `<em>${esc(l.label)}</em>` : `<small>Trait</small><span>${esc(l.label)}</span>`);
    const count = (l) => {
      if (!isPerm(l.ref)) return "";
      const n = onCount(x, lineAt(x, l.ref));
      return `<span class="bd-count${n >= MAX_ON ? " is-full" : ""}">On ${n} of 2</span>`;
    };
    // A permission on more than two set actions says so right there.
    const over = (l) => {
      const n = isPerm(l.ref) ? onCount(x, lineAt(x, l.ref)) : 0;
      return n > 2 ? `<p class="cc-warn">It’s on ${n}. A permission goes on two at most.</p>` : "";
    };
    return rows.length ? `<ul class="bd-lines">${rows.map((l) => `<li class="bd-line is-${l.kind}"><p class="bd-line-say">${say(l)}${count(l)}</p>${toggles(l.ref, l.label)}${over(l)}</li>`).join("")}</ul>` : "";
  }
  // Step 4: lines from every Title, the permissions and the traits.
  function stepActions() {
    const x = b();
    const own = x.actions.filter((a) => !ACTIONS.includes(a));
    return `<p class="cc-lead">Tap a set action to put a line on it, and watch its die grow. A Title or a trait goes on every one it fits, and a permission on two at most, Defend included.</p>
      ${lineRows(["title", "permission", "trait"]) || '<p class="cc-lead">Your Titles, permissions and traits show up here once you’ve written them.</p>'}
      <h2>One of your own</h2><p class="cc-lead">Something you do all the time, like Locks or Ward, or Shoot if you’d rather keep it apart from Fight.</p>
      <div class="cc-form">${field("newact", "Its name", "", { max: 30, ph: "Locks" })}<button type="button" class="button" data-act="b" data-b="addact">Add it</button></div>
      ${own.length ? `<div class="cc-chips">${own.map((a) => `<button type="button" class="cc-chipbtn" data-act="b" data-b="dropact" data-a="${esc(a)}" aria-label="Take off ${esc(a)}">${esc(a)} ×</button>`).join("")}</div>` : ""}
      ${tiles(x.actions, { rail: true })}`;
  }

  // Step 5: what you carry, picked from cards a part at a time, and the
  // attuned things.
  function kitSwitch() {
    const x = b();
    const n = numbersOf(x, B);
    const count = (list, of) => `${list.filter((v) => v.text.trim()).length} of ${of}`;
    const says = { e: count(x.equipment, 3), u: count(x.utility.slice(0, n.utility), n.utility), k: x.keepsake.text.trim() ? "Taken" : "Not yet", a: x.attuned.some((a) => a.name.trim()) ? "Attuned" : "Not yet" };
    return `<div class="bd-switch is-kit" role="group" aria-label="What you carry">${KIT.map(([k, name]) => `<button type="button" class="bd-seg" data-act="b" data-b="kit" data-v="${k}"${k === kitOf() ? ' aria-current="true"' : ""}><span class="bd-seg-text"><small>${says[k]}</small><b>${name}</b></span></button>`).join("")}</div>`;
  }
  function stepCarry() {
    const x = b();
    const n = numbersOf(x, B);
    atLeast(x.utility, Math.min(8, n.utility), line);
    const group = (name) => B.items.find((g) => g.group === name)?.items ?? [];
    const has = new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim().toLowerCase()).filter(Boolean));
    // Item cards: a name, and what it does or says about you where the book has it.
    const offer = (kind, label, list) => `<p class="bd-label">${label}</p><div class="bd-items${list.some((v) => v.say) ? " is-wide" : ""}">${list.map((v) => card("bd-item", `data-b="fillany" data-k="${kind}" data-v="${esc(v.name)}"`, has.has(v.name.toLowerCase()), `<b>${esc(cap(v.name))}</b>${v.say ? `<span class="bd-for">${v.say}</span>` : ""}`)).join("")}</div>`;
    const plain = (list) => list.map((name) => ({ name }));
    // A slot's a numbered row to type in, or to fill from the cards below.
    const slot = (kind, i, label) => {
      const ref = `${kind}${i}`;
      const item = lineAt(x, ref);
      return `<div class="bd-slot is-row">${field(ref, `<span class="sr-only">${label} </span>${i + 1}`, item.text, { max: 60, ph: "Type it, or pick a card below" })}
        ${toggles(ref, item.text || `${label} ${i + 1}`)}</div>`;
    };
    const things = [...new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim()).filter(Boolean))];
    // Something you carry, or a signature thing: the book says one often
    // makes the best thing to attune.
    const pick = (i, a, list) => `<div class="bd-items">${list.map((v) => card("bd-item", `data-b="fill" data-p="a${i}.name" data-v="${esc(v)}"`, a.name.trim() === v, `<b>${esc(cap(v))}</b>`)).join("")}</div>`;
    const yours = (i, a) => `<div class="bd-namepick">${things.length ? `<p class="bd-label">Or one of the things you carry</p>${pick(i, a, things)}` : ""}<p class="bd-label">Or a signature thing</p>${pick(i, a, group("Signature").filter((v) => !things.includes(v)))}</div>`;
    const catches = (i, a) => `<div class="bd-items is-wide bd-catches">${B.catches.map((c) => card("bd-item", `data-b="fill" data-p="a${i}.catch" data-v="${esc(c.name)}"`, a.catch.trim() === c.name, `<b>${esc(c.name)}</b><span class="bd-for">${esc(c.text)}</span>`)).join("")}</div>`;
    const drop = (i) => (canDrop("att") ? `<div class="cc-row">${dropBtn("att", i, "Take it off")}</div>` : "");
    // The Quick Build's: Awakened, one permission, and a second with a Catch.
    const quick = (a, i) => `<fieldset class="bd-box bd-att"><legend>${x.attuned.length > 1 ? `Attuned thing ${i + 1}` : "Your attuned thing"}</legend>
      ${field(`a${i}.name`, "What it is", a.name, { max: 60, ph: "a perfect set of picks" })}${yours(i, a)}
      ${field(`a${i}.p0`, "Its permission", a.perms[0].text, { max: 80, ph: "what the thing itself does" })}${toggles(`a${i}.0`, a.perms[0].text || "its permission")}
      ${field(`a${i}.catch`, "Its Catch, if you’d like a second permission", a.catch, { max: 60, ph: "Wanted" })}${catches(i, a)}
      <div class="bd-perm2">${field(`a${i}.p1`, "Its second permission", a.perms[1].text, { max: 80, ph: "it comes with the Catch" })}${toggles(`a${i}.1`, a.perms[1].text || "its second permission")}</div>${drop(i)}</fieldset>`;
    // A saved character's, at any stage, with up to six permissions.
    const grown = (a, i) => {
      const r = roomOf(a);
      const off = (j) => (j >= r.all ? "until it goes up a stage" : `until it’s got ${both(r.missing.map((m) => (m === "catch" ? "its Catch" : "its Burden")))}`);
      return `<fieldset class="bd-box bd-att is-grown"><legend>Attuned thing ${i + 1}</legend>
        ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a perfect set of picks" })}${yours(i, a)}
        <p class="bd-label" id="bd-stage-${i}">Its stage</p><div class="cc-chips" role="group" aria-labelledby="bd-stage-${i}">${STAGES.map((st) => chip(st, `data-b="stage" data-i="${i}" data-v="${st}"`, r.stage === st)).join("")}</div>
        <p class="cc-small">${r.stage} holds ${r.base}, and ${r.base} more with ${PRICE[r.stage]}. ${link("attunement-stages", "The three stages")}</p>
        ${field(`a${i}.catch`, "Its Catch", a.catch, { max: 80, ph: "Wanted" })}${catches(i, a)}
        ${r.stage !== "Awakened" || a.burden.trim() ? field(`a${i}.burden`, "Its Burden <small>a cost for good, like <em>Bad Knee</em></small>", a.burden, { max: 80, ph: "Bad Knee" }) : ""}
        ${a.perms.map((p, j) => `<div class="bd-slot">${field(`a${i}.p${j}`, `Permission ${j + 1}${p.text.trim() && !counts(a, j) ? ` <small>off the sheet ${off(j)}</small>` : p.text.trim() && !fits(a, j) ? ` <small>past what ${r.stage} holds</small>` : ""}`, p.text, { max: 80, ph: "what the thing itself does" })}${toggles(`a${i}.${j}`, p.text || `permission ${j + 1}`)}</div>`).join("")}
        ${a.perms.length < MAX_PERMS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addattperm" data-i="${i}">Add a permission</button></div>` : '<p class="cc-lead">Six permissions is the most anything holds.</p>'}
        ${drop(i)}</fieldset>`;
    };
    const parts = {
      e: `<section class="bd-carry" aria-labelledby="bd-eq"><h2 id="bd-eq">3 equipment</h2><p class="cc-lead">What you wear or wield. Plain armour and a shield go on your Defend as you take them.</p>
        ${x.equipment.map((e, i) => slot("e", i, "Equipment")).join("")}
        ${offer("e", "Weapons", plain(group("Weapons")))}${offer("e", "Armour and wearables", plain(group("Armour & wearables")))}</section>`,
      u: `<section class="bd-carry" aria-labelledby="bd-ut"><h2 id="bd-ut">${n.utility} utility items</h2><p class="cc-lead">Tools and things you use up.</p>
        ${x.utility.slice(0, n.utility).map((u, i) => slot("u", i, "Utility")).join("")}
        ${offer("u", "Tools", plain(group("Tools")))}${offer("u", "Foci", plain(group("Foci")))}${offer("u", "Things you use up", B.usedUp.map((u) => ({ name: u.name, say: unlink(u.html) })))}
        ${d.deep[4] ? `<h2 id="bd-bag">Your bag</h2>${field("bag", "Up to 10 more things, one a line", x.bag, { area: true, max: 600 })}` : ""}
        <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="4"${pressed(d.deep[4])}>${d.deep[4] ? "Put the bag away" : "Pack your bag too"}</button></div></section>`,
      k: `<section class="bd-carry" aria-labelledby="bd-ks"><h2 id="bd-ks">A keepsake</h2><p class="cc-lead">Something that matters to your character.</p>
        <div class="bd-slot is-row">${field("k", '<span class="sr-only">Keepsake </span>1', x.keepsake.text, { max: 60, ph: "Type it, or pick a card below" })}${toggles("k", x.keepsake.text || "your keepsake")}</div>
        ${offer("k", "Keepsakes", B.keepsakes.map((k) => ({ name: k.name, say: esc(k.text) })))}${offer("k", "Signature things", plain(group("Signature")))}</section>`,
      a: `<section class="bd-carry" aria-labelledby="bd-at"><h2 id="bd-at">${changing() ? "Attuned things" : "Attune one thing"}</h2><p class="cc-lead">${changing() ? "Each one holds what its stage allows, and they don’t count towards what you carry." : "It starts at Awakened with one permission, and it doesn’t count towards what you carry. You can attune more later, in downtime."}</p>
        ${x.attuned.map((a, i) => (changing() ? grown(a, i) : quick(a, i))).join("")}
        ${x.attuned.length < (changing() ? MAX_ATTUNED : 1) ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addatt">${x.attuned.length ? "Attune another thing" : "Attune something"}</button></div>` : ""}</section>`,
    };
    if (d.page) return `${parts.e}${parts.u}${parts.k}${parts.a}${tiles(x.actions, { rail: true })}`;
    return `${kitSwitch()}${parts[kitOf()]}${tiles(x.actions, { rail: true })}`;
  }

  // Step 6: the ten crew questions as cards, each answer made into a bond
  // thread or a hostile one in a tap, and the threads they make: two bond
  // threads with the crew, a hostile thread with anyone, and a third bond
  // thread with it. A saved character keeps every thread they've got, the
  // ones in a crewmate's words included.
  // "Dorrie. We have pulled a dozen jobs together." is a thread with Dorrie.
  const answerOf = (said) => {
    const m = said.match(/^([^.,:;!?]{1,40}?)[.,:]\s+(\S[\s\S]*)$/);
    const person = m && m[1].trim().split(/\s+/).length <= 4 ? m[1].trim() : "";
    return { person, text: (person ? m[2].trim() : said).slice(0, 200) };
  };
  function stepThreads() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    const row = (t, i) => {
      const bond = t.kind !== "hostile";
      return `<fieldset class="bd-box bd-thread is-${bond ? "bond" : "hostile"}"><legend>Thread ${i + 1}</legend>${t.whose.trim() ? `<p class="cc-small">In ${esc(t.whose.trim())} words.</p>` : ""}
      <div class="cc-chips" role="group" aria-label="Thread ${i + 1}, what kind">${chip("Bond", `data-b="kind" data-i="${i}" data-v="bond"`, bond, "sm")}${chip("Hostile", `data-b="kind" data-i="${i}" data-v="hostile"`, !bond, "sm")}</div>
      ${field(`th${i}.person`, "Who with", t.person, { max: 60, ph: bond ? "someone in the crew" : "anyone, in the crew or out of it" })}
      ${field(`th${i}.text`, "What’s true between you", t.text, { max: 200, ph: bond ? "a rescue, a secret you keep for each other, a shared past" : "a debt you can’t pay, a grudge, a betrayal" })}
      ${canDrop("thread") ? `<div class="cc-row">${dropBtn("thread", i, "Take it off")}</div>` : ""}</fieldset>`;
    };
    // Each question's a card. Opened, it takes the answer and makes it a
    // thread, and once it's one it says which.
    const question = (q, i) => {
      const said = String(x.connect[i] ?? "").trim();
      const a = said ? answerOf(said) : null;
      const th = a ? x.threads.find((t) => t.text.trim() && t.text.trim() === a.text.trim() && t.person.trim() === a.person) : null;
      return `<details class="bd-tok bd-q" data-open="bd-q-${i}"${d.deep[`q${i}`] === true ? " open" : ""}><summary><span>${esc(q)}</span>${said ? `<small>${esc(said)}</small>` : ""}${th ? `<span class="bd-made is-${th.kind}">${th.kind === "hostile" ? "Hostile" : "Bond"} thread</span>` : ""}</summary>
        <div class="bd-q-in">${field(`cq${i}`, `Your answer<span class="sr-only"> to ${esc(q)}</span>`, x.connect[i] ?? "", { max: 200, ph: "Name them, then say it" })}
        <p class="bd-label" id="bd-qk-${i}">Make it a thread</p><div class="cc-chips" role="group" aria-label="Make your answer to ${esc(q)} a thread">${chip("Bond", `data-b="fromq" data-q="${i}" data-v="bond"`, th?.kind === "bond", "sm")}${chip("Hostile", `data-b="fromq" data-q="${i}" data-v="hostile"`, th?.kind === "hostile", "sm")}</div></div></details>`;
    };
    const room = !changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim());
    const qs = `<p class="cc-lead">Answer at least two, naming someone in the crew in each, and make two of them bond threads. One that’s gone bad can be your hostile thread.</p><div class="bd-qs">${B.connect.map(question).join("")}</div>`;
    return `${changing() ? `<details class="bd-more" data-open="bd-qs"${d.deep.qs === true ? " open" : ""}><summary>The ten crew questions</summary>${qs}</details>` : `<h2 id="bd-qs-h">The crew questions</h2>${qs}`}
      <h2 id="bd-th-h">Your threads</h2>
      ${x.threads.map(row).join("")}
      ${room ? '<p class="cc-note" role="status">You’ve written a hostile thread, so you’ve got room for a third bond thread.</p>' : ""}
      ${x.threads.length < MAX_THREADS ? '<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addthread">Add a thread</button></div>' : ""}`;
  }

  // Step 7: one thing you want, at d2.
  function stepAsp() {
    return `<div class="bd-asp">${changing() ? "" : `<span class="bd-asp-die">${kitDie(2, { label: "Your Aspiration starts at d2" })}</span>`}<div class="bd-asp-f">${field("asp", changing() ? "Your Aspiration <small>its die’s on the Sheet tab</small>" : "Your Aspiration", b().aspiration, { max: 120, ph: "Own the score of a lifetime" })}</div></div>`;
  }

  // Step 8: the numbers in the kit's pieces, a name, and a last look.
  function stepCheck() {
    const x = b();
    const n = numbersOf(x, B);
    const checks = checksOf(x, B, { changing: changing() });
    const trouble = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.trouble ?? []))];
    const num = (k, v, note, piece = "", cls = "") => `<li${cls ? ` class="${cls}"` : ""}><span class="bd-num-text"><span class="k">${k}</span> <b>${v}</b>${note ? ` <small>(${esc(note)})</small>` : ""}</span>${piece}</li>`;
    const go = (c) => `<button type="button" class="button sm" data-act="b" data-b="go" data-s="${c.step}"${c.t != null ? ` data-t="${c.t}"` : ""}${c.kit ? ` data-k="${c.kit}"` : ""}>${d.page ? STEPS[c.step].name : `Step ${c.step + 1}`}</button>`;
    return `<fieldset class="bd-box"><legend>Who they are</legend>
        ${field("name", "Name", x.name, { max: 40 })}
        <p class="bd-label" id="bd-pro">Call them</p><div class="cc-chips" role="group" aria-labelledby="bd-pro">${[["her", "she, her"], ["him", "he, him"], ["them", "they, them"]].map(([v, l]) => chip(l, `data-b="pronoun" data-v="${v}"`, x.pronoun === v)).join("")}</div>
        ${field("blurb", "One line about them, if you like", x.blurb, { max: 160 })}</fieldset>
      <h2>Your numbers</h2><ul class="bd-nums">
        ${num("Aura", n.aura, null, kitAura(n.aura, n.aura), "is-wide")}${num("Resolve", n.resolve, "one for each Title", kitResolve(n.resolve, n.resolve))}
        ${num("Stride", n.stride, n.strideNote)}
        ${num("Wound die", `d${n.wound}`, n.shrug ? `${n.woundNote}: ${n.shrug > 1 ? `the first ${n.shrug} Hurts each scene don’t` : "the first Hurt each scene doesn’t"} move it` : null, kitDie(n.wound, { own: "harm", hide: true, bare: true }))}
        ${num("Confidence", `d${n.confidence}`, n.confidenceNote ? `${n.confidenceNote}, every scene` : "every scene", kitDie(n.confidence, { hide: true, bare: true }))}</ul>
      ${field("clothes", "Clothes that fit some scenes, if you’ve got them", x.clothes, { max: 60, ph: "a fine coat" })}
      <p class="cc-lead">In them, Confidence starts a size up when they fit the scene.</p>
      <h2>Set actions</h2>${tiles(x.actions)}
      ${trouble.length || x.trouble.length || changing() ? `<h2>Trouble that follows you</h2><p class="cc-lead">If you like. Let it cause real trouble and you take 1 Aura.</p>${trouble.length || x.trouble.length ? `<div class="cc-chips">${[...new Set([...trouble, ...x.trouble])].map((t) => chip(`<em>${esc(t)}</em>`, `data-b="trouble" data-v="${esc(t)}"`, x.trouble.includes(t))).join("")}</div>` : ""}
        <div class="cc-form">${field("newtrouble", "Or write your own", "", { max: 120, ph: "owes the wrong people" })}<button type="button" class="button" data-act="b" data-b="addtrouble">Add it</button></div>` : ""}
      ${checks.length ? `<div class="cc-note is-warn"><p>A few things to look at. You can save anyway, and change them later.</p><ul class="bd-checks">${checks.map((c) => `<li>${esc(c.text)} ${go(c)}</li>`).join("")}</ul></div>` : '<p class="cc-note" role="status">Everything adds up.</p>'}`;
  }

  const BODIES = [stepArch, stepTitles, stepTraits, stepActions, stepCarry, stepThreads, stepAsp, stepCheck];
  const part = (i) => `<h2 id="bd-part-${i}" tabindex="-1">${STEPS[i].name}</h2>${how(i)}${BODIES[i]().replace(/<(\/?)h2\b/g, "<$1h3")}`;
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
    const go = slide;
    slide = "";
    return `${head()}<div class="bd-body${go ? ` bd-go-${go}` : ""}">${BODIES[d.step]()}
      <p class="cc-lead bd-saved">Your work’s saved on this phone as you go.</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">See it all on one page</button>${dropEdit()}</div></div>${bar()}`;
  }
  // After a redraw, every set action whose dice changed grows into its new
  // shape, or shrinks back, and a second die pops in past 6 steps. grow()
  // leaves the new die as it's drawn under reduce-motion.
  function after(root) {
    if (!d) return;
    const foot = root?.querySelector(".bd-foot");
    if (foot) document.documentElement.style.setProperty("--bd-bar", `${foot.offsetHeight}px`);
    const x = b();
    const now = new Map(x.actions.map((a) => [a, stepsToDice(stepsOf(x, B, a))]));
    const was = shown;
    shown = now;
    if (!was || !root) return;
    for (const el of root.querySelectorAll(".bd-tiles .tile-dice[data-for]")) {
      const old = was.get(el.dataset.for);
      const dice = now.get(el.dataset.for);
      if (!old || !dice) continue;
      const svgs = el.querySelectorAll(".zd-die");
      if (old[0] !== dice[0]) growDie(svgs[0], old[0], dice[0]);
      if (dice.length > old.length) svgs[dice.length - 1]?.classList.add("is-new");
    }
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

  // A hostile thread makes room for a third bond thread in the Quick Build.
  function roomForThird() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    if (!changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim()) && x.threads.length < MAX_THREADS) x.threads.push(blankThread());
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
    // A Title or a part of what you carry, switched to: its switch stays
    // where the thumb is, and the screen starts from the switch.
    const toSwitch = () => {
      const sw = document.querySelector(".bd-switch");
      if (sw && sw.getBoundingClientRect().top < 0) sw.scrollIntoView({ block: "start" });
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
      const to = Math.min(7, Math.max(0, Number(el.dataset.s)));
      el.closest("details")?.removeAttribute("open");
      if (d.page) {
        d.step = to;
        const h = document.getElementById(`bd-part-${to}`);
        h?.scrollIntoView({ block: "start" });
        return h?.focus({ preventScroll: true });
      }
      const moved = to !== d.step;
      slide = to > d.step ? "next" : to < d.step ? "back" : "";
      d.step = to;
      if (el.dataset.t != null) d.deep.tab = Number(el.dataset.t);
      else if (to <= 1 && moved) d.deep.tab = 0;
      if (el.dataset.k) d.deep.kit = el.dataset.k;
      else if (to === 4 && moved) d.deep.kit = "e";
      save();
      render();
      return focusTop();
    }
    if (k === "next" || k === "back") {
      const fwd = k === "next";
      const step = within(fwd);
      slide = fwd ? "next" : "back";
      if (step) {
        if (step.tab != null) d.deep.tab = step.tab;
        if (step.kit) d.deep.kit = step.kit;
        save();
        render();
        scrollTo(0, 0);
        return document.querySelector('.bd-switch [aria-current="true"]')?.focus({ preventScroll: true });
      }
      const to = d.step + (fwd ? 1 : -1);
      if (to < 0 || to > 7) return;
      d.step = to;
      // Coming into a step from the one before starts on its first Title or
      // part, and coming back into it from the one after, on its last.
      if (to <= 1) d.deep.tab = fwd ? 0 : x.titles.length - 1;
      if (to === 4) d.deep.kit = fwd ? KIT[0][0] : KIT[KIT.length - 1][0];
      save();
      render();
      return focusTop();
    }
    if (k === "tab" || k === "kit") {
      const was = k === "tab" ? tabOf() : kitAt();
      if (k === "tab") d.deep.tab = Math.min(Math.max(0, i), x.titles.length - 1);
      else d.deep.kit = KIT.some(([key]) => key === v) ? v : "e";
      const now = k === "tab" ? tabOf() : kitAt();
      slide = now > was ? "next" : now < was ? "back" : "";
      save();
      render();
      return toSwitch();
    }
    if (k === "reroll") {
      if (JSON.stringify(x) !== rolled && !sure) {
        sure = true;
        return render();
      }
      sure = false;
      d.build = normalBuild(roll());
      rolled = JSON.stringify(d.build);
      shown = null;
      save();
      return render();
    }
    if (k === "page") {
      d.page = !d.page;
      d.step = 0;
      d.deep.tab = 0;
      d.deep.kit = "e";
      save();
      render();
      return focusTop();
    }
    if (k === "save") {
      save();
      return onSave(normalBuild(x), slotKey, () => discard(), d.basis);
    }
    if (k === "deep") d.deep[el.dataset.s] = !d.deep[el.dataset.s];
    else if (k === "archopen") {
      d.deep[`pick${i}`] = !(d.deep[`pick${i}`] === true);
      then = d.deep[`pick${i}`] ? focusIn(`[data-b="arch"][data-t="${i}"][aria-pressed="true"]`, `[data-b="arch"][data-t="${i}"]`) : focusIn(`[data-b="archopen"][data-t="${i}"]`);
    } else if (k === "arch") {
      const t = x.titles[i];
      // The one it's got already, tapped again, is kept.
      t.arch = v;
      if (t.idea && !IDEA.get(t.idea)?.archetypes.includes(t.arch)) t.idea = "";
      // Picked, the cards fold away to the one picked and its Title ideas.
      if (t.arch) {
        delete d.deep[`pick${i}`];
        then = () => {
          const box = [...document.querySelectorAll(`[data-b="archopen"][data-t="${i}"]`)].map((btn) => btn.closest(".bd-chosen")).find(Boolean);
          box?.focus({ preventScroll: true });
          if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start" });
        };
      }
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
      // It opens on the new Title, with its archetype cards out.
      d.deep.tab = n;
      d.deep[`pick${n}`] = true;
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
      if (kind === "title") {
        // The switch and the open pickers follow the Titles that are left.
        for (const key of ["pick", "archmore"]) {
          for (let j = i; j < arr.length; j++) d.deep[`${key}${j}`] = d.deep[`${key}${j + 1}`];
          delete d.deep[`${key}${arr.length}`];
        }
        d.deep.tab = Math.min(tabOf(), arr.length - 1);
      }
      then = focusIn(`[data-b="add${kind}"]`, `[data-b="tab"][aria-current="true"]`);
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
      // The one other hard stop: a permission goes on two set actions at most.
      if (!l.on.includes(a) && isPerm(el.dataset.l) && onCount(x, l) >= MAX_ON) {
        return toast(`${l.text.trim() ? `“${l.text.trim()}” is` : "That permission’s"} on two set actions already, and two’s the most a permission goes on. Tap one of them off first.`, false);
      }
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
        // A second tap on the card it's from takes it back off.
        if (x.attuned[m[1]]) x.attuned[m[1]][m[2]] = x.attuned[m[1]][m[2]].trim() === v ? "" : v;
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
    } else if (k === "kind") {
      if (!x.threads[i]) return;
      x.threads[i].kind = v === "hostile" ? "hostile" : "bond";
      roomForThird();
    } else if (k === "fromq") {
      // An answer becomes a thread in one tap, bond or hostile. It goes in the
      // first empty thread of that kind, then any empty one, or a new one, and
      // an answer that's a thread already just changes its kind.
      const q = Number(el.dataset.q);
      const kind = v === "hostile" ? "hostile" : "bond";
      const said = String(x.connect[q] ?? "").trim();
      if (!said) return toast("Answer the question first, then make it a thread.", false);
      const { person, text } = answerOf(said);
      let at = x.threads.findIndex((t) => t.text.trim() === text.trim() && t.person.trim() === person);
      if (at >= 0 && x.threads[at].kind === kind) {
        Object.assign(x.threads[at], { person: "", text: "" });
        save();
        return render();
      }
      if (at < 0) at = x.threads.findIndex((t) => t.kind === kind && !t.person.trim() && !t.text.trim());
      if (at < 0) at = x.threads.findIndex((t) => !t.person.trim() && !t.text.trim());
      if (at < 0) {
        if (x.threads.length >= MAX_THREADS) return toast("That’s as many threads as a sheet holds.", false);
        x.threads.push(blankThread(kind));
        at = x.threads.length - 1;
      }
      Object.assign(x.threads[at], { person, text, kind });
      roomForThird();
      // Without a name in the answer, who it's with is the next thing to write.
      if (!person) then = focusIn(`#b-th${at}-person`);
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

  // The details boxes remember being opened, so the book's words and the
  // questions stay as they were left.
  function toggled(el) {
    if (!d) return;
    const key = el.dataset.open ?? "";
    let m;
    const name = (m = key.match(/^bd-how-(\d)$/)) ? `how${m[1]}` : (m = key.match(/^bd-q-(\d+)$/)) ? `q${m[1]}` : (m = key.match(/^bd-arch-(\d+)$/)) ? `archmore${m[1]}` : key === "bd-test" ? "test" : key === "bd-qs" ? "qs" : "";
    // A redraw puts a fold back the way it was, which isn't a change.
    if (!name || (d.deep[name] === true) === el.open) return;
    d.deep[name] = el.open;
    saveSoon();
  }

  return { view, act, input, toggled, open, begin, discard, close, after, flush: () => d && save(), get step() { return d?.step ?? 0; } };
}
