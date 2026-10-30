// Check the character companion the way a player uses it at the table.
//
//   npm run build && node tests/check-companion.mjs [screenshot-folder]
//   ZI_ONLY=5,5b node tests/check-companion.mjs runs only those parts.
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
//    it back, and one at a place landing on whoever's in it.
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
// 2. Every crew member's set actions on the phone match their sheet in the
//    chapter, read straight off the Markdown here rather than from book.json.
// 3. Vesk at the table: Sneak is 3 steps, a d6. Tap off move unseen and it's
//    2 steps, a d4. Bring in her grappling line and it's 3 again for 1 Aura.
//    Roll with fixed dice, check the Aura and the result, and her Confidence
//    going up a size for the win, reload, then go offline and reload, and read
//    Aura's rule and a permission's with no signal. Then a split roll with a
//    top face and a tie (one size up for the action), an undo, shaken on d2
//    and pulling herself together, fired up on d12 and cashing it in, a
//    defence roll where each die stops one and the one she stops puts her
//    Confidence up, her leathers broken off her Defend with her Confidence
//    left alone, and a new scene. Then the play screen's stage 3: a threat's
//    die, a tap-in with an intent, Defend with a split and a swap, and an undo
//    of a Hurt that took her Confidence down with it. Wren's full miss takes
//    hers down, the Hunter's +3 that makes it a win puts it back up, and a
//    miss on d2 leaves it on d2.
//    Threads: Vesk borrows through a bond thread for 1 Aura and strains it,
//    Dorrie stops lending once both threads are strained, one snaps and one's
//    mended, and her hostile thread with the fence bites, strains, goes whole
//    again and snaps.
// 3c. Bram's armour (27 Oct): his Fine plate's two boxes and his Common
//    shield's one, on the Sheet tab and When it lands. A blow on his plate
//    ticks a box and leaves it on his Defend, a box tapped back and forth on
//    the Sheet tab, a hit that's two Hurts while he's Exposed put on his plate
//    and his shield, both broken off his Defend, an undo, a reload, and
//    downtime mending the plate, every box clear. Then the Sheet tab and the
//    card at 390 by 844 in both themes, with 44px boxes and axe.
// 4. Wounds: two Hurts take Vesk's Confidence to d2, the rest at the end of a
//    scene (a win, then a tie rolled again for 1 Resolve), Bram's Unyielding
//    first Hurt leaving his Confidence alone, Bram Defending against three
//    goblins with his Guardian +2 and his Confidence up three sizes, Dorrie's
//    fear with no Defend and no intercept, one stopped and one through, then
//    held for 1 Resolve, two Hurts at once while she's Exposed, a Blaze into a
//    Scar with its Catch, and characters saved with the old Hurt track and
//    Armour, a debt thread and two attuned things opening clean, with gold
//    marks on the lines the rules changed.
// 5. Building your own: Vesk again, through the builder a step to a screen,
//    a Title at a time and what she carries a part at a time, with a
//    permission's third set action refused, one attuned thing, and threads
//    made from the crew questions. Her set actions and numbers have to match
//    her sheet in the chapter. Then a roll, a reload, offline, a change in the
//    builder, and every step at 320 wide in the light, with axe on each.
// 5b. The builder on a phone held in one hand: full screen with the crest at
//    the top, the first choice high up, the eight steps in one line, Back and
//    Next in the bar at the bottom on every step, and a die growing into its
//    next shape as a line goes on, or swapping straight away under
//    reduce-motion. axe on every step, dark and light.
// 6. Print, and the other ways in. Every crew member made into a build has
//    the sheet the chapter gives them, the builder's warnings for threads and
//    attuned things, and a thousand random characters pass every one of the
//    builder's warnings with one attuned thing and bond and hostile threads.
//    Then Vesk's sheet printed with a Hurt and a strained thread on it, and
//    again offline, a character made from Vesk and printed, a random one
//    rolled five times, saved and printed, and a blank sheet. A way in asks
//    before it bins a draft, and one page passes axe at 320 wide.
// 7. Dice, feel and learning. The learning round played start to finish three
//    times: beaten, a tie won for 1 Aura with a top face, and real dice tapped
//    in that lose, so the club lands on Isolde as a Hurt, with Wren's, Bram's
//    and Isolde's Confidence moving each time. Then offline, and
//    axe at 320 wide in both themes. With reduce-motion the dice never tumble
//    and nothing on the page moves. With motion on, the dice tumble and land
//    on their numbers, the roll card turns over, the tabs slide, Aura pops
//    back in and the wound die grows into its next shape. Sound and buzz stay off until the switch turns them on, and then a
//    landing, a top face, a Hurt and the wound die reaching d12 each get one.
// 7b. A character in one hand: full screen with the crest at the top, the
//    first set action high up, each set action drawn as the dice it rolls,
//    her 6 front and centre with its top face lit, and the Sheet tab under two
//    screens with its folds shut, with axe on all three in both themes. A
//    Hurt with reduce-motion on swaps the wound die's shape, and nothing moves.
// 8. Downtime and rule changes. Vesk's week from Downtime, with a Hurt on
//    her that clears for free: one slot pays the fence, which strains her
//    hostile thread with him, and the other gives her grappling line its
//    Catch, Loud, and haul someone up after me, on no set action, so it's 1
//    Aura when it fits. Nothing offers to heal a Catch or mend Armour. An undo
//    takes it all back. A second week puts a new permission on her
//    Sneak (4 steps, a d8), chases her Aspiration with fixed dice, and swaps
//    a permission, and it all survives a reload and offline. A third writes a
//    hostile thread and takes a tie with an extra resource. Then a made-up
//    rule change against her saved sheet: a reworded permission, her Stride
//    and her Locks get gold marks with old and new, a typo fix and a
//    punctuation fix stay quiet, what she grew in downtime isn't marked, and
//    Got it clears the marks for good. The card and the marks pass axe.
// 9. Changing a character, any time. Every crew member with a downtime on top
//    folds into a build that makes the same sheet, and a seventh permission
//    never gets in. Then Vesk from the crew: a downtime gives her Prepared (a
//    trait from downtime used to stop her sheet opening) and a permission on
//    Sneak, then a Hurt, 1 Aura, a strained thread and her smoke bomb used.
//    Change, from the top of the Sheet tab, shows what downtime gave her. A
//    third Title goes on Talk with six permissions and no seventh, a thread
//    and the smoke bomb are reworded, and saving makes her your own with all
//    of it kept: her wound die and Aura, the strain and the crossing out, no gold
//    marks, and every set action adding up through dice.js. It survives a
//    reload and offline. A change left part way restarts after a downtime
//    rather than losing it, and seven Titles print with the seventh in Notes.
//    What downtime grew folds back to the sheet the player had, line for line,
//    even an attuned permission pushed past its stage with Finish anyway, a
//    thing gone up to Perfected with no Catch, a line left waiting for room,
//    and a downtime trait, thread or Catch longer than the builder's own boxes.
//    A downtime on another tab while a change is open isn't saved over: the
//    change starts again from her as she is now. Printing says when Notes runs
//    out of room, and a reworded thing in the bag stays crossed out.
// 10. The rules on a phone. The Learn deck (content/learn.md) has 30 to 40
//    cards of 40 to 120 words in book order, each teaching a section the book
//    has, most with an example using the crew's real dice, and an example
//    that names a crew member's set action and its die has them right. A
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
//    reading on the chapter and the rules page. Twenty Places: a card for
//    every place, Roll a d20, a place's tabs (tapped and keyed), its Secret
//    sealed, and a tag saying what it does. Then the deck, its pop-ups and
//    Read more offline, nothing moving under reduce-motion and a section and
//    a sheet sliding in with motion on, 44px tap targets, and axe in both
//    themes on the deck, a section, its contents, a pop-up, a place's tabs,
//    threats and the crew's sheets.
import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { diceLabel, diceRange, diceShapes, stepsToDice } from "../src/companion/dice.js";
import { blankBuild, checksOf, foldGrown, normalBuild, sheetOf } from "../src/companion/builder.js";
import { fromCrew, randomBuild } from "../src/companion/ways.js";
import { changesOf, said, typo } from "../src/companion/marks.js";
import { grow } from "../src/companion/grow.js";
import { CARD_WORDS, CREW, DECK_SIZE, newestChange, reachOf, readCards, staleCards } from "../scripts/learn.mjs";
import * as T from "../src/companion/table-rules.js";
import { dialsOf, foundNews, timeUp } from "../src/companion/found-rules.js";
import { parse as parseYaml } from "yaml";

const SHOTS = process.argv[2] || null;
// ZI_ONLY=5,5b runs only those parts, for a quick check while working on them.
// Before anything goes to main, the whole file runs.
const ONLY = process.env.ZI_ONLY ? new Set(process.env.ZI_ONLY.split(",").map((x) => x.trim())) : null;
const part = (n) => !ONLY || ONLY.has(n);
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
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["resolve"], list: [work("act-vesk-01", 8, 4)] } }, kai, "with 1 Resolve for an extra action, she can", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [1, 0], "her Locks, 8 against its 4, takes Locked");
  same(r1().held["stake-satchel"], 4, "and the satchel's 4 stands for the round");
  ok({ o: "acts", round: "round-one-01", ch: "bram", x: { more: [], list: [{ id: "act-bram-01", k: "work", ref: "stake-satchel", act: "Lift and carry", steps: 3, t: 996, roll: { dice: [{ size: 6, total: 4 }], opp: 2 }, aim: "Guarded" }] } }, sam, "Bram goes at it too", { phoneNow: 1000 });
  same(r1().acts["sam|bram"].list[0].roll.won, false, "his 4 ties the 4 that stands, and a tie's a loss");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["resolve"], list: [] } }, kai, "Vesk takes her roll back", { phoneNow: 1000 });
  same(doc.scene.stakes[0].tags.map((g) => g.gone), [0, 0], "and Locked's back in the way");
  ok({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["resolve"], list: [work("act-vesk-02", 9, 4, "Guarded")] } }, kai, "she rolls it again, going for Guarded", { phoneNow: 1000 });
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
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["resolve"], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-03", k: "else", act: "Defend", t: 998 }] } }, kai, "three actions on one extra is too many", { phoneNow: 1000 });
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
  not({ o: "acts", round: "round-one-01", ch: "vesk", x: { more: ["resolve"], list: [work("act-vesk-02", 9, 4, "Guarded"), { id: "act-vesk-09", k: "else", act: "Move", t: 2500 }] } }, kai, "one done after the round ended doesn't count", { phoneNow: 2600 });
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
  ok2({ o: "acts", round: "round-a-0001", ch: "bram", x: { more: ["resolve"], list: [at("act-watch-b1", "event-watch1", "Talk", 6, 7, "slow"), at("act-door-b2", "stake-door01", "Lift and carry", 5, 2, "Barred")] } }, sam, "Bram, with 1 Resolve, takes Barred, the last thing in its way");
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
  const oldCard = (seat, size = { size: "city", die: 8 }) => ({ seat, size, type: row("core:type:house", "A noble house", { role: "house" }), method: row("core:method:money", "money"), want: row("core:want:more", "More."), name: row("medieval:name:vane", "The Vane Estate") });
  whys({ o: "fd-age" }, kai, "Only the GM can do that.", "a player can't start the founding");
  oks({ o: "fd-age" }, gm, "Mo starts the founding");
  same([f().step, f().olds, f().fac.map((x) => (x.old ? "old" : x.key)), f().clock], ["found", 3, ["old", "old", "old", K.lee, K.sam, K.kai], { age: 2, left: 40 * MIN, run: now }], "three old powers (six factions less his three players), then the founders the other way round, on the founding's clock");
  same(f().turn, { key: "", part: "old", i: 0, at: now }, "his old powers are first");
  whys({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0) }, kai, "That’s your GM’s to deal.", "a player can't deal an old power");
  whys({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0, { size: "local", die: 4 }) }, gm, "That card didn’t make sense.", "an old power's City or Great");
  oks({ o: "fd-answer", part: "old", i: 0, pick: oldCard(0) }, gm, "Mo deals the first on the Old Bridge");
  whys({ o: "fd-answer", part: "old", i: 1, pick: oldCard(0) }, gm, "That card didn’t make sense.", "and nobody else can sit there");
  oks({ o: "fd-answer", part: "old", i: 1, pick: oldCard(1, { size: "great", die: 12 }) }, gm, "the second, on the Mill Meadows");
  oks({ o: "fd-back", part: "old", i: 1 }, gm, "he takes the second back");
  same([f().fac[1].card, f().turn.part, f().turn.i], [null, "old", 1], "and it's up again");
  oks({ o: "fd-answer", part: "old", i: 1, pick: oldCard(1, { size: "great", die: 12 }) }, gm, "puts it back in");
  oks({ o: "fd-answer", part: "old", i: 2, pick: oldCard(2) }, gm, "and the third, on Ravel Quarry");
  same([f().turn.key, f().turn.part, f().turn.i], [K.lee, "f-seat", 3], "then Lee founds first, the last in the order");
  whys({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 0 } }, lee, "That seat’s taken, or it isn’t one.", "not on an old power's seat");
  whys({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 4 } }, sam, "It’s not your turn.", "and not on Sam's say");
  oks({ o: "fd-answer", part: "f-seat", i: 3, pick: { k: 4 } }, lee, "Lee founds his on the Bell Inn");
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
  for (const [part, pick] of [["never", row("core:fd-never:behind", "We never leave one of ours behind")], ["type", row("medieval:type:ferry", "Ferrymen, father to son", { role: "traders" })], ["method", row("core:method:trade", "trade")], ["want", row("core:want:respect", "Respect.")], ["name", row("medieval:name:coyle", "Coyle's Barges")]]) ok({ o: "fd-answer", part, i: 3, pick }, lee, `Lee answers ${part}`);
  same([f().turn.key, f().turn.part, f().turn.i], [K.sam, "f-seat", 4], "his faction's founded, and Sam's next");
  ok({ o: "fd-answer", part: "f-seat", i: 4, pick: { k: 5 } }, sam, "Sam founds on the Quay");
  ok({ o: "fd-answer", part: "before", i: 4, pick: { j: null } }, sam, "nobody had it before");
  ok({ o: "fd-in", key: K.sam, on: false }, gm, "Sam's had to go, so Mo takes him out mid-turn");
  same([f().turn.key, f().turn.i, f().turn.part], [K.kai, 5, "f-seat"], "Kai founds next, and Sam's faction waits for him");
  same(f().fac[4].picks.before.j, null, "what Sam answered stands");
  same(T.leave(doc, "kai"), true, "Kai leaves the campaign");
  same([f().turn, f().out], [null, true], "and with nobody left in to take what's left, Mo's phone deals the rest");
  const dealtPicks = (seat) => ({ "f-seat": { k: seat }, before: { j: null }, owes: { j: 0, ...row("core:fd-owes:money", "We owe {b} the money we started with") }, never: row("core:fd-never:hungry", "We'll never let one of ours go hungry"), type: row("medieval:type:smiths", "Smiths", { role: "makers" }), method: row("core:method:craft", "craft"), want: row("core:want:more", "More."), name: row("medieval:name:hammermen", "The Hammermen") });
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
await new Promise((r) => server.listen(4174, r));
const BASE = "http://localhost:4174";
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
  await page.waitForSelector(".tile[data-a]");
}

