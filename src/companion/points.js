// What a character costs in points (Mo's points from 8 Nov, picked for making
// a character on 14 Nov, notes/stacking-plan.md, and the 17 Nov fixes,
// notes/fixes-plan.md). Everyone starts on 35, more for a one-shot or
// catching up. A Title, an archetype or an attuned thing is 5, and comes
// with its one permission, ability or awakening (a Catch brings an attuned
// thing's second awakening, the stages as Three stages has them). Every
// other permission, ability or awakening is 1. An item's 1 point and comes
// at tier 2, and each tier above that's 1 more (tier 3 at most when you make
// a character, which the checks say, not this). An attuned thing's 5 is the
// thing itself at tier 2 as well, so only its tiers above 2 cost. There are
// no Boons. The keepsake, Resources, threads, Connect and the Aspiration
// cost nothing. Pure, so the build checks the crew with it and the builder
// counts with it.
//
// costOf() takes either a sheet (the crew's shape, or sheetOf()'s, or one
// roots.js has made) or the builder's own build, and gives
//   { spent, lines: [{ kind, what, cost }] }
// with a line for everything that costs something, kind being title, perm,
// arch, ability, attuned, awk, item or tier.

export const START = 35;
export const BIG = 5;
export const SMALL = 1;
// An item comes at tier 2 for its point.
export const ITEM_TIER = 2;

const words = (v) => String(v ?? "").trim();
const named = (list, pick) => (Array.isArray(list) ? list : []).map(pick).filter(Boolean);

export function costOf(x) {
  const lines = [];
  const add = (kind, what, cost) => {
    if (cost > 0) lines.push({ kind, what, cost });
  };
  if (!x || typeof x !== "object") return { spent: 0, lines };

  // Titles: 5 with the permission they come with, then 1 for each permission
  // more. A Boon's gone, so it costs nothing.
  for (const t of Array.isArray(x.titles) ? x.titles : []) {
    if (!t || typeof t !== "object") continue;
    const perms = named(t.permissions ?? t.perms, (p) => words(typeof p === "string" ? p : p?.text));
    const name = words(t.text ?? t.name);
    if (!name && !perms.length) continue;
    add("title", perms.length ? `${name || "A Title"}, with ${perms[0]}` : name || "A Title", BIG);
    for (const p of perms.slice(1)) add("perm", p, SMALL);
  }

  // Archetypes: 5 with the ability they come with, the first they've got,
  // and 1 for each ability more. One with no list of what it's got comes
  // with its one.
  const archs = Array.isArray(x.archetypes) ? x.archetypes : Array.isArray(x.archs) ? x.archs : [];
  for (const a of archs) {
    const name = words(typeof a === "string" ? a : a?.name);
    if (!name) continue;
    const have = [...new Set(named(typeof a === "object" ? a.have : null, words))];
    add("arch", have.length ? `${name}, with ${have[0]}` : name, BIG);
    for (const h of have.slice(1)) add("ability", `${h} (${name})`, SMALL);
  }

  // Attuned things: 5 with their first awakening, and the second free with a
  // Catch. Every awakening past those is 1.
  const things = Array.isArray(x.attuned) ? x.attuned : x.attuned ? [x.attuned] : [];
  for (const a of things) {
    if (!a || typeof a !== "object") continue;
    const awk = named(a.awakenings ?? a.awk, (w) => words(w?.name) || words(w?.text));
    const name = words(a.name);
    if (!name && !awk.length) continue;
    const comes = words(a.catch) ? 2 : 1;
    add("attuned", awk.length ? `${name || "An attuned thing"}, with ${awk.slice(0, comes).join(" and ")}` : name || "An attuned thing", BIG);
    for (const w of awk.slice(comes)) add("awk", w, SMALL);
  }

  // Items: 1 each at tier 2, and 1 for each tier above. An attuned one's
  // first point is in its 5. A sheet or a build since the fixes has items.
  // One from before (carry and armour, or the builder's equipment) has each
  // piece of equipment as an item at tier 2, armour a tier above its quality
  // (Common 2, Fine 3, Masterwork 4), and its utility items and bag cost
  // nothing, since they're Resources now.
  const tierOf = (v) => Math.min(6, Math.max(1, Math.round(Number(v) || ITEM_TIER)));
  let items;
  if (Array.isArray(x.items)) items = x.items.filter((it) => it && words(it.name)).map((it) => ({ name: words(it.name), tier: tierOf(it.tier), attuned: Number.isInteger(it.attuned) || it.attuned === true }));
  else {
    const armour = Array.isArray(x.armour) ? x.armour : [];
    const bare = (s) => String(s).replace(/\b(Common|Fine|Masterwork)\s+/, "");
    const q = (e) => {
      const name = words(typeof e === "string" ? e : e?.text);
      const a = armour.find((p) => p.name === name || p.name === bare(name));
      const n = Number(a?.q ?? a?.tier ?? (typeof e === "object" ? e?.q : 0)) || 0;
      return { name, tier: n ? tierOf(n + 1) : ITEM_TIER, attuned: false };
    };
    const carry = x.carry && typeof x.carry === "object" ? x.carry : null;
    items = (carry ? (Array.isArray(carry.equipment) ? carry.equipment : []) : Array.isArray(x.equipment) ? x.equipment : []).map(q).filter((it) => it.name);
  }
  for (const it of items) {
    if (!it.attuned) add("item", it.name, SMALL);
    add("tier", `${it.name} to tier ${it.tier}`, Math.max(0, it.tier - ITEM_TIER));
  }

  return { spent: lines.reduce((t, l) => t + l.cost, 0), lines };
}
