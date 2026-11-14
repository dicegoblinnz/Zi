// Plays the site the way people come to it, on a phone held in one hand (390
// by 844), and counts what each job takes from the home page: the taps, how
// far down the page each tap was, and whether the first one was on the first
// screen. Two people: someone new with nothing on their phone, and a player
// who's back, signed in, with two characters and two campaigns on the phone
// (one they play in, one they run).
//
//   npm run build && node tests/check-journeys.mjs [results.json] [screenshot-folder]
//
// It finds its way the way a person would, by what's on the screen: a link or
// a button that does the job if there's one, otherwise the place that has it
// (Characters, Campaigns or Rules), taking the one nearest the top, and the
// place that has it when that's on the first screen and the job's own link is
// more than a screen further down. So it plays any version of the site the
// same way, and two runs can be compared (ZI_DIST=<folder> plays another
// build, like main's, for the before and after). It also
// reads the home page's words for the rules words the book's retired
// (tools/check_terms.py), and fails if a job can't be done or the home page
// teaches a retired rule.
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const DIST = process.env.ZI_DIST || join(process.cwd(), "dist");
const OUT = process.argv[2] || null;
const SHOTS = process.argv[3] || null;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain", ".pdf": "application/pdf", ".woff2": "font/woff2", ".woff": "font/woff" };
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
    return res.end(await readFile(join(DIST, "404.html")).catch(() => "Not found"));
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

// ------------------------------------------------------------ the two people

const SAM = { id: "check-sam", name: "Sam", role: "member" };
const CAMPS = [
  { id: "check-tue", name: "Tuesday Lair", gm: "Mo", role: "player", players: 4, character: { id: "check-vesk", name: "Vesk" } },
  { id: "check-thu", name: "Thursday Lair", gm: "Sam", role: "gm", players: 3, character: null },
];
const PEOPLE = {
  new: { store: {}, api: { "/api/me": { user: null, providers: ["google", "discord"] } } },
  back: {
    store: {
      "zi-characters": { v: 1, characters: [{ id: "check-vesk", crew: "vesk", name: "Vesk", hash: "", state: {} }, { id: "check-bram", crew: "bram", name: "Bram", hash: "", state: {} }] },
      "zi-account": SAM,
      "zi-campaigns": { user: SAM.id, list: CAMPS, at: 0, camps: {} },
    },
    api: { "/api/me": { user: SAM, providers: ["google", "discord"] }, "/api/campaigns": { campaigns: CAMPS }, "/api/characters": { me: SAM, characters: [] } },
  },
};

