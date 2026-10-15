# Zi'Dara

Mo's tabletop roleplaying game, and the source for its website at zidara.world.

This repo is the **master copy of the rules**. The website, the printed book, the reference sheets and the character tools are all built from what's here, so they can't disagree.

## What's where

| Folder | What's in it |
| --- | --- |
| `content/rules/` | The rules, one Markdown file per chapter, in book order. |
| `content/changes.md` | The change log: every rules change, newest first, with what it replaced. |
| `content/figures/` | Maps and diagrams the chapters use. |
| `notes/to-confirm.md` | Gaps in the rules that Claude filled, waiting for Mo's yes or no. |
| `notes/playtest-sheets/` | Mo's "What's changed" playtest sheets, where each change came from. |
| `tools/` | Scripts for checking and building. |
| `CLAUDE.md` | How Claude keeps the rules: the voice, the format and the checks. |

## Changing a rule

1. Change the chapter (or chapters) where the rule lives, and anywhere it's summarised (the quick reference, every lever, the glossary).
2. Add an entry to the top of `content/changes.md`: the date, what changed, what it replaced, and which chapters.
3. Run the checks in `tools/` and commit.

Every commit is a version, so GitHub's history shows exactly what changed and when.
