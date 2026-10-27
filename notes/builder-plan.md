# The world builder plan

A builder that deals a whole world, faction by faction, from tables Mo's approved, so a GM can build one alone in minutes, or play its making with the crew as session zero. It comes from the research in *Worldbuilding that feels like play* (27 Oct 2026, a doc in Mo's Claude account) and Mo's answers on 27 and 28 Oct. It goes ahead of the worlds plan's last two stages (the crew's pins and notes, and timelines and family trees), which carry on after it.

Every stage uses the prompt at the end of this plan, one stage to a chat.

## Decisions

Mo's calls (27 and 28 Oct):

- **No AI in the builder.** Nothing's generated when someone builds. Every word it shows comes from tables Mo's approved, or is typed by someone at the table. The fun's in gamified randomness and guided writing.
- **The GM picks who builds.** Alone, she builds the world and presents it to the crew. With the crew, they found it together in a session-zero game, so they're invested from day one and play in what they made.
- **The app first.** Built for the site, on phones. A paper version comes later.
- **Region, then genre.** A world's region is Town, City, Country, World or Stars. Its genre gives its seats, resources, assets, factions and names their words: Fantasy, Medieval, Renaissance, Modern, Steampunk, Cyberpunk and Futuristic, plus the ones Claude added below. Genres replace doing the Steeplands first.
- **Educated guesses, never generic.** Each step reads what's already on the board, so a river city trades and a mountain hold needs grain, and a result says why when it isn't obvious.
- **All four kinds of randomness:** pick one of three, draft from a dice pool, answer questions, and spend points like gods.
- **Tables:** Claude drafts them in Mo's voice, and nothing goes in till he's said yes.
- **Alone:** guided by default, three cards at every step, with a Deal it all tap that plays the same steps for her.
- **With the crew:** a whole session, with a short played history of two or three ages that ends with every conflict still live. Each player founds a faction and speaks for it, and the GM takes them all over when play starts.
- **Secrets** are drawn hidden, and only her phone ever sees them.
- **Every character** leaves with a friend and a foe among the factions.
- **Maps:** the faction web, a map sketched during the build, and her own picture with pins.
- **Power comes only from people who turn up** (28 Oct). Stage 1 makes it true across the book.

## Calls Claude made

For Mo to say otherwise.

- **A genre's an era and a twist** behind the scenes, so the genres Mo didn't name cost almost nothing. The eras are Ancient, Medieval, Renaissance, Industrial, Modern, Near future and Far future. The twists are Magic, Steam, Chrome, Ruin and Dread. The menu shows genres by name, and Mix your own takes any era with any twist:

| Genre | Era and twist |
| --- | --- |
| Fantasy | Medieval and Magic |
| Medieval · Renaissance · Modern | The era on its own |
| Steampunk | Industrial and Steam |
| Cyberpunk | Near future and Chrome |
| Futuristic | Far future |
| Mythic | Ancient and Magic |
| Gothic horror | Industrial and Dread |
| Urban fantasy | Modern and Magic |
| Post-apocalyptic | Modern and Ruin |
| Dark fantasy | Medieval and Dread |
| Space fantasy | Far future and Magic |

- **Each frame says its mix** (Long Haul is Far future at Stars), so Add a faction fits a frame she brought in.
- **Stars needs the Far future era** at first.
- **The sizes keep their names in the rules,** and the builder shows each region's words for them (on a Town board, Great reads as the whole town).
- **Board size:** the players plus two, at least four and at most twelve, hers to change at the start. Seats are two more than the factions, so there's always one worth fighting over.
- **In the founding,** founders start Local, and the old powers she deals are City or Great, so upstarts face old money.
- **The strife:** 3 tokens a round each. Every agenda starts at d4, Scheme pushes one a size once a round, and the strife ends with the round that takes an agenda to d10, or after 4 rounds. These are the dials to tune at the table.
- **After the founding,** what the table built in the open is shown to the crew. Secrets, the old powers' agendas and everything from her pass stay hidden.
- **Names** are dealt from each genre's lists, three at a time, or typed.
- **No builder skill.** Writing tables, below, does the job one would, so it doesn't take a slot.

## The brief

### Tables, roles and packs

- **Roles** are what every genre has in common. A seat's and a resource's role is where the keep comes from: passage, land, ground, craft, trade, belief, office, knowledge, labour, crime or wonder. An asset's role is one of Appendix B's assets, its mechanics as they stand after stage 1. A faction type's role is one of Building a Faction's twelve (a ruling house, traders, crooks, faith, office, a secret society, soldiers, makers, a family, rebels, keepers of old things, something old).
- **The core** holds everything that isn't genre: the regions, the roles, Building a Faction's tables (what it is, what it wants, how it works, its secret), the agendas, Building Your World's three region questions and its tension table, the ties between factions, the founding's questions and acts, the because lines, the checks' fallbacks and the seed words.
- **A region** says what a faction, a seat and a mini faction are at that size, the words for the four sizes, which seat role each face of a d6 picks (for the founding's dice pool), and what pressure from one size up looks like.
- **A pack** gives the roles their words for one era or one twist: seats for each region it fits, resource lines, every asset's name (and a word or two of what it does where the genre needs it), faction types, methods, Secrets, exceptions and names. A twist pack adds its own rows to the same roles, and the "how strange" dial sets how often they come up.
- Packs are YAML in `content/builder/` (`core.yaml`, `regions.yaml`, `genres.yaml`, `eras/*.yaml`, `twists/*.yaml`). `scripts/build-content.mjs` reads them into `public/builder.json`, fetched by the World screen when someone builds and kept by the service worker like `world-book.json`. The build stops on a row it can't read, a tag it doesn't know, a slot nothing fills, or a role with too few words for a region its pack says it fits.
- **Every row** has its words, its roles, the regions and sizes it fits, a weight (common rows 10, rare rows 1), and what it needs or rules out. A type row also says which roles it leans to. A Secret row can name another faction with `{rival}`, and has two ways in.

### The engine

`src/companion/world-engine.js`, pure, with no page: the same code on the phone, in the tests and in the dealing script. Given the tables, the recipe (region, era, twist), the dials, a seed and the board so far, it deals.

- **Seeded and repeatable.** A seed's three words from `core.yaml` (*ash-lantern-ford*), and the same seed and tables deal the same world. The world keeps what was dealt, never just the seed, since the tables change most weeks.
- **A shuffled bag for each table** in each world, so no two factions share a type, a method or a Secret till the bag's empty. Rare rows weigh 1 against 10, and every board gets at least one strange thing.
- **Each step reads the card so far,** in this order: seat, size, type, how it works, Want, resources, assets, agenda, Face, Secret, bonds, name. A row's weight goes up for what fits (a ford gives passage, so a toll-taker's likelier), and a row comes out for what it rules out.
- **The because** comes from templates in `core.yaml` (*because it sits on the ford*), shown only when the reason isn't obvious.
- **About one deal in six breaks the logic on purpose,** from the pack's exceptions, with its reason (*a river town that won't trade, because the last barge brought the plague*).
- **Power** comes only from people who turn up. Size picks a die in the book's range, the Power assets are dealt to reach it, and the rest are dealt so every asset has a resource paying for it, bar the needs.
- **A Face** is a name from the pack and one of the Threat Builder's threats with its tags, at the Challenge its Power sends (a d8 sends Challenge 4).
- **The web.** The factions sit round a ring. Each points a rival one seat on, an ally or a debt two on, and a wildcard three on (skipped on boards of four or five, where it wraps round). The kind of tie's dealt off the ties table and written as threads between them.
- **Need and surplus.** An asset with nothing paying for it is a need, and a spare resource is a surplus. One faction in three is dealt a need, and a faction holding what it needs gets a hostile thread across it, so the obvious trade's blocked.
- **The checks,** before anyone sees the board: every faction has a rival, one need's blocked (on boards of five and up), one Secret names another faction, no two factions hold the same asset, every agenda aims at something on the board, and there's one strange thing. Once there's a crew, one faction wants something the crew's got. Only what fails is dealt again, up to three times, then a fallback from `core.yaml` goes in.

