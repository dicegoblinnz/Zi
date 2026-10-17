-- Accounts (stage 6 of notes/app-plan.md). The first five tables are Better
-- Auth's, as its migration tool writes them for the options in
-- src/worker/auth.js. The last three are the site's own.

CREATE TABLE IF NOT EXISTS "user" ("id" text NOT NULL PRIMARY KEY, "name" text NOT NULL, "email" text NOT NULL UNIQUE, "emailVerified" integer NOT NULL, "image" text, "createdAt" date NOT NULL, "updatedAt" date NOT NULL, "role" text DEFAULT 'member', "invitedBy" text);
CREATE TABLE IF NOT EXISTS "session" ("id" text NOT NULL PRIMARY KEY, "expiresAt" date NOT NULL, "token" text NOT NULL UNIQUE, "createdAt" date NOT NULL, "updatedAt" date NOT NULL, "ipAddress" text, "userAgent" text, "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS "account" ("id" text NOT NULL PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL, "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date NOT NULL, "updatedAt" date NOT NULL);
CREATE TABLE IF NOT EXISTS "verification" ("id" text NOT NULL PRIMARY KEY, "identifier" text NOT NULL, "value" text NOT NULL, "expiresAt" date NOT NULL, "createdAt" date NOT NULL, "updatedAt" date NOT NULL);
CREATE TABLE IF NOT EXISTS "rateLimit" ("id" text NOT NULL PRIMARY KEY, "key" text NOT NULL UNIQUE, "count" integer NOT NULL, "lastRequest" bigint NOT NULL);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

-- An invite: the code in the link, who made it, when it runs out, how many
-- accounts it can make and how many it has. The note says who it's for.
CREATE TABLE IF NOT EXISTS "invite" ("code" text NOT NULL PRIMARY KEY, "createdBy" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "note" text, "uses" integer NOT NULL, "used" integer NOT NULL DEFAULT 0, "createdAt" integer NOT NULL, "expiresAt" integer NOT NULL);
CREATE INDEX IF NOT EXISTS "invite_createdBy_idx" ON "invite" ("createdBy");

-- A character kept in an account: what the phone saves (src/companion/store.js),
-- as JSON, with a version that goes up with every change. A deleted one keeps
-- its row with no data, so a phone that's been away learns it's gone.
CREATE TABLE IF NOT EXISTS "character" ("userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "id" text NOT NULL, "data" text, "version" integer NOT NULL, "updatedAt" integer NOT NULL, PRIMARY KEY ("userId", "id"));

-- Rate limits for the site's own routes, keyed by a hash, never an address.
CREATE TABLE IF NOT EXISTS "limits" ("key" text NOT NULL PRIMARY KEY, "count" integer NOT NULL, "since" integer NOT NULL);
