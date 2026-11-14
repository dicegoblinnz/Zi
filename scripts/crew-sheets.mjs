// The ready-made crew, read straight off their sheets in Title Ideas and the
// Crew (#s-pregens), so the home page, the character companion and the
// Worker always match the book. build-content.mjs puts what crewFrom()
// reads into book.json, and tests/check-companion.mjs breaks copies of the
// chapter to make sure it stops on a sheet that doesn't add up.
//
// Since Mo's 14 Nov rework (stacking, notes/stacking-plan.md) a sheet reads:
//   **Points:** 35. Two Titles 10, four more permissions 4, …, and six things she carries 6.
//   **First Title:** *The best cat burglar in the city* (Body 3). Permissions: *move unseen* (Body), …
//   **Second Title:** *Raised by the Guild* (Mind 2, Body 1). Permissions: …
//   **Roots:** Body 8 · Mind 4 · Soul 0.
//   **Archetypes:** [Shadow](#a-shadow) (*Push*) · [Shadow](#a-shadow) (*Vanish*).
//   **Carries:** … (equipment, 3 of 3) · … (utility, 3 of 3) · … (keepsake) · her pack, with a coil of rope (1 of 10).
//   **Armour:** Common worn leathers (Body, 1 box).
//   **Attuned (Awakened):** A grappling line.
//   **Awakenings:** *Anywhere I can throw a hook* (passive): …
//   **Numbers:** Aura 7 · Stamina d12 · Confidence d12 · Resolve d12 · Stride 3.
// and its threads, crew answers, Aspiration and the trouble that follows
// them. Every number's checked: a Title's spread adds up to 3, the Roots
// line is what the Titles and permissions put on each Root, the points are
// what points.js says they cost and what the Points line's parts add up to,
// every ability's one of its archetype's, armour has a quality and a Root
// and is something they carry, the attuned thing has the awakenings its
// stage and its Catch give it, Aura's 5 and 2 for each attuned thing, and
// every track starts at d12. There are no specialties, and an attuned thing
// gets no Aura its own way, so a Specialties or an Its Aura line stops it.
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
export const TRACK_OF = { Body: "Stamina", Mind: "Confidence", Soul: "Resolve" };
export const STAGE_AWAKENINGS = { Awakened: 1, Tempered: 2, Perfected: 3 };
// A Title puts 3 on the Roots, and Aura's 5 and 2 for each attuned thing.
const TITLE_ROOTS = 3;
const AURA = 5;
const PER_ATTUNED = 2;

// Armour's quality, from the table in Quality: Common, Fine and Masterwork,
// with 1, 2 and 3 boxes. A tier is its place in the table, so a saved
// character keeps its armour's quality if a name changes.
export function qualitiesFrom(doc, warn) {
  const out = tableRows(sectionOf(doc?.body ?? "", "s-armour-quality")).map((r, i) => ({ tier: i + 1, name: plain(r[0]), boxes: Number(r[1]), text: plain(r[2] ?? "") }));
  if (out.length !== 3 || out.some((q) => !(q.boxes >= 1))) warn(`armour should have three qualities, each with its boxes, and Quality has ${out.map((q) => `${q.name} ${q.boxes}`).join(", ") || "none"}`);
  return out;
}
// "Fine plate armour" is plate armour, Fine, and "a Common shield" is a
// shield, Common.
export function qualityOf(text, qualities = []) {
  const art = text.match(/^(a|an|the|her|his|their) /i)?.[0] ?? "";
  const rest = text.slice(art.length);
  const q = qualities.find((x) => rest.startsWith(`${x.name} `));
  if (!q) return null;
  const noun = rest.slice(q.name.length + 1);
  const a = /^an? $/i.test(art) ? (/^[aeiou]/i.test(noun) ? "an " : "a ") : art;
  return { name: `${a}${noun}`, tier: q.tier };
}

