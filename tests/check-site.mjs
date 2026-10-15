// Open the built site (dist/) in Chromium and check it the way players will use it.
//
//   npm run build && node tests/check-site.mjs [screenshot-folder]
//
// For each page, at 320, 360, 390, 430 and 1280 wide, in light and dark:
// no sideways scrolling, no console errors, and tap targets at least 44px
// high in the menus. Runs axe on every page, and tries a search.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const DIST = join(process.cwd(), "dist");
const SHOTS = process.argv[2] || null;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain" };

// A small static server that answers the way Cloudflare's assets do.
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
  if (file) {
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } else {
    res.writeHead(404, { "content-type": TYPES[".html"] });
    res.end(await readFile(join(DIST, "404.html")));
  }
});
await new Promise((r) => server.listen(4173, r));
const BASE = "http://localhost:4173";

const PAGES = [
  "/", "/rules/", "/rules/welcome/", "/rules/the-core/", "/rules/the-archetypes/",
  "/rules/title-ideas-and-the-crew/", "/rules/conflict/", "/rules/the-bestiary/",
  "/rules/appendix-c-every-lever-in-the-game/", "/rules/the-index/", "/changes/", "/search/", "/no-such-page/",
];
const WIDTHS = [320, 360, 390, 430, 1280];
const problems = [];
const note = (p) => { problems.push(p); console.log("  ✗ " + p); };

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const scheme of ["light", "dark"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme });
    // Fonts come from Google, which a sandbox may not reach. Don't count that as the site's fault.
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const path of PAGES) {
      errors.length = 0;
      await page.goto(BASE + path, { waitUntil: "load" });
      await page.waitForSelector("main");
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`${path} @${width} ${scheme}: scrolls sideways (${scroll} > ${client})`);
      if (path === "/no-such-page/") errors.splice(0, errors.length, ...errors.filter((e) => !/status of 404/.test(e)));
      if (errors.length) note(`${path} @${width} ${scheme}: console errors: ${errors.join(" | ")}`);
      // Menus and buttons need room for a thumb. Links inside running text don't.
      const small = await page.evaluate(() =>
        [...document.querySelectorAll(".topnav a, .brand, .button, .pager a, .toc-mobile > summary, .toc-mobile a")]
          .filter((el) => el.getClientRects().length && el.offsetParent !== null)
          .map((el) => ({ t: el.textContent.trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
          .filter((x) => x.h < 44),
      );
      if (width < 900 && small.length) note(`${path} @${width} ${scheme}: small tap targets: ${small.slice(0, 4).map((x) => `${x.t} (${x.h}px)`).join(", ")}`);
      if (SHOTS && (width === 390 || width === 1280) && ["/", "/rules/the-archetypes/", "/rules/conflict/", "/changes/"].includes(path)) {
        const name = `${path.replace(/\//g, "_") || "_"}${width}-${scheme}.png`.replace(/^_+/, "");
        await page.screenshot({ path: join(SHOTS, name) });
      }
    }
    await context.close();
  }
}

// Accessibility, on every page, at phone width in light and desktop in dark.
for (const [width, scheme] of [[390, "light"], [1280, "dark"]]) {
  const context = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  const page = await context.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "load" });
    const result = await new AxeBuilder({ page }).analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
      note(`${path} @${width} ${scheme}: axe ${v.impact}: ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target?.join(" ")}`);
    }
  }
  await context.close();
}

// Search finds things, and an input is big enough that phones don't zoom in.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 860 } });
  const page = await context.newPage();
  await page.goto(BASE + "/search/?q=wound%20die");
  await page.waitForSelector(".pagefind-ui__result", { timeout: 10000 }).catch(() => note("search: no results for 'wound die'"));
  const count = await page.locator(".pagefind-ui__result").count();
  const size = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#search input")).fontSize));
  if (size < 16) note(`search: the input's text is ${size}px, under 16px`);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "search-390-light.png") });
  console.log(`search: ${count} results for "wound die"`);
  await context.close();
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll checks passed");
process.exitCode = problems.length ? 1 : 0;
