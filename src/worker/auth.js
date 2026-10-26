// Accounts on the Zi'Dara site: Better Auth, keeping everything in the site's
// own D1 database. People sign in with Google or Discord, and anyone can sign
// up (27 Oct 2026). Mo's the admin: his address is the ADMIN_EMAIL secret,
// checked by Google or Discord. There are no passwords, since hashing one
// safely takes more time than a free Worker gets.
import { betterAuth } from "better-auth";
import { dropFromParty } from "./party.js";
import { tableEnd, tableLeft } from "./table.js";

const DAY = 60 * 60 * 24;
const NO_TOKENS = { accessToken: null, refreshToken: null, idToken: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null };
const local = (host) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);

// The hosts sign-in works on, zidara.world first. A Preview's host can be added
// to AUTH_HOSTS so sign-in works there too.
export const hostsOf = (env) => String(env.AUTH_HOSTS || "zidara.world").split(",").map((h) => h.trim()).filter(Boolean);
export const originsOf = (env) => hostsOf(env).map((h) => `${local(h) ? "http" : "https"}://${h}`);
export const secureOf = (env) => !hostsOf(env).every(local);

// Rate limits, kept in the limits table under an HMAC of the key, so no
// address is ever stored. Old rows go now and then.
const signers = new WeakMap();
async function hmac(env, text) {
  let key = signers.get(env);
  if (!key) signers.set(env, (key = crypto.subtle.importKey("raw", new TextEncoder().encode(env.BETTER_AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key, new TextEncoder().encode(text)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}
// How many goes a key's had in the last so many seconds, without adding one.
export async function seen(env, key, seconds) {
  const row = await env.DB.prepare("SELECT count, since FROM limits WHERE key = ?1").bind(await hmac(env, key)).first();
  return row && row.since >= Date.now() - seconds * 1000 ? row.count : 0;
}
export async function hit(env, key, seconds) {
  const now = Date.now();
  const row = await env.DB.prepare(`INSERT INTO limits (key, count, since) VALUES (?1, 1, ?2)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN since < ?3 THEN 1 ELSE count + 1 END, since = CASE WHEN since < ?3 THEN ?2 ELSE since END
    RETURNING count, since`).bind(await hmac(env, key), now, now - seconds * 1000).first();
  if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM limits WHERE since < ?1").bind(now - 86400000).run();
  return row;
}

// A new account is Mo's (the admin) when Google or Discord has checked that
// it's his address, and everyone else's is a member's.
function roleOf(env, user) {
  const email = String(user.email || "").toLowerCase();
  const admin = String(env.ADMIN_EMAIL || "").trim().toLowerCase();
  return admin && email === admin && [true, "true", 1].includes(user.emailVerified) ? "admin" : "member";
}

export const providersOf = (env) => [
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? "google" : null,
  env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? "discord" : null,
].filter(Boolean);

export function optionsFor(env) {
  const secure = secureOf(env);
  const origins = originsOf(env);
  // The least we can keep: a name and an email. No picture, since the site
  // doesn't show one and fetches nothing from anywhere else.
  const noPicture = () => ({ image: null });
  const socialProviders = {};
  if (providersOf(env).includes("google")) socialProviders.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account", mapProfileToUser: noPicture };
  if (providersOf(env).includes("discord")) socialProviders.discord = { clientId: env.DISCORD_CLIENT_ID, clientSecret: env.DISCORD_CLIENT_SECRET, mapProfileToUser: noPicture };
  return {
    appName: "Zi’Dara",
    baseURL: { allowedHosts: hostsOf(env), fallback: origins[0], protocol: secure ? "https" : "http" },
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: origins,
    socialProviders,
    user: {
      additionalFields: {
        // admin (Mo) or member. Being a GM belongs to a campaign, not an account.
        role: { type: "string", required: false, defaultValue: "member", input: false },
      },
      deleteUser: {
        enabled: true,
        // They leave every campaign they're in, the campaigns they run end for
        // everyone, and their characters go. An account still goes if the
        // campaign tables haven't reached this database yet.
        beforeDelete: async (user) => {
          // The party sheets of the campaigns they run go, and their threads come
          // off the ones they play in.
          const missing = (err) => {
            if (!/no such table/i.test(String(err?.message))) throw err;
          };
          await env.DB.prepare("DELETE FROM party WHERE campaignId IN (SELECT id FROM campaign WHERE gmId = ?1)").bind(user.id).run().catch(missing);
          const playing = await env.DB.prepare("SELECT campaignId FROM member WHERE userId = ?1").bind(user.id).all().catch((err) => (missing(err), { results: [] }));
          for (const m of playing.results) await dropFromParty(env, m.campaignId, user.id).catch(missing);
          // The live tables of the campaigns they run go, and their phones stop
          // hearing the ones they play in.
          const running = await env.DB.prepare("SELECT id FROM campaign WHERE gmId = ?1").bind(user.id).all().catch((err) => (missing(err), { results: [] }));
          for (const c of running.results) await tableEnd(env, c.id);
          for (const m of playing.results) await tableLeft(env, m.campaignId, user.id);
          await env.DB.batch([
            env.DB.prepare("DELETE FROM member WHERE userId = ?1 OR campaignId IN (SELECT id FROM campaign WHERE gmId = ?1)").bind(user.id),
            env.DB.prepare("DELETE FROM campaign WHERE gmId = ?1").bind(user.id),
          ]).catch((err) => {
            if (!/no such table/i.test(String(err?.message))) throw err;
          });
          await env.DB.prepare("DELETE FROM character WHERE userId = ?1").bind(user.id).run();
        },
      },
    },
    // A month signed in, kept going by use, so a player who's at the table
    // every week never has to sign in again. The session's checked against the
    // database at most every five minutes.
    session: { expiresIn: 30 * DAY, updateAge: DAY, cookieCache: { enabled: true, maxAge: 5 * 60 } },
    // A second way in joins the same account only when Google or Discord says
    // the email's been checked.
    // Google's and Discord's tokens aren't kept, since the site never calls
    // them after sign-in.
    account: { accountLinking: { enabled: true }, updateAccountOnSignIn: false },
    rateLimit: {
      enabled: true, window: 60, max: 60,
      customRules: { "/sign-in/social": { window: 60, max: 10 }, "/delete-user": { window: 60, max: 5 } },
      customStorage: {
        consume: async (key, rule) => {
          const { count, since } = await hit(env, `auth:${key}`, rule.window);
          return count <= rule.max ? { allowed: true, retryAfter: null } : { allowed: false, retryAfter: Math.max(1, Math.ceil((since + rule.window * 1000 - Date.now()) / 1000)) };
        },
      },
    },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] }, useSecureCookies: secure, cookiePrefix: "zi" },
    databaseHooks: {
      user: { create: { before: async (user) => ({ data: { ...user, role: roleOf(env, user) } }) } },
      // Sessions don't keep where or what they were signed in from.
      session: { create: { before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }) } },
      account: {
        create: { before: async (account) => ({ data: { ...account, ...NO_TOKENS } }) },
        update: { before: async (account) => ({ data: { ...account, ...NO_TOKENS } }) },
      },
    },
    telemetry: { enabled: false },
    logger: { level: "error" },
  };
}

// Bindings only exist per request, so the auth's made from env, once per env.
const made = new WeakMap();
export function authFor(env) {
  let auth = made.get(env);
  if (!auth) made.set(env, (auth = betterAuth(optionsFor(env))));
  return auth;
}
