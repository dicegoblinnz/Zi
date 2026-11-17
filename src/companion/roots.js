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
// Root at 0 is a Scar, something you can't do any more, locking a point for good, and you leave the
// scene. A heal recovers what it rolls, less 5 for each Toll, and every heal
// from someone or something else adds 1 Toll. The end of a scene rolls each
// Root unsplit and recovers what it rolls, and drops Toll by 1, and downtime
// puts everything back. Aura's 5, full every scene, 1 back for every die that
// wins and every top face, and past the maximum while you're acting. There
// are no tracks and no extra actions.
//
// Since the 17 Nov fixes (notes/fixes-plan.md) there are no Boons. A
// character has six items at most (c.items), each with a tier from 1 to 6
// that's how many steps it adds to a roll it fits, one item a roll: a weapon
// or a tool on anything it fits, a guard only avoiding harm, and armour, a
// pack or a vessel never. Armour soaks its tier on its Root before a hit
// takes points, and it's all back at the end of every scene. A pack gives
// more Resources, half its tier rounded up, on top of everyone's 3, said in
// the moment and all back in downtime. A vessel holds its tier in charge,
// filled only with Aura you'd lose or a point at a time mid-scene, and spent
// only on your own abilities and awakenings. Attuned things are items too,
// and count. The keepsake's free and on top.
//
// A character's state (state.v === 5):
//   { v, aura, acting, pts: { Body, Mind, Soul }, wound: { Body, Mind, Soul },
//     toll, scars: { Body: [words], Mind: [], Soul: [] }, blaze, out, dead,
//     soak: { [itemKey]: used }, res: [words], charge: { [itemKey]: n },
//     held: { [itemKey]: { Body, Mind, Soul } }, spill,
//     conditions, threads, crossed, picked, asp, aspText, notes, last,
//     grown, before, moved, core, choose, seen, tele, pool }
// pts is what each Root's got now, full on a new character (capOf). wound
// says which Roots are wounded, toll is how many heals from someone else
// they've had since it last cleared, and scars are the words of each Root's
// Scars left. blaze is a Root whose Scar is waiting for its words (a hit on
// it wounded at 0, or the Blaze taken), and out says they've left the scene.
// soak is how much of each piece of armour's soak is used this scene, res
// is the Resources they've said since downtime, in their words, and charge
// is what's in each vessel. held is how much of that charge came from each
// Root's points, held there like a lock till it's spent, and spill is Aura
// they really lost (past the maximum on finishing acting, or stopping at it
// off their turn) that can still go into a vessel. crossed is the items that are broken till
// they're mended. core is there till the player's seen that the character
// moved onto the new core, and choose is what a move left for them to choose
// (choicesOf). grown is what downtime gave them, in the shapes growRoots()
// reads, and before is what they grew before the Roots change, waiting to be
// put back.
//
// At the bottom is what the screens that haven't moved onto the fixes or the
// new core yet still use: the Boons as stubs that give nothing, and the
// tracks from stacking on a v3 state. Prompts 5 and 6 of notes/fixes-plan.md
// move the screens off them, and prompt 8 takes them out.

import { sizeDown, sizeUp, stepsToDice, SIZES } from "./dice.js";
import { START, costOf } from "./points.js";

export const ROOTS = ["Body", "Mind", "Soul"];
// What a wound's called on each Root.
export const WOUNDS = { Body: "Bloodied", Mind: "Frayed", Soul: "Hollow" };
export const MAX_PERMS = 6;
export const MAX_ABILITIES = 6;
// Each archetype's abilities as the book had them on 16 Nov, before the 17
// Nov fixes made each list about ten long. A character saved before stacking
// has no `have`, and came with every ability its archetype had then, so these
// are what it keeps, never the longer list (`hadOf()`).
export const HAD_ABILITIES = {
  Bard: ["Push", "Crescendo"], Bloodsworn: ["Bleed for it", "Bleed out"], Elementalist: ["Push", "Sculpt"],
  Face: ["Push", "Turn them"], Gambler: ["Another flip", "Double or nothing"], Guardian: ["Push", "Stand firm"],
  Healer: ["Push", "Pull them back"], Hunter: ["Push", "Mark the pack"], Illusionist: ["Push", "Make it real"],
  Leader: ["Push", "Everyone gets it"], Maker: ["Push", "Masterwork"], Oracle: ["Push", "Hold it", "Foretold"],
  Shadow: ["Push", "Vanish"], Shifter: ["Push", "Become it"], Summoner: ["Push", "Call the horde"],
  Teleporter: ["Portal", "Swap"], Warrior: ["Push", "Opened"],
};
// The abilities one from before stacking had, out of the names on the list
// now: the 16 Nov ones still there, or the whole list for an archetype that
// came after.
export function hadOf(name, names) {
  const had = HAD_ABILITIES[name];
  return (had ? names.filter((x) => had.includes(x)) : names).slice(0, MAX_ABILITIES);
}
export const STAGES = ["Awakened", "Tempered", "Perfected"];
// What a Title puts on your Roots, and what it put before the new core.
export const TITLE_ROOTS = 5;
export const OLD_TITLE_ROOTS = 3;
// Aura's maximum: 5. An attuned thing puts nothing on it any more, and
// there are no Boons.
export const BASE_AURA = 5;
export const ATTUNED_AURA = 0;
// An awakening's 2 steps on a roll it fits, and 2 more for each Aura on it.
export const AWK_STEPS = 2;
// Bringing a Root in: 1 point from it, or 3 Aura.
export const BRING_PTS = 1;
export const BRING_AURA = 3;
// Each Toll takes 5 off a heal.
export const TOLL_STEP = 5;
// Items (Building Your Character, Items): six at most, the keepsake on top
// and free. An item comes at tier 2 and can be raised to tier 3 when you make
// a character, and tiers run 1 to 6.
export const MAX_ITEMS = 6;
export const START_TIER = 2;
export const MAX_START_TIER = 3;
export const MAX_TIER = 6;
export const KINDS = ["weapon", "tool", "guard", "armour", "pack", "vessel"];
// Everyone's 3 Resources.
export const RES_BASE = 3;
// An Aspiration takes 5 points, put in a downtime slot at a time, and a Scar
// grows into a Trait with 3 slots on it (Mo's 16 Nov answers, after the core).
export const ASP_PTS = 5;
export const SCAR_SLOTS = 3;

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, int(v, lo)));
const even = (v, lo, hi) => clamp(Math.round(int(v, lo) / 2) * 2, lo, hi);
const text = (v, n = 80) => String(v ?? "").trim().slice(0, n);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const zero = () => ({ Body: 0, Mind: 0, Soul: 0 });
export const specKey = (name) => String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// ---------------------------------------------------------------- items

