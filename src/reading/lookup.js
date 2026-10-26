// A chapter as a look-up page: short sections, each with a bookmark, a strip
// that follows you down showing where you are (tap it for the chapter's
// contents), Carry on reading when you've been here before, and pop-ups on
// the links. Where you're up to is saved as you read (src/reading/store.js).
import { enablePopups, jump } from "./popups.js";
import { closeSheet, openSheet } from "./sheet.js";
import { isMarked, placeIn, setPlace, toggleMark } from "./store.js";

const article = document.querySelector("[data-chapter]");
if (article) look(article);

function look(article) {
  const slug = article.dataset.chapter;
  const chapter = article.dataset.title;
  const heads = [...article.querySelectorAll(".rs-head > h2[id], .rs-head > h3[id]")];
  const nameOf = (h) => h.textContent.replace(/\s*New · \d+ \w+$/, "").trim();
  const strip = document.querySelector(".rs-strip");
  const where = strip?.querySelector(".rs-sec");
  const label = strip?.querySelector(".rs-ch");
  const line = strip?.querySelector(".rs-line i");
  const toc = document.getElementById("rs-toc");
  const carry = article.querySelector(".rs-carry");
  const rail = [...document.querySelectorAll(".rail .toc .sub a[href^='#']")];
  enablePopups();

  // Bookmarks, one on every section.
  const markOf = (b) => ({ k: "sec", slug, id: b.dataset.mark, t: nameOf(document.getElementById(b.dataset.mark)), c: chapter });
  const showMarks = () => {
    for (const b of article.querySelectorAll(".rs-mark")) b.setAttribute("aria-pressed", String(isMarked(markOf(b))));
    for (const a of toc?.querySelectorAll("a[data-s]") ?? []) a.classList.toggle("is-marked", isMarked({ k: "sec", slug, id: a.dataset.s }));
  };
  showMarks();
  article.addEventListener("click", (e) => {
    const b = e.target.closest(".rs-mark");
    if (!b) return;
    b.setAttribute("aria-pressed", String(toggleMark(markOf(b))));
    b.classList.remove("is-new");
    void b.offsetWidth;
    b.classList.add("is-new");
    showMarks();
  });

  // Where you are: the last heading above the strip's bottom edge.
  let current = null;
  let saving = 0;
  // A jump to a section leaves its heading at the page's scroll padding, just
  // under the strip, so a heading that far down counts as where you are.
  const edge = () => {
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const r = strip?.getBoundingClientRect();
    return Math.max(r && r.height ? r.bottom : 0, pad) + 16;
  };
  const save = () => {
    clearTimeout(saving);
    saving = 0;
    if (current) setPlace(slug, current.id, nameOf(current), chapter);
  };
  function update() {
    const y = edge();
    let now = null;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= y) now = h;
      else break;
    }
    const box = article.getBoundingClientRect();
    const run = Math.max(1, box.height - innerHeight + y);
    if (line) line.style.transform = `scaleX(${Math.min(1, Math.max(0, (y - box.top) / run))})`;
    if (now === current) return;
    current = now;
    if (where) where.textContent = now ? nameOf(now) : `${heads.length} sections`;
    if (label) label.textContent = now ? chapter : "Contents";
    if (strip) strip.classList.toggle("is-in", Boolean(now));
    const top = now?.tagName === "H3" ? now.closest(".rs-2")?.querySelector(".rs-head > h2") : now;
    for (const a of rail) {
      if (top && a.getAttribute("href") === `#${top.id}`) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    if (carry && !carry.hidden && now && heads.indexOf(now) >= heads.findIndex((h) => h.id === carry.dataset.to)) carry.hidden = true;
    if (now) {
      clearTimeout(saving);
      saving = setTimeout(save, 700);
    }
  }
  let ticking = false;
  const tick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  addEventListener("pagehide", () => saving && save());
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && saving && save());

  // Carry on reading, when you've been part way through before and haven't
  // come in at a section of your own.
  const saved = placeIn(slug);
  const target = saved && document.getElementById(saved.id);
  if (carry && target && !location.hash && heads.indexOf(target) > 0) {
    carry.href = `#${saved.id}`;
    carry.dataset.to = saved.id;
    carry.querySelector("b").textContent = nameOf(target);
    carry.hidden = false;
    carry.addEventListener("click", (e) => {
      e.preventDefault();
      carry.hidden = true;
      jump(`#${saved.id}`);
    });
  }
  update();

  // The strip opens the chapter's contents, with where you are marked.
  strip?.querySelector(".rs-where")?.addEventListener("click", () => {
    if (!toc) return;
    for (const a of toc.querySelectorAll("a[data-s]")) a.removeAttribute("aria-current");
    const here = current && toc.querySelector(`a[data-s="${current.id}"]`);
    here?.setAttribute("aria-current", "location");
    openSheet(toc);
    here?.scrollIntoView({ block: "center" });
  });
  toc?.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-s]");
    if (!a) return;
    e.preventDefault();
    closeSheet(toc, () => jump(`#${a.dataset.s}`));
  });
}
