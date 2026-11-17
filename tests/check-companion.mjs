// Check the character companion the way a player uses it at the table.
//
//   npm run build && node tests/check-companion.mjs [screenshot-folder]
//   ZI_ONLY=3,4 node tests/check-companion.mjs runs only those parts.
//
// 1. Steps into dice match the table in The Core, splits included.
// 1b. The live table's rules, as the server and every phone apply them: one
//    action a round (an answer, a friend's answer or something else, and an
//    extra one only with where it came from), intercepts for blows only and
//    never your own, a combo's steps in one answer, a stake's die rolled once
//    a round, and at the end of a round the clocks and events nobody worked
//    stepping down, a late roll from the round stepping one back, the scene
//    clock running out and a stake lost and one won. Then telegraphs at the
//    scene: one at a stake and one at the scene clock with no defence, landing
//    then and there on a lost answer or at the round's end, a late win taking
//    it back, and one at a place landing on whoever's in it. Then on Roots: a
//    telegraph at each of Isolde's Roots, nobody intercepting what's at her
//    Mind or her Soul, and When it lands saying the track or Defend that
//    rolled, on the table screen too. Then on stacking (14 Nov): extra
//    actions with no cap, each bought with Aura costing 3, then 4, then 5,
//    one priced too low turned down, holding and hiding on top without
//    putting the price up, an answer and a roll at the scene saying their
//    Root and steps and never a specialty, a friend putting in their steps
//    and the Aura they paid to explain them, and an older table's records
//    reading as they were, on the table screen too.
// 1c. The founding's rules: the room opened by the GM alone and one at a
//    time, joining, taking someone out so they can't put themselves back,
//    the order, the setup fixed once it starts, then the asking a turn each
//    round the table (a card, someone's own words tidied, the tension off a
//    real d12 and never typed, an answer taken back, one put in by the GM
//    for a player with no phone, late ones refused), the dials, the clock
//    stopping when it's done, what a player gets, carrying it off, someone
//    leaving, someone taken out never getting their turn back by taking an
//    answer back, someone who leaves the campaign leaving the founding, and
//    the clock running out: the turn that's on finishes, more time sends the
//    turns round again, and the rest's dealt by the GM alone.
// 1d. The dice roller's rules, off the book's own examples: Vesk's one
//    Defend roll against two blows and Bram Defending against three, matched
//    so the most are stopped, a swap, and a matching that can't stand put
//    right. Bram and Wren's three dice on the guard captain against his one
//    roll, a Layered vault door's best die standing, Ash's area with each man
//    defending on his own, dice on one side added up. Then several actions in
//    one throw: the study door's four dice at three things, Mo's own (a d12
//    and a d8 at the brute, a d6 at the archer and a d8 coming at him), each
//    read just as it would be on its own and the Aura added up across them, a
//    swap in one leaving the rest alone, Bram's four dice for three blows, an
//    area die paying once, a tie paying nothing, and what's kept on the phone
//    between rolls, a set-up from before there were actions coming back as one.
// 1e. The crew and the character on the new core and the 17 Nov fixes, with
//    no browser: every crew member's Roots, Titles spread 5, abilities, items
//    (the attuned thing among them), keepsake and 3 Resources, 35 points at
//    Mo's prices with items at tier 2 and a point a tier up, their rolls with
//    one item a roll (a guard only avoiding harm, armour and a vessel never,
//    a broken one never), hits soaked by armour first (2 for 1 and a deadly
//    threat's hits included) and soak back every scene, wounds, Scars,
//    healing and Toll, Resources said and back in downtime, a pack's, Ash's
//    coal horn filled with Aura she'd lose and a point mid-scene and spent on
//    her awakening, saves from before coming across (v3 and v4, a Boon gone
//    with its points, utility items in the notes, crossed items by their key),
//    and the build stopping on a crew sheet that doesn't add up.
// 1f. Print, with no browser: the blank sheet holds exactly the fields
//    src/companion/sheet-fields.js lists, and every crew member printed reads
//    back field by field (each Root and where its points came from, adding up
//    to it, each Title's words, spread and permissions with their Roots, the
//    archetypes, the attuned thing, every item with its kind and tier, 3
//    Resources, the keepsake, Aura's 5 and 35 points), the same from the GM's
//    look with no book to hand. Vesk part way through a scene (a Scar,
//    Burning, a strained thread, a point of her leathers' soak used, a smoke
//    bomb said and her Shadow's pool), Ash's coal horn holding 2, Bram's old
//    Boon printing nothing, and Rook, made up with more of everything than the
//    paper holds. Nothing print writes is missing from the sheet, every field
//    bar the ones only a pencil fills gets something from one of them, and
//    what doesn't fit goes in Notes.
// 2. Every crew member's Roots on the phone match their sheet in the
//    chapter, on the new core: each Root's tile with its steps, the dice it
//    rolls and the points it's got, each Root's tracker its points out of what
//    it holds, full Aura, a plate for every point of soak their armour's got
//    on each Root, all their Resources, and each vessel's charge, empty.
// 3. Vesk at the table, on the new core: her Body in one tap at full, one
//    item a roll (her Proven set of picks 3 more on a lock, her leathers
//    never offered), her grappling line's awakening putting her line on with
//    it, Aura on it, her Mind brought in on a
//    permission and paid with a point or 3 Aura, a split, a roll that pays
//    Aura and a point, Again with her line, a reload and no signal, a tie, two guards at
//    once, her Shadow's Push paid in Aura, her shadow pool, and no Roll again
//    with no Soul to pay it.
// 3c. Bram when it lands, the book's own Defend: three d8s at Wren's Body
//    intercepted onto his, his Body for the landing with his Trusty shield
//    on it, a guard once a landing, and his Body again for the Defend, all
//    three stopped. Then blows on his Body alone, his armour soaking first:
//    his plate soaking one, 2 for 1 on his Soul, a deadly telegraph's three
//    hits all at once, soak gone and a point off his Body, soak back at New
//    scene, and Stand firm soaked.
// 3d. Built characters at the table: Bram from the crew saved as his own, a
//    random character, a Toughness Boon gone and said once with the points
//    it gave back, a Gambler's flips paid in Aura, and a Healer's heal with
//    Toll.
// 4. Points, wounds, Scars and rest: Vesk spending and getting a point back,
//    her Body hit to 0 and Bloodied, a Scar written as what it stops her doing, locking a
//    point, out of the scene, the rest at the end of it, 2 for 1, heals with
//    Toll and taking a breath, her leathers soaking first. Dorrie's court
//    clothes soaking a lie on her Mind, Isolde's Body Bloodied by the first
//    hit, her Blaze and her choosing to die, and Ash's Resources said and
//    ticked and her coal horn filled with a point, paying her awakening's
//    Aura, taking what's over as she finishes acting and what's left at New
//    scene, and keeping it through downtime while her Resources come back.
// 4b. Saved before the new core: Vesk saved on stacking keeps her play with
//    every Root full and her Scar on her Body, Old Vesk from before Roots
//    comes all the way across, one built on stacking has each Title's 3 made
//    5, and Tamsin from before Roots shows as she was.
// 5. Building your own: Vesk again on 35 points, a step to a screen, with
//    what's spent and what's left in the bar the whole way. Two Shadows with
//    an ability each, her Titles' 5 Root points spread in a tap or two, a
//    Root on each permission, her Roots added up with where each comes from,
//    her grappling line with its one awakening and nothing to write for its
//    Aura, one of her six items, then her items a point each at tier 2, two
//    of them Proven for a point more, armour on its Root, a knife typed in a
//    weapon, Resources in a bubble, and threads from the crew questions.
//    Saved, her sheet is the chapter's. Then a reload, offline, a change (no
//    Boons, a fourth permission, her leathers Storied and a Proven shield)
//    past 35, a blank character with the nudges and a start of 36, a draft
//    waiting on the list, and every step at 320 wide in both themes with axe.
// 5b. The builder in one hand: full screen with the crest at the top, the
//    seven steps in one line, the points and Back and Next in the bar at the
//    bottom on every step, the step's tip and the menus away on Escape or a
//    tap outside, a Root's die growing in the dock as a Title's spread and a
//    permission go on, ten abilities on an archetype's card with what each
//    does behind its ?, a Title idea, a shield off a card a guard, its point
//    in the points, and axe on every step, dark and light.
// 5c. The other ways in. Every crew member made into a build spends 35 and
//    has the sheet the chapter gives them, and a thousand random characters
//    spend exactly 35 and pass every check. A build from before stacking
//    keeps everything, past 35 too: each Title all on its old Root to spread,
//    its specialties gone and its archetypes' abilities dealt between them.
//    Bram from the crew and a random one saved, a way in asking before it
//    bins a draft, Vesk from the crew becoming your own with her play kept,
//    Vesk saved before stacking spreading her Titles and saved with her Roots
//    the chapter's and her utility items in her notes, Bram built before the
//    fixes with his equipment as items, his Boon's points back and his bag
//    in his notes, and Tamsin from before Roots rebuilt.
// 6. Print on the phone, from the Sheet tab's button (saved characters put on
//    the phone as they'd be part way through a scene, since the play screen's
//    being redrawn): Vesk with a Scar, Burning, Aura spent and her hook
//    powered, a strained thread and her smoke bomb used, read back field by
//    field off the stacking sheet with her items, then Bram's plate (its box
//    from before soak gone), helmet and shield, and Dorrie's court clothes on
//    her Mind.
// 7. Dice, feel and learning. The learning round on the new core: Wren's
//    Body, her Proven longbow and *Long shot* for her arrow, and Bram's Body
//    and his Trusty shield to get it under the club, 24 steps. Three ways:
//    the club beaten with Aura past her maximum, a tie won for 1 Aura that
//    pays nothing back, and real dice that lose, so Isolde's Bloodied. Then
//    offline, and 320 wide in both themes with axe. With motion on, the dice
//    tumble and land on their numbers, the roll card turns over, the tabs
//    slide and Aura pops back in. Sound and buzz stay off until the switch
//    turns them on, and then a landing, a top face and a hit each get one.
// 7b. A character in one hand: full screen with the crest at the top, the
//    first Root high up, the Roots as the dice they roll, no sideways scroll,
//    44px tap targets and every name fitting its tile, her lock built under
//    two screens, her 12 front and centre with its top face lit, When it lands
//    with a Root and Defend, and the Sheet tab under two screens with its folds shut and
//    where each Root came from, with axe on all of it in both themes. A hit
//    with reduce-motion on swaps the track's shape, and nothing moves.
// 7c. The dice roller, off Vesk's play screen and the Characters list, its
//    actions called targets now, and hits for a target coming at you. Bram
//    Defending against three d8s with fixed dice, the most stopped, a swap,
//    the same dice read the other way, the Aura from every win and top face,
//    and Vesk's sheet left as it was. What it's for behind a question bubble
//    that Esc puts away without the roller. The set-up kept through a reload,
//    dice on one side added up, one die tied, Ash's area with each man on his
//    own and as one thing, real dice tapped in, Esc, and the list's way in
//    offline. Then several actions: Mo's d12 and d8 at the brute, his d6 at
//    the archer and a d8 coming at him, added a tap at a time with the one
//    before folded into a line, thrown together, each read on its own with
//    the Aura added up, one read the other way, real dice tapped in for all
//    three, kept through a reload, and taken off again down to one, which is
//    the roller as it was. Then 320 wide in both themes: a set-up from before
//    there were actions coming back as one, nothing sideways, every button
//    44px, and axe on the set-up and a result, with one action and with two.
//    With motion on the dice tumble, two actions' worth too, and a tap lands
//    them.
// 8. Downtime on the new core. Isolde's weeks with no browser: everything
//    back, a point in her Aspiration, a Scar grown into a Trait over three
//    slots and a Title from her Aspiration's fifth point. Bram's on the
//    fixes: his soak and Resources back, his broken shield mended, his helmet
//    a tier up and no Boons, and Vesk's crowbar and a buckler that's her
//    seventh, so her knife goes, and a material in her notes. Then Vesk's on the
//    phone: everything back and a new permission with its Root, undone and
//    done again, then a point in her Aspiration, a new awakening with its
//    Root and its Catch, and a reload. 8b (the play
//    screen's): a made-up rule change against her saved sheet: a reworded
//    permission, her Stride and a permission moved get gold marks with old
//    and new, typo fixes stay quiet, what she grew isn't marked, and Got it
//    clears them for good.
// 9. Every crew member's growth adds up on stacking (a permission with its
//    Root, a thread, a Title with its 3 spread and its one permission, an
//    archetype with its one ability, an attuned thing with its awakening and
//    an awakening), a Title stops at six permissions, a Boon swapped in
//    before the fixes is gone with its permissions kept, and what downtime
//    grew folds into a build as the same sheet. On the phone, Vesk's
//    Aspiration's fifth point gives her a third Title spread Soul 3 and Mind 2,
//    and Gil buys an ability a slot, never the same one twice.
// 10. The rules on a phone. The Learn deck (content/learn.md) has 30 to 40
//    cards of 40 to 120 words in book order, each teaching a section the book
//    has, most with an example using the crew's real dice, and an example
//    whose roll says its steps and dice has them adding up. A
//    made-up rules change names the card it touches, and the deck's been
//    checked against the newest real one. At 390 by 844: the deck tapped,
//    swiped and keyed through with its progress bar, a reload back on the same
//    card, a bookmark kept, Read more with the whole section and Back to the
//    card, a link on a card popping up its opening, with that Read more
//    staying in the deck, and the list of every card. A chapter: it opens on
//    its contents, a row opens a section on its own with the bar saying where
//    you are, Next, a swipe each way, a short drag springing back and the
//    arrow keys, Contents, Back and Forward, an address with a subsection in
//    it, bookmarks from the bar and a subsection, what's read and where you're
//    up to on the contents, pop-ups from a link to another chapter and one in
//    the same chapter, Back inside a pop-up, Esc and a drag putting a sheet
//    away, the first section's Before and the last's Next, and Carry on
//    reading on the chapter and the rules page. A section opened by its
//    address (Twenty Places' cards, a place's tabs and a tag saying what it
//    does went with the world part on 14 Nov). Then the deck, its pop-ups and
//    Read more offline, nothing moving under reduce-motion and a section and
//    a sheet sliding in with motion on, 44px tap targets, and axe in both
//    themes on the deck, a section, its contents, a pop-up and the crew's
//    sheets.
import { createServer } from "node:http";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField } from "pdf-lib";
import { diceLabel, diceRange, diceShapes, fillDice, isSplit, stepsToDice } from "../src/companion/dice.js";
import { ROOTS, rootsSheet } from "../src/companion/roots.js";
import * as RS from "../src/companion/roots.js";
import { costOf } from "../src/companion/points.js";
import { checksOf, foldGrown, normalBuild, pointsOf, sheetOf } from "../src/companion/builder.js";
import { fromCrew, randomBuild } from "../src/companion/ways.js";
import { CARD_WORDS, CREW, DECK_SIZE, newestChange, reachOf, readCards, staleCards } from "../scripts/learn.mjs";
import * as T from "../src/companion/table-rules.js";
import * as B from "../src/companion/board.js";
import * as RV from "../src/companion/reveal-rules.js";
import * as TR from "../src/companion/turn-rules.js";
import { dialsOf, foundNews, shapeOf, timeUp } from "../src/companion/found-rules.js";
import { ACTIONS, MOST, bestMatch, readDice, readLanes, setupOf, swapped } from "../src/companion/roller-rules.js";
import { parse as parseYaml } from "yaml";

const SHOTS = process.argv[2] || null;
// ZI_ONLY=3,4 runs only those parts, for a quick check while working on them.
// Before anything goes to main, the whole file runs.
const ONLY = process.env.ZI_ONLY ? new Set(process.env.ZI_ONLY.split(",").map((x) => x.trim())) : null;
const part = (n) => !ONLY || ONLY.has(n);
const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
const BUILD = book.companion.build;
const problems = [];
const note = (p) => {
  problems.push(p);
  console.log(`  ✗ ${p}`);
};
const same = (got, want, what) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) note(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`);
};
const has = (text, want, what) => {
  if (!String(text ?? "").includes(want)) note(`${what}: wanted "${want}" in "${String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 200)}"`);
};

// 1. Steps into dice, against the table in The Core.
const core = readFileSync("content/rules/02-the-core.md", "utf8");
const table = core.split(/^### Steps into dice.*$/m)[1]?.split(/^#{2,3} /m)[0] ?? "";
let rows = 0;
for (const m of table.matchAll(/^\| (\d+) \| (\d*d[^|]+?) \|$/gm)) {
  rows += 1;
  same(diceLabel(stepsToDice(Number(m[1]))), m[2].trim(), `${m[1]} steps from the table`);
}
if (rows < 14) note(`only found ${rows} rows in the steps table`);
same(diceLabel(stepsToDice(1)), "d2", "1 step");
same(diceLabel(stepsToDice(7)), "d12 + d2", "7 steps");
same(diceLabel(stepsToDice(12)), "2d12", "12 steps");
same(diceLabel(stepsToDice(18)), "3d12", "18 steps");
same(diceRange(4, 1), { fewest: 1, most: 2 }, "4 steps on one action");
same(diceShapes(4, 2).map(diceLabel), ["2d4", "d6 + d2"], "a d8 split once");
if (!diceShapes(8, 3).map(diceLabel).includes("2d6 + d4")) note("8 steps on one action can't make a d6, a d6 and a d4");
if (!diceShapes(9, 3).map(diceLabel).includes("d8 + d6 + d4")) note("9 steps from two actions can't make a d8, a d6 and a d4");
same(diceShapes(8, 2)[0], [12, 4], "8 steps on two dice starts from the table's d12 and d4");
same(diceRange(1, 3), { fewest: 1, most: 1 }, "a d2 can't split");
console.log(`dice: ${rows} rows of the table checked`);

// 1b. The live table's rules (table-rules.js), the ones the server and every
// phone apply: one action a round with every die an intent, intercepts,
// combos, hits, wounds and Scars on the new core, and the scene's
// stakes, clocks and events stepping down at the end of a round nobody
// worked them, the way The Round and Stakes, Clocks and Events have it.
if (part("1b")) {
  const roster = [{ user: "kai", name: "Kai", ch: "vesk", cname: "Vesk" }, { user: "sam", name: "Sam", ch: "bram", cname: "Bram" }, { user: "lee", name: "Lee", ch: "isolde", cname: "Isolde" }];
  const gm = { user: "mo", role: "gm", ch: null, cname: "" };
  const kai = { user: "kai", role: "player", ch: "vesk", cname: "Vesk" };
  const sam = { user: "sam", role: "player", ch: "bram", cname: "Bram" };
  const lee = { user: "lee", role: "player", ch: "isolde", cname: "Isolde" };
  const doc = T.blank();
  let now = 1000;
  const ap = (op, who, extra = {}) => T.apply(doc, op, who, roster, now, extra);
  const ok = (op, who, what, extra) => same(ap(op, who, extra), { ok: true }, what);
  const not = (op, who, what, extra) => same(ap(op, who, extra).ok, false, what);
  const r1 = () => doc.rounds[0];
  // The Copper Baths, cut down: the satchel with a clock on it, the other buyer as the scene clock, and the Hot Pool.
  ok({ o: "put", el: { id: "stake-satchel", t: "stake", name: "Dace’s satchel", c: 3, tags: ["Locked", "Guarded"], clock: 6 } }, gm, "a stake with a clock on it");
  ok({ o: "put", el: { id: "event-buyer", t: "event", name: "The other buyer", what: "Dace signs with them", d: 4, scene: true } }, gm, "a scene clock");
  ok({ o: "put", el: { id: "ground-pool", t: "ground", name: "The Hot Pool", text: "shove someone in" } }, gm, "the ground");
  not({ o: "put", el: { id: "stake-satchel", t: "stake", name: "Mine now", c: 3 } }, kai, "a player can't change the scene");
  ok({ o: "round", id: "round-one-01", tele: [{ id: "tele-club-01", who: "The brute", does: "Club Isolde", d: 8, kind: "blow", at: { user: "lee", ch: "isolde" } }, { id: "tele-roar-01", who: "The brute", does: "Roar at Isolde", d: 6, kind: "fear", at: { user: "lee", ch: "isolde" } }, { id: "tele-spear-1", who: "A guard", does: "Spear Vesk", d: 6, kind: "blow", at: { user: "kai", ch: "vesk" } }] }, gm, "round 1 goes out");
  // Intercept: blows only, one taker, never your own.
  not({ o: "icp", id: "tele-roar-01", ch: "bram", free: true }, sam, "fear's inside her head, so nobody takes it for her");
  ok({ o: "icp", id: "tele-club-01", ch: "bram", free: true }, sam, "Bram takes the club for Isolde, free since he's a Guardian");
  not({ o: "icp", id: "tele-club-01", ch: "vesk" }, kai, "and Vesk can't take it as well");
  not({ o: "icp", id: "tele-spear-1", ch: "vesk" }, kai, "nor take her own");
  // One action, and every die's an intent: Vesk's one roll answers the spear
  // with one die and goes at the satchel with another.
  ok({ o: "answer", id: "tele-spear-1", ch: "vesk", a: { root: "Body", steps: 11, rid: "roll-vesk-01", dice: [{ size: 6, total: 5 }], opp: 4, t: 990 } }, kai, "Vesk answers the spear with a die of her Body roll", { phoneNow: 1000 });
  const work = (id, total, opp, aim = "Locked", t = 995, rid = "roll-vesk-01") => ({ id, k: "work", ref: "stake-satchel", root: "Body", steps: 11, t, roll: { dice: [{ size: 10, total }], opp }, aim, ...(rid ? { rid } : {}) });
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-01", 8, 4, "Locked", 995, null)] } }, kai, "a roll of its own at the satchel's a second action");
  same(ap({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [work("act-vesk-01", 8, 4, "Locked", 995, null)] } }, kai, { phoneNow: 1000 }).why, "There’s no getting another action now. Every die’s an intent, so split your roll to do more. Reload the page for the new rules.", "and there's no buying another");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-01", 8, 4)] } }, kai, "the same roll's die at the satchel is the same action", { phoneNow: 1000 });
  same(T.spentBy(r1(), "kai", "vesk"), { used: 1, have: 1 }, "so it's one action between them");
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [1, 0], "her Locks, 8 against its 4, takes Locked");
  same(r1().held["stake-satchel"], 4, "and the satchel's 4 stands for the round");
  ok({ o: "acts", round: "round-one-01", ch: "bram", x: { more: [], list: [{ id: "act-bram-01", k: "work", ref: "stake-satchel", act: "Lift and carry", steps: 3, t: 996, roll: { dice: [{ size: 6, total: 4 }], opp: 2 }, aim: "Guarded" }] } }, sam, "Bram goes at it too", { phoneNow: 1000 });
  same(r1().acts["sam|bram"].list[0].roll.won, false, "his 4 ties the 4 that stands, and a tie's a loss");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [] } }, kai, "Vesk takes her roll at it back", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [0, 0], "and Locked's back in the way");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-02", 9, 4, "Guarded")] } }, kai, "she rolls it again, going for Guarded", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [0, 1], "and Guarded's gone");
  // A combo: Isolde puts her action into whoever answers the archer.
  ok({ o: "add", tele: { id: "tele-arrow-1", who: "The archer", does: "Shoot Bram", d: 10, kind: "blow", at: { user: "sam", ch: "bram" } } }, gm, "the archer, mid-round");
  ok({ o: "acts", round: "round-one-01", ch: "isolde", x: { more: [], list: [{ id: "act-isol-01", k: "join", ref: "tele-arrow-1", root: "Mind", steps: 9, t: 997 }] } }, lee, "Isolde puts her Mind into whoever answers the archer, all 9 of it", { phoneNow: 1000 });
  same([T.joinersOf(r1(), "tele-arrow-1")[0].root, T.joinHow(r1().acts["lee|isolde"].list[0])], ["Mind", "9 steps on Mind"], "her Root goes in, and it's said that way");
  not({ o: "answer", id: "tele-arrow-1", ch: "isolde", a: { root: "Mind", steps: 9, dice: [{ size: 6, total: 5 }], opp: 3 } }, lee, "so she can't answer it as well");
  not({ o: "answer", id: "tele-arrow-1", ch: "bram", a: { root: "Body", steps: 18, dice: [{ size: 12, total: 11 }], opp: 9, with: [{ user: "lee", ch: "isolde" }] } }, sam, "Bram's spent his action on the satchel, a roll of its own");
  ok({ o: "acts", round: "round-one-01", ch: "bram", x: { more: [], list: [] } }, sam, "he takes it back", { phoneNow: 1000 });
  ok({ o: "answer", id: "tele-arrow-1", ch: "bram", a: { root: "Body", steps: 18, dice: [{ size: 12, total: 11 }], opp: 9, with: [{ user: "lee", ch: "isolde" }] } }, sam, "and answers the archer with Isolde's Mind in");
  same(r1().tele.find((t) => t.id === "tele-arrow-1").ans.with.map((w) => [w.name, w.root, w.steps]), [["Isolde", "Mind", 9]], "Isolde's in his answer, her Mind and its steps");
  not({ o: "acts", round: "round-one-01", ch: "isolde", x: { more: [], list: [] } }, lee, "and once it's rolled, she can't take hers back", { phoneNow: 1000 });
  same(T.spentBy(r1(), "sam", "bram"), { used: 1, have: 1 }, "Bram's one action is his answer");
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-03", k: "else", act: "Defend", set: true, t: 998 }] } }, kai, "Defending's an action of its own, so not with her roll", { phoneNow: 1000 });
  // The round ends: what nobody worked steps down, and the club lands on Bram.
  now = 2000;
  ok({ o: "end", round: "round-one-01" }, gm, "round 1 ends");
  same([doc.scene.stakes[0].clock, doc.scene.events[0].d], [6, 2], "the satchel was worked, so its clock stays on d6, and the buyer's down to d2");
  same(r1().moved, [{ ref: "event-buyer", from: 4, to: 2, out: "" }], "and the round says what moved");
  same(T.landsOn(r1().tele[0]).user, "sam", "the club was aimed at Isolde, but it lands on Bram, who took it");
  not({ o: "defend", id: "tele-club-01", ch: "isolde", r: { on: "Defend", stopped: false, mine: null, v: 6 } }, lee, "so Isolde doesn't roll When it lands for it");
  ok({ o: "defend", id: "tele-club-01", ch: "bram", r: { on: "Defend", stopped: true, mine: 7, v: 6 } }, sam, "Bram does");
  // Vesk's roll had a die at the buyer too, done in the round with no signal,
  // and it turns up late: it never stepped down.
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-04", k: "work", ref: "event-buyer", root: "Body", steps: 11, rid: "roll-vesk-01", t: 1500, roll: { dice: [{ size: 4, total: 1 }], opp: 3 }, aim: "slow" }] } }, kai, "Vesk's die at the buyer, from the same roll, turns up late", { phoneNow: 2001 });
  same([doc.scene.events[0].d, r1().moved.length], [4, 0], "so the buyer never stepped down");
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-09", k: "else", act: "Move", t: 1600 }] } }, kai, "and a Move on top's a second action", { phoneNow: 2001 });
  // On Roots (8 Nov): a telegraph's at a Root, only what's at a Body can be
  // intercepted, and When it lands says the Root or Defend that rolled. A
  // round from stacking (14 Nov), when extra actions could be bought, keeps
  // the ones it had and reads them the way it did, but nobody gets another.
  {
    const roster2 = roster;
    const doc2 = T.blank();
    const ap2 = (op, who, extra = {}) => T.apply(doc2, op, who, roster2, 5000, extra);
    const ok2 = (op, who, what, extra) => same(ap2(op, who, extra), { ok: true }, what);
    const not2 = (op, who, what, extra) => {
      const r = ap2(op, who, extra);
      same(r.ok, false, what);
      return r.why ?? r.error ?? "";
    };
    ok2({ o: "round", id: "round-root01", tele: [{ id: "tele-club-r1", who: "The brute", does: "Club Isolde", d: 8, root: "Body", at: { user: "lee", ch: "isolde" } }, { id: "tele-lie-r01", who: "The steward", does: "Lie to Isolde", d: 6, root: "Mind", at: { user: "lee", ch: "isolde" } }, { id: "tele-curse-1", who: "The witch", does: "Curse Isolde", d: 10, root: "Soul", at: { user: "lee", ch: "isolde" } }] }, gm, "a round on Roots, a telegraph at each of Isolde's Roots");
    same(doc2.rounds[0].tele.map((t) => [t.root, t.kind, t.hits]), [["Body", "blow", 1], ["Mind", "fear", 1], ["Soul", "fear", 1]], "each telegraph's Root, and a hit a die");
    not2({ o: "icp", id: "tele-lie-r01", ch: "bram", free: true }, sam, "nobody intercepts the lie at her Mind");
    not2({ o: "icp", id: "tele-curse-1", ch: "bram", free: true }, sam, "or the curse at her Soul");
    ok2({ o: "icp", id: "tele-club-r1", ch: "bram", free: true }, sam, "Bram takes the club at her Body");
    const moves = (id, list) => list.map((j) => ({ id: `act-${id}-r${j}`, k: "else", act: "Move", t: 4900 + j }));
    const actsOf = (ch) => doc2.rounds[0].acts[ch === "bram" ? "sam|bram" : "kai|vesk"];
    // Vesk bought three extra actions on stacking before the new core came in.
    doc2.rounds[0].acts["kai|vesk"] = { name: "Vesk", more: ["aura", "aura", "hiding"], paid: [3, 4], list: moves("vesk", [1, 2, 3, 4]) };
    same([T.moresOf(actsOf("vesk")).map((m) => m.paid ?? m.k), T.spentBy(doc2.rounds[0], "kai", "vesk")], [[3, 4, "hiding"], { used: 4, have: 4 }], "a round from stacking keeps the extra actions it had, with what each one cost");
    ok2({ o: "acts", round: "round-root01", ch: "vesk", x: { more: ["aura", "aura", "hiding"], paid: [3, 4], list: moves("vesk", [1, 2, 3, 4]) } }, kai, "and her phone can send them back as they were", { phoneNow: 5000 });
    same(not2({ o: "acts", round: "round-root01", ch: "vesk", x: { more: ["aura", "aura", "aura", "hiding"], paid: [3, 4, 5], list: moves("vesk", [1, 2, 3, 4, 5]) } }, kai, "but never buy another", { phoneNow: 5000 }), "There’s no getting another action now. Every die’s an intent, so split your roll to do more. Reload the page for the new rules.", "since there's no getting another action");
    not2({ o: "acts", round: "round-root01", ch: "bram", x: { more: ["held"], list: moves("bram", [1, 2]) } }, sam, "holding last round's doesn't give Bram one either", { phoneNow: 5000 });
    ok2({ o: "acts", round: "round-root01", ch: "bram", x: { more: [], list: moves("bram", [1]) } }, sam, "his one action's a Move", { phoneNow: 5000 });
    not2({ o: "acts", round: "round-root01", ch: "bram", x: { more: [], list: moves("bram", [1, 2]) } }, sam, "and a second's turned down", { phoneNow: 5000 });
    ok2({ o: "acts", round: "round-root01", ch: "bram", x: { more: [], list: [] } }, sam, "Bram takes his back");
    // A phone whose actions came back turned down gets back what they cost,
    // once however many of its changes came back together, and pays again
    // for one the table kept that it had taken back.
    const three = { more: ["aura", "aura", "aura"], paid: [3, 4, 5], list: [] };
    same(T.settleActs(three, undefined), { aura: 12, bought: -3 }, "three extras the table never took give back 12 Aura");
    same(T.settleActs({ more: [], paid: [], list: [] }, undefined), { aura: 0, bought: 0 }, "and settled again, once the phone's record is the table's, nothing more");
    same(T.settleActs(three, { more: ["aura"], paid: [3], list: [] }), { aura: 9, bought: -2 }, "one kept is the cheapest, so the 4 and the 5 come back");
    same(T.settleActs({ more: ["aura"], paid: [3], list: [] }, { more: ["aura", "aura"], paid: [3, 4], list: [] }), { aura: -4, bought: 1 }, "one the table kept that the phone took back costs it again");
    same(T.settleActs({ more: ["resolve", "held"], list: [] }, { more: ["held"], list: [] }), { aura: 3, bought: -1 }, "an old record's 1 Resolve comes back as the 3 Aura it was");
    same(T.settleActs({ more: [], list: [{ id: "act-bram-j1", k: "join", ref: "tele-x", steps: 3, paid: 1 }] }, { more: [], list: [] }), { aura: 1, bought: 0 }, "and so does explaining what went into a friend's answer the table didn't take");
    same(T.settleActs({ more: [], list: [] }, { more: [], list: [{ id: "act-bram-j1", k: "join", ref: "tele-x", steps: 3, paid: 1 }] }), { aura: -1, bought: 0 }, "or costs it again when the table kept it");
    ok2({ o: "end", round: "round-root01" }, gm, "the round on Roots ends");
    not2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Body", stopped: true, mine: 7, v: 4 } }, lee, "her Body can't roll against the lie at her Mind");
    not2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Stamina", stopped: true, mine: 7, v: 4 } }, lee, "nor can an older phone's Stamina");
    ok2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Mind", stopped: true, mine: 7, v: 4 } }, lee, "her Mind stops it");
    ok2({ o: "defend", id: "tele-curse-1", ch: "isolde", r: { on: "Defend", stopped: false, mine: 3, v: 9, hits: 1, lost: { Soul: 1 } } }, lee, "her Defend doesn't stop the curse, and it takes a point of Soul");
    ok2({ o: "defend", id: "tele-club-r1", ch: "bram", r: { on: "Stamina", stopped: true, mine: 8, v: 5 } }, sam, "and an older phone's Stamina stops the club Bram took, as his Body");
    same(doc2.rounds[0].tele.map((t) => t.def?.on), ["Body", "Mind", "Defend"], "each one saying the Root or Defend that rolled against it");
    same(T.costOf(doc2.rounds[0].tele[2].def), "1 hit: a point off Soul", "and what the curse cost");
    const view = T.screenOf(doc2, { name: "Tuesday Lair", crew: [] });
    same(view?.round?.tele?.map((t) => [t.root, t.def?.on, t.def?.cost]), [["Body", "Body", ""], ["Mind", "Mind", ""], ["Soul", "Defend", "1 hit: a point off Soul"]], "the table screen showing each telegraph's Root, what rolled against it and what got through cost");
    const crewView = T.screenOf(doc2, { name: "Tuesday Lair", crew: [{ key: "kai|vesk", name: "Vesk", crew: "vesk" }] });
    same(crewView.crew[0].more, ["3 Aura", "4 Aura", "hiding"], "and Vesk's extra actions from stacking with what each one cost");
  }
  // On stacking: an answer names its Root and steps, never a specialty, a
  // friend puts in their steps and the Aura they paid to explain any of them,
  // and a roll at the scene names its Root. One from before reads as it was.
  {
    const doc3 = T.blank();
    const ap3 = (op, who, extra = {}) => T.apply(doc3, op, who, roster, 6000, extra);
    const ok3 = (op, who, what, extra) => same(ap3(op, who, extra), { ok: true }, what);
    ok3({ o: "put", el: { id: "stake-chest1", t: "stake", name: "The strongbox", c: 3, tags: ["Locked"] } }, gm, "a stake");
    ok3({ o: "round", id: "round-stack1", tele: [{ id: "tele-club-s1", who: "The brute", does: "Club Isolde", d: 8, root: "Body", at: { user: "lee", ch: "isolde" } }, { id: "tele-spear-s", who: "A guard", does: "Spear Vesk", d: 6, root: "Body", at: { user: "kai", ch: "vesk" } }] }, gm, "a round on stacking");
    ok3({ o: "acts", round: "round-stack1", ch: "bram", x: { more: [], list: [{ id: "act-bram-s1", k: "join", ref: "tele-club-s1", steps: 5, paid: 1, t: 5990 }] } }, sam, "Bram puts five things in, one he explained for 1 Aura", { phoneNow: 6000 });
    same(T.joinersOf(doc3.rounds[0], "tele-club-s1").map((j) => [j.name, j.steps, j.act]), [["Bram", 5, undefined]], "his steps go in, and no specialty");
    same([doc3.rounds[0].acts["sam|bram"].list[0].paid, T.joinHow(doc3.rounds[0].acts["sam|bram"].list[0])], [1, "5 steps"], "with the Aura he paid kept, and said as his steps");
    ok3({ o: "answer", id: "tele-club-s1", ch: "isolde", a: { root: "Body", act: "Body and Archery", steps: 17, dice: [{ size: 12, total: 11 }, { size: 12, total: 3 }, { size: 10, total: 6 }], opp: 6, with: [{ user: "sam", ch: "bram" }] } }, lee, "Isolde answers on her Body with Bram in it, 17 steps");
    const ans = doc3.rounds[0].tele[0].ans;
    same([ans.root, ans.steps, "act" in ans, T.howOf(ans)], ["Body", 17, false, "17 steps on Body"], "the answer keeps its Root and steps, and drops a specialty sent with it");
    ok3({ o: "acts", round: "round-stack1", ch: "vesk", x: { more: [], list: [{ id: "act-vesk-s1", k: "work", ref: "stake-chest1", root: "Body", act: "Body and Locks", steps: 13, t: 5995, roll: { dice: [{ size: 12, total: 9 }, { size: 2, total: 1 }], opp: 4 }, aim: "Locked" }] } }, kai, "Vesk works the strongbox on her Body, 13 steps", { phoneNow: 6000 });
    const work = doc3.rounds[0].acts["kai|vesk"].list[0];
    same([work.root, "act" in work, T.howOf(work), work.did?.tag], ["Body", false, "13 steps on Body", "Locked"], "a roll at the scene names its Root, and Locked comes off");
    // A table from before stacking: an answer with the specialty it rolled,
    // a friend's specialty and a roll at the scene's, and Aura extras with no
    // price, all still read the way they were.
    const old = { v: 3, fight: 1, scene: { ground: [], stakes: [{ id: "stake-old01", t: "stake", name: "The ledger", c: 2, tags: [{ name: "Hidden", gone: 1 }], clock: 0, out: "won" }], events: [], place: null }, rounds: [{ id: "round-old-01", n: 1, at: 1, over: 2, held: {}, moved: [],
      acts: { "sam|bram": { name: "Bram", more: [], list: [{ id: "act-old-b01", k: "join", ref: "tele-old-01", act: "Shieldwork", steps: 4, t: 1 }] }, "kai|vesk": { name: "Vesk", more: ["resolve", "aura"], list: [{ id: "act-old-v01", k: "work", ref: "stake-old01", act: "Body and Locks", steps: 9, t: 1, roll: { dice: [{ size: 12, total: 9, out: "beat" }], opp: 3, won: true }, aim: "Hidden", did: { tag: "Hidden", won: true } }, { id: "act-old-v02", k: "else", act: "Move", t: 1 }] } },
      tele: [{ id: "tele-old-01", who: "The brute", does: "Club Isolde", d: 8, kind: "blow", at: { user: "lee", ch: "isolde", name: "Isolde" }, sent: 1, seen: 1, ans: { user: "kai", ch: "wren", name: "Wren", act: "Body and Archery", steps: 7, dice: [{ size: 12, total: 8, out: "beat" }], opp: 6, real: false, won: true, at: 1, with: [{ user: "sam", ch: "bram", name: "Bram", act: "Shieldwork", steps: 5 }] }, def: null, icp: null }] }], turn: null, last: null, found: null };
    T.fresh(old);
    const was = old.rounds[0];
    same([T.howOf(was.tele[0].ans), T.joinHow(was.acts["sam|bram"].list[0]), T.howOf(was.acts["kai|vesk"].list[0])], ["Body and Archery", "Shieldwork", "Body and Locks"], "an older table's answer, friend and roll read as they were");
    same(T.moresOf(was.acts["kai|vesk"]), [{ k: "aura", paid: 3 }, { k: "aura", paid: 3 }], "its 1 Resolve and its Aura extra were 3 Aura each");
    const oldView = T.screenOf(old, { name: "Tuesday Lair", crew: [{ key: "kai|vesk", name: "Vesk", crew: "vesk" }, { key: "sam|bram", name: "Bram", crew: "bram" }] });
    same([oldView.round.tele[0].ans.act, oldView.crew[0].acts[0].act, oldView.crew[0].more, oldView.crew[1].acts[0].act], ["Body and Archery", "Body and Locks", ["3 Aura", "3 Aura"], "Shieldwork"], "and the table screen says them as they were");
    const newView = T.screenOf(doc3, { name: "Tuesday Lair", crew: [{ key: "kai|vesk", name: "Vesk", crew: "vesk" }, { key: "sam|bram", name: "Bram", crew: "bram" }, { key: "lee|isolde", name: "Isolde", crew: "isolde" }] });
    same([newView.round.tele[0].ans.act, newView.crew[2].acts[0].act, newView.crew[0].acts[0].act, newView.crew[1].acts[0].act, newView.crew[0].more], ["17 steps on Body", "17 steps on Body", "13 steps on Body", "5 steps", []], "where a new one names its Root and steps");
  }
  // The new core (16 Nov): a deadly threat's dice are 2 hits or more, said
  // on its telegraph. A lost answer lands then and there, and whoever it
  // lands on writes what it cost with no defence. When it lands writes the
  // points it took, the wound and the Scar, and a Scar takes them out of the
  // scene: nothing's aimed at them, and they don't act or step in front of
  // anything till the fight's over. The Blaze takes them out too.
  {
    const doc5 = T.blank();
    let t5 = 7000;
    const ap5 = (op, who, extra = {}) => T.apply(doc5, op, who, roster, t5, extra);
    const ok5 = (op, who, what, extra) => same(ap5(op, who, extra), { ok: true }, what);
    const not5 = (op, who, what, extra) => {
      const r = ap5(op, who, extra);
      same(r.ok, false, what);
      return r.why ?? "";
    };
    const tele5 = (id) => T.findTele(doc5, id)?.t;
    ok5({ o: "round", id: "round-core01", tele: [
      { id: "tele-knight1", who: "The knight", does: "Cleave Vesk", d: 12, hits: 2, root: "Body", at: { user: "kai", ch: "vesk" } },
      { id: "tele-shove01", who: "A guard", does: "Shove Isolde off the stair", d: 6, root: "Body", at: { user: "lee", ch: "isolde" } },
      { id: "tele-sneer01", who: "The steward", does: "Sneer at Bram", d: 4, root: "Mind", at: { user: "sam", ch: "bram" } },
      { id: "tele-hall-01", who: "The roof", does: "Come down on the hall", d: 8, hits: 9, root: "Body", at: { k: "place", name: "everyone in the hall" } },
    ] }, gm, "round 1 of a fight on the new core");
    same([tele5("tele-knight1").hits, tele5("tele-shove01").hits, tele5("tele-hall-01").hits], [2, 1, 6], "the knight's deadly, 2 hits a die, one that doesn't say is 1, and 6's the most");
    // Isolde answers the shove on her Mind and loses: it lands then and there,
    // a hit at her Body, which is 0, so it wounds her.
    ok5({ o: "answer", id: "tele-shove01", ch: "isolde", a: { root: "Mind", bring: ["Soul", "Mind", "Heart"], steps: 15, rid: "roll-isol-c1", dice: [{ size: 12, total: 3 }], opp: 5 } }, lee, "Isolde answers the shove on her Mind, her Soul brought in, and loses");
    same([tele5("tele-shove01").ans.bring, T.howOf(tele5("tele-shove01").ans)], [["Soul"], "15 steps on Mind and Soul"], "the Roots it brought in, never its own twice or one that isn't");
    not5({ o: "defend", id: "tele-shove01", ch: "isolde", r: { on: "Body", stopped: true, mine: 6, v: 5 } }, lee, "nothing rolls against a lost answer");
    ok5({ o: "defend", id: "tele-shove01", ch: "isolde", r: { on: "Body", stopped: false, mine: null, v: 5, hits: 1, wound: "Body" } }, lee, "she writes what it cost, there and then: Bloodied");
    same([T.stateOf(tele5("tele-shove01"), doc5.rounds[0]), T.costOf(tele5("tele-shove01").def)], ["hit", "1 hit: Bloodied"], "it's still a lost answer, with its cost");
    same(T.woundsOf(doc5).get("lee|isolde"), ["Body"], "and the table's seen Isolde Bloodied");
    // Bram's roll on his Soul goes at the sneer and the steward's hold on the
    // room, a die each: one action.
    ok5({ o: "answer", id: "tele-sneer01", ch: "bram", a: { root: "Soul", steps: 4, rid: "roll-bram-c1", dice: [{ size: 8, total: 6 }], opp: 2 } }, sam, "Bram's Soul stops the sneer");
    ok5({ o: "acts", round: "round-core01", ch: "bram", x: { more: [], list: [{ id: "act-bram-c2", k: "else", act: "Shout the hall quiet", rid: "roll-bram-c1", t: 6990 }] } }, sam, "and the same roll's other die shouts the hall quiet", { phoneNow: 7000 });
    same(T.spentBy(doc5.rounds[0], "sam", "bram"), { used: 1, have: 1 }, "one action");
    ok5({ o: "there", id: "tele-hall-01", ch: "bram", in: false }, sam, "he gets out of the hall");
    ok5({ o: "there", id: "tele-hall-01", ch: "isolde", in: false }, lee, "and so does Isolde");
    // The round ends. The knight's two dice-worth of hits Scar Vesk, who's
    // been wounded already this fight.
    t5 = 8000;
    ok5({ o: "end", round: "round-core01" }, gm, "the round ends");
    ok5({ o: "defend", id: "tele-knight1", ch: "vesk", r: { on: "Body", stopped: false, mine: 3, v: 11, hits: 2, lost: { Body: 1 }, wound: "Body" } }, kai, "the knight gets through Vesk's Body, 2 hits: her last point, then Bloodied");
    ok5({ o: "defend", id: "tele-hall-01", ch: "vesk", r: { on: "Body", stopped: false, mine: 2, v: 7, hits: 6, scar: "Body" } }, kai, "and the roof Scars her");
    not5({ o: "defend", id: "tele-hall-01", ch: "isolde", r: { on: "Body", stopped: false, mine: 1, v: 7, hits: 6 } }, lee, "Isolde got out of the hall, so it isn't hers to roll");
    same([T.costOf(tele5("tele-knight1").def), T.costOf(tele5("tele-hall-01").there["kai|vesk"].def), T.costOf({ hits: 2, lost: { Soul: 4 } })], ["2 hits: a point off Body and Bloodied", "6 hits: a Scar on Body", "2 hits: 4 points off Soul"], "what each one cost, and 2 for 1 said the same way");
    // The 17 Nov fixes: what armour soaked comes in as soaked, with box the
    // same for a phone from before, and an answer's item rides with its
    // steps. One from before soak still says its boxes.
    same(T.costOf(T.defenceFrom({ on: "Body", stopped: false, mine: 2, v: 7, hits: 3, soaked: 2, box: 2, lost: { Body: 1 } })), "3 hits: 2 soaked by armour and a point off Body", "soak said first, then the point");
    same([T.defenceFrom({ on: "Body", stopped: false, mine: 2, v: 7, hits: 1, soaked: 1, box: 1 }).soaked, T.defenceFrom({ on: "Body", stopped: false, mine: 2, v: 7, hits: 1, soaked: 1, box: 1 }).box], [1, 1], "soaked kept, and box beside it");
    same(T.costOf({ hits: 1, box: 1 }), "1 hit: a box of armour", "a round from before soak reads as it was");
    const bow = T.answerFrom({ root: "Body", steps: 13, item: "a Proven longbow", dice: [{ size: 12, total: 9 }], opp: 6 });
    same([bow.item, T.howOf(bow)], ["a Proven longbow", "13 steps on Body, with a Proven longbow"], "Wren's answer with her longbow, its tier in the steps");
    same(T.howOf(T.answerFrom({ root: "Body", steps: 11, dice: [{ size: 12, total: 9 }], opp: 6 })), "11 steps on Body", "and one with no item as it was");
    same([...T.outOf(doc5).keys()], ["kai|vesk"], "Vesk's left the scene");
    const screen5 = T.screenOf(doc5, { name: "Tuesday Lair", crew: [{ key: "kai|vesk", name: "Vesk" }, { key: "lee|isolde", name: "Isolde" }, { key: "sam|bram", name: "Bram" }] });
    same(screen5.crew.map((c) => [c.name, c.wounds, c.out]), [["Vesk", ["Bloodied"], "scar"], ["Isolde", ["Bloodied"], ""], ["Bram", [], ""]], "and the table screen has who's wounded and who's out");
    same(screen5.round.tele[0].hits, 2, "with the knight's hits on its card");
    // Round 2: Vesk's out, so nothing's aimed at her and she does nothing.
    same(not5({ o: "round", id: "round-core02", tele: [{ id: "tele-knight2", who: "The knight", does: "Finish Vesk", d: 12, hits: 2, at: { user: "kai", ch: "vesk" } }] }, gm, "a round at nobody but Vesk doesn't go out"), "There’s nobody in the campaign for that round to go to.", "since she's left the scene");
    same(T.teleFrom({ id: "tele-knight2", who: "The knight", does: "Finish Vesk", d: 12, at: { user: "kai", ch: "vesk" } }, roster, t5, doc5).why, "Vesk’s left the scene with a Scar, so there’s nothing to aim at till the fight’s over.", "and why");
    ok5({ o: "round", id: "round-core02", tele: [{ id: "tele-knight3", who: "The knight", does: "Cleave Bram", d: 12, hits: 2, at: { user: "sam", ch: "bram" } }, { id: "tele-smoke01", who: "The fire", does: "Fill the hall with smoke", d: 6, root: "Body", at: { k: "place", name: "everyone in the hall" } }] }, gm, "round 2 goes out at Bram and the hall");
    same(Object.keys(tele5("tele-smoke01").there), ["sam|bram", "lee|isolde"], "and Vesk isn't in the hall");
    not5({ o: "icp", id: "tele-knight3", ch: "vesk" }, kai, "she can't step in front of the knight");
    not5({ o: "acts", round: "round-core02", ch: "vesk", x: { more: [], list: [{ id: "act-vesk-c3", k: "else", act: "Move", t: 7990 }] } }, kai, "or act", { phoneNow: 8000 });
    // Isolde's wounded, so she takes the Blaze, and leaves too.
    ok5({ o: "acts", round: "round-core02", ch: "isolde", x: { more: [], list: [{ id: "act-isol-c3", k: "else", act: "Blaze", set: true, root: "Body", t: 7995 }] } }, lee, "Isolde takes the Blaze on her Body", { phoneNow: 8000 });
    same([T.actSaid(doc5.rounds[1].acts["lee|isolde"].list[0]), T.outOf(doc5).get("lee|isolde")?.why], ["taking the Blaze on Body", "blaze"], "and she's out of the scene");
    ok5({ o: "acts", round: "round-core02", ch: "isolde", x: { more: [], list: [{ id: "act-isol-c3", k: "else", act: "Blaze", set: true, root: "Body", t: 7995 }] } }, lee, "her phone can send the Blaze again", { phoneNow: 8000 });
    // The fight's over, and everyone's back.
    ok5({ o: "fight", fight: 1 }, gm, "that fight's over");
    same(T.outOf(doc5).size, 0, "so nobody's out of the scene any more");
  }
  // Rounds with only the scene: the buyer arrives, then the satchel's lost.
  ok({ o: "round", id: "round-two-02", tele: [] }, gm, "a round with nothing telegraphed, since the scene's running");
  now = 3000;
  ok({ o: "end", round: "round-two-02" }, gm, "round 2 ends");
  same([doc.scene.events[0].d, doc.scene.stakes[0].clock], [2, 4], "the buyer's on d2 and the satchel's clock on d4");
  ok({ o: "round", id: "round-three3", tele: [] }, gm, "round 3");
  now = 4000;
  ok({ o: "end", round: "round-three3" }, gm, "round 3 ends");
  same([doc.scene.events[0].out, doc.scene.stakes[0].clock], ["done", 2], "past d2, the buyer arrives, and the satchel's clock is on d2");
  ok({ o: "round", id: "round-four-4", tele: [] }, gm, "round 4");
  ok({ o: "end", round: "round-four-4" }, gm, "round 4 ends");
  same([doc.scene.stakes[0].out, doc.scene.stakes[0].clock], ["lost", 0], "and past d2, the satchel's lost");
  // A stake with one thing in the way, won in one go.
  ok({ o: "put", el: { id: "stake-deal-1", t: "stake", name: "The deal", c: 4, tags: ["Someone Must Agree"] } }, gm, "the deal");
  ok({ o: "round", id: "round-five-5", tele: [] }, gm, "round 5");
  ok({ o: "acts", round: "round-five-5", ch: "vesk", x: { more: [], list: [{ id: "act-v5-0001", k: "work", ref: "stake-deal-1", act: "Talk", steps: 4, t: 0, roll: { dice: [{ size: 8, total: 8 }], opp: 3 }, aim: "" }] } }, kai, "Vesk talks Dace round");
  same(doc.scene.stakes.find((s) => s.id === "stake-deal-1").out, "won", "and the deal's the crew's");
  same(T.viewOf(doc, "player").scene.stakes.map((x) => x.name), ["Dace’s satchel", "The deal"], "every phone gets the scene with the rounds");
  T.forget(doc, "sam");
  same(r1().tele.find((t) => t.id === "tele-club-01").icp, undefined, "Sam's intercept goes when his account does");
  same(Object.keys(r1().acts).some((k) => k.startsWith("sam|")), false, "and so does what he spent his actions on");

  // From the independent check: rolls and Undos that cross each other.
  const doc2 = T.blank();
  const ap2 = (op, who, extra = {}) => T.apply(doc2, op, who, roster, now, extra);
  const ok2 = (op, who, what, extra) => same(ap2(op, who, extra), { ok: true }, what);
  const not2 = (op, who, what, extra) => same(ap2(op, who, extra).ok, false, what);
  const r = () => doc2.rounds[doc2.rounds.length - 1];
  const at = (id, ref, act, total, opp, aim, t = 0) => ({ id, k: "work", ref, act, steps: 3, t, roll: { dice: [{ size: 6, total }], opp }, aim });
  ok2({ o: "put", el: { id: "event-watch1", t: "event", name: "The watch", what: "the watch comes in", d: 8 } }, gm, "the watch, a d8");
  ok2({ o: "put", el: { id: "stake-door01", t: "stake", name: "The door", c: 3, tags: ["Locked", "Barred"] } }, gm, "the door, Locked and Barred");
  ok2({ o: "round", id: "round-a-0001", tele: [] }, gm, "a round with only the scene");
  ok2({ o: "acts", round: "round-a-0001", ch: "vesk", x: { more: [], list: [at("act-watch-v1", "event-watch1", "Sneak", 8, 7, "drive")] } }, kai, "Vesk drives the watch, 8 against its 7");
  same(doc2.scene.events[0].d, 6, "and it's down to d6");
  ok2({ o: "acts", round: "round-a-0001", ch: "bram", x: { more: [], list: [at("act-watch-b1", "event-watch1", "Talk", 6, 7, "slow")] } }, sam, "Bram's roll at it is judged against the 7 that stands, though it's only a d6 now");
  same(r().acts["sam|bram"].list[0].roll.won, false, "and his 6 doesn't beat it");
  ok2({ o: "acts", round: "round-a-0001", ch: "isolde", x: { more: [], list: [at("act-door-i1", "stake-door01", "Ward", 6, 2, "Locked")] } }, lee, "Isolde takes Locked off the door");
  ok2({ o: "acts", round: "round-a-0001", ch: "bram", x: { more: [], list: [{ ...at("act-watch-b1", "event-watch1", "Talk", 6, 7, "slow"), rid: "roll-bram-a1" }, { ...at("act-door-b2", "stake-door01", "Lift and carry", 5, 2, "Barred"), rid: "roll-bram-a1" }] } }, sam, "Bram's roll had a die at the door too, and takes Barred, the last thing in its way");
  same(doc2.scene.stakes[0].out, "won", "so the door's won");
  ok2({ o: "acts", round: "round-a-0001", ch: "isolde", x: { more: [], list: [] } }, lee, "Isolde takes hers back");
  same([doc2.scene.stakes[0].tags.map((g) => g.gone), doc2.scene.stakes[0].out], [[0, 1], ""], "Locked's back in the way, so it isn't won any more");
  same(r().acts["sam|bram"].list[1].did?.won, undefined, "and Bram's roll doesn't say it won it");
  not2({ o: "acts", round: "round-a-0001", ch: "vesk", x: { more: ["held", "hiding"], list: [at("act-watch-v1", "event-watch1", "Sneak", 8, 7, "drive")] } }, kai, "Vesk can't say she held last round, since nothing gives another action");
  same(r().acts["kai|vesk"].more, [], "and she's got the one she had");
  now = 5000;
  ok2({ o: "end", round: "round-a-0001" }, gm, "the round ends");
  // A late roll from the round saves what its end just closed.
  ok2({ o: "put", el: { id: "stake-gate01", t: "stake", name: "The gate", c: 2, tags: ["Chained"], clock: 2 } }, gm, "the gate, on a d2 clock");
  ok2({ o: "round", id: "round-b-0002", tele: [] }, gm, "the next round");
  now = 6000;
  ok2({ o: "end", round: "round-b-0002" }, gm, "it ends with nobody at the gate");
  same(doc2.scene.stakes[1].out, "lost", "so the gate's lost");
  ok2({ o: "acts", round: "round-b-0002", ch: "vesk", x: { more: [], list: [at("act-gate-v1", "stake-gate01", "Locks", 5, 3, "Chained", 5500)] } }, kai, "but Vesk's roll at it, from the round, turns up late", { phoneNow: 6100 });
  same([doc2.scene.stakes[1].out, doc2.scene.stakes[1].clock], ["won", 2], "and wins it: it was never lost");
  // A round with nothing telegraphed needs something in the scene still running.
  const doc3 = T.blank();
  same(T.apply(doc3, { o: "put", el: { id: "stake-done01", t: "stake", name: "The ledger", c: 2, tags: [{ name: "Locked", gone: 1 }], out: "won" } }, gm, roster, now), { ok: true }, "a stake that's won already");
  same(T.apply(doc3, { o: "round", id: "round-d-0004", tele: [] }, gm, roster, now).ok, false, "is nothing to start a round with");

  // Telegraphs at the scene: a stake and the scene clock have no defence, and
  // if nobody stops one it does what it said. One at a place lands on whoever's
  // in it, and getting out gets you clear.
  const doc4 = T.blank();
  const ap4 = (op, who, extra = {}) => T.apply(doc4, op, who, roster, now, extra);
  const ok4 = (op, who, what, extra) => same(ap4(op, who, extra), { ok: true }, what);
  const not4 = (op, who, what, extra) => same(ap4(op, who, extra).ok, false, what);
  const tele4 = (id) => T.findTele(doc4, id)?.t;
  const deal = () => doc4.scene.stakes.find((s) => s.id === "stake-deal-4");
  const clock4 = () => doc4.scene.events.find((e) => e.id === "event-clock4");
  ok4({ o: "clear", place: { id: "s-place-copper-baths", name: "The Copper Baths" } }, gm, "the scene cleared for the Copper Baths");
  same(doc4.scene.place, { id: "s-place-copper-baths", name: "The Copper Baths" }, "and it knows which place it is");
  ok4({ o: "put", el: { id: "stake-deal-4", t: "stake", name: "The deal", c: 4, tags: ["Someone Must Agree", "Wanted By Others"] } }, gm, "the deal");
  ok4({ o: "put", el: { id: "stake-bag-04", t: "stake", name: "Dace’s satchel", c: 3, tags: ["Locked"], clock: 4 } }, gm, "the satchel, on a d4 clock");
  ok4({ o: "put", el: { id: "event-clock4", t: "event", name: "The scene clock", what: "Dace signs with them", d: 8, scene: true } }, gm, "the scene clock on d8");
  const dace = { id: "tele-dace-04", who: "Dace", does: "grabs his towel and heads for the changing room.", d: 8, at: { k: "stake", ref: "stake-deal-4" }, fx: { tag: "Dace grabs his towel and heads for the changing room" } };
  const runner = { id: "tele-runner4", who: "A runner", does: "Bring word the buyer’s on his way", d: 6, at: { k: "event", ref: "event-clock4" }, fx: { by: 1 } };
  const steam = { id: "tele-steam-4", who: "The pipes", does: "Burst and fill the hot room with steam", d: 6, kind: "blow", one: "Burning", at: { k: "place", name: "in the hot room" } };
  same(T.teleFrom({ ...dace, fx: { tag: "" } }, roster, now, doc4)?.why, "Say what goes in its way if it lands.", "one at a stake has to say what goes in its way");
  same(Boolean(T.teleFrom({ ...dace, at: { k: "stake", ref: "stake-gone-9" } }, roster, now, doc4)?.why), true, "and has to be at something on the scene");
  same(T.teleFrom({ ...dace, fx: { by: 1 } }, roster, now, doc4)?.why, "Say what goes in its way if it lands.", "the deal's got no clock to drop");
  same(T.teleFrom({ ...dace, at: { k: "stake", ref: "stake-bag-04" }, fx: { by: 2 } }, roster, now, doc4)?.fx, { by: 2 }, "the satchel's clock can drop two sizes");
  ok4({ o: "round", id: "round-sc-001", tele: [dace, runner, steam, { id: "tele-club-04", who: "The brute", does: "Club Isolde", d: 8, at: { user: "lee", ch: "isolde" } }] }, gm, "a round with one at the deal, the scene clock, the hot room and Isolde");
  same([tele4("tele-dace-04").at, tele4("tele-dace-04").kind], [{ k: "stake", ref: "stake-deal-4", name: "The deal" }, "blow"], "the deal's, by its id and name");
  same(T.placeOf("in the hot room"), { name: "everyone in the hot room", where: "in the hot room" }, "the hot room, said as everyone in it");
  same(T.placeOf("whoever’s at the door"), { name: "whoever’s at the door", where: "at the door" }, "and the book's own way of saying it");
  same(Object.keys(tele4("tele-steam-4").there), ["kai|vesk", "sam|bram", "lee|isolde"], "everyone playing's in the hot room when it goes out");
  same(T.fxSaid(tele4("tele-dace-04")), "it’s a new tag in the way of the deal", "the deal's says what it does, without saying its words twice");
  same(T.fxSaid({ ...tele4("tele-dace-04"), fx: { tag: "Gone to Change" } }), "“Gone to Change” goes in the way of the deal", "or the tag she named");
  same(T.fxSaid(tele4("tele-runner4")), "the scene clock drops a size", "the runner's drops the scene clock");
  // No defence, and nobody steps in front of it.
  not4({ o: "icp", id: "tele-dace-04", ch: "bram", free: true }, sam, "nobody can take one at the deal");
  not4({ o: "icp", id: "tele-steam-4", ch: "bram", free: true }, sam, "or one at the hot room");
  // Bram answers the runner and loses: it lands then and there, so the scene clock drops.
  ok4({ o: "answer", id: "tele-runner4", ch: "bram", a: { act: "Fight", steps: 4, dice: [{ size: 8, total: 2 }], opp: 5 } }, sam, "Bram answers the runner, 2 against its 5");
  same([clock4().d, tele4("tele-runner4").did], [6, { from: 8, to: 6, out: "" }], "it lands then and there: the scene clock drops to d6");
  ok4({ o: "answer", id: "tele-runner4", ch: "bram", a: null }, sam, "Bram's Undo takes his answer back");
  same([clock4().d, tele4("tele-runner4").did], [8, undefined], "and the scene clock's back on d8");
  ok4({ o: "answer", id: "tele-runner4", ch: "bram", a: { act: "Fight", steps: 4, dice: [{ size: 8, total: 2 }], opp: 5 } }, sam, "he rolls it again, and loses again");
  same(clock4().d, 6, "d6 again");
  // Out of the hot room: Isolde gets out, and the GM puts Bram out then back in.
  not4({ o: "there", id: "tele-steam-4", ch: "bram", in: false }, kai, "Kai can't say Bram's out");
  ok4({ o: "there", id: "tele-steam-4", ch: "isolde", in: false }, lee, "Isolde gets out of the hot room");
  ok4({ o: "there", id: "tele-steam-4", user: "sam", ch: "bram", in: false }, gm, "the GM puts Bram out by hand");
  ok4({ o: "there", id: "tele-steam-4", user: "sam", ch: "bram", in: true }, gm, "and back in");
  same(T.inIt(tele4("tele-steam-4")).map((p) => p.name), ["Vesk", "Bram"], "so it's Vesk and Bram in the hot room");
  not4({ o: "defend", id: "tele-dace-04", ch: "vesk", r: { on: "Defend", stopped: true, mine: 8, v: 3 } }, kai, "there's no defence against one at the deal");
  not4({ o: "defend", id: "tele-steam-4", ch: "vesk", r: { on: "Defend", stopped: true, mine: 8, v: 3 } }, kai, "and nobody rolls When it lands before it's landed");
  // The round ends: the deal gets its new tag, then the clocks step down.
  now = 7000;
  ok4({ o: "end", round: "round-sc-001" }, gm, "the round ends with nobody answering the deal's or the hot room's");
  same(deal().tags.map((g) => [g.name, g.by ?? ""]), [["Someone Must Agree", ""], ["Wanted By Others", ""], ["Dace grabs his towel and heads for the changing room", "tele-dace-04"]], "the deal's got a new tag in its way, on every phone");
  same([clock4().d, doc4.rounds[0].moved.find((m) => m.ref === "event-clock4")], [4, { ref: "event-clock4", from: 6, to: 4, out: "" }], "and the scene clock steps down at the end of the round too");
  same([T.stateOf(tele4("tele-dace-04"), doc4.rounds[0]), T.stateOf(tele4("tele-runner4"), doc4.rounds[0])], ["through", "hit"], "the deal's landed at the end, and the runner's then and there");
  same(T.stateOf(tele4("tele-steam-4"), doc4.rounds[0]), "landed", "the hot room's landed on Vesk and Bram, still to roll");
  same(["kai|vesk", "sam|bram", "lee|isolde"].map((k) => T.stateFor(tele4("tele-steam-4"), doc4.rounds[0], k)), ["landed", "landed", "clear"], "and Isolde got out, so it's clear of her");
  not4({ o: "there", id: "tele-steam-4", ch: "vesk", in: false }, kai, "once the round's over, Vesk can't get out of it");
  not4({ o: "defend", id: "tele-steam-4", ch: "isolde", r: { on: "Defend", stopped: true, mine: 6, v: 3 } }, lee, "Isolde doesn't roll When it lands for it");
  not4({ o: "defend", id: "tele-steam-4", ch: "vesk", r: { on: "Confidence", stopped: true, mine: 6, v: 3 } }, kai, "it's a blow, so it's against Defend");
  ok4({ o: "defend", id: "tele-steam-4", ch: "vesk", r: { on: "Defend", stopped: true, mine: 6, v: 3 } }, kai, "Vesk's Defend stops it, 6 against its 3");
  same(T.stateOf(tele4("tele-steam-4"), doc4.rounds[0]), "landed", "Bram's still to roll");
  ok4({ o: "defend", id: "tele-steam-4", ch: "bram", r: { on: "Defend", stopped: false, mine: 1, v: 5, paid: "Burning" } }, sam, "Bram's 1 doesn't stop its 5");
  same([T.stateOf(tele4("tele-steam-4"), doc4.rounds[0]), T.stateFor(tele4("tele-steam-4"), doc4.rounds[0], "kai|vesk"), T.stateFor(tele4("tele-steam-4"), doc4.rounds[0], "sam|bram")], ["through", "held", "through"], "it got through to Bram, and Vesk stopped it");
  not4({ o: "there", id: "tele-steam-4", user: "sam", ch: "bram", in: false }, gm, "the GM can't take Bram out once he's rolled for it");
  not4({ o: "answer", id: "tele-steam-4", ch: "isolde", a: { act: "Ward", steps: 3, dice: [{ size: 6, total: 6 }], opp: 2 } }, lee, "nor can anyone answer it once it's landed");
  // A late answer: Vesk stopped the deal's in the round, with no signal, so it never landed.
  ok4({ o: "answer", id: "tele-dace-04", ch: "vesk", a: { act: "Talk", steps: 4, dice: [{ size: 8, total: 7 }], opp: 3, t: 6500 } }, kai, "Vesk's answer to the deal's, rolled in the round, turns up late", { phoneNow: 7100 });
  same([deal().tags.length, tele4("tele-dace-04").did], [2, undefined], "so its tag comes off the deal");
  same(T.stateOf(tele4("tele-dace-04"), doc4.rounds[0]), "stopped", "and it was stopped");
  // The satchel's clock drops two sizes past d2, and it's lost. A late win puts it back.
  ok4({ o: "round", id: "round-sc-002", tele: [{ ...dace, id: "tele-bag-002", at: { k: "stake", ref: "stake-bag-04" }, fx: { by: 2 } }] }, gm, "round 2, one at the satchel's clock");
  same(doc4.scene.stakes[1].clock, 2, "the satchel's clock was on d2 after round 1");
  now = 8000;
  ok4({ o: "end", round: "round-sc-002" }, gm, "round 2 ends");
  same([doc4.scene.stakes[1].out, tele4("tele-bag-002").did], ["lost", { from: 2, to: 0, out: "lost" }], "it drops past d2 and the satchel's lost");
  ok4({ o: "answer", id: "tele-bag-002", ch: "bram", a: { act: "Fight", steps: 4, dice: [{ size: 8, total: 8 }], opp: 2, t: 7900 } }, sam, "Bram's answer from the round turns up late, and it won", { phoneNow: 8050 });
  same([doc4.scene.stakes[1].out, doc4.scene.stakes[1].clock], ["lost", 0], "but its clock was on d2 with nobody working it, so the end of the round loses it anyway");
  // Settled, or gone: there's nothing for one to do.
  ok4({ o: "put", el: { ...deal(), tags: deal().tags.map((g) => ({ ...g, gone: 1 })), out: "won" } }, gm, "the crew wins the deal");
  same(T.apply(doc4, { o: "add", tele: { ...dace, id: "tele-late-03" } }, gm, roster, now).why, "That telegraph didn’t go out. The deal’s settled already, so there’s nothing for it to do.", "one at a stake that's won doesn't go out");
  // A GM's edit to the stake keeps whose tag it is.
  ok4({ o: "put", el: { id: "stake-cupb-03", t: "stake", name: "The cupboard", c: 2, tags: ["Locked"] } }, gm, "the changing-room cupboard");
  ok4({ o: "round", id: "round-sc-003", tele: [{ ...runner, id: "tele-run-003", at: { k: "event", ref: "event-clock4" }, fx: { by: 2 } }, { ...dace, id: "tele-tag-003", at: { k: "stake", ref: "stake-cupb-03" }, fx: { tag: "Behind the towels" } }] }, gm, "round 3");
  now = 9000;
  ok4({ o: "end", round: "round-sc-003" }, gm, "round 3 ends");
  same([clock4().out, T.findTele(doc4, "tele-run-003").t.did], ["done", { from: 2, to: 0, out: "done" }], "the runner's drops the scene clock past d2, and it's run out");
  const cupboard = () => doc4.scene.stakes.find((x) => x.id === "stake-cupb-03");
  ok4({ o: "put", el: { ...cupboard(), note: "in the changing room" } }, gm, "the GM changes the cupboard's note");
  same(cupboard().tags.find((g) => g.name === "Behind the towels")?.by, "tele-tag-003", "and the new tag still says where it came from");
  ok4({ o: "answer", id: "tele-tag-003", ch: "isolde", a: { act: "Ward", steps: 3, dice: [{ size: 6, total: 6 }], opp: 2, t: 8800 } }, lee, "Isolde's late answer stopped it", { phoneNow: 9050 });
  same(cupboard().tags.map((g) => g.name), ["Locked"], "so the tag comes off");
  same(T.viewOf(doc4, "player").rounds.flatMap((r) => r.tele).find((t) => t.id === "tele-run-003")?.did?.out, "done", "every phone sees what it did");
  T.forget(doc4, "kai");
  same(Object.keys(T.findTele(doc4, "tele-steam-4")?.t.there ?? {}), ["sam|bram", "lee|isolde"], "Kai's out of the hot room when her account goes");

  // From the independent check: late answers and rolls that cross what the
  // end of the round landed on the scene.
  const doc5 = T.blank();
  const ap5 = (op, who, extra = {}) => T.apply(doc5, op, who, roster, now, extra);
  const ok5 = (op, who, what, extra) => same(ap5(op, who, extra), { ok: true }, what);
  const vault = () => doc5.scene.stakes.find((x) => x.id === "stake-vault5");
  const cellar = () => doc5.scene.stakes.find((x) => x.id === "stake-cell05");
  ok5({ o: "put", el: { id: "stake-vault5", t: "stake", name: "The vault", c: 3, tags: ["Locked", "Barred"], clock: 4 } }, gm, "the vault, on a d4 clock");
  ok5({ o: "put", el: { id: "stake-cell05", t: "stake", name: "The cellar", c: 2, tags: ["Locked"], clock: 2 } }, gm, "the cellar, on a d2 clock");
  const guard5 = (id, ref) => ({ id, who: "The guard", does: "Locks up for the night", d: 6, at: { k: "stake", ref }, fx: { by: 1 } });
  ok5({ o: "round", id: "round-v-0001", tele: [guard5("tele-vault-5", "stake-vault5"), guard5("tele-cell-05", "stake-cell05")] }, gm, "the guard at both clocks");
  now = 10000;
  ok5({ o: "end", round: "round-v-0001" }, gm, "the round ends with nobody answering");
  same([vault().out, vault().clock], ["lost", 0], "the guard takes the vault to d2, then its clock steps past d2");
  same(cellar().out, "lost", "and the guard takes the cellar past d2 on his own");
  ok5({ o: "answer", id: "tele-vault-5", ch: "vesk", a: { act: "Sneak", steps: 3, dice: [{ size: 6, total: 6 }], opp: 2, t: 9500 } }, kai, "Vesk's answer from the round turns up late, and stops the guard at the vault", { phoneNow: 10050 });
  same([vault().out, vault().clock], ["", 2], "so the vault's only lost its usual step, and it's still on d2");
  ok5({ o: "acts", round: "round-v-0001", ch: "bram", x: { more: [], list: [{ id: "act-cell-b1", k: "work", ref: "stake-cell05", act: "Lift and carry", steps: 3, t: 9600, roll: { dice: [{ size: 6, total: 5 }], opp: 1 }, aim: "Locked" }] } }, sam, "Bram's roll at the cellar from the round turns up late too", { phoneNow: 10060 });
  same([cellar().out, T.findTele(doc5, "tele-cell-05").t.did?.none], ["won", "won"], "it counts before the guard: the cellar's the crew's, and the guard found it won");
  ok5({ o: "round", id: "round-v-0002", tele: [] }, gm, "the next round");
  same(ap5({ o: "answer", id: "tele-cell-05", ch: "isolde", a: { act: "Ward", steps: 3, dice: [{ size: 6, total: 6 }], opp: 2, t: 9700 } }, lee, { phoneNow: 10100 }).why, "Round 1’s gone by, so what landed on the cellar stands. Tell the GM.", "once the next round's on, what landed on the scene stands");
  // The faction turn as a sequence (stage 5 of notes/faction-feel-plan.md):
  // how long the downtime is, her focus that every phone follows, and an
  // agenda happening, with nothing off-screen on a player's phone even as a step.
  {
    const dt = T.blank();
    let at = 5000;
    const apt = (op, who) => T.apply(dt, op, who, roster, at++);
    same(apt({ o: "ft-start", id: "downtime-01", len: "A season" }, gm).ok, true, "a downtime starts, a season long");
    same([dt.turn.len, dt.turn.focus], ["A season", null], "its length is kept on the turn, and nothing's in focus");
    same(apt({ o: "ft-len", len: "Two weeks of rain" }, kai).why, "Only the GM can do that.", "only she changes how long it is");
    apt({ o: "ft-len", len: "Two weeks of rain" }, gm);
    const act = (id, f, what, extra = {}) => ({ id, f, name: f === "choir" ? "The Drowned Choir" : "Tarrant & Daughters", what, at: { f, name: "Raise the Glass Shelf", l: "agendas", lid: "ag-1" }, does: "Work its agenda", steps: 2, vs: { k: "die", d: [12] }, ...extra });
    apt({ o: "ft-act", a: act("act-choir-1", "choir", "agenda") }, gm);
    apt({ o: "ft-act", a: { ...act("act-tarr-01", "tarrant", "Establish"), at: { f: "tarrant", name: "A second warehouse" }, does: "Establish a second warehouse", vs: { k: "none" }, off: true } }, gm);
    same(apt({ o: "ft-focus", id: "act-choir-1" }, gm).why, "Telegraph the factions’ actions first.", "the landing waits for the telegraphs");
    apt({ o: "ft-send" }, gm);
    same(apt({ o: "ft-focus", id: "act-choir-1" }, kai).why, "Only the GM can do that.", "a player's phone follows hers, and never moves it");
    same(apt({ o: "ft-focus", id: "act-choir-1" }, gm).ok, true, "her phone moves to the Choir's action");
    same(T.viewOf(dt, "player").turn.focus, "act-choir-1", "and every player's phone has it");
    apt({ o: "ft-focus", id: "act-tarr-01" }, gm);
    same([T.viewOf(dt, "gm").turn.focus, T.viewOf(dt, "player").turn.focus], ["act-tarr-01", "act-choir-1"], "an off-screen one's hers alone: the crew stays on the last they saw");
    same(JSON.stringify(T.viewOf(dt, "player")).includes("act-tarr-01"), false, "and its id never reaches a player");
    same(apt({ o: "ft-focus", id: "act-gone-01" }, gm).why, "That action’s gone.", "a step that isn't there is turned down");
    apt({ o: "ft-focus", id: "act-choir-1" }, gm);
    apt({ o: "ft-land", id: "act-choir-1", faces: { main: [2] }, vsFaces: [1] }, gm);
    apt({ o: "ft-done", id: "act-choir-1", line: "The Glass Shelf has risen out of the bay.", hap: true }, gm);
    same(T.viewOf(dt, "player").turn.acts[0].hap, true, "its agenda happened, and every phone knows it");
    same(T.apply(dt, { o: "ft-focus", id: "end" }, gm, roster, at).ok && T.viewOf(dt, "player").turn.focus, "end", "Skip to the end: While you rested on every phone");
    same(apt({ o: "ft-end" }, gm).ok, true, "and it ends");
    // One that changes nothing is as if it never started: the next has its
    // number, and only one that counts is an age in How it came to be.
    same(dt.last?.n, 1, "the downtime that changed something is downtime 1");
    apt({ o: "ft-start", id: "downtime-02", len: "A week" }, gm);
    same(TR.ageOf(dt.turn, (i) => `d-${i}`), null, "one that changes nothing has no age in How it came to be");
    apt({ o: "ft-end" }, gm);
    apt({ o: "ft-start", id: "downtime-03", len: "A month" }, gm);
    same(dt.turn.n, 2, "so the next one's downtime 2");
    apt({ o: "ft-say", id: "said-00001", line: "The bridge is down." }, gm);
    same(TR.ageOf(dt.turn, (i) => `d2-line-${i}`), { o: "wb-age", dt: 2, len: "A month", lines: [{ id: "d2-line-0", text: "The bridge is down." }] }, "and its age is downtime 2's, a month long, with what changed");
  }
  // The table screen gets what she's just shown the crew, and never a faction's id.
  {
    const sv = T.screenOf(T.blank(), { name: "Tuesday Lair", crew: [] }, { n: 3, at: 1, items: [{ f: "fleet-id", name: "The Tithe Fleet", seal: { c: "anchor", f: "bend", d: "" }, part: "secret", title: "The Tithe Fleet’s Secret", lines: [{ label: "", text: "Bought Captains", big: true }] }] });
    same(sv.reveal, { n: 3, items: [{ name: "The Tithe Fleet", seal: { c: "anchor", f: "bend", d: "" }, part: "secret", title: "The Tithe Fleet’s Secret", lines: [{ label: "", text: "Bought Captains", big: true }] }] }, "the screen's reveal: the name, the seal and the part's words");
    same(JSON.stringify(sv).includes("fleet-id"), false, "and not the faction’s id");
    same(T.screenOf(T.blank(), null).reveal, null, "and none when she hasn't shown them anything");
  }
  // What a reveal is, worked out from what the crew had and has (reveal-rules.js).
  {
    const board = B.readable({ factions: [] });
    B.apply(board, { o: "new", f: { id: "fleet", name: "The Tithe Fleet", want: "To own the bay.", face: "Admiral Senn", secret: "Bought Captains", seal: { c: "anchor", f: "bend", d: "" }, threads: [{ id: "t1", text: "Owes us", kind: "hostile", s: "whole", to: "crew" }, { id: "t2", text: "Tarrant money", kind: "hostile", s: "whole", to: "tarrant" }] } });
    B.apply(board, { o: "new", f: { id: "tarrant", name: "Tarrant & Daughters", want: "Money." } });
    const before = B.forPlayer(board);
    B.apply(board, { o: "show", id: "fleet", p: "card", v: true });
    B.apply(board, { o: "show", id: "fleet", p: "threads", v: true });
    const after = B.forPlayer(board);
    const rv = RV.revealsOf(before, after);
    same(rv.map((x) => [x.part, x.title, x.lines.map((l) => l.text)]), [["card", "The Tithe Fleet", ["To own the bay.", "Admiral Senn"]], ["threads", "The Tithe Fleet’s threads", ["Owes us"]]], "its card, then its threads, and not its thread toward a faction the crew hasn't met");
    same(JSON.stringify(rv).includes("Bought Captains") || JSON.stringify(rv).includes("Tarrant"), false, "nothing of its Secret or of Tarrant");
    B.apply(board, { o: "show", id: "fleet", p: "threads", v: false });
    same([RV.hiddenSince(after, B.forPlayer(board)), RV.hiddenSince(before, after)], [true, false], "hiding a part again is noticed, and showing one isn't");
  }
  console.log("the live table's rules checked");
}

// 1c. The founding's rules (found-rules.js, through table-rules.js), the ones
// the server and every phone apply: the room, who's in, turns going round
// the asking, the clock, and what a player gets.
if (part("1c")) {
  const roster = [{ user: "kai", name: "Kai Tane", ch: "vesk", cname: "Vesk" }, { user: "sam", name: "Sam", ch: "bram", cname: "Bram" }, { user: "lee", name: "Lee", ch: "isolde", cname: "Isolde" }];
  const gm = { user: "mo", role: "gm", ch: null, cname: "" };
  const kai = { user: "kai", role: "player", ch: "vesk", cname: "Vesk" };
  const sam = { user: "sam", role: "player", ch: "bram", cname: "Bram" };
  const lee = { user: "lee", role: "player", ch: "isolde", cname: "Isolde" };
  const K = { kai: "kai|vesk", sam: "sam|bram", lee: "lee|isolde" };
  const MIN = 60000;
  let doc = T.blank();
  let now = 100000;
  // Every change carries its phone's own number for it, n, the way it reaches the server.
  let seq = 0;
  const ap = (op, who) => T.apply(doc, { ...op, n: ++seq }, who, roster, now);
  const ok = (op, who, what) => same(ap(op, who), { ok: true }, what);
  const why = (op, who, want, what) => same(ap(op, who).why, want, what);
  const f = () => doc.found;
  const setup = { o: "fd-open", id: "found-0001", recipe: { region: "town", era: "medieval", twist: null }, factions: 5, seed: "ash-lantern-ford", clocks: [30, 40, 40] };
  const card = (id, text, extra = {}) => ({ id, text, tags: [], dials: {}, ...extra });

  // The room: she sets it up and opens it, and the crew joins.
  why({ ...setup }, kai, "Only the GM can do that.", "a player can't open a founding");
  ok({ ...setup, who: [K.kai, K.sam, "zed|dorrie"] }, gm, "Mo opens the room with Kai and Sam in");
  same(f().who.map((w) => [w.key, w.name, w.joined]), [[K.kai, "Kai Tane", 0], [K.sam, "Sam", 0]], "they're in, in that order, and nobody who isn't playing in the campaign");
  ok({ ...setup }, gm, "opening it again, sent twice, is the same room");
  why({ ...setup, id: "found-0002" }, gm, "There’s a founding on already. End it first.", "and there's one founding at a time");
  why({ ...setup, id: "found-0003" }, gm, "There’s a founding on already. End it first.", "whatever's in it");
  now += 1000;
  ok({ o: "fd-join" }, lee, "Lee joins himself while the room's open");
  same([f().who.map((w) => w.key), f().who[2].joined], [[K.kai, K.sam, K.lee], now], "and he's in at the end, joined");
  ok({ o: "fd-in", key: K.lee, on: false }, gm, "Mo takes Lee out");
  why({ o: "fd-join" }, lee, "Your GM’s left you out of this one.", "and Lee can't put himself back");
  ok({ o: "fd-in", key: K.lee, on: true }, gm, "Mo puts him back");
  same([f().who.map((w) => w.key), f().outs], [[K.kai, K.sam, K.lee], []], "and he's in again");
  ok({ o: "fd-join" }, kai, "Kai joins");
  same(f().who.map((w) => Boolean(w.joined)), [true, false, false], "Kai's joined, and Lee's back in without having joined again");
  ok({ o: "fd-move", key: K.sam }, gm, "Mo moves Sam up, so he goes first");
  why({ o: "fd-set", factions: 9 }, sam, "Only the GM can do that.", "a player can't change the setup");
  ok({ o: "fd-set", factions: 6 }, gm, "Mo makes it six factions");
  why({ o: "fd-set", clocks: [30, 0, 40] }, gm, "That setup didn’t make sense.", "every age needs some time on its clock");
  same([f().n, f().clocks], [6, [30, 40, 40]], "the setup's as he left it");

  // The asking: a turn each, round the table.
  why({ o: "fd-start" }, kai, "Only the GM can do that.", "a player can't start it");
  ok({ o: "fd-start" }, gm, "Mo starts the asking");
  same([f().step, f().clock, f().turn], ["ask", { age: 1, left: 30 * MIN, run: now }, { key: K.sam, part: "holds", at: now }], "the first age's clock runs, and Sam's first, on what holds it together");
  why({ o: "fd-set", factions: 7 }, gm, "It’s started, so the setup stays as it is.", "the setup's fixed once it's started");
  why({ o: "fd-answer", part: "holds", pick: card("core:holds:trade", "Trade holds it together.") }, kai, "It’s not your turn.", "Kai can't answer Sam's turn");
  now += 20000;
  ok({ o: "fd-answer", part: "holds", pick: card("core:holds:trade", "Trade holds it together.", { tags: ["market"], dials: { rich: 1 } }) }, sam, "Sam answers with a card");
  same([f().asking.holds.text, f().asking.holds.byName, f().last, f().turn.key, f().turn.part], ["Trade holds it together.", "Sam", { part: "holds", key: K.sam }, K.kai, "tension"], "it's on, and Kai's next, with the tension");
  why({ o: "fd-answer", part: "runs", pick: card("core:runs:guilds", "The guilds run it.") }, kai, "That isn’t up yet.", "what's next is the tension, not who runs it");
  why({ o: "fd-answer", part: "tension", pick: card("core:tension:truce", "A truce one move from breaking.") }, kai, "Roll the d12 for the tension.", "the tension's rolled");
  why({ o: "fd-answer", part: "tension", pick: { own: true, text: "Everyone hates the bridge." } }, kai, "Roll the d12 for the tension.", "and it's off the d12, never someone's own words");
  why({ o: "fd-back", part: "holds" }, kai, "That’s not yours to take back.", "Kai can't take back Sam's answer");
  ok({ o: "fd-back", part: "holds" }, sam, "Sam takes his back, since nobody's answered after it");
  same([f().asking.holds, f().turn.key, f().turn.part, f().last], [null, K.sam, "holds", null], "and it's his turn again");
  ok({ o: "fd-answer", part: "holds", pick: { own: true, text: "  The ferry,\nand nothing else.  " } }, sam, "Sam writes his own");
  same(f().asking.holds, { own: true, text: "The ferry, and nothing else.", by: K.sam, byName: "Sam", gm: false, at: now }, "in his words, tidied");
  ok({ o: "fd-answer", part: "tension", pick: card("core:tension:truce", "A truce one move from breaking.", { tags: ["war"], dials: { tense: 1 }, roll: 8, real: true }) }, kai, "Kai rolls an 8 on real dice");
  same([f().tension.roll, f().tension.real, f().turn.key, f().turn.part], [8, true, K.lee, "runs"], "it's the truce, and Lee's on who runs it");
  why({ o: "fd-answer", part: "tension", pick: card("core:tension:outside", "An outside power buying the place up.", { roll: 7 }) }, sam, "That one’s been answered already.", "a roll that turns up late, from a phone with no signal, doesn't count");
  ok({ o: "fd-answer", part: "runs", pick: card("core:runs:council", "A council runs it, when it can agree on anything.", { tags: ["law"], dials: { ruled: -1, tense: 1 } }) }, gm, "Lee's got no phone, so Mo puts his in for him");
  same([f().asking.runs.gm, f().asking.runs.byName, f().turn.key, f().turn.part], [true, "Lee", K.sam, "notices"], "it's marked as Mo's tap, and the turns go round to Sam");
  why({ o: "fd-answer", part: "runs", pick: card("core:runs:guilds", "The guilds run it.") }, lee, "Your GM put an answer in for you already.", "Lee's own, sent late, says so");
  same(dialsOf(f()), { tense: 2, strange: 1, rich: 1, ruled: 0 }, "the dials: the truce and the council make it tense, and the council less ruled");
  now += 60000;
  ok({ o: "fd-answer", part: "notices", pick: card("core:notices:boats", "There are boats tied up on every bank.", { tags: ["river"] }) }, sam, "Sam answers the last of it");
  same([f().step, f().turn, f().clock.run, f().clock.left], ["asked", null, 0, 30 * MIN - 80000], "that's the asking done, and the clock stops with what's left of it");
  ok({ o: "fd-back", part: "notices" }, sam, "Sam takes the last one back");
  same([f().step, f().turn.part, f().clock.run], ["ask", "notices", now], "and the asking's on again, its clock running");
  ok({ o: "fd-answer", part: "notices", pick: card("core:notices:boats", "There are boats tied up on every bank.", { tags: ["river"] }) }, sam, "Sam answers it again");

  // What a player gets, and what happens after.
  const theirs = T.viewOf(doc, "player").found;
  same(Object.keys(theirs).sort(), ["asking", "at", "clock", "clocks", "fac", "id", "last", "n", "now", "olds", "out", "outs", "pool", "recipe", "seats", "seed", "step", "tension", "turn", "who"], "a player gets the room's fields and nothing else");
  same(Object.keys(theirs.who[0]).sort(), ["ch", "cname", "joined", "key", "name", "user"], "and who's in, by name");
  const hers = T.viewOf(doc, "gm").found;
  delete hers.now;
  same(hers, f(), "the GM gets all of it");
  why({ o: "fd-carry" }, kai, "Only the GM can do that.", "a player can't carry it off");
  ok({ o: "fd-carry" }, gm, "Mo carries it into Build the world");
  same(f().step, "carried", "it's on his phone now");
  const screen = JSON.stringify(T.screenOf(doc, { name: "Tuesday Lair", crew: [] }));
  same([screen.includes("found"), screen.includes("ash-lantern-ford"), screen.includes("ferry")], [false, false, false], "and the table screen never gets any of the founding");
  why({ o: "fd-back", part: "notices" }, sam, "It’s on your GM’s phone now, so what’s in stays as it is.", "and nobody can take an answer back");
  why({ o: "fd-back", part: "notices" }, gm, "It’s on your phone now, so what’s in stays as it is.", "Mo neither");
  same(T.forget(doc, "lee"), true, "Lee deletes his account");
  same([f().who.map((w) => w.key), f().asking.runs.byName, f().asking.runs.by], [[K.sam, K.kai], "Someone who’s left", ""], "he's out, and the answer Mo put in for him stays without his name");
  why({ o: "fd-end" }, sam, "Only the GM can do that.", "a player can't end it");
  ok({ o: "fd-end" }, gm, "Mo clears it off");
  same([doc.found, T.viewOf(doc, "player").found], [null, null], "and it's gone from every phone");

  // The clock running out, and someone taken out on their turn.
  doc = T.blank();
  now = 500000;
  ok({ ...setup, id: "found-0004" }, gm, "Mo opens another, with everyone in");
  same(f().who.map((w) => w.key), [K.kai, K.sam, K.lee], "everyone's in, in the order they joined the campaign");
  ok({ o: "fd-start" }, gm, "and starts it");
  ok({ o: "fd-in", key: K.kai, on: false }, gm, "Kai's had to go, so Mo takes her out on her turn");
  same([f().turn.key, f().turn.part], [K.sam, "holds"], "and it's Sam's, the one after her");
  ok({ o: "fd-in", key: K.kai, on: true }, gm, "she's back, and Mo puts her in again");
  same(f().who.map((w) => w.key), [K.sam, K.lee, K.kai], "at the end of the order");
  ok({ o: "fd-answer", part: "holds", pick: card("core:holds:faith", "Faith holds it together.", { tags: ["holy"] }) }, sam, "Sam answers");
  ok({ o: "fd-in", key: K.sam, on: false }, gm, "Mo takes Sam out, his answer standing");
  why({ o: "fd-back", part: "holds" }, sam, "Only the last answer can be taken back, and only till someone answers after it.", "so Sam can't take it back to get his turn again");
  why({ o: "fd-back", part: "holds" }, gm, "Only the last answer can be taken back, and only till someone answers after it.", "and nor can Mo, onto someone who's out");
  same([f().asking.holds.byName, f().turn.key], ["Sam", K.lee], "it's still Sam's answer, and still Lee's turn");
  ok({ o: "fd-in", key: K.sam, on: true }, gm, "Mo puts Sam back");
  same(f().who.map((w) => w.key), [K.lee, K.kai, K.sam], "at the end");
  ok({ o: "fd-clock", do: "add", m: -30 }, gm, "Mo takes the time off the clock");
  same([timeUp(f(), now), f().turn.key], [true, K.lee], "time's up, and Lee's turn is still on");
  ok({ o: "fd-answer", part: "tension", pick: card("core:tension:death", "A death no one has answered for.", { tags: ["blood"], roll: 11 }) }, lee, "Lee rolls the tension");
  same([f().out, f().turn, f().step], [true, null, "ask"], "the turn that was on finishes, and nobody's next");
  ok({ o: "fd-clock", do: "add", m: 5 }, gm, "Mo gives it five more minutes");
  same([f().out, f().turn.key, f().turn.part, f().clock.left, f().clock.run], [false, K.kai, "runs", 5 * MIN, now], "and the turns go round again, to Kai");
  same(T.leave(doc, "kai"), true, "Kai leaves the campaign");
  same([f().who.map((w) => w.key), f().turn.key, f().turn.part], [[K.lee, K.sam], K.sam, "runs"], "she's out of the founding, and her turn goes on to Sam");
  ok({ o: "fd-clock", do: "add", m: -10 }, gm, "then takes them off again");
  ok({ o: "fd-answer", part: "runs", pick: card("core:runs:priests", "The priests run it.", { tags: ["holy"] }) }, sam, "Sam answers who runs it");
  same([f().out, f().turn], [true, null], "out of time again");
  why({ o: "fd-rest", picks: {} }, sam, "Only the GM can do that.", "the rest's dealt on Mo's phone, not a player's");
  why({ o: "fd-rest", picks: {} }, gm, "Deal all of what’s left.", "and it's all of what's left");
  why({ o: "fd-rest", picks: { notices: { own: true, text: "Bells." } } }, gm, "Deal all of what’s left.", "off the tables");
  ok({ o: "fd-rest", picks: { notices: card("core:notices:pray", "Everyone stops to pray at the same hour.", { tags: ["holy"] }), runs: card("core:runs:guilds", "The guilds run it.") } }, gm, "Mo's phone deals it");
  same([f().step, f().asking.notices.deal, f().asking.runs.text, f().clock.run], ["asked", true, "The priests run it.", 0], "the asking's done, the last one dealt and Sam's left as he said it");
  why({ o: "fd-clock", do: "run" }, gm, "The clock only runs while an age is on.", "and the clock waits for the ground");

  // The ground (stage 11): a fresh founding with all three in, the asking
  // answered a turn each, then her phone asks, the server rolls a d6 for
  // every seat, and the turns go round again, a die each.
  doc = T.blank();
  now = 900000;
  const aps = (op, who) => T.apply(doc, { ...op, n: ++seq }, who, roster, now, { server: true });
  const oks = (op, who, what) => same(aps(op, who), { ok: true }, what);
  const whys = (op, who, want, what) => same(aps(op, who).why, want, what);
  const said = (a, b, me) => foundNews(a, b, { me, gmName: "Mo" });
  const seatCard = (id, text, role = "passage", extra = {}) => ({ id, text, notice: `What a stranger notices at ${text}.`, role, tags: [], ...extra });
  ok({ ...setup, id: "found-0006", factions: 6 }, gm, "Mo opens a third, with six factions");
  ok({ o: "fd-start" }, gm, "and starts it");
  ok({ o: "fd-answer", part: "holds", pick: card("core:holds:trade", "Trade holds it together.") }, kai, "Kai answers what holds it together");
  ok({ o: "fd-answer", part: "tension", pick: card("core:tension:truce", "A truce one move from breaking.", { roll: 8 }) }, sam, "Sam rolls the tension");
  ok({ o: "fd-answer", part: "runs", pick: card("core:runs:guilds", "The guilds run it.") }, lee, "Lee says who runs it");
  ok({ o: "fd-answer", part: "notices", pick: card("core:notices:boats", "There are boats tied up on every bank.") }, kai, "and Kai what a stranger notices");
  same(f().step, "asked", "that's the asking done");
  whys({ o: "fd-ground" }, sam, "Only the GM can do that.", "a player can't roll the ground");
  const phone = structuredClone(doc);
  same(T.apply(phone, { o: "fd-ground", n: 999 }, gm, roster, now), { ok: true }, "on Mo's phone, the ground's tried first");
  same([phone.found.step, phone.found.pool], ["ground", []], "and it waits there for the server's dice");
  now += 1000;
  oks({ o: "fd-ground" }, gm, "the server rolls the ground's dice");
  same([f().step, f().pool.length, f().pool.every((x) => Number.isInteger(x) && x >= 1 && x <= 6), f().seats.length, f().clock.run], ["ground", 8, true, 8, now], "a d6 for each of the six factions and two more seats, and the first age's clock runs on");
  same([f().turn.key, f().turn.part], [K.sam, "seat"], "the turns go on from whoever answered last: Sam's after Kai");
  oks({ o: "fd-ground" }, gm, "rolling it again, sent twice, is the same ground");
  const pool = [...f().pool];
  whys({ o: "fd-answer", part: "seat", die: 0, pick: seatCard("medieval:seat:bridge", "The Old Bridge") }, kai, "It’s not your turn.", "Kai can't take Sam's die");
  whys({ o: "fd-answer", part: "seat", die: 9, pick: seatCard("medieval:seat:bridge", "The Old Bridge") }, sam, "That die didn’t make sense.", "a die that isn't in the pool");
  whys({ o: "fd-answer", part: "seat", die: 0, pick: { own: true, text: "The Mud", role: "land" } }, sam, "That seat didn’t make sense.", "a seat in his own words needs what a stranger notices too");
  oks({ o: "fd-answer", part: "seat", die: 0, pick: seatCard("medieval:seat:bridge", "The Old Bridge") }, sam, "Sam takes the first die and keeps the Old Bridge");
  same([f().seats[0].text, f().seats[0].by, f().last, f().turn.key], ["The Old Bridge", K.sam, { part: "seat", key: K.sam, k: 0 }, K.lee], "it's his, and Lee's next");
  whys({ o: "fd-answer", part: "seat", die: 0, pick: seatCard("medieval:seat:ford", "Hob's Ford") }, lee, "Someone’s taken that die.", "a die that's gone is gone");
  whys({ o: "fd-answer", part: "seat", die: 1, pick: seatCard("medieval:seat:bridge", "The Old Bridge") }, lee, "That seat’s in the ground already.", "and a seat's in the ground once");
  oks({ o: "fd-answer", part: "seat", die: 3, pick: { own: true, text: "  The Drowned\nChapel ", notice: "Candles in every window, and nobody inside.", role: "belief" } }, lee, "Lee writes his own for the fourth die");
  same(f().seats[3], { own: true, text: "The Drowned Chapel", notice: "Candles in every window, and nobody inside.", role: "belief", by: K.lee, byName: "Lee", gm: false, at: now }, "in his words, tidied");
  oks({ o: "fd-back", part: "seat", die: 3 }, lee, "he takes it back");
  same([f().seats[3], f().turn.key], [null, K.lee], "and the die's back in the pool, on his turn");
  oks({ o: "fd-answer", part: "seat", die: 3, pick: seatCard("medieval:seat:friary", "The Friary", "belief") }, gm, "Mo taps one in for him");
  same([f().seats[3].gm, f().turn.key], [true, K.kai], "marked as Mo's, and it's Kai's turn");
  whys({ o: "fd-back", part: "seat", die: 0 }, sam, "Only the last answer can be taken back, and only till someone answers after it.", "Sam's seat stays, now Lee's is after it");
  oks({ o: "fd-clock", do: "add", m: -60 }, gm, "Mo takes the clock to nothing");
  oks({ o: "fd-answer", part: "seat", die: 5, pick: seatCard("medieval:seat:quay", "The Quay") }, kai, "Kai's turn finishes");
  same([f().out, f().turn, f().step], [true, null, "ground"], "and the rest of the ground's dealt on Mo's phone");
  const rest = { 1: seatCard("medieval:seat:mill", "The Mill Meadows", "land"), 2: seatCard("medieval:seat:quarry", "Ravel Quarry", "ground"), 4: seatCard("medieval:seat:inn", "The Bell Inn"), 6: seatCard("medieval:seat:pans", "The Salt Pans", "ground") };
  whys({ o: "fd-rest", seats: rest }, gm, "Deal all of what’s left.", "every die that's left");
  whys({ o: "fd-rest", seats: { ...rest, 7: seatCard("medieval:seat:quay", "The Quay") } }, gm, "Deal all of what’s left.", "and none of them in the ground already");
  oks({ o: "fd-rest", seats: { ...rest, 7: seatCard("medieval:seat:gate", "The West Gate") } }, gm, "Mo's phone deals them");
  same([f().step, f().seats.every(Boolean), f().seats[7].deal, f().clock.run, f().pool], ["grounded", true, true, 0, pool], "that's the ground, its clock stopped and its dice as they fell");

  // The founding: her old powers, then the founders in reverse order.
  const row = (id, text, extra = {}) => ({ id, text, tags: [], ...extra });
  const res = [row("medieval:res:rents", "Town Rents", { role: "land" }), row("medieval:res:tolls", "Bridge Tolls", { role: "passage" })];
  const assets = [row("medieval:asset:guard", "Household Guard", { role: "household-guard", power: true, does: "+1 Power. Armed servants." })];
  const oldCard = (seat, size = { size: "city", die: 8 }) => ({ seat, size, type: row("core:type:house", "A noble house", { role: "house" }), method: row("core:method:money", "money"), want: row("core:want:more", "More."), name: row("medieval:name:vane", "The Vane Estate"), res, assets });
  const local = { size: "local", die: 4 };
  const wanting = (pick) => ({ ...pick, with: { res, assets, agenda: row("core:agenda:seat", "Take {seat}", { die: 4, aims: ["seat"], at: { seat: 0 } }) } });
  whys({ o: "fd-age" }, kai, "Only the GM can do that.", "a player can't start the founding");
  oks({ o: "fd-age" }, gm, "Mo starts the founding");
  same([f().step, f().olds, f().fac.map((x) => (x.old ? "old" : x.key)), f().clock], ["found", 3, ["old", "old", "old", K.lee, K.sam, K.kai], { age: 2, left: 40 * MIN, run: now }], "three old powers (six factions less his three players), then the founders the other way round, on the founding's clock");
  same(f().turn, { key: "", part: "old", i: 0, at: now }, "his old powers are first");
  whys({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0) }, kai, "That’s your GM’s to deal.", "a player can't deal an old power");
  whys({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0, { size: "local", die: 4 }) }, gm, "That card didn’t make sense.", "an old power's City or Great");
  whys({ o: "fd-answer", part: "old", i: 0, pick: { ...oldCard(0), res: [] } }, gm, "That card didn’t make sense.", "and it comes with its resources");
  oks({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0) }, gm, "Mo deals the first on the Old Bridge");
  whys({ o: "fd-answer", part: "old", i: 1, pick: oldCard(0) }, gm, "That card didn’t make sense.", "and nobody else can sit there");
  oks({ o: "fd-answer", part: "old", i: 1, pick: oldCard(1, { size: "great", die: 12 }) }, gm, "the second, on the Mill Meadows");
  oks({ o: "fd-back", part: "old", i: 1 }, gm, "he takes the second back");
  same([f().fac[1].card, f().turn.part, f().turn.i], [null, "old", 1], "and it's up again");
  oks({ o: "fd-answer", part: "old", i: 1, pick: oldCard(1, { size: "great", die: 12 }) }, gm, "puts it back in");
  oks({ o: "fd-answer", part: "old", i: 2, pick: oldCard(2) }, gm, "and the third, on Ravel Quarry");
  same([f().turn.key, f().turn.part, f().turn.i], [K.lee, "f-seat", 3], "then Lee founds first, the last in the order");
  whys({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 0, size: local } }, lee, "That seat’s taken, or it isn’t one.", "not on an old power's seat");
  whys({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 4, size: local } }, sam, "It’s not your turn.", "and not on Sam's say");
  whys({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 4, size: { size: "city", die: 8 } } }, lee, "That seat’s taken, or it isn’t one.", "a founder starts Local");
  oks({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 4, size: local } }, lee, "Lee founds his on the Bell Inn");
  same([f().turn.part, f().turn.i, f().turn.key], ["before", 3, K.lee], "and it's his still, on who had it before");
  whys({ o: "fd-answer", part: "before", i: 3, pick: { j: 4, ...row("core:fd-before:took", "{b} took {seat} off us") } }, lee, "That answer didn’t make sense.", "only a faction on the board can have had it");
  oks({ o: "fd-answer", part: "before", i: 3, pick: { j: 0, ...row("core:fd-before:took", "{b} took {seat} off us") } }, lee, "the Vane Estate had it");
  whys({ o: "fd-answer", part: "owes", i: 3, pick: row("core:fd-owes:money", "We owe {b} the money we started with") }, lee, "That answer didn’t make sense.", "he owes somebody");
  oks({ o: "fd-answer", part: "owes", i: 3, pick: { j: 1, own: true, text: "We owe {b} a {wagon} of salt" } }, lee, "he owes the second old power, in his own words");
  same(f().fac[3].picks.owes.text, "We owe b a wagon of salt", "with nothing in it the tables would read as a slot");
  oks({ o: "fd-answer", part: "never", i: 3, pick: row("core:fd-never:behind", "We never leave one of ours behind") }, lee, "what they'll never do");
  oks({ o: "fd-answer", part: "type", i: 3, pick: row("medieval:type:ferry", "Ferrymen, father to son", { role: "traders" }) }, lee, "what they are");
  oks({ o: "fd-back", part: "type", i: 3 }, lee, "he takes that back");
  oks({ o: "fd-back", part: "never", i: 3 }, lee, "and the one before it, since they're both his");
  same([f().fac[3].picks.never, f().turn.part], [undefined, "never"], "back to what they'll never do");
  for (const [part, pick] of [["never", row("core:fd-never:behind", "We never leave one of ours behind")], ["type", row("medieval:type:ferry", "Ferrymen, father to son", { role: "traders" })], ["method", row("core:method:trade", "trade")]]) ok({ o: "fd-answer", part, i: 3, pick }, lee, `Lee answers ${part}`);
  why({ o: "fd-answer", part: "want", i: 3, pick: row("core:want:respect", "Respect.") }, lee, "That answer didn’t make sense.", "a Want comes up with what's dealt with it");
  why({ o: "fd-answer", part: "want", i: 3, pick: { ...wanting(row("core:want:respect", "Respect.")), with: { res, assets, agenda: row("core:agenda:seat", "Take {seat}", { die: 8, aims: ["seat"], at: { seat: 0 } }) } } }, lee, "That answer didn’t make sense.", "and its agenda starts at d4");
  ok({ o: "fd-answer", part: "want", i: 3, pick: wanting(row("core:want:respect", "Respect.")) }, lee, "Lee answers want, its resources, people and agenda with it");
  same([f().fac[3].picks.want.with.res.length, f().fac[3].picks.want.with.agenda.die, f().fac[3].picks["f-seat"].size], [2, 4, local], "what's dealt with a card is kept in the room");
  ok({ o: "fd-answer", part: "name", i: 3, pick: row("medieval:name:coyle", "Coyle's Barges") }, lee, "Lee answers name");
  same([f().turn.key, f().turn.part, f().turn.i], [K.sam, "f-seat", 4], "his faction's founded, and Sam's next");
  ok({ o: "fd-answer", part: "f-seat", i: 4, pick: { k: 5, size: local } }, sam, "Sam founds on the Quay");
  ok({ o: "fd-answer", part: "before", i: 4, pick: { j: null } }, sam, "nobody had it before");
  ok({ o: "fd-in", key: K.sam, on: false }, gm, "Sam's had to go, so Mo takes him out mid-turn");
  same([f().turn.key, f().turn.i, f().turn.part], [K.kai, 5, "f-seat"], "Kai founds next, and Sam's faction waits for him");
  same(f().fac[4].picks.before.j, null, "what Sam answered stands");
  same(T.leave(doc, "kai"), true, "Kai leaves the campaign");
  same([f().turn, f().out], [null, true], "and with nobody left in to take what's left, Mo's phone deals the rest");
  const dealtPicks = (seat) => ({ "f-seat": { k: seat, size: local }, before: { j: null }, owes: { j: 0, ...row("core:fd-owes:money", "We owe {b} the money we started with") }, never: row("core:fd-never:hungry", "We'll never let one of ours go hungry"), type: row("medieval:type:smiths", "Smiths", { role: "makers" }), method: row("core:method:craft", "craft"), want: wanting(row("core:want:more", "More.")), name: row("medieval:name:hammermen", "The Hammermen") });
  const samRest = Object.fromEntries(Object.entries(dealtPicks(5)).filter(([p]) => !["f-seat", "before"].includes(p)));
  whys({ o: "fd-rest", fac: { 4: { picks: samRest }, 5: { picks: { ...dealtPicks(5) } } } }, gm, "Deal all of what’s left.", "Kai's can't sit on Sam's seat");
  oks({ o: "fd-rest", fac: { 4: { picks: samRest }, 5: { picks: dealtPicks(6) } } }, gm, "Mo's phone deals what's left of both");
  same([f().step, f().fac.every((x) => (x.old ? x.card : Object.keys(x.picks).length === 8)), f().fac[5].picks.name.deal, f().clock.run], ["founded", true, true, 0], "that's the founding, every faction whole and its clock stopped");
  const theirs2 = T.viewOf(doc, "player").found;
  same([theirs2.fac.length, theirs2.fac[0].card.name.text, theirs2.fac[3].picks.owes.text, theirs2.pool, theirs2.seats[0].text], [6, "The Vane Estate", "We owe b a wagon of salt", pool, "The Old Bridge"], "a player gets the ground and the founding, all of it built in the open");
  same(said({ ...f(), step: "found" }, f(), K.lee).lines, ["That’s the founding done."], "and the founding done says so");
  same(said({ ...f(), step: "grounded", turn: null }, { ...f(), step: "found", turn: { key: K.lee, part: "f-seat", i: 3 } }, K.lee), { lines: ["Mo’s started the founding’s second age.", "Your turn: found your faction."], buzz: true }, "his turn to found one buzzes his phone");
  same(said({ ...f(), step: "asked" }, { ...f(), step: "ground", turn: { key: K.lee, part: "seat" } }, K.lee), { lines: ["Mo’s rolled the ground’s dice.", "Your turn: take a die for a seat."], buzz: true }, "and so does his turn for a die");
  ok({ o: "fd-carry" }, gm, "Mo takes it into Build the world");
  same(f().step, "carried", "it's on his phone now");
  same(shapeOf({ n: 12, who: Array.from({ length: 12 }, (_, k) => ({ key: `p${k}` })), pool: Array.from({ length: 14 }) }), { olds: 1, founders: 11 }, "twelve players: there's always an old power, so eleven found one");
  same(shapeOf({ n: 4, who: [{ key: "a" }, { key: "b" }], pool: Array.from({ length: 6 }) }), { olds: 2, founders: 2 }, "and two players at four factions face two old powers");

  // What's new, said for whoever's holding the phone.
  const news = (a, b, me, gm = false) => foundNews(a, b, { gm, me, gmName: "Mo" });
  const room = { id: "found-0005", step: "room", who: [{ key: K.kai, joined: 0 }], out: false, turn: null };
  same(news(null, room, K.kai), { lines: ["Mo’s opened the founding. Join it on the World tab."], buzz: true }, "the room opening buzzes the crew's phones");
  same(news(null, room, K.sam).lines, [], "and says nothing to someone who isn't in it");
  const asking = { ...room, step: "ask", turn: { key: K.kai, part: "tension" } };
  same(news(room, asking, K.kai), { lines: ["The founding’s started.", "Your turn: roll the d12 for what’s pulling it apart."], buzz: true }, "her turn buzzes her phone");
  same(news(asking, { ...asking, turn: null, out: true }, null, true).lines, ["Time’s up, so the rest of the asking’s dealt."], "time's up, on Mo's phone");
  same(news(asking, null, K.kai).lines, ["Mo’s ended the founding."], "and ending it says so");
  console.log("the founding's rules checked");
}

// 1d. The dice roller's rules (roller-rules.js), read off the book's own
// examples in The Roll and When It Lands.
if (part("1d")) {
  const dice = (list) => list.map(([size, v]) => ({ size, v }));
  // Vesk lets two blows ride: her Defend's a d4 and comes up 3, against a d8
  // on 6 and a d6 on 3. The tie's hers, so the d6 is stopped.
  const vesk = readDice({ mine: dice([[4, 3]]), theirs: dice([[8, 6], [6, 3]]), def: "you" });
  same([vesk.way, vesk.lanes.map((l) => l.out), vesk.stopped, vesk.through, vesk.lanes[1].i], ["defend", ["through", "stopped"], 1, 1, 0], "Vesk's 3 stops the d6's 3 and the d8 gets through");
  // Bram Defends: 6, 3 and 1 on his d6, d6 and d2, against three d8s on 7, 5
  // and 2. The 6 goes on the 5 and the 3 on the 2, so only the 7 gets through.
  const bram = readDice({ mine: dice([[6, 6], [6, 3], [2, 1]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you" });
  same([bram.assign, bram.lanes.map((l) => l.out), bram.stopped, bram.tops], [[2, 0, 1], ["through", "stopped", "stopped"], 2, [0]], "Bram's 6 on the 5 and his 3 on the 2, with his d6's top face");
  same(bestMatch([1, 1], [4, 6]), [0, 1], "dice that stop nothing still go on what's left");
  // A swap trades the dice on two of theirs, and the roll's read that way.
  const traded = readDice({ mine: dice([[6, 6], [6, 3], [2, 1]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you", assign: swapped(bram.assign, 0, 1) });
  same([traded.assign, traded.lanes.map((l) => l.out), traded.stopped], [[0, 2, 1], ["through", "through", "stopped"], 1], "a swap puts his 6 on the 7 and his 1 on the 5");
  same(readDice({ mine: dice([[6, 6], [6, 3], [2, 1]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you", assign: [0, 0, 1] }).assign, [2, 0, 1], "a matching with a die on two of theirs is put right");
  same(readDice({ mine: dice([[6, 2]]), theirs: dice([[8, 7], [8, 5]]), def: "you", assign: [0, 3] }).assign, [-1, 0], "and so is one with a die that isn't there, its 2 going on the lower of theirs");
  const spare = readDice({ mine: dice([[6, 6], [4, 2], [6, 5]]), theirs: dice([[8, 4]]), def: "you" });
  same([spare.assign, spare.spare, spare.stopped], [[2], [0, 1], 1], "more dice than blows: the 5 stops the 4 and the rest aren't needed");
  // Bram and Wren's three dice on the guard captain, against his one roll
  // of 4: the 5 beats it, the 2's under and the 4's a tie, his unless they
  // pay 1 Aura.
  const captain = readDice({ mine: dice([[6, 5], [4, 2], [6, 4]]), theirs: dice([[6, 4]]) });
  same([captain.way, captain.outs, captain.beat, captain.ties, captain.stands], ["act", ["beat", "under", "tie"], 1, 1, 4], "three dice on the captain's one roll");
  // A Layered vault door rolls 3d8 and keeps the best.
  const door = readDice({ mine: dice([[10, 7], [12, 8]]), theirs: dice([[8, 3], [8, 7], [8, 5]]) });
  same([door.at, door.stands, door.outs], [1, 7, ["tie", "beat"]], "the vault door's best d8 stands against both");
  same(readDice({ mine: dice([[10, 7], [12, 8]]), theirs: dice([[8, 3], [8, 7]]), each: true }).way, "act", "two dice of yours are always one thing's");
  // Ash's burst: her d6 comes up 5, once, and each man in it rolls his own d6.
  const burst = readDice({ mine: dice([[6, 5]]), theirs: dice([[6, 2], [6, 4], [6, 6], [6, 1], [6, 5]]), each: true });
  same([burst.way, burst.lanes.map((l) => l.out), burst.beat, burst.ties], ["each", ["beat", "beat", "under", "beat", "tie"], 3, 1], "Ash's 5 against five men, each on his own");
  same(readDice({ mine: dice([[6, 5]]), theirs: dice([[6, 2], [6, 6]]) }).outs, ["under"], "one thing rolling two dice: its 6 stands");
  same(readDice({ mine: dice([[6, 5]]), theirs: dice([[6, 2]]), each: true }).way, "act", "one of theirs is one thing");
  // One side only: nothing to beat, so it's the numbers, added up for a Move.
  same(readDice({ mine: dice([[6, 4], [4, 3]]) }), { way: "free", tops: [], total: 7 }, "a Move's d6 and d4 add up");
  same(readDice({ theirs: dice([[6, 6]]) }).tops, [], "their top face gives nobody Aura");
  same(readDice({ mine: dice([[4, 4], [8, 8]]), theirs: dice([[8, 8]]), def: "you" }).tops, [0, 1], "your top faces, whoever's defending");
  // Several actions in one throw (Mo's 14 Nov ask, notes/stacking-plan.md):
  // readLanes() reads each one on its own the way readDice() does, and adds
  // the Aura up across them, 1 for every die of yours that wins and 1 for
  // every top face, win or lose (The Core, #s-aura).
  const plain = ({ won, aura, ...x }) => x;
  // Splitting at the study door (The Core): Vesk's one roll is four dice at
  // three things, a d12 and a d4 at the lock's d8 (to open it, and to leave
  // it without a scratch), a d6 to keep it quiet against the guard's 3 (the
  // book gives only his roll, so a d6 here) and a d4 at the quiet house, a
  // d2. Three won, and the 6 was a top face as well, so that's 4 Aura.
  const study = readLanes([
    { mine: dice([[12, 7], [4, 2]]), theirs: dice([[8, 5]]), def: "them" },
    { mine: dice([[6, 6]]), theirs: dice([[6, 3]]), def: "them" },
    { mine: dice([[4, 3]]), theirs: dice([[2, 1]]), def: "them" },
  ]);
  same([study.lanes.map((x) => x.outs), study.wins, study.tops, study.aura], [[["beat", "under"], ["beat"], ["beat"]], 3, 1, 4], "the study door: four dice at three things, three won and the 6 a top face, so 4 Aura");
  // Mo's own: his d12 and d8 at the brute's d10, his d6 at the archer's d4,
  // and a d8 coming at him that his Stamina's d12 rolls against.
  const mo = [
    { mine: dice([[12, 9], [8, 3]]), theirs: dice([[10, 6]]), def: "them" },
    { mine: dice([[6, 6]]), theirs: dice([[4, 3]]), def: "them" },
    { mine: dice([[12, 5]]), theirs: dice([[8, 5]]), def: "you" },
  ];
  const thrown = readLanes(mo);
  mo.forEach((lane, i) => same(plain(thrown.lanes[i] ?? {}), readDice(lane), `Mo's action ${i + 1} read just as it would be on its own`));
  same([thrown.lanes.map((x) => x.won), thrown.wins, thrown.stops, thrown.tops, thrown.aura], [[1, 1, 1], 3, 1, 1, 4], "the 9 beats the brute, the 6 beats the archer on its top face and the 5 stops the 5, since a tie's yours when it's coming at you: 4 Aura");
  const flipped = readLanes(mo.map((lane, i) => (i === 2 ? { ...lane, def: "them" } : lane)));
  same([flipped.lanes[2]?.outs, flipped.wins, flipped.aura], [["tie"], 2, 3], "read the other way, his 5 only ties their 5, theirs unless he pays, and it pays nothing");
  // A swap in one action leaves the others as they were.
  const swapIn = readLanes([{ mine: dice([[6, 6], [6, 3], [2, 1]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you", assign: swapped(bram.assign, 0, 1) }, mo[1]]);
  same([swapIn.lanes[0]?.assign, swapIn.lanes[0]?.stopped, swapIn.lanes[1]?.outs, swapIn.aura], [[0, 2, 1], 1, ["beat"], 4], "a swap in Bram's action, and the archer's still beaten");
  // When It Lands: Bram's four dice for three blows, his Stamina's 9 with
  // them. All three are stopped and the 6 is a d6's top face, so 4 Aura.
  const landed = readLanes([{ mine: dice([[6, 6], [6, 3], [10, 8], [12, 9]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you" }]);
  same([landed.lanes[0]?.stopped, landed.lanes[0]?.spare, landed.wins, landed.stops, landed.tops, landed.aura], [3, [3], 3, 3, 1, 4], "Bram stops all three blows with a die to spare: three won and a top face, 4 Aura");
  // A die that beats three men at once still pays once (Ash's burst), and a
  // tie pays nothing (the guard captain's: Bram's three d12s come up 9, 4
  // and 6 against his 6).
  same(readLanes([{ mine: dice([[6, 5]]), theirs: dice([[6, 2], [6, 4], [6, 6], [6, 1], [6, 5]]), each: true }]).aura, 1, "Ash's 5 beats three men and pays once");
  same(readLanes([{ mine: dice([[12, 9], [12, 4], [12, 6]]), theirs: dice([[10, 6]]) }]).aura, 1, "the captain's tie pays nothing, so one die won is 1 Aura");
  // With nothing to beat, a top face of yours still pays, and theirs never does.
  same([readLanes([{ mine: dice([[6, 4], [4, 4]]) }]).aura, readLanes([{ theirs: dice([[8, 8]]) }]).aura], [1, 0], "a Move's top face pays, and theirs gives nobody Aura");
  same(readLanes([]), { lanes: [], wins: 0, stops: 0, tops: 0, aura: 0, hits: 0 }, "nothing thrown pays nothing");
  // On the new core every die of theirs that gets through is a hit, or more
  // for a deadly threat: Bram's three blows with one stopped are 2 hits, and
  // the same from a deadly threat at 2 hits each is 4.
  same([readDice({ mine: dice([[6, 6]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you" }).hits, readDice({ mine: dice([[6, 6]]), theirs: dice([[8, 7], [8, 5], [8, 2]]), def: "you", hits: 2 }).hits], [2, 4], "what gets through as hits, and a deadly threat's 2 each");
  same(readLanes([{ mine: dice([[6, 1]]), theirs: dice([[8, 7]]), def: "you", hits: 3 }, { mine: dice([[6, 6]]), theirs: dice([[4, 2]]) }]).hits, 3, "hits added up across a throw, and none from going at them");
  // What's kept on the phone: the actions, each with its dice and its way.
  same(setupOf(null), { acts: [{ you: [], them: [], def: "you", each: false, hits: 1 }] }, "nothing kept starts as one action with no dice on, them coming at you");
  same(setupOf({ you: [6, 7, "8", 20, 2], them: Array(20).fill(4), def: "them", each: "yes" }), { acts: [{ you: [6, 8, 2], them: Array(MOST).fill(4), def: "them", each: false, hits: 1 }] }, "a set-up kept before there were actions comes back as one, with only real dice, up to the most a side holds");
  same(setupOf({ def: "sideways" }).acts[0].def, "you", "a way that isn't one comes back as them coming at you");
  same(setupOf({ acts: [{ you: [12, 8], them: [10], def: "them" }, { you: [6], them: [4], def: "them", each: true }, { you: [12], them: [8] }] }).acts, [{ you: [12, 8], them: [10], def: "them", each: false, hits: 1 }, { you: [6], them: [4], def: "them", each: true, hits: 1 }, { you: [12], them: [8], def: "you", each: false, hits: 1 }], "Mo's three actions kept, each with its own way");
  same(setupOf({ acts: [{ you: [], them: [], def: "them" }, null, "d6", [6], { you: [6], them: [4], def: "them" }] }).acts, [{ you: [6], them: [4], def: "them", each: false, hits: 1 }], "an action with no dice is dropped beside one with some, and so is anything that isn't an action");
  same(setupOf({ acts: [{ def: "them" }] }).acts, [{ you: [], them: [], def: "them", each: false, hits: 1 }], "a lone action with no dice keeps its way");
  same(setupOf({ acts: Array(20).fill({ you: [6], them: [4] }) }).acts.length, ACTIONS, "up to the most actions a throw holds");
  same(setupOf({ acts: [{ you: [12], them: [8], hits: 3 }, { you: [6], them: [4], hits: 40 }] }).acts.map((x) => x.hits), [3, 9], "hits kept, as many as a die can be");
  same(setupOf({ acts: [] }), setupOf(null), "no actions kept starts as one");
  console.log("the dice roller's rules checked");
}

// 1e. The crew and the character on the new core (notes/core-plan.md) and
// the 17 Nov fixes (notes/fixes-plan.md). Each number here is written down
// from the chapter's words rather than worked out by the code: their Roots,
// their 35 points, their items, and the rolls the book counts for them. Then
// soak, Resources, vessels and saves from before coming across. None of it
// needs a browser.
if (part("1e")) {
  const looks = (s) => String(s ?? "").replace(/[’‘]/g, "'").trim().toLowerCase();
  const tryIt = (what, fn) => {
    try {
      fn();
    } catch (e) {
      note(`${what} threw: ${e.message}`);
    }
  };
  const sheets = Object.fromEntries(book.crew.map((c) => [c.id, c]));
  const sheet = (id, grown = []) => rootsSheet(sheets[id], grown, BUILD);
  const full = (x) => ({ Body: x.Body ?? 0, Mind: x.Mind ?? 0, Soul: x.Soul ?? 0 });
  // The crew on the new core (notes/core-plan.md): each Title's 5 spread the
  // way its 3 were on stacking, everything else as it was on 35 points, Aura
  // 5, and each awakening locking a point of the Root in its brackets.
  const PLAN = {
    vesk: { Body: 11, Mind: 5, Soul: 0 },
    bram: { Body: 9, Mind: 3, Soul: 4 },
    dorrie: { Body: 3, Mind: 7, Soul: 6 },
    isolde: { Body: 0, Mind: 9, Soul: 7 },
    wren: { Body: 8, Mind: 8, Soul: 0 },
    ash: { Body: 0, Mind: 5, Soul: 11 },
  };
  const SPREADS = {
    vesk: [{ Body: 5 }, { Mind: 3, Body: 2 }],
    bram: [{ Body: 5 }, { Soul: 3, Mind: 2 }],
    dorrie: [{ Soul: 5 }, { Mind: 3, Body: 2 }],
    isolde: [{ Soul: 5 }, { Mind: 5 }],
    wren: [{ Mind: 5 }, { Body: 5 }],
    ash: [{ Soul: 5 }, { Mind: 3, Soul: 2 }],
  };
  // How they were spread on stacking, which toFive() has to make the plan's.
  const STACKED = {
    vesk: [{ Body: 3 }, { Mind: 2, Body: 1 }],
    bram: [{ Body: 3 }, { Soul: 2, Mind: 1 }],
    dorrie: [{ Soul: 3 }, { Mind: 2, Body: 1 }],
    isolde: [{ Soul: 3 }, { Mind: 3 }],
    wren: [{ Mind: 3 }, { Body: 3 }],
    ash: [{ Soul: 3 }, { Mind: 2, Soul: 1 }],
  };
  // How many items each has, the attuned thing among them (prompt 2 of
  // notes/fixes-plan.md).
  const ITEMS = { vesk: 5, bram: 4, dorrie: 4, isolde: 4, wren: 4, ash: 4 };
  const LOCKS = {
    vesk: { Body: 1 }, bram: { Body: 2 }, dorrie: { Mind: 1 }, isolde: { Soul: 1 }, wren: { Body: 2 }, ash: { Soul: 1 },
  };
  const HAVE = {
    vesk: [["Shadow", ["Push"]], ["Shadow", ["Vanish"]]],
    bram: [["Guardian", ["Push", "Stand firm"]], ["Leader", ["Push", "Everyone gets it"]]],
    dorrie: [["Face", ["Push", "Turn them"]], ["Shadow", ["Push", "Vanish"]]],
    isolde: [["Oracle", ["Push", "Hold it"]], ["Oracle", ["Foretold"]]],
    wren: [["Hunter", ["Push"]], ["Hunter", ["Mark the pack"]]],
    ash: [["Elementalist", ["Push", "Sculpt"]], ["Face", ["Push", "Turn them"]]],
  };
  same(Object.keys(sheets).sort(), Object.keys(PLAN).sort(), "the six crew are in book.json");
  for (const [id, roots] of Object.entries(PLAN)) {
    if (!sheets[id]) continue;
    tryIt(`${id}'s sheet`, () => {
      const c = sheet(id);
      same(c.roots, roots, `${id}'s Roots`);
      same(c.titles.map((t) => t.roots), SPREADS[id].map(full), `${id}'s Titles each put 5 on the Roots, spread the plan's way`);
      same(c.titles.map((t, i) => RS.toFive(STACKED[id][i], t.permissions)), SPREADS[id].map(full), `${id}'s spreads are their stacking spreads made 5, the way a saved character's are`);
      same(c.titles.map((t) => t.permissions.length), [3, 3], `${id} has three permissions on each Title`);
      same(c.archetypes.map((a) => [a.name, a.have]), HAVE[id], `${id}'s archetypes and the abilities they've got`);
      same(c.numbers.aura, 5, `${id}'s Aura maximum is 5`);
      same(["stamina", "confidence", "resolve"].filter((k) => k in c.numbers), [], `${id} has no tracks`);
      same("specialties" in c, false, `${id} has no specialties`);
      same(c.attuned.length, 1, `${id} has one attuned thing`);
      if (c.attuned.some((a) => "aura" in a)) note(`${id}'s attuned thing still has its own way to Aura`);
      if (c.attuned[0].awakenings.some((w) => !RS.ROOTS.includes(w.root) || w.guessed)) note(`${id} has an awakening with no Root of its own on the sheet`);
      const s = RS.freshCore(c);
      same(RS.lockedOf(c, s), full(LOCKS[id]), `${id}'s awakenings lock their points`);
      same(s.pts, Object.fromEntries(RS.ROOTS.map((r) => [r, roots[r] - (LOCKS[id][r] ?? 0)])), `${id} starts with every Root full, less what's locked`);
      same([s.v, s.aura, s.toll, s.wound, s.scars], [5, 5, 0, { Body: false, Mind: false, Soul: false }, { Body: [], Mind: [], Soul: [] }], `${id} starts a scene on 5 Aura with nothing wounded, no Toll and no Scars`);
      same([s.soak, s.res, s.charge, "boxes" in s], [{}, [], {}, false], `${id} starts with all their soak, all their Resources and empty vessels`);
      same([c.items.length, c.items.filter((it) => it.attuned === 0).length, c.items.every((it) => it.tier >= 1 && it.tier <= 3 && RS.KINDS.includes(it.kind)), Boolean(c.keepsake), RS.resOf(c)], [ITEMS[id], 1, true, true, 3], `${id}'s items, the attuned one among them, a keepsake and 3 Resources`);
      same(c.titles.some((t) => "boons" in t), false, `${id} has no Boons`);
      const cost = costOf(c);
      same(cost.spent, 35, `${id}'s points`);
      same(c.points, { start: 35, spent: 35 }, `${id}'s points on the sheet`);
      same(cost.lines.reduce((t, x) => t + x.cost, 0), cost.spent, `${id}'s points, line by line`);
    });
  }
  // Mo's prices: a Title, archetype or attuned thing is 5 with its one, an
  // item 1 at tier 2 and 1 for each tier above, and everything else is 1, the
  // keepsake free.
  tryIt("Mo's prices", () => {
    const bram = costOf(sheet("bram")).lines;
    const of = (kind) => bram.filter((x) => x.kind === kind).reduce((t, x) => t + x.cost, 0);
    same(["title", "perm", "arch", "ability", "attuned", "awk", "item", "tier"].map(of), [10, 4, 10, 2, 5, 0, 3, 1], "Bram's 35: Titles 10, permissions 4, archetypes 10, abilities 2, his hammer 5 at tier 2 with its Catch's awakening free, three items 3 and his plate a tier up 1");
    same(costOf(sheet("vesk")).lines.some((x) => /coin she ever stole/.test(x.what)), false, "Vesk's keepsake is free");
    same(costOf({ archs: ["Shadow", "Shadow"], titles: [{ text: "A", perms: [{ text: "a" }, { text: "b" }, { text: "" }], boons: [] }], attuned: [{ name: "x", catch: "", awk: [{ name: "w" }, { name: "" }] }], equipment: [{ text: "a knife" }, { text: "" }], utility: [{ text: "rope" }], keepsake: { text: "a coin" }, bag: "chalk\n\n" }).spent, 5 + 1 + 10 + 5 + 1, "a build from before the fixes: its equipment's items at tier 2, and its utility and bag cost nothing");
    same(costOf({ titles: [], items: [{ name: "a sword", tier: 3 }, { name: "a pack", tier: 2, kind: "pack" }, { name: "a hook", tier: 3, attuned: 0 }, { name: "plate", tier: 4 }] }).spent, 2 + 1 + 1 + 3, "items: 1 at tier 2 and 1 a tier above, an attuned one's first point in its 5");
    same([costOf(sheet("vesk", [{ k: "boon", t: 0, lever: "Aura", name: "", on: "", drop: [1, 2] }])).spent, sheet("vesk", [{ k: "boon", t: 0, lever: "Aura", name: "", on: "", drop: [1, 2] }]).titles[0].permissions.length, sheet("vesk", [{ k: "boon", t: 0, lever: "Aura", name: "", on: "", drop: [1, 2] }]).numbers.aura], [35, 3, 5], "a Boon she swapped in downtime is gone: her permissions stay and her Aura's 5");
    same(["boonsOf", "boonCount", "restBonus", "slotsOf", "shrugs", "freeBeyond"].filter((k) => k in RS), [], "the Boon stubs are gone, with nothing left using them");
    // An archetype's abilities cost Aura, and none has a home track.
    for (const a of BUILD.archetypes) {
      if ("home" in a) note(`the ${a.name} still has a home track in book.json`);
      for (const x of a.abilities) if (!(x.cost >= 1)) note(`the ${a.name}'s ${x.name} has no price in Aura`);
    }
    same([BUILD.archetypes.find((a) => a.name === "Healer")?.trait?.name, /\bToll\b/.test(BUILD.archetypes.find((a) => a.name === "Healer")?.trait?.text ?? "")], ["Good Hands", true], "the Healer's Trait, Good Hands, eases Toll");
    same(BUILD.boons, [], "there are no Boons in book.json");
  });

  // Coin and Kit: every awakening locks a Root, one thing eases Toll and one
  // adds a flat bonus to heals, and every one's an item with a kind and tier.
  tryIt("Coin and Kit", () => {
    same(BUILD.things.length, 20, "twenty attuned things in Coin and Kit");
    for (const t of BUILD.things) if (!RS.KINDS.includes(t.kind) || !(t.tier >= 3 && t.tier <= 6)) note(`${t.name} in Coin and Kit hasn't got a kind and a tier from 3 to 6`);
    if (!BUILD.things.some((t) => t.kind === "vessel")) note("no attuned thing in Coin and Kit is a vessel");
    for (const t of BUILD.things) for (const w of t.awakenings) if (!RS.ROOTS.includes(w.root)) note(`${t.name}'s ${w.name} hasn't got a Root`);
    if (!BUILD.things.some((t) => t.awakenings.some((w) => /\bToll\b/.test(w.text)))) note("no attuned thing in Coin and Kit eases Toll");
    if (!BUILD.things.some((t) => t.awakenings.some((w) => /\badd \d+ to what\b[^.]*\bheal\b/.test(w.text)))) note("no attuned thing in Coin and Kit adds a flat bonus to heals");
  });

  // Rolls on the new core: one Root at full, each Root brought in at full,
  // and 2 for each awakening and 2 more for each Aura on it.
  const awkKey = (c, name) => RS.awakeningsOf(c).find((w) => looks(w.name) === looks(name))?.key;
  const itemKey = (c, name) => c.items.find((it) => looks(it.name).includes(looks(name)))?.key;
  const permKey = (c, text) => RS.thingsOf(c).find((x) => x.kind === "perm" && looks(x.name) === looks(text))?.key;
  const ROLLS = [
    ["vesk", "Picking a lock with her picks", { root: "Body", item: "set of picks" }, 14, "2d12 + d4", 0],
    ["vesk", "Over Lord Vane's roof", { root: "Body", item: "grappling line", awk: [["Anywhere I can throw a hook", 0]] }, 15, "2d12 + d6", 0],
    ["vesk", "Over the roof with 2 Aura on her hook", { root: "Body", item: "grappling line", awk: [["Anywhere I can throw a hook", 2]] }, 19, "3d12 + d2", 2],
    ["bram", "Getting out of the way behind his shield", { root: "Body", item: "shield", avoid: true }, 11, "d12 + d10", 0],
    ["bram", "His shield on a swing adds nothing", { root: "Body", item: "shield" }, 9, "d12 + d6", 0],
    ["bram", "His plate never adds a step", { root: "Body", item: "plate armour", avoid: true }, 9, "d12 + d6", 0],
    ["bram", "His hammer never adds getting out of the way", { root: "Body", item: "war hammer", avoid: true }, 9, "d12 + d6", 0],
    ["bram", "Bar a Warrior's Parry", { root: "Body", item: "war hammer", avoid: true, parry: true }, 11, "d12 + d10", 0],
    ["bram", "Swinging his hammer", { root: "Body", item: "war hammer", awk: [["Ring the bell", 0]] }, 13, "2d12 + d2", 0],
    ["bram", "Barking an order", { root: "Soul" }, 4, "d8", 0],
    ["bram", "An order with his Body brought in on a point", { root: "Soul", bring: [["Body", "fight in a shield wall", "pt"]] }, 13, "2d12 + d2", 0],
    ["dorrie", "Lying past the gate guard", { root: "Mind" }, 7, "d12 + d2", 0],
    ["dorrie", "Passing as someone of rank", { root: "Mind", item: "signet pin", awk: [["Someone who matters", 0]] }, 11, "d12 + d10", 0],
    ["isolde", "Reading the order's old script with her lens", { root: "Mind", item: "reading lens" }, 12, "2d12", 0],
    ["isolde", "Drawing a ward", { root: "Soul", item: "chalk and salt", awk: [["A circle anywhere I can kneel", 0]] }, 11, "d12 + d10", 0],
    ["wren", "Shooting from cover", { root: "Body", item: "longbow", awk: [["Long shot", 0]] }, 13, "2d12 + d2", 0],
    ["wren", "Shooting at something a long way off", { root: "Body", item: "longbow", awk: [["Long shot", 0], ["Hit anything I can see", 0]] }, 15, "2d12 + d6", 0],
    ["wren", "Following a trail", { root: "Mind" }, 8, "d12 + d4", 0],
    ["ash", "Throwing fire", { root: "Soul", item: "ember stone", awk: [["Fire without a word", 0]] }, 15, "2d12 + d6", 0],
    ["ash", "Her coal horn adds no steps", { root: "Soul", item: "coal horn" }, 11, "d12 + d10", 0],
    ["ash", "Commanding a room", { root: "Soul" }, 11, "d12 + d10", 0],
  ];
  for (const [id, what, r, steps, dice, aura] of ROLLS) {
    if (!sheets[id]) continue;
    tryIt(`${id}, ${what}`, () => {
      const c = sheet(id);
      const s = RS.freshCore(c);
      const roll = { root: r.root, item: r.item ? itemKey(c, r.item) : null, avoid: Boolean(r.avoid), parry: Boolean(r.parry), awk: (r.awk ?? []).map(([n, a]) => ({ key: awkKey(c, n), aura: a })), bring: (r.bring ?? []).map(([root, perm, pay]) => ({ root, perm: permKey(c, perm), pay })) };
      if (r.item && !roll.item) note(`${id}, ${what}: the item isn't on the sheet`);
      for (const w of roll.awk) if (!w.key) note(`${id}, ${what}: an awakening isn't on the sheet`);
      for (const b of roll.bring) if (!b.perm) note(`${id}, ${what}: the permission isn't on the sheet`);
      const k = RS.countRoll(c, s, roll);
      same([k.total, diceLabel(k.dice), k.aura, k.ok], [steps, dice, aura, true], `${id}, ${what}`);
    });
  }
  tryIt("a Warrior's Second Skin", () => {
    const c = sheet("bram");
    const s = RS.freshCore(c);
    const plate = itemKey(c, "plate armour");
    c.archetypes = [...c.archetypes, { name: "Warrior", have: ["Push"] }];
    same(RS.countRoll(c, s, { root: "Body", item: plate, avoid: true }).total, 12, "a Warrior's plate is a guard as well, 3 more getting out of the way");
    same([RS.countRoll(c, s, { root: "Body", item: plate }).total, RS.countRoll(c, s, { root: "Soul", item: plate, avoid: true }).total], [9, 4], "never on anything else, or on a Root it isn't on");
  });
  tryIt("the rest of a roll", () => {
    const c = sheet("bram");
    const s = RS.freshCore(c);
    const wall = permKey(c, "fight in a shield wall");
    const spot = permKey(c, "spot who's in charge");
    // A point from the Root brought in, or 3 Aura, and both others at once.
    const pt = RS.countRoll(c, s, { root: "Soul", bring: [{ root: "Body", perm: wall, pay: "pt" }] });
    same([pt.points, pt.aura], [{ Body: 1, Mind: 0, Soul: 0 }, 0], "his Body brought in costs a point of it");
    const au = RS.countRoll(c, s, { root: "Soul", bring: [{ root: "Body", perm: wall, pay: "aura" }] });
    same([au.total, au.points, au.aura], [13, { Body: 0, Mind: 0, Soul: 0 }, 3], "or 3 Aura");
    const both = RS.countRoll(c, s, { root: "Soul", bring: [{ root: "Body", perm: wall, pay: "pt" }, { root: "Mind", perm: spot, pay: "aura" }] });
    same([both.total, diceLabel(both.dice), both.points.Body, both.aura], [16, "2d12 + d8", 1, 3], "both his other Roots, each paid on its own");
    same(RS.countRoll(c, s, { root: "Soul", bring: [{ root: "Soul", perm: wall }, { root: "Body", perm: wall }, { root: "Body", perm: wall }] }).total, 13, "never the roll's own Root, and never one twice");
    const none = RS.countRoll(c, s, { root: "Soul", bring: [{ root: "Body", perm: "" }] });
    same([none.ok, none.total], [false, 4], "nothing comes in without a permission");
    // Spent, lost or locked points never shrink the dice.
    const low = RS.normalCore({ ...s, pts: { Body: 0, Mind: 3, Soul: 4 } }, c);
    same(RS.countRoll(c, low, { root: "Body" }).total, 9, "his Body at 0 still rolls all 9");
    const broke = RS.countRoll(c, low, { root: "Soul", bring: [{ root: "Body", perm: wall, pay: "pt" }] });
    same([broke.ok, broke.short], [false, ["1 point of Body"]], "but he can't spend a point he hasn't got");
    // Splitting has no limit: their dice if they add up, the table's if not.
    same(RS.countRoll(c, s, { root: "Body", dice: [2, 2, 2, 2, 2, 2, 2, 2, 2] }).dice, [2, 2, 2, 2, 2, 2, 2, 2, 2], "nine d2s out of 9 steps");
    same(RS.countRoll(c, s, { root: "Body", dice: [12, 12] }).dice, [12, 6], "a split that isn't his steps is the table's");
    same([RS.countRoll(c, s, { root: "Mind", awk: [{ key: "awk|0|Not on his sheet" }] }).total], [3], "an awakening that isn't his adds nothing");
    // A Root of 0 is still a d2.
    same(diceLabel(RS.countRoll(sheet("vesk"), RS.freshCore(sheet("vesk")), { root: "Soul" }).dice), "d2", "Vesk's Soul on its own is a d2");
    // Paying for it.
    const pay = RS.normalCore(s, c);
    same([RS.payFor(c, pay, both), pay.pts.Body, pay.aura], [true, 6, 2], "paying for both takes a point of his Body and 3 Aura");
    same([RS.payFor(c, pay, RS.countRoll(c, pay, { root: "Soul", bring: [{ root: "Mind", perm: spot, pay: "aura" }] })), pay.aura], [false, 2], "and he can't pay 3 Aura with 2");
    // Every kind of thing is still there, each with its own key, and an
    // awakening's key is the same in both lists.
    const things = RS.thingsOf(c, s);
    same(new Set(things.map((x) => x.key)).size, things.length, "no two things share a key");
    same(RS.awakeningsOf(c, s).map((w) => [w.key, w.root, w.works]), [["awk|0|Ring the bell", "Body", true], ["awk|0|Knock them flat", "Body", true]], "his hammer's awakenings, each locking a point of his Body");
    same(RS.awakeningsOf(c, s).every((w) => things.some((x) => x.key === w.key)), true, "and they're the same keys as the sheet's");
  });
  tryIt("dice unsplit", () => {
    same([fillDice(8), fillDice(13), fillDice(5), fillDice(0)].map((d) => diceLabel(d)), ["d12 + d4", "2d12 + d2", "d10", ""], "a heal's dice are filled to a d12 first");
    same([isSplit([8, 8, 6], 11), isSplit([12, 12], 11), isSplit([3, 8], 7)], [true, false, false], "a split's every die on the ladder, adding up to the steps");
  });

  // Harm, wounds and Scars.
  tryIt("hits", () => {
    const c = sheet("bram");
    const s = RS.freshCore(c);
    const plate = itemKey(c, "plate armour");
    const helm = itemKey(c, "helmet");
    same([RS.soakOf(c, s, "Body"), RS.soakOf(c, s, "Mind")], [5, 0], "his plate soaks 3 and his helmet 2, on his Body");
    same([RS.takeHits(c, s, "Body", 1), s.pts.Body], [{ root: "Body", on: null, lost: 0, soaked: [{ key: plate, n: 1 }], wound: false, scar: false, ok: true }, 7], "a hit on his Body is soaked by his plate first");
    same([RS.takeHits(c, s, "Body", 1, { on: "Soul" }).lost, s.pts.Soul, s.pts.Body], [2, 2, 7], "taken on his Soul, with no armour there, it's 2 points, and his Body keeps its point");
    same([RS.takeHits(c, s, "Body", 2, { on: "Mind" }).ok, s.pts.Mind], [false, 3], "and he can't take two on his Mind's 3, so nothing changes");
    const twoForOne = RS.takeHits(c, s, "Mind", 1, { on: "Body" });
    same([twoForOne.lost, twoForOne.soaked, s.pts.Body], [0, [{ key: plate, n: 2 }], 7], "a hit at his Mind taken on his Body is 2 points there, and his plate soaks both");
    const deadly = RS.takeHits(c, s, "Body", 3);
    same([deadly.soaked, deadly.lost, RS.soakOf(c, s, "Body"), s.pts.Body], [[{ key: helm, n: 2 }], 1, 0, 6], "a deadly 3 hits: his helmet soaks 2, and the third takes a point");
    same([RS.sceneEnd(c, s, {}).toll, RS.soakOf(c, s, "Body"), s.soak], [0, 5, {}], "and every piece's soak is back at the end of the scene");
    s.crossed[plate] = true;
    same(RS.soakOf(c, s, "Body"), 2, "a broken piece doesn't soak till it's mended");
    delete s.crossed[plate];
    s.soak = { [plate]: 3, [helm]: 2 };
    s.pts.Body = 1;
    const three = RS.takeHits(c, s, "Body", 3);
    same([three.lost, three.wound, three.scar, s.pts.Body, s.wound.Body, s.blaze], [1, true, true, 0, true, "Body"], "with his soak gone, a ×3 hit on Body 1 empties it, then wounds it, then Scars it");
    same(RS.takeHits(c, s, "Mind", 1).lost, 0, "with a Scar waiting for its words, nothing more lands");
    const gone = RS.freshCore(c);
    gone.out = true;
    same([RS.takeHits(c, gone, "Body", 1).lost, gone.pts.Body, gone.soak], [0, 7, {}], "and nothing lands on someone who's left the scene");
    same([RS.takeScar(c, s, "Body", "a spear through the shoulder"), s.scars.Body, s.out, s.blaze], [{ last: false }, ["a spear through the shoulder"], true, null], "the Scar's on his Body, and he leaves the scene");
    same([RS.lockedOf(c, s).Body, RS.capOf(c, s, "Body")], [3, 3], "the Scar locks a point for good, and wounded he can hold half of what's left, rounded up");
    // Dorrie's court clothes soak on her Mind.
    const d = sheet("dorrie");
    const ds = RS.freshCore(d);
    same([RS.soakOf(d, ds, "Mind"), RS.takeHits(d, ds, "Mind", 3).lost, ds.pts.Mind], [2, 1, 5], "Dorrie's court clothes soak 2 on her Mind, and the third hit takes a point");
    // A Root at 0 has nothing to lose but its wound.
    const i = sheet("isolde");
    const is = RS.freshCore(i);
    same([RS.takeHits(i, is, "Body", 1).wound, is.wound.Body], [true, true], "Isolde's Body is 0, so a hit there wounds it straight away");
    same([RS.takeHits(i, is, "Body", 1).scar, RS.lastScar(i, is, "Body")], [true, false], "and the next is a Scar, though a Root with no points has none for it to lock");
    // The Blaze, while wounded.
    const w = RS.freshCore(sheet("wren"));
    same(RS.canBlaze(w, "Body"), false, "Wren can't Blaze unwounded");
    w.wound.Mind = true;
    same([RS.blazeOn(w, "Mind"), w.blaze], [true, "Mind"], "once her Mind's wounded she can take the Blaze, and her Scar waits for its Catch");
    // The last Scar is the one that would lock a Root's last point.
    const v = sheet("vesk");
    const vs = RS.freshCore(v);
    vs.scars.Mind = ["a", "b", "c", "d"];
    same(RS.lastScar(v, vs, "Mind"), true, "Vesk's fifth Scar on her Mind of 5 would be her last");
  });

  // Items on a roll: one item a roll, the one doing the work, its tier only
  // when it can, never a broken one, and Resources and vessels.
  tryIt("items", () => {
    same([RS.TIERS.map((t) => t.name), BUILD.tiers.map((t) => t.name), RS.tierName(3)], [BUILD.tiers.map((t) => t.name), ["Plain", "Trusty", "Proven", "Storied", "Sung", "Mythic"], "Proven"], "the tiers' names come off the table in Items");
    same(BUILD.kinds.map((k) => k.kind), RS.KINDS, "the six kinds of item, off the table in Items");
    if (BUILD.resources.length < 20) note(`only ${BUILD.resources.length} Resource ideas`);
    same(BUILD.weapons.find((w) => w.name === "Longbow")?.props, ["Long", "Two-Handed"], "the weapons come with their properties");
    const v = sheet("vesk");
    const vs = RS.freshCore(v);
    const picks = itemKey(v, "set of picks");
    same(RS.itemSaid(v.items.find((it) => it.key === picks)), "a Proven set of picks", "an item's said with its tier's name first");
    same(RS.countRoll(v, vs, { root: "Body", item: picks }).item, { key: picks, name: "a set of picks", tier: 3, steps: 3 }, "the roll says which item and what it added");
    vs.crossed[picks] = true;
    same([RS.countRoll(v, vs, { root: "Body", item: picks }).total, RS.countRoll(v, vs, { root: "Body", item: picks }).item], [11, null], "a broken set of picks adds nothing");
    const line = itemKey(v, "grappling line");
    vs.crossed[line] = true;
    same(RS.normalCore(vs, v).crossed, { [picks]: true }, "an attuned thing can't be crossed out");
    // Resources.
    const s = RS.freshCore(v);
    same([RS.resOf(v), RS.resLeft(v, s)], [3, 3], "Vesk's got 3 Resources");
    same([RS.sayRes(v, s, "rope"), RS.sayRes(v, s, "a smoke bomb"), RS.sayRes(v, s, "a purse of gold"), RS.sayRes(v, s, "a lantern"), s.res, RS.resLeft(v, s)], [true, true, true, false, ["rope", "a smoke bomb", "a purse of gold"], 0], "she says three, and there isn't a fourth");
    same([RS.sceneEnd(v, s, {}) && s.res.length, RS.downtimeRest(v, s) && s.res], [3, []], "a scene's end doesn't put them back, and downtime does");
    const packed = rootsSheet({ ...sheets.vesk, items: [...sheets.vesk.items, { name: "a quartermaster's pack", kind: "pack", tier: 3 }] }, [], BUILD);
    same(RS.resOf(packed), 5, "a tier 3 pack is 2 more Resources, half its tier rounded up");
    // Vessels: Ash's coal horn holds 3.
    const a = sheet("ash");
    const as = RS.freshCore(a);
    const horn = itemKey(a, "coal horn");
    same([RS.chargeOf(a, as, horn), RS.fillVessel(a, as, horn, 2, { from: "aura" })], [0, 0], "her horn starts empty, and Aura she wouldn't lose can't go in");
    same(RS.fillVessel(a, as, horn, 2, { from: "aura", spill: 2 }), 0, "and saying she lost some doesn't make it so");
    as.acting = true;
    as.aura = 7;
    same([RS.fillVessel(a, as, horn, 3, { from: "aura" }), as.aura, RS.chargeOf(a, as, horn)], [2, 5, 2], "the 2 past her 5 while she's acting go in");
    as.acting = false;
    same([RS.gainAura(as, a, 2), as.aura, as.spill], [2, 5, 2], "2 Aura coming in off her turn stops at her 5, and she's lost 2");
    same([RS.fillVessel(a, as, horn, 3, { from: "aura" }), RS.chargeOf(a, as, horn), as.aura, as.spill], [1, 3, 5, 1], "Aura she really lost goes in, as far as the horn holds");
    as.charge[horn] = 0;
    same([RS.fillVessel(a, as, horn, 3, { from: "aura" }), RS.fillVessel(a, as, horn, 1, { from: "aura" }), "spill" in as], [1, 0, false], "and never more than she lost");
    as.acting = true;
    as.aura = 6;
    same([RS.doneActing(as, a), as.spill, RS.fillVessel(a, as, horn, 3, { from: "aura" }), RS.chargeOf(a, as, horn)], [1, 1, 1, 2], "Aura past her maximum as she finishes acting can still go in after");
    as.charge[horn] = 3;
    same(RS.fillVessel(a, as, horn, 1, { from: "pt", root: "Soul" }), 0, "a full horn takes nothing");
    as.charge[horn] = 1;
    same([RS.fillVessel(a, as, horn, 1, { from: "pt", root: "Soul" }), as.pts.Soul, RS.chargeOf(a, as, horn), as.held[horn].Soul, RS.capOf(a, as, "Soul")], [1, 9, 2, 1, 9], "a point of her Soul's a charge, mid-scene, held in the horn like a lock");
    as.out = true;
    same(RS.fillVessel(a, as, horn, 1, { from: "pt", root: "Soul" }), 0, "never once she's left the scene");
    delete as.out;
    as.charge[horn] = 3;
    as.aura = 0;
    const stone = itemKey(a, "ember stone");
    const fire = { root: "Soul", item: stone, awk: [{ key: awkKey(a, "Fire without a word"), aura: 2 }], charge: [{ key: horn, n: 2 }] };
    const k = RS.countRoll(a, as, fire);
    same([k.total, diceLabel(k.dice), k.aura, k.charge, k.ok], [19, "3d12 + d2", 0, [{ key: horn, n: 2 }], true], "2 charge pays for the 2 Aura on Fire without a word, so she throws 19 on no Aura");
    same([RS.payFor(a, as, k), RS.chargeOf(a, as, horn), as.held?.[horn], RS.capOf(a, as, "Soul")], [true, 1, undefined, 10], "and paying spends the charge, her point of Soul first, so it's free to come back");
    same(RS.countRoll(a, as, { root: "Soul", charge: [{ key: horn, n: 1 }] }).charge, [], "charge only pays for an awakening's Aura");
    same([RS.spendCharge(a, as, horn, 2), RS.spendCharge(a, as, horn, 1), RS.chargeOf(a, as, horn)], [false, true, 0], "spending charge on an ability, never more than's there");
    const end = RS.freshCore(a);
    end.aura = 3;
    same([RS.sceneEnd(a, end, {}, { fill: { [horn]: 5 } }).filled, RS.chargeOf(a, end, horn), end.aura], [[], 0, 5], "Aura left at a scene's end isn't lost, so it never goes in, and Aura's full");
    RS.fillVessel(a, end, horn, 2, { from: "pt", root: "Soul" });
    RS.sceneEnd(a, end, { Soul: 12 });
    same([end.pts.Soul, RS.capOf(a, end, "Soul")], [8, 8], "the 2 points held in it don't come back at a scene's end");
    RS.downtimeRest(a, end);
    same([RS.chargeOf(a, end, horn), end.held[horn].Soul, end.pts.Soul], [2, 2, 8], "it keeps its charge through downtime, and the points held in it stay held");
    same(RS.normalCore({ ...end, charge: { [horn]: 1 }, held: { [horn]: { Soul: 2 } } }, a).held[horn].Soul, 1, "never more held than its charge");
    // Six items at most.
    const many = rootsSheet({ ...sheets.vesk, items: [...sheets.vesk.items, { name: "a lantern", tier: 2 }, { name: "a crowbar", tier: 2 }] }, [], BUILD);
    same([many.items.length, RS.choicesOf(many).find((x) => x.k === "items")], [7, { k: "items", over: 1 }], "a seventh item is theirs to choose which goes");
    // What downtime grows: a tier, an item, and one let go.
    const grown = sheet("vesk", [{ k: "tier", key: itemKey(v, "knife"), to: 3 }, { k: "item", name: "a spyglass", kind: "tool", tier: 2 }, { k: "drop", key: itemKey(v, "soft-soled boots") }]);
    same(grown.items.map((it) => [it.name, it.tier]), [["worn leathers", 2], ["a knife", 3], ["a set of picks", 3], ["her grappling line", 2], ["a spyglass", 2]], "Grow puts her knife up a tier, she gets a spyglass and lets her boots go");
    same(costOf(grown).spent, 35, "and what downtime grows never counts against her 35");
  });

  // Healing, Toll and rests.
  tryIt("healing", () => {
    const c = sheet("vesk");
    const s = RS.freshCore(c);
    Object.assign(s.pts, { Body: 3, Mind: 2 });
    s.toll = 1;
    const eased = RS.healBy(c, JSON.parse(JSON.stringify(s)), 8, { Body: 7, Mind: 1 }, { other: true, ease: 1 });
    same([eased.amount, eased.healed, eased.toll], [8, { Body: 7, Mind: 1, Soul: 0 }, 2], "a Healer who's come prepared heals her whole 8 through 1 Toll, and it's 2 Toll after");
    const plain = RS.healBy(c, s, 8, null, { other: true });
    same([plain.amount, s.pts, s.toll], [3, { Body: 6, Mind: 2, Soul: 0 }, 2], "without, it's 8 less 5, going where there's most room");
    same(RS.healBy(c, s, 3, null, { other: true }).amount, 0, "Toll never takes a heal below 0");
    same(RS.healBy(c, RS.freshCore(c), 2, null, { bonus: 3 }).amount, 5, "a flat bonus adds to what it rolls");
    // Wounded, a Root heals to half what it can hold.
    const wd = RS.freshCore(c);
    wd.pts.Body = 0;
    wd.wound.Body = true;
    same([RS.healBy(c, wd, 12, { Body: 12 }).healed.Body, wd.pts.Body], [5, 5], "her Body wounded heals to 5 of the 10 it can hold");
    // The end of a scene, and downtime.
    const e = RS.freshCore(c);
    Object.assign(e.pts, { Body: 4, Mind: 1 });
    e.toll = 2;
    e.out = true;
    same([RS.sceneEnd(c, e, { Body: 9, Mind: 2 }).healed, e.pts, e.toll, "out" in e], [{ Body: 6, Mind: 2, Soul: 0 }, { Body: 10, Mind: 3, Soul: 0 }, 1, false], "the end of a scene gets back what each Root rolls, Toll drops 1, and she's back for the next");
    same(RS.restOf(c, RS.freshCore(c)), [], "a full character rolls nothing at the end of a scene");
    const d = RS.freshCore(c);
    Object.assign(d, { pts: { Body: 0, Mind: 0, Soul: 0 }, wound: { Body: true, Mind: false, Soul: false }, toll: 3 });
    d.scars.Body = ["a burn"];
    RS.downtimeRest(c, d);
    same([d.pts, d.wound.Body, d.toll, d.scars.Body.length], [{ Body: 9, Mind: 5, Soul: 0 }, false, 0, 1], "downtime puts everything back but the Scar, which keeps its point");
    d.soak = { [itemKey(c, "worn leathers")]: 2 };
    same(RS.downtimeRest(c, d).soak, {}, "and her leathers' soak");
  });

  // Saves from before: stacking (v3), Roots (v2) and before Roots, all onto
  // the new core with what they had.
  tryIt("saves from before", () => {
    const grown = [{ k: "perm", t: 0, text: "climb a sheer wall", root: "Body", spec: "Climbing" }];
    const c = sheet("vesk", grown);
    same(c.roots, { Body: 12, Mind: 5, Soul: 0 }, "Vesk with a permission she grew in downtime");
    const raw = {
      v: 3, aura: 7, acting: false, tracks: { stamina: 8, confidence: 12, resolve: 10 }, bought: 2, power: { "0|Anywhere I can throw a hook": 2 },
      scars: { stamina: ["a burn across her back"], confidence: [], resolve: [] }, blaze: null, dead: false, stacked: true,
      conditions: [{ name: "Burning", die: 6, kind: "against" }], threads: { dorrie: "strained" },
      crossed: { "utility|a smoke bomb": true, "equipment|a knife": true }, boxes: { "equipment|worn leathers": 1 }, picked: [{ name: "a lantern", where: "bag" }],
      asp: 4, aspText: "", notes: "Owes Mara a favour.", last: null, grown, tele: { c: "abc", r: 2 },
    };
    const s = RS.normalCore(JSON.parse(JSON.stringify(raw)), c);
    same(s.v, 5, "a save from stacking is on v5");
    same([s.soak, s.res, s.charge, "boxes" in s, s.crossed], [{}, [], {}, false, { "item|a knife": true }], "her soak's all there, her boxes are gone, and her knife's still crossed out by its own key");
    same(["tracks", "power", "bought", "stacked", "store"].filter((k) => k in s), [], "the tracks, powering and extra actions are gone");
    same([s.scars, RS.lockedOf(c, s).Body, s.pts, s.wound, s.toll], [{ Body: ["a burn across her back"], Mind: [], Soul: [] }, 2, { Body: 10, Mind: 5, Soul: 0 }, { Body: false, Mind: false, Soul: false }, 0], "her Stamina's Scar is on her Body, locking a point, and every Root's full");
    same([s.conditions.map((x) => x.name), s.threads, s.picked.map((p) => p.name), s.asp, s.notes, s.tele, s.grown.length], [["Burning"], raw.threads, ["a lantern"], 4, raw.notes, raw.tele, 1], "she keeps her play");
    same([s.aura, s.core, s.choose], [5, true, []], "her Aura's inside the new maximum, she's told once, and there's nothing for her player to choose");
    same(RS.normalCore(JSON.parse(JSON.stringify(s)), c).core, true, "and it stays till she's seen it");
    same(RS.normalCore({ ...JSON.parse(JSON.stringify(s)), core: false }, c).core, undefined, "and goes once she has");
    same([RS.normalCore({}, c).core, RS.normalCore(undefined, c).v], [undefined, 5], "a new character's fresh, with nothing to tell");
    // A Blaze waiting on a track is a Scar waiting on its Root.
    same(RS.normalCore({ ...raw, blaze: "resolve" }, c).blaze, "Soul", "a Blaze waiting on her Resolve is a Scar waiting on her Soul");
    // From Roots (v2), and from before Roots, all the way.
    same(RS.normalCore({ v: 2, aura: 3, tracks: { stamina: 6, confidence: 12, resolve: 12 }, scars: { stamina: ["x"], confidence: [], resolve: [] }, store: {} }, c).scars.Body, ["x"], "a save from Roots comes across too");
    const old = RS.normalCore(RS.fromOld({ wound: 8, conf: 3, resolve: 2, scars: 1, notes: "Old notes.", threads: { dorrie: "strained" } }, c), c);
    same([old.v, old.moved, old.core, old.scars.Body.length, old.notes], [5, true, true, 1, "Old notes."], "Old Vesk moves from before Roots onto the new core at once");
    // A v4 save from the new core moves onto the fixes.
    const v4 = { ...RS.freshCore(c), v: 4, boxes: { "equipment|worn leathers": 1 }, crossed: { "equipment|a knife": true }, choose: [], res: undefined, soak: undefined, charge: undefined };
    const v5 = RS.normalCore(v4, c);
    same([v5.v, v5.soak, v5.res, v5.charge, "boxes" in v5, v5.crossed, v5.choose, "core" in v5], [5, {}, [], {}, false, { "item|a knife": true }, [], false], "a v4 save from the new core moves onto the fixes with nothing for her to choose");
    same(RS.normalCore({ wound: 8, conf: 3, resolve: 2, scars: 1 }, c).scars.Body.length, 1, "and normalCore() takes her that way on its own");

    // Mara, built on the phone on stacking: each Title's 3 is 5, spread the
    // way they were, for her player to check, and her awakening with no Root
    // locks a point of her biggest Root till she says.
    const mara = {
      id: "mara", name: "Mara", own: true, title: "The duellist who's never lost", blurb: "", hash: "x", pronoun: "her", playsLike: "",
      archetypes: [{ name: "Warrior", id: "a-warrior", have: ["Push"] }, { name: "Leader", id: "a-leader", have: ["Push"] }],
      titles: [
        { text: "The duellist who's never lost", roots: { Body: 2, Mind: 1, Soul: 0 }, permissions: [{ text: "fight with a sword", root: "Body" }, { text: "read a fighter's style", root: "Mind" }, { text: "fight in front of a crowd", root: "Body" }], boons: [] },
        { text: "Captain of the Guard", roots: { Body: 1, Mind: 1, Soul: 1 }, permissions: [{ text: "give orders people follow", root: "Soul" }, { text: "read a battlefield", root: "Mind" }, { text: "lead a charge", root: "Soul" }], boons: [] },
      ],
      roots: { Body: 0, Mind: 0, Soul: 0 },
      carry: { equipment: ["a duelling sword", "a buckler"], utility: ["a whetstone"], keepsake: "her mother's ring", bag: { name: "a bag", max: 10, items: [] } },
      armour: [], attuned: [{ name: "Her rapier", props: null, stage: "Awakened", catch: null, burden: null, awakenings: [{ name: "Riposte", kind: "passive", text: "+1 on one die of every roll she makes with it, for each Aura powering it." }] }],
      numbers: { aura: 7, stride: 3, strideNote: null, stamina: { die: 12, note: null }, confidence: { die: 12, note: null }, resolve: { die: 12, note: null } },
      threads: [], crewQs: [], aspiration: { text: "Never lose", die: 2 }, trouble: [],
    };
    const m = rootsSheet(mara, [], BUILD);
    same(m.titles.map((t) => t.roots), [full({ Body: 3, Mind: 2 }), full({ Body: 1, Mind: 2, Soul: 2 })], "Mara's Titles made 5, the 2 more where the 3 were, and on her second, 1 on each, where her permissions are");
    same(m.titles.map((t) => t.fromThree), [full({ Body: 2, Mind: 1 }), full({ Body: 1, Mind: 1, Soul: 1 })], "each says what it was");
    same([m.roots, m.numbers.aura, "stamina" in m.numbers], [{ Body: 6, Mind: 6, Soul: 4 }, 5, false], "her Roots recounted, Aura 5 and no tracks");
    same([m.attuned[0].awakenings[0].root, m.attuned[0].awakenings[0].guessed, "kind" in m.attuned[0].awakenings[0]], ["Body", true, false], "her rapier's awakening locks her biggest Root's point till she says");
    const ms = RS.normalCore({ v: 3, aura: 7, tracks: { stamina: 12, confidence: 12, resolve: 12 } }, m);
    same(m.items.map((it) => [it.name, it.kind, it.tier, it.attuned]), [["a duelling sword", "weapon", 2, null], ["a buckler", "guard", 2, null], ["Her rapier", "weapon", 2, 0]], "her equipment's items at tier 2, her buckler a guard, and her rapier one of them, attuned");
    same(["carry" in m, m.was], [false, { utility: ["a whetstone"], bag: [] }], "her whetstone isn't an item, since it's a Resource now, and there's no carry on her sheet");
    same(ms.choose, [{ k: "five", t: 0, was: full({ Body: 2, Mind: 1 }) }, { k: "five", t: 1, was: full({ Body: 1, Mind: 1, Soul: 1 }) }, { k: "lock", a: 0, name: "Riposte", root: "Body" }, { k: "points", left: 4 }], "what her player's asked: each Title's spread, the Root her awakening locks, and the 4 points she's got left, her whetstone's among them");
    has(ms.notes, "a whetstone", "her whetstone's in her notes");
    // A choice she's seen goes for good, and one that no longer applies goes.
    same(RS.normalCore({ ...ms, choose: ms.choose.slice(1) }, m).choose.map((x) => x.k), ["five", "lock", "points"], "once she's checked her first Title, it isn't asked again");
    // A Boon she built in is gone, with its 2 points to spend, and asked once.
    const boony = rootsSheet({ ...mara, core: true, titles: [{ ...mara.titles[0], roots: { Body: 3, Mind: 2, Soul: 0 }, boons: [{ lever: "Toughness", name: "Iron Lungs" }] }, { ...mara.titles[1], roots: { Body: 2, Mind: 2, Soul: 1 } }] }, [], BUILD);
    same([boony.titles[0].boonsGone, "boons" in boony.titles[0], boony.points.spent], [[{ lever: "Toughness", name: "Iron Lungs" }], false, 31], "a Boon on a saved sheet is gone, and costs nothing");
    const bs = RS.normalCore({ ...RS.freshCore(boony), v: 4, choose: [] }, boony);
    same(bs.choose.filter((x) => x.k === "boon" || x.k === "points"), [{ k: "boon", t: 0, lever: "Toughness", name: "Iron Lungs" }, { k: "points", left: 4 }], "moving onto the fixes asks her about it, with the points it gives back");
    same(RS.normalCore({ ...bs, choose: bs.choose.filter((x) => x.k !== "boon") }, boony).choose.some((x) => x.k === "boon"), false, "and once she's seen it, it's gone");
    const fixed = rootsSheet({ ...mara, titles: [{ ...mara.titles[0], roots: { Body: 3, Mind: 2, Soul: 0 } }, mara.titles[1]], attuned: [{ ...mara.attuned[0], awakenings: [{ ...mara.attuned[0].awakenings[0], root: "Body" }] }] }, [], BUILD);
    same(RS.normalCore(ms, fixed).choose.map((x) => x.k), ["five", "points"], "spreading a Title and giving her awakening a Root clears their flags");
    // A sheet made on the new core keeps a Title spread 3 as it is.
    same(rootsSheet({ ...mara, core: true }, [], BUILD).titles[0].roots, full({ Body: 2, Mind: 1 }), "a sheet on the new core isn't spread for her");
    // A Title grown on stacking from an Aspiration is made 5 too.
    same(sheet("vesk", [{ k: "title", text: "The woman who has never been seen", roots: { Soul: 2, Mind: 1 }, perm: { text: "vanish in a crowd", root: "Soul" } }]).titles[2].roots, full({ Soul: 3, Mind: 2 }), "a Title grown on stacking is 5");
    // From before stacking, a Title on one Root is all 5 on it, to spread.
    const tam = rootsSheet({ ...mara, titles: [{ name: "Old", root: "Body", specialties: ["A"], permissions: [{ text: "fight with a sword", root: "Body", specialty: "A" }], boons: [] }] }, [], BUILD);
    same([tam.titles[0].roots, tam.titles[0].fromRoot, RS.choicesOf(tam)[0]], [full({ Body: 5 }), "Body", { k: "spread", t: 0, root: "Body" }], "a Title from before stacking is all 5 on its old Root, to spread");
    // An archetype the book hasn't got any more is the first thing asked.
    const withScholar = rootsSheet({ ...mara, archetypes: [mara.archetypes[0], { name: "Scholar", id: "a-scholar" }] }, [], BUILD);
    same(RS.choicesOf(withScholar)[0], { k: "arch", a: 1, name: "Scholar" }, "the Scholar's gone from the book, and hers to swap first");
    same(rootsSheet(withScholar, [], null).archetypes.some((a) => a.gone), false, "with no book to hand, nothing's called gone");
  });

  // The build stops on a crew sheet that doesn't add up.
  let crewSheets = null;
  try {
    crewSheets = await import("../scripts/crew-sheets.mjs");
  } catch (e) {
    note(`can't load scripts/crew-sheets.mjs: ${e.message}`);
  }
  if (crewSheets) {
    const text = readFileSync("content/rules/03b-title-ideas-and-the-crew.md", "utf8");
    const archetypes = Object.fromEntries(BUILD.archetypes.map((a) => [a.name, a]));
    const read = (body) => {
      const said = [];
      const crew = crewSheets.crewFrom({ body }, { warn: (m) => said.push(m), inline: (s) => s, archetypes, tiers: BUILD.tiers, props: BUILD.props.map((p) => p.name) });
      return { crew, said };
    };
    const real = read(text);
    same([real.crew.length, real.said], [6, []], "the chapter's six crew sheets read with nothing wrong");
    same(real.crew.every((c) => c.core === true), true, "every crew sheet says it's on the new core");
    const BROKEN = [
      ["a Roots line that doesn't add up", "**Roots:** Body 11 · Mind 5 · Soul 0.", "**Roots:** Body 12 · Mind 5 · Soul 0."],
      ["a Title spread to 6", "*Raised by the Guild* (Mind 3, Body 2)", "*Raised by the Guild* (Mind 3, Body 3)"],
      ["a Title spread to 3, the old way", "*Raised by the Guild* (Mind 3, Body 2)", "*Raised by the Guild* (Mind 2, Body 1)"],
      ["a Title with no spread", "*Raised by the Guild* (Mind 3, Body 2)", "*Raised by the Guild* (Mind)"],
      ["points that don't add up", "**Points:** 35. Two Titles 10, four more permissions 4, Shadow twice 10", "**Points:** 36. Two Titles 10, four more permissions 4, Shadow twice 10"],
      ["a points line whose parts don't add up", "four more permissions 4, Shadow twice 10", "four more permissions 5, Shadow twice 10"],
      ["an ability that isn't its archetype's", "[Shadow](#a-shadow) (*Vanish*)", "[Shadow](#a-shadow) (*Make it real*)"],
      ["an archetype with no ability", "[Shadow](#a-shadow) (*Vanish*)", "[Shadow](#a-shadow)"],
      ["Aura that isn't 5", "**Numbers:** Aura 5 · Stride 3.\n\n**Threads:** Dorrie: *We have", "**Numbers:** Aura 7 · Stride 3.\n\n**Threads:** Dorrie: *We have"],
      ["a track back in the numbers", "**Numbers:** Aura 5 · Stride 3.\n\n**Threads:** Dorrie: *We have", "**Numbers:** Aura 5 · Stamina d12 · Stride 3.\n\n**Threads:** Dorrie: *We have"],
      ["a specialty back on a permission", "*move unseen* (Body)", "*move unseen* (Body, Stealth)"],
      ["a Specialties line", "**Roots:** Body 11 · Mind 5 · Soul 0.", "**Roots:** Body 11 · Mind 5 · Soul 0.\n\n**Specialties:** Locks 4."],
      ["an attuned thing's own way to Aura", "**Attuned (Awakened):** A grappling line.", "**Attuned (Awakened):** A grappling line.\n\n**Its Aura:** 1 the first time each scene she gets somewhere nobody else could follow."],
      ["an Items line whose count's wrong", "her grappling line (tool, tier 2, attuned) · 5 of 6.", "her grappling line (tool, tier 2, attuned) · 4 of 6."],
      ["a seventh item", "her grappling line (tool, tier 2, attuned) · 5 of 6.", "her grappling line (tool, tier 2, attuned) · a lantern (tool, tier 2) · a crowbar (tool, tier 2) · 7 of 6."],
      ["an item past tier 3 at the start", "a set of picks (tool, tier 3)", "a set of picks (tool, tier 4)"],
      ["an item with no tier", "a set of picks (tool, tier 3)", "a set of picks (tool)"],
      ["an item of no kind there is", "a set of picks (tool, tier 3)", "a set of picks (trinket, tier 3)"],
      ["armour with no Root", "worn leathers (armour, Body, tier 2)", "worn leathers (armour, tier 2)"],
      ["a tier's name that isn't its tier", "a set of picks (tool, tier 3)", "a Trusty set of picks (tool, tier 3)"],
      ["a weapon property that isn't one", "his war hammer (weapon, tier 2, Breaker, attuned)", "his war hammer (weapon, tier 2, Smashing, attuned)"],
      ["an attuned item that isn't the attuned thing", "her grappling line (tool, tier 2, attuned)", "her grappling line (tool, tier 2)"],
      ["Resources that aren't 3", "**Resources:** 3.\n\n**Attuned (Awakened):** A grappling line.", "**Resources:** 4.\n\n**Attuned (Awakened):** A grappling line."],
      ["no keepsake", "**Keepsake:** the first coin she ever stole.\n\n", ""],
      ["a Carries line back", "**Keepsake:** the first coin she ever stole.", "**Keepsake:** the first coin she ever stole.\n\n**Carries:** a purse of gold (utility, 1 of 3)."],
      ["a Boons line", "**Keepsake:** the first coin she ever stole.", "**Keepsake:** the first coin she ever stole.\n\n**Boons:** *Iron Lungs* (Toughness)."],
      ["a tier up missing from the points", "four items 4, and two tiers up 2.", "four items 4, and two tiers up 1."],
      ["an awakening with no Root, the old way", "*Anywhere I can throw a hook* (Body):", "*Anywhere I can throw a hook* (passive):"],
      ["an awakening locking a point its Root hasn't got", "*A circle anywhere I can kneel* (Soul):", "*A circle anywhere I can kneel* (Body):"],
    ];
    for (const [what, from, to] of BROKEN) {
      if (!text.includes(from)) {
        note(`the chapter hasn't got "${from}" to break for ${what}`);
        continue;
      }
      if (!read(text.replace(from, to)).said.length) note(`the build doesn't stop on ${what}`);
    }
  }
  console.log("the crew and the character on the new core checked");
}

// 1f. Print, with no browser. The blank sheet first, against the list of its
// fields, then the crew, Vesk part way through a scene, Bram with a Boon, and
// Rook, made up with more of everything than the paper holds.
if (part("1f")) {
  const { fillSheet } = await import("../src/companion/print.js");
  const { sheetFields } = await import("../src/companion/sheet-fields.js");
  const blank = readFileSync("public/sheets/zidara-character-sheet.pdf");
  const kindOf = (f) => (f instanceof PDFTextField ? "text" : f instanceof PDFCheckBox ? "check" : f instanceof PDFRadioGroup ? "radio" : "other");
  const fieldsOf = async (bytes) => (await PDFDocument.load(bytes)).getForm().getFields();
  const valuesOf = async (bytes) => Object.fromEntries((await fieldsOf(bytes)).map((f) => [f.getName(), f instanceof PDFTextField ? f.getText() ?? "" : f instanceof PDFRadioGroup ? f.getSelected() ?? "" : f instanceof PDFCheckBox ? f.isChecked() : null]));
  const list = sheetFields();
  const want = new Map(list.map((f) => [f.name, f]));
  const onSheet = await fieldsOf(blank);
  const there = new Map(onSheet.map((f) => [f.getName(), f]));
  same(list.filter((f) => !there.has(f.name)).map((f) => f.name), [], "fields the list has that the blank sheet hasn't");
  same(onSheet.map((f) => f.getName()).filter((n) => !want.has(n)), [], "fields on the blank sheet the list hasn't");
  for (const f of list) {
    const got = there.get(f.name);
    if (!got) continue;
    if (kindOf(got) !== f.kind) note(`${f.name} is a ${kindOf(got)} field on the sheet, and the list says ${f.kind}`);
    else if (f.kind === "radio") same([...got.getOptions()].sort(), [...f.values].sort(), `what can be ringed for ${f.name}`);
  }

  // Everything print fills, by anyone, so a field nobody fills shows up.
  const filled = new Set();
  let printed = 0;
  const print = async (who, c, s, extra = {}) => {
    const out = await fillSheet({ name: who }, c, s, { B: BUILD, blank, ...extra });
    // With a folder for screenshots, each printed sheet goes there too.
    if (SHOTS) writeFileSync(join(SHOTS, `print-${++printed}-${who.toLowerCase()}.pdf`), out.bytes);
    same(out.missing, [], `fields print looked for on ${who}'s sheet that it hasn't got`);
    const got = await valuesOf(out.bytes);
    for (const [k, v] of Object.entries(got)) if (v) filled.add(k);
    return { ...out, got };
  };
  const joined = (got, ...names) => names.map((n) => got[n]).filter(Boolean).join(" ");
  const box = (n) => (n ? String(n) : "");
  const lower = (r) => String(r ?? "").toLowerCase();
  for (const crew of book.crew) {
    const c = rootsSheet(crew, [], BUILD);
    const s = RS.normalCore({}, c);
    const { got, short } = await print(crew.name, c, s);
    const who = crew.name;
    if (short) note(`${who}'s Notes ran out of room`);
    same([got.name, got.aura_now, got.aura_max, got.toll, got.points_spent, got.points_start, got.points_banked], [who, "5", "5", "", "35", "35", ""], `${who}'s name, Aura, Toll and points`);
    const locked = RS.lockedOf(c, s);
    for (const r of ROOTS) {
      const perms = crew.titles.flatMap((t) => t.permissions).filter((p) => p.root === r).length;
      same(got[`root_${lower(r)}`], String(crew.roots[r]), `${who}'s ${r}`);
      same(got[`root_${lower(r)}_dice`], crew.roots[r] ? diceLabel(stepsToDice(crew.roots[r])) : "nothing", `${who}'s ${r}'s dice`);
      crew.titles.forEach((t, i) => same(got[`root_${lower(r)}_title_${i + 1}`], box(t.roots[r]), `${who}'s ${r} from Title ${i + 1}`));
      same(got[`root_${lower(r)}_permissions`], box(perms), `${who}'s ${r} from permissions`);
      same(crew.titles.reduce((n, t) => n + t.roots[r], 0) + perms, crew.roots[r], `${who}'s ${r}, added up from where it came from`);
      // Each awakening locks a point of its Root, and a fresh character's full.
      same([got[`root_${lower(r)}_locked`], got[`root_${lower(r)}_holds`], got[`root_${lower(r)}_now`], got[`root_${lower(r)}_wound`]], [box(locked[r]), String(crew.roots[r] - locked[r]), String(crew.roots[r] - locked[r]), false], `${who}'s ${r}: locked, holds, now and no wound`);
    }
    crew.titles.forEach((t, i) => {
      const at = `title_${i + 1}`;
      same(joined(got, at, `${at}_more`), t.text, `${who}'s Title ${i + 1}`);
      same(ROOTS.map((r) => got[`${at}_${lower(r)}`]), ROOTS.map((r) => box(t.roots[r])), `${who}'s Title ${i + 1}'s spread`);
      same(ROOTS.reduce((n, r) => n + Number(got[`${at}_${lower(r)}`] || 0), 0), 5, `${who}'s Title ${i + 1} spreading 5`);
      t.permissions.forEach((p, j) => same([got[`${at}_permission_${j + 1}`], got[`${at}_permission_${j + 1}_root`]], [p.text, lower(p.root)], `${who}'s permission ${j + 1} on Title ${i + 1}, with its Root`));
      same(got[`${at}_permission_${t.permissions.length + 1}`], "", `nothing after ${who}'s permissions on Title ${i + 1}`);
    });
    same(got.title_3, "", `${who}'s third Title, which she hasn't got`);
    const names = [...new Set(crew.archetypes.map((a) => a.name))];
    names.forEach((n, i) => {
      const at = `archetype_${i + 1}`;
      const times = crew.archetypes.filter((a) => a.name === n).length;
      same(got[at], times > 1 ? `${n}, twice` : n, `${who}'s archetype ${i + 1}`);
      const rule = BUILD.archetypes.find((a) => a.name === n);
      same(joined(got, `${at}_mechanic`, `${at}_mechanic_more`), rule.for, `${n}'s mechanic on ${who}'s sheet`);
      const abilities = joined(got, ...Array.from({ length: 7 }, (_, k) => `${at}_ability_${k + 1}`));
      for (const h of new Set(crew.archetypes.filter((a) => a.name === n).flatMap((a) => a.have))) {
        const x = rule.abilities.find((y) => y.name === h);
        // Push is +2, and a point more for each time the same one's taken again.
        const said = h === "Push" ? x.text.replace("+2", `+${times + 1}`) : x.text;
        has(abilities, `${h} (${x.cost ?? 1} Aura): ${said}`, `${n}'s ${h}, whole, on ${who}'s sheet`);
      }
    });
    const thing = crew.attuned;
    same(got.attune_1_thing, thing.props ? `${thing.name} (${thing.props})` : thing.name, `${who}'s attuned thing`);
    same([got.attune_1_stage, got.attune_1_catch, got.attune_2_thing], [lower(thing.stage), thing.catch ?? "", ""], `${who}'s attuned thing's stage and Catch, and no second one`);
    const wakes = joined(got, ...Array.from({ length: 6 }, (_, k) => `attune_1_awakening_${k + 1}`));
    // The chapter's italics come off, so Bram's Prone prints as a word.
    for (const w of thing.awakenings) has(wakes, `${w.name}: ${w.text.replace(/\*/g, "")}`, `${who}'s ${w.name}, whole, with no asterisks`);
    // Nothing on a crew sheet's cut short.
    const cutShort = Object.entries(got).filter(([, v]) => typeof v === "string" && v.endsWith("…")).map(([k]) => k);
    same(cutShort, [], `lines cut short on ${who}'s sheet`);
    same(got.attune_1_awakening_1_root, lower(thing.awakenings[0].root), `${who}'s first awakening, its Root ringed`);
    same([got.aspiration, got.aspiration_1], [crew.aspiration.text, false], `${who}'s Aspiration, with nothing in it yet`);
    same(got.bond_1, crew.threads[0].person, `${who}'s first bond`);
    // Each item with its kind and tier, armour on its Root, the attuned thing
    // saying so, nothing past them, their 3 Resources and their keepsake.
    c.items.forEach((it, i) => {
      const at = `item_${i + 1}`;
      same([got[at], got[`${at}_kind`], got[`${at}_tier`], got[`${at}_root`]], [`${it.name}${it.props.length ? ` (${it.props.join(", ")})` : ""}${it.attuned != null ? ", attuned" : ""}${it.when ? `, ${it.when}` : ""}`, it.kind, String(it.tier), it.kind === "armour" ? lower(it.root) : ""], `${who}'s item ${i + 1}, its kind and tier`);
    });
    same(got[`item_${c.items.length + 1}`] ?? "", "", `nothing after ${who}'s items`);
    same([got.resources, got.resource_1, got.keepsake], ["3", "", crew.keepsake], `${who}'s 3 Resources, none said yet, and their keepsake`);
  }
  // From the GM's look, with no book to hand: the sheet the phone already has.
  {
    const crew = book.crew.find((c) => c.id === "bram");
    const c = rootsSheet(crew, [], BUILD);
    const out = await fillSheet({ name: "Bram" }, c, RS.normalCore({}, c), { blank });
    same(out.missing, [], "fields print looked for on Bram's sheet from the GM's look");
    const got = await valuesOf(out.bytes);
    same([got.archetype_1, got.archetype_2], ["Guardian", "Leader"], "Bram's archetypes from the GM's look");
    has(joined(got, ...Array.from({ length: 7 }, (_, k) => `archetype_1_ability_${k + 1}`)), "Stand firm (1 Aura):", "Bram's Stand firm from the GM's look");
  }
  // A state saved before the new core (stacking's, with tracks) prints the
  // way it moves across: every Root full, and a track's Scar on its Root.
  {
    const crew = book.crew.find((c) => c.id === "vesk");
    const c = rootsSheet(crew, [], BUILD);
    const old = RS.freshRoots(c);
    old.tracks.stamina = 4;
    old.scars.stamina = ["a burn across the back"];
    old.asp = 8;
    const { got } = await print("Vesk", c, old);
    same([got.root_body_now, got.root_body_holds, got.root_body_locked, got.root_body_scar_1, got.aspiration_3, got.aspiration_4], ["9", "9", "2", "a burn across the back", true, false], "Vesk saved on stacking: her Body full, her Stamina's Scar on her Body locking a point, and her Aspiration's d8 as 3 points");
  }

  // Vesk part way through a scene: her Body down to 0 and Bloodied, a Scar
  // on it, 2 Toll, Burning, a strained thread, her smoke bomb used and two
  // dice in her Shadow's pool.
  {
    const crew = book.crew.find((c) => c.id === "vesk");
    const c = rootsSheet(crew, [], BUILD);
    const s = RS.normalCore({}, c);
    s.aura = 4;
    s.scars.Body = ["can't go near open flame without freezing"];
    s.scarGrow = { "Body|0": { n: 2 } };
    s.aspPts = 2;
    s.pts.Body = 0;
    s.wound.Body = true;
    s.pts.Mind = 3;
    s.toll = 2;
    s.conditions = [{ name: "Burning", die: 6, kind: "against" }];
    s.threads["Dorrie|We have pulled a dozen jobs. I trust her with my life."] = "strained";
    s.res = ["a smoke bomb"];
    s.soak = { "item|worn leathers": 1 };
    s.pool = [8, 4];
    const { got } = await print("Vesk", c, s, { goal: { text: "Get the Vane collection out of the city", die: 4 } });
    const want = [["aura_now", "4"], ["aura_max", "5"], ["toll", "2"], ["root_body", "11"], ["root_body_dice", "d12 + d10"], ["root_body_locked", "2"], ["root_body_holds", "9"], ["root_body_now", "0"], ["root_body_wound", true], ["root_body_scar_1", "can't go near open flame without freezing"], ["root_body_scar_1_grow_2", true], ["root_body_scar_1_grow_3", false], ["root_body_scar_2", ""],
      ["aspiration_2", true], ["aspiration_3", false],
      ["root_mind_now", "3"], ["root_mind_wound", false], ["root_soul", "0"], ["root_soul_dice", "nothing"],
      ["condition_1", "Burning"], ["condition_1_die", "d6"], ["resource_1", "a smoke bomb"], ["resource_1_used", true], ["resource_2_used", false], ["party_goal", "Get the Vane collection out of the city"], ["party_goal_die", "d4"],
      ["attune_1_awakening_1_root", "body"], ["bond_1_thread_1_strained", true], ["bond_1_thread_1_snapped", false], ["item_1", "worn leathers"], ["item_1_root", "body"], ["item_1_box_1", true], ["item_1_box_2", false]];
    for (const [name, value] of want) same(got[name], value, `${name} on Vesk part way through a scene`);
    const notes = joined(got, "notes_1", "notes_2", "notes_3", "notes_4");
    has(notes, "Trouble that follows her: wanted in three districts, owes the Guild.", "her trouble in Notes");
    has(notes, "Shadow’s pool: d8, d4.", "her Shadow's pool in Notes");
    has(notes, "Bloodied: your Body heals only to 5 till downtime.", "her wound in Notes, with what her Body heals to");
    has(notes, "A hostile thread with The fence: I owe a debt I would rather not discuss.", "her fifth bond's thread in Notes, with one full stop");
  }

  // Vesk with seven Titles: the boxes for where her Body came from stop at
  // VI, so her seventh Title's spread is in Notes, and they all still add up.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "vesk"));
    for (const n of ["third", "fourth", "fifth", "sixth", "seventh"]) crew.titles.push({ text: `The ${n} best climber`, roots: { Body: 5, Mind: 0, Soul: 0 }, permissions: [], boons: [] });
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Vesk", c, RS.normalCore({}, c));
    const boxes = [1, 2, 3, 4, 5, 6].reduce((n, i) => n + Number(got[`root_body_title_${i}`] || 0), 0) + Number(got.root_body_permissions);
    same([got.root_body, boxes + 5], [String(c.roots.Body), c.roots.Body], "Vesk's Body with seven Titles, the boxes and her seventh's 5 in Notes adding up");
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "Title VII, The seventh best climber (Body 5 on your Roots)", "her seventh Title's spread in Notes");
  }

  // A line cut short goes in Notes in full: Vesk's leathers, said to count
  // only on a rooftop.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "vesk"));
    crew.items[0].when = "but only on a rooftop at night, with the wind behind her and a moon to see by";
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Vesk", c, RS.normalCore({}, c));
    if (!got.item_1.endsWith("…")) note(`Vesk's long item line isn't cut short: "${got.item_1}"`);
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "In full: worn leathers, but only on a rooftop at night, with the wind behind her and a moon to see by.", "the leathers in full in Notes");
  }

  // Ash's coal horn holding 2 charge, two of its boxes filled, and Bram's
  // plate made Mythic out of the story, 5 of its 6 soak used.
  {
    const ash = rootsSheet(book.crew.find((c) => c.id === "ash"), [], BUILD);
    const s = RS.normalCore({}, ash);
    s.charge = { "item|a coal horn": 2 };
    const { got } = await print("Ash", ash, s);
    same([got.item_2, got.item_2_kind, got.item_2_tier, got.item_2_box_2, got.item_2_box_3], ["a coal horn", "vessel", "3", true, false], "Ash's coal horn with 2 charge in it");
    const crew = structuredClone(book.crew.find((c) => c.id === "bram"));
    crew.items[0].tier = 6;
    const c = rootsSheet(crew, [], BUILD);
    const s2 = RS.normalCore({}, c);
    s2.soak = { "item|plate armour": 5 };
    const b = (await print("Bram", c, s2)).got;
    same([b.item_1_tier, b.item_1_box_5, b.item_1_box_6], ["6", true, false], "Bram's Mythic plate, 5 of its 6 soak ticked off");
  }

  // Bram with a Boon from before the fixes: it's gone, so it prints nothing,
  // and his permissions are as they were.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "bram"));
    crew.titles[1].boons = [{ lever: "Toughness", name: "Thick skull" }];
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Bram", c, RS.normalCore({}, c));
    same(Object.values(got).some((v) => typeof v === "string" && /Boon|Thick skull/.test(v)), false, "Bram's old Boon nowhere on his sheet");
    same(got[`title_2_permission_${crew.titles[1].permissions.length}`], crew.titles[1].permissions.at(-1).text, "his permissions as they were");
  }

  // Vesk carrying seven, past the six lines, the last in Notes.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "vesk"));
    crew.items.push({ name: "a crowbar", kind: "tool", tier: 2, root: null, props: [], attuned: null }, { name: "a buckler", kind: "guard", tier: 3, root: null, props: [], attuned: null });
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Vesk", c, RS.normalCore({}, c));
    same([got.item_6, got.item_6_kind], ["a crowbar", "tool"], "her sixth item on its line");
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "Item, a buckler (guard, tier 3).", "her seventh in Notes");
  }

  // The longest mechanic in the book, the Bard's, whole over its two lines.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "ash"));
    crew.archetypes[1] = { name: "Bard", id: "a-bard", have: ["Push"] };
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Ash", c, RS.normalCore({}, c));
    same(joined(got, "archetype_2_mechanic", "archetype_2_mechanic_more"), BUILD.archetypes.find((a) => a.name === "Bard").for, "the Bard's mechanic, whole");
  }

  // Rook, made up with more of everything than the paper holds: seven
  // Titles spread across every Root, four archetypes past the three cards
  // (one taken twice), three attuned things, nine items with Mythic armour
  // on every Root, five Resources said, five bonds of four threads, five
  // conditions, every Root wounded and five Scars on each.
  {
    const ord = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
    const titles = ord.map((o, i) => ({
      text: `The ${o} ferry keeper on the drowned river road`,
      roots: { Body: 2, Mind: 2, Soul: 1 },
      permissions: Array.from({ length: i === 6 ? 4 : 6 }, (_, j) => ({ text: `cross ${o} water ${j + 1}`, root: ROOTS[j % 3] })),
    }));
    const made = (name) => ({
      name, id: null,
      for: `${name}: a lantern held up to whatever the crew can't see`,
      trait: { name: `${name}'s calm`, text: "Nothing in the dark ever takes you by surprise." },
      // The Gatewarden's last runs onto the card's seventh line.
      abilities: Array.from({ length: 6 }, (_, k) => ({ name: `${name} ${k + 1}`, cost: k === 5 ? 2 : 1, text: k === 5 && name === "Gatewarden" ? "a long thing it does, that runs on past the end of its line and well onto the one after it, 6" : `a short thing it does, ${k + 1}` })),
      have: Array.from({ length: 6 }, (_, k) => `${name} ${k + 1}`),
    });
    const wakes = (tag, n) => Array.from({ length: n }, (_, k) => ({ name: `${tag} ${k + 1}`, root: ROOTS[k % 3], text: `2 steps when it fits ${k + 1}` }));
    const people = ["Ada", "Bo", "Cy", "Di", "Ed"];
    const base = {
      ...structuredClone(book.crew.find((c) => c.id === "bram")),
      name: "Rook", pronoun: "them", points: { start: 120 }, titles,
      archetypes: [made("Lanternkeeper"), made("Ferryman"), made("Ferryman"), made("Gatewarden"), { name: "Warrior", id: "a-warrior", have: ["Push"] }],
      attuned: [
        { name: "A lantern", props: "Bright", stage: "Perfected", catch: "Smoky", burden: "Heavy", awakenings: [...wakes("Lantern", 6), { name: "Lantern 7", root: "Soul", text: "the dark lifts" }] },
        { name: "A pole", props: null, stage: "Tempered", catch: "Slippery", burden: "Long", awakenings: wakes("Pole", 6) },
        { name: "A bell", props: null, stage: "Awakened", catch: null, burden: null, awakenings: wakes("Bell", 1) },
      ],
      items: ROOTS.flatMap((r) => [1, 2].map((k) => ({ name: `${lower(r)} guard ${k}`, kind: "armour", root: r, tier: 6, props: [], attuned: null, ...(k === 1 && r === "Body" ? { when: "while the lantern's lit and the river's high and the ferry's running late" } : {}) }))),
      keepsake: "a river stone",
      threads: people.map((p, i) => ({ person: p, threads: Array.from({ length: 4 }, (_, k) => ({ text: `${p} and I, ${k + 1}`, kind: (i + k) % 2 ? "hostile" : "bond", whose: null, strained: false })) })),
      trouble: ["owes the ferry guild"],
    };
    const c = rootsSheet(base, [], BUILD);
    const s = RS.normalCore({}, c);
    s.aura = 1;
    s.toll = 3;
    s.scars = { Body: ["one", "two", "three", "four", "five"], Mind: ["six", "seven", "eight", "nine", "ten"], Soul: ["eleven", "twelve", "thirteen", "fourteen", "fifteen"] };
    s.wound = { Body: true, Mind: true, Soul: true };
    s.scarGrow = Object.fromEntries(ROOTS.flatMap((r) => [[`${r}|0`, { n: 3, trait: `${lower(r)} grew` }], [`${r}|1`, { n: 3 }]]));
    s.aspPts = 4;
    s.pts = { Body: 0, Mind: 2, Soul: 1 };
    s.conditions = ["Burning", "Slowed", "Shaken", "Prone", "Blinded"].map((name, k) => ({ name, die: 2 + 2 * k, kind: "against" }));
    s.soak = Object.fromEntries(c.items.filter((it) => it.kind === "armour").map((it) => [it.key, 6]));
    s.res = ["rope", "tar", "salt", "wax", "a lantern wick"];
    s.threads = Object.fromEntries(c.threads.flatMap((p) => p.threads.map((t) => [`${p.person}|${t.text}`, "snapped"])));
    s.notes = "Owes the ferryman a song.";
    s.asp = 8;
    const { got, short } = await print("Rook", c, s, { goal: { text: "Bring the last ferry home", die: 10 } });
    same(short, true, "Rook's Notes running out of room, so the phone says so");
    same([got.title_1, got.title_1_more].join(" "), titles[0].text, "Rook's first Title over two lines");
    same([got.root_soul, got.root_soul_title_6, got.root_soul_permissions], [String(c.roots.Soul), "1", String(c.titles.flatMap((t) => t.permissions).filter((p) => p.root === "Soul").length)], "Rook's Soul, from six Titles' spreads and every permission on it");
    same([got.archetype_1, got.archetype_2, got.archetype_3], ["Lanternkeeper", "Ferryman, twice", "Gatewarden"], "Rook's three archetype cards, the Ferryman taken twice");
    same(joined(got, "archetype_1_trait", "archetype_1_trait_more"), "Lanternkeeper's calm. Nothing in the dark ever takes you by surprise.", "the Lanternkeeper's Trait, its name and what it does");
    same(joined(got, "archetype_1_mechanic", "archetype_1_mechanic_more"), "Lanternkeeper: a lantern held up to whatever the crew can't see", "the Lanternkeeper's mechanic over two lines");
    same([got.archetype_2_ability_1, got.archetype_2_ability_6], ["Ferryman 1 (1 Aura): a short thing it does, 1", "Ferryman 6 (2 Aura): a short thing it does, 6"], "six abilities on the Ferryman's card, a line each");
    same([got.attune_2_thing, got.attune_2_stage, got.attune_2_burden, got.attune_2_awakening_6_root], ["A pole", "tempered", "Long", "soul"], "Rook's second attuned thing, each awakening's Root ringed");
    same([got.item_6, got.item_6_kind, got.item_6_tier, got.item_6_root, got.item_6_box_6], ["soul guard 2", "armour", "6", "soul", true], "Rook's sixth item, Mythic armour on their Soul with all 6 soak used");
    has(got.item_1, "body guard 1, while the", "Rook's first item, cut short");
    same([got.resource_3, got.resource_3_used, got.keepsake], ["salt", true, "a river stone"], "Rook's Resources said, a line each, and their keepsake");
    same([got.root_body_scar_2, got.root_soul_scar_1, got.root_soul_scar_1_grow_3, got.root_mind_wound, got.root_soul_wound, got.toll], ["two", "eleven, its Trait: soul grew", true, true, true, "3"], "Rook's Scars with what they've grown into, wounds and Toll");
    same([got.aspiration_4, got.aspiration_5], [true, false], "Rook's Aspiration on 4 of its 5");
    same([got.bond_4_thread_3_strained, got.bond_4_thread_3_snapped], [true, true], "a snapped thread ticked both ways");
    const notes = joined(got, "notes_1", "notes_2", "notes_3", "notes_4");
    has(notes, "Trouble that follows them: owes the ferry guild.", "Rook's trouble in Notes");
    has(notes, "Owes the ferryman a song.", "Rook's own notes, before what didn't fit");
    if (!/…$/.test(got.notes_4)) note(`Rook's Notes don't end with an ellipsis where they ran out: "${got.notes_4}"`);
  }

  // Every field gets filled by one of them, bar what only a pencil fills.
  // An Aspiration's fifth point is never on a printed sheet, since it comes
  // good the moment it goes in.
  const PENCIL = ["player", "points_banked", "attune_1_material", "attune_2_material", "aspiration_5"];
  same(list.map((f) => f.name).filter((n) => !filled.has(n) && !PENCIL.includes(n)), [], "fields print never fills for anyone");
  console.log("print checked field by field: the crew with their items, Vesk mid-scene and saved on stacking, Ash's charge, Bram's Mythic plate and old Boon, and Rook past the paper's room");
}

// A small static server that answers the way Cloudflare's assets do.
const DIST = join(process.cwd(), "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf" };
async function resolve(path) {
  const clean = decodeURIComponent(path.split("?")[0]);
  for (const candidate of [clean, join(clean, "index.html")]) {
    try {
      const full = join(DIST, candidate);
      if ((await stat(full)).isFile()) return full;
    } catch {}
  }
  return null;
}
const server = createServer(async (req, res) => {
  const file = await resolve(req.url);
  res.writeHead(file ? 200 : 404, { "content-type": TYPES[extname(file ?? ".html")] || "application/octet-stream" });
  res.end(await readFile(file ?? join(DIST, "404.html")));
});
// ZI_PORT runs it on another port, so several worktrees can check at once.
const PORT = Number(process.env.ZI_PORT) || 4174;
await new Promise((r) => server.listen(PORT, r));
const BASE = `http://localhost:${PORT}`;
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

async function phone(extra = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", colorScheme: "dark", ...extra });
  await context.route((url) => url.hostname !== "localhost", (route) => {
    note(`fetched from outside the site: ${route.request().url()}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => note(`page error: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/net::ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(m.text())) note(`console error: ${m.text()}`);
  });
  return { context, page };
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: join(SHOTS, `${name}.png`) });

// The Sheet tab reads at a glance: each part's a fold, with its buttons a tap
// behind it. Open the one a button's in, then tap it.
async function openFold(page, key) {
  const sel = `details[data-open="sh-${key}"]`;
  if (!(await page.$eval(sel, (d) => d.open))) await page.click(`${sel} > summary`);
}
async function inFold(page, sel) {
  const key = await page.$eval(sel, (el) => el.closest("details.cc-fold")?.dataset.open ?? "");
  if (key) await openFold(page, key.replace(/^sh-/, ""));
  await page.click(sel);
}

async function play(page, crewId, name) {
  await page.goto(`${BASE}/characters/`);
  await page.click(`button[data-act="play"][data-c="${crewId}"]`);
  if (name) await page.fill("#cc-name", name);
  await page.click('#cc-dialog button[type="submit"]');
  await page.waitForSelector(".tile[data-r]");
}

// 2. The crew's Roots on the new core (16 Nov). The phone reads each sheet
// off the chapter (book.json's crew, which the build checks adds up), so each
// Root's tile is its steps, the dice they make and the points it's got, and
// each Root's tracker is its points out of what it holds (its number less
// what its awakenings lock), with a plate for every box of armour on it.
if (part("2")) {
  same(book.crew.length, 6, "the crew in book.json");
  const { context, page } = await phone();
  for (const base of book.crew) {
    const c = rootsSheet(base, [], BUILD);
    const s = RS.freshCore(c);
    await play(page, base.id);
    same(await page.$$eval(".cc-roots .tile[data-r]", (els) => els.map((el) => [el.dataset.r, el.querySelector(".tile-steps").textContent, el.querySelector(".tile-die").textContent, el.querySelector(".tile-pts").textContent])), ROOTS.map((r) => [r, c.roots[r] ? `${c.roots[r]} ${c.roots[r] === 1 ? "step" : "steps"}` : "nothing yet", c.roots[r] ? diceLabel(stepsToDice(c.roots[r])) : "a d2", `${RS.capOf(c, s, r)} of ${RS.capOf(c, s, r)} left`]), `${base.name}'s Roots`);
    same(await page.$$eval(".tile[data-s]", (els) => els.length), 0, `no specialty tiles for ${base.name}`);
    same(await page.$$eval(".cc-track .is-trk .v", (els) => els.map((e) => e.textContent)), ROOTS.map((r) => `${RS.capOf(c, s, r)}/${RS.capOf(c, s, r)}`), `${base.name}'s points to start with`);
    same(await page.$$eval(".cc-track .is-trk .cc-pips", (els) => els.map((e) => [e.querySelectorAll("i.on").length, e.querySelectorAll("i.lock").length])), ROOTS.map((r) => [RS.capOf(c, s, r), RS.lockedOf(c, s)[r]]), `${base.name}'s pips, full and locked`);
    same(await page.textContent('.cc-stat[data-p="aura"] .v'), `${c.numbers.aura}/${c.numbers.aura}`, `${base.name}'s Aura to start with`);
    same(await page.$$eval(".cc-stat.t-body .zd-plate", (els) => els.length), c.items.filter((a) => a.kind === "armour" && a.root === "Body").reduce((t, a) => t + a.tier, 0), `${base.name}'s armour's soak on their Body, a plate a point`);
    same(await page.$$eval(".cc-stat.t-mind .zd-plate", (els) => els.length), c.items.filter((a) => a.kind === "armour" && a.root === "Mind").reduce((t, a) => t + a.tier, 0), `${base.name}'s armour's soak on their Mind`);
    same(await page.textContent('.cc-stat[data-p="res"] .v'), `${RS.resOf(c)}/${RS.resOf(c)}`, `${base.name}'s Resources, all there`);
    same(await page.$$eval(".cc-stat.t-aura .cc-charge", (els) => els.map((e) => e.textContent)), c.items.filter((x) => x.kind === "vessel").map((v) => `${v.name.replace(/^(a|an|her|his) /i, "").replace(/^./, (x) => x.toUpperCase())} 0/${v.tier}`), `${base.name}'s vessels, empty`);
    same(await page.$$eval(".cc-stat.t-stamina, .cc-stat.t-confidence, .cc-stat.t-resolve", (els) => els.length), 0, `no tracks for ${base.name}`);
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")));
  same([saved.v, saved.characters.length, saved.characters.every((x) => x.state?.v === 5 && !x.state.tracks && !x.state.boxes)], [1, 6, true], "the saved list's version and size, every one on the 17 Nov fixes");
  console.log(`crew: ${book.crew.length} sheets checked against the chapter on the new core`);
  await context.close();
}

// The play screen's pieces, the same for every part that plays.
function tableOf(page) {
  const t = {
    aura: () => page.textContent('.cc-stat[data-p="aura"] .v'),
    // A Root's points out of what it holds, as its tracker says them, and
    // all three.
    pts: (r) => page.textContent(`.cc-stat[data-p="${r}"] .v`),
    all: () => page.$$eval(".cc-track .is-trk .v", (els) => els.map((e) => e.textContent)),
    mood: (r) => page.$eval(`.cc-stat[data-p="${r}"]`, (el) => el.querySelector(".cc-mood")?.textContent ?? ""),
    closed: () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open),
    body: () => page.textContent("#cc-dialog .dlg-body"),
    live: () => page.textContent("#cc-dialog .cc-dice"),
    costs: () => page.$eval("#cc-dialog .cc-costs", (el) => el.textContent).catch(() => ""),
    outs: () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)),
    rolled: () => page.waitForSelector("#cc-dialog .res .res-out"),
    // What each telegraph did, once When it lands has rolled.
    hits: () => page.$$eval("#cc-dialog li.cc-hit", (els) => els.map((el) => (el.classList.contains("is-stopped") ? "Stopped" : "Gets through"))),
    landed: () => page.waitForFunction(() => [...document.querySelectorAll("#cc-dialog li.cc-hit")].some((li) => /Stopped by|It got through/.test(li.textContent))),
    paid: () => page.$$eval("#cc-dialog .cc-paid", (els) => els.map((e) => e.textContent)),
    done: async () => { await page.click('#cc-dialog .dlg-foot button[data-act="close"]'); await t.closed(); },
    shut: async () => { await page.click('#cc-dialog .dlg-head button[data-act="close"]'); await t.closed(); },
    // A tracker's panel, opened (or shut) if it isn't already.
    panel: async (k, open = true) => {
      if ((await page.getAttribute(`.cc-stat[data-p="${k}"]`, "aria-expanded")) !== String(open)) await page.click(`.cc-stat[data-p="${k}"]`);
    },
    // A roll from a Root's tile: what's woken by its key, a Root brought in
    // on a permission's key or the player's own words and paid for, what
    // it's up against, then the dice.
    roll: async (root, { awk = [], bring = [], foes = [], dice = [], go = true } = {}) => {
      await page.click(`.cc-roots .tile[data-r="${root}"]`);
      for (const k of awk) await page.click(`#cc-dialog .cc-pick[data-act="awk"][data-k="${k}"]`);
      for (const b of bring) {
        await page.click(`#cc-dialog button[data-act="bring"][data-g="main"][data-v="${b.root}"]`);
        if (b.perm) await page.click(`#cc-dialog button[data-act="bperm"][data-g="main"][data-r="${b.root}"][data-v="${b.perm}"]`);
        if (b.own) {
          if (!(await page.$eval(`#cc-dialog details[data-open="bown-main-${b.root}"]`, (d) => d.open))) await page.click(`#cc-dialog details[data-open="bown-main-${b.root}"] > summary`);
          await page.fill(`#cc-dialog input[data-in="bown"][data-g="main"][data-r="${b.root}"]`, b.own);
        }
        if (b.pay) await page.click(`#cc-dialog button[data-act="bpay"][data-g="main"][data-r="${b.root}"][data-v="${b.pay}"]`);
      }
      for (const d of foes) await page.click(`#cc-dialog button[data-act="foe-add"][data-v="${d}"]`);
      if (!go) return;
      await page.evaluate((d) => window.ziCompanion.setDice(d), dice);
      await page.click('#cc-dialog button[data-act="go"]');
      await t.rolled();
    },
    // When it lands: each telegraph's die at a Root (and how many hits it
    // is), then the dice that roll: each Root's split by its count, and
    // Defend's Root on top when it was their action.
    lands: async (list, { defend = null, counts = {}, dice = [] } = {}) => {
      await page.click('.tile[data-act="defence"]');
      for (const [d, at, hits = 1] of list) {
        await page.click(`#cc-dialog button[data-act="d-add-at"][data-v="${at}"]`);
        await page.click(`#cc-dialog button[data-act="d-add"][data-v="${d}"]`);
        if (hits > 1) await page.click(`#cc-dialog li.cc-inc:last-child button[data-act="d-hits"][data-v="${hits}"]`);
      }
      if (defend) {
        await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
        await page.click(`#cc-dialog button[data-act="root"][data-g="defend"][data-v="${defend}"]`);
      }
      for (const [g, n] of Object.entries(counts)) for (let i = 0; i < n; i++) await page.click(`#cc-dialog button[data-act="step"][data-n="count"][data-i="${g}"][data-d="1"]`);
      await page.evaluate((d) => window.ziCompanion.setDice(d), dice);
      await page.click('#cc-dialog button[data-act="d-go"]');
      await t.landed();
    },
    // Finish downtime, past its warnings if it has any.
    finish: async () => {
      await page.click('#cc-dialog button[data-act="dt"][data-do="finish"]');
      if (await page.isVisible('#cc-dialog button[data-act="dt"][data-do="finish"]')) await page.click('#cc-dialog button[data-act="dt"][data-do="finish"]');
      await t.closed();
    },
    pay: (what, j = 0, extra = "") => page.click(`#cc-dialog button[data-act="d-pay"][data-j="${j}"][data-what="${what}"]${extra}`),
  };
  return t;
}

// 3. Vesk at the table, on the new core: her Body in one tap, her hook's
// awakening and Aura on it, her Mind brought in on a permission and paid
// for, a split, a roll that pays Aura and a point of Mind, Again, a reload
// and no signal, a tie, two guards at once, her Shadow's Push in Aura and her
// shadow pool, and no Roll again with no Soul to pay it.
if (part("3")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await page.goto(`${BASE}/characters/`);
  await shot(page, "1-characters");
  await play(page, "vesk", "Vesk");
  await shot(page, "2-play");
  const rootTile = (r) => `.cc-roots .tile[data-r="${r}"]`;
  const tileOf = (r) => page.$eval(rootTile(r), (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`);
  const HOOK = "awk|0|Anywhere I can throw a hook";
  const BUILT = "perm|1|0"; // know how a lock's built, on her Mind
  same([await tileOf("Body"), await tileOf("Mind"), await tileOf("Soul")], ["11 steps · d12 + d10", "5 steps · d10", "nothing yet · a d2"], "her three Roots as tiles");
  same([...(await t.all()), await t.aura()], ["10/10", "5/5", "0/0", "5/5"], "her points and Aura to start with");
  same(await t.mood("Soul"), "exposed", "her Soul at 0, exposed");
  same(await page.$$eval(".tile-again", (els) => els.length), 0, "no Again till she's rolled");

  // Her lock in one tap: her Body at full, and nothing to pay.
  await page.click(rootTile("Body"));
  has(await t.live(), "11 steps, d12 + d10", "her Body in one tap");
  same([await page.textContent("#dlg-title"), await t.costs(), await page.isDisabled('#cc-dialog button[data-act="go"]')], ["Body", "", false], "named for its Root, free, and ready to roll");
  same(await page.$$eval("#cc-dialog .cc-pick[data-act='use']", (els) => els.length), 0, "nothing on her sheet to tap in and count");
  // One item a roll, the one doing the work: her Proven set of picks is 3
  // more on a lock, her armour never shows, and nothing's on till she says.
  same(await page.$$eval('#cc-dialog .cc-pick[data-act="item"]', (els) => els.map((e) => [e.dataset.k, e.getAttribute("aria-pressed"), e.querySelector("small").textContent])), [["item|a knife", "false", "+2"], ["item|soft-soled boots", "false", "+3"], ["item|a set of picks", "false", "+3"], ["item|her grappling line", "false", "+2"]], "her weapon and tools, none on, and never her leathers");
  await page.click('#cc-dialog .cc-pick[data-act="item"][data-k="item|a set of picks"]');
  has(await t.live(), "14 steps, 2d12 + d4", "her Proven set of picks on a lock, 3 more");
  same(await page.textContent("#dlg-title"), "Body, with a set of picks", "named for the item doing the work");
  await page.click('#cc-dialog .cc-pick[data-act="item"][data-k="item|a set of picks"]');
  has(await t.live(), "11 steps, d12 + d10", "and off again");
  await shot(page, "3-lock");
  // Her hook's awakening: its line's the item doing the work, a tier 2 tool,
  // and the awakening's 2 steps, and 2 more for each Aura on it.
  await page.click(`#cc-dialog .cc-pick[data-act="awk"][data-k="${HOOK}"]`);
  has(await t.live(), "15 steps, 2d12 + d6", "her grappling line and its awakening, 2 and 2");
  same(await page.getAttribute('#cc-dialog .cc-pick[data-act="item"][data-k="item|her grappling line"]', "aria-pressed"), "true", "her grappling line on with its awakening");
  same(await page.textContent("#dlg-title"), "Body, with Anywhere I can throw a hook", "named for what's woken");
  await page.click(`#cc-dialog button[data-act="step"][data-n="awk"][data-i="main|${HOOK}"][data-d="1"]`);
  has(await t.live(), "17 steps, 2d12 + d10", "1 Aura on it, 2 more");
  has(await t.costs(), "1 Aura", "and it costs 1 Aura");
  await page.click(`#cc-dialog button[data-act="step"][data-n="awk"][data-i="main|${HOOK}"][data-d="-1"]`);
  has(await t.live(), "15 steps", "and back off");
  // Her Mind brought in: it waits on the permission that explains it, then
  // all 5 of it goes on, for a point of Mind or 3 Aura.
  await page.click('#cc-dialog button[data-act="bring"][data-g="main"][data-v="Mind"]');
  same([await page.isDisabled('#cc-dialog button[data-act="go"]'), await page.textContent("#cc-dialog .dlg-foot .cc-warn")], [true, "Name the permission that brings in your Mind."], "her Mind waiting on a permission");
  same(await page.$$eval('#cc-dialog button[data-act="bperm"][data-r="Mind"]', (els) => els.slice(0, 2).map((e) => e.dataset.v)), ["perm|1|0", "perm|1|2"], "her Mind's own permissions first");
  await page.click(`#cc-dialog button[data-act="bperm"][data-r="Mind"][data-v="${BUILT}"]`);
  has(await t.live(), "20 steps, 3d12 + d4", "her Mind's 5 on top of her Body and her hook, the book's vault door with her line in place of her picks");
  has(await t.costs(), "a point of Mind", "paid with a point of Mind");
  same(await page.textContent("#dlg-title"), "Body, with Mind and Anywhere I can throw a hook", "named for what's brought in");
  await page.click('#cc-dialog button[data-act="bpay"][data-r="Mind"][data-v="aura"]');
  has(await t.costs(), "3 Aura", "or 3 Aura");
  await page.click('#cc-dialog button[data-act="bpay"][data-r="Mind"][data-v="pt"]');
  await page.click(`#cc-dialog button[data-act="bperm"][data-r="Mind"][data-v="${BUILT}"]`);
  await page.click('#cc-dialog details[data-open="bown-main-Mind"] > summary');
  await page.fill('#cc-dialog input[data-in="bown"][data-r="Mind"]', "Dorrie’s read a room in a glance");
  same(await page.isDisabled('#cc-dialog button[data-act="go"]'), false, "a permission in her own words brings it in too");
  await page.fill('#cc-dialog input[data-in="bown"][data-r="Mind"]', "");
  await page.click(`#cc-dialog button[data-act="bperm"][data-r="Mind"][data-v="${BUILT}"]`);
  // Splitting any way: five dice from 20 steps.
  if (!(await page.$eval('#cc-dialog details[data-open="rc-dice"]', (d) => d.open))) await page.click('#cc-dialog details[data-open="rc-dice"] > summary');
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-i="main"][data-d="1"]');
  has(await t.live(), "20 steps, 5d8", "five dice, the most even way first");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-i="main"][data-d="-1"]');
  has(await t.live(), "20 steps, 3d12 + d4", "back to the table's four");
  // Against a guard's d8: a 12 on its top face beats it, and three under.
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([12, 3, 5, 2, 7]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  same(await t.outs(), ["Beat it", "Under", "Under", "Under"], "her three d12s and a d4 against the guard's 7");
  has(await page.textContent("#cc-dialog .cc-topnote"), "One die won and a top face, so 2 Aura. You’re on 7 while you’re acting, past your 5.", "Aura for a win and a top face, past her 5 while she's acting");
  same(await page.$$eval('#cc-dialog button[data-act="reroll"]', (els) => els.length), 0, "no Roll again with no Soul to pay for it");
  has(await page.textContent("#cc-dialog .cc-left"), "Mind 4/5", "a point of Mind paid");
  await t.done();
  same([...(await t.all()), await t.aura()], ["10/10", "4/5", "0/0", "7/5"], "her points and Aura after the roll");
  has(await page.textContent(".tile-again"), "Body, with Mind and Anywhere I can throw a hook", "Again names it");
  has(await page.textContent(".tile-again"), "20 steps, 3d12 + d4, a point of Mind", "Again's steps and what it costs");
  // Finishing acting drops what's over her maximum.
  await t.panel("aura");
  await page.click('#cc-panel button[data-act="acting"][data-v="0"]');
  same(await t.aura(), "5/5", "finishing acting drops her to 5");
  await t.panel("aura", false);
  // Again puts the same in, and a reload and no signal keep it all.
  await page.click(".tile-again");
  has(await t.live(), "20 steps, 3d12 + d4", "Again's roll card");
  same(await page.$eval(`#cc-dialog button[data-act="bperm"][data-r="Mind"][data-v="${BUILT}"]`, (el) => el.getAttribute("aria-pressed")), "true", "with her Mind's permission in");
  same(await page.getAttribute('#cc-dialog .cc-pick[data-act="item"][data-k="item|her grappling line"]', "aria-pressed"), "true", "and her grappling line, the item it had");
  await t.shut();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over Vesk"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-r]");
  same([...(await t.all()), await t.aura()], ["10/10", "4/5", "0/0", "5/5"], "her points after a reload, offline");
  has(await page.textContent(".tile-again"), "20 steps", "Again after a reload, offline");
  await page.click('.cc-tabs a[data-t="rules"]');
  has(await page.textContent(".cc-rules"), "Your Points", "the rules on tap, offline");
  has(await page.textContent(".cc-rules"), "Bringing In a Root", "bringing in a Root on tap");
  await page.click('.cc-tabs a[data-t="play"]');
  await context.setOffline(false);
  // A tie: theirs, unless she pays 1 Aura, and a bought tie pays nothing.
  await t.roll("Body", { foes: [6], dice: [6, 1, 6] });
  same(await t.outs(), ["Tie", "Under"], "her 6 tying their 6");
  await page.click('#cc-dialog button[data-act="win-tie"]');
  same(await t.outs(), ["Tie, won for 1 Aura", "Under"], "the tie bought");
  has(await page.textContent("#cc-dialog .cc-log"), "A tie you bought doesn’t pay Aura back", "a bought tie pays nothing");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  same(await t.outs(), ["Tie", "Under"], "Undo takes the bought tie back");
  await t.done();
  // Two guards at once: a die at each, read on its own.
  await t.roll("Body", { foes: [6, 6], go: false });
  if (!(await page.$eval('#cc-dialog details[data-open="rc-dice"]', (d) => d.open))) await page.click('#cc-dialog details[data-open="rc-dice"] > summary');
  await page.click('#cc-dialog button[data-act="aim"][data-i="1"][data-j="1"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 2, 4, 1]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  same(await t.outs(), ["Beat it", "Beat it"], "a die at each guard, each beating his own roll");
  has(await page.textContent("#cc-dialog .cc-topnote"), "2 dice won, so 2 Aura", "a win at each pays 1 each");
  // Her Shadow's Push: +3 on a die, for 1 Aura.
  await page.click('#cc-dialog button[data-act="push"]');
  await page.click('#cc-dialog button[data-act="pick"][data-i="1"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Paid 1 Aura for Shadow’s Push: +3 on the d10, so it’s 5", "her Push paid in Aura");
  // Getting into hiding fills her pool, for a later roll.
  await page.click('#cc-dialog button[data-act="hid"]');
  await t.done();
  has(await page.textContent(".cc-pool"), "d12 and d10", "her shadow pool");
  await page.click(rootTile("Mind"));
  await page.click('#cc-dialog button[data-act="pool"][data-i="0"][data-v="steps"]');
  has(await t.live(), "11 steps, d12 + d10", "her Mind and a shadow d12 as 6 steps");
  await t.shut();
  await shot(page, "4-after");
  console.log("Vesk: her Body in one tap, her hook, her Mind brought in, a split, Aura and a point of Mind paid, Again, offline, a tie, two guards, her Push and her pool");
  await context.close();
}

// 3c. Bram when it lands, the book's own Defend: three d8s at Wren's Body
// intercepted onto his, his Body for the landing with his Trusty shield on
// it, a guard once a landing, and his Body again for the Defend, and all
// three stopped. Then blows on his Body alone, his armour soaking first: his
// plate soaking one, 2 for 1 on his Soul, a deadly telegraph's three hits all
// at once, soak gone and a point off his Body, soak back at New scene, and
// Stand firm.
if (part("3c")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await play(page, "bram", "Bram");
  const bram = rootsSheet(book.crew.find((c) => c.id === "bram"), [], BUILD);
  const soak = bram.items.filter((x) => x.kind === "armour" && x.root === "Body").reduce((n, x) => n + x.tier, 0);
  const used = () => page.$$eval(".cc-stat.t-body .zd-plate.on", (els) => els.length);
  same([...(await t.all()), soak], ["7/7", "3/3", "4/4", 5], "Bram's points, his hammer locking 2 of his Body, and 5 soak on it, his plate's 3 and his helmet's 2");
  await t.lands([[8, "Body"], [8, "Body"], [8, "Body"]], { defend: "Body", dice: [9, 5, 3, 6, 7, 5, 2] });
  has(await page.textContent("#cc-dialog .dlg-head"), "You rolled your Body for 11 steps, with your shield and Defend on your Body for 9 steps", "his Body with his shield on it, and his Body again");
  same(await t.hits(), ["Stopped", "Stopped", "Stopped"], "four dice for three blows, all stopped");
  has(await page.textContent("#cc-dialog .cc-topnote"), "3 dice stopped one each and a top face, so 4 Aura", "3 stopped and the d6's top face");
  await t.done();
  same(await t.all(), ["7/7", "3/3", "4/4"], "nothing got through");
  // His shield's on When it lands by itself, on his Body's roll, and comes
  // off with a tap. His war hammer never shows there.
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add-at"][data-v="Body"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  same(await page.$$eval('#cc-dialog .cc-pick[data-act="item"]', (els) => els.map((e) => [e.dataset.g, e.dataset.k, e.getAttribute("aria-pressed")])), [["Body", "item|a shield", "true"]], "his shield on his Body's roll, and nothing else");
  has(await t.live(), "your Body d12 + d10", "his Body and his shield, 11 steps");
  await page.click('#cc-dialog .cc-pick[data-act="item"][data-k="item|a shield"]');
  has(await t.live(), "your Body d12 + d6", "and off");
  await t.shut();
  // Two blows on his Body alone: his armour soaks the first, and he takes
  // the second 2 for 1 on his Soul.
  await t.lands([[8, "Body"], [8, "Body"]], { dice: [2, 1, 6, 7] });
  same(await t.hits(), ["Gets through", "Gets through"], "both through");
  same(await page.textContent('#cc-dialog button[data-act="d-pay"][data-j="0"][data-what="hit"]'), "Your armour soaks it: 5 to 4", "his armour soaking first");
  await t.pay("hit", 0);
  await t.pay("two", 1, '[data-on="Soul"]');
  same(await t.paid(), ["Your plate armour soaked one", "2 for 1, Soul to 2"], "his plate soaking one, and 2 for 1");
  await t.done();
  same([...(await t.all()), await used()], ["7/7", "3/3", "2/4", 1], "his Body untouched, a point of soak used, his Soul on 2");
  // A deadly telegraph, a d10 that's 3 hits, all at once: his plate soaks
  // the 2 it's got left and his helmet one.
  await t.lands([[10, "Body", 3]], { dice: [1, 1, 9] });
  has(await page.textContent("#cc-dialog .cc-hits"), "3 hits to settle", "three hits from one die");
  await page.click('#cc-dialog button[data-act="d-pay"][data-j="0"][data-what="all"]');
  same(await t.paid(), ["Your plate armour soaked 2, your helmet soaked one"], "his armour soaking all three");
  await t.done();
  same([...(await t.all()), await used()], ["7/7", "3/3", "2/4", 4], "his Body still untouched, 1 soak left");
  // Two more: his helmet's last, then a point off his Body.
  await t.lands([[6, "Body", 2]], { dice: [1, 1, 5] });
  await page.click('#cc-dialog button[data-act="d-pay"][data-j="0"][data-what="all"]');
  same(await t.paid(), ["Your helmet soaked one, Body to 6"], "soak gone, then his Body");
  await t.done();
  same([...(await t.all()), await used()], ["6/7", "3/3", "2/4", 5], "his Body on 6, every plate used");
  has(await page.textContent('.cc-stat[data-p="Body"]'), "soak 0 of 5", "his Body's tracker says it's got no soak left");
  // New scene: he rests, and his armour's soak is all back.
  await page.evaluate(() => window.ziCompanion.setDice([12, 6, 8]));
  await page.click('button[data-act="scene"]');
  await page.click('#cc-dialog button[data-act="rest-go"]');
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await t.closed();
  same([...(await t.all()), await used()], ["7/7", "3/3", "4/4", 0], "a new scene: rested, and his soak back");
  // Stand firm: the next two hits take 1 point between them, and his armour
  // soaks that one first.
  await page.click('.cc-abilities button[data-act="ability"]:has-text("Stand firm")');
  await page.click('#cc-dialog button[data-act="pay-way"]');
  await t.closed();
  await t.lands([[6, "Body"], [6, "Body"]], { dice: [1, 1, 5, 5] });
  await t.pay("firm", 0);
  await t.pay("firm", 1);
  same(await t.paid(), ["Stood firm, your plate armour soaked one", "Stood firm, nothing"], "two hits standing firm, 1 between them, soaked");
  await t.done();
  same([...(await t.all()), await used()], ["7/7", "3/3", "4/4", 1], "Stand firm costing one soak for two hits");
  console.log("Bram: his Defend with his shield stopping three, his armour soaking first, 2 for 1, a deadly telegraph's hits all at once, soak back at New scene and Stand firm");
  await context.close();
}

// 3d. Built characters at the table: Bram from the crew saved as his own, a
// random one, a Toughness Boon taking the first hit, a Gambler's flips paid
// in Aura, and a Healer's heal with Toll.
if (part("3d")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  const put = (id, name, build, state = {}) => page.evaluate(([id, name, build, state]) => {
    const list = JSON.parse(localStorage.getItem("zi-characters") ?? "null") ?? { v: 1, characters: [] };
    list.characters.push({ id, crew: "own", name, hash: "own", build, state });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  }, [id, name, build, state]);
  const open = async (id) => {
    await page.goto(`${BASE}/characters/?c=${id}`);
    await page.waitForSelector(".tile[data-r]");
  };
  const tiles = () => page.$$eval(".cc-roots .tile[data-r]", (els) => els.map((el) => `${el.dataset.r} ${el.querySelector(".tile-steps").textContent}`));
  const want = (c) => ROOTS.map((r) => `${r} ${c.roots[r] ? `${c.roots[r]} ${c.roots[r] === 1 ? "step" : "steps"}` : "nothing yet"}`);
  await page.goto(`${BASE}/characters/`);

  // Bram from the crew, saved as his own: his order is his Soul, 4 steps.
  const bram = book.crew.find((c) => c.id === "bram");
  await put("own-bram", "Bram", fromCrew(bram, BUILD));
  await open("own-bram");
  same(await tiles(), want(rootsSheet(bram, [], BUILD)), "Bram from the crew, saved and played");
  await t.roll("Soul", { foes: [6], dice: [7, 4] });
  same(await t.outs(), ["Beat it"], "his order, his Soul's d8, against the guard's 4");
  await t.done();

  // A random one saves and plays its biggest Root.
  const rand = randomBuild(BUILD, book.crew);
  await put("own-rand", rand.name || "Random", rand);
  await open("own-rand");
  const rc = rootsSheet(sheetOf({ id: "own-rand", name: rand.name, build: rand }, BUILD), [], BUILD);
  same(await tiles(), want(rc), "a random character's three Roots on the play screen");
  const big = ROOTS.reduce((a, r) => (rc.roots[r] > rc.roots[a] ? r : a), "Body");
  await t.roll(big, { foes: [4], dice: [3, 3, 3, 3, 2] });
  has(await page.textContent("#cc-dialog .cc-small"), `${rc.roots[big]} steps`, "its biggest Root at full");
  await t.done();

  // Vesk built with a Toughness Boon and saved on the new core: Boons are
  // gone, so it's said once in Yours to choose with the 2 points it gave
  // back, nothing on the play screen gives it, and her leathers soak instead.
  const vesk = fromCrew(book.crew.find((c) => c.id === "vesk"), BUILD);
  vesk.titles[0].boons = [{ lever: "Toughness", name: "Iron Lungs", on: "" }];
  await put("own-iron", "Vesk", vesk, { v: 4 });
  await open("own-iron");
  has(await page.textContent(".cc-choose"), "Iron Lungs, her Toughness Boon, is gone, since Boons are. It gave back the 2 points it cost, to spend on her sheet.", "her Boon gone, said once with what it gave back");
  const was = await t.pts("Body");
  await t.lands([[8, "Body"]], { dice: [2, 1, 7] });
  same(await page.$$eval('#cc-dialog button[data-what="tough"]', (els) => els.length), 0, "no Toughness when it lands");
  await t.pay("hit");
  // Her armour soaks it, if her build's got any, and otherwise it's a point.
  const iron = rootsSheet(sheetOf({ id: "own-iron", name: "Vesk", build: vesk }, BUILD), [], BUILD);
  const leathers = iron.items.find((x) => x.kind === "armour" && x.root === "Body");
  same(await t.paid(), [leathers ? `Your ${leathers.name.replace(/^(a|an|her) /i, "")} soaked one` : `Body to ${Number(was.split("/")[0]) - 1}`], "the hit soaked first, with no Toughness");
  await t.done();
  await page.click('.cc-choose li:has-text("Iron Lungs") button[data-act="choose"]');
  await page.reload();
  await page.waitForSelector(".tile[data-r]");
  same(await page.$$eval('.cc-choose li:has-text("Iron Lungs")', (els) => els.length), 0, "Got it puts it away for good");

  // A Gambler flips a die once a round for free, theirs or yours, and pays
  // 2 Aura for Double or nothing, flipping every die of his.
  const gil = fromCrew(bram, BUILD);
  gil.archs = ["Gambler", "Leader"];
  gil.have = [["Double or nothing"], ["Push"]];
  gil.name = "Gil";
  await put("own-gil", "Gil", gil);
  await open("own-gil");
  await t.roll("Body", { foes: [10], dice: [9, 3, 7] });
  await page.click('#cc-dialog button[data-act="flip"]');
  await page.click('#cc-dialog .cc-them button[data-act="pick"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped their d10, so it’s a 4 now", "their 7 on a d10 flipped to a 4");
  same(await page.$$eval('#cc-dialog button[data-act="flip"]', (els) => els.length), 0, "the free flip used on this roll");
  if (!(await page.$eval('#cc-dialog details[data-open="abil"]', (d) => d.open))) await page.click('#cc-dialog details[data-open="abil"] > summary');
  await page.click('#cc-dialog .cc-how button[data-act="ability"]:has-text("Double or nothing")');
  await page.click('#cc-dialog button[data-act="pay-way"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Paid 2 Aura for Double or nothing", "Double or nothing paid in Aura");
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped every die of yours", "and every die flipped");
  await t.done();
  // Hot streak (18 Nov): 4 Aura once a scene, then every flip's free till the
  // round ends, never the same die twice.
  const hot = { ...gil, have: [["Hot streak"], ["Push"]], name: "Hot" };
  await put("own-hot", "Hot", hot);
  await open("own-hot");
  await t.roll("Body", { foes: [10], dice: [9, 3, 7] });
  await page.click('#cc-dialog button[data-act="flip"]');
  await page.click('#cc-dialog button.cc-pickdie[data-i="1"]');
  same(await page.$$eval('#cc-dialog button[data-act="flip"]', (els) => els.length), 0, "the free flip used before the streak");
  if (!(await page.$eval('#cc-dialog details[data-open="abil"]', (d) => d.open))) await page.click('#cc-dialog details[data-open="abil"] > summary');
  const auraWas = Number((await t.aura()).split("/")[0]);
  await page.click('#cc-dialog .cc-how button[data-act="ability"]:has-text("Hot streak")');
  await page.click('#cc-dialog button[data-act="pay-way"]');
  const auraPaid = auraWas - Number((await t.aura()).split("/")[0]);
  has(await page.textContent("#cc-dialog .cc-log"), "You’re on a Hot streak", "Hot streak paid and on");
  await page.click('#cc-dialog button[data-act="flip"]:has-text("Hot streak")');
  await page.click('#cc-dialog button.cc-pickdie[data-i="1"]');
  has(await page.textContent("#cc-dialog .cc-note"), "one you haven’t flipped yet", "the same die can't be flipped twice");
  await page.click('#cc-dialog button.cc-pickdie[data-i="0"]');
  await page.click('#cc-dialog button[data-act="flip"]');
  await page.click('#cc-dialog .cc-them button[data-act="pick"]');
  same((await page.textContent("#cc-dialog .cc-log")).match(/Flipped /g)?.length, 3, "three flips, two of them on the streak");
  same([auraPaid, auraWas - Number((await t.aura()).split("/")[0])], [4, 4], "4 Aura for the streak, and nothing for its flips");
  await t.done();

  // A Healer: a heal's her Root unsplit, and it heals what it rolls. Healing
  // herself gives her no Toll, and Vesk's heal from someone else gives her 1,
  // and the next one loses 5.
  const hale = fromCrew(book.crew.find((c) => c.id === "isolde"), BUILD);
  hale.archs = ["Healer", "Oracle"];
  hale.have = [["Push"], ["Push"]];
  hale.name = "Hale";
  await put("own-hale", "Hale", hale);
  await open("own-hale");
  const full = await t.pts("Mind");
  const cap = Number(full.split("/")[1]);
  await t.panel("Mind");
  // Her coat soaks its share first, if her build's got it.
  const haleSoak = rootsSheet(sheetOf({ id: "own-hale", name: "Hale", build: hale }, BUILD), [], BUILD).items.filter((x) => x.kind === "armour" && x.root === "Mind").reduce((n, x) => n + x.tier, 0);
  for (let i = 0; i < 6 + haleSoak; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Mind"]:not([data-on])');
  same(await t.pts("Mind"), `${cap - 6}/${cap}`, "her Mind down by 6, after her coat's soak");
  await t.panel("Mind", false);
  await page.click('.cc-roots .tile[data-r="Soul"]');
  await page.click('#cc-dialog button[data-act="heal-on"][data-v="1"]');
  same([await t.live().then((x) => x.includes("7 steps, d12 + d2")), await page.$$eval('#cc-dialog [data-act="foe-add"]', (els) => els.length)], [true, 0], "a heal: her Soul unsplit, with nothing to beat");
  await page.evaluate(() => window.ziCompanion.setDice([4, 2]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .cc-healnote");
  has(await page.textContent("#cc-dialog .cc-healnote"), "It heals 6", "the heal's 4 and 2");
  has(await page.textContent("#cc-dialog .cc-topnote"), "top face, so 1 Aura", "a heal's top face pays");
  await page.click('#cc-dialog .cc-healnote button[data-act="heal"]');
  await page.click('#cc-dialog button[data-act="heal-take"]');
  await t.closed();
  same([await t.pts("Mind"), await page.$$eval(".cc-tag.is-toll", (els) => els.length)], [full, 0], "her Mind healed whole, and no Toll on herself");
  console.log("built: Bram from the crew, a random one, a Toughness Boon, a Gambler's flips and a Healer's heal");
  await context.close();
}

// 4. Points, wounds, Scars and rest. Vesk spending and getting a point back,
// her Body hit down to 0, Bloodied (healing only to half), a Scar written as
// a Catch that locks a point, leaving the scene, the rest at the end of it,
// 2 for 1, heals with Toll, and taking a breath. Dorrie's court clothes on
// her Mind against a lie, and Isolde's Body at 0 Bloodied by the first hit,
// her Blaze and her choosing to die.
if (part("4")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await play(page, "vesk", "Vesk");
  await t.panel("Body");
  await page.click('#cc-panel button[data-act="spend"][data-r="Body"]');
  same(await t.pts("Body"), "9/10", "a point spent pushing");
  await page.click('#cc-panel button[data-act="back"][data-r="Body"]');
  same(await t.pts("Body"), "10/10", "and a point back");
  same(await page.isDisabled('#cc-panel button[data-act="back"][data-r="Body"]'), true, "no point back past what she holds");
  // 2 for 1: a hit at her Body taken on her Mind.
  await page.click('#cc-panel button[data-act="hit"][data-r="Body"][data-on="Mind"]');
  same([await t.pts("Body"), await t.pts("Mind")], ["10/10", "3/5"], "a hit at her Body taken 2 for 1 on her Mind");
  // Her Trusty worn leathers soak the first two, a plate each, and her Body
  // stays where it is.
  same(await page.textContent('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])'), "A hit gets through: your armour soaks it", "her armour soaking first, said on the button");
  for (let i = 0; i < 2; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  same([await t.pts("Body"), await page.$$eval(".cc-stat.t-body .zd-plate.on", (els) => els.length)], ["10/10", 2], "two hits soaked by her leathers");
  has(await page.textContent("#cc-panel"), "Trusty worn leathers0 of 2 soak left", "her leathers with nothing left to soak this scene");
  same(await page.textContent('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])'), "A hit gets through", "and the button says so");
  for (let i = 0; i < 10; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  same([await t.pts("Body"), await t.mood("Body")], ["0/10", "exposed"], "ten more hits empty her Body");
  await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  same([await t.pts("Body"), await t.mood("Body")], ["0/5", "Bloodied"], "the next leaves her Bloodied, healing only to 5");
  same(await page.$$eval(".cc-stat.t-body .cc-pips i.shut", (els) => els.length), 5, "the five a wound shuts away");
  // A heal from someone else: whole the first time, and 1 Toll.
  await page.click('#cc-panel button[data-act="healin"]');
  for (let i = 0; i < 8; i++) await page.click('#cc-dialog button[data-act="step"][data-n="hamount"][data-d="1"]');
  has(await page.textContent("#cc-dialog .dlg-head"), "8 to share out", "a heal of 8");
  await page.click('#cc-dialog button[data-act="heal-take"]');
  await t.closed();
  same([await t.pts("Body"), await t.pts("Mind"), await page.textContent(".cc-tag.is-toll")], ["5/5", "5/5", "Toll 1"], "her Body to half while she's Bloodied, her Mind full, and 1 Toll");
  await t.panel("Body");
  for (let i = 0; i < 5; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  // The next heal loses 5 for her Toll, unless their heals ignore a step.
  await page.click('#cc-panel button[data-act="healin"]');
  for (let i = 0; i < 8; i++) await page.click('#cc-dialog button[data-act="step"][data-n="hamount"][data-d="1"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "8, less 5 for 1 Toll, is 3", "the next heal less 5 for her Toll");
  await page.click('#cc-dialog button[data-act="hease"]');
  has(await page.textContent("#cc-dialog .dlg-head"), "8 to share out", "whole when their heals ignore a step of it");
  await page.click('#cc-dialog button[data-act="hease"]');
  await page.click('#cc-dialog button[data-act="heal-take"]');
  await t.closed();
  same([await t.pts("Body"), await page.textContent(".cc-tag.is-toll")], ["3/5", "Toll 2"], "3 back, and 2 Toll");
  // Down to 0 again, and a hit there's a Scar: she writes it in and leaves.
  await t.panel("Body");
  for (let i = 0; i < 3; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  has(await page.textContent('form[data-form="scar"]'), "A Scar on your Body.", "a hit on her wounded Body at 0 is a Scar");
  await page.fill('form[data-form="scar"] input[name="scar"]', "can’t lift my left arm");
  await page.click('form[data-form="scar"] button[type="submit"]');
  has(await page.textContent("#app"), "You’ve left the scene.", "the Scar takes her out of the scene");
  same([await t.pts("Body"), await page.$$eval(".cc-stat.t-body .zd-scars i.on", (els) => els.length)], ["0/5", 1], "her Body on 0 of 5 with a Scar, still Bloodied");
  await t.panel("Body");
  has(await page.textContent("#cc-panel"), "can’t lift my left arm", "her Scar written as what it stops her doing");
  same(await page.isDisabled('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])'), true, "no hits while she's out of the scene");
  // The rest at the end of the scene: her Body unsplit, a d12 and a d10.
  await page.click('.cc-note [data-act="scene"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Your Body, 0 of 5, Bloodied", "her Body rolling at the end of the scene");
  await page.evaluate(() => window.ziCompanion.setDice([2, 1]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "rolled 3, so it’s on 3 of 5", "a d12 and a d10 for 3");
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await t.closed();
  same([await t.pts("Body"), await page.textContent(".cc-tag.is-toll"), await page.$$eval(".cc-note", (els) => els.some((e) => /left the scene/.test(e.textContent)))], ["3/5", "Toll 1", false], "her Body on 3, Toll down by 1, and back in the scene");
  // Taking a breath: a point back on her Mind, as far as half.
  await t.panel("Mind");
  for (let i = 0; i < 4; i++) await page.click('#cc-panel button[data-act="spend"][data-r="Mind"]');
  await page.click('#cc-panel button[data-act="breath"]');
  same(await t.pts("Mind"), "2/5", "a breath, a point back on her Mind");
  await page.click('#cc-panel button[data-act="breath"]');
  same(await t.pts("Mind"), "3/5", "and another, to half of 5");
  same(await page.isDisabled('#cc-panel button[data-act="breath"]'), true, "no further than half");
  await shot(page, "vesk-scarred");
  // The Sheet tab: her Scar with no Catch to bite, three slots from a Trait,
  // and her Aspiration as points, a setback taking one off.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('details[data-open="sh-scars"] summary');
  has(await page.textContent('details[data-open="sh-scars"]'), "can’t lift my left arm on your Body, 0 of 3 downtime slots to a Trait", "her Scar on the Sheet tab, 0 of 3 to a Trait");
  same((await page.textContent('details[data-open="sh-trouble"]')).includes("can’t lift"), false, "and never with the Catches");
  await page.click('details[data-open="sh-asp"] summary');
  await page.click('details[data-open="sh-asp"] button[data-act="asp-set"][data-v="3"]');
  has(await page.textContent('details[data-open="sh-asp"] .cc-fold-g'), "3 of 5", "her Aspiration set to 3 of 5");
  await page.click('details[data-open="sh-asp"] button[data-act="asp"]');
  has(await page.textContent('details[data-open="sh-asp"] .cc-fold-g'), "2 of 5", "a setback taking a point off");
  await page.click('.cc-tabs a[data-t="play"]');

  // Dorrie's court clothes on her Mind soak a lie, and her Body's got none.
  await play(page, "dorrie", "Dorrie");
  same(await page.$$eval(".cc-stat.t-mind .zd-plate", (els) => els.length), 2, "her court clothes soak 2 on her Mind");
  await t.lands([[6, "Mind"]], { dice: [1, 1, 5] });
  await t.pay("hit");
  same(await t.paid(), ["Your court clothes soaked one"], "her court clothes soaking the lie");
  await t.done();
  same([await t.pts("Mind"), await page.$$eval(".cc-stat.t-mind .zd-plate.on", (els) => els.length)], ["6/6", 1], "her Mind untouched, a point of soak used");

  // Isolde's Body is 0: the club leaves her Bloodied, and she Blazes and dies.
  await play(page, "isolde", "Isolde");
  await t.lands([[8, "Body"]], { dice: [1, 6] });
  has(await page.textContent("#cc-dialog .cc-hits"), "Your Body takes it: you’re Bloodied", "a hit on her Body at 0 wounds it");
  await t.pay("hit");
  await t.done();
  same(await t.mood("Body"), "Bloodied", "Isolde Bloodied");
  await t.panel("Body");
  await page.click('#cc-panel button[data-act="blaze"]');
  has(await page.textContent('form[data-form="scar"]'), "You Blaze, on your Body.", "her Blaze");
  await page.click('form[data-form="scar"] button[data-act="die"]');
  has(await page.textContent("#app"), "Isolde died in play.", "Isolde choosing to die");
  // Ash: her Resources said and ticked, and her coal horn, a vessel at tier
  // 3, filled with a point mid-scene, paying her awakening's Aura, taking the
  // Aura over her 5 as she finishes acting and what's left at New scene, and
  // keeping its charge through downtime while her Resources come back.
  await play(page, "ash", "Ash");
  const ash = rootsSheet(book.crew.find((c) => c.id === "ash"), [], BUILD);
  const horn = ash.items.find((x) => x.kind === "vessel");
  const FIRE = RS.awakeningsOf(ash, RS.freshCore(ash))[0].key;
  const charge = () => page.textContent(".cc-stat.t-aura .cc-charge");
  same([await page.textContent('.cc-stat[data-p="res"] .v'), await charge()], ["3/3", "Coal horn 0/3"], "her 3 Resources, and her coal horn empty");
  await t.panel("res");
  same(await page.evaluate(() => document.activeElement?.name), "what", "Resources open ready to say one");
  await page.fill('#cc-panel input[name="what"]', "a flask of lamp oil");
  await page.click('#cc-panel form[data-form="res"] button[type="submit"]');
  same([await page.textContent('.cc-stat[data-p="res"] .v'), await page.textContent("#cc-panel .cc-said")], ["2/3", "a flask of lamp oil"], "one said and ticked, and what it was");
  for (const x of ["a length of chain", "a bribe"]) {
    await page.fill('#cc-panel input[name="what"]', x);
    await page.click('#cc-panel form[data-form="res"] button[type="submit"]');
  }
  same([await page.textContent('.cc-stat[data-p="res"] .v'), await page.$$eval('#cc-panel form[data-form="res"]', (els) => els.length)], ["0/3", 0], "all three said, and none left to say");
  await t.panel("res", false);
  // A point of Mind into her coal horn, no action.
  await t.panel("aura");
  await page.click(`#cc-panel button[data-act="fill"][data-k="${horn.key}"][data-from="pt"][data-r="Mind"]`);
  same([await t.pts("Mind"), await charge()], ["4/4", "Coal horn 1/3"], "a point of Mind for a charge, held in the horn");
  await t.panel("aura", false);
  // Her fire: her Soul, her ember stone doing the work, and its awakening
  // with an Aura on it, paid from the coal horn.
  await page.click('.cc-roots .tile[data-r="Soul"]');
  await page.click(`#cc-dialog .cc-pick[data-act="awk"][data-k="${FIRE}"]`);
  has(await t.live(), "15 steps", "her Soul 11, her ember stone 2 and its awakening 2");
  await page.click(`#cc-dialog button[data-act="step"][data-n="awk"][data-i="main|${FIRE}"][data-d="1"]`);
  await page.click(`#cc-dialog button[data-act="charge"][data-k="${horn.key}"]`);
  same([await t.costs(), (await t.live()).includes("17 steps")], ["1 charge", true], "the Aura on it paid from her coal horn, 17 steps");
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([12, 3, 2, 3]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  await t.done();
  same([await t.aura(), await charge(), await t.pts("Mind")], ["7/5", "Coal horn 0/3", "4/5"], "her Aura past 5 while she's acting, the charge spent, and her point of Mind free to come back");
  // Finishing acting: what's over goes into her coal horn.
  await page.click(`.cc-acting button[data-act="fill"][data-k="${horn.key}"][data-from="over"]`);
  same([await t.aura(), await charge()], ["5/5", "Coal horn 2/3"], "the 2 over her 5 into her coal horn as she finishes");
  // New scene: her Mind rests, and the Aura she's got left isn't lost, so it
  // stays out of the horn.
  await page.click('button[data-act="scene"]');
  same((await page.textContent("#cc-dialog .dlg-body")).includes("coal horn"), false, "the Aura she's got left isn't offered into her coal horn");
  await page.evaluate(() => window.ziCompanion.setDice([4]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await t.closed();
  same([await t.pts("Mind"), await t.aura(), await charge()], ["5/5", "5/5", "Coal horn 2/3"], "rested, Aura full, and her coal horn as it was");
  // Downtime: her Resources back, her coal horn still full.
  await page.click('button[data-act="downtime"]');
  await t.finish();
  same([await page.textContent('.cc-stat[data-p="res"] .v'), await charge()], ["3/3", "Coal horn 2/3"], "downtime: her Resources back, and her coal horn keeps its charge");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await openFold(page, "kit");
  has(await page.textContent('details[data-open="sh-kit"]'), "A Proven coal horna vessel, 2 of 3 charge", "her coal horn on the Sheet tab");
  has(await page.textContent('details[data-open="sh-kit"]'), "A Trusty scorched coatarmour on Body, 2 of 2 soak left", "her coat's soak there too");
  await page.click('.cc-tabs a[data-t="play"]');
  console.log("points: Vesk to a Scar and back, heals with Toll, a breath, Dorrie's court clothes, Isolde's Blaze, and Ash's Resources and coal horn");
  await context.close();
}

// 4h. Held and signature abilities (18 Nov), pure, on a made-up archetype
// since the chapter's still to be written: a held one off the maximum till a
// new scene or it's dropped, a signature once a scene and never on charge at
// 5, Parry held, a save from before them untouched, and a cut ability going
// the usual way.
if (part("4h")) {
  const B = { ...BUILD, archetypes: [...BUILD.archetypes, { name: "Testwright", abilities: [{ name: "Hum", cost: 1, kind: "held" }, { name: "Big one", cost: 5, kind: "signature" }, { name: "Middle", cost: 4, kind: "signature" }, { name: "Plain", cost: 1 }] }] };
  const ash = book.crew.find((x) => x.id === "ash");
  const c = rootsSheet({ ...ash, archetypes: [...ash.archetypes, { name: "Testwright", have: ["Hum", "Big one", "Middle", "Plain"] }] }, [], B);
  same(RS.archetypesOf(c, B).find((a) => a.name === "Testwright")?.abilities.map((x) => [x.name, x.kind]), [["Hum", "held"], ["Big one", "signature"], ["Middle", "signature"], ["Plain", ""]], "each ability's kind read off the book");
  const hum = RS.heldKey("Testwright", "Hum");
  let s = RS.freshCore(c);
  same([RS.holdUp(c, s, hum, 1), s.aura, RS.auraMax(c, s), RS.isUp(s, hum)], [true, 4, 4, true], "a held ability put up: 1 Aura paid and 1 off the maximum");
  same(RS.holdUp(c, s, hum, 1), false, "and it can't go up twice");
  s = RS.normalCore(JSON.parse(JSON.stringify(s)), c);
  same([RS.isUp(s, hum), RS.auraMax(c, s), s.aura], [true, 4, 4], "still up through a reload");
  RS.gainAura(s, c, 3);
  same(s.aura, 4, "Aura coming in stops at the lower maximum");
  RS.sceneEnd(c, s, {});
  same([RS.isUp(s, hum), RS.auraMax(c, s), s.aura], [false, 5, 5], "a new scene drops it and fills Aura to 5");
  RS.holdUp(c, s, hum, 1);
  same([RS.dropHeld(c, s, hum), RS.auraMax(c, s), s.aura, "up" in s], [true, 5, 4, false], "dropped: the maximum's back and the Aura paid isn't");
  const big = RS.heldKey("Testwright", "Big one");
  const mid = RS.heldKey("Testwright", "Middle");
  same([RS.sigOk(s, big, 5, { charge: true }), RS.sigOk(s, mid, 4, { charge: true }), RS.sigOk(s, big, 5)], [false, true, true], "a signature at 5 refuses charge, and one at 4 takes it");
  same([RS.useSig(s, mid, 4), RS.useSig(s, mid, 4), RS.sigUsed(s, big)], [true, false, false], "a signature once a scene, and another still there");
  s = RS.normalCore(JSON.parse(JSON.stringify(s)), c);
  same(RS.sigUsed(s, mid), true, "used through a reload");
  RS.sceneEnd(c, s, {});
  same(RS.sigUsed(s, mid), false, "and back at a new scene");
  // Parry's held: up once, free on every landing after, gone at a new scene.
  same([RS.holdUp(c, s, RS.PARRY, 1), RS.isUp(s, RS.PARRY), RS.auraMax(c, s), RS.holdUp(c, s, RS.PARRY, 1)], [true, true, 4, false], "Parry put up once for the scene");
  RS.downtimeRest(c, s);
  same(RS.isUp(s, RS.PARRY), false, "downtime drops it too");
  // A save from before held and signature abilities: nothing up, nothing used.
  const old = RS.normalCore({ ...JSON.parse(JSON.stringify(RS.freshCore(c))), aura: 5 }, c);
  same(["up" in old, "sig" in old, RS.auraMax(c, old), old.aura], [false, false, 5, 5], "a save from before loads untouched");
  same(RS.normalCore({ ...RS.freshCore(c), up: { junk: "x", [hum]: 9 }, sig: [3, mid] }, c).up, { [hum]: 5 }, "a broken up tidied");
  // Cut by the levers pass: through cutOf with the book's list.
  same(RS.cutOf("Guardian", ["Push", "Your turn", "Knock it back"], ["Push", "Not while I stand", "Hold the line"]), { have: ["Push"], cut: ["Your turn", "Knock it back"] }, "cut abilities come off for the player to choose");
  // The second levers pass (18 Nov). Hot streak's a signature at 4 the roll
  // card knows by its words: once it's on, flips are free and as many as
  // you like, never the same die twice.
  const abil = (a, n) => B.archetypes.find((x) => x.name === a)?.abilities.find((x) => x.name === n);
  const hot = abil("Gambler", "Hot streak");
  same([hot?.cost, hot?.kind, RS.STREAK.test(hot?.text ?? "")], [4, "signature", true], "Hot streak a signature at 4, read off its words");
  const r = { flips: 1 }, d = { flip: true }, fresh = {};
  same([RS.canFlip(r), RS.flipsDie(r, fresh)], [false, true], "with no streak, one flip a round");
  r.streak = true;
  same([RS.canFlip(r), RS.flipsDie(r, fresh), RS.flipsDie(r, d)], [true, true, false], "on a streak, flips past the first, never the same die twice");
  // Opened only on an exploding die that wins. Nothing on the phone puts it
  // on a target, so the gate's the words the roll card shows.
  same(/\bexplodes and wins\b/.test(abil("Warrior", "Opened")?.text ?? ""), true, "Opened only on an exploding die that wins");
  // Sit with them: 1 Toll off the patient, once a scene, and no heal.
  s = RS.freshCore(c);
  s.toll = 2;
  same([RS.satWith(s), s.toll, RS.satWith(s), s.toll], [true, 1, false, 1], "Sit with them takes 1 Toll off, once a scene");
  s = RS.normalCore(JSON.parse(JSON.stringify(s)), c);
  same(s.sat, true, "still sat with through a reload");
  RS.sceneEnd(c, s, {});
  same(["sat" in s, s.toll, RS.satWith(s)], [false, 0, false], "back at a new scene, and nothing to take off at 0");
  // Cut in this pass: a Bard with Old songs and a Warrior with Face me get the choice.
  const bard = rootsSheet({ ...ash, archetypes: [{ name: "Bard", have: ["Push", "Old songs"] }, { name: "Warrior", have: ["Push", "Face me"] }] }, [], B);
  same(RS.choicesOf(bard).filter((x) => x.k === "ability").map((x) => x.name), ["Old songs", "Face me"], "Old songs and Face me come off for the player to choose");
  same(Object.entries(RS.HAD_ABILITIES).flatMap(([a, l]) => l.filter((n) => !abil(a, RS.abilityNow(a, n))).map((n) => `${a}: ${n}`)), ["Bloodsworn: Bleed for it", "Bloodsworn: Bleed out", "Healer: Pull them back"], "every 16 Nov ability still in the book bar the ones Mo cut");
  console.log("held and signature: up and dropped, a new scene, once a scene, no charge at 5, Parry held, older saves, Hot streak, Opened, Sit with them");
}

// 4b. Saved before the new core. Vesk saved on stacking keeps her play, her
// tracks gone and every Root full, her Scar on her Body, Old Vesk from
// before Roots comes all the way across; one built on stacking gets each
// Title's 3 made 5 to check; Tamsin from before Roots shows as she was.
if (part("4b")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await page.goto(`${BASE}/characters/`);
  const vesk = book.crew.find((c) => c.id === "vesk");
  const stacked = fromCrew(vesk, BUILD);
  for (const tt of stacked.titles) {
    const total = ROOTS.reduce((n, r) => n + (tt.roots?.[r] ?? 0), 0);
    if (total === 5) tt.roots = Object.fromEntries(ROOTS.map((r) => [r, Math.round(((tt.roots?.[r] ?? 0) * 3) / 5)]));
  }
  const old = { v: 1, characters: [
    { id: "stack-vesk", crew: "vesk", name: "Vesk", hash: "old", state: { v: 3, aura: 4, acting: false, tracks: { stamina: 8, confidence: 12, resolve: 10 }, scars: { stamina: ["a burn across the back"], confidence: [], resolve: [] }, blaze: null, dead: false, conditions: [{ name: "Burning", die: 6, kind: "against" }], threads: { "Dorrie|We have pulled a dozen jobs. I trust her with my life.": "strained" }, crossed: {}, picked: [], asp: 6, aspText: "", notes: "Owes the fence", boxes: {}, grown: [], choose: [], power: { "0|Anywhere I can throw a hook": 1 } } },
    { id: "old-vesk", crew: "vesk", name: "Old Vesk", hash: "old", state: { aura: 3, resolve: 1, conf: 6, wound: 4, scars: ["a burn across the back"], blaze: false, dead: false, conditions: [], threads: {}, crossed: {}, picked: [], asp: 6, aspText: "", notes: "", boxes: {} } },
    { id: "own-stack", crew: "own", name: "Mara", hash: "own", build: stacked, state: { v: 3, aura: 5, tracks: { stamina: 12, confidence: 12, resolve: 12 }, scars: { stamina: [], confidence: [], resolve: [] }, conditions: [], threads: {}, crossed: {}, picked: [], grown: [], choose: [] } },
    { id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a sword", on: ["Fight"] }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [{ person: "Dorrie", text: "She owes me.", kind: "hostile", whose: "" }], connect: [], aspiration: "Run the docks", name: "Tamsin", pronoun: "her" },
      state: { aura: 4, resolve: 2, conf: 8, wound: 2, scars: [], conditions: [], threads: {}, notes: "" } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(old));
  await page.goto(`${BASE}/characters/?c=stack-vesk`);
  await page.waitForSelector(".tile[data-r]");
  has(await page.textContent(".cc-moved"), "Vesk’s on the new core.", "the note that she's moved onto the new core");
  has(await page.textContent(".cc-moved"), "The Scar’s on the Root its track was for.", "and where her Scar went");
  same(await t.all(), ["9/9", "5/5", "0/0"], "every Root full, her Scar locking a point of her Body");
  same(await page.$$eval(".cc-stat.t-body .zd-scars i.on", (els) => els.length), 1, "her old Scar on her Body");
  has(await page.textContent(".cc-stat.t-cond"), "Burning", "her conditions kept");
  same(await t.aura(), "4/5", "her Aura kept, inside her 5");
  await page.click('.cc-moved button[data-act="moved"]');
  same(await page.$$eval(".cc-moved", (els) => els.length), 0, "Got it puts the note away");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await openFold(page, "notes");
  same(await page.inputValue("#cc-notes"), "Owes the fence", "her notes kept");
  const saved = (await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters)).find((c) => c.id === "stack-vesk");
  same([saved.state.v, "tracks" in saved.state, "power" in saved.state, saved.state.scars.Body], [5, false, false, ["a burn across the back"]], "her state saved on the new core and the 17 Nov fixes");
  // Old Vesk, from before Roots, comes all the way across.
  await page.goto(`${BASE}/characters/?c=old-vesk`);
  await page.waitForSelector(".tile[data-r]");
  has(await page.textContent(".cc-moved"), "on the new core", "Old Vesk on the new core");
  same(await page.$$eval(".cc-stat.t-body .zd-scars i.on", (els) => els.length), 1, "Old Vesk's Scar on her Body");
  // Mara, built on stacking: each Title's 3 made 5 the way it was spread
  // (the builder's normalBuild()), with nothing on the play screen to choose.
  await page.goto(`${BASE}/characters/?c=own-stack`);
  await page.waitForSelector(".tile[data-r]");
  same(await page.$$eval(".cc-choose li", (els) => els.filter((e) => !/left to spend/.test(e.textContent)).length), 0, "Mara's Titles made 5, with nothing left for her to choose bar the points her utility and bag freed");
  same((await t.all()).every((x) => /^(\d+)\/\1$/.test(x)), true, "and every Root of hers full");
  // Tamsin, built on the phone before Roots, shows as she was.
  await page.goto(`${BASE}/characters/?c=own-old`);
  await page.waitForSelector(".cc-note");
  has(await page.textContent("#app"), "built before the Roots change", "Tamsin as she was, before Roots");
  // The 18 Nov abilities rework: a Guardian saved with Take it on the plate
  // has Put it on me, quietly, and a Bloodsworn saved with Bleed out has it
  // off with its point back, and a choice to pick another or keep the point.
  const plate = fromCrew(book.crew.find((c) => c.id === "bram"), BUILD);
  plate.have[0] = ["Push", "Take it on the plate"];
  const bleed = fromCrew(vesk, BUILD);
  bleed.archs[1] = "Bloodsworn";
  bleed.have[1] = ["Push", "Bleed out"];
  const plateSheet = rootsSheet(sheetOf({ id: "plate", name: "Plate", build: plate }, BUILD), [], BUILD);
  same(plateSheet.archetypes[0].have, ["Push", "Put it on me"], "Take it on the plate carried across as Put it on me");
  same(RS.choicesOf(plateSheet).filter((x) => x.k === "ability"), [], "with nothing to choose");
  const bleedSheet = rootsSheet(sheetOf({ id: "bleed", name: "Bleed", build: bleed }, BUILD), [], BUILD);
  same([bleedSheet.archetypes[1].have, bleedSheet.archetypes[1].cut], [["Push"], ["Bleed out"]], "Bleed out off the Bloodsworn");
  same(RS.choicesOf(bleedSheet).filter((x) => x.k === "ability"), [{ k: "ability", a: 1, name: "Bleed out" }], "and a choice for it");
  same(bleedSheet.points.spent, costOf({ ...bleedSheet, archetypes: bleedSheet.archetypes.map((a, i) => (i === 1 ? { name: a.name, have: ["Push"] } : a)) }).spent, "its point back through costOf()");
  same(pointsOf(normalBuild(bleed, BUILD)).spent, bleedSheet.points.spent, "the builder counting it the same");
  const grownBleed = rootsSheet(sheetOf({ id: "bleed2", name: "Bleed", build: { ...bleed, have: [bleed.have[0], ["Push"]] } }, BUILD), [{ k: "ability", a: 1, name: "Bleed out" }, { k: "ability", a: 0, name: "Take it on the plate" }], BUILD);
  same([grownBleed.archetypes[1].cut, grownBleed.archetypes[0].have.includes("Take it on the plate")], [["Bleed out"], false], "Bleed out grown in downtime off too, and a cut name never grown onto another archetype");
  same(RS.hadOf("Bloodsworn", BUILD.archetypes.find((a) => a.name === "Bloodsworn").abilities.map((x) => x.name)), ["Bleed for it", "Bleed out"], "hadOf() keeping Bleed out for the sheet to take off");
  const reworked = { v: 1, characters: [
    { id: "own-plate", crew: "own", name: "Plate", hash: "own", build: plate, state: { v: 5, aura: 5, conditions: [], threads: {}, crossed: {}, picked: [], grown: [], choose: [] } },
    { id: "own-bleed", crew: "own", name: "Bleed", hash: "own", build: bleed, state: { v: 5, aura: 5, conditions: [], threads: {}, crossed: {}, picked: [], grown: [], choose: [] } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(reworked));
  await page.goto(`${BASE}/characters/?c=own-plate`);
  await page.waitForSelector(".tile[data-r]");
  same(await page.$$eval(".cc-choose", (els) => els.length), 0, "the Guardian with nothing to choose");
  await page.goto(`${BASE}/characters/?c=own-bleed`);
  await page.waitForSelector(".cc-choose li");
  has(await page.textContent(".cc-choose"), "Bleed out isn’t one of the Bloodsworn’s abilities any more, so it’s off", "the Bloodsworn told Bleed out's gone");
  await page.click('.cc-choose button[data-act="choose"]:has-text("Keep the point")');
  await page.reload();
  await page.waitForSelector(".tile[data-r]");
  same(await page.$$eval(".cc-choose", (els) => els.length), 0, "and keeping the point puts it away for good");
  console.log("saved before: Vesk from stacking, Old Vesk from before Roots, Mara made 5, Tamsin as she was, and the abilities rework");
  await context.close();
}

// A fold in the builder opened, unless it's open already.
const unfold = async (page, key) => {
  if (!(await page.$eval(`details[data-open="${key}"]`, (el) => el.open))) await page.click(`details[data-open="${key}"] > summary`);
};

// What a sheet's made of, for comparing one built on the phone with the
// chapter's: Roots, Titles with their spreads and permissions, archetypes
// with their abilities, points, Aura, items with their kinds and tiers (an
// attuned one by its being attuned, since a build calls it by the thing's
// name, in any order, since a build puts its attuned things last), the
// keepsake, attuned things and their own threads.
const sheetParts = (c, { props = true } = {}) => ({
  roots: c.roots,
  titles: c.titles.map((t) => [t.text, t.roots, t.permissions.map((p) => [p.text, p.root])]),
  archetypes: c.archetypes.map((a) => [a.name, a.have]),
  points: c.points,
  aura: c.numbers.aura,
  items: (c.items ?? []).map((it) => [it.attuned != null ? `attuned ${it.attuned}` : it.name, it.kind, it.tier, it.root ?? null, props ? (it.props ?? []).join(", ") : ""]).sort((x, y) => String(x).localeCompare(String(y))),
  keepsake: c.keepsake,
  attuned: c.attuned.map((a) => [a.name, a.stage, a.catch, a.awakenings.map((w) => [w.name, w.root])]),
  threads: c.threads.map((p) => [p.person, p.threads.filter((t) => !t.whose).map((t) => [t.text, t.kind])]).filter(([, t]) => t.length),
});
// The characters saved on this phone, and one of them as the phone makes
// their sheet: the build against the book, with what they grew on top.
const savedAll = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters") || "{}").characters ?? []);
const sheetFor = (ch) => rootsSheet(ch.build ? sheetOf(ch, BUILD) : book.crew.find((c) => c.id === ch.crew), ch.state?.grown ?? [], BUILD);
// A character's play screen, open: its tabs are what's always on it.
const playing = (page) => page.waitForSelector(".cc-tabs a[data-t]");
// One of the crew from the Characters list, saved on the phone.
async function crewOn(page, id) {
  await page.goto(`${BASE}/characters/`);
  await page.click(`button[data-act="play"][data-c="${id}"]`);
  await page.click('#cc-dialog button[type="submit"]');
  await playing(page);
  return (await savedAll(page)).at(-1);
}
// A saved character's state changed straight on the phone, then opened again.
async function setState(page, id, patch) {
  await page.evaluate(([cid, p]) => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    const ch = all.characters.find((c) => c.id === cid);
    ch.state = { ...ch.state, ...p, tracks: { ...(ch.state?.tracks ?? {}), ...(p.tracks ?? {}) } };
    localStorage.setItem("zi-characters", JSON.stringify(all));
  }, [id, patch]);
}

// 5. Building your own on stacking: Vesk again on 35 points, a step to a
// screen, with what's spent and what's left in the bar the whole way, and
// her sheet against the chapter's once she's saved.
if (part("5")) {
  const vesk = book.crew.find((c) => c.name === "Vesk");
  const want = rootsSheet(vesk, [], BUILD);
  const { context, page } = await phone();
  const axe = async (what) => {
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
  };
  const b = (attrs) => page.click(`button[data-act="b"]${attrs}`);
  const step = () => page.textContent(".bd-head h1");
  const next = async (name) => {
    await page.click(".bd-foot button.primary");
    has(await step(), name, "the next step");
  };
  const jump = async (s) => {
    await page.click(".bd-jump > summary");
    await page.click(`.bd-dot[data-s="${s}"]`);
  };
  const pressedOn = (attrs) => page.getAttribute(`button[data-act="b"]${attrs}`, "aria-pressed");
  // The points in the bar: what's left (or over), then what's spent.
  const points = async () => (await page.textContent(".bd-pts-say")).replace(/\s+/g, " ").replace("Points: ", "").trim();
  // A permission typed in, and its Root.
  const perm = async (t, j, text, root) => {
    await page.fill(`#b-t${t}-p${j}`, text);
    await b(`[data-b="proot"][data-t="${t}"][data-j="${j}"][data-v="${root}"]`);
  };

  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="bopen"]');
  has(await step(), "Archetypes", "the builder's first step");
  same(await points(), "35 left, 0 of 35 spent", "35 points to start, in the bar");
  same(await page.$eval(".bd-foot", (el) => [getComputedStyle(el).position, el.contains(el.querySelector(".bd-pts"))]), ["fixed", true], "the points in the bar at the bottom");
  // Two Shadows, each with the ability it comes with: Push, then Vanish.
  await b('[data-b="arch"][data-t="0"][data-v="Shadow"]');
  has(await page.textContent(".bd-arch-what"), "The Shadow notices things from where nobody’s looking", "the Shadow's mechanic");
  same(await page.$$eval('[data-b="abil"][data-t="0"]', (els) => els.map((el) => el.dataset.v)), BUILD.archetypes.find((a) => a.name === "Shadow").abilities.map((x) => x.name), "the Shadow's abilities to pick from");
  await b('[data-b="abil"][data-t="0"][data-v="Push"]');
  has(await page.textContent('[data-b="abil"][data-t="0"][data-v="Push"]'), "Comes with it", "Push the one it comes with");
  same(await points(), "30 left, 5 of 35 spent", "an archetype's 5 points");
  await next("Archetypes");
  same(await page.getAttribute('.bd-seg[data-b="atab"][data-t="1"]', "aria-current"), "true", "Next going on to the second archetype first");
  await b('[data-b="arch"][data-t="1"][data-v="Shadow"]');
  has(await page.textContent('[data-b="abil"][data-t="1"][data-v="Push"]'), "On your other Shadow", "Push already on her first Shadow");
  await b('[data-b="abil"][data-t="1"][data-v="Vanish"]');
  has(await page.textContent(".bd-body"), "Shadow twice, so your Push is +3", "two Shadows");
  same(await page.$$eval(".bd-head .zd-crest.twice", (els) => els.length), 1, "the crest at the top doubled for Shadow twice");
  // A second ability's a point, and tapped again it comes off.
  await b('[data-b="abil"][data-t="1"][data-v="Push"]');
  has(await page.textContent('[data-b="abil"][data-t="1"][data-v="Push"]'), "1 point", "a second ability a point");
  same(await points(), "24 left, 11 of 35 spent", "the second ability on the points");
  await b('[data-b="abil"][data-t="1"][data-v="Push"]');
  same(await points(), "25 left, 10 of 35 spent", "and off again");
  await shot(page, "5-builder-archetypes");
  await next("Titles and permissions");
  // Her first Title off the Rogue idea's cards, all 5 Root points on her Body
  // in a tap, and its permissions with their Roots, one tapped in off the idea.
  await unfold(page, "bd-ideas-0");
  await b('[data-b="idea"][data-t="0"][data-v="k-rogue"]');
  await b('[data-b="title"][data-t="0"][data-v="The best cat burglar in the city"]');
  await b('[data-b="sall"][data-t="0"][data-v="Body"]');
  await perm(0, 0, "move unseen", "Body");
  await perm(0, 1, "run the rooftops", "Body");
  await b('[data-b="perm"][data-t="0"][data-v="pick a mechanical lock"]');
  same([await page.inputValue("#b-t0-p2"), await pressedOn('[data-b="proot"][data-t="0"][data-j="2"][data-v="Body"]')], ["pick a mechanical lock", "true"], "a permission tapped in off the idea, its Root guessed");
  same(await page.$$eval('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', (els) => els.map((el) => el.getAttribute("data-d"))), ["12", "4"], "her Body a d12 and a d4 with her first Title's 5 and its three permissions");
  same(await points(), "18 left, 17 of 35 spent", "a Title's 5 with its first permission, and 1 for each after");
  await next("Titles and permissions");
  same(await page.getAttribute('.bd-seg[data-b="tab"][data-t="1"]', "aria-current"), "true", "Next going on to her second Title");
  // Her second Title spread Mind 3 and Body 2 in three taps: all on her
  // Mind, then + on her Body twice, each one off her Mind.
  await page.fill("#b-t1-text", "Raised by the Guild");
  const spreadSaid = async () => (await page.textContent(".bd-title:has(#b-t1-text) .bd-ask")).replace(/\s+/g, " ");
  await b('[data-b="sall"][data-t="1"][data-v="Mind"]');
  has(await spreadSaid(), "Mind 5", "all 5 on her Mind in a tap");
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="1"]');
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="1"]');
  has(await spreadSaid(), "Body 2, Mind 3", "her second Title spread, + taking each one off her Mind");
  // One more on her Body takes it off the biggest of the others, and − leaves
  // one to go till it's put back.
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="1"]');
  has(await spreadSaid(), "Body 3, Mind 2", "one more on her Body, off her Mind");
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="-1"]');
  has(await spreadSaid(), "Body 2, Mind 2, 1 to go", "one off her Body, and one to go");
  await b('[data-b="snudge"][data-t="1"][data-v="Mind"][data-n="1"]');
  has(await spreadSaid(), "Body 2, Mind 3", "and back on her Mind");
  await perm(1, 0, "know how a lock’s built", "Mind");
  await perm(1, 1, "fight dirty with a knife", "Body");
  await perm(1, 2, "find a buyer for anything", "Mind");
  same(await points(), "11 left, 24 of 35 spent", "two Titles with three permissions each, 14 points");
  await shot(page, "5-builder-titles");
  await next("Roots");
  // What it adds up to, and where each one comes from.
  const nums = await page.$$eval(".bd-from-list li", (els) => els.map((li) => [li.querySelector(".k").textContent, Number(li.querySelector("b").textContent)]));
  same(nums, ROOTS.map((r) => [r, want.roots[r]]), "the built Vesk's Roots");
  has(await page.textContent(".bd-from-list"), "5 from your first Title, “move unseen”, “run the rooftops”, “pick a mechanical lock”, 2 from your second Title and “fight dirty with a knife”", "where her Body comes from");
  same(await page.$$eval(".tile[data-s], .bd-specs3, [data-b='pspec']", (els) => els.length), 0, "no specialties anywhere");
  has(await page.textContent(".bd-body"), "Soul at 0 has no points, so the first hit there wounds you", "her Soul at 0 said for what it means");
  await next("Items");
  // Her items, a part at a time, her attuned thing first: her grappling
  // line, 5 points, with the awakening it comes with on the Root it locks a
  // point of, and nothing to write for its own Aura. It's one of her six,
  // a Trusty tool, in its 5.
  same(await page.getAttribute('.bd-seg[data-v="a"]', "aria-current"), "true", "her attuned thing first");
  same(await page.$$eval('[data-bin$=".aura"]', (els) => els.length), 0, "no Aura of its own to write");
  await page.fill("#b-a0-name", "A grappling line");
  await page.fill("#b-a0-w0-name", "Anywhere I can throw a hook");
  await b('[data-b="awkroot"][data-i="0"][data-j="0"][data-v="Body"]');
  await page.fill("#b-a0-w0-text", "2 steps on every roll she makes with it, and 2 more for each Aura");
  has(await page.textContent(".bd-awk"), "it locks a point of your Body", "her hook locking a point of her Body");
  has(await page.textContent(".bd-asitem summary"), "Trusty tool, one of your six", "her line one of her six, a Trusty tool");
  same(await points(), "6 left, 29 of 35 spent", "her grappling line's 5");
  await shot(page, "5-builder-attuned");
  await next("Items");
  same(await page.getAttribute('.bd-seg[data-v="i"]', "aria-current"), "true", "Next going on to her items");
  has(await page.textContent(".bd-its"), "A Trusty grappling line", "her attuned thing at the top of her six");
  // Her leathers off a card are armour on her Body at tier 2, a point.
  await b('[data-b="additem"][data-v="worn leathers"]');
  same((await page.textContent('details[data-open="bd-it-0"] > summary')).replace(/\s+/g, " ").trim(), "Trusty worn leathers armour, soaks 2 on your Body · 1 point", "her leathers off a card, armour soaking 2 on her Body");
  await unfold(page, "bd-it-0");
  await b('[data-b="iroot"][data-w="i"][data-i="0"][data-v="Mind"]');
  has(await page.textContent('details[data-open="bd-it-0"] > summary'), "soaks 2 on your Mind", "her leathers moved to her Mind");
  await b('[data-b="iroot"][data-w="i"][data-i="0"][data-v="Body"]');
  // A knife typed in is a weapon, and her boots and picks go up to tier 3,
  // Proven, for a point more each.
  await b('[data-b="additem"]:not([data-v])');
  await page.fill("#b-i1", "a knife");
  await b('[data-b="additem"][data-v="soft-soled boots"]');
  await unfold(page, "bd-it-2");
  await b('[data-b="itier"][data-w="i"][data-i="2"][data-v="3"]');
  has(await page.textContent('details[data-open="bd-it-1"] > summary'), "weapon", "a knife typed in a weapon");
  has(await page.textContent('details[data-open="bd-it-2"] > summary'), "Proven soft-soled boots", "her boots Proven, tier 3");
  same(await page.$$eval('[data-b="itier"][data-w="i"][data-i="2"]', (els) => els.map((el) => el.textContent.trim())), ["Trusty 2", "Proven 3, a point more"], "tier 2 or 3 to start, by their names");
  await b('[data-b="additem"]:not([data-v])');
  await page.fill("#b-i3", "a set of picks");
  await b('[data-b="itier"][data-w="i"][data-i="3"][data-v="3"]');
  has(await page.textContent(".bd-carry h2"), "5 of 6", "five of her six");
  has(await page.textContent(".bd-res"), "You’ve got 3 Resources as well, with nothing to write.", "her Resources said for what they are");
  await page.click(".bd-res .tip");
  has(await page.textContent(".bd-res .tip-card:popover-open"), "as it happens, I’ve got rope on me", "Resources in a bubble");
  await page.keyboard.press("Escape");
  same(await points(), "0 left, 35 of 35 spent", "all 35 spent: four items, two of them Proven");
  await shot(page, "5-builder-items");
  await next("Items");
  await page.fill("#b-k", "the first coin she ever stole");
  // The bar follows what's typed after a moment.
  await page.waitForFunction(() => /^0 left/.test(document.querySelector(".bd-pts-say")?.textContent.replace("Points: ", "").trim() ?? ""));
  same(await points(), "0 left, 35 of 35 spent", "all 35 spent, her keepsake free");
  await next("Threads");
  // Threads from the crew questions: an answer becomes a bond thread or a
  // hostile one in a tap, and they cost nothing.
  same(await page.$$eval(".bd-thread", (els) => els.map((el) => el.querySelector('[aria-pressed="true"]').textContent)), ["Bond", "Bond", "Hostile"], "two bond threads and a hostile one to start");
  await unfold(page, "bd-q-0");
  await page.fill("#b-cq0", "Dorrie. We have pulled a dozen jobs. I trust her with my life.");
  await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
  same([await page.inputValue("#b-th0-person"), await page.inputValue("#b-th0-text")], ["Dorrie", "We have pulled a dozen jobs. I trust her with my life."], "an answer made into her first bond thread");
  await page.fill("#b-th1-person", "Bram");
  await page.fill("#b-th1-text", "He once carried me out of a fire. I have never said thank you.");
  await unfold(page, "bd-q-1");
  await page.fill("#b-cq1", "The fence. I owe a debt I would rather not discuss.");
  await b('[data-b="fromq"][data-q="1"][data-v="hostile"]');
  same([await page.inputValue("#b-th2-person"), await page.inputValue("#b-th2-text")], ["The fence", "I owe a debt I would rather not discuss."], "an answer gone bad made into her hostile thread");
  await next("Aspiration");
  await page.fill("#b-asp", "Own the score of a lifetime");
  await next("Check it and play");
  await page.fill("#b-name", "Vesk");
  await b('[data-b="pronoun"][data-v="her"]');
  const check = (await page.textContent(".bd-body")).replace(/\s+/g, " ");
  has(check, "Everything adds up", "nothing to flag on a finished Vesk");
  for (const n of ["35 of 35 spent, all of them", "Aura 5", "Stride 3", "every one full to start"]) has(check, n, "the built Vesk's points and numbers");
  same(/Stamina|Confidence|Resolve/.test(check), false, "no tracks on her numbers");
  same(await page.$$eval(".bd-nums .k", (els) => els.some((el) => /action/i.test(el.textContent))), false, "no actions a round to count");
  await shot(page, "5-builder-check");
  await b('[data-b="save"]');
  await playing(page);
  const built = (await savedAll(page)).at(-1);
  const drafts = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-drafts") || "{}"));
  same([built.crew, built.name, built.build?.v, built.build?.start, "new" in drafts, sheetFor(built).core], ["own", "Vesk", 6, 35, false, true], "the built Vesk saved on 35 points on the new core, and the draft cleared");
  same(/boon|equipment|utility|"bag"/i.test(JSON.stringify(built.build)), false, "nothing saved about Boons, equipment, utility items or a bag");
  same(JSON.stringify(built.build).includes("spec"), false, "nothing saved about specialties");
  // A knife typed in gets the weapons table's properties, where the
  // chapter's Vesk lists none, so those are left out of the comparing.
  same(sheetFor(built).items.find((it) => it.name === "a knife")?.props, ["Thrown", "Concealed", "Quick"], "a knife typed in with a knife's properties off the weapons table");
  same(sheetParts(sheetFor(built), { props: false }), sheetParts(want, { props: false }), "the built Vesk against her sheet in the chapter");

  // A reload and no signal keep her, and Change opens her offline.
  await page.reload();
  await playing(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await playing(page).catch(() => note("the built Vesk didn't open offline"));
  await page.goto(`${BASE}/characters/?build=${encodeURIComponent(built.id)}`);
  has(await step(), "Change anything on her sheet", "changing her opens with everything on one page, offline");
  same(await points(), "35 points on the sheet, 35 to start", "a saved character's points on the sheet");
  await context.setOffline(false);

  // Change her: a fourth permission on her first Title, her leathers up to
  // Storied (tier 4, bought with money in play), and her boots swapped for a
  // Proven shield, a guard. A saved character keeps everything, even past 35.
  same(await page.$$eval('[data-b="boon"], [data-open^="bd-boon"]', (els) => els.length), 0, "no Boons to take");
  await b('[data-b="addperm"][data-t="0"]');
  await perm(0, 3, "slip a grip", "Body");
  await unfold(page, "bd-it-0");
  same(await page.$$eval('[data-b="itier"][data-w="i"][data-i="0"]', (els) => els.length), 6, "any of the six tiers on a saved character");
  await b('[data-b="itier"][data-w="i"][data-i="0"][data-v="4"]');
  await unfold(page, "bd-it-2");
  await page.fill("#b-i2", "a shield");
  await page.waitForFunction(() => /38 points/.test(document.querySelector(".bd-pts-say")?.textContent ?? ""));
  same(await points(), "38 points on the sheet, 35 to start", "38 points on her sheet now");
  same((await page.textContent(".bd-part:last-of-type")).includes("past the 35"), false, "nothing flagged for being past 35");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const changed = (await savedAll(page)).filter((c) => c.build);
  same(changed.length, 1, "changing her doesn't make a second Vesk");
  const now = sheetFor(changed[0]);
  same([now.titles[0].permissions.length, now.items.map((it) => [it.name, it.kind, it.tier]), now.points.spent], [4, [["worn leathers", "armour", 4], ["a knife", "weapon", 2], ["a shield", "guard", 3], ["a set of picks", "tool", 3], ["A grappling line", "tool", 2]], 38], "her fourth permission, her Storied leathers and her Proven shield");
  same(now.roots, { Body: 12, Mind: 5, Soul: 0 }, "her Body 1 more for her new permission");

  // A blank character saves too: the builder warns, and never blocks, and
  // the recommendation's only a nudge. Leaving keeps the draft, and the list
  // offers to carry on with it. Starting on more is a tap in the bar.
  await page.goto(`${BASE}/characters/?build`);
  await jump(6);
  const warns = await page.textContent(".bd-body .is-warn");
  has(warns, "You can save anyway", "the warnings on a blank build");
  for (const w of ["You haven’t got a Title. At least one’s recommended, but it’s your call.", "You haven’t got an archetype. At least one’s recommended, but it’s your call.", "You’ve got 35 points left to spend."]) has(warns, w, "a nudge on a blank build");
  await page.fill("#b-name", "Kaia");
  await page.click(".bd-pts > summary");
  await page.click('.bd-pts button[data-b="start"][data-v="1"]');
  same([await page.$eval(".bd-pts", (el) => el.open), await points()], [true, "36 left, 0 of 36 spent"], "one more point to start on, the points staying open");
  await page.keyboard.press("Escape");
  same(await page.$eval(".bd-pts", (el) => [el.open, document.activeElement === el.querySelector("summary")]), [false, true], "Escape closing the points");
  await page.click('.cc-back[data-b="leave"]');
  has(await page.textContent('a[data-act="bopen"]'), "Carry on with Kaia", "a half-built character waiting on the list");
  await page.click('a[data-act="bopen"]');
  await b('[data-b="save"]');
  await playing(page);
  const kaia = (await savedAll(page)).at(-1);
  same([kaia.name, kaia.build.start, sheetFor(kaia).roots, sheetFor(kaia).points], ["Kaia", 36, { Body: 0, Mind: 0, Soul: 0 }, { start: 36, spent: 0 }], "a blank character saved, on 36 points");

  // Every step at 320 wide, dark then light, with axe.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`${BASE}/characters/?build=${encodeURIComponent(kaia.id)}`);
  await page.waitForSelector(".bd-head h1");
  await page.click('button[data-b="page"]');
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await page.reload();
    for (let s = 0; s < 7; s++) {
      await jump(s);
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`the builder's step ${s + 1} scrolls sideways at 320 wide, ${theme} (${scroll} > ${client})`);
      await axe(`the builder's step ${s + 1}, ${theme}`);
    }
    await page.click(".bd-pts > summary");
    await axe(`the builder's points open, ${theme}`);
    await page.click(".bd-head h1");
  }
  await shot(page, "5-builder-320-light");
  console.log("builder: Vesk built step by step on 35 points and checked against her sheet, changed past 35, and a blank one on 36");
  await context.close();
}

// 5b. The builder on a phone held in one hand.
if (part("5b")) {
  for (const theme of ["dark", "light"]) {
    // Motion on in the dark and off in the light, so both get looked at.
    const still = theme === "light";
    const { context, page } = await phone({ reducedMotion: still ? "reduce" : "no-preference" });
    if (theme === "light") await page.addInitScript(() => localStorage.setItem("zi-theme", "light"));
    const axe = async (what) => {
      // With motion on, a step's cards are still sliding in for a moment, and
      // a card halfway in reads as low contrast, so axe waits till they've landed.
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity), null, { timeout: 3000 }).catch(() => {});
      const result = await new AxeBuilder({ page }).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
    };
    const b = (attrs) => page.click(`button[data-act="b"]${attrs}`);
    const jump = async (s) => {
      await page.click(".bd-jump > summary");
      await page.click(`.bd-dot[data-s="${s}"]`);
    };
    await page.goto(`${BASE}/characters/?build`);
    await page.waitForSelector(".bd-head h1");
    same(await page.isVisible(".topbar"), false, `the site's bar off the builder, ${theme}`);
    if (!(await page.$(".bd-head .zd-crest"))) note(`no crest at the top of the builder, ${theme}`);
    const first = await page.$eval('[data-b="arch"]', (el) => Math.round(el.getBoundingClientRect().top + scrollY));
    if (first > 420) note(`the first archetype card starts ${first}px down at 390 by 844, ${theme}`);
    same(await page.$$eval(".bd-progress li", (els) => [els.length, new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size]), [7, 1], `the seven steps in one line, ${theme}`);
    // The steps and the points a tap away from the bar close with Escape, or a
    // tap anywhere else, and opening one shuts the other.
    for (const menu of [".bd-jump", ".bd-pts"]) {
      await page.click(`${menu} > summary`);
      await page.keyboard.press("Escape");
      same(await page.$eval(menu, (el) => [el.open, document.activeElement === el.querySelector("summary")]), [false, true], `Escape closing ${menu}, ${theme}`);
      await page.click(`${menu} > summary`);
      await page.click(".bd-lead");
      same(await page.$eval(menu, (el) => el.open), false, `a tap elsewhere closing ${menu}, ${theme}`);
    }
    // The book's words for a step behind a ?, open and shut again.
    await page.click(".bd-lead .tip");
    has(await page.textContent(".bd-lead .tip-card:popover-open"), "An archetype’s 5 points", `the first step's words behind its ?, ${theme}`);
    await page.keyboard.press("Escape");
    same(await page.$$eval(".tip-card:popover-open", (els) => els.length), 0, `Escape putting the words away, ${theme}`);
    for (let s = 0; s < 7; s++) {
      if (s) await jump(s);
      const bar = await page.$eval(".bd-foot", (el) => [getComputedStyle(el).position, Math.round(innerHeight - el.getBoundingClientRect().bottom), Boolean(el.querySelector(".bd-pts-say")?.checkVisibility())]);
      same(bar, ["fixed", 0, true], `Back, Next and the points at the bottom of the screen on step ${s + 1}, ${theme}`);
      const small = await page.$$eval(".bd-foot button, .bd-foot summary", (els) => els.filter((el) => el.checkVisibility() && (el.getBoundingClientRect().height < 44 || el.getBoundingClientRect().width < 44)).length);
      same(small, 0, `the bar's buttons 44px or more on step ${s + 1}, ${theme}`);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (wide > 0) note(`step ${s + 1} scrolls sideways at 390 wide, ${theme} (${wide}px)`);
      await axe(`the builder's step ${s + 1} at 390 by 844, ${theme}`);
    }
    await shot(page, `5b-builder-check-${theme}`);
    // A Title's 5 Root points going on give its Root a d10 in the dock above
    // the bar, and a permission on the same Root grows it into a d12.
    await jump(1);
    await b('[data-b="sall"][data-t="0"][data-v="Body"]');
    same(await page.getAttribute('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', "data-d"), "10", `Body a d10 with a Title's 5 on it, ${theme}`);
    await page.fill("#b-t0-p0", "hold the line");
    await b('[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]');
    const grown = await page.$eval('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', (el) => [el.dataset.d, el.classList.contains("is-grown")]);
    same(grown, ["12", !still], `Body a d12 with a permission on it too, ${still ? "swapped straight away under reduce-motion" : "growing into it"}, ${theme}`);
    if (still) same(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length), 0, `nothing moving under reduce-motion, ${theme}`);
    await page.waitForTimeout(400);
    await shot(page, `5b-builder-titles-${theme}`);
    // + on Mind and on Soul each take one off Body, a tap each.
    await b('[data-b="snudge"][data-t="0"][data-v="Mind"][data-n="1"]');
    await b('[data-b="snudge"][data-t="0"][data-v="Soul"][data-n="1"]');
    same(await page.$$eval(".bd-rail .tile-steps", (els) => els.map((el) => el.textContent)), ["4 steps", "1 step", "1 step"], `one each on Mind and Soul off Body, ${theme}`);
    const steppers = await page.$$eval('.bd-spread .cc-stepbtn', (els) => els.filter((el) => el.checkVisibility() && (el.getBoundingClientRect().height < 44 || el.getBoundingClientRect().width < 44)).length);
    same(steppers, 0, `the spread's + and − 44px or more, ${theme}`);
    // axe again with things picked: a spread and a permission, an archetype
    // with its ability and what one does behind its ?, a Title idea, an item
    // open with its kind and tier, the points open, and a crew question made
    // into a thread.
    await axe(`a Title with a spread and a permission, ${theme}`);
    await jump(0);
    await b('[data-b="arch"][data-t="0"][data-v="Warrior"]');
    const warrior = BUILD.archetypes.find((a) => a.name === "Warrior");
    await b(`[data-b="abil"][data-t="0"][data-v="${warrior.abilities[0].name}"]`);
    // Ten abilities on the card, each its name and its Aura, with what it
    // does behind its ?, so the card's short.
    same(await page.$$eval('.bd-abil-row', (els) => els.map((el) => [el.querySelector('[data-b="abil"]').dataset.v, Boolean(el.querySelector(".tip"))])), warrior.abilities.map((x) => [x.name, true]), `the Warrior's abilities, each with a ?, ${theme}`);
    same(await page.$$eval('[data-b="abil"] .bd-for', (els) => els.length), 0, `no ability's words on the card till its ? is tapped, ${theme}`);
    const abilH = await page.$eval(".bd-abils", (el) => Math.round(el.getBoundingClientRect().height));
    if (abilH > 700) note(`the Warrior's ten abilities take ${abilH}px at 390 wide, ${theme}`);
    await page.click(".bd-abil-row:nth-child(2) .tip");
    has(await page.textContent(".bd-abil-row:nth-child(2) .tip-card:popover-open"), "Aura each time you use it", `an ability's words behind its ?, ${theme}`);
    await page.keyboard.press("Escape");
    await axe(`an archetype and its ability picked, ${theme}`);
    await jump(1);
    await unfold(page, "bd-ideas-0");
    await b('[data-b="idea"][data-t="0"][data-v="k-warrior"]');
    await axe(`a Title idea, ${theme}`);
    await jump(3);
    await b('.bd-seg[data-v="i"]');
    await unfold(page, "bd-kitideas");
    await b('[data-b="additem"][data-v="Shield"]');
    await unfold(page, "bd-it-0");
    same(await page.getAttribute('[data-b="ikind"][data-w="i"][data-i="0"][data-v="guard"]', "aria-pressed"), "true", `a shield off a card a guard, ${theme}`);
    await axe(`an item open with its kind and tier, ${theme}`);
    await shot(page, `5b-builder-items-${theme}`);
    await page.click(".bd-pts > summary");
    has(await page.textContent(".bd-pts-in"), "Shield", `the shield's point in what they went on, ${theme}`);
    await axe(`the points open, ${theme}`);
    await page.click(".bd-head h1");
    await jump(4);
    await unfold(page, "bd-q-0");
    await page.fill("#b-cq0", "Bram. We held the same wall.");
    await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
    await unfold(page, "bd-q-1");
    await page.fill("#b-cq1", "The fence. I owe him.");
    await b('[data-b="fromq"][data-q="1"][data-v="hostile"]');
    await axe(`crew questions made into threads, ${theme}`);
    // A lit Bond, tapped again, takes the thread back off.
    await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
    same([await page.inputValue("#b-th0-person"), await page.getAttribute('[data-b="fromq"][data-q="0"][data-v="bond"]', "aria-pressed")], ["", "false"], `a bond thread taken back off its question, ${theme}`);
    await context.close();
  }
  console.log("one hand: the builder full screen, the first choice high up, the steps in one line, the points, Back and Next at the bottom, and the dice growing, in both themes");
}

// 5c. The other ways in, and characters built before. Every crew member made
// into a build has the sheet the chapter gives them, on 35 points, and a
// thousand random characters spend exactly 35 and pass every check. A
// character built before stacking keeps everything, even past 35: its Roots
// recounted with a Title's old Root getting its 3, its specialties dropped,
// and its archetypes keeping their abilities, dealt out between copies. Then
// on the phone: Bram from the crew and a random one saved, a way in asking
// before it bins a draft, Vesk from the crew becoming your own with her play
// kept, one built before stacking told what changed and asked only what's
// theirs to choose, and Tamsin from before Roots rebuilt.
if (part("5c")) {
  for (const crew of book.crew) {
    const want = rootsSheet(crew, [], BUILD);
    const quick = fromCrew(crew, BUILD);
    // The name's left for the player, since they're making their own.
    same(checksOf(quick, BUILD).map((x) => x.text).filter((x) => !/needs a name/.test(x)), [], `${crew.name} made into a quick build, with nothing else to flag`);
    same(pointsOf(quick).spent, 35, `${crew.name} made into a build on 35 points`);
    const sheet = rootsSheet(sheetOf({ id: `5c-${crew.id}`, name: crew.name, build: quick }, BUILD), [], BUILD);
    same([sheet.roots, sheet.archetypes.map((a) => a.have), sheet.titles.map((t) => t.roots)], [want.roots, want.archetypes.map((a) => a.have), want.titles.map((t) => t.roots)], `${crew.name}'s Roots, abilities and spreads as a quick build`);
    same(sheetParts(rootsSheet(sheetOf({ id: `5c-${crew.id}-keep`, name: crew.name, build: fromCrew(crew, BUILD, { keep: true }) }, BUILD), [], BUILD)), sheetParts(want), `${crew.name} made into a build that keeps everything`);
  }
  let failing = 0;
  for (let n = 0; n < 1000; n++) {
    let seed = n + 1;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const x = randomBuild(BUILD, book.crew, rand);
    const checks = checksOf(x, BUILD).map((c) => c.text);
    const kinds = new Set(x.threads.filter((t) => t.person.trim()).map((t) => t.kind));
    const sheet = rootsSheet(sheetOf({ id: `rand-${n}`, name: x.name, build: x }, BUILD), [], BUILD);
    if (checks.length || pointsOf(x).spent !== 35 || sheet.points.spent !== 35 || !sheet.titles.length || !sheet.archetypes.length || sheet.attuned.length !== 1 || !kinds.has("bond") || !kinds.has("hostile")) {
      if (failing++ < 3) note(`random character ${n}: ${checks.join(" ") || `${sheet.points.spent} points, or not a Title, an archetype and one attuned thing, or not a bond and a hostile thread`}`);
    }
  }
  console.log(`ways in: six crew made into builds on 35 points, and ${1000 - failing} of 1000 random characters spending exactly 35 and passing every check`);

  // Built on the phone before stacking: Vesk with each Title on one Root,
  // specialties, Shadow twice and a grappling line with its own way to Aura.
  const OLD = { v: 3, archs: ["Shadow", "Shadow"], titles: [
    { idea: "k-rogue", text: "The best cat burglar in the city", root: "Body", specs: ["Stealth", "Climbing", "Locks"], perms: [{ text: "move unseen", root: "Body", spec: "Stealth" }, { text: "run the rooftops", root: "Body", spec: "Climbing" }, { text: "pick a mechanical lock", root: "Body", spec: "Locks" }], boons: [] },
    { idea: "", text: "Raised by the Guild", root: "Mind", specs: ["Locks", "Knives", "Black market"], perms: [{ text: "know how a lock’s built", root: "Mind", spec: "Locks" }, { text: "fight dirty with a knife", root: "Body", spec: "Knives" }, { text: "find a buyer for anything", root: "Mind", spec: "Black market" }], boons: [] }],
    equipment: [{ text: "worn leathers", arm: "Body" }, { text: "a knife", arm: "" }, { text: "", arm: "" }], utility: [{ text: "a purse of gold" }, { text: "a smoke bomb" }, { text: "a perfect set of picks" }], keepsake: { text: "the first coin she ever stole" }, bag: "",
    attuned: [{ name: "A grappling line", props: "", stage: "Awakened", catch: "", burden: "", aura: "1 the first time each scene she gets somewhere nobody else could follow", awk: [{ name: "Anywhere I can throw a hook", kind: "passive", text: "+1 on one die of every roll she makes with it, for each Aura in it" }] }],
    threads: [{ person: "Dorrie", text: "We have pulled a dozen jobs. I trust her with my life.", kind: "bond", whose: "" }, { person: "Bram", text: "He once carried me out of a fire. I have never said thank you.", kind: "bond", whose: "" }, { person: "The fence", text: "I owe a debt I would rather not discuss.", kind: "hostile", whose: "" }],
    connect: [], aspiration: "Own the score of a lifetime", name: "Vesk", pronoun: "her", blurb: "", trouble: [], order: ["Locks", "Stealth"] };
  {
    const nb = normalBuild(OLD, BUILD);
    same([nb.v, nb.have, nb.titles.map((t) => [t.roots, t.from]), nb.stack, nb.attuned[0].awk.map((w) => [w.root, w.guessed])], [6, [["Push"], ["Vanish"]], [[{ Body: 5, Mind: 0, Soul: 0 }, "Body"], [{ Body: 0, Mind: 5, Soul: 0 }, "Mind"]], true, [["Body", true]]], "a build from before stacking: each Title's 5 on its old Root, Shadow's abilities dealt between her two, and her hook on her biggest Root till she says");
    same(JSON.stringify(nb).match(/spec|order|"aura"/g), null, "its specialties and its thing's own Aura gone");
    const old = rootsSheet(sheetOf({ id: "5c-old", name: "Vesk", build: OLD }, BUILD), [], BUILD);
    same([old.roots, old.points, old.numbers.aura, RS.choicesOf(old)], [{ Body: 9, Mind: 7, Soul: 0 }, { start: 35, spent: 31 }, 5, [{ k: "spread", t: 0, root: "Body" }, { k: "spread", t: 1, root: "Mind" }, { k: "lock", a: 0, name: "Anywhere I can throw a hook", root: "Body" }, { k: "points", left: 4 }]], "her Roots recounted, her points with her utility items gone, Aura 5, and what's hers to choose");
    same(checksOf(nb, BUILD, { changing: true }).map((x) => x.text), ["You’ve got 4 points left to spend."], "a saved character only told about the points she's got left");
    // Grown past 35, it keeps everything, and nothing's flagged.
    const grown = foldGrown(OLD, [{ k: "perm", t: 0, text: "slip a grip", root: "Body", spec: "Stealth" }, { k: "title", text: "The woman who has never been seen", root: "Body", specs: ["Hiding"], perm: { text: "vanish in a crowd", root: "Body", spec: "Hiding" } }, { k: "arch", arch: "Hunter" }], BUILD);
    same([pointsOf(grown).spent, grown.have, grown.titles[2].roots, checksOf(grown, BUILD, { changing: true }).length], [43, [["Push"], ["Vanish"], ["Push", "Mark the pack"]], { Body: 5, Mind: 0, Soul: 0 }, 0], "what she grew before stacking folded in, 46 points and nothing flagged");
    // Built on stacking: each Title's 3 made 5 the way they were spread, said
    // till it's saved, and her hook on her biggest Root.
    const STACKED = { ...structuredClone(OLD), v: 4, titles: OLD.titles.map((t, i) => ({ ...t, root: undefined, specs: undefined, roots: i ? { Body: 1, Mind: 2, Soul: 0 } : { Body: 3, Mind: 0, Soul: 0 } })) };
    const st = normalBuild(STACKED, BUILD);
    same([st.v, st.core, st.titles.map((t) => [t.roots, t.three]), st.attuned[0].awk[0].root], [6, true, [[{ Body: 5, Mind: 0, Soul: 0 }, { Body: 3, Mind: 0, Soul: 0 }], [{ Body: 2, Mind: 3, Soul: 0 }, { Body: 1, Mind: 2, Soul: 0 }]], "Body"], "a build from stacking: each Title's 3 made 5 the way it was spread, saying what it was");
    const stSheet = rootsSheet(sheetOf({ id: "5c-stacked", name: "Vesk", build: STACKED }, BUILD), [], BUILD);
    same([stSheet.roots, stSheet.core, RS.choicesOf(stSheet).map((x) => x.k)], [{ Body: 11, Mind: 5, Soul: 0 }, undefined, ["five", "five", "lock", "points"]], "its sheet the chapter's Vesk, with each Title's 5 and her hook for her to check");
    // From before Roots: each Title's spread the way its permissions lean.
    const tam = normalBuild({ v: 2, titles: [{ arch: "Warrior", text: "The best blade on the docks", perms: [{ text: "fight with a sword", on: ["Fight"] }, { text: "read a fighter’s style", on: ["Study"] }] }], actions: ["Fight", "Study"], equipment: [], utility: [], attuned: [], threads: [] }, BUILD);
    same([tam.titles[0].roots, tam.titles[0].perms.map((p) => p.root), tam.have], [{ Body: 3, Mind: 2, Soul: 0 }, ["Body", "Mind"], [RS.hadOf("Warrior", BUILD.archetypes.find((a) => a.name === "Warrior").abilities.map((x) => x.name))]], "a Title from before Roots spread the way its permissions lean, its archetype with the abilities it had");
    // Built on the new core before the fixes (v 5): Bram with Fine plate and
    // a shield on his Body, a hammer, utility items, a bag and a Toughness
    // Boon. His equipment's items at tier 2 (his plate 3, a shield a guard),
    // his utility items and bag go into his notes, and the Boon's 2 points
    // are his to spend, flagged.
    const bram = fromCrew(book.crew.find((c) => c.id === "bram"), BUILD, { keep: true });
    const V5 = { ...structuredClone(bram), v: 5, items: undefined, equipment: [{ text: "plate armour", arm: "Body", q: 2 }, { text: "a shield", arm: "Body" }, { text: "a war hammer", arm: "" }], utility: [{ text: "a purse of gold" }, { text: "rope" }, { text: "" }], bag: "chalk\nbandages", keepsake: { text: "his old sergeant’s stripes" } };
    V5.titles[1].boons = [{ lever: "Toughness", name: "Thick skull", on: "" }];
    delete V5.items;
    V5.attuned = V5.attuned.map(({ kind, tier, root, props, ...a }) => ({ ...a, props: "Breaker" }));
    const nb5 = normalBuild(V5, BUILD);
    same([nb5.v, nb5.fixes, nb5.items.map((it) => [it.text, it.kind, it.tier, it.root]), nb5.carried, nb5.titles[1].boonsGone], [6, true, [["plate armour", "armour", 3, "Body"], ["a shield", "guard", 2, ""]], { utility: ["a purse of gold", "rope"], bag: ["chalk", "bandages"] }, [{ lever: "Toughness", name: "Thick skull" }]], "a build from before the fixes: items at tier 2, Fine plate tier 3, a shield a guard, his hammer the attuned thing, utility and bag kept for his notes, and his Boon gone");
    same([nb5.attuned[0].kind, nb5.attuned[0].props], ["weapon", ["Breaker"]], "his attuned hammer a weapon with Breaker");
    const s5 = rootsSheet(sheetOf({ id: "5c-v5", name: "Bram", build: V5 }, BUILD), [], BUILD);
    same([s5.points.spent, RS.choicesOf(s5).map((x) => x.k)], [34, ["boon", "points"]], "his sheet a point under 35 with his helmet and Boon gone, his Boon and his points to spend flagged");
    const st5 = RS.normalCore({ v: 4, pts: { Body: 3, Mind: 3, Soul: 4 }, boxes: { "equipment|plate armour": 1 }, notes: "Owes Murk" }, s5);
    has(st5.notes, "Owes Murk\nWhat you carried before Resources: a purse of gold, rope, chalk, bandages.", "his utility items and bag in his notes");
    same([st5.soak, "boxes" in st5, st5.choose.map((x) => x.k)], [{}, false, ["boon", "points"]], "his plate's soak full and its boxes gone, with the Boon and his points his to choose");
    same(JSON.stringify(Object.keys(normalBuild(nb5, BUILD))).includes("equipment"), false, "nothing left of equipment once it's moved across");
  }

  const { context, page } = await phone();
  const b = (attrs) => page.click(`button[data-act="b"]${attrs}`);
  // Bram from the crew, saved as is, has his sheet.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="bram"]');
  has(await page.textContent(".bd-head"), "From Bram", "the builder from Bram");
  same((await page.textContent(".bd-pts-say")).replace(/\s+/g, " ").replace("Points: ", "").trim(), "0 left, 35 of 35 spent", "Bram's 35 points spent");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const bram = rootsSheet(book.crew.find((c) => c.id === "bram"), [], BUILD);
  const mineBram = sheetFor((await savedAll(page)).at(-1));
  same(sheetParts({ ...mineBram, threads: [] }), sheetParts({ ...bram, threads: [] }), "Bram from the crew, saved with his sheet");
  // A random one saves on 35.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="random"]');
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  same(sheetFor((await savedAll(page)).at(-1)).points.spent, 35, "a random character saved on 35 points");
  // A way in asks before it bins a draft.
  await page.goto(`${BASE}/characters/?build`);
  await page.click(".bd-jump > summary");
  await page.click('.bd-dot[data-s="6"]');
  await page.fill("#b-name", "Kaia");
  await page.click('.cc-back[data-b="leave"]');
  await page.click('button[data-act="bway"][data-w="blank"]');
  has(await page.textContent('button[data-act="bway"][data-w="blank"]'), "Tap again to bin Kaia", "a way in asking before it bins the draft");
  await page.click('button[data-act="bway"][data-w="blank"]');
  has(await page.textContent(".bd-head"), "A blank sheet", "a blank sheet once the draft's binned");
  await page.click('.cc-back[data-b="leave"]');

  // Vesk from the crew, part way through a scene, becomes your own the first
  // time a change is saved, and keeps her play.
  const vesk = await crewOn(page, "vesk");
  await setState(page, vesk.id, { aura: 4, pts: { Body: 7, Mind: 5, Soul: 0 } });
  await page.goto(`${BASE}/characters/?build=${encodeURIComponent(vesk.id)}`);
  has(await page.textContent(".bd-head"), "Change anything on her sheet", "changing Vesk from the crew");
  await unfold(page, "bd-it-1");
  await b('[data-b="itier"][data-w="i"][data-i="1"][data-v="3"]');
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const mine = (await savedAll(page)).find((c) => c.from === "vesk");
  same([mine.crew, Boolean(mine.build), mine.state.aura, mine.state.pts?.Body], ["own", true, 4, 7], "Vesk your own, with her Aura spent and her Body's points kept");
  same(await page.$$eval(".cc-gold, .cc-gem", (els) => els.length), 0, "no gold marks on Vesk once she's your own");
  same([sheetFor(mine).roots, sheetFor(mine).items[1].tier, sheetFor(mine).points.spent], [rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD).roots, 3, 36], "her Roots as they were, and her knife a tier up for a point");

  // Vesk built on the phone before stacking: her play screen knows what's
  // hers to choose, and Change says what changed and asks only that.
  await page.evaluate((build) => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    all.characters.push({ id: "own-v3", crew: "own", name: "Vesk", hash: "own", build, state: { v: 2, aura: 5, acting: false, tracks: { stamina: 12, confidence: 12, resolve: 12 }, scars: { stamina: [], confidence: [], resolve: [] }, store: { "0|Anywhere I can throw a hook": 1 }, conditions: [], threads: {}, crossed: {}, boxes: {}, picked: [], asp: 4, aspText: "", notes: "Owes the fence", grown: [] } });
    localStorage.setItem("zi-characters", JSON.stringify(all));
  }, OLD);
  await page.goto(`${BASE}/characters/?c=own-v3`);
  await playing(page);
  const moved = (await savedAll(page)).find((c) => c.id === "own-v3").state;
  // The play screen moves her state on (stacking's, or the new core's once
  // it's there), with what's hers to choose.
  same([[3, 4, 5].includes(moved.v), moved.choose], [true, [{ k: "spread", t: 0, root: "Body" }, { k: "spread", t: 1, root: "Mind" }, { k: "lock", a: 0, name: "Anywhere I can throw a hook", root: "Body" }, { k: "points", left: 4 }]], "moved on with what's hers to choose: two Titles to spread, her hook's Root and 4 points");
  await page.goto(`${BASE}/characters/?build=own-v3`);
  const told = (await page.textContent(".cc-note.is-gold")).replace(/\s+/g, " ");
  has(told, "Vesk keeps everything since the stacking change. Each Title that was on one Root has all 5 on it, so spread them how you like, and you’ve got 4 points to spend.", "what changed, and what's hers to choose");
  has((await page.textContent(".bd-fixes")).replace(/\s+/g, " "), "Vesk’s things are items now.", "her things items now, said");
  has(await page.textContent(".bd-title:has(#b-t1-text) .bd-was"), "It was all on your Mind, so it still is.", "her second Title on its old Root");
  same(await page.$$eval("[data-b='abil'][aria-pressed='true']", (els) => els.map((el) => `${el.dataset.t}:${el.dataset.v}`)), ["0:Push", "1:Vanish"], "her Shadows keeping Push and Vanish");
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="1"]');
  same(await page.$$eval(".bd-title:has(#b-t1-text) .bd-was", (els) => els.length), 0, "spread, it isn't on its old Root any more");
  await b('[data-b="snudge"][data-t="1"][data-v="Body"][data-n="1"]');
  await b('[data-b="snudge"][data-t="1"][data-v="Mind"][data-n="-1"]');
  await b('[data-b="snudge"][data-t="1"][data-v="Mind"][data-n="1"]');
  await b('[data-b="additem"]:not([data-v])');
  await page.fill("#b-i2", "soft-soled boots");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const v3 = (await savedAll(page)).find((c) => c.id === "own-v3");
  same([v3.build.v, "stack" in v3.build, "fixes" in v3.build, v3.build.titles.some((t) => "from" in t || "three" in t), v3.build.attuned[0].awk[0], v3.state.choose, v3.state.asp], [6, false, false, false, { name: "Anywhere I can throw a hook", root: "Body", text: "+1 on one die of every roll she makes with it, for each Aura in it" }, [{ k: "points", left: 3 }], 4], "saved on the fixes, her hook on her Body, with her points left to spend and her play kept");
  has(v3.state.notes, "Owes the fence\nWhat you carried before Resources: a purse of gold, a smoke bomb, a perfect set of picks.", "her notes kept, with her utility items in them");
  same(sheetFor(v3).roots, rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD).roots, "her Roots recounted the chapter's way");

  // Tamsin, built on the phone before Roots, rebuilt on stacking.
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("zi-characters"));
    list.characters.push({ id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a sword", on: ["Fight"] }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [{ person: "Dorrie", text: "She owes me.", kind: "hostile", whose: "" }], connect: [], aspiration: "Run the docks", name: "Tamsin", pronoun: "her" },
      state: { aura: 4, resolve: 2, conf: 8, wound: 2, scars: [], conditions: [], threads: {}, notes: "Owes Dorrie" } });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  });
  await page.goto(`${BASE}/characters/?c=own-old`);
  has(await page.textContent("main"), "Rebuild Tamsin on Roots", "Tamsin shown as she was, with a way to rebuild her");
  await page.click('a[data-act="bopen"][data-key="own-old"]');
  has(await page.textContent(".bd-head"), "Her sheet on Roots", "rebuilding Tamsin");
  same(await page.inputValue("#b-t0-text"), "The best blade on the docks", "her Title carried across");
  same(await page.inputValue("#b-t0-p0"), "fight with a sword", "her permission carried across");
  // Her Title's 3 and her permission start on the Root their words suggest,
  // a guess to check: here it's her Body.
  same(await page.getAttribute('button[data-b="sall"][data-t="0"][data-v="Body"]', "aria-pressed"), "true", "her Title's 5 Root points guessed from its permission");
  same(await page.getAttribute('button[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]', "aria-pressed"), "true", "her permission's Root guessed from its words");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const tam = (await savedAll(page)).find((c) => c.id === "own-old");
  same([tam.build.v, [3, 4, 5].includes(tam.state.v), "before" in tam.state, tam.state.notes, sheetFor(tam).roots, sheetFor(tam).items.map((it) => [it.name, it.kind, it.tier])], [6, true, false, "Owes Dorrie", { Body: 6, Mind: 0, Soul: 0 }, [["a sword", "weapon", 2]]], "Tamsin saved on the fixes, her Body 6, her sword an item and her notes kept");
  same(sheetFor(tam).threads.find((p) => p.person === "Dorrie")?.threads[0]?.text, "She owes me.", "her hostile thread with Dorrie kept");
  console.log("ways in: Bram and a random one saved, a draft binned on a second tap, Vesk your own with her play kept, one from before stacking asked only what's hers, and Tamsin rebuilt");
  await context.close();
}

// 6. Print on the phone, from the Sheet tab's button: Vesk part way through a
// scene, read back field by field, then Bram's plate and Dorrie's court
// clothes. They go on the phone as saved characters, so this doesn't lean on
// the play screen's buttons to get them there.
if (part("6")) {
  const { context, page } = await phone();
  const crewOf = (id) => book.crew.find((c) => c.id === id);
  const saved = (id, state) => ({ id: `print-${id}`, crew: id, name: crewOf(id).name, made: Date.now(), hash: crewOf(id).hash, state: { v: 3, ...state } });
  await page.goto(`${BASE}/characters/`);
  await page.evaluate((list) => localStorage.setItem("zi-characters", list), JSON.stringify({ v: 1, characters: [
    // A Scar at her Stamina, Burning on her, her hook powered with 2 and 1
    // Aura spent, a strained thread and her smoke bomb used.
    saved("vesk", {
      aura: 4, tracks: { stamina: 4, confidence: 12, resolve: 12 }, scars: { stamina: ["a burn across the back"], confidence: [], resolve: [] },
      power: { "0|Anywhere I can throw a hook": 2 }, conditions: [{ name: "Burning", die: 6, kind: "against" }],
      threads: { "Dorrie|We have pulled a dozen jobs. I trust her with my life.": "strained" }, crossed: { "utility|a smoke bomb": true },
    }),
    saved("bram", { boxes: { "equipment|plate armour": 1 } }),
    saved("dorrie", {}),
  ] }));
  const print = async (id) => {
    await page.goto(`${BASE}/characters/?c=print-${id}&t=sheet`);
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('button[data-act="print"]')]);
    const pdf = await PDFDocument.load(readFileSync(await download.path()));
    const form = pdf.getForm();
    const get = (name) => {
      const f = form.getFieldMaybe(name);
      if (!f) return null;
      return f.getText ? f.getText() ?? "" : f.getSelected ? f.getSelected() ?? "" : f.isChecked();
    };
    return { pages: pdf.getPageCount(), file: download.suggestedFilename(), get };
  };
  const want = (f, list, who) => {
    for (const [name, value] of list) same(f.get(name), value, `${name} on ${who}`);
  };
  let f = await print("vesk");
  same([f.pages, f.file], [2, "vesk-zidara-sheet.pdf"], "Vesk's printed sheet");
  // Saved by the play screen as it is now, her state's read the way it moves
  // onto the new core: every Root full, and her Stamina's Scar on her Body.
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "4"], ["aura_max", "5"], ["toll", ""], ["stride", "3"],
    ["root_body_now", "9"], ["root_body_holds", "9"], ["root_body_locked", "2"], ["root_body_wound", false], ["root_body_scar_1", "a burn across the back"], ["root_mind_now", "5"], ["root_soul_now", "0"],
    ["item_1", "worn leathers"], ["item_1_kind", "armour"], ["item_1_tier", "2"], ["item_1_root", "body"], ["item_1_box_1", false],
    ["root_body", "11"], ["root_body_dice", "d12 + d10"], ["root_body_title_1", "5"], ["root_body_title_2", "2"], ["root_body_permissions", "4"], ["root_mind", "5"], ["root_mind_title_1", ""], ["root_mind_title_2", "3"], ["root_mind_permissions", "2"], ["root_soul", "0"], ["root_soul_permissions", ""],
    ["points_spent", "35"], ["points_start", "35"], ["points_banked", ""],
    ["aspiration", "Own the score of a lifetime"], ["aspiration_1", false],
    ["item_2", "a knife"], ["item_2_kind", "weapon"], ["item_4", "a set of picks"], ["item_4_tier", "3"], ["item_5", "her grappling line, attuned"], ["resources", "3"], ["resource_1", ""], ["keepsake", "the first coin she ever stole"],
    ["title_1", "The best cat burglar in the city"], ["title_1_body", "5"], ["title_1_mind", ""], ["title_1_permission_1", "move unseen"], ["title_1_permission_1_root", "body"],
    ["title_2", "Raised by the Guild"], ["title_2_body", "2"], ["title_2_mind", "3"], ["title_2_permission_2", "fight dirty with a knife"], ["title_2_permission_2_root", "body"], ["title_2_permission_3_root", "mind"],
    ["archetype_1", "Shadow, twice"], ["archetype_2", ""],
    ["attune_1_thing", "A grappling line"], ["attune_1_stage", "awakened"], ["attune_1_awakening_1_root", "body"], ["attune_2_thing", ""],
    ["bond_1", "Dorrie"], ["bond_1_thread_1", "We have pulled a dozen jobs. I trust her with my life."], ["bond_1_thread_1_kind", "bond"], ["bond_1_thread_1_strained", true], ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"]], "Vesk");
  same([f.get("condition_1"), f.get("condition_1_die")], ["Burning", "d6"], "Vesk's condition");
  has([1, 2, 3, 4, 5, 6].map((k) => f.get(`attune_1_awakening_${k}`)).filter(Boolean).join(" "), "Anywhere I can throw a hook: 2 steps on every roll she makes with it, and 2 more for each Aura", "her hook's awakening, whole over its lines");
  has(`${f.get("archetype_1_ability_1")} ${f.get("archetype_1_ability_2")}`, "Push (1 Aura): +3", "her Shadow's Push, +3 for taking it twice, for 1 Aura");
  has(f.get("notes_1"), "Trouble that follows her: wanted in three districts, owes the Guild.", "her trouble in Notes");
  // Bram's plate saved with a box ticked before the fixes, its soak all back
  // now, his helmet, and his shield a guard. Dorrie's court clothes on her Mind.
  f = await print("bram");
  want(f, [["item_1", "plate armour"], ["item_1_tier", "3"], ["item_1_root", "body"], ["item_1_box_1", false], ["item_2", "a helmet"], ["item_3", "a shield"], ["item_3_kind", "guard"], ["item_3_root", ""], ["archetype_1", "Guardian"], ["archetype_2", "Leader"], ["attune_1_thing", "His war hammer (Breaker)"], ["attune_1_catch", "Marked"]], "Bram");
  f = await print("dorrie");
  want(f, [["item_1", "court clothes, when they fit the scene"], ["item_1_kind", "armour"], ["item_1_root", "mind"]], "Dorrie");
  console.log("print on the phone: Vesk mid-scene, Bram's plate, helmet and shield and Dorrie's court clothes, read back field by field");
  await context.close();
}

// 7. Dice, feel and learning. First the learning round (learn.js), on the
// crew's sheets: the brute's club at Isolde's Body, answered with Wren's Body
// and everything of hers that fits an arrow, and everything of Bram's that
// fits getting his hammer under the club.
const moving = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length);
const card = (page) => page.textContent(".ln-card");
// One round from the top: Wren and Bram in, then roll with these dice (the
// three d12s and the d6, then the club's d8), or tap them in when real is set.
async function round(page, dice, real = false) {
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="pick"][data-who="wren"]');
  await page.click('button[data-do="pick"][data-who="bram"]');
  await page.click('button[data-do="next"]');
  if (real) {
    await page.click('button[data-do="real"]');
    for (const [k, v] of [["0", dice[0]], ["1", dice[1]], ["2", dice[2]], ["3", dice[3]], ["opp", dice[4]]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
    await page.click('button[data-do="pad-done"]');
  } else {
    await page.evaluate((list) => window.ziCompanion.setDice(list), dice);
    await page.click('button[data-do="roll"]');
  }
}
if (part("7")) {
  const isolde = rootsSheet(book.crew.find((c) => c.id === "isolde"), [], BUILD);
  const wren = rootsSheet(book.crew.find((c) => c.id === "wren"), [], BUILD);
  const bram = rootsSheet(book.crew.find((c) => c.id === "bram"), [], BUILD);
  // On the 17 Nov fixes, Wren's arrow is her Body, her Proven longbow (tier
  // 3) and its Long shot, and Bram's shield under the club is his Body and
  // his Trusty shield, a guard on a roll that's only stopping a blow, his
  // action in on hers as a combo: 24 steps, four d12s, the book's own.
  const bow = wren.attuned.find((a) => /bow\b/i.test(a.name));
  const bowIt = wren.items.find((x) => x.attuned === wren.attuned.indexOf(bow));
  const shield = bram.items.find((x) => x.kind === "guard");
  same([bow?.awakenings[0]?.name, bowIt?.tier, shield?.tier], ["Long shot", 3, 2], "Wren's awakening and longbow and Bram's shield for the round, off their sheets");
  const wrenSteps = wren.roots.Body + bowIt.tier + 2;
  const bramSteps = bram.roots.Body + shield.tier;
  same([wrenSteps, bramSteps, stepsToDice(wrenSteps + bramSteps)], [13, 11, [12, 12, 12, 12]], "Wren's 13 steps and Bram's 11, four d12s");
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="learn"][data-do="open"]');
  await page.waitForSelector("#ln-h");
  same(await page.evaluate(() => document.activeElement?.id), "ln-h", "focus at the start of the round");
  has(await card(page), "The brute swings his club at Isolde’s Body. That’s a d8", "the club's telegraph, at her Body");
  has(await card(page), "Isolde rolls her Body against it", "her Body when it lands");
  same(isolde.roots.Body, 0, "Isolde's Body is 0");
  has(await page.textContent("#tip-ln-ride"), "a d2 against a d8 stops it 3 times in 16", "her Body's d2 against the club, ties hers");
  has(await page.textContent("#tip-ln-ride"), "she’d be Bloodied straight away", "and Bloodied if it gets through");
  has(await card(page), "Bram’s a Guardian, so he could intercept it for free", "Bram's free intercept");
  // What isn't the lesson is behind question bubbles: the odds open with a tap
  // and go again with Esc.
  same(await page.isVisible("#tip-ln-ride"), false, "the odds out of the way till they're asked for");
  await page.click('[popovertarget="tip-ln-ride"]');
  same(await page.isVisible("#tip-ln-ride"), true, "and there when the ? is tapped");
  has(await page.textContent("#tip-ln-ride"), "stops it 3 times in 16", "with the odds in it");
  await page.keyboard.press("Escape");
  same(await page.isVisible("#tip-ln-ride"), false, "and gone again with Esc");
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), true, "rolling before Wren and Bram are in");
  same(await page.$$eval('button[data-do="pick"]', (els) => els.map((e) => e.dataset.who)), ["wren"], "Bram waiting for Wren");
  await page.click('button[data-do="pick"][data-who="wren"]');
  has(await card(page), "her Body, 8, her Proven longbow, 3 more, and its Long shot fits a shot like that, 2 more", "Wren's Body, her bow and its awakening, off her sheet");
  has(await card(page), `Body ${wren.roots.Body}, her Proven longbow and Long shot · ${wrenSteps} steps`, "Wren's tile");
  // The rules on tap are the book's, so they're left out of this one.
  same(/specialt|Archery/i.test(await page.$eval(".ln-card", (el) => {
    const c = el.cloneNode(true);
    for (const d of c.querySelectorAll("details")) d.remove();
    return c.textContent;
  })), false, "and no specialty anywhere in it");
  await page.click('button[data-do="pick"][data-who="bram"]');
  has(await card(page), `Body ${bram.roots.Body} and his Trusty shield · ${bramSteps} steps`, "Bram's Body and his shield");
  has(await page.textContent("#tip-ln-combo"), "his Body, 9, and his Trusty shield, 2 more. A shield’s a guard", "what Bram brings, behind its bubble");
  has(await card(page), `${wrenSteps} steps and ${bramSteps} steps is ${wrenSteps + bramSteps} steps`, "the combo's steps");
  has(await card(page), "so that’s four d12s", "the combo's dice");
  has(await card(page), "All four dice go on the club", "all four on the club");
  await page.click('button[data-do="back"]');
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), false, "Wren and Bram still in after going back");
  await page.click('button[data-do="next"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 4, 3, 2, 6]));
  await page.click('button[data-do="roll"]');
  same(await page.$$eval("[data-spin]", (els) => els.length), 0, "dice tumbling with reduce-motion on");
  has(await card(page), "Your 9 beats the brute’s 6, so the club never comes down", "a beaten club");
  has(await card(page), "One die won, so Wren gets 1 Aura back", "Aura for the die that won");
  has(await card(page), "she’s on 6, past her 5", "Wren past her 5 while she's acting");
  has(await page.textContent("#tip-ln-past"), "bringing her Mind in for 3", "what to spend it on, behind its bubble");
  same(await page.textContent(".ln-hex b"), "6", "Wren's Aura on 6");
  same(await page.evaluate(() => document.activeElement?.id), "ln-out", "focus on what the dice did");
  same(await moving(page), 0, "things moving on the round with reduce-motion on");
  await page.click('button[data-do="next"]');
  has(await card(page), "you stopped it, so nothing lands and the round’s over", "the end of a round that was stopped");
  await page.click('button[data-do="again"]');
  has(await page.textContent("#ln-h"), "The GM telegraphs", "playing it again");
  await round(page, [6, 2, 1, 1, 6]);
  has(await card(page), "Your 6 ties the brute’s 6. A tie’s a loss, unless you pay 1 Aura", "a tie on the club");
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  has(await card(page), "a tie that’s bought pays nothing back", "a bought tie paying nothing back");
  same(await page.textContent(".ln-hex b"), "4", "Wren's Aura after paying for the tie");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 1, 1, 7], true);
  has(await card(page), "The brute’s 7 beats your best, a 3, so the club lands on Isolde at once", "real dice that lose");
  has(await card(page), "Isolde’s Body is 0, so there’s nothing there to lose, and she’s Bloodied", "the club leaving her Bloodied");
  has(await card(page), "She could take it on her Mind instead, 2 of her 9 points", "or 2 for 1 on her Mind");
  has(await card(page), "her coat with silver thread is on her Mind", "her armour on her Mind, so it can't take a blow at her Body");
  has(await card(page), "there’s no Aura in it", "no Aura for dice that lost");
  await page.click('button[data-do="next"]');
  has(await card(page), "already landed on Isolde", "the end of a round that landed");
  await page.click('a[data-act="nav"].button');
  await page.waitForSelector('button[data-act="play"]');
  // Offline, then 320 wide in both themes with axe on every step.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(`${BASE}/characters/?learn`);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the round"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector("#ln-h", { timeout: 10000 }).catch(() => note("the round didn't open offline"));
  await page.click('details[data-open="ln-s-telegraphs"] > summary');
  has(await page.textContent('details[data-open="ln-s-telegraphs"]'), "what’s about to happen", "the telegraph rule offline");
  await page.setViewportSize({ width: 320, height: 720 });
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await page.reload();
    await page.waitForSelector("#ln-h");
    const check = async (what) => {
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`the round's ${what} scrolls sideways at 320 wide, ${theme} (${scroll} > ${client})`);
      const result = await new AxeBuilder({ page }).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on the round's ${what}, ${theme}: ${v.id} (${v.nodes.length})`);
    };
    await check("telegraph");
    await page.click('button[data-do="next"]');
    await page.click('button[data-do="pick"][data-who="wren"]');
    await page.click('button[data-do="pick"][data-who="bram"]');
    await check("answer");
    await page.click('button[data-do="next"]');
    await page.click('button[data-do="real"]');
    same(await page.evaluate(() => document.activeElement?.id), "ln-h", `focus on the real dice, ${theme}`);
    const narrow = await page.$$eval(".ln-card .cc-num", (els) => els.filter((e) => e.getBoundingClientRect().width < 44).length);
    if (narrow) note(`${narrow} of the round's number buttons are under 44px wide at 320, ${theme}`);
    await check("real dice");
    for (const [k, v] of [["0", 2], ["1", 1], ["2", 1], ["3", 1], ["opp", 7]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
    await page.click('button[data-do="pad-done"]');
    await check("roll");
    await page.click('button[data-do="next"]');
    await check("end");
    await page.click('button[data-do="again"]');
  }
  await shot(page, "learn-320-light");
  await context.close();
  console.log("learn: the round played three ways on the crew's sheets, offline, and at 320 wide in both themes");
}

// Then dice and feel. With reduce-motion the dice never tumble and nothing
// moves. With motion on, the dice tumble and land on their numbers, the roll
// card turns over, the tabs slide and Aura pops back in. Sound and buzz stay
// off until the switch turns them on, and then a landing, a top face, a hit
// and a hit at a track's smallest size each get one.
if (part("7")) {
  const { context, page } = await phone({ reducedMotion: "no-preference" });
  await context.addInitScript(() => {
    window.__feel = { sounds: 0, buzz: [] };
    const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const node = () => ({ connect: (n) => n });
    window.AudioContext = class {
      constructor() { Object.assign(this, { currentTime: 0, sampleRate: 44100, state: "running", destination: node() }); }
      createOscillator() { return { ...node(), frequency: param(), start() { window.__feel.sounds++; }, stop() {} }; }
      createGain() { return { ...node(), gain: param() }; }
      createBuffer(_, len) { return { getChannelData: () => new Float32Array(len) }; }
      createBufferSource() { return { ...node(), start() { window.__feel.sounds++; } }; }
      createBiquadFilter() { return { ...node(), frequency: param() }; }
      resume() { return Promise.resolve(); }
    };
    Object.defineProperty(Navigator.prototype, "vibrate", { configurable: true, value: (p) => (window.__feel.buzz.push(p), true) });
  });
  const heard = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__feel)));
  const quiet = () => page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await play(page, "vesk");
  same(await page.getAttribute(".cc-sound", "aria-pressed"), "false", "sound before it's turned on");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.$$eval(".cc-page.cc-go-next", (els) => els.length), 1, "the Sheet tab sliding in");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$$eval(".cc-page.cc-go-back", (els) => els.length), 1, "the Play tab sliding back");
  // Her Body against a d6, her d12 on its top face, with 1 Aura spent so
  // there's room for it to come back.
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('.cc-roots .tile[data-r="Body"]');
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([12, 3, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  same(await page.$$eval("#cc-dialog .dlg-body.cc-flip", (els) => els.length), 1, "the roll card turning over");
  if (!(await page.$$eval("#cc-dialog [data-spin]", (els) => els.length))) note("Vesk's dice didn't tumble");
  else if (!(await moving(page))) note("the dice don't move while they tumble");
  await page.waitForSelector("#cc-dialog .dlg-body.cc-reveal", { timeout: 5000 }).catch(() => note("Vesk's dice never landed"));
  same(await page.$$eval("#cc-dialog .cc-res .zd-die", (els) => els.map((e) => e.textContent)), ["12", "3"], "Vesk's dice once they've landed");
  same(await heard(), { sounds: 0, buzz: [] }, "sound and buzz before they're turned on");
  same(await page.$$eval(".t-aura .zd-chit.is-new", (els) => els.length), 0, "no Aura hex popping in behind the roll card");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  same(await page.$$eval(".t-aura .zd-chit.is-new", (els) => els.length) > 0, true, "Aura hexes popping in as the card closes");
  // Sound on: a landing knocks, a top face chimes and buzzes.
  await page.click(".cc-sound");
  same(await page.getAttribute(".cc-sound", "aria-pressed"), "true", "the sound switch");
  same(await page.evaluate(() => localStorage.getItem("zi-sound")), "on", "sound remembered");
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await page.click('#cc-panel button[data-act="acting"][data-v="0"]').catch(() => {});
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('.cc-roots .tile[data-r="Body"]');
  await page.evaluate(() => window.ziCompanion.setDice([12, 6]));
  await quiet();
  await page.click('#cc-dialog button[data-act="go"]');
  await page.click("#cc-dialog .cc-res");
  await page.waitForSelector("#cc-dialog .dlg-body.cc-reveal", { timeout: 2000 }).catch(() => note("a tap didn't skip the tumble"));
  let got = await heard();
  if (!got.sounds) note("no sound with sound on");
  has(JSON.stringify(got.buzz), "[20,50,20]", "a top face's buzz");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  // A hit for every point of her Body, then the one that leaves her Bloodied.
  await page.click('.cc-stat[data-p="Body"]');
  await quiet();
  // Her leathers soak the first two, and each is still a hit.
  for (let i = 0; i < 12; i++) await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  same(await page.$$eval(".cc-stat.t-body.is-down", (els) => els.length), 1, "her Body's points going dark");
  await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
  same((await heard()).buzz, [...Array(12).fill(60), [70, 60, 120]], "two hits soaked and ten more, then the one that leaves her Bloodied");
  await shot(page, "vesk-motion");
  await context.close();
  console.log("feel: the dice tumble and land, the cards turn and slide, and sound waits to be turned on");
}

// 7b. A character in one hand: full screen with the crest at the top, the
// first Root high up, the Roots drawn as the dice they roll, a roll built
// (her lock) under two screens, her d12 front and centre with its top face
// lit, and the Sheet tab under two screens with its folds shut, with axe on
// all of it in both themes. A hit with reduce-motion on swaps the track's
// shape, and nothing moves.
if (part("7b")) {
  for (const theme of ["dark", "light"]) {
    const { context, page } = await phone();
    if (theme === "light") await page.addInitScript(() => localStorage.setItem("zi-theme", "light"));
    const axe = async (what) => {
      const result = await new AxeBuilder({ page }).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
    };
    // How tall the roll card's content is, head, body and foot, in screens.
    const card = () => page.evaluate(() => {
      const d = document.querySelector("#cc-dialog");
      const h = [".dlg-head", ".dlg-body", ".dlg-foot"].reduce((t, sel) => t + (d.querySelector(sel)?.scrollHeight ?? 0), 0);
      return h / innerHeight;
    });
    await play(page, "vesk");
    same(await page.isVisible(".topbar"), false, `the site's bar off a character, ${theme}`);
    if (!(await page.$(".cc-head .zd-crest"))) note(`no crest at the top of Vesk's sheet, ${theme}`);
    const top = await page.$eval(".cc-roots .tile[data-r]", (el) => Math.round(el.getBoundingClientRect().top + scrollY));
    if (top > 420) note(`the first Root starts ${top}px down at 390 by 844, ${theme}`);
    same(await page.$$eval(".cc-roots .tile .tile-dice .zd-die", (els) => els.map((e) => e.dataset.d)), ["12", "10", "10", "2"], `Vesk's Roots drawn as the dice they roll, ${theme}`);
    same(await page.$$eval(".cc-track .is-trk .cc-pips", (els) => els.map((e) => e.querySelectorAll("i.on").length)), [10, 5, 0], `her points as pips, ${theme}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (wide > 0) note(`the play screen scrolls sideways by ${wide}px, ${theme}`);
    const small = await page.$$eval(".cc-roots .tile, .cc-more .tile, .cc-stat, .cc-tabs a, .cc-play button, .cc-abilities button, .cc-attune button", (els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
    if (small) note(`${small} tap targets under 44px on the play screen, ${theme}`);
    const broken = await page.$$eval(".tile-name", (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    if (broken.length) note(`names that don't fit their tiles: ${broken.join(", ")}, ${theme}`);
    await axe(`the play screen, ${theme}`);
    // Over the roof with her hook and her Mind brought in: the card stays
    // under two screens with all of it on.
    await page.click('.cc-roots .tile[data-r="Body"]');
    await page.click('#cc-dialog .cc-pick[data-act="awk"]');
    await page.click('#cc-dialog button[data-act="bring"][data-v="Mind"]');
    await page.click('#cc-dialog button[data-act="bperm"][data-r="Mind"][data-v="perm|1|0"]');
    await page.click('#cc-dialog button[data-act="foe-add"][data-v="6"]');
    has(await page.textContent("#cc-dialog .cc-dice"), "20 steps, 3d12 + d4", `her roll built, ${theme}`);
    const tallCard = await card();
    if (tallCard > 2) note(`a roll built runs ${tallCard.toFixed(1)} screens, ${theme}`);
    const smallChips = await page.$$eval("#cc-dialog .cc-pick, #cc-dialog .cc-chipbtn, #cc-dialog .button", (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim()));
    if (smallChips.length) note(`tap targets under 44px on the roll card: ${smallChips.slice(0, 4).join(", ")}, ${theme}`);
    const cardWide = await page.$eval("#cc-dialog .dlg-body", (el) => el.scrollWidth - el.clientWidth);
    if (cardWide > 0) note(`the roll card scrolls sideways by ${cardWide}px, ${theme}`);
    await shot(page, `one-hand-roll-${theme}`);
    await axe(`a roll built, ${theme}`);
    await page.evaluate(() => window.ziCompanion.setDice([12, 2, 1, 1, 3]));
    await page.click('#cc-dialog button[data-act="go"]');
    await page.waitForSelector("#cc-dialog .res .res-out");
    same(await page.$eval("#cc-dialog .cc-stage .res .zd-die", (el) => [el.dataset.d, el.textContent, el.classList.contains("is-top")]), ["12", "12", true], `her 12 on the d12, front and centre with its top face lit, ${theme}`);
    await axe(`a roll, ${theme}`);
    await page.click('#cc-dialog button.primary[data-act="close"]');
    await page.click('.tile[data-act="defence"]');
    await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
    await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
    await axe(`When it lands with Defend, ${theme}`);
    await page.click('#cc-dialog .dlg-head button[data-act="close"]');
    await page.click('.cc-tabs a[data-t="sheet"]');
    const tall = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
    if (tall > 2) note(`the Sheet tab runs ${tall.toFixed(1)} screens with its folds shut, ${theme}`);
    same(await page.$$eval("details.cc-fold[open]", (els) => els.length), 0, `the Sheet tab's folds shut to start, ${theme}`);
    same(await page.$$eval(".cc-fold-g .cc-gl", (els) => els.slice(0, 3).map((e) => e.textContent.replace(/\s+/g, " ").trim())), ["Body 10/10", "Mind 4/5", "Soul 0/0"], `her Roots at a glance, ${theme}`);
    await page.click('details[data-open="sh-roots"] > summary');
    same(await page.$$eval('details[data-open="sh-roots"] .cc-from', (els) => els.map((e) => e.textContent)), ["5 from your first Title, 2 from your second, move unseen, run the rooftops, pick a mechanical lock, fight dirty with a knife", "3 from your second Title, know how a lock’s built, find a buyer for anything", "nothing yet"], `where each Root came from, ${theme}`);
    await page.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
    await axe(`the Sheet tab, ${theme}`);
    await shot(page, `one-hand-${theme}`);
    await page.click('.cc-tabs a[data-t="play"]');
    await page.click('.cc-stat[data-p="Body"]');
    await page.click('#cc-panel button[data-act="hit"][data-r="Body"]:not([data-on])');
    same([await page.textContent('.cc-stat[data-p="Body"] .v'), await page.$$eval(".cc-stat.t-body .zd-plate.on", (els) => els.length), await moving(page)], ["10/10", 1, 0], `a hit soaked with reduce-motion on: a plate lit straight away and nothing moving, ${theme}`);
    await axe(`a Root's panel, ${theme}`);
    await context.close();
  }
  console.log("one hand: the crest at the top, the Roots high up as dice, a roll built and the Sheet tab each under two screens, and the roll as a moment, in both themes");
}

// 7c. The dice roller (roller.js): any dice of yours against any of theirs,
// with no telegraph or threat, off the play screen and the Characters list,
// and since Mo's 14 Nov ask, more than one action in a throw.
if (part("7c")) {
  const dlg = "#cc-dialog";
  const line = (page, sel) => page.$eval(`${dlg} ${sel}`, (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  const count = (page, sel) => page.$$eval(`${dlg} ${sel}`, (els) => els.length);
  const outs = (page, sel = ".dz-lane .res-out") => page.$$eval(`${dlg} ${sel}`, (els) => els.map((e) => e.textContent));
  const add = async (page, side, list) => {
    for (const d of list) await page.click(`${dlg} .dz-adddie[data-side="${side}"][data-d="${d}"]`);
  };
  const tray = (page, side) => page.$$eval(`${dlg} .dz-side.is-${side} .dz-tray .zd-die`, (els) => els.map((e) => Number(e.dataset.d)));
  const go = async (page, dice) => {
    await page.evaluate((list) => window.ziCompanion.setDice(list), dice);
    await page.click(`${dlg} button[data-dz="go"]`);
    await page.waitForSelector(`${dlg} .dz-result`);
  };
  // What a question bubble says, open or shut.
  const bubble = (page, sel) => page.$eval(`${dlg} ${sel} .tip-card`, (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  // The other actions, each folded into a line, and each action's result: its
  // verdict, what each die did and its note.
  const sums = (page) => page.$$eval(`${dlg} .dz-sum`, (els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()));
  const blocks = (page) => page.$$eval(`${dlg} .dz-out`, (els) => els.map((e) => [e.querySelector(".dz-verdict")?.textContent ?? "", [...e.querySelectorAll(".res-out")].map((o) => o.textContent), e.querySelector(".dz-note")?.textContent ?? ""]));
  // Vesk's play screen, waiting on the roller's own way in rather than
  // anything else drawn there, since the play screen's moving onto stacking
  // in its own prompt (6 of notes/stacking-plan.md).
  const way = 'button[data-dz="open"][data-from="play"]';
  const saved = (page) => page.evaluate(() => localStorage.getItem("zi-characters"));
  const playing = async (page) => {
    await page.goto(`${BASE}/characters/`);
    await page.click('button[data-act="play"][data-c="vesk"]');
    await page.fill("#cc-name", "Vesk");
    await page.click('#cc-dialog button[type="submit"]');
    await page.waitForSelector(way);
  };
  {
    const { context, page } = await phone();
    await playing(page);
    const vesk = await saved(page);
    await page.click(way);
    await page.waitForSelector(`${dlg} .dz`);
    same(await page.$eval(`${dlg} button[data-dz="go"]`, (el) => el.disabled), true, "Roll waits for some dice");
    // What it's for is a question bubble rather than a paragraph, and Esc
    // puts the bubble away and leaves the roller.
    same(await count(page, ".dz .cc-lead"), 0, "no explanation taking up the screen");
    await page.click(`${dlg} .dlg-head .tip`);
    has(await page.$eval(`${dlg} .dlg-head .tip-card:popover-open`, (el) => el.textContent).catch(() => ""), "your sheet stays as it is", "off a character, its bubble says the sheet's left alone");
    await page.keyboard.press("Escape");
    same([await count(page, ".tip-card:popover-open"), await page.$eval(dlg, (el) => el.open)], [0, true], "Esc puts the bubble away and leaves the roller");
    // Bram Defends, the way When It Lands has it: 6, 3 and 1 on his d6, d6
    // and d2, against three d8s on 7, 5 and 2.
    await add(page, "you", [6, 6, 2]);
    await add(page, "them", [8, 8, 8]);
    same([await tray(page, "you"), await tray(page, "them")], [[6, 6, 2], [8, 8, 8]], "each side's dice, in the order they went on");
    has(await line(page, ".dlg-head"), "2d6 + d2 against 3d8", "the head says what's on");
    same(await page.$(`${dlg} button[data-dz="each"]`), null, "one target or several only asked of one die against several");
    same(await page.getAttribute(`${dlg} button[data-dz="def"][data-v="you"]`, "aria-pressed"), "true", "they're coming at you to start with");
    has(await bubble(page, ".dz-who legend"), "whatever’s left gets through", "who's going at who says how each way's read, in its bubble");
    await go(page, [6, 3, 1, 7, 5, 2]);
    same(await line(page, ".dz-verdict"), "2 stopped, and one gets through.", "Bram's 6 on the 5 and his 3 on the 2");
    same(await outs(page), ["Gets through", "Stopped", "Stopped"], "only the 7 gets through");
    same(await line(page, ".dz-total"), "2 dice stopped one each and a top face, so 3 Aura.", "1 Aura for each one stopped and 1 for the d6's top face");
    has(await line(page, ".dz-note"), "That’s a hit.", "what gets through is a hit");
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="hits"][data-v="2"]`);
    await go(page, [6, 3, 1, 7, 5, 2]);
    has(await line(page, ".dz-note"), "That’s 2 hits, 2 each.", "a deadly threat's 2 hits each");
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="hits"][data-v="1"]`);
    await go(page, [6, 3, 1, 7, 5, 2]);
    await page.click(`${dlg} button[data-dz="swap"][data-j="0"]`);
    await page.click(`${dlg} button[data-dz="swap"][data-j="1"]`);
    same([await outs(page), await line(page, ".dz-verdict"), await line(page, ".dz-total")], [["Gets through", "Gets through", "Stopped"], "1 stopped, and 2 get through.", "One die stopped one and a top face, so 2 Aura."], "a swap puts the 6 on the 7");
    await page.click(`${dlg} .dz-flip`);
    same([await line(page, ".dz-verdict"), await outs(page, ".cc-stage .res-out"), await line(page, ".dz-total")], ["None of them beat it.", ["Under", "Under", "Under"], "A top face, so 1 Aura."], "the same dice read as Bram going at them, with their 7 standing");
    await page.click(`${dlg} button[data-act="close"]`);
    same(await saved(page) === vesk, true, "Vesk's saved sheet left just as it was");
    // Kept on the phone, with the way it was last read.
    await page.reload();
    await page.click(way);
    same([await tray(page, "you"), await tray(page, "them"), await page.getAttribute(`${dlg} button[data-dz="def"][data-v="them"]`, "aria-pressed")], [[6, 6, 2], [8, 8, 8], "true"], "the set-up kept through a reload");
    // Nothing of theirs: the numbers, added up for a Move.
    await page.click(`${dlg} button[data-dz="clear"][data-side="them"]`);
    same(await page.$(`${dlg} .dz-who`), null, "with nothing of theirs, nobody's going at anybody");
    await go(page, [6, 3, 1]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-total")], ["Added up, 10.", "A top face, so 1 Aura."], "dice on one side added up, and the d6's top face still pays");
    has(await bubble(page, ".dz-result"), "only if it’s a Move", "a bubble says adding up's only for a Move");
    // One die tied: it's theirs, unless Vesk pays for it, and it pays nothing.
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="clear"][data-side="you"]`);
    await add(page, "you", [8]);
    await add(page, "them", [6]);
    await go(page, [4, 4]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-note"), await outs(page, ".cc-stage .res-out"), await count(page, ".dz-total")], ["", "It’s theirs, unless you pay 1 Aura.", ["Tie"], 0], "one die tied, said once under it, and no Aura");
    // Ash's burst: her one die against five men, each on his own, then as one thing.
    await page.click(`${dlg} button[data-dz="back"]`);
    await add(page, "them", [6, 6, 6, 6]);
    has(await bubble(page, ".dz-q"), "everyone in your area", "one target or several says what each means, in its bubble");
    await page.click(`${dlg} button[data-dz="each"][data-v="1"]`);
    await go(page, [5, 2, 4, 6, 1, 5]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-note"), await outs(page), await line(page, ".dz-total")], ["Your 5 beats 3 of the 5.", "One’s a tie, and it’s theirs unless you pay 1 Aura.", ["Beat it", "Beat it", "Under", "Beat it", "Tie"], "One die won, so 1 Aura."], "Ash's 5 against five men on their own, paying once");
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="each"][data-v="0"]`);
    await go(page, [5, 2, 4, 6, 1, 5]);
    same([await outs(page, ".cc-stage .res-out"), await line(page, ".dz-stands")], [["Under"], "Their 6 stands against every one of yours."], "as one thing, its best 6 stands");
    // Real dice, tapped in.
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="clear"][data-side="them"]`);
    await add(page, "them", [10]);
    await page.click(`${dlg} button[data-dz="real"]`);
    same(await page.$eval(`${dlg} button[data-dz="pad-done"]`, (el) => el.disabled), true, "real dice wait for every number");
    await page.click(`${dlg} .cc-pad.is-you button[data-v="8"]`);
    await page.click(`${dlg} .cc-pad.is-them button[data-v="7"]`);
    await page.click(`${dlg} button[data-dz="pad-done"]`);
    same([await outs(page, ".cc-stage .res-out"), await line(page, ".dz-total")], [["Beat it"], "One die won and a top face, so 2 Aura."], "an 8 on a real d8 beats their 7");
    await page.keyboard.press("Escape");
    await page.waitForFunction((sel) => !document.querySelector(sel).open, dlg, { timeout: 2000 }).catch(() => note("Esc didn't put the roller away"));
    // Off the Characters list, with no character, and with no signal.
    await page.goto(`${BASE}/characters/`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
    await context.setOffline(true);
    await page.reload();
    await page.click('button[data-dz="open"][data-from="list"]');
    await page.waitForSelector(`${dlg} .dz`);
    const about = await bubble(page, ".dlg-head");
    has(about, "Any dice you like", "off the list its bubble's just dice");
    same(about.includes("sheet"), false, "with nothing about a sheet");
    await go(page, [2, 9]);
    same(await outs(page, ".cc-stage .res-out"), ["Under"], "a roll with no signal");
    await context.setOffline(false);
    await context.close();
  }
  // Several actions in one throw (Mo's 14 Nov ask): his d12 and d8 at the
  // brute's d10, his d6 at the archer's d4, and a d8 coming at him that his
  // Stamina's d12 rolls against.
  {
    const { context, page } = await phone();
    await page.goto(`${BASE}/characters/`);
    await page.click('button[data-dz="open"][data-from="list"]');
    await page.waitForSelector(`${dlg} .dz`);
    same([await count(page, ".dz-act-head"), await count(page, ".dz-sum")], [0, 0], "one action to start, with no number on it");
    same(await page.$eval(`${dlg} button[data-dz="more"]`, (el) => el.disabled).catch(() => "missing"), true, "another action waits for dice on this one");
    await add(page, "you", [12, 8]);
    await add(page, "them", [10]);
    await page.click(`${dlg} button[data-dz="def"][data-v="them"]`);
    await page.click(`${dlg} button[data-dz="more"]`);
    same(await sums(page), ["Target 1 d12 + d8 against d10 You’re going at them"], "the brute's action folded into a line");
    same([await line(page, ".dz-act.is-open .dz-act-head h3"), await page.evaluate(() => document.activeElement?.textContent ?? "")], ["Target 2", "Target 2"], "the new one open, with the phone on it");
    same([await tray(page, "you"), await tray(page, "them")], [[], []], "with nothing on it yet");
    // Back to the brute's and Add another action again: the one with nothing
    // on it opens, rather than another piling up.
    await page.click(`${dlg} button[data-dz="pick"][data-a="0"]`);
    await page.click(`${dlg} button[data-dz="more"]`);
    same([await count(page, ".dz-act"), await line(page, ".dz-act.is-open .dz-act-head h3")], [2, "Target 2"], "adding again opens the empty one");
    await add(page, "you", [6]);
    await add(page, "them", [4]);
    same(await page.getAttribute(`${dlg} button[data-dz="def"][data-v="them"]`, "aria-pressed"), "true", "and once it's got dice on both sides, it's going at them");
    await page.click(`${dlg} button[data-dz="more"]`);
    await add(page, "you", [12]);
    await add(page, "them", [8]);
    await page.click(`${dlg} button[data-dz="def"][data-v="you"]`);
    same(await sums(page), ["Target 1 d12 + d8 against d10 You’re going at them", "Target 2 d6 against d4 You’re going at them"], "the archer's folded in too");
    has(await line(page, ".dlg-head"), "3 targets", "the head says how many");
    // All thrown together, each action's dice yours first and then theirs.
    await go(page, [9, 3, 6, 6, 3, 5, 5]);
    has(await line(page, ".dlg-head"), "each read on its own", "the head says how they're read");
    const mo = [["1 of 2 beat it.", ["Beat it", "Under"], ""], ["", ["Beat it"], ""], ["It’s stopped.", ["Stopped"], ""]];
    same(await blocks(page), mo, "the 9 beats the brute and the 3 doesn't, the 6 beats the archer, and the 5 stops the 5");
    same(await line(page, ".dz-total"), "3 dice won and a top face, so 4 Aura.", "the Aura added up across them");
    // Read the last one the other way: his 5 only ties their 5, and that's theirs.
    await page.click(`${dlg} .dz-flip[data-a="2"]`);
    same([(await blocks(page))[2], await line(page, ".dz-total")], [["", ["Tie"], "It’s theirs, unless you pay 1 Aura."], "2 dice won and a top face, so 3 Aura."], "read the other way, it's a tie that pays nothing");
    await page.click(`${dlg} .dz-flip[data-a="2"]`);
    same((await blocks(page))[2], mo[2], "and back again");
    // Real dice, tapped in for all three.
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="real"]`);
    same(await page.$$eval(`${dlg} .dz-pads h3`, (els) => els.map((e) => e.textContent)), ["Target 1", "Target 2", "Target 3"], "real dice, an action at a time");
    const pads = [[0, "m", 0, 9], [0, "m", 1, 3], [0, "t", 0, 6], [1, "m", 0, 6], [1, "t", 0, 3], [2, "m", 0, 5], [2, "t", 0, 5]];
    const pad = ([a, k, i, v]) => page.click(`${dlg} button[data-dz="pad"][data-a="${a}"][data-k="${k}"][data-i="${i}"][data-v="${v}"]`);
    for (const p of pads.slice(0, -1)) await pad(p);
    same(await page.$eval(`${dlg} button[data-dz="pad-done"]`, (el) => el.disabled), true, "waiting on the last die");
    await pad(pads.at(-1));
    await page.click(`${dlg} button[data-dz="pad-done"]`);
    same([await blocks(page), await line(page, ".dz-total")], [mo, "3 dice won and a top face, so 4 Aura."], "the same on real dice");
    // Kept through a reload, with the first one open.
    await page.reload();
    await page.click('button[data-dz="open"][data-from="list"]');
    await page.waitForSelector(`${dlg} .dz`);
    same([await sums(page), await tray(page, "you"), await tray(page, "them")], [["Target 2 d6 against d4 You’re going at them", "Target 3 d12 against d8 They’re coming at you"], [12, 8], [10]], "all three kept through a reload, the first open");
    // Taken off again, down to one, which is the roller as it was.
    await page.click(`${dlg} button[data-dz="drop"][data-a="1"]`);
    same(await sums(page), ["Target 2 d12 against d8 They’re coming at you"], "the archer's taken off, and the last one's Target 2 now");
    await page.click(`${dlg} button[data-dz="drop"][data-a="1"]`);
    same([await count(page, ".dz-act-head"), await count(page, ".dz-sum"), await line(page, ".dlg-head .cc-small")], [0, 0, "d12 + d8 against d10"], "one action left, and it's the roller as it was");
    await context.close();
  }
  // At 320 wide in both themes: nothing sideways, 44px buttons, and axe, with
  // one action and with two.
  for (const theme of ["dark", "light"]) {
    const { context, page } = await phone({ viewport: { width: 320, height: 640 } });
    if (theme === "light") await page.addInitScript(() => localStorage.setItem("zi-theme", "light"));
    // A set-up kept before there were actions.
    await page.addInitScript(() => localStorage.setItem("zi-dice", JSON.stringify({ you: [6, 6, 2], them: [8, 8, 8, 10, 6], def: "you" })));
    const axe = async (what) => {
      const result = await new AxeBuilder({ page }).include(dlg).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
    };
    const fits = async (what) => {
      const wide = await page.$eval(`${dlg} .dlg-body`, (el) => el.scrollWidth > el.clientWidth);
      if (wide) note(`the roller scrolls sideways at 320, ${what}, ${theme}`);
      const small = await page.$$eval(`${dlg} button`, (els) => els.filter((el) => el.checkVisibility() && (el.getBoundingClientRect().width < 44 || el.getBoundingClientRect().height < 44)).map((el) => el.textContent.trim() || el.getAttribute("aria-label")));
      if (small.length) note(`buttons under 44px on ${what} at 320, ${theme}: ${small.join(", ")}`);
    };
    await page.goto(`${BASE}/characters/`);
    await page.click('button[data-dz="open"]');
    await page.waitForSelector(`${dlg} .dz`);
    same([await count(page, ".dz-sum"), await count(page, ".dz-act-head"), await tray(page, "you"), await tray(page, "them")], [0, 0, [6, 6, 2], [8, 8, 8, 10, 6]], `a set-up kept before there were actions comes back as one, ${theme}`);
    await fits("the set-up");
    await axe(`the roller's set-up, ${theme}`);
    await go(page, [6, 3, 1, 7, 5, 2, 9, 6]);
    same(await line(page, ".dz-verdict"), "2 stopped, and 3 get through.", `five against three, ${theme}`);
    await fits("a result");
    await axe(`the roller's result, ${theme}`);
    await shot(page, `roller-${theme}`);
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="more"]`);
    await add(page, "you", [6]);
    await add(page, "them", [4]);
    await fits("two actions");
    await axe(`two actions, ${theme}`);
    await shot(page, `roller-two-${theme}`);
    await go(page, [6, 3, 1, 7, 5, 2, 9, 6, 4, 3]);
    same([(await blocks(page)).map((b) => b[0]), await line(page, ".dz-total")], [["2 stopped, and 3 get through.", ""], "3 dice won and a top face, so 4 Aura."], `two actions thrown, ${theme}`);
    await fits("two actions' result");
    await axe(`two actions' result, ${theme}`);
    await shot(page, `roller-two-result-${theme}`);
    await context.close();
  }
  // With motion on, the dice tumble, and a tap lands them.
  {
    const { context, page } = await phone({ reducedMotion: "no-preference" });
    await page.addInitScript(() => localStorage.setItem("zi-dice", JSON.stringify({ you: [6, 4], them: [8], def: "them" })));
    await page.goto(`${BASE}/characters/`);
    await page.click('button[data-dz="open"]');
    await page.evaluate(() => window.ziCompanion.setDice([6, 2, 5]));
    await page.click(`${dlg} button[data-dz="go"]`);
    same(await page.$$eval(`${dlg} [data-spin]`, (els) => els.length), 3, "the dice tumbling");
    await page.click(`${dlg} .cc-res`);
    await page.waitForSelector(`${dlg} .dz-verdict`, { timeout: 2000 }).catch(() => note("a tap didn't land the dice"));
    same([await line(page, ".dz-verdict"), await page.$$eval(`${dlg} .cc-stage .res .zd-die`, (els) => els.map((e) => e.textContent))], ["1 of 2 beat it.", ["6", "2"]], "landed on their numbers");
    // Two actions' worth tumble together, and a tap lands the lot.
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="more"]`);
    await add(page, "you", [6]);
    await add(page, "them", [4]);
    await page.evaluate(() => window.ziCompanion.setDice([6, 2, 5, 4, 3]));
    await page.click(`${dlg} button[data-dz="go"]`);
    same(await page.$$eval(`${dlg} [data-spin]`, (els) => els.length), 5, "both actions' dice tumbling");
    await page.click(`${dlg} .dz-out [data-dz="skip"]`).catch(() => note("nothing to tap to land two actions' dice"));
    await page.waitForSelector(`${dlg} .dz-total`, { timeout: 2000 }).catch(() => note("a tap didn't land both actions' dice"));
    same(await line(page, ".dz-total"), "2 dice won and a top face, so 3 Aura.", "landed, with the Aura added up");
    await context.close();
  }
  console.log("dice roller: Bram's defence with a swap and read the other way, the Aura from wins and top faces, the sheet left alone, a question bubble, the set-up kept, one side added up, a tie, an area each on their own and as one, real dice, offline off the list, several actions thrown together and read on their own, read the other way, on real dice, kept and taken off, 320 wide in both themes with one and two, and the tumble");
}

// 8. Downtime on the new core. Isolde's week with no browser: everything
// back first, a point in her Aspiration, a new permission, a Scar grown into
// a Trait over three slots, and a new Title from her Aspiration's fifth point.
// Then Vesk's two weeks on the phone: everything back, a new permission with
// its Root, undone and done again, a point in her Aspiration and a new
// awakening with its Root and its Catch, all surviving a reload. Then (8b,
// the play screen's) a made-up rule change against her saved sheet with its
// gold marks.
if (part("8")) {
  {
    const { makeDowntime } = await import("../src/companion/downtime.js");
    const D = makeDowntime({ B: BUILD, esc: (x) => String(x ?? ""), steps: (n) => `${n} steps`, link: () => "", icon: { close: "" }, throwDie: (n) => n, crewNames: () => new Set(), isOpen: () => false, rule: () => "" });
    const c = rootsSheet(book.crew.find((x) => x.id === "isolde"), [], BUILD);
    const s = RS.normalCore({}, c);
    Object.assign(s, { pts: { Body: 0, Mind: 2, Soul: 3 }, wound: { Body: false, Mind: true, Soul: false }, toll: 2, aspPts: 2, scars: { Body: [], Mind: ["can't read in the dark any more"], Soul: [] } });
    const ch = { id: "isolde-week" };
    const d = D.start(ch);
    const tap = (data, dd = d, cc = c) => D.act({ dataset: data }, dd, cc, s);
    const type = (where, f, value, dd = d) => D.input({ dataset: { dt: String(where), f }, value }, dd);
    const card = (dd = d, cc = c, id = ch) => D.view(cc, s, id, dd).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
    // Her Mind holds 8, a point less for its Scar.
    has(card(), "Every downtime starts with everything back, free: Mind 2 to 8, Soul 3 to 6, Frayed gone and 2 Toll gone", "everything back, said on the card");
    same(/6 sizes back|Roll yours again|steps,/.test(card()), false, "no slot to recover in, and no roll at the Aspiration");
    tap({ do: "pick", s: "0", v: "asp" });
    has(card(), "It’s got 2 of 5, and this slot makes it 3.", "a point in her Aspiration, no roll");
    tap({ do: "pick", s: "1", v: "perm" });
    tap({ do: "set", s: "1", f: "t", v: "0" });
    type(1, "text", "read how a spirit’s been bound");
    tap({ do: "set", s: "1", f: "root", v: "Mind" });
    same(D.warnings(d, c, s), [], "nothing to flag on her week");
    const said = D.apply(s, c, d);
    same([s.pts, s.wound, s.toll, s.aspPts, s.grown.at(-1)], [{ Body: 0, Mind: 9, Soul: 6 }, { Body: false, Mind: false, Soul: false }, 0, 3, { k: "perm", t: 0, text: "read how a spirit’s been bound", root: "Mind" }], "everything back, her new point on her Mind, and her Aspiration on 3");
    has(said.join(". "), "Your Aspiration’s got 3 of 5", "her Aspiration's points, said");
    // Her Scar grows: two slots this week, and the third the next, with its Trait.
    const cNow = rootsSheet(book.crew.find((x) => x.id === "isolde"), s.grown, BUILD);
    const d2 = D.start({ id: "isolde-scar" });
    tap({ do: "pick", s: "0", v: "scar" }, d2, cNow);
    tap({ do: "pick", s: "1", v: "scar" }, d2, cNow);
    has(card(d2, cNow, { id: "isolde-scar" }), "This slot makes it 2 of 3.", "a second slot on the same Scar, counting the first");
    same(D.warnings(d2, cNow, s), [], "two slots on her Scar, nothing to flag");
    D.apply(s, cNow, d2);
    same(s.scarGrow, { "Mind|0": { n: 2 } }, "her Scar on 2 of its 3 slots");
    const d3 = D.start({ id: "isolde-trait" });
    tap({ do: "pick", s: "0", v: "scar" }, d3, cNow);
    has(card(d3, cNow, { id: "isolde-trait" }), "This slot’s its third, so it grows into a Trait.", "the third slot growing it");
    same(D.warnings(d3, cNow, s).some((x) => /needs the Trait/.test(x)), true, "the Trait to write before it grows");
    type(0, "trait", "Reads the dead's writing by touch", d3);
    tap({ do: "pick", s: "1", v: "party" }, d3, cNow);
    same(D.warnings(d3, cNow, s), [], "her Scar's Trait written");
    D.apply(s, cNow, d3);
    same([s.scarGrow, s.scars.Mind], [{ "Mind|0": { n: 3, trait: "Reads the dead's writing by touch" } }, ["can't read in the dark any more"]], "her Scar grown into a Trait, and still a Scar");
    same(card(D.start({ id: "isolde-after" }), cNow, { id: "isolde-after" }).includes("Grow a Scar"), false, "nothing to grow once every Scar's a Trait");
    // A new Title from her Aspiration's fifth point spreads 5, a tap at a time.
    Object.assign(s, { aspPts: 4 });
    const d4 = D.start({ id: "isolde-title" });
    tap({ do: "pick", s: "0", v: "asp" }, d4, cNow);
    has(card(d4, cNow, { id: "isolde-title" }), "This slot’s its fifth point, so it comes good.", "her Aspiration's fifth point");
    tap({ do: "set", s: "0", f: "take", v: "title" }, d4, cNow);
    type(0, "text", "Keeper of the last library", d4);
    tap({ do: "tall", s: "0", v: "Mind" }, d4, cNow);
    tap({ do: "tnudge", s: "0", v: "Soul", n: "1" }, d4, cNow);
    tap({ do: "tnudge", s: "0", v: "Soul", n: "1" }, d4, cNow);
    type(0, "perm", "find any book in a library", d4);
    tap({ do: "set", s: "0", f: "proot", v: "Mind" }, d4, cNow);
    tap({ do: "pick", s: "1", v: "party" }, d4, cNow);
    same(D.warnings(d4, cNow, s), [], "nothing to flag on her new Title");
    D.apply(s, cNow, d4);
    same([s.grown.at(-1), s.aspPts], [{ k: "title", text: "Keeper of the last library", roots: { Body: 0, Mind: 3, Soul: 2 }, perm: { text: "find any book in a library", root: "Mind" } }, 0], "her new Title spread Mind 3 and Soul 2, with its permission, and her Aspiration starting again with nothing");
    const grownSheet = rootsSheet(book.crew.find((x) => x.id === "isolde"), s.grown, BUILD);
    same([grownSheet.roots, s.pts], [{ Body: 0, Mind: 14, Soul: 9 }, { Body: 0, Mind: 13, Soul: 8 }], "her Roots with the new Title, and every Root full on it, less her Scar");
  }
  // Bram's week on the fixes: his plate's soak and his Resources back as it
  // starts, his broken shield mended, his helmet raised a tier, and no Boons
  // to swap either way. Then Vesk getting a crowbar, and a buckler that's
  // her seventh item, so her knife goes.
  {
    const { makeDowntime } = await import("../src/companion/downtime.js");
    const D = makeDowntime({ B: BUILD, esc: (x) => String(x ?? ""), steps: (n) => `${n} steps`, link: () => "", icon: { close: "" }, throwDie: (n) => n, crewNames: () => new Set(), isOpen: () => false, rule: () => "" });
    const bram = book.crew.find((x) => x.id === "bram");
    const c = rootsSheet(bram, [], BUILD);
    const s = RS.normalCore({}, c);
    Object.assign(s, { soak: { "item|plate armour": 2 }, res: ["rope", "a flask"], crossed: { "item|a shield": true } });
    const ch = { id: "bram-week" };
    const d = D.start(ch);
    const tap = (data, dd = d, cc = c, ss = s) => D.act({ dataset: data }, dd, cc, ss);
    const type = (where, f, value, dd = d) => D.input({ dataset: { dt: String(where), f }, value }, dd);
    const card = (dd = d, cc = c, ss = s, id = ch) => D.view(cc, ss, id, dd).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
    has(card(), "everything back, free: your armour’s soak and 2 Resources", "his soak and his Resources back, said on the card");
    same(/Boon/.test(D.view(c, s, ch, d)), false, "no Boons on the downtime card");
    tap({ do: "pick", s: "0", v: "mend" });
    has(card(), "Trusty shield", "his broken shield the one thing to mend");
    tap({ do: "pick", s: "1", v: "tier" });
    has(card(), "Proven plate armour tier 3", "his plate already at tier 3, so it can't go up");
    tap({ do: "set", s: "1", f: "key", v: "item|a helmet" });
    has(card(), "It goes up to tier 3, Proven.", "his helmet going up to tier 3");
    same(D.warnings(d, c, s), [], "nothing to flag on Bram's week");
    const said = D.apply(s, c, d);
    same([s.soak, s.res, s.crossed, s.grown.at(-1)], [{}, [], {}, { k: "tier", key: "item|a helmet", to: 3 }], "his soak and Resources back, his shield mended and his helmet up a tier");
    has(said.join(". "), "A Trusty shield is mended, and back at tier 2", "his shield mended, said");
    same(rootsSheet(bram, s.grown, BUILD).items.find((it) => it.key === "item|a helmet")?.tier, 3, "his helmet Proven on his sheet");
    // Vesk: a crowbar's her sixth item, and a buckler would be a seventh.
    const vesk = book.crew.find((x) => x.id === "vesk");
    const cv = rootsSheet(vesk, [], BUILD);
    const sv = RS.normalCore({}, cv);
    const dv = D.start({ id: "vesk-get" });
    tap({ do: "pick", s: "0", v: "get" }, dv, cv, sv);
    type(0, "text", "a crowbar", dv);
    tap({ do: "pick", s: "1", v: "get" }, dv, cv, sv);
    type(1, "text", "a buckler", dv);
    tap({ do: "set", s: "1", f: "kind", v: "guard" }, dv, cv, sv);
    has(card(dv, cv, sv, { id: "vesk-get" }), "You carry six items at most, so one goes.", "a seventh item, so one goes");
    same(D.warnings(dv, cv, sv), ["Your second slot is a seventh item, so pick the one that goes."], "the seventh waiting on what goes");
    tap({ do: "set", s: "1", f: "drop", v: "item|a knife" }, dv, cv, sv);
    same(D.warnings(dv, cv, sv), [], "her knife going for the buckler");
    D.apply(sv, cv, dv);
    same(rootsSheet(vesk, sv.grown, BUILD).items.map((it) => [it.name, it.kind, it.tier]), [["worn leathers", "armour", 2], ["soft-soled boots", "tool", 3], ["a set of picks", "tool", 3], ["her grappling line", "tool", 2], ["a crowbar", "tool", 2], ["a buckler", "guard", 2]], "her crowbar and her buckler at tier 2, and her knife gone");
    // Something else the story gives you goes in your notes.
    const dn = D.start({ id: "vesk-purse" });
    tap({ do: "pick", s: "0", v: "get" }, dn, cv, sv);
    tap({ do: "set", s: "0", f: "what", v: "other" }, dn, cv, sv);
    type(0, "text", "the iron for her line’s next stage", dn);
    tap({ do: "pick", s: "1", v: "party" }, dn, cv, sv);
    D.apply(sv, cv, dn);
    has(sv.notes, "Got in downtime: the iron for her line’s next stage.", "a material in her notes");
  }

  const { context, page } = await phone();
  const t = tableOf(page);
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  // Vesk part way through her week: her Body down to 4 and her Mind to 3,
  // so everything back is every Root full.
  const vesk = await crewOn(page, "vesk");
  await setState(page, vesk.id, { pts: { Body: 4, Mind: 3, Soul: 0 } });
  await page.reload();
  await playing(page);
  const me = async () => (await savedAll(page)).find((c) => c.id === vesk.id);
  const tracksOf = async () => {
    const s = (await me()).state.pts;
    return [s.Body, s.Mind, s.Soul];
  };
  const base = rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD);
  const week = async () => {
    await page.click('button[data-act="downtime"]');
    has(await t.body(), "Every downtime starts with everything back, free: Body 4 to 10 and Mind 3 to 5", "everything back, free");
    // There's no slot to recover in, and her Shadows have more abilities to
    // buy, ten on the list.
    same(await page.$$eval('#cc-dialog button[data-do="pick"][data-v="heal"]', (els) => els.length), 0, "no Recover slot");
    same(await page.$$eval('#cc-dialog button[data-do="pick"][data-s="0"][data-v="ability"]', (els) => els.length), 1, "an ability to buy off the Shadow's ten");
    await dt('[data-do="pick"][data-s="0"][data-v="pressure"]');
    await dt('[data-do="pick"][data-s="1"][data-v="perm"]');
    await dt('[data-do="set"][data-s="1"][data-f="t"][data-v="0"]');
    await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "slip through any crowd");
    await dt('[data-do="set"][data-s="1"][data-f="root"][data-v="Body"]');
    same(await page.$$eval('#cc-dialog [data-f="spec"], #cc-dialog datalist', (els) => els.length), 0, "no specialty to write");
  };
  await week();
  await shot(page, "8-downtime");
  await t.finish();
  same(await tracksOf(), [11, 5, 0], "every Root full, her Body with her new permission in it");
  same(sheetFor(await me()).roots, { ...base.roots, Body: base.roots.Body + 1 }, "her new permission 1 more on her Body");
  same(sheetFor(await me()).titles[0].permissions.map((p) => [p.text, p.root]).at(-1), ["slip through any crowd", "Body"], "on her first Title");
  await page.click('button[data-act="undo"]');
  same([await tracksOf(), sheetFor(await me()).roots], [[4, 3, 0], base.roots], "Undo takes the week back");
  await week();
  await t.finish();
  same(sheetFor(await me()).roots.Body, base.roots.Body + 1, "her week again");
  // A second week: a point in her Aspiration, and a new awakening on her
  // grappling line with the Root it locks, a Catch with it since it's
  // Awakened.
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  has(await t.body(), "It’s got 0 of 5, and this slot makes it 1.", "a point in her Aspiration");
  await dt('[data-do="pick"][data-s="1"][data-v="awk"]');
  if (await page.$('#cc-dialog button[data-act="dt"][data-do="set"][data-s="1"][data-f="a"][data-v="0"]')) await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="0"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="name"]', "Haul someone up after me");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "1 Aura and a friend climbs with her, no roll");
  await dt('[data-do="set"][data-s="1"][data-f="root"][data-v="Body"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="catch"]', "Loud");
  await t.finish();
  await page.reload();
  await playing(page);
  const after = await me();
  same([after.state.aspPts, sheetFor(after).attuned[0].awakenings.map((w) => [w.name, w.root]), sheetFor(after).attuned[0].catch], [1, [["Anywhere I can throw a hook", "Body"], ["Haul someone up after me", "Body"]], "Loud"], "her Aspiration's point and her new awakening on her Body with its Catch, after a reload");
  console.log("downtime: Isolde's weeks on the new core (a point in her Aspiration, a Scar grown into a Trait and a Title from her fifth point), and Vesk's two weeks: everything back, a permission with its Root, a point in her Aspiration, an undo and a reload");

  await context.close();
}

// 8b. A made-up rule change against Vesk's saved sheet, on the play screen:
// a reworded permission, her Stride and a permission moved get gold marks
// with old and new, typo fixes stay quiet, and Got it clears them for good.
if (part("8b")) {
  const { context, page } = await phone();
  const vesk = await crewOn(page, "vesk");
  const saved = await page.evaluate(() => localStorage.getItem("zi-characters"));
  const id = vesk.id;
  const second = await phone({ serviceWorkers: "block" });
  const p2 = second.page;
  await second.context.route((url) => url.pathname === "/characters/", async (route) => {
    const res = await route.fetch();
    const html = await res.text();
    const out = html.replace(/(<script[^>]*id="zi-companion"[^>]*>)([\s\S]*?)(<\/script>)/, (m, open, json, close) => {
      const data = JSON.parse(json);
      const v = data.crew.find((c) => c.id === "vesk");
      const perm = (text) => v.titles.flatMap((x) => x.permissions).find((p) => p.text === text);
      perm("run the rooftops").text = "run and leap the rooftops";
      perm("know how a lock’s built").text = "know how a locks built";
      perm("pick a mechanical lock").root = "Mind";
      v.titles[1].text = "Raised by the guild";
      v.numbers.stride = 4;
      v.hash = "madeup01";
      return `${open}${JSON.stringify(data).replace(/</g, "\\u003c")}${close}`;
    });
    return route.fulfill({ response: res, body: out });
  });
  await p2.goto(`${BASE}/characters/`);
  await p2.evaluate((json) => localStorage.setItem("zi-characters", json), saved);
  await p2.goto(`${BASE}/characters/?c=${encodeURIComponent(id)}`);
  await p2.waitForSelector(".tile[data-r]");
  const seen = await p2.evaluate((cid) => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === cid).state.seen, id);
  same([seen["title:1"], seen["perm:1:0"], seen["perm:0:1"]], ["Raised by the guild (Mind 3, Body 2)", "know how a locks built (Mind)", "run the rooftops (Body)"], "the typo fixes taken in quietly, and the real change kept for its mark");
  has(await p2.textContent(".cc-note.is-gold"), "lines on Vesk’s sheet have changed", "the note for a rule change");
  same(await p2.$$eval(".cc-roots .tile.is-changed", (els) => els.map((e) => e.dataset.r)), ["Body", "Mind"], "gold corners on her Body and her Mind, with the lock moved");
  await p2.click('.cc-gold[data-k="num:stride"]');
  has(await p2.textContent(".cc-head .cc-was"), "Was Stride 3", "Stride's old number");
  has(await p2.textContent(".cc-head .cc-was"), "Now Stride 4", "Stride's new number");
  await p2.click('.cc-tabs a[data-t="sheet"]');
  await p2.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
  const golds = await p2.$$eval(".cc-gold", (els) => els.map((el) => el.dataset.k));
  for (const k of ["perm:0:1", "perm:0:2", "root:Body", "root:Mind"]) same(golds.includes(k), true, `a gold mark on ${k}`);
  for (const k of ["perm:1:0", "title:1"]) same(golds.includes(k), false, `no gold mark on ${k}, a typo fix`);
  same(golds.some((k) => /:g\d/.test(k)), false, "nothing she grew in downtime marked");
  await p2.click('.cc-gold[data-k="perm:0:1"]');
  has(await p2.textContent('li:has(> .cc-gold[data-k="perm:0:1"]) .cc-was, li:has(.cc-gold[data-k="perm:0:1"]) .cc-was'), "Was run the rooftops (Body)", "the permission as it was");
  await p2.click('.cc-note.is-gold button[data-act="seen"]');
  same(await p2.$$eval(".cc-gold", (els) => els.length), 0, "Got it clears the marks");
  await p2.reload();
  await p2.waitForSelector(".cc-page");
  same(await p2.$$eval(".cc-gold", (els) => els.length), 0, "and they stay cleared");
  console.log("rule changes: a made-up rule change against Vesk with its gold marks");
  await second.context.close();
  await context.close();
}

// 9. Every crew member grows on the new core: a downtime's worth of each kind
// of growth on top of their sheet adds up, a seventh permission never gets on,
// and an Aspiration past d12 brings a Title with its 5 spread and its one
// permission, an archetype with its one ability, or an attuned thing with
// its one awakening. A slot buys an ability, never one another of the same
// archetype has.
if (part("9")) {
  // Two permissions swapped for a Boon in a downtime before the fixes: Boons
  // are gone, so the permissions stay, Aura's 5, and it's flagged. Folded
  // into Change it's just the permissions.
  {
    const vesk = structuredClone(book.crew.find((c) => c.id === "vesk"));
    vesk.titles[0].permissions.push({ text: "slip a grip", root: "Body" }, { text: "hang off a ledge", root: "Body" });
    const grown = [{ k: "boon", t: 0, lever: "Aura", name: "Second Wind", drop: [0], g: 0 }];
    const swapped = rootsSheet(vesk, grown, BUILD);
    same([swapped.titles[0].permissions.length, "boons" in swapped.titles[0], swapped.titles[0].boonsGone?.map((b) => b.name), swapped.numbers.aura, RS.choicesOf(swapped).map((x) => x.k)], [5, false, ["Second Wind"], 5, ["boon"]], "a Boon swapped in before the fixes gone, her permissions kept and Aura 5, flagged");
    same(foldGrown(fromCrew(vesk, BUILD, { keep: true }), grown, BUILD).titles[0].perms.length, 5, "and folded into Change, her five permissions");
  }
  for (const base of book.crew) {
    const c0 = rootsSheet(base, [], BUILD);
    const root = RS.mostOf(c0.titles[0].roots);
    const grown = [
      { k: "perm", t: 0, text: "a new permission", root },
      { k: "thread", person: "Someone new", text: "They owe me.", kind: "hostile" },
      { k: "title", text: "A Title from an Aspiration", roots: { Body: 0, Mind: 2, Soul: 3 }, perm: { text: "its permission", root: "Soul" } },
      { k: "arch", arch: "Healer", have: ["Push"] },
      { k: "attune", name: "A new thing", awk: { name: "Its awakening", root: "Mind", text: "2 steps on every roll you make with it" } },
      { k: "awk", a: 0, name: "Another awakening", root: "Mind", text: "1 Aura and it does something", catch: "Loud" },
    ];
    const c = rootsSheet(base, grown, BUILD);
    const roots = { ...c0.roots };
    roots[root] += 1;
    roots.Mind += 2;
    roots.Soul += 4;
    same(c.roots, roots, `${base.name}'s Roots with a permission and a new Title spread Mind 2 and Soul 3`);
    same("specialties" in c, false, `${base.name} with no specialties`);
    same([c.titles.length, c.archetypes.length, c.archetypes.at(-1).have, c.attuned.length, c.attuned[0].awakenings.length, c.numbers.aura, c.attuned.at(-1).awakenings.map((w) => w.root)], [c0.titles.length + 1, c0.archetypes.length + 1, ["Push"], c0.attuned.length + 1, c0.attuned[0].awakenings.length + 1, c0.numbers.aura, ["Mind"]], `${base.name}'s Titles, archetypes with the one ability, a new attuned thing with no Aura of its own, and awakenings on their Roots`);
    same(RS.lockedOf(c).Mind, RS.lockedOf(c0).Mind + 2, `${base.name}'s two new awakenings each locking a point of their Mind`);
    same(c.threads.find((p) => p.person === "Someone new")?.threads[0]?.kind, "hostile", `${base.name}'s new hostile thread`);
    // A seventh permission never gets on a Title.
    const full = Array.from({ length: 6 }, (_, i) => ({ k: "perm", t: 0, text: `permission ${i}`, root }));
    same(rootsSheet(base, full, BUILD).titles[0].permissions.length, 6, `${base.name}'s first Title stops at six permissions`);
    // What downtime grew comes into Change as it was on the sheet.
    const folded = rootsSheet(sheetOf({ id: `9-${base.id}`, name: base.name, build: foldGrown(fromCrew(base, BUILD, { keep: true }), grown, BUILD) }, BUILD), [], BUILD);
    same(sheetParts({ ...folded, points: null }), sheetParts({ ...c, points: null }), `${base.name}'s growth folded into a build, the sheet they had`);
  }
  // A Title grown on stacking was spread 3, and it's made 5 the same way.
  {
    const c = rootsSheet(book.crew.find((x) => x.id === "wren"), [{ k: "title", text: "Grown on stacking", roots: { Body: 0, Mind: 1, Soul: 2 }, perm: null }], BUILD);
    same([c.titles.at(-1).roots, c.titles.at(-1).fromThree, RS.choicesOf(c).map((x) => x.k)], [{ Body: 0, Mind: 2, Soul: 3 }, { Body: 0, Mind: 1, Soul: 2 }, ["five"]], "a Title grown on stacking made 5, for the player to check");
    const folded = foldGrown(fromCrew(book.crew.find((x) => x.id === "wren"), BUILD, { keep: true }), [{ k: "title", text: "Grown on stacking", roots: { Body: 0, Mind: 1, Soul: 2 }, perm: null }], BUILD);
    same([folded.titles.at(-1).roots, folded.titles.at(-1).three], [{ Body: 0, Mind: 2, Soul: 3 }, { Body: 0, Mind: 1, Soul: 2 }], "and the same in Change, saying what it was");
  }

  const { context, page } = await phone();
  const t = tableOf(page);
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  // On the phone: Vesk's Aspiration's fifth point gives her a new Title, its
  // 5 spread Soul 3 and Mind 2 in three taps, with its permission on her Mind.
  const vesk = await crewOn(page, "vesk");
  await setState(page, vesk.id, { asp: 10, aspPts: 4 });
  await page.reload();
  await playing(page);
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  has(await t.body(), "This slot’s its fifth point, so it comes good.", "her Aspiration coming good");
  await dt('[data-do="set"][data-s="0"][data-f="take"][data-v="title"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "Captain of the crew");
  await dt('[data-do="tall"][data-s="0"][data-v="Soul"]');
  await dt('[data-do="tnudge"][data-s="0"][data-v="Mind"][data-n="1"]');
  await dt('[data-do="tnudge"][data-s="0"][data-v="Mind"][data-n="1"]');
  has(await t.body(), "Its 5 Root points: Mind 2, Soul 3", "her new Title's spread");
  await page.fill('#cc-dialog input[data-dt="0"][data-f="perm"]', "know who’s lying in my crew");
  await dt('[data-do="set"][data-s="0"][data-f="proot"][data-v="Mind"]');
  // Her second slot's Get something: a crowbar, her sixth item.
  await dt('[data-do="pick"][data-s="1"][data-v="get"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "a crowbar");
  await t.finish();
  const v = (await savedAll(page)).find((c) => c.id === vesk.id);
  const sheet = sheetFor(v);
  same([sheet.roots, sheet.titles.at(-1).text, sheet.titles.at(-1).roots, sheet.titles.at(-1).permissions.map((p) => [p.text, p.root]), v.state.aspPts], [{ Body: 11, Mind: 8, Soul: 3 }, "Captain of the crew", { Body: 0, Mind: 2, Soul: 3 }, [["know who’s lying in my crew", "Mind"]], 0], "her third Title, its spread and its permission, and her Aspiration starting again with nothing");
  same(sheet.items.map((it) => [it.name, it.kind, it.tier]).at(-1), ["a crowbar", "tool", 2], "her crowbar, a Trusty tool");

  // Gil, a Guardian and a Leader with Push on each: a slot buys Stand firm,
  // and the second slot can't take the one the first's taking.
  const gil = fromCrew(book.crew.find((c) => c.id === "bram"), BUILD);
  gil.have = [["Push"], ["Push"]];
  gil.name = "Gil";
  await page.evaluate((build) => {
    const list = JSON.parse(localStorage.getItem("zi-characters"));
    list.characters.push({ id: "own-gil", crew: "own", name: "Gil", hash: "own", build, state: {} });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  }, gil);
  await page.goto(`${BASE}/characters/?c=own-gil`);
  await playing(page);
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="ability"]');
  await dt('[data-do="set"][data-s="0"][data-f="a"][data-v="0"]');
  await dt('[data-do="set"][data-s="0"][data-f="name"][data-v="Stand firm"]');
  await dt('[data-do="pick"][data-s="1"][data-v="ability"]');
  await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="0"]');
  same(await page.$$eval('#cc-dialog button[data-act="dt"][data-do="set"][data-s="1"][data-f="name"]', (els) => els.map((el) => el.dataset.v).includes("Stand firm")), false, "the second slot can't take Stand firm again");
  await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="1"]');
  await dt('[data-do="set"][data-s="1"][data-f="name"][data-v="Everyone gets it"]');
  await t.finish();
  const g = sheetFor((await savedAll(page)).find((c) => c.id === "own-gil"));
  same(g.archetypes.map((a) => a.have), [["Push", "Stand firm"], ["Push", "Everyone gets it"]], "Gil's two new abilities, a slot each");
  console.log(`growing: every crew member's growth adds up, Vesk's Aspiration's fifth point is a Title spread her way, and Gil buys two abilities`);
  await context.close();
}

// 10. The rules on a phone: the Learn deck, chapters a section at a time, places and pop-ups.
if (part("10")) {
  // The deck, read the way the build reads it.
  const learnText = readFileSync("content/learn.md", "utf8");
  const learnMeta = parseYaml(learnText.match(/^---\n([\s\S]*?)\n---/)[1]);
  const { cards, problems: unread } = readCards(learnText);
  for (const p of unread) note(`learn: ${p}`);
  if (cards.length < DECK_SIZE[0] || cards.length > DECK_SIZE[1]) note(`learn: ${cards.length} cards, and the deck's ${DECK_SIZE[0]} to ${DECK_SIZE[1]}`);
  for (const c of cards) if (c.words < CARD_WORDS[0] || c.words > CARD_WORDS[1]) note(`learn: “${c.title}” is ${c.words} words`);
  const chapterDocs = readdirSync("content/rules").filter((f) => f.endsWith(".md")).map((f) => {
    const text = readFileSync(`content/rules/${f}`, "utf8");
    const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
    return { meta: parseYaml(m[1]), body: text.slice(m[0].length) };
  }).sort((a, b) => Number(a.meta.order) - Number(b.meta.order));
  const placeOf = (id) => {
    const i = chapterDocs.findIndex((d) => d.meta.id === id || d.body.includes(`{#${id}}`));
    return i < 0 ? null : [i, chapterDocs[i].meta.id === id ? -1 : chapterDocs[i].body.indexOf(`{#${id}}`)];
  };
  let behind = [-1, -1];
  for (const c of cards) {
    const at = placeOf(c.teaches);
    if (!at) {
      note(`learn: “${c.title}” teaches #${c.teaches}, and no chapter has it`);
      continue;
    }
    if (at[0] < behind[0] || (at[0] === behind[0] && at[1] < behind[1])) note(`learn: “${c.title}” is out of book order`);
    behind = at;
  }
  const withDice = cards.filter((c) => CREW.some((n) => c.example.includes(n)) && /\bd(2|4|6|8|10|12)\b/.test(c.example));
  if (withDice.length < cards.length * 0.6) note(`learn: only ${withDice.length} of ${cards.length} cards have an example with the crew's dice`);
  // Every number of steps an example gives comes out as the dice it says, off
  // the companion's own table. The crew's Roots and specialties are the
  // build's to check (book.roots), since till stage 3 of notes/roots-plan.md
  // the companion's crew is the one from before Roots.
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  let dieChecks = 0;
  for (const c of cards) {
    // Past 12 steps it's "two d12s and a d4", so the d12s are read as a count.
    for (const m of c.example.matchAll(/\b(\d+) steps[,:] ((?:an? d\d+|two d12s|three d12s)(?: and an? d\d+)?)/g)) {
      const said = m[2].replace("three d12s", "3d12").replace("two d12s", "2d12").replace(/\ban? /g, "").replace(" and ", " + ");
      dieChecks += 1;
      same(diceLabel(stepsToDice(Number(m[1]))), said, `learn: “${c.title}” gives ${m[1]} steps as ${m[2]}`);
    }
  }
  if (dieChecks < 10) note(`learn: only ${dieChecks} rolls found in the examples to check against the steps into dice`);
  // A made-up change to Extra actions touches the card that teaches Your Action.
  const reach = (id) => reachOf(chapterDocs, id);
  same(staleCards(cards, { iso: "2099-01-01", title: "made up", links: ["s-extra-actions"] }, "2026-10-26", reach).map((c) => c.id), ["l-action"], "learn: a made-up change to Extra actions names the card that teaches Your Action");
  same(staleCards(cards, { iso: "2026-01-01", title: "old", links: ["s-aura"] }, String(learnMeta.checked), reach).length, 0, "learn: a change from before the deck was checked names nothing");
  const newest = newestChange(readFileSync("content/changes.md", "utf8"));
  const behindDeck = staleCards(cards, newest, String(learnMeta.checked), reach);
  if (behindDeck.length) note(`learn: the ${newest.iso} change touches ${behindDeck.map((c) => c.id).join(", ")}, and the deck says it was checked on ${learnMeta.checked}`);
  same(book.learn?.cards.map((c) => c.id), cards.map((c) => c.id), "learn: the cards in book.json");

  const openings = JSON.parse(readFileSync("dist/openings.json", "utf8")).s;
  const deckAt = (page) => page.evaluate(() => ({
    n: document.querySelector(".lr-n").textContent,
    id: document.querySelector(".lr-card:not([inert])")?.id,
    bar: document.querySelector(".lr-progress").getAttribute("aria-valuenow"),
  }));
  const waitCard = (page, n) => page.waitForFunction((n) => document.querySelector(".lr-n")?.textContent === String(n) && document.querySelectorAll(".lr-card:not([inert])").length === 1, n, { timeout: 5000 }).catch(() => {});
  const still = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  const shut = (page, sel) => page.waitForFunction((sel) => !document.querySelector(`${sel}[open]`), sel, { timeout: 5000 }).catch(() => note(`${sel} didn't close`));
  const text = async (page, sel) => (await page.textContent(sel))?.replace(/\s+/g, " ").trim() ?? "";
  const shown = async (page, sel) => (await page.evaluate((sel) => [...document.querySelectorAll(`${sel} span, ${sel} b`)].map((x) => x.textContent).join(" "), sel)).replace(/\s+/g, " ").trim();
  const reading = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("zi-reading") || "null"));
  const small = (page, sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)]
    .filter((el) => el.getClientRects().length && (!el.checkVisibility || el.checkVisibility()) && !el.closest("[inert]"))
    .map((el) => ({ t: (el.getAttribute("aria-label") || el.textContent).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
    .filter((x) => x.h < 44 || x.w < 44), sel);

  const { context, page } = await phone({ hasTouch: true });
  await page.goto(`${BASE}/learn/`);
  await page.waitForSelector(".lr-card");
  same(await deckAt(page), { n: "1", id: cards[0].id, bar: "1" }, "the deck starts on its first card");
  same(await page.isDisabled(".lr-prev"), true, "Back on the first card");
  await shot(page, "learn-card-dark");
  // Tapped, keyed and swiped through.
  await page.click(".lr-next");
  await waitCard(page, 2);
  same(await deckAt(page), { n: "2", id: cards[1].id, bar: "2" }, "Next goes to the second card");
  await page.keyboard.press("ArrowRight");
  await waitCard(page, 3);
  same((await deckAt(page)).id, cards[2].id, "the right arrow goes on a card");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.synthesizeScrollGesture", { x: 300, y: 420, xDistance: -260, yDistance: 0, gestureSourceType: "default", speed: 1600 }).catch((e) => note(`a swipe couldn't be made: ${e.message}`));
  await waitCard(page, 4);
  same((await deckAt(page)).id, cards[3].id, "a swipe goes on a card");
  same(await page.evaluate(() => getComputedStyle(document.querySelector(".lr-progress i")).transform), `matrix(${4 / cards.length}, 0, 0, 1, 0, 0)`, "the progress bar a tenth of the way along on card 4");
  same(await still(page), 0, "nothing moving in the deck under reduce-motion");
  // It remembers the card: a reload, then the deck from the rules page.
  // The card's in the page before the deck's script has run, so wait for the
  // deck to say where it is before reading it.
  await page.reload();
  await page.waitForSelector(".lr-card");
  await waitCard(page, 4);
  same((await deckAt(page)).id, cards[3].id, "a reload stays on the same card");
  await page.goto(`${BASE}/rules/`);
  await page.click('a[href="/learn/"]');
  await page.waitForSelector(".lr-card");
  await waitCard(page, 4);
  same((await deckAt(page)).n, "4", "back to the deck on the card you were on");
  same((await reading(page))?.learn?.id, cards[3].id, "the card's kept in zi-reading");
  // A bookmark on the card, kept.
  await page.click(".lr-card:not([inert]) .lr-mark");
  same(await page.getAttribute(".lr-card:not([inert]) .lr-mark", "aria-pressed"), "true", "a card bookmarked");
  await page.reload();
  await page.waitForSelector(".lr-card");
  same(await page.getAttribute(".lr-card:not([inert]) .lr-mark", "aria-pressed"), "true", "a card's bookmark after a reload");
  // Read more: the whole section, and straight back to the card.
  const four = book.learn.cards[3];
  await page.click(".lr-card:not([inert]) .lr-more");
  await page.waitForSelector("#lr-read[open]");
  await page.waitForFunction(() => document.querySelector(".lr-read-text p:not(.lr-wait), .lr-read-text li"), null, { timeout: 8000 }).catch(() => note("Read more never got its section"));
  same(await text(page, "#lr-read-t"), four.section.title, "Read more's title is the card's section");
  const sectionWords = (await text(page, ".lr-read-text")).split(" ").length;
  if (sectionWords <= four.words) note(`Read more shows ${sectionWords} words, no more than the card's ${four.words}`);
  await shot(page, "learn-read-more-dark");
  await page.click("#lr-read .zs-foot .zs-close");
  await shut(page, "#lr-read");
  same((await deckAt(page)).n, "4", "Back to the card leaves you on the same card");
  // A link on a card pops up its opening, and that one's Read more stays in the deck.
  await page.goto(`${BASE}/learn/#l-building`);
  await page.waitForSelector(".lr-card");
  same((await deckAt(page)).id, "l-building", "the deck opens on the card in the address");
  await page.click('.lr-card:not([inert]) .lr-body a[href="/rules/the-core/#s-aura"]');
  await page.waitForSelector(".zp[open]");
  same(await text(page, "#zp-t"), "Aura", "a card's link pops up its section");
  has(await text(page, ".zp-text"), "luck and flair", "the pop-up's opening");
  await shot(page, "learn-popup-dark");
  await page.click(".zp-more");
  await page.waitForSelector("#lr-read[open]");
  await shut(page, ".zp");
  same(await text(page, "#lr-read-t"), "Aura", "the pop-up's Read more opens the section in the deck");
  same(new URL(page.url()).pathname, "/learn/", "still in the deck");
  await page.keyboard.press("Escape");
  await shut(page, "#lr-read");
  // The list of every card.
  await page.click(".lr-list");
  await page.waitForSelector("#lr-cards[open]");
  same(await page.getAttribute("#lr-cards a[aria-current]", "data-card"), "l-building", "the list marks the card you're on");
  same(await page.$$eval("#lr-cards a.is-marked", (els) => els.map((a) => a.dataset.card)), [cards[3].id], "the list marks the bookmarked card");
  await page.click('#lr-cards a[data-card="l-aura"]');
  await shut(page, "#lr-cards");
  same((await deckAt(page)).id, "l-aura", "a card picked from the list");
  for (const [sel, why] of [[".lr-out, .lr-icon, .lr-foot .button, .lr-card:not([inert]) .lr-more, .lr-card:not([inert]) .lr-mark", "the deck"]]) {
    const tiny = (await small(page, sel)).filter((x) => x.h < 44 || (x.w < 44 && !/more/i.test(x.t)));
    if (tiny.length) note(`small tap targets in ${why}: ${JSON.stringify(tiny.slice(0, 4))}`);
  }
  await page.goto(`${BASE}/learn/#${cards[cards.length - 1].id}`);
  await page.waitForSelector(".lr-card");
  same(await text(page, ".lr-next"), "Finish", "the last card's Next says Finish");

  // A chapter on a phone opens on its contents: a row for every section, and
  // tapping one opens it on its own, with the bar along the top.
  const chapterOf = (slug) => book.chapters.find((c) => c.slug === slug);
  const conflict = chapterOf("conflict");
  const rowsOf = conflict.hub.rows;
  const at = (id) => rowsOf.findIndex((r) => r.id === id);
  const view = (page) => page.evaluate(() => ({
    open: document.documentElement.classList.contains("rd-open"),
    hub: !!document.querySelector(".hub")?.checkVisibility(),
    on: [...document.querySelectorAll(".rd-track > section")].filter((s) => s.checkVisibility()).map((s) => s.dataset.s),
    title: document.querySelector(".rd-title")?.textContent ?? "",
    count: document.querySelector(".rd-count")?.textContent ?? "",
    hash: location.hash,
  }));
  const opened = (page, id) => page.waitForFunction((id) => document.documentElement.classList.contains("rd-open") && document.querySelector(".rd-track > section.is-on")?.dataset.s === id, id, { timeout: 5000 }).catch(() => note(`the section ${id} never opened`));
  const contents = (page) => page.waitForFunction(() => !document.documentElement.classList.contains("rd-open") && document.querySelector(".hub")?.checkVisibility(), null, { timeout: 5000 }).catch(() => note("the contents never came back"));
  // A finger across the first paragraph that's on the screen.
  const swipe = async (dx) => {
    const y = await page.evaluate(() => {
      const p = [...document.querySelectorAll(".rd-track > section.is-on p")].find((x) => { const r = x.getBoundingClientRect(); return r.top > 90 && r.bottom < innerHeight - 20; });
      const r = p?.getBoundingClientRect();
      return r ? Math.round(r.top + r.height / 2) : 500;
    });
    const x0 = dx < 0 ? 340 : 50;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 8; i += 1) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (dx * i) / 8, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await page.goto(`${BASE}/rules/conflict/`);
  await page.waitForSelector(".hub-row");
  const first = await view(page);
  same([first.open, first.hub, first.on, await page.locator(".hub-row").count()], [false, true, [], rowsOf.length + (conflict.hub.opening ? 1 : 0)], "Conflict opens on its contents, a row for every section");
  has(await text(page, ".hub-meta"), `${rowsOf.length} sections`, "the contents say how many sections");
  await shot(page, "chapter-contents-dark");
  const lands = at("s-defending");
  await page.click('.hub-row[data-s="s-defending"] a');
  await opened(page, "s-defending");
  same(await view(page), { open: true, hub: false, on: ["s-defending"], title: "When It Lands", count: `${lands + 1} of ${rowsOf.length}`, hash: "#s-defending" }, "a row opens its section on its own, with where you are in the bar");
  same(await page.evaluate(() => {
    const pages = [...document.querySelectorAll(".rd-track > section")].filter((s) => s.dataset.skip !== "true");
    return [document.activeElement?.id, [...document.querySelectorAll(".rd-segs i")].findIndex((i) => i.classList.contains("cur")) === pages.findIndex((s) => s.classList.contains("is-on")), document.querySelector(".rd-top").getBoundingClientRect().top];
  }), ["s-defending", true, 0], "the section's heading has focus, and the bar's at the top with its place marked");
  await shot(page, "chapter-section-dark");
  // Next, a swipe each way, and the arrow keys.
  const next = rowsOf[lands + 1];
  same(await text(page, ".rd-next b"), next.title, "Next says what's next");
  await page.click(".rd-next");
  await opened(page, next.id);
  same([(await view(page)).title, (await view(page)).hash], [next.title, `#${next.id}`], "Next goes to the next section");
  await swipe(-240);
  await opened(page, rowsOf[lands + 2].id);
  same((await view(page)).title, rowsOf[lands + 2].title, "a swipe to the left goes on a section");
  await swipe(240);
  await opened(page, next.id);
  same((await view(page)).title, next.title, "a swipe to the right goes back one");
  await page.keyboard.press("ArrowLeft");
  await opened(page, "s-defending");
  await swipe(-30);
  await page.waitForTimeout(300);
  same((await view(page)).title, "When It Lands", "the left arrow goes back one, and a short drag springs back");
  same(await still(page), 0, "nothing moving between sections under reduce-motion");
  same((await reading(page))?.done?.conflict?.includes("s-defending"), true, "a section read past is kept as read");
  // Bookmarks: the section's from the bar, and a subsection's by its heading.
  await page.click(".rd-mark");
  same(await page.getAttribute(".rd-mark", "aria-pressed"), "true", "a section bookmarked from the bar");
  await page.click('.rs-mark[data-mark="s-defend"]');
  same(await page.getAttribute('.rs-mark[data-mark="s-defend"]', "aria-pressed"), "true", "a subsection bookmarked");
  // A pop-up from a link to another chapter, then Back inside one, then Esc.
  const cross = await page.evaluate((keys) => [...document.querySelectorAll(".rd-track > section.is-on a[href^='/rules/']")].map((a) => a.getAttribute("href")).find((h) => !h.startsWith("/rules/conflict/") && keys.includes(h)), Object.keys(openings));
  if (!cross) note("no link to another chapter with an opening in When It Lands");
  else {
    await page.click(`.rd-track > section.is-on a[href="${cross}"]`);
    await page.waitForSelector(".zp[open]");
    same([await text(page, "#zp-t"), await page.getAttribute(".zp-more", "href"), new URL(page.url()).pathname], [openings[cross].t, cross, "/rules/conflict/"], "a link to another chapter pops up, and you stay where you were");
    await shot(page, "chapter-popup-dark");
    const inner = await page.evaluate((keys) => [...document.querySelectorAll(".zp-text a[href^='/rules/']")].map((a) => a.getAttribute("href")).find((h) => keys.includes(h)), Object.keys(openings));
    if (inner) {
      await page.click(`.zp-text a[href="${inner}"]`);
      await page.waitForFunction((t) => document.querySelector("#zp-t").textContent === t, openings[inner].t, { timeout: 5000 }).catch(() => {});
      same([await text(page, "#zp-t"), await page.isVisible(".zp-back")], [openings[inner].t, true], "a link inside a pop-up opens in the same sheet, with Back");
      await page.click(".zp-back");
      same([await text(page, "#zp-t"), await page.isVisible(".zp-back")], [openings[cross].t, false], "Back to the pop-up before");
    }
    await page.keyboard.press("Escape");
    await shut(page, ".zp");
  }
  // One in the same chapter: Read more opens its section, clear of the bar,
  // and Back comes back.
  await page.click('.rd-track > section.is-on a[href="#s-consequences"]');
  await page.waitForSelector(".zp[open]");
  await page.click(".zp-more");
  await shut(page, ".zp");
  await opened(page, "s-consequences");
  const top = await page.evaluate(() => Math.round(document.getElementById("s-consequences").getBoundingClientRect().top));
  same([new URL(page.url()).hash, top > 60 && top < 160], ["#s-consequences", true], "Read more in the same chapter opens that section, clear of the bar");
  await page.goBack();
  await opened(page, "s-defending");
  // Contents goes back to the contents, which show what's read, what's
  // bookmarked and where you're up to, and Back and Forward go between them.
  await page.click(".rd-back");
  await contents(page);
  same([(await view(page)).hash, await page.evaluate(() => document.activeElement?.closest(".hub-row")?.dataset.s)], ["", "s-defending"], "Contents goes back to the contents, on the row you were reading");
  const marked = await page.evaluate(() => ["is-done", "is-marked", "is-here"].map((c) => [...document.querySelectorAll(`.hub-row.${c}`)].map((r) => r.dataset.s)));
  same([["s-defending", "s-consequences"].every((id) => marked[0].includes(id)), marked[1], marked[2]], [true, ["s-defending"], ["s-defending"]], "the contents show what's read, what's bookmarked and where you're up to");
  await shot(page, "chapter-contents-read-dark");
  await page.goForward();
  await opened(page, "s-defending");
  await page.goBack();
  await contents(page);
  same((await view(page)).hash, "", "Forward and Back between a section and the contents");
  // An address with a subsection in it opens its section there. Carry on
  // reading: from the rules page, and on the chapter's contents.
  await page.goto(`${BASE}/rules/conflict/#s-intercept`);
  await opened(page, "s-defending");
  const icept = await page.evaluate(() => Math.round(document.getElementById("s-intercept").getBoundingClientRect().top));
  same([(await view(page)).title, icept > 60 && icept < 160], ["When It Lands", true], "an address with a subsection opens its section there");
  await page.goto(`${BASE}/rules/`);
  await page.waitForSelector(".rd:not([hidden])", { timeout: 5000 }).catch(() => note("the rules page shows nothing to carry on with"));
  has(await shown(page, ".rd-carry"), "Carry on reading Intercept Conflict", "Carry on reading on the rules page");
  has(await shown(page, ".rd-carry"), `Carry on learning ${book.learn.cards[cards.length - 1].title} Card ${cards.length} of ${cards.length}`, "Carry on learning on the rules page");
  same(await page.$$eval(".rd-marks a", (as) => as.map((a) => a.getAttribute("href"))), ["/rules/conflict/#s-defend", "/rules/conflict/#s-defending", `/learn/#${cards[3].id}`], "your bookmarks on the rules page, newest first");
  await shot(page, "rules-reading-dark");
  await page.goto(`${BASE}/rules/conflict/`);
  await page.waitForSelector(".hub-carry:not([hidden])", { timeout: 5000 }).catch(() => note("no Carry on reading on the chapter"));
  has(await text(page, ".hub-carry"), "Carry on reading Intercept", "Carry on reading on the chapter's contents");
  await page.click(".hub-carry");
  await opened(page, "s-defending");
  const tiny = await small(page, ".rd-back, .rd-mark, .rd-foot a, .rd-track > section.is-on .rs-mark, .rd-track > section.is-on .zd-tele button");
  await page.click(".rd-back");
  await contents(page);
  tiny.push(...(await small(page, ".hub-row a, .hub-carry, .pager a")));
  if (tiny.length) note(`small tap targets on a chapter: ${JSON.stringify(tiny.slice(0, 4))}`);
  // The first section's Before goes back to the contents, and the last's Next
  // to the next chapter.
  await page.goto(`${BASE}/rules/conflict/#${rowsOf[0].id}`);
  await opened(page, rowsOf[0].id);
  same(await text(page, ".rd-prev"), conflict.hub.opening ? "Before Opening" : "Back to Contents", "the first section's Before");
  await page.click(".rd-prev");
  if (!conflict.hub.opening) await contents(page);
  await page.goto(`${BASE}/rules/conflict/#${rowsOf.at(-1).id}`);
  await opened(page, rowsOf.at(-1).id);
  same([await text(page, ".rd-next"), await page.getAttribute(".rd-next", "href")], [`Next chapter ${conflict.next.title}`, `/rules/${conflict.next.slug}/`], "the last section's Next is the next chapter");
  // An address that can't be read is the contents, and a chapter whose script
  // never comes is one page you can read.
  await page.goto(`${BASE}/rules/conflict/#%E0%A4%A`);
  await contents(page);
  {
    const { context, page } = await phone();
    await context.route((url) => url.pathname.startsWith("/_astro/") && url.pathname.endsWith(".js"), (route) => route.abort());
    await page.goto(`${BASE}/rules/conflict/#s-defending`);
    await page.waitForLoadState("load");
    same(await page.evaluate(() => [document.documentElement.classList.contains("rd-on"), document.querySelectorAll(".rd-track > section.rs")[3]?.checkVisibility()]), [false, true], "with no script, a chapter's one page with every section");
    await context.close();
  }

  // A section opened by its address, then Contents. The book's places and
  // threats, drawn as the game's pieces (a place's tabs, Roll a d20 on Twenty
  // Places, a tag that says what it does), went with the world part in the
  // 14 Nov cut, and their checks come back with them.
  await page.goto(`${BASE}/rules/conflict/#s-movement`);
  await opened(page, "s-movement");
  await page.click(".rd-back");
  await contents(page);
  same((await view(page)).hash, "", "Contents from a section opened by its address");

  // Offline: the deck, a pop-up from a card, Read more, and a chapter's pop-up.
  await page.goto(`${BASE}/learn/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the deck"));
  await page.evaluate(() => caches.keys().then((ks) => Promise.all(ks.map((k) => caches.open(k).then((c) => c.match("/openings.json")))))).then((r) => r.some(Boolean) || note("openings.json isn't kept for offline"));
  await context.setOffline(true);
  await page.goto(`${BASE}/learn/#l-building`);
  await page.waitForSelector(".lr-card", { timeout: 10000 }).catch(() => note("the deck didn't open offline"));
  await page.click('.lr-card:not([inert]) .lr-body a[href="/rules/the-core/#s-aura"]');
  await page.waitForSelector(".zp[open]", { timeout: 8000 }).catch(() => note("a card's pop-up didn't open offline"));
  has(await text(page, ".zp-text"), "luck and flair", "a card's pop-up offline");
  await page.keyboard.press("Escape");
  await shut(page, ".zp");
  await page.click(".lr-card:not([inert]) .lr-more");
  await page.waitForFunction(() => document.querySelector(".lr-read-text li, .lr-read-text p:not(.lr-wait)"), null, { timeout: 8000 }).catch(() => {});
  has(await text(page, ".lr-read-text"), "Every roll goes the same way", "Read more offline");
  await page.keyboard.press("Escape");
  await shut(page, "#lr-read");
  await page.click(".lr-next");
  await waitCard(page, 6);
  same((await deckAt(page)).n, "6", "Next offline");
  await page.goto(`${BASE}/rules/the-core/`);
  await page.waitForSelector(".hub-row", { timeout: 10000 }).catch(() => note("a chapter didn't open offline"));
  await page.click('.hub-row[data-s="s-permissions"] a');
  await opened(page, "s-permissions");
  await page.click('.rd-track > section.is-on a[href="#how-permissions-stack"]');
  await page.waitForSelector(".zp[open]", { timeout: 8000 }).catch(() => note("a chapter's pop-up didn't open offline"));
  has(await text(page, ".zp-text"), "One Root a roll", "a chapter's pop-up offline");
  await context.setOffline(false);
  await context.close();

  // With motion on, the next section slides in, a sheet slides up, a drag
  // puts it away, and the bar moves.
  {
    const { context, page } = await phone({ reducedMotion: "no-preference" });
    await page.goto(`${BASE}/rules/the-core/#s-permissions`);
    await page.waitForSelector(".rd-track > section.is-on");
    await page.click(".rd-next");
    const sliding = await page.evaluate(() => document.querySelector(".rd-track > section.is-on").getAnimations().length);
    if (!sliding) note("the next section came in without sliding, with motion on");
    await page.waitForTimeout(400);
    await page.click(".rd-prev");
    await page.waitForFunction(() => document.querySelector(".rd-track > section.is-on")?.dataset.s === "s-permissions", null, { timeout: 5000 }).catch(() => note("Before didn't go back to Permissions"));
    await page.waitForTimeout(400);
    await page.click('.rd-track > section.is-on a[href="#how-permissions-stack"]');
    await page.waitForSelector(".zp[open]");
    const moving = await page.evaluate(() => document.querySelector(".zp").getAnimations().length);
    if (!moving) note("a pop-up came up without sliding, with motion on");
    await page.waitForTimeout(450);
    const box = await page.locator(".zp .zs-top").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 340, { steps: 6 });
    await page.mouse.up();
    await shut(page, ".zp");
    await page.goto(`${BASE}/learn/`);
    await page.waitForSelector(".lr-card");
    await page.click(".lr-next");
    const bar = await page.evaluate(() => document.querySelector(".lr-progress i").getAnimations().length);
    if (!bar) note("the progress bar jumped, with motion on");
    for (let i = 0; i < 3; i += 1) await page.click(".lr-next");
    await page.waitForTimeout(900);
    same(await page.evaluate(() => [document.querySelector(".lr-n").textContent, document.querySelector(".lr-card:not([inert])").id]), ["5", cards[4].id], "three quick Nexts while the deck slides land three cards on");
    await context.close();
  }

  // axe on the deck, its sheets, a chapter and the rules page, in both themes,
  // and the screenshots at 390 by 844.
  for (const theme of ["dark", "light"]) {
    const { context, page } = await phone({ colorScheme: theme });
    if (theme === "light") await context.addInitScript(() => localStorage.setItem("zi-theme", "light"));
    const axe = async (what, include) => {
      const builder = new AxeBuilder({ page });
      const result = await (include ? builder.include(include) : builder).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`${what}, ${theme}: axe ${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
    };
    await page.goto(`${BASE}/learn/#l-intents`);
    await page.waitForSelector(".lr-card");
    await axe("the deck");
    await shot(page, `learn-card-${theme}`);
    await page.click(".lr-card:not([inert]) .lr-more");
    await page.waitForFunction(() => document.querySelector(".lr-read-text li, .lr-read-text p:not(.lr-wait)"), null, { timeout: 8000 }).catch(() => {});
    await axe("Read more", "#lr-read");
    await shot(page, `learn-read-more-${theme}`);
    await page.keyboard.press("Escape");
    await shut(page, "#lr-read");
    await page.click(".lr-list");
    await page.waitForSelector("#lr-cards[open]");
    await axe("the list of cards", "#lr-cards");
    await page.keyboard.press("Escape");
    await shut(page, "#lr-cards");
    await page.goto(`${BASE}/rules/conflict/#s-answering`);
    await page.waitForSelector(".rd-track > section.is-on");
    await axe("a chapter's section");
    await shot(page, `chapter-section-${theme}`);
    await page.click('section[data-s="s-answering"] a[href="#s-intercept"]');
    await page.waitForSelector(".zp[open]");
    await axe("a pop-up", ".zp");
    await shot(page, `chapter-popup-${theme}`);
    await page.keyboard.press("Escape");
    await shut(page, ".zp");
    await page.click(".rd-back");
    await page.waitForSelector(".hub-row");
    await axe("a chapter's contents");
    await shot(page, `chapter-contents-${theme}`);
    await page.goto(`${BASE}/rules/title-ideas-and-the-crew/#s-pregens`);
    await page.waitForSelector(".rd-track > section.is-on .box-sheet");
    await axe("the crew's sheets");
    await context.close();
  }
  console.log(`reading: ${cards.length} cards checked against the chapters and the steps into dice (${dieChecks} rolls), the deck swiped, remembered and read offline, a chapter's contents and its sections a page at a time (swiped, keyed, Back and Forward), bookmarks, what's read and where you're up to, pop-ups and Carry on reading`);
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
