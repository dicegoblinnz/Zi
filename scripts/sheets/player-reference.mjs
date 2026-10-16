// The player reference: Appendix D in Mo's words, in the four parts Appendix A
// lists, as a plain A4 PDF. Each part takes sections of Appendix D by id, whole
// or with some of their bullets, so the reference never says anything the
// quick reference doesn't. A section that's new to Appendix D stops the build
// until it's given a part (or left out on purpose), so nothing gets missed.
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

const SOURCE = "content/rules/33-appendix-d-quick-reference.md";

// only: keep just the bullets that start like this · drop: leave these out.
const PARTS = [
  {
    title: "Making and growing a character",
    sections: [
      { id: "your-character" },
      { id: "stakes-clocks-events", heading: "Things that climb", only: ["Things that climb"] },
      { id: "s-qr-downtime" },
      { id: "s-qr-threads" },
      { id: "s-qr-confidence" },
      { id: "s-qr-hurt" },
    ],
  },
  {
    title: "Archetypes, Aura and the round",
    sections: [
      { id: "s-qr-archetypes" },
      { id: "aura" },
      { id: "s-qr-resolve" },
      { id: "s-qr-round" },
      { id: "s-qr-action", drop: ["**Combo:**"] },
      { id: "telegraphs-and-defence" },
      { id: "consequences-the-gm-names-one" },
      { id: "conditions" },
    ],
  },
  {
    title: "Rolling",
    sections: [
      { id: "building-the-die" },
      { id: "the-roll" },
      { id: "intents" },
      { id: "s-qr-action", heading: "Combos", only: ["**Combo:**"] },
    ],
  },
  {
    title: "Threats, moving and gear",
    sections: [
      { id: "moving" },
      { id: "s-qr-threats", drop: ["**Round budget:**", "**Threat budget:**"] },
      { id: "study" },
      { id: "stakes-clocks-events", drop: ["Things that climb"] },
      { id: "s-qr-chases" },
      { id: "s-qr-carry" },
      { id: "s-qr-summoning" },
    ],
  },
];
// The GM's side of things, which lives on the party sheet and in the GM's chapters.
const LEFT_OUT = ["s-qr-factions", "s-qr-session", "the-oracle"];

function sections() {
  const text = readFileSync(join(ROOT, SOURCE), "utf8").replace(/\r\n/g, "\n");
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  const updated = front[1].match(/^updated:\s*(\S+)/m)?.[1];
  const body = text.slice(front[0].length);
  const found = new Map();
  const parts = body.split(/^## /m).slice(1);
  for (const part of parts) {
    const [first, ...rest] = part.split("\n");
    const m = first.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
    if (!m) throw new Error(`Appendix D: can't read the heading "${first}"`);
    found.set(m[2], { heading: m[1], body: rest.join("\n").trim() });
  }
  return { found, updated };
}

function pick(section, { only, drop }) {
  if (!only && !drop) return section.body;
  const lines = section.body.split("\n");
  const bullet = (line) => /^-\s+/.test(line) ? line.replace(/^-\s+/, "") : null;
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

export function playerReference(stamp) {
  const { found } = sections();
  const used = new Set();
  const html = PARTS.map((part, p) => {
    const body = part.sections.map((s) => {
      const section = found.get(s.id);
      if (!section) throw new Error(`Appendix D has no section #${s.id} any more`);
      used.add(s.id);
      return `<section class="qr"><h3>${s.heading || section.heading}</h3>${render(pick(section, s))}</section>`;
    }).join("");
    return `<section class="part"><h2><span class="num">${p + 1}</span>${part.title}</h2><div class="cols">${body}</div></section>`;
  }).join("");
  const missing = [...found.keys()].filter((id) => !used.has(id) && !LEFT_OUT.includes(id));
  if (missing.length) throw new Error(`Appendix D has sections the player reference doesn't place: ${missing.join(", ")}. Give each a part in scripts/sheets/player-reference.mjs, or add it to LEFT_OUT.`);

  const box = "font: 400 6.5pt/1 var(--body); color: var(--muted); vertical-align: top; padding-top: 3.5mm;";
  const style = `@page { size: A4; margin: 11mm 12mm 13mm; @bottom-left { content: "zidara.world/sheets"; ${box} } @bottom-right { content: "${stamp} · page " counter(page) " of " counter(pages); ${box} } }`;
  return `<style>${style}</style>
<main class="ref">
  <header class="ref-head">
    <div class="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 38 20 20 38 2 20z" fill="none" stroke="#5b36b0" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 12 28 20 20 28 12 20z" fill="#d7ae4b"/></svg><div><div class="wordmark">Zi’Dara</div><div class="doc">Player reference</div></div></div>
    <p class="intro">The quick reference from the rules, for the table. Every rule’s there in full at zidara.world/rules.</p>
  </header>
  ${html}
</main>`;
}

export function appendixDUpdated() {
  return sections().updated;
}
