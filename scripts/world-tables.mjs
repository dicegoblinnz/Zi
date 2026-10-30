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
//   eras     a twist's row only: the eras it fits, out of the ones its twist's
//            written for (all of them, if it doesn't say), so Magic's mail
//            stays Medieval's
//   sizes    the sizes it fits: small, local, city, great (all of them)
//   rare     true for the rare weight, 1 against the common 10
//   strange  a strange thing (a twist pack's rows always are)
//   leans    roles and tags it makes likelier on the card's later steps
//   offers   bond threads it suggests for the card, as cards to keep or
//            swipe away: [{ bond: pub | mor | loy, kind: bond | hostile, text }]
// and what its own table needs: a seat's notice (what a stranger notices
// there), a Secret's tag, more and its two ways in, an agenda's die, an
// exception's when, drops and reason, an answer's dials, a tie's kind. A type
// can have faces too, three of the Threat Builder's threats its Face is
// likeliest to be, when they aren't the ones core gives its kind.
//
// core.yaml:
//   seeds       words a seed's made of, three to a seed (ash-lantern-ford)
//   tags        every tag a row can use, besides the roles and the regions
//   keeps       the eleven keep roles, each with a line saying what it is
//   types       the twelve type roles, the same
//   sizes       how often each size comes up: { small, local, city, great }
//   templates   about ({type}, {method}), seat ({seat}, where it sits, after
//               what it is), face ({name}, {threat}), ways ({one}, {two}),
//               called and voice (the deck's, below) and newcomer (a
//               founder's faction in the founding's lines till it's named)
//   because     why a step went the way it did, one line for each thing that
//               can steer it (seat, type, method, want, answer, tension,
//               region), with {thing} for what it was, and why a faction's a
//               character's foe (after: it's after them, rivalof: it's their
//               friend's rival). An empty line says the reason's obvious.
//   wants, methods, secrets, agendas    Building a Faction's tables and the
//               agendas, as rows. An agenda aims at something with its slot:
//               {seat}, {rival}, {res} or {asset}, and once there's a crew,
//               {who} (one of the characters) or {thing} (something on the
//               party sheet worth taking).
//   asking      Building Your World's three questions: holds, runs, notices,
//               each a list of answers with the dials they move
//   tension     the twelve tensions, in order, for the roll
//   ties        between factions: kind rival, ally, debt, wildcard (with bond:
//               bond or hostile) or blocked, written from {a}'s side toward {b}
//   faces       for a type role, the Threat Builder's threats its face is
//               likeliest to be (by key, like commander or old-power)
//   crew        friends and foes, the threads toward the crew a character's
//               friend and foe are dealt, from the faction's side, each with
//               {who} for the character, and qualities: the crew's assets in
//               Appendix B (by key) that are what it's like, not something
//               it's got, so no faction's after them
//   fallbacks   what goes in when a check still fails after three deals:
//               secret, strange, agenda, block, rival, who and thing, each a
//               row
//   deck        the moments building by answering deals (stage 7), below
//   loyal       a mini faction's Loyalty thread toward its maker ({b})
//   founding    a founder's three questions (stage 11), each a list of
//               lines: before (the hostile thread whoever had its seat holds
//               toward the newcomers, {b}), owes (the newcomers' bond thread
//               toward whoever they owe, {b}, saying what's owed) and never
//               (their own Loyalty thread), each able to use {seat}
//
// The deck, in core.yaml and any pack (deck): moments from before the crew
// turned up, a card at a time (world-deck.js plays them). A moment's text is
// what the one bringing it says, up to 25 words, and it has:
//   age      1 long ago, 2 in living memory, 3 this last year
//   a, b     who brings it and who it's about, by type role (any, if it
//            doesn't say), and b: seat for a seat nobody holds
//   res, asset, people    whose {res}, {asset} or {people} the text means:
//            a's or b's (one it's got, or one dealt for it), or for {res},
//            seat, one the seat on the card gives
//   person   someone named on the card, off the pack's people ({person})
//   key, chain   a moment's key, for a chain to land on, and chain: true for
//            one that only ever comes as a chain's next card
//   last     one for the deck's last card, how things stood when the crew
//            turned up
//   answers  two, each what the bringer's faction does: its words (1 to 4),
//            does (what it does, below), tags that steer what it deals, its
//            line of history (up to 16 words, past tense), thread and back
//            (its first thread's own words, from each side), a prompt
//            (kind name, person, place or detail, with ask, of: a, b or
//            mini for a name, and three ideas or more for a detail), and
//            then (the key of the chain's next card)
// A moment's words can use {a}, {b}, {seat} (a's), {res}, {asset}, {people},
// {person}, {who} (one of the crew, which makes it a crew moment), and on a
// chain's card {place} and {detail} from a prompt before it. A line can use
// {mini} for a mini faction its answer makes, and its own prompt's word.
// What an answer does, X and Y each a or b:
//   gain res|asset|people X     X builds or finds one (Establish)
//   take res|asset|people X Y   X takes one off Y (Acquire)
//   lose res|asset|people X     X loses one (Destroy)
//   ally X Y, debt X Y (X owes Y), favour X Y (a bond from X toward Y)
//                               (Influence)
//   rival X Y, grudge X Y (a hostile thread from X toward Y), strain X Y
//                               (X's bond toward Y strained, or a grudge)
//                               (Undermine)
//   block X Y                   X won't sell Y what its need takes (Obstruct)
//   mini X out out              X makes a mini faction, doing two of the six
//   agenda X [Y|seat|who]       a grudge or a debt becomes X's agenda
//   secret X [Y]                X's Secret, naming Y if it's there
//   lean X tag...               what X is like now, which steers how it
//                               works, its Want, its Secret and its Face
//   friend X who, foe X who     X's a friend or a foe of the one on the card
//   face X                      the person on the card is X's Face
//
// regions.yaml: town, city, country, world and stars, each with name, faction,
// seat and mini (what each is at that size), sizes (the region's words for
// small, local, city and great), d6 (the keep role each face of a d6 picks),
// pressure (what pressure from one size up looks like) and roles (the keep
// roles that turn up there, all of them if it doesn't say).
//
// genres.yaml: eras and twists (each id with its name), genres (each id with
// name, era and twist if it has one) and frames (each frame's era, twist and
// region, and any dials the book sets, 0 to 2, by the id of its board in the
// book, like deep-company, so Add a faction fits a board she brought in).
//
// A pack: fits (the regions it fits), seats, resources, assets, types (with
// sizes and leans), methods, secrets, exceptions, wants (if it adds any) and
// names (factions and people). A twist pack adds its rows to the same roles,
// and every row in it is strange. It also says eras, the eras its rows are
// written for, and it only deals with those (stage 10), so a new era with a
// twist waits till someone's written the twist's rows for it. A row or a
// moment in it can narrow that with eras of its own.
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
export const BECAUSE = ["seat", "type", "method", "want", "answer", "tension", "region", "after", "rivalof", "moment"];
export const FALLBACKS = { secret: "secrets", strange: "secrets", agenda: "agendas", block: "ties", rival: "ties", who: "agendas", thing: "agendas" };
const QUESTIONS = ["holds", "runs", "notices"];

