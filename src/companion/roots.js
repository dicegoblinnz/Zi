// The rules for a character on the phone, shared by the companion, print and
// the checks, with no page in them. Since Mo's 16 Nov rework (the new core,
// notes/core-plan.md), a Title puts 5 on your Roots, spread however you like,
// and a permission puts 1 on its Root. A Root's points are its dice, its
// health and what you spend: Body 8 is 8 steps of dice, 8 points to lose
// before it's Bloodied, and 8 to spend bringing it into a roll. A roll is one
// Root at full, and spent, lost or locked points never shrink the dice.
// Bringing another Root in takes a permission that justifies it and 1 point
// from that Root, or 3 Aura. Each awakening locks a point of the Root it fits
// for as long as it's attuned, and it's 2 steps on a roll it fits, 2 more for
// each Aura spent on it. A hit takes a point off its Root, or 2 off another
// that has them. A hit on a Root at 0 wounds it (Bloodied, Frayed or Hollow),
// and a wounded Root heals only to half what it can hold. A hit on a wounded
// Root at 0 is a Scar, a Catch that locks a point for good, and you leave the
// scene. A heal recovers what it rolls, less 5 for each Toll, and every heal
// from someone or something else adds 1 Toll. The end of a scene rolls each
// Root unsplit and recovers what it rolls, and drops Toll by 1, and downtime
// puts everything back. Aura's 5 (and 2 for each Aura Boon), full every scene,
// 1 back for every die that wins and every top face, and past the maximum
// while you're acting. There are no tracks and no extra actions.
//
// A character's state (state.v === 4):
//   { v, aura, acting, pts: { Body, Mind, Soul }, wound: { Body, Mind, Soul },
//     toll, scars: { Body: [Catch], Mind: [], Soul: [] }, blaze, out, dead,
//     conditions, threads, crossed, boxes, picked, asp, aspText, notes, last,
//     grown, before, moved, core, choose, seen, tele, tough, beyond, elem, pool }
// pts is what each Root's got now, full on a new character (capOf). wound
// says which Roots are wounded, toll is how many heals from someone else
// they've had since it last cleared, and scars are the Catches each Root's
// Scars left. blaze is a Root whose Scar is waiting for its Catch (a hit on
// it wounded at 0, or the Blaze taken), and out says they've left the scene.
// core is there till the player's seen that the character moved onto the new
// core, and choose is what that move left for them to choose (choicesOf).
// grown is what downtime gave them, in the shapes growRoots() reads, and
// before is what they grew before the Roots change, waiting to be put back.
//
// At the bottom is what the screens that haven't moved onto the new core yet
// still use (the tracks, powering awakenings and extra actions, on a v3
// state). Prompts 4 to 6 of notes/core-plan.md move them off it, and prompt 7
// takes it out.

import { sizeDown, sizeUp, stepsToDice, SIZES } from "./dice.js";
import { START, costOf } from "./points.js";

export const ROOTS = ["Body", "Mind", "Soul"];
// What a wound's called on each Root.
export const WOUNDS = { Body: "Bloodied", Mind: "Frayed", Soul: "Hollow" };
export const MAX_PERMS = 6;
export const MAX_ABILITIES = 6;
export const STAGES = ["Awakened", "Tempered", "Perfected"];
// What a Title puts on your Roots, and what it put before the new core.
export const TITLE_ROOTS = 5;
export const OLD_TITLE_ROOTS = 3;
// Aura's maximum: 5, and 2 for each Aura Boon. An attuned thing puts nothing
// on it any more.
export const BASE_AURA = 5;
export const ATTUNED_AURA = 0;
// An awakening's 2 steps on a roll it fits, and 2 more for each Aura on it.
export const AWK_STEPS = 2;
// Bringing a Root in: 1 point from it, or 3 Aura.
export const BRING_PTS = 1;
export const BRING_AURA = 3;
// Each Toll takes 5 off a heal.
export const TOLL_STEP = 5;
// The Recovery Boon puts 2 on each Root's roll at the end of a scene.
export const REST_BOON = 2;

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, int(v, lo)));
const even = (v, lo, hi) => clamp(Math.round(int(v, lo) / 2) * 2, lo, hi);
const text = (v, n = 80) => String(v ?? "").trim().slice(0, n);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const zero = () => ({ Body: 0, Mind: 0, Soul: 0 });
export const specKey = (name) => String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// ---------------------------------------------------------------- the sheet

// A sheet on Roots has Roots, and no set actions. Anything else (a character
// built before 8 Nov 2026) is the old shape.
export const isRootsSheet = (c) => Boolean(c && c.roots && typeof c.roots === "object" && !Array.isArray(c.actions));
// What's saved for a character from before Roots: a wound die, set actions'
// Confidence and Resolve as a number, or the even older Hurt track.
export const isOldState = (raw) => Boolean(raw && typeof raw === "object" && !raw.tracks && !raw.pts && (Number.isFinite(Number(raw.wound)) || Number.isFinite(Number(raw.conf)) || typeof raw.resolve === "number" || "hurt" in raw));
// A build from the builder before Roots: set actions and Titles with an archetype each.
export const isOldBuild = (b) => Boolean(b && typeof b === "object" && (Array.isArray(b.actions) || Array.isArray(b.traits) || (Array.isArray(b.titles) && b.titles.some((t) => t && typeof t === "object" && "arch" in t && !("root" in t)))));

// What a Title puts on each Root: its spread, or, for a Title from before
// stacking with one Root, all 5 on that one.
export function spreadOf(t) {
  if (t?.roots && typeof t.roots === "object") return Object.fromEntries(ROOTS.map((r) => [r, clamp(t.roots[r], 0, TITLE_ROOTS)]));
  const out = zero();
  if (ROOTS.includes(t?.root)) out[t.root] = TITLE_ROOTS;
  return out;
}
const sumOf = (spread) => ROOTS.reduce((n, r) => n + (spread?.[r] ?? 0), 0);
// The Root a Title puts most on, the first of them on a tie: where a roll
// with the Title in it is likeliest, and the Root a new permission on it
// starts on.
export const mostOf = (spread) => ROOTS.reduce((best, r) => (spread[r] > (spread[best] ?? 0) ? r : best), "");

// A Title's 3 from before the new core made 5, the 2 more spread the way the
// 3 were, as near as it goes: each Root gets its share of 5 rounded down,
// and what's left goes to the biggest remainders. When those tie (1 on each),
// they go where the Title's own permissions are, then Body, Mind and Soul.
// So Body 3 is Body 5, Mind 2 and Body 1 is Mind 3 and Body 2, and 1 on
// each is 2, 2 and 1.
export function toFive(spread, perms = []) {
  const from = Object.fromEntries(ROOTS.map((r) => [r, Math.max(0, int(spread?.[r], 0))]));
  const was = sumOf(from);
  if (!was) return zero();
  const share = Object.fromEntries(ROOTS.map((r) => [r, (from[r] * TITLE_ROOTS) / was]));
  const out = Object.fromEntries(ROOTS.map((r) => [r, Math.floor(share[r])]));
  const leans = zero();
  for (const p of perms ?? []) if (ROOTS.includes(p?.root)) leans[p.root] += 1;
  const order = [...ROOTS].filter((r) => from[r]).sort((a, b) => (share[b] - out[b]) - (share[a] - out[a]) || leans[b] - leans[a] || ROOTS.indexOf(a) - ROOTS.indexOf(b));
  for (let i = 0, left = TITLE_ROOTS - sumOf(out); left > 0; i++, left--) out[order[i % order.length]] += 1;
  return out;
}

