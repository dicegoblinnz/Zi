// Turn the rules master (content/) into the data the website is built from.
//
// Every chapter's Markdown becomes HTML here, with the book's own rules:
//   ## Heading {#id}            a heading with a fixed id
//   :::example[Title]{#id} … :::  boxes (example, rule, note, quote, sheet,
//                                  threat, place, sheet-fields, index-section)
//   [text](#id)                 a link to any id in the book, rewritten to
//                                the page that holds it
// It writes src/generated/book.json and copies the figures into public/.
// For reading on a phone it also cuts each chapter into short sections, builds
// the Learn deck (content/learn.md) and writes public/openings.json, the
// opening of every section a link points at, for the pop-ups.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkSmartypants from "remark-smartypants";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { diceLabel, stepsToDice } from "../src/companion/dice.js";
import { threadNote } from "../src/companion/threads.js";
import { curlyQuotes, readAim, whoAndDoes } from "../src/companion/aims.js";
import { CARD_WORDS, newestChange, reachOf, readCards, staleCards } from "./learn.mjs";
import { bookFor, compileTables, readTablesDir } from "./world-tables.mjs";
import { checkYears, compileWorld, readWorldsDir } from "./worlds.mjs";
import { sealIn, sealKey } from "../src/kit/seals.js";
import { diceCells, exampleCrews, ruleNames, statBlocks } from "./book-blocks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RULES = join(ROOT, "content", "rules");

const BOXES = {
  example: "Example",
  rule: "Rule",
  note: "Note",
  quote: null,
  sheet: "",
  threat: "Threat",
  place: "Place",
};
const PLAIN_BLOCKS = new Set(["sheet-fields", "index-section"]);

function readDoc(path) {
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? { meta: parseYaml(m[1]) ?? {}, body: text.slice(m[0].length) } : { meta: {}, body: text };
}

// Which page holds each id, so links can cross pages.
function collectIds(docs) {
  const where = new Map();
  for (const doc of docs) {
    where.set(doc.meta.id, { page: doc.path, own: true });
    for (const m of doc.body.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)) where.set(m[1], { page: doc.path, own: false });
  }
  return where;
}

function headingIds() {
  return (tree) => {
    visit(tree, "heading", (node) => {
      const last = node.children[node.children.length - 1];
      if (!last || last.type !== "text") return;
      const m = last.value.match(/\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
      if (!m) return;
      last.value = last.value.slice(0, m.index);
      node.data = { ...(node.data || {}), hProperties: { ...(node.data?.hProperties || {}), id: m[1] } };
    });
  };
}

function boxes() {
  return (tree, file) => {
    // Inline and leaf directives only happen by accident (a stray colon):
    // put the original text back.
    visit(tree, (node, index, parent) => {
      if ((node.type === "textDirective" || node.type === "leafDirective") && parent) {
        const src = String(file.value).slice(node.position.start.offset, node.position.end.offset);
        parent.children.splice(index, 1, { type: "text", value: src });
        return [SKIP, index + 1];
      }
    });
    visit(tree, "containerDirective", (node) => {
      const id = node.attributes?.id;
      const known = node.name in BOXES;
      const className = known ? ["box", `box-${node.name}`] : [node.name];
      if (!known && !PLAIN_BLOCKS.has(node.name)) file.message(`Unknown box :::${node.name}`, node);
      node.data = { hName: "div", hProperties: id ? { id, className } : { className } };
      const first = node.children[0];
      const label = first?.data?.directiveLabel ? first.children : null;
      if (label) node.children.shift();
      const kind = BOXES[node.name];
      if (known && kind !== null && (label || kind)) {
        const head = [];
        if (kind) head.push({ type: "emphasis", data: { hName: "span", hProperties: { className: ["box-kind"] } }, children: [{ type: "text", value: kind }] });
        if (label) head.push({ type: "strong", data: { hName: "span", hProperties: { className: ["box-name"] } }, children: label });
        node.children.unshift({ type: "paragraph", data: { hProperties: { className: ["box-label"] } }, children: head });
      }
    });
  };
}

function links(where, pageFor, thisPage) {
  return (tree, file) => {
    visit(tree, "link", (node) => {
      if (!node.url.startsWith("#")) return;
      const id = node.url.slice(1);
      const target = where.get(id);
      if (!target) {
        file.message(`Broken link #${id}`, node);
        return;
      }
      if (target.page === thisPage) return;
      node.url = target.own ? pageFor.get(target.page) : `${pageFor.get(target.page)}#${id}`;
    });
    visit(tree, "image", (node) => {
      if (node.url.startsWith("../figures/")) node.url = `/figures/${node.url.split("/").pop()}`;
    });
  };
}

function wrapTables() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "table" || !parent || parent.properties?.className?.includes("table-wrap")) return;
      parent.children[index] = { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [node] };
      return SKIP;
    });
  };
}

// A chapter comes back cut into sections, with the openings of the sections
// in it that links point at (look) when it's one of the chapters, and what
// its contents page shows (hub). Places, threats and sheets are drawn as
// their parts (scripts/book-blocks.mjs), with what each tag does (blocks).
function render(doc, where, pageFor, look = null, { blocks = {}, crew = [] } = {}) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(boxes)
    .use(headingIds)
    .use(statBlocks, blocks)
    .use(links, where, pageFor, doc.path)
    .use(remarkSmartypants)
    .use(remarkRehype)
    .use(wrapTables)
    .use(diceCells)
    .use(ruleNames)
    .use(exampleCrews, crew)
    .use(rehypeStringify, { allowDangerousHtml: true });
  const file = processor.processSync({ value: doc.body, path: doc.path });
  for (const msg of file.messages) console.warn(`  ${doc.file}: ${msg.message}`);
  const headings = [];
  const tree = processor.runSync(processor.parse({ value: doc.body, path: doc.path }), { value: doc.body, path: doc.path });
  visit(tree, "element", (node) => {
    if (node.tagName === "h2" && node.properties?.id) headings.push({ id: node.properties.id, text: textOf(node) });
  });
  if (!look) return { html: String(file), headings, warnings: file.messages.length };
  const toHtml = (nodes) => processor.stringify({ type: "root", children: nodes });
  const openings = openingsOf(tree, look, toHtml);
  const minutes = Math.max(1, Math.round(textOf(tree).split(/\s+/).filter(Boolean).length / 230));
  const sections = sectioned(tree);
  const hub = hubOf(tree, file.data.places ?? {}, blocks.places, toHtml);
  return { html: processor.stringify(tree), headings, sections, openings, hub: { ...hub, minutes }, tags: file.data.tags ?? {}, warnings: file.messages.length };
}

// Look-up pages: every h2 and h3 at the top of a chapter starts a <section>
// that runs to the next one, with the heading in a row beside its bookmark
// (src/reading/lookup.js). It hands back the list the strip's contents show.
const cls = (node) => node?.properties?.className ?? [];
const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const ribbon = () => el("svg", { className: ["rs-ribbon"], viewBox: "0 0 24 24", width: 22, height: 22, ariaHidden: "true", focusable: "false" }, [
  el("path", { d: "M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.25L6 21V4.5a1 1 0 0 1 1-1z" }),
]);
function sectioned(tree) {
  const out = [];
  const list = [];
  const lead = [];
  let h2 = null;
  let h3 = null;
  for (const node of tree.children) {
    const level = node.type === "element" && node.properties?.id ? { h2: 2, h3: 3 }[node.tagName] : undefined;
    if (!level) {
      if (h3) h3.children.push(node);
      else if (h2) h2.children.push(node);
      else if (!out.length) lead.push(node);
      else out.push(node);
      continue;
    }
    const id = node.properties.id;
    const text = textOf(node).trim();
    list.push({ id, text, level });
    const mark = el("button", { type: "button", className: ["rs-mark"], dataMark: id, ariaPressed: "false", ariaLabel: `Bookmark ${text}` }, [ribbon()]);
    const section = el("section", { className: ["rs", `rs-${level}`], dataS: id }, [el("div", { className: ["rs-head"] }, [node, mark])]);
    if (level === 2) {
      h2 = section;
      h3 = null;
      out.push(section);
    } else {
      h3 = section;
      (h2 ? h2.children : out).push(section);
    }
  }
  // What comes before the first heading is the chapter's opening, its own
  // page in the reader (src/reading/lookup.js). A chapter with no headings
  // (the glossary, the index) is left as it is.
  const opens = lead.some((n) => n.type === "element");
  tree.children = out.length && opens ? [el("section", { className: ["rs", "rs-open"], id: "opening", dataS: "opening", ariaLabel: "Opening" }, lead), ...out] : [...lead, ...out];
  return list;
}

// A chapter's contents page: its opening's quote and first paragraph, and a
// row for every section, with its first sentence and what's in it (its
// subsections, or the threats and sheets in it), and for a place, its d20
// number, the die of its Challenge and who's there. The opening's a row of
// its own when there's more to it than the contents page shows.
const clip = (s, n = 150) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")}…` : s);
function hubOf(tree, placeCards, d20 = new Map(), toHtml) {
  const rows = [];
  let opening = null;
  const nameOfBox = (n) => textOf(n.children.find((c) => cls(c).includes("box-label"))?.children.find((c) => cls(c).includes("box-name")) ?? { children: [] }).trim();
  const firstLine = (sec) => {
    for (const n of sec.children) {
      if (n.type !== "element" || cls(n).includes("rs-head")) continue;
      if (n.tagName === "p") {
        const t = textOf(n).replace(/\s+/g, " ").trim();
        if (t) return clip(firstSentence(t));
        continue;
      }
      break;
    }
    return "";
  };
  for (const sec of tree.children) {
    if (sec.type !== "element" || sec.tagName !== "section") continue;
    if (cls(sec).includes("rs-open")) {
      opening = sec;
      continue;
    }
    const id = sec.properties.dataS;
    const title = textOf(sec.children[0]?.children?.[0] ?? { children: [] }).trim();
    const subs = sec.children.filter((n) => n.tagName === "section").map((s) => textOf(s.children[0]?.children?.[0] ?? { children: [] }).trim());
    const named = [];
    visit(sec, "element", (n) => {
      if (isBox(n) && (cls(n).includes("box-threat") || cls(n).includes("box-sheet"))) {
        const name = nameOfBox(n);
        if (name) named.push(name);
      }
    });
    const card = placeCards[id];
    rows.push({
      id, title, level: cls(sec).includes("rs-3") ? 3 : 2,
      first: card ? curly(d20.get(id)?.line ?? "") : firstLine(sec),
      subs: subs.length ? subs : named,
      place: card ? { n: card.n, d: card.ch * 2, who: card.who.map((w) => curly(w)) } : null,
    });
  }
  let quote = "";
  let lead = "";
  let more = false;
  if (opening) {
    const blocks = opening.children.filter((n) => n.type === "element");
    const q = blocks[0] && cls(blocks[0]).includes("box-quote") ? blocks.shift() : null;
    if (q) quote = textOf(q).replace(/\s+/g, " ").trim();
    if (blocks[0]?.tagName === "p") lead = toHtml([blocks.shift()]).trim();
    more = blocks.length > 0;
    // All of it's on the contents page, so the reader leaves it out.
    if (!more) opening.properties.dataSkip = "true";
  }
  return { quote, lead, opening: more, rows };
}

