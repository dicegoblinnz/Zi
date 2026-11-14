// The rules for a character on the phone, shared by the companion, print and
// the checks, with no page in them. Since Mo's 14 Nov rework (stacking,
// notes/stacking-plan.md), a Title puts 3 on your Roots, spread however you
// like, and a permission puts 1 on its Root. A roll's one Root that fits how
// you're doing it, and 1 step for every thing on your sheet that fits what
// you're doing (thingsOf): each Title, permission, archetype, ability,
// attuned thing, awakening and item. Plainly fits is free, and each one you
// have to explain is 1 Aura. The three tracks (Stamina for Body, Confidence
// for Mind and Resolve for Soul) start at d12, drop a size for every hit that
// gets through to their Root, pay for archetype abilities, and are what you
// roll when the telegraphs land. Aura's the one thing you spend: 5, and 2 more
// for each attuned thing, full every scene, 1 back for every die that wins
// and every top face, and past the maximum while you're acting. A passive
// awakening's powered, the Aura coming off what you've got and off your
// maximum till the scene ends. Extra actions cost 3 Aura, then 4, then 5.
//
// A character's state (state.v === 3):
//   { v, aura, acting, bought, power, tracks: { stamina, confidence, resolve },
//     scars: { stamina: [Catch], ... }, blaze, dead, conditions, threads,
//     crossed, boxes, picked, asp, aspText, notes, last, grown, before, moved,
//     stacked, choose, seen, tele, tough, beyond, elem, pool, store }
// power is the Aura powering each passive awakening, by thing and name
// ("0|Long shot"), till the scene ends (powerOff). bought is how many extra
// actions they've bought with Aura since they last finished acting, which
// sets the next one's price. stacked is there till the player's seen that the
// character moved onto stacking, and choose is what that move left for them
// to choose (choicesOf), each one going once it's chosen or no longer
// applies. store is the Aura held before powering came in: it's always empty,
// and only there for the screens that haven't moved off it yet. grown is what
// downtime gave them, in the shapes growRoots() reads, and before is what
// they grew before the Roots change, waiting to be put back.

import { sizeDown, sizeUp, stepsToDice } from "./dice.js";
import { START, costOf } from "./points.js";

export const ROOTS = ["Body", "Mind", "Soul"];
export const TRACKS = ["stamina", "confidence", "resolve"];
export const TRACK = {
  stamina: { name: "Stamina", root: "Body" },
  confidence: { name: "Confidence", root: "Mind" },
  resolve: { name: "Resolve", root: "Soul" },
};
export const trackAt = { Body: "stamina", Mind: "confidence", Soul: "resolve" };
export const trackKey = (name) => ({ Stamina: "stamina", Confidence: "confidence", Resolve: "resolve" })[name] ?? null;
// A Scar locks a track's smallest open size, from d2 up, so five lock all but
// its d12, and the one after that is the last Blaze.
export const MAX_SCARS = 5;
// Downtime's Recover slot puts this many sizes back, spread how you like.
export const RECOVER = 6;
// A passive awakening can be powered with this much Aura, and twice it with
// twice that.
export const HOLDS = 2;
export const MAX_PERMS = 6;
export const MAX_ABILITIES = 6;
export const STAGES = ["Awakened", "Tempered", "Perfected"];
// What a Title puts on your Roots, and Aura's maximum: 5, and 2 more for each
// attuned thing.
export const TITLE_ROOTS = 3;
export const BASE_AURA = 5;
export const ATTUNED_AURA = 2;

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, int(v, lo)));
const even = (v, lo, hi) => clamp(Math.round(int(v, lo) / 2) * 2, lo, hi);
const text = (v, n = 80) => String(v ?? "").trim().slice(0, n);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const specKey = (name) => String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// ---------------------------------------------------------------- the sheet

