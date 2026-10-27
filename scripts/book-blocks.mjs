// The book's own pieces, drawn the way they're used at the table, without
// touching the Markdown (Mo's 28 Oct pick, notes/reading-28oct.md):
//   :::place   what it is, its Challenge and scene clock as dice, then the
//              Scene, Telegraphs, Prep and Secret, each a tab on the page
//   :::threat  its Challenge as a die, tags as chips, telegraphs as the cards
//              the GM sends, its voice, and what's hidden sealed till opened
//   :::sheet   each **Label** line as its own field, with lists split onto
//              lines or chips, dice drawn, and a Secret sealed
// plus the dice in a table's die column, a rule box's name set as its title,
// and the crew's crests on an example.
// statBlocks() is a remark plugin (it reads each box's own Markdown, so the
// links and italics come through), and diceCells() and exampleCrews() are
// rehype plugins. Anything it can't read is a build warning, like the rest.
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { crest, die, mini } from "../src/kit/kit.js";
import { whoAndDoes } from "../src/companion/aims.js";

const SIZES = [2, 4, 6, 8, 10, 12];
const parser = unified().use(remarkParse);
const capFirst = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
const cls = (node) => node?.properties?.className ?? [];
export function textOf(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  return (node.children || []).map(textOf).join("");
}

// A bit of Markdown as phrasing nodes, so links and italics come through.
export function inl(md = "") {
  const first = parser.parse(String(md).trim()).children[0];
  return first?.type === "paragraph" ? first.children : [];
}
// The same, starting with a capital: a value on a line of its own.
function capped(md = "") {
  const nodes = inl(md);
  const first = (list) => {
    for (const n of list) {
      if (n.type === "text") return n;
      const inner = n.children && first(n.children);
      if (inner || n.type !== "text") return inner ?? null;
    }
    return null;
  };
  const t = first(nodes);
  if (t) t.value = capFirst(t.value);
  return nodes;
}
// Markdown nodes that turn into the element named, with these properties.
const el = (tag, props = {}, children = []) => ({ type: "paragraph", data: { hName: tag, hProperties: props }, children });
const txt = (value) => ({ type: "text", value });
// The kit's SVG, as it is.
const raw = (html) => ({ type: "paragraph", data: { hName: "span", hProperties: { className: ["zd-slot"] }, hChildren: [{ type: "raw", value: html }] }, children: [] });
const dieOf = (d, own = "them") => raw(die(d, { own, hide: true }));

const ICON = {
  crew: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/><path d="M12 8.5l3.5 3.5-3.5 3.5L8.5 12z"/></svg>',
  stake: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M12 7v5l3.4 2.2"/></svg>',
  place: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4s-7-6.8-7-11.8a7 7 0 0 1 14 0c0 5-7 11.8-7 11.8z"/><circle cx="12" cy="9.6" r="2.6"/></svg>',
  arrow: '<svg class="ic arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5"/></svg>',
  seal: '<svg class="mark" viewBox="0 0 34 34" aria-hidden="true"><path class="edge" d="M17 2l15 15-15 15L2 17z"/><path class="core" d="M17 10l7 7-7 7-7-7z"/></svg>',
  chev: '<svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
};

// The box's own Markdown, a paragraph at a time, with its label ("**Who's
// here** …") split off. Anything that isn't a paragraph is kept as it is.
function partsOf(node, src) {
  return node.children.filter((c) => c.position).map((c) => {
    const md = src.slice(c.position.start.offset, c.position.end.offset).replace(/\s*\n\s*/g, " ").trim();
    const m = c.type === "paragraph" ? md.match(/^\*\*([^*]+?):?\*\*:?\s+([\s\S]+)$/) : null;
    return { node: c, md, label: m ? m[1].replace(/:$/, "") : null, value: m ? m[2] : null };
  });
}
const dots = (s = "") => s.split(" · ").map((x) => x.trim()).filter(Boolean);

