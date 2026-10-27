// Check the world builder's engine (stage 2 of notes/builder-plan.md), with no
// browser:
//
//   npm run content && node tests/check-world-engine.mjs
//
// It deals from content/world-tables/ once there are tables (stage 3), and
// till then from tests/world-pack/, a small made-up pack that's never shipped.
//
// 1. The tables' checks: a missing file, a row it can't read, a tag it
//    doesn't know, a slot nothing fills, a role with too few names, a Secret
//    without its two ways in and an agenda with nothing to aim at are each a
//    problem, and the tables themselves have none.
// 2. 200 boards in every region for every named genre the packs cover, and
//    200 for every mix at one region: the same seed deals the same board, the
//    checks pass with a fallback in under 1 board in 20, no bag gives the same
//    row twice in a board, every step that needs a because has one, and every
//    card adds up (Power from people who turn up and the die its size picked,
//    every asset paid for bar its needs, nobody holding two of the same
//    people, no two factions with the same asset that does one thing, a
//    rival each, every agenda aimed at something on the board, a seat each
//    and two to spare, and every slot filled).
// 3. Dealing one step again: the next card in its own stream, never the one
//    it had, every other faction and every earlier step as they were, and a
//    locked step left alone when one before it's dealt again. A screen's
//    three cards are different, and the first is what dealing picks.
// 4. The build's record (world-record.js, through board.js): written whole,
//    lines of history, shown, undone, junk tidied, what was dealt kept within
//    a world's size, and a player getting the history once it's shown, and
//    never the seed or anything dealt.
// 5. scripts/deal-world.mjs deals a board as text, the same for the same seed.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { apply, blank, forPlayer, readable, undoOf } from "../src/companion/board.js";
import { BAGS, cardsOf, dealWorld, lock, newSeed, options, recordOf, redeal, rngOf, SIZES } from "../src/companion/world-engine.js";
import { BMAX } from "../src/companion/world-record.js";
import { bookFor, compileTables, readTablesDir } from "../scripts/world-tables.mjs";

const problems = [];
const note = (p) => {
  problems.push(p);
  console.log(`  ✗ ${p}`);
};
const same = (got, want, what) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) note(`${what}: got ${JSON.stringify(got)?.slice(0, 300)}, wanted ${JSON.stringify(want)?.slice(0, 300)}`);
};
const yes = (ok, what) => {
  if (!ok) note(what);
};
const copy = (x) => JSON.parse(JSON.stringify(x));

for (const f of ["src/generated/book.json", "public/world-book.json"]) {
  if (!existsSync(f)) {
    console.error(`${f} isn't built. Run npm run content first.`);
    process.exit(1);
  }
}
const bookJson = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
const worldBook = JSON.parse(readFileSync("public/world-book.json", "utf8"));
const BOOK = bookFor(bookJson.companion.worlds, worldBook);
const real = existsSync("content/world-tables/core.yaml");
const DIR = real ? "content/world-tables" : "tests/world-pack";
const read = readTablesDir(DIR);
const compiled = compileTables(read.src, BOOK, { minimums: real });
for (const p of [...read.problems, ...compiled.problems]) note(`${DIR}: ${p}`);
const T = compiled.tables;
if (!T) {
  console.log(`\nThe tables in ${DIR} can't be read, so nothing's dealt.`);
  process.exit(1);
}
console.log(`Dealing from ${DIR}${real ? "" : " (the made-up pack, till stage 3's tables)"}`);

