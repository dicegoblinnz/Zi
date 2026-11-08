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
//    Mind or her Soul, extra actions for 3 Aura stopping at one for each
//    archetype past the first with holding and hiding on top, and When it
//    lands saying the track or Defend that rolled, on the table screen too.
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
//    defending on his own, dice on one side added up, and what's kept on the
//    phone between rolls.
// 2. Every crew member's Roots and specialties on the phone match their sheet
//    in the chapter: each specialty's tile on its usual Root with the dice it
//    rolls, the Roots on their own, three tracks on d12, full Aura and a plate
//    for every box of armour on their Body.
// 3. Vesk at the table: her Body and her Locks are 9 steps, her picks make it
//    10, her Mind makes it 8, making a case for her Stealth is 1 Aura, and her
//    Soul with nothing that fits is still a d2. Over the wall on her grappling
//    line with fixed dice, a win on a top face takes her Aura to 7 while she's
//    acting, and finishing drops it back to 5. A reload and no signal keep it,
//    with the rules on a tap. A tie won for 1 Aura pays nothing back, Undo
//    takes it off, a split's three dice, bringing something in is 1 Aura and a
//    step, and her Shadow's Push is +3, paid with 1 Stamina or 2 for 1. Getting
//    into hiding puts the dice she hid with in her shadow pool, and a later
//    roll uses one as steps and one as its own die.
// 3c. Bram Defends the way the book's example does, three d8s against his
//    Body and Shieldwork with his plate and shield split into a d10 and two
//    d6s and his Stamina, so nothing gets through and the Aura stops at 5.
//    Then blows on his tracks alone tick his plate's boxes and his shield's
//    till they break, 2 for 1 pays one off his Confidence and his Resolve, his
//    Defend loses what's broken, and downtime mends his plate.
// 4. The tracks: Vesk's Stamina to d2, Vanish paid 2 for 1 since paying never
//    goes below the smallest size, a Blaze and its Scar written as a Catch,
//    locking d2, the rest at the end of a scene with fixed dice, her grappling
//    line pumped, used and emptied by a new scene, and 2 for 1 on a hit.
//    Dorrie's Confidence against a lie, with her court clothes on her Mind,
//    and Isolde's Resolve Blazing at d2 and her choosing to die.
// 4b. Saved before Roots: Old Vesk moves onto it with her Scar on Stamina,
//    her conditions, her strained thread and her notes, puts an old permission
//    back on free and lets the rest go. Tamsin, built on the phone before
//    Roots, shows as she was, set actions and all, with nothing to play till
//    she's rebuilt (5c).
// 5. Building your own on Roots: Vesk again, a step to a screen. Two
//    Shadows, her Titles each on a Root with three specialties, a permission's
//    Root and specialty, her Roots and specialties added up with where each
//    comes from, her leathers as armour on her Body, her grappling line with
//    a passive awakening, and threads from the crew questions. Saved, she
//    plays her sheet from the chapter. Then a roll, a reload, offline, a
//    change (a Boon for two slots, a fourth permission filling six, and a
//    Masterwork shield), her Boon taking the first hit When it lands, a blank
//    character saved with its warnings, a draft
//    waiting on the list, and every step at 320 wide in both themes with axe.
// 5b. The builder in one hand: full screen with the crest at the top, the
//    first choice high up, the seven steps in one line, Back and Next in the
//    bar at the bottom on every step, and a Root's die growing in the dock as
//    a Title and a permission go on, or swapping straight away under
//    reduce-motion. axe on every step and with things picked, dark and light.
// 5c. The other ways in. Every crew member made into a build has the sheet
//    the chapter gives them, and a thousand random characters pass every
//    check with one attuned thing and both kinds of thread. Bram from the crew
//    and a random one saved and played, a way in asking before it bins a
//    draft, Vesk from the crew becoming your own with her play kept and no
//    gold marks, Tamsin from before Roots rebuilt on them, her Roots guessed
//    from her words and her notes and thread kept, and a Gambler's free flip
//    on their die and Double or nothing on his own.
// 6. Print: Vesk part way through a scene (a Scar, Burning, Aura spent and
//    pumped, a strained thread and her smoke bomb used) read back field by
//    field off the new sheet, then Bram's plate with a box ticked and Dorrie's
//    court clothes on her Confidence.
// 7. Dice, feel and learning. The learning round on the crew's sheets three
//    ways: the club beaten with Aura past 5, a tie won for 1 Aura that pays
//    nothing back, and real dice that lose, so the club takes a size off
//    Isolde's Stamina with her armour on her Mind. Then offline, and 320 wide
//    in both themes with axe. With motion on, the dice tumble and land on their
//    numbers, the roll card turns over, the tabs slide and Aura pops back in.
//    Sound and buzz stay off until the switch turns them on, and then a
//    landing, a top face, a hit and a hit that leaves her Stamina on d2 each
//    get one.
// 7b. A character in one hand: full screen with the crest at the top, the
//    first specialty high up, the specialties as the dice they roll, no
//    sideways scroll, 44px tap targets and every name fitting its tile, her
//    12 front and centre with its top face lit, and the Sheet tab under two
//    screens with its folds shut, with axe on all of it in both themes. A hit
//    with reduce-motion on swaps the track's shape, and nothing moves.
// 7c. The dice roller, off Vesk's play screen and the Characters list. Bram
//    Defending against three d8s with fixed dice, the most stopped, a swap,
//    the same dice read the other way, and Vesk's sheet left as it was. The
//    set-up kept through a reload, dice on one side added up, one die tied,
//    Ash's area with each man on his own and as one thing, real dice tapped
//    in, Esc, and the list's way in offline. Then 320 wide in both themes:
//    nothing sideways, every button 44px, and axe on the set-up and a result.
//    With motion on the dice tumble, and a tap lands them.
// 8. Downtime and rule changes. Vesk's week: every track up a size, Recover
//    and a new permission on her Body and her Stealth, undone and done again,
//    then her Aspiration with fixed dice and a new awakening with its Catch,
//    and a reload. A made-up rule change against her saved sheet: a reworded
//    permission, her Stride and a permission moved to Climbing get gold
//    marks with old and new, typo fixes stay quiet, what she grew isn't
//    marked, and Got it clears them for good.
// 9. Every crew member's growth adds up on Roots (a permission, a thread, a
//    Title, an archetype and an awakening), a Title stops at six permissions,
//    a Boon takes two permissions' slots and one that won't fit takes nothing
//    off, and Vesk's Aspiration past d12 gives her a third Title on the phone.
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
import { ROOTS, rootFor, rootsSheet } from "../src/companion/roots.js";
import { checksOf, sheetOf } from "../src/companion/builder.js";
import { fromCrew, randomBuild } from "../src/companion/ways.js";
import { CARD_WORDS, CREW, DECK_SIZE, newestChange, reachOf, readCards, staleCards } from "../scripts/learn.mjs";
import * as T from "../src/companion/table-rules.js";
import * as B from "../src/companion/board.js";
import * as RV from "../src/companion/reveal-rules.js";
import * as TR from "../src/companion/turn-rules.js";
import { dialsOf, foundNews, shapeOf, timeUp } from "../src/companion/found-rules.js";
import { MOST, bestMatch, readDice, setupOf, swapped } from "../src/companion/roller-rules.js";
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
  // On Roots (8 Nov): a telegraph's at a Root, only what's at a Body can be
  // intercepted, When it lands says the track or Defend that rolled, and the
  // extra actions bought with 3 Aura stop at one for each archetype past the
  // first, with holding and hiding on top. Bram's got one archetype here.
  {
    const roster2 = roster.map((x) => ({ ...x, n: x.ch === "bram" ? 1 : 2 }));
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
    const buy = (id, n, more, list) => ({ o: "acts", round: "round-root01", ch: id === "bram" ? "bram" : "vesk", x: { more, list: list.map((j) => ({ id: `act-${id}-r${j}`, k: "else", act: "Move", t: 4900 + j })) } });
    ok2(buy("vesk", 2, ["aura"], [1, 2]), kai, "Vesk, with two archetypes, buys one extra action with Aura", { phoneNow: 5000 });
    not2(buy("vesk", 3, ["aura", "aura"], [1, 2, 3]), kai, "but not a second", { phoneNow: 5000 });
    ok2(buy("vesk", 3, ["aura", "hiding"], [1, 2, 3]), kai, "coming out of hiding's on top", { phoneNow: 5000 });
    not2(buy("bram", 2, ["aura"], [1, 2]), sam, "and Bram, with one archetype, has none to buy", { phoneNow: 5000 });
    ok2(buy("bram", 2, ["held"], [1, 2]), sam, "though holding his action last round gives him one", { phoneNow: 5000 });
    ok2({ o: "end", round: "round-root01" }, gm, "the round on Roots ends");
    not2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Stamina", stopped: true, mine: 7, v: 4 } }, lee, "her Stamina can't roll against the lie at her Mind");
    ok2({ o: "defend", id: "tele-lie-r01", ch: "isolde", r: { on: "Confidence", stopped: true, mine: 7, v: 4 } }, lee, "her Confidence stops it");
    ok2({ o: "defend", id: "tele-curse-1", ch: "isolde", r: { on: "Defend", stopped: false, mine: 3, v: 9, paid: "Resolve down to d10" } }, lee, "her Defend doesn't stop the curse");
    ok2({ o: "defend", id: "tele-club-r1", ch: "bram", r: { on: "Stamina", stopped: true, mine: 8, v: 5 } }, sam, "and Bram's Stamina stops the club he took");
    same(doc2.rounds[0].tele.map((t) => t.def?.on), ["Stamina", "Confidence", "Defend"], "each one saying the track or Defend that rolled against it");
    const view = T.screenOf(doc2, { name: "Tuesday Lair", crew: [] });
    same(view?.round?.tele?.map((t) => [t.root, t.def?.on]), [["Body", "Stamina"], ["Mind", "Confidence"], ["Soul", "Defend"]], "the table screen showing each telegraph's Root and what rolled against it");
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
  // What's kept on the phone.
  same(setupOf(null), { you: [], them: [], def: "you", each: false }, "nothing kept starts empty, with them coming at you");
  same(setupOf({ you: [6, 7, "8", 20, 2], them: Array(20).fill(4), def: "them", each: "yes" }), { you: [6, 8, 2], them: Array(MOST).fill(4), def: "them", each: false }, "only real dice are kept, up to the most a side holds");
  same(setupOf({ def: "sideways" }).def, "you", "a way that isn't one comes back as them coming at you");
  console.log("the dice roller's rules checked");
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
  await page.waitForSelector(".tile[data-s]");
}

