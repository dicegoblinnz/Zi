// The Learn deck (/learn/): the core rules as cards, swiped or tapped
// through with a progress bar. It remembers your card (zi-reading), every
// card has a bookmark, and Read more brings up the whole section in a sheet,
// with Back to the card to put it away. Links on a card, or in Read more,
// pop up their section's opening, and that one's Read more stays in the deck.
import { addTags, enableBlocks, wireBlocks } from "./blocks.js";
import { enablePopups, loadOpenings } from "./popups.js";
import { closeSheet, openSheet } from "./sheet.js";
import { isMarked, learnAt, setLearn, toggleMark } from "./store.js";

const deck = document.querySelector(".lr");
if (deck) run(deck);

function run(deck) {
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = deck.querySelector(".lr-track");
  const cards = [...track.querySelectorAll(".lr-card")];
  const total = cards.length;
  const count = deck.querySelector(".lr-n");
  const live = deck.querySelector(".lr-live");
  const bar = deck.querySelector(".lr-progress");
  const prev = deck.querySelector(".lr-prev");
  const next = deck.querySelector(".lr-next");
  const read = document.getElementById("lr-read");
  const list = document.getElementById("lr-cards");
  let at = -1;

  const leftOf = (card) => card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;

  function show(i, announce = true) {
    if (i === at || i < 0 || i >= total) return;
    at = i;
    const card = cards[i];
    cards.forEach((c, j) => {
      c.inert = j !== i;
    });
    count.textContent = String(i + 1);
    bar.setAttribute("aria-valuenow", String(i + 1));
    bar.setAttribute("aria-valuetext", `Card ${i + 1} of ${total}`);
    bar.querySelector("i").style.transform = `scaleX(${(i + 1) / total})`;
    // Back can't stay focused once it's off on the first card.
    if (i === 0 && document.activeElement === prev) next.focus();
    prev.disabled = i === 0;
    next.textContent = i === total - 1 ? "Finish" : "Next";
    setLearn(card.id, card.dataset.title, i + 1);
    history.replaceState(null, "", `#${card.id}`);
    if (announce) live.textContent = `Card ${i + 1} of ${total}: ${card.dataset.title}`;
  }

  // Next, Back, the arrows and the list steer to a card. While the deck
  // slides there, the cards it passes don't count, so quick taps all land.
  let steering = null;
  let steerTimer = 0;
  const arrive = () => {
    steering = null;
    clearTimeout(steerTimer);
  };
  function go(i, jumpThere = false) {
    const to = Math.max(0, Math.min(total - 1, i));
    const glide = !(jumpThere || still());
    if (glide) {
      steering = to;
      clearTimeout(steerTimer);
      steerTimer = setTimeout(arrive, 700);
    }
    track.scrollTo({ left: leftOf(cards[to]), behavior: glide ? "smooth" : "instant" });
    show(to);
  }
  track.addEventListener("scrollend", arrive);

  // A swipe lands on a card, and whichever card fills most of the deck is
  // the one you're on.
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || e.intersectionRatio < 0.6) continue;
      const i = cards.indexOf(e.target);
      if (steering !== null && i !== steering) continue;
      show(i);
    }
  }, { root: track, threshold: [0.6] });
  cards.forEach((c) => seen.observe(c));

  const hashed = cards.findIndex((c) => `#${c.id}` === location.hash);
  const saved = cards.findIndex((c) => c.id === learnAt()?.id);
  const first = hashed >= 0 ? hashed : Math.max(0, saved);
  track.scrollLeft = leftOf(cards[first]);
  show(first, false);

  prev.addEventListener("click", () => go(at - 1));
  next.addEventListener("click", () => {
    if (at === total - 1) location.href = "/rules/";
    else go(at + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
    if (e.target.closest?.("input, textarea, select")) return;
    if (e.key === "ArrowRight") go(at + 1);
    else if (e.key === "ArrowLeft") go(at - 1);
    else return;
    e.preventDefault();
  });
  addEventListener("resize", () => {
    track.scrollLeft = leftOf(cards[at]);
  });

  // A bookmark on every card.
  const markOf = (card) => ({ k: "card", id: card.id, t: card.dataset.title });
  const showMarks = () => {
    for (const card of cards) card.querySelector(".lr-mark")?.setAttribute("aria-pressed", String(isMarked(markOf(card))));
    for (const a of list?.querySelectorAll("a[data-card]") ?? []) a.classList.toggle("is-marked", isMarked({ k: "card", id: a.dataset.card }));
  };
  showMarks();
  track.addEventListener("click", (e) => {
    const b = e.target.closest(".lr-mark");
    if (!b) return;
    b.setAttribute("aria-pressed", String(toggleMark(markOf(b.closest(".lr-card")))));
    b.classList.remove("is-new");
    void b.offsetWidth;
    b.classList.add("is-new");
    showMarks();
  });

  // Read more: the whole section, from its chapter page (the service worker
  // keeps every page, so it's there offline), in a sheet over the card.
  const readBody = read.querySelector(".lr-read-text");
  const readOpen = read.querySelector(".lr-open");
  let asked = 0;
  async function readMore(url, title, chapter) {
    const mine = ++asked;
    read.querySelector("#lr-read-t").textContent = title;
    read.querySelector("#lr-read-c").textContent = chapter;
    readOpen.href = url;
    readOpen.querySelector(".visually-hidden").textContent = `: ${title}`;
    readBody.replaceChildren(Object.assign(document.createElement("p"), { className: "lr-wait", textContent: "Getting the section…" }));
    read.querySelector(".zs-body").scrollTop = 0;
    openSheet(read);
    const where = new URL(url, location.href);
    try {
      const res = await fetch(where.pathname);
      if (!res.ok) throw new Error(String(res.status));
      const html = await res.text();
      if (mine !== asked) return;
      const page = new DOMParser().parseFromString(html, "text/html");
      const nodes = sectionOf(page, decodeURIComponent(where.hash.slice(1)), where.pathname);
      if (!nodes.length) throw new Error("no section");
      addTags(page.getElementById("tag-info"));
      readBody.replaceChildren(...nodes);
      wireBlocks(readBody);
    } catch {
      if (mine !== asked) return;
      const p = document.createElement("p");
      p.append("This section isn't on this phone yet. ", Object.assign(document.createElement("a"), { href: url, textContent: "Open it in the rules" }), ".");
      readBody.replaceChildren(p);
    }
  }
  for (const card of cards) {
    card.querySelector(".lr-more")?.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      readMore(card.querySelector(".lr-more").getAttribute("href"), card.dataset.section, card.dataset.chapter);
    });
  }
  enablePopups({
    onMore: (key) => loadEntry(key).then((entry) => readMore(key, entry?.t ?? "The rules", entry?.c ?? "")),
  });
  enableBlocks();

  // The list of every card, with where you are and your bookmarks marked.
  deck.querySelector(".lr-list")?.addEventListener("click", () => {
    for (const a of list.querySelectorAll("a[data-card]")) a.removeAttribute("aria-current");
    const here = list.querySelector(`a[data-card="${cards[at].id}"]`);
    here?.setAttribute("aria-current", "true");
    showMarks();
    openSheet(list);
    here?.scrollIntoView({ block: "center" });
  });
  list?.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-card]");
    if (!a) return;
    e.preventDefault();
    const i = cards.findIndex((c) => c.id === a.dataset.card);
    closeSheet(list, () => go(i, true));
  });

  // The light switch, since the site's bar is out of the way on a phone.
  const theme = deck.querySelector(".lr-theme");
  const light = () => document.documentElement.getAttribute("data-theme") === "light";
  const label = () => theme?.setAttribute("aria-label", light() ? "Switch to dark mode" : "Switch to light mode");
  label();
  theme?.addEventListener("click", () => {
    const on = !light();
    if (on) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("zi-theme", on ? "light" : "dark");
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", on ? "#f5f2f7" : "#120d18");
    document.querySelector(".theme-toggle")?.setAttribute("aria-label", on ? "Switch to dark mode" : "Switch to light mode");
    label();
  });
}

