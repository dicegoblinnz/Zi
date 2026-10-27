-- A campaign's world, starting with its faction board (27 Oct 2026, stage 1
-- of notes/worlds-plan.md). Applied by `npm run deploy` before the Worker goes
-- out from main. It only adds, so the Worker that's still running for those
-- few seconds keeps everything it uses.

-- A campaign's world: every faction's card and what the crew's been shown of
-- each. It's one JSON document (src/companion/board.js) that only the
-- campaign's GM changes, a piece at a time, with a version that goes up with
-- every change. A player only ever gets what they've been shown
-- (src/worker/world.js). Ending the campaign takes it away.
CREATE TABLE IF NOT EXISTS "world" ("campaignId" text NOT NULL PRIMARY KEY REFERENCES "campaign" ("id") ON DELETE CASCADE, "data" text NOT NULL, "version" integer NOT NULL, "updatedAt" integer NOT NULL);