// 2. The crew's Roots and specialties. The phone reads each sheet off the
// chapter (book.json's crew, which the build checks adds up), so each
// specialty's tile is its usual Root and its steps, as the dice they make.
if (part("2")) {
  same(book.crew.length, 6, "the crew in book.json");
  const { context, page } = await phone();
  for (const base of book.crew) {
    const c = rootsSheet(base, [], BUILD);
    await play(page, base.id);
    const tiles = await page.$$eval(".cc-spectiles .tile[data-s]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, el.querySelector(".tile-steps").textContent, el.querySelector(".tile-die").textContent]));
    same(tiles, c.specialties.map((sp) => {
      const root = rootFor(c, sp.name);
      return [sp.name, `${root} ${c.roots[root]} and ${sp.steps}`, diceLabel(stepsToDice(c.roots[root] + sp.steps))];
    }), `${base.name}'s specialties`);
    same(await page.$$eval(".cc-roots .tile .tile-steps", (els) => els.map((e) => e.textContent)), ROOTS.map((r) => (c.roots[r] ? `${c.roots[r]} ${c.roots[r] === 1 ? "step" : "steps"}` : "nothing yet")), `${base.name}'s Roots`);
    same(await page.$$eval(".cc-track .is-trk .v", (els) => els.map((e) => e.textContent)), ["d12", "d12", "d12"], `${base.name}'s tracks to start with`);
    same(await page.textContent('.cc-stat[data-p="aura"] .v'), `${c.numbers.aura}/${c.numbers.aura}`, `${base.name}'s Aura to start with`);
    same(await page.$$eval(".cc-stat.t-stamina .zd-plate", (els) => els.length), c.armour.filter((a) => a.root === "Body").reduce((t, a) => t + a.boxes, 0), `${base.name}'s armour on their Body`);
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")));
  same([saved.v, saved.characters.length, saved.characters.every((x) => x.state?.v === 2)], [1, 6, true], "the saved list's version and size, every one on Roots");
  console.log(`crew: ${book.crew.length} sheets checked against the chapter`);
  await context.close();
}

// 3. Vesk at the table.
if (part("3")) {
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await shot(page, "1-characters");
  await play(page, "vesk", "Vesk");
  await shot(page, "2-play");
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const aura = () => page.textContent('.cc-stat[data-p="aura"] .v');
  const track = (t) => page.textContent(`.cc-stat[data-p="${t}"] .v`);
  const spec = (name) => `.cc-spectiles .tile[data-s]:has(.tile-name:text-is("${name}"))`;
  const tileOf = (name) => page.$eval(spec(name), (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`);
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const done = async () => { await page.click('#cc-dialog .dlg-foot button[data-act="close"]'); await closed(); };
  const shut = async () => { await page.click('#cc-dialog .dlg-head button[data-act="close"]'); await closed(); };
  const outs = () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  const body = () => page.textContent("#cc-dialog .dlg-body");
  const rolled = () => page.waitForSelector("#cc-dialog .res .res-out");
  const item = (k) => page.click(`#cc-dialog button[data-act="item"][data-k="${k}"]`);

  same(await tileOf("Locks"), "Body 5 and 4 · d12 + d6", "her Locks tile");
  same(await tileOf("Black market"), "Mind 3 and 2 · d10", "her Black market, on her Mind");
  same([await track("stamina"), await track("confidence"), await track("resolve"), await aura()], ["d12", "d12", "d12", "5/5"], "her tracks and Aura to start with");

  // Building a roll by pitching it: the vault door is her Body and her Locks,
  // and her picks make it 10. Her Mind, knowing how a lock's built, is 8.
  await page.click(spec("Locks"));
  has(await live(), "9 steps, d12 + d6", "her Body and her Locks");
  await item("utility|a perfect set of picks");
  has(await live(), "10 steps, d12 + d8", "with her picks");
  await page.click('#cc-dialog button[data-act="root"][data-v="Mind"]');
  has(await live(), "8 steps, d12 + d4", "her Mind, her Locks and her picks");
  same(await page.$$eval("#cc-dialog .cc-costs", (els) => els.length), 0, "a specialty that plainly fits is free");
  await page.click('#cc-dialog button[data-act="spec"][data-v="Stealth"]');
  await page.click('#cc-dialog button[data-act="pitch"]');
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "making a case for her Stealth");
  await page.click('#cc-dialog button[data-act="pitch"]');
  // Nothing that fits: her Soul's nothing yet, and every roll's at least a d2.
  await page.click('#cc-dialog button[data-act="root"][data-v="Soul"]');
  await page.click('#cc-dialog button[data-act="spec"][data-v=""]');
  await item("utility|a perfect set of picks");
  has(await live(), "1 step, d2", "her Soul on its own");
  await shut();

  // Over the wall on her grappling line: her Body, her Climbing and the line,
  // 8 steps, a d12 and a d4, against the guard's d6. Her d12 beats his 4 on a
  // top face, so that's 2 Aura, past 5 while she's acting.
  await page.click(spec("Climbing"));
  await item("attuned|0");
  has(await live(), "8 steps, d12 + d4", "her Body, her Climbing and her grappling line");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await page.click('#cc-dialog button[data-act="intent"][data-k="0"][data-v="Your own"]').catch(() => {});
  await page.evaluate(() => window.ziCompanion.setDice([12, 1, 4]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  await shot(page, "3-roll");
  same(await outs(), ["Beat it", "Under"], "her d12 and d4 against the guard's 4");
  has(await body(), "You’ve got 7 Aura, and you’re acting", "a win and a top face, past 5 while she's acting");
  await done();
  same(await aura(), "7/5", "Aura past 5 on her turn");
  has(await page.textContent('.cc-stat[data-p="aura"] .k'), "while acting", "the Aura says she's acting");
  has(await page.textContent(".cc-last"), "8 steps: 12 on the d12, 1 on the d4, against 4. 1 of 2 beat it.", "the last roll");
  await page.click('.cc-stat[data-p="aura"]');
  has(await page.textContent("#cc-panel"), "anything over 5 is gone", "Aura's panel while she's acting");
  await page.click('#cc-panel button[data-act="acting"][data-v="0"]');
  same(await aura(), "5/5", "anything over 5 goes once she's finished acting");
  await page.click('.cc-stat[data-p="aura"]');

  // A reload keeps it, and so does no signal once the service worker's got
  // the site.
  await page.reload();
  await page.waitForSelector(".tile[data-s]");
  same(await aura(), "5/5", "Aura after a reload");
  has(await page.textContent(".cc-last"), "against 4", "the last roll after a reload");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".tile[data-s]", { timeout: 10000 }).catch(() => note("the play screen didn't open offline"));
  same(await tileOf("Locks"), "Body 5 and 4 · d12 + d6", "her Locks offline");
  await page.click('.cc-stat[data-p="stamina"]');
  has(await page.textContent("#cc-panel .cc-rule"), "every hit that gets through", "the tracks' rule on a tap, offline");
  await page.click('.cc-stat[data-p="stamina"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button.cc-perm:has-text("move unseen")');
  has(await page.textContent("#cc-dialog"), "A permission on", "a permission on a tap, offline");
  await done();
  await page.click('.cc-tabs a[data-t="rules"]');
  for (const [title, want] of [["Defend", "Defend"], ["Intercept", "1 Aura"], ["The Tracks", "d12"], ["Aura", "past 5"]]) {
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
  await page.waitForSelector(".tile[data-s]");
  await context.setOffline(false);

  // A tie on her Knives, won for 1 Aura, which pays nothing back. Then a
  // split: the same 7 steps as three dice.
  await page.click(spec("Knives"));
  has(await live(), "7 steps, d12 + d2", "her Body and her Knives");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 1, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  same(await outs(), ["Tie", "Under"], "her 5 against their 5");
  await page.click('#cc-dialog button[data-act="win-tie"][data-i="0"]');
  same(await outs(), ["Tie, won for 1 Aura", "Under"], "the tie won");
  has(await body(), "You’ve got 4 Aura", "a tie won for 1 Aura, and nothing back for it");
  await done();
  same(await aura(), "4/5", "Aura after winning the tie");
  await page.click('button[data-act="undo"]');
  same(await aura(), "5/5", "Undo takes the tie back off");
  await page.click(spec("Knives"));
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  same(await page.$$eval("#cc-dialog .cc-dice .zd-die", (els) => els.length), 3, "her Knives split into three dice");
  has(await live(), "7 steps", "a split's the same steps");
  await shut();

  // Bringing something in: the chandelier is 1 Aura and a step.
  await page.click(spec("Climbing"));
  await page.click('#cc-dialog details[data-open="bring"] > summary');
  await page.click('#cc-dialog button[data-act="step"][data-n="other"][data-d="1"]');
  has(await live(), "8 steps", "the chandelier brought in");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "bringing something in costs 1 Aura");
  await shut();

  // Her Shadow's Push: +3 on a die, since she's a Shadow twice, paid with 1
  // Stamina off her home track.
  await page.click(spec("Stealth"));
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="10"]');
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
  await page.click(spec("Stealth"));
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([8, 2, 3]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  await page.click('#cc-dialog button[data-act="hid"]');
  has(await body(), "your d12 and d2 go in your shadow pool", "the dice she hid with going in her pool");
  await done();
  has(await page.textContent(".cc-pool"), "d12 and d2. Add them to any roll from the roll card", "her shadow pool on the play screen");
  await page.click(spec("Locks"));
  await page.click('#cc-dialog button[data-act="pool"][data-i="0"][data-v="steps"]');
  await page.click('#cc-dialog button[data-act="pool"][data-i="1"][data-v="die"]');
  has(await live(), "15 steps", "her Body and Locks with the shadow d12 as 6 steps");
  same(await page.$$eval("#cc-dialog .cc-dice .zd-die", (els) => els.map((el) => el.dataset.d)), ["12", "12", "6", "2"], "15 steps as two d12s and a d6, and the shadow d2 on its own");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 4, 3, 1, 2]));
  await page.click('#cc-dialog button[data-act="go"]');
  await rolled();
  has(await body(), "Used your shadow d12 as 6 steps and shadow d2", "the shadow dice used");
  await done();
  has(await page.textContent(".cc-pool"), "shadow pool’s empty", "her pool empty once it's used");
  console.log("Vesk: pitching, a top face past 5, finished acting, a reload, offline, a tie won, Undo, a split, bringing something in, a Push and her shadow pool");
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
    // When it lands: each telegraph's die at a Root, then the dice that roll.
    lands: async (list, { defend = false, spec = "", count = 0, shape = null, dice = [] } = {}) => {
      await page.click('.tile[data-act="defence"]');
      for (const [d, at] of list) {
        await page.click(`#cc-dialog button[data-act="d-add-at"][data-v="${at}"]`);
        await page.click(`#cc-dialog button[data-act="d-add"][data-v="${d}"]`);
      }
      if (defend) {
        await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
        if (spec) await page.click(`#cc-dialog button[data-act="d-spec"][data-v="${spec}"]`);
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

  // Bram Defends (Defend, in Conflict): three d8s at Wren's Body, intercepted,
  // and his Body and his Shieldwork with his plate and his shield, 11 steps,
  // split so the d12's two d6s. His Stamina rolls 9 with them, against 7, 5
  // and 2, so nothing gets through, and three dice won and a d6's top face
  // is 4 Aura. He's not acting, so it stops at 5.
  await t.panel("aura");
  has(await page.textContent("#cc-panel"), "You intercept for free", "a Guardian intercepts for free");
  for (let i = 0; i < 3; i++) await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await t.panel("aura", false);
  same(await t.aura(), "2/5", "Bram's Aura after spending 3");
  const shapes = diceShapes(11, 3);
  const six = shapes.findIndex((sh) => JSON.stringify(sh) === "[10,6,6]");
  if (six < 0) note(`no d10, d6 and d6 among 11 steps in three dice: ${JSON.stringify(shapes)}`);
  await page.click('.tile[data-act="defence"]');
  for (let i = 0; i < 3; i++) await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  await page.click('#cc-dialog button[data-act="d-spec"][data-v="Shieldwork"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "11 steps", "his Body, his Shieldwork, his plate and his shield");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  await page.click(`#cc-dialog button[data-act="shape"][data-i="${six}"]`);
  await page.evaluate(() => window.ziCompanion.setDice([9, 8, 6, 3, 7, 5, 2]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await t.landed();
  await shot(page, "3c-defend");
  same(await t.hits(), ["Stopped", "Stopped", "Stopped"], "nothing gets through Bram's Defend");
  has(await t.body(), "You’ve got 5 Aura", "4 Aura, stopping at 5 since he's not acting");
  await t.done();
  same(await t.aura(), "5/5", "Bram's Aura after the book's Defend");

  // A blow gets through on his tracks alone, and his plate takes it: a box
  // instead of his Stamina dropping. Two more, and the plate and the shield
  // are broken. The next is 2 for 1, off his Confidence and his Resolve.
  await t.lands([[8, "Body"]], { dice: [2, 7] });
  same(await t.hits(), ["Gets through"], "his Stamina's 2 against their 7");
  await t.pay("box", 0, "equipment|plate armour");
  await t.done();
  same(await t.track("stamina"), "d12", "his plate took it, so his Stamina's still d12");
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
  same(await t.tracks(), ["d12", "d10", "d10"], "2 for 1, off his Confidence and his Resolve");
  // Defending with his plate and shield broken, they're not on it.
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  await page.click('#cc-dialog button[data-act="d-spec"][data-v="Shieldwork"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "9 steps", "his Defend with his armour broken");
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
  console.log("Bram: the book's Defend, his plate and shield taking blows and breaking, 2 for 1, and his plate mended");
  await context.close();
}

// 4. The tracks. Vesk's Stamina down to a Blaze and a Scar, the rest at the
// end of a scene, an ability paid in sizes, 2 for 1, her grappling line's
// Aura, and Dorrie's Confidence against a lie and Isolde's Resolve against a
// curse.
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
  same(await t.aura(), "5/5", "Aura full for the new scene");

  // Her grappling line: Aura pumped in holds, and +1 a die for each Aura in
  // it when she uses it. The new scene empties it.
  await page.click('main button[data-act="pump"]');
  await page.click('main button[data-act="pump"]');
  same(await t.aura(), "3/5", "2 Aura pumped into her grappling line");
  has(await page.textContent("main .cc-held"), "2/2", "her grappling line holding 2");
  await page.click('.cc-spectiles .tile[data-s]:has(.tile-name:text-is("Climbing"))');
  await page.click('#cc-dialog button[data-act="item"][data-k="attuned|0"]');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="10"]');
  await page.evaluate(() => window.ziCompanion.setDice([7, 2, 8]));
  await page.click('#cc-dialog button[data-act="go"]');
  await t.rolled();
  same(await t.outs(), ["Under", "Under"], "her 7 against their 8");
  await page.click('#cc-dialog button[data-act="wakeplus"]');
  await page.click('#cc-dialog button[data-act="pick"][data-i="0"]');
  same(await t.outs(), ["Beat it", "Under"], "+2 from her grappling line on the 7");
  await t.done();
  has(await page.textContent("main .cc-held"), "2/2", "using it doesn't empty it");
  await page.click('main button[data-act="its-aura"]');
  same(await t.aura(), "4/5", "no Aura for a die her line added to after she rolled, and 1 the first time she gets somewhere nobody could follow");
  await page.click('button[data-act="scene"]');
  if (await page.isVisible("#cc-dialog")) {
    await page.evaluate(() => window.ziCompanion.setDice([1, 1, 1]));
    await page.click('#cc-dialog button[data-act="rest-go"]');
    await page.waitForSelector('#cc-dialog button[data-act="rest-done"]:not([disabled])');
    await page.click('#cc-dialog button[data-act="rest-done"]');
    await t.closed();
  }
  has(await page.textContent("main .cc-held"), "0/2", "the new scene empties her grappling line");
  same(await t.aura(), "5/5", "and her Aura's full");
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

// 4b. Saved before the Roots change. One of the crew moves onto Roots with
// her Scars on her Stamina and her old growth waiting to go back on, and a
// character built on the phone shows as it was till the builder rebuilds it.
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
  await page.waitForSelector(".tile[data-s]");
  has(await page.textContent(".cc-note"), "on the new rules", "the note that she's moved onto Roots");
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
  same([st.v, st.scars?.stamina?.length, "conf" in st, "wound" in st, st.threads["Dorrie|We have pulled a dozen jobs. I trust her with my life."]], [2, 1, false, false, "strained"], "her state saved on Roots, her strained thread kept");
  has(await page.textContent(".cc-before"), "traits are gone from the rules", "her old trait, to let go");
  // Her old permission goes back on free, with the Root and specialty it fits:
  // her Body and her Stealth go up 1 each. Her old Title she lets go.
  const back = 'form[data-form="putback"]:has(button[data-act="letgo"])';
  await page.selectOption(`.cc-before li:has-text("slip through any crowd") ${back} select[name="root"]`, "Body");
  await page.fill(`.cc-before li:has-text("slip through any crowd") ${back} input[name="spec"]`, "Stealth");
  await page.click(`.cc-before li:has-text("slip through any crowd") ${back} button[type="submit"]`);
  await page.click('.cc-before li:has-text("Captain of the crew") button[data-act="letgo"]');
  await page.click('.cc-before li:has-text("Silent Step") button[data-act="letgo"]');
  same(await page.$$eval(".cc-before", (els) => els.length), 0, "nothing left waiting once it's all put back or let go");
  has(await page.textContent("main"), "slip through any crowd", "her permission back on her sheet");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$eval('.cc-spectiles .tile[data-s]:has(.tile-name:text-is("Stealth"))', (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`), "Body 6 and 3 · d12 + d6", "her Stealth with the permission back on");
  // Tamsin was built on the phone, so she's shown as she was.
  await page.goto(`${BASE}/characters/?c=own-old`);
  await page.waitForSelector(".cc-before, .cc-note.is-gold");
  has(await page.textContent("main"), "built before the Roots change", "Tamsin's note");
  has(await page.textContent("main"), "Fight", "her set actions as they were");
  has(await page.textContent("main"), "4 steps", "her Fight: the action, her Title, her permission and her sword");
  has(await page.textContent("main"), "The best blade on the docks", "her Title as it was");
  same(await page.$$eval(".tile[data-s]", (els) => els.length), 0, "nothing of hers plays till she's rebuilt");
  console.log("old saves: Old Vesk on Roots with her Scar, conditions, thread and growth, and Tamsin shown as she was");
  await context.close();
}

// A fold in the builder opened, unless it's open already.
const unfold = async (page, key) => {
  if (!(await page.$eval(`details[data-open="${key}"]`, (el) => el.open))) await page.click(`details[data-open="${key}"] > summary`);
};

// 5. Building your own on Roots: Vesk again, a step to a screen, and every
// Root and specialty on the phone against her sheet in the chapter.
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
  // A permission typed in: its words, then its Root and its specialty.
  const perm = async (t, j, text, root, spec) => {
    await page.fill(`#b-t${t}-p${j}`, text);
    await b(`[data-b="proot"][data-t="${t}"][data-j="${j}"][data-v="${root}"]`);
    await page.fill(`#b-t${t}-p${j}-spec`, spec);
  };
  const specTiles = () => page.$$eval(".cc-spectiles .tile[data-s]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, el.querySelector(".tile-steps").textContent]));
  const wantTiles = want.specialties.map((sp) => {
    const root = rootFor(want, sp.name);
    return [sp.name, `${root} ${want.roots[root]} and ${sp.steps}`];
  });

  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="bopen"]');
  has(await step(), "Archetypes", "the builder's first step");
  await b('[data-b="arch"][data-t="0"][data-v="Shadow"]');
  await next("Archetypes");
  same(await page.getAttribute('.bd-seg[data-b="atab"][data-t="1"]', "aria-current"), "true", "Next going on to the second archetype first");
  await b('[data-b="arch"][data-t="1"][data-v="Shadow"]');
  has(await page.textContent(".bd-body"), "Shadow twice, so your Push is +3", "two Shadows");
  same(await page.$$eval(".bd-head .zd-crest.twice", (els) => els.length), 1, "the crest at the top doubled for Shadow twice");
  await shot(page, "5-builder-archetypes");
  await next("Titles and permissions");
  // Her first Title off the Rogue idea's cards, on her Body with its three
  // specialties, and a permission's Root and specialty picked for each.
  await unfold(page, "bd-ideas-0");
  await b('[data-b="idea"][data-t="0"][data-v="k-rogue"]');
  await b('[data-b="title"][data-t="0"][data-v="The best cat burglar in the city"]');
  await b('[data-b="root"][data-t="0"][data-v="Body"]');
  for (const [k, sp] of ["Stealth", "Climbing", "Locks"].entries()) await page.fill(`#b-t0-s${k}`, sp);
  await perm(0, 0, "move unseen", "Body", "Stealth");
  await perm(0, 1, "run the rooftops", "Body", "Climbing");
  await page.fill("#b-t0-p2", "pick a mechanical lock");
  await b('[data-b="proot"][data-t="0"][data-j="2"][data-v="Body"]');
  // One of the Title's own specialties is a tap.
  await b('[data-b="pspec"][data-t="0"][data-j="2"][data-v="Locks"]');
  same(await page.inputValue("#b-t0-p2-spec"), "Locks", "a permission's specialty tapped in from its Title's");
  same(await page.getAttribute('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', "data-d"), "8", "her Body a d8 with her first Title and its three permissions");
  await next("Titles and permissions");
  same(await page.getAttribute('.bd-seg[data-b="tab"][data-t="1"]', "aria-current"), "true", "Next going on to her second Title");
  await page.fill("#b-t1-text", "Raised by the Guild");
  await b('[data-b="root"][data-t="1"][data-v="Mind"]');
  for (const [k, sp] of ["Locks", "Knives", "Black market"].entries()) await page.fill(`#b-t1-s${k}`, sp);
  await perm(1, 0, "know how a lock’s built", "Mind", "Locks");
  await perm(1, 1, "fight dirty with a knife", "Body", "Knives");
  await perm(1, 2, "find a buyer for anything", "Mind", "Black market");
  await shot(page, "5-builder-titles");
  await next("Roots and specialties");
  // What it adds up to, and where each one comes from.
  const nums = await page.$$eval(".bd-from-list li", (els) => els.map((li) => [li.querySelector(".k").textContent, Number(li.querySelector("b").textContent)]));
  same(nums.slice(0, 3), ROOTS.map((r) => [r, want.roots[r]]), "the built Vesk's Roots");
  same(nums.slice(3).sort(), want.specialties.map((sp) => [sp.name, sp.steps]).sort(), "the built Vesk's specialties");
  has(await page.textContent(".bd-from-list"), "your first Title, “move unseen”, “run the rooftops”, “pick a mechanical lock” and “fight dirty with a knife”", "where her Body comes from");
  await next("What you carry");
  // What she carries, a part at a time: her leathers are armour on her Body,
  // Common to start with a box.
  await b('[data-b="fillany"][data-k="e"][data-v="worn leathers"]');
  if ((await pressedOn('[data-b="arm"][data-i="0"][data-v="Body"]')) !== "true") await b('[data-b="arm"][data-i="0"][data-v="Body"]');
  same(await page.$$eval(".bd-quality .bd-qual", (els) => els.map((el) => [el.textContent.trim(), el.getAttribute("aria-pressed"), el.querySelectorAll(".zd-plate").length])), [["Common", "true", 1], ["Fine", "false", 2], ["Masterwork", "false", 3]], "her leathers' quality, Common to start");
  await b('[data-b="arm"][data-i="0"][data-v="Mind"]');
  has(await page.textContent(".bd-arm"), "on your Mind, for your Confidence", "armour moved to her Mind");
  await b('[data-b="arm"][data-i="0"][data-v="Body"]');
  await page.fill("#b-e1", "a knife");
  await next("What you carry");
  same(await page.getAttribute('.bd-seg[data-v="u"]', "aria-current"), "true", "Next going on to her utility items");
  await b('[data-b="fillany"][data-k="u"][data-v="Purse of gold"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Smoke bomb"]');
  await page.fill("#b-u2", "a perfect set of picks");
  await next("What you carry");
  await page.fill("#b-k", "the first coin she ever stole");
  await next("What you carry");
  // One attuned thing at the start: her grappling line, its own way to Aura,
  // and a passive awakening that holds it.
  same(await page.$$eval('[data-b="addatt"], #b-a1-name', (els) => els.length), 0, "nothing offering a second attuned thing at the start");
  await page.fill("#b-a0-name", "A grappling line");
  await page.fill("#b-a0-aura", "1 the first time each scene she gets somewhere nobody else could follow");
  await page.fill("#b-a0-w0-name", "Anywhere I can throw a hook");
  await b('[data-b="awkkind"][data-i="0"][data-j="0"][data-v="passive"]');
  await page.fill("#b-a0-w0-text", "+1 on one die of every roll she makes with it, for each Aura in it");
  await shot(page, "5-builder-attuned");
  await next("Threads");
  // Threads from the crew questions: an answer becomes a bond thread or a
  // hostile one in a tap.
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
  for (const n of ["Aura 5", "Stride 3"]) has(check, n, "the built Vesk's numbers");
  await shot(page, "5-builder-check");
  await b('[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same(await specTiles(), wantTiles, "the built Vesk's specialties against her sheet in the chapter");
  same(await page.$$eval(".cc-roots .tile .tile-steps", (els) => els.map((e) => e.textContent)), ["5 steps", "3 steps", "nothing yet"], "the built Vesk's Roots");
  same(await page.$$eval(".cc-stat.t-stamina .zd-plate", (els) => els.length), 1, "her leathers' box by her Stamina");
  const saved = await page.evaluate(() => [JSON.parse(localStorage.getItem("zi-characters")).characters.at(-1), JSON.parse(localStorage.getItem("zi-drafts") || "{}")]);
  same([saved[0].crew, saved[0].name, Boolean(saved[0].build), "new" in saved[1]], ["own", "Vesk", true, false], "the built Vesk saved, and the draft cleared");

  // Her Body and her Locks against a lock, then a reload and no signal.
  await page.click('.cc-spectiles .tile[data-s]:has(.tile-name:text-is("Locks"))');
  has(await page.textContent("#cc-dialog .cc-dice"), "9 steps", "the built Vesk's Body and Locks");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([8, 2, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  has(await page.textContent("#cc-dialog .cc-res"), "Beat it", "her 8 against the lock's 5");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await page.reload();
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same(await specTiles(), wantTiles, "the built Vesk after a reload");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => note("the service worker never took over the page"));
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".cc-spectiles .tile[data-s]", { timeout: 10000 }).catch(() => note("the built Vesk didn't open offline"));
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('.cc-changebar a[data-act="bopen"][data-key]');
  has(await step(), "Change anything on her sheet", "changing her opens with everything on one page, offline");
  await context.setOffline(false);

  // Change her: a Boon instead of two permissions on her first Title, a
  // fourth permission there filling its six slots, and a Masterwork shield.
  await unfold(page, "bd-boon-0");
  await b('[data-b="boon"][data-t="0"][data-v="Toughness"]');
  await page.fill("#b-t0-b0-name", "Iron Lungs");
  await b('[data-b="addperm"][data-t="0"]');
  await perm(0, 3, "slip a grip", "Body", "Stealth");
  has(await page.textContent(".bd-title:has(#b-t0-text)"), "That’s all six slots", "a Boon and four permissions filling her first Title");
  same(await page.$$eval('[data-b="addperm"][data-t="0"]', (els) => els.length), 0, "no seventh slot to add");
  await b('[data-b="fillany"][data-k="e"][data-v="shield"]');
  if ((await pressedOn('[data-b="arm"][data-i="2"][data-v="Body"]')) !== "true") await b('[data-b="arm"][data-i="2"][data-v="Body"]');
  await b('[data-b="quality"][data-i="2"][data-v="3"]');
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same(await page.$$eval(".cc-stat.t-stamina .zd-plate", (els) => els.length), 4, "her leathers' box and her Masterwork shield's three by her Stamina");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await openFold(page, "titles");
  has(await page.textContent(".cc-boons"), "Iron Lungs", "her Boon on her first Title");
  has(await page.textContent(".cc-boons"), "The first hit you take each scene doesn’t drop a track", "what her Boon does, from the book");
  same(await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.filter((c) => c.build).length), 1, "changing her doesn't make a second Vesk");
  // Iron Lungs takes the first hit this scene, and her Stamina stays put.
  await page.click('.cc-tabs a[data-t="play"]');
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add-at"][data-v="Body"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([2, 7]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="tough"]');
  has(await page.textContent("#cc-dialog .cc-paid"), "Iron Lungs took it, and your Stamina stayed put", "her Toughness Boon taking the hit");
  same(await page.$$eval('#cc-dialog button[data-what="tough"]', (els) => els.length), 0, "Iron Lungs used for the scene");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  same(await page.textContent(".cc-stat.t-stamina .v"), "d12", "her Stamina where it was");

  // A blank character saves too: the builder warns, and never blocks. Leaving
  // keeps the draft, and the list offers to carry on with it.
  await page.goto(`${BASE}/characters/?build`);
  await jump(6);
  has(await page.textContent(".bd-body .is-warn"), "You can save anyway", "the warnings on a blank build");
  await page.fill("#b-name", "Kaia");
  await page.click('.cc-back[data-b="leave"]');
  has(await page.textContent('a[data-act="bopen"]'), "Carry on with Kaia", "a half-built character waiting on the list");
  await page.click('a[data-act="bopen"]');
  await b('[data-b="save"]');
  await page.waitForSelector(".cc-roots .tile");
  same(await page.$$eval(".cc-roots .tile .tile-steps", (els) => els.map((e) => e.textContent)), ["nothing yet", "nothing yet", "nothing yet"], "a blank character's Roots");
  has(await page.textContent(".cc-head h1"), "Kaia", "the blank character's name");

  // Every step at 320 wide, dark then light, with axe.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('.cc-changebar a[data-act="bopen"][data-key]');
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
  }
  await shot(page, "5-builder-320-light");
  console.log("builder: Vesk built step by step on Roots and checked against her sheet");
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
    // The steps a tap away from the bar close with Escape, or a tap anywhere else.
    await page.click(".bd-jump > summary");
    await page.keyboard.press("Escape");
    same(await page.$eval(".bd-jump", (el) => [el.open, document.activeElement === el.querySelector("summary")]), [false, true], `Escape closing the steps, ${theme}`);
    await page.click(".bd-jump > summary");
    await page.click(".bd-lead");
    same(await page.$eval(".bd-jump", (el) => el.open), false, `a tap elsewhere closing the steps, ${theme}`);
    for (let s = 0; s < 7; s++) {
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
    // A Title going on gives its Root a d2 in the dock above the bar, and a
    // permission on the same Root grows it into a d4.
    await jump(1);
    await b('[data-b="root"][data-t="0"][data-v="Body"]');
    same(await page.getAttribute('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', "data-d"), "2", `Body a d2 with a Title on it, ${theme}`);
    await page.fill("#b-t0-p0", "hold the line");
    await b('[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]');
    const grown = await page.$eval('.bd-rail .tile-dice[data-for="root:Body"] .zd-die', (el) => [el.dataset.d, el.classList.contains("is-grown")]);
    same(grown, ["4", !still], `Body a d4 with a permission on it too, ${still ? "swapped straight away under reduce-motion" : "growing into it"}, ${theme}`);
    if (still) same(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length), 0, `nothing moving under reduce-motion, ${theme}`);
    await page.waitForTimeout(400);
    await shot(page, `5b-builder-titles-${theme}`);
    // axe again with things picked: a Root and a permission, the archetype
    // folded to the one picked, a Title idea, a Boon, and a crew question
    // made into a thread.
    await axe(`a Title with a Root and a permission, ${theme}`);
    await jump(0);
    await b('[data-b="arch"][data-t="0"][data-v="Warrior"]');
    await axe(`an archetype picked, ${theme}`);
    await jump(1);
    await unfold(page, "bd-ideas-0");
    await b('[data-b="idea"][data-t="0"][data-v="k-warrior"]');
    await unfold(page, "bd-boon-0");
    await b('[data-b="boon"][data-t="0"][data-v="Stride"]');
    await axe(`a Title idea and a Boon, ${theme}`);
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
  console.log("one hand: the builder full screen, the first choice high up, the steps in one line, Back and Next at the bottom, and the dice growing, in both themes");
}

// 5c. The other ways in, and characters becoming your own. Every crew member
// made into a build has the sheet the chapter gives them, and a thousand
// random characters pass every check. Then Bram from the crew and a random
// one saved and played, a way in asking before it bins a draft, Vesk changed
// from the crew keeping her play, and Tamsin from before Roots rebuilt.
if (part("5c")) {
  const strip = (c) => ({ roots: c.roots, specialties: c.specialties, titles: c.titles.map((t) => [t.name, t.root, t.specialties, t.permissions.map((p) => [p.text, p.root, p.specialty])]), archetypes: c.archetypes.map((a) => a.name), armour: c.armour.map((a) => [a.name, a.root, a.quality, a.boxes]), attuned: c.attuned.map((a) => [a.name, a.stage, a.catch, a.awakenings.map((w) => [w.name, w.kind])]), carry: c.carry, numbers: c.numbers, threads: c.threads.map((p) => [p.person, p.threads.map((t) => [t.text, t.kind])]) });
  for (const crew of book.crew) {
    const want = rootsSheet(crew, [], BUILD);
    const quick = fromCrew(crew, BUILD);
    // The name's left for the player, since they're making their own.
    same(checksOf(quick, BUILD).map((x) => x.text).filter((x) => !/needs a name/.test(x)), [], `${crew.name} made into a quick build, with nothing else to flag`);
    same(rootsSheet(sheetOf({ id: `5c-${crew.id}`, name: crew.name, build: quick }, BUILD), [], BUILD).roots, want.roots, `${crew.name}'s Roots as a quick build`);
    same(strip(rootsSheet(sheetOf({ id: `5c-${crew.id}-keep`, name: crew.name, build: fromCrew(crew, BUILD, { keep: true }) }, BUILD), [], BUILD)), strip(want), `${crew.name} made into a build that keeps everything`);
  }
  let failing = 0;
  for (let n = 0; n < 1000; n++) {
    let seed = n + 1;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const x = randomBuild(BUILD, book.crew, rand);
    const checks = checksOf(x, BUILD).map((c) => c.text);
    const kinds = new Set(x.threads.filter((t) => t.person.trim()).map((t) => t.kind));
    if (checks.length || x.attuned.filter((a) => a.name.trim()).length !== 1 || !kinds.has("bond") || !kinds.has("hostile")) {
      if (failing++ < 3) note(`random character ${n}: ${checks.join(" ") || "not one attuned thing, or not a bond and a hostile thread"}`);
    }
  }
  console.log(`ways in: six crew made into builds, and ${1000 - failing} of 1000 random characters passing every check`);

  const { context, page } = await phone();
  const b = (attrs) => page.click(`button[data-act="b"]${attrs}`);
  const specTiles = () => page.$$eval(".cc-spectiles .tile[data-s]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, el.querySelector(".tile-steps").textContent]));
  const tilesOf = (c) => c.specialties.map((sp) => {
    const root = rootFor(c, sp.name);
    return [sp.name, `${root} ${c.roots[root]} and ${sp.steps}`];
  });
  // Bram from the crew, saved as is, plays his sheet.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="bram"]');
  has(await page.textContent(".bd-head"), "From Bram", "the builder from Bram");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same(await specTiles(), tilesOf(rootsSheet(book.crew.find((c) => c.id === "bram"), [], BUILD)), "Bram from the crew, saved and played");
  // A random one saves and plays.
  await page.goto(`${BASE}/characters/`);
  await page.click('button[data-act="bway"][data-w="random"]');
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same(await page.$$eval(".cc-roots .tile", (els) => els.length), 3, "a random character's three Roots on the play screen");
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
  await play(page, "vesk");
  await page.click('button[data-p="aura"]');
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]:not([data-why])');
  await page.click('button[data-p="stamina"]');
  await page.click('#cc-panel button[data-act="hit"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('.cc-changebar a[data-act="bopen"][data-key]');
  has(await page.textContent(".bd-head"), "Change anything on her sheet", "changing Vesk from the crew");
  await unfold(page, "bd-boon-1");
  await b('[data-b="boon"][data-t="1"][data-v="Ties"]');
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  const mine = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.from === "vesk"));
  same([mine.crew, Boolean(mine.build), mine.state.aura, mine.state.tracks?.stamina], ["own", true, 4, 10], "Vesk your own, with her Aura spent and her Stamina hit kept");
  same(await page.$$eval(".cc-gold, .cc-gem, .cc-note.is-gold", (els) => els.length), 0, "no gold marks on Vesk once she's your own");
  same(await specTiles(), tilesOf(rootsSheet(book.crew.find((c) => c.id === "vesk"), [], BUILD)), "her Roots and specialties as they were");

  // Tamsin, built on the phone before Roots, rebuilt on them.
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("zi-characters"));
    list.characters.push({ id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a sword", on: ["Fight"] }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [{ person: "Dorrie", text: "She owes me.", kind: "hostile", whose: "" }], connect: [], aspiration: "Run the docks", name: "Tamsin", pronoun: "her" },
      state: { aura: 4, resolve: 2, conf: 8, wound: 2, scars: [], conditions: [], threads: {}, notes: "Owes Dorrie" } });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  });
  await page.goto(`${BASE}/characters/?c=own-old`);
  await page.click('a[data-act="bopen"][data-key="own-old"]');
  has(await page.textContent(".bd-head"), "Her sheet on Roots", "rebuilding Tamsin");
  same(await page.inputValue("#b-t0-text"), "The best blade on the docks", "her Title carried across");
  same(await page.inputValue("#b-t0-p0"), "fight with a sword", "her permission carried across");
  // Her Title and her permission start on the Root their words suggest, a
  // guess to check: here it's her Body, so a tap would take it back off.
  same(await page.getAttribute('button[data-b="root"][data-t="0"][data-v="Body"]', "aria-pressed"), "true", "her Title's Root guessed from its words");
  same(await page.getAttribute('button[data-b="proot"][data-t="0"][data-j="0"][data-v="Body"]', "aria-pressed"), "true", "her permission's Root guessed from its words");
  for (const [k, sp] of ["Swordplay", "Brawling", "The docks"].entries()) await page.fill(`#b-t0-s${k}`, sp);
  await page.fill("#b-t0-p0-spec", "Swordplay");
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".cc-spectiles .tile[data-s]");
  same((await specTiles())[0], ["Swordplay", "Body 2 and 2"], "Tamsin's Swordplay on Roots");
  const tam = await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === "own-old"));
  same([tam.build.v, tam.state.v, "before" in tam.state, tam.state.notes], [3, 2, false, "Owes Dorrie"], "Tamsin saved on Roots, her notes kept");
  await page.click('.cc-tabs a[data-t="sheet"]');
  has(await page.textContent("main"), "She owes me.", "her hostile thread with Dorrie kept");

  // A Gambler flips a die once a round for free, theirs or yours, and pays a
  // size of Confidence for Double or nothing, flipping every die of theirs.
  const gil = fromCrew(book.crew.find((c) => c.id === "bram"), BUILD);
  gil.archs = ["Gambler", "Leader"];
  gil.name = "Gil";
  await page.evaluate((build) => {
    const list = JSON.parse(localStorage.getItem("zi-characters"));
    list.characters.push({ id: "own-gil", crew: "own", name: "Gil", hash: "own", build, state: {} });
    localStorage.setItem("zi-characters", JSON.stringify(list));
  }, gil);
  await page.goto(`${BASE}/characters/?c=own-gil`);
  await page.click('.cc-spectiles .tile[data-s]:has(.tile-name:text-is("Shieldwork"))');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="10"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 3, 7]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  await page.click('#cc-dialog button[data-act="flip"]');
  await page.click('#cc-dialog .cc-them button[data-act="pick"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped their d10, so it’s a 4 now", "their 7 on a d10 flipped to a 4");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((e) => e.textContent)), ["Beat it", "Under"], "his 9 beating their flipped 4, and his 3 still under");
  same(await page.$$eval('#cc-dialog button[data-act="flip"]', (els) => els.length), 0, "the free flip used on this roll");
  await unfold(page, "abil");
  await page.click('#cc-dialog .cc-how button[data-act="ability"]:has-text("Double or nothing")');
  await page.click('#cc-dialog button[data-act="pay-way"]');
  has(await page.textContent("#cc-dialog .cc-log"), "Flipped every die of yours", "Double or nothing flipping every die");
  same(await page.$$eval("#cc-dialog .res-note", (els) => els.map((e) => e.textContent).filter((x) => x === "Flipped").length), 2, "both dice marked flipped, so neither pays");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  console.log("ways in: Bram and a random one played, a draft binned on a second tap, Vesk your own with her play kept, Tamsin rebuilt on Roots, and a Gambler's flips");
  await context.close();
}