// ------------------------------------------------------------ the jobs
// go: what does the job, or the next step of it. via: where to look for it
// when it isn't on this screen, in the order a person would try them.
const url = (page) => new URL(page.url());
const CREW = "vesk|bram|dorrie|isolde|wren|ash";
const JOBS = [
  { who: "new", id: "make", job: "Make a character", done: (p) => url(p).searchParams.has("build"),
    go: [{ href: /[?&]build\b/ }], via: [{ text: /^characters$/i }] },
  { who: "new", id: "crew", job: "Play one of the crew tonight", done: (p) => new RegExp(`[?&]c=(${CREW})-`).test(url(p).search),
    go: [{ text: /^start playing$/i }, { href: /[?&]play=/ }, { text: new RegExp(`^play (${CREW})$`, "i") }], via: [{ text: /^characters$/i }] },
  { who: "new", id: "learn", job: "Learn how to play", done: (p) => url(p).pathname === "/learn/" || url(p).searchParams.has("learn"),
    go: [{ href: /^\/learn\/$/ }, { href: /[?&]learn\b/ }], via: [{ text: /^characters$/i }] },
  { who: "new", id: "rules", job: "Read the rules", done: (p) => url(p).pathname.startsWith("/rules/"),
    go: [{ href: /^\/rules\// }], via: [] },
  { who: "new", id: "changes", job: "See what's changed in the rules", done: (p) => url(p).pathname === "/changes/",
    go: [{ href: /^\/changes\/(#.*)?$/ }], via: [{ text: /^rules$/i }] },
  { who: "new", id: "search", job: "Search the rules", done: (p) => url(p).pathname === "/search/",
    go: [{ href: /^\/search\/$/ }], via: [] },
  { who: "new", id: "campaigns", job: "Find out how to start a campaign", done: async (p) => (await p.locator("main h1, main h2").filter({ hasText: /^\s*campaigns\s*$/i, visible: true }).count()) > 0,
    go: [{ href: /[?&]camps\b/ }], via: [{ text: /^campaigns$/i }, { text: /^characters$/i }] },
  { who: "back", id: "mine", job: "Open my character", done: (p) => url(p).searchParams.get("c") === "check-vesk",
    go: [{ href: /[?&]c=check-vesk\b/ }], via: [{ text: /^characters$/i }] },
  { who: "back", id: "camp", job: "Open the campaign I play in", done: (p) => url(p).searchParams.get("camp") === "check-tue",
    go: [{ href: /[?&]camp=check-tue\b/ }], via: [{ text: /^campaigns$/i }, { text: /^characters$/i }] },
  { who: "back", id: "gm", job: "Open the campaign I run", done: (p) => url(p).searchParams.get("camp") === "check-thu",
    go: [{ href: /[?&]camp=check-thu\b/ }], via: [{ text: /^campaigns$/i }, { text: /^characters$/i }] },
  { who: "back", id: "another", job: "Make another character", done: (p) => url(p).searchParams.has("build"),
    go: [{ href: /[?&]build\b/ }], via: [{ text: /^characters$/i }] },
  { who: "back", id: "dice", job: "Roll some dice", done: async (p) => (await p.locator("dialog[open] .dz-add").count()) > 0,
    go: [{ text: /^(roll some dice|dice roller)$/i }], via: [{ text: /^characters$/i }] },
];
const matches = (m, e) => (!m.text || m.text.test(e.text)) && (!m.href || (e.href != null && m.href.test(e.href)));

// Everything on the screen that can be tapped, with where it sits on the page
// from the top (inside a dialog if one's open, since that's all you can tap).
async function tappable(page) {
  return page.evaluate(() => {
    scrollTo(0, 0);
    for (const el of document.querySelectorAll("[data-jj]")) el.removeAttribute("data-jj");
    const modal = document.querySelector("dialog:modal") || document.querySelector("dialog[open]");
    const root = modal || document;
    const out = [];
    let j = 0;
    for (const el of root.querySelectorAll('a[href], button, summary, [role="button"]')) {
      if (el.closest("[inert], [aria-hidden='true']") || el.disabled) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))) continue;
      const a = el.getAttribute("href");
      let href = null;
      if (a != null) {
        const u = new URL(a, location.href);
        href = u.origin === location.origin ? u.pathname + u.search + (u.hash && u.pathname + u.search !== location.pathname + location.search ? u.hash : "") : u.href;
      }
      el.setAttribute("data-jj", String(j));
      out.push({ j: j++, text: (el.getAttribute("aria-label") || el.innerText || "").trim().replace(/\s+/g, " "), href, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) });
    }
    return out;
  });
}

const isDone = (page, job) => Promise.resolve().then(() => job.done(page)).catch(() => false);
async function settle(page, job) {
  await page.waitForLoadState("load").catch(() => {});
  for (let t = 0; t < 30; t++) {
    if (await isDone(page, job)) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

async function play(browser, job) {
  const who = PEOPLE[job.who];
  const context = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: "block" });
  await context.addInitScript((store) => {
    try {
      for (const [k, v] of Object.entries(store)) if (localStorage.getItem(k) == null) localStorage.setItem(k, JSON.stringify(k === "zi-campaigns" ? { ...v, at: Date.now() } : v));
    } catch (e) {}
  }, who.store);
  await context.route((u) => u.hostname !== "localhost", (r) => r.abort());
  await context.route((u) => u.pathname.startsWith("/api/"), (r) => {
    const body = who.api[new URL(r.request().url()).pathname];
    return r.fulfill(body ? { status: 200, contentType: "application/json", body: JSON.stringify(body) } : { status: 503, contentType: "application/json", body: "{}" });
  });
  const page = await context.newPage();
  await page.goto(BASE + "/");
  await page.waitForSelector("main");
  const steps = [];
  const tried = new Set();
  let ok = await isDone(page, job);
  for (let n = 0; n < 5 && !ok; n++) {
    const here = url(page).pathname + url(page).search;
    const all = await tappable(page);
    const near = (list) => list.sort((a, b) => a.top - b.top)[0];
    let pick = near(all.filter((e) => job.go.some((m) => matches(m, e))));
    const hub = () => {
      for (const m of job.via) {
        const h = near(all.filter((e) => matches(m, e) && !tried.has(e.href ?? e.text)));
        if (h) return h;
      }
      return null;
    };
    if (!pick) pick = hub();
    else if (pick.bottom > 2 * H) {
      const h = hub();
      if (h && h.bottom <= H) pick = h;
    }
    if (!pick) {
      steps.push({ stuck: here });
      break;
    }
    tried.add(pick.href ?? pick.text);
    steps.push({ on: here, tap: pick.text.slice(0, 48), down: Math.max(0, pick.bottom - H), first: pick.bottom <= H });
    await page.locator(`[data-jj="${pick.j}"]`).first().click({ timeout: 8000 });
    ok = await settle(page, job);
  }
  await context.close();
  const taps = steps.filter((s) => s.tap);
  return { who: job.who, id: job.id, job: job.job, ok, taps: taps.length, scrolled: taps.reduce((n, s) => n + s.down, 0), firstScreen: Boolean(taps[0]?.first), steps };
}

// ------------------------------------------------------------ the home page itself

async function home(browser, whoKey) {
  const who = PEOPLE[whoKey];
  const context = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: "block" });
  await context.addInitScript((store) => {
    try {
      for (const [k, v] of Object.entries(store)) if (localStorage.getItem(k) == null) localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }, who.store);
  await context.route((u) => u.hostname !== "localhost", (r) => r.abort());
  await context.route((u) => u.pathname.startsWith("/api/"), (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const page = await context.newPage();
  let bytes = 0;
  page.on("response", async (r) => {
    try { bytes += (await r.body()).length; } catch {}
  });
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForSelector("main");
  await page.waitForTimeout(200);
  const seen = await page.evaluate((H) => {
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.width && r.height && r.top < H && r.bottom > 0 && (!el.checkVisibility || el.checkVisibility());
    };
    const text = (el) => (el.getAttribute("aria-label") || el.innerText || "").trim().replace(/\s+/g, " ");
    return {
      height: document.documentElement.scrollHeight,
      headings: [...document.querySelectorAll("main h1, main h2, main h3")].filter(inView).map(text),
      actions: [...document.querySelectorAll("main a[href], main button")].filter(inView).map(text).filter(Boolean),
      words: document.querySelector("main").innerText,
    };
  }, H);
  if (SHOTS) {
    await page.screenshot({ path: join(SHOTS, `home-${whoKey}.png`) });
    await page.screenshot({ path: join(SHOTS, `home-${whoKey}-whole.png`), fullPage: true });
  }
  await context.close();
  return { who: whoKey, height: seen.height, firstScreen: { headings: seen.headings, actions: seen.actions }, kb: Math.round(bytes / 1024), words: seen.words };
}

// ------------------------------------------------------------ run it

if (SHOTS) await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const problems = [];
const homes = [];
for (const who of Object.keys(PEOPLE)) homes.push(await home(browser, who));
const jobs = [];
for (const job of JOBS) jobs.push(await play(browser, job));
await browser.close();
server.close();

// The home page's words against the book's retired rules words.
const file = join(tmpdir(), "zi-home-words.md");
await writeFile(file, homes[0].words);
const said = execFileSync("python3", ["-I", "tools/check_terms.py", file], { encoding: "utf8" });
const retired = said.split("\n").filter((l) => /^\s+\d+ \[/.test(l)).map((l) => l.trim().replace(/^\d+ /, "").slice(0, 120));

for (const h of homes) {
  console.log(`\nHome, ${h.who === "new" ? "someone new" : "a player who's back"}: ${h.height}px long at ${W} wide, ${h.kb} KB to open`);
  console.log(`  first screen: ${h.firstScreen.headings.join(" / ") || "no headings"}`);
  console.log(`  to tap there: ${h.firstScreen.actions.join(" · ") || "nothing"}`);
}
console.log("");
for (const r of jobs) {
  const how = r.steps.map((s) => (s.stuck ? `stuck on ${s.stuck}` : `${s.tap}${s.down ? ` (${s.down}px down)` : ""}`)).join(" → ");
  console.log(`${r.ok ? "✓" : "✗"} ${r.who === "new" ? "new " : "back"}  ${r.job.padEnd(34)} ${String(r.taps).padStart(1)} tap${r.taps === 1 ? " " : "s"}  ${String(r.scrolled).padStart(5)}px scrolled  ${r.firstScreen ? "starts on the first screen" : "starts further down"}  ${how}`);
  if (!r.ok) problems.push(`${r.job}: couldn't be done from the home page (${how})`);
}
if (retired.length) {
  console.log(`\nThe home page uses words the rules have retired:\n${retired.map((l) => "  " + l).join("\n")}`);
  problems.push(`the home page uses ${retired.length} retired rules word${retired.length === 1 ? "" : "s"}`);
} else console.log("\nThe home page uses none of the rules words the book's retired.");
if (OUT) await writeFile(OUT, JSON.stringify({ homes: homes.map(({ words, ...h }) => h), jobs, retired }, null, 2));
if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.map((p) => "  ✗ " + p).join("\n")}`);
  process.exit(1);
}
console.log("\nEvery job can be done from the home page.");
