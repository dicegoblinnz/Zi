// The ready-made crew, read straight off their sheets in Title Ideas and the
// Crew (#s-pregens), so the home page, the character companion and the
// Worker always match the book. build-content.mjs puts what crewFrom()
// reads into book.json, and tests/check-companion.mjs breaks copies of the
// chapter to make sure it stops on a sheet that doesn't add up.
//
// Since Mo's 16 Nov rework (the new core, notes/core-plan.md) and the 17 Nov
// fixes (notes/fixes-plan.md) a sheet reads:
//   **Points:** 35. Two Titles 10, four more permissions 4, …, four items 4, and two tiers up 2.
//   **First Title:** *The best cat burglar in the city* (Body 5). Permissions: *move unseen* (Body), …
//   **Second Title:** *Raised by the Guild* (Mind 3, Body 2). Permissions: …
//   **Roots:** Body 11 · Mind 5 · Soul 0.
//   **Archetypes:** [Shadow](#a-shadow) (*Push*) · [Shadow](#a-shadow) (*Vanish*).
//   **Items:** worn leathers (armour, Body, tier 2) · a set of picks (tool, tier 3) · her grappling line (tool, tier 2, attuned) · 5 of 6.
//   **Keepsake:** the first coin she ever stole.
//   **Resources:** 3.
//   **Attuned (Awakened):** A grappling line.
//   **Awakenings:** *Anywhere I can throw a hook* (Body): …
//   **Numbers:** Aura 5 · Stride 3.
// and its threads, crew answers, Aspiration and the trouble that follows
// them. An item's brackets are its kind, the Root armour soaks on, its tier,
// attuned if it is, a weapon's properties, and when armour counts (when they
// fit the scene). Its tier's name can go before it (a Proven set of picks),
// and if it does it has to be that tier's, off the table in Items. Every
// number's checked: a Title's spread adds up to 5, the Roots line is what
// the Titles and permissions put on each Root, the points are what points.js
// says they cost and what the Points line's parts add up to, every ability's
// one of its archetype's, there are six items at most and the count says how
// many, every item's tier is 1 to 3 at the start, armour has a Root, the one
// attuned item is the attuned thing, the Resources are 3 and what packs add,
// the attuned thing has the awakenings its stage and its Catch give it, each
// awakening names the Root whose point it locks and that Root's got the
// point, and Aura's 5. There are no tracks, no specialties, no Boons and no
// carrying the old way, so a track in the numbers, a Specialties, Its Aura,
// Carries, Armour or Boons line stops it.
import { createHash } from "node:crypto";
import { costOf } from "../src/companion/points.js";
import { threadNote } from "../src/companion/threads.js";

const curly = (s) => (typeof s === "string" ? s.replace(/'/g, "’") : s);
const plain = (s = "") => curly(s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*/g, "").trim());
const italics = (s = "") => [...s.matchAll(/\*([^*]+)\*/g)].map((m) => plain(m[1]));
const dropStop = (s = "") => s.trim().replace(/\.$/, "");
const dots = (s = "") => s.split(" · ").map((x) => x.trim()).filter(Boolean);
function sectionOf(body, id) {
  const m = body.match(new RegExp(`^(#{2,4}) [^\\n]*\\{#${id}\\}[^\\n]*$`, "m"));
  if (!m) return "";
  const rest = body.slice(m.index + m[0].length);
  const end = rest.search(new RegExp(`^#{2,${m[1].length}} `, "m"));
  return end === -1 ? rest : rest.slice(0, end);
}
const tableRows = (sec) => [...sec.matchAll(/^\| (.+) \|$/gm)].map((m) => m[1].split(" | ").map((x) => x.trim())).filter((r) => !/^-+$/.test(r[0])).slice(1);
// Split on the commas that aren't inside brackets.
const outerCommas = (s = "") => {
  const out = [];
  let depth = 0;
  let at = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth += 1;
    else if (s[i] === ")") depth = Math.max(0, depth - 1);
    else if (s[i] === "," && depth === 0) {
      out.push(s.slice(at, i).trim());
      at = i + 1;
    }
  }
  out.push(s.slice(at).trim());
  return out.filter(Boolean);
};

