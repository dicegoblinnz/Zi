// The character builder on the 17 Nov fixes (prompt 6 of notes/fixes-plan.md,
// on top of the new core's builder, prompt 5 of notes/core-plan.md): the
// Quick Build from the rules, one step to a screen on a phone held in one
// hand, with the book's own words for each step behind a question bubble
// (tip.js). A character's bought with points (points.js): 35, or more when
// the player says it's a one-shot or a catch-up, with what's spent and what's
// left in the bar at the bottom the whole way, and a tap on it saying what
// every point went on. A Title, an archetype or an attuned thing is 5 and
// comes with its one permission, ability or awakening, and every other
// permission, ability or awakening is 1. An item's 1 point and comes at tier
// 2, a point more puts it up to tier 3, and you carry six at most, the
// attuned thing among them (its 5 covers it at tier 2), with the keepsake
// free on top. Resources aren't written down, so a bubble says what they
// are. A Title puts 5 on your Roots, spread with a tap on a Root (All on
// puts the 5 on one, and + takes a point off the biggest of the others once
// all 5 are on), and each permission 1 on the Root it's written with. Each
// awakening says the Root it fits, and locks a point of it. An archetype
// shows its mechanic, its Trait and its ten or so abilities, each a name and
// its Aura with what it does behind its ?, and the player picks the one it
// comes with. There are no Boons. At least one Title, one archetype and one
// attuned thing is recommended, and that's a nudge. It warns but never
// blocks.
// Drafts are saved on the phone as you go, in one localStorage key, zi-drafts,
// by "new" or by the id of the character being changed, so nothing's lost if
// the page closes. A finished character keeps only what the player chose (its
// build), and sheetOf() turns that into the same sheet the crew have, which
// roots.js reads against the current rules every time it opens. The guided
// build goes a step at a time, and the other ways in (a blank sheet, one of
// the crew, or random, from ways.js) open with every step on one page.
// Changing a saved character opens on one page too, with everything on their
// sheet and whatever they grew in downtime (foldGrown), and so does rebuilding
// one built before Roots (fromBefore). One built before stacking keeps
// everything, even past 35: a Title that was on one Root has all 5 on it for
// the player to spread how they like, its specialties go, and its archetypes
// keep the abilities they had. One built on stacking has each Title's 3 made
// 5 the way they were spread (R.toFive), flagged for the player to check, and
// each awakening on its biggest Root till they say. One built before the
// fixes (v 5 and older) has its equipment as items at tier 2 (armour a tier
// up from its quality), its utility items and bag gone into its notes, and
// each Boon's 2 points back to spend, flagged.

import { diceLabel, stepsToDice } from "./dice.js";
import * as R from "./roots.js";
import { costOf, START } from "./points.js";
import { tip } from "./tip.js";
import { bondKey, bondName, bondsOf, threadNote } from "./threads.js";
import { SIGILS, aura as kitAura, crest, die as kitDie, grow as growDie, sigil } from "../kit/kit.js";

const KEY = "zi-drafts";
export const MAX_TITLES = 24;
const MAX_ARCHS = 12;
const MAX_ATTUNED = 8;
const MAX_THREADS = 40;
const MAX_PERMS = R.MAX_PERMS;
const MAX_ABILITIES = R.MAX_ABILITIES;
// What a character can start on: 35, and more for a one-shot or catching up.
export const MAX_START = 99;
const ROOTS = R.ROOTS;
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"];
const ord = (i) => ORD[i] ?? `${i + 1}${(i + 1) % 100 >= 11 && (i + 1) % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][(i + 1) % 10] ?? "th"}`;
// Plain armour and a helmet guard your Body, so they're armour on it as
// they're written in. Mind and Soul armour (court clothes, a holy symbol) is
// the player's to say. A shield's a guard, never armour.
export const ARMOUR = /\b(plate|chain|mail|leathers|shield|armou?r|breastplate|hauberk|brigandine|helm|helmet)\b/i;
const GUARD = /\b(shield|buckler|parrying)\b/i;
const WEAPON = /\b(sword|knife|knives|dagger|axe|bow|longbow|shortbow|crossbow|spear|hammer|mace|club|whip|staff|rapier|stiletto|sling|blade|pistol|net|maul|glaive|halberd|polearm|lance)\b/i;
// A piece of armour's quality from before the fixes (1 Common, 2 Fine, 3
// Masterwork), kept on its equipment line as q. It's a tier up from that now.
export const tierOf = (x) => ([1, 2, 3].includes(Number(x?.q)) ? Number(x.q) : 1);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const both = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");
const pts = (n) => `${n} point${n === 1 ? "" : "s"}`;

// ---------------------------------------------------------------- the build
//
//   { v: 6, start, archs: [name], have: [[ability]], titles: [{ idea, text,
//     roots: { Body, Mind, Soul }, perms: [{ text, root }] }], items: [{ text,
//     kind, tier, root, props }], keepsake: { text }, attuned: [{ name, kind,
//     tier, root, props, stage, catch, burden, awk: [{ name, root, text,
//     kept }] }], threads, connect, aspiration, name, pronoun, blurb, trouble,
//     carried }
//
// start is the points they start on. archs stays a list of names, since the
// Worker reads it for the crests, and have[i] is the abilities archetype i's
// got, the one it came with first (null for every ability it had, from
// before stacking, till the book's to hand to say which). A Title's roots is
// its 5 Root points, spread. An item's kind is a weapon, a tool, a guard,
// armour, a pack or a vessel, its tier 1 to 6 (2 or 3 for a new character),
// root the Root armour soaks on and props a weapon's properties. An attuned
// thing is one of the six items too, with the same kind, tier, root and
// props. An awakening's root is the Root it fits and locks a point of. kept
// is on an awakening that was on the sheet already past what its thing's
// stage holds (a crew sheet, or downtime's Finish anyway), so it stays there.
// carried is what a build from before the fixes had as utility items and in
// its bag, for the notes (roots.js's normalCore writes them in).
// While a change is open, a Title from before stacking says the Root it was
// all on (from), a Title from stacking says how its 3 were spread (three), a
// Title from before the fixes says the Boons it had (boonsGone), an
// awakening from before the new core that's on a guessed Root says so
// (guessed), and the build says it moved onto stacking (stack), onto the new
// core (core) or onto the fixes (fixes): none of them reaches a saved
// character.

const line = () => ({ text: "" });
const noRoots = () => ({ Body: 0, Mind: 0, Soul: 0 });
const blankPerm = () => ({ text: "", root: "" });
const blankTitle = (n = 3) => ({ idea: "", text: "", roots: noRoots(), perms: Array.from({ length: n }, blankPerm) });
const blankItem = () => ({ text: "", kind: "tool", tier: R.START_TIER, root: "", props: [] });
const blankAwk = () => ({ name: "", root: "", text: "" });
const blankThing = () => ({ name: "", kind: "tool", tier: R.START_TIER, root: "", props: [], stage: "Awakened", catch: "", burden: "", awk: [blankAwk(), blankAwk()] });
// A thread is a bond thread or a hostile thread (threads.js). Whose is set
// when it's in a crewmate's words, and strained only when a crew sheet says
// so: what happens in play is kept in the character's state.
const blankThread = (kind = "bond") => ({ person: "", text: "", kind, whose: "" });
export function blankBuild() {
  return {
    v: 6,
    start: START,
    archs: ["", ""],
    have: [[], []],
    titles: [blankTitle(), blankTitle()],
    items: [],
    keepsake: line(),
    // One attuned thing to start, and more for 5 points each.
    attuned: [blankThing()],
    // Two bond threads with the crew, and a hostile thread with anyone.
    threads: [blankThread(), blankThread(), blankThread("hostile")],
    connect: [],
    aspiration: "",
    name: "", pronoun: "them", blurb: "", trouble: [],
  };
}

// Fill in anything missing, so an old or damaged build still opens.
const str = (v, max = 160) => (typeof v === "string" ? v.slice(0, max) : "");
const rootOf = (v) => (ROOTS.includes(v) ? v : "");
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const kindOf = (t) => (t?.kind === "hostile" || (t?.kind !== "bond" && t?.debt) ? "hostile" : "bond");
const atLeast = (arr, n, make) => {
  while (arr.length < n) arr.push(make());
  return arr;
};
const sumOf = (roots) => ROOTS.reduce((t, r) => t + (roots?.[r] ?? 0), 0);
// A Title's spread: whole numbers, never more than its 5 in all.
function fixRoots(x) {
  const out = noRoots();
  let left = R.TITLE_ROOTS;
  for (const r of ROOTS) {
    const n = Math.min(left, Math.max(0, int(x?.[r], 0)));
    out[r] = n;
    left -= n;
  }
  return out;
}
// An archetype's abilities, from the book.
const abilitiesOf = (B, name) => (B?.archetypes ?? []).find((a) => a.name === name)?.abilities ?? [];
const cleanHave = (h) => [...new Set(h.map((x) => str(typeof x === "string" ? x : x?.name, 60).trim()).filter(Boolean))].slice(0, MAX_ABILITIES);
// Every ability an archetype had, for one from before stacking (R.hadOf()), or
// null till the book's to hand.
const allOf = (B, name) => (B ? R.hadOf(name, abilitiesOf(B, name).map((x) => x.name)) : null);
// An archetype from before stacking keeps every ability it had. One taken
// more than once had them once, so they're dealt out between its copies, the
// first ability to the first, the way the crew's Shadows have Push and
// Vanish, less any another copy has already. Till the book's to hand, they
// wait as null.
function dealAll(b, B) {
  if (!B) return;
  for (const name of new Set(b.archs.map((a) => a.trim()).filter(Boolean))) {
    const mine = b.archs.map((a, i) => (a.trim() === name && b.have[i] === null ? i : -1)).filter((i) => i >= 0);
    if (!mine.length) continue;
    const held = new Set(b.archs.flatMap((a, i) => (a.trim() === name && Array.isArray(b.have[i]) ? b.have[i] : [])));
    const all = (allOf(B, name) ?? []).filter((x) => !held.has(x));
    for (const i of mine) b.have[i] = [];
    all.forEach((x, k) => b.have[mine[k % mine.length]].push(x));
  }
}
// While a character's being changed, a line remembers what it said when the
// change began (was), so whatever's crossed out or strained can follow it when
// it's reworded, and a permission rebuilt from before Roots says which set
// actions it was on (from). Neither reaches a saved character.
const was = (x) => (typeof x?.was === "string" && x.was ? { was: x.was.slice(0, 300) } : {});
const from = (x) => (typeof x?.from === "string" && x.from ? { from: x.from.slice(0, 120) } : {});
const fixLine = (x) => ({ text: str(x?.text), ...was(x) });
const fixPerm = (x) => ({ text: str(x?.text, 120), root: rootOf(x?.root), ...from(x) });
const fixAwk = (x) => ({ name: str(x?.name, 80), root: rootOf(x?.root), text: str(x?.text, 240), ...(x?.kept ? { kept: true } : {}), ...(x?.guessed && rootOf(x?.root) ? { guessed: true } : {}) });

// ---------------------------------------------------------------- items
//
// What each kind's called on the screen, and an item tidied: its words, its
// kind, its tier (1 to 6), the Root armour soaks on (Body unless it says),
// and a weapon's properties.
const KINDS = R.KINDS;
const KIND_NAME = { weapon: "Weapon", tool: "Tool", guard: "Guard", armour: "Armour", pack: "Pack", vessel: "Vessel" };
const kindAt = (v) => (KINDS.includes(v) ? v : "tool");
const tierAt = (v) => Math.min(R.MAX_TIER, Math.max(1, int(v, R.START_TIER)));
const propsOf = (v) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(/,\s*/)).map((p) => str(String(p ?? "").trim(), 30)).filter(Boolean))].slice(0, 8);
function fixItem(x) {
  const kind = kindAt(x?.kind);
  return { text: str(x?.text ?? x?.name, 80), kind, tier: tierAt(x?.tier), root: kind === "armour" ? rootOf(x?.root) || "Body" : "", props: kind === "weapon" ? propsOf(x?.props) : [], ...was(x) };
}
// An item's name without its article, for matching.
const bareName = (name) => String(name ?? "").trim().toLowerCase().replace(/^(a|an|the|her|his|their|your|my) /, "").replace(/\s*\([^)]*\)\s*$/, "");
// A weapon's properties off the book's weapons table, the one whose name
// fits best: a longbow's Long and Two-Handed, a knife's Thrown, Concealed and
// Quick.
function weaponProps(name, B) {
  const n = bareName(name);
  let best = null;
  for (const w of B?.weapons ?? []) {
    if (/^(weapon|bare hands|improvised weapon)$/i.test(w.name)) continue;
    for (const word of String(w.name).toLowerCase().split(/,| or /).map((x) => x.trim()).filter(Boolean)) {
      if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(n) && (!best || word.length > best.word.length)) best = { word, props: w.props ?? [] };
    }
  }
  return best ? [...best.props] : [];
}
// The book's groups of items, by the kind each is.
const GROUP_KIND = { Weapons: "weapon", Guards: "guard", Armour: "armour", Tools: "tool", Foci: "tool", Packs: "pack", Vessels: "vessel" };
// An item from its words: its kind from the book's group it's in, or from
// what it sounds like, armour on the Root it says (court clothes (Mind)) or
// the Body, a weapon with its properties, at tier 2. It's a guess, so the
// player can change any of it.
export function itemFor(name, B) {
  const words = String(name ?? "").trim();
  const n = words.toLowerCase();
  const group = (B?.items ?? []).find((g) => GROUP_KIND[g.group] && g.items.some((x) => x.toLowerCase() === n));
  const kind = group ? GROUP_KIND[group.group] : GUARD.test(n) ? "guard" : ARMOUR.test(n) ? "armour" : WEAPON.test(n) ? "weapon" : "tool";
  const root = kind === "armour" ? (/\(mind\)\s*$/i.test(words) ? "Mind" : /\(soul\)\s*$/i.test(words) ? "Soul" : "Body") : "";
  return { text: words.replace(/\s*\((Body|Mind|Soul)\)\s*$/i, ""), kind, tier: R.START_TIER, root, props: kind === "weapon" ? weaponProps(words, B) : [] };
}
// What an item costs: a point at tier 2, and a point for each tier above.
// An attuned thing's 5 covers it at tier 2.
const itemCost = (it, attuned = false) => (attuned ? 0 : 1) + Math.max(0, it.tier - R.START_TIER);
// What a build from before the fixes carried, moved across the way a saved
// character is (Items in Building Your Character): each piece of equipment
// an item at tier 2, armour and a shield a tier up from their quality (Common
// 2, Fine 3, Masterwork 4), a shield a guard, and the utility items and bag
// gone, kept in carried for the notes, since they're Resources now. One with
// the same name as an attuned thing is that thing.
function itemsBefore(r, B, things) {
  const items = [];
  for (const e of list(r.equipment, 8)) {
    const text = str(e?.text, 80).trim();
    if (!text) continue;
    const guess = itemFor(text, B);
    const arm = rootOf(e?.arm);
    const tier = arm ? tierOf(e) + 1 : R.START_TIER;
    const it = guess.kind === "guard" ? { ...guess, tier } : arm ? { ...guess, kind: "armour", root: arm, tier, props: [] } : guess.kind === "armour" ? { ...guess, kind: "tool", root: "" } : guess;
    const thing = things.find((a) => bareName(a.name) === bareName(text));
    if (thing) Object.assign(thing, { kind: it.kind, tier: Math.max(thing.tier, it.tier), root: it.root, props: it.props.length ? it.props : thing.props });
    else items.push({ ...it, text, ...was(e) });
  }
  const lines = (v) => (Array.isArray(v) ? v.map((x) => str(typeof x === "string" ? x : x?.text, 120).trim()) : String(v ?? "").split("\n").map((x) => x.trim().slice(0, 120))).filter(Boolean);
  const carried = { utility: lines(r.utility), bag: lines(r.bag) };
  return { items, carried: carried.utility.length || carried.bag.length ? carried : null };
}

