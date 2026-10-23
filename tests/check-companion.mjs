// Check the character companion the way a player uses it at the table.
//
//   npm run build && node tests/check-companion.mjs [screenshot-folder]
//
// 1. Steps into dice match the table in The Core, splits included.
// 2. Every crew member's set actions on the phone match their sheet in the
//    chapter, read straight off the Markdown here rather than from book.json.
// 3. Vesk at the table: Sneak is 4 steps, a d8. Tap off Silent Step and it's
//    3 steps, a d6. Bring in her grappling line and it's 4 again for 1 Aura.
//    Roll with fixed dice, check the Aura and the result, reload, then go
//    offline and reload, and read Aura's rule and a permission's with no
//    signal. Then a split roll with a top face and a tie, an undo, a defence
//    roll where each die stops one, her leathers broken off her Defend, and a
//    new scene. Then the play screen's stage 3: a threat's die, a tap-in with
//    an intent, Defend with a split and a swap, and an undo of a Hurt.
// 4. Wounds: the rest at the end of a scene (a win, then a tie rolled again
//    for 1 Resolve), Bram's Unyielding first Hurt, Bram Defending against
//    three goblins with his Guardian +2, a Blaze into a Scar with its Catch,
//    and characters saved with the old Hurt track and Armour opening clean.
// 5. Building your own: Vesk again, through the builder a step at a time. Her
//    set actions and numbers have to match her sheet in the chapter. Then a
//    roll, a reload, offline, a change in the builder, and every step at 320
//    wide in the light, with axe on each.
// 6. Print, and the other ways in. Every crew member made into a build has
//    the sheet the chapter gives them, and a thousand random characters pass
//    every one of the builder's warnings. Then Vesk's sheet printed with a
//    Hurt on it, and again offline, a character made from Vesk and printed, a
//    random one rolled five times, saved and printed, and a blank sheet. A way
//    in asks before it bins a draft, and one page passes axe at 320 wide.
// 7. Dice, feel and learning. The learning round played start to finish three
//    times: beaten, a tie won for 1 Aura with a top face, and real dice tapped
//    in that lose, so the club lands on Isolde as a Hurt. Then offline, and
//    axe at 320 wide in both themes. With reduce-motion the dice never tumble
//    and nothing on the page moves. With motion on, the dice tumble and land
//    on their numbers, the roll card turns over, the tabs slide and the pips
//    glow. Sound and buzz stay off until the switch turns them on, and then a
//    landing, a top face, a Hurt and the wound die reaching d12 each get one.
// 8. Downtime and rule changes. Vesk's week from Downtime, with a Hurt on
//    her that clears for free: one slot pays the fence, and the other gives
//    her grappling line its Catch, Loud, and haul someone up after me, on no
//    set action, so it's 1 Aura when it fits. Nothing offers to heal a Catch
//    or mend Armour. An undo takes it all back. A second week puts a new permission on her
//    Sneak (5 steps, a d10), chases her Aspiration with fixed dice, and swaps
//    a permission, and it all survives a reload and offline. Then a made-up
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
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
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

const SHOTS = process.argv[2] || null;
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

async function play(page, crewId, name) {
  await page.goto(`${BASE}/characters/`);
  await page.click(`button[data-act="play"][data-c="${crewId}"]`);
  if (name) await page.fill("#cc-name", name);
  await page.click('#cc-dialog button[type="submit"]');
  await page.waitForSelector(".tile[data-a]");
}

