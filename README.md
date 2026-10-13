# Zi'Dara

Mo's tabletop roleplaying game, and the source for its website at zidara.world.

This repo is the **master copy of the rules**. The website, the printed book, the reference sheets and the character tools are all built from what's here, so they can't disagree.

## What's where

| Folder | What's in it |
| --- | --- |
| `content/rules/` | The rules, one Markdown file per chapter, in book order. |
| `content/changes.md` | The change log: every rules change, newest first, with what it replaced. |
| `content/figures/` | Maps and diagrams the chapters use. |
| `tools/` | Scripts for checking and building. |

## Changing a rule

1. Change the chapter (or chapters) where the rule lives.
2. Add an entry to the top of `content/changes.md`: the date, what changed, what it replaced, and which chapters.
3. Run the checks in `tools/` and commit.

Every commit is a version, so GitHub's history shows exactly what changed and when.
