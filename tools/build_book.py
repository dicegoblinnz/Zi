#!/usr/bin/env python3
"""Build a one-page reading copy of the whole rulebook from the master.

Usage: python3 tools/build_book.py OUT.html

The change log comes first, then every chapter in book order, with a
contents list, search and the dice ladder. It's a reading copy, so it's
built fresh from content/ every time and never edited by hand.
Needs pandoc, BeautifulSoup and PyYAML.
"""
import base64
import datetime
import html
import re
import subprocess
import sys
from pathlib import Path

import yaml
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "zidara-rules.html"

PANDOC_FROM = "markdown-auto_identifiers+fenced_divs+pipe_tables+header_attributes+smart"
DIRECTIVE = re.compile(r"^:::\s*([A-Za-z-]+)(?:\[([^\]]*)\])?(?:\{#([A-Za-z0-9_-]+)\})?\s*$")

BOX_LABELS = {
    "example": "Example",
    "rule": "Rule",
    "note": "Note",
    "sheet": "",
    "threat": "Threat",
    "place": "Place",
}


def split_front(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        meta = yaml.safe_load(text[3:end])
        return meta or {}, text[end + 4:].lstrip("\n")
    return {}, text


def directives_to_divs(md):
    """:::name[label]{#id} becomes a pandoc fenced div."""
    out = []
    for line in md.split("\n"):
        m = DIRECTIVE.match(line)
        if m:
            name, label, ident = m.groups()
            attrs = []
            if ident:
                attrs.append(f"#{ident}")
            attrs.append(f".{name}")
            if label:
                safe = label.replace("\\", "\\\\").replace('"', '\\"')
                attrs.append(f'data-label="{safe}"')
            out.append("::: {" + " ".join(attrs) + "}")
        else:
            out.append(line)
    return "\n".join(out)


def to_html(md):
    res = subprocess.run(
        ["pandoc", "-f", PANDOC_FROM, "-t", "html5", "--wrap=none"],
        input=directives_to_divs(md), capture_output=True, text=True, check=True)
    return res.stdout


def label_markup(soup, text):
    """A label can carry inline Markdown-ish italics; keep it simple."""
    frag = BeautifulSoup(to_html(text).strip(), "html.parser")
    p = frag.find("p")
    return p.decode_contents() if p else html.escape(text)


def finish(fragment):
    soup = BeautifulSoup(fragment, "html.parser")
    for div in soup.find_all("div"):
        classes = div.get("class") or []
        kind = next((c for c in classes if c in BOX_LABELS), None)
        if kind is None:
            continue
        label = div.get("data-label", "")
        if div.has_attr("data-label"):
            del div["data-label"]
        div["class"] = ["box", f"box-{kind}"]
        eyebrow = BOX_LABELS[kind]
        if kind == "quote":
            continue
        if label or eyebrow:
            head = soup.new_tag("p", attrs={"class": "box-label"})
            if eyebrow:
                tag = soup.new_tag("span", attrs={"class": "box-kind"})
                tag.string = eyebrow
                head.append(tag)
            if label:
                name = BeautifulSoup(f'<span class="box-name">{label_markup(soup, label)}</span>', "html.parser")
                head.append(name)
            div.insert(0, head)
    for div in soup.find_all("div", class_="quote"):
        div["class"] = ["box", "box-quote"]
    # Figures: inline the SVG so the page carries everything it needs.
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if src.startswith("../figures/"):
            path = CONTENT / "figures" / src.split("/")[-1]
            data = base64.b64encode(path.read_bytes()).decode()
            img["src"] = f"data:image/svg+xml;base64,{data}"
            img["loading"] = "lazy"
    # Wide tables scroll in their own box.
    for table in soup.find_all("table"):
        wrap = soup.new_tag("div", attrs={"class": "table-wrap"})
        table.wrap(wrap)
    return str(soup)


def heading_list(fragment):
    soup = BeautifulSoup(fragment, "html.parser")
    return [(h["id"], h.get_text(" ", strip=True)) for h in soup.find_all("h2") if h.get("id")]


def main():
    parts = {p["number"]: p for p in yaml.safe_load((CONTENT / "rules" / "_parts.yaml").read_text())}
    chapters = []
    for f in sorted((CONTENT / "rules").glob("*.md")):
        meta, body = split_front(f.read_text(encoding="utf-8"))
        chapters.append((float(meta.get("order", 999)), meta, body))
    chapters.sort(key=lambda c: c[0])

    meta_c, body_c = split_front((CONTENT / "changes.md").read_text(encoding="utf-8"))
    sections = [("changes", meta_c.get("title", "What's Changed"), None, finish(to_html(body_c)))]
    for _, meta, body in chapters:
        sections.append((meta["id"], meta["title"], meta.get("partNumber"), finish(to_html(body))))

    # Contents
    toc = ['<nav class="toc" aria-label="Contents"><ol class="toc-list">']
    current_part = "start"
    for ident, title, part, frag in sections:
        if part != current_part and part:
            p = parts.get(part, {})
            toc.append(f'<li class="toc-part"><span>{html.escape(part)}</span> {html.escape(p.get("name", ""))}</li>')
        current_part = part
        subs = heading_list(frag)
        sub_html = "".join(
            f'<li><a href="#{i}">{html.escape(t)}</a></li>' for i, t in subs)
        toc.append(
            f'<li class="toc-chapter" data-chapter="{ident}"><details><summary><a href="#{ident}">{html.escape(title)}</a></summary>'
            f'<ol class="toc-sub">{sub_html}</ol></details></li>')
    toc.append("</ol></nav>")

    body = []
    current_part = "start"
    for ident, title, part, frag in sections:
        if part != current_part and part:
            p = parts.get(part, {})
            body.append(
                f'<div class="part-band"><p class="part-num">{html.escape(part)}</p>'
                f'<p class="part-name">{html.escape(p.get("name", ""))}</p>'
                f'<p class="part-desc">{html.escape(p.get("description", ""))}</p></div>')
        current_part = part
        body.append(f'<section class="chapter" id="{ident}"><h1>{html.escape(title)}</h1>{frag}</section>')

    stamp = datetime.date.today().strftime("%-d %b %Y")
    template = (ROOT / "tools" / "book_template.html").read_text(encoding="utf-8")
    page = (template.replace("{{TOC}}", "\n".join(toc))
            .replace("{{BODY}}", "\n".join(body))
            .replace("{{STAMP}}", stamp))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page, encoding="utf-8")
    words = len(re.sub(r"<[^>]+>", " ", "\n".join(body)).split())
    print(f"{OUT}  {len(page) // 1024} KB, {len(sections)} sections, about {words:,} words")


if __name__ == "__main__":
    main()
