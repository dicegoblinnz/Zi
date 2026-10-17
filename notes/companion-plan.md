# The character companion: first version

Agreed with Mo on 17 Oct 2026. Build exactly this, then stop and send Mo the preview. Everything else gets built on top of it later.

## What it is

A **Characters** page on zidara.world where a player picks one of the six crew, gives them their own name and plays them at the table from their phone.

- Pick from the crew only: no blank sheets, no builder yet.
- Saved on the phone (localStorage), and it works offline. No sign-in, no server, no database.
- Built into the existing Astro site. Nothing new to deploy or pay for.

## Mo's decisions, 16 and 17 Oct

- The old companion apps had four problems, and this one has to fix all of them: rolls took too long, they were hard to use at the table, they fell behind the rules, and sheets got lost or stuck.
- Its number one job is building a roll fast. Playtests found rolls take 1 to 3 minutes while players hunt for their lines.
- Dice both ways: roll in the app with a proper animation, or roll real dice and tap the numbers in. The player chooses.
- Silent, so no sounds in this version.
- When the rules change, numbers that come from the rules recount themselves, and anything the player has to choose gets flagged with a link to what changed.
- Sign-in comes after this version. Characters saved on a phone must be able to move into an account later, so keep the saved format simple and versioned.
- A sheet is seen by its player and their GM, nobody else. In this version it never leaves the phone.

## Read these first

- `CLAUDE.md`, then `notes/website-brief.md` (look, voice, order).
- The rules the companion follows. The chapters are the truth, so read them instead of trusting a summary: The Core (`02-the-core.md`, all of it), Conflict (`05-conflict.md`: the round, your action, answering, when it lands, conditions, Hurt), Building (`03-building-your-character.md`: Confidence and Armour), The Archetypes (`03a-the-archetypes.md`: how archetypes work and what 1 Aura gets each one), and the crew's sheets (`03b-title-ideas-and-the-crew.md`, `#s-pregens`).

## The data

- Extend `crewFrom` in `scripts/build-content.mjs` so each crew sheet becomes full structured data in `book.json`: Titles (name, archetype, permissions), traits (name, type), set actions (name, steps, die, lines), what they carry (equipment, utility, keepsake, bag), attuned things (stage, permissions, Catch), numbers (Aura, Resolve, Stride, Armour, where Confidence starts and what raises it, Hurt bars), threads by person, Aspiration and its die, and the trouble that follows them.
- Check every set action while building: steps = 1 + its lines, and the die matches the steps. A mismatch is a build warning.
- Give each crew sheet a short hash. A saved character keeps the player's name and state, and always reads its sheet from the current data. If the hash changed since it was saved, show a short note on the sheet with a link to `/changes/`.

## The screens (phone first, from 320 wide)

