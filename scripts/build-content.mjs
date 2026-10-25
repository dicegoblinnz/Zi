// Turn the rules master (content/) into the data the website is built from.
//
// Every chapter's Markdown becomes HTML here, with the book's own rules:
//   ## Heading {#id}            a heading with a fixed id
//   :::example[Title]{#id} … :::  boxes (example, rule, note, quote, sheet,
//                                  threat, place, sheet-fields, index-section)
//   [text](#id)                 a link to any id in the book, rewritten to
//                                the page that holds it
// It writes src/generated/book.json and copies the figures into public/.
import { createHash } from "node:crypto";
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
import { diceLabel, stepsToDice } from "../src/companion/dice.js";
import { threadNote } from "../src/companion/threads.js";

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

  const traits = dropStop(field.Traits).split(" · ").filter(Boolean).map((s) => {
    const t = s.match(/^(.+?) \(([^)]+)\)$/);
    const traitName = curly(t ? t[1] : s);
    const rule = ctx.traits[traitName];
    if (!rule) warn(`there's no trait called ${traitName} in the list`);
    const step = /\+1 step\b/.test(rule?.text ?? "");
    return {
      name: traitName, type: t?.[2] ?? rule?.type ?? "", html: rule?.html ?? "", step,
      aura: Number(rule?.text.match(/\bGain (\d+) Aura\b/)?.[1] ?? 0),
      key: line("trait", traitName, { step }),
    };
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
    const trait = lines.find((l) => l.kind === "trait" && l.label === curly(text));
    if (trait) return trait.key;
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
      if (key) on.push(key);
      else warn(`can't tell what "${text}" is, on ${s[1]}`);
    }
    const die = diceLabel(stepsToDice(steps));
    if (steps !== on.length + 1) warn(`${s[1]} says ${steps} steps, but its lines and the action make ${on.length + 1}`);
    if (s[3] !== die) warn(`${s[1]} is ${steps} steps, which is ${die}, but the sheet says ${s[3]}`);
    return { name: curly(s[1]), steps, die: s[3], lines: on };
  }).filter(Boolean);

  // Defend is a set action like the rest, and every sheet has one.
  if (!actions.some((a) => a.name === "Defend")) warn("there's no Defend set action");

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
// spend is, from The Archetypes.
function archetypesFrom(doc, inline) {
  const out = {};
  for (const m of doc.body.matchAll(/^## (.+?) \{#(a-[a-z-]+)\}\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
    const [, archetype, id, text] = m;
    const aura = text.match(/^\*\*1 Aura:\*\* (.+)$/m)?.[1] ?? null;
    const resolve = text.match(/^\*\*1 Resolve:\*\* (.+)$/m)?.[1] ?? null;
    out[archetype] = {
      id, summary: inline(text.trim().split(/\n\s*\n/)[0]),
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
  return e;
}

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
    traits.push({
      name: curly(m[2]), type: m[3], group: kind, html: inline(m[4]), step: /\+1 step\b/.test(m[4]),
      aura: Number(m[4].match(/\bGain (\d+) Aura\b/)?.[1] ?? 0), effects: traitEffects(m[4]),
    });
  }
  const known = new Set(traits.map((t) => t.name));
  for (const idea of ideas) for (const t of idea.traits) if (!known.has(t)) warn(`the ${idea.name} Title idea suggests ${t}, which isn't in the traits list`);

  const body = rulesDoc.body;
  const build = {
    quick: listItems(sectionOf(ideasDoc.body, "s-quick")).map(inline),
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
  "s-defending", "s-defend", "s-intercept", "s-consequences", "s-fear-gets-through", "s-blaze", "s-healing", "s-vulnerable", "s-conditions", "s-bonds", "s-trouble", "s-aspiration", "how-permissions-stack",
  "your-slots", "s-downtime-rolls"]) {
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
    companion: { conditions, links: companionLinks, build, rules },
  }),
);
mkdirSync(join(ROOT, "public", "figures"), { recursive: true });
cpSync(join(ROOT, "content", "figures"), join(ROOT, "public", "figures"), { recursive: true });
console.log(`book.json: ${chapters.length} chapters and the change log, ${warnings} warnings`);
if (warnings) process.exitCode = 1;
