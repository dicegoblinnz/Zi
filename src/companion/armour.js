// Armour's boxes (Armour and Quality in Building Your Character). Every piece
// of equipment on a character's Defend is armour, a shield or a helmet, and
// its quality (Common, Fine or Masterwork, read off the book) is how many
// boxes it's got. A blow it takes for them ticks one, and the last one breaks
// it: it's crossed out till it's mended, the same as anything else they
// carry, and comes off Defend till then. A piece with boxes ticked is still a
// line. What's ticked is kept in the character's state by where it is and its
// name, like crossed: state.boxes["equipment|plate armour"]. Mending, in
// downtime, clears every box on one piece. Attuned things can't break, so
// they're never armour here.

export const keyOf = (a) => `equipment|${a.name}`;
export const piecesOf = (c) => (Array.isArray(c?.armour) ? c.armour : []);
export const pieceAt = (c, key) => piecesOf(c).find((a) => keyOf(a) === key) ?? null;
export const isBroken = (s, a) => Boolean(s.crossed?.[keyOf(a)]);
export const tickedOf = (s, a) => (isBroken(s, a) ? a.boxes : Math.min(a.boxes, Math.max(0, Math.round(Number(s.boxes?.[keyOf(a)]) || 0))));
export const leftOf = (s, a) => a.boxes - tickedOf(s, a);
// Pieces that can still take a blow.
export const standing = (c, s) => piecesOf(c).filter((a) => leftOf(s, a) > 0);
// Anything with a box ticked or broken, for downtime to mend.
export const worn = (c, s) => piecesOf(c).filter((a) => tickedOf(s, a) > 0);

// Set how many boxes are ticked: all of them breaks it, and fewer brings it
// back. Ticking one more is set(s, a, tickedOf(s, a) + 1).
export function setTicked(s, a, n) {
  const key = keyOf(a);
  const to = Math.max(0, Math.min(a.boxes, n));
  if (!s.boxes || typeof s.boxes !== "object") s.boxes = {};
  if (to >= a.boxes) s.crossed[key] = true;
  else delete s.crossed[key];
  if (to > 0 && to < a.boxes) s.boxes[key] = to;
  else delete s.boxes[key];
  return to;
}
export const tick = (s, a) => setTicked(s, a, tickedOf(s, a) + 1);
export function mend(s, key) {
  delete s.crossed[key];
  if (s.boxes) delete s.boxes[key];
}

// Its name with its quality first, the way a sheet writes it: Fine plate
// armour, a Common shield.
export function withQuality(name, quality) {
  if (!quality) return name;
  const art = String(name).match(/^(a|an|the|her|his|their) /i)?.[0] ?? "";
  const rest = String(name).slice(art.length);
  return `${/^an? $/i.test(art) ? `${art[0]} ` : art}${quality} ${rest}`;
}
// "your plate armour", or with its quality, "your Fine plate armour".
const bare = (name) => String(name).replace(/^(a|an|the|her|his|their|your) /i, "");
export const yours = (a, { quality = false } = {}) => `your ${quality ? withQuality(bare(a.name), a.quality) : bare(a.name)}`;
// Worn leathers are "they" and a shield's "it".
export const many = (a) => !/^(a|an) /i.test(a.name) && /[^s]s$/i.test(String(a.name).trim());
export const itS = (a) => (many(a) ? "they’re" : "it’s");
// What a thing's called on the sheet, its quality first if it's armour.
export function nameOf(c, where, name) {
  const a = where === "equipment" ? piecesOf(c).find((x) => x.name === name) : null;
  return a ? withQuality(name, a.quality) : name;
}
// "1 of 2 boxes left", for a label.
export const boxesSaid = (s, a) => (isBroken(s, a) ? "broken till it’s mended" : `${leftOf(s, a)} of ${a.boxes} ${a.boxes === 1 ? "box" : "boxes"} left`);
