// What a character costs in points (Mo's points from 8 Nov, picked for making
// a character on 14 Nov, notes/stacking-plan.md). Everyone starts on 35, more
// for a one-shot or catching up. A Title, an archetype or an attuned thing is
// 5, and comes with its one permission, ability or awakening (a Catch brings
// an attuned thing's second awakening, the stages as Three stages has them).
// Every other permission, ability, awakening or item is 1, and a Boon's in
// place of two permissions, so it's 2. The keepsake, threads, Connect and the
// Aspiration cost nothing. Pure, so the build checks the crew with it and the
// builder counts with it.
//
// costOf() takes either a sheet (the crew's shape, or sheetOf()'s, or one
// roots.js has made) or the builder's own build, and gives
//   { spent, lines: [{ kind, what, cost }] }
// with a line for everything that costs something, kind being title, perm,
// boon, arch, ability, attuned, awk or item.

export const START = 35;
export const BIG = 5;
export const SMALL = 1;
export const BOON = 2;

const words = (v) => String(v ?? "").trim();
const named = (list, pick) => (Array.isArray(list) ? list : []).map(pick).filter(Boolean);

export function costOf(x) {
  const lines = [];
  const add = (kind, what, cost) => {
    if (cost > 0) lines.push({ kind, what, cost });
  };
  if (!x || typeof x !== "object") return { spent: 0, lines };

  // Titles: 5 with the permission they come with, then 1 for each permission
  // more and 2 for each Boon, which takes two permissions' places.
  for (const t of Array.isArray(x.titles) ? x.titles : []) {
    if (!t || typeof t !== "object") continue;
    const perms = named(t.permissions ?? t.perms, (p) => words(typeof p === "string" ? p : p?.text));
    const boons = named(t.boons, (b) => words(b?.lever) && `the ${words(b.lever)} Boon`);
    const name = words(t.text ?? t.name);
    if (!name && !perms.length && !boons.length) continue;
    add("title", perms.length ? `${name || "A Title"}, with ${perms[0]}` : name || "A Title", BIG);
    let free = 1;
    for (const p of perms.slice(1)) add("perm", p, SMALL);
    if (perms.length) free = 0;
    for (const b of boons) {
      add("boon", b, BOON - free);
      free = 0;
    }
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

  // What they carry, 1 each, bar the keepsake. A sheet keeps it in carry, and
  // the builder's build keeps equipment and utility as lines and the bag as
  // one line an item.
  const carry = x.carry && typeof x.carry === "object" ? x.carry : null;
  const items = carry
    ? [...named(carry.equipment, words), ...named(carry.utility, words), ...named(carry.bag?.items, words)]
    : [
      ...named(x.equipment, (e) => words(typeof e === "string" ? e : e?.text)),
      ...named(x.utility, (e) => words(typeof e === "string" ? e : e?.text)),
      ...(typeof x.bag === "string" ? x.bag.split("\n").map(words).filter(Boolean) : named(x.bag?.items, words)),
    ];
  for (const it of items) add("item", it, SMALL);

  return { spent: lines.reduce((t, l) => t + l.cost, 0), lines };
}