// 6. Print: Vesk part way through a scene, on the new sheet's fields, read
// back field by field, then Bram's armour and Dorrie's Mind.
if (part("6")) {
  const { context, page } = await phone();
  const t = tableOf(page);
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
  // A Blaze at her Stamina and its Scar, Burning on her, 1 Aura spent and 1
  // pumped into her grappling line, a strained thread and her smoke bomb used.
  await t.panel("stamina");
  await page.click('#cc-panel button[data-act="track-set"][data-t="stamina"][data-v="2"]');
  await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
  await page.fill('form[data-form="scar"] input', "a burn across the back");
  await page.click('form[data-form="scar"] button[type="submit"]');
  await t.panel("stamina", false);
  await t.panel("cond");
  await page.selectOption('form[data-form="cond"] select[name="pick"]', "Burning");
  await page.selectOption('form[data-form="cond"] select[name="die"]', "6");
  await page.click('form[data-form="cond"] button[type="submit"]');
  await t.panel("cond", false);
  await t.panel("aura");
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await t.panel("aura", false);
  await page.click('main button[data-act="pump"]');
  await page.click('.cc-tabs a[data-t="sheet"]');
  await inFold(page, 'button[data-act="strain"][data-k="Dorrie|We have pulled a dozen jobs. I trust her with my life."]');
  await inFold(page, 'button[data-act="cross"][data-k="utility|a smoke bomb"]');
  let f = await print();
  same([f.pages, f.file], [2, "vesk-zidara-sheet.pdf"], "Vesk's printed sheet");
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "3"], ["aura_max", "5"], ["actions", "2"], ["stride", "3"],
    ["stamina", "d4"], ["confidence", "d12"], ["resolve", "d12"], ["stamina_scar_2", true], ["stamina_scar_4", false], ["scar_1", "a burn across the back (Stamina)"],
    ["stamina_armour_1", "Common worn leathers"], ["stamina_armour_1_box_1", false],
    ["root_body", "5"], ["root_mind", "3"], ["root_soul", "0"], ["spec_1_name", "Locks"], ["spec_1_steps", "4"], ["spec_5_name", "Black market"], ["spec_5_steps", "2"], ["spec_6_name", ""],
    ["aspiration", "Own the score of a lifetime"], ["aspiration_die", "d2"],
    ["equipment_1", "Common worn leathers"], ["equipment_2", "a knife"], ["utility_2", "a smoke bomb (used)"], ["keepsake", "the first coin she ever stole"],
    ["title_1", "The best cat burglar in the city"], ["title_1_root", "Body"], ["title_1_specialties", "Stealth, Climbing, Locks"], ["title_1_permission_1", "move unseen (Body, Stealth)"], ["title_2_permission_2", "fight dirty with a knife (Body, Knives)"],
    ["archetype_1", "Shadow, twice"], ["archetype_1_track", "stamina"], ["archetype_2", ""],
    ["attune_1_thing", "A grappling line"], ["attune_1_stage", "awakened"], ["attune_1_awakening_1", "Anywhere I can throw a hook: +1 on one die of every roll she makes with it, for each Aura in it"], ["attune_1_awakening_1_kind", "passive"], ["attune_1_awakening_1_aura_1", true], ["attune_1_awakening_1_aura_2", false],
    ["bond_1", "Dorrie"], ["bond_1_thread_1", "We have pulled a dozen jobs. I trust her with my life."], ["bond_1_thread_1_kind", "bond"], ["bond_1_thread_1_strained", true], ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"]], "Vesk");
  same([f.get("condition_1"), f.get("condition_1_die")], ["Burning", "d6"], "Vesk's condition");
  has(f.get("archetype_1_ability_1"), "(1 Stamina)", "her Shadow's abilities, paid off Stamina");
  has(f.get("notes"), "Trouble that follows her: wanted in three districts, owes the Guild.", "her trouble in Notes");
  // Bram's plate with a box ticked, and Dorrie's court clothes on her Mind.
  await play(page, "bram");
  await t.lands([[8, "Body"]], { dice: [2, 7] });
  await t.pay("box", 0, "equipment|plate armour");
  await t.done();
  f = await print();
  want(f, [["stamina_armour_1", "Fine plate armour"], ["stamina_armour_1_box_1", true], ["stamina_armour_1_box_2", false], ["archetype_1", "Guardian"], ["archetype_2", "Leader"], ["attune_1_thing", "His war hammer (Breaker)"], ["attune_1_catch", "Marked"]], "Bram");
  has(f.get("stamina_armour_2"), "shield", "Bram's shield on his Stamina");
  await play(page, "dorrie");
  f = await print();
  has(f.get("confidence_armour_1"), "court clothes, when they fit the scene", "Dorrie's court clothes on her Confidence");
  same(f.get("stamina_armour_1"), "", "nothing on Dorrie's Body");
  console.log("print: Vesk mid-scene, Bram's plate and Dorrie's court clothes, read back field by field");
  await context.close();
}