// A sheet on Roots has Roots, and no set actions. Anything else (a character
// built before 8 Nov 2026) is the old shape.
export const isRootsSheet = (c) => Boolean(c && c.roots && typeof c.roots === "object" && !Array.isArray(c.actions));
// What's saved for a character from before Roots: a wound die, set actions'
// Confidence and Resolve as a number, or the even older Hurt track.
export const isOldState = (raw) => Boolean(raw && typeof raw === "object" && !raw.tracks && (Number.isFinite(Number(raw.wound)) || Number.isFinite(Number(raw.conf)) || typeof raw.resolve === "number" || "hurt" in raw));
// A build from the builder before Roots: set actions and Titles with an archetype each.
export const isOldBuild = (b) => Boolean(b && typeof b === "object" && (Array.isArray(b.actions) || Array.isArray(b.traits) || (Array.isArray(b.titles) && b.titles.some((t) => t && typeof t === "object" && "arch" in t && !("root" in t)))));

// What a Title puts on each Root: its spread, or, for a Title from before
// stacking with one Root, all 3 on that one.
export function spreadOf(t) {
  if (t?.roots && typeof t.roots === "object") return Object.fromEntries(ROOTS.map((r) => [r, clamp(t.roots[r], 0, TITLE_ROOTS)]));
  const out = { Body: 0, Mind: 0, Soul: 0 };
  if (ROOTS.includes(t?.root)) out[t.root] = TITLE_ROOTS;
  return out;
}
// The Root a Title puts most on, the first of them on a tie: where a roll
// with the Title in it is likeliest, and the Root a new permission on it
// starts on.
export const mostOf = (spread) => ROOTS.reduce((best, r) => (spread[r] > (spread[best] ?? 0) ? r : best), "");

// Count the Roots: each Title's spread, and 1 for every permission on its
// Root. Nothing else adds to a Root.
export function countRoots(titles) {
  const roots = { Body: 0, Mind: 0, Soul: 0 };
  for (const t of titles ?? []) {
    const spread = spreadOf(t);
    for (const r of ROOTS) roots[r] += spread[r];
    for (const p of t?.permissions ?? []) if (ROOTS.includes(p?.root)) roots[p.root] += 1;
  }
  return { roots };
}

// A Title on the sheet: its words, its spread and its permissions, each with
// its Root. One from before stacking (a crew sheet or a build with one Root
// and its specialties) reads as all 3 on that Root, and says so (fromRoot),
// for the player to spread how they like, and its specialties go.
function titleOf(t, B) {
  const words = text(t?.text ?? t?.name, 160);
  const spread = spreadOf(t);
  const out = {
    ...t,
    text: words,
    roots: spread,
    permissions: (Array.isArray(t?.permissions) ? t.permissions : []).filter((p) => p && typeof p === "object").map(({ specialty, spec, ...p }) => ({ ...p, root: ROOTS.includes(p.root) ? p.root : "" })),
    boons: (Array.isArray(t?.boons) ? t.boons : []).filter((x) => x && text(x.lever, 40)).map((x) => boonOf(x, B)),
  };
  for (const k of ["name", "root", "specialties", "specs", "fromRoot"]) delete out[k];
  if (!(t?.roots && typeof t.roots === "object") && ROOTS.includes(t?.root)) out.fromRoot = t.root;
  return out;
}

