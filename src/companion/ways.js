// The other ways into the builder on stacking: one of the crew to start from,
// or random in one tap. Both make an ordinary build (builder.js), so the
// player can change anything before saving, and the builder's warnings still
// apply. A blank sheet is just blankBuild() on one page.
import { blankBuild, guessFor, keepAttuned, normalBuild, pointsOf, spreadFor, ARMOUR } from "./builder.js";
import { MAX_PERMS, ROOTS, spreadOf, specKey } from "./roots.js";
import { START } from "./points.js";

// A thread in someone else's words says whose ("Dorrie’s"). It's theirs to
// keep, so it doesn't come along.
const theirs = (t) => Boolean(t.whose) || /’s\b/.test(t.note ?? "");
const whoseOf = (t) => t.whose || String(t.note ?? "").match(/^([^,]+’s)(?=,|$)/)?.[1] || "";
const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
const TIER = { Common: 1, Fine: 2, Masterwork: 3 };
// A crew sheet writes a piece of armour with its quality first (Fine plate
// armour), and the armour list has the piece by its own name.
const bare = (x) => String(x).replace(/\b(Common|Fine|Masterwork)\s+/, "");

// One of the crew as a build, the way their sheet has them: their archetypes
// with the abilities each has, their Titles with their spreads and every
// permission on its Root, what they carry with their armour on its Root,
// their attuned thing, their own threads, crew answers, Aspiration and
// trouble, on the points they started on. The name's left for the player.
// With keep, it's that crew member themselves becoming your own, so nothing's
// left behind: every attuned thing at its stage with all its awakenings, every
// thread (the ones in a crewmate's words too), their name, blurb and bag.
export function fromCrew(c, B, { keep = false } = {}) {
  const b = blankBuild();
  const ideaOf = (name) => B.ideas.find((x) => x.titles.includes(name))?.id ?? "";
  const archs = (c.archetypes ?? []).map((a) => (typeof a === "string" ? { name: a } : a)).filter((a) => a?.name);
  if (archs.length) {
    b.archs = archs.map((a) => a.name);
    // A sheet from before stacking had every ability its archetypes have.
    b.have = archs.map((a) => (Array.isArray(a.have) ? [...a.have] : (B.archetypes.find((x) => x.name === a.name)?.abilities ?? []).map((x) => x.name)));
  }
  if (c.titles?.length) {
    b.titles = c.titles.map((t) => {
      const boons = (t.boons ?? []).map((x) => ({ lever: x.lever, name: x.name ?? "", on: x.on ?? "" }));
      const perms = (t.permissions ?? []).slice(0, MAX_PERMS - 2 * boons.length).map((p) => ({ text: p.text, root: ROOTS.includes(p.root) ? p.root : "" }));
      const text = t.text ?? t.name;
      return { idea: ideaOf(text), text, roots: spreadOf(t), perms: perms.length || boons.length ? perms : [{ text: "", root: "" }], boons };
    });
  }
  const armour = c.armour ?? [];
  const eq = (c.carry?.equipment ?? []).slice(0, 3);
  eq.forEach((x, i) => {
    const name = bare(x);
    const piece = armour.find((a) => a.name === name || a.name === x);
    b.equipment[i] = piece ? { text: piece.name, arm: ROOTS.includes(piece.root) ? piece.root : "Body", ...(TIER[piece.quality] > 1 ? { q: TIER[piece.quality] } : {}) } : { text: name, arm: "" };
  });
  const ut = (c.carry?.utility ?? []).slice(0, keep ? 8 : 3);
  b.utility = Array.from({ length: Math.max(3, ut.length) }, (_, i) => ({ text: ut[i] ?? "" }));
  b.keepsake = { text: c.carry?.keepsake ?? "" };
  b.bag = (c.carry?.bag?.items ?? []).join("\n");
  if (keep && c.carry?.bag?.name) b.bagName = c.carry.bag.name;
  // One of the crew becoming your own keeps every attuned thing at its stage.
  const things = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  b.attuned = things.map((a) => ({
    name: a.name, props: a.props ?? "", stage: keep ? a.stage || "Awakened" : "Awakened", catch: a.catch ?? "", burden: keep ? a.burden ?? "" : "",
    awk: (a.awakenings ?? []).slice(0, keep ? 6 : 2).map((w) => ({ name: w.name, kind: w.kind === "active" ? "active" : "passive", text: w.text })),
  }));
  if (!b.attuned.length) b.attuned = blankBuild().attuned;
  const own = c.threads.flatMap((p) => p.threads.filter((t) => keep || !theirs(t)).map((t) => ({ person: p.person, text: t.text, kind: kindOf(t), whose: keep ? whoseOf(t) : "", ...(keep && t.strained ? { strained: true } : {}) })));
  if (keep) b.threads = own;
  else own.slice(0, 4).forEach((t, i) => (b.threads[i] = t));
  b.connect = B.connect.map((q) => c.crewQs.find((x) => x.q === q)?.a ?? "");
  b.aspiration = c.aspiration?.text ?? "";
  b.pronoun = c.pronoun;
  b.trouble = [...(c.trouble ?? [])];
  b.start = Number(c.points?.start) || START;
  if (keep) {
    b.name = c.name;
    b.blurb = c.blurb ?? "";
    // What the chapter puts on an attuned thing stays on it.
    return keepAttuned(normalBuild(b, B));
  }
  return normalBuild(b, B, { fresh: true });
}

