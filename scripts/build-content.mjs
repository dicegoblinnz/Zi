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
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
import { traitInfo } from "../src/companion/grow.js";
import { CARD_WORDS, newestChange, reachOf, readCards, staleCards } from "./learn.mjs";

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
// in it that links point at (look) when it's one of the chapters.
function render(doc, where, pageFor, look = null) {
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
  if (!look) return { html: String(file), headings, warnings: file.messages.length };
  const openings = openingsOf(tree, look, (nodes) => processor.stringify({ type: "root", children: nodes }));
  const sections = sectioned(tree);
  return { html: processor.stringify(tree), headings, sections, openings, warnings: file.messages.length };
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
  let h2 = null;
  let h3 = null;
  for (const node of tree.children) {
    const level = node.type === "element" && node.properties?.id ? { h2: 2, h3: 3 }[node.tagName] : undefined;
    if (!level) {
      if (h3) h3.children.push(node);
      else if (h2) h2.children.push(node);
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
  tree.children = out;
  return list;
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
      else if (!blocks.length && first && isBox(first) && !cls(first).includes("box-example")) blocks = openingBlocks(first.children);
      name = textOf(node);
    } else if (isBox(node)) {
      blocks = openingBlocks(node.children);
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
// character companion always match the book. Each sheet becomes full data:
// Titles and their archetypes, traits, set actions with the lines on them,
// what they carry, attuned things, numbers, threads, Aspiration and trouble.
// Every line a character has gets a key, so a set action lists its lines and
// the companion can offer the rest for 1 Aura.
const ORDINAL = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, sixth: 5 };
const COUNT = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const plain = (s = "") => curly(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*/g, "").trim());
const italics = (s = "") => [...s.matchAll(/\*([^*]+)\*/g)].map((m) => plain(m[1]));
const dropStop = (s = "") => s.trim().replace(/\.$/, "");
// Split on the commas that aren't inside *italics*.
const commaList = (s) => s.split(/,\s*(?=(?:[^*]*\*[^*]*\*)*[^*]*$)/).map((x) => x.trim()).filter(Boolean);

function crewFrom(doc, ctx) {
  const crew = [];
  for (const m of doc.body.matchAll(/^:::sheet\[([^:\]]+): ([^\]]+)\]\n([\s\S]*?)\n:::$/gm)) {
    crew.push(sheetFrom(m[1], m[2], m[3], m[0], ctx));
  }
  return crew;
}

