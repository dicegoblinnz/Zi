# The faction screens' design pass

1 Nov 2026. Mo: the faction interface works, but it should feel better. The look at it, the research and the six changes are in the doc "Zi'Dara faction screens: making them feel better" (https://claude.ai/artifact/RcrjW9HVKeNuJaXbDEYM2F). In short: the faction screens are records, built for the GM to keep the books, with the crew shown the same books and pages held back. Every faction looks the same, the board doesn't say what's happening, the web's somewhere else, a reveal is a fold appearing, the GM's page is mostly switches, and the faction turn's a ledger. The character got its design pass on 24 to 26 Oct (`notes/design-review.md`, `notes/design-plan.md`). This is the factions'.

## Mo's calls (1 Nov)

- **Built at once.** Changes 1 to 5 are built by three agents side by side, merged and checked together, and reach the Preview as one. The GM's ledger (change 6) waits for his playtests.
- **A reveal arrives as a sheet** on the crew's phones and on the table screen.
- **In the faction turn the players' phones follow her taps**, so everyone's on the same action at once.
- **Each downtime goes into How it came to be as a new age.** The table picks how long each downtime is (a week, a month, a season, whatever suits) when it starts, and that goes on its age. It's only the story's clock: it changes nothing in play, and the book's words for an agenda's die ("a month or two away") stay as they are.
- Unless Mo says otherwise: the crew sees how much of a faction is left to find out ("5 of 8"), a GM can put up her own picture instead of a seal, and Claude draws the charges and the turn's glyphs but nothing goes live till Mo's said yes to them on `/kit/`.

## What stays true

- Colour does one job each: gold is the crew's, violet the GM's and the threats', ember harm. A seal's told apart by its shape, never a colour of its own.
- Whatever the crew hasn't been shown never reaches their phone. A seal goes with its faction's card (`forPlayer()` in `board.js`), so a faction they haven't met is a blank seal. In the faction turn, off-screen moves show only as what changed, and a move by or at a faction they haven't met shows that faction's card and nothing else (Mo's 27 Oct calls).
- Reveals stay a tap at a time. Nothing in the world builder is written by AI.
- Whatever's kept per campaign stays in that campaign, checked on the server. Anything already seen works offline.
- Every seal is our own drawing, never a company's or a game's logo, Night City's included.
- One-handed on a phone at the table, in both themes, under reduce-motion too. `zi-voice` for every word, `impeccable` and `game-feel` for the look and the motion.

## What the three share

Set up first, on `website`, so the three can work without touching each other's files:

- **A seal on a faction** (`board.js`): `seal: { c, f, d }`, a charge, a field and a mark (`""` for none) out of `src/kit/seals.js`, or `null`. `sealOf()` tidies one, `{ o: "seal", id, v }` changes it (undone the same way), and `forPlayer()` passes it on with the card.
- **The kit** (`src/kit/kit.js`): `seal(s, { size, label, blank, own, cls })` draws one (`sm`, `md` or `lg`, blank for a faction the crew hasn't met, `own: "you"` for the crew's gold), and `glyph(name, { label, cls })` draws one of the turn's outcomes (`GLYPHS`: destroy, undermine, obstruct, influence, acquire, establish, agenda, crew). Their styles are at the seals in `kit.css`. The first charges, fields and glyphs are placeholders for stage 1 to replace.
- **Two seams in `world.js`**: `seal-pick.js` (the GM's seal fold on a faction's page, `SP.fold()` among her parts, and its taps) and `reveal.js` (the moment on a player's phone, `R.news()` from `take()` with the board before and after). Both are stubs till their stages fill them.
- **Test ports**: `ZI_PORT` runs `check-site`, `check-companion` or `check-accounts` on a port of its own, so three worktrees can check at once.

## The stages

### Stage 1: seals (the pieces)

Every faction gets a wax seal: a charge for the kind of faction it is, a field that tells two of a kind apart, and a mark when even that's not enough (Night City has 34 factions). Readable at a web node's size and in one ink on Paper. The world builder deals one with every faction (from its type, on its own stream, so nothing else it deals moves), the book's boards and both whole worlds get theirs written in, and the GM can change it on the faction's page. The eight glyphs for the turn's outcomes. The web draws hostile lines apart from bonds by more than colour, since ember and gold are close for some colour-blind players. The small fixes: a faction's name mid-sentence (`midName()`), every "What changed" line showing twice in the turn, the web on a world's page starting at the bottom of the first screen, and faction names in gold on telegraph and turn cards (gold's the crew's). `/kit/` shows every charge, field, mark and glyph for Mo's yes.

Owns: `src/kit/`, `src/styles/kit.css`, `src/pages/kit.astro`, `src/companion/seal-pick.js`, the seal's change in `board.js`, the builder's dealing (`world-engine.js`, `world-make.js`'s card screens only where the seal shows), `content/world-tables/`, `content/worlds/`, `scripts/worlds.mjs`, `scripts/world-tables.mjs`, `src/companion/world-web.js`, `src/styles/web.css`, `src/worlds/`.

Built (1 Nov): 27 charges, 8 fields, 6 marks and the 8 glyphs, all our own drawings, on `/kit/` for Mo's yes. The builder deals a seal with every faction and Add a faction one nobody on the board has, the book's boards have theirs in `content/world-tables/seals.yaml`, both whole worlds have one on every faction, a card out of the book wears the book's, and a mini faction made in play wears its maker's with a mark. The GM's seal fold has Deal another and a picker, and a pick that would copy another faction's takes a mark. The web draws seals, and a hostile line carries a cross, on a map's web too. Of the small fixes, a faction's name mid-sentence was done in stage 2's `world.js`, and the "What changed" lines and the names on telegraph and turn cards (ink now) in stage 5's files.

### Stage 2: the board shows what's happening (the board and faction page)

The crew's World tab opens on three things. Since you last played: what changed and what they've found out since this phone last looked, kept on the phone. Closing in: every agenda the crew's been shown, drawn as its six die sizes with the one it's at lit, nearest first, in the words the code already has ("any day now", which `world.js` and `turn.js` each have a copy of, so share one). Who's who: seal cards, standing as the card's top edge (ember hostile, gold friendly, plain for business), Power, and how much the crew knows. The GM's board is the same with Find and the kind chips the world pages have once there are more than about eight factions, and sorting by closing in or by who's after the crew.

A faction's page for the crew: its seal big, the same layout on every faction, what's still hidden as sealed rows ("Still to find out"), New on anything just shown till it's opened. Standing explains itself: tap it for the threads behind it and what would change it (`standingOf()` counts only whole threads toward the crew, so a strained one stops counting). Its own small web of just its ties, and a list view of the web for anyone who'd rather read than tap. For the GM, each fold's show-or-hide box shrinks to a small switch in its header, with one line at the top saying what the crew knows so far, and a look at what the crew will see before she shows anything.

Owns: `src/companion/world.js` and its part of `src/styles/companion.css` (the `wb-` and `ww-` rules).

Built (1 Nov): all of it, with `ago()` shared from `board.js` now. Two things are smaller than asked: the kind chips show only on a whole world, since the book's boards and dealt factions don't keep a kind on the board, and After the crew sorts by threads toward the crew, which Night City's factions come in without, so it keeps the board's order there till she adds some.

### Stage 3: reveals as moments, and stage 5: the faction turn as a sequence (the moments)

When she shows the crew part of a faction, every crew phone gets a sheet: the seal breaks open and the part writes in, with the sound and buzz if the player's turned them on (`feel.js`), and the table screen shows it too. It's only ever what the crew's been shown, and on the table screen only what a screen may show (`screenOf()`). The live table tells the crew's phones to look again when what they can see of the board changes (`crewView()` in `src/worker/world.js` doesn't count the factions yet).

The faction turn: when it starts, the table picks how long the downtime is. Before anything lands, every move the crew's allowed to see is shown at once, each faction's seal with its outcome's glyph and an arrow at its target. Then the actions land one at a time, the crew's phones following her taps, with a way to skip to the end always there. The big flourish is saved for an agenda that happens, and it ends on one "While you rested" summary that lists what changed, once, and writes it into How it came to be as a new age with its length (`world-record.js` and `world-story.js`, starting a record when the world hasn't one).

Owns: `src/companion/turn.js`, `src/companion/turn-rules.js`, `src/companion/reveal.js`, `src/companion/table-screen.js`, `src/styles/table-screen.css`, `src/companion/feel.js`, `src/companion/world-record.js`, `src/companion/world-story.js`, `src/worker/table.js` and `src/worker/world.js`, and the `tg-`, `ft-` and turn rules in `companion.css`. It touches `world.js` only through the reveal seam.

Built (1 Nov): the reveal (`reveal-rules.js` works out what's just been shown, the Table object keeps it for 90 seconds for the table screen) and the turn as a sequence, with each downtime an age in How it came to be (`wb-age`). A place or a person shown pokes the crew's phones but gets no sheet yet, and the table screen still shows none of the faction turn, as before.

### Stage 6: the GM's ledger (after the playtests)

The same faction laid out two ways: the GM gets a ledger built for speed in downtime (a row per faction with its seal, Power, agenda clock, what the crew knows and the climb buttons), and the crew gets the board. On her faction page the forms fold behind one Change per part. Its prompt comes once stages 1 to 5 have been to the table.

### After that

Her own picture instead of a seal, using the picture uploads maps already have (the seal's data has room for it). The rest of `notes/builder-plan.md` and `notes/worlds-plan.md` carry on as they were.

## How each stage is checked

Each agent runs only the tests for its part, on its own `ZI_PORT`. Once the three are merged: `npm run build`, then `tests/check-site.mjs`, `tests/check-companion.mjs`, `tests/check-accounts.mjs` and `tests/check-world-engine.mjs` once each, and one Sonnet agent reviews the whole diff. The checks to add: a seal on every faction a build deals and in both whole worlds, none reaching a player before the card, a blank seal on the web for a faction the crew hasn't met, hostile lines told apart from bonds without colour, the crew's World tab and a faction's page at 390 in both themes with the board's first screen holding Since you last played and Closing in, a reveal reaching a second phone and the table screen with nothing the crew hasn't been shown, and a downtime's sequence followed on a player's phone, its summary in How it came to be as a new age with its length.

## Where it's got to (2 Nov)

Stages 1 to 5 are merged on `website` and on its Preview. All four suites pass on the merged branch. One reviewer read the whole change and a second read the fixes. Between them they found five real problems, all fixed with a check each:

- A downtime with nothing in it took the next one's number, so the next one never reached How it came to be (`counts()` and `ageOf()`).
- Boards from before seals showed every met faction as a blank seal (`sealsFor()`, filled only where there's none).
- A seal she'd picked on one phone could be dealt over from her other phone (`fill`).
- The table screen missed a reveal shown again after she'd hidden it.
- Add a faction on a record a downtime started kept its recipe blank.

Mo's answers (9 Nov), and it went to `main` the same day:

- Yes to the charges and glyphs on `/kit/`.
- A Secret she shows the crew goes on the table screen like any other reveal (his pick, over keeping Secrets off a screen with no sign-in).

Left as it is: an empty age that the old End wrote on the Preview before the fix isn't cleared. Only a downtime ended with nothing in it, on the Preview in the hour before the fix, could have made one.
