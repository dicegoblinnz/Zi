#!/usr/bin/env python3
"""One-off import: turn the 2 Oct 2026 rulebook HTML into the Markdown master.

Usage: python3 tools/import_book.py BOOK.html OUT_DIR FIGURE_DIR

Each chapter (an <h1> with an id) becomes OUT_DIR/NN-slug.md with front matter.
Special blocks become directives the site renders:
  :::example[Title]  :::rule  :::note  :::quote  :::sheet[Title]
  :::threat[Name]    :::place
Tables stay pipe tables. Heading ids stay as {#id} so links keep working.
Needs pandoc and BeautifulSoup.
"""
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

SRC, OUT, FIG = map(Path, sys.argv[1:4])
OUT.mkdir(parents=True, exist_ok=True)
FIG.mkdir(parents=True, exist_ok=True)

soup = BeautifulSoup(SRC.read_text(encoding="utf-8"), "html.parser")
main = soup.find("main")

PANDOC_TO = (
    "markdown+fenced_divs+pipe_tables+header_attributes"
    "-grid_tables-multiline_tables-simple_tables-bracketed_spans"
    "-native_spans-raw_attribute-smart-link_attributes-fenced_code_attributes"
)


def pandoc(html: str) -> str:
    res = subprocess.run(
        ["pandoc", "-f", "html", "-t", PANDOC_TO, "--wrap=none"],
        input=html, capture_output=True, text=True, check=True,
    )
    return res.stdout


def text(el) -> str:
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True))


figure_count = 0


def prepare(frag: Tag, slug: str) -> None:
    """Rewrite the book's special blocks into plain divs pandoc can carry."""
    global figure_count
    for tw in frag.select("div.tw"):
        tw.unwrap()
    for span in frag.find_all("span"):
        span.unwrap()
    # Step chips: a two-column table.
    for chips in frag.select("div.stepchips"):
        rows = []
        for b in chips.find_all("b"):
            die = b.next_sibling
            rows.append(f"<tr><td>{b.get_text()}</td><td>{str(die).strip()}</td></tr>")
        chips.replace_with(BeautifulSoup(
            "<table><thead><tr><th>Steps</th><th>Dice</th></tr></thead><tbody>"
            + "".join(rows) + "</tbody></table>", "html.parser"))
    # Oracle results: consecutive blocks become one table.
    groups, current = [], []
    for o in frag.select("div.oracle"):
        if current and o.find_previous_sibling() is not current[-1]:
            groups.append(current)
            current = []
        current.append(o)
    if current:
        groups.append(current)
    for g in groups:
        rows = "".join(
            "<tr><td><strong>{}</strong></td><td>{}</td><td>{}</td></tr>".format(
                text(o.select_one(".o-label")), text(o.select_one(".o-formula")),
                text(o.select_one(".o-meaning")))
            for o in g)
        table = BeautifulSoup(
            "<table><thead><tr><th>Result</th><th>The dice</th><th>What it means</th></tr></thead>"
            f"<tbody>{rows}</tbody></table>", "html.parser")
        g[0].replace_with(table)
        for o in g[1:]:
            o.decompose()
    # Figures: SVG out to a file, an image in its place.
    for fig in frag.select("figure.figure"):
        svg = fig.find("svg")
        figure_count += 1
        name = f"{slug}-{figure_count}.svg"
        if svg is not None:
            svg["xmlns"] = "http://www.w3.org/2000/svg"
            # BeautifulSoup lower-cases attributes; SVG needs viewBox.
            if svg.has_attr("viewbox"):
                svg["viewBox"] = svg["viewbox"]
                del svg["viewbox"]
            for pat in svg.find_all("pattern"):
                if pat.has_attr("patternunits"):
                    pat["patternUnits"] = pat["patternunits"]
                    del pat["patternunits"]
            (FIG / name).write_text(str(svg), encoding="utf-8")
            alt = svg.get("aria-label", "Figure")
        cap = fig.find("figcaption")
        caption = text(cap) if cap else ""
        new = BeautifulSoup(
            f'<p><img src="../figures/{name}" alt="{alt}"></p>'
            + (f"<p><em>{caption}</em></p>" if caption else ""), "html.parser")
        fig.replace_with(new)
    # The blank character sheet mock: its field labels as a list.
    for cs in frag.select("div.chsheet"):
        title = cs.find("h4")
        labels = [text(l) for l in cs.select(".lbl")]
        html = (f"<p><strong>{text(title)}</strong></p>" if title else "") + "<ul>" + "".join(
            f"<li>{l}</li>" for l in labels) + "</ul>"
        cs.replace_with(BeautifulSoup(f'<div class="sheet-fields">{html}</div>', "html.parser"))
    # Condition clouds: a line with a label.
    for tg in frag.select("div.tag-group"):
        label = text(tg.select_one(".tg-label"))
        tags = " · ".join(f"<em>{text(e)}</em>" for e in tg.select(".tag-cloud em"))
        tg.replace_with(BeautifulSoup(f"<p><strong>{label}</strong> {tags}</p>", "html.parser"))
    # Titled blocks: the h4 becomes the directive's label.
    for cls in ("example", "sheet", "beast"):
        for d in frag.select(f"div.{cls}"):
            h4 = d.find("h4", recursive=False)
            if h4 is not None:
                d["data-label"] = text(h4)
                h4.decompose()
    for q in frag.select("p.quote"):
        q.name = "div"
        q["class"] = ["quote"]
        inner = BeautifulSoup(f"<p>{q.decode_contents()}</p>", "html.parser")
        q.clear()
        q.append(inner)
    # Strip the line classes so pandoc writes plain paragraphs.
    for p in frag.select("p.s-line, p.bs-line, p.bs-sub, p.bs-secret, p.part-desc"):
        del p["class"]
    # Table cells with paragraphs or lists inside: flatten them so the
    # table stays a pipe table.
    for cell in frag.select("td, th"):
        if cell.find(["p", "ul", "ol", "br"]):
            for li in cell.find_all("li"):
                li.insert_after(NavigableString(" · "))
                li.unwrap()
            for lst in cell.find_all(["ul", "ol"]):
                lst.unwrap()
            for p in cell.find_all("p"):
                p.insert_after(NavigableString(" "))
                p.unwrap()
            for br in cell.find_all("br"):
                br.replace_with(NavigableString(" · "))
    for t in frag.find_all(["table", "col", "colgroup", "tr"]):
        for a in ("class", "style"):
            if t.has_attr(a):
                del t[a]
    for cg in frag.find_all("colgroup"):
        cg.decompose()