// A tag, as a chip. One in the Tag Reference is a button that says what it
// does (src/reading/blocks.js), and the chapter carries what it says.
function chip(name, ctx, extra = []) {
  const base = name.replace(/\s*×\s*\d+$/, "").trim();
  const info = ctx.tags?.get(base.replace(/'/g, "’").toLowerCase());
  if (info) {
    ctx.used[info.name] = { k: info.kind, d: info.does };
    return el("button", { type: "button", className: ["tag", ...extra], dataTag: info.name, ariaExpanded: "false" }, [txt(name)]);
  }
  return el("span", { className: ["tag", ...extra] }, [txt(name)]);
}
const tagNames = (md = "") => [...md.matchAll(/\*([^*]+)\*/g)].map((m) => m[1].trim());
const chips = (md, ctx) => el("p", { className: ["tags"] }, tagNames(md).map((n) => chip(n, ctx)));
// A list that's all tags or permissions, each one in italics on its own.
const allItalic = (items) => items.length > 0 && items.every((x) => /^\*[^*]+\*\.?$/.test(x));

// A telegraph, as the card the GM sends: who, what they do, its die, and
// what it's aimed at, with what it does if it lands.
function telegraph(line, owner, ctx, warn) {
  const m = line.match(/^\*(.+)\* \(d(\d+), (.+)\)\.?$/);
  const d = Number(m?.[2]);
  if (!m || !SIZES.includes(d)) {
    warn(`can't read the telegraph ${line.slice(0, 50)} (like *She swings.* (d8, Defend))`);
    return null;
  }
  let { who, does } = whoAndDoes(m[1], owner);
  if (/^(He|She|It|They)$/.test(who)) who = owner;
  const parts = m[3].split(", ");
  const lands = [];
  while (parts.length > 1 && /^[A-Z]/.test(parts[parts.length - 1]) && !/^(Defend|Confidence)$/.test(parts[parts.length - 1])) lands.unshift(parts.pop());
  const at = parts.join(", ");
  const kind = /^(Defend|Confidence)$/.test(at) ? "crew" : /, (Defend|Confidence)$/.test(at) || /^(everyone|whoever|anyone)\b/i.test(at) ? "place" : "stake";
  return el("article", { className: ["tele"] }, [
    el("p", { className: ["tele-k"] }, [txt("Telegraph")]),
    el("div", { className: ["tele-b"] }, [dieOf(d), el("div", {}, [el("p", { className: ["tele-who"] }, [txt(who)]), el("p", { className: ["tele-does"] }, inl(does))])]),
    el("p", { className: ["tele-at"] }, [raw(ICON[kind]), el("span", {}, [txt(`At ${at}`)]), ...lands.map((c) => chip(c, ctx, ["cond"]))]),
  ]);
}

// A Secret or Hidden: sealed, so players reading along don't see it, and it
// opens in a tap with nothing else needed.
function sealed(title, value, ctx, warn, note = "Players, this one’s the GM’s. Tap to read it.") {
  const m = value.match(/^\*([^*]+)\*(?: \((weak point)\))?\.?\s*([\s\S]*)$/);
  if (!m) warn(`can't read the ${title} ${value.slice(0, 40)} (like *Every Word Is Sold*. The rest of it)`);
  const head = m?.[2] ? `${title} · its weak point` : title;
  return el("details", { className: ["seal"] }, [
    el("summary", {}, [raw(ICON.seal), el("span", { className: ["seal-in"] }, [el("span", { className: ["eyebrow"] }, [txt(head)]), el("span", { className: ["seal-t"] }, [txt(note)])]), raw(ICON.chev)]),
    el("div", { className: ["secret"] }, [el("p", { className: ["secret-n"] }, inl(m ? m[1] : value)), ...(m?.[3] ? [el("p", {}, inl(m[3]))] : [])]),
  ]);
}

const field = (label, ...body) => [el("p", { className: ["fh"] }, [txt(label)]), ...body];

// Someone in Who's here: *Orla Strand*, who owns the baths (Challenge 4:
// *Well-Connected*, *Proud*), four bath-men (Challenge 3: *Heavy*), or
// someone the Bestiary has (Challenge 3, the Bestiary's Debt Collector).
function person(item, ctx) {
  const m = item.match(/^(.*?)\s*\(Challenge (\d)(?::\s*([^)]*)|,\s*([^)]*))\)(.*)$/);
  if (!m) return el("li", { className: ["row", "row-plain"] }, [el("div", {}, [el("p", { className: ["row-n"] }, inl(capFirst(item)))])]);
  const [, pre, c, tags, ref, post] = m;
  // Named in italics, or a group: "the Rudd brothers, the master's nephews".
  const named = pre.match(/^\*([^*]+)\*(.*)$/) ?? pre.match(/^([^,]+)(,.*)?$/);
  const name = capFirst(named[1]);
  const what = [(named[2] ?? "").replace(/^,\s*/, "").trim(), post.replace(/^,\s*/, "").trim()].filter(Boolean).join(", ");
  const meta = [what, `Challenge ${c}`, ref ?? ""].filter(Boolean).join(" · ");
  ctx.who.push(name.replace(/\*/g, ""));
  return el("li", { className: ["row"] }, [dieOf(2 * Number(c)), el("div", {}, [el("p", { className: ["row-n"] }, inl(name)), el("p", { className: ["row-t"] }, inl(meta)), ...(tags ? [chips(tags, ctx)] : [])])]);
}
// A stake: *The deal*, Challenge 4: *Someone Must Agree*, *Wanted By Others*
// (Dace signs with the crew, or with someone else).
function stake(item, ctx, warn) {
  const m = item.match(/^\*([^*]+)\*, Challenge (\d): (.+?)(?: \(([^)]+)\))?$/);
  if (!m) {
    warn(`can't read the stake ${item.slice(0, 50)} (like *The deal*, Challenge 4: *Tags* (what it is))`);
    return el("li", { className: ["row", "row-plain"] }, [el("div", {}, [el("p", { className: ["row-n"] }, inl(item))])]);
  }
  const meta = [m[4] ?? "", `Challenge ${m[2]}`].filter(Boolean).join(" · ");
  return el("li", { className: ["row"] }, [dieOf(2 * Number(m[2])), el("div", {}, [el("p", { className: ["row-n"] }, inl(m[1])), el("p", { className: ["row-t"] }, inl(meta)), chips(m[3], ctx)])]);
}
// A scene clock counts down, a size at a time, and past d2 it happens.
function clock(value, warn) {
  const m = value.match(/^d(\d+): (.+?)\.?$/);
  const d = Number(m?.[1]);
  if (!m || !SIZES.includes(d)) {
    warn(`can't read the scene clock ${value.slice(0, 40)} (like d8: what happens)`);
    return el("p", {}, inl(value));
  }
  const steps = SIZES.filter((s) => s <= d).reverse();
  const ladder = [];
  steps.forEach((s, i) => {
    if (i) ladder.push(raw(ICON.arrow));
    ladder.push(raw(die(s, { own: "them", hide: true, cls: i ? `next s${i}` : "s0" })));
  });
  return el("div", { className: ["clock"] }, [
    el("div", { className: ["pl-ladder"], role: "img", ariaLabel: `A d${d}, counting down to a d2: ${steps.map((s) => `d${s}`).join(", ")}` }, ladder),
    el("p", { className: ["out"] }, inl(`${capFirst(m[2])}.`)),
    el("p", { className: ["note"] }, [txt("It counts down. Past d2, it happens.")]),
  ]);
}

