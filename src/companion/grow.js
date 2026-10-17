// Growing on the phone. What a character's downtimes add to their sheet is
// kept as a list in their state (state.grown), on top of the sheet the rules
// give them, so the crew's sheets still come straight off the chapter, a
// built character's still come from their build, and a downtime undoes like
// anything else. Each entry adds one thing:
//   { k: "perm", t, text, on }                 a permission on Title t
//   { k: "swap", t, from, text, on }           a permission swapped for another
//   { k: "att", a, text, on, catch, burden, up } a permission on attuned thing a
//   { k: "trait", name, on, own }              a trait, from the list or written
//   { k: "thread", person, text }              a new thread
//   { k: "title", arch, text, on, perm, permOn } a new archetype and its Title
// "on" lists the set actions a new line goes on. Every set action's steps and
// dice are counted again at the end.

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";

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
  for (const g of grown) {
    if (!g || typeof g !== "object") continue;
    const text = String(g.text ?? "").trim();
    if (g.k === "perm") {
      const t = c.titles[g.t];
      if (!t || !text || t.permissions.length >= MAX_PERMS) continue;
      const key = add("permission", text, { title: t.name });
      t.permissions.push({ text, key });
      onto(key, g.on);
    } else if (g.k === "swap") {
      const t = c.titles[g.t];
      const p = t?.permissions.find((x) => x.text === g.from);
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
      a.permissions.push({ text, key });
      onto(key, g.on);
    } else if (g.k === "trait") {
      const name = String(g.name ?? "").trim();
      if (!name || c.traits.some((t) => t.name === name)) continue;
      const r = g.own ? null : rule.get(name);
      const own = String(g.own?.text ?? "");
      const step = r ? r.step : /\+1 step\b/.test(own);
      const key = add("trait", name, { step });
      c.traits.push({ name, type: r?.type ?? String(g.own?.type ?? ""), html: r?.html ?? esc(own), step, aura: r ? r.aura : Number(own.match(/\bGain (\d+) Aura\b/)?.[1] ?? 0), key });
      if (step) onto(key, g.on);
      // What the trait changes, the same as the builder counts it.
      const e = r?.effects ?? {};
      const n = c.numbers;
      if (e.aura) n.aura += e.aura;
      if (e.hurtBars) {
        n.hurtBars += e.hurtBars;
        n.hurtNote = also(n.hurtNote, name);
      }
      if (e.stride) {
        n.stride += e.stride;
        n.strideNote = also(n.strideNote, name);
      }
      if (e.confidence) {
        for (let i = 0; i < e.confidence; i++) n.confidence = sizeUp(n.confidence);
        n.confidenceNote = also(n.confidenceNote, name);
        if (n.dressed) n.dressed.die = sizeUp(n.confidence);
      }
      if (e.utility) c.carry.utility.max += e.utility;
    } else if (g.k === "thread") {
      const person = String(g.person ?? "").trim();
      if (!person || !text) continue;
      let p = c.threads.find((x) => x.person === person);
      if (!p) c.threads.push((p = { person, threads: [] }));
      p.threads.push({ text, note: null, debt: false });
    } else if (g.k === "title") {
      if (!text) continue;
      const t = { name: text, archetype: String(g.arch ?? ""), archetypeId: ARCH.get(g.arch)?.id ?? null, key: add("title", text), permissions: [] };
      c.titles.push(t);
      onto(t.key, g.on);
      const perm = String(g.perm ?? "").trim();
      if (perm) {
        const key = add("permission", perm, { title: t.name });
        t.permissions.push({ text: perm, key });
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