// The tiers' names, off the table in Items (#s-item-tiers), which the build
// reads into companion.build.tiers. These are the book's own set till a
// sheet's made with the book to hand (rootsSheet calls useTiers), so Mo's
// pick of a set is one edit to that table.
export let TIERS = ["Plain", "Trusty", "Proven", "Storied", "Sung", "Mythic"].map((name, i) => ({ n: i + 1, name }));
export function useTiers(list) {
  if (!Array.isArray(list) || list.length !== MAX_TIER || list.some((t) => !t || !text(t.name, 40))) return TIERS;
  TIERS = list.map((t, i) => ({ n: i + 1, name: text(t.name, 40) }));
  return TIERS;
}
export const tierName = (n) => TIERS[clamp(n, 1, MAX_TIER) - 1]?.name ?? `Tier ${n}`;
// An item said the way a sheet writes it, its tier's name first: a Proven
// set of picks, her Trusty grappling line, Proven plate armour.
export function itemSaid(it) {
  const name = String(it?.name ?? "");
  const art = name.match(/^(a|an|the|her|his|their|your|my) /i)?.[0] ?? "";
  const rest = name.slice(art.length);
  const tier = tierName(it?.tier ?? START_TIER);
  const a = /^an? $/i.test(art) ? (/^[aeiou]/i.test(tier) ? `${art[0] === "A" ? "An" : "an"} ` : `${art[0] === "A" ? "A" : "a"} `) : art;
  return `${a}${tier} ${rest}`;
}
// "a Proven set of picks" is a set of picks at tier 3, and "Trusty worn
// leathers" is worn leathers at tier 2, against the tiers' names.
export function tierIn(said, tiers = TIERS) {
  const art = String(said).match(/^(a|an|the|her|his|their|your|my) /i)?.[0] ?? "";
  const rest = String(said).slice(art.length);
  const t = tiers.find((x) => rest.startsWith(`${x.name} `));
  if (!t) return null;
  const noun = rest.slice(t.name.length + 1);
  const a = /^an? $/i.test(art) ? (/^[aeiou]/i.test(noun) ? "an " : "a ") : art.toLowerCase();
  return { name: `${a}${noun}`, tier: t.n };
}
// What each kind's tier does on a roll: a tool on anything it fits, a weapon
// on anything but a roll avoiding harm (bar a Warrior's Parry), a guard only
// on a roll avoiding harm, armour only there for a Warrior (Second Skin), and
// a pack or a vessel never.
export const addsSteps = (it, avoid = false, { parry = false, skin = false } = {}) => {
  if (it?.kind === "tool") return true;
  if (it?.kind === "weapon") return !avoid || Boolean(parry);
  if (it?.kind === "guard") return Boolean(avoid);
  if (it?.kind === "armour") return Boolean(avoid && skin);
  return false;
};
// A Warrior's Second Skin: their armour's a guard as well.
export const skinOf = (c) => (c?.archetypes ?? []).some((a) => a?.name === "Warrior");
// An item's name without its article, for matching an attuned thing to it.
const bareItem = (name) => specKey(String(name ?? "").replace(/^(a|an|the|her|his|their|your|my) /i, "").replace(/\s*\([^)]*\)\s*$/, ""));
// Each item's key lasts a reload: item|its name, and a second of the same
// name item|its name|2.
function keyItems(list) {
  const seen = new Map();
  for (const it of list) {
    const base = `item|${it.name}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    it.key = n > 1 ? `${base}|${n}` : base;
  }
  return list;
}
// One item tidied: its words, tier, kind, the Root armour soaks on (Body
// unless it says), a weapon's properties, which attuned thing it is (an
// index into c.attuned, or null) and, for armour that only counts in the
// right place, when.
export function itemOf(x) {
  const kind = KINDS.includes(x?.kind) ? x.kind : "tool";
  const props = (Array.isArray(x?.props) ? x.props : String(x?.props ?? "").split(/,\s*/)).map((p) => text(p, 30)).filter(Boolean);
  const out = { key: "", name: text(x?.name, 80), tier: clamp(x?.tier ?? START_TIER, 1, MAX_TIER), kind, root: kind === "armour" ? (ROOTS.includes(x?.root) ? x.root : "Body") : null, props, attuned: Number.isInteger(x?.attuned) && x.attuned >= 0 ? x.attuned : null };
  if (kind === "armour" && text(x?.when, 80)) out.when = text(x.when, 80);
  if (x?.g != null) out.g = x.g;
  return out;
}
// A thing from before items had kinds: armour's what the sheet said was
// armour, a shield or a buckler's a guard, anything with a weapon's
// properties or a weapon's name is a weapon, and the rest are tools, for the
// player to change.
function guessKind(name, props, B) {
  const n = specKey(name);
  if (/\b(shield|buckler|parrying)\b/.test(n)) return "guard";
  if (props?.length) return "weapon";
  const weapons = (B?.weapons ?? []).flatMap((w) => String(w.name).toLowerCase().split(/,| or /)).map((w) => w.trim()).filter((w) => w && !/improvised|bare hands/.test(w));
  if (weapons.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(n))) return "weapon";
  if (/\b(sword|knife|dagger|axe|bow|spear|hammer|mace|club|whip|staff|rapier|sling|crossbow|blade|pistol)\b/.test(n)) return "weapon";
  return "tool";
}
// The items on a sheet. A sheet with items (the crew's, or one the builder's
// made since the fixes) has them tidied, each attuned one matched to its
// attuned thing. One from before the fixes (carry and armour) moves across
// the way the plan says a saved character does: each piece of equipment's an
// item at tier 2, armour's quality a tier up from that (Common 2, Fine 3,
// Masterwork 4), and its utility items and bag go, kept in was for normalCore
// to write into their notes, since they're Resources now. Every attuned thing
// is an item, tier 2 if it wasn't one already. Past six stays, for the player
// to choose (choicesOf).
function itemsFrom(c, B) {
  let items;
  if (Array.isArray(c.items)) items = c.items.filter((x) => x && typeof x === "object" && text(x.name)).map(itemOf);
  else {
    const carry = obj(c.carry);
    const list = (v) => (Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : []).map((x) => text(typeof x === "string" ? x : x?.text ?? x?.name, 80)).filter(Boolean);
    const bare = (x) => String(x).replace(/\b(Common|Fine|Masterwork)\s+/, "");
    const armour = Array.isArray(c.armour) ? c.armour : [];
    items = list(carry.equipment).map((name) => {
      const piece = armour.find((a) => a.name === name || a.name === bare(name));
      if (piece) {
        const q = clamp(piece.q ?? piece.tier ?? (["Common", "Fine", "Masterwork"].indexOf(piece.quality) + 1 || piece.boxes) ?? 1, 1, 3);
        return itemOf({ name: piece.name, tier: q + 1, kind: "armour", root: piece.root, when: piece.when });
      }
      return itemOf({ name, tier: START_TIER, kind: guessKind(name, null, B) });
    });
    const was = { utility: list(carry.utility), bag: list(carry.bag) };
    if (was.utility.length || was.bag.length) c.was = was;
  }
  // Every attuned thing's an item: the one that says it's attuned, or the
  // one with its name, or a new one at tier 2.
  c.attuned.forEach((a, i) => {
    const said = items.find((x) => x.attuned === i) ?? items.find((x) => x.attuned == null && bareItem(x.name) === bareItem(a.name));
    if (said) said.attuned = i;
    else items.push(itemOf({ name: String(a.name ?? "").replace(/\s*\([^)]*\)\s*$/, ""), tier: START_TIER, kind: guessKind(a.name, a.props ? String(a.props).split(/,\s*/) : null, B), props: a.props, attuned: i }));
  });
  for (const it of items) if (it.attuned != null && !c.attuned[it.attuned]) it.attuned = null;
  return keyItems(items);
}

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
  };
  // Boons are gone (17 Nov). One built in is kept as gone, for the player
  // to spend its 2 points (choicesOf).
  const gone = (Array.isArray(t?.boons) ? t.boons : []).filter((x) => x && text(x.lever, 40)).map((x) => ({ lever: text(x.lever, 40), name: text(x.name, 40) }));
  for (const k of ["name", "root", "specialties", "specs", "fromRoot", "fromThree", "boons", "boonsGone"]) delete out[k];
  if (gone.length) out.boonsGone = gone;
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
  useTiers(B?.tiers);
  // The keepsake's free and on top of the six, and the items are a list. A
  // build moved across from before the fixes says what its utility items and
  // bag held (was), for normalCore to write into the notes.
  const was = c.was && typeof c.was === "object" ? { utility: (Array.isArray(c.was.utility) ? c.was.utility : []).map((x) => text(x, 120)).filter(Boolean), bag: (Array.isArray(c.was.bag) ? c.was.bag : []).map((x) => text(x, 120)).filter(Boolean) } : null;
  delete c.was;
  c.keepsake = text(c.keepsake ?? c.carry?.keepsake, 120) || null;
  c.items = itemsFrom(c, B);
  if (!c.was && (was?.utility.length || was?.bag.length)) c.was = was;
  c.titles = (c.titles ?? []).filter((t) => t && typeof t === "object").map((t) => titleOf(t, B, core));
  c.points = { start: int(base.points?.start, START), spent: costOf(c).spent };
  if (Array.isArray(grown) && grown.length) growRoots(c, grown, B);
  c.roots = countRoots(c.titles).roots;
  // Aura's 5, and nothing changes it.
  c.numbers = { ...obj(c.numbers), aura: BASE_AURA };
  for (const k of ["auraNote", "kit"]) delete c.numbers[k];
  // An awakening with no Root locks a point of their biggest, till they say.
  const big = bestRoot(c);
  for (const a of c.attuned) for (const w of a.awakenings) if (!w.root) Object.assign(w, { root: big, guessed: true });
  // No tracks on a sheet any more.
  for (const k of ["stamina", "confidence", "resolve"]) delete c.numbers[k];
  delete c.specialties;
  // What they carried before the fixes is items now (itemsFrom), and the
  // utility and bag are in was for their notes.
  delete c.carry;
  delete c.armour;
  return c;
}

// What downtime grows, on top of the sheet, each one adding one thing. g is
// the entry's place in the list, so the gold marks never take a line the
// player grew for a change in the rules. A slot buys what a point does.
//   { k: "perm", t, text, root }                a permission on Title t
//   { k: "swap", t, j, text, root }             permission j on Title t, swapped
//   { k: "boon", t, lever, name, on, drop }     two permissions swapped for a Boon, before
//                                               the 17 Nov fixes: Boons are gone, so the
//                                               permissions stay and it's kept as gone
//   { k: "ability", a, name }                   another ability for archetype a
//   { k: "awk", a, name, root, text, catch, burden } an awakening on attuned thing a
//   { k: "stage", a, to, catch, burden }        attuned thing a up a stage
//   { k: "thread", person, text, kind }         a new thread, bond or hostile
//   { k: "title", text, roots, perm }           a new Title, from an Aspiration
//   { k: "arch", arch, have }                   a new archetype, from an Aspiration
//   { k: "attune", name, awk, kind, tier }      a new attuned thing, from an Aspiration:
//                                               the item of that name, or a new one
//   { k: "item", name, kind, tier, root, props } an item got in play
//   { k: "tier", key, to }                      item key raised to tier to (Grow to 3,
//                                               money to 4, the story to 5 and 6)
//   { k: "drop", key }                          item key let go, to make room
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
      if (t && t.permissions.length < MAX_PERMS) t.permissions.push({ text: words, root, g });
    } else if (x.k === "boon" && text(x.lever, 40)) {
      // Boons are gone: the permissions it took stay, and it's kept as gone.
      const t = c.titles[int(x.t, -1)];
      if (t) (t.boonsGone ??= []).push({ lever: text(x.lever, 40), name: text(x.name, 40), grown: true });
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
      const i = c.attuned.length - 1;
      const had = c.items.find((it) => it.attuned == null && bareItem(it.name) === bareItem(x.name));
      if (had) had.attuned = i;
      else c.items.push(itemOf({ name: x.name, kind: x.kind ?? guessKind(x.name, null, B), tier: x.tier ?? START_TIER, attuned: i, g }));
      keyItems(c.items);
    } else if (x.k === "item" && text(x.name, 80)) {
      c.items.push(itemOf({ ...x, attuned: null, g }));
      keyItems(c.items);
    } else if (x.k === "tier") {
      const it = c.items.find((y) => y.key === x.key);
      if (it) it.tier = clamp(x.to, 1, MAX_TIER);
    } else if (x.k === "drop") {
      const at = c.items.findIndex((y) => y.key === x.key && y.attuned == null);
      if (at >= 0) c.items.splice(at, 1);
      keyItems(c.items);
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
//   { k: "boon", t, lever, name } a Boon on Title t, gone since the 17 Nov fixes: one
//                                 built in gives its 2 points back (they're in points),
//                                 and one swapped in downtime gives its permissions back
//   { k: "items", over }          more than six items, for them to choose which go
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
  (c.titles ?? []).forEach((t, i) => {
    for (const b of t.boonsGone ?? []) out.push({ k: "boon", t: i, lever: b.lever, name: b.name });
  });
  const over = (c.items?.length ?? 0) - MAX_ITEMS;
  if (over > 0) out.push({ k: "items", over });
  const left = int(c.points?.start, 0) - int(c.points?.spent, 0);
  if (c.points && left > 0) out.push({ k: "points", left });
  return out;
}
const sameChoice = (x, y) => x?.k === y.k && (y.k !== "spread" && y.k !== "five" && y.k !== "boon" ? true : x.t === y.t) && (y.k !== "arch" || x.name === y.name) && (y.k !== "lock" || (x.a === y.a && x.name === y.name)) && (y.k !== "boon" || x.lever === y.lever);

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
    out.push({ name: a.name, id: a.id ?? rule.id ?? null, home: trackKey(a.home ?? rule.home) ?? "stamina", times: 1, summary: rule.summary ?? "", for: rule.for ?? "", trait: traitOf(rule.trait ?? a.trait), have: [...(a.have ?? hadOf(a.name, abilities.map((x) => x.name)))], abilities });
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

// A new character's state: every Root full, nothing wounded, no Toll, Aura
// full, all their armour's soak and all their Resources there, and every
// vessel empty.
export function freshCore(c) {
  const s = {
    v: 5, aura: int(c.numbers?.aura, BASE_AURA), acting: false,
    pts: zero(), wound: { Body: false, Mind: false, Soul: false }, toll: 0,
    scars: { Body: [], Mind: [], Soul: [] },
    blaze: null, out: false, dead: false,
    soak: {}, res: [], charge: {},
    conditions: [], threads: {}, crossed: {}, picked: [],
    asp: even(c.aspiration?.die ?? 2, 2, 12), aspPts: aspOf({ aspPts: c.aspiration?.pts ?? 0 }), aspText: "", notes: "", last: null, grown: [], choose: [],
  };
  for (const r of ROOTS) s.pts[r] = capOf(c, s, r);
  return s;
}

// The points in an Aspiration, 0 to 5. A state from before they were points
// has its old die (asp) read as a point for each size it had climbed, d2 as
// nothing and d12 as 4, since 5 would have come good already.
export const aspOf = (s) => (s?.aspPts != null && Number.isFinite(Number(s.aspPts)) ? clamp(s.aspPts, 0, ASP_PTS) : Math.min(ASP_PTS - 1, Math.max(0, (even(s?.asp ?? 2, 2, 12) - 2) / 2)));
// A Scar's growth toward its Trait, by its Root and its place on it: the
// slots on it so far (n, up to 3) and, once it's grown, the Trait (trait).
export const scarKey = (root, i) => `${root}|${i}`;
export function scarGrowOf(s, root, i) {
  const g = s?.scarGrow?.[scarKey(root, i)];
  return { n: clamp(g?.n, 0, SCAR_SLOTS), trait: text(g?.trait, 200) };
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
// A v4 state from the new core moves onto the 17 Nov fixes (v5) here too:
// its armour's soak starts unused and its boxes go, its Resources are all
// there and its vessels empty, what was crossed out stays crossed out by the
// item's own key, the utility items and bag the sheet had go into its notes,
// since they're Resources now, and what that leaves them to choose (a Boon
// that's gone, items past six, points to spend) joins choose.
export function normalCore(raw, c) {
  let r = raw && typeof raw === "object" ? JSON.parse(JSON.stringify(raw)) : {};
  const blank = !Object.keys(r).length;
  if (isOldState(r)) r = fromOld(r, c);
  const moving = !blank && r.v !== 4 && r.v !== 5;
  const fixing = !blank && r.v !== 5;
  if (moving && r.v !== 3) r = normalRoots(r, c);
  const s = Object.assign(freshCore(c), r);
  s.v = 5;
  if (fixing) {
    s.soak = {};
    s.res = [];
    s.charge = {};
    // Crossed out by where it was (equipment|plate armour) is crossed out by
    // the item's key now (item|plate armour).
    const crossed = obj(r.crossed);
    s.crossed = {};
    for (const [k, v] of Object.entries(crossed)) {
      if (!v) continue;
      const key = k.replace(/^(equipment|utility|bag)\|/, "item|");
      if ((c.items ?? []).some((it) => it.key === key)) s.crossed[key] = true;
    }
    const was = [...(c.was?.utility ?? []), ...(c.was?.bag ?? [])];
    if (was.length) s.notes = `${text(s.notes, 4000)}${text(s.notes, 4000) ? "\n" : ""}What you carried before Resources: ${was.join(", ")}. They’re things you can say you’ve got now, with a Resource.`;
  }
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
  for (const k of ["tracks", "power", "store", "bought", "stacked", "used", "shrugged", "boxes", "tough", "beyond", "elem"]) delete s[k];
  s.acting = Boolean(s.acting);
  // Past the maximum only while acting.
  s.aura = clamp(s.aura, 0, s.acting ? 99 : auraMax(c, s));
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
  s.aspPts = aspOf(r && r.aspPts != null && Number.isFinite(Number(r.aspPts)) ? r : { asp: s.asp });
  // Each Scar's slots toward its Trait, kept only for a Scar that's there.
  const grow = obj(s.scarGrow);
  s.scarGrow = {};
  for (const root of ROOTS) s.scars[root].forEach((_, n) => {
    const g = scarGrowOf({ scarGrow: grow }, root, n);
    if (g.n || g.trait) s.scarGrow[scarKey(root, n)] = g.trait ? g : { n: g.n };
  });
  if (!Object.keys(s.scarGrow).length) delete s.scarGrow;
  s.conditions = (Array.isArray(s.conditions) ? s.conditions : []).filter((x) => x && x.name).map((x) => ({ name: text(x.name, 40), die: even(x.die, 2, 12), kind: x.kind === "for" ? "for" : "against" }));
  s.picked = (Array.isArray(s.picked) ? s.picked : []).filter((p) => p && p.name && ["equipment", "utility", "bag"].includes(p.where));
  for (const key of ["threads", "crossed"]) if (!s[key] || typeof s[key] !== "object" || Array.isArray(s[key])) s[key] = {};
  for (const [k, v] of Object.entries(s.threads)) if (!["strained", "snapped", "whole"].includes(v)) delete s.threads[k];
  // Attuned things can't break.
  for (const it of c.items ?? []) if (it.attuned != null) delete s.crossed[it.key];
  // Soak used on armour they've got, and charge in vessels they've got,
  // never past an item's tier. Resources said, never more than they've got.
  const item = (key) => (c.items ?? []).find((it) => it.key === key);
  const soak = obj(s.soak);
  s.soak = {};
  for (const [k, v] of Object.entries(soak)) if (item(k)?.kind === "armour" && int(v, 0) > 0) s.soak[k] = clamp(v, 0, item(k).tier);
  const charge = obj(s.charge);
  s.charge = {};
  for (const [k, v] of Object.entries(charge)) if (item(k)?.kind === "vessel" && int(v, 0) > 0) s.charge[k] = clamp(v, 0, item(k).tier);
  // Points held in a vessel they've still got, never more than its charge.
  const held = obj(s.held);
  s.held = {};
  for (const [k, h] of Object.entries(held)) {
    let room = s.charge[k] ?? 0;
    const out = zero();
    for (const r of ROOTS) {
      out[r] = Math.min(room, Math.max(0, int(h?.[r], 0)));
      room -= out[r];
    }
    if (ROOTS.some((r) => out[r] > 0)) s.held[k] = out;
  }
  if (!Object.keys(s.held).length) delete s.held;
  if (int(s.spill, 0) > 0) s.spill = int(s.spill, 0);
  else delete s.spill;
  s.res = (Array.isArray(s.res) ? s.res : []).map((x) => text(x, 120)).filter(Boolean).slice(0, resOf(c));
  s.grown = (Array.isArray(s.grown) ? s.grown : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  s.before = (Array.isArray(s.before) ? s.before : []).filter((g) => g && typeof g === "object" && typeof g.k === "string");
  if (!s.before.length) delete s.before;
  if (!s.moved) delete s.moved;
  if (s.core !== true) delete s.core;
  // After a move, a choice goes once it's made, or once it doesn't apply any
  // more (their build's spread that Title, or spent the points). Moving onto
  // the fixes adds what it's left them to choose.
  if (!moving) {
    const now = choicesOf(c);
    const kept = (Array.isArray(s.choose) ? s.choose : []).map((x) => now.find((y) => sameChoice(x, y))).filter(Boolean);
    s.choose = fixing ? [...kept, ...now.filter((y) => ["boon", "items", "points"].includes(y.k) && !kept.some((x) => sameChoice(x, y)))] : kept;
  }
  if (s.seen && typeof s.seen !== "object") delete s.seen;
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
// awakening that works, then the points held in their vessels.
export function lockedOf(c, s = {}) {
  const out = zero();
  for (const r of ROOTS) out[r] = Math.min(c.roots?.[r] ?? 0, s.scars?.[r]?.length ?? 0);
  for (const w of awakeningsOf(c, s)) if (w.works) out[w.root] += 1;
  const held = heldOf(s);
  for (const r of ROOTS) out[r] += held[r];
  return out;
}
// The points held in their vessels, by Root, all of them or one vessel's.
export function heldOf(s, key = null) {
  const out = zero();
  for (const [k, h] of Object.entries(obj(s?.held))) {
    if (key && k !== key) continue;
    for (const r of ROOTS) out[r] += Math.max(0, int(h?.[r], 0));
  }
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

// Armour on a Root that can soak: every piece of armour on it that isn't
// broken, each soaking its tier a scene.
export const armourOn = (c, s, root) => (c.items ?? []).filter((it) => it.kind === "armour" && (it.root ?? "Body") === root && !s?.crossed?.[it.key]);
export const soakLeft = (s, it) => Math.max(0, it.tier - clamp(s?.soak?.[it.key] ?? 0, 0, it.tier));
// What's left to soak on a Root this scene.
export const soakOf = (c, s, root) => armourOn(c, s, root).reduce((t, it) => t + soakLeft(s, it), 0);
// Soak n points off the armour on a Root, a piece at a time in the sheet's
// order, and say what each piece soaked.
function soakFrom(c, s, root, n) {
  const out = [];
  let left = n;
  for (const it of armourOn(c, s, root)) {
    const take = Math.min(left, soakLeft(s, it));
    if (!take) continue;
    if (!s.soak || typeof s.soak !== "object") s.soak = {};
    s.soak[it.key] = (s.soak[it.key] ?? 0) + take;
    out.push({ key: it.key, n: take });
    left -= take;
    if (!left) break;
  }
  return out;
}
const soakedN = (list) => list.reduce((t, x) => t + x.n, 0);

// n hits at a Root. Each is a point, and the armour on that Root soaks it
// first, then it's a point off the Root, and damage carries past 0: a hit on
// it at 0 wounds it, and a hit on it wounded at 0 is a Scar, waiting for its
// Catch (s.blaze), and they're leaving the scene, so the rest do nothing,
// and nothing lands on someone who's left it (s.out). A vulnerability's or a
// deadly threat's hits are just more hits, a point each.
// Taken on another Root (on), each hit's 2 points there, all of them or none,
// and only if that Root's soak and points have them between them, its
// armour soaking first. It says what happened:
//   { root, on, lost, soaked: [{ key, n }], wound, scar, ok }
// lost is the points off a Root, and soaked what each piece of armour
// soaked. ok is false when they asked to take it on another Root that
// hasn't got it, and then nothing changed.
export function takeHits(c, s, root, n = 1, { on = null } = {}) {
  const hits = Math.max(0, int(n, 0));
  const out = { root, on: null, lost: 0, soaked: [], wound: false, scar: false, ok: true };
  if (!ROOTS.includes(root) || !hits || s.blaze || s.out) return out;
  if (on && on !== root && ROOTS.includes(on)) {
    const need = 2 * hits;
    if (soakOf(c, s, on) + (s.pts?.[on] ?? 0) < need) return { ...out, ok: false };
    const soaked = soakFrom(c, s, on, need);
    const lost = need - soakedN(soaked);
    s.pts[on] -= lost;
    return { ...out, on, lost, soaked };
  }
  for (let i = 0; i < hits; i++) {
    const soaked = soakFrom(c, s, root, 1);
    if (soaked.length) {
      for (const x of soaked) {
        const had = out.soaked.find((y) => y.key === x.key);
        if (had) had.n += x.n;
        else out.soaked.push(x);
      }
    } else if (s.pts[root] > 0) {
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
// The Scar written: what it stops them doing, in the player's words on that Root, locking a
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
// The end of a scene: Aura's full again, every piece of armour's soak is
// back, each Root gets back what it rolled (rolls is { Body, Mind, Soul },
// each Root's dice unsplit added up) up to what it can hold, Toll drops by
// 1, and anyone who left the scene is back for the next. Nothing goes into a
// vessel here: the Aura they've got left isn't lost, since the next scene
// starts full, and points never go in at a scene's end. Points held in a
// vessel stay held. fill is still taken, from phones before that, and does
// nothing, so filled is always empty.
export function sceneEnd(c, s, rolls = {}, { fill = {} } = {}) {
  void fill;
  const filled = [];
  s.acting = false;
  delete s.spill;
  s.aura = auraMax(c, s);
  s.soak = {};
  const healed = zero();
  for (const r of ROOTS) {
    const roll = Math.max(0, int(rolls?.[r], 0));
    if (!roll) continue;
    const to = Math.min(capOf(c, s, r), (s.pts[r] ?? 0) + roll);
    healed[r] = Math.max(0, to - s.pts[r]);
    s.pts[r] = Math.max(s.pts[r], to);
  }
  s.toll = Math.max(0, int(s.toll, 0) - 1);
  delete s.out;
  return { healed, toll: s.toll, filled };
}
// Downtime puts everything back: wounds and Toll clear, every Root's full,
// armour's soak is back and so are all their Resources. Scars stay, and so
// does what's in their vessels, with the points held there.
export function downtimeRest(c, s) {
  s.wound = { Body: false, Mind: false, Soul: false };
  s.toll = 0;
  for (const r of ROOTS) s.pts[r] = capOf(c, s, r);
  s.soak = {};
  s.res = [];
  delete s.out;
  delete s.spill;
  return s;
}

// ---------------------------------------------------------------- Resources

// How many Resources they've got: everyone's 3, and half each pack's tier,
// rounded up, and anything else on the sheet that says so (resMore, for an
// ability that gives more).
export const packRes = (tier) => Math.ceil(clamp(tier, 0, MAX_TIER) / 2);
export const resOf = (c) => RES_BASE + (c?.items ?? []).filter((it) => it.kind === "pack").reduce((t, it) => t + packRes(it.tier), 0) + Math.max(0, int(c?.resMore, 0));
// How many they've got left to say till downtime.
export const resLeft = (c, s) => Math.max(0, resOf(c) - (Array.isArray(s?.res) ? s.res.length : 0));
// Say one: tick it, and keep their words. It's theirs from then on. It says
// whether there was one to tick.
export function sayRes(c, s, words) {
  if (resLeft(c, s) < 1) return false;
  if (!Array.isArray(s.res)) s.res = [];
  s.res.push(text(words, 120) || "something ordinary");
  return true;
}

// ---------------------------------------------------------------- vessels

// A vessel holds its tier in charge, and keeps it between scenes and through
// downtime. A broken one can't be filled or spent from till it's mended.
const vesselAt = (c, s, key) => (c.items ?? []).find((it) => it.key === key && it.kind === "vessel" && !s?.crossed?.[key]) ?? null;
export const vesselsOf = (c) => (c.items ?? []).filter((it) => it.kind === "vessel");
export const chargeOf = (c, s, key) => {
  const it = (c.items ?? []).find((x) => x.key === key && x.kind === "vessel");
  return it ? clamp(s?.charge?.[key] ?? 0, 0, it.tier) : 0;
};
function addCharge(c, s, key, n) {
  const it = vesselAt(c, s, key);
  if (!it) return 0;
  const put = Math.min(Math.max(0, int(n, 0)), it.tier - chargeOf(c, s, key));
  if (put > 0) {
    if (!s.charge || typeof s.charge !== "object") s.charge = {};
    s.charge[key] = chargeOf(c, s, key) + put;
  }
  return Math.max(0, put);
}
// Fill a vessel, and say how much went in, never past its tier.
//   from "pt": a point from root for each charge, any time in a scene, no
//     action. It's pushing, so it can leave them at 0 and never wounds them.
//     Never at a scene's end or in downtime (sceneEnd and downtimeRest never
//     do it), and never once they've left the scene.
//     Each point's held in the vessel, like a lock, till its charge is spent
//     (s.held), so the Root can't get it back at a scene's end or in
//     downtime while it's there.
//   from "aura": only Aura they'd lose. That's whatever's past their maximum
//     on s.aura (while they're acting, which they'd lose on finishing), taken
//     off it first, then s.spill, the Aura they really lost (past the maximum
//     as they finished acting, or stopping at it off their turn), which
//     gainAura and doneActing keep count of. Aura left at a scene's end
//     never goes in. The old spill option is ignored, so a phone can't say
//     it lost Aura it didn't.
export function fillVessel(c, s, key, n = 1, { from = "aura", root = null } = {}) {
  const it = vesselAt(c, s, key);
  if (!it) return 0;
  let want = Math.min(Math.max(0, int(n, 0)), it.tier - chargeOf(c, s, key));
  if (want < 1) return 0;
  if (from === "pt") {
    if (s.out || !ROOTS.includes(root)) return 0;
    want = Math.min(want, s.pts?.[root] ?? 0);
    if (want < 1) return 0;
    s.pts[root] -= want;
    const put = addCharge(c, s, key, want);
    if (!s.held || typeof s.held !== "object") s.held = {};
    s.held[key] = { ...zero(), ...obj(s.held[key]) };
    s.held[key][root] += put;
    return put;
  }
  const past = Math.max(0, int(s.aura, 0) - auraMax(c, s));
  const lost = Math.max(0, int(s.spill, 0));
  want = Math.min(want, past + lost);
  if (want < 1) return 0;
  const fromPast = Math.min(want, past);
  s.aura -= fromPast;
  if (want > fromPast) {
    s.spill = lost - (want - fromPast);
    if (!s.spill) delete s.spill;
  }
  return addCharge(c, s, key, want);
}
// Spend charge on one of their own abilities or awakenings' extra steps, a
// charge for each Aura it'd cost. It's never Aura: it never counts towards
// their maximum, never goes to a friend, and never pays for bringing in a
// Root, a tie, an intercept, a quick heal, going beyond or borrowing.
// The points held in it go first, so each Root gets its point free again
// (spent, so it comes back the usual way), then the charge from Aura.
export function spendCharge(c, s, key, n = 1) {
  const want = Math.max(0, int(n, 0));
  if (!want || !vesselAt(c, s, key) || chargeOf(c, s, key) < want) return false;
  s.charge[key] = chargeOf(c, s, key) - want;
  if (!s.charge[key]) delete s.charge[key];
  let free = want;
  const h = s.held?.[key];
  if (h) {
    for (const r of ROOTS) {
      const off = Math.min(free, Math.max(0, int(h[r], 0)));
      h[r] = Math.max(0, int(h[r], 0)) - off;
      free -= off;
    }
    if (!ROOTS.some((r) => h[r] > 0)) delete s.held[key];
  }
  return true;
}

// ---------------------------------------------------------------- Aura

// Aura's maximum: the sheet's, 5. Nothing's powered any more, so nothing
// comes off it.
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
  const over = Math.max(0, n - room);
  if (over) s.spill = Math.max(0, int(s.spill, 0)) + over;
  return over;
}
// Finished acting: anything over the maximum's gone, and kept count of in
// spill, where a vessel can still catch it.
export function doneActing(s, c) {
  const max = auraMax(c, s);
  const over = Math.max(0, s.aura - max);
  s.aura = Math.min(s.aura, max);
  s.acting = false;
  delete s.bought;
  if (over) s.spill = Math.max(0, int(s.spill, 0)) + over;
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

// ---------------------------------------------------------------- items they've got

// Every item they've got that isn't broken, each by its key. Attuned things
// can't break.
export const itemsOf = (c, s = {}) => (c.items ?? []).filter((it) => it.attuned != null || !s.crossed?.[it.key]);

// ---------------------------------------------------------------- what's on the sheet

// Everything on the sheet, each with a key that lasts a save and a reload:
//   title|i              Title i
//   perm|i|j             permission j on Title i
//   arch|i               archetype i (one taken twice is two things)
//   ability|i|<name>     an ability archetype i's got
//   attuned|i            attuned thing i
//   awk|i|<name>         an awakening on attuned thing i
//   item|<name>          an item, by its key in c.items, broken or not
// Two of the same never share a key: the second's ends in |2. root is the
// Root it's on (a permission, an awakening's lock, or a piece of armour), or
// the Root a Title puts most on, and null for the rest. A permission
// justifies bringing a Root in, an awakening's steps, and an item's tier on
// a roll it fits (addsSteps), one item a roll.
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
  for (const it of c.items ?? []) add(it.key, "item", it.name, it.root ?? null, { item: it.kind, tier: it.tier, a: it.attuned, broken: Boolean(s.crossed?.[it.key]) && it.attuned == null });
  return out;
}

// ---------------------------------------------------------------- a roll

// Count a roll on the new core: the Root, at full whatever it's got left,
// each Root brought in (bring), at full too, and 2 for each awakening that
// fits (awk) and 2 more for each Aura spent on it, and one item's tier. r is:
//   { root, bring: [{ root, perm, pay }], awk: [{ key, aura }], item, avoid, parry,
//     charge: [{ key, n }], dice, against, aim, conds: [name], pool: [{ i, die }], plus }
// item is the key of the one item doing the work, which adds its tier when
// it can (addsSteps): a tool on anything, a weapon on anything but a roll
// avoiding harm unless parry says a Warrior's paid for Parry, a guard only
// when avoid says the roll's avoiding harm, armour only then for a Warrior
// and only on the Root it's on, and a pack, a vessel or a broken one never.
// charge is charge out of their vessels paying for the Aura on awakenings,
// a charge for each Aura, never for anything else on the roll.
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
  // One item, the one doing the work.
  const it = r?.item ? (c.items ?? []).find((x) => x.key === r.item) : null;
  const broken = it && it.attuned == null && s.crossed?.[it.key];
  const skin = skinOf(c) && it?.kind === "armour" && (it.root ?? "Body") === root;
  const item = it && !broken && addsSteps(it, r?.avoid, { parry: r?.parry, skin }) ? { key: it.key, name: it.name, tier: it.tier, steps: it.tier } : null;
  // Charge paying for awakenings' Aura, never more than that Aura.
  const awkAura = awk.reduce((t, w) => t + w.aura, 0);
  const charge = [];
  let charged = 0;
  for (const x of Array.isArray(r?.charge) ? r.charge : []) {
    const n = Math.min(Math.max(0, int(x?.n, 0)), awkAura - charged);
    if (!n || charge.some((y) => y.key === x.key)) continue;
    if (!vesselAt(c, s, x.key)) continue;
    if (chargeOf(c, s, x.key) < n) short.push(`${n} charge in ${(c.items ?? []).find((y) => y.key === x.key)?.name ?? "a vessel"}`);
    charge.push({ key: x.key, n });
    charged += n;
  }
  aura -= charged;
  const conds = (s.conditions ?? []).filter((x) => (r?.conds ?? []).includes(x.name)).reduce((t, x) => t + (x.kind === "for" ? 1 : -1), 0);
  // A Shadow's pool dice, each one as steps (a d8 is 4) or as its own die.
  const taken = new Set();
  const pool = (r?.pool ?? []).filter((x) => Number.isInteger(x?.i) && s.pool?.[x.i] && !taken.has(x.i) && taken.add(x.i)).map((x) => ({ i: x.i, size: s.pool[x.i], die: Boolean(x.die) }));
  const poolSteps = pool.filter((x) => !x.die).reduce((t, x) => t + x.size / 2, 0);
  const plus = clamp(r?.plus ?? r?.handed ?? 0, 0, 60);
  const total = Math.max(1, rootN + brought.reduce((t, b) => t + b.steps, 0) + awk.reduce((t, w) => t + w.steps, 0) + (item?.steps ?? 0) + conds + poolSteps + plus);
  // Their split, if it's their steps, or the table's.
  const theirs = Array.isArray(r?.dice) && r.dice.length && r.dice.every((d) => SIZES.includes(d)) && r.dice.reduce((t, d) => t + d / 2, 0) === total ? [...r.dice] : null;
  const poolDice = pool.filter((x) => x.die).map((x) => x.size);
  // What they can't pay for.
  for (const x of ROOTS) if (points[x] > (s.pts?.[x] ?? 0)) short.push(`${points[x]} ${points[x] === 1 ? "point" : "points"} of ${x}`);
  if (aura > (s.aura ?? 0)) short.push(`${aura} Aura`);
  return {
    root, rootN, brought, awk, item, charge, conds, pool, poolDice, plus, total, points, aura, short, ok: !short.length,
    split: Boolean(theirs), dice: [...(theirs ?? stepsToDice(total)), ...poolDice],
    // For the screens that haven't moved: nothing's counted off the sheet,
    // there are no extra actions and splitting has no limit.
    using: [], cases: [], extras: [], friends: 0, other: 0, borrowed: 0, bought: 0, price: 0, free: false, splits: Math.max(0, total - 1),
  };
}
// Pay for a roll countRoll() counted: its points off their Roots, its Aura
// and its charge, all of it or none.
export function payFor(c, s, k) {
  if (!k?.ok) return false;
  for (const r of ROOTS) if ((k.points?.[r] ?? 0) > (s.pts?.[r] ?? 0)) return false;
  if ((k.aura ?? 0) > (s.aura ?? 0)) return false;
  for (const x of k.charge ?? []) if (chargeOf(c, s, x.key) < x.n) return false;
  for (const r of ROOTS) s.pts[r] -= k.points?.[r] ?? 0;
  s.aura -= k.aura ?? 0;
  for (const x of k.charge ?? []) spendCharge(c, s, x.key, x.n);
  return true;
}

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
export const restsOn = () => 4;

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
