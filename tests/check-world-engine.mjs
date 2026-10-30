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
//    people's names or strange Secrets, a type's own Faces that aren't three
//    of the Threat Builder's, and a frame that isn't one of the book's boards
//    or can't deal yet. A row keeps its id when rows are added round it, and
//    the tables themselves have no problems.
// 2. 200 boards in every region for every named genre the packs cover, and
//    200 for every mix at one region: the same seed deals the same board, the
//    checks pass with a fallback in under 1 board in 20, no bag gives the same
//    row twice in a board, every step that needs a because has one, and every
//    card adds up (Power from people who turn up and the die its size picked,
//    every asset paid for bar its needs, nobody holding two of the same
//    people, no two factions with the same asset that does one thing, a
//    rival each, every agenda aimed at something on the board, a Face its
//    kind of faction can be, a seat each and two to spare, and every slot
//    filled). A bag only gives a row twice once it's run out, and says so.
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
// 6. Adding a faction (Add a faction, building alone): to the Steeplands as
//    the book has them, on its mix, and to a world a build dealt, with its
//    seats. The new card's whole and adds up, its rival and its ally or debt
//    are factions already there, a thread each way, its agenda only aims at
//    what's on the board, its name's one the board hasn't got, nothing held
//    ever changes, the same seed deals the same faction, and it picks up from
//    its record. Dealing a faction again deals what isn't locked or hers to a
//    card it hasn't had, a card's words come filled in before it's on, her
//    own Face is her words, her own resource leaves the rest of the card
//    alone, a real roll picks its tension, and a card says where it sits.
// 7. The crew (stage 6): what's worth taking off the party sheet, a friend
//    and a foe for every character across 200 boards (never one faction for
//    both, spread round the board, named for them, a thread toward the crew
//    that standing counts), one faction always after something the crew's
//    got, a foe likelier to be the one that's after them, a character's three
//    cards, Lock and Deal again, her own words, the record, a character
//    leaving or joining (an agenda after the last of them dealt again, or
//    one she's locked still reading their name), a friend or foe whose
//    faction's dealt again dealt again to fit it, and adding a faction tying
//    it to someone who's still got no friend or foe on the board.
// 8. The deck (stage 7): its moments' checks, then 200 decks answered at
//    random in every region for every named genre the packs cover, with
//    prompts filled, written and skipped, Not this one tapped, and a crew
//    or just a party sheet with something worth taking on it: every
//    board passes the checks with a fallback in under 1 deck in 20 and adds
//    up, every faction's formed, how many cards it takes changes with the
//    board and the answers, no card comes twice in a deck, every chain
//    lands, every prompt has three suggestions, nothing's left unfilled in
//    the history, and the same seed and answers deal the same deck and
//    board. Not this one changes nothing but the card, Undo takes an answer
//    back, a prompt that's waiting stays waiting when the answers are played
//    again, Not this one on the last card comes back round to the last cards
//    rather than ending the deck, and the dealing script plays a deck as text.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { apply, blank, forPlayer, readable, standingOf, undoOf } from "../src/companion/board.js";
import { BAGS, CHECKS, STEPS, canDeal, cardsOf, choose, crewFits, dealRest, dealWorld, lock, newSeed, options, pickAt, pickKey, poolOf, preview, recordOf, redeal, redealFaction, resume, rngOf, setCrew, SIZES, start, startAdd, tensionAt } from "../src/companion/world-engine.js";
import { BMAX } from "../src/companion/world-record.js";
import { MAX, PARTS, answer, current, deckOf, fillPrompt, finish, formedOf, historyOf, notThis, playRest, prompted, replay, startDeck, undo } from "../src/companion/world-deck.js";
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
const BOOK = bookFor(bookJson.companion.worlds, worldBook, bookJson.companion.party);
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
  broken("a tie's other side that's too long", (s) => s.core.ties.push({ kind: "rival", text: "{b} took our mill", back: "We took the mill from {b} on a wet night in the spring" }), "a line's twelve words at most: We took");
  broken("a kind of faction with too few Faces", (s) => (s.core.faces.house = ["commander", "champion"]), "faces needs three threats for house", { minimums: true });
  broken("a type's own Face the Threat Builder hasn't got", (s) => (s.twists.glimmer.types[0].faces = ["dragon", "sorcerer", "operator"]), "faces has a threat the Threat Builder hasn't got: dragon");
  broken("a type with too few Faces of its own", (s) => (s.twists.glimmer.types[0].faces = ["sorcerer", "sorcerer", "operator"]), "faces needs three threats, since a Face is dealt as three cards");
  broken("a frame that isn't one of the book's boards", (s) => (s.genres.frames["far-isles"] = { era: "dusk", region: "town" }), "frames.far-isles: isn't one of the book's boards to bring in");
  broken("a frame whose packs aren't in", (s) => (s.genres.frames["deep-company"].region = "country"), "frames.deep-company: can't deal at country till its packs are in");
  broken("a frame with a dial it can't set", (s) => (s.genres.frames["deep-company"].dials = { strange: 3 }), "frames.deep-company: has a dial it can't set: strange 3");
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
  broken("a friend that isn't named for anyone", (s) => s.core.crew.friends.push("Someone was kind to us once"), "needs {who}, the character it's named for");
  broken("a fallback for the crew that aims elsewhere", (s) => (s.core.fallbacks.who = { text: "Take {seat}.", die: 4 }), "fallbacks.who aims only at {who}");
  broken("a crew quality Appendix B hasn't got", (s) => (s.core.crew.qualities = ["lucky"]), "crew.qualities has one that isn't Appendix B's asset: lucky");
  broken("no crew tables", (s) => delete s.core.crew, "crew needs friends, foes and qualities");
  // The deck's moments.
  const moment = (s) => s.core.deck[0];
  broken("a moment with three answers", (s) => moment(s).answers.push({ text: "Wait", does: ["lean a old"], line: "{a} waited." }), "needs two answers, found 3");
  broken("an answer that's too long", (s) => (moment(s).answers[0].text = "Buy all of it today"), "an answer's 1 to 4 words");
  broken("an answer with a slot in it", (s) => (moment(s).answers[0].text = "Pay {b}"), "an answer's its own plain words, with no slot");
  broken("an effect it doesn't know", (s) => moment(s).answers[0].does.push("dance a"), "has an effect it doesn't know: dance a");
  broken("gaining something that isn't a thing", (s) => moment(s).answers[0].does.push("gain gold a"), "gain needs res, asset or people");
  broken("a thread with one side", (s) => moment(s).answers[0].does.push("rival a"), "rival needs two factions on the card");
  broken("a line of history that's too long", (s) => (moment(s).answers[0].line = "{a} bought dry ground off {b}, and owed them for it, and paid and paid for years after."), "a line of history's 16 words at most");
  broken("a chain that lands nowhere", (s) => (moment(s).answers[0].then = "nowhere"), "then lands on a key no moment has: nowhere");
  broken("a chain card nothing lands on", (s) => s.core.deck.push({ text: "{b} came back.", key: "lonely", chain: true, age: 2, answers: [{ text: "Fight", does: ["rival a b"], line: "{a} fought {b}." }, { text: "Talk", does: ["ally a b"], line: "{a} talked to {b}." }] }), "nothing lands on the chain card lonely");
  broken("a chain going back an age", (s) => s.core.deck.find((m) => m.key === "elopement").age = 1, "then lands on elopement, an age before it");
  broken("someone nobody named", (s) => (moment(s).text = "{person} came asking about {b}."), "uses {person}, which nothing before it gives");
  broken("a detail with two ideas", (s) => (moment(s).answers[0].prompt = { kind: "detail", ask: "What was it?", ideas: ["a box", "a key"] }), "a detail's prompt needs three ideas or more");
  broken("a strange moment with nothing strange to deal", (s) => (moment(s).strange = true), "it's strange, so answer 1 needs a Secret naming nobody");
  broken("a two-way thread with one side's words", (s) => Object.assign(moment(s).answers[1], { does: ["lean a war", "rival a b"], thread: "{b} stood in our way" }), "its own words need back too");
  broken("too few moments", (s) => (s.core.deck = s.core.deck.slice(0, 5)), "the deck needs 60 moments or more", { minimums: true });
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

