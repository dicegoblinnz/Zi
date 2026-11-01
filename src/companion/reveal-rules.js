// What the crew's just been shown of the factions (stage 3 of
// notes/faction-feel-plan.md), worked out from the board before and after as
// forPlayer() in board.js made it, so it's only ever what they've been shown.
// reveal.js puts it on a crew phone as a sheet, and the Worker hands the
// table screen the same (src/worker/world.js, then screenOf() in
// table-rules.js), which never gets a faction's id.
//
// A reveal: { f, name, seal, part, title, lines }
//   f       the faction's id (the phone's, for Its page. Never the screen's.)
//   part    "card" (the crew's met it: its name, what it is, Want and Face),
//           or one of PARTS in board.js
//   lines   what it says, a line each: { label, text, big }, big being a
//           Secret's tag
import { BONDS, PARTS, stepsOf } from "./board.js";
import { diceLabel, stepsToDice } from "./dice.js";

export const REVEAL = { items: 8, lines: 8, text: 240 };
// How far off an agenda is, by its die, the way the board says it.
const AGO = { 2: "years off", 4: "a season or more away", 6: "a month or two away", 8: "a week or two away", 10: "days away", 12: "any day now" };
const TITLES = { power: "Power", res: "resources", assets: "other assets", agenda: "agendas", bonds: "bonds", threads: "threads", secret: "Secret" };
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "").trim();
const cut = (t) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, REVEAL.text);
const poss = (name) => `${bare(name)}’s`;
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

// What one part says, a line each, from the faction as the crew has it.
function linesOf(f, part, names) {
  const out = [];
  const add = (label, text, big = false) => {
    if (cut(text)) out.push({ label, text: cut(text), big });
  };
  const times = (x) => (x?.x > 1 ? ` ×${x.x}` : "");
  switch (part) {
    case "card":
      add("What it is", f.about);
      add("Want", f.want);
      add("Face", f.face);
      break;
    case "power": {
      const from = (f.assets ?? []).filter((a) => a.power && !a.off).map((a) => `${a.text}${times(a)}`);
      add("Power", `${diceLabel(stepsToDice(stepsOf(f)))}${from.length ? `, from ${andList(from)}` : ""}`);
      break;
    }
    case "res":
      for (const r of f.res ?? []) add("", `${r.text}${times(r)}`);
      break;
    case "assets":
      for (const a of (f.assets ?? []).filter((x) => !x.power)) add("", `${a.text}${times(a)}${a.does ? `: ${a.does}` : ""}`);
      break;
    case "agenda":
      for (const a of f.agendas ?? []) add("", a.done ? `${bare(a.text)}. It’s happened.` : `${bare(a.text)}, ${AGO[a.die] ?? `at d${a.die}`}`);
      break;
    case "bonds":
      for (const [l, label] of BONDS) for (const t of f[l] ?? []) add(label, t.text);
      break;
    case "threads":
      for (const t of f.threads ?? []) add(t.to === "crew" ? "Toward the crew" : names.get(t.to) ? `Toward ${names.get(t.to)}` : "", t.text);
      break;
    case "secret":
      add("", f.secret, true);
      add("", f.more);
      break;
  }
  return out.slice(0, REVEAL.lines);
}

// Everything the crew's been shown since was, a faction at a time: its card
// first, then each part in the board's order. A mini faction of the crew's
// own isn't news to them, since they made it.
export function revealsOf(was, now) {
  if (!was?.factions || !now?.factions) return [];
  const before = new Map(was.factions.map((f) => [f.id, f]));
  const names = new Map(now.factions.map((f) => [f.id, bare(f.name)]));
  const out = [];
  for (const f of now.factions) {
    if (f.parent === "crew") continue;
    const b = before.get(f.id);
    const parts = [...(b ? [] : ["card"]), ...PARTS.filter((p) => f.shown?.[p] && !b?.shown?.[p])];
    for (const part of parts) {
      const lines = linesOf(f, part, names);
      // A part with nothing in it yet isn't worth a moment.
      if (part !== "card" && !lines.length) continue;
      out.push({ f: f.id, name: bare(f.name), seal: f.seal ? { c: f.seal.c, f: f.seal.f, d: f.seal.d ?? "" } : null, part, title: part === "card" ? bare(f.name) : `${poss(f.name)} ${TITLES[part]}`, lines });
    }
  }
  return out.slice(0, REVEAL.items);
}

// The parts as the sheet's line under the name says them, in a sentence.
export const PART_SAID = { card: "who they are", power: "its Power", res: "its resources", assets: "its other assets", agenda: "its agendas", bonds: "its bonds", threads: "its threads", secret: "its Secret" };
