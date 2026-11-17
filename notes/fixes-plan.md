# The 17 Nov fixes: the plan

Mo's 17 Nov ask, part 3 of the rework that comes in parts: six fixes on top of the new core (`notes/core-plan.md`, live since 16 Nov). His words are in `notes/playtest-sheets/2026-11-17-chat-decisions.md`, and the calls Claude made filling the gaps are in `notes/to-confirm.md` under 17 Nov.

Several chats build it at once, one prompt each, the way parts 1 and 2 were built. Every chat reads this plan first, owns its own files, works on its own branch, and lands back into `rules/2026-11-17-fixes`. Nothing merges to `main` till Mo says, because the live companion has to keep working for his four campaigns.

## Why

- **Boons were Traits bought with permissions.** Mo wants Traits to come only from archetypes, so a sheet says who you are in one place.
- **Items didn't do anything on a roll**, and carrying was three lists and a bag. Gear you've equipped should matter, and the small stuff should be quick: say you've got it when you need it.
- **Armour as boxes you tick and mend** was bookkeeping. Soak works like health you're wearing.
- **Archetypes had two to four abilities each**, so two characters of the same archetype played the same.
- **The loop hasn't been run under pressure** on the new core, and every one of these changes moves the numbers.

## The rules after part 3

Newest wins. Everything Mo hasn't changed stands: the new core's Roots, points, rolls, bringing in a Root, Aura, wounds, Scars, healing and Toll, attunement, Catches and Burdens, telegraphs and the GM's side, and the 35 points.

### Fix 1: no permission-for-Trait trade

- **Boons go.** A Boon was an always-on upgrade bought with two permission slots, which is a Trait bought with permissions. Nothing trades permissions for an always-on effect any more: not at creation, not in downtime, and not back again.
- **Traits come only from archetypes**, one per archetype, always on. A Scar growing into a Trait (16 Nov) stays, since it's three downtime slots on a Scar and never permissions.
- **Burdens stay**, on attuned things only, and a Burden pays for two awakenings on that thing. "Or a Boon for you" goes.
- **The Boon levers** that were worth keeping move to where they belong: Toughness, Regen and Recovery to awakenings and abilities (the Guardian, the Healer, the Bloodsworn), Stride and Getting around to items and awakenings, Kit to packs (below), Aura-back to Traits that already give it. The Burden list keeps every Burden.
- **A saved character with a Boon** gets its two permission slots back as 2 points to spend, flagged for the player to choose (`{ k: "boon", t, lever, name }` in `s.choose`).

### Fix 2: Resources

