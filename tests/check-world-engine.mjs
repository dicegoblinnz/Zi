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
//    without its two ways in, an agenda with nothing to aim at and a row
//    written twice are each a problem, and so are too few faction names,
//    people's names or strange Secrets. A row keeps its id when rows are
//    added round it, and the tables themselves have no problems.
// 2. 200 boards in every region for every named genre the packs cover, and
//    200 for every mix at one region: the same seed deals the same board, the
//    checks pass with a fallback in under 1 board in 20, no bag gives the same
//    row twice in a board, every step that needs a because has one, and every
//    card adds up (Power from people who turn up and the die its size picked,
//    every asset paid for bar its needs, nobody holding two of the same
//    people, no two factions with the same asset that does one thing, a
//    rival each, every agenda aimed at something on the board, a seat each
//    and two to spare, and every slot filled). A bag only gives a row twice
//    once it's run out, and says so.
// 3. Dealing one step again: the next card in its own stream, never the one
//    it had, every other faction and every earlier step as they were, a
//    locked step left alone when one before it's dealt again, and a locked
//    step never dealt again itself. A screen's three cards are different,
//    and the first is what dealing picks, a Face's too. A new seat deals the
//    card sitting on it again from its size, dealing the rest can stop short
//    of the web and the checks, a board's four to twelve factions, a genre
//    never deals where its twist's pack doesn't go, and a world picks up from
//    its record just as it was.
// 4. The build's record (world-record.js, through board.js): written whole,
//    lines of history, shown, undone, junk tidied, what was dealt kept within
//    a world's size, one too big turned down whole, a twelve-faction record
//    well inside one change, and a player getting the history once it's
//    shown, and never the seed or anything dealt.
// 5. scripts/deal-world.mjs deals a board as text, the same for the same seed.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { apply, blank, forPlayer, readable, undoOf } from "../src/companion/board.js";
import { BAGS, CHECKS, canDeal, cardsOf, choose, dealRest, dealWorld, lock, newSeed, options, recordOf, redeal, resume, rngOf, SIZES, start } from "../src/companion/world-engine.js";
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
  broken("too few faction names", (s) => (s.eras.dusk.names.factions = s.eras.dusk.names.factions.slice(0, 5)), "of the 12 faction names it needs", { minimums: true });
  broken("too few people's names", (s) => (s.eras.dusk.names.people = s.eras.dusk.names.people.slice(0, 5)), "of the 12 people's names it needs", { minimums: true });
  const plain = (r) => (typeof r === "string" ? r : { ...r, strange: false });
  broken("too few strange Secrets", (s) => ((s.core.secrets = s.core.secrets.map(plain)), (s.eras.dusk.secrets = s.eras.dusk.secrets.map(plain))), "of the 3 strange Secrets it needs", { minimums: true });
  same(compileTables(copy(base), BOOK, { minimums: false }).problems, [], "the made-up pack, read and checked");
  broken("too few agendas for the first faction built", (s) => (s.core.agendas = s.core.agendas.filter((a) => /\{(rival|res|asset)\}/.test(a.text)).concat([{ text: "Take {seat}.", die: 4 }])), "three that only aim at a seat");
  broken("a fallback agenda that needs another faction", (s) => (s.core.fallbacks.agenda = { text: "Take {seat} from {rival}.", die: 4 }), "fallbacks.agenda aims only at a seat");
  broken("a row written twice", (s) => s.eras.dusk.seats.push({ ...s.eras.dusk.seats[2] }), "says the same as eras/dusk.yaml seats row 3");
  // A row keeps its id when rows are added round it, so a world built from
  // last week's tables still knows which rows it holds.
  {
    const idsOf = (t) => Object.fromEntries(["seats", "resources", "assets", "types", "secrets", "names"].flatMap((k) => (k === "names" ? t.packs["era:dusk"].names.people : t.packs["era:dusk"][k]).map((r) => [`${k}|${r.text || r.tag}`, r.id])));
    const was = idsOf(compileTables(copy(base), BOOK, { minimums: false }).tables);
    const more = copy(base);
    more.eras.dusk.seats.unshift({ text: "The New Bridge", role: "passage", notice: "Fresh mortar and a toll nobody pays yet." });
    more.core.wants.unshift("To be first at everything.");
    more.eras.dusk.names.people.unshift("Hal Mercer");
    const now = idsOf(compileTables(more, BOOK, { minimums: false }).tables);
    same(Object.keys(was).filter((k) => now[k] !== was[k]), [], "rows added at the top leave every other row's id as it was");
  }
  console.log("1. the tables' checks catch a missing file, unreadable rows, unknown tags, unfilled slots, rows written twice and too few names, and a row keeps its id");
}