// Count the Roots: each Title's spread, and 1 for every permission on its
// Root. Nothing else adds to a Root.
export function countRoots(titles) {
  const roots = zero();
  for (const t of titles ?? []) {
    const spread = spreadOf(t);
    for (const r of ROOTS) roots[r] += spread[r];
    for (const p of t?.permissions ?? []) if (ROOTS.includes(p?.root)) roots[p.root] += 1;
  }
  return { roots };
}

// A Title on the sheet: its words, its spread and its permissions, each with
// its Root. One from before stacking (a crew sheet or a build with one Root
// and its specialties) reads as all 5 on that Root, and says so (fromRoot),
// for the player to spread how they like, and its specialties go. One from
// stacking, spread 3, is made 5 (toFive) on a sheet that isn't on the new
// core already, and says what it was (fromThree), for the player to check.
function titleOf(t, B, core = false) {
  const words = text(t?.text ?? t?.name, 160);
  const permissions = (Array.isArray(t?.permissions) ? t.permissions : []).filter((p) => p && typeof p === "object").map(({ specialty, spec, ...p }) => ({ ...p, root: ROOTS.includes(p.root) ? p.root : "" }));
  let spread = spreadOf(t);
  const out = {
    ...t,
    text: words,
    permissions,
    boons: (Array.isArray(t?.boons) ? t.boons : []).filter((x) => x && text(x.lever, 40)).map((x) => boonOf(x, B)),
  };
  for (const k of ["name", "root", "specialties", "specs", "fromRoot", "fromThree"]) delete out[k];
  if (!(t?.roots && typeof t.roots === "object") && ROOTS.includes(t?.root)) out.fromRoot = t.root;
  else if (!core && t?.roots && typeof t.roots === "object" && sumOf(spread) === OLD_TITLE_ROOTS) {
    out.fromThree = spread;
    spread = toFive(spread, permissions);
  }
  out.roots = spread;
  return out;
}

// An archetype on the sheet: the book's own (what it's for, its Trait and
// its whole list of abilities, each with what it costs in Aura) with the
// abilities this character's got, the one it came with first. One from
// before stacking came with every ability it had, so it keeps them all. A
// Trait the book hasn't got yet is there with nothing in it. One the book
// hasn't got at all any more, like the Scholar since 14 Nov, is gone, for the
// player to swap.
const traitOf = (x) => (x && typeof x === "object" ? { name: text(x.name, 60), text: String(x.text ?? x.html ?? ""), short: String(x.short ?? "") } : typeof x === "string" && x ? { name: text(x, 60), text: "" } : { name: "", text: "" });
function archOf(a, B) {
  const rule = (B?.archetypes ?? []).find((x) => x.name === a.name) ?? null;
  const abilities = rule?.abilities ?? (Array.isArray(a.abilities) ? a.abilities : []);
  const have = Array.isArray(a.have) ? a.have : abilities.map((x) => x.name);
  const out = {
    ...a,
    id: a.id ?? rule?.id ?? null,
    summary: rule?.summary ?? a.summary ?? "",
    for: rule?.for ?? a.for ?? "",
    trait: traitOf(rule?.trait ?? a.trait),
    abilities,
    have: [...new Set(have.map((n) => text(n, 60)).filter(Boolean))],
  };
  delete out.gone;
  if (B?.archetypes?.length && !rule) out.gone = true;
  return out;
}

// An awakening on the sheet: its name, the Root whose point it locks, and
// what it does. One from before the new core hasn't got a Root, so it's
// guessed as the biggest of theirs, and says so (guessed), for the player to
// check.
function awkOf(w) {
  const out = { ...w, name: text(w?.name, 80), text: String(w?.text ?? "").trim().slice(0, 300), root: ROOTS.includes(w?.root) ? w.root : "" };
  delete out.guessed;
  delete out.kind;
  return out;
}

// The sheet the phone plays from: the crew's off the chapter, or a build's,
// with what they grew in downtime on top (growRoots), and the attuned thing
// as a list, since an Aspiration can bring another. B is the builder's data
// from the book, for an archetype's Trait and abilities. Points are what
// they were made with, before downtime grew them (points.js). A sheet that
// says core: true was made on the new core, so a Title on it spread 3 is
// left as it is.
export function rootsSheet(base, grown = [], B = null) {
  if (!base) return null;
  const c = JSON.parse(JSON.stringify(base));
  const core = c.core === true;
  c.attuned = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  for (const a of c.attuned) {
    a.stage = STAGES.includes(a.stage) ? a.stage : "Awakened";
    a.awakenings = (Array.isArray(a.awakenings) ? a.awakenings : []).filter((w) => w && typeof w === "object").map(awkOf);
    a.catch ??= null;
    a.burden ??= null;
    // An attuned thing gets you no Aura any more.
    delete a.aura;
  }
  c.archetypes = (c.archetypes ?? []).map((a) => archOf(typeof a === "string" ? { name: a, id: null } : a, B));
  // What they carry, as lists. A crew sheet writes a piece of armour with its
  // quality first (Fine plate armour), and the phone keeps it by the piece's
  // own name, so what's ticked and crossed out follows the piece.
  const carry = c.carry ?? {};
  const bare = (x) => String(x).replace(/\b(Common|Fine|Masterwork)\s+/, "");
  const piece = (x) => (c.armour ?? []).find((a) => a.name === x || a.name === bare(x))?.name ?? x;
  c.carry = {
    equipment: (Array.isArray(carry.equipment) ? carry.equipment : carry.equipment?.items ?? []).map(piece),
    utility: Array.isArray(carry.utility) ? carry.utility : carry.utility?.items ?? [],
    keepsake: carry.keepsake ?? null,
    bag: { name: carry.bag?.name ?? "a bag", max: carry.bag?.max ?? 10, items: carry.bag?.items ?? [] },
  };
  c.armour = (c.armour ?? []).map((a) => ({ ...a, root: ROOTS.includes(a.root) ? a.root : "Body" }));
  c.titles = (c.titles ?? []).filter((t) => t && typeof t === "object").map((t) => titleOf(t, B, core));
  c.points = { start: int(base.points?.start, START), spent: costOf(c).spent };
  if (Array.isArray(grown) && grown.length) growRoots(c, grown, B);
  withBoons(c);
  c.roots = countRoots(c.titles).roots;
  // An awakening with no Root locks a point of their biggest, till they say.
  const big = bestRoot(c);
  for (const a of c.attuned) for (const w of a.awakenings) if (!w.root) Object.assign(w, { root: big, guessed: true });
  // No tracks on a sheet any more.
  if (c.numbers) for (const k of ["stamina", "confidence", "resolve"]) delete c.numbers[k];
  delete c.specialties;
  return c;
}

