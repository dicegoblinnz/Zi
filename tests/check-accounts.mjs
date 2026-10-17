// Check sign-in and accounts (stage 6) the way players will use them.
//
//   npm run build && node tests/check-accounts.mjs
//
// The site's Worker runs here in workerd (Miniflare) with its own D1, built the
// way a deploy builds it. Google and Discord are stood in for: the browser's
// trip to them comes straight back with a code, and the Worker's calls to them
// get a made-up person.
//
// 1. Mo signs in with Google with no invite (he's ADMIN_EMAIL) and makes an
//    invite for Kai. Nobody else gets an account without one: no invite with
//    Google or Discord, a used-up invite, or one that's run out.
// 2. Kai has Vesk and Wren on her phone, opens the invite, joins with Discord,
//    and moves them into her account with one tap.
// 3. A second device: Kai signs in there, and both characters are waiting. A
//    note written on one phone reaches the other, Wren deleted on one goes from
//    both, and a change made offline goes up when the signal's back.
// 4. Who can do what: only Mo sees people, a member can't make invites until
//    Mo makes her a GM, and a signed-out request gets nothing private. The
//    invite check's rate limit trips.
// 5. Signing out takes the account's characters off the phone and leaves the
//    phone's own. Kai downloads her data, then deletes her account, and it's
//    gone from the database. The account page passes axe at 320 wide in both
//    themes.
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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

// The Worker, bundled exactly as `wrangler deploy` would.
// It goes under .wrangler/, which git ignores, since workerd only loads modules
// from inside the folder it starts in.
const out = join(".wrangler", "check-accounts");
execFileSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", out], { stdio: "ignore" });

// The people Google and Discord vouch for, by the code their trip comes back with.
const PEOPLE = {
  mo: { email: ADMIN, name: "Mo" },
  kai: { email: "kai@example.com", name: "Kai" },
  stranger: { email: "stranger@example.com", name: "Stranger" },
  sam: { email: "sam@example.com", name: "Sam" },
  zed: { email: "zed@example.com", name: "Zed" },
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
const sql = readFileSync("migrations/0001_accounts.sql", "utf8").split("\n").filter((l) => !l.startsWith("--")).join("\n");
for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) await db.prepare(statement).run();
const rows = async (q, ...args) => (await db.prepare(q).bind(...args).all()).results;

// The site, served like Cloudflare does: files from dist/, /api/ to the Worker.
const DIST = join(process.cwd(), "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf" };
async function file(path) {
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
async function phone(saved) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: "block" });
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
// Sign in from the account page. It starts with ?go (or the invite) in the
// address, so coming back to /account/ is a change.
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
const user = async (email) => (await rows('SELECT id, role, invitedBy FROM "user" WHERE email = ?1', email))[0] ?? null;
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