### Building alone

On the World screen: Build the world on an empty board, and Add a faction on any board, one brought in from a frame included.

1. **Set up:** the region, the genre (or Mix your own) and how many factions.
2. **The asking:** Building Your World's three questions, each with three answers dealt off the tables or her own words, and the tension rolled. The answers set the dials: how tense, how strange, how rich and how ruled.
3. **The ground:** the seats, three cards at a time. Each seat's a place page.
4. **The factions,** each in a few screens: where it sits and its size, then what it is, how it works and its Want, then its resources and assets, then its agenda, Face, Secret and name. Every screen has three cards or a dealt set, with Lock, Deal again, Write my own, the because under each card, and Undo. Deal the rest finishes the board.
5. **The web and the checks,** then **the crew:** a friend and a foe for each character in the campaign.
6. **Done:** the factions go onto the board and the seats into the pages, hidden from the crew, and the build's kept with the world as `doc.build` (the recipe, the dials, the seed and what was dealt). A faction's seat is written on its card by name, so it links itself.

**Deal it all** plays every step by the weights in one tap, and she goes through what it dealt faction by faction, locking what she likes and dealing the rest again.

### The founding (a working name)

The crew builds the world with her, live on everyone's phone, as session zero. It's kept on the campaign's live table the way the faction turn is (`doc.found`): `src/companion/found-rules.js` is the rules both sides apply (`fd-` changes, and `foundView()`, the only part a player gets), wired into `table-rules.js`, and `src/companion/found.js` draws it on her campaign page and every player's World tab. Nothing touches the board till she hands it over.