export const ROOT_NAMES = ["Body", "Mind", "Soul"];
export const STAGE_AWAKENINGS = { Awakened: 1, Tempered: 2, Perfected: 3 };
// A Title puts 5 on the Roots, and Aura's 5. The tracks are gone.
const TITLE_ROOTS = 5;
const AURA = 5;
const TRACKS = ["Stamina", "Confidence", "Resolve"];

// The tiers, from the table in Items (#s-item-tiers): six of them, 1 to 6,
// each with its name.
export function tiersFrom(doc, warn) {
  const rows = tableRows(sectionOf(doc?.body ?? "", "s-item-tiers"));
  const out = rows.map((r, i) => ({ n: i + 1, name: plain(r[1] ?? ""), text: plain(r[3] ?? "") }));
  if (out.length !== 6 || out.some((t, i) => !t.name || Number(rows[i][0]) !== t.n)) warn(`items should have six tiers, 1 to 6, each with its name, and the table in Items has ${out.map((t) => `${t.n} ${t.name}`).join(", ") || "none"}`);
  return out;
}
// "a Proven set of picks" is a set of picks at tier 3, against the tiers'
// names, and null if it hasn't got a tier's name first.
export function tierOf(text, tiers = []) {
  const art = text.match(/^(a|an|the|her|his|their) /i)?.[0] ?? "";
  const rest = text.slice(art.length);
  const t = tiers.find((x) => rest.startsWith(`${x.name} `));
  if (!t) return null;
  const noun = rest.slice(t.name.length + 1);
  const a = /^an? $/i.test(art) ? (/^[aeiou]/i.test(noun) ? "an " : "a ") : art;
  return { name: `${a}${noun}`, tier: t.n };
}
export const KINDS = ["weapon", "tool", "guard", "armour", "pack", "vessel"];
const MAX_ITEMS = 6;
const START_TIERS = [1, 2, 3];
const RES_BASE = 3;

// Every crew sheet in the chapter. ctx is { warn, inline, archetypes (by
// name, each with its abilities), tiers, props (the weapon properties'
// names) }.
export function crewFrom(doc, ctx) {
  const out = [];
  for (const m of doc.body.matchAll(/^:::sheet\[([^:\]]+): ([^\]]+)\]\n([\s\S]*?)\n:::$/gm)) out.push(crewSheet(m[1], m[2], m[3], m[0], ctx));
  return out;
}