// What downtime grows, on top of the sheet, each one adding one thing. g is
// the entry's place in the list, so the gold marks never take a line the
// player grew for a change in the rules. A slot buys what a point does.
//   { k: "perm", t, text, root }                a permission on Title t
//   { k: "swap", t, j, text, root }             permission j on Title t, swapped
//   { k: "boon", t, lever, name, on, drop }     two permissions swapped for a Boon
//   { k: "ability", a, name }                   another ability for archetype a
//   { k: "awk", a, name, root, text, catch, burden } an awakening on attuned thing a
//   { k: "stage", a, to, catch, burden }        attuned thing a up a stage
//   { k: "thread", person, text, kind }         a new thread, bond or hostile
//   { k: "title", text, roots, perm }           a new Title, from an Aspiration
//   { k: "arch", arch, have }                   a new archetype, from an Aspiration
//   { k: "attune", name, awk }                  a new attuned thing, from an Aspiration
// From before stacking, a permission said its specialty (spec) and a new
// Title its one Root (root) and specialties (specs): the specialties are gone,
// and that Title reads as all 5 on its Root. A new Title from stacking spread
// 3 is made 5 like any other (titleOf), and an awakening from before the new
// core hasn't got a Root till they say (rootsSheet guesses it). An archetype
// with no have came with every ability it had.
export function growRoots(c, grown, B = null) {
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  for (const [g, x] of grown.entries()) {
    if (!x || typeof x !== "object") continue;
    const root = ROOTS.includes(x.root) ? x.root : null;
    const words = text(x.text, 120);
    if (x.k === "perm" && words && root) {
      const t = c.titles[int(x.t, -1)];
      if (t && slotsOf(t) < MAX_PERMS) t.permissions.push({ text: words, root, g });
    } else if (x.k === "boon" && text(x.lever, 40)) {
      // Two permissions swapped for a Boon, in downtime: they come off the
      // Title and the Boon takes their two slots.
      const t = c.titles[int(x.t, -1)];
      if (!t) continue;
      const drop = [...new Set((Array.isArray(x.drop) ? x.drop : []).map((j) => int(j, -1)))].filter((j) => t.permissions[j]).sort((a, b) => b - a);
      // Nothing comes off unless the Boon fits once it has.
      if (slotsOf(t) - drop.length + BOON_SLOTS > MAX_PERMS) continue;
      for (const j of drop) t.permissions.splice(j, 1);
      t.boons.push({ ...boonOf(x, B), g });
    } else if (x.k === "swap" && words && root) {
      const t = c.titles[int(x.t, -1)];
      const j = int(x.j, -1);
      if (t && t.permissions[j]) t.permissions[j] = { text: words, root, g, was: t.permissions[j].text };
    } else if (x.k === "ability" && text(x.name, 60)) {
      const a = c.archetypes[int(x.a, -1)];
      if (a && !a.have.includes(text(x.name, 60)) && a.have.length < MAX_ABILITIES) a.have.push(text(x.name, 60));
    } else if (x.k === "awk" && text(x.name, 80)) {
      const a = c.attuned[int(x.a, 0)];
      if (!a) continue;
      a.awakenings.push({ ...awkOf({ name: x.name, root: x.root, text: text(x.text, 300) }), g });
      if (text(x.catch)) a.catch = text(x.catch, 60);
      if (text(x.burden)) a.burden = text(x.burden, 60);
    } else if (x.k === "stage") {
      const a = c.attuned[int(x.a, 0)];
      if (!a) continue;
      if (STAGES.includes(x.to) && STAGES.indexOf(x.to) > STAGES.indexOf(a.stage)) a.stage = x.to;
      if (text(x.catch)) a.catch = text(x.catch, 60);
      if (text(x.burden)) a.burden = text(x.burden, 60);
    } else if (x.k === "thread" && words && text(x.person, 40)) {
      const person = text(x.person, 40);
      const t = { text: words, kind: x.kind === "hostile" ? "hostile" : "bond", whose: null, strained: false, g };
      t.note = t.kind;
      const p = c.threads.find((y) => specKey(y.person) === specKey(person));
      if (p) p.threads.push(t);
      else c.threads.push({ person, threads: [t] });
    } else if (x.k === "title" && words && (root || (x.roots && typeof x.roots === "object"))) {
      const p = x.perm && typeof x.perm === "object" ? x.perm : null;
      const perm = p && text(p.text, 120) && ROOTS.includes(p.root) ? [{ text: text(p.text, 120), root: p.root, g }] : [];
      // A Title grown spread 3 was grown on stacking, whatever the sheet's on.
      c.titles.push({ ...titleOf({ text: words, ...(x.roots && typeof x.roots === "object" ? { roots: x.roots } : { root }), permissions: perm, boons: [] }, B, false), g });
    } else if (x.k === "arch" && text(x.arch, 24)) {
      const name = text(x.arch, 24);
      const rule = ARCH.get(name);
      c.archetypes.push({ ...archOf({ name, id: rule?.id ?? null, ...(Array.isArray(x.have) ? { have: x.have } : {}) }, B), g });
    } else if (x.k === "attune" && text(x.name, 80)) {
      const awk = x.awk && typeof x.awk === "object" && text(x.awk.name, 80) ? [{ ...awkOf({ name: x.awk.name, root: x.awk.root, text: text(x.awk.text, 300) }), g }] : [];
      c.attuned.push({ name: text(x.name, 80), props: null, stage: "Awakened", catch: null, burden: null, awakenings: awk, g });
    }
  }
  return c;
}

// What moving onto the new core (or stacking, before it) left for the player
// to choose, the first of them first:
//   { k: "arch", a, name }        archetype a, gone from the book, to swap
//   { k: "spread", t, root }      Title t, all 5 on root, to spread how they like
//   { k: "five", t, was }         Title t's 3 made 5 the way they were spread, to check
//   { k: "lock", a, name, root }  an awakening with no Root, guessed as root, to check
//   { k: "points", left }         points they've got left to spend
export function choicesOf(c) {
  const out = [];
  // An archetype the book hasn't got any more, once however many times it's taken.
  (c.archetypes ?? []).forEach((a, i) => {
    if (a.gone && !out.some((x) => x.name === a.name)) out.push({ k: "arch", a: i, name: a.name });
  });
  (c.titles ?? []).forEach((t, i) => {
    if (t.fromRoot) out.push({ k: "spread", t: i, root: t.fromRoot });
    else if (t.fromThree) out.push({ k: "five", t: i, was: t.fromThree });
  });
  (c.attuned ?? []).forEach((a, i) => {
    for (const w of a.awakenings ?? []) if (w.guessed) out.push({ k: "lock", a: i, name: w.name, root: w.root });
  });
  const left = int(c.points?.start, 0) - int(c.points?.spent, 0);
  if (c.points && left > 0) out.push({ k: "points", left });
  return out;
}
const sameChoice = (x, y) => x?.k === y.k && (y.k !== "spread" && y.k !== "five" ? true : x.t === y.t) && (y.k !== "arch" || x.name === y.name) && (y.k !== "lock" || (x.a === y.a && x.name === y.name));

// ---------------------------------------------------------------- Boons

