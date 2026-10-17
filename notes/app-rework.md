# The app rework: drill Mo first, then build

Agreed with Mo on 17 Oct 2026. He wants a real rework of the app so it's amazing at the table, and he wants to be drilled with questions before anything's built. Don't build until the drill's done and Mo has said yes to the plan it produces.

## Where things stand

- The rules site, in the Sigil look, live on zidara.world.
- The character companion's first version: `/characters/`, `src/companion/` and `notes/companion-plan.md`. The six crew on phones, saved on the phone, offline, no sign-in.
- The paper character sheet and the player reference: `/sheets/` and `notes/sheets-plan.md`. A fillable two-page sheet and a separate reference.
- Start by merging the latest `main` into this branch. If the companion or the sheets aren't on `main` yet, ask Mo whether to wait or to work from the `sheets` branch.

## Read first, and keep it short

`CLAUDE.md`, `notes/website-brief.md` (everything Mo's already decided), `notes/companion-plan.md` and `notes/sheets-plan.md` (including the calls listed at the bottom of each, which Mo hasn't confirmed yet), and a skim of `src/companion/`. Read the rules sections a question touches, not whole chapters.

## The drill

Use the question tool: up to four questions a round, two to four options each, your recommendation first marked "(Recommended)", short descriptions, real crew names and dice in the examples, and small text mock-ups in the preview for anything about layout. Plain words and NZ spelling.

- After every round, add Mo's answers to `notes/website-brief.md` and commit, so nothing's lost if his week's usage runs out.
- Follow up when an answer opens something up, especially an "Other".
- Don't ask what the brief already settles, or what you can decide yourself (code, libraries, tests).
- Confirm the unconfirmed calls from the two plans along the way.

The rounds, to adapt as you go:

1. **What the table taught.** Start here. How the companion and the paper sheet did at playtests: what players used most, what was slow or confusing, what they asked for, and phones or paper. Then what "amazing" means to Mo. Offer, for example, that it looks like a game, there's no counting at all, new players can learn from it, and the crew can play together live.
2. **The play screen and the roll.** What's on screen first during a round (set actions up front, the paper sheet's pages, or one long scroll). Whether the phone rolls the threat's die too and calls the result. How much it counts for you (everything with undo, the roll only, or ask each time). Intents (said out loud, an optional label, or required).
3. **Dice and feel.** Entering real dice (each die's number, or just beat, tie or under). What the app's dice look like (Sigil hex dice that spin and land, tumbling 3D dice, or plain numbers). Silent unless turned on is decided, so ask what's worth a sound or a buzz. How much animation.
4. **Making a character.** Which of the four ways in come first (guided, from the crew, blank, random). The quick build or the full build. Help with permissions (ideas plus the quick test, free writing, or lists only). How strict the builder is (warn but never block, strict, or none). Portraits (an archetype sigil now and uploads later, uploads now, or none).
5. **Growing and the crew.** Downtime on the phone (pick your two slots and the sheet updates, or edit by hand). The Aspiration and Party Goal tracks. The party sheet in the app. What the flag looks like when a rule changes (updating and flagging is decided).
6. **Sign-in and sharing.** Which sign-in options come first (Google, Discord, Apple or an emailed link), with what each one needs Mo to set up. Check the current requirements before you state them. Who hands out invites (only Mo, Mo and GMs he picks, or every player, a few each). How a GM sees a sheet before campaigns exist (a private link, not until campaigns, or print it). Printing a character onto the paper sheet from the app. Moving characters saved on a phone into an account.
7. **Live play and the GM.** This is looking ahead, so the app's built to grow into it: telegraphs on phones, the table screen, the GM's live view and prep tools. Which live piece comes first.
8. **Priorities.** What matters most for the next playtest, how big each stage should be, and how much of his week Mo wants each stage to use.

## Ideas to offer

Mo can pick from these or turn them down:
- Tap any word on the sheet, like a permission, a condition or Aura, to read its rule, offline.
- A roll card that counts as you tap, with the lines that cost Aura marked in gold.
- Sigil hex dice that land with some weight, and a buzz on a top face when Aura comes back.
- A table mode with big type, usable one-handed.
- A learn-to-play round: the brute swings his club at Isolde, and you answer it with Wren and Bram.
- A log of the session's rolls and what was spent, for the player now and the GM later.
- Print my character: fills the paper sheet's PDF from the app.
- A private link so the GM can see a sheet before campaigns exist.
- The party sheet and downtime on the phone.

## What the drill produces

- `notes/app-plan.md`: the decisions, a line or two each, then the stages, smallest useful one first. For each stage, say what players get, what it builds on, roughly what it'll use compared with the companion's first version, and how it's checked.
- Tell Mo the stages in plain words and wait for his yes.

## Then build

- Stage 1 goes in this chat if there's room, on the `app` branch, with its preview at https://app-zi.storyforgenz.workers.dev. Each later stage goes in a fresh chat, so finish every stage by giving Mo a one-line prompt for the next one.
- Before each stage, tell Mo roughly what it'll use. Run one independent check at the end of each stage, and use no other helpers.
- Every check passes (`tests/check-site.mjs` and `tests/check-companion.mjs`), offline still works, both themes, from 320 wide up.
- Merge to `main` only when Mo says so.

## Keep usage low

Mo's weekly limit is tight. Read only what you need, keep your outputs short, and don't re-ask anything the brief already answers.
