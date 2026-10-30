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

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { MAX, OUTCOMES, STATES, factionOf, moneyOf, stepsOf } from "../src/companion/board.js";
import { BMAX } from "../src/companion/world-record.js";
import { diceLabel, stepsToDice } from "../src/companion/dice.js";
import { curlyQuotes } from "../src/companion/aims.js";

// A year's world, brought into a campaign whole with every was copy, stays
// under this many of the 700,000 characters a world holds (MAX_DOC in
// src/worker/world.js), so she's got room for her own.
export const WORLD_MAX = 450000;
// A line of history, in words, so How it came to be reads straight through.
export const HISTORY_WORDS = 40;
export const AGES = [1, 2, 3];
export const TIES = ["rival", "ally", "debt"];
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = ["bond", "hostile"];
const DIALS = ["tense", "strange", "rich", "ruled"];
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
  if (wanting.size) notes.push(`agendas are after ${plural(wanting.size, "place", "places")} that aren't anyone's seat, for its places stage to write: ${[...wanting].join(", ")}`);
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

  // ── How big it is brought in, with a was copy of every card, the way
  // stage 14 brings it in.
  const id9 = "abcdefghi";
  const shown = { card: false, power: false, res: false, assets: false, agenda: false, bonds: false, threads: false, secret: false };
  const inWorld = factions.map((f) => ({ ...JSON.parse(JSON.stringify(f.card).replace(/"x\d+"/g, `"${id9}"`)), shown, book: { from: id, key: f.key, h: "0123456789abcdef", at: Date.now(), was: f.card } }));
  const record = { recipe, dials: { tense: 1, strange: 1, rich: 1, ruled: 1 }, seed: "", dealt: null, history: history.map((l) => ({ id: id9, ...l })), shown: [], at: Date.now() };
  const size = JSON.stringify({ factions: inWorld, pages: [], maps: [], build: record }).length;
  if (size > WORLD_MAX) say(`brought in whole it comes to ${size} characters, past the ${WORLD_MAX} that leaves her room in a world`);

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
    size,
  };
  return { world: problems.length ? null : out, problems, notes };
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