// ---------------------------------------------------------------- random

const pick = (list, rand) => (list.length ? list[Math.floor(rand() * list.length)] : undefined);
function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The Root each Title idea leans on, for a random character's spread, the
// way the crew's Titles have them. The player can change any of it.
const IDEA_ROOT = {
  "k-warrior": "Body", "k-guardian": "Body", "k-rogue": "Body", "k-face": "Soul", "k-bard": "Soul",
  "k-investigator": "Mind", "k-ranger": "Body", "k-healer": "Mind", "k-artificer": "Mind", "k-captain": "Soul",
  "k-courtier": "Soul", "k-sailor": "Body", "k-streetwise": "Mind", "k-scholar": "Mind", "k-sorcerer": "Soul",
  "k-storm": "Soul", "k-illusion": "Mind", "k-enchantment": "Soul", "k-divination": "Mind", "k-druid": "Soul",
  "k-wizard": "Mind", "k-mending": "Soul", "k-veil": "Body", "k-phase": "Body", "k-medium": "Soul",
  "k-warlock": "Soul", "k-faith": "Soul", "k-kinesis": "Mind", "k-artifice": "Mind",
};

const FIRST = ["Ar", "Bel", "Cal", "Dor", "Ed", "Fen", "Gar", "Hal", "Is", "Jor", "Kel", "Lir", "Mar", "Nev", "Os", "Per", "Ros", "Sel", "Tam", "Ul", "Ves", "Wyn", "Yar", "Zel"];
const LAST = ["a", "an", "ek", "el", "en", "eth", "ia", "in", "is", "o", "on", "ra", "ric", "wen", "ys"];

