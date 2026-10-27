# Reading the book on a phone (28 Oct)

## What Mo asked

Reading the Copper Baths on his phone, Mo found the places hard to read and boring. He wanted the whole book easier to read, with clear orientation and a different way through it, and examples to pick from before anything went live.

## The options, and his pick

Three layouts, drawn at phone size on the Zi'Dara Book Layouts design canvas (Claude artifact, private to Mo):

- **A, the Deck**: a chapter swiped a page at a time, its contents in a sheet from the top bar.
- **B, the Library**: every chapter opens on its contents, and an entry opens on its own with its parts as tabs. Twenty Places as cards, with Roll a d20.
- **C, the Scroll**: one page set properly, with folds and a thumb index.

Mo picked **B with A's swipe**.

## What was built

The root problem was the shape of the text: stat entries written as run-in paragraphs, every kind of thing looking the same, the game's own objects (dice, tags, telegraphs) missing, nothing grouped by who it's for or when you need it, and chapters as one long scroll. The Markdown stays as it is. The build reads its shapes and draws them.

- **Contents first.** On a phone (900px and under) a chapter opens on its contents (`hub` in `book.json`, `src/pages/rules/[slug].astro`): the opening's quote and first paragraph, how many sections and how long it takes, Carry on reading, what's new, and a row for every section with its first sentence and what's in it. Twenty Places has a card for every place (its d20 number, its first line from the d20 table, who's there and its Challenge die) and Roll a d20.
- **A section at a time.** Tap a row and the section opens on its own (`src/reading/lookup.js`): a bar along the top with Contents, the chapter, which section, a segment for every section and its bookmark, and Before and Next at the bottom. Swipe sideways, or use the arrow keys, for the next one. Before the first section is the contents. The address says which section's open, so Back, Forward, a bookmark, a search result and a link all land on it, a link to a subsection opens its section there, and Read more in a pop-up for the same chapter opens that section.
- **What you've read.** A section read to the end, or swiped past, gets a tick on the contents, the section you're up to says Up to here, and bookmarked ones show their ribbon (`done` and `places` in `zi-reading`).
- **On a laptop** it's still one page with the contents rail, and the same Carry on reading, bookmarks and pop-ups.
- **The book's pieces** (`scripts/book-blocks.mjs`, wired into `scripts/build-content.mjs`):
  - A place: what it is, its d20 number, its Challenge and scene clock as dice, then Scene, Telegraphs, Prep and Secret as tabs, with people and stakes as rows with their dice and tags, the ground, the scene clock as a ladder of dice, telegraphs as the cards the GM sends, and the Secret sealed till it's tapped.
  - A threat: its Challenge die, tags as chips, telegraphs as cards, its voice, and what's hidden sealed.
  - A sheet: every **Label** line its own field, set actions with their dice, permissions as chips, a Secret sealed.
  - A tag the Tag Reference has says what it does on a tap (`src/reading/blocks.js`), with the way to Appendix B.
  - Dice in a table's die column, a rule box's name as its title, and the crew's crests by an example's title.
- A pop-up for a place opens with what it is and what it's like.

The build warns on a place, threat, sheet or telegraph it can't read, so a new one written in another shape shows up in the build's warnings.

## Checks

`tests/check-companion.mjs` part 10 plays it at 390 by 844: the contents, a row opening its section, Next, swipes each way, a short drag springing back, the arrow keys, Contents, Back and Forward, an address with a subsection, bookmarks, ticks and Up to here, pop-ups, Carry on reading, the first and last sections' Before and Next, Twenty Places' cards and Roll a d20, a place's tabs, its Secret and a tag, offline, motion on and off, and axe in both themes. `tests/check-site.mjs` checks a place and a section opened by their address at every width.