// Pop-ups: the opening of every section a link in the book points at, up to
// its first example, table or subheading, six paragraphs at most, the way the
// companion's rules on tap work. A rule or note box is part of the rule, so
// it's kept without its box, and a quote's skipped. Each one's keyed by the
// address a link to it has, with its own links made whole and its ids taken
// off, since it's shown on other pages.
const isHeading = (n) => /^h[1-6]$/.test(n.tagName);
const isBox = (n) => n.tagName === "div" && cls(n).includes("box");
function openingBlocks(nodes) {
  const out = [];
  for (const n of nodes) {
    if (n.type !== "element" || cls(n).includes("box-label") || cls(n).includes("box-quote")) continue;
    if (isBox(n) && (cls(n).includes("box-rule") || cls(n).includes("box-note"))) {
      out.push(...n.children.filter((c) => c.type === "element" && !cls(c).includes("box-label")));
      continue;
    }
    if (isHeading(n) || n.tagName === "div" || n.tagName === "table" || n.tagName === "hr" || n.tagName === "figure") break;
    if (n.tagName === "p" && n.children.some((c) => c.tagName === "img")) break;
    out.push(n);
  }
  return out.slice(0, 6);
}
// A place or a threat drawn as a block opens with what it is and what it's like.
function lookOf(box) {
  const what = box.children.find((c) => cls(c).includes("pl-what") || cls(c).includes("th-what"));
  let look = null;
  visit(box, "element", (n) => {
    if (!look && cls(n).includes("pl-look")) look = n;
  });
  return [what, ...(look?.children ?? []).filter((c) => c.tagName === "p" && !cls(c).includes("eyebrow"))].filter(Boolean);
}
const isDrawn = (n) => isBox(n) && (cls(n).includes("pl") || cls(n).includes("th"));
function openingsOf(tree, { targets, page, title, chapterId }, toHtml) {
  const found = new Map();
  visit(tree, "element", (node, index, parent) => {
    const id = node.properties?.id;
    if (id && targets.has(id) && parent) found.set(id, { node, index, parent });
  });
  const own = (nodes) => {
    const copy = structuredClone(nodes);
    for (const n of copy) visit(n, "element", (node) => {
      delete node.properties.id;
      const href = node.properties.href;
      if (typeof href === "string" && href.startsWith("#")) node.properties.href = `${page}${href}`;
    });
    return toHtml(copy).trim();
  };
  const out = {};
  if (targets.has(chapterId)) {
    const blocks = openingBlocks(tree.children);
    if (blocks.length) out[page] = { t: title, c: title, h: own(blocks) };
  }
  for (const [id, { node, index, parent }] of found) {
    let blocks = [];
    let name = "";
    if (isHeading(node)) {
      // A section that goes straight into a subheading or a place's box opens
      // with what that says instead.
      const after = parent.children.slice(index + 1).filter((n) => n.type === "element" && !cls(n).includes("box-quote"));
      blocks = openingBlocks(after);
      const first = after[0];
      if (!blocks.length && first && isHeading(first)) blocks = openingBlocks(after.slice(1));
      else if (!blocks.length && first && isDrawn(first)) blocks = lookOf(first);
      else if (!blocks.length && first && isBox(first) && !cls(first).includes("box-example")) blocks = openingBlocks(first.children);
      name = textOf(node);
    } else if (isBox(node)) {
      blocks = isDrawn(node) ? lookOf(node) : openingBlocks(node.children);
      const label = node.children.find((c) => cls(c).includes("box-label"));
      const strong = node.children.find((c) => c.tagName === "p" && !cls(c).includes("box-label"))?.children.find((c) => c.tagName === "strong");
      name = (label && textOf(label.children.find((c) => cls(c).includes("box-name")) ?? { children: [] })) || (strong ? textOf(strong) : "");
    }
    name = name.trim().replace(/\.$/, "");
    if (blocks.length && name) out[`${page}#${id}`] = { t: name, c: title, h: own(blocks) };
  }
  return out;
}

// Titles and part blurbs come from front matter, so curl their apostrophes here.
const curly = (s) => (typeof s === "string" ? s.replace(/'/g, "\u2019") : s);

// The ready-made crew, read straight off their sheets so the home page and the
// character companion always match the book. Each sheet becomes full data
// (rootsFrom): archetypes, Titles with their Root, specialties and
// permissions, Roots and specialties checked against the sums, what
// they carry, armour on its Root, the attuned thing with its awakenings,
// numbers, threads, Aspiration and trouble, which the companion plays.
const ORDINAL = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, sixth: 5 };
const COUNT = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const plain = (s = "") => curly(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*/g, "").trim());
const italics = (s = "") => [...s.matchAll(/\*([^*]+)\*/g)].map((m) => plain(m[1]));
const dropStop = (s = "") => s.trim().replace(/\.$/, "");
// Split on the commas that aren't inside *italics*.
const commaList = (s) => s.split(/,\s*(?=(?:[^*]*\*[^*]*\*)*[^*]*$)/).map((x) => x.trim()).filter(Boolean);

// Armour's quality, from the table in Quality: Common, Fine and Masterwork,
// with 1, 2 and 3 boxes. A tier is its place in the table, so a saved
// character keeps its armour's quality if a name changes.
function qualitiesFrom(doc, warn) {
  const out = tableRows(sectionOf(doc?.body ?? "", "s-armour-quality")).map((r, i) => ({ tier: i + 1, name: plain(r[0]), boxes: Number(r[1]), text: plain(r[2] ?? "") }));
  if (out.length !== 3 || out.some((q) => !(q.boxes >= 1))) warn(`armour should have three qualities, each with its boxes, and Quality has ${out.map((q) => `${q.name} ${q.boxes}`).join(", ") || "none"}`);
  return out;
}
// "Fine plate armour" is plate armour, Fine, and "a Common shield" is a
// shield, Common.
function qualityOf(text, qualities = []) {
  const art = text.match(/^(a|an|the|her|his|their) /i)?.[0] ?? "";
  const rest = text.slice(art.length);
  const q = qualities.find((x) => rest.startsWith(`${x.name} `));
  if (!q) return null;
  const noun = rest.slice(q.name.length + 1);
  const a = /^an? $/i.test(art) ? (/^[aeiou]/i.test(noun) ? "an " : "a ") : art;
  return { name: `${a}${noun}`, tier: q.tier };
}

// The crew under Roots (8 Nov 2026), read straight off their sheets, and
// every number checked: a Title's 1 on its Root and on each of its three
// specialties, a permission's 1 on a Root and 1 on a specialty, and the Roots
// and Specialties lines have to be what those add up to. What they carry
// never adds to a Root or a specialty, armour says which Root it guards and
// its boxes by its quality, and an attuned thing has as many awakenings as
// its stage and its Catch give it. The crests by an example and the
// companion both read it.
const ROOT_NAMES = ["Body", "Mind", "Soul"];
const TRACK_OF = { Body: "Stamina", Mind: "Confidence", Soul: "Resolve" };
const STAGE_AWAKENINGS = { Awakened: 1, Tempered: 2, Perfected: 3 };
function rootsFrom(doc, ctx) {
  const out = [];
  for (const m of doc.body.matchAll(/^:::sheet\[([^:\]]+): ([^\]]+)\]\n([\s\S]*?)\n:::$/gm)) out.push(rootsSheet(m[1], m[2], m[3], m[0], ctx));
  return out;
}

function rootsSheet(name, titleText, body, block, ctx) {
  const warn = (msg) => ctx.warn(`${name}'s sheet: ${msg}`);
  const rows = body.split("\n");
  const field = {};
  for (const row of rows) {
    const f = row.match(/^\*\*([^*]+?):\*\* (.*)$/);
    if (f) field[f[1]] = f[2].trim();
  }
  const labelled = (re) => Object.keys(field).find((k) => re.test(k));
  for (const label of ["Plays like", "Archetypes", "Roots", "Specialties", "Carries", "Its Aura", "Awakenings", "Numbers", "Threads", "Aspiration"]) {
    if (!(label in field)) warn(`there's no ${label} line`);
  }
  const rootOf = (s, what) => {
    const r = s.trim();
    if (!ROOT_NAMES.includes(r)) warn(`${what} is on "${r}", and a Root's Body, Mind or Soul`);
    return r;
  };

  // Archetypes, apart from the Titles.
  const archetypes = [...(field.Archetypes ?? "").matchAll(/\[([^\]]+)\]\(#(a-[a-z-]+)\)/g)].map((a) => {
    const rule = ctx.archetypes[a[1]];
    if (!rule) warn(`there's no archetype called ${a[1]}`);
    return { name: a[1], id: a[2], home: rule?.home ?? null };
  });
  if (archetypes.length < 1) warn("there are no archetypes on the Archetypes line");

  // Titles: each one a Root and three specialties, and its permissions, each
  // a Root and a specialty.
  const roots = Object.fromEntries(ROOT_NAMES.map((r) => [r, 0]));
  const specs = new Map();
  const addSpec = (s) => specs.set(s, (specs.get(s) ?? 0) + 1);
  const titles = [];
  for (const [label, value] of Object.entries(field)) {
    if (!/^\w+ Title$/.test(label)) continue;
    const t = value.match(/^\*([^*]+)\* \((\w+); ([^)]+)\)\. Permissions: (.+?)\.?$/);
    if (!t) {
      warn(`can't read the ${label}: it's *the Title* (Root; three specialties). Permissions: *a permission* (Root, specialty), …`);
      continue;
    }
    const root = rootOf(t[2], `the ${label}`);
    const specialties = t[3].split(/,\s*/).map((s) => curly(s.trim()));
    if (specialties.length !== 3 || new Set(specialties).size !== 3) warn(`the ${label} names ${specialties.length} specialties, and a Title's three different ones`);
    roots[root] = (roots[root] ?? 0) + 1;
    specialties.forEach(addSpec);
    const permissions = [...t[4].matchAll(/\*([^*]+)\* \((\w+), ([^)]+)\)/g)].map((p) => {
      const r = rootOf(p[2], `*${p[1]}*`);
      roots[r] = (roots[r] ?? 0) + 1;
      addSpec(curly(p[3].trim()));
      return { text: plain(p[1]), root: r, specialty: curly(p[3].trim()) };
    });
    if (!permissions.length) warn(`the ${label} has no permissions I can read: each one's *a permission* (Root, specialty)`);
    if (permissions.length > 6) warn(`the ${label} has ${permissions.length} permissions, and a Title holds six at most`);
    titles.push({ name: plain(t[1]), root, specialties, permissions });
  }
  if (!titles.length) warn("there are no Titles");

  // The Roots and Specialties lines have to be what the Titles and permissions add up to.
  const said = (text) => new Map(dots(dropStop(text ?? "")).map((seg) => {
    const m = seg.match(/^(.+?) (\d+)$/);
    if (!m) warn(`can't read "${seg}": it's a name and its steps`);
    return m ? [curly(m[1]), Number(m[2])] : [seg, NaN];
  }));
  const saidRoots = said(field.Roots);
  for (const r of ROOT_NAMES) {
    if (!saidRoots.has(r)) warn(`the Roots line hasn't got ${r}`);
    else if (saidRoots.get(r) !== roots[r]) warn(`the Roots line says ${r} ${saidRoots.get(r)}, but the Titles and permissions on it make ${roots[r]}`);
  }
  const saidSpecs = said(field.Specialties);
  for (const [s, n] of specs) {
    if (!saidSpecs.has(s)) warn(`${s} is on a Title or a permission, and it isn't on the Specialties line`);
    else if (saidSpecs.get(s) !== n) warn(`the Specialties line says ${s} ${saidSpecs.get(s)}, but the Titles and permissions on it make ${n}`);
  }
  for (const s of saidSpecs.keys()) if (!specs.has(s)) warn(`the Specialties line has ${s}, and nothing on the Titles builds it`);

  // What they carry, the same shape as before Roots.
  const carry = { equipment: [], utility: [], keepsake: null, bag: { name: "a bag", max: 10 } };
  for (const seg of dropStop(field.Carries).split(" · ").filter(Boolean)) {
    const c = seg.match(/^(.+) \(([^()]+)\)$/);
    const info = c?.[2] ?? "";
    const kind = info.match(/^(equipment|utility|keepsake)\b/)?.[1] ?? (/\bof 10$/.test(info) ? "bag" : null);
    if (!c || !kind) {
      warn(`can't read "${seg}" in what they carry`);
      continue;
    }
    if (kind === "keepsake") carry.keepsake = plain(c[1]);
    else if (kind === "bag") carry.bag = { name: plain(c[1]), max: Number(info.match(/\bof (\d+)$/)?.[1] ?? 10) };
    else carry[kind] = c[1].split(", ").map((x) => plain(x));
  }

  // Armour: each piece on a Root, its quality first and its boxes by it.
  const armour = dots(dropStop(field.Armour ?? "")).map((seg) => {
    const a = seg.match(/^(.+?) \((\w+), (\d+) box(?:es)?(?:, (when [^)]+))?\)$/);
    if (!a) {
      warn(`can't read the armour "${seg}": it's the piece, quality first, then (Root, its boxes)`);
      return null;
    }
    const q = qualityOf(plain(a[1]), ctx.qualities);
    if (!q) warn(`${a[1]} is armour, and it needs its quality first: ${ctx.qualities.map((x) => x.name).join(", ")}`);
    else if (ctx.qualities[q.tier - 1]?.boxes !== Number(a[3])) warn(`${a[1]} says ${a[3]} boxes, but ${ctx.qualities[q.tier - 1]?.name} has ${ctx.qualities[q.tier - 1]?.boxes}`);
    if (!carry.equipment.some((e) => plain(e) === plain(a[1]))) warn(`${a[1]} is armour, so it's one of their equipment, and it isn't`);
    return { name: q ? q.name : plain(a[1]), root: rootOf(a[2], a[1]), quality: q ? ctx.qualities[q.tier - 1].name : null, boxes: Number(a[3]), when: a[4] ? curly(a[4]) : null };
  }).filter(Boolean);

  // The attuned thing: its stage, its own way to Aura and its awakenings.
  const attunedLabel = labelled(/^Attuned\b/);
  const stage = attunedLabel?.match(/\(([^)]+)\)/)?.[1] ?? null;
  if (!attunedLabel) warn("there's no Attuned line");
  else if (!(stage in STAGE_AWAKENINGS)) warn(`the attuned thing's stage is ${stage}, and it's Awakened, Tempered or Perfected`);
  const thing = attunedLabel ? field[attunedLabel] : "";
  const caught = thing.match(/, with its Catch, \*([^*]+)\*/);
  const awakenings = dots(dropStop(field.Awakenings ?? "")).map((seg) => {
    const w = seg.match(/^\*([^*]+)\* \((passive|active)\): (.+)$/);
    if (!w) warn(`can't read the awakening "${seg.slice(0, 40)}…": it's *its name* (passive or active): what it does`);
    return w ? { name: plain(w[1]), kind: w[2], text: curly(w[3]) } : null;
  }).filter(Boolean);
  const room = (STAGE_AWAKENINGS[stage] ?? 1) * (caught ? 2 : 1);
  if (awakenings.length !== room) warn(`the attuned thing has ${awakenings.length} awakenings, and at ${stage}${caught ? " with its Catch" : ""} it's got ${room}`);
  const attuned = { name: plain(thing.replace(/\..*$/, "").replace(/, with its Catch.*$/, "").replace(/ \([^)]*\)$/, "")), props: thing.match(/^[^(.]+\(([^)]+)\)/)?.[1] ?? null, stage, catch: caught ? plain(caught[1]) : null, aura: curly(plain(field["Its Aura"] ?? "")), awakenings };

  // The numbers: Aura, the three tracks at d12 to start, and the stride.
  const n = field.Numbers ?? "";
  const num = (re, what) => {
    const m = n.match(re);
    if (!m) warn(`can't find ${what} in the numbers`);
    return m;
  };
  const tracks = Object.fromEntries(Object.values(TRACK_OF).map((tr) => {
    const m = num(new RegExp(`\\b${tr} d(\\d+)(?: \\(([^)]+)\\))?`), tr);
    if (m && m[1] !== "12") warn(`${tr} starts at d12, and the sheet says d${m[1]}`);
    return [tr.toLowerCase(), { die: Number(m?.[1] ?? 12), note: m?.[2] ? curly(m[2]) : null }];
  }));
  if (/\bWound die\b|\bConfidence starts\b|\bResolve \d\b/.test(n)) warn("the numbers still have the wound die, Confidence's start or a Resolve count, and the tracks are Stamina, Confidence and Resolve at d12");
  const numbers = {
    aura: Number(num(/\bAura (\d+)/, "Aura")?.[1] ?? 5),
    stride: Number(num(/\bStride (\d+)/, "Stride")?.[1] ?? 3),
    strideNote: n.match(/\bStride \d+ \(([^)]+)\)/)?.[1] ?? null,
    ...tracks,
  };

  const threads = dropStop(field.Threads).split(" · ").filter(Boolean).map((seg) => {
    const t = seg.match(/^([^:*]+): (.+)$/);
    if (!t) {
      warn(`can't read the threads "${seg}"`);
      return null;
    }
    const person = curly(t[1]);
    const list = [...t[2].matchAll(/\*([^*]+)\*(?: \(([^)]+)\))?/g)].map((x) => threadFrom(plain(x[1]), x[2], (msg) => warn(`the thread with ${person}, ${msg}`)));
    if (!list.length) warn(`no threads with ${person}`);
    return { person, threads: list };
  }).filter(Boolean);
  const crewQs = [...(field.Crew ?? "").matchAll(/\*([^*]+?\?)\*\s+([^*]+)/g)].map((x) => ({ q: curly(x[1]), a: curly(x[2].trim()) }));
  const asp = (field.Aspiration ?? "").match(/^(.+) \(d(\d+)\)\.?$/);
  if (!asp) warn("can't read the Aspiration");
  const troubleLabel = labelled(/^Trouble that follows\b/);
  if (!troubleLabel) warn("there's no trouble that follows them");
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    title: curly(titleText),
    blurb: plain(rows[0]),
    hash: createHash("sha1").update(block).digest("hex").slice(0, 8),
    pronoun: troubleLabel?.split(" ").pop() ?? "them",
    playsLike: ctx.inline(field["Plays like"] ?? ""),
    archetypes, titles,
    roots: Object.fromEntries(ROOT_NAMES.map((r) => [r, roots[r]])),
    specialties: [...saidSpecs].map(([s, steps]) => ({ name: s, steps })),
    carry, armour, attuned, numbers, threads, crewQs,
    aspiration: { text: curly(asp?.[1] ?? ""), die: Number(asp?.[2] ?? 2) },
    trouble: troubleLabel ? italics(field[troubleLabel]) : [],
  };
}

