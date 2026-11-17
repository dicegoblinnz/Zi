# The loop under tension (17 Nov)

**Since:** prompt 7 reran this on the real crew in 03b (Bram's plate and helmet soak 5, Wren's cloak is a tool so she's got no guard, Ash's coat soaks 2 and her coal horn's a tier 3 vessel). The big fight's still 52 minutes plain and 42 hard, so 45 holds, but with the hard GM piling on from round 1 the first Bloodied came in round 2 (Wren's Body, 33% at `--reach 1`). Piling on from round 2, the sim's default now and Running the Game's advice, puts it back in round 3 (31%, 3% in round 2), so prompt 7's numbers in `notes/fixes-plan.md` replace this note's first Bloodied. Prompt 8 then stopped vessels filling with Aura left at a scene's end, and made a point put in one stay held there till it's spent.

Prompt 4 of `notes/fixes-plan.md`, Mo's Fix 6. The whole loop on the 17 Nov fixes, run under pressure two ways: thousands of fights in `tools/fight_sim.py`, and once by hand, as a table would play it, with real dice. Your targets: rolls quick on paper and on a phone, a big roll that feels like a fistful of dice, a clever fit that still matters, and the big fight of a session at about 45 minutes with the first Bloodied around round 3 or 4.

Everything here's a proposal. Only the GM's numbers move on this note's say-so (prompt 7 writes them in), and nothing in a chapter's changed.

## In short

- **It holds.** The items, soak and vessels don't break the core. The big fight still runs about 45 minutes at Hard on today's budgets, rolls are a fistful now (four dice or more in most hard-played goes), and bringing a Root in is still the biggest thing a player can find.
- **It drags** in two places: a hard-played go has about four things to check and add, and once threats fall, Hard's 72 has nowhere to go.
- **It breaks** in two places: a *Deadly* telegraph at the book's price is weaker than not using it, and a GM who piles on a Root of 0 Scars Vesk and Wren in over half the fights.
- **The GM's numbers stay** (72 at Hard, a Challenge less 2), with three lines added for prompt 7.

## How it was run

- **The sim** (`tools/fight_sim.py`, its default is the fixes now, `--rules core` is 16 Nov): Bram, Vesk, Wren and Ash against Redhand (*Armoured ×4*, *Feeds ×3*, *Relentless*), two huntsmen and three hounds, 2,000 fights a setting, played plain (roll your Root and your weapon) and hard (bring Roots in, Aura on awakenings, ties, the archetypes). The GM spreads it (Even, 48), piles it on whoever's hurting (Hard, 72) or piles it on the weakest Root anywhere (cruel).
- **What they carry** (my call, on the plan's prices, since prompt 2's crew isn't written yet): Bram's Named plate (armour, Body, tier 3), a Trusty shield (guard, tier 2) and his war hammer (weapon, tier 2, attuned). Vesk's Trusty worn leathers (armour, Body, tier 2), a Trusty knife and her grappling line (tool, tier 2, attuned). Wren's Named longbow (weapon, tier 3, attuned) and her hooded cloak (guard, tier 2). Ash's ember stone (tool, tier 2, attuned), which fits every roll she throws fire with. An attuned thing comes at tier 2.
- **Minutes** now cost by what's in a go: about 33 seconds to say it and hear what happened, 9 a die, 6 a thing checked or paid, and the landing by Roots rolled, telegraphs met and hits paid. It's set so 16 Nov's fights come out about as long as the old flat guess, so the two compare. The old model charged a 4-die go the same as a 1-die go, which hid what items cost. A phone does the sums, so its per-die part is 70%.
- **Fixed in the sim along the way:** the hard GM's third die of every three was landing on Body too, so it never reached a Mind or a Soul, and a deadly telegraph cost its steps once instead of once a hit.

## The numbers

Hard (72), Redhand *Armoured ×4*, *Feeds ×3*, on paper.

| | 16 Nov, plain | 17 Nov, plain | 16 Nov, hard | 17 Nov, hard |
| --- | --- | --- | --- | --- |
| Rounds | 5.8 | 5.1 | 4.1 | 3.8 |
| Minutes (on phones) | 56 (52) | 52 (48) | 45 (40) | 42 (38) |
| Minutes a round | 9.8 | 10.3 | 11.0 | 11.2 |
| Wins a round | 2.6 | 2.9 | 3.7 | 4.0 |
| A go: steps, dice | 11.3, 2.3 | 13.6, 2.9 | 17.2, 3.6 | 19.0, 3.9 |
| Goes of 3+ dice, 4+ dice | 30%, 0% | 94%, 0% | 71%, 69% | 71%, 69% |
| Things checked or paid a go | 0.6 | 1.6 | 3.0 | 3.8 |
| Someone Bloodied (median round) | 91% (3) | 79% (3) | 25% (4) | 14% (4) |
| A Scar | 55% | 31% | 8% | 4% |

## Where it holds

1. **45 minutes.** Items add a tenth to the crew's wins, and the bigger rolls take longer, so a round's half a minute longer and the fight's 3 or 4 minutes shorter: 52 played plain, 42 hard, 47 between them. Today's budgets still land on 45.
2. **A fistful of dice.** A plain go's three dice now (2.3 on 16 Nov), and a hard one's four or more in 69% of goes. Bram's swing is a d12, a d12 and a d10, Ash's fire with her Mind brought in is a d4 and three d12s.
3. **The clever fit survives.** Bringing a Root in is still the biggest piece of a hard roll: Wren's Mind is 8 steps against her bow's 3, Ash's Mind 5 against her stone's 2, Bram's Mind 3 against his hammer's 2. One item a roll keeps the item to one check, so it never crowds the fit out.
4. **Soak back every scene.** Inside one fight it's what 16 Nov's boxes were (Bram soaks about 4 a fight either way). Across two Hard fights in a row, it's the difference between a Scar in 91% and 52% of fights played plain (21% and 5% hard), because 16 Nov's boxes stayed ticked. Everything else is back by then: the end of a scene's rest gives a Root about its whole number, so they walk into the second fight 0.2 to 1.1 points down, and only wounds carry (22% to 45% of them wounded). Armour's the one thing that wouldn't come back without it. Keep it.
5. **Vessels.** No farming. A tier 2 vessel on each of Bram, Wren and Ash, filled only with Aura they'd lose, spends 8 charge a fight between them, about 1.5 steps a roll, and the fight's 3.8 rounds to 3.7. Topped up with points from a Root they're not fighting with, it's 14.6 charge and 3.5 rounds, and a tier 6 vessel topped up is 18.6 and 3.4. A point into a vessel is 2 steps on an awakening, which is less than the same point bringing a whole Root in, so it never beats the fit either.
6. **Tiers.** Every weapon at tier 3 takes about 3 minutes off a fight played plain and 1 or 2 off hard, and tier 4 about 6 and 4. Tier 3 at the start is fine, and so's tier 4 for money.
7. **The Guardian.** Bram intercepting for everyone means hard play Bloodies someone in only 14% of fights, and it's always him. When he can only get in front of one friend (`--reach 1`, the way the table usually stands), it's 52%, median round 3, mostly Wren. That's your target, so it holds as long as the GM aims past him (below).

## Where it drags

1. **A hard go's got about four things to add.** Root, item, an awakening or two, 2 a go of Aura, and maybe a Root brought in: Bram's swing is 9, 2, 2, 2 and 2 for 17, five numbers on paper. 16 Nov had one fewer.
   **Fix:** write an attuned item's steps as one number with its awakenings on the sheet and the roll card: *his war hammer, 4 steps (6 knocking them down)*, and the Root line with its weapon in, *Body 9, with the hammer 13*. That's prompts 5 and 6, and it saves an add on every swing.
2. **Hard's 72 has nowhere to go.** One die at each of the crew from each threat, and a threat's cap, run out before the budget does: six threats placed 49 in round 1 of the walk, and three placed 40 in round 2. The book says spend the rest on the scene, which is more saying every round.
   **Fix:** a line in Running the Game: the round budget's what you can spend, not what you must. Once the threats can't reach it, let it go, or put one or two big dice on the scene clock.
3. **A round's 10 or 11 minutes at Hard**, so 45 minutes is four rounds, and the first Bloodied in round 3 or 4 is the last round or two. That's what the book says (four or five rounds), so it's a drag to know about rather than to fix. Saying the telegraphs is a third of it (about ten dice and the stakes' at 15 seconds each).
4. **Growing crews.** Four picks in, a hard round's 15 minutes, a go's five or six dice, and 45 minutes is three rounds. Holding 45 minutes there needs Redhand's multipliers about where they started (×0.8 to ×1.1), where the threat budget's rule would make them half again, and the first Bloodied gets rare (1% to 22%).
   **Fix:** till it's been to the table, keep multipliers as written as the crew grows and let the round budget grow with the threat budget. Watch the first Bloodied at the table.

## Where it breaks

1. **A *Deadly* telegraph is a trap at the book's price.** It costs its steps once a hit, so a d12 at 2 hits is 12 steps, the same as two d12s. Two dice need two of the crew's dice to stop them, though, and one big one needs one. Played plain, Redhand at 2 hits a die Bloodies someone in 38% of fights instead of 79%, and at 3 hits in 12%. He gets less dangerous the deadlier he's written.
   **Fix:** a deadly telegraph costs its steps, and half again for each hit past the first, so a d12 at 2 hits is 9 and at 3 hits is 12. At 2 hits that's a little under plain dice (63% Bloodied played plain against 79%, 13% hard against 14%), and at 3 about even (59% and 20%). Costing it once makes it a different game: 3 hits Scars someone in 62% of fights played plain.
2. **A Root of 0 under a GM who piles on.** Vesk's and Wren's Soul is 0, so its defence is a d2, the first hit wounds it, and every hit after that is 2 points somewhere else. A GM who puts the rest of Hard's 72 on the weakest Root anywhere Scars Vesk and Wren in 55% of fights each played hard and 90% plain, and every one of those fights has a wound in it, in round 1 at the median. Ash's Body would go the same way, but Bram's always in front of it.
   **Fix:** a GM line: one die a round at a Root of 0, unless the story's turned on them. And two answers players already have, which the book should point at: Defend with a Root that fits (Vesk steadies her nerve with her Mind against a curse), and 2 for 1 onto armour, which soak makes free once a scene (Vesk's leathers in the walk-through). Whether any of the four should put a point there is still yours from 16 Nov.

## For prompt 7: the GM's numbers

- **Round budget:** keep three quarters of the threat budget (48), Hard half again (72), a breather half (24). Add that it's a most, not a must, once the threats can't reach the crew.
- **Threat budget:** keep the crew's Roots added up (64).
- **Multipliers:** keep a Challenge less 2. Redhand's *Armoured ×4*, *Feeds ×3* is 52 minutes played plain and 42 hard.
- **As the crew grows:** keep multipliers as written and let the round budget grow, in place of multiplying them by the threat budget over 64, till the table says otherwise.
- **Deadly:** its steps, and half again for each hit past the first.
- **At Hard:** the first die at each Body, then two or three more at whoever's hurting most and out of the Guardian's reach. One die a round at a Root of 0. The fight runs about 45 minutes, about four rounds of 10 or 11 minutes, and the first Bloodied lands in round 3 or 4 in about half of them.

## Fixes 1 to 4: too strong, too weak

- **Soak back every scene:** right (Where it holds, 4).
- **Tier 3 at the start:** right (Where it holds, 6).
- **Guards:** a touch weak but fine. Taking every guard away moves the first Bloodied from 79% to 83% played plain and 14% to 17% hard. It's 2 steps on one roll a round.
- **Vessel sizes:** right, even at tier 6 (Where it holds, 5). The lever that matters is topping up with points, and it's priced fairly.
- **One item a roll:** right. It's what keeps an item one check.
- **Toll:** none of these four heals, so the sim doesn't touch it. In the walk-through a Healer's *Good Hands* makes the heal on 1 Toll whole, so Toll only bites from a second heal on the same person in a scene.

## The walk-through

Real dice, rolled in order with the choices made before each roll. The fight's first try at round 2 ended it before anything landed (Redhand rolled 5 and then 2 for his rounds, and three of the crew's dice took his last three tags), which happens: a hard-played crew ends him in two rounds in a fair few fights. The second try's below.