// A place, from Twenty Places.
function placeBlock(node, src, heading, ctx) {
  const id = heading?.data?.hProperties?.id ?? "";
  const name = textOf(heading).trim();
  const warn = (msg) => ctx.warn(`${name || "a place"}: ${msg}`);
  const parts = partsOf(node, src);
  const first = parts[0]?.md.match(/^(.+?) \(Challenge (\d)\)\.$/);
  if (!first) return warn("its first line should say what it is, then its Challenge in brackets");
  const look = parts.slice(1).filter((p) => !p.label);
  const L = Object.fromEntries(parts.filter((p) => p.label).map((p) => [p.label, p.value]));
  for (const need of ["Who's here", "The ground", "Stakes", "Scene clock", "Telegraphs", "Hooks", "Secret"]) if (!L[need]) warn(`it has no ${need}`);
  if (look.length !== 1) warn("it should have one paragraph of what it's like after its first line");
  const ch = Number(first[2]);
  const clockD = Number((L["Scene clock"] ?? "").match(/^d(\d+)/)?.[1]) || 0;
  const n = ctx.places?.get(id)?.n ?? "";
  const tab = (key, label, on) => el("button", { type: "button", role: "tab", className: ["pl-tab"], id: `${id}-t-${key}`, ariaControls: `${id}-p-${key}`, ariaSelected: on ? "true" : "false", dataTab: key }, [txt(label)]);
  const panel = (key, on, body) => el("div", { className: ["pl-panel", ...(on ? ["on"] : [])], role: "tabpanel", id: `${id}-p-${key}`, ariaLabelledby: `${id}-t-${key}`, dataTab: key }, body);
  const who = [];
  const pctx = { ...ctx, who };
  const scene = [
    el("div", { className: ["pl-look", "brk"] }, [el("p", { className: ["eyebrow"] }, [txt("What it’s like")]), el("p", {}, inl(look[0]?.md ?? ""))]),
    ...field("Who’s here", el("ul", { className: ["rows"] }, dots(L["Who's here"]).map((x) => person(x, pctx)))),
    ...field("The ground", el("ul", { className: ["gnd"] }, dots(L["The ground"]).map((x) => {
      const g = x.replace(/\.$/, "").match(/^\*([^*]+)\*:\s*(.+)$/);
      if (!g) warn(`can't read the ground ${x.slice(0, 40)} (like *Steam*: what it does)`);
      return el("li", {}, g ? [el("b", {}, inl(g[1])), el("span", {}, inl(g[2]))] : inl(x));
    }))),
    ...field("Stakes", el("ul", { className: ["rows"] }, dots((L.Stakes ?? "").replace(/\.$/, "")).map((x) => stake(x, pctx, warn)))),
    ...field("Scene clock", clock(L["Scene clock"] ?? "", warn)),
  ];
  const teles = dots(L.Telegraphs).map((t) => telegraph(t, name, pctx, warn)).filter(Boolean);
  node.data.hProperties.className = [...node.data.hProperties.className, "pl"];
  node.children = [
    el("p", { className: ["pl-what"] }, inl(`${first[1]}.`)),
    el("div", { className: ["pl-hero"] }, [
      ...(n ? [el("span", { className: ["pl-n"], ariaHidden: "true" }, [txt(String(n))])] : []),
      el("p", { className: ["pl-fact"] }, [dieOf(2 * ch), el("span", {}, [el("b", {}, [txt(`Challenge ${ch}`)]), el("span", {}, [txt("The place’s own die")])])]),
      ...(clockD ? [el("p", { className: ["pl-fact"] }, [dieOf(clockD), el("span", {}, [el("b", {}, [txt("Scene clock")]), el("span", {}, [txt(`Counts down from d${clockD}`)])])])] : []),
    ]),
    el("div", { className: ["pl-tabs"], role: "tablist", ariaLabel: `${name}, in parts` }, [tab("scene", "Scene", true), tab("tele", "Telegraphs"), tab("prep", "Prep"), tab("secret", "Secret")]),
    panel("scene", true, scene),
    panel("tele", false, field("Telegraphs", el("div", { className: ["teles"] }, teles))),
    panel("prep", false, [
      ...field("Hooks", el("ul", { className: ["hooks"] }, dots(L.Hooks).map((x) => el("li", {}, inl(x))))),
      ...(L.Elsewhere ? field("Elsewhere", el("p", { className: ["else"] }, inl(L.Elsewhere))) : []),
    ]),
    panel("secret", false, [sealed("Secret", L.Secret ?? "", pctx, warn)]),
  ];
  ctx.placeCards[id] = { n, ch, who };
}