DIRECTIVE = re.compile(r"^(:{3,})\s*\{([^}]*)\}\s*$|^(:{3,})\s*([A-Za-z-]+)\s*$")


def post(md: str) -> str:
    """Pandoc fenced divs to :::name[label] directives, and tidy-ups."""
    out = []
    for line in md.split("\n"):
        m = DIRECTIVE.match(line)
        if m:
            if m.group(2) is not None:
                attrs = m.group(2)
                cls = re.findall(r"\.([A-Za-z-]+)", attrs)
                label = re.search(r'label="([^"]*)"', attrs)
                name = {"beast": "threat"}.get(cls[0], cls[0]) if cls else "box"
                lab = f"[{label.group(1)}]" if label else ""
                out.append(f":::{name}{lab}")
            else:
                name = {"beast": "threat"}.get(m.group(4), m.group(4))
                out.append(f":::{name}")
            continue
        if re.match(r"^:{3,}\s*$", line):
            out.append(":::")
            continue
        out.append(line)
    md = "\n".join(tidy_table(l) for l in out)
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = md.replace(" · ·", " ·").replace("  ·", " ·")
    return md.strip() + "\n"


def tidy_table(line: str) -> str:
    """Collapse pandoc's column padding in pipe tables."""
    if not line.startswith("|"):
        return line
    cells = re.split(r"(?<!\\)\|", line)[1:-1]
    cells = [c.strip() for c in cells]
    if all(re.fullmatch(r":?-+:?", c) for c in cells if c):
        cells = [("" if not c.startswith(":") else ":") + "---" + (":" if c.endswith(":") and len(c) > 1 else "") for c in cells]
    cells = [re.sub(r"\s*·\s*$", "", c) for c in cells]
    return "| " + " | ".join(cells) + " |"


def slugify(s: str) -> str:
    s = s.lower().replace("&", "and")
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


# Walk main: collect chapters, remembering the current part.
chapters = []
part = None
front = []
current = None
for el in main.children:
    if isinstance(el, NavigableString):
        continue
    if el.name == "section" and "part" in (el.get("class") or []):
        part = {
            "num": text(el.select_one(".part-num")),
            "name": text(el.find("h1")),
            "desc": text(el.select_one(".part-desc")) if el.select_one(".part-desc") else "",
        }
        continue
    if el.name == "h1" and el.get("id"):
        current = {"id": el["id"], "title": text(el), "part": part, "els": []}
        chapters.append(current)
        continue
    if el.name in ("h1",) and "doc-title" in (el.get("class") or []):
        continue
    if current is None:
        front.append(el)
    else:
        current["els"].append(el)

written = []
for i, ch in enumerate(chapters):
    slug = slugify(ch["title"])
    frag = BeautifulSoup("<div id='root'></div>", "html.parser")
    root = frag.find(id="root")
    els = ch["els"]
    if i == 0:
        # The title page's practical note goes at the top of the Welcome.
        els = [e for e in front if "note" in (e.get("class") or [])] + els
    for e in els:
        root.append(e)
    prepare(root, slug)
    body = post(pandoc(root.decode_contents()))
    p = ch["part"]
    fm = ["---", f'title: "{ch["title"]}"', f"id: {ch['id']}", f"order: {i + 1}"]
    if p:
        fm += [f'part: "{p["name"]}"', f'partNumber: "{p["num"]}"']
    fm += ["source: 2026-10-02 rulebook", "---", ""]
    name = f"{i + 1:02d}-{slug}.md"
    (OUT / name).write_text("\n".join(fm) + body, encoding="utf-8")
    written.append((name, len(body.split())))

parts_seen = {}
for ch in chapters:
    if ch["part"]:
        parts_seen[ch["part"]["name"]] = ch["part"]
(OUT / "_parts.yaml").write_text(
    "\n".join(
        f'- name: "{p["name"]}"\n  number: "{p["num"]}"\n  description: "{p["desc"]}"'
        for p in parts_seen.values()) + "\n", encoding="utf-8")

for name, words in written:
    print(f"{words:7d}  {name}")
print(len(written), "chapters,", figure_count, "figures")