// A whole character in one tap, from the book's own ideas, items, attuned
// things and the crew's threads and Aspirations, that spends exactly the 35
// points a character starts on and passes every one of the builder's
// warnings. Two archetypes (sometimes the same one twice) and two Titles,
// each with its one, an attuned thing, and the other 10 points on more
// permissions, abilities, now and then a Boon, and what they carry. rand is
// there so a check can fix the dice.
export function randomBuild(B, crew, rand = Math.random) {
  const b = blankBuild();
  const known = new Map(B.archetypes.map((a) => [a.name, a]));
  const spares = shuffle(B.permIdeas.flatMap((g) => g.perms), rand);
  const ideas = shuffle(B.ideas.filter((x) => x.titles.length && x.archetypes.some((a) => known.has(a))), rand).slice(0, 2);
  // An archetype from each idea, so the Titles suit them, and now and then
  // the same one twice. Each comes with one ability, never one another of the
  // same archetype has.
  b.archs = ideas.map((idea) => pick(idea.archetypes.filter((a) => known.has(a)), rand));
  if (rand() < 0.15) b.archs[1] = b.archs[0];
  b.have = b.archs.map(() => []);
  const spare = (i) => (known.get(b.archs[i])?.abilities ?? []).map((x) => x.name).filter((n) => !b.archs.some((a, k) => a === b.archs[i] && b.have[k].includes(n)));
  b.archs.forEach((_, i) => {
    const one = pick(spare(i), rand);
    if (one) b.have[i].push(one);
  });

  // Two Titles, each with its first permission, and the rest of the
  // permissions waiting in its pool. Each permission once, so the same words
  // are never on the sheet twice.
  const taken = new Set();
  const pools = ideas.map((idea) => {
    const pool = shuffle(idea.permissions.filter((p) => /\s/.test(p.trim()) && !taken.has(p)), rand);
    for (const p of spares) if (pool.length < 8 && !pool.includes(p) && !taken.has(p)) pool.push(p);
    const mine = pool.slice(0, 6);
    for (const p of mine) taken.add(p);
    return mine;
  });
  b.titles = ideas.map((idea, i) => ({ idea: idea.id, text: pick(idea.titles, rand), roots: { Body: 0, Mind: 0, Soul: 0 }, perms: [], boons: [], pool: pools[i] }));
  const addPerm = (t) => {
    const p = t.pool.shift();
    if (!p) return false;
    t.perms.push({ text: p, root: guessFor(p, IDEA_ROOT[t.idea] ?? "Body").root });
    return true;
  };
  for (const t of b.titles) addPerm(t);

  // One attuned thing, out of the book's own, at Awakened with its first
  // awakening, and now and then a Catch for a second.
  const thing = pick(B.things ?? [], rand);
  if (thing) {
    const first = thing.awakenings.find((w) => w.kind === "passive") ?? thing.awakenings[0];
    const awk = [{ name: first.name, kind: first.kind, text: first.text }];
    const second = thing.awakenings.find((w) => w !== first);
    const withCatch = second && rand() < 0.4 ? pick(B.catches ?? [], rand)?.name ?? "" : "";
    if (withCatch) awk.push({ name: second.name, kind: second.kind, text: second.text });
    b.attuned = [{ name: thing.name, props: "", stage: "Awakened", catch: withCatch, burden: "", awk }];
  }

  // The other 10 points: an ability or two, now and then a Boon, two to five
  // more permissions, and the rest on what they carry, at least two things.
  let left = START - pointsOf(b).spent;
  const abilities = Math.min(left - 4, Math.floor(rand() * 3));
  let bought = 0;
  for (const i of shuffle(b.archs.map((_, k) => k), rand)) {
    if (bought >= abilities) break;
    const one = pick(spare(i), rand);
    if (one) {
      b.have[i].push(one);
      bought += 1;
    }
  }
  left -= bought;
  if (rand() < 0.15 && left >= 6) {
    const t = pick(b.titles, rand);
    const boon = pick((B.boons ?? []).filter((x) => !["Armour", "Conditions", "Getting around", "Kit"].includes(x.lever)), rand);
    if (t && boon) {
      t.boons.push({ lever: boon.lever, name: "", on: "" });
      left -= 2;
    }
  }
  const perms = Math.min(left - 2, 2 + Math.floor(rand() * 4));
  for (let k = 0, n = 0; n < perms && k < 40; k++) {
    const t = b.titles[k % b.titles.length];
    if (t.perms.length + 2 * t.boons.length < MAX_PERMS && addPerm(t)) n += 1;
  }
  left = START - pointsOf(b).spent;

  // Each Title's spread leans on its idea's Root and its permissions'.
  for (const t of b.titles) {
    const lean = IDEA_ROOT[t.idea] ?? "Body";
    t.roots = spreadFor([lean, lean, ...t.perms.map((p) => p.root)]);
    delete t.pool;
  }

  // What they carry with what's left: a weapon, a utility item, maybe plain
  // armour on the Body (Common), more utility, something worn, then the bag.
  const group = (g) => B.items.find((x) => x.group === g)?.items ?? [];
  const worn = rand() < 0.6 ? pick(group("Armour & wearables").filter((x) => ARMOUR.test(x)), rand) : null;
  const wearable = pick(group("Armour & wearables").filter((x) => !ARMOUR.test(x) && x !== worn), rand);
  const utils = shuffle([...group("Tools"), ...B.usedUp.map((u) => u.name)], rand);
  const order = [
    ["e", { text: pick(group("Weapons"), rand), arm: "" }],
    ["u", utils[0]],
    ...(worn ? [["e", { text: worn, arm: "Body" }]] : []),
    ["u", utils[1]],
    ["u", utils[2]],
    ["e", { text: wearable, arm: "" }],
    ...shuffle([...group("Personal"), ...utils.slice(3)], rand).map((x) => ["bag", x]),
  ];
  const eq = [];
  const ut = [];
  const bag = [];
  for (const [where, x] of order) {
    if (left <= 0) break;
    if (!x || (where === "e" && !x.text)) continue;
    if (where === "e" && eq.length < 3) eq.push(x);
    else if (where === "u" && ut.length < 3) ut.push(x);
    else if (where === "bag" && bag.length < 10 && !bag.includes(x)) bag.push(x);
    else continue;
    left -= 1;
  }
  eq.forEach((x, i) => (b.equipment[i] = x));
  ut.forEach((x, i) => (b.utility[i] = { text: x }));
  b.bag = bag.join("\n");
  b.keepsake = { text: pick(B.keepsakes, rand).name };

  // Two bond threads and a hostile one, from the crew's own, and sometimes the
  // third bond thread the hostile one makes room for. A different person for
  // each where there are enough to go round.
  const pool = { bond: [], hostile: [] };
  for (const c of crew) for (const p of c.threads) for (const t of p.threads) {
    if (!theirs(t) && !pool.bond.some((x) => x.text === t.text) && !pool.hostile.some((x) => x.text === t.text)) pool[kindOf(t)].push({ person: p.person, text: t.text, kind: kindOf(t), whose: "" });
  }
  const chosen = [];
  const take = (kind, n) => {
    const all = shuffle(pool[kind], rand);
    const fresh = all.filter((t) => !chosen.some((x) => specKey(x.person) === specKey(t.person)));
    for (const t of [...fresh, ...all.filter((x) => !fresh.includes(x))]) {
      if (n <= 0) break;
      if (chosen.includes(t)) continue;
      chosen.push(t);
      n -= 1;
    }
  };
  take("bond", 2);
  take("hostile", 1);
  if (chosen.some((t) => t.kind === "hostile") && rand() < 0.5) take("bond", 1);
  b.threads = chosen.map((t) => ({ ...t }));
  b.aspiration = pick(crew.map((c) => c.aspiration?.text).filter(Boolean), rand) ?? "";
  b.name = pick(FIRST, rand) + pick(LAST, rand);
  b.pronoun = pick(["her", "him", "them"], rand);
  const trouble = ideas.flatMap((x) => x.trouble);
  if (trouble.length) b.trouble = [pick(trouble, rand)];
  return normalBuild(b, B, { fresh: true });
}
