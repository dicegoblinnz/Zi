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
// 6. Telegraphs on phones. Mo builds round 1 on Tuesday Lair's page, the
//    left Warden's d10 at Vesk and the brute's d8 at Bram, and sends it. Each
//    is on its player's play screen in a second or two, and Mo's page says
//    it's on their phones. Kai answers on Vesk's play screen, the roll card
//    taking the d10, and Mo sees it stopped within seconds. Sam has no signal:
//    he answers with real dice tapped in, his phone says it goes up when
//    there's a signal, and it reaches Mo once he's back. Mo sends the maid's
//    fear at Vesk mid-round, then ends the round: it lands, Kai rolls When it
//    lands with the d4 already in, and Mo sees what got through. Kai's Undo
//    takes it back off Mo's page. Vesk's phone, wiped, gets the round back
//    from the server. Nothing crosses: Zed gets nothing of Tuesday Lair's
//    table, Zed's Night's is empty, Kai's Dorrie there sees no telegraphs,
//    and a socket from another site is turned away. The round's screens pass
//    axe at 390, in both themes.
// 7. The world: the faction board. Mo opens Tuesday Lair's World screen from
//    its page and brings in Brinewake's board, four cards matching the
//    chapter, then the Steeplands with the Vane Estate's whole card. The
//    book's example: the vineyards burned, the tolls taken and Hired Swords
//    unpaid make the Estate a d10. The Household Guard ×2 takes two wins, and
//    Undo puts one back. Vane comes home climbs past d12. The Harbour Guild
//    makes the Night Boats, dropping to a d8. Kai's phone gets nothing till
//    Mo shows the crew the Tithe Fleet, then its Power, and its Secret only
//    on a second tap, and a thread toward a faction she hasn't been shown
//    stays off her phone. Kai can't change the board. Mo's change with no
//    signal goes up once he's back, and counts once. A made-up change to the
//    book gets a note he takes, and a typo fix goes in quietly. Nothing
//    crosses: Zed gets nothing, Zed's Night's board is empty, and Kai's Dorrie
//    there sees none of it. With no signal, Vesk's World tab still has what
//    Kai's seen. The World screen, a faction's page and the World tab pass
//    axe at 390, in both themes.
// 8. The faction turn. First the rules, off the book's own examples: Two things
//    in one job (the Guild's d6 and d4 against the Estate's d12 rolling a 4),
//    the week's Obstruct with Bram's slot in (the crew's d4 a d8), a tie going
//    to the faction that telegraphed it and taken with an extra resource, and
//    hiring (the Tithe Fleet won't take the crew's money). Then a downtime on
//    three phones. Mo starts it, and Kai's phone has it. Kai tries to pay the
//    Tithe Fleet and it won't take the crew's money, so she pays the Brothers
//    of the Lamp. Mo gets every faction's action ready: the Guild's Two things
//    in one job, the Fleet working Close the Combs, the Brothers' Obstruct for
//    the crew, the Order coming for the crew and the Estate's new agenda
//    off-screen. He sends them, and Kai's phone has four telegraphs and none of
//    the Estate's. Sam, with no signal, picks the crew's action: the Order's d8
//    is bigger than the crew, so it takes Bram's slot in, and it goes up once
//    he's back. The actions land with real dice: the contracts are the Guild's
//    and the Estate knows who took them, the Brothers lose and Close the Combs
//    climbs, and the crew ties the Order and rolls again for 1 Resolve to stop
//    it. Mo puts each outcome on the cards in a tap. A second downtime: Close
//    the Combs happens and goes on the party sheet, under What has changed, on
//    Kai's phone too, and the crew Establishes a mini faction of its own,
//    handing it a resource and an asset off the party sheet. Kai can't set a
//    faction's action or roll its dice, and nothing crosses: Zed gets nothing
//    and Zed's Night has no turn. The faction turn on the World screen and the
//    World tab passes axe at 390, in both themes.
// 9. Who can do what: only Mo sees people, a player can't reset a link, rename,
//    end a campaign or take anyone out, a signed-out request gets nothing
//    private, and the join check's rate limit trips.
// 10. Signing out takes the account's characters off the phone and leaves the
//    phone's own. Kai downloads her data, then deletes her account: it's gone
//    from the database, her campaign ends with its board and she's out of
//    Mo's. The account page passes axe at 320 wide, and the campaign screens
//    at 390, in both themes.
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
// Miniflare 5 takes v4-style options through its converter.
import { Miniflare, convertV4MiniflareOptions, coupleWebSocket } from "miniflare";
import { WebSocketServer } from "ws";
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
const has = (got, want, what) => {
  if (!String(got ?? "").includes(want)) note(`${what}: "${want}" isn't in "${String(got ?? "").replace(/\s+/g, " ").slice(0, 240)}"`);
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
  // The live table: a Durable Object for each campaign (src/worker/table.js).
  durableObjects: { TABLE: { className: "Table", useSQLite: true } },
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
// The live table's sockets go through to the Worker the same way.
const sockets = new WebSocketServer({ noServer: true });
server.on("upgrade", async (req, socket, head) => {
  if (!req.url.startsWith("/api/")) return socket.destroy();
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  try {
    const answer = await mf.dispatchFetch(`${BASE}${req.url}`, { headers, redirect: "manual" });
    if (answer.status !== 101 || !answer.webSocket) {
      socket.end(`HTTP/1.1 ${answer.status} No\r\nconnection: close\r\n\r\n`);
      return;
    }
    sockets.handleUpgrade(req, socket, head, (ws) => coupleWebSocket(ws, answer.webSocket).catch(() => ws.terminate()));
  } catch {
    socket.destroy();
  }
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
  same(await kai.page.$$eval(".cc-tabs a span", (els) => els.map((e) => e.textContent)), ["Play", "Sheet", "Party", "World", "Rules"], "Vesk's tabs");
  await kai.page.click('.cc-tabs [data-t="party"]');
  await kai.page.waitForSelector(".pt-goal");
  yes((await text(kai.page, ".pt-where")).includes("Tuesday Lair"), "the Party tab says which campaign");
  // With no Goal yet, the book's tests for a good one are open under its words.
  yes(await kai.page.$eval(".pt-goal .pt-good", (el) => el.open), "what makes a good Goal open while there's no Goal");
  has(await text(kai.page, ".pt-goal .pt-good"), "Own the Low Market", "a good Goal's examples, from the book");
  const writeAt = await kai.page.evaluate(() => Math.round(document.querySelector('.pt-goal button[type="submit"]').getBoundingClientRect().bottom));
  yes(writeAt <= 844 - 60, `the Goal's words and Write it in in the first screen, above the tabs (they end at ${writeAt}px)`);
  if (SHOTS) await kai.page.waitForTimeout(500);
  await shot(kai.page, "party-tab-top");
  // Shut, it stays shut when the tab's drawn again.
  await kai.page.click(".pt-goal .pt-good > summary");
  await kai.page.click('.cc-tabs [data-t="play"]');
  await kai.page.click('.cc-tabs [data-t="party"]');
  await kai.page.waitForSelector(".pt-goal .pt-good");
  same(await kai.page.$eval(".pt-goal .pt-good", (el) => el.open), false, "what makes a good Goal still shut once it's been shut");
  // Kai writes the Goal and it climbs, and Mo's phone catches up on its own.
  await kai.page.fill('.pt-goal input[name="goal"]', "Clear Dorrie’s name");
  await kai.page.click('.pt-goal button[type="submit"]');
  await kai.page.waitForSelector(".pt-goal-words");
  same(await kai.page.$$(".pt-goal .pt-good").then((x) => x.length), 0, "the tests for a good Goal gone once it's written");
  const climbAt = await kai.page.evaluate(() => Math.round(document.querySelector(".pt-climb").getBoundingClientRect().bottom));
  yes(climbAt <= 844 - 60, `the Goal's buttons in the first screen, above the tabs (they end at ${climbAt}px)`);
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
  // The book's tests for a good Goal are open, with Dorrie's as an example, so
  // they're left out of what's looked through.
  const zedsOwn = await kai.page.$eval(".pt", (el) => {
    const c = el.cloneNode(true);
    for (const x of c.querySelectorAll(".pt-good")) x.remove();
    return c.textContent;
  });
  yes((await text(kai.page, ".pt-where")).includes("Zed’s Night") && !zedsOwn.includes("Clear Dorrie’s name"), "Dorrie's Party tab is Zed's Night's own");
  same(await partyOf(zedsNight.id), null, "and Zed's Night's sheet is untouched");
  same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/party`)).status, 404, "Zed gets nothing of Tuesday Lair's party sheet");
  same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/party`, { dev: "zeds-phone-0001", ops: [{ n: 1, o: "name", v: "Mine now" }] })).status, 404, "and can't change it");
  same((await partyOf(tuesday.id))?.name, "", "Tuesday Lair's crew still has no name");
  const twice = { dev: "sams-phone-0001", ops: [{ n: 1, m: 1, with: `${moId}:nobody`, w: fire, from: null, to: "whole" }, { n: 2, o: "climb", by: 1 }] };
  same((await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, twice)).status, 200, "a change sent from a phone");
  same((await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, twice)).json?.seq, 2, "and sent again, when the answer didn't get back");
  same([(await partyOf(tuesday.id))?.goal?.die, await bondOf(tuesday.id, fire)], [10, "snapped"], "counts once, and a thread with someone who isn't playing goes nowhere");
  // Something sent for a character Sam's not playing here any more goes nowhere.
  const samId = (await user("sam@example.com")).id;
  const stale = await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, { dev: "sams-phone-0002", ops: [{ n: 1, m: 1, ch: "bram-oldone", with: `${kaiId}:vesk-aaaaaa`, w: fire, from: "snapped", to: "whole" }], face: { ch: "bram-oldone", asp: { text: "Not Bram’s at all", die: 12 }, threads: [] } });
  same([stale.status, await bondOf(tuesday.id, fire)], [200, "snapped"], "a mend from a character Sam's left behind doesn't land");
  yes(!((await rows("SELECT face FROM member WHERE campaignId = ?1 AND userId = ?2", tuesday.id, samId))[0]?.face ?? "").includes("Not Bram"), "and nor does what his phone shared for them");

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
  await until(() => mo.page.evaluate((id) => !JSON.parse(localStorage.getItem("zi-party") || "{}").k?.[id]?.out?.length, tuesday.id), "the climb's answer back on Mo's phone");
  yes((await text(mo.page, "#cc-toast")).includes("The Goal’s at d4 now."), "a phone's own change isn't news to it");
  await mo.page.click('#cc-toast [data-act="pundo"]');
  await until(async () => (await partyOf(tuesday.id))?.goal?.die === 2, "and Undo takes it back");

  // The Goal's six sizes stay in one row on the narrowest phone.
  await kai.page.setViewportSize({ width: 320, height: 700 });
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=party`);
  await kai.page.waitForSelector(".pt-ladder");
  same(await kai.page.$$eval(".pt-ladder .cc-ringbtn", (els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size), 1, "the Goal's sizes in one row at 320 wide");
  await axe(kai.page, "party tab, 320");
  await kai.page.setViewportSize({ width: 390, height: 844 });

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

  // ------------------------------------------------------------ 6. telegraphs on phones
  console.log("6. Telegraphs on phones");
  const tableOf = async (id, page = mo.page) => (await got(page, "GET", `/api/campaigns/${id}/table`)).json;
  const teleOf = async (who) => (await tableOf(tuesday.id))?.rounds?.flatMap((r) => r.tele).find((t) => t.who === who) ?? null;
  const card = (page, who) => page.locator(`li.tg:has(h3:text-is("${who}"))`);
  const cardText = async (page, who) => ((await card(page, who).count()) ? card(page, who).first().textContent() : "");

  // Kai has Vesk's play screen open, and Sam has Bram's.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa`);
  await kai.page.waitForSelector(".cc-tiles");
  await sam.page.goto(`${BASE}/characters/?c=bram-ssssss`);
  await sam.page.waitForSelector(".cc-tiles");
  same(await kai.page.$(".tg-play"), null, "no telegraphs on Vesk's play screen before there's a round");

  // Mo opens Tuesday Lair: the round's at the top, above the party, and live.
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector(".tg-sec");
  await until(async () => Boolean(await mo.page.$(".tg-sec .tg-net.is-live")), "Mo's phone live on the table");
  yes(await mo.page.evaluate(() => document.querySelector(".tg-sec").getBoundingClientRect().top < document.querySelector('[aria-labelledby="k-party"]').getBoundingClientRect().top), "the round sits above the party on the GM's page");
  // He telegraphs the left Warden's d10 at Vesk, built as the card it'll be.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  await mo.page.click('.tg-target:has-text("Vesk")');
  await mo.page.click('.tg-size[data-d="10"]');
  await mo.page.fill("#tg-who", "The left Warden");
  await mo.page.fill("#tg-does", "Pin Vesk against the wall");
  same(await mo.page.textContent(".tg-preview h3"), "The left Warden", "the card as it'll go out, while he types");
  has(await mo.page.textContent(".tg-preview footer"), "At Vesk", "aimed at Vesk");
  await shot(mo.page, "tele-compose");
  await axe(mo.page, "telegraphing, dark");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  // And the brute's d8 at Bram, started with Hurt.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  await mo.page.click('.tg-target:has-text("Bram")');
  await mo.page.fill("#tg-who", "The brute");
  await mo.page.click('.tg-size[data-d="8"]');
  await mo.page.click('.tg-verbs [data-v="Hurt"]');
  same(await mo.page.inputValue("#tg-does"), "Hurt Bram", "starting it with Hurt names who it's at");
  await mo.page.fill("#tg-does", "Bring the club down on Bram");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await mo.page.$$eval(".tg-sec li.tg.is-draft h3", (els) => els.map((e) => e.textContent)), ["The left Warden", "The brute"], "round 1, built and not sent yet");
  same((await tableOf(tuesday.id))?.rounds?.length, 0, "nothing goes out till it's sent");
  if (SHOTS) {
    await mo.page.evaluate(() => document.querySelector(".tg-sec").scrollIntoView());
    await shot(mo.page, "tele-drafts");
  }
  await mo.page.click('.tg-sec [data-do="send"]');

  // Each one's on its player's play screen in a second or two.
  let sentAt = Date.now();
  await until(async () => (await cardText(kai.page, "The left Warden")).includes("Pin Vesk against the wall"), "the Warden on Vesk's play screen", 4000);
  const vAt = Date.now() - sentAt;
  yes(vAt < 4000, `on Vesk's play screen ${vAt}ms after it was sent`);
  yes(Boolean(await kai.page.$('li.tg [data-do="answer"]')), "with Answer it on the card");
  has(await text(kai.page, "#cc-toast"), "The left Warden’s telegraphing at Vesk: a d10.", "and a toast saying it's coming");
  yes(Boolean(await kai.page.$(".tg-play .tg-row:has-text('The brute') [data-do='answer']")), "the brute at Bram's there too, face up, and Kai can answer it for him");
  await until(async () => (await cardText(sam.page, "The brute")).includes("Bring the club down on Bram"), "the brute on Bram's play screen", 4000);
  await until(async () => (await cardText(mo.page, "The left Warden")).includes("On Kai’s phone") && (await cardText(mo.page, "The brute")).includes("On Sam’s phone"), "Mo's page says both phones have theirs", 4000);
  const top = await kai.page.evaluate(() => Math.round(document.querySelector('.tg-play [data-do="answer"]').getBoundingClientRect().bottom));
  yes(top <= 844 - 70, `Answer it in Vesk's first screen (it ends at ${top}px)`);
  await shots(kai.page, "tele-play", '.tg-play [data-do="answer"]');
  await axe(kai.page, "a telegraph on the play screen");

  // Kai answers it on Vesk's play screen: Sneak, and the roll card takes the d10.
  await kai.page.click('.tg-play li.tg [data-do="answer"]');
  await kai.page.waitForSelector(".tg-acts");
  has(await kai.page.textContent("#cc-dialog .tg-pick"), "Win and it never lands", "what answering does, on the card");
  if (SHOTS) await kai.page.waitForTimeout(500);
  await shot(kai.page, "tele-pick");
  await axe(kai.page, "picking the answer");
  await kai.page.click('.tg-acts [data-do="with"]:has-text("Sneak")');
  await kai.page.waitForSelector('#cc-dialog [data-act="vs"][data-v="10"][aria-pressed="true"]');
  has(await kai.page.textContent("#cc-dialog .tg-for"), "The left Warden’s d10", "the roll card says what it's answering");
  await kai.page.evaluate(() => window.ziCompanion.setDice([5, 4]));
  await kai.page.click('#cc-dialog [data-act="go"]');
  await kai.page.waitForSelector("#cc-dialog .tg-verdict");
  has(await kai.page.textContent("#cc-dialog .tg-verdict"), "Stopped. It never lands.", "her 5 beats its 4");
  sentAt = Date.now();
  await until(async () => (await cardText(mo.page, "The left Warden")).includes("Stopped. Vesk answered it with Sneak: 5 against its 4."), "Kai's answer on Mo's page", 4000);
  const mAt = Date.now() - sentAt;
  yes(mAt < 4000, `Mo sees it ${mAt}ms after she rolled, not 20 seconds`);
  same((await teleOf("The left Warden"))?.ans?.won, true, "the table has it stopped");
  has(await text(mo.page, "#cc-toast"), "Vesk answered the left Warden and stopped it.", "and Mo's told");
  await until(async () => (await text(kai.page, "#cc-dialog .tg-verdict")).includes("Mo has it."), "Kai's roll card says Mo has it");
  if (SHOTS) {
    await kai.page.waitForTimeout(1200);
    await shot(kai.page, "tele-answered");
    await mo.page.evaluate(() => document.querySelector(".tg-sec").scrollIntoView());
    await shot(mo.page, "tele-gm-live");
  }
  await kai.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);

  // Sam has no signal. He answers with real dice tapped in, a 3 against the
  // brute's 6, and it waits on his phone till the signal's back.
  await sam.context.setOffline(true);
  await sam.page.click('.tg-play li.tg [data-do="answer"]');
  await sam.page.waitForSelector(".tg-acts");
  await sam.page.click('.tg-acts [data-do="with"]:has-text("Fight")');
  await sam.page.waitForSelector('#cc-dialog [data-act="vs"][data-v="8"][aria-pressed="true"]');
  await sam.page.click('#cc-dialog [data-act="go-real"]');
  await sam.page.click('#cc-dialog [data-act="pad"][data-k="p0"][data-v="3"]');
  await sam.page.click('#cc-dialog [data-act="pad"][data-k="opp"][data-v="6"]');
  await sam.page.click('#cc-dialog [data-act="pad-done"]');
  await sam.page.waitForSelector("#cc-dialog .tg-verdict");
  has(await sam.page.textContent("#cc-dialog .tg-verdict"), "It lands now, and there’s no defence against it.", "his 3 doesn't beat its 6");
  has(await sam.page.textContent("#cc-dialog .tg-verdict"), "It goes up to Mo when you’ve got a signal.", "and it waits for a signal");
  await sam.page.waitForTimeout(1500);
  same((await teleOf("The brute"))?.ans ?? null, null, "nothing's reached the table yet");
  await sam.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  has(await text(sam.page, ".tg-play"), "It goes up to Mo when you’ve got a signal.", "Bram's play screen says so too");
  await shot(sam.page, "tele-offline");
  await sam.context.setOffline(false);
  await until(async () => (await teleOf("The brute"))?.ans?.real === true, "Sam's answer reaching the table once he's back", 10000);
  await until(async () => (await cardText(mo.page, "The brute")).includes("It landed then and there. Bram’s Fight came up 3 against its 6"), "and Mo's page", 4000);
  has(await cardText(mo.page, "The brute"), "real dice", "marked as real dice");

  // Mid-round, Mo sends the maid's fear at Vesk, a d4.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  has(await mo.page.textContent("#cc-dialog .dlg-foot"), "Send it now", "mid-round, it goes straight out");
  await mo.page.click('.tg-target:has-text("Vesk")');
  await mo.page.fill("#tg-who", "The maid");
  await mo.page.click('.tg-size[data-d="4"]');
  await mo.page.click('#cc-dialog [data-do="kind"][data-k="fear"]');
  await mo.page.click('.tg-verbs [data-v="Frighten"]');
  await mo.page.click('#cc-dialog [data-do="save"]');
  await until(async () => (await cardText(kai.page, "The maid")).includes("Frighten Vesk"), "the maid on Vesk's play screen", 4000);
  has(await cardText(kai.page, "The maid"), "Lands on Confidence at the end of the round", "against her Confidence");
  // One sent at Bram by mistake comes back with a second tap, and Sam's told.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  await mo.page.click('.tg-target:has-text("Bram")');
  await mo.page.fill("#tg-who", "The cook");
  await mo.page.click('.tg-size[data-d="2"]');
  await mo.page.fill("#tg-does", "Throw a pan at Bram");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await until(async () => (await cardText(sam.page, "The cook")).includes("Throw a pan"), "the cook on Bram's play screen", 4000);
  await card(mo.page, "The cook").locator('[data-do="take"]').click();
  await card(mo.page, "The cook").locator('[data-do="take"]').click();
  await until(async () => !(await sam.page.$('li.tg:has(h3:text-is("The cook"))')), "the cook gone from Bram's play screen", 4000);
  has(await text(sam.page, "#cc-toast"), "Mo took back the cook’s telegraph at Bram.", "and Sam's told");
  same((await teleOf("The cook")), null, "and from the table");
  // He ends the round, with a second tap. It lands on Vesk, and Kai rolls
  // When it lands with the d4 already in.
  await mo.page.click('.tg-sec [data-do="end"]');
  has(await mo.page.textContent('.tg-sec [data-do="end"]'), "Tap again", "ending the round asks for a second tap");
  await mo.page.click('.tg-sec [data-do="end"]');
  await until(async () => Boolean(await kai.page.$('li.tg:has(h3:text-is("The maid")) [data-do="land"]')), "the maid landed on Vesk's play screen", 4000);
  yes(await kai.page.$eval('.tile[data-act="defence"]', (el) => el.classList.contains("is-owed")), "When it lands says something's landed");
  await kai.page.click('li.tg:has(h3:text-is("The maid")) [data-do="land"]');
  await kai.page.waitForSelector('#cc-dialog [data-act="d-go"]');
  same(await kai.page.$eval('#cc-dialog [data-act="d-against"][data-v="confidence"]', (el) => el.getAttribute("aria-pressed")), "true", "against her Confidence");
  yes(await kai.page.$eval('#cc-dialog [data-act="d-against"][data-v="blows"]', (el) => el.disabled), "and it stays that way, since the GM said it's fear");
  same(await kai.page.$$eval("#cc-dialog .cc-incoming .zd-die", (els) => els.map((el) => el.dataset.d)), ["4"], "the maid's d4 already in");
  if (SHOTS) await kai.page.waitForTimeout(400);
  await shot(kai.page, "tele-land");
  await kai.page.evaluate(() => window.ziCompanion.setDice([2, 3]));
  await kai.page.click('#cc-dialog [data-act="d-go"]');
  await kai.page.waitForSelector("#cc-dialog .res .res-out");
  same(await kai.page.$$eval("#cc-dialog .res-out", (els) => els.map((el) => el.textContent)), ["Gets through"], "her 2 doesn't stop its 3");
  await kai.page.click('#cc-dialog [data-act="d-pay"][data-what="shake"]');
  await until(async () => (await cardText(mo.page, "The maid")).includes("It got through. Vesk’s Confidence came up 2 against its 3."), "what got through, on Mo's page", 4000);
  await until(async () => (await cardText(mo.page, "The maid")).includes("Confidence down to d6"), "and what it cost", 4000);
  // Kai's Undo takes it back off Mo's page: first the cost, then the roll.
  await kai.page.click('#cc-dialog .dlg-foot [data-act="undo"]');
  await until(async () => !(await cardText(mo.page, "The maid")).includes("Confidence down"), "the cost undone on Mo's page", 4000);
  await kai.page.click('#cc-dialog .dlg-foot [data-act="undo"]');
  await until(async () => (await cardText(mo.page, "The maid")).includes("It landed. Vesk rolls When it lands next."), "the roll undone on Mo's page", 4000);
  await kai.page.click("#cc-dialog .cc-x");
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  has(await mo.page.textContent(".tg-sec .tg-sum"), "Over.", "round 1's over on Mo's page");
  if (SHOTS) {
    await mo.page.evaluate(() => document.querySelector(".tg-sec").scrollIntoView());
    await shot(mo.page, "tele-gm-top");
  }
  await shots(mo.page, "tele-gm", ".tg-sec li.tg");
  await axe(mo.page, "the round on the GM's page");

  // A phone that's lost everything gets the round back from the server.
  await kai.page.evaluate(() => localStorage.removeItem("zi-table"));
  await kai.page.reload();
  await until(async () => Boolean(await kai.page.$('li.tg:has(h3:text-is("The maid")) [data-do="land"]')), "the round back on Vesk's play screen from the server", 6000);

  // Nothing crosses between campaigns.
  same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/table`)).status, 404, "Zed gets nothing of Tuesday Lair's table");
  same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/table`, { dev: "zeds-phone-0001", ops: [{ n: 1, o: "fight" }] })).status, 404, "and can't change it");
  same((await tableOf(zedsNight.id, zed.page))?.rounds, [], "Zed's Night's table is empty");
  same((await tableOf(tuesday.id))?.rounds?.length, 1, "Tuesday Lair's round is still there");
  await kai.page.goto(`${BASE}/characters/?c=dorrie-eeeeee`);
  await kai.page.waitForSelector(".cc-tiles");
  await kai.page.waitForTimeout(800);
  same(await kai.page.$(".tg-play"), null, "Kai's Dorrie, in Zed's Night, sees none of Tuesday Lair's telegraphs");
  // A socket opened from another site with Mo's sign-in is turned away.
  const cookie = (await mo.context.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const { WebSocket: NodeWS } = await import("ws");
  const tried = (origin) => new Promise((resolve) => {
    const ws = new NodeWS(`ws://localhost:${PORT}/api/campaigns/${tuesday.id}/table`, { headers: { cookie, origin } });
    ws.on("open", () => (ws.close(), resolve("open")));
    ws.on("unexpected-response", (req, res) => resolve(res.statusCode));
    ws.on("error", () => resolve("error"));
  });
  same(await tried(BASE), "open", "a socket from the site's own page opens");
  same(await tried("https://elsewhere.example"), 403, "and one from another site is turned away");

  // ------------------------------------------------------------ 7. the world
  // Mo's Tuesday Lair, with Kai playing Vesk in it, and Zed's Night next door.
  async function checkWorld() {
    const W = JSON.parse(readFileSync(join("src", "generated", "book.json"), "utf8")).companion.worlds;
    const brine = W.boards.find((b) => b.id === "brinewake");
    const [fleet, tarrant] = brine.cards;
    const worldOf = async (id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const factionIn = async (id, name) => (await worldOf(id))?.factions.find((f) => f.name === name) ?? null;
    // Every faction in the book is one die: 1 step, plus its assets that add Power.
    const powerOf = (card) => `d${2 * (1 + card.assets.filter((a) => a.power).length)}`;
    const playerWorld = async (page = kai.page, id = tuesday.id) => (await got(page, "GET", `/api/campaigns/${id}/world`)).json?.world;
    const tok = (name) => `.wb-tok-a:has(b.wb-tok-n:text-is("${name}"))`;
    const line = (words) => `.pt-line:not(.pt-pick):has(b:text-is("${words}"))`;
    async function wbFold(page, key) {
      const sel = `details[data-open^="wb-${key}-"]`;
      await page.waitForSelector(sel, { state: "attached" });
      if (!(await page.$eval(sel, (el) => el.open))) await page.click(`${sel} > summary`);
    }
    const toBoard = async (page) => {
      await page.goto(`${BASE}/characters/?camp=${tuesday.id}&world`);
      await page.waitForSelector(".wb-crew");
    };
    const openFaction = async (page, name) => {
      await page.click(tok(name));
      await until(async () => (await page.textContent("#app h1").catch(() => "")) === name, `${name}'s page`);
    };
    const power = (page) => page.textContent(".wb-card-v");

    // Mo opens Tuesday Lair's world from its page, and the board's empty but
    // for the crew's own card.
    await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
    await mo.page.waitForSelector(".wb-tile-a");
    await mo.page.click(".wb-tile-a");
    await mo.page.waitForSelector(".wb-crew");
    has(await text(mo.page, "#app"), "Nothing on the board yet", "an empty board says so");
    // He brings in Brinewake's board: its four cards, each as the chapter has it.
    await mo.page.click('details[data-open="wb-bring"] > summary');
    await mo.page.click('[data-do="bring"][data-b="brinewake"]');
    await until(async () => (await mo.page.$$(".wb-tok")).length === 4, "Brinewake's four factions on the board");
    same(await mo.page.$$eval(".wb-tok-n", (els) => els.map((e) => e.textContent)), brine.cards.map((c) => c.name), "Brinewake's factions, in the book's order");
    same(await mo.page.$$eval(".wb-tok-die", (els) => els.map((e) => e.getAttribute("aria-label"))), brine.cards.map((c) => `Power ${powerOf(c)}`), "each one's Power counted from its assets, the way the chapter has it");
    await until(async () => (await worldOf(tuesday.id))?.factions.length === 4, "the board on the server");
    yes((await worldOf(tuesday.id)).factions.every((f) => !Object.values(f.shown ?? {}).some(Boolean)), "with nothing shown to the crew");
    same((await playerWorld())?.factions, [], "so Kai's phone gets none of it");
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
    await kai.page.waitForSelector(".wb-tab .wb-crew");
    await until(async () => (await text(kai.page, ".wb-tab")).includes("hasn’t shown you any of the world yet"), "Vesk's World tab, with nothing shown yet");

    // The Steeplands too, on a second tap since there's a board already, with
    // the Vane Estate's whole card from Factions.
    await mo.page.click('[data-do="bring"][data-b="steeplands"]');
    has(await mo.page.textContent('[data-do="bring"][data-b="steeplands"]'), "Tap again", "a second board takes a second tap");
    await mo.page.click('[data-do="bring"][data-b="steeplands"]');
    await until(async () => (await mo.page.$$(".wb-tok")).length === 8, "the Steeplands' four on the board too");
    await openFaction(mo.page, "The Vane Estate");
    same(await power(mo.page), "d12", "the Estate's a d12");
    await wbFold(mo.page, "assets");
    has(await text(mo.page, "#app"), "Relic: The Inkwell", "with its relic, off its whole card");
    await wbFold(mo.page, "bonds");
    has(await text(mo.page, "#app"), "The guard’s been on the same pay for twenty years", "and its Loyalty thread");

    // The book's example: burn the vineyards, take the tolls, and Vane picks
    // Hired Swords to go unpaid. That's a d10.
    await wbFold(mo.page, "res");
    await mo.page.click(`${line("Vineyards")} [data-do="tick"]`);
    await mo.page.waitForSelector(line("Vineyards"), { state: "detached" });
    await mo.page.click(`${line("River Tolls")} [data-do="edit"]`);
    await mo.page.selectOption('form[data-form="w-line"] select[name="give"]', { label: "The Harbour Guild" });
    await mo.page.click('form[data-form="w-line"] button[type="submit"]');
    await mo.page.waitForSelector(line("River Tolls"), { state: "detached" });
    has(await text(mo.page, ".pt-money.is-short"), "one asset isn’t", "five resources for six assets, so one's unpaid");
    same(await power(mo.page), "d12", "and it's still a d12 till Vane picks");
    await wbFold(mo.page, "power");
    await mo.page.click(`details[data-open^="wb-power-"] ${line("Hired Swords")} [data-do="paid"]`);
    await until(async () => (await power(mo.page)) === "d10", "the Estate a d10 with Hired Swords unpaid");
    await until(async () => {
      const [vane, guild] = [await factionIn(tuesday.id, "The Vane Estate"), await factionIn(tuesday.id, "The Harbour Guild")];
      return vane && !vane.res.some((r) => r.text === "Vineyards" || r.text === "River Tolls") && vane.assets.find((a) => a.text === "Hired Swords")?.off === true && guild?.res.some((r) => r.text === "River Tolls");
    }, "the vineyards gone, the tolls the Guild's and the swords unpaid, on the server");

    // The Household Guard ×2 takes two wins, and Undo puts one back.
    await mo.page.click(`${line("Household Guard")} [data-do="tick"]`);
    await until(async () => (await mo.page.getAttribute(`${line("Household Guard")} .wb-ticks`, "aria-label").catch(() => "")) === "1 of 2 left", "one win ticks one off the Household Guard");
    same(await power(mo.page), "d10", "and it still counts");
    await mo.page.click(`${line("Household Guard")} [data-do="tick"]`);
    await mo.page.waitForSelector(line("Household Guard"), { state: "detached" });
    same(await power(mo.page), "d8", "the second win takes it, and the Estate's a d8");
    await mo.page.click('#cc-toast [data-act="wundo"]');
    await until(async () => (await power(mo.page)) === "d10", "Undo puts the Guard back, a d10 again");
    same(await mo.page.getAttribute(`${line("Household Guard")} .wb-ticks`, "aria-label"), "1 of 2 left", "with one tick left on it");

    // Vane comes home climbs past d12, and it's happened.
    await wbFold(mo.page, "agenda");
    for (let i = 0; i < 4; i++) await mo.page.click('details[data-open^="wb-agenda-"] [data-do="climb"][data-by="1"]');
    await until(async () => (await text(mo.page, 'details[data-open^="wb-agenda-"]')).includes("It’s happened"), "Vane comes home happening past d12");
    has(await text(mo.page, 'details[data-open^="wb-agenda-"]'), "The world changes", "with the book's steps for when an agenda happens");

    // The Harbour Guild makes the Night Boats, handing over Dock Fees and Fast Boats.
    await toBoard(mo.page);
    await openFaction(mo.page, "The Harbour Guild");
    same(await power(mo.page), "d10", "the Guild's a d10");
    await wbFold(mo.page, "minis");
    const mini = 'form[data-form="w-mini"]';
    await mo.page.fill(`${mini} input[name="name"]`, "The Night Boats");
    await mo.page.selectOption(`${mini} select[name="res"]`, { label: "Dock Fees" });
    await mo.page.selectOption(`${mini} select[name="asset"]`, { label: "Fast Boats (+1 Power)" });
    await mo.page.check(`${mini} input[name="out-Acquire"]`);
    await mo.page.check(`${mini} input[name="out-Obstruct"]`);
    await mo.page.fill(`${mini} input[name="loy"]`, "The Guild pays better than the river ever did");
    await mo.page.click(`${mini} button[type="submit"]`);
    await until(async () => (await mo.page.textContent("#app h1").catch(() => "")) === "The Night Boats", "the Night Boats' page");
    same(await power(mo.page), "d4", "the Night Boats are a d4: 1 step, plus Fast Boats");
    has(await text(mo.page, ".wb-head"), "Mini faction of The Harbour Guild", "made by the Guild");
    await toBoard(mo.page);
    same(await mo.page.$$eval(".wb-tok.is-mini .wb-tok-n", (els) => els.map((e) => e.textContent)), ["The Night Boats"], "the Night Boats sit under the Guild");
    same(await mo.page.getAttribute(`${tok("The Harbour Guild")} .wb-tok-die`, "aria-label"), "Power d8", "and the Guild's a d8 without its Fast Boats");

    // Showing the crew. The Tithe Fleet first, then its Power, and Vesk's World
    // tab has each one on its own.
    await openFaction(mo.page, "The Tithe Fleet");
    await mo.page.click('[data-do="show"][data-p="card"]');
    await until(async () => (await playerWorld())?.factions?.length === 1, "the Tithe Fleet on the server for Kai");
    const first = (await playerWorld()).factions[0];
    same([first.name, first.want, first.face, first.secret, first.res.length, first.assets.length, first.agendas.length, first.threads.length], [fleet.name, fleet.want, fleet.face, "", 0, 0, 0, 0], "Kai gets its name, Want and Face, and nothing else");
    await nudge(kai.page);
    await until(async () => (await kai.page.$$(".wb-tok")).length === 1, "the Tithe Fleet on Vesk's World tab");
    same(await kai.page.getAttribute(".wb-tok-die", "aria-label"), "Power not known", "with its Power not known yet");
    await wbFold(mo.page, "power");
    await mo.page.click('details[data-open^="wb-power-"] [data-do="show"][data-p="power"]');
    await until(async () => (await playerWorld())?.factions?.[0]?.assets.length === fleet.assets.filter((a) => a.power).length, "its Power assets on the server for Kai");
    await nudge(kai.page);
    await until(async () => (await kai.page.getAttribute(".wb-tok-die", "aria-label").catch(() => "")) === `Power ${powerOf(fleet)}`, "its Power on Vesk's World tab");
    // Its Secret takes a second tap, and never reaches Kai's phone till then.
    await wbFold(mo.page, "secret");
    await mo.page.click('details[data-open^="wb-secret-"] [data-do="show"][data-p="secret"]');
    await mo.page.waitForTimeout(900);
    same((await factionIn(tuesday.id, "The Tithe Fleet"))?.shown?.secret, false, "one tap doesn't show the Secret");
    yes(!JSON.stringify(await playerWorld()).includes(fleet.secret), "and it isn't on Kai's phone");
    await mo.page.click('details[data-open^="wb-secret-"] [data-do="show"][data-p="secret"]');
    await until(async () => (await playerWorld())?.factions?.[0]?.secret === fleet.secret, "the second tap shows it");
    // A thread toward a faction the crew hasn't been shown stays off Kai's phone.
    await wbFold(mo.page, "threads");
    const tf = 'details[data-open^="wb-threads-"] form[data-form="w-add"]';
    await mo.page.fill(`${tf} input[name="text"]`, "Tarrant money buys our captains");
    await mo.page.check(`${tf} input[value="hostile"]`);
    await mo.page.selectOption(`${tf} select[name="to"]`, { label: "Tarrant & Daughters" });
    await mo.page.click(`${tf} button[type="submit"]`);
    await mo.page.click('details[data-open^="wb-threads-"] [data-do="show"][data-p="threads"]');
    await until(async () => (await playerWorld())?.factions?.[0]?.threads?.length > 0, "the Fleet's threads on the server for Kai");
    same((await playerWorld()).factions[0].threads.map((t) => t.text), fleet.threads.map((t) => t.text), "only its thread toward the crew, not the one toward Tarrant & Daughters");
    // Kai can't change the board.
    const fleetId = (await factionIn(tuesday.id, "The Tithe Fleet")).id;
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0001", ops: [{ n: 1, o: "show", id: fleetId, p: "agenda", v: true }] })).status, 403, "Kai can't change the board");

    // With no signal, Mo's change waits on his phone, and goes up once he's
    // back, counted once.
    await wbFold(mo.page, "res");
    await mo.context.setOffline(true);
    const rf = 'details[data-open^="wb-res-"] form[data-form="w-add"]';
    await mo.page.fill(`${rf} input[name="text"]`, "Wreck Salvage");
    await mo.page.click(`${rf} button[type="submit"]`);
    await until(async () => (await text(mo.page, "#app")).includes("goes up when you’ve got a signal"), "Mo's phone saying it'll go up");
    yes(!(await factionIn(tuesday.id, "The Tithe Fleet")).res.some((r) => r.text === "Wreck Salvage"), "and it hasn't yet");
    await mo.context.setOffline(false);
    await until(async () => (await factionIn(tuesday.id, "The Tithe Fleet")).res.some((r) => r.text === "Wreck Salvage"), "Wreck Salvage on the server once Mo's back");
    const kept = await mo.page.evaluate(() => JSON.parse(localStorage.getItem("zi-world")));
    const salvage = (await factionIn(tuesday.id, "The Tithe Fleet")).res.find((r) => r.text === "Wreck Salvage");
    await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: kept.dev, ops: [{ n: kept.n, o: "add", id: fleetId, l: "res", item: { ...salvage, id: "salvage-two" } }] });
    same((await factionIn(tuesday.id, "The Tithe Fleet")).res.filter((r) => r.text === "Wreck Salvage").length, 1, "and a change sent twice counts once");

    // A made-up change to the book. The Tithe Fleet came in from an older one,
    // with another Want and a resource the book's since dropped, and Tarrant &
    // Daughters' Face had a typo.
    const doc = await worldOf(tuesday.id);
    const old = doc.factions.find((f) => f.name === "The Tithe Fleet");
    old.want = "Every ship pays.";
    old.res.push({ id: "harbour-dues", text: "Old Harbour Dues", x: 1, left: 1 });
    old.book = { ...old.book, h: "older", was: { ...old.book.was, want: "Every ship pays.", res: [...old.book.was.res, { text: "Old Harbour Dues", x: 1 }] } };
    const td = doc.factions.find((f) => f.name === "Tarrant & Daughters");
    const typoFace = td.face.replace("Marguerite", "Margeurite");
    td.face = typoFace;
    td.book = { ...td.book, h: "older", was: { ...td.book.was, face: typoFace } };
    await db.prepare("UPDATE world SET data = ?2, version = version + 1 WHERE campaignId = ?1").bind(tuesday.id, JSON.stringify(doc)).run();
    await mo.page.reload();
    await mo.page.waitForSelector(".wb-book");
    has(await text(mo.page, ".wb-book"), "The book’s changed The Tithe Fleet since you brought it in", "a note on the Fleet's page");
    has(await text(mo.page, ".wb-book"), "Every ship pays", "saying what its Want was");
    has(await text(mo.page, ".wb-book"), "Old Harbour Dues", "and the resource that's gone");
    await mo.page.click('.wb-book [data-take="1"]');
    await until(async () => {
      const f = await factionIn(tuesday.id, "The Tithe Fleet");
      return f.want === fleet.want && !f.res.some((r) => r.text === "Old Harbour Dues") && f.res.some((r) => r.text === "Wreck Salvage") && f.book.h === fleet.h;
    }, "the book's Want taken, Old Harbour Dues gone and Wreck Salvage kept");
    same(await mo.page.$(".wb-book"), null, "and the note's gone");
    await until(async () => (await factionIn(tuesday.id, "Tarrant & Daughters"))?.face === tarrant.face, "the typo fix in Tarrant & Daughters' Face going in quietly");

    // Nothing crosses between campaigns.
    same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/world`)).status, 404, "Zed gets nothing of Tuesday Lair's world");
    same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "zeds-phone-0001", ops: [{ n: 1, o: "gone", id: fleetId }] })).status, 404, "and can't change it");
    same((await playerWorld(zed.page, zedsNight.id))?.factions, [], "Zed's Night's board is empty");
    same((await playerWorld(kai.page, zedsNight.id))?.factions, [], "and Kai gets nothing on it");
    await kai.page.goto(`${BASE}/characters/?c=dorrie-eeeeee&t=world`);
    await kai.page.waitForSelector(".wb-tab .wb-crew");
    await kai.page.waitForTimeout(700);
    yes(!(await text(kai.page, "#app")).includes("Tithe Fleet"), "Kai's Dorrie, in Zed's Night, sees nothing of Tuesday Lair's world");
    // Kai's own campaign has a board too, for when she deletes her account.
    same((await got(kai.page, "POST", `/api/campaigns/${kaisTable.id}/world`, { dev: "kais-phone-0002", ops: [{ n: 1, o: "new", f: { id: "rustbacks", name: "The Rustbacks", want: "To keep flying." } }] })).json?.world?.factions?.length, 1, "Kai puts a faction on her own campaign's board");

    // With no signal, Vesk's World tab still has what Kai's seen.
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa`);
    await kai.page.waitForSelector('.cc-tabs [data-t="world"]');
    await kai.context.setOffline(true);
    await kai.page.click('.cc-tabs [data-t="world"]');
    await kai.page.waitForSelector(".wb-tab .wb-tok");
    has(await text(kai.page, ".wb-tab"), "The Tithe Fleet", "the Tithe Fleet's still on Vesk's World tab with no signal");
    has(await text(kai.page, ".wb-tab"), "No signal, so this is the board as it was", "and it says it's how it was");
    await kai.context.setOffline(false);

    // The World screen, a faction's page and the World tab, at 390 in both themes.
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toBoard(mo.page);
      await axe(mo.page, `the board, ${theme}`);
      await shot(mo.page, `world-board-${theme}`);
      await openFaction(mo.page, "The Tithe Fleet");
      await wbFold(mo.page, "power");
      await axe(mo.page, `a faction's page, ${theme}`);
      await shot(mo.page, `world-faction-${theme}`);
      await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
      await kai.page.waitForSelector(".wb-tab .wb-tok");
      await axe(kai.page, `the World tab, ${theme}`);
      await shot(kai.page, `world-tab-${theme}`);
      await openFaction(kai.page, "The Tithe Fleet");
      await axe(kai.page, `a faction on Kai's phone, ${theme}`);
      await shot(kai.page, `world-faction-player-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));
  }
  console.log("7. The world: the faction board");
  await checkWorld();

  // ------------------------------------------------------------ 8. the faction turn
  async function checkTurn() {
    const T = await import("../src/companion/turn.js");
    const B = await import("../src/companion/board.js");
    const W = JSON.parse(readFileSync(join("src", "generated", "book.json"), "utf8")).companion.worlds;
    const gmWho = { role: "gm" };
    const plWho = { role: "player" };
    // A board from the book, for the rules on their own.
    let n = 0;
    const lid = () => `l${(++n).toString(36).padStart(3, "0")}`;
    const boardFrom = (id) => {
      const doc = T.blank();
      for (const c of W.boards.find((b) => b.id === id).cards) {
        T.applyAll(doc, { o: "new", f: { ...c, id: c.key.slice(0, 24), shown: {}, ...Object.fromEntries(["res", "assets", "agendas", "pub", "mor", "loy"].map((l) => [l, c[l].map((x) => ({ ...x, id: lid() }))])), threads: c.threads.map((x) => ({ ...x, id: lid(), to: "crew" })) } }, gmWho);
      }
      return doc;
    };
    const ok = (r, what) => yes(r.ok, `${what}${r.why ? `: ${r.why}` : ""}`);

    // Two things in one job: the Guild's d10 splits into a d6 to Acquire the
    // Salt Contracts and a d4 to keep its name out of it. The Estate rolls its
    // d12 once, a 4. The d6 comes up 5 and the d4 comes up 2.
    const steep = boardFrom("steeplands");
    const vane = B.find(steep, "the-vane-estate");
    const guild = B.find(steep, "the-harbour-guild");
    same([B.stepsOf(vane), B.stepsOf(guild)], [6, 5], "the rules: the Estate's a d12 and the Guild's a d10");
    ok(T.applyAll(steep, { o: "t-start", id: "rules-one" }, gmWho, { now: 1 }), "the rules: a faction turn starts");
    const salt = vane.res.find((r) => r.text === "Salt Contracts");
    ok(T.applyAll(steep, { o: "t-act", id: "rules-one", a: { by: guild.id, what: "out", out: "Acquire", act: undefined, to: vane.id, thing: { l: "res", lid: salt.id }, vs: "power", split: 3, p2: "quiet" } }, gmWho), "the rules: the Guild's job");
    same(T.partsFor(steep, steep.turn.acts[0]).map((p) => p.dice), [[6], [4]], "the rules: the Guild's split, a d6 and a d4");
    yes(!T.applyAll(steep, { o: "t-roll", id: "rules-one", by: guild.id, r: [[{ d: 6, v: 5 }], [{ d: 4, v: 2 }]] }, gmWho).ok, "the rules: nothing rolls till the actions land");
    T.applyAll(steep, { o: "t-step", id: "rules-one", v: "land" }, gmWho);
    ok(T.applyAll(steep, { o: "t-roll", id: "rules-one", by: guild.id, r: [[{ d: 6, v: 5 }], [{ d: 4, v: 2 }]], def: { f: vane.id, r: [{ d: 12, v: 4 }] } }, gmWho), "the rules: the Guild rolls, and the Estate's d12 with it");
    same(T.resultsOf(steep).get(guild.id).parts.map((p) => p.st), ["won", "lost"], "the rules: the contracts are the Guild's, and the Estate knows who took them");
    yes(!T.applyAll(steep, { o: "t-roll", id: "rules-one", by: guild.id, r: [[{ d: 6, v: 6 }], [{ d: 4, v: 4 }]] }, plWho).ok, "the rules: a player can't roll a faction's dice");
    // Everyone who goes at the Estate after that has to beat the same 4.
    ok(T.applyAll(steep, { o: "t-act", id: "rules-one", a: { by: "crew", what: "out", out: "Destroy", to: vane.id, vs: "power", power: 2, slot: true } }, gmWho), "the rules: the GM sets the crew's action while they land");
    ok(T.applyAll(steep, { o: "t-roll", id: "rules-one", by: "crew", r: [[{ d: 8, v: 4 }]], def: { f: vane.id, r: [{ d: 12, v: 11 }] } }, plWho), "the rules: the crew rolls at the Estate's Power");
    same([steep.turn.def[vane.id][0].v, T.resultsOf(steep).get("crew").parts[0].st], [4, "tie"], "the rules: the Estate's 4 stands for everyone after, so the crew's 4 ties it");
    // The week: Vane comes home at d10, with its Household Guard left out and
    // its Public Sentiment thread a step, so 6 steps, a d12. The crew's d4
    // can't Obstruct it alone, and with Bram's slot in it's a d8. It rolls 5
    // against the d12's 9, which then beats the agenda's 4.
    const week = boardFrom("steeplands");
    const v2 = B.find(week, "the-vane-estate");
    T.applyAll(week, { o: "die", id: v2.id, lid: v2.agendas[0].id, v: 10 }, gmWho);
    T.applyAll(week, { o: "t-start", id: "rules-two" }, gmWho);
    T.applyAll(week, { o: "t-act", id: "rules-two", a: { by: v2.id, what: "agenda", ag: v2.agendas[0].id, left: [v2.assets.find((a) => a.text === "Household Guard").id], fits: [v2.pub[0].id] } }, gmWho);
    same(T.partsFor(week, week.turn.acts[0]).map((p) => p.dice), [[12]], "the rules: 1 step, four assets and a thread make the Estate's d12");
    T.applyAll(week, { o: "t-step", id: "rules-two", v: "tele" }, gmWho);
    const obstruct = { by: "crew", what: "out", out: "Obstruct", act: v2.id, power: 2 };
    yes(!T.applyAll(week, { o: "t-act", id: "rules-two", a: obstruct }, plWho).ok, "the rules: the crew's d4 alone can't Obstruct a d12");
    ok(T.applyAll(week, { o: "t-act", id: "rules-two", a: { ...obstruct, slot: true, slotBy: "Bram" } }, plWho), "the rules: with Bram's slot in, it can");
    same(T.partsFor(week, week.turn.acts[1]).map((p) => p.dice), [[8]], "the rules: two slots count everything twice, so the crew's d4 is a d8");
    T.applyAll(week, { o: "t-step", id: "rules-two", v: "land" }, gmWho);
    T.applyAll(week, { o: "t-roll", id: "rules-two", by: "crew", r: [[{ d: 8, v: 5 }]], at: [[{ d: 12, v: 9 }]] }, plWho);
    T.applyAll(week, { o: "t-roll", id: "rules-two", by: v2.id, r: [[{ d: 12, v: 9 }]], vr: [{ d: 10, v: 4 }] }, gmWho);
    let res = T.resultsOf(week);
    same([res.get("crew").parts[0].st, res.get(v2.id).parts[0].st], ["lost", "won"], "the rules: 5 against the d12's 9, so it goes ahead, and 9 beats the agenda's 4");
    // A tie goes to the faction that telegraphed it, and an extra resource takes it.
    T.applyAll(week, { o: "t-roll", id: "rules-two", by: v2.id, r: [[{ d: 12, v: 8 }]], vr: [{ d: 10, v: 4 }] }, gmWho);
    T.applyAll(week, { o: "t-roll", id: "rules-two", by: "crew", again: true, r: [[{ d: 8, v: 8 }]] }, plWho);
    same(T.resultsOf(week).get("crew").parts[0].st, "tie", "the rules: a tie goes to the faction that telegraphed it");
    yes(!T.applyAll(week, { o: "t-tie", id: "rules-two", p: 0, v: true }, plWho, { extra: 0 }).ok, "the rules: no extra resource, no tie");
    ok(T.applyAll(week, { o: "t-tie", id: "rules-two", p: 0, v: true }, plWho, { extra: 1 }), "the rules: an extra resource takes the tie");
    same(T.resultsOf(week).get(v2.id).stopped, "crew", "the rules: and the Estate's action is stopped");
    // Hiring: the Tithe Fleet's hostile to the crew, and won't take its money.
    const brine = boardFrom("brinewake");
    T.applyAll(brine, { o: "t-start", id: "rules-three" }, gmWho);
    yes(!T.applyAll(brine, { o: "t-hire", id: "rules-three", h: { id: "hire-z", by: "crew", to: "the-tithe-fleet" } }, plWho, { extra: 1 }).ok, "the rules: a player can't pay a faction the crew hasn't been shown");
    for (const f of brine.factions) T.applyAll(brine, { o: "show", id: f.id, p: "card", v: true }, gmWho);
    same(T.applyAll(brine, { o: "t-hire", id: "rules-three", h: { id: "hire-a", by: "crew", to: "the-tithe-fleet" } }, plWho, { extra: 1 }).why, "The Tithe Fleet won’t take the crew’s money. It’s hostile to you.", "the rules: a hostile faction won't take the crew's money");
    ok(T.applyAll(brine, { o: "t-hire", id: "rules-three", h: { id: "hire-b", by: "crew", to: "the-brothers-of-the-lamp" } }, plWho, { extra: 1 }), "the rules: the Brothers will");
    yes(!T.applyAll(brine, { o: "t-hire", id: "rules-three", h: { id: "hire-c", by: "crew", to: "the-drowned-choir" } }, plWho, { extra: 1 }).ok, "the rules: one extra resource pays for one hire");

    // ---------------------------------------------------------- on three phones
    const worldOf = async (id = tuesday.id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const factionIn = async (name) => (await worldOf())?.factions.find((f) => f.name === name) ?? null;
    const turnIn = async () => (await worldOf())?.turn ?? null;
    const playerWorld = async (page = kai.page, id = tuesday.id) => (await got(page, "GET", `/api/campaigns/${id}/world`)).json?.world;
    const partyOf = async () => JSON.parse((await rows("SELECT data FROM party WHERE campaignId = ?1", tuesday.id))[0]?.data ?? "null");
    const ids = {};
    for (const name of ["The Vane Estate", "The Harbour Guild", "The Quiet Order", "The Tithe Fleet", "The Brothers of the Lamp"]) ids[name] = (await factionIn(name)).id;
    const row = (name) => `.wt-row:has(.wt-row-n:text-is("${name}"))`;
    const card = (name) => `.wt-tele:has(h4:text-is("${name}"))`;
    const toWorld = async (page = mo.page) => {
      await page.goto(`${BASE}/characters/?camp=${tuesday.id}&world`);
      await page.waitForSelector(".wb-crew");
    };
    const toTab = async (page, ch) => {
      await page.goto(`${BASE}/characters/?c=${ch}&t=world`);
      await page.waitForSelector(".wb-tab .wb-crew");
    };
    // The phone's dice, fixed: the next rolls come up these faces, in order.
    const fixDice = (page, faces) => page.evaluate((f) => {
      window.__faces = [...(window.__faces ?? []), ...f];
      if (window.__fixed) return;
      window.__fixed = true;
      const real = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = (arr) => {
        if (arr instanceof Uint32Array && window.__faces.length) {
          arr[0] = window.__faces.shift() - 1;
          return arr;
        }
        return real(arr);
      };
    }, faces);
    // One faction's action, set on Mo's phone: what it does, then the rest.
    async function setAct(name, fill) {
      await mo.page.click(`${row(name)} [data-do="t-edit"]`);
      await mo.page.waitForSelector(`${row(name)} form[data-form="w-tact"]`);
      await fill(`${row(name)} form[data-form="w-tact"]`);
      await mo.page.click(`${row(name)} form[data-form="w-tact"] button[type="submit"]`);
      await mo.page.waitForSelector(`${row(name)} form[data-form="w-tact"]`, { state: "detached" });
    }
    const pick = async (form, field, label) => {
      await mo.page.selectOption(`${form} select[name="${field}"]`, label ? { label } : undefined);
      await mo.page.waitForTimeout(80);
    };

    // Ready for the book's example: Hired Swords paid for again, so the Estate's
    // a d12, and a bond thread on the Guild that fits its job, a step on its d8.
    await toWorld();
    await mo.page.click(`.wb-tok-a:has(b.wb-tok-n:text-is("The Vane Estate"))`);
    await mo.page.waitForSelector(".wb-card");
    await mo.page.click('details[data-open^="wb-power-"] > summary');
    await mo.page.click(`details[data-open^="wb-power-"] .pt-line:has(b:text-is("Hired Swords")) [data-do="paid"]`);
    await until(async () => (await mo.page.textContent(".wb-card-v")) === "d12", "the Estate a d12 again");
    await toWorld();
    await mo.page.click(`.wb-tok-a:has(b.wb-tok-n:text-is("The Harbour Guild"))`);
    await mo.page.waitForSelector(".wb-card");
    await mo.page.click('details[data-open^="wb-bonds-"] > summary');
    const pubForm = 'details[data-open^="wb-bonds-"] form[data-form="w-add"][data-l="pub"]';
    await mo.page.fill(`${pubForm} input[name="text"]`, "The docks trust the Guild’s scales");
    await mo.page.click(`${pubForm} button[type="submit"]`);
    await until(async () => (await factionIn("The Harbour Guild"))?.pub.length === 1, "the Guild's Public Sentiment thread on the server");
    // The Brothers of the Lamp shown to the crew, and two more resources on the
    // party sheet, so the crew's got an extra one.
    await toWorld();
    await mo.page.click(`.wb-tok-a:has(b.wb-tok-n:text-is("The Brothers of the Lamp"))`);
    await mo.page.click('[data-do="show"][data-p="card"]');
    await until(async () => (await factionIn("The Brothers of the Lamp"))?.shown.card === true, "the Brothers shown to the crew");
    await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/party`, { dev: "sams-phone-0101", ops: [{ n: 1, o: "add", l: "res", item: { id: "salvage", text: "Salvage rights" } }, { n: 2, o: "add", l: "res", item: { id: "harbour-work", text: "Harbour work" } }] });
    const crewMoney = (await partyOf());
    same([crewMoney.res.length, crewMoney.assets.length], [3, 2], "three resources for two assets on the party sheet, so one's extra");

    // Mo starts downtime 1's faction turn, and Kai's phone has it.
    await toWorld();
    await mo.page.click('[data-do="t-start"]');
    await until(async () => (await turnIn())?.step === "hire", "downtime 1's faction turn on the server");
    has(await text(mo.page, ".wt"), "Hiring comes first", "Mo's phone opens on hiring");
    await toTab(kai.page, "vesk-aaaaaa");
    await until(async () => (await text(kai.page, ".wb-tab")).includes("Downtime 1: the faction turn"), "the faction turn on Vesk's World tab");
    await until(async () => (await text(kai.page, ".wt")).includes("The crew’s got one extra resource this downtime"), "the crew's extra resource on Kai's phone");
    // The Tithe Fleet won't take the crew's money, and the Brothers will.
    const hireForm = '.wt form[data-form="w-thire"]';
    await kai.page.selectOption(`${hireForm} select[name="to"]`, { label: "The Tithe Fleet" });
    await kai.page.fill(`${hireForm} input[name="text"]`, "Look the other way");
    await kai.page.click(`${hireForm} button[type="submit"]`);
    await until(async () => (await text(kai.page, "#cc-toast")).includes("won’t take the crew’s money"), "Kai's phone saying the Fleet won't take it");
    yes(!(await turnIn()).hires.length, "and nobody's hired on the server");
    await until(async () => (await kai.page.$(hireForm)) && (await kai.page.$$(`${hireForm} option`)).length === 2, "the hiring form back on Kai's phone");
    await kai.page.selectOption(`${hireForm} select[name="to"]`, { label: "The Brothers of the Lamp" });
    await kai.page.fill(`${hireForm} input[name="text"]`, "Stop the Fleet closing the Combs");
    await kai.page.click(`${hireForm} button[type="submit"]`);
    await until(async () => (await turnIn())?.hires.some((h) => h.by === "crew" && h.to === ids["The Brothers of the Lamp"]), "the crew paying the Brothers, on the server");

    // Mo gets every faction's action ready.
    await nudge(mo.page);
    await until(async () => (await text(mo.page, row("The Brothers of the Lamp"))).includes("The crew’s paying it"), "Mo's phone showing the crew's paying the Brothers");
    await setAct("The Harbour Guild", async (form) => {
      await pick(form, "what", "Acquire");
      await pick(form, "to", "The Vane Estate");
      await pick(form, "thing", "Salt Contracts (resource)");
      await mo.page.check(`${form} input[name^="fit-"]`);
      await mo.page.waitForTimeout(80);
      await mo.page.check(`${form} input[name="split"]`);
      await mo.page.waitForTimeout(80);
      await pick(form, "first", "d6 and d4");
      await mo.page.check(`${form} input[name="shown"]`);
    });
    has(await text(mo.page, row("The Harbour Guild")), "Acquire: the Vane Estate’s Salt Contracts, and keeps its name out of it", "the Guild's job, the book's way");
    has(await text(mo.page, row("The Harbour Guild")), "d6 and d4", "with its d6 and its d4");
    await setAct("The Tithe Fleet", async () => {});
    has(await text(mo.page, row("The Tithe Fleet")), "Works its agenda, Close the Combs, at d4", "the Fleet working Close the Combs, its own agenda being where it starts");
    await setAct("The Brothers of the Lamp", async (form) => {
      await pick(form, "what", "Obstruct");
      await mo.page.selectOption(`${form} select[name="act"]`, ids["The Tithe Fleet"]);
      await mo.page.waitForTimeout(80);
      await mo.page.check(`${form} input[name="shown"]`);
    });
    await setAct("The Vane Estate", async (form) => {
      await pick(form, "what", "Writes a new agenda");
      await mo.page.fill(`${form} input[name="nt"]`, "Buy back the vineyards");
    });
    has(await text(mo.page, row("The Vane Estate")), "Off-screen", "the Estate's new agenda kept off-screen");
    await setAct("The Quiet Order", async (form) => {
      await pick(form, "what", "Comes for the crew");
      await mo.page.check(`${form} input[name="shown"]`);
    });
    await until(async () => (await turnIn())?.acts.filter((a) => a.by !== "crew").length === 5, "five factions' actions on the server");
    const order = (await turnIn()).acts.find((a) => a.by === ids["The Quiet Order"]);
    yes(order?.table?.r >= 1 && order.table.d2 >= 1, "the Order's d12 rolled as it's telegraphed, after a d2, since it's got no threads toward the crew");
    same((await playerWorld()).turn.acts.filter((a) => a.by !== "crew").length, 0, "nothing's on Kai's phone till Mo sends them");

    // He sends them: a second tap, since four factions have no action.
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    has(await mo.page.textContent('[data-do="t-step"][data-v="tele"]'), "Tap again", "a second tap, with factions doing nothing");
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    await until(async () => (await turnIn())?.step === "tele", "the telegraphs out, on the server");
    yes((await factionIn("The Quiet Order")).shown.card && (await factionIn("The Harbour Guild")).shown.card, "the factions named in the telegraphs shown to the crew");
    const sent = await playerWorld();
    same(sent.turn.acts.filter((a) => a.by !== "crew").map((a) => a.byName).sort(), ["The Brothers of the Lamp", "The Harbour Guild", "The Quiet Order", "The Tithe Fleet"], "Kai gets the four telegraphs");
    yes(!JSON.stringify(sent).includes("Buy back the vineyards"), "and nothing of the Estate's action, off-screen");
    yes(!JSON.stringify(sent.turn).includes("left") && !sent.turn.acts.some((a) => a.fits), "nor how Mo counted any faction's dice");
    await nudge(kai.page);
    await until(async () => (await kai.page.$$(".wt-tele")).length >= 4, "four telegraphs on Vesk's World tab");
    has(await text(kai.page, card("The Harbour Guild")), "Acquire: the Vane Estate’s Salt Contracts, and keeps its name out of it", "the Guild's telegraph on Kai's phone");
    same(await kai.page.getAttribute(card("The Harbour Guild"), "aria-label"), "The Harbour Guild: d6 and d4, against d12", "with its dice and the Estate's d12");
    has(await text(kai.page, card("The Quiet Order")), "d12:", "and the Order's roll on the table, so the crew knows what's coming");

    // Sam, with no signal, picks the crew's action: Obstruct the Order. Its d8's
    // bigger than the crew's d6, so it takes Bram's slot in.
    await toTab(sam.page, "bram-ssssss");
    await until(async () => (await sam.page.$$(".wt-tele")).length >= 4, "the telegraphs on Bram's World tab");
    await sam.context.setOffline(true);
    await sam.page.click('.wt [data-do="t-edit"][data-k="crew"]');
    const crewForm = '.wt form[data-form="w-tcrew"]';
    await sam.page.selectOption(`${crewForm} select[name="what"]`, { label: "Obstruct" });
    await sam.page.waitForTimeout(80);
    await sam.page.selectOption(`${crewForm} select[name="act"]`, { label: "The Quiet Order: comes for the crew" });
    await sam.page.waitForTimeout(80);
    has(await text(sam.page, crewForm), "bigger than the crew", "Sam's phone saying the Order's too big for the crew's action alone");
    yes(await sam.page.$eval(`${crewForm} button[type="submit"]`, (b) => b.disabled), "so it can't be saved like that");
    await sam.page.check(`${crewForm} input[name="slot"]`);
    await sam.page.waitForTimeout(80);
    await sam.page.fill(`${crewForm} input[name="slotBy"]`, "Bram");
    await sam.page.click(`${crewForm} button[type="submit"]`);
    await until(async () => (await text(sam.page, ".wt")).includes("Bram’s personal slot’s in"), "the crew's action on Sam's phone, with no signal");
    has(await text(sam.page, ".wb-tab"), "goes up when you’ve got a signal", "and it says it goes up when there's a signal");
    yes(!(await turnIn()).acts.some((a) => a.by === "crew"), "it hasn't gone up yet");
    await sam.context.setOffline(false);
    await until(async () => (await turnIn())?.acts.find((a) => a.by === "crew")?.slot === true, "the crew's action on the server once Sam's back");
    same(T.partsFor(T.readable(await worldOf()), (await turnIn()).acts.find((a) => a.by === "crew")).map((p) => p.dice), [[12]], "the crew's d6 with Bram's slot in, a d12");
    await nudge(kai.page);
    await until(async () => (await text(kai.page, ".wt-crew")).includes("Obstructs the Quiet Order’s action"), "the crew's action on Kai's phone");
    // Kai can't set a faction's action or roll its dice.
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0101", ops: [{ n: 1, o: "t-act", id: (await turnIn()).id, a: { by: ids["The Tithe Fleet"], what: "comes" } }] })).status, 403, "Kai can't set a faction's action");
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0101", ops: [{ n: 2, o: "t-roll", id: (await turnIn()).id, by: ids["The Tithe Fleet"], r: [[{ d: 10, v: 10 }]] }] })).status, 403, "or roll its dice");

    // The actions land.
    await nudge(mo.page);
    await until(async () => (await text(mo.page, ".wt-crew")).includes("Obstructs the Quiet Order’s action"), "the crew's action on Mo's phone");
    await mo.page.click('[data-do="t-step"][data-v="land"]');
    await until(async () => (await turnIn())?.step === "land", "the actions landing, on the server");
    has(await text(mo.page, ".wt"), "Obstructs first", "Obstructs first");
    // Real dice, tapped in: the Guild's 5 and 2, and the Estate's d12 a 4.
    const realIn = async (name, faces) => {
      await mo.page.click(`${card(name)} [data-do="t-real"]`);
      const form = `${card(name)} form[data-form="w-treal"]`;
      await mo.page.waitForSelector(form);
      for (const [k, v] of Object.entries(faces)) await mo.page.selectOption(`${form} select[name="${k}"]`, String(v));
      await mo.page.click(`${form} button[type="submit"]`);
      await mo.page.waitForSelector(form, { state: "detached" });
    };
    await realIn("The Harbour Guild", { "r-0-0": 5, "r-1-0": 2, "def-0": 4 });
    has(await text(mo.page, card("The Harbour Guild")), "5 beats 4: it wins", "Two things in one job: the d6's 5 beats the Estate's 4");
    has(await text(mo.page, card("The Harbour Guild")), "2 against 4: the Vane Estate knows exactly who did it", "and the d4's 2 doesn't");
    // The Fleet's d10 a 6 against Close the Combs' d4 a 3, and the Brothers' d6 a 4 against its 6.
    await realIn("The Tithe Fleet", { "r-0-0": 6, "vr-0": 3 });
    await realIn("The Brothers of the Lamp", { "r-0-0": 4 });
    has(await text(mo.page, card("The Brothers of the Lamp")), "4 against 6", "the Brothers lose to the Fleet's 6");
    has(await text(mo.page, card("The Tithe Fleet")), "6 beats 3: the agenda climbs", "so Close the Combs climbs");
    // Sam rolls the crew's dice: a 5, and the Order's d8 a 5 too. A tie goes to
    // the Order, and the crew's extra resource paid the Brothers, so he rolls
    // again for 1 Resolve: a 9.
    await nudge(sam.page);
    await until(async () => (await sam.page.$('.wt [data-do="t-roll"][data-by="crew"]')) != null, "Roll the crew's dice on Sam's phone");
    await fixDice(sam.page, [5, 5]);
    await sam.page.click('.wt [data-do="t-roll"][data-by="crew"]');
    await until(async () => (await text(sam.page, ".wt-tele.is-crew")).includes("5 ties 5"), "a tie on Sam's phone");
    has(await text(sam.page, ".wt-tele.is-crew"), "a tie goes to the Quiet Order", "and it goes to the Order");
    yes(await sam.page.$eval('.wt [data-do="t-tie"]', (b) => b.disabled), "the crew's extra resource is spent, so it can't take the tie");
    await fixDice(sam.page, [9]);
    await sam.page.click('.wt [data-do="t-again"]');
    await until(async () => (await text(sam.page, ".wt-tele.is-crew")).includes("9 beats 5"), "9 beats the Order's 5 on Sam's phone");
    await until(async () => T.resultsOf(T.readable(await worldOf())).get(ids["The Quiet Order"])?.stopped === "crew", "the Order's action stopped, on the server");
    same((await turnIn()).acts.find((a) => a.by === "crew").again, 1, "and the crew rolled again once");
    await nudge(kai.page);
    await until(async () => (await text(kai.page, card("The Quiet Order"))).includes("Stopped"), "the Order's action stopped on Kai's phone");

    // Mo puts it all on the cards: the contracts move, the Estate knows, Close
    // the Combs climbs and the Estate's new agenda goes on its card.
    await nudge(mo.page);
    await until(async () => (await text(mo.page, card("The Quiet Order"))).includes("Stopped"), "the Order stopped on Mo's phone");
    yes(!(await mo.page.$('[data-do="t-rollall"]')), "every faction's dice are rolled");
    await mo.page.click(`${card("The Harbour Guild")} form[data-form="w-tout"] button[type="submit"]`);
    await mo.page.fill(`${card("The Harbour Guild")} form[data-form="w-tknow"] input[name="text"]`, "Took our Salt Contracts");
    await mo.page.click(`${card("The Harbour Guild")} form[data-form="w-tknow"] button[type="submit"]`);
    await mo.page.click(`${card("The Tithe Fleet")} [data-do="t-climb"]`);
    await mo.page.click(`${card("The Vane Estate")} [data-do="t-newag"]`);
    await until(async () => {
      const [v, g, f] = [await factionIn("The Vane Estate"), await factionIn("The Harbour Guild"), await factionIn("The Tithe Fleet")];
      return !v.res.some((r) => r.text === "Salt Contracts") && g.res.some((r) => r.text === "Salt Contracts") && v.threads.some((t) => t.to === g.id && t.kind === "hostile" && t.text === "Took our Salt Contracts") && f.agendas[0].die === 6 && v.agendas.some((a) => a.text === "Buy back the vineyards" && a.die === 6);
    }, "the contracts the Guild's, the Estate's thread toward it, Close the Combs at d6 and Buy back the vineyards on the Estate's card");
    await mo.page.click('[data-do="t-step"][data-v="done"]');
    await until(async () => (await turnIn())?.step === "done", "downtime 1 done, in one tap since it's all on the cards");
    await nudge(kai.page);
    await until(async () => (await text(kai.page, ".wt")).includes("Downtime 1: how it went"), "how it went on Kai's phone");
    yes(!JSON.stringify(await playerWorld()).includes("Buy back the vineyards"), "the Estate's off-screen action never reached Kai's phone");

    // Downtime 2: Close the Combs happens and goes on the party sheet, and the
    // crew makes a mini faction of its own.
    const fleetAg = (await factionIn("The Tithe Fleet")).agendas[0];
    await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "mos-phone-0101", ops: [{ n: 1, o: "die", id: ids["The Tithe Fleet"], lid: fleetAg.id, v: 12 }] });
    await toWorld();
    await mo.page.click('[data-do="t-start"]');
    await until(async () => (await turnIn())?.n === 2, "downtime 2's faction turn");
    await setAct("The Tithe Fleet", async () => {});
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    await until(async () => (await turnIn())?.step === "tele", "downtime 2's telegraphs out");
    await toTab(kai.page, "vesk-aaaaaa");
    await until(async () => (await kai.page.$('.wt [data-do="t-edit"][data-k="crew"]')) != null, "the crew's action on Kai's phone to pick");
    await kai.page.click('.wt [data-do="t-edit"][data-k="crew"]');
    await kai.page.selectOption(`${crewForm} select[name="what"]`, { label: "Establish" });
    await kai.page.waitForTimeout(80);
    await kai.page.fill(`${crewForm} input[name="about"]`, "A crew of our own on the Kittiwake");
    await kai.page.click(`${crewForm} button[type="submit"]`);
    await until(async () => (await turnIn())?.acts.find((a) => a.by === "crew")?.out === "Establish", "the crew Establishing, on the server");
    await nudge(mo.page);
    await until(async () => (await text(mo.page, ".wt-crew")).includes("Establishes"), "the crew's Establish on Mo's phone");
    await mo.page.click('[data-do="t-step"][data-v="land"]');
    await until(async () => (await turnIn())?.step === "land", "downtime 2 landing");
    await realIn("The Tithe Fleet", { "r-0-0": 7, "vr-0": 2 });
    await mo.page.click(`${card("The Tithe Fleet")} [data-do="t-climb"]`);
    await mo.page.waitForSelector(`${card("The Tithe Fleet")} form[data-form="w-tchanged"]`);
    await mo.page.fill(`${card("The Tithe Fleet")} form[data-form="w-tchanged"] input[name="text"]`, "Nobody sails the Combs without the Fleet’s papers now");
    await mo.page.click(`${card("The Tithe Fleet")} form[data-form="w-tchanged"] button[type="submit"]`);
    await until(async () => (await partyOf())?.changed?.some((x) => x.text === "Nobody sails the Combs without the Fleet’s papers now"), "Close the Combs on the party sheet, under What has changed");
    yes((await factionIn("The Tithe Fleet")).agendas[0].done, "it's happened, on the Fleet's card");
    // The crew's mini faction, handed Salvage rights and Muscle.
    await mo.page.waitForSelector('form[data-form="w-tcmini"]');
    const cm = 'form[data-form="w-tcmini"]';
    await mo.page.fill(`${cm} input[name="name"]`, "The Kittiwake’s Lads");
    await mo.page.selectOption(`${cm} select[name="res"]`, { label: "Salvage rights" });
    await mo.page.selectOption(`${cm} select[name="asset"]`, { label: "Muscle (+1 Power)" });
    await mo.page.check(`${cm} input[name="out-Acquire"]`);
    await mo.page.check(`${cm} input[name="out-Obstruct"]`);
    await mo.page.fill(`${cm} input[name="loy"]`, "We owe the crew our boat");
    await mo.page.click(`${cm} button[type="submit"]`);
    await until(async () => (await worldOf()).factions.some((f) => f.name === "The Kittiwake’s Lads" && f.mini && f.parent === "crew" && f.born === 2 && f.assets[0]?.text === "Muscle" && f.res[0]?.text === "Salvage rights"), "the Kittiwake's Lads on the board, the crew's own");
    await until(async () => {
      const p = await partyOf();
      return !p.res.some((r) => r.text === "Salvage rights") && !p.assets.some((a) => a.text === "Muscle");
    }, "Salvage rights and Muscle off the party sheet");
    await mo.page.click('[data-do="t-step"][data-v="done"]');
    await until(async () => (await turnIn())?.step === "done", "downtime 2 done");
    await toWorld();
    same(await mo.page.$$eval(".wb-ours .wb-tok-n", (els) => els.map((e) => e.textContent)), ["The Kittiwake’s Lads"], "the crew's mini faction under its card on the board");
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=party`);
    await kai.page.waitForSelector('details[data-open="pt-changed"]');
    await until(async () => (await text(kai.page, 'details[data-open="pt-changed"]')).includes("Nobody sails the Combs"), "What has changed on Vesk's Party tab");

    // Nothing crosses between campaigns.
    same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/world`)).status, 404, "Zed gets nothing of Tuesday Lair's faction turn");
    same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "zeds-phone-0101", ops: [{ n: 1, o: "t-start", id: "zeds-turn" }] })).status, 404, "and can't start one");
    same((await playerWorld(zed.page, zedsNight.id))?.turn ?? null, null, "Zed's Night has no faction turn");
    same((await playerWorld(kai.page, zedsNight.id))?.turn ?? null, null, "and Kai's Dorrie sees none there");

    // The faction turn at 390, in both themes: Mo's World screen landing, and
    // Kai's World tab with the telegraphs.
    await toWorld();
    await mo.page.click('[data-do="t-start"]');
    await until(async () => (await turnIn())?.n === 3, "downtime 3's faction turn");
    // Close the Combs has happened, so the Fleet's form starts on its next
    // agenda, and won't save till it's written.
    await mo.page.click(`${row("The Tithe Fleet")} [data-do="t-edit"]`);
    same(await mo.page.$eval(`${row("The Tithe Fleet")} select[name="what"]`, (el) => el.value), "new", "the Fleet's form starts on writing its next agenda");
    await mo.page.click(`${row("The Tithe Fleet")} form[data-form="w-tact"] button[type="submit"]`);
    await until(async () => (await text(mo.page, "#cc-toast")).includes("Write its new agenda first"), "and asks for it first");
    await mo.page.click('[data-do="t-cancel"]');
    await setAct("The Quiet Order", async () => {});
    await setAct("The Harbour Guild", async (form) => {
      await pick(form, "what", "Undermine");
      await pick(form, "to", "The Vane Estate");
    });
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toWorld();
      await mo.page.click(`${row("The Harbour Guild")} [data-do="t-edit"]`);
      await mo.page.waitForSelector(`${row("The Harbour Guild")} form[data-form="w-tact"]`);
      await axe(mo.page, `the faction turn, getting the actions ready, ${theme}`);
      await shot(mo.page, `turn-gm-${theme}`);
      await mo.page.click('[data-do="t-cancel"]');
    }
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    await mo.page.click('[data-do="t-step"][data-v="tele"]');
    await until(async () => (await turnIn())?.step === "tele", "downtime 3's telegraphs out");
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toTab(kai.page, "vesk-aaaaaa");
      await kai.page.waitForSelector(".wt-tele");
      await kai.page.click('.wt [data-do="t-edit"][data-k="crew"]');
      await axe(kai.page, `the faction turn on the World tab, ${theme}`);
      await shot(kai.page, `turn-tab-${theme}`);
    }
    await mo.page.click('[data-do="t-step"][data-v="land"]');
    await mo.page.click('[data-do="t-step"][data-v="land"]');
    await until(async () => (await turnIn())?.step === "land", "downtime 3 landing");
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toWorld();
      await mo.page.waitForSelector(".wt-tele");
      await axe(mo.page, `the actions landing, ${theme}`);
      await shot(mo.page, `turn-land-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));
    // Roll the factions' dice in one tap: the Guild's d8 a 7 against the
    // Estate's d12 a 3, then the Order's d8 a 5 against its agenda's d8 a 2.
    await toWorld();
    await fixDice(mo.page, [7, 3, 5, 2]);
    await mo.page.click('[data-do="t-rollall"]');
    await until(async () => (await text(mo.page, card("The Harbour Guild"))).includes("7 beats 3: it wins"), "the Guild's Undermine winning, rolled in one tap");
    has(await text(mo.page, card("The Quiet Order")), "5 beats 2: the agenda climbs", "and the Order's agenda work, rolled with it");
    // The Undermine strains the Estate's Public Sentiment thread.
    await mo.page.click(`${card("The Harbour Guild")} [data-do="t-strain"]`);
    await mo.page.click(`${card("The Quiet Order")} [data-do="t-climb"]`);
    await until(async () => (await factionIn("The Vane Estate"))?.pub[0]?.s === "strained" && (await factionIn("The Quiet Order"))?.agendas[0]?.die === 10, "the Estate's thread strained and Bury the Vane scandal at d10");
    await mo.page.click('[data-do="t-step"][data-v="done"]');
    await until(async () => (await turnIn())?.step === "done", "downtime 3 done");
  }
  console.log("8. The faction turn");
  await checkTurn();

  // ------------------------------------------------------------ 9. who can do what
  console.log("9. Who can do what");
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

  // ------------------------------------------------------------ 10. leaving
  console.log("10. Signing out, your data and deleting");
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
  same(await rows("SELECT campaignId FROM world WHERE campaignId = ?1", kaisTable.id), [], "and her campaign's board went with it");
  yes(((await tableOf(tuesday.id))?.rounds ?? []).flatMap((r) => r.tele).every((t) => t.at.user !== kaiId && t.ans?.user !== kaiId), "and Tuesday Lair's table has forgotten her");
  same(Object.values((await partyOf(tuesday.id))?.bonds ?? {}).filter((b) => b.a.startsWith(`${kaiId}:`) || b.b.startsWith(`${kaiId}:`)).length, 0, "and her threads are off Tuesday Lair's party sheet");
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
