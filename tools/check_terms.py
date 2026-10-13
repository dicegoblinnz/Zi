#!/usr/bin/env python3
"""Flag rules words that the 7 to 13 Oct 2026 changes retired, and broken links.

Usage: python3 tools/check_terms.py [FILE.md ...]   (default: every chapter)
       add --links to check every #anchor link points at a real heading id

Each hit is a line to read, not an automatic error. Some words are fine in
context (a guard in a story, "Captain of the Guard", a rare painting).
"""
import glob
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RETIRED = [
    ("game name", r"\bZi\b(?!['’]Dara)"),
    ("abilities", r"\babilit(y|ies)\b"),
    ("tiers", r"\b(Novice|Skilled|tiers?)\b|\bMaster tier\b|\bat Master\b"),
    ("specialization", r"\bspeciali[sz](ation|ations|ed)\b"),
    ("Help action", r"\bHelp(s|ing|ed)?\b|\bhelp action\b"),
    ("Guard action", r"\bGuard(s|ing|ed)?\b(?! (of|at the|on the gate))"),
    ("two actions", r"\b(two|both|second|2) actions?\b|\byour two actions\b"),
    ("resources", r"\bresources?\b"),
    ("item rarity", r"\b(rarity|Rare|Legendary|Common)\b"),
    ("stretch", r"\bstretch(es|ed|ing)?\b"),
    ("let it ride", r"\blet(ting|s)? it ride\b"),
    ("old names", r"\b(Insight|Truth|Limit Break|Spread|pour in)\b"),
    ("pockets", r"\bpockets?\b"),
    ("old Hurt", r"\b(three|3) Hurt boxes\b|\bHurt boxes\b|\bfourth Hurt\b"),
    ("Catch on a Title", r"\bTitle['’]?s? Catch(es)?\b|\bCatch on (each|your|a) Title\b|\bonce a scene\b.*\bCatch\b|\bCatch\b.*\bonce a scene\b"),
    ("one Spark", r"\bone Spark at most\b|\bSpark at most\b|\bback each session\b|\bstart every session with it\b"),
    ("big magic", r"\bbig magic\b"),
    ("archetypes and kits", r"\barchetypes?\b|\bquick-build kits?\b"),
]


def chapters(args):
    files = [a for a in args if not a.startswith("--")]
    return files or sorted(glob.glob(str(ROOT / "content/rules/*.md")))


def strip_fm(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:]
    return text


def check_terms(files):
    total = 0
    for f in files:
        lines = strip_fm(open(f, encoding="utf-8").read()).split("\n")
        hits = []
        for i, line in enumerate(lines, 1):
            for name, pat in RETIRED:
                if re.search(pat, line):
                    hits.append((i, name, line.strip()))
        if hits:
            print(f"== {Path(f).name}: {len(hits)}")
            for i, name, line in hits:
                print(f"  {i:>5} [{name}] {line[:150]}")
        total += len(hits)
    print(f"{total} lines to read")


def check_links(files):
    ids = set()
    all_files = sorted(glob.glob(str(ROOT / "content/rules/*.md")))
    for f in all_files:
        t = open(f, encoding="utf-8").read()
        ids.update(re.findall(r"\{#([A-Za-z0-9_-]+)", t))
        m = re.search(r"^id:\s*(\S+)", t, re.M)
        if m:
            ids.add(m.group(1))
    bad = 0
    for f in files:
        for i, line in enumerate(open(f, encoding="utf-8").read().split("\n"), 1):
            for target in re.findall(r"\]\(#([A-Za-z0-9_-]+)\)", line):
                if target not in ids:
                    bad += 1
                    print(f"  broken link #{target} in {Path(f).name}:{i}")
    print(f"{bad} broken links")


if __name__ == "__main__":
    files = chapters(sys.argv[1:])
    if "--links" in sys.argv:
        check_links(files)
    else:
        check_terms(files)
