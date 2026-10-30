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
  // The world builder's tables, a board and every table, the biggest board
  // there is, and a deck's first card.
  "/deal/", "/deal/?region=world&genre=medieval&factions=12&seed=ash-lantern-ford", "/deal/?deck=1&seed=ash-lantern-ford",
  // The table screen with no code yet, and with one that can't be right.
  "/table/", "/table/#not-a-code",
  // The whole worlds (stages 12, 13 and 15 of notes/builder-plan.md): the
  // board with a faction open, the web, Night City's map, a place and a
  // person open, and How it came to be.
  "/worlds/night-city/#f-arasaka", "/worlds/night-city/?tab=web", "/worlds/night-city/?tab=map", "/worlds/night-city/?tab=places#p-the-afterlife", "/worlds/night-city/?tab=people#p-rogue-amendiares", "/worlds/night-city/?tab=history",
  "/worlds/abnu/#f-alysta", "/worlds/abnu/?tab=web", "/worlds/abnu/?tab=history",
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
        [...document.querySelectorAll(".topnav a, .brand, .button, .theme-toggle, .pager a, .toc-mobile > summary, .toc-mobile a, footer.site nav a, .hero-actions .more, .part li a, .cc button, .cc-back, .cc-own > summary, .cc summary, .rs-mark, .hub-row a, .hub-carry, .rd-back, .rd-mark, .rd-foot a, .pl-tab, .seal > summary, .lr-out, .lr-icon, .lr-foot .button, .lr-more, .lr-mark, .rd-go, .rd-marks a, .wn-kind, .wn-fs, .wn-bar button, .wn-find input, .ww-seg-b, .wn-gobtn, .wn-webbtn, .wn-zoom button, .wn-mc-go, .wn-mc-x, .wm-pin, .wm-ft")]
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