// 2. The crew's set actions, read off their sheets in the chapter.
if (part("2")) {
  const md = readFileSync("content/rules/03b-title-ideas-and-the-crew.md", "utf8");
  const sheets = [...md.matchAll(/^:::sheet\[([^:\]]+): [^\]]+\]\n([\s\S]*?)\n:::$/gm)].map((m) => ({
    name: m[1],
    actions: m[2].match(/^\*\*Set actions:\*\* (.+)$/m)[1].replace(/\.$/, "").split(" · ").map((s) => {
      const x = s.match(/^(.+?) (\d+) \(([^)]+)\)/);
      return [x[1].replace(/'/g, "’"), Number(x[2]), x[3]];
    }),
  }));
  same(sheets.length, 6, "crew sheets in the chapter");
  const { context, page } = await phone();
  for (const sheet of sheets) {
    await play(page, sheet.name.toLowerCase());
    const tiles = await page.$$eval(".tile[data-a]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, parseInt(el.querySelector(".tile-steps").textContent, 10), el.querySelector(".tile-die").textContent]));
    same(tiles, sheet.actions, `${sheet.name}'s set actions`);
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")));
  same([saved.v, saved.characters.length], [1, 6], "the saved list's version and size");
  console.log(`crew: ${sheets.length} sheets checked against the chapter`);
  await context.close();
}

// 3. Vesk at the table.
if (part("3")) {
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await shot(page, "1-characters");
  await play(page, "vesk", "Vesk");
  await shot(page, "2-sheet");
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const aura = () => page.textContent('.cc-stat[data-p="aura"] .v');
  const conf = () => page.textContent('.cc-stat[data-p="conf"] .v');
  const swing = () => page.$$eval("#cc-dialog .cc-swing-head .zd-die", (els) => els.map((e) => e.textContent));
  const tile = (name) => page.click(`.tile[data-a]:has(.tile-name:text-is("${name}"))`);
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);

  await tile("Sneak");
  has(await live(), "3 steps, d6", "Sneak to start with");
  // Her traits never show here: a trait's never a step.
  same(await page.$$eval('#cc-dialog .cc-line[data-act="off"]', (els) => els.some((el) => /Silent Step/.test(el.textContent))), false, "Silent Step isn't a line on her Sneak");
  await page.click('#cc-dialog .cc-line[data-act="off"]:has-text("move unseen")');
  has(await live(), "2 steps, d4", "Sneak without move unseen");
  await page.click('#cc-dialog summary:has-text("Bring something in")');
  same(await page.$$eval('#cc-dialog .cc-line[data-act="in"]', (els) => els.some((el) => /Silent Step|Light on my Feet/.test(el.textContent))), false, "no trait to bring in");
  await page.click('#cc-dialog .cc-line[data-act="in"]:has-text("grappling line")');
  has(await live(), "3 steps, d6", "Sneak with her grappling line brought in");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "the cost of bringing it in");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await shot(page, "3-building-a-roll");
  await page.evaluate(() => window.ziCompanion.setDice([5, 4]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  has(await page.textContent("#cc-dialog .cc-res"), "Beat it", "her 5 against the guard's 4");
  has(await page.textContent("#cc-dialog .cc-them"), "Their d64", "the guard's d6 rolled with hers, and its 4");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Aura after paying 1");
  // A win puts her Confidence up a size, and the card says why.
  same(await page.$$eval("#cc-dialog .cc-swing-head .zd-die", (els) => els.map((e) => e.textContent)), ["d6", "d8"], "Confidence from d6 to d8 on a win");
  has(await page.textContent("#cc-dialog .cc-swing"), "One of your dice beat it.", "why her Confidence went up");
  await shot(page, "4-the-result");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await aura(), "4/5", "Aura on the strip after the roll");
  same(await conf(), "d8", "Confidence on the strip after a win");

  await page.reload();
  await page.waitForSelector(".tile[data-a]");
  same(await aura(), "4/5", "Aura after a reload");
  has(await page.textContent(".cc-last"), "5 on the d6, against 4. Beat it.", "the last roll after a reload");

  // Offline: once the service worker has the site, a reload still works.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-a]", { timeout: 10000 }).catch(() => note("the sheet didn't open offline"));
  same(await aura(), "4/5", "Aura offline");
  // Rules on tap with no signal: Aura's on the play screen, and a permission's
  // on the sheet.
  await page.click('.cc-stat[data-p="aura"]');
  has(await page.textContent(".cc-panel .cc-rule"), "start every scene full", "Aura's rule on a tap, offline");
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button.cc-perm:has-text("move unseen")');
  has(await page.textContent("#cc-dialog"), "Every line that fits", "a permission's rule on a tap, offline");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await page.click('.cc-tabs a[data-t="rules"]');
  await page.click('.cc-rulebox > summary:text-is("Defend")');
  has(await page.textContent(".cc-rulebox[open]"), "counts twice", "Defend on the Rules tab, offline");
  for (const [title, want] of [["Intercept", "1 Aura"], ["When It Lands", "stops one"]]) {
    const box = page.locator(".cc-rulebox", { has: page.locator(`summary:text-is("${title}")`) });
    if (!(await box.count())) note(`no ${title} on the Rules tab`);
    else {
      await box.locator("summary").click();
      has(await box.textContent(), want, `${title} on the Rules tab, offline`);
    }
  }
  await page.click('.cc-tabs a[data-t="play"]');
  await page.goto(`${BASE}/rules/the-core/`);
  has(await page.textContent("h1"), "The Core", "a rules page offline");
  await page.goBack();
  await page.waitForSelector(".tile[data-a]");
  await context.setOffline(false);

  // Locks split into a d6 and a d4 against a d4: a win, and a tie on a top face.
  await tile("Locks");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  has(await live(), "d6 + d4", "Locks split once");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="4"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 4, 4]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  const outs = await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  same(outs, ["Beat it", "Tie"], "the d6 and the d4 against a 4");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 5 Aura", "1 Aura back for the d4's top face");
  // Two dice, one win: it's a size for the action, however many won.
  same(await swing(), ["d8", "d10"], "Confidence up one size for the action");
  await page.click('#cc-dialog button[data-act="win-tie"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Beat it", "Tie, won for 1 Aura"], "after winning the tie");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Aura after winning the tie");
  same(await swing(), ["d8", "d10"], "still one size up with the tie won too");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Beat it", "Tie"], "after undoing the tie");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 5 Aura", "Aura after the undo");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await conf(), "d10", "Confidence after the Locks roll");

  // Shaken on d2: acting at what the scene's about costs 1 Resolve, and the
  // tracker says so. Pulling herself together takes her action and brings
  // her back to d4.
  await page.click('.cc-stat[data-p="conf"]');
  await page.click('.cc-panel button[data-act="conf"][data-v="2"]');
  has(await page.textContent('.cc-stat[data-p="conf"]'), "Shaken", "the tracker on d2");
  has(await page.textContent(".cc-panel"), "You’re shaken.", "the panel on d2");
  await tile("Fight");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Resolve", "acting while shaken");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await page.click('.cc-panel button[data-act="breath"]');
  same(await conf(), "d4", "pulling herself together, back to d4");
  await page.click('.cc-panel button[data-act="conf"][data-v="12"]');
  has(await page.textContent('.cc-stat[data-p="conf"]'), "Fired up", "the tracker on d12");
  same(await page.$$eval('.cc-panel button[data-act="cash"]', (els) => els.length), 2, "cashing it in on d12, for an action or a heal");
  await page.click('.cc-panel button[data-act="cash"][data-how="action"]');
  same(await conf(), "d6", "cashed in, back to d6");

  // Warded d6 is a step on her Defend, so her 2 steps are 3, a d6.
  await page.click('.cc-stat[data-p="cond"]');
  await page.selectOption('form[data-form="cond"] select[name="pick"]', "Warded");
  await page.selectOption('form[data-form="cond"] select[name="die"]', "6");
  await page.click('form[data-form="cond"] button[type="submit"]');

  // Two guards let ride against her Defend, and her one die stops one of
  // them: the d6's 3 ties her 3, so it's stopped, and the d8's 6 gets through.
  await page.click('.tile[data-act="defence"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "you’re rolling a d6", "her d4 Defend while she's Warded");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 6, 3]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Gets through", "Stopped"], "two blows against her one die");
  same(await page.$$eval("#cc-dialog .res-note", (els) => els.map((el) => el.textContent)), ["no die left for it", "by your 3"], "which die stopped which");
  has(await page.textContent("#cc-dialog .cc-mine-roll"), "Your Defend", "the Warded Defend roll");
  has(await page.textContent("#cc-dialog .cc-mine-roll .res-die"), "d6", "the Warded Defend die");
  // The telegraph her die stopped puts her Confidence up a size.
  same(await swing(), ["d6", "d8"], "Confidence up for the blow she stopped");
  has(await page.textContent("#cc-dialog .cc-swing"), "Your 3 stopped their d6", "why it went up");
  await shot(page, "5-when-it-lands");
  // Her leathers are Common, so they take the blow on their one box and
  // break, and they're off her Defend till they're mended. Her Confidence
  // doesn't move. Armour takes a box, so it's never offered to break outright.
  has(await page.textContent('#cc-dialog button[data-what="box"][data-k="equipment|worn leathers"]'), "Put it on your worn leathers", "her leathers offered to take the blow");
  same(await page.$$eval('#cc-dialog button[data-what="box"][data-k="equipment|worn leathers"] .zd-plate', (els) => els.length), 1, "her Common leathers' one box beside them");
  same(await page.$$eval('#cc-dialog button[data-what="break"][data-k="equipment|worn leathers"]', (els) => els.length), 0, "no breaking her leathers outright");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="box"][data-k="equipment|worn leathers"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Defend d2", "her Defend once her leathers break");
  has(await page.textContent("#cc-dialog .res-paid"), "Your worn leathers took it and broke", "the blow's cost counted on it");
  has(await page.textContent("#cc-dialog .cc-swing"), "Your worn leathers took the blow, so it doesn’t move", "armour taking a blow leaves Confidence alone");
  same(await swing(), ["d6", "d8"], "Confidence once her leathers took the blow");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await tileOf("Defend"), "1 d2", "her Defend tile with her leathers broken");

  await page.click('button[data-act="scene"]');
  same(await aura(), "5/5", "Aura after a new scene");
  same(await conf(), "d6", "Confidence back to d6 in a new scene");
  same(await tileOf("Defend"), "1 d2", "her leathers still broken after a new scene");

  // A tap-in: real dice for her Fight, its d4 meant to pin, against a d8. Her
  // 4 is the d4's top face, so the Aura she spent comes back.
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('.cc-panel button[data-act="aura"][data-d="-1"]');
  same(await aura(), "4/5", "Aura after spending 1");
  await tile("Fight");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="intent"][data-k="0"][data-v="Pin"]');
  await page.click('#cc-dialog button[data-act="go-real"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Your d4 · Pin", "the pad says what the die's for");
  await page.click('#cc-dialog button[data-act="pad"][data-k="p0"][data-v="4"]');
  await page.click('#cc-dialog button[data-act="pad"][data-k="opp"][data-v="3"]');
  await page.click('#cc-dialog button[data-act="pad-done"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Beat it"], "her tapped-in 4 against their 3");
  has(await page.textContent("#cc-dialog .res-intent"), "Pin", "the die's intent on the result");
  has(await page.textContent("#cc-dialog .cc-res"), "Top face", "a top face spotted on a tapped-in die");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 5 Aura", "Aura back for the top face");
  same(await swing(), ["d6", "d8"], "Confidence up with real dice tapped in");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  // Defend with a swap: two d6s, one meant to pin her. Her leathers are
  // mended, and Defending they count twice, so it's 3 steps, split into a d4
  // and a d2. Her 4 and 1 meet their 3 and 3. The phone puts the 4 on the
  // pin, and a swap moves it onto the other blow.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button[data-act="cross"][data-k="equipment|worn leathers"]');
  await page.click('.cc-tabs a[data-t="play"]');
  same(await tileOf("Defend"), "2 d4", "her Defend once her leathers are mended");
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  has(await live(), "3 steps, d6", "Defending, her leathers count twice");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  has(await live(), "d4 + d2", "her split Defending");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.click('#cc-dialog button[data-act="intent"][data-k="d0"][data-v="Pin"]');
  await page.evaluate(() => window.ziCompanion.setDice([4, 1, 3, 3]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  const blows = () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  same(await blows(), ["Stopped", "Gets through"], "the phone's match puts her 4 on the pin");
  same(await swing(), ["d8", "d10"], "Confidence up for the one she stopped");
  await page.click('#cc-dialog button[data-act="d-swap"][data-j="1"]');
  await page.click('#cc-dialog button[data-act="d-swap"][data-j="0"]');
  same(await blows(), ["Gets through", "Stopped"], "after swapping her 4 onto the other blow");
  same(await swing(), ["d8", "d10"], "still one stopped after the swap");
  has(await page.textContent("#cc-dialog .cc-pay"), "Pinned d6", "the pin can land as Pinned d6");
  await shot(page, "6-defend-and-swap");

  // An undo of a Hurt: she takes the pin as a Hurt instead, then takes it back.
  // The wound die going up takes her Confidence down a size.
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="hurt"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Wound d4", "a Hurt from the pin puts her wound die up a size");
  has(await page.textContent("#cc-dialog .res-paid"), "Took a Hurt", "the Hurt counted on the blow");
  same(await swing(), ["d8"], "a stop and a wound step, back where she started");
  has(await page.textContent("#cc-dialog .cc-swing"), "The Hurt put your wound die up to d4", "why the Hurt took it down");
  same(await page.$$eval("#cc-dialog .cc-offers, #cc-dialog .cc-swap", (els) => els.length), 0, "no swaps or +2 once something's paid for");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Wound d2", "the Hurt undone");
  same(await swing(), ["d8", "d10"], "the Hurt's Confidence undone with it");
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"]', (els) => els.length > 0), true, "the blow waiting to be paid again after the undo");
  same(await blows(), ["Gets through", "Stopped"], "the swap still stands after the undo");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await page.textContent('.cc-stat[data-p="wound"] .v'), "d2", "the wound die on the play screen after the undo");
  same(await conf(), "d10", "Confidence on the play screen after the undo");
  // An undo leaves what's been typed alone.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await openFold(page, "notes");
  await page.fill("#cc-notes", "Owes Dorrie a favour");
  await page.click('.cc-tabs a[data-t="play"]');
  await page.click(".cc-track .cc-undo");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.inputValue("#cc-notes"), "Owes Dorrie a favour", "a note kept through an undo");
  await page.click('.cc-tabs a[data-t="play"]');
  await shot(page, "7-play-screen");
  await context.close();
}

// Wren goes at a Marked Warden: her Fight's d8 and the Mark d10 against its d8.
// Both come in under, and her Hunter's +3 on the Mark die makes the 6 a 9.
if (part("3")) {
  const { context, page } = await phone();
  await play(page, "wren");
  await page.click('.tile[data-a]:has(.tile-name:text-is("Fight"))');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
  await page.click('#cc-dialog .cc-mark > summary');
  await page.click('#cc-dialog .cc-chipbtn[data-act="mark"][data-v="10"]');
  has(await page.textContent("#cc-dialog .cc-dice"), "4 steps, d8, and the Mark d10", "Wren's Fight with the Mark die");
  await page.evaluate(() => window.ziCompanion.setDice([5, 6, 7]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Under", "Under"], "Wren's d8 and the Mark d10 against a 7");
  // Every die missed, so her Confidence drops a size, and the +3 that turns
  // it into a win puts it back up instead, in the same undo as the +3.
  const swing = () => page.$$eval("#cc-dialog .cc-swing-head .zd-die", (els) => els.map((e) => e.textContent));
  same(await swing(), ["d6", "d4"], "Confidence down a size when every die missed");
  has(await page.textContent("#cc-dialog .cc-swing"), "Every die missed.", "why it went down");
  await page.click('#cc-dialog button[data-act="plus"]:has-text("Hunter +3 on the Mark die")');
  same(await page.$$eval('#cc-dialog button[data-act="pick"]', (els) => els.length), 1, "only the Mark die takes the Hunter's +3");
  await page.click('#cc-dialog button[data-act="pick"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Under", "Beat it"], "after the +3 on the Mark die");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Wren's Aura after the +3");
  same(await swing(), ["d6", "d8"], "Confidence up once the +3 makes it a win");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  await page.click('#cc-dialog button[data-act="pick-cancel"]');
  same(await swing(), ["d6", "d4"], "the +3 undone, and the miss back with it");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await page.textContent('.cc-stat[data-p="conf"] .v'), "d4", "Wren's Confidence after the miss");
  // On d2 a miss leaves it on d2, as low as it goes, and costs nothing more.
  await page.click('.cc-stat[data-p="conf"]');
  await page.click('.cc-panel button[data-act="conf"][data-v="2"]');
  await page.click('.tile[data-a]:has(.tile-name:text-is("Track"))');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([2, 6]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  has(await page.textContent("#cc-dialog .cc-swing"), "Every die missed, and d2’s as low as it goes, so it stays there.", "a miss on d2");
  same(await swing(), ["d2"], "a miss on d2 leaving it on d2");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same([await page.textContent('.cc-stat[data-p="wound"] .v'), await page.textContent('.cc-stat[data-p="conf"] .v')], ["d2", "d2"], "Wren's wound die and Confidence after a miss on d2");
  await context.close();
}

// Threads at the table. Vesk borrows through her bond thread with Dorrie,
// from the Sheet tab and on a roll, strains it, and can't borrow through it
// strained. Strained twice it snaps, and mended it lends again. Her hostile
// thread with the fence bites like a Catch, doing right by him strains it,
// wronging him again makes it whole, and doing right by him twice snaps it.
if (part("3")) {
  const { context, page } = await phone();
  await play(page, "vesk", "Vesk");
  // The trackers are on the play screen, so on the Sheet tab it's read off what's saved.
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.at(-1).state);
  const aura = async () => `${(await state()).aura}/5`;
  const resolve = async () => `${(await state()).resolve}/2`;
  const chip = (text) => page.textContent(`li.cc-thread:has-text("${text}") .chip`);
  const tab = (t) => page.click(`.cc-tabs a[data-t="${t}"]`);
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const k1 = "Dorrie|We have pulled a dozen jobs. I trust her with my life.";
  const k2 = "Dorrie|We came up on the same streets. She never asks why.";
  const fence = "The fence|I owe a debt I would rather not discuss.";
  const lenders = async () => {
    await tab("play");
    await page.click('.tile[data-a]:has(.tile-name:text-is("Move"))');
    await page.click('#cc-dialog details[data-open="bring"] > summary');
    const who = await page.$$eval('#cc-dialog button[data-act="borrow"]', (els) => els.map((el) => el.dataset.k));
    return who;
  };
  await page.click('.cc-stat[data-p="resolve"]');
  await page.click('.cc-panel button[data-act="resolve"][data-d="-1"]');
  await page.click('.cc-panel button[data-act="resolve"][data-d="-1"]');
  await tab("sheet");
  same(await chip("We have pulled a dozen jobs"), "Bond", "her bond thread with Dorrie to start");
  same(await chip("I owe a debt I would rather not discuss."), "Hostile", "her hostile thread with the fence to start");
  await inFold(page, `button[data-act="tborrow"][data-k="${k1}"]`);
  has(await page.textContent("#cc-toast"), "You borrow one of Dorrie’s permissions for 1 Aura", "borrowing through a bond thread");
  same(await aura(), "4/5", "Aura after borrowing through a thread");
  await inFold(page, `button[data-act="strain"][data-k="${k1}"]`);
  same([await chip("We have pulled a dozen jobs"), await resolve()], ["Bond, strained", "1/2"], "a bond thread strained for 1 Resolve");
  has(await page.textContent("#cc-toast"), "Tell Dorrie’s player, so it’s strained on their sheet too.", "telling Dorrie's player");
  same(await page.$$eval(`button[data-act="tborrow"][data-k="${k1}"]`, (els) => els.length), 0, "no borrowing through a strained thread");
  // On a roll, Dorrie still lends through her other thread: 1 Aura and a step.
  same((await lenders()).includes("Dorrie"), true, "Dorrie lending through the thread that isn't strained");
  await page.click('#cc-dialog button[data-act="borrow"][data-k="Dorrie"]');
  has(await page.textContent("#cc-dialog .cc-dice"), "5 steps, d10", "her Move with one of Dorrie’s permissions borrowed");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "what borrowing costs on a roll");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await closed();
  await tab("sheet");
  await inFold(page, `button[data-act="strain"][data-k="${k2}"]`);
  const now = await lenders();
  same([now.includes("Dorrie"), now.includes("Bram")], [false, true], "nothing through Dorrie with both strained, and Bram still lending");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await closed();
  await tab("sheet");
  await inFold(page, `button[data-act="strain"][data-k="${k1}"]`);
  same(await chip("We have pulled a dozen jobs"), "Snapped", "strained again before it's mended, it snaps");
  same(await page.$$eval(`li.cc-thread.is-snapped button`, (els) => els.length), 0, "nothing to do with a snapped thread");
  await inFold(page, `button[data-act="mend"][data-k="${k2}"]`);
  same(await chip("We came up on the same streets"), "Bond", "mended, and whole again");
  // The fence: a hostile thread bites like a Catch.
  await inFold(page, `button[data-act="bite"][data-big="0"][data-k="${fence}"]`);
  same(await aura(), "5/5", "Aura when the fence brings real trouble");
  await inFold(page, `button[data-act="bite"][data-big="1"][data-k="${fence}"]`);
  has(await page.textContent("#cc-toast"), "A big bite. Your Resolve’s already full.", "a big bite with Resolve full");
  await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    all.characters.at(-1).state.resolve = 1;
    localStorage.setItem("zi-characters", JSON.stringify(all));
  });
  await page.reload();
  await page.waitForSelector(".cc-page");
  await inFold(page, `button[data-act="bite"][data-big="1"][data-k="${fence}"]`);
  has(await page.textContent("#cc-toast"), "A big bite. You take 1 Resolve.", "a big bite from a hostile thread");
  same(await resolve(), "2/2", "Resolve after the big bite");
  same(await page.$$eval(`button[data-act="strain"][data-k="${fence}"], button[data-act="tborrow"][data-k="${fence}"]`, (els) => els.length), 0, "no straining a hostile thread for Resolve, and nothing to borrow");
  await inFold(page, `button[data-act="right"][data-k="${fence}"]`);
  same(await chip("I owe a debt I would rather not discuss."), "Hostile, strained", "doing right by the fence strains it");
  await inFold(page, `button[data-act="wrong"][data-k="${fence}"]`);
  same(await chip("I owe a debt I would rather not discuss."), "Hostile", "wronging him again makes it whole");
  await inFold(page, `button[data-act="right"][data-k="${fence}"]`);
  await inFold(page, `button[data-act="right"][data-k="${fence}"]`);
  same(await chip("I owe a debt I would rather not discuss."), "Snapped", "doing right by him twice snaps it");
  has(await page.textContent("#cc-toast"), "the grudge is over", "the grudge over");
  await page.click(".cc-tabs a[data-t=\"play\"]");
  await page.click(".cc-track .cc-undo");
  await tab("sheet");
  same(await chip("I owe a debt I would rather not discuss."), "Hostile, strained", "an undo takes the snap back");
  await shot(page, "threads");
  await context.close();
  console.log("threads: borrowed through and strained, snapped and mended, and a hostile thread biting, strained, whole again and snapped");
}

