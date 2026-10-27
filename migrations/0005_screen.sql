-- The table screen (27 Oct 2026): the code in the link that puts a
-- campaign's live table up on a TV, a laptop or a screen shared on a call,
-- with no sign-in. It's 12 letters and numbers someone can read off the GM's
-- phone and type on a TV, it's empty till she first opens the screen, and
-- she makes a new one to stop the old link working. A screen only ever gets
-- what the crew sees (screenOf() in src/companion/table-rules.js). Applied
-- by `npm run deploy` before the Worker goes out from main. It only adds, so
-- the Worker that's still running for those few seconds keeps everything it
-- uses.
ALTER TABLE "campaign" ADD COLUMN "screen" text;
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_screen_idx" ON "campaign" ("screen");