1. **Set up** (hers): the region, the genre, how many factions, who's in, and how long, with a clock for each age.
2. **The asking** (answering questions): each player answers one of the region's questions in turn, from three dealt answers or their own words, and the tension's rolled.
3. **The ground** (drafting from a dice pool): her phone rolls a d6 for every seat. In turn, each player takes a die, and its face picks the seat's role off the region's table. They keep one of the three seats it deals, name it, and say what a stranger notices there.
4. **The founding** (pick one of three), in reverse order: each player founds a faction on a free seat. Three founding questions write its first threads: who it took the seat from (a hostile thread), who it owes (a debt), and what it'll never do (a Loyalty thread). Then three cards each for what it is, how it works and its Want, and the rest dealt at Local. Then she deals the old powers onto the seats left, at City or Great.
5. **The strife** (spending like gods): each round, every founder spends 3 tokens: claim a free seat (2), raise people who turn up (2, with a spare resource to pay for them), make a pact (1, and both say yes), start a feud (1), raid (3, Power against Power, ties to the defender), scheme (1, once a round, the agenda up a size) or found a mini faction (3). Every act touches another faction and writes a line of history, and each is one of the six outcomes, so the founding teaches the faction turn: a claim, a raise or a founding is Establish, a raid Acquire, a feud Undermine and a pact Influence. Her phone deals each old power's act off its agenda, hers to keep or change.
6. **Her pass,** on her phone alone: Secrets and the old powers' hidden parts are drawn there, never from the shared seed, then the Faces and the checks.
7. **The crew:** each player takes a friend and a foe for their character, with their own faction's ally and rival offered, and the hottest feud's named as the first job, for her to write.
8. **Hand-over:** one tap writes it into the world: the factions onto the board, the seats as place pages, and the history kept with the build and shown on the World screen as How it came to be. What the crew built in the open is shown, and everything else is hidden.

### Maps

- **The faction web** comes first: the factions round a ring on the World screen and tab, their threads drawn between them, hostile and bond, with the crew in the middle. A player sees only what they've been shown.
- **The sketch** comes later: seats placed on a blank map during the ground, with coast, river, mountain, forest and road strokes. At hand-over her phone draws it into a picture that goes up the way her pictures do, with a pin at each seat opening its page.
- **Her own picture** already takes pins to the seat pages.