// 1. The tables' checks.
{
  const base = readTablesDir("tests/world-pack").src;
  const broken = (what, change, want, opts = { minimums: false }) => {
    const src = copy(base);
    change(src);
    const got = compileTables(src, BOOK, opts).problems;
    yes(got.some((p) => p.includes(want)), `${what}: wanted a problem saying "${want}", got ${JSON.stringify(got.slice(0, 3))}`);
  };
  broken("a missing core.yaml", (s) => delete s.core, "core.yaml: it's missing");
  broken("a row it can't read", (s) => s.core.wants.push({ txet: "To have a typo." }), "has a field it doesn't know: txet");
  broken("a row with no words", (s) => s.eras.dusk.seats.push({ role: "trade", notice: "Nothing." }), "has no words");
  broken("a tag it doesn't know", (s) => (s.eras.dusk.seats[0].tags = ["rivver"]), "a tag it doesn't know: rivver");
  broken("a role it doesn't know", (s) => (s.eras.dusk.resources[0].role = "tolls"), "a role it doesn't know: tolls");
  broken("an asset Appendix B hasn't got", (s) => (s.eras.dusk.assets[0].role = "dragon-riders"), "a role it doesn't know: dragon-riders");
  broken("a slot nothing fills", (s) => s.core.wants.push("To take {nowhere}."), "a slot nothing fills in its words: {nowhere}");
  broken("a region its pack doesn't fit", (s) => (s.eras.dusk.seats[0].regions = ["stars"]), "fits stars, which its pack doesn't");
  broken("a Secret with one way in", (s) => (s.eras.dusk.secrets[0].ways = ["Only this one"]), "two ways in");
  broken("an agenda with nothing to aim at", (s) => s.core.agendas.push({ text: "Grow rich.", die: 6 }), "nothing to aim at");
  broken("a name that's too long", (s) => s.eras.dusk.names.people.push("Anne Marie Louise de la Tour"), "a name's one to four words");
  broken("a tension table that isn't a d12", (s) => s.core.tension.pop(), "tension is a d12");
  broken("a threat the Threat Builder hasn't got", (s) => (s.core.faces.house = ["dragon"]), "a threat the Threat Builder hasn't got: dragon");
  broken("a pack genres.yaml hasn't got", (s) => (s.eras.dawn = { fits: ["town"] }), "hasn't got an era called dawn");
  broken("too few names for a role", () => {}, "of the 4 seats it needs for", { minimums: true });
  broken("too few people who turn up", (s) => (s.eras.dusk.assets = s.eras.dusk.assets.slice(0, 6)), "of the 12 people who turn up it needs", { minimums: true });
  broken("too few exceptions", (s) => s.eras.dusk.exceptions.pop(), "needs six exceptions", { minimums: true });
  same(compileTables(copy(base), BOOK, { minimums: false }).problems, [], "the made-up pack, read and checked");
  console.log("1. the tables' checks catch a missing file, unreadable rows, unknown tags, unfilled slots and too few names");
}