// Every check a dealt board has to pass, and every card adding up: the
// boards dealt whole (part 2) and the ones a deck dealt (part 8) alike.
function checkDealt(W, recipe, seed, n, fail) {
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
    if (f.name.split(/\s+/).length > 4) fail(`${who}: a name's one to four words, its seat and all`);
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
    // A Face is one of the threats its type's own row gives, or its kind's.
    const type = W.factions[i].type;
    const own = type?.id ? poolOf(T, recipe).types.find((r) => r.id === type.id)?.faces : null;
    const kinds = own?.length ? own : T.core.faces[type?.role] ?? [];
    if (kinds.length && !kinds.includes(W.factions[i].face?.threat)) fail(`${who}: its Face is ${W.factions[i].face?.threat}, which isn't one its kind of faction can be`);
    const words = [f.name, f.about, f.want, f.face, f.secret, f.more, ...f.res.map((r) => r.text), ...f.assets.map((a) => a.text), ...f.agendas.map((a) => a.text), ...f.threads.map((t) => t.text)];
    for (const w of words) if (/[{}]/.test(w)) fail(`${who}: a slot nobody filled in "${w}"`);
    for (const t of f.threads) if (t.to !== "crew" && (!Number.isInteger(t.to) || t.to === i || t.to >= C.factions.length)) fail(`${who}: a thread toward nobody`);
  });
  if (C.seats.length !== n + 2 || C.seats.filter((s) => s.held < 0).length !== 2) fail(`${seed}: ${C.seats.length} seats for ${n} factions`);
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
    checkDealt(W, g.recipe, seed, n, fail);
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
  same(forPlayer(doc).build, { history: [{ id: "age-one-1", text: "The river came up and took the low town.", age: 1 }], shown: [1] }, "once she's shown it, a player gets the history");
  const seen = JSON.stringify(forPlayer(doc));
  yes(!seen.includes(W.seed) && !seen.includes("dealt") && !seen.includes(W.factions[0].type.text), "and never the seed or anything dealt");
  // An age at a time (Mo's pick), and a line that made a Secret never leaves her phone.
  run({ o: "wb-show", v: false });
  same([doc.build.shown, forPlayer(doc).build], [[], null], "all of it hidden again");
  run({ o: "wb-line", item: { id: "age-two-1", text: "The millers paid the toll, and never forgave the bridge.", age: 2 } });
  run({ o: "wb-line", item: { id: "age-three-1", text: "The bell-founders paid the bridge every month to keep quiet.", age: 3, hers: true } });
  run({ o: "wb-line", item: { id: "age-three-2", text: "The bridge men swore to get even with Isolde.", age: 3 } });
  same(doc.build.history.map((l) => l.hers === true), [false, false, true, false], "a line can be hers");
  const two = run({ o: "wb-show", age: 2, v: true });
  same(forPlayer(doc).build?.history.map((l) => l.id), ["age-two-1"], "showing the crew one age gives them that age's lines");
  run({ o: "wb-show", age: 3, v: true });
  same(forPlayer(doc).build?.history.map((l) => l.id), ["age-two-1", "age-three-2"], "then the next, bar the line that's hers");
  yes(!JSON.stringify(forPlayer(doc)).includes("keep quiet"), "so the Secret's line never reaches a player");
  same(run({ o: "wb-show", age: 3, v: true }).changed, false, "an age shown twice is no change");
  for (const op of two.back) apply(doc, op);
  same(doc.build.shown, [], "and Undo puts what was shown back exactly");
  run({ o: "wb-show", age: 2, v: true });
  run({ o: "wb-show", age: 2, v: false });
  same(doc.build.shown, [], "an age hidden again");
  same(run({ o: "wb-show", age: 7, v: true }).changed, false, "an age there isn't is turned down");
  for (const lid of ["age-two-1", "age-three-1", "age-three-2"]) run({ o: "wb-drop", lid });
  run({ o: "wb-show", v: true });
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
  same(junk.build, { recipe: { region: "", era: "", twist: null }, dials: { tense: 1, strange: 1, rich: 2, ruled: 1 }, seed: "", dealt: null, history: [{ id: "ok-1", text: "a b", age: 0 }], shown: [], at: 0 }, "junk in a record is tidied");
  apply(junk, { o: "wb-set", b: { history: [{ id: "ok-2", text: "Mine", age: 2, hers: "yes" }], shown: [3, 1, 1, "2", 9, -1, 1.5] } });
  same([junk.build.shown, junk.build.history[0].hers], [[1, 2, 3], undefined], "and so are the ages shown and a line that isn't plainly hers");
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
  console.log("4. the build's record: written whole, a line at a time, shown an age at a time, undone, tidied, and kept from players");
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