// 2. The crew's set actions, read off their sheets in the chapter.
{
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
{
  const { context, page } = await phone();
  await page.goto(`${BASE}/characters/`);
  await shot(page, "1-characters");
  await play(page, "vesk", "Vesk");
  await shot(page, "2-sheet");
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const aura = () => page.textContent('.cc-stat[data-p="aura"] .v');
  const tile = (name) => page.click(`.tile[data-a]:has(.tile-name:text-is("${name}"))`);
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);

  await tile("Sneak");
  has(await live(), "4 steps, d8", "Sneak to start with");
  await page.click('#cc-dialog .cc-line[data-act="off"]:has-text("Silent Step")');
  has(await live(), "3 steps, d6", "Sneak without Silent Step");
  await page.click('#cc-dialog summary:has-text("Bring something in")');
  await page.click('#cc-dialog .cc-line[data-act="in"]:has-text("grappling line")');
  has(await live(), "4 steps, d8", "Sneak with her grappling line brought in");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Aura", "the cost of bringing it in");
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="6"]');
  await shot(page, "3-building-a-roll");
  await page.evaluate(() => window.ziCompanion.setDice([6, 5]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  has(await page.textContent("#cc-dialog .cc-res"), "Beat it", "her 6 against the guard's 5");
  has(await page.textContent("#cc-dialog .cc-them"), "Their d65", "the guard's d6 rolled with hers, and its 5");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Aura after paying 1");
  await shot(page, "4-the-result");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await aura(), "4/5", "Aura on the strip after the roll");

  await page.reload();
  await page.waitForSelector(".tile[data-a]");
  same(await aura(), "4/5", "Aura after a reload");
  has(await page.textContent(".cc-last"), "6 on the d8, against 5. Beat it.", "the last roll after a reload");

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
  await page.click('button.cc-perm:has-text("move unseen")');
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
  await page.click('#cc-dialog button[data-act="win-tie"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Beat it", "Tie, won for 1 Aura"], "after winning the tie");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Aura after winning the tie");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Beat it", "Tie"], "after undoing the tie");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 5 Aura", "Aura after the undo");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  // Shaken on d2, going at a threat costs 1 Resolve.
  await page.click('.cc-stat[data-p="conf"]');
  await page.click('.cc-panel button[data-act="conf"][data-v="2"]');
  await tile("Fight");
  has(await page.textContent("#cc-dialog .cc-costs"), "1 Resolve", "going at a threat while shaken");
  await page.click('#cc-dialog .dlg-head button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await page.click('.cc-panel button[data-act="conf"][data-v="6"]');

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
  await shot(page, "5-when-it-lands");
  // The blow breaks her leathers instead, so they're off her Defend till they're mended.
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="break"][data-k="equipment|worn leathers"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Defend d2", "her Defend once her leathers break");
  has(await page.textContent("#cc-dialog .res-paid"), "Worn leathers broken till it’s mended", "the blow's cost counted on it");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await tileOf("Defend"), "1 d2", "her Defend tile with her leathers broken");

  await page.click('button[data-act="scene"]');
  same(await aura(), "5/5", "Aura after a new scene");
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
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  // Defend with a swap: two d6s, one meant to pin her. Her leathers are
  // mended, and Defending they count twice, so it's 3 steps, split into a d4
  // and a d2. Her 4 and 1 meet their 3 and 3. The phone puts the 4 on the
  // pin, and a swap moves it onto the other blow.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('button[data-act="cross"][data-k="equipment|worn leathers"]');
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
  await page.click('#cc-dialog button[data-act="d-swap"][data-j="1"]');
  await page.click('#cc-dialog button[data-act="d-swap"][data-j="0"]');
  same(await blows(), ["Gets through", "Stopped"], "after swapping her 4 onto the other blow");
  has(await page.textContent("#cc-dialog .cc-pay"), "Pinned d6", "the pin can land as Pinned d6");
  await shot(page, "6-defend-and-swap");

  // An undo of a Hurt: she takes the pin as a Hurt instead, then takes it back.
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="hurt"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Wound d4", "a Hurt from the pin puts her wound die up a size");
  has(await page.textContent("#cc-dialog .res-paid"), "Took a Hurt", "the Hurt counted on the blow");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Wound d2", "the Hurt undone");
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"]', (els) => els.length > 0), true, "the blow waiting to be paid again after the undo");
  same(await blows(), ["Gets through", "Stopped"], "the swap still stands after the undo");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await page.textContent('.cc-stat[data-p="wound"] .v'), "d2", "the wound die on the play screen after the undo");
  // An undo leaves what's been typed alone.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.fill("#cc-notes", "Owes Dorrie a favour");
  await page.click('.cc-tabs a[data-t="play"]');
  await page.click(".cc-track .cc-undo");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.inputValue("#cc-notes"), "Owes Dorrie a favour", "a note kept through an undo");
  await page.click('.cc-tabs a[data-t="play"]');
  await shot(page, "7-play-screen");
  await context.close();
}