// A threat, from the Bestiary or a frame.
const THREAT_TAGS = ["Comes at you", "Keeps it going", "Drives it"];
function threatBlock(node, src, ctx) {
  const name = textOf(node.children.find((c) => c.data?.hProperties?.className?.includes("box-label"))?.children?.find((c) => c.data?.hProperties?.className?.includes("box-name"))).trim();
  const warn = (msg) => ctx.warn(`${name || "a threat"}: ${msg}`);
  const label = node.children.find((c) => !c.position);
  const parts = partsOf(node, src);
  const lead = parts.filter((p) => !p.label);
  const L = Object.fromEntries(parts.filter((p) => p.label).map((p) => [p.label, p.value]));
  const ch = (L.Challenge ?? "").match(/^(\d) \(d(\d+)\)(?: · (.+))?$/);
  if (!ch) return warn("can't read its Challenge (like 3 (d6))");
  const body = [
    el("p", { className: ["th-what"] }, inl(lead[0]?.md ?? "")),
    el("div", { className: ["th-hero"] }, [el("p", { className: ["pl-fact"] }, [dieOf(Number(ch[2])), el("span", {}, [el("b", {}, [txt(`Challenge ${ch[1]}`)]), el("span", {}, [txt("What you’ve got to beat")])])])]),
    ...(ch[3] ? [el("p", { className: ["th-rules"] }, inl(ch[3]))] : []),
    ...(lead[1] ? [el("div", { className: ["pl-look", "brk"] }, [el("p", { className: ["eyebrow"] }, [txt("What you notice first")]), el("p", {}, inl(lead[1].md))])] : []),
  ];
  for (const t of THREAT_TAGS) {
    if (!L[t]) continue;
    const items = dots(L[t]);
    body.push(...field(t, allItalic(items) ? el("p", { className: ["tags"] }, items.map((x) => chip(x.replace(/^\*|\*\.?$/g, ""), ctx))) : el("p", {}, inl(L[t]))));
  }
  if (L.Forms) body.push(...field("Forms", el("p", {}, inl(L.Forms))));
  const teles = dots(L.Telegraphs).map((t) => telegraph(t, name, ctx, warn)).filter(Boolean);
  if (teles.length) body.push(...field("Telegraphs", el("div", { className: ["teles"] }, teles)));
  if (L.Voice) body.push(...field("Voice", el("p", { className: ["voice"] }, inl(L.Voice))));
  if (L.Hidden) body.push(sealed("Hidden", L.Hidden, ctx, warn));
  for (const k of Object.keys(L)) if (![...THREAT_TAGS, "Challenge", "Forms", "Telegraphs", "Voice", "Hidden"].includes(k)) warn(`it has a line the book can't draw yet: ${k}`);
  node.data.hProperties.className = [...node.data.hProperties.className, "th"];
  node.children = [...(label ? [label] : []), ...body];
}