// An archetype on the sheet: the book's own (its home track, what it's for,
// its Trait and its whole list of abilities) with the abilities this
// character's got, the one it came with first. One from before stacking came
// with every ability it had, so it keeps them all. A Trait the book hasn't
// got yet is there with nothing in it. One the book hasn't got at all any
// more, like the Scholar since 14 Nov, is gone, for the player to swap.
const traitOf = (x) => (x && typeof x === "object" ? { name: text(x.name, 60), text: String(x.text ?? x.html ?? ""), short: String(x.short ?? "") } : typeof x === "string" && x ? { name: text(x, 60), text: "" } : { name: "", text: "" });
function archOf(a, B) {
  const rule = (B?.archetypes ?? []).find((x) => x.name === a.name) ?? null;
  const abilities = rule?.abilities ?? (Array.isArray(a.abilities) ? a.abilities : []);
  const have = Array.isArray(a.have) ? a.have : abilities.map((x) => x.name);
  const out = {
    ...a,
    id: a.id ?? rule?.id ?? null,
    home: a.home ?? rule?.home ?? null,
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

// The sheet the phone plays from: the crew's off the chapter, or a build's,
// with what they grew in downtime on top (growRoots), and the attuned thing
// as a list, since an Aspiration can bring another. B is the builder's data
// from the book, for an archetype's home, Trait and abilities. Points are
// what they were made with, before downtime grew them (points.js).
export function rootsSheet(base, grown = [], B = null) {
  if (!base) return null;
  const c = JSON.parse(JSON.stringify(base));
  c.attuned = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  for (const a of c.attuned) {
    a.stage = STAGES.includes(a.stage) ? a.stage : "Awakened";
    a.awakenings = Array.isArray(a.awakenings) ? a.awakenings : [];
    a.catch ??= null;
    a.burden ??= null;
    // An attuned thing gets you no Aura its own way any more.
    delete a.aura;
  }
  c.archetypes = (c.archetypes ?? []).map((a) => archOf(typeof a === "string" ? { name: a, id: null, home: null } : a, B));
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
  c.titles = (c.titles ?? []).filter((t) => t && typeof t === "object").map((t) => titleOf(t, B));
  c.points = { start: int(base.points?.start, START), spent: costOf(c).spent };
  if (Array.isArray(grown) && grown.length) growRoots(c, grown, B);
  withBoons(c);
  c.roots = countRoots(c.titles).roots;
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
//   { k: "awk", a, name, kind, text, catch, burden } an awakening on attuned thing a
//   { k: "stage", a, to, catch, burden }        attuned thing a up a stage
//   { k: "thread", person, text, kind }         a new thread, bond or hostile
//   { k: "title", text, roots, perm }           a new Title, from an Aspiration
//   { k: "arch", arch, have }                   a new archetype, from an Aspiration
//   { k: "attune", name, awk }                  a new attuned thing, from an Aspiration
// From before stacking, a permission said its specialty (spec) and a new
// Title its one Root (root) and specialties (specs): the specialties are gone,
// and that Title reads as all 3 on its Root. An archetype with no have came
// with every ability it had.
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
      a.awakenings.push({ name: text(x.name, 80), kind: x.kind === "active" ? "active" : "passive", text: text(x.text, 240), g });
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
      c.titles.push({ ...titleOf({ text: words, ...(x.roots && typeof x.roots === "object" ? { roots: x.roots } : { root }), permissions: perm, boons: [] }, B), g });
    } else if (x.k === "arch" && text(x.arch, 24)) {
      const name = text(x.arch, 24);
      const rule = ARCH.get(name);
      c.archetypes.push({ ...archOf({ name, id: rule?.id ?? null, home: rule?.home ?? null, ...(Array.isArray(x.have) ? { have: x.have } : {}) }, B), g });
    } else if (x.k === "attune" && text(x.name, 80)) {
      const awk = x.awk && typeof x.awk === "object" && text(x.awk.name, 80) ? [{ name: text(x.awk.name, 80), kind: x.awk.kind === "active" ? "active" : "passive", text: text(x.awk.text, 240), g }] : [];
      c.attuned.push({ name: text(x.name, 80), props: null, stage: "Awakened", catch: null, burden: null, awakenings: awk, g });
    }
  }
  return c;
}

// What moving onto stacking left for the player to choose: each Title read as
// all 3 on its old Root, for them to spread how they like, and any points
// they've got left (a character built on the phone before points could come
// to less than they start on), and an archetype that isn't one any more, to
// swap for another in Change.
//   { k: "arch", a, name }     archetype a, gone from the book
//   { k: "spread", t, root }   Title t, all 3 on root
//   { k: "points", left }      points they've got left to spend
export function choicesOf(c) {
  const out = [];
  // An archetype the book hasn't got any more, once however many times it's taken.
  (c.archetypes ?? []).forEach((a, i) => {
    if (a.gone && !out.some((x) => x.name === a.name)) out.push({ k: "arch", a: i, name: a.name });
  });
  (c.titles ?? []).forEach((t, i) => {
    if (t.fromRoot) out.push({ k: "spread", t: i, root: t.fromRoot });
  });
  const left = int(c.points?.start, 0) - int(c.points?.spent, 0);
  if (c.points && left > 0) out.push({ k: "points", left });
  return out;
}

