// Steps into dice, exactly as the table in The Core (#steps-into-dice):
// your die is your steps × 2, up to a d12, every six steps gives you another
// d12, and whatever's left over makes one more die. The build script uses this
// too, to check every set action on the crew's sheets.

export const SIZES = [2, 4, 6, 8, 10, 12];

export function stepsToDice(steps) {
  let left = Math.max(0, Math.floor(steps));
  const dice = [];
  for (; left >= 6; left -= 6) dice.push(12);
  if (left) dice.push(left * 2);
  return dice;
}

// The way the book writes a set of dice: "d8", "d12 + d2", "2d12", "3d12 + d4".
export function diceLabel(dice) {
  const counts = new Map();
  for (const d of [...dice].sort((a, b) => b - a)) counts.set(d, (counts.get(d) ?? 0) + 1);
  return [...counts].map(([d, n]) => `${n > 1 ? n : ""}d${d}`).join(" + ");
}

// The fewest and most dice a roll can be: the table's dice, plus one split for
// every action in the roll. A die needs at least 1 step (a d2).
export function diceRange(steps, splits) {
  const fewest = stepsToDice(steps).length;
  return { fewest, most: Math.min(steps, fewest + Math.max(0, splits)) };
}

// Every way to share the steps between this many dice, none bigger than a d12.
// When it's the table's number of dice, the table's own shape comes first.
// Otherwise the most even shape does.
export function diceShapes(steps, count) {
  const parts = [];
  const walk = (left, k, cap, acc) => {
    if (!k) {
      if (!left) parts.push(acc);
      return;
    }
    for (let s = Math.min(cap, left - (k - 1)); s >= Math.ceil(left / k); s--) walk(left - s, k - 1, s, [...acc, s]);
  };
  if (count >= 1 && steps >= count) walk(steps, count, 6, []);
  const spread = (p) => p[0] - p[p.length - 1];
  const shapes = parts.map((p) => p.map((s) => s * 2)).sort((a, b) => spread(a) - spread(b));
  const table = stepsToDice(steps).join();
  const i = shapes.findIndex((s) => s.join() === table);
  if (i > 0) shapes.unshift(...shapes.splice(i, 1));
  return shapes;
}

// One fair roll of a die, with no lean towards low numbers.
export function rollDie(size) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / size) * size;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return 1 + (buf[0] % size);
}

// A size up or down the ladder, from d2 to d12 (or a cap you give it).
export const sizeUp = (die, cap = 12) => Math.min(cap, die + 2);
export const sizeDown = (die, floor = 2) => Math.max(floor, die - 2);
