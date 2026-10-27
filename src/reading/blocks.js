// The book's pieces that do something when you tap them (scripts/book-blocks.mjs
// draws them): a place's Scene, Telegraphs, Prep and Secret tabs, and a tag that
// says what it does. They're wired from the document, so they work the same in
// a chapter, in a sheet and in the deck's Read more.
//
// What each tag does comes with the chapter that uses it, in #tag-info
// ({ tags: { [name]: { k, d } }, links: { [k]: address } }), read off
// Appendix B by the build.
const KIND = {
  comes: "How it comes at you",
  keeps: "What keeps it going",
  weak: "A weak point",
  drives: "What drives it",
};
const tags = {};
const links = {};
let made = 0;

// What a page's #tag-info says, added to what's known.
export function addTags(script) {
  try {
    const data = JSON.parse(script?.textContent || "null");
    Object.assign(tags, data?.tags ?? {});
    Object.assign(links, data?.links ?? {});
  } catch {}
}

// Each tab row gets one stop for the Tab key, on the tab that's showing.
export function wireBlocks(root = document) {
  for (const row of root.querySelectorAll(".pl-tabs")) {
    for (const tab of row.querySelectorAll(".pl-tab")) tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
  }
}

let on = false;
export function enableBlocks() {
  if (on) return;
  on = true;
  addTags(document.getElementById("tag-info"));
  wireBlocks();
  document.addEventListener("click", (e) => {
    const tab = e.target.closest?.(".pl-tab");
    if (tab) return pick(tab);
    const tag = e.target.closest?.("button.tag[data-tag]");
    if (tag) explain(tag);
  });
  // On paper every part's there, Secrets too, and they're sealed again after.
  let sealed = [];
  addEventListener("beforeprint", () => {
    sealed = [...document.querySelectorAll("details.seal:not([open])")];
    for (const d of sealed) d.open = true;
  });
  addEventListener("afterprint", () => {
    for (const d of sealed) d.open = false;
    sealed = [];
  });
  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest?.(".pl-tab");
    if (!tab || e.altKey || e.ctrlKey || e.metaKey) return;
    const row = [...tab.closest(".pl-tabs").querySelectorAll(".pl-tab")];
    const i = row.indexOf(tab);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: row.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    pick(row[(to + row.length) % row.length], true);
  });
}

// Show a tab's part of the place. With the tabs stuck to the top of the
// screen, the part starts just under them rather than wherever the last one
// had scrolled to.
function pick(tab, focus = false) {
  const block = tab.closest(".pl");
  const row = tab.closest(".pl-tabs");
  if (!block || !row) return;
  for (const t of row.querySelectorAll(".pl-tab")) {
    const mine = t === tab;
    t.setAttribute("aria-selected", String(mine));
    t.tabIndex = mine ? 0 : -1;
  }
  let shown = null;
  for (const p of block.querySelectorAll(":scope > .pl-panel")) {
    const mine = p.dataset.tab === tab.dataset.tab;
    p.classList.toggle("on", mine);
    if (mine) shown = p;
  }
  if (focus) tab.focus();
  if (!shown || getComputedStyle(row).position !== "sticky" || row.closest(".zs")) return;
  const under = row.getBoundingClientRect().bottom;
  const top = shown.getBoundingClientRect().top;
  if (top < under - 1) window.scrollBy(0, top - under);
}

// A tag says what it does, under the row it's in, with the way to the Tag
// Reference. Tap it again, or another, to put it away.
function explain(tag) {
  const name = tag.dataset.tag;
  const info = tags[name];
  const row = tag.closest(".tags, .tele-at") ?? tag.parentElement;
  const open = tag.getAttribute("aria-expanded") === "true";
  for (const t of row.querySelectorAll("button.tag[aria-expanded='true']")) t.setAttribute("aria-expanded", "false");
  let box = row.nextElementSibling?.classList.contains("tagx") ? row.nextElementSibling : null;
  if (open || !info) {
    box?.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.className = "tagx";
    box.id = `tagx-${++made}`;
    row.after(box);
  }
  const head = document.createElement("p");
  head.className = "tagx-k";
  head.textContent = KIND[info.k] ?? "Tag";
  const does = document.createElement("p");
  const b = document.createElement("b");
  b.textContent = name;
  does.append(b, ` ${info.d}`);
  box.replaceChildren(head, does);
  if (links[info.k]) {
    const more = document.createElement("a");
    more.href = links[info.k];
    more.textContent = "More in the Tag Reference";
    box.append(more);
  }
  tag.setAttribute("aria-expanded", "true");
  tag.setAttribute("aria-controls", box.id);
}