// 6. Adding a faction to a board that's there.
{
  const steep = bookJson.companion.worlds.boards.find((b) => b.id === "steeplands");
  const fr = T.frames.steeplands;
  if (steep && fr && real) {
    let n = 0;
    const held = steep.cards.map((c) => ({ name: c.name, about: "", res: c.res.map((r) => ({ id: `r-${n++}x`, text: r.text })), assets: c.assets.map((a) => ({ id: `a-${n++}x`, text: a.text, power: a.power })) }));
    const recipe = { region: fr.region, era: fr.era, twist: fr.twist };
    const dials = { tense: 1, strange: 1, rich: 1, ruled: 1, ...fr.dials };
    let bad = null;
    let ties = 0;
    for (let b = 0; b < 60; b++) {
      const seed = newSeed(T, rngOf("add", b));
      const W = startAdd(T, { recipe, dials, seed, held });
      const was = JSON.stringify(W.factions.slice(0, held.length));
      dealRest(T, W);
      const C = cardsOf(T, W);
      const i = W.held;
      const f = C.factions[i];
      const fail = (what) => {
        bad ??= `${seed}: ${what}`;
      };
      if (JSON.stringify(recordOf(dealRest(T, startAdd(T, { recipe, dials, seed, held })))) !== JSON.stringify(recordOf(W))) fail("the same seed dealt two different factions");
      if (JSON.stringify(W.factions.slice(0, held.length)) !== was) fail("a faction already on the board changed");
      if (!f.name || !f.about || !f.want || !f.face || !f.secret || !f.agendas.length || !f.sits) fail("the new card's missing part of itself");
      if (f.die !== 2 * f.steps) fail(`its d${f.die} isn't 1 step plus its people`);
      if (held.some((h) => h.name.toLowerCase() === f.name.toLowerCase())) fail(`it's got a name the board has already: ${f.name}`);
      if (!W.checks.every((c) => c.ok)) fail(`a check still fails: ${W.checks.filter((c) => !c.ok).map((c) => c.k)}`);
      const rival = (W.web ?? []).find((t) => t.kind === "rival" && t.a === i);
      if (!rival || rival.b >= i) fail("its rival isn't a faction already there");
      for (const t of W.web ?? []) if (t.a !== i || t.b >= i) fail("a tie between two factions that were already there");
      const mine = f.threads.length;
      const theirs = C.factions.slice(0, i).reduce((s, x) => s + x.threads.filter((t) => t.to === i).length, 0);
      if (mine < 1 || theirs < mine - (W.needs ?? []).filter((x) => x.i === i).length) fail(`its ties aren't a thread each way (${mine} and ${theirs})`);
      if (mine > 1) ties++;
      const ag = W.factions[i].agenda;
      if (ag.aims.includes("seat")) fail("its agenda aims at a seat, and the Steeplands haven't got one on the board");
      for (const aim of ag.aims.filter((a) => a !== "seat")) {
        const at = ag.at?.[aim];
        if (aim === "rival" ? !(at < i) : !(at?.j < i)) fail(`its agenda's ${aim} isn't on the board`);
      }
      if (/[{}]/.test([f.name, f.about, f.sits, f.want, f.face, f.secret, f.more, ...f.agendas.map((a) => a.text), ...f.threads.map((t) => t.text)].join(" "))) fail("a slot nobody filled");
    }
    if (bad) note(`adding to the Steeplands: ${bad}`);
    yes(ties > 10, `the new faction gets an ally or a debt as well as its rival on more than 10 of 60 (got ${ties})`);
    // It picks up from its record, and deals the same from there.
    const A = startAdd(T, { recipe, dials, seed: "ash-lantern-ford", held });
    dealRest(T, A);
    const back = resume(T, recordOf(A));
    same(recordOf(back), recordOf(A), "a faction being added picks up from its record");
    redeal(T, A, `f:${A.held}:want`);
    redeal(T, back, `f:${back.held}:want`);
    same(recordOf(back), recordOf(A), "and deals the same from there");
    same(recordOf((redeal(T, A, "f:0:want"), A)), recordOf(back), "and a faction that was there is never dealt");
  }
  // A board with one faction on it: a rival, and nothing more to tie to.
  {
    const one = startAdd(T, { recipe: groups[0].recipe, seed: "pike-reed-sable", held: [{ name: "The Salt Brothers", res: [{ id: "salt-1x", text: "Salt Pans" }], assets: [] }] });
    dealRest(T, one);
    same([one.web.length, one.web[0]?.kind, one.web[0]?.b, one.checks.every((c) => c.ok)], [1, "rival", 0, true], "a board with one faction gives the new one a rival and nothing else, and its checks pass");
  }
  // A world a build dealt, with its seats on the board as places: a new
  // faction sits on a seat nobody holds or a new one, and an agenda at a
  // seat aims at one that's on the board.
  {
    const g = groups[0];
    let bad = null;
    let onFree = 0;
    for (let b = 0; b < 40; b++) {
      const D = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("built", b)), factions: 6 });
      const held = D.factions.map((f) => ({ name: cardsOf(T, D).factions[D.factions.indexOf(f)].name, res: f.res, assets: f.assets, seat: f.seat.k, picks: f }));
      const W = startAdd(T, { recipe: D.recipe, dials: D.dials, seed: D.seed, held, seats: D.seats, asking: D.asking, tension: D.tension });
      dealRest(T, W);
      const i = W.held;
      const f = W.factions[i];
      const fail = (what) => {
        bad ??= `${D.seed}: ${what}`;
      };
      if (W.factions.some((x, j) => j !== i && x.seat?.k === f.seat?.k)) fail("it sits on a seat another faction holds");
      if (f.seat.k < W.hs) onFree++;
      if (f.agenda.aims.includes("seat") && !(f.agenda.at.seat < W.hs && f.agenda.at.seat !== f.seat.k)) fail("its agenda aims at a seat that isn't on the board");
      for (const step of ["type", "method", "want", "secret"]) if (f[step]?.id && D.factions.some((x) => x[step]?.id === f[step].id) && !f[step].again) fail(`its ${step} is one a faction there has, with the bag not run out`);
      if (!W.checks.every((c) => c.ok)) fail(`a check still fails: ${W.checks.filter((c) => !c.ok).map((c) => c.k)}`);
    }
    if (bad) note(`adding to a built world: ${bad}`);
    yes(onFree > 4 && onFree < 36, `a new faction takes a seat nobody holds sometimes, and a new place sometimes (${onFree} of 40 on a free seat)`);
  }
  // Dealing a faction again, bar what's locked or hers.
  {
    const W = dealWorld(T, { recipe: groups[0].recipe, seed: "kettle-moss-yew", factions: 6 });
    const before = recordOf(W).factions[2];
    lock(W, "f:2:want");
    choose(T, W, "f:2:name", { own: true, text: "The Cold Hands" }, { keep: true });
    redealFaction(T, W, 2);
    const f = W.factions[2];
    same([f.want, f.name.text], [before.want, "The Cold Hands"], "dealing a faction again keeps what's locked and what she wrote");
    for (const step of ["type", "method", "agenda", "secret"]) if (pickKey(before[step]) != null) yes(pickKey(f[step]) !== pickKey(before[step]) || W.not[`f:2:${step}`] !== pickKey(before[step]), `and its ${step} is dealt again to a card it hasn't had`);
    yes(STEPS.every((s) => s === "exc" || f[s] != null), "and the card's whole again");
    for (const j of [0, 1, 3]) same(W.factions[j].type, recordOf(dealWorld(T, { recipe: groups[0].recipe, seed: "kettle-moss-yew", factions: 6 })).factions[j].type, `and faction ${j + 1}'s what it is stays as it was`);
    // Her own words stay when a step before them changes.
    choose(T, W, "f:3:method", { own: true, text: "Favours owed" });
    const typeCards = options(T, W, "f:3:type", 3).filter((c) => c.id !== W.factions[3].type.id);
    if (typeCards[0]) {
      choose(T, W, "f:3:type", typeCards[0]);
      same(W.factions[3].method, { own: true, text: "Favours owed" }, "her own way it works stays when what it is changes");
      yes(W.factions[3].want == null, "and the rest of the card that isn't hers is cleared to deal again");
      dealRest(T, W);
    }
    // A card's words, filled in before it's on.
    const agendas = options(T, W, "f:4:agenda", 3);
    for (const c of agendas) {
      const v = preview(T, W, "f:4:agenda", c);
      yes(v.text && !/[{}]/.test(v.text) && v.die === c.die, `an agenda's card has its words filled in (${v.text})`);
    }
    const seat = preview(T, W, "f:1:seat", { k: W.factions[1].seat.k });
    same(seat.name, W.seats[W.factions[1].seat.k].text, "a seat's card has its name");
    // Her own Face is her words, with no threat behind it.
    choose(T, W, "f:3:face", { own: true, text: "Brother Anselm, the zealot" });
    dealRest(T, W);
    const C = cardsOf(T, W);
    same([C.factions[3].face, C.factions[3].threat, C.factions[3].ch], ["Brother Anselm, the zealot", null, null], "her own Face is her words");
    // Her own resource leaves the rest of the card as it is.
    const rest = JSON.stringify(W.factions[5].assets);
    const agenda = JSON.stringify(W.factions[5].agenda);
    choose(T, W, "f:5:res", [...W.factions[5].res, { own: true, text: "Eel Weirs" }], { keep: true });
    same([JSON.stringify(W.factions[5].assets), JSON.stringify(W.factions[5].agenda), W.factions[5].res.at(-1).text], [rest, agenda, "Eel Weirs"], "her own resource on the card leaves its assets and agenda alone");
    same(tensionAt(T, 8)?.text, T.core.tension[7].text, "a real roll of 8 is the tension table's eighth");
    same(tensionAt(T, 13), null, "and there's no 13");
    same(C.factions[0].sits, `It sits on ${C.seats.find((x) => x.k === W.factions[0].seat.k).name.replace(/^The /, "the ")}.`, "a card says where it sits");
  }
  console.log("6. adding a faction to a board that's there, dealing one again, and a card's words before it's on");
}