### Like the rest of the site

One-handed on a phone at the table, in both themes, from 320 wide, and offline for anything already seen. Everything kept per campaign stays in it, checked on the server, and nothing crosses between campaigns. The builder runs on the phone, so building alone works with no signal and goes up when there's one.

## Writing tables

For every stage that writes or changes tables.

- Mo's voice through `zi-voice`: plain, concrete and specific, contractions, NZ spelling, and never em dashes, semicolons or exclamation marks. Names one to four words, lines up to twelve.
- Every entry earns its place: it gives someone a reason to act, a hook or a rule, never just colour.
- No two entries in a table say the same thing, no phrase repeats across a pack, and nothing's named after a real company, church, person, place or game.
- Every role has at least four words for each region its pack fits, and every type at least two for each size. The build checks it.
- Six exceptions to a pack, each breaking the logic with a reason. One Secret in three names another faction, and every Secret has two ways in a player could find.
- Historical eras get invented names with a real feel, and the modern ones everyday names from many places.
- Draft the whole pack in one go, deal at least twenty boards on `/deal/`, and fix what repeats or reads flat before Mo sees it. Then send him the link with a few lines on what's in it, change only what he names, and nothing goes to `main` till he says yes.

`/deal/` (from stage 2) shows every table and deals sample boards from the current ones, a tap at a time, for any region and genre, kept out of search and off phones like `/kit/`. It's where Mo reads and judges a pack.

## The stages

Each stage reaches Mo's playtests within a week. Table packs and the founding take turns, so there's one set of tables for him to judge at a time. A stage is marked built here, with its date, in the same merge that takes it to `main`.

1. **Power from people who turn up** (a rule). Needs nothing.
   - Change the rule all the way, as Changing a rule in CLAUDE.md says: only people who turn up add Power.
   - The eight official Power assets that aren't people (`notes/to-confirm.md` 10) are *Watchful*, *Old*, *Royal Charter*, *The Law of the Sea*, *Sprawling*, *Secretive*, *Ghost* and *Many Souls*. Where the faction plainly has the people, rewrite it as people who turn up and keep its die. Where it doesn't, make it an asset that does one thing and let the die drop.
   - Send Mo, in one message, Appendix B's assets as they'll stand and every card that changed. He's never seen the list (to-confirm 8), and every genre names its assets after it, so his cuts happen here.
2. **The engine, the core and Fantasy** (tables). Needs 1.
   - The YAML in `content/builder/`, read into `public/builder.json` with the build's checks, and the engine.
   - `scripts/deal.mjs` deals boards as text for a recipe and a seed. `tests/check-builder.mjs` deals 200 boards in every region for every named genre the packs cover, and every mix at one region: the same seed deals the same board, the checks pass with fallbacks in under 1 board in 20, no bag gives the same row twice in a board, and every step that needs a because has one.
   - The core, the five regions, and the Medieval era and Magic twist, so Fantasy and Medieval deal. The Steeplands' and Deep Company's mixes go in `genres.yaml`.
   - `/deal/`, where Mo judges them.
3. **Building alone.** Needs 2.
   - Build the world and Add a faction on the World screen, as the brief says, without the crew step: the setup, the asking, the ground, each faction's screens, the web and the checks, and Done, with Lock, Deal again, Write my own, Undo, Deal the rest and Deal it all. Genres without their packs show as coming.
   - The seats go in as place pages and the factions onto the board, all hidden, with `doc.build` checked by the Worker like the rest of the world.
   - A new part of `tests/check-accounts.mjs`: a Fantasy world built alone with the signal dropping halfway, and a faction added beside the Steeplands.
4. **The web and the crew.** Needs 3.
   - The faction web on the World screen and tab, as the brief says.
   - The crew step in building alone: a friend and a foe for each character in the campaign, written as those factions' threads toward the crew and named for the character, so standing counts them. The check for a faction that wants something the crew's got joins the rest.
