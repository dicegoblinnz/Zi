// The site's Worker. Cloudflare serves every page and file straight from dist/,
// and only /api/ comes here (run_worker_first in wrangler.jsonc): sign-in
// (Better Auth, set up in auth.js), invites, the people Mo's picked as GMs,
// and the characters kept in an account. Every route checks who's asking on the
// server, and nothing private goes to someone who isn't signed in.
import { LIVE, authFor, hit, originsOf, providersOf, secureOf } from "./auth.js";

const HEAD = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (body, status = 200, extra = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { ...HEAD, ...extra } });
const fail = (status, error) => json({ error }, status);
const CHAR_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const CODE = /^[A-Za-z0-9_-]{16,64}$/;
const MAX_TEXT = 200000;
const MAX_CHARACTERS = 100;
const MAX_INVITES = 50;
const DAY = 86400000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!env.DB || !env.BETTER_AUTH_SECRET) return fail(503, "Sign-in isn’t switched on yet.");
    const route = url.pathname.split("/")[2] || "";
    try {
      if (route === "auth") return await auth(request, env, url);
      return await api(request, env, url);
    } catch (err) {
      // Only the route's name, never the path, which can hold an invite's code.
      console.error(`api ${route}: ${err?.message ?? err}`);
      return fail(500, "Something went wrong there. Try again in a minute.");
    }
  },
};

const inviteCookie = (env, code, age) => `zi-invite=${code}; Path=/api/auth; Max-Age=${age}; HttpOnly; SameSite=Lax${secureOf(env) ? "; Secure" : ""}`;

// Better Auth's own routes. Coming back from Google or Discord, the invite's
// done its job (or didn't work), so its cookie goes.
async function auth(request, env, url) {
  const res = await authFor(env).handler(request);
  if (!url.pathname.startsWith("/api/auth/callback/")) return res;
  const out = new Response(res.body, res);
  out.headers.append("set-cookie", inviteCookie(env, "", 0));
  return out;
}

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

async function api(request, env, url) {
  const method = request.method;
  let parts;
  try {
    parts = url.pathname.slice(5).split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return fail(400, "That address doesn’t look right.");
  }
  const [what, id, more] = parts;
  if (more !== undefined) return fail(404, "There’s nothing here.");
  // Changes only come from the site's own pages.
  if (method !== "GET" && !originsOf(env).includes(request.headers.get("origin"))) return fail(403, "That came from somewhere else.");

  if (what === "invite" && !id && method === "POST") return checkInvite(request, env);
  // Reading the session can renew it, and the renewed cookies go back with the
  // answer, so a player who's at the table every week stays signed in.
  const got = await authFor(env).api.getSession({ headers: request.headers, returnHeaders: true });
  const res = await routes(request, env, method, what, id, got.response);
  const cookies = got.headers?.getSetCookie?.() ?? [];
  if (!cookies.length) return res;
  const out = new Response(res.body, res);
  for (const c of cookies) out.headers.append("set-cookie", c);
  return out;
}

async function routes(request, env, method, what, id, session) {
  if (what === "me" && !id && method === "GET") {
    return json({ user: session ? { ...meOf(session.user), email: session.user.email } : null, providers: providersOf(env) });
  }
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
  if (what === "invites") {
    const role = await roleOf(env, user.id);
    if (role !== "admin" && role !== "gm") return fail(403, "Only Mo and the GMs he picks can hand out invites.");
    if (!id && method === "GET") return listInvites(env, user, role);
    if (!id && method === "POST") return makeInvite(request, env, user);
    if (id && method === "DELETE") return dropInvite(env, user, role, id);
  }
  if (what === "people") {
    if ((await roleOf(env, user.id)) !== "admin") return fail(403, "Only Mo can see who’s signed up.");
    if (!id && method === "GET") return listPeople(env);
    if (id && method === "POST") return setRole(request, env, id);
  }
  return fail(404, "There’s nothing here.");
}

// ---------------------------------------------------------------- invites

// Someone's opened an invite link and picked how to sign in. A live invite
// rides along to Google or Discord and back in a cookie, and the account's only
// made if it's still live then (auth.js).
async function checkInvite(request, env) {
  if (await limited(env, `invite:${request.headers.get("cf-connecting-ip") || "here"}`, 10, 900)) return fail(429, "That’s a lot of tries. Wait a few minutes and try again.");
  const code = (await body(request))?.code;
  const live = typeof code === "string" && CODE.test(code) && (await env.DB.prepare(`SELECT 1 AS ok FROM invite WHERE code = ?1 AND ${LIVE}`).bind(code, Date.now()).first());
  if (!live) return fail(400, "That invite link didn’t work. It might be used up or out of date, so ask whoever sent it for a new one.");
  return json({ ok: true }, 200, { "set-cookie": inviteCookie(env, code, 3600) });
}

