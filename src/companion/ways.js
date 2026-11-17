// The other ways into the builder on the 17 Nov fixes (each Title spreading
// 5, each awakening on the Root it locks, items with their tiers): one of the
// crew to start from, or random in one tap. Both make an ordinary build
// (builder.js), so the player can change anything before saving, and the
// builder's warnings still apply. A blank sheet is just blankBuild() on one
// page.
import { blankBuild, guessFor, itemFor, keepAttuned, normalBuild, pointsOf, spreadFor } from "./builder.js";
import { KINDS, MAX_ITEMS, MAX_PERMS, MAX_START_TIER, ROOTS, START_TIER, spreadOf, specKey } from "./roots.js";
import { START } from "./points.js";

// A thread in someone else's words says whose ("Dorrie’s"). It's theirs to
// keep, so it doesn't come along.
const theirs = (t) => Boolean(t.whose) || /’s\b/.test(t.note ?? "");
const whoseOf = (t) => t.whose || String(t.note ?? "").match(/^([^,]+’s)(?=,|$)/)?.[1] || "";
const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
// An item off a sheet as the builder keeps it.
const itemIn = (it) => ({ text: it.name, kind: KINDS.includes(it.kind) ? it.kind : "tool", tier: Number(it.tier) || START_TIER, root: it.kind === "armour" ? (ROOTS.includes(it.root) ? it.root : "Body") : "", props: it.kind === "weapon" ? [...(it.props ?? [])] : [] });

