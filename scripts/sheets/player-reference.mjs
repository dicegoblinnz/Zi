// The player reference: Appendix D in Mo's words, four A4 pages in the kit's
// Paper theme. The table's most-used rules come first: the round and rolling,
// then the tracks and defence, then Aura and the archetypes, then your
// character, threats and gear. Each page is one part, and each part
// takes sections of Appendix D by id, whole or with some of their bullets, so
// the reference never says anything the quick reference doesn't. A few are
// drawn with the kit as well as said: the round as its three steps, the steps
// ladder with the dice in their shapes, Stamina, Confidence and Resolve as
// tracks, Aura's spends and gains side by side, and each archetype with its sigil.
// A section that's new to Appendix D stops the build until it's given a part
// (or left out on purpose), so nothing gets missed, and a page that's too
// full stops it too (scripts/build-sheets.mjs says by how much).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { ROOT } from "./sources.mjs";
import { die, mini, crest, aura, SIGILS, SIZES } from "../../src/kit/kit.js";
import { stepsToDice, diceLabel } from "../../src/companion/dice.js";

const SOURCE = "content/rules/33-appendix-d-quick-reference.md";

// A page's blocks: a flow of sections in two columns, or a panel across the
// page. In a flow, only keeps just the bullets that start like this, drop
// leaves these out, and table: false leaves out the section's table (it's
// drawn as a panel instead).
const PAGES = [
  {
    title: "The round and rolling",
    short: "Round and rolling",
    blocks: [
      { panel: "round", id: "s-qr-round" },
      { flow: [{ id: "s-qr-action", drop: ["**Combo:**"] }, { id: "building-the-die", table: false }] },
      { panel: "ladder", id: "building-the-die" },
      { flow: [{ id: "the-roll" }, { id: "intents" }, { id: "s-qr-action", heading: "Combos", only: ["**Combo:**"] }, { id: "moving" }] },
    ],
  },
  {
    title: "The tracks and defence",
    short: "Tracks and defence",
    blocks: [
      { panel: "tracks", ids: ["s-qr-tracks"] },
      { flow: [{ id: "s-qr-tracks" }, { id: "telegraphs-and-defence" }, { id: "consequences-the-gm-names-one" }, { id: "conditions" }] },
    ],
  },
  {
    title: "Aura, archetypes and threads",
    short: "Aura and archetypes",
    blocks: [
      { panel: "economy", ids: ["aura"] },
      { panel: "archetypes", id: "s-qr-archetypes" },
      { flow: [{ id: "s-qr-threads" }] },
    ],
  },
  {
    title: "Your character, downtime, threats and gear",
    short: "Character and threats",
    blocks: [
      { flow: [
        { id: "your-character" },
        { id: "stakes-clocks-events", heading: "Things that climb", only: ["Things that climb"] },
        { id: "s-qr-downtime" },
        { id: "s-qr-threats", drop: ["**Round budget:**", "**Threat budget:**"] },
        { id: "study" },
        { id: "stakes-clocks-events", drop: ["Things that climb"] },
        { id: "s-qr-carry" },
        { id: "s-qr-summoning" },
      ] },
    ],
  },
];
// The GM's side of things, which lives on the party sheet and in the GM's chapters.
const LEFT_OUT = ["s-qr-factions", "s-qr-session", "the-oracle"];