// 7. The crew.
{
  const g = groups.find((x) => x.recipe.region === "city" && !x.recipe.twist) ?? groups[0];
  const names = ["Vesk", "Bram", "Isolde", "Dorrie", "Ash", "Wren"];
  const whoOf = (n) => names.slice(0, n).map((name, k) => ({ k: `ch-${k}x`, name }));
  const sheet = { res: [{ id: "new-res-1", text: "Odd jobs" }, { id: "res-2x", text: "Salvage rights" }], assets: [{ id: "new-asset-1", text: "Four or five of us and a back room", power: true }, { id: "as-2x", text: "A Ship" }, { id: "as-3x", text: "Rooted" }, { id: "as-4x", text: "Influential" }, { id: "as-5x", text: "Muscle", power: true }] };
  // What's worth taking: not the new crew's card, people or what the crew's like.
  {
    const W = start(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 5, crew: { who: whoOf(2), ...sheet } });
    same(W.crew.things.map((t) => t.text), real ? ["Salvage rights", "A Ship"] : ["Salvage rights", "A Ship", "Influential"], "what's worth taking leaves out the new crew's card, people who turn up and what the crew's like");
    const N = start(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 5, crew: { who: [], res: sheet.res.slice(0, 1), assets: sheet.assets.slice(0, 1) } });
    same(N.crew, null, "a crew with nobody in it and only the new crew's card isn't a crew yet");
    const plain = dealWorld(T, { recipe: g.recipe, seed: "ash-lantern-ford", factions: 5 });
    yes(plain.factions.every((f) => !f.agenda.aims.some((a) => a === "who" || a === "thing")) && plain.checks.find((c) => c.k === "crew")?.ok, "with no crew, nothing's aimed at one and the crew check passes");
    yes(cardsOf(T, plain).factions.every((f) => f.threads.every((t) => t.to !== "crew")), "and nothing's got a thread toward it");
  }
  let bad = null;
  let fallbacks = 0;
  let afterFoe = 0;
  let afterAll = 0;
  let spreadOk = 0;
  let boards = 0;
  let things = 0;
  const NB = 200;
  for (let b = 0; b < NB; b++) {
    const seed = newSeed(T, rngOf("crew", b));
    const chars = 1 + (b % 6);
    const n = 4 + (b % 7);
    const crew = { who: whoOf(chars), ...(b % 3 === 0 ? sheet : { res: [], assets: [] }) };
    const opts = { recipe: g.recipe, seed, factions: n, crew };
    const W = dealWorld(T, opts);
    boards++;
    const fail = (what) => {
      bad ??= `${seed}: ${what}`;
    };
    if (JSON.stringify(recordOf(dealWorld(T, opts))) !== JSON.stringify(recordOf(W))) fail("the same seed and crew dealt two different boards");
    if (W.fallbacks.length) fallbacks++;
    for (const c of W.checks) if (!c.ok) fail(`the ${c.k} check still fails`);
    const C = cardsOf(T, W);
    const wants = W.factions.filter((f) => f.agenda.aims.some((a) => a === "who" || a === "thing"));
    if (!wants.length) fail("no faction wants anything the crew's got");
    if (W.factions.some((f) => f.agenda.aims.includes("thing"))) things++;
    const friendRows = new Set();
    const foeRows = new Set();
    for (const c of W.crew.who) {
      if (!c.friend || !c.foe) fail(`${c.name} hasn't got a friend and a foe`);
      else if (c.friend.j === c.foe.j) fail(`${c.name}'s friend is their foe too`);
      for (const [side, seen] of [["friend", friendRows], ["foe", foeRows]]) {
        const p = c[side];
        if (!p) continue;
        if (seen.has(p.id) && !p.again) fail(`two characters got the same ${side} line before the table ran out`);
        seen.add(p.id);
        const t = C.factions[p.j].threads.find((x) => x.tie === `c:${c.k}:${side}`);
        if (!t || t.to !== "crew" || t.kind !== (side === "foe" ? "hostile" : "bond") || !t.text.includes(c.name) || /[{}]/.test(t.text)) fail(`${c.name}'s ${side} isn't a thread toward the crew named for them: ${JSON.stringify(t)}`);
      }
      const after = W.factions.findIndex((f) => f.agenda.aims.includes("who") && f.agenda.at.who === c.k);
      if (after >= 0) {
        afterAll++;
        if (c.foe?.j === after) afterFoe++;
      }
    }
    // A faction that's everyone's friend only when there's nobody else to be.
    const friends = W.crew.who.map((c) => c.friend?.j);
    if (chars >= 3 && n >= 4 && new Set(friends).size >= 2) spreadOk++;
    else if (chars < 3 || n < 4) spreadOk++;
    // Standing counts them: its whole threads toward the crew.
    C.factions.forEach((f, i) => {
      const bond = W.crew.who.filter((c) => c.friend?.j === i).length;
      const hostile = W.crew.who.filter((c) => c.foe?.j === i).length;
      const want = bond > hostile ? "friendly" : hostile > bond ? "hostile" : "business";
      if (standingOf(f) !== want) fail(`${f.name} reads as ${standingOf(f)} with ${bond} friends and ${hostile} foes in the crew`);
      for (const ag of f.agendas) if (/[{}]/.test(ag.text)) fail(`a slot nobody filled in "${ag.text}"`);
      for (const ag of f.agendas) if (/crew’s (A|An|The) /.test(ag.text)) fail(`"${ag.text}" keeps the thing's A or The`);
    });
  }
  if (bad) note(`the crew: ${bad}`);
  yes(fallbacks * 20 < NB, `the crew: ${fallbacks} of ${NB} boards needed a fallback, and that's 1 in 20 or more`);
  yes(afterFoe * 2 > afterAll, `a faction that's after a character is their foe on more than half (${afterFoe} of ${afterAll})`);
  yes(spreadOk >= NB * 0.95, `three or more characters' friends spread over two factions or more on most boards (${spreadOk} of ${NB})`);
  yes(things > 0, "with something worth taking on the party sheet, a faction's sometimes after it");
  console.log(`7. the crew: ${NB} boards with one to six characters, ${fallbacks} with a fallback, ${afterFoe} of ${afterAll} after a character and their foe`);
  // A character's three cards, Lock, Deal again and her own words.
  {
    const crew = { who: whoOf(3), ...sheet };
    const W = dealWorld(T, { recipe: g.recipe, seed: "kettle-moss-yew", factions: 6, crew });
    const path = `crew:${W.crew.who[0].k}:foe`;
    const cards = options(T, W, path, 3);
    same(cards.length, 3, "a character's foe comes as three cards");
    yes(new Set(cards.map((c) => c.j)).size === 3 && cards.every((c) => c.j !== W.crew.who[0].friend.j), "each a different faction, and never their friend");
    same(pickKey(cards[0]), pickKey(W.crew.who[0].foe), "the first card's the one dealing picked");
    const v = preview(T, W, path, cards[1]);
    yes(v.text.includes("Vesk") && v.name === cardsOf(T, W).factions[cards[1].j].name && v.kind === "hostile", `a card shows the faction and its words named for them (${v.name}: ${v.text})`);
    const web = JSON.stringify([W.web, W.needs, W.checks]);
    choose(T, W, path, cards[1]);
    same([pickKey(pickAt(W, path)), JSON.stringify([W.web, W.needs, W.checks])], [pickKey(cards[1]), web], "picking a foe puts it on and leaves the web and the checks as they were");
    const kept = pickKey(pickAt(W, path));
    lock(W, path);
    redeal(T, W, path);
    same(pickKey(pickAt(W, path)), kept, "a locked foe isn't dealt again");
    lock(W, path, false);
    redeal(T, W, path);
    yes(pickKey(pickAt(W, path)) !== kept, "and Deal again gives a different one");
    choose(T, W, `crew:${W.crew.who[1].k}:friend`, { own: true, j: 2, text: "Bram knows where the bodies are, and he's ours" });
    dealRest(T, W);
    same(cardsOf(T, W).factions[2].threads.find((t) => t.tie === `c:${W.crew.who[1].k}:friend`)?.text, "Bram knows where the bodies are, and he's ours", "her own words for a friend go on as she wrote them");
    const back = resume(T, recordOf(W));
    same(recordOf(back), recordOf(W), "the crew picks up from the record");
    // Someone leaves and someone joins.
    const gone = W.crew.who[0].k;
    const aimed = W.factions.findIndex((f) => f.agenda.at?.who === gone);
    setCrew(T, W, { who: [...whoOf(3).slice(1), { k: "ch-9x", name: "Ash" }], ...sheet });
    yes(!W.crew.who.some((c) => c.k === gone), "a character who's left loses their friend and foe");
    if (aimed >= 0) yes(W.factions[aimed].agenda.at.who !== gone, "and an agenda that was after them is after someone else");
    yes(W.checks == null, "and the checks run again");
    dealRest(T, W);
    const ash = W.crew.who.find((c) => c.k === "ch-9x");
    yes(ash.friend && ash.foe && W.checks.every((c) => c.ok), "someone who joins gets a friend and a foe when the board's finished");
    same(W.crew.who.find((c) => c.k === W.crew.who[0].k).friend != null, true, "and everyone else keeps theirs");
    const ship = W.factions.map((f) => f.agenda).find((a) => a.aims.includes("thing"));
    if (ship) yes(!/crew’s (A|An|The) /.test(cardsOf(T, W).factions[W.factions.findIndex((f) => f.agenda === ship)].agendas[0].text), "a thing on the party sheet reads without its A");
  }
  // A faction that's dealt again, or changed, takes a friend or a foe that
  // doesn't fit it any more with it: it's dealt again to fit.
  {
    let bad = null;
    let redealt = 0;
    for (let b = 0; b < 40; b++) {
      const W = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("crew-fit", b)), factions: 5, crew: { who: whoOf(4), ...sheet } });
      const before = JSON.stringify(W.crew.who.map((c) => [c.friend, c.foe]));
      const i = b % 5;
      if (b % 2) redealFaction(T, W, i);
      else {
        const other = options(T, W, `f:${i}:type`, 3).find((c) => c.id !== W.factions[i].type.id);
        if (other) choose(T, W, `f:${i}:type`, other);
      }
      dealRest(T, W);
      if (JSON.stringify(W.crew.who.map((c) => [c.friend, c.foe])) !== before) redealt++;
      for (const c of W.crew.who) for (const side of ["friend", "foe"]) if (!crewFits(T, W, c.k, side)) bad ??= `${W.seed}: ${c.name}'s ${side} doesn't fit ${cardsOf(T, W).factions[c[side]?.j]?.name} after it changed`;
    }
    if (bad) note(`a faction changing: ${bad}`);
    yes(redealt > 0, "a friend or a foe that doesn't fit its faction any more is dealt again");
  }
  // The last of the crew leaving: an agenda after them is dealt again, and
  // one she's locked still reads their name, with the check saying so.
  {
    let bad = null;
    let tried = 0;
    for (let b = 0; b < 60 && tried < 6; b++) {
      const W = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("crew-gone", b)), factions: 4, crew: { who: whoOf(1), res: [], assets: [] } });
      const i = W.factions.findIndex((f) => f.agenda.aims.includes("who"));
      if (i < 0) continue;
      tried++;
      const locked = b % 2 === 0;
      if (locked) lock(W, `f:${i}:agenda`);
      setCrew(T, W, { who: [], res: [], assets: [] });
      dealRest(T, W, { finish: false });
      const text = cardsOf(T, W).factions[i].agendas[0]?.text ?? "";
      if (/[{}]/.test(text)) bad ??= `${W.seed}: "${text}" has a slot nobody filled`;
      if (locked && !text.includes("Vesk")) bad ??= `${W.seed}: the locked agenda "${text}" lost Vesk's name`;
      if (!locked && W.factions[i].agenda.aims.includes("who")) bad ??= `${W.seed}: an agenda's still after the crew with nobody in it`;
      dealRest(T, W);
      if (locked && W.checks.find((c) => c.k === "aims")?.ok) bad ??= `${W.seed}: the checks don't say the locked agenda's aimed at nobody`;
    }
    if (bad) note(`the last of the crew leaving: ${bad}`);
    yes(tried >= 4, `boards with an agenda after the one character to try it on (${tried})`);
  }
  // Adding a faction ties it to someone who hasn't got a friend or a foe yet.
  {
    let bad = null;
    let lacking = 0;
    for (let b = 0; b < 40; b++) {
      const D = dealWorld(T, { recipe: g.recipe, seed: newSeed(T, rngOf("crew-add", b)), factions: 5 });
      const held = D.factions.map((f, i) => ({ name: cardsOf(T, D).factions[i].name, res: f.res, assets: f.assets, seat: f.seat.k, picks: f }));
      const who = [{ k: "ch-0x", name: "Vesk", has: { friend: true, foe: true } }, { k: "ch-1x", name: "Bram", has: { friend: true, foe: false } }];
      const W = startAdd(T, { recipe: D.recipe, dials: D.dials, seed: D.seed, held, seats: D.seats, asking: D.asking, tension: D.tension, crew: { who, res: [], assets: [] } });
      dealRest(T, W);
      const i = W.held;
      const toCrew = cardsOf(T, W).factions[i].threads.filter((t) => t.to === "crew");
      const fail = (what) => {
        bad ??= `${D.seed}: ${what}`;
      };
      if (toCrew.length !== 1) fail(`the new faction has ${toCrew.length} threads toward the crew`);
      if (cardsOf(T, W).factions.slice(0, i).some((f) => f.threads.some((t) => t.to === "crew"))) fail("a faction that was there got a thread toward the crew");
      const ag = W.factions[i].agenda;
      if (toCrew[0]?.who === "ch-1x" && toCrew[0]?.side === "foe") lacking++;
      else if (!(ag.aims.includes("who") && ag.at.who === toCrew[0]?.who)) fail(`it's tied to ${toCrew[0]?.who} as a ${toCrew[0]?.side}, with Bram still lacking a foe`);
      if (!W.checks.every((c) => c.ok)) fail(`a check still fails: ${W.checks.filter((c) => !c.ok).map((c) => c.k)}`);
    }
    if (bad) note(`adding a faction with a crew: ${bad}`);
    yes(lacking > 20, `adding a faction, it's mostly the foe of the one who hasn't got one (${lacking} of 40)`);
  }
  console.log("7. a character's cards, Lock, Deal again, her own words, the record, someone leaving and joining, and adding a faction tied to the crew");
}

