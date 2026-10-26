// Check sign-in, accounts and campaigns (stages 6 and 7) the way players and
// GMs will use them.
//
//   npm run build && node tests/check-accounts.mjs
//   SHOTS=folder node tests/check-accounts.mjs   (and screenshots of the campaign screens)
//
// The site's Worker runs here in workerd (Miniflare) with its own D1, built the
// way a deploy builds it, with every migration applied in order. Google and
// Discord are stood in for: the browser's trip to them comes straight back
// with a code, and the Worker's calls to them get a made-up person.
//
// 1. Anyone can sign up. Mo signs in with Google and he's the admin (he's
//    ADMIN_EMAIL), and a stranger with Discord and Sam with Google get accounts
//    with no invite.
// 2. Kai has Vesk and Wren on her phone, signs in with Discord, and moves them
//    into her account with one tap.
// 3. A second device: Kai signs in there, and both characters are waiting. A
//    note written on one phone reaches the other, Wren deleted on one goes from
//    both, and a change made offline goes up when the signal's back.
// 4. Campaigns. Mo starts Tuesday Lair from the Characters page and gets its
//    link. Kai opens it and joins with Vesk. Lee, with no account, opens it,
//    signs in and joins with Bram, made from the crew on the way. Mo sees both
//    characters and opens Vesk's sheet, and Kai sees names only. Mo resets the
//    link and the old one's refused, then takes Lee out. Kai runs a campaign of
//    her own and plays Dorrie in Zed's, so she switches between three in a
//    tap, with a different character in each one she plays in. Nothing
//    crosses between them: Zed gets nothing from Tuesday Lair, and Mo nothing
//    from Kai's.
// 5. The party sheet and threads. Sam joins Tuesday Lair with Bram. It starts
//    as a new crew, from the book, and Vesk gets a Party tab. Kai writes the
//    Goal and climbs it, and Mo's phone catches up on its own. Mo puts Muscle
//    on and Power's a d6 on Kai's phone. Sam, with no signal, adds a holding
//    and climbs the Goal while Kai climbs it too, and both count once he's
//    back. A project climbs from another phone, and everyone's Aspiration is
//    there. Kai strains Vesk's thread with Bram and it's strained on Sam's
//    Bram, Sam mends it on his, and two strains that cross snap it. A thread
//    only on Vesk's sheet shows on Bram's in her words. Mo's look has the
//    thread where the campaign has it. Nothing crosses: Vesk's thread with
//    Kai's Dorrie, in Zed's Night, stays put, and Zed gets nothing. The party
//    sheet passes axe at 390, in both themes, with the Goal in the first screen.
// 6. Who can do what: only Mo sees people, a player can't reset a link, rename,
//    end a campaign or take anyone out, a signed-out request gets nothing
//    private, and the join check's rate limit trips.
// 7. Signing out takes the account's characters off the phone and leaves the
//    phone's own. Kai downloads her data, then deletes her account: it's gone
//    from the database, her campaign ends and she's out of Mo's. The account
//    page passes axe at 320 wide, and the campaign screens at 390, in both
//    themes.
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
// Miniflare 5 takes v4-style options through its converter.
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const problems = [];
const note = (p) => {
  problems.push(p);
  console.log(`  ✗ ${p}`);
};
const same = (got, want, what) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) note(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const yes = (ok, what) => {
  if (!ok) note(what);
};

const PORT = 4175;
const BASE = `http://localhost:${PORT}`;
const ADMIN = "mo@example.com";
const SHOTS = process.env.SHOTS || "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// The Worker, bundled exactly as `wrangler deploy` would.
// It goes under .wrangler/, which git ignores, since workerd only loads modules
// from inside the folder it starts in.
const out = join(".wrangler", "check-accounts");
execFileSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", out], { stdio: "ignore" });

// The people Google and Discord vouch for, by the code their trip comes back with.
const PEOPLE = {
  mo: { email: ADMIN, name: "Mo" },
  kai: { email: "kai@example.com", name: "Kai Tane" },
  stranger: { email: "stranger@example.com", name: "Stranger" },
  sam: { email: "sam@example.com", name: "Sam" },
  zed: { email: "zed@example.com", name: "Zed" },
  lee: { email: "lee@example.com", name: "Lee" },
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
async function provider(request) {
  const url = new URL(request.url);
  if (process.env.DEBUG) console.log("outbound", request.method, request.url, request.headers.get("authorization"));
  const form = request.method === "POST" ? new URLSearchParams(await request.text()) : null;
  const who = (form?.get("code") || request.headers.get("authorization")?.split("-").pop() || "").replace(/^Bearer /, "");
  const p = PEOPLE[who];
  if (!p) return new Response("{}", { status: 400 });
  if (url.host === "oauth2.googleapis.com") {
    const idToken = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: "https://accounts.google.com", sub: `g-${who}`, email: p.email, email_verified: true, name: p.name, picture: "https://example.com/p.png", aud: "google-id", exp: Math.floor(Date.now() / 1000) + 3600 })}.x`;
    return Response.json({ access_token: `g-${who}`, id_token: idToken, expires_in: 3600, token_type: "Bearer", scope: "openid email profile" });
  }
  if (url.host === "discord.com" && url.pathname.endsWith("/oauth2/token")) return Response.json({ access_token: `d-${who}`, token_type: "Bearer", expires_in: 3600, scope: "identify email" });
  if (url.host === "discord.com" && decodeURIComponent(url.pathname).endsWith("/users/@me")) return Response.json({ id: String(100000 + Object.keys(PEOPLE).indexOf(who)), username: who, global_name: p.name, email: p.email, verified: true, avatar: null, discriminator: "0" });
  return new Response("not here", { status: 404 });
}

const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true,
  scriptPath: join(out, "index.js"),
  compatibilityDate: "2026-10-13",
  compatibilityFlags: ["nodejs_compat"],
  d1Databases: { DB: "zi-check" },
  bindings: {
    AUTH_HOSTS: `localhost:${PORT}`,
    BETTER_AUTH_SECRET: "check-secret-check-secret-check-secret-0123",
    GOOGLE_CLIENT_ID: "google-id", GOOGLE_CLIENT_SECRET: "google-secret",
    DISCORD_CLIENT_ID: "discord-id", DISCORD_CLIENT_SECRET: "discord-secret",
    ADMIN_EMAIL: ADMIN,
  },
  outboundService: provider,
}));
const db = await mf.getD1Database("DB");
// Every migration, in order, the way `wrangler d1 migrations apply` runs them.
for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join("migrations", file), "utf8").split("\n").filter((l) => !l.startsWith("--")).join("\n");
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) await db.prepare(statement).run();
}
const rows = async (q, ...args) => (await db.prepare(q).bind(...args).all()).results;

// The site, served like Cloudflare does: files from dist/, /api/ to the Worker.
const DIST = join(process.cwd(), "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf" };
async function file(path) {
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
  if (req.url.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    const answer = await mf.dispatchFetch(`${BASE}${req.url}`, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, redirect: "manual" });
    const outHeaders = {};
    answer.headers.forEach((v, k) => { if (k !== "set-cookie") outHeaders[k] = v; });
    const cookies = answer.headers.getSetCookie();
    if (cookies.length) outHeaders["set-cookie"] = cookies;
    res.writeHead(answer.status, outHeaders);
    return res.end(Buffer.from(await answer.arrayBuffer()));
  }
  const full = await file(req.url);
  if (!full) {
    res.writeHead(404, { "content-type": TYPES[".html"] });
    return res.end(await readFile(join(DIST, "404.html")));
  }
  res.writeHead(200, { "content-type": TYPES[extname(full)] || "application/octet-stream" });
  res.end(await readFile(full));
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
// A phone. Its trip to Google or Discord comes straight back as whoever's set.
// Each one has its own address, the way Cloudflare tells the Worker.
let phones = 0;
async function phone(saved) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: "block", extraHTTPHeaders: { "cf-connecting-ip": `203.0.113.${++phones}` } });
  context.who = "";
  await context.route(/^https:\/\/(accounts\.google\.com|discord\.com)\//, (route) => {
    const u = new URL(route.request().url());
    const back = new URL(u.searchParams.get("redirect_uri"));
    back.searchParams.set("code", context.who);
    back.searchParams.set("state", u.searchParams.get("state"));
    return route.fulfill({ status: 302, headers: { location: back.toString() } });
  });
  if (saved) await context.addInitScript((s) => { try { if (!localStorage.getItem("zi-characters")) localStorage.setItem("zi-characters", s); } catch (e) {} }, JSON.stringify({ v: 1, characters: saved }));
  const page = await context.newPage();
  page.on("pageerror", (e) => note(`page error: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  return { context, page };
}
const settled = (page) => page.waitForFunction(() => !/Checking whether/.test(document.querySelector("#acct .lede")?.textContent || ""));
const text = (page, sel = "#acct") => page.textContent(sel);
const api = (page, method, path, body) => page.evaluate(async ([m, p, b]) => {
  const res = await fetch(p, { method: m, headers: b ? { "content-type": "application/json" } : {}, body: b ? JSON.stringify(b) : undefined });
  return { status: res.status, body: await res.text() };
}, [method, path, body]);
const got = async (page, method, path, body) => {
  const r = await api(page, method, path, body);
  try {
    return { ...r, json: JSON.parse(r.body) };
  } catch {
    return { ...r, json: null };
  }
};
// The Sheet tab's parts are folds that read at a glance: open one before
// typing or tapping in it.
async function fold(page, key) {
  const sel = `details[data-open="sh-${key}"]`;
  await page.waitForSelector(sel, { state: "attached" });
  if (!(await page.$eval(sel, (d) => d.open))) await page.click(`${sel} > summary`);
}
// Sign in from the account page. It starts with ?go in the address, so coming
// back to /account/ is a change.
async function signIn(page, who, how, start = "/account/?go") {
  page.context().who = who;
  await page.goto(BASE + start);
  await settled(page);
  await Promise.all([
    page.waitForURL((u) => u.pathname === "/account/" && (u.search === "" || u.searchParams.has("error"))),
    page.click(`[data-act="in"][data-p="${how}"]`),
  ]);
  await settled(page);
}
const user = async (email) => (await rows('SELECT id, role FROM "user" WHERE email = ?1', email))[0] ?? null;
const serverChars = async (email) => rows('SELECT c.id, c.data FROM character c JOIN "user" u ON u.id = c.userId WHERE u.email = ?1 AND c.data IS NOT NULL ORDER BY c.id', email);
const until = async (fn, what, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  note(`timed out waiting for ${what}`);
  return false;
};
// A character put straight into an account, for someone joining by the API.
const crewChar = (id, crew, name) => ({ v: 0, data: { id, crew, name, made: new Date().toISOString(), hash: "", state: {} } });
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) });
};
// The same screen in both themes, for a look at how it reads in each.
const shots = async (page, name, sel) => {
  if (!SHOTS) return;
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await page.reload();
    await page.waitForSelector(sel);
    await page.waitForTimeout(300);
    await shot(page, `${name}-${theme}`);
  }
  await page.evaluate(() => localStorage.setItem("zi-theme", "dark"));
  await page.reload();
  await page.waitForSelector(sel);
};
// axe, no sideways scroll and 44px tap targets.
const axe = async (page, what) => {
  const result = await new AxeBuilder({ page }).include("main").analyze();
  for (const v of result.violations) note(`axe (${what}): ${v.id}: ${v.help} (${v.nodes[0]?.target?.join(" ")})`);
  same(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no sideways scroll (${what})`);
  const small = await page.evaluate(() => [...document.querySelectorAll("#app .button, #app .cc-back, #app .cc-theme, #app .cc-strip-a, #app summary, #app .cc-pick, #app .cc-perm, #app .cc-ringbtn, #cc-dialog .button")]
    .filter((el) => el.getClientRects().length)
    .map((el) => ({ t: el.textContent.trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
    .filter((x) => x.h < 44));
  if (small.length) note(`small tap targets (${what}): ${small.slice(0, 4).map((x) => `${x.t} (${x.h}px)`).join(", ")}`);
};

try {
  // ------------------------------------------------------------ 1. anyone signs up
  console.log("1. Anyone signs up");
  const mo = await phone();
  await signIn(mo.page, "mo", "google");
  yes((await text(mo.page)).includes("Signed in as Mo"), "Mo is signed in");
  same((await user(ADMIN))?.role, "admin", "Mo's role");
  yes((await rows("SELECT image FROM \"user\" WHERE email = ?1", ADMIN))[0]?.image == null, "no picture kept");
  same((await rows("SELECT accessToken, idToken, refreshToken FROM account"))[0], { accessToken: null, idToken: null, refreshToken: null }, "no provider tokens kept");
  same((await rows("SELECT ipAddress, userAgent FROM session"))[0], { ipAddress: null, userAgent: null }, "sessions don't keep where they're from");

  const stranger = await phone();
  await signIn(stranger.page, "stranger", "discord");
  yes((await text(stranger.page)).includes("Signed in as Stranger"), "a stranger signs up with Discord, no invite");
  same((await user("stranger@example.com"))?.role, "member", "and they're a member");
  const sam = await phone();
  await signIn(sam.page, "sam", "google");
  same((await user("sam@example.com"))?.role, "member", "Sam signs up with Google, no invite");

  // ------------------------------------------------------------ 2. Kai and the move
  console.log("2. Kai signs up and moves her characters in");
  const made = new Date().toISOString();
  const kai = await phone([
    { id: "vesk-aaaaaa", crew: "vesk", name: "Vesk", made, hash: "", state: {} },
    { id: "wren-bbbbbb", crew: "wren", name: "Wren", made, hash: "", state: {} },
  ]);
  await signIn(kai.page, "kai", "discord");
  yes((await text(kai.page)).includes("Signed in as Kai"), "Kai signs up with Discord");
  same((await user("kai@example.com"))?.role, "member", "Kai's a member");
  yes((await text(kai.page)).includes("These 2 are only on this phone: Vesk, Wren"), "the move's offered");
  await kai.page.click('[data-act="move"]');
  await until(async () => (await serverChars("kai@example.com")).length === 2, "both characters in Kai's account");
  yes((await text(kai.page)).includes("2 characters are in your account"), "the page says they're in");

  // ------------------------------------------------------------ 3. a second device
  console.log("3. A second device");
  const two = await phone();
  await signIn(two.page, "kai", "discord");
  await until(async () => (await text(two.page)).includes("2 characters are in your account"), "both characters reaching the second device");
  await two.page.goto(`${BASE}/characters/`);
  await two.page.waitForSelector(".cc-saved");
  same(await two.page.$$eval("#app .cc-sec:not(#cc-camps) .cc-saved b", (els) => els.map((e) => e.textContent).sort()), ["Vesk", "Wren"], "the list on the second device");
  yes((await text(two.page, "#app")).includes("Signed in as Kai"), "the Characters page says who's signed in");
  await two.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await fold(two.page, "notes");
  await two.page.fill("#cc-notes", "Owes Bram a favour");
  await until(async () => (await serverChars("kai@example.com")).some((c) => JSON.parse(c.data).state?.notes === "Owes Bram a favour"), "the note going up");
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await until(() => kai.page.inputValue("#cc-notes").then((v) => v === "Owes Bram a favour"), "the note reaching the first phone");
  await two.page.goto(`${BASE}/characters/?c=wren-bbbbbb&t=sheet`);
  await fold(two.page, "about");
  await two.page.click('[data-act="delete"]');
  await until(async () => (await serverChars("kai@example.com")).length === 1, "Wren going from the account");
  await kai.page.goto(`${BASE}/characters/`);
  await until(() => kai.page.$$eval("#app .cc-sec:not(#cc-camps) .cc-saved b", (els) => els.map((e) => e.textContent).join()).then((t) => t === "Vesk"), "Wren going from the first phone");
  // Offline on the first phone, then the signal's back.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await kai.context.setOffline(true);
  await fold(kai.page, "notes");
  await kai.page.fill("#cc-notes", "Owes Bram two favours");
  await kai.page.waitForTimeout(1500);
  await kai.context.setOffline(false);
  await until(async () => (await serverChars("kai@example.com")).some((c) => JSON.parse(c.data).state?.notes === "Owes Bram two favours"), "the offline change going up");
  // A character deleted offline stays deleted when the signal's back.
  const kaiId = (await user("kai@example.com")).id;
  await kai.page.evaluate((acct) => {
    const data = JSON.parse(localStorage.getItem("zi-characters"));
    data.characters.push({ id: "dorrie-dddddd", crew: "dorrie", name: "Dorrie", made: new Date().toISOString(), hash: "", state: {}, acct });
    localStorage.setItem("zi-characters", JSON.stringify(data));
  }, kaiId);
  await kai.page.goto(`${BASE}/characters/`);
  await until(async () => (await serverChars("kai@example.com")).some((c) => c.id === "dorrie-dddddd"), "Dorrie going up");
  await kai.page.goto(`${BASE}/characters/?c=dorrie-dddddd&t=sheet`);
  await fold(kai.page, "about");
  await kai.context.setOffline(true);
  await kai.page.click('[data-act="delete"]');
  await kai.page.waitForTimeout(1200);
  await kai.context.setOffline(false);
  await until(async () => !(await serverChars("kai@example.com")).some((c) => c.id === "dorrie-dddddd"), "the offline delete going up");
  await kai.page.goto(`${BASE}/characters/`);
  await kai.page.waitForTimeout(1500);
  same(await kai.page.$$eval("#app .cc-sec:not(#cc-camps) .cc-saved b", (els) => els.map((e) => e.textContent)), ["Vesk"], "Dorrie doesn't come back");

  // ------------------------------------------------------------ 4. campaigns
  console.log("4. Campaigns");
  const moId = (await user(ADMIN)).id;
  // Mo starts one from the Characters page.
  await mo.page.goto(`${BASE}/characters/`);
  await mo.page.waitForSelector('#cc-camps [data-do="start"]');
  await mo.page.click('#cc-camps [data-do="start"]');
  await mo.page.fill("#k-name", "  Tuesday   Lair ");
  await Promise.all([mo.page.waitForURL(/[?&]camp=/), mo.page.click('#cc-dialog button[type="submit"]')]);
  await mo.page.waitForSelector("#k-link");
  same(await mo.page.textContent("#app h1"), "Tuesday Lair", "the campaign's name, tidied");
  yes((await text(mo.page, "#app")).includes("You’re the GM"), "Mo's told he's the GM");
  const link = await mo.page.inputValue("#k-link");
  const code = new URL(link).hash.slice(1);
  yes(new URL(link).pathname === "/join/" && /^[A-Za-z0-9_-]{16}$/.test(code), `a join link with a long code (${link})`);
  const tuesday = (await rows("SELECT id, gmId, code FROM campaign WHERE name = 'Tuesday Lair'"))[0];
  same([tuesday?.gmId, tuesday?.code], [moId, code], "Mo's its GM, and its code is the link's");
  same((await got(mo.page, "POST", "/api/campaigns", { name: "tuesday lair" })).status, 400, "Mo can't have two called the same");
  await shot(mo.page, "campaign-new-gm");

  // Kai opens the link and joins with Vesk.
  await kai.page.goto(link);
  await kai.page.waitForSelector('input[name="k-pick"]');
  same(await kai.page.textContent("#app h1"), "Tuesday Lair", "the link says which campaign it's for");
  yes((await text(kai.page, "#app")).includes("Run by Mo"), "and who's the GM");
  yes(!(await kai.page.url()).includes(code), "the code's gone from the address");
  same(await kai.page.isDisabled(".cc-joinbar button[type=submit]"), true, "nothing's picked yet, so there's no joining");
  await kai.page.click('label.cc-pick:has(input[value="vesk-aaaaaa"])');
  same((await kai.page.textContent(".cc-joinbar button[type=submit]")).trim(), "Join with Vesk", "the button says who's going");
  await shot(kai.page, "join-pick");
  await Promise.all([kai.page.waitForURL(/[?&]camp=/), kai.page.click(".cc-joinbar button[type=submit]")]);
  await kai.page.waitForSelector(".cc-names");
  same((await rows("SELECT characterId FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, kaiId))[0]?.characterId, "vesk-aaaaaa", "Kai's in Tuesday Lair with Vesk");
  yes((await text(kai.page, "#app")).includes("Playing Vesk"), "Kai's page says she's playing Vesk");

  // Lee has no account. He opens the link, signs in, and brings Bram from the crew.
  const lee = await phone();
  lee.context.who = "lee";
  await lee.page.goto(link);
  await lee.page.waitForSelector('#app [data-do="in"][data-p="google"]');
  same(await lee.page.textContent("#app h1"), "Tuesday Lair", "signed out, the link still says which campaign");
  await shot(lee.page, "join-signed-out");
  await Promise.all([lee.page.waitForURL((u) => u.pathname === "/characters/" && u.search.startsWith("?join")), lee.page.click('#app [data-do="in"][data-p="google"]')]);
  await lee.page.waitForSelector('#app [data-do="crew"][data-c="bram"]');
  same((await user("lee@example.com"))?.role, "member", "Lee's account is made on the way");
  await lee.page.click('#app [data-do="crew"][data-c="bram"]');
  await lee.page.fill("#cc-name", "Bram");
  await lee.page.click('#cc-dialog button[type="submit"]');
  await lee.page.waitForSelector('label.cc-pick:has(input:checked) b');
  same(await lee.page.textContent("label.cc-pick:has(input:checked) b"), "Bram", "Bram comes back picked");
  await Promise.all([lee.page.waitForURL(/[?&]camp=/), lee.page.click(".cc-joinbar button[type=submit]")]);
  await lee.page.waitForSelector(".cc-names");
  const leeId = (await user("lee@example.com")).id;
  const leeBram = (await rows("SELECT characterId FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, leeId))[0]?.characterId;
  yes(/^bram-/.test(leeBram || "") && (await serverChars("lee@example.com")).some((c) => c.id === leeBram), "Lee's in with Bram, and Bram's in his account");

  // Mo sees both characters whole, and opens Vesk's sheet.
  await mo.page.reload();
  await mo.page.waitForSelector(".cc-look-card");
  await until(async () => (await mo.page.$$(".cc-look-card")).length === 2, "both players on Mo's page");
  same(await mo.page.$$eval(".cc-look-card b", (els) => els.map((e) => e.textContent)), ["Vesk", "Bram"], "Mo's party, in the order they joined");
  await shots(mo.page, "party-gm", ".cc-look-card");
  await Promise.all([mo.page.waitForURL(/look=/), mo.page.click('.cc-look-card:has-text("Vesk")')]);
  await mo.page.waitForSelector(".cc-track.is-look");
  await shots(mo.page, "look-gm", ".cc-track.is-look");
  same(await mo.page.textContent("#app h1"), "Vesk", "the look at Vesk");
  yes((await text(mo.page, "#app")).includes("Kai’s character"), "it says whose character it is");
  await mo.page.click('details[data-open="lk-notes"] > summary');
  yes((await text(mo.page, "#app")).includes("Owes Bram two favours"), "Mo sees Vesk's notes as Kai left them");
  same(await mo.page.$$eval("#app .cc-track button, #app .cc-tiles button", (els) => els.length), 0, "nothing on the look is there to tap and change");
  await mo.page.click('#app .cc-topbar [data-do="back"]');
  await mo.page.waitForSelector(".cc-look-card");
  yes(!mo.page.url().includes("look="), "Back goes back to the party");

  // Whatever's saved in a player's sheet, it's only ever words and numbers on
  // the GM's phone, and one that can't be read still leaves her a way to take
  // them out.
  const veskWas = (await serverChars("kai@example.com")).find((c) => c.id === "vesk-aaaaaa").data;
  const putVesk = async (data) => {
    const v = (await rows("SELECT version FROM character WHERE id = 'vesk-aaaaaa'"))[0].version;
    return (await got(kai.page, "PUT", "/api/characters/vesk-aaaaaa", { v, data })).status;
  };
  const sly = JSON.parse(veskWas);
  sly.state.last = { name: "<img src=x onerror=window.__pwned=1>", steps: "<b>9</b>", dice: [{ size: "<i>", total: '<img src=x onerror="window.__pwned=2">', out: "beat" }], opp: "<svg onload=window.__pwned=3>", at: 1 };
  same(await putVesk(sly), 200, "a last roll with markup in it is kept as it came");
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}&look=${kaiId}`);
  await mo.page.waitForSelector(".cc-track.is-look .cc-last, .cc-last");
  same(await mo.page.evaluate(() => [window.__pwned ?? null, document.querySelectorAll("#app img, #app svg[onload]").length]), [null, 0], "and on the GM's phone it's text and numbers only");
  const broken = JSON.parse(veskWas);
  broken.state.grown = [{ k: "perm", t: "__proto__", text: "Grown wrong" }];
  broken.state.last = { dice: "not a list" };
  same(await putVesk(broken), 200, "a sheet that can't be read is kept as it came");
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector(`#app [data-do="remove"][data-id="${kaiId}"]`);
  yes((await text(mo.page, "#app")).includes("couldn’t be read"), "the party says so, and Mo can still take Kai out");
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}&look=${kaiId}`);
  await mo.page.waitForSelector(`#app [data-do="remove"][data-id="${kaiId}"]`);
  same(await putVesk(JSON.parse(veskWas)), 200, "Vesk's put back as Kai left her");
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector("#k-link");

  // Kai sees names, and no character comes to her whole.
  const kaiView = await got(kai.page, "GET", `/api/campaigns/${tuesday.id}`);
  same(kaiView.json?.players?.map((p) => [p.name, p.character?.name]), [["Kai Tane", "Vesk"], ["Lee", "Bram"]], "Kai sees who's in it and who they play");
  yes(!kaiView.body.includes('"state"') && !kaiView.body.includes("favours") && !kaiView.json?.campaign?.code, "and nothing more: no sheets, no notes, no link");
  await kai.page.reload();
  await kai.page.waitForSelector(".cc-names");
  await shots(kai.page, "campaign-player", ".cc-names");

  // Mo resets the link, and the old one's refused.
  await mo.page.click('#app [data-do="reset"]');
  await mo.page.click('#app [data-do="reset"]');
  await until(async () => (await mo.page.inputValue("#k-link")) !== link, "a new link on Mo's page");
  const newCode = new URL(await mo.page.inputValue("#k-link")).hash.slice(1);
  same((await rows("SELECT code FROM campaign WHERE id = ?1", tuesday.id))[0]?.code, newCode, "the new code's the one kept");
  const zed = await phone();
  await signIn(zed.page, "zed", "google");
  await zed.page.goto(link);
  await zed.page.waitForSelector("#app .cc-note.is-warn");
  yes((await text(zed.page, "#app")).includes("That link didn’t work"), "the old link's refused, and says so");
  await api(zed.page, "PUT", "/api/characters/ash-zzzzzz", crewChar("ash-zzzzzz", "ash", "Ash"));
  same((await got(zed.page, "POST", "/api/join", { code, character: "ash-zzzzzz" })).status, 404, "the old code can't join anyone");
  same(await rows("SELECT userId FROM member WHERE userId = ?1", (await user("zed@example.com")).id), [], "Zed isn't in");

  // Mo takes Lee out, from Bram's page.
  same(await mo.page.$$eval('#app .cc-party [data-do="remove"]', (els) => els.length), 0, "the party's cards have nothing to tap by mistake");
  await Promise.all([mo.page.waitForURL(/look=/), mo.page.click('.cc-look-card:has-text("Bram")')]);
  await mo.page.click(`#app [data-do="remove"][data-id="${leeId}"]`);
  yes((await mo.page.textContent(`#app [data-do="remove"][data-id="${leeId}"]`)).includes("Tap again"), "taking someone out asks for a second tap");
  await mo.page.click(`#app [data-do="remove"][data-id="${leeId}"]`);
  await until(async () => !(await rows("SELECT 1 FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, leeId)).length, "Lee out of Tuesday Lair");
  await until(async () => !mo.page.url().includes("look=") && (await mo.page.$$(".cc-look-card")).length === 1, "Mo back at the party, with Vesk left");
  same((await got(lee.page, "GET", `/api/campaigns/${tuesday.id}`)).status, 404, "Lee gets nothing from it now");
  same((await got(lee.page, "GET", "/api/campaigns")).json?.campaigns, [], "and it's gone from his list");
  yes((await serverChars("lee@example.com")).some((c) => c.id === leeBram), "Bram's still Lee's");

  // Kai runs one of her own, and Zed joins it with Ash.
  const kaisTable = (await got(kai.page, "POST", "/api/campaigns", { name: "Kai’s Table" })).json?.campaign;
  yes(kaisTable?.role === "gm" && /^[A-Za-z0-9_-]{16}$/.test(kaisTable?.code || ""), "Kai starts Kai’s Table, and she's its GM");
  same((await got(zed.page, "POST", "/api/join", { code: kaisTable.code, character: "ash-zzzzzz" })).json?.campaign?.role, "player", "Zed joins it with Ash");
  // Zed runs one too, and Kai plays Dorrie in it, a different character from Tuesday Lair.
  const zedsNight = (await got(zed.page, "POST", "/api/campaigns", { name: "Zed’s Night" })).json?.campaign;
  await api(kai.page, "PUT", "/api/characters/dorrie-eeeeee", crewChar("dorrie-eeeeee", "dorrie", "Dorrie"));
  same((await got(kai.page, "POST", "/api/join", { code: zedsNight.code, character: "vesk-aaaaaa" })).status, 409, "Vesk can't play in Zed’s Night while she's in Tuesday Lair");
  same((await got(kai.page, "POST", "/api/join", { code: zedsNight.code, character: "dorrie-eeeeee" })).status, 200, "Kai joins Zed’s Night with Dorrie");
  same((await got(kai.page, "PUT", `/api/campaigns/${tuesday.id}/me`, { character: "dorrie-eeeeee" })).status, 409, "and Dorrie can't play in both");
  same((await got(kai.page, "PUT", `/api/campaigns/${zedsNight.id}/me`, { character: "ash-zzzzzz" })).status, 409, "she can't bring someone else's character");
  same((await got(kai.page, "GET", "/api/campaigns")).json?.campaigns.map((k) => [k.name, k.role, k.character?.name ?? null]),
    [["Kai’s Table", "gm", null], ["Tuesday Lair", "player", "Vesk"], ["Zed’s Night", "player", "Dorrie"]], "Kai's three, with a different character in each one she plays in");

  // She switches between them in a tap, each by its full name.
  await kai.page.goto(`${BASE}/characters/`);
  await kai.page.waitForSelector("#cc-camps .cc-camp");
  await until(async () => (await kai.page.$$("#cc-camps .cc-camp")).length === 3, "Kai's three campaigns on her list");
  await kai.page.click('#cc-camps .cc-camp:has-text("Tuesday Lair")');
  await kai.page.waitForSelector(".cc-strip");
  same(await kai.page.$$eval(".cc-strip-a span", (els) => els.map((e) => e.textContent)), ["Kai’s Table", "Tuesday Lair", "Zed’s Night"], "the strip names all three");
  await kai.page.click('.cc-strip-a:has-text("Kai’s Table")');
  await until(async () => (await kai.page.textContent("#app h1")) === "Kai’s Table", "one tap to Kai’s Table");
  same(await kai.page.getAttribute(".cc-strip-a[aria-current]", "data-id"), kaisTable.id, "and the strip shows it's the one open");
  await kai.page.waitForSelector(".cc-look-card");
  yes((await text(kai.page, "#app")).includes("Ash"), "Kai sees Zed's character in her own campaign");
  await shots(kai.page, "campaign-strip", ".cc-look-card");

  // Nothing crosses between campaigns.
  for (const [method, path, body] of [["GET", `/api/campaigns/${tuesday.id}`], ["PATCH", `/api/campaigns/${tuesday.id}`, { name: "Mine now" }], ["DELETE", `/api/campaigns/${tuesday.id}`], ["POST", `/api/campaigns/${tuesday.id}/link`], ["PUT", `/api/campaigns/${tuesday.id}/me`, { character: "ash-zzzzzz" }], ["DELETE", `/api/campaigns/${tuesday.id}/members/${kaiId}`]]) {
    same((await got(zed.page, method, path, body)).status, 404, `Zed, in Kai's campaign, gets nothing from Tuesday Lair (${method} ${path.split("/").slice(4).join("/") || "it"})`);
  }
  same((await got(zed.page, "GET", "/api/campaigns")).json?.campaigns.map((k) => k.name), ["Kai’s Table", "Zed’s Night"], "Zed's list has his two and not Mo's");
  same((await got(mo.page, "GET", `/api/campaigns/${kaisTable.id}`)).status, 404, "Mo gets nothing from Kai’s Table");
  yes(!(await got(mo.page, "GET", `/api/campaigns/${tuesday.id}`)).body.includes("Ash"), "and Zed's character never reaches him");
  const zedView = await got(zed.page, "GET", `/api/campaigns/${kaisTable.id}`);
  yes(zedView.status === 200 && !zedView.body.includes("favours") && !zedView.body.includes("Dorrie") && !zedView.json?.campaign?.code, "Zed sees Kai’s Table's names, and nothing of Kai's other characters");
  same((await rows("SELECT name FROM campaign WHERE id = ?1", tuesday.id))[0]?.name, "Tuesday Lair", "Tuesday Lair's untouched");

  // ------------------------------------------------------------ 5. the party sheet and threads
  console.log("5. The party sheet and threads between the crew");
  const BOOK = JSON.parse(readFileSync(join("src", "generated", "book.json"), "utf8"));
  const sheetOf = (id) => BOOK.crew.find((c) => c.id === id);
  // Vesk's thread with Bram's on both their sheets, and hers with Dorrie's too.
  const fire = sheetOf("vesk").threads.find((p) => p.person === "Bram").threads[0].text;
  const jobs = sheetOf("vesk").threads.find((p) => p.person === "Dorrie").threads[0].text;
  const partyOf = async (id) => JSON.parse((await rows("SELECT data FROM party WHERE campaignId = ?1", id))[0]?.data ?? "null");
  const bondOf = async (id, words) => Object.values((await partyOf(id))?.bonds ?? {}).find((b) => b.w === words)?.s ?? null;
  // A phone coming back into view checks the campaign straight away.
  const nudge = (page) => page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  async function ptFold(page, key) {
    const sel = `.pt details[data-open="pt-${key}"]`;
    await page.waitForSelector(sel, { state: "attached" });
    if (!(await page.$eval(sel, (d) => d.open))) await page.click(`${sel} > summary`);
  }
  // Where a thread's got to on the Sheet tab, by bond and words.
  const chipOf = (page, person, words) => page.evaluate(([who, w]) => {
    for (const p of document.querySelectorAll(".cc-person")) {
      if (p.querySelector("h3")?.firstChild?.textContent.trim() !== who) continue;
      for (const li of p.querySelectorAll(".cc-thread")) if (li.querySelector("em")?.textContent === w) return li.querySelector(".cc-thread-st .chip")?.textContent ?? null;
    }
    return null;
  }, [person, words]);

  // Sam joins with Bram, so Kai's Vesk and Sam's Bram are in Tuesday Lair together.
  await api(sam.page, "PUT", "/api/characters/bram-ssssss", crewChar("bram-ssssss", "bram", "Bram"));
  same((await got(sam.page, "POST", "/api/join", { code: newCode, character: "bram-ssssss" })).json?.campaign?.role, "player", "Sam joins Tuesday Lair with Bram");
  await sam.page.goto(`${BASE}/characters/`);
  await until(async () => (await sam.page.$$("#cc-camps .cc-camp")).length === 1, "Tuesday Lair on Sam's list");
  await until(async () => (await sam.page.$$eval("#app .cc-sec:not(#cc-camps) .cc-saved b", (els) => els.map((e) => e.textContent))).includes("Bram"), "Bram on Sam's phone");

  // Mo's got the campaign open, and the party sheet starts as a new crew, from the book.
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector(".pt-goal");
  yes((await text(mo.page, ".pt")).includes(BOOK.companion.party.start.res[0].text), "a new crew's starting card, from the book");
  same(await mo.page.textContent(".pt-power-v"), "d4", "Power d4 to start");
  same(await partyOf(tuesday.id), null, "and nothing's written to the campaign till someone changes it");

  // Vesk gets a Party tab, since she's playing in a campaign.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa`);
  await kai.page.waitForSelector('.cc-tabs [data-t="party"]');
  same(await kai.page.$$eval(".cc-tabs a span", (els) => els.map((e) => e.textContent)), ["Play", "Sheet", "Party", "Rules"], "Vesk's tabs");
  await kai.page.click('.cc-tabs [data-t="party"]');
  await kai.page.waitForSelector(".pt-goal");
  yes((await text(kai.page, ".pt-where")).includes("Tuesday Lair"), "the Party tab says which campaign");
  const climbAt = await kai.page.evaluate(() => Math.round(document.querySelector(".pt-climb").getBoundingClientRect().bottom));
  yes(climbAt <= 844 - 60, `the Goal's buttons in the first screen, above the tabs (they end at ${climbAt}px)`);
  await shot(kai.page, "party-tab-top");
  // Kai writes the Goal and it climbs, and Mo's phone catches up on its own.
  await kai.page.fill('.pt-goal input[name="goal"]', "Clear Dorrie’s name");
  await kai.page.click('.pt-goal button[type="submit"]');
  await kai.page.waitForSelector(".pt-goal-words");
  await kai.page.click('.pt-climb [data-by="1"]');
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 4, "the Goal at d4 in the campaign");
  same((await partyOf(tuesday.id))?.goal?.text, "Clear Dorrie’s name", "in Kai's words");
  await until(async () => (await mo.page.textContent(".pt-goal")).includes("Clear Dorrie’s name") && (await mo.page.textContent(".pt-at")) === "d4", "the Goal reaching Mo's phone in 20 seconds", 26000);
  await shots(mo.page, "party-gm", ".pt-goal");

  // Mo puts Muscle on from the twelve, and Power's a d6 on Kai's phone.
  await ptFold(mo.page, "pick");
  await mo.page.click('.pt [data-do="pick"][aria-label*="Muscle"]');
  await until(async () => (await partyOf(tuesday.id))?.assets?.some((a) => a.text === "Muscle" && a.power), "Muscle on the sheet");
  await nudge(kai.page);
  await until(async () => (await kai.page.textContent(".pt-power-v")) === "d6", "Power d6 on Kai's phone");
  await ptFold(kai.page, "assets");
  yes((await text(kai.page, ".pt")).includes("one asset isn’t paid for"), "and one asset isn't paid for");

  // Sam's phone has no signal. He adds a horse and cart and climbs the Goal,
  // while Kai climbs it too, and both count once he's back.
  await sam.page.goto(`${BASE}/characters/?c=bram-ssssss&t=party`);
  await sam.page.waitForSelector(".pt-goal-words");
  await sam.context.setOffline(true);
  await ptFold(sam.page, "holdings");
  await sam.page.fill('.pt form[data-l="holdings"] input[name="text"]', "A horse and cart");
  await sam.page.click('.pt form[data-l="holdings"] button[type="submit"]');
  await sam.page.click('.pt-climb [data-by="1"]');
  same(await sam.page.textContent(".pt-at"), "d6", "offline, Sam's phone shows his climb straight away");
  yes((await text(sam.page, ".pt-status")).includes("when you’ve got a signal"), "and says his changes go up when there's a signal");
  await kai.page.click('.pt-climb [data-by="1"]');
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 6, "Kai's climb");
  await sam.context.setOffline(false);
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 8, "both climbs counting once Sam's back");
  yes((await partyOf(tuesday.id))?.holdings?.some((h) => h.text === "A horse and cart"), "and the horse and cart's on the sheet");
  await until(async () => (await sam.page.textContent(".pt-at")) === "d8", "d8 on Sam's phone");
  same((await rows("SELECT version FROM party WHERE campaignId = ?1", tuesday.id))[0].version > 0, true, "the party sheet's kept in the campaign");

  // A project, climbed from another phone.
  await ptFold(mo.page, "projects");
  await mo.page.fill('.pt form[data-l="projects"] input[name="text"]', "Turn the salt carters against the Estate");
  await mo.page.fill('.pt form[data-l="projects"] input[name="then"]', "The Estate loses its Salt Contracts");
  await mo.page.click('.pt form[data-l="projects"] button[type="submit"]');
  await until(async () => (await partyOf(tuesday.id))?.projects?.length === 1, "Mo's project on the sheet");
  await nudge(sam.page);
  await ptFold(sam.page, "projects");
  await sam.page.waitForSelector('.pt-project [data-by="1"]');
  await sam.page.click('.pt-project [data-by="1"]');
  await until(async () => (await partyOf(tuesday.id))?.projects?.[0]?.die === 4, "the project climbing from Sam's phone");

  // Every player's Aspiration, where everyone can see it.
  await nudge(kai.page);
  await ptFold(kai.page, "asps");
  await until(async () => (await text(kai.page, ".pt")).includes(sheetOf("bram").aspiration.text), "Bram's Aspiration on Kai's party sheet");
  yes((await text(kai.page, ".pt")).includes(sheetOf("vesk").aspiration.text), "beside Vesk's");
  await shots(kai.page, "party-tab", ".pt-goal");

  // Kai strains Vesk's thread with Bram, and it's strained on Sam's Bram.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await fold(kai.page, "threads");
  yes((await kai.page.textContent('.cc-person:has(button[data-k^="Bram|"]) h3')).includes("in the crew"), "Bram's in the crew in Tuesday Lair");
  yes(!(await kai.page.textContent('.cc-person:has(button[data-k^="Dorrie|"]) h3')).includes("in the crew"), "and Dorrie, who isn't in it, isn't");
  await kai.page.click(`button[data-act="strain"][data-k="Bram|${fire}"]`);
  yes((await text(kai.page, "#cc-toast")).includes("strained on Bram’s sheet too"), "the toast says it's on Bram's sheet too");
  await until(async () => (await bondOf(tuesday.id, fire)) === "strained", "strained in the campaign");
  await sam.page.goto(`${BASE}/characters/?c=bram-ssssss&t=sheet`);
  await fold(sam.page, "threads");
  await until(async () => (await chipOf(sam.page, "Vesk", fire)) === "Bond, strained", "strained on Sam's Bram");
  // Sam mends it on his, and it's whole on Kai's.
  await sam.page.click(`button[data-act="mend"][data-k="Vesk|${fire}"]`);
  await until(async () => (await bondOf(tuesday.id, fire)) === "whole", "mended in the campaign");
  await nudge(kai.page);
  await until(async () => (await chipOf(kai.page, "Bram", fire)) === "Bond", "whole again on Kai's Vesk");
  yes((await text(kai.page, "#cc-toast")).includes("whole again, from Sam’s phone"), "and Kai's told where it came from");
  // Two strains that cross snap it, the same as at the table.
  await sam.context.setOffline(true);
  await sam.page.click(`button[data-act="strain"][data-k="Vesk|${fire}"]`);
  await kai.page.click(`button[data-act="strain"][data-k="Bram|${fire}"]`);
  await until(async () => (await bondOf(tuesday.id, fire)) === "strained", "Kai's strain");
  await sam.context.setOffline(false);
  await until(async () => (await bondOf(tuesday.id, fire)) === "snapped", "snapped once Sam's back");
  await until(async () => (await chipOf(sam.page, "Vesk", fire)) === "Snapped", "snapped on Sam's Bram");
  await nudge(kai.page);
  await until(async () => (await chipOf(kai.page, "Bram", fire)) === "Snapped", "and on Kai's Vesk");

  // A thread only on Vesk's sheet, grown in downtime, shows on Bram's in her
  // words, and straining it there strains it on hers.
  const ladder = "He still owes me for the ladder.";
  await kai.page.evaluate((words) => {
    const data = JSON.parse(localStorage.getItem("zi-characters"));
    const v = data.characters.find((c) => c.id === "vesk-aaaaaa");
    v.state.grown = [...(v.state.grown || []), { k: "thread", person: "Bram", text: words, kind: "bond" }];
    v.saved = new Date().toISOString();
    localStorage.setItem("zi-characters", JSON.stringify(data));
  }, ladder);
  await kai.page.reload();
  await fold(kai.page, "threads");
  await until(async () => ((await rows("SELECT face FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, kaiId))[0]?.face ?? "").includes("the ladder"), "Vesk's new thread shared with the crew");
  await nudge(sam.page);
  await until(async () => (await chipOf(sam.page, "Vesk", ladder)) === "Bond", "on Sam's Bram, under Vesk");
  yes((await sam.page.textContent(`.cc-thread:has(button[data-k="Vesk|${ladder}"])`)).includes("Vesk’s words"), "in Vesk's words");
  await sam.page.click(`button[data-act="strain"][data-k="Vesk|${ladder}"]`);
  await until(async () => (await bondOf(tuesday.id, ladder)) === "strained", "Sam strains it");
  await nudge(kai.page);
  await until(async () => (await chipOf(kai.page, "Bram", ladder)) === "Bond, strained", "strained on Kai's Vesk too");
  const samGets = (await got(sam.page, "GET", `/api/campaigns/${tuesday.id}/party`)).json;
  same(samGets?.crew?.find((m) => m.id === kaiId)?.threads?.map((t) => t.text).sort(), [fire, ladder].sort(), "Sam gets Vesk's threads with Bram, and none of her others");

  // Mo's look at Vesk has the thread with Bram where the campaign has it.
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}&look=${kaiId}`);
  await mo.page.waitForSelector(".cc-track.is-look");
  await mo.page.click('details[data-open="lk-threads"] > summary');
  await until(async () => (await text(mo.page, '.cc-person:has(h3:text-is("Bram"))')).includes("Snapped"), "Mo's look shows it snapped");

  // Nothing crosses. Kai's Dorrie plays in Zed's Night, so Vesk straining their
  // thread leaves Dorrie's alone, and Zed gets nothing of Tuesday Lair's.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await fold(kai.page, "threads");
  await kai.page.click(`button[data-act="strain"][data-k="Dorrie|${jobs}"]`);
  await kai.page.waitForTimeout(1500);
  same(await bondOf(tuesday.id, jobs), null, "a thread with someone who isn't in the campaign stays on Vesk's sheet");
  yes(!((await rows("SELECT face FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, kaiId))[0]?.face ?? "").includes("dozen jobs"), "and never leaves her phone for Tuesday Lair");
  await kai.page.goto(`${BASE}/characters/?c=dorrie-eeeeee&t=sheet`);
  await fold(kai.page, "threads");
  same(await chipOf(kai.page, "Vesk", jobs), "Bond", "Kai's Dorrie, in Zed's Night, still has it whole");
  await kai.page.click('.cc-tabs [data-t="party"]');
  await kai.page.waitForSelector(".pt-goal");
  yes((await text(kai.page, ".pt-where")).includes("Zed’s Night") && !(await text(kai.page, ".pt")).includes("Clear Dorrie’s name"), "Dorrie's Party tab is Zed's Night's own");
  same(await partyOf(zedsNight.id), null, "and Zed's Night's sheet is untouched");
  same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/party`)).status, 404, "Zed gets nothing of Tuesday Lair's party sheet");
  same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/party`, { dev: "zeds-phone-0001", ops: [{ n: 1, o: "name", v: "Mine now" }] })).status, 404, "and can't change it");
  same((await partyOf(tuesday.id))?.name, "", "Tuesday Lair's crew still has no name");
  const twice = { dev: "sams-phone-0001", ops: [{ n: 1, m: 1, with: `${moId}:nobody`, w: fire, from: null, to: "whole" }, { n: 2, o: "climb", by: 1 }] };
  same((await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, twice)).status, 200, "a change sent from a phone");
  same((await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, twice)).json?.seq, 2, "and sent again, when the answer didn't get back");
  same([(await partyOf(tuesday.id))?.goal?.die, await bondOf(tuesday.id, fire)], [10, "snapped"], "counts once, and a thread with someone who isn't playing goes nowhere");

  // The Goal done: past d12 the crew earns a Reputation and writes the next
  // Goal at d2. A climb tapped by mistake comes back off with Undo.
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector(".pt-goal-words");
  await mo.page.click('.pt-ladder [data-v="12"]');
  await until(async () => (await mo.page.textContent(".pt-at")) === "d12", "the Goal set straight to d12");
  await mo.page.click('.pt-climb [data-by="1"]');
  await mo.page.waitForSelector(".pt-goal.is-done");
  yes((await text(mo.page, ".pt-goal")).includes("The crew’s done it."), "past d12, the crew's done it");
  await shot(mo.page, "party-goal-done");
  await mo.page.fill('.pt-goal form[data-l="reps"] input[name="text"]', "The ones who beat the forger’s court.");
  await mo.page.click('.pt-goal form[data-l="reps"] button[type="submit"]');
  await mo.page.fill('.pt-goal form[data-form="p-next"] input[name="goal"]', "Free the Bound");
  await mo.page.click('.pt-goal form[data-form="p-next"] button[type="submit"]');
  await until(async () => {
    const p = await partyOf(tuesday.id);
    return p?.goal?.text === "Free the Bound" && p.goal.die === 2 && !p.goal.done && p.reps.some((r) => r.text === "The ones who beat the forger’s court.");
  }, "a Reputation earned and the next Goal at d2");
  await mo.page.click('.pt-climb [data-by="1"]');
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 4, "a climb");
  await mo.page.click('#cc-toast [data-act="pundo"]');
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 2, "and Undo takes it back");

  // The party sheet at 390, in both themes.
  for (const theme of ["dark", "light"]) {
    await kai.page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=party`);
    await kai.page.waitForSelector(".pt-goal-words");
    for (const key of ["assets", "projects", "asps"]) await ptFold(kai.page, key);
    await axe(kai.page, `party tab, ${theme}`);
    if (SHOTS) {
      await kai.page.evaluate(() => document.querySelector(".pt-crew").scrollIntoView());
      await shot(kai.page, `party-crew-${theme}`);
      await kai.page.evaluate(() => document.querySelector('details[data-open="pt-projects"]').scrollIntoView());
      await shot(kai.page, `party-folds-${theme}`);
    }
    await mo.page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
    await mo.page.waitForSelector(".pt-goal-words");
    await axe(mo.page, `party sheet on the campaign, ${theme}`);
  }
  await kai.page.evaluate(() => localStorage.setItem("zi-theme", "dark"));
  await mo.page.evaluate(() => localStorage.setItem("zi-theme", "dark"));

  // ------------------------------------------------------------ 6. who can do what
  console.log("6. Who can do what");
  same((await api(kai.page, "GET", "/api/people")).status, 403, "a member can't see people");
  const people = (await got(mo.page, "GET", "/api/people")).json;
  same([people?.total, people?.people?.[0]?.email], [6, "zed@example.com"], "Mo sees everyone who's signed up, newest first");
  same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/link`)).status, 403, "a player can't reset the link");
  same((await got(kai.page, "PATCH", `/api/campaigns/${tuesday.id}`, { name: "Kai’s now" })).status, 403, "or rename it");
  same((await got(kai.page, "DELETE", `/api/campaigns/${tuesday.id}`)).status, 403, "or end it");
  same((await got(kai.page, "DELETE", `/api/campaigns/${tuesday.id}/members/${moId}`)).status, 403, "or take anyone out");
  same((await got(mo.page, "DELETE", `/api/campaigns/${tuesday.id}/members/${moId}`)).status, 400, "the GM can't leave her own campaign");
  same((await got(kai.page, "DELETE", `/api/campaigns/${zedsNight.id}/members/${kaiId}`)).status, 200, "a player can leave");
  same((await got(kai.page, "GET", `/api/campaigns/${zedsNight.id}`)).status, 404, "and then she's out");
  const nobody = await phone();
  await nobody.page.goto(`${BASE}/account/`);
  await settled(nobody.page);
  for (const path of ["/api/characters", "/api/people", "/api/me/data", "/api/campaigns", `/api/campaigns/${tuesday.id}`]) same((await api(nobody.page, "GET", path)).status, 401, `signed out, ${path}`);
  same(JSON.parse((await api(nobody.page, "GET", "/api/me")).body).user, null, "signed out, /api/me has nobody");
  same((await api(nobody.page, "PUT", "/api/characters/vesk-aaaaaa", { v: 1, data: { id: "vesk-aaaaaa", crew: "vesk" } })).status, 401, "signed out, a character can't be written");
  same((await got(nobody.page, "POST", "/api/campaigns", { name: "Mine" })).status, 401, "signed out, no campaigns get started");
  const peek = await got(nobody.page, "POST", "/api/join", { code: newCode });
  same(peek.json?.campaign, { name: "Tuesday Lair", gm: "Mo", id: null, role: null }, "signed out, a link says only which campaign and its GM");
  same((await got(nobody.page, "POST", "/api/join", { code: newCode, character: "vesk-aaaaaa" })).status, 401, "signed out, nobody joins");
  const table = [];
  for (let i = 0; i < 40; i++) table.push((await api(nobody.page, "POST", "/api/join", { code: newCode })).status);
  yes(table.every((x) => x === 200), "a whole table opening a good link on one wifi never trips the limit");
  const tries = [];
  for (let i = 0; i < 24; i++) tries.push((await api(nobody.page, "POST", "/api/join", { code: "no-such-join-code-0000" })).status);
  yes(tries.slice(0, 20).every((x) => x === 404) && tries.slice(20).every((x) => x === 429), `guessing at codes trips it after 20 misses (${tries.slice(18).join(" ")})`);
  same((await api(nobody.page, "POST", "/api/join", { code: newCode })).status, 429, "and then that address waits, good link or not");
  const keys = await rows("SELECT key FROM limits");
  yes(keys.length > 3 && keys.every((k) => /^[0-9a-f]{32}$/.test(k.key)), "rate limits keep HMACs, not addresses (Better Auth's too)");
  same(await rows("SELECT name FROM sqlite_master WHERE name = 'rateLimit'"), [], "no table of addresses");

  // ------------------------------------------------------------ 7. leaving
  console.log("7. Signing out, your data and deleting");
  // A phone-only character stays when Kai signs out on the first phone.
  await kai.page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("zi-characters"));
    data.characters.push({ id: "ash-cccccc", crew: "ash", name: "Ash", made: new Date().toISOString(), hash: "", state: {} });
    localStorage.setItem("zi-characters", JSON.stringify(data));
  });
  await kai.page.goto(`${BASE}/account/`);
  await settled(kai.page);
  yes((await kai.page.evaluate(() => localStorage.getItem("zi-campaigns"))) !== null, "the phone keeps Kai's campaigns while she's signed in");
  await kai.page.click('[data-act="out"]');
  await kai.page.waitForSelector('[data-act="in"]');
  yes((await text(kai.page)).includes("Sign in with Discord"), "signed out");
  same(await kai.page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.map((c) => c.name)), ["Ash"], "the account's characters leave the phone, its own stay");
  same(await kai.page.evaluate(() => localStorage.getItem("zi-campaigns")), null, "and so do her campaigns");

  const data = await two.page.evaluate(() => fetch("/api/me/data").then((r) => r.text()));
  yes(data.includes("Owes Bram two favours") && data.includes("kai@example.com") && data.includes("Tuesday Lair") && data.includes("Kai’s Table"), "the download has her account, characters and campaigns");
  yes(!data.includes(newCode) && !data.includes(kaisTable.code), "and no join links");
  await two.page.goto(`${BASE}/account/`);
  await settled(two.page);
  await two.page.click('[data-act="delete"]');
  await Promise.all([two.page.waitForURL(/gone/), two.page.click('[data-act="delete"]')]);
  same(await user("kai@example.com"), null, "Kai's account is gone");
  same((await rows("SELECT COUNT(*) AS n FROM character WHERE userId = ?1", kaiId)).map((r) => r.n), [0], "and her characters");
  same(await rows("SELECT id FROM campaign WHERE gmId = ?1", kaiId), [], "her campaign's ended");
  same(await rows("SELECT campaignId FROM member WHERE userId = ?1 OR campaignId = ?2", kaiId, kaisTable.id), [], "she's out of Mo's, and nobody's left in hers");
  same((await got(zed.page, "GET", "/api/campaigns")).json?.campaigns.map((k) => k.name), ["Zed’s Night"], "Zed's left with his own");
  same(await two.page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters") || '{"characters":[]}').characters.length), 0, "and they're gone from the phone");

  // A character the account won't take stays on the phone and doesn't hold up the rest.
  await mo.page.evaluate(() => {
    const big = { id: "bram-eeeeee", crew: "bram", name: "Big Bram", made: new Date().toISOString(), hash: "", state: { notes: "x".repeat(210000) } };
    const small = { id: "isolde-ffffff", crew: "isolde", name: "Isolde", made: new Date().toISOString(), hash: "", state: {} };
    localStorage.setItem("zi-characters", JSON.stringify({ v: 1, characters: [big, small] }));
  });
  await mo.page.goto(`${BASE}/account/`);
  await settled(mo.page);
  await mo.page.click('[data-act="move"]');
  await until(async () => (await serverChars(ADMIN)).length === 1, "Isolde going up");
  await until(() => mo.page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.filter((c) => !c.acct).map((c) => c.name).join() === "Big Bram"), "Big Bram staying on the phone");

  // The account page, signed in as Mo, at 320 wide in both themes, and the
  // campaign screens at 390.
  for (const theme of ["dark", "light"]) {
    await mo.page.setViewportSize({ width: 320, height: 800 });
    await mo.page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await mo.page.goto(`${BASE}/account/`);
    await settled(mo.page);
    await mo.page.waitForSelector(".ac-item");
    await axe(mo.page, `account, 320, ${theme}`);
    await mo.page.setViewportSize({ width: 390, height: 844 });
    await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
    await mo.page.waitForSelector("#k-link");
    await axe(mo.page, `campaign, ${theme}`);
    await shot(mo.page, `campaign-gm-${theme}`);
    await mo.page.click('#app [data-do="qr"]');
    await mo.page.waitForSelector("#cc-dialog .cc-qr svg");
    yes((await mo.page.getAttribute("#cc-dialog .cc-qr", "aria-label"))?.includes("Tuesday Lair"), `the code's named for the campaign (${theme})`);
    await mo.page.waitForTimeout(400);
    await shot(mo.page, `campaign-qr-${theme}`);
    await mo.page.click('#cc-dialog [data-act="close"]');
    await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}&look=${(await user("lee@example.com")).id}`);
    await mo.page.waitForSelector("#app .cc-note");
    yes((await text(mo.page, "#app")).includes("isn’t in the campaign any more"), `a look at someone taken out says so (${theme})`);
    await zed.page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await zed.page.evaluate((c) => localStorage.setItem("zi-join", JSON.stringify({ code: c, at: Date.now() })), newCode);
    await zed.page.goto(`${BASE}/characters/?join`);
    await zed.page.waitForSelector('input[name="k-pick"]');
    await axe(zed.page, `joining, ${theme}`);
    await shot(zed.page, `join-pick-${theme}`);
  }
} catch (err) {
  note(`stopped: ${err.stack || err}`);
} finally {
  await browser.close();
  server.close();
  await mf.dispose();
}

console.log(problems.length ? `\n${problems.length} problem(s)` : "\nAccounts check passed.");
process.exit(problems.length ? 1 : 0);