// One of the crew as a build, the way their sheet has them: their archetypes
// with the abilities each has, their Titles with their spreads and every
// permission on its Root, their items with their kinds and tiers, their
// attuned thing as one of them, their keepsake, their own threads, crew
// answers, Aspiration and trouble, on the points they started on. The name's
// left for the player. With keep, it's that crew member themselves becoming
// your own, so nothing's left behind: every attuned thing at its stage with
// all its awakenings, every thread (the ones in a crewmate's words too), and
// their name and blurb.
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
      const perms = (t.permissions ?? []).slice(0, MAX_PERMS).map((p) => ({ text: p.text, root: ROOTS.includes(p.root) ? p.root : "" }));
      const text = t.text ?? t.name;
      return { idea: ideaOf(text), text, roots: spreadOf(t), perms: perms.length ? perms : [{ text: "", root: "" }] };
    });
  }
  // Their items, the attuned things among them as the things themselves.
  const items = Array.isArray(c.items) ? c.items : [];
  b.items = items.filter((it) => it.attuned == null).map(itemIn);
  b.keepsake = { text: c.keepsake ?? "" };
  // One of the crew becoming your own keeps every attuned thing at its stage.
  const things = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  b.attuned = things.map((a, i) => {
    const it = items.find((x) => x.attuned === i);
    const { text, ...as } = it ? itemIn(it) : itemFor(a.name, B);
    return {
      name: a.name, ...as, stage: keep ? a.stage || "Awakened" : "Awakened", catch: a.catch ?? "", burden: keep ? a.burden ?? "" : "",
      awk: (a.awakenings ?? []).slice(0, keep ? 6 : 2).map((w) => ({ name: w.name, root: ROOTS.includes(w.root) && !w.guessed ? w.root : "", text: w.text })),
    };
  });
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
// permissions, abilities and items at tier 2 or 3. rand is there so a check
// can fix the dice.
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
  b.titles = ideas.map((idea, i) => ({ idea: idea.id, text: pick(idea.titles, rand), roots: { Body: 0, Mind: 0, Soul: 0 }, perms: [], pool: pools[i] }));
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
    const first = thing.awakenings[0];
    const awk = [{ name: first.name, root: first.root ?? "", text: first.text }];
    const second = thing.awakenings.find((w) => w !== first);
    const withCatch = second && rand() < 0.4 ? pick(B.catches ?? [], rand)?.name ?? "" : "";
    if (withCatch) awk.push({ name: second.name, root: second.root ?? "", text: second.text });
    const kind = KINDS.includes(thing.kind) ? thing.kind : itemFor(thing.name, B).kind;
    b.attuned = [{ name: thing.name, kind, tier: START_TIER, root: kind === "armour" ? (ROOTS.includes(thing.root) ? thing.root : "Body") : "", props: kind === "weapon" ? [...(thing.props ?? [])] : [], stage: "Awakened", catch: withCatch, burden: "", awk }];
  }

  // The other 10 points: an ability or two, two to five more permissions,
  // and the rest on items, at least two of them.
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
  const perms = Math.min(left - 2, 2 + Math.floor(rand() * 4));
  for (let k = 0, n = 0; n < perms && k < 40; k++) {
    const t = b.titles[k % b.titles.length];
    if (t.perms.length < MAX_PERMS && addPerm(t)) n += 1;
  }
  left = START - pointsOf(b).spent;

  // Each Title's spread leans on its idea's Root and its permissions'.
  for (const t of b.titles) {
    const lean = IDEA_ROOT[t.idea] ?? "Body";
    t.roots = spreadFor([lean, lean, ...t.perms.map((p) => p.root)]);
    delete t.pool;
  }

  // Each awakening locks a point of its Root, so the attuned thing's has to
  // fit a Root they've got points on. If it doesn't, another of the book's
  // things that does takes its place, with the same Catch, so it costs the
  // same.
  const roots = { Body: 0, Mind: 0, Soul: 0 };
  for (const t of b.titles) for (const r of ROOTS) roots[r] += (t.roots[r] ?? 0) + t.perms.filter((p) => p.root === r).length;
  const fitsRoots = (list) => {
    const lock = { Body: 0, Mind: 0, Soul: 0 };
    return list.every((w) => ROOTS.includes(w.root) && ++lock[w.root] <= roots[w.root]);
  };
  const a0 = b.attuned[0];
  if (a0?.name && !fitsRoots(a0.awk)) {
    const n = a0.awk.length;
    const other = pick((B.things ?? []).filter((x) => x.awakenings.length >= n && fitsRoots(x.awakenings.slice(0, n))), rand);
    if (other) b.attuned = [{ ...a0, name: other.name, awk: other.awakenings.slice(0, n).map((w) => ({ name: w.name, root: w.root, text: w.text })) }];
  }

  // Items with what's left, a point each at tier 2: a weapon, a tool, maybe
  // armour on the Body, then a guard, a focus, a pack or a vessel, up to six
  // with the attuned thing. Whatever's left after that puts things up to
  // tier 3, the attuned thing too, a point a tier.
  const group = (g) => B.items.find((x) => x.group === g)?.items ?? [];
  const order = [
    pick(group("Weapons"), rand),
    pick(group("Tools"), rand),
    ...(rand() < 0.6 ? [pick(group("Armour").filter((x) => !/\((Mind|Soul)\)/.test(x)), rand)] : []),
    ...shuffle([pick(group("Guards"), rand), pick(group("Foci"), rand), pick(group("Packs"), rand), pick(group("Vessels"), rand), pick(group("Tools"), rand)], rand),
  ].filter(Boolean);
  const room = MAX_ITEMS - b.attuned.filter((a) => a.name).length;
  const seen = new Set();
  b.items = [];
  for (const name of order) {
    if (left <= 0 || b.items.length >= room) break;
    const it = itemFor(name, B);
    if (seen.has(it.text.toLowerCase())) continue;
    seen.add(it.text.toLowerCase());
    b.items.push(it);
    left -= 1;
  }
  for (const it of shuffle([...b.items, ...b.attuned.filter((a) => a.name)], rand)) {
    if (left <= 0) break;
    if (it.tier < MAX_START_TIER) {
      it.tier += 1;
      left -= 1;
    }
  }
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
