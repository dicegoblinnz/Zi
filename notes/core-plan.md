# The new core: the plan

Mo's 16 Nov rework, part 2 of the rework that comes in parts, settled after a game designers meetup on 15 Nov. Steps stop being counted: a roll is one Root at full, and a Root's points are its dice, its health and what you spend to push. The three tracks, extra actions and every fitting thing adding a step all go. His words and answers are in `notes/playtest-sheets/2026-11-16-chat-decisions.md`, and the calls Claude made filling the gaps are in `notes/to-confirm.md` under 16 Nov.

Several chats build it at once, one prompt each, the way part 1 was built (`notes/stacking-plan.md`), and every chat reads this plan first. Each one owns its own files, works on its own branch, and lands back into `rules/2026-11-16-core`. Nothing merges to `main` till Mo says, because the live companion has to keep working for his four campaigns.

## Why

- Rolls still took 1 to 2 minutes on stacking (15 Nov), and finding what fits was the worst of it. Now there's nothing to find: pick Body, Mind or Soul and roll it.
- The one feeling that had to survive is the clever fit. It lives in bringing in a second Root, a single moment said out loud and paid for.
- Tension comes from how far you push. Pushing spends your own staying power.

## The rules after part 2

Newest wins. Everything Mo hasn't changed stands: Aspirations, threads and bonds, conditions, Catches and Burdens, Boons, telegraphs and the GM's side, armour on a Root, and the 35 points.

- **Roots.** A Title puts 5 on your Roots, spread however you like, and comes with its one permission, so it's 6 in all. A permission puts 1 on its Root. Nothing else adds to a Root.
- **A Root's points.** Body, Mind or Soul at 8 is 8 steps of dice, 8 points of health and 8 points to spend. Getting stronger makes you sturdier.
- **A roll** is one Root, the one that fits how you're doing it, rolled at full. Spent, lost or locked points never shrink the dice. Steps into dice is the same table, and past 6 steps is more dice.
- **Permissions** are only permissions: what you can do, and what justifies bringing a Root in. They're never counted on a roll.
- **Bringing in a Root.** Name the permission that justifies it, then pay 1 point from the Root you bring in, or 3 Aura. Its whole Root goes on the roll. You can bring in both other Roots, each paid on its own.
- **Pushing never hurts you.** You can't spend points you don't have, so spending down to 0 only leaves you exposed.
- **Splitting** has no limit. Split your dice any way you like.
- **One action a round, and every die is an intent.** There are no extra actions. More dice is how you do more.
- **Aura.** Maximum 5, full at the start of every scene. +1 for every die that wins and +1 for every top face, past 5 while you're acting as now. It pays for bringing in a Root (3), archetypes' abilities, and awakenings' extra steps.
- **Archetypes** give their mechanic, their Trait and their abilities. Abilities are paid in Aura.
- **Attunement** locks Root points. Each awakening locks 1 point of the Root it fits for as long as it's attuned (Soul 5 to 4), and adds 2 steps to a roll it fits. Each Aura spent on it adds 2 more. Attuned things no longer touch Aura.
- **Hits.** A telegraph die that gets through is a hit, and a hit takes 1 point from the Root it's at. A vulnerability or a deadly threat makes it 2, 3 or more hits. You can take a hit on another Root for 2 points instead, if that Root has them.
- **Defence.** When telegraphs land, roll the Root they're at, at full, split however you like, once for that landing. Each die stops one telegraph it meets or beats. Defending as your action puts its dice in too.
- **Wounds.** A hit on a Root at 0 wounds it: **Bloodied** (Body), **Frayed** (Mind) or **Hollow** (Soul), one each. A wounded Root heals only to half its maximum, rounded up, till downtime or a story moment clears it. Damage carries past 0, so a ×3 hit on Body 1 empties it, then wounds it, then Scars it.
- **Scars.** A hit on a Root at 0 that's already wounded is a Scar, and you leave the scene. A Scar's a Catch on that Root and locks 1 point of it for good. While you're wounded you can take the **Blaze**: take the Scar, do something big, then leave. A player can still choose for their character to die at their first Blaze.
- **A heal** is rolled unsplit (the dice filled to a d12 first, so 8 steps is a d12 and a d4), and recovers what it rolls, spread across any of the patient's Roots. It never takes a Root past its maximum, or past half while it's wounded.
- **Toll.** Every heal a character takes from someone or something else adds 1 Toll, and a heal loses 5 for each Toll they've already got. Toll can't take a heal below 0. It drops by 1 at the end of each scene and clears in downtime. A prepared healer's Trait or attunement ignores a step of Toll, and some attunements add a flat bonus to heal rolls.
- **Two rests.** At the end of every scene, roll each Root unsplit and recover what you roll. Downtime recovers everything, wounds included. The Recover slot goes, since downtime does it all.
- **Aura on recovery.** Recovery rolls are never split. Their top faces give Aura, and the amount healed never does.
- **Armour** sits on a Root as now: tick a box instead of losing a point.
- **Making a character** is 35 points as now. A Title, archetype or attuned thing is 5, with its one permission, ability or awakening. Each extra permission, ability, awakening or item is 1.
- **Characters already saved** keep everything they've got, recounted: each Title's 3 becomes 5 (the 2 more spread the way the 3 were, as near as it goes, flagged for the player to check), every Root starts full, the tracks go, and a track's Scars become Scars on its Root.