1. **Characters** (`/characters/`): the characters on this phone, and the six crew to pick from (name, Title, archetype chips, blurb). Picking one asks for a name, filled in with theirs, and opens the sheet.
2. **The sheet**: a sticky strip with Aura, Resolve, Confidence and Armour, then the set actions as big tiles (name, die, steps). Below that: Titles and permissions, traits, Kit, Hurt and conditions, threads, Aspiration and notes.
3. **Building a roll**: tap a set action.
   - Its lines start on. Tap one off when it doesn't fit, and the steps and dice update at once.
   - Bring something in for 1 Aura each: the character's other lines, plus "something else that fits" (the ground, a threat's tag, a friend's permission through a thread).
   - Friends joining in (add their steps, and each action gives a split), your own extra action, and going beyond for 1 Resolve.
   - Steps into dice exactly as the table in The Core, with splits.
   - Optionally, what it's up against: its die, or the number it already rolled this round.
   - Roll in the app, or tap in real dice. Show beat, tie or under for each die. Give 1 Aura back for every top face, except a die the archetype's +2 took there. Offer the archetype's +2 (+3 when it's taken twice, like Vesk and Wren) for 1 Aura, winning a tie for 1 Aura when acting, and a reroll for 1 Resolve.
   - Count Aura and Resolve automatically, with an undo.
4. **Trackers**: Aura (full every scene, 5 unless the sheet says otherwise), Resolve (back 1 at the end of a scene, all of it after downtime), Confidence as a d2 to d12 ring, Armour stepping down and back, Hurt boxes with a Catch line when a bar fills, conditions with their die, and threads that can be strained or snapped. A **New scene** button and an **After downtime** button reset what the rules reset.
5. **A defence roll** if there's room: your Armour once against everything coming, Confidence once against fear, or Defend to roll Armour for each die. Ties go to you.

## How to build it

- Keep it small: one client-side module on Astro pages, no UI framework unless the state really needs one. No server code.
- Storage: one localStorage key, `zi-characters`, holding a versioned list. Wrap every read and write in try/catch, and say so on screen if the phone won't save.
- Offline: a service worker that keeps the site's shell, fonts, the Characters pages and the rules. Test it with the browser offline.
- Dice: `crypto.getRandomValues`. The animation's short, a tap skips it, and it respects reduced motion.
- The Sigil look and tokens in `src/styles/site.css`, both themes, 44px tap targets, and usable one-handed.
- Words on screen in Mo's voice (the `zi-voice` skill), using the rules' own terms.
- Add Characters to the top bar and footer, and turn the home page's "Your phone at the table" card into a link to it.

## Checks

- `node tests/check-site.mjs` must pass with the new pages added to its list.
- Add a companion test: pick Vesk, and Sneak shows 4 steps, a d8. Tap off Silent Step and it's 3 steps, a d6. Bring in her grappling line and it's 4 steps again, with 1 Aura to pay. Roll with fixed dice through a test hook, and check the Aura and the result. Reload and it's all still there. Go offline and reload, and it still works.
- Check the steps-into-dice function against the table (1 is a d2, 7 is a d12 and a d2, 12 is two d12s, 18 is three).
- Every crew member's set actions must match their sheet in the chapter.

## Keep usage low

Mo's weekly limit is tight. Work in this chat only, read only the parts of files you need, avoid big outputs, use no helpers while building, and run one independent check at the end.

## Ship it

- Work on the `website` branch. Its preview is https://website-zi.storyforgenz.workers.dev.
- Commit with the attribution lines, send Mo the preview link and a few phone screenshots, and list any calls you made at the bottom of this file for him to check.
- Merge to `main` only when Mo says so.

## After this, in Mo's order

Sign-in (invite-only, with Google, Discord, Apple or an emailed link), building your own character (guided, blank or random), your GM seeing sheets, then campaigns, worlds and maps, and live telegraphs.

## Calls made while building it (17 Oct 2026)

For Mo to check. Each one's the smallest call in the shape of the rules, and each is easy to change.

**17 Oct, Mo:** 1 to 4 and 6 to 8 are confirmed. 5 gets a swap (below). 12 changes: typo fixes stay quiet, and each changed line gets a gold mark.

1. **Aura and the +2.** A die that comes up on its top face gives 1 Aura back as soon as it's rolled. Putting the +2 (or +3) on it afterwards doesn't take that Aura away, and a die the +2 takes to its top face, or past it, never gives any.
2. **The Mark die.** A roll can include a Mark die when the target's *Marked*. It's one more die against it, and a top face on it gives Aura to whoever rolled, like any die in the roll. The Hunter's +2 (+3 for Wren) only goes on the Mark die.
3. **New scene ends conditions.** They fade a size every round, and the New scene button clears whatever's left, the same way Confidence and the loose boxes reset.
4. **After downtime does a new scene as well:** Aura full, Confidence back where it starts, loose boxes clear, conditions gone, and Resolve full. A Catch on the Hurt track and Armour still take a slot each, so they stay until the player taps them.
5. **Defend matches the rolls up for you,** so the most dice get stopped. The rules say you choose which roll blocks which, so if players should pick (to stop a *pin* rather than a bigger hit, say), that's a small change. **17 Oct, Mo:** the app matches, and the player can tap to swap two.
6. **A Scar crosses out the last open box,** and a bar counts as full when every box in it that isn't crossed out is filled.
7. **Clothes that fit the scene** are a "Dressed for it" button on Confidence, rather than a question at every new scene.
8. **"Her picks" on a set action** counts as that attuned thing's first permission. So Bram's war hammer on his Fight is *fight with a war hammer*, and *knock a man off his feet* can be brought in for 1 Aura.
9. **Bringing something in** lists the character's Titles, permissions, attuned permissions, traits that give a step, and what they carry. The ground, a threat's tag and a friend's permission share one counter, "something else that fits", at 1 Aura each.
10. **Friends joining in** is a number the player puts in: the friend's set action steps, leaving out lines they've both got. The app can't see a friend's sheet yet.
11. **A crew thread strained on one phone** isn't strained on the other yet, because sheets don't talk to each other until sign-in. The app says to tell them.
12. **A sheet's hash** covers its whole block in the chapter, so any change to a crew sheet, even a typo fix, shows the "changed in the rules" note.

Not in this version, and handled at the table for now: the Shadow pool, a Face's influence held over between rolls, a Leader handing steps out from the app, and the Oracle taking steps off telegraphs. Each archetype's 1 Aura is on the sheet with a button to pay it.
