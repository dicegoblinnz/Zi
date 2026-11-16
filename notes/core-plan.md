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

## The crew on the new core

**For Mo's yes** (prompt 2, 16 Nov). Their sheets in 03b and every example in prompt 2's chapters (03, 03a, 03b and 18) come from this section, and prompts 3 to 6 take their numbers from here.

Everyone keeps both Titles, all six permissions, both archetypes with both their abilities, their attuned thing and everything they carry, so every sheet's still 35 points with the same Points line. Each Title's 5 is its 3 from stacking made 5, the 2 more spread the way the 3 were (`toFive()` in `roots.js`, the same thing a saved character gets), so every Title keeps its feel. Aura's 5. Each awakening locks a point of the Root in its brackets, so a Root holds its number less what's locked, and still rolls all of it. A roll below is the Root at full, and 2 for each awakening that fits.

Four of them have a Root at 0, as they did on stacking: Vesk's and Wren's Soul, and Isolde's and Ash's Body. On the new core that's no health there, so the first hit at it wounds them, unless they take it on another Root for 2 points. That's how they were spread, so it's kept, and it's Mo's call whether any of them should put a point there instead.

| Who | Titles | Roots | Locked | Holds | Total |
| --- | --- | --- | --- | --- | --- |
| Vesk | *The best cat burglar in the city* (Body 5) · *Raised by the Guild* (Mind 3, Body 2) | Body 11 · Mind 5 · Soul 0 | 1 Body (her hook) | Body 10 · Mind 5 · Soul 0 | 15 |
| Bram | *The wall that held the harbour gate* (Body 5) · *A sergeant who lost his stripes* (Soul 3, Mind 2) | Body 9 · Mind 3 · Soul 4 | 2 Body (his hammer) | Body 7 · Mind 3 · Soul 4 | 14 |
| Dorrie | *The voice that talked a duke out of his own house* (Soul 5) · *The woman with a hundred names* (Mind 3, Body 2) | Body 3 · Mind 7 · Soul 6 | 1 Mind (her pin) | Body 3 · Mind 6 · Soul 6 | 15 |
| Isolde | *The last student of a dead order* (Soul 5) · *A scholar of forbidden texts* (Mind 5) | Body 0 · Mind 9 · Soul 7 | 1 Soul (her chalk) | Body 0 · Mind 9 · Soul 6 | 15 |
| Wren | *The hunter who has never lost a trail* (Mind 5) · *An outrider from the border war* (Body 5) | Body 8 · Mind 8 · Soul 0 | 2 Body (her bow) | Body 6 · Mind 8 · Soul 0 | 14 |
| Ash | *The last fire-speaker of the Ember Court* (Soul 5) · *The Court's runaway heir* (Mind 3, Soul 2) | Body 0 · Mind 5 · Soul 11 | 1 Soul (her stone) | Body 0 · Mind 5 · Soul 10 | 15 |

Their awakenings, each 2 steps on a roll it fits and 2 more for each Aura:

- **Vesk:** *Anywhere I can throw a hook* (Body), every roll she makes with her grappling line.
- **Bram:** *Ring the bell* (Body), every roll he makes with his war hammer · *Knock them flat* (Body), a swing to knock someone down, and everyone it beats is *Prone*.
- **Dorrie:** *Someone who matters* (Mind), every roll where she passes as someone of rank.
- **Isolde:** *A circle anywhere I can kneel* (Soul), her ward the dead can't cross, drawn wherever she kneels, with room for her and a friend.
- **Wren:** *Long shot* (Body), every roll she makes with her longbow · *Hit anything I can see* (Body), her arrows reach anything she can see, and cover doesn't help it.
- **Ash:** *Fire without a word* (Soul), every roll she throws fire with.

Two rolls each, with what they were on stacking:

| Who | Roll | Steps | Dice | Was |
| --- | --- | --- | --- | --- |
| Vesk | Picking a lock: her Body | 11 | d12 + d10 | 13 |
| Vesk | Over Lord Vane's roof: her Body and her hook | 13 | 2d12 + d2 | 16 |
| Bram | Defending behind his shield: his Body, and Defend's dice go in with it when it lands | 9 | d12 + d6 | 14 |
| Bram | Barking an order: his Soul, and his Body brought in on *fight in a shield wall* for a point | 4, or 13 | d8, or 2d12 + d2 | 6 |
| Dorrie | Lying past the gate guard: her Mind | 7 | d12 + d2 | 11 |
| Dorrie | Passing as someone of rank: her Mind and her pin | 9 | d12 + d6 | 12 |
| Isolde | Reading the order's old script: her Mind | 9 | d12 + d6 | 12 |
| Isolde | Drawing a ward: her Soul and her chalk | 9 | d12 + d6 | 10 |
| Wren | Shooting from cover: her Body and *Long shot* | 10 | d12 + d8 | 12 |
| Wren | Following a trail: her Mind | 8 | d12 + d4 | 10 |
| Ash | Throwing fire: her Soul and *Fire without a word* | 13 | 2d12 + d2 | 13 |
| Ash | Commanding a room: her Soul | 11 | d12 + d10 | 12 |

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

- **Prompt 2**: Appendix D's archetype lines and *Foretold* are yours word for word, off your branch as it was pushed, bar the Healer's Trait, still *Good Hands* so the build matches the 03a that's landed. Take your *Come Prepared* line when you merge. A bond thread's borrow and strain in Appendix D are written as calls 7 and 12 say, so check them against your 03. Merging will want the player reference and `src/data/sheets.json` built again (`npm run sheets`), and both notes keep both our sections.
- **Prompt 3**: Appendix D's *Round budget* and *Threat budget* bullets still have stacking's numbers, and the player reference keeps them out, so move them with Running the Game's. Conflict's Telegraphs and Multipliers and the glossary point at Running the Game and name no numbers. Deadly threats' hits (call 11) want a tag in the Tag Reference and a line in the Threat Builder. The Learn deck's 25 cards on these sections are named by the build.
- **Prompt 4**: the companion's rules on tap read these sections' new words already, by the same ids.
- **Prompt 5**: redraw the player reference's second page for points, wounds and Toll.

Prompts 3 to 6 can start once prompt 2 has landed too.

### 2. The character

Built 16 Nov on `rules/2026-11-16-core-character` and landed. Its calls are in `notes/to-confirm.md` under 16 Nov, 2.

