// The character builder on Roots (8 Nov 2026, stage 4 of notes/roots-plan.md):
// the Quick Build from the rules, one step to a screen on a phone held in one
// hand, with the book's own words for each step. Two archetypes, two Titles
// each with a Root and three specialties, three permissions on each with a
// Root and a specialty, the Roots and specialties added up, what you carry
// with armour on the Root it guards, one attuned thing with its own way to
// Aura and its awakening, threads and an Aspiration. It warns but never
// blocks, bar one thing: a Title holds six permission slots, and a Boon takes
// two of them.
// Drafts are saved on the phone as you go, in one localStorage key, zi-drafts,
// by "new" or by the id of the character being changed, so nothing's lost if
// the page closes. A finished character keeps only what the player chose (its
// build), and sheetOf() turns that into the same sheet the crew have, which
// roots.js reads against the current rules every time it opens. The guided
// build goes a step at a time, and the other ways in (a blank sheet, one of
// the crew, or random, from ways.js) open with every step on one page.
// Changing a saved character opens on one page too, with everything on their
// sheet and whatever they grew in downtime (foldGrown), and so does rebuilding
// one built before Roots (fromBefore).

import { diceLabel, stepsToDice } from "./dice.js";
import * as R from "./roots.js";
import { many } from "./armour.js";
import { bondKey, bondName, bondsOf, threadNote } from "./threads.js";
import { SIGILS, aura as kitAura, boxes as kitBoxes, crest, die as kitDie, grow as growDie, sigil } from "../kit/kit.js";

const KEY = "zi-drafts";
export const MAX_TITLES = 24;
const MAX_ARCHS = 12;
const MAX_ATTUNED = 8;
const MAX_THREADS = 40;
const MAX_PERMS = R.MAX_PERMS;
const ROOTS = R.ROOTS;
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"];
const ord = (i) => ORD[i] ?? `${i + 1}${(i + 1) % 100 >= 11 && (i + 1) % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][(i + 1) % 10] ?? "th"}`;
// Plain armour, a shield and a helmet guard your Body, so they go on it as
// they're written in. Mind and Soul armour (court clothes, a holy symbol) is
// the player's to say.
export const ARMOUR = /\b(plate|chain|mail|leathers|shield|armou?r|breastplate|hauberk|brigandine|helm|helmet)\b/i;
// A piece of armour's quality is its tier in the book's table (1 Common, 2
// Fine, 3 Masterwork), kept on its equipment line as q.
export const tierOf = (x) => ([1, 2, 3].includes(Number(x?.q)) ? Number(x.q) : 1);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const both = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");
const ROOT_SAYS = { Body: "what your hands and feet do", Mind: "what goes on in your head", Soul: "who you are" };
const TRACK_OF = { Body: "Stamina", Mind: "Confidence", Soul: "Resolve" };

// ---------------------------------------------------------------- the build
//
//   { v: 3, archs: [name], titles: [{ idea, text, root, specs: [3],
//     perms: [{ text, root, spec }], boons: [{ lever, name, on }] }],
//     equipment: [{ text, arm, q }], utility: [{ text }], keepsake: { text },
//     bag, attuned: [{ name, stage, catch, burden, aura,
//     awk: [{ name, kind, text, kept }] }], threads, connect, aspiration,
//     name, pronoun, blurb, trouble }
//
// arm is the Root a piece of armour guards ("" when it isn't armour). kept is
// on an awakening that was on the sheet already past what its thing's stage
// holds (a crew sheet, or downtime's Finish anyway), so it stays there.

const line = () => ({ text: "" });
const blankPerm = () => ({ text: "", root: "", spec: "" });
const blankTitle = () => ({ idea: "", text: "", root: "", specs: ["", "", ""], perms: [blankPerm(), blankPerm(), blankPerm()], boons: [] });
const blankKit = () => ({ text: "", arm: "" });
const blankAwk = (kind = "passive") => ({ name: "", kind, text: "" });
const blankThing = () => ({ name: "", props: "", stage: "Awakened", catch: "", burden: "", aura: "", awk: [blankAwk(), blankAwk("active")] });
// A thread is a bond thread or a hostile thread (threads.js). Whose is set
// when it's in a crewmate's words, and strained only when a crew sheet says
// so: what happens in play is kept in the character's state.
const blankThread = (kind = "bond") => ({ person: "", text: "", kind, whose: "" });
export function blankBuild() {
  return {
    v: 3,
    archs: ["", ""],
    titles: [blankTitle(), blankTitle()],
    equipment: [0, 1, 2].map(blankKit),
    utility: [0, 1, 2].map(line),
    keepsake: line(),
    bag: "",
    // One attuned thing to start, and more later.
    attuned: [blankThing()],
    // Two bond threads with the crew, and a hostile thread with anyone.
    threads: [blankThread(), blankThread(), blankThread("hostile")],
    connect: [],
    aspiration: "",
    name: "", pronoun: "them", blurb: "", trouble: [],
  };
}

// Fill in anything missing, so an old or damaged build still opens.
const str = (v, max = 160) => (typeof v === "string" ? v.slice(0, max) : "");
const rootOf = (v) => (ROOTS.includes(v) ? v : "");
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const kindOf = (t) => (t?.kind === "hostile" || (t?.kind !== "bond" && t?.debt) ? "hostile" : "bond");
const atLeast = (arr, n, make) => {
  while (arr.length < n) arr.push(make());
  return arr;
};
// While a character's being changed, a line remembers what it said when the
// change began (was), so whatever's crossed out or strained can follow it when
// it's reworded, and a permission rebuilt from before Roots says which set
// actions it was on (from). Neither reaches a saved character.
const was = (x) => (typeof x?.was === "string" && x.was ? { was: x.was.slice(0, 300) } : {});
const from = (x) => (typeof x?.from === "string" && x.from ? { from: x.from.slice(0, 120) } : {});
const fixLine = (x) => ({ text: str(x?.text), ...was(x) });
const fixPerm = (x) => ({ text: str(x?.text, 120), root: rootOf(x?.root), spec: str(x?.spec, 40), ...from(x) });
const fixBoon = (x) => ({ lever: str(x?.lever, 40), name: str(x?.name, 40), on: str(x?.on, 60) });
const fixAwk = (x) => ({ name: str(x?.name, 80), kind: x?.kind === "active" ? "active" : "passive", text: str(x?.text, 240), ...(x?.kept ? { kept: true } : {}) });
export function normalBuild(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  // A draft or a build from before Roots comes across on the new rules.
  if (R.isOldBuild(r)) return fromBefore(r);
  const b = blankBuild();
  const archs = list(r.archs, MAX_ARCHS).map((a) => str(a, 24));
  if (archs.length) b.archs = archs;
  const titles = list(r.titles, MAX_TITLES);
  if (titles.length) {
    b.titles = titles.map((x) => {
      const boons = list(x?.boons, 3).filter((y) => y && str(y.lever, 40)).map(fixBoon);
      // Six slots a Title, and a Boon takes two.
      const perms = list(x?.perms, MAX_PERMS - R.BOON_SLOTS * boons.length).map(fixPerm);
      return { idea: str(x?.idea, 40), text: str(x?.text, 120), root: rootOf(x?.root), specs: atLeast(list(x?.specs, 3).map((s) => str(s, 40)), 3, () => ""), perms: boons.length || perms.length ? perms : [blankPerm()], boons };
    });
  }
  b.equipment = b.equipment.map((e, i) => {
    const x = r.equipment?.[i];
    const out = { text: str(x?.text, 80), arm: rootOf(x?.arm), ...was(x) };
    if (out.arm && tierOf(x) > 1) out.q = tierOf(x);
    return out;
  });
  b.utility = Array.from({ length: Math.max(3, Math.min(8, Array.isArray(r.utility) ? r.utility.length : 0)) }, (_, i) => fixLine(r.utility?.[i]));
  b.keepsake = fixLine(r.keepsake);
  b.bag = str(r.bag, 600);
  if (Array.isArray(r.bagWas)) b.bagWas = r.bagWas.slice(0, 40).map((x) => str(x, 120));
  // One of the crew made into a build keeps their bag's name and the order
  // their sheet lists their specialties in, for ties.
  if (str(r.bagName, 80).trim()) b.bagName = str(r.bagName, 80).trim();
  if (Array.isArray(r.order) && r.order.length) b.order = r.order.slice(0, 40).map((x) => str(x, 40)).filter(Boolean);
  if (Array.isArray(r.attuned)) {
    b.attuned = r.attuned.slice(0, MAX_ATTUNED).map((x) => ({
      name: str(x?.name, 80), props: str(x?.props, 80), stage: R.STAGES.includes(x?.stage) ? x.stage : "Awakened", catch: str(x?.catch, 120), burden: str(x?.burden, 120), aura: str(x?.aura, 160),
      awk: atLeast(list(x?.awk, 6).map(fixAwk), 1, blankAwk),
    }));
  }
  if (Array.isArray(r.threads)) b.threads = r.threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), kind: kindOf(t), whose: str(t?.whose, 40), ...(t?.strained ? { strained: true } : {}), ...was(t) }));
  b.connect = (Array.isArray(r.connect) ? r.connect : []).slice(0, 12).map((a) => str(a, 200));
  for (const k of ["aspiration", "name", "blurb"]) b[k] = str(r[k], k === "name" ? 40 : 160);
  b.pronoun = ["her", "him", "them"].includes(r.pronoun) ? r.pronoun : "them";
  b.trouble = (Array.isArray(r.trouble) ? r.trouble : []).filter((x) => typeof x === "string").slice(0, 12).map((x) => str(x, 120));
  return b;
}

// What's in, and what to call it.
const titleIn = (t) => Boolean(t.text.trim() || t.root || t.specs.some((s) => s.trim()) || t.perms.some((p) => p.text.trim()) || t.boons.length);
const titleName = (t) => t.text.trim() || "Untitled";
const thingIn = (a) => Boolean(a.name.trim() || a.awk.some((w) => w.name.trim() || w.text.trim()));
const thingName = (a) => a.name.trim() || "Something attuned";
const awkIn = (w) => Boolean(w.name.trim() || w.text.trim());
const bagOf = (b) => b.bag.split("\n").map((x) => x.trim()).filter(Boolean);
const slotsOf = (t) => t.perms.filter((p) => p.text.trim()).length + R.BOON_SLOTS * t.boons.length;
// What an attuned thing holds at its stage (Three stages): the first ones,
// then the rest once it's got its Catch, its Burden or both. One already on
// the sheet past that is kept.
const roomOf = (a) => R.attunedRoom({ stage: a.stage, catch: a.catch.trim(), burden: a.burden.trim(), awakenings: a.awk.filter(awkIn) });
const fits = (a, j) => {
  const r = roomOf(a);
  return j < r.base || (j < r.all && !r.missing.length);
};
const counts = (a, j) => Boolean(a.awk[j]?.kept) || fits(a, j);
// Everything on a thing stays on the sheet, whatever its stage holds: one of
// the crew made into a build keeps what the chapter gives them.
export function keepAttuned(b) {
  for (const a of b.attuned) a.awk.forEach((w, j) => {
    if (awkIn(w) && !fits(a, j)) w.kept = true;
  });
  return b;
}

export function numbersOf(b) {
  const n = (lever) => b.titles.reduce((t, x) => t + x.boons.filter((y) => y.lever === lever).length, 0);
  return { aura: 5 + 2 * n("Aura"), stride: 3 + 2 * n("Stride"), track: 12, utility: 3 + n("Kit"), actions: Math.max(1, b.archs.filter(Boolean).length) };
}

// The Roots and specialties a build adds up to, the way How it adds up has it,
// with where each one comes from.
export function rootsOf(b) {
  const titles = b.titles.filter(titleIn).map((t) => ({ name: titleName(t), root: t.root, specialties: t.specs.map((s) => s.trim()).filter(Boolean), permissions: t.perms.filter((p) => p.text.trim()).map((p) => ({ text: p.text.trim(), root: p.root, specialty: p.spec.trim() })) }));
  const { roots, specialties } = R.countRoots(titles);
  const fromR = { Body: [], Mind: [], Soul: [] };
  const fromS = new Map();
  const add = (sp, what) => {
    const k = R.specKey(sp);
    if (k) fromS.set(k, [...(fromS.get(k) ?? []), what]);
  };
  titles.forEach((t, i) => {
    const which = `your ${ord(i)} Title`;
    if (t.root) fromR[t.root].push(which);
    for (const sp of t.specialties) add(sp, which);
    for (const p of t.permissions) {
      if (p.root) fromR[p.root].push(`“${p.text}”`);
      add(p.specialty, `“${p.text}”`);
    }
  });
  return { roots, specialties: specialties.map((s) => ({ ...s, from: fromS.get(R.specKey(s.name)) ?? [] })), from: fromR };
}

// ---------------------------------------------------------------- the sheet

// The full sheet, the same shape as the crew's (scripts/build-content.mjs),
// which roots.js makes into the one the phone plays from.
const made = new Map();
export function sheetOf(ch, B) {
  const json = JSON.stringify(ch.build);
  const hit = made.get(ch.id);
  if (hit && hit.json === json && hit.name === ch.name) return hit.sheet;
  const sheet = makeSheet(ch, normalBuild(ch.build), B);
  made.set(ch.id, { json, name: ch.name, sheet });
  return sheet;
}