5. **Renaissance** (tables), with the Gilded Court's and Brinewake's mixes. Needs 2.
6. **The founding: the room and the asking.** Needs 4.
   - `doc.found` on the live table, as the brief says: she sets it up from her campaign page and opens it, players join from their World tab, turns go round, each age has its clock, and every phone stays in step, with a poor signal handled the way telegraphs handle it. Then the asking, with the dials set and the tension rolled.
   - A new part of `tests/check-accounts.mjs` plays it on three phones.
7. **Industrial and Steam** (tables), so Steampunk deals. Needs 2.
8. **The founding: the ground and the founding.** Needs 6.
   - The dice pool for the seats, then the founding in reverse order with its questions, cards and threads, then her old powers, as the brief says.
9. **Modern** (tables), so Modern and Urban fantasy deal. Needs 2.
10. **The founding: the strife.** Needs 8.
    - The tokens, the acts, a raid rolled Power against Power with ties to the defender, the old powers' acts dealt on her phone, the agendas climbing, the end, and a line of history for every act.
11. **Near future and Chrome** (tables), so Cyberpunk deals. Needs 2.
12. **The founding: her pass and the hand-over.** Needs 10.
    - Her pass on her phone alone, the crew's friends and foes, the first job named, and the one tap that writes it all into the world, with How it came to be on the World screen, as the brief says.
13. **Far future and the Stars** (tables), so Futuristic and Space fantasy deal, with Long Haul's mix. Needs 2.
14. **The sketch, and the founding on the table screen.** Needs 12.
    - The sketch, as the brief says, made into one of the world's maps at hand-over, with a pin at each seat.
    - The table screen shows the founding while it's on: the clock, the seats, the web growing and the history, and never anything of hers.
15. **Ancient, Ruin and Dread** (tables), so Mythic, Post-apocalyptic, Gothic horror and Dark fantasy deal, with Lanternfall's mix. Needs 2.
16. **When an agenda happens,** the builder deals its next agenda and its new asset or resource as cards to keep or swipe away, from the board as it stands then. Needs 3.

Later, when Mo says so: the paper version (the tables and both ways of building, printed), and the Oracle checking a guess before it's written (*the river city trades with the hold*, at Likely).

## The prompt

Every stage uses this, pasted into a fresh chat.

```
Zi'Dara: the next stage of the world builder.

Read only CLAUDE.md, then notes/builder-plan.md down to the end of Writing tables, and the stage you're building: the first one not marked built. If its Needs aren't all built, stop and tell me. Don't go through old chats or search the web. Grep, then read only the lines you need: never app.js, builder.js, campaigns.js, party.js, table.js, world.js or a chapter whole.

Ask me only the questions that are mine, all in one go, before you build.

1. Work on the website branch, brought up to date with main.
2. No AI in the builder: every word comes from tables I've said yes to, or is typed by someone at the table.
3. Whatever's kept per campaign stays in that campaign, checked on the server, nothing crosses between campaigns, and it works offline for anything already seen.

Use zi-voice for every word and impeccable for the look: one-handed on a phone at the table, in both themes.

If the stage writes tables or changes a rule, push to website and send me what to judge in one message (the /deal/ link on the Preview, for tables). Change only what I name, and nothing goes to main till I say yes.

While you work, run only the tests that cover your change. Before you finish: npm run build, then tests/check-site.mjs, tests/check-companion.mjs, tests/check-accounts.mjs and (from stage 2) tests/check-builder.mjs once each, with PW_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome if Playwright can't download Chromium. Then have one Sonnet agent review the diff in about 20 tool calls, with no test runs, and report in a few hundred words. A stage that only writes tables runs just npm run build and tests/check-builder.mjs, with no review.

Push to website for the Preview (https://website-zi.storyforgenz.workers.dev), then merge to main once everything passes, and mark the stage built in the plan, with the date, in the same merge. Finish in a few lines: what changed, what to try at the table, and which stage is next. The next stage uses this same prompt.
```
