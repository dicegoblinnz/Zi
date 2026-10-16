# The paper character sheet and the player reference

Agreed with Mo on 17 Oct 2026. Build exactly this, send Mo the preview and the PDFs, and stop.

## What Mo wants

1. **A character sheet on one A4 sheet, printed back to back**: two pages, and a fillable PDF, so people can type into it on screen or print it blank and write in pencil.
2. **The player reference as a separate document**, not on the backs of the sheet. A plain PDF, nothing to fill in.
3. Both downloadable from zidara.world.

No party sheet, faction sheet or filled-in crew sheets for now.

## Read these first

- `CLAUDE.md` and `notes/website-brief.md`.
- `content/rules/30-appendix-a-the-sheets.md`: every field the character sheet holds. It describes four pages with the reference on the backs, which is what's changing.
- `content/rules/33-appendix-d-quick-reference.md`: the source for the player reference. Appendix A lists the four parts the reference covers.
- The crew's sheets (`03b-title-ideas-and-the-crew.md`, `#s-pregens`), to check a real character fits in the boxes. Fill one in with Vesk or Bram while testing.

## The character sheet: two pages

Everything from Appendix A's four fronts has to fit on two pages. A suggested split:
- **Front, for play:** name, pronouns and player. Aura, Armour, Confidence (a d2 to d12 row to ring), Stride and Resolve. Hurt bars with their Catch lines and Scarred ticks, the wound die and conditions. Set actions (the five on every sheet plus rows of your own, each with what's on it, steps and die) and the steps-into-dice ladder. Aspiration and the Party Goal tracks.
- **Back, for who you are:** Titles I to VI (archetype, Title and six permission lines each), traits, Kit (equipment, utility, keepsake, two attunement slots, the bag) and bonds with their threads. Notes go wherever there's room.

Drop the long reminders to make it fit, since they'll be in the player reference, but keep short labels like "full every scene". A Title needs room for six permissions even though new characters start with three. Check that Vesk's or Bram's real sheet fits without cramming.

- Print-friendly: white paper, dark ink, and the Sigil look in its accents (Cinzel headings, Alegreya Sans, gold corner brackets and thin rules). Nothing dark-filled.
- Fillable fields over every write-in space, named so they read sensibly (`name`, `aura_now`, `title_1_permission_3`), with tick boxes for Hurt, Scarred, Resolve stars, strained and snapped threads, and the Confidence and wound die rows. The field text has to be readable when printed.
- Boxes big enough for pencil, too.

## The player reference

Built from Appendix D, in four parts as Appendix A lists them: making and growing a character, archetypes, Aura and the round, rolling, and threats, moving and gear. Keep Mo's wording. Aim for four A4 pages, and two columns is fine. Same print-friendly look.

## How to build it (a suggestion)

- Design both as HTML and CSS pages with print styles, and turn them into PDFs with the Playwright Chromium already in the project (`page.pdf()`, A4). That gets the real fonts and the Sigil look.
- Add the form fields to the character sheet afterwards with `pdf-lib` (or `pypdf`), at the positions of each box, read from the page with `getBoundingClientRect`.
- Put it in one script, like `npm run sheets`, that writes the PDFs to `public/sheets/`. Commit the PDFs, because Workers Builds can't run Chromium. Stamp each PDF with the date and a hash of what it was built from, and add a check to `tests/check-site.mjs` that fails when the reference is older than Appendix D, so it never falls behind the rules.

## On the website

- A Sheets page (`/sheets/`) with both downloads, what each one is, and how to print the sheet (A4, double-sided, flip on the long edge).
- Links to it from Appendix A, the footer and the Characters page.
- Update Appendix A to describe the two-page sheet and the separate player reference, and anything else that mentions the four-page sheet (search for "four A4", "player reference" and "character sheet"). Add a short entry to `content/changes.md`.

## Checks

- Open each PDF and look at every page as an image. Check it's A4, the fonts are embedded and nothing's clipped.
- Fill a few fields with `pypdf` and read them back.
- Fill in a crew member's real sheet and check it all fits.
- `node tests/check-site.mjs` passes with the Sheets page added, and the link and voice checks pass on the chapters you changed.

## Keep usage low

Mo's weekly limit is tight. Work in this chat only, read only the parts of files you need, use no helpers while building, and run one independent check at the end.

## Ship it

- Work on the `sheets` branch, made from `website`, so the companion's already in it. Its preview is https://sheets-zi.storyforgenz.workers.dev. If `website` gets new commits, merge them in before you finish.
- Commit with the attribution lines, then send Mo the preview link and the two PDFs. List any calls you made at the bottom of this file.
- Merge to `main` only when Mo says so.

## Calls I made

- **What's on each side.** Titles, attunement and bonds fill the back, so traits, the Kit (equipment, utility, keepsake and the bag) and notes went on the front with play.
- **How many rows.** Six rows for set actions of your own (Appendix A had nine), three traits with two lines each for what they do (two to start), five Hurt bars (three, and two extras like Unyielding's), four conditions, six Titles with two lines for the Title and six permission lines each, two attunement slots with six lines each, and six bonds with four threads each. Vesk's and Bram's sheets fit, and so do all the crew's Titles, permissions and threads, Dorrie's long Title, Perfect Recall's wording and "steel from a vault door" as a material. Some traits in Building Your Character run longer than two lines, so those get written short.
- **Armour has a "now" box** beside "full", because Armour drops as a consequence and comes back to full in downtime.
- **Dropped from the sheet, kept in the reference:** what Aura and Resolve buy, your archetype's +2, building a roll and your action. The sheet keeps short labels like "full every scene".
- **The player reference** leaves out Factions, The session and The Oracle (they're the GM's and the party sheet's), and the round and threat budgets from Threats (the GM's tools), and Appendix A says so. Combos come out of Your action and go in Rolling, and "Things that climb" goes in part 1, the way Appendix A lists them. Links in Appendix D are plain words in the PDF. A new section in Appendix D stops `npm run sheets` until it's given a part. Part 4 starts on a fresh page, and the other parts run on, because the PDF stays at four pages that way.
- **Rows you ring** (Confidence, the wound die, each condition's die, Aspiration, Party Goal and an attunement's stage) are radio buttons on screen: tap one to ring it, and tap it again to clear it.
- **Typed text is Helvetica**, 9 point (8.5 for permissions and trait text, 8 for threads), because every PDF viewer has it. The page itself is Cinzel and Alegreya Sans, embedded.
- **The stamp** is the build date and a 12-character hash of what each PDF's built from (Appendix D, the templates and the build script), in the footer and the PDF's keywords. `tests/check-site.mjs` compares the hash, so it catches a same-day change too.
- The Sheets page reads `src/data/sheets.json`, which `npm run sheets` writes. The PDFs aren't kept offline by the service worker, so downloading them needs a signal, like search.
