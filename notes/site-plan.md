# The site's shape (15 Nov 2026)

Mo's ask on 15 Nov: rework the home page so it's about the character, change the layout and orientation so the site works better, actually test it, and suggest how the whole site should be laid out and work. It builds on his 1 Nov calls (Learn, Rules, Characters and Campaigns along the top with search, What's changed under Rules, signed-in players landing on their characters and games, guest seats yes, a roll log not yet) and his 8 Nov ask (the home screen introducing character creation first, with the book a tab along the top). The 8 Nov home options are on `look/2026-11-09` (`notes/look-options/`), and this is Home 1 from there, built on stacking.

## The test

`tests/check-journeys.mjs` plays the site on a phone (390 by 844) the way people come to it, from the home page: someone new with nothing on the phone, and Sam, back and signed in, with Vesk and Bram on the phone, playing Vesk in Tuesday Lair and running Thursday Lair. For each job it finds its way by what's on the screen, counts the taps and how far down each one was, and reads the home page's words against `tools/check_terms.py`'s retired words. `ZI_DIST=<folder>` plays another build, so main and a branch can be put side by side.

| Job, from the home page | Live site (main, 14 Nov) | This branch |
| --- | --- | --- |
| Make a character | 2 taps, Build a character 170px down Characters | 1 tap, on the first screen |
| Play one of the crew tonight | 3 taps, Play Vesk 772px down Characters | 2 taps, her card 456px down the home page |
| Learn how to play | 2 taps (only the footer had Learn, 5,057px down) | 1 tap, the top bar |
| Find out how to start a campaign | can't be done signed out | 1 tap, the top bar |
| Read the rules, search them | 1 tap each | 1 tap each |
| See what's changed | 1 tap | 2 taps, Rules then What's changed (Mo's pick) |
| Back: open my character | 2 taps | 1 tap, on the first screen |
| Back: open the campaign I play in, or run | 2 taps each | 1 tap each, on the first screen |
| Back: make another character | 2 taps, 944px down Characters | 1 tap, on the first screen |
| Back: roll some dice | 2 taps, 737px down Characters | the same |

What else it found on the live site:
- The home page taught the rules from before Roots: set actions, "1 step for the action", Fight 5 and Fight 4 and Isolde's Defend at a d2. Nothing checked the home page's words, so it fell behind twice (8 Nov and 14 Nov). The check does now.
- It was the same page for everyone. Someone back had to go through Characters every time.
- Its first screen pitched the telegraph and offered Read the rules. Playing one of the crew went to cards you couldn't tap.
- Someone signed out couldn't find campaigns at all: the Characters page leaves them out till you're signed in.
- The Characters page is 5,081px long on a phone for someone back. Their own characters start 883px down, under Campaigns, and the crew's cards are the last 3,100px.

## What's built (`site/home-character-first`, live 15 Nov)

- **The home page** (`src/pages/index.astro`, `src/home/home.js`, `src/styles/home.css`). Someone new gets Make your character first: Start building (the guided builder), then Play one of the crew, Random in one tap and A blank sheet, then New here? (the learning round and the Learn deck), the crew as cards you tap to play (crest, Title, archetypes and Roots), How a round goes (the book's own round, Wren and Bram answering the brute's club, drawn with the kit), Play together and the rules. Someone back (a character on the phone, or signed in) gets Your characters (crest, Title and the campaign each plays in) and Your games first, read off the phone so it works with no signal, with Make a new character between them. The head's script decides before anything paints.
- **The top bar** (`src/layouts/Base.astro`): Learn, Rules, Characters and Campaigns, with search a button beside the light switch. What's changed is under Rules (the Rules page's button, and the home page's New line). On a phone the four tabs get their own row.
- **Campaigns, a page of its own** (`/characters/?camps`, `page()` in `campaigns.js`): what a campaign is, and every campaign you're in with Start a campaign, or how to sign in to start or join one. A campaign opened from it goes Back to it.
- **Ways in from the home page** (the bottom of `app.js`): `/characters/?play=vesk` opens Play Vesk's name card over the list, and `?way=random` and `?way=blank` start a build, asking for a second tap first if there's a draft on the go, the same as on the list. The address goes back to the list first, so a reload or Back doesn't do it again.

## The shape from here

The top bar says it now: the site's two halves are the book (Learn, Rules) and the table (Characters, Campaigns), and each tab has one job.

- **Home:** who you are. New: make a character. Back: your characters and games.
- **Learn:** learning the game, the deck and the learning round.
- **Rules:** looking things up, with search, What's changed and the paper sheets.
- **Characters:** yours, making one, and the dice roller.
- **Campaigns:** your games, starting one and getting into one, and the GM's tools inside each.

Each stage below is a chat of its own, smallest first, and each one's tested by `tests/check-journeys.mjs` as well as the usual checks.

1. **Characters, just yours.** Your characters first, as the home page draws them, then Make your own with its four ways, then the dice roller. The learning round goes to Learn and the crew to a strip under Make your own (their full cards stay on the home page), and the Campaigns section comes off the list, since Campaigns has its own page. Aim: your own characters on the first screen and the page under two screens long.
2. **Getting into a game at the table.** Join with the code off the GM's phone typed in on Campaigns, as well as by link, and guest seats (Mo's 1 Nov yes): join with just a name on that phone, nudged to sign in after the session.
3. **Back in the game from anywhere.** When a round's on in one of your campaigns, a bar under the top bar on every page (Tuesday Lair's live, round 3, Open), Sign in or your initial in the top bar, and the site installable from the phone's browser to its home screen (a web app manifest and icons), opening full screen on the home page with no signal needed. It's still the website, not an app store app.
4. **Learn as the place to start.** The Learn tab opens on a choice of the learning round or the deck, and the deck's last card hands you to Make your character.
5. **A GM's way in.** Run your first game as a page of steps (a Do page, `diataxis-pages`) off Campaigns and Running the Game: start a campaign, send the link, put the table screen up, and your first telegraphs.

## Going live

Mo said yes on 15 Nov and picked stage 1, Characters just yours, to build next. The home page's crew cards and Vesk's sheet read the crew straight off the chapter, so they follow the rules. The words round them are the home page's own, so `tests/check-journeys.mjs` checks them against the retired words every run.