// 4. Wounds. Two Hurts make Vesk's wound die a d6, and at the end of the
// scene she rests: her d6 Confidence rolls 5 against its 4, so it's a d4.
// Then a tie, which goes to the wound, rolled again for 1 Resolve, and one
// undo takes the rest and the new scene back. Four more Hurts and she
// Blazes, and the wound becomes a Scar in her own words, with the wound die
// never below d4. Bram's first Hurt a scene doesn't move his wound die
// (Unyielding), and against three goblins his Defend counts twice: 7 steps,
// split into two d6s and a d2, and his Guardian +2 stops the last one.
// Dorrie meets fear with her d6 Confidence as it is (no Defend against fear), and a hit
// while she's Exposed is two Hurts. Characters saved with the old Hurt track
// and Armour open clean.
// 3c. Bram's armour.
if (part("3c")) {
  const { context, page } = await phone();
  await play(page, "bram", "Bram");
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.at(-1).state);
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const sheetTab = async () => {
    await page.click('.cc-tabs a[data-t="sheet"]');
    await openFold(page, "kit");
  };
  const boxes = (key) => page.$$eval(`.cc-armour .cc-box[data-k="${key}"]`, (els) => els.map((el) => el.getAttribute("aria-pressed")));
  const axe = async (what) => {
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
  };
  same(await tileOf("Defend"), "4 d8", "Bram's Defend with his plate and shield");

  // The Sheet tab: each piece with its quality and a box for every blow.
  await sheetTab();
  has(await page.textContent('details[data-open="sh-kit"] > summary'), "Fine plate armour", "his plate's quality at a glance");
  has(await page.textContent('.cc-armour:has([data-k="equipment|plate armour"]) .cc-thing'), "Fine", "his plate's quality on its row");
  same(await boxes("equipment|plate armour"), ["false", "false"], "his Fine plate's two boxes");
  same(await boxes("equipment|a shield"), ["false"], "his Common shield's one box");
  await page.click('.cc-box[data-k="equipment|plate armour"][data-n="2"]');
  same(await boxes("equipment|plate armour"), ["true", "true"], "the second box ticks the first with it");
  has(await page.textContent("#cc-toast"), "That’s the last box on your Fine plate armour, so it’s broken till it’s mended.", "the toast when it breaks");
  same((await state()).crossed["equipment|plate armour"], true, "his plate broken once both boxes are ticked");
  await page.click('.cc-box[data-k="equipment|plate armour"][data-n="2"]');
  same(await boxes("equipment|plate armour"), ["true", "false"], "tapping a ticked box clears it");
  same([(await state()).crossed["equipment|plate armour"], (await state()).boxes["equipment|plate armour"]], [undefined, 1], "his plate whole again with one box ticked");
  await page.click('.cc-box[data-k="equipment|plate armour"][data-n="1"]');
  same(await boxes("equipment|plate armour"), ["false", "false"], "and the first, clear again");

  // A blow gets through and his plate takes it: one of its two boxes, and
  // it's still on his Defend, so that's still a d8.
  await page.click('.cc-tabs a[data-t="play"]');
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 6]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"][data-what="box"]', (els) => els.map((el) => [el.dataset.k, el.querySelectorAll(".zd-plate").length])), [["equipment|plate armour", 2], ["equipment|a shield", 1]], "his plate and shield offered, with their boxes");
  await page.locator("#cc-dialog .cc-pay").first().scrollIntoViewIfNeeded();
  await shot(page, "armour-pay");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="box"][data-k="equipment|plate armour"]');
  has(await page.textContent("#cc-dialog .res-paid"), "Your plate armour took it: 1 of 2 ticked", "his plate taking the blow");
  has(await page.textContent("#cc-dialog .cc-swing"), "Your plate armour took the blow, so it doesn’t move", "his Confidence left alone");
  has(await page.textContent("#cc-dialog .dlg-body"), "Defend d8", "his plate still on his Defend with a box ticked");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await tileOf("Defend"), "4 d8", "his Defend tile with one box ticked");

  // Exposed: a hit that gets through is two Hurts, so two boxes, his plate's
  // last and his shield's, and both break.
  await page.click('.cc-stat[data-p="cond"]');
  await page.selectOption('form[data-form="cond"] select[name="pick"]', "Exposed");
  await page.click('form[data-form="cond"] button[type="submit"]');
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([2, 7]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="box"][data-k="equipment|plate armour"]');
  has(await page.textContent("#cc-dialog .cc-more"), "It’s one more, since you’re Exposed.", "the vulnerability's one more");
  same(await page.$$eval('#cc-dialog .cc-more button[data-act="d-pay"]', (els) => els.map((el) => el.dataset.what + (el.dataset.k ? `:${el.dataset.k}` : ""))), ["vuln", "vbox:equipment|a shield"], "another Hurt, or his shield, for the one more");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="vbox"][data-k="equipment|a shield"]');
  has(await page.textContent("#cc-dialog .res-paid"), "Your plate armour took it and broke, and your shield took one more and broke", "both pieces taking the hit that's two Hurts");
  same((await page.textContent("#cc-dialog .res-paid")).length <= 80, true, "short enough for the GM's phone to keep whole");
  has(await page.textContent("#cc-dialog .dlg-body"), "Defend d4", "his Defend with his plate and shield broken");
  same((await state()).wound, 2, "his wound die never moved");
  await shot(page, "armour-when-it-lands");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  same(await page.$$eval('#cc-dialog .cc-more button[data-act="d-pay"]', (els) => els.length), 2, "the one more waiting again after an undo");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="vbox"][data-k="equipment|a shield"]');
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await tileOf("Defend"), "2 d4", "his Defend tile with his plate and shield broken");
  await page.reload();
  await page.waitForSelector(".tile[data-a]");
  same(await tileOf("Defend"), "2 d4", "both still broken after a reload");

  // Downtime: one slot mends his plate, both boxes clear, and it's back on
  // his Defend. The shield waits for another slot.
  await page.click('button[data-act="downtime"]');
  const dt = (attrs) => page.click(`#cc-dialog button[data-act="dt"]${attrs}`);
  await dt('[data-do="pick"][data-s="0"][data-v="mend"]');
  same(await page.$$eval('#cc-dialog button[data-do="set"][data-s="0"][data-f="key"]', (els) => els.map((el) => el.dataset.v)), ["equipment|plate armour", "equipment|a shield"], "his plate and shield to mend");
  await dt('[data-do="set"][data-s="0"][data-f="key"][data-v="equipment|plate armour"]');
  await dt('[data-do="pick"][data-s="1"][data-v="pressure"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "Answer the captain's letter");
  await dt('[data-do="finish"]');
  await closed();
  has(await page.textContent("#cc-toast"), "Your Fine plate armour is mended, every box clear", "the toast for his mended plate");
  same(await tileOf("Defend"), "3 d6", "his Defend with his plate mended and his shield still broken");
  await sheetTab();
  same(await boxes("equipment|plate armour"), ["false", "false"], "his plate's boxes clear after downtime");
  same(await boxes("equipment|a shield"), ["true"], "his shield still broken");

  // In one hand, in both themes: every box 44px, nothing sideways, and axe.
  await page.evaluate(() => document.getElementById("cc-toast")?.classList.remove("show"));
  await page.evaluate(() => document.querySelector(".cc-armour")?.scrollIntoView({ block: "center" }));
  for (const theme of ["dark", "light"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    const small = await page.$$eval(".cc-armour button", (els) => els.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length);
    same(small, 0, `armour's buttons 44px or more, ${theme}`);
    same(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `no sideways scroll on the Sheet tab, ${theme}`);
    await axe(`Bram's kit, ${theme}`);
    await shot(page, `armour-sheet-${theme}`);
  }
  await context.close();
  console.log("armour: Bram's plate and shield a box at a time, two Hurts, an undo and downtime");
}

if (part("4")) {
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  const { context, page } = await phone();
  const wound = () => page.textContent('.cc-stat[data-p="wound"] .v');
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const outs = () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  const swing = () => page.$$eval("#cc-dialog .cc-swing-head .zd-die", (els) => els.map((e) => e.textContent));
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);
  const hurt = async (n = 1) => {
    if (!(await page.isVisible('.cc-panel button[data-act="hurt"][data-d="1"]'))) await page.click('.cc-stat[data-p="wound"]');
    for (let i = 0; i < n; i++) await page.click('.cc-panel button[data-act="hurt"][data-d="1"]');
  };

  await play(page, "vesk", "Vesk");
  const conf = () => page.textContent('.cc-stat[data-p="conf"] .v');
  await hurt(2);
  same(await wound(), "d6", "Vesk's wound die after two Hurts");
  same(await page.getAttribute(".t-wound .zd-die", "data-d"), "6", "the wound die drawn as a d6, a square");
  // Each size the wound die goes up takes her Confidence down a size.
  same(await conf(), "d2", "two Hurts take her Confidence from d6 to d2");
  has(await page.textContent("#cc-toast"), "Your Confidence drops to d2.", "the Hurt's toast saying so");
  // She pulls herself together, then takes a breath, before the scene ends.
  await page.click('.cc-stat[data-p="conf"]');
  await page.click('.cc-panel button[data-act="breath"]');
  await page.click('.cc-panel button[data-act="breath"]');
  same(await conf(), "d6", "back to d4, then a breath up to d6");
  same(await page.$$eval('.cc-panel button[data-act="breath"]', (els) => els.length), 0, "no breath to take on d6");
  await page.click('.cc-stat[data-p="conf"]');
  await page.click('button[data-act="scene"]');
  has(await page.textContent("#dlg-title"), "End of the scene", "the rest at the end of a scene");
  has(await live(), "Your Confidence, d6, against your wound die, d6", "what the rest rolls");
  await page.evaluate(() => window.ziCompanion.setDice([5, 4]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Your 5 beats its 4, so your wound’s a d4 for the next scene", "a rest that wins");
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await closed();
  same(await wound(), "d4", "the wound die after a rest");
  has(await page.textContent("#cc-toast"), "You rested, and your wound’s down to d4.", "the rest's toast");
  await hurt();
  same(await conf(), "d4", "a Hurt in the new scene takes her Confidence to d4");
  await page.click('button[data-act="scene"]');
  has(await live(), "Your Confidence, d4, against your wound die, d6", "the rest rolling the Confidence she finished on");
  await page.evaluate(() => window.ziCompanion.setDice([3, 3]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "a tie goes to the wound, so it stays a d6", "a rest that ties");
  await page.evaluate(() => window.ziCompanion.setDice([4]));
  await page.click('#cc-dialog button[data-act="rest-again"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Your 4 beats its 3", "the rest rolled again, against the same 3");
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await closed();
  same([await wound(), await page.textContent('.cc-stat[data-p="resolve"] .v')], ["d4", "2/2"], "the wound die and Resolve after a rest rolled again for 1 Resolve");
  await page.click(".cc-track .cc-undo");
  same(await wound(), "d6", "one undo takes the rest and the new scene back");
  await page.click(".cc-track .cc-undo");

  // A Hurt at d12 Blazes, and the wound becomes a Scar. Her Confidence
  // stops at d2 on the way: nothing takes it lower.
  await hurt(4);
  same(await wound(), "d12", "Vesk on d12");
  same(await conf(), "d2", "her Confidence at d2 and no lower after four more Hurts");
  await hurt();
  has(await page.textContent('form[data-form="scar"]'), "You Blaze", "a Hurt at d12 Blazes");
  await page.fill('form[data-form="scar"] input[name="scar"]', "a spear through the shoulder");
  await page.click('form[data-form="scar"] button[type="submit"]');
  same(await wound(), "d4", "her wound die after the Scar");
  same(await page.$$eval(".t-wound .zd-scars i.on", (els) => els.length), 1, "the Scar beside the wound die");
  has(await page.textContent(".cc-panel"), "a spear through the shoulder", "the Scar in her own words");
  same(await page.isDisabled('.cc-panel button[data-act="hurt"][data-d="-1"]'), true, "no healing below the Scar");
  await page.click('.cc-tabs a[data-t="sheet"]');
  has(await page.textContent("#app"), "a spear through the shoulder", "the Scar with her Catches");
  await page.click('.cc-tabs a[data-t="play"]');

  // Bram: Unyielding, then three goblins at Vesk, Wren and Isolde, all
  // intercepted for free. He Defends: 7 steps, split into 2d6 and a d2.
  await play(page, "bram", "Bram");
  await hurt();
  same(await wound(), "d2", "Bram's first Hurt this scene, which Unyielding keeps off his wound die");
  has(await page.textContent("#cc-toast"), "doesn’t move your wound die (Unyielding), so your Confidence doesn’t move either", "what Unyielding says");
  same(await conf(), "d6", "Bram's Confidence after a Hurt that Unyielding took");
  await hurt();
  same(await wound(), "d4", "Bram's second Hurt this scene");
  same(await conf(), "d4", "Bram's Confidence once his wound die goes up");
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  has(await live(), "7 steps, d12 + d2", "Bram Defending, his three lines counting twice");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  await page.click('#cc-dialog button[data-act="shape"]:text-is("2d6 + d2")');
  has(await live(), "7 steps, 2d6 + d2", "Bram's d12 split into two d6s");
  for (let i = 0; i < 3; i++) await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 4, 2, 6, 4, 1]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await outs(), ["Gets through", "Stopped", "Stopped"], "his 5, 4 and 2 against their 6, 4 and 1");
  same(await swing(), ["d4", "d8"], "two stopped, two sizes up");
  await page.click('#cc-dialog button[data-act="plus"]:has-text("Guardian +2")');
  await page.click('#cc-dialog button[data-act="d-pick"][data-i="0"]');
  same(await outs(), ["Stopped", "Stopped", "Stopped"], "his Guardian +2 making the 5 a 7");
  has(await page.textContent("#cc-dialog .dlg-body"), "Nothing gets through.", "nothing gets through Bram");
  same(await swing(), ["d4", "d10"], "Bram stopping three blows, three sizes up");
  same(await page.$$eval("#cc-dialog .cc-swing li", (els) => els.length), 3, "a line for every blow he stopped");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await conf(), "d10", "Bram's Confidence after his three goblins");

  // Fear: Dorrie's Confidence rolls as it is, Defending or not, so her d6 is
  // 3 steps against a d10 and a d8. Nobody can intercept fear for her.
  await play(page, "dorrie", "Dorrie");
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-against"][data-v="confidence"]');
  has(await live(), "3 steps, d6", "Dorrie's Confidence as it is");
  same(await page.$$eval('#cc-dialog button[data-act="d-defend"]', (els) => els.length), 0, "no Defend to double her Confidence");
  has(await page.textContent("#cc-dialog .dlg-body"), "Your Confidence rolls as it is, whether you Defend or not.", "why there's no Defend for fear");
  has(await page.textContent("#cc-dialog .dlg-body"), "Nobody can intercept fear, lies or pressure", "no intercepting fear");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="10"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="intent"][data-k="d1"][data-v="Frighten"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 4, 6]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await outs(), ["Stopped", "Gets through"], "her 5 against the fear's 4 and 6");
  same(await swing(), ["d6", "d8"], "the fear she stopped putting her up a size");
  const pay = await page.textContent("#cc-dialog .cc-pay");
  for (const want of ["Frightened d8", "Confidence down a size, to d6", "Hold your ground: 1 Resolve"]) has(pay, want, "what the fear that got through can cost");
  same(/Bury|Hurt/.test(pay), false, "no burying fear as a Hurt");
  // Through: it takes a size of Confidence. Then held instead, for 1 Resolve.
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="shake"]');
  same(await swing(), ["d6"], "up for the one she stopped, down for the one that got through");
  has(await page.textContent("#cc-dialog .cc-swing"), "Their d8 got through", "why it came back down");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="hold"]');
  same(await swing(), ["d6", "d8"], "holding her ground keeps it at d8");
  has(await page.textContent("#cc-dialog .cc-swing"), "You held your ground against their d8", "the hold in the list");
  has(await page.textContent("#cc-dialog .dlg-body"), "1 Resolve", "Resolve after holding her ground");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await conf(), "d8", "Dorrie's Confidence after the fear");
  // Exposed: she's vulnerable to every hit, so one that gets through is two
  // Hurts, and two sizes off her Confidence.
  await page.click('.cc-stat[data-p="cond"]');
  await page.selectOption('form[data-form="cond"] select[name="pick"]', "Exposed");
  await page.click('form[data-form="cond"] button[type="submit"]');
  await page.click('.tile[data-act="defence"]');
  same(await page.getAttribute('#cc-dialog button[data-act="d-cond"][data-k="Exposed"]', "aria-pressed"), "false", "Exposed isn't a step against her Defend");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([1, 7]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="hurt"]');
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="vuln"]');
  has(await page.textContent("#cc-dialog .res-paid"), "Took 2 Hurts", "one hit, two Hurts, while she's Exposed");
  same(await swing(), ["d8", "d4"], "two Hurts at once, two sizes off her Confidence");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await wound(), "d6", "Dorrie's wound die after a hit while she's Exposed");

  // Saved before the wound die: an old Hurt track and Armour. Her sheet was
  // seen before 26 Oct too, with two attuned things and a debt.
  const vesk = book.crew.find((c) => c.id === "vesk");
  const seen = said(vesk);
  delete seen["num:wound"];
  delete seen["act:Defend"];
  Object.assign(seen, { "num:armour": "Armour d4 (worn leathers)", "num:hurt": "3 Hurt bars" });
  Object.assign(seen, { "att:0": "A perfect set of picks, Awakened", "att:0:0": "open any lock with a mechanism", "att:1": "A grappling line, Awakened", "att:1:0": "climb or swing anywhere you can throw a hook",
    "thr:The fence:0": "I owe a debt I would rather not discuss. (debt)", "thr:Wren:0": "I owe her for the night she hid me from the watch. (Wren’s, a debt)" });
  // A character built before 26 Oct: a debt thread, another thread, and two attuned things.
  const debtBuild = { v: 2, titles: [{ arch: "Shadow", idea: "", text: "The quietest knife in the Low Market", on: ["Sneak"], perms: [{ text: "move unseen", on: ["Sneak"] }] }], traits: [], actions: ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"],
    equipment: [], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [{ name: "A bone whistle", stage: "Awakened", catch: "", burden: "", perms: [{ text: "call a stray dog to me", on: [] }] }, { name: "A lucky coin", stage: "Awakened", catch: "", burden: "", perms: [{ text: "know which way to run", on: ["Move"] }] }],
    threads: [{ person: "The fence", text: "I owe him for the Vane job.", debt: true, whose: "" }, { person: "Dorrie", text: "She taught me to pick a lock.", debt: false, whose: "" }], connect: [], aspiration: "Pay the fence back", name: "Kit", pronoun: "them" };
  const old = { v: 1, characters: [
    { id: "old-vesk", crew: "vesk", name: "Old Vesk", hash: vesk.hash, state: { aura: 3, resolve: 1, conf: 6, armour: 2, hurt: 4, catches: ["twisted ankle"], scars: 1, blaze: false, dead: false, conditions: [], threads: {}, used: {}, crossed: {}, picked: [], asp: 2, aspText: "", notes: "Owes the fence", last: null, seen } },
    { id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a chain shirt", on: [], armour: true }, { text: "a sword", on: ["Fight"], armour: false }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [], connect: [], aspiration: "Win the duel", name: "Tamsin", pronoun: "her" }, state: { aura: 5, resolve: 1, conf: 6, armour: 4, hurt: 0, catches: [], scars: 0 } },
    { id: "own-debt", crew: "own", name: "Kit", hash: "own", build: debtBuild, state: { aura: 5, resolve: 1, conf: 6, wound: 2, scars: [], threads: { "The fence|I owe him for the Vane job.": "strained" } } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(old));
  await page.goto(`${BASE}/characters/?c=old-vesk`);
  await page.waitForSelector(".tile[data-a]");
  same(await wound(), "d12", "four old Hurts on top of a Scar make her wound die a d12");
  same(await page.$$eval(".t-wound .zd-scars i.on", (els) => els.length), 1, "her old Scar beside the wound die");
  has(await page.textContent(".cc-note.is-gold"), "Armour d4 (worn leathers)", "the gold note naming the Armour die as gone");
  same(await page.$eval('.tile[data-a]:has(.tile-name:text-is("Defend"))', (el) => el.classList.contains("is-changed")), true, "a gold corner on her new Defend");
  await page.click('.cc-stat[data-p="wound"]');
  await page.fill('.cc-panel form[data-form="scar-text"] input', "a burn across the back");
  await page.click('.cc-panel form[data-form="scar-text"] button[type="submit"]');
  has(await page.textContent(".cc-panel"), "a burn across the back", "her old Scar written in as a Catch");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.inputValue("#cc-notes"), "Owes the fence\nFrom the old Hurt track: twisted ankle.", "her old Hurt Catch kept in Notes");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === "old-vesk").state);
  same(["hurt", "catches", "armour"].filter((k) => k in st), [], "nothing left of the old Hurt track or Armour once she's saved");
  same([st.wound, st.scars], [12, ["a burn across the back"]], "her wound die and Scar, saved");
  await page.goto(`${BASE}/characters/?c=own-old`);
  await page.waitForSelector(".tile[data-a]");
  same(await page.$$eval(".tile[data-a] .tile-name", (els) => els.map((e) => e.textContent)), ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"], "an old build gets Defend before Fight");
  same(await tileOf("Defend"), "2 d4", "an old build's chain shirt on her Defend");
  same(await wound(), "d2", "an old build's wound die");
  // Old Vesk's threads and attuned things: what the rules changed has gold marks.
  await page.goto(`${BASE}/characters/?c=old-vesk&t=sheet`);
  await page.waitForSelector(".cc-page");
  const golds = await page.$$eval(".cc-gold", (els) => els.map((el) => el.dataset.k));
  for (const k of ["thr:The fence:0", "thr:Wren:0", "att:0", "att:0:0"]) same(golds.includes(k), true, `a gold mark on Old Vesk's ${k}`);
  has(await page.textContent(".cc-note.is-gold"), "A grappling line, Awakened", "the attuned thing that's gone, named in the note");
  await page.click('.cc-gold[data-k="thr:The fence:0"]');
  const fence = await page.textContent('li.cc-thread:has(.cc-gold[data-k="thr:The fence:0"]) .cc-was');
  has(fence, "Was I owe a debt I would rather not discuss. (debt)", "the fence's thread as it was");
  has(fence, "Now I owe a debt I would rather not discuss. (hostile)", "the fence's thread as it is now");
  // A built character's debt is a hostile thread now, her other thread's a
  // bond, and both her attuned things are still there.
  await page.goto(`${BASE}/characters/?c=own-debt&t=sheet`);
  await page.waitForSelector(".cc-page");
  same(await page.$$eval("li.cc-thread .chip", (els) => els.map((e) => e.textContent)), ["Hostile, strained", "Bond"], "an old debt thread, hostile and still strained, and an old thread as a bond");
  has(await page.textContent("#app"), "A lucky coin", "an old build's second attuned thing kept");
  has(await page.textContent("#app"), "A bone whistle", "an old build's first attuned thing kept");
  same(await page.$$eval(".cc-note.is-warn", (els) => els.length), 0, "the old build opening clean");
  console.log("wounds: a rest won and one rolled again, a Blaze into a Scar, Unyielding, Bram's three goblins, Dorrie's fear stopped, through and held, Exposed, and three old saves");
  await context.close();
}