// A Boon takes two permission slots on its Title (Boons and Burdens, in
// Building Your Character), so a Title's six slots are its permissions and
// two for each Boon. What a Boon does comes from the book's table by its
// lever, and the player's own name for it and what it's on (a piece of
// armour, a condition, climbing) are theirs. A Boon's never steps on a roll.
export const BOON_SLOTS = 2;
export const slotsOf = (t) => (t?.permissions?.length ?? 0) + BOON_SLOTS * (t?.boons?.length ?? 0);
export function boonOf(x, B = null) {
  const lever = text(x?.lever, 40);
  const rule = (B?.boons ?? []).find((b) => b.lever === lever);
  const out = { lever, name: text(x?.name, 40), text: rule?.text ?? text(x?.text, 200), on: text(x?.on, 60) };
  if (x?.g != null) out.g = x.g;
  return out;
}
export const boonsOf = (c) => (c?.titles ?? []).flatMap((t) => t.boons ?? []);
export const boonCount = (c, lever) => boonsOf(c).filter((b) => b.lever === lever).length;
// What goes on the sheet itself: Aura's maximum (5, and 2 for each Aura
// Boon), the stride's 2 more for each Stride Boon, a piece of armour gets a
// box, and Kit's an item more. The rest of the Boons work in play, or are the
// player's to remember, like Getting around.
export function withBoons(c) {
  const n = c.numbers ?? (c.numbers = {});
  const said = (lever) => {
    const list = boonsOf(c).filter((b) => b.lever === lever);
    return list.length ? list.map((b) => b.name || `the ${b.lever} Boon`).join(", ") : null;
  };
  const aura = boonCount(c, "Aura");
  n.aura = BASE_AURA + 2 * aura;
  if (aura) n.auraNote = said("Aura");
  const stride = boonCount(c, "Stride");
  if (stride) {
    n.stride = int(n.stride, 3) + 2 * stride;
    n.strideNote = [n.strideNote, said("Stride")].filter(Boolean).join(", ");
  }
  n.kit = boonCount(c, "Kit");
  // One piece has one more box for each Armour Boon: the one it names, or
  // the first piece they've got.
  for (const b of boonsOf(c).filter((x) => x.lever === "Armour")) {
    const piece = c.armour.find((a) => specKey(a.name) === specKey(b.on)) ?? c.armour.find((a) => !b.on || specKey(a.name).includes(specKey(b.on))) ?? c.armour[0];
    if (piece) piece.boxes = Math.min(6, (piece.boxes ?? 1) + 1);
  }
  return c;
}
// What a Boon's called on the sheet: the player's name for it, or the lever.
export const boonSaid = (c, lever) => boonsOf(c).find((b) => b.lever === lever)?.name || `your ${lever} Boon`;
// A condition the Conditions Boon says can't touch them.
export const shrugs = (c, name) => boonsOf(c).some((b) => b.lever === "Conditions" && b.on && specKey(b.on) === specKey(name));
// Going beyond's free once a scene with the Going beyond Boon, and 1 Aura after.
export const freeBeyond = (c, s) => boonCount(c, "Going beyond") > 0 && s.beyond !== true;
// What each Root's roll gets at the end of a scene: 2 for each Recovery Boon.
export const restBonus = (c) => REST_BOON * boonCount(c, "Recovery");

export const bestRoot = (c) => [...ROOTS].sort((a, b) => (c.roots?.[b] ?? 0) - (c.roots?.[a] ?? 0))[0];

// Each archetype once, how many times it's taken, its Trait and the
// abilities they've got of it, each with its price in Aura, from the book.
// Push is +2, and a point more each time the same archetype's taken again.
export function archetypesOf(c, B) {
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  const out = [];
  for (const a of c.archetypes) {
    const had = out.find((x) => x.name === a.name);
    if (had) {
      had.times += 1;
      for (const h of a.have ?? []) if (!had.have.includes(h)) had.have.push(h);
      continue;
    }
    // The book's, or what the sheet carries when there's no book to hand.
    const rule = ARCH.get(a.name) ?? a;
    const abilities = rule.abilities ?? a.abilities ?? [];
    out.push({ name: a.name, id: a.id ?? rule.id ?? null, home: trackKey(a.home ?? rule.home) ?? "stamina", times: 1, summary: rule.summary ?? "", for: rule.for ?? "", trait: traitOf(rule.trait ?? a.trait), have: [...(a.have ?? abilities.map((x) => x.name))], abilities });
  }
  for (const a of out) {
    const push = a.times + 1;
    a.abilities = a.abilities.filter((x) => a.have.includes(x.name)).slice(0, MAX_ABILITIES).map((x) => {
      const isPush = /^Push$/i.test(x.name);
      const said = (s) => (isPush && a.times > 1 ? String(s).replace(/\+2\b/, `+${push}`) : s);
      return { name: x.name, text: said(x.text), html: said(x.html ?? x.text), push: isPush ? push : 0, cost: Math.max(1, int(x.cost, 1)) };
    });
  }
  return out;
}

// ---------------------------------------------------------------- state

// A new character's state: every Root full, nothing wounded, no Toll, and
// Aura full.
export function freshCore(c) {
  const s = {
    v: 4, aura: int(c.numbers?.aura, BASE_AURA), acting: false,
    pts: zero(), wound: { Body: false, Mind: false, Soul: false }, toll: 0,
    scars: { Body: [], Mind: [], Soul: [] },
    blaze: null, out: false, dead: false,
    conditions: [], threads: {}, crossed: {}, boxes: {}, picked: [],
    asp: even(c.aspiration?.die ?? 2, 2, 12), aspText: "", notes: "", last: null, grown: [], choose: [],
  };
  for (const r of ROOTS) s.pts[r] = capOf(c, s, r);
  return s;
}

// The Root a track was on, for a state from before the new core.
const TRACK_ROOT = { stamina: "Body", confidence: "Mind", resolve: "Soul" };

