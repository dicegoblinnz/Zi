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
//    roll and a new scene. Then the play screen's stage 3: a threat's die, a
//    tap-in with an intent, Defend with a swap, and an undo of Hurt.
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
//    landing, a top face, a Hurt and a bar filling each get one.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { diceLabel, diceRange, diceShapes, stepsToDice } from "../src/companion/dice.js";
import { checksOf, sheetOf } from "../src/companion/builder.js";
import { fromCrew, randomBuild } from "../src/companion/ways.js";

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
  await page.click('.cc-rulebox > summary:has-text("Defend")');
  has(await page.textContent(".cc-rulebox[open]"), "every die", "Defend on the Rules tab, offline");
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

  // Warded d6 is a step on her Armour, so the d4 rolls as a d6.
  await page.click('.cc-stat[data-p="cond"]');
  await page.selectOption('form[data-form="cond"] select[name="pick"]', "Warded");
  await page.selectOption('form[data-form="cond"] select[name="die"]', "6");
  await page.click('form[data-form="cond"] button[type="submit"]');

  // Two guards let ride against her Armour: the d8's 6 gets through, and
  // the d6's 3 ties her 3, so it doesn't.
  await page.click('.tile[data-act="defence"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "you’re rolling a d6", "her d4 Armour while she's Warded");
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 6, 3]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Gets through", "Stopped"], "two blows against one Armour roll");
  has(await page.textContent("#cc-dialog .cc-mine-roll"), "Your d6", "the Warded Armour die");
  await shot(page, "5-when-it-lands");
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="armour"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Armour d2", "Armour after it steps down");
  has(await page.textContent("#cc-dialog .res-paid"), "Armour down to d2", "the blow's cost counted on it");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  await page.click('button[data-act="scene"]');
  same(await aura(), "5/5", "Aura after a new scene");
  same(await page.textContent('.cc-stat[data-p="armour"] .v'), "d2", "Armour doesn't come back with a new scene");

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

  // Defend with a swap: two d6s, one meant to pin her. Her Armour's back to
  // d4, and her 4 and 1 meet their 3 and 3. The phone puts the 4 on the pin,
  // and a swap moves it onto the other blow.
  await page.click('.cc-stat[data-p="armour"]');
  await page.click('.cc-panel button[data-act="armour"][data-d="full"]');
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-defend"][data-v="1"]');
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

  // An undo of Hurt: she takes the pin as a Hurt instead, then takes it back.
  await page.click('#cc-dialog button[data-act="d-pay"][data-what="hurt"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "1 of 9 boxes", "a Hurt from the pin");
  has(await page.textContent("#cc-dialog .res-paid"), "Took a Hurt", "the Hurt counted on the blow");
  await page.click('#cc-dialog .dlg-foot button[data-act="undo"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "0 of 9 boxes", "the Hurt undone");
  same(await page.$$eval('#cc-dialog button[data-act="d-pay"]', (els) => els.length > 0), true, "the blow waiting to be paid again after the undo");
  same(await blows(), ["Gets through", "Stopped"], "the swap still stands after the undo");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await page.textContent('.cc-stat[data-p="hurt"] .v'), "0/9", "Hurt on the play screen after the undo");
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
  await shot(page, "6-builder-set-actions");
  await next("What you carry");
  await b('[data-b="fillany"][data-k="e"][data-v="worn leathers"]');
  same(await page.getAttribute('[data-b="armour"][data-i="0"]', "aria-pressed"), "true", "worn leathers counted as armour");
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
  for (const n of ["Aura 5", "Resolve 2", "Stride 5 (Light on my Feet)", "Hurt 3 bars", "Armour d4 (worn leathers)", "Confidence d6"]) has(nums, n, "the built Vesk's numbers");
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
  await page.click('a[data-act="bopen"][data-key]');
  has(await step(), "Check it and play", "changing her opens on the last step, offline");
  await context.setOffline(false);

  // Change her: Prepared instead of Light on my Feet.
  await page.click('.bd-dot[data-s="2"]');
  await b('[data-b="deep"]');
  await b('[data-b="trait"][data-v="Light on my Feet"]');
  await b('[data-b="trait"][data-v="Prepared"]');
  await page.click('.bd-dot[data-s="4"]');
  has(await page.textContent("#bd-ut"), "4 utility items", "Prepared gives her a fourth utility item");
  await b('[data-b="fillany"][data-k="e"][data-v="shield"]');
  await page.click('.bd-dot[data-s="7"]');
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  has(await page.textContent(".cc-head"), "Stride 3", "Vesk's stride without Light on my Feet");
  has(await page.textContent('.cc-stat[data-p="armour"] .v'), "d6", "her full Armour going up with a shield");
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
  same(await page.$$eval(".tile[data-a]", (els) => els.length), 5, "a blank character's five set actions");
  has(await page.textContent(".cc-head h1"), "Kaia", "the blank character's name");

  // Every step at 320 wide, dark then light, with axe.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.click('.cc-tabs a[data-t="sheet"]');
  await page.click('a[data-act="bopen"][data-key]');
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
    for (const k of ["aura", "resolve", "stride", "armour", "confidence", "hurtBars"]) same(s.numbers[k], c.numbers[k], `${c.name}'s ${k}, made into a build`);
  }
  // A thousand random characters: not one warning, and nothing bigger than
  // the crew's biggest set action, 5 steps.
  let warned = 0;
  let biggest = 0;
  for (let i = 0; i < 1000; i++) {
    const b = randomBuild(B, book.crew);
    if (checksOf(b, B).length) warned += 1;
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
  await page.click('.cc-stat[data-p="hurt"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  let f = await print();
  same([f.pages, f.file], [2, "vesk-zidara-sheet.pdf"], "Vesk's printed sheet");
  want(f, [["name", "Vesk"], ["pronouns", "she, her"], ["aura_now", "5"], ["aura_max", "5"], ["armour_full", "d4"], ["armour_now", "d4"], ["stride", "5"], ["resolve_max", "2"],
    ["confidence", "d6"], ["wound_die", "d6"], ["set_sneak_lines", "Title I, move unseen, Silent Step"], ["set_sneak_steps", "4"], ["set_sneak_die", "d8"],
    ["set_1_name", "Locks"], ["set_1_steps", "5"], ["set_1_die", "d10"], ["set_talk_steps", "1"], ["title_1", "The best cat burglar in the city"], ["title_1_archetype", "Shadow"],
    ["trait_1", "Silent Step"], ["equipment_1", "worn leathers"], ["utility_2", "a smoke bomb"], ["keepsake", "the first coin she ever stole"], ["attune_1_thing", "A perfect set of picks"],
    ["attune_1_stage", "awakened"], ["attune_1_permission_1", "open any lock with a mechanism"], ["bond_1", "Dorrie"],
    ["bond_1_thread_2", "We came up on the same streets. She never asks why. (Dorrie’s words)"], ["aspiration", "Own the score of a lifetime"], ["aspiration_die", "d2"],
    ["hurt_1_box_1", true], ["hurt_1_box_2", false], ["resolve_2", true], ["resolve_3", false]], "Vesk's printed sheet");
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
  for (const [a, d] of dice.filter(([a]) => ["Fight", "Move", "Sneak", "Study", "Talk"].includes(a))) same(f.get(`set_${a.toLowerCase()}_die`), d, `the random character's ${a} on paper`);

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
  has(await card(page), "A d2 against a d8 stops it 3 times in 16", "Isolde's Armour against the club");
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
  same(await page.$$('button[data-do="next"]').then((b) => b.length), 0, "moving on before the tie's settled");
  await page.click('button[data-do="win"]');
  has(await card(page), "You pay 1 Aura, so the tie’s yours", "a tie won for 1 Aura");
  await page.click('button[data-do="next"]');
  await page.click('button[data-do="again"]');
  await round(page, [3, 2, 7], true);
  has(await card(page), "The brute’s 7 beats your best, a 3, so the club lands on Isolde at once", "real dice that lose");
  has(await card(page), "that’s 1 of 9 boxes on Isolde’s Hurt track", "the Hurt on Isolde");
  same(await page.$$eval(".ln-hurt .mini i.on", (els) => els.length), 1, "Isolde's Hurt boxes");
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
  same(await page.$$eval(".ln-hurt .mini i.is-new", (els) => els.length), 1, "Isolde's Hurt glowing as it fills");
  // On a sheet: the tabs slide, the roll card turns over, the pips glow, and
  // a Hurt and a full bar each get their buzz.
  await play(page, "vesk");
  await page.click('.cc-tabs a[data-t="sheet"]');
  same(await page.$$eval(".cc-page.cc-go-next", (els) => els.length), 1, "the Sheet tab sliding in");
  await page.click('.cc-tabs a[data-t="play"]');
  same(await page.$$eval(".cc-page.cc-go-back", (els) => els.length), 1, "the Play tab sliding back");
  await page.click('.tile[data-a="0"]');
  await page.evaluate(() => window.ziCompanion.setDice([5]));
  await page.click('#cc-dialog button[data-act="go"]');
  same(await page.$$eval("#cc-dialog .dlg-body.cc-flip", (els) => els.length), 1, "the roll card turning over");
  if (!(await page.$$eval("#cc-dialog [data-spin]", (els) => els.length))) note("Vesk's dice didn't tumble");
  await page.waitForSelector("#cc-dialog .dlg-body.cc-reveal", { timeout: 5000 }).catch(() => note("Vesk's dice never landed"));
  same(await page.$$eval("#cc-dialog .cc-res .hex", (els) => els.map((e) => e.textContent)), ["5"], "Vesk's die once it's landed");
  await page.click('#cc-dialog button.primary[data-act="close"]');
  await page.click('.cc-stat[data-p="aura"]');
  await page.click('button[data-act="aura"][data-d="-1"]');
  await page.click('button[data-act="aura"][data-d="1"]');
  same(await page.$$eval(".t-aura .pips i.is-new", (els) => els.length), 1, "an Aura pip glowing as it fills");
  await page.evaluate(() => (window.__feel = { sounds: 0, buzz: [] }));
  await page.click('.cc-stat[data-p="hurt"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  await page.click('button[data-act="hurt"][data-d="1"]');
  same((await heard()).buzz, [60, 60, [70, 60, 120]], "two Hurts, then a bar filling");
  same(await page.$$eval(".t-hurt .mini i.is-new", (els) => els.length), 1, "a Hurt box glowing as it fills");
  await shot(page, "vesk-motion");
  await context.close();
  console.log("feel: the dice tumble and land, the cards turn and slide, and sound waits to be turned on");
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