### The scene

The Vane hunting lodge, at night, Hard (72). Redhand (Challenge 6, d12: *Armoured ×4 (first)*, *Relentless*, *Feeds ×3*, and his weak point), two huntsmen (Named, Challenge 4, d8, two tags each) and three hounds (Mooks, Challenge 3, d6). The ledger's in a strongbox, and the scene clock's *The pack answers*, a d8.

- **Bram:** Body 9 · Mind 3 · Soul 4, holding Body 7. Named plate (soak 3), Trusty shield (guard 2), war hammer (tier 2, *Ring the bell* and *Knock them flat*).
- **Vesk:** Body 11 · Mind 5 · Soul 0, holding Body 10. Trusty leathers (soak 2), Trusty knife (tier 2).
- **Wren:** Body 8 · Mind 8 · Soul 0, holding Body 6. Named longbow (tier 3, *Long shot*), hooded cloak (guard 2). 1 Toll from the docks.
- **Ash:** Body 0 · Mind 5 · Soul 11, holding Soul 10. Ember stone (tier 2, *Fire without a word*), and for this walk a Trusty lantern (vessel, tier 2).

### Round 1

**Telegraphs** (49 of 72, since every threat's aimed its one die at each of the crew it can reach): Redhand's axe, a d12 at Bram's Body. His *Reach*, a d12 at Vesk's Body to pin her. His roar, a d12 at Wren's Mind. Huntsman A, a d8 at Wren's Body and a d8 at Bram's Mind. Huntsman B, a d8 at Ash's Body. A hound a d6 each at Bram's, Vesk's and Ash's Body. The wolf's stare, a d8 at Vesk's Soul. The wolf's howl, a d12 at the clock.

**Bram** swings at Redhand: Body 9, the hammer 2, *Ring the bell* 2, *Knock them flat* 2, and 1 Aura on *Ring the bell* for 2 more. That's 17, a d12, a d12 and a d10, one to answer the axe and two at the armour. He rolls 9, 7 and 5. The axe rolls 6, so it's stopped. Redhand's roll for the round is 5, so the 7 takes *Armoured* to ×3 and he's *Prone* at a d12, and the 5 ties, so Bram pays 1 Aura and it's ×2. Three wins: 5 Aura, less 2, plus 3, is 6, and back to 5 at the end of his go.

**Vesk** goes with her knife: Body 11 and the knife 2, 13, a d12 at the pin, a d10 at a hound and a d4 at the hound's d6 at her. 3, 9 and 3 against 2, 1 and 2: the pin's stopped, the hound falls (and its die at Bram goes with it), and the other hound's bite is stopped. 3 Aura, and 3 lost at the end of her go.

**Wren** marks Redhand: Body 8, the longbow 3, *Long shot* 2, and 1 Aura for 2 more, 15, a d12, a d12 and a d6. 7, 12 and 4. The 7 beats his 5, so he's *Marked* at a d12. The 12 stops Huntsman A's d8 (5), a top face as well. The d6 misses A's 6.

**Ash** throws fire. Her Soul 11, the stone 2, *Fire without a word* 2, and she brings her Mind in on *feel every flame in a room*, paying a point of Mind (5 to 4) rather than 3 Aura. That's 20: a d4 for the burst and three d12s, plus the Mark's d12. The burst rolls 4, a top face, and she drops it on the door, where both huntsmen and two hounds are. The fire's d12 rolls 3: both hounds (2) fall, it ties Huntsman B's 3, so she pays 1 Aura and he loses a tag, and it misses A's 6. Her d12 at Redhand rolls 9 (*Armoured ×1*), the Mark's d12 rolls 9 (*Armoured*'s gone), and her last d12 rolls 1. Wren gets 2 Aura from *Good Hunting* and she's full, so it goes to Ash. Ash is on 9, 4 past her 5, so 2 go in the lantern and 2 are lost.

**When it lands.** Bram intercepts B's d8 at Ash's Body, free, and it rolls 4. His Body's 9 and the shield's 2 on a roll avoiding a blow, so it's 11, a d12 and a d10 instead of a d12 and a d6. 5 and 7, so it's stopped. The roar rolls 12 against Wren's Mind, a d12 and a d4 (9, 4), so it's a hit: Mind 8 to 7. Huntsman A's jeer at Bram's Mind rolls 2 against his d6's 1: Mind 3 to 2. The stare at Vesk's Soul rolls 2 against her d2's 1, and her Soul's 0. She can take the wound (*Hollow*), or 2 for 1 on her Body or her Mind. She takes it on her Body, and her leathers soak both points, so it costs her nothing that won't be back at the scene's end. Nobody answered the howl (12), so the clock goes down a size to a d6, and down again to a d4 at the end of the round.

### Round 2

**Telegraphs** (40 of 72, three threats left): the axe at Bram, *Reach* at Vesk, the roar at Wren's Mind, A at Ash's Body, B at Wren's Body, the wolf's curse at Vesk's Soul, the stare at Wren's Soul, and the howl at the clock. Redhand rolls 9 for the round, A 1, B 4.

**Wren** says a Resource: *"As it happens, I've got a coil of rope."* She ticks 1 of 3 and lashes the lodge doors shut. Her bow doesn't fit, and a Resource is never steps, so it's her Body, 8, a d12 and a d4: 9 against the clock's 4 (back up to a d6), and 4 against B's 4 at her Body, a tie she wins and a top face.

**Ash** spends the lantern's 2 charge on *Fire without a word* (4 steps) and brings her Mind in for 3 Aura (5 to 2): 24 steps, a d4 burst, three d12s and a d8, plus the Mark's d10. The burst rolls 1, right on the huntsmen. The fire rolls 6: A (1) loses a tag and B (4) falls. Her other dice roll 4, 5 and 1 against Redhand's 9, and the Mark's d10 rolls 6. Twenty-four steps, one win: that's a d12 boss rolling 9.

**Bram** swings again, 17: 5, 10 and 3, and the Mark's 1. The 10 beats 9, and Redhand's *Prone*, so a hammer win ticks two: *Feeds ×3* to ×1, and he's *Prone* again at a d12.

**Vesk** goes at A with a d12, a d12 and a d2: 1 (a tie, his), 12 (he falls, a top face) and 2 at *Relentless* (a top face, no win).

**When it lands.** The axe rolls 8 at Bram, and his 11 steps roll 7 and 10, stopped. *Reach* rolls 3 at Vesk, and her Body's d12 and d10 roll 4 and 9, stopped. The roar rolls 9 at Wren's Mind against 2 and 4: Mind 7 to 6. The curse rolls 3 at Vesk's Soul against her d2's 2. Her leathers are spent, so she takes the wound this time: **Hollow**. The next hit at her Soul's a Scar unless she takes it 2 for 1. The stare rolls 6 at Wren's Soul against her d2's 1, and she takes it 2 for 1 on her Body (the cloak's a guard, not armour): 6 to 4. The howl rolls 7 and nobody answered it, so the clock's down to a d4.

### Round 3, and the end of the scene

Ash's *I Know a Guy* brings in the Red Company's field surgeon, free, once a scene, and the GM plays her: a Healer, Mind 7, *Good Hands*. She heals Wren, unsplit, a d12 and a d2: 5 and 2, 7. Wren's got 1 Toll, which would take 5 off, but *Good Hands* ignores a step, so it's whole. Body 4 to 6 and Mind 6 to 8, both full, and the last 3 are lost. She's on 2 Toll, so the next heal this scene loses 5 even from the surgeon. Redhand's down to *Relentless* and *Feeds ×1*, *Prone* and *Marked*, and he falls in round 3.

At the scene's end Bram's Mind (2 of 3) rolls a d6 and gets 5, so it's back to 3, and Ash's (4 of 5) rolls a d10 and gets 7, back to 5. Vesk's Soul is 0 and *Hollow*, so there's nothing to roll and the wound stays till downtime or a story moment. Vesk's leathers are back to 2. Ash's leftover Aura fills the lantern. Everyone's Aura is 5, and Wren's Toll drops to 1.

### A scene that isn't a fight

The Vane townhouse at dawn, a breather (24). The steward (Named, Challenge 4, d8: *Loyal to Vane*, *Afraid*, and hidden, *Owes the Red Company*) has the ledger. Scene clock: *The watch arrives*, a d8.

- **Round 1** (11 of 24): *"Prove you're not Vane's people,"* a d8 at Ash's Mind. The guard's *"Empty your pockets,"* a d6 at Vesk's Mind. The steward reaching for the bell, a d8 at the ledger. He rolls 4. Vesk says a Resource, *"As it happens, I've got a purse of gold,"* and slips it to the guard, answering his d6 with her Mind, a d10: 3 against 5. A lost answer lands then and there, Mind 5 to 4, and the purse is gone. Bram studies the steward, Mind 3, a d6: 2, nothing. Wren watches the street for the watch, Mind 8: 4 and 1 against the clock's 5, so it drops to a d6. Ash puts her Soul on the steward as influence, a d12 and a d10 held. Her ember stone doesn't fit talking, so there's no item. When the bell lands (7), her influence rolls 2 and 1, and it rings: the ledger gets *The household's awake* in the way. The question at her Mind rolls 2 against her d10's 10, stopped and a top face.
- **Round 2:** he rolls 8. Bram studies again, bringing his Soul in on *bark an order that gets obeyed* for a point of Soul, 7 steps: 4 and 1, nothing. Wren's 7 beats the clock's 6, back up to a d8. Vesk talks the maid back to bed, Mind 5: 8 against 8, so she pays 1 Aura for the tie and *The household's awake* goes. Ash goes at *Loyal to Vane*, Soul 11: 8 and 6, a tie bought for 1 Aura, and it's gone. Both questions at Bram and Ash are stopped.
- **Round 3:** he rolls 8 again. Ash brings her Mind in on *know the old courts' history* for a point (she knows the Company's old contract): 16 steps, a d12, a d12 and a d8, 4, 10 and 2. The 10 takes *Afraid*, his last reason to say no, and he hands it over. The hidden tag never came out, and the clock's on a d8.