// 7. Dice, feel and learning. First the learning round (learn.js), on the
// crew's sheets: the brute's club at Isolde's Body, answered with Wren's Body
// and Archery and Bram's Shieldwork.
const moving = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.(".companion")).length);
const card = (page) => page.textContent(".ln-card");
// One round from the top: Wren and Bram in, then roll with these dice (the two
// d12s, then the club's d8), or tap them in when real is set.
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
  const isolde = rootsSheet(book.crew.find((c) => c.id === "isolde"), [], BUILD);
  const wren = rootsSheet(book.crew.find((c) => c.id === "wren"), [], BUILD);
  const bram = rootsSheet(book.crew.find((c) => c.id === "bram"), [], BUILD);
  const steps = (c, spec) => c.specialties.find((x) => x.name === spec).steps;
  // Wren's Body, Archery and her longbow, and Bram's Shieldwork and his hammer.
  const wrenSteps = wren.roots.Body + steps(wren, "Archery") + 1;
  const bramSteps = steps(bram, "Shieldwork") + 1;
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="learn"][data-do="open"]');
  await page.waitForSelector("#ln-h");
  same(await page.evaluate(() => document.activeElement?.id), "ln-h", "focus at the start of the round");
  has(await card(page), "The brute swings his club at Isolde’s Body. That’s a d8", "the club's telegraph, at her Body");
  has(await card(page), "Isolde rolls her Stamina against it", "her Stamina when it lands");
  has(await card(page), `a d${isolde.numbers.stamina.die} against a d8 stops it 17 times in 24`, "her Stamina against the club, ties hers");
  has(await card(page), "Bram’s a Guardian, so he could intercept it for free", "Bram's free intercept");
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), true, "rolling before Wren and Bram are in");
  same(await page.$$eval('button[data-do="pick"]', (els) => els.map((e) => e.dataset.who)), ["wren"], "Bram waiting for Wren");
  await page.click('button[data-do="pick"][data-who="wren"]');
  has(await card(page), `Body ${wren.roots.Body}, Archery ${steps(wren, "Archery")}, her longbow 1 · ${wrenSteps} steps`, "Wren's Body, Archery and longbow, off her sheet");
  await page.click('button[data-do="pick"][data-who="bram"]');
  has(await card(page), `Shieldwork ${steps(bram, "Shieldwork")}, his war hammer 1 · ${bramSteps} steps`, "Bram's Shieldwork and hammer, off his sheet");
  has(await card(page), `${wrenSteps} steps and ${bramSteps} steps is ${wrenSteps + bramSteps} steps`, "the combo's steps");
  has(await card(page), "so that’s two d12s", "the combo's dice");
  await page.click('button[data-do="back"]');
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), false, "Wren and Bram still in after going back");
  await page.click('button[data-do="next"]');
  await page.evaluate(() => window.ziCompanion.setDice([9, 4, 6]));
  await page.click('button[data-do="roll"]');
  same(await page.$$eval("[data-spin]", (els) => els.length), 0, "dice tumbling with reduce-motion on");
  has(await card(page), "Your 9 beats the brute’s 6, so the club never comes down", "a beaten club");
  has(await card(page), "One die won, so Wren gets 1 Aura back", "Aura for the die that won");
  has(await card(page), "she’s on 6", "Wren past her 5 while she's acting");
  same(await page.textContent(".ln-hex b"), "6", "Wren's Aura on 6");
  same(await page.evaluate(() => document.activeElement?.id), "ln-out", "focus on what the dice did");
  same(await moving(page), 0, "things moving on the round with reduce-motion on");
  await page.click('button[data-do="next"]');
  has(await card(page), "you stopped it, so nothing lands and the round’s over", "the end of a round that was stopped");
  await page.click('button[data-do="again"]');
  has(await page.textContent("#ln-h"), "The GM telegraphs", "playing it again");
  await round(page, [6, 2, 6]);
  has(await card(page), "Your 6 ties the brute’s 6. A tie’s a loss, unless you pay 1 Aura", "a tie on the club");
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  has(await card(page), "a tie that’s bought pays nothing back", "a bought tie paying nothing back");
  same(await page.textContent(".ln-hex b"), "4", "Wren's Aura after paying for the tie");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 7], true);
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
    for (const [k, v] of [["0", 2], ["1", 1], ["opp", 7]]) await page.click(`button[data-do="pad"][data-k="${k}"][data-v="${v}"]`);
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
  // Her Locks against a d6, her d12 on its top face, with 1 Aura spent so
  // there's room for it to come back.
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('#cc-panel button[data-act="aura"][data-d="-1"]');
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('.cc-spectiles .tile[data-s="0"]');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
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
  await page.click('.cc-spectiles .tile[data-s="0"]');
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
// first specialty high up, each drawn as the dice it rolls, her d12 front and
// centre with its top face lit, and the Sheet tab under two screens with its
// folds shut, with axe on all three in both themes. A hit with reduce-motion
// on swaps the track's shape, and nothing moves.
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
    const top = await page.$eval(".cc-spectiles .tile", (el) => Math.round(el.getBoundingClientRect().top + scrollY));
    if (top > 420) note(`the first specialty starts ${top}px down at 390 by 844, ${theme}`);
    same(await page.$$eval(".cc-spectiles .tile .tile-dice .zd-die", (els) => els.map((e) => e.dataset.d)), ["12", "6", "12", "2", "12", "2", "12", "2", "10"], `Vesk's specialties drawn as the dice they roll, ${theme}`);
    same(await page.$$eval(".cc-track .is-trk .zd-die", (els) => els.map((e) => e.dataset.d)), ["12", "12", "12"], `her three tracks as d12s, ${theme}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (wide > 0) note(`the play screen scrolls sideways by ${wide}px, ${theme}`);
    const small = await page.$$eval(".cc-spectiles .tile, .cc-roots .tile, .cc-stat, .cc-tabs a", (els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
    if (small) note(`${small} tap targets under 44px on the play screen, ${theme}`);
    const broken = await page.$$eval(".tile-name", (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    if (broken.length) note(`names that don't fit their tiles: ${broken.join(", ")}, ${theme}`);
    await axe(`the play screen, ${theme}`);
    await page.click('.cc-spectiles .tile[data-s="0"]');
    await page.click('#cc-dialog button[data-act="vs"][data-v="6"]');
    await page.evaluate(() => window.ziCompanion.setDice([12, 2, 3]));
    await page.click('#cc-dialog button[data-act="go"]');
    await page.waitForSelector("#cc-dialog .res .res-out");
    same(await page.$eval("#cc-dialog .cc-stage .res .zd-die", (el) => [el.dataset.d, el.textContent, el.classList.contains("is-top")]), ["12", "12", true], `her 12 on the d12, front and centre with its top face lit, ${theme}`);
    await axe(`a roll, ${theme}`);
    await page.click('#cc-dialog button.primary[data-act="close"]');
    await page.click('.tile[data-act="defence"]');
    await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
    await axe(`When it lands, ${theme}`);
    await page.click('#cc-dialog .dlg-head button[data-act="close"]');
    await page.click('.cc-tabs a[data-t="sheet"]');
    const tall = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
    if (tall > 2) note(`the Sheet tab runs ${tall.toFixed(1)} screens with its folds shut, ${theme}`);
    same(await page.$$eval("details.cc-fold[open]", (els) => els.length), 0, `the Sheet tab's folds shut to start, ${theme}`);
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
  console.log("one hand: the crest at the top, the specialties high up as dice, the roll as a moment and the Sheet tab at a glance, in both themes");
}