// One thread off a crew sheet. Its note has to say bond or hostile, and it can
// say whose words it is and that it's strained, in that order. Anything else
// stops the build, a debt included, since there's no debt any more.
function threadFrom(text, raw, warn) {
  const parts = raw ? curly(raw).split(/,\s*/) : [];
  const whose = /’s$/.test(parts[0] ?? "") ? parts.shift() : null;
  const kind = parts.shift();
  const strained = parts[0] === "strained";
  if (strained) parts.shift();
  if (kind !== "bond" && kind !== "hostile") warn(`“${text}”, says ${raw ? `(${raw})` : "nothing in brackets"}, and every thread has to say bond or hostile`);
  if (parts.length) warn(`“${text}”, has “${parts.join(", ")}” in its brackets, and they only take whose it is, bond or hostile, and strained`);
  const t = { text, kind: kind === "hostile" ? "hostile" : "bond", whose, strained };
  return { ...t, note: threadNote(t) };
}

// A thread with someone in the crew goes on both sheets, the same words and
// the same kind, and it's in someone else's words on exactly one of them.
function checkMirrors(crew, warn) {
  const byName = new Map(crew.map((c) => [c.name, c]));
  for (const c of crew) {
    for (const p of c.threads) {
      const other = byName.get(p.person);
      if (!other) continue;
      for (const t of p.threads) {
        const back = other.threads.find((x) => x.person === c.name)?.threads.find((x) => x.text === t.text);
        if (!back) warn(`${c.name}'s thread with ${p.person}, “${t.text}”, isn't on ${p.person}'s sheet`);
        else if (back.kind !== t.kind) warn(`${c.name}'s thread with ${p.person}, “${t.text}”, is ${t.kind} on one sheet and ${back.kind} on the other`);
        else if (Boolean(back.whose) === Boolean(t.whose)) warn(`${c.name}'s thread with ${p.person}, “${t.text}”, needs to say whose it is on one sheet and not the other`);
        else if (back.strained !== t.strained) warn(`${c.name}'s thread with ${p.person}, “${t.text}”, is strained on one sheet and not the other`);
      }
    }
  }
}

// What each archetype does, what 1 Aura gets it and what its 1 Resolve
// spend is, from The Archetypes, and what it's for, from the table in Picking
// Your Archetypes (the builder's archetype cards say it).
function archetypesFrom(doc, inline) {
  const out = {};
  const picking = sectionOf(doc.body, "s-picking-archetypes").split(/^### /m)[0];
  const rows = tableRows(picking);
  const forLine = new Map(rows.map((r) => [plain(r[0]), plain(r[1] ?? "")]));
  const homeLine = new Map(rows.map((r) => [plain(r[0]), plain(r[2] ?? "")]));
  for (const m of doc.body.matchAll(/^## (.+?) \{#(a-[a-z-]+)\}\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
    const [, archetype, id, text] = m;
    const home = text.match(/^\*\*Home track:\*\* (\w+)\.?$/m)?.[1] ?? null;
    const abilities = [...text.matchAll(/^\*\*(.+?) \(1 (\w+)\):\*\* (.+)$/gm)].map((a) => ({ name: curly(a[1]), cost: a[2], text: plain(a[3]), html: inline(a[3]) }));
    if (!forLine.get(archetype)) companionWarn(`the ${archetype} archetype isn't in the table in Picking Your Archetypes, so its card in the builder has nothing to say what it's for`);
    if (!["Stamina", "Confidence", "Resolve"].includes(home)) companionWarn(`the ${archetype} archetype has no home track (**Home track:** Stamina, Confidence or Resolve)`);
    else if (homeLine.get(archetype) !== home) companionWarn(`the ${archetype} archetype's home track is ${home}, but the table in Picking Your Archetypes says ${homeLine.get(archetype) || "nothing"}`);
    if (!abilities.length) companionWarn(`the ${archetype} archetype has no abilities I can read (**Its name (1 ${home ?? "Track"}):** what it does)`);
    if (abilities.length > 6) companionWarn(`the ${archetype} archetype has ${abilities.length} abilities, and an archetype holds six at most`);
    for (const a of abilities) if (a.cost !== home) companionWarn(`the ${archetype}'s ${a.name} costs 1 ${a.cost}, and its home track's ${home}`);
    out[archetype] = { id, summary: inline(text.trim().split(/\n\s*\n/)[0]), for: forLine.get(archetype) ?? "", home, abilities };
  }
  return out;
}

// The conditions to start with, from Conflict, against you and for you. Each
// one's passive is a whole sentence ("One step less on anything physical.",
// or a vulnerability like Prone's), and its active is what spending it does.
// A table whose heading still says "Passive: one step less on…" has the
// start of that sentence in its heading, so it's put back on.
function conditionsFrom(doc, inline) {
  const out = [];
  for (const [kind, heading] of [["against", "Against you"], ["for", "For you"]]) {
    const table = doc.body.split(new RegExp(`^#### ${heading}.*$`, "m"))[1]?.split(/^#{2,4} /m)[0] ?? "";
    const lead = table.match(/^\| Condition \| Passive: (one step (?:less|more) on)…? \|/im)?.[1];
    for (const m of table.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \|$/gm)) {
      const passive = lead ? `${lead.charAt(0).toUpperCase()}${lead.slice(1)} ${m[2]}` : m[2];
      out.push({ name: curly(m[1]), kind, passive: inline(passive), active: inline(m[3]) });
    }
  }
  return out;
}

// The party sheet's (the companion's, for a campaign), read off The Party
// Sheet so it always matches the book: a new crew's starting card, the twelve
// crew assets with what each one does, what each size of Power means, and the
// book's own ideas for a Goal and a Reputation. Anything it can't read stops
// the build.
function partyFrom(doc, warn) {
  const card = doc.body.match(/^:::sheet\[A new crew\][^\n]*\n([\s\S]*?)^:::$/m)?.[1] ?? "";
  const field = (name) => card.match(new RegExp(`^\\*\\*${name}\\*\\* (.+)$`, "m"))?.[1] ?? "";
  const italics = (s) => [...s.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)(?: \(([^)]+)\))?/g)];
  const res = italics(field("Resources")).map((m, i) => ({ id: `new-res-${i + 1}`, text: curly(m[1]) }));
  const assets = italics(field("Assets")).map((m, i) => ({ id: `new-asset-${i + 1}`, text: curly(m[1]), does: curly(m[2] ?? ""), power: /\+1 Power/.test(m[2] ?? "") }));
  const people = plain(field("People it relies on"));
  if (!res.length || !assets.length || !people) warn("can't read the new crew's starting card (its Resources, Assets and People it relies on) in The Party Sheet");
  const twelve = tableRows(sectionOf(doc.body, "s-crew-tags")).map((r) => ({ name: plain(r[0]), does: plain(r[1] ?? ""), power: /\+1 Power/.test(r[1] ?? "") }));
  if (twelve.length !== 12) warn(`expected the twelve crew assets in Crew Assets, found ${twelve.length}`);
  const sizes = Object.fromEntries(tableRows(sectionOf(doc.body, "s-crew-size")).map((r) => [Number(r[0].replace(/^d/, "")), plain(r[1] ?? "")]).filter(([d, text]) => d && text));
  if (Object.keys(sizes).length !== 5) warn(`expected Power's five sizes, d4 to d12, in How big it is, found ${Object.keys(sizes).length}`);
  const goals = italics(sectionOf(doc.body, "s-goal").split(/\n\s*\n/).find((p) => /\blike \*/.test(p)) ?? "").map((m) => curly(m[1]));
  if (!goals.length) warn("can't find the ideas for a Goal (like *clear Dorrie's name*) in The Party Goal");
  const rep = curly(sectionOf(doc.body, "s-party-faction").match(/\*\*Reputations\*\*[^\n]*?\*([^*]+)\*/)?.[1] ?? "");
  if (!rep) warn("can't find the example Reputation in The Crew");
  return { start: { res, assets }, people, assets: twelve, sizes, goals, rep };
}