The social scene runs on the same loop with nothing new to learn: no items fit, a Resource is the thing that does something, and every roll was one or two decisions.

### What each roll took

| The roll | Decisions | On paper | On a phone |
| --- | --- | --- | --- |
| Bram's swing, 17 steps | 7: his Root, the hammer, each awakening, Aura on one, three intents, the tie | 5 numbers added, steps into dice, 3 compared, Aura moved 4 times | Taps for the hammer, both awakenings and the Aura. The split and the tie are his |
| Ash's fire, 20 steps and the Mark | 9: her Root, the stone, the awakening, Mind and which permission, a point or 3 Aura, which die's the burst, where it goes, two intents, the tie | 4 added, steps into dice, 6 compared, Aura moved 7 times, the lantern | The roll card adds and counts. The burst and who's in it are hers and the GM's |
| Bram's landing | 4: intercept, the shield, how 11 splits, Push or not | 2 added, steps into dice, 1 compared | The same, and When it lands matches the dice |
| Vesk's curse at Soul 0 | 1, three ways: the wound, 2 for 1 on her leathers, or on her Mind | Soak 2 to 0 | When it lands offers all three |
| Wren's rope | 3: say it, does the bow fit (no), the split | Steps into dice, 2 compared | Tick a Resource |
| Vesk's purse, at the townhouse | 2: say it, the answer | 1 compared | Tick a Resource |

Every one fits a quick table bar the two big rolls, and those are the fistfuls you asked for. What slows them on paper is the adding (five numbers for Bram), which the sheet can do once instead of every swing (Where it drags, 1). On a phone it's taps, so the time's in the decisions, and those are the game.
