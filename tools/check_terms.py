#!/usr/bin/env python3
"""Flag rules words that the 7 Oct to 26 Oct 2026 changes retired, and broken links.

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
    ("item rarity", r"\b(rarity|Rare|Legendary)\b"),
    ("stretch", r"\bstretch(es|ed|ing)?\b"),
    ("old names", r"\b(Insight|Truth|Limit Break|Spread|pour in)\b"),
    ("pockets", r"\bpockets?\b"),
    ("old Hurt", r"\b(three|3) Hurt boxes\b|\bHurt boxes\b|\bfourth Hurt\b"),
    ("Catch on a Title", r"\bTitle['’]?s? Catch(es)?\b|\bCatch on (each|your|a) Title\b|\bonce a scene\b.*\bCatch\b|\bCatch\b.*\bonce a scene\b"),
    ("big magic", r"\bbig magic\b"),
    ("quick-build kits", r"\bquick-build kits?\b"),
    # 14 Oct: archetypes
    ("trait on a Title", r"\b(each|every|your) Title (brings|has|gives) (a|one|its) trait\b|\btrait (for|on) each Title\b|\bTitle['’]s trait\b"),
    ("area for anyone", r"\barea\b.*\b1 Aura\b|\b1 Aura\b.*\barea\b|\bmake a die your area\b|\bcounts? friends\b"),
    ("heal a group", r"\bheal(ing)? a group\b|\bgroup heal\b"),
    ("something that helps", r"\bsomething that helps\b"),
    ("Defend from two", r"\bpull(s|ing)? from two\b|\bfrom two enemies\b"),
    ("summoning Boon", r"\bsummoning Boons?\b|\bSummons Boon\b"),
    ("roles and schools", r"\b(14|fourteen) roles\b|\b(15|fifteen) schools\b"),
    # 16 Oct: Resolve, Confidence, threads
    ("Spark", r"\bSparks?\b"),
    ("GM trouble", r"\b(offers?|offered|take|turn(s|ed)? down|taking) (you )?(the )?trouble\b|\btrouble\b.*\bSpark\b|\bonce a session each\b"),
    ("heal die", r"\bheal dice?\b"),
    ("connections", r"\bconnections?\b"),
    ("Confidence from Titles", r"\b(every|each) Title makes your Confidence\b|\bthree live\b|\bConfidence (is|is a|are) (one )?size bigger\b|\ball your Confidence\b"),
    ("opportunity", r"\bmake an opportunity\b|\bmaking an opportunity\b"),
    ("fear check", r"\bfear checks?\b"),
    ("Confidence past d12", r"\bConfidence\b.*\bpast d12\b|\bpast d12\b.*\bConfidence\b"),
    # 24 Oct: Defend, wounds, multipliers, factions
    ("Armour die", r"\b(your|her|his|their|my|its) Armour\b|\bArmour (die|dice|roll|rolls|steps?|d\d+)\b|\bArmour['’]s (a|an|the|only|already) \b|\bstep(s|ped|ping)? (your |her |his |their )?Armour\b|\bArmour a size\b"),
    ("one defence roll", r"\bone defence roll\b|\bone roll of your (Armour|Defend)\b|\bstands against everything\b"),
    ("Hurt track", r"\bHurt (track|bars?|box|boxes)\b|\b(clear|clears|cleared|clearing|fill|fills|filled|filling) (a|one|the|that many|two|her|his|their|your|every) (box|boxes|bar|bars)\b|\bloose boxes\b|\bbars? of three\b"),
    ("Hurt Catch", r"\bHurt Catch(es)?\b|\bCatch(es)? on (your|her|his|their) Hurt\b|\bheal(s|ed)? (a|one|each) Catch\b"),
    ("Tough", r"\bTough\b|\bchip(s|ped|ping)?\b|\btakes? off (the number|what) it rolled\b"),
    ("take the hit", r"\b(take|takes|took|taking) the hit\b"),
    ("Wealth", r"\bWealth\b"),
    ("Standing", r"\bStanding\b(?! Army)"),
    ("party resources", r"\bparty resources?\b"),
    ("crew tag", r"\bcrew tags?\b"),
    # 26 Oct 2026
    ("spare resource", r"\bspare( crew)? resources?\b|\bspares\b|\b(a|the|its|one|no|two) spare\b(?! lockpick)"),
    ("party slot", r"\bparty slots?\b"),
    ("bury it", r"\b(bury|buries|burying) it\b"),
    ("debt thread", r"\(debt\)|\ba debt\)|\bas a debt\b|\bfourth thread\b"),
    ("Confidence doubled", r"(?<!n't )(?<!not )Confidence (counts|count) twice|(?<!n't )(?<!not )doubles? (your|their|her|his) Confidence|and so does your Confidence"),
    ("intercept fear", r"(?<!nobody )(?<!Nobody )(?<!nobody can )(?<!Nobody can )(?<!n't )(?<!can't )intercept(s|ing)? (the )?(fear|lies)|works on fear"),
    ("two-part permissions", r"\btwo parts\b|\bdescribing word\b|\bonly half a permission\b"),
    ("every set action it fits", r"\b(every|as many) set actions? it fits\b"),
    ("old Oracle", r"\bsteps? off (the |a )?(threats['’] )?telegraphs?\b|\bshrink(ing|s)? (the )?(threats['’] )?telegraphs\b"),
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