// Each section, by id. The panels and the bullet picks read a list as one
// line to an item, so once a section's list starts, every line has to be an
// item or a table row: a wrapped bullet or a paragraph after the list stops
// the build rather than going missing from the reference.
const listLine = (line) => /^(-|\d+\.)\s+/.test(line);
function sections() {
  const text = readFileSync(join(ROOT, SOURCE), "utf8").replace(/\r\n/g, "\n");
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  const body = text.slice(front[0].length);
  const found = new Map();
  const parts = body.split(/^## /m).slice(1);
  for (const part of parts) {
    const [first, ...rest] = part.split("\n");
    const m = first.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
    if (!m) throw new Error(`Appendix D: can't read the heading "${first}"`);
    const lines = rest.filter((l) => l.trim());
    const start = lines.findIndex(listLine);
    const odd = start < 0 ? null : lines.slice(start).find((l) => !listLine(l) && !l.startsWith("|"));
    if (odd) throw new Error(`Appendix D, ${m[1]}: the player reference reads each item in a list as one line, and "${odd.trim().slice(0, 50)}…" isn't one. Join it onto its item, or give it a place in scripts/sheets/player-reference.mjs.`);
    found.set(m[2], { heading: m[1], body: rest.join("\n").trim() });
  }
  return found;
}

const bullet = (line) => (/^-\s+/.test(line) ? line.replace(/^-\s+/, "") : null);
function pick(section, { only, drop, table = true }) {
  let lines = section.body.split("\n");
  if (!table) {
    if (!lines.some((l) => l.startsWith("|"))) throw new Error(`Appendix D, ${section.heading}: there's no table to draw any more`);
    lines = lines.filter((l) => !l.startsWith("|"));
  }
  if (!only && !drop) return lines.join("\n").trim();
  for (const want of [...(only || []), ...(drop || [])]) {
    if (!lines.some((l) => bullet(l)?.startsWith(want))) throw new Error(`Appendix D, ${section.heading}: no bullet starts "${want}" any more`);
  }
  return lines
    .filter((l) => {
      const b = bullet(l);
      if (b === null) return !only;
      if (only) return only.some((p) => b.startsWith(p));
      return !drop.some((p) => b.startsWith(p));
    })
    .join("\n")
    .trim();
}

// Links point at the rules, which aren't in the PDF, so keep just their words.
const unlink = () => (tree) => {
  visit(tree, "link", (node, index, parent) => {
    parent.children.splice(index, 1, ...node.children);
    return [SKIP, index];
  });
};
const markdown = unified().use(remarkParse).use(remarkGfm).use(unlink).use(remarkSmartypants).use(remarkRehype).use(rehypeStringify);
const render = (md) => String(markdown.processSync(md));
const inline = (md) => render(md).trim().replace(/^<p>([\s\S]*)<\/p>$/, "$1");

// ── The panels

// The round: its numbered steps, side by side.
function round(section) {
  const lines = section.body.split("\n").filter((l) => l.trim());
  if (lines.some((l) => !/^\d+\.\s+/.test(l)) || lines.length < 2) throw new Error(`Appendix D, ${section.heading}: the round's drawn as its numbered steps, and it isn't only a numbered list any more`);
  const steps = lines.map((l) => l.replace(/^\d+\.\s+/, ""));
  return `<section class="panel"><div class="cap"><h2>${section.heading}</h2></div><div class="round">${steps.map((s, i) => `<div><span class="n">${i + 1}</span><p>${inline(s)}</p></div>`).join("")}</div></section>`;
}

// Steps into dice: Appendix D's table, drawn with the dice, and checked
// against the companion's own table (src/companion/dice.js) so they can't differ.
function ladder(section) {
  const rows = section.body.split("\n").filter((l) => /^\|\s*\d/.test(l)).map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
  if (!rows.length) throw new Error(`Appendix D, ${section.heading}: there's no steps table to draw`);
  const cells = rows.map(([steps, dice]) => {
    const n = parseInt(steps, 10);
    const want = stepsToDice(n);
    if (diceLabel(want).replace(/\s/g, "") !== dice.replace(/\s/g, "")) throw new Error(`Appendix D says ${n} steps is ${dice}, but the steps table in src/companion/dice.js makes it ${diceLabel(want)}. Fix whichever's wrong.`);
    return `<div><b>${n}</b><small>${n === 1 ? "step" : "steps"}</small><span class="shapes${want.length > 2 ? " many" : ""}">${want.map((d) => mini(d)).join("")}</span><span>${dice.replace(/\s/g, "")}</span></div>`;
  });
  return `<section class="panel"><div class="cap"><h2>Steps into dice</h2></div><div class="steps-ladder">${cells.join("")}</div></section>`;
}

// Stamina, Confidence and Resolve, as the tracks they move along: d12 down
// to d2, and the Blaze past it. The words come from the bullets below them.
function tracks(section) {
  for (const text of ["**Stamina** (Body), **Confidence** (Mind) and **Resolve** (Soul)", "Each starts at d12", "**Blaze:**", "a 4 or more puts it up a size"]) {
    if (!section.body.includes(text)) throw new Error(`Appendix D, ${section.heading}: the tracks panel's labels come from "${text}", which isn't there any more`);
  }
  const row = (name, root) => {
    const dice = [...SIZES].reverse().map((d) => `<div>${die(d, { own: "harm", hide: true })}<span>${d === 12 ? "starts here" : ""}</span></div>`).join("");
    return `<div class="side"><div class="cap"><h2>${name}</h2><p>${root}</p></div><div class="trk">${dice}<div class="end"><b>Blaze</b><span>a hit at d2</span></div></div></div>`;
  };
  return `<section class="panel track-panel">${row("Stamina", "Body")}${row("Confidence", "Mind")}${row("Resolve", "Soul")}</section>`;
}

// Aura: what one buys and how it comes back, side by side.
function economy(sectionsFound) {
  const icon = { aura: svgOf(aura(1, 1)) };
  return `<section class="panel econ">${sectionsFound.map(([id, section]) => {
    const lines = section.body.split("\n").filter((l) => l.trim());
    if (lines.some((l) => bullet(l) === null)) throw new Error(`Appendix D, ${section.heading}: the panel for Aura reads bullets only, and this section has something else in it now`);
    const items = lines.map(bullet);
    const spend = items.find((b) => b.startsWith("**Spend 1:**"));
    const get = items.find((b) => b.startsWith("**Get 1 back:**"));
    if (!spend || !get) throw new Error(`Appendix D, ${section.heading}: there's no "Spend 1" or "Get 1 back" bullet any more`);
    if (items.indexOf(get) !== items.indexOf(spend) + 1) throw new Error(`Appendix D, ${section.heading}: "Get 1 back" has to come straight after "Spend 1", since they're drawn side by side`);
    const list = (b, lead) => `<ul>${b.slice(lead.length).trim().replace(/\.$/, "").split(" · ").map((x) => `<li>${inline(x.charAt(0).toUpperCase() + x.slice(1))}</li>`).join("")}</ul>`;
    const before = items.slice(0, items.indexOf(spend)).map((b) => `<p>${inline(b)}</p>`).join("");
    const after = items.slice(items.indexOf(get) + 1).map((b) => `<p>${inline(b)}</p>`).join("");
    return `<section class="qr"><h2>${icon[id] || ""}${section.heading}</h2>${before}<div class="lists"><div><h3>Spend 1</h3>${list(spend, "**Spend 1:**")}</div><div><h3>Get 1 back</h3>${list(get, "**Get 1 back:**")}</div></div>${after}</section>`;
  }).join("")}</section>`;
}
const svgOf = (html) => html.match(/<svg[\s\S]*<\/svg>/)[0];

// The archetypes: each one's crest, its name and what it does.
function archetypes(section) {
  const lines = section.body.split("\n");
  const intro = lines.filter((l) => l.trim() && bullet(l) === null).join("\n");
  const list = lines.map(bullet).filter(Boolean).map((b) => {
    const m = b.match(/^\*\*([^*:]+):\*\*\s*([\s\S]*)$/);
    if (!m) throw new Error(`Appendix D, ${section.heading}: can't read "${b.slice(0, 40)}…" as an archetype`);
    if (!Object.hasOwn(SIGILS, m[1])) throw new Error(`The kit has no sigil for the ${m[1]} archetype. Draw one in src/kit/sigils.js.`);
    return `<div class="arch">${crest([m[1]], { size: "sm", label: m[1] })}<p><strong>${m[1]}:</strong> ${inline(m[2])}</p></div>`;
  });
  return `<section class="panel qr"><h2>${section.heading}</h2>${render(intro)}<div class="archs">${list.join("")}</div></section>`;
}

