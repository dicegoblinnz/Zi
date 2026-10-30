// What /worlds/<universe>/ does once it's on a phone: the bar along the
// bottom between the factions (the board or the web), the map, the places,
// the people and How it came to be, the chips and Find on each list, the web
// walked a faction at a time, the map moved and zoomed in one hand with a pin
// on every place (mapview.js) and the web on it, and any name anywhere
// opening its card or its page. The page is all there without this, drawn at
// build time by world-page.js.

import { webOfWorld, webData, tiesOf } from "./world-page.js";
import { linesOf } from "../companion/world-web.js";
import { makeViewer } from "../companion/mapview.js";
import { die, esc } from "../kit/kit.js";
import { stepsToDice } from "../companion/dice.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const data = JSON.parse($("#wn-data")?.textContent || "null");
const root = $(".wn");
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// A place's pin carries a house, and a card closes on a cross.
const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 20V9l8-5 8 5v11"/><path d="M9.5 20v-6h5v6"/></svg>';
const X = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';

if (data && root) {
  root.classList.add("is-live");
  const tabs = $$(".wn-bar [data-tab]");
  const panels = $$("[data-panel]");
  // Which tab a panel's under: the board and the web are both the factions.
  const tabOf = (panel) => (panel === "web" ? "board" : panel);
  for (const p of panels) {
    const tab = tabs.find((t) => t.dataset.tab === tabOf(p.dataset.panel));
    if (!tab) continue;
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", tab.id);
  }
  let factionsView = "board";
  let showing = "";
  const show = (name, { scroll = true } = {}) => {
    if (name === "board" || name === "web") factionsView = name;
    showing = name;
    for (const t of tabs) {
      const on = t.dataset.tab === tabOf(name);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    for (const p of panels) p.hidden = p.dataset.panel !== name;
    for (const b of $$("[data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === name));
    const url = new URL(location.href);
    if (name === "board") url.searchParams.delete("tab");
    else url.searchParams.set("tab", name);
    history.replaceState(history.state, "", url);
    root.classList.toggle("is-map", name === "map");
    if (name === "map") mountMap();
    // The map's as tall as the screen above the bar, so it always comes into
    // view whole.
    if (scroll || name === "map") panels.find((p) => p.dataset.panel === name)?.scrollIntoView({ block: "start" });
  };
  for (const t of tabs) t.addEventListener("click", () => show(t.dataset.tab === "board" ? factionsView : t.dataset.tab));
  for (const b of $$("[data-view]")) b.addEventListener("click", () => show(b.dataset.view, { scroll: false }));
  // The arrow keys, Home and End move along the bar, the way a set of tabs does.
  $(".wn-bar")?.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1 + tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (i < 0 || to == null) return;
    e.preventDefault();
    const next = tabs[to % tabs.length];
    next.focus();
    show(next.dataset.tab === "board" ? factionsView : next.dataset.tab);
  });

  // The chips and Find on each list: the board's kinds, and the places' and
  // people's districts.
  const lists = [];
  for (const panel of ["board", "places", "people"]) {
    const el = panels.find((p) => p.dataset.panel === panel);
    if (!el) continue;
    const cards = $$(".wn-f", el);
    const find = $(".wn-find input", el);
    const found = $(".wn-found", el);
    const chips = $$(".wn-kind", el);
    const field = panel === "board" ? "kind" : "area";
    let pick = "";
    const filter = () => {
      const words = (find?.value ?? "").toLowerCase().replace(/[’‘]/g, "'").split(/\s+/).filter(Boolean);
      let n = 0;
      for (const c of cards) {
        const on = (!pick || c.dataset[field] === pick) && words.every((w) => c.dataset.find.includes(w));
        c.hidden = !on;
        if (on) n += 1;
      }
      if (found) found.textContent = n === cards.length ? "" : n ? `Showing ${n} of ${cards.length}` : panel === "board" ? "Nothing on the board matches that." : `Nothing in the ${panel} matches that.`;
    };
    for (const b of chips) {
      b.addEventListener("click", () => {
        pick = b.dataset[field];
        for (const x of chips) x.setAttribute("aria-pressed", String(x === b));
        filter();
      });
    }
    find?.addEventListener("input", filter);
    // Everything showing again, for a card opened from somewhere else.
    const clear = () => {
      pick = "";
      if (find) find.value = "";
      for (const x of chips) x.setAttribute("aria-pressed", String(!x.dataset[field]));
      filter();
    };
    lists.push({ panel, el, clear });
  }

  // A faction, a place or a person opened from anywhere: its card or page in
  // its list, open and in view.
  const open = (id, { focus = true } = {}) => {
    const card = document.getElementById(id);
    if (!card) return;
    const panel = card.closest("[data-panel]")?.dataset.panel;
    if (card.hidden) lists.find((l) => l.panel === panel)?.clear();
    show(panel, { scroll: false });
    card.open = true;
    card.scrollIntoView({ block: "start", behavior: still() ? "auto" : "smooth" });
    if (focus) card.querySelector("summary")?.focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#f-"], a[href^="#p-"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute("href").slice(1);
    history.pushState(history.state, "", `${location.search}#${id}`);
    open(id);
  });
  addEventListener("popstate", () => {
    if (/^#[fp]-/.test(location.hash)) open(location.hash.slice(1), { focus: false });
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

  // ── The map: the drawing in the viewer, a pin on every place, and the web
  // on it when it's switched on.
  const M = data.map;
  const box = $("#wn-map");
  let view = null;
  const ui = { pin: "", web: false, sel: "" };
  const byKey = new Map((data.places ?? []).map((p) => [p.key, p]));
  const factionBy = new Map(data.factions.map((f) => [f.key, f]));
  const RANK = { district: 3, part: 2 };
  const drawPin = (p) => {
    const pl = byKey.get(p.id);
    const k = pl.area || "place";
    const on = ui.pin === p.id;
    const html = k === "place" ? `<span class="wm-pin-head">${PIN}</span><span class="wm-pin-n">${esc(pl.name)}</span>` : `<span class="wm-pin-n">${esc(pl.name)}</span>`;
    const say = `${pl.name}, ${k === "district" ? "a district" : k === "part" ? `part of ${byKey.get(pl.in)?.name ?? ""}` : `in ${byKey.get(pl.in)?.name ?? ""}`}`;
    return { cls: `wm-pin is-${k}${on ? " is-on" : ""}`, html, attrs: { "data-pin": p.id, "aria-label": say, "aria-pressed": String(on) } };
  };
  const pinsNow = () => Object.entries(M.pins).map(([k, [x, y]]) => ({ id: k, x: x / M.size[0], y: y / M.size[1], rank: (ui.pin === k ? 9 : 0) + (RANK[byKey.get(k)?.area] ?? 1), always: ui.pin === k }));
  // Where each faction's token goes: on its seat's pin, those that share one
  // fanned out under it, and a mini faction beside its maker.
  const tokensNow = () => {
    const at = new Map();
    for (const f of data.factions) {
      const seat = f.of ? factionBy.get(f.of)?.seat : f.seat;
      if (!M.pins[seat]) continue;
      at.set(seat, [...(at.get(seat) ?? []), f]);
    }
    const out = [];
    for (const [seat, fs] of at) {
      const [x, y] = M.pins[seat];
      // One under the spot, two either side of it, and more round a ring
      // that grows with them, starting underneath.
      const n = fs.length;
      const r = n <= 2 ? 30 : 30 + 5 * (n - 3);
      fs.forEach((f, i) => {
        const a = n === 1 ? Math.PI / 2 : n === 2 ? Math.PI / 2 + (i ? -0.9 : 0.9) : Math.PI / 2 + (2 * Math.PI * i) / n;
        out.push({ id: f.key, x: x / M.size[0], y: y / M.size[1], dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r) });
      });
    }
    return out;
  };
  const W = webData(data);
  const webSpec = () => {
    const sub = ui.sel ? tiesOf(W, ui.sel) : { nodes: [], threads: [] };
    const near = new Set(sub.nodes.map((n) => n.id));
    const L = { threads: sub.threads.filter((t) => t.to !== "crew") };
    const lines = linesOf(L).map((x) => ({ a: x.a, b: x.b, bow: x.bow, arrow: x.both ? "" : x.kind === "hostile" ? "h" : "b", cls: ["wm-wl", `is-${x.kind}`, x.strained ? "is-strained" : "", x.snapped ? "is-snapped" : "", x.a === ui.sel || x.b === ui.sel ? "is-hi" : ""].filter(Boolean).join(" ") }));
    return {
      nodes: tokensNow(),
      lines,
      draw: (n) => {
        const f = factionBy.get(n.id);
        const dice = stepsToDice(f.steps);
        const lit = ui.sel === n.id ? " is-sel" : ui.sel && near.has(n.id) ? " is-lit" : ui.sel ? " is-dim" : "";
        return {
          cls: `wm-ft${f.of ? " is-mini" : ""}${lit}`,
          html: `<span class="wm-ft-d" aria-hidden="true">${die(dice[0] ?? 2, { own: "them", hide: true })}</span><span class="wm-ft-n" aria-hidden="true">${esc(f.card.name.replace(/^The /, ""))}</span>`,
          attrs: { "data-tok": n.id, "aria-pressed": String(ui.sel === n.id), "aria-label": `${f.card.name}${ui.sel === n.id ? ", its ties lit" : ": light its ties"}` },
        };
      },
    };
  };
  const cardEl = $("#wn-mcard");
  const webBtn = $("#wn-webbtn");
  const drawCard = () => {
    if (ui.web && ui.sel) {
      const f = factionBy.get(ui.sel);
      const seat = byKey.get(f.of ? factionBy.get(f.of)?.seat : f.seat);
      const ties = W.threads.filter((t) => t.from === ui.sel || t.to === ui.sel).length;
      cardEl.innerHTML = `<div class="wn-mc-top"><span class="wn-mc-d" aria-hidden="true">${die(stepsToDice(f.steps)[0] ?? 2, { own: "them", hide: true })}</span><div><p class="wn-k">${esc(data.kinds[f.kind] ?? "")}${seat ? ` · ${esc(seat.name)}` : ""}</p><h3 class="wn-mc-n">${esc(f.card.name)}</h3><p class="wn-mc-l">${ties === 1 ? "1 thread" : `${ties} threads`}, either way, lit on the map.</p></div><button type="button" class="wn-mc-x" data-mc="x" aria-label="Close">${X}</button></div><div class="wn-mc-row"><a class="wn-mc-go" href="#f-${esc(f.key)}">Its card</a><button type="button" class="wn-mc-go is-quiet" data-mc="ties">Its ties in the web</button></div>`;
      cardEl.hidden = false;
      padMap();
      return;
    }
    const p = byKey.get(ui.pin);
    if (!p) {
      cardEl.hidden = true;
      cardEl.replaceChildren();
      padMap();
      return;
    }
    const where = p.area === "district" ? "District" : p.area === "part" ? `Part of ${byKey.get(p.in)?.name ?? ""}` : `In ${byKey.get(p.in)?.name ?? ""}`;
    const sits = data.factions.filter((f) => f.seat === p.key);
    cardEl.innerHTML = `<div class="wn-mc-top"><span class="wn-mc-d" role="img" aria-label="Challenge ${p.ch}">${die(Math.min(12, p.ch * 2), { own: "them", hide: true })}</span><div><p class="wn-k">${esc(where)}</p><h3 class="wn-mc-n">${esc(p.name)}</h3><p class="wn-mc-l">${esc(p.line)}</p>${sits.length ? `<p class="wn-mc-s">${sits.map((f) => esc(f.card.name)).join(", ")} ${sits.length > 1 ? "sit" : "sits"} here</p>` : ""}</div><button type="button" class="wn-mc-x" data-mc="x" aria-label="Close">${X}</button></div><div class="wn-mc-row"><a class="wn-mc-go" href="#p-${esc(p.key)}">Its page</a></div>`;
    cardEl.hidden = false;
    padMap();
  };
  const redraw = () => {
    if (!view) return;
    view.pins(pinsNow());
    view.web(ui.web ? webSpec() : null);
    view.el.classList.toggle("is-webbed", ui.web);
    webBtn?.setAttribute("aria-pressed", String(ui.web));
    drawCard();
  };
  function mountMap() {
    if (view || !M || !box) return;
    const art = box.querySelector("svg.dm")?.outerHTML ?? "";
    // The drawing's laid out at twice the map's numbers, so a phone at its
    // closest is still drawing it at full size.
    const k = 2;
    view = makeViewer({
      w: M.size[0] * k,
      h: M.size[1] * k,
      label: data.mapLabel,
      how: "wn-map-how",
      drawPin,
      onTap: () => {
        if (ui.pin || ui.sel) {
          ui.pin = "";
          ui.sel = "";
          redraw();
        }
      },
    });
    view.art(art);
    // It opens filling the screen, on the middle of the city.
    view.cover(data.map.middle[0], data.map.middle[1]);
    box.replaceChildren(view.el);
    box.classList.add("is-live");
    view.el.addEventListener("click", (e) => {
      const pin = e.target.closest("[data-pin]");
      if (pin) {
        ui.pin = ui.pin === pin.dataset.pin ? "" : pin.dataset.pin;
        ui.sel = "";
        return redraw();
      }
      const tok = e.target.closest("[data-tok]");
      if (tok) {
        ui.sel = ui.sel === tok.dataset.tok ? "" : tok.dataset.tok;
        ui.pin = "";
        redraw();
        view.el.querySelector(`[data-tok="${CSS.escape(tok.dataset.tok)}"]`)?.focus({ preventScroll: true });
      }
    });
    redraw();
    padMap();
  }
  // The card and the bar along the bottom of the map cover the map's foot.
  const padMap = () => {
    const bar = $(".wn-mbar");
    if (view && bar) view.pad(box.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 8);
  };
  addEventListener("resize", padMap);
  cardEl?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mc]");
    if (!b) return;
    if (b.dataset.mc === "x") {
      ui.pin = "";
      ui.sel = "";
      redraw();
      view?.el.focus({ preventScroll: true });
    }
    if (b.dataset.mc === "ties") {
      show("web", { scroll: true });
      walk(ui.sel);
    }
  });
  webBtn?.addEventListener("click", () => {
    ui.web = !ui.web;
    if (!ui.web) ui.sel = "";
    ui.pin = "";
    redraw();
  });
  $("#wn-zin")?.addEventListener("click", () => view?.zoomIn());
  $("#wn-zout")?.addEventListener("click", () => view?.zoomOut());
  $("#wn-zall")?.addEventListener("click", () => view?.fit());
  // A place's or a faction's On the map: the map, at its pin, with its card.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-map-p], [data-map-f]");
    if (!b) return;
    show("map", { scroll: true });
    const fk = b.dataset.mapF;
    const f = fk ? factionBy.get(fk) : null;
    const key = f ? (f.of ? factionBy.get(f.of)?.seat : f.seat) : b.dataset.mapP;
    if (f) {
      ui.web = true;
      ui.sel = fk;
      ui.pin = "";
    } else {
      ui.pin = key;
      ui.sel = "";
    }
    redraw();
    const at = M.pins[key];
    if (at) view.centreOn(at[0] / M.size[0], at[1] / M.size[1]);
  });

  const tab = new URL(location.href).searchParams.get("tab");
  show(["web", "map", "places", "people", "history"].includes(tab) ? tab : "board", { scroll: false });
  if (/^#[fp]-/.test(location.hash)) open(location.hash.slice(1), { focus: false });
}

