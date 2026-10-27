// Open the built site (dist/) in Chromium and check it the way players will use it.
//
//   npm run build && node tests/check-site.mjs [screenshot-folder]
//
// For each page, at 320, 360, 390, 430 and 1280 wide, in light and dark (a
// chapter with a section in its address opens that section on a phone):
// nothing fetched from outside the site, no sideways scrolling, no console
// errors, and tap targets at least 44px high in the menus. Runs axe on every
// page, tries a search and flips the light switch. Checks the printable
// sheets are in the build and were built from the rules as they are now.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { SHEETS, sourceHash, stampedHash } from "../scripts/sheets/sources.mjs";

const DIST = join(process.cwd(), "dist");
const SHOTS = process.argv[2] || null;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain", ".pdf": "application/pdf" };

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
  // Signed out, the Worker answers the account page like this (src/worker/index.js).
  if (req.url.startsWith("/api/me")) {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ user: null, providers: ["google", "discord"] }));
  }
  // And a join link's code like this, so joining shows how to sign in.
  if (req.url.startsWith("/api/join")) {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ campaign: { name: "Tuesday Lair", gm: "Mo", id: null, role: null } }));
  }
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
  "/", "/rules/", "/learn/", "/rules/welcome/", "/rules/the-core/", "/rules/the-archetypes/",
  "/rules/title-ideas-and-the-crew/", "/rules/conflict/", "/rules/the-bestiary/", "/rules/twenty-places/#s-place-copper-baths",
  "/rules/appendix-c-every-lever-in-the-game/", "/rules/conflict/#s-defending", "/rules/the-index/", "/changes/", "/search/", "/no-such-page/",
  "/characters/", "/characters/?c=check-vesk", "/characters/?c=check-vesk&t=sheet", "/characters/?c=check-vesk&t=rules", "/characters/?build", "/sheets/",
  "/account/", "/characters/?join", "/kit/",
  // The world builder's tables, a board and every table, and the biggest board there is.
  "/deal/", "/deal/?region=world&genre=medieval&factions=12&seed=ash-lantern-ford",
  // The table screen with no code yet, and with one that can't be right.
  "/table/", "/table/#not-a-code",
];
// A character saved on the phone, so a sheet gets checked like any other page.
// Its hash is blank, so the sheet shows its "changed in the rules" note too.
// A join link's code waits on the phone too, for joining a campaign signed out.
const SAVED = JSON.stringify({ v: 1, characters: [{ id: "check-vesk", crew: "vesk", name: "Vesk", hash: "", state: {} }] });
const seed = (context) => context.addInitScript((saved) => {
  try {
    if (!localStorage.getItem("zi-characters")) localStorage.setItem("zi-characters", saved);
    localStorage.setItem("zi-join", JSON.stringify({ code: "check-join-code-0001", at: Date.now() }));
  } catch (e) {}
}, SAVED);
const WIDTHS = [320, 360, 390, 430, 1280];
const problems = [];
const note = (p) => { problems.push(p); console.log("  ✗ " + p); };

// The site serves everything itself, fonts included, so it works offline.
// Block anything from elsewhere, and keep a list so the checks can say what it was.
async function sealed(context) {
  const outside = [];
  await context.route((url) => url.hostname !== "localhost", (route) => { outside.push(route.request().url()); return route.abort(); });
  return outside;
}

