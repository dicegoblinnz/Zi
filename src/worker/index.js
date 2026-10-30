// The site's Worker. Cloudflare serves every page and file straight from dist/,
// and only /api/ comes here (run_worker_first in wrangler.jsonc): sign-in
// (Better Auth, set up in auth.js), the characters kept in an account,
// campaigns, and the people who've signed up, for Mo. Every route checks who's
// asking on the server, and nothing private goes to someone who isn't signed in.
//
// A campaign is its own group. Its GM and its players are the only ones who
// see who's in it and which characters they play, the GM sees every character
// in it, and players see each other's names. Every campaign request checks the
// person asking against that one campaign, so nothing crosses between them.
// The one way in without signing in is a table screen's code, which only
// ever gets what the crew sees of that campaign's live table (table.js).
import { authFor, hit, originsOf, providersOf, seen } from "./auth.js";
import { changeParty, dropFromParty, showParty } from "./party.js";
import { changeWorld, showWorld } from "./world.js";
import { getPicture, mapsEnd, putPicture } from "./maps.js";
import { screenCode, screenRoute, tableEnd, tableLeft, tableRoute, tableScreenOff } from "./table.js";

// The live table's Durable Object class, one for each campaign (table.js).
export { Table } from "./table.js";

const HEAD = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (body, status = 200, extra = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { ...HEAD, ...extra } });
const fail = (status, error) => json({ error }, status);
const CHAR_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const CAMP_ID = /^[A-Za-z0-9_-]{12}$/;
const CODE = /^[A-Za-z0-9_-]{16,64}$/;
const USER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_TEXT = 200000;
const MAX_CHARACTERS = 100;
const MAX_RUNNING = 20; // campaigns one GM runs
const MAX_JOINED = 50; // campaigns one player's in
const MAX_PLAYERS = 30; // players in one campaign
const NAME_MAX = 40;
const NOTHING = "There’s nothing here.";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!env.DB || !env.BETTER_AUTH_SECRET) return fail(503, "Sign-in isn’t switched on yet.");
    const route = url.pathname.split("/")[2] || "";
    try {
      if (route === "auth") return await authFor(env).handler(request);
      return await api(request, env, url);
    } catch (err) {
      // Only the route's name, never the path or the body.
      console.error(`api ${route}: ${err?.message ?? err}`);
      return fail(500, "Something went wrong there. Try again in a minute.");
    }
  },
};

// True once a key's had more than max goes in the last so many seconds.
const limited = async (env, key, max, seconds) => (await hit(env, key, seconds)).count > max;