// Fill in anything missing and keep every number inside what the sheet
// allows now, in case the rules changed since this was saved. A state from
// before the new core moves onto it here (a v3 one from stacking, and one
// from Roots or from before Roots on its way through normalRoots()): they
// keep everything they've got, the tracks go, every Root's full, a track's
// Scars go on its Root, Aura's inside the new maximum, and nothing's powered
// or bought any more. core is there till they've seen it, and choose is
// what's theirs to choose (choicesOf). c is the sheet as rootsSheet() makes
// it, so each Title's 3 is 5 already.
export function normalCore(raw, c) {
  let r = raw && typeof raw === "object" ? JSON.parse(JSON.stringify(raw)) : {};
  const blank = !Object.keys(r).length;
  if (isOldState(r)) r = fromOld(r, c);
  const moving = !blank && r.v !== 4;
  if (moving && r.v !== 3) r = normalRoots(r, c);
  const s = Object.assign(freshCore(c), r);
  s.v = 4;
  if (moving) {
    // A track's Scars are Scars on its Root now, each locking a point, and a
    // Blaze waiting on a track is a Scar waiting on its Root.
    const old = obj(r.scars);
    s.scars = { Body: [], Mind: [], Soul: [] };
    for (const [t, root] of Object.entries(TRACK_ROOT)) s.scars[root] = (Array.isArray(old[t]) ? old[t] : Array.isArray(old[root]) ? old[root] : []).map((x) => text(x));
    s.blaze = TRACK_ROOT[r.blaze] ?? null;
    s.wound = { Body: false, Mind: false, Soul: false };
    s.toll = 0;
    s.pts = zero();
    for (const root of ROOTS) s.pts[root] = capOf(c, s, root);
    s.acting = false;
    s.core = true;
    s.choose = choicesOf(c);
  }
  for (const k of ["tracks", "power", "store", "bought", "stacked", "used", "shrugged"]) delete s[k];
  s.acting = Boolean(s.acting);
  // Past the maximum only while acting, or by the 1 In your element gave at
  // the start of the scene, till they've finished acting.
  s.aura = clamp(s.aura, 0, s.acting ? 99 : auraMax(c, s) + (s.elem === true ? 1 : 0));
  const scars = obj(s.scars);
  const wound = obj(s.wound);
  s.scars = {};
  s.wound = {};
  for (const root of ROOTS) {
    s.scars[root] = (Array.isArray(scars[root]) ? scars[root] : []).slice(0, 40).map((x) => text(x));
    s.wound[root] = wound[root] === true;
  }
  const pts = obj(s.pts);
  s.pts = {};
  for (const root of ROOTS) s.pts[root] = clamp(pts[root] ?? capOf(c, s, root), 0, capOf(c, s, root));
  s.toll = clamp(s.toll, 0, 99);
  s.blaze = ROOTS.includes(s.blaze) ? s.blaze : null;
  s.out = Boolean(s.out);
  if (!s.out) delete s.out;
  s.dead = Boolean(s.dead);
  s.asp = even(s.asp, 2, 12);
  s.conditions = (Array.isArray(s.conditions) ? s.conditions : []).filter((x) => x && x.name).map((x) => ({ name: text(x.name, 40), die: even(x.die, 2, 12), kind: x.kind === "for" ? "for" : "against" }));
  s.picked = (Array.isArray(s.picked) ? s.picked : []).filter((p) => p && p.name && ["equipment", "utility", "bag"].includes(p.where));
  for (const key of ["threads", "crossed", "boxes"]) if (!s[key] || typeof s[key] !== "object" || Array.isArray(s[key])) s[key] = {};
  for (const [k, v] of Object.entries(s.threads)) if (!["strained", "snapped", "whole"].includes(v)) delete s.threads[k];
  s.grown = (Array.isArray(s.grown) ? s.grown : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  s.before = (Array.isArray(s.before) ? s.before : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  if (!s.before.length) delete s.before;
  if (!s.moved) delete s.moved;
  if (s.core !== true) delete s.core;
  // After the move, a choice goes once it's made, or once it doesn't apply
  // any more (their build's spread that Title, or spent the points).
  if (!moving) {
    const now = choicesOf(c);
    s.choose = (Array.isArray(s.choose) ? s.choose : []).map((x) => now.find((y) => sameChoice(x, y))).filter(Boolean);
  }
  if (s.seen && typeof s.seen !== "object") delete s.seen;
  // What a scene's used up: the Toughness Boon's free hits, the Going
  // beyond Boon's free go and In your element's Aura, cleared by a new scene.
  s.tough = clamp(s.tough, 0, 9);
  if (!s.tough) delete s.tough;
  if (s.beyond !== true) delete s.beyond;
  if (s.elem !== true) delete s.elem;
  // A Shadow's pool: the dice they rolled getting into hiding, there to add
  // to a roll later, one die at a time.
  s.pool = (Array.isArray(s.pool) ? s.pool : []).map((d) => even(d, 2, 12)).slice(0, 12);
  if (!s.pool.length) delete s.pool;
  return s;
}

// ---------------------------------------------------------------- a Root's points

// Every awakening on the sheet, with a key that lasts a reload (the same as
// its key in thingsOf), the Root it locks, and whether it works: an
// awakening needs a point of its Root to lock, and Scars lock theirs first,
// so one on a Root with nothing left to lock does nothing till it has.
export function awakeningsOf(c, s = {}) {
  const out = [];
  const seen = new Map();
  const room = Object.fromEntries(ROOTS.map((r) => [r, Math.max(0, (c.roots?.[r] ?? 0) - (s.scars?.[r]?.length ?? 0))]));
  (c.attuned ?? []).forEach((a, i) => {
    for (const w of a.awakenings ?? []) {
      const base = `awk|${i}|${w.name}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const root = ROOTS.includes(w.root) ? w.root : null;
      const works = Boolean(root && room[root] > 0);
      if (works) room[root] -= 1;
      out.push({ key: n > 1 ? `${base}|${n}` : base, a: i, thing: a.name, name: w.name, text: w.text ?? "", root, works });
    }
  });
  return out;
}
// What's locked on each Root: a point for each Scar, then a point for each
// awakening that works, never more than the Root.
export function lockedOf(c, s = {}) {
  const out = zero();
  for (const r of ROOTS) out[r] = Math.min(c.roots?.[r] ?? 0, s.scars?.[r]?.length ?? 0);
  for (const w of awakeningsOf(c, s)) if (w.works) out[w.root] += 1;
  return out;
}
// What a Root can hold: the Root less what's locked, and half that, rounded
// up, while it's wounded.
export function capOf(c, s, root) {
  const room = Math.max(0, (c.roots?.[root] ?? 0) - lockedOf(c, s)[root]);
  return s?.wound?.[root] ? Math.ceil(room / 2) : room;
}

// Spending points: pushing never hurts you, because you can't spend points
// you haven't got. Down to 0 only leaves you exposed.
export function spendPts(s, root, n = 1) {
  if (!ROOTS.includes(root) || n < 1 || (s.pts?.[root] ?? 0) < n) return false;
  s.pts[root] -= n;
  return true;
}

// n hits at a Root. Each takes a point, and damage carries past 0: a hit on
// it at 0 wounds it, and a hit on it wounded at 0 is a Scar, waiting for its
// Catch (s.blaze), and they're leaving the scene, so the rest do nothing.
// Taken on another Root (on), each hit's 2 points, all of them or none, and
// only if that Root's got them. It says what happened:
//   { root, on, lost, wound, scar, ok }
// ok is false when they asked to take it on another Root that hasn't got the
// points, and then nothing changed.
export function takeHits(c, s, root, n = 1, { on = null } = {}) {
  const hits = Math.max(0, int(n, 0));
  const out = { root, on: null, lost: 0, wound: false, scar: false, ok: true };
  if (!ROOTS.includes(root) || !hits || s.blaze) return out;
  if (on && on !== root && ROOTS.includes(on)) {
    if ((s.pts?.[on] ?? 0) < 2 * hits) return { ...out, ok: false };
    s.pts[on] -= 2 * hits;
    return { ...out, on, lost: 2 * hits };
  }
  for (let i = 0; i < hits; i++) {
    if (s.pts[root] > 0) {
      s.pts[root] -= 1;
      out.lost += 1;
    } else if (!s.wound[root]) {
      s.wound[root] = true;
      out.wound = true;
    } else {
      out.scar = true;
      s.blaze = root;
      break;
    }
  }
  return out;
}
// The Blaze: while a Root's wounded, they can take the Scar on purpose, do
// something big, and leave. It waits for its Catch the same way.
export const canBlaze = (s, root) => Boolean(s.wound?.[root]) && !s.blaze && !s.out;
export function blazeOn(s, root) {
  if (!canBlaze(s, root)) return false;
  s.blaze = root;
  return true;
}
// A Scar that would lock the last point of a Root the Scars haven't locked
// yet is the last one: they die or retire, the player's call. A Root at 0
// has no point for a Scar to lock.
export const lastScar = (c, s, root) => (c.roots?.[root] ?? 0) > 0 && (s.scars?.[root]?.length ?? 0) + 1 >= (c.roots?.[root] ?? 0);
// The Scar written: a Catch in the player's words on that Root, locking a
// point for good, and they leave the scene.
export function takeScar(c, s, root, catchText) {
  if (!ROOTS.includes(root)) return false;
  const last = lastScar(c, s, root);
  s.scars[root].push(text(catchText));
  s.blaze = null;
  s.out = true;
  s.pts[root] = Math.min(s.pts[root], capOf(c, s, root));
  return { last };
}

// A heal: what was rolled, and any flat bonus (bonus), less 5 for each Toll
// they've got already, never below 0. ease is how many steps of Toll the
// healer ignores (a prepared healer's Trait or attunement). It goes where
// spread says ({ Body, Mind, Soul }), or where there's most room when spread
// is null, never past what a Root can hold (half while it's wounded), and
// what won't fit is lost. A heal from someone or something else (other) adds
// 1 Toll once it's done. The amount never gives Aura.
export function healBy(c, s, rolled, spread = null, { other = false, ease = 0, bonus = 0 } = {}) {
  const toll = Math.max(0, int(s.toll, 0) - Math.max(0, int(ease, 0)));
  const amount = Math.max(0, int(rolled, 0) + Math.max(0, int(bonus, 0)) - TOLL_STEP * toll);
  const room = Object.fromEntries(ROOTS.map((r) => [r, Math.max(0, capOf(c, s, r) - (s.pts?.[r] ?? 0))]));
  const want = spread && typeof spread === "object" ? spread : Object.fromEntries(ROOTS.map((r) => [r, Infinity]));
  const order = spread && typeof spread === "object" ? ROOTS : [...ROOTS].sort((a, b) => room[b] - room[a]);
  const healed = zero();
  let left = amount;
  for (const r of order) {
    const give = Math.min(room[r], Math.max(0, Number(want[r]) || 0), left);
    s.pts[r] += give;
    healed[r] = give;
    left -= give;
  }
  if (other) s.toll = int(s.toll, 0) + 1;
  return { amount, healed, lost: left, toll: int(s.toll, 0) };
}

// The Roots that roll at the end of a scene: the ones below what they can
// hold that have dice to roll.
export const restOf = (c, s) => ROOTS.filter((r) => (c.roots?.[r] ?? 0) > 0 && (s.pts?.[r] ?? 0) < capOf(c, s, r));
// The end of a scene: each Root gets back what it rolled (rolls is
// { Body, Mind, Soul }, each Root's dice unsplit added up), and 2 more for
// each Recovery Boon, up to what it can hold, Toll drops by 1, and anyone
// who left the scene is back for the next.
export function sceneEnd(c, s, rolls = {}) {
  const more = restBonus(c);
  const healed = zero();
  for (const r of ROOTS) {
    const roll = Math.max(0, int(rolls?.[r], 0));
    if (!roll) continue;
    const to = Math.min(capOf(c, s, r), (s.pts[r] ?? 0) + roll + more);
    healed[r] = Math.max(0, to - s.pts[r]);
    s.pts[r] = Math.max(s.pts[r], to);
  }
  s.toll = Math.max(0, int(s.toll, 0) - 1);
  delete s.out;
  return { healed, toll: s.toll };
}
// Downtime puts everything back: wounds and Toll clear, and every Root's
// full. Scars stay.
export function downtimeRest(c, s) {
  s.wound = { Body: false, Mind: false, Soul: false };
  s.toll = 0;
  for (const r of ROOTS) s.pts[r] = capOf(c, s, r);
  delete s.out;
  return s;
}

// ---------------------------------------------------------------- Aura

// Aura's maximum: the sheet's, 5 and 2 for each Aura Boon. Nothing's
// powered any more, so nothing comes off it.
export const auraMax = (c, s) => Math.max(0, int(c.numbers?.aura, BASE_AURA) - poweredOf(s));

// Aura coming in. While you're acting it can go past your maximum, and
// what's over is gone once you've finished. Otherwise it stops at your
// maximum, and the rest can go to a friend in the scene. It says how many
// went over.
export function gainAura(s, c, n = 1) {
  const max = auraMax(c, s);
  if (n <= 0) return 0;
  if (s.acting) {
    s.aura += n;
    return 0;
  }
  const room = Math.max(0, max - s.aura);
  s.aura += Math.min(room, n);
  return Math.max(0, n - room);
}
// Finished acting: anything over the maximum's gone.
export function doneActing(s, c) {
  const max = auraMax(c, s);
  const over = Math.max(0, s.aura - max);
  s.aura = Math.min(s.aura, max);
  s.acting = false;
  delete s.bought;
  return over;
}
// What a die pays when it lands: 1 if it won, and 1 for its top face. A die
// something was added to after the roll (a Push, a flip, a tie bought) pays
// nothing more, so this is only ever counted as it lands. A heal's top faces
// pay, and the amount it heals never does.
export const paysOf = (nat, size, won) => (won ? 1 : 0) + (nat === size ? 1 : 0);

// ---------------------------------------------------------------- attunement

// What an attuned thing can hold at its stage, from Three stages: Awakened 1
// and 1 more with a Catch, Tempered 2 and 2 more with a Burden, Perfected 3
// and 3 more with a Burden and a Catch.
export function attunedRoom(a) {
  const stage = STAGES.includes(a.stage) ? a.stage : "Awakened";
  const base = STAGES.indexOf(stage) + 1;
  const needs = stage === "Awakened" ? ["catch"] : stage === "Tempered" ? ["burden"] : ["burden", "catch"];
  const n = a.awakenings.length;
  return { stage, base, all: base * 2, needs, missing: needs.filter((x) => !a[x]), next: STAGES[STAGES.indexOf(stage) + 1] ?? null, n, free: Math.max(0, base - n), more: Math.max(0, base * 2 - Math.max(n, base)) };
}

// ---------------------------------------------------------------- what you carry

// Everything they carry and haven't crossed out, what they've picked up, and
// their attuned things, which can't break. Two of the same have a key each,
// the second's ending in |2, so either can be crossed out on its own.
export function itemsOf(c, s = {}) {
  const out = [];
  const seen = new Map();
  const add = (where, name) => {
    if (!name) return;
    const base = `${where}|${name}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const key = n > 1 ? `${base}|${n}` : base;
    if (s.crossed?.[key]) return;
    out.push({ key, where, name });
  };
  for (const x of c.carry?.equipment ?? []) add("equipment", x);
  for (const x of c.carry?.utility ?? []) add("utility", x);
  if (c.carry?.keepsake) add("keepsake", c.carry.keepsake);
  for (const x of c.carry?.bag?.items ?? []) add("bag", x);
  for (const p of s.picked ?? []) add(p.where, p.name);
  c.attuned.forEach((a, i) => out.push({ key: `attuned|${i}`, where: "attuned", name: a.name, a: i }));
  return out;
}

// ---------------------------------------------------------------- what's on the sheet

// Everything on the sheet, each with a key that lasts a save and a reload:
//   title|i              Title i
//   perm|i|j             permission j on Title i
//   arch|i               archetype i (one taken twice is two things)
//   ability|i|<name>     an ability archetype i's got
//   attuned|i            attuned thing i
//   awk|i|<name>         an awakening on attuned thing i
//   <where>|<name>       an item, by its itemsOf() key
// Two of the same never share a key: the second's ends in |2. root is the
// Root it's on (a permission, an awakening's lock, or a piece of armour), or
// the Root a Title puts most on, and null for the rest. On the new core
// only permissions and awakenings do anything on a roll: a permission
// justifies bringing a Root in, and an awakening's steps.
export function thingsOf(c, s = {}) {
  const out = [];
  const seen = new Map();
  const add = (key, kind, name, root = null, more = {}) => {
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    out.push({ key: n > 1 ? `${key}|${n}` : key, kind, name, root, ...more });
  };
  (c.titles ?? []).forEach((t, i) => {
    add(`title|${i}`, "title", t.text ?? t.name, mostOf(t.roots ?? {}) || null);
    (t.permissions ?? []).forEach((p, j) => add(`perm|${i}|${j}`, "perm", p.text, ROOTS.includes(p.root) ? p.root : null, { t: i }));
  });
  (c.archetypes ?? []).forEach((a, i) => {
    add(`arch|${i}`, "arch", a.name, null);
    for (const name of a.have ?? []) add(`ability|${i}|${name}`, "ability", name, null, { arch: i });
  });
  (c.attuned ?? []).forEach((a, i) => {
    add(`attuned|${i}`, "attuned", a.name, null, { a: i });
    for (const w of a.awakenings ?? []) add(`awk|${i}|${w.name}`, "awk", w.name, ROOTS.includes(w.root) ? w.root : null, { a: i, passive: false });
  });
  for (const x of itemsOf(c, s)) {
    if (x.where === "attuned") continue;
    const piece = x.where === "equipment" ? (c.armour ?? []).find((a) => a.name === x.name) : null;
    add(x.key, "item", x.name, piece ? piece.root : null, { where: x.where });
  }
  return out;
}

// ---------------------------------------------------------------- a roll

// Count a roll on the new core: the Root, at full whatever it's got left,
// each Root brought in (bring), at full too, and 2 for each awakening that
// fits (awk) and 2 more for each Aura spent on it. r is:
//   { root, bring: [{ root, perm, pay }], awk: [{ key, aura }], dice,
//     against, aim, conds: [name], pool: [{ i, die }], plus }
// A Root's brought in on a permission that justifies it (perm, a key off the
// sheet or a friend's words, a borrowed one or a truth), and paid with 1
// point from it (pay "pt") or 3 Aura (pay "aura"), each on its own, never
// the roll's own Root and never one twice. conds are the conditions on them
// that count, 1 step more for each for them and 1 less for each against.
// pool is a Shadow's pool dice, each as steps (a d8 is 4) or its own die.
// plus is steps the rules hand them from somewhere else, a Leader's or a
// Bloodsworn's. dice is how the player split it, any way at all, and if it
// isn't their steps, it's the table's. Every roll's at least 1 step, a d2.
// It hands back what it costs (points by Root and Aura), and short says what
// they can't pay for or what isn't allowed, so ok is when there's nothing.
export function countRoll(c, s, r) {
  const root = ROOTS.includes(r?.root) ? r.root : null;
  const rootN = root ? c.roots?.[root] ?? 0 : 0;
  const short = [];
  if (!root) short.push("no Root");
  // Roots brought in.
  const points = zero();
  let aura = 0;
  const brought = [];
  for (const b of Array.isArray(r?.bring) ? r.bring : []) {
    if (!b || !ROOTS.includes(b.root) || b.root === root || brought.some((x) => x.root === b.root)) continue;
    const perm = text(b.perm, 160);
    if (!perm) {
      short.push(`a permission to bring in ${b.root}`);
      continue;
    }
    const pay = b.pay === "aura" ? "aura" : "pt";
    if (pay === "aura") aura += BRING_AURA;
    else points[b.root] += BRING_PTS;
    brought.push({ root: b.root, perm, pay, steps: c.roots?.[b.root] ?? 0 });
  }
  // Awakenings: 2 steps each, and 2 more for each Aura on it.
  const working = new Map(awakeningsOf(c, s).filter((w) => w.works).map((w) => [w.key, w]));
  const awk = [];
  for (const x of Array.isArray(r?.awk) ? r.awk : []) {
    const w = working.get(x?.key);
    if (!w || awk.some((y) => y.key === w.key)) continue;
    const more = Math.max(0, int(x.aura, 0));
    aura += more;
    awk.push({ key: w.key, name: w.name, root: w.root, aura: more, steps: AWK_STEPS * (1 + more) });
  }
  const conds = (s.conditions ?? []).filter((x) => (r?.conds ?? []).includes(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  // A Shadow's pool dice, each one as steps (a d8 is 4) or as its own die.
  const taken = new Set();
  const pool = (r?.pool ?? []).filter((x) => Number.isInteger(x?.i) && s.pool?.[x.i] && !taken.has(x.i) && taken.add(x.i)).map((x) => ({ i: x.i, size: s.pool[x.i], die: Boolean(x.die) }));
  const poolSteps = pool.filter((x) => !x.die).reduce((t, x) => t + x.size / 2, 0);
  const plus = clamp(r?.plus ?? r?.handed ?? 0, 0, 60);
  const total = Math.max(1, rootN + brought.reduce((t, b) => t + b.steps, 0) + awk.reduce((t, w) => t + w.steps, 0) + conds + poolSteps + plus);
  // Their split, if it's their steps, or the table's.
  const theirs = Array.isArray(r?.dice) && r.dice.length && r.dice.every((d) => SIZES.includes(d)) && r.dice.reduce((t, d) => t + d / 2, 0) === total ? [...r.dice] : null;
  const poolDice = pool.filter((x) => x.die).map((x) => x.size);
  // What they can't pay for.
  for (const x of ROOTS) if (points[x] > (s.pts?.[x] ?? 0)) short.push(`${points[x]} ${points[x] === 1 ? "point" : "points"} of ${x}`);
  if (aura > (s.aura ?? 0)) short.push(`${aura} Aura`);
  return {
    root, rootN, brought, awk, conds, pool, poolDice, plus, total, points, aura, short, ok: !short.length,
    split: Boolean(theirs), dice: [...(theirs ?? stepsToDice(total)), ...poolDice],
    // For the screens that haven't moved: nothing's counted off the sheet,
    // there are no extra actions and splitting has no limit.
    using: [], cases: [], extras: [], friends: 0, other: 0, borrowed: 0, bought: 0, price: 0, free: false, splits: Math.max(0, total - 1),
  };
}
// Pay for a roll countRoll() counted: its points off their Roots and its
// Aura, all of it or none.
export function payFor(c, s, k) {
  if (!k?.ok) return false;
  for (const r of ROOTS) if ((k.points?.[r] ?? 0) > (s.pts?.[r] ?? 0)) return false;
  if ((k.aura ?? 0) > (s.aura ?? 0)) return false;
  for (const r of ROOTS) s.pts[r] -= k.points?.[r] ?? 0;
  s.aura -= k.aura ?? 0;
  return true;
}

// ---------------------------------------------------------------- for the screens that haven't moved

// Everything below is the game on stacking (14 Nov), on a v3 state with
// tracks, kept only for the screens prompts 4 to 6 of notes/core-plan.md
// haven't moved onto the new core yet. Nothing on the new core uses it, and
// prompt 7 takes it out.

export const TRACKS = ["stamina", "confidence", "resolve"];
export const TRACK = {
  stamina: { name: "Stamina", root: "Body" },
  confidence: { name: "Confidence", root: "Mind" },
  resolve: { name: "Resolve", root: "Soul" },
};
export const trackAt = { Body: "stamina", Mind: "confidence", Soul: "resolve" };
export const trackKey = (name) => ({ Stamina: "stamina", Confidence: "confidence", Resolve: "resolve" })[name] ?? null;
export const MAX_SCARS = 5;
export const RECOVER = 6;
export const HOLDS = 2;
export const EXTRA_AURA = 3;
export const extraCost = (n = 0) => EXTRA_AURA + Math.max(0, int(n, 0));
export const restsOn = (c) => (boonCount(c, "Recovery") ? 3 : 4);

export function freshRoots(c) {
  const n = c.numbers ?? {};
  const start = (t) => even(n[t]?.die ?? 12, 2, 12);
  return {
    v: 3, aura: int(n.aura, BASE_AURA), acting: false,
    tracks: { stamina: start("stamina"), confidence: start("confidence"), resolve: start("resolve") },
    scars: { stamina: [], confidence: [], resolve: [] },
    blaze: null, dead: false, power: {},
    conditions: [], threads: {}, crossed: {}, boxes: {}, picked: [],
    asp: even(c.aspiration?.die ?? 2, 2, 12), aspText: "", notes: "", last: null, grown: [], choose: [],
  };
}

// A character saved before Roots, moving onto it: what still means the same
// comes with them (their threads, their Aspiration, what's crossed out or
// ticked, what they picked up, their notes, the live table), every track
// starts at d12 and Aura's full. The Scars on the old wound die were Catches
// from blows, so they're Scars on Stamina, and so on Body once normalCore()
// moves them on. What they grew in downtime waits in before, for the player
// to put back on the new sheet, and the even older Hurt track's Catches go
// into their notes. It's a state from Roots (v2).
export function fromOld(raw, c) {
  const s = freshRoots(c);
  for (const k of ["conditions", "threads", "crossed", "boxes", "picked", "aspText", "notes", "tele", "dead"]) if (raw[k] != null) s[k] = raw[k];
  if (Number.isFinite(Number(raw.asp))) s.asp = even(raw.asp, 2, 12);
  const scars = Array.isArray(raw.scars) ? raw.scars.map((x) => text(x)) : Array.from({ length: clamp(raw.scars, 0, MAX_SCARS) }, () => "");
  s.scars.stamina = scars.slice(0, MAX_SCARS);
  s.tracks.stamina = Math.max(s.tracks.stamina, lowOf(s, "stamina"));
  if (raw.blaze === true && !raw.dead) s.blaze = "stamina";
  const catches = (Array.isArray(raw.catches) ? raw.catches : []).map((x) => text(x)).filter(Boolean);
  if (catches.length) s.notes = `${text(s.notes, 4000)}${text(s.notes, 4000) ? "\n" : ""}From the old Hurt track: ${catches.join(", ")}.`;
  const old = (Array.isArray(raw.grown) ? raw.grown : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  // A thread's a thread on both, so it comes straight across.
  s.grown = old.filter((g) => g.k === "thread").map((g) => ({ k: "thread", person: g.person, text: g.text, kind: g.kind }));
  s.before = old.filter((g) => g.k !== "thread").map((g, i) => ({ ...g, n: i }));
  s.moved = true;
  s.v = 2;
  return s;
}

// A v3 state on stacking, for the screens that haven't moved: anything from
// before stacking (v2) comes across onto it the way it did, the Aura held in
// a passive awakening powering it, and what's theirs to choose flagged.
export function normalRoots(raw, c) {
  const r = raw && typeof raw === "object" ? raw : {};
  const moving = r.v !== 3;
  const s = Object.assign(freshRoots(c), r);
  s.v = 3;
  s.acting = Boolean(s.acting);
  const power = obj(s.power);
  const store = obj(s.store);
  s.power = {};
  for (const w of passivesOf(c)) {
    const v = clamp(int(power[w.key], 0) + int(store[w.key], 0), 0, w.holds);
    if (v) s.power[w.key] = v;
  }
  delete s.store;
  s.aura = clamp(s.aura, 0, s.acting ? 99 : auraMax(c, s) + (s.elem === true ? 1 : 0));
  s.bought = clamp(s.bought, 0, 99);
  if (!s.bought) delete s.bought;
  const scars = obj(s.scars);
  const tracks = obj(s.tracks);
  s.scars = {};
  s.tracks = {};
  for (const t of TRACKS) {
    s.scars[t] = (Array.isArray(scars[t]) ? scars[t] : []).slice(0, MAX_SCARS).map((x) => text(x));
    s.tracks[t] = even(tracks[t] ?? 12, lowOf(s, t), 12);
  }
  s.blaze = TRACKS.includes(s.blaze) ? s.blaze : null;
  s.dead = Boolean(s.dead);
  s.asp = even(s.asp, 2, 12);
  s.conditions = (Array.isArray(s.conditions) ? s.conditions : []).filter((x) => x && x.name).map((x) => ({ name: text(x.name, 40), die: even(x.die, 2, 12), kind: x.kind === "for" ? "for" : "against" }));
  s.picked = (Array.isArray(s.picked) ? s.picked : []).filter((p) => p && p.name && ["equipment", "utility", "bag"].includes(p.where));
  for (const key of ["threads", "crossed", "boxes"]) if (!s[key] || typeof s[key] !== "object" || Array.isArray(s[key])) s[key] = {};
  for (const [k, v] of Object.entries(s.threads)) if (!["strained", "snapped", "whole"].includes(v)) delete s.threads[k];
  s.grown = (Array.isArray(s.grown) ? s.grown : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  s.before = (Array.isArray(s.before) ? s.before : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  if (!s.before.length) delete s.before;
  if (!s.moved) delete s.moved;
  const now = choicesOf(c);
  if (moving) {
    s.stacked = true;
    s.choose = now;
  } else {
    if (s.stacked !== true) delete s.stacked;
    s.choose = (Array.isArray(s.choose) ? s.choose : []).map((x) => now.find((y) => sameChoice(x, y))).filter(Boolean);
  }
  if (s.seen && typeof s.seen !== "object") delete s.seen;
  s.tough = clamp(s.tough, 0, 9);
  if (!s.tough) delete s.tough;
  if (s.beyond !== true) delete s.beyond;
  if (s.elem !== true) delete s.elem;
  s.pool = (Array.isArray(s.pool) ? s.pool : []).map((d) => even(d, 2, 12)).slice(0, 12);
  if (!s.pool.length) delete s.pool;
  delete s.used;
  delete s.shrugged;
  return s;
}

export const lowOf = (s, t) => Math.min(12, 2 + 2 * (s.scars?.[t]?.length ?? 0));
export const roomOf = (s, t) => Math.max(0, (s.tracks[t] - lowOf(s, t)) / 2);
export function hitTrack(s, t, sizes = 1) {
  const from = s.tracks[t];
  for (let i = 0; i < sizes && s.blaze !== t; i++) {
    if (s.tracks[t] > lowOf(s, t)) s.tracks[t] = sizeDown(s.tracks[t]);
    else if (!s.blaze) s.blaze = t;
    else break;
  }
  return { from, to: s.tracks[t], blaze: s.blaze === t };
}
export function payTrack(s, t, n = 1) {
  if (roomOf(s, t) < n) return false;
  for (let i = 0; i < n; i++) s.tracks[t] = sizeDown(s.tracks[t]);
  return true;
}
export function trackUp(s, t, n = 1) {
  const from = s.tracks[t];
  for (let i = 0; i < n; i++) s.tracks[t] = sizeUp(s.tracks[t]);
  return s.tracks[t] - from > 0;
}
export function payWays(s, home, n = 1) {
  const out = [];
  if (roomOf(s, home) >= n) out.push({ [home]: n });
  const [a, b] = TRACKS.filter((t) => t !== home);
  const need = 2 * n;
  for (let x = need; x >= 0; x--) {
    const y = need - x;
    if (roomOf(s, a) >= x && roomOf(s, b) >= y) out.push(Object.fromEntries([[a, x], [b, y]].filter(([, v]) => v)));
  }
  return out;
}
export const twoForOne = (s, t) => payWays(s, t).filter((w) => !(t in w));
export const payLabel = (w) => Object.entries(w).map(([t, v]) => `${v} ${TRACK[t].name}`).join(" and ");
export function payWith(s, w) {
  if (!Object.entries(w).every(([t, v]) => roomOf(s, t) >= v)) return false;
  for (const [t, v] of Object.entries(w)) payTrack(s, t, v);
  return true;
}
export const lastBlaze = (s, t) => (s.scars[t]?.length ?? 0) >= MAX_SCARS;
export function scarOn(s, t, catchText) {
  if (lastBlaze(s, t)) return false;
  s.scars[t].push(text(catchText));
  s.tracks[t] = lowOf(s, t);
  s.blaze = null;
  return true;
}
export const restsOf = (s) => TRACKS.filter((t) => s.tracks[t] < 12 && s.tracks[t] > 2);
export const RESTS_ON = 4;

// Powering a passive awakening is gone: nothing's ever powering anything, so
// these do nothing on the new core.
export const poweredOf = (s) => Object.values(obj(s?.power)).reduce((t, v) => t + Math.max(0, int(v, 0)), 0);
export const passivesOf = () => [];
export const powerUp = () => false;
export function powerOff(s) {
  s.power = {};
}
export const addsToDie = () => false;
export const onDefence = (w) => /\b(telegraphs land|defence|Defend)\b/i.test(w?.text ?? "");