// Wren goes at a Marked Warden: her Fight's d10 and the Mark d10 against its d8.
// Both come in under, and her Hunter's +3 on the Mark die makes the 6 a 9.
{
  const { context, page } = await phone();
  await play(page, "wren");
  await page.click('.tile[data-a]:has(.tile-name:text-is("Fight"))');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
  await page.click('#cc-dialog .cc-mark > summary');
  await page.click('#cc-dialog .cc-chipbtn[data-act="mark"][data-v="10"]');
  has(await page.textContent("#cc-dialog .cc-dice"), "5 steps, d10, and the Mark d10", "Wren's Fight with the Mark die");
  await page.evaluate(() => window.ziCompanion.setDice([5, 6, 7]));
  await page.click('#cc-dialog button[data-act="go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Under", "Under"], "Wren's d10 and the Mark d10 against a 7");
  await page.click('#cc-dialog button[data-act="plus"]:has-text("Hunter +3 on the Mark die")');
  same(await page.$$eval('#cc-dialog button[data-act="pick"]', (els) => els.length), 1, "only the Mark die takes the Hunter's +3");
  await page.click('#cc-dialog button[data-act="pick"]');
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Under", "Beat it"], "after the +3 on the Mark die");
  has(await page.textContent("#cc-dialog .dlg-body"), "You’ve got 4 Aura", "Wren's Aura after the +3");
  await context.close();
}

// 4. Wounds. Two Hurts make Vesk's wound die a d6, and at the end of the
// scene she rests: her d6 Confidence rolls 5 against its 4, so it's a d4.
// Then a tie, which goes to the wound, rolled again for 1 Resolve, and one
// undo takes the rest and the new scene back. Four more Hurts and she
// Blazes, and the wound becomes a Scar in her own words, with the wound die
// never below d4. Bram's first Hurt a scene doesn't move his wound die
// (Unyielding), and against three goblins his Defend counts twice: 7 steps,
// split into two d6s and a d2, and his Guardian +2 stops the last one.
// Dorrie Defends against fear, her d6 Confidence counting twice, and a hit
// while she's Exposed is two Hurts. Characters saved with the old Hurt track
// and Armour open clean.
{
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  const { context, page } = await phone();
  const wound = () => page.textContent('.cc-stat[data-p="wound"] .v');
  const live = () => page.textContent("#cc-dialog .cc-dice");
  const outs = () => page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent));
  const closed = () => page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const tileOf = (name) => page.$eval(`.tile[data-a]:has(.tile-name:text-is("${name}"))`, (el) => `${parseInt(el.querySelector(".tile-steps").textContent, 10)} ${el.querySelector(".tile-die").textContent}`);
  const hurt = async (n = 1) => {
    if (!(await page.isVisible('.cc-panel button[data-act="hurt"][data-d="1"]'))) await page.click('.cc-stat[data-p="wound"]');
    for (let i = 0; i < n; i++) await page.click('.cc-panel button[data-act="hurt"][data-d="1"]');
  };

  await play(page, "vesk", "Vesk");
  await hurt(2);
  same(await wound(), "d6", "Vesk's wound die after two Hurts");
  same(await page.$$eval(".t-wound .mini i.on", (els) => els.length), 2, "two lit on the wound die's row");
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
  await page.click('button[data-act="scene"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 3]));
  await page.click('#cc-dialog button[data-act="rest-go"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "a tie goes to the wound, so it stays a d6", "a rest that ties");
  await page.evaluate(() => window.ziCompanion.setDice([6]));
  await page.click('#cc-dialog button[data-act="rest-again"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Your 6 beats its 3", "the rest rolled again, against the same 3");
  await page.click('#cc-dialog button[data-act="rest-done"]');
  await closed();
  same([await wound(), await page.textContent('.cc-stat[data-p="resolve"] .v')], ["d4", "2/2"], "the wound die and Resolve after a rest rolled again for 1 Resolve");
  await page.click(".cc-track .cc-undo");
  same(await wound(), "d6", "one undo takes the rest and the new scene back");
  await page.click(".cc-track .cc-undo");

  // A Hurt at d12 Blazes, and the wound becomes a Scar.
  await hurt(4);
  same(await wound(), "d12", "Vesk on d12");
  await hurt();
  has(await page.textContent('form[data-form="scar"]'), "You Blaze", "a Hurt at d12 Blazes");
  await page.fill('form[data-form="scar"] input[name="scar"]', "a spear through the shoulder");
  await page.click('form[data-form="scar"] button[type="submit"]');
  same(await wound(), "d4", "her wound die after the Scar");
  same(await page.$$eval(".t-wound .mini i.x", (els) => els.length), 1, "the Scar on the wound die's row");
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
  has(await page.textContent("#cc-toast"), "doesn’t move your wound die (Unyielding)", "what Unyielding says");
  await hurt();
  same(await wound(), "d4", "Bram's second Hurt this scene");
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
  await page.click('#cc-dialog button[data-act="plus"]:has-text("Guardian +2")');
  await page.click('#cc-dialog button[data-act="d-pick"][data-i="0"]');
  same(await outs(), ["Stopped", "Stopped", "Stopped"], "his Guardian +2 making the 5 a 7");
  has(await page.textContent("#cc-dialog .dlg-body"), "Nothing gets through.", "nothing gets through Bram");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();

  // Fear: when Dorrie Defends, her Confidence counts twice by its steps, so
  // her d6 is 6 steps, split into two d6s against a d10 and a d8.
  await play(page, "dorrie", "Dorrie");
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-against"][data-v="confidence"]');
  has(await live(), "3 steps, d6", "Dorrie's Confidence letting it ride");
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
  has(await live(), "6 steps, d12", "Dorrie's Confidence counting twice");
  await page.click('#cc-dialog button[data-act="step"][data-n="count"][data-d="1"]');
  has(await live(), "6 steps, 2d6", "Dorrie's Confidence split into two d6s");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="10"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.evaluate(() => window.ziCompanion.setDice([5, 2, 4, 6]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await outs(), ["Stopped", "Gets through"], "her 5 and 2 against the fear's 4 and 6");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  // Exposed: she's vulnerable to every hit, so one that gets through is two Hurts.
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
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await closed();
  same(await wound(), "d6", "Dorrie's wound die after a hit while she's Exposed");

  // Saved before the wound die: an old Hurt track and Armour.
  const vesk = book.crew.find((c) => c.id === "vesk");
  const seen = said(vesk);
  delete seen["num:wound"];
  delete seen["act:Defend"];
  Object.assign(seen, { "num:armour": "Armour d4 (worn leathers)", "num:hurt": "3 Hurt bars" });
  const old = { v: 1, characters: [
    { id: "old-vesk", crew: "vesk", name: "Old Vesk", hash: vesk.hash, state: { aura: 3, resolve: 1, conf: 6, armour: 2, hurt: 4, catches: ["twisted ankle"], scars: 1, blaze: false, dead: false, conditions: [], threads: {}, used: {}, crossed: {}, picked: [], asp: 2, aspText: "", notes: "Owes the fence", last: null, seen } },
    { id: "own-old", crew: "own", name: "Tamsin", hash: "own", build: { v: 2, titles: [{ arch: "Warrior", idea: "", text: "The best blade on the docks", on: ["Fight"], perms: [{ text: "fight with a sword", on: ["Fight"] }] }], traits: [], actions: ["Fight", "Move", "Sneak", "Study", "Talk"], equipment: [{ text: "a chain shirt", on: [], armour: true }, { text: "a sword", on: ["Fight"], armour: false }], utility: [], keepsake: { text: "", on: [] }, bag: "", attuned: [], threads: [], connect: [], aspiration: "Win the duel", name: "Tamsin", pronoun: "her" }, state: { aura: 5, resolve: 1, conf: 6, armour: 4, hurt: 0, catches: [], scars: 0 } },
  ] };
  await page.evaluate((json) => localStorage.setItem("zi-characters", json), JSON.stringify(old));
  await page.goto(`${BASE}/characters/?c=old-vesk`);
  await page.waitForSelector(".tile[data-a]");
  same(await wound(), "d12", "four old Hurts on top of a Scar make her wound die a d12");
  same(await page.$$eval(".t-wound .mini i.x", (els) => els.length), 1, "her old Scar on the wound die's row");
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
  console.log("wounds: a rest won and one rolled again, a Blaze into a Scar, Unyielding, Bram's three goblins, Dorrie's fear and Exposed, and two old saves");
  await context.close();
}

// 5. Building your own.
{
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
  const tiles = async () => (await page.$$eval(".tile[data-a]", (els) => els.map((el) => [el.querySelector(".tile-name").textContent, parseInt(el.querySelector(".tile-steps").textContent, 10), el.querySelector(".tile-die").textContent]))).sort();

  await page.goto(`${BASE}/characters/`);
  await page.click('a[data-act="bopen"]');
  has(await step(), "Archetypes", "the builder's first step");
  for (const t of [0, 1]) {
    await b(`[data-b="arch"][data-t="${t}"][data-v="Shadow"]`);
    await b(`[data-b="idea"][data-t="${t}"][data-v="k-rogue"]`);
  }
  has(await page.textContent(".bd-body"), "Shadow twice, so your +2 is a +3", "two Shadows");
  await shot(page, "5-builder-archetypes");
  await next("Titles and permissions");
  await b('[data-b="title"][data-t="0"][data-v="The best cat burglar in the city"]');
  for (const p of ["move unseen", "run the rooftops", "pick a mechanical lock"]) await b(`[data-b="perm"][data-t="0"][data-v="${p}"]`);
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
  const on = { t0: ["Sneak", "Move", "Locks"], "p0.0": ["Sneak"], "p0.1": ["Move"], "p0.2": ["Locks"], "p1.0": ["Locks"], "p1.1": ["Fight"], r0: ["Sneak"] };
  for (const [l, list] of Object.entries(on)) for (const a of list) await b(`[data-b="on"][data-l="${l}"][data-a="${a}"]`);
  has(await page.textContent('.bd-tiles .tile:has(.tile-name:text-is("Sneak"))'), "4 steps", "Sneak with her first Title, move unseen and Silent Step");
  // A permission goes on two set actions at most: a third gets a warning, and it can still go on.
  await b('[data-b="on"][data-l="p0.0"][data-a="Move"]');
  same(await page.$$eval(".bd-lines .cc-warn", (els) => els.length), 0, "a permission on two set actions");
  await b('[data-b="on"][data-l="p0.0"][data-a="Defend"]');
  has(await page.textContent(".bd-lines .cc-warn"), "It’s on 3. A permission goes on two at most.", "a permission on three set actions");
  for (const a of ["Move", "Defend"]) await b(`[data-b="on"][data-l="p0.0"][data-a="${a}"]`);
  same(await page.$$eval(".bd-lines .cc-warn", (els) => els.length), 0, "back on one set action");
  await shot(page, "6-builder-set-actions");
  await next("What you carry");
  await b('[data-b="fillany"][data-k="e"][data-v="worn leathers"]');
  same(await page.getAttribute('[data-b="on"][data-l="e0"][data-a="Defend"]', "aria-pressed"), "true", "worn leathers going straight on her Defend");
  await b('[data-b="fillany"][data-k="u"][data-v="Purse of gold"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Smoke bomb"]');
  await page.fill("#b-k", "the first coin she ever stole");
  await page.fill("#b-a0-name", "A perfect set of picks");
  await page.fill("#b-a0-p0", "open any lock with a mechanism");
  await b('[data-b="on"][data-l="a0.0"][data-a="Locks"]');
  await page.fill("#b-a1-name", "A grappling line");
  await page.fill("#b-a1-p0", "climb or swing anywhere you can throw a hook");
  await b('[data-b="on"][data-l="a1.0"][data-a="Move"]');
  await next("Threads");
  const threads = [["Dorrie", "We have pulled a dozen jobs. I trust her with my life."], ["Bram", "He once carried me out of a fire. I have never said thank you."], ["The fence", "I owe a debt I would rather not discuss."]];
  for (const [i, [who, what]] of threads.entries()) {
    await page.fill(`#b-th${i}-person`, who);
    await page.fill(`#b-th${i}-text`, what);
  }
  await next("Aspiration");
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
  await page.click('.bd-foot button[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
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
  for (const t of [0, 1]) await b(`[data-b="arch"][data-t="${t}"][data-v="Bloodsworn"]`);
  same(await page.$$eval(".bd-body .cc-note", (els) => els.filter((el) => /\+3/.test(el.textContent)).length), 0, "no +3 note for two Bloodsworn");
  await page.click('.bd-dot[data-s="4"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Rations"]');
  await b('[data-b="fillany"][data-k="u"][data-v="Rations"]');
  same(await page.inputValue("#b-u0"), "", "a second tap on Rations takes it back off");
  await b('[data-b="deep"]');
  await page.fill("#b-bag", "a waterskin\nsome rope");
  await page.click('.bd-dot[data-s="7"]');
  await page.fill("#b-name", "Tam");
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  await page.click('.cc-tabs a[data-t="sheet"]');
  has(await page.textContent("#app"), "some rope", "the bag on the sheet");

  // A blank character saves too: the builder warns, and never blocks. Leaving
  // keeps the draft, and the list offers to carry on with it.
  await page.goto(`${BASE}/characters/?build`);
  await page.click('.bd-dot[data-s="7"]');
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
      await page.click(`.bd-dot[data-s="${s}"]`);
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`the builder's step ${s + 1} scrolls sideways at 320 wide, ${theme} (${scroll} > ${client})`);
      await axe(`the builder's step ${s + 1}, ${theme}`);
    }
  }
  await shot(page, "8-builder-320-light");
  console.log("builder: Vesk built step by step and checked against her sheet");
  await context.close();
}

// 6. Print, and the other ways in.
{
  const book = JSON.parse(readFileSync("src/generated/book.json", "utf8"));
  const B = book.companion.build;
  const actionsOf = (s) => s.actions.map((a) => [a.name, a.steps, a.die.replace(/\s/g, "")]).sort();
  for (const c of book.crew) {
    const s = sheetOf({ id: c.id, name: c.name, build: fromCrew(c, B) }, B);
    same(actionsOf(s), actionsOf(c), `${c.name}'s set actions, made into a build`);
    for (const k of ["aura", "resolve", "stride", "wound", "shrug", "confidence"]) same(s.numbers[k], c.numbers[k], `${c.name}'s ${k}, made into a build`);
    same(checksOf(fromCrew(c, B, { keep: true }), B, { changing: true }).map((x) => x.text), [], `${c.name}'s sheet, with nothing to warn about`);
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
  // A thousand random characters: not one warning, and nothing bigger than
  // the crew's biggest set action, 5 steps.
  let warned = 0;
  let biggest = 0;
  for (let i = 0; i < 1000; i++) {
    const b = randomBuild(B, book.crew);
    const why = checksOf(b, B);
    if (why.length) {
      if (!warned) note(`a random character's warnings: ${why.map((x) => x.text).join(" | ")}`);
      warned += 1;
    }
    biggest = Math.max(biggest, ...sheetOf({ id: `random-${i}`, name: b.name, build: b }, B).actions.map((a) => a.steps));
  }
  same(warned, 0, "random characters with a warning, of 1000");
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
  let f = await print();
  same([f.pages, f.file], [2, "vesk-zidara-sheet.pdf"], "Vesk's printed sheet");
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "5"], ["aura_max", "5"], ["stride", "5"], ["resolve_max", "2"],
    ["confidence", "d6"], ["wound_die", "d4"], ["scar_1", ""], ["set_sneak_lines", "Title I, move unseen, Silent Step"], ["set_sneak_steps", "4"], ["set_sneak_die", "d8"],
    ["set_defend_lines", "worn leathers"], ["set_defend_steps", "2"], ["set_defend_die", "d4"],
    ["set_1_name", "Locks"], ["set_1_steps", "5"], ["set_1_die", "d10"], ["set_2_name", ""], ["set_talk_steps", "1"], ["title_1", "The best cat burglar in the city"], ["title_1_archetype", "Shadow"],
    ["trait_1", "Silent Step"], ["equipment_1", "worn leathers"], ["utility_2", "a smoke bomb"], ["keepsake", "the first coin she ever stole"], ["attune_1_thing", "A perfect set of picks"],
    ["attune_1_stage", "awakened"], ["attune_1_permission_1", "open any lock with a mechanism"], ["bond_1", "Dorrie"],
    ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"], ["aspiration", "Own the score of a lifetime"], ["aspiration_die", "d2"],
    ["resolve_2", true], ["resolve_3", false]], "Vesk's printed sheet");
  for (const gone of ["armour_full", "armour_now", "hurt_1_box_1", "hurt_1_catch"]) same(f.get(gone), null, `no ${gone} on the sheet`);
  // Her leathers broken and a Scar: they print where they are now.
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('button[data-act="cross"][data-k="equipment|worn leathers"]');
  await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("zi-characters"));
    Object.assign(all.characters.at(-1).state, { scars: ["a spear through the shoulder"], wound: 6 });
    localStorage.setItem("zi-characters", JSON.stringify(all));
  });
  await page.reload();
  await page.waitForSelector(".cc-tabs");
  f = await print();
  want(f, [["wound_die", "d6"], ["scar_1", "a spear through the shoulder"], ["scar_2", ""], ["set_defend_lines", "worn leathers (broken)"], ["equipment_1", "worn leathers (broken)"]], "Vesk's sheet with her leathers broken and a Scar");
  await page.click('button[data-act="cross"][data-k="equipment|worn leathers"]');
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
  want(f, [["name", "Kestrel"], ["set_sneak_steps", "4"], ["set_move_die", "d8"], ["set_1_name", "Locks"], ["set_1_die", "d10"], ["title_2_permission_2", "fight dirty with a knife"], ["attune_2_thing", "A grappling line"], ["notes", "Trouble that follows her: wanted in three districts, owes the Guild."]], "Kestrel, made from Vesk");

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
// the d6, then the club's d8), or tap them in when real is set.
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
{
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
  has(await card(page), "5 steps and 4 steps is 9 steps", "the combo's steps");
  has(await card(page), "and the 3 left over make a d6, so that’s a d12 and a d6", "the combo's dice");
  await page.click('button[data-do="back"]');
  await page.click('button[data-do="next"]');
  same(await page.isDisabled('button[data-do="next"]'), false, "Wren and Bram still in after going back");
  await page.click('button[data-do="next"]');
  await page.evaluate(() => window.ziCompanion.setDice([8, 3, 6]));
  await page.click('button[data-do="roll"]');
  same(await page.$$eval("[data-spin]", (els) => els.length), 0, "dice tumbling with reduce-motion on");
  same(await page.$$eval(".ln-roll .hex", (els) => els.map((e) => e.textContent)), ["6", "8", "3"], "the club's d8 and your d12 and d6");
  has(await card(page), "Your 8 beats the brute’s 6, so the club never comes down", "a beaten club");
  same(await page.evaluate(() => document.activeElement?.id), "ln-out", "focus on what the dice did");
  same(await moving(page), 0, "things moving on the round with reduce-motion on");
  await page.click('button[data-do="next"]');
  has(await card(page), "you stopped it, so nothing lands and the round’s over", "the end of a round that was stopped");
  await page.click('button[data-do="again"]');
  has(await page.textContent("#ln-h"), "The GM telegraphs", "playing it again");
  await round(page, [5, 6, 6]);
  has(await card(page), "Your 6 ties the brute’s 6", "a tie on the club");
  has(await card(page), "The d6 came up 6, its top face, so Wren gets 1 Aura back", "a top face in a combo");
  has(await card(page), "if her Aura’s full she gives it to a friend in the scene", "a top face with Wren's Aura full");
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 7], true);
  has(await card(page), "The brute’s 7 beats your best, a 3, so the club lands on Isolde at once", "real dice that lose");
  has(await card(page), "Isolde’s wound die goes up a size, from d2 to d4", "the Hurt on Isolde");
  same(await page.$$eval(".ln-hurt .mini i.on", (els) => els.length), 1, "Isolde's wound die row");
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
{
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
  await round(page, [12, 4, 5]);
  same(await page.$$eval(".ln-roll [data-spin]", (els) => els.length), 3, "the dice tumbling");
  if (!(await moving(page))) note("the dice don't move while they tumble");
  await page.waitForSelector("#ln-out", { timeout: 5000 }).catch(() => note("the dice never landed"));
  same(await page.$$eval(".ln-roll .hex", (els) => els.map((e) => e.textContent)), ["5", "12", "4"], "the dice once they've landed");
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
  // On a sheet: the tabs slide, the roll card turns over, the pips glow, and
  // a Hurt and the one that takes the wound die to d12 each get their buzz.
  await play(page, "vesk");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.$$eval(".cc-page.cc-go-next", (els) => els.length), 1, "the Sheet tab sliding in");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$$eval(".cc-page.cc-go-back", (els) => els.length), 1, "the Play tab sliding back");
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('button[data-act="aura"][data-d="-1"]');
  await page.click('.tile[data-a="0"]');
  await page.evaluate(() => window.ziCompanion.setDice([8]));
  await page.click('#cc-dialog button[data-act="go"]');
  same(await page.$$eval("#cc-dialog .dlg-body.cc-flip", (els) => els.length), 1, "the roll card turning over");
  if (!(await page.$$eval("#cc-dialog [data-spin]", (els) => els.length))) note("Vesk's dice didn't tumble");
  await page.waitForSelector("#cc-dialog .dlg-body.cc-reveal", { timeout: 5000 }).catch(() => note("Vesk's dice never landed"));
  same(await page.$$eval("#cc-dialog .cc-res .hex", (els) => els.map((e) => e.textContent)), ["8"], "Vesk's die once it's landed");
  same(await page.$$eval(".t-aura .pips i.is-new", (els) => els.length), 0, "a pip glowing behind the roll card");
  await page.click('#cc-dialog button.primary[data-act="close"]');
  same(await page.$$eval(".t-aura .pips i.is-new", (els) => els.length), 1, "the top face's Aura pip glowing as the card closes");
  await page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await page.click('.cc-stat[data-p="wound"]');
  for (let i = 0; i < 5; i++) await page.click('button[data-act="hurt"][data-d="1"]');
  same((await heard()).buzz, [60, 60, 60, 60, [70, 60, 120]], "four Hurts, then the one that takes the wound die to d12");
  same(await page.$$eval(".t-wound .mini i.is-new", (els) => els.length), 1, "the wound die's row glowing as it goes up");
  await shot(page, "vesk-motion");
  await context.close();
  console.log("feel: the dice tumble and land, the cards turn and slide, and sound waits to be turned on");
}