// 7c. The dice roller (roller.js): any dice of yours against any of theirs,
// with no telegraph or threat, off the play screen and the Characters list.
if (part("7c")) {
  const dlg = "#cc-dialog";
  const line = (page, sel) => page.$eval(`${dlg} ${sel}`, (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
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
  {
    const { context, page } = await phone();
    await play(page, "vesk", "Vesk");
    const aura = await page.textContent('.cc-stat[data-p="aura"] .v');
    await page.click(".tile-free");
    await page.waitForSelector(`${dlg} .dz`);
    same(await page.$eval(`${dlg} button[data-dz="go"]`, (el) => el.disabled), true, "Roll waits for some dice");
    has(await line(page, ".dz > .cc-lead"), "your sheet stays as it is", "off a character, it says the sheet's left alone");
    // Bram Defends, the way When It Lands has it: 6, 3 and 1 on his d6, d6
    // and d2, against three d8s on 7, 5 and 2.
    await add(page, "you", [6, 6, 2]);
    await add(page, "them", [8, 8, 8]);
    same([await tray(page, "you"), await tray(page, "them")], [[6, 6, 2], [8, 8, 8]], "each side's dice, in the order they went on");
    has(await line(page, ".dlg-head"), "2d6 + d2 against 3d8", "the head says what's on");
    same(await page.$(`${dlg} button[data-dz="each"]`), null, "one target or several only asked of one die against several");
    same(await page.getAttribute(`${dlg} button[data-dz="def"][data-v="you"]`, "aria-pressed"), "true", "they're coming at you to start with");
    await go(page, [6, 3, 1, 7, 5, 2]);
    same(await line(page, ".dz-verdict"), "2 stopped, and one gets through.", "Bram's 6 on the 5 and his 3 on the 2");
    same(await outs(page), ["Gets through", "Stopped", "Stopped"], "only the 7 gets through");
    has(await line(page, ".cc-topnote"), "Top face on your d6, so 1 Aura back", "the d6's top face");
    await page.click(`${dlg} button[data-dz="swap"][data-j="0"]`);
    await page.click(`${dlg} button[data-dz="swap"][data-j="1"]`);
    same([await outs(page), await line(page, ".dz-verdict")], [["Gets through", "Gets through", "Stopped"], "1 stopped, and 2 get through."], "a swap puts the 6 on the 7");
    await page.click(`${dlg} .dz-flip`);
    same([await line(page, ".dz-verdict"), await outs(page, ".cc-stage .res-out")], ["None of them beat it.", ["Under", "Under", "Under"]], "the same dice read as Bram going at them, with their 7 standing");
    await page.click(`${dlg} button[data-act="close"]`);
    same([await page.textContent('.cc-stat[data-p="aura"] .v'), await page.$(".cc-last")], [aura, null], "Vesk's Aura and last roll left as they were");
    // Kept on the phone, with the way it was last read.
    await page.reload();
    await page.click(".tile-free");
    same([await tray(page, "you"), await tray(page, "them"), await page.getAttribute(`${dlg} button[data-dz="def"][data-v="them"]`, "aria-pressed")], [[6, 6, 2], [8, 8, 8], "true"], "the set-up kept through a reload");
    // Nothing of theirs: the numbers, added up for a Move.
    await page.click(`${dlg} button[data-dz="clear"][data-side="them"]`);
    same(await page.$(`${dlg} .dz-who`), null, "with nothing of theirs, nobody's going at anybody");
    await go(page, [6, 3, 1]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-note")], ["Added up, 10.", "That’s only if it’s a Move, the one roll where dice add."], "dice on one side added up");
    // One die tied: it's theirs, unless Vesk pays for it.
    await page.click(`${dlg} button[data-dz="back"]`);
    await page.click(`${dlg} button[data-dz="clear"][data-side="you"]`);
    await add(page, "you", [8]);
    await add(page, "them", [6]);
    await go(page, [4, 4]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-note"), await outs(page, ".cc-stage .res-out")], ["", "It’s theirs, unless you pay 1 Aura.", ["Tie"]], "one die tied, said once under it");
    // Ash's burst: her one die against five men, each on his own, then as one thing.
    await page.click(`${dlg} button[data-dz="back"]`);
    await add(page, "them", [6, 6, 6, 6]);
    await page.click(`${dlg} button[data-dz="each"][data-v="1"]`);
    await go(page, [5, 2, 4, 6, 1, 5]);
    same([await line(page, ".dz-verdict"), await line(page, ".dz-note"), await outs(page)], ["Your 5 beats 3 of the 5.", "One’s a tie, and it’s theirs unless you pay 1 Aura.", ["Beat it", "Beat it", "Under", "Beat it", "Tie"]], "Ash's 5 against five men on their own");
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
    same([await outs(page, ".cc-stage .res-out"), await line(page, ".cc-topnote")], [["Beat it"], "Top face on your d8, so 1 Aura back."], "an 8 on a real d8 beats their 7");
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
    same(await line(page, ".dz > .cc-lead"), "Any dice you like, yours and theirs, all rolled together.", "off the list it's just dice");
    await go(page, [2, 9]);
    same(await outs(page, ".cc-stage .res-out"), ["Under"], "a roll with no signal");
    await context.setOffline(false);
    await context.close();
  }
  // At 320 wide in both themes: nothing sideways, 44px buttons, and axe.
  for (const theme of ["dark", "light"]) {
    const { context, page } = await phone({ viewport: { width: 320, height: 640 } });
    if (theme === "light") await page.addInitScript(() => localStorage.setItem("zi-theme", "light"));
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
    await fits("the set-up");
    await axe(`the roller's set-up, ${theme}`);
    await go(page, [6, 3, 1, 7, 5, 2, 9, 6]);
    same(await line(page, ".dz-verdict"), "2 stopped, and 3 get through.", `five against three, ${theme}`);
    await fits("a result");
    await axe(`the roller's result, ${theme}`);
    await shot(page, `roller-${theme}`);
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
    await context.close();
  }
  console.log("dice roller: Bram's defence with a swap and read the other way, the sheet left alone, the set-up kept, one side added up, a tie, an area each on their own and as one, real dice, offline off the list, 320 wide in both themes, and the tumble");
}

// 8. Downtime and rule changes. Vesk's week: every track up a size first,
// then 6 sizes of Recover and a new permission, undone and done again, and
// a second week that chases her Aspiration with fixed dice and gives her
// grappling line a new awakening. It all survives a reload. Then a made-up
// rule change against her saved sheet: a reworded permission, her Stride and
// a permission moved to another specialty get gold marks with old and new,
// typo fixes stay quiet, what she grew isn't marked, and Got it clears them.
if (part("8")) {
  const { context, page } = await phone();
  const t = tableOf(page);
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  const spec = (name) => page.$eval(`.cc-spectiles .tile[data-s]:has(.tile-name:text-is("${name}"))`, (el) => `${el.querySelector(".tile-steps").textContent} · ${el.querySelector(".tile-die").textContent}`);
  await play(page, "vesk");
  await t.panel("stamina");
  for (let i = 0; i < 4; i++) await page.click('#cc-panel button[data-act="hit"][data-t="stamina"]');
  await t.panel("stamina", false);
  await t.panel("confidence");
  await page.click('#cc-panel button[data-act="hit"][data-t="confidence"]');
  await t.panel("confidence", false);
  same(await t.tracks(), ["d4", "d10", "d12"], "Vesk before her week");
  await page.click('button[data-act="downtime"]');
  has(await t.body(), "Stamina d4 to d6 and Confidence d10 to d12", "every track up a size, free");
  await dt('[data-do="pick"][data-s="0"][data-v="heal"]');
  for (let i = 0; i < 3; i++) await dt('[data-do="heal"][data-s="0"][data-f="stamina"][data-v="1"]');
  same(await page.$eval('#cc-dialog button[data-act="dt"][data-do="heal"][data-s="0"][data-f="stamina"][data-v="1"]', (el) => el.disabled), true, "her Stamina can't go past d12");
  await dt('[data-do="pick"][data-s="1"][data-v="perm"]');
  await dt('[data-do="set"][data-s="1"][data-f="t"][data-v="0"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "slip through any crowd");
  await dt('[data-do="set"][data-s="1"][data-f="root"][data-v="Body"]');
  await dt('[data-do="set"][data-s="1"][data-f="spec"][data-v="Stealth"]');
  await shot(page, "8-downtime");
  await t.finish();
  same(await t.tracks(), ["d12", "d12", "d12"], "her Stamina healed and every track up");
  same(await spec("Stealth"), "Body 6 and 3 · d12 + d6", "her new permission on her Body and her Stealth");
  same(await spec("Locks"), "Body 6 and 4 · d12 + d8", "her Body up 1 on every roll");
  await page.click('button[data-act="undo"]');
  same([await t.tracks(), await spec("Stealth")], [["d4", "d10", "d12"], "Body 5 and 2 · d12 + d2"], "Undo takes the week back");
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="heal"]');
  for (let i = 0; i < 3; i++) await dt('[data-do="heal"][data-s="0"][data-f="stamina"][data-v="1"]');
  await dt('[data-do="pick"][data-s="1"][data-v="perm"]');
  await dt('[data-do="set"][data-s="1"][data-f="t"][data-v="0"]');
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "slip through any crowd");
  await dt('[data-do="set"][data-s="1"][data-f="root"][data-v="Body"]');
  await dt('[data-do="set"][data-s="1"][data-f="spec"][data-v="Stealth"]');
  await t.finish();
  same(await spec("Stealth"), "Body 6 and 3 · d12 + d6", "her week again");
  // A second week: her Aspiration with her Soul and her Black market, 2
  // steps, a d4, against its d2, and a new awakening on her grappling line,
  // a Catch with it since it's Awakened.
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  await dt('[data-do="set"][data-s="0"][data-f="root"][data-v="Mind"]');
  await dt('[data-do="set"][data-s="0"][data-f="spec"][data-v="Black market"]');
  has(await t.body(), "5 steps, d10, against its d2", "her Aspiration roll");
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
  await page.waitForSelector(".tile[data-s]");
  has(await page.textContent("main"), "Haul someone up after me", "her new awakening on the play screen after a reload");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
  has(await page.textContent("main"), "slip through any crowd", "her new permission on the Sheet tab");
  const saved = await page.evaluate(() => localStorage.getItem("zi-characters"));
  const id = JSON.parse(saved).characters[0].id;
  same(JSON.parse(saved).characters[0].state.asp, 4, "her Aspiration's die saved");

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
      const perm = (text) => v.titles.flatMap((x) => x.permissions).find((p) => p.text === text);
      perm("run the rooftops").text = "run and leap the rooftops";
      perm("know how a lock’s built").text = "know how a locks built";
      perm("pick a mechanical lock").specialty = "Climbing";
      v.titles[1].name = "Raised by the guild";
      v.numbers.stride = 4;
      v.hash = "madeup01";
      return `${open}${JSON.stringify(data).replace(/</g, "\\u003c")}${close}`;
    });
    return route.fulfill({ response: res, body: out });
  });
  await p2.goto(`${BASE}/characters/`);
  await p2.evaluate((json) => localStorage.setItem("zi-characters", json), saved);
  await p2.goto(`${BASE}/characters/?c=${encodeURIComponent(id)}`);
  await p2.waitForSelector(".tile[data-s]");
  const seen = await p2.evaluate((cid) => JSON.parse(localStorage.getItem("zi-characters")).characters.find((c) => c.id === cid).state.seen, id);
  same([seen["title:1"], seen["perm:1:0"], seen["perm:0:1"]], ["Raised by the guild (Mind; Locks, Knives, Black market)", "know how a locks built (Mind, Locks)", "run the rooftops (Body, Climbing)"], "the typo fixes taken in quietly, and the real change kept for its mark");
  has(await p2.textContent(".cc-note.is-gold"), "lines on Vesk’s sheet have changed", "the note for a rule change");
  const marked = await p2.$$eval(".cc-spectiles .tile.is-changed .tile-name", (els) => els.map((e) => e.textContent));
  same(marked, ["Locks", "Climbing"], "gold corners on Locks and Climbing");
  await p2.click('.cc-gold[data-k="num:stride"]');
  has(await p2.textContent(".cc-head .cc-was"), "Was Stride 3", "Stride's old number");
  has(await p2.textContent(".cc-head .cc-was"), "Now Stride 4", "Stride's new number");
  await p2.click('.cc-tabs a[data-t="sheet"]');
  await p2.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
  const golds = await p2.$$eval(".cc-gold", (els) => els.map((el) => el.dataset.k));
  for (const k of ["perm:0:1", "perm:0:2", "spec:Locks", "spec:Climbing"]) same(golds.includes(k), true, `a gold mark on ${k}`);
  for (const k of ["perm:1:0", "title:1"]) same(golds.includes(k), false, `no gold mark on ${k}, a typo fix`);
  same(golds.some((k) => /:g\d/.test(k)), false, "nothing she grew in downtime marked");
  await p2.click('.cc-gold[data-k="perm:0:1"]');
  has(await p2.textContent('li:has(> .cc-gold[data-k="perm:0:1"]) .cc-was, li:has(.cc-gold[data-k="perm:0:1"]) .cc-was'), "Was run the rooftops (Body, Climbing)", "the permission as it was");
  await p2.click('.cc-note.is-gold button[data-act="seen"]');
  same(await p2.$$eval(".cc-gold", (els) => els.length), 0, "Got it clears the marks");
  await p2.reload();
  await p2.waitForSelector(".cc-page");
  same(await p2.$$eval(".cc-gold", (els) => els.length), 0, "and they stay cleared");
  console.log("downtime: Vesk's two weeks, an undo, a reload and a made-up rule change with its gold marks");
  await second.context.close();
  await context.close();
}