// B is the builder's data from the book, for an archetype's abilities. A new
// character's draft (fresh) from before stacking picks its abilities again,
// where a saved one keeps them all.
export function normalBuild(raw, B = null, { fresh = false } = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  // A draft or a build from before Roots comes across on the new rules.
  if (R.isOldBuild(r)) return fromBefore(r, B);
  const b = blankBuild();
  // A build from before stacking: a Title on one Root, specialties, and an
  // archetype with every ability it had.
  const before = r.v != null && Number(r.v) < 4;
  // A build from stacking (v 4): each Title spread 3, and awakenings with no
  // Root. A new character's draft from then is still a draft, so it's moved
  // across the same way, and just says nothing about it.
  const stacked = r.v != null && Number(r.v) < 5;
  // A build from before the fixes (v 5 and older): equipment, utility items
  // and a bag, and Boons.
  const unfixed = !Array.isArray(r.items) && (r.v == null || Number(r.v) < 6);
  b.start = Math.min(MAX_START, Math.max(START, int(r.start, START)));
  const archs = list(r.archs, MAX_ARCHS).map((a) => str(typeof a === "string" ? a : a?.name, 24));
  if (archs.length) {
    b.archs = archs;
    const had = Array.isArray(r.have) ? r.have : [];
    b.have = archs.map((name, i) => {
      const h = had[i] !== undefined ? had[i] : r.archs[i] && typeof r.archs[i] === "object" ? r.archs[i].have : undefined;
      if (Array.isArray(h)) return cleanHave(h);
      if (!name.trim()) return [];
      return h === null || (before && !fresh) ? null : [];
    });
    dealAll(b, B);
  }
  const titles = list(r.titles, MAX_TITLES);
  if (titles.length) {
    b.titles = titles.map((x) => {
      const perms = list(x?.perms ?? x?.permissions, MAX_PERMS).map(fixPerm);
      const one = rootOf(x?.root);
      const spread = Boolean(x?.roots && typeof x.roots === "object");
      const t = { idea: str(x?.idea, 40), text: str(x?.text ?? x?.name, 120), roots: spread ? fixRoots(x.roots) : one ? { ...noRoots(), [one]: R.TITLE_ROOTS } : noRoots(), perms: perms.length ? perms : [blankPerm()] };
      // Boons are gone. A saved one's 2 points are theirs to spend, and the
      // change says so till it's saved.
      const gone = [...list(x?.boons, 3), ...list(x?.boonsGone, 3)].filter((y) => y && str(y.lever, 40)).map((y) => ({ lever: str(y.lever, 40), name: str(y.name, 40) }));
      if (gone.length && !fresh) t.boonsGone = gone;
      // From before stacking it was all on one Root, so all 5 are on it,
      // for the player to spread how they like.
      const was1 = rootOf(x?.from) || (!spread && one ? one : "");
      if (was1 && t.roots[was1] === R.TITLE_ROOTS) t.from = was1;
      // From stacking its 3 are made 5 the way they were spread, and it says
      // how they were (three) till it's saved, for the player to check.
      else if (x?.three && typeof x.three === "object" && sumOf(fixRoots(x.three)) === R.OLD_TITLE_ROOTS) t.three = fixRoots(x.three);
      else if (stacked && spread && sumOf(t.roots) === R.OLD_TITLE_ROOTS) {
        t.three = t.roots;
        t.roots = R.toFive(t.roots, t.perms.filter((p) => p.text.trim()));
      }
      return t;
    });
  }
  b.keepsake = fixLine(r.keepsake);
  if (Array.isArray(r.attuned)) {
    b.attuned = r.attuned.slice(0, MAX_ATTUNED).map((x) => {
      const guess = x?.kind ? null : itemFor(str(x?.name, 80), B);
      const kind = kindAt(x?.kind ?? guess?.kind);
      return {
        name: str(x?.name, 80), kind, tier: tierAt(x?.tier), root: kind === "armour" ? rootOf(x?.root ?? guess?.root) || "Body" : "", props: kind === "weapon" ? propsOf(x?.props?.length ? x.props : guess?.props) : [],
        stage: R.STAGES.includes(x?.stage) ? x.stage : "Awakened", catch: str(x?.catch, 120), burden: str(x?.burden, 120),
        awk: atLeast(list(x?.awk ?? x?.awakenings, 6).map(fixAwk), 1, blankAwk),
      };
    });
    if (!b.attuned.length) b.attuned = [blankThing()];
    // An awakening from before the new core hasn't got a Root, so it's on
    // their biggest till they say, the way roots.js reads it.
    if (stacked) {
      const big = bigOf(b);
      for (const a of b.attuned) for (const w of a.awk) if (awkIn(w) && !w.root) Object.assign(w, { root: big, guessed: true });
    }
  }
  if (unfixed) {
    const moved = itemsBefore(r, B, b.attuned);
    b.items = moved.items;
    if (moved.carried) b.carried = moved.carried;
  } else b.items = list(r.items, 12).map(fixItem);
  if (r.carried && typeof r.carried === "object") b.carried = { utility: list(r.carried.utility, 12).map((x) => str(x, 120)).filter(Boolean), bag: list(r.carried.bag, 40).map((x) => str(x, 120)).filter(Boolean) };
  if (Array.isArray(r.threads)) b.threads = r.threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), kind: kindOf(t), whose: str(t?.whose, 40), ...(t?.strained ? { strained: true } : {}), ...was(t) }));
  b.connect = (Array.isArray(r.connect) ? r.connect : []).slice(0, 12).map((a) => str(a, 200));
  for (const k of ["aspiration", "name", "blurb"]) b[k] = str(r[k], k === "name" ? 40 : 160);
  b.pronoun = ["her", "him", "them"].includes(r.pronoun) ? r.pronoun : "them";
  b.trouble = (Array.isArray(r.trouble) ? r.trouble : []).filter((x) => typeof x === "string").slice(0, 12).map((x) => str(x, 120));
  if (r.stack === true || (before && !fresh)) b.stack = true;
  if (r.core === true || (stacked && !fresh && !before && !b.stack)) b.core = true;
  if (r.fixes === true || (unfixed && !fresh && r.v != null)) b.fixes = true;
  return b;
}
// Their biggest Root, the first on a tie, the way roots.js picks it.
const bigOf = (b) => {
  const { roots } = rootsOf(b);
  return [...ROOTS].sort((x, y) => roots[y] - roots[x])[0];
};
// What's saved: the build without what only matters while it's open.
function forSave(b) {
  const out = JSON.parse(JSON.stringify(b));
  for (const k of ["stack", "core", "fixes"]) delete out[k];
  out.v = 6;
  for (const t of out.titles) {
    delete t.from;
    delete t.three;
    delete t.boonsGone;
  }
  for (const a of out.attuned) for (const w of a.awk) delete w.guessed;
  return out;
}

// What's in, and what to call it.
const titleIn = (t) => Boolean(t.text.trim() || sumOf(t.roots) || t.perms.some((p) => p.text.trim()));
const titleName = (t) => t.text.trim() || "Untitled";
const thingIn = (a) => Boolean(a.name.trim() || a.awk.some((w) => w.name.trim() || w.text.trim()));
const thingName = (a) => a.name.trim() || "Something attuned";
const awkIn = (w) => Boolean(w.name.trim() || w.text.trim());
const itemIn = (it) => Boolean(it.text.trim());
const slotsOf = (t) => t.perms.filter((p) => p.text.trim()).length;
// Your items, the attuned things among them, and how many that is of six.
const itemCount = (b) => b.attuned.filter(thingIn).length + b.items.filter(itemIn).length;
// What an attuned thing holds at its stage (Three stages): the first ones,
// then the rest once it's got its Catch, its Burden or both. One already on
// the sheet past that is kept.
const roomOf = (a) => R.attunedRoom({ stage: a.stage, catch: a.catch.trim(), burden: a.burden.trim(), awakenings: a.awk.filter(awkIn) });
const fits = (a, j) => {
  const r = roomOf(a);
  return j < r.base || (j < r.all && !r.missing.length);
};
const counts = (a, j) => Boolean(a.awk[j]?.kept) || fits(a, j);
// Everything on a thing stays on the sheet, whatever its stage holds: one of
// the crew made into a build keeps what the chapter gives them.
export function keepAttuned(b) {
  for (const a of b.attuned) a.awk.forEach((w, j) => {
    if (awkIn(w) && !fits(a, j)) w.kept = true;
  });
  return b;
}

// The numbers on the sheet: Aura's 5 and the stride's 3, and nothing
// changes them, and your Resources, 3 and half a pack's tier, rounded up.
export function numbersOf(b) {
  const packs = [...b.items.filter(itemIn), ...b.attuned.filter(thingIn)].filter((it) => it.kind === "pack");
  return { aura: R.BASE_AURA, stride: 3, res: R.RES_BASE + packs.reduce((t, it) => t + R.packRes(it.tier), 0) };
}

// What a build costs, the way costOf() counts a sheet: only what goes on it,
// so an empty line and an awakening its thing can't hold yet cost nothing.
export function pointsOf(b) {
  const x = {
    titles: b.titles.filter(titleIn).map((t) => ({ text: titleName(t), perms: t.perms.filter((p) => p.text.trim()).map((p) => p.text.trim()) })),
    archs: b.archs.map((name, i) => ({ name: name.trim(), have: b.have[i] ?? [] })).filter((a) => a.name),
    attuned: b.attuned.filter(thingIn).map((a) => ({ name: thingName(a), catch: a.catch.trim(), awk: a.awk.filter((w, j) => awkIn(w) && counts(a, j)).map((w) => ({ name: w.name.trim() || "An awakening" })) })),
    items: [...b.attuned.filter(thingIn).map((a) => ({ name: thingName(a), tier: a.tier, attuned: true })), ...b.items.filter(itemIn).map((it) => ({ name: it.text.trim(), tier: it.tier }))],
  };
  const { spent, lines } = costOf(x);
  return { start: b.start, spent, left: b.start - spent, lines };
}

// The Roots a build adds up to, the way Roots has it, with where each one
// comes from.
export function rootsOf(b) {
  const titles = b.titles.filter(titleIn).map((t) => ({ roots: t.roots, permissions: t.perms.filter((p) => p.text.trim()).map((p) => ({ text: p.text.trim(), root: p.root })) }));
  const { roots } = R.countRoots(titles);
  const from = { Body: [], Mind: [], Soul: [] };
  titles.forEach((t, i) => {
    for (const r of ROOTS) if (t.roots[r]) from[r].push(`${t.roots[r]} from your ${ord(i)} Title`);
    for (const p of t.permissions) if (p.root) from[p.root].push(`“${p.text}”`);
  });
  return { roots, from };
}

// ---------------------------------------------------------------- the sheet

// The full sheet, the same shape as the crew's (scripts/crew-sheets.mjs),
// which roots.js makes into the one the phone plays from.
const made = new Map();
export function sheetOf(ch, B) {
  const json = JSON.stringify(ch.build);
  const hit = made.get(ch.id);
  if (hit && hit.json === json && hit.name === ch.name) return hit.sheet;
  const sheet = makeSheet(ch, normalBuild(ch.build, B), B);
  made.set(ch.id, { json, name: ch.name, sheet });
  return sheet;
}

function makeSheet(ch, b, B, { draft = false } = {}) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const n = numbersOf(b);
  // A Title from before stacking that's still all on the Root it had goes on
  // the sheet with that Root, so roots.js knows its spread is the player's to
  // choose (fromRoot), and one from stacking goes on spread 3 the way it was,
  // so roots.js makes it 5 the same way and says so (fromThree). Once a
  // change is saved, it's a spread like any other, and the sheet says it's on
  // the new core (core), so a Title the player's left at 3 stays at 3.
  // A draft's the build as it stands on the screen, so it's on the new core.
  // A Boon from before the fixes goes on as a Boon, which roots.js keeps as
  // gone (boonsGone), for its 2 points to be spent.
  const three = !draft && b.titles.some((t) => titleIn(t) && t.three);
  const titles = b.titles.filter(titleIn).map((t) => ({
    text: titleName(t), name: titleName(t), ...(t.from && t.roots[t.from] === R.TITLE_ROOTS ? { root: t.from } : t.three && three ? { roots: { ...t.three } } : { roots: { ...t.roots } }),
    permissions: t.perms.filter((p) => p.text.trim()).map((p) => ({ text: p.text.trim(), root: p.root })),
    boons: draft ? [] : (t.boonsGone ?? []).map((x) => ({ lever: x.lever, name: x.name })),
  }));
  const archetypes = b.archs.map((a, i) => ({ name: a.trim(), i })).filter((a) => a.name).map(({ name, i }) => ({ name, id: ARCH.get(name)?.id ?? null, ...(Array.isArray(b.have[i]) ? { have: [...b.have[i]] } : {}) }));
  const things = b.attuned.filter(thingIn);
  const attuned = things.map((a) => ({
    name: thingName(a), props: a.kind === "weapon" && a.props.length ? a.props.join(", ") : null, stage: a.stage || "Awakened", catch: a.catch.trim() || null, burden: a.burden.trim() || null,
    // An awakening on a Root the player hasn't said goes on with none, and
    // roots.js puts it on their biggest, guessed.
    awakenings: a.awk.map((w, j) => ({ w, j })).filter(({ w, j }) => awkIn(w) && counts(a, j)).map(({ w }) => ({ name: w.name.trim() || "An awakening", root: w.guessed ? "" : w.root, text: w.text.trim() })),
  }));
  // Every item the way the crew's are, the attuned things last, each one
  // saying which it is.
  const itemOf = (it, name, attuned) => ({ name, tier: it.tier, kind: it.kind, root: it.kind === "armour" ? it.root || "Body" : null, props: it.kind === "weapon" ? [...it.props] : [], attuned });
  const items = [...b.items.filter(itemIn).map((it) => itemOf(it, it.text.trim(), null)), ...things.map((a, i) => itemOf(a, thingName(a), i))];
  // Each person's one bond, with every thread with them under it, however
  // the name was typed. Each thread says bond or hostile, and whose it is when
  // it's in someone else's words, the way the crew's do.
  const threads = bondsOf(b.threads.filter((th) => th.person.trim() && th.text.trim())).map((g) => ({
    person: g.person,
    threads: g.items.map(({ t: th }) => {
      const t = { text: th.text.trim(), kind: th.kind, whose: th.whose.trim() || null, strained: Boolean(th.strained) };
      return { ...t, note: threadNote(t) };
    }),
  }));
  const plays = [...new Set(b.titles.map((t) => IDEA.get(t.idea)?.playsLike).filter(Boolean))];
  const names = [...new Set(archetypes.map((a) => a.name))];
  return {
    id: ch.id, name: ch.name, own: true, ...(three ? {} : { core: true }),
    title: titles[0]?.text ?? "",
    blurb: b.blurb.trim() || (plays.length ? `${cap(plays.join(", and "))}.` : ""),
    hash: ch.hash,
    pronoun: b.pronoun,
    playsLike: esc(plays.join(", and ") || both(names) || "your own"),
    points: { start: b.start },
    archetypes, titles, roots: rootsOf(b).roots,
    items, keepsake: b.keepsake.text.trim() || null, attuned,
    ...(b.carried ? { was: { utility: [...b.carried.utility], bag: [...b.carried.bag] } } : {}),
    numbers: { aura: n.aura, stride: n.stride, strideNote: null },
    threads,
    crewQs: B.connect.map((q, i) => ({ q, a: (b.connect[i] ?? "").trim() })).filter((x) => x.a),
    aspiration: { text: b.aspiration.trim(), pts: 0, die: 2 },
    trouble: b.trouble,
  };
}

// The threads that are written in, by kind.
export function threadCount(b) {
  const filled = b.threads.filter((t) => t.person.trim() && t.text.trim());
  const hostile = filled.filter((t) => t.kind === "hostile").length;
  return { bonds: filled.length - hostile, hostile };
}

// What the builder flags. Nothing here stops a save. A new character's held
// to the points they start on, and the threads they start with. A saved one
// keeps everything it's got, even past what it started on, so it's only
// flagged for points left to spend and what makes no sense on any sheet.
// step says which step it's on, and null's the points.
export function checksOf(b, B, { changing = false } = {}) {
  const out = [];
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const p = pointsOf(b);
  if (p.left > 0) out.push({ step: null, text: `You’ve got ${p.left === 1 ? "a point" : `${p.left} points`} left to spend.` });
  if (!changing && p.left < 0) out.push({ step: null, text: `That’s ${p.spent} points, ${-p.left} past the ${p.start} you start on. Take ${-p.left === 1 ? "a point" : `${-p.left} points`} off, or ask the GM about starting on more.` });
  // Archetypes. An empty slot costs nothing and goes on no sheet, so with
  // none picked at all it's the one nudge.
  const picked = b.archs.filter((a) => a.trim());
  if (!picked.length) out.push({ step: 0, text: "You haven’t got an archetype. At least one’s recommended, but it’s your call." });
  const had = new Map();
  b.archs.forEach((a, i) => {
    const name = a.trim();
    if (!name) {
      if (picked.length) out.push({ step: 0, a: i, text: `Your ${ord(i)} archetype isn’t picked yet. Pick one, or take it off.` });
      return;
    }
    const rule = ARCH.get(name);
    if (!rule) return out.push({ step: 0, a: i, text: `${name} isn’t one of the archetypes any more. Pick another.` });
    const have = b.have[i] ?? [];
    if (!have.length) out.push({ step: 0, a: i, text: `Your ${name} needs the ability it comes with. Pick one off its list.` });
    for (const h of have) {
      if (!rule.abilities.some((x) => x.name === h)) out.push({ step: 0, a: i, text: `${h} isn’t one of the ${name}’s abilities any more. Take it off, or pick another.` });
      // The same ability on two of the same archetype is still the one ability.
      const key = `${name}|${h}`;
      if (had.get(key) === 1) out.push({ step: 0, a: i, text: `${h}’s on more than one of your ${name}s, and it’s the one ability. Pick another for this one.` });
      had.set(key, (had.get(key) ?? 0) + 1);
    }
  });
  // Titles, the same way.
  const titled = b.titles.filter(titleIn);
  if (!titled.length) out.push({ step: 1, text: "You haven’t got a Title. At least one’s recommended, but it’s your call." });
  const seen = new Map();
  b.titles.forEach((t, i) => {
    const which = `Your ${ord(i)} Title`;
    if (!titleIn(t)) {
      if (titled.length) out.push({ step: 1, t: i, text: `${which}’s empty. Fill it in, or take it off.` });
      return;
    }
    if (!t.text.trim()) out.push({ step: 1, t: i, text: `${which} hasn’t got a name.` });
    const sum = sumOf(t.roots);
    if (sum < R.TITLE_ROOTS) out.push({ step: 1, t: i, text: sum ? `${which} has ${sum} of its 5 Root points on your Roots. Put the last ${R.TITLE_ROOTS - sum === 1 ? "one" : R.TITLE_ROOTS - sum} where it lives.` : `${which}’s 5 Root points aren’t on your Roots yet.` });
    const perms = t.perms.filter((x) => x.text.trim());
    if (!perms.length) out.push({ step: 1, t: i, text: `${which} hasn’t got its permission yet. It comes with one.` });
    for (const x of perms) {
      const w = x.text.trim();
      if (!x.root) out.push({ step: 1, t: i, text: `“${w}” needs its Root.` });
      if (!/\s/.test(w)) out.push({ step: 1, t: i, text: `“${w}” is one word. A permission’s a doing word with how, what or where, like “pick a mechanical lock”.` });
      const k = w.toLowerCase();
      seen.set(k, [w, (seen.get(k)?.[1] ?? 0) + 1]);
    }
  });
  for (const [w, k] of seen.values()) if (k > 1) out.push({ step: 1, text: `“${w}” is on your sheet ${k === 2 ? "twice" : `${k} times`}, and the same permission only counts once. Use different words for one of them.` });
  // Items, with the attuned things first.
  const att = b.attuned.filter(thingIn);
  if (!att.length) out.push({ step: 3, kit: "a", text: "You haven’t attuned anything. At least one thing’s recommended, but it’s your call." });
  b.attuned.forEach((a) => {
    if (!thingIn(a)) return;
    const name = cap(a.name.trim() || "Your attuned thing");
    const filled = a.awk.map((w, j) => [w, j]).filter(([w]) => awkIn(w));
    if (!a.name.trim()) out.push({ step: 3, kit: "a", text: "Your attuned thing needs a name." });
    if (!filled.length) out.push({ step: 3, kit: "a", text: `${name} needs the awakening it comes with.` });
    for (const [w] of filled) if (!w.name.trim() || !w.text.trim()) out.push({ step: 3, kit: "a", text: `An awakening on ${a.name.trim() || "your attuned thing"} needs ${!w.name.trim() ? "its name" : "what it does"}.` });
    for (const [w] of filled) if (!w.root) out.push({ step: 3, kit: "a", text: `${w.name.trim() ? `“${w.name.trim()}”` : `An awakening on ${a.name.trim() || "your attuned thing"}`} needs the Root it fits, the one it locks a point of.` });
    const r = roomOf(a);
    const over = filled.filter(([, j]) => !counts(a, j));
    if (over.some(([, j]) => j >= r.all)) out.push({ step: 3, kit: "a", text: `${name} holds ${r.all} at ${r.stage}, so the rest stay off the sheet until it goes up a stage.` });
    else if (over.length) out.push({ step: 3, kit: "a", text: r.stage === "Awakened" ? `${name} only gets a second awakening with a Catch.` : `${name} needs ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))} to hold more than ${r.base}.` });
    if (!changing && a.burden.trim()) out.push({ step: 3, kit: "a", text: `${name} has a Burden, and a thing can’t take one before it’s Tempered.` });
    if (!changing && a.stage !== "Awakened") out.push({ step: 3, kit: "a", text: `${name}’s ${a.stage}, and what you attune starts at Awakened.` });
  });
  // Six items at most, the attuned things among them, and a new
  // character's at tier 3 at most.
  const count = itemCount(b);
  if (count > R.MAX_ITEMS) out.push({ step: 3, kit: "i", text: `That’s ${count} items, your attuned ${att.length === 1 ? "thing" : "things"} among them, and you carry six at most. Take ${count - R.MAX_ITEMS === 1 ? "one" : count - R.MAX_ITEMS} off.` });
  if (!changing) {
    for (const a of att) if (a.tier > R.MAX_START_TIER) out.push({ step: 3, kit: "a", text: `${cap(thingName(a))} is tier ${a.tier}, and what you start with is tier ${R.MAX_START_TIER} at most.` });
    for (const it of b.items.filter(itemIn)) if (it.tier > R.MAX_START_TIER) out.push({ step: 3, kit: "i", text: `${cap(it.text.trim())} is tier ${it.tier}, and what you start with is tier ${R.MAX_START_TIER} at most.` });
  }
  // An awakening needs a point of its Root to lock, or it does nothing.
  const { roots } = rootsOf(b);
  const lock = { Body: 0, Mind: 0, Soul: 0 };
  for (const a of att) a.awk.forEach((w, j) => {
    if (!awkIn(w) || !w.root || !counts(a, j)) return;
    lock[w.root] += 1;
    if (lock[w.root] > roots[w.root]) out.push({ step: 3, kit: "a", text: `“${w.name.trim() || "An awakening"}” locks a point of your ${w.root}, and ${roots[w.root] ? `it hasn’t got another free` : "it’s got none"}, so it does nothing till it has.` });
  });
  if (!changing && !b.keepsake.text.trim()) out.push({ step: 3, kit: "k", text: "You haven’t got a keepsake yet. It’s free." });
  // Two bond threads with the crew to start. A hostile thread lets you write a
  // third bond thread, and three is the most.
  const { bonds, hostile } = threadCount(b);
  if (!changing && bonds < 2) out.push({ step: 4, text: `You’ve written ${bonds === 1 ? "one bond thread" : `${bonds} bond threads`}. You start with two, with the crew.` });
  if (!changing && bonds > 3) out.push({ step: 4, text: `You’ve written ${bonds} bond threads. Three is the most you start with.` });
  else if (!changing && bonds === 3 && !hostile) out.push({ step: 4, text: "A third bond thread comes with a hostile thread, so write one, or take the third bond thread off." });
  if (!changing && hostile > 1) out.push({ step: 4, text: `You’ve written ${hostile} hostile threads. You start with one.` });
  if (!b.aspiration.trim()) out.push({ step: 5, text: "You haven’t written your Aspiration." });
  if (!b.name.trim()) out.push({ step: 6, text: "Your character needs a name." });
  return out;
}