// ---------------------------------------------------------------- Boons

// A Boon takes two permission slots on its Title (Boons and Burdens, in
// Building Your Character), so a Title's six slots are its permissions and
// two for each Boon. What a Boon does comes from the book's table by its
// lever, and the player's own name for it and what it's on (a piece of
// armour, a condition, climbing) are theirs. A Boon doesn't add a step.
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
// What goes on the sheet itself: Aura's maximum (5, 2 for each attuned thing
// and 2 for each Aura Boon), the stride's 2 more for each Stride Boon, a
// piece of armour gets a box, and Kit's an item more. The rest of the Boons
// work in play (roots.js and the play screen) or are the player's to
// remember, like Getting around.
export function withBoons(c) {
  const n = c.numbers ?? (c.numbers = {});
  const said = (lever) => {
    const list = boonsOf(c).filter((b) => b.lever === lever);
    return list.length ? list.map((b) => b.name || `the ${b.lever} Boon`).join(", ") : null;
  };
  const aura = boonCount(c, "Aura");
  n.aura = BASE_AURA + ATTUNED_AURA * (c.attuned?.length ?? 0) + 2 * aura;
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
// At the end of a scene a track comes back on this or more: 4, or 3 with
// the Recovery Boon.
export const restsOn = (c) => (boonCount(c, "Recovery") ? 3 : 4);
// What a Boon's called on the sheet: the player's name for it, or the lever.
export const boonSaid = (c, lever) => boonsOf(c).find((b) => b.lever === lever)?.name || `your ${lever} Boon`;
// A condition the Conditions Boon says can't touch them.
export const shrugs = (c, name) => boonsOf(c).some((b) => b.lever === "Conditions" && b.on && specKey(b.on) === specKey(name));
// Going beyond's free once a scene with the Going beyond Boon, and 1 Aura after.
export const freeBeyond = (c, s) => boonCount(c, "Going beyond") > 0 && s.beyond !== true;

export const bestRoot = (c) => [...ROOTS].sort((a, b) => c.roots[b] - c.roots[a])[0];

// Each archetype once, how many times it's taken, its home track, its Trait
// and the abilities they've got of it, from the book. Push is +2, and a point
// more each time the same archetype's taken again.
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
      return { name: x.name, text: said(x.text), html: said(x.html ?? x.text), push: isPush ? push : 0 };
    });
  }
  return out;
}
// Extra actions: your first's free, and each one bought with Aura costs 3,
// then 4, then 5 and so on (extraCost(n), n being how many they've bought
// already), back to 3 once they've finished acting. Holding, coming out of
// hiding and the Extra action Boon are on top and don't put the price up.
export const EXTRA_AURA = 3;
export const extraCost = (n = 0) => EXTRA_AURA + Math.max(0, int(n, 0));

// ---------------------------------------------------------------- state

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
// from blows, so they're Scars on Stamina now, each locking a size. What they
// grew in downtime waits in before, for the player to put back on the new
// sheet, and the even older Hurt track's Catches go into their notes. It's a
// state from Roots (v2), so normalRoots() moves it on onto stacking.
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