## Still to work out at the table

- Which Traits and attunements ease Toll, and which add a flat bonus to heal rolls. Mo: "there is a lot to do here". The book gives the Healer one of each to start, and Coin and Kit one attuned thing of each, and the rest waits.
- The GM's numbers. Hits of 1 point against Roots that are health change every budget. `tools/fight_sim.py` finds them again (prompt 3). At the table, note the round the first Bloodied lands in a big fight: round 3 or 4 of a 45-minute fight feels right.
- The Summoner's souls on this core, and anything else that cost a track size.

## The shared pieces

Every chat codes to these names and shapes, so the pieces fit when they land. Prompt 2 builds them, and the rest stub them till it lands.

- **The sheet** (`rootsSheet()` in `src/companion/roots.js`): a Title's `roots` add up to 5. `c.roots` is each Title's spread and 1 for each permission on its Root, and it's both a Root's dice and its maximum. `c.numbers.aura` is 5, plus any Aura Boon. An awakening has a `root`, the one it locks.
- **The state** (`v: 4`): `s.pts` is `{ Body, Mind, Soul }`, the points each Root has now, full on a new character. `s.wound` is `{ Body, Mind, Soul }`, each true or false. `s.toll` is a number. `s.scars` stays, each with its Root. `normalCore()` moves a v3 state across: every Root full, the tracks gone, a track's Scars on its Root.
- **What a Root can hold:** `capOf(c, s, root)` is `c.roots[root]` less what's locked (`lockedOf(c, s)`: each awakening's point and each Scar), halved and rounded up while it's wounded.
- **Dice unsplit:** `fillDice(steps)` in `src/companion/dice.js`, d12s first and the rest as one die (8 steps is a d12 and a d4).
- **A roll:** `{ root, bring: [{ root, perm, pay }], awk: [{ key, aura }], dice, against, aim }`, `pay` being `"pt"` or `"aura"`, counted by `countRoll(c, s, r)`: the Root, each Root brought in, 2 for each awakening and 2 more for each Aura on it, with what it costs in points and Aura. `dice` is how the player split it, any way at all.
- **Harm:** `takeHits(c, s, root, n, { on })` takes `n` hits at `root`, or at `on` for 2 each, and hands back `{ lost, wound, scar }`.
- **Healing:** `healBy(c, s, rolled, spread, { other })` heals what's rolled less 5 for each Toll (`other` adds Toll), capped by `capOf()`. `sceneEnd(c, s, rolls)` recovers each Root what it rolled and drops Toll by 1. `downtimeRest(c, s)` puts everything back and clears wounds and Toll.
- **A crew sheet in 03b** keeps its labels and shapes, with each Title's spread adding up to 5, `**Roots:**` the totals, no track line, and `**Aura:**` 5.

## Who owns what

A chat changes only its own files, its own parts of `tests/` and its own blocks of `companion.css`. If it needs a small change in someone else's, it makes the smallest one and says so in its report.

