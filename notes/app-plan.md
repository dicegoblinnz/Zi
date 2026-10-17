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
- Defend's match gives the lowest blow the lowest roll that stops it, so the most get stopped. When two blows come up the same, the first one added gets the smallest roll that stops it, and a swap changes that.
- The Mark die sits behind "Is it Marked?", since it comes up less than the threat's die, and "Its number this round" takes the GM's number.
- Rules on tap: Aura, Resolve, Confidence, Armour, Hurt and conditions open their buttons with the rule under them, a permission opens how permissions stack, and the Rules tab holds the rules a round needs and the conditions list. The build reads each one's opening off the chapters, up to its first example, table or subheading, rule boxes included.
- **Stage 4.** The Sigil dice are the hex dice with a darker rim round a lit face, gold for yours and violet for theirs. They tumble for about half a second and land one after another, the threat's die first, about a second in all, and a tap skips it. With reduce-motion on they show their numbers at once, and nothing else moves either.
- Sound and buzz share one switch, Sound, at the top of a character and the learning round. It's off until it's turned on, and the phone remembers it. A landing gets a knock, a top face a chime and a buzz, a Hurt a thud and a buzz, and a Hurt that fills a bar a heavier one. The sounds are made on the phone, so they work offline.
- The roll card turns over when it moves on, the tabs slide the way they go, the dialog rises into place, and Aura and Resolve pips and Hurt boxes glow as they fill. Anything that fills behind the roll card glows when the card closes.
- The learning round is Learn to play on the Characters page (`/characters/?learn`), four steps: the club's telegraph and Isolde's Armour against it, Wren's Fight and then Bram's as a combo, the roll (in the app or real dice), and the end of the round. It reads Isolde's Armour and Hurt track and Wren's and Bram's Fight off their sheets, uses the book's d8 for the club, and saves nothing.
- In the round, Wren rolls the lot, so a top face's Aura is hers, or a friend's in the scene if she's full. A tie offers 1 Aura or letting it land, and a loss lands on Isolde as a Hurt ("say she calls it a Hurt", since the GM names what a blow costs).
- The Rules tab now starts with The round: The Round, Telegraphs and Answering a Telegraph.
- **Stage 5.** Downtime is a card from the Downtime button on the play screen, which replaces After downtime. Each of the two slots is picked from Downtime's list (deal with a pressure, heal a Catch, Armour back to full, mend something, tend the crew, a new permission, a new trait, chase your Aspiration, deepen a bond, get something, attune, or toward a party action), and swapping a permission or mending a strained thread doesn't take one. Finishing puts it all on the sheet, then it's a new scene with Resolve full, as one change with one undo. An empty or unfinished slot asks for a second tap.
- A choice only shows when it can happen: Heal a Catch needs one on the Hurt track, Armour needs to be down, Mend needs something crossed out, Tend the crew needs the trait, and a Title takes up to six permissions.
- What downtime grows is kept as a list on the character, on top of the sheet the rules give them, so the crew still read off the chapter and a rule change still reaches them.
- Chasing your Aspiration is 1 step for the slot and one for every line that fits, against its die, in the app or real dice. Your best die counts, ties go to the Aspiration, and there's no Aura. A tie can be bought by stepping the crew's Wealth down (the phone says to, since the party sheet waits for sign-in), and 1 Resolve rerolls your dice only. Past d12 the card asks for the new archetype, the Title's name, its permission and the set actions each one fits, and Resolve goes up by one.
- Attuning follows the stages table: past a stage's first permissions it needs its Catch (Awakened), its Burden (Tempered) or both (Perfected), written in right there, and a thing goes up a stage whenever the player says it's got its material. At Tempered the Catch becomes the Burden, so it leaves the sheet, and Perfected asks for a Catch again. A Burden's written on the thing (and in Notes on paper), and what it changes is played at the table for now.
- A new trait from the list changes the numbers the way the builder counts it. A swap starts with the new permission on the old one's set actions. Get something goes where there's room. A party slot is noted and played at the table.
- The second slot builds on the first: it counts a permission the first put on the same Title or thing, a stage it went up and a Catch or Burden it wrote, and a second roll at the Aspiration goes against the die the first leaves (so it waits for it). Resolve for rerolls counts across both.
- The card keeps what's picked until it's finished, so closing it loses nothing, but a reload does.
- **Gold marks.** Each character keeps what every line on its sheet said when the phone last saw it. A line that's different now gets a gold mark, and a tap shows old and new. A set action or a tracker gets a gold corner instead, and its card or panel shows old and new. A note at the top counts them, lists them all and names anything gone, and Got it clears them (with an undo).
- A typo fix stays quiet: the same words with only the case, the punctuation or an accent changed, a word split or joined, *a* for *an*, or up to two words a letter out (two in a long word, and only two letters swapped in a short one). A changed number or sign, a word like *not*, *more* or *twice*, or *noticed* for *unnoticed* always gets a mark. What the player changes themselves, in downtime or the builder, never does, and what they grew keeps its own place, so a rule that adds a line before it can't make it look changed.
- A character saved before the marks starts its list the first time it opens, unless its crew sheet changed before then, and that gets the old note once.
- The Sheet tab now starts with the set actions and the lines on each, so a downtime's new line shows where it went. The Rules tab and the card have Your Slots and Rolling in downtime.
- **Stage 6.** Signing in is the Account page (`/account/`), linked from the footer and the Characters list. An invite is a link (`/account/?invite=…`) that makes one account and runs out after two weeks, with a note saying who it's for. Mo's account needs no invite: his address is the `ADMIN_EMAIL` secret, checked by Google or Discord. He makes anyone a GM from People, and a GM can hand out invites. A GM's invite isn't tied to a campaign yet, since there aren't any.
- A second way in (Discord after Google, say) joins the same account only when both say the email's been checked. Otherwise it's a new account, and that needs an invite.
- After signing in, the Account page and the Characters list offer one tap to move whatever's only on this phone into the account. Signed in, a new character goes straight in. A change goes up a moment later, and other phones get it when the page opens, comes back into view or gets its signal back. When two phones changed the same character, the one saved last wins, and deleting one deletes it everywhere.
- Signing out sends what's waiting, then takes the account's characters off that phone and leaves the phone's own. A session lasts a month and keeps going with use. If it runs out, the characters stay and catch up at the next sign-in.
- An account keeps a name and an email. No picture (the site fetches nothing from elsewhere), no Google or Discord tokens, and sessions don't keep where they came from. Download my data and Delete my account are on the Account page, and deleting needs a sign-in in the last day.
- Turnstile isn't on the invite check yet: it fetches from outside the site and needs its own keys, the codes are 22 random characters, and the check allows 10 tries in 15 minutes. It can come with the emailed code, where it matters most.
- Better Auth 1.7 talks to D1 itself, so there's no Drizzle. The tables are `migrations/0001_accounts.sql`, applied by `npm run deploy` and `npm run deploy:preview`.

