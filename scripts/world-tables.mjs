// The world builder's tables (notes/builder-plan.md): YAML in
// content/world-tables/, read here into the one object the engine deals from
// (src/companion/world-engine.js). The build writes it to
// public/world-tables.json, and every problem it finds stops the build: a row
// it can't read, a tag it doesn't know, a slot nothing fills, or a role with
// too few names for a region its pack says it fits.
//
// The files:
//   core.yaml        everything that isn't genre
//   regions.yaml     the five regions
//   genres.yaml      the eras, the twists, the named genres and the frames' mixes
//   eras/<id>.yaml   a pack for an era, twists/<id>.yaml one for a twist
//
// A row is one line of words and what it fits. Written as just its words it
// fits everything at the common weight. Written as a map:
//   text     its words. A seat's, an asset's or a name's is its name (one to
//            four words), and any other line's up to twelve.
//   role     what it is underneath, the same in every genre: a keep role for
//            a seat or a resource, a type role for a type, Appendix B's
//            asset for an asset (its key, like standing-army or vault)
//   tags     what it's about, which steer the steps after it
//   needs    tags that have to be on the card or the board already
//   out      tags that rule it out
//   regions  the regions it fits (all its pack fits, if it doesn't say)
//   sizes    the sizes it fits: small, local, city, great (all of them)
//   rare     true for the rare weight, 1 against the common 10
//   strange  a strange thing (a twist pack's rows always are)
//   leans    roles and tags it makes likelier on the card's later steps
//   offers   bond threads it suggests for the card, as cards to keep or
//            swipe away: [{ bond: pub | mor | loy, kind: bond | hostile, text }]
// and what its own table needs: a seat's notice (what a stranger notices
// there), a Secret's tag, more and its two ways in, an agenda's die, an
// exception's when, drops and reason, an answer's dials, a tie's kind.
//
// core.yaml:
//   seeds       words a seed's made of, three to a seed (ash-lantern-ford)
//   tags        every tag a row can use, besides the roles and the regions
//   keeps       the eleven keep roles, each with a line saying what it is
//   types       the twelve type roles, the same
//   sizes       how often each size comes up: { small, local, city, great }
//   templates   about ({type}, {method}), face ({name}, {threat}), ways ({one}, {two})
//   because     why a step went the way it did, one line for each thing that
//               can steer it (seat, type, method, want, answer, tension,
//               region), with {thing} for what it was. An empty line says the
//               reason's obvious.
//   wants, methods, secrets, agendas    Building a Faction's tables and the
//               agendas, as rows. An agenda aims at something with its slot:
//               {seat}, {rival}, {res} or {asset}.
//   asking      Building Your World's three questions: holds, runs, notices,
//               each a list of answers with the dials they move
//   tension     the twelve tensions, in order, for the roll
//   ties        between factions: kind rival, ally, debt, wildcard (with bond:
//               bond or hostile) or blocked, written from {a}'s side toward {b}
//   faces       for a type role, the Threat Builder's threats its face is
//               likeliest to be (by key, like commander or old-power)
//   fallbacks   what goes in when a check still fails after three deals:
//               secret, strange, agenda, block and rival, each a row
//   founding    the founding's questions and acts (from stage 7)
//
// regions.yaml: town, city, country, world and stars, each with name, faction,
// seat and mini (what each is at that size), sizes (the region's words for
// small, local, city and great), d6 (the keep role each face of a d6 picks),
// pressure (what pressure from one size up looks like) and roles (the keep
// roles that turn up there, all of them if it doesn't say).
//
// genres.yaml: eras and twists (each id with its name), genres (each id with
// name, era and twist if it has one) and frames (each frame's era, twist and
// region, so Add a faction fits a frame she brought in).
//
// A pack: fits (the regions it fits), seats, resources, assets, types (with
// sizes and leans), methods, secrets, exceptions, wants (if it adds any) and
// names (factions and people). A twist pack adds its rows to the same roles,
// and every row in it is strange.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export const REGIONS = ["town", "city", "country", "world", "stars"];
export const SIZES = ["small", "local", "city", "great"];
export const KEEPS = ["passage", "land", "ground", "craft", "trade", "belief", "office", "knowledge", "labour", "crime", "wonder"];
export const TYPES = ["house", "traders", "crooks", "faith", "office", "society", "soldiers", "makers", "family", "rebels", "keepers", "old"];
export const DIALS = ["tense", "strange", "rich", "ruled"];
export const BONDS = ["pub", "mor", "loy"];
export const TIES = ["rival", "ally", "debt", "wildcard", "blocked"];
export const BECAUSE = ["seat", "type", "method", "want", "answer", "tension", "region"];
export const FALLBACKS = { secret: "secrets", strange: "secrets", agenda: "agendas", block: "ties", rival: "ties" };
const QUESTIONS = ["holds", "runs", "notices"];