// 2. Boards, by the hundred.
const named = Object.values(T.genres).filter((g) => T.packs[`era:${g.era}`] && (!g.twist || T.packs[`twist:${g.twist}`]));
yes(named.length > 0, "the tables cover a named genre");
const groups = [];
for (const g of named) for (const region of T.packs[`era:${g.era}`].fits) if (canDeal(T, { region, era: g.era, twist: g.twist })) groups.push({ what: `${g.name} at ${region}`, recipe: { region, era: g.era, twist: g.twist } });
for (const era of Object.keys(T.eras).filter((e) => T.packs[`era:${e}`])) {
  const fits = T.packs[`era:${era}`].fits;
  const region = fits.includes("city") ? "city" : fits[0];
  for (const twist of [null, ...Object.keys(T.twists).filter((t) => T.packs[`twist:${t}`])]) if (canDeal(T, { region, era, twist })) groups.push({ what: `the mix ${era}${twist ? ` and ${twist}` : ""} at ${region}`, recipe: { region, era, twist } });
}
const BOARDS = 200;
let dealtCount = 0;
let lastNamed = 0;
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
    if (W.checks.map((c) => c.k).join() !== CHECKS.join()) fail(`${seed}: the checks that ran were ${W.checks.map((c) => c.k).join(", ")}`);
    for (const c of W.checks) if (!c.ok) fail(`${seed}: the ${c.k} check still fails`);
    // No bag gives the same row twice till it's run out, and then it says so.
    for (const [bag, step] of Object.entries(BAGS)) {
      const picks = (step === "seat" ? W.seats : W.factions.map((f) => f[step])).filter((p) => p && !p.own);
      const idOf = (p) => (step === "face" ? p.nameId : p.id);
      const fresh = picks.filter((p) => !p.again).map(idOf);
      if (new Set(fresh).size !== fresh.length) fail(`${seed}: the ${bag} bag gave the same row twice before it ran out`);
      if (new Set(picks.map(idOf)).size !== picks.length && !picks.some((p) => p.again)) fail(`${seed}: the ${bag} bag gave a row twice without saying so`);
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
    // Agendas and Secrets aim at the whole board, the last faction dealt too.
    const L = n - 1;
    if (W.factions.some((f, j) => j !== L && (f.agenda?.at?.rival === L || f.agenda?.at?.res?.j === L || f.agenda?.at?.asset?.j === L || f.secret?.at === L))) lastNamed++;
  }
  yes(fallbacks * 20 < BOARDS, `${g.what}: ${fallbacks} of ${BOARDS} boards needed a fallback, and that's 1 in 20 or more`);
  if (firstFail) note(`${g.what}: ${firstFail}`);
  console.log(`2. ${g.what}: ${BOARDS} boards, ${fallbacks} with a fallback`);
}
console.log(`   ${dealtCount} boards dealt twice each in ${((Date.now() - started) / 1000).toFixed(1)}s`);
yes(lastNamed * 4 > dealtCount, `the last faction dealt is aimed at by another's agenda or Secret on only ${lastNamed} of ${dealtCount} boards`);

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
  // On a board nothing's been dealt again on, since dealing another
  // faction's type again changes what's left in the bag.
  const fresh = dealWorld(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 6 });
  const cards = options(T, fresh, `f:${last}:type`, 3);
  same(new Set(cards.map((c) => c.id)).size, cards.length, "a screen's three cards are three different ones");
  if (!fresh.fixes.some((f) => f.path === `f:${last}:type`)) same(cards[0]?.id, fresh.factions[last].type.id, "and the first is what dealing picks");
  same(SIZES, ["small", "local", "city", "great"], "the four sizes");
  // A Face: three different people, the first being what dealing picks, and
  // a new one when it's dealt again.
  const faces = options(T, W, `f:${last}:face`, 3);
  same(new Set(faces.map((c) => c.nameId)).size, faces.length, "a Face's three cards are three different people");
  same(faces[0], W.factions[last].face, "and the first is the Face dealing picked");
  const face = W.factions[last].face;
  redeal(T, W, `f:${last}:face`);
  yes(W.factions[last].face.nameId !== face.nameId, "dealing a Face again gives someone else");
  same(options(T, W, `f:${last}:face`, 3)[0], W.factions[last].face, "and the first of its cards is still the one it's got");
  // A locked step isn't dealt again.
  const want = W.factions[1].want;
  const tries = W.tries["f:1:want"] ?? 0;
  lock(W, "f:1:want");
  redeal(T, W, "f:1:want");
  same([W.factions[1].want, W.tries["f:1:want"] ?? 0], [want, tries], "a locked Want stays when it's dealt again");
  // Picking up from the record.
  const back = resume(T, recordOf(W));
  same(recordOf(back), recordOf(W), "a world picks up from its record just as it was");
  redeal(T, back, "f:4:agenda");
  redeal(T, W, "f:4:agenda");
  same(recordOf(back), recordOf(W), "and deals the same from there");
  // A new seat deals the card on it again, bar what's locked.
  const k = W.factions[0].seat.k;
  const seat = options(T, W, `seat:${k}`, 3).find((c) => c.id !== W.seats[k].id);
  const name = W.factions[0].name;
  lock(W, "f:0:name");
  choose(T, W, `seat:${k}`, seat);
  same([W.factions[0].seat?.k, W.factions[0].type, W.factions[0].name], [k, null, name], "a new seat clears the card on it from its size, bar what's locked");
  same([W.web, W.needs, W.checks], [null, null, null], "and the web, the needs and the checks");
  dealRest(T, W, { finish: false });
  yes(W.factions[0].type != null && W.web === null && W.checks === null, "dealing the rest can stop short of the web and the checks");
  dealRest(T, W);
  yes(W.web != null && W.checks?.length === CHECKS.length, "and finishing deals them");
  // A card whose people can't reach its die comes down to the die they reach.
  const low = dealWorld(T, { recipe: g.recipe, seed: "rook-gate-ash", factions: 5 });
  low.factions[0].size = { size: "great", die: 12 };
  low.factions[0].res = low.factions[0].res.slice(0, 1);
  low.checks = null;
  dealRest(T, low);
  const lf = low.factions[0];
  const steps = 1 + lf.assets.filter((a) => a.power).length;
  yes(lf.size.die === 2 * steps && BOOK.sizes[lf.size.size].lo <= lf.size.die && lf.size.die <= BOOK.sizes[lf.size.size].hi && low.fallbacks.includes("power"), `a great faction with one resource comes down to a d${2 * steps} (got a ${lf.size.size} d${lf.size.die})`);
  // Four to twelve factions, and a genre never deals where its twist can't.
  same([2, 13, "x"].map((n) => start(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: n }).n), [4, 12, 6], "a board's four to twelve factions");
  same([2, 13].map((n) => start(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: n }).s), [6, 14], "and two more seats than factions");
  const twisted = named.find((x) => x.twist);
  if (twisted) {
    const tp = T.packs[`twist:${twisted.twist}`];
    const away = T.packs[`era:${twisted.era}`].fits.find((r) => !tp.fits.includes(r));
    const fake = away ? null : { ...T, packs: { ...T.packs, [`twist:${twisted.twist}`]: { ...tp, fits: tp.fits.slice(1) } } };
    const where = away ?? T.packs[`era:${twisted.era}`].fits.find((r) => !fake.packs[`twist:${twisted.twist}`].fits.includes(r));
    yes(!canDeal(fake ?? T, { region: where, era: twisted.era, twist: twisted.twist }), `${twisted.name} can't be dealt at ${where}, where its twist's pack doesn't go`);
  }
  // An agenda aimed at another faction's resource keeps its card when that
  // faction's resources are dealt again, and aims at one of the new ones,
  // on a dozen boards.
  {
    let cases = 0;
    for (let b = 0; b < 400 && cases < 12; b++) {
      const D = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("aim", b)), factions: 8 });
      const i = D.factions.findIndex((f) => f.agenda?.at?.res);
      if (i < 0) continue;
      cases++;
      const j = D.factions[i].agenda.at.res.j;
      const ids = D.factions.map((f) => f.agenda.id);
      redeal(T, D, `f:${j}:res`);
      D.factions.forEach((f, k) => k !== j && same(f.agenda.id, ids[k], `${D.seed}: dealing faction ${j + 1}'s resources again keeps faction ${k + 1}'s agenda`));
      const at = D.factions[i].agenda?.at?.res;
      yes(at && at.j !== i && D.factions[at.j]?.res?.some((r) => r.id === at.id), `${D.seed}: and the one aimed at them aims at one of theirs now`);
    }
    same(cases, 12, "a dozen boards with an agenda aimed at another faction's resource");
  }
  // After the block check's fix, dealing something else again leaves the
  // needs as they were, on six boards.
  {
    let cases = 0;
    for (let b = 0; b < 800 && cases < 6; b++) {
      const B = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("block", b)), factions: 5 + (b % 8) });
      if (!B.fixes.some((f) => f.k === "block") || !B.checks.every((c) => c.ok)) continue;
      cases++;
      const needs = JSON.stringify(B.needs);
      redeal(T, B, `f:${B.n - 1}:name`);
      same(JSON.stringify(B.needs), needs, `${B.seed}: dealing a name again after the block check's fix leaves the needs as they were`);
    }
    same(cases, 6, "six boards the block check dealt again");
  }
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
  same(apply(big, { o: "wb-set", b: { dealt: { a: Array.from({ length: 60 }, () => Array.from({ length: 60 }, () => "y".repeat(500))) } } }), false, "a record too big for a world is turned down");
  same(big.build, null, "whole, not kept without what was dealt");
  same(apply(blank(), { o: "wb-show", v: true }), false, "showing a history that isn't there changes nothing");
  const W12 = dealWorld(T, { recipe: groups[0].recipe, seed: "tide-iron-rook", factions: 12 });
  const whole12 = blank();
  apply(whole12, { o: "wb-set", b: { recipe: W12.recipe, dials: W12.dials, seed: W12.seed, dealt: recordOf(W12) } });
  same(whole12.build.dealt, recordOf(W12), "a twelve-faction board's record is kept whole");
  const size12 = JSON.stringify({ o: "wb-set", b: whole12.build }).length;
  yes(size12 * 5 < BMAX.dealt * 3, `and it's well inside what a world holds (${size12} of ${BMAX.dealt})`);
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