- **03b:** the six crew from The crew on the new core above, each Title spread 5, Aura 5 and no tracks, and each awakening `*Its name* (Root): what it does`. The Quick Build, Wren's example and the Title ideas say a Title's 5.
- **03:** Building Your Character on the new core: a Title's 5 on your Roots, a Root's points as its dice, health and spend, a roll as one Root at full and bringing another in on a permission, items never steps, attunement (each awakening locks a point of its Root, 2 steps on a roll it fits and 2 more for each Aura, no powering, no Aura on the maximum), armour ticking a box instead of a point, bond threads (borrowing one thing, so a friend's permission can bring a Root in, and straining one for a point of Soul, as The Core has it), Boons on points (no Splits or Extra action Boon, Acting as a Burden with no Boon), and Vesk built start to finish on the new numbers.
- **03a:** every ability's 1 Aura and no archetype has a home track. The Healer's heal is a Root unsplit, less 5 a Toll, with *Good Hands* ignoring a step of Toll, and every archetype and example is on the new core (the calls say what changed in each).
- **18:** every attuned thing's awakenings with the Root each locks, what they do in place of what Aura bought, the Surgeon's Casebook's *What worked* ignoring a step of Toll, Sister Hale's Thimble adding 3 to every heal roll, and Dorrie's worked example on the new numbers.
- **The build:** `scripts/crew-sheets.mjs` stops on a Title that doesn't spread 5, a track in the numbers, Aura that isn't 5, an awakening without its Root, or awakenings locking more of a Root than it's got, and puts `core: true` on each crew sheet. `build-content.mjs` reads an ability as `**Its name (1 Aura):**` with its `cost`, warns on a home track, needs no Splits or Extra action Boon, and reads Coin and Kit's awakenings as `{ name, root, text }`. Appendix D's archetype lines (prompt 1's) are on the new core, since the paper sheet takes each Trait's short words from them.
- **`dice.js`:** `fillDice(steps)`, `stepsOf(dice)` and `isSplit(dice, steps)`.
- **`armour.js`:** `onRoot(c, s, root)` and `boxesOn(c, s, root)`, the pieces on a Root that can still take a hit.
- **`roots.js`:** the shared pieces, as above. `rootsSheet()` makes a Title spread 3 into 5 (`toFive()`, with `fromThree` on it) unless the sheet says `core: true`, and a grown Title spread 3 always. An awakening with no Root locks their biggest Root, `guessed`. `choicesOf()` adds `{ k: "five", t, was }` and `{ k: "lock", a, name, root }`. The state's `v: 4` (`freshCore()`, `normalCore()`): `pts`, `wound`, `toll`, `scars` by Root, `blaze` (a Root whose Scar waits for its Catch), `out` (left the scene) and `core` (till they've seen the move). The rest: `awakeningsOf()` (keys the same as `thingsOf()`'s, each with its `root` and whether it `works`), `lockedOf()`, `capOf()`, `spendPts()`, `takeHits()`, `canBlaze()`, `blazeOn()`, `lastScar()`, `takeScar()`, `healBy(…, { other, ease, bonus })`, `restOf()`, `sceneEnd()`, `downtimeRest()`, `countRoll()` (with `conds`, `pool` and `plus` as well, and `short` and `ok` for what can't be paid) and `payFor()`. `archetypesOf()` gives each ability its `cost`.
- **Lined up with prompt 1's landing:** 03 and 18 follow its calls 7 and 12 (a strain and a big bite are a point of Soul, and a bond thread lends one thing). Its last commit took 03a's archetype lines and *Foretold* into Appendix D and The Core, and the Healer's Trait stays *Good Hands* on both, where 1's note above expected *Come Prepared* (call 9 says why). The crew came out as 1's examples have them, so nothing needs bringing into line. Two small changes in its `tools/check_terms.py`: *area for anyone* lets an ability's price, `(1 Aura):`, through, and *tracks* lets *track by* through (the Wildcraft idea's *track by scent*).
- **Checks:** `tests/check-companion.mjs` part 1e, no browser.

What the other prompts need from it:

- **The screens that haven't moved:** everything from stacking they use is still at the bottom of `roots.js` (the tracks, `freshRoots()`, `normalRoots()` and the rest, on a v3 state), so the play screen, the builder, downtime and print still draw. `countRoll()` is the new one, so the old roll card counts the Root and awakenings and nothing else. Powering's gone (`passivesOf()` is empty). `src/pages/kit.astro` (4's) counts its rolls at the new totals and reads no track, so the build goes through, and the rest of the page is still stacking's.
- **3:** the crew's numbers above, for the Learn deck and `tools/fight_sim.py`. Running the Game's *Catches and Resolve* and Appendix C's hostile thread still give a size of Resolve for a big bite, which is a point of Soul now (02, 03 and 18).
- **4:** `normalCore()` in place of `normalRoots()`, with notes for `s.core` and `s.choose`'s `five` and `lock`. Abilities are paid in Aura (`cost`), there's no `home`, and Push is still `push` on `archetypesOf()`. The Healer heals with `healBy(…, { other: true, ease: 1 })`, and the Thimble's `bonus` is 3. A roll's `bring` takes a permission's key or a borrowed one's words. `learn.js` and the kit move with it.
- **5:** the builder spreads `TITLE_ROOTS` (5) already. An awakening needs its `root` carried through the build (`fixAwk()` and `sheetOf()` in `builder.js`, and `fromCrew()` and `randomBuild()` in `ways.js`, which drop it, so a copy of Isolde's chalk locks her Mind, her biggest, till then), and a sheet the builder makes can say `core: true`. Print reads archetypes' `home` and the tracks, so part 1f has 47 checks waiting on it. Downtime's Recover goes to `downtimeRest()`.
- **6:** `extraCost()` and `EXTRA_AURA` are still there for `table-rules.js` till extra actions go, and `takeHits()` is what When it lands takes.
- **7:** Chapter 07, Magic, isn't on anyone's list, and its Summoning still has souls on a track size.

### 3. The GM's side and the rest of the book

Built 16 Nov on `rules/2026-11-16-core-gm`. Its calls are under 3 in `notes/to-confirm.md`'s 16 Nov section.

- **`tools/fight_sim.py`** has the new core as its default (`CoreFight`, `run_core()`, `find_core_f()`): Bram, Vesk, Wren and Ash off 03b, defence from the Root split to meet what lands, hits as points, armour first, a wound at 0 and a Scar after it, played plain and hard, with the GM spreading it (`--gm even`) or piling on the lowest Body (`--gm hard`, the default), and a fight's length in minutes from `MIN_TELE`, `MIN_GO` and `MIN_LAND`. Stacking and 10 Nov stay as `--rules stack` and `--rules now`. Its top has the numbers.
- **The numbers:** a crew lands 2.6 wins a round played plain and 3.7 hard. Redhand at *Armoured ×4*, *Feeds ×3* at Hard (72) runs 57 minutes plain and 40 hard (5.7 and 4.0 rounds), first Bloodied in round 2 and 3 at the median. So multipliers start at a Challenge less 2, the threat budget's the crew's Roots added up (64), the round budget's three quarters of it (48, Hard 72), and at Hard the GM piles on whoever's hurting.
- **Running the Game (19)**: the budgets, multipliers and the rest on points, wounds and Aura abilities. **Conflict's A Full Fight** on the new core. **01, 04, 14, 15, 16, 17, 20, 22, 28**, Appendix A's party and faction sheets, **B** (with *Deadly*), **C** rewritten, Appendix D's budget bullets, the **index**, the **Learn deck** (all 40 cards, `checked: 2026-11-16`) and **`c-2026-11-16-budgets`**, with a Since 16 Nov note on each budget in `c-2026-11-14-budgets`.

What the other prompts need from it:

- **6:** a telegraph from a *Deadly* threat is 2 hits or more, and costs its steps once for each hit.
- **7:** Chapter 07, Magic, still has stacking's words (9 retired-word lines). The site's search check looks for *Stamina*. Prompt 5 landed before this one, so the sheets were built again on both.

### 5. The builder, downtime and print

Built 16 Nov on `rules/2026-11-16-core-build` and landed. Its calls are in `notes/to-confirm.md` under 16 Nov, 5.

- **The builder (`builder.js`, build `v: 5`):** a Title spreads 5 with All on and a stepper on each Root (`nudgeSpread()`, exported, which downtime uses too), each awakening picks the Root it fits (`awk: [{ name, root, text }]`, no passive or active), and the sheet it makes says `core: true`. Aura's 5 and 2 for each Aura Boon, with no tracks on the numbers. The Roots step says what each Root holds once its awakenings have locked their points, a Root at 0, and the awakenings, in place of everything that was a step. A build from stacking (`v: 4`) has each Title's 3 made 5 (`R.toFive()`, `three` on the Title till it's saved, and the sheet goes out spread 3 without `core`, so `roots.js` flags it `five` the same way) and each awakening on their biggest Root (`guessed`), with a note in Change, and one from before stacking or before Roots spreads 5 (`spreadFor()`). `checksOf()` warns on an awakening with no Root and one with no point to lock.
- **The other ways in (`ways.js`):** `fromCrew()` carries each awakening's Root, and `randomBuild()` spreads 5 and swaps the attuned thing for one of the book's that fits their Roots when its awakening's Root is at 0. 1000 of 1000 pass every check on 35.
- **Downtime (`downtime.js`):** everything back first (`R.downtimeRest()`), said on the card (Mind 2 to 9, Frayed gone, 2 Toll gone), no Recover slot (Mend's its own), the Aspiration rolled on a Root at full, rolling again a point of Soul, a new Title spreading 5, and an awakening, a new one or an Aspiration's attuned thing's, with its Root. What it grows lands on a full character (`R.capOf()` on the sheet with it grown), then the Soul paid comes off.
- **Print and the paper (`print.js`, `sheet-fields.js`, `scripts/sheets/`):** each Root's number, dice, where it came from, what's locked, what it holds, the points it has now, its wound by name, two Scar lines and two armour lines; Toll beside Aura and stride; Getting it back beside conditions; each awakening rings B, M or S; no home track; an ability says its cost only past 1 Aura. Print reads any state as `normalCore()` moves it, so a stacking state prints full, its Scars on their Roots. The player reference's second page opens on a Root's points, drawn (`points()` in `player-reference.mjs`, its words checked against Appendix D's Your points). `src/pages/sheets.astro` says so too, the one file off my list.
- **Appendix A's The character sheet** on the new core, with Vesk's front and back as examples.
- **Checks:** `tests/check-companion.mjs` parts 1f (print field by field, a stacking state printed, Vesk Bloodied mid-scene and Rook past the paper's room), 5, 5b and 5c (Vesk built with All on and the steppers, her hook on her Body, a build from stacking made 5), 6, 8 (Isolde's week on the new core with no browser, then Vesk's on the phone), 8b and 9 (the crew growing on the new core, a Title grown on stacking made 5).

For the prompts after this one:

- **4:** the play screen still keeps stacking's state (`v: 3`, tracks), so downtime has a bridge (`onCore()`): on a state with `pts` it's the new core, and on one without, everything back is every track on d12 and rolling again's 1 Resolve. Once the play screen's on `normalCore()`, downtime needs nothing more, but `endScene()` straight after `dt.apply()` in `finishDowntime()` shouldn't roll a scene's recovery on a character downtime's just filled (Toll's 0 already). Part 8's Vesk on the phone expects stacking's words (*Stamina d4 to d12*), so change them to her points when the play screen moves (the no-browser half already plays the new core), and parts 5c and 6 take a state on either.
- **3:** the player reference's points panel reads Appendix D's Your points for *Hits:*, *Wounds:*, the three wounds, *Scar:*, *Blaze:*, *Toll:*, *a heal loses 5 for each Toll* and *Downtime puts everything back*, and the build stops if they go.
- **7:** CLAUDE.md's lines on the builder, downtime, print and the paper sheet.

### 6. The live table

Built 16 Nov on `rules/2026-11-16-core-table` and landed. Its calls are in `notes/to-confirm.md` under 16 Nov, 6.

- **One action a round** (`table-rules.js`): `spentBy()` counts an action for each roll, by `rid`, the roll's id, on an answer (`ans.rid`), a roll at the scene and the roll on a Root it was opened from (an `else` act's own id), and one for anything without one. Nothing gives another: the `acts` change turns down `more` it hasn't got already, with a message, and the phone's `settleActs()` gives the Aura back. A round from stacking keeps `more` and `paid` and reads them as before (`moresOf()`), and `priceWrong()`, `MORE` and `ONCE` are gone, so nothing imports `extraCost()` or `EXTRA_AURA` any more.
- **An answer as a Root and what's brought in**: `ans` keeps `root`, `bring` (the Roots brought in, never its own) and `steps`, and `howOf()` says it ("20 steps on Body and Mind"). A combo (`join`) is `{ root, steps }`, the Root and 2 for each awakening that fits, for no Aura, picked on Root tiles in `joinView()` (`jroot`, `jawk`, `jput`), and an answer's `with` carries each friend's `root`. A stacking join's `paid` still comes back if it's taken back.
- **Hits**: a telegraph's `hits` (1 to `MOST_HITS`, 6, and 1 on one from before, `hitsOf()`), picked in the composer (1 to 4 hits), said on every card ("At Vesk’s Body, 2 hits a die"), the table screen and the roll card, and read off a page's telegraph by `readAim()` in `aims.js` ("Body, 2 hits, Pinned").
- **When it lands from the Root**: `def.on` is the Root or Defend, and a track's name from an older phone is read as its Root (`onOf()`), stored as the Root. What got through is `hits`, `lost` ({ Body: n }, 2 for 1 included), `box`, `wound` and `scar`, said by `costOf()` ("2 hits: a point off Body and Bloodied"), or the player's `paid` words when there are no numbers. A lost answer lands then and there: on the new core its hits are owed (`owedHere()` in `table.js`), with Take the hit on its card, and `defend` takes a record for it with nothing stopped and `mine` null.
- **Wounds and Scars**: `woundsOf()` and `outOf()` read the fight's records. A Scar, or the Blaze (an `else` act `{ act: "Blaze", set: true, root }`, in Something else for a wounded Root, with `R.blazeOn()`), takes them out of the scene till That fight's over: `teleFrom()` won't aim at them and leaves them out of a place, and `answer`, `acts` and `icp` turn them down. The GM's crew lines and the table screen show each wound (Bloodied, Frayed, Hollow) and who's out, her composer greys them out, and their phone says they've left the scene.
- **Intercepting** is as it was: 1 Aura for each friend, free for a Guardian, only at a Body, and not once you've left the scene.
- **Old tables still read**: a blow, fear, a track's name, a specialty, extra actions and a stacking join's Aura all read the way they did.
- **Checks**: `tests/check-companion.mjs` part 1b (one roll at several things, no buying another, a combo's Root, hits, a lost answer taken, wounds, a Scar and the Blaze out of the scene, an older table), and `tests/check-accounts.mjs` parts 6 to 6d on the new crew's numbers, 6b's combo and a die of the same roll taking Locked, and a new 6e: a deadly knight on Vesk's phone and the TV, what it cost her on Mo's page, his crew lines and the TV, and Bram Scarred out of the scene till the fight's over (`ZI_UPTO=6e`).

What the other prompts need from it:

- **4:** `table.landedFor()` gives `hits[j]` and `nodef[j]` (a lost answer: no dice against it, its hits taken as they are), and only offers the lost ones to a character on the new core (`state.pts`). When it lands records `{ on: Root or "Defend", stopped, mine, v, real, paid, hits, lost, box, wound, scar }` per telegraph through `table.record(s, camp, "d", id, …)`. The telegraph `d.answer(root, tele)` opens with has `rid`, `hits` and `root`, and a roll on a Root from Something else calls `d.answer(root, null, { rid })`: every telegraph and stake that roll's dice go at goes up with that `rid` (`table.record(…, "a", id, { root, bring, steps, rid, … })`, and `table.noteWork(s, r, { …, rid })`, which takes `r.work.rid` when the entry hasn't got one), so it's one action. `record()` takes the open roll card's `tele.rid` for now. A friend in an answer is `tele.with[]`, `{ name, steps, root }`. `catchUp()` does nothing on the new core, and the Blaze from Something else has called `R.blazeOn()` already, leaving the Scar's Catch to the play screen.
- **7:** CLAUDE.md's live table lines (extra actions, Got another action, a track or Defend, the combo's things that fit) move onto this. `extraCost()` and `EXTRA_AURA` in `roots.js` have nothing left that uses them from the table.


### 7. Bringing it together

Run 16 Nov on `rules/2026-11-16-core`, with prompt 4 still to build. Its calls are under 7 in `notes/to-confirm.md`'s 16 Nov section.

- **Merged:** prompts 1, 2, 3, 5 and 6 had all landed on `rules/2026-11-16-core` already, with nothing left on their branches. Prompt 4 has no branch and nothing built, so the play screen, the roller, the learning round and most of `/kit/` are still on stacking.
- **Fixed:** Magic (07) on the new core (a school's Title 5, the ember stone's awakening locking a point, every example a Root at full, area magic's Push and *Sculpt* in Aura, souls that don't lock a point or add to Aura, catching a soul on the Root that fits), with a line in `c-2026-11-16-core`. The site's search check looks for *Bloodied*. `tools/check_terms.py` finds nothing in the book it didn't on `main`.
- **Rebuilt:** the site, the sheets (`npm run sheets`) and the reading copy (`tools/build_book.py`).
- **Checks:** `tests/check-site.mjs` and `tests/check-world-engine.mjs` pass whole. `tests/check-companion.mjs` passes every part that isn't prompt 4's (1, 1b, 1c, 1e, 1f, 5, 5b, 5c, 6, 8, 8b, 9 and 10), and part 3 (Vesk at the table) fails on stacking's numbers and stops the run, as it should till the play screen moves. `tests/check-accounts.mjs` passes whole, the live table on the new crew included.
- **CLAUDE.md** has a New core section saying what's on it, what's still stacking's, and the shared pieces, and its crew, sheet and fight_sim lines are on the new core.

**Not ready for `main`.** The play screen is where a player rolls, and on this branch it still counts tracks, extra actions and everything that fits, while the book, the builder, the sheets and the live table don't. Once prompt 4 lands, what's left of this prompt is short: CLAUDE.md's play screen, roller and learning round lines, the full `tests/check-companion.mjs` once, the Preview, and Mo's yes.
