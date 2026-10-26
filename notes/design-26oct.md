# The design pieces after the 26 Oct rules

Mo's 26 Oct asks about the website, his picks, and the plan for each piece, written so a fresh chat can pick any piece up. His words are in `notes/playtest-sheets/2026-10-26-chat-decisions.md` (The website). The kit's first version is on the `app` branch (`src/kit/`, `src/styles/kit.css`, `/kit/`, `notes/design-plan.md`, `notes/design-review.md`), from before the 24 Oct rules, so it still has an Armour die and the Hurt track.

What Mo wants, under all of it: the site easy and quick on a phone at the table, with nothing that makes you scroll for ages, and choosing archetypes, Titles and items easy. He said "especially the character sheet", so the pieces go in this order, each one live when it's tested (his pick: the rules first, then the rest a piece at a time), and each in a chat of its own.

## Piece 1: the kit, Struck, with real die shapes

**Done 26 Oct**, with the character below: Struck only, every die its real shape and growing into the next, the wound die and Scars in place of the Armour die and the Hurt track, Resolve a cut gem, and `/kit/` on the 26 Oct rules.

**Picked:** real die shapes in the Struck look, so a die changes shape as it grows. Mo likes the kit at https://app-zi.storyforgenz.workers.dev/kit/.

- Make a branch from `main` and merge `app` into it. Strip Lit from `kit.css` (its rules start `[data-kit="lit"]`) and drop `data-kit`. Keep the Paper theme's tokens for the sheets.
- Every die is its real shape, drawn Struck: a token cut to the shape, its faces as solid pieces in the owner's colour round a hub the same shape, and the number on the hub. The steps no longer fill edges, because the shape says the size. Steps show as pips where a set action needs them.
- Retire the kit's Armour die and the Hurt track. The wound die is a die like any other, in ember, with the Scars beside it.
- Resolve's gem is a diamond, and so's the d8 now. Redraw the gem as a cut gem (flat top, shoulders, a point) so they never look alike. The crest stays the violet diamond (it's violet and holds a sigil, never a number).
- `/kit/` shows the current rules on the crew's numbers: Confidence (d2 shaken, d6, d12 fired up), the wound die and Scars, Defend, Aura, Resolve, conditions, tags, telegraphs, crests, and a die growing from d2 to d12.

The geometry, from the prototype Claude drew on 26 Oct (a 100 by 100 viewBox, every outline clockwise from the top):

| Die | Outline | Hub | Pieces | Number |
|---|---|---|---|---|
| d2 | circle r 46 at 50,50 | 0.62 of the way in | two halves, cut at 9 and 3 o'clock | centre |
| d4 | triangle point up, radius 54 round 50,61 | 0.6 | three, cut at the corners | y 64, 0.84 size |
| d6 | square 8,8 to 92,92 | 0.6 | four | centre |
| d8 | diamond 50,2 · 98,50 · 50,98 · 2,50 | 0.58 | four | 0.92 size |
| d10 | kite 50,2 · 95,40 · 50,98 · 5,40, centre 50,45 | 0.62 | four | y 47, 0.86 size |
| d12 | pentagon, radius 50 round 50,54 | 0.62 | five | y 56, 0.92 size |

- The token is the outline, `--zd-token` with a 3.6 `--zd-slot-line` stroke. The pieces are the ring between the outline pulled in to 0.9 and the hub, in `--own`, cut at each corner by a 3.4 line in the token's colour from the ring's corner to the hub's. The hub is `--zd-token` with a 3.4 `--own-line` stroke. The number's Alegreya Sans 800 in `--own-ink`: 27 to roll, 38 rolled, two digits at 0.84 of that, three at 0.8.
- Rolled: the hub fills `--own` and the number's `--on-own`. Top face: the token fills `--own` and the pieces go `--on-own`. Lost: the pieces and hub go `--zd-slot` and the number `--muted`. Tie: a dashed hub. Under about 28px it's a mini with no number and doubled strokes.
- Growing: resample the outline and the hub to 120 points from the top, clockwise, and move each point to its place on the next shape over about 300ms (ease-out, a small scale pulse), with the pieces and cuts fading out and back. Under reduce-motion it swaps.
- Gold is yours, violet the GM's, ember harm, as in the kit.

## Piece 2: the character and the builder

The play screen and the sheet first, then the builder, both for a phone held in one hand.

**The character's done (26 Oct).** At 390 by 844 the first set action starts 291px down (it was 478) and the Sheet tab's 1.4 screens with its folds shut (it was 7.4, and 8.2 after the 24 Oct rules).

**The builder's done (26 Oct).** At 390 by 844 the first archetype card starts 367px down (it was about 1,430), every step's first choice is between 264 and 521px down, the eight steps sit in one line, and Back and Next are in a bar at the bottom on every step. Change and the other ways in use the same pieces on one page, and the set actions are kit dice in a dock above the bar.

- **The character:** full screen without the site's header, the crest at the top, the trackers as kit pieces (Confidence and the wound die change shape as they move), the set actions as dice you can see, the roll as a moment (the dice front and centre, the counting folded behind them), and a sheet that reads at a glance before its detail. Measured on 24 Oct at 390 by 844: the first set action starts 478px down and the Sheet tab runs 7.4 screens.
- **The builder:** one step to a screen with Back and Next always in reach, the step's own words from the book short and its help behind a tap, archetypes as sigil cards with what they play like, Title ideas as cards, permissions tapped onto set actions with each die growing as lines go on, items and the one attuned thing picked from cards, and threads written from the Connect answers as bond or hostile. Measured on 26 Oct at 390 wide: the first choice is about 1,430px down, and the step numbers wrap and leave the 8 on a line of its own.
- Keep every rule the builder checks (the companion section of `CLAUDE.md`): six permissions to a Title, a permission on two set actions at most and never twice on one, one attuned thing to start, two bond threads with the crew plus a hostile one and a third bond.

## Piece 3: the rules on a phone

**Picked:** a Learn deck and look-up pages. Mo's asks: bite-sized pieces for the core rules, a swipe to get through them, it remembers where you left off, bookmarks, and every link popping up a short explanation with a Read more, so you don't lose your place.

**Done (27 Oct).** The deck's 40 cards, 86 to 118 words each, from Did you succeed? to Downtime, all with an example and most with the crew's dice. At 390 by 844 a card, its Read more and bookmark, and Back and Next all fit one screen, with nothing to scroll. Every chapter's in short sections with a bookmark each and the strip, 253 linked sections have an opening for the pop-ups (about 87 KB gzipped, kept offline), and the rules page has Carry on reading, Carry on learning and your bookmarks. Links whose section starts with a table or an example (the frames' pitches, two lever tables) still open their page.