function makeSheet(ch, b, B) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const n = numbersOf(b);
  const titles = b.titles.filter(titleIn).map((t) => ({
    name: titleName(t), root: t.root, specialties: t.specs.map((s) => s.trim()).filter(Boolean),
    permissions: t.perms.filter((p) => p.text.trim()).map((p) => ({ text: p.text.trim(), root: p.root, specialty: p.spec.trim() })),
    boons: t.boons.map((x) => ({ lever: x.lever, name: x.name.trim(), on: x.on.trim() })),
  }));
  const archetypes = b.archs.map((a) => a.trim()).filter(Boolean).map((name) => ({ name, id: ARCH.get(name)?.id ?? null, home: ARCH.get(name)?.home ?? null }));
  const kit = b.equipment.filter((e) => e.text.trim());
  const qualities = B.qualities ?? [];
  const armour = kit.filter((e) => e.arm).map((e) => {
    const q = qualities[tierOf(e) - 1] ?? { name: ["Common", "Fine", "Masterwork"][tierOf(e) - 1], boxes: tierOf(e) };
    const piece = { name: e.text.trim(), root: e.arm, quality: q.name, boxes: q.boxes, when: null };
    if (e.arm === "Mind") piece.when = many(piece) ? "when they fit the scene" : "when it fits the scene";
    return piece;
  });
  const attuned = b.attuned.filter(thingIn).map((a) => ({
    name: thingName(a), props: a.props.trim() || null, stage: a.stage || "Awakened", catch: a.catch.trim() || null, burden: a.burden.trim() || null, aura: a.aura.trim() || null,
    awakenings: a.awk.map((w, j) => ({ w, j })).filter(({ w, j }) => awkIn(w) && counts(a, j)).map(({ w }) => ({ name: w.name.trim() || "An awakening", kind: w.kind, text: w.text.trim() })),
  }));
  // Each person's one bond, with every thread with them under it, however
  // the name was typed. Each thread says bond or hostile, and whose it is when
  // it's in someone else's words, the way the crew's do.
  const threads = bondsOf(b.threads.filter((th) => th.person.trim() && th.text.trim())).map((g) => ({
    person: g.person,
    threads: g.items.map(({ t: th }) => {
      const t = { text: th.text.trim(), kind: th.kind, whose: th.whose.trim() || null, strained: Boolean(th.strained) };
      return { ...t, note: threadNote(t) };
    }),
  }));
  const plays = [...new Set(b.titles.map((t) => IDEA.get(t.idea)?.playsLike).filter(Boolean))];
  const names = [...new Set(archetypes.map((a) => a.name))];
  return {
    id: ch.id, name: ch.name, own: true,
    title: titles[0]?.name ?? "",
    blurb: b.blurb.trim() || (plays.length ? `${cap(plays.join(", and "))}.` : ""),
    hash: ch.hash,
    pronoun: b.pronoun,
    playsLike: esc(plays.join(", and ") || both(names) || "your own"),
    archetypes, titles, roots: { Body: 0, Mind: 0, Soul: 0 }, specialties: (b.order ?? []).map((name) => ({ name, steps: 0 })),
    carry: { equipment: kit.map((e) => e.text.trim()), utility: b.utility.slice(0, n.utility).map((x) => x.text.trim()).filter(Boolean), keepsake: b.keepsake.text.trim() || null, bag: { name: b.bagName || "a bag", max: 10, items: bagOf(b).slice(0, 10) } },
    armour, attuned,
    numbers: { aura: 5, stride: 3, strideNote: null, stamina: { die: 12, note: null }, confidence: { die: 12, note: null }, resolve: { die: 12, note: null } },
    threads,
    crewQs: B.connect.map((q, i) => ({ q, a: (b.connect[i] ?? "").trim() })).filter((x) => x.a),
    aspiration: { text: b.aspiration.trim(), die: 2 },
    trouble: b.trouble,
  };
}

// The threads that are written in, by kind.
export function threadCount(b) {
  const filled = b.threads.filter((t) => t.person.trim() && t.text.trim());
  const hostile = filled.filter((t) => t.kind === "hostile").length;
  return { bonds: filled.length - hostile, hostile };
}

// What the builder flags. Nothing here stops a save. A new character is held
// to the Quick Build's numbers. A saved one that's grown isn't, so it's only
// flagged for what makes no sense on any sheet.
export function checksOf(b, B, { changing = false } = {}) {
  const out = [];
  const n = numbersOf(b);
  const known = new Set(B.archetypes.map((a) => a.name));
  const archs = b.archs.filter((a) => a.trim());
  if (!changing && archs.length !== 2) out.push({ step: 0, text: `You’ve got ${archs.length === 1 ? "one archetype" : `${archs.length} archetypes`}. You start with two.` });
  if (changing && !archs.length) out.push({ step: 0, text: "You haven’t got an archetype." });
  b.archs.forEach((a, i) => {
    if (!a.trim() && (!changing || b.archs.length > 1)) out.push({ step: 0, a: i, text: `Your ${ord(i)} archetype isn’t picked yet.` });
    else if (a.trim() && !known.has(a.trim())) out.push({ step: 0, a: i, text: `${a.trim()} isn’t one of the archetypes any more. Pick another.` });
  });
  if (!changing && b.titles.length !== 2) out.push({ step: 1, text: `You’ve got ${b.titles.length} Titles. The quick build gives you two.` });
  const seen = new Map();
  b.titles.forEach((t, i) => {
    const which = `Your ${ord(i)} Title`;
    if (!t.text.trim()) out.push({ step: 1, t: i, text: `${which} hasn’t got a name.` });
    if (!t.root) out.push({ step: 1, t: i, text: `${which} hasn’t got a Root.` });
    const specs = [...new Set(t.specs.map((s) => R.specKey(s)).filter(Boolean))].length;
    if (specs < 3) out.push({ step: 1, t: i, text: `${which} has ${specs ? `${specs === 1 ? "one specialty" : `${specs} specialties`}` : "no specialties"}. A Title’s got three.` });
    const perms = t.perms.filter((p) => p.text.trim());
    const slots = slotsOf(t);
    if (changing && !perms.length && !t.boons.length) out.push({ step: 1, t: i, text: `${which} hasn’t got a permission.` });
    if (!changing && slots !== 3) out.push({ step: 1, t: i, text: `${which} has ${perms.length} permission${perms.length === 1 ? "" : "s"}${t.boons.length ? ` and ${t.boons.length === 1 ? "a Boon" : `${t.boons.length} Boons`}` : ""}. The quick build gives it three${t.boons.length ? ", and a Boon takes two of them" : ""}.` });
    for (const p of perms) {
      const w = p.text.trim();
      if (!p.root || !p.spec.trim()) out.push({ step: 1, t: i, text: `“${w}” needs ${!p.root && !p.spec.trim() ? "a Root and a specialty" : !p.root ? "its Root" : "its specialty"}.` });
      if (!/\s/.test(w)) out.push({ step: 1, t: i, text: `“${w}” is one word. A permission’s a doing word with how, what or where, like “pick a mechanical lock”.` });
      const k = w.toLowerCase();
      seen.set(k, [w, (seen.get(k)?.[1] ?? 0) + 1]);
    }
    for (const x of t.boons) if (!(B.boons ?? []).some((y) => y.lever === x.lever)) out.push({ step: 1, t: i, text: `The ${x.lever} Boon isn’t one of the Boons any more. Take it off, and the two slots are permissions again.` });
  });
  for (const [w, k] of seen.values()) if (k > 1) out.push({ step: 1, text: `“${w}” is on your sheet ${k === 2 ? "twice" : `${k} times`}, and the same permission only counts once. Use different words for one of them.` });
  if (!changing && !b.keepsake.text.trim()) out.push({ step: 3, kit: "k", text: "You haven’t got a keepsake yet." });
  // One attuned thing to start. More come later, so a saved character can
  // have as many as they've earned.
  const att = b.attuned.filter((a) => a.name.trim());
  if (!changing && !att.length) out.push({ step: 3, kit: "a", text: "You haven’t attuned anything yet. You start with one thing." });
  if (!changing && att.length > 1) out.push({ step: 3, kit: "a", text: `You’ve attuned ${att.length} things. You start with one, and an Aspiration can bring another.` });
  b.attuned.forEach((a) => {
    if (!thingIn(a)) return;
    const name = cap(a.name.trim() || "Your attuned thing");
    const filled = a.awk.map((w, j) => [w, j]).filter(([w]) => awkIn(w));
    if (!a.name.trim()) out.push({ step: 3, kit: "a", text: "Your attuned thing needs a name." });
    if (!filled.length) out.push({ step: 3, kit: "a", text: `${name} needs an awakening.` });
    for (const [w] of filled) if (!w.name.trim() || !w.text.trim()) out.push({ step: 3, kit: "a", text: `An awakening on ${a.name.trim() || "your attuned thing"} needs ${!w.name.trim() ? "its name" : "what it does"}.` });
    const r = roomOf(a);
    const over = filled.filter(([, j]) => !counts(a, j));
    if (over.some(([, j]) => j >= r.all)) out.push({ step: 3, kit: "a", text: `${name} holds ${r.all} at ${r.stage}, so the rest stay off the sheet until it goes up a stage.` });
    else if (over.length) out.push({ step: 3, kit: "a", text: r.stage === "Awakened" ? `${name} only gets a second awakening with a Catch.` : `${name} needs ${both(r.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")))} to hold more than ${r.base}.` });
    if (!changing && a.burden.trim()) out.push({ step: 3, kit: "a", text: `${name} has a Burden, and a thing can’t take one before it’s Tempered.` });
  });
  // What you start with is Common, and one piece can be Fine.
  if (!changing) {
    const armour = b.equipment.filter((e) => e.text.trim() && e.arm);
    const qname = (tier) => B.qualities?.[tier - 1]?.name ?? ["Common", "Fine", "Masterwork"][tier - 1];
    const better = armour.filter((e) => tierOf(e) > 1);
    if (armour.some((e) => tierOf(e) > 2)) out.push({ step: 3, kit: "e", text: `${qname(3)} armour comes from play. What you start with is ${qname(1)}, and one piece can be ${qname(2)}.` });
    else if (better.length > 1) out.push({ step: 3, kit: "e", text: `You’ve got ${better.length} ${qname(2)} pieces. What you start with is ${qname(1)}, and one piece can be ${qname(2)}.` });
  }
  if (b.utility.slice(n.utility).some((u) => u.text.trim())) out.push({ step: 3, kit: "u", text: `You can carry ${n.utility} utility items, so the last one won’t go on the sheet.` });
  if (bagOf(b).length > 10) out.push({ step: 3, kit: "u", text: `Your bag holds 10, so the last ${bagOf(b).length - 10} won’t go in.` });
  // Two bond threads with the crew to start. A hostile thread lets you write a
  // third bond thread, and three is the most.
  const { bonds, hostile } = threadCount(b);
  if (!changing && bonds < 2) out.push({ step: 4, text: `You’ve written ${bonds === 1 ? "one bond thread" : `${bonds} bond threads`}. You start with two, with the crew.` });
  if (!changing && bonds > 3) out.push({ step: 4, text: `You’ve written ${bonds} bond threads. Three is the most you start with.` });
  else if (!changing && bonds === 3 && !hostile) out.push({ step: 4, text: "A third bond thread comes with a hostile thread, so write one, or take the third bond thread off." });
  if (!changing && hostile > 1) out.push({ step: 4, text: `You’ve written ${hostile} hostile threads. You start with one.` });
  if (!b.aspiration.trim()) out.push({ step: 5, text: "You haven’t written your Aspiration." });
  if (!b.name.trim()) out.push({ step: 6, text: "Your character needs a name." });
  return out;
}

