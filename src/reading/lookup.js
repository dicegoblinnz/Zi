// A chapter, read two ways (Mo's 28 Oct pick, notes/reading-28oct.md).
//
// On a phone, 900px wide and under, it opens on its contents: the opening's
// first lines, Carry on reading, and a row for every section, or a card for
// every place with Roll a d20. Tap one and it opens on its own, with a bar
// along the top saying where you are and how far through, and you swipe, or
// tap Next at the bottom, from one section to the next. The address says
// which section's open, so Back, a bookmark, a search result and a link all
// land on it, and the bar's Contents goes back to the contents.
//
// On a laptop it's one page with the contents down the side, which marks the
// section you're in as you scroll.
//
// Both keep where you're up to, what you've read to the end and your
// bookmarks on this phone (store.js), and both have the pop-ups (popups.js)
// and the places' tabs and tags that say what they do (blocks.js).
import { enableBlocks } from "./blocks.js";
import { enablePopups, setJump } from "./popups.js";
import { doneIn, isMarked, placeIn, setDone, setPlace, toggleMark } from "./store.js";

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const article = document.querySelector("article[data-chapter]");
if (article) {
  enablePopups();
  enableBlocks();
  if (article.querySelector(".hub")) {
    try {
      reader(article);
    } catch (e) {
      document.documentElement.classList.remove("rd-on", "rd-open", "rd-live");
      throw e;
    }
  }
}

