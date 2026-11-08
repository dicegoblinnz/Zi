// The Roots rules on the phone (8 Nov 2026, notes/roots-plan.md), shared by
// the companion, print and the checks, with no page in them. A roll is one
// Root and one specialty, pitched to fit how you're doing it, plus 1 for each
// item that fits. The three tracks (Stamina for Body, Confidence for Mind and
// Resolve for Soul) start at d12, drop a size for every hit that gets through
// to their Root, pay for archetype abilities, and are what you roll when the
// telegraphs land. Aura's the one thing you spend: 5 at most, full every
// scene, 1 back for every die that wins and every top face, and past 5 while
// you're acting. An attuned thing's awakenings hold Aura or spend it.
//
// A character's state on Roots (state.v === 2):
//   { v, aura, acting, tracks: { stamina, confidence, resolve },
//     scars: { stamina: [Catch], ... }, blaze, dead, store, conditions,
//     threads, crossed, boxes, picked, asp, aspText, notes, last, grown,
//     before, moved, seen, tele }
// store is the Aura held in passive awakenings, by thing and name ("0|Long
// shot"). grown is what downtime gave them, in the shapes growRoots() reads.
// before is what they grew before the Roots change, waiting to be put back.

import { sizeDown, sizeUp, stepsToDice } from "./dice.js";

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
// A passive awakening holds this much Aura, and twice it holds twice that.
export const HOLDS = 2;
export const MAX_PERMS = 6;
export const MAX_ABILITIES = 6;
export const STAGES = ["Awakened", "Tempered", "Perfected"];

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, int(v, lo)));
const even = (v, lo, hi) => clamp(Math.round(int(v, lo) / 2) * 2, lo, hi);
const text = (v, n = 80) => String(v ?? "").trim().slice(0, n);
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

// Count the Roots and specialties from the Titles and permissions, the way
// How it adds up has it: a Title's 1 on its Root and 1 on each of its three
// specialties, and a permission's 1 on its Root and 1 on its specialty. The
// specialty keeps the first way it was written.
export function countRoots(titles) {
  const roots = { Body: 0, Mind: 0, Soul: 0 };
  const specs = new Map();
  const add = (name, n = 1) => {
    const k = specKey(name);
    if (!k) return;
    const was = specs.get(k);
    specs.set(k, { name: was?.name ?? text(name, 40), steps: (was?.steps ?? 0) + n });
  };
  for (const t of titles) {
    if (ROOTS.includes(t.root)) roots[t.root] += 1;
    for (const sp of t.specialties ?? []) add(sp);
    for (const p of t.permissions ?? []) {
      if (ROOTS.includes(p.root)) roots[p.root] += 1;
      add(p.specialty);
    }
  }
  const specialties = [...specs.values()].sort((a, b) => b.steps - a.steps || 0);
  return { roots, specialties };
}

// The sheet the phone plays from: the crew's off the chapter, with what they
// grew in downtime on top (growRoots), and the attuned thing as a list, since
// an Aspiration can bring another. B is the builder's data from the book,
// for an archetype's home and abilities.
export function rootsSheet(base, grown = [], B = null) {
  if (!base) return null;
  const c = JSON.parse(JSON.stringify(base));
  c.attuned = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  for (const a of c.attuned) {
    a.stage = STAGES.includes(a.stage) ? a.stage : "Awakened";
    a.awakenings = Array.isArray(a.awakenings) ? a.awakenings : [];
    a.burden ??= null;
  }
  // Each archetype carries its abilities from the book, so the sheet says
  // what they do and the gold marks see it when they change.
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  const withRule = (a) => {
    const rule = ARCH.get(a.name);
    return rule ? { ...a, id: a.id ?? rule.id ?? null, home: a.home ?? rule.home ?? null, summary: rule.summary ?? "", for: rule.for ?? "", abilities: rule.abilities ?? [] } : a;
  };
  c.archetypes = (c.archetypes ?? []).map((a) => withRule(typeof a === "string" ? { name: a, id: null, home: null } : a));
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
  for (const t of c.titles) t.boons = (Array.isArray(t.boons) ? t.boons : []).filter((x) => x && text(x.lever, 40)).map((x) => boonOf(x, B));
  if (Array.isArray(grown) && grown.length) growRoots(c, grown, B);
  withBoons(c);
  const { roots, specialties } = countRoots(c.titles);
  c.roots = roots;
  // The sheet's own order on a tie, so the crew's read the way the chapter
  // writes them, and anything new after.
  const order = new Map((base.specialties ?? []).map((x, i) => [specKey(x.name), i]));
  const at = (x) => order.get(specKey(x.name)) ?? 999;
  c.specialties = specialties.map((x, i) => ({ ...x, i })).sort((a, b) => b.steps - a.steps || at(a) - at(b) || a.i - b.i).map(({ name, steps }) => ({ name, steps }));
  return c;
}