// 5. Building your own.
if (part("5")) {
  const md = readFileSync("content/rules/03b-title-ideas-and-the-crew.md", "utf8");
  const block = md.match(/^:::sheet\[Vesk: [^\]]+\]\n([\s\S]*?)\n:::$/m)[1];
  const want = block.match(/^\*\*Set actions:\*\* (.+)$/m)[1].replace(/\.$/, "").split(" · ").map((s) => {
    const x = s.match(/^(.+?) (\d+) \(([^)]+)\)/);
    return [x[1], Number(x[2]), x[3]];
  }).sort();
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
  // Every step's a tap away, from the bar.
  const jump = async (s) => {
    await page.click(".bd-jump > summary");
    await page.click(`.bd-dot[data-s="${s}"]`);
  };
  const tiles = async () => (await page.$$eval(".tile[data-a]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, parseInt(el.querySelector(".tile-steps").textContent, 10), el.querySelector(".tile-die").textContent]))).sort();

  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="bopen"]');
  has(await step(), "Archetypes", "the builder's first step");
  // A Title at a time: its archetype from the cards, then a Title idea, and
  // Next goes on to the second Title before the next step.
  await b('[data-b="arch"][data-t="0"][data-v="Shadow"]');
  same(await page.$$eval('[data-b="arch"]', (els) => els.length), 0, "the archetype cards folded away to the one picked");
  await b('[data-b="idea"][data-t="0"][data-v="k-rogue"]');
  await next("Archetypes");
  same(await page.getAttribute('.bd-seg[data-t="1"]', "aria-current"), "true", "Next going on to the second Title first");
  await b('[data-b="arch"][data-t="1"][data-v="Shadow"]');
  await b('[data-b="idea"][data-t="1"][data-v="k-rogue"]');
  has(await page.textContent(".bd-body"), "Shadow twice, so your +2 is a +3", "two Shadows");
  same(await page.$$eval(".bd-head .zd-crest.twice", (els) => els.length), 1, "the crest at the top doubled for Shadow twice");
  await shot(page, "5-builder-archetypes");
  await next("Titles and permissions");
  await b('[data-b="title"][data-t="0"][data-v="The best cat burglar in the city"]');
  for (const p of ["move unseen", "run the rooftops", "pick a mechanical lock"]) await b(`[data-b="perm"][data-t="0"][data-v="${p}"]`);
  await next("Titles and permissions");
  await b('[data-b="title"][data-t="1"][data-v="Raised by the Guild"]');
  await b('[data-b="perm"][data-t="1"][data-v="know how a lock’s built"]');
  await page.fill("#b-t1-p1", "fight dirty with a knife");
  await page.fill("#b-t1-p2", "find a buyer for anything");
  await next("Traits");
  await b('[data-b="trait"][data-v="Silent Step"]');
  await b('[data-b="trait"][data-v="Light on my Feet"]');
  has(await page.textContent(".bd-body .cc-note"), "picked 2 of 2", "two traits");
  await next("Set actions");
  await page.fill("#b-newact", "Locks");
  await b('[data-b="addact"]');
  // Her traits never go on a set action: a trait's never a step.
  same(await page.$$eval('[data-b="on"][data-l^="r"]', (els) => els.length), 0, "no trait to put on a set action");
  const on = { t0: ["Sneak", "Move", "Locks"], "p0.0": ["Sneak"], "p0.1": ["Move"], "p0.2": ["Locks"], "p1.0": ["Locks"], "p1.1": ["Fight"] };
  for (const [l, list] of Object.entries(on)) for (const a of list) await b(`[data-b="on"][data-l="${l}"][data-a="${a}"]`);
  has(await page.textContent('.bd-tiles .tile:has(.tile-name:text-is("Sneak"))'), "3 steps", "Sneak with her first Title and move unseen");
  same(await page.getAttribute('.bd-rail .tile-dice[data-for="Sneak"] .zd-die', "data-d"), "6", "Sneak drawn as the d6 it rolls");
  // A permission goes on two set actions at most: a third is refused, with
  // why, and the rest look full until one comes off.
  await b('[data-b="on"][data-l="p0.0"][data-a="Move"]');
  same(await page.$$eval(".bd-lines .cc-warn", (els) => els.length), 0, "a permission on two set actions");
  same(await page.getAttribute('[data-b="on"][data-l="p0.0"][data-a="Defend"]', "aria-disabled"), "true", "the rest look full once it's on two");
  // It's marked unavailable but still answers a tap, to say why.
  await page.click('button[data-act="b"][data-b="on"][data-l="p0.0"][data-a="Defend"]', { force: true });
  same(await page.getAttribute('[data-b="on"][data-l="p0.0"][data-a="Defend"]', "aria-pressed"), "false", "a third set action refused");
  has(await page.textContent("#cc-toast"), "“move unseen” is on two set actions already, and two’s the most a permission goes on.", "why a third is refused");
  has(await page.textContent('.bd-tiles .tile:has(.tile-name:text-is("Defend"))'), "1 step", "Defend without move unseen on it");
  await b('[data-b="on"][data-l="p0.0"][data-a="Move"]');
  same(await page.getAttribute('[data-b="on"][data-l="p0.0"][data-a="Defend"]', "aria-disabled"), null, "room again once it's off one");
  same(await page.$$eval(".bd-lines .cc-warn", (els) => els.length), 0, "back on one set action");
  await shot(page, "6-builder-set-actions");
  await next("What you carry");
  // What she carries, a part at a time, picked from cards.
  await b('[data-b="fillany"][data-k="e"][data-v="worn leathers"]');
  same(await page.getAttribute('[data-b="on"][data-l="e0"][data-a="Defend"]', "aria-pressed"), "true", "worn leathers going straight on her Defend");
  same(await page.getAttribute('.bd-rail .tile-dice[data-for="Defend"] .zd-die', "data-d"), "4", "Defend a d4 with her leathers on it");
  // A plain thing goes on one set action, so tapping another moves it there.
  const leathersOn = () => page.$$eval('[data-b="on"][data-l="e0"][aria-pressed="true"]', (els) => els.map((el) => el.dataset.a));
  await b('[data-b="on"][data-l="e0"][data-a="Fight"]');
  same(await leathersOn(), ["Fight"], "her leathers moved to Fight, and off her Defend");
  await b('[data-b="on"][data-l="e0"][data-a="Defend"]');
  same(await leathersOn(), ["Defend"], "and back on her Defend, alone");
  // Armour picks its quality, each with the boxes it gives, and it's Common
  // to start. Fine and back again.
  const qualities = () => page.$$eval(".bd-quality .bd-qual", (els) => els.map((el) => [el.textContent.trim(), el.getAttribute("aria-pressed"), el.querySelectorAll(".zd-plate").length]));
  same(await qualities(), [["Common", "true", 1], ["Fine", "false", 2], ["Masterwork", "false", 3]], "her leathers' quality, Common to start");
  await b('[data-b="quality"][data-i="0"][data-v="2"]');
  same((await qualities()).map((q) => q[1]), ["false", "true", "false"], "her leathers made Fine");
  await b('[data-b="quality"][data-i="0"][data-v="1"]');
  same((await qualities()).map((q) => q[1]), ["true", "false", "false"], "and Common again, like her sheet");
  await next("What you carry");
  same(await page.getAttribute('.bd-seg[data-v="u"]', "aria-current"), "true", "Next going on to her utility items");
  await b('[data-b="fillany"][data-k="u"][data-v="Purse of gold"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Smoke bomb"]');
  // Her picks are an ordinary utility item now, still on her Locks, and she
  // attunes one thing: her grappling line.
  await page.fill("#b-u2", "a perfect set of picks");
  await b('[data-b="on"][data-l="u2"][data-a="Locks"]');
  await next("What you carry");
  await page.fill("#b-k", "the first coin she ever stole");
  await next("What you carry");
  has(await page.textContent("#bd-at"), "Attune one thing", "one attuned thing at the start");
  same(await page.$$eval('[data-b="addatt"], #b-a1-name', (els) => els.length), 0, "nothing offering a second attuned thing at the start");
  await page.fill("#b-a0-name", "A grappling line");
  await page.fill("#b-a0-p0", "climb or swing anywhere you can throw a hook");
  await b('[data-b="on"][data-l="a0.0"][data-a="Move"]');
  await next("Threads");
  // Threads from the crew questions: each one's a card, and an answer
  // becomes a bond thread or a hostile one in a tap.
  same(await page.$$eval(".bd-thread", (els) => els.map((el) => el.querySelector('[aria-pressed="true"]').textContent)), ["Bond", "Bond", "Hostile"], "two bond threads and a hostile one to start");
  same(await page.$$eval("details.bd-q[open]", (els) => els.length), 0, "the crew questions shut until one's wanted");
  await page.click('details[data-open="bd-q-0"] > summary');
  await page.fill("#b-cq0", "Dorrie. We have pulled a dozen jobs. I trust her with my life.");
  await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
  same([await page.inputValue("#b-th0-person"), await page.inputValue("#b-th0-text")], ["Dorrie", "We have pulled a dozen jobs. I trust her with my life."], "an answer made into her first bond thread");
  has(await page.textContent('details[data-open="bd-q-0"] > summary'), "Bond thread", "the question saying it's a bond thread now");
  await page.fill("#b-th1-person", "Bram");
  await page.fill("#b-th1-text", "He once carried me out of a fire. I have never said thank you.");
  await page.click('details[data-open="bd-q-1"] > summary');
  await page.fill("#b-cq1", "The fence. I owe a debt I would rather not discuss.");
  await b('[data-b="fromq"][data-q="1"][data-v="hostile"]');
  same([await page.inputValue("#b-th2-person"), await page.inputValue("#b-th2-text")], ["The fence", "I owe a debt I would rather not discuss."], "an answer gone bad made into her hostile thread");
  same(await page.$$eval(".bd-thread", (els) => els.map((el) => el.querySelector('[aria-pressed="true"]').textContent)), ["Bond", "Bond", "Hostile", "Bond"], "a hostile thread making room for a third bond thread");
  // Each person's one bond: another thread with Dorrie goes in her card, not a
  // new one with her name on it again, and it comes off with one tap while
  // it's empty.
  const bonds = () => page.$$eval(".bd-bond", (els) => els.map((el) => [el.querySelector("legend").textContent, el.querySelectorAll(".bd-thread").length]));
  same(await bonds(), [["Dorrie", 1], ["Bram", 1], ["The fence", 1], ["Someone new", 1]], "a bond for each person");
  await b('[data-b="addthreadto"][data-i="0"]');
  same(await bonds(), [["Dorrie", 2], ["Bram", 1], ["The fence", 1], ["Someone new", 1]], "a second thread with Dorrie in her bond");
  same(await page.evaluate(() => document.activeElement?.id), "b-th4-text", "the new thread ready to write");
  await b('[data-b="dropthread"][data-i="4"]');
  same(await bonds(), [["Dorrie", 1], ["Bram", 1], ["The fence", 1], ["Someone new", 1]], "the empty thread taken back off");
  await shot(page, "5-builder-threads");
  await next("Aspiration");
  // Past d12 you get it, so the book's tests for a good one are open under it.
  same(await page.$eval('details[data-open="bd-good"]', (el) => el.open), true, "what makes a good Aspiration open on a new character");
  has(await page.textContent('details[data-open="bd-good"]'), "Earn back the rank they stripped from me", "a good Aspiration's examples, from the book");
  await shot(page, "5-builder-aspiration");
  // Shut, it stays shut when the step's drawn again.
  await page.click('details[data-open="bd-good"] > summary');
  await next("Check it and play");
  await b('[data-b="back"]');
  has(await step(), "Aspiration", "back to the Aspiration step");
  same(await page.$eval('details[data-open="bd-good"]', (el) => el.open), false, "what makes a good Aspiration still shut once it's been shut");
  await page.fill("#b-asp", "Own the score of a lifetime");
  await next("Check it and play");
  await page.fill("#b-name", "Vesk");
  await b('[data-b="pronoun"][data-v="her"]');
  const nums = (await page.textContent(".bd-nums")).replace(/\s+/g, " ");
  for (const n of ["Aura 5", "Resolve 2", "Stride 5 (Light on my Feet)", "Wound die d2", "Confidence d6"]) has(nums, n, "the built Vesk's numbers");
  same(/Armour|Hurt/.test(nums), false, "no Armour or Hurt bars in the built Vesk's numbers");
  has(await page.textContent(".bd-body"), "Everything adds up", "nothing to flag on a finished Vesk");
  await shot(page, "7-builder-check");
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  same(await tiles(), want, "the built Vesk's set actions against her sheet in the chapter");
  has(await page.textContent(".cc-head"), "Stride 5 (Light on my Feet)", "the built Vesk's stride on her sheet");
  const saved = await page.evaluate(() => [JSON.parse(localStorage.getItem("zi-characters")).characters.at(-1), JSON.parse(localStorage.getItem("zi-drafts") || "{}")]);
  same([saved[0].crew, saved[0].name, Boolean(saved[0].build), "new" in saved[1]], ["own", "Vesk", true, false], "the built Vesk saved, and the draft cleared");

  await page.click('.tile[data-a]:has(.tile-name:text-is("Locks"))');
  has(await page.textContent("#cc-dialog .cc-dice"), "5 steps, d10", "the built Vesk's Locks");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([8, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  has(await page.textContent("#cc-dialog .cc-res"), "Beat it", "her 8 against the lock's 5");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await page.reload();
  await page.waitForSelector(".tile[data-a]");
  same(await tiles(), want, "the built Vesk after a reload");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-a]", { timeout: 10000 }).catch(() => note("the built Vesk didn't open offline"));
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('.cc-changebar a[data-act="bopen"][data-key]');
  has(await step(), "Change anything on her sheet", "changing her opens with everything on one page, offline");
  await context.setOffline(false);

  // Change her: Prepared instead of Light on my Feet.
  await b('[data-b="deep"][data-s="2"]');
  await b('[data-b="trait"][data-v="Light on my Feet"]');
  await b('[data-b="trait"][data-v="Prepared"]');
  has(await page.textContent("#bd-ut"), "4 utility items", "Prepared gives her a fourth utility item");
  await b('[data-b="fillany"][data-k="e"][data-v="shield"]');
  // She's found a Masterwork shield, and a character being changed can have one.
  await b('[data-b="quality"][data-i="1"][data-v="3"]');
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await openFold(page, "kit");
  same(await page.$$eval('.cc-box[data-k="equipment|shield"]', (els) => els.length), 3, "her Masterwork shield's three boxes");
  has(await page.textContent('details[data-open="sh-kit"] > summary'), "Masterwork shield", "her shield's quality at a glance");
  await page.click('.cc-tabs a[data-t="play"]');
  has(await page.textContent(".cc-head"), "Stride 3", "Vesk's stride without Light on my Feet");
  has(await page.textContent('.tile[data-a]:has(.tile-name:text-is("Defend"))'), "3 steps", "her Defend going up with a shield");
  same(await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.filter((c) => c.build).length), 1, "changing her doesn't make a second Vesk");

  // Opening the builder and leaving isn't a draft. Two Bloodsworn get no +3
  // note, since there's no +2 to raise. A second tap takes a chip back off,
  // and what's in the bag reaches the sheet.
  await page.goto(`${BASE}/characters/?build`);
  await page.click('.cc-back[data-b="leave"]');
  has(await page.textContent('a[data-act="bopen"]'), "Build a character", "the list after opening the builder and leaving");
  await page.click('a[data-act="bopen"]');
  await b('[data-b="arch"][data-t="0"][data-v="Bloodsworn"]');
  await next("Archetypes");
  await b('[data-b="arch"][data-t="1"][data-v="Bloodsworn"]');
  same(await page.$$eval(".bd-body .cc-note", (els) => els.filter((el) => /\+3/.test(el.textContent)).length), 0, "no +3 note for two Bloodsworn");
  await jump(4);
  await b('[data-b="kit"][data-v="u"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Rations"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Rations"]');
  same(await page.inputValue("#b-u0"), "", "a second tap on Rations takes it back off");
  await b('[data-b="deep"]');
  await page.fill("#b-bag", "a waterskin\nsome rope");
  await jump(7);
  await page.fill("#b-name", "Tam");
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  await page.click('.cc-tabs a[data-t="sheet"]');
  has(await page.textContent("#app"), "some rope", "the bag on the sheet");

  // A blank character saves too: the builder warns, and never blocks. Leaving
  // keeps the draft, and the list offers to carry on with it.
  await page.goto(`${BASE}/characters/?build`);
  await jump(7);
  has(await page.textContent(".bd-body .is-warn"), "You can save anyway", "the warnings on a blank build");
  await page.fill("#b-name", "Kaia");
  await page.click('.cc-back[data-b="leave"]');
  has(await page.textContent('a[data-act="bopen"]'), "Carry on with Kaia", "a half-built character waiting on the list");
  await page.click('a[data-act="bopen"]');
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  same(await page.$$eval(".tile[data-a]", (els) => els.length), 6, "a blank character's six set actions");
  has(await page.textContent(".cc-head h1"), "Kaia", "the blank character's name");

  // Every step at 320 wide, dark then light, with axe.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('.cc-changebar a[data-act="bopen"][data-key]');
  await page.click('button[data-b="page"]');
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await page.reload();
    for (let s = 0; s < 8; s++) {
      await jump(s);
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`the builder's step ${s + 1} scrolls sideways at 320 wide, ${theme} (${scroll} > ${client})`);
      await axe(`the builder's step ${s + 1}, ${theme}`);
    }
  }
  await shot(page, "8-builder-320-light");
  console.log("builder: Vesk built step by step and checked against her sheet");
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
    same(await page.$$eval(".bd-progress li", (els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size), 1, `the eight steps in one line, ${theme}`);
    // The steps a tap away from the bar close with Escape, or a tap anywhere else.
    await page.click(".bd-jump > summary");
    await page.keyboard.press("Escape");
    same(await page.$eval(".bd-jump", (el) => [el.open, document.activeElement === el.querySelector("summary")]), [false, true], `Escape closing the steps, ${theme}`);
    await page.click(".bd-jump > summary");
    await page.click(".bd-lead");
    same(await page.$eval(".bd-jump", (el) => el.open), false, `a tap elsewhere closing the steps, ${theme}`);
    for (let s = 0; s < 8; s++) {
      if (s) await jump(s);
      const bar = await page.$eval(".bd-foot", (el) => [getComputedStyle(el).position, Math.round(innerHeight - el.getBoundingClientRect().bottom)]);
      same(bar, ["fixed", 0], `Back and Next at the bottom of the screen on step ${s + 1}, ${theme}`);
      const small = await page.$$eval(".bd-foot button, .bd-foot summary", (els) => els.filter((el) => el.checkVisibility() && (el.getBoundingClientRect().height < 44 || el.getBoundingClientRect().width < 44)).length);
      same(small, 0, `the bar's buttons 44px or more on step ${s + 1}, ${theme}`);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (wide > 0) note(`step ${s + 1} scrolls sideways at 390 wide, ${theme} (${wide}px)`);
      await axe(`the builder's step ${s + 1} at 390 by 844, ${theme}`);
    }
    await shot(page, `5b-builder-check-${theme}`);
    // A line going on grows its set action's die into its next shape: Fight
    // goes from a coin to a triangle with a Title on it.
    await jump(0);
    await b('[data-b="arch"][data-t="0"][data-v="Warrior"]');
    await jump(3);
    same(await page.getAttribute('.bd-rail .tile-dice[data-for="Fight"] .zd-die', "data-d"), "2", `Fight a d2 with nothing on it, ${theme}`);
    await b('[data-b="on"][data-l="t0"][data-a="Fight"]');
    const grown = await page.$eval('.bd-rail .tile-dice[data-for="Fight"] .zd-die', (el) => [el.dataset.d, el.classList.contains("is-grown")]);
    same(grown, ["4", !still], `Fight a d4 with the Title on it, ${still ? "swapped straight away under reduce-motion" : "growing into it"}, ${theme}`);
    if (still) same(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length), 0, `nothing moving under reduce-motion, ${theme}`);
    await page.waitForTimeout(400);
    await shot(page, `5b-builder-set-actions-${theme}`);
    // axe again with things picked: a line on a set action, the archetype
    // folded to the one picked with its Title ideas, and a crew question made
    // into a thread.
    await axe(`the set actions with a line on one, ${theme}`);
    await jump(0);
    await b('[data-b="idea"][data-t="0"][data-v="k-warrior"]');
    await axe(`an archetype picked with its Title ideas, ${theme}`);
    await jump(5);
    await page.click('details[data-open="bd-q-0"] > summary');
    await page.fill("#b-cq0", "Bram. We held the same wall.");
    await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
    await page.click('details[data-open="bd-q-1"] > summary');
    await page.fill("#b-cq1", "The fence. I owe him.");
    await b('[data-b="fromq"][data-q="1"][data-v="hostile"]');
    await axe(`crew questions made into threads, ${theme}`);
    // A lit Bond, tapped again, takes the thread back off.
    await b('[data-b="fromq"][data-q="0"][data-v="bond"]');
    same([await page.inputValue("#b-th0-person"), await page.getAttribute('[data-b="fromq"][data-q="0"][data-v="bond"]', "aria-pressed")], ["", "false"], `a bond thread taken back off its question, ${theme}`);
    await context.close();
  }
  console.log("one hand: the builder full screen, the first choice high up, the steps in one line, Back and Next at the bottom, and the dice growing, in both themes");
}

