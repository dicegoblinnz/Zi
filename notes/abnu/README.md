# Abnu: the canon store

Abnu is Mo's world, and this folder is its one home from 23 Nov 2026. Read this file and `open.md` before any Abnu session. The `abnu-canon` skill says how a session runs.

This folder lives on the branch `abnu`. Commit and push there after every session. It goes to `main` only when Mo says, like everything else in the repo.

## What counts

Only what Mo has said or approved is canon. Every entry and every fact in it carries one status:

- **Canon**: Mo said it or approved it.
- **Proposed**: Claude's suggestion, or Mo's maybe, waiting on his call.
- **Open**: a known gap, written as a question.
- **Retired**: was canon and Mo replaced it. One line says what replaced it.

## Reference, not canon

These are for asking Mo about and jogging ideas, never for copying in. Where they disagree with what he says now, now wins.

- `notes/abnu-canon.md`: the 30 Oct 2026 gathering of his older docs, with Claude's calls mixed in. It's the version he's replacing.
- `notes/abnu-map.png`: his map.
- The 278-page *World of Abnu* PDF and the old *Soul Forged* book, in his chats.
- `archive/pre-core-cut-2026-11-14`: the branch with Abnu as it was built for the site (`content/worlds/abnu/`).

## Layout

One file to a thing, named in kebab-case, in the folder for its kind. Make a folder when its first entry turns up.

- `lands/`: countries, empires and regions
- `factions/`: powers inside or across the lands
- `people/`: named people
- `peoples/`: the kinds of people and their cultures
- `places/`: cities, sites and landmarks
- `history/`: ages and events, with `timeline.md`
- `cosmos/`: the world's shape, magic, the soul, belief and the dead
- `names.md`: each culture's sounds and every settled spelling
- `open.md`: the open questions, most load-bearing first
- `log.md`: one short entry a session, newest first

## An entry

```
# Name

**Kind:** land | faction | person | people | place | event | cosmos
**Status:** Canon | Proposed | Open | Retired
**Changed:** 2026-11-23

Two lines on what it is.

## What's true
- A fact. (Canon)
- A suggestion. (Proposed)

## What people believe
What the public story is, where it differs from what's true.

## Ties
- [[other-entry]]: how they're tied.

## Open
- A question still to answer.
```

Lore only. Numbers and rules terms go on when an entry is built for the site.
