# The design plan

The design pass from `notes/design-review.md`, started 24 Oct 2026, before the app plan's stage 7. Four steps, each its own stage, checked like the app's stages and sent to the table as soon as it's ready: the kit, the character, the rules and the builder.

## Step 1: the kit

Built 24 Oct on the `design` branch, made from `app`, and moved onto `app` the same day because Cloudflare wouldn't build the `zi` Worker's Preview for a new `design` branch (the `zidara` Worker built it fine, so it's something in `zi`'s build settings). The Preview is https://app-zi.storyforgenz.workers.dev/kit/, not linked from anywhere, kept out of search and out of the offline cache. Mo picked Struck on 26 Oct, with real die shapes, and the kit and the character went live together from the `website` branch (`notes/design-26oct.md` has the plan now). The `design` branch is left behind at the kit's first version (this session couldn't delete it).

- `src/kit/kit.js` draws every piece as HTML, so Astro can draw it at build time and the companion on the phone: dice, steps, Aura, Resolve, the Hurt track, conditions, tags, sigils, crests and the telegraph card. `src/kit/sigils.js` has a sigil for every archetype, and the kit page stops the build when an archetype in `03a-the-archetypes.md` hasn't got one. `src/styles/kit.css` is both looks, picked by `data-kit` on the page (`lit` or `struck`), plus a Paper theme that shows what prints in one ink.
- `src/pages/kit.astro` reads the crew off the chapter, the way the companion does, so every number on it is the book's.

### The same in both

- **A die shows its size.** Every die's a hex, and each step fills one of its six edges, from the top edge round to the right. A d2 is one edge and a d12 is the whole ring, and the next step starts another die, which is the steps-into-dice table drawn. The GM's dice and Confidence, Armour and conditions use the same dice, so a d10 telegraph is 5 steps of her budget. Dice stay the same size in a row, so tiles line up.
- **Colour does one job each.** Gold is yours to roll or spend, violet is the GM's and the threats', ember is harm, and everything else is ink. Resolve went gold with Aura (it's yours to spend), drawn as a bigger diamond so the two never look alike. Against-you conditions are ember and for-you are gold, and their names say which too, since ember and gold are close for some colour-blind players.
- **A crest is the Zi'Dara mark made personal.** The violet diamond with the first Title's archetype in the middle, doubled when it's the same archetype twice (Vesk, Wren), and a second archetype in a seal on its lower edge (big crests only). A third archetype later goes in a seal on the other edge.
- **The sigils:** Bard a lyre, Bloodsworn a drop with a cut, Elementalist a flame, Face a mask, Guardian a shield, Healer a leaf, Hunter a mark on the prey, Illusionist a shape and its dashed copy, Leader rank chevrons, Maker a hammer, Oracle an eye, Scholar an open book, Shadow a crescent, Shifter claws, Summoner a soul lantern, Teleporter a jump, Warrior a blade.
- The type stays Sigil: Cinzel for names, Alegreya Sans for the rest and for a die's size (d8), and Cinzel numbers on a rolled Lit die.

### The two looks

- **Lit:** light runs along the edges, a rolled die's face lights up, and what's yours glows. In the light and on paper it's line drawings.
- **Struck:** six solid pieces round a hub, like a token punched out of card, the same in every theme.
- Claude recommended Lit: it's the brief's game screen, its dice read at every size from 18px in the rules to the roll, and its paper version prints cleaner than Struck's solid pieces.

### When Mo picks

Strip the other look from `kit.css` (its rules all start `[data-kit="…"]`), drop `data-kit` from the page, and use the kit in step 2. Keep the Paper theme's tokens for the sheets catching up later.

## Step 2: the character

Done 26 Oct (`notes/design-26oct.md`, Piece 2). What was asked: Full screen without the site's header, the crest at the top, set actions as dice you can see grow, the roll as a moment (the dice front and centre, the counting folded behind them), and a Sheet tab that reads at a glance before it goes into detail. Measured on 24 Oct: on a 390 by 844 phone the first set action starts 478px down, under the site's header (105px), the name and the trackers, and the Sheet tab runs 7.4 screens.

## Steps 3 and 4

The rules (the objects drawn inline, terms on tap from the glossary offline, examples headed by a crest with a Try it, the ladder drawn, a way back to where you were), then the builder (archetypes as sigil cards with what they play like, dice that grow as lines go on set actions). Also from 24 Oct: the builder's step numbers wrap at 390 wide and leave the 8 on a line of its own.

## Open

- Stage 7's call, who in the party sees what of each other's sheets, is still Mo's.
- The Hurt track became the wound die in the 24 Oct rules, and the kit draws it as a die in ember, with the Scars beside it.