- **Every character has 3 Resources.** A Resource is something ordinary you happen to have, said in the moment it's needed: "as it happens, I've got rope on me", "I've got a flask for this". Nobody lists them ahead of time.
- **Say it, tick one, and it's real.** It's yours from then on, the way any ordinary thing is, and a thing you use up (a smoke bomb, a flask, a bribe) is gone once it's used.
- **What a Resource can be:** anything ordinary you could plausibly have on you or have sorted earlier, which fits who you are. Never magic, never better than ordinary, and never something that'd add steps: a weapon or a tool good enough to be steps is an item. The GM can say no to one that doesn't fit the scene ("you came straight from the bath house").
- **It does what the thing does**, like a permission. It's never steps, and it never soaks. Things you use up keep their table (`#consumables-20`), now as Resource ideas with what each does.
- **They all come back in downtime**, when you restock. The GM can give one back mid-session when the story restocks you (a market, a quartermaster, a friend's cellar).
- **More Resources** come from items (a pack), abilities (the Maker's, the Shadow's) and the like, each saying how many.
- **A purse of gold is a Resource.** Coin and Kit's money still works the same way.
- **The crew's resources** on the party sheet are a different thing with the same word. The book always says "your Resources" for a character's and "the crew's resources" for the party sheet's, and the glossary has both. Whether the word stays is Mo's call (below).

### Fix 3: items

- **An item is real gear you've equipped**: a weapon, a shield, armour, or a tool good enough to matter (a grappling hook, a set of picks, a spyglass, a focus). **You carry six at most.** Attuned things are items, and they count. Your **keepsake** is free and on top, and it's story, never steps.
- **Six tiers.** An item's tier is how many steps it adds, so tier 6 is 6 steps, a d12's worth. Each tier has a name (the sets are below), written before the item: *a Named longbow*.
- **When an item fits the action, it adds its tier in steps on top of the Root.** One item a roll, the one doing the work. Body 8 and a tier 4 sword is 12 steps, two d12s, or any split the player wants. A Root brought in brings its Root, never another item.
- **Kinds of item**, each saying what its tier does:
  - **Weapons and tools**: their tier on a roll they fit. A weapon keeps its properties (Reach, Sweep, Piercing and the rest).
  - **Guards** (a shield, a buckler, a parrying dagger, a cloak that blurs you): their tier only on a roll **avoiding harm** (the landing roll, a Defend, an answer that's only getting out of the way), never anything else.
  - **Armour**: no steps. It **soaks**.
  - **Packs** (a quartermaster's pack, a bandolier, a surgeon's roll): no steps. They give more Resources, half their tier rounded up.
  - **Vessels**: no steps. They hold charge (Fix 4).
- **Dodging uses Body.** Avoiding a blow is your Body when it lands, at full, and a guard's tier on top.
- **Soak.** Armour sits on a Root, Body unless it says otherwise (court clothes on Mind, a holy symbol on Soul), and soaks as many points as its tier.
  - **A hit takes its points from the armour on that Root first**, a point of soak for each point, then the Root. It's extra health you're wearing.
  - **2 for 1**: a hit you take on another Root is 2 points there, and that Root's armour soaks them first.
  - **More hits**: a vulnerability's hit or a deadly threat's 2 hits or more are a point each, so each takes a point of soak.
  - **Soak comes back in full at the end of every scene.** Armour doesn't break from soaking. The GM can still name "something breaks" as a consequence instead of a hit, and a broken item's crossed out till it's mended (attuned things can't break).
  - **Wounds and Scars** come only once a Root's soak and points are both gone.
- **Getting items.** At creation an item's **1 point and comes at tier 2**, and 1 more point raises it a tier, to tier 3 at most. Tier 1 is rough or improvised: a chair leg, a borrowed bow. In play, Grow in downtime raises one a tier up to tier 3, money buys tier 4, and tiers 5 and 6 only come out of the story, with a material, the way an attuned thing's stages do.
- **Attunement.** Attuning an item doesn't change its tier. Its awakenings still lock a point of their Root each and add 2 steps on a roll they fit, 2 more for each Aura, so an attuned item that fits adds its tier and its awakening's steps. Attuned armour soaks like any armour and can't break.
- **Aura never buys tiers.** Aura goes on awakenings, abilities, bringing in a Root and the rest, as it does now. Tier is the thing itself.
- **Saved characters**: each piece of equipment becomes an item at tier 2 (armour at Common becomes tier 2, Fine tier 3, Masterwork tier 4), utility items and the bag go (their words kept in Notes, since they're Resources now), and anything past six is the player's to choose.

### Fix 4: vessels

- **A vessel** is an item that holds charge: a lantern of captured light, a prayer string, a battery-coil, a reliquary. It holds as much charge as its tier, so a tier 6 vessel holds 6.
- **Filling it with Aura:** only with Aura you'd lose. The Aura past your maximum when you finish acting, Aura that comes in while you're not acting and stops at your maximum, and whatever Aura you've got left when the scene ends can go in instead.
- **Filling it with points:** any time in a scene, no action, a point from any Root for a charge. That's pushing, so it can leave you exposed and never wounds you. Never at a scene's end and never in downtime, so it can't eat a recovery roll or a rest.
- **Spending charge:** only on your own abilities and your own awakenings' extra steps, a charge for each Aura they'd cost. It isn't Aura: it's never counted towards your maximum, never handed to a friend, and never pays for bringing in a Root, a tie, an intercept, a quick heal, going beyond or borrowing.
- **It keeps** between scenes and through downtime.
- **No farming.** It can only take what you'd have lost, it never turns back into Aura, and it can't hold more than its tier, so small dice past your maximum fill it once and then go nowhere.

### Fix 5: abilities

- **About ten abilities for each of the seventeen archetypes**, Push and the ones there now included. More come later.
- **Each one's a clear permission**: what it lets you do that you couldn't, said in a line, with its Aura printed (`**Its name (1 Aura):**`). Most are 1 Aura and stack (pay again, get it again). A bigger one can be 2.
- **It fits the archetype's mechanic and Trait**, and the core: one Root at full, every die an intent, splitting with no limit. It changes what your dice can do, where they can go or what a win does.
- **No pre-built actions** (no "Fireball: 3 hits in an area") and **no numerical tag stacking** (no "+1 step for each *Burning* tag"). An ability never adds steps by counting things.
- **They can use the new pieces**: an item's tier, Resources, a vessel's charge, soak.
- **An archetype still holds six** abilities at most, and comes with one.
- **The Scholar** isn't in the book (the 14 Nov cut). Nothing's written for it till Mo says.

### Fix 6: the loop under tension

Prompt 4 runs the whole loop under pressure, on these rules, and writes what holds, what drags and what breaks into `notes/loop-under-tension.md`, with its fixes as proposals for Mo. Only the GM's numbers move on its say-so (budgets, multipliers), the way prompt 3 of `notes/core-plan.md` moved them. Every other fix it proposes waits for Mo.

## The tier names

The book's built on the first set. They're one table (`#s-item-tiers` in 03, read into `companion.build.tiers`), so Mo's pick is one edit.

| Tier | **Told** (default: how the world knows it) | **Forged** (how it was made) | **Souled** (how much of a soul's in it) |
| --- | --- | --- | --- |
| 1 | Plain | Rough | Silent |
| 2 | Trusty | Sound | Humming |
| 3 | Named | Fine | Singing |
| 4 | Storied | Masterwork | Kindled |
| 5 | Sung | Peerless | Ensouled |
| 6 | Mythic | Starforged | Radiant |

## The vessel's name

**Vessel** is the default (it holds a bit of you, and it reads at the table: "two out of my vessel"). The others: **Reliquary**, **Wellstone**.

## Still to work out at the table

- Whether soak back in full every scene makes armour too strong once the GM piles on. Prompt 4 says what the numbers show.
- The GM's numbers again: items add steps, so fights get shorter. Prompt 4 finds them.
- Which items a starting character should be able to afford, and whether tier 3 at the start is right.

## The shared pieces

Every chat codes to these names and shapes, so the pieces fit when they land. Prompt 2 builds them in `src/companion/roots.js`, and the rest stub them till it lands.

- **The sheet** (`rootsSheet()`): `c.items` is `[{ key, name, tier, kind, root, props, attuned }]`, six at most (`MAX_ITEMS`). `kind` is `"weapon"`, `"tool"`, `"guard"`, `"armour"`, `"pack"` or `"vessel"`. `root` is the Root an armour soaks on (Body unless it says). `props` are a weapon's properties. `attuned` is the index into `c.attuned` when it's attuned, or `null`. `c.keepsake` is its words. `c.carry`, `c.armour` and every Title's `boons` go. `TIERS` (`[{ n, name }]`) comes off the book's table, and `tierName(n)` says one.
- **Resources:** `RES_BASE` (3). `resOf(c)` is 3 and what packs (half their tier, rounded up) and anything else that says so add.
- **The state** (`v: 5`): `s.soak` is `{ [itemKey]: used }` in place of `s.boxes`. `s.res` is `[text]`, the Resources said since downtime. `s.charge` is `{ [itemKey]: n }`. `s.crossed` stays for broken items. `normalCore()` moves a v4 state across: soak starts unused, `s.boxes` goes, a Boon becomes `{ k: "boon", … }` in `s.choose` with its 2 points.
- **A roll:** `countRoll(c, s, r)` takes `r.item` (an item's key) and `r.avoid` (true on a roll avoiding harm), and adds the item's tier when it can (a weapon or a tool on anything, a guard only with `avoid`, armour, packs and vessels never, a broken one never). It hands back `item: { key, name, tier, steps }`. `r.charge` is `[{ key, n }]`, charge paying for an awakening's Aura on this roll.
- **Harm:** `takeHits(c, s, root, n, { on })` takes soak first from the armour on the Root the hits land on (`on ?? root`), a point a hit, 2 a hit on `on`, then points, then the wound and the Scar. It hands back `{ lost, soaked: [{ key, n }], wound, scar }`. `soakOf(c, s, root)` is what's left to soak there.
- **Resources:** `sayRes(c, s, text)` ticks one and keeps its words, `resLeft(c, s)` is how many are left.
- **Vessels:** `chargeOf(c, s, key)`, `fillVessel(c, s, key, n, { from: "aura" | "pt", root })` (points only mid-scene) and `spendCharge(c, s, key, n)`.
- **Rests:** `sceneEnd(c, s, rolls, { fill })` puts soak back and lets leftover Aura into vessels (`fill` by key) before Aura's filled again. `downtimeRest(c, s)` puts soak and Resources back and keeps charge.
- **Points:** `costOf()` in `points.js`: an item is 1 point at tier 2 and 1 more for each tier above, 3 at most at the start, and no Boons.
- **A crew sheet in 03b** keeps its labels, with `**Items:**` in place of `**Carries:**` and `**Armour:**`, each item as `a Named set of picks (tool, tier 3)`, armour as `Trusty worn leathers (armour, Body, tier 2)` and an attuned one as `her grappling line (tool, tier 2, attuned)`, then `n of 6`, and `**Keepsake:**` and `**Resources:** 3.` on lines of their own. Prompt 2 owns the exact shape and `scripts/crew-sheets.mjs` reads it.
- **The live table:** When it lands's record keeps `box` for older phones and adds `soaked` (a number). An answer's `steps` includes the item's tier, and `ans.item` names it.

## Who owns what

A chat changes only its own files, its own parts of `tests/` and its own blocks of `companion.css`. If it needs a small change in someone else's, it makes the smallest one and says so in its report.

| Prompt | Piece | Owns |
| --- | --- | --- |
| 0 | Write it down | this plan, the decisions, `notes/to-confirm.md`'s 17 Nov section, a line in CLAUDE.md |
| 1 | The rules | 02 · Conflict (05) bar A Full Fight · Downtime (12) · Appendix D · the glossary · the change log entry `c-2026-11-17-fixes` · `tools/check_terms.py` |
| 2 | The character | 03 · 03b · 18 · `scripts/build-content.mjs` · `scripts/crew-sheets.mjs` · `roots.js` · `points.js` · `dice.js` · `armour.js` · `src/generated/crew-archetypes.json` · `tests/check-companion.mjs` part 1e |
| 3a | Abilities I | 03a: Bard, Bloodsworn, Elementalist, Face, Gambler, Guardian |
| 3b | Abilities II | 03a: Healer, Hunter, Illusionist, Leader, Maker, Oracle |
| 3c | Abilities III | 03a: Shadow, Shifter, Summoner, Teleporter, Warrior, and 03a's opening (How Archetypes Work, Abilities, Picking, the crew's archetypes) |
| 4 | The loop under tension | `tools/fight_sim.py` · `notes/loop-under-tension.md` |
| 5 | The play screen and the table | `app.js` · `look.js` · `marks.js` · `roller.js` · `roller-rules.js` · `learn.js` · `src/pages/kit.astro` · `table.js` · `table-rules.js` · `table-screen.js` · `aims.js` · `src/worker/` |
| 6 | The builder, downtime and print | `builder.js` · `ways.js` · `downtime.js` · `before.js` · `print.js` · `sheet-fields.js` · `scripts/sheets/` · `scripts/build-sheets.mjs` · `public/sheets/` · `src/data/sheets.json` · Appendix A's The character sheet |
| 7 | The rest of the book | Conflict's A Full Fight · 01, 04, 07, 13 to 17, 19 to 28 · Appendices A (bar The character sheet), B and C · the index · `content/learn.md` · the change log entry `c-2026-11-17-budgets` |
| 8 | Bringing it together | CLAUDE.md · this plan's status · whatever's left over |

## How each chat works

- Each chat works in its own worktree, `/home/claude/wt/<piece>`, on the branch `rules/2026-11-17-fixes-<piece>` off `rules/2026-11-17-fixes`, with `node_modules` linked from the main clone. Commit there, and don't push: the git proxy holds two transfers at a time, so the lead lands every branch and pushes once.
- Stay in your own files and code to the shared pieces. If one hasn't landed, stub it with its name and shape.
- While part 3's in pieces, other pieces' checks can fail. Yours must pass, and don't break any that were passing. Run checks with `ZI_PORT` set to your own port (prompt 1 on 4401, 2 on 4402, and so on), and only the parts that cover your change. The full suites run once, in prompt 8.
- Follow Changing a rule in CLAUDE.md, write in the voice (the `zi-voice` skill), and every example uses the crew's real numbers.
- Your calls go in your subsection under 17 Nov in `notes/to-confirm.md`, and what you built in your section under Where each piece has got to.
- Finish with what's built, the calls you made, anything another prompt needs to know, and which prompts can start now.

## The order

- **0** first, on its own (done, 17 Nov).
- **1, 2, 3a, 3b, 3c and 4** at once.
- **5, 6 and 7** once 1 and 2 have landed (7 once 4 has too).
- **8** once 1 to 7 have landed.

## The prompts

### 1. The rules

> Prompt 1 of `notes/fixes-plan.md`: the rules. Read the plan and Mo's 17 Nov decisions. On `rules/2026-11-17-fixes-rules`, write Fixes 1 to 4 into The Core (02), Conflict (05) bar A Full Fight, Downtime (12), Appendix D and the glossary: no Boons and no permission trade, Resources said in the moment, items adding their tier, guards only avoiding harm, armour soaking first (2 for 1 and more hits included) and back every scene, and vessels. Write the change log entry `c-2026-11-17-fixes`, retire Boons and the old carrying words in `tools/check_terms.py`, and log your calls.

### 2. The character

> Prompt 2 of `notes/fixes-plan.md`: the character. Read the plan and Mo's 17 Nov decisions. On `rules/2026-11-17-fixes-character`, write Building Your Character (03) with Resources, items and their tier table (`#s-item-tiers`), soak, vessels and no Boons; Coin and Kit (18) with tiers, upgrades, packs and vessels, and every attuned thing as an item; and the six crew in 03b on 35 points with their items, keepsakes and Resources. Build the shared pieces in `roots.js`, `points.js` and `armour.js`, read it all in the build, move saved characters across, and log your calls.

### 3a, 3b and 3c. Abilities

> Prompt 3a (3b, 3c) of `notes/fixes-plan.md`: abilities. Read the plan, Mo's 17 Nov decisions and How Archetypes Work in 03a. On `rules/2026-11-17-fixes-abilities-a` (b, c), write about ten abilities for each of your archetypes, keeping the ones there, each a clear permission with its Aura printed, fitting the mechanic, the Trait and dice as intents, with no pre-built actions and no tag stacking. Keep every id and the crew's abilities word for word. Log your calls.

### 4. The loop under tension

> Prompt 4 of `notes/fixes-plan.md`: the loop under tension. Read the plan, Mo's 17 Nov decisions and his targets. On `rules/2026-11-17-fixes-loop`, put items, guards, soak and vessels into `tools/fight_sim.py`, and run the whole loop under pressure: a big fight with threats on the board and the party stretched, then a scene that isn't a fight. Write `notes/loop-under-tension.md`: where it holds, where it drags, where it breaks, each with a fix to propose and the numbers behind it, and the GM's budgets and multipliers for prompt 7.

### 5. The play screen and the table

> Prompt 5 of `notes/fixes-plan.md`: the play screen and the table. Read the plan once 1 and 2 have landed. On `rules/2026-11-17-fixes-play`, the play screen with items on the roll card (one a roll, guards only on When it lands), soak on When it lands and the Root's panel, Resources said and ticked, vessels filled and spent, no Boons; the roller, the learning round and the kit; and the live table and table screen with `soaked` and `ans.item`, old tables still read.

### 6. The builder, downtime and print

> Prompt 6 of `notes/fixes-plan.md`: the builder, downtime and print. Read the plan once 1 and 2 have landed. On `rules/2026-11-17-fixes-build`, the builder with six items and their tiers, no Boons, and Resources explained; Change and the other ways in; downtime (Resources back, Grow raising a tier, no Boon swaps); and the paper sheet and print (six item lines with tier and kind, soak boxes, three Resource boxes, vessel charge), rebuilt with `npm run sheets`.

### 7. The rest of the book

> Prompt 7 of `notes/fixes-plan.md`: the rest of the book. Read the plan once 1, 2 and 4 have landed. On `rules/2026-11-17-fixes-book`, move Running the Game's budgets and multipliers to prompt 4's numbers, write A Full Fight and the rest of the book on Fixes 1 to 4, Appendices A to C, the index and the Learn deck, and the change log entry `c-2026-11-17-budgets`.

### 8. Bringing it together

> Prompt 8 of `notes/fixes-plan.md`: bringing it together. Merge every piece into `rules/2026-11-17-fixes`, run the full checks, fix what's left, rebuild the reading copy and the sheets, update CLAUDE.md and this plan's status, push for the Preview, and say whether it's ready for `main`.

## Where each piece has got to

### 0. Write it down

Written 17 Nov: the decisions, this plan, the 17 Nov section in `notes/to-confirm.md` and the line in CLAUDE.md, on `rules/2026-11-17-fixes` off `rules/2026-11-16-core`. Prompts 1, 2, 3a, 3b, 3c and 4 can start.

### 2. The character

Built 17 Nov on `rules/2026-11-17-fixes-character`. Its calls are in `notes/to-confirm.md` under 17 Nov, 2.

- **03:** the points table (an item 1 at tier 2, a tier up 1, no Boon), Step 5 as Items (`#s-items`): one item a roll, Tiers (`#s-item-tiers`, the one table the names come from, tier 3 Proven), Kinds of item (`#s-item-kinds`, six rows the build reads), dodging on Body with a guard on top, What you carry (`#s-carrying`, six at most, the keepsake on top), a written Items line, weapons with their tier, the item list by kind, Resources (`#s-resources`), Resource ideas (`#consumables-20`, 20) and keepsakes. Attunement makes the attuned thing one of your six at its tier. Armour and soak (`#s-armour`, with How much it soaks on `#s-armour-quality` and Broken items on `#recovering-armour`), Vessels (`#s-vessels`), and Burdens on `#s-boons`. Vesk built start to finish on the new pieces. Every old id's kept.
- **03b:** the six crew on 35 with `**Items:**`, `**Keepsake:**` and `**Resources:** 3.`, the Quick Build's step 4 and Wren's example, and the crew's intro.
- **18:** money buying tiers (What you can afford), Upgrading gear (Grow to 3, money to 4, the story to 5 and 6), Packs (`#s-packs`), Vessels to use (`#s-kit-vessels`), every attuned thing's `**Item** kind, tier n.` line, and Dorrie's ring example recounted.
- **`roots.js`:** `KINDS`, `MAX_ITEMS`, `START_TIER`, `MAX_START_TIER`, `MAX_TIER`, `TIERS` (`useTiers()` sets it from `B.tiers`, which `rootsSheet()` calls), `tierName()`, `itemSaid()`, `tierIn()`, `addsSteps()`, `itemOf()`, `RES_BASE`, `packRes()`, `resOf()` (with `c.resMore` for abilities that give more), `resLeft()`, `sayRes()`, `armourOn()`, `soakLeft()`, `soakOf()`, `takeHits()` soaking first (hands back `soaked`), `vesselsOf()`, `chargeOf()`, `fillVessel(…, { from, root, spill })`, `spendCharge()`, `sceneEnd(c, s, rolls, { fill })` (vessels, then Aura full, soak back, recovery, Toll, and `filled` back), `downtimeRest()` (soak and Resources back, charge kept), `countRoll()` with `r.item`, `r.avoid` and `r.charge` (hands back `item` and `charge`), and `payFor()` spending charge. The sheet has `c.items` (`{ key, name, tier, kind, root, props, attuned, when }`, keys `item|<name>`), `c.keepsake`, and a Title's gone Boons as `boonsGone`. The state's `v: 5` (`soak`, `res`, `charge`, no `boxes`), and `normalCore()` moves v4 across: crossed items by their item key, utility items and the bag into the notes, and `{ k: "boon", t, lever, name }`, `{ k: "items", over }` and points in `choose`. `growRoots()` reads `{ k: "item" }`, `{ k: "tier", key, to }` and `{ k: "drop", key }`, and an Aspiration's attuned thing is an item too.
- **For the screens that haven't moved:** the Boons are stubs that give nothing (`BOON_SLOTS`, `slotsOf()` as a Title's permissions, `boonOf()`, `boonsOf()`, `boonCount()`, `withBoons()`, `boonSaid()`, `shrugs()`, `freeBeyond()`, `restBonus()`), and `rootsSheet()` still makes `c.carry` (equipment as the items that aren't attuned, no utility or bag) and `c.armour` (each piece with its tier as its boxes and its tier's name as its quality), all marked for prompt 8 to take out. `armour.js` is on soak, its old names (`tickedOf`, `setTicked`, `tick`, `boxesOn`, `boxesSaid`, `withQuality`) kept and meaning soak, and `piecesOf()` gives each piece `boxes` and `quality` too. `REST_BOON` and the Recovery Boon's 2 are gone.
- **`points.js`:** an item's 1 and each tier above 2 a point, an attuned item's first point in its 5, a build from before the fixes counting its equipment at tier 2 and its utility and bag as nothing, and no Boons. Its line kinds add `tier` and lose `boon`.
- **The build:** `crew-sheets.mjs` reads the Items, Keepsake and Resources lines and stops on more than six, a count that's wrong, a tier past 3 or missing, a kind there isn't, armour with no Root, a Root on anything else, a tier's name that isn't its tier, a property that isn't one, the attuned item not being the attuned thing, Resources that aren't 3 and what packs add, no keepsake, and a Carries, Armour or Boons line. `build-content.mjs` reads `companion.build.tiers`, `kinds`, `resources` (and `usedUp` the same), `props`, `weapons`, and each of Coin and Kit's things with its `kind`, `tier`, `stage` and `props`. `boons` is empty and `qualities` is the first three tiers, for the screens that haven't moved, and it stops if Burdens says Boon. `tools/check_terms.py` (prompt 1's) lets *tier* back in and a guard in a table or in bold.
- **Checks:** `tests/check-companion.mjs` part 1e, no browser.

What the other prompts need from it:

- **1:** Bram has a helmet (armour, Body, tier 2) as well as his plate (3), so his Body soaks 5 a scene. Ash's scorched coat is Body armour at tier 2, and she's got a coal horn, a vessel at tier 3. A shield's a guard, never armour. Prompt 1's examples otherwise match: Bram's hammer, Ash's stone, Vesk's line and leathers at tier 2, and her picks, Bram's plate and Wren's longbow at tier 3.
- **3a to 3c:** an ability that gives more Resources can be counted with `c.resMore`, and one that spends charge uses `spendCharge()`.
- **4:** the crew's items and rolls are in 03b and part 1e's `ROLLS`.
- **5:** the roll card's one item (`r.item`, guards only with `r.avoid`), `r.charge`, `soaked` from `takeHits()`, `sayRes()` and `resLeft()`, `fillVessel()` from `doneActing()`'s and `gainAura()`'s overs, and `sceneEnd(…, { fill })`, which fills Aura itself now. `/kit/` builds as it is.
- **6:** `c.items`, `c.keepsake`, `resOf()`, the grown shapes above, `B.tiers`, `B.kinds`, `B.resources`, `B.weapons` and `B.things`' kinds and tiers. The builder still runs on `carry` through the move across, so it counts its utility and bag as nothing now. The item list's groups are Weapons, Guards, Armour, Tools, Foci, Packs, Vessels and Signature (no Armour & wearables or Personal). Part 1f (print) stops at its own setup, which edits `crew.armour`.