function sheetFrom(name, titleText, body, block, ctx) {
  const warn = (msg) => ctx.warn(`${name}'s sheet: ${msg}`);
  const rows = body.split("\n");
  const field = {};
  for (const row of rows) {
    const f = row.match(/^\*\*([^*]+?):\*\* (.*)$/);
    if (f) field[f[1]] = f[2].trim();
  }
  const labelled = (re) => Object.keys(field).find((k) => re.test(k));
  for (const label of ["Plays like", "Traits", "Set actions", "Carries", "Numbers", "Threads", "Aspiration"]) {
    if (!(label in field)) warn(`there's no ${label} line`);
  }

  const lines = [];
  const line = (kind, label, extra = {}) => {
    const key = `l${lines.length}`;
    lines.push({ key, kind, label, ...extra });
    return key;
  };

  // Titles, each one an archetype with its permissions.
  const titles = [];
  for (const [label, value] of Object.entries(field)) {
    if (!/^\w+ Title$/.test(label)) continue;
    const t = value.match(/^\*([^*]+)\* \(([^)]+)\)\. Permissions: (.+?)\.?$/);
    if (!t) {
      warn(`can't read the ${label}`);
      continue;
    }
    if (!ctx.archetypes[t[2]]) warn(`there's no archetype called ${t[2]}`);
    titles.push({ name: plain(t[1]), archetype: t[2], archetypeId: ctx.archetypes[t[2]]?.id ?? null, perms: italics(t[3]) });
  }
  for (const t of titles) t.key = line("title", t.name);
  for (const t of titles) t.permissions = t.perms.map((p) => ({ text: p, key: line("permission", p, { title: t.name }) }));
  for (const t of titles) delete t.perms;

  // Each archetype once, with how many times it's taken: twice makes the +2 a +3.
  const taken = new Map();
  for (const t of titles) taken.set(t.archetype, (taken.get(t.archetype) ?? 0) + 1);
  const archetypes = [...taken].map(([arch, times]) => {
    const rule = ctx.archetypes[arch] ?? {};
    const bonus = times + 1;
    return {
      name: arch, id: rule.id ?? null, times, summary: rule.summary ?? "",
      aura: times > 1 && rule.aura ? rule.aura.replace(/\+2\b/, `+${bonus}`) : rule.aura ?? "",
      auraHtml: times > 1 && rule.auraHtml ? rule.auraHtml.replace(/\+2\b/, `+${bonus}`) : rule.auraHtml ?? "",
      bonus: /^\+2\b/.test(rule.aura ?? "") ? bonus : 0,
      resolve: rule.resolve ?? "", resolveHtml: rule.resolveHtml ?? "",
    };
  });

  // Traits are passive (27 Oct 2026): never a step, so never a line on a set
  // action. Each one's type has to be the list's.
  const traits = dropStop(field.Traits).split(" · ").filter(Boolean).map((s) => {
    const t = s.match(/^(.+?) \(([^)]+)\)$/);
    const traitName = curly(t ? t[1] : s);
    const rule = ctx.traits[traitName];
    if (!rule) warn(`there's no trait called ${traitName} in the list`);
    else if (t && t[2] !== rule.type) warn(`${traitName} says (${t[2]}), but it's ${rule.type} in the list`);
    return { name: traitName, type: t?.[2] ?? rule?.type ?? "", html: rule?.html ?? "", ...traitInfo(rule?.text) };
  });

  // What they carry: equipment and utility (n of 3), a keepsake, and the bag.
  const carry = { equipment: { items: [], max: 3, note: null }, utility: { items: [], max: 3, note: null }, keepsake: null, bag: { name: "a bag", max: 10 } };
  for (const seg of dropStop(field.Carries).split(" · ").filter(Boolean)) {
    const c = seg.match(/^(.+) \(([^()]+)\)$/);
    const info = c?.[2] ?? "";
    const kind = info.match(/^(equipment|utility|keepsake)\b/)?.[1] ?? c?.[1].match(/^no (equipment|utility)\b/)?.[1] ?? (/\bof 10$/.test(info) ? "bag" : null);
    if (!c || !kind) {
      warn(`can't read "${seg}" in what they carry`);
      continue;
    }
    const max = Number(info.match(/\bof (\d+)$/)?.[1] ?? 0);
    if (kind === "keepsake") carry.keepsake = plain(c[1]);
    else if (kind === "bag") carry.bag = { name: plain(c[1]), max: max || 10 };
    else {
      if (max) carry[kind].max = max;
      if (/^no /.test(c[1])) carry[kind].note = plain(c[1]);
      else carry[kind].items = c[1].split(", ").map(plain);
    }
  }
  for (const item of [...carry.equipment.items, ...carry.utility.items, ...(carry.keepsake ? [carry.keepsake] : [])]) line("kit", item);

  // Attuned things: each one's permissions, and its Catch if it took one.
  const attunedLabel = labelled(/^Attuned\b/);
  const stage = attunedLabel?.match(/\(([^)]+)\)/)?.[1] ?? null;
  const attuned = dropStop(attunedLabel ? field[attunedLabel] : "").split(" · ").filter(Boolean).map((seg) => {
    const a = seg.match(/^([^:*]+?)(?: \(([^)]+)\))?: (.+)$/);
    if (!a) {
      warn(`can't read the attuned "${seg}"`);
      return null;
    }
    let rest = a[3];
    const c = rest.match(/,? for its Catch, \*([^*]+)\*$/);
    if (c) rest = rest.slice(0, c.index);
    const thing = { name: plain(a[1]), props: a[2] ? plain(a[2]) : null, stage, catch: c ? plain(c[1]) : null };
    thing.permissions = italics(rest).map((p) => ({ text: p, key: line("attuned", p, { item: thing.name }) }));
    return thing;
  }).filter(Boolean);

  // Set actions. Each line on one has to be a Title, a permission, a trait or a
  // thing they carry, and the steps are 1 for the action and 1 for every line.
  const lineFor = (text) => {
    let m;
    if ((m = text.match(/^(?:her|his|their) (\w+) Title$/))) return titles[ORDINAL[m[1]]]?.key;
    if ((m = text.match(/^\*([^*]+)\*$/))) return lines.find((l) => (l.kind === "permission" || l.kind === "attuned") && l.label === plain(m[1]))?.key;
    if (traits.some((t) => t.name === curly(text))) return "trait";
    if ((m = text.match(/^(?:her|his|their) (.+)$/))) {
      const core = plain(m[1]).toLowerCase();
      const thing = attuned.find((a) => a.name.toLowerCase().includes(core));
      if (thing) return thing.permissions[0]?.key;
      return lines.find((l) => l.kind === "kit" && l.label.toLowerCase().includes(core))?.key;
    }
    return undefined;
  };
  const actions = dropStop(field["Set actions"]).split(" · ").filter(Boolean).map((seg) => {
    const s = seg.match(/^(.+?) (\d+) \(([^)]+)\)(?:: (.+))?$/);
    if (!s) {
      warn(`can't read the set action "${seg}"`);
      return null;
    }
    const steps = Number(s[2]);
    const on = [];
    for (const text of s[4] ? commaList(s[4]) : []) {
      const key = lineFor(text);
      if (key === "trait") warn(`${text} is a trait, on ${s[1]}, and a trait's never a step, so it never goes on a set action`);
      else if (key) on.push(key);
      else warn(`can't tell what "${text}" is, on ${s[1]}`);
    }
    const die = diceLabel(stepsToDice(steps));
    if (steps !== on.length + 1) warn(`${s[1]} says ${steps} steps, but its lines and the action make ${on.length + 1}`);
    if (s[3] !== die) warn(`${s[1]} is ${steps} steps, which is ${die}, but the sheet says ${s[3]}`);
    return { name: curly(s[1]), steps, die: s[3], lines: on };
  }).filter(Boolean);

  // Defend is a set action like the rest, and every sheet has one.
  if (!actions.some((a) => a.name === "Defend")) warn("there's no Defend set action");
  // A permission, on a Title or an attuned thing, goes on two set actions at
  // most, and a plain thing they carry goes on one (27 Oct 2026).
  for (const l of lines) {
    const on = actions.filter((a) => a.lines.includes(l.key)).map((a) => a.name);
    const most = l.kind === "kit" ? 1 : l.kind === "permission" || l.kind === "attuned" ? 2 : Infinity;
    if (on.length > most) warn(`${l.label} is on ${on.join(", ")}, and ${l.kind === "kit" ? "a plain thing goes on one set action" : "a permission goes on two at most"}`);
  }

  const n = field.Numbers ?? "";
  const find = (re, what) => {
    const m = n.match(re);
    if (!m && what) warn(`can't find ${what} in the numbers`);
    return m;
  };
  const conf = find(/Confidence starts every scene on d(\d+)(?: \(([^)]+)\))?(?:, or d(\d+) in (.+?) when (?:they fit|it fits) the scene)?/, "Confidence");
  // The wound die is the Hurt track: it starts at d2, and a note in brackets
  // says what changes it, like Bram's Unyielding.
  const wound = find(/\bWound die d(\d+)(?: \(([^)]+)\))?/, "the wound die");
  if (/\bArmour d\d|\bHurt \w+ bars?\b/.test(n)) warn("the numbers still have Armour or Hurt bars, and the rules have Defend and a wound die instead");
  const note = (re) => (n.match(re)?.[1] ? curly(n.match(re)[1]) : null);
  const woundNote = wound?.[2] ? curly(wound[2]) : null;
  const numbers = {
    aura: Number(find(/\bAura (\d+)/, "Aura")?.[1] ?? 5),
    resolve: Number(find(/\bResolve (\d+)/, "Resolve")?.[1] ?? titles.length),
    stride: Number(find(/\bStride (\d+)/, "Stride")?.[1] ?? 3),
    strideNote: note(/\bStride \d+ \(([^)]+)\)/),
    confidence: Number(conf?.[1] ?? 6),
    confidenceNote: conf?.[2] ? curly(conf[2]) : null,
    dressed: conf?.[3] ? { die: Number(conf[3]), what: plain(conf[4]) } : null,
    wound: Number(wound?.[1] ?? 2),
    woundNote,
    // How many Hurts a scene don't move the wound die, from the sheet's note
    // or a trait that says so (Unyielding).
    shrug: Math.max(shrugOf(woundNote), ...traits.map((t) => shrugOf(ctx.traits[t.name]?.text))),
  };

  // Threads by person. The note in brackets after each one says what kind it
  // is, bond or hostile, whose words it is when it's someone else's, and
  // whether it's strained: (bond), (Dorrie's, hostile), (bond, strained).
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

  const plays = field["Plays like"] ?? "";
  const named = [...new Set([...plays.matchAll(/\[([^\]]+)\]\(#a-[a-z-]+\)/g)].map((a) => a[1]))];
  const twice = named.length === 1 && /\btwice\b/.test(plays);
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    title: curly(titleText),
    blurb: plain(rows[0]),
    archetypes: twice ? [`${named[0]}, twice`] : named,
    hash: createHash("sha1").update(block).digest("hex").slice(0, 8),
    pronoun: troubleLabel?.split(" ").pop() ?? "them",
    playsLike: ctx.inline(plays),
    titles, archetypeRules: archetypes, traits, actions, lines, carry, attuned, numbers, threads, crewQs,
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
  const forLine = new Map(tableRows(picking).map((r) => [plain(r[0]), plain(r[1] ?? "")]));
  for (const m of doc.body.matchAll(/^## (.+?) \{#(a-[a-z-]+)\}\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
    const [, archetype, id, text] = m;
    const aura = text.match(/^\*\*1 Aura:\*\* (.+)$/m)?.[1] ?? null;
    const resolve = text.match(/^\*\*1 Resolve:\*\* (.+)$/m)?.[1] ?? null;
    if (!forLine.get(archetype)) companionWarn(`the ${archetype} archetype isn't in the table in Picking Your Archetypes, so its card in the builder has nothing to say what it's for`);
    out[archetype] = {
      id, summary: inline(text.trim().split(/\n\s*\n/)[0]), for: forLine.get(archetype) ?? "",
      aura: aura ? plain(aura) : null, auraHtml: aura ? inline(aura) : null,
      resolve: resolve ? plain(resolve) : null, resolveHtml: resolve ? inline(resolve) : null,
    };
  }
  return out;
}

// The traits list in Building Your Character: name, type and what it does.
function traitsFrom(doc, inline) {
  const out = {};
  const list = doc.body.split(/^### The \d+ traits.*$/m)[1]?.split(/^## /m)[0] ?? "";
  for (const m of list.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \|$/gm)) out[curly(m[1])] = { type: m[2], text: m[3], html: inline(m[3]) };
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

  // Appendix B's assets, to pick from.
  const assets = [];
  for (const [id, power] of [["assets-people", true], ["assets-reach", false], ["assets-places", false], ["assets-influence", false], ["assets-odd", false]]) {
    const group = curly(assetsDoc.body.match(new RegExp(`^### (.+?) \\{#${id}\\}`, "m"))?.[1] ?? "");
    const rows = tablesOf(sectionOf(assetsDoc.body, id))[0]?.rows ?? [];
    if (!group || !rows.length) warn(`can't read Appendix B's ${id.replace("assets-", "")} assets`);
    for (const r of rows) assets.push({ group, text: curly(plain(r[0])), does: curly(plain(r[1] ?? "")), power: power || /\+1 Power/.test(r[1] ?? "") });
  }
  return { boards, build, sizes, assets, link: `${pageFor.get(factionsDoc.path)}#s-faction-board` };
}

// What the character builder offers, read off Building Your Character and the
// Title ideas so it always matches the book: the Quick Build's steps, the
// ideas, every trait and the number it changes, what you can carry, the Catch
// ideas, the quick test, permission ideas and the Connect questions.
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

// A trait or a note that says the first Hurt (or the first two) you take each
// scene doesn't move your wound die, like Unyielding. It's read loosely, so a
// reworded rule still counts: how many it covers, or 0.
function shrugOf(text = "") {
  const m = String(text ?? "").match(/\bfirst (?:(two|three) )?Hurts?\b[^.|]*?\b(?:doesn['’]t|don['’]t|does not|do not|won['’]t|never)\b[^.|]*?\b(?:move|put|step|go|raise)/i);
  return m ? COUNT[m[1]?.toLowerCase()] ?? 1 : 0;
}

function traitEffects(text) {
  const e = {};
  if (/\bAura maximum is one higher\b/i.test(text)) e.aura = 1;
  const shrug = shrugOf(text);
  if (shrug) e.shrug = shrug;
  const move = text.match(/\+(\d+) units? of movement\b/i);
  if (move) e.stride = Number(move[1]);
  if (/\bcarry one more utility item\b/i.test(text)) e.utility = 1;
  if (/\bstart every scene a size up on Confidence\b/i.test(text)) e.confidence = 1;
  // Style: clothes that fit start you two sizes up, not one.
  if (/\bclothes that fit the scene start you two sizes up\b/i.test(text)) e.dressed = 1;
  // Tireless: three downtime slots, not two.
  if (/\bthree downtime slots\b/i.test(text)) e.slots = 1;
  return e;
}

// A trait's Passive or Triggered (27 Oct 2026), and what else the phone needs
// to know about it is traitInfo, in src/companion/grow.js.
const TRAIT_TYPES = ["Passive", "Triggered"];

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
      titles: italics(field.Titles), permissions: italics(field.Permissions), traits: dots(field.Traits).map(curly),
      beyond: dots(field["Going beyond"]).map(plain), trouble: italics(field.Trouble),
    });
  }

  const traits = [];
  let kind = "";
  const list = rulesDoc.body.split(/^### The \d+ traits.*$/m)[1]?.split(/^## /m)[0] ?? "";
  for (const m of list.matchAll(/^#### (.+?)(?: \{#[^}]+\})?$|^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \|$/gm)) {
    if (m[1]) {
      kind = curly(m[1]);
      continue;
    }
    // A trait's passive (27 Oct 2026): Passive or Triggered, and never a step.
    if (!TRAIT_TYPES.includes(m[3])) warn(`the trait ${m[2]} is ${m[3]}, and a trait's ${TRAIT_TYPES.join(" or ")}`);
    if (/\bsteps?\b/i.test(m[4].replace(/\bsteps? (up|down)\b/gi, ""))) warn(`the trait ${m[2]} talks about steps, and a trait's never a step`);
    traits.push({ name: curly(m[2]), type: m[3], group: kind, html: inline(m[4]), ...traitInfo(m[4]), effects: traitEffects(m[4]) });
  }
  const known = new Set(traits.map((t) => t.name));
  for (const idea of ideas) for (const t of idea.traits) if (!known.has(t)) warn(`the ${idea.name} Title idea suggests ${t}, which isn't in the traits list`);

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
    traits,
    items: tableRows(sectionOf(body, "the-item-list")).map((r) => ({ group: plain(r[0]), items: dots(r[1]).map(plain) })),
    usedUp: tableRows(sectionOf(body, "consumables-20")).map((r) => ({ name: plain(r[0]), html: inline(r[1]) })),
    keepsakes: tableRows(sectionOf(body, "keepsakes-10")).map((r) => ({ name: plain(r[0]), text: plain(r[1]) })),
    catches: tableRows(sectionOf(body, "catches-12")).map((r) => ({ name: plain(r[1]), text: plain(r[2]) })),
    quickTest: listItems(sectionOf(body, "the-quick-test")).map(inline),
    permIdeas: tableRows(sectionOf(body, "permission-ideas")).map((r) => ({ for: plain(r[0]), perms: italics(r[1]) })),
    connect: listItems(sectionOf(body, "s-connect")).map(curly),
  };
  const expect = { quick: 8, quickTest: 4, catches: 12, connect: 10 };
  for (const [key, n] of Object.entries(expect)) if (build[key].length !== n) warn(`the builder expected ${n} ${key}, found ${build[key].length}`);
  for (const [key, n] of Object.entries({ archetypes: 10, ideas: 20, traits: 40, items: 4, usedUp: 10, keepsakes: 5, permIdeas: 4 })) {
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
const chapters = docs.map((doc, i) => {
  const look = { targets: linkTargets, page: pageFor.get(doc.path), title: curly(doc.meta.title), chapterId: doc.meta.id };
  const out = render(doc, where, pageFor, look);
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
    prev: i > 0 ? { slug: docs[i - 1].meta.slug, title: curly(docs[i - 1].meta.title) } : null,
    next: i < docs.length - 1 ? { slug: docs[i + 1].meta.slug, title: curly(docs[i + 1].meta.title) } : null,
  };
});
const changesOut = render(changes, where, pageFor);
warnings += changesOut.warnings;

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
  traits: docWith("{#s-traits}") ? traitsFrom(docWith("{#s-traits}"), inline) : {},
};
const crewDoc = docWith("{#s-pregens}");
const crew = crewDoc ? crewFrom(crewDoc, ctx) : [];
if (crew.length !== 6) companionWarn(`expected the six crew sheets, found ${crew.length}`);
checkMirrors(crew, companionWarn);
const buildDoc = docWith("{#s-traits}");
const ideasDoc = docWith("{#s-quick}");
const build = buildDoc && ideasDoc ? buildFrom(buildDoc, ideasDoc, ctx.archetypes, inline, (msg) => companionWarn(`builder: ${msg}`)) : null;
if (!build) companionWarn("can't find Building Your Character or the Quick Build for the builder");
const conditions = docWith("{#s-conditions-list}") ? conditionsFrom(docWith("{#s-conditions-list}"), inline) : [];
if (conditions.length < 10) companionWarn(`found only ${conditions.length} conditions in Conflict`);
const partyDoc = docWith("{#s-party-faction}");
const party = partyDoc ? partyFrom(partyDoc, (msg) => companionWarn(`party sheet: ${msg}`)) : null;
if (!party) companionWarn("can't find The Party Sheet for the party sheet");
// The faction board's official content: the boards to bring in, Building a
// Faction's tables and Appendix B's assets.
const worldDocs = { factionsDoc: docWith("{#s-faction-build}"), steepDoc: docWith("{#the-four-great-powers}"), framesDoc: docWith("{#s-frame-brinewake}"), assetsDoc: docWith("{#faction-strength}") };
const worlds = Object.values(worldDocs).every(Boolean) ? worldsFrom(worldDocs, pageFor, (msg) => companionWarn(`board: ${msg}`)) : null;
if (!worlds) companionWarn("can't find Factions, the Steeplands, Frames or Appendix B's assets for the faction board");
// The rules the companion shows on a tap, read off the chapters so they match
// the book and read offline: each one's opening, up to its first example,
// table or subheading.
const blockHtml = (text) => {
  const file = inlineMd.processSync(text);
  for (const msg of file.messages) companionWarn(msg.message);
  return String(file).trim();
};
const rules = {};
for (const id of ["s-round", "s-telegraphs", "s-answering", "s-the-roll", "s-intents", "s-splitting", "s-going-beyond", "s-teamwork", "s-extra-actions", "s-aura", "s-resolve", "s-confidence", "s-armour",
  "s-defending", "s-defend", "s-intercept", "s-consequences", "s-fear-gets-through", "s-blaze", "s-healing", "s-vulnerable", "s-conditions", "s-bonds", "s-trouble", "s-aspiration", "s-good-aspiration", "how-permissions-stack",
  "your-slots", "s-downtime-rolls", "s-goal", "s-good-goal", "s-climb", "s-projects", "s-crew-size", "s-crew-tags", "s-crew-wealth", "s-crew-grows", "s-party-resources",
  "s-faction-board", "s-wealth", "s-faction-bonds", "s-agendas", "when-an-agenda-happens", "s-standing", "s-mini-factions", "s-faction-build"]) {
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
  ["s-round", "s-telegraphs", "s-answering", "s-aura", "s-resolve", "s-confidence", "s-armour", "s-blaze", "s-healing", "s-conditions", "s-bonds", "s-trouble", "steps-into-dice",
    "s-splitting", "s-teamwork", "s-extra-actions", "s-going-beyond", "s-the-roll", "s-defending", "s-defend", "s-intercept", "s-vulnerable", "s-fear-gets-through",
    "s-consequences", "s-aspiration", "s-pregens", "s-set-actions", "s-how-archetypes", "s-attunement", "s-carrying", "s-traits", "s-intents",
    "s-quick", "s-title-ideas", "s-title", "s-writing-permissions", "the-quick-test", "permission-ideas", "s-step-set-actions", "s-items",
    "the-item-list", "catches-12", "s-starting-numbers", "s-connect", "what-you-can-do-with-a-slot", "attunement-stages", "s-downtime-threads", "s-playing-the-strain"]
    .map((id) => [id, linkTo(id)]),
);
for (const c of crew) for (const a of c.archetypeRules) if (a.id) companionLinks[a.id] = linkTo(a.id);
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
    companion: { conditions, links: companionLinks, build, rules, party, worlds },
    learn,
  }),
);
mkdirSync(join(ROOT, "public", "figures"), { recursive: true });
cpSync(join(ROOT, "content", "figures"), join(ROOT, "public", "figures"), { recursive: true });
console.log(`book.json: ${chapters.length} chapters and the change log, ${warnings} warnings`);
if (warnings) process.exitCode = 1;