| Prompt | Piece | Owns |
| --- | --- | --- |
| 0 | Write it down | this plan, the decisions, `notes/to-confirm.md`'s 16 Nov section, a line in CLAUDE.md |
| 1 | The rules | chapter 02 · Conflict (05) bar A Full Fight · Downtime (12) · Appendix D · the glossary · the change log entry `c-2026-11-16-core` · `tools/check_terms.py` |
| 2 | The character | chapters 03, 03a, 03b and 18 · `scripts/build-content.mjs` and `scripts/crew-sheets.mjs` · `roots.js` · `points.js` · `dice.js` · `armour.js` · `src/generated/crew-archetypes.json` |
| 3 | The GM's side and the rest of the book | `tools/fight_sim.py` · Conflict's A Full Fight · 01, 04, 13 to 17, 19 to 28 · Appendices A (bar The character sheet), B and C · the index · `content/learn.md` · the change log entry `c-2026-11-16-budgets` |
| 4 | The play screen and the roller | `app.js` · `look.js` · `marks.js` · `roller.js` · `roller-rules.js` · `learn.js` (the learning round) · `src/pages/kit.astro` |
| 5 | The builder, downtime and print | `builder.js` · `ways.js` · `downtime.js` · `before.js` · `print.js` · `sheet-fields.js` · `scripts/sheets/` · `scripts/build-sheets.mjs` · `public/sheets/` · `src/data/sheets.json` · Appendix A's The character sheet |
| 6 | The live table | `table.js` · `table-rules.js` · `table-screen.js` · `aims.js` · `src/worker/` |
| 7 | Bringing it together | CLAUDE.md · this plan's status · whatever's left over |

## How each chat works

- Branch `rules/2026-11-16-core-<piece>` off `rules/2026-11-16-core` and push it, so it gets its own Preview on the `zidara` Worker.
- Stay in your own files, and code to the shared pieces. If one hasn't landed yet, stub it with its name and shape, and let the real one replace it when you merge.
- While part 2's in pieces, other pieces' checks can fail. Yours must pass, and don't break any that were passing. If other work's checking on the same machine, run yours with `ZI_PORT` set to a port of your own.
- Your calls go in your subsection under 16 Nov in `notes/to-confirm.md`, and what you built in your section under Where each piece has got to.
- To land: merge the latest `rules/2026-11-16-core` into your branch, run your checks, then the full suites once, then merge into `rules/2026-11-16-core` and push. Never `main`.
- Finish with what's built, the calls you made, anything another prompt needs to know, the Preview link, and which prompts can start now.

## The order

- **0** first, on its own (done, 16 Nov).
- **1 and 2** at once.
- **3, 4, 5 and 6** once 1 and 2 have landed.
- **7** once 1 to 6 have landed.

## The prompts

### 1. The rules

> Prompt 1 of `notes/core-plan.md`: the rules. Read the plan, the 16 Nov decisions and the 16 Nov calls in `notes/to-confirm.md`, then branch `rules/2026-11-16-core-rules` off `rules/2026-11-16-core`. Write The Core (02) on the new core: Roots from Titles (5, spread) and permissions (1), a Root's points as its dice, health and spend, a roll as one Root at full, bringing in a Root (a permission, then 1 point or 3 Aura), pushing that only exposes you, splitting with no limit, one action a round with every die an intent, and Aura. Write Conflict (05), bar A Full Fight: your action, defence from the Root, hits of 1 point and taking one on another Root at 2, vulnerabilities and deadly threats as more hits, intercept, Bloodied, Frayed and Hollow, Scars and the Blaze, healing and Toll. Write Downtime's recovery (12), then Appendix D, the glossary and the change log entry `c-2026-11-16-core`. Retire the tracks, extra actions and counting things on a roll in `tools/check_terms.py`. Make the smallest calls in the shape of the rules and log them. Run the checks in Changing a rule, land it, and give me the calls you made.

### 2. The character

