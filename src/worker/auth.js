// Accounts on the Zi'Dara site: Better Auth, keeping everything in the site's
// own D1 database. People sign in with Google or Discord. Nobody gets an
// account without an invite, unless it's Mo (the ADMIN_EMAIL secret, checked by
// Google or Discord) or sign-ups have been opened (OPEN_SIGNUPS = "yes").
// There are no passwords, since hashing one safely takes more time than a free
// Worker gets.
import { betterAuth } from "better-auth";

const DAY = 60 * 60 * 24;
const local = (host) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);

// The hosts sign-in works on, zidara.world first. A Preview's host can be added
// to AUTH_HOSTS so sign-in works there too.
export const hostsOf = (env) => String(env.AUTH_HOSTS || "zidara.world").split(",").map((h) => h.trim()).filter(Boolean);
export const originsOf = (env) => hostsOf(env).map((h) => `${local(h) ? "http" : "https"}://${h}`);
export const secureOf = (env) => !hostsOf(env).every(local);

// One cookie off the request that's making the account.
function cookieOf(ctx, name) {
  const raw = ctx?.request?.headers?.get("cookie") ?? ctx?.headers?.get?.("cookie") ?? "";
  for (const part of raw.split(";")) {
    const at = part.indexOf("=");
    if (at > 0 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim();
  }
  return "";
}

// The gate, run wherever a new account's about to be made, whichever way they
// signed in. The invite comes through the sign-in in the zi-invite cookie.
// Better Auth asks first (take false, which only looks), so a refusal comes
// back as invite_needed. Then, making the account, the invite's use is taken in
// one step (take true), so two people can't both take its last one.
async function gate(env, user, ctx, take) {
  const email = String(user.email || "").toLowerCase();
  const admin = String(env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (admin && email === admin && user.emailVerified === true) return { role: "admin" };
  const code = cookieOf(ctx, "zi-invite");
  if (/^[A-Za-z0-9_-]{16,64}$/.test(code)) {
    const row = await env.DB.prepare(take
      ? "UPDATE invite SET used = used + 1 WHERE code = ?1 AND used < uses AND expiresAt > ?2 RETURNING createdBy"
      : "SELECT createdBy FROM invite WHERE code = ?1 AND used < uses AND expiresAt > ?2").bind(code, Date.now()).first();
    if (row) return { role: "member", invitedBy: row.createdBy };
  }
  if (env.OPEN_SIGNUPS === "yes") return { role: "member" };
  return null;
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
        // admin (Mo), gm (one of the GMs he's picked, who can hand out invites) or member.
        role: { type: "string", required: false, defaultValue: "member", input: false },
        invitedBy: { type: "string", required: false, input: false },
      },
      validateUserInfo: async ({ user, source }, ctx) => {
        if (source.action === "create-user" && !(await gate(env, user, ctx, false))) return { error: "invite_needed", errorDescription: "Accounts are invite-only." };
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await env.DB.batch([
            env.DB.prepare("DELETE FROM character WHERE userId = ?1").bind(user.id),
            env.DB.prepare("DELETE FROM invite WHERE createdBy = ?1").bind(user.id),
          ]);
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
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60, customRules: { "/sign-in/social": { window: 60, max: 10 }, "/delete-user": { window: 60, max: 5 } } },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] }, useSecureCookies: secure, cookiePrefix: "zi" },
    databaseHooks: {
      user: { create: { before: async (user, ctx) => {
        const allowed = await gate(env, user, ctx, true);
        return allowed ? { data: { ...user, ...allowed } } : false;
      } } },
      // Sessions don't keep where or what they were signed in from.
      session: { create: { before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }) } },
      account: { create: { before: async (account) => ({ data: { ...account, accessToken: null, refreshToken: null, idToken: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null } }) } },
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