// The printable sheets. Each PDF carries a hash of what it was built from
// (scripts/sheets/sources.mjs), so one that's fallen behind the rules, like
// the player reference behind a change to Appendix D, fails here.
for (const [name, sheet] of Object.entries(SHEETS)) {
  let bytes;
  try { bytes = await readFile(join(DIST, "sheets", sheet.file)); } catch { note(`sheets: ${sheet.file} isn't in the build`); continue; }
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const stamped = stampedHash(pdf.getKeywords());
  if (stamped !== sourceHash(name)) note(`sheets: ${sheet.file} is older than what it's built from (${SHEETS[name].sources[0]} and the rest). Run npm run sheets and commit the PDFs.`);
  else console.log(`sheets: ${sheet.file} matches its sources (${stamped})`);
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const scheme of ["light", "dark"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme });
    // The site's dark unless the visitor picked light, which the browser remembers.
    if (scheme === "light") await context.addInitScript(() => { try { localStorage.setItem("zi-theme", "light"); } catch (e) {} });
    await seed(context);
    const outside = await sealed(context);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" && !/net::ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const path of PAGES) {
      errors.length = 0;
      outside.length = 0;
      await page.goto(BASE + path, { waitUntil: "load" });
      await page.waitForSelector("main");
      if (outside.length) note(`${path} @${width} ${scheme}: fetches from outside the site: ${[...new Set(outside)].slice(0, 3).join(", ")}`);
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      if (scroll > client) note(`${path} @${width} ${scheme}: scrolls sideways (${scroll} > ${client})`);
      if (path === "/no-such-page/") errors.splice(0, errors.length, ...errors.filter((e) => !/status of 404/.test(e)));
      if (errors.length) note(`${path} @${width} ${scheme}: console errors: ${errors.join(" | ")}`);
      // Menus and buttons need room for a thumb. Links inside running text don't.
      const small = await page.evaluate(() =>
        [...document.querySelectorAll(".topnav a, .brand, .button, .theme-toggle, .pager a, .toc-mobile > summary, .toc-mobile a, footer.site nav a, .hero-actions .more, .part li a, .cc button, .cc-back, .cc-own > summary, .cc summary, .rs-mark, .hub-row a, .hub-carry, .rd-back, .rd-mark, .rd-foot a, .pl-tab, .seal > summary, .lr-out, .lr-icon, .lr-foot .button, .lr-more, .lr-mark, .rd-go, .rd-marks a")]
          .filter((el) => el.getClientRects().length && el.offsetParent !== null && (!el.checkVisibility || el.checkVisibility()))
          .map((el) => ({ t: el.textContent.trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
          .filter((x) => x.h < 44),
      );
      if (width < 900 && small.length) note(`${path} @${width} ${scheme}: small tap targets: ${small.slice(0, 4).map((x) => `${x.t} (${x.h}px)`).join(", ")}`);
      if (SHOTS && (width === 390 || width === 1280) && ["/", "/learn/", "/rules/the-archetypes/", "/rules/conflict/", "/changes/", "/characters/", "/characters/?c=check-vesk"].includes(path)) {
        const name = `${path.replace(/[^a-z0-9-]+/gi, "_") || "_"}${width}-${scheme}.png`.replace(/^_+/, "");
        await page.screenshot({ path: join(SHOTS, name) });
      }
    }
    await context.close();
  }
}

// Accessibility, on every page, at phone width in light and desktop in dark.
for (const [width, scheme] of [[390, "light"], [1280, "dark"]]) {
  const context = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme });
  if (scheme === "light") await context.addInitScript(() => { try { localStorage.setItem("zi-theme", "light"); } catch (e) {} });
  await seed(context);
  await sealed(context);
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
  const outside = await sealed(context);
  const page = await context.newPage();
  await page.goto(BASE + "/search/?q=wound%20die");
  await page.waitForSelector(".pagefind-ui__result", { timeout: 10000 }).catch(() => note("search: no results for 'wound die'"));
  const count = await page.locator(".pagefind-ui__result").count();
  const size = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#search input")).fontSize));
  if (size < 16) note(`search: the input's text is ${size}px, under 16px`);
  if (outside.length) note(`search: fetches from outside the site: ${[...new Set(outside)].slice(0, 3).join(", ")}`);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "search-390-light.png") });
  console.log(`search: ${count} results for "wound die"`);
  await context.close();
}

// The light switch flips the theme, and the choice sticks from page to page.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 860 } });
  await sealed(context);
  const page = await context.newPage();
  const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.goto(BASE + "/");
  if (await theme()) note(`theme: starts as ${await theme()}, not dark`);
  await page.click(".theme-toggle");
  if ((await theme()) !== "light") note("theme: the switch didn't turn light mode on");
  const label = await page.getAttribute(".theme-toggle", "aria-label");
  if (label !== "Switch to dark mode") note(`theme: in light mode the switch says "${label}"`);
  await page.goto(BASE + "/rules/conflict/");
  if ((await theme()) !== "light") note("theme: light mode wasn't remembered on the next page");
  await page.click(".theme-toggle");
  if (await theme()) note("theme: the switch didn't go back to dark");
  console.log("theme: the light switch checked");
  await context.close();
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll checks passed");
process.exitCode = problems.length ? 1 : 0;