> Prompt 2 of `notes/core-plan.md`: the character. Read the plan, the 16 Nov decisions and the 16 Nov calls in `notes/to-confirm.md`, then branch `rules/2026-11-16-core-character` off `rules/2026-11-16-core`. Rebuild the six crew in 03b on the new core (each Title's spread 5, keeping its feel, everything else as it is on 35 points, Aura 5, each awakening locking its point) and put their numbers in this plan for Mo's yes. Write Building Your Character (03), The Archetypes (03a, abilities paid in Aura, the Healer's Toll Trait) and Coin and Kit's attunement (18, awakenings locking a point for 2 steps, 2 more for each Aura, and one attuned thing that eases Toll and one with a flat bonus to heal rolls). Build the shared pieces in `roots.js`, `dice.js` and `armour.js`, with `normalCore()` moving saved characters across, and change the build's crew checks. Land it, and give me the crew and the calls you made.

### 3. The GM's side and the rest of the book

> Prompt 3 of `notes/core-plan.md`: the GM's side and the rest of the book. Read the plan and the 16 Nov calls, then branch `rules/2026-11-16-core-gm` off the latest `rules/2026-11-16-core`. Run `tools/fight_sim.py` on the new core (hits of 1 point, defence from the Root, wounds, Scars, Toll and the crew from prompt 2) and move Running the Game's round budget, threat budget and multipliers so a big fight lasts about 45 minutes, with the first Bloodied around round 3 or 4. Write A Full Fight, the rest of the book's chapters, Appendices A to C, the index and the Learn deck on the new core, and the change log entry `c-2026-11-16-budgets`. Land it, and give me the numbers and the calls you made.

### 4. The play screen and the roller

> Prompt 4 of `notes/core-plan.md`: the play screen and the roller. Read the plan, then branch `rules/2026-11-16-core-play` off the latest `rules/2026-11-16-core`. The play screen on the new core: each Root a tile showing its dice and its points left, a roll as a Root in one tap, Bring in a Root (pick the permission, pay a point or 3 Aura), awakenings with their Aura, splitting any way, When it lands from the Root with hits, taking one on another Root at 2, armour, wounds, Scars and the Blaze, a heal with Toll, and New scene rolling each Root unsplit. The roller and the learning round on it too. Explanations are question bubbles. Land it, and give me the Preview and the calls you made.

### 5. The builder, downtime and print

> Prompt 5 of `notes/core-plan.md`: the builder, downtime and print. Read the plan, then branch `rules/2026-11-16-core-build` off the latest `rules/2026-11-16-core`. The builder on the new core (each Title spreading 5, awakenings picking the Root they lock), Change and the other ways in, downtime putting everything back with no Recover slot, the paper sheet (each Root's points, its wound and Scars, Toll, Aura, no tracks or extra actions) and print, rebuilt with `npm run sheets`. Land it, and give me the Preview and the calls you made.

### 6. The live table

> Prompt 6 of `notes/core-plan.md`: the live table. Read the plan, then branch `rules/2026-11-16-core-table` off the latest `rules/2026-11-16-core`. The live table, the table screen and the Worker on the new core: one action a round with no extra actions bought, an answer as a Root and what's brought in, When it lands from the Root with hits as points (a threat's multiplier hits included), wounds and Scars, and intercepting. Old tables still read. Land it, and give me the Preview and the calls you made.

### 7. Bringing it together

> Prompt 7 of `notes/core-plan.md`: bringing it together. Merge every piece into `rules/2026-11-16-core`, run the full checks, fix what's left, rebuild the book's reading copy and the sheets, update CLAUDE.md and this plan's status, push the Preview, and tell me whether it's ready for `main`.

## Where each piece has got to

### 0. Write it down

Written 16 Nov: the decisions, this plan, the calls and the line in CLAUDE.md, on `rules/2026-11-16-core` off `main`. Prompts 1 and 2 can start.

### 1. The rules

Landed 16 Nov from `rules/2026-11-16-core-rules`. Its calls are under 1. The rules in `notes/to-confirm.md`'s 16 Nov section.

- **The Core (02)** on the new core: Roots (Title 5, permission 1), a Root's number as its dice, points and spend, How a roll adds up (a Root at full, a Root brought in, an awakening's 2 and 2 more an Aura, nothing else), Steps and Dice, a new section **Bringing In a Root** (`#s-bring`), The Roll (a point of Soul to roll again), every die an intent and splitting with no limit, Aura (5, what it buys), **Your Points** (on the old `#s-tracks`, with pushing never hurting you and 2 for 1), Catches (a big bite's a point of Soul), combos (every action brings its Root) and Study (*Foretold* for 1 Aura).
- **Conflict (05)**, all of it bar A Full Fight, which is still stacking's for prompt 3: one action with an intent on every die, **Doing more in a round** (on the old `#s-extra-actions`), moving and answering as dice, defence from the Root and Defend on top, intercept, **Hits and Consequences** (`#s-consequences`, with deadly threats' hits on their telegraphs), the conditions on points, vulnerabilities as more hits, **Wounds, Scars and the Blaze** (on `#s-blaze`), and Healing with Toll and the quick heal at 1 point.
- **Downtime (12)**: everything back as it starts, Recover's now **Mend** (on the old `#recover`, which 03 and the companion link to), and a point of Soul to roll again.
- **Appendix D, the glossary, the change log entry `c-2026-11-16-core`** (with a Since 16 Nov note on each older entry it replaces), and the new retired words in `tools/check_terms.py` (the tracks and their names, extra actions, counting what's on your sheet, bringing something in, Aura from attuned things and powering, a Title's 3, the old healing, and splits by action).
- **Every id the build, the companion and the Learn deck read survives**, so nothing else had to change to build: `s-tracks`, `s-extra-actions`, `s-blaze`, `s-healing`, `recover`, `how-permissions-stack` and the rest keep their ids on the sections that took their place.
- **One small change in prompt 5's files**: the player reference's tracks panel is gone from its second page (now *Your points, defence and threats*), since Appendix D's points section can't be drawn as tracks, and the player reference is rebuilt. The character sheet wasn't touched. Prompt 5 redraws it properly.
- **One small change in prompt 4's part of the checks**: part 3 of `tests/check-companion.mjs` looks for *Your Points* on the Rules tab where it looked for *The Tracks*.
- **Checks**: `tests/check-site.mjs` and `tests/check-world-engine.mjs` pass. `tests/check-companion.mjs` fails one thing only, the Learn deck behind this change (25 cards, `checked: 2026-11-14`), which is prompt 3's to check and set. The site's search check looks for *Stamina*, which only the change log will say once the whole book's moved, so prompt 7 might give it *Bloodied* instead.

The crew in every example are moved across by this plan's rule for saved characters, each Title's 2 more spread the way its 3 were: **Vesk** Body 11 · Mind 5 · Soul 0, **Dorrie** Body 3 · Mind 7 · Soul 6, **Bram** Body 9 · Mind 3 · Soul 4, **Isolde** Body 0 · Mind 9 · Soul 7, **Wren** Body 8 · Mind 8 · Soul 0 and **Ash** Body 0 · Mind 5 · Soul 11, each awakening locking a point of the Root it's on (Vesk's Body 10, Bram's 7, Wren's 6, Isolde's Soul 6 and Ash's 10 as their maximums, and Dorrie's pin on her Mind). If prompt 2's crew comes out different, prompt 7 brings the examples into line.

For the prompts after this one:

- **Prompt 2**: Appendix D's archetype lines are the plan's swaps (call 15), and a bond thread's borrow and strain are written as call 7 and 12 say. Your 03, 03a and 18 are the truth for both, so tell prompt 7 where they differ. The Shadow's coming out of hiding and the Extra action Boon have nothing left to give, since no extra actions are left (call 2).
- **Prompt 3**: Appendix D's *Round budget* and *Threat budget* bullets still have stacking's numbers, and the player reference keeps them out, so move them with Running the Game's. Conflict's Telegraphs and Multipliers and the glossary point at Running the Game and name no numbers. Deadly threats' hits (call 11) want a tag in the Tag Reference and a line in the Threat Builder. The Learn deck's 25 cards on these sections are named by the build.
- **Prompt 4**: the companion's rules on tap read these sections' new words already, by the same ids.
- **Prompt 5**: redraw the player reference's second page for points, wounds and Toll.

Prompts 3 to 6 can start once prompt 2 has landed too.
