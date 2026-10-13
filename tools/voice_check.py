#!/usr/bin/env python3
"""Voice check for Zi'Dara writing (from the zi-voice guide).

Usage: python3 tools/voice_check.py FILE.md [FILE.md ...] [--lines]

It's a pointer, not a judge. Tables, front matter and directive lines are
skipped. Read the flagged lines and use judgement: quoted in-world lines
and permission examples are fine.
"""
import re
import sys

FLAGS = {
    "em dashes": r"—",
    "semicolons": r";",
    "exclamation marks": r"!(?!\[)",
    "stiff phrases": r"\b(do|does|did|is|are|was|were|will|would|should|could|has|have) not\b|\bcannot\b|\bI am\b",
    "slogan closers": r"\b(That|This) (is|'s|’s) the (whole|point|gamble|trick|rule|secret)\b",
    "hype and filler": r"\b(epic|genuinely|truly|crucially|ultimately|essentially|seamless|delve|tapestry|testament|at its heart|let's dive)\b",
    "note boxes": r"Mo['’]s note",
}


def prose_lines(text):
    in_fm = False
    for n, line in enumerate(text.split("\n"), 1):
        if n == 1 and line.strip() == "---":
            in_fm = True
            continue
        if in_fm:
            if line.strip() == "---":
                in_fm = False
            continue
        s = line.strip()
        if not s or s.startswith("|") or s.startswith(":::") or s.startswith("#"):
            continue
        # Drop link targets and inline code before checking.
        s = re.sub(r"\]\([^)]*\)", "]", s)
        s = re.sub(r"`[^`]*`", "", s)
        yield n, s


def check(path, show_lines):
    text = open(path, encoding="utf-8").read()
    lines = list(prose_lines(text))
    body = " ".join(s for _, s in lines).replace("’", "'")
    words = len(re.findall(r"\b\w+\b", body)) or 1
    contractions = len(re.findall(r"\b\w+(n't|'re|'ll|'ve|'m|'d)\b|\b(it|that|there|what|he|she|let)'s\b", body, re.I))
    print(f"== {path}  ({words} words of prose)")
    for name, pat in FLAGS.items():
        hits = [(n, s) for n, s in lines if re.search(pat, s.replace("’", "'"), re.I if name != "slogan closers" else 0)]
        print(f"  {name:<20}{len(hits):>5}")
        if show_lines:
            for n, s in hits[:40]:
                print(f"      {n}: {s[:160]}")
    print(f"  {'contractions':<20}{contractions:>5}  ({contractions * 1000 / words:.0f} per 1,000 words, aim 25 to 35)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for p in args:
        check(p, "--lines" in sys.argv)
