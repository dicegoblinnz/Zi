// What /worlds/<universe>/ does once it's on a phone: the bar along the
// bottom between the board, the web and How it came to be, the kinds and
// Find on the board, a tap on the web showing that faction's threads each
// way, and a faction's name anywhere opening its card. The page is all there
// without this, drawn at build time by world-page.js.

import { webOfWorld } from "./world-page.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const data = JSON.parse($("#wn-data")?.textContent || "null");
const root = $(".wn");

if (data && root) {
  root.classList.add("is-live");
  const tabs = $$("[data-tab]");
  const panels = $$("[data-panel]");
  // Live, the three are tabs, each panel named by its tab.
  for (const p of panels) {
    const tab = tabs.find((t) => t.dataset.tab === p.dataset.panel);
    if (!tab) continue;
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", tab.id);
  }
  const show = (name, { scroll = true } = {}) => {
    for (const t of tabs) {
      t.setAttribute("aria-selected", String(t.dataset.tab === name));
      t.tabIndex = t.dataset.tab === name ? 0 : -1;
    }
    for (const p of panels) p.hidden = p.dataset.panel !== name;
    const url = new URL(location.href);
    if (name === "board") url.searchParams.delete("tab");
    else url.searchParams.set("tab", name);
    history.replaceState(history.state, "", url);
    if (scroll) panels.find((p) => p.dataset.panel === name)?.scrollIntoView({ block: "start" });
  };
  for (const t of tabs) t.addEventListener("click", () => show(t.dataset.tab));
  // The arrow keys, Home and End move along the bar, the way a set of tabs does.
  $(".wn-bar")?.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1 + tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (i < 0 || to == null) return;
    e.preventDefault();
    const next = tabs[to % tabs.length];
    next.focus();
    show(next.dataset.tab);
  });

  // The kinds and Find, together.
  const cards = $$(".wn-f");
  const find = $("#wn-find");
  const found = $("#wn-found");
  let kind = "";
  const filter = () => {
    const words = (find?.value ?? "").toLowerCase().replace(/[’‘]/g, "'").split(/\s+/).filter(Boolean);
    let n = 0;
    for (const c of cards) {
      const on = (!kind || c.dataset.kind === kind) && words.every((w) => c.dataset.find.includes(w));
      c.hidden = !on;
      if (on) n += 1;
    }
    found.textContent = n === cards.length ? "" : n ? `Showing ${n} of ${cards.length}` : "Nothing on the board matches that.";
  };
  for (const b of $$(".wn-kind")) {
    b.addEventListener("click", () => {
      kind = b.dataset.kind;
      for (const x of $$(".wn-kind")) x.setAttribute("aria-pressed", String(x === b));
      filter();
    });
  }
  find?.addEventListener("input", filter);

  // A faction opened from anywhere: its card on the board, open and in view.
  const open = (key, { focus = true } = {}) => {
    const card = document.getElementById(`f-${key}`);
    if (!card) return;
    if (card.hidden) {
      kind = "";
      if (find) find.value = "";
      for (const x of $$(".wn-kind")) x.setAttribute("aria-pressed", String(!x.dataset.kind));
      filter();
    }
    show("board", { scroll: false });
    card.open = true;
    card.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (focus) card.querySelector("summary")?.focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#f-"]');
    if (!a) return;
    e.preventDefault();
    const key = a.getAttribute("href").slice(3);
    history.pushState(history.state, "", `${location.search}#f-${key}`);
    open(key);
  });
  addEventListener("popstate", () => {
    if (location.hash.startsWith("#f-")) open(location.hash.slice(3), { focus: false });
  });

  // The web: one faction's ties at a time. Picking a faction, or tapping one
  // in the ring, walks the web to that faction's ties.
  const web = $("#wn-web");
  const panel = $("#wn-panel");
  const pick = $("#wn-focus");
  const walk = (id) => {
    const { pic, panel: p, focus } = webOfWorld(data, id);
    web.innerHTML = pic;
    panel.innerHTML = p;
    if (pick) pick.value = focus;
    web.querySelector(`[data-web="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  };
  pick?.addEventListener("change", () => walk(pick.value));
  web?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-web]");
    if (!b) return;
    if (b.dataset.web === "crew") {
      panel.innerHTML = `<p class="wn-hint">The crew goes in the middle once there is one, and every faction's threads toward them go in with it.</p>`;
      return;
    }
    walk(b.dataset.web);
  });

  const tab = new URL(location.href).searchParams.get("tab");
  show(["web", "history"].includes(tab) ? tab : "board", { scroll: false });
  if (location.hash.startsWith("#f-")) open(location.hash.slice(3), { focus: false });
}