async function body(request) {
  try {
    const text = await request.text();
    if (text.length > MAX_TEXT) return null;
    const data = JSON.parse(text || "{}");
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

const meOf = (user) => ({ id: user.id, name: user.name, role: user.role || "member" });
const roleOf = async (env, id) => (await env.DB.prepare('SELECT role FROM "user" WHERE id = ?1').bind(id).first())?.role || "member";
const ms = (v) => (typeof v === "number" ? v : Date.parse(v) || null);
// Random and unguessable: a campaign's id is 9 bytes, a join link's code 12.
const token = (bytes) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// A campaign's name: one line, no more than 40 characters.
const nameOf = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
// FNV-1a, to say whether a campaign's changed since the phone last looked.
function stampOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

async function api(request, env, url) {
  const method = request.method;
  let parts;
  try {
    parts = url.pathname.slice(5).split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return fail(400, "That address doesn’t look right.");
  }
  if (parts.length > 4 || (parts[0] !== "campaigns" && parts.length > 2)) return fail(404, NOTHING);
  // A table screen opens with its own code and never signs in, so nobody's
  // session is looked at (table.js).
  if (parts[0] === "screen") return parts.length === 2 && method === "GET" ? screenRoute(request, env, parts[1], { json, fail, origins: originsOf(env), limited }) : fail(404, NOTHING);
  // Changes only come from the site's own pages.
  if (method !== "GET" && !originsOf(env).includes(request.headers.get("origin"))) return fail(403, "That came from somewhere else.");

  // Reading the session can renew it, and the renewed cookies go back with the
  // answer, so a player who's at the table every week stays signed in.
  const got = await authFor(env).api.getSession({ headers: request.headers, returnHeaders: true });
  const res = await routes(request, env, url, method, parts, got.response);
  const cookies = got.headers?.getSetCookie?.() ?? [];
  // A socket handed over to the live table goes back as it is.
  if (!cookies.length || res.status === 101) return res;
  const out = new Response(res.body, res);
  for (const c of cookies) out.headers.append("set-cookie", c);
  return out;
}

async function routes(request, env, url, method, [what, id, sub, subId], session) {
  if (what === "me" && !id && method === "GET") {
    return json({ user: session ? { ...meOf(session.user), email: session.user.email } : null, providers: providersOf(env) });
  }
  // A join link says which campaign it's for to anyone who has it, signed in
  // or not, so the page can show it before they sign in.
  if (what === "join" && !id && method === "POST") return join(request, env, session);
  if (!session) return fail(401, "Sign in first.");
  const user = session.user;

  if (what === "me" && id === "data" && method === "GET") return download(env, user);
  if (what === "characters") {
    if (!id && method === "GET") return listCharacters(env, user);
    if (id && (method === "PUT" || method === "DELETE")) {
      if (!CHAR_ID.test(id)) return fail(400, "That isn’t a character.");
      if (await limited(env, `write:${user.id}`, 600, 600)) return fail(429, "That’s a lot of changes at once. Give it a few minutes.");
      return method === "PUT" ? putCharacter(request, env, user, id) : dropCharacter(env, user, id);
    }
  }
  if (what === "campaigns") return campaigns(request, env, url, method, user, id, sub, subId);
  if (what === "people" && !id && method === "GET") {
    if ((await roleOf(env, user.id)) !== "admin") return fail(403, "Only Mo can see who’s signed up.");
    return listPeople(env);
  }
  return fail(404, NOTHING);
}

// ---------------------------------------------------------------- people

// Everyone who's signed up, newest first, for Mo.
async function listPeople(env) {
  const [list, count] = await env.DB.batch([
    env.DB.prepare('SELECT name, email, role, createdAt FROM "user" ORDER BY createdAt DESC LIMIT 500'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM "user"'),
  ]);
  return json({ people: list.results.map((p) => ({ ...p, role: p.role || "member", createdAt: ms(p.createdAt) })), total: count.results[0].n });
}

// ---------------------------------------------------------------- characters

// The JSON's kept as it came in, so it goes back out without being taken apart.
const charJSON = (r) => `{"id":${JSON.stringify(r.id)},"v":${Number(r.version) || 0},"data":${r.data ?? "null"}}`;

async function listCharacters(env, user) {
  const { results } = await env.DB.prepare("SELECT id, version, data FROM character WHERE userId = ?1").bind(user.id).all();
  return json(`{"me":${JSON.stringify(meOf(user))},"characters":[${results.map(charJSON).join(",")}]}`);
}

// A change goes in only on top of the version the phone last had (v, or 0 for
// one the account hasn't got). Anything else gets the account's copy back, and
// the phone decides which is newer.
async function putCharacter(request, env, user, id) {
  const b = await body(request);
  const v = b?.v;
  const data = b?.data;
  if (!Number.isInteger(v) || v < 0 || !data || typeof data !== "object" || Array.isArray(data) || data.id !== id || typeof data.crew !== "string") return fail(400, "That doesn’t look like a character.");
  const text = JSON.stringify(data);
  if (text.length > MAX_TEXT) return fail(413, "That character’s too big to keep.");
  const now = Date.now();
  let row;
  if (v === 0) {
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM character WHERE userId = ?1 AND data IS NOT NULL").bind(user.id).first();
    if (n.n >= MAX_CHARACTERS) return fail(400, `An account keeps up to ${MAX_CHARACTERS} characters.`);
    row = await env.DB.prepare("INSERT INTO character (userId, id, data, version, updatedAt) VALUES (?1, ?2, ?3, 1, ?4) ON CONFLICT DO NOTHING RETURNING version").bind(user.id, id, text, now).first();
  } else {
    row = await env.DB.prepare("UPDATE character SET data = ?3, version = version + 1, updatedAt = ?4 WHERE userId = ?1 AND id = ?2 AND version = ?5 RETURNING version").bind(user.id, id, text, now, v).first();
  }
  if (row) return json({ v: row.version });
  const now2 = await env.DB.prepare("SELECT id, version, data FROM character WHERE userId = ?1 AND id = ?2").bind(user.id, id).first();
  return json(charJSON(now2 ?? { id, version: 0, data: null }), 409);
}

async function dropCharacter(env, user, id) {
  const row = await env.DB.prepare("UPDATE character SET data = NULL, version = version + 1, updatedAt = ?3 WHERE userId = ?1 AND id = ?2 AND data IS NOT NULL RETURNING version").bind(user.id, id, Date.now()).first();
  return json({ v: row?.version ?? null });
}

// One of their own characters, in their account. Only those can be played in a campaign.
const ownCharacter = (env, user, id) => (typeof id === "string" && CHAR_ID.test(id)
  ? env.DB.prepare("SELECT 1 AS ok FROM character WHERE userId = ?1 AND id = ?2 AND data IS NOT NULL").bind(user.id, id).first()
  : null);
// A character plays in one campaign at a time, so what they do in one never
// reaches another campaign's GM. This says where they're playing, if anywhere.
const playingIn = (env, user, id, except = "") => env.DB.prepare("SELECT c.name FROM member m JOIN campaign c ON c.id = m.campaignId WHERE m.userId = ?1 AND m.characterId = ?2 AND m.campaignId != ?3")
  .bind(user.id, id, except).first();
const busyWith = (where) => fail(409, `They’re playing in ${where.name} already, and a character plays in one campaign at a time. Bring someone else.`);
// Two taps at once can both get past that check, and then the database says no
// to the second one (member_character_idx), which comes back as null here.
const unique = (err) => {
  if (/UNIQUE constraint failed/i.test(String(err?.message))) return null;
  throw err;
};

// ---------------------------------------------------------------- campaigns

// Opening a join link. With just its code, this says which campaign it's for
// and who's its GM, and whether you're in it already. With a character too,
// you join with them. The code's checked again as you go in, so a link the GM
// reset a moment ago doesn't let anyone in. Codes that don't work are counted
// against the address they came from, so nobody can guess at them, while a
// whole table joining on the shop's wifi never trips it.
const BAD_LINK = "That link didn’t work. Your GM might’ve reset it, so ask them for the new one.";
async function join(request, env, session) {
  const me = session?.user ?? null;
  const misses = `join-miss:${request.headers.get("cf-connecting-ip") || "here"}`;
  if ((await seen(env, misses, 900)) >= 20 || (me && (await limited(env, `join:${me.id}`, 60, 900)))) return fail(429, "That’s a lot of tries. Wait a few minutes and try again.");
  const b = await body(request);
  const code = b?.code;
  const camp = typeof code === "string" && CODE.test(code) && (await env.DB.prepare('SELECT c.id, c.name, c.gmId, u.name AS gm FROM campaign c JOIN "user" u ON u.id = c.gmId WHERE c.code = ?1').bind(code).first());
  if (!camp) {
    await hit(env, misses, 900);
    return fail(404, BAD_LINK);
  }
  const role = !me ? null : camp.gmId === me.id ? "gm" : (await env.DB.prepare("SELECT 1 AS ok FROM member WHERE campaignId = ?1 AND userId = ?2").bind(camp.id, me.id).first()) ? "player" : null;
  const about = { name: camp.name, gm: camp.gm, id: role ? camp.id : null, role };
  if (b.character === undefined || role) return json({ campaign: about });
  if (!me) return fail(401, "Sign in first.");
  if (!(await ownCharacter(env, me, b.character))) return fail(409, "That character isn’t in your account yet.");
  const elsewhere = await playingIn(env, me, b.character);
  if (elsewhere) return busyWith(elsewhere);
  const n = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM member WHERE campaignId = ?1) AS players, (SELECT COUNT(*) FROM member WHERE userId = ?2) AS mine").bind(camp.id, me.id).first();
  if (n.players >= MAX_PLAYERS) return fail(400, `${camp.name} has ${MAX_PLAYERS} players already, so it’s full.`);
  if (n.mine >= MAX_JOINED) return fail(400, `You’re in ${MAX_JOINED} campaigns already. Leave one first.`);
  const res = await env.DB.prepare("INSERT INTO member (campaignId, userId, characterId, joinedAt) SELECT id, ?2, ?3, ?4 FROM campaign WHERE id = ?1 AND code = ?5 ON CONFLICT (campaignId, userId) DO NOTHING")
    .bind(camp.id, me.id, b.character, Date.now(), code).run().catch(unique);
  if (!res) return busyWith(await playingIn(env, me, b.character, camp.id) ?? { name: "another campaign" });
  // Nothing went in: they're in already (a second tap, or another tab got
  // there first), or the link was reset a moment ago.
  if (!res.meta.changes && !(await env.DB.prepare("SELECT 1 AS ok FROM member WHERE campaignId = ?1 AND userId = ?2").bind(camp.id, me.id).first())) return fail(404, BAD_LINK);
  return json({ campaign: { ...about, id: camp.id, role: "player" } });
}

async function campaigns(request, env, url, method, user, id, sub, subId) {
  if (!id && !sub) {
    if (method === "GET") return listCampaigns(env, user);
    if (method === "POST") return startCampaign(request, env, user);
    return fail(404, NOTHING);
  }
  if (!CAMP_ID.test(id || "")) return fail(404, NOTHING);
  // Who's asking, against this one campaign: its GM, one of its players, or
  // nobody. Nobody gets the same answer as a campaign that doesn't exist.
  const camp = await env.DB.prepare(`SELECT c.id, c.name, c.code, c.screen, c.gmId, u.name AS gm, CASE WHEN c.gmId = ?2 THEN 'gm' ELSE 'player' END AS role
    FROM campaign c JOIN "user" u ON u.id = c.gmId
    WHERE c.id = ?1 AND (c.gmId = ?2 OR EXISTS (SELECT 1 FROM member m WHERE m.campaignId = c.id AND m.userId = ?2))`).bind(id, user.id).first();
  if (!camp) return fail(404, "You’re not in that campaign.");
  const gm = camp.role === "gm";
  const gmOnly = () => fail(403, "Only the GM can do that.");
  if (method !== "GET" && (await limited(env, `write:${user.id}`, 600, 600))) return fail(429, "That’s a lot of changes at once. Give it a few minutes.");
  if (!sub) {
    if (method === "GET") return showCampaign(env, url, camp);
    if (method === "PATCH") return gm ? renameCampaign(request, env, user, camp) : gmOnly();
    if (method === "DELETE") return gm ? endCampaign(env, camp) : gmOnly();
  }
  // The party sheet's the whole crew's, so the GM and every player can change it.
  if (sub === "party" && !subId) {
    if (method === "GET") return showParty(env, url, camp, user, { json });
    if (method === "POST") return changeParty(request, env, camp, user, { json, fail, body });
  }
  // The world, starting with its faction board (world.js). Everyone in the
  // campaign sees what the crew's been shown, and only the GM changes it.
  if (sub === "world" && !subId) {
    if (method === "GET") return showWorld(env, url, camp, user, { json });
    if (method === "POST") return gm ? changeWorld(request, env, camp, user, { json, fail, body, isAdmin: async () => (await roleOf(env, user.id)) === "admin" }) : gmOnly();
  }
  // A map's picture (maps.js): the GM puts them up, and her players get a
  // map's picture once she's shown the crew the map.
  if (sub === "maps") {
    if (!subId && method === "POST") return gm ? putPicture(request, env, camp, user, { json, fail, limited }) : gmOnly();
    if (subId && method === "GET") return getPicture(url, env, camp, subId, { fail });
  }
  // The live table: the round's telegraphs and how each one went (table.js).
  if (sub === "table" && !subId) return tableRoute(request, env, method, camp, user, { json, fail, body, origins: originsOf(env), limited });
  if (sub === "link" && !subId && method === "POST") return gm ? resetLink(env, camp) : gmOnly();
  if (sub === "screen" && !subId && method === "POST") return gm ? newScreen(request, env, camp) : gmOnly();
  if (sub === "me" && !subId && method === "PUT") return gm ? fail(400, "You’re the GM, so you don’t bring a character.") : pickCharacter(request, env, user, camp);
  if (sub === "members" && subId && method === "DELETE") {
    if (!USER_ID.test(subId)) return fail(404, NOTHING);
    if (!gm && subId !== user.id) return gmOnly();
    if (subId === camp.gmId) return fail(400, "You’re the GM, so you can’t leave it. End it instead.");
    const res = await env.DB.prepare("DELETE FROM member WHERE campaignId = ?1 AND userId = ?2").bind(camp.id, subId).run();
    if (!res.meta.changes) return fail(404, "They’re not in this campaign.");
    // Their phones stop hearing the table first, since that can't fail.
    await tableLeft(env, camp.id, subId);
    await dropFromParty(env, camp.id, subId);
    return json({ ok: true });
  }
  return fail(404, NOTHING);
}

// The campaigns you run and the ones you play in, by name.
async function listCampaigns(env, user) {
  const { results } = await env.DB.prepare(`SELECT c.id, c.name, u.name AS gm, 'gm' AS role, NULL AS characterId, NULL AS character,
      (SELECT COUNT(*) FROM member n WHERE n.campaignId = c.id) AS players
    FROM campaign c JOIN "user" u ON u.id = c.gmId WHERE c.gmId = ?1
    UNION ALL
    SELECT c.id, c.name, u.name, 'player', m.characterId, json_extract(ch.data, '$.name'),
      (SELECT COUNT(*) FROM member n WHERE n.campaignId = c.id)
    FROM member m JOIN campaign c ON c.id = m.campaignId JOIN "user" u ON u.id = c.gmId
    LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL
    WHERE m.userId = ?1
    ORDER BY 2 COLLATE NOCASE, 1`).bind(user.id).all();
  return json({ campaigns: results.map((r) => ({ id: r.id, name: r.name, gm: r.gm, role: r.role, players: r.players, character: r.role === "player" && r.character != null ? { id: r.characterId, name: String(r.character) } : null })) });
}

async function nameTaken(env, user, name, except = "") {
  return Boolean(await env.DB.prepare("SELECT 1 AS ok FROM campaign WHERE gmId = ?1 AND lower(name) = lower(?2) AND id != ?3").bind(user.id, name, except).first());
}

// Anyone signed in starts one, and they're its GM.
async function startCampaign(request, env, user) {
  if (await limited(env, `start:${user.id}`, 10, 3600)) return fail(429, "That’s a lot of new campaigns at once. Give it a while.");
  const name = nameOf((await body(request))?.name);
  if (!name) return fail(400, "Give it a name first.");
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign WHERE gmId = ?1").bind(user.id).first();
  if (n.n >= MAX_RUNNING) return fail(400, `You’re running ${MAX_RUNNING} campaigns already. End one first.`);
  if (await nameTaken(env, user, name)) return fail(400, "You’ve already got a campaign called that.");
  const id = token(9);
  const code = token(12);
  await env.DB.prepare("INSERT INTO campaign (id, name, gmId, code, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)").bind(id, name, user.id, code, Date.now()).run();
  return json({ campaign: { id, name, gm: user.name, role: "gm", players: 0, character: null, code } });
}

// Who's in it and who they're playing. The GM gets each player's character
// whole, as their phone last sent it (less the gold marks' record of what
// every line used to say), and the join link's code. A player gets names.
// With ?v= the phone says what it saw last, and if nothing's changed since,
// that's all that comes back.
async function showCampaign(env, url, camp) {
  const gm = camp.role === "gm";
  const { results } = await env.DB.prepare(`SELECT m.userId AS id, u.name, m.characterId, ch.version,
      ${gm ? "json_remove(ch.data, '$.state.seen')" : "json_extract(ch.data, '$.name')"} AS data
    FROM member m JOIN "user" u ON u.id = m.userId
    LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL
    WHERE m.campaignId = ?1 ORDER BY m.joinedAt, m.userId`).bind(camp.id).all();
  const v = stampOf(JSON.stringify([camp.name, camp.gm, gm ? camp.code : "", gm ? camp.screen ?? "" : "", results.map((r) => [r.id, r.name, r.data == null ? "" : r.characterId, r.version ?? 0])]));
  if (url.searchParams.get("v") === v) return json({ same: true, v });
  const head = { id: camp.id, name: camp.name, gm: camp.gm, gmId: camp.gmId, role: camp.role, ...(gm ? { code: camp.code, screen: camp.screen ?? null } : {}) };
  const players = results.map((r) => (gm
    ? `{"id":${JSON.stringify(r.id)},"name":${JSON.stringify(r.name)},"character":${r.data ?? "null"}}`
    : JSON.stringify({ id: r.id, name: r.name, character: r.data == null ? null : { id: r.characterId, name: String(r.data) } })));
  return json(`{"v":${JSON.stringify(v)},"campaign":${JSON.stringify(head)},"players":[${players.join(",")}]}`);
}

async function renameCampaign(request, env, user, camp) {
  const name = nameOf((await body(request))?.name);
  if (!name) return fail(400, "Give it a name first.");
  if (await nameTaken(env, user, name, camp.id)) return fail(400, "You’ve already got a campaign called that.");
  await env.DB.prepare("UPDATE campaign SET name = ?2 WHERE id = ?1").bind(camp.id, name).run();
  return json({ name });
}

// It ends for everyone, and its party sheet, world, maps and live table go
// with it. Their characters are theirs, so they stay.
async function endCampaign(env, camp) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM party WHERE campaignId = ?1").bind(camp.id),
    env.DB.prepare("DELETE FROM world WHERE campaignId = ?1").bind(camp.id),
    env.DB.prepare("DELETE FROM member WHERE campaignId = ?1").bind(camp.id),
    env.DB.prepare("DELETE FROM campaign WHERE id = ?1").bind(camp.id),
  ]);
  await tableEnd(env, camp.id);
  await mapsEnd(env, camp.id);
  return json({ ok: true });
}