// What downtime grows, on top of the sheet, each one adding one thing. g is
// the entry's place in the list, so the gold marks never take a line the
// player grew for a change in the rules.
//   { k: "perm", t, text, root, spec }          a permission on Title t
//   { k: "swap", t, j, text, root, spec }       permission j on Title t, swapped
//   { k: "awk", a, name, kind, text, catch, burden } an awakening on attuned thing a
//   { k: "stage", a, to, catch, burden }        attuned thing a up a stage
//   { k: "thread", person, text, kind }         a new thread, bond or hostile
//   { k: "title", text, root, specs, perm }     a new Title, from an Aspiration
//   { k: "arch", arch }                         a new archetype, from an Aspiration
//   { k: "attune", name, aura, awk }            a new attuned thing, from an Aspiration
export function growRoots(c, grown, B = null) {
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  for (const [g, x] of grown.entries()) {
    if (!x || typeof x !== "object") continue;
    const root = ROOTS.includes(x.root) ? x.root : null;
    const spec = text(x.spec, 40);
    const words = text(x.text, 120);
    if (x.k === "perm" && words && root && spec) {
      const t = c.titles[int(x.t, -1)];
      if (t && slotsOf(t) < MAX_PERMS) t.permissions.push({ text: words, root, specialty: spec, g });
    } else if (x.k === "boon" && text(x.lever, 40)) {
      // Two permissions swapped for a Boon, in downtime: they come off the
      // Title and the Boon takes their two slots.
      const t = c.titles[int(x.t, -1)];
      if (!t) continue;
      const drop = [...new Set((Array.isArray(x.drop) ? x.drop : []).map((j) => int(j, -1)))].filter((j) => t.permissions[j]).sort((a, b) => b - a);
      for (const j of drop) t.permissions.splice(j, 1);
      if (slotsOf(t) + 2 <= MAX_PERMS) t.boons.push({ ...boonOf(x, B), g });
    } else if (x.k === "swap" && words && root && spec) {
      const t = c.titles[int(x.t, -1)];
      const j = int(x.j, -1);
      if (t && t.permissions[j]) t.permissions[j] = { text: words, root, specialty: spec, g, was: t.permissions[j].text };
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
    } else if (x.k === "title" && words && root) {
      const specs = (Array.isArray(x.specs) ? x.specs : []).map((s) => text(s, 40)).filter(Boolean).slice(0, 3);
      const p = x.perm && typeof x.perm === "object" ? x.perm : null;
      const perm = p && text(p.text, 120) && ROOTS.includes(p.root) && text(p.spec, 40) ? [{ text: text(p.text, 120), root: p.root, specialty: text(p.spec, 40), g }] : [];
      c.titles.push({ name: words, root, specialties: specs, permissions: perm, boons: [], g });
    } else if (x.k === "arch" && text(x.arch, 24)) {
      const rule = ARCH.get(text(x.arch, 24));
      c.archetypes.push({ name: text(x.arch, 24), id: rule?.id ?? null, home: rule?.home ?? null, summary: rule?.summary ?? "", for: rule?.for ?? "", abilities: rule?.abilities ?? [], g });
    } else if (x.k === "attune" && text(x.name, 80)) {
      const awk = x.awk && typeof x.awk === "object" && text(x.awk.name, 80) ? [{ name: text(x.awk.name, 80), kind: x.awk.kind === "active" ? "active" : "passive", text: text(x.awk.text, 240), g }] : [];
      c.attuned.push({ name: text(x.name, 80), props: null, stage: "Awakened", catch: null, burden: null, aura: text(x.aura, 160) || null, awakenings: awk, g });
    }
  }
  return c;
}

// ---------------------------------------------------------------- Boons