async function listInvites(env, user, role) {
  const all = role === "admin";
  const { results } = await env.DB.prepare(`SELECT i.code, i.note, i.uses, i.used, i.createdAt, i.expiresAt, u.name AS by FROM invite i LEFT JOIN "user" u ON u.id = i.createdBy
    ${all ? "" : "WHERE i.createdBy = ?1"} ORDER BY i.createdAt DESC LIMIT 100`).bind(...(all ? [] : [user.id])).all();
  return json({ invites: results });
}

async function makeInvite(request, env, user) {
  const b = await body(request);
  if (!b) return fail(400, "That didn’t come through. Try again.");
  const live = await env.DB.prepare("SELECT COUNT(*) AS n FROM invite WHERE createdBy = ?1 AND used < uses AND expiresAt > ?2").bind(user.id, Date.now()).first();
  if (live.n >= MAX_INVITES) return fail(400, `You’ve got ${MAX_INVITES} invites waiting already. Cancel some first.`);
  // One account, two weeks. That's what the page says, so it's all the server makes.
  const note = String(b.note ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
  const uses = 1;
  const days = 14;
  const code = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Date.now();
  await env.DB.prepare("INSERT INTO invite (code, createdBy, note, uses, used, createdAt, expiresAt) VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6)").bind(code, user.id, note, uses, now, now + days * DAY).run();
  return json({ invite: { code, note, uses, used: 0, createdAt: now, expiresAt: now + days * DAY, by: user.name } });
}

async function dropInvite(env, user, role, code) {
  const res = role === "admin"
    ? await env.DB.prepare("DELETE FROM invite WHERE code = ?1").bind(code).run()
    : await env.DB.prepare("DELETE FROM invite WHERE code = ?1 AND createdBy = ?2").bind(code, user.id).run();
  return res.meta.changes ? json({ ok: true }) : fail(404, "That invite’s already gone.");
}

// ---------------------------------------------------------------- people

async function listPeople(env) {
  const { results } = await env.DB.prepare(`SELECT u.id, u.name, u.email, u.role, u.createdAt, i.name AS invitedBy FROM "user" u LEFT JOIN "user" i ON i.id = u.invitedBy ORDER BY u.createdAt LIMIT 500`).all();
  return json({ people: results.map((p) => ({ ...p, role: p.role || "member", createdAt: ms(p.createdAt) })) });
}

// Mo picks who's a GM, which lets them hand out invites. His own role stays,
// and someone who's no longer a GM loses the invites they made.
async function setRole(request, env, id) {
  const role = (await body(request))?.role;
  if (role !== "gm" && role !== "member") return fail(400, "That isn’t something Mo can make someone.");
  const steps = [env.DB.prepare(`UPDATE "user" SET role = ?1, updatedAt = ?3 WHERE id = ?2 AND COALESCE(role, 'member') != 'admin'`).bind(role, id, new Date().toISOString())];
  if (role === "member") steps.push(env.DB.prepare(`DELETE FROM invite WHERE createdBy = ?1 AND createdBy IN (SELECT id FROM "user" WHERE role = 'member')`).bind(id));
  const [res] = await env.DB.batch(steps);
  return res.meta.changes ? json({ ok: true, role }) : fail(404, "There’s nobody like that to change.");
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

// ---------------------------------------------------------------- your data

// Everything the account holds about you, as a file. Invite codes stay out.
async function download(env, user) {
  const q = (sql) => env.DB.prepare(sql).bind(user.id);
  const [u, accounts, chars, invites] = await env.DB.batch([
    q('SELECT name, email, role, createdAt FROM "user" WHERE id = ?1'),
    q("SELECT providerId, createdAt FROM account WHERE userId = ?1"),
    q("SELECT data FROM character WHERE userId = ?1 AND data IS NOT NULL"),
    q("SELECT note, uses, used, createdAt, expiresAt FROM invite WHERE createdBy = ?1"),
  ]);
  const out = {
    account: u.results[0] ?? null,
    signIns: accounts.results.map((a) => a.providerId),
    characters: chars.results.map((c) => JSON.parse(c.data)),
    invites: invites.results,
  };
  return new Response(JSON.stringify(out, null, 2), { headers: { ...HEAD, "content-disposition": 'attachment; filename="zidara-account.json"' } });
}
