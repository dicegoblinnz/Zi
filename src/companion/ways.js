// The other ways into the builder on Roots: one of the crew to start from, or
// random in one tap. Both make an ordinary build (builder.js), so the player
// can change anything before saving, and the builder's warnings still apply.
// A blank sheet is just blankBuild() on one page.
import { blankBuild, guessFor, keepAttuned, normalBuild, ARMOUR } from "./builder.js";
import { MAX_PERMS, ROOTS, specKey } from "./roots.js";

// A thread in someone else's words says whose ("Dorrie’s"). It's theirs to
// keep, so it doesn't come along.
const theirs = (t) => Boolean(t.whose) || /’s\b/.test(t.note ?? "");
const whoseOf = (t) => t.whose || String(t.note ?? "").match(/^([^,]+’s)(?=,|$)/)?.[1] || "";
const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
const TIER = { Common: 1, Fine: 2, Masterwork: 3 };
// A crew sheet writes a piece of armour with its quality first (Fine plate
// armour), and the armour list has the piece by its own name.
const bare = (x) => String(x).replace(/\b(Common|Fine|Masterwork)\s+/, "");
const three = (list) => {
  const out = list.slice(0, 3);
  while (out.length < 3) out.push("");
  return out;
};

// One of the crew as a build: their archetypes, Titles with their Roots,
// specialties and permissions, what they carry with their armour on its
// Root, their attuned thing, their own threads, crew answers, Aspiration and
// trouble. The name's left for the player. With keep, it's that crew member
// themselves becoming your own, so nothing's left behind: every Title and
// permission, every attuned thing at its stage with all its awakenings,
// every thread (the ones in a crewmate's words too), their name and blurb.
export function fromCrew(c, B, { keep = false } = {}) {
  const b = blankBuild();
  const ideaOf = (name) => B.ideas.find((x) => x.titles.includes(name))?.id ?? "";
  b.archs = (c.archetypes ?? []).map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean);
  if (!keep) b.archs = b.archs.slice(0, 2);
  while (b.archs.length < 2 && !keep) b.archs.push("");
  b.titles = (keep ? c.titles : c.titles.slice(0, 2)).map((t) => {
    const boons = keep ? (t.boons ?? []).map((x) => ({ lever: x.lever, name: x.name ?? "", on: x.on ?? "" })) : [];
    const perms = t.permissions.slice(0, keep ? MAX_PERMS - 2 * boons.length : 3).map((p) => ({ text: p.text, root: p.root, spec: p.specialty }));
    while (!keep && perms.length < 3) perms.push({ text: "", root: "", spec: "" });
    return { idea: ideaOf(t.name), text: t.name, root: t.root ?? "", specs: three([...(t.specialties ?? [])]), perms, boons };
  });
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
  // A new character attunes one thing. One of the crew becoming your own
  // keeps everything they've got.
  const things = Array.isArray(c.attuned) ? c.attuned : c.attuned ? [c.attuned] : [];
  b.attuned = (keep ? things : things.slice(0, 1)).map((a) => ({
    name: a.name, props: a.props ?? "", stage: keep ? a.stage || "Awakened" : "Awakened", catch: a.catch ?? "", burden: keep ? a.burden ?? "" : "", aura: a.aura ?? "",
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
  if (keep) {
    b.name = c.name;
    b.order = (c.specialties ?? []).map((x) => x.name);
    b.blurb = c.blurb ?? "";
    // What the chapter puts on an attuned thing stays on it.
    return keepAttuned(normalBuild(b));
  }
  return normalBuild(b);
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

// Each Title idea's Root and three specialties, for a random character, the
// way the crew's Titles have them. The player can change any of it.
const IDEA_SPECS = {
  "k-warrior": ["Body", "Swordplay", "Brawling", "Duelling"],
  "k-guardian": ["Body", "Shieldwork", "Bodyguarding", "Lifting"],
  "k-rogue": ["Body", "Stealth", "Climbing", "Locks"],
  "k-face": ["Soul", "Persuasion", "Lying", "Reading people"],
  "k-bard": ["Soul", "Music", "Crowds", "Gossip"],
  "k-investigator": ["Mind", "Investigation", "Questioning", "Poisons"],
  "k-ranger": ["Body", "Tracking", "Archery", "Wildcraft"],
  "k-healer": ["Mind", "Medicine", "Remedies", "Nursing"],
  "k-artificer": ["Mind", "Machines", "Traps", "Salvage"],
  "k-captain": ["Soul", "Command", "Tactics", "Soldiering"],
  "k-courtier": ["Soul", "Court lore", "Etiquette", "Gossip"],
  "k-sailor": ["Body", "Sailing", "Navigation", "Rigging"],
  "k-streetwise": ["Mind", "The streets", "Black market", "Tailing"],
  "k-scholar": ["Mind", "History", "Research", "Dead languages"],
  "k-sorcerer": ["Soul", "Fire", "Light", "Fire-signs"],
  "k-storm": ["Soul", "Lightning", "Wind", "Weather"],
  "k-illusion": ["Mind", "Illusion", "Disguise", "Misdirection"],
  "k-enchantment": ["Soul", "Charm", "Fear", "Reading people"],
  "k-divination": ["Mind", "Foresight", "Lies", "Finding things"],
  "k-druid": ["Soul", "Beasts", "Plants", "Weather"],
  "k-wizard": ["Mind", "Warding", "Sigils", "Spirits"],
  "k-mending": ["Soul", "Healing", "Mending", "Poisons"],
  "k-veil": ["Body", "Darkness", "Stealth", "Watching"],
  "k-phase": ["Body", "Phasing", "Slipping", "Walls"],
  "k-medium": ["Soul", "The dead", "Rites", "Raising"],
  "k-warlock": ["Soul", "Curses", "Bad luck", "Secrets"],
  "k-faith": ["Soul", "Prayer", "Blessing", "Temples"],
  "k-kinesis": ["Mind", "Kinesis", "Lifting", "Throwing"],
  "k-artifice": ["Mind", "Sigils", "Constructs", "Vaults"],
};

const FIRST = ["Ar", "Bel", "Cal", "Dor", "Ed", "Fen", "Gar", "Hal", "Is", "Jor", "Kel", "Lir", "Mar", "Nev", "Os", "Per", "Ros", "Sel", "Tam", "Ul", "Ves", "Wyn", "Yar", "Zel"];
const LAST = ["a", "an", "ek", "el", "en", "eth", "ia", "in", "is", "o", "on", "ra", "ric", "wen", "ys"];

// A whole character in one tap, from the book's own ideas, items, attuned
// things and the crew's threads and Aspirations, that passes every one of the
// builder's warnings. rand is there so a check can fix the dice.
export function randomBuild(B, crew, rand = Math.random) {
  const b = blankBuild();
  const known = new Set(B.archetypes.map((a) => a.name));
  const spares = shuffle(B.permIdeas.flatMap((g) => g.perms), rand);
  const ideas = shuffle(B.ideas.filter((x) => x.titles.length && x.archetypes.some((a) => known.has(a))), rand).slice(0, 2);
  // An archetype from each idea, so the Titles suit them.
  b.archs = ideas.map((idea) => pick(idea.archetypes.filter((a) => known.has(a)), rand));
  // Each permission once, so the same words are never on the sheet twice.
  const taken = new Set();
  ideas.forEach((idea, i) => {
    const [root, ...specs] = IDEA_SPECS[idea.id] ?? ["Body", idea.name, "", ""];
    const perms = shuffle(idea.permissions.filter((p) => /\s/.test(p.trim()) && !taken.has(p)), rand);
    for (const p of spares) if (perms.length < 3 && !perms.includes(p) && !taken.has(p)) perms.push(p);
    for (const p of perms.slice(0, 3)) taken.add(p);
    // A permission's specialty is the Title's own that shares a word with
    // it, or the next one along, so all three of the Title's get used.
    let next = 0;
    const lines = perms.slice(0, 3).map((p) => {
      const g = guessFor(p, specs, root);
      const spec = g.spec || specs[next++ % specs.length];
      return { text: p, root: g.root, spec };
    });
    b.titles[i] = { idea: idea.id, text: pick(idea.titles, rand), root, specs: [...specs], perms: lines, boons: [] };
  });

  const group = (g) => B.items.find((x) => x.group === g)?.items ?? [];
  b.equipment[0] = { text: pick(group("Weapons"), rand), arm: "" };
  if (rand() < 0.6) {
    // Plain armour, a shield or a helmet, on the Body, and Common.
    const worn = pick(group("Armour & wearables").filter((x) => ARMOUR.test(x)), rand);
    if (worn) b.equipment[1] = { text: worn, arm: "Body" };
  }
  shuffle([...group("Tools"), ...B.usedUp.map((u) => u.name)], rand).slice(0, 2).forEach((x, i) => (b.utility[i] = { text: x }));
  b.keepsake = { text: pick(B.keepsakes, rand).name };
  // One attuned thing, out of the book's own, at Awakened with its first
  // awakening and its own way to Aura.
  const thing = pick(B.things ?? [], rand);
  if (thing) {
    const first = thing.awakenings.find((w) => w.kind === "passive") ?? thing.awakenings[0];
    b.attuned = [{ name: thing.name, props: "", stage: "Awakened", catch: "", burden: "", aura: thing.aura, awk: [{ name: first.name, kind: first.kind, text: first.text }] }];
  }

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
  return normalBuild(b);
}
