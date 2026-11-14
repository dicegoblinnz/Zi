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
// 1e. The crew and the character on stacking (notes/stacking-plan.md), with
//    no browser: every crew member's Roots, Titles spread the plan's way, the
//    abilities each archetype has, 35 points at Mo's prices and Aura's 7, the
//    plan's two rolls for each of them, a case and going beyond paid in Aura,
//    every thing on a sheet with a key of its own that lasts a reload, extra
//    actions at 3, 4 and 5 Aura and back to 3 next round with the free ones on
//    top, Aura's maximum as Vesk powers her hook (and what the same awakening
//    twice, a second attuned thing and the Aura Boon do to it), saves from
//    before coming across (Vesk keeping her play with her hook's Aura powering
//    it, Old Vesk from before Roots, and Tamsin, built on the phone, recounted
//    with her spreads and her last point flagged, and with a Scholar, which
//    the book hasn't got any more, flagged first, for her to swap), nothing
//    left on a sheet from specialties or the old cap, and the build stopping
//    on a crew sheet that doesn't add up.
// 1f. Print, with no browser: the blank sheet holds exactly the fields
//    src/companion/sheet-fields.js lists, and every crew member printed reads
//    back field by field (each Root and where its points came from, adding up
//    to it, each Title's words, spread and permissions with their Roots, the
//    archetypes, the attuned thing, Aura's 7 and 35 points), the same from the
//    GM's look with no book to hand. Vesk part way through a scene (her hook
//    powered, a Scar, Burning, a strained thread, her smoke bomb used and her
//    Shadow's pool), Bram with a Boon taking two lines, and Rook, made up with
//    more of everything than the paper holds. Nothing print writes is missing
//    from the sheet, every field bar the ones only a pencil fills gets
//    something from one of them, and what doesn't fit goes in Notes.
// 2. Every crew member's Roots on the phone match their sheet in the
//    chapter: each Root's tile with its steps and the dice it rolls on its
//    own, no specialty tiles, three tracks on d12, full Aura and a plate for
//    every box of armour on their Body, saved on stacking.
// 3. Vesk at the table, on stacking: her lock in four taps (her Body, pick a
//    mechanical lock bringing its Title, know how a lock's built bringing the
//    Guild, and her picks), 13 steps and free, a second tap explaining Shadow
//    for 1 Aura and a third taking it out, her Mind with the same things,
//    finding run the rooftops, and her Soul on its own still a d2. Over the
//    wall with her grappling line's awakening, a win on a top face takes her
//    Aura past 7 while she's acting and finishing drops it back, and Again
//    puts the same things in. A reload and no signal keep it, with the rules
//    a ? away. A tie won for 1 Aura pays nothing back, Undo takes it off, a
//    split's three dice, two guards at once with a die at each and an extra
//    action at 3 Aura, then 4 till she's finished acting, bringing something
//    in is 1 Aura and a step, her Shadow's Push is +3, paid with 1 Stamina or
//    2 for 1, and getting into hiding fills her shadow pool for a later roll.
// 3c. Bram Defends the way the book's example does, the brute's club at him
//    on the wall: his Body, both Titles, hold the line, fight in a shield
//    wall, Guardian, his plate and his shield, 14 steps, through till his
//    Guardian's Push makes the 7 a 9. Then blows on his tracks alone tick his
//    plate's boxes and his shield's till they break, 2 for 1 pays one off his
//    Confidence and his Resolve, his Defend loses what's broken, and downtime
//    mends his plate.
// 3d. Built characters at the table: Bram from the crew saved as his own
//    plays the chapter's numbers and barks an order, a random character plays
//    its Roots, a Toughness Boon takes the first hit When it lands, and a
//    Gambler flips their die for free and every one of his for Double or
//    nothing.
// 4. The tracks: Vesk's Stamina to d2, Vanish paid 2 for 1 since paying never
//    goes below the smallest size, a Blaze and its Scar written as a Catch,
//    locking d2, the rest at the end of a scene with fixed dice, her grappling
//    line powered off her Aura and her maximum, used, and let go by a new
//    scene, and 2 for 1 on a hit. Dorrie's Confidence against a lie, with her
//    court clothes on her Mind, and Isolde's Resolve Blazing at d2 and her
//    choosing to die.
// 4b. Saved before Roots: Old Vesk moves onto it with her Scar on Stamina,
//    her conditions, her strained thread and her notes, puts an old permission
//    back on free on its Root and lets the rest go. Tamsin, built on the phone
//    before Roots, shows as she was, set actions and all, with nothing to play
//    till she's rebuilt (5c). Saved on Roots, before stacking: Vesk's changed
//    lines each get a gold mark, with old and new in the note, her held Aura
//    powers her grappling line off her maximum, and Mara's Title on one Root
//    is hers to spread or keep.
// 5. Building your own on stacking: Vesk again on 35 points, a step to a
//    screen, with what's spent and what's left in the bar the whole way. Two
//    Shadows with an ability each, her Titles' 3 Root points spread in a tap
//    or two, a Root on each permission, her Roots added up with where each
//    comes from, what she carries a point each, her grappling line with its
//    one awakening and nothing to write for its Aura, and threads from the
//    crew questions. Saved, her sheet is the chapter's. Then a reload,
//    offline, a change (a Boon, a fourth permission and a Masterwork shield)
//    past 35, a blank character with the nudges and a start of 36, a draft
//    waiting on the list, and every step at 320 wide in both themes with axe.
// 5b. The builder in one hand: full screen with the crest at the top, the
//    seven steps in one line, the points and Back and Next in the bar at the
//    bottom on every step, the step's tip and the menus away on Escape or a
//    tap outside, a Root's die growing in the dock as a Title's spread and a
//    permission go on, an ability, a Title idea and a Boon in the points,
//    and axe on every step, dark and light.
// 5c. The other ways in. Every crew member made into a build spends 35 and
//    has the sheet the chapter gives them, and a thousand random characters
//    spend exactly 35 and pass every check. A build from before stacking
//    keeps everything, past 35 too: each Title all on its old Root to spread,
//    its specialties gone and its archetypes' abilities dealt between them.
//    Bram from the crew and a random one saved, a way in asking before it
//    bins a draft, Vesk from the crew becoming your own with her play kept,
//    Vesk saved before stacking spreading her Titles and saved on 35 with her
//    Roots the chapter's, and Tamsin from before Roots rebuilt.
// 6. Print on the phone, from the Sheet tab's button (saved characters put on
//    the phone as they'd be part way through a scene, since the play screen's
//    being redrawn): Vesk with a Scar, Burning, Aura spent and her hook
//    powered, a strained thread and her smoke bomb used, read back field by
//    field off the stacking sheet, then Bram's plate with a box ticked and
//    Dorrie's court clothes on her Confidence, over two lines.
// 7. Dice, feel and learning. The learning round on the crew's new sheets
//    (stacking, 14 Nov): Wren's Body and the six things of hers that fit her
//    arrow, and the five of Bram's that fit getting his hammer under the
//    club, 17 steps, with what isn't the lesson behind question bubbles. Three
//    ways: the club beaten with Aura past her 7, a tie won for 1 Aura that
//    pays nothing back, and real dice that lose, so the club takes a size off
//    Isolde's Stamina with her armour on her Mind. Then offline, and 320 wide
//    in both themes with axe. With motion on, the dice tumble and land on their
//    numbers, the roll card turns over, the tabs slide and Aura pops back in.
//    Sound and buzz stay off until the switch turns them on, and then a
//    landing, a top face, a hit and a hit that leaves her Stamina on d2 each
//    get one.
// 7b. A character in one hand: full screen with the crest at the top, the
//    first Root high up, the Roots as the dice they roll, no sideways scroll,
//    44px tap targets and every name fitting its tile, her lock built under
//    two screens, her 12 front and centre with its top face lit, When it lands
//    with Defend, and the Sheet tab under two screens with its folds shut and
//    where each Root came from, with axe on all of it in both themes. A hit
//    with reduce-motion on swaps the track's shape, and nothing moves.
// 7c. The dice roller, off Vesk's play screen and the Characters list. Bram
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
// 8. Downtime on stacking. Vesk's week: every track up a size, Recover and a
//    new permission with its Root, undone and done again, then her
//    Aspiration rolled with her Mind and what fits on her sheet, with fixed
//    dice, a new awakening with its Catch, and a reload. 8b (the play
//    screen's): a made-up rule change against her saved sheet: a reworded
//    permission, her Stride and a permission moved get gold marks with old
//    and new, typo fixes stay quiet, what she grew isn't marked, and Got it
//    clears them for good.
// 9. Every crew member's growth adds up on stacking (a permission with its
//    Root, a thread, a Title with its 3 spread and its one permission, an
//    archetype with its one ability, an attuned thing with its awakening and
//    an awakening), a Title stops at six permissions, a Boon takes two
//    permissions' slots and one that won't fit takes nothing off, and what
//    downtime grew folds into a build as the same sheet. On the phone, Vesk's
//    Aspiration past d12 gives her a third Title spread Soul 2 and Mind 1,
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
import { diceLabel, diceRange, diceShapes, stepsToDice } from "../src/companion/dice.js";
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
// phone apply: one action a round, intercepts, combos, and the scene's
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
  // One action: Vesk answers the spear, so working the satchel needs another.
  ok({ o: "answer", id: "tele-spear-1", ch: "vesk", a: { act: "Sneak", steps: 3, dice: [{ size: 6, total: 5 }], opp: 4, t: 990 } }, kai, "Vesk answers the spear", { phoneNow: 1000 });
  const work = (id, total, opp, aim = "Locked", t = 995) => ({ id, k: "work", ref: "stake-satchel", act: "Locks", steps: 5, t, roll: { dice: [{ size: 10, total }], opp }, aim });
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: [], list: [work("act-vesk-01", 8, 4)] } }, kai, "her answer's her action, so she can't work the satchel too", { phoneNow: 1000 });
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [work("act-vesk-01", 8, 4)] } }, kai, "with an extra action for 3 Aura, she can", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [1, 0], "her Locks, 8 against its 4, takes Locked");
  same(r1().held["stake-satchel"], 4, "and the satchel's 4 stands for the round");
  ok({ o: "acts", round: "round-one-01", ch: "bram", x: { more: [], list: [{ id: "act-bram-01", k: "work", ref: "stake-satchel", act: "Lift and carry", steps: 3, t: 996, roll: { dice: [{ size: 6, total: 4 }], opp: 2 }, aim: "Guarded" }] } }, sam, "Bram goes at it too", { phoneNow: 1000 });
  same(r1().acts["sam|bram"].list[0].roll.won, false, "his 4 ties the 4 that stands, and a tie's a loss");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [] } }, kai, "Vesk takes her roll back", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [0, 0], "and Locked's back in the way");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [work("act-vesk-02", 9, 4, "Guarded")] } }, kai, "she rolls it again, going for Guarded", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [0, 1], "and Guarded's gone");
  // A combo: Isolde puts her action into whoever answers the archer.
  ok({ o: "add", tele: { id: "tele-arrow-1", who: "The archer", does: "Shoot Bram", d: 10, kind: "blow", at: { user: "sam", ch: "bram" } } }, gm, "the archer, mid-round");
  ok({ o: "acts", round: "round-one-01", ch: "isolde", x: { more: [], list: [{ id: "act-isol-01", k: "join", ref: "tele-arrow-1", act: "Ward", steps: 3, t: 997 }] } }, lee, "Isolde puts her Ward into whoever answers the archer", { phoneNow: 1000 });
  not({ o: "answer", id: "tele-arrow-1", ch: "isolde", a: { act: "Ward", steps: 3, dice: [{ size: 6, total: 5 }], opp: 3 } }, lee, "so she can't answer it as well");
  not({ o: "answer", id: "tele-arrow-1", ch: "bram", a: { act: "Fight", steps: 7, dice: [{ size: 12, total: 11 }], opp: 9, with: [{ user: "lee", ch: "isolde" }] } }, sam, "Bram's spent his action on the satchel");
  ok({ o: "acts", round: "round-one-01", ch: "bram", x: { more: [], list: [] } }, sam, "he takes it back", { phoneNow: 1000 });
  ok({ o: "answer", id: "tele-arrow-1", ch: "bram", a: { act: "Fight", steps: 7, dice: [{ size: 12, total: 11 }], opp: 9, with: [{ user: "lee", ch: "isolde" }] } }, sam, "and answers the archer with Isolde's steps in");
  same(r1().tele.find((t) => t.id === "tele-arrow-1").ans.with.map((w) => w.name), ["Isolde"], "Isolde's in his answer");
  not({ o: "acts", round: "round-one-01", ch: "isolde", x: { more: [], list: [] } }, lee, "and once it's rolled, she can't take hers back", { phoneNow: 1000 });
  same(T.spentBy(r1(), "sam", "bram"), { used: 1, have: 1 }, "Bram's one action is his answer");
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-03", k: "else", act: "Defend", t: 998 }] } }, kai, "three actions on one extra is too many", { phoneNow: 1000 });
  // The round ends: what nobody worked steps down, and the club lands on Bram.
  now = 2000;
  ok({ o: "end", round: "round-one-01" }, gm, "round 1 ends");
  same([doc.scene.stakes[0].clock, doc.scene.events[0].d], [6, 2], "the satchel was worked, so its clock stays on d6, and the buyer's down to d2");
  same(r1().moved, [{ ref: "event-buyer", from: 4, to: 2, out: "" }], "and the round says what moved");
  same(T.landsOn(r1().tele[0]).user, "sam", "the club was aimed at Isolde, but it lands on Bram, who took it");
  not({ o: "defend", id: "tele-club-01", ch: "isolde", r: { on: "Defend", stopped: false, mine: null, v: 6 } }, lee, "so Isolde doesn't roll When it lands for it");
  ok({ o: "defend", id: "tele-club-01", ch: "bram", r: { on: "Defend", stopped: true, mine: 7, v: 6 } }, sam, "Bram does");
  // Isolde's roll at the buyer, done in the round with no signal, turns up late: it never stepped down.
  ok({ o: "acts", round: "round-one-01", ch: "isolde", x: { more: ["held"], list: [{ id: "act-isol-01", k: "join", ref: "tele-arrow-1", act: "Ward", steps: 3, t: 997 }, { id: "act-isol-02", k: "work", ref: "event-buyer", act: "Talk", steps: 2, t: 1500, roll: { dice: [{ size: 4, total: 1 }], opp: 3 }, aim: "slow" }] } }, lee, "Isolde's roll at the buyer, done in the round, turns up late", { phoneNow: 2001 });
  same([doc.scene.events[0].d, r1().moved.length], [4, 0], "so the buyer never stepped down");
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["aura"], paid: [3], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-09", k: "else", act: "Move", t: 2500 }] } }, kai, "one done after the round ended doesn't count", { phoneNow: 2600 });
  // On Roots (8 Nov): a telegraph's at a Root, only what's at a Body can be
  // intercepted, and When it lands says the track or Defend that rolled. On
  // stacking (14 Nov), extra actions have no cap: each one bought with Aura
  // costs 3, then 4, then 5 in a round, and holding and hiding are on top.
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
    same(doc2.rounds[0].tele.map((t) => [t.root, t.kind]), [["Body", "blow"], ["Mind", "fear"], ["Soul", "fear"]], "each telegraph's Root");
    not2({ o: "icp", id: "tele-lie-r01", ch: "bram", free: true }, sam, "nobody intercepts the lie at her Mind");
    not2({ o: "icp", id: "tele-curse-1", ch: "bram", free: true }, sam, "or the curse at her Soul");
    ok2({ o: "icp", id: "tele-club-r1", ch: "bram", free: true }, sam, "Bram takes the club at her Body");
    const buy = (id, more, paid, list) => ({ o: "acts", round: "round-root01", ch: id === "bram" ? "bram" : "vesk", x: { more, ...(paid ? { paid } : {}), list: list.map((j) => ({ id: `act-${id}-r${j}`, k: "else", act: "Move", t: 4900 + j })) } });
    const actsOf = (ch) => doc2.rounds[0].acts[ch === "bram" ? "sam|bram" : "kai|vesk"];
    ok2(buy("vesk", ["aura"], [3], [1, 2]), kai, "Vesk buys an extra action for 3 Aura", { phoneNow: 5000 });
    ok2(buy("vesk", ["aura", "aura"], [3, 4], [1, 2, 3]), kai, "and a second for 4, since there's no cap", { phoneNow: 5000 });
    ok2(buy("vesk", ["aura", "aura", "aura"], [3, 4, 5], [1, 2, 3, 4]), kai, "and a third for 5", { phoneNow: 5000 });
    same(T.moresOf(actsOf("vesk")).map((m) => m.paid), [3, 4, 5], "each one's price kept with it");
    same(not2(buy("vesk", ["aura", "aura", "aura", "aura"], [3, 4, 5, 5], [1, 2, 3, 4, 5]), kai, "a fourth priced 5 is turned down", { phoneNow: 5000 }), "The fourth extra action you buy this round is 6 Aura, not 5.", "since it's 6");
    same(not2(buy("vesk", ["aura", "aura"], [3, 3], [1, 2, 3]), kai, "two for 3 each is turned down too", { phoneNow: 5000 }), "The second extra action you buy this round is 4 Aura, not 3.", "since the second's 4");
    same(not2({ ...buy("vesk", ["aura", "aura", "aura", "aura"], null, [1, 2, 3, 4, 5]), x: { ...buy("vesk", ["aura", "aura", "aura", "aura"], null, [1, 2, 3, 4, 5]).x, paid: [3, 4, 5] } }, kai, "a new one with no price is turned down", { phoneNow: 5000 }), "Your phone’s from before extra actions had a price. Reload the page and buy it again.", "since only one from before prices were kept goes unchecked");
    same(T.moresOf(actsOf("vesk")).length, 3, "and the table keeps the three she paid for");
    ok2(buy("bram", ["aura"], [3], [1, 2]), sam, "Bram's first is 3 while Vesk's bought three, since each player's extra actions are their own", { phoneNow: 5000 });
    same(T.moresOf(actsOf("vesk")).map((m) => m.paid), [3, 4, 5], "and hers stay as they were");
    ok2(buy("vesk", ["aura", "aura", "hiding"], [3, 4], [1, 2, 3, 4]), kai, "coming out of hiding's on top, and doesn't put the price up", { phoneNow: 5000 });
    ok2(buy("bram", ["aura"], [4], [1, 2]), sam, "Bram's first is 4, after one bought on his roll card", { phoneNow: 5000 });
    ok2(buy("bram", ["aura", "held"], [4], [1, 2, 3]), sam, "and holding his action last round gives him one more", { phoneNow: 5000 });
    ok2(buy("bram", ["aura", "held"], null, [1, 2, 3]), sam, "an older phone that sends no price is taken as it was", { phoneNow: 5000 });
    same(T.moresOf(actsOf("bram")), [{ k: "aura", paid: 3 }, { k: "held" }], "and reads as the 3 an older phone took");
    not2(buy("bram", ["aura", "held"], [4], [1, 2, 3, 4]), sam, "but more actions than he's got is still turned down", { phoneNow: 5000 });
    ok2(buy("bram", [], null, []), sam, "Bram takes his back");
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
    not2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Stamina", stopped: true, mine: 7, v: 4 } }, lee, "her Stamina can't roll against the lie at her Mind");
    ok2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Confidence", stopped: true, mine: 7, v: 4 } }, lee, "her Confidence stops it");
    ok2({ o: "defend", id: "tele-curse-1", ch: "isolde", r: { on: "Defend", stopped: false, mine: 3, v: 9, paid: "Resolve down to d10" } }, lee, "her Defend doesn't stop the curse");
    ok2({ o: "defend", id: "tele-club-r1", ch: "bram", r: { on: "Stamina", stopped: true, mine: 8, v: 5 } }, sam, "and Bram's Stamina stops the club he took");
    same(doc2.rounds[0].tele.map((t) => t.def?.on), ["Stamina", "Confidence", "Defend"], "each one saying the track or Defend that rolled against it");
    const view = T.screenOf(doc2, { name: "Tuesday Lair", crew: [] });
    same(view?.round?.tele?.map((t) => [t.root, t.def?.on]), [["Body", "Stamina"], ["Mind", "Confidence"], ["Soul", "Defend"]], "the table screen showing each telegraph's Root and what rolled against it");
    const crewView = T.screenOf(doc2, { name: "Tuesday Lair", crew: [{ key: "kai|vesk", name: "Vesk", crew: "vesk" }] });
    same(crewView.crew[0].more, ["3 Aura", "4 Aura", "hiding"], "and Vesk's extra actions with what each one cost");
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
    ok3({ o: "acts", round: "round-stack1", ch: "vesk", x: { more: ["aura"], paid: [3], list: [{ id: "act-vesk-s1", k: "work", ref: "stake-chest1", root: "Body", act: "Body and Locks", steps: 13, t: 5995, roll: { dice: [{ size: 12, total: 9 }, { size: 2, total: 1 }], opp: 4 }, aim: "Locked" }] } }, kai, "Vesk works the strongbox on her Body, 13 steps", { phoneNow: 6000 });
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
    same([newView.round.tele[0].ans.act, newView.crew[2].acts[0].act, newView.crew[0].acts[0].act, newView.crew[1].acts[0].act, newView.crew[0].more], ["17 steps on Body", "17 steps on Body", "13 steps on Body", "5 steps", ["3 Aura"]], "where a new one names its Root and steps, and what an extra action cost");
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
  ok2({ o: "acts", round: "round-a-0001", ch: "bram", x: { more: ["aura"], paid: [3], list: [at("act-watch-b1", "event-watch1", "Talk", 6, 7, "slow"), at("act-door-b2", "stake-door01", "Lift and carry", 5, 2, "Barred")] } }, sam, "Bram, with an extra action for 3 Aura, takes Barred, the last thing in its way");
  same(doc2.scene.stakes[0].out, "won", "so the door's won");
  ok2({ o: "acts", round: "round-a-0001", ch: "isolde", x: { more: [], list: [] } }, lee, "Isolde takes hers back");
  same([doc2.scene.stakes[0].tags.map((g) => g.gone), doc2.scene.stakes[0].out], [[0, 1], ""], "Locked's back in the way, so it isn't won any more");
  same(r().acts["sam|bram"].list[1].did?.won, undefined, "and Bram's roll doesn't say it won it");
  ok2({ o: "acts", round: "round-a-0001", ch: "vesk", x: { more: ["held", "held", "hiding"], list: [at("act-watch-v1", "event-watch1", "Sneak", 8, 7, "drive")] } }, kai, "Vesk says she held last round twice");
  same(r().acts["kai|vesk"].more, ["held", "hiding"], "and it counts once");
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
  same(readLanes([]), { lanes: [], wins: 0, stops: 0, tops: 0, aura: 0 }, "nothing thrown pays nothing");
  // What's kept on the phone: the actions, each with its dice and its way.
  same(setupOf(null), { acts: [{ you: [], them: [], def: "you", each: false }] }, "nothing kept starts as one action with no dice on, them coming at you");
  same(setupOf({ you: [6, 7, "8", 20, 2], them: Array(20).fill(4), def: "them", each: "yes" }), { acts: [{ you: [6, 8, 2], them: Array(MOST).fill(4), def: "them", each: false }] }, "a set-up kept before there were actions comes back as one, with only real dice, up to the most a side holds");
  same(setupOf({ def: "sideways" }).acts[0].def, "you", "a way that isn't one comes back as them coming at you");
  same(setupOf({ acts: [{ you: [12, 8], them: [10], def: "them" }, { you: [6], them: [4], def: "them", each: true }, { you: [12], them: [8] }] }).acts, [{ you: [12, 8], them: [10], def: "them", each: false }, { you: [6], them: [4], def: "them", each: true }, { you: [12], them: [8], def: "you", each: false }], "Mo's three actions kept, each with its own way");
  same(setupOf({ acts: [{ you: [], them: [], def: "them" }, null, "d6", [6], { you: [6], them: [4], def: "them" }] }).acts, [{ you: [6], them: [4], def: "them", each: false }], "an action with no dice is dropped beside one with some, and so is anything that isn't an action");
  same(setupOf({ acts: [{ def: "them" }] }).acts, [{ you: [], them: [], def: "them", each: false }], "a lone action with no dice keeps its way");
  same(setupOf({ acts: Array(20).fill({ you: [6], them: [4] }) }).acts.length, ACTIONS, "up to the most actions a throw holds");
  same(setupOf({ acts: [] }), setupOf(null), "no actions kept starts as one");
  console.log("the dice roller's rules checked");
}

