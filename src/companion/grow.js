// Growing on the phone. What a character's downtimes add to their sheet is
// kept as a list in their state (state.grown), on top of the sheet the rules
// give them, so the crew's sheets still come straight off the chapter, a
// built character's still come from their build, and a downtime undoes like
// anything else. Each entry adds one thing:
//   { k: "perm", t, text, on }                 a permission on Title t
//   { k: "swap", t, j, from, text, on }        a permission swapped for another
//   { k: "att", a, text, on, catch, burden, up } a permission on attuned thing a
//   { k: "trait", name, own }                  a trait, from the list or written
//                                              (never on a set action: a trait's
//                                              never a step, 27 Oct 2026)
//   { k: "thread", person, text, kind }        a new thread, bond or hostile
//   { k: "title", arch, text, on, perm, permOn } a new archetype and its Title
// "on" lists the set actions a new line goes on. Every set action's steps and
// dice are counted again at the end. A grown line carries g, its entry's place
// in the list, so the gold marks never take it for a rule's change.

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";
import { bondName, threadNote } from "./threads.js";

export const STAGES = ["Awakened", "Tempered", "Perfected"];
const BASE = { Awakened: 1, Tempered: 2, Perfected: 3 };
export const MAX_PERMS = 6;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

// What an attuned thing can hold at its stage, from Attunement's table:
// Awakened 1 and 1 more with a Catch, Tempered 2 and 2 more with a Burden,
// Perfected 3 and 3 more with a Burden and a Catch.
export function attunedRoom(a) {
  const stage = STAGES.includes(a.stage) ? a.stage : "Awakened";
  const base = BASE[stage];
  const needs = stage === "Awakened" ? ["catch"] : stage === "Tempered" ? ["burden"] : ["burden", "catch"];
  return { stage, base, all: base * 2, needs, missing: needs.filter((x) => !a[x]), next: STAGES[STAGES.indexOf(stage) + 1] ?? null, n: a.permissions.length };
}

const both = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");

