// Armour's soak (Armour and soak in Building Your Character, 17 Nov). Every
// piece of armour is an item (kind "armour") on a Root, Body unless the sheet
// says otherwise, and it soaks as many points as its tier: a hit that gets
// through to that Root takes its point from the armour first, then the Root.
// What's used is kept in the character's state by the item's key,
// state.soak["item|plate armour"], and it's all back at the end of every
// scene (sceneEnd in roots.js). Soaking never breaks armour. A piece can
// still break as a consequence the GM names, and then it's crossed out
// (state.crossed) till it's mended in downtime. Attuned armour soaks the
// same, and can't break.
//
// takeHits() in roots.js does the soaking. What's here is for the screens:
// the pieces, what each has left, and how a piece is said. The names from
// when armour had boxes (tickedOf, setTicked, boxesSaid and the rest) are
// kept and mean soak now, so the screens from before the fixes still draw
// till prompts 5 and 6 move them.

import { itemSaid, tierName } from "./roots.js";

export const keyOf = (a) => a?.key ?? `item|${a?.name}`;
// Every piece of armour on the sheet, as items. boxes and quality are its
// tier and its tier's name, for the screens from before the fixes.
export const piecesOf = (c) => (Array.isArray(c?.items) ? c.items.filter((it) => it.kind === "armour").map((it) => ({ ...it, boxes: it.tier, quality: tierName(it.tier) })) : []);
export const pieceAt = (c, key) => piecesOf(c).find((a) => keyOf(a) === key) ?? null;
export const isBroken = (s, a) => a?.attuned == null && Boolean(s?.crossed?.[keyOf(a)]);
// How much a piece soaks a scene, and how much of it's used.
export const soakFull = (a) => Math.max(0, Math.round(Number(a?.tier) || 0));
export const usedOf = (s, a) => (isBroken(s, a) ? soakFull(a) : Math.min(soakFull(a), Math.max(0, Math.round(Number(s?.soak?.[keyOf(a)]) || 0))));
export const leftOf = (s, a) => soakFull(a) - usedOf(s, a);
// Pieces that can still soak, and the ones on a Root, with what they've got
// left between them.
export const standing = (c, s) => piecesOf(c).filter((a) => leftOf(s, a) > 0);
export const onRoot = (c, s, root) => standing(c, s).filter((a) => (a.root ?? "Body") === root);
export const soakOn = (c, s, root) => onRoot(c, s, root).reduce((t, a) => t + leftOf(s, a), 0);
// Anything broken, for downtime to mend.
export const worn = (c, s) => piecesOf(c).filter((a) => isBroken(s, a));

// Set how much of a piece's soak is used, by hand.
export function setUsed(s, a, n) {
  const key = keyOf(a);
  const to = Math.max(0, Math.min(soakFull(a), n));
  if (!s.soak || typeof s.soak !== "object") s.soak = {};
  if (to > 0) s.soak[key] = to;
  else delete s.soak[key];
  return to;
}
// Mending, in downtime, takes a broken piece's cross off.
export function mend(s, key) {
  if (s.crossed) delete s.crossed[key];
  if (s.soak) delete s.soak[key];
}

// Its name with its tier's name first, the way a sheet writes it: Proven
// plate armour, a Trusty shield.
export const said = (a) => itemSaid(a);
// "your plate armour", or with its tier, "your Proven plate armour".
const bare = (name) => String(name).replace(/^(a|an|the|her|his|their|your) /i, "");
export const yours = (a, { quality = false } = {}) => `your ${quality ? bare(itemSaid({ ...a, name: bare(a.name) })) : bare(a.name)}`;
// Worn leathers are "they" and a shield's "it".
export const many = (a) => !/^(a|an) /i.test(a.name) && /[^s]s$/i.test(String(a.name).trim());
export const itS = (a) => (many(a) ? "they’re" : "it’s");
// What a thing's called on the sheet, its tier's name first if it's an item.
export function nameOf(c, where, name) {
  const it = (c?.items ?? []).find((x) => x.name === name);
  return it ? itemSaid(it) : name;
}
// "2 of 3 soak left", for a label.
export const soakSaid = (s, a) => (isBroken(s, a) ? "broken till it’s mended" : `${leftOf(s, a)} of ${soakFull(a)} soak left`);

// The names from when armour had boxes, kept for the screens that haven't
// moved (prompts 5 and 6 of notes/fixes-plan.md), meaning soak now. Prompt
// 8 takes them out.
export const tickedOf = usedOf;
export const setTicked = setUsed;
export const tick = (s, a) => setUsed(s, a, usedOf(s, a) + 1);
export const boxesOn = soakOn;
export const boxesSaid = soakSaid;
export function withQuality(name, quality) {
  if (!quality) return name;
  const art = String(name).match(/^(a|an|the|her|his|their) /i)?.[0] ?? "";
  const rest = String(name).slice(art.length);
  return `${/^an? $/i.test(art) ? `${art[0]} ` : art}${quality} ${rest}`;
}
export const tierSaid = (n) => tierName(n);