- **The Learn deck** (`/learn/`): the core rules as cards, in order, one idea each (about 30 to 40 cards, 40 to 120 words, a quick example with the crew's real dice on most). Swipe or tap through, with a progress bar, and it remembers your card. Every card has Read more (the full section, with a way straight back to the card) and a bookmark. Write the cards in `content/learn.md` in Mo's voice, each one pointing at the section it teaches, built into `book.json`. The build warns when the newest change log entry touches a section a card points at, so a rules change can't leave a card behind. Add the deck to step 1 of Changing a rule in `CLAUDE.md`.
- **Look-up pages:** each chapter in short sections, with a strip that follows you down showing where you are (tap it for the chapter's contents), a bookmark on every section, and "Carry on reading" on the rules page and the chapter.
- **Pop-ups:** tapping a link to another section opens a sheet from the bottom with that section's opening (up to its first example, table or subheading, the way the companion's rules on tap work), with Read more and Close. Build the openings into one file the service worker keeps, so they work offline.
- Bookmarks and places live on the phone (`zi-reading` in localStorage) until accounts carry them.

## Piece 4: the paper sheets

Mo doesn't like the player reference, and the character sheet is too plain. Both get the kit's look on paper (Paper theme): the die shapes, the crest, the wound die and Scars, threads as bond or hostile with a strained box, set actions with room for each die. Keep every field name in `scripts/sheets/character-sheet.mjs` (print fills them), keep the reference to four pages, and rebuild with `npm run sheets`.

**Done (27 Oct).** Both are drawn with the kit itself (`src/kit/kit.js`) in its Paper theme (`src/styles/kit.css`, loaded ahead of `print.css`), one ink, so they print the same on a mono laser. Headings are tabs cut out of ink, and numbers are Alegreya's, since Cinzel's 1 reads as a Title's I.

- **The character sheet** keeps all 274 fields, names and kinds (print fills them, and part 6 reads Vesk, Kestrel and a random character back). The front: the crest and the name, a bar of Aura's hexes, Resolve's seven gems (a ticked one prints solid, the kit's way) and Stride, then Confidence and the wound die as rows of the real die shapes to ring (shaken, start and fired up under Confidence, Blaze after the wound die's d12, and Up, Down and Rest under each), conditions with their dice beside the Scars (a cut, the size it holds the wound die at, and its Catch), the set actions with a box for steps and a wider one for the die (typed at 10 and 10.5pt), the steps ladder drawn with the dice, Aspiration and the Party Goal on a row each, traits, kit and three full-width lines of notes. The back: each Title's numeral on the crest's diamond, the attunement cards, and the bonds with bond or hostile to ring and labelled boxes for strained and snapped. A thread's a sentence, so it gets the width (about 57mm) and wraps to a second, smaller line when it's printed long.
- **The player reference** is a page per part, with what the table reaches for most first: the round and rolling (the round's three steps, the steps ladder drawn with the dice, and moving), Confidence, wounds and defence (the two tracks drawn as dice, conditions), Aura, Resolve, archetypes and threads (Spend 1 and Get 1 back side by side, each archetype with its crest), then your character, downtime, threats and gear. Every page shows all four parts with its own filled in. Every word is still Appendix D's: the panels are drawn from its sections, the ladder's checked against `src/companion/dice.js`, and the build stops on a section, bullet or label it can't find, a page that's too full, or a reference that isn't four pages. Appendix A and the Sheets page describe the new parts, and Resolve's gems.
- The sheets' hash now covers the kit and `dice.js` too, so `tests/check-site.mjs` asks for `npm run sheets` when any of them change.