// 1e. The crew and the character on stacking (Mo's 14 Nov rework, the crew on
// 35 points in notes/stacking-plan.md, with his yes). Each number here is the
// plan's, written down from its words rather than worked out by the code:
// their Roots, their 35 points, Aura's 7, and the two rolls the plan counts
// for each of them. Then the price of extra actions (3, then 4, then 5, back
// to 3 next round), Aura's maximum as an awakening's powered, and saves from
// before the rework coming across. None of it needs a browser.
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
  // The plan's crew: Roots, points and Aura.
  const PLAN = {
    vesk: { Body: 8, Mind: 4, Soul: 0 },
    bram: { Body: 7, Mind: 2, Soul: 3 },
    dorrie: { Body: 2, Mind: 6, Soul: 4 },
    isolde: { Body: 0, Mind: 7, Soul: 5 },
    wren: { Body: 6, Mind: 6, Soul: 0 },
    ash: { Body: 0, Mind: 4, Soul: 8 },
  };
  const SPREADS = {
    vesk: [{ Body: 3 }, { Mind: 2, Body: 1 }],
    bram: [{ Body: 3 }, { Soul: 2, Mind: 1 }],
    dorrie: [{ Soul: 3 }, { Mind: 2, Body: 1 }],
    isolde: [{ Soul: 3 }, { Mind: 3 }],
    wren: [{ Mind: 3 }, { Body: 3 }],
    ash: [{ Soul: 3 }, { Mind: 2, Soul: 1 }],
  };
  const full = (x) => ({ Body: x.Body ?? 0, Mind: x.Mind ?? 0, Soul: x.Soul ?? 0 });
  // Everything they've got, with the abilities each archetype has, the one it
  // came with first.
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
      same(c.titles.map((t) => t.roots), SPREADS[id].map(full), `${id}'s Titles each put 3 on the Roots, spread the plan's way`);
      same(c.titles.map((t) => t.permissions.length), [3, 3], `${id} has three permissions on each Title`);
      same(c.archetypes.map((a) => [a.name, a.have]), HAVE[id], `${id}'s archetypes and the abilities they've got`);
      same(c.numbers.aura, 7, `${id}'s Aura maximum, 5 and 2 for one attuned thing`);
      same("specialties" in c, false, `${id} has no specialties`);
      same(c.attuned.length, 1, `${id} has one attuned thing`);
      if (c.attuned.some((a) => "aura" in a)) note(`${id}'s attuned thing still has its own way to Aura`);
      const cost = costOf(c);
      same(cost.spent, 35, `${id}'s points`);
      same(c.points, { start: 35, spent: 35 }, `${id}'s points on the sheet`);
      const add = cost.lines.reduce((t, x) => t + x.cost, 0);
      same(add, cost.spent, `${id}'s points, line by line`);
      same(RS.freshRoots(c).aura, 7, `${id} starts a scene on 7 Aura`);
    });
  }
  // Mo's prices: a Title, archetype or attuned thing is 5 with its one, and
  // everything else is 1, the keepsake free.
  tryIt("Mo's prices", () => {
    const bram = costOf(sheet("bram")).lines;
    const of = (kind) => bram.filter((x) => x.kind === kind).reduce((t, x) => t + x.cost, 0);
    same(["title", "perm", "arch", "ability", "attuned", "awk", "item"].map(of), [10, 4, 10, 2, 5, 0, 4], "Bram's 35: Titles 10, permissions 4, archetypes 10, abilities 2, his hammer 5 with its Catch's awakening free, and four things he carries 4");
    same(costOf(sheet("vesk")).lines.some((x) => /coin she ever stole/.test(x.what)), false, "Vesk's keepsake is free");
    // The builder's own build counts the same as the sheet it makes.
    same(costOf({ archs: ["Shadow", "Shadow"], titles: [{ text: "A", perms: [{ text: "a" }, { text: "b" }, { text: "" }], boons: [] }], attuned: [{ name: "x", catch: "", awk: [{ name: "w" }, { name: "" }] }], equipment: [{ text: "a knife" }, { text: "" }], utility: [{ text: "rope" }], keepsake: { text: "a coin" }, bag: "chalk\n\n" }).spent, 5 + 1 + 10 + 5 + 3, "a build: a Title with two permissions, Shadow twice, an attuned thing and three things carried");
    // A Boon's in place of two permissions, so it's 2 points.
    const boon = costOf(sheet("vesk", [{ k: "boon", t: 0, lever: "Aura", name: "", on: "", drop: [1, 2] }])).spent;
    same(boon, 35, "two of Vesk's permissions swapped for a Boon is still 35");
  });

  // The plan's two rolls for each of them: the Root, and 1 for each thing on
  // the sheet that plainly fits.
  const ROLLS = [
    ["vesk", "Picking a lock", "Body", ["The best cat burglar in the city", "Raised by the Guild", "pick a mechanical lock", "know how a lock's built", "a perfect set of picks"], 13, "2d12 + d2"],
    ["vesk", "Over Lord Vane's roof", "Body", ["The best cat burglar in the city", "move unseen", "run the rooftops", "Shadow", "Shadow", "A grappling line", "Anywhere I can throw a hook", "soft-soled boots"], 16, "2d12 + d8"],
    ["bram", "Defending behind his shield", "Body", ["The wall that held the harbour gate", "A sergeant who lost his stripes", "hold the line", "fight in a shield wall", "Guardian", "plate armour", "a shield"], 14, "2d12 + d4"],
    ["bram", "Barking an order", "Soul", ["A sergeant who lost his stripes", "bark an order that gets obeyed", "Leader"], 6, "d12"],
    ["dorrie", "Lying past the gate guard", "Mind", ["The voice that talked a duke out of his own house", "The woman with a hundred names", "make a lie sound like old news", "keep my story straight under questions", "Face"], 11, "d12 + d10"],
    ["dorrie", "Passing as someone of rank", "Mind", ["The woman with a hundred names", "pass as someone I'm not", "Shadow", "A signet pin", "Someone who matters", "court clothes"], 12, "2d12"],
    ["isolde", "Reading the order's old script", "Mind", ["The last student of a dead order", "A scholar of forbidden texts", "read the order's old script", "read dead languages", "a reading lens"], 12, "2d12"],
    ["isolde", "Drawing a ward", "Soul", ["The last student of a dead order", "draw a ward the dead can't cross", "Chalk and salt", "A circle anywhere I can kneel", "a salt packet"], 10, "d12 + d8"],
    ["wren", "Shooting from cover", "Body", ["The hunter who has never lost a trail", "An outrider from the border war", "Hunter", "Hunter", "Her longbow", "Long shot"], 12, "2d12"],
    ["wren", "Following a trail", "Mind", ["The hunter who has never lost a trail", "follow any trail", "Hunter", "Hunter"], 10, "d12 + d8"],
    ["ash", "Throwing fire", "Soul", ["The last fire-speaker of the Ember Court", "throw fire", "Elementalist", "An ember stone on a chain", "Fire without a word"], 13, "2d12 + d2"],
    ["ash", "Commanding a room", "Soul", ["The Court's runaway heir", "command a room", "carry myself like royalty", "Face"], 12, "2d12"],
  ];
  // Each name to the next thing on the sheet that has it, so Shadow twice is
  // both of Vesk's Shadows.
  const keysFor = (things, names, who) => {
    const used = new Set();
    return names.map((n) => {
      const t = things.find((x) => !used.has(x.key) && looks(x.name) === looks(n));
      if (!t) {
        note(`${who}: nothing on the sheet called "${n}" (it has ${things.map((x) => x.name).join(", ")})`);
        return null;
      }
      used.add(t.key);
      return t.key;
    }).filter(Boolean);
  };
  for (const [id, what, root, names, steps, dice] of ROLLS) {
    if (!sheets[id]) continue;
    tryIt(`${id}, ${what}`, () => {
      const c = sheet(id);
      const s = RS.freshRoots(c);
      const k = RS.countRoll(c, s, { root, using: keysFor(RS.thingsOf(c, s), names, `${id}, ${what}`) });
      same([k.total, diceLabel(k.dice), k.aura], [steps, dice, 0], `${id}, ${what}`);
    });
  }
  tryIt("the rest of a roll", () => {
    const c = sheet("vesk");
    const s = RS.freshRoots(c);
    const things = RS.thingsOf(c, s);
    const key = (name) => things.find((x) => looks(x.name) === looks(name))?.key;
    const lock = ["The best cat burglar in the city", "Raised by the Guild", "pick a mechanical lock", "know how a lock's built", "a perfect set of picks"].map(key);
    // Her knife needs explaining on a lock, so it's 1 Aura and a step.
    const knife = RS.countRoll(c, s, { root: "Body", using: lock, cases: [key("a knife")] });
    same([knife.total, knife.aura], [14, 1], "Vesk makes a case for her knife on the lock: 14 steps and 1 Aura");
    const both = RS.countRoll(c, s, { root: "Body", using: [...lock, key("a knife")], cases: [key("a knife")] });
    same([both.total, both.aura], [14, 1], "a thing she's explaining counts once, used or not");
    const brought = RS.countRoll(c, s, { root: "Body", using: lock, other: 1, beyond: true });
    same([brought.total, brought.aura], [14, 2], "the ground brought in is 1 Aura and a step, and going beyond is 1 Aura");
    same([RS.countRoll(c, s, { root: "Soul", using: [] }).total, diceLabel(RS.countRoll(c, s, { root: "Soul", using: [] }).dice)], [1, "d2"], "her Soul with nothing that fits is still a d2");
    same(RS.countRoll(c, s, { root: "Body", using: [...lock, "title|9", "nothing|0"] }).total, 13, "a key that isn't on her sheet adds nothing");
    same(RS.countRoll(c, s, { root: "Body", using: [...lock, lock[0]] }).total, 13, "nor does the same thing twice");
    // Every kind of thing is there, each with its own key.
    same([...new Set(things.map((x) => x.kind))].sort(), ["ability", "arch", "attuned", "awk", "item", "perm", "title"], "Vesk's sheet has every kind of thing");
    same(new Set(things.map((x) => x.key)).size, things.length, "no two things share a key");
    same(things.filter((x) => x.kind === "arch").map((x) => x.key), ["arch|0", "arch|1"], "her two Shadows are two things");
    same(things.filter((x) => x.kind === "ability").map((x) => x.key), ["ability|0|Push", "ability|1|Vanish"], "and each has the ability it came with");
    same(things.filter((x) => x.kind === "perm").map((x) => [x.key, x.root]), [["perm|0|0", "Body"], ["perm|0|1", "Body"], ["perm|0|2", "Body"], ["perm|1|0", "Mind"], ["perm|1|1", "Body"], ["perm|1|2", "Mind"]], "her permissions, each on its Root");
    // A second knife she picks up gets a key of its own, and every key lasts
    // through a save and a reload.
    const s2 = JSON.parse(JSON.stringify({ ...s, picked: [{ name: "a knife", where: "equipment" }] }));
    const knives = RS.thingsOf(c, RS.normalRoots(s2, c)).filter((x) => looks(x.name) === "a knife").map((x) => x.key);
    same(knives, ["equipment|a knife", "equipment|a knife|2"], "two knives, two keys");
    same(RS.thingsOf(c, JSON.parse(JSON.stringify(s))).map((x) => x.key), things.map((x) => x.key), "the keys are the same after a reload");
    // A Boon does what it says and adds no step.
    const boon = sheet("vesk", [{ k: "boon", t: 0, lever: "Splits", name: "", on: "", drop: [1, 2] }]);
    if (RS.thingsOf(boon, RS.freshRoots(boon)).some((x) => /boon/i.test(x.kind))) note("a Boon is on the list of things that add a step");
    // Every screen's on stacking now, so a Title's its words, its spread and
    // its permissions, with nothing left over from specialties, and its
    // thing's Root is the one it puts most on.
    same(["name", "root", "specialties"].filter((k) => k in c.titles[1]).concat(c.titles[1].permissions.flatMap((x) => Object.keys(x).filter((k) => /spec/.test(k)))), [], "no old fields on a Title or its permissions");
    same([things.find((x) => x.key === "title|1")?.root, RS.mostOf(c.titles[1].roots)], ["Mind", "Mind"], "her second Title's thing is on her Mind, where it puts most");
    same(["specSteps", "rootFor", "actionsMax"].filter((k) => k in RS), [], "and nothing's kept for specialties or the old cap");
  });

  // Extra actions: your first's free, then 3 Aura, 4, 5 and so on, back to 3
  // the next round. Holding, coming out of hiding and the Boon are on top.
  tryIt("extra actions", () => {
    same([RS.extraCost(0), RS.extraCost(1), RS.extraCost(2), RS.extraCost(3)], [3, 4, 5, 6], "a second action is 3 Aura, a third 4, a fourth 5 and a fifth 6");
    const c = sheet("ash");
    const s = RS.freshRoots(c);
    const fire = RS.thingsOf(c, s).filter((x) => ["The last fire-speaker of the Ember Court", "throw fire", "Elementalist", "An ember stone on a chain", "Fire without a word"].some((n) => looks(n) === looks(x.name))).map((x) => x.key);
    const three = RS.countRoll(c, s, { root: "Soul", using: fire, extra: [{ via: "aura" }, { via: "aura" }, { via: "aura" }] });
    same([three.total, three.aura, three.splits, three.bought], [16, 12, 4, 3], "Ash buys a second, third and fourth action in one roll: 3 steps more, 3 + 4 + 5 Aura and a split each");
    s.bought = 1;
    const third = RS.countRoll(c, s, { root: "Soul", using: fire, extra: [{ via: "aura" }] });
    same([third.aura, third.total], [4, 14], "with one bought already this round, the next is 4");
    s.bought = 2;
    same(RS.countRoll(c, s, { root: "Soul", using: fire, extra: [{ via: "aura" }] }).aura, 5, "and the one after that is 5");
    s.bought = 0;
    const free = RS.countRoll(c, s, { root: "Soul", using: fire, extra: [{ via: "held" }, { via: "hiding" }, { via: "boon" }, { via: "aura" }] });
    same([free.aura, free.total, free.bought], [3, 17, 1], "held, hiding and the Boon are free and don't put the price up");
    s.bought = 3;
    s.acting = true;
    RS.doneActing(s, c);
    same(s.bought ?? 0, 0, "finishing acting puts the price back to 3");
    same(RS.countRoll(c, s, { root: "Soul", using: fire, extra: [{ via: "aura" }] }).aura, 3, "so the next round's first is 3 again");
    // A friend's action brings what fits off their sheet, 1 each, and a split.
    const combo = RS.countRoll(c, s, { root: "Soul", using: fire, friends: [4] });
    same([combo.total, combo.splits], [17, 2], "a friend bringing 4 things is 4 steps and a split");
  });

  // Aura's maximum: 5, 2 more for each attuned thing, and less whatever's
  // powering an awakening till the scene ends.
  tryIt("Aura's maximum", () => {
    const c = sheet("vesk");
    const s = RS.freshRoots(c);
    const hook = RS.passivesOf(c)[0];
    same([hook?.name, hook?.holds], ["Anywhere I can throw a hook", 2], "her hook's passive holds 2");
    same(RS.auraMax(c, s), 7, "Vesk's maximum is 7");
    s.acting = true;
    same([RS.powerUp(s, c, hook.key), s.aura, RS.auraMax(c, s)], [true, 6, 6], "powering her hook takes 1 off what she's got and off her maximum");
    same([RS.powerUp(s, c, hook.key), s.aura, RS.auraMax(c, s), s.power[hook.key]], [true, 5, 5, 2], "and a second");
    same([RS.powerUp(s, c, hook.key), s.aura, RS.auraMax(c, s)], [false, 5, 5], "and it holds 2, so a third's turned down");
    RS.gainAura(s, c, 3);
    same(s.aura, 8, "while she's acting, wins and top faces go past her maximum");
    RS.doneActing(s, c);
    same(s.aura, 5, "and when she's done, she's back to the lower maximum");
    same([RS.gainAura(s, c, 2), s.aura], [2, 5], "and wins fill her up to 5, not 7");
    same("store" in s, false, "nothing's held the old way");
    const zero = RS.freshRoots(c);
    zero.acting = true;
    zero.aura = 0;
    same(RS.powerUp(zero, c, hook.key), false, "with no Aura there's nothing to power it with");
    same(RS.powerUp(RS.freshRoots(c), c, "0|Not on her sheet"), false, "there's nothing to power that isn't on her sheet");
    RS.powerOff(s);
    same([s.power, RS.auraMax(c, s)], [{}, 7], "the end of the scene empties it, and her maximum's 7 again");
    // The same awakening twice holds 4, a second attuned thing is 2 more, and
    // so's the Aura Boon.
    const twice = sheet("wren", [{ k: "awk", a: 0, name: "Long shot", kind: "passive", text: "+1 on one die of every roll she makes with it, for each Aura powering it." }]);
    same(RS.passivesOf(twice).find((w) => w.name === "Long shot")?.holds, 4, "Long shot twice holds 4");
    same(sheet("vesk", [{ k: "attune", name: "A lucky coin", awk: { name: "Called it", kind: "passive", text: "+1 on one die, for each Aura powering it." } }]).numbers.aura, 9, "two attuned things make 9");
    same(sheet("vesk", [{ k: "boon", t: 0, lever: "Aura", name: "", on: "", drop: [1, 2] }]).numbers.aura, 9, "and so does the Aura Boon");
  });

  // Saves from before the rework: the crew keep their play, what was held in
  // an awakening is powering it now, and a character built on the phone is
  // recounted, with what the player has to choose flagged.
  tryIt("saves from before", () => {
    const grown = [{ k: "perm", t: 0, text: "climb a sheer wall", root: "Body", spec: "Climbing" }];
    const c = sheet("vesk", grown);
    same(c.roots, { Body: 9, Mind: 4, Soul: 0 }, "Vesk with a permission she grew in downtime");
    const hook = RS.passivesOf(c)[0].key;
    const raw = {
      v: 2, aura: 3, acting: false, tracks: { stamina: 8, confidence: 12, resolve: 10 },
      scars: { stamina: ["a burn across her back"], confidence: [], resolve: [] }, blaze: null, dead: false,
      store: { [hook]: 2 }, conditions: [{ name: "Burning", die: 6, kind: "against" }], threads: { dorrie: "strained" },
      crossed: { "utility|a smoke bomb": true }, boxes: {}, picked: [{ name: "a lantern", where: "bag" }],
      asp: 4, aspText: "", notes: "Owes Mara a favour.", last: null, grown, tele: { c: "abc", r: 2 },
    };
    const s = RS.normalRoots(JSON.parse(JSON.stringify(raw)), c);
    same(s.v, 3, "a save from before is on v3");
    same([s.aura, s.power, "store" in s, RS.auraMax(c, s)], [3, { [hook]: 2 }, false, 5], "the 2 she held in her hook is powering it, so her maximum's 5");
    same([s.tracks, s.scars.stamina, s.conditions.map((x) => x.name), s.threads, s.crossed, s.picked.map((p) => p.name), s.asp, s.notes, s.tele, s.grown.length], [raw.tracks, raw.scars.stamina, ["Burning"], raw.threads, raw.crossed, ["a lantern"], 4, raw.notes, raw.tele, 1], "Vesk keeps her play");
    same([s.bought ?? 0, s.stacked, s.choose], [0, true, []], "she's told once, and there's nothing for her player to choose");
    same(RS.normalRoots(JSON.parse(JSON.stringify(s)), c).stacked, true, "and it stays till she's seen it");
    const done = RS.normalRoots({ ...JSON.parse(JSON.stringify(s)), stacked: false }, c);
    same(done.stacked, undefined, "and goes once she has");
    same(RS.normalRoots({ ...raw, aura: 5, store: {} }, c).aura, 5, "her Aura comes across as it was, with room for 2 more next scene");
    // Aura held the old way, pumped in: it's powering now.
    const held = RS.normalRoots({ ...JSON.parse(JSON.stringify(s)), store: { [hook]: 1 }, power: {} }, c);
    same([held.power, "store" in held], [{ [hook]: 1 }, false], "Aura pumped into the hook the old way is powering it");
    // A character from before Roots comes all the way across.
    const old = RS.normalRoots(RS.fromOld({ wound: 8, conf: 3, resolve: 2, scars: 1, notes: "Old notes.", threads: { dorrie: "strained" } }, c), c);
    same([old.v, old.moved, old.stacked, old.scars.stamina.length, old.notes], [3, true, true, 1, "Old notes."], "Old Vesk moves onto Roots and onto stacking at once");

    // Tamsin, built on the phone before the rework: a Title on one Root reads
    // as 3 on it, her specialties go, and her attuned thing's own way to Aura.
    const tamsin = {
      id: "tamsin", name: "Tamsin", own: true, title: "The duellist who's never lost", blurb: "", hash: "x", pronoun: "her", playsLike: "",
      archetypes: [{ name: "Warrior", id: "a-warrior", home: "Stamina" }, { name: "Leader", id: "a-leader", home: "Resolve" }],
      titles: [
        { name: "The duellist who's never lost", root: "Body", specialties: ["Swordplay", "Duelling", "Crowds"], permissions: [{ text: "fight with a sword", root: "Body", specialty: "Swordplay" }, { text: "read a fighter's style", root: "Mind", specialty: "Duelling" }, { text: "fight in front of a crowd", root: "Body", specialty: "Crowds" }], boons: [] },
        { name: "Captain of the Guard", root: "Soul", specialties: ["Command", "Tactics", "Soldiering"], permissions: [{ text: "give orders people follow", root: "Soul", specialty: "Command" }, { text: "read a battlefield", root: "Mind", specialty: "Tactics" }, { text: "lead a charge", root: "Body", specialty: "Soldiering" }], boons: [] },
      ],
      roots: { Body: 0, Mind: 0, Soul: 0 }, specialties: [{ name: "Swordplay", steps: 0 }],
      carry: { equipment: ["a duelling sword", "a buckler"], utility: ["a whetstone"], keepsake: "her mother's ring", bag: { name: "a bag", max: 10, items: [] } },
      armour: [], attuned: [{ name: "Her rapier", props: null, stage: "Awakened", catch: null, burden: null, aura: "1 when she wins a duel", awakenings: [{ name: "Riposte", kind: "passive", text: "+1 on one die of every roll she makes with it, for each Aura in it." }] }],
      numbers: { aura: 5, stride: 3, strideNote: null, stamina: { die: 12, note: null }, confidence: { die: 12, note: null }, resolve: { die: 12, note: null } },
      threads: [], crewQs: [], aspiration: { text: "Never lose", die: 2 }, trouble: [],
    };
    const t = rootsSheet(tamsin, [], BUILD);
    same(t.roots, { Body: 6, Mind: 2, Soul: 4 }, "Tamsin's Roots recounted: each Title's 3 on its Root, and her permissions");
    same(["specialties" in t, t.titles.map((x) => x.roots), t.titles.map((x) => x.fromRoot), t.titles.flatMap((x) => ["name", "root", "specialties"].filter((k) => k in x))], [false, [full({ Body: 3 }), full({ Soul: 3 })], ["Body", "Soul"], []], "her Titles read as 3 on their old Roots, for her to check, with their specialties gone");
    same([t.numbers.aura, "aura" in t.attuned[0]], [7, false], "her rapier puts 2 on her Aura and has no way to Aura of its own");
    same(t.archetypes.map((a) => a.have.length), [2, 2], "she keeps every ability her archetypes had");
    same(t.points, { start: 35, spent: 34 }, "she comes to 34 of her 35 points");
    const ts = RS.normalRoots({ v: 2, aura: 5, tracks: { stamina: 12, confidence: 12, resolve: 12 }, store: {} }, t);
    same(ts.choose, [{ k: "spread", t: 0, root: "Body" }, { k: "spread", t: 1, root: "Soul" }, { k: "points", left: 1 }], "what her player has to choose: each Title's spread, and the point she's got left");
    // Once her build spreads a Title, its flag goes.
    const spread = rootsSheet({ ...tamsin, titles: [{ ...tamsin.titles[0], roots: { Body: 2, Mind: 1, Soul: 0 } }, tamsin.titles[1]] }, [], BUILD);
    same(RS.normalRoots(ts, spread).choose, [{ k: "spread", t: 1, root: "Soul" }, { k: "points", left: 1 }], "spreading her first Title clears its flag");
    // An archetype the book hasn't got any more, like the Scholar since
    // 14 Nov, is hers to swap, and it's the first thing she's asked.
    const withScholar = rootsSheet({ ...tamsin, archetypes: [tamsin.archetypes[0], { name: "Scholar", id: "a-scholar", home: "Confidence" }] }, [], BUILD);
    same([withScholar.archetypes.map((a) => Boolean(a.gone)), RS.choicesOf(withScholar)[0]], [[false, true], { k: "arch", a: 1, name: "Scholar" }], "the Scholar's gone from the book, and hers to swap");
    const sc = RS.normalRoots({ v: 2, aura: 5, tracks: { stamina: 12, confidence: 12, resolve: 12 } }, withScholar);
    same(sc.choose[0], { k: "arch", a: 1, name: "Scholar" }, "moving across, it's the first thing she's asked");
    const swapped = rootsSheet({ ...tamsin, archetypes: [tamsin.archetypes[0], { name: "Oracle", id: "a-oracle", home: "Confidence" }] }, [], BUILD);
    same(RS.normalRoots(sc, swapped).choose.some((x) => x.k === "arch"), false, "and once she's swapped it in Change, it goes");
    same(rootsSheet(withScholar, [], null).archetypes.some((a) => a.gone), false, "with no book to hand, nothing's called gone");
  });

  // The build stops on a crew sheet that doesn't add up, or an ability that
  // isn't its archetype's.
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
      const crew = crewSheets.crewFrom({ body }, { warn: (m) => said.push(m), inline: (s) => s, archetypes, qualities: BUILD.qualities });
      return { crew, said };
    };
    const real = read(text);
    same([real.crew.length, real.said], [6, []], "the chapter's six crew sheets read with nothing wrong");
    const BROKEN = [
      ["a Roots line that doesn't add up", "**Roots:** Body 8 · Mind 4 · Soul 0.", "**Roots:** Body 9 · Mind 4 · Soul 0."],
      ["a Title spread to 4", "*Raised by the Guild* (Mind 2, Body 1)", "*Raised by the Guild* (Mind 2, Body 2)"],
      ["a Title with no spread", "*Raised by the Guild* (Mind 2, Body 1)", "*Raised by the Guild* (Mind)"],
      ["points that don't add up", "**Points:** 35. Two Titles 10, four more permissions 4, Shadow twice 10", "**Points:** 36. Two Titles 10, four more permissions 4, Shadow twice 10"],
      ["a points line whose parts don't add up", "four more permissions 4, Shadow twice 10", "four more permissions 5, Shadow twice 10"],
      ["an ability that isn't its archetype's", "[Shadow](#a-shadow) (*Vanish*)", "[Shadow](#a-shadow) (*Make it real*)"],
      ["an archetype with no ability", "[Shadow](#a-shadow) (*Vanish*)", "[Shadow](#a-shadow)"],
      ["Aura that isn't 5 and 2 for the attuned thing", "**Numbers:** Aura 7 · Stamina d12 · Confidence d12 · Resolve d12 · Stride 3.", "**Numbers:** Aura 5 · Stamina d12 · Confidence d12 · Resolve d12 · Stride 3."],
      ["a specialty back on a permission", "*move unseen* (Body)", "*move unseen* (Body, Stealth)"],
      ["a Specialties line", "**Roots:** Body 8 · Mind 4 · Soul 0.", "**Roots:** Body 8 · Mind 4 · Soul 0.\n\n**Specialties:** Locks 4."],
      ["an attuned thing's own way to Aura", "**Attuned (Awakened):** A grappling line.", "**Attuned (Awakened):** A grappling line.\n\n**Its Aura:** 1 the first time each scene she gets somewhere nobody else could follow."],
      ["a bag that says it holds more than it lists", "her hunter's pack, with a coil of rope (1 of 10)", "her hunter's pack, with a coil of rope (2 of 10)"],
    ];
    for (const [what, from, to] of BROKEN) {
      if (!text.includes(from)) {
        note(`the chapter hasn't got "${from}" to break for ${what}`);
        continue;
      }
      if (!read(text.replace(from, to)).said.length) note(`the build doesn't stop on ${what}`);
    }
  }
  console.log("the crew and the character on stacking checked");
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
  const lower = (r) => r.toLowerCase();
  for (const crew of book.crew) {
    const c = rootsSheet(crew, [], BUILD);
    const s = RS.normalRoots({}, c);
    const { got, short } = await print(crew.name, c, s);
    const who = crew.name;
    if (short) note(`${who}'s Notes ran out of room`);
    same([got.name, got.aura_now, got.aura_max, got.aura_powering, got.points_spent, got.points_start, got.points_banked], [who, "7", "7", "", "35", "35", ""], `${who}'s name, Aura and points`);
    for (const r of ROOTS) {
      const perms = crew.titles.flatMap((t) => t.permissions).filter((p) => p.root === r).length;
      same(got[`root_${lower(r)}`], String(crew.roots[r]), `${who}'s ${r}`);
      crew.titles.forEach((t, i) => same(got[`root_${lower(r)}_title_${i + 1}`], box(t.roots[r]), `${who}'s ${r} from Title ${i + 1}`));
      same(got[`root_${lower(r)}_permissions`], box(perms), `${who}'s ${r} from permissions`);
      same(crew.titles.reduce((n, t) => n + t.roots[r], 0) + perms, crew.roots[r], `${who}'s ${r}, added up from where it came from`);
    }
    crew.titles.forEach((t, i) => {
      const at = `title_${i + 1}`;
      same(joined(got, at, `${at}_more`), t.text, `${who}'s Title ${i + 1}`);
      same(ROOTS.map((r) => got[`${at}_${lower(r)}`]), ROOTS.map((r) => box(t.roots[r])), `${who}'s Title ${i + 1}'s spread`);
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
      same(got[`${at}_track`], lower(rule.home), `${n}'s home track on ${who}'s sheet`);
      same(joined(got, `${at}_mechanic`, `${at}_mechanic_more`), rule.for, `${n}'s mechanic on ${who}'s sheet`);
      const abilities = joined(got, ...Array.from({ length: 6 }, (_, k) => `${at}_ability_${k + 1}`));
      for (const h of new Set(crew.archetypes.filter((a) => a.name === n).flatMap((a) => a.have))) {
        const x = rule.abilities.find((y) => y.name === h);
        // Push is +2, and a point more for each time the same one's taken again.
        const said = h === "Push" ? x.text.replace("+2", `+${times + 1}`) : x.text;
        has(abilities, `${h} (1 ${rule.home}): ${said}`, `${n}'s ${h}, whole, on ${who}'s sheet`);
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
    same(got.attune_1_awakening_1_kind, thing.awakenings[0].kind, `${who}'s first awakening, ringed passive or active`);
    same(got.bond_1, crew.threads[0].person, `${who}'s first bond`);
  }
  // From the GM's look, with no book to hand: the sheet the phone already has.
  {
    const crew = book.crew.find((c) => c.id === "bram");
    const c = rootsSheet(crew, [], BUILD);
    const out = await fillSheet({ name: "Bram" }, c, RS.normalRoots({}, c), { blank });
    same(out.missing, [], "fields print looked for on Bram's sheet from the GM's look");
    const got = await valuesOf(out.bytes);
    same([got.archetype_1, got.archetype_1_track, got.archetype_2], ["Guardian", "stamina", "Leader"], "Bram's archetypes from the GM's look");
    has(joined(got, ...Array.from({ length: 6 }, (_, k) => `archetype_1_ability_${k + 1}`)), "Stand firm (1 Stamina):", "Bram's Stand firm from the GM's look");
  }

  // Vesk part way through a scene: her hook powered with 2 off a maximum of
  // 7, a Scar at her Stamina, Burning, a strained thread, her smoke bomb used
  // and two dice in her Shadow's pool.
  {
    const crew = book.crew.find((c) => c.id === "vesk");
    const c = rootsSheet(crew, [], BUILD);
    const s = RS.normalRoots({}, c);
    s.acting = true;
    same(RS.powerUp(s, c, "0|Anywhere I can throw a hook", 2), true, "Vesk powering her hook with 2");
    RS.doneActing(s, c);
    s.aura -= 1;
    s.tracks.stamina = 4;
    s.scars.stamina = ["a burn across the back"];
    s.conditions = [{ name: "Burning", die: 6, kind: "against" }];
    s.threads["Dorrie|We have pulled a dozen jobs. I trust her with my life."] = "strained";
    s.crossed["utility|a smoke bomb"] = true;
    s.pool = [8, 4];
    const { got } = await print("Vesk", c, s, { goal: { text: "Get the Vane collection out of the city", die: 4 } });
    const want = [["aura_now", "4"], ["aura_max", "7"], ["aura_powering", "2"], ["stamina", "d4"], ["stamina_scar_2", true], ["stamina_scar_4", false], ["scar_1", "a burn across the back (Stamina)"],
      ["condition_1", "Burning"], ["condition_1_die", "d6"], ["utility_2", "a smoke bomb (used)"], ["party_goal", "Get the Vane collection out of the city"], ["party_goal_die", "d4"],
      ["attune_1_awakening_1_aura_1", true], ["attune_1_awakening_1_aura_2", true], ["bond_1_thread_1_strained", true], ["bond_1_thread_1_snapped", false], ["stamina_armour_1", "Common worn leathers"]];
    for (const [name, value] of want) same(got[name], value, `${name} on Vesk part way through a scene`);
    const notes = joined(got, "notes_1", "notes_2", "notes_3", "notes_4");
    has(notes, "Trouble that follows her: wanted in three districts, owes the Guild.", "her trouble in Notes");
    has(notes, "Shadow’s pool: d8, d4.", "her Shadow's pool in Notes");
    has(notes, "A hostile thread with The fence: I owe a debt I would rather not discuss.", "her fifth bond's thread in Notes, with one full stop");
  }

  // Vesk with seven Titles: the boxes for where her Body came from stop at
  // VI, so her seventh Title's spread is in Notes, and they all still add up.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "vesk"));
    for (const n of ["third", "fourth", "fifth", "sixth", "seventh"]) crew.titles.push({ text: `The ${n} best climber`, roots: { Body: 3, Mind: 0, Soul: 0 }, permissions: [], boons: [] });
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Vesk", c, RS.normalRoots({}, c));
    const boxes = [1, 2, 3, 4, 5, 6].reduce((n, i) => n + Number(got[`root_body_title_${i}`] || 0), 0) + Number(got.root_body_permissions);
    same([got.root_body, boxes + 3], [String(c.roots.Body), c.roots.Body], "Vesk's Body with seven Titles, the boxes and her seventh's 3 in Notes adding up");
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "Title VII, The seventh best climber (Body 3 on your Roots)", "her seventh Title's spread in Notes");
  }

  // A line cut short goes in Notes in full: Vesk's leathers, said to count only
  // on a rooftop, with two more pieces on her Body so it gets one line.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "vesk"));
    crew.armour[0].when = "but only on a rooftop at night, with the wind behind her";
    crew.armour.push({ name: "a padded hood", root: "Body", quality: "Common", boxes: 1, when: null }, { name: "bracers", root: "Body", quality: "Common", boxes: 1, when: null });
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Vesk", c, RS.normalRoots({}, c));
    if (!got.stamina_armour_1.endsWith("…")) note(`Vesk's long armour line isn't cut short: "${got.stamina_armour_1}"`);
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "In full: Common worn leathers, but only on a rooftop at night, with the wind behind her.", "the leathers in full in Notes");
  }

  // Bram's plate made Masterwork, with an Armour Boon on it, has more boxes
  // than its line: three ticked, and Notes say the rest.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "bram"));
    crew.armour[0].quality = "Masterwork";
    crew.armour[0].boxes = 3;
    crew.titles[0].boons = [{ lever: "Armour", name: "Old plates", on: "plate armour" }];
    const c = rootsSheet(crew, [], BUILD);
    const s = RS.normalRoots({}, c);
    s.boxes = { "equipment|plate armour": 4 };
    const { got } = await print("Bram", c, s);
    same([got.stamina_armour_1, got.stamina_armour_1_box_3], ["Masterwork plate armour", true], "Bram's Masterwork plate, its line's three boxes ticked");
    has(joined(got, "notes_1", "notes_2", "notes_3", "notes_4"), "Armour on Body: Masterwork plate armour has 4 boxes, 4 ticked.", "his plate's fourth box in Notes");
  }

  // Bram with a Boon on his second Title, which takes two lines and rings no Root.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "bram"));
    crew.titles[1].boons = [{ lever: "Toughness", name: "Thick skull" }];
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Bram", c, RS.normalRoots({}, c));
    same(joined(got, "title_2_permission_4", "title_2_permission_5"), "Boon, Thick skull (Toughness): the first hit you take each scene doesn’t drop a track", "Bram's Boon after his permissions, over its two lines");
    same([got.title_2_permission_4_root, got.title_2_permission_5_root, got.title_2_permission_6], ["", "", ""], "no Root ringed for his Boon, and his last line free");
  }

  // The longest mechanic in the book, the Bard's, whole over its two lines.
  {
    const crew = structuredClone(book.crew.find((c) => c.id === "ash"));
    crew.archetypes[1] = { name: "Bard", id: "a-bard", home: "Resolve", have: ["Push"] };
    const c = rootsSheet(crew, [], BUILD);
    const { got } = await print("Ash", c, RS.normalRoots({}, c));
    same(joined(got, "archetype_2_mechanic", "archetype_2_mechanic_more"), BUILD.archetypes.find((a) => a.name === "Bard").for, "the Bard's mechanic, whole");
  }

  // Rook, made up with more of everything than the paper holds: seven
  // Titles spread across every Root, four archetypes past the three cards
  // (one taken twice), three attuned things powered to the full, armour on
  // every Root, five bonds of four threads, five conditions and six Scars.
  {
    const ord = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
    const titles = ord.map((o, i) => ({
      text: `The ${o} ferry keeper on the drowned river road`,
      roots: { Body: 1, Mind: 1, Soul: 1 },
      permissions: Array.from({ length: i === 6 ? 4 : 6 }, (_, j) => ({ text: `cross ${o} water ${j + 1}`, root: ROOTS[j % 3] })),
      boons: i === 6 ? [{ lever: "Aura", name: "Deep reserves" }] : [],
    }));
    const made = (name, home) => ({
      name, id: null, home,
      for: `${name}: a lantern held up to whatever the crew can't see`,
      trait: { name: `${name}'s calm`, text: "Nothing in the dark ever takes you by surprise." },
      abilities: Array.from({ length: 6 }, (_, k) => ({ name: `${name} ${k + 1}`, cost: home, text: `a short thing it does, ${k + 1}` })),
      have: Array.from({ length: 6 }, (_, k) => `${name} ${k + 1}`),
    });
    const wakes = (tag, n) => Array.from({ length: n }, (_, k) => ({ name: `${tag} ${k + 1}`, kind: "passive", text: `+1 on one die ${k + 1}` }));
    const people = ["Ada", "Bo", "Cy", "Di", "Ed"];
    const base = {
      ...structuredClone(book.crew.find((c) => c.id === "bram")),
      name: "Rook", pronoun: "them", points: { start: 120 }, titles,
      archetypes: [made("Lanternkeeper", "Resolve"), made("Ferryman", "Stamina"), made("Ferryman", "Stamina"), made("Gatewarden", "Confidence"), { name: "Warrior", id: "a-warrior", home: "Stamina", have: ["Push"] }],
      attuned: [
        { name: "A lantern", props: "Bright", stage: "Perfected", catch: "Smoky", burden: "Heavy", awakenings: [...wakes("Lantern", 6), { name: "Lantern 7", kind: "active", text: "the dark lifts" }] },
        { name: "A pole", props: null, stage: "Tempered", catch: "Slippery", burden: "Long", awakenings: wakes("Pole", 6) },
        { name: "A bell", props: null, stage: "Awakened", catch: null, burden: null, awakenings: wakes("Bell", 1) },
      ],
      carry: { equipment: ["a coat", "a hook", "a boot", "a spare boot"], utility: ["rope", "tar", "salt", "wax"], keepsake: "a river stone", bag: { name: "a bag", max: 10, items: Array.from({ length: 12 }, (_, k) => `a thing ${k + 1}`) } },
      armour: ROOTS.flatMap((r) => [1, 2, 3].map((k) => ({ name: `${lower(r)} guard ${k}`, root: r, quality: "Masterwork", boxes: 3, when: k === 1 ? "while the lantern's lit" : null }))),
      threads: people.map((p, i) => ({ person: p, threads: Array.from({ length: 4 }, (_, k) => ({ text: `${p} and I, ${k + 1}`, kind: (i + k) % 2 ? "hostile" : "bond", whose: null, strained: false })) })),
      trouble: ["owes the ferry guild"],
    };
    const c = rootsSheet(base, [], BUILD);
    const s = RS.normalRoots({}, c);
    s.power = Object.fromEntries([...wakes("Lantern", 6), ...wakes("Pole", 6)].map((w) => [`${w.name.startsWith("Pole") ? 1 : 0}|${w.name}`, 2]));
    s.aura = 1;
    s.tracks = { stamina: 2, confidence: 6, resolve: 12 };
    s.scars = { stamina: ["one", "two", "three", "four", "five"], confidence: ["six", "seven", "eight", "nine", "ten"], resolve: ["eleven", "twelve", "thirteen", "fourteen", "fifteen"] };
    s.conditions = ["Burning", "Slowed", "Shaken", "Prone", "Blinded"].map((name, k) => ({ name, die: 2 + 2 * k, kind: "against" }));
    s.boxes = Object.fromEntries(c.armour.map((a) => [`equipment|${a.name}`, 3]));
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
    same([got.archetype_2_ability_1, got.archetype_2_ability_6], ["Ferryman 1 (1 Stamina): a short thing it does, 1", "Ferryman 6 (1 Stamina): a short thing it does, 6"], "six abilities on the Ferryman's card, a line each");
    same([got.attune_2_thing, got.attune_2_stage, got.attune_2_burden, got.attune_2_awakening_6_aura_2], ["A pole", "tempered", "Long", true], "Rook's second attuned thing, powered");
    same([got.equipment_3, got.bag_10], ["a boot, a spare boot", "a thing 10, a thing 11, a thing 12"], "what doesn't fit its lines sharing the last one");
    has(got.stamina_armour_1, "Masterwork body guard 1, while the", "Rook's first armour on Body, cut short since the lines are full");
    if (!/…$/.test(got.stamina_armour_1)) note(`Rook's first armour on Body doesn't end with an ellipsis: "${got.stamina_armour_1}"`);
    same([got.stamina_armour_1_box_3, got.stamina_armour_2], [true, "Masterwork body guard 2"], "Rook's armour on Body, a line each when the lines are full");
    same([got.stamina_scar_10, got.resolve_scar_10, got.scar_5], [true, true, "five (Stamina)"], "Rook's Scars");
    same([got.bond_4_thread_3_strained, got.bond_4_thread_3_snapped], [true, true], "a snapped thread ticked both ways");
    const notes = joined(got, "notes_1", "notes_2", "notes_3", "notes_4");
    has(notes, "Trouble that follows them: owes the ferry guild.", "Rook's trouble in Notes");
    has(notes, "Owes the ferryman a song.", "Rook's own notes, before what didn't fit");
    if (!/…$/.test(got.notes_4)) note(`Rook's Notes don't end with an ellipsis where they ran out: "${got.notes_4}"`);
  }

  // Every field gets filled by one of them, bar what only a pencil fills.
  const PENCIL = ["player", "points_banked", "attune_1_material", "attune_2_material"];
  same(list.map((f) => f.name).filter((n) => !filled.has(n) && !PENCIL.includes(n)), [], "fields print never fills for anyone");
  console.log("print checked field by field: the crew, Vesk mid-scene, Bram's Boon and Rook past the paper's room");
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