## Confirmed with the plan

Companion calls 9, 10 and 11 (`notes/companion-plan.md`) and the sheet's calls (`notes/sheets-plan.md`) stay as they are.

## The stages

Every stage passes `tests/check-site.mjs` and `tests/check-companion.mjs`, works offline, in both themes, from 320 wide up, and ends with one independent check. "Uses" compares each stage with the companion's first version.

1. **The guided builder.** Built 17 Oct on the `app` branch. Players make their own on the phone: two archetypes and Titles, two traits, permissions with the quick test, set actions that add up, what they carry, attuned things, threads, crew answers and an Aspiration. Saved on the phone, offline, and it plays in today's companion like the crew. Builds on the crew data, `dice.js` and `store.js`. Uses about two-thirds. Checked by building a character with fixed picks, its set actions against `dice.js`, a reload, offline and a roll.
2. **Print, and the other ways in.** Built 17 Oct on the `app` branch. A filled two-page sheet from any character, plus blank, from the crew and random. Builds on stage 1. Uses about a third. Checked by filling Vesk's PDF and a built character's, and a random one that passes the builder's warnings.
3. **The play screen and the roll.** Built 17 Oct on the `app` branch. The one-handed play screen, the roll card that counts as you tap with Aura lines in gold, the threat's die, tapped-in real dice, intents, counting with undo, Defend with a swap, and rules on tap. Builds on stages 1 and 2. Uses about half. Checked by Vesk at the table, extended: a threat's die, a tap-in, a swap and an undo of Hurt.
4. **Dice, feel and learning.** Built 17 Oct on the `app` branch. The Sigil dice, the motion, sound and buzz, and the learn-to-play round with Isolde, Wren and Bram. Builds on stage 3. Uses about half. Checked by the round played start to finish, and reduce-motion.
5. **Downtime and rule changes.** Built 18 Oct on the `app` branch. Downtime slots on the phone, and the gold marks. Builds on stage 1. Uses about a third. Checked by a downtime for Vesk and a made-up rule change against a saved character.
6. **Sign-in.** Built 18 Oct on the `app` branch, waiting on Mo's set-up (`notes/sign-in-setup.md`). Google and Discord, invites from Mo and his GMs, and phone characters moving into the account. Uses about two-thirds. Checked by an invite, a sign-in, a move and a second device (`tests/check-accounts.mjs`).
7. **Sharing and the party.** Share with your GM, the party sheet and Party Goal, friends joining in and strained threads reaching every phone. Builds on stage 6. Uses about half.
8. **Telegraphs on phones.** The GM sends the round's telegraphs, each player answers on their phone, and she sees results straight away. Builds on stages 3 and 7. Uses about two-thirds.

After that, in Mo's order: the GM's live view, the table screen, prep tools, campaigns, worlds and maps.