// A deck on /deal/ (stage 7 of notes/builder-plan.md): a card at a time, Not
// this one, a prompt's three suggestions taken, written over and skipped,
// Undo, the address playing every answer again, Back to the deck before a new
// one, and Answer the rest at random ending on the board, at 390 in light and
// 320 in dark.
for (const [width, scheme] of [[390, "light"], [320, "dark"]]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: scheme });
  if (scheme === "light") await context.addInitScript(() => { try { localStorage.setItem("zi-theme", "light"); } catch (e) {} });
  const outside = await sealed(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const at = `deck @${width} ${scheme}`;
  const lines = () => page.locator(".dl-hist li").count();
  const says = () => page.locator("#up .dl-says").textContent();
  const roomy = async (when) => {
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (scroll > client) note(`${at} ${when}: scrolls sideways (${scroll} > ${client})`);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("#board .button, #board .dl-own input")].filter((el) => el.getClientRects().length).map((el) => ({ t: el.textContent.trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) })).filter((x) => x.h < 44),
    );
    if (small.length) note(`${at} ${when}: small tap targets: ${small.slice(0, 4).map((x) => `${x.t} (${x.h}px)`).join(", ")}`);
    const result = await new AxeBuilder({ page }).include("#board").analyze();
    for (const v of result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) note(`${at} ${when}: axe ${v.impact}: ${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
  };
  await page.goto(BASE + "/deal/?deck=1&seed=ash-lantern-ford&region=town&genre=medieval&factions=6&crew=2");
  await page.waitForSelector("#up .dl-ans");
  if ((await page.locator("#up .dl-ans").count()) !== 2) note(`${at}: the first card hasn't got two answers`);
  if (!(await page.locator("#up .dl-speaker").textContent()).trim()) note(`${at}: the first card doesn't say who's bringing it`);
  if ((await page.locator(".dl-tile").count()) !== 6) note(`${at}: ${await page.locator(".dl-tile").count()} faction tiles for 6 factions`);
  if (!(await page.locator(".dl-tile.on").count())) note(`${at}: no tile says who's on the card`);
  // Not this one: another card, and nothing else changes.
  const first = await says();
  await page.click("[data-not]");
  if ((await says()) === first) note(`${at}: Not this one didn't deal another card`);
  if (await lines()) note(`${at}: Not this one wrote a line of history`);
  // Answer till two prompts have come up. The first's skipped, taken back
  // and answered the same way again, so the same prompt comes up and its
  // first suggestion's taken, and the second's written over.
  let prompts = 0;
  let last = null;
  let side = 0;
  for (let n = 0; n < 60 && prompts < 2 && !(await page.locator(".dl-end").count()); n++) {
    if (await page.locator(".dl-prompt").count()) {
      const ideas = await page.locator(".dl-idea").count();
      if (ideas !== 3) note(`${at}: a prompt has ${ideas} suggestions, not three`);
      if (prompts === 0) {
        const ask = await page.locator(".dl-q").textContent();
        await page.click("[data-skip]");
        if (await page.locator(".dl-prompt").count()) note(`${at}: Skip it left the prompt up`);
        await page.click("[data-undo]");
        await page.locator("#up .dl-ans").nth(side).click();
        if (!(await page.locator(".dl-prompt").count()) || (await page.locator(".dl-q").textContent()) !== ask) note(`${at}: the same answer after Undo didn't ask the same thing`);
        else await page.locator(".dl-idea").first().click();
      } else {
        await roomy("with a prompt up");
        await page.fill(".dl-own input", "Old Maud");
        await page.click(".dl-own button");
        if (!(await page.locator("#board").textContent()).includes("Old Maud")) note(`${at}: her own words for a prompt aren't anywhere on the deck`);
      }
      prompts++;
      continue;
    }
    last = await says();
    side = n % 2;
    await page.locator("#up .dl-ans").nth(side).click();
  }
  if (prompts < 2) note(`${at}: only ${prompts} prompts came up`);
  if (await page.locator(".dl-prompt").count()) await page.click("[data-skip]");
  // Undo takes the last answer back and puts its card up again.
  const before = await lines();
  if (!before) note(`${at}: no lines of history after answering`);
  const lastLine = await page.locator(".dl-did p").textContent();
  if (!lastLine.trim()) note(`${at}: nothing says what the last answer did`);
  await page.click("[data-undo]");
  if ((await lines()) !== before - 1) note(`${at}: Undo left ${await lines()} lines of history, not ${before - 1}`);
  if (last && (await says()) !== last) note(`${at}: Undo didn't put the last card back up`);
  // The address has every answer, so a reload plays the same deck.
  const url = page.url();
  const shown = await lines();
  const up = await says();
  await page.reload();
  await page.waitForSelector("#up");
  if ((await lines()) !== shown || (await says()) !== up) note(`${at}: a reload didn't play the same deck back (${await lines()} lines, not ${shown})`);
  // A new deck, and Back brings this one back.
  await page.click("#deal");
  await page.waitForFunction((u) => location.href !== u, url);
  if (await lines()) note(`${at}: a new deck started with history`);
  await page.goBack();
  await page.waitForFunction((n) => document.querySelectorAll(".dl-hist li").length === n, shown, { timeout: 5000 }).catch(() => note(`${at}: Back didn't bring the last deck back`));
  // The rest at random, and the board at the end.
  await page.click("[data-rest]");
  await page.waitForSelector(".dl-end");
  if ((await page.locator(".dl-fac").count()) !== 6) note(`${at}: the end has ${await page.locator(".dl-fac").count()} factions, not 6`);
  if (await page.locator(".dl-tile").count()) note(`${at}: the tiles are still up at the end`);
  const checks = await page.locator(".dl-checks").textContent();
  if (/Still failing/.test(checks)) note(`${at}: the end's board fails its checks: ${checks}`);
  if ((await page.locator(".dl-who").count()) !== 2) note(`${at}: the end hasn't got the crew of 2`);
  if ((await page.locator(".dl-history h3").count()) !== 3) note(`${at}: How it came to be hasn't got all three ages`);
  await roomy("at the end");
  const names = await page.locator(".dl-fac h3").allTextContents();
  const told = await lines();
  await page.reload();
  await page.waitForSelector(".dl-end");
  if ((await lines()) !== told || (await page.locator(".dl-fac h3").allTextContents()).join("|") !== names.join("|")) note(`${at}: a reload at the end didn't deal the same board`);
  if (outside.length) note(`${at}: fetches from outside the site: ${[...new Set(outside)].slice(0, 3).join(", ")}`);
  if (errors.length) note(`${at}: console errors: ${errors.join(" | ")}`);
  console.log(`${at}: ${told} cards answered, ${prompts} prompts, Not this one, Undo, a reload, Back and the rest at random checked`);
  await context.close();
}