async function loadEntry(key) {
  return (await loadOpenings())?.[key] ?? null;
}

// One section off a chapter page: its own heading's left off (the sheet's
// title says it), the bookmarks are left behind, ids come off (and whatever
// pointed at them), and links inside it are made whole so they pop up from
// here. A chapter's own address is its opening, before the first section.
function sectionOf(page, id, path) {
  const article = page.querySelector("article[data-chapter]");
  if (!article) return [];
  let nodes;
  if (id) {
    const target = page.getElementById(id);
    const section = target?.closest("section.rs");
    if (section && section.dataset.s === id) {
      nodes = [...section.children].filter((n) => !n.matches(".rs-head"));
    } else if (target && /^H[4-6]$/.test(target.tagName)) {
      nodes = [];
      for (let n = target.nextElementSibling; n && !(/^H[1-6]$/.test(n.tagName) && n.tagName <= target.tagName) && !n.matches(".rs-head, section.rs"); n = n.nextElementSibling) nodes.push(n);
    } else if (target) nodes = [target.closest(".box") ?? target];
    else nodes = [];
  } else {
    const track = article.querySelector(".rd-track") ?? article;
    const opening = track.querySelector(':scope > section[data-s="opening"]');
    nodes = opening ? [...opening.children] : [...track.children].filter((n) => !n.matches("header, .hub, .whats-new, section.rs"));
  }
  return nodes.map((n) => {
    const copy = document.importNode(n, true);
    copy.querySelectorAll(".rs-mark, .new-mark").forEach((x) => x.remove());
    for (const x of [copy, ...copy.querySelectorAll("[id]")]) x.removeAttribute?.("id");
    for (const x of [copy, ...copy.querySelectorAll("[aria-controls], [aria-labelledby]")]) {
      x.removeAttribute?.("aria-controls");
      x.removeAttribute?.("aria-labelledby");
    }
    for (const a of copy.querySelectorAll('a[href^="#"]')) a.setAttribute("href", `${path}${a.getAttribute("href")}`);
    return copy;
  });
}
