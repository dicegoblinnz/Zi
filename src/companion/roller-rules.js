// The dice roller's rules (roller.js draws it): any dice of yours against any
// of theirs, thrown together and read the way The Roll and When It Lands read
// them. It's dice and nothing else, so it never touches a character. Pure, so
// the phone and the checks read a roll the same way.
//
// Who's defending decides how it's read (def):
// - "them": you're going at them. Their roll stands against every die you
//   throw, each of yours has to beat it, and a tie's theirs unless you pay
//   1 Aura. When they've got more than one die it's one thing rolling them
//   all, like a Layered threat, and their best is the roll that stands.
//   With one die of yours against several of theirs, each: true makes them
//   several things instead, everyone in an area or a sweep, each defending
//   on their own against your die.
// - "you": they're coming at you. Each of your dice stops one of theirs it
//   beats or ties, since ties are yours, and whatever's left gets through.
//   The dice are matched so the most get stopped, and you can swap two.
// With dice on one side only there's nothing to beat, so it's just the
// numbers, and added up, since a Move's the one roll where dice add.

export const SIDES = [2, 4, 6, 8, 10, 12];
// The most dice on one side.
export const MOST = 12;

const outOf = (v, to) => (v > to ? "beat" : v === to ? "tie" : "under");
const count = (list, what) => list.filter((x) => x === what).length;

// Your dice matched to theirs so the most get stopped, the way When It Lands
// does it: the lowest of theirs takes the lowest of yours that stops it, and
// your dice that can't stop anything go on what's left, lowest first. A die
// of theirs with none of yours left for it is -1. mine and theirs are the
// numbers rolled, and it hands back the die of yours on each of theirs.
export function bestMatch(mine, theirs) {
  const spare = mine.map((v, i) => ({ i, v })).sort((a, b) => a.v - b.v || a.i - b.i);
  const hits = theirs.map((v, j) => ({ j, v })).sort((a, b) => a.v - b.v || a.j - b.j);
  const out = theirs.map(() => -1);
  for (const h of hits) {
    const k = spare.findIndex((m) => m.v >= h.v);
    if (k >= 0) out[h.j] = spare.splice(k, 1)[0].i;
  }
  for (const h of hits) if (out[h.j] < 0 && spare.length) out[h.j] = spare.shift().i;
  return out;
}

// Two of theirs trade the dice of yours on them.
export function swapped(assign, a, b) {
  const out = [...assign];
  [out[a], out[b]] = [out[b], out[a]];
  return out;
}

// A matching only stands when it puts each of your dice on one of theirs at
// most, and nothing that isn't there.
function fits(assign, mine, theirs) {
  if (!Array.isArray(assign) || assign.length !== theirs) return false;
  const used = assign.filter((i) => i !== -1);
  return used.every((i) => Number.isInteger(i) && i >= 0 && i < mine) && new Set(used).size === used.length;
}

// mine and theirs are the dice as they came up, [{ size, v }]. assign is a
// matching from a swap, when they're coming at you.
export function readDice({ mine = [], theirs = [], def = "them", each = false, assign = null } = {}) {
  const tops = mine.flatMap((d, i) => (d.v === d.size ? [i] : []));
  if (!mine.length || !theirs.length) {
    const list = mine.length ? mine : theirs;
    return { way: "free", tops, total: list.reduce((n, d) => n + d.v, 0) };
  }
  if (def === "you") {
    const match = fits(assign, mine.length, theirs.length) ? [...assign] : bestMatch(mine.map((d) => d.v), theirs.map((d) => d.v));
    const lanes = theirs.map((d, j) => {
      const i = match[j];
      return { j, i, out: i >= 0 && mine[i].v >= d.v ? "stopped" : "through" };
    });
    const used = new Set(match);
    const outs = lanes.map((l) => l.out);
    return { way: "defend", tops, assign: match, lanes, stopped: count(outs, "stopped"), through: count(outs, "through"), spare: mine.flatMap((_, i) => (used.has(i) ? [] : [i])) };
  }
  if (each && mine.length === 1 && theirs.length > 1) {
    const lanes = theirs.map((d, j) => ({ j, i: 0, out: outOf(mine[0].v, d.v) }));
    const outs = lanes.map((l) => l.out);
    return { way: "each", tops, lanes, beat: count(outs, "beat"), ties: count(outs, "tie") };
  }
  const at = theirs.reduce((best, d, j) => (d.v > theirs[best].v ? j : best), 0);
  const stands = theirs[at].v;
  const outs = mine.map((d) => outOf(d.v, stands));
  return { way: "act", tops, at, stands, outs, beat: count(outs, "beat"), ties: count(outs, "tie") };
}

// What's kept on the phone between rolls: the dice on each side, who's
// defending and whether they're one thing or several. Anything that isn't
// one of those comes back as it starts: no dice, and them coming at you,
// since dice matched to blocks after the roll are what the roller was asked
// for, till it's set the other way.
export function setupOf(raw) {
  const side = (list) => (Array.isArray(list) ? list.map(Number).filter((d) => SIDES.includes(d)).slice(0, MOST) : []);
  const x = raw && typeof raw === "object" ? raw : {};
  return { you: side(x.you), them: side(x.them), def: x.def === "them" ? "them" : "you", each: x.each === true };
}