// A whole world on /worlds/ (stages 12 and 13 of notes/builder-plan.md): out
// of search and off phones, its line saying whose it is and both notices, the
// kinds and Find, a name opening its card, the web's tap, the map with a pin
// on every place opening its page and the web on it, the places and people
// with their districts and Find, and How it came to be by age, at 390 in
// light and 320 in dark.
{
  const sw = await readFile(join(DIST, "sw.js"), "utf8").catch(() => "");
  if (!sw) note("worlds: no sw.js in the build");
  else if (/\/worlds\//.test(sw)) note("worlds: the service worker keeps a /worlds/ page or file on phones");
  const context = await browser.newContext({ viewport: { width: 390, height: 860 } });
  await sealed(context);
  const page = await context.newPage();
  await page.goto(BASE + "/search/?q=Arasaka");
  await page.waitForSelector(".pagefind-ui__message", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  if (await page.locator(".pagefind-ui__result").count()) note("worlds: search finds Night City");
  await context.close();
}
for (const [width, scheme] of [[390, "light"], [320, "dark"]]) {
  const at = `worlds @${width} ${scheme}`;
  const context = await browser.newContext({ viewport: { width, height: 860 } });
  if (scheme === "light") await context.addInitScript(() => { try { localStorage.setItem("zi-theme", "light"); } catch (e) {} });
  await sealed(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/worlds/night-city/");
  if ((await page.getAttribute('meta[name="robots"]', "content")) !== "noindex") note(`${at}: not marked noindex`);
  if (!/CD Projekt/.test(await page.textContent(".wn-whose"))) note(`${at}: the line saying whose it is doesn't name CD Projekt`);
  const notices = await page.locator(".wn-foot p").allTextContents();
  if (!notices.some((n) => /Homebrew Content Policy of R\. Talsorian Games/.test(n)) || !notices.some((n) => /CD PROJEKT RED/.test(n))) note(`${at}: the notices at the foot aren't both there`);
  const cards = await page.locator("#wn-board .wn-f").count();
  // The gangs alone, then Find, then every one again.
  await page.click('.wn-kind[data-kind="gang"]');
  const gangs = await page.locator('#wn-board .wn-f:not([hidden])').evaluateAll((els) => els.map((e) => e.dataset.kind));
  if (!gangs.length || gangs.some((k) => k !== "gang")) note(`${at}: Gangs shows ${gangs.join(", ") || "nothing"}`);
  await page.click('.wn-kind[data-kind=""]');
  await page.fill("#wn-find", "arasaka");
  const found = await page.locator("#wn-board .wn-f:not([hidden])").count();
  if (!found || found === cards) note(`${at}: Find for arasaka shows ${found} of ${cards}`);
  await page.fill("#wn-find", "");
  // A name in an open card opens that faction's card.
  await page.click("#f-militech > summary");
  const link = page.locator("#f-militech .wn-fb a.wn-ln").first();
  const to = (await link.getAttribute("href"))?.slice(1);
  await link.click();
  const opened = to && (await page.waitForFunction((id) => { const d = document.getElementById(id); const top = d?.getBoundingClientRect().top; return d?.open && top >= 0 && top < innerHeight; }, to, { timeout: 3000 }).then(() => true, () => false));
  if (!opened) note(`${at}: a name in Militech's card didn't open ${to} in view`);
  // The web: a faction's ties, picked from the list, then walked to a
  // neighbour's with a tap.
  await page.click('.wn-bar [data-tab="board"]');
  await page.click('#wn-board [data-view="web"]');
  if (!(await page.locator("#wn-web-sec").isVisible())) note(`${at}: the web didn't show`);
  if (new URL(page.url()).searchParams.get("tab") !== "web") note(`${at}: the address doesn't say it's the web`);
  const pick = (await page.inputValue("#wn-focus")) === "maelstrom" ? "militech" : "maelstrom";
  await page.selectOption("#wn-focus", pick);
  const picked = await page.evaluate(() => [document.querySelector("#wn-panel .ww-h")?.textContent ?? "", document.querySelector("#wn-web .ww-node.is-sel")?.dataset.web ?? ""]);
  if (picked[0] !== { maelstrom: "Maelstrom", militech: "Militech" }[pick] || picked[1] !== pick) note(`${at}: picking ${pick} showed ${picked.join(" and ") || "nothing"}`);
  const next = await page.locator(`#wn-web [data-web]:not([data-web="${pick}"]):not([data-web="crew"])`).first().getAttribute("data-web");
  await page.click(`#wn-web [data-web="${next}"]`);
  if ((await page.inputValue("#wn-focus")) !== next) note(`${at}: tapping ${next} in the web didn't walk to its ties`);
  // The map: a pin for every place, a pin's card opening its page, and the
  // web on it with a faction's ties lit.
  await page.click('.wn-bar [data-tab="map"]');
  await page.waitForSelector(".wn-map .wm-stage", { timeout: 5000 }).catch(() => note(`${at}: the map didn't go into its viewer`));
  const places = await page.locator("#wn-places .wn-pg").count();
  const pins = await page.locator(".wn-map .wm-pin").count();
  if (!places || pins !== places) note(`${at}: the map has ${pins} pins for ${places} places`);
  const filled = await page.evaluate(() => { const r = document.querySelector(".wn-map .wm-stage")?.getBoundingClientRect(); return r && r.top > -2 && r.top < 40 && r.height > innerHeight * 0.6; });
  if (!filled) note(`${at}: the map doesn't fill the screen above the bar when it's opened`);
  await page.locator('.wm-pin[data-pin="the-afterlife"]').dispatchEvent("click");
  const card = await page.locator("#wn-mcard").textContent().catch(() => "");
  if (!/The Afterlife/.test(card ?? "") || !/sits? here/.test(card ?? "")) note(`${at}: the Afterlife's pin didn't bring up its card with who sits there (${(card ?? "").trim().slice(0, 80)})`);
  await page.click("#wn-mcard .wn-mc-go");
  const pageOpen = await page.waitForFunction(() => { const d = document.getElementById("p-the-afterlife"); return d?.open && !d.closest("[data-panel]").hidden; }, null, { timeout: 3000 }).then(() => true, () => false);
  if (!pageOpen) note(`${at}: the pin's Its page didn't open the Afterlife's page`);
  const said = await page.locator("#wn-msay").textContent().catch(() => "");
  if (!/^The Afterlife\. /.test(said ?? "")) note(`${at}: a screen reader isn't told what the pin opened (${(said ?? "").slice(0, 60)})`);
  // Back from the page is the map again, the way the address says.
  await page.goBack();
  const backOnMap = await page.waitForFunction(() => !document.getElementById("wn-map-sec")?.hidden && document.getElementById("wn-places")?.hidden && new URL(location.href).searchParams.get("tab") === "map", null, { timeout: 3000 }).then(() => true, () => false);
  if (!backOnMap) note(`${at}: Back from the Afterlife's page didn't bring the map back`);
  // From a faction's card: the map with the web on and its ties lit.
  await page.goto(BASE + "/worlds/night-city/#f-arasaka");
  await page.click('#f-arasaka [data-map-f="arasaka"]');
  await page.waitForSelector(".wn-map .wm-ft", { timeout: 5000 }).catch(() => {});
  const toks = await page.locator(".wn-map .wm-ft").count();
  if (toks !== cards) note(`${at}: the web on the map has ${toks} tokens for ${cards} factions`);
  const lit = await page.evaluate(() => [document.querySelector('.wm-ft.is-sel')?.dataset.tok ?? "", document.querySelectorAll(".wm-web-l path.wm-wl").length, document.querySelectorAll(".wm-ft.is-lit").length]);
  if (lit[0] !== "arasaka" || lit[1] < 3 || lit[2] < 3) note(`${at}: Arasaka on the map lit ${lit[0] || "nothing"} with ${lit[1]} threads and ${lit[2]} others`);
  if ((await page.getAttribute("#wn-webbtn", "aria-pressed")) !== "true") note(`${at}: the web's switch doesn't say it's on`);
  // Places and people: a district on its own, Find, and a name in a page
  // opening its page.
  await page.click('.wn-bar [data-tab="places"]');
  await page.click('#wn-places .wn-kind[data-area="pacifica"]');
  const pac = await page.locator("#wn-places .wn-pg:not([hidden])").evaluateAll((els) => els.map((e) => e.dataset.area));
  if (!pac.length || pac.some((k) => k !== "pacifica")) note(`${at}: Pacifica shows ${pac.join(", ") || "nothing"}`);
  await page.click('#wn-places .wn-kind[data-area=""]');
  await page.fill("#wn-places .wn-find input", "braindance");
  const bd = await page.locator("#wn-places .wn-pg:not([hidden])").evaluateAll((els) => els.map((e) => e.id));
  if (!bd.includes("p-lizzies-bar")) note(`${at}: Find for braindance in the places doesn't find Lizzie's Bar (${bd.join(", ")})`);
  await page.fill("#wn-places .wn-find input", "");
  await page.click("#p-lizzies-bar > summary");
  await page.click('#p-lizzies-bar a.wn-ln[href="#p-judy-alvarez"]');
  const judy = await page.waitForFunction(() => { const d = document.getElementById("p-judy-alvarez"); const top = d?.getBoundingClientRect().top; return d?.open && top >= 0 && top < innerHeight && !d.closest("[data-panel]").hidden; }, null, { timeout: 3000 }).then(() => true, () => false);
  if (!judy) note(`${at}: Judy's name on Lizzie's Bar didn't open her page`);
  await page.fill("#wn-people .wn-find input", "rogue");
  const rogue = await page.locator("#wn-people .wn-pg:not([hidden])").count();
  if (rogue < 1) note(`${at}: Find for rogue in the people finds nobody`);
  // How it came to be, by age.
  await page.click('.wn-bar [data-tab="history"]');
  const ages = await page.locator(".wn-age-h").allTextContents();
  if (ages.join("|") !== "Long ago|In living memory|This last year") note(`${at}: How it came to be's ages are ${ages.join(", ")}`);
  if (new URL(page.url()).searchParams.get("tab") !== "history") note(`${at}: the address doesn't keep the tab`);
  if (errors.length) note(`${at}: ${errors.join(" | ")}`);
  if (SHOTS && width === 390) for (const tab of ["board", "map", "places", "people", "history"]) {
    await page.click(`.wn-bar [data-tab="${tab}"]`);
    await page.screenshot({ path: join(SHOTS, `worlds-${tab}-${width}-${scheme}.png`) });
  }
  console.log(`${at}: ${cards} factions, ${places} places on the map, the kinds, Find, a name, the web, the map and its web, places, people and How it came to be checked`);
  await context.close();
}

// Abnu (stage 15 of notes/builder-plan.md), Mo's own setting: no line saying
// whose it is and no notices, out of search, and its board, the kinds and
// Find, a name opening its card, the web's tap, and How it came to be by age,
// at 390 in light and 320 in dark. It has no places, people or map till
// stage 16, so its bar has the factions and the history and nothing else.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 860 } });
  await sealed(context);
  const page = await context.newPage();
  // Anunnaki's all through Abnu and nowhere in the book (search for Xurux
  // turns up the X-Card).
  await page.goto(BASE + "/search/?q=Anunnaki");
  await page.waitForSelector(".pagefind-ui__message", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  if (await page.locator(".pagefind-ui__result").count()) note("worlds: search finds Abnu");
  await context.close();
}
for (const [width, scheme] of [[390, "light"], [320, "dark"]]) {
  const at = `abnu @${width} ${scheme}`;
  const context = await browser.newContext({ viewport: { width, height: 860 } });
  if (scheme === "light") await context.addInitScript(() => { try { localStorage.setItem("zi-theme", "light"); } catch (e) {} });
  await sealed(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/worlds/abnu/");
  if ((await page.getAttribute('meta[name="robots"]', "content")) !== "noindex") note(`${at}: not marked noindex`);
  if (await page.locator(".wn-whose").count()) note(`${at}: there's a line saying whose it is on a world of Mo's own`);
  if (await page.locator(".wn-foot").count()) note(`${at}: there are notices at the foot of a world of Mo's own`);
  const tabs = await page.locator(".wn-bar [data-tab]").evaluateAll((els) => els.map((e) => e.dataset.tab));
  if (tabs.join("|") !== "board|history") note(`${at}: the bar has ${tabs.join(", ")}, and Abnu has its factions and its history so far`);
  const cards = await page.locator("#wn-board .wn-f").count();
  // The east alone, then Find, then every one again.
  await page.click('.wn-kind[data-kind="east"]');
  const east = await page.locator("#wn-board .wn-f:not([hidden])").evaluateAll((els) => els.map((e) => e.dataset.kind));
  if (!east.length || east.some((k) => k !== "east")) note(`${at}: The east shows ${east.join(", ") || "nothing"}`);
  await page.click('.wn-kind[data-kind=""]');
  await page.fill("#wn-find", "xurux");
  const found = await page.locator("#wn-board .wn-f:not([hidden])").count();
  if (!found || found === cards) note(`${at}: Find for xurux shows ${found} of ${cards}`);
  await page.fill("#wn-find", "");
  // A name in an open card opens that faction's card.
  await page.click("#f-montia > summary");
  const link = page.locator("#f-montia .wn-fb a.wn-ln").first();
  const to = (await link.getAttribute("href"))?.slice(1);
  await link.click();
  const opened = to && (await page.waitForFunction((id) => { const d = document.getElementById(id); const top = d?.getBoundingClientRect().top; return d?.open && top >= 0 && top < innerHeight; }, to, { timeout: 3000 }).then(() => true, () => false));
  if (!opened) note(`${at}: a name in Montia's card didn't open ${to} in view`);
  // The web: a faction's ties, picked from the list, then walked to a
  // neighbour's with a tap.
  await page.click('.wn-bar [data-tab="board"]');
  await page.click('#wn-board [data-view="web"]');
  if (!(await page.locator("#wn-web-sec").isVisible())) note(`${at}: the web didn't show`);
  const pick = (await page.inputValue("#wn-focus")) === "soths" ? "montia" : "soths";
  await page.selectOption("#wn-focus", pick);
  const picked = await page.evaluate(() => [document.querySelector("#wn-panel .ww-h")?.textContent ?? "", document.querySelector("#wn-web .ww-node.is-sel")?.dataset.web ?? ""]);
  if (picked[0] !== { soths: "The Soths", montia: "Montia" }[pick] || picked[1] !== pick) note(`${at}: picking ${pick} showed ${picked.join(" and ") || "nothing"}`);
  const next = await page.locator(`#wn-web [data-web]:not([data-web="${pick}"]):not([data-web="crew"])`).first().getAttribute("data-web");
  await page.click(`#wn-web [data-web="${next}"]`);
  if ((await page.inputValue("#wn-focus")) !== next) note(`${at}: tapping ${next} in the web didn't walk to its ties`);
  // How it came to be, by age.
  await page.click('.wn-bar [data-tab="history"]');
  const ages = await page.locator(".wn-age-h").allTextContents();
  if (ages.join("|") !== "Long ago|In living memory|This last year") note(`${at}: How it came to be's ages are ${ages.join(", ")}`);
  if (new URL(page.url()).searchParams.get("tab") !== "history") note(`${at}: the address doesn't keep the tab`);
  if (errors.length) note(`${at}: ${errors.join(" | ")}`);
  if (SHOTS && width === 390) for (const tab of ["board", "history"]) {
    await page.click(`.wn-bar [data-tab="${tab}"]`);
    await page.screenshot({ path: join(SHOTS, `worlds-abnu-${tab}-${width}-${scheme}.png`) });
  }
  console.log(`${at}: ${cards} factions, no line or notices, the kinds, Find, a name, the web and How it came to be checked`);
  await context.close();
}

await browser.close();
server.close();
console.log(problems.length ? `\n${problems.length} problems` : "\nAll checks passed");
process.exitCode = problems.length ? 1 : 0;