// Fill in anything missing and keep every number inside what the sheet
// allows now, in case the rules changed since this was saved. A state from
// before stacking (v2) moves onto it here: the crew keep their play, the Aura
// held in a passive awakening is powering it, and what the player has to
// choose is flagged (choicesOf). c is the sheet as rootsSheet() makes it, so
// a character built on the phone has had its Roots recounted already.
export function normalRoots(raw, c) {
  const r = raw && typeof raw === "object" ? raw : {};
  const moving = r.v !== 3;
  const s = Object.assign(freshRoots(c), r);
  s.v = 3;
  s.acting = Boolean(s.acting);
  // Aura powering a passive awakening that's still on the sheet, up to what
  // it holds. What was held the old way, pumped into it (store), is powering
  // it now: it came off their Aura already, and now it comes off their
  // maximum too.
  const power = obj(s.power);
  const store = obj(s.store);
  s.power = {};
  for (const w of passivesOf(c)) {
    const v = clamp(int(power[w.key], 0) + int(store[w.key], 0), 0, w.holds);
    if (v) s.power[w.key] = v;
  }
  delete s.store;
  // Past the maximum only while acting, or by the 1 In your element gave at
  // the start of the scene, till they've finished acting.
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
  // The move onto stacking: they're told once, and get what's theirs to
  // choose. After that, a choice goes once it's made, or once it doesn't
  // apply any more (their build's spread that Title, or spent the points).
  const now = choicesOf(c);
  if (moving) {
    s.stacked = true;
    s.choose = now;
  } else {
    if (s.stacked !== true) delete s.stacked;
    s.choose = (Array.isArray(s.choose) ? s.choose : []).map((x) => now.find((y) => y.k === x?.k && (y.k !== "spread" || y.t === x.t) && (y.k !== "arch" || y.name === x.name))).filter(Boolean);
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
  delete s.used;
  delete s.shrugged;
  return s;
}

// ---------------------------------------------------------------- the tracks

// The smallest size a track can be on: d2, and a size up for each Scar on it.
export const lowOf = (s, t) => Math.min(12, 2 + 2 * (s.scars?.[t]?.length ?? 0));
// How many sizes there are to pay before a track's at its smallest.
export const roomOf = (s, t) => Math.max(0, (s.tracks[t] - lowOf(s, t)) / 2);

// A hit that gets through drops its track a size, and one at its smallest
// size Blazes. A vulnerability makes it more sizes. A Blaze waiting on
// another track doesn't stop the hit: it still drops this one, as far as its
// smallest size, and one Blaze at a time is settled. It says what happened.
export function hitTrack(s, t, sizes = 1) {
  const from = s.tracks[t];
  for (let i = 0; i < sizes && s.blaze !== t; i++) {
    if (s.tracks[t] > lowOf(s, t)) s.tracks[t] = sizeDown(s.tracks[t]);
    else if (!s.blaze) s.blaze = t;
    else break;
  }
  return { from, to: s.tracks[t], blaze: s.blaze === t };
}
// Paying a track (an ability, 2 for 1, rolling again) never takes it below
// its smallest size: nobody Blazes on purpose.
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
// Every way to pay n sizes from a list of tracks: 1 from its home track, or
// 2 from the other two in any mix. Each is { stamina: 1, ... }.
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
// 2 for 1: the hit at one track paid with two sizes from the other two.
export const twoForOne = (s, t) => payWays(s, t).filter((w) => !(t in w));
export const payLabel = (w) => Object.entries(w).map(([t, v]) => `${v} ${TRACK[t].name}`).join(" and ");
export function payWith(s, w) {
  if (!Object.entries(w).every(([t, v]) => roomOf(s, t) >= v)) return false;
  for (const [t, v] of Object.entries(w)) payTrack(s, t, v);
  return true;
}

// A Blaze lived through: a Scar on that track, a Catch in the player's words,
// and the track's on its smallest open size. A Scar that would lock its last
// size is the last Blaze.
export const lastBlaze = (s, t) => (s.scars[t]?.length ?? 0) >= MAX_SCARS;
export function scarOn(s, t, catchText) {
  if (lastBlaze(s, t)) return false;
  s.scars[t].push(text(catchText));
  s.tracks[t] = lowOf(s, t);
  s.blaze = null;
  return true;
}

// The end of a scene: each track that's below d12 rolls, and a 4 or more puts
// it up a size. A d2 can't roll a 4, so it waits for downtime.
export const restsOf = (s) => TRACKS.filter((t) => s.tracks[t] < 12 && s.tracks[t] > 2);
export const RESTS_ON = 4;

// ---------------------------------------------------------------- Aura

// How much Aura's powering awakenings, and Aura's maximum: the sheet's (5,
// and 2 for each attuned thing and each Aura Boon), less what's powering
// them till the scene ends.
export const poweredOf = (s) => Object.values(obj(s?.power)).reduce((t, v) => t + Math.max(0, int(v, 0)), 0);
export const auraMax = (c, s) => Math.max(0, int(c.numbers?.aura, BASE_AURA) - poweredOf(s));

// Aura coming in. While you're acting it can go past your maximum, and
// what's over is gone once you've finished. Otherwise it stops at your
// maximum, the lower one while something's powered, and the rest can go to a
// friend in the scene. It says how many went over.
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
// Finished acting: anything over the maximum's gone, and the next extra
// action's back to 3.
export function doneActing(s, c) {
  const max = auraMax(c, s);
  const over = Math.max(0, s.aura - max);
  s.aura = Math.min(s.aura, max);
  s.acting = false;
  delete s.bought;
  return over;
}
// What a die pays when it lands: 1 if it won, and 1 for its top face. A die
// something was added to after the roll (a Push, an awakening, a flip, a tie
// bought) pays nothing more, so this is only ever counted as it lands.
export const paysOf = (nat, size, won) => (won ? 1 : 0) + (nat === size ? 1 : 0);

// ---------------------------------------------------------------- awakenings

// Every passive awakening, once each by thing and name, with what can power
// it: 2, or 4 for the same one twice.
export function passivesOf(c) {
  const out = [];
  c.attuned.forEach((a, i) => {
    for (const w of a.awakenings) {
      if (w.kind !== "passive") continue;
      const key = `${i}|${w.name}`;
      const had = out.find((x) => x.key === key);
      if (had) had.holds += HOLDS;
      else out.push({ key, a: i, thing: a.name, name: w.name, text: w.text, holds: HOLDS });
    }
  });
  return out;
}
// Powering a passive awakening: free and no action, while you're acting (the
// play screen offers it then, and a Maker can do it for you), each Aura in it
// comes off what you've got and off your maximum till the scene ends, as far
// as it holds. It works for as much as is powering it.
export function powerUp(s, c, key, n = 1) {
  const w = passivesOf(c).find((x) => x.key === key);
  const now = int(s.power?.[key], 0);
  if (!w || n < 1 || now + n > w.holds || s.aura < n) return false;
  s.power = { ...obj(s.power), [key]: now + n };
  s.aura -= n;
  return true;
}
// The end of the scene: nothing's powered any more, so the maximum's back.
export function powerOff(s) {
  s.power = {};
}
// A passive that adds to a die says so: "+1 ... for each Aura powering it". One that
// talks about the telegraphs landing, a track or Defend goes on a defence
// roll, and the rest on a roll the thing's used in.
export const addsToDie = (w) => /\+1\b[^.]*\bfor each Aura\b/i.test(w.text ?? "");
export const onDefence = (w) => /\b(telegraphs land|Stamina|Confidence|Resolve|Defend|defence)\b/i.test(w.text ?? "");
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

// Everything they could use on a roll as an item: what they carry and
// haven't crossed out, what they've picked up, and their attuned things,
// which can't break. Two of the same have a key each, the second's ending
// in |2, so either can be crossed out or used on its own.
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

// ---------------------------------------------------------------- what fits

// Everything on the sheet that can add a step to a roll, each one a thing
// with a key that lasts a save and a reload:
//   title|i              Title i
//   perm|i|j             permission j on Title i
//   arch|i               archetype i (one taken twice is two things)
//   ability|i|<name>     an ability archetype i's got
//   attuned|i            attuned thing i
//   awk|i|<name>         an awakening on attuned thing i
//   <where>|<name>       an item, by its itemsOf() key
// Two of the same never share a key: the second's ends in |2. root is the
// Root it's on (a permission, or a piece of armour), the Root a Title puts
// most on, or an archetype's and its abilities' home track's Root, and null
// for the rest. A Boon does what it says, so it's not here.
const ROOT_OF_TRACK = { Stamina: "Body", Confidence: "Mind", Resolve: "Soul" };
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
    const home = ROOT_OF_TRACK[a.home] ?? null;
    add(`arch|${i}`, "arch", a.name, home);
    for (const name of a.have ?? []) add(`ability|${i}|${name}`, "ability", name, home, { arch: i });
  });
  (c.attuned ?? []).forEach((a, i) => {
    add(`attuned|${i}`, "attuned", a.name, null, { a: i });
    for (const w of a.awakenings ?? []) add(`awk|${i}|${w.name}`, "awk", w.name, null, { a: i, passive: w.kind === "passive" });
  });
  for (const x of itemsOf(c, s)) {
    if (x.where === "attuned") continue;
    const piece = x.where === "equipment" ? (c.armour ?? []).find((a) => a.name === x.name) : null;
    add(x.key, "item", x.name, piece ? piece.root : null, { where: x.where });
  }
  return out;
}