// 6. Print, and the other ways in.
if (part("6")) {
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  const B = book.companion.build;
  const actionsOf = (s) => s.actions.map((a) => [a.name, a.steps, a.die.replace(/\s/g, "")]).sort();
  for (const c of book.crew) {
    const s = sheetOf({ id: c.id, name: c.name, build: fromCrew(c, B) }, B);
    same(actionsOf(s), actionsOf(c), `${c.name}'s set actions, made into a build`);
    for (const k of ["aura", "resolve", "stride", "wound", "shrug", "confidence"]) same(s.numbers[k], c.numbers[k], `${c.name}'s ${k}, made into a build`);
    same(checksOf(fromCrew(c, B, { keep: true }), B, { changing: true }).map((x) => x.text), [], `${c.name}'s sheet, with nothing to warn about`);
    same(s.armour, c.armour, `${c.name}'s armour and its quality, made into a build`);
  }
  same(B.qualities.map((q) => [q.name, q.boxes]), [["Common", 1], ["Fine", 2], ["Masterwork", 3]], "armour's three qualities, read off Quality");
  same(book.crew.find((c) => c.id === "bram").armour.map((a) => [a.name, a.quality, a.boxes]), [["plate armour", "Fine", 2], ["a shield", "Common", 1]], "Bram's armour off his sheet");
  // What you start with is Common, and one piece can be Fine. A character
  // being changed can have whatever they've found.
  {
    const said = (b, opts) => checksOf(b, B, opts).map((x) => x.text).join(" ");
    const b = fromCrew(book.crew.find((c) => c.id === "bram"), B);
    same(/Fine|Masterwork/.test(said(b)), false, "Bram's Fine plate, the one piece that can be Fine");
    b.equipment[1].q = 2;
    has(said(b), "You’ve got 2 Fine pieces. What you start with is Common, and one piece can be Fine.", "two Fine pieces to start");
    b.equipment[1].q = 3;
    has(said(b), "Masterwork armour comes from play.", "a Masterwork piece to start");
    same(/Fine|Masterwork/.test(said(b, { changing: true })), false, "Masterwork on a character being changed");
    same(sheetOf({ id: "q", name: "Q", build: b }, B).armour.map((a) => [a.name, a.boxes]), [["plate armour", 2], ["a shield", 3]], "a Masterwork shield's three boxes");
    same(normalBuild({ v: 2, equipment: [{ text: "a helmet", on: ["Defend"], q: 7 }] }).equipment[0].q, undefined, "a quality that isn't one, back to Common");
  }
  // A permission on three set actions gets a warning, a one-word permission
  // doesn't, and nor does the same word on two Titles, as long as it's never
  // twice on one set action.
  {
    const b = blankBuild();
    b.titles[0].perms[0] = { text: "Deceptive", on: ["Talk", "Sneak"] };
    b.titles[1].perms[0] = { text: "Deceptive", on: ["Fight"] };
    b.titles[0].perms[1] = { text: "fight dirty", on: ["Fight", "Defend", "Move"] };
    const said = checksOf(b, B).map((x) => x.text).join(" ");
    has(said, "“fight dirty” is on 3 set actions", "a permission on three set actions");
    same(/Deceptive/.test(said), false, "a one-word permission, on two Titles");
    b.titles[1].perms[0].on = ["Talk"];
    has(checksOf(b, B).map((x) => x.text).join(" "), "“Deceptive” is on your Talk twice", "the same permission twice on one set action");
  }
  // Threads and attuned things, when building and when changing a character.
  {
    const said = (b, opts) => checksOf(b, B, opts).map((x) => x.text).join(" ");
    const b = blankBuild();
    same(b.threads.map((t) => t.kind), ["bond", "bond", "hostile"], "a blank build's threads: two bond and a hostile one");
    same(b.attuned.length, 1, "a blank build's one attuned thing");
    const write = (list) => (b.threads = list.map(([kind, person]) => ({ person, text: `Something true with ${person}.`, kind, whose: "" })));
    write([["bond", "Dorrie"]]);
    has(said(b), "You’ve written one bond thread. You start with two, with the crew.", "one bond thread");
    write([["bond", "Dorrie"], ["bond", "Bram"]]);
    same(/bond thread|hostile thread/.test(said(b)), false, "two bond threads and no hostile one");
    write([["bond", "Dorrie"], ["bond", "Bram"], ["bond", "Wren"]]);
    has(said(b), "A third bond thread comes with a hostile thread", "a third bond thread with no hostile one");
    write([["bond", "Dorrie"], ["bond", "Bram"], ["hostile", "The fence"], ["bond", "Wren"]]);
    same(/bond thread|hostile thread/.test(said(b)), false, "a hostile thread and the third bond thread it makes room for");
    write([["bond", "Dorrie"], ["bond", "Bram"], ["hostile", "The fence"], ["bond", "Wren"], ["bond", "Ash"]]);
    has(said(b), "You’ve written 4 bond threads. Three is the most you start with.", "four bond threads");
    write([["bond", "Dorrie"], ["bond", "Bram"], ["hostile", "The fence"], ["hostile", "The Watch"]]);
    has(said(b), "You’ve written 2 hostile threads. You start with one.", "two hostile threads to start");
    same(/thread/.test(said(b, { changing: true })), false, "any threads at all on a character being changed");
    b.attuned = [{ name: "A rope", stage: "Awakened", catch: "", burden: "", perms: [{ text: "climb anything", on: [] }, { text: "", on: [] }] }, { name: "A lamp", stage: "Awakened", catch: "", burden: "", perms: [{ text: "light the dark", on: [] }, { text: "", on: [] }] }];
    has(said(b), "You’ve attuned 2 things. You start with one, and you can attune more later, in downtime.", "two attuned things to start");
    same(/attuned 2/.test(said(b, { changing: true })), false, "two attuned things on a character being changed");
    b.attuned = [];
    has(said(b), "You haven’t attuned anything yet.", "nothing attuned to start");
    // A build from before 26 Oct: a debt is a hostile thread, the rest are bond threads.
    same(normalBuild({ v: 2, threads: [{ person: "The fence", text: "I owe him.", debt: true }, { person: "Dorrie", text: "Old friends.", debt: false }] }).threads.map((t) => t.kind), ["hostile", "bond"], "an old build's debt as a hostile thread");
  }
  // From 27 Oct 2026: a trait's never on a set action, a plain thing's on
  // one, and each person's one bond, however their name was typed.
  {
    const old = normalBuild({
      v: 2, actions: ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"],
      traits: [{ name: "Silent Step", on: ["Sneak", "Move"] }, { name: "Prepared Mind", on: [] }, { name: "Mine", on: ["Talk"], own: { type: "Once per scene", text: "+1 step to talking" } }],
      equipment: [{ text: "a fine sword", on: ["Fight", "Defend"] }, { text: "plate armour", on: ["Fight", "Defend"] }],
      utility: [{ text: "rope", on: ["Move", "Sneak"] }], keepsake: { text: "a coin", on: ["Talk"] },
      threads: [{ person: "Dorrie", text: "One.", kind: "bond" }, { person: "dorrie ", text: "Two.", kind: "bond" }, { person: "Bram", text: "Three.", kind: "hostile" }],
    });
    same(old.traits.map((t) => t.on.length), [0, 0, 0], "an old build's traits off every set action");
    same([old.equipment[0].on, old.equipment[1].on, old.utility[0].on, old.keepsake.on], [["Fight"], ["Defend"], ["Move"], ["Talk"]], "an old build's plain things on one set action each, its armour on Defend");
    same(sheetOf({ id: "old-27", name: "Old", build: old }, B).threads.map((p) => [p.person, p.threads.length]), [["Dorrie", 2], ["Bram", 1]], "two spellings of Dorrie, and one bond");
    const said = checksOf(old, B, { changing: true }).map((x) => x.text).join(" ");
    has(said, "Prepared Mind isn’t one of the traits any more", "a trait the list hasn't got now");
    has(said, "Mine is written as Once per scene", "one of your own, of a type traits don't come in now");
    const vesk = book.crew.find((c) => c.id === "vesk");
    const grown = grow(vesk, [{ k: "thread", person: "dorrie", text: "She taught me the roofs.", kind: "bond" }], B);
    same(grown.threads.filter((x) => x.person === "Dorrie").map((x) => x.threads.length), [3], "a thread from downtime with dorrie goes under Vesk's bond with Dorrie");
    same(grown.threads.length, vesk.threads.length, "and no new bond for her");
  }
  // A thousand random characters: not one warning, nothing bigger than the
  // crew's biggest set action, 5 steps, one attuned thing, two or three bond
  // threads and a hostile one.
  let warned = 0;
  let biggest = 0;
  let shapes = 0;
  for (let i = 0; i < 1000; i++) {
    const b = randomBuild(B, book.crew);
    const why = checksOf(b, B);
    if (why.length) {
      if (!warned) note(`a random character's warnings: ${why.map((x) => x.text).join(" | ")}`);
      warned += 1;
    }
    const kinds = b.threads.map((t) => t.kind);
    const bonds = kinds.filter((k) => k === "bond").length;
    if (b.attuned.filter((a) => a.name.trim()).length !== 1 || kinds.filter((k) => k === "hostile").length !== 1 || bonds < 2 || bonds > 3) shapes += 1;
    biggest = Math.max(biggest, ...sheetOf({ id: `random-${i}`, name: b.name, build: b }, B).actions.map((a) => a.steps));
  }
  same(warned, 0, "random characters with a warning, of 1000");
  same(shapes, 0, "random characters without one attuned thing, a hostile thread and two or three bond threads, of 1000");
  if (biggest > 5) note(`a random character has a set action of ${biggest} steps, more than the crew's 5`);

  const { context, page } = await phone();
  const axe = async (what) => {
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
  };
  // Print, and read back what the PDF says, field by field.
  const print = async () => {
    if (!(await page.isVisible('button[data-act="print"]'))) await page.click('.cc-tabs a[data-t="sheet"]');
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

  await play(page, "vesk");
  await page.click('.cc-stat[data-p="wound"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button[data-act="strain"][data-k="Dorrie|We have pulled a dozen jobs. I trust her with my life."]');
  let f = await print();
  same([f.pages, f.file], [2, "vesk-zidara-sheet.pdf"], "Vesk's printed sheet");
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "5"], ["aura_max", "5"], ["stride", "5"], ["resolve_max", "2"],
    ["confidence", "d4"], ["wound_die", "d4"], ["scar_1", ""], ["set_sneak_lines", "Title I, move unseen"], ["set_sneak_steps", "3"], ["set_sneak_die", "d6"],
    ["set_defend_lines", "worn leathers"], ["set_defend_steps", "2"], ["set_defend_die", "d4"],
    ["set_1_name", "Locks"], ["set_1_lines", "Title I, pick a mechanical lock, know how a lock’s built, a perfect set of picks"], ["set_1_steps", "5"], ["set_1_die", "d10"], ["set_2_name", ""], ["set_talk_steps", "1"], ["title_1", "The best cat burglar in the city"], ["title_1_archetype", "Shadow"],
    ["trait_1", "Silent Step"], ["equipment_1", "Common worn leathers"], ["equipment_1_box_1", false], ["equipment_1_box_2", false], ["utility_2", "a smoke bomb"], ["utility_3", "a perfect set of picks"], ["keepsake", "the first coin she ever stole"], ["attune_1_thing", "A grappling line"],
    ["attune_1_stage", "awakened"], ["attune_1_permission_1", "climb or swing anywhere you can throw a hook"], ["attune_2_thing", ""], ["bond_1", "Dorrie"],
    ["bond_1_thread_1", "We have pulled a dozen jobs. I trust her with my life."], ["bond_1_thread_1_kind", "bond"], ["bond_1_thread_1_strained", true], ["bond_1_thread_1_snapped", false],
    ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"], ["bond_1_thread_2_kind", "bond"], ["bond_1_thread_2_strained", false],
    ["bond_3", "Isolde"], ["bond_3_thread_1_kind", "hostile"], ["bond_5", "The fence"], ["bond_5_thread_1", "I owe a debt I would rather not discuss."], ["bond_5_thread_1_kind", "hostile"],
    ["aspiration", "Own the score of a lifetime"], ["aspiration_die", "d2"], ["resolve_2", true], ["resolve_3", false]], "Vesk's printed sheet");
  for (const gone of ["armour_full", "armour_now", "hurt_1_box_1", "hurt_1_catch"]) same(f.get(gone), null, `no ${gone} on the sheet`);
  // Her leathers broken and a Scar: they print where they are now.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button[data-act="cross"][data-k="equipment|worn leathers"]');
  await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    Object.assign(all.characters.at(-1).state, { scars: ["a spear through the shoulder"], wound: 6 });
    localStorage.setItem("zi-characters", JSON.stringify(all));
  });
  await page.reload();
  await page.waitForSelector(".cc-tabs");
  f = await print();
  want(f, [["wound_die", "d6"], ["scar_1", "a spear through the shoulder"], ["scar_2", ""], ["set_defend_lines", "worn leathers (broken)"], ["equipment_1", "Common worn leathers (broken)"], ["equipment_1_box_1", true], ["equipment_1_box_2", false]], "Vesk's sheet with her leathers broken and a Scar");
  await inFold(page, 'button[data-act="cross"][data-k="equipment|worn leathers"]');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".cc-tabs");
  f = await print();
  same(f.get("set_1_name"), "Locks", "Vesk's sheet printed offline");
  await context.setOffline(false);

  // Make your own from Vesk: everything's hers but the name.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="vesk"]');
  has(await page.textContent(".bd-head h1"), "From Vesk", "making your own from Vesk");
  same(await page.$$eval(".bd-part > h2", (els) => els.length), 8, "every step on one page");
  has(await page.textContent(".bd-body .is-warn"), "needs a name", "the one thing a copy of Vesk needs");
  await page.fill("#b-name", "Kestrel");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  f = await print();
  want(f, [["name", "Kestrel"], ["set_sneak_steps", "3"], ["set_move_die", "d8"], ["set_1_name", "Locks"], ["set_1_die", "d10"], ["title_2_permission_2", "fight dirty with a knife"], ["attune_1_thing", "A grappling line"], ["attune_2_thing", ""],
    ["bond_1", "Dorrie"], ["bond_1_thread_1_kind", "bond"], ["bond_3", "The fence"], ["bond_3_thread_1_kind", "hostile"], ["notes", "Trouble that follows her: wanted in three districts, owes the Guild."]], "Kestrel, made from Vesk");

  // Random, five times over, then saved and printed.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="random"]');
  for (let i = 1; i <= 5; i++) {
    has(await page.textContent(".bd-part:last-child"), "Everything adds up", `random character ${i}`);
    await page.click('button[data-b="reroll"]');
  }
  await page.fill("#b-blurb", "Keeps a ledger of every slight.");
  await page.click('button[data-b="reroll"]');
  has(await page.textContent('button[data-b="reroll"]'), "Tap again to lose your changes", "rolling again over a change");
  same(await page.inputValue("#b-blurb"), "Keeps a ledger of every slight.", "the change, still there after one tap");
  await page.click('button[data-b="reroll"]');
  same(await page.inputValue("#b-blurb"), "", "the second tap rolls again");
  const name = await page.inputValue("#b-name");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  const dice = await page.$$eval(".tile[data-a]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, el.querySelector(".tile-die").textContent]));
  f = await print();
  same(f.get("name"), name, "the random character's name on paper");
  for (const [a, d] of dice.filter(([a]) => ["Defend", "Fight", "Move", "Sneak", "Study", "Talk"].includes(a))) same(f.get(`set_${a.toLowerCase()}_die`), d, `the random character's ${a} on paper`);

  // A blank sheet, and a draft that a way in asks before binning.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="blank"]');
  has(await page.textContent(".bd-head h1"), "A blank sheet", "a blank sheet");
  has(await page.textContent(".bd-body .is-warn"), "You can save anyway", "a blank sheet's warnings");
  await page.click('a[data-b="leave"]');
  await page.click('a[data-act="bopen"]');
  has(await page.textContent(".bd-head h1"), "Archetypes", "building a character after leaving an empty blank sheet");
  await page.click('a[data-b="leave"]');
  await page.click('button[data-act="bway"][data-w="blank"]');
  await page.fill("#b-t0-p0", "climb sheer walls");
  await page.waitForFunction(() => document.querySelector('.bd-part[aria-labelledby="bd-part-3"]')?.textContent.includes("climb sheer walls"));
  await page.fill("#b-name", "Tui");
  await page.click('a[data-b="leave"]');
  await page.click('button[data-act="bway"][data-w="random"]');
  has(await page.textContent('button[data-act="bway"][data-w="random"]'), "Tap again to bin Tui", "a way in with a draft on the go");
  await page.click('button[data-act="bway"][data-w="random"]');
  has(await page.textContent(".bd-head h1"), "Random", "the second tap");
  await page.setViewportSize({ width: 320, height: 720 });
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await page.reload();
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (scroll > client) note(`one page scrolls sideways at 320 wide, ${theme} (${scroll} > ${client})`);
    await axe(`the builder on one page, ${theme}`);
  }
  await shot(page, "9-one-page-320-light");
  console.log("print: Vesk, Kestrel from Vesk and a random character printed, and one page checked");
  await context.close();
}