// A new code, so the old link stops working. Everyone in stays in.
async function resetLink(env, camp) {
  const code = token(12);
  await env.DB.prepare("UPDATE campaign SET code = ?2 WHERE id = ?1").bind(camp.id, code).run();
  return json({ code });
}

// The table screen's code: made the first time she opens it, and the one
// that's there whenever she opens it again, from any of her phones. Only a
// reset ({ reset: true }) makes a new one, so the old link stops working and
// every screen showing it goes.
async function newScreen(request, env, camp) {
  const reset = (await body(request))?.reset === true;
  if (camp.screen && !reset) return json({ screen: camp.screen });
  for (let tries = 0; tries < 3; tries++) {
    const screen = screenCode();
    const res = await env.DB.prepare(`UPDATE campaign SET screen = ?2 WHERE id = ?1${reset ? "" : " AND screen IS NULL"}`).bind(camp.id, screen).run().catch((err) => (/UNIQUE/i.test(String(err?.message)) ? null : Promise.reject(err)));
    if (!res) continue;
    if (!res.meta.changes) {
      // Another of her phones made one a moment ago, so that's the one.
      const made = (await env.DB.prepare("SELECT screen FROM campaign WHERE id = ?1").bind(camp.id).first())?.screen;
      if (made) return json({ screen: made });
      continue;
    }
    await tableScreenOff(env, camp.id, screen);
    return json({ screen });
  }
  return fail(500, "That didn’t make the screen’s code. Try again in a minute.");
}