// The faction board's official content (stage 1 of notes/worlds-plan.md), read
// off the chapters so it always matches the book: the Steeplands' board, with
// the Vane Estate's whole card from Factions, every frame's board, Building a
// Faction's tables and sizes, and Appendix B's assets. Every Power the book
// prints has to add up (1 step, plus each asset that adds Power), and a card
// the board can't read stops the build. Each card carries a hash, so a GM who
// brought it in hears when the book changes it.
const BUILT = Date.now();
const CARD_LINES = new Set(["Power", "Resources", "Resource", "Assets", "Asset", "Want", "Agenda", "Face", "Secret", "Bonds", "Threads"]);
const BOND_GROUPS = { "Public Sentiment": "pub", Morale: "mor", Loyalty: "loy" };
const keyOf = (name) => plain(name).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
// An asset's name for matching one in Appendix B, whatever its apostrophes.
const nameKey = (name) => plain(name).toLowerCase().replace(/[’']/g, "'").trim();
const capFirst = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
const firstSentence = (s = "") => s.match(/^.+?[.?](?=\s|$)/)?.[0] ?? s;
function hashOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
// Every table in a section, each as its header and its rows.
function tablesOf(sec) {
  const out = [];
  let rows = null;
  for (const l of sec.split("\n")) {
    const m = l.match(/^\| (.+) \|$/);
    if (!m) {
      rows = null;
      continue;
    }
    const cells = m[1].split(" | ").map((x) => x.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (!rows) out.push((rows = { head: cells, rows: [] }));
    else rows.rows.push(cells);
  }
  return out;
}
// An italic name with a multiplier, like *Warships ×2*.
const timesOf = (t) => {
  const m = t.match(/^(.*?) ×(\d+)$/);
  return m ? { text: curly(m[1].trim()), x: Number(m[2]) } : { text: curly(t.trim()), x: 1 };
};
const marked = (s = "") => [...s.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)(?: \(([^)]+)\))?/g)].map((m) => ({ name: m[1], paren: m[2] ?? "" }));
const threadsIn = (s = "") => [...s.matchAll(/\*([^*]+)\* \((bond|hostile)(?:, (strained))?\)/g)].map((m) => ({ text: curly(dropStop(m[1])), kind: m[2], s: m[3] ? "strained" : "whole" }));

// One faction's card, from the lines on a :::sheet (a frame's board, or the
// whole cards in Factions) or a row of the Steeplands' board.
function cardOf(name, { power = "", res = "", assets = "", want = "", agenda = "", face = "", secret = "", bonds = "", threads = "" }, warn) {
  const stated = Number(power.match(/^d(\d+)/)?.[1]) || 0;
  const list = new Map();
  for (const a of marked(assets)) {
    const t = timesOf(a.name);
    list.set(t.text, { ...t, does: curly(a.paren), power: /\+1 Power/.test(a.paren) });
  }
  for (const a of marked(power.replace(/^d\d+:?\s*/, ""))) {
    const t = timesOf(a.name);
    const had = list.get(t.text);
    if (had) had.power = true;
    else list.set(t.text, { ...t, does: "", power: true });
  }
  const card = {
    key: keyOf(name),
    name: curly(name),
    want: curly(plain(want)),
    face: curly(plain(face)),
    secret: "",
    more: "",
    note: "",
    res: marked(res).map((m) => timesOf(m.name)),
    assets: [...list.values()].map(({ text, x, does, power: p }) => ({ text, does, power: p, x })),
    agendas: [],
    pub: [],
    mor: [],
    loy: [],
    threads: threadsIn(threads),
  };
  const steps = 1 + card.assets.filter((a) => a.power).length;
  const dice = stepsToDice(steps);
  if (!stated || dice.length !== 1 || dice[0] !== stated) warn(`${name}'s Power says d${stated || "?"}, but 1 step plus ${steps - 1} assets that add Power makes ${diceLabel(dice)}`);
  if (!card.res.length) warn(`can't read ${name}'s resources`);
  if (!card.want) warn(`can't read what ${name} wants`);
  if (!card.face) warn(`can't read ${name}'s face`);
  const ag = agenda.match(/^\*([^*]+)\*,? (?:at )?d(\d+)(?: \([^)]*\))?[.,]?\s*(.*)$/);
  if (ag) card.agendas.push({ text: curly(ag[1]), die: Number(ag[2]), then: curly(capFirst(plain(ag[3]))) });
  else warn(`can't read ${name}'s agenda (like *Close the Combs*, at d4)`);
  const sec = secret.match(/^\*([^*]+)\*\s*(.*)$/);
  if (sec) Object.assign(card, { secret: curly(dropStop(sec[1])), more: curly(plain(sec[2])) });
  else if (secret) {
    // A secret written plain, like the Steeplands' board: its first sentence
    // is the tag.
    const one = firstSentence(plain(secret));
    Object.assign(card, { secret: curly(dropStop(one)), more: curly(plain(secret).slice(one.length).trim()) });
  } else warn(`can't read ${name}'s secret`);
  for (const part of bonds.split(/(?=Public Sentiment:|Morale:|Loyalty:)/)) {
    const g = part.match(/^(Public Sentiment|Morale|Loyalty):/)?.[1];
    if (g) card[BOND_GROUPS[g]] = threadsIn(part);
    else if (part.trim()) warn(`can't read ${name}'s bonds: ${part.trim()}`);
  }
  // Where the threads line says more than its threads toward the crew, like
  // "None yet. It hasn't noticed the crew.", it goes in the GM's note.
  const rest = plain(threads.replace(/\*[^*]+\* \((?:bond|hostile)(?:, strained)?\)/g, "").replace(/^Toward the crew:\s*/, "")).replace(/[.:\s]+$/, "");
  if (threads && (card.threads.length ? rest : (threads.match(/[.?]\s/g) ?? []).length >= 1)) card.note = curly(`Threads: ${plain(threads)}`);
  card.h = hashOf(JSON.stringify(card));
  // When this build was made, so a phone still on an older one never takes
  // its older book for news.
  card.at = BUILT;
  return card;
}

function sheetCard(name, body, warn) {
  const lines = {};
  for (const m of body.matchAll(/^\*\*([A-Za-z ]+)\*\* (.+)$/gm)) {
    if (!CARD_LINES.has(m[1])) warn(`${name}'s card has a line the board can't hold yet: ${m[1]}`);
    lines[m[1].toLowerCase().replace(/^resources?$/, "res").replace(/^asset$/, "assets")] = m[2].trim();
  }
  return cardOf(name, lines, warn);
}

// A place's telegraphs, ready for the GM to send: who and what, its die, and
// what it's aimed at, which is one of the crew when it only says Body, Mind or
// Soul, one of the place's stakes, the scene clock, or a part of the
// place (everyone on the gallery, whoever's at the door). Whatever comes after
// Body, Mind or Soul is what it does if it lands (Grabbed). One at a stake
// puts a new tag in its way if it lands: the one in italics after the stake,
// if the book names one, or the telegraph's own words.
function placeTeles(name, field, stakes, warn) {
  const out = [];
  for (const seg of dots(field)) {
    const m = seg.match(/^\*(.+)\* \((d\d+), (.+)\)$/);
    const d = Number(m?.[2]?.slice(1));
    if (!m || ![2, 4, 6, 8, 10, 12].includes(d)) {
      warn(`can't read one of ${name}'s telegraphs: ${seg}`);
      continue;
    }
    const sentence = m[1].trim();
    const line = curlyQuotes(curly(sentence));
    const a = readAim(m[3], stakes, line);
    if (a.why) {
      warn(`one of ${name}'s telegraphs can't go on the table: ${a.why} (${seg})`);
      continue;
    }
    const t = { line, ...whoAndDoes(sentence, name), d, ...a };
    out.push(t);
  }
  return out;
}

// The twenty places, for the GM to put on the live table's scene: each one's
// ground, its stakes with what's in the way, its scene clock and its
// telegraphs, read off its card. The build stops if a card can't be read.
function placesFrom(doc, warn) {
  const out = [];
  for (const m of doc.body.matchAll(/^## (.+?) \{#(s-place-[a-z-]+)\}\n+:::place\n([\s\S]*?)\n:::$/gm)) {
    const name = curly(m[1]);
    const field = {};
    for (const row of m[3].split("\n")) {
      const f = row.match(/^\*\*([^*]+?)\*\* (.*)$/);
      if (f) field[f[1]] = f[2].trim();
    }
    const ground = dots(dropStop(field["The ground"] ?? "")).map((seg) => seg.match(/^\*([^*]+)\*:\s*(.+)$/)).map((g) => (g ? { name: plain(g[1]), text: plain(g[2]) } : null));
    const stakes = dots(dropStop(field.Stakes ?? "")).map((seg) => {
      const s = seg.match(/^\*([^*]+)\*, Challenge (\d): (.+?)(?: \(([^)]+)\))?$/);
      return s ? { name: plain(s[1]), c: Number(s[2]), tags: italics(s[3]), note: s[4] ? plain(s[4]) : "" } : null;
    });
    const clock = (field["Scene clock"] ?? "").match(/^d(\d+): (.+?)\.?$/);
    if (!ground.length || ground.some((g) => !g) || !stakes.length || stakes.some((s) => !s || !s.tags.length) || !clock || ![2, 4, 6, 8, 10, 12].includes(Number(clock[1]))) {
      warn(`can't read ${name}'s ground, stakes or scene clock`);
      continue;
    }
    const tele = placeTeles(name, field.Telegraphs ?? "", stakes, warn);
    if (!tele.length) warn(`${name} has no telegraphs the table can read`);
    out.push({ id: m[2], name, ground, stakes, clock: { d: Number(clock[1]), what: plain(clock[2]) }, tele });
  }
  if (out.length !== 20) warn(`expected twenty places, found ${out.length}`);
  return out;
}

