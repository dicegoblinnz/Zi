-- Campaigns, and sign-up open to anyone (27 Oct 2026). Anyone signed in can
-- start a campaign and is its GM, and players join with its link. The Worker
-- checks every request against these two tables (src/worker/index.js).
-- Applied by `npm run deploy` before the Worker goes out from main. It only
-- adds, so the Worker that's still running for those few seconds keeps
-- everything it uses. The retired invite table and GM role go in a later
-- migration, once this Worker's the one running.

-- A campaign: its name, its GM, and the code in its join link. Resetting the
-- link makes a new code, and the old one stops working. A GM deleting her
-- account ends her campaigns.
CREATE TABLE IF NOT EXISTS "campaign" ("id" text NOT NULL PRIMARY KEY, "name" text NOT NULL, "gmId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "code" text NOT NULL UNIQUE, "createdAt" integer NOT NULL);
CREATE INDEX IF NOT EXISTS "campaign_gmId_idx" ON "campaign" ("gmId");

-- A player in a campaign, and which of their own characters they play there.
-- The GM isn't in here: she's the campaign's gmId. A character plays in one
-- campaign at a time, so nothing of one campaign's play reaches another's GM.
CREATE TABLE IF NOT EXISTS "member" ("campaignId" text NOT NULL REFERENCES "campaign" ("id") ON DELETE CASCADE, "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "characterId" text, "joinedAt" integer NOT NULL, PRIMARY KEY ("campaignId", "userId"));
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "member_character_idx" ON "member" ("userId", "characterId") WHERE "characterId" IS NOT NULL;