// 7. Dice, feel and learning.
const moving = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length);
const card = (page) => page.textContent(".ln-card");
// One round from the top: Wren and Bram in, then roll with these dice (the d12,
// the d4, then the club's d8), or tap them in when real is set.
async function round(page, dice, real = false) {
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="pick"][data-who="wren"]');
  await page.click('button[data-do="pick"][data-who="bram"]');
  await page.click('button[data-do="next"]');
  if (real) {
    await page.click('button[data-do="real"]');
    for (const [k, v] of [["0", dice[0]], ["1", dice[1]], ["opp", dice[2]]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
    await page.click('button[data-do="pad-done"]');
  } else {
    await page.evaluate((list) => window.ziCompanion.setDice(list), dice);
    await page.click('button[data-do="roll"]');
  }
}
if (part("7")) {
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="learn"][data-do="open"]');
  await page.waitForSelector("#ln-h");
  same(await page.evaluate(() => document.activeElement?.id), "ln-h", "focus at the start of the round");
  has(await card(page), "That’s a d8", "the club's telegraph");
  has(await card(page), "Isolde rolls her Defend against it", "Isolde's Defend when it lands");
  has(await card(page), "A d2 against a d8 stops it 3 times in 16", "Isolde's Defend against the club");
  has(await card(page), "Bram’s a Guardian, so he could intercept it for free", "Bram's free intercept");
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), true, "rolling before Wren and Bram are in");
  same(await page.$$eval('button[data-do="pick"]', (els) => els.map((e) => e.dataset.who)), ["wren"], "Bram waiting for Wren");
  await page.click('button[data-do="pick"][data-who="wren"]');
  has(await card(page), "Wren’s Fight", "Wren's tile");
  await page.click('button[data-do="pick"][data-who="bram"]');
  has(await card(page), "4 steps and 4 steps is 8 steps", "the combo's steps");
  has(await card(page), "and the 2 left over make a d4, so that’s a d12 and a d4", "the combo's dice");
  await page.click('button[data-do="back"]');
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), false, "Wren and Bram still in after going back");
  await page.click('button[data-do="next"]');
  await page.evaluate(() => window.ziCompanion.setDice([8, 3, 6]));
  await page.click('button[data-do="roll"]');
  same(await page.$$eval("[data-spin]", (els) => els.length), 0, "dice tumbling with reduce-motion on");
  same(await page.$$eval(".ln-roll .hex", (els) => els.map((e) => e.textContent)), ["6", "8", "3"], "the club's d8 and your d12 and d4");
  has(await card(page), "Your 8 beats the brute’s 6, so the club never comes down", "a beaten club");
  // Confidence moves for everyone who put an action in, off their sheets.
  const moved = () => page.$$eval(".ln-swing li", (els) => els.map((el) => [el.querySelector("b").textContent, ...[...el.querySelectorAll(".hex")].map((h) => h.textContent)]));
  same(await moved(), [["Wren", "d6", "d8"], ["Bram", "d6", "d8"], ["Isolde", "d8"]], "Wren and Bram up a size for the club they stopped, and Isolde's where it was");
  has(await card(page), "so Wren and Bram both go up a size", "why their Confidence went up");
  same(await page.evaluate(() => document.activeElement?.id), "ln-out", "focus on what the dice did");
  same(await moving(page), 0, "things moving on the round with reduce-motion on");
  await page.click('button[data-do="next"]');
  has(await card(page), "you stopped it, so nothing lands and the round’s over", "the end of a round that was stopped");
  await page.click('button[data-do="again"]');
  has(await page.textContent("#ln-h"), "The GM telegraphs", "playing it again");
  await round(page, [6, 4, 6]);
  has(await card(page), "Your 6 ties the brute’s 6", "a tie on the club");
  has(await card(page), "The d4 came up 4, its top face, so Wren gets 1 Aura back", "a top face in a combo");
  has(await card(page), "if her Aura’s full she gives it to a friend in the scene", "a top face with Wren's Aura full");
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  same(await page.$$eval(".ln-swing", (els) => els.length), 0, "no Confidence moving before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  same(await moved(), [["Wren", "d6", "d8"], ["Bram", "d6", "d8"], ["Isolde", "d8"]], "a tie won counting as a win");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 7], true);
  has(await card(page), "The brute’s 7 beats your best, a 3, so the club lands on Isolde at once", "real dice that lose");
  has(await card(page), "Isolde’s wound die goes up a size, from d2 to d4", "the Hurt on Isolde");
  same(await page.$$eval(".ln-hurt .mini i.on", (els) => els.length), 1, "Isolde's wound die row");
  same(await moved(), [["Wren", "d6", "d4"], ["Bram", "d6", "d4"], ["Isolde", "d8", "d6"]], "every die missed, and the Hurt on Isolde");
  has(await card(page), "The Hurt put Isolde’s wound die up, so hers drops a size as well", "why Isolde's went down");
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
    for (const [k, v] of [["0", 2], ["1", 1], ["opp", 7]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
    await page.click('button[data-do="pad-done"]');
    await check("roll");
    await page.click('button[data-do="next"]');
    await check("end");
    await page.click('button[data-do="again"]');
  }
  await shot(page, "learn-320-light");
  await context.close();
  console.log("learn: the round played three ways, offline, and at 320 wide in both themes");
}

// Motion on, with the phone's sound and buzz listened to.
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
  await page.goto(`${BASE}/characters/?learn`);
  await page.waitForSelector("#ln-h");
  same(await page.getAttribute(".cc-sound", "aria-pressed"), "false", "sound before it's turned on");
  await round(page, [12, 3, 5]);
  same(await page.$$eval(".ln-roll [data-spin]", (els) => els.length), 3, "the dice tumbling");
  if (!(await moving(page))) note("the dice don't move while they tumble");
  await page.waitForSelector("#ln-out", { timeout: 5000 }).catch(() => note("the dice never landed"));
  same(await page.$$eval(".ln-roll .hex", (els) => els.map((e) => e.textContent)), ["5", "12", "3"], "the dice once they've landed");
  has(await card(page), "The d12 came up 12, its top face", "a top face after a tumble");
  same(await heard(), { sounds: 0, buzz: [] }, "sound and buzz before they're turned on");
  await page.click(".cc-sound");
  same(await page.getAttribute(".cc-sound", "aria-pressed"), "true", "the sound switch");
  same(await page.evaluate(() => localStorage.getItem("zi-sound")), "on", "sound remembered");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await round(page, [12, 4, 5]);
  await page.click(".ln-roll");
  await page.waitForSelector("#ln-out", { timeout: 2000 }).catch(() => note("a tap didn't skip the tumble"));
  let got = await heard();
  if (!got.sounds) note("no sound with sound on");
  has(JSON.stringify(got.buzz), "[20,50,20]", "a top face's buzz");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await round(page, [2, 1, 7]);
  await page.waitForSelector("#ln-out", { timeout: 5000 });
  got = await heard();
  same(got.buzz, [12, 12, 12, 60], "a knock as each die lands, then a Hurt's buzz");
  same(await page.$$eval(".ln-hurt .mini i.is-new", (els) => els.length), 1, "Isolde's wound die glowing as it goes up");
  // On a sheet: the tabs slide, the roll card turns over, Aura pops in, and
  // a Hurt and the one that takes the wound die to d12 each get their buzz.
  await play(page, "vesk");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.$$eval(".cc-page.cc-go-next", (els) => els.length), 1, "the Sheet tab sliding in");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$$eval(".cc-page.cc-go-back", (els) => els.length), 1, "the Play tab sliding back");
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('button[data-act="aura"][data-d="-1"]');
  await page.click('.tile[data-a="0"]');
  await page.evaluate(() => window.ziCompanion.setDice([6]));
  await page.click('#cc-dialog button[data-act="go"]');
  same(await page.$$eval("#cc-dialog .dlg-body.cc-flip", (els) => els.length), 1, "the roll card turning over");
  if (!(await page.$$eval("#cc-dialog [data-spin]", (els) => els.length))) note("Vesk's dice didn't tumble");
  await page.waitForSelector("#cc-dialog .dlg-body.cc-reveal", { timeout: 5000 }).catch(() => note("Vesk's dice never landed"));
  same(await page.$$eval("#cc-dialog .cc-res .zd-die", (els) => els.map((e) => e.textContent)), ["6"], "Vesk's die once it's landed");
  same(await page.$$eval(".t-aura .zd-chit.is-new", (els) => els.length), 0, "an Aura hex popping in behind the roll card");
  await page.click('#cc-dialog button.primary[data-act="close"]');
  same(await page.$$eval(".t-aura .zd-chit.is-new", (els) => els.length), 1, "the top face's Aura hex popping in as the card closes");
  await page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await page.click('.cc-stat[data-p="wound"]');
  for (let i = 0; i < 5; i++) await page.click('button[data-act="hurt"][data-d="1"]');
  same((await heard()).buzz, [60, 60, 60, 60, [70, 60, 120]], "four Hurts, then the one that takes the wound die to d12");
  same(await page.$$eval(".t-wound .zd-die.is-grown", (els) => els.length), 1, "the wound die growing into its next shape");
  await shot(page, "vesk-motion");
  await context.close();
  console.log("feel: the dice tumble and land, the cards turn and slide, and sound waits to be turned on");
}

// 7b. A character on a phone held in one hand: full screen with the crest at
// the top, the first set action high up, each set action drawn as the dice it
// rolls, the roll as a moment, and the Sheet tab at a glance. axe on the play
// screen, a roll and the Sheet tab, dark and light.
if (part("7b")) {
  for (const theme of ["dark", "light"]) {
    const { context, page } = await phone();
    if (theme === "light") await page.addInitScript(() => localStorage.setItem("zi-theme", "light"));
    const axe = async (what) => {
      const result = await new AxeBuilder({ page }).analyze();
      for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
    };
    await play(page, "vesk");
    same(await page.isVisible(".topbar"), false, `the site's bar off a character, ${theme}`);
    if (!(await page.$(".cc-head .zd-crest"))) note(`no crest at the top of Vesk's sheet, ${theme}`);
    const top = await page.$eval(".tile[data-a]", (el) => Math.round(el.getBoundingClientRect().top + scrollY));
    if (top > 340) note(`the first set action starts ${top}px down at 390 by 844, ${theme}`);
    same(await page.$$eval(".tile[data-a] .tile-dice .zd-die", (els) => els.map((e) => e.dataset.d)), ["6", "8", "10", "4", "4", "2", "2"], `Vesk's set actions drawn as the dice they roll, ${theme}`);
    same([await page.getAttribute(".t-conf .zd-die", "data-d"), await page.getAttribute(".t-wound .zd-die", "data-d")], ["6", "2"], `Confidence a square and the wound die a coin, ${theme}`);
    await axe(`the play screen, ${theme}`);
    await page.click('.tile[data-a="0"]');
    await page.click('#cc-dialog button[data-act="vs"][data-v="6"]');
    await page.evaluate(() => window.ziCompanion.setDice([6, 3]));
    await page.click('#cc-dialog button[data-act="go"]');
    await page.waitForSelector("#cc-dialog .res .res-out");
    same(await page.$eval("#cc-dialog .cc-stage .res .zd-die", (el) => [el.dataset.d, el.textContent, el.classList.contains("is-top")]), ["6", "6", true], `her 6 on the d6, front and centre with its top face lit, ${theme}`);
    same(await page.$eval("#cc-dialog .cc-them .zd-die", (el) => el.classList.contains("is-low")), true, `the guard's 3 drawn as lost, ${theme}`);
    await axe(`a roll, ${theme}`);
    await page.click('#cc-dialog button.primary[data-act="close"]');
    await page.click('.cc-tabs a[data-t="sheet"]');
    const tall = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
    if (tall > 2) note(`the Sheet tab runs ${tall.toFixed(1)} screens with its folds shut, ${theme}`);
    same(await page.$$eval("details.cc-fold[open]", (els) => els.length), 0, `the Sheet tab's folds shut to start, ${theme}`);
    await openFold(page, "acts");
    same(await page.$$eval(".cc-act:first-child .zd-pips", (els) => els.length), 3, `Vesk's Sneak with a pip for each of its 3 steps, ${theme}`);
    await axe(`the Sheet tab, ${theme}`);
    await shot(page, `one-hand-${theme}`);
    // With reduce-motion on, a Hurt swaps the wound die's shape and nothing moves.
    await page.click('.cc-tabs a[data-t="play"]');
    await page.click('.cc-stat[data-p="wound"]');
    await page.click('button[data-act="hurt"][data-d="1"]');
    same([await page.getAttribute(".t-wound .zd-die", "data-d"), await page.$$eval(".t-wound .zd-die.is-grown, .t-conf .zd-die.is-grown", (els) => els.length), await moving(page)], ["4", 0, 0], `a Hurt with reduce-motion on: a d4 straight away and nothing growing, ${theme}`);
    await context.close();
  }
  console.log("one hand: the crest at the top, the set actions high up as dice, the roll as a moment and the Sheet tab at a glance, in both themes");
}