function worldsFrom({ factionsDoc, steepDoc, framesDoc, assetsDoc }, pageFor, warn) {
  // The cards and the sizes in Factions, and Building a Faction's tables.
  const sheets = new Map([...factionsDoc.body.matchAll(/^:::sheet\[([^\]]+)\][^\n]*\n([\s\S]*?)^:::$/gm)].map((m) => [m[1], m[2]]));
  const sizeTable = tablesOf(sectionOf(factionsDoc.body, "s-faction-board")).find((t) => /^How big$/i.test(t.head[0]));
  const sizes = (sizeTable?.rows ?? []).map((r) => ({ size: plain(r[0]), power: plain(r[1]), res: plain(r[2]), eg: plain(r[3]) }));
  if (sizes.length !== 4) warn(`expected the four sizes of faction in What a Faction Is, found ${sizes.length}`);
  const [what, how] = tablesOf(sectionOf(factionsDoc.body, "s-faction-build"));
  const rolls = (t, a, b) => (t?.rows ?? []).map((r) => ({ [a]: curly(dropStop(plain(r[1] ?? ""))), [b]: curly(plain(r[2] ?? "")) }));
  const build = {
    what: rolls(what, "is", "wants"),
    how: rolls(how, "works", "secret"),
    agendas: (tablesOf(sectionOf(factionsDoc.body, "s-agendas"))[0]?.rows ?? []).map((r) => ({ text: curly(dropStop(plain(r[1] ?? ""))), die: Number(String(r[2]).replace(/^d/, "")) })),
  };
  if (build.what.length !== 12 || build.how.length !== 12) warn("expected Building a Faction's two d12 tables (what it is and wants, how it works and its secret)");
  if (build.agendas.length !== 12 || build.agendas.some((a) => ![2, 4, 6, 8, 10, 12].includes(a.die))) warn("expected the twelve agendas, each with the die it starts at, in Agendas");

  // The Steeplands: its board's a table, and the Estate's whole card is in Factions.
  const boards = [];
  const steepTable = tablesOf(sectionOf(steepDoc.body, "the-board"))[0];
  const steep = [];
  for (const r of steepTable?.rows ?? []) {
    const name = plain(r[0].match(/\*\*([^*]+)\*\*/)?.[1] ?? "");
    const want = capFirst(r[0].match(/Wants ([^.]+\.)/)?.[1] ?? "");
    const face = capFirst(r[0].match(/Face: ([^.]+)\./)?.[1] ?? "");
    const row = cardOf(name, { power: r[1], res: r[2], want, agenda: r[3], face, secret: r[4] }, warn);
    const whole = sheets.get(name);
    if (whole) {
      const card = sheetCard(name, whole, warn);
      if (stepsToDice(1 + card.assets.filter((a) => a.power).length).join() !== stepsToDice(1 + row.assets.filter((a) => a.power).length).join()) warn(`${name}'s Power on the Steeplands' board doesn't match its whole card in Factions`);
      steep.push(card);
    } else steep.push(row);
  }
  if (steep.length !== 4) warn(`expected the Steeplands' four great powers on its board, found ${steep.length}`);
  const opening = steepDoc.body.replace(/^:::quote[\s\S]*?^:::$/m, "").split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith("#"));
  boards.push({ id: "steeplands", name: "The Steeplands", kind: "A world in two pages", pitch: curly(firstSentence(plain(opening ?? ""))), link: `${pageFor.get(steepDoc.path)}#the-board`, cards: steep });

  // Every frame's board.
  for (const m of framesDoc.body.matchAll(/^## (.+?) \{#(s-frame-[a-z-]+)\}$/gm)) {
    if (m[2] === "s-frame-own") continue;
    const sec = sectionOf(framesDoc.body, m[2]);
    const pitch = sec.match(/### The pitch[^\n]*\n+:::example[^\n]*\n([^\n]+)/)?.[1] ?? "";
    const boardSec = sec.match(/### The board[^\n]*\n([\s\S]*?)(?=^### |$(?![\s\S]))/m)?.[1] ?? "";
    const cards = [...boardSec.matchAll(/^:::sheet\[([^\]]+)\][^\n]*\n([\s\S]*?)^:::$/gm)].map((s) => sheetCard(curly(s[1]), s[2], warn));
    if (cards.length < 2) warn(`can't find ${m[1]}'s board`);
    if (!pitch) warn(`can't find ${m[1]}'s pitch`);
    boards.push({ id: m[2].replace(/^s-frame-/, ""), name: curly(m[1]), kind: "A frame", pitch: curly(firstSentence(plain(pitch).replace(/^["“]/, ""))), link: `${pageFor.get(framesDoc.path)}#${m[2]}`, cards });
  }
  if (boards.length < 6) warn(`expected the Steeplands and five frames to bring in, found ${boards.length}`);

  // Each card's seal, from content/world-tables/seals.yaml, put on after its
  // hash so a seal's never news to a GM who's brought the card in already.
  let sealsRaw = null;
  try {
    sealsRaw = parseYaml(readFileSync(join(ROOT, "content", "world-tables", "seals.yaml"), "utf8"))?.boards ?? null;
  } catch (err) {
    warn(`can't read content/world-tables/seals.yaml: ${String(err?.message ?? err).split("\n")[0]}`);
  }
  for (const b of boards) {
    const given = sealsRaw?.[b.id] ?? {};
    for (const k of Object.keys(given)) if (!b.cards.some((c) => c.key === k)) warn(`seals.yaml has a seal for ${k} on ${b.name}, and that board hasn't got it`);
    const seen = new Map();
    for (const c of b.cards) {
      const s = sealIn(given[c.key]);
      if (!s) warn(given[c.key] ? `${c.name}'s seal in seals.yaml isn't one the kit has (src/kit/seals.js)` : `${c.name} on ${b.name} has no seal in content/world-tables/seals.yaml`);
      else if (seen.has(sealKey(s))) warn(`${c.name} and ${seen.get(sealKey(s))} on ${b.name} have the same seal`);
      else seen.set(sealKey(s), c.name);
      c.seal = s;
    }
  }

  // Appendix B's assets, to pick from.
  const assets = [];
  for (const [id, power] of [["assets-people", true], ["assets-reach", false], ["assets-places", false], ["assets-influence", false], ["assets-odd", false]]) {
    const group = curly(assetsDoc.body.match(new RegExp(`^### (.+?) \\{#${id}\\}`, "m"))?.[1] ?? "");
    const rows = tablesOf(sectionOf(assetsDoc.body, id))[0]?.rows ?? [];
    if (!group || !rows.length) warn(`can't read Appendix B's ${id.replace("assets-", "")} assets`);
    for (const r of rows) {
      const says = r[1] ?? "";
      if (power && !/^\+1 Power\b/.test(says)) warn(`Appendix B's ${plain(r[0])} is under People who turn up, so it starts with +1 Power`);
      if (!power && /[+]\d+ Power|\badds? Power\b/i.test(says)) warn(`Appendix B's ${plain(r[0])} adds Power, but only people who turn up add Power, so it goes under People who turn up or does one thing`);
      assets.push({ group, text: curly(plain(r[0])), does: curly(plain(says)), power });
    }
  }
  // Only people who turn up add Power (28 Oct), so a card's asset with the
  // same name as one of Appendix B's adds Power exactly when Appendix B's does,
  // and no card can make Rooted or Influential add Power again. A name that
  // isn't in Appendix B is the card's own, and only its die's checked.
  const adds = new Map(assets.map((a) => [nameKey(a.text), a.power]));
  for (const b of boards) {
    for (const c of b.cards) {
      for (const a of c.assets) {
        const p = adds.get(nameKey(a.text));
        if (p === undefined || p === a.power) continue;
        warn(a.power ? `${c.name}'s ${a.text} adds Power, but it isn't people in Appendix B, and only people who turn up add Power` : `${c.name}'s ${a.text} is people in Appendix B, so it adds Power on the card too`);
      }
    }
  }
  // The faction turn (stage 2): the d6 for when she doesn't know what a
  // faction does, the six outcomes, both d12 tables for when one comes for the
  // crew, and the crew's moves on a faction.
  const turnTables = tablesOf(sectionOf(factionsDoc.body, "s-faction-turn"));
  const d6 = turnTables.find((t) => /^d6$/i.test(t.head[0]));
  const does = (d6?.rows ?? []).map((r) => {
    const [from, to] = plain(r[0]).split(/[–-]/).map((x) => Number(x.trim()));
    return { from, to: to || from, text: curly(plain(r[1] ?? "")) };
  });
  if (does.length < 5 || does[0].from !== 1 || does[does.length - 1].to !== 6 || does.some((x, i) => i && x.from !== does[i - 1].to + 1)) warn("expected the d6 for what a faction does, from 1 to 6, in The Faction Turn");
  const outcomes = (turnTables.find((t) => /^Outcome$/i.test(t.head[0]))?.rows ?? []).map((r) => ({ name: plain(r[0]), text: curly(plain(r[1] ?? "")) }));
  if (outcomes.map((o) => o.name).join() !== "Destroy,Undermine,Obstruct,Influence,Acquire,Establish") warn("expected the six outcomes, in order, in The Six Outcomes");
  const comesTable = tablesOf(sectionOf(factionsDoc.body, "s-faction-comes")).find((t) => /^d12$/i.test(t.head[0]));
  const comes = (comesTable?.rows ?? []).map((r) => ({ n: Number(plain(r[0])), hostile: curly(plain(r[1] ?? "")), bond: curly(plain(r[2] ?? "")) }));
  if (comes.length !== 12 || comes.some((x, i) => x.n !== i + 1 || !x.hostile || !x.bond)) warn("expected both d12 tables, hostile and bond, in When a Faction Comes for the Crew");
  const movesTable = tablesOf(sectionOf(factionsDoc.body, "s-faction-crew")).find((t) => /^Move$/i.test(t.head[0]));
  const moves = (movesTable?.rows ?? []).map((r) => ({ name: plain(r[0]), against: curly(plain(r[1] ?? "")), win: curly(plain(r[2] ?? "")) }));
  if (moves.length !== 8 || moves[6]?.name !== "Set back its agenda" || moves[7]?.name !== "Work for it") warn("expected the crew's eight moves on a faction, ending with Set back its agenda and Work for it, in The Crew and the Factions");
  const turn = { does, outcomes, comes, moves };

  return { boards, build, sizes, assets, turn, link: `${pageFor.get(factionsDoc.path)}#s-faction-board` };
}

// Places and people (stage 3 of notes/worlds-plan.md), read off the chapters
// so they always match the book: Twenty Places, with every named person in
// them, the Bestiary's threats, Building Your World's tables for places,
// people and hooks, the Threat Builder's, and what each tag in Appendix B
// does. It goes in its own file, public/world-book.json, which only the World
// screen fetches and the service worker keeps. A place or threat the page
// can't hold stops the build. Each carries a hash, so a GM who brought it in
// hears when the book changes it.
const PLACE_LINES = new Set(["Who's here", "The ground", "Stakes", "Scene clock", "Telegraphs", "Hooks", "Elsewhere", "Secret"]);
const THREAT_LINES = new Set(["Challenge", "Comes at you", "Keeps it going", "Drives it", "Forms", "Telegraphs", "Voice", "Hidden"]);
function pagesFrom({ placesDoc, worldDoc, threatDoc, bestiaryDoc, tagsDoc }, pageFor, warn) {
  // Words as the book has them, keeping *italics* for tags, with curly quotes.
  const smart = (s = "") => curly(s).replace(/(^|[\s([{—–-])"/g, "$1“").replace(/"/g, "”");
  const words = (s = "") => smart(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*/g, "").replace(/\s*\n\s*/g, " ").trim());
  const items = (s = "") => (s ? s.split(" · ").map((x) => words(x)).filter(Boolean) : []);
  const labelled = (name, paras, known) => {
    const out = {};
    for (const p of paras) {
      const m = p.match(/^\*\*([^*]+)\*\* ([\s\S]+)$/);
      if (!m) warn(`${name} has a paragraph a page can't place: ${p.slice(0, 60)}`);
      else if (!known.has(m[1])) warn(`${name} has a line a page can't hold yet: ${m[1]}`);
      else out[m[1]] = m[2].replace(/\s*\n\s*/g, " ").trim();
    }
    return out;
  };
  const teleOf = (name, s) => {
    const m = s.match(/^\*(.+)\* \(d(\d+), ([^)]+)\)$/);
    if (!m || ![2, 4, 6, 8, 10, 12].includes(Number(m[2]))) warn(`${name} has a telegraph a page can't read: ${s.slice(0, 60)}`);
    return m ? { text: smart(m[1]), d: Number(m[2]), at: smart(m[3]) } : null;
  };
  const secretOf = (name, s = "") => {
    const m = s.match(/^\*([^*]+)\*(?: \((weak point)\))?\.?\s*([\s\S]*)$/);
    if (!m) warn(`can't read ${name}'s Secret (like *Every Word Is Sold*. The rest of it)`);
    return m ? { secret: smart(dropStop(m[1])), more: words(m[3]), weak: Boolean(m[2]) } : { secret: "", more: "", weak: false };
  };
  const stamp = (card) => {
    card.h = hashOf(JSON.stringify(card));
    card.at = BUILT;
    return card;
  };

  // What each tag does, from Appendix B, and its name as the book writes it.
  const tags = [];
  const tagNamed = new Map();
  for (const [id, kind] of [["how-it-comes-at-you", "comes"], ["what-keeps-it-going", "keeps"], ["vulnerability-tags", "weak"], ["what-drives-it", "drives"]]) {
    const rows = tableRows(sectionOf(tagsDoc.body, id));
    if (rows.length < 6) warn(`can't read Appendix B's tags under ${id}`);
    for (const r of rows) {
      const name = plain(r[0]);
      if (!name || tagNamed.has(name.toLowerCase())) continue;
      const t = { name, kind, does: smart(plain(r[1] ?? "")) };
      tags.push(t);
      tagNamed.set(name.toLowerCase(), t);
    }
  }
  const canon = (s) => {
    const t = dropStop(plain(s));
    return tagNamed.get(t.toLowerCase())?.name ?? tagNamed.get(t.split(", ")[0].toLowerCase())?.name ?? capFirst(t.split(", ")[0]);
  };
  const tagsIn = (s = "", kind = "") => marked(s).map((m) => ({ ...timesOf(m.name), kind }));

  // Building Your World's tables, and the Threat Builder's.
  const rolls = (sec, n, what) => {
    const rows = (tablesOf(sec)[0]?.rows ?? []).map((r) => smart(dropStop(plain(r[1] ?? ""))));
    if (rows.length !== n || rows.some((x) => !x)) warn(`expected the d${n} table for ${what}`);
    return rows;
  };
  const [wants, hiding] = tablesOf(sectionOf(worldDoc.body, "people")).map((t) => t.rows.map((r) => smart(dropStop(plain(r[1] ?? "")))));
  if (wants?.length !== 12 || hiding?.length !== 12) warn("expected the two d12 tables in People, what they want and what they're hiding");
  const tagTables = tablesOf(sectionOf(threatDoc.body, "its-tags"));
  const tagTable = (head) => (tagTables.find((t) => t.head[1] === head)?.rows ?? []).map((r) => canon(r[1] ?? ""));
  const what = (tablesOf(sectionOf(threatDoc.body, "what-it-is"))[0]?.rows ?? []).map((r) => {
    const m = r[1].match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    const twice = /^Roll twice$/i.test(m?.[1] ?? "");
    const start = twice ? [] : italics(r[3] ?? "").join(", ").split(", ").map((x) => x.trim()).filter(Boolean);
    return {
      name: curly(m?.[1] ?? ""), is: smart(dropStop(plain(m?.[2] ?? ""))), ch: Number(r[2]) || 0,
      tags: start.filter((x) => /^[A-Z]/.test(x)).map((x) => ({ ...timesOf(x), kind: "" })),
      also: capFirst(start.filter((x) => !/^[A-Z]/.test(x)).join(", ").replace(/^and /, "")),
      twice,
    };
  });
  const tables = {
    complication: rolls(sectionOf(worldDoc.body, "s-world-places"), 12, "a place's complication"),
    want: wants ?? [],
    hiding: hiding ?? [],
    trouble: rolls(sectionOf(worldDoc.body, "hooks"), 20, "hooks"),
    what,
    comes: tagTable("How it comes at you"),
    keeps: tagTable("What keeps it going"),
    drives: tagTable("What drives it"),
  };
  if (what.length !== 20 || !what[19]?.twice || what.slice(0, 19).some((w) => !w.name || !w.ch || !w.tags.length)) warn("expected the d20 table of what a threat is, each with its Challenge and tags, ending with Roll twice");
  for (const k of ["comes", "keeps", "drives"]) if (tables[k].length !== 12) warn(`expected the d12 table of tags for ${k} in Its Tags`);

  // The Bestiary: every threat, by the part of the chapter it's in.
  const threats = [];
  for (const sec of bestiaryDoc.body.split(/^(?=## )/m)) {
    const head = sec.match(/^## ([^:{]+?)(?::[^{]*)? \{#([a-z0-9-]+)\}/);
    const group = curly(head?.[1] ?? "");
    for (const m of sec.matchAll(/^:::threat\[([^\]]+)\]\n([\s\S]*?)^:::$/gm)) {
      const name = curly(m[1]);
      const paras = m[2].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      const lead = paras.filter((p) => !p.startsWith("**"));
      const L = labelled(name, paras.filter((p) => p.startsWith("**")), THREAT_LINES);
      const ch = (L.Challenge ?? "").match(/^(\d) \(d(\d+)\)(?: · (.+))?$/);
      if (!ch || Number(ch[2]) !== 2 * Number(ch[1])) warn(`can't read ${name}'s Challenge (like 3 (d6))`);
      const card = {
        key: keyOf(name), kind: "person", name, line: words(lead[0] ?? ""), ch: Number(ch?.[1]) || 0, look: words(lead[1] ?? ""),
        tags: [...tagsIn(L["Comes at you"], "comes"), ...tagsIn(L["Keeps it going"], "keeps"), ...tagsIn(L["Drives it"], "drives")],
        rules: [ch?.[3] ? words(ch[3]) : "", L.Forms ? `Forms: ${words(L.Forms)}` : ""].filter(Boolean).join(" "),
        teles: items(L.Telegraphs).map((t) => teleOf(name, t)).filter(Boolean),
        voice: words(L.Voice ?? ""),
        ...secretOf(name, L.Hidden),
        group,
      };
      if (lead.length < 1 || lead.length > 2) warn(`${name} should open with who it is, and what you notice first if it says`);
      if (!card.tags.length || !card.teles.length || !card.voice) warn(`can't read ${name}'s tags, telegraphs or voice`);
      if (!head) warn(`${name} isn't under one of the Bestiary's headings`);
      stamp(card);
      card.link = `${pageFor.get(bestiaryDoc.path)}#${head?.[2] ?? ""}`;
      threats.push(card);
    }
  }
  if (threats.length < 30) warn(`expected the Bestiary's threats, found ${threats.length}`);
  const threatNamed = (n) => threats.find((t) => keyOf(t.name) === keyOf(n) || keyOf(t.name) === keyOf(`The ${n}`)) ?? null;

  // Twenty Places, with the named people in each one's Who's here.
  // A named person: *Orla Strand*, who owns the baths (Challenge 4: tags),
  // *Captain Ilse Brandt* of the watch, *Mags Tolley* and four smugglers, or
  // someone the Bestiary has (Challenge 3, the Bestiary's Debt Collector).
  const PERSON = /^\*([^*]+)\*(?:,\s*(.+?)|\s+(of\s.+?)|\s+and\s+(.+?))?\s*\(Challenge (\d)(?::\s*(.+?)|,\s*the Bestiary['’]s ([^)]+))\)$/;
  const places = [];
  for (const m of placesDoc.body.matchAll(/^## (.+?) \{#(s-place-[a-z-]+)\}\s*\n+:::place\n([\s\S]*?)^:::$/gm)) {
    const name = curly(m[1]);
    const paras = m[3].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const first = (paras[0] ?? "").match(/^(.+?) \(Challenge (\d)\)\.$/);
    if (!first) warn(`can't read ${name}'s first line (what it is, then its Challenge in brackets)`);
    const lead = paras.slice(1).filter((p) => !p.startsWith("**"));
    const L = labelled(name, paras.slice(1).filter((p) => p.startsWith("**")), PLACE_LINES);
    const clock = (L["Scene clock"] ?? "").match(/^d(\d+): (.+)$/);
    if (!clock) warn(`can't read ${name}'s scene clock (like d8: what happens)`);
    const people = [];
    for (const entry of (L["Who's here"] ?? "").split(" · ")) {
      const p = entry.trim().match(PERSON);
      if (!p) {
        if (entry.trim().startsWith("*")) warn(`can't read ${entry.trim().slice(0, 50)} in ${name}'s Who's here (like *Name*, who they are (Challenge 4: *Tags*))`);
        continue;
      }
      const pname = curly(p[1]);
      const from = p[7] ? threatNamed(curly(p[7])) : null;
      if (p[7] && !from) warn(`${pname} in ${name} is the Bestiary's ${p[7]}, but the Bestiary hasn't got one`);
      const { key: _k, name: _n, line: _l, ch: _c, group: _g, h: _h, at: _a, link: _li, ...threat } = from ?? {};
      people.push(stamp({
        key: keyOf(pname), kind: "person", name: pname, line: words(p[2] ?? p[3] ?? (p[4] ? `with ${p[4]}` : "")), ch: Number(p[5]),
        look: "", tags: p[6] ? italics(p[6]).map((t) => ({ ...timesOf(t), kind: "" })) : [], rules: "", teles: [], voice: "", secret: "", more: "", weak: false,
        ...threat,
      }));
    }
    const card = {
      key: m[2].replace(/^s-place-/, ""), kind: "place", name, line: smart(first?.[1] ?? ""), ch: Number(first?.[2]) || 0, look: words(lead[0] ?? ""),
      here: items(L["Who's here"]), ground: items(L["The ground"]), stakes: items(L.Stakes),
      clockD: Number(clock?.[1]) || 0, clock: words(clock?.[2] ?? ""),
      teles: items(L.Telegraphs).map((t) => teleOf(name, t)).filter(Boolean),
      hooks: items(L.Hooks), elsewhere: words(L.Elsewhere ?? ""),
      ...secretOf(name, L.Secret),
    };
    if (lead.length !== 1) warn(`${name} should have one paragraph of what it's like between its first line and Who's here`);
    if (!card.here.length || !card.ground.length || !card.stakes.length || !card.teles.length) warn(`can't read who's here, the ground, the stakes or the telegraphs in ${name}`);
    stamp(card);
    card.people = people;
    card.link = `${pageFor.get(placesDoc.path)}#${m[2]}`;
    places.push(card);
  }
  if (places.length !== 20) warn(`expected Twenty Places' twenty places, found ${places.length}`);

  return {
    v: 1, places, threats, tables, tags,
    links: { places: pageFor.get(placesDoc.path), bestiary: pageFor.get(bestiaryDoc.path), world: pageFor.get(worldDoc.path), threat: `${pageFor.get(threatDoc.path)}#building-a-threat`, tags: pageFor.get(tagsDoc.path) },
  };
}

// What the character builder offers, read off Building Your Character and the
// Title ideas so it always matches the book: the Quick Build's steps, the
// ideas, what you can carry, the Catch ideas, the quick test, permission
// ideas and the Connect questions.
function sectionOf(body, id) {
  const m = body.match(new RegExp(`^(#{2,4}) [^\\n]*\\{#${id}\\}[^\\n]*$`, "m"));
  if (!m) return "";
  const rest = body.slice(m.index + m[0].length);
  const end = rest.search(new RegExp(`^#{2,${m[1].length}} `, "m"));
  return end === -1 ? rest : rest.slice(0, end);
}
const listItems = (sec) => [...sec.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim());
const tableRows = (sec) => [...sec.matchAll(/^\| (.+) \|$/gm)].map((m) => m[1].split(" | ").map((x) => x.trim())).filter((r) => !/^-+$/.test(r[0])).slice(1);
const dots = (s = "") => s.split(" · ").map((x) => x.trim()).filter(Boolean);

function buildFrom(rulesDoc, ideasDoc, archetypes, inline, warn) {
  const ideas = [];
  let group = "";
  const re = /^### (.+?) \{#s-idea-[a-z-]+\}$|^:::sheet\[([^\]:]+)\]\{#(k-[a-z-]+)\}\n([\s\S]*?)\n:::$/gm;
  for (const m of ideasDoc.body.matchAll(re)) {
    if (m[1]) {
      group = curly(m[1]);
      continue;
    }
    const field = {};
    for (const row of m[4].split("\n")) {
      const f = row.match(/^\*\*([^*]+?):\*\* (.*)$/);
      if (f) field[f[1]] = f[2].trim();
    }
    const arch = [...(field.Archetypes ?? field.Archetype ?? "").matchAll(/\[([^\]]+)\]\(#a-[a-z-]+\)/g)].map((a) => a[1]);
    if (!arch.length) warn(`the ${m[2]} Title idea has no archetypes`);
    ideas.push({
      id: m[3], name: curly(m[2]), group, playsLike: plain(dropStop(field["Plays like"])), archetypes: arch,
      titles: italics(field.Titles), permissions: italics(field.Permissions),
      beyond: dots(field["Going beyond"]).map(plain), trouble: italics(field.Trouble),
    });
  }

  const body = rulesDoc.body;
  // Each Quick Build step's first sentence is what the builder says on that
  // step's screen, and the rest is its help, behind a tap.
  const leadOf = (s) => {
    const m = s.match(/^(.+?\.(?:\*\*)?)\s+(\S[\s\S]*)$/);
    return m ? { lead: inline(m[1].replace(/\*\*/g, "")), more: inline(m[2]) } : { lead: inline(s.replace(/\*\*/g, "")), more: "" };
  };
  const build = {
    quick: listItems(sectionOf(ideasDoc.body, "s-quick")).map(leadOf),
    archetypes: Object.entries(archetypes).map(([name, a]) => ({ name, ...a })),
    ideas,
    items: tableRows(sectionOf(body, "the-item-list")).map((r) => ({ group: plain(r[0]), items: dots(r[1]).map(plain) })),
    usedUp: tableRows(sectionOf(body, "consumables-20")).map((r) => ({ name: plain(r[0]), html: inline(r[1]) })),
    keepsakes: tableRows(sectionOf(body, "keepsakes-10")).map((r) => ({ name: plain(r[0]), text: plain(r[1]) })),
    catches: tableRows(sectionOf(body, "catches-12")).map((r) => ({ name: plain(r[1]), text: plain(r[2]) })),
    quickTest: listItems(sectionOf(body, "the-quick-test")).map(inline),
    permIdeas: tableRows(sectionOf(body, "permission-ideas")).map((r) => ({ for: plain(r[0]), perms: italics(r[1]) })),
    connect: listItems(sectionOf(body, "s-connect")).map(curly),
  };
  const expect = { quick: 7, quickTest: 4, catches: 12, connect: 10 };
  for (const [key, n] of Object.entries(expect)) if (build[key].length !== n) warn(`the builder expected ${n} ${key}, found ${build[key].length}`);
  for (const [key, n] of Object.entries({ archetypes: 10, ideas: 20, items: 4, usedUp: 10, keepsakes: 5, permIdeas: 4 })) {
    if (build[key].length < n) warn(`the builder found only ${build[key].length} ${key}`);
  }
  return build;
}

function textOf(node) {
  if (node.type === "text") return node.value;
  return (node.children || []).map(textOf).join("");
}

// The chapters, in book order.
const parts = parseYaml(readFileSync(join(RULES, "_parts.yaml"), "utf8")).map((p) => ({ ...p, name: curly(p.name), description: curly(p.description) }));
const docs = readdirSync(RULES)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ file: f, path: `rules/${f}`, ...readDoc(join(RULES, f)) }))
  .sort((a, b) => Number(a.meta.order) - Number(b.meta.order));
const changes = { file: "changes.md", path: "changes.md", ...readDoc(join(ROOT, "content", "changes.md")) };

const learnFile = join(ROOT, "content", "learn.md");
const learnDoc = existsSync(learnFile) ? { file: "learn.md", path: "learn.md", ...readDoc(learnFile) } : null;

const pageFor = new Map(docs.map((d) => [d.path, `/rules/${d.meta.slug}/`]));
pageFor.set(changes.path, "/changes/");
const where = collectIds([...docs, changes]);

// Every section a link points at, from the chapters, the change log and the
// Learn deck, gets its opening built for the pop-ups.
const linkTargets = new Set([...docs, changes, learnDoc].filter(Boolean).flatMap((d) => [...d.body.matchAll(/\]\(#([A-Za-z0-9_-]+)\)/g)].map((m) => m[1])));
const openings = {};

let warnings = 0;

// The character companion's data: the crew's full sheets, plus the rules it
// shows beside them, all rendered with the book's own links.
const companionWarn = (msg) => {
  console.warn(`  companion: ${msg}`);
  warnings += 1;
};
const inlineMd = unified().use(remarkParse).use(links, where, pageFor, "companion").use(remarkSmartypants).use(remarkRehype).use(rehypeStringify);
const inline = (text) => {
  const file = inlineMd.processSync(text);
  for (const msg of file.messages) companionWarn(msg.message);
  return String(file).trim().replace(/^<p>([\s\S]*)<\/p>$/, "$1");
};
const docWith = (marker) => docs.find((d) => d.body.includes(marker));
const ctx = {
  warn: companionWarn,
  inline,
  archetypes: docWith("{#s-how-archetypes}") ? archetypesFrom(docWith("{#s-how-archetypes}"), inline) : {},
  qualities: qualitiesFrom(docWith("{#s-armour-quality}"), (msg) => companionWarn(msg)),
};
const crewDoc = docWith("{#s-pregens}");
// The crew under Roots, checked and kept for the book and for stage 3.
const roots = crewDoc ? rootsFrom(crewDoc, ctx) : [];
if (roots.length !== 6) companionWarn(`expected the six crew sheets, found ${roots.length}`);
checkMirrors(roots, companionWarn);
const buildDoc = docWith("{#s-step-roots}");
const ideasDoc = docWith("{#s-quick}");
const rootsBuild = buildDoc && ideasDoc ? buildFrom(buildDoc, ideasDoc, ctx.archetypes, inline, (msg) => companionWarn(`builder: ${msg}`)) : null;
if (!rootsBuild) companionWarn("can't find Building Your Character or the Quick Build for the builder");
else rootsBuild.qualities = ctx.qualities;
const rootsConditions = docWith("{#s-conditions-list}") ? conditionsFrom(docWith("{#s-conditions-list}"), inline) : [];
if (rootsConditions.length < 10) companionWarn(`found only ${rootsConditions.length} conditions in Conflict`);
// The companion plays the crew on Roots, with the builder's data (the
// archetypes with their home tracks and abilities, the Title ideas, items,
// Catches and armour's qualities) and the conditions read off the chapters.
const crew = roots;
const build = rootsBuild;
const conditions = rootsConditions;
const partyDoc = docWith("{#s-party-faction}");
const party = partyDoc ? partyFrom(partyDoc, (msg) => companionWarn(`party sheet: ${msg}`)) : null;
if (!party) companionWarn("can't find The Party Sheet for the party sheet");
// The twenty places, for the live table's scene.
const placesDoc = docWith("{#s-place-copper-baths}");
const places = placesDoc ? placesFrom(placesDoc, (msg) => companionWarn(`places: ${msg}`)) : [];
if (!placesDoc) companionWarn("can't find the Twenty Places for the live table's scene");
// The faction board's official content: the boards to bring in, Building a
// Faction's tables and Appendix B's assets.
const worldDocs = { factionsDoc: docWith("{#s-faction-build}"), steepDoc: docWith("{#the-four-great-powers}"), framesDoc: docWith("{#s-frame-brinewake}"), assetsDoc: docWith("{#faction-strength}") };
const worlds = Object.values(worldDocs).every(Boolean) ? worldsFrom(worldDocs, pageFor, (msg) => companionWarn(`board: ${msg}`)) : null;
if (!worlds) companionWarn("can't find Factions, the Steeplands, Frames or Appendix B's assets for the faction board");
// The crew's twelve assets are in Appendix B too, worded for the crew, so
// each one adds Power exactly when Appendix B's does.
if (party && worlds) {
  const adds = new Map(worlds.assets.map((a) => [nameKey(a.text), a.power]));
  for (const a of party.assets) {
    const p = adds.get(nameKey(a.name));
    if (p === undefined) companionWarn(`party sheet: the crew's ${a.name} isn't in Appendix B's assets, where the twelve crew assets are too`);
    else if (p !== a.power) companionWarn(`party sheet: the crew's ${a.name} ${a.power ? "adds" : "doesn't add"} Power, but Appendix B's ${p ? "does" : "doesn't"}`);
  }
}
// Places and people: Twenty Places, the Bestiary, and the tables to make
// your own, in their own file for the World screen.
const pageDocs = { placesDoc, worldDoc: docWith("{#s-world-places}"), threatDoc: docWith("{#its-tags}"), bestiaryDoc: docWith(":::threat[The Watchman]"), tagsDoc: docWith("{#what-drives-it}") };
const worldBook = Object.values(pageDocs).every(Boolean) ? pagesFrom(pageDocs, pageFor, (msg) => companionWarn(`places and people: ${msg}`)) : null;
if (!worldBook) companionWarn("can't find Twenty Places, Building Your World, the Threat Builder, the Bestiary or Appendix B's tags for places and people");

// What the chapters draw (scripts/book-blocks.mjs) needs: what each tag in
// Appendix B does and where it is, each place's number and line on Twenty
// Places' d20 table, and the crew's archetypes, for their crests by an example.
const tagInfo = new Map((worldBook?.tags ?? []).map((t) => [t.name.toLowerCase(), t]));
const tagLinks = Object.fromEntries([["comes", "how-it-comes-at-you"], ["keeps", "what-keeps-it-going"], ["weak", "vulnerability-tags"], ["drives", "what-drives-it"]]
  .map(([k, id]) => [k, pageDocs.tagsDoc ? `${pageFor.get(pageDocs.tagsDoc.path)}#${id}` : "/rules/"]));
const d20 = new Map([...(placesDoc?.body ?? "").matchAll(/^\| (\d+) \| \[[^\]]+\]\(#(s-place-[a-z-]+)\) \| (.+?) \|$/gm)].map((m) => [m[2], { n: Number(m[1]), line: m[3] }]));
if (placesDoc && d20.size !== 20) companionWarn(`expected Twenty Places' d20 table to list twenty places, found ${d20.size}`);
const drawn = { blocks: { tags: tagInfo, places: d20 }, crew: roots.map((c) => ({ name: c.name, arch: c.archetypes.map((a) => a.name) })) };

const chapters = docs.map((doc, i) => {
  const look = { targets: linkTargets, page: pageFor.get(doc.path), title: curly(doc.meta.title), chapterId: doc.meta.id };
  const out = render(doc, where, pageFor, look, drawn);
  warnings += out.warnings;
  Object.assign(openings, out.openings);
  const part = parts.find((p) => p.number === doc.meta.partNumber);
  return {
    slug: doc.meta.slug,
    id: doc.meta.id,
    title: curly(doc.meta.title),
    order: Number(doc.meta.order),
    partNumber: doc.meta.partNumber ?? null,
    partName: part?.name ?? null,
    updated: doc.meta.updated ? String(doc.meta.updated) : null,
    html: out.html,
    headings: out.headings,
    sections: out.sections,
    hub: out.hub,
    tags: Object.keys(out.tags).length ? out.tags : null,
    prev: i > 0 ? { slug: docs[i - 1].meta.slug, title: curly(docs[i - 1].meta.title) } : null,
    next: i < docs.length - 1 ? { slug: docs[i + 1].meta.slug, title: curly(docs[i + 1].meta.title) } : null,
  };
});
const changesOut = render(changes, where, pageFor);
warnings += changesOut.warnings;

// The rules the companion shows on a tap, read off the chapters so they match
// the book and read offline: each one's opening, up to its first example,
// table or subheading.
const blockHtml = (text) => {
  const file = inlineMd.processSync(text);
  for (const msg of file.messages) companionWarn(msg.message);
  return String(file).trim();
};
const rules = {};
for (const id of ["s-roots", "s-permissions", "how-permissions-stack", "s-building-die", "s-round", "s-telegraphs", "s-actions", "s-answering", "s-the-roll", "s-intents", "s-splitting", "s-going-beyond", "s-teamwork", "s-extra-actions",
  "s-aura", "getting-it-back", "s-tracks", "s-abilities", "s-how-archetypes", "s-attunement", "attunement-stages", "s-armour", "s-armour-quality", "s-defending", "s-defend", "s-intercept", "s-consequences", "s-fear-gets-through",
  "s-blaze", "s-healing", "s-vulnerable", "s-conditions", "s-bonds", "s-trouble", "s-aspiration", "s-good-aspiration", "your-slots", "recover", "grow", "s-downtime-attunement", "s-downtime-threads", "s-downtime-rolls",
  "s-goal", "s-good-goal", "s-climb", "s-projects", "s-crew-size", "s-crew-tags", "s-crew-wealth", "s-crew-grows", "s-party-resources",
  "s-faction-board", "s-wealth", "s-faction-bonds", "s-agendas", "when-an-agenda-happens", "s-standing", "s-mini-factions", "s-faction-build",
  "s-faction-turn", "s-faction-outcomes", "s-faction-comes", "s-faction-crew", "party-slots"]) {
  const doc = docWith(`{#${id}}`);
  const head = doc?.body.match(new RegExp(`^#{2,4} (.+?) \\{#${id}\\}`, "m"));
  const blocks = [];
  // A rule or note box is part of the rule, so it's kept without its fence.
  const text = doc && head ? sectionOf(doc.body, id).replace(/^:::(?:rule|note)(?:\{[^}\n]*\})?\n([\s\S]*?)\n:::$/gm, "$1") : "";
  for (const block of text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    if (/^(#|:::|\|)/.test(block) || blocks.length >= 6) break;
    blocks.push(block);
  }
  if (!blocks.length) companionWarn(`can't find the rule #${id} to show on a tap`);
  else rules[id] = { title: curly(head[1].replace(/[*_]/g, "").replace(/^Step \d+: /, "")), html: blockHtml(blocks.join("\n\n")) };
}
const linkTo = (id) => {
  const target = where.get(id);
  if (!target) companionWarn(`there's no #${id} in the book to link to`);
  return !target ? "/rules/" : target.own ? pageFor.get(target.page) : `${pageFor.get(target.page)}#${id}`;
};
const companionLinks = Object.fromEntries(
  ["s-round", "s-telegraphs", "s-answering", "s-aura", "getting-it-back", "s-tracks", "s-roots", "s-permissions", "s-building-die", "s-armour", "s-armour-quality", "s-blaze", "s-healing", "s-conditions", "s-bonds", "s-trouble", "steps-into-dice",
    "s-splitting", "s-teamwork", "s-extra-actions", "s-going-beyond", "s-the-roll", "s-defending", "s-defend", "s-intercept", "s-vulnerable", "s-fear-gets-through", "s-actions",
    "s-consequences", "s-aspiration", "s-pregens", "s-how-archetypes", "s-abilities", "s-attunement", "attunement-stages", "s-carrying", "s-intents", "how-permissions-stack",
    "s-quick", "s-title-ideas", "s-title", "s-writing-permissions", "the-quick-test", "permission-ideas", "s-step-roots", "s-items", "s-boons",
    "the-item-list", "catches-12", "s-starting-numbers", "s-connect", "what-you-can-do-with-a-slot", "recover", "grow", "s-downtime-attunement", "s-downtime-threads", "s-playing-the-strain", "s-summoning"]
    .map((id) => [id, linkTo(id)]),
);
for (const a of build?.archetypes ?? []) if (a.id) companionLinks[a.id] = linkTo(a.id);
for (const idea of build?.ideas ?? []) companionLinks[idea.id] = linkTo(idea.id);
for (const id of Object.keys(rules)) companionLinks[id] ??= linkTo(id);

// The Learn deck (/learn/): the core rules as cards, read the same way the
// tests read them (scripts/learn.mjs). A card that can't be read, or that
// teaches a section the book hasn't got, stops the build. A card out of book
// order or outside 40 to 120 words, and a rules change that's touched what a
// card teaches since the deck was last checked, get a note instead, so a
// change to the rules never waits on the deck but never leaves a card behind.
const learnWarn = (msg) => {
  console.warn(`  learn: ${msg}`);
  warnings += 1;
};
const learnNote = (msg) => console.warn(`  learn (to check): ${msg}`);
let learn = null;
if (learnDoc) {
  const { cards, problems } = readCards(learnDoc.body);
  for (const p of problems) learnWarn(p);
  const learnMd = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(boxes).use(links, where, pageFor, learnDoc.path).use(remarkSmartypants).use(remarkRehype).use(rehypeStringify);
  const chapterOf = new Map(docs.map((d, i) => [d.path, { doc: d, i, chapter: chapters[i] }]));
  let behind = [-1, -1];
  const out = [];
  for (const card of cards) {
    const target = where.get(card.teaches);
    const home = target && chapterOf.get(target.page);
    if (!home) {
      learnWarn(`the card “${card.title}” teaches #${card.teaches}, and no chapter has that id`);
      continue;
    }
    const { doc, i, chapter } = home;
    const at = target.own ? [i, -1] : [i, doc.body.indexOf(`{#${card.teaches}}`)];
    if (at[0] < behind[0] || (at[0] === behind[0] && at[1] < behind[1])) learnNote(`“${card.title}” teaches a section that comes before the card ahead of it, and the cards go in book order`);
    behind = at;
    if (card.words < CARD_WORDS[0] || card.words > CARD_WORDS[1]) learnNote(`“${card.title}” is ${card.words} words, and a card's ${CARD_WORDS[0]} to ${CARD_WORDS[1]}`);
    const file = learnMd.processSync(card.text);
    for (const msg of file.messages) learnWarn(`“${card.title}”: ${msg.message}`);
    const head = doc.body.match(new RegExp(`^#{2,4} (.+?) \\{#${card.teaches}\\}`, "m"));
    out.push({
      id: card.id,
      title: curly(card.title),
      teaches: card.teaches,
      html: String(file).trim(),
      words: card.words,
      example: Boolean(card.example),
      chapter: { slug: chapter.slug, title: chapter.title },
      section: { title: head ? plain(head[1]) : chapter.title, url: target.own ? pageFor.get(doc.path) : `${pageFor.get(doc.path)}#${card.teaches}` },
    });
  }
  const change = newestChange(changes.body);
  const stale = staleCards(cards, change, learnDoc.meta.checked ? String(learnDoc.meta.checked) : "", (id) => reachOf(docs, id));
  if (stale.length) {
    learnNote(`the ${change.title.replace(/:.*$/, "")} change touches what ${stale.length === 1 ? "this card teaches" : `these ${stale.length} cards teach`}: ${stale.map((c) => `“${c.title}” (#${c.teaches})`).join(", ")}. Check ${stale.length === 1 ? "it" : "them"} against the chapters, then set checked: ${change.iso} at the top of content/learn.md.`);
  }
  learn = { title: curly(learnDoc.meta.title), checked: learnDoc.meta.checked ? String(learnDoc.meta.checked) : null, cards: out };
  console.log(`learn: ${out.length} cards`);
}

// The pop-ups' openings, one file the service worker keeps for offline.
const none = [...linkTargets].filter((id) => where.has(id) && !Object.keys(openings).some((k) => k.endsWith(`#${id}`) || k === linkTo(id))).length;
writeFileSync(join(ROOT, "public", "openings.json"), JSON.stringify({ v: 1, s: openings }));
console.log(`openings.json: ${Object.keys(openings).length} sections for the pop-ups (${none} linked sections start with a table, an example or a heading, so their links open the page)`);
// The places, people and tables the World screen brings in, kept offline too.
if (worldBook) {
  writeFileSync(join(ROOT, "public", "world-book.json"), JSON.stringify(worldBook));
  console.log(`world-book.json: ${worldBook.places.length} places with ${worldBook.places.reduce((n, p) => n + p.people.length, 0)} people in them, ${worldBook.threats.length} threats and ${worldBook.tags.length} tags`);
}
// The world builder's tables (notes/builder-plan.md), read off
// content/world-tables/ by scripts/world-tables.mjs and checked against the
// book, for the World screen to deal from and the service worker to keep.
// Until the folder's there, there's no file. Once it is, a file missing
// from it stops the build like any other problem.
const tablesDir = join(ROOT, "content", "world-tables");
const tablesOut = join(ROOT, "public", "world-tables.json");
if (existsSync(tablesDir)) {
  const { src, problems: unread } = readTablesDir(tablesDir);
  const { tables, problems } = worlds && worldBook ? compileTables(src, bookFor(worlds, worldBook, party)) : { tables: null, problems: ["can't check them without the faction board and the Threat Builder from the book"] };
  for (const p of [...unread, ...problems]) companionWarn(`world tables: ${p}`);
  if (tables) {
    tables.at = BUILT;
    writeFileSync(tablesOut, JSON.stringify(tables));
    const packs = Object.values(tables.packs);
    console.log(`world-tables.json: ${packs.filter((p) => p.kind === "era").length} eras and ${packs.filter((p) => p.kind === "twist").length} twists to deal from`);
  } else rmSync(tablesOut, { force: true });
} else {
  rmSync(tablesOut, { force: true });
  console.log("world-tables.json: no tables yet (content/world-tables/), so the world builder has nothing to deal from");
}
// Whole worlds (notes/builder-plan.md, A whole world): written whole rather
// than dealt, read off content/worlds/ by scripts/worlds.mjs and checked
// against the book's sizes and Appendix B's assets, a file to a year in
// public/worlds/, for /worlds/ to show. Nothing in them goes into book.json.
const worldsDir = join(ROOT, "content", "worlds");
const worldsOut = join(ROOT, "public", "worlds");
const wholeWorlds = {};
rmSync(worldsOut, { recursive: true, force: true });
if (existsSync(worldsDir)) {
  const { src, problems: unread } = readWorldsDir(worldsDir);
  for (const p of unread) companionWarn(`worlds: ${p}`);
  mkdirSync(worldsOut, { recursive: true });
  const unbuilt = new Set();
  for (const w of src) {
    const { world, problems, notes } = compileWorld(w, { assets: worlds?.assets ?? [], sizes: worlds?.sizes ?? [], regions: existsSync(tablesOut) ? JSON.parse(readFileSync(tablesOut, "utf8")).regions : {} });
    for (const p of problems) companionWarn(`world ${w.universe} ${w.year}: ${p}`);
    if (!world) {
      unbuilt.add(w.universe);
      continue;
    }
    world.at = BUILT;
    writeFileSync(join(worldsOut, `${world.id}.json`), JSON.stringify(world));
    (wholeWorlds[world.universe] ??= []).push(world);
    const pages = world.places.length ? `, ${world.places.length} places, ${world.people.length} people, ${Object.keys(world.map?.pins ?? {}).length} pins on its map` : "";
    console.log(`worlds/${world.id}.json: ${world.factions.length} factions${pages}, ${world.history.length} lines of history, ${Math.round(world.size / 1000)}k of a world brought in${notes.length ? ` (${notes.join("; ")})` : ""}`);
  }
  // What a universe's years share (world.yaml's both), and the year its page
  // opens on, once every year's compiled (a year that didn't has said why).
  for (const [u, list] of Object.entries(wholeWorlds)) {
    if (unbuilt.has(u)) continue;
    for (const p of checkYears(src.find((w) => w.universe === u)?.world, list)) companionWarn(`world ${u}: ${p}`);
  }
}
// The pages under /worlds/ read every year of each universe from here.
mkdirSync(join(ROOT, "src", "generated"), { recursive: true });
writeFileSync(join(ROOT, "src", "generated", "worlds.json"), JSON.stringify(wholeWorlds));
// What the World screen offers to bring into a campaign (stage 14), and what
// the Worker knows is a whole world's: each year's id, its title and when it
// starts, whose it is, and what's in it, but nothing of the world itself.
writeFileSync(join(ROOT, "src", "generated", "worlds-index.json"), JSON.stringify(Object.values(wholeWorlds).flat().map((w) => ({
  id: w.id, universe: w.universe, name: w.name, title: w.title, when: w.when, own: w.own, whose: w.whose, notices: w.notices, recipe: w.recipe,
  factions: w.factions.length, places: w.places.length, people: w.people.length, map: Boolean(w.map), lines: w.history.length,
}))));

const outDir = join(ROOT, "src", "generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "book.json"),
  JSON.stringify({
    updated: changes.meta.updated ? String(changes.meta.updated) : null,
    parts,
    chapters,
    changes: { title: curly(changes.meta.title), html: changesOut.html, headings: changesOut.headings },
    crew,
    crewLink: crewDoc ? `${pageFor.get(crewDoc.path)}#s-pregens` : "/rules/",
    tagLinks,
    companion: { conditions, links: companionLinks, build, rules, party, worlds, places },
    learn,
  }),
);
mkdirSync(join(ROOT, "public", "figures"), { recursive: true });
cpSync(join(ROOT, "content", "figures"), join(ROOT, "public", "figures"), { recursive: true });
console.log(`book.json: ${chapters.length} chapters and the change log, ${warnings} warnings`);
if (warnings) process.exitCode = 1;