// The deck's effects, by how each is written, and the outcome each one is:
// the book's six (Destroy, Undermine, Obstruct, Influence, Acquire and
// Establish, with a mini faction Establish's own), and the three the deck
// adds (a grudge or a debt becoming an agenda, a Secret, and a lean).
export const SIX = ["destroy", "undermine", "obstruct", "influence", "acquire", "establish"];
const FX = { gain: "thing", lose: "thing", take: "take", ally: "pair", debt: "pair", favour: "pair", rival: "pair", grudge: "pair", strain: "pair", block: "pair", mini: "mini", agenda: "aim", secret: "aim", lean: "lean", friend: "who", foe: "who", face: "one" };
export const OUTCOME_OF = { gain: "establish", take: "acquire", lose: "destroy", ally: "influence", debt: "influence", favour: "influence", rival: "undermine", grudge: "undermine", strain: "undermine", block: "obstruct", mini: "mini", agenda: "agenda", secret: "secret", lean: "lean" };
export const OUTCOMES = [...new Set(Object.values(OUTCOME_OF))];
export const PROMPTS = ["name", "person", "place", "detail"];
const THINGS = ["res", "asset", "people"];
const THREADS = new Set(["ally", "debt", "favour", "rival", "grudge", "strain", "block", "friend", "foe"]);
const DECK_FIELDS = ["text", "age", "a", "b", "key", "chain", "last", "res", "asset", "people", "person", "answers", "tags", "needs", "out", "regions", "eras", "rare", "strange"];
const ANSWER_FIELDS = ["text", "line", "does", "tags", "thread", "back", "prompt", "then"];
// The plan's counts (Writing tables, The deck): moments in core and in each
// pack, the share of them in each age, in a chain and strange, and how many
// answers each outcome's on and how many moments each kind of faction's on.
export const DECK_MIN = { core: 60, pack: 12, age: 0.3, chain: 1 / 4, strange: 1 / 8, outcome: 8, kind: 6, last: 3, crew: 6, loyal: 6 };
// A founder's three questions: lines enough for eleven founders, the most a
// board of twelve has, to be dealt three each with none of them shared.
export const FOUNDING = ["before", "owes", "never"];
export const FOUNDING_MIN = 12;

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
const COMMON = ["text", "role", "tags", "needs", "out", "regions", "eras", "sizes", "rare", "strange", "leans", "offers"];
const TABLES = {
  seats: { extra: ["notice"], slots: [], name: true, role: "keep" },
  resources: { extra: [], slots: ["seat"], role: "keep" },
  assets: { extra: ["does"], slots: ["seat"], name: true, role: "asset" },
  types: { extra: ["faces"], slots: [], role: "type" },
  methods: { extra: [], slots: [] },
  wants: { extra: [], slots: [] },
  secrets: { extra: ["tag", "more", "ways"], slots: ["rival", "seat"], noText: true },
  agendas: { extra: ["die"], slots: ["seat", "rival", "res", "asset", "who", "thing"] },
  exceptions: { extra: ["when", "drops", "gives", "reason"], slots: [] },
  answers: { extra: ["dials"], slots: [] },
  tension: { extra: ["dials"], slots: [] },
  ties: { extra: ["kind", "bond", "back"], slots: ["a", "b", "res", "seat"] },
  factions: { extra: [], slots: ["seat"], name: true, role: "type" },
  people: { extra: [], slots: [], name: true },
  crew: { extra: [], slots: ["who"] },
  loyal: { extra: [], slots: ["b"] },
  "fd-before": { extra: [], slots: ["b", "seat"] },
  "fd-owes": { extra: [], slots: ["b", "seat"] },
  "fd-never": { extra: [], slots: ["seat"] },
};
const AIMS = ["seat", "rival", "res", "asset", "who", "thing"];
const words = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;
const slotsIn = (s) => [...String(s ?? "").matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]);
const isKey = (s) => typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