// 2. Boards, by the hundred.
const named = Object.values(T.genres).filter((g) => T.packs[`era:${g.era}`] && (!g.twist || T.packs[`twist:${g.twist}`]));
yes(named.length > 0, "the tables cover a named genre");
const groups = [];
for (const g of named) for (const region of T.packs[`era:${g.era}`].fits) groups.push({ what: `${g.name} at ${region}`, recipe: { region, era: g.era, twist: g.twist } });
for (const era of Object.keys(T.eras).filter((e) => T.packs[`era:${e}`])) {
  const fits = T.packs[`era:${era}`].fits;
  const region = fits.includes("city") ? "city" : fits[0];
  for (const twist of [null, ...Object.keys(T.twists).filter((t) => T.packs[`twist:${t}`])]) groups.push({ what: `the mix ${era}${twist ? ` and ${twist}` : ""} at ${region}`, recipe: { region, era, twist } });
}
const BOARDS = 200;
let dealtCount = 0;
const started = Date.now();
for (const g of groups) {
  let fallbacks = 0;
  let firstFail = null;
  const fail = (what) => {
    firstFail ??= what;
  };
  for (let b = 0; b < BOARDS; b++) {
    const rand = rngOf("check", g.what, b);
    const seed = newSeed(T, rand);
    const n = 4 + (b % 9);
    const dials = b % 10 === 0 ? { tense: 0, strange: 0, rich: 0, ruled: 0 } : b % 10 === 5 ? { tense: 2, strange: 2, rich: 2, ruled: 2 } : null;
    const opts = { recipe: g.recipe, seed, factions: n, dials };
    const W = dealWorld(T, opts);
    dealtCount++;
    if (JSON.stringify(recordOf(dealWorld(T, opts))) !== JSON.stringify(recordOf(W))) fail(`${seed} dealt two different boards`);
    if (W.fallbacks.length) fallbacks++;
    for (const c of W.checks) if (!c.ok) fail(`${seed}: the ${c.k} check still fails`);
    // No bag gives the same row twice.
    for (const [bag, step] of Object.entries(BAGS)) {
      const ids = step === "seat" ? W.seats.map((s) => s?.id) : W.factions.map((f) => (step === "face" ? f.face?.nameId : f[step]?.id));
      const got = ids.filter(Boolean);
      if (new Set(got).size !== got.length) fail(`${seed}: the ${bag} bag gave the same row twice`);
    }
    // Every step that needs a because has one.
    const picks = [...W.seats, ...W.factions.flatMap((f) => [f.type, f.method, f.want, f.agenda, f.secret, ...(f.res ?? []), ...(f.assets ?? [])]), ...(W.needs ?? []).map((x) => x.asset)];
    for (const p of picks) if (p?.by && !p.why && T.core.because[p.by] !== "") fail(`${seed}: ${p.text} was steered by its ${p.by} and doesn't say why`);
    for (const f of W.factions) if (f.exc && !f.exc.reason) fail(`${seed}: ${f.exc.text} breaks the logic without a reason`);
    // Every card adds up.
    const C = cardsOf(T, W);
    const seatsHeld = new Set();
    const oneThing = new Set();
    C.factions.forEach((f, i) => {
      const who = `${seed}, ${f.name || `faction ${i + 1}`}`;
      if (!f.name || !f.about || !f.want || !f.face || !f.secret || !f.agendas.length) fail(`${who} is missing part of its card`);
      const size = BOOK.sizes[f.size];
      if (!size || f.die < size.lo || f.die > size.hi) fail(`${who}: a ${f.size} faction with a d${f.die}`);
      if (f.die !== 2 * f.steps) fail(`${who}: its d${f.die} isn't 1 step plus its people who turn up (${f.steps} steps)`);
      if (f.res.length < size.rlo || f.res.length > size.rhi) fail(`${who}: ${f.res.length} resources for a ${f.size} faction`);
      const paid = f.assets.filter((a) => !a.off);
      if (paid.length > f.res.length) fail(`${who}: ${paid.length} assets and ${f.res.length} resources paying for them`);
      const people = W.factions[i].assets.filter((a) => a.power).map((a) => a.role);
      if (new Set(people).size !== people.length) fail(`${who} holds two of the same people`);
      for (const a of [...W.factions[i].assets.filter((x) => !x.power), ...(W.needs ?? []).filter((x) => x.i === i).map((x) => x.asset)]) {
        if (a.power) fail(`${who}: a need that's people`);
        if (oneThing.has(a.role)) fail(`${seed}: two factions hold ${a.role}`);
        oneThing.add(a.role);
      }
      if (!(W.web ?? []).some((t) => t.kind === "rival" && (t.a === i || t.b === i))) fail(`${who} has no rival`);
      if (seatsHeld.has(f.seat)) fail(`${who} shares its seat`);
      seatsHeld.add(f.seat);
      const ag = W.factions[i].agenda;
      for (const aim of ag?.aims ?? []) if (ag.at?.[aim] == null) fail(`${who}: its agenda doesn't aim at a ${aim}`);
      const words = [f.name, f.about, f.want, f.face, f.secret, f.more, ...f.res.map((r) => r.text), ...f.assets.map((a) => a.text), ...f.agendas.map((a) => a.text), ...f.threads.map((t) => t.text)];
      for (const w of words) if (/[{}]/.test(w)) fail(`${who}: a slot nobody filled in "${w}"`);
      for (const t of f.threads) if (!Number.isInteger(t.to) || t.to === i || t.to >= C.factions.length) fail(`${who}: a thread toward nobody`);
    });
    if (C.seats.length !== n + 2 || C.seats.filter((s) => s.held < 0).length !== 2) fail(`${seed}: ${C.seats.length} seats for ${n} factions`);
  }
  yes(fallbacks * 20 < BOARDS, `${g.what}: ${fallbacks} of ${BOARDS} boards needed a fallback, and that's 1 in 20 or more`);
  if (firstFail) note(`${g.what}: ${firstFail}`);
  console.log(`2. ${g.what}: ${BOARDS} boards, ${fallbacks} with a fallback`);
}
console.log(`   ${dealtCount} boards dealt twice each in ${((Date.now() - started) / 1000).toFixed(1)}s`);