function flowOf(found, list, used) {
  return `<div class="flow">${list.map((s) => {
    const section = found.get(s.id);
    if (!section) throw new Error(`Appendix D has no section #${s.id} any more`);
    used.add(s.id);
    return `<section class="qr"><h2>${s.heading || section.heading}</h2>${render(pick(section, s))}</section>`;
  }).join("")}</div>`;
}

export function playerReference(stamp) {
  const found = sections();
  const used = new Set();
  const get = (id) => {
    const section = found.get(id);
    if (!section) throw new Error(`Appendix D has no section #${id} any more`);
    used.add(id);
    return section;
  };
  const pages = PAGES.map((page, n) => {
    const blocks = page.blocks.map((b) => {
      if (b.flow) return flowOf(found, b.flow, used);
      if (b.panel === "round") return round(get(b.id));
      if (b.panel === "ladder") return ladder(get(b.id));
      if (b.panel === "tracks") return tracks(...b.ids.map(get));
      if (b.panel === "economy") return economy(b.ids.map((id) => [id, get(id)]));
      if (b.panel === "archetypes") return archetypes(get(b.id));
      throw new Error(`the player reference has no panel called ${b.panel}`);
    }).join("\n");
    const nav = PAGES.map((p, i) => `<li${i === n ? ' class="here" aria-current="page"' : ""}><b>${i + 1}</b>${p.short}</li>`).join("");
    return `<section class="page">
  <header class="ref-head">${crest([], { size: "sm", label: "Zi’Dara" })}<div><div class="wordmark">Zi’Dara</div><div class="doc">Player reference</div></div><ol class="parts">${nav}</ol></header>
  <h1><span class="num">${n + 1}</span>${page.title}</h1>
  ${blocks}
  <footer class="stamp"><span>Every rule’s there in full at zidara.world/rules</span><span>${stamp} · page ${n + 1} of ${PAGES.length}</span></footer>
</section>`;
  });
  const missing = [...found.keys()].filter((id) => !used.has(id) && !LEFT_OUT.includes(id));
  if (missing.length) throw new Error(`Appendix D has sections the player reference doesn't place: ${missing.join(", ")}. Give each a part in scripts/sheets/player-reference.mjs, or add it to LEFT_OUT.`);
  return `<style>@page { size: A4; margin: 0; }</style><main class="ref">${pages.join("\n")}</main>`;
}

export const REFERENCE_PAGES = PAGES.length;
