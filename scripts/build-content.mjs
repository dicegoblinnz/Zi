// Turn the rules master (content/) into the data the website is built from.
//
// Every chapter's Markdown becomes HTML here, with the book's own rules:
//   ## Heading {#id}            a heading with a fixed id
//   :::example[Title]{#id} … :::  boxes (example, rule, note, quote, sheet,
//                                  threat, place, sheet-fields, index-section)
//   [text](#id)                 a link to any id in the book, rewritten to
//                                the page that holds it
// It writes src/generated/book.json and copies the figures into public/.
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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

function render(doc, where, pageFor) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(boxes)
    .use(headingIds)
    .use(links, where, pageFor, doc.path)
    .use(remarkSmartypants)
    .use(remarkRehype)
    .use(wrapTables)
    .use(rehypeStringify);
  const file = processor.processSync({ value: doc.body, path: doc.path });
  for (const msg of file.messages) console.warn(`  ${doc.file}: ${msg.message}`);
  const headings = [];
  const tree = processor.runSync(processor.parse({ value: doc.body, path: doc.path }), { value: doc.body, path: doc.path });
  visit(tree, "element", (node) => {
    if (node.tagName === "h2" && node.properties?.id) headings.push({ id: node.properties.id, text: textOf(node) });
  });
  return { html: String(file), headings, warnings: file.messages.length };
}

// Titles and part blurbs come from front matter, so curl their apostrophes here.
const curly = (s) => (typeof s === "string" ? s.replace(/'/g, "\u2019") : s);

// The ready-made crew, read straight off their sheets so the home page
// always matches the book: name, Title, the one-line pitch and archetypes.
function crewFrom(doc) {
  const crew = [];
  const sheet = /^:::sheet\[([^:\]]+): ([^\]]+)\]\n\*([^\n]+)\*\n\n\*\*Plays like:\*\* ([^\n]+)/gm;
  for (const m of doc.body.matchAll(sheet)) {
    const plays = m[4];
    const archetypes = [...new Set([...plays.matchAll(/\[([^\]]+)\]\(#a-[a-z-]+\)/g)].map((a) => a[1]))];
    const twice = archetypes.length === 1 && /\btwice\b/.test(plays);
    crew.push({ name: m[1], title: curly(m[2]), blurb: curly(m[3]), archetypes: twice ? [`${archetypes[0]}, twice`] : archetypes });
  }
  return crew;
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

const pageFor = new Map(docs.map((d) => [d.path, `/rules/${d.meta.slug}/`]));
pageFor.set(changes.path, "/changes/");
const where = collectIds([...docs, changes]);

let warnings = 0;
const chapters = docs.map((doc, i) => {
  const out = render(doc, where, pageFor);
  warnings += out.warnings;
  const part = parts.find((p) => p.number === doc.meta.partNumber);
  return {
    slug: doc.meta.slug,
    title: curly(doc.meta.title),
    order: Number(doc.meta.order),
    partNumber: doc.meta.partNumber ?? null,
    partName: part?.name ?? null,
    updated: doc.meta.updated ? String(doc.meta.updated) : null,
    html: out.html,
    headings: out.headings,
    prev: i > 0 ? { slug: docs[i - 1].meta.slug, title: curly(docs[i - 1].meta.title) } : null,
    next: i < docs.length - 1 ? { slug: docs[i + 1].meta.slug, title: curly(docs[i + 1].meta.title) } : null,
  };
});
const changesOut = render(changes, where, pageFor);
warnings += changesOut.warnings;

const crewDoc = docs.find((d) => d.body.includes("{#s-pregens}"));
const crew = crewDoc ? crewFrom(crewDoc) : [];
if (crew.length !== 6) {
  console.warn(`  Expected the six crew sheets, found ${crew.length}`);
  warnings += 1;
}

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
  }),
);
mkdirSync(join(ROOT, "public", "figures"), { recursive: true });
cpSync(join(ROOT, "content", "figures"), join(ROOT, "public", "figures"), { recursive: true });
console.log(`book.json: ${chapters.length} chapters and the change log, ${warnings} warnings`);
if (warnings) process.exitCode = 1;
