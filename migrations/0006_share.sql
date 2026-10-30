-- Sharing a copy of a character (31 Oct 2026). Whoever has a character in
-- their account can share a copy of it: the character as they were when it
-- was shared, kept here under a code. Given to someone they play with (toId),
-- only that person sees it, and it goes once they take it or turn it down,
-- or after 30 days. As a link (no toId), anyone who has the code can take a
-- copy, for a week, and each character has one link at most, which its owner
-- can bring up to date or stop. The one sharing keeps their own, and nothing
-- either of them does after that reaches the other (src/worker/share.js).
-- Applied by `npm run deploy` before the Worker goes out from main. It only
-- adds, so the Worker that's still running for those few seconds keeps
-- everything it uses.
CREATE TABLE IF NOT EXISTS "share" ("code" text NOT NULL PRIMARY KEY, "fromId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, "toId" text REFERENCES "user" ("id") ON DELETE CASCADE, "characterId" text NOT NULL, "name" text NOT NULL, "data" text NOT NULL, "createdAt" integer NOT NULL, "until" integer NOT NULL);
CREATE INDEX IF NOT EXISTS "share_fromId_idx" ON "share" ("fromId");
CREATE INDEX IF NOT EXISTS "share_toId_idx" ON "share" ("toId");
-- One link for each character, and one copy of it waiting for each person.
CREATE UNIQUE INDEX IF NOT EXISTS "share_link_idx" ON "share" ("fromId", "characterId") WHERE "toId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "share_gift_idx" ON "share" ("fromId", "characterId", "toId") WHERE "toId" IS NOT NULL;