// A Boon takes two permission slots on its Title (Boons and Burdens, in
// Building Your Character), so a Title's six slots are its permissions and
// two for each Boon. What a Boon does comes from the book's table by its
// lever, and the player's own name for it and what it's on (a piece of
// armour, a condition, climbing) are theirs.
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
// What the Boons change on the sheet itself: Aura's maximum and the stride
// are 2 more for each, a piece of armour gets a box, and Kit's an item more.
// The rest work in play (roots.js and the play screen) or are the player's
// to remember, like Getting around.
export function withBoons(c) {
  const n = c.numbers ?? (c.numbers = {});
  const said = (lever) => {
    const list = boonsOf(c).filter((b) => b.lever === lever);
    return list.length ? list.map((b) => b.name || `the ${b.lever} Boon`).join(", ") : null;
  };
  const aura = boonCount(c, "Aura");
  if (aura) {
    n.aura = int(n.aura, 5) + 2 * aura;
    n.auraNote = said("Aura");
  }
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

// How much a specialty's worth, by name, whatever its capitals.
export const specSteps = (c, name) => c.specialties.find((s) => specKey(s.name) === specKey(name))?.steps ?? 0;
// The Root a specialty's usually rolled with: the one its permissions sit on
// most, the bigger one on a tie, or the Title's that names it, or their best.
export function rootFor(c, name) {
  const k = specKey(name);
  const n = { Body: 0, Mind: 0, Soul: 0 };
  for (const t of c.titles) for (const p of t.permissions) if (specKey(p.specialty) === k) n[p.root] += 1;
  const best = ROOTS.filter((r) => n[r]).sort((a, b) => n[b] - n[a] || c.roots[b] - c.roots[a])[0];
  if (best) return best;
  const title = c.titles.find((t) => (t.specialties ?? []).some((s) => specKey(s) === k));
  return title?.root ?? bestRoot(c);
}
export const bestRoot = (c) => [...ROOTS].sort((a, b) => c.roots[b] - c.roots[a])[0];

// Each archetype once, how many times it's taken, its home track and its
// abilities from the book. Push is +2, and a point more each time the same
// archetype's taken again.
export function archetypesOf(c, B) {
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  const out = [];
  for (const a of c.archetypes) {
    const had = out.find((x) => x.name === a.name);
    if (had) {
      had.times += 1;
      continue;
    }
    // The book's, or what the sheet carries when there's no book to hand.
    const rule = ARCH.get(a.name) ?? a;
    out.push({ name: a.name, id: a.id ?? rule.id ?? null, home: trackKey(a.home ?? rule.home) ?? "stamina", times: 1, summary: rule.summary ?? "", for: rule.for ?? "", abilities: rule.abilities ?? [] });
  }
  for (const a of out) {
    const push = a.times + 1;
    a.abilities = a.abilities.slice(0, MAX_ABILITIES).map((x) => {
      const isPush = /^Push$/i.test(x.name);
      const said = (s) => (isPush && a.times > 1 ? String(s).replace(/\+2\b/, `+${push}`) : s);
      return { name: x.name, text: said(x.text), html: said(x.html ?? x.text), push: isPush ? push : 0 };
    });
  }
  return out;
}
// The most actions you can have in a round: one for each archetype you've
// got, everyone's first free and the rest 3 Aura each.
export const actionsMax = (c) => Math.max(1, c.archetypes.length);
export const EXTRA_AURA = 3;

// ---------------------------------------------------------------- state

export function freshRoots(c) {
  const n = c.numbers ?? {};
  const start = (t) => even(n[t]?.die ?? 12, 2, 12);
  return {
    v: 2, aura: int(n.aura, 5), acting: false,
    tracks: { stamina: start("stamina"), confidence: start("confidence"), resolve: start("resolve") },
    scars: { stamina: [], confidence: [], resolve: [] },
    blaze: null, dead: false, store: {},
    conditions: [], threads: {}, crossed: {}, boxes: {}, picked: [],
    asp: even(c.aspiration?.die ?? 2, 2, 12), aspText: "", notes: "", last: null, grown: [],
  };
}

// A character saved before Roots, moving onto it: what still means the same
// comes with them (their threads, their Aspiration, what's crossed out or
// ticked, what they picked up, their notes, the live table), every track
// starts at d12 and Aura's full. The Scars on the old wound die were Catches
// from blows, so they're Scars on Stamina now, each locking a size. What they
// grew in downtime waits in before, for the player to put back on the new
// sheet, and the even older Hurt track's Catches go into their notes.
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
  return s;
}

