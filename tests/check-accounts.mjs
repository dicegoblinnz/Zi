// Check sign-in, accounts and campaigns (stages 6 and 7) the way players and
// GMs will use them.
//
//   npm run build && node tests/check-accounts.mjs
//   SHOTS=folder node tests/check-accounts.mjs   (and screenshots of the campaign screens)
//   ZI_UPTO=6c node tests/check-accounts.mjs     (parts 1 to 6c only, or 6d, 9b or 9c)
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
//    6b plays the Copper Baths' scene on the round, and 6c telegraphs at it:
//    Mo sends Dace at the deal straight from the place's own telegraphs, the
//    pipes at everyone in the hot room and a runner at the scene clock. Bram
//    gets out of the hot room and Mo's card says so. Sam answers the runner
//    and loses, so the scene clock drops then and there. The round ends: the
//    deal's new tag is on every phone, the pipes land on Vesk alone, and she
//    rolls When it lands for them with the bath-man from round 2.
//    6d puts it on the table screen: Mo opens it from Tuesday Lair's page and
//    gets its code, and a TV signed in to nothing types it in and has round 3
//    as it ended (one stopped, two landed, Vesk in the hot room and Bram out
//    of it, the Copper Baths and the crew), with nobody's account, name or
//    ids in what it gets, fitting a TV and a laptop in both themes. Round 4
//    comes up live, and so does Vesk stopping Orla, then Mo resets the link:
//    the TV says so and goes blank, the old code's refused and the new one
//    brings it back. A socket from another site and twenty guessed codes are
//    turned away. Parts 8, 9 and 11 check it never gets the faction turn, a
//    page's note, telegraphs or Secret, or anyone who's left.
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
// 8. The faction turn. Mo starts Tuesday Lair's first downtime from its World
//    screen and it's on Kai's and Sam's phones in seconds. Kai pays the
//    Brothers of the Lamp with the crew's extra resource. Mo picks the
//    factions' actions: the book's Two things in one job (the Harbour Guild's
//    d6 to Acquire the Vane Estate's Salt Contracts and a d4 to keep its name
//    out of it), the Estate writing a new agenda as the faction pressure, the
//    Lamp's job, the Drowned Choir working an agenda at d12, the Tithe Fleet
//    coming for the crew on a real 7, and Tarrant & Daughters off-screen. He
//    telegraphs them, which shows the crew the factions in them, and the
//    off-screen one never reaches a player. Kai picks the crew's action, an
//    Obstruct against the Estate, and she's told the Estate's too big for the
//    crew's action alone, so Sam, with no signal, puts Bram's slot in, which
//    goes up once he's back and counts everything twice. Kai rolls real dice
//    and stops the Estate. Then the landing, Obstructs first: the Estate's
//    d12 rolls a 4, the Guild's d6 a 5 and its d4 a 2, so the contracts are
//    the Guild's and the Estate writes a hostile thread toward it, and the
//    Lamp has to beat that same 4. The Choir's agenda happens, which goes on
//    the party sheet under What has changed, and it writes its next one. The
//    downtime ends with what changed on every phone. A second downtime: the
//    crew Establishes a mini faction of its own from its party sheet. A
//    player can't change the factions' actions, and nothing crosses: Zed gets
//    nothing of Tuesday Lair's, and Kai's Dorrie in Zed's Night sees no
//    downtime. The World screen and tab, mid-turn, pass axe at 390 in both
//    themes.
// 9. Places and people. Mo brings in the Copper Baths from Twenty Places, and
//    Orla, Dace and Tamsin come with it as pages of their own, matching the
//    chapter. Orla's name in Who's here opens her page, which says where else
//    she comes up. The Vane Estate's Face gets a page of his own, and the
//    Harbour Guild's comes in from the Bestiary as the Guildmaster, written as
//    a threat. Mo writes Lord Vane as a threat too. Kai's phone gets nothing
//    till Mo shows the crew the Copper Baths, then only its name, Challenge
//    and what it's like, with his note and its telegraphs never on her phone,
//    then who's here, and its Secret only on a second tap. Orla's name links
//    on Kai's phone only once she's shown. Kai can't change it. A telegraph
//    off the page opens the round's composer with Orla's d8, and the page puts
//    its ground, stakes and scene clock on the live table, with its own
//    telegraphs ready in the composer and Dace's off the page coming aimed at
//    the deal. With no signal,
//    Vesk's World tab still has the Copper Baths. A made-up book change gets a
//    note Mo takes, keeping his own note, and a typo fix in Dace's goes in quietly.
//    Nothing crosses to Zed's Night. The World screen, a place, a person and
//    the World tab pass axe at 390, in both themes.
//    9b. Maps and her pins. Mo puts up the Steeplands from a 6000 by 4500
//    phone photo that came out sideways: his phone turns it and shrinks it to
//    4096 on its longest side, with a small copy, and both are in the bucket
//    under Tuesday Lair. Kai gets nothing of it, not even its picture. Mo drops
//    a pin on the Copper Baths, one that's only a name (smoke on the ridge)
//    and one on Lord Aldous Vane, whose page the crew hasn't been shown. He
//    shows the crew the map and two of the pins: Kai gets the Copper Baths,
//    which opens its page, and Lord Vane by name only, and the hidden pin never
//    reaches her phone. She moves and zooms it in one hand (a double tap, a
//    double tap held and slid, a drag and a pinch). The Copper Baths' page
//    says it's on the map and opens the map at its pin. With no signal, the
//    map Kai's seen opens with its picture. A map taken down goes in the bin,
//    Undo brings it back with its picture, and a day after it's gone from the
//    bucket. Nothing crosses: Zed gets no picture, nobody but the GM puts one
//    up, and Zed's Night has no maps. The World screen, a map with a pin's
//    card and the list of pins, and Kai's map pass axe at 390, in both themes.
//    9c. Fog she lifts. Mo covers the Steeplands: Kai's phone gets fog and no
//    picture, and the map's own picture, and the pins he's shown, are off it.
//    He rubs the fog off the Copper Baths with a small brush and a strip lower
//    down with a big one, and his phone makes the crew's picture: every
//    covered square of it is painted over, the uncovered ones match his, and
//    it's the only picture Kai can get. The Copper Baths' pin comes out from
//    under the fog and Lord Vane's stays hidden, on Kai's phone in a moment,
//    told by the live table, with a note. He rubs the fog back over the Copper
//    Baths, and Undo lifts it again. Fog back over what the crew's picture
//    shows takes it off Kai's phone straight away, and that picture can't go
//    back on. With no signal, Kai's map opens with the
//    crew's picture and its fog. Nothing crosses: Zed gets no picture, Kai
//    can't change the fog or send up a crew's picture, a crew's picture has to
//    be the map's size and for a map under the fog, and his own picture can't
//    be passed off as the crew's. A new picture turned on its side comes in
//    all covered. The fog's card, Mo's map with the fog's bar
//    and Kai's map pass axe at 390, in both themes. Taking the fog off gives
//    Kai the whole map back, with the pins.
// 10. Who can do what: only Mo sees people, a player can't reset a link, rename,
//    end a campaign or take anyone out, a signed-out request gets nothing
//    private, and the join check's rate limit trips.
// 11. Signing out takes the account's characters off the phone and leaves the
//    phone's own, and the maps' pictures go too. Kai downloads her data, then
//    deletes her account: it's gone from the database, her campaign ends with
//    its board and its map's pictures, and she's out of
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
import { stepsToDice } from "../src/companion/dice.js";
import { coveredShare, fogBits, fogFull, fogText, gridOf, spotCovered } from "../src/companion/maps.js";
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
const UPTO = process.env.ZI_UPTO || "";
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
  // Maps' pictures (src/worker/maps.js).
  r2Buckets: { MAPS: "zi-check-maps" },
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
const r2 = await mf.getR2Bucket("MAPS");
// Every migration, in order, the way `wrangler d1 migrations apply` runs them.
for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join("migrations", file), "utf8").split("\n").filter((l) => !l.startsWith("--")).join("\n");
  for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) await db.prepare(statement).run();
}
const rows = async (q, ...args) => (await db.prepare(q).bind(...args).all()).results;

