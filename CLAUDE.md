# Zi'Dara: notes for Claude

This repo is the master copy of the rules for **Zi'Dara**, Mo's tabletop roleplaying game (Mo runs Dice Goblin in Auckland and playtests three times a week). The website (zidara.world), the printed book, the reference sheets and the character tools are all built from `content/`. The repo is private.

## Where things are

- `content/rules/*.md`: the rulebook, one chapter per file. Front matter gives `title`, `id`, `order` (book order, so `03a` is 3.2 and `03b` is 3.5), `part`, `partNumber`, `source` and `updated`. `_parts.yaml` describes the five parts.
- `content/changes.md`: the public change log, newest first, one entry per rules change, dated by when it went to the table.
- `content/figures/`: SVG figures the chapters use.
- `notes/to-confirm.md`: calls Claude made to fill gaps in Mo's rules, waiting for Mo's yes or no.
- `notes/website-brief.md`: what Mo wants from the website (look, companions, live play, worlds, order). Read it before any site work.
- `notes/companion-plan.md`: the agreed first version of the character companion, and what comes after it.
- `notes/sheets-plan.md`: the agreed plan for the fillable two-page character sheet and the separate player reference.
- `notes/playtest-sheets/`: Mo's "What's changed" playtest sheets (text), the primary source for each change.
- `tools/check_terms.py`: flags retired rules words (`--links` checks every `](#id)` link against the chapters' ids).
- `tools/voice_check.py`: flags em dashes, semicolons, exclamation marks, stiff phrases and filler, and counts contractions.
- `tools/build_book.py` and `tools/book_template.html`: build a one-page reading copy of the whole book (`python3 tools/build_book.py OUT.html`). Rebuild it after every rules change.
- `tools/import_book.py`: the one-off import of the 2 Oct HTML book. Don't run it again.
- `scripts/build-sheets.mjs` (`npm run sheets`): builds the two-page fillable character sheet and the four-page player reference into `public/sheets/`, from `scripts/sheets/` and Appendix D, and writes `src/data/sheets.json` for the Sheets page (`/sheets/`). Workers Builds can't run Chromium, so the PDFs are committed. Rebuild them after any change to Appendix D or `scripts/sheets/`.

## The rules

- **The chapters are the truth.** When Mo sends a new sheet, newest wins: his latest wording replaces anything older, and everything he didn't change stays.
- When a sheet leaves a gap the book has to fill, make the smallest call in the shape of the existing rules, write it in, and add it to `notes/to-confirm.md`. When Mo marks something as still open, don't invent an answer: say only what's settled.
- The six crew (Vesk, Bram, Dorrie, Isolde, Wren, Ash) and their sheets are in `03b-title-ideas-and-the-crew.md` (`#s-pregens`). Every example uses their real numbers, archetypes and threads, and every number has to add up. The GM is "she".
- The character companion reads those six sheets straight off the chapter, so keep each sheet's labels and shapes (`**Set actions:** Sneak 4 (d8): her first Title, *move unseen*, Silent Step · …`). A line on a set action is a Title (`her first Title`), a permission in italics, a trait, or something they carry (`her picks`). The build stops if it can't read a line, or if a set action's steps or die don't add up.

## Changing a rule

1. Change every chapter where the rule lives or is summarised: the main chapter, then The Core or Building if it's touched, the quick reference (Appendix D), every lever (Appendix C), the glossary and the index.
2. Add an entry to the top of `content/changes.md`: the date, what changed in plain words, what it replaced, and links to the sections.
3. If you made a call, add it to `notes/to-confirm.md`.
4. Run `python3 -I tools/check_terms.py`, `python3 -I tools/check_terms.py --links` and `python3 -I tools/voice_check.py FILE --lines` on what you changed. Add newly retired words to `RETIRED` in `check_terms.py`.
5. If Appendix D changed, rebuild the sheets (`npm run sheets`). Then rebuild and check the site (`npm run build`, then `node tests/check-site.mjs`, which fails when a sheet's behind its sources).
6. Work on a branch and commit. `main` is what the live site deploys from, so only merge to `main` when Mo says so.

## The voice

Write as Mo, teaching at the table with dice in hand. Use the `zi-voice` skill when it's available.
- Contractions always, plain sentences of mixed length, and a quick example with real names and real dice after a rule.
- NZ spelling (armour, colour, favour, defence, centre).
- Never em dashes, semicolons or exclamation marks in prose. No slogans, "not X, it's Y", rhythm triplets, punchline closers, mood-setting openers or filler words.
- No "Mo's note" boxes or designer notes. The chapters say how the game works, never what changed (that's the change log's job).
- Don't name other games, books, films or shows.
- Digits for dice and steps (a d8, 3 steps, 1 Aura, 1 Resolve).

## The Markdown

- Headings carry ids: `## Heading {#s-some-id}`. Keep every id that survives, because links point at them. Archetypes are `#a-name`, Title ideas `#k-name`.
- Boxes are directives: `:::example[Title]`, `:::rule`, `:::note`, `:::quote`, `:::sheet[Name]{#id}`, `:::threat[Name]`, `:::place`, each closed with `:::`.
- Pipe tables only, with ` · ` between items in a cell. Links are `[text](#id)`.
- Permissions, tags, Catches, conditions and quoted threads in *italics*.

## The site

- Astro 7, static, served by Cloudflare Workers static assets in Mo's own Cloudflare account, deployed from `main` by Workers Builds (`npm run build`, then `npx wrangler deploy`). The Worker is called `zi`, and zidara.world is attached to it as a custom domain. Mo's first deploy was a manual one from the dashboard, which leaves no check run on GitHub.
- `scripts/build-content.mjs` renders the Markdown itself (unified: remark-parse, remark-gfm, remark-directive, smartypants) into `src/generated/book.json`, so it doesn't depend on Astro's Markdown pipeline. It rewrites `#id` links to the page that holds the id. Chapter URLs come from each chapter's `slug:` in its front matter, so keep slugs stable.
- `src/pages/`: home, `/rules/` and `/rules/<slug>/`, `/changes/`, `/search/` (Pagefind, built after Astro), `404`.
- `tests/check-site.mjs` must pass before anything goes to `main`: 320, 360, 390, 430 and 1280 wide, light and dark, nothing fetched from outside the site, no sideways scroll, no console errors, 44px tap targets, axe, search and the light switch. So must `tests/check-companion.mjs`: the steps-into-dice table, every crew member's set actions against the chapter, and Vesk at the table (a roll with fixed dice, a reload, offline, a split, a tie, an undo and a defence roll).
- The character companion is `/characters/` (`src/pages/characters/`) and `src/companion/`. `app.js` draws everything from the crew data in `book.json`, `dice.js` is the steps-into-dice table (the build checks the sheets with it too), and `store.js` keeps characters in one localStorage key, `zi-characters`, as a versioned list holding only what the player changed. The sheet itself is always read from the current rules, and each crew sheet has a hash, so a saved character shows a note when its sheet changes.
- `scripts/build-sw.mjs` runs last in `npm run build` and writes `dist/sw.js` from `scripts/sw.js`: a service worker that keeps every page, the fonts and the companion on the phone, so sheets and rules work offline. Search needs a signal.
- The look is Sigil, which Mo picked on 16 Oct (the details are in `notes/website-brief.md`): Cinzel headings and Alegreya Sans text, self-hosted through `@fontsource` so they work offline, plum-black with gold corner brackets and violet links. It's dark by default with a light switch (remembered as `zi-theme`), and fully separate from Dice Goblin. The colours are tokens at the top of `src/styles/site.css`, and both themes have to pass 4.5:1 contrast.
- Branches other than `main` build a Preview with `npx wrangler preview`, which needs the empty `previews` block in `wrangler.jsonc`.
- Still to come, in Mo's order: the character companion's first version (`notes/companion-plan.md`: the six crew on phones, saved on the phone, no sign-in yet) is built on `website` and waiting on Mo's playtests. Then sign-in (invite-only) and building your own, then campaigns, worlds and maps, and live telegraphs on phones and a table screen (Durable Objects). Each piece goes to Mo's playtests as soon as it's ready. Sheets and rules must work offline.
