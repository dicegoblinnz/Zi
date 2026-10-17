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
//    offline and reload. Then a split roll with a top face and a tie, an undo,
//    a defence roll and a new scene.
// 5. Building your own: Vesk again, through the builder a step at a time. Her
//    set actions and numbers have to match her sheet in the chapter. Then a
//    roll, a reload, offline, a change in the builder, and every step at 320
//    wide in the light, with axe on each.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { diceLabel, diceRange, diceShapes, stepsToDice } from "../src/companion/dice.js";

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
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
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

async function phone() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", colorScheme: "dark" });
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
  await page.click('#cc-dialog button[data-act="armour"][data-d="-1"]');
  has(await page.textContent("#cc-dialog .dlg-body"), "Armour d2", "Armour after it steps down");
  await page.click('#cc-dialog .dlg-foot button[data-act="close"]');
  await page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  await page.click('button[data-act="scene"]');
  same(await aura(), "5/5", "Aura after a new scene");
  same(await page.textContent('.cc-stat[data-p="armour"] .v'), "d2", "Armour doesn't come back with a new scene");
  await context.close();
}

// Wren goes at a Marked Warden: her Fight's d10 and the Mark d10 against its d8.
// Both come in under, and her Hunter's +3 on the Mark die makes the 6 a 9.
{
  const { context, page } = await phone();
  await play(page, "wren");
  await page.click('.tile[data-a]:has(.tile-name:text-is("Fight"))');
  await page.click('#cc-dialog .cc-chipbtn[data-act="vs"][data-v="8"]');
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
  await page.click('.bd-dot[data-s="7"]');
  await b('[data-b="save"]');
  await page.waitForSelector(".tile[data-a]");
  has(await page.textContent(".cc-head"), "Stride 3", "Vesk's stride without Light on my Feet");
  same(await page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.filter((c) => c.build).length), 1, "changing her doesn't make a second Vesk");

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

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