// 9. Every crew member grows on Roots: a downtime's worth of each kind of
// growth on top of their sheet adds up, a seventh permission never gets on,
// and an Aspiration past d12 gives a Title, an archetype or an attuned thing.
if (part("9")) {
  // Two permissions for a Boon in downtime: the Boon takes their slots, and
  // one that wouldn't fit takes nothing off.
  {
    const vesk = structuredClone(book.crew.find((c) => c.id === "vesk"));
    vesk.titles[0].permissions.push({ text: "slip a grip", root: "Body", specialty: "Stealth" }, { text: "hang off a ledge", root: "Body", specialty: "Climbing" });
    const swapped = rootsSheet(vesk, [{ k: "boon", t: 0, lever: "Aura", name: "Second Wind", drop: [0], g: 0 }], BUILD);
    same([swapped.titles[0].permissions.length, swapped.titles[0].boons.map((b) => b.name), swapped.numbers.aura], [4, ["Second Wind"], 7], "a permission off her five for a Boon, with Aura 2 more");
    const full = rootsSheet(vesk, [{ k: "perm", t: 0, text: "palm a key", root: "Body", spec: "Locks", g: 0 }, { k: "boon", t: 0, lever: "Aura", drop: [0], g: 1 }], BUILD);
    same([full.titles[0].permissions.length, full.titles[0].boons.length, full.numbers.aura], [6, 0, 5], "a Boon that won't fit beside six permissions takes none of them off");
  }
  for (const base of book.crew) {
    const c0 = rootsSheet(base, [], BUILD);
    const sp = c0.specialties[0].name;
    const root = c0.titles[0].root;
    const grown = [
      { k: "perm", t: 0, text: "a new permission", root, spec: sp },
      { k: "thread", person: "Someone new", text: "They owe me.", kind: "hostile" },
      { k: "title", text: "A Title from an Aspiration", root: "Soul", specs: ["Warding", sp, "Something new"], perm: { text: "its permission", root: "Soul", spec: "Something new" } },
      { k: "arch", arch: "Scholar" },
      { k: "awk", a: 0, name: "Another awakening", kind: "active", text: "1 Aura and it does something", catch: "Loud" },
    ];
    const c = rootsSheet(base, grown, BUILD);
    const roots = { ...c0.roots };
    roots[root] += 1;
    roots.Soul += 2;
    same(c.roots, roots, `${base.name}'s Roots with a permission and a new Title`);
    same(c.specialties.find((x) => x.name === sp).steps, c0.specialties[0].steps + 2, `${base.name}'s ${sp} with a permission and a Title`);
    same(c.specialties.find((x) => x.name === "Something new")?.steps, 2, `${base.name}'s new specialty, from the Title and its permission`);
    same([c.titles.length, c.archetypes.length, c.attuned[0].awakenings.length], [c0.titles.length + 1, c0.archetypes.length + 1, c0.attuned[0].awakenings.length + 1], `${base.name}'s Titles, archetypes and awakenings`);
    same(c.threads.find((p) => p.person === "Someone new")?.threads[0]?.kind, "hostile", `${base.name}'s new hostile thread`);
    // A seventh permission never gets on a Title.
    const full = Array.from({ length: 6 }, (_, i) => ({ k: "perm", t: 0, text: `permission ${i}`, root, spec: sp }));
    same(rootsSheet(base, full, BUILD).titles[0].permissions.length, 6, `${base.name}'s first Title stops at six permissions`);
  }
  // On the phone: Vesk's Aspiration past d12 gives her a new Title.
  const { context, page } = await phone();
  const t = tableOf(page);
  await play(page, "vesk");
  await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    all.characters[0].state.asp = 12;
    localStorage.setItem("zi-characters", JSON.stringify(all));
  });
  await page.reload();
  await page.waitForSelector(".tile[data-s]");
  const dt = (sel) => page.click(`#cc-dialog button[data-act="dt"]${sel}`);
  await page.click('button[data-act="downtime"]');
  await dt('[data-do="pick"][data-s="0"][data-v="asp"]');
  await dt('[data-do="set"][data-s="0"][data-f="root"][data-v="Body"]');
  await dt('[data-do="set"][data-s="0"][data-f="spec"][data-v="Locks"]');
  await page.evaluate(() => window.ziCompanion.setDice([11, 3, 9]));
  await dt('[data-do="asp-roll"][data-s="0"]');
  has(await t.body(), "It climbs past d12 and resolves.", "her Aspiration resolving");
  await dt('[data-do="set"][data-s="0"][data-f="take"][data-v="title"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="text"]', "Captain of the crew");
  await dt('[data-do="set"][data-s="0"][data-f="troot"][data-v="Soul"]');
  for (const [j, x] of ["Command", "Reading people", "Locks"].entries()) await page.fill(`#cc-dialog input[data-dt="0"][data-f="specs"][data-j="${j}"]`, x);
  await page.fill('#cc-dialog input[data-dt="0"][data-f="perm"]', "know who’s lying in my crew");
  await dt('[data-do="set"][data-s="0"][data-f="proot"][data-v="Mind"]');
  await page.fill('#cc-dialog input[data-dt="0"][data-f="pspec"]', "Reading people");
  await t.finish();
  same(await page.$$eval(".cc-roots .tile .tile-steps", (els) => els.map((e) => e.textContent)), ["5 steps", "4 steps", "1 step"], "her Roots with the new Title on her Soul and its permission on her Mind");
  has(await page.textContent(".cc-spectiles"), "Reading people", "her new specialty");
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
  has(await page.textContent("main"), "Captain of the crew", "her third Title");
  same(await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters[0].state.asp), 2, "her Aspiration back to d2");
  console.log(`growing: every crew member's growth adds up, and Vesk's Aspiration past d12 is a Title`);
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
    for (const m of c.example.matchAll(/\b(\d+) steps[,:] (an? d\d+(?: and an? d\d+)?|two d12s)/g)) {
      const said = m[2] === "two d12s" ? "2d12" : m[2].replace(/\ban? /g, "").replace(" and ", " + ");
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
  console.log(`reading: ${cards.length} cards checked against the chapters and the steps into dice (${dieChecks} rolls), the deck swiped, remembered and read offline, a chapter's contents and its sections a page at a time (swiped, keyed, Back and Forward), bookmarks, what's read and where you're up to, pop-ups, Carry on reading, and a place's tabs, tags and Roll a d20`);
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
