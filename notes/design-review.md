# Design review

24 Oct 2026. Mo: the character sheet looks and feels bland, and the site as a whole needs serious work on how people read the rules and engage with them. This is Claude's look at the live site (390 wide in the dark, and 1280), what's underneath it, and the approach. Mo picks the direction, and the plan that follows goes in `notes/design-plan.md`.

## What Mo needs underneath

The app plan's first decision: amazing at the table means it looks like a game, there's no counting, new players learn from it, and the crew plays together. The counting's done. Looking like a game and learning from it aren't, and that's what "bland" is. The site's also the game's front door, so the first minute on it should feel like Zi'Dara.

## What's wrong, and why

1. **The game's own objects aren't drawn.** Zi'Dara is made of things you can see: dice that grow a size with every step, Aura and Resolve, the Hurt track in bars of three, tags and conditions with their dice, telegraphs, Titles. The rules show none of them (one figure in 38 chapters, and "a d8" or "1 Aura" is only ever words). The companion draws a few, all the same size and weight, so a d10 looks like a d2 and steps are a grey "4 steps".
2. **Nothing leads.** Every block is the same bordered card with gold corners and small muted text, so the gold stops meaning anything, and each screen's one important thing (your dice, the roll, the rule) doesn't stand out.
3. **The character has no presence.** There's no crest or sigil. The list shows a letter, the archetypes are a chip on the Sheet tab, and the builder offers archetypes as word chips. The app plan's call was the archetype's sigil as the portrait, and the sigils haven't been drawn.
4. **The play screen wears the website.** The site's header and links take the top 100px or so of the phone, so playing feels like reading a page.
5. **The roll is a form.** Ticks, chips and folded sections, with the dice in a small line at the top. It's the best moment in the game, and it reads like settings.
6. **The Sheet tab is a document.** Seven screens of small text in one column, with no at-a-glance view of who this character is.
7. **The rules are a book poured into a page.** The Core is about 5,000 words on one page. Bold terms can't be tapped, links take you away from where you were, and examples can be read but not tried, though the site already has the dice, the roll and the learning round. Learning the game, looking something up mid-game and building a character all get the same long page.

## The approach

One visual language for the whole site, made of the game's own objects and used the same way in the rules and the companion, so what you read is what you play. The Sigil look stays (Cinzel and Alegreya Sans, plum-black, gold and violet, dark first) and gets pushed much further, with hierarchy doing the work rather than more ornament.

1. **The kit.** SVG and CSS: hex dice in a family that grows with its size, step pips, Aura and Resolve tokens, the Hurt track, tags and conditions, the telegraph card, and a sigil for every archetype, which makes each crew member's crest. Two directions on a Preview, on Mo's phone in both themes, and Mo picks one.
2. **The character.** Full screen without the site's header, a crest at the top, set actions as dice you can see grow, the roll as a moment (the dice front and centre, the counting folded behind them), and a Sheet tab that reads at a glance before it goes into detail.
3. **The rules.** The objects drawn inline, terms on tap from the glossary (offline, without leaving the page), examples headed by the crew member's crest with a Try it that rolls their real dice, the steps-into-dice ladder drawn, and an easy way back to where you were reading.
4. **The builder.** Archetypes as sigil cards with what they play like, and dice that grow on screen as lines go onto set actions.

Each one's a small stage of its own, checked like the app's stages, and goes to the table as soon as it's ready.

## Open

- **Order.** Claude suggests this goes before the app plan's stage 7, since stage 7 adds the party sheet and sharing, and building them in today's look means doing them twice.
- **Stage 7's call**, who in the party sees what of each other's sheets, is still Mo's.