// Fill in anything missing and keep every number inside what the sheet
// allows now, in case the rules changed since this was saved.
export function normalRoots(raw, c) {
  const n = c.numbers ?? {};
  const max = int(n.aura, 5);
  const s = Object.assign(freshRoots(c), raw && typeof raw === "object" ? raw : {});
  s.v = 2;
  s.acting = Boolean(s.acting);
  // Past the maximum only while acting, or by the 1 In your element gave at
  // the start of the scene, till they've finished acting.
  s.aura = clamp(s.aura, 0, s.acting ? 99 : max + (s.elem === true ? 1 : 0));
  const scars = s.scars && typeof s.scars === "object" ? s.scars : {};
  const tracks = s.tracks && typeof s.tracks === "object" ? s.tracks : {};
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
  // Aura held in a passive awakening that's still on the sheet, up to what it holds.
  const store = s.store && typeof s.store === "object" ? s.store : {};
  s.store = {};
  for (const w of passivesOf(c)) {
    const v = clamp(store[w.key], 0, w.holds);
    if (v) s.store[w.key] = v;
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

// Aura coming in. While you're acting it can go past your maximum, and
// what's over is gone once you've finished. Otherwise it stops at your
// maximum, and the rest can go to a friend in the scene. It says how many
// went over.
export function gainAura(s, c, n = 1) {
  const max = int(c.numbers?.aura, 5);
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
  const max = int(c.numbers?.aura, 5);
  const over = Math.max(0, s.aura - max);
  s.aura = Math.min(s.aura, max);
  s.acting = false;
  return over;
}
// What a die pays when it lands: 1 if it won, and 1 for its top face. A die
// something was added to after the roll (a Push, an awakening, a flip, a tie
// bought) pays nothing more, so this is only ever counted as it lands.
export const paysOf = (nat, size, won) => (won ? 1 : 0) + (nat === size ? 1 : 0);

// ---------------------------------------------------------------- awakenings

// Every passive awakening, once each by thing and name, with what it holds:
// 2, or 4 for the same one twice.
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
// A passive that adds to a die says so: "+1 ... for each Aura in it". One that
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
// which can't break. Each one's 1 step when it fits.
export function itemsOf(c, s) {
  const out = [];
  const add = (where, name) => {
    if (!name) return;
    const key = `${where}|${name}`;
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

// ---------------------------------------------------------------- a roll

// Count a roll the way Steps and Dice does: the Root, the specialty, 1 for
// each item that fits, 1 Aura and a step for anything else brought in, the
// specialty each extra action brings (the same one again is 1), and friends'
// and a Leader's steps. Every roll's at least 1 step, a d2. r is:
//   { root, spec, items: [key], other, borrow: [person], pitch, beyond,
//     extra: [{ spec, via }], friends: [steps], handed, conds: [name],
//     pool: [{ i, die }] }
// pitch is true when the specialty needs a case made for it (1 Aura).
export function countRoll(c, s, r) {
  const rootN = c.roots[r.root] ?? 0;
  const spec = r.spec ? c.specialties.find((x) => specKey(x.name) === specKey(r.spec)) ?? null : null;
  const specN = spec ? spec.steps : 0;
  const items = new Set(itemsOf(c, s).map((x) => x.key));
  const using = [...new Set(r.items ?? [])].filter((k) => items.has(k));
  const seen = new Set(spec ? [specKey(spec.name)] : []);
  const extras = (r.extra ?? []).map((x) => {
    const k = specKey(x.spec);
    const again = !k || seen.has(k);
    if (k) seen.add(k);
    return { ...x, steps: again ? 1 : specSteps(c, x.spec) || 1, again };
  });
  const conds = (s.conditions ?? []).filter((x) => (r.conds ?? []).includes(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  const friends = (r.friends ?? []).reduce((a, b) => a + Math.max(1, int(b, 1)), 0);
  const other = clamp(r.other ?? 0, 0, 9);
  const borrowed = (r.borrow ?? []).length;
  // A Shadow's pool dice, each one as steps (a d8 is 4) or as its own die.
  const taken = new Set();
  const pool = (r.pool ?? []).filter((x) => Number.isInteger(x?.i) && s.pool?.[x.i] && !taken.has(x.i) && taken.add(x.i)).map((x) => ({ i: x.i, size: s.pool[x.i], die: Boolean(x.die) }));
  const poolSteps = pool.filter((x) => !x.die).reduce((t, x) => t + x.size / 2, 0);
  const total = Math.max(1, rootN + specN + using.length + other + borrowed + extras.reduce((t, x) => t + x.steps, 0) + friends + clamp(r.handed ?? 0, 0, 30) + conds + poolSteps);
  // Every action in it gives a split, and the Splits Boon one more each.
  const splits = 1 + extras.length + (r.friends ?? []).length + boonCount(c, "Splits");
  const bought = extras.filter((x) => x.via === "aura").length;
  const free = Boolean(r.beyond && freeBeyond(c, s));
  const aura = (r.pitch && spec ? 1 : 0) + (r.beyond && !free ? 1 : 0) + other + borrowed + EXTRA_AURA * bought;
  const poolDice = pool.filter((x) => x.die).map((x) => x.size);
  return { rootN, spec, specN, items: using, extras, conds, friends, other, borrowed, total, splits, bought, aura, free, pool, poolDice, dice: [...stepsToDice(total), ...poolDice] };
}
