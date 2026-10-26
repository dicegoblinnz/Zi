-- The party sheet, and threads between the crew on every phone (27 Oct 2026,
-- the rest of stage 7 in notes/app-plan.md). Applied by `npm run deploy` before
-- the Worker goes out from main. It only adds, so the Worker that's still
-- running for those few seconds keeps everything it uses.

-- A campaign's party sheet, the one the whole crew shares: the crew's name,
-- Reputations, resources and assets, the Party Goal, projects, holdings and the
-- people the crew relies on, and where each thread between two of the crew has
-- got to. It's one JSON document (src/companion/party-sheet.js) that every
-- phone in the campaign changes a piece at a time, with a version that goes up
-- with every change. Ending the campaign takes it away.
CREATE TABLE IF NOT EXISTS "party" ("campaignId" text NOT NULL PRIMARY KEY REFERENCES "campaign" ("id") ON DELETE CASCADE, "data" text NOT NULL, "version" integer NOT NULL, "updatedAt" integer NOT NULL);

-- What a player's phone shares with the rest of the crew: their character's
-- Aspiration, and the threads on their sheet with the others in the campaign.
-- A thread only ever goes to the player it's with (src/worker/party.js).
ALTER TABLE "member" ADD COLUMN "face" text;