// What the phone needs to know about a trait besides its words, the same for
// the build (scripts/build-content.mjs), the builder and here: the Aura it
// gives when it fires (Killer Instinct's 1, Battle Focus's 3, Silent Step's
// 1), and whether it only fires the first time each scene, so the play screen
// can tick it off. Unyielding's first Hurt has its own tracker on the wound die.
const SHRUG = /\bfirst (?:(?:two|three) )?Hurts?\b[^.|]*?\b(?:doesn['’]t|don['’]t|does not|do not|won['’]t|never)\b[^.|]*?\b(?:move|put|step|go|raise)/i;
export function traitInfo(text = "") {
  const t = String(text ?? "").replace(/<[^>]+>/g, "");
  return {
    aura: Number(t.match(/\b(?:gain|gives you) (\d+) Aura\b/i)?.[1] ?? 0),
    once: /\bfirst\b[^|]*?\beach scene\b/i.test(t) && !SHRUG.test(t),
  };
}
// A size up, n times, as far as d12.
export const upBy = (die, n) => {
  let d = die;
  for (let i = 0; i < n; i++) d = sizeUp(d);
  return d;
};

export function grow(base, grown, B) {
  if (!base || !Array.isArray(grown) || !grown.length) return base;
  const c = JSON.parse(JSON.stringify(base));
  const rule = new Map((B?.traits ?? []).map((t) => [t.name, t]));
  const ARCH = new Map((B?.archetypes ?? []).map((a) => [a.name, a]));
  const add = (kind, label, extra = {}) => {
    const key = `l${c.lines.length}`;
    c.lines.push({ key, kind, label, ...extra });
    return key;
  };
  const onto = (key, names) => {
    for (const name of Array.isArray(names) ? names : []) {
      const a = c.actions.find((x) => x.name === name);
      if (a && !a.lines.includes(key)) a.lines.push(key);
    }
  };
  const also = (note, name) => (note ? `${note} and ${name}` : name);
  let titled = false;
  for (const [n, g] of grown.entries()) {
    if (!g || typeof g !== "object") continue;
    const text = String(g.text ?? "").trim();
    if (g.k === "perm") {
      const t = c.titles[g.t];
      if (!t || !text || t.permissions.length >= MAX_PERMS) continue;
      const key = add("permission", text, { title: t.name });
      t.permissions.push({ text, key, g: n });
      onto(key, g.on);
    } else if (g.k === "swap") {
      // By its words, or by its place if the rules have reworded it since.
      const t = c.titles[g.t];
      const p = t?.permissions.find((x) => x.text === g.from) ?? (Number.isInteger(g.j) ? t?.permissions[g.j] : null);
      if (!p || !text) continue;
      p.text = text;
      const l = c.lines.find((x) => x.key === p.key);
      if (l) l.label = text;
      for (const a of c.actions) a.lines = a.lines.filter((k) => k !== p.key);
      onto(p.key, g.on);
    } else if (g.k === "att") {
      const a = c.attuned[g.a];
      if (!a) continue;
      if (g.up) a.stage = STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(STAGES.includes(a.stage) ? a.stage : "Awakened") + 1)];
      // At Tempered the Catch becomes the Burden, and Perfected wants a Catch again.
      if (g.burden && !a.burden) {
        a.burden = String(g.burden).trim();
        if (a.stage === "Tempered") a.catch = null;
      }
      if (g.catch && !a.catch) a.catch = String(g.catch).trim();
      if (!text || a.permissions.length >= MAX_PERMS) continue;
      const key = add("attuned", text, { item: a.name });
      a.permissions.push({ text, key, g: n });
      onto(key, g.on);
    } else if (g.k === "trait") {
      const name = String(g.name ?? "").trim();
      if (!name || c.traits.some((t) => t.name === name)) continue;
      const r = g.own ? null : rule.get(name);
      const own = String(g.own?.text ?? "");
      // A trait's never a step, so it never goes on a set action.
      c.traits.push({ name, type: r?.type ?? String(g.own?.type ?? ""), html: r?.html ?? esc(own), ...(r ? { aura: r.aura, once: r.once } : traitInfo(own)), g: n });
      // What the trait changes, the same as the builder counts it.
      const e = r?.effects ?? {};
      const num = c.numbers;
      if (e.aura) num.aura += e.aura;
      // The first Hurt each scene that doesn't move the wound die (Unyielding).
      if (e.shrug) {
        num.shrug = (num.shrug ?? 0) + e.shrug;
        num.woundNote = also(num.woundNote, name);
      }
      if (e.stride) {
        num.stride += e.stride;
        num.strideNote = also(num.strideNote, name);
      }
      if (e.confidence) {
        for (let i = 0; i < e.confidence; i++) num.confidence = sizeUp(num.confidence);
        num.confidenceNote = also(num.confidenceNote, name);
      }
      // Style: clothes that fit start you two sizes up, not one.
      if (e.dressed) num.dressedUp = (num.dressedUp ?? 0) + e.dressed;
      if ((e.confidence || e.dressed) && num.dressed) num.dressed.die = upBy(num.confidence, 1 + (num.dressedUp ?? 0));
      if (e.utility) c.carry.utility.max += e.utility;
      // Tireless: three downtime slots, not two.
      if (e.slots) num.slots = (num.slots ?? 2) + e.slots;
    } else if (g.k === "thread") {
      // Each person's one bond, however their name was typed this time.
      const person = bondName(c.threads.map((x) => x.person), g.person);
      if (!person || !text) continue;
      let p = c.threads.find((x) => x.person === person);
      if (!p) c.threads.push((p = { person, threads: [] }));
      // A thread grown before 26 Oct 2026 has no kind, and it's a bond thread.
      const t = { text, kind: g.kind === "hostile" ? "hostile" : "bond", whose: null, strained: false };
      p.threads.push({ ...t, note: threadNote(t), g: n });
    } else if (g.k === "title") {
      if (!text) continue;
      const t = { name: text, archetype: String(g.arch ?? ""), archetypeId: ARCH.get(g.arch)?.id ?? null, key: add("title", text), permissions: [], g: n };
      c.titles.push(t);
      onto(t.key, g.on);
      const perm = String(g.perm ?? "").trim();
      if (perm) {
        const key = add("permission", perm, { title: t.name });
        t.permissions.push({ text: perm, key, g: n });
        onto(key, g.permOn);
      }
      c.numbers.resolve += 1;
      titled = true;
    }
  }
  // A new archetype brings its mechanic, and one taken again makes its +2 bigger.
  if (titled) {
    const taken = new Map();
    for (const t of c.titles) if (t.archetype) taken.set(t.archetype, (taken.get(t.archetype) ?? 0) + 1);
    c.archetypeRules = [...taken].map(([name, times]) => {
      const r = ARCH.get(name) ?? c.archetypeRules.find((x) => x.name === name) ?? {};
      const bonus = times + 1;
      const aura = r.aura ?? "";
      const auraHtml = r.auraHtml ?? "";
      return {
        name, id: r.id ?? null, times, summary: r.summary ?? "",
        aura: times > 1 && aura ? aura.replace(/\+\d\b/, `+${bonus}`) : aura,
        auraHtml: times > 1 && auraHtml ? auraHtml.replace(/\+\d\b/, `+${bonus}`) : auraHtml,
        bonus: /^\+\d\b/.test(aura) ? bonus : 0,
        resolve: r.resolve ?? "", resolveHtml: r.resolveHtml ?? "",
      };
    });
    const names = [...taken.keys()];
    c.archetypes = names.length === 1 && taken.get(names[0]) > 1 ? [`${names[0]}, ${taken.get(names[0]) === 2 ? "twice" : `${taken.get(names[0])} times`}`] : names;
    if (!c.playsLike) c.playsLike = esc(both(names));
  }
  for (const a of c.actions) {
    a.steps = a.lines.length + 1;
    a.die = diceLabel(stepsToDice(a.steps));
  }
  return c;
}