// A player changes who they're playing here, to another of their own who
// isn't playing anywhere else.
async function pickCharacter(request, env, user, camp) {
  const id = (await body(request))?.character;
  if (!(await ownCharacter(env, user, id))) return fail(409, "That character isn’t in your account yet.");
  const elsewhere = await playingIn(env, user, id, camp.id);
  if (elsewhere) return busyWith(elsewhere);
  const res = await env.DB.prepare("UPDATE member SET characterId = ?3 WHERE campaignId = ?1 AND userId = ?2").bind(camp.id, user.id, id).run().catch(unique);
  if (!res) return busyWith(await playingIn(env, user, id, camp.id) ?? { name: "another campaign" });
  return json({ ok: true });
}

// ---------------------------------------------------------------- your data

// Everything the account holds about you, as a file. Join links stay out.
async function download(env, user) {
  const q = (sql) => env.DB.prepare(sql).bind(user.id);
  const [u, accounts, chars] = await env.DB.batch([
    q('SELECT name, email, role, createdAt FROM "user" WHERE id = ?1'),
    q("SELECT providerId, createdAt FROM account WHERE userId = ?1"),
    q("SELECT data FROM character WHERE userId = ?1 AND data IS NOT NULL"),
  ]);
  // The campaigns too, once their tables have reached this database.
  const [running, playing] = await env.DB.batch([
    q("SELECT name, createdAt FROM campaign WHERE gmId = ?1"),
    q(`SELECT c.name, m.joinedAt, json_extract(ch.data, '$.name') AS character FROM member m JOIN campaign c ON c.id = m.campaignId
      LEFT JOIN character ch ON ch.userId = m.userId AND ch.id = m.characterId AND ch.data IS NOT NULL WHERE m.userId = ?1`),
  ]).catch((err) => {
    if (/no such table/i.test(String(err?.message))) return [{ results: [] }, { results: [] }];
    throw err;
  });
  const out = {
    account: u.results[0] ?? null,
    signIns: accounts.results.map((a) => a.providerId),
    characters: chars.results.map((c) => JSON.parse(c.data)),
    campaigns: [...running.results.map((c) => ({ name: c.name, role: "GM", started: c.createdAt })), ...playing.results.map((c) => ({ name: c.name, role: "player", joined: c.joinedAt, playing: c.character ?? null }))],
  };
  return new Response(JSON.stringify(out, null, 2), { headers: { ...HEAD, "content-disposition": 'attachment; filename="zidara-account.json"' } });
}