// A permission's likely Root from its words, for a permission idea tapped in
// and for random characters: in your head is Mind, who you are and how you
// carry yourself is Soul, and the rest is your Body.
const MINDISH = /^(know|read|spot|remember|find|tell|feel|sense|hear|see|plan|question|follow a paper|smell|study|notice|recognise|work out)\b/i;
const SOULISH = /^(talk|calm|make (someone|people|an ally)|give orders|bark|lead|bring|hold (a crowd|holy)|get (a crowd|credit|a seat|an audience|sanctuary)|drop a name|pass as|swear|bless|steady|speak|call|command|host|keep a crew|start a rumour|haggle|put (a moment|bad luck)|raise|ward|bar a door|keep a spirit|throw fire|light a room|smother|make a fire|still the|fill a sail|play|sing|make people|charm|carry myself|stop bleeding|draw out|ease)\b/i;
export function guessFor(text, root = "") {
  const words = String(text ?? "").trim();
  const r = MINDISH.test(words) ? "Mind" : SOULISH.test(words) ? "Soul" : root === "Soul" && !/^(fight|shoot|climb|run|move|lift|hold|guard|carry|ride|sail|swim|leap|slip|pick|fix|build|take|make|mix|stitch|live|track)\b/i.test(words) ? "Soul" : "Body";
  return { root: r };
}
// A Title's likely spread from its permissions' Roots: all 5 on one when
// they're all on one, 3 and 2 across two, and 2, 2 and 1 across three, the
// way the 3 used to lean, made 5 the way a saved Title is (R.toFive).
export function spreadFor(roots) {
  const n = noRoots();
  for (const r of roots) if (ROOTS.includes(r)) n[r] += 1;
  const by = ROOTS.filter((r) => n[r]).sort((a, z) => n[z] - n[a]);
  if (!by.length) return noRoots();
  const three = by.length === 1 ? { ...noRoots(), [by[0]]: 3 } : by.length === 2 ? { ...noRoots(), [by[0]]: 2, [by[1]]: 1 } : { Body: 1, Mind: 1, Soul: 1 };
  return R.toFive(three, roots.filter((r) => ROOTS.includes(r)).map((root) => ({ root })));
}

// ---------------------------------------------------------------- downtime's growth