// The site, served like Cloudflare does: files from dist/, /api/ to the Worker.
const DIST = join(process.cwd(), "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf" };
// The map's picture objects under a campaign, in the bucket.
const picsOf = async (campId) => (await r2.list({ prefix: `maps/${campId}/` })).objects.map((o) => o.key);
// Fingers on the screen, the way a phone sends them, for the map's gestures:
// each step is a touch event with its points, then a pause.
async function fingers(page, steps) {
  const cdp = await page.context().newCDPSession(page);
  for (const [type, points, wait = 16] of steps) {
    await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
    await page.waitForTimeout(wait);
  }
  await cdp.detach();
}
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
  // A phone zooms out to fit anything too wide, so the page has to be no
  // wider than the screen as well as no wider than itself.
  same(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && innerWidth <= screen.width), true, `no sideways scroll (${what})`);
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

  // ------------------------------------------------------------ 6b. the scene, and one action each
  console.log("6b. The scene, and one action a round");
  const sceneOf = async () => (await tableOf(tuesday.id))?.scene ?? null;
  const piece = (page, name) => page.locator(`.sc-el:has(.sc-n:text-is("${name}"))`);
  const row = (page, who) => page.locator(`.tg-play .tg-row:has(b:text-is("${who}"))`);
  const stateIn = (page, id) => page.evaluate((c) => JSON.parse(localStorage.getItem("zi-characters")).characters.find((x) => x.id === c)?.state, id);
  // Each theme, scrolled to the part that matters.
  const shotsAt = async (page, name, sel) => {
    if (!SHOTS) return;
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await page.reload();
      await page.waitForSelector(sel);
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), sel);
      await page.waitForTimeout(300);
      await shot(page, `${name}-${theme}`);
    }
    await page.evaluate(() => localStorage.setItem("zi-theme", "dark"));
    await page.reload();
    await page.waitForSelector(sel);
  };

  // Mo puts the Copper Baths on the table, straight out of Twenty Places.
  await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}`);
  await mo.page.waitForSelector(".tg-scene");
  has(await text(mo.page, ".tg-scene"), "Put the scene on the table, and every phone sees it", "an empty scene says what it's for");
  await mo.page.click('.tg-scene [data-do="sc-place"]');
  await mo.page.waitForSelector(".sc-places");
  same(await mo.page.$$eval(".sc-place", (els) => els.length), 20, "the book's twenty places to pick from");
  await mo.page.click('.sc-place:has(b:text-is("The Copper Baths"))');
  await until(async () => {
    const s = await sceneOf();
    return s?.stakes.length === 2 && s?.events.length === 1 && s?.ground.length === 3;
  }, "the Copper Baths on the table");
  const baths = await sceneOf();
  same(baths.stakes.map((s) => [s.name, s.c, s.tags.map((g) => g.name)]), [["The deal", 4, ["Someone Must Agree", "Wanted By Others"]], ["Dace’s satchel", 3, ["Locked", "Guarded"]]], "its two stakes, as the chapter has them");
  same([baths.events[0].scene, baths.events[0].d, baths.events[0].what], [true, 8, "Dace’s other buyer arrives, and he signs with them"], "its scene clock");
  same(baths.ground.map((g) => g.name), ["Steam", "The House Rule", "The Hot Pool"], "and its ground");
  // He gives the deal a clock, a d6, and puts an event on: more bath-men on the way.
  await piece(mo.page, "The deal").locator('[data-do="sc-edit"]').click();
  await mo.page.waitForSelector('#cc-dialog [data-do="sc-clock"]');
  await mo.page.click('#cc-dialog [data-do="sc-clock"][data-v="6"]');
  await mo.page.click('#cc-dialog [data-do="sc-save"]');
  await until(async () => (await sceneOf())?.stakes[0].clock === 6, "the deal's clock on the table");
  await mo.page.click('.tg-scene [data-do="sc-new"][data-t="event"]');
  await mo.page.waitForSelector("#sc-name");
  await mo.page.fill("#sc-name", "More bath-men");
  await mo.page.fill("#sc-what", "four more bath-men come in off the street");
  await mo.page.click('#cc-dialog [data-do="sc-d"][data-v="6"]');
  if (SHOTS) await mo.page.waitForTimeout(400);
  await shot(mo.page, "scene-event");
  await axe(mo.page, "putting an event on");
  await mo.page.click('#cc-dialog [data-do="sc-save"]');
  await until(async () => (await sceneOf())?.events.length === 2, "the event on the table");
  same(await mo.page.$$eval(".tg-scene .sc-el .sc-n", (els) => els.map((e) => e.textContent)), ["The scene clock", "The deal", "Dace’s satchel", "More bath-men"], "the scene clock first, then the stakes and the event");
  // Steam's no use to anyone tonight, so he takes it off, with a second tap.
  await mo.page.click('.sc-ground:has(b:text-is("Steam")) [data-do="sc-edit"]');
  await mo.page.click('#cc-dialog [data-do="sc-off"]');
  has(await text(mo.page, '#cc-dialog [data-do="sc-off"]'), "Tap again", "taking it off asks for a second tap");
  await mo.page.click('#cc-dialog [data-do="sc-off"]');
  await until(async () => (await sceneOf())?.ground.map((g) => g.name).join() === "The House Rule,The Hot Pool", "Steam off the table");
  await shotsAt(mo.page, "scene-gm", ".tg-scene");
  await axe(mo.page, "the scene on the GM's page");

  // Every phone sees it.
  await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa`);
  await kai.page.waitForSelector(".cc-tiles");
  await until(async () => Boolean(await kai.page.$(".tg-scenefold")), "the scene on Vesk's play screen");
  has(await text(kai.page, ".tg-scenefold > summary"), "scene clock d8 · two stakes · one event · the ground", "it reads at a glance, folded");
  await sam.page.goto(`${BASE}/characters/?c=bram-ssssss`);
  await sam.page.waitForSelector(".cc-tiles");
  await until(async () => Boolean(await sam.page.$(".tg-scenefold")), "and on Bram's");

  // Round 2: the attendant at Vesk and a bath-man at Bram.
  const teleRound = async (at, who, die, does) => {
    await mo.page.click('.tg-sec [data-do="compose"]');
    await mo.page.waitForSelector(".tg-compose");
    await mo.page.click(`.tg-target:has-text("${at}")`);
    await mo.page.fill("#tg-who", who);
    await mo.page.click(`.tg-size[data-d="${die}"]`);
    await mo.page.fill("#tg-does", does);
    await mo.page.click('#cc-dialog [data-do="save"]');
    await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  };
  await teleRound("Vesk", "The attendant", 6, "Shove Vesk into the hot pool");
  await teleRound("Bram", "A bath-man", 8, "Walk Bram to the door by the collar");
  await mo.page.click('.tg-sec [data-do="send"]');
  await until(async () => (await cardText(kai.page, "The attendant")).includes("Shove Vesk"), "round 2 on Vesk's play screen", 4000);
  await until(async () => (await cardText(sam.page, "A bath-man")).includes("Walk Bram"), "and on Bram's", 4000);
  has(await text(kai.page, ".tg-yours"), "Your action’s still yours.", "Vesk's action's hers to spend");

  // Vesk takes the bath-man for Bram: 1 Aura and no action, and it'll land on her.
  const vAura = (await stateIn(kai.page, "vesk-aaaaaa")).aura;
  same(await row(kai.page, "A bath-man").locator('[data-do="icp"]').textContent(), "Take it: 1 Aura", "Vesk can take Bram's for 1 Aura");
  same(await row(sam.page, "The attendant").locator('[data-do="icp"]').textContent(), "Take it, free", "and Bram's a Guardian, so he'd take one for free");
  await row(kai.page, "A bath-man").locator('[data-do="icp"]').click();
  await until(async () => (await teleOf("A bath-man"))?.icp?.ch === "vesk-aaaaaa", "Vesk taking the bath-man, on the table", 4000);
  same((await stateIn(kai.page, "vesk-aaaaaa")).aura, vAura - 1, "for 1 Aura");
  has(await cardText(kai.page, "A bath-man"), "You took it for Bram, so it comes at you when it lands.", "it's on Vesk's card now");
  await until(async () => (await cardText(mo.page, "A bath-man")).includes("Vesk’s taking it for Bram, for 1 Aura, so it lands on Vesk."), "Mo's page says so", 4000);
  await until(async () => (await cardText(sam.page, "A bath-man")).includes("Vesk’s taking it for you, so it lands on Vesk."), "and Bram's", 4000);
  has(await text(kai.page, ".tg-yours"), "Your action’s still yours.", "and it didn't cost Vesk her action");

  // Bram puts his action into whoever answers the attendant, and it's spent.
  await row(sam.page, "The attendant").locator('[data-do="join"]').click();
  await sam.page.waitForSelector('#cc-dialog [data-do="jwith"]');
  has(await text(sam.page, "#cc-dialog"), "It’s a combo: one roll between you.", "putting your action in says it's a combo");
  if (SHOTS) await sam.page.waitForTimeout(400);
  await shot(sam.page, "scene-join");
  await axe(sam.page, "putting your action in");
  await sam.page.click('#cc-dialog [data-do="jwith"]:has-text("Fight")');
  await sam.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  has(await text(sam.page, ".tg-yours"), "Your action’s spent this round.", "Bram's action's spent");
  has(await text(sam.page, ".tg-yours"), "Fight into whoever answers the attendant", "and his phone says on what");
  same(await row(sam.page, "The attendant").locator(".tg-chip.is-mine").count(), 1, "the attendant's row says he's in on it");
  same(await sam.page.$$eval('.tg-play [data-do="answer"], .tg-play [data-do="join"], .tg-play [data-do="else"], .tg-play [data-do="work"]', (els) => els.length), 0, "and there's nothing left to spend it on");
  await until(async () => (await cardText(mo.page, "The attendant")).includes("Bram’s put an action into whoever answers it."), "Mo's page has Bram in on it", 4000);
  await until(async () => (await text(mo.page, ".tg-crew")).includes("Fight into whoever answers the attendant"), "and so do the crew's lines", 4000);
  // A second phone of Sam's can't spend it again.
  const bathMan = await teleOf("A bath-man");
  const again = await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/table`, { dev: "sams-tablet-0001", now: Date.now(), ops: [{ n: 1, o: "answer", ch: "bram-ssssss", id: bathMan.id, a: { act: "Fight", steps: 4, dice: [{ size: 8, total: 7, out: "beat" }], opp: 3, real: false } }] });
  has(again.json?.no?.[0]?.why, "You’ve spent your action this round", "the table won't take a second action from another phone");

  // Kai looks at Something else, then answers the attendant with Sneak and Bram's Fight in it.
  await kai.page.click('.tg-yours [data-do="else"]');
  await kai.page.waitForSelector("#cc-dialog .tg-else");
  has(await text(kai.page, "#cc-dialog .tg-else"), "Work Dace’s satchel", "the scene's in Something else");
  if (SHOTS) await kai.page.waitForTimeout(400);
  await shot(kai.page, "scene-else");
  await axe(kai.page, "something else");
  await kai.page.click("#cc-dialog .dlg-head .cc-x");
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  const bConf = (await stateIn(sam.page, "bram-ssssss")).conf;
  await kai.page.click('.tg-play li.tg:has(h3:text-is("The attendant")) [data-do="answer"]');
  await kai.page.waitForSelector(".tg-acts");
  has(await text(kai.page, "#cc-dialog .tg-pick"), "Bram’s in on it, so 4 more steps go into your roll as a combo.", "the answer says Bram's in on it");
  await kai.page.click('.tg-acts [data-do="with"]:has-text("Sneak")');
  await kai.page.waitForSelector('#cc-dialog [data-act="vs"][data-v="6"][aria-pressed="true"]');
  has(await text(kai.page, "#cc-dialog"), "Friend 1’s steps", "Bram's steps are in the roll");
  await kai.page.evaluate(() => window.ziCompanion.setDice([9, 1, 4]));
  await kai.page.click('#cc-dialog [data-act="go"]');
  await kai.page.waitForSelector("#cc-dialog .tg-verdict");
  has(await text(kai.page, "#cc-dialog .tg-verdict"), "Stopped. It never lands.", "her d12's 9 beats its 4");
  await until(async () => (await teleOf("The attendant"))?.ans?.with?.[0]?.ch === "bram-ssssss", "the table has Bram in Vesk's answer", 4000);
  await until(async () => (await stateIn(sam.page, "bram-ssssss")).conf === Math.min(12, bConf + 2), "Bram's Confidence moving up with the win", 6000);
  await until(async () => (await text(sam.page, ".tg-yours")).includes("In on the attendant with Vesk: stopped"), "and his phone says how it went", 4000);
  await kai.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  has(await text(kai.page, ".tg-yours"), "Your action’s spent this round.", "Vesk's action's spent on it");
  same(await kai.page.$$eval('.tg-play [data-do="answer"], .tg-play [data-do="join"]', (els) => els.length), 0, "so she can't answer anything else");

  // 1 Resolve for another, on Dace's satchel: her Locks takes Locked.
  const vResolve = (await stateIn(kai.page, "vesk-aaaaaa")).resolve;
  await kai.page.click(".tg-more > summary");
  await kai.page.click('.tg-more [data-do="more"][data-k="resolve"]');
  await until(async () => (await text(kai.page, ".tg-yours")).includes("One more action to spend this round."), "an extra action for 1 Resolve");
  same((await stateIn(kai.page, "vesk-aaaaaa")).resolve, vResolve - 1, "that cost her 1 Resolve");
  if (!(await kai.page.$eval(".tg-scenefold", (el) => el.open))) await kai.page.click(".tg-scenefold > summary");
  await piece(kai.page, "Dace’s satchel").locator('[data-do="work"]').click();
  await kai.page.waitForSelector('#cc-dialog [data-do="wwith"]');
  same(await kai.page.$eval('#cc-dialog [data-do="aim"][data-v="Locked"]', (el) => el.getAttribute("aria-pressed")), "true", "going for Locked first");
  if (SHOTS) await kai.page.waitForTimeout(400);
  await shot(kai.page, "scene-work");
  await axe(kai.page, "working a stake");
  await kai.page.click('#cc-dialog [data-do="wwith"]:has-text("Locks")');
  await kai.page.waitForSelector('#cc-dialog [data-act="vs"][data-v="6"][aria-pressed="true"]');
  await kai.page.evaluate(() => window.ziCompanion.setDice([7, 3]));
  await kai.page.click('#cc-dialog [data-act="go"]');
  await kai.page.waitForSelector("#cc-dialog .tg-verdict");
  has(await text(kai.page, "#cc-dialog .tg-verdict"), "You beat it. Locked’s gone.", "7 against its 3");
  await until(async () => (await sceneOf())?.stakes[1].tags.map((g) => g.gone).join() === "1,0", "Locked gone from the satchel on the table", 4000);
  await kai.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  has(await text(kai.page, ".tg-yours"), "Working Dace’s satchel with Locks: Locked gone", "her phone says what the second one went on");
  await until(async () => (await piece(mo.page, "Dace’s satchel").locator('.sc-tag[aria-pressed="true"]').count()) === 1, "Locked struck off on Mo's page", 4000);
  await until(async () => (await mo.page.$$eval('.tg-crewlist li:has(b:text-is("Vesk")) .tg-did', (els) => els.map((e) => e.textContent)).catch(() => [])).join(" | ") === "Answering the attendant with Sneak: stopped | Working Dace’s satchel with Locks: Locked gone | Took a bath-man for Bram", "and the crew's lines have all three of Vesk's", 4000);
  has(await text(mo.page, ".tg-crew"), "An extra action: 1 Resolve", "with where the extra one came from");
  await shotsAt(kai.page, "scene-play", ".tg-play");
  await shotsAt(kai.page, "scene-yours", ".tg-yours");
  await axe(kai.page, "the round and the scene on the play screen");
  await shotsAt(mo.page, "scene-crew", ".tg-crew");

  // Mo ends round 2. Whatever nobody worked steps down, and the bath-man lands on Vesk.
  await mo.page.click('.tg-sec [data-do="end"]');
  await mo.page.click('.tg-sec [data-do="end"]');
  await until(async () => {
    const s = await sceneOf();
    return s?.events[0].d === 6 && s?.stakes[0].clock === 4 && s?.events[1].d === 4;
  }, "the scene clock, the deal's clock and the bath-men stepped down", 4000);
  same((await sceneOf()).stakes[1].clock, 0, "the satchel's got no clock, so nothing moves");
  await until(async () => (await text(mo.page, ".tg-sec .tg-sum")).includes("The scene clock stepped down to d6. The deal’s clock stepped down to d4. More bath-men stepped down to d4."), "Mo's page says what moved", 4000);
  await until(async () => Boolean(await kai.page.$('li.tg:has(h3:text-is("A bath-man")) [data-do="land"]')), "the bath-man landed on Vesk", 4000);
  await until(async () => (await cardText(sam.page, "A bath-man")).includes("It landed on Vesk. Vesk took it for you."), "and Bram's told", 4000);
  has(await text(kai.page, ".tg-scenefold"), "Nobody engaged it, so it stepped down to d6.", "the scene clock says why it moved");
  await shotsAt(mo.page, "scene-gm-over", ".tg-scene");

  // ------------------------------------------------------------ 6c. telegraphs at the scene
  console.log("6c. Telegraphs at the scene");
  const book = JSON.parse(readFileSync(join("src", "generated", "book.json"), "utf8")).companion.places.find((p) => p.id === "s-place-copper-baths");
  same(book.tele.map((t) => [t.who, t.d, t.aim, t.stake ?? t.place ?? "", t.one]), [["Orla", 8, "crew", "", ""], ["A bath-man", 6, "crew", "", "Grabbed"], ["Dace", 8, "stake", "The deal", ""]], "the Copper Baths' three telegraphs, read off the chapter");
  same((await sceneOf()).place, { id: "s-place-copper-baths", name: "The Copper Baths" }, "the scene knows it's the Copper Baths");
  has(await text(kai.page, ".tg-scenefold > summary"), "The Copper Baths", "and so does Vesk's fold");
  // Round 3. Mo telegraphs Dace straight out of the book, ready to send.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose .tg-book");
  has(await text(mo.page, ".tg-book .tg-tlabel"), "From The Copper Baths", "the composer has the place's own telegraphs");
  same(await mo.page.$$eval(".tg-bookline", (els) => els.map((e) => e.textContent)), book.tele.map((t) => t.line), "all three, as the book has them");
  has(await text(mo.page, '.tg-bookt[data-i="2"] small'), "d8 at the deal · a new tag in its way if it lands", "Dace's is at the deal");
  await mo.page.click('.tg-bookt[data-i="2"]');
  await mo.page.waitForSelector('.tg-bookt[data-i="2"][aria-pressed="true"]');
  same([await mo.page.inputValue("#tg-who"), await mo.page.inputValue("#tg-does"), await mo.page.inputValue("#tg-tag")], ["Dace", "grabs his towel and heads for the changing room.", "Dace grabs his towel and heads for the changing room"], "a tap fills it all in");
  same(await mo.page.getAttribute('.tg-target.is-scene:has(b:text-is("The deal"))', "aria-pressed"), "true", "aimed at the deal");
  has(await text(mo.page, ".tg-preview footer"), "At the deal", "the card's at the deal");
  has(await text(mo.page, ".tg-preview .one"), "If it lands, it’s a new tag in the way of the deal.", "and says what it does if it lands");
  same(await mo.page.$('#cc-dialog [data-do="kind"]'), null, "there's no blow or fear for one with no defence");
  if (SHOTS) {
    await mo.page.evaluate(() => document.querySelector("#cc-dialog .dlg-body").scrollTo(0, 0));
    await mo.page.waitForTimeout(400);
  }
  await shot(mo.page, "scene-tele-book");
  await axe(mo.page, "telegraphing from the place's own");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  // One at a place: the pipes burst in the hot room.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  await mo.page.click('.tg-target[data-do="tgt"][data-k="place"]');
  await mo.page.waitForSelector("#tg-where");
  await mo.page.fill("#tg-where", "in the hot room");
  await mo.page.fill("#tg-who", "The pipes");
  await mo.page.click('.tg-size[data-d="6"]');
  await mo.page.fill("#tg-does", "burst and fill the hot room with steam.");
  has(await text(mo.page, ".tg-preview footer"), "At everyone in the hot room", "the card's at everyone in the hot room");
  has(await text(mo.page, ".tg-preview footer"), "Hits whoever’s there when it lands", "and hits whoever's there");
  if (SHOTS) await mo.page.waitForTimeout(400);
  await shot(mo.page, "scene-tele-place");
  await axe(mo.page, "telegraphing at a place");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  // And one at the scene clock: a runner, bringing word.
  await mo.page.click('.tg-sec [data-do="compose"]');
  await mo.page.waitForSelector(".tg-compose");
  await mo.page.click('.tg-target.is-scene:has(b:text-is("The scene clock"))');
  await mo.page.waitForSelector('#cc-dialog [data-do="by"][data-v="1"][aria-pressed="true"]');
  await mo.page.fill("#tg-who", "A runner");
  await mo.page.click('.tg-size[data-d="6"]');
  await mo.page.fill("#tg-does", "brings word the other buyer’s on his way.");
  has(await text(mo.page, ".tg-preview .one"), "If it lands, the scene clock drops a size.", "the scene clock drops a size if it lands");
  await mo.page.click('#cc-dialog [data-do="save"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await mo.page.$$eval(".tg-sec li.tg.is-draft footer .at", (els) => els.map((e) => e.textContent.trim())), ["At the deal", "At everyone in the hot room", "At the scene clock"], "round 3, built: the deal, the hot room and the scene clock");
  await mo.page.click('.tg-sec [data-do="send"]');
  await until(async () => (await teleOf("A runner"))?.at?.k === "event", "round 3 on the table", 4000);
  same([(await teleOf("Dace")).at.name, (await teleOf("Dace")).fx], ["The deal", { tag: "Dace grabs his towel and heads for the changing room" }], "Dace's at the deal, with its new tag if it lands");
  same(Object.entries((await teleOf("The pipes")).there).map(([k, p]) => [k.split("|")[1], p.in]).sort(), [["bram-ssssss", 1], ["vesk-aaaaaa", 1]], "and everyone playing's in the hot room when it goes out");

  // On Vesk's and Bram's phones: the hot room's coming at them, and the rest's anyone's.
  await until(async () => (await cardText(kai.page, "The pipes")).includes("You’re in the hot room, so it lands on you at the end of the round."), "the pipes on Vesk's play screen, in the hot room", 4000);
  await until(async () => (await cardText(sam.page, "The pipes")).includes("You’re in the hot room"), "and on Bram's", 4000);
  same(await card(kai.page, "The pipes").locator('[data-do="there"][data-v="1"]').getAttribute("aria-pressed"), "true", "I'm in it, to start with");
  has(await text(kai.page, ".tg-play .tg-head h2"), "Coming at you", "it's coming at Vesk");
  has(await row(kai.page, "Dace").textContent(), "If it lands, it’s a new tag in the way of the deal.", "Dace's row says what it does if it lands");
  same(await row(kai.page, "Dace").locator('[data-do="answer"]').textContent(), "Answer it", "and anyone can answer it");
  same(await row(kai.page, "Dace").locator('[data-do="icp"]').count(), 0, "but nobody can take it for anyone");
  // Bram gets out of the hot room, and Mo's card says so.
  await card(sam.page, "The pipes").locator('[data-do="there"][data-v="0"]').click();
  const thereOf = async (who, ch) => Object.entries((await teleOf(who))?.there ?? {}).find(([k]) => k.endsWith(`|${ch}`))?.[1] ?? null;
  await until(async () => (await thereOf("The pipes", "bram-ssssss"))?.in === 0, "Bram out of the hot room, on the table", 4000);
  has(await cardText(sam.page, "The pipes"), "You’re out of it, so it can’t touch you.", "Bram's clear of it");
  await until(async () => (await mo.page.getAttribute('li.tg:has(h3:text-is("The pipes")) .tg-there [data-ch="bram-ssssss"]', "aria-pressed").catch(() => "")) === "false", "Mo's card has Bram out of it", 4000);
  same(await mo.page.getAttribute('li.tg:has(h3:text-is("The pipes")) .tg-there [data-ch="vesk-aaaaaa"]', "aria-pressed"), "true", "and Vesk still in");
  // Bram answers the runner and loses: the scene clock drops then and there.
  await row(sam.page, "A runner").locator('[data-do="answer"]').click();
  await sam.page.waitForSelector(".tg-acts");
  has(await text(sam.page, "#cc-dialog .tg-pick"), "Lose and it lands now, and the scene clock drops a size.", "answering says what losing does");
  await sam.page.click('.tg-acts [data-do="with"]:has-text("Fight")');
  await sam.page.waitForSelector('#cc-dialog [data-act="vs"][data-v="6"][aria-pressed="true"]');
  await sam.page.evaluate(() => window.ziCompanion.setDice([1, 5]));
  await sam.page.click('#cc-dialog [data-act="go"]');
  await sam.page.waitForSelector("#cc-dialog .tg-verdict");
  has(await text(sam.page, "#cc-dialog .tg-verdict"), "It lands now, and the scene clock drops a size.", "his 1 doesn't beat its 5");
  await until(async () => (await sceneOf())?.events[0].d === 4, "the scene clock down to d4 then and there", 4000);
  await sam.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await sam.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  await until(async () => (await cardText(mo.page, "A runner")).includes("It landed then and there."), "Mo's page says it landed then and there", 4000);
  has(await cardText(mo.page, "A runner"), "The scene clock dropped to d4.", "and what it did");
  await shotsAt(kai.page, "scene-tele-play", ".tg-play");
  await shotsAt(kai.page, "scene-tele-rows", ".tg-play .tg-rows");
  await axe(kai.page, "the hot room coming at Vesk");
  await shotsAt(mo.page, "scene-tele-gm", ".tg-sec");
  await axe(mo.page, "the round at the scene, on the GM's page");

  // Round 3 ends: Dace gets his new tag in the deal's way on every phone, the
  // clocks step down, and the hot room lands on Vesk alone.
  await mo.page.click('.tg-sec [data-do="end"]');
  await mo.page.click('.tg-sec [data-do="end"]');
  const daceId = (await teleOf("Dace")).id;
  await until(async () => Boolean((await sceneOf())?.stakes[0].tags.some((g) => g.by === daceId)), "Dace's new tag in the deal's way", 4000);
  same((await sceneOf()).stakes[0].tags.map((g) => g.name), ["Someone Must Agree", "Wanted By Others", "Dace grabs his towel and heads for the changing room"], "the deal's tags, with Dace's at the end");
  same((await sceneOf()).events[0].d, 2, "and the scene clock steps down at the end of the round too");
  await until(async () => (await cardText(mo.page, "Dace")).includes("It landed. There’s a new tag in the way of the deal."), "Mo's page says what Dace's did", 4000);
  if (!(await kai.page.$eval(".tg-scenefold", (el) => el.open))) await kai.page.click(".tg-scenefold > summary");
  await until(async () => (await piece(kai.page, "The deal").textContent()).includes("Dace grabs his towel and heads for the changing room"), "the new tag on Vesk's phone", 4000);
  if (!(await sam.page.$eval(".tg-scenefold", (el) => el.open))) await sam.page.click(".tg-scenefold > summary");
  await until(async () => (await piece(sam.page, "The deal").textContent()).includes("Dace grabs his towel and heads for the changing room"), "and on Bram's", 4000);
  await until(async () => (await cardText(sam.page, "The pipes")).includes("It missed you. You were out of it when it landed."), "Bram got out, so the pipes missed him", 4000);
  await shotsAt(sam.page, "scene-tele-missed", `.tg-play li.tg[data-tg="${(await teleOf("The pipes")).id}"]`);
  await until(async () => Boolean(await kai.page.$('li.tg:has(h3:text-is("The pipes")) [data-do="land"]')), "the pipes landed on Vesk", 4000);
  has(await cardText(mo.page, "The pipes"), "It landed on Vesk.", "Mo's page says who it landed on");
  // Vesk rolls When it lands for the bath-man from round 2 and the pipes at once.
  await kai.page.click('li.tg:has(h3:text-is("The pipes")) [data-do="land"]');
  await kai.page.waitForSelector('#cc-dialog [data-act="d-go"]');
  same(await kai.page.$$eval("#cc-dialog .cc-incoming .zd-die", (els) => els.map((el) => el.dataset.d)), ["8", "6"], "the bath-man's d8 and the pipes' d6 in, together");
  await kai.page.evaluate(() => window.ziCompanion.setDice([4, 7, 2]));
  await kai.page.click('#cc-dialog [data-act="d-go"]');
  await kai.page.waitForSelector("#cc-dialog .res .res-out");
  await until(async () => (await cardText(mo.page, "The pipes")).includes("Vesk stopped it when it landed: 4 against its 2."), "her 4 stops the pipes, on Mo's page", 4000);
  await kai.page.click("#cc-dialog .cc-x");
  await kai.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same(await mo.page.$$eval('li.tg:has(h3:text-is("The pipes")) .tg-there', (els) => els.length), 0, "once everyone in it's rolled, there's nobody to put in or out");
  await shotsAt(mo.page, "scene-tele-gm-over", ".tg-sec");
  await axe(mo.page, "round 3 over, on the GM's page");
  // Nobody else gets any of it.
  same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/table`)).status, 404, "Zed gets nothing of Tuesday Lair's table");
  same((await got(sam.page, "POST", `/api/campaigns/${tuesday.id}/table`, { dev: "sams-tablet-0002", now: Date.now(), ops: [{ n: 1, o: "there", id: (await teleOf("The pipes")).id, ch: "vesk-aaaaaa", in: false }] })).json?.no?.[0]?.why, "That was for someone you’re not playing here now.", "and Sam can't take Vesk out of the hot room");

  // ZI_UPTO=6c stops here, for a quicker look while working on the live table.
  rest: {
  if (UPTO === "6c") break rest;
  // ------------------------------------------------------------ 6d. the table screen
  console.log("6d. The table screen");
  // Mo opens it from Tuesday Lair's page, and that's when its code's made.
  await mo.page.click('[data-do="screen"]');
  await mo.page.waitForSelector("#cc-dialog .ts-give-code");
  let tvCode = (await mo.page.textContent("#cc-dialog .ts-give-code")).replace(/\s+/g, "");
  const fours = (code, sep) => code.match(/.{4}/g).join(sep);
  same((await rows("SELECT screen FROM campaign WHERE id = ?1", tuesday.id))[0]?.screen, tvCode, "the screen's code is made the first time Mo opens it");
  yes(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/.test(tvCode), `12 letters and numbers, none that look like another (${tvCode})`);
  has(await text(mo.page, "#cc-dialog .ts-give"), `localhost:${PORT}/table`, "the dialog says where to go on the screen");
  same(await mo.page.getAttribute('#cc-dialog a[href*="/table/#"]', "href"), `${BASE}/table/#${fours(tvCode, "-")}`, "and its link opens the table screen");
  await shot(mo.page, "screen-give");
  await axe(mo.page, "the table screen's code on Mo's phone");
  await mo.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await mo.page.waitForFunction(() => !document.querySelector("#cc-dialog").open);
  same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/screen`)).status, 403, "Kai can't make or reset the screen's code");

  // A TV at the shop, signed in to nothing, has round 3 the way it ended.
  const tvContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, serviceWorkers: "block", extraHTTPHeaders: { "cf-connecting-ip": "198.51.100.7" } });
  const tv = { context: tvContext, page: await tvContext.newPage() };
  tv.page.on("pageerror", (e) => note(`table screen page error: ${e.message}`));
  await tv.page.goto(`${BASE}/table/`);
  await tv.page.waitForSelector("#ts-code");
  await axe(tv.page, "the table screen waiting for its code");
  await tv.page.fill("#ts-code", fours(tvCode.toLowerCase(), " "));
  await tv.page.click('.ts-form [type="submit"]');
  await tv.page.waitForSelector(".ts-rhead h2", { timeout: 6000 });
  same(new URL(tv.page.url()).hash, `#${fours(tvCode, "-")}`, "the code typed in any old way, and it's after the # in the TV's address");
  same(await text(tv.page, ".ts-title h1"), "Tuesday Lair", "the TV has Tuesday Lair's table");
  same(await text(tv.page, ".ts-rhead h2"), "Round 3", "round 3, the way it ended");
  same(await tv.page.$$eval(".ts-tally li", (els) => els.map((e) => e.textContent.trim())), ["1 stopped", "2 landed"], "one stopped and two landed, at a glance");
  const tvCard = (who) => tv.page.locator(`.ts-tg:has(h3:text-is("${who}"))`);
  same([await tvCard("Dace").locator(".ts-vw").textContent(), await tvCard("Dace").locator(".ts-vl").textContent()], ["Landed", "There’s a new tag in the way of the deal."], "Dace landed, with what it did");
  same(await tvCard("The pipes").locator(".ts-vw").textContent(), "Stopped when it landed", "the pipes landed, and Vesk stopped them");
  has(await tvCard("The pipes").locator(".ts-v").textContent(), "Vesk stopped it: 4 against its 2.", "with her roll");
  same([await tvCard("The pipes").locator(".ts-chip:not(.is-out)").allTextContents(), await tvCard("The pipes").locator(".ts-chip.is-out").allTextContents()], [["Vesk"], ["Bram"]], "Vesk in the hot room, and Bram out of it");
  same(await tvCard("A runner").locator(".ts-vw").textContent(), "Landed then and there", "the runner landed then and there");
  same(await tvCard("A runner").locator(".ts-vl").allTextContents(), ["Bram’s Fight came up 1 against its 5.", "The scene clock dropped to d4."], "with Bram's roll and what it did");
  same(await tvCard("A runner").locator(".ts-vd .zd-die").count(), 1, "and Bram's die, big");
  same(await text(tv.page, ".ts-scene h2"), "The Copper Baths", "the scene's the Copper Baths");
  same(await tv.page.getAttribute(".ts-clock .zd-die", "data-d"), "2", "with its scene clock on a d2");
  same(await tv.page.locator(".ts-el.is-stake:has(.ts-eln:text-is('The deal')) .zd-tag").allTextContents(), ["Someone Must Agree", "Wanted By Others", "Dace grabs his towel and heads for the changing room"], "and what's in the deal's way, Dace's tag too");
  same(await tv.page.$$eval(".ts-p .ts-pn", (els) => els.map((e) => e.textContent)), ["Vesk", "Bram"], "the crew, in the order they joined");
  same(await tv.page.locator('.ts-p:has(.ts-pn:text-is("Bram")) .ts-pa li').allTextContents(), ["Answering a runner with Fight: it landed"], "and what Bram did this round");
  // It only ever has what the crew sees, and none of the table's workings.
  const screenJson = async () => (await got(tv.page, "GET", `/api/screen/${tvCode}`)).json;
  const tvJson = await screenJson();
  const tvRaw = JSON.stringify(tvJson);
  const keysIn = (o, out = new Set()) => {
    if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) (Array.isArray(o) || out.add(k), keysIn(v, out));
    return out;
  };
  same(Object.keys(tvJson).sort(), ["crew", "fight", "name", "round", "scene", "v"], "the screen gets the round, the scene and the crew");
  same([...keysIn(tvJson)].filter((k) => ["user", "ch", "player", "seq", "turn", "last", "seen", "sent", "code", "screen", "email"].includes(k)), [], "and none of the table's own workings");
  const joinCode = (await rows("SELECT code FROM campaign WHERE id = ?1", tuesday.id))[0].code;
  yes([kaiId, samId, tuesday.gmId, joinCode, "Kai Tane", "@example.com"].every((x) => !tvRaw.includes(x)), "nobody's account, name or email, and not the join link");
  // From across the room: it fits a TV and a laptop without scrolling, in both themes.
  const fits = () => tv.page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth);
  same(await fits(), true, "round 3 fits the TV without scrolling");
  await axe(tv.page, "the table screen on a TV");
  await shots(tv.page, "screen-tv", ".ts-rhead");
  await tv.page.setViewportSize({ width: 1280, height: 720 });
  await tv.page.waitForTimeout(250);
  same(await fits(), true, "and a laptop");
  await axe(tv.page, "the table screen on a laptop");
  await shots(tv.page, "screen-laptop", ".ts-rhead");
  await tv.page.setViewportSize({ width: 1920, height: 1080 });

  // Round 4, live off the same table: it's on the TV the moment Mo sends it,
  // and so is Vesk stopping it, with no reload.
  await tv.page.waitForSelector(".ts-rhead");
  await tv.page.evaluate(() => (window.zsMark = 1));
  const mo4 = { dev: "mos-laptop-screen-01", now: Date.now() };
  same((await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/table`, { ...mo4, ops: [{ n: 1, o: "round", id: "round-tv-0004", tele: [{ id: "tele-tv-00001", who: "Orla Strand", does: "looks Vesk up and down and asks who let her in.", d: 8, kind: "fear", at: { user: kaiId, ch: "vesk-aaaaaa", arch: ["Shadow", "Shadow"] } }] }] })).json?.no, [], "Mo sends round 4");
  await until(async () => (await text(tv.page, ".ts-rhead h2")) === "Round 4", "round 4 on the TV in a second or two", 4000);
  same(await tv.page.$$eval(".ts-tally li", (els) => els.map((e) => e.textContent.trim())), ["1 coming"], "one coming");
  has(await tvCard("Orla Strand").textContent(), "At Vesk", "Orla's at Vesk");
  has(await tvCard("Orla Strand").textContent(), "Lands on Confidence at the end of the round", "and it's fear, so it's on her Confidence");
  same(await tv.page.locator('.ts-p:has(.ts-pn:text-is("Vesk")) .ts-pl').textContent(), "One action left", "Vesk's still got her action");
  same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/table`, { dev: "kais-phone-screen-1", now: Date.now(), ops: [{ n: 1, o: "answer", id: "tele-tv-00001", ch: "vesk-aaaaaa", a: { act: "Talk", steps: 2, dice: [{ size: 6, total: 6 }], opp: 3 } }] })).json?.no, [], "Kai answers it");
  await until(async () => (await tvCard("Orla Strand").locator(".ts-vw").count()) && (await tvCard("Orla Strand").locator(".ts-vw").textContent()) === "Stopped", "Stopped on the TV", 4000);
  same(await tvCard("Orla Strand").locator(".ts-vl").textContent(), "Vesk answered it with Talk: 6 against its 3.", "with Vesk's roll");
  same(await tv.page.locator('.ts-p:has(.ts-pn:text-is("Vesk")) .ts-pa li').allTextContents(), ["Answering Orla Strand with Talk: stopped"], "and what Vesk did");
  same(await tv.page.locator('.ts-p:has(.ts-pn:text-is("Vesk")) .ts-pl').textContent(), "Done this round", "with her action spent");
  same(await tv.page.evaluate(() => window.zsMark), 1, "all without a reload");
  await shot(tv.page, "screen-tv-live");
  same((await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/table`, { ...mo4, ops: [{ n: 2, o: "end", round: "round-tv-0004" }] })).json?.no, [], "Mo ends round 4");
  await until(async () => (await text(tv.page, ".ts-rstate")).includes("It’s over"), "round 4 over on the TV", 4000);
  has(await text(tv.page, ".ts-clock"), "It’s happened: Dace’s other buyer arrives, and he signs with them.", "and the scene clock's run out, since nobody worked it");

  // Mo resets the link: the TV goes blank and says why, the old code's
  // refused, and the new one brings it back.
  await mo.page.click('[data-do="screen"]');
  await mo.page.waitForSelector("#cc-dialog .ts-give-code");
  await mo.page.click('#cc-dialog [data-do="screenReset"]');
  has(await text(mo.page, '#cc-dialog [data-do="screenReset"]'), "Tap again", "resetting takes a second tap");
  await mo.page.click('#cc-dialog [data-do="screenReset"]');
  await until(async () => (await mo.page.textContent("#cc-dialog .ts-give-code")).replace(/\s+/g, "") !== tvCode, "a new code on Mo's phone", 4000);
  const oldCode = tvCode;
  tvCode = (await mo.page.textContent("#cc-dialog .ts-give-code")).replace(/\s+/g, "");
  await mo.page.click('#cc-dialog .dlg-foot [data-act="close"]');
  await until(async () => (await tv.page.$(".ts-warn")) && (await text(tv.page, ".ts-warn")).includes("reset the screen’s link"), "the TV says the link was reset", 4000);
  same(await tv.page.$(".ts-round"), null, "and it's not showing the table any more");
  same((await got(tv.page, "GET", `/api/screen/${oldCode}`)).status, 404, "the old code's refused");
  await tv.page.fill("#ts-code", tvCode);
  await tv.page.click('.ts-form [type="submit"]');
  await tv.page.waitForSelector(".ts-rhead h2", { timeout: 6000 });
  same(await text(tv.page, ".ts-rhead h2"), "Round 4", "the new code brings the table back");
  await shots(tv.page, "screen-reset", ".ts-rhead");
  // A socket from another site is turned away, and guessing at codes trips
  // the limit on that address.
  same((await mf.dispatchFetch(`${BASE}/api/screen/${tvCode}`, { headers: { upgrade: "websocket", origin: "https://elsewhere.example", "cf-connecting-ip": "198.51.100.8" } })).status, 403, "a table screen's socket from another site is turned away");
  const guesser = await browser.newContext({ extraHTTPHeaders: { "cf-connecting-ip": "198.51.100.66" } });
  const guess = await guesser.newPage();
  await guess.goto(`${BASE}/table/`);
  const guesses = await guess.evaluate(async () => {
    const out = [];
    for (let i = 0; i < 21; i++) out.push((await fetch(`/api/screen/${"ABCDEFGHJKM" + "NPQRSTUVWXYZ"[i % 12]}`)).status);
    return out;
  });
  same([guesses.slice(0, 20).every((s) => s === 404), guesses[20]], [true, 429], "twenty wrong codes from one address, then it waits");
  await guesser.close();
  if (UPTO === "6d") break rest;
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
    const worldOf = async (id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const partyOf = async (id) => JSON.parse((await rows("SELECT data FROM party WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const factionIn = async (name) => (await worldOf(tuesday.id))?.factions.find((f) => f.name === name) ?? null;
    const tableOf = async (page, id = tuesday.id) => (await got(page, "GET", `/api/campaigns/${id}/table`)).json;
    const turnOf = async (page = mo.page) => (await tableOf(page))?.turn ?? null;
    const dlg = "#cc-dialog";
    const toWorld = async (page) => {
      await page.goto(`${BASE}/characters/?camp=${tuesday.id}&world`);
      await page.waitForSelector(".ft");
    };
    const toTab = async (page, ch) => {
      await page.goto(`${BASE}/characters/?c=${ch}&t=world`);
      await page.waitForSelector(".wb-tab");
    };
    const inDlg = async (page, sel) => {
      await page.waitForSelector(`${dlg} ${sel}`);
      await page.click(`${dlg} ${sel}`);
    };
    const actOf = async (fid) => (await turnOf())?.acts.find((a) => a.f === fid) ?? null;
    const tall = async (page, name) => {
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
    };

    // The board as the book's example has it: the Relic goes unpaid instead
    // of Hired Swords, so the Estate's a d12 again, and the Guild buys new
    // boats, so it's a d10. The crew's been shown the Brothers of the Lamp, a
    // friend, and the Drowned Choir's agenda is any day now.
    const vane = await factionIn("The Vane Estate");
    const guild = await factionIn("The Harbour Guild");
    const lamp = await factionIn("The Brothers of the Lamp");
    const choir = await factionIn("The Drowned Choir");
    const fleet = await factionIn("The Tithe Fleet");
    const tarrant = await factionIn("Tarrant & Daughters");
    const quiet = await factionIn("The Quiet Order");
    const salt = vane.res.find((r) => r.text === "Salt Contracts");
    const rents = vane.res.find((r) => r.text === "Low Market Rents");
    const setup = [
      { o: "edit", id: vane.id, l: "assets", lid: vane.assets.find((a) => a.text === "Hired Swords").id, f: "off", v: false },
      { o: "edit", id: vane.id, l: "assets", lid: vane.assets.find((a) => /Inkwell/.test(a.text)).id, f: "off", v: true },
      { o: "add", id: guild.id, l: "assets", item: { id: "new-boats", text: "New Boats", does: "", power: true, x: 1 } },
      { o: "show", id: lamp.id, p: "card", v: true },
      { o: "show", id: lamp.id, p: "threads", v: true },
      { o: "die", id: choir.id, lid: choir.agendas[0].id, v: 12 },
    ].map((op, i) => ({ ...op, n: i + 1 }));
    same((await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "turn-setup-01", ops: setup })).status, 200, "the board set up the way the book's example has it");
    same([stepsToDice(1 + (await factionIn("The Vane Estate")).assets.filter((a) => a.power && !a.off).length).join(), stepsToDice(1 + (await factionIn("The Harbour Guild")).assets.filter((a) => a.power && !a.off).length).join()], ["12", "10"], "the Estate's a d12 and the Guild's a d10");
    // And the crew's got an extra resource to spend.
    const sheet0 = await partyOf(tuesday.id);
    const need = Math.max(0, sheet0.assets.filter((a) => !a.off).length + 1 - sheet0.res.length);
    if (need) same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/party`, { dev: "turn-setup-02", ops: Array.from({ length: need }, (_, i) => ({ o: "add", l: "res", item: { id: `funds-${i}x`, text: ["Funerals", "Shipping Shares", "Stall fees"][i] }, n: i + 1 })) })).status, 200, "the crew with an extra resource");

    // Mo starts the downtime from the World screen, and it's on Kai's phone in seconds.
    await toWorld(mo.page);
    has(await text(mo.page, ".ft"), "Every faction on the board takes one action a downtime", "the World screen says what downtime does");
    await toTab(kai.page, "vesk-aaaaaa");
    same(await kai.page.$(".wb-tab .ft"), null, "with no downtime on, Vesk's World tab has nothing of it");
    await mo.page.click('.ft [data-do="start"]');
    await mo.page.waitForSelector(".ft-steps");
    has(await text(mo.page, ".ft"), "Downtime 1", "the first downtime");
    await kai.page.waitForSelector(".wb-tab .ft-steps", { timeout: 6000 });
    has(await text(kai.page, ".wb-tab .ft"), "Hiring comes first", "and Kai's phone has it in seconds");

    // Kai pays the Brothers of the Lamp with the crew's extra resource.
    await kai.page.click('.ft [data-do="hire"][data-by="crew"]');
    same(await kai.page.$(`${dlg} [data-do="taker"][data-f="${fleet.id}"]`), null, "the Tithe Fleet's hostile to the crew, so it won't take the crew's money");
    await inDlg(kai.page, `[data-do="taker"][data-f="${lamp.id}"]`);
    await kai.page.fill(`${dlg} #ft-job`, "Raid the Vane barges");
    await inDlg(kai.page, '[data-do="savehire"]');
    await until(async () => (await turnOf())?.hires.some((h) => h.by === "crew" && h.to === lamp.id), "the crew's hire on the table");
    has(await text(kai.page, ".ft"), "That’s the crew’s extra resources spent", "that's the crew's extra spent");

    // Mo picks the factions' actions.
    await until(async () => (await text(mo.page, ".ft")).includes("Brothers of the Lamp"), "the hire on Mo's phone");
    await mo.page.click('.ft [data-do="step"][data-s="tele"]');
    await mo.page.waitForSelector(".ft-facs");
    await tall(mo.page, "turn-tele");
    const pick = async (f) => {
      await mo.page.click(`.ft-fac[data-f="${f.id}"]`);
      await mo.page.waitForSelector(`${dlg} [data-do="what"]`);
    };
    // The Harbour Guild: two things in one job.
    await pick(guild);
    await inDlg(mo.page, '[data-do="what"][data-w="Acquire"]');
    await inDlg(mo.page, `[data-do="tf"][data-f="${vane.id}"]`);
    await inDlg(mo.page, `[data-do="item"][data-id="${salt.id}"]`);
    await inDlg(mo.page, '[data-do="split"]');
    await inDlg(mo.page, '[data-do="splits"][data-s="2"]');
    await mo.page.fill(`${dlg} #ft-splitfor`, "Keep its name out of it");
    has(await text(mo.page, `${dlg} .ft-total`), "5 steps, d6 + d4", "the Guild's 5 steps, split into a d6 and a d4");
    await tall(mo.page, "turn-dlg-act");
    await inDlg(mo.page, '[data-do="saveact"]');
    await until(async () => (await actOf(guild.id))?.split?.d === 4, "the Guild's action on the table");
    const g0 = await actOf(guild.id);
    same([g0.what, g0.main.join(), g0.split.for, g0.vs.k, g0.vs.d.join(), g0.at.name], ["Acquire", "6", "Keep its name out of it", "power", "12", "The Vane Estate’s Salt Contracts"], "Acquire the Salt Contracts with a d6, and a d4 to keep its name out of it, against the Estate's d12");
    // The Estate writes a new agenda, and it's the faction pressure.
    await pick(vane);
    await inDlg(mo.page, '[data-do="what"][data-w="write"]');
    await mo.page.fill(`${dlg} #ft-agenda`, "Find the painted box");
    await inDlg(mo.page, '[data-do="agd"][data-d="4"]');
    await inDlg(mo.page, '[data-do="pressure"]');
    await inDlg(mo.page, '[data-do="saveact"]');
    // The Lamp's job, as the crew paid for it.
    await pick(lamp);
    has(await text(mo.page, dlg), "Raid the Vane barges", "the Lamp's job, as the crew paid for it");
    await inDlg(mo.page, '[data-do="what"][data-w="Destroy"]');
    await inDlg(mo.page, `[data-do="tf"][data-f="${vane.id}"]`);
    await inDlg(mo.page, `[data-do="item"][data-id="${rents.id}"]`);
    same(await mo.page.inputValue(`${dlg} #ft-does`), "Raid the Vane barges", "its telegraph is the job it was paid for");
    await inDlg(mo.page, '[data-do="saveact"]');
    // The Drowned Choir works its agenda, at d12.
    await pick(choir);
    await inDlg(mo.page, '[data-do="what"][data-w="agenda"]');
    await inDlg(mo.page, '[data-do="saveact"]');
    // The Tithe Fleet comes for the crew: mostly hostile, so the first table, and a real 7.
    await pick(fleet);
    await inDlg(mo.page, '[data-do="what"][data-w="comes"]');
    has(await text(mo.page, dlg), "mostly hostile, so it’s the first table", "the Fleet rolls on the hostile table");
    await inDlg(mo.page, '[data-do="d12n"][data-n="7"]');
    has(await text(mo.page, `${dlg} .ft-comes`), "It tells the law.", "a 7: it tells the law");
    await inDlg(mo.page, '[data-do="saveact"]');
    // Tarrant & Daughters, off-screen.
    await pick(tarrant);
    await inDlg(mo.page, '[data-do="what"][data-w="Establish"]');
    await mo.page.fill(`${dlg} #ft-est`, "A second warehouse");
    await inDlg(mo.page, '[data-do="off"]');
    await inDlg(mo.page, '[data-do="saveact"]');
    await until(async () => (await turnOf())?.acts.length === 6, "six actions picked");
    const t1 = await turnOf();
    same(t1.pressure, t1.acts.find((a) => a.f === vane.id).id, "the Estate's new agenda is the faction pressure");
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/table`, { dev: "kai-sneaky-01", ops: [{ o: "ft-drop", id: g0.id, n: 1 }] })).json?.no?.[0]?.why, "Only the GM can do that.", "Kai can't change the factions' actions");
    same((await turnOf(kai.page))?.acts, [], "and nothing's on her phone till they're telegraphed");

    // He telegraphs them: a second tap, and the factions in them are shown to the crew.
    await mo.page.click('.ft [data-do="send"]');
    has(await text(mo.page, ".ft .tg-bar"), "Tap again", "telegraphing takes a second tap");
    await mo.page.click('.ft [data-do="send"]');
    await kai.page.waitForSelector(".wb-tab .ft-act", { timeout: 6000 });
    await until(async () => (await kai.page.$$(".wb-tab .ft-act")).length === 5, "five telegraphs on Kai's phone");
    same(await kai.page.$eval(".wb-tab .ft-act .k", (el) => el.textContent), "Faction pressure", "the faction pressure first");
    const kt = await turnOf(kai.page);
    same([kt.acts.length, kt.acts.some((a) => a.f === tarrant.id), kt.acts.find((a) => a.f === guild.id).vs.d.length], [5, false, 0], "the off-screen one never reaches her, and nor does what the Guild's up against");
    const tvTurn = JSON.stringify(await screenJson());
    yes(tvTurn.includes("Tuesday Lair") && !tvTurn.includes("Tarrant") && !tvTurn.includes(tarrant.id) && !tvTurn.includes(guild.id) && !/"(turn|last)"/.test(tvTurn), "the table screen gets none of the faction turn, off-screen or not");
    await until(async () => (await factionIn("The Harbour Guild"))?.shown.card && (await factionIn("The Vane Estate"))?.shown.card, "the factions in a telegraph shown to the crew");
    same([(await factionIn("The Harbour Guild")).shown.power, (await factionIn("Tarrant & Daughters")).shown.card, (await factionIn("The Quiet Order")).shown.card], [false, false, false], "only their cards: not their Power, the off-screen one or one that's doing nothing");

    // Kai picks the crew's action: stop the Estate. It's too big for the crew's action alone.
    await kai.page.click('.ft [data-do="crew"]');
    await inDlg(kai.page, '[data-do="move"][data-m="Obstruct"]');
    await inDlg(kai.page, `[data-do="coact"][data-id="${t1.acts.find((a) => a.f === vane.id).id}"]`);
    has(await text(kai.page, `${dlg} .cc-warn`), "bigger than the crew’s", "she's told the Estate's Power is bigger than the crew's");
    await tall(kai.page, "turn-dlg-crew");
    await inDlg(kai.page, '[data-do="savecrew"]');
    await until(async () => (await turnOf())?.crew?.move === "Obstruct", "the crew's action on the table");
    await kai.page.waitForSelector(".ft-crew [data-do='roll']");
    // Sam's phone has the downtime. Then he loses his signal, puts Bram's slot
    // in, and it goes up once he's back.
    await toTab(sam.page, "bram-ssssss");
    await sam.page.waitForSelector(".wb-tab .ft-crew [data-do='slot']");
    await sam.context.setOffline(true);
    await sam.page.click('.cc-tabs [data-t="play"]');
    await sam.page.click('.cc-tabs [data-t="world"]');
    await sam.page.waitForSelector(".wb-tab .ft-crew [data-do='slot']");
    has(await text(sam.page, ".wb-tab .ft"), "No signal, so this is the downtime as it was", "with no signal, Bram's World tab has the downtime as it was");
    await sam.page.click(".ft-crew [data-do='slot']");
    has(await text(sam.page, ".ft"), "goes up when you’ve got a signal", "his slot goes up when there's a signal");
    await sam.context.setOffline(false);
    await sam.page.evaluate(() => dispatchEvent(new Event("online")));
    await until(async () => (await turnOf())?.crew?.slot?.name === "Bram", "Bram's slot in, once Sam's back");
    await until(async () => (await text(kai.page, ".ft-crew")).includes("Bram put a personal slot in"), "Kai's phone says so");
    has(await text(kai.page, ".ft-crew"), "6 steps, d12", "and everything counts twice: 6 steps, a d12");
    // Kai rolls real dice: the crew's 9 against the Estate's 5.
    await kai.page.click(".ft-crew [data-do='real']");
    await inDlg(kai.page, '[data-do="realn"][data-i="0"][data-n="9"]');
    await inDlg(kai.page, '[data-do="realn"][data-i="1"][data-n="5"]');
    await inDlg(kai.page, '[data-do="saveroll"]');
    await until(async () => (await turnOf())?.acts.find((a) => a.f === vane.id)?.stop?.won === true, "the Estate stopped");
    has(await text(kai.page, ".ft-crew"), "It worked", "Kai's phone says it worked");
    await until(async () => (await text(mo.page, ".ft")).includes("stopped it"), "and Mo's says the crew stopped the Estate");
    await mo.page.click('.ft-crew [data-do="out"]');
    await inDlg(mo.page, '[data-do="saveout"]');

    // The landing. The Guild: the Estate's d12 rolls a 4, the Guild's d6 a 5 and its d4 a 2.
    await mo.page.click('.ft [data-do="step"][data-s="land"]');
    await mo.page.waitForSelector(`.ft-act[data-ftk="${g0.id}"] [data-do="real"]`);
    await mo.page.click(`.ft-act[data-ftk="${g0.id}"] [data-do="real"]`);
    same(await mo.page.$$eval(`${dlg} legend`, (els) => els.map((e) => e.textContent)), ["The Harbour Guild’s d6", "The Harbour Guild’s d4 for “Keep its name out of it”", "The Vane Estate’s Power, a d12"], "the Guild's two dice and the Estate's Power");
    await inDlg(mo.page, '[data-do="realn"][data-i="0"][data-n="5"]');
    await inDlg(mo.page, '[data-do="realn"][data-i="1"][data-n="2"]');
    await inDlg(mo.page, '[data-do="realn"][data-i="2"][data-n="4"]');
    await inDlg(mo.page, '[data-do="saveroll"]');
    await until(async () => (await actOf(guild.id))?.won, "the Guild's action landed");
    const g1 = await actOf(guild.id);
    same([g1.won.main, g1.won.split, (await turnOf()).power[vane.id].v.join()], [true, false, "4"], "the contracts are the Guild's, but the Estate knows who took them");
    // Its changes, in a tap: the contracts move, and the Estate writes a hostile thread toward the Guild.
    await mo.page.click(`.ft-act[data-ftk="${g0.id}"] [data-do="out"]`);
    await inDlg(mo.page, `[data-do="take"][data-id="${salt.id}"]`);
    await until(async () => (await factionIn("The Harbour Guild"))?.res.some((r) => r.text === "Salt Contracts") && !(await factionIn("The Vane Estate"))?.res.some((r) => r.text === "Salt Contracts"), "the Salt Contracts the Guild's now, on the server");
    await inDlg(mo.page, '[data-do="form"][data-k="hostile"]');
    await mo.page.fill(`${dlg} .ft-form input[name="text"]`, "They took our salt");
    await mo.page.click(`${dlg} .ft-form button[type="submit"]`);
    await until(async () => (await factionIn("The Vane Estate"))?.threads.some((x) => x.to === guild.id && x.kind === "hostile" && x.text === "They took our salt"), "the Estate's hostile thread toward the Guild");
    await tall(mo.page, "turn-dlg-out");
    await mo.page.fill(`${dlg} #ft-line`, "The Harbour Guild took the Salt Contracts, and the Estate knows exactly who did it.");
    await inDlg(mo.page, '[data-do="saveout"]');
    // The Lamp goes at the Estate too, and has to beat that same 4: real dice, just its own.
    const l0 = await actOf(lamp.id);
    await mo.page.click(`.ft-act[data-ftk="${l0.id}"] [data-do="real"]`);
    same(await mo.page.$$eval(`${dlg} legend`, (els) => els.map((e) => e.textContent)), ["The Brothers of the Lamp’s d6"], "the Estate's Power rolled once already, so it's only the Lamp's die");
    await inDlg(mo.page, '[data-do="realn"][data-i="0"][data-n="6"]');
    await inDlg(mo.page, '[data-do="saveroll"]');
    await until(async () => (await actOf(lamp.id))?.won?.main === true, "the Lamp's 6 beats the Estate's 4");
    await mo.page.click(`.ft-act[data-ftk="${l0.id}"] [data-do="out"]`);
    await inDlg(mo.page, `[data-do="tick"][data-id="${rents.id}"]`);
    await until(async () => !(await factionIn("The Vane Estate"))?.res.some((r) => r.text === "Low Market Rents"), "the rents gone");
    await inDlg(mo.page, '[data-do="saveout"]');
    // The Choir's agenda happens: the world changes on the party sheet, and it writes the next.
    const c0 = await actOf(choir.id);
    await mo.page.click(`.ft-act[data-ftk="${c0.id}"] [data-do="real"]`);
    await inDlg(mo.page, '[data-do="realn"][data-i="0"][data-n="6"]');
    await inDlg(mo.page, '[data-do="realn"][data-i="1"][data-n="3"]');
    await inDlg(mo.page, '[data-do="saveroll"]');
    await until(async () => (await actOf(choir.id))?.won?.main === true, "the Choir beats its agenda's d12");
    await mo.page.click(`.ft-act[data-ftk="${c0.id}"] [data-do="out"]`);
    await inDlg(mo.page, '[data-do="climb"]');
    await until(async () => (await factionIn("The Drowned Choir"))?.agendas[0]?.done === true, "past d12, the agenda's happened");
    await mo.page.waitForSelector(`${dlg} .ft-happened`);
    await inDlg(mo.page, '[data-do="form"][data-k="changed"]');
    await mo.page.fill(`${dlg} .ft-form input[name="text"]`, "The Glass Shelf has risen out of the bay");
    await mo.page.click(`${dlg} .ft-form button[type="submit"]`);
    await until(async () => (await partyOf(tuesday.id))?.changed?.some((x) => x.text === "The Glass Shelf has risen out of the bay."), "the world's change on the party sheet");
    await inDlg(mo.page, '[data-do="form"][data-k="next"]');
    await mo.page.fill(`${dlg} .ft-form input[name="text"]`, "Sing the city under");
    await mo.page.selectOption(`${dlg} .ft-form select[name="die"]`, "2");
    await mo.page.click(`${dlg} .ft-form button[type="submit"]`);
    await until(async () => { const a = (await factionIn("The Drowned Choir"))?.agendas ?? []; return a.length === 1 && a[0].text === "Sing the city under" && a[0].die === 2; }, "its next agenda, in place of the one that happened");
    await inDlg(mo.page, '[data-do="saveout"]');
    // The Fleet's comes for the crew, and Tarrant's moves off-screen.
    for (const f of [fleet, tarrant]) {
      const a = await actOf(f.id);
      await mo.page.click(`.ft-act[data-ftk="${a.id}"] [data-do="land"]`);
      await until(async () => (await actOf(f.id))?.won, `${f.name}'s happened`);
      await mo.page.click(`.ft-act[data-ftk="${a.id}"] [data-do="out"]`);
      if (f === tarrant) {
        // Off-screen, so it's only news if he says so.
        await mo.page.waitForSelector(`${dlg} #ft-line`);
        same(await mo.page.inputValue(`${dlg} #ft-line`), "", "an off-screen action starts with no line");
        await mo.page.fill(`${dlg} #ft-line`, "Tarrant & Daughters have a second warehouse on the docks.");
      }
      await inDlg(mo.page, '[data-do="saveout"]');
    }
    const est = await actOf(vane.id);
    await mo.page.click(`.ft-act[data-ftk="${est.id}"] [data-do="done"]`);

    // The World screen and tab, mid-turn, at 390 in both themes.
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toWorld(mo.page);
      await axe(mo.page, `the faction turn, ${theme}`);
      await tall(mo.page, `turn-gm-${theme}`);
      await toTab(kai.page, "vesk-aaaaaa");
      await kai.page.waitForSelector(".wb-tab .ft-act");
      await axe(kai.page, `the faction turn on the World tab, ${theme}`);
      await tall(kai.page, `turn-player-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));

    // He ends it, and what changed is on every phone.
    await toWorld(mo.page);
    await mo.page.click('.ft [data-do="end"]');
    await mo.page.click('.ft [data-do="end"]');
    await until(async () => (await turnOf()) === null, "the downtime over");
    const last = (await tableOf(kai.page))?.last;
    same(last?.said.map((x) => x.text), [
      "The crew stopped the Vane Estate’s action.",
      "The Harbour Guild took the Salt Contracts, and the Estate knows exactly who did it.",
      "The Brothers of the Lamp hit the Vane Estate’s Low Market Rents.",
      "The Glass Shelf has risen out of the bay.",
      "The Tithe Fleet came for the crew: it tells the law.",
      "Tarrant & Daughters have a second warehouse on the docks.",
    ], "what changed, a line each, the way Mo said it or the phone put it, and the Choir's in the words he gave the world's change");
    await toTab(kai.page, "vesk-aaaaaa");
    await kai.page.waitForSelector(".wb-tab .ft-last");
    has(await text(kai.page, ".wb-tab .ft-last"), "What changed last downtime", "on Kai's phone");
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=party`);
    await kai.page.waitForSelector('details[data-open="pt-changed"]');
    has(await text(kai.page, 'details[data-open="pt-changed"]'), "The Glass Shelf has risen out of the bay.", "and the Choir's agenda on the party sheet, under What has changed");

    // A second downtime: the crew Establishes a mini faction of its own.
    await toWorld(mo.page);
    await mo.page.click('.ft [data-do="start"]');
    await until(async () => (await turnOf())?.n === 2, "the second downtime");
    await mo.page.click('.ft [data-do="step"][data-s="tele"]');
    await mo.page.click(`.ft-fac[data-f="${quiet.id}"]`);
    await inDlg(mo.page, '[data-do="what"][data-w="Establish"]');
    await mo.page.fill(`${dlg} #ft-est`, "A new chapel");
    await inDlg(mo.page, '[data-do="off"]');
    await inDlg(mo.page, '[data-do="saveact"]');
    await until(async () => (await turnOf())?.acts.length === 1, "the Order's action");
    await mo.page.click('.ft [data-do="send"]');
    await mo.page.click('.ft [data-do="send"]');
    await until(async () => (await turnOf())?.sent > 0, "telegraphed");
    await toTab(kai.page, "vesk-aaaaaa");
    await kai.page.waitForSelector(".ft [data-do='crew']");
    has(await text(kai.page, ".ft"), "No faction’s doing anything the crew can see coming", "everything off-screen, so the crew sees nothing coming");
    await kai.page.click(".ft [data-do='crew']");
    await inDlg(kai.page, '[data-do="move"][data-m="Establish"]');
    await kai.page.fill(`${dlg} #ft-est`, "The Lamp Boys, a mini faction of our own");
    await inDlg(kai.page, '[data-do="savecrew"]');
    await until(async () => (await turnOf())?.crew?.move === "Establish", "the crew's Establish on the table");
    same((await turnOf())?.crew?.vs?.set, false, "Mo says whether anyone's in the way, not Kai's phone");
    await toWorld(mo.page);
    await mo.page.click('.ft-crew [data-do="vs"]');
    await inDlg(mo.page, '[data-do="vsd"][data-k="none"]');
    await kai.page.waitForSelector(".ft-crew [data-do='roll']");
    await kai.page.click(".ft-crew [data-do='roll']");
    await until(async () => (await turnOf())?.crew?.won?.main === true, "the crew's Establish happens");
    const sheet1 = await partyOf(tuesday.id);
    await mo.page.waitForSelector('.ft-crew [data-do="out"]');
    await mo.page.click('.ft-crew [data-do="out"]');
    await inDlg(mo.page, '[data-do="form"][data-k="mini"]');
    await mo.page.fill(`${dlg} .ft-form input[name="name"]`, "The Lamp Boys");
    await mo.page.selectOption(`${dlg} .ft-form select[name="res"]`, sheet1.res[sheet1.res.length - 1].id);
    await mo.page.selectOption(`${dlg} .ft-form select[name="asset"]`, sheet1.assets[0].id);
    await mo.page.check(`${dlg} .ft-form input[name="out-Acquire"]`);
    await mo.page.check(`${dlg} .ft-form input[name="out-Obstruct"]`);
    await mo.page.fill(`${dlg} .ft-form input[name="loy"]`, "The crew looks after its own");
    await mo.page.click(`${dlg} .ft-form button[type="submit"]`);
    await until(async () => (await factionIn("The Lamp Boys"))?.parent === "crew", "the crew's mini faction on the board");
    const boys = await factionIn("The Lamp Boys");
    same([boys.mini, boys.outs.join(), boys.res.length, boys.assets.length, boys.loy[0]?.text, boys.shown.card], [true, "Obstruct,Acquire", 1, 1, "The crew looks after its own", true], "its two outcomes, the resource and asset the crew handed over, its Loyalty thread, and the crew sees it");
    await until(async () => { const s = await partyOf(tuesday.id); return s.res.length === sheet1.res.length - 1 && s.assets.length === sheet1.assets.length - 1; }, "and they're off the party sheet");
    await inDlg(mo.page, '[data-do="saveout"]');
    await mo.page.click('.ft [data-do="step"][data-s="land"]');
    await mo.page.click('.ft [data-do="end"]');
    await mo.page.click('.ft [data-do="end"]');
    await until(async () => (await turnOf()) === null && (await tableOf(mo.page))?.last?.n === 2, "the second downtime over");

    // Nothing crosses.
    same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/table`)).status, 404, "Zed gets nothing of Tuesday Lair's downtime");
    const zn = await tableOf(kai.page, zedsNight.id);
    same([zn?.turn ?? null, zn?.last ?? null], [null, null], "and Zed's Night has no downtime of its own");
    await kai.page.goto(`${BASE}/characters/?c=dorrie-eeeeee&t=world`);
    await kai.page.waitForSelector(".wb-tab");
    same(await kai.page.$(".wb-tab .ft"), null, "so Kai's Dorrie there sees none of it");
  }
  console.log("8. The faction turn");
  await checkTurn();

  // ------------------------------------------------------------ 9. places and people
  async function checkPlaces() {
    const WB = JSON.parse(readFileSync(join("public", "world-book.json"), "utf8"));
    const baths = WB.places.find((p) => p.key === "copper-baths");
    const guildmaster = WB.threats.find((t) => t.name === "The Guildmaster");
    const worldOf = async (id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const pageIn = async (name, id = tuesday.id) => (await worldOf(id))?.pages?.find((p) => p.name === name) ?? null;
    const playerWorld = async (page = kai.page, id = tuesday.id) => (await got(page, "GET", `/api/campaigns/${id}/world`));
    const h1 = (page) => page.textContent("#app h1").catch(() => "");
    const toWorld = async (page) => {
      await page.goto(`${BASE}/characters/?camp=${tuesday.id}&world`);
      await page.waitForSelector(".wb-crew");
    };
    async function wpFold(page, key) {
      const sel = `details[data-open^="wb-${key}-"]`;
      await page.waitForSelector(sel, { state: "attached" });
      if (!(await page.$eval(sel, (el) => el.open))) await page.click(`${sel} > summary`);
    }
    const tok = (name) => `.wp-tok-a:has(b.wp-tok-n:text-is("${name}"))`;
    const openPage = async (page, name) => {
      await page.click(tok(name));
      await until(async () => (await h1(page)) === name, `${name}'s page`);
    };
    const openPageFrom = async (page, name) => {
      await toWorld(page);
      await openPage(page, name);
    };

    // Mo opens Tuesday Lair's world: no places or people yet.
    await toWorld(mo.page);
    has(await text(mo.page, "#wp-h-place + p"), "No places yet", "no places yet, and it says so");
    // He brings in the Copper Baths from Twenty Places, and its people come with it.
    await mo.page.click('details[data-open="wb-pbring"] > summary');
    await mo.page.waitForSelector('[data-do="pbring"][data-k="copper-baths"]');
    same(await mo.page.$$eval(".wp-bring h4", (els) => els.length), 20, "all twenty places to bring in");
    await mo.page.click('[data-do="pbring"][data-k="copper-baths"]');
    await until(async () => (await h1(mo.page)) === "The Copper Baths", "the Copper Baths' page");
    await until(async () => (await worldOf(tuesday.id))?.pages?.length === 4, "the Copper Baths and its three people on the server");
    const bathsPage = await pageIn("The Copper Baths");
    same([bathsPage.kind, bathsPage.ch, bathsPage.here.length, bathsPage.ground.length, bathsPage.stakes.length, bathsPage.clockD, bathsPage.teles.length, bathsPage.hooks.length, bathsPage.secret],
      ["place", baths.ch, baths.here.length, baths.ground.length, baths.stakes.length, baths.clockD, baths.teles.length, baths.hooks.length, baths.secret], "the Copper Baths the way the chapter has it");
    same((await worldOf(tuesday.id)).pages.filter((p) => p.kind === "person").map((p) => p.name).sort(), ["Casimir Dace", "Old Tamsin", "Orla Strand"], "with Orla, Dace and Tamsin as pages of their own");
    yes((await worldOf(tuesday.id)).pages.every((p) => !Object.values(p.shown).some(Boolean)), "and nothing shown to the crew");
    same((await playerWorld()).json?.world?.pages, [], "so Kai's phone gets none of them");
    same((await pageIn("Orla Strand")).ch, 4, "Orla's Challenge 4, off the place's Who's here");

    // Names link themselves: Orla's name in Who's here opens her page, and her
    // page knows where else she comes up.
    await wpFold(mo.page, "here");
    await mo.page.click('.wp a.wl:text-is("Orla Strand")');
    await until(async () => (await h1(mo.page)) === "Orla Strand", "Orla's page, from her name in Who's here");
    has(await text(mo.page, ".wp-ment"), "The Copper Baths", "her page says the Copper Baths mentions her");
    has(await text(mo.page, ".cc-back"), "The Copper Baths", "and Back goes to the Copper Baths");
    await mo.page.click(".cc-back");
    await until(async () => (await h1(mo.page)) === "The Copper Baths", "back on the Copper Baths");

    // A person linked from a faction's Face: the Vane Estate's Face gets a
    // page of his own, and the Harbour Guild's comes from the Bestiary.
    await toWorld(mo.page);
    await mo.page.click('.wb-tok-a:has(b.wb-tok-n:text-is("The Vane Estate"))');
    await until(async () => (await h1(mo.page)) === "The Vane Estate", "the Vane Estate's page");
    has(await text(mo.page, ".wp-face"), "Make a page for Lord Aldous Vane", "its Face offers him a page");
    await mo.page.click(".wp-face");
    await until(async () => (await h1(mo.page)) === "Lord Aldous Vane", "Lord Aldous Vane's page");
    has(await text(mo.page, ".wp-line"), "the collector", "who he is, off the Face");
    has(await text(mo.page, ".wp-ment"), "The Vane Estate", "and the Estate mentions him");
    await mo.page.click('.wp-ment a:text-is("The Vane Estate")');
    await until(async () => (await h1(mo.page)) === "The Vane Estate", "back to the Estate");
    yes(await mo.page.$('.wb-words a.wl:text-is("Lord Aldous Vane")'), "the Estate's Face links to his page now");
    same(await mo.page.$(".wp-face"), null, "with no page to make any more");
    await toWorld(mo.page);
    await mo.page.click('.wb-tok-a:has(b.wb-tok-n:text-is("The Harbour Guild"))');
    await until(async () => (await h1(mo.page)) === "The Harbour Guild", "the Harbour Guild's page");
    has(await text(mo.page, ".wp-face"), "Bring in The Guildmaster from the Bestiary", "the Guild's Face is in the Bestiary");
    await mo.page.click(".wp-face");
    await until(async () => (await h1(mo.page)) === "The Guildmaster", "the Guildmaster's page");
    await until(async () => Boolean(await pageIn("The Guildmaster")), "the Guildmaster on the server");
    const gm = await pageIn("The Guildmaster");
    same([gm.ch, gm.tags.map((t) => `${t.text}${t.x > 1 ? ` ×${t.x}` : ""}`).join(", "), gm.secret, gm.book?.from], [6, guildmaster.tags.map((t) => `${t.text}${t.x > 1 ? ` ×${t.x}` : ""}`).join(", "), "One Bad Year", "bestiary"], "the Guildmaster written as a threat, off the Bestiary");

    // Lord Vane written as a threat: a Challenge and a tag of his own.
    await openPageFrom(mo.page, "Lord Aldous Vane");
    await wpFold(mo.page, "threat");
    await mo.page.click('.wp-ch [data-do="edit"]');
    await mo.page.selectOption('form[data-form="w-pg-ch"] select[name="ch"]', "5");
    await mo.page.click('form[data-form="w-pg-ch"] button[type="submit"]');
    await mo.page.fill('form[data-form="w-pg-add"][data-l="tags"] input[name="text"]', "Proud");
    await mo.page.selectOption('form[data-form="w-pg-add"][data-l="tags"] select[name="kind"]', "drives");
    await mo.page.click('form[data-form="w-pg-add"][data-l="tags"] button[type="submit"]');
    await until(async () => { const v = await pageIn("Lord Aldous Vane"); return v?.ch === 5 && v.tags.some((t) => t.text === "Proud" && t.kind === "drives"); }, "Lord Vane at Challenge 5, Proud");
    has(await text(mo.page, ".wp-what"), "Proud", "and what Proud does, from Appendix B");

    // A page shown with her part kept back: the Copper Baths, then who's
    // here, then Orla, and the Secret only on a second tap. Her note and
    // telegraphs never reach Kai's phone.
    await openPageFrom(mo.page, "The Copper Baths");
    await wpFold(mo.page, "note");
    await mo.page.click('details[data-open^="wb-note-"] [data-do="edit"]');
    await mo.page.fill('form[data-form="w-pg-set"][data-f="note"] textarea', "Orla owes the Rudd brothers more than she lets on.");
    await mo.page.click('form[data-form="w-pg-set"][data-f="note"] button[type="submit"]');
    await until(async () => (await pageIn("The Copper Baths"))?.note.includes("Rudd brothers"), "Mo's note saved");
    await mo.page.click('.wb-show-card [data-do="pshow"]');
    await until(async () => (await playerWorld()).json?.world?.pages?.length === 1, "Kai's phone gets the Copper Baths");
    let raw = (await playerWorld()).body;
    let kp = JSON.parse(raw).world.pages[0];
    same([kp.name, kp.ch, kp.look, kp.here.length, kp.stakes.length, kp.clockD, kp.secret, kp.teles.length, kp.hooks.length, kp.note, kp.elsewhere], ["The Copper Baths", 3, baths.look, 0, 0, 0, "", 0, 0, "", ""], "its name, Challenge and what it's like, and nothing else");
    yes(!raw.includes("Rudd brothers") && !raw.includes("raps her cane") && !raw.includes("Every Word Is Sold") && !raw.includes("Casimir"), "no note, telegraph, Secret or anyone in it on Kai's phone");
    await wpFold(mo.page, "here");
    await mo.page.click('details[data-open^="wb-here-"] [data-do="pshow"]');
    await until(async () => (await playerWorld()).json?.world?.pages?.[0]?.here.length === baths.here.length, "who's here shown");
    await wpFold(mo.page, "secret");
    await mo.page.click('details[data-open^="wb-secret-"] [data-do="pshow"]');
    has(await mo.page.textContent('details[data-open^="wb-secret-"] [data-do="pshow"]'), "Tap again", "the Secret takes a second tap");
    await mo.page.waitForTimeout(600);
    same((await playerWorld()).json?.world?.pages?.[0]?.secret, "", "and isn't on Kai's phone after one");
    await mo.page.click('details[data-open^="wb-secret-"] [data-do="pshow"]');
    await until(async () => (await playerWorld()).json?.world?.pages?.[0]?.secret === "Every Word Is Sold", "the Secret on Kai's phone after the second");

    // Kai sees it on Vesk's World tab, with Orla's name not linked till Mo
    // shows her too.
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
    await kai.page.waitForSelector(".wb-tab .wp-tok");
    same(await kai.page.$$eval(".wb-tab .wp-tok-n", (els) => els.map((e) => e.textContent)), ["The Copper Baths"], "the Copper Baths on Vesk's World tab, and nobody else");
    await openPage(kai.page, "The Copper Baths");
    await wpFold(kai.page, "here");
    same(await kai.page.$('.wp a.wl:text-is("Orla Strand")'), null, "Orla's name isn't a link on Kai's phone yet");
    has(await text(kai.page, ".wb-more"), "There’s more to The Copper Baths", "and it says there's more to find out");
    await openPageFrom(mo.page, "Orla Strand");
    await mo.page.click('.wb-show-card [data-do="pshow"]');
    await until(async () => (await playerWorld()).json?.world?.pages?.some((p) => p.name === "Orla Strand"), "Orla on Kai's phone");
    const op = (await playerWorld()).json.world.pages.find((p) => p.name === "Orla Strand");
    same([op.ch, op.tags.length, op.want], [0, 0, ""], "her name and who she is, and not her Challenge or tags till they're shown");
    await kai.page.goto(`${BASE}/characters/?camp=${tuesday.id}&world&p=${encodeURIComponent((await pageIn("The Copper Baths")).id)}`);
    await kai.page.waitForSelector(".wp");
    await wpFold(kai.page, "here");
    await until(async () => Boolean(await kai.page.$('.wp a.wl:text-is("Orla Strand")')), "Orla's name a link on Kai's phone once she's shown");

    // Kai can't change the world.
    const bathsId = (await pageIn("The Copper Baths")).id;
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0009", ops: [{ n: 1, o: "p-show", id: bathsId, p: "stakes", v: true }] })).status, 403, "Kai can't show herself the stakes");

    // A telegraph off the Copper Baths' page goes onto the round: Orla's cane,
    // her d8 at someone's Confidence.
    await openPageFrom(mo.page, "The Copper Baths");
    await wpFold(mo.page, "teles");
    await mo.page.click('details[data-open^="wb-teles-"] [data-do="ptele"]');
    await mo.page.waitForSelector("#cc-dialog .tg-compose");
    same([await mo.page.inputValue("#tg-who"), await mo.page.inputValue("#tg-does"), await mo.page.getAttribute('.tg-size[data-d="8"]', "aria-pressed"), await mo.page.getAttribute('.cc-line[data-k="fear"]', "aria-pressed")],
      ["Orla Strand", baths.teles[0].text, "true", "true"], "the composer opens with Orla, her cane, a d8 and Confidence");
    await mo.page.click("#cc-dialog .cc-x");
    // And the whole place onto the live table's scene from its page: its
    // ground, its stakes and its scene clock, the way Mo's got them.
    const sceneOf = async () => (await got(mo.page, "GET", `/api/campaigns/${tuesday.id}/table`)).json?.scene;
    await mo.page.click('[data-do="pscene"]');
    if ((await mo.page.textContent('[data-do="pscene"]')).includes("Tap again")) await mo.page.click('[data-do="pscene"]');
    await until(async () => { const sc = await sceneOf(); return sc?.ground.length === 3 && sc?.stakes.length === 2 && sc?.events.some((e) => e.scene && e.d === 8); }, "the Copper Baths on the table from its page");
    const sc = await sceneOf();
    same(sc.stakes.map((x) => [x.name, x.c, x.tags.map((g) => g.name), x.note]), [["The deal", 4, ["Someone Must Agree", "Wanted By Others"], "Dace signs with the crew, or with someone else"], ["Dace’s satchel", 3, ["Locked", "Guarded"], "it’s in the changing-room cupboards"]], "its stakes off the page, with what's in the way");
    same([sc.ground.map((g) => g.name).join(", "), sc.events.find((e) => e.scene)?.what], ["Steam, The House Rule, The Hot Pool", "Dace’s other buyer arrives, and he signs with them"], "its ground and its scene clock");
    same(sc.place, { id: bathsId, name: "The Copper Baths", page: true }, "the table knows it's Mo's Copper Baths");
    const tvPlace = JSON.stringify(await screenJson());
    yes(tvPlace.includes("Dace’s satchel") && !tvPlace.includes(bathsId) && !tvPlace.includes("Rudd brothers") && !tvPlace.includes("raps her cane") && !tvPlace.includes("Every Word Is Sold") && !tvPlace.includes("Casimir"), "the table screen has its scene, and none of Mo's note, the page's telegraphs, its Secret or who's in it");
    // While it's on the table, its own telegraphs are ready in the composer,
    // and Dace's off the page comes aimed at the deal.
    await mo.page.click('details[data-open^="wb-teles-"] [data-do="ptele"] >> nth=2');
    await mo.page.waitForSelector("#cc-dialog .tg-compose .tg-book");
    has(await text(mo.page, "#cc-dialog .tg-book .tg-tlabel"), "From The Copper Baths", "the page's telegraphs in the composer");
    same([await mo.page.inputValue("#tg-who"), await mo.page.inputValue("#tg-tag"), await mo.page.getAttribute('.tg-target.is-scene:has(b:text-is("The deal"))', "aria-pressed")], ["Dace", "Dace grabs his towel and heads for the changing room", "true"], "Dace's comes aimed at the deal, with its new tag if it lands");
    await mo.page.click("#cc-dialog .cc-x");

    // With no signal, Vesk's World tab still has the Copper Baths.
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa`);
    await kai.page.waitForSelector('.cc-tabs [data-t="world"]');
    await kai.context.setOffline(true);
    await kai.page.click('.cc-tabs [data-t="world"]');
    await kai.page.waitForSelector(".wb-tab .wp-tok");
    await openPage(kai.page, "The Copper Baths");
    has(await text(kai.page, ".wp-look"), "Steam rolls out", "the Copper Baths opens with no signal");
    await kai.context.setOffline(false);

    // A made-up change to the book: the Copper Baths came in with another
    // scene clock, and Casimir Dace with a typo.
    const doc = await worldOf(tuesday.id);
    const bp = doc.pages.find((p) => p.name === "The Copper Baths");
    bp.clock = "The baths close for the night.";
    bp.book = { ...bp.book, h: "older", was: { ...bp.book.was, clock: "The baths close for the night." } };
    const dace = doc.pages.find((p) => p.name === "Casimir Dace");
    dace.line = "the moneylendr";
    dace.book = { ...dace.book, h: "older", was: { ...dace.book.was, line: "the moneylendr" } };
    await db.prepare("UPDATE world SET data = ?2, version = version + 1 WHERE campaignId = ?1").bind(tuesday.id, JSON.stringify(doc)).run();
    await mo.page.reload();
    await mo.page.waitForSelector(".wb-book");
    has(await text(mo.page, ".wb-book"), "The book’s changed The Copper Baths since you brought it in", "a note on the Copper Baths");
    has(await text(mo.page, ".wb-book"), "The baths close for the night", "saying what its scene clock was");
    await mo.page.click('.wb-book [data-take="1"]');
    await until(async () => { const p = await pageIn("The Copper Baths"); return p.clock === baths.clock && p.book.h === baths.h && p.note.includes("Rudd brothers"); }, "the book's scene clock taken, and Mo's note kept");
    await until(async () => (await pageIn("Casimir Dace"))?.line === "the moneylender", "the typo fix in Dace's line going in quietly");

    // Nothing crosses between campaigns.
    same((await got(zed.page, "GET", `/api/campaigns/${tuesday.id}/world`)).status, 404, "Zed gets nothing of Tuesday Lair's places and people");
    same((await got(zed.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "zeds-phone-0002", ops: [{ n: 1, o: "p-gone", id: bathsId }] })).status, 404, "and can't change them");
    same((await playerWorld(zed.page, zedsNight.id)).json?.world?.pages, [], "Zed's Night has no pages");
    same((await playerWorld(kai.page, zedsNight.id)).json?.world?.pages, [], "and Kai gets none there");
    await kai.page.goto(`${BASE}/characters/?c=dorrie-eeeeee&t=world`);
    await kai.page.waitForSelector(".wb-tab .wb-crew");
    await kai.page.waitForTimeout(700);
    yes(!(await text(kai.page, "#app")).includes("Copper Baths"), "Kai's Dorrie, in Zed's Night, sees nothing of the Copper Baths");

    // The World screen, a place, a person and the World tab, at 390 in both themes.
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toWorld(mo.page);
      await mo.page.click('details[data-open="wb-pthreats"] > summary');
      await axe(mo.page, `places and people on the World screen, ${theme}`);
      await shot(mo.page, `world-places-${theme}`);
      await openPage(mo.page, "The Copper Baths");
      await wpFold(mo.page, "here");
      await wpFold(mo.page, "teles");
      await axe(mo.page, `a place's page, ${theme}`);
      await shot(mo.page, `world-place-${theme}`);
      await openPageFrom(mo.page, "The Guildmaster");
      await wpFold(mo.page, "threat");
      await axe(mo.page, `a person's page, ${theme}`);
      await shot(mo.page, `world-person-${theme}`);
      await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
      await kai.page.waitForSelector(".wb-tab .wp-tok");
      await axe(kai.page, `places and people on the World tab, ${theme}`);
      await openPage(kai.page, "The Copper Baths");
      await wpFold(kai.page, "here");
      await axe(kai.page, `a place on Kai's phone, ${theme}`);
      await shot(kai.page, `world-place-player-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));
  }
  console.log("9. Places and people");
  await checkPlaces();

  // ------------------------------------------------------------ 9b. maps and her pins
  async function checkMaps() {
    const worldOf = async (id = tuesday.id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const mapIn = async (name, id = tuesday.id) => (await worldOf(id))?.maps?.find((m) => m.name === name) ?? null;
    const playerWorld = async (page = kai.page, id = tuesday.id) => (await got(page, "GET", `/api/campaigns/${id}/world`)).json?.world ?? null;
    const h1 = (page) => page.textContent("#app h1").catch(() => "");
    const toWorld = async (page) => {
      await page.goto(`${BASE}/characters/?camp=${tuesday.id}&world`);
      await page.waitForSelector(".wb-crew");
    };
    // A picture, as the phone gets it: its status, type and size.
    const fetchPic = (page, path) => page.evaluate(async (p) => {
      const r = await fetch(p, { cache: "no-store" });
      return { status: r.status, type: r.headers.get("content-type"), size: (await r.arrayBuffer()).byteLength };
    }, path);
    // A picture put up straight through the Worker, for the checks that don't
    // need the screens.
    const upload = (page, campId, w = 1200, h = 800) => page.evaluate(async ([c, w, h]) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const g = cv.getContext("2d");
      g.fillStyle = "#cfe3ea";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#2d4a57";
      g.fillRect(w * 0.1, h * 0.6, w * 0.8, h * 0.1);
      const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.8));
      const f = new FormData();
      f.append("pic", blob, "map");
      f.append("thumb", blob, "thumb");
      const r = await fetch(`/api/campaigns/${c}/maps`, { method: "POST", body: f });
      return { status: r.status, json: await r.json().catch(() => null) };
    }, [campId, w, h]);
    const layerOf = (page) => page.$eval(".wm-layer", (el) => {
      const m = el.style.transform.match(/translate3d\(([-+\d.e]+)px, ([-+\d.e]+)px, 0(?:px)?\) scale\(([-+\d.e]+)\)/);
      return m ? { x: Number(m[1]), y: Number(m[2]), s: Number(m[3]) } : null;
    });
    const stageBox = async (page) => (await page.$(".wm-stage")).boundingBox();
    const pinSel = (name) => `.wm-pin[aria-label^="${name},"]`;
    const picLoaded = (page) => page.$eval(".wm-pic", (img) => img.complete && img.naturalWidth > 0 && img.src.startsWith("blob:")).catch(() => false);

    // Mo opens Tuesday Lair's world: no maps yet.
    await toWorld(mo.page);
    has(await text(mo.page, "#wm-h + p"), "No maps yet", "no maps yet, and it says so");

    // He puts up the Steeplands from a phone photo, 6000 by 4500, that came
    // out sideways, so he turns it before it goes up.
    const photo = await mo.page.evaluate(async () => {
      const c = document.createElement("canvas");
      c.width = 6000;
      c.height = 4500;
      const g = c.getContext("2d");
      g.fillStyle = "#e8dcc2";
      g.fillRect(0, 0, 6000, 4500);
      g.strokeStyle = "#3a2e22";
      g.lineWidth = 16;
      for (let i = 0; i < 30; i++) {
        g.beginPath();
        g.moveTo((i * 997) % 6000, (i * 613) % 4500);
        g.bezierCurveTo((i * 1301) % 6000, (i * 271) % 4500, (i * 401) % 6000, (i * 1777) % 4500, (i * 2003) % 6000, (i * 919) % 4500);
        g.stroke();
      }
      g.fillStyle = "#3a2e22";
      g.font = "bold 260px serif";
      g.fillText("THE STEEPLANDS", 500, 700);
      const b = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
      const buf = new Uint8Array(await b.arrayBuffer());
      let out = "";
      for (let i = 0; i < buf.length; i += 0x8000) out += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(out);
    });
    await mo.page.click('details[data-open="wb-mput"] > summary');
    await mo.page.setInputFiles('details[data-open="wb-mput"] input[data-wmfile]', { name: "IMG_2034.jpg", mimeType: "image/jpeg", buffer: Buffer.from(photo, "base64") });
    await mo.page.waitForSelector(".wm-draft-pic img", { timeout: 20000 });
    const across = await mo.page.$eval(".wm-draft-pic img", (img) => img.naturalWidth > img.naturalHeight);
    const before = await mo.page.getAttribute(".wm-draft-pic img", "src");
    await mo.page.click('[data-do="mturn"]');
    await until(async () => (await mo.page.getAttribute(".wm-draft-pic img", "src").catch(() => before)) !== before, "the picture turned");
    yes(across && (await mo.page.$eval(".wm-draft-pic img", (img) => img.naturalHeight > img.naturalWidth)), "Turn it turns the picture a quarter");
    await shot(mo.page, "map-draft");
    await mo.page.fill('input[data-wmdraft="name"]', "The Steeplands");
    await mo.page.click('form[data-form="w-map-new"] button[type="submit"]');
    await until(async () => (await h1(mo.page)) === "The Steeplands", "the Steeplands' map screen, once it's up", 30000);
    await until(async () => Boolean(await mapIn("The Steeplands")), "the Steeplands on the server");
    const map = await mapIn("The Steeplands");
    same([map.w, map.h, map.shown, map.pins.length], [3072, 4096, false, 0], "turned and shrunk to 4096 on its longest side, hidden, no pins");
    const pics = await picsOf(tuesday.id);
    same(pics.sort(), [`maps/${tuesday.id}/${map.key}`, `maps/${tuesday.id}/${map.key}.t`].sort(), "the picture and its small copy in the bucket, under Tuesday Lair");
    const big = await r2.head(`maps/${tuesday.id}/${map.key}`);
    const small = await r2.head(`maps/${tuesday.id}/${map.key}.t`);
    yes(big.size < 8 * 1024 * 1024 && small.size < 400 * 1024 && /^image\/(webp|jpeg)$/.test(big.httpMetadata?.contentType || ""), `a picture that's quick to send (${Math.round(big.size / 1024)} KB, ${big.httpMetadata?.contentType}), and a small one (${Math.round(small.size / 1024)} KB)`);
    await until(() => picLoaded(mo.page), "the picture on Mo's map screen");
    const picPath = `/api/campaigns/${tuesday.id}/maps/${map.id}?k=${map.key}`;

    // Kai's phone gets nothing of it, not even the picture.
    same((await playerWorld())?.maps, [], "Kai's phone gets no maps");
    same((await fetchPic(kai.page, picPath)).status, 404, "and the picture isn't hers to get");

    // Mo drops a pin on the Copper Baths, in the middle of the map.
    await mo.page.click('[data-do="mdrop"]');
    await mo.page.waitForSelector(".wm-cross:not([hidden])");
    await shot(mo.page, "map-placing");
    await mo.page.click('[data-do="mplace"]');
    await mo.page.waitForSelector(".wm-pick");
    await mo.page.fill(".wm-pick input[data-wmfind]", "copper");
    same(await mo.page.$$eval(".wm-picks li:not([hidden]) b", (els) => els.map((e) => e.textContent)), ["The Copper Baths"], "finding it by typing");
    await mo.page.click('.wm-picks button:has(b:text-is("The Copper Baths"))');
    await until(async () => (await mapIn("The Steeplands"))?.pins.length === 1, "the Copper Baths pin on the server");
    const bathsPin = (await mapIn("The Steeplands")).pins[0];
    same([bathsPin.to?.k, Math.abs(bathsPin.x - 0.5) < 0.01, Math.abs(bathsPin.y - 0.5) < 0.01, bathsPin.shown], ["p", true, true, false], "a pin on the Copper Baths where the cross was, hidden");
    has(await text(mo.page, ".wm-card"), "Only you can see this pin", "its card says only he can see it");

    // One that's only a name, somewhere else: he zooms in and moves the map
    // under the cross with his thumb first.
    await mo.page.click('[data-do="mdrop"]');
    await mo.page.waitForSelector(".wm-cross:not([hidden])");
    await mo.page.click('[data-do="mzoom"][data-z="in"]');
    await mo.page.waitForTimeout(400);
    let sb = await stageBox(mo.page);
    const cx = sb.x + sb.width / 2;
    const cy = sb.y + sb.height / 2;
    const drag = (dx, dy) => fingers(mo.page, [["touchStart", [[cx, cy]]], ["touchMove", [[cx + dx * 0.3, cy + dy * 0.3]]], ["touchMove", [[cx + dx * 0.7, cy + dy * 0.7]]], ["touchMove", [[cx + dx, cy + dy]], 120], ["touchEnd", [], 400]]);
    await drag(-70, -40);
    await mo.page.click('[data-do="mplace"]');
    await mo.page.fill('form[data-form="w-map-name"] input[name="name"]', "smoke on the ridge");
    await mo.page.click('form[data-form="w-map-name"] button[type="submit"]');
    await until(async () => (await mapIn("The Steeplands"))?.pins.length === 2, "the smoke pin on the server");
    const smoke = (await mapIn("The Steeplands")).pins.find((p) => p.name === "smoke on the ridge");
    yes(smoke && smoke.to === null && smoke.x > 0.5 && smoke.y > 0.5, `a pin that's only a name, further along and down (${smoke?.x}, ${smoke?.y})`);
    // And one on Lord Aldous Vane, whose page the crew hasn't been shown, up
    // and to the left.
    await mo.page.click('[data-do="mdrop"]');
    await drag(180, 120);
    await mo.page.click('[data-do="mplace"]');
    await mo.page.fill(".wm-pick input[data-wmfind]", "vane");
    await mo.page.click('.wm-picks button:has(b:text-is("Lord Aldous Vane"))');
    await until(async () => (await mapIn("The Steeplands"))?.pins.length === 3, "the Vane pin on the server");

    // He shows the crew the map: Kai gets it with no pins yet, and its picture.
    await mo.page.click(".wm-show");
    await until(async () => (await playerWorld())?.maps?.length === 1, "the map on Kai's phone");
    same((await playerWorld()).maps[0].pins, [], "with none of the pins yet");
    const kaiPic = await fetchPic(kai.page, picPath);
    same([kaiPic.status, kaiPic.size], [200, big.size], "and its picture's hers to get now");
    same((await fetchPic(kai.page, `/api/campaigns/${tuesday.id}/maps/${map.id}?k=AAAAAAAAAAAAAAAA`)).status, 404, "but not by a key that isn't its picture");

    // Then two of the pins: the Copper Baths, whose page she's seen, and Lord
    // Vane, whose page she hasn't. Back to the whole map first, card shut.
    await mo.page.click('.wm-card [data-do="mclose"]');
    await mo.page.click('[data-do="mzoom"][data-z="whole"]');
    await mo.page.waitForTimeout(450);
    await mo.page.click(pinSel("The Copper Baths"));
    await mo.page.click('.wm-card [data-do="mpinshow"]');
    await mo.page.click(pinSel("Lord Aldous Vane"));
    await mo.page.click('.wm-card [data-do="mpinshow"]');
    await until(async () => (await playerWorld())?.maps?.[0]?.pins?.length === 2, "two pins on Kai's phone");
    has(await text(mo.page, ".wm-card"), "They can open it once you’ve shown them Lord Aldous Vane too", "Mo's card says the crew only sees Vane's name");
    const kw = await got(kai.page, "GET", `/api/campaigns/${tuesday.id}/world`);
    const kpins = kw.json.world.maps[0].pins;
    same(kpins.map((p) => [p.name, p.to?.k ?? null]).sort(), [["Lord Aldous Vane", null], ["The Copper Baths", "p"]], "the Copper Baths opens its page, and Lord Vane's only a name");
    yes(!kw.body.includes("smoke on the ridge") && !kw.body.includes(smoke.id), "the hidden pin never reaches Kai's phone");
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0011", ops: [{ n: 1, o: "m-pinset", id: map.id, pid: smoke.id, f: "shown", v: true }] })).status, 403, "Kai can't show herself the hidden pin");

    // On Vesk's World tab, Kai opens the map and its pins.
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
    await kai.page.waitForSelector(".wb-tab .wm-tok");
    same(await kai.page.$$eval(".wb-tab .wm-tok-n", (els) => els.map((e) => e.textContent)), ["The Steeplands"], "the Steeplands on Vesk's World tab");
    await kai.page.click(".wm-tok-a");
    await until(async () => (await h1(kai.page)) === "The Steeplands", "the map on Kai's phone");
    await until(() => picLoaded(kai.page), "with its picture");
    same(await kai.page.$$eval(".wm-pin", (els) => els.length), 2, "and the two pins she's been shown");
    await kai.page.tap(pinSel("The Copper Baths"));
    await kai.page.waitForSelector(".wm-card");
    await kai.page.click('.wm-card a[data-do="nav"]');
    await until(async () => (await h1(kai.page)) === "The Copper Baths", "the pin opens the Copper Baths' page");
    has(await text(kai.page, ".cc-back"), "The Steeplands", "and Back goes to the map");
    await kai.page.click(".cc-back");
    await until(async () => (await h1(kai.page)) === "The Steeplands", "back on the map");
    await kai.page.tap(pinSel("Lord Aldous Vane"));
    await kai.page.waitForSelector(".wm-card");
    has(await text(kai.page, ".wm-card"), "That’s all you know about it so far", "Lord Vane's pin is his name and nothing more");
    same(await kai.page.$('.wm-card a[data-do="nav"]'), null, "with nothing to open");
    await kai.page.click('.wm-card [data-do="mclose"]');

    // One hand: a double tap zooms in where it's tapped, a double tap held
    // and slid up zooms back out, a drag moves it and two fingers pinch it.
    sb = await stageBox(kai.page);
    const kx = sb.x + sb.width / 2;
    const ky = sb.y + sb.height * 0.75;
    const whole = await layerOf(kai.page);
    await fingers(kai.page, [["touchStart", [[kx, ky]]], ["touchEnd", [], 60], ["touchStart", [[kx, ky]]], ["touchEnd", [], 500]]);
    const zoomed = await layerOf(kai.page);
    yes(zoomed.s > whole.s * 2.2, `a double tap zooms in (${whole.s.toFixed(3)} to ${zoomed.s.toFixed(3)})`);
    await fingers(kai.page, [["touchStart", [[kx, ky]]], ["touchEnd", [], 60], ["touchStart", [[kx, ky]], 40], ["touchMove", [[kx, ky - 30]]], ["touchMove", [[kx, ky - 70]]], ["touchMove", [[kx, ky - 110]], 60], ["touchEnd", [], 450]]);
    const out = await layerOf(kai.page);
    yes(out.s < zoomed.s * 0.8, `a double tap held and slid up zooms out (${zoomed.s.toFixed(3)} to ${out.s.toFixed(3)})`);
    await fingers(kai.page, [["touchStart", [[kx - 30, ky], [kx + 30, ky]]], ["touchMove", [[kx - 45, ky], [kx + 45, ky]]], ["touchMove", [[kx - 60, ky], [kx + 60, ky]], 40], ["touchEnd", [], 500]]);
    const pinched = await layerOf(kai.page);
    yes(pinched.s > out.s * 1.5, `two fingers pinch it bigger (${out.s.toFixed(3)} to ${pinched.s.toFixed(3)})`);
    await fingers(kai.page, [["touchStart", [[kx, ky - 100]]], ["touchMove", [[kx + 30, ky - 80]]], ["touchMove", [[kx + 60, ky - 60]]], ["touchMove", [[kx + 80, ky - 50]], 40], ["touchEnd", [], 700]]);
    const moved = await layerOf(kai.page);
    yes(moved.x > pinched.x + 40 && moved.y > pinched.y + 20 && Math.abs(moved.s - pinched.s) < 1e-6, `a drag moves it (${JSON.stringify(pinched)} to ${JSON.stringify(moved)})`);
    await kai.page.click('[data-do="mzoom"][data-z="whole"]');
    await kai.page.waitForTimeout(450);
    yes(Math.abs((await layerOf(kai.page)).s - whole.s) < 1e-3, "The whole map shows it all again");

    // The Copper Baths' page says it's on the map, and opens the map at its pin.
    await mo.page.goto(`${BASE}/characters/?camp=${tuesday.id}&world&p=${encodeURIComponent(bathsPin.to.id)}`);
    await mo.page.waitForSelector(".wm-on");
    has(await text(mo.page, ".wm-on"), "The Steeplands", "the Copper Baths' page says it's on the Steeplands");
    await mo.page.click(".wm-on a");
    await until(async () => (await h1(mo.page)) === "The Steeplands", "the map, from the page");
    await mo.page.waitForSelector(".wm-card");
    has(await text(mo.page, ".wm-card-n"), "The Copper Baths", "opened at the Copper Baths' pin, with its card up");

    // With no signal, the map Kai's seen opens with its picture.
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
    await kai.page.waitForSelector(".wb-tab .wm-tok");
    await until(() => kai.page.evaluate(async (p) => Boolean(await (await caches.open("zi-maps")).match(new URL(p, location.origin).href)), picPath), "the picture kept on Kai's phone");
    await kai.context.setOffline(true);
    await kai.page.click(".wm-tok-a");
    await until(async () => (await h1(kai.page)) === "The Steeplands", "the map with no signal");
    await until(() => picLoaded(kai.page), "its picture with no signal");
    same(await kai.page.$$eval(".wm-pin", (els) => els.length), 2, "and its pins");
    await kai.context.setOffline(false);

    // A map taken down goes in the bin, Undo brings it back with its picture,
    // and a day in the bin later it's gone from the bucket.
    const up = await upload(mo.page, tuesday.id);
    same(up.status, 200, "a second picture put up");
    const harbour = { id: "harbour-map", name: "Harbour sketch", key: up.json?.key, w: 1200, h: 800, of: "" };
    const send = (n, op) => got(mo.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "mos-check-0009", ops: [{ n, ...op }] });
    await send(1, { o: "m-new", m: harbour });
    await send(2, { o: "m-gone", id: harbour.id });
    same((await worldOf()).bin?.map((b) => b.k), [harbour.key], "taking it down puts its picture in the bin");
    yes((await picsOf(tuesday.id)).includes(`maps/${tuesday.id}/${harbour.key}`), "and the picture's still in the bucket");
    await send(3, { o: "m-new", m: harbour });
    same((await worldOf()).bin, [], "Undo puts it back, out of the bin");
    same((await fetchPic(mo.page, `/api/campaigns/${tuesday.id}/maps/${harbour.id}?k=${harbour.key}`)).status, 200, "with its picture");
    await send(4, { o: "m-gone", id: harbour.id });
    const doc = await worldOf();
    doc.bin = doc.bin.map((b) => ({ ...b, at: b.at - 2 * 24 * 3600 * 1000 }));
    await db.prepare("UPDATE world SET data = ?2, version = version + 1 WHERE campaignId = ?1").bind(tuesday.id, JSON.stringify(doc)).run();
    await send(5, { o: "m-set", id: map.id, f: "name", v: "The Steeplands" });
    same((await picsOf(tuesday.id)).filter((k) => k.includes(harbour.key)), [], "a day in the bin later, its picture's gone from the bucket");
    same((await worldOf()).bin, [], "and the bin's empty");
    same((await picsOf(tuesday.id)).length, 2, "the Steeplands' picture's still there");

    // Nothing crosses: Zed gets no picture, nobody but the GM puts one up,
    // and Zed's Night has no maps.
    same((await fetchPic(zed.page, picPath)).status, 404, "Zed can't get Tuesday Lair's picture");
    same((await upload(zed.page, tuesday.id)).status, 404, "or put one up there");
    same((await upload(kai.page, tuesday.id)).status, 403, "and Kai, a player, can't put one up");
    same((await upload(mo.page, tuesday.id, 5000, 100)).status, 400, "a picture wider than 4096, sent without her phone shrinking it, is turned away");
    same((await playerWorld(zed.page, zedsNight.id))?.maps, [], "Zed's Night has no maps");
    same((await playerWorld(kai.page, zedsNight.id))?.maps, [], "and Kai gets none there");
    // Kai runs Kai's Table, and its map's under it.
    const kt = await upload(kai.page, kaisTable.id);
    same(kt.status, 200, "Kai puts a map up in her own campaign");
    await got(kai.page, "POST", `/api/campaigns/${kaisTable.id}/world`, { dev: "kais-phone-0012", ops: [{ n: 1, o: "m-new", m: { id: "kais-map", name: "The Undercroft", key: kt.json?.key, w: 1200, h: 800 } }] });
    same((await picsOf(kaisTable.id)).length, 2, "its pictures under Kai's Table");
    same((await fetchPic(mo.page, `/api/campaigns/${kaisTable.id}/maps/kais-map?k=${kt.json?.key}`)).status, 404, "and Mo can't get them");

    // The World screen, a map with a pin's card and the list of pins, and
    // Kai's map, at 390 in both themes.
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await toWorld(mo.page);
      await mo.page.click('details[data-open="wb-mput"] > summary');
      await mo.page.waitForSelector(".wm-tok img");
      await axe(mo.page, `maps on the World screen, ${theme}`);
      await shot(mo.page, `world-maps-${theme}`);
      await mo.page.click(".wm-tok-a");
      await mo.page.waitForSelector(".wm-stage");
      await until(() => picLoaded(mo.page), `the map's picture, ${theme}`);
      await mo.page.click(pinSel("The Copper Baths"));
      await mo.page.waitForSelector(".wm-card");
      await axe(mo.page, `a map with a pin's card, ${theme}`);
      await shot(mo.page, `map-card-${theme}`);
      await mo.page.click('[data-do="mpanel"]');
      await mo.page.waitForSelector(".wm-panel");
      await axe(mo.page, `a map's pins, ${theme}`);
      await shot(mo.page, `map-pins-${theme}`);
      await kai.page.goto(`${BASE}/characters/?camp=${tuesday.id}&world&m=${map.id}`);
      await kai.page.waitForSelector(".wm-stage");
      await until(() => picLoaded(kai.page), `Kai's map's picture, ${theme}`);
      await kai.page.tap(pinSel("The Copper Baths"));
      await kai.page.waitForSelector(".wm-card");
      await axe(kai.page, `a map on Kai's phone, ${theme}`);
      await shot(kai.page, `map-player-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));
  }
  console.log("9b. Maps and her pins");
  await checkMaps();
  // ZI_UPTO=9b stops here, for a quicker look while working on maps.
  if (UPTO === "9b") break rest;

  // ------------------------------------------------------------ 9c. fog she lifts
  async function checkFog() {
    const worldOf = async (id = tuesday.id) => JSON.parse((await rows("SELECT data FROM world WHERE campaignId = ?1", id))[0]?.data ?? "null");
    const steep = async () => (await worldOf())?.maps?.find((m) => m.name === "The Steeplands") ?? null;
    const kaiWorld = async () => got(kai.page, "GET", `/api/campaigns/${tuesday.id}/world`);
    const h1 = (page) => page.textContent("#app h1").catch(() => "");
    const fetchPic = (page, path) => page.evaluate(async (p) => {
      const r = await fetch(p, { cache: "no-store" });
      return { status: r.status, size: (await r.arrayBuffer()).byteLength };
    }, path);
    const layerOf = (page) => page.$eval(".wm-layer", (el) => {
      const m = el.style.transform.match(/translate3d\(([-+\d.e]+)px, ([-+\d.e]+)px, 0(?:px)?\) scale\(([-+\d.e]+)\)/);
      return m ? { x: Number(m[1]), y: Number(m[2]), s: Number(m[3]) } : null;
    });
    const picLoaded = (page) => page.$eval(".wm-pic", (img) => img.complete && img.naturalWidth > 0 && img.src.startsWith("blob:")).catch(() => false);
    const map = await steep();
    const mapUrl = `${BASE}/characters/?camp=${tuesday.id}&world&m=${map.id}`;
    const picPath = `/api/campaigns/${tuesday.id}/maps/${map.id}?k=${map.key}`;
    const baths = map.pins.find((p) => p.to?.k === "p" && p.shown);
    const vane = map.pins.find((p) => p.shown && p !== baths);
    // A rub with a finger across the map, from one spot on the picture to
    // another (each from 0 to 1), the way a phone sends it.
    const rubAcross = async (from, to, steps = 6) => {
      const L = await layerOf(mo.page);
      const sb = await (await mo.page.$(".wm-stage")).boundingBox();
      const at = ([fx, fy]) => [sb.x + L.x + fx * map.w * L.s, sb.y + L.y + fy * map.h * L.s];
      const pts = Array.from({ length: steps + 1 }, (_, i) => at([from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps]));
      await fingers(mo.page, [["touchStart", [pts[0]]], ...pts.slice(1).map((p) => ["touchMove", [p], 24]), ["touchEnd", [], 120]]);
    };
    // The crew's picture caught up with the fog Mo's rubbed.
    const caughtUp = async () => {
      const m = await steep();
      return m?.fog?.crew && m.fog.crew.c === m.fog.c ? m : null;
    };

    // Mo opens the Steeplands and covers it, all of it.
    await mo.page.goto(mapUrl);
    await mo.page.waitForSelector(".wm-stage");
    await until(() => picLoaded(mo.page), "the Steeplands on Mo's phone");
    await mo.page.click('[data-do="mfog"]');
    await mo.page.waitForSelector("#wm-fog-h");
    has(await text(mo.page, ".wm-card"), "stays hidden till you uncover its spot", "the fog's card says a pin under it stays hidden");
    has(await text(mo.page, ".wm-card"), "only hides it from here on", "and that the crew's seen this map already");
    await axe(mo.page, "the fog's card");
    await shot(mo.page, "fog-card");
    await mo.page.click('[data-do="mfogon"][data-v="all"]');
    await until(async () => (await steep())?.fog?.c === fogFull(map.w, map.h), "the Steeplands all under the fog on the server");
    same((await steep()).fog.crew, null, "with no crew's picture, since they see none of it");
    await mo.page.waitForSelector(".wm-bar.is-fog");
    yes(await mo.page.$eval(".wm-fog", (c) => !c.hidden && c.classList.contains("is-gm") && c.width > 0), "Mo sees his fog over the map, see-through in his violet");
    let kw = await kaiWorld();
    let km = kw.json?.world?.maps?.[0];
    same([km?.key, km?.fog?.c === fogFull(map.w, map.h), km?.pins], ["", true, []], "Kai's phone gets the map all under the fog, with no picture and none of the pins");
    yes(!kw.body.includes(map.key), "the map's own picture's key is off Kai's phone");
    same((await fetchPic(kai.page, picPath)).status, 404, "and Kai can't get its picture any more");
    same((await fetchPic(kai.page, `${picPath}&t=1`)).status, 404, "or its small one");

    // Kai has the map open, on the live table with the World screen.
    await kai.page.goto(mapUrl);
    await kai.page.waitForSelector(".wm-stage");
    await until(async () => (await kai.page.textContent("[data-wmnote]").catch(() => "")).includes("all under the fog"), "Kai's map says it's all under the fog");
    yes(await kai.page.$eval(".wm-fog", (c) => !c.hidden && !c.classList.contains("is-gm")), "and Kai sees solid fog");
    await until(() => kai.page.evaluate(async (p) => !(await (await caches.open("zi-maps")).match(new URL(p, location.origin).href)), picPath), "the map's own picture gone from Kai's phone");
    await kai.page.evaluate(() => {
      window.zdNudges = 0;
      addEventListener("zi-world", () => window.zdNudges++);
    });

    // Mo rubs the fog off the Copper Baths with the small brush, and a strip
    // lower down with the big one.
    await mo.page.click('[data-do="mfogsize"][data-s="small"]');
    await rubAcross([baths.x - 0.04, baths.y], [baths.x + 0.04, baths.y]);
    await mo.page.click('[data-do="mfogsize"][data-s="big"]');
    await rubAcross([0.3, 0.8], [0.7, 0.84]);
    await until(caughtUp, "the crew's picture of the fog he's rubbed on the server", 30000);
    let m = await caughtUp();
    let bits = fogBits(m.fog.c, map.w, map.h);
    same([spotCovered(bits, map.w, map.h, baths.x, baths.y), spotCovered(bits, map.w, map.h, vane.x, vane.y)], [false, true], "the Copper Baths uncovered, and Lord Vane still under the fog");
    const share = coveredShare(m.fog.c, map.w, map.h);
    yes(share > 0.6 && share < 0.99, `most of it still covered (${Math.round(share * 100)}%)`);
    yes(m.fog.crew.k !== map.key && (await picsOf(tuesday.id)).includes(`maps/${tuesday.id}/${m.fog.crew.k}`), "the crew's picture is a picture of its own, in the bucket");
    has(await text(mo.page, "[data-crewsay]"), "The crew sees what you’ve uncovered", "Mo's bar says the crew can see it");

    // On Kai's phone in a moment: the crew's picture, and the Copper Baths'
    // pin out from under the fog, told by the live table.
    const kaiPins = () => kai.page.$$eval(".wm-pin", (els) => els.map((e) => e.getAttribute("aria-label").split(",")[0]));
    await until(async () => JSON.stringify(await kaiPins()) === '["The Copper Baths"]', "the Copper Baths' pin on Kai's map, and no other", 6000);
    yes(await kai.page.evaluate(() => window.zdNudges > 0), "Kai's phone was told by the live table, not left to its next look");
    await until(() => picLoaded(kai.page), "the crew's picture on Kai's map");
    await until(async () => (await text(kai.page, "#cc-toast").catch(() => "")).includes("uncovered more of The Steeplands"), "a note on Kai's phone that Mo uncovered more of it");
    kw = await kaiWorld();
    km = kw.json.world.maps[0];
    same([km.key, km.fog.c === m.fog.c, km.pins.map((p) => p.name)], [m.fog.crew.k, true, ["The Copper Baths"]], "Kai's phone gets the crew's picture, the fog it was made with, and only the pin that's uncovered");
    yes(!kw.body.includes(map.key) && !kw.body.includes(vane.id), "never the map's own picture or Lord Vane's pin");
    same((await fetchPic(kai.page, picPath)).status, 404, "and Kai still can't get Mo's picture");

    // What's still covered never reaches Kai's phone, not even in the picture:
    // every covered square of the crew's picture is painted over, and the
    // uncovered ones match Mo's.
    const { gw, gh } = gridOf(map.w, map.h);
    const centres = [];
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) centres.push([i, j, Math.floor(((i + 0.5) * map.w) / gw), Math.floor(((j + 0.5) * map.h) / gh)]);
    const read = (page, path, spots) => page.evaluate(async ([p, s]) => {
      const bmp = await createImageBitmap(await (await fetch(p, { cache: "no-store" })).blob());
      const cv = new OffscreenCanvas(bmp.width, bmp.height);
      const g = cv.getContext("2d");
      g.drawImage(bmp, 0, 0);
      const d = g.getImageData(0, 0, bmp.width, bmp.height).data;
      return { w: bmp.width, h: bmp.height, px: s.map(([x, y]) => [d[(y * bmp.width + x) * 4], d[(y * bmp.width + x) * 4 + 1], d[(y * bmp.width + x) * 4 + 2]]) };
    }, [path, spots]);
    const crewPath = `/api/campaigns/${tuesday.id}/maps/${map.id}?k=${m.fog.crew.k}`;
    const theirs = await read(kai.page, crewPath, centres.map((c) => [c[2], c[3]]));
    const his = await read(mo.page, picPath, centres.map((c) => [c[2], c[3]]));
    same([theirs.w, theirs.h], [map.w, map.h], "the crew's picture is the map's size");
    const fill = [0x2b, 0x24, 0x33];
    const off = (a, b) => Math.max(...a.map((v, k) => Math.abs(v - b[k])));
    let worst = 0;
    let shown = 0;
    let matched = 0;
    let plain = 0;
    centres.forEach(([i, j], k) => {
      const idx = j * gw + i;
      if ((bits[idx >> 3] >> (idx & 7)) & 1) {
        worst = Math.max(worst, off(theirs.px[k], fill));
        if (off(his.px[k], fill) > 40) plain++;
      } else {
        shown++;
        if (off(theirs.px[k], his.px[k]) <= 28) matched++;
      }
    });
    yes(worst <= 18 && plain > 1000, `every covered square of the crew's picture is painted over (off by ${worst} at most, over ${plain} squares that aren't, on Mo's)`);
    yes(shown > 100 && matched / shown > 0.95, `and the uncovered ones are Mo's map (${matched} of ${shown})`);

    // He rubs the fog back over the Copper Baths, and Undo lifts it again.
    await mo.page.click('[data-do="mfogtool"][data-t="cover"]');
    await mo.page.click('[data-do="mfogsize"][data-s="small"]');
    await rubAcross([baths.x - 0.05, baths.y], [baths.x + 0.05, baths.y]);
    await until(async () => {
      const n = await caughtUp();
      return n && spotCovered(fogBits(n.fog.c, map.w, map.h), map.w, map.h, baths.x, baths.y);
    }, "the Copper Baths covered again, crew's picture and all", 30000);
    await until(async () => ((await kaiWorld()).json?.world?.maps?.[0]?.pins ?? [1]).length === 0, "the Copper Baths' pin off Kai's phone again");
    await mo.page.click('[data-do="mfogundo"]');
    await until(async () => {
      const n = await caughtUp();
      return n && !spotCovered(fogBits(n.fog.c, map.w, map.h), map.w, map.h, baths.x, baths.y);
    }, "Undo lifts it again", 30000);
    await until(async () => ((await kaiWorld()).json?.world?.maps?.[0]?.pins ?? []).length === 1, "and the pin's back on Kai's phone");
    await mo.page.click('[data-do="mfogtool"][data-t="lift"]');

    // Fog brushed back over what the crew's picture shows takes that picture
    // off them straight away, before Mo's phone has made another, and a
    // crew's picture that shows what's been covered since can't go back on.
    const open = await caughtUp();
    const worldPath = `/api/campaigns/${tuesday.id}/world`;
    const bathsCovered = (() => {
      const b = fogBits(open.fog.c, map.w, map.h);
      const { gw, gh } = gridOf(map.w, map.h);
      const k = Math.min(gh - 1, Math.floor(baths.y * gh)) * gw + Math.min(gw - 1, Math.floor(baths.x * gw));
      b[k >> 3] |= 1 << (k & 7);
      return fogText(b);
    })();
    await got(mo.page, "POST", worldPath, { dev: "mos-check-0011", ops: [{ n: 1, o: "m-fog", id: map.id, v: bathsCovered }] });
    same((await steep()).fog.crew, null, "fog brushed back over what the crew's picture shows takes it off them straight away");
    km = (await kaiWorld()).json.world.maps[0];
    same([km.key, km.pins.length], ["", 0], "so Kai gets fog and nothing else till Mo's phone makes another");
    same((await fetchPic(kai.page, `/api/campaigns/${tuesday.id}/maps/${map.id}?k=${open.fog.crew.k}`)).status, 404, "and the old crew's picture isn't hers to get");
    await got(mo.page, "POST", worldPath, { dev: "mos-check-0011", ops: [{ n: 2, o: "m-crew", id: map.id, key: open.fog.crew.k, c: open.fog.c }] });
    same((await steep()).fog.crew, null, "a crew's picture that shows what's been covered since can't go back on");
    await got(mo.page, "POST", worldPath, { dev: "mos-check-0011", ops: [{ n: 3, o: "m-fog", id: map.id, v: open.fog.c }] });
    await until(caughtUp, "Mo's phone makes the crew's picture again", 45000);

    // With no signal, Kai's map opens with the crew's picture and its fog.
    m = await caughtUp();
    const crewNow = `/api/campaigns/${tuesday.id}/maps/${map.id}?k=${m.fog.crew.k}`;
    await kai.page.goto(`${BASE}/characters/?c=vesk-aaaaaa&t=world`);
    await kai.page.waitForSelector(".wb-tab .wm-tok");
    await until(() => kai.page.evaluate(async (p) => Boolean(await (await caches.open("zi-maps")).match(new URL(p, location.origin).href)), crewNow), "the crew's picture kept on Kai's phone");
    yes(await kai.page.$eval(".wm-thumb-fog", (c) => c.width > 0).catch(() => false), "the map's small picture on the World tab has its fog over it");
    await kai.context.setOffline(true);
    await kai.page.click(".wm-tok-a");
    await until(async () => (await h1(kai.page)) === "The Steeplands", "the covered map with no signal");
    await until(() => picLoaded(kai.page), "its crew's picture with no signal");
    yes(await kai.page.$eval(".wm-fog", (c) => !c.hidden && c.width > 0), "and its fog");
    same(await kai.page.$$eval(".wm-pin", (els) => els.length), 1, "with the one pin that's uncovered");
    yes(!(await kai.page.evaluate(async (p) => Boolean(await (await caches.open("zi-maps")).match(new URL(p, location.origin).href)), picPath)), "and Mo's own picture nowhere on Kai's phone");
    await kai.context.setOffline(false);

    // Nothing crosses.
    same((await fetchPic(zed.page, crewNow)).status, 404, "Zed can't get the crew's picture");
    same((await got(kai.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "kais-phone-0013", ops: [{ n: 1, o: "m-fog", id: map.id, v: null }] })).status, 403, "Kai can't take the fog off");
    const upload = (page, campId, forMap, w, h) => page.evaluate(async ([c, f, w, h]) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      cv.getContext("2d").fillRect(0, 0, w, h);
      const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.8));
      const form = new FormData();
      form.append("pic", blob, "map");
      form.append("thumb", blob, "thumb");
      const r = await fetch(`/api/campaigns/${c}/maps?for=${f}`, { method: "POST", body: form });
      return r.status;
    }, [campId, forMap, w, h]);
    same(await upload(kai.page, tuesday.id, map.id, 300, 400), 403, "or send up a crew's picture");
    same(await upload(mo.page, tuesday.id, map.id, 300, 400), 400, "a crew's picture that isn't the map's size is turned away");
    same(await upload(kai.page, kaisTable.id, "kais-map", 1200, 800), 409, "and so is one for a map that isn't under the fog");
    const before = (await steep()).fog.crew.k;
    await got(mo.page, "POST", `/api/campaigns/${tuesday.id}/world`, { dev: "mos-check-0010", ops: [{ n: 1, o: "m-crew", id: map.id, key: map.key, c: fogFull(map.w, map.h, false) }] });
    same((await steep()).fog.crew.k, before, "and Mo's own picture can't be passed off as the crew's");
    // A new picture turned on its side comes in all under the fog, since the
    // old fog doesn't fit it.
    const putPic = (w, h) => mo.page.evaluate(async ([c, w, h]) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      cv.getContext("2d").fillRect(0, 0, w, h);
      const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.8));
      const form = new FormData();
      form.append("pic", blob, "map");
      form.append("thumb", blob, "thumb");
      return (await (await fetch(`/api/campaigns/${c}/maps`, { method: "POST", body: form })).json()).key;
    }, [tuesday.id, w, h]);
    const [wideKey, tallKey] = [await putPic(1200, 800), await putPic(800, 1200)];
    const sketch = { id: "fog-sketch", name: "Sideways sketch", key: wideKey, w: 1200, h: 800, of: "", fog: { c: fogFull(1200, 800, false) } };
    await got(mo.page, "POST", worldPath, { dev: "mos-check-0012", ops: [{ n: 1, o: "m-new", m: sketch }, { n: 2, o: "m-pic", id: sketch.id, key: tallKey, w: 800, h: 1200 }] });
    const turned = (await worldOf()).maps.find((x) => x.id === sketch.id);
    same([turned?.w, turned?.h, turned?.fog?.c === fogFull(800, 1200), turned?.fog?.crew], [800, 1200, true, null], "a new picture turned on its side comes in all under the fog");
    await got(mo.page, "POST", worldPath, { dev: "mos-check-0012", ops: [{ n: 3, o: "m-gone", id: sketch.id }] });

    // The screens at 390, in both themes: Mo's map with the fog's bar, and Kai's.
    for (const theme of ["dark", "light"]) {
      for (const p of [mo.page, kai.page]) await p.evaluate((t) => localStorage.setItem("zi-theme", t), theme);
      await mo.page.goto(mapUrl);
      await mo.page.waitForSelector(".wm-stage");
      await until(() => picLoaded(mo.page), `Mo's map, ${theme}`);
      await mo.page.click('[data-do="mfog"]');
      await mo.page.waitForSelector(".wm-bar.is-fog");
      await axe(mo.page, `rubbing the fog, ${theme}`);
      await shot(mo.page, `fog-gm-${theme}`);
      await mo.page.click('[data-do="mfogdone"]');
      await kai.page.goto(mapUrl);
      await kai.page.waitForSelector(".wm-stage");
      await until(() => picLoaded(kai.page), `Kai's covered map, ${theme}`);
      await axe(kai.page, `a covered map on Kai's phone, ${theme}`);
      await shot(kai.page, `fog-player-${theme}`);
    }
    for (const p of [mo.page, kai.page]) await p.evaluate(() => localStorage.setItem("zi-theme", "dark"));

    // Taking the fog off gives Kai the whole map back, with the pins.
    await mo.page.goto(mapUrl);
    await mo.page.waitForSelector(".wm-stage");
    await mo.page.click('[data-do="mpanel"]');
    await mo.page.waitForSelector(".wm-panel");
    has(await text(mo.page, ".wm-panel"), "% of it’s uncovered", "the map's list says how much of it's uncovered");
    await mo.page.click('[data-do="mfogoff"]');
    await mo.page.click('[data-do="mfogoff"]');
    await until(async () => !(await steep())?.fog, "the fog off on the server");
    kw = await kaiWorld();
    km = kw.json.world.maps[0];
    same([km.key, "fog" in km, km.pins.map((p) => p.name).sort()], [map.key, false, ["Lord Aldous Vane", "The Copper Baths"]], "Kai gets the map's own picture back, with both pins");
    yes((await picsOf(tuesday.id)).includes(`maps/${tuesday.id}/${m.fog.crew.k}`), "the crew's picture waits a few minutes in the bin, for a phone part way through fetching it");
  }
  console.log("9c. Fog she lifts");
  await checkFog();
  // ZI_UPTO=9c stops here, for a quicker look while working on the fog.
  if (UPTO === "9c") break rest;

  // ------------------------------------------------------------ 10. who can do what
  console.log("10. Who can do what");
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

  // ------------------------------------------------------------ 11. leaving
  console.log("11. Signing out, your data and deleting");
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
  same(await kai.page.evaluate(() => caches.has("zi-maps")), false, "and the maps' pictures");

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
  same(await picsOf(kaisTable.id), [], "and its map's pictures");
  yes(((await tableOf(tuesday.id))?.rounds ?? []).flatMap((r) => r.tele).every((t) => t.at.user !== kaiId && t.ans?.user !== kaiId && t.icp?.user !== kaiId), "and Tuesday Lair's table has forgotten her");
  await until(async () => (await tv.page.$$eval(".ts-p .ts-pn", (els) => els.map((e) => e.textContent))).join() === "Bram", "Vesk off the table screen's crew, on the TV, once Kai's gone", 4000);
  yes(((await tableOf(tuesday.id))?.rounds ?? []).every((r) => !Object.keys(r.acts ?? {}).some((k) => k.startsWith(`${kaiId}|`))), "and what she spent her actions on");
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