// Appendix B's asset, or a threat, by a key a table can write: its name in
// small letters and hyphens, without a leading A, An or The.
export const keyOf = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^(a|an|the)-/, "");

// What each table's rows can have, past the fields every row has, and the
// slots its words can use.
const COMMON = ["text", "role", "tags", "needs", "out", "regions", "sizes", "rare", "strange", "leans", "offers"];
const TABLES = {
  seats: { extra: ["notice"], slots: [], name: true, role: "keep" },
  resources: { extra: [], slots: ["seat"], role: "keep" },
  assets: { extra: ["does"], slots: ["seat"], name: true, role: "asset" },
  types: { extra: [], slots: [], role: "type" },
  methods: { extra: [], slots: [] },
  wants: { extra: [], slots: [] },
  secrets: { extra: ["tag", "more", "ways"], slots: ["rival", "seat"], noText: true },
  agendas: { extra: ["die"], slots: ["seat", "rival", "res", "asset"] },
  exceptions: { extra: ["when", "drops", "gives", "reason"], slots: [] },
  answers: { extra: ["dials"], slots: [] },
  tension: { extra: ["dials"], slots: [] },
  ties: { extra: ["kind", "bond", "back"], slots: ["a", "b", "res", "seat"] },
  factions: { extra: [], slots: ["seat"], name: true, role: "type" },
  people: { extra: [], slots: [], name: true },
};
const AIMS = ["seat", "rival", "res", "asset"];
const words = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;
const slotsIn = (s) => [...String(s ?? "").matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]);
const isKey = (s) => typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

// The book's parts the engine deals with: each size's Power and resources
// (What a Faction Is), Appendix B's assets and the Threat Builder's threats.
export function bookFor(worlds, worldBook) {
  const range = (s) => (String(s ?? "").match(/\d+/g) ?? []).map(Number);
  const sizes = {};
  for (const s of worlds?.sizes ?? []) {
    const [lo, hi] = range(s.power);
    const [rlo, rhi] = range(s.res);
    sizes[keyOf(s.size)] = { lo, hi: hi ?? lo, rlo, rhi: rhi ?? rlo };
  }
  const assets = {};
  for (const a of worlds?.assets ?? []) assets[keyOf(a.text)] = { name: a.text, does: a.does, power: a.power === true, group: a.group };
  const threats = (worldBook?.tables?.what ?? [])
    .filter((w) => !w.twice && w.name)
    .map((w) => ({ key: keyOf(w.name), name: w.name, is: w.is, ch: w.ch, tags: (w.tags ?? []).map((t) => ({ text: t.text, x: t.x ?? 1 })) }));
  return { sizes, assets, threats };
}

// Every file in the folder, read and parsed. A file that can't be parsed is a
// problem, and it reads as nothing.
export function readTablesDir(dir) {
  const problems = [];
  const read = (rel) => {
    const path = join(dir, rel);
    if (!existsSync(path)) return undefined;
    try {
      return parseYaml(readFileSync(path, "utf8")) ?? {};
    } catch (err) {
      problems.push(`${rel} can't be read: ${String(err?.message ?? err).split("\n")[0]}`);
      return {};
    }
  };
  const packs = (sub) => {
    const out = {};
    const at = join(dir, sub);
    if (!existsSync(at)) return out;
    for (const f of readdirSync(at).filter((x) => x.endsWith(".yaml")).sort()) out[f.replace(/\.yaml$/, "")] = read(`${sub}/${f}`);
    return out;
  };
  return { src: { core: read("core.yaml"), regions: read("regions.yaml"), genres: read("genres.yaml"), eras: packs("eras"), twists: packs("twists") }, problems };
}