// Every crew sheet in the chapter. ctx is { warn, inline, archetypes (by
// name, each with its abilities), qualities }.
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
  for (const label of ["Plays like", "Points", "Roots", "Archetypes", "Carries", "Awakenings", "Numbers", "Threads", "Aspiration"]) {
    if (!(label in field)) warn(`there's no ${label} line`);
  }
  if ("Specialties" in field) warn("there's a Specialties line, and specialties are gone: a roll's a Root and everything on the sheet that fits");
  if ("Its Aura" in field) warn("there's an Its Aura line, and an attuned thing gets no Aura its own way any more: it puts 2 on their Aura instead");
  const rootOf = (s, what) => {
    const r = s.trim();
    if (!ROOT_NAMES.includes(r)) warn(`${what} is on "${r}", and a Root's Body, Mind or Soul`);
    return r;
  };

  // Titles: each one's spread of 3 over the Roots, and its permissions, each
  // on a Root.
  const roots = Object.fromEntries(ROOT_NAMES.map((r) => [r, 0]));
  const titles = [];
  for (const [label, value] of Object.entries(field)) {
    if (!/^\w+ Title$/.test(label)) continue;
    const t = value.match(/^\*([^*]+)\* \(([^)]+)\)\. Permissions: (.+?)\.?$/);
    if (!t) {
      warn(`can't read the ${label}: it's *the Title* (Body 3), or (Mind 2, Body 1). Permissions: *a permission* (its Root), …`);
      continue;
    }
    const spread = Object.fromEntries(ROOT_NAMES.map((r) => [r, 0]));
    for (const part of t[2].split(/,\s*/)) {
      const p = part.match(/^(\w+) (\d+)$/);
      if (!p || !ROOT_NAMES.includes(p[1])) {
        warn(`the ${label}'s spread has "${part}", and it's each Root it puts something on, with how much: (Body 3), or (Mind 2, Body 1)`);
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
      return { text: plain(p[1]), root: r, specialty: "" };
    });
    if (!permissions.length) warn(`the ${label} has no permissions I can read: each one's *a permission* (its Root)`);
    if (permissions.length > 6) warn(`the ${label} has ${permissions.length} permissions, and a Title holds six at most`);
    const words = plain(t[1]);
    const most = ROOT_NAMES.reduce((best, r) => (spread[r] > (spread[best] ?? 0) ? r : best), "");
    // name, root, specialties and a permission's specialty are only there
    // for the companion's screens that haven't moved onto stacking yet.
    titles.push({ text: words, name: words, roots: spread, root: most, specialties: [], permissions, boons: [] });
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
    return { name: a[1], id: a[2], home: rule?.home ?? null, have };
  });
  if (archetypes.length < 1) warn("there are no archetypes on the Archetypes line");

  // What they carry: each part's list and how much of it there's room for.
  const carry = { equipment: [], utility: [], keepsake: null, bag: { name: "a bag", max: 10, items: [] } };
  for (const seg of dropStop(field.Carries ?? "").split(" · ").filter(Boolean)) {
    const c = seg.match(/^(.+) \(([^()]+)\)$/);
    const info = c?.[2] ?? "";
    const kind = info.match(/^(equipment|utility|keepsake)\b/)?.[1] ?? (/\bof 10$/.test(info) ? "bag" : null);
    if (!c || !kind) {
      warn(`can't read "${seg}" in what they carry`);
      continue;
    }
    const count = Number(info.match(/(\d+) of \d+$/)?.[1]);
    if (kind === "keepsake") carry.keepsake = plain(c[1]);
    else if (kind === "bag") {
      const inside = c[1].match(/^(.+?), with (.+)$/);
      const items = inside ? inside[2].split(/, | and /).map((x) => plain(x)).filter(Boolean) : [];
      carry.bag = { name: plain(inside ? inside[1] : c[1]), max: Number(info.match(/\bof (\d+)$/)?.[1] ?? 10), items };
      if (count !== items.length) warn(`the bag says ${info}, and it's got ${items.length} in it`);
    } else {
      carry[kind] = c[1].split(", ").map((x) => plain(x));
      if (count !== carry[kind].length) warn(`their ${kind} says ${info}, and it's got ${carry[kind].length}`);
    }
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

  // The attuned thing: its stage and its awakenings.
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
  const attuned = { name: plain(thing.replace(/\..*$/, "").replace(/, with its Catch.*$/, "").replace(/ \([^)]*\)$/, "")), props: thing.match(/^[^(.]+\(([^)]+)\)/)?.[1] ?? null, stage, catch: caught ? plain(caught[1]) : null, burden: null, awakenings };

  // The numbers: Aura, 5 and 2 for the attuned thing, the three tracks at
  // d12 to start, and the stride.
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
  const aura = Number(num(/\bAura (\d+)/, "Aura")?.[1] ?? AURA);
  const wantAura = AURA + PER_ATTUNED * (attunedLabel ? 1 : 0);
  if (aura !== wantAura) warn(`the numbers say Aura ${aura}, and it's ${AURA} and ${PER_ATTUNED} for the attuned thing, ${wantAura}`);
  const numbers = {
    aura,
    stride: Number(num(/\bStride (\d+)/, "Stride")?.[1] ?? 3),
    strideNote: n.match(/\bStride \d+ \(([^)]+)\)/)?.[1] ?? null,
    ...tracks,
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
  const asp = (field.Aspiration ?? "").match(/^(.+) \(d(\d+)\)\.?$/);
  if (!asp) warn("can't read the Aspiration");
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
    archetypes, titles,
    roots: Object.fromEntries(ROOT_NAMES.map((r) => [r, roots[r]])),
    // Empty, for the screens that haven't moved onto stacking yet.
    specialties: [],
    carry, armour, attuned, numbers, threads, crewQs,
    aspiration: { text: curly(asp?.[1] ?? ""), die: Number(asp?.[2] ?? 2) },
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