function crewSheet(name, titleText, body, block, ctx) {
  const warn = (msg) => ctx.warn(`${name}'s sheet: ${msg}`);
  const rows = body.split("\n");
  const field = {};
  for (const row of rows) {
    const f = row.match(/^\*\*([^*]+?):\*\* (.*)$/);
    if (f) field[f[1]] = f[2].trim();
  }
  const labelled = (re) => Object.keys(field).find((k) => re.test(k));
  for (const label of ["Plays like", "Points", "Roots", "Archetypes", "Items", "Keepsake", "Resources", "Awakenings", "Numbers", "Threads", "Aspiration"]) {
    if (!(label in field)) warn(`there's no ${label} line`);
  }
  for (const label of ["Carries", "Armour", "Boons", "Bag", "Equipment", "Utility"]) if (label in field) warn(`there's a ${label} line, and since the 17 Nov fixes what they've got is the Items line, the Keepsake line and the Resources line`);
  if ("Specialties" in field) warn("there's a Specialties line, and specialties are gone: a roll's a Root and everything on the sheet that fits");
  if ("Its Aura" in field) warn("there's an Its Aura line, and an attuned thing gets no Aura any more: each awakening locks a point of its Root instead");
  const rootOf = (s, what) => {
    const r = s.trim();
    if (!ROOT_NAMES.includes(r)) warn(`${what} is on "${r}", and a Root's Body, Mind or Soul`);
    return r;
  };

  // Titles: each one's spread of 5 over the Roots, and its permissions, each
  // on a Root.
  const roots = Object.fromEntries(ROOT_NAMES.map((r) => [r, 0]));
  const titles = [];
  for (const [label, value] of Object.entries(field)) {
    if (!/^\w+ Title$/.test(label)) continue;
    const t = value.match(/^\*([^*]+)\* \(([^)]+)\)\. Permissions: (.+?)\.?$/);
    if (!t) {
      warn(`can't read the ${label}: it's *the Title* (Body 5), or (Mind 3, Body 2). Permissions: *a permission* (its Root), …`);
      continue;
    }
    const spread = Object.fromEntries(ROOT_NAMES.map((r) => [r, 0]));
    for (const part of t[2].split(/,\s*/)) {
      const p = part.match(/^(\w+) (\d+)$/);
      if (!p || !ROOT_NAMES.includes(p[1])) {
        warn(`the ${label}'s spread has "${part}", and it's each Root it puts something on, with how much: (Body 5), or (Mind 3, Body 2)`);
        continue;
      }
      if (spread[p[1]]) warn(`the ${label}'s spread names ${p[1]} twice`);
      spread[p[1]] += Number(p[2]);
    }
    const sum = ROOT_NAMES.reduce((n, r) => n + spread[r], 0);
    if (sum !== TITLE_ROOTS) warn(`the ${label} puts ${sum} on the Roots, and a Title puts ${TITLE_ROOTS}`);
    for (const r of ROOT_NAMES) roots[r] += spread[r];
    const permissions = [...t[3].matchAll(/\*([^*]+)\* \(([^)]+)\)/g)].map((p) => {
      if (/,/.test(p[2])) warn(`*${p[1]}* says (${p[2]}), and a permission's just its Root now`);
      const r = rootOf(p[2].split(",")[0], `*${p[1]}*`);
      if (ROOT_NAMES.includes(r)) roots[r] += 1;
      return { text: plain(p[1]), root: r };
    });
    if (!permissions.length) warn(`the ${label} has no permissions I can read: each one's *a permission* (its Root)`);
    if (permissions.length > 6) warn(`the ${label} has ${permissions.length} permissions, and a Title holds six at most`);
    titles.push({ text: plain(t[1]), roots: spread, permissions, boons: [] });
  }
  if (!titles.length) warn("there are no Titles");

  // The Roots line has to be what the Titles and permissions put on each Root.
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

  // Archetypes, apart from the Titles, each with the abilities they've got
  // of it, the one it came with first, every one of them its own.
  const archetypes = [...(field.Archetypes ?? "").matchAll(/\[([^\]]+)\]\(#(a-[a-z-]+)\)(?: \(([^)]*)\))?/g)].map((a) => {
    const rule = ctx.archetypes[a[1]];
    if (!rule) warn(`there's no archetype called ${a[1]}`);
    const have = italics(a[3] ?? "");
    if (!have.length) warn(`the ${a[1]} on the Archetypes line has no ability after it, and each archetype comes with one of its abilities: [${a[1]}](#${a[2]}) (*its ability*)`);
    if (new Set(have).size !== have.length) warn(`the ${a[1]} has the same ability twice`);
    const theirs = (rule?.abilities ?? []).map((x) => curly(x.name));
    for (const h of have) if (rule && !theirs.includes(h)) warn(`*${h}* isn't one of the ${a[1]}'s abilities, which are ${theirs.join(", ")}`);
    return { name: a[1], id: a[2], have };
  });
  if (archetypes.length < 1) warn("there are no archetypes on the Archetypes line");

  // Items: six at most, each with its kind, tier and the rest in brackets,
  // then how many of six.
  const segs = dots(dropStop(field.Items ?? ""));
  const count = segs.length && /^\d+ of \d+$/.test(segs[segs.length - 1]) ? segs.pop() : null;
  if (!count) warn("the Items line ends with how many of six they've got: 5 of 6");
  else if (Number(count.split(" ")[0]) !== segs.length || Number(count.split(" ").pop()) !== MAX_ITEMS) warn(`the Items line says ${count}, and it's got ${segs.length} of ${MAX_ITEMS}`);
  if (segs.length > MAX_ITEMS) warn(`they've got ${segs.length} items, and it's six at most`);
  const items = segs.map((seg) => {
    const m = seg.match(/^(.+?) \(([^()]+)\)$/);
    if (!m) {
      warn(`can't read the item "${seg}": it's the item, then (its kind, tier 2) or (armour, its Root, tier 2)`);
      return null;
    }
    const parts = m[2].split(/,\s*/);
    const kind = parts.shift();
    if (!KINDS.includes(kind)) warn(`${m[1]} is a ${kind}, and an item's a ${KINDS.join(", ")}`);
    let root = null;
    let tier = null;
    let attuned = false;
    let when = null;
    const props = [];
    for (const p of parts) {
      if (ROOT_NAMES.includes(p)) root = p;
      else if (/^tier \d+$/.test(p)) tier = Number(p.slice(5));
      else if (p === "attuned") attuned = true;
      else if (/^when /.test(p)) when = curly(p);
      else props.push(p);
    }
    if (tier == null) warn(`${m[1]} hasn't got its tier: (${kind}, tier 2)`);
    else if (!START_TIERS.includes(tier)) warn(`${m[1]} is tier ${tier}, and an item starts at tier 1 to 3`);
    const named = tierOf(plain(m[1]), ctx.tiers ?? []);
    if (named && named.tier !== tier) warn(`${m[1]} has the name of tier ${named.tier} before it, and it says tier ${tier}`);
    if (kind === "armour" && !root) warn(`${m[1]} is armour, and it needs the Root it soaks on: (armour, Body, tier 2)`);
    if (kind !== "armour" && root) warn(`${m[1]} has a Root, and only armour soaks on one`);
    if (kind !== "armour" && when) warn(`${m[1]} says ${when}, and only armour counts only in the right place`);
    if (props.length && kind !== "weapon") warn(`${m[1]} has ${props.join(", ")}, and only a weapon has properties`);
    for (const p of props) if (ctx.props?.length && !ctx.props.includes(p)) warn(`${m[1]} has ${p}, and that isn't one of the weapon properties`);
    return { name: named ? named.name : plain(m[1]), tier: tier ?? 2, kind: KINDS.includes(kind) ? kind : "tool", root: kind === "armour" ? root ?? "Body" : null, props, attuned, ...(when ? { when } : {}) };
  }).filter(Boolean);
  const keepsake = field.Keepsake ? plain(dropStop(field.Keepsake)) : null;
  if (!keepsake) warn("there's no keepsake");
  // Resources: everyone's 3, and half each pack's tier, rounded up.
  const res = Number(dropStop(field.Resources ?? "").match(/^(\d+)$/)?.[1]);
  const resWant = RES_BASE + items.filter((it) => it.kind === "pack").reduce((t, it) => t + Math.ceil(it.tier / 2), 0);
  if (res !== resWant) warn(`the Resources line says ${field.Resources ?? "nothing"}, and it's ${resWant}: 3, and half each pack's tier, rounded up`);

  // The attuned thing: its stage and its awakenings.
  const attunedLabel = labelled(/^Attuned\b/);
  const stage = attunedLabel?.match(/\(([^)]+)\)/)?.[1] ?? null;
  if (!attunedLabel) warn("there's no Attuned line");
  else if (!(stage in STAGE_AWAKENINGS)) warn(`the attuned thing's stage is ${stage}, and it's Awakened, Tempered or Perfected`);
  const thing = attunedLabel ? field[attunedLabel] : "";
  const caught = thing.match(/, with its Catch, \*([^*]+)\*/);
  // Each awakening names the Root whose point it locks, the one it fits.
  const awakenings = dots(dropStop(field.Awakenings ?? "")).map((seg) => {
    const w = seg.match(/^\*([^*]+)\* \((\w+)\): (.+)$/);
    if (!w) warn(`can't read the awakening "${seg.slice(0, 40)}…": it's *its name* (the Root it locks): what it does`);
    return w ? { name: plain(w[1]), root: rootOf(w[2], `the awakening *${w[1]}*`), text: curly(w[3]) } : null;
  }).filter(Boolean);
  const room = (STAGE_AWAKENINGS[stage] ?? 1) * (caught ? 2 : 1);
  if (awakenings.length !== room) warn(`the attuned thing has ${awakenings.length} awakenings, and at ${stage}${caught ? " with its Catch" : ""} it's got ${room}`);
  const attuned = { name: plain(thing.replace(/\..*$/, "").replace(/, with its Catch.*$/, "").replace(/ \([^)]*\)$/, "")), props: thing.match(/^[^(.]+\(([^)]+)\)/)?.[1] ?? null, stage, catch: caught ? plain(caught[1]) : null, burden: null, awakenings };
  // The attuned thing's one of their items, marked attuned, by its name.
  const bare = (x) => String(x ?? "").toLowerCase().replace(/^(a|an|the|her|his|their) /, "").trim();
  const marked = items.filter((it) => it.attuned);
  if (attunedLabel && marked.length !== 1) warn(`${marked.length} items are marked attuned, and the attuned thing's one of them: (tool, tier 2, attuned)`);
  for (const it of marked) {
    if (bare(it.name) !== bare(attuned.name)) warn(`${it.name} is marked attuned, and the attuned thing's ${attuned.name}`);
    it.attuned = 0;
  }
  for (const it of items) if (it.attuned === false) it.attuned = null;
  // Each awakening locks a point of its Root, so the Root has to have it.
  for (const r of ROOT_NAMES) {
    const locks = awakenings.filter((w) => w.root === r).length;
    if (locks > roots[r]) warn(`${locks === 1 ? "an awakening locks" : `${locks} awakenings lock`} ${locks === 1 ? "a point" : "points"} of ${r}, and their ${r}'s ${roots[r]}`);
  }

  // The numbers: Aura, 5, and the stride. The tracks are gone, so there's
  // no Stamina, Confidence or Resolve in them.
  const n = field.Numbers ?? "";
  const num = (re, what) => {
    const m = n.match(re);
    if (!m) warn(`can't find ${what} in the numbers`);
    return m;
  };
  for (const tr of TRACKS) if (new RegExp(`\\b${tr}\\b`).test(n)) warn(`the numbers still have ${tr}, and the tracks are gone: a Root's points are its health`);
  if (/\bWound die\b|\bConfidence starts\b/.test(n)) warn("the numbers still have the wound die or Confidence's start");
  const aura = Number(num(/\bAura (\d+)/, "Aura")?.[1] ?? AURA);
  if (aura !== AURA) warn(`the numbers say Aura ${aura}, and it's ${AURA}`);
  const numbers = {
    aura,
    stride: Number(num(/\bStride (\d+)/, "Stride")?.[1] ?? 3),
    strideNote: n.match(/\bStride \d+ \(([^)]+)\)/)?.[1] ?? null,
  };

  const threads = dropStop(field.Threads ?? "").split(" · ").filter(Boolean).map((seg) => {
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
  // An Aspiration's points in it, of the 5 it takes: (0 of 5).
  const asp = (field.Aspiration ?? "").match(/^(.+) \((\d) of 5\)\.?$/);
  if (!asp) warn("can't read the Aspiration: its words, then (0 of 5)");
  const troubleLabel = labelled(/^Trouble that follows\b/);
  if (!troubleLabel) warn("there's no trouble that follows them");

  const sheet = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    title: curly(titleText),
    blurb: plain(rows[0]),
    hash: createHash("sha1").update(block).digest("hex").slice(0, 8),
    pronoun: troubleLabel?.split(" ").pop() ?? "them",
    playsLike: ctx.inline(field["Plays like"] ?? ""),
    points: { start: 0, spent: 0 },
    core: true,
    archetypes, titles,
    roots: Object.fromEntries(ROOT_NAMES.map((r) => [r, roots[r]])),
    items, keepsake, attuned, numbers, threads, crewQs,
    aspiration: { text: curly(asp?.[1] ?? ""), pts: Math.min(5, Number(asp?.[2] ?? 0)) },
    trouble: troubleLabel ? italics(field[troubleLabel]) : [],
  };

  // Points: what they went on adds up to the total, and the total's what
  // they cost at Mo's prices.
  const pts = (field.Points ?? "").match(/^(\d+)\. (.+?)\.?$/);
  if (!pts) warn("can't read the Points line: it's 35. then what they went on, each with its points");
  else {
    const total = Number(pts[1]);
    const parts = outerCommas(pts[2]).map((seg) => seg.replace(/^and /, ""));
    let sum = 0;
    for (const seg of parts) {
      const p = seg.match(/^(.+?) (\d+)(?: \([^)]*\))?$/);
      if (!p) warn(`can't read "${seg}" on the Points line: it's what they went on and its points`);
      else sum += Number(p[2]);
    }
    if (sum !== total) warn(`the Points line's parts add up to ${sum}, and it says ${total}`);
    const cost = costOf(sheet);
    if (cost.spent !== total) warn(`the Points line says ${total}, and what's on the sheet costs ${cost.spent}: ${cost.lines.map((l) => `${l.what} ${l.cost}`).join(", ")}`);
    sheet.points = { start: total, spent: cost.spent };
  }
  return sheet;
}

// One thread off a crew sheet. Its note has to say bond or hostile, and it can
// say whose words it is and that it's strained, in that order. Anything else
// stops the build, a debt included, since there's no debt any more.
export function threadFrom(text, raw, warn) {
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
export function checkMirrors(crew, warn) {
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