// The tables, read and checked against the book. minimums is the plan's
// "every role has at least four names for each region its pack fits", which
// the shipped packs have to meet. The engine's own check runs a small
// made-up pack without it.
export function compileTables(src, book, { minimums = true } = {}) {
  const problems = [];
  const bad = (where, what) => problems.push(`${where}: ${what}`);
  const core = src?.core;
  const regionsSrc = src?.regions;
  const genresSrc = src?.genres;
  if (!core || typeof core !== "object") bad("core.yaml", "it's missing");
  if (!regionsSrc || typeof regionsSrc !== "object") bad("regions.yaml", "it's missing");
  if (!genresSrc || typeof genresSrc !== "object") bad("genres.yaml", "it's missing");
  if (problems.length) return { tables: null, problems };

  const assetKeys = Object.keys(book.assets ?? {});
  if (!assetKeys.length) bad("the book", "can't find Appendix B's assets");
  const threatKeys = (book.threats ?? []).map((t) => t.key);
  if (threatKeys.length < 10) bad("the book", "can't find the Threat Builder's threats");
  for (const s of SIZES) if (!book.sizes?.[s]?.lo || !book.sizes?.[s]?.rlo) bad("the book", `can't read ${s} in What a Faction Is's sizes`);

  // The tags a row can use: core's own, the roles, and the regions.
  const ownTags = list(core.tags);
  for (const t of ownTags) if (!isKey(t)) bad("core.yaml", `tags has one that isn't a tag: ${t}`);
  const known = new Set([...ownTags, ...KEEPS, ...TYPES, ...assetKeys, ...REGIONS]);

  // A row's id comes from where it's written and its own words, so it stays
  // the same when rows are added, taken out or moved round it, and a world
  // built from last week's tables still knows which rows it holds. Two rows
  // with the same words in the same table are one row written twice.
  const ids = new Map();
  const idOf = (kind, where, r, text) => {
    const home = where.replace(/ row \d+$/, "");
    const said = (text || (typeof r.tag === "string" ? r.tag : "")).toLowerCase().replace(/\s+/g, " ").trim();
    const key = `${home}|${r.role ?? ""}|${said}`;
    let id = `${kind}-${createHash("sha1").update(key).digest("hex").slice(0, 10)}`;
    while (ids.has(id) && ids.get(id).key !== key) id += "x";
    if (ids.has(id) && said) bad(where, `says the same as ${ids.get(id).where}`);
    ids.set(id, { key, where });
    return id;
  };
  function rowOf(raw, where, kind, { strange = false, regionsOk = REGIONS } = {}) {
    const spec = TABLES[kind];
    const r = typeof raw === "string" ? { text: raw } : raw;
    if (!r || typeof r !== "object" || Array.isArray(r)) {
      bad(where, "isn't a row");
      return null;
    }
    for (const k of Object.keys(r)) if (!COMMON.includes(k) && !spec.extra.includes(k)) bad(where, `has a field it doesn't know: ${k}`);
    const text = typeof r.text === "string" ? r.text.trim() : "";
    if (!spec.noText && !text) bad(where, "has no words");
    if (text && words(text) > (spec.name ? 4 : 12)) bad(where, `${spec.name ? "a name's one to four words" : "a line's twelve words at most"}: ${text}`);
    const tagList = (field) => {
      const v = list(r[field]);
      for (const t of v) if (!known.has(t)) bad(where, `${field} has a tag it doesn't know: ${t}`);
      return v.filter((t) => known.has(t));
    };
    const row = { id: idOf(kind, where, r, text), text, tags: tagList("tags"), needs: tagList("needs"), out: tagList("out"), leans: tagList("leans"), w: r.rare === true ? 1 : 10, strange: strange || r.strange === true };
    if (r.role != null) {
      const ok = spec.role === "keep" ? KEEPS : spec.role === "type" ? TYPES : spec.role === "asset" ? assetKeys : [];
      if (!ok.includes(r.role)) bad(where, `has a role it doesn't know: ${r.role}`);
      else row.role = r.role;
    } else if (spec.role === "keep" || spec.role === "asset" || (spec.role === "type" && kind === "types")) bad(where, "needs its role");
    if (r.regions != null) {
      row.regions = list(r.regions).filter((x) => {
        if (!REGIONS.includes(x)) bad(where, `has a region it doesn't know: ${x}`);
        else if (!regionsOk.includes(x)) bad(where, `fits ${x}, which its pack doesn't`);
        return REGIONS.includes(x);
      });
    } else row.regions = null;
    if (r.sizes != null) {
      row.sizes = list(r.sizes).filter((x) => {
        if (!SIZES.includes(x)) bad(where, `has a size it doesn't know: ${x}`);
        return SIZES.includes(x);
      });
    } else row.sizes = null;
    row.offers = list(r.offers)
      .map((o, i) => {
        const at = `${where}, offer ${i + 1}`;
        if (!o || typeof o !== "object" || !BONDS.includes(o.bond) || !["bond", "hostile"].includes(o.kind) || typeof o.text !== "string" || !o.text.trim()) {
          bad(at, "needs bond (pub, mor or loy), kind (bond or hostile) and its words");
          return null;
        }
        if (words(o.text) > 12) bad(at, `a line's twelve words at most: ${o.text}`);
        return { bond: o.bond, kind: o.kind, text: o.text.trim() };
      })
      .filter(Boolean);
    const slots = (s, field = "its words") => {
      for (const x of slotsIn(s)) if (!spec.slots.includes(x)) bad(where, `has a slot nothing fills in ${field}: {${x}}`);
    };
    slots(text);
    if (kind === "seats") {
      row.notice = typeof r.notice === "string" ? r.notice.trim() : "";
      if (!row.notice) bad(where, "needs its notice, what a stranger notices there");
      else if (words(row.notice) > 12) bad(where, `a line's twelve words at most: ${row.notice}`);
    }
    if (kind === "assets" && typeof r.does === "string" && r.does.trim()) {
      row.does = r.does.trim();
      if (words(row.does) > 12) bad(where, `a line's twelve words at most: ${row.does}`);
    }
    if (kind === "assets" && row.role) row.power = book.assets[row.role]?.power === true;
    if (kind === "secrets") {
      row.tag = typeof r.tag === "string" ? r.tag.trim() : "";
      row.more = typeof r.more === "string" ? r.more.trim() : "";
      row.ways = list(r.ways).filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim());
      if (!row.tag) bad(where, "needs its tag, the Secret itself");
      if (row.ways.length !== 2) bad(where, "needs two ways in a player could find");
      for (const [f, v] of [["tag", row.tag], ["more", row.more], ...row.ways.map((w) => ["ways", w])]) {
        if (words(v) > 12) bad(where, `a line's twelve words at most: ${v}`);
        slots(v, f);
      }
      row.rival = [row.tag, row.more, ...row.ways].some((v) => slotsIn(v).includes("rival"));
      row.text = row.tag;
    }
    if (kind === "agendas") {
      row.die = Number(r.die);
      if (![2, 4, 6, 8, 10, 12].includes(row.die)) bad(where, `needs its die, d2 to d12: ${r.die}`);
      row.aims = slotsIn(text).filter((x) => AIMS.includes(x));
      if (!row.aims.length) bad(where, "has nothing to aim at: it needs {seat}, {rival}, {res} or {asset}");
    }
    if (kind === "exceptions") {
      row.when = tagList("when");
      row.drops = tagList("drops");
      row.gives = tagList("gives");
      row.reason = typeof r.reason === "string" ? r.reason.trim() : "";
      if (!row.when.length || !row.drops.length) bad(where, "needs when (the logic it breaks) and drops (what it won't do)");
      if (!row.reason) bad(where, "needs its reason");
      else if (words(row.reason) > 12) bad(where, `a line's twelve words at most: ${row.reason}`);
    }
    if (kind === "answers" || kind === "tension") {
      row.dials = {};
      for (const [k, v] of Object.entries(r.dials ?? {})) {
        if (!DIALS.includes(k) || ![-1, 1].includes(v)) bad(where, `has a dial it can't move: ${k} ${v}`);
        else row.dials[k] = v;
      }
    }
    if (kind === "ties") {
      row.kind = r.kind;
      if (!TIES.includes(r.kind)) bad(where, `needs its kind: ${TIES.join(", ")}`);
      if (r.kind === "wildcard") {
        row.bond = r.bond;
        if (!["bond", "hostile"].includes(r.bond)) bad(where, "a wildcard needs bond: bond or hostile");
      }
      row.back = typeof r.back === "string" ? r.back.trim() : "";
      slots(row.back, "back");
      if (!slotsIn(text).includes("b")) bad(where, "needs {b}, the faction it's toward");
    }
    return row;
  }
  const rows = (v, where, kind, opts) => {
    if (v != null && !Array.isArray(v)) {
      bad(where, "should be a list");
      return [];
    }
    return list(v).map((x, i) => rowOf(x, `${where} row ${i + 1}`, kind, opts)).filter(Boolean);
  };

  // core.yaml
  const out = { v: 1, book, tags: ownTags, keeps: {}, types: {}, regions: {}, eras: {}, twists: {}, genres: {}, frames: {}, core: {}, packs: {} };
  const seeds = list(core.seeds).filter((s) => typeof s === "string" && /^[a-z]{2,12}$/.test(s));
  if (seeds.length !== list(core.seeds).length) bad("core.yaml", "a seed word's one word in small letters");
  if (new Set(seeds).size < 12) bad("core.yaml", `seeds needs at least 12 words, found ${new Set(seeds).size}`);
  for (const [field, all, into] of [["keeps", KEEPS, out.keeps], ["types", TYPES, out.types]]) {
    for (const k of all) {
      const v = core[field]?.[k];
      if (typeof v !== "string" || !v.trim()) bad("core.yaml", `${field} needs ${k}`);
      else into[k] = v.trim();
    }
    for (const k of Object.keys(core[field] ?? {})) if (!all.includes(k)) bad("core.yaml", `${field} has one it doesn't know: ${k}`);
  }
  const sizes = {};
  for (const s of SIZES) {
    const v = Number(core.sizes?.[s]);
    if (!(v > 0)) bad("core.yaml", `sizes needs how often ${s} comes up`);
    sizes[s] = v > 0 ? v : 1;
  }
  const templates = {};
  for (const [k, slots] of [["about", ["type", "method"]], ["face", ["name", "threat"]], ["ways", ["one", "two"]]]) {
    const v = core.templates?.[k];
    if (typeof v !== "string" || !v.trim()) bad("core.yaml", `templates needs ${k}`);
    else {
      for (const x of slotsIn(v)) if (!slots.includes(x)) bad("core.yaml", `templates.${k} has a slot nothing fills: {${x}}`);
      for (const x of slots) if (!slotsIn(v).includes(x)) bad("core.yaml", `templates.${k} needs {${x}}`);
      templates[k] = v.trim();
    }
  }
  const because = {};
  for (const k of BECAUSE) {
    const v = core.because?.[k];
    if (typeof v !== "string") bad("core.yaml", `because needs a line for ${k} (an empty one if the reason's obvious)`);
    else {
      for (const x of slotsIn(v)) if (x !== "thing") bad("core.yaml", `because.${k} has a slot nothing fills: {${x}}`);
      because[k] = v.trim();
    }
  }
  const asking = {};
  for (const q of QUESTIONS) {
    asking[q] = rows(core.asking?.[q], `core.yaml asking.${q}`, "answers");
    if (asking[q].length < 3) bad("core.yaml", `asking.${q} needs at least three answers`);
  }
  const tension = rows(core.tension, "core.yaml tension", "tension");
  if (tension.length !== 12) bad("core.yaml", `tension is a d12, so it needs twelve, found ${tension.length}`);
  const ties = rows(core.ties, "core.yaml ties", "ties");
  for (const k of TIES) if (!ties.some((t) => t.kind === k)) bad("core.yaml", `ties needs at least one ${k}`);
  for (const b of ["bond", "hostile"]) if (!ties.some((t) => t.kind === "wildcard" && t.bond === b)) bad("core.yaml", `ties needs a wildcard that's ${b}`);
  const faces = {};
  for (const [k, v] of Object.entries(core.faces ?? {})) {
    if (!TYPES.includes(k)) bad("core.yaml", `faces has a type role it doesn't know: ${k}`);
    faces[k] = list(v).filter((x) => {
      if (!threatKeys.includes(x)) bad("core.yaml", `faces.${k} has a threat the Threat Builder hasn't got: ${x}`);
      return threatKeys.includes(x);
    });
  }
  const fallbacks = {};
  for (const [k, kind] of Object.entries(FALLBACKS)) {
    if (core.fallbacks?.[k] == null) {
      bad("core.yaml", `fallbacks needs ${k}`);
      continue;
    }
    const row = rowOf(core.fallbacks[k], `core.yaml fallbacks.${k}`, kind);
    if (!row) continue;
    if (k === "secret" && !row.rival) bad("core.yaml", "fallbacks.secret has to name another faction with {rival}");
    if (k === "strange") row.strange = true;
    if (k === "agenda" && !(row.aims?.length && row.aims.every((x) => x === "seat"))) bad("core.yaml", "fallbacks.agenda aims only at a seat with {seat}, since there's always one");
    if (k === "block" && row.kind !== "blocked") bad("core.yaml", "fallbacks.block is a tie of kind blocked");
    if (k === "rival" && row.kind !== "rival") bad("core.yaml", "fallbacks.rival is a tie of kind rival");
    fallbacks[k] = row;
  }
  out.core = {
    seeds: [...new Set(seeds)],
    sizes,
    templates,
    because,
    wants: rows(core.wants, "core.yaml wants", "wants"),
    methods: rows(core.methods, "core.yaml methods", "methods"),
    secrets: rows(core.secrets, "core.yaml secrets", "secrets"),
    agendas: rows(core.agendas, "core.yaml agendas", "agendas"),
    asking,
    tension,
    ties,
    faces,
    fallbacks,
    founding: core.founding ?? null,
  };
  for (const k of ["wants", "methods", "secrets", "agendas"]) if (out.core[k].length < 12) bad("core.yaml", `${k} needs at least twelve, found ${out.core[k].length}`);
  // The first faction dealt on a board has nobody else to aim at, so it needs
  // three cards that only aim at a seat.
  const seatOnly = out.core.agendas.filter((a) => a.aims.length && a.aims.every((x) => x === "seat")).length;
  if (seatOnly < 3) bad("core.yaml", `agendas needs three that only aim at a seat, for the first faction on a board, and has ${seatOnly}`);

  // regions.yaml
  for (const r of REGIONS) {
    const g = regionsSrc[r];
    const where = `regions.yaml ${r}`;
    if (!g || typeof g !== "object") {
      bad(where, "is missing");
      continue;
    }
    const reg = { id: r };
    for (const k of ["name", "faction", "seat", "mini", "pressure"]) {
      if (typeof g[k] !== "string" || !g[k].trim()) bad(where, `needs ${k}`);
      else reg[k] = g[k].trim();
    }
    reg.sizes = {};
    for (const s of SIZES) {
      if (typeof g.sizes?.[s] !== "string" || !g.sizes[s].trim()) bad(where, `sizes needs its words for ${s}`);
      else reg.sizes[s] = g.sizes[s].trim();
    }
    reg.d6 = list(g.d6);
    if (reg.d6.length !== 6 || reg.d6.some((x) => !KEEPS.includes(x))) bad(where, "d6 needs six keep roles, one for each face");
    reg.roles = g.roles == null ? [...KEEPS] : list(g.roles).filter((x) => {
      if (!KEEPS.includes(x)) bad(where, `roles has one it doesn't know: ${x}`);
      return KEEPS.includes(x);
    });
    for (const x of reg.d6) if (!reg.roles.includes(x)) bad(where, `its d6 picks ${x}, which isn't one of its roles`);
    for (const k of Object.keys(g)) if (![...Object.keys(reg), "sizes", "d6", "roles"].includes(k)) bad(where, `has a field it doesn't know: ${k}`);
    out.regions[r] = reg;
  }
  for (const k of Object.keys(regionsSrc)) if (!REGIONS.includes(k)) bad("regions.yaml", `has a region it doesn't know: ${k}`);

  // genres.yaml
  for (const [field, into] of [["eras", out.eras], ["twists", out.twists]]) {
    for (const [k, v] of Object.entries(genresSrc[field] ?? {})) {
      if (!isKey(k) || typeof v !== "string" || !v.trim()) bad("genres.yaml", `${field}.${k} needs its name`);
      else into[k] = v.trim();
    }
  }
  if (!Object.keys(out.eras).length) bad("genres.yaml", "needs its eras");
  for (const [k, g] of Object.entries(genresSrc.genres ?? {})) {
    const where = `genres.yaml genres.${k}`;
    if (!isKey(k) || !g || typeof g.name !== "string" || !g.name.trim()) bad(where, "needs its name");
    else if (!out.eras[g.era]) bad(where, `has an era genres.yaml hasn't got: ${g.era}`);
    else if (g.twist != null && !out.twists[g.twist]) bad(where, `has a twist genres.yaml hasn't got: ${g.twist}`);
    else out.genres[k] = { id: k, name: g.name.trim(), era: g.era, twist: g.twist ?? null };
  }
  for (const [k, f] of Object.entries(genresSrc.frames ?? {})) {
    const where = `genres.yaml frames.${k}`;
    if (!f || !out.eras[f.era] || (f.twist != null && !out.twists[f.twist]) || !REGIONS.includes(f.region)) bad(where, "needs an era, a region and maybe a twist that genres.yaml has");
    else out.frames[k] = { era: f.era, twist: f.twist ?? null, region: f.region };
  }

  // The packs.
  for (const [kind, all] of [["era", src.eras ?? {}], ["twist", src.twists ?? {}]]) {
    for (const [id, p] of Object.entries(all)) {
      const file = `${kind}s/${id}.yaml`;
      const name = kind === "era" ? out.eras[id] : out.twists[id];
      if (!name) {
        bad(file, `genres.yaml hasn't got a${kind === "era" ? "n era" : " twist"} called ${id}`);
        continue;
      }
      if (!p || typeof p !== "object") {
        bad(file, "is empty");
        continue;
      }
      const fits = list(p.fits).filter((x) => {
        if (!REGIONS.includes(x)) bad(file, `fits a region it doesn't know: ${x}`);
        return REGIONS.includes(x);
      });
      if (!fits.length) bad(file, "needs fits, the regions it fits");
      const opts = { strange: kind === "twist", regionsOk: fits };
      const pack = { kind, id, name, fits };
      for (const [field, table] of [["seats", "seats"], ["resources", "resources"], ["assets", "assets"], ["types", "types"], ["methods", "methods"], ["secrets", "secrets"], ["exceptions", "exceptions"], ["wants", "wants"]]) {
        pack[field] = rows(p[field], `${file} ${field}`, table, opts);
      }
      pack.names = { factions: rows(p.names?.factions, `${file} names.factions`, "factions", opts), people: rows(p.names?.people, `${file} names.people`, "people", opts) };
      for (const k of Object.keys(p)) if (!["fits", "seats", "resources", "assets", "types", "methods", "secrets", "exceptions", "wants", "names"].includes(k)) bad(file, `has a part it doesn't know: ${k}`);
      if (minimums) {
        if (pack.exceptions.length < 6) bad(file, `needs six exceptions, found ${pack.exceptions.length}`);
        if (kind === "era") {
          const fit = (row, region) => !row.regions || row.regions.includes(region);
          const fitSize = (row, size) => !row.sizes || row.sizes.includes(size);
          for (const region of fits) {
            const roles = out.regions[region]?.roles ?? KEEPS;
            for (const role of roles) {
              for (const field of ["seats", "resources"]) {
                const c = pack[field].filter((r) => r.role === role && fit(r, region)).length;
                if (c < 4) bad(file, `${region} has ${c} of the 4 ${field} it needs for ${role}`);
              }
            }
            const named = new Set(pack.assets.map((a) => a.role));
            for (const role of named) {
              const c = pack.assets.filter((a) => a.role === role && fit(a, region)).length;
              if (c < 4) bad(file, `${region} has ${c} of the 4 names it needs for ${role}`);
            }
            const people = pack.assets.filter((a) => a.power && fit(a, region)).length;
            if (people < 12) bad(file, `${region} has ${people} of the 12 people who turn up it needs`);
            for (const role of TYPES) {
              for (const size of SIZES) {
                const c = pack.types.filter((t) => t.role === role && fit(t, region) && fitSize(t, size)).length;
                if (c < 2) bad(file, `${region} has ${c} of the 2 types it needs for ${role} at ${size}`);
              }
            }
          }
          const rivals = pack.secrets.filter((s) => s.rival).length;
          if (pack.secrets.length && rivals * 3 < pack.secrets.length) bad(file, `one Secret in three names another faction, and ${rivals} of ${pack.secrets.length} do`);
        }
      }
      out.packs[`${kind}:${id}`] = pack;
    }
  }
  return { tables: problems.length ? null : out, problems };
}
