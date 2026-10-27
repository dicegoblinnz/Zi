// The other ways into the builder: one of the crew to start from, or random in
// one tap. Both make an ordinary build (builder.js), so the player can change
// anything before saving, and the builder's warnings still apply. A blank
// sheet is just blankBuild() on one page.
import { ACTIONS, ARMOUR, blankBuild, keepAttuned, lineAt, normalBuild } from "./builder.js";
import { MAX_PERMS } from "./grow.js";

// A thread in someone else's words says whose ("Dorrie’s"). It's theirs to
// keep, so it doesn't come along.
const theirs = (t) => Boolean(t.whose) || /’s\b/.test(t.note ?? "");
const whoseOf = (t) => t.whose || String(t.note ?? "").match(/^([^,]+’s)(?=,|$)/)?.[1] || "";
const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");

// One of the crew as a build: their Titles, permissions, traits, set actions
// and the lines on them, what they carry, attuned things, their own threads,
// crew answers, Aspiration and trouble. The name's left for the player.
// With keep, it's that crew member themselves becoming your own, so nothing's
// left behind: every Title and permission, every attuned thing at its stage,
// every thread (the ones in a crewmate's words too), their name and blurb.
export function fromCrew(c, B, { keep = false } = {}) {
  const b = blankBuild();
  const ref = new Map(); // a line's key on the crew sheet, and where it goes in the build
  const ideaOf = (name) => B.ideas.find((x) => x.titles.includes(name))?.id ?? "";
  (keep ? c.titles : c.titles.slice(0, 2)).forEach((t, i) => {
    const perms = t.permissions.slice(0, keep ? MAX_PERMS : 3);
    b.titles[i] = { arch: t.archetype, idea: ideaOf(t.name), text: t.name, on: [], perms: (keep ? perms : [0, 1, 2].map((j) => perms[j])).map((p) => ({ text: p?.text ?? "", on: [] })) };
    ref.set(t.key, `t${i}`);
    perms.forEach((p, j) => ref.set(p.key, `p${i}.${j}`));
  });
  // A trait's never a step, so it never goes on a set action.
  b.traits = c.traits.map((t) => ({ name: t.name, on: [] }));
  const eq = c.carry.equipment.items.slice(0, 3);
  const ut = c.carry.utility.items.slice(0, keep ? 8 : 4);
  // Their armour's already a line on their Defend, so it comes across with the
  // rest, and keeps its quality.
  eq.forEach((x, i) => {
    const tier = c.armour?.find((a) => a.name === x)?.tier ?? 1;
    Object.assign(b.equipment[i], { text: x }, tier > 1 ? { q: tier } : {});
  });
  ut.forEach((x, i) => (b.utility[i] = { text: x, on: [] }));
  b.keepsake.text = c.carry.keepsake ?? "";
  b.bag = (c.carry.bag.items ?? []).join("\n");
  for (const l of c.lines.filter((x) => x.kind === "kit")) {
    const at = eq.indexOf(l.label) >= 0 ? `e${eq.indexOf(l.label)}` : ut.indexOf(l.label) >= 0 ? `u${ut.indexOf(l.label)}` : l.label === b.keepsake.text ? "k" : null;
    if (at) ref.set(l.key, at);
  }
  // A new character attunes one thing. One of the crew becoming your own
  // keeps everything they've got.
  (keep ? c.attuned : c.attuned.slice(0, 1)).forEach((a, i) => {
    const perms = a.permissions.slice(0, keep ? MAX_PERMS : 2);
    b.attuned[i] = {
      name: a.props ? `${a.name} (${a.props})` : a.name, stage: keep ? a.stage || "Awakened" : "Awakened", catch: a.catch ?? "", burden: keep ? a.burden ?? "" : "",
      perms: (keep ? perms : [0, 1].map((j) => perms[j])).map((p) => ({ text: p?.text ?? "", on: [] })),
    };
    perms.forEach((p, j) => ref.set(p.key, `a${i}.${j}`));
  });
  b.actions = c.actions.map((a) => a.name);
  for (const a of c.actions) {
    for (const key of a.lines) {
      const l = ref.has(key) ? lineAt(b, ref.get(key)) : null;
      if (l && !l.on.includes(a.name)) l.on.push(a.name);
    }
  }
  const own = c.threads.flatMap((p) => p.threads.filter((t) => keep || !theirs(t)).map((t) => ({ person: p.person, text: t.text, kind: kindOf(t), whose: keep ? whoseOf(t) : "", ...(keep && t.strained ? { strained: true } : {}) })));
  if (keep) b.threads = own;
  else own.slice(0, 4).forEach((t, i) => (b.threads[i] = t));
  b.connect = B.connect.map((q) => c.crewQs.find((x) => x.q === q)?.a ?? "");
  b.aspiration = c.aspiration.text;
  b.pronoun = c.pronoun;
  b.clothes = c.numbers.dressed?.what ?? "";
  b.trouble = [...c.trouble];
  if (keep) {
    b.name = c.name;
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

// Which set action a line most likely helps, from its words. A plain thing
// goes on one, and a permission on two at most. Nothing goes on
// Defend unless its words say it keeps you from getting hit.
const LEANS = [
  ["Defend", /\b(dodge|parry|block|shield|armou?r|guard|duck|weave|protect|brace|hold the line)/i],
  ["Fight", /\b(fight|blade|sword|shoot|strike|duel|disarm|brawl|spear|bow|axe|hammer|knife|weapon|wrestle|punch)/i],
  ["Move", /\b(run|climb|leap|jump|swim|ride|chase|roof|balance|sprint|escape|vault|feet)/i],
  ["Sneak", /\b(unseen|unheard|hide|sneak|slip|shadow|quiet|silent|lock|lift|purse|pocket|steal|trap|case)/i],
  ["Talk", /\b(talk|charm|lie|persuade|convince|threaten|bargain|haggle|order|command|bluff|calm|sing|perform|crowd|friend|speak|deal|rally)/i],
  ["Study", /\b(know|read|study|spot|notice|track|trail|remember|history|map|find|search|heal|stitch|mend|mix|fix|craft|tell|smell|weather|language)/i],
];

const FIRST = ["Ar", "Bel", "Cal", "Dor", "Ed", "Fen", "Gar", "Hal", "Is", "Jor", "Kel", "Lir", "Mar", "Nev", "Os", "Per", "Ros", "Sel", "Tam", "Ul", "Ves", "Wyn", "Yar", "Zel"];
const LAST = ["a", "an", "ek", "el", "en", "eth", "ia", "in", "is", "o", "on", "ra", "ric", "wen", "ys"];

// A whole character in one tap, from the book's own ideas, traits, items and
// the crew's threads and Aspirations, that passes every one of the builder's
// warnings. rand is there so a check can fix the dice.
export function randomBuild(B, crew, rand = Math.random) {
  const b = blankBuild();
  const known = new Set(B.archetypes.map((a) => a.name));
  const spares = shuffle(B.permIdeas.flatMap((g) => g.perms), rand);
  const ideas = shuffle(B.ideas.filter((x) => x.titles.length && x.archetypes.some((a) => known.has(a))), rand).slice(0, 2);
  // Each line goes on the set action its words lean to, the least loaded one
  // when it leans to a few, and the least loaded of all when it doesn't say.
  // No set action gets more than 4 lines, 5 steps, like the crew's biggest,
  // and a line with nowhere left to go stays off them.
  const load = Object.fromEntries(ACTIONS.map((a) => [a, 0]));
  const anywhere = ACTIONS.filter((a) => a !== "Defend");
  const onto = (text, said, cap = 4) => {
    const fits = said ? [said] : LEANS.filter(([, re]) => re.test(text)).map(([a]) => a);
    const pool = (fits.length ? fits : anywhere).filter((a) => load[a] < cap);
    if (!pool.length) return null;
    const low = Math.min(...pool.map((a) => load[a]));
    const a = pick(pool.filter((x) => load[x] === low), rand);
    load[a] += 1;
    return a;
  };
  const left = [];
  // Each permission once, so the same words never sit on one set action twice.
  const taken = new Set();
  ideas.forEach((idea, i) => {
    const perms = shuffle(idea.permissions.filter((p) => /\s/.test(p.trim()) && !taken.has(p)), rand);
    for (const p of spares) if (perms.length < 3 && !perms.includes(p) && !taken.has(p)) perms.push(p);
    for (const p of perms.slice(0, 3)) taken.add(p);
    const t = b.titles[i];
    Object.assign(t, { arch: pick(idea.archetypes.filter((a) => known.has(a)), rand), idea: idea.id, text: pick(idea.titles, rand) });
    perms.slice(0, 3).forEach((p, j) => (t.perms[j] = { text: p, on: [onto(p, null, 3)].filter(Boolean) }));
    t.on = [...new Set(t.perms.flatMap((p) => p.on))].filter((a) => load[a] < 4);
    for (const a of t.on) load[a] += 1;
    left.push(...perms.slice(3));
  });

  const suggested = [...new Set(ideas.flatMap((x) => x.traits))].filter((n) => B.traits.some((t) => t.name === n));
  const traits = [...shuffle(suggested, rand), ...shuffle(B.traits.map((t) => t.name), rand).filter((n) => !suggested.includes(n))].slice(0, 2);
  // A trait's never a step, so it never goes on a set action.
  b.traits = traits.map((name) => ({ name, on: [] }));

  const group = (g) => B.items.find((x) => x.group === g)?.items ?? [];
  b.equipment[0] = { text: pick(group("Weapons"), rand), on: [onto("", "Fight")].filter(Boolean) };
  if (rand() < 0.6) {
    // Plain armour, a shield and a helmet are lines on Defend, and Common.
    const worn = pick(group("Armour & wearables"), rand);
    b.equipment[1] = { text: worn, on: ARMOUR.test(worn) ? [onto("", "Defend")].filter(Boolean) : [] };
  }
  shuffle([...group("Tools"), ...B.usedUp.map((u) => u.name)], rand).slice(0, 2).forEach((x, i) => (b.utility[i] = { text: x, on: [] }));
  b.keepsake = { text: pick(B.keepsakes, rand).name, on: [] };
  // One attuned thing, on top of what you carry, and a signature thing often
  // makes the best one. It gets a permission the Titles didn't use.
  const carried = new Set([...b.equipment, ...b.utility].map((x) => x.text.toLowerCase()));
  const things = shuffle([...group("Signature"), ...group("Foci"), ...group("Tools")], rand).filter((x) => !carried.has(x.toLowerCase())).slice(0, 1);
  const unused = [...shuffle(left, rand), ...spares].filter((p) => !taken.has(p));
  things.forEach((name, i) => {
    const p = unused[i];
    b.attuned[i] = { name: name.charAt(0).toUpperCase() + name.slice(1), catch: "", perms: [{ text: p, on: [onto(p)].filter(Boolean) }, { text: "", on: [] }] };
  });

  // Two bond threads and a hostile one, from the crew's own, and sometimes the
  // third bond thread the hostile one makes room for. A different person for
  // each where there are enough to go round.
  const pool = { bond: [], hostile: [] };
  for (const c of crew) for (const p of c.threads) for (const t of p.threads) {
    if (!theirs(t) && !pool.bond.some((x) => x.text === t.text) && !pool.hostile.some((x) => x.text === t.text)) pool[kindOf(t)].push({ person: p.person, text: t.text, kind: kindOf(t), whose: "" });
  }
  const chosen = [];
  const take = (kind, n) => {
    const list = shuffle(pool[kind], rand);
    const fresh = list.filter((t) => !chosen.some((x) => x.person === t.person));
    for (const t of [...fresh, ...list.filter((x) => !fresh.includes(x))]) {
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
  b.aspiration = pick(crew.map((c) => c.aspiration.text).filter(Boolean), rand) ?? "";
  b.name = pick(FIRST, rand) + pick(LAST, rand);
  b.pronoun = pick(["her", "him", "them"], rand);
  const trouble = ideas.flatMap((x) => x.trouble);
  if (trouble.length) b.trouble = [pick(trouble, rand)];
  return normalBuild(b);
}