// 8. Downtime and rule changes.
if (part("8")) {
  for (const [a, b, want] of [
    ["know how a lock’s built", "know how a locks built", true],
    ["Raised by the Guild", "Raised by the guild", true],
    ["find a buyer for anythng", "find a buyer for anything", true],
    ["run the rooftops", "run and leap the rooftops", false],
    ["Stride 5", "Stride 6", false],
    ["you can open it", "you can’t open it", false],
    ["Once per scene", "Twice per scene", false],
    ["Stride −2", "Stride 2", false],
    ["move unnoticed", "move noticed", false],
    ["heal a friend", "deal a friend", false],
    ["firespeaker", "fire speaker", true],
  ]) same(typo(a, b), want, `"${a}" to "${b}" as a typo fix`);

  // What she grew keeps its own place, so a rule that puts a permission in
  // the middle of her first Title marks only the lines from the rules.
  {
    const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
    const vesk = book.crew.find((c) => c.id === "vesk");
    const grown = [{ k: "perm", t: 0, text: "slip through a crowd", on: ["Sneak"] }, { k: "perm", t: 0, text: "climb a sheer wall", on: [] }, { k: "perm", t: 0, text: "hide in plain sight", on: [] }];
    const two = grown.slice(0, 2);
    const seen = said(grow(vesk, two, book.companion.build));
    same(grow(vesk, [...grown, { k: "perm", t: 0, text: "one too many", on: [] }], book.companion.build).titles[0].permissions.length, 6, "six permissions at most on a Title");
    const moved = JSON.parse(JSON.stringify(vesk));
    moved.titles[0].permissions.splice(1, 0, { text: "read a guard’s rounds", key: "l99" });
    moved.lines.push({ key: "l99", kind: "permission", label: "read a guard’s rounds", title: moved.titles[0].name });
    const d = changesOf(seen, grow(moved, two, book.companion.build));
    same(Object.keys(d.marks).filter((id) => /:g\d/.test(id)), [], "no gold mark on anything she grew");
    same(Object.keys(d.marks).sort(), ["perm:0:1", "perm:0:2", "perm:0:3"], "the rule's new line and the ones it moved");
  }

  const { context, page } = await phone();
  const axe = async (what) => {
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
  };
  await play(page, "vesk", "Vesk");
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);
  const dt = (attrs) => page.click(`#cc-dialog button[data-act="dt"]${attrs}`);
  const sheet = async () => {
    await page.click('.cc-tabs a[data-t="sheet"]');
    return page.textContent(".cc-page");
  };
  const playTab = () => page.click('.cc-tabs a[data-t="play"]');
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  // The card remembers "Without a slot" being opened, so it's only opened when it's shut.
  const openFree = async () => {
    if ((await page.getAttribute('#cc-dialog details[data-open="dt-free"]', "open")) === null) await page.click('#cc-dialog details[data-open="dt-free"] > summary');
  };

  // Vesk's week, from the book, with a Hurt on her from the job before.
  await page.click('.cc-stat[data-p="wound"]');
  await page.click('.cc-panel button[data-act="hurt"][data-d="1"]');
  await page.click('.cc-stat[data-p="wound"]');
  same(await page.textContent('.cc-stat[data-p="wound"] .v'), "d4", "a Hurt on Vesk before her week");
  await page.click('button[data-act="downtime"]');
  has(await page.textContent("#dlg-title"), "Downtime", "the downtime card");
  has(await page.textContent("#cc-dialog .dlg-body"), "your wound die goes back to d2", "wounds clearing without a slot");
  same(await page.$$eval('#cc-dialog button[data-do="pick"]', (els) => els.map((el) => el.dataset.v).filter((v) => ["catch", "armour", "tend"].includes(v))), [], "nothing to heal a Catch, mend Armour or tend the crew with");
  await dt('[data-do="pick"][data-s="0"][data-v="pressure"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "Pay the fence, every coin");
  await dt('[data-do="pick"][data-s="1"][data-v="att"]');
  await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="0"]');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked:last-of-type"), "Awakened, with 1 permission", "the grappling line's stage");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="catch"]', "Loud");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "haul someone up after me");
  // Paying the fence is doing right by him, so her hostile thread with him strains.
  await openFree();
  same(await page.$$eval('#cc-dialog button[data-do="mend"]', (els) => els.length), 0, "no bond thread strained, so nothing to mend");
  await dt('[data-do="right"][data-v="The fence|I owe a debt I would rather not discuss."]');
  await shot(page, "downtime-card");
  await dt('[data-do="finish"]');
  await closed();
  has(await page.textContent("#cc-toast"), "Pay the fence, every coin: done.", "the week's toast");
  has(await page.textContent("#cc-toast"), "You did right by The fence, so your hostile thread’s strained.", "the fence's thread strained by the week");
  has(await page.textContent("#cc-toast"), "Your wound die’s back to d2.", "the toast saying her wound's cleared");
  has(await page.textContent("#cc-toast"), "Resolve’s full at 2.", "Resolve after downtime");
  same(await page.textContent('.cc-stat[data-p="wound"] .v'), "d2", "her wound die after downtime");
  same(await tileOf("Move"), "4 d8", "Move after the grappling line's new permission, which isn't on it");
  await page.click('.tile[data-a]:has(.tile-name:text-is("Move"))');
  await page.click('#cc-dialog details[data-open="bring"] > summary');
  same(await page.isVisible('#cc-dialog .cc-line[data-act="in"]:has-text("haul someone up after me")'), true, "haul someone up after me, brought in for 1 Aura");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await closed();
  let text = await sheet();
  has(text, "haul someone up after me", "the new attuned permission on the sheet");
  has(text, "Its Catch: Loud", "the grappling line's Catch");
  const fenceChip = () => page.textContent('li.cc-thread:has-text("I owe a debt I would rather not discuss.") .chip');
  same(await fenceChip(), "Hostile, strained", "the fence's thread after the week");
  same(await page.$$eval(".cc-gold, .cc-gem", (els) => els.length), 0, "no gold marks for what she grew");
  await playTab();
  same(await page.getAttribute(".cc-undo", "aria-label"), "Undo downtime", "the undo after downtime");
  await page.click(".cc-undo");
  text = await sheet();
  same(text.includes("haul someone up after me") || text.includes("Its Catch: Loud"), false, "the week undone");
  same(await fenceChip(), "Hostile", "the fence's thread whole again with the week undone");

  // A second week: a new permission on Sneak, her Aspiration, and a swap.
  await playTab();
  await page.click('button[data-act="downtime"]');
  same(await page.$$eval("#cc-dialog .dt-slot.is-picked", (els) => els.length), 0, "a fresh card after a finished week");
  await dt('[data-do="pick"][data-s="0"][data-v="perm"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "slip through a crowd");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await closed();
  await page.click('button[data-act="downtime"]');
  same(await page.inputValue('#cc-dialog input[data-dt="0"][data-f="text"]'), "slip through a crowd", "the card keeping its draft when it's closed");
  await dt('[data-do="on"][data-s="0"][data-f="on"][data-v="Sneak"]');
  await dt('[data-do="pick"][data-s="1"][data-v="asp"]');
  await page.click('#cc-dialog details[data-open="dt-asp"] > summary');
  await page.click('#cc-dialog .cc-line[data-do="on"][data-s="1"]:has-text("The best cat burglar")');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked:last-of-type .cc-dice"), "2 steps, d4, against its d2", "her Aspiration roll");
  await page.evaluate(() => window.ziCompanion.setDice([3, 1]));
  await dt('[data-do="asp-roll"][data-s="1"]');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked:last-of-type"), "Beat it. It climbs to d4.", "her Aspiration climbing");
  await openFree();
  await dt('[data-do="swap-add"]');
  await dt('[data-do="set"][data-s="w0"][data-f="t"][data-v="1"]');
  await dt('[data-do="set"][data-s="w0"][data-f="j"][data-v="1"]');
  same(await page.getAttribute('#cc-dialog .cc-line[data-s="w0"][data-v="Fight"]', "aria-pressed"), "true", "a swap starting on the old permission's set actions");
  await page.fill('#cc-dialog input[data-dt="w0"][data-f="text"]', "fight dirty with anything to hand");
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ colorScheme: "light" });
  same(await page.evaluate(() => document.querySelector("#cc-dialog .dlg-body").scrollWidth <= document.querySelector("#cc-dialog .dlg-body").clientWidth), true, "the downtime card at 320 wide, no sideways scroll");
  await axe("the downtime card at 320 wide, light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await dt('[data-do="finish"]');
  await closed();
  has(await page.textContent("#cc-toast"), "Sneak is 4 steps, d8.", "the toast saying Sneak's new size");
  same(await tileOf("Sneak"), "4 d8", "Sneak with its new permission");
  same(await tileOf("Fight"), "2 d4", "Fight after the swap");
  text = await sheet();
  has(text, "slip through a crowd", "the new permission on the sheet");
  has(text, "fight dirty with anything to hand", "the swapped permission");
  same(text.includes("fight dirty with a knife"), false, "the old permission gone");
  same(await page.textContent('.cc-ring[aria-label="Aspiration"] [aria-pressed="true"]'), "d4", "her Aspiration on d4");

  // It's kept: a reload, then offline.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".cc-page", { timeout: 10000 }).catch(() => note("Vesk didn't open offline"));
  has(await page.textContent(".cc-page"), "slip through a crowd", "the new permission offline");
  await playTab();
  same(await tileOf("Sneak"), "4 d8", "Sneak offline");
  await context.setOffline(false);
  const saved = await page.evaluate(() => localStorage.getItem("zi-characters"));
  const id = JSON.parse(saved).characters[0].id;

  // A third week: a slot toward the crew, then a hostile thread from Deepen a
  // bond, and a tie on her Aspiration taken with one of the crew's extra
  // resources.
  await playTab();
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="party"]');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked"), "The crew gets one action a downtime", "a slot toward the crew's one action");
  has(await page.textContent("#cc-dialog .dt-slot.is-picked"), "It can never be a second move on a faction.", "no second move on a faction");
  await dt('[data-do="clear"][data-s="0"]');
  await dt('[data-do="pick"][data-s="0"][data-v="thread"]');
  await dt('[data-do="set"][data-s="0"][data-f="tkind"][data-v="hostile"]');
  // Each person's one bond: Deepen a bond offers hers to pick, or someone new.
  same(await page.$$eval('#cc-dialog [data-do="set"][data-s="0"][data-f="person"]', (els) => els.map((el) => el.dataset.v)), ["Dorrie", "Bram", "Isolde", "Wren", "The fence"], "Deepen a bond offering her bonds to pick from");
  has(await page.textContent("#cc-dialog .dt-slot.is-picked"), "Or someone new", "or someone new");
  await page.fill('#cc-dialog input[data-dt="0"][data-f="person"]', "The Harbour Guild");
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "They think I sank their barge.");
  await dt('[data-do="pick"][data-s="1"][data-v="asp"]');
  await page.evaluate(() => window.ziCompanion.setDice([2, 2]));
  await dt('[data-do="asp-roll"][data-s="1"]');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked:last-of-type"), "The crew spends an extra resource to take the tie", "an extra resource for the tie");
  same(/spare/i.test(await page.textContent("#cc-dialog")), false, "nothing on the card calling it spare");
  await dt('[data-do="asp-tie"][data-s="1"]');
  await dt('[data-do="finish"]');
  await closed();
  has(await page.textContent("#cc-toast"), "A new hostile thread with The Harbour Guild.", "the new hostile thread's toast");
  has(await page.textContent("#cc-toast"), "The crew spends an extra resource for the tie.", "the tie's toast");
  await sheet();
  same(await page.textContent('li.cc-thread:has-text("They think I sank their barge.") .chip'), "Hostile", "the new thread on her sheet, hostile");
  await context.close();

  // A made-up rule change against her saved sheet, on a phone that hasn't got
  // the site kept yet, so the changed rules come straight from the page.
  const second = await phone({ serviceWorkers: "block" });
  const p2 = second.page;
  await second.context.route((url) => url.pathname === "/characters/", async (route) => {
    const res = await route.fetch();
    const html = await res.text();
    const out = html.replace(/(<script[^>]*id="zi-companion"[^>]*>)([\s\S]*?)(<\/script>)/, (m, open, json, close) => {
      const data = JSON.parse(json);
      const v = data.crew.find((c) => c.id === "vesk");
      const rename = (from, to) => {
        for (const t of v.titles) for (const p of t.permissions) if (p.text === from) p.text = to;
        for (const l of v.lines) if (l.label === from) l.label = to;
      };
      rename("run the rooftops", "run and leap the rooftops");
      rename("know how a lock’s built", "know how a locks built");
      v.titles[1].name = "Raised by the guild";
      v.numbers.stride = 6;
      const built = v.lines.find((l) => l.label === "know how a locks built").key;
      const locks = v.actions.find((a) => a.name === "Locks");
      locks.lines = locks.lines.filter((k) => k !== built);
      locks.steps = 4;
      locks.die = "d8";
      v.hash = "madeup01";
      return `${open}${JSON.stringify(data).replace(/</g, "\\u003c")}${close}`;
    });
    return route.fulfill({ response: res, body: out });
  });
  await p2.goto(`${BASE}/characters/`);
  await p2.evaluate((json) => localStorage.setItem("zi-characters", json), saved);
  await p2.goto(`${BASE}/characters/?c=${encodeURIComponent(id)}`);
  await p2.waitForSelector(".tile[data-a]");
  const quiet = await p2.evaluate((cid) => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === cid).state.seen, id);
  same([quiet["title:1"], quiet["perm:1:0"], quiet["perm:0:1"]], ["Raised by the guild (Shadow)", "know how a locks built", "run the rooftops"], "the typo fixes taken in quietly, and the real change kept for its mark");
  has(await p2.textContent(".cc-note.is-gold"), "3 lines on Vesk’s sheet have changed", "the note for a rule change");
  same(await p2.$eval('.tile[data-a]:has(.tile-name:text-is("Locks"))', (el) => el.classList.contains("is-changed")), true, "a gold corner on Locks");
  same(await p2.$$eval(".tile.is-changed", (els) => els.length), 1, "only Locks changed on the play screen");
  await p2.click('.cc-gold[data-k="num:stride"]');
  has(await p2.textContent(".cc-head .cc-was"), "Was Stride 5 (Light on my Feet)", "Stride's old number");
  has(await p2.textContent(".cc-head .cc-was"), "Now Stride 6 (Light on my Feet)", "Stride's new number");
  await p2.click('.tile[data-a]:has(.tile-name:text-is("Locks"))');
  has(await p2.textContent("#cc-dialog .cc-was"), "Was 5 steps, d10", "Locks' old size on its card");
  has(await p2.textContent("#cc-dialog .cc-was"), "Now 4 steps, d8", "Locks' new size on its card");
  await p2.click('#cc-dialog .dlg-head button[data-act="close"]');
  await p2.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await p2.click('.cc-tabs a[data-t="sheet"]');
  const marks = await p2.$$eval(".cc-gold", (els) => els.map((el) => el.dataset.k).sort());
  same(marks, ["act:Locks", "num:stride", "perm:0:1"], "the gold marks on the sheet");
  await p2.click('.cc-gold[data-k="perm:0:1"]');
  const shown = await p2.textContent('li:has(.cc-gold[data-k="perm:0:1"]) .cc-was');
  has(shown, "Was run the rooftops", "the permission's old words");
  has(shown, "Now run and leap the rooftops", "the permission's new words");
  await shot(p2, "gold-marks");
  const result = await new AxeBuilder({ page: p2 }).analyze();
  for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on the sheet with gold marks: ${v.id} (${v.nodes.length})`);
  await p2.click('.cc-note.is-gold button[data-act="seen"]');
  same(await p2.$$eval(".cc-gold, .cc-note.is-gold, .tile.is-changed", (els) => els.length), 0, "no gold marks once they're seen");
  await p2.reload();
  await p2.waitForSelector(".cc-page");
  same(await p2.$$eval(".cc-gold, .cc-note.is-gold, .cc-note", (els) => els.length), 0, "no gold marks or notes after a reload");
  await second.context.close();
  console.log("downtime: Vesk's week, undone, a second week kept offline, and a made-up rule change with gold marks");
}

// 9. Changing a character.
if (part("9")) {
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  const B = book.companion.build;
  // What downtime grew, written into a build, makes the sheet the player had.
  const shape = (c) => ({
    actions: c.actions.map((a) => [a.name, a.steps, a.die]),
    numbers: ["aura", "resolve", "stride", "wound", "shrug", "confidence"].map((k) => c.numbers[k]),
    titles: c.titles.map((t) => [t.name, t.archetype, t.permissions.map((p) => p.text)]),
    traits: c.traits.map((t) => t.name),
    attuned: c.attuned.map((a) => [a.stage, a.catch, a.permissions.map((p) => p.text)]),
  });
  for (const c of book.crew) {
    const grown = [
      { k: "perm", t: 0, text: "slip through a crowd", on: ["Sneak"] },
      { k: "swap", t: 1, j: 1, from: c.titles[1].permissions[1].text, text: "fight dirty with anything to hand", on: ["Fight"] },
      { k: "att", a: 0, text: "haul someone up after me", on: [], catch: "Loud", burden: "", up: false },
      { k: "trait", name: "Prepared", on: [] },
      { k: "title", arch: "Leader", text: "Captain of the crew", on: ["Talk"], perm: "rally a frightened crowd", permOn: ["Talk"] },
    ];
    const built = fromCrew(c, B, { keep: true });
    same(shape(sheetOf({ id: `keep-${c.id}`, name: c.name, build: built }, B)), shape(c), `${c.name} made into a build that keeps everything`);
    same(shape(sheetOf({ id: `fold-${c.id}`, name: c.name, build: foldGrown(built, grown, B) }, B)), shape(grow(c, grown, B)), `${c.name} with a downtime written into the build`);
  }
  // Everything the player sees, by content rather than by each line's id.
  const plain = (h) => String(h ?? "").replace(/<[^>]+>/g, "").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
  const look = (c) => {
    const label = (key) => {
      const l = c.lines.find((x) => x.key === key);
      return l ? `${l.kind}:${l.label}${l.item ? `@${l.item}` : ""}` : `?${key}`;
    };
    return {
      numbers: c.numbers, carry: c.carry, asp: c.aspiration, trouble: c.trouble,
      actions: c.actions.map((a) => [a.name, a.steps, a.die, a.lines.map(label).sort()]),
      titles: c.titles.map((t) => [t.name, t.archetype, t.permissions.map((p) => p.text)]),
      traits: c.traits.map((t) => [t.name, t.type, plain(t.html), t.step, t.aura]),
      attuned: c.attuned.map((a) => [a.name, a.stage, a.catch ?? null, a.burden ?? null, a.permissions.map((p) => p.text)]),
      threads: c.threads.map((p) => [p.person, p.threads.map((t) => [t.text, t.note ?? null])]),
    };
  };
  const folds = (built, grown, what) => same(look(sheetOf({ id: `f-${what}`, name: built.name, build: foldGrown(built, grown, B) }, B)), look(grow(sheetOf({ id: `g-${what}`, name: built.name, build: built }, B), grown, B)), what);
  const long = (w, n) => `${w} `.repeat(Math.ceil(n / (w.length + 1))).slice(0, n).trim();
  for (const c of book.crew) {
    const built = fromCrew(c, B, { keep: true });
    const grown = [
      { k: "att", a: 0, text: "pushed past its stage", on: ["Move"], catch: "", burden: "", up: false },
      { k: "att", a: 0, text: "haul someone up after me", on: [], catch: long("Loud", 110), burden: "", up: false },
      { k: "trait", name: long("Steady", 110), on: [], own: { type: long("Whenever", 100), text: long("Gain 1 Aura when the lamps go out", 190) } },
      { k: "thread", person: long("Harbourmaster", 110), text: "She let me off once." },
    ];
    folds(built, grown, `${c.name} with a permission pushed past its stage and long downtime words`);
    has(checksOf(foldGrown(built, grown, B), B, { changing: true }).map((x) => x.text).join(" "), "has more on it than Awakened holds", `${c.name}'s warning for the permission past its stage`);
  }
  {
    const b = blankBuild();
    b.name = "Tui";
    b.attuned[0] = { name: "A black lantern", stage: "Tempered", catch: "", burden: "Bad Knee", perms: ["see the dead", "light the way home", "hold a ghost still", "burn without fuel"].map((text) => ({ text, on: [] })) };
    folds(normalBuild(b), [{ k: "att", a: 0, text: "", on: [], catch: "", burden: "", up: true }], "a Tempered thing with four going up to Perfected with no Catch");
    b.name = "Kel";
    b.attuned[0] = { name: "A rope", stage: "Awakened", catch: "", burden: "", perms: [{ text: "climb anything", on: ["Move"] }, { text: "tie anyone up", on: ["Fight"] }] };
    const grown = [{ k: "att", a: 0, text: "swing across a gap", on: ["Move"], catch: "Heavy", burden: "", up: false }];
    folds(normalBuild(b), grown, "a line waiting for its Catch, and a downtime that gives it one");
    same(foldGrown(normalBuild(b), grown, B).attuned[0].perms.map((p) => p.text), ["climb anything", "swing across a gap", "tie anyone up"], "the waiting line kept, after what downtime grew");
  }
  const seven = blankBuild();
  seven.titles[0].perms = Array.from({ length: 7 }, (_, i) => ({ text: `do the thing ${i + 1}`, on: [] }));
  same(normalBuild(seven).titles[0].perms.length, 6, "a seventh permission cut from a saved build");

  const { context, page } = await phone();
  const axe = async (what) => {
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`axe on ${what}: ${v.id} (${v.nodes.length})`);
  };
  const b = (attrs) => page.click(`button[data-act="b"]${attrs}`);
  const dt = (attrs) => page.click(`#cc-dialog button[data-act="dt"]${attrs}`);
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const tab = (t) => page.click(`.cc-tabs a[data-t="${t}"]`);
  const tilesNow = () => page.$$eval(".tile[data-a]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, parseInt(el.querySelector(".tile-steps").textContent, 10), el.querySelector(".tile-die").textContent]));
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.name === "Vesk"));
  const golds = () => page.$$eval(".cc-gold, .cc-gem, .cc-note.is-gold, .tile.is-changed", (els) => els.length);
  const bram = "He once carried me out of a fire. I have never said thank you.";
  const bramNow = "He once carried me out of a fire. I still haven’t said thank you.";

  await play(page, "vesk", "Vesk");
  // A downtime first: Prepared from the list, and a permission on Sneak.
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="trait"]');
  await page.selectOption("#dt-trait-0", "Prepared");
  await dt('[data-do="pick"][data-s="1"][data-v="perm"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "slip through a crowd");
  await dt('[data-do="on"][data-s="1"][data-f="on"][data-v="Sneak"]');
  await dt('[data-do="finish"]');
  await closed();
  same((await tilesNow()).find((t) => t[0] === "Sneak"), ["Sneak", 4, "d8"], "Sneak after a downtime");
  await tab("sheet");
  has(await page.textContent(".cc-page"), "You can carry one more utility item.", "Prepared from downtime on her sheet");
  // Then play: a Hurt, 1 Aura spent, her thread with Bram strained, her smoke bomb used.
  await inFold(page, `button[data-act="strain"][data-k="Bram|${bram}"]`);
  await inFold(page, 'button[data-act="cross"][data-k="utility|a smoke bomb"]');
  await tab("play");
  await page.click('.cc-stat[data-p="wound"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('button[data-act="aura"][data-d="-1"]');

  // The way in's on the play screen too.
  has(await page.textContent(".cc-scene"), "Change Vesk", "Change by New scene and Downtime");
  await tab("sheet");
  await page.click('.cc-changebar a[data-act="bopen"]');
  has(await page.textContent(".bd-head h1"), "Change anything on her sheet", "changing one of the crew");
  has(await page.textContent(".cc-note"), "comes straight off the chapter for now", "the note that she'll stop following the chapter");
  same(await page.inputValue("#b-t0-p3"), "slip through a crowd", "downtime's permission, there to change");
  same(await page.getAttribute('.bd-trait[data-v="Prepared"]', "aria-pressed"), "true", "downtime's trait, there to change");
  same(await page.$$eval(".bd-part > h2", (els) => els.length), 8, "every part of her sheet on one page");
  same(await page.$eval('details[data-open="bd-good"]', (el) => el.open), false, "what makes a good Aspiration shut when changing her");

  // A third Title, on Talk, up to six permissions and no seventh.
  await b('[data-b="addtitle"]');
  await b('[data-b="arch"][data-t="2"][data-v="Leader"]');
  await page.fill("#b-t2-text", "Captain of the crew");
  await page.fill("#b-t2-p0", "rally a frightened crowd");
  for (let j = 1; j < 6; j++) {
    await b(`[data-b="addperm"][data-t="2"]`);
    await page.fill(`#b-t2-p${j}`, ["give orders under fire", "read a room full of soldiers", "talk a crew round", "keep a ship together", "know who’s lying in my crew"][j - 1]);
  }
  same(await page.$$eval('[data-b="addperm"][data-t="2"]', (els) => els.length), 0, "no Add a permission at six");
  has(await page.textContent('fieldset:has(#b-t2-text)'), "Six is the most a Title holds.", "the six-permission note");
  await b('[data-b="deep"][data-s="1"]');
  await page.click('fieldset:has(#b-t2-text) button[data-b="perm"]');
  has(await page.textContent("#cc-toast"), "Six is the most a Title holds", "a seventh permission refused");
  same(await page.$$eval('input[id^="b-t2-p"]', (els) => els.length), 6, "still six permissions on the third Title");
  await b('[data-b="on"][data-l="t2"][data-a="Talk"]');
  await b('[data-b="on"][data-l="p2.0"][data-a="Talk"]');
  has(await page.textContent('.bd-part[aria-labelledby="bd-part-3"] .tile:has(.tile-name:text-is("Talk"))'), "3 steps", "Talk with the new Title and its permission");
  // Reword downtime's permission, a thread and the smoke bomb.
  await page.fill("#b-t0-p3", "slip through any crowd");
  const thread = await page.$eval(`input[data-bin$=".text"][value="${bram}"]`, (el) => el.id);
  await page.fill(`#${thread}`, bramNow);
  const bomb = await page.$eval('input[data-bin^="u"][value="a smoke bomb"]', (el) => el.id);
  await page.fill(`#${bomb}`, "two smoke bombs");
  await page.setViewportSize({ width: 320, height: 720 });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (wide > 0) note(`changing a character scrolls sideways at 320 wide (${wide}px)`);
  await axe("changing a character at 320 wide");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  has(await page.textContent("#cc-toast"), "She’s your own now", "the toast once she's your own");

  // What she is now: your own, with her play kept and her sheet adding up.
  const check = async (when) => {
    const ch = await saved();
    same([ch.crew, ch.from, Boolean(ch.build), ch.state.grown.length, ch.state.wound, ch.state.aura, ch.state.threads[`Bram|${bramNow}`], ch.state.crossed["utility|two smoke bombs"]], ["own", "vesk", true, 0, 4, 4, "strained", true], `Vesk saved as your own, ${when}`);
    same(JSON.stringify(ch.build).includes('"was"'), false, `nothing from the change left in her build, ${when}`);
    const tiles = await tilesNow();
    same(tiles, [["Sneak", 4, "d8"], ["Move", 4, "d8"], ["Locks", 5, "d10"], ["Defend", 2, "d4"], ["Fight", 2, "d4"], ["Study", 1, "d2"], ["Talk", 3, "d6"]], `her set actions, ${when}`);
    for (const [name, steps, die] of tiles) same(die, diceLabel(stepsToDice(steps)), `${name}'s ${steps} steps through dice.js, ${when}`);
    same([await page.textContent('.cc-stat[data-p="aura"] .v'), await page.textContent('.cc-stat[data-p="resolve"] .v'), await page.textContent('.cc-stat[data-p="wound"] .v')], ["4/5", "3/3", "d4"], `her Aura, Resolve and wound die, ${when}`);
    same(await golds(), 0, `no gold marks, ${when}`);
    await tab("sheet");
    const text = await page.textContent(".cc-page");
    for (const want of ["Third Title", "Captain of the crew", "know who’s lying in my crew", "slip through any crowd", bramNow, "two smoke bombs", "made from Vesk’s sheet in the rules"]) has(text, want, `her sheet, ${when}`);
    has(await page.textContent(`li.cc-thread:has-text("${bramNow}")`), "Bond, strained", `the reworded thread still strained, ${when}`);
    same(await page.getAttribute('button[data-act="cross"][data-k="utility|two smoke bombs"]', "aria-pressed"), "true", `the reworded smoke bomb still crossed out, ${when}`);
    same(await golds(), 0, `no gold marks on the Sheet tab, ${when}`);
    await tab("play");
  };
  await check("once it's saved");
  same(await page.getAttribute(".cc-undo", "aria-label"), "Nothing to undo", "no undo back past the change");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector(".tile[data-a]");
  await check("after a reload");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-a]", { timeout: 10000 }).catch(() => note("Vesk didn't open offline after the change"));
  await check("offline");
  await context.setOffline(false);

  // A change left part way, then a downtime: it starts again from her as she
  // is now, so what the downtime gave her is still there.
  await tab("sheet");
  await page.click('.cc-changebar a[data-act="bopen"]');
  await page.fill("#b-blurb", "Left half done.");
  await page.click('a[data-b="leave"]');
  await tab("play");
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="perm"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "case a building at a glance");
  await dt('[data-do="pick"][data-s="1"][data-v="pressure"]');
  await dt('[data-do="finish"]');
  await closed();
  await page.click('.cc-scene a[data-act="bopen"]');
  has(await page.textContent("#cc-toast"), "starts again from her sheet as it is now", "a change left part way starting again");
  same(await page.inputValue("#b-t0-p4"), "case a building at a glance", "the second downtime's permission, there to change");
  same(await page.inputValue("#b-blurb"), book.crew.find((c) => c.id === "vesk").blurb, "the half-done change gone, not saved over the downtime");

  // A downtime on another tab while a change is open: saving the change
  // doesn't wipe it, and the change starts again from her as she is now.
  await page.fill("#b-blurb", "Changed in one tab.");
  const other = await context.newPage();
  other.on("pageerror", (e) => note(`page error in the second tab: ${e}`));
  await other.goto(`${BASE}/characters/?c=${encodeURIComponent((await saved()).id)}`);
  await other.waitForSelector(".tile[data-a]");
  const odt = (attrs) => other.click(`#cc-dialog button[data-act="dt"]${attrs}`);
  await other.click('button[data-act="downtime"]');
  await odt('[data-do="pick"][data-s="0"][data-v="perm"]');
  await other.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "read a crowd at a glance");
  await odt('[data-do="pick"][data-s="1"][data-v="pressure"]');
  await odt('[data-do="finish"]');
  await other.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await other.close();
  await page.click('.bd-foot button[data-b="save"]');
  has(await page.textContent("#cc-toast"), "changed on another phone or tab while this was open", "saving a change after a downtime on another tab");
  same(await page.inputValue("#b-t0-p5"), "read a crowd at a glance", "the other tab's downtime, there to change");
  same(await page.inputValue("#b-blurb"), book.crew.find((c) => c.id === "vesk").blurb, "the change from before it, not saved over it");
  same((await saved()).state.grown.map((g) => g.text), ["case a building at a glance", "read a crowd at a glance"], "both downtimes still on her");

  // Seven Titles: the sheet calls them first to seventh, and on paper the
  // seventh goes in Notes.
  for (const [i, [arch, name, perm]] of [["Warrior", "Duellist of the Low Market", "win a fair fight"], ["Scholar", "Reader of old maps", "read a map nobody else can"], ["Healer", "Stitcher of the crew", "stitch a wound in the dark"], ["Bard", "Voice of the docks", "start a song a crowd joins"]].entries()) {
    const t = 3 + i;
    await b('[data-b="addtitle"]');
    await b(`[data-b="arch"][data-t="${t}"][data-v="${arch}"]`);
    await page.fill(`#b-t${t}-text`, name);
    await page.fill(`#b-t${t}-p0`, perm);
  }
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  same(await page.textContent('.cc-stat[data-p="resolve"] .v'), "7/7", "Resolve with seven Titles, full since it was full");
  await tab("sheet");
  has(await page.textContent(".cc-page"), "Seventh Title", "the seventh Title on her sheet");
  same(await golds(), 0, "no gold marks with seven Titles");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click('button[data-act="print"]')]);
  const form = (await PDFDocument.load(readFileSync(await download.path()))).getForm();
  const get = (name) => form.getFieldMaybe(name)?.getText?.() ?? null;
  same([get("title_3"), get("title_3_permission_6"), get("title_6"), get("title_6_permission_1")], ["Captain of the crew", "know who’s lying in my crew", "Stitcher of the crew", "stitch a wound in the dark"], "Titles III and VI on paper");
  has(get("notes"), "Title VII, Voice of the docks (Bard): start a song a crowd joins", "the seventh Title in Notes");
  has(get("set_talk_lines"), "Title III", "Title III on Talk on paper");
  const toastSays = (re, what) => page.waitForFunction((src) => new RegExp(src).test(document.querySelector("#cc-toast")?.textContent ?? ""), re.source, { timeout: 5000 }).catch(() => note(`no toast saying ${what}`));
  await toastSays(/ready to print/, "the sheet's ready to print");
  same(/ran out of room/.test(await page.textContent("#cc-toast")), false, "no Notes warning when everything fits");
  // Notes too long for the paper: print says so.
  await openFold(page, "notes");
  await page.fill("#cc-notes", long("The night at the docks went wrong from the first bell", 2400));
  await Promise.all([page.waitForEvent("download"), page.click('button[data-act="print"]')]);
  await toastSays(/ran out of room/, "Notes ran out of room on paper");

  // A crossed-out thing in the bag stays crossed out when it's reworded.
  await page.click('.cc-changebar a[data-act="bopen"]');
  await b('[data-b="deep"][data-s="4"]');
  await page.fill("#b-bag", "a coil of rope\nsome bread");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  await tab("sheet");
  await inFold(page, 'button[data-act="cross"][data-k="bag|some bread"]');
  await page.click('.cc-changebar a[data-act="bopen"]');
  await b('[data-b="deep"][data-s="4"]');
  await page.fill("#b-bag", "a coil of rope\nsome stale bread");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  const crossed = (await saved()).state.crossed;
  same([crossed["bag|some stale bread"], crossed["bag|some bread"]], [true, undefined], "a reworded thing in the bag, still crossed out");
  console.log("changing: Vesk made your own with a third Title, six permissions and no seventh, kept offline, and seven Titles printed");
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
  // Every die an example gives one of the crew's set actions is the one on their sheet.
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  let dieChecks = 0;
  for (const c of cards) {
    for (const m of c.example.matchAll(/\b(Vesk|Dorrie|Bram|Isolde|Wren|Ash)['’]s ([A-Z][a-z]+(?: [a-z]+){0,2})(?:,| is) (?:(\d+) steps, )?a (d\d+)\b/g)) {
      const action = book.crew.find((x) => x.name === m[1])?.actions.find((a) => a.name.toLowerCase() === m[2].toLowerCase());
      if (!action) continue;
      dieChecks += 1;
      same([m[3] ? Number(m[3]) : action.steps, m[4]], [action.steps, action.die], `learn: “${c.title}” gives ${m[1]}'s ${m[2]}`);
    }
  }
  if (dieChecks < 4) note(`learn: only ${dieChecks} set actions found in the examples to check against the crew's sheets`);
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

  // A place: its number, its dice and its parts as tabs, a tag that says
  // what it does, and Roll a d20 on Twenty Places.
  const places = chapterOf("twenty-places");
  await page.goto(`${BASE}/rules/twenty-places/`);
  await page.waitForSelector(".hub-place");
  same(await page.locator(".hub-place").count(), 20, "Twenty Places has a card for every place");
  await page.evaluate(() => (Math.random = () => 0.31));
  await page.click(".hub-d20");
  await page.waitForSelector(".hub-rolled.on a", { timeout: 5000 }).catch(() => note("Roll a d20 never landed"));
  const rolled = places.hub.rows.find((r) => r.place?.n === 7);
  same([await text(page, ".hub-rolled .n"), await text(page, ".hub-rolled a"), await page.getAttribute(".hub-place.is-rolled", "data-s")], ["7", rolled.title, rolled.id], "Roll a d20 picks out the place");
  await shot(page, "places-rolled-dark");
  await page.click(".hub-rolled a");
  await opened(page, rolled.id);
  await page.goto(`${BASE}/rules/twenty-places/#s-place-copper-baths`);
  await opened(page, "s-place-copper-baths");
  const tabs = () => page.evaluate(() => {
    const pl = document.querySelector(".rd-track > section.is-on .pl");
    return { tab: pl.querySelector(".pl-tab[aria-selected='true']").dataset.tab, panels: [...pl.querySelectorAll(".pl-panel")].filter((p) => p.checkVisibility()).map((p) => p.dataset.tab) };
  });
  same([await text(page, ".rd-count"), await text(page, ".is-on .pl-n"), await tabs()], ["1 of 21", "1", { tab: "scene", panels: ["scene"] }], "the Copper Baths opens on its scene, number 1");
  await shot(page, "place-scene-dark");
  await page.click('.is-on .pl-tab[data-tab="tele"]');
  same(await tabs(), { tab: "tele", panels: ["tele"] }, "the Telegraphs tab");
  same(await page.locator(".is-on .pl-panel.on .tele").count(), 3, "the Copper Baths' three telegraphs, as cards");
  await shot(page, "place-telegraphs-dark");
  await page.keyboard.press("ArrowRight");
  same([await tabs(), await page.evaluate(() => document.activeElement?.dataset.tab)], [{ tab: "prep", panels: ["prep"] }, "prep"], "the right arrow on the tabs goes to Prep");
  await page.click('.is-on .pl-tab[data-tab="secret"]');
  same(await page.$eval(".is-on .pl-panel.on details.seal", (d) => d.open), false, "the Secret's sealed till it's opened");
  await page.click(".is-on .pl-panel.on details.seal > summary");
  has(await text(page, ".is-on .pl-panel.on .secret"), "Every Word Is Sold", "the Secret opens in a tap");
  await page.click('.is-on .pl-tab[data-tab="scene"]');
  const tag = await page.$eval(".is-on .pl-panel.on button.tag[data-tag]", (b) => b.dataset.tag);
  const tagged = JSON.parse(readFileSync("public/world-book.json", "utf8")).tags.find((t) => t.name === tag);
  await page.click(`.is-on .pl-panel.on button.tag[data-tag="${tag}"]`);
  same([await page.getAttribute(`.is-on .pl-panel.on button.tag[data-tag="${tag}"]`, "aria-expanded"), (await text(page, ".is-on .tagx")).includes(tagged?.does?.slice(0, 30) ?? "?")], ["true", true], `${tag} says what it does`);
  await shot(page, "place-tag-dark");
  await page.click(`.is-on .pl-panel.on button.tag[data-tag="${tag}"]`);
  same(await page.locator(".is-on .tagx").count(), 0, "tapped again, it's put away");
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
  has(await text(page, ".zp-text"), "counts once a roll", "a chapter's pop-up offline");
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
    await page.goto(`${BASE}/rules/twenty-places/`);
    await page.waitForSelector(".hub-place");
    await axe("Twenty Places' contents");
    await shot(page, `places-${theme}`);
    await page.goto(`${BASE}/rules/twenty-places/#s-place-copper-baths`);
    await page.waitForSelector(".rd-track > section.is-on .pl");
    await page.click(".is-on .pl-panel.on button.tag[data-tag]");
    await axe("a place, with a tag open");
    await shot(page, `place-scene-${theme}`);
    for (const t of ["tele", "prep", "secret"]) {
      await page.click(`.is-on .pl-tab[data-tab="${t}"]`);
      await axe(`a place's ${t} tab`);
    }
    await page.goto(`${BASE}/rules/the-bestiary/#${chapterOf("the-bestiary").hub.rows[0].id}`);
    await page.waitForSelector(".rd-track > section.is-on .box-threat");
    await axe("a page of threats");
    await shot(page, `threats-${theme}`);
    await page.goto(`${BASE}/rules/title-ideas-and-the-crew/#s-pregens`);
    await page.waitForSelector(".rd-track > section.is-on .box-sheet");
    await axe("the crew's sheets");
    await context.close();
  }
  console.log(`reading: ${cards.length} cards checked against the chapters and the crew's sheets (${dieChecks} set actions), the deck swiped, remembered and read offline, a chapter's contents and its sections a page at a time (swiped, keyed, Back and Forward), bookmarks, what's read and where you're up to, pop-ups, Carry on reading, and a place's tabs, tags and Roll a d20`);
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