// 3. Dealing one step again.
{
  const g = groups[0];
  const W = dealWorld(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 6 });
  const before = recordOf(W);
  const was = W.factions[2].method.id;
  redeal(T, W, "f:2:method");
  yes(W.factions[2].method.id !== was, "dealing a method again gives a different card");
  for (const i of [0, 1, 3, 4, 5]) for (const step of ["seat", "size", "type", "method", "want", "res", "assets", "face", "secret", "name"]) same(W.factions[i][step], before.factions[i][step], `dealing faction 3's method again leaves faction ${i + 1}'s ${step} alone`);
  for (const step of ["seat", "size", "type"]) same(W.factions[2][step], before.factions[2][step], `and faction 3's ${step}, which comes before it`);
  same(W.seats, before.seats, "and the seats");
  same(W.asking, before.asking, "and the asking");
  const again = dealWorld(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 6 });
  redeal(T, again, "f:2:method");
  same(recordOf(again), recordOf(W), "dealing the same step again on the same seed gives the same board");
  const secret = W.factions[3].secret;
  lock(W, "f:3:secret");
  redeal(T, W, "f:3:type");
  same(W.factions[3].secret, secret, "a locked Secret stays when the type before it's dealt again");
  const last = W.n - 1;
  const cards = options(T, W, `f:${last}:type`, 3);
  same(new Set(cards.map((c) => c.id)).size, cards.length, "a screen's three cards are three different ones");
  if (!W.fixes.some((f) => f.path === `f:${last}:type`)) same(cards[0]?.id, W.factions[last].type.id, "and the first is what dealing picks");
  same(SIZES, ["small", "local", "city", "great"], "the four sizes");
  console.log("3. dealing a step again changes it and what's after it on the card, and nothing else");
}