// 2. The crew's Roots. The phone reads each sheet off the chapter (book.json's
// crew, which the build checks adds up), so each Root's tile is its steps and
// the dice they make on their own.
if (part("2")) {
  same(book.crew.length, 6, "the crew in book.json");
  const { context, page } = await phone();
  for (const base of book.crew) {
    const c = rootsSheet(base, [], BUILD);
    await play(page, base.id);
    same(await page.$$eval(".cc-roots .tile[data-r]", (els) => els.map((el) => [el.dataset.r, el.querySelector(".tile-steps").textContent, el.querySelector(".tile-die").textContent])), ROOTS.map((r) => [r, c.roots[r] ? `${c.roots[r]} ${c.roots[r] === 1 ? "step" : "steps"}` : "nothing yet", c.roots[r] ? diceLabel(stepsToDice(c.roots[r])) : "a d2"]), `${base.name}'s Roots`);
    same(await page.$$eval(".tile[data-s]", (els) => els.length), 0, `no specialty tiles for ${base.name}`);
    same(await page.$$eval(".cc-track .is-trk .v", (els) => els.map((e) => e.textContent)), ["d12", "d12", "d12"], `${base.name}'s tracks to start with`);
    same(await page.textContent('.cc-stat[data-p="aura"] .v'), `${c.numbers.aura}/${c.numbers.aura}`, `${base.name}'s Aura to start with`);
    same(await page.$$eval(".cc-stat.t-stamina .zd-plate", (els) => els.length), c.armour.filter((a) => a.root === "Body").reduce((t, a) => t + a.boxes, 0), `${base.name}'s armour on their Body`);
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")));
  same([saved.v, saved.characters.length, saved.characters.every((x) => x.state?.v === 3)], [1, 6, true], "the saved list's version and size, every one on stacking");
  console.log(`crew: ${book.crew.length} sheets checked against the chapter`);
  await context.close();
}

// 3. Vesk at the table, on stacking.
if (part("3")) {
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await shot(page, "1-characters");
  await play(page, "vesk", "Vesk");
  await shot(page, "2-play");
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const aura = () => page.textContent('.cc-stat[data-p="aura"] .v');
  const track = (t) => page.textContent(`.cc-stat[data-p="${t}"] .v`);
  const rootTile = (r) => `.cc-roots .tile[data-r="${r}"]`;
  const tileOf = (r) => page.$eval(rootTile(r), (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`);
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const done = async () => { await page.click('#cc-dialog .dlg-foot button[data-act="close"]'); await closed(); };
  const shut = async () => { await page.click('#cc-dialog .dlg-head button[data-act="close"]'); await closed(); };
  const outs = () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  const body = () => page.textContent("#cc-dialog .dlg-body");
  const rolled = () => page.waitForSelector("#cc-dialog .res .res-out");
  const chip = (k) => `#cc-dialog .cc-pick[data-act="use"][data-k="${k}"]`;
  const use = (k) => page.click(chip(k));
  const chipIs = (k) => page.$eval(chip(k), (el) => (el.classList.contains("is-case") ? "explaining" : el.classList.contains("is-in") ? "in" : "out"));
  const foe = (d) => page.click(`#cc-dialog button[data-act="foe-add"][data-v="${d}"]`);
  const again = () => page.textContent(".tile-again");
  const LOCK = "perm|0|2"; // pick a mechanical lock
  const BUILT = "perm|1|0"; // know how a lock's built
  const PICKS = "utility|a perfect set of picks";
  const KNIFE = ["perm|1|1", "equipment|a knife"]; // fight dirty with a knife, and the knife
  const UNSEEN = "perm|0|0"; // move unseen
  const HOOK = "awk|0|Anywhere I can throw a hook";

  same([await tileOf("Body"), await tileOf("Mind"), await tileOf("Soul")], ["8 steps · d12 + d4", "4 steps · d8", "nothing yet · a d2"], "her three Roots as tiles");
  same([await track("stamina"), await track("confidence"), await track("resolve"), await aura()], ["d12", "d12", "d12", "7/7"], "her tracks and Aura to start with");
  same(await page.$$eval(".tile-again", (els) => els.length), 0, "no Again till she's rolled");

  // Her lock in four taps: her Body, pick a mechanical lock (its Title comes
  // with it), know how a lock's built (and the Guild), and her picks. That's
  // 13 steps, two d12s and a d2, and all of it plainly fits, so it's free.
  let taps = 0;
  const tap = async (sel) => { await page.click(sel); taps += 1; };
  await tap(rootTile("Body"));
  has(await live(), "8 steps, d12 + d4", "her Body on its own");
  same(await page.$$eval("#cc-dialog .cc-pick-h", (els) => els.map((e) => e.textContent)), ["Built your Body", "The rest of your sheet"], "what built her Body first");
  await tap(chip(LOCK));
  has(await live(), "10 steps, d12 + d8", "pick a mechanical lock, bringing her first Title with it");
  same(await chipIs("title|0"), "in", "her first Title in with its permission");
  await tap(chip(BUILT));
  has(await live(), "12 steps, 2d12", "know how a lock’s built, bringing the Guild with it");
  await tap(chip(PICKS));
  has(await live(), "13 steps, 2d12 + d2", "her picks");
  if (taps > 4) note(`Vesk's lock took ${taps} taps before Roll, wanted about four`);
  same(await page.textContent("#dlg-title"), "Body, pick a mechanical lock and 4 more", "the roll named for what it's for");
  same(await page.$$eval("#cc-dialog .cc-costs", (els) => els.length), 0, "everything that plainly fits is free");
  await shot(page, "3-lock");

  // Explaining: a second tap and Shadow's 1 Aura, a third and it's out.
  await use("arch|0");
  has(await live(), "14 steps", "Shadow in, a step");
  await use("arch|0");
  same(await chipIs("arch|0"), "explaining", "a second tap: she's explaining it");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "explaining a thing is 1 Aura");
  has(await live(), "14 steps", "and it's still a step");
  await use("arch|0");
  same(await chipIs("arch|0"), "out", "a third tap takes it out");
  has(await live(), "13 steps", "13 again");
  // Two permissions on one Title: the Title stays while either's in, and goes
  // with the last of them.
  await use(UNSEEN);
  has(await live(), "14 steps", "move unseen as well, her first Title in already");
  await use(LOCK);
  await use(LOCK);
  same([await chipIs(LOCK), await chipIs("title|0")], ["out", "in"], "the lock out, and her first Title still in with move unseen");
  has(await live(), "13 steps", "13 with move unseen in place of the lock");
  await use(UNSEEN);
  await use(UNSEEN);
  same(await chipIs("title|0"), "out", "her first Title goes with the last thing that brought it in");
  has(await live(), "11 steps", "her Body, the Guild, know how a lock’s built and her picks");
  await use(LOCK);
  has(await live(), "13 steps", "the lock back, with her first Title");
  // Her Mind instead: the same things, and what built her Mind first.
  await page.click('#cc-dialog button[data-act="root"][data-v="Mind"]');
  has(await live(), "9 steps, d12 + d6", "her Mind and the same five things");
  same((await page.$$eval("#cc-dialog .cc-pick-h", (els) => els.map((e) => e.textContent)))[0], "Built your Mind", "what built her Mind first");
  // Finding something lights it up.
  await page.fill('#cc-dialog input[data-in="find"]', "rooftops");
  same(await page.$$eval("#cc-dialog .cc-pick.is-lit", (els) => els.map((e) => e.dataset.k)), ["perm|0|1"], "rooftops finds run the rooftops");
  await shut();
  // Nothing that fits: her Soul's nothing yet, and every roll's at least a d2.
  await page.click(rootTile("Soul"));
  has(await live(), "1 step, d2", "her Soul on its own");
  await shut();

  // Over the wall on her grappling line: her Body and the awakening, which
  // brings the line with it, 10 steps, a d12 and a d8, against the guard's
  // d6. Her d12 beats his 4 on a top face, so that's 2 Aura, past her 7 while
  // she's acting.
  await page.click(rootTile("Body"));
  await use(HOOK);
  same(await chipIs("attuned|0"), "in", "the awakening brings her grappling line");
  has(await live(), "10 steps, d12 + d8", "her Body, her grappling line and its awakening");
  await foe(6);
  await page.evaluate(() => window.ziCompanion.setDice([12, 1, 4]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  await shot(page, "3-roll");
  same(await outs(), ["Beat it", "Under"], "her d12 and d8 against the guard's 4");
  has(await body(), "You’ve got 9 Aura, and you’re acting", "a win and a top face, past 7 while she's acting");
  await done();
  same(await aura(), "9/7", "Aura past 7 on her turn");
  has(await page.textContent('.cc-stat[data-p="aura"] .k'), "while acting", "the Aura says she's acting");
  has(await again(), "Body, Anywhere I can throw a hook and 1 more", "Again with the last roll's picks");
  has(await again(), "10 steps, d12 + d8 · last time 1 of 2 beat it, against 4", "and how it went");
  await page.click('.cc-stat[data-p="aura"]');
  has(await page.textContent("#cc-panel"), "I’ve finished acting: 2 goes", "Aura's panel while she's acting");
  await page.click('#cc-panel button[data-act="acting"][data-v="0"]');
  same(await aura(), "7/7", "anything over 7 goes once she's finished acting");
  await page.click('.cc-stat[data-p="aura"]');
  // Again is the same picks in one tap.
  await page.click(".tile-again");
  same([await chipIs(HOOK), await chipIs("attuned|0"), await chipIs(LOCK)], ["in", "in", "out"], "Again puts the same things in");
  has(await live(), "10 steps, d12 + d8", "Again's steps");
  same((await page.$$eval("#cc-dialog .cc-pick-h", (els) => els.map((e) => e.textContent)))[1], "Used with your Body before", "what she's used with her Body before comes next");
  await shut();

  // A reload keeps it, and so does no signal once the service worker's got
  // the site.
  await page.reload();
  await page.waitForSelector(".tile[data-r]");
  same(await aura(), "7/7", "Aura after a reload");
  has(await again(), "against 4", "the last roll after a reload");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-r]", { timeout: 10000 }).catch(() => note("the play screen didn't open offline"));
  same(await tileOf("Body"), "8 steps · d12 + d4", "her Body offline");
  await page.click('.cc-stat[data-p="stamina"]');
  await page.click('#cc-panel [popovertarget="tip-pa-stamina"]');
  same(await page.$eval("#tip-pa-stamina", (el) => el.matches(":popover-open")), true, "the tracks' ? opens on a tap, offline");
  has(await page.textContent("#tip-pa-stamina"), "every hit that gets through", "the tracks' rule in it");
  await page.keyboard.press("Escape");
  await page.click('.cc-stat[data-p="stamina"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button.cc-perm:has-text("move unseen")');
  has(await page.textContent("#cc-dialog"), "A permission on", "a permission on a tap, offline");
  await done();
  await page.click('.cc-tabs a[data-t="rules"]');
  for (const [title, want] of [["Defend", "Defend"], ["Intercept", "1 Aura"], ["The Tracks", "d12"], ["Aura", "past your maximum"]]) {
    const box = page.locator(".cc-rulebox", { has: page.locator(`summary:text-is("${title}")`) });
    if (!(await box.count())) note(`no ${title} on the Rules tab`);
    else {
      await box.first().locator("summary").click();
      has(await box.first().textContent(), want, `${title} on the Rules tab, offline`);
    }
  }
  await page.click('.cc-tabs a[data-t="play"]');
  await page.goto(`${BASE}/rules/the-core/`);
  has(await page.textContent("h1"), "The Core", "a rules page offline");
  await page.goBack();
  await page.waitForSelector(".tile[data-r]");
  await context.setOffline(false);

  // A knife fight: fight dirty with a knife (and the Guild) and her knife,
  // 11 steps. A tie, won for 1 Aura, pays nothing back. Then a split: the same
  // 11 steps as three dice.
  await page.click(rootTile("Body"));
  for (const k of KNIFE) await use(k);
  has(await live(), "11 steps, d12 + d10", "her knife fight");
  await foe(8);
  await page.evaluate(() => window.ziCompanion.setDice([5, 1, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  same(await outs(), ["Tie", "Under"], "her 5 against their 5");
  await page.click('#cc-dialog button[data-act="win-tie"][data-i="0"]');
  same(await outs(), ["Tie, won for 1 Aura", "Under"], "the tie won");
  has(await body(), "You’ve got 6 Aura", "a tie won for 1 Aura, and nothing back for it");
  await done();
  same(await aura(), "6/7", "Aura after winning the tie");
  await page.click('button[data-act="undo"]');
  same(await aura(), "7/7", "Undo takes the tie back off");
  await page.click(".tile-again");
  await page.click('#cc-dialog details[data-open="rc-dice"] > summary');
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  same(await page.$$eval("#cc-dialog .cc-dice .zd-die", (els) => els.length), 3, "her knife fight split into three dice");
  has(await live(), "11 steps", "a split's the same steps");
  await shut();

  // Two guards at once, their d8 and their d6, with an extra action bought
  // for 3 Aura: 12 steps, two d12s, one at each. Both win, and a top face, so
  // that's 3 Aura back. The next extra action's 4 till she's finished acting.
  await page.click(".tile-again");
  has(await page.textContent('#cc-dialog button[data-act="x-add"]'), "An extra action in it: 3 Aura", "an extra action's 3 Aura");
  await page.click('#cc-dialog button[data-act="x-add"]');
  has(await page.textContent('#cc-dialog button[data-act="x-add"]'), "Another extra action in it: 4 Aura", "the next one's 4");
  has(await page.textContent("#cc-dialog .cc-costs"), "3 Aura", "this one's 3");
  has(await live(), "12 steps, 2d12", "an extra action's a step");
  await foe(8);
  await foe(6);
  same(await page.$$eval('#cc-dialog button[data-act="aim"][aria-pressed="true"]', (els) => els.map((e) => `${e.dataset.i} at ${e.dataset.j}`)), ["0 at 0", "1 at 1"], "a die at each guard");
  has(await live(), "against their d8 and their d6", "both guards in the head");
  await shot(page, "3-two");
  await page.evaluate(() => window.ziCompanion.setDice([12, 7, 5, 6]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  same(await outs(), ["Beat it", "Beat it"], "her 12 and 7 against their 5 and 6");
  same(await page.$$eval("#cc-dialog .res-at", (els) => els.map((e) => e.textContent)), ["at their d8", "at their d6"], "each die says what it was at");
  has(await body(), "2 dice won and a top face, so 3 Aura", "both guards beaten and a top face");
  await done();
  same(await aura(), "7/7", "3 Aura for the extra action and 3 back");
  has(await again(), "last time 2 of 2 won, against 5 and 6", "the last roll against both");
  await page.click(rootTile("Body"));
  has(await page.textContent('#cc-dialog button[data-act="x-add"]'), "An extra action in it: 4 Aura", "the next extra action's 4 this round");
  await shut();
  await page.click('.cc-stat[data-p="aura"]');
  has(await page.textContent("#cc-panel"), "The next extra action’s 4 Aura", "and Aura's panel says so");
  await page.click('#cc-panel button[data-act="acting"][data-v="0"]');
  has(await page.textContent("#cc-panel"), "The next extra action’s 3 Aura", "back to 3 once she's finished acting");
  await page.click('.cc-stat[data-p="aura"]');

  // Bringing something in: the chandelier is 1 Aura and a step.
  await page.click(rootTile("Body"));
  await page.click('#cc-dialog details[data-open="bring"] > summary');
  await page.click('#cc-dialog button[data-act="step"][data-n="other"][data-d="1"]');
  has(await live(), "9 steps", "the chandelier brought in");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "bringing something in costs 1 Aura");
  await shut();

  // Her Shadow's Push: +3 on a die, since she's a Shadow twice, paid with 1
  // Stamina off her home track.
  await page.click(rootTile("Body"));
  await use(UNSEEN);
  has(await live(), "10 steps, d12 + d8", "move unseen, with her first Title");
  await foe(10);
  await page.evaluate(() => window.ziCompanion.setDice([7, 1, 9]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  same(await outs(), ["Under", "Under"], "her 7 and 1 against their 9");
  await page.click('#cc-dialog button[data-act="push"]');
  await page.click('#cc-dialog button[data-act="pick"][data-i="0"]');
  const ways = await page.$$eval('#cc-dialog button[data-act="push-pay"]', (els) => els.map((e) => e.textContent));
  same(ways[0], "1 Stamina", "the Push paid off her home track first");
  has(ways.join(" | "), "1 Confidence and 1 Resolve", "or 2 for 1 off her other two");
  await page.click('#cc-dialog button[data-act="push-pay"]');
  same(await outs(), ["Beat it", "Under"], "her 7 and 3 more beats their 9");
  has(await body(), "Stamina d10", "the Push paid with 1 Stamina");
  await done();
  same(await track("stamina"), "d10", "her Stamina after the Push");

  // Her shadow pool: getting into hiding puts the dice she hid with in it,
  // and a later roll takes one as steps (a d12's 6) and one as its own die.
  await page.click(".tile-again");
  await foe(6);
  await page.evaluate(() => window.ziCompanion.setDice([8, 2, 3]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  await page.click('#cc-dialog button[data-act="hid"]');
  has(await body(), "your d12 and d8 go in your shadow pool", "the dice she hid with going in her pool");
  await done();
  has(await page.textContent(".cc-pool"), "d12 and d8. Add them to any roll from the roll card", "her shadow pool on the play screen");
  await page.click(rootTile("Body"));
  for (const k of [LOCK, BUILT, PICKS]) await use(k);
  await page.click('#cc-dialog button[data-act="pool"][data-i="0"][data-v="steps"]');
  await page.click('#cc-dialog button[data-act="pool"][data-i="1"][data-v="die"]');
  has(await live(), "19 steps", "her lock with the shadow d12 as 6 steps");
  same(await page.$$eval("#cc-dialog .cc-dice .zd-die", (els) => els.map((el) => el.dataset.d)), ["12", "12", "12", "2", "8"], "19 steps as three d12s and a d2, and the shadow d8 on its own");
  await foe(6);
  await page.evaluate(() => window.ziCompanion.setDice([5, 4, 3, 1, 2, 2]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  has(await body(), "Used your shadow d12 as 6 steps and shadow d8", "the shadow dice used");
  await done();
  has(await page.textContent(".cc-pool"), "shadow pool’s empty", "her pool empty once it's used");
  console.log(`Vesk: her lock in ${taps} taps, explaining, finding, a top face past 7, Again, a reload, offline, a tie won, Undo, a split, two guards and an extra action, bringing something in, a Push and her shadow pool`);
  await context.close();
}

// The pieces both these parts use: a character's trackers, the dialog and its
// dice, and When it lands.
function tableOf(page) {
  const t = {
    aura: () => page.textContent('.cc-stat[data-p="aura"] .v'),
    track: (k) => page.textContent(`.cc-stat[data-p="${k}"] .v`),
    tracks: () => page.$$eval(".cc-track .is-trk .v", (els) => els.map((e) => e.textContent)),
    closed: () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open),
    body: () => page.textContent("#cc-dialog .dlg-body"),
    outs: () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)),
    rolled: () => page.waitForSelector("#cc-dialog .res .res-out"),
    // What each telegraph did, once When it lands has rolled.
    hits: () => page.$$eval("#cc-dialog li.cc-hit", (els) => els.map((el) => (el.classList.contains("is-stopped") ? "Stopped" : "Gets through"))),
    landed: () => page.waitForFunction(() => [...document.querySelectorAll("#cc-dialog li.cc-hit")].some((li) => /Stopped by|It got through/.test(li.textContent))),
    done: async () => { await page.click('#cc-dialog .dlg-foot button[data-act="close"]'); await t.closed(); },
    // A tracker's panel, opened (or shut) if it isn't already.
    panel: async (k, open = true) => {
      if ((await page.getAttribute(`.cc-stat[data-p="${k}"]`, "aria-expanded")) !== String(open)) await page.click(`.cc-stat[data-p="${k}"]`);
    },
    // When it lands: each telegraph's die at a Root, then the dice that roll,
    // with Defend's things tapped in by their keys when it was their action.
    lands: async (list, { defend = false, use = [], count = 0, shape = null, dice = [] } = {}) => {
      await page.click('.tile[data-act="defence"]');
      for (const [d, at] of list) {
        await page.click(`#cc-dialog button[data-act="d-add-at"][data-v="${at}"]`);
        await page.click(`#cc-dialog button[data-act="d-add"][data-v="${d}"]`);
      }
      if (defend) {
        await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
        for (const k of use) await page.click(`#cc-dialog .cc-pick[data-k="${k}"]`);
        for (let i = 0; i < count; i++) await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
        if (shape != null) await page.click(`#cc-dialog button[data-act="shape"][data-i="${shape}"]`);
      }
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
    pay: (what, j = 0, k = "") => page.click(`#cc-dialog button[data-act="d-pay"][data-j="${j}"][data-what="${what}"]${k ? `[data-k="${k}"]` : ""}`),
  };
  return t;
}

// 3c. Bram's armour, and Bram Defending the way the book's example does.
if (part("3c")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await play(page, "bram", "Bram");
  const boxes = (name) => page.$$eval(`#cc-panel button[data-act="box"][data-k="equipment|${name}"]`, (els) => els.map((e) => e.getAttribute("aria-pressed")));
  await t.panel("stamina");
  same([await boxes("plate armour"), await boxes("a shield")], [["false", "false"], ["false"]], "his Fine plate's two boxes and his Common shield's one");
  await t.panel("stamina", false);
  await t.panel("aura");
  has(await page.textContent("#cc-panel"), "You intercept for free", "a Guardian intercepts for free");
  for (let i = 0; i < 3; i++) await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await t.panel("aura", false);
  same(await t.aura(), "4/7", "Bram's Aura after spending 3");

  // The brute's club at Bram on the wall (The Archetypes, Push): a d10 at his
  // Body, and he Defends with his Body, both Titles, hold the line, fight in a
  // shield wall, Guardian, his plate and his shield, 14 steps, two d12s and a
  // d4, with his Stamina's d12. The club comes up 9, and he rolls 7, 6 and 3
  // and his Stamina 4, so it's through, till he pays 1 Stamina for Guardian's
  // Push and makes the 7 a 9. Ties go to him, so it's stopped.
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="10"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  same(await page.$$eval("#cc-dialog .cc-pick.is-in", (els) => els.map((e) => e.dataset.k)), ["equipment|plate armour", "equipment|a shield"], "his armour on his Body in his Defend already");
  for (const k of ["perm|0|0", "perm|1|0", "arch|0"]) await page.click(`#cc-dialog .cc-pick[data-k="${k}"]`);
  has(await page.textContent("#cc-dialog .dlg-head"), "Defend 14 steps, 2d12 + d4", "his Body, both Titles, hold the line, fight in a shield wall, Guardian, his plate and his shield");
  await shot(page, "3c-defend");
  await page.evaluate(() => window.ziCompanion.setDice([4, 7, 6, 3, 9]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await t.landed();
  same(await t.hits(), ["Gets through"], "his 7, 6, 3 and 4 against the club's 9");
  await page.click('#cc-dialog button[data-act="push"]');
  await page.click('#cc-dialog button[data-act="pick"][data-i="1"]');
  same((await page.$$eval('#cc-dialog button[data-act="push-pay"]', (els) => els.map((e) => e.textContent)))[0], "1 Stamina", "his Push off his Stamina");
  await page.click('#cc-dialog button[data-act="push-pay"]');
  same(await t.hits(), ["Stopped"], "the 7 made a 9 ties the club, and ties go to him");
  await t.done();
  same(await t.tracks(), ["d10", "d12", "d12"], "on a d10 of Stamina now");
  same(await t.aura(), "4/7", "nothing back for a die the Push made win");

  // A blow gets through on his tracks alone, and his plate takes it: a box
  // instead of his Stamina dropping. Two more, and the plate and the shield
  // are broken. The next is 2 for 1, off his Confidence and his Resolve.
  await t.lands([[8, "Body"]], { dice: [2, 7] });
  same(await t.hits(), ["Gets through"], "his Stamina's 2 against their 7");
  await t.pay("box", 0, "equipment|plate armour");
  await t.done();
  same(await t.track("stamina"), "d10", "his plate took it, so his Stamina's still d10");
  await t.lands([[10, "Body"]], { dice: [3, 9] });
  await t.pay("box", 0, "equipment|plate armour");
  await t.done();
  await t.lands([[6, "Body"]], { dice: [1, 5] });
  await t.pay("box", 0, "equipment|a shield");
  await t.done();
  await t.panel("stamina");
  same([await boxes("plate armour"), await boxes("a shield")], [["true", "true"], ["true"]], "every box ticked");
  has(await page.textContent("#cc-panel .cc-armour"), "broken", "his plate broken");
  await t.panel("stamina", false);
  await t.lands([[6, "Body"]], { dice: [1, 5] });
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"][data-what="box"]', (els) => els.length), 0, "no box left to take it");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="two"]:has-text("1 Confidence and 1 Resolve")');
  await t.done();
  same(await t.tracks(), ["d10", "d10", "d10"], "2 for 1, off his Confidence and his Resolve");
  // Defending with his plate and shield broken, they're not in it.
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  same(await page.$$eval("#cc-dialog .cc-pick.is-in", (els) => els.length), 0, "nothing broken in his Defend");
  has(await page.textContent("#cc-dialog .dlg-head"), "Defend 7 steps", "his Defend with his armour broken");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await t.closed();

  // Downtime mends his plate: every box clear.
  await page.click('button[data-act="downtime"]');
  await page.click('#cc-dialog button[data-act="dt"][data-do="pick"][data-s="0"][data-v="mend"]');
  await page.click('#cc-dialog button[data-act="dt"][data-do="set"][data-s="0"][data-f="key"][data-v="equipment|plate armour"]');
  await t.finish();
  await t.panel("stamina");
  same([await boxes("plate armour"), await boxes("a shield")], [["false", "false"], ["true"]], "his plate mended in downtime, his shield still broken");
  await t.panel("stamina", false);
  same(await t.tracks(), ["d12", "d12", "d12"], "every track up a size in downtime");
  console.log("Bram: the book's Defend with his Push, his plate and shield taking blows and breaking, 2 for 1, and his plate mended");
  await context.close();
}

// 3d. Built characters at the table: Bram from the crew, saved as his own,
// plays the chapter's numbers and barks an order, a random character plays
// its Roots, Vesk built with a Toughness Boon has it take the first hit When
// it lands, and a Gambler flips their die for free and every one of his for
// Double or nothing.
if (part("3d")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  const put = (id, name, build) => page.evaluate(([id, name, build]) => {
    const list = JSON.parse(localStorage.getItem("zi-characters") ?? "null") ?? { v: 1, characters: [] };
    list.characters.push({ id, crew: "own", name, hash: "own", build, state: {} });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  }, [id, name, build]);
  const open = async (id) => {
    await page.goto(`${BASE}/characters/?c=${id}`);
    await page.waitForSelector(".tile[data-r]");
  };
  const tiles = () => page.$$eval(".cc-roots .tile[data-r]", (els) => els.map((el) => `${el.dataset.r} ${el.querySelector(".tile-steps").textContent}`));
  const want = (c) => ROOTS.map((r) => `${r} ${c.roots[r] ? `${c.roots[r]} ${c.roots[r] === 1 ? "step" : "steps"}` : "nothing yet"}`);
  const chip = (k) => page.click(`#cc-dialog .cc-pick[data-act="use"][data-k="${k}"]`);
  const live = () => page.textContent("#cc-dialog .cc-dice");
  await page.goto(`${BASE}/characters/`);

  // Bram from the crew, saved as his own: his order is his Soul, bark an
  // order that gets obeyed (his second Title with it) and Leader, 6 steps.
  const bram = book.crew.find((c) => c.id === "bram");
  await put("own-bram", "Bram", fromCrew(bram, BUILD));
  await open("own-bram");
  same(await tiles(), want(rootsSheet(bram, [], BUILD)), "Bram from the crew, saved and played");
  await page.click('.cc-roots .tile[data-r="Soul"]');
  await chip("perm|1|1");
  await chip("arch|1");
  same(await page.$eval('#cc-dialog .cc-pick[data-k="arch|1"]', (el) => el.textContent.trim()), "Leader", "his Leader chip");
  has(await live(), "6 steps, d12", "his order: his Soul, his second Title, the order and Leader");
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 4]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  same(await t.outs(), ["Beat it"], "his 9 against the guard's 4");
  await t.done();

  // A random one saves and plays: its three Roots, and a roll on its biggest.
  const rand = randomBuild(BUILD, book.crew);
  await put("own-rand", rand.name || "Random", rand);
  await open("own-rand");
  const rc = rootsSheet(sheetOf({ id: "own-rand", name: rand.name, build: rand }, BUILD), [], BUILD);
  same(await tiles(), want(rc), "a random character's three Roots on the play screen");
  const big = ROOTS.reduce((a, r) => (rc.roots[r] > rc.roots[a] ? r : a), "Body");
  await page.click(`.cc-roots .tile[data-r="${big}"]`);
  await page.click("#cc-dialog .cc-picks .cc-pick.k-title");
  has(await live(), `${rc.roots[big] + 1} steps`, "its biggest Root and a Title");
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="4"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 3, 3, 2]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  await t.done();

  // Vesk built with a Toughness Boon on her first Title: it takes the first
  // hit this scene, and her Stamina stays put.
  const vesk = fromCrew(book.crew.find((c) => c.id === "vesk"), BUILD);
  vesk.titles[0].boons = [{ lever: "Toughness", name: "Iron Lungs", on: "" }];
  await put("own-iron", "Vesk", vesk);
  await open("own-iron");
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add-at"][data-v="Body"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([2, 7]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await t.landed();
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="tough"]');
  has(await page.textContent("#cc-dialog .cc-paid"), "Iron Lungs took it, and your Stamina stayed put", "her Toughness Boon taking the hit");
  same(await page.$$eval('#cc-dialog button[data-what="tough"]', (els) => els.length), 0, "Iron Lungs used for the scene");
  await t.done();
  same(await t.track("stamina"), "d12", "her Stamina where it was");

  // A Gambler flips a die once a round for free, theirs or yours, and pays a
  // size of Confidence for Double or nothing, flipping every die of theirs.
  const gil = fromCrew(bram, BUILD);
  gil.archs = ["Gambler", "Leader"];
  gil.have = [["Double or nothing"], ["Push"]];
  gil.name = "Gil";
  await put("own-gil", "Gil", gil);
  await open("own-gil");
  await page.click('.cc-roots .tile[data-r="Body"]');
  await chip("perm|0|0");
  has(await live(), "9 steps, d12 + d6", "his Body, his first Title and hold the line");
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="10"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 3, 7]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  await page.click('#cc-dialog button[data-act="flip"]');
  await page.click('#cc-dialog .cc-them button[data-act="pick"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped their d10, so it’s a 4 now", "their 7 on a d10 flipped to a 4");
  same(await t.outs(), ["Beat it", "Under"], "his 9 beating their flipped 4, and his 3 still under");
  same(await page.$$eval('#cc-dialog button[data-act="flip"]', (els) => els.length), 0, "the free flip used on this roll");
  if (!(await page.$eval('#cc-dialog details[data-open="abil"]', (d) => d.open))) await page.click('#cc-dialog details[data-open="abil"] > summary');
  await page.click('#cc-dialog .cc-how button[data-act="ability"]:has-text("Double or nothing")');
  await page.click('#cc-dialog button[data-act="pay-way"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped every die of yours", "Double or nothing flipping every die");
  same(await page.$$eval("#cc-dialog .res-note", (els) => els.map((e) => e.textContent).filter((x) => x === "Flipped").length), 2, "both dice marked flipped, so neither pays");
  await t.done();
  console.log("built: Bram from the crew played and his order, a random one played, a Toughness Boon taking the first hit, and a Gambler's flips");
  await context.close();
}

// 4. The tracks. Vesk's Stamina down to a Blaze and a Scar, the rest at the
// end of a scene, an ability paid in sizes, 2 for 1, her grappling line
// powered, and Dorrie's Confidence against a lie and Isolde's Resolve against
// a curse.
if (part("4")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await play(page, "vesk", "Vesk");
  await t.panel("stamina");
  for (let i = 0; i < 5; i++) await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
  same(await t.track("stamina"), "d2", "five hits take her Stamina to d2");
  has(await page.textContent(".cc-stat.t-stamina"), "next hit Blazes", "the next one Blazes");
  // An ability never takes a track below its smallest size, so Vanish is
  // 2 for 1 now.
  await page.click('main button[data-act="ability"]');
  const ways = await page.$$eval('#cc-dialog button[data-act="pay-way"]', (els) => els.map((e) => e.textContent));
  same(ways.some((w) => /^1 Stamina/.test(w)), false, "nothing left to pay with on her Stamina");
  has(ways.join(" | "), "1 Confidence and 1 Resolve", "Vanish paid 2 for 1");
  await page.click('#cc-dialog button[data-act="pay-way"]:has-text("1 Confidence and 1 Resolve")');
  await t.closed().catch(() => {});
  if (await page.isVisible("#cc-dialog")) await page.click('#cc-dialog button[data-act="close"]');
  same(await t.tracks(), ["d2", "d10", "d10"], "Vanish off her Confidence and her Resolve");
  // A Blaze, and the Scar it leaves: written in as a Catch, locking her d2.
  await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
  await page.waitForSelector('form[data-form="scar"]');
  has(await page.textContent('form[data-form="scar"]'), "You Blaze, at your Stamina", "her Blaze");
  await page.fill('form[data-form="scar"] input', "a spear through the shoulder");
  await page.click('form[data-form="scar"] button[type="submit"]');
  same(await page.$$eval(".cc-stat.t-stamina .zd-scars i.on", (els) => els.length), 1, "one Scar on her Stamina");
  same(await t.track("stamina"), "d4", "her Stamina on its smallest open size once the Scar's locked her d2");
  await t.panel("stamina");
  has(await page.textContent("#cc-panel"), "a spear through the shoulder", "her Scar as a Catch");
  has(await page.textContent("#cc-panel"), "locking d2", "the Scar locks her d2");
  await t.panel("stamina", false);

  // The end of the scene: her Stamina d4 and her Confidence and Resolve d10
  // roll, and a 4 or more puts each up a size. Her Aura's full again.
  await t.panel("aura");
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await t.panel("aura", false);
  await page.click('button[data-act="scene"]');
  has(await t.body(), "your Stamina d4, your Confidence d10 and your Resolve d10", "the rest roll");
  await page.evaluate(() => window.ziCompanion.setDice([4, 2, 9]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  await page.waitForSelector('#cc-dialog button[data-act="rest-done"]:not([disabled])');
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await t.closed();
  same(await t.tracks(), ["d6", "d10", "d12"], "a 4 and a 9 go up, a 2 stays");
  same(await t.aura(), "7/7", "Aura full for the new scene");

  // Her grappling line: powering its awakening takes the Aura off what she's
  // got and off her maximum, and it's +1 a die for each Aura powering it when
  // she uses it. The new scene lets it go, and her maximum's back.
  await page.click('main button[data-act="power"]');
  await page.click('main button[data-act="power"]');
  same(await t.aura(), "5/5", "2 Aura powering her grappling line, off her Aura and her maximum");
  has(await page.textContent("main .cc-held"), "2/2", "her grappling line powered with 2");
  has(await page.textContent("main .cc-held"), "Your maximum’s 5 till the scene ends", "and it says what her maximum is");
  await page.click('.cc-roots .tile[data-r="Body"]');
  await page.click('#cc-dialog .cc-pick[data-k="awk|0|Anywhere I can throw a hook"]');
  await page.click('#cc-dialog button[data-act="foe-add"][data-v="10"]');
  await page.evaluate(() => window.ziCompanion.setDice([7, 2, 8]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  same(await t.outs(), ["Under", "Under"], "her 7 against their 8");
  await page.click('#cc-dialog button[data-act="wakeplus"]');
  await page.click('#cc-dialog button[data-act="pick"][data-i="0"]');
  same(await t.outs(), ["Beat it", "Under"], "+2 from her grappling line on the 7");
  await t.done();
  has(await page.textContent("main .cc-held"), "2/2", "using it doesn't empty it");
  same(await t.aura(), "5/5", "no Aura for a die her line added to after she rolled");
  await page.click('button[data-act="scene"]');
  if (await page.isVisible("#cc-dialog")) {
    await page.evaluate(() => window.ziCompanion.setDice([1, 1, 1]));
    await page.click('#cc-dialog button[data-act="rest-go"]');
    await page.waitForSelector('#cc-dialog button[data-act="rest-done"]:not([disabled])');
    await page.click('#cc-dialog button[data-act="rest-done"]');
    await t.closed();
  }
  has(await page.textContent("main .cc-held"), "0/2", "the new scene lets her grappling line go");
  same(await t.aura(), "7/7", "and her Aura and its maximum are full");
  // 2 for 1 on a hit: her Confidence and Resolve pay, and her Stamina stays.
  await t.panel("stamina");
  await page.click('#cc-panel button[data-act="two"][data-t="stamina"]:has-text("1 Confidence and 1 Resolve")');
  await t.panel("stamina", false);
  same((await t.tracks())[0], "d6", "her Stamina stays put on 2 for 1");

  // Dorrie's lie: a d8 at her Mind, and her Confidence rolls. It gets
  // through, and her court clothes fit the scene, so they take it.
  await play(page, "dorrie", "Dorrie");
  await t.lands([[8, "Mind"]], { dice: [3, 6] });
  has(await t.body(), "Confidence d12", "her Confidence against the lie");
  same(await t.hits(), ["Gets through"], "her 3 against their 6");
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"][data-what="box"]', (els) => els.map((e) => e.textContent.trim())), ["Your court clothes take it: tick a box, when they fit the scene"], "her court clothes on her Mind");
  await t.pay("hit");
  await t.done();
  same(await t.tracks(), ["d12", "d10", "d12"], "Dorrie's Confidence down a size");
  // Isolde's curse: a d10 at her Soul, and a hit at her smallest size Blazes.
  await play(page, "isolde", "Isolde");
  await t.panel("resolve");
  await page.click('#cc-panel button[data-act="track-set"][data-t="resolve"][data-v="2"]');
  await t.panel("resolve", false);
  await t.lands([[10, "Soul"]], { dice: [1, 7] });
  has(await t.body(), "Resolve d2", "her Resolve against the curse");
  await t.pay("hit");
  await t.done();
  await page.waitForSelector('form[data-form="scar"]');
  has(await page.textContent('form[data-form="scar"]'), "at your Resolve", "Isolde Blazes at her Resolve");
  await page.click('form[data-form="scar"] button[data-act="die"]');
  has(await page.textContent("main"), "died", "Isolde dies, her call");
  console.log("tracks: Vesk down to a Blaze and a Scar, an ability 2 for 1, the rest, her grappling line, Dorrie's Confidence and Isolde's Resolve");
  await context.close();
}

// 4b. Saved before the Roots change. One of the crew moves onto Roots, and on
// to stacking, with her Scars on her Stamina and her old growth waiting to go
// back on, and a character built on the phone shows as it was till the
// builder rebuilds it.
if (part("4b")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  await page.goto(`${BASE}/characters/`);
  const vesk = book.crew.find((c) => c.id === "vesk");
  const old = { v: 1, characters: [
    { id: "old-vesk", crew: "vesk", name: "Old Vesk", hash: "old", state: { aura: 3, resolve: 1, conf: 6, wound: 4, scars: ["a burn across the back"], blaze: false, dead: false, conditions: [{ name: "Burning", die: 6, kind: "against" }], threads: { "Dorrie|We have pulled a dozen jobs. I trust her with my life.": "strained" }, crossed: {}, picked: [], asp: 6, aspText: "", notes: "Owes the fence", boxes: {},
      grown: [{ k: "perm", t: 0, text: "slip through any crowd", on: ["Sneak"] }, { k: "thread", person: "Wren", text: "She owes me a drink.", kind: "bond" }, { k: "title", arch: "Leader", text: "Captain of the crew", on: ["Talk"], perm: "know who’s lying in my crew", permOn: ["Study"] }, { k: "trait", name: "Silent Step" }] } },
    { id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a sword", on: ["Fight"] }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [{ person: "Dorrie", text: "She owes me.", kind: "hostile", whose: "" }], connect: [], aspiration: "Run the docks", name: "Tamsin", pronoun: "her" },
      state: { aura: 4, resolve: 2, conf: 8, wound: 2, scars: [], conditions: [], threads: {}, notes: "" } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(old));
  await page.goto(`${BASE}/characters/?c=old-vesk`);
  await page.waitForSelector(".tile[data-r]");
  has(await page.textContent(".cc-note"), "on the new rules", "the note that she's moved onto Roots");
  has(await page.textContent(".cc-moved"), "Every roll’s a Root and everything on her sheet that fits", "and what's new, in a line");
  same(await page.$$eval(".cc-stat.t-stamina .zd-scars i.on", (els) => els.length), 1, "her old Scar on her Stamina");
  same(await t.tracks(), ["d12", "d12", "d12"], "her tracks fresh on Roots");
  await t.panel("stamina");
  has(await page.textContent("#cc-panel"), "a burn across the back", "her old Scar, a Catch on her Stamina");
  has(await page.textContent("#cc-panel"), "locking d2", "and locking her d2");
  await t.panel("stamina", false);
  has(await page.textContent(".cc-stat.t-cond"), "Burning", "her conditions kept");
  await page.click('button[data-act="moved"]');
  same(await page.$$eval('button[data-act="moved"]', (els) => els.length), 0, "Got it puts the note away");
  await page.click('.cc-tabs a[data-t="sheet"]');
  has(await page.textContent("main"), "slip through any crowd", "her old permission waiting to go back on");
  has(await page.textContent("main"), "Captain of the crew", "her old Title waiting to go back on");
  same(await page.inputValue("#cc-notes"), "Owes the fence", "her notes kept");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === "old-vesk").state);
  same([st.v, st.scars?.stamina?.length, "conf" in st, "wound" in st, st.threads["Dorrie|We have pulled a dozen jobs. I trust her with my life."]], [3, 1, false, false, "strained"], "her state saved on stacking, her strained thread kept");
  has(await page.textContent(".cc-before"), "old traits don’t come across", "her old trait, to let go");
  // Her old permission goes back on free, on the Root it fits: her Body goes
  // up 1. Her old Title she lets go.
  const back = 'form[data-form="putback"]:has(button[data-act="letgo"])';
  same(await page.$$eval(`.cc-before input[name="spec"]`, (els) => els.length), 0, "no specialty to put it back on");
  await page.selectOption(`.cc-before li:has-text("slip through any crowd") ${back} select[name="root"]`, "Body");
  await page.click(`.cc-before li:has-text("slip through any crowd") ${back} button[type="submit"]`);
  await page.click('.cc-before li:has-text("Captain of the crew") button[data-act="letgo"]');
  await page.click('.cc-before li:has-text("Silent Step") button[data-act="letgo"]');
  same(await page.$$eval(".cc-before", (els) => els.length), 0, "nothing left waiting once it's all put back or let go");
  has(await page.textContent("main"), "slip through any crowd", "her permission back on her sheet");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$eval('.cc-roots .tile[data-r="Body"]', (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`), "9 steps · d12 + d6", "her Body with the permission back on");
  await page.click('.cc-roots .tile[data-r="Body"]');
  if (!(await page.$('#cc-dialog .cc-pick[data-act="use"]:has-text("slip through any crowd")'))) note("her old permission isn't on the roll card");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  // Tamsin was built on the phone, so she's shown as she was.
  await page.goto(`${BASE}/characters/?c=own-old`);
  await page.waitForSelector(".cc-before, .cc-note.is-gold");
  has(await page.textContent("main"), "built before the Roots change", "Tamsin's note");
  has(await page.textContent("main"), "Fight", "her set actions as they were");
  has(await page.textContent("main"), "4 steps", "her Fight: the action, her Title, her permission and her sword");
  has(await page.textContent("main"), "The best blade on the docks", "her Title as it was");
  same(await page.$$eval(".tile[data-r]", (els) => els.length), 0, "nothing of hers plays till she's rebuilt");

  // Saved on Roots, before stacking: Vesk with what her sheet said then,
  // 1 Aura held in her grappling line, and Mara, built on the phone with her
  // Title on her Body. Vesk's lines that changed each get a gold mark, with
  // old and new in the note, her held Aura's powering the awakening now, off
  // her maximum, and Mara's Title is hers to spread or keep.
  const roots = { v: 1, characters: [
    { id: "roots-vesk", crew: "vesk", name: "Roots Vesk", hash: "roots", state: { v: 2, aura: 5, acting: false, tracks: { stamina: 12, confidence: 12, resolve: 12 }, scars: { stamina: [], confidence: [], resolve: [] }, conditions: [], threads: {}, crossed: {}, picked: [], asp: 2, aspText: "", notes: "", boxes: {}, store: { "0|Anywhere I can throw a hook": 1 },
      seen: { "num:aura": "Aura 5", "root:Body": "Body 5", "root:Mind": "Mind 3", "title:0": "The best cat burglar in the city (Body; Stealth, Climbing, Locks)", "perm:0:1": "run the rooftops (Body, Climbing)", "spec:Locks": "Locks 4" } } },
    { id: "roots-mara", crew: "own", name: "Mara", hash: "mara", build: { v: 3, archs: ["Warrior"], titles: [{ idea: "", text: "The best blade on the docks", root: "Body", specs: ["Blades", "", ""], perms: [{ text: "fight with a sword", root: "Body", spec: "Blades" }], boons: [] }], equipment: [{ text: "a sword", arm: "" }], utility: [], keepsake: { text: "" }, bag: "", attuned: [], threads: [{ person: "Dorrie", text: "She owes me.", kind: "hostile", whose: "" }], connect: [], aspiration: "Run the docks", name: "Mara", pronoun: "her", blurb: "", trouble: [] },
      state: { v: 2, aura: 5, tracks: { stamina: 12, confidence: 12, resolve: 12 }, scars: { stamina: [], confidence: [], resolve: [] }, conditions: [], threads: {}, crossed: {}, picked: [], asp: 2, notes: "", boxes: {}, store: {} } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(roots));
  await page.goto(`${BASE}/characters/?c=roots-vesk`);
  await page.waitForSelector(".tile[data-r]");
  has(await page.textContent(".cc-moved"), "Roots Vesk’s on the new rules", "the note that she's moved onto stacking");
  has(await page.textContent(".cc-moved"), "lines on her sheet changed, each with a gold mark", "how many lines changed");
  await page.click('.cc-moved details[data-open="g-list"] > summary');
  has(await page.textContent(".cc-golds"), "It was run the rooftops (Body, Climbing), and now it’s run the rooftops (Body).", "a permission's old and new");
  has(await page.textContent(".cc-golds"), "It was Body 5, and now it’s Body 8.", "her Body's old and new");
  has(await page.textContent(".cc-moved"), "Gone from the sheet: Locks 4", "her old specialty gone");
  same(await page.$eval('.cc-roots .tile[data-r="Body"]', (el) => el.classList.contains("is-changed")), true, "a gold mark on her Body tile");
  same(await t.aura(), "5/6", "her held Aura powering her grappling line, off her maximum");
  has(await page.textContent("main .cc-held"), "1/2", "and the awakening says so");
  await page.click('button[data-act="moved"]');
  same(await page.$$eval(".cc-moved, .cc-gold, .tile.is-changed", (els) => els.length), 0, "Got it puts the note and the gold marks away");
  await page.reload();
  await page.waitForSelector(".tile[data-r]");
  same(await page.$$eval(".cc-moved, .cc-gold", (els) => els.length), 0, "and they stay away");
  await page.goto(`${BASE}/characters/?c=roots-mara`);
  await page.waitForSelector(".tile[data-r]");
  has(await page.textContent(".cc-choose"), "The best blade on the docks puts all 3 on her Body, the way it was.", "Mara's Title, hers to spread");
  if (!(await page.$('.cc-choose a.cc-change:has-text("Spread it")'))) note("no Spread it on Mara's Title");
  await page.click('.cc-choose button[data-act="choose"]:has-text("Keep all 3 on Body")');
  same(await page.$$eval('.cc-choose li:has-text("The best blade on the docks")', (els) => els.length), 0, "kept as it is, and gone from what's hers to choose");
  console.log("old saves: Old Vesk on Roots with her Scar, conditions, thread and growth, Tamsin shown as she was, Vesk from before stacking with her gold marks and powering, and Mara's Title to spread");
  await context.close();
}

// A fold in the builder opened, unless it's open already.
const unfold = async (page, key) => {
  if (!(await page.$eval(`details[data-open="${key}"]`, (el) => el.open))) await page.click(`details[data-open="${key}"] > summary`);
};

// What a sheet's made of, for comparing one built on the phone with the
// chapter's: Roots, Titles with their spreads and permissions, archetypes
// with their abilities, points, Aura, armour, attuned things, what's carried
// (the bag by what's in it) and their own threads.
const sheetParts = (c) => ({
  roots: c.roots,
  titles: c.titles.map((t) => [t.text, t.roots, t.permissions.map((p) => [p.text, p.root]), (t.boons ?? []).map((x) => x.lever)]),
  archetypes: c.archetypes.map((a) => [a.name, a.have]),
  points: c.points,
  aura: c.numbers.aura,
  armour: c.armour.map((a) => [a.name, a.root, a.quality, a.boxes]),
  attuned: c.attuned.map((a) => [a.name, a.stage, a.catch, a.awakenings.map((w) => [w.name, w.kind])]),
  carry: [c.carry.equipment, c.carry.utility, c.carry.keepsake, c.carry.bag.items],
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
  // Her first Title off the Rogue idea's cards, all 3 Root points on her Body
  // in a tap, and its permissions with their Roots, one tapped in off the idea.
  await unfold(page, "bd-ideas-0");
  await b('[data-b="idea"][data-t="0"][data-v="k-rogue"]');
  await b('[data-b="title"][data-t="0"][data-v="The best cat burglar in the city"]');
  await b('[data-b="spread"][data-t="0"][data-n="3"][data-v="Body"]');
  await perm(0, 0, "move unseen", "Body");
  await perm(0, 1, "run the rooftops", "Body");
  await b('[data-b="perm"][data-t="0"][data-v="pick a mechanical lock"]');
  same([await page.inputValue("#b-t0-p2"), await pressedOn('[data-b="proot"][data-t="0"][data-j="2"][data-v="Body"]')], ["pick a mechanical lock", "true"], "a permission tapped in off the idea, its Root guessed");
  same(await page.getAttribute('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', "data-d"), "12", "her Body a d12 with her first Title's 3 and its three permissions");
  same(await points(), "18 left, 17 of 35 spent", "a Title's 5 with its first permission, and 1 for each after");
  await next("Titles and permissions");
  same(await page.getAttribute('.bd-seg[data-b="tab"][data-t="1"]', "aria-current"), "true", "Next going on to her second Title");
  // Her second Title spread 2 and 1: Mind 2 and Body 1, in three taps.
  await page.fill("#b-t1-text", "Raised by the Guild");
  await b('[data-b="shape"][data-t="1"][data-v="two"]');
  await b('[data-b="spread"][data-t="1"][data-n="2"][data-v="Mind"]');
  await b('[data-b="spread"][data-t="1"][data-n="1"][data-v="Body"]');
  has(await page.textContent(".bd-title:has(#b-t1-text) .bd-ask"), "Body 1, Mind 2", "her second Title spread");
  // Tapping the 2 onto the Root with the 1 swaps them, and back.
  await b('[data-b="spread"][data-t="1"][data-n="2"][data-v="Body"]');
  has(await page.textContent(".bd-title:has(#b-t1-text) .bd-ask"), "Body 2, Mind 1", "the spread swapped");
  await b('[data-b="spread"][data-t="1"][data-n="2"][data-v="Mind"]');
  await perm(1, 0, "know how a lock’s built", "Mind");
  await perm(1, 1, "fight dirty with a knife", "Body");
  await perm(1, 2, "find a buyer for anything", "Mind");
  same(await points(), "11 left, 24 of 35 spent", "two Titles with three permissions each, 14 points");
  await shot(page, "5-builder-titles");
  await next("Roots");
  // What it adds up to, and where each one comes from.
  const nums = await page.$$eval(".bd-from-list li", (els) => els.map((li) => [li.querySelector(".k").textContent, Number(li.querySelector("b").textContent)]));
  same(nums, ROOTS.map((r) => [r, want.roots[r]]), "the built Vesk's Roots");
  has(await page.textContent(".bd-from-list"), "3 from your first Title, “move unseen”, “run the rooftops”, “pick a mechanical lock”, 1 from your second Title and “fight dirty with a knife”", "where her Body comes from");
  same(await page.$$eval(".tile[data-s], .bd-specs3, [data-b='pspec']", (els) => els.length), 0, "no specialties anywhere");
  has(await page.textContent(".bd-things"), "Shadow", "her archetypes among the things that are a step");
  await next("What you carry");
  // What she carries, a part at a time, her attuned thing first: her
  // grappling line, 5 points, with the awakening it comes with and nothing
  // to write for its own Aura.
  same(await page.getAttribute('.bd-seg[data-v="a"]', "aria-current"), "true", "her attuned thing first");
  same(await page.$$eval('[data-bin$=".aura"]', (els) => els.length), 0, "no Aura of its own to write");
  await page.fill("#b-a0-name", "A grappling line");
  await page.fill("#b-a0-w0-name", "Anywhere I can throw a hook");
  await b('[data-b="awkkind"][data-i="0"][data-j="0"][data-v="passive"]');
  await page.fill("#b-a0-w0-text", "+1 on one die of every roll she makes with it, for each Aura powering it");
  same(await points(), "6 left, 29 of 35 spent", "her grappling line's 5");
  await shot(page, "5-builder-attuned");
  await next("What you carry");
  // Her leathers off a card are armour on her Body, Common with a box, and
  // everything she carries is a point.
  await b('[data-b="fillany"][data-k="e"][data-v="worn leathers"]');
  if ((await pressedOn('[data-b="arm"][data-i="0"][data-v="Body"]')) !== "true") await b('[data-b="arm"][data-i="0"][data-v="Body"]');
  same(await page.$$eval(".bd-quality .bd-qual", (els) => els.map((el) => [el.textContent.trim(), el.getAttribute("aria-pressed"), el.querySelectorAll(".zd-plate").length])), [["Common", "true", 1], ["Fine", "false", 2], ["Masterwork", "false", 3]], "her leathers' quality, Common to start");
  await b('[data-b="arm"][data-i="0"][data-v="Mind"]');
  has(await page.textContent(".bd-arm"), "on your Mind, for your Confidence", "armour moved to her Mind");
  await b('[data-b="arm"][data-i="0"][data-v="Body"]');
  await page.fill("#b-e1", "a knife");
  await page.fill("#b-e2", "soft-soled boots");
  await next("What you carry");
  same(await page.getAttribute('.bd-seg[data-v="u"]', "aria-current"), "true", "Next going on to her utility items");
  await page.fill("#b-u0", "a purse of gold");
  await page.fill("#b-u1", "a smoke bomb");
  await page.fill("#b-u2", "a perfect set of picks");
  await next("What you carry");
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
  for (const n of ["35 of 35 spent, all of them", "Aura 7", "Stride 3"]) has(check, n, "the built Vesk's points and numbers");
  same(await page.$$eval(".bd-nums .k", (els) => els.some((el) => /action/i.test(el.textContent))), false, "no actions a round to count");
  await shot(page, "5-builder-check");
  await b('[data-b="save"]');
  await playing(page);
  const built = (await savedAll(page)).at(-1);
  const drafts = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-drafts") || "{}"));
  same([built.crew, built.name, built.build?.v, built.build?.start, "new" in drafts], ["own", "Vesk", 4, 35, false], "the built Vesk saved on 35 points, and the draft cleared");
  same(JSON.stringify(built.build).includes("spec"), false, "nothing saved about specialties");
  same(sheetParts(sheetFor(built)), sheetParts(want), "the built Vesk against her sheet in the chapter");

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

  // Change her: a Boon instead of two permissions on her first Title, a
  // fourth permission there filling its six slots, and her boots for a
  // Masterwork shield. A saved character keeps everything, even past 35.
  await unfold(page, "bd-boon-0");
  await b('[data-b="boon"][data-t="0"][data-v="Toughness"]');
  await page.fill("#b-t0-b0-name", "Iron Lungs");
  await b('[data-b="addperm"][data-t="0"]');
  await perm(0, 3, "slip a grip", "Body");
  has(await page.textContent(".bd-title:has(#b-t0-text)"), "That’s all six slots", "a Boon and four permissions filling her first Title");
  same(await page.$$eval('[data-b="addperm"][data-t="0"]', (els) => els.length), 0, "no seventh slot to add");
  await page.fill("#b-e2", "");
  await b('[data-b="fillany"][data-k="e"][data-v="shield"]');
  if ((await pressedOn('[data-b="arm"][data-i="2"][data-v="Body"]')) !== "true") await b('[data-b="arm"][data-i="2"][data-v="Body"]');
  await b('[data-b="quality"][data-i="2"][data-v="3"]');
  same(await points(), "38 points on the sheet, 35 to start", "38 points on her sheet now");
  same((await page.textContent(".bd-part:last-of-type")).includes("past the 35"), false, "nothing flagged for being past 35");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const changed = (await savedAll(page)).filter((c) => c.build);
  same(changed.length, 1, "changing her doesn't make a second Vesk");
  const now = sheetFor(changed[0]);
  same([now.titles[0].permissions.length, now.titles[0].boons.map((x) => [x.lever, x.name]), now.armour.map((a) => [a.name, a.quality, a.boxes]), now.points.spent], [4, [["Toughness", "Iron Lungs"]], [["worn leathers", "Common", 1], ["shield", "Masterwork", 3]], 38], "her Boon, her fourth permission and her Masterwork shield");
  same(now.roots, { Body: 9, Mind: 4, Soul: 0 }, "her Body 1 more for her new permission, and nothing for the Boon");

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
    // A Title's 3 Root points going on give its Root a d6 in the dock above
    // the bar, and a permission on the same Root grows it into a d8.
    await jump(1);
    await b('[data-b="spread"][data-t="0"][data-n="3"][data-v="Body"]');
    same(await page.getAttribute('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', "data-d"), "6", `Body a d6 with a Title's 3 on it, ${theme}`);
    await page.fill("#b-t0-p0", "hold the line");
    await b('[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]');
    const grown = await page.$eval('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', (el) => [el.dataset.d, el.classList.contains("is-grown")]);
    same(grown, ["8", !still], `Body a d8 with a permission on it too, ${still ? "swapped straight away under reduce-motion" : "growing into it"}, ${theme}`);
    if (still) same(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length), 0, `nothing moving under reduce-motion, ${theme}`);
    await page.waitForTimeout(400);
    await shot(page, `5b-builder-titles-${theme}`);
    // 1 on each Root is one tap, and 2 and 1 a tap and a Root or two.
    await b('[data-b="shape"][data-t="0"][data-v="each"]');
    same(await page.$$eval(".bd-rail .tile-steps", (els) => els.map((el) => el.textContent)), ["2 steps", "1 step", "1 step"], `1 on each Root, ${theme}`);
    // axe again with things picked: a spread and a permission, an archetype
    // with its ability, a Title idea, a Boon, the points open, and a crew
    // question made into a thread.
    await axe(`a Title with a spread and a permission, ${theme}`);
    await jump(0);
    await b('[data-b="arch"][data-t="0"][data-v="Warrior"]');
    await b(`[data-b="abil"][data-t="0"][data-v="${BUILD.archetypes.find((a) => a.name === "Warrior").abilities[0].name}"]`);
    await axe(`an archetype and its ability picked, ${theme}`);
    await jump(1);
    await unfold(page, "bd-ideas-0");
    await b('[data-b="idea"][data-t="0"][data-v="k-warrior"]');
    await unfold(page, "bd-boon-0");
    await b('[data-b="boon"][data-t="0"][data-v="Stride"]');
    await axe(`a Title idea and a Boon, ${theme}`);
    await page.click(".bd-pts > summary");
    has(await page.textContent(".bd-pts-in"), "the Stride Boon", `the Boon's 2 points in what they went on, ${theme}`);
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
    same([nb.v, nb.have, nb.titles.map((t) => [t.roots, t.from]), nb.stack], [4, [["Push"], ["Vanish"]], [[{ Body: 3, Mind: 0, Soul: 0 }, "Body"], [{ Body: 0, Mind: 3, Soul: 0 }, "Mind"]], true], "a build from before stacking: each Title's 3 on its old Root, and Shadow's abilities dealt between her two");
    same(JSON.stringify(nb).match(/spec|order|"aura"/g), null, "its specialties and its thing's own Aura gone");
    const old = rootsSheet(sheetOf({ id: "5c-old", name: "Vesk", build: OLD }, BUILD), [], BUILD);
    same([old.roots, old.points, old.numbers.aura, RS.choicesOf(old)], [{ Body: 7, Mind: 5, Soul: 0 }, { start: 35, spent: 34 }, 7, [{ k: "spread", t: 0, root: "Body" }, { k: "spread", t: 1, root: "Mind" }, { k: "points", left: 1 }]], "her Roots recounted, her points, Aura 7, and what's hers to choose");
    same(checksOf(nb, BUILD, { changing: true }).map((x) => x.text), ["You’ve got a point left to spend."], "a saved character only told about the point she's got left");
    // Grown past 35, it keeps everything, and nothing's flagged.
    const grown = foldGrown(OLD, [{ k: "perm", t: 0, text: "slip a grip", root: "Body", spec: "Stealth" }, { k: "title", text: "The woman who has never been seen", root: "Body", specs: ["Hiding"], perm: { text: "vanish in a crowd", root: "Body", spec: "Hiding" } }, { k: "arch", arch: "Hunter" }], BUILD);
    same([pointsOf(grown).spent, grown.have, grown.titles[2].roots, checksOf(grown, BUILD, { changing: true }).length], [46, [["Push"], ["Vanish"], ["Push", "Mark the pack"]], { Body: 3, Mind: 0, Soul: 0 }, 0], "what she grew before stacking folded in, 46 points and nothing flagged");
    // From before Roots: each Title's spread the way its permissions lean.
    const tam = normalBuild({ v: 2, titles: [{ arch: "Warrior", text: "The best blade on the docks", perms: [{ text: "fight with a sword", on: ["Fight"] }, { text: "read a fighter’s style", on: ["Study"] }] }], actions: ["Fight", "Study"], equipment: [], utility: [], attuned: [], threads: [] }, BUILD);
    same([tam.titles[0].roots, tam.titles[0].perms.map((p) => p.root), tam.have], [{ Body: 2, Mind: 1, Soul: 0 }, ["Body", "Mind"], [BUILD.archetypes.find((a) => a.name === "Warrior").abilities.map((x) => x.name)]], "a Title from before Roots spread the way its permissions lean, its archetype with every ability");
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
  await setState(page, vesk.id, { aura: 4, tracks: { stamina: 10 } });
  await page.goto(`${BASE}/characters/?build=${encodeURIComponent(vesk.id)}`);
  has(await page.textContent(".bd-head"), "Change anything on her sheet", "changing Vesk from the crew");
  await unfold(page, "bd-boon-1");
  await b('[data-b="boon"][data-t="1"][data-v="Ties"]');
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const mine = (await savedAll(page)).find((c) => c.from === "vesk");
  same([mine.crew, Boolean(mine.build), mine.state.aura, mine.state.tracks?.stamina], ["own", true, 4, 10], "Vesk your own, with her Aura spent and her Stamina hit kept");
  same(await page.$$eval(".cc-gold, .cc-gem", (els) => els.length), 0, "no gold marks on Vesk once she's your own");
  same([sheetFor(mine).roots, sheetFor(mine).titles[1].boons.map((x) => x.lever), sheetFor(mine).points.spent], [rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD).roots, ["Ties"], 37], "her Roots as they were, and the Boon's 2 points");

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
  same([moved.v, moved.stacked, moved.choose, moved.power], [3, true, [{ k: "spread", t: 0, root: "Body" }, { k: "spread", t: 1, root: "Mind" }, { k: "points", left: 1 }], { "0|Anywhere I can throw a hook": 1 }], "moved onto stacking with what's hers to choose, her hook's Aura powering it");
  await page.goto(`${BASE}/characters/?build=own-v3`);
  const told = (await page.textContent(".cc-note.is-gold")).replace(/\s+/g, " ");
  has(told, "Vesk keeps everything since the stacking change. Each Title that was on one Root has all 3 on it, so spread them how you like, and you’ve got 1 point to spend.", "what changed, and what's hers to choose");
  has(await page.textContent(".bd-title:has(#b-t1-text) .bd-was"), "It was all on your Mind, so it still is.", "her second Title on its old Root");
  same(await page.$$eval("[data-b='abil'][aria-pressed='true']", (els) => els.map((el) => `${el.dataset.t}:${el.dataset.v}`)), ["0:Push", "1:Vanish"], "her Shadows keeping Push and Vanish");
  await b('[data-b="shape"][data-t="1"][data-v="two"]');
  await b('[data-b="spread"][data-t="1"][data-n="1"][data-v="Body"]');
  same(await page.$$eval(".bd-title:has(#b-t1-text) .bd-was", (els) => els.length), 0, "spread, it isn't on its old Root any more");
  await page.fill("#b-e2", "soft-soled boots");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const v3 = (await savedAll(page)).find((c) => c.id === "own-v3");
  same([v3.build.v, "stack" in v3.build, v3.build.titles.some((t) => "from" in t), v3.state.choose, v3.state.notes, v3.state.asp], [4, false, false, [], "Owes the fence", 4], "saved on stacking, with nothing left to choose and her play kept");
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
  same(await page.getAttribute('button[data-b="spread"][data-t="0"][data-n="3"][data-v="Body"]', "aria-pressed"), "true", "her Title's 3 Root points guessed from its permission");
  same(await page.getAttribute('button[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]', "aria-pressed"), "true", "her permission's Root guessed from its words");
  await page.click('.bd-foot button[data-b="save"]');
  await playing(page);
  const tam = (await savedAll(page)).find((c) => c.id === "own-old");
  same([tam.build.v, tam.state.v, "before" in tam.state, tam.state.notes, sheetFor(tam).roots], [4, 3, false, "Owes Dorrie", { Body: 4, Mind: 0, Soul: 0 }], "Tamsin saved on stacking, her Body 4 and her notes kept");
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
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "4"], ["aura_max", "7"], ["aura_powering", "2"], ["stride", "3"],
    ["stamina", "d4"], ["confidence", "d12"], ["resolve", "d12"], ["stamina_scar_2", true], ["stamina_scar_4", false], ["scar_1", "a burn across the back (Stamina)"],
    ["stamina_armour_1", "Common worn leathers"], ["stamina_armour_1_box_1", false],
    ["root_body", "8"], ["root_body_title_1", "3"], ["root_body_title_2", "1"], ["root_body_permissions", "4"], ["root_mind", "4"], ["root_mind_title_1", ""], ["root_mind_title_2", "2"], ["root_mind_permissions", "2"], ["root_soul", "0"], ["root_soul_permissions", ""],
    ["points_spent", "35"], ["points_start", "35"], ["points_banked", ""],
    ["aspiration", "Own the score of a lifetime"], ["aspiration_die", "d2"],
    ["equipment_1", "Common worn leathers"], ["equipment_2", "a knife"], ["utility_2", "a smoke bomb (used)"], ["keepsake", "the first coin she ever stole"],
    ["title_1", "The best cat burglar in the city"], ["title_1_body", "3"], ["title_1_mind", ""], ["title_1_permission_1", "move unseen"], ["title_1_permission_1_root", "body"],
    ["title_2", "Raised by the Guild"], ["title_2_body", "1"], ["title_2_mind", "2"], ["title_2_permission_2", "fight dirty with a knife"], ["title_2_permission_2_root", "body"], ["title_2_permission_3_root", "mind"],
    ["archetype_1", "Shadow, twice"], ["archetype_1_track", "stamina"], ["archetype_2", ""],
    ["attune_1_thing", "A grappling line"], ["attune_1_stage", "awakened"], ["attune_1_awakening_1_kind", "passive"], ["attune_1_awakening_1_aura_1", true], ["attune_1_awakening_1_aura_2", true], ["attune_2_thing", ""],
    ["bond_1", "Dorrie"], ["bond_1_thread_1", "We have pulled a dozen jobs. I trust her with my life."], ["bond_1_thread_1_kind", "bond"], ["bond_1_thread_1_strained", true], ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"]], "Vesk");
  same([f.get("condition_1"), f.get("condition_1_die")], ["Burning", "d6"], "Vesk's condition");
  has([1, 2, 3, 4, 5, 6].map((k) => f.get(`attune_1_awakening_${k}`)).filter(Boolean).join(" "), "Anywhere I can throw a hook: +1 on one die of every roll she makes with it, for each Aura powering it", "her hook's awakening, whole over its lines");
  has(`${f.get("archetype_1_ability_1")} ${f.get("archetype_1_ability_2")}`, "Push (1 Stamina): +3", "her Shadow's Push, +3 for taking it twice, paid off Stamina");
  has(f.get("notes_1"), "Trouble that follows her: wanted in three districts, owes the Guild.", "her trouble in Notes");
  // Bram's plate with a box ticked, and Dorrie's court clothes on her Mind.
  f = await print("bram");
  want(f, [["stamina_armour_1", "Fine plate armour"], ["stamina_armour_1_box_1", true], ["stamina_armour_1_box_2", false], ["archetype_1", "Guardian"], ["archetype_2", "Leader"], ["attune_1_thing", "His war hammer (Breaker)"], ["attune_1_catch", "Marked"]], "Bram");
  has(f.get("stamina_armour_2"), "shield", "Bram's shield on his Stamina");
  f = await print("dorrie");
  same(`${f.get("confidence_armour_1")} ${f.get("confidence_armour_2")}`.trim(), "Common court clothes, when they fit the scene", "Dorrie's court clothes on her Confidence, over its two lines");
  same(f.get("stamina_armour_1"), "", "nothing on Dorrie's Body");
  console.log("print on the phone: Vesk mid-scene, Bram's plate and Dorrie's court clothes, read back field by field");
  await context.close();
}

// 7. Dice, feel and learning. First the learning round (learn.js), on the
// crew's sheets: the brute's club at Isolde's Body, answered with Wren's Body
// and everything of hers that fits an arrow, and everything of Bram's that
// fits getting his hammer under the club.
const moving = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length);
const card = (page) => page.textContent(".ln-card");
// One round from the top: Wren and Bram in, then roll with these dice (the two
// d12s and the d10, then the club's d8), or tap them in when real is set.
async function round(page, dice, real = false) {
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="pick"][data-who="wren"]');
  await page.click('button[data-do="pick"][data-who="bram"]');
  await page.click('button[data-do="next"]');
  if (real) {
    await page.click('button[data-do="real"]');
    for (const [k, v] of [["0", dice[0]], ["1", dice[1]], ["2", dice[2]], ["opp", dice[3]]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
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
  // Wren's arrow: her Body, both Titles, Hunter twice, her longbow and Long
  // shot. Bram's hammer under the club: the wall that held the harbour gate,
  // guard one person, Guardian, his war hammer and Ring the bell, and no Root.
  const bow = wren.attuned.find((a) => /bow\b/i.test(a.name));
  const hammer = bram.attuned.find((a) => /\bhammer\b/i.test(a.name));
  const wrenThings = [...wren.titles, ...wren.archetypes, bow, bow?.awakenings.find((w) => w.name === "Long shot")];
  const bramThings = [bram.titles.find((t) => /harbour gate/.test(t.text)), bram.titles.flatMap((t) => t.permissions).find((p) => p.text === "guard one person"), bram.archetypes.find((a) => a.name === "Guardian"), hammer, hammer?.awakenings.find((w) => w.name === "Ring the bell")];
  same([wrenThings.length, wrenThings.every(Boolean), bramThings.every(Boolean)], [6, true, true], "Wren's and Bram's things for the round, off their sheets");
  const wrenSteps = wren.roots.Body + wrenThings.length;
  const bramSteps = bramThings.length;
  same([wrenSteps, bramSteps, stepsToDice(wrenSteps + bramSteps)], [12, 5, [12, 12, 10]], "Wren's 12 steps and Bram's 5, two d12s and a d10");
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="learn"][data-do="open"]');
  await page.waitForSelector("#ln-h");
  same(await page.evaluate(() => document.activeElement?.id), "ln-h", "focus at the start of the round");
  has(await card(page), "The brute swings his club at Isolde’s Body. That’s a d8", "the club's telegraph, at her Body");
  has(await card(page), "Isolde rolls her Stamina against it", "her Stamina when it lands");
  has(await card(page), `a d${isolde.numbers.stamina.die} against a d8 stops it 17 times in 24`, "her Stamina against the club, ties hers");
  has(await card(page), "Bram’s a Guardian, so he could intercept it for free", "Bram's free intercept");
  // What isn't the lesson is behind question bubbles: the odds open with a tap
  // and go again with Esc.
  same(await page.isVisible("#tip-ln-ride"), false, "the odds out of the way till they're asked for");
  await page.click('[popovertarget="tip-ln-ride"]');
  same(await page.isVisible("#tip-ln-ride"), true, "and there when the ? is tapped");
  has(await page.textContent("#tip-ln-ride"), "stops it 17 times in 24", "with the odds in it");
  await page.keyboard.press("Escape");
  same(await page.isVisible("#tip-ln-ride"), false, "and gone again with Esc");
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), true, "rolling before Wren and Bram are in");
  same(await page.$$eval('button[data-do="pick"]', (els) => els.map((e) => e.dataset.who)), ["wren"], "Bram waiting for Wren");
  await page.click('button[data-do="pick"][data-who="wren"]');
  has(await card(page), "both her Titles, Hunter twice, her longbow and Long shot all fit", "what of Wren's fits her arrow, off her sheet");
  has(await card(page), `Body ${wren.roots.Body}, and six things that fit · ${wrenSteps} steps`, "Wren's Body and six things");
  // The rules on tap are the book's, so they're left out of this one.
  same(/specialt|Archery/i.test(await page.$eval(".ln-card", (el) => {
    const c = el.cloneNode(true);
    for (const d of c.querySelectorAll("details")) d.remove();
    return c.textContent;
  })), false, "and no specialty anywhere in it");
  await page.click('button[data-do="pick"][data-who="bram"]');
  has(await card(page), "five things that fit, and no Root · 5 steps", "Bram's five things and no Root");
  has(await page.textContent("#tip-ln-combo"), "the wall that held the harbour gate, guard one person, Guardian, his war hammer and Ring the bell", "what of Bram's fits, behind its bubble");
  has(await card(page), `${wrenSteps} steps and ${bramSteps} steps is ${wrenSteps + bramSteps} steps`, "the combo's steps");
  has(await card(page), "so that’s two d12s and a d10", "the combo's dice");
  has(await card(page), "All three dice go on the club", "all three on the club");
  await page.click('button[data-do="back"]');
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), false, "Wren and Bram still in after going back");
  await page.click('button[data-do="next"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 4, 3, 6]));
  await page.click('button[data-do="roll"]');
  same(await page.$$eval("[data-spin]", (els) => els.length), 0, "dice tumbling with reduce-motion on");
  has(await card(page), "Your 9 beats the brute’s 6, so the club never comes down", "a beaten club");
  has(await card(page), "One die won, so Wren gets 1 Aura back", "Aura for the die that won");
  has(await card(page), "she’s on 8, past her 7", "Wren past her 7 while she's acting");
  has(await page.textContent("#tip-ln-past"), "on an extra action for 3", "what to spend it on, behind its bubble");
  same(await page.textContent(".ln-hex b"), "8", "Wren's Aura on 8");
  same(await page.evaluate(() => document.activeElement?.id), "ln-out", "focus on what the dice did");
  same(await moving(page), 0, "things moving on the round with reduce-motion on");
  await page.click('button[data-do="next"]');
  has(await card(page), "you stopped it, so nothing lands and the round’s over", "the end of a round that was stopped");
  await page.click('button[data-do="again"]');
  has(await page.textContent("#ln-h"), "The GM telegraphs", "playing it again");
  await round(page, [6, 2, 1, 6]);
  has(await card(page), "Your 6 ties the brute’s 6. A tie’s a loss, unless you pay 1 Aura", "a tie on the club");
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  has(await card(page), "a tie that’s bought pays nothing back", "a bought tie paying nothing back");
  same(await page.textContent(".ln-hex b"), "6", "Wren's Aura after paying for the tie");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 1, 7], true);
  has(await card(page), "The brute’s 7 beats your best, a 3, so the club lands on Isolde at once", "real dice that lose");
  has(await card(page), "Isolde’s Stamina drops from d12 to d10", "the club taking a size off her Stamina");
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
    for (const [k, v] of [["0", 2], ["1", 1], ["2", 1], ["opp", 7]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
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
  // A hit, then a hit that leaves her Stamina on its smallest size.
  await page.click('.cc-stat[data-p="stamina"]');
  await quiet();
  for (let i = 0; i < 5; i++) await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
  same((await heard()).buzz, [60, 60, 60, 60, [70, 60, 120]], "four hits, then the one that leaves her Stamina on d2");
  same(await page.$$eval(".t-stamina .zd-die.is-grown", (els) => els.length), 1, "her Stamina die changing shape");
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
    same(await page.$$eval(".cc-roots .tile .tile-dice .zd-die", (els) => els.map((e) => e.dataset.d)), ["12", "4", "8", "2"], `Vesk's Roots drawn as the dice they roll, ${theme}`);
    same(await page.$$eval(".cc-track .is-trk .zd-die", (els) => els.map((e) => e.dataset.d)), ["12", "12", "12"], `her three tracks as d12s, ${theme}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (wide > 0) note(`the play screen scrolls sideways by ${wide}px, ${theme}`);
    const small = await page.$$eval(".cc-roots .tile, .cc-more .tile, .cc-stat, .cc-tabs a, .cc-play button, .cc-abilities button, .cc-attune button", (els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
    if (small) note(`${small} tap targets under 44px on the play screen, ${theme}`);
    const broken = await page.$$eval(".tile-name", (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    if (broken.length) note(`names that don't fit their tiles: ${broken.join(", ")}, ${theme}`);
    await axe(`the play screen, ${theme}`);
    // Her lock, built: the card stays under two screens with every chip on it.
    await page.click('.cc-roots .tile[data-r="Body"]');
    for (const k of ["perm|0|2", "perm|1|0", "utility|a perfect set of picks"]) await page.click(`#cc-dialog .cc-pick[data-k="${k}"]`);
    await page.click('#cc-dialog button[data-act="foe-add"][data-v="6"]');
    has(await page.textContent("#cc-dialog .cc-dice"), "13 steps, 2d12 + d2", `her lock built, ${theme}`);
    const tallCard = await card();
    if (tallCard > 2) note(`a roll built runs ${tallCard.toFixed(1)} screens, ${theme}`);
    const smallChips = await page.$$eval("#cc-dialog .cc-pick, #cc-dialog .cc-chipbtn, #cc-dialog .button", (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim()));
    if (smallChips.length) note(`tap targets under 44px on the roll card: ${smallChips.slice(0, 4).join(", ")}, ${theme}`);
    const cardWide = await page.$eval("#cc-dialog .dlg-body", (el) => el.scrollWidth - el.clientWidth);
    if (cardWide > 0) note(`the roll card scrolls sideways by ${cardWide}px, ${theme}`);
    await shot(page, `one-hand-roll-${theme}`);
    await axe(`a roll built, ${theme}`);
    await page.evaluate(() => window.ziCompanion.setDice([12, 2, 1, 3]));
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
    same(await page.$$eval(".cc-fold-g .cc-gl", (els) => els.slice(0, 3).map((e) => e.textContent.replace(/\s+/g, " ").trim())), ["Body 8", "Mind 4", "Soul 0"], `her Roots at a glance, ${theme}`);
    await page.click('details[data-open="sh-roots"] > summary');
    same(await page.$$eval('details[data-open="sh-roots"] .cc-from', (els) => els.map((e) => e.textContent)), ["3 from your first Title, 1 from your second, move unseen, run the rooftops, pick a mechanical lock, fight dirty with a knife", "2 from your second Title, know how a lock’s built, find a buyer for anything", "nothing yet"], `where each Root came from, ${theme}`);
    await page.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
    await axe(`the Sheet tab, ${theme}`);
    await shot(page, `one-hand-${theme}`);
    await page.click('.cc-tabs a[data-t="play"]');
    await page.click('.cc-stat[data-p="stamina"]');
    await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
    same([await page.getAttribute(".t-stamina .zd-die", "data-d"), await page.$$eval(".cc-track .zd-die.is-grown", (els) => els.length), await moving(page)], ["10", 0, 0], `a hit with reduce-motion on: a d10 straight away and nothing moving, ${theme}`);
    await axe(`a track's panel, ${theme}`);
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
    same(await sums(page), ["Action 1 d12 + d8 against d10 You’re going at them"], "the brute's action folded into a line");
    same([await line(page, ".dz-act.is-open .dz-act-head h3"), await page.evaluate(() => document.activeElement?.textContent ?? "")], ["Action 2", "Action 2"], "the new one open, with the phone on it");
    same([await tray(page, "you"), await tray(page, "them")], [[], []], "with nothing on it yet");
    // Back to the brute's and Add another action again: the one with nothing
    // on it opens, rather than another piling up.
    await page.click(`${dlg} button[data-dz="pick"][data-a="0"]`);
    await page.click(`${dlg} button[data-dz="more"]`);
    same([await count(page, ".dz-act"), await line(page, ".dz-act.is-open .dz-act-head h3")], [2, "Action 2"], "adding again opens the empty one");
    await add(page, "you", [6]);
    await add(page, "them", [4]);
    same(await page.getAttribute(`${dlg} button[data-dz="def"][data-v="them"]`, "aria-pressed"), "true", "and once it's got dice on both sides, it's going at them");
    await page.click(`${dlg} button[data-dz="more"]`);
    await add(page, "you", [12]);
    await add(page, "them", [8]);
    await page.click(`${dlg} button[data-dz="def"][data-v="you"]`);
    same(await sums(page), ["Action 1 d12 + d8 against d10 You’re going at them", "Action 2 d6 against d4 You’re going at them"], "the archer's folded in too");
    has(await line(page, ".dlg-head"), "3 actions", "the head says how many");
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
    same(await page.$$eval(`${dlg} .dz-pads h3`, (els) => els.map((e) => e.textContent)), ["Action 1", "Action 2", "Action 3"], "real dice, an action at a time");
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
    same([await sums(page), await tray(page, "you"), await tray(page, "them")], [["Action 2 d6 against d4 You’re going at them", "Action 3 d12 against d8 They’re coming at you"], [12, 8], [10]], "all three kept through a reload, the first open");
    // Taken off again, down to one, which is the roller as it was.
    await page.click(`${dlg} button[data-dz="drop"][data-a="1"]`);
    same(await sums(page), ["Action 2 d12 against d8 They’re coming at you"], "the archer's taken off, and the last one's Action 2 now");
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

// 8. Downtime on stacking. Vesk's week: every track up a size first, then 6
// sizes of Recover and a new permission with its Root, undone and done
// again, and a second week that chases her Aspiration with her Mind and the
// two things on her sheet that fit, with fixed dice, and gives her grappling
// line a new awakening and its Catch. It all survives a reload. Then (8b,
// the play screen's, prompt 6 of notes/stacking-plan.md) a made-up rule
// change against her saved sheet with its gold marks.
if (part("8")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  // Vesk part way through her week: her Stamina down to d4 and her
  // Confidence to d10.
  const vesk = await crewOn(page, "vesk");
  await setState(page, vesk.id, { tracks: { stamina: 4, confidence: 10, resolve: 12 } });
  await page.reload();
  await playing(page);
  const me = async () => (await savedAll(page)).find((c) => c.id === vesk.id);
  const tracksOf = async () => {
    const s = (await me()).state.tracks;
    return [s.stamina, s.confidence, s.resolve];
  };
  const base = rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD);
  const week = async () => {
    await page.click('button[data-act="downtime"]');
    has(await t.body(), "Stamina d4 to d6 and Confidence d10 to d12", "every track up a size, free");
    // Vesk's Shadows have both their abilities, so there's none to buy.
    same(await page.$$eval('#cc-dialog button[data-do="pick"][data-v="ability"]', (els) => els.length), 0, "no ability to buy when every one's had");
    await dt('[data-do="pick"][data-s="0"][data-v="heal"]');
    for (let i = 0; i < 3; i++) await dt('[data-do="heal"][data-s="0"][data-f="stamina"][data-v="1"]');
    same(await page.$eval('#cc-dialog button[data-act="dt"][data-do="heal"][data-s="0"][data-f="stamina"][data-v="1"]', (el) => el.disabled), true, "her Stamina can't go past d12");
    await dt('[data-do="pick"][data-s="1"][data-v="perm"]');
    await dt('[data-do="set"][data-s="1"][data-f="t"][data-v="0"]');
    await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "slip through any crowd");
    await dt('[data-do="set"][data-s="1"][data-f="root"][data-v="Body"]');
    same(await page.$$eval('#cc-dialog [data-f="spec"], #cc-dialog datalist', (els) => els.length), 0, "no specialty to write");
  };
  await week();
  await shot(page, "8-downtime");
  await t.finish();
  same(await tracksOf(), [12, 12, 12], "her Stamina healed and every track up");
  same(sheetFor(await me()).roots, { ...base.roots, Body: base.roots.Body + 1 }, "her new permission 1 more on her Body");
  same(sheetFor(await me()).titles[0].permissions.map((p) => [p.text, p.root]).at(-1), ["slip through any crowd", "Body"], "on her first Title");
  await page.click('button[data-act="undo"]');
  same([await tracksOf(), sheetFor(await me()).roots], [[4, 10, 12], base.roots], "Undo takes the week back");
  await week();
  await t.finish();
  same(sheetFor(await me()).roots.Body, base.roots.Body + 1, "her week again");
  // A second week: her Aspiration with her Mind and the two things on her
  // sheet that fit, 6 steps, a d12, against its d2, and a new awakening on
  // her grappling line, a Catch with it since it's Awakened.
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  await dt('[data-do="set"][data-s="0"][data-f="root"][data-v="Mind"]');
  await dt('[data-do="use"][data-s="0"][data-v="title|1"]');
  await dt('[data-do="use"][data-s="0"][data-v="perm|1|2"]');
  has(await t.body(), "6 steps, d12, against its d2", "her Aspiration roll");
  await dt('[data-do="use"][data-s="0"][data-v="perm|1|2"]');
  has(await t.body(), "5 steps, d10, against its d2", "a thing tapped off again");
  await dt('[data-do="use"][data-s="0"][data-v="perm|1|2"]');
  await page.evaluate(() => window.ziCompanion.setDice([7, 1]));
  await dt('[data-do="asp-roll"][data-s="0"]');
  has(await t.body(), "7 against 1. Beat it. It climbs to d4.", "her Aspiration climbing");
  await dt('[data-do="pick"][data-s="1"][data-v="awk"]');
  if (await page.$('#cc-dialog button[data-act="dt"][data-do="set"][data-s="1"][data-f="a"][data-v="0"]')) await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="0"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="name"]', "Haul someone up after me");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "1 Aura and a friend climbs with her, no roll");
  await dt('[data-do="set"][data-s="1"][data-f="kind"][data-v="active"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="catch"]', "Loud");
  await t.finish();
  await page.reload();
  await playing(page);
  const after = await me();
  same([after.state.asp, sheetFor(after).attuned[0].awakenings.map((w) => w.name), sheetFor(after).attuned[0].catch], [4, ["Anywhere I can throw a hook", "Haul someone up after me"], "Loud"], "her Aspiration's die and her new awakening with its Catch, after a reload");
  console.log("downtime: Vesk's two weeks, a permission with its Root, an Aspiration rolled on what fits, an undo and a reload");

  // A made-up rule change against her saved sheet, with its gold marks
  // (marks.js and the play screen's, prompt 6 of notes/stacking-plan.md).
  // It runs on Vesk as 8 left her, so ZI_ONLY=8,8b.
  if (part("8b")) {
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
    same([seen["title:1"], seen["perm:1:0"], seen["perm:0:1"]], ["Raised by the guild (Mind 2, Body 1)", "know how a locks built (Mind)", "run the rooftops (Body)"], "the typo fixes taken in quietly, and the real change kept for its mark");
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
  }
  await context.close();
}

// 9. Every crew member grows on stacking: a downtime's worth of each kind of
// growth on top of their sheet adds up, a seventh permission never gets on,
// and an Aspiration past d12 brings a Title with its 3 spread and its one
// permission, an archetype with its one ability, or an attuned thing with
// its one awakening. A slot buys an ability, never one another of the same
// archetype has.
if (part("9")) {
  // Two permissions for a Boon in downtime: the Boon takes their slots, and
  // one that wouldn't fit takes nothing off.
  {
    const vesk = structuredClone(book.crew.find((c) => c.id === "vesk"));
    vesk.titles[0].permissions.push({ text: "slip a grip", root: "Body" }, { text: "hang off a ledge", root: "Body" });
    const swapped = rootsSheet(vesk, [{ k: "boon", t: 0, lever: "Aura", name: "Second Wind", drop: [0], g: 0 }], BUILD);
    same([swapped.titles[0].permissions.length, swapped.titles[0].boons.map((b) => b.name), swapped.numbers.aura], [4, ["Second Wind"], 9], "a permission off her five for a Boon, with Aura 2 more");
    const full = rootsSheet(vesk, [{ k: "perm", t: 0, text: "palm a key", root: "Body", g: 0 }, { k: "boon", t: 0, lever: "Aura", drop: [0], g: 1 }], BUILD);
    same([full.titles[0].permissions.length, full.titles[0].boons.length, full.numbers.aura], [6, 0, 7], "a Boon that won't fit beside six permissions takes none of them off");
  }
  for (const base of book.crew) {
    const c0 = rootsSheet(base, [], BUILD);
    const root = RS.mostOf(c0.titles[0].roots);
    const grown = [
      { k: "perm", t: 0, text: "a new permission", root },
      { k: "thread", person: "Someone new", text: "They owe me.", kind: "hostile" },
      { k: "title", text: "A Title from an Aspiration", roots: { Body: 0, Mind: 1, Soul: 2 }, perm: { text: "its permission", root: "Soul" } },
      { k: "arch", arch: "Healer", have: ["Pull them back"] },
      { k: "attune", name: "A new thing", awk: { name: "Its awakening", kind: "passive", text: "+1 on one die of every roll you make with it, for each Aura powering it" } },
      { k: "awk", a: 0, name: "Another awakening", kind: "active", text: "1 Aura and it does something", catch: "Loud" },
    ];
    const c = rootsSheet(base, grown, BUILD);
    const roots = { ...c0.roots };
    roots[root] += 1;
    roots.Mind += 1;
    roots.Soul += 3;
    same(c.roots, roots, `${base.name}'s Roots with a permission and a new Title spread Mind 1 and Soul 2`);
    same("specialties" in c, false, `${base.name} with no specialties`);
    same([c.titles.length, c.archetypes.length, c.archetypes.at(-1).have, c.attuned.length, c.attuned[0].awakenings.length, c.numbers.aura], [c0.titles.length + 1, c0.archetypes.length + 1, ["Pull them back"], c0.attuned.length + 1, c0.attuned[0].awakenings.length + 1, c0.numbers.aura + 2], `${base.name}'s Titles, archetypes with the one ability, a new attuned thing with Aura 2 more, and awakenings`);
    same(c.threads.find((p) => p.person === "Someone new")?.threads[0]?.kind, "hostile", `${base.name}'s new hostile thread`);
    // A seventh permission never gets on a Title.
    const full = Array.from({ length: 6 }, (_, i) => ({ k: "perm", t: 0, text: `permission ${i}`, root }));
    same(rootsSheet(base, full, BUILD).titles[0].permissions.length, 6, `${base.name}'s first Title stops at six permissions`);
    // What downtime grew comes into Change as it was on the sheet.
    const folded = rootsSheet(sheetOf({ id: `9-${base.id}`, name: base.name, build: foldGrown(fromCrew(base, BUILD, { keep: true }), grown, BUILD) }, BUILD), [], BUILD);
    same(sheetParts({ ...folded, points: null }), sheetParts({ ...c, points: null }), `${base.name}'s growth folded into a build, the sheet they had`);
  }

  const { context, page } = await phone();
  const t = tableOf(page);
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  // On the phone: Vesk's Aspiration past d12 gives her a new Title, its 3
  // spread Soul 2 and Mind 1 in three taps, with its permission on her Mind.
  const vesk = await crewOn(page, "vesk");
  await setState(page, vesk.id, { asp: 12 });
  await page.reload();
  await playing(page);
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  await dt('[data-do="set"][data-s="0"][data-f="root"][data-v="Body"]');
  for (const k of ["title|0", "title|1", "perm|0|2", "perm|1|0", "utility|a perfect set of picks"]) await dt(`[data-do="use"][data-s="0"][data-v="${k}"]`);
  has(await t.body(), "13 steps, 2d12 + d2, against its d12", "her Aspiration rolled the way she picks a lock");
  await page.evaluate(() => window.ziCompanion.setDice([11, 3, 2, 9]));
  await dt('[data-do="asp-roll"][data-s="0"]');
  has(await t.body(), "It climbs past d12 and resolves.", "her Aspiration resolving");
  await dt('[data-do="set"][data-s="0"][data-f="take"][data-v="title"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "Captain of the crew");
  await dt('[data-do="tshape"][data-s="0"][data-v="two"]');
  await dt('[data-do="tspread"][data-s="0"][data-n="2"][data-v="Soul"]');
  await dt('[data-do="tspread"][data-s="0"][data-n="1"][data-v="Mind"]');
  has(await t.body(), "Its 3 Root points: Mind 1, Soul 2", "her new Title's spread");
  await page.fill('#cc-dialog input[data-dt="0"][data-f="perm"]', "know who’s lying in my crew");
  await dt('[data-do="set"][data-s="0"][data-f="proot"][data-v="Mind"]');
  // Her second slot can't buy an ability, so it's Get something.
  await dt('[data-do="pick"][data-s="1"][data-v="get"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "a spare lockpick");
  await t.finish();
  const v = (await savedAll(page)).find((c) => c.id === vesk.id);
  const sheet = sheetFor(v);
  same([sheet.roots, sheet.titles.at(-1).text, sheet.titles.at(-1).roots, sheet.titles.at(-1).permissions.map((p) => [p.text, p.root]), v.state.asp], [{ Body: 8, Mind: 6, Soul: 2 }, "Captain of the crew", { Body: 0, Mind: 1, Soul: 2 }, [["know who’s lying in my crew", "Mind"]], 2], "her third Title, its spread and its permission, and her Aspiration back to d2");

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
  same(await page.$eval('#cc-dialog button[data-act="dt"][data-do="set"][data-s="1"][data-f="a"][data-v="0"]', (el) => el.disabled), true, "the second slot can't take the Guardian's last ability again");
  await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="1"]');
  await dt('[data-do="set"][data-s="1"][data-f="name"][data-v="Everyone gets it"]');
  await t.finish();
  const g = sheetFor((await savedAll(page)).find((c) => c.id === "own-gil"));
  same(g.archetypes.map((a) => a.have), [["Push", "Stand firm"], ["Push", "Everyone gets it"]], "Gil's two new abilities, a slot each");
  console.log(`growing: every crew member's growth adds up, Vesk's Aspiration past d12 is a Title spread her way, and Gil buys two abilities`);
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
