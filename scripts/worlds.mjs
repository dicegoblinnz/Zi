// Whole worlds (notes/builder-plan.md, A whole world): a campaign world
// written whole rather than dealt, the way a campaign looks once it's set up
// and running, read off content/worlds/ and checked here into
// public/worlds/<universe>-<year>.json. Night City is the first (stages 12 to
// 19), a fan-made world from the Cyberpunk universe, and the one place
// CLAUDE.md lets another game be named. Abnu, Mo's own setting, is the second
// (stages 15 and 16). Nothing here goes into book.json, the chapters, the
// sheets, search or the builder's tables.
//
// How a world's written. Every word's plain text with plain apostrophes,
// since the build makes them curly, and every key is lower case letters,
// digits and dashes.
//
// content/worlds/<universe>/world.yaml, the universe:
//   id, name     its key and its name (night-city, Night City)
//   own          true for a world of Mo's own (Abnu), which has no whose and
//                no notices. Every other world has both:
//   whose        the line saying whose it is, in Mo's voice
//   notices      the companies' own notices, word for word, under it
//   kinds        the kinds of faction the page sorts by: { key: name }
//   years        { <year>: { title, when, recipe: { region, era, twist,
//                dials? } } }, when being where in the year it starts, and
//                recipe the builder's mix it deals at (Add a faction, from
//                stage 14), with any dials it sets the way a frame does
//
// content/worlds/<universe>/<year>/factions.yaml, the board: { factions: [ ... ] }
//   key, kind, size   its key, one of the kinds, and small, local, city or great
//   seat         the key of the place it sits in (a place from stage 13)
//   name, about, want, face, note   its words, as the World screen keeps them,
//                about being what it is and where it sits
//   faceOf       the key of the person who's its Face (a person from stage 13)
//   res          its resources: a name, or { text, x } with a multiplier
//   people       its people who turn up, each +1 Power: { text, does, x? }
//   assets       its other assets, each doing one thing: { text, does, x?,
//                need?, from? }. A need has nothing paying for it, and from
//                is the faction with a resource to spare that won't trade
//   agendas      up to two: { text, die, at, then? }, at being what it's
//                after, a faction's key, place:<key>, or a list of them
//   pub, mor, loy   its bonds: [{ text, kind, s? }]
//   threads      toward other factions: [{ to, text, kind?, s?, tie? }], tie
//                being rival or ally or debt (each one both ways) or left out
//   secret       { tag, more, ways }: its hidden tag with capitals on its
//                words, the rest in a line, and the two ways in a player
//                could find, which go after it the way the builder writes
//                them (core.yaml's templates.ways)
//   strange      true when the faction, or one of its assets or its Secret
//                (strange: true on that), is the board's strange thing
//   mini         { of, outs }: a mini faction, made by the faction of, with
//                its two outcomes, and a Loyalty thread toward its maker in loy
//
// content/worlds/<universe>/<year>/history.yaml, How it came to be:
//   { history: [{ age, text, hers? }] }, age 1 long ago, 2 in living memory
//   and 3 this last year, and hers when the line would give a Secret away.
//
// A year's places, people and map (stage 13) come together, all three or
// none, so a year can have its board before they're written.
//
// content/worlds/<universe>/<year>/places.yaml, its places: { places: [ ... ] },
// each a page the way pages.js keeps one:
//   key, name, aka   its key, its name, and up to 4 other names it goes by,
//                which link to it too
//   area         district or part, for the districts and their parts, which
//                the map draws as shapes. A place with neither is a spot in one
//   in           the district a part's in, or the part or district a place's in
//   line, ch, look   what it is, its Challenge (1 to 6) and what it's like
//   here         who's here, a line each, anyone with a page named in it
//   ground       *Name*: what it does
//   stakes       *Name*, Challenge N: *Tag*, *Tag* (what it's for), the way
//                Twenty Places writes them, so it goes on the live table
//   clock        its scene clock: { d, text }
//   twist        its complication
//   teles        its telegraphs: [{ text, d, at }], at read the way aims.js
//                reads a page's (Defend or Confidence and what it does, one of
//                its stakes by name, the scene clock, or everyone somewhere)
//   hooks, elsewhere, note   hers, like a page's
//   secret       { tag, more }: its hidden tag, capitals on its words, and the
//                rest, with two ways in a player could find written into it
// content/worlds/<universe>/<year>/people.yaml: { people: [ ... ] }
//   key, name, aka, line (who they are), ch, look (what you notice first),
//   want, voice, rules, teles, hooks, note, as a place's are
//   at           the place they're found, whose who's here names them
//   tags         as a threat, a tag's words or { text, x, kind }, kind being
//                comes, keeps, drives, weak or power, off the Threat Builder
//   secret       { tag, more, weak }: their hidden tag, the rest, and whether
//                it's the weak point
// content/worlds/<universe>/<year>/map.yaml, the year's map in the map's own
// numbers (world.yaml's ground gives its size, 0 to w across, 0 to h down):
//   districts    { <key>: [[x, y], ...] }, every district's shape
//   parts        { <key>: [[x, y], ...] }, every part's, inside its district
//   wilds        [<key>], districts that are open country (the Badlands),
//                drawn as the land itself rather than as a district's plate
//   roads        [{ name, pts: [[x, y], ...] }], the main roads
//   marks        [{ name, kind, at: [x, y] }], landmarks you'd steer by (kind
//                is one of draw-map.js's MARKS)
//   pins         { <place key>: [x, y] }, a pin for every place, inside its
//                district and its part
//   opens        the key of the pin the map opens on, or left out for the
//                middle of the town's districts
// and world.yaml's ground, what every year shares, so it never moves:
//   ground       { size: [w, h], sea: [[x, y], ...], water: [[[x, y], ...]],
//                hills: [[[x, y], ...]] }, or for a world of seas and
//                continents (Abnu), land in place of sea: every continent and
//                island as a shape, [[[x, y], ...]], with deep: [[[x, y],
//                ...]] for its deepest water. A district's shape there can run
//                out to sea to hold all its islands, since only its land's
//                drawn
//   areas        in world.yaml, what the page calls its districts and parts,
//                { district: [one, many], part: [one, many] } (Abnu's are
//                lands and cities), districts and parts if it's left out

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { MAX, OUTCOMES, STATES, factionOf, moneyOf, stepsOf } from "../src/companion/board.js";
import { BMAX } from "../src/companion/world-record.js";
import { diceLabel, stepsToDice } from "../src/companion/dice.js";
import { curlyQuotes, readAim } from "../src/companion/aims.js";
import { PMAX, TAG_KINDS, linker, pageCardOf, pageOf } from "../src/companion/pages.js";
import { MMAX } from "../src/companion/maps.js";
import { MARKS, inShape } from "../src/worlds/draw-map.js";
import { DIALS } from "../src/companion/world-engine.js";

// A year's world, brought into a campaign whole with every was copy, stays
// under this many of the 700,000 characters a world holds (MAX_DOC in
// src/worker/world.js), so she's got room for her own.
export const WORLD_MAX = 450000;
// A line of history, in words, so How it came to be reads straight through.
export const HISTORY_WORDS = 40;
export const AGES = [1, 2, 3];
export const TIES = ["rival", "ally", "debt"];
// A year's map holds this many pins at most, of the 60 a map holds (MMAX.pins
// in maps.js), so she's got ten of her own once it's in a campaign.
export const WORLD_PINS = 50;
export const AREAS = ["district", "part"];
// What a world calls them (world.yaml's areas), one and many: a city's are
// districts and their parts, and Abnu's are lands and the one city drawn as
// a part of one.
export const AREA_WORDS = { district: ["district", "districts"], part: ["part", "parts"] };
const PLACE_FIELDS = new Set(["key", "name", "aka", "area", "in", "line", "ch", "look", "here", "ground", "stakes", "clock", "twist", "teles", "hooks", "elsewhere", "secret", "note"]);
const PERSON_FIELDS = new Set(["key", "name", "aka", "at", "line", "ch", "look", "want", "voice", "tags", "rules", "teles", "hooks", "secret", "note"]);
const GROUND = /^\*([^*]+)\*:\s*\S/;
const STAKE = /^\*([^*]+)\*,?\s*Challenge ([1-6])(?::\s*(.+?))?(?:\s*\(([^)]+)\))?$/;
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = ["bond", "hostile"];
const FACTION_FIELDS = new Set(["key", "kind", "size", "seat", "name", "about", "want", "face", "faceOf", "note", "res", "people", "assets", "agendas", "pub", "mor", "loy", "threads", "secret", "strange", "mini"]);
const BOND_LISTS = ["pub", "mor", "loy"];
const BOND_NAMES = { pub: "Public Sentiment", mor: "Morale", loy: "Loyalty" };

