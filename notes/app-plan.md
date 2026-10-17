# The app plan

From the drill on 17 Oct 2026 (`notes/app-rework.md`). Mo's answers are in `notes/website-brief.md` under "The app rework". Mo said yes on 17 Oct.

## Decisions

- **Amazing at the table** means all four: it looks like a game, there's no counting, new players learn from it, and the crew plays together live.
- **Play screen first.** Big set actions and the trackers, usable one-handed. The rest of the sheet and the rules are a tab away.
- **The roll.** The phone rolls the threat's die with yours, or takes the GM's number, and calls beat, tie or under. It counts everything (Aura, Resolve, Hurt, Armour, conditions) with an undo. Real dice go in as each die's number. Each die's intent is an optional label.
- **Defend.** The app matches the rolls so the most dice get stopped, and the player can tap to swap two.
- **Dice and feel.** Sigil hex dice that spin and land with weight, and plenty of motion: cards flip, pages slide, Aura pips glow. Sound stays off until turned on, then dice landing, a top face (chime and buzz) and Hurt or a Catch get one.
- **Making your own.** The guided builder first, with info bubbles. Quick Build by default, and any step opens into the full build. Permissions come from the Title idea or your own writing, with the quick test beside them. It warns but never blocks. Blank, from the crew and random follow.
- **Print my character** comes with the builder.
- **Growing.** Downtime slots on the phone update the sheet, with an undo. When a rule changes, each changed line gets a gold mark showing old and new, and typo fixes stay quiet.
- **The party sheet and Party Goal** wait for sign-in.
- **Sign-in.** Google and Discord first. Mo and the GMs he picks hand out invites. A player shares a sheet with their GM by picking her account.
- **Live.** Telegraphs on phones are the first live piece.
- **Extras.** The learn-to-play round is in. A roll log isn't, for now.
- **Stages** stay small, each smaller than the companion's first version, so something new reaches the table every week. The guided builder goes first.

## Calls Claude made

- Portraits: the archetype's sigil now, uploads once there's sign-in, since the brief wants it to look good with no art.
- All motion follows the phone's reduce-motion setting.
- Rules on tap (tap a permission, a condition or Aura to read its rule, offline) goes in with the play screen, since players asked for it.
- On first sign-in, the characters on that phone move into the account with one tap.
- The GM's screens are made for a tablet or laptop first, and still work on a phone.
- Print fills the existing two-page PDF's fields on the phone.
- Print puts down where the character is now (Aura, Hurt and Scars, conditions, Confidence, strained threads, used kit), not a fresh copy, so a player can move to paper mid-campaign. The fields stay fillable.
- On paper, a Title on a set action is its number on the back (Title I) and an attuned thing's permission is the thing, so each row fits. Trouble, clothes that fit some scenes and any trait past the third go in Notes, since the sheet has nowhere else for them. A letter the sheet's font can't draw loses its accent (ā prints as a).
- The blank sheet, from the crew and random open with every step on one page, and any build can switch between one page and step by step.
- From the crew brings the crew member's own threads, not the ones in someone else's words, and leaves the name for the player.
- Random draws from the Title ideas, the traits and items lists, and the crew's own threads and Aspirations, makes up a name, and passes every warning. Each line goes on the set action its words lean to, and no set action starts past 5 steps, the crew's biggest.
- A way in asks for a second tap before it bins a draft of a new character, and so does Roll again over changes.
- pdf-lib only loads when someone prints, and the service worker keeps it and the blank sheet on the phone so print works offline.
- **Stage 3.** A character opens on Play, with Sheet and Rules as tabs at the bottom where a thumb reaches them. The open tab stays in the link.
- On the roll card, lines on the set action go violet when they're on, and anything brought in for Aura goes gold, with the Aura it costs in gold at the top.
- The intents to tap are hurt, pin and disarm, and frighten and taunt for a blow at your Confidence, or your own words. A blow whose intent starts with a condition's name (pin for *Pinned*) can land as that condition, on the blow's die.
- Each blow that gets through has its own buttons for what it costs, and the one you tap is counted on the sheet and written on the blow. Swapping stops once a blow's paid for, so undo first to swap again.
- Defend's match gives the lowest blow the lowest roll that stops it, so the most get stopped. When two ways stop as many, the first die added gets the bigger roll, and a swap fixes it.
- The Mark die sits behind "Is it Marked?", since it comes up less than the threat's die, and "Its number this round" takes the GM's number.
- Rules on tap: Aura, Resolve, Confidence, Armour, Hurt and conditions open their buttons with the rule under them, a permission opens how permissions stack, and the Rules tab holds the rules a round needs and the conditions list. The build reads each one's opening off the chapters, up to its first example, table or subheading, rule boxes included.

## Confirmed with the plan

Companion calls 9, 10 and 11 (`notes/companion-plan.md`) and the sheet's calls (`notes/sheets-plan.md`) stay as they are.

## The stages

Every stage passes `tests/check-site.mjs` and `tests/check-companion.mjs`, works offline, in both themes, from 320 wide up, and ends with one independent check. "Uses" compares each stage with the companion's first version.

1. **The guided builder.** Built 17 Oct on the `app` branch. Players make their own on the phone: two archetypes and Titles, two traits, permissions with the quick test, set actions that add up, what they carry, attuned things, threads, crew answers and an Aspiration. Saved on the phone, offline, and it plays in today's companion like the crew. Builds on the crew data, `dice.js` and `store.js`. Uses about two-thirds. Checked by building a character with fixed picks, its set actions against `dice.js`, a reload, offline and a roll.
2. **Print, and the other ways in.** Built 17 Oct on the `app` branch. A filled two-page sheet from any character, plus blank, from the crew and random. Builds on stage 1. Uses about a third. Checked by filling Vesk's PDF and a built character's, and a random one that passes the builder's warnings.
3. **The play screen and the roll.** Built 17 Oct on the `app` branch. The one-handed play screen, the roll card that counts as you tap with Aura lines in gold, the threat's die, tapped-in real dice, intents, counting with undo, Defend with a swap, and rules on tap. Builds on stages 1 and 2. Uses about half. Checked by Vesk at the table, extended: a threat's die, a tap-in, a swap and an undo of Hurt.
4. **Dice, feel and learning.** The Sigil dice, the motion, sound and buzz, and the learn-to-play round with Isolde, Wren and Bram. Builds on stage 3. Uses about half. Checked by the round played start to finish, and reduce-motion.
5. **Downtime and rule changes.** Downtime slots on the phone, and the gold marks. Builds on stage 1. Uses about a third. Checked by a downtime for Vesk and a made-up rule change against a saved character.
6. **Sign-in.** Google and Discord, invites from Mo and his GMs, and phone characters moving into the account. Mo sets up a Google sign-in screen and a Discord app (steps given then). Uses about two-thirds. Checked by an invite, a sign-in, a move and a second device.
7. **Sharing and the party.** Share with your GM, the party sheet and Party Goal, friends joining in and strained threads reaching every phone. Builds on stage 6. Uses about half.
8. **Telegraphs on phones.** The GM sends the round's telegraphs, each player answers on their phone, and she sees results straight away. Builds on stages 3 and 7. Uses about two-thirds.

After that, in Mo's order: the GM's live view, the table screen, prep tools, campaigns, worlds and maps.