try {
  // ------------------------------------------------------------ 1. the gate
  console.log("1. Mo, the invite and the gate");
  const mo = await phone();
  await signIn(mo.page, "mo", "google");
  yes((await text(mo.page)).includes("Signed in as Mo"), "Mo is signed in");
  same((await user(ADMIN))?.role, "admin", "Mo's role");
  yes((await rows("SELECT image FROM \"user\" WHERE email = ?1", ADMIN))[0]?.image == null, "no picture kept");
  same((await rows("SELECT accessToken, idToken, refreshToken FROM account"))[0], { accessToken: null, idToken: null, refreshToken: null }, "no provider tokens kept");
  same((await rows("SELECT ipAddress, userAgent FROM session"))[0], { ipAddress: null, userAgent: null }, "sessions don't keep where they're from");
  await mo.page.fill("#ac-note", "Kai");
  await mo.page.click('.ac-make button[type="submit"]');
  await mo.page.waitForSelector("#ac-link");
  const link = await mo.page.inputValue("#ac-link");
  const code = new URL(link).searchParams.get("invite");
  yes(/^[A-Za-z0-9_-]{22}$/.test(code || ""), `an invite link with a long code (${link})`);

  const stranger = await phone();
  await signIn(stranger.page, "stranger", "discord");
  yes(stranger.page.url().includes("error="), "no invite with Discord comes back with an error");
  yes((await text(stranger.page)).includes("you’ll need an invite link"), "and a plain message");
  same(await user("stranger@example.com"), null, "no account without an invite (Discord)");
  await signIn(stranger.page, "sam", "google");
  same(await user("sam@example.com"), null, "no account without an invite (Google)");

  // ------------------------------------------------------------ 2. joining and the move
  console.log("2. Kai joins and moves her characters in");
  const made = new Date().toISOString();
  const kai = await phone([
    { id: "vesk-aaaaaa", crew: "vesk", name: "Vesk", made, hash: "", state: {} },
    { id: "wren-bbbbbb", crew: "wren", name: "Wren", made, hash: "", state: {} },
  ]);
  await signIn(kai.page, "kai", "discord", `/account/?invite=${code}`);
  yes((await text(kai.page)).includes("Signed in as Kai"), "Kai joins with the invite");
  const kaiRow = await user("kai@example.com");
  same(kaiRow && [kaiRow.role, kaiRow.invitedBy === (await user(ADMIN)).id], ["member", true], "Kai's a member, invited by Mo");
  same((await rows("SELECT used FROM invite WHERE code = ?1", code))[0]?.used, 1, "the invite's used");
  yes((await text(kai.page)).includes("These 2 are only on this phone: Vesk, Wren"), "the move's offered");
  await kai.page.click('[data-act="move"]');
  await until(async () => (await serverChars("kai@example.com")).length === 2, "both characters in Kai's account");
  yes((await text(kai.page)).includes("2 characters are in your account"), "the page says they're in");

  // A used-up invite, carried all the way to Google, still can't make an account.
  const sam = await phone();
  await sam.page.goto(`${BASE}/account/?invite=${code}`);
  await settled(sam.page);
  await sam.page.click('[data-act="in"][data-p="google"]');
  await sam.page.waitForSelector("#acct .cc-note.is-warn");
  yes((await text(sam.page)).includes("That invite link didn’t work"), "a used-up invite says so");
  await sam.context.addCookies([{ name: "zi-invite", value: code, url: `${BASE}/api/auth` }]);
  await signIn(sam.page, "sam", "google");
  same(await user("sam@example.com"), null, "a used-up invite makes no account");
  // And one that's run out.
  const old = "old-invite-old-invite-0001";
  await db.prepare("INSERT INTO invite (code, createdBy, note, uses, used, createdAt, expiresAt) VALUES (?1, ?2, 'Zed', 1, 0, ?3, ?3)").bind(old, (await user(ADMIN)).id, Date.now() - 1000).run();
  const zed = await phone();
  await zed.context.addCookies([{ name: "zi-invite", value: old, url: `${BASE}/api/auth` }]);
  await signIn(zed.page, "zed", "google");
  same(await user("zed@example.com"), null, "an invite that's run out makes no account");

  // ------------------------------------------------------------ 3. a second device
  console.log("3. A second device");
  const two = await phone();
  await signIn(two.page, "kai", "discord");
  await until(async () => (await text(two.page)).includes("2 characters are in your account"), "both characters reaching the second device");
  await two.page.goto(`${BASE}/characters/`);
  await two.page.waitForSelector(".cc-saved");
  same(await two.page.$$eval(".cc-saved b", (els) => els.map((e) => e.textContent).sort()), ["Vesk", "Wren"], "the list on the second device");
  yes((await text(two.page, "#app")).includes("Signed in as Kai"), "the Characters page says who's signed in");
  await two.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await two.page.fill("#cc-notes", "Owes Bram a favour");
  await until(async () => (await serverChars("kai@example.com")).some((c) => JSON.parse(c.data).state?.notes === "Owes Bram a favour"), "the note going up");
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await until(() => kai.page.inputValue("#cc-notes").then((v) => v === "Owes Bram a favour"), "the note reaching the first phone");
  await two.page.goto(`${BASE}/characters/?c=wren-bbbbbb&t=sheet`);
  await two.page.click('[data-act="delete"]');
  await until(async () => (await serverChars("kai@example.com")).length === 1, "Wren going from the account");
  await kai.page.goto(`${BASE}/characters/`);
  await until(() => kai.page.$$eval(".cc-saved b", (els) => els.map((e) => e.textContent).join()).then((t) => t === "Vesk"), "Wren going from the first phone");
  // Offline on the first phone, then the signal's back.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=sheet`);
  await kai.context.setOffline(true);
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
  await kai.context.setOffline(true);
  await kai.page.click('[data-act="delete"]');
  await kai.page.waitForTimeout(1200);
  await kai.context.setOffline(false);
  await until(async () => !(await serverChars("kai@example.com")).some((c) => c.id === "dorrie-dddddd"), "the offline delete going up");
  await kai.page.goto(`${BASE}/characters/`);
  await kai.page.waitForTimeout(1500);
  same(await kai.page.$$eval(".cc-saved b", (els) => els.map((e) => e.textContent)), ["Vesk"], "Dorrie doesn't come back");

  // ------------------------------------------------------------ 4. who can do what
  console.log("4. Who can do what");
  same((await api(kai.page, "GET", "/api/people")).status, 403, "a member can't see people");
  same((await api(kai.page, "POST", "/api/invites", { note: "x" })).status, 403, "a member can't make invites");
  await mo.page.reload();
  await settled(mo.page);
  await mo.page.waitForSelector(".ac-item [data-act=role]");
  await mo.page.click('.ac-item [data-act="role"][data-role="gm"]');
  await until(async () => (await user("kai@example.com")).role === "gm", "Kai becoming a GM");
  same((await api(kai.page, "POST", "/api/invites", { note: "Ash" })).status, 200, "a GM can make invites");
  same(JSON.parse((await api(kai.page, "GET", "/api/invites")).body).invites.map((i) => i.note), ["Ash"], "a GM sees her own invites only");
  same(JSON.parse((await api(mo.page, "GET", "/api/invites")).body).invites.length, 3, "Mo sees them all");
  await mo.page.click('.ac-item [data-act="role"][data-role="member"]');
  await until(async () => (await user("kai@example.com")).role === "member", "Kai no longer a GM");
  same((await rows("SELECT COUNT(*) AS n FROM invite WHERE createdBy = ?1", kaiId))[0].n, 0, "her invites go with it");
  same((await api(kai.page, "POST", "/api/invites", { note: "x" })).status, 403, "and she can't make more");
  const nobody = await phone();
  await nobody.page.goto(`${BASE}/account/`);
  await settled(nobody.page);
  for (const path of ["/api/characters", "/api/people", "/api/invites", "/api/me/data"]) same((await api(nobody.page, "GET", path)).status, 401, `signed out, ${path}`);
  same(JSON.parse((await api(nobody.page, "GET", "/api/me")).body).user, null, "signed out, /api/me has nobody");
  same((await api(nobody.page, "PUT", "/api/characters/vesk-aaaaaa", { v: 1, data: { id: "vesk-aaaaaa", crew: "vesk" } })).status, 401, "signed out, a character can't be written");
  const tries = [];
  for (let i = 0; i < 12; i++) tries.push((await api(nobody.page, "POST", "/api/invite", { code: "no-such-invite-code-0000" })).status);
  yes(tries.includes(429), `the invite check's rate limit trips (${tries.join(" ")})`);
  const keys = await rows("SELECT key FROM limits");
  yes(keys.length > 3 && keys.every((k) => /^[0-9a-f]{32}$/.test(k.key)), "rate limits keep HMACs, not addresses (Better Auth's too)");
  same(await rows("SELECT name FROM sqlite_master WHERE name = 'rateLimit'"), [], "no table of addresses");

  // ------------------------------------------------------------ 5. leaving
  console.log("5. Signing out, your data and deleting");
  // A phone-only character stays when Kai signs out on the first phone.
  await kai.page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("zi-characters"));
    data.characters.push({ id: "ash-cccccc", crew: "ash", name: "Ash", made: new Date().toISOString(), hash: "", state: {} });
    localStorage.setItem("zi-characters", JSON.stringify(data));
  });
  await kai.page.goto(`${BASE}/account/`);
  await settled(kai.page);
  await kai.page.click('[data-act="out"]');
  await kai.page.waitForSelector('[data-act="in"]');
  yes((await text(kai.page)).includes("Sign in with Discord"), "signed out");
  same(await kai.page.evaluate(() => JSON.parse(localStorage.getItem("zi-characters")).characters.map((c) => c.name)), ["Ash"], "the account's characters leave the phone, its own stay");

  const data = await two.page.evaluate(() => fetch("/api/me/data").then((r) => r.text()));
  yes(data.includes("Owes Bram two favours") && data.includes("kai@example.com") && !data.includes(code), "the download has her account and characters, and no codes");
  await two.page.goto(`${BASE}/account/`);
  await settled(two.page);
  await two.page.click('[data-act="delete"]');
  await Promise.all([two.page.waitForURL(/gone/), two.page.click('[data-act="delete"]')]);
  same(await user("kai@example.com"), null, "Kai's account is gone");
  same((await rows("SELECT COUNT(*) AS n FROM character")).map((r) => r.n), [0], "and her characters");
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

  // The account page, signed in as Mo, at 320 wide in both themes.
  for (const theme of ["dark", "light"]) {
    await mo.page.setViewportSize({ width: 320, height: 800 });
    await mo.page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
    await mo.page.reload();
    await settled(mo.page);
    await mo.page.waitForSelector(".ac-item");
    const axe = await new AxeBuilder({ page: mo.page }).include("main").analyze();
    for (const v of axe.violations) note(`axe (${theme}): ${v.id}: ${v.help}`);
    same(await mo.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no sideways scroll at 320 (${theme})`);
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