// The book's parts the engine deals with: each size's Power and resources
// (What a Faction Is), Appendix B's assets, the Threat Builder's threats, and
// the new crew's card off The Party Sheet (what nobody's after).
export function bookFor(worlds, worldBook, party = null) {
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
  // The boards a GM brings in from the book, which a frame's mix is keyed by.
  const boards = (worlds?.boards ?? []).map((b) => ({ id: b.id, name: b.name }));
  const start = { res: (party?.start?.res ?? []).map((r) => r.text).filter(Boolean), assets: (party?.start?.assets ?? []).map((a) => a.text).filter(Boolean) };
  return { sizes, assets, threats, boards, start };
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
// "every role has at least four names for each region its pack fits", with
// twelve faction names and twelve people's names for each region (one for
// every faction on the biggest board) and three strange Secrets with core's,
// which the shipped packs have to meet. The engine's own check runs a small
// made-up pack without it.
export function compileTables(raw, book, { minimums = true } = {}) {
  const problems = [];
  const bad = (where, what) => problems.push(`${where}: ${what}`);
  // The YAML's written with plain apostrophes, and every word it shows on
  // the site gets the curly one the rest of the site uses.
  const curly = (v) => (typeof v === "string" ? v.replace(/'/g, "’") : Array.isArray(v) ? v.map(curly) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, curly(x)])) : v);
  const src = curly(raw);
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
  // The eras a twist's row or moment fits, out of erasOk, the ones its twist's
  // written for. Anywhere else (erasOk null) a row fits whatever deals it.
  const erasOf = (v, where, erasOk) => {
    if (v == null) return null;
    if (!erasOk) {
      bad(where, "only a twist's rows say which eras they fit");
      return null;
    }
    const got = list(v).filter((x) => {
      if (!out.eras[x]) bad(where, `has an era genres.yaml hasn't got: ${x}`);
      else if (!erasOk.includes(x)) bad(where, `fits ${x}, which its pack isn't written for`);
      return erasOk.includes(x);
    });
    if (!list(v).length) bad(where, "eras needs one era at least");
    return got.length ? got : null;
  };
  function rowOf(raw, where, kind, { strange = false, regionsOk = REGIONS, erasOk = null } = {}) {
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
    // Only kept when it says, so the phone's copy of the tables stays small.
    const eras = erasOf(r.eras, where, erasOk);
    if (eras) row.eras = eras;
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
    // A Face is dealt as three cards, so a type's own faces are three at least.
    if (kind === "types" && r.faces != null) {
      row.faces = [...new Set(list(r.faces))].filter((x) => {
        if (!threatKeys.includes(x)) bad(where, `faces has a threat the Threat Builder hasn't got: ${x}`);
        return threatKeys.includes(x);
      });
      if (row.faces.length < 3) bad(where, "faces needs three threats, since a Face is dealt as three cards");
    }
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
      if (!row.aims.length) bad(where, "has nothing to aim at: it needs {seat}, {rival}, {res}, {asset}, {who} or {thing}");
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
      if (words(row.back) > 12) bad(where, `a line's twelve words at most: ${row.back}`);
      if (!slotsIn(text).includes("b")) bad(where, "needs {b}, the faction it's toward");
    }
    if (kind === "crew" && !slotsIn(text).includes("who")) bad(where, "needs {who}, the character it's named for");
    if (kind === "loyal" && !slotsIn(text).includes("b")) bad(where, "needs {b}, the faction that made it");
    if ((kind === "fd-before" || kind === "fd-owes") && !slotsIn(text).includes("b")) bad(where, kind === "fd-before" ? "needs {b}, the newcomers it's toward" : "needs {b}, whoever they owe");
    return row;
  }
  const rows = (v, where, kind, opts) => {
    if (v != null && !Array.isArray(v)) {
      bad(where, "should be a list");
      return [];
    }
    return list(v).map((x, i) => rowOf(x, `${where} row ${i + 1}`, kind, opts)).filter(Boolean);
  };

  // The deck's moments, from one file. Each is checked on its own here, and
  // its chains and the words they carry once every file's read (chainsOf()).
  const sideOf = (x) => (x === "a" || x === "b" ? x : null);
  function effectOf(s, where, m, ans) {
    const w = String(s ?? "").trim().split(/\s+/).filter(Boolean);
    const k = w[0];
    const how = FX[k];
    if (!how) {
      bad(where, `has an effect it doesn't know: ${s}`);
      return null;
    }
    // A faction on the card: a, or b when it's a faction and not a seat.
    const faction = (x) => x === "a" || (x === "b" && !m.seat);
    const two = (x, y) => faction(x) && faction(y) && x !== y;
    const fx = { k };
    if (how === "thing" || how === "take") {
      fx.what = w[1];
      fx.on = w[2];
      if (!THINGS.includes(fx.what)) bad(where, `${k} needs res, asset or people: ${s}`);
      if (how === "take") {
        fx.from = w[3];
        if (!two(fx.on, fx.from) || w.length !== 4) bad(where, `take needs who takes it and who it's taken off, a and b: ${s}`);
      } else if (!faction(fx.on) || w.length !== 3) bad(where, `${k} needs whose it is, a or b: ${s}`);
    } else if (how === "pair") {
      fx.on = w[1];
      fx.to = w[2];
      if (!two(fx.on, fx.to) || w.length !== 3) bad(where, `${k} needs two factions on the card, a and b: ${s}`);
    } else if (how === "mini") {
      fx.on = w[1];
      fx.outs = w.slice(2);
      if (!faction(fx.on)) bad(where, `mini needs its maker, a or b: ${s}`);
      if (fx.outs.length !== 2 || new Set(fx.outs).size !== 2 || fx.outs.some((o) => !SIX.includes(o))) bad(where, `mini needs two of the six outcomes (${SIX.join(", ")}): ${s}`);
    } else if (how === "aim") {
      fx.on = w[1];
      fx.to = w[2] ?? null;
      if (!faction(fx.on) || w.length > 3) bad(where, `${k} needs whose it is, a or b, and maybe what it's at: ${s}`);
      if (k === "secret" && fx.to != null && !two(fx.on, fx.to)) bad(where, `a Secret names the other faction on the card: ${s}`);
      if (k === "agenda") {
        if (fx.to == null) fx.to = fx.on === "b" ? "a" : m.seat ? "seat" : "b";
        if (fx.to === "seat" && !m.seat) bad(where, `an agenda at the seat needs b: seat: ${s}`);
        else if (fx.to === "who" && !m.crew) bad(where, `an agenda at who needs one of the crew on the card ({who}): ${s}`);
        else if (!["seat", "who"].includes(fx.to) && !two(fx.on, fx.to)) bad(where, `an agenda's at the other faction, the seat or who: ${s}`);
      }
    } else if (how === "lean") {
      fx.on = w[1];
      fx.tags = w.slice(2);
      if (!faction(fx.on) || !fx.tags.length) bad(where, `lean needs whose it is and a tag or more: ${s}`);
      for (const t of fx.tags) if (!known.has(t)) bad(where, `lean has a tag it doesn't know: ${t}`);
    } else if (how === "who") {
      fx.on = w[1];
      if (!faction(fx.on) || w[2] !== "who" || w.length !== 3) bad(where, `${k} needs whose it is and who: ${s}`);
      if (!m.crew) bad(where, `${k} needs one of the crew on the card ({who})`);
    } else if (how === "one") {
      fx.on = w[1];
      if (!faction(fx.on) || w.length !== 2) bad(where, `face needs whose Face it is, a or b: ${s}`);
      if (!m.person && ans.prompt?.kind !== "person") fx.chainPerson = true;
    }
    return fx;
  }
  function momentOf(raw, where, { strange = false, regionsOk = REGIONS, erasOk = null } = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      bad(where, "isn't a moment");
      return null;
    }
    for (const k of Object.keys(raw)) if (!DECK_FIELDS.includes(k)) bad(where, `has a field it doesn't know: ${k}`);
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    if (!text) bad(where, "has no words");
    else if (words(text) > 25) bad(where, `a moment's 25 words at most: ${text}`);
    const tagList = (field, v = raw[field]) => {
      for (const t of list(v)) if (!known.has(t)) bad(where, `${field} has a tag it doesn't know: ${t}`);
      return list(v).filter((t) => known.has(t));
    };
    const kinds = (field) => {
      if (raw[field] == null) return null;
      if (field === "b" && raw.b === "seat") return null;
      const v = list(raw[field]);
      for (const x of v) if (!TYPES.includes(x)) bad(where, `${field} has a kind of faction it doesn't know: ${x}`);
      return v.filter((x) => TYPES.includes(x));
    };
    const m = {
      id: idOf("deck", where, {}, text),
      text,
      age: Number(raw.age),
      a: kinds("a"),
      b: kinds("b"),
      seat: raw.b === "seat",
      key: raw.key ?? null,
      chain: raw.chain === true,
      last: raw.last === true,
      person: raw.person === true,
      crew: slotsIn(text).includes("who"),
      tags: tagList("tags"),
      needs: tagList("needs"),
      out: tagList("out"),
      w: raw.rare === true ? 1 : 10,
      strange: strange || raw.strange === true,
    };
    if (![1, 2, 3].includes(m.age)) bad(where, `needs its age, 1, 2 or 3: ${raw.age}`);
    if (m.key != null && !isKey(m.key)) bad(where, `its key's small letters and hyphens: ${m.key}`);
    if (m.chain && !m.key) bad(where, "a chain's card needs its key, for the one before it to land on");
    if (m.chain && (m.a || m.b)) bad(where, "a chain's card has the one before it's factions, so it can't say who's on it");
    if (m.last && m.age !== 3) bad(where, "the last card's this last year, age 3");
    for (const t of THINGS) {
      const v = raw[t];
      if (v == null) continue;
      if (!["a", "b", "seat"].includes(v) || (v === "seat" && (t !== "res" || !m.seat)) || (v === "b" && m.seat)) bad(where, `${t} is a's, b's${t === "res" && m.seat ? " or the seat's" : ""}: ${v}`);
      else m[t] = v;
    }
    if (raw.regions != null) {
      m.regions = list(raw.regions).filter((x) => {
        if (!REGIONS.includes(x)) bad(where, `has a region it doesn't know: ${x}`);
        else if (!regionsOk.includes(x)) bad(where, `fits ${x}, which its pack doesn't`);
        return REGIONS.includes(x);
      });
    } else m.regions = null;
    const eras = erasOf(raw.eras, where, erasOk);
    if (eras) m.eras = eras;
    // The words a moment's own text can use, before its chain's are known.
    const base = new Set(["a", "b", "seat", ...THINGS.filter((t) => m[t]), ...(m.person ? ["person"] : []), ...(m.crew ? ["who"] : [])]);
    m.slots = slotsIn(text);
    const answers = list(raw.answers);
    if (answers.length !== 2) bad(where, `needs two answers, found ${answers.length}`);
    m.answers = answers.slice(0, 2).map((x, n) => {
      const at = `${where}, answer ${n + 1}`;
      if (!x || typeof x !== "object" || Array.isArray(x)) {
        bad(at, "isn't an answer");
        return { text: "", line: "", does: [], tags: [], slots: [] };
      }
      for (const k of Object.keys(x)) if (!ANSWER_FIELDS.includes(k)) bad(at, `has a field it doesn't know: ${k}`);
      const ans = { text: typeof x.text === "string" ? x.text.trim() : "", line: typeof x.line === "string" ? x.line.trim() : "", tags: tagList("tags", x.tags) };
      if (!ans.text || words(ans.text) > 4) bad(at, `an answer's 1 to 4 words: ${ans.text}`);
      if (slotsIn(ans.text).length) bad(at, `an answer's its own plain words, with no slot: ${ans.text}`);
      if (!ans.line) bad(at, "needs its line of history");
      else if (words(ans.line) > 16) bad(at, `a line of history's 16 words at most: ${ans.line}`);
      if (x.prompt != null) {
        const p = x.prompt;
        const kind = p?.kind;
        if (!p || typeof p !== "object" || !PROMPTS.includes(kind)) bad(at, `a prompt needs its kind: ${PROMPTS.join(", ")}`);
        else {
          ans.prompt = { kind, ask: typeof p.ask === "string" ? p.ask.trim() : "" };
          if (!ans.prompt.ask || words(ans.prompt.ask) > 12) bad(at, `a prompt asks in 1 to 12 words: ${ans.prompt.ask}`);
          for (const k of Object.keys(p)) if (!["kind", "ask", "of", "ideas"].includes(k)) bad(at, `its prompt has a field it doesn't know: ${k}`);
          if (kind === "name") {
            ans.prompt.of = p.of;
            if (!["a", "b", "mini"].includes(p.of) || (p.of === "b" && m.seat)) bad(at, "a name's prompt says whose: a, b or mini");
          }
          if (kind === "detail") {
            ans.prompt.ideas = list(p.ideas).filter((y) => typeof y === "string" && y.trim()).map((y) => y.trim());
            if (ans.prompt.ideas.length < 3) bad(at, "a detail's prompt needs three ideas or more to suggest");
            for (const y of ans.prompt.ideas) if (words(y) > 6) bad(at, `a detail's idea is 6 words at most: ${y}`);
            if (new Set(ans.prompt.ideas.map((y) => y.toLowerCase())).size !== ans.prompt.ideas.length) bad(at, "a detail's prompt has an idea twice");
          }
        }
      }
      ans.does = list(x.does).map((s) => effectOf(s, at, m, ans)).filter(Boolean);
      if (!ans.does.length) bad(at, "needs what it does");
      if (ans.prompt?.kind === "name" && ans.prompt.of === "mini" && !ans.does.some((f) => f.k === "mini")) bad(at, "a mini faction's name prompt needs the answer to make one");
      for (const k of ["thread", "back"]) {
        if (x[k] == null) continue;
        const v = typeof x[k] === "string" ? x[k].trim() : "";
        if (!v || words(v) > 12) bad(at, `${k}'s a line of 1 to 12 words: ${x[k]}`);
        ans[k] = v;
      }
      if (ans.thread != null) {
        const first = ans.does.find((f) => THREADS.has(f.k));
        if (!first) bad(at, "has a thread's words but no thread");
        else if ((first.k === "friend" || first.k === "foe") && !slotsIn(ans.thread).includes("who")) bad(at, "a thread toward the crew needs {who}");
        else if (first.k !== "friend" && first.k !== "foe" && !slotsIn(ans.thread).includes("b")) bad(at, "a thread needs {b}, the faction it's toward");
        if (ans.back != null && !["rival", "ally", "debt"].includes(first?.k)) bad(at, "only a rival, an ally or a debt goes both ways, so only they have back");
        if (ans.back == null && ["rival", "ally", "debt"].includes(first?.k)) bad(at, "a rival, an ally or a debt goes both ways, so its own words need back too");
        ans.thread0 = first?.k ?? null;
      } else if (ans.back != null) bad(at, "has back without thread");
      if (x.then != null) {
        if (!isKey(x.then)) bad(at, `then is a chain card's key: ${x.then}`);
        else ans.then = x.then;
      }
      ans.slots = [...slotsIn(ans.line), ...slotsIn(ans.thread), ...slotsIn(ans.back)];
      // A line can say what its answer gained or took, and the mini faction
      // it made, as well as what the card named.
      const own = new Set([...base, ...ans.does.filter((f) => f.k === "gain" || f.k === "take").map((f) => f.what), ...(ans.does.some((f) => f.k === "mini") ? ["mini"] : []), ...(["person", "place", "detail"].includes(ans.prompt?.kind) ? [ans.prompt.kind] : [])]);
      // A thread's written before its prompt's answered, so it can't use it.
      for (const s of slotsIn(ans.line)) if (!own.has(s) && !["person", "place", "detail"].includes(s)) bad(at, `has a slot nothing fills in its line: {${s}}`);
      for (const s of [...slotsIn(ans.thread), ...slotsIn(ans.back)]) if (!base.has(s) && !["person", "place", "detail"].includes(s)) bad(at, `has a slot nothing fills in its thread: {${s}}`);
      return ans;
    });
    for (const s of m.slots) if (!base.has(s) && !["person", "place", "detail"].includes(s)) bad(where, `has a slot nothing fills in its words: {${s}}`);
    // Something strange comes onto the board whichever way it goes: a
    // Secret (one naming nobody, since the strange ones don't) or an agenda
    // (at a faction or a seat, where the strange ones aim). A twist's rows
    // are all strange, so its moments' can deal anything.
    if (m.strange && !strange) for (const [n, ans] of m.answers.entries()) if (!ans.does.some((f) => (f.k === "secret" && f.to == null) || (f.k === "agenda" && f.to !== "who"))) bad(where, `it's strange, so answer ${n + 1} needs a Secret naming nobody, or an agenda that isn't at who`);
    return m;
  }
  const momentsOf = (v, where, opts) => {
    if (v != null && !Array.isArray(v)) {
      bad(where, "should be a list");
      return [];
    }
    return list(v).map((x, i) => momentOf(x, `${where} row ${i + 1}`, opts)).filter(Boolean);
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
  // called is what a faction's called on the deck's cards till it's named
  // (the bell-founders on the Old Bridge), and voice who's bringing a card.
  for (const [k, slots] of [["about", ["type", "method"]], ["seat", ["seat"]], ["face", ["name", "threat"]], ["ways", ["one", "two"]], ["called", ["type", "seat"]], ["voice", ["name", "faction"]], ["newcomer", []]]) {
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
  // A Face is dealt as three cards, so each kind of faction needs three
  // threats to be one of.
  if (minimums) for (const k of TYPES) if ((faces[k]?.length ?? 0) < 3) bad("core.yaml", `faces needs three threats for ${k}, found ${faces[k]?.length ?? 0}`);
  // The crew: each character's friend and foe, and the crew's assets nobody's after.
  function crewOf(c) {
    if (!c || typeof c !== "object") {
      bad("core.yaml", "crew needs friends, foes and qualities");
      return { friends: [], foes: [], qualities: [] };
    }
    const friends = rows(c.friends, "core.yaml crew.friends", "crew");
    const foes = rows(c.foes, "core.yaml crew.foes", "crew");
    if (minimums) for (const [k, v] of [["friends", friends], ["foes", foes]]) if (v.length < 12) bad("core.yaml", `crew.${k} needs at least twelve, found ${v.length}`);
    for (const [k, v] of [["friends", friends], ["foes", foes]]) if (!v.length) bad("core.yaml", `crew.${k} needs at least one`);
    const qualities = list(c.qualities).filter((x) => {
      if (!assetKeys.includes(x)) bad("core.yaml", `crew.qualities has one that isn't Appendix B's asset: ${x}`);
      return assetKeys.includes(x);
    });
    return { friends, foes, qualities };
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
    if ((k === "who" || k === "thing") && !(row.aims?.length && row.aims.every((x) => x === k))) bad("core.yaml", `fallbacks.${k} aims only at {${k}}`);
    fallbacks[k] = row;
  }
  // The founding's lines, a list for each of a founder's three questions.
  function foundingOf(v) {
    const got = {};
    for (const q of FOUNDING) {
      const list = rows(v?.[q], `core.yaml founding.${q}`, `fd-${q}`);
      if (minimums && list.length < FOUNDING_MIN) bad("core.yaml", `founding.${q} needs ${FOUNDING_MIN} lines or more, found ${list.length}`);
      got[q] = list.map((r) => ({ id: r.id, text: r.text, tags: r.tags, w: r.w, ...(r.strange ? { strange: true } : {}) }));
    }
    return got;
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
    crew: crewOf(core.crew),
    deck: momentsOf(core.deck, "core.yaml deck"),
    loyal: rows(core.loyal, "core.yaml loyal", "loyal").map((r) => ({ id: r.id, text: r.text })),
    founding: foundingOf(core.founding),
  };
  for (const k of ["wants", "methods", "secrets", "agendas"]) if (out.core[k].length < 12) bad("core.yaml", `${k} needs at least twelve, found ${out.core[k].length}`);
  // The first faction built has nobody else to aim at, so it needs three
  // cards that only aim at a seat.
  const seatOnly = out.core.agendas.filter((a) => a.aims.length && a.aims.every((x) => x === "seat")).length;
  if (seatOnly < 3) bad("core.yaml", `agendas needs three that only aim at a seat, for the first faction built, and has ${seatOnly}`);

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
    const board = (book.boards ?? []).find((b) => b.id === k);
    if (!board) bad(where, `isn't one of the book's boards to bring in, by its id: ${(book.boards ?? []).map((b) => b.id).join(", ")}`);
    else if (!f || !out.eras[f.era] || (f.twist != null && !out.twists[f.twist]) || !REGIONS.includes(f.region)) bad(where, "needs an era, a region and maybe a twist that genres.yaml has");
    else {
      // The dials a faction added to the board deals at, when the book says
      // how the world sits: magic stays quiet in the Steeplands.
      const dials = {};
      for (const [d, v] of Object.entries(f.dials ?? {})) {
        if (!DIALS.includes(d) || ![0, 1, 2].includes(v)) bad(where, `has a dial it can't set: ${d} ${v}`);
        else dials[d] = v;
      }
      out.frames[k] = { name: board.name, era: f.era, twist: f.twist ?? null, region: f.region, dials };
    }
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
      // The eras a twist's rows are written for. An era's rows are its own.
      let eras = null;
      if (p.eras != null) {
        if (kind === "era") bad(file, "an era's rows are all its own era's, so it doesn't say eras");
        else {
          eras = list(p.eras).filter((x) => {
            if (!out.eras[x]) bad(file, `eras has one genres.yaml hasn't got: ${x}`);
            return Boolean(out.eras[x]);
          });
          if (!eras.length) bad(file, "needs eras, the eras its rows are written for");
        }
      } else if (kind === "twist" && minimums) bad(file, "needs eras, the eras its rows are written for");
      const opts = { strange: kind === "twist", regionsOk: fits, erasOk: kind === "twist" ? eras ?? Object.keys(out.eras) : null };
      const pack = { kind, id, name, fits, ...(kind === "twist" ? { eras: eras?.length ? eras : null } : {}) };
      for (const [field, table] of [["seats", "seats"], ["resources", "resources"], ["assets", "assets"], ["types", "types"], ["methods", "methods"], ["secrets", "secrets"], ["exceptions", "exceptions"], ["wants", "wants"]]) {
        pack[field] = rows(p[field], `${file} ${field}`, table, opts);
      }
      pack.names = { factions: rows(p.names?.factions, `${file} names.factions`, "factions", opts), people: rows(p.names?.people, `${file} names.people`, "people", opts) };
      pack.deck = momentsOf(p.deck, `${file} deck`, opts);
      for (const k of Object.keys(p)) if (!["fits", "eras", "seats", "resources", "assets", "types", "methods", "secrets", "exceptions", "wants", "names", "deck"].includes(k)) bad(file, `has a part it doesn't know: ${k}`);
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
          for (const region of fits) {
            // A name for every faction on the biggest board, a Face's name
            // for each too, and four names for every kind of faction.
            const names = pack.names.factions.filter((r) => fit(r, region));
            if (names.length < 12) bad(file, `${region} has ${names.length} of the 12 faction names it needs`);
            for (const role of TYPES) {
              const c = names.filter((r) => !r.role || r.role === role).length;
              if (c < 4) bad(file, `${region} has ${c} of the 4 faction names it needs for ${role}`);
            }
            const people = pack.names.people.filter((r) => fit(r, region)).length;
            if (people < 12) bad(file, `${region} has ${people} of the 12 people's names it needs`);
            // Every board gets its strange thing from a Secret, so there are
            // a few to deal however low the dial is.
            const strange = [...out.core.secrets, ...pack.secrets].filter((r) => r.strange && fit(r, region)).length;
            if (strange < 3) bad(file, `${region} has ${strange} of the 3 strange Secrets it needs (core.yaml's and its own)`);
          }
          const rivals = pack.secrets.filter((s) => s.rival).length;
          if (pack.secrets.length && rivals * 3 < pack.secrets.length) bad(file, `one Secret in three names another faction, and ${rivals} of ${pack.secrets.length} do`);
        }
      }
      out.packs[`${kind}:${id}`] = pack;
    }
  }
  // The deck, whole: every chain lands on a card that's there, in its own
  // file or core's, no earlier than the card it starts from, with the same
  // kind of other side and the crew if it needs them, and the words a
  // chain's card uses ({person}, {place}, {detail}) come from every card
  // that can come before it.
  const files = [["core.yaml", out.core.deck], ...Object.values(out.packs).map((p) => [`${p.kind}s/${p.id}.yaml`, p.deck ?? []])];
  const fileOf = new Map();
  const keyed = new Map();
  for (const [file, deck] of files) {
    for (const m of deck) {
      fileOf.set(m, file);
      if (!m.key) continue;
      if (keyed.has(m.key)) bad(`${file} deck`, `two moments have the key ${m.key}`);
      else keyed.set(m.key, m);
    }
  }
  const named = (m) => `${fileOf.get(m)} deck, "${m.text.split(/\s+/).slice(0, 6).join(" ")}…"`;
  // The eras a moment can come up in: its own, or its pack's (null for core's,
  // which come up in every era), so a chain's next card can't be one that's
  // missing from a deck its first card's in.
  const erasIn = new Map();
  for (const p of Object.values(out.packs)) for (const m of p.deck ?? []) erasIn.set(m, m.eras ?? (p.kind === "era" ? [p.id] : p.eras));
  const before = new Map();
  for (const [file, deck] of files) {
    for (const m of deck) {
      for (const ans of m.answers) {
        if (!ans.then) continue;
        const t = keyed.get(ans.then);
        if (!t) {
          bad(named(m), `then lands on a key no moment has: ${ans.then}`);
          continue;
        }
        const tf = fileOf.get(t);
        if (!t.chain) bad(named(m), `then lands on ${ans.then}, which needs chain: true`);
        if (tf !== file && tf !== "core.yaml") bad(named(m), `then lands on ${ans.then} in ${tf}, and a chain stays in its own file or core's`);
        if (t.age < m.age) bad(named(m), `then lands on ${ans.then}, an age before it`);
        if (t.seat !== m.seat) bad(named(m), `then lands on ${ans.then}, whose other side isn't the same (a faction or a seat)`);
        if (t.crew && !m.crew) bad(named(m), `then lands on ${ans.then}, which needs one of the crew on the card`);
        const to = erasIn.get(t) ?? null;
        const missing = to ? (erasIn.get(m) ?? Object.keys(out.eras)).filter((e) => !to.includes(e)) : [];
        if (missing.length) bad(named(m), `then lands on ${ans.then}, which isn't written for ${missing.join(" or ")}`);
        if (!before.has(t.key)) before.set(t.key, []);
        before.get(t.key).push({ m, ans });
      }
    }
  }
  for (const m of keyed.values()) if (m.chain && !before.has(m.key)) bad(named(m), `nothing lands on the chain card ${m.key}`);
  const CHAIN_WORDS = ["person", "place", "detail"];
  const words2 = new Map();
  const wordsOf = (m, seen = new Set()) => {
    if (words2.has(m)) return words2.get(m);
    if (seen.has(m)) {
      bad(named(m), `the chain at ${m.key} comes back round on itself`);
      return new Set();
    }
    seen.add(m);
    let got = null;
    for (const { m: p, ans } of m.chain ? before.get(m.key) ?? [] : []) {
      const w = new Set([...wordsOf(p, seen), ...(p.person ? ["person"] : []), ...(CHAIN_WORDS.includes(ans.prompt?.kind) ? [ans.prompt.kind] : [])]);
      got = got ? new Set([...got].filter((x) => w.has(x))) : w;
    }
    seen.delete(m);
    words2.set(m, got ?? new Set());
    return words2.get(m);
  };
  for (const [, deck] of files) {
    for (const m of deck) {
      const w = new Set([...wordsOf(m), ...(m.person ? ["person"] : [])]);
      for (const s of m.slots) if (CHAIN_WORDS.includes(s) && !w.has(s)) bad(named(m), `uses {${s}}, which nothing before it gives`);
      m.answers.forEach((ans, n) => {
        const own = new Set([...w, ...(CHAIN_WORDS.includes(ans.prompt?.kind) ? [ans.prompt.kind] : [])]);
        for (const s of slotsIn(ans.line)) if (CHAIN_WORDS.includes(s) && !own.has(s)) bad(named(m), `answer ${n + 1}'s line uses {${s}}, which nothing before it gives`);
        for (const s of [...slotsIn(ans.thread), ...slotsIn(ans.back)]) if (CHAIN_WORDS.includes(s) && !w.has(s)) bad(named(m), `answer ${n + 1}'s thread uses {${s}}, which nothing before it gives`);
        for (const f of ans.does) if (f.chainPerson && !w.has("person")) bad(named(m), `answer ${n + 1}'s face needs a person on the card: person: true, a person prompt, or a chain that has one`);
        delete ans.slots;
        for (const f of ans.does) delete f.chainPerson;
      });
      delete m.slots;
    }
  }
  const minis = files.some(([, deck]) => deck.some((m) => m.answers.some((a) => a.does.some((f) => f.k === "mini"))));
  if (minis && !out.core.loyal.length) bad("core.yaml", "loyal needs a line, for the mini factions the deck makes");
  if (minimums) {
    const counts = (file, deck, kind) => {
      const n = deck.length;
      const most = kind === "core" ? DECK_MIN.core : DECK_MIN.pack;
      if (n < most) bad(file, `the deck needs ${most} moments or more, found ${n}`);
      for (const age of [1, 2, 3]) {
        const c = deck.filter((m) => m.age === age).length;
        if (c < Math.floor(n * DECK_MIN.age)) bad(file, `a third of the deck's in each age, and age ${age} has ${c} of ${n}`);
      }
      const chained = deck.filter((m) => m.chain || m.answers.some((a) => a.then)).length;
      if (chained < Math.ceil(n * DECK_MIN.chain)) bad(file, `one moment in four starts or carries on a chain, and ${chained} of ${n} do`);
      if (kind !== "twist") {
        const odd = deck.filter((m) => m.strange).length;
        if (odd < Math.ceil(n * DECK_MIN.strange)) bad(file, `one moment in eight's strange, and ${odd} of ${n} are`);
      }
      if (kind !== "core") return;
      for (const o of OUTCOMES) {
        const c = deck.flatMap((m) => m.answers).filter((a) => a.does.some((f) => OUTCOME_OF[f.k] === o)).length;
        if (c < DECK_MIN.outcome) bad(file, `every outcome's on ${DECK_MIN.outcome} answers or more, and ${o} is on ${c}`);
      }
      for (const k of TYPES) {
        const c = deck.filter((m) => m.a?.includes(k) || m.b?.includes(k)).length;
        if (c < DECK_MIN.kind) bad(file, `every kind of faction's on ${DECK_MIN.kind} moments or more, and ${k} is on ${c}`);
      }
      const last = deck.filter((m) => m.last).length;
      if (last < DECK_MIN.last) bad(file, `the deck needs ${DECK_MIN.last} last cards or more, found ${last}`);
      const crew = deck.filter((m) => m.crew && !m.chain).length;
      if (crew < DECK_MIN.crew) bad(file, `the deck needs ${DECK_MIN.crew} moments with one of the crew or more, so a crew of six can each come in, found ${crew}`);
      if (out.core.loyal.length < DECK_MIN.loyal) bad(file, `loyal needs ${DECK_MIN.loyal} lines or more, found ${out.core.loyal.length}`);
    };
    counts("core.yaml", out.core.deck, "core");
    for (const p of Object.values(out.packs)) counts(`${p.kind}s/${p.id}.yaml`, p.deck ?? [], p.kind);
  }
  // A frame's mix goes in with the last pack it needs, so Add a faction on a
  // board brought in from the book always has something to deal.
  for (const [k, f] of Object.entries(out.frames)) {
    const deals = (kind, id) => id == null || Boolean(out.packs[`${kind}:${id}`]?.fits.includes(f.region));
    const tw = f.twist ? out.packs[`twist:${f.twist}`] : null;
    if (!deals("era", f.era) || !deals("twist", f.twist)) bad(`genres.yaml frames.${k}`, `can't deal at ${f.region} till its packs are in, and a frame's mix goes in with the last one it needs`);
    else if (tw?.eras && !tw.eras.includes(f.era)) bad(`genres.yaml frames.${k}`, `can't deal ${f.era} with ${f.twist} till ${f.twist}'s rows are written for it`);
  }
  return { tables: problems.length ? null : out, problems };
}