function reader(article) {
  const root = document.documentElement;
  const slug = article.dataset.chapter;
  const chapter = article.dataset.title;
  const hub = article.querySelector(".hub");
  const track = article.querySelector(".rd-track");
  const pages = [...track.children].filter((n) => n.matches("section.rs") && n.dataset.skip !== "true");
  const heads = [...track.querySelectorAll(".rs-head > h2[id], .rs-head > h3[id]")];
  const rows = new Map([...hub.querySelectorAll(".hub-row")].map((li) => [li.dataset.s, li]));
  const rail = [...document.querySelectorAll(".rail .toc .sub a[href^='#']")];
  const bar = document.querySelector(".rd-top");
  const count = bar.querySelector(".rd-count");
  const title = bar.querySelector(".rd-title");
  const ribbon = bar.querySelector(".rd-mark");
  const segs = bar.querySelector(".rd-segs");
  const foot = document.querySelector(".rd-foot");
  const before = foot.querySelector(".rd-prev");
  const after = foot.querySelector(".rd-next");
  const peek = document.querySelector(".rd-peek");
  const nextChapter = document.querySelector(".pager .next");
  const carry = hub.querySelector(".hub-carry");
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = matchMedia("(max-width: 900px)");
  const plain = (e) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

  const nameOf = (h) => (h ? h.textContent.replace(/\s*New · \d+ \w+$/, "").trim() : "");
  const headOf = (page) => page.querySelector(":scope > .rs-head > h2, :scope > .rs-head > h3");
  const opens = pages[0]?.dataset.s === "opening";
  const titleOf = (page) => (page.dataset.s === "opening" ? "Opening" : nameOf(headOf(page)));
  const countOf = (i) => (opens && i === 0 ? "Opening" : `${i + (opens ? 0 : 1)} of ${pages.length - (opens ? 1 : 0)}`);
  segs.replaceChildren(...pages.map(() => document.createElement("i")));

  let phone = narrow.matches;
  const deep = location.hash.length > 1 && location.hash !== "#main"; // came in at a section
  let at = -1; // the section open on a phone, or -1 for the contents
  let shown = null; // the address the reader last drew
  let hubY = 0; // how far down the contents you were

  // Which section an address opens, and what in it to go to. An address
  // inside the opening the contents already show is the contents.
  function resolve(hash) {
    let id = "";
    try {
      id = hash && hash.length > 1 ? decodeURIComponent(hash.slice(1)) : "";
    } catch {}
    if (!id) return { i: -1 };
    const direct = pages.findIndex((p) => p.dataset.s === id);
    if (direct >= 0) return { i: direct, target: null };
    const el = document.getElementById(id);
    const page = el && track.contains(el) ? el.closest(".rd-track > section.rs") : null;
    const i = page ? pages.indexOf(page) : -1;
    return i >= 0 ? { i, target: el } : { i: -1 };
  }

  // Bookmarks: one on every section, and the bar's for the section that's open.
  const markOf = (id) => ({ k: "sec", slug, id, t: id === "opening" ? "Opening" : nameOf(document.getElementById(id)), c: chapter });
  function showMarks() {
    for (const b of track.querySelectorAll(".rs-mark")) b.setAttribute("aria-pressed", String(isMarked({ k: "sec", slug, id: b.dataset.mark })));
    for (const [id, li] of rows) li.classList.toggle("is-marked", isMarked({ k: "sec", slug, id }));
    if (at >= 0) ribbon.setAttribute("aria-pressed", String(isMarked({ k: "sec", slug, id: pages[at].dataset.s })));
  }
  function flip(button, id) {
    button.setAttribute("aria-pressed", String(toggleMark(markOf(id))));
    button.classList.remove("is-new");
    void button.offsetWidth;
    button.classList.add("is-new");
    showMarks();
  }
  track.addEventListener("click", (e) => {
    const b = e.target.closest(".rs-mark");
    if (b) flip(b, b.dataset.mark);
  });
  ribbon.addEventListener("click", () => at >= 0 && flip(ribbon, pages[at].dataset.s));

  // Read to the end, and where you're up to.
  const read = new Set(doneIn(slug));
  function done(page) {
    const id = page.dataset.s;
    if (read.has(id)) return;
    read.add(id);
    setDone(slug, id);
    const i = pages.indexOf(page);
    if (i >= 0 && i !== at) segs.children[i].className = "done";
  }
  let kept = null;
  let saving = 0;
  let pending = null;
  const save = () => {
    clearTimeout(saving);
    saving = 0;
    if (pending) setPlace(slug, pending.id, pending.t, chapter);
    pending = null;
  };
  const keep = (id, t, now = false) => {
    kept = id;
    pending = { id, t };
    clearTimeout(saving);
    saving = now ? 0 : setTimeout(save, 700);
    if (now) save();
  };
  addEventListener("pagehide", () => saving && save());
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && saving && save());

  // The contents: what you've read, where you're up to, your bookmarks.
  function drawHub() {
    const saved = placeIn(slug);
    const here = saved ? resolve(`#${saved.id}`) : { i: -1 };
    const hereId = here.i >= 0 ? pages[here.i].dataset.s : null;
    for (const [id, li] of rows) {
      li.classList.toggle("is-done", read.has(id));
      li.classList.toggle("is-here", id === hereId);
      // What the tick and the ribbon say, for a screen reader.
      const said = [read.has(id) && "read", isMarked({ k: "sec", slug, id }) && "bookmarked"].filter(Boolean).join(", ");
      let sr = li.querySelector(".hub-sr");
      if (said && !sr) {
        sr = document.createElement("span");
        sr.className = "hub-sr visually-hidden";
        li.querySelector(".hub-t").append(sr);
      }
      if (sr) sr.textContent = said ? ` (${said})` : "";
      const tag = li.querySelector(".hub-here");
      if (id === hereId && !tag) {
        const t = document.createElement("span");
        t.className = "hub-here";
        t.textContent = "Up to here";
        li.querySelector(".hub-t b").after(t);
      } else if (id !== hereId) tag?.remove();
    }
    if (saved && here.i >= 0 && (phone || (!carry.dataset.used && !deep))) {
      carry.href = `#${saved.id}`;
      carry.querySelector("b").textContent = saved.t;
      carry.hidden = false;
    } else carry.hidden = true;
    showMarks();
  }

  // ── On a phone: a section at a time.
  function show(i, { target = null, how = "none", focus = true } = {}) {
    const page = pages[i];
    if (!page) return;
    if (at < 0 && !root.classList.contains("rd-open")) hubY = scrollY;
    const fromHub = at < 0;
    at = i;
    for (const p of pages) {
      p.classList.toggle("is-on", p === page);
      p.style.transform = "";
      p.style.opacity = "";
    }
    root.classList.add("rd-open");
    fit();
    const hash = `#${target?.id || page.dataset.s}`;
    if (how === "push") history.pushState({ rd: 1, hub: fromHub }, "", hash);
    else if (how === "replace") history.replaceState({ ...(history.state ?? {}), rd: 1 }, "", hash);
    shown = location.hash;

    count.textContent = countOf(i);
    title.textContent = titleOf(page);
    [...segs.children].forEach((s, k) => (s.className = k === i ? "cur" : read.has(pages[k].dataset.s) ? "done" : ""));
    const prev = pages[i - 1];
    const next = pages[i + 1];
    label(before, prev ? `#${prev.dataset.s}` : location.pathname, prev ? "Before" : "Back to", prev ? titleOf(prev) : "Contents");
    if (next) label(after, `#${next.dataset.s}`, "Next", titleOf(next));
    else if (nextChapter) label(after, nextChapter.getAttribute("href"), "Next chapter", nextChapter.lastChild.textContent.trim());
    after.hidden = !next && !nextChapter;
    showMarks();

    if (target && target !== headOf(page)) target.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
    if (focus) {
      const h = headOf(page) ?? page;
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
    keep(target?.matches?.("h2[id], h3[id]") ? target.id : page.dataset.s, target?.matches?.("h2[id], h3[id]") ? nameOf(target) : titleOf(page), true);
    look();
  }
  // The bar's as tall as its text makes it, so the section starts under it.
  function fit() {
    const h = bar.offsetHeight;
    if (h) root.style.setProperty("--rd-h", `${h}px`);
  }
  addEventListener("resize", () => at >= 0 && fit());

  function label(a, href, kind, name) {
    a.href = href;
    a.querySelector("span").textContent = kind;
    a.querySelector("b").textContent = name;
  }

  function toHub({ how = "none", from = at, slide = false } = {}) {
    const left = from >= 0 ? pages[from] : null;
    at = -1;
    for (const p of pages) p.classList.remove("is-on");
    root.classList.remove("rd-open");
    if (how === "replace") history.replaceState(null, "", location.pathname + location.search);
    shown = location.hash;
    drawHub();
    if (!left) return;
    window.scrollTo(0, hubY);
    const row = rows.get(left.dataset.s);
    if (row) {
      const r = row.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) row.scrollIntoView({ block: "center" });
      row.querySelector("a").focus({ preventScroll: true });
    }
    if (slide && !still()) hub.animate([{ transform: "translateX(-56px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: EASE });
  }
  // Back to the contents: the page before this one, if that's where you came from.
  function backToHub(slide = false) {
    if (history.state?.hub) {
      slid = slide;
      history.back();
    } else toHub({ how: "replace", slide });
  }
  let slid = false;

  function turn(dir) {
    const to = at + dir;
    if (to < 0) return backToHub(true);
    if (to >= pages.length) return;
    if (dir > 0) done(pages[at]);
    show(to, { how: "replace" });
    if (!still()) pages[to].animate([{ transform: `translateX(${dir * 56}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: EASE });
  }

  // The address changed: Back, Forward, or a link to somewhere in this chapter.
  function sync() {
    if (!phone || location.hash === shown) return;
    // Skip to the page is for the keyboard, and leaves you where you are.
    if (location.hash === "#main") {
      shown = location.hash;
      return;
    }
    const { i, target } = resolve(location.hash);
    if (i >= 0) return show(i, { target });
    if (at >= 0) {
      toHub({ slide: slid });
      slid = false;
    } else shown = location.hash;
  }
  addEventListener("popstate", sync);
  addEventListener("hashchange", sync);

  // A row on the contents opens its section, and Back comes back here. A link
  // in the opening's lines pops up like any other.
  hub.addEventListener("click", (e) => {
    const a = e.target.closest(".hub-row a, a.hub-carry, .hub-rolled a, .whats-new a[href^='#']");
    if (!a || !phone || plain(e)) return;
    const { i, target } = resolve(a.getAttribute("href"));
    if (i < 0) return;
    e.preventDefault();
    if (a === carry) carry.dataset.used = "1";
    show(i, { target, how: "push" });
  });
  // Read more in a pop-up, for a section in this chapter.
  setJump((hash) => {
    if (!phone) return false;
    const { i, target } = resolve(hash);
    if (i < 0) return false;
    show(i, { target, how: "push" });
    return true;
  });
  bar.querySelector(".rd-back").addEventListener("click", (e) => {
    if (plain(e)) return;
    e.preventDefault();
    backToHub();
  });
  before.addEventListener("click", (e) => {
    if (plain(e) || at < 0) return;
    e.preventDefault();
    turn(-1);
  });
  after.addEventListener("click", (e) => {
    if (plain(e) || at < 0 || at >= pages.length - 1) return;
    e.preventDefault();
    turn(1);
  });
  addEventListener("keydown", (e) => {
    if (!phone || at < 0 || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.("input, select, textarea, [contenteditable], .pl-tabs") || document.querySelector("dialog[open]")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    turn(e.key === "ArrowRight" ? 1 : -1);
  });

  // Swiping: the section follows your finger sideways, and past a quarter of
  // the screen, or a flick, the next one or the one before comes in. Before
  // the first is the contents, and past the last it springs back. Up and down
  // is the browser's (touch-action in reading.css), and so is a table that
  // scrolls sideways or a long press choosing words.
  let drag = null;
  let hush = 0;
  const sideways = (el) => {
    for (let n = el; n && n !== track; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
    }
    return false;
  };
  track.addEventListener("pointerdown", (e) => {
    if (!phone || at < 0 || !e.isPrimary || e.pointerType === "mouse" || drag) return;
    if (e.target.closest("input, select, textarea") || sideways(e.target)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, live: false, trail: [] };
  });
  track.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.live) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) < 12) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.4 || e.timeStamp - drag.t > 500 || String(getSelection?.() ?? "").trim()) {
        drag = null;
        return;
      }
      drag.live = true;
      drag.x = e.clientX;
      try {
        track.setPointerCapture(e.pointerId);
      } catch {}
    }
    drag.dx = e.clientX - drag.x;
    drag.trail.push({ x: e.clientX, t: e.timeStamp });
    while (drag.trail.length > 2 && e.timeStamp - drag.trail[0].t > 100) drag.trail.shift();
    follow(drag.dx);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.live) return;
    hush = performance.now() + 120;
    const first = d.trail[0];
    const last = d.trail[d.trail.length - 1];
    const speed = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const dir = d.dx < 0 ? 1 : -1;
    const can = dir < 0 || at < pages.length - 1;
    const far = Math.abs(d.dx) > innerWidth * 0.25;
    const flick = Math.abs(d.dx) > 30 && Math.abs(speed) > 0.4 && Math.sign(speed) === Math.sign(d.dx);
    peek.classList.remove("on");
    if (e.type !== "pointercancel" && can && (far || flick)) leave(dir);
    else settle();
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);
  // A swipe that ended on a link or a button doesn't tap it too.
  track.addEventListener("click", (e) => {
    if (performance.now() >= hush) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  function follow(dx) {
    const page = pages[at];
    const dir = dx < 0 ? 1 : -1;
    const can = dir < 0 || at < pages.length - 1;
    const x = can ? dx : dx * 0.25;
    if (!still()) page.style.transform = `translateX(${x}px)`;
    page.style.opacity = String(1 - Math.min(1, Math.abs(x) / innerWidth) * 0.6);
    const to = pages[at + dir];
    if (!can || Math.abs(dx) < 24) return peek.classList.remove("on");
    peek.dataset.side = dir > 0 ? "next" : "prev";
    peek.querySelector("span").textContent = dir > 0 ? "Next" : to ? "Before" : "Back to";
    peek.querySelector("b").textContent = to ? titleOf(to) : "Contents";
    peek.style.opacity = String(Math.min(1, (Math.abs(dx) - 24) / 72));
    peek.classList.add("on");
  }
  function settle() {
    const page = pages[at];
    const from = page.style.transform;
    const o = page.style.opacity;
    page.style.transform = "";
    page.style.opacity = "";
    if (!still() && (from || o)) page.animate([{ transform: from || "none", opacity: o || 1 }, { transform: "none", opacity: 1 }], { duration: 240, easing: EASE });
  }
  function leave(dir) {
    const page = pages[at];
    const go = () => {
      page.style.transform = "";
      page.style.opacity = "";
      turn(dir);
    };
    if (still()) return go();
    const out = page.animate(
      [{ transform: page.style.transform || "none", opacity: page.style.opacity || 1 }, { transform: `translateX(${-dir * innerWidth}px)`, opacity: 0 }],
      { duration: 170, easing: EASE, fill: "forwards" },
    );
    out.onfinish = () => {
      out.cancel();
      go();
    };
  }

  // ── On a laptop, and inside a section on a phone: the heading you're in.
  let current = null;
  function look() {
    if (phone) {
      if (at < 0) return;
      const page = pages[at];
      const y = bar.getBoundingClientRect().bottom + 16;
      let now = null;
      for (const h of page.querySelectorAll(".rs-head > h3[id]")) {
        if (h.getBoundingClientRect().top <= y) now = h;
      }
      const id = now?.id ?? page.dataset.s;
      if (id !== kept) keep(id, now ? nameOf(now) : titleOf(page));
      if (page.getBoundingClientRect().bottom <= innerHeight + 2) done(page);
      return;
    }
    const y = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 16;
    let now = null;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= y) now = h;
      else break;
    }
    if (now === current) return;
    // A section you've scrolled past is read.
    if (current && now && heads.indexOf(now) > heads.indexOf(current)) {
      const page = current.closest(".rd-track > section.rs");
      if (page && page !== now.closest(".rd-track > section.rs")) done(page);
    }
    current = now;
    const top = now?.closest(".rd-track > section.rs")?.dataset.s;
    for (const a of rail) {
      if (top && a.getAttribute("href") === `#${top}`) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    // While Carry on reading's showing, looking over the start of the chapter
    // doesn't lose your place: it's kept till you tap it or read past it.
    const saved = placeIn(slug);
    const to = saved ? heads.findIndex((h) => h.id === saved.id) : -1;
    if (!carry.hidden && now && heads.indexOf(now) >= to) carry.hidden = true;
    if (now && carry.hidden) keep(now.id, nameOf(now));
  }
  let ticking = false;
  const tick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      look();
    });
  };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  carry.addEventListener("click", () => {
    carry.dataset.used = "1";
    if (!phone) carry.hidden = true;
  });

  // Roll a d20 for a place: the number comes up, and its card's picked out.
  const roll = hub.querySelector(".hub-d20");
  if (roll) {
    const out = hub.querySelector(".hub-rolled");
    const cards = [...hub.querySelectorAll(".hub-place")];
    roll.hidden = false;
    let rolling = 0;
    roll.addEventListener("click", () => {
      const n = 1 + Math.floor(Math.random() * 20);
      const card = cards.find((c) => Number(c.dataset.n) === n);
      if (!card) return;
      clearInterval(rolling);
      const land = () => {
        clearInterval(rolling);
        const num = document.createElement("b");
        num.className = "n";
        num.textContent = String(n);
        num.setAttribute("aria-hidden", "true");
        const words = document.createElement("span");
        const eyebrow = document.createElement("span");
        eyebrow.className = "eyebrow";
        const said = document.createElement("span");
        said.className = "visually-hidden";
        said.textContent = ` ${n}:`;
        eyebrow.append("You rolled", said);
        const go = document.createElement("a");
        go.href = `#${card.dataset.s}`;
        go.dataset.noPop = "";
        go.textContent = card.querySelector(".hub-t b").textContent;
        words.append(eyebrow, " ", go);
        out.replaceChildren(num, words);
        out.classList.add("on");
        for (const c of cards) c.classList.toggle("is-rolled", c === card);
        if (phone) {
          const r = card.getBoundingClientRect();
          if (r.top < 0 || r.bottom > innerHeight) card.scrollIntoView({ block: "center", behavior: still() ? "auto" : "smooth" });
        }
      };
      if (still()) return land();
      let k = 0;
      rolling = setInterval(() => {
        if (++k > 6) return land();
        const num = document.createElement("b");
        num.className = "n is-rolling";
        num.setAttribute("aria-hidden", "true");
        num.textContent = String(1 + Math.floor(Math.random() * 20));
        out.replaceChildren(num);
        out.classList.add("on");
      }, 55);
    });
  }

  // Which way it's read, and switching when the screen turns or the window's
  // made narrower or wider.
  function start() {
    root.classList.add("rd-on");
    const { i, target } = resolve(location.hash);
    if (i >= 0) show(i, { target, focus: false });
    else {
      root.classList.remove("rd-open");
      shown = location.hash;
      drawHub();
    }
  }
  function desk() {
    const page = at >= 0 ? pages[at] : null;
    at = -1;
    for (const p of pages) {
      p.classList.remove("is-on");
      p.style.transform = "";
      p.style.opacity = "";
    }
    root.classList.remove("rd-on", "rd-open");
    drawHub();
    page?.scrollIntoView();
    current = null;
    look();
  }
  narrow.addEventListener("change", (e) => {
    phone = e.matches;
    if (phone) start();
    else desk();
  });
  root.classList.add("rd-live");
  if (phone) start();
  else desk();
}