const curl = (s) => curlyQuotes(String(s ?? "").replace(/'/g, "’")).replace(/\s+/g, " ").trim();
const words = (s) => (String(s ?? "").match(/[A-Za-z0-9’'-]+/g) ?? []).length;
const nameKey = (s) => String(s ?? "").toLowerCase().replace(/[’']/g, "'").replace(/^the\s+/, "").trim();
const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fid = (k) => `x${k}`;

// "d2–d4" and "1–2", off the book's table of sizes.
const rangeOf = (s) => {
  const n = String(s ?? "").match(/\d+/g)?.map(Number) ?? [];
  return n.length ? [n[0], n[n.length - 1]] : null;
};

function readYaml(path, problems) {
  try {
    return parseYaml(readFileSync(path, "utf8"));
  } catch (e) {
    problems.push(`can't read ${path}: ${e.message.split("\n")[0]}`);
    return null;
  }
}

// Every universe in the folder, and each year of it, as written.
export function readWorldsDir(dir) {
  const problems = [];
  const src = [];
  if (!existsSync(dir)) return { src, problems };
  for (const u of readdirSync(dir).sort()) {
    const root = join(dir, u);
    if (!statSync(root).isDirectory()) continue;
    const worldPath = join(root, "world.yaml");
    if (!existsSync(worldPath)) {
      problems.push(`${u} has no world.yaml`);
      continue;
    }
    const world = readYaml(worldPath, problems);
    if (!world || typeof world !== "object") {
      if (world !== null || existsSync(worldPath)) problems.push(`${u}/world.yaml is empty or isn't a universe`);
      continue;
    }
    for (const name of readdirSync(root)) {
      if (/^\d{4}$/.test(name) && statSync(join(root, name)).isDirectory() && !(name in (world.years ?? {}))) problems.push(`${u}/${name}/ is there, but world.yaml's years don't have ${name}, so it won't build`);
    }
    for (const year of Object.keys(world.years ?? {})) {
      const folder = join(root, String(year));
      if (!existsSync(folder)) {
        problems.push(`${u}'s world.yaml has ${year}, but there's no ${u}/${year}/ folder`);
        continue;
      }
      const files = {};
      for (const f of ["factions", "history"]) {
        const p = join(folder, `${f}.yaml`);
        files[f] = existsSync(p) ? readYaml(p, problems) : null;
        if (!existsSync(p)) problems.push(`${u}/${year}/ has no ${f}.yaml`);
      }
      // Its places, people and map, which come together or not at all.
      const pages = ["places", "people", "map"];
      const there = pages.filter((f) => existsSync(join(folder, `${f}.yaml`)));
      if (there.length && there.length < pages.length) problems.push(`${u}/${year}/ has ${there.join(" and ")}.yaml but no ${pages.filter((f) => !there.includes(f)).join(" or ")}.yaml, and they come together`);
      for (const f of there) files[f] = readYaml(join(folder, `${f}.yaml`), problems);
      src.push({ universe: u, year: String(year), world, files });
    }
  }
  return { src, problems };
}

// One year of a universe, checked, as the page and the World screen read it.
// book is what the book gives it: Appendix B's assets and the four sizes
// (companion.worlds in book.json), and the regions from the builder's
// tables. Every problem stops the build, and notes are things worth knowing
// that don't.
export function compileWorld({ universe, year, world, files }, book) {
  const problems = [];
  const notes = [];
  const say = (p) => problems.push(p);
  const id = `${world.id ?? universe}-${year}`;
  if (world.id !== universe) say(`world.yaml's id is ${world.id ?? "missing"}, but its folder's ${universe}`);
  const yr = world.years?.[year] ?? {};
  if (!String(world.name ?? "").trim()) say("world.yaml has no name");
  // Someone else's world says whose it is with their notices under it, and a
  // world of Mo's own says so and has neither.
  const notices = asList(world.notices).filter((n) => String(n).trim()).length;
  if (world.own != null && world.own !== true) say(`world.yaml's own is ${JSON.stringify(world.own)}, and it's true for a world of Mo's own or left out`);
  if (world.own === true) {
    if (String(world.whose ?? "").trim() || notices) say("world.yaml says it's Mo's own, so it has no line saying whose it is and no notices");
  } else {
    if (!String(world.whose ?? "").trim()) say("world.yaml has no whose");
    if (notices < 1) say("world.yaml has no notices under the line saying whose it is");
  }
  if (!String(yr.title ?? "").trim()) say(`${year} has no title`);
  if (!String(yr.when ?? "").trim()) say(`${year} doesn't say where in the year it starts (when)`);
  const recipe = yr.recipe ?? {};
  if (!recipe.region || !recipe.era) say(`${year} has no recipe (its region and era for Add a faction)`);
  for (const [k, v] of Object.entries(recipe.dials ?? {})) if (!DIALS.includes(k) || ![0, 1, 2].includes(v)) say(`${year}'s recipe sets ${k} to ${v}, and its dials are ${DIALS.join(", ")}, each 0, 1 or 2`);
  const kinds = world.kinds && typeof world.kinds === "object" ? world.kinds : {};
  if (!Object.keys(kinds).length) say("world.yaml has no kinds of faction to sort the board by");
  // What the page calls its districts and parts, one and many.
  const areas = { ...AREA_WORDS };
  for (const [k, v] of Object.entries(world.areas && typeof world.areas === "object" ? world.areas : {})) {
    if (!AREA_WORDS[k] || !Array.isArray(v) || v.length !== 2 || !v.every((x) => /^[a-z][a-z ]*$/.test(String(x)))) say(`world.yaml's areas has ${k}: ${JSON.stringify(v)}, and it's district or part, each [one, many] in lower case`);
    else areas[k] = v.map(String);
  }

  // The book's sizes and Appendix B's assets.
  const sizes = Object.fromEntries((book.sizes ?? []).map((s) => [String(s.size).toLowerCase(), { power: rangeOf(s.power), res: rangeOf(s.res) }]));
  if (Object.keys(sizes).length !== 4) say("can't read the book's four sizes of faction, so no card can be checked against its size");
  for (const [k, sz] of Object.entries(sizes)) if (!sz.power || !sz.res) say(`can't read the Power and resources the book gives a ${k} faction`);
  const appendix = new Map((book.assets ?? []).map((a) => [nameKey(a.text), a]));

  // ── The factions.
  const raw = asList(files.factions?.factions);
  if (!raw.length) say(`${year}/factions.yaml has no factions`);
  const keys = new Map();
  for (const f of raw) {
    if (!f || typeof f !== "object") {
      say(`${year}/factions.yaml has an entry that isn't a faction: ${JSON.stringify(f).slice(0, 60)}`);
      continue;
    }
    if (!KEY.test(String(f.key ?? ""))) say(`a faction's key isn't a key: ${JSON.stringify(f.key ?? f.name)}`);
    else if (keys.has(f.key)) say(`two factions have the key ${f.key}`);
    else keys.set(f.key, f);
  }
  const named = new Map();
  for (const f of keys.values()) {
    const k = nameKey(f.name);
    if (named.has(k)) say(`${f.key} and ${named.get(k)} have the same name`);
    named.set(k, f.key);
  }
  const isFaction = (k) => keys.has(k);
  const factions = [];
  for (const f of keys.values()) {
    const who = f.name ? `${f.name}` : f.key;
    for (const k of Object.keys(f)) if (!FACTION_FIELDS.has(k)) say(`${who} has a line a faction can't hold: ${k}`);
    const mini = f.mini && typeof f.mini === "object" ? f.mini : null;
    if (!kinds[f.kind]) say(`${who}'s kind is ${f.kind ?? "missing"}, and world.yaml's kinds are ${Object.keys(kinds).join(", ")}`);
    if (!mini && !sizes[String(f.size ?? "")]) say(`${who}'s size is ${f.size ?? "missing"}, and it's small, local, city or great`);
    if (!mini && !KEY.test(String(f.seat ?? ""))) say(`${who} doesn't say where it sits (seat, a place's key)`);
    if (!mini && !KEY.test(String(f.faceOf ?? ""))) say(`${who} doesn't say who its Face is (faceOf, a person's key)`);
    if (mini) {
      if (!isFaction(mini.of) || keys.get(mini.of)?.mini) say(`${who} is a mini faction of ${mini.of ?? "nobody"}, which isn't a faction on the board`);
      const outs = asList(mini.outs);
      if (outs.length !== 2 || new Set(outs).size !== 2 || outs.some((o) => !OUTCOMES.includes(o))) say(`${who} is a mini faction, so it does two of the six outcomes (${OUTCOMES.join(", ")}), and it says ${outs.join(", ") || "none"}`);
    }

    // The card, in the shape board.js keeps one, with made-up ids for now. A
    // part with a line it can't hold is usually a comma in words written
    // inside { }, which YAML reads as the start of another line, so it says so.
    let n = 0;
    const next = () => fid(n++);
    const ITEM_KEYS = { resource: ["text", "x"], person: ["text", "does", "x"], asset: ["text", "does", "x", "need", "from", "strange"], agenda: ["text", "die", "at", "then"], thread: ["to", "text", "kind", "s", "tie"] };
    const item = (x, what) => {
      if (typeof x === "string") return { text: x };
      if (!x || typeof x !== "object") {
        say(`${who} has a ${what} that isn't words`);
        return { text: "" };
      }
      const allowed = ITEM_KEYS[what] ?? ["text", "kind", "s"];
      for (const k of Object.keys(x)) if (!allowed.includes(k)) say(`${who}'s ${what} ${String(x.text ?? "").slice(0, 40)} has ${JSON.stringify(k).slice(0, 50)} in it, which a ${what} can't hold (words with a comma inside { } need quotes)`);
      return x;
    };
    for (const [part, allowed] of [["secret", ["tag", "more", "ways", "strange"]], ["mini", ["of", "outs"]]]) {
      if (f[part] && typeof f[part] === "object") for (const k of Object.keys(f[part])) if (!allowed.includes(k)) say(`${who}'s ${part} has ${JSON.stringify(k).slice(0, 50)} in it, which it can't hold (words with a comma inside { } need quotes)`);
    }
    const res = asList(f.res).map((x) => item(x, "resource")).map((x) => ({ id: next(), text: curl(x.text), x: x.x ?? 1 }));
    const people = asList(f.people).map((x) => item(x, "person")).map((x) => ({ id: next(), text: curl(x.text), does: curl(x.does), power: true, x: x.x ?? 1, off: false }));
    const others = asList(f.assets).map((x) => item(x, "asset"));
    const assets = [...people, ...others.map((x) => ({ id: next(), text: curl(x.text), does: curl(x.does), power: false, x: x.x ?? 1, off: x.need === true }))];
    const agendas = asList(f.agendas).map((x) => item(x, "agenda")).map((x) => ({ id: next(), text: curl(x.text), die: x.die, then: curl(x.then) }));
    const bond = (l) => asList(f[l]).map((x) => item(x, `${BOND_NAMES[l]} thread`)).map((x) => ({ id: next(), text: curl(x.text), kind: x.kind, s: x.s ?? "whole" }));
    const threads = asList(f.threads).map((x) => item(x, "thread"));
    const card = {
      id: fid(900 + factions.length),
      name: curl(f.name),
      about: curl(f.about),
      want: curl(f.want),
      face: curl(f.face),
      secret: curl(f.secret?.tag),
      more: curl([f.secret?.more, asList(f.secret?.ways).length === 2 ? `Ways in: ${asList(f.secret.ways).map((w) => String(w).replace(/[.\s]+$/, "")).join(", or ")}.` : ""].filter(Boolean).join(" ")),
      note: curl(f.note),
      mini: Boolean(mini),
      parent: mini ? fid(900 + [...keys.keys()].indexOf(mini.of)) : null,
      outs: mini ? asList(mini.outs) : [],
      res,
      assets,
      agendas,
      pub: bond("pub"),
      mor: bond("mor"),
      loy: bond("loy"),
      threads: threads.map((x) => ({ id: next(), text: curl(x.text), kind: x.kind ?? (x.tie === "rival" ? "hostile" : TIES.includes(x.tie) ? "bond" : undefined), s: x.s ?? "whole", to: isFaction(x.to) ? fid(900 + [...keys.keys()].indexOf(x.to)) : "crew" })),
    };

    // Every word fits where the World screen keeps it.
    const fits = (v, max, what) => {
      if (String(v).length > max) say(`${who}'s ${what} runs to ${String(v).length} characters, and a card holds ${max}`);
    };
    fits(card.name, MAX.name, "name");
    for (const [k, what] of [["about", "what it is"], ["want", "Want"], ["face", "Face"], ["more", "Secret's rest"]]) fits(card[k], MAX.words, what);
    fits(card.secret, MAX.line, "Secret's tag");
    fits(card.note, MAX.note, "note");
    for (const k of ["name", "about", "want"]) if (!card[k]) say(`${who} has no ${k === "about" ? "line on what it is (about)" : k}`);
    if (!mini) {
      for (const [k, what] of [["face", "Face"], ["secret", "Secret's tag"], ["more", "Secret's rest"]]) if (!card[k]) say(`${who} has no ${what}`);
      if (card.secret && (!/^[A-Z0-9]/.test(card.secret) || /[.?]$/.test(card.secret))) say(`${who}'s Secret's tag starts with a capital and has no full stop, the way the book's cards write one: ${card.secret}`);
      if (asList(f.secret?.ways).filter((w) => String(w).trim()).length !== 2) say(`${who}'s Secret has ${asList(f.secret?.ways).length} ways in, and a Secret has two a player could find`);
    }
    for (const x of card.res) fits(x.text, MAX.name, `resource ${x.text}`);
    for (const x of card.assets) {
      fits(x.text, MAX.name, `asset ${x.text}`);
      fits(x.does, MAX.words, `${x.text}'s line on what it does`);
      if (!x.does) say(`${who}'s ${x.text} doesn't say what it does`);
      if (!Number.isInteger(x.x) || x.x < 1 || x.x > MAX.x) say(`${who}'s ${x.text} has a multiplier of ${x.x}, and it's 1 to ${MAX.x}`);
      if (x.power && !/^\+1 Power\b/.test(x.does)) say(`${who}'s ${x.text} is people who turn up, so what it does starts with +1 Power`);
      if (!x.power && /[+]\d+ Power|\badds? Power\b/i.test(x.does)) say(`${who}'s ${x.text} adds Power, but only people who turn up add Power, so it goes under people or does one thing`);
      const b = appendix.get(nameKey(x.text));
      if (b && b.power !== x.power) say(b.power ? `${who}'s ${x.text} is people in Appendix B, so it's under people` : `${who}'s ${x.text} isn't people in Appendix B, so it can't add Power`);
    }
    for (const x of card.res) if (!Number.isInteger(x.x) || x.x < 1 || x.x > MAX.x) say(`${who}'s ${x.text} has a multiplier of ${x.x}, and it's 1 to ${MAX.x}`);
    for (const x of card.agendas) {
      fits(x.text, MAX.line, `agenda ${x.text}`);
      fits(x.then, MAX.words, `agenda ${x.text}'s then`);
      if (![2, 4, 6, 8, 10, 12].includes(x.die)) say(`${who}'s agenda ${x.text} is at d${x.die}, and an agenda's at a d2 to a d12`);
    }
    for (const l of [...BOND_LISTS, "threads"]) {
      for (const x of card[l]) {
        fits(x.text, MAX.line, `${l === "threads" ? "thread" : `${BOND_NAMES[l]} thread`} ${x.text.slice(0, 40)}`);
        if (!x.text) say(`${who} has a thread with no words`);
        if (!KINDS.includes(x.kind)) say(`${who}'s thread ${x.text.slice(0, 40)} is ${x.kind ?? "neither"}, and it's bond or hostile`);
        if (!STATES.includes(x.s)) say(`${who}'s thread ${x.text.slice(0, 40)} is ${x.s}, and it's whole, strained or snapped`);
      }
    }
    for (const [l, max] of [["res", MAX.list], ["assets", MAX.list], ["agendas", MAX.agendas], ["pub", MAX.list], ["mor", MAX.list], ["loy", MAX.list], ["threads", MAX.list]]) if (card[l].length > max) say(`${who} has ${card[l].length} ${l}, and a card holds ${max}`);
    for (const x of threads) {
      if (!isFaction(x.to)) say(`${who} has a thread toward ${x.to ?? "nobody"}, which isn't a faction on the board (the crew isn't there yet)`);
      else if (x.to === f.key) say(`${who} has a thread toward itself`);
      if (x.tie != null && !TIES.includes(x.tie)) say(`${who}'s thread toward ${x.to} is a ${x.tie}, and a tie's rival, ally or debt`);
      if (x.tie === "rival" && x.kind && x.kind !== "hostile") say(`${who}'s rival thread toward ${x.to} is a bond`);
      if ((x.tie === "ally" || x.tie === "debt") && x.kind && x.kind !== "bond") say(`${who}'s ${x.tie} thread toward ${x.to} is hostile`);
    }

    // Through the same tidying the Worker does, and nothing lost.
    const tidy = factionOf(card);
    if (!tidy) say(`${who} can't be read as a faction at all`);
    else {
      for (const k of ["name", "about", "want", "face", "secret", "more", "note"]) if (tidy[k] !== card[k]) say(`${who}'s ${k} comes out changed on the World screen`);
      for (const l of ["res", "assets", "agendas", "pub", "mor", "loy", "threads"]) if (tidy[l].length !== card[l].length) say(`${who} loses ${card[l].length - tidy[l].length} of its ${l} on the World screen`);
    }

    // Power, its size and what pays for what.
    const steps = stepsOf(card);
    const dice = stepsToDice(steps);
    const money = moneyOf(card);
    if (mini) {
      if (card.res.length < 1 || card.assets.length < 1) say(`${who} is a mini faction, so it's handed a resource and an asset`);
      if (!card.loy.some((t) => t.kind === "bond")) say(`${who} is a mini faction, so it has a Loyalty thread toward ${mini.of}`);
    } else {
      const sz = sizes[f.size];
      if (sz?.power && (dice.length !== 1 || dice[0] < sz.power[0] || dice[0] > sz.power[1])) say(`${who} is ${f.size}, so its Power's d${sz.power[0]} to d${sz.power[1]}, but 1 step plus ${plural(steps - 1, "lot of people", "lots of people")} makes ${diceLabel(dice)}`);
      if (sz?.res && (card.res.length < sz.res[0] || card.res.length > sz.res[1])) say(`${who} is ${f.size}, so it has ${sz.res[0]} to ${sz.res[1]} resources, and it has ${card.res.length}`);
      if (!card.agendas.length) say(`${who} has no agenda`);
    }
    if (money.extra > 0 && card.assets.some((a) => a.off)) say(`${who} has a resource to spare and a need, so the need would be paid for: drop the need, or the spare resource`);
    if (money.short) say(`${who} has ${plural(money.paying, "asset", "assets")} to pay for and ${plural(money.res, "resource", "resources")}, so ${plural(money.short, "asset", "assets")} more ${money.short === 1 ? "is a need" : "are needs"} (need: true)`);
    for (const x of others) {
      if (x.from != null && x.need !== true) say(`${who}'s ${x.text} says who won't trade for it (from), so it's a need (need: true)`);
      if (x.from != null && !isFaction(x.from)) say(`${who}'s need ${x.text} is from ${x.from}, which isn't a faction on the board`);
    }

    factions.push({ key: f.key, kind: f.kind, size: mini ? "" : f.size, seat: f.seat ?? "", faceOf: f.faceOf ?? "", of: mini?.of ?? "", strange: f.strange === true || others.some((x) => x.strange === true) || f.secret?.strange === true, steps, die: dice[0] ?? 2, card, raw: f });
  }
  const byKey = new Map(factions.map((f) => [f.key, f]));
  for (const f of factions) {
    const made = factions.filter((m) => m.of === f.key).length;
    if (made > MAX.minis) say(`${f.card.name} has made ${made} mini factions, and a faction makes ${MAX.minis} at most`);
  }

  // ── The web: the checks a dealt board passes, over the board's own shape.
  const threadsOf = (a) => asList(byKey.get(a)?.raw.threads).filter((t) => t && typeof t === "object");
  const kindOf = (t) => t.kind ?? (t.tie === "rival" ? "hostile" : TIES.includes(t.tie) ? "bond" : "");
  const toward = (a, b, kind) => threadsOf(a).some((t) => t.to === b && kindOf(t) === kind);
  const top = factions.filter((f) => !f.of);
  for (const f of top) {
    if (!top.some((g) => g !== f && toward(f.key, g.key, "hostile") && toward(g.key, f.key, "hostile"))) say(`${f.card.name} has no rival (a faction it's hostile toward that's hostile back)`);
  }
  for (const f of factions) {
    for (const t of threadsOf(f.key)) {
      if (!isFaction(t.to)) continue;
      if (t.tie === "rival" && !toward(t.to, f.key, "hostile")) say(`${f.card.name}'s rival ${byKey.get(t.to).card.name} has no hostile thread back toward it`);
      if ((t.tie === "ally" || t.tie === "debt") && !toward(t.to, f.key, "bond")) say(`${f.card.name}'s ${t.tie} ${byKey.get(t.to).card.name} has no bond thread back toward it`);
    }
  }
  // A need blocked: an asset nothing pays for, and the faction with a resource
  // to spare holding a hostile thread across the trade.
  const needs = factions.flatMap((f) => asList(f.raw.assets).filter((a) => a?.need === true).map((a) => ({ f, a })));
  const blocked = needs.filter(({ f, a }) => isFaction(a.from) && moneyOf(byKey.get(a.from).card).extra > 0 && toward(a.from, f.key, "hostile"));
  if (top.length >= 5 && !blocked.length) say("no need's blocked: a faction with an asset nothing pays for, a need with from naming a faction with a resource to spare, and that faction hostile toward it");
  for (const { f, a } of needs) if (isFaction(a.from) && moneyOf(byKey.get(a.from).card).extra < 1) say(`${f.card.name}'s need ${a.text} is from ${byKey.get(a.from).card.name}, which has no resource to spare`);
  // A Secret that names another faction.
  const namesIn = (text, self) => factions.filter((g) => g.key !== self && new RegExp(`\\b${nameKey(g.card.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text.replace(/’/g, "'")));
  const naming = factions.filter((f) => f.card.secret && namesIn(`${f.card.secret} ${f.card.more}`, f.key).length);
  if (!naming.length) say("no Secret names another faction");
  else notes.push(`${plural(naming.length, "Secret names", "Secrets name")} another faction, of ${plural(factions.filter((f) => f.card.secret).length, "Secret", "Secrets")}`);
  // No two factions holding the same asset that does one thing.
  const held = new Map();
  for (const f of factions) {
    for (const a of f.card.assets.filter((x) => !x.power)) {
      const k = nameKey(a.text);
      if (held.has(k) && held.get(k) !== f.key) say(`${f.card.name} and ${byKey.get(held.get(k)).card.name} both hold ${a.text}, and no two factions hold the same asset that does one thing`);
      held.set(k, f.key);
    }
  }
  // Every agenda aimed at something on the board.
  const places = new Set(factions.map((f) => f.seat).filter(Boolean));
  const wanting = new Set();
  for (const f of factions) {
    for (const ag of asList(f.raw.agendas)) {
      const at = asList(ag?.at);
      if (!at.length) say(`${f.card.name}'s agenda ${ag?.text ?? ""} isn't aimed at anything (at: a faction's key or place:<key>)`);
      for (const a of at) {
        const s = String(a);
        if (s.startsWith("place:")) {
          const p = s.slice(6);
          if (!KEY.test(p)) say(`${f.card.name}'s agenda is aimed at ${s}, which isn't a place's key`);
          else if (!places.has(p)) wanting.add(p);
        } else if (!isFaction(s)) say(`${f.card.name}'s agenda ${ag?.text ?? ""} is aimed at ${s}, which isn't a faction on the board (a place is place:<key>)`);
        else if (s === f.key) say(`${f.card.name}'s agenda is aimed at itself`);
      }
    }
  }
  if (wanting.size) notes.push(`agendas are after ${plural(wanting.size, "place", "places")} that aren't anyone's seat: ${[...wanting].join(", ")}`);
  // Something strange.
  if (!factions.some((f) => f.strange)) say("nothing on the board's strange (strange: true on a faction, an asset or a Secret)");

  // ── How it came to be.
  const lines = asList(files.history?.history);
  if (lines.length > BMAX.lines) say(`How it came to be has ${lines.length} lines, and a world's record holds ${BMAX.lines}`);
  const history = [];
  for (const [i, l] of lines.entries()) {
    for (const k of Object.keys(l ?? {})) if (!["age", "text", "hers"].includes(k)) say(`history line ${i + 1} has ${JSON.stringify(k).slice(0, 50)} in it, which a line can't hold (words with a comma inside { } need quotes)`);
    const text = curl(l?.text);
    if (!AGES.includes(l?.age)) say(`history line ${i + 1} is in age ${l?.age}, and the ages are 1 (long ago), 2 (in living memory) and 3 (this last year)`);
    if (!text) say(`history line ${i + 1} has no words`);
    if (text.length > BMAX.text) say(`history line ${i + 1} runs to ${text.length} characters, and a line holds ${BMAX.text}`);
    if (words(text) > HISTORY_WORDS) say(`history line ${i + 1} runs to ${words(text)} words, past the ${HISTORY_WORDS} a line reads well at: ${text.slice(0, 60)}`);
    history.push({ age: l?.age, text, ...(l?.hers === true ? { hers: true } : {}) });
  }
  for (const a of AGES) if (!history.some((l) => l.age === a)) say(`How it came to be has nothing in age ${a}`);
  for (const [i, l] of history.entries()) if (i && l.age < history[i - 1].age) say(`history line ${i + 1} goes back to age ${l.age} after age ${history[i - 1].age}, so it's out of order`);
  const quiet = top.filter((f) => !history.some((l) => new RegExp(`\\b${nameKey(f.card.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(l.text.replace(/’/g, "'"))));
  if (quiet.length) notes.push(`How it came to be never names ${quiet.map((f) => f.card.name).join(", ")}`);

  // ── Places, people and the map (stage 13), once the year has them.
  const hasPages = ["places", "people", "map"].some((f) => files[f] != null);
  const pg = hasPages ? pagesOf({ world, files, factions, history, say, notes }) : null;
  if (!hasPages) {
    const seats = new Set(factions.map((f) => f.seat).filter(Boolean));
    notes.push(`no places, people or map yet, for ${plural(seats.size, "seat", "seats")} and ${plural(factions.filter((f) => f.faceOf).length, "Face", "Faces")}`);
  }

  // ── How big it is brought in, with a was copy of every card and page, the
  // way stage 14 brings it in, and the map with its shapes kept beside it.
  const id9 = "abcdefghi";
  const shown = { card: false, power: false, res: false, assets: false, agenda: false, bonds: false, threads: false, secret: false };
  const inWorld = factions.map((f) => ({ ...JSON.parse(JSON.stringify(f.card).replace(/"x\d+"/g, `"${id9}"`)), shown, book: { from: id, key: f.key, h: "0123456789abcdef", at: Date.now(), was: f.card } }));
  const record = { recipe, dials: { tense: 1, strange: 1, rich: 1, ruled: 1 }, seed: "", dealt: null, history: history.map((l) => ({ id: id9, ...l })), shown: [], at: Date.now() };
  // Each line on a page gets an id of its own, the length the phone's are,
  // since a page keeps only one line for each id.
  let lineN = 0;
  const lineId = () => `abcde${(lineN++).toString(36).padStart(4, "0")}`;
  const pagesIn = (pg?.pages ?? []).map((p) => {
    const withIds = (l) => (p.card[l] ?? []).map((x) => (typeof x === "string" ? { id: lineId(), text: x } : { id: lineId(), ...x }));
    return pageOf({ ...p.card, id: id9, here: withIds("here"), ground: withIds("ground"), stakes: withIds("stakes"), tags: withIds("tags"), teles: withIds("teles"), hooks: withIds("hooks"), shown: {}, book: { from: id, key: p.key, h: "0123456789abcdef", at: Date.now(), was: p.card } });
  });
  const mapsIn = pg?.map ? [{ id: id9, name: curl(yr.title), key: "", w: pg.map.size[0], h: pg.map.size[1], of: "", shown: false, pins: Object.keys(pg.map.pins).map(() => ({ id: id9, x: 0.1234, y: 0.1234, to: { k: "p", id: id9 }, name: "", shown: false })), draw: drawnOf(pg.map) }] : [];
  const size = JSON.stringify({ factions: inWorld, pages: pagesIn, maps: mapsIn, build: record }).length;
  if (size > WORLD_MAX) say(`brought in whole it comes to ${size} characters, past the ${WORLD_MAX} that leaves her room in a world (small places go before any faction does)`);

  const out = {
    v: 1,
    id,
    universe,
    year: Number(year),
    name: curl(world.name),
    own: world.own === true,
    title: curl(yr.title),
    when: curl(yr.when),
    whose: curl(world.whose),
    notices: asList(world.notices).map((n) => String(n).replace(/\s+/g, " ").trim()),
    kinds: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, curl(v)])),
    areas,
    years: Object.keys(world.years ?? {}).map(Number),
    recipe,
    // The region's words for the four sizes, so a Great faction on a City
    // board reads as the city and the land round it.
    sizeWords: book.regions?.[recipe.region]?.sizes ?? {},
    factions: factions.map(({ key, kind, size: sz, seat, faceOf, of, strange, steps, die, card, raw: r }) => ({
      key,
      kind,
      size: sz,
      seat,
      faceOf,
      of,
      strange,
      steps,
      die,
      card: stripIds(card, keys),
      aims: asList(r.agendas).map((ag) => asList(ag?.at).map(String)),
      needs: asList(r.assets).filter((a) => a?.need === true).map((a) => ({ text: curl(a.text), from: a.from ?? "" })),
      ties: asList(r.threads).map((t) => t?.tie ?? ""),
    })),
    history,
    // Its places and people, each as the page the World screen keeps, with
    // its key, the district or part it's in, and where a person's found.
    places: (pg?.pages ?? []).filter((p) => p.kind === "place").map(({ key, area, in: inside, card }) => ({ key, area, in: inside, card })),
    people: (pg?.pages ?? []).filter((p) => p.kind === "person").map(({ key, at, card }) => ({ key, at, card })),
    map: pg?.map ?? null,
    size,
  };
  return { world: problems.length ? null : out, problems, notes };
}

// The map's shapes as a campaign keeps them beside a drawn map (stage 14):
// numbers and names only.
export function drawnOf(map) {
  return { ground: map.ground, districts: map.districts, parts: map.parts, wilds: map.wilds, roads: map.roads, marks: map.marks };
}

// Words that keep their paragraphs, each curled.
const curlParas = (s) =>
  String(s ?? "")
    .split(/\n\s*\n/)
    .map((p) => curl(p))
    .filter(Boolean)
    .join("\n\n");

// A year's places and people, each read into the page the World screen keeps
// (pages.js), and its map, all checked: every seat a place and every Face a
// person, every name linking where it's written, every telegraph aimed, every
// place pinned inside its district and its part, and the shapes inside the map.
function pagesOf({ world, files, factions, history, say, notes }) {
  const pages = new Map();
  const lists = [
    ["place", asList(files.places?.places), PLACE_FIELDS, "places"],
    ["person", asList(files.people?.people), PERSON_FIELDS, "people"],
  ];
  for (const [kind, list, , file] of lists) {
    if (!list.length) say(`${file}.yaml has no ${file}`);
    for (const x of list) {
      if (!x || typeof x !== "object") {
        say(`${file}.yaml has an entry that isn't a ${kind}: ${JSON.stringify(x).slice(0, 60)}`);
        continue;
      }
      if (!KEY.test(String(x.key ?? ""))) say(`a ${kind}'s key isn't a key: ${JSON.stringify(x.key ?? x.name)}`);
      else if (pages.has(x.key)) say(`two pages have the key ${x.key}`);
      else if (factions.some((f) => f.key === x.key)) say(`${x.key} is a faction's key and a ${kind}'s, so links can't tell them apart`);
      else pages.set(x.key, { key: x.key, kind, raw: x });
    }
  }
  const DICE = [2, 4, 6, 8, 10, 12];
  const place = (k) => pages.get(k)?.kind === "place";
  const person = (k) => pages.get(k)?.kind === "person";

  for (const p of pages.values()) {
    const x = p.raw;
    const who = x.name ? String(x.name) : p.key;
    const fields = p.kind === "place" ? PLACE_FIELDS : PERSON_FIELDS;
    for (const k of Object.keys(x)) if (!fields.has(k)) say(`${who} has a line a ${p.kind} can't hold: ${k}${["want", "voice", "tags", "rules"].includes(k) ? " (that's a person's)" : ["here", "ground", "stakes", "clock", "twist", "area", "in", "elsewhere"].includes(k) ? " (that's a place's)" : ""}`);
    const line = (v) => curl(v);
    const items = (l) =>
      asList(x[l]).map((v) => {
        if (typeof v === "string" || typeof v === "number") return curl(v);
        say(`${who}'s ${l} has a line that isn't words (words with a comma inside { } need quotes): ${JSON.stringify(v).slice(0, 60)}`);
        return "";
      });
    const tags = asList(x.tags).map((t) => {
      if (typeof t === "string") return { text: curl(t), x: 1, kind: "" };
      if (!t || typeof t !== "object") return { text: "", x: 1, kind: "" };
      for (const k of Object.keys(t)) if (!["text", "x", "kind"].includes(k)) say(`${who}'s tag ${t.text ?? ""} has ${JSON.stringify(k).slice(0, 50)} in it, which a tag can't hold`);
      if (t.kind != null && !TAG_KINDS.includes(t.kind)) say(`${who}'s tag ${t.text} is a ${t.kind} tag, and a tag's ${TAG_KINDS.filter(Boolean).join(", ")} or none`);
      if (t.x != null && (!Number.isInteger(t.x) || t.x < 1 || t.x > PMAX.x)) say(`${who}'s tag ${t.text} is ×${t.x}, and a tag's ×1 to ×${PMAX.x}`);
      return { text: curl(t.text), x: t.x ?? 1, kind: t.kind ?? "" };
    });
    const teles = asList(x.teles).map((t) => {
      if (!t || typeof t !== "object") {
        say(`${who} has a telegraph that isn't { text, d, at }`);
        return { text: "", d: 6, at: "" };
      }
      for (const k of Object.keys(t)) if (!["text", "d", "at"].includes(k)) say(`${who}'s telegraph ${String(t.text ?? "").slice(0, 40)} has ${JSON.stringify(k).slice(0, 50)} in it (words with a comma inside { } need quotes)`);
      if (!DICE.includes(t.d)) say(`${who}'s telegraph ${String(t.text ?? "").slice(0, 40)} is a d${t.d}, and a telegraph's die is a d2 to a d12`);
      return { text: curlyQuotes(curl(t.text)), d: t.d, at: curl(t.at) };
    });
    const secret = x.secret && typeof x.secret === "object" ? x.secret : null;
    if (x.secret != null && !secret) say(`${who}'s Secret isn't { tag, more }`);
    if (secret) for (const k of Object.keys(secret)) if (!["tag", "more", "weak"].includes(k) || (k === "weak" && p.kind === "place")) say(`${who}'s Secret has ${JSON.stringify(k).slice(0, 50)} in it, which it can't hold`);
    const clock = x.clock && typeof x.clock === "object" ? x.clock : null;
    if (x.clock != null && !clock) say(`${who}'s scene clock isn't { d, text }`);
    if (clock && !DICE.includes(clock.d)) say(`${who}'s scene clock is a d${clock.d}, and a clock's a d2 to a d12`);
    const card = {
      key: p.key,
      kind: p.kind,
      name: line(x.name),
      aka: asList(x.aka).map(line),
      line: line(x.line),
      ch: x.ch,
      look: curlParas(x.look),
      want: line(x.want),
      twist: line(x.twist),
      here: items("here"),
      ground: items("ground"),
      stakes: items("stakes"),
      clockD: clock?.d ?? 0,
      clock: line(clock?.text),
      tags,
      rules: curlParas(x.rules),
      teles,
      hooks: items("hooks"),
      elsewhere: line(x.elsewhere),
      voice: line(x.voice),
      secret: line(secret?.tag),
      more: curlParas(secret?.more),
      weak: secret?.weak === true,
      note: curlParas(x.note),
    };
    // Every word fits where the World screen keeps it, and comes back whole.
    const fits = (v, max, what) => {
      if (String(v).length > max) say(`${who}'s ${what} runs to ${String(v).length} characters, and a page holds ${max}`);
    };
    fits(card.name, PMAX.name, "name");
    for (const a of card.aka) fits(a, PMAX.name, `other name ${a}`);
    if (card.aka.length > PMAX.aka) say(`${who} has ${card.aka.length} other names, and a page holds ${PMAX.aka}`);
    for (const [k, max, what] of [["line", PMAX.line, p.kind === "place" ? "line on what it is" : "line on who they are"], ["look", PMAX.look, p.kind === "place" ? "line on what it's like" : "line on what you notice first"], ["want", PMAX.words, "want"], ["twist", PMAX.words, "complication"], ["clock", PMAX.words, "scene clock"], ["voice", PMAX.words, "voice"], ["rules", PMAX.rules, "rules"], ["elsewhere", PMAX.elsewhere, "Elsewhere"], ["secret", PMAX.secret, "Secret's tag"], ["more", PMAX.more, "Secret's rest"], ["note", PMAX.note, "note"]]) fits(card[k], max, what);
    for (const l of ["here", "ground", "stakes", "hooks"]) {
      if (card[l].length > PMAX.list) say(`${who} has ${card[l].length} lines on its ${l}, and a page holds ${PMAX.list}`);
      for (const t of card[l]) fits(t, PMAX.item, `${l} line ${t.slice(0, 40)}`);
    }
    for (const t of card.teles) fits(t.text, PMAX.item, `telegraph ${t.text.slice(0, 40)}`);
    for (const t of card.tags) fits(t.text, PMAX.name, `tag ${t.text}`);
    if (card.teles.length > PMAX.list || card.tags.length > PMAX.list) say(`${who} has more telegraphs or tags than a page holds (${PMAX.list})`);
    for (const k of ["name", "line"]) if (!card[k]) say(`${who} has no ${k === "line" ? (p.kind === "place" ? "line on what it is" : "line on who they are") : k}`);
    if (!Number.isInteger(card.ch) || card.ch < 1 || card.ch > 6) say(`${who}'s Challenge is ${x.ch ?? "missing"}, and it's 1 to 6`);
    if (!card.look) say(`${who} has no ${p.kind === "place" ? "line on what it's like (look)" : "line on what you notice first (look)"}`);
    if (p.kind === "person" && !card.tags.length) say(`${who} has no tags, and a person's written as a threat`);
    if (card.secret && (!/^[A-Z0-9]/.test(card.secret) || /[.?]$/.test(card.secret))) say(`${who}'s Secret's tag starts with a capital and has no full stop: ${card.secret}`);
    if (card.secret && !card.more) say(`${who}'s Secret has no rest, and the rest says the ways in`);
    if (card.clock && !card.clockD) say(`${who}'s scene clock has no die`);
    if (p.kind === "place" && !AREAS.includes(x.area) && !card.clockD) say(`${who} has no scene clock, and a place that isn't a district or a part has one`);
    for (const t of card.ground) if (!GROUND.test(t)) say(`${who}'s ground ${t.slice(0, 40)} isn't *Name*: what it does, so it won't go on the live table`);
    const stakes = card.stakes.map((t) => t.match(STAKE));
    card.stakes.forEach((t, i) => {
      if (!stakes[i]) say(`${who}'s stake ${t.slice(0, 40)} isn't *Name*, Challenge N: *Tag* (what it's for), so it won't go on the live table`);
    });
    const names = stakes.filter(Boolean).map((m) => m[1].trim());
    for (const t of card.teles) {
      if (!t.text) say(`${who} has a telegraph with no words`);
      const a = readAim(t.at, names, t.text);
      if (a.why) say(`${who}'s telegraph ${t.text.slice(0, 40)} can't be aimed on the live table: ${a.why}`);
    }
    // Through the same tidying a page brought in gets, and nothing lost.
    const tidy = pageCardOf(card);
    for (const k of ["name", "line", "look", "want", "twist", "clock", "rules", "elsewhere", "voice", "secret", "more", "note"]) if (tidy[k] !== card[k] && String(card[k]).length <= (PMAX[k] ?? PMAX.words)) say(`${who}'s ${k} comes out changed on the World screen`);
    for (const l of ["here", "ground", "stakes", "tags", "teles", "hooks"]) if (tidy[l].length !== card[l].length) say(`${who} loses ${card[l].length - tidy[l].length} of its ${l} on the World screen`);
    p.card = card;
    p.area = p.kind === "place" && AREAS.includes(x.area) ? x.area : "";
    if (p.kind === "place" && x.area != null && !AREAS.includes(x.area)) say(`${who}'s area is ${x.area}, and it's district or part, or none for a place in one`);
    p.in = p.kind === "place" ? String(x.in ?? "") : "";
    p.at = p.kind === "person" ? String(x.at ?? "") : "";
  }

  // Where each place is: a district's in nothing, a part's in a district, and
  // anywhere else is in a part or a district.
  const areaOf = (k) => pages.get(k)?.area ?? "";
  for (const p of pages.values()) {
    if (p.kind !== "place") continue;
    const who = p.card.name;
    if (p.area === "district" && p.in) say(`${who} is a district, so it isn't in anywhere (in)`);
    if (p.area === "part" && areaOf(p.in) !== "district") say(`${who} is a part of a district, and its in (${p.in || "nothing"}) isn't a district`);
    if (!p.area && !["district", "part"].includes(areaOf(p.in))) say(`${who} isn't in a district or a part (in: ${p.in || "nothing"})`);
  }
  const districtOf = (k) => {
    const p = pages.get(k);
    if (!p || p.kind !== "place") return "";
    if (p.area === "district") return p.key;
    const up = pages.get(p.in);
    return up?.area === "district" ? up.key : up?.area === "part" ? up.in : "";
  };
  const partOf = (k) => {
    const p = pages.get(k);
    if (!p) return "";
    if (p.area === "part") return p.key;
    return pages.get(p.in)?.area === "part" ? p.in : "";
  };

  // Names: no two pages with one name, and a page with a faction's name only
  // where that faction sits there, that's its Face, or it's the district the
  // faction sits in (a land, Orza's for Orza), since the name links to the
  // faction everywhere but its own card.
  const named = new Map();
  for (const p of pages.values()) {
    for (const n of [p.card.name, ...p.card.aka]) {
      const k = nameKey(n);
      if (named.has(k) && named.get(k) !== p.key) say(`${p.card.name} and ${pages.get(named.get(k)).card.name} are both called ${n}`);
      named.set(k, p.key);
      const f = factions.find((g) => nameKey(g.card.name) === k);
      if (f && f.seat !== p.key && f.faceOf !== p.key && !(p.area === "district" && districtOf(f.seat) === p.key)) say(`${p.card.name} is called ${n}, the way ${f.card.name} is, so it never links`);
    }
  }

  // Every seat a place and every Face a person, each linked where the card
  // says it: its seat in what it is, and its Face in its Face line.
  const doc = { factions: factions.map((f) => ({ id: `f-${f.key}`, name: f.card.name })), pages: [...pages.values()].map((p) => ({ id: `p-${p.key}`, name: p.card.name, aka: p.card.aka })) };
  const L = linker(doc, (e) => `#${e.id}`);
  const linked = (text, self) => new Set([...L.rich(text, self).matchAll(/href="#([^"]+)"/g)].map((m) => m[1]));
  const bySeat = new Map();
  for (const f of factions) if (f.seat) bySeat.set(f.seat, [...(bySeat.get(f.seat) ?? []), f]);
  for (const f of factions) {
    if (f.of) continue;
    const who = f.card.name;
    if (!place(f.seat)) say(`${who} sits in ${f.seat}, which isn't one of the places`);
    else {
      const got = linked(f.card.about, `f-${f.key}`);
      const via = (bySeat.get(f.seat) ?? []).filter((g) => g !== f && got.has(`f-${g.key}`) && linked(g.card.about, `f-${g.key}`).has(`p-${f.seat}`));
      if (!got.has(`p-${f.seat}`) && !via.length) say(`${who}'s line on what it is doesn't link ${pages.get(f.seat).card.name}, where it sits`);
    }
    if (!person(f.faceOf)) say(`${who}'s Face is ${f.faceOf}, who isn't one of the people`);
    else if (!linked(f.card.face, `f-${f.key}`).has(`p-${f.faceOf}`)) say(`${who}'s Face line doesn't link ${pages.get(f.faceOf).card.name}`);
  }
  for (const f of factions) {
    for (const ag of asList(f.raw.agendas)) {
      for (const a of asList(ag?.at).map(String)) if (a.startsWith("place:") && !place(a.slice(6))) say(`${f.card.name}'s agenda ${ag?.text ?? ""} is after ${a.slice(6)}, which isn't one of the places`);
    }
  }
  for (const p of pages.values()) {
    if (p.kind !== "person") continue;
    const at = pages.get(p.at);
    if (!p.at) say(`${p.card.name} isn't anywhere (at: the place they're found)`);
    else if (at?.kind !== "place") say(`${p.card.name} is at ${p.at}, which isn't one of the places`);
    // Named on its who's here, or the faction they're the Face of is (Delamain,
    // the AI, at the firm that shares its name).
    else if (!at.card.here.some((h) => [...linked(h, `p-${at.key}`)].some((id) => id === `p-${p.key}` || factions.some((f) => `f-${f.key}` === id && f.faceOf === p.key)))) say(`${p.card.name} is at ${at.card.name}, and its who's here doesn't name them`);
  }

  // A name written so it doesn't link: two words or more with its letters in
  // another case (corpo plaza for Corpo Plaza). Single words are left alone,
  // since a person called Brick and a brick wall look the same.
  const forms = [];
  const sameName = new Map();
  for (const e of [...doc.factions.map((f) => ({ ...f, aka: [] })), ...doc.pages]) {
    for (const n of [e.name, ...e.aka]) {
      const core = String(n).replace(/^(The|An|A) /, "");
      const k = core.toLowerCase().replace(/’/g, "'");
      sameName.set(k, [...(sameName.get(k) ?? []), e.id]);
      if (core.split(/\s+/).length >= 2) forms.push({ id: e.id, k, name: n, re: new RegExp(`(^|[^\\p{L}\\p{N}])(${core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, "['’]")})(?![\\p{L}\\p{N}])`, "giu") });
    }
  }
  const texts = [];
  for (const f of factions) {
    const c = f.card;
    for (const t of [c.about, c.want, c.face, c.more, c.note, ...c.agendas.flatMap((a) => [a.text, a.then]), ...["pub", "mor", "loy", "threads"].flatMap((l) => c[l].map((x) => x.text)), ...c.assets.map((a) => a.does)]) texts.push([t, `f-${f.key}`, c.name]);
  }
  for (const p of pages.values()) {
    const c = p.card;
    for (const t of [c.line, c.look, c.want, c.twist, c.clock, c.rules, c.elsewhere, c.voice, c.more, c.note, ...c.here, ...c.ground, ...c.stakes, ...c.hooks, ...c.teles.map((x) => x.text)]) texts.push([t, `p-${p.key}`, c.name]);
  }
  history.forEach((l, i) => texts.push([l.text, "", `history line ${i + 1}`]));
  const unlinked = new Set();
  for (const [t, self, where] of texts) {
    if (!t) continue;
    const got = linked(t, self);
    const s = String(t).replace(/\*/g, "");
    // Every name in it, any case, bar one inside a longer name (the Voodoo
    // Boys in the Dogtown Voodoo Boys).
    const hits = forms.flatMap((form) => [...s.matchAll(form.re)].map((m) => ({ form, from: m.index + m[1].length, to: m.index + m[1].length + m[2].length, words: m[2] })));
    const kept = hits.filter((a) => !hits.some((b) => b !== a && b.from <= a.from && b.to >= a.to && b.to - b.from > a.to - a.from));
    for (const { form, words: w } of kept) {
      // Linked to whatever else shares the name counts (the Tide Chapel, the
      // faction, for the chapel it sits in).
      if ((sameName.get(form.k) ?? [form.id]).some((id) => id === self || got.has(id))) continue;
      unlinked.add(`${where} writes ${w}, which doesn't link to ${form.name}`);
    }
  }
  for (const u of unlinked) say(u);
  // A person called by a first name that isn't one of their other names.
  const loose = [];
  for (const p of pages.values()) {
    if (p.kind !== "person") continue;
    const [first, ...rest] = p.card.name.split(" ");
    if (first.length < 4 || !rest.length || p.card.aka.includes(first) || [...pages.values()].some((q) => q !== p && q.card.name.split(" ")[0] === first)) continue;
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}]| ${rest.join(" ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "u");
    if (texts.some(([t, self]) => self !== `p-${p.key}` && re.test(String(t)) && !linked(t, self).has(`p-${p.key}`))) loose.push(first);
  }
  if (loose.length) notes.push(`called by a first name that doesn't link: ${loose.join(", ")}`);

  // ── The map.
  const map = mapOf({ world, files, pages, districtOf, partOf, say });
  return { pages: [...pages.values()], map };
}

// The ground every year shares and this year's districts, parts, roads,
// landmarks and pins, every place pinned inside its district and its part.
function mapOf({ world, files, pages, districtOf, partOf, say }) {
  const g = world.ground && typeof world.ground === "object" ? world.ground : null;
  if (!g) say("world.yaml has no ground (the map's size, the sea, the water and the hills)");
  const size = asList(g?.size);
  const [w, h] = size;
  if (size.length !== 2 || !size.every((n) => Number.isInteger(n) && n >= 100 && n <= 4096)) say(`the ground's size is ${JSON.stringify(g?.size)}, and it's [w, h], whole numbers from 100 to 4096`);
  const point = (v, what) => {
    if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === "number" && Number.isFinite(n))) {
      say(`${what} has a point that isn't [x, y]: ${JSON.stringify(v).slice(0, 40)}`);
      return null;
    }
    if (v[0] < 0 || v[0] > w || v[1] < 0 || v[1] > h) say(`${what} has a point off the map: ${JSON.stringify(v)}`);
    return [Math.round(v[0]), Math.round(v[1])];
  };
  const shape = (v, what) => {
    const pts = asList(v).map((p) => point(p, what)).filter(Boolean);
    if (pts.length < 3) say(`${what} has ${pts.length} points, and a shape has three at least`);
    return pts;
  };
  const shapes = (v, what) => asList(v).map((s, i) => shape(s, `${what} ${i + 1}`));
  // A city's ground is its sea. A world of seas and continents gives its land
  // instead, every continent and island, with its deepest water.
  for (const k of Object.keys(g ?? {})) if (!["size", "sea", "land", "deep", "water", "hills"].includes(k)) say(`world.yaml's ground has a line a ground can't hold: ${k}`);
  if (g?.sea != null && g?.land != null) say("world.yaml's ground has the sea and the land, and it's one or the other");
  if (g?.deep != null && g?.land == null) say("world.yaml's ground has deep water, which only a world drawn by its land has");
  const ground =
    g?.land != null
      ? { size: [w, h], land: shapes(g.land, "the land"), deep: shapes(g.deep, "the deep water"), water: shapes(g.water, "the water"), hills: shapes(g.hills, "the hills") }
      : { size: [w, h], sea: shape(g?.sea, "the sea"), water: shapes(g?.water, "the water"), hills: shapes(g?.hills, "the hills") };
  if (ground.land && !ground.land.length) say("world.yaml's ground has no land in it");
  const m = files.map && typeof files.map === "object" ? files.map : {};
  for (const k of Object.keys(m)) if (!["districts", "parts", "wilds", "roads", "marks", "pins", "opens"].includes(k)) say(`map.yaml has a line a map can't hold: ${k}`);
  const keyed = (v, area) => {
    const out = {};
    for (const [k, pts] of Object.entries(v && typeof v === "object" ? v : {})) {
      const p = pages.get(k);
      if (p?.area !== area) say(`map.yaml draws ${k} as a ${area}, and it isn't one of the ${area === "district" ? "districts" : "parts"}`);
      out[k] = shape(pts, p?.card.name ?? k);
    }
    for (const p of pages.values()) if (p.area === area && !out[p.key]) say(`map.yaml doesn't draw ${p.card.name}, a ${area}`);
    return out;
  };
  const districts = keyed(m.districts, "district");
  const parts = keyed(m.parts, "part");
  // Open country, drawn as the land rather than a district's plate.
  const wilds = asList(m.wilds).map(String);
  for (const k of wilds) if (!districts[k]) say(`map.yaml's wilds has ${k}, which isn't one of the districts it draws`);
  // A part's inside its district, every corner of it.
  for (const [k, pts] of Object.entries(parts)) {
    const d = pages.get(k)?.in;
    if (districts[d] && pts.some((p) => !inShape(p, districts[d], 1.5))) say(`${pages.get(k).card.name} goes outside ${pages.get(d).card.name} on the map`);
  }
  const roads = asList(m.roads).map((r, i) => {
    if (!r || typeof r !== "object") return { name: "", pts: [] };
    const pts = asList(r.pts).map((p) => point(p, `road ${r.name ?? i + 1}`)).filter(Boolean);
    if (pts.length < 2) say(`road ${r.name ?? i + 1} has ${pts.length} points, and a road has two at least`);
    return { name: curl(r.name), pts };
  });
  const marks = asList(m.marks).map((x, i) => {
    if (!MARKS.includes(x?.kind)) say(`landmark ${x?.name ?? i + 1} is a ${x?.kind}, and a landmark's ${MARKS.join(", ")}`);
    if (!String(x?.name ?? "").trim()) say(`landmark ${i + 1} has no name`);
    return { name: curl(x?.name), kind: x?.kind, at: point(x?.at, `landmark ${x?.name ?? i + 1}`) ?? [0, 0] };
  });
  // A pin for every place, inside its district and its part.
  const pins = {};
  for (const [k, v] of Object.entries(m.pins && typeof m.pins === "object" ? m.pins : {})) {
    const p = pages.get(k);
    if (p?.kind !== "place") {
      say(`map.yaml has a pin for ${k}, which isn't one of the places`);
      continue;
    }
    const at = point(v, `${p.card.name}'s pin`);
    if (!at) continue;
    pins[k] = at;
    const d = districtOf(k);
    const part = partOf(k);
    if (districts[d] && !inShape(at, districts[d])) say(`${p.card.name}'s pin isn't inside ${pages.get(d).card.name}`);
    if (part && parts[part] && !inShape(at, parts[part])) say(`${p.card.name}'s pin isn't inside ${pages.get(part).card.name}`);
  }
  for (const p of pages.values()) if (p.kind === "place" && !pins[p.key]) say(`${p.card.name} has no pin on the map`);
  const n = Object.keys(pins).length;
  if (n > WORLD_PINS) say(`the map has ${n} pins, and a year's map has ${WORLD_PINS} at most, so she's got ${MMAX.pins - WORLD_PINS} of her own`);
  // Where the map opens: a pin's key (Abnu's on its capital, where most
  // campaigns start), or left out for the middle of the town's districts.
  const opens = m.opens == null ? "" : String(m.opens);
  if (opens && !pins[opens]) say(`map.yaml opens on ${opens}, which has no pin`);
  return { size: [w, h], ground, districts, parts, wilds, roads, marks, pins, opens };
}

// A card as the page reads it: no made-up ids, a thread toward another
// faction by that faction's key, and a mini faction's maker by its key.
function stripIds(card, keys) {
  const order = [...keys.keys()];
  const keyOf = (id) => (typeof id === "string" && /^x9\d\d$/.test(id) ? order[Number(id.slice(1)) - 900] ?? "" : id);
  const drop = ({ id, ...rest }) => rest;
  return {
    ...drop(card),
    parent: card.parent ? keyOf(card.parent) : null,
    res: card.res.map(drop),
    assets: card.assets.map(drop),
    agendas: card.agendas.map(drop),
    pub: card.pub.map(drop),
    mor: card.mor.map(drop),
    loy: card.loy.map(drop),
    threads: card.threads.map((t) => ({ ...drop(t), to: keyOf(t.to) })),
  };
}
