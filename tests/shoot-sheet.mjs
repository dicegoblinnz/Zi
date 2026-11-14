// Shoots a character's screens on a phone held in one hand (390 by 844, 1x)
// and measures how long each one is, for a before and after of the sheet.
//
//   npm run build && node tests/shoot-sheet.mjs [folder] [crew id]
//
// ZI_DIST=<folder> shoots another build. It writes a PNG for each screen and
// sizes.json (each screen's length in px and in screens, the words showing on
// it, every section's place on it, and each of the Sheet tab's folds once
// it's open), and prints the sizes. PW_CHROMIUM names the browser to use.
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = process.env.ZI_DIST || join(process.cwd(), "dist");
const OUT = process.argv[2] || join(process.cwd(), "shots");
const WHO = process.argv[3] || "bram";
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain", ".pdf": "application/pdf", ".woff2": "font/woff2", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const W = 390;
const H = 844;

async function resolve(path) {
  const clean = decodeURIComponent(path.split("?")[0].split("#")[0]);
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
  if (!file) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    return res.end("Not found");
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
const page = await context.newPage();
const sizes = {};

// How long the page is, and where each of its sections sits.
async function measure(name, scope = "main, #app, body") {
  sizes[name] = await page.evaluate(({ scope, H }) => {
    const root = document.querySelector(scope) || document.body;
    const long = Math.max(document.documentElement.scrollHeight, root.scrollHeight);
    const parts = [...document.querySelectorAll("section.cc-sec, .cc-trackers, .cc-track, details.cc-fold")].map((el) => {
      const b = el.getBoundingClientRect();
      const title = (el.querySelector("h2, h3, summary")?.textContent || el.className).trim().replace(/\s+/g, " ").slice(0, 40);
      return { part: title, top: Math.round(b.top + scrollY), tall: Math.round(b.height), words: (el.innerText.match(/\S+/g) || []).length };
    });
    return { px: long, screens: Math.round((long / H) * 10) / 10, words: (root.innerText.match(/\S+/g) || []).length, parts };
  }, { scope, H });
}
const shoot = (name) => page.screenshot({ path: join(OUT, `${name}.png`) });
async function shootAt(name, selector) {
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "start" }), selector);
  await shoot(name);
}

await page.goto(`${BASE}/characters/`);
await page.click(`button[data-act="play"][data-c="${WHO}"]`);
await page.click('#cc-dialog button[type="submit"]');
await page.waitForSelector(".tile[data-r]");
await measure("play");
await shoot("play-1-top");
await shootAt("play-2-archetypes", ".cc-abilities");
await shootAt("play-3-attuned", ".cc-attune");

// The roll card on their best Root.
await page.evaluate(() => scrollTo(0, 0));
const best = await page.$$eval(".cc-roots .tile[data-r]", (els) => els.map((el) => [el.dataset.r, parseInt(el.querySelector(".tile-steps").textContent, 10) || 0]).sort((a, b) => b[1] - a[1])[0][0]);
await page.click(`.cc-roots .tile[data-r="${best}"]`);
await page.waitForSelector("#cc-dialog[open]");
sizes.roll = await page.evaluate((H) => {
  const d = document.querySelector("#cc-dialog");
  const long = Math.max(d.scrollHeight, ...[...d.querySelectorAll("*")].map((el) => el.scrollHeight));
  return { px: long, screens: Math.round((long / H) * 10) / 10, chips: d.querySelectorAll(".cc-pick").length, buttons: d.querySelectorAll("button").length, words: (d.innerText.match(/\S+/g) || []).length };
}, H);
await shoot("roll-1-card");
await page.keyboard.press("Escape");

// The Sheet tab.
await page.click('.cc-tabs a[data-t="sheet"]');
await page.waitForSelector("details.cc-fold, .cc-fold");
await measure("sheet");
await page.evaluate(() => scrollTo(0, 0));
await shoot("sheet-1-top");
// Each fold once it's open.
await page.$$eval("details.cc-fold", (els) => els.forEach((d) => (d.open = true)));
sizes.folds = { parts: await page.$$eval("details.cc-fold", (els) => els.map((d) => ({ part: d.querySelector(".cc-fold-t").innerText.trim(), top: Math.round(d.getBoundingClientRect().top + scrollY), tall: Math.round(d.getBoundingClientRect().height), words: (d.querySelector(".cc-fold-b").innerText.match(/\S+/g) || []).length }))) };

await writeFile(join(OUT, "sizes.json"), JSON.stringify(sizes, null, 2));
for (const [name, s] of Object.entries(sizes)) {
  console.log(s.px ? `${name}: ${s.px}px, ${s.screens} screens, ${s.words} words${s.chips != null ? `, ${s.chips} chips, ${s.buttons} buttons` : ""}` : `${name}, each one open:`);
  for (const p of s.parts ?? []) console.log(`   ${String(p.top).padStart(5)}  ${String(p.tall).padStart(5)}px  ${String(p.words).padStart(4)} words  ${p.part}`);
}
await browser.close();
server.close();