// 4. The build's record, kept with the world.
{
  const W = dealWorld(T, { recipe: groups[0].recipe, seed: "crow-salt-mill", factions: 5 });
  const doc = blank();
  const rec = { recipe: W.recipe, dials: W.dials, seed: W.seed, dealt: recordOf(W), history: [], shown: false, at: 1 };
  const run = (op) => {
    const back = undoOf(doc, op);
    return { changed: apply(doc, op), back };
  };
  const set = run({ o: "wb-set", b: rec });
  yes(set.changed, "the record goes on the world");
  same(doc.build.seed, W.seed, "with its seed");
  same(doc.build.dealt.factions.length, 5, "and what was dealt");
  same(forPlayer(doc).build, null, "a player gets nothing of it before there's a history she's shown");
  const line = run({ o: "wb-line", item: { id: "age-one-1", text: "The river came up and took the low town.", age: 1 } });
  yes(line.changed && doc.build.history.length === 1, "a line of history");
  same(forPlayer(doc).build, null, "and still nothing for a player till she shows it");
  run({ o: "wb-show", v: true });
  same(forPlayer(doc).build, { history: [{ id: "age-one-1", text: "The river came up and took the low town.", age: 1 }], shown: true }, "once she's shown it, a player gets the history");
  const seen = JSON.stringify(forPlayer(doc));
  yes(!seen.includes(W.seed) && !seen.includes("dealt") && !seen.includes(W.factions[0].type.text), "and never the seed or anything dealt");
  run({ o: "wb-edit", lid: "age-one-1", v: "The river rose." });
  same(doc.build.history[0].text, "The river rose.", "a line changed");
  const drop = run({ o: "wb-drop", lid: "age-one-1" });
  same(doc.build.history, [], "a line off it");
  for (const op of drop.back) apply(doc, op);
  same(doc.build.history[0].text, "The river rose.", "and Undo puts it back");
  const gone = run({ o: "wb-gone" });
  same(doc.build, null, "the record off the world");
  for (const op of gone.back) apply(doc, op);
  same(doc.build?.seed, W.seed, "and Undo puts it back whole");
  same(readable(copy(doc)).build, doc.build, "it comes back the same from the Worker");
  // Junk, tidied.
  const junk = blank();
  apply(junk, { o: "wb-set", b: { recipe: { region: "mars", era: "<b>x</b>", twist: 7 }, dials: { tense: 9, rich: 2 }, seed: "not a seed", dealt: "nope", history: [{ id: "BAD ID", text: "x" }, { id: "ok-1", text: "  a \u0000  b  " }, { id: "ok-1", text: "twice" }], shown: "yes" } });
  same(junk.build, { recipe: { region: "", era: "", twist: null }, dials: { tense: 1, strange: 1, rich: 2, ruled: 1 }, seed: "", dealt: null, history: [{ id: "ok-1", text: "a b", age: 0 }], shown: false, at: 0 }, "junk in a record is tidied");
  apply(junk, { o: "wb-set", b: { dealt: JSON.parse('{"__proto__": {"bad": 1}, "fine": [1, "two", {"three": null}]}') } });
  yes(!Object.prototype.hasOwnProperty.call(junk.build.dealt, "__proto__") && junk.build.dealt.bad === undefined && ({}).bad === undefined, "what was dealt can't reach past itself");
  same(junk.build.dealt.fine, [1, "two", { three: null }], "and keeps its plain words and numbers");
  apply(junk, { o: "wb-set", b: { dealt: { lines: Array.from({ length: 60 }, () => "x".repeat(4000)) } } });
  yes(JSON.stringify(junk.build.dealt).length <= BMAX.dealt, "and stays within what a world holds");
  const big = blank();
  apply(big, { o: "wb-set", b: { dealt: { a: Array.from({ length: 60 }, () => Array.from({ length: 60 }, () => "y".repeat(500))) } } });
  same(big.build.dealt, null, "a record that's too big keeps nothing of what was dealt");
  same(apply(blank(), { o: "wb-show", v: true }), false, "showing a history that isn't there changes nothing");
  const W12 = dealWorld(T, { recipe: groups[0].recipe, seed: "tide-iron-rook", factions: 12 });
  const whole12 = blank();
  apply(whole12, { o: "wb-set", b: { recipe: W12.recipe, dials: W12.dials, seed: W12.seed, dealt: recordOf(W12) } });
  same(whole12.build.dealt, recordOf(W12), "a twelve-faction board's record is kept whole");
  console.log("4. the build's record: written whole, a line at a time, shown, undone, tidied, and kept from players");
}

// 5. The dealing script.
{
  const args = ["scripts/deal-world.mjs", "--tables", DIR, "--region", groups[0].recipe.region, "--era", groups[0].recipe.era, ...(groups[0].recipe.twist ? ["--twist", groups[0].recipe.twist] : []), "--seed", "gate-moss-wren", "--factions", "4"];
  const one = execFileSync(process.execPath, args, { encoding: "utf8" });
  const two = execFileSync(process.execPath, args, { encoding: "utf8" });
  yes(one.includes("gate-moss-wren") && one.includes("Checks:") && one.includes("The ground"), "deal-world.mjs prints a board");
  same(two, one, "and the same one for the same seed");
  console.log("5. scripts/deal-world.mjs deals a board as text");
}

console.log(problems.length ? `\n${problems.length} problems` : "\nAll world engine checks passed");
process.exitCode = problems.length ? 1 : 0;