// A permission's likely Root and specialty from its words, for a permission
// idea tapped in and for random characters: in your head is Mind, who you
// are and how you carry yourself is Soul, and the rest is your Body. The
// specialty's the Title's own that shares a word with it, if one does.
const MINDISH = /^(know|read|spot|remember|find|tell|feel|sense|hear|see|plan|question|follow a paper|smell|study|notice|recognise|work out)\b/i;
const SOULISH = /^(talk|calm|make (someone|people|an ally)|give orders|bark|lead|bring|hold (a crowd|holy)|get (a crowd|credit|a seat|an audience|sanctuary)|drop a name|pass as|swear|bless|steady|speak|call|command|host|keep a crew|start a rumour|haggle|put (a moment|bad luck)|raise|ward|bar a door|keep a spirit|throw fire|light a room|smother|make a fire|still the|fill a sail|play|sing|make people|charm|carry myself|stop bleeding|draw out|ease)\b/i;
const stem = (w) => w.toLowerCase().replace(/[’']s$/, "").replace(/(ing|ers|er|es|s)$/, "").slice(0, 5);
export function guessFor(text, specs = [], root = "") {
  const words = String(text ?? "").trim();
  const r = MINDISH.test(words) ? "Mind" : SOULISH.test(words) ? "Soul" : root === "Soul" && !/^(fight|shoot|climb|run|move|lift|hold|guard|carry|ride|sail|swim|leap|slip|pick|fix|build|take|make|mix|stitch|live|track)\b/i.test(words) ? "Soul" : "Body";
  const said = new Set(words.split(/[^A-Za-z’']+/).filter((w) => w.length > 2).map(stem));
  const spec = specs.find((s) => String(s).split(/\s+/).some((w) => w.length > 2 && said.has(stem(w)))) ?? "";
  return { root: r, spec };
}

// ---------------------------------------------------------------- downtime's growth

// What a character grew in downtime (state.grown, in the shapes roots.js's
// growRoots reads) written into their build, so it can be changed like
// anything else. Each entry lands where it sat on the sheet: a permission
// after the Title's others, a new Title last, and so on, so the sheet it
// makes is the one the player already had.
export function foldGrown(raw, grown, B) {
  const b = normalBuild(raw);
  if (!Array.isArray(grown) || !grown.length) return b;
  // Empty lines aren't on the sheet, so they go, and a grown line's place
  // among the rest is its place on the sheet. On an attuned thing an
  // awakening's place decides whether it counts, so the ones on the sheet go
  // first, then what downtime grew, then any waiting for room, and
  // everything that was on the sheet is kept on it.
  for (const t of b.titles) t.perms = t.perms.filter((p) => p.text.trim());
  const waiting = new Map();
  const onSheet = new Set();
  for (const a of b.attuned) {
    const on = a.awk.filter((w, j) => awkIn(w) && counts(a, j));
    waiting.set(a, a.awk.filter((w, j) => awkIn(w) && !counts(a, j)));
    for (const w of on) onSheet.add(w);
    a.awk = on;
  }
  const titleAt = (k) => b.titles[b.titles.map((t, i) => (titleIn(t) ? i : -1)).filter((i) => i >= 0)[k]];
  const thingAt = (k) => b.attuned[b.attuned.map((a, i) => (thingIn(a) ? i : -1)).filter((i) => i >= 0)[k]];
  const words = (v, max = 160) => str(String(v ?? "").trim(), max);
  for (const g of grown) {
    if (!g || typeof g !== "object") continue;
    const text = words(g.text, 120);
    const root = rootOf(g.root);
    const spec = words(g.spec, 40);
    if (g.k === "perm") {
      const t = titleAt(g.t);
      if (t && text && slotsOf(t) < MAX_PERMS) t.perms.push({ text, root, spec });
    } else if (g.k === "swap") {
      const t = titleAt(g.t);
      const p = t?.perms[Number(g.j)];
      if (p && text) Object.assign(p, { text, root, spec });
    } else if (g.k === "boon") {
      const t = titleAt(g.t);
      if (!t || !words(g.lever, 40)) continue;
      const drop = [...new Set((Array.isArray(g.drop) ? g.drop : []).map(Number))].filter((j) => t.perms[j]).sort((x, y) => y - x);
      for (const j of drop) t.perms.splice(j, 1);
      if (slotsOf(t) + R.BOON_SLOTS <= MAX_PERMS) t.boons.push({ lever: words(g.lever, 40), name: words(g.name, 40), on: words(g.on, 60) });
    } else if (g.k === "awk") {
      const a = thingAt(g.a);
      if (!a || !words(g.name, 80)) continue;
      // As growRoots has it, so the sheet's the one the player already had.
      if (words(g.catch, 120)) a.catch = words(g.catch, 120);
      if (words(g.burden, 120)) a.burden = words(g.burden, 120);
      if (a.awk.length < 6) {
        const w = { name: words(g.name, 80), kind: g.kind === "active" ? "active" : "passive", text: words(g.text, 240) };
        a.awk.push(w);
        onSheet.add(w);
      }
    } else if (g.k === "stage") {
      const a = thingAt(g.a);
      if (!a) continue;
      if (R.STAGES.includes(g.to) && R.STAGES.indexOf(g.to) > R.STAGES.indexOf(a.stage)) a.stage = g.to;
      if (words(g.catch, 120)) a.catch = words(g.catch, 120);
      if (words(g.burden, 120)) a.burden = words(g.burden, 120);
    } else if (g.k === "thread") {
      // A new thread goes under the bond with that person, if there's one.
      const person = str(bondName(b.threads.map((t) => t.person), g.person), 120);
      if (person && text) b.threads.push({ person, text: str(text, 200), kind: g.kind === "hostile" ? "hostile" : "bond", whose: "" });
    } else if (g.k === "title") {
      if (!text || b.titles.length >= MAX_TITLES) continue;
      const specs = atLeast((Array.isArray(g.specs) ? g.specs : []).map((s) => words(s, 40)).filter(Boolean).slice(0, 3), 3, () => "");
      const p = g.perm && typeof g.perm === "object" && words(g.perm.text, 120) ? { text: words(g.perm.text, 120), root: rootOf(g.perm.root), spec: words(g.perm.spec, 40) } : blankPerm();
      b.titles.push({ idea: "", text, root, specs, perms: [p], boons: [] });
    } else if (g.k === "arch") {
      const arch = words(g.arch, 24);
      if (arch && b.archs.length < MAX_ARCHS) b.archs.push(arch);
    } else if (g.k === "attune") {
      const name = words(g.name, 80);
      if (!name || b.attuned.length >= MAX_ATTUNED) continue;
      const w = g.awk && typeof g.awk === "object" && words(g.awk.name, 80) ? [{ name: words(g.awk.name, 80), kind: g.awk.kind === "active" ? "active" : "passive", text: words(g.awk.text, 240) }] : [];
      for (const x of w) onSheet.add(x);
      b.attuned.push({ name, props: "", stage: "Awakened", catch: "", burden: "", aura: words(g.aura, 160), awk: w });
    }
  }
  for (const a of b.attuned) {
    // Six is the most anything holds, so a waiting line with no room left goes.
    a.awk = [...a.awk, ...(waiting.get(a) ?? [])].slice(0, 6);
    a.awk.forEach((w, j) => {
      if (onSheet.has(w) && !fits(a, j)) w.kept = true;
    });
    atLeast(a.awk, 1, blankAwk);
  }
  for (const t of b.titles) if (!t.perms.length && !t.boons.length) t.perms.push(blankPerm());
  return normalBuild(b);
}

// ---------------------------------------------------------------- from before Roots

// A character built on the phone before the Roots change (8 Nov 2026), rebuilt
// on it: their Titles and permissions with a Root and a specialty to write in
// (each permission says which set actions it was on, and one of their own,
// like Locks, is the specialty already), the archetypes their Titles had,
// what they carry with their armour on their Body, their attuned things with
// each old permission an awakening, as Coin and Kit's did, and their threads,
// answers, Aspiration and trouble. Traits are gone from the rules, so they go.
const CORE = ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"];
const CORE_ROOT = { Study: "Mind", Talk: "Soul" };
export function fromBefore(old) {
  const r = old && typeof old === "object" ? old : {};
  const b = blankBuild();
  const s = (v, max = 160) => str(typeof v === "string" ? v : v?.text, max).trim();
  const ons = (x) => (Array.isArray(x?.on) ? x.on.filter((a) => typeof a === "string") : []);
  const titles = list(r.titles, MAX_TITLES).filter((t) => s(t) || s(t?.arch) || list(t?.perms, 6).some((p) => s(p)));
  b.archs = atLeast(titles.map((t) => str(t?.arch, 24).trim()).filter(Boolean).slice(0, MAX_ARCHS), 2, () => "");
  if (titles.length) {
    b.titles = titles.map((t) => {
      const perms = list(t?.perms, MAX_PERMS).filter((p) => s(p)).map((p) => {
        const on = ons(p);
        const own = on.find((a) => !CORE.includes(a)) ?? "";
        const core = on.find((a) => CORE.includes(a));
        const text = s(p, 120);
        return { text, root: core ? CORE_ROOT[core] ?? "Body" : guessFor(text).root, spec: own, ...(on.length ? { from: `It was on your ${both(on)}` } : {}) };
      });
      const specs = [...new Set(perms.map((p) => p.spec).filter(Boolean))].slice(0, 3);
      const roots = perms.map((p) => p.root).filter(Boolean);
      const root = ROOTS.map((x) => [x, roots.filter((y) => y === x).length]).sort((x, y) => y[1] - x[1])[0];
      return { idea: str(t?.idea, 40), text: s(t, 120), root: root && root[1] ? root[0] : "", specs: atLeast(specs, 3, () => ""), perms: perms.length ? perms : [blankPerm()], boons: [] };
    });
  }
  const eq = list(r.equipment, 3);
  b.equipment = [0, 1, 2].map((i) => {
    const e = eq[i];
    const text = s(e, 80);
    const arm = text && (ons(e).includes("Defend") || e?.armour || ARMOUR.test(text)) ? "Body" : "";
    return { text, arm, ...(arm && tierOf(e) > 1 ? { q: tierOf(e) } : {}) };
  });
  // Clothes that fit some scenes gave Confidence a size up. On Roots they're
  // Mind armour, while they fit the scene, if there's room for them.
  const clothes = str(r.clothes, 80).trim();
  const free = b.equipment.findIndex((e) => !e.text);
  if (clothes && free >= 0) b.equipment[free] = { text: clothes, arm: "Mind" };
  b.utility = Array.from({ length: Math.max(3, Math.min(8, list(r.utility, 8).length)) }, (_, i) => ({ text: s(r.utility?.[i], 80) }));
  b.keepsake = { text: s(r.keepsake, 80) };
  b.bag = str(r.bag, 600);
  const things = list(r.attuned, MAX_ATTUNED).filter((a) => s(a?.name) || list(a?.perms, 6).some((p) => s(p)));
  if (things.length) {
    b.attuned = things.map((a) => ({
      name: s(a?.name, 80), props: "", stage: R.STAGES.includes(a?.stage) ? a.stage : "Awakened", catch: str(a?.catch, 120), burden: str(a?.burden, 120), aura: "",
      awk: atLeast(list(a?.perms, 6).filter((p) => s(p)).map((p) => ({ name: s(p, 80), kind: "passive", text: "+1 on one die of every roll you make with it, for each Aura in it", ...(p?.kept ? { kept: true } : {}) })), 1, blankAwk),
    }));
  }
  if (Array.isArray(r.threads)) b.threads = r.threads.slice(0, MAX_THREADS).map((t) => ({ person: str(t?.person, 120), text: str(t?.text, 200), kind: kindOf(t), whose: str(t?.whose, 40), ...(t?.strained ? { strained: true } : {}) }));
  b.connect = (Array.isArray(r.connect) ? r.connect : []).slice(0, 12).map((a) => str(a, 200));
  for (const k of ["aspiration", "name", "blurb"]) b[k] = str(r[k], k === "name" ? 40 : 160);
  b.pronoun = ["her", "him", "them"].includes(r.pronoun) ? r.pronoun : "them";
  b.trouble = (Array.isArray(r.trouble) ? r.trouble : []).filter((x) => typeof x === "string").slice(0, 12);
  return b;
}

// ---------------------------------------------------------------- drafts

function readDrafts() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
function writeDrafts(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
const blankJson = JSON.stringify(blankBuild());
export const hasDraft = () => {
  const d = readDrafts().new;
  if (!d || JSON.stringify(normalBuild(d.build)) === blankJson) return null;
  return { name: str(d.build?.name, 40) };
};

// ---------------------------------------------------------------- the screens
//
// One step to a screen, for a phone held in one hand, the way a character
// opens: full screen, the crest at the top filling in as the archetypes go on,
// the step's first sentence from the book with the rest of it a tap away, and
// Back and Next in a bar at the bottom, under the thumb. The archetypes go one
// at a time, the Titles one at a time and what you carry a part at a time,
// and Next walks through them before the next step. Everything you pick is a
// card or a piece from the kit, and while the Titles are written, the Roots
// and specialties ride in a dock above the bar as the dice they add up to,
// each one growing into its next shape as a line goes on (after()). A blank
// sheet, one of the crew, random and changing a character use the same
// pieces with every step on one page.

const WAYS = ["blank", "crew", "random"];
const STEPS = [
  { name: "Archetypes", short: "Archetypes" },
  { name: "Titles and permissions", short: "Titles" },
  { name: "Roots and specialties", short: "Roots" },
  { name: "What you carry", short: "What you carry" },
  { name: "Threads", short: "Threads" },
  { name: "Aspiration", short: "Aspiration" },
  { name: "Check it and play", short: "Check it" },
];
const LAST = STEPS.length - 1;
// What you carry, a part to a screen.
const KIT = [["e", "Equipment"], ["u", "Utility"], ["k", "Keepsake"], ["a", "Attuned"]];
const PRO = { her: ["she", "her", "she’s"], him: ["he", "his", "he’s"], them: ["they", "their", "they’re"] };
const PRICE = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };
// A Boon that's on something says what: a piece of armour, a condition, or
// which of climbing, swimming and rough ground.
const BOON_ON = { Armour: ["Which piece", "your worn leathers"], Conditions: ["Which condition", "Frightened"], "Getting around": ["Climbing, swimming or rough ground", "climbing"] };
// A link inside a card would be a link inside a button, so cards keep the words only.
const unlink = (html) => String(html ?? "").replace(/<a [^>]*>|<\/a>/g, "");

export function makeBuilder({ B, link, icon, onSave, onLeave, toast, roll, rule = () => "", tools = () => "" }) {
  const ARCH = new Map(B.archetypes.map((a) => [a.name, a]));
  const IDEA = new Map(B.ideas.map((x) => [x.id, x]));
  const BOON = new Map((B.boons ?? []).map((x) => [x.lever, x]));
  let slotKey = "new";
  let d = null; // { step, deep: {}, page, way, from, build, basis }
  let meta = {}; // for a saved character: { basis, crew, before }, crew being the crew member's name when they're still one
  let saveTimer = 0;
  let refreshTimer = 0;
  let sure = false; // Roll again has been tapped once over changes
  let rolled = ""; // the random build as it was rolled
  let dropping = ""; // something tapped once to take it off
  let slide = ""; // "next" or "back": the way the next screen comes in
  let shown = null; // each Root's and specialty's dice as last drawn, so a change grows them

  // The steps a tap away from the bar close again with a tap anywhere else,
  // or Escape, which puts the cursor back on them.
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const menu = document.querySelector(".bd-jump[open]");
      if (menu && !menu.contains(e.target)) menu.removeAttribute("open");
    });
    document.addEventListener("keydown", (e) => {
      const menu = e.key === "Escape" && document.querySelector(".bd-jump[open]");
      if (!menu) return;
      menu.removeAttribute("open");
      menu.querySelector("summary")?.focus();
    });
  }

  const changing = () => slotKey !== "new";
  const save = () => {
    clearTimeout(saveTimer);
    const all = readDrafts();
    all[slotKey] = { step: d.step, deep: d.deep, page: d.page, way: d.way, from: d.from, build: d.build, ...(d.basis ? { basis: d.basis } : {}) };
    writeDrafts(all);
  };
  const saveSoon = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  };
  // A change opens on one page with everything on the sheet. One left part
  // way, to a character who's changed since (a downtime, say), starts again
  // from them as they are now, so nothing they've grown is lost.
  function open(key, start, m = {}) {
    slotKey = key || "new";
    let kept = readDrafts()[slotKey];
    const stale = Boolean(kept && changing() && kept.basis !== m.basis);
    if (stale) kept = null;
    const begun = kept ? null : typeof start === "function" ? start() : start;
    d = kept
      ? { step: Math.min(LAST, Math.max(0, Number(kept.step) || 0)), deep: kept.deep && typeof kept.deep === "object" ? kept.deep : {}, page: Boolean(kept.page), way: WAYS.includes(kept.way) ? kept.way : "", from: str(kept.from, 40), build: normalBuild(kept.build), basis: str(kept.basis, 40) }
      : { step: 0, deep: {}, page: Boolean(begun), way: "", from: "", build: normalBuild(begun ?? blankBuild()), basis: str(m.basis, 40) };
    sure = false;
    dropping = "";
    slide = "";
    shown = null;
    if (stale) {
      const [, their] = PRO[d.build.pronoun] ?? PRO.them;
      toast(`${d.build.name || "Your character"}’s sheet has changed since you left this, so it starts again from ${their} sheet as it is now.`, false);
    }
  }
  // A new character from one of the other ways in, on one page. It takes the
  // place of any draft of a new one, so the list asks first.
  function begin(build, way, fromName = "") {
    clearTimeout(saveTimer);
    slotKey = "new";
    d = { step: 0, deep: {}, page: true, way, from: fromName, build: normalBuild(build) };
    sure = false;
    dropping = "";
    slide = "";
    shown = null;
    rolled = way === "random" ? JSON.stringify(d.build) : "";
    save();
  }
  function discard(key = slotKey) {
    clearTimeout(saveTimer);
    const all = readDrafts();
    delete all[key];
    writeDrafts(all);
    if (key === slotKey) d = null;
  }
  // Leaving the builder keeps the draft, and coming back reads it again.
  function close() {
    if (d) save();
    d = null;
  }

  const b = () => d.build;
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const chip = (label, attrs, on = false, cls = "") => `<button type="button" class="cc-chipbtn${cls ? ` ${cls}` : ""}" data-act="b" ${attrs}${pressed(on)}>${label}</button>`;
  const field = (path, label, value, { ph = "", max = 120, area = false, cls = "" } = {}) => {
    const id = `b-${path.replace(/\./g, "-")}`;
    const input = area
      ? `<textarea id="${id}" data-bin="${path}" rows="4" maxlength="${max}" placeholder="${esc(ph || " ")}">${esc(value)}</textarea>`
      : `<input id="${id}" data-bin="${path}"${cls ? ` class="${cls}"` : ""} value="${esc(value)}" maxlength="${max}" autocomplete="off" placeholder="${esc(ph || " ")}">`;
    return `<label class="cc-field" for="${id}">${label}</label>${input}`;
  };
  const sigilOf = (name) => (Object.hasOwn(SIGILS, name) ? sigil(name) : "");
  // Which archetype the first step's on, which Title the second's on, and
  // which part of what you carry.
  const archTab = () => Math.min(Math.max(0, Number(d.deep.atab) || 0), Math.max(0, b().archs.length - 1));
  const tabOf = () => Math.min(Math.max(0, Number(d.deep.tab) || 0), Math.max(0, b().titles.length - 1));
  const kitOf = () => (KIT.some(([k]) => k === d.deep.kit) ? d.deep.kit : "e");
  const kitAt = () => KIT.findIndex(([k]) => k === kitOf());

  // The book's words for each step: its first sentence on the screen, and the
  // rest a tap away, remembered open once it's been opened.
  const how = (i) => (B.quick[i]?.more ? `<details class="bd-how" data-open="bd-how-${i}"${d.deep[`how${i}`] === true ? " open" : ""}><summary>How this step works</summary><p>${B.quick[i].more}</p></details>` : "");
  // Adding and taking off. Something with words in it asks for a second tap
  // before it goes.
  const dropBtn = (kind, i, label) => `<button type="button" class="button sm" data-act="b" data-b="drop${kind}" data-i="${i}">${dropping === `${kind}${i}` ? "Tap again to take it off" : label}</button>`;
  const canDrop = (kind) => (kind === "title" ? b().titles.length > (changing() ? 1 : 2) : kind === "arch" ? b().archs.length > (changing() ? 1 : 2) : kind === "att" ? changing() || b().attuned.length > 1 : changing() || b().threads.length > 3);
  // A card to tap: picked, it's edged in gold with a gold diamond in its corner.
  const card = (cls, attrs, on, inner) => `<button type="button" class="bd-tok ${cls}" data-act="b" ${attrs}${pressed(on)}>${inner}</button>`;
  const rootChips = (attrs, now, label) => `<div class="cc-chips bd-roots" role="group" aria-label="${esc(label)}">${ROOTS.map((r) => chip(r, `${attrs} data-v="${r}"`, now === r, "sm")).join("")}</div>`;

  const backLink = () => `<a class="cc-back" href="/characters/${slotKey === "new" ? "" : `?c=${encodeURIComponent(slotKey)}`}" data-act="b" data-b="leave">${icon.back}${slotKey === "new" ? "Characters" : esc(b().name || "Back")}</a>`;
  const kicker = () => (slotKey === "new" ? "Make your own" : meta.before ? `Rebuilding ${esc(b().name || "your character")}` : `Changing ${esc(b().name || "your character")}`);
  const dropEdit = () => (slotKey === "new" ? "" : `<button type="button" class="button sm" data-act="b" data-b="dropedit">${meta.before ? "Leave the rebuild for now" : "Drop these changes"}</button>`);
  const saveLabel = () => (meta.before ? "Save them on Roots" : changing() ? "Save the changes" : "Save and play");
  // The crest fills in as the archetypes go on: the first in the middle,
  // doubled when it's taken twice, and a second in the seal.
  function crestNow() {
    const arch = b().archs.filter((a) => Object.hasOwn(SIGILS, a));
    try {
      return crest(arch, { strict: false, label: arch.length ? `Crest: ${both([...new Set(arch)])}` : "Crest, waiting on an archetype" });
    } catch {
      return "";
    }
  }
  // One of the crew being changed stops following the chapter once it's
  // saved, and one built before Roots moves onto it.
  function crewNote() {
    if (!changing()) return "";
    const [, their, theyre] = PRO[b().pronoun] ?? PRO.them;
    if (meta.before) return `<div class="cc-note is-gold" role="status"><p>${esc(b().name || "They")} ${theyre === "they’re" ? "were" : "was"} built before the Roots change, so here’s everything that comes across. Each Title wants its Root and three specialties, and each permission its Root and specialty (it says which set actions it was on). ${cap(their)} attuned things’ permissions are awakenings now, and traits have gone from the rules. Save it and ${theyre} back in play, with ${their} threads, Aspiration and notes as they were.</p></div>`;
    if (!meta.crew) return "";
    const name = esc(b().name || meta.crew);
    return `<div class="cc-note" role="status"><p>${name}’s sheet comes straight off the chapter for now, so when the rules change, ${their} sheet changes too. Save a change here and ${theyre} your own. ${cap(their)} sheet stops following the chapter, and ${their} tracks, Aura and everything else in play stay as they are.</p></div>`;
  }

  const topbar = () => `<div class="cc-topbar">${backLink()}<div class="cc-tools">${tools()}</div></div>`;
  function head() {
    const i = d.step;
    const bars = STEPS.map((s, k) => `<li${k < i ? ' class="done"' : k === i ? ' class="on"' : ""}></li>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · Step ${i + 1} of ${STEPS.length}</p><h1 tabindex="-1">${STEPS[i].name}</h1></div></div>
      <ol class="bd-progress" aria-hidden="true">${bars}</ol>
      <p class="bd-lead">${B.quick[i]?.lead ?? ""}</p>${how(i)}</header>${crewNote()}`;
  }

  // Where Next and Back go: through the archetypes, the Titles and the parts
  // of what you carry, then on to the next step.
  function within(fwd) {
    const x = b();
    if (d.step === 0) {
      const a = archTab() + (fwd ? 1 : -1);
      return a >= 0 && a < x.archs.length ? { atab: a, label: `${cap(ord(a))} archetype` } : null;
    }
    if (d.step === 1) {
      const t = tabOf() + (fwd ? 1 : -1);
      return t >= 0 && t < x.titles.length ? { tab: t, label: `${cap(ord(t))} Title` } : null;
    }
    if (d.step === 3) {
      const k = kitAt() + (fwd ? 1 : -1);
      return k >= 0 && k < KIT.length ? { kit: KIT[k][0], label: KIT[k][1] } : null;
    }
    return null;
  }
  // The bar at the bottom: Back, the steps a tap away, and Next.
  function bar() {
    const i = d.step;
    const ahead = within(true);
    const back = !d.page && (i > 0 || within(false));
    const next = d.page || (i === LAST && !ahead)
      ? `<button type="button" class="button primary bd-next" data-act="b" data-b="save">${saveLabel()}</button>`
      : `<button type="button" class="button primary bd-next" data-act="b" data-b="next"><span>Next</span><small>${esc(ahead ? ahead.label : STEPS[i + 1].short)}</small></button>`;
    const reroll = d.page && d.way === "random" ? `<button type="button" class="button bd-back" data-act="b" data-b="reroll">${sure ? "Tap again to lose your changes" : "Roll again"}</button>` : "";
    return `<div class="bd-foot"><div class="bd-foot-in" role="group" aria-label="${d.page ? "Save" : "Steps"}">
      ${back ? '<button type="button" class="button bd-back" data-act="b" data-b="back">Back</button>' : ""}${reroll}${jump()}${next}</div></div>`;
  }
  // Every step, or every part on one page, a tap from the bar.
  function jump() {
    const i = d.step;
    const rows = STEPS.map((s, k) => {
      const now = !d.page && k === i;
      return `<li><button type="button" class="bd-dot${now ? " is-now" : ""}" data-act="b" data-b="go" data-s="${k}"${now ? ' aria-current="step"' : ""}><span class="n">${k + 1}</span><span>${s.name}</span></button></li>`;
    }).join("");
    return `<details class="bd-jump"><summary>${d.page ? "Parts" : `<span class="sr-only">Step </span>${i + 1}<span class="of"> of ${STEPS.length}</span>`}</summary><div class="bd-jumps"><p class="bd-label">${d.page ? "Go to a part" : "Go to a step"}</p><ol>${rows}</ol></div></details>`;
  }

  // Every step on one page, for a blank sheet, one of the crew, random,
  // changing a saved character or rebuilding one.
  function pageView() {
    const [, their] = PRO[b().pronoun] ?? PRO.them;
    const title = meta.before ? `${cap(their)} sheet on Roots` : changing() ? `Change anything on ${their} sheet` : { blank: "A blank sheet", crew: `From ${esc(d.from || "the crew")}`, random: "Random" }[d.way] ?? "All on one page";
    const parts = BODIES.map((body, i) => `<section class="bd-part" aria-labelledby="bd-part-${i}">${part(i)}</section>`).join("");
    return `${topbar()}<header class="cc-head bd-head"><div class="bd-who">${crestNow()}<div class="bd-who-text"><p class="kicker">${kicker()} · All on one page</p><h1 tabindex="-1">${title}</h1></div></div>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">Go step by step</button></div></header>
      ${crewNote()}
      <div class="bd-body bd-page">${parts}</div>
      <p class="cc-lead bd-saved">${link("s-quick", "The Quick Build in the rules")}. Your work’s saved on this phone as you go.</p>
      ${dropEdit() ? `<div class="cc-row">${dropEdit()}</div>` : ""}${bar()}`;
  }

  // A switch at the top of a step that goes one at a time: one segment for
  // each archetype or Title.
  function switchOf(kind) {
    const x = b();
    const items = kind === "arch" ? x.archs : x.titles;
    if (items.length < 2) return "";
    const at = kind === "arch" ? archTab() : tabOf();
    return `<div class="bd-switch" role="group" aria-label="${kind === "arch" ? "Your archetypes" : "Your Titles"}">${items.map((it, i) => {
      const name = kind === "arch" ? it : it.text.trim();
      const says = name || (kind === "arch" ? "Not picked yet" : "No name yet");
      const sig = kind === "arch" && it ? `<span class="bd-sig">${sigilOf(it)}</span>` : "";
      return `<button type="button" class="bd-seg" data-act="b" data-b="${kind === "arch" ? "atab" : "tab"}" data-t="${i}"${i === at ? ' aria-current="true"' : ""}>${sig}<span class="bd-seg-text"><small>${cap(ord(i))} ${kind === "arch" ? "archetype" : "Title"}</small><b>${esc(says)}</b></span></button>`;
    }).join("")}</div>`;
  }
  // The same archetype taken again makes its Push bigger.
  function raised() {
    const taken = new Map();
    for (const a of b().archs) if (a) taken.set(a, (taken.get(a) ?? 0) + 1);
    return [...taken].filter(([a, n]) => n > 1 && (ARCH.get(a)?.abilities ?? []).some((x) => /^Push$/i.test(x.name))).map(([a, n]) => `<p class="cc-note" role="status">${esc(a)} ${n === 2 ? "twice" : `${n} times`}, so your Push is +${n + 1}.</p>`).join("");
  }

  // Step 1: two archetypes, picked by their sigils and what they're for.
  function stepArch() {
    const x = b();
    const which = d.page ? x.archs.map((_, i) => i) : [archTab()];
    const add = x.archs.length < MAX_ARCHS && (changing() || x.archs.length < 2) ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addarch">Add another archetype</button></div>${changing() ? '<p class="cc-lead">An archetype from an Aspiration comes with its mechanic and its abilities, and lets you buy one more action a round.</p>' : ""}` : "";
    return `${d.page ? "" : switchOf("arch")}${which.map((i) => archOf(x.archs[i], i)).join("")}${raised()}${add}`;
  }
  function archOf(name, i) {
    const a = ARCH.get(name);
    // A step at a time, an empty slot shows every card. On one page they wait
    // behind a tap, so the page isn't eighteen cards an archetype.
    const picking = d.deep[`pick${i}`] === true || (!a && !d.page);
    const legend = `Your ${ord(i)} archetype`;
    const grid = picking ? `<p class="bd-label" id="bd-archs-${i}">${a ? "Pick a different archetype" : "Pick one"}</p><div class="bd-archs" role="group" aria-labelledby="bd-archs-${i}">${B.archetypes.map((r) => card("bd-arch", `data-b="arch" data-t="${i}" data-v="${esc(r.name)}"`, name === r.name, `<span class="bd-sig">${sigilOf(r.name)}</span><b>${esc(r.name)}</b><span class="bd-for">${esc(r.for)}</span>`)).join("")}</div>` : "";
    const abilities = (a?.abilities ?? []).map((x) => `<p><b>${esc(x.name)}</b> (1 ${esc(a.home ?? "")}): ${x.html}</p>`).join("");
    const chosen = a ? `<div class="bd-chosen" tabindex="-1" role="group" aria-label="${esc(`${cap(legend.toLowerCase())}: ${a.name}`)}"><span class="bd-sig is-on">${sigilOf(a.name)}</span><span class="bd-chosen-text"><b>${esc(a.name)}</b><span class="bd-for">${esc(a.for)}</span></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">${picking ? "Keep it" : "Change"}</button></div>
      <details class="bd-more" data-open="bd-arch-${i}"${d.deep[`archmore${i}`] === true ? " open" : ""}><summary>What the ${esc(a.name)} does</summary><p>${a.summary}</p><p><b>Home track:</b> ${esc(a.home ?? "")}. Each ability’s 1 of it, or 2 from your other two tracks.</p>${abilities}<p class="cc-small">${link(a.id, `The ${esc(a.name)} in full`)}</p></details>` : "";
    const none = !a && !picking ? `<div class="bd-chosen is-none"><span class="bd-sig"></span><span class="bd-chosen-text"><b>${name ? `${esc(name)} isn’t one any more` : "No archetype yet"}</b></span><button type="button" class="button sm" data-act="b" data-b="archopen" data-t="${i}">Pick one</button></div>` : "";
    return `<fieldset class="bd-title"><legend${d.page ? "" : ' class="sr-only"'}>${legend}</legend>${chosen}${none}${grid}
      ${canDrop("arch") ? `<div class="cc-row">${dropBtn("arch", i, "Take this archetype off")}</div>` : ""}</fieldset>`;
  }

  // Step 2: name each Title, its Root and its three specialties, and its
  // permissions, three to start and six slots at most, two of which can be a Boon.
  function stepTitles() {
    const x = b();
    const which = d.page ? x.titles.map((_, i) => i) : [tabOf()];
    const add = x.titles.length < MAX_TITLES ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addtitle">Add another Title</button></div>${changing() ? '<p class="cc-lead">A Title from an Aspiration starts with one permission.</p>' : ""}` : "";
    return `${d.page ? "" : switchOf("title")}${which.map((i) => titleOf(x.titles[i], i)).join("")}${add}
      <details class="bd-more" data-open="bd-test"${d.deep.test === true ? " open" : ""}><summary>Is it a permission? The quick test</summary><ol>${B.quickTest.map((q) => `<li>${q}</li>`).join("")}</ol><p>Four yeses and it’s a permission.</p></details>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="1"${pressed(d.deep[1])}>${d.deep[1] ? "Fewer permission ideas" : "More permission ideas"}</button></div>
      ${d.page ? "" : rootTiles({ rail: true })}`;
  }
  // Title ideas as cards: the ones that suit your archetypes, or every one.
  function ideasOf(t, i) {
    const archs = b().archs.filter(Boolean);
    const all = d.deep[`ideas${i}`] === true || !archs.length;
    const suits = B.ideas.filter((idea) => idea.archetypes.some((a) => archs.includes(a)));
    const shown = all ? B.ideas : suits;
    const groups = [...new Set(shown.map((idea) => idea.group))];
    const one = (idea) => card("bd-idea", `data-b="idea" data-t="${i}" data-v="${idea.id}"`, t.idea === idea.id, `<b>${esc(idea.name)}</b><span class="bd-for">${esc(cap(idea.playsLike))}</span>`);
    const cards = all ? groups.map((g) => `<p class="bd-label">${esc(g)}</p><div class="bd-cards">${shown.filter((idea) => idea.group === g).map(one).join("")}</div>`).join("") : `<div class="bd-cards">${shown.map(one).join("")}</div>`;
    const open = d.deep[`idea${i}`] ?? !d.page;
    return `<details class="bd-more bd-ideas" data-open="bd-ideas-${i}"${open ? " open" : ""}><summary>A Title idea, if you like${t.idea && IDEA.get(t.idea) ? ` <small>${esc(IDEA.get(t.idea).name)}</small>` : ""}</summary>
      ${shown.length ? cards : `<p class="cc-lead">None of the ideas lists your archetypes, so write your own Title, or look through every idea.</p>`}
      ${archs.length ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="ideas" data-t="${i}"${pressed(all)}>${all ? "Just the ones that suit your archetypes" : "Every Title idea"}</button></div>` : ""}</details>`;
  }
  function permRow(t, i, p, j) {
    const named = [...new Set(t.specs.map((s) => s.trim()).filter(Boolean))];
    const fill = named.length ? `<div class="cc-chips bd-specs" role="group" aria-label="${esc(`Its specialty: one of the Title’s`)}">${named.map((s) => chip(esc(s), `data-b="pspec" data-t="${i}" data-j="${j}" data-v="${esc(s)}"`, R.specKey(p.spec) === R.specKey(s), "sm")).join("")}</div>` : "";
    return `<div class="bd-perm">${field(`t${i}.p${j}`, `Permission ${j + 1}${p.from ? ` <small>${esc(p.from)}</small>` : ""}`, p.text, { ph: "a doing word, and how, what or where", max: 120 })}
      <div class="bd-perm-how">${rootChips(`data-b="proot" data-t="${i}" data-j="${j}"`, p.root, `The Root for permission ${j + 1}`)}
      ${field(`t${i}.p${j}.spec`, `<span class="sr-only">Permission ${j + 1}’s </span>Specialty`, p.spec, { ph: named[0] ? `like ${named[0]}` : "like Locks", max: 40, cls: "bd-spec" })}${fill}</div></div>`;
  }
  function boonsOf(t, i) {
    const room = MAX_PERMS - slotsOf(t) >= R.BOON_SLOTS || t.perms.filter((p) => !p.text.trim()).length >= R.BOON_SLOTS;
    const mine = t.boons.map((x, k) => {
      const rule = BOON.get(x.lever);
      const on = BOON_ON[x.lever];
      return `<div class="bd-boon"><p><b>${esc(x.name.trim() || `The ${x.lever} Boon`)}</b> <small>${esc(x.lever)}${rule ? `: ${esc(rule.text)}` : ""}</small></p>
        ${field(`t${i}.b${k}.name`, "Its name from the story, if you like", x.name, { ph: x.lever === "Toughness" ? "Iron Lungs" : "", max: 40 })}
        ${on ? field(`t${i}.b${k}.on`, on[0], x.on, { ph: on[1], max: 60 }) : ""}
        <div class="cc-row">${dropBtn(`boon${i}-`, k, "Take it off")}</div></div>`;
    }).join("");
    const offer = room ? `<div class="bd-items is-wide bd-boons">${(B.boons ?? []).map((x) => card("bd-item", `data-b="boon" data-t="${i}" data-v="${esc(x.lever)}"`, false, `<b>${esc(x.lever)}</b><span class="bd-for">${esc(cap(x.text))}</span>`)).join("")}</div>` : `<p class="cc-lead">${esc(titleName(t))} hasn’t got two slots free. Take two permissions off first.</p>`;
    const open = d.deep[`boon${i}`] === true || t.boons.length > 0;
    return `<details class="bd-more" data-open="bd-boon-${i}"${open ? " open" : ""}><summary>A Boon instead of two permissions${t.boons.length ? ` <small>${t.boons.length === 1 ? "one" : t.boons.length}</small>` : ""}</summary>
      <p class="cc-lead">A Boon’s a permanent upgrade, like shrugging off the first hit each scene or a longer stride. It takes two of this Title’s slots, and you can swap it back for permissions in downtime. ${link("s-boons", "Boons and Burdens")}</p>
      ${mine}${offer}</details>`;
  }
  function titleOf(t, i) {
    const idea = IDEA.get(t.idea);
    const used = new Set(t.perms.map((p) => p.text.trim().toLowerCase()));
    const offer = (perms) => `<div class="cc-chips bd-perms">${perms.map((p) => chip(`<em>${esc(p)}</em>`, `data-b="perm" data-t="${i}" data-v="${esc(p)}"`, used.has(p.toLowerCase()))).join("")}</div>`;
    const slots = slotsOf(t);
    return `<fieldset class="bd-title"><legend${d.page ? "" : ' class="sr-only"'}>Your ${ord(i)} Title</legend>
      ${ideasOf(t, i)}
      ${field(`t${i}.text`, "Your Title", t.text, { ph: "Make it specific: the best blade in the Low Market", max: 120 })}
      ${idea ? `<p class="bd-label">Or one of the ${esc(idea.name)} idea’s Titles</p><div class="bd-cards is-one">${idea.titles.map((name) => card("bd-name", `data-b="title" data-t="${i}" data-v="${esc(name)}"`, t.text.trim() === name, `<em>${esc(name)}</em>`)).join("")}</div>` : ""}
      <p class="bd-label" id="bd-root-${i}">Its Root <small>${t.root ? esc(ROOT_SAYS[t.root]) : "Body, Mind or Soul"}</small></p>
      ${rootChips(`data-b="root" data-t="${i}"`, t.root, `Your ${ord(i)} Title’s Root`)}
      <p class="bd-label">Its three specialties <small>things you could be known for, or teach</small></p>
      <div class="bd-specs3">${t.specs.map((s, k) => field(`t${i}.s${k}`, `<span class="sr-only">Specialty </span>${k + 1}`, s, { ph: ["Locks", "Climbing", "Stealth"][k], max: 40 })).join("")}</div>
      <p class="bd-label">${!changing() && i < 2 ? "Three permissions" : "Its permissions"} <small>${slots} of 6 slots</small></p>
      ${t.perms.map((p, j) => permRow(t, i, p, j)).join("")}
      ${slots < MAX_PERMS && t.perms.every((p) => p.text.trim()) ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addperm" data-t="${i}">Add a permission</button></div>` : slots >= MAX_PERMS ? '<p class="cc-lead">That’s all six slots. Six is the most a Title holds.</p>' : ""}
      ${idea ? `<p class="cc-small">Tap one of the ${esc(idea.name)} idea’s permissions to put it in, and tap it again to take it out. Its Root and specialty are a guess, so check them.</p>${offer(idea.permissions)}` : ""}
      ${d.deep[1] ? B.permIdeas.map((g) => `<p class="bd-label">${esc(g.for)}</p>${offer(g.perms)}`).join("") : ""}
      ${boonsOf(t, i)}
      ${canDrop("title") ? `<div class="cc-row">${dropBtn("title", i, "Take this Title off")}</div>` : ""}</fieldset>`;
  }

  // The Roots and specialties as the dice they add up to. While the Titles
  // are written they ride in a dock just above the bar.
  function rootTiles({ rail = false } = {}) {
    const { roots, specialties } = rootsOf(b());
    const tile = (key, name, n) => {
      const dice = n ? stepsToDice(n) : [];
      return `<div class="tile${n ? "" : " is-none"}" role="listitem"><span class="tile-dice" data-for="${esc(key)}" aria-hidden="true">${dice.length ? dice.map((s, j) => kitDie(s, { hide: true, cls: j ? "is-next" : "" })).join("") : '<span class="bd-zero">0</span>'}</span><span class="tile-name">${esc(name)}</span><span class="tile-says"><span class="tile-steps">${n} step${n === 1 ? "" : "s"}</span><span class="tile-dot">, </span><span class="tile-die">${dice.length ? diceLabel(dice) : "nothing yet"}</span></span></div>`;
    };
    const items = [...ROOTS.map((r) => tile(`root:${r}`, r, roots[r])), ...specialties.map((s) => tile(`spec:${R.specKey(s.name)}`, s.name, s.steps))];
    return `<div class="bd-tiles${rail ? ' bd-rail" tabindex="0"' : ' bd-grid"'} role="list" aria-label="Your Roots and specialties">${items.join("")}</div>`;
  }
  // Two specialties written two ways (Lock and Locks) can be made one.
  function twins() {
    const { specialties } = rootsOf(b());
    const out = [];
    const keys = specialties.map((s) => s.name);
    for (const a of keys) for (const z of keys) if (a !== z && R.specKey(`${a}s`) === R.specKey(z) && !out.some((p) => p[0] === a)) out.push([a, z]);
    return out;
  }
  // Step 3: what it all adds up to, and where each one comes from.
  function stepRoots() {
    const { roots, specialties, from } = rootsOf(b());
    const row = (name, n, list) => `<li><span class="bd-num-text"><span class="k">${esc(name)}</span> <b>${n}</b>${list.length ? ` <small>${esc(both(list))}</small>` : ""}</span>${n ? kitDie(stepsToDice(n)[0], { hide: true, bare: true }) : ""}</li>`;
    const tw = twins();
    return `<p class="cc-lead">A roll’s one Root and one specialty, pitched to fit how you’re doing it, and what you carry counts while you’re using it.</p>
      ${rootTiles()}
      <h2>Your Roots</h2><ul class="bd-nums bd-from-list">${ROOTS.map((r) => row(r, roots[r], from[r])).join("")}</ul>
      <h2>Your specialties</h2>${specialties.length ? `<ul class="bd-nums bd-from-list">${specialties.map((s) => row(s.name, s.steps, s.from)).join("")}</ul>` : '<p class="cc-lead">They show up here once your Titles have them.</p>'}
      ${tw.map(([a, z]) => `<div class="cc-note" role="status"><p>${esc(a)} and ${esc(z)} look like one specialty written two ways.</p><div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="merge" data-v="${esc(a)}" data-w="${esc(z)}">Make them one: ${esc(z)}</button></div></div>`).join("")}`;
  }

  // Step 4: what you carry, picked from cards a part at a time, and the
  // attuned things.
  function kitSwitch() {
    const x = b();
    const n = numbersOf(x);
    const count = (items, of) => `${items.filter((v) => v.text.trim()).length} of ${of}`;
    const says = { e: count(x.equipment, 3), u: count(x.utility.slice(0, n.utility), n.utility), k: x.keepsake.text.trim() ? "Taken" : "Not yet", a: x.attuned.some((a) => a.name.trim()) ? "Attuned" : "Not yet" };
    return `<div class="bd-switch is-kit" role="group" aria-label="What you carry">${KIT.map(([k, name]) => `<button type="button" class="bd-seg" data-act="b" data-b="kit" data-v="${k}"${k === kitOf() ? ' aria-current="true"' : ""}><span class="bd-seg-text"><small>${says[k]}</small><b>${name}</b></span></button>`).join("")}</div>`;
  }
  function stepCarry() {
    const x = b();
    const n = numbersOf(x);
    atLeast(x.utility, Math.min(8, n.utility), line);
    const group = (name) => B.items.find((g) => g.group === name)?.items ?? [];
    const has = new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim().toLowerCase()).filter(Boolean));
    // Item cards: a name, and what it does or says about you where the book has it.
    const offer = (kind, label, items) => `<p class="bd-label">${label}</p><div class="bd-items${items.some((v) => v.say) ? " is-wide" : ""}">${items.map((v) => card("bd-item", `data-b="fillany" data-k="${kind}" data-v="${esc(v.name)}"`, has.has(v.name.toLowerCase()), `<b>${esc(cap(v.name))}</b>${v.say ? `<span class="bd-for">${v.say}</span>` : ""}`)).join("")}</div>`;
    const plain = (items) => items.map((name) => ({ name }));
    // A piece of equipment can be armour on the Root it guards, and armour
    // picks its quality, with the boxes each one gives it.
    const quality = (i, item) => `<div class="bd-quality" role="group" aria-labelledby="bd-q-${i}"><p class="bd-label" id="bd-q-${i}">How good is it? <small>a box for every hit it can take for you</small></p><div class="cc-chips">${(B.qualities ?? []).map((q) => chip(`<span>${esc(q.name)}</span>${kitBoxes(0, q.boxes, { label: `${q.boxes} ${q.boxes === 1 ? "box" : "boxes"}` })}`, `data-b="quality" data-i="${i}" data-v="${q.tier}"`, tierOf(item) === q.tier, "bd-qual")).join("")}</div></div>`;
    const armOf = (i, item) => `<div class="bd-arm" role="group" aria-labelledby="bd-arm-${i}"><p class="bd-label" id="bd-arm-${i}">Is it armour? <small>${item.arm ? `on your ${item.arm}, for your ${TRACK_OF[item.arm]}` : "on the Root it guards"}</small></p><div class="cc-chips">${chip("No", `data-b="arm" data-i="${i}" data-v=""`, !item.arm, "sm")}${ROOTS.map((r) => chip(r, `data-b="arm" data-i="${i}" data-v="${r}"`, item.arm === r, "sm")).join("")}</div></div>`;
    const slot = (kind, i, label) => {
      const ref = `${kind}${i}`;
      const item = kind === "e" ? x.equipment[i] : x.utility[i];
      return `<div class="bd-slot is-row">${field(ref, `<span class="sr-only">${label} </span>${i + 1}`, item.text, { max: 80, ph: "Type it, or pick a card below" })}
        ${kind === "e" && item.text.trim() ? armOf(i, item) : ""}${kind === "e" && item.text.trim() && item.arm ? quality(i, item) : ""}</div>`;
    };
    const things = [...new Set([...x.equipment, ...x.utility, x.keepsake].map((v) => v.text.trim()).filter(Boolean))];
    // Something you carry, or a signature thing: one often makes the best
    // thing to attune.
    const pick = (i, a, items) => `<div class="bd-items">${items.map((v) => card("bd-item", `data-b="fill" data-p="a${i}.name" data-v="${esc(v)}"`, a.name.trim() === v, `<b>${esc(cap(v))}</b>`)).join("")}</div>`;
    const yours = (i, a) => `<div class="bd-namepick">${things.length ? `<p class="bd-label">Or one of the things you carry</p>${pick(i, a, things)}` : ""}<p class="bd-label">Or a signature thing</p>${pick(i, a, group("Signature").filter((v) => !things.includes(v)))}</div>`;
    const catches = (i, a) => `<div class="bd-items is-wide bd-catches">${B.catches.map((c) => card("bd-item", `data-b="fill" data-p="a${i}.catch" data-v="${esc(c.name)}"`, a.catch.trim() === c.name, `<b>${esc(c.name)}</b><span class="bd-for">${esc(c.text)}</span>`)).join("")}</div>`;
    const drop = (i) => (canDrop("att") ? `<div class="cc-row">${dropBtn("att", i, "Take it off")}</div>` : "");
    const awkRow = (a, i, w, j, label) => `<div class="bd-awk">${field(`a${i}.w${j}.name`, label, w.name, { max: 80, ph: j ? "Hit anything I can see" : "Anywhere I can throw a hook" })}
      <div class="cc-chips" role="group" aria-label="${esc(`${label.replace(/ ?<small>[\s\S]*<\/small>/, "")}: passive or active`)}">${chip("Passive <small>holds Aura</small>", `data-b="awkkind" data-i="${i}" data-j="${j}" data-v="passive"`, w.kind === "passive", "sm")}${chip("Active <small>spends it</small>", `data-b="awkkind" data-i="${i}" data-j="${j}" data-v="active"`, w.kind === "active", "sm")}</div>
      ${field(`a${i}.w${j}.text`, `<span class="sr-only">${label.replace(/ ?<small>[\s\S]*<\/small>/, "")}: </span>What it does`, w.text, { max: 240, ph: w.kind === "passive" ? "+1 on one die of every roll you make with it, for each Aura in it" : "1 Aura and … Each Aura more …" })}</div>`;
    const auraField = (a, i) => field(`a${i}.aura`, "Its own way to Aura <small>one thing it does that’s worth 1 Aura, most scenes but not every round</small>", a.aura, { max: 160, ph: "1 the first time each scene you get somewhere nobody else could follow" });
    // The Quick Build's: Awakened, one awakening, and a second with a Catch.
    const quick = (a, i) => `<fieldset class="bd-box bd-att"><legend>${x.attuned.length > 1 ? `Attuned thing ${i + 1}` : "Your attuned thing"}</legend>
      ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a grappling line" })}${yours(i, a)}
      ${auraField(a, i)}
      ${awkRow(a, i, a.awk[0], 0, "Its awakening")}
      ${field(`a${i}.catch`, "Its Catch, if you’d like a second awakening", a.catch, { max: 60, ph: "Wanted" })}${catches(i, a)}
      ${a.catch.trim() || awkIn(a.awk[1] ?? blankAwk()) ? awkRow(a, i, a.awk[1] ?? blankAwk("active"), 1, "Its second awakening") : ""}${drop(i)}</fieldset>`;
    // A saved character's, at any stage, with up to six awakenings.
    const grown = (a, i) => {
      const r = roomOf(a);
      const off = (j) => (j >= r.all ? "until it goes up a stage" : `until it’s got ${both(r.missing.map((m) => (m === "catch" ? "its Catch" : "its Burden")))}`);
      return `<fieldset class="bd-box bd-att is-grown"><legend>Attuned thing ${i + 1}</legend>
        ${field(`a${i}.name`, "What it is", a.name, { max: 80, ph: "a grappling line" })}${yours(i, a)}
        <p class="bd-label" id="bd-stage-${i}">Its stage</p><div class="cc-chips" role="group" aria-labelledby="bd-stage-${i}">${R.STAGES.map((st) => chip(st, `data-b="stage" data-i="${i}" data-v="${st}"`, r.stage === st)).join("")}</div>
        <p class="cc-small">${r.stage} holds ${r.base}, and ${r.base} more with ${PRICE[r.stage]}. ${link("attunement-stages", "The three stages")}</p>
        ${auraField(a, i)}
        ${field(`a${i}.catch`, "Its Catch", a.catch, { max: 80, ph: "Wanted" })}${catches(i, a)}
        ${r.stage !== "Awakened" || a.burden.trim() ? field(`a${i}.burden`, "Its Burden <small>a cost for good, like <em>Bad Knee</em></small>", a.burden, { max: 80, ph: "Bad Knee" }) : ""}
        ${a.awk.map((w, j) => awkRow(a, i, w, j, `Awakening ${j + 1}${awkIn(w) && !counts(a, j) ? ` <small>off the sheet ${off(j)}</small>` : ""}`)).join("")}
        ${a.awk.length < 6 ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addawk" data-i="${i}">Add an awakening</button></div>` : '<p class="cc-lead">Six awakenings is the most anything holds.</p>'}
        ${drop(i)}</fieldset>`;
    };
    const parts = {
      e: `<section class="bd-carry" aria-labelledby="bd-eq"><h2 id="bd-eq">3 equipment</h2><p class="cc-lead">What you wear or wield. Armour goes on the Root it guards: plate, leathers and a shield on your Body, clothes that fit the scene on your Mind, a holy symbol or a ward on your Soul. ${changing() ? "Each piece is Common, Fine or Masterwork." : "Each piece is Common, and one can be Fine."} ${link("s-armour", "Armour")}</p>
        ${x.equipment.map((e, i) => slot("e", i, "Equipment")).join("")}
        ${offer("e", "Weapons", plain(group("Weapons")))}${offer("e", "Armour and wearables", plain(group("Armour & wearables")))}</section>`,
      u: `<section class="bd-carry" aria-labelledby="bd-ut"><h2 id="bd-ut">${n.utility} utility items</h2><p class="cc-lead">Tools and things you use up. Each one’s 1 more on a roll you use it in, when it fits.</p>
        ${x.utility.slice(0, n.utility).map((u, i) => slot("u", i, "Utility")).join("")}
        ${offer("u", "Tools", plain(group("Tools")))}${offer("u", "Foci", plain(group("Foci")))}${offer("u", "Things you use up", B.usedUp.map((u) => ({ name: u.name, say: unlink(u.html) })))}
        ${d.deep[4] ? `<h2 id="bd-bag">Your bag</h2>${field("bag", "Up to 10 more things, one a line", x.bag, { area: true, max: 600 })}` : ""}
        <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="deep" data-s="4"${pressed(d.deep[4])}>${d.deep[4] ? "Put the bag away" : "Pack your bag too"}</button></div></section>`,
      k: `<section class="bd-carry" aria-labelledby="bd-ks"><h2 id="bd-ks">A keepsake</h2><p class="cc-lead">Something that matters to your character.</p>
        <div class="bd-slot is-row">${field("k", '<span class="sr-only">Keepsake </span>1', x.keepsake.text, { max: 80, ph: "Type it, or pick a card below" })}</div>
        ${offer("k", "Keepsakes", B.keepsakes.map((k) => ({ name: k.name, say: esc(k.text) })))}${offer("k", "Signature things", plain(group("Signature")))}</section>`,
      a: `<section class="bd-carry" aria-labelledby="bd-at"><h2 id="bd-at">${changing() ? "Attuned things" : "Attune one thing"}</h2><p class="cc-lead">${changing() ? "Each one holds what its stage allows, and they don’t count towards what you carry." : "It starts at Awakened with one awakening, and it doesn’t count towards what you carry. It’s 1 more on a roll you use it in, and it can’t be broken."} ${link("s-attunement", "Attunement")}</p>
        ${x.attuned.map((a, i) => (changing() ? grown(a, i) : quick(a, i))).join("")}
        ${x.attuned.length < (changing() ? MAX_ATTUNED : 1) ? `<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addatt">${x.attuned.length ? "Attune another thing" : "Attune something"}</button></div>` : ""}</section>`,
    };
    if (d.page) return `${parts.e}${parts.u}${parts.k}${parts.a}`;
    return `${kitSwitch()}${parts[kitOf()]}`;
  }

  // Step 5: the ten crew questions as cards, each answer made into a bond
  // thread or a hostile one in a tap, and your bonds: one card a person, with
  // every thread you've got with them inside it, so the same name's never
  // written twice. Two bond threads with the crew to start, a hostile thread
  // with anyone, and a third bond thread with it. A saved character keeps
  // every thread they've got, the ones in a crewmate's words included.
  // "Dorrie. We have pulled a dozen jobs together." is a thread with Dorrie.
  const answerOf = (said) => {
    const m = said.match(/^([^.,:;!?]{1,40}?)[.,:]\s+(\S[\s\S]*)$/);
    const person = m && m[1].trim().split(/\s+/).length <= 4 ? m[1].trim() : "";
    return { person, text: (person ? m[2].trim() : said).slice(0, 200) };
  };
  // Each bond's Who with box is its first thread's (th0.person), and typing in
  // it renames every thread in the bond, as they were drawn. Nothing redraws
  // mid-word, so the bonds drawn are the ones being typed into.
  let bondsDrawn = new Map();
  function stepThreads() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    const groups = bondsOf(x.threads);
    bondsDrawn = new Map(groups.map((g) => [g.items[0].i, g.items.map((it) => it.i)]));
    const thread = (t, i, k, n) => {
      const bond = t.kind !== "hostile";
      return `<div class="bd-thread is-${bond ? "bond" : "hostile"}">${t.whose.trim() ? `<p class="cc-small">In ${esc(t.whose.trim())} words.</p>` : ""}
        <div class="cc-chips" role="group" aria-label="Thread ${i + 1}, what kind">${chip("Bond", `data-b="kind" data-i="${i}" data-v="bond"`, bond, "sm")}${chip("Hostile", `data-b="kind" data-i="${i}" data-v="hostile"`, !bond, "sm")}</div>
        ${field(`th${i}.text`, `What’s true between you${n > 1 ? ` <small>thread ${k + 1} of ${n}</small>` : ""}`, t.text, { max: 200, ph: bond ? "a rescue, a secret you keep for each other, a shared past" : "a debt you can’t pay, a grudge, a betrayal" })}
        ${canDrop("thread") ? `<div class="cc-row">${dropBtn("thread", i, n > 1 ? "Take this thread off" : "Take it off")}</div>` : ""}</div>`;
    };
    const bondCard = (g) => {
      const first = g.items[0].i;
      const bond = g.items.some(({ t }) => t.kind !== "hostile");
      return `<fieldset class="bd-box bd-bond"><legend>${g.person ? esc(g.person) : "Someone new"}</legend>
        ${field(`th${first}.person`, "Who with", g.person, { max: 60, ph: bond ? "someone in the crew" : "anyone, in the crew or out of it" })}
        ${g.items.map(({ t, i }, k) => thread(t, i, k, g.items.length)).join("")}
        ${g.person && x.threads.length < MAX_THREADS ? `<div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="addthreadto" data-i="${first}">Another thread with ${esc(g.person)}</button></div>` : ""}</fieldset>`;
    };
    // Each question's a card. Opened, it takes the answer and makes it a
    // thread, and once it's one it says which.
    const question = (q, i) => {
      const said = String(x.connect[i] ?? "").trim();
      const a = said ? answerOf(said) : null;
      const th = a ? x.threads.find((t) => t.text.trim() && t.text.trim() === a.text.trim() && bondKey(t.person) === bondKey(a.person)) : null;
      return `<details class="bd-tok bd-q" data-open="bd-q-${i}"${d.deep[`q${i}`] === true ? " open" : ""}><summary><span>${esc(q)}</span>${said ? `<small>${esc(said)}</small>` : ""}${th ? `<span class="bd-made is-${th.kind}">${th.kind === "hostile" ? "Hostile" : "Bond"} thread</span>` : ""}</summary>
        <div class="bd-q-in">${field(`cq${i}`, `Your answer<span class="sr-only"> to ${esc(q)}</span>`, x.connect[i] ?? "", { max: 200, ph: "Name them, then say it" })}
        <p class="bd-label" id="bd-qk-${i}">Make it a thread</p><div class="cc-chips" role="group" aria-label="Make your answer to ${esc(q)} a thread">${chip("Bond", `data-b="fromq" data-q="${i}" data-v="bond"`, th?.kind === "bond", "sm")}${chip("Hostile", `data-b="fromq" data-q="${i}" data-v="hostile"`, th?.kind === "hostile", "sm")}</div></div></details>`;
    };
    const room = !changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim());
    const qs = `<p class="cc-lead">Answer at least two, naming someone in the crew in each, and make two of them bond threads. One that’s gone bad can be your hostile thread.</p><div class="bd-qs">${B.connect.map(question).join("")}</div>`;
    return `${changing() ? `<details class="bd-more" data-open="bd-qs"${d.deep.qs === true ? " open" : ""}><summary>The ten crew questions</summary>${qs}</details>` : `<h2 id="bd-qs-h">The crew questions</h2>${qs}`}
      <h2 id="bd-th-h">Your bonds</h2>
      <p class="cc-lead">Each person’s one bond, with every thread you’ve got with them under it.</p>
      ${groups.map(bondCard).join("")}
      ${room ? '<p class="cc-note" role="status">You’ve written a hostile thread, so you’ve got room for a third bond thread.</p>' : ""}
      ${x.threads.length < MAX_THREADS ? '<div class="cc-row"><button type="button" class="button" data-act="b" data-b="addthread">A bond with someone new</button></div>' : ""}`;
  }

  // Step 6: one thing you want, at d2. Past d12 you get it, so the book's
  // tests for a good one sit under it, open on a new character until they're
  // shut, and shut when changing one.
  const goodOpen = () => d.deep.good ?? !changing();
  function stepAsp() {
    return `<div class="bd-asp">${changing() ? "" : `<span class="bd-asp-die">${kitDie(2, { label: "Your Aspiration starts at d2" })}</span>`}<div class="bd-asp-f">${field("asp", changing() ? "Your Aspiration <small>its die’s on the Sheet tab</small>" : "Your Aspiration", b().aspiration, { max: 120, ph: "Own the score of a lifetime" })}</div></div>
      <details class="bd-more bd-good" data-open="bd-good"${goodOpen() ? " open" : ""}><summary>What makes a good Aspiration</summary><div class="cc-rule">${rule("s-good-aspiration")}</div></details>`;
  }

  // Step 7: the numbers in the kit's pieces, a name, and a last look.
  function stepCheck() {
    const x = b();
    const n = numbersOf(x);
    const checks = checksOf(x, B, { changing: changing() });
    const trouble = [...new Set(x.titles.flatMap((t) => IDEA.get(t.idea)?.trouble ?? []))];
    const boons = x.titles.flatMap((t) => t.boons);
    const said = (lever) => boons.filter((y) => y.lever === lever).map((y) => y.name.trim() || `the ${lever} Boon`);
    const num = (k, v, note, piece = "", cls = "") => `<li${cls ? ` class="${cls}"` : ""}><span class="bd-num-text"><span class="k">${k}</span> <b>${v}</b>${note ? ` <small>(${esc(note)})</small>` : ""}</span>${piece}</li>`;
    const go = (c) => `<button type="button" class="button sm" data-act="b" data-b="go" data-s="${c.step}"${c.t != null ? ` data-t="${c.t}"` : ""}${c.a != null ? ` data-a="${c.a}"` : ""}${c.kit ? ` data-k="${c.kit}"` : ""}>${d.page ? STEPS[c.step].name : `Step ${c.step + 1}`}</button>`;
    const track = (name) => kitDie(12, { hide: true, bare: true, label: `${name} starts at d12` });
    return `<fieldset class="bd-box"><legend>Who they are</legend>
        ${field("name", "Name", x.name, { max: 40 })}
        <p class="bd-label" id="bd-pro">Call them</p><div class="cc-chips" role="group" aria-labelledby="bd-pro">${[["her", "she, her"], ["him", "he, him"], ["them", "they, them"]].map(([v, l]) => chip(l, `data-b="pronoun" data-v="${v}"`, x.pronoun === v)).join("")}</div>
        ${field("blurb", "One line about them, if you like", x.blurb, { max: 160 })}</fieldset>
      <h2>Your numbers</h2><ul class="bd-nums">
        ${num("Aura", n.aura, said("Aura").length ? both(said("Aura")) : null, kitAura(n.aura, n.aura), "is-wide")}
        ${num("Stride", n.stride, said("Stride").length ? both(said("Stride")) : null)}
        ${num("Actions a round", n.actions === 1 ? "1" : `up to ${n.actions}`, n.actions > 1 ? "one for each archetype, the rest 3 Aura each" : "one for each archetype")}
        ${num("Stamina", "d12", "your Body", track("Stamina"))}${num("Confidence", "d12", "your Mind", track("Confidence"))}${num("Resolve", "d12", "your Soul", track("Resolve"))}</ul>
      <h2>Your Roots and specialties</h2>${rootTiles()}
      ${boons.length ? `<h2>Your Boons</h2><ul class="cc-list">${boons.map((y) => `<li class="cc-item"><p><b>${esc(y.name.trim() || y.lever)}</b>${y.name.trim() ? ` <small>${esc(y.lever)}</small>` : ""} ${esc(BOON.get(y.lever)?.text ?? "")}${y.on.trim() ? ` (${esc(y.on.trim())})` : ""}</p></li>`).join("")}</ul>` : ""}
      ${trouble.length || x.trouble.length || changing() ? `<h2>Trouble that follows you</h2><p class="cc-lead">If you like. Let it cause real trouble and you take 1 Aura.</p>${trouble.length || x.trouble.length ? `<div class="cc-chips">${[...new Set([...trouble, ...x.trouble])].map((t) => chip(`<em>${esc(t)}</em>`, `data-b="trouble" data-v="${esc(t)}"`, x.trouble.includes(t))).join("")}</div>` : ""}
        <div class="cc-form">${field("newtrouble", "Or write your own", "", { max: 120, ph: "owes the wrong people" })}<button type="button" class="button" data-act="b" data-b="addtrouble">Add it</button></div>` : ""}
      ${checks.length ? `<div class="cc-note is-warn"><p>A few things to look at. You can save anyway, and change them later.</p><ul class="bd-checks">${checks.map((c) => `<li>${esc(c.text)} ${go(c)}</li>`).join("")}</ul></div>` : '<p class="cc-note" role="status">Everything adds up.</p>'}`;
  }

  const BODIES = [stepArch, stepTitles, stepRoots, stepCarry, stepThreads, stepAsp, stepCheck];
  const part = (i) => `<h2 id="bd-part-${i}" tabindex="-1">${STEPS[i].name}</h2>${how(i)}${BODIES[i]().replace(/<(\/?)h2\b/g, "<$1h3")}`;
  // Typing on one page redraws the parts that add it all up (the Roots and
  // the last look) after a pause, but only below where you're typing, so
  // nothing moves under the keyboard.
  function refreshSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!d?.page) return;
      const at = document.activeElement?.closest(".bd-part");
      const fromPart = at ? Number(at.getAttribute("aria-labelledby").slice("bd-part-".length)) : -1;
      for (const i of [2, LAST]) {
        const el = i > fromPart && document.querySelector(`.bd-part[aria-labelledby="bd-part-${i}"]`);
        if (el) el.innerHTML = part(i);
      }
    }, 400);
  }
  // start is the build to start from, or a function that makes it, only
  // called when there's no draft to carry on with.
  function view(key, start, m = {}) {
    meta = m;
    if (!d || slotKey !== (key || "new")) open(key, start, m);
    if (d.page) return pageView();
    const go = slide;
    slide = "";
    return `${head()}<div class="bd-body${go ? ` bd-go-${go}` : ""}">${BODIES[d.step]()}
      <p class="cc-lead bd-saved">Your work’s saved on this phone as you go.</p>
      <div class="cc-row"><button type="button" class="button sm" data-act="b" data-b="page">See it all on one page</button>${dropEdit()}</div></div>${bar()}`;
  }
  // After a redraw, every Root and specialty whose dice changed grows into
  // its new shape, or shrinks back, and a second die pops in past 6 steps.
  // grow() leaves the new die as it's drawn under reduce-motion.
  function after(root) {
    if (!d) return;
    const foot = root?.querySelector(".bd-foot");
    if (foot) document.documentElement.style.setProperty("--bd-bar", `${foot.offsetHeight}px`);
    const { roots, specialties } = rootsOf(b());
    const now = new Map([...ROOTS.map((r) => [`root:${r}`, roots[r] ? stepsToDice(roots[r]) : []]), ...specialties.map((s) => [`spec:${R.specKey(s.name)}`, stepsToDice(s.steps)])]);
    const before = shown;
    shown = now;
    if (!before || !root) return;
    for (const el of root.querySelectorAll(".bd-tiles .tile-dice[data-for]")) {
      const old = before.get(el.dataset.for);
      const dice = now.get(el.dataset.for);
      if (!dice?.length) continue;
      const svgs = el.querySelectorAll(".zd-die");
      if (!old?.length) svgs[0]?.classList.add("is-new");
      else if (old[0] !== dice[0]) growDie(svgs[0], old[0], dice[0]);
      if (old && dice.length > old.length) svgs[dice.length - 1]?.classList.add("is-new");
    }
  }

  // Everything typed goes straight into the draft. Nothing redraws mid-word.
  function input(el) {
    const x = b();
    const path = el.dataset.bin;
    const v = el.value;
    const set = (obj, key) => {
      if (obj) obj[key] = v;
    };
    let m;
    if ((m = path.match(/^t(\d+)\.text$/))) set(x.titles[m[1]], "text");
    else if ((m = path.match(/^t(\d+)\.s(\d)$/))) {
      const t = x.titles[m[1]];
      if (t) t.specs[m[2]] = v;
    } else if ((m = path.match(/^t(\d+)\.p(\d+)$/))) set(x.titles[m[1]]?.perms[m[2]], "text");
    else if ((m = path.match(/^t(\d+)\.p(\d+)\.spec$/))) {
      const p = x.titles[m[1]]?.perms[m[2]];
      if (!p) return;
      p.spec = v;
      for (const btn of document.querySelectorAll(`[data-b="pspec"][data-t="${m[1]}"][data-j="${m[2]}"]`)) btn.setAttribute("aria-pressed", String(R.specKey(btn.dataset.v) === R.specKey(v)));
    } else if ((m = path.match(/^t(\d+)\.b(\d+)\.(name|on)$/))) set(x.titles[m[1]]?.boons[m[2]], m[3]);
    else if ((m = path.match(/^e(\d)$/))) {
      const item = x.equipment[m[1]];
      if (!item) return;
      const wasArmour = ARMOUR.test(item.text);
      item.text = v;
      // Plate, leathers and a shield going in put the piece on the Body, and
      // taking them out takes it off, unless the player's said otherwise.
      if (wasArmour !== ARMOUR.test(v) && (!item.arm || item.arm === "Body")) {
        item.arm = ARMOUR.test(v) ? "Body" : "";
        if (!item.arm) delete item.q;
      }
    } else if ((m = path.match(/^u(\d)$/))) set(x.utility[m[1]], "text");
    else if (path === "k") x.keepsake.text = v;
    else if ((m = path.match(/^a(\d+)\.(name|catch|burden|aura)$/))) set(x.attuned[m[1]], m[2]);
    else if ((m = path.match(/^a(\d+)\.w(\d+)\.(name|text)$/))) {
      const a = x.attuned[m[1]];
      if (!a) return;
      atLeast(a.awk, Number(m[2]) + 1, blankAwk);
      a.awk[m[2]][m[3]] = v;
      if (!awkIn(a.awk[m[2]])) delete a.awk[m[2]].kept;
    } else if ((m = path.match(/^th(\d+)\.person$/))) for (const j of bondsDrawn.get(Number(m[1])) ?? [Number(m[1])]) set(x.threads[j], "person");
    else if ((m = path.match(/^th(\d+)\.text$/))) set(x.threads[m[1]], "text");
    else if ((m = path.match(/^cq(\d+)$/))) x.connect[m[1]] = v;
    else if (["asp", "name", "blurb", "bag"].includes(path)) x[path === "asp" ? "aspiration" : path] = v;
    else return; // newtrouble is read when its button's tapped
    saveSoon();
    if (d.page) refreshSoon();
  }

  // A hostile thread makes room for a third bond thread in the Quick Build.
  function roomForThird() {
    const x = b();
    const { bonds, hostile } = threadCount(x);
    if (!changing() && hostile && bonds < 3 && !x.threads.some((t) => t.kind !== "hostile" && !t.person.trim() && !t.text.trim()) && x.threads.length < MAX_THREADS) x.threads.push(blankThread());
  }

  const value = (id) => document.getElementById(id)?.value ?? "";
  // Taps. Each one changes the draft, saves it and redraws.
  function act(el, e, render, focusTop) {
    const x = b();
    const k = el.dataset.b;
    const i = Number(el.dataset.t ?? el.dataset.i ?? 0);
    const j = Number(el.dataset.j ?? 0);
    const v = el.dataset.v ?? "";
    const armed = dropping;
    dropping = "";
    // After adding or taking something off, the cursor goes where it went.
    const where = el.closest(".bd-part")?.getAttribute("aria-labelledby");
    let then = null;
    const focusIn = (...sels) => () => {
      const scope = (where && document.querySelector(`.bd-part[aria-labelledby="${where}"]`)) || document.querySelector(".bd-body");
      sels.map((s) => scope?.querySelector(s)).find(Boolean)?.focus();
    };
    // An archetype, a Title or a part of what you carry, switched to: its
    // switch stays where the thumb is, and the screen starts from the switch.
    const toSwitch = () => {
      const sw = document.querySelector(".bd-switch");
      if (sw && sw.getBoundingClientRect().top < 0) sw.scrollIntoView({ block: "start" });
    };
    if (k !== "reroll") sure = false;
    if (k === "leave") {
      e.preventDefault();
      save();
      return onLeave(slotKey);
    }
    if (k === "dropedit") {
      const key = slotKey;
      discard();
      return onLeave(key);
    }
    if (k === "go") {
      const to = Math.min(LAST, Math.max(0, Number(el.dataset.s)));
      el.closest("details")?.removeAttribute("open");
      if (d.page) {
        d.step = to;
        const h = document.getElementById(`bd-part-${to}`);
        h?.scrollIntoView({ block: "start" });
        return h?.focus({ preventScroll: true });
      }
      const moved = to !== d.step;
      slide = to > d.step ? "next" : to < d.step ? "back" : "";
      d.step = to;
      if (el.dataset.t != null) d.deep.tab = Number(el.dataset.t);
      else if (to === 1 && moved) d.deep.tab = 0;
      if (el.dataset.a != null) d.deep.atab = Number(el.dataset.a);
      else if (to === 0 && moved) d.deep.atab = 0;
      if (el.dataset.k) d.deep.kit = el.dataset.k;
      else if (to === 3 && moved) d.deep.kit = "e";
      save();
      render();
      return focusTop();
    }
    if (k === "next" || k === "back") {
      const fwd = k === "next";
      const step = within(fwd);
      slide = fwd ? "next" : "back";
      if (step) {
        if (step.tab != null) d.deep.tab = step.tab;
        if (step.atab != null) d.deep.atab = step.atab;
        if (step.kit) d.deep.kit = step.kit;
        save();
        render();
        scrollTo(0, 0);
        return document.querySelector('.bd-switch [aria-current="true"]')?.focus({ preventScroll: true });
      }
      const to = d.step + (fwd ? 1 : -1);
      if (to < 0 || to > LAST) return;
      d.step = to;
      // Coming into a step from the one before starts on its first archetype,
      // Title or part, and coming back into it from the one after, on its last.
      if (to === 0) d.deep.atab = fwd ? 0 : x.archs.length - 1;
      if (to === 1) d.deep.tab = fwd ? 0 : x.titles.length - 1;
      if (to === 3) d.deep.kit = fwd ? KIT[0][0] : KIT[KIT.length - 1][0];
      save();
      render();
      return focusTop();
    }
    if (k === "tab" || k === "atab" || k === "kit") {
      const at = () => (k === "tab" ? tabOf() : k === "atab" ? archTab() : kitAt());
      const was0 = at();
      if (k === "tab") d.deep.tab = Math.min(Math.max(0, i), x.titles.length - 1);
      else if (k === "atab") d.deep.atab = Math.min(Math.max(0, i), x.archs.length - 1);
      else d.deep.kit = KIT.some(([key]) => key === v) ? v : "e";
      const now = at();
      slide = now > was0 ? "next" : now < was0 ? "back" : "";
      save();
      render();
      return toSwitch();
    }
    if (k === "reroll") {
      if (JSON.stringify(x) !== rolled && !sure) {
        sure = true;
        return render();
      }
      sure = false;
      d.build = normalBuild(roll());
      rolled = JSON.stringify(d.build);
      shown = null;
      save();
      return render();
    }
    if (k === "page") {
      d.page = !d.page;
      d.step = 0;
      d.deep.tab = 0;
      d.deep.atab = 0;
      d.deep.kit = "e";
      save();
      render();
      return focusTop();
    }
    if (k === "save") {
      save();
      return onSave(normalBuild(x), slotKey, () => discard(), d.basis);
    }
    if (k === "deep") d.deep[el.dataset.s] = !d.deep[el.dataset.s];
    else if (k === "ideas") d.deep[`ideas${i}`] = !(d.deep[`ideas${i}`] === true);
    else if (k === "archopen") {
      d.deep[`pick${i}`] = !(d.deep[`pick${i}`] === true);
      then = d.deep[`pick${i}`] ? focusIn(`[data-b="arch"][data-t="${i}"][aria-pressed="true"]`, `[data-b="arch"][data-t="${i}"]`) : focusIn(`[data-b="archopen"][data-t="${i}"]`);
    } else if (k === "arch") {
      if (i >= x.archs.length) return;
      x.archs[i] = v;
      // Picked, the cards fold away to the one picked.
      delete d.deep[`pick${i}`];
      then = () => {
        const box = [...document.querySelectorAll(`[data-b="archopen"][data-t="${i}"]`)].map((btn) => btn.closest(".bd-chosen")).find(Boolean);
        box?.focus({ preventScroll: true });
        if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start" });
      };
    } else if (k === "addarch") {
      if (x.archs.length >= MAX_ARCHS) return;
      x.archs.push("");
      d.deep.atab = x.archs.length - 1;
      d.deep[`pick${x.archs.length - 1}`] = true;
      then = focusIn(`[data-b="arch"][data-t="${x.archs.length - 1}"]`);
    } else if (k === "idea") {
      const t = x.titles[i];
      t.idea = t.idea === v ? "" : v;
      if (t.idea) d.deep[`idea${i}`] = true;
    } else if (k === "title") x.titles[i].text = v;
    else if (k === "root") {
      const t = x.titles[i];
      if (t) t.root = t.root === v ? "" : rootOf(v);
    } else if (k === "proot") {
      const p = x.titles[i]?.perms[j];
      if (p) p.root = p.root === v ? "" : rootOf(v);
    } else if (k === "pspec") {
      const p = x.titles[i]?.perms[j];
      if (p) p.spec = R.specKey(p.spec) === R.specKey(v) ? "" : v;
    } else if (k === "perm") {
      const t = x.titles[i];
      const at = t.perms.findIndex((p) => p.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) t.perms[at] = blankPerm();
      else {
        let free = t.perms.findIndex((p) => !p.text.trim());
        if (free < 0 && slotsOf(t) >= MAX_PERMS) return toast("That’s all six slots on this Title. Tap one to take it off first, or change one by hand.", false);
        if (free < 0 && !changing() && slotsOf(t) >= 3) return toast("That Title’s got three. Tap one to take it off first, or change one by hand.", false);
        if (free < 0) {
          t.perms.push(blankPerm());
          free = t.perms.length - 1;
        }
        // Its Root and specialty are a guess from its words, for the player to check.
        const g = guessFor(v, t.specs, t.root);
        t.perms[free] = { text: v, root: g.root, spec: g.spec };
      }
    } else if (k === "addperm") {
      const t = x.titles[i];
      if (!t) return;
      if (slotsOf(t) >= MAX_PERMS) return toast("That’s all six slots. Six is the most a Title holds.", false);
      t.perms.push(blankPerm());
      then = focusIn(`#b-t${i}-p${t.perms.length - 1}`);
    } else if (k === "boon") {
      const t = x.titles[i];
      if (!t || !BOON.has(v)) return;
      // A Boon takes two slots: two empty permission lines go, or two more
      // slots if the Title's got them.
      const empty = t.perms.map((p, q) => (p.text.trim() ? -1 : q)).filter((q) => q >= 0);
      if (MAX_PERMS - slotsOf(t) < R.BOON_SLOTS) return toast("That Title hasn’t got two slots free. Take two permissions off first.", false);
      for (const q of empty.slice(-R.BOON_SLOTS).sort((p, q) => q - p)) t.perms.splice(q, 1);
      if (!t.perms.length && !t.boons.length && slotsOf(t) + R.BOON_SLOTS < 3) t.perms.push(blankPerm());
      t.boons.push({ lever: v, name: "", on: "" });
      then = focusIn(`#b-t${i}-b${t.boons.length - 1}-name`);
    } else if (k.startsWith("dropboon")) {
      const m = k.match(/^dropboon(\d+)-$/);
      const t = m && x.titles[Number(m[1])];
      const at = Number(el.dataset.i);
      if (!t || !t.boons[at]) return;
      if (armed !== `${k.slice(4)}${at}` && (t.boons[at].name.trim() || t.boons[at].on.trim())) {
        dropping = `${k.slice(4)}${at}`;
        return render();
      }
      t.boons.splice(at, 1);
      // Its two slots are permissions again, on a new character.
      if (!changing()) for (let q = 0; q < R.BOON_SLOTS && slotsOf(t) + t.perms.filter((p) => !p.text.trim()).length < 3; q++) t.perms.push(blankPerm());
    } else if (k === "addtitle") {
      if (x.titles.length >= MAX_TITLES) return;
      // A Title from an Aspiration comes with one permission. The Quick Build's come with three.
      x.titles.push(changing() ? { ...blankTitle(), perms: [blankPerm()] } : blankTitle());
      const n = x.titles.length - 1;
      d.deep.tab = n;
      then = focusIn(`#b-t${n}-text`);
    } else if (["droptitle", "droparch", "dropatt", "dropthread"].includes(k)) {
      const kind = k.slice(4);
      const arr = kind === "title" ? x.titles : kind === "arch" ? x.archs : kind === "att" ? x.attuned : x.threads;
      const it = arr[i];
      if (it == null || !canDrop(kind)) return;
      // A thread's words are what's lost. Its name's the bond's, unless it's the only thread in it.
      const full = kind === "title" ? titleIn(it) : kind === "arch" ? Boolean(it) : kind === "att" ? thingIn(it) : Boolean(it.text.trim() || (it.person.trim() && !arr.some((t, q) => q !== i && bondKey(t.person) === bondKey(it.person))));
      if (full && armed !== `${kind}${i}`) {
        dropping = `${kind}${i}`;
        return render();
      }
      arr.splice(i, 1);
      if (kind === "title" || kind === "arch") {
        // The switch and the open pickers follow the ones that are left.
        const keys = kind === "title" ? ["ideas", "idea", "boon"] : ["pick", "archmore"];
        for (const key of keys) {
          for (let q = i; q < arr.length; q++) d.deep[`${key}${q}`] = d.deep[`${key}${q + 1}`];
          delete d.deep[`${key}${arr.length}`];
        }
        if (kind === "title") d.deep.tab = Math.min(tabOf(), arr.length - 1);
        else d.deep.atab = Math.min(archTab(), arr.length - 1);
      }
      then = focusIn(`[data-b="add${kind}"]`, `[data-b="${kind === "arch" ? "atab" : "tab"}"][aria-current="true"]`);
    } else if (k === "merge") {
      // Make two spellings of one specialty one: the second's the one kept.
      const from0 = R.specKey(v);
      const to = el.dataset.w ?? "";
      for (const t of x.titles) {
        t.specs = t.specs.map((s) => (R.specKey(s) === from0 ? to : s));
        for (const p of t.perms) if (R.specKey(p.spec) === from0) p.spec = to;
      }
    } else if (k === "addatt") {
      if (x.attuned.length >= MAX_ATTUNED) return;
      x.attuned.push(blankThing());
      then = focusIn(`#b-a${x.attuned.length - 1}-name`);
    } else if (k === "addawk") {
      const a = x.attuned[i];
      if (!a) return;
      if (a.awk.length >= 6) return toast("Six awakenings is the most anything holds.", false);
      a.awk.push(blankAwk());
      then = focusIn(`#b-a${i}-w${a.awk.length - 1}-name`);
    } else if (k === "awkkind") {
      const a = x.attuned[i];
      if (!a) return;
      atLeast(a.awk, j + 1, blankAwk);
      a.awk[j].kind = v === "active" ? "active" : "passive";
    } else if (k === "stage") {
      if (x.attuned[i] && R.STAGES.includes(v)) x.attuned[i].stage = v;
    } else if (k === "arm") {
      const e2 = x.equipment[i];
      if (!e2) return;
      e2.arm = rootOf(v);
      if (!e2.arm) delete e2.q;
    } else if (k === "quality") {
      const e2 = x.equipment[i];
      if (!e2 || ![1, 2, 3].includes(Number(v))) return;
      if (Number(v) > 1) e2.q = Number(v);
      else delete e2.q;
    } else if (k === "addthread") {
      if (x.threads.length >= MAX_THREADS) return;
      x.threads.push(blankThread());
      then = focusIn(`#b-th${x.threads.length - 1}-person`);
    } else if (k === "addthreadto") {
      // Another thread with someone you've already got a bond with goes under it.
      const who = x.threads[i]?.person.trim();
      if (!who || x.threads.length >= MAX_THREADS) return;
      x.threads.push({ ...blankThread(), person: who });
      then = focusIn(`#b-th${x.threads.length - 1}-text`);
    } else if (k === "fill") {
      const m = el.dataset.p.match(/^a(\d+)\.(name|catch)$/);
      // A second tap on the card it's from takes it back off.
      if (m && x.attuned[m[1]]) x.attuned[m[1]][m[2]] = x.attuned[m[1]][m[2]].trim() === v ? "" : v;
    } else if (k === "fillany") {
      const kind = el.dataset.k;
      const items = kind === "e" ? x.equipment : kind === "u" ? x.utility.slice(0, numbersOf(x).utility) : [x.keepsake];
      const at = items.findIndex((it) => it.text.trim().toLowerCase() === v.toLowerCase());
      if (at >= 0) {
        items[at].text = "";
        if (kind === "e") {
          items[at].arm = "";
          delete items[at].q;
        }
      } else {
        const free = kind === "k" ? 0 : items.findIndex((it) => !it.text.trim());
        if (free < 0) return toast("That’s full. Tap one to take it off, or change one by hand.", false);
        items[free].text = v;
        // Plain armour and a shield guard your Body.
        if (kind === "e") items[free].arm = ARMOUR.test(v) ? "Body" : "";
      }
    } else if (k === "kind") {
      if (!x.threads[i]) return;
      x.threads[i].kind = v === "hostile" ? "hostile" : "bond";
      roomForThird();
    } else if (k === "fromq") {
      // An answer becomes a thread in one tap, bond or hostile. It goes in the
      // first empty thread of that kind, then any empty one, or a new one, and
      // an answer that's a thread already just changes its kind.
      const q = Number(el.dataset.q);
      const kind = v === "hostile" ? "hostile" : "bond";
      const said = String(x.connect[q] ?? "").trim();
      if (!said) return toast("Answer the question first, then make it a thread.", false);
      const answer = answerOf(said);
      const person = bondName(x.threads.map((t) => t.person), answer.person);
      const { text } = answer;
      let at = x.threads.findIndex((t) => t.text.trim() === text.trim() && bondKey(t.person) === bondKey(person));
      if (at >= 0 && x.threads[at].kind === kind) {
        Object.assign(x.threads[at], { person: "", text: "" });
        save();
        return render();
      }
      if (at < 0) at = x.threads.findIndex((t) => t.kind === kind && !t.person.trim() && !t.text.trim());
      if (at < 0) at = x.threads.findIndex((t) => !t.person.trim() && !t.text.trim());
      if (at < 0) {
        if (x.threads.length >= MAX_THREADS) return toast("That’s as many threads as a sheet holds.", false);
        x.threads.push(blankThread(kind));
        at = x.threads.length - 1;
      }
      Object.assign(x.threads[at], { person, text, kind });
      roomForThird();
      // Without a name in the answer, who it's with is the next thing to write.
      if (!person) then = focusIn(`#b-th${at}-person`);
    } else if (k === "addtrouble") {
      const t = value("b-newtrouble").trim().replace(/\s+/g, " ").slice(0, 120);
      if (!t) return toast("Type the trouble first.", false);
      if (!x.trouble.includes(t)) x.trouble = [...x.trouble, t].slice(0, 12);
    } else if (k === "pronoun") x.pronoun = v;
    else if (k === "trouble") x.trouble = x.trouble.includes(v) ? x.trouble.filter((t) => t !== v) : [...x.trouble, v];
    save();
    render();
    then?.();
  }

  // The details boxes remember being opened, so the book's words and the
  // questions stay as they were left.
  function toggled(el) {
    if (!d) return;
    const key = el.dataset.open ?? "";
    let m;
    const name = (m = key.match(/^bd-how-(\d)$/)) ? `how${m[1]}` : (m = key.match(/^bd-q-(\d+)$/)) ? `q${m[1]}` : (m = key.match(/^bd-arch-(\d+)$/)) ? `archmore${m[1]}` : (m = key.match(/^bd-ideas-(\d+)$/)) ? `idea${m[1]}` : (m = key.match(/^bd-boon-(\d+)$/)) ? `boon${m[1]}` : key === "bd-test" ? "test" : key === "bd-qs" ? "qs" : key === "bd-good" ? "good" : "";
    if (!name) return;
    // A redraw puts a fold back the way it was, which isn't a change.
    const now = name === "good" ? goodOpen() : name.startsWith("idea") ? d.deep[name] ?? !d.page : d.deep[name] === true;
    if (now === el.open) return;
    d.deep[name] = el.open;
    saveSoon();
  }

  return { view, act, input, toggled, open, begin, discard, close, after, flush: () => d && save(), get step() { return d?.step ?? 0; } };
}