// What a character grew in downtime (state.grown, in the shapes roots.js's
// growRoots reads) written into their build, so it can be changed like
// anything else. Each entry lands where it sat on the sheet: a permission
// after the Title's others, a new Title last, and so on, so the sheet it
// makes is the one the player already had.
// Each item by its key on the sheet: item| and its name, and a second of the
// same name item| its name |2, in the order makeSheet puts them on, the
// attuned things last.
function keyed(b) {
  const out = new Map();
  const seen = new Map();
  for (const [it, name] of [...b.items.filter(itemIn).map((x) => [x, x.text.trim()]), ...b.attuned.filter(thingIn).map((a) => [a, thingName(a)])]) {
    const base = `item|${name}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.set(n > 1 ? `${base}|${n}` : base, it);
  }
  return out;
}
export function foldGrown(raw, grown, B) {
  const b = normalBuild(raw, B);
  if (!Array.isArray(grown) || !grown.length) return b;
  // Empty lines aren't on the sheet, so they go, and a grown line's place
  // among the rest is its place on the sheet. On an attuned thing an
  // awakening's place decides whether it counts, so the ones on the sheet go
  // first, then what downtime grew, then any waiting for room, and
  // everything that was on the sheet is kept on it.
  for (const t of b.titles) t.perms = t.perms.filter((p) => p.text.trim());
  const waiting = new Map();
  const onSheet = new Set();
  for (const a of b.attuned) {
    const on = a.awk.filter((w, j) => awkIn(w) && counts(a, j));
    waiting.set(a, a.awk.filter((w, j) => awkIn(w) && !counts(a, j)));
    for (const w of on) onSheet.add(w);
    a.awk = on;
  }
  const titleAt = (k) => b.titles[b.titles.map((t, i) => (titleIn(t) ? i : -1)).filter((i) => i >= 0)[k]];
  const thingAt = (k) => b.attuned[b.attuned.map((a, i) => (thingIn(a) ? i : -1)).filter((i) => i >= 0)[k]];
  const archAt = (k) => b.archs.map((a, i) => (a.trim() ? i : -1)).filter((i) => i >= 0)[k];
  const words = (v, max = 160) => str(String(v ?? "").trim(), max);
  for (const g of grown) {
    if (!g || typeof g !== "object") continue;
    const text = words(g.text, 120);
    const root = rootOf(g.root);
    if (g.k === "perm") {
      const t = titleAt(g.t);
      if (t && text && slotsOf(t) < MAX_PERMS) t.perms.push({ text, root });
    } else if (g.k === "swap") {
      const t = titleAt(g.t);
      const p = t?.perms[Number(g.j)];
      if (p && text) Object.assign(p, { text, root });
    } else if (g.k === "boon") {
      // Boons are gone, so the permissions one swapped out stay, the way
      // roots.js reads it.
      continue;
    } else if (g.k === "ability") {
      const i = archAt(Number(g.a));
      const name = words(g.name, 60);
      if (i == null || !name) continue;
      if (b.have[i] == null) dealAll(b, B);
      const have = b.have[i] ?? (b.have[i] = []);
      if (!have.includes(name) && have.length < MAX_ABILITIES) have.push(name);
    } else if (g.k === "awk") {
      const a = thingAt(g.a);
      if (!a || !words(g.name, 80)) continue;
      // As growRoots has it, so the sheet's the one the player already had.
      if (words(g.catch, 120)) a.catch = words(g.catch, 120);
      if (words(g.burden, 120)) a.burden = words(g.burden, 120);
      if (a.awk.length < 6) {
        const w = { name: words(g.name, 80), root: rootOf(g.root), text: words(g.text, 240) };
        a.awk.push(w);
        onSheet.add(w);
      }
    } else if (g.k === "stage") {
      const a = thingAt(g.a);
      if (!a) continue;
      if (R.STAGES.includes(g.to) && R.STAGES.indexOf(g.to) > R.STAGES.indexOf(a.stage)) a.stage = g.to;
      if (words(g.catch, 120)) a.catch = words(g.catch, 120);
      if (words(g.burden, 120)) a.burden = words(g.burden, 120);
    } else if (g.k === "thread") {
      // A new thread goes under the bond with that person, if there's one.
      const person = str(bondName(b.threads.map((t) => t.person), g.person), 120);
      if (person && text) b.threads.push({ person, text: str(text, 200), kind: g.kind === "hostile" ? "hostile" : "bond", whose: "" });
    } else if (g.k === "title") {
      if (!text || b.titles.length >= MAX_TITLES) continue;
      // A Title from before stacking had one Root, and all 5 go on it. One
      // grown on stacking was spread 3, so it's made 5 the way it was, for
      // the player to check, the way roots.js reads it.
      const spread = g.roots && typeof g.roots === "object";
      const roots = spread ? fixRoots(g.roots) : root ? { ...noRoots(), [root]: R.TITLE_ROOTS } : noRoots();
      const p = g.perm && typeof g.perm === "object" && words(g.perm.text, 120) ? { text: words(g.perm.text, 120), root: rootOf(g.perm.root) } : blankPerm();
      const three = spread && sumOf(roots) === R.OLD_TITLE_ROOTS;
      b.titles.push({ idea: "", text, roots: three ? R.toFive(roots, p.text ? [p] : []) : roots, perms: [p], ...(!spread && root ? { from: root } : {}), ...(three ? { three: roots } : {}) });
    } else if (g.k === "arch") {
      const arch = words(g.arch, 24);
      if (!arch || b.archs.length >= MAX_ARCHS) continue;
      b.archs.push(arch);
      // One from before stacking came with every ability it had, less any
      // another of the same archetype has.
      b.have.push(Array.isArray(g.have) ? cleanHave(g.have) : null);
      dealAll(b, B);
    } else if (g.k === "attune") {
      const name = words(g.name, 80);
      if (!name || b.attuned.length >= MAX_ATTUNED) continue;
      const w = g.awk && typeof g.awk === "object" && words(g.awk.name, 80) ? [{ name: words(g.awk.name, 80), root: rootOf(g.awk.root), text: words(g.awk.text, 240) }] : [];
      for (const x of w) onSheet.add(x);
      // The item of that name is the thing now, or it's a new one at tier 2.
      const at = b.items.findIndex((it) => itemIn(it) && bareName(it.text) === bareName(name));
      const it = at >= 0 ? b.items.splice(at, 1)[0] : { ...itemFor(name, B), ...(g.kind ? { kind: kindAt(g.kind) } : {}), ...(g.tier ? { tier: tierAt(g.tier) } : {}) };
      b.attuned.push({ name, kind: it.kind, tier: it.tier, root: it.root, props: it.props, stage: "Awakened", catch: "", burden: "", awk: w });
    } else if (g.k === "item") {
      const name = words(g.name, 80);
      if (name) b.items.push(fixItem({ ...g, text: name }));
    } else if (g.k === "tier") {
      // An item's key is item| and its name, and a second of the same name
      // item| its name |2, the way roots.js keys them, attuned things last.
      const it = keyed(b).get(String(g.key ?? ""));
      if (it) it.tier = tierAt(g.to);
    } else if (g.k === "drop") {
      const it = keyed(b).get(String(g.key ?? ""));
      const at = b.items.indexOf(it);
      if (at >= 0) b.items.splice(at, 1);
    }
  }
  for (const a of b.attuned) {
    // Six is the most anything holds, so a waiting line with no room left goes.
    a.awk = [...a.awk, ...(waiting.get(a) ?? [])].slice(0, 6);
    a.awk.forEach((w, j) => {
      if (onSheet.has(w) && !fits(a, j)) w.kept = true;
    });
    atLeast(a.awk, 1, blankAwk);
  }
  for (const t of b.titles) if (!t.perms.length) t.perms.push(blankPerm());
  // An awakening grown before the new core hasn't got a Root, so it's on
  // their biggest till they say, the way roots.js reads it.
  const big = bigOf(b);
  for (const a of b.attuned) for (const w of a.awk) if (awkIn(w) && !w.root) Object.assign(w, { root: big, guessed: true });
  return normalBuild(b, B);
}

// ---------------------------------------------------------------- from before Roots

// A character built on the phone before the Roots change (8 Nov 2026), rebuilt
// on stacking: their Titles and permissions, each permission with its Root
// guessed from its words or the set action it was on (it says which), and
// each Title's 5 Root points spread the way its permissions lean, for the
// player to check, the archetypes their Titles had with every ability, what
// they carry with their armour on their Body, their attuned things with each
// old permission an awakening, as Coin and Kit's did, and their threads,
// answers, Aspiration and trouble. Traits are gone from the rules, so they go.
const CORE = ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"];
const CORE_ROOT = { Study: "Mind", Talk: "Soul" };
export function fromBefore(old, B = null) {
  const r = old && typeof old === "object" ? old : {};
  const b = blankBuild();
  const s = (v, max = 160) => str(typeof v === "string" ? v : v?.text, max).trim();
  const ons = (x) => (Array.isArray(x?.on) ? x.on.filter((a) => typeof a === "string") : []);
  const titles = list(r.titles, MAX_TITLES).filter((t) => s(t) || s(t?.arch) || list(t?.perms, 6).some((p) => s(p)));
  b.archs = atLeast(titles.map((t) => str(t?.arch, 24).trim()).filter(Boolean).slice(0, MAX_ARCHS), 1, () => "");
  b.have = b.archs.map((a) => (a ? null : []));
  dealAll(b, B);
  if (titles.length) {
    b.titles = titles.map((t) => {
      const perms = list(t?.perms, MAX_PERMS).filter((p) => s(p)).map((p) => {
        const on = ons(p);
        const core = on.find((a) => CORE.includes(a));
        const text = s(p, 120);
        return { text, root: core ? CORE_ROOT[core] ?? "Body" : guessFor(text).root, ...(on.length ? { from: `It was on your ${both(on)}` } : {}) };
      });
      const roots = perms.length ? spreadFor(perms.map((p) => p.root)) : s(t) ? { ...noRoots(), [guessFor(s(t)).root]: R.TITLE_ROOTS } : noRoots();
      return { idea: str(t?.idea, 40), text: s(t, 120), roots, perms: perms.length ? perms : [blankPerm()] };
    });
  }
  // What they wore or wielded are items at tier 2, armour on their Body,
  // and clothes that fit some scenes (a size up on Confidence, then) Mind
  // armour. Utility items and the bag are things to say with a Resource now,
  // so they're kept for the notes.
  const items = [];
  for (const e of list(r.equipment, 6)) {
    const text = s(e, 80);
    if (!text) continue;
    const guess = itemFor(text, B);
    const armour = guess.kind === "armour" || (guess.kind !== "guard" && (ons(e).includes("Defend") || e?.armour));
    items.push({ ...guess, text, ...(armour ? { kind: "armour", root: "Body", props: [] } : {}), tier: armour || guess.kind === "guard" ? tierOf(e) + 1 : R.START_TIER });
  }
  const clothes = str(r.clothes, 80).trim();
  if (clothes) items.push({ text: clothes, kind: "armour", tier: R.START_TIER, root: "Mind", props: [] });
  b.items = items;
  const carried = { utility: list(r.utility, 8).map((x) => s(x, 120)).filter(Boolean), bag: String(r.bag ?? "").split("\n").map((x) => x.trim().slice(0, 120)).filter(Boolean) };
  if (carried.utility.length || carried.bag.length) b.carried = carried;
  b.keepsake = { text: s(r.keepsake, 80) };
  const things = list(r.attuned, MAX_ATTUNED).filter((a) => s(a?.name) || list(a?.perms, 6).some((p) => s(p)));
  if (things.length) {
    b.attuned = things.map((a) => ({
      ...(({ text, ...it }) => it)(itemFor(s(a?.name, 80), B)), name: s(a?.name, 80), stage: R.STAGES.includes(a?.stage) ? a.stage : "Awakened", catch: str(a?.catch, 120), burden: str(a?.burden, 120),
      awk: atLeast(list(a?.perms, 6).filter((p) => s(p)).map((p) => ({ name: s(p, 80), root: "", text: "2 steps on every roll you make with it", ...(p?.kept ? { kept: true } : {}) })), 1, blankAwk),
    }));
    // Each one's on their biggest Root till they say.
    const big = bigOf(b);
    for (const a of b.attuned) for (const w of a.awk) if (awkIn(w)) Object.assign(w, { root: big, guessed: true });
  }
  if (Array.isArray(r.threads)) b.threads = r.threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), kind: kindOf(t), whose: str(t?.whose, 40), ...(t?.strained ? { strained: true } : {}) }));
  b.connect = (Array.isArray(r.connect) ? r.connect : []).slice(0, 12).map((a) => str(a, 200));
  for (const k of ["aspiration", "name", "blurb"]) b[k] = str(r[k], k === "name" ? 40 : 160);
  b.pronoun = ["her", "him", "them"].includes(r.pronoun) ? r.pronoun : "them";
  b.trouble = (Array.isArray(r.trouble) ? r.trouble : []).filter((x) => typeof x === "string").slice(0, 12);
  return b;
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
const blankJson = JSON.stringify(normalBuild(blankBuild()));
export const hasDraft = () => {
  const d = readDrafts().new;
  if (!d || JSON.stringify(normalBuild(d.build, null, { fresh: true })) === blankJson) return null;
  return { name: str(d.build?.name, 40) };
};

// A rule from the book as a question bubble's paragraphs: each paragraph and
// each item of a list its own, with what's inside them kept, since a bubble
// says its words in a line.
const paras = (html) => String(html ?? "").replace(/<\/(?:p|li|h\d)>/g, "\n").replace(/<(?:p|li|ul|ol|h\d|div)(?:\s[^>]*)?>|<\/(?:ul|ol|div)>/g, "\n").split(/\n+/).map((x) => x.trim()).filter(Boolean);
// A Trait from the book, however its reader gives it.
const traitOf = (x) => (x && typeof x === "object" ? { name: str(x.name, 60), html: str(x.html, 600) || esc(str(x.text, 600)) } : typeof x === "string" && x ? { name: str(x, 60), html: "" } : { name: "", html: "" });

// ---------------------------------------------------------------- the screens
//
// One step to a screen, for a phone held in one hand, the way a character
// opens: full screen, the crest at the top filling in as the archetypes go on,
// the step's first sentence from the book with the rest of it behind a ?,
// and Back and Next in a bar at the bottom, under the thumb, with the points
// over them. The archetypes go one at a time, the Titles one at a time and
// what you carry a part at a time, and Next walks through them before the
// next step. Everything you pick is a card or a piece from the kit, and while
// the Titles are written, the Roots ride in a dock above the bar as the dice
// they add up to, each one growing into its next shape as a line goes on
// (after()). A blank sheet, one of the crew, random and changing a character
// use the same pieces with every step on one page.

const WAYS = ["blank", "crew", "random"];
const STEPS = [
  { name: "Archetypes", short: "Archetypes" },
  { name: "Titles and permissions", short: "Titles" },
  { name: "Roots", short: "Roots" },
  { name: "Items", short: "Items" },
  { name: "Threads", short: "Threads" },
  { name: "Aspiration", short: "Aspiration" },
  { name: "Check it and play", short: "Check it" },
];
const LAST = STEPS.length - 1;
// Items, a part to a screen: the attuned thing first, for its 5, then the
// rest of your six with what's left, then the keepsake.
const KIT = [["a", "Attuned"], ["i", "Items"], ["k", "Keepsake"]];
const PRO = { her: ["she", "her", "she’s"], him: ["he", "his", "he’s"], them: ["they", "their", "they’re"] };
const PRICE = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };
// Where a Title's 5 Root points go, a tap at a time: All on puts all 5 on
// one Root, + puts one more on a Root, and once all 5 are on, it takes that
// one off the biggest of the others (the last of them on a tie, so Body keeps
// its points longest), and − takes one off. So 3 on Mind and 2 on Body is
// All on Mind and + on Body twice. Downtime spreads a new Title the same way.
export function nudgeSpread(roots, r, how, total = R.TITLE_ROOTS) {
  const out = Object.fromEntries(ROOTS.map((x) => [x, Math.max(0, int(roots?.[x], 0))]));
  if (!ROOTS.includes(r)) return out;
  if (how === "all") return { ...noRoots(), [r]: total };
  if (how === "down") {
    if (out[r] > 0) out[r] -= 1;
    return out;
  }
  if (out[r] >= total) return out;
  if (sumOf(out) >= total) {
    const from = ROOTS.filter((x) => x !== r && out[x] > 0).sort((a, z) => out[z] - out[a] || ROOTS.indexOf(z) - ROOTS.indexOf(a))[0];
    if (!from) return out;
    out[from] -= 1;
  }
  out[r] += 1;
  return out;
}
const spreadSays = (roots) => ROOTS.filter((r) => roots[r]).map((r) => `${r} ${roots[r]}`).join(", ");
// The groups of what a character's points went on.
const SPENT = [["Titles", ["title", "perm"]], ["Archetypes", ["arch", "ability"]], ["Attuned", ["attuned", "awk"]], ["Items", ["item", "tier"]]];
// A link inside a card would be a link inside a button, so cards keep the words only.
const unlink = (html) => String(html ?? "").replace(/<a [^>]*>|<\/a>/g, "");

export function makeBuilder({ B, link, icon, onSave, onLeave, toast, roll, rule = () => "", tools = () => "" }) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  // The tiers' names off the book's table, the way roots.js says them.
  R.useTiers(B.tiers);
  let slotKey = "new";
  let d = null; // { step, deep: {}, page, way, from, build, basis }
  let meta = {}; // for a saved character: { basis, crew, before }, crew being the crew member's name when they're still one
  let saveTimer = 0;
  let refreshTimer = 0;
  let sure = false; // Roll again has been tapped once over changes
  let rolled = ""; // the random build as it was rolled
  let dropping = ""; // something tapped once to take it off
  let slide = ""; // "next" or "back": the way the next screen comes in
  let shown = null; // each Root's dice as last drawn, so a change grows them

  // The steps and the points a tap away from the bar close again with a tap
  // anywhere else, or Escape, which puts the cursor back on them.
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      for (const menu of document.querySelectorAll(".bd-jump[open], .bd-pts[open]")) if (!menu.contains(e.target)) menu.removeAttribute("open");
    });
    document.addEventListener("keydown", (e) => {
      const menu = e.key === "Escape" && document.querySelector(".bd-jump[open], .bd-pts[open]");
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
  function open(key, start, m = {}) {
    slotKey = key || "new";
    let kept = readDrafts()[slotKey];
    const stale = Boolean(kept && changing() && kept.basis !== m.basis);
    if (stale) kept = null;
    const begun = kept ? null : typeof start === "function" ? start() : start;
    const fresh = !changing();
    d = kept
      ? { step: Math.min(LAST, Math.max(0, Number(kept.step) || 0)), deep: kept.deep && typeof kept.deep === "object" ? kept.deep : {}, page: Boolean(kept.page), way: WAYS.includes(kept.way) ? kept.way : "", from: str(kept.from, 40), build: normalBuild(kept.build, B, { fresh }), basis: str(kept.basis, 40) }
      : { step: 0, deep: {}, page: Boolean(begun), way: "", from: "", build: normalBuild(begun ?? blankBuild(), B, { fresh }), basis: str(m.basis, 40) };
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
  function begin(build, way, fromName = "") {
    clearTimeout(saveTimer);
    slotKey = "new";
    d = { step: 0, deep: {}, page: true, way, from: fromName, build: normalBuild(build, B, { fresh: true }) };
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
  const field = (path, label, value, { ph = "", max = 120, area = false, cls = "" } = {}) => {
    const id = `b-${path.replace(/\./g, "-")}`;
    const input = area
      ? `<textarea id="${id}" data-bin="${path}" rows="4" maxlength="${max}" placeholder="${esc(ph || " ")}">${esc(value)}</textarea>`
      : `<input id="${id}" data-bin="${path}"${cls ? ` class="${cls}"` : ""} value="${esc(value)}" maxlength="${max}" autocomplete="off" placeholder="${esc(ph || " ")}">`;
    return `<label class="cc-field" for="${id}">${label}</label>${input}`;
  };
  // A small label with a question bubble beside it.
  const asked = (label, id, words, title, attrs = "") => `<div class="bd-ask"><p class="bd-label"${attrs}>${label}</p>${tip(id, words, title)}</div>`;
  const sigilOf = (name) => (Object.hasOwn(SIGILS, name) ? sigil(name) : "");
  // Which archetype the first step's on, which Title the second's on, and
  // which part of what you carry.
  const archTab = () => Math.min(Math.max(0, Number(d.deep.atab) || 0), Math.max(0, b().archs.length - 1));
  const tabOf = () => Math.min(Math.max(0, Number(d.deep.tab) || 0), Math.max(0, b().titles.length - 1));
  const kitOf = () => (KIT.some(([k]) => k === d.deep.kit) ? d.deep.kit : KIT[0][0]);
  const kitAt = () => KIT.findIndex(([k]) => k === kitOf());

  // The book's words for each step: its first sentence on the screen, and the
  // rest behind a ?.
  const how = (i, where = "") => (B.quick[i]?.more ? tip(`bd-how-${where}${i}`, B.quick[i].more, "How this step works") : "");
  // Adding and taking off. Something with words in it asks for a second tap
  // before it goes.
  const dropBtn = (kind, i, label) => `<button type="button" class="button sm" data-act="b" data-b="drop${kind}" data-i="${i}">${dropping === `${kind}${i}` ? "Tap again to take it off" : label}</button>`;
  const canDrop = (kind) => (kind === "title" ? b().titles.length > 1 : kind === "arch" ? b().archs.length > 1 : kind === "att" ? changing() || b().attuned.length > 1 : changing() || b().threads.length > 3);
  // A card to tap: picked, it's edged in gold with a gold diamond in its corner.
  const card = (cls, attrs, on, inner) => `<button type="button" class="bd-tok ${cls}" data-act="b" ${attrs}${pressed(on)}>${inner}</button>`;
  const rootChips = (attrs, now, label) => `<div class="cc-chips bd-roots" role="group" aria-label="${esc(label)}">${ROOTS.map((r) => chip(r, `${attrs} data-v="${r}"`, now === r, "sm")).join("")}</div>`;

  const backLink = () => `<a class="cc-back" href="/characters/${slotKey === "new" ? "" : `?c=${encodeURIComponent(slotKey)}`}" data-act="b" data-b="leave">${icon.back}${slotKey === "new" ? "Characters" : esc(b().name || "Back")}</a>`;
  const kicker = () => (slotKey === "new" ? "Make your own" : meta.before ? `Rebuilding ${esc(b().name || "your character")}` : `Changing ${esc(b().name || "your character")}`);
  const dropEdit = () => (slotKey === "new" ? "" : `<button type="button" class="button sm" data-act="b" data-b="dropedit">${meta.before ? "Leave the rebuild for now" : "Drop these changes"}</button>`);
  const saveLabel = () => (meta.before ? "Save them on Roots" : changing() ? "Save the changes" : "Save and play");
  // The crest fills in as the archetypes go on: the first in the middle,
  // doubled when it's taken twice, and a second in the seal.
  function crestNow() {
    const arch = b().archs.filter((a) => Object.hasOwn(SIGILS, a));
    try {
      return crest(arch, { strict: false, label: arch.length ? `Crest: ${both([...new Set(arch)])}` : "Crest, waiting on an archetype" });
    } catch {
      return "";
    }
  }
  // One of the crew being changed stops following the chapter once it's
  // saved, one built before Roots moves onto it, and one built before
  // stacking keeps everything and hears what changed and what's theirs to
  // choose.
  // One built before the fixes (17 Nov): its equipment's items now, its
  // utility items and bag are in its notes, and each Boon's 2 points are
  // there to spend.
  function fixesNote() {
    const x = b();
    if (!changing() || !x.fixes || meta.before) return "";
    const [they, their] = PRO[x.pronoun] ?? PRO.them;
    const name = esc(x.name || "They");
    const boons = x.titles.flatMap((t) => t.boonsGone ?? []);
    const over = itemCount(x) - R.MAX_ITEMS;
    const asks = [boons.length ? `${boons.length === 1 ? "a Boon’s" : `${boons.length} Boons’`} ${pts(2 * boons.length)} to spend` : "", over > 0 ? `${over === 1 ? "an item" : `${over} items`} to let go, since you carry six` : ""].filter(Boolean);
    return `<div class="cc-note is-gold bd-fixes" role="status"><p>${name}’s things are items now${asks.length ? `, with ${both(asks)}` : ""}. ${tip("bd-fixes", [`Each thing ${they} wore or wielded is an item at tier 2, armour a tier up from its quality, and a shield’s a guard. Check what kind each one is.`, `Utility items and the bag have gone. What was in them is in ${their} notes, and any of it’s something to say with a Resource now.`, ...(boons.length ? [`Boons have gone from the rules, so ${both(boons.map((y) => `${esc(y.name || `the ${y.lever} Boon`)}`))} ${boons.length === 1 ? "is" : "are"} off ${their} sheet, and the points ${boons.length === 1 ? "it" : "they"} cost are ${their} to spend on anything else.`] : []), link("s-items", "Items in the rules")], "Items now")}</p></div>`;
  }
  function crewNote() {
    return `${crewNote1()}${fixesNote()}`;
  }
  function crewNote1() {
    if (!changing()) return "";
    const x = b();
    const [, their, theyre] = PRO[x.pronoun] ?? PRO.them;
    const name = esc(x.name || "They");
    if (meta.before) return `<div class="cc-note is-gold" role="status"><p>${name} ${theyre === "they’re" ? "were" : "was"} built before the Roots change, so here’s everything that comes across. ${tip("bd-before", [`Each Title’s 5 Root points are spread the way its permissions lean, and each permission’s Root is a guess from its words or the set action it was on (it says which), so check them.`, `${cap(their)} archetypes keep the abilities they had, ${their} attuned things’ permissions are awakenings now, each on ${their} biggest Root till you say, and traits have gone from the rules. What ${PRO[x.pronoun]?.[0] ?? "they"} wore or wielded are items at tier 2, and ${their} utility items and bag are in ${their} notes, things to say with a Resource now. Save it and ${theyre} back in play, with ${their} threads, Aspiration and notes as they were.`], "Rebuilding on Roots")}</p></div>`;
    if (x.stack) {
      const left = pointsOf(x).left;
      const spread = x.titles.filter((t) => t.from).length;
      const asks = [spread ? `${spread === 1 ? "a Title that was" : "each Title that was"} on one Root has all 5 on it, so spread ${spread === 1 ? "it" : "them"} how you like` : "", left > 0 ? `${spread ? "and " : ""}you’ve got ${pts(left)} to spend` : ""].filter(Boolean);
      return `<div class="cc-note is-gold" role="status"><p>${name} keeps everything since the stacking change.${asks.length ? ` ${cap(asks.join(", "))}.` : ""} ${tip("bd-stacked", ["Specialties have gone. A Title puts 5 on your Roots, spread however you like, and a permission puts 1 on its Root, so your Roots are counted again. Each awakening says the Root it locks a point of.", `${cap(their)} archetypes keep every ability they had, and nothing comes off for being past 35.`], "What changed")}</p></div>`;
    }
    if (x.core) {
      const left = pointsOf(x).left;
      const fives = x.titles.filter((t) => t.three).length;
      const guessed = x.attuned.some((a) => a.awk.some((w) => w.guessed));
      const asks = [fives ? `check where ${fives === 1 ? "a Title’s" : "each Title’s"} 2 more Root points went` : "", guessed ? `say which Root each awakening fits` : "", left > 0 ? `you’ve got ${pts(left)} to spend` : ""].filter(Boolean);
      return `<div class="cc-note is-gold" role="status"><p>${name} keeps everything on the new core.${asks.length ? ` ${cap(both(asks))}.` : ""} ${tip("bd-core", ["A Title puts 5 on your Roots now, so each one’s 3 went to 5, spread the way the 3 were, as near as it goes. Each awakening locks a point of the Root it fits, and it’s on your biggest till you say.", `A Root’s number is its dice, the points it takes hits with and the points you spend. Attuned things don’t touch your Aura any more, and the tracks have gone. Save it and ${theyre} back in play.`], "The new core")}</p></div>`;
    }
    if (!meta.crew) return "";
    const crewName = esc(x.name || meta.crew);
    return `<div class="cc-note" role="status"><p>${crewName}’s sheet comes straight off the chapter for now. Save a change here and ${theyre} your own. ${tip("bd-crew", [`When the rules change, ${their} sheet changes too, till a change is saved here. Then ${their} sheet stops following the chapter, and ${their} points, Aura and everything else in play stay as they are.`], "Making them your own")}</p></div>`;
  }

  const topbar = () => `<div class="cc-topbar">${backLink()}<div class="cc-tools">${tools()}</div></div>`;
  function head() {
    const i = d.step;
    const bars = STEPS.map((s, k) => `<li${k < i ? ' class="done"' : k === i ? ' class="on"' : ""}></li>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · Step ${i + 1} of ${STEPS.length}</p><h1 tabindex="-1">${STEPS[i].name}</h1></div></div>
      <ol class="bd-progress" aria-hidden="true">${bars}</ol>
      <p class="bd-lead">${B.quick[i]?.lead ?? ""} ${how(i)}</p></header>${crewNote()}`;
  }

  // Where Next and Back go: through the archetypes, the Titles and the parts
  // of what you carry, then on to the next step.
  function within(fwd) {
    const x = b();
    if (d.step === 0) {
      const a = archTab() + (fwd ? 1 : -1);
      return a >= 0 && a < x.archs.length ? { atab: a, label: `${cap(ord(a))} archetype` } : null;
    }
    if (d.step === 1) {
      const t = tabOf() + (fwd ? 1 : -1);
      return t >= 0 && t < x.titles.length ? { tab: t, label: `${cap(ord(t))} Title` } : null;
    }
    if (d.step === 3) {
      const k = kitAt() + (fwd ? 1 : -1);
      return k >= 0 && k < KIT.length ? { kit: KIT[k][0], label: KIT[k][1] } : null;
    }
    return null;
  }
  // The points over the bar: what's spent and what's left, always in view,
  // and a tap away, what every point went on and what you start on.
  function spentList(p) {
    const groups = SPENT.map(([label, kinds]) => {
      const rows = p.lines.filter((l) => kinds.includes(l.kind));
      if (!rows.length) return "";
      const sum = rows.reduce((t, l) => t + l.cost, 0);
      return `<li class="bd-spent-g"><p><span>${label}</span><b>${sum}</b></p><ul>${rows.map((l) => `<li><span>${esc(l.what)}</span><b>${l.cost}</b></li>`).join("")}</ul></li>`;
    }).join("");
    return groups ? `<ul class="bd-spent">${groups}</ul>` : '<p class="cc-lead">Nothing’s bought yet.</p>';
  }
  // What they start on, a point at a time. It's in the bar's points and on
  // the last step, so each has ids of its own (w).
  function startStepper(w) {
    const x = b();
    return `<div class="bd-start" role="group" aria-labelledby="bd-start-${w}-l"><p class="bd-start-k"><span id="bd-start-${w}-l">Starting on</span> ${tip(`bd-start-${w}`, ["Most characters start on 35 points. For a one-shot with characters further along, or to catch someone up with the rest of the crew, the GM can start you on more."], "Starting on more")}</p>
      <span class="cc-step"><button type="button" class="cc-stepbtn" data-act="b" data-b="start" data-w="${w}" data-v="-1" aria-label="One point less to start on"${x.start <= START ? " disabled" : ""}>−</button><output aria-live="polite">${x.start}</output><button type="button" class="cc-stepbtn" data-act="b" data-b="start" data-w="${w}" data-v="1" aria-label="One point more to start on"${x.start >= MAX_START ? " disabled" : ""}>+</button></span></div>`;
  }
  function pointsBar() {
    const p = pointsOf(b());
    const over = p.left < 0;
    const kept = changing() && p.left <= 0;
    const fill = Math.max(0, Math.min(100, Math.round((100 * p.spent) / Math.max(1, p.start))));
    const big = kept ? `<b>${p.spent}</b> points on the sheet` : over ? `<b>${-p.left}</b> over` : `<b>${p.left}</b> left`;
    const small = kept ? `${p.start} to start` : `${p.spent} of ${p.start} spent`;
    return `<details class="bd-pts${over && !kept ? " is-over" : ""}${!p.left ? " is-done" : ""}" data-open="bd-pts"${d.deep.pts === true ? " open" : ""}>
      <summary><span class="bd-pts-bar" aria-hidden="true"><i style="width:${fill}%"></i></span><span class="bd-pts-say"><span class="sr-only">Points: </span>${big}<small>, ${small}</small></span></summary>
      <div class="bd-pts-in"><p class="bd-label">What your points went on</p>${spentList(p)}<p class="bd-pts-sum"><span>Spent</span><b>${p.spent} of ${p.start}</b></p>${startStepper("bar")}</div></details>`;
  }
  // The bar at the bottom: the points, then Back, the steps a tap away, and Next.
  function bar() {
    const i = d.step;
    const ahead = within(true);
    const back = !d.page && (i > 0 || within(false));
    const next = d.page || (i === LAST && !ahead)
      ? `<button type="button" class="button primary bd-next" data-act="b" data-b="save">${saveLabel()}</button>`
      : `<button type="button" class="button primary bd-next" data-act="b" data-b="next"><span>Next</span><small>${esc(ahead ? ahead.label : STEPS[i + 1].short)}</small></button>`;
    const reroll = d.page && d.way === "random" ? `<button type="button" class="button bd-back" data-act="b" data-b="reroll">${sure ? "Tap again to lose your changes" : "Roll again"}</button>` : "";
    return `<div class="bd-foot"><div class="bd-foot-pts">${pointsBar()}</div><div class="bd-foot-in" role="group" aria-label="${d.page ? "Save" : "Steps"}">
      ${back ? '<button type="button" class="button bd-back" data-act="b" data-b="back">Back</button>' : ""}${reroll}${jump()}${next}</div></div>`;
  }
  // Every step, or every part on one page, a tap from the bar.
  function jump() {
    const i = d.step;
    const rows = STEPS.map((s, k) => {
      const now = !d.page && k === i;
      return `<li><button type="button" class="bd-dot${now ? " is-now" : ""}" data-act="b" data-b="go" data-s="${k}"${now ? ' aria-current="step"' : ""}><span class="n">${k + 1}</span><span>${s.name}</span></button></li>`;
    }).join("");
    return `<details class="bd-jump"><summary>${d.page ? "Parts" : `<span class="sr-only">Step </span>${i + 1}<span class="of"> of ${STEPS.length}</span>`}</summary><div class="bd-jumps"><p class="bd-label">${d.page ? "Go to a part" : "Go to a step"}</p><ol>${rows}</ol></div></details>`;
  }

  // Every step on one page, for a blank sheet, one of the crew, random,
  // changing a saved character or rebuilding one.
  function pageView() {
    const [, their] = PRO[b().pronoun] ?? PRO.them;
    const title = meta.before ? `${cap(their)} sheet on Roots` : changing() ? `Change anything on ${their} sheet` : { blank: "A blank sheet", crew: `From ${esc(d.from || "the crew")}`, random: "Random" }[d.way] ?? "All on one page";
    const parts = BODIES.map((body, i) => `<section class="bd-part" aria-labelledby="bd-part-${i}">${part(i)}</section>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · All on one page</p><h1 tabindex="-1">${title}</h1></div></div>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">Go step by step</button></div></header>
      ${crewNote()}
      <div class="bd-body bd-page">${parts}</div>
      <p class="cc-lead bd-saved">${link("s-quick", "The Quick Build in the rules")}. Your work’s saved on this phone as you go.</p>
      ${dropEdit() ? `<div class="cc-row">${dropEdit()}</div>` : ""}${bar()}`;
  }

  // A switch at the top of a step that goes one at a time: one segment for
  // each archetype or Title.
  function switchOf(kind) {
    const x = b();
    const items = kind === "arch" ? x.archs : x.titles;
    if (items.length < 2) return "";
    const at = kind === "arch" ? archTab() : tabOf();
    return `<div class="bd-switch" role="group" aria-label="${kind === "arch" ? "Your archetypes" : "Your Titles"}">${items.map((it, i) => {
      const name = kind === "arch" ? it : it.text.trim();
      const says = name || (kind === "arch" ? "Not picked yet" : "No name yet");
      const sig = kind === "arch" && it ? `<span class="bd-sig">${sigilOf(it)}</span>` : "";
      return `<button type="button" class="bd-seg" data-act="b" data-b="${kind === "arch" ? "atab" : "tab"}" data-t="${i}"${i === at ? ' aria-current="true"' : ""}>${sig}<span class="bd-seg-text"><small>${cap(ord(i))} ${kind === "arch" ? "archetype" : "Title"}</small><b>${esc(says)}</b></span></button>`;
    }).join("")}</div>`;
  }
  // The same archetype taken again makes its Push bigger.
  function raised() {
    const taken = new Map();
    b().archs.forEach((a, i) => {
      if (!a) return;
      const t = taken.get(a) ?? { n: 0, push: false };
      t.n += 1;
      t.push ||= (b().have[i] ?? []).some((h) => /^Push$/i.test(h));
      taken.set(a, t);
    });
    return [...taken].filter(([, t]) => t.n > 1 && t.push).map(([a, t]) => `<p class="cc-note" role="status">${esc(a)} ${t.n === 2 ? "twice" : `${t.n} times`}, so your Push is +${t.n + 1}.</p>`).join("");
  }

  // Step 1: archetypes, picked by their sigils and what they're for, each
  // with its mechanic, its Trait and its abilities, the one it comes with
  // picked and more for a point each.
  function stepArch() {
    const x = b();
    const which = d.page ? x.archs.map((_, i) => i) : [archTab()];
    const add = x.archs.length < MAX_ARCHS ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addarch">Add another archetype</button><span class="bd-cost">${pts(5)}</span></div>` : "";
    return `${d.page ? "" : switchOf("arch")}${which.map((i) => archView(x.archs[i], i)).join("")}${raised()}${add}`;
  }
  function archView(name, i) {
    const a = ARCH.get(name);
    // A step at a time, an empty slot shows every card. On one page they wait
    // behind a tap, so the page isn't seventeen cards an archetype.
    const picking = d.deep[`pick${i}`] === true || (!a && !d.page);
    const legend = `Your ${ord(i)} archetype`;
    const grid = picking ? `<p class="bd-label" id="bd-archs-${i}">${a ? "Pick a different archetype" : "Pick one, for 5 points"}</p><div class="bd-archs" role="group" aria-labelledby="bd-archs-${i}">${B.archetypes.map((r) => card("bd-arch", `data-b="arch" data-t="${i}" data-v="${esc(r.name)}"`, name === r.name, `<span class="bd-sig">${sigilOf(r.name)}</span><b>${esc(r.name)}</b><span class="bd-for">${esc(r.for)}</span>`)).join("")}</div>` : "";
    const chosen = a ? `<div class="bd-chosen" tabindex="-1" role="group" aria-label="${esc(`${cap(legend.toLowerCase())}: ${a.name}`)}"><span class="bd-sig is-on">${sigilOf(a.name)}</span><span class="bd-chosen-text"><b>${esc(a.name)}</b><span class="bd-for">${esc(a.for)}</span></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">${picking ? "Keep it" : "Change"}</button></div>` : "";
    const none = !a && !picking ? `<div class="bd-chosen is-none"><span class="bd-sig"></span><span class="bd-chosen-text"><b>${name ? `${esc(name)} isn’t one any more` : "No archetype yet"}</b></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">Pick one</button></div>` : "";
    return `<fieldset class="bd-title bd-archset"><legend${d.page ? "" : ' class="sr-only"'}>${legend}</legend>${chosen}${none}${grid}${a && !picking ? archWhat(a, i) : ""}
      ${canDrop("arch") ? `<div class="cc-row">${dropBtn("arch", i, "Take this archetype off")}</div>` : ""}</fieldset>`;
  }
  function archWhat(a, i) {
    const x = b();
    const have = x.have[i] ?? [];
    const trait = traitOf(a.trait);
    // What another of the same archetype has already.
    const twin = new Set(x.archs.flatMap((n, k) => (k !== i && n === a.name ? x.have[k] ?? [] : [])));
    // Each ability's its name and its Aura, a tap to pick it, and what it
    // does behind its ?, so ten of them fit on a phone's screen.
    const abil = (ab, j) => {
      const k = have.indexOf(ab.name);
      const say = k === 0 ? "Comes with it" : k > 0 ? "1 point" : twin.has(ab.name) ? `On your other ${esc(a.name)}` : "";
      const aura = Math.max(1, Number(ab.cost) || 1);
      return `<div class="bd-abil-row">${card(`bd-abil${twin.has(ab.name) && k < 0 ? " is-twin" : ""}`, `data-b="abil" data-t="${i}" data-v="${esc(ab.name)}"`, k >= 0, `<b>${esc(ab.name)}</b><small>${aura} Aura</small>${say ? `<span class="bd-badge">${say}</span>` : ""}`)}${tip(`bd-ab-${i}-${j}`, [...paras(ab.html ?? esc(ab.text)), `${aura} Aura each time you use it.`], ab.name)}</div>`;
    };
    const cost = have.length ? `${have.length} picked, ${pts(4 + have.length)} with the archetype` : "pick the one it comes with";
    return `<div class="bd-arch-what">
      <p class="bd-label">Its mechanic</p><p class="bd-mech">${a.summary}</p>
      ${trait.name ? `<p class="bd-label">Its Trait <small>always true of you</small></p><p class="bd-mech"><b>${esc(trait.name)}.</b> ${trait.html}</p>` : ""}
      ${asked(`Its abilities <small>${cost}</small>`, `bd-ab-${i}`, [`An archetype’s ${pts(5)}, and it comes with one ability, your pick, Push included. The first you pick is the one it comes with, and each one after that is a point, up to six.`, `An ability costs Aura each time you use it, 1 unless it says. Tap an ability’s ? to read what it does.`], "Abilities", ` id="bd-ab-${i}-l"`)}
      <div class="bd-abils" role="group" aria-labelledby="bd-ab-${i}-l">${a.abilities.map(abil).join("")}</div>
      <p class="cc-small">${link(a.id, `The ${esc(a.name)} in full`)}</p></div>`;
  }

  // Step 2: name each Title, put its 5 Root points on your Roots, and write
  // its permissions, each with its Root, three to start and six at most.
  function stepTitles() {
    const x = b();
    const which = d.page ? x.titles.map((_, i) => i) : [tabOf()];
    const add = x.titles.length < MAX_TITLES ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addtitle">Add another Title</button><span class="bd-cost">${pts(5)}, with a permission</span></div>` : "";
    return `${d.page ? "" : switchOf("title")}${which.map((i) => titleView(x.titles[i], i)).join("")}${add}
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="1"${pressed(d.deep[1])}>${d.deep[1] ? "Fewer permission ideas" : "More permission ideas"}</button></div>
      ${d.page ? "" : rootTiles({ rail: true })}`;
  }
  // Title ideas as cards: the ones that suit your archetypes, or every one.
  function ideasOf(t, i) {
    const archs = b().archs.filter(Boolean);
    const all = d.deep[`ideas${i}`] === true || !archs.length;
    const suits = B.ideas.filter((idea) => idea.archetypes.some((a) => archs.includes(a)));
    const shownIdeas = all ? B.ideas : suits;
    const groups = [...new Set(shownIdeas.map((idea) => idea.group))];
    const one = (idea) => card("bd-idea", `data-b="idea" data-t="${i}" data-v="${idea.id}"`, t.idea === idea.id, `<b>${esc(idea.name)}</b><span class="bd-for">${esc(cap(idea.playsLike))}</span>`);
    const cards = all ? groups.map((g) => `<p class="bd-label">${esc(g)}</p><div class="bd-cards">${shownIdeas.filter((idea) => idea.group === g).map(one).join("")}</div>`).join("") : `<div class="bd-cards">${shownIdeas.map(one).join("")}</div>`;
    const open = d.deep[`idea${i}`] ?? !d.page;
    return `<details class="bd-more bd-ideas" data-open="bd-ideas-${i}"${open ? " open" : ""}><summary>A Title idea, if you like${t.idea && IDEA.get(t.idea) ? ` <small>${esc(IDEA.get(t.idea).name)}</small>` : ""}</summary>
      ${shownIdeas.length ? cards : `<p class="cc-lead">None of the ideas lists your archetypes, so write your own Title, or look through every idea.</p>`}
      ${archs.length ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="ideas" data-t="${i}"${pressed(all)}>${all ? "Just the ones that suit your archetypes" : "Every Title idea"}</button></div>` : ""}</details>`;
  }
  // Where a Title's 5 Root points go: All on for one Root in a tap, and a
  // stepper on each Root (nudgeSpread).
  function spreadView(t, i) {
    const sum = sumOf(t.roots);
    const was1 = t.from ? `<p class="cc-note is-gold bd-was" role="status">It was all on your ${t.from}, so it still is. Spread it how you like.</p>` : "";
    const was3 = t.three ? `<p class="cc-note is-gold bd-was" role="status">It was ${esc(spreadSays(t.three))}, so its 5 are spread the same way. Change it if you like.</p>` : "";
    const step = (r) => `<div class="cc-stepper bd-spread-row"><span>${r}</span><span class="cc-step"><button type="button" class="cc-stepbtn" data-act="b" data-b="snudge" data-t="${i}" data-v="${r}" data-n="-1" aria-label="${r}: one less"${t.roots[r] > 0 ? "" : " disabled"}>−</button><output aria-live="off">${t.roots[r]}</output><button type="button" class="cc-stepbtn" data-act="b" data-b="snudge" data-t="${i}" data-v="${r}" data-n="1" aria-label="${r}: one more${sum >= R.TITLE_ROOTS ? ", off the biggest of the others" : ""}"${t.roots[r] >= R.TITLE_ROOTS ? " disabled" : ""}>+</button></span></div>`;
    return `${asked(`Its 5 Root points <small>${sum ? `${esc(spreadSays(t.roots))}${sum < R.TITLE_ROOTS ? `, ${R.TITLE_ROOTS - sum} to go` : ""}` : "Body, Mind or Soul"}</small>`, `bd-spread-${i}`, ["A Title puts 5 on your Roots, spread however you like. Put them where the Title lives.", "All on puts all 5 on one Root. Then + moves one more onto a Root, off the biggest of the others, so 3 on your Mind and 2 on your Body is All on Mind and + on Body twice.", "Body’s what your hands and feet do, Mind’s what goes on in your head, and Soul’s who you are and how you carry yourself."], "Spreading a Title", ` id="bd-spread-${i}-l"`)}
      ${was1}${was3}<div class="bd-spread" role="group" aria-labelledby="bd-spread-${i}-l">
      <div class="cc-chips" role="group" aria-label="All 5 on one Root">${ROOTS.map((r) => chip(`All on ${r}`, `data-b="sall" data-t="${i}" data-v="${r}"`, t.roots[r] === R.TITLE_ROOTS, "sm")).join("")}</div>
      ${ROOTS.map(step).join("")}</div>`;
  }
  function permRow(t, i, p, j) {
    const says = j === 0 ? "comes with the Title" : "1 point";
    return `<div class="bd-perm">${field(`t${i}.p${j}`, `Permission ${j + 1} <small>${says}${p.from ? `. ${esc(p.from)}` : ""}</small>`, p.text, { ph: "a doing word, and how, what or where", max: 120 })}
      <div class="bd-perm-how">${rootChips(`data-b="proot" data-t="${i}" data-j="${j}"`, p.root, `The Root for permission ${j + 1}`)}</div></div>`;
  }
  function titleView(t, i) {
    const idea = IDEA.get(t.idea);
    const used = new Set(t.perms.map((p) => p.text.trim().toLowerCase()));
    const offer = (perms) => `<div class="cc-chips bd-perms">${perms.map((p) => chip(`<em>${esc(p)}</em>`, `data-b="perm" data-t="${i}" data-v="${esc(p)}"`, used.has(p.toLowerCase()))).join("")}</div>`;
    const slots = slotsOf(t);
    const cost = titleIn(t) ? pointsOf({ ...b(), titles: [t], archs: [], have: [], attuned: [], items: [] }).spent : 0;
    return `<fieldset class="bd-title"><legend${d.page ? "" : ' class="sr-only"'}>Your ${ord(i)} Title</legend>
      ${ideasOf(t, i)}
      ${field(`t${i}.text`, `Your Title <small>${cost ? `${pts(cost)} with what’s on it` : pts(5)}</small>`, t.text, { ph: "Make it specific: the best blade in the Low Market", max: 120 })}
      ${idea ? `<p class="bd-label">Or one of the ${esc(idea.name)} idea’s Titles</p><div class="bd-cards is-one">${idea.titles.map((name) => card("bd-name", `data-b="title" data-t="${i}" data-v="${esc(name)}"`, t.text.trim() === name, `<em>${esc(name)}</em>`)).join("")}</div>` : ""}
      ${spreadView(t, i)}
      ${asked(`Its permissions <small>${slots} of 6 slots</small>`, `bd-perms-${i}`, ["A permission’s something your character can do, a doing word and how, what or where, and it has to fit inside its Title. It puts 1 on the Root it’s written with, and it’s a step on every roll it fits.", "The Title comes with one, and each one after that is a point. Six slots is the most a Title holds.", "The quick test: is it something you can do? Can you picture the moment you’d use it? Would it come up a few times a session? Does it fit inside your Title, and its Root? Four yeses and it’s a permission."], "Permissions")}
      ${t.perms.map((p, j) => permRow(t, i, p, j)).join("")}
      ${slots < MAX_PERMS && t.perms.every((p) => p.text.trim()) ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addperm" data-t="${i}">Add a permission</button><span class="bd-cost">${pts(1)}</span></div>` : slots >= MAX_PERMS ? '<p class="cc-lead">That’s all six slots. Six is the most a Title holds.</p>' : ""}
      ${idea ? `<p class="cc-small">Tap one of the ${esc(idea.name)} idea’s permissions to put it in, and tap it again to take it out. Its Root’s a guess, so check it.</p>${offer(idea.permissions)}` : ""}
      ${d.deep[1] ? B.permIdeas.map((g) => `<p class="bd-label">${esc(g.for)}</p>${offer(g.perms)}`).join("") : ""}
      ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
  }

  // The Roots as the dice they add up to. While the Titles are written they
  // ride in a dock just above the bar.
  function rootTiles({ rail = false } = {}) {
    const { roots } = rootsOf(b());
    const tile = (key, name, n) => {
      const dice = n ? stepsToDice(n) : [];
      return `<div class="tile${n ? "" : " is-none"}" role="listitem"><span class="tile-dice" data-for="${esc(key)}" aria-hidden="true">${dice.length ? dice.map((s, j) => kitDie(s, { hide: true, cls: j ? "is-next" : "" })).join("") : '<span class="bd-zero">0</span>'}</span><span class="tile-name">${esc(name)}</span><span class="tile-says"><span class="tile-steps">${n} step${n === 1 ? "" : "s"}</span><span class="tile-dot">, </span><span class="tile-die">${dice.length ? diceLabel(dice) : "nothing yet"}</span></span></div>`;
    };
    return `<div class="bd-tiles${rail ? ' bd-rail" tabindex="0"' : ' bd-grid"'} role="list" aria-label="Your Roots">${ROOTS.map((r) => tile(`root:${r}`, r, roots[r])).join("")}</div>`;
  }
  // The sheet the build makes, for everything on it that can be a step.
  const draftSheet = () => R.rootsSheet(makeSheet({ id: "draft", name: b().name || "Draft", hash: "own" }, b(), B, { draft: true }), [], B);
  // Step 3: what the Roots add up to and where each one comes from, what
  // each holds once its awakenings have locked their points, and the
  // awakenings, the one thing besides a Root that's steps on a roll.
  function stepRoots() {
    const { roots, from: whence } = rootsOf(b());
    const c = draftSheet();
    const locks = R.lockedOf(c);
    const wakes = R.awakeningsOf(c);
    const holds = (r) => (locks[r] ? `, holds ${roots[r] - locks[r]}` : "");
    const row = (name, n, ways) => `<li><span class="bd-num-text"><span class="k">${esc(name)}</span> <b>${n}</b>${holds(name)}${ways.length ? ` <small>${esc(both(ways))}</small>` : ""}</span>${n ? kitDie(stepsToDice(n)[0], { hide: true, bare: true }) : ""}</li>`;
    const awk = wakes.map((w) => `<li><span class="k">${esc(w.root ?? "")}</span> <span class="bd-thing">${esc(w.name)}</span> <small>${w.works ? "locks a point of it" : `nothing to lock on your ${esc(w.root ?? "")}, so it does nothing yet`}</small></li>`).join("");
    const zero = ROOTS.filter((r) => !roots[r] && sumOf(roots));
    return `${rootTiles()}
      <h2><span>Your Roots</span> ${tip("bd-roll", ["A Root’s number is three things at once: the dice it rolls, the points it takes hits with, and the points you spend from it. Body 8 rolls a d12 and a d4, and takes 8 hits before it’s wounded.", "A roll’s one Root at full, the one that fits how you’re doing it. Bring another in with a permission that explains it, for a point of that Root or 3 Aura, and all of it goes on too.", link("s-roots", "Roots in the rules")], "What a Root is")}</h2><ul class="bd-nums bd-from-list">${ROOTS.map((r) => row(r, roots[r], whence[r])).join("")}</ul>
      ${zero.length ? `<p class="cc-small">${both(zero)} at 0 has no points, so the first hit there wounds you, unless you take it on another Root for 2.</p>` : ""}
      ${awk ? `<h2><span>Your awakenings</span> ${tip("bd-wake", ["Each one locks a point of its Root while it’s attuned, so the Root holds a point less, but its dice don’t shrink. It’s 2 steps on any roll it fits, and 2 more for each Aura you put in it."], "Awakenings on a roll")}</h2><ul class="bd-things">${awk}</ul>` : ""}`;
  }

  // Step 4: items, picked from cards a part at a time, the attuned things
  // first, then the rest of your six, then the keepsake.
  function kitSwitch() {
    const x = b();
    const says = { a: x.attuned.some((a) => a.name.trim()) ? `${x.attuned.filter((a) => a.name.trim()).length} attuned` : "Not yet", i: `${itemCount(x)} of ${R.MAX_ITEMS}`, k: x.keepsake.text.trim() ? "Taken" : "Not yet" };
    return `<div class="bd-switch is-kit" role="group" aria-label="Items">${KIT.map(([k, name]) => `<button type="button" class="bd-seg" data-act="b" data-b="kit" data-v="${k}"${k === kitOf() ? ' aria-current="true"' : ""}><span class="bd-seg-text"><small>${says[k]}</small><b>${name}</b></span></button>`).join("")}</div>`;
  }
  // The tiers an item can be: 2 or 3 for a new character, and any of the six
  // on a saved one, since Grow, money and the story raise them. Each says its
  // name off the book's table.
  const tiersFor = (now) => (changing() ? [1, 2, 3, 4, 5, 6] : [...new Set([R.START_TIER, R.MAX_START_TIER, now])].sort((p, q) => p - q));
  const tierChips = (attrs, now, label, attuned = false) => `<div class="cc-chips bd-tiers" role="group" aria-label="${esc(label)}">${tiersFor(now).map((t) => chip(`${esc(R.tierName(t))} <small>${t}${!changing() && t > R.START_TIER ? ", a point more" : !changing() && attuned ? ", in its 5" : ""}</small>`, `${attrs} data-v="${t}"`, now === t, "sm")).join("")}</div>`;
  const kindChips = (attrs, now, label) => `<div class="cc-chips bd-kinds" role="group" aria-label="${esc(label)}">${KINDS.map((k) => chip(KIND_NAME[k], `${attrs} data-v="${k}"`, now === k, "sm")).join("")}</div>`;
  // What each kind does, off the book's own table, for a ?.
  const kindsTip = (id) => tip(id, [...(B.kinds ?? []).map((k) => `<b>${esc(k.name)}.</b> ${unlink(k.html)}`), link("s-item-kinds", "Kinds of item")], "Kinds of item");
  const propsTip = (id) => tip(id, [...(B.props ?? []).map((p) => `<b>${esc(p.name)}.</b> ${unlink(p.html)}`), link("s-weapon-props", "Weapon properties")], "Weapon properties");
  // An item as it's said, its tier's name first: a Proven set of picks.
  const itemSays = (name, tier) => cap(R.itemSaid({ name, tier }));
  // What kind it is and what it's doing, in a few words.
  const kindSays = (it) => `${KIND_NAME[it.kind].toLowerCase()}${it.kind === "armour" ? `, soaks ${it.tier} on your ${it.root || "Body"}` : it.kind === "guard" ? `, ${it.tier} steps getting out of the way` : it.kind === "pack" ? `, ${R.packRes(it.tier)} more ${R.packRes(it.tier) === 1 ? "Resource" : "Resources"}` : it.kind === "vessel" ? `, holds ${it.tier} charge` : `, ${it.tier} steps when it fits`}`;
  // An item's kind, tier, Root and properties, the same for any item and
  // for an attuned thing (w is a for the attuned thing, and i for an item).
  function itemHow(it, w, k) {
    const at = `data-i="${k}" data-w="${w}"`;
    return `<p class="bd-label" id="bd-${w}k-${k}">What kind of item ${kindsTip(`bd-${w}kt-${k}`)}</p>${kindChips(`data-b="ikind" ${at}`, it.kind, "What kind of item")}
      <p class="bd-label">Its tier <small>the steps it adds</small></p>${tierChips(`data-b="itier" ${at}`, it.tier, "Its tier", w === "a")}
      ${it.kind === "armour" ? `<p class="bd-label">The Root it soaks on</p>${rootChips(`data-b="iroot" ${at}`, it.root || "Body", "The Root it soaks on")}` : ""}
      ${it.kind === "weapon" ? `<details class="bd-more bd-props" data-open="bd-pr-${w}${k}"${d.deep[`pr${w}${k}`] === true ? " open" : ""}><summary>Its properties <small>${esc(it.props.join(", ") || "none yet")}</small></summary><p class="cc-small">What it can do that another weapon can’t. ${propsTip(`bd-${w}pt-${k}`)}</p><div class="cc-chips">${(B.props ?? []).map((p) => chip(esc(p.name), `data-b="iprop" ${at} data-v="${esc(p.name)}"`, it.props.includes(p.name), "sm")).join("")}</div></details>` : ""}`;
  }
  function stepCarry() {
    const x = b();
    const n = numbersOf(x);
    const group = (name) => B.items.find((g) => g.group === name)?.items ?? [];
    const count = itemCount(x);
    const full = count >= R.MAX_ITEMS;
    const bare = (label) => label.replace(/ ?<small>[\s\S]*<\/small>/, "");
    // Something you carry, or a signature thing: one often makes the best
    // thing to attune. One of your items attuned moves off your other items,
    // since it's one of your six already.
    const pick = (i, a, items) => `<div class="bd-items">${items.map((v) => card("bd-item", `data-b="fill" data-p="a${i}.name" data-v="${esc(v)}"`, a.name.trim() === v, `<b>${esc(cap(v))}</b>`)).join("")}</div>`;
    const mine = (i) => x.items.map((it, k) => [it, k]).filter(([it]) => itemIn(it));
    const yours = (i, a) => `<div class="bd-namepick">${mine(i).length ? `<p class="bd-label">Or one of your items</p><div class="bd-items">${mine(i).map(([it, k]) => card("bd-item", `data-b="attitem" data-i="${i}" data-v="${k}"`, false, `<b>${esc(itemSays(it.text.trim(), it.tier))}</b>`)).join("")}</div>` : ""}<p class="bd-label">Or a signature thing</p>${pick(i, a, group("Signature"))}</div>`;
    // What the attuned thing is as an item: one of your six, behind a fold
    // with what it is now on it.
    const asItem = (a, i) => `<details class="bd-more bd-asitem" data-open="bd-ai-${i}"${d.deep[`ai${i}`] === true ? " open" : ""}><summary>As an item <small>${esc(itemSays(KIND_NAME[a.kind].toLowerCase(), a.tier))}, one of your six</small></summary>${itemHow(a, "a", i)}</details>`;
    const catches = (i, a) => `<div class="bd-items is-wide bd-catches">${B.catches.map((c) => card("bd-item", `data-b="fill" data-p="a${i}.catch" data-v="${esc(c.name)}"`, a.catch.trim() === c.name, `<b>${esc(c.name)}</b><span class="bd-for">${esc(c.text)}</span>`)).join("")}</div>`;
    const drop = (i) => (canDrop("att") ? `<div class="cc-row">${dropBtn("att", i, "Take it off")}</div>` : "");
    // An awakening: its name, the Root it fits (which it locks a point of),
    // and what it does.
    const awkRow = (a, i, w, j, label) => `<div class="bd-awk">${field(`a${i}.w${j}.name`, label, w.name, { max: 80, ph: j ? "Hit anything I can see" : "Anywhere I can throw a hook" })}
      <p class="bd-label" id="bd-awr-${i}-${j}">The Root it fits <small>${w.root ? `it locks a point of your ${w.root}${w.guessed ? ", till you say" : ""}` : "it locks a point of it"}</small></p><div class="cc-chips bd-roots" role="group" aria-labelledby="bd-awr-${i}-${j}">${ROOTS.map((r) => chip(r, `data-b="awkroot" data-i="${i}" data-j="${j}" data-v="${r}" aria-label="${esc(`${bare(label)}: ${r}`)}"`, w.root === r && !w.guessed, "sm")).join("")}</div>
      ${field(`a${i}.w${j}.text`, `<span class="sr-only">${bare(label)}: </span>What it does`, w.text, { max: 240, ph: "2 steps on every roll I make with it" })}</div>`;
    const awkTip = (i) => tip(`bd-awk-${i}`, ["An awakening’s something the thing itself does, written the way you’d write a permission, with the Root it fits.", "It locks a point of that Root for as long as it’s attuned, so you hold a point less there, but you still roll all of it. It’s 2 steps on any roll it fits, on top of the thing’s tier, and each Aura you put in it as you roll is 2 more.", link("s-attunement", "Attunement")], "Awakenings");
    // The Quick Build's: Awakened, one awakening, and a second with a Catch.
    const quick = (a, i) => `<fieldset class="bd-box bd-att"><legend>${x.attuned.length > 1 ? `Attuned thing ${i + 1}` : "Your attuned thing"} <small>${pts(5)}</small></legend>
      ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a grappling line" })}${yours(i, a)}${asItem(a, i)}
      <div class="bd-ask"><p class="bd-label">Its awakening <small>it comes with one</small></p>${awkTip(i)}</div>
      ${awkRow(a, i, a.awk[0], 0, "Its awakening")}
      ${field(`a${i}.catch`, "Its Catch, if you’d like a second awakening, free", a.catch, { max: 60, ph: "Wanted" })}${catches(i, a)}
      ${a.catch.trim() || awkIn(a.awk[1] ?? blankAwk()) ? awkRow(a, i, a.awk[1] ?? blankAwk(), 1, "Its second awakening") : ""}${drop(i)}</fieldset>`;
    // A saved character's, at any stage, with up to six awakenings.
    const grown = (a, i) => {
      const r = roomOf(a);
      const off = (j) => (j >= r.all ? "until it goes up a stage" : `until it’s got ${both(r.missing.map((m) => (m === "catch" ? "its Catch" : "its Burden")))}`);
      return `<fieldset class="bd-box bd-att is-grown"><legend>Attuned thing ${i + 1}</legend>
        ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a grappling line" })}${yours(i, a)}${asItem(a, i)}
        <p class="bd-label" id="bd-stage-${i}">Its stage</p><div class="cc-chips" role="group" aria-labelledby="bd-stage-${i}">${R.STAGES.map((st) => chip(st, `data-b="stage" data-i="${i}" data-v="${st}"`, r.stage === st)).join("")}</div>
        <p class="cc-small">${r.stage} holds ${r.base}, and ${r.base} more with ${PRICE[r.stage]}. ${tip(`bd-stages-${i}`, ["An attuned thing grows in three stages, and each new stage needs a material, found in the story or bought. Awakened holds 1, and 1 more with a Catch. Tempered holds 2, and 2 more with a Burden. Perfected holds 3, and 3 more with a Burden and a Catch.", link("attunement-stages", "The three stages")], "The three stages")}</p>
        ${field(`a${i}.catch`, "Its Catch", a.catch, { max: 80, ph: "Wanted" })}${catches(i, a)}
        ${r.stage !== "Awakened" || a.burden.trim() ? field(`a${i}.burden`, "Its Burden <small>a cost for good, like <em>Bad Knee</em></small>", a.burden, { max: 80, ph: "Bad Knee" }) : ""}
        <div class="bd-ask"><p class="bd-label">Its awakenings</p>${awkTip(i)}</div>
        ${a.awk.map((w, j) => awkRow(a, i, w, j, `Awakening ${j + 1}${awkIn(w) && !counts(a, j) ? ` <small>off the sheet ${off(j)}</small>` : ""}`)).join("")}
        ${a.awk.length < 6 ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addawk" data-i="${i}">Add an awakening</button></div>` : '<p class="cc-lead">Six awakenings is the most anything holds.</p>'}
        ${drop(i)}</fieldset>`;
    };
    // An item: a line with its name, its tier's name and what it does, and a
    // tap opens what it is, its kind, its tier and the rest. A new one's open.
    const itemCard = (it, i) => {
      const open = !itemIn(it) || d.deep[`it${i}`] === true;
      return `<details class="bd-it" data-open="bd-it-${i}"${open ? " open" : ""}><summary><span class="bd-it-name">${itemIn(it) ? esc(itemSays(it.text.trim(), it.tier)) : "A new item"}</span> <small>${esc(kindSays(it))} · ${pts(itemCost(it))}</small></summary><div class="bd-it-in">
        ${field(`i${i}`, "What it is", it.text, { max: 80, ph: "Type it, or pick one below" })}
        ${itemHow(it, "i", i)}
        <div class="cc-row">${dropBtn("item", i, "Take it off")}</div></div></details>`;
    };
    // Each attuned thing at the top of your six, said, with a tap back to it.
    const attLine = (a, i) => `<li><button type="button" class="bd-it-att" data-act="b" data-b="kit" data-v="a"><span class="bd-it-name">${esc(itemSays(thingName(a), a.tier))}</span> <small>${esc(kindSays(a))} · attuned, ${a.tier > R.START_TIER ? `${pts(itemCost(a, true))} on its 5` : "in its 5"}</small></button></li>`;
    const has = new Set(x.items.filter(itemIn).map((it) => bareName(it.text)));
    const offer = (label, items) => `<p class="bd-label">${label}</p><div class="bd-items">${items.map((v) => {
      const it = itemFor(v, B);
      return card("bd-item", `data-b="additem" data-v="${esc(v)}"`, has.has(bareName(it.text)), `<b>${esc(cap(it.text))}</b>`);
    }).join("")}</div>`;
    const ideasOpen = d.deep.kitideas ?? (!x.items.some(itemIn) && !d.page);
    // A part's heading: its section's named by the words in it, and the rest's behind its ?.
    const head2 = (id, title, words, label, small = "") => `<h2><span id="${id}">${title}</span>${small ? ` <small>${small}</small>` : ""} ${tip(`${id}-t`, words, label)}</h2>`;
    const res = n.res;
    const parts = {
      a: `<section class="bd-carry" aria-labelledby="bd-at">${head2("bd-at", changing() ? "Attuned things" : "Attune something", ["An attuned thing’s bound to you, and it grows with you. It’s 5 points, and it comes with one awakening, which locks a point of the Root it fits. It doesn’t touch your Aura.", "It’s one of your six items, and its 5 covers it at tier 2. A point more puts it up to tier 3. It can’t be broken.", "Give it a Catch, trouble the GM can run with, and it gets a second awakening, free. That’s all an Awakened thing holds, so the rest come as it grows.", link("s-attunement", "Attunement")], "Attunement")}
        ${x.attuned.map((a, i) => (changing() ? grown(a, i) : quick(a, i))).join("")}
        ${x.attuned.length < MAX_ATTUNED ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addatt">${x.attuned.length ? "Attune another thing" : "Attune something"}</button><span class="bd-cost">${pts(5)}</span></div>` : ""}</section>`,
      i: `<section class="bd-carry" aria-labelledby="bd-is">${head2("bd-is", "Your items", [`Real gear you’ve got on you: a weapon, a shield, armour, or a tool good enough to matter. You carry six at most, your attuned thing among them.`, `An item’s 1 point and comes at tier 2${changing() ? "" : ", and a point more puts it up to tier 3, the most you start with"}. When it fits what you’re doing, its tier’s that many steps on top of your Root, one item a roll.`, "A weapon or a tool adds its tier to a roll it fits. A guard adds its tier only when you’re getting out of the way. Armour soaks its tier on its Root, a pack gives you more Resources, and a vessel holds its tier in charge.", link("s-items", "Items")], "Items", `${count} of ${R.MAX_ITEMS}`)}
        <ul class="bd-its">${x.attuned.filter(thingIn).map(attLine).join("")}</ul>
        ${x.items.map(itemCard).join("")}
        ${full ? `<p class="cc-lead">That’s ${count === R.MAX_ITEMS ? "six, the most you carry" : `${count}, and you carry six at most`}.</p>` : `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="additem">Add an item</button><span class="bd-cost">${pts(1)}</span></div>`}
        ${full ? "" : `<details class="bd-more bd-kitideas" data-open="bd-kitideas"${ideasOpen ? " open" : ""}><summary>Items from the book</summary>${[["Weapons", "Weapons"], ["Guards", "Guards"], ["Armour", "Armour"], ["Tools", "Tools"], ["Foci", "Foci"], ["Packs", "Packs"], ["Vessels", "Vessels"]].map(([g, label]) => offer(label, group(g))).join("")}</details>`}
        <p class="cc-lead bd-res">You’ve got ${res === R.RES_BASE ? "3 Resources" : `${res} Resources, 3 and ${res - R.RES_BASE} from your ${res - R.RES_BASE === 1 ? "pack" : "packs"}`} as well, with nothing to write. ${tip("bd-res-t", [`A Resource is something ordinary you happen to have, said in the moment you need it: “as it happens, I’ve got rope on me”. Say it, tick one, and it’s real.`, "You don’t list them ahead of time. Anything ordinary you could have on you, never magic, and never good enough to be steps, since that’s an item. Something you use up, like a smoke bomb, is gone once it’s used.", `Everyone’s got 3, a pack gives more, and they all come back in downtime.`, link("s-resources", "Resources")], "Resources")}</p></section>`,
      k: `<section class="bd-carry" aria-labelledby="bd-ks">${head2("bd-ks", "A keepsake", ["Something that matters to your character. It’s free, on top of your six items, and it’s story, never steps."], "Your keepsake", "free")}
        <div class="bd-slot is-row">${field("k", '<span class="sr-only">Keepsake </span>1', x.keepsake.text, { max: 80, ph: "Type it, or pick a card below" })}</div>
        <p class="bd-label">Keepsakes</p><div class="bd-items is-wide">${B.keepsakes.map((v) => card("bd-item", `data-b="keep" data-v="${esc(v.name)}"`, x.keepsake.text.trim().toLowerCase() === v.name.toLowerCase(), `<b>${esc(cap(v.name))}</b><span class="bd-for">${esc(v.text)}</span>`)).join("")}</div>
        <p class="bd-label">Signature things</p><div class="bd-items">${group("Signature").map((v) => card("bd-item", `data-b="keep" data-v="${esc(v)}"`, x.keepsake.text.trim().toLowerCase() === v.toLowerCase(), `<b>${esc(cap(v))}</b>`)).join("")}</div></section>`,
    };
    if (d.page) return KIT.map(([k]) => parts[k]).join("");
    return `${kitSwitch()}${parts[kitOf()]}`;
  }

  // Step 5: the ten crew questions as cards, each answer made into a bond
  // thread or a hostile one in a tap, and your bonds: one card a person, with
  // every thread you've got with them inside it, so the same name's never
  // written twice. Two bond threads with the crew to start, a hostile thread
  // with anyone, and a third bond thread with it. A saved character keeps
  // every thread they've got, the ones in a crewmate's words included.
  // "Dorrie. We have pulled a dozen jobs together." is a thread with Dorrie.
  const answerOf = (said) => {
    const m = said.match(/^([^.,:;!?]{1,40}?)[.,:]\s+(\S[\s\S]*)$/);
    const person = m && m[1].trim().split(/\s+/).length <= 4 ? m[1].trim() : "";
    return { person, text: (person ? m[2].trim() : said).slice(0, 200) };
  };
  // Each bond's Who with box is its first thread's (th0.person), and typing in
  // it renames every thread in the bond, as they were drawn. Nothing redraws
  // mid-word, so the bonds drawn are the ones being typed into.
  let bondsDrawn = new Map();
  function stepThreads() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    const groups = bondsOf(x.threads);
    bondsDrawn = new Map(groups.map((g) => [g.items[0].i, g.items.map((it) => it.i)]));
    const thread = (t, i, k, n) => {
      const bond = t.kind !== "hostile";
      return `<div class="bd-thread is-${bond ? "bond" : "hostile"}">${t.whose.trim() ? `<p class="cc-small">In ${esc(t.whose.trim())} words.</p>` : ""}
        <div class="cc-chips" role="group" aria-label="Thread ${i + 1}, what kind">${chip("Bond", `data-b="kind" data-i="${i}" data-v="bond"`, bond, "sm")}${chip("Hostile", `data-b="kind" data-i="${i}" data-v="hostile"`, !bond, "sm")}</div>
        ${field(`th${i}.text`, `What’s true between you${n > 1 ? ` <small>thread ${k + 1} of ${n}</small>` : ""}`, t.text, { max: 200, ph: bond ? "a rescue, a secret you keep for each other, a shared past" : "a debt you can’t pay, a grudge, a betrayal" })}
        ${canDrop("thread") ? `<div class="cc-row">${dropBtn("thread", i, n > 1 ? "Take this thread off" : "Take it off")}</div>` : ""}</div>`;
    };
    const bondCard = (g) => {
      const first = g.items[0].i;
      const bond = g.items.some(({ t }) => t.kind !== "hostile");
      return `<fieldset class="bd-box bd-bond"><legend>${g.person ? esc(g.person) : "Someone new"}</legend>
        ${field(`th${first}.person`, "Who with", g.person, { max: 60, ph: bond ? "someone in the crew" : "anyone, in the crew or out of it" })}
        ${g.items.map(({ t, i }, k) => thread(t, i, k, g.items.length)).join("")}
        ${g.person && x.threads.length < MAX_THREADS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addthreadto" data-i="${first}">Another thread with ${esc(g.person)}</button></div>` : ""}</fieldset>`;
    };
    // Each question's a card. Opened, it takes the answer and makes it a
    // thread, and once it's one it says which.
    const question = (q, i) => {
      const said = String(x.connect[i] ?? "").trim();
      const a = said ? answerOf(said) : null;
      const th = a ? x.threads.find((t) => t.text.trim() && t.text.trim() === a.text.trim() && bondKey(t.person) === bondKey(a.person)) : null;
      return `<details class="bd-tok bd-q" data-open="bd-q-${i}"${d.deep[`q${i}`] === true ? " open" : ""}><summary><span>${esc(q)}</span>${said ? `<small>${esc(said)}</small>` : ""}${th ? `<span class="bd-made is-${th.kind}">${th.kind === "hostile" ? "Hostile" : "Bond"} thread</span>` : ""}</summary>
        <div class="bd-q-in">${field(`cq${i}`, `Your answer<span class="sr-only"> to ${esc(q)}</span>`, x.connect[i] ?? "", { max: 200, ph: "Name them, then say it" })}
        <p class="bd-label" id="bd-qk-${i}">Make it a thread</p><div class="cc-chips" role="group" aria-label="Make your answer to ${esc(q)} a thread">${chip("Bond", `data-b="fromq" data-q="${i}" data-v="bond"`, th?.kind === "bond", "sm")}${chip("Hostile", `data-b="fromq" data-q="${i}" data-v="hostile"`, th?.kind === "hostile", "sm")}</div></div></details>`;
    };
    const room = !changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim());
    const qs = `<p class="cc-lead">Answer at least two, naming someone in the crew in each, and make two of them bond threads. ${tip("bd-qs-t", ["Your threads, your answers and your Aspiration cost nothing. Answer at least two of the crew questions, naming someone in the crew in each, and turn two of your answers into bond threads, something good between you. One that’s gone bad can be your hostile thread, with anyone, and that gives you room for a third bond thread.", "A thread with someone in the crew goes on both your sheets, so agree on it together.", link("s-bonds", "Bonds and threads")], "Threads")}</p><div class="bd-qs">${B.connect.map(question).join("")}</div>`;
    return `${changing() ? `<details class="bd-more" data-open="bd-qs"${d.deep.qs === true ? " open" : ""}><summary>The ten crew questions</summary>${qs}</details>` : `<h2 id="bd-qs-h">The crew questions</h2>${qs}`}
      <h2 id="bd-th-h">Your bonds</h2>
      <p class="cc-lead">Each person’s one bond, with every thread you’ve got with them under it.</p>
      ${groups.map(bondCard).join("")}
      ${room ? '<p class="cc-note" role="status">You’ve written a hostile thread, so you’ve got room for a third bond thread.</p>' : ""}
      ${x.threads.length < MAX_THREADS ? '<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addthread">A bond with someone new</button></div>' : ""}`;
  }

  // Step 6: one thing you want, 5 points to get there. When it's got them you get it, so the book's
  // tests for a good one are a ? beside it.
  function stepAsp() {
    return `<div class="bd-asp"><div class="bd-asp-f"><div class="cc-field-h"><label class="cc-field" for="b-asp">${changing() ? "Your Aspiration <small>its points are on the Sheet tab</small>" : "Your Aspiration <small>5 points to get there, a downtime slot each</small>"}</label>${tip("bd-good", paras(rule("s-good-aspiration")), "A good Aspiration")}</div><input id="b-asp" data-bin="asp" value="${esc(b().aspiration)}" maxlength="120" autocomplete="off" placeholder="Own the score of a lifetime"></div></div>`;
  }

  // Step 7: the numbers in the kit's pieces, the points, a name, and a last look.
  function stepCheck() {
    const x = b();
    const n = numbersOf(x);
    const p = pointsOf(x);
    const checks = checksOf(x, B, { changing: changing() });
    const trouble = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.trouble ?? []))];
    const num = (k, v, note, piece = "", cls = "") => `<li${cls ? ` class="${cls}"` : ""}><span class="bd-num-text"><span class="k">${k}</span> <b>${v}</b>${note ? ` <small>(${esc(note)})</small>` : ""}</span>${piece}</li>`;
    const go = (c) => (c.step == null ? "" : `<button type="button" class="button sm" data-act="b" data-b="go" data-s="${c.step}"${c.t != null ? ` data-t="${c.t}"` : ""}${c.a != null ? ` data-a="${c.a}"` : ""}${c.kit ? ` data-k="${c.kit}"` : ""}>${d.page ? STEPS[c.step].name : `Step ${c.step + 1}`}</button>`);
    return `<fieldset class="bd-box"><legend>Who they are</legend>
        ${field("name", "Name", x.name, { max: 40 })}
        <p class="bd-label" id="bd-pro">Call them</p><div class="cc-chips" role="group" aria-labelledby="bd-pro">${[["her", "she, her"], ["him", "he, him"], ["them", "they, them"]].map(([v, l]) => chip(l, `data-b="pronoun" data-v="${v}"`, x.pronoun === v)).join("")}</div>
        ${field("blurb", "One line about them, if you like", x.blurb, { max: 160 })}</fieldset>
      <h2>Your points</h2>
      <p class="cc-lead bd-pts-line">${p.spent} of ${p.start} spent${p.left > 0 ? `, ${p.left} left` : p.left < 0 ? `, ${-p.left} over` : ", all of them"}.</p>
      ${spentList(p)}${startStepper("check")}
      <h2>Your numbers</h2><ul class="bd-nums">
        ${num("Aura", n.aura, null, kitAura(n.aura, n.aura), "is-wide")}
        ${num("Stride", n.stride, null)}
        ${num("Resources", n.res, n.res > R.RES_BASE ? `3, and ${n.res - R.RES_BASE} from your ${n.res - R.RES_BASE === 1 ? "pack" : "packs"}` : "said when you need them")}
      </ul>
      <h2><span>Your Roots</span> <small>every one full to start</small></h2>${rootTiles()}
      ${trouble.length || x.trouble.length || changing() ? `<h2><span>Trouble that follows you</span> ${tip("bd-trouble", ["If you like. Let it cause real trouble and you take 1 Aura."], "Trouble")}</h2>${trouble.length || x.trouble.length ? `<div class="cc-chips">${[...new Set([...trouble, ...x.trouble])].map((t) => chip(`<em>${esc(t)}</em>`, `data-b="trouble" data-v="${esc(t)}"`, x.trouble.includes(t))).join("")}</div>` : ""}
        <div class="cc-form">${field("newtrouble", "Or write your own", "", { max: 120, ph: "owes the wrong people" })}<button type="button" class="button" data-act="b" data-b="addtrouble">Add it</button></div>` : ""}
      ${checks.length ? `<div class="cc-note is-warn"><p>A few things to look at. You can save anyway, and change them later.</p><ul class="bd-checks">${checks.map((c) => `<li>${esc(c.text)} ${go(c)}</li>`).join("")}</ul></div>` : '<p class="cc-note" role="status">Everything adds up.</p>'}`;
  }

  const BODIES = [stepArch, stepTitles, stepRoots, stepCarry, stepThreads, stepAsp, stepCheck];
  // A part on one page: its heading (the section's named by the words in it)
  // with the book's words for the step behind its ?.
  const part = (i) => `<h2 id="bd-h-${i}" tabindex="-1"><span id="bd-part-${i}">${STEPS[i].name}</span> ${how(i, "p")}</h2>${BODIES[i]().replace(/<(\/?)h2\b/g, "<$1h3")}`;
  // Typing on one page redraws the parts that add it all up (the Roots and
  // the last look) after a pause, but only below where you're typing, so
  // nothing moves under the keyboard. The points in the bar follow straight
  // away.
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!d) return;
      const pts0 = document.querySelector(".bd-foot-pts");
      if (pts0) pts0.innerHTML = pointsBar();
      if (!d.page) return;
      const at = document.activeElement?.closest(".bd-part");
      const fromPart = at ? Number(at.getAttribute("aria-labelledby").slice("bd-part-".length)) : -1;
      for (const i of [2, LAST]) {
        const el = i > fromPart && document.querySelector(`.bd-part[aria-labelledby="bd-part-${i}"]`);
        if (el) el.innerHTML = part(i);
      }
    }, 400);
  }
  // start is the build to start from, or a function that makes it, only
  // called when there's no draft to carry on with.
  function view(key, start, m = {}) {
    meta = m;
    if (!d || slotKey !== (key || "new")) open(key, start, m);
    if (d.page) return pageView();
    const go = slide;
    slide = "";
    return `${head()}<div class="bd-body${go ? ` bd-go-${go}` : ""}">${BODIES[d.step]()}
      <p class="cc-lead bd-saved">Your work’s saved on this phone as you go.</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">See it all on one page</button>${dropEdit()}</div></div>${bar()}`;
  }
  // After a redraw, every Root whose dice changed grows into its new shape,
  // or shrinks back, and a second die pops in past 6 steps. grow() leaves the
  // new die as it's drawn under reduce-motion.
  function after(root) {
    if (!d) return;
    const foot = root?.querySelector(".bd-foot");
    if (foot) document.documentElement.style.setProperty("--bd-bar", `${foot.offsetHeight}px`);
    const { roots } = rootsOf(b());
    const now = new Map(ROOTS.map((r) => [`root:${r}`, roots[r] ? stepsToDice(roots[r]) : []]));
    const before = shown;
    shown = now;
    if (!before || !root) return;
    for (const el of root.querySelectorAll(".bd-tiles .tile-dice[data-for]")) {
      const old = before.get(el.dataset.for);
      const dice = now.get(el.dataset.for);
      if (!dice?.length) continue;
      const svgs = el.querySelectorAll(".zd-die");
      if (!old?.length) svgs[0]?.classList.add("is-new");
      else if (old[0] !== dice[0]) growDie(svgs[0], old[0], dice[0]);
      if (old && dice.length > old.length) svgs[dice.length - 1]?.classList.add("is-new");
    }
  }

  // Everything typed goes straight into the draft. Nothing redraws mid-word,
  // bar the points in the bar after a pause.
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
    else if ((m = path.match(/^i(\d+)$/))) {
      const it = x.items[m[1]];
      if (!it) return;
      const before = itemIn(it) ? itemFor(it.text, B) : null;
      it.text = v;
      // While it's still what its words first made it, its kind follows
      // what's typed: plate's armour on the Body, a longbow's a weapon with
      // its properties. Once the player's picked, it's theirs.
      if (!before || (before.kind === it.kind && (it.kind !== "weapon" || before.props.join() === it.props.join()))) {
        const now = itemFor(v, B);
        Object.assign(it, { kind: now.kind, root: now.kind === "armour" ? it.root || now.root : "", props: now.props });
      }
    }
    else if (path === "k") x.keepsake.text = v;
    else if ((m = path.match(/^a(\d+)\.(name|catch|burden)$/))) set(x.attuned[m[1]], m[2]);
    else if ((m = path.match(/^a(\d+)\.w(\d+)\.(name|text)$/))) {
      const a = x.attuned[m[1]];
      if (!a) return;
      atLeast(a.awk, Number(m[2]) + 1, blankAwk);
      a.awk[m[2]][m[3]] = v;
      if (!awkIn(a.awk[m[2]])) delete a.awk[m[2]].kept;
    } else if ((m = path.match(/^th(\d+)\.person$/))) for (const j of bondsDrawn.get(Number(m[1])) ?? [Number(m[1])]) set(x.threads[j], "person");
    else if ((m = path.match(/^th(\d+)\.text$/))) set(x.threads[m[1]], "text");
    else if ((m = path.match(/^cq(\d+)$/))) x.connect[m[1]] = v;
    else if (["asp", "name", "blurb"].includes(path)) x[path === "asp" ? "aspiration" : path] = v;
    else return; // newtrouble is read when its button's tapped
    saveSoon();
    refreshSoon();
  }

  // A hostile thread makes room for a third bond thread in the Quick Build.
  function roomForThird() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    if (!changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim()) && x.threads.length < MAX_THREADS) x.threads.push(blankThread());
  }

  // A Title's spread, a tap at a time. Once it's changed it's the player's
  // own, so it stops saying where it came from.
  function setSpread(t, r, how) {
    if (!ROOTS.includes(r)) return;
    t.roots = nudgeSpread(t.roots, r, how);
    delete t.from;
    delete t.three;
  }

  const value = (id) => document.getElementById(id)?.value ?? "";
  // Taps. Each one changes the draft, saves it and redraws.
  function act(el, e, render, focusTop) {
    const x = b();
    const k = el.dataset.b;
    const i = Number(el.dataset.t ?? el.dataset.i ?? 0);
    const j = Number(el.dataset.j ?? 0);
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
    // An archetype, a Title or a part of what you carry, switched to: its
    // switch stays where the thumb is, and the screen starts from the switch.
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
      const to = Math.min(LAST, Math.max(0, Number(el.dataset.s)));
      el.closest("details")?.removeAttribute("open");
      if (d.page) {
        d.step = to;
        const h = document.getElementById(`bd-h-${to}`);
        h?.scrollIntoView({ block: "start" });
        return h?.focus({ preventScroll: true });
      }
      const moved = to !== d.step;
      slide = to > d.step ? "next" : to < d.step ? "back" : "";
      d.step = to;
      if (el.dataset.t != null) d.deep.tab = Number(el.dataset.t);
      else if (to === 1 && moved) d.deep.tab = 0;
      if (el.dataset.a != null) d.deep.atab = Number(el.dataset.a);
      else if (to === 0 && moved) d.deep.atab = 0;
      if (el.dataset.k) d.deep.kit = el.dataset.k;
      else if (to === 3 && moved) d.deep.kit = KIT[0][0];
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
        if (step.atab != null) d.deep.atab = step.atab;
        if (step.kit) d.deep.kit = step.kit;
        save();
        render();
        scrollTo(0, 0);
        return document.querySelector('.bd-switch [aria-current="true"]')?.focus({ preventScroll: true });
      }
      const to = d.step + (fwd ? 1 : -1);
      if (to < 0 || to > LAST) return;
      d.step = to;
      // Coming into a step from the one before starts on its first archetype,
      // Title or part, and coming back into it from the one after, on its last.
      if (to === 0) d.deep.atab = fwd ? 0 : x.archs.length - 1;
      if (to === 1) d.deep.tab = fwd ? 0 : x.titles.length - 1;
      if (to === 3) d.deep.kit = fwd ? KIT[0][0] : KIT[KIT.length - 1][0];
      save();
      render();
      return focusTop();
    }
    if (k === "tab" || k === "atab" || k === "kit") {
      const at = () => (k === "tab" ? tabOf() : k === "atab" ? archTab() : kitAt());
      const was0 = at();
      if (k === "tab") d.deep.tab = Math.min(Math.max(0, i), x.titles.length - 1);
      else if (k === "atab") d.deep.atab = Math.min(Math.max(0, i), x.archs.length - 1);
      else d.deep.kit = KIT.some(([key]) => key === v) ? v : KIT[0][0];
      const now = at();
      slide = now > was0 ? "next" : now < was0 ? "back" : "";
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
      d.build = normalBuild(roll(), B, { fresh: true });
      rolled = JSON.stringify(d.build);
      shown = null;
      save();
      return render();
    }
    if (k === "page") {
      d.page = !d.page;
      d.step = 0;
      d.deep.tab = 0;
      d.deep.atab = 0;
      d.deep.kit = KIT[0][0];
      save();
      render();
      return focusTop();
    }
    if (k === "save") {
      save();
      return onSave(forSave(normalBuild(x, B)), slotKey, () => discard(), d.basis);
    }
    if (k === "start") {
      // The points they start on: 35, or more for a one-shot or catching up.
      const w = el.dataset.w ?? "bar";
      const step = Number(v) < 0 ? -1 : 1;
      x.start = Math.min(MAX_START, Math.max(START, x.start + step));
      // Tapped in the bar's points, they stay open, and the cursor stays on
      // the button, or the other one once this one can't go further.
      if (w === "bar") d.deep.pts = true;
      then = () => (document.querySelector(`[data-b="start"][data-w="${w}"][data-v="${step}"]:not(:disabled)`) ?? document.querySelector(`[data-b="start"][data-w="${w}"]:not(:disabled)`))?.focus({ preventScroll: true });
    } else if (k === "deep") d.deep[el.dataset.s] = !d.deep[el.dataset.s];
    else if (k === "ideas") d.deep[`ideas${i}`] = !(d.deep[`ideas${i}`] === true);
    else if (k === "archopen") {
      d.deep[`pick${i}`] = !(d.deep[`pick${i}`] === true);
      then = d.deep[`pick${i}`] ? focusIn(`[data-b="arch"][data-t="${i}"][aria-pressed="true"]`, `[data-b="arch"][data-t="${i}"]`) : focusIn(`[data-b="archopen"][data-t="${i}"]`);
    } else if (k === "arch") {
      if (i >= x.archs.length) return;
      // A different archetype has different abilities, so its pick starts again.
      if (x.archs[i] !== v) x.have[i] = [];
      x.archs[i] = v;
      // Picked, the cards fold away to the one picked.
      delete d.deep[`pick${i}`];
      then = () => {
        const box = [...document.querySelectorAll(`[data-b="archopen"][data-t="${i}"]`)].map((btn) => btn.closest(".bd-chosen")).find(Boolean);
        box?.focus({ preventScroll: true });
        if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start" });
      };
    } else if (k === "abil") {
      // The first ability picked is the one it comes with, and each one more
      // is a point. Tapped again, it comes off.
      const have = x.have[i] ?? (x.have[i] = []);
      const at = have.indexOf(v);
      if (at >= 0) have.splice(at, 1);
      else if (have.length >= MAX_ABILITIES) return toast("Six abilities is the most an archetype holds.", false);
      else have.push(v);
    } else if (k === "addarch") {
      if (x.archs.length >= MAX_ARCHS) return;
      x.archs.push("");
      x.have.push([]);
      d.deep.atab = x.archs.length - 1;
      d.deep[`pick${x.archs.length - 1}`] = true;
      then = focusIn(`[data-b="arch"][data-t="${x.archs.length - 1}"]`);
    } else if (k === "idea") {
      const t = x.titles[i];
      t.idea = t.idea === v ? "" : v;
      if (t.idea) d.deep[`idea${i}`] = true;
    } else if (k === "title") x.titles[i].text = v;
    else if (k === "sall") {
      const t = x.titles[i];
      if (t) setSpread(t, v, "all");
      then = focusIn(`[data-b="sall"][data-t="${i}"][data-v="${v}"]`);
    } else if (k === "snudge") {
      const t = x.titles[i];
      const up = Number(el.dataset.n) > 0;
      if (t) setSpread(t, v, up ? "up" : "down");
      then = focusIn(`[data-b="snudge"][data-t="${i}"][data-v="${v}"][data-n="${up ? 1 : -1}"]:not(:disabled)`, `[data-b="snudge"][data-t="${i}"][data-v="${v}"]:not(:disabled)`, `[data-b="sall"][data-t="${i}"][data-v="${v}"]`);
    } else if (k === "proot") {
      const p = x.titles[i]?.perms[j];
      if (p) p.root = p.root === v ? "" : rootOf(v);
    } else if (k === "perm") {
      const t = x.titles[i];
      const at = t.perms.findIndex((p) => p.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) t.perms[at] = blankPerm();
      else {
        let free = t.perms.findIndex((p) => !p.text.trim());
        if (free < 0 && slotsOf(t) >= MAX_PERMS) return toast("That’s all six slots on this Title. Tap one to take it off first, or change one by hand.", false);
        if (free < 0) {
          t.perms.push(blankPerm());
          free = t.perms.length - 1;
        }
        // Its Root's a guess from its words, for the player to check.
        t.perms[free] = { text: v, root: guessFor(v).root };
      }
    } else if (k === "addperm") {
      const t = x.titles[i];
      if (!t) return;
      if (slotsOf(t) >= MAX_PERMS) return toast("That’s all six slots. Six is the most a Title holds.", false);
      t.perms.push(blankPerm());
      then = focusIn(`#b-t${i}-p${t.perms.length - 1}`);
    } else if (k === "addtitle") {
      if (x.titles.length >= MAX_TITLES) return;
      // A Title from an Aspiration comes with one permission. The Quick Build's come with three.
      x.titles.push(blankTitle(changing() ? 1 : 3));
      const n = x.titles.length - 1;
      d.deep.tab = n;
      then = focusIn(`#b-t${n}-text`);
    } else if (k === "dropitem") {
      const it = x.items[i];
      if (!it) return;
      if (itemIn(it) && armed !== `item${i}`) {
        dropping = `item${i}`;
        return render();
      }
      x.items.splice(i, 1);
      // The folds that are open follow the items that are left.
      for (const key of ["it", "pri"]) {
        for (let q = i; q < x.items.length; q++) d.deep[`${key}${q}`] = d.deep[`${key}${q + 1}`];
        delete d.deep[`${key}${x.items.length}`];
      }
      then = focusIn('[data-b="additem"]', ".bd-its + *");
    } else if (["droptitle", "droparch", "dropatt", "dropthread"].includes(k)) {
      const kind = k.slice(4);
      const arr = kind === "title" ? x.titles : kind === "arch" ? x.archs : kind === "att" ? x.attuned : x.threads;
      const it = arr[i];
      if (it == null || !canDrop(kind)) return;
      // A thread's words are what's lost. Its name's the bond's, unless it's the only thread in it.
      const full = kind === "title" ? titleIn(it) : kind === "arch" ? Boolean(it) : kind === "att" ? thingIn(it) : Boolean(it.text.trim() || (it.person.trim() && !arr.some((t, q) => q !== i && bondKey(t.person) === bondKey(it.person))));
      if (full && armed !== `${kind}${i}`) {
        dropping = `${kind}${i}`;
        return render();
      }
      arr.splice(i, 1);
      if (kind === "arch") x.have.splice(i, 1);
      if (kind === "title" || kind === "arch") {
        // The switch and the open pickers follow the ones that are left.
        const keys = kind === "title" ? ["ideas", "idea"] : ["pick"];
        for (const key of keys) {
          for (let q = i; q < arr.length; q++) d.deep[`${key}${q}`] = d.deep[`${key}${q + 1}`];
          delete d.deep[`${key}${arr.length}`];
        }
        if (kind === "title") d.deep.tab = Math.min(tabOf(), arr.length - 1);
        else d.deep.atab = Math.min(archTab(), arr.length - 1);
      }
      then = focusIn(`[data-b="add${kind}"]`, `[data-b="${kind === "arch" ? "atab" : "tab"}"][aria-current="true"]`);
    } else if (k === "addatt") {
      if (x.attuned.length >= MAX_ATTUNED) return;
      x.attuned.push(blankThing());
      then = focusIn(`#b-a${x.attuned.length - 1}-name`);
    } else if (k === "addawk") {
      const a = x.attuned[i];
      if (!a) return;
      if (a.awk.length >= 6) return toast("Six awakenings is the most anything holds.", false);
      a.awk.push(blankAwk());
      then = focusIn(`#b-a${i}-w${a.awk.length - 1}-name`);
    } else if (k === "awkroot") {
      const a = x.attuned[i];
      if (!a) return;
      atLeast(a.awk, j + 1, blankAwk);
      a.awk[j].root = a.awk[j].root === v && !a.awk[j].guessed ? "" : rootOf(v);
      delete a.awk[j].guessed;
    } else if (k === "stage") {
      if (x.attuned[i] && R.STAGES.includes(v)) x.attuned[i].stage = v;
    } else if (k === "additem") {
      // A card adds that item at tier 2, its kind from the book, and a second
      // tap takes it back off. The button adds an empty one to write in.
      if (v) {
        // The book's items stay open while they're being picked from.
        d.deep.kitideas = true;
        const it = itemFor(v, B);
        const at = x.items.findIndex((y) => itemIn(y) && bareName(y.text) === bareName(it.text));
        if (at >= 0) {
          x.items.splice(at, 1);
          return (save(), render());
        }
      }
      if (itemCount(x) >= R.MAX_ITEMS) return toast("That’s six items, the most you carry. Take one off first.", false);
      x.items.push(v ? itemFor(v, B) : blankItem());
      const n = x.items.length - 1;
      if (!v) then = focusIn(`#b-i${n}`);
    } else if (["ikind", "itier", "iroot", "iprop"].includes(k)) {
      const it = el.dataset.w === "a" ? x.attuned[i] : x.items[i];
      if (!it) return;
      if (k === "ikind") {
        it.kind = kindAt(v);
        it.root = it.kind === "armour" ? it.root || "Body" : "";
        it.props = it.kind === "weapon" ? (it.props.length ? it.props : weaponProps(it.text ?? it.name, B)) : [];
      } else if (k === "itier") it.tier = tierAt(v);
      else if (k === "iroot") it.root = rootOf(v) || "Body";
      else it.props = it.props.includes(v) ? it.props.filter((p) => p !== v) : propsOf([...it.props, v]);
      then = focusIn(`[data-b="${k}"][data-w="${el.dataset.w}"][data-i="${i}"][data-v="${CSS.escape(v)}"]`);
    } else if (k === "attitem") {
      // One of your items attuned is that item, so it moves off the rest.
      const a = x.attuned[i];
      const it = x.items[Number(v)];
      if (!a || !it || !itemIn(it)) return;
      Object.assign(a, { name: it.text.trim(), kind: it.kind, tier: it.tier, root: it.root, props: [...it.props] });
      x.items.splice(Number(v), 1);
    } else if (k === "keep") {
      // A second tap on the card it's from takes it back off.
      x.keepsake.text = x.keepsake.text.trim().toLowerCase() === v.toLowerCase() ? "" : v;
    } else if (k === "addthread") {
      if (x.threads.length >= MAX_THREADS) return;
      x.threads.push(blankThread());
      then = focusIn(`#b-th${x.threads.length - 1}-person`);
    } else if (k === "addthreadto") {
      // Another thread with someone you've already got a bond with goes under it.
      const who = x.threads[i]?.person.trim();
      if (!who || x.threads.length >= MAX_THREADS) return;
      x.threads.push({ ...blankThread(), person: who });
      then = focusIn(`#b-th${x.threads.length - 1}-text`);
    } else if (k === "fill") {
      const m = el.dataset.p.match(/^a(\d+)\.(name|catch)$/);
      // A second tap on the card it's from takes it back off.
      const a = m && x.attuned[m[1]];
      if (a) a[m[2]] = a[m[2]].trim() === v ? "" : v;
      // A thing picked off a card is the kind of item its words say, a
      // blade a weapon, till the player says otherwise.
      if (a && m[2] === "name" && a.name) {
        const it = itemFor(a.name, B);
        Object.assign(a, { kind: it.kind, root: it.root, props: it.props });
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
      const answer = answerOf(said);
      const person = bondName(x.threads.map((t) => t.person), answer.person);
      const { text } = answer;
      let at = x.threads.findIndex((t) => t.text.trim() === text.trim() && bondKey(t.person) === bondKey(person));
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

  // The folds remember being opened, so the ideas, the questions and the
  // points stay as they were left.
  function toggled(el) {
    if (!d) return;
    const key = el.dataset.open ?? "";
    let m;
    const name = (m = key.match(/^bd-q-(\d+)$/)) ? `q${m[1]}` : (m = key.match(/^bd-ideas-(\d+)$/)) ? `idea${m[1]}` : (m = key.match(/^bd-(it|ai)-(\d+)$/)) ? `${m[1]}${m[2]}` : (m = key.match(/^bd-pr-([ai]\d+)$/)) ? `pr${m[1]}` : key === "bd-kitideas" ? "kitideas" : key === "bd-qs" ? "qs" : key === "bd-pts" ? "pts" : "";
    if (!name) return;
    // A redraw puts a fold back the way it was, which isn't a change.
    const now = name.startsWith("idea") ? d.deep[name] ?? !d.page : name === "kitideas" ? Boolean(d.deep.kitideas ?? (!b().items.some(itemIn) && !d.page)) : /^it\d/.test(name) ? d.deep[name] === true || !itemIn(b().items[Number(name.slice(2))] ?? { text: "x" }) : d.deep[name] === true;
    if (now === el.open) return;
    d.deep[name] = el.open;
    saveSoon();
  }

  return { view, act, input, toggled, open, begin, discard, close, after, flush: () => d && save(), get step() { return d?.step ?? 0; } };
}