// 8. Downtime and rule changes.
{
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
  await dt('[data-do="set"][data-s="1"][data-f="a"][data-v="1"]');
  has(await page.textContent("#cc-dialog .dt-slot.is-picked:last-of-type"), "Awakened, with 1 permission", "the grappling line's stage");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="catch"]', "Loud");
  await page.fill('#cc-dialog input[data-dt="1"][data-f="text"]', "haul someone up after me");
  await shot(page, "downtime-card");
  await dt('[data-do="finish"]');
  await closed();
  has(await page.textContent("#cc-toast"), "Pay the fence, every coin: done.", "the week's toast");
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
  same(await page.$$eval(".cc-gold, .cc-gem", (els) => els.length), 0, "no gold marks for what she grew");
  await playTab();
  same(await page.getAttribute(".cc-undo", "aria-label"), "Undo downtime", "the undo after downtime");
  await page.click(".cc-undo");
  text = await sheet();
  same(text.includes("haul someone up after me") || text.includes("Its Catch: Loud"), false, "the week undone");

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
  await page.click('#cc-dialog details[data-open="dt-free"] > summary');
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
  has(await page.textContent("#cc-toast"), "Sneak is 5 steps, d10.", "the toast saying Sneak's new size");
  same(await tileOf("Sneak"), "5 d10", "Sneak with its new permission");
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
  same(await tileOf("Sneak"), "5 d10", "Sneak offline");
  await context.setOffline(false);
  const saved = await page.evaluate(() => localStorage.getItem("zi-characters"));
  const id = JSON.parse(saved).characters[0].id;
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
{
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
      { k: "att", a: 1, text: "haul someone up after me", on: [], catch: "Loud", burden: "", up: false },
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
      { k: "att", a: 1, text: "haul someone up after me", on: [], catch: long("Loud", 110), burden: "", up: false },
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
  same((await tilesNow()).find((t) => t[0] === "Sneak"), ["Sneak", 5, "d10"], "Sneak after a downtime");
  await tab("sheet");
  has(await page.textContent(".cc-page"), "You can carry one more utility item.", "Prepared from downtime on her sheet");
  // Then play: a Hurt, 1 Aura spent, her thread with Bram strained, her smoke bomb used.
  await page.click(`button[data-act="strain"][data-k="Bram|${bram}"]`);
  await page.click('button[data-act="cross"][data-k="utility|a smoke bomb"]');
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
    same(tiles, [["Sneak", 5, "d10"], ["Move", 4, "d8"], ["Locks", 5, "d10"], ["Defend", 2, "d4"], ["Fight", 2, "d4"], ["Study", 1, "d2"], ["Talk", 3, "d6"]], `her set actions, ${when}`);
    for (const [name, steps, die] of tiles) same(die, diceLabel(stepsToDice(steps)), `${name}'s ${steps} steps through dice.js, ${when}`);
    same([await page.textContent('.cc-stat[data-p="aura"] .v'), await page.textContent('.cc-stat[data-p="resolve"] .v'), await page.textContent('.cc-stat[data-p="wound"] .v')], ["4/5", "3/3", "d4"], `her Aura, Resolve and wound die, ${when}`);
    same(await golds(), 0, `no gold marks, ${when}`);
    await tab("sheet");
    const text = await page.textContent(".cc-page");
    for (const want of ["Third Title", "Captain of the crew", "know who’s lying in my crew", "slip through any crowd", bramNow, "two smoke bombs", "made from Vesk’s sheet in the rules"]) has(text, want, `her sheet, ${when}`);
    has(await page.textContent(`li.cc-thread:has-text("${bramNow}")`), "Strained", `the reworded thread still strained, ${when}`);
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
  await page.click('button[data-act="cross"][data-k="bag|some bread"]');
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

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
