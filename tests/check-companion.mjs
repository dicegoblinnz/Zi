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
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
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

  // Two guards let ride against her d4 Armour: the d8's 6 gets through, and
  // the d6's 3 ties her 3, so it doesn't.
  await page.click('.tile[data-act="defence"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="8"]');
  await page.click('#cc-dialog button[data-act="d-add"][data-v="6"]');
  await page.evaluate(() => window.ziCompanion.setDice([3, 6, 3]));
  await page.click('#cc-dialog button[data-act="d-go"]');
  await page.waitForSelector("#cc-dialog .res .res-out");
  same(await page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Gets through", "Stopped"], "two blows against one Armour roll");
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

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll companion checks passed");
process.exitCode = problems.length ? 1 : 0;