// 8. The deck (stage 7).
{
  const DECKS = 200;
  const started = Date.now();
  const CREW = ["Vesk", "Bram", "Isolde", "Dorrie", "Ash", "Wren"];
  const ALL = Object.values(PARTS).flat();
  const decks = groups.filter((g) => !g.what.startsWith("the mix "));
  const lens = new Map();
  let played = 0;
  let replayed = 0;
  let prompts = 0;
  for (const g of decks) {
    let fallbacks = 0;
    let firstFail = null;
    const fail = (what) => {
      firstFail ??= what;
    };
    const M = deckOf(T, g.recipe);
    for (let b = 0; b < DECKS; b++) {
      const seed = newSeed(T, rngOf("deck-check", g.what, b));
      const n = 4 + (b % 9);
      const dials = b % 10 === 0 ? { tense: 0, strange: 0, rich: 0, ruled: 0 } : b % 10 === 5 ? { tense: 2, strange: 2, rich: 2, ruled: 2 } : null;
      // A crew of one to six every third deck, and every sixth a party sheet
      // with something worth taking and nobody in the crew yet.
      const crew = b % 3 === 1 ? { who: CREW.slice(0, 1 + (b % 6)).map((name) => ({ k: name.toLowerCase(), name })), res: [], assets: b % 2 ? [{ id: "ship", text: "A Ship" }] : [] } : b % 6 === 2 ? { who: [], res: [], assets: [{ id: "ship", text: "A Ship" }] } : null;
      const W = start(T, { recipe: g.recipe, seed, factions: n, dials, crew });
      startDeck(T, W);
      const play = rngOf("deck-play", g.what, b);
      for (let guard = 0; guard < 400; guard++) {
        const o = prompted(W);
        if (o) {
          prompts++;
          if (o.ideas.length !== 3 || o.ideas.some((x) => !x.text || /[{}]/.test(x.text))) fail(`${seed}: a prompt (${o.ask}) has ${o.ideas.length} suggestions`);
          const x = play();
          fillPrompt(T, W, x < 0.5 ? { pick: Math.floor(play() * 3) % 3 } : x < 0.6 ? { text: "Her own words" } : { skip: true });
          continue;
        }
        const c = current(T, W);
        if (!c) break;
        if (/[{}]/.test(c.text) || /[{}]/.test(c.speaker)) fail(`${seed}: a slot nobody filled on a card: "${c.text}"`);
        if (!c.chain && play() < 0.08) {
          notThis(T, W);
          continue;
        }
        answer(T, W, play() < 0.5 ? 0 : 1);
      }
      finish(T, W);
      played++;
      if (W.fallbacks.length) fallbacks++;
      checkDealt(W, g.recipe, seed, n, fail);
      const D = W.deck;
      for (const f of formedOf(T, W).factions) {
        const left = ALL.filter((p) => f.parts[p] == null);
        if (left.length) fail(`${seed}: ${f.name} isn't formed (${left.join(", ")})`);
      }
      const ids = D.cards.map((c) => c.m);
      if (new Set(ids).size !== ids.length) fail(`${seed}: a card came twice in one deck`);
      if (D.pos > 70) fail(`${seed}: the deck ran to ${D.pos} cards`);
      if (D.chains.length) fail(`${seed}: ${D.chains.length} chains never landed`);
      D.cards.forEach((c, k) => {
        const then = M.byId.get(c.m)?.answers[c.side].then;
        if (then && !D.cards.slice(k + 1).some((x) => x.chain === k && x.m === M.byKey.get(then)?.id)) fail(`${seed}: the chain card ${k + 1} started never landed`);
      });
      for (const h of historyOf(T, W)) if (/[{}]/.test(h.text)) fail(`${seed}: a slot nobody filled in "${h.text}"`);
      if (!lens.has(n)) lens.set(n, []);
      lens.get(n).push(D.pos);
      // The same seed and answers deal the same deck and the same board.
      if (b % 5 === 2) {
        replayed++;
        if (JSON.stringify(recordOf(finish(T, replay(T, D.base, D.log)))) !== JSON.stringify(recordOf(W))) fail(`${seed}: the same answers dealt a different deck or board`);
      }
    }
    yes(fallbacks * 20 < DECKS, `${g.what}: ${fallbacks} of ${DECKS} decks needed a fallback, and that's 1 in 20 or more`);
    if (firstFail) note(`${g.what}, a deck: ${firstFail}`);
    console.log(`8. ${g.what}: ${DECKS} decks, ${fallbacks} with a fallback`);
  }
  const mean = (n) => lens.get(n).reduce((x, y) => x + y, 0) / lens.get(n).length;
  yes(mean(12) > mean(4) * 1.5, `a deck takes ${mean(4).toFixed(1)} cards on four factions and ${mean(12).toFixed(1)} on twelve`);
  for (const [n, list] of lens) yes(new Set(list).size > 1, `every deck on ${n} factions took ${list[0]} cards, whatever the answers`);
  yes(prompts > 0, "no deck asked for a name or a detail");
  // Not this one deals another card and changes nothing else, and Undo takes
  // the last answer back, the card it answered up again.
  {
    const W = start(T, { recipe: decks[0].recipe, seed: "ash-lantern-ford", factions: 6 });
    startDeck(T, W);
    for (let k = 0; k < 6; k++) {
      answer(T, W, k % 2);
      if (prompted(W)) fillPrompt(T, W, { skip: true });
    }
    const was = current(T, W);
    const keep = (x) => JSON.stringify({ cards: x.deck.cards, parts: x.deck.parts, factions: x.factions, made: x.made });
    const before = keep(W);
    notThis(T, W);
    const now = current(T, W);
    yes(now && now.m !== was.m, "Not this one dealt the same card again");
    same(keep(W), before, "Not this one changed something besides the card");
    const mid = JSON.stringify(recordOf(W));
    answer(T, W, 1);
    if (prompted(W)) fillPrompt(T, W, { pick: 0 });
    const back = undo(T, W);
    current(T, back);
    same(JSON.stringify(recordOf(back)), mid, "Undo took the last answer back to just as it was");
  }
  // A prompt that's still waiting when the answers are played again (a link
  // to /deal/ with one up) stays up, and Not this one on the last card, past
  // every last card there is, comes back round to them rather than ending
  // the deck without one.
  {
    let open = 0;
    let lasts = 0;
    for (let s = 0; s < 40; s++) {
      const W = start(T, { recipe: decks[s % decks.length].recipe, seed: `deck-open-${s}`, factions: 4 + (s % 9) });
      startDeck(T, W);
      const rand = rngOf(W.seed, "check-open");
      for (let g = 0; g < 2 * MAX && !prompted(W) && current(T, W); g++) answer(T, W, rand() < 0.5 ? 0 : 1);
      if (prompted(W)) {
        open++;
        same(JSON.stringify(prompted(replay(T, W.deck.base, W.deck.log))), JSON.stringify(prompted(W)), `${W.seed}: a prompt that was waiting wasn't when its answers were played again`);
      }
      playRest(T, W, rand, { finishing: false });
      const U = undo(T, W);
      if (!current(T, U)?.last) continue;
      lasts++;
      for (let x = 0; x < 8; x++) notThis(T, U);
      yes(current(T, U)?.last, `${W.seed}: Not this one on the last card ended the deck without one`);
    }
    yes(open > 0 && lasts > 0, `no deck had a prompt waiting (${open}) or a last card to pass over (${lasts})`);
  }
  // A deck kept on her phone and picked up again after a reload (recordOf()
  // and resume(), the way zi-make keeps it) plays on just the same.
  {
    let picked = 0;
    for (let s = 0; s < 40; s++) {
      const W = start(T, { recipe: decks[s % decks.length].recipe, seed: `deck-kept-${s}`, factions: 4 + (s % 9), crew: s % 3 ? { who: [{ k: "wren-kept01", name: "Wren" }], things: [] } : null });
      startDeck(T, W);
      const half = rngOf(W.seed, "check-kept");
      for (let g = 0; g < 4 + (s % 12); g++) {
        if (prompted(W)) {
          fillPrompt(T, W, { skip: true });
          continue;
        }
        if (!current(T, W)) break;
        answer(T, W, half() < 0.5 ? 0 : 1);
      }
      try {
        const K = resume(T, JSON.parse(JSON.stringify(recordOf(W))));
        playRest(T, W, rngOf(W.seed, "check-kept-rest"));
        playRest(T, K, rngOf(W.seed, "check-kept-rest"));
        picked++;
        same(JSON.stringify(recordOf(K)), JSON.stringify(recordOf(W)), `${W.seed}: a deck picked up again after a reload played on differently`);
      } catch (err) {
        note(`${W.seed}: a deck picked up again after a reload broke: ${err.message}`);
      }
    }
    same(picked, 40, "every deck picked up again played to its end");
  }
  // The dealing script plays a deck as text, the same for the same seed.
  {
    const run = () => execFileSync("node", ["scripts/deal-world.mjs", "--deck", "--region", "town", "--genre", "medieval", "--factions", "5", "--seed", "ash-lantern-ford"], { encoding: "utf8" });
    const one = run();
    yes(one.includes("How it came to be") && one.includes("ash-lantern-ford"), "npm run deal -- --deck doesn't play a deck");
    same(run(), one, "the dealing script played the same seed two ways");
  }
  console.log(`8. the deck: ${played} decks answered at random, ${replayed} played again, Not this one, Undo, decks picked up again after a reload and the dealing script, in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

console.log(problems.length ? `\n${problems.length} problems` : "\nAll world engine checks passed");
process.exitCode = problems.length ? 1 : 0;