// ---------------------------------------------------------------- a roll

// Count a roll the way Steps and Dice does: the Root, 1 for each thing on the
// sheet that fits (using), 1 Aura for each one they have to explain (cases,
// which count whether or not they're in using), 1 Aura and a step for each
// thing brought in (other: the ground, a threat's tag or a Catch) and each
// thing borrowed off a friend's sheet through a bond thread, 1 Aura for going
// beyond, each extra action of their own 1 step and a split, and friends' and
// a Leader's steps. Every roll's at least 1 step, a d2. r is:
//   { root, using: [key], cases: [key], other, borrow: [person], beyond,
//     extra: [{ via }], friends: [steps], handed, conds: [name],
//     pool: [{ i, die }], against, aim }
// An extra action bought with Aura (via "aura") costs extraCost() of how many
// they've bought already (s.bought, then each one in this roll), and held,
// out of hiding and the Boon cost nothing.
export function countRoll(c, s, r) {
  const rootN = c.roots[r.root] ?? 0;
  const known = new Set(thingsOf(c, s).map((x) => x.key));
  const cases = [...new Set(r.cases ?? [])].filter((k) => known.has(k));
  const using = [...new Set([...(r.using ?? []), ...cases])].filter((k) => known.has(k));
  const extras = (r.extra ?? []).map((x) => ({ ...x, steps: 1 }));
  const conds = (s.conditions ?? []).filter((x) => (r.conds ?? []).includes(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  const friends = (r.friends ?? []).reduce((a, b) => a + Math.max(1, int(b, 1)), 0);
  const other = clamp(r.other ?? 0, 0, 9);
  const borrowed = (r.borrow ?? []).length;
  // A Shadow's pool dice, each one as steps (a d8 is 4) or as its own die.
  const taken = new Set();
  const pool = (r.pool ?? []).filter((x) => Number.isInteger(x?.i) && s.pool?.[x.i] && !taken.has(x.i) && taken.add(x.i)).map((x) => ({ i: x.i, size: s.pool[x.i], die: Boolean(x.die) }));
  const poolSteps = pool.filter((x) => !x.die).reduce((t, x) => t + x.size / 2, 0);
  const total = Math.max(1, rootN + using.length + other + borrowed + extras.length + friends + clamp(r.handed ?? 0, 0, 30) + conds + poolSteps);
  // Every action in it gives a split, and the Splits Boon one more each.
  const splits = 1 + extras.length + (r.friends ?? []).length + boonCount(c, "Splits");
  const bought = extras.filter((x) => x.via === "aura").length;
  const before = int(s.bought, 0);
  let price = 0;
  for (let i = 0; i < bought; i++) price += extraCost(before + i);
  const free = Boolean(r.beyond && freeBeyond(c, s));
  const aura = cases.length + (r.beyond && !free ? 1 : 0) + other + borrowed + price;
  const poolDice = pool.filter((x) => x.die).map((x) => x.size);
  return {
    rootN, using, cases, extras, conds, friends, other, borrowed, total, splits, bought, price, aura, free, pool, poolDice,
    dice: [...stepsToDice(total), ...poolDice],
  };
}