// A sheet: a crew member, a Title idea, a faction, an attuned thing, a
// party's card. Each **Label** line becomes its own field.
const SET_ACTION = /^([A-Z][A-Za-z’' ]*?) (\d+) \(d(\d+)\)(?::\s*(.+?))?\.?$/;
function sheetBlock(node, src, ctx) {
  const label = node.children.find((c) => !c.position);
  const warn = (msg) => ctx.warn(`a sheet: ${msg}`);
  const out = [];
  for (const p of partsOf(node, src)) {
    if (!p.label) {
      out.push(p.node.type === "paragraph" && /^\*[^*][\s\S]*\*$/.test(p.md) ? el("p", { className: ["sh-desc"] }, inl(p.md)) : p.node);
      continue;
    }
    if (/^(Secret|Hidden)$/.test(p.label)) {
      out.push(sealed(p.label, p.value, ctx, warn));
      continue;
    }
    const items = dots(p.value);
    let value;
    if (items.length > 1 && p.label === "Set actions") {
      value = el("ul", { className: ["sh-acts"] }, items.map((x) => {
        const m = x.match(SET_ACTION);
        const d = Number(m?.[3]);
        if (!m || !SIZES.includes(d)) return el("li", {}, inl(x));
        return el("li", {}, [dieOf(d, "you"), el("span", {}, [el("b", {}, [txt(`${m[1]} ${m[2]}`)]), ...(m[4] ? [el("span", {}, inl(m[4]))] : [])])]);
      }));
    } else if (items.length > 1 && allItalic(items)) {
      value = el("p", { className: ["tags", "sh-chips"] }, items.map((x) => el("span", { className: ["chip"] }, inl(x.replace(/\.$/, "")))));
    } else if (items.length > 1) {
      value = el("ul", { className: ["sh-list"] }, items.map((x) => el("li", {}, capped(x.replace(/\.$/, "")))));
    } else {
      const d = p.value.match(/^d(\d+)\b(.*)$/);
      value = d && SIZES.includes(Number(d[1]))
        ? el("p", { className: ["sh-v", "sh-die"] }, [dieOf(Number(d[1]), p.label === "Power" ? "them" : "you"), el("span", {}, inl(p.value))])
        : el("p", { className: ["sh-v"] }, capped(p.value));
    }
    out.push(...field(p.label, value));
  }
  node.data.hProperties.className = [...node.data.hProperties.className, "sh"];
  node.children = [...(label ? [label] : []), ...out];
}

// ctx: { tags: Map(lower-case name -> { name, kind, does }), places: Map(id -> { n }) }.
// What it found goes on the file: the tags the chapter uses and what they
// do (file.data.tags), and each place's number, Challenge and people
// (file.data.places), for the chapter's contents.
export function statBlocks(opts = {}) {
  return (tree, file) => {
    const ctx = { ...opts, used: (file.data.tags ??= {}), placeCards: (file.data.places ??= {}), warn: (msg) => file.message(msg) };
    const src = String(file.value);
    let heading = null;
    for (const node of tree.children) {
      if (node.type === "heading") heading = node;
      if (node.type !== "containerDirective") continue;
      if (node.name === "place") placeBlock(node, src, heading, ctx);
      else if (node.name === "threat") threatBlock(node, src, ctx);
      else if (node.name === "sheet") sheetBlock(node, src, ctx);
    }
  };
}

// The dice in a table's die column, drawn beside what they say: d6, d12 + d2,
// 2d12. A table about the opposition (a Challenge or a telegraph) gets the
// GM's violet, and everything else is yours.
const DICE_CELL = /^(?:(\d)d(12)|d(2|4|6|8|10|12)(?: \+ d(2|4|6|8|10|12))?)$/;
export function diceCells() {
  return (tree) => {
    visit(tree, "element", (table) => {
      if (table.tagName !== "table") return;
      const head = textOf(table.children.find((c) => c.tagName === "thead") ?? { children: [] }).toLowerCase();
      const own = /challenge|telegraph|threat/.test(head) ? "them" : "you";
      visit(table, "element", (cell) => {
        if (cell.tagName !== "td") return;
        const m = textOf(cell).trim().match(DICE_CELL);
        if (!m) return;
        const dice = m[2] ? Array(Number(m[1])).fill(12) : [Number(m[3]), ...(m[4] ? [Number(m[4])] : [])];
        cell.properties.className = [...cls(cell), "td-dice"];
        cell.children = [{ type: "element", tagName: "span", properties: { className: ["td-die"] }, children: dice.map((d) => ({ type: "raw", value: mini(d, { own }) })) }, ...cell.children];
      });
    });
  };
}

// A rule box that starts with its name in bold has it set as a title.
export function ruleNames() {
  return (tree) => {
    visit(tree, "element", (box) => {
      if (box.tagName !== "div" || !cls(box).includes("box-rule")) return;
      const first = box.children.find((c) => c.type === "element" && !cls(c).includes("box-label"));
      const lead = first?.tagName === "p" ? first.children[0] : null;
      if (lead?.type === "element" && lead.tagName === "strong") lead.properties.className = [...cls(lead), "rule-name"];
    });
  };
}

// An example with the crew in it shows their crests by its title, in the
// order they come up. crew: [{ name, arch: [archetypes] }].
export function exampleCrews(crew = []) {
  return (tree) => {
    visit(tree, "element", (box) => {
      if (box.tagName !== "div" || !cls(box).includes("box-example")) return;
      const text = textOf(box);
      const who = crew.map((c) => ({ c, at: text.search(new RegExp(`\\b${c.name}\\b`)) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).slice(0, 4);
      const label = box.children.find((c) => cls(c).includes("box-label"));
      if (!who.length || !label) return;
      label.children.push({
        type: "element", tagName: "span", properties: { className: ["ex-crew"] },
        children: who.map(({ c }) => ({ type: "raw", value: crest(c.arch, { size: "sm", label: c.name, strict: false }) })),
      });
    });
  };
}
