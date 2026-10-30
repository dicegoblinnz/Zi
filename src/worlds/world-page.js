// A whole world on its own page, /worlds/<universe>/ (notes/builder-plan.md,
// A whole world): the board, the web, the map, its places and people, and
// How it came to be, drawn from a year's world as scripts/worlds.mjs wrote it.
// Pure, so the page draws it at build time and world-ui.js draws the web and
// the map again on a tap, the same way. Every faction, place and person is a
// fold that reads at a glance while it's shut, the way the World screen holds
// one, and any name of theirs written anywhere on the page links to it, the
// way it will on the World screen (linker() in pages.js).

import { die, esc } from "../kit/kit.js";
import { diceLabel, stepsToDice } from "../companion/dice.js";
import { drawWeb, keyOf as webKey, webOf } from "../companion/world-web.js";
import { linker, mentionsOf } from "../companion/pages.js";
import { drawMap } from "./draw-map.js";

export const AGE_NAMES = { 1: "Long ago", 2: "In living memory", 3: "This last year" };
const icon = (d) => `<svg class="wn-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
export const MAP_ICON = icon('<path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z"/><path d="M9 4v13.6M15 6.4V20"/>');
// A Challenge is drawn as the die it telegraphs with, Challenge 3 a d6.
const chDie = (ch) => Math.min(12, ch * 2);
const BONDS = [["pub", "Public Sentiment"], ["mor", "Morale"], ["loy", "Loyalty"]];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");

// The world the way the World screen holds it, for linking and for finding
// where something comes up: every faction as #f-<key> and every place and
// person as #p-<key>.
export function docOf(world) {
  return {
    factions: world.factions.map((f) => ({ ...f.card, id: `f-${f.key}` })),
    pages: [...(world.places ?? []), ...(world.people ?? [])].map((p) => {
      const c = { ...p.card, id: `p-${p.key}` };
      for (const l of ["here", "ground", "stakes", "hooks"]) c[l] = (c[l] ?? []).map((text) => ({ text }));
      return c;
    }),
  };
}

// Words with every name in them a link to its card or its page, the way the
// World screen links them: a faction's, a place's or a person's name, or any
// of their other names, the first time it's written, never to itself, and
// *italics* kept. self is whose words they are ("f-arasaka", "p-totentanz").
export function linkerOf(world) {
  const L = linker(docOf(world), (e) => `#${e.id}`);
  const tidy = (html) => html.replace(/<a class="wl" href="([^"]+)" data-act="w" data-do="nav">/g, '<a class="wn-ln" href="$1">');
  const ln = (text, self = "") => tidy(L.rich(text, self));
  ln.block = (text, self = "") => tidy(L.block(text, self));
  return ln;
}

const chip = (inner, cls = "") => `<li class="wn-chip${cls ? ` ${cls}` : ""}">${inner}</li>`;
const chips = (items) => (items.length ? `<ul class="wn-chips">${items.join("")}</ul>` : `<p class="wn-none">None</p>`);
const times = (x) => (x > 1 ? ` <span class="wn-x">×${x}</span>` : "");

function threadLi(t, ln, name, self) {
  const state = t.s === "strained" ? ", strained" : t.s === "snapped" ? ", snapped" : "";
  return `<li class="wn-t is-${t.kind}${t.s !== "whole" ? ` is-${t.s}` : ""}"><span class="wn-tk">${t.kind === "hostile" ? "Hostile" : "Bond"}${state}${name ? ` · ${name}` : ""}</span><em>${ln(t.text, self)}</em></li>`;
}

// A faction's fold: shut, its die, name, kind, Want and agenda, and open,
// the whole card.
export function factionOf(world, f, ln = linkerOf(world)) {
  const c = f.card;
  const fid = `f-${f.key}`;
  const by = new Map(world.factions.map((g) => [g.key, g]));
  const nameOf = (k) => by.get(k)?.card.name ?? k;
  const linkTo = (k) => `<a class="wn-ln" href="#f-${esc(k)}">${esc(nameOf(k))}</a>`;
  const dice = stepsToDice(f.steps);
  const kind = world.kinds[f.kind] ?? "";
  const people = c.assets.filter((a) => a.power);
  const others = c.assets.filter((a) => !a.power);
  const paying = c.assets.filter((a) => !a.off).length;
  const extra = c.res.length - paying;
  const ag = c.agendas[0];
  const mini = f.of ? by.get(f.of) : null;
  const sizeLine = mini ? `Mini faction of ${esc(mini.card.name)}` : `${esc(cap(f.size))}, ${esc(world.sizeWords?.[f.size] ?? "")}`;
  const findWords = [c.name, kind, c.about, c.want, c.face, ...c.res.map((r) => r.text), ...c.assets.map((a) => a.text)].join(" ").toLowerCase().replace(/[’‘]/g, "'");

  const lines = [];
  if (!mini) lines.push(["Want", `<p>${ln(c.want, fid)}</p>`]);
  if (c.face) lines.push(["Face", `<p>${ln(c.face, fid)}</p>`]);
  if (mini) lines.push(["What it does", `<p>${esc(list(c.outs))}</p>`]);
  lines.push([
    `Power <span class="wn-dl">${esc(diceLabel(dice))}</span>`,
    `<p class="wn-sum">${people.length ? "1 step, and a step for each of these." : "Just its 1 step, with nobody who turns up yet."}</p>${chips(people.map((a) => chip(`<span class="wn-cn">${esc(a.text)}${times(a.x)}<span class="wn-plus">+1 Power</span></span>${a.does.replace(/^\+1 Power\.?\s*/, "") ? `<span class="wn-does">${ln(a.does.replace(/^\+1 Power\.?\s*/, ""), fid)}</span>` : ""}`, "is-people")))}`,
  ]);
  lines.push([
    "Resources",
    `${chips(c.res.map((r) => chip(`<span class="wn-cn">${esc(r.text)}${times(r.x)}</span>`)))}${extra > 0 ? `<p class="wn-sum">${plural(extra, "resource", "resources")} to spare, with nothing to pay for.</p>` : ""}`,
  ]);
  if (others.length) {
    const needFrom = new Map((f.needs ?? []).map((n) => [n.text, n.from]));
    lines.push([
      "Assets",
      chips(
        others.map((a) => {
          const from = needFrom.get(a.text);
          const need = a.off ? `<span class="wn-need">A need, with nothing paying for it${from ? `. ${linkTo(from)} has a resource to spare and won’t trade` : ""}.</span>` : "";
          return chip(`<span class="wn-cn">${esc(a.text)}${times(a.x)}</span><span class="wn-does">${ln(a.does, fid)}</span>${need}`, a.off ? "is-need" : "");
        }),
      ),
    ]);
  }
  if (c.agendas.length) {
    lines.push([
      c.agendas.length > 1 ? "Agendas" : "Agenda",
      `<ul class="wn-ags">${c.agendas.map((a) => `<li>${die(a.die, { own: "them", label: `at d${a.die}` })}<div><p>${ln(a.text, fid)}</p>${a.then ? `<p class="wn-then">When it happens: ${ln(a.then, fid)}</p>` : ""}</div></li>`).join("")}</ul>`,
    ]);
  }
  const bonds = BONDS.filter(([k]) => c[k]?.length);
  if (bonds.length) lines.push(["Bonds", bonds.map(([k, label]) => `<p class="wn-sub">${label}</p><ul class="wn-ts">${c[k].map((t) => threadLi(t, ln, "", fid)).join("")}</ul>`).join("")]);
  if (c.threads.length) lines.push(["Threads", `<ul class="wn-ts">${c.threads.map((t) => threadLi(t, ln, `toward ${linkTo(t.to)}`, fid)).join("")}</ul>`]);
  const back = world.factions.flatMap((g) => g.card.threads.filter((t) => t.to === f.key).map((t) => ({ ...t, from: g.key })));
  if (back.length) lines.push(["Toward it", `<ul class="wn-ts">${back.map((t) => threadLi(t, ln, `from ${linkTo(t.from)}`, fid)).join("")}</ul>`]);
  const made = world.factions.filter((g) => g.of === f.key);
  if (made.length) lines.push(["Mini factions", `<p>${made.map((g) => linkTo(g.key)).join(", ")}</p>`]);
  if (c.secret) lines.push(["Secret", `<div class="wn-secret"><p><em>${esc(c.secret)}</em></p>${c.more ? `<p>${ln(c.more, fid)}</p>` : ""}</div>`]);
  if (c.note) lines.push(["Her note", `<p>${ln(c.note, fid)}</p>`]);
  // Where it is on the map, once the year has one: its seat's pin, with the
  // web on and its ties lit.
  const seat = !f.of && world.map?.pins?.[f.seat] ? f.seat : mini && world.map?.pins?.[mini.seat] ? mini.seat : "";
  const go = seat ? `<p class="wn-go"><button type="button" class="wn-gobtn" data-map-f="${esc(f.key)}">${MAP_ICON}On the map, with its ties</button></p>` : "";

  const glance = ag ? `<span class="wn-fs-ag"><span class="wn-fs-agd" role="img" aria-label="Agenda at d${ag.die}">${die(ag.die, { own: "them", hide: true })}</span><span class="wn-fs-agt">${esc(ag.text)}</span></span>` : "";
  return `
    <details class="wn-f${mini ? " is-mini" : ""}${f.strange ? " is-strange" : ""}" id="f-${esc(f.key)}" data-kind="${esc(f.kind)}" data-find="${esc(findWords)}">
      <summary class="wn-fs">
        <span class="wn-fs-die" role="img" aria-label="Power ${esc(diceLabel(dice))}">${dice.map((d) => die(d, { own: "them", hide: true })).join("")}</span>
        <span class="wn-fs-in">
          <span class="wn-k">${esc(kind)}<span aria-hidden="true"> · </span><span class="wn-k-s">${sizeLine}</span></span>
          <span class="wn-fs-n">${esc(c.name)}</span>
          <span class="wn-fs-w">${esc(mini ? c.about : c.want)}</span>
          ${glance}
        </span>
      </summary>
      <div class="wn-fb">
        <p class="wn-about">${ln(c.about, fid)}</p>
        <dl class="wn-lines">${lines.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>${go}
      </div>
    </details>`;
}

// The board: a fold for every faction, each mini faction after its maker,
// with a chip for each kind and a Find.
export function boardOf(world, ln = linkerOf(world)) {
  const order = [];
  for (const f of world.factions.filter((g) => !g.of)) order.push(f, ...world.factions.filter((g) => g.of === f.key));
  const count = (k) => world.factions.filter((f) => f.kind === k).length;
  const kinds = Object.entries(world.kinds).filter(([k]) => count(k));
  return `
    <div class="wn-tools">
      <div class="wn-kinds" role="group" aria-label="Show a kind of faction">
        <button type="button" class="wn-kind" data-kind="" aria-pressed="true">Every one <span>${world.factions.length}</span></button>
        ${kinds.map(([k, name]) => `<button type="button" class="wn-kind" data-kind="${esc(k)}" aria-pressed="false">${esc(name)} <span>${count(k)}</span></button>`).join("")}
      </div>
      <label class="wn-find"><span class="sr">Find a faction</span><input type="search" id="wn-find" placeholder="Find a faction, a resource or a name" autocomplete="off" enterkeyhint="search" /></label>
      <p class="wn-found" id="wn-found" aria-live="polite"></p>
    </div>
    <div class="wn-board">${order.map((f) => factionOf(world, f, ln)).join("")}</div>`;
}

// The web's pieces, the way the World screen hands them to world-web.js.
export function webData(world) {
  const nodes = world.factions.map((f) => ({ id: f.key, name: f.card.name, dice: stepsToDice(f.steps), mini: Boolean(f.of), parent: f.of || null, hidden: false }));
  const threads = world.factions.flatMap((f) => f.card.threads.map((t) => ({ from: f.key, to: t.to, kind: t.kind, s: t.s, text: t.text })));
  return { nodes, threads };
}

// A whole city's web is too many factions for one ring on a phone, so the
// page draws one faction's ties at a time: the faction, everyone it's got a
// thread with either way, and the threads between them, with it at the top.
// The faction with the most threads goes first.
export function busiestOf(data) {
  const count = (id) => data.threads.filter((t) => t.from === id || t.to === id).length;
  return [...data.nodes].sort((a, b) => count(b.id) - count(a.id))[0]?.id ?? null;
}
export function tiesOf(data, focus) {
  const near = new Set([focus]);
  for (const t of data.threads) {
    if (t.from === focus && t.to !== "crew") near.add(t.to);
    if (t.to === focus) near.add(t.from);
  }
  const nodes = [data.nodes.find((n) => n.id === focus), ...data.nodes.filter((n) => n.id !== focus && near.has(n.id))]
    .filter(Boolean)
    .map((n) => ({ ...n, mini: n.mini && near.has(n.parent), parent: near.has(n.parent) ? n.parent : null }));
  return { nodes, threads: data.threads.filter((t) => near.has(t.from) && near.has(t.to)) };
}

// The web around one faction, and what goes under it. Tapping another
// faction in it walks the web to that one's ties.
export function webOfWorld(world, focus = null, data = webData(world)) {
  const at = data.nodes.some((n) => n.id === focus) ? focus : busiestOf(data);
  const sub = tiesOf(data, at);
  const L = webOf(sub.nodes, sub.threads);
  const count = (id) => data.threads.filter((t) => t.from === id || t.to === id).length;
  const pic = drawWeb(L, {
    esc,
    sel: at,
    uid: "wn",
    attrs: (id) => `data-web="${esc(id)}"`,
    label: (nd) => (nd.id === at ? `${nd.name}, ${plural(count(nd.id), "thread", "threads")}, shown` : `${nd.name}, ${plural(count(nd.id), "thread", "threads")}: show its ties`),
    crew: { name: "The crew", dice: null, label: "Where the crew goes, once there is one" },
  });
  return { pic, panel: panelOf(world, at, data), focus: at };
}

// The faction whose ties the web's showing, picked from a list by kind.
export function pickerOf(world, focus) {
  const groups = Object.entries(world.kinds)
    .map(([k, name]) => [name, world.factions.filter((f) => f.kind === k)])
    .filter(([, fs]) => fs.length);
  return `<label class="wn-pick"><span>Whose ties</span><select id="wn-focus">${groups
    .map(([name, fs]) => `<optgroup label="${esc(name)}">${fs.map((f) => `<option value="${esc(f.key)}"${f.key === focus ? " selected" : ""}>${esc(f.card.name)}</option>`).join("")}</optgroup>`)
    .join("")}</select></label>`;
}

function panelOf(world, sel, data) {
  if (!sel || sel === "crew") {
    return `${webKey()}<p class="wn-hint">${sel === "crew" ? "The crew goes in the middle once there is one, and every faction's threads toward them go in with it." : "Tap a faction for its threads, each way."}</p>`;
  }
  const by = new Map(world.factions.map((f) => [f.key, f]));
  const f = by.get(sel);
  if (!f) return webKey();
  const name = (k) => by.get(k)?.card.name ?? k;
  const li = (t, who) => `<li class="ww-t is-${t.kind}${t.s !== "whole" ? ` is-${t.s}` : ""}"><span class="ww-k">${t.kind === "hostile" ? "Hostile" : "Bond"}${t.s !== "whole" ? `, ${t.s}` : ""}</span> <small>${esc(who)}</small><br /><em>${esc(t.text)}</em></li>`;
  const out = data.threads.filter((t) => t.from === sel);
  const inn = data.threads.filter((t) => t.to === sel);
  return `<p class="ww-h"><a class="ww-go" href="#f-${esc(sel)}" data-open="${esc(sel)}">${esc(f.card.name)}</a></p>
    ${out.length ? `<p class="ww-sub">Toward others</p><ul class="ww-ts">${out.map((t) => li(t, `toward ${name(t.to)}`)).join("")}</ul>` : ""}
    ${inn.length ? `<p class="ww-sub">Toward it</p><ul class="ww-ts">${inn.map((t) => li(t, `from ${name(t.from)}`)).join("")}</ul>` : ""}
    ${!out.length && !inn.length ? `<p class="wn-hint">No threads yet.</p>` : ""}`;
}

// How it came to be, an age at a time, a line that's hers marked as hers.
export function historyOf(world, ln = linkerOf(world)) {
  return `<ol class="wn-ages">${[1, 2, 3]
    .map((a) => {
      const lines = world.history.filter((l) => l.age === a);
      if (!lines.length) return "";
      return `<li class="wn-age"><h3 class="wn-age-h">${AGE_NAMES[a]}</h3><ol class="wn-hl">${lines
        .map((l) => `<li class="wn-line${l.hers ? " is-hers" : ""}"><p>${ln(l.text)}</p>${l.hers ? `<p class="wn-hers">Hers: it gives a Secret away, so it never reaches the crew</p>` : ""}</li>`)
        .join("")}</ol></li>`;
    })
    .join("")}</ol>`;
}

// The page's counts, for the head.
export function countsOf(world) {
  const threads = world.factions.reduce((n, f) => n + f.card.threads.length, 0);
  const pages = world.places?.length ? [plural(world.places.length, "place", "places"), plural(world.people.length, "person", "people")] : [];
  return [plural(world.factions.length, "faction", "factions"), plural(threads, "thread", "threads"), ...pages, plural(world.history.length, "line of history", "lines of history")];
}


// ── Places and people (stage 13)

const AREA_NAMES = { district: "District", part: "Part of" };
const TAG_NAMES = { comes: "How it comes at you", keeps: "What keeps it going", drives: "What drives it", weak: "Its weak point", power: "Its power" };
const GROUND = /^\*([^*]+)\*:\s*(.+)$/;
const STAKE = /^\*([^*]+)\*,?\s*Challenge ([1-6])(?::\s*(.+?))?(?:\s*\(([^)]+)\))?$/;

// Which district a place is in, by its key: its own for a district, its
// district for a part, and its part's district for anywhere else.
export function districtsOf(world) {
  const by = new Map((world.places ?? []).map((p) => [p.key, p]));
  const of = (k) => {
    const p = by.get(k);
    if (!p) return "";
    if (p.area === "district") return p.key;
    const up = by.get(p.in);
    return up?.area === "district" ? up.key : up ? up.in : "";
  };
  return { by, of };
}

// What a world calls its districts and parts, one and many (world.yaml's
// areas): a city's are districts and parts, and Abnu's are lands and cities.
export const wordsOf = (world) => world.areas ?? { district: ["district", "districts"], part: ["part", "parts"] };
// A name in the middle of a line, its The lower case: in the Hinterlands.
export const midName = (n) => String(n ?? "").replace(/^The (?=\p{Lu})/u, "the ");
// What a place is, under its name: a district, a part of one, or where it
// is, in the world's own words, with up being the name of what it's in.
export function whereWords(area, up, words) {
  const at = midName(up);
  if (area === "district") return cap(words.district[0]);
  if (area === "part") return words.part[0] === "part" ? `Part of ${at}` : `${cap(words.part[0])} in ${at}`;
  return `In ${at}`;
}
function whereOf(world, p) {
  const { by } = districtsOf(world);
  return whereWords(p.area, by.get(p.in)?.card.name ?? "", wordsOf(world));
}

// A page's other names, bar one that's only its own name in other capitals
// (The palace for The Palace), which is there so the name links either way.
const otherNames = (c) => c.aka.filter((a) => a.toLowerCase() !== c.name.toLowerCase());
const listOf = (items, li) => (items.length ? `<ul class="wn-pl">${items.map(li).join("")}</ul>` : "");
function teleLi(t, ln, self) {
  return `<li class="wn-tl"><span class="wn-tl-d" role="img" aria-label="d${t.d}">${die(t.d, { own: "them", hide: true })}</span><div><p>${ln(t.text, self)}</p><p class="wn-at">At ${esc(t.at)}</p></div></li>`;
}

// A place's fold: shut, its Challenge as a die, what it is and where, its
// name and its line, and open, the whole page.
export function placeFold(world, p, ln = linkerOf(world), doc = docOf(world)) {
  const c = p.card;
  const pid = `p-${p.key}`;
  const { by, of } = districtsOf(world);
  const lines = [];
  if (otherNames(c).length) lines.push(["Other names", `<p>${esc(otherNames(c).join(", "))}</p>`]);
  if (c.here.length) lines.push(["Who’s here", listOf(c.here, (h) => `<li>${ln(h, pid)}</li>`)]);
  if (c.ground.length) {
    lines.push(["The ground", listOf(c.ground, (g) => {
      const m = g.match(GROUND);
      return m ? `<li><span class="wn-gt">${esc(m[1])}</span> ${ln(m[2], pid)}</li>` : `<li>${ln(g, pid)}</li>`;
    })]);
  }
  if (c.stakes.length) {
    lines.push(["Stakes", listOf(c.stakes, (t) => {
      const m = t.match(STAKE);
      if (!m) return `<li>${ln(t, pid)}</li>`;
      const tags = [...(m[3] ?? "").matchAll(/\*([^*]+)\*/g)].map((x) => `<span class="zd-tag threat"><em>${esc(x[1])}</em></span>`).join("");
      return `<li class="wn-stake"><span class="wn-st-d" role="img" aria-label="Challenge ${m[2]}, a d${chDie(Number(m[2]))}">${die(chDie(Number(m[2])), { own: "them", hide: true })}</span><div><p><b>${esc(m[1])}</b>, Challenge ${m[2]}</p>${tags ? `<p class="wn-tags">${tags}</p>` : ""}${m[4] ? `<p class="wn-for">${ln(m[4], pid)}</p>` : ""}</div></li>`;
    })]);
  }
  if (c.clockD) lines.push([`The scene clock <span class="wn-dl">d${c.clockD}</span>`, `<div class="wn-clock"><span class="wn-tl-d" role="img" aria-label="d${c.clockD}">${die(c.clockD, { own: "them", hide: true })}</span><p>When it runs out: ${ln(c.clock, pid)}</p></div>`]);
  if (c.twist) lines.push(["The complication", `<p>${ln(c.twist, pid)}</p>`]);
  if (c.teles.length) lines.push(["Telegraphs", `<ul class="wn-pl">${c.teles.map((t) => teleLi(t, ln, pid)).join("")}</ul>`]);
  if (c.hooks.length) lines.push(["Hooks", listOf(c.hooks, (h) => `<li>${ln(h, pid)}</li>`)]);
  if (c.elsewhere) lines.push(["Elsewhere", `<p>${ln(c.elsewhere, pid)}</p>`]);
  if (c.secret) lines.push(["Secret", `<div class="wn-secret"><p><em>${esc(c.secret)}</em></p>${c.more ? ln.block(c.more, pid) : ""}</div>`]);
  if (c.note) lines.push(["Her note", ln.block(c.note, pid)]);
  // Who sits here, what's in it, and where else it comes up.
  const sits = world.factions.filter((f) => f.seat === p.key);
  if (sits.length) lines.push([sits.length > 1 ? "Factions that sit here" : "The faction that sits here", `<p>${sits.map((f) => `<a class="wn-ln" href="#f-${esc(f.key)}">${esc(f.card.name)}</a>`).join(", ")}</p>`]);
  const inside = (world.places ?? []).filter((q) => q.in === p.key);
  const parts = inside.some((q) => q.area === "part");
  if (inside.length) lines.push([p.area === "district" ? (parts ? `Its ${wordsOf(world).part[1]} and places` : "Its places") : "Places in it", `<p>${inside.map((q) => `<a class="wn-ln" href="#p-${esc(q.key)}">${esc(q.card.name)}</a>`).join(", ")}</p>`]);
  const found = (world.people ?? []).filter((q) => q.at === p.key);
  const ment = mentionsOf(doc, { ...c, id: pid }).filter((e) => !sits.some((f) => `f-${f.key}` === e.id) && !inside.some((q) => `p-${q.key}` === e.id) && !found.some((q) => `p-${q.key}` === e.id));
  if (ment.length) lines.push(["Where else it comes up", `<p>${ment.map((e) => `<a class="wn-ln" href="#${esc(e.id)}">${esc(e.name)}</a>`).join(", ")}</p>`]);
  const go = world.map?.pins?.[p.key] ? `<p class="wn-go"><button type="button" class="wn-gobtn" data-map-p="${esc(p.key)}">${MAP_ICON}On the map</button></p>` : "";
  const find = [c.name, ...c.aka, c.line, whereOf(world, p), ...c.here, ...c.ground, ...c.stakes].join(" ").replace(/\*/g, "").toLowerCase().replace(/[’‘]/g, "'");
  return `
    <details class="wn-f wn-pg is-${p.area || "place"}" id="${pid}" data-area="${esc(of(p.key))}" data-find="${esc(find)}">
      <summary class="wn-fs">
        <span class="wn-fs-die" role="img" aria-label="Challenge ${c.ch}, a d${chDie(c.ch)}">${die(chDie(c.ch), { own: "them", hide: true })}</span>
        <span class="wn-fs-in">
          <span class="wn-k">${esc(whereOf(world, p))}</span>
          <span class="wn-fs-n">${esc(c.name)}</span>
          <span class="wn-fs-w">${esc(c.line)}</span>
        </span>
      </summary>
      <div class="wn-fb">
        <div class="wn-about">${ln.block(c.look, pid)}</div>
        <dl class="wn-lines">${lines.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>${go}
      </div>
    </details>`;
}

// A person's fold: shut, their Challenge as a die, whose Face they are or
// where they're found, their name and who they are, and open, the whole page.
export function personFold(world, p, ln = linkerOf(world), doc = docOf(world)) {
  const c = p.card;
  const pid = `p-${p.key}`;
  const { by, of } = districtsOf(world);
  const faceOf = world.factions.filter((f) => f.faceOf === p.key);
  const at = by.get(p.at);
  const lines = [];
  if (otherNames(c).length) lines.push(["Other names", `<p>${esc(otherNames(c).join(", "))}</p>`]);
  if (c.want) lines.push(["What they want", `<p>${ln(c.want, pid)}</p>`]);
  if (c.tags.length) {
    lines.push([`Challenge ${c.ch} <span class="wn-dl">a d${chDie(c.ch)}</span>`, `<p class="wn-tags">${c.tags.map((t) => `<span class="zd-tag threat"${TAG_NAMES[t.kind] ? ` title="${esc(TAG_NAMES[t.kind])}"` : ""}><em>${esc(t.text)}${t.x > 1 ? ` ×${t.x}` : ""}</em></span>`).join("")}</p>${c.rules ? ln.block(c.rules, pid) : ""}`]);
  }
  if (c.voice) lines.push(["Their voice", `<p>${ln(c.voice, pid)}</p>`]);
  if (c.teles.length) lines.push(["Telegraphs", `<ul class="wn-pl">${c.teles.map((t) => teleLi(t, ln, pid)).join("")}</ul>`]);
  if (c.hooks.length) lines.push(["Hooks", listOf(c.hooks, (h) => `<li>${ln(h, pid)}</li>`)]);
  if (c.secret) lines.push(["Secret", `<div class="wn-secret"><p><em>${esc(c.secret)}</em>${c.weak ? " (their weak point)" : ""}</p>${c.more ? ln.block(c.more, pid) : ""}</div>`]);
  if (c.note) lines.push(["Her note", ln.block(c.note, pid)]);
  if (faceOf.length) lines.push(["The Face of", `<p>${faceOf.map((f) => `<a class="wn-ln" href="#f-${esc(f.key)}">${esc(f.card.name)}</a>`).join(", ")}</p>`]);
  if (at) lines.push(["Where they’re found", `<p><a class="wn-ln" href="#p-${esc(at.key)}">${esc(at.card.name)}</a></p>`]);
  const ment = mentionsOf(doc, { ...c, id: pid }).filter((e) => !faceOf.some((f) => `f-${f.key}` === e.id) && e.id !== `p-${p.at}`);
  if (ment.length) lines.push(["Where else they come up", `<p>${ment.map((e) => `<a class="wn-ln" href="#${esc(e.id)}">${esc(e.name)}</a>`).join(", ")}</p>`]);
  const who = faceOf.length ? `The Face of ${faceOf.map((f) => midName(f.card.name)).join(" and ")}` : at ? `At ${midName(at.card.name)}` : "";
  const find = [c.name, ...c.aka, c.line, who, ...c.tags.map((t) => t.text)].join(" ").toLowerCase().replace(/[’‘]/g, "'");
  return `
    <details class="wn-f wn-pg is-person" id="${pid}" data-area="${esc(of(p.at))}" data-find="${esc(find)}">
      <summary class="wn-fs">
        <span class="wn-fs-die" role="img" aria-label="Challenge ${c.ch}, a d${chDie(c.ch)}">${die(chDie(c.ch), { own: "them", hide: true })}</span>
        <span class="wn-fs-in">
          <span class="wn-k">${esc(who)}</span>
          <span class="wn-fs-n">${esc(c.name)}</span>
          <span class="wn-fs-w">${esc(c.line)}</span>
        </span>
      </summary>
      <div class="wn-fb">
        <div class="wn-about"><p class="wn-sub">What you notice first</p>${ln.block(c.look, pid)}</div>
        <dl class="wn-lines">${lines.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      </div>
    </details>`;
}

// The districts as chips, each with how many it holds, and Find.
function toolsOf(world, items, what, find) {
  const { by } = districtsOf(world);
  const count = (k) => items.filter((x) => x.area === k).length;
  const districts = (world.places ?? []).filter((p) => p.area === "district" && count(p.key));
  return `
    <div class="wn-tools">
      <div class="wn-kinds" role="group" aria-label="Show ${what} in a ${wordsOf(world).district[0]}">
        <button type="button" class="wn-kind" data-area="" aria-pressed="true">Every one <span>${items.length}</span></button>
        ${districts.map((d) => `<button type="button" class="wn-kind" data-area="${esc(d.key)}" aria-pressed="false">${esc(by.get(d.key).card.name)} <span>${count(d.key)}</span></button>`).join("")}
      </div>
      <label class="wn-find"><span class="sr">Find ${what === "places" ? "a place" : "a person"}</span><input type="search" placeholder="${esc(find)}" autocomplete="off" enterkeyhint="search" /></label>
      <p class="wn-found" aria-live="polite"></p>
    </div>`;
}

// Every place, each district with its parts and the places in them after it.
export function placesOf(world, ln = linkerOf(world)) {
  const doc = docOf(world);
  const { of } = districtsOf(world);
  const places = world.places ?? [];
  const order = [];
  const put = (p) => {
    order.push(p);
    for (const q of places.filter((x) => x.in === p.key && x.area === "part")) put(q);
    for (const q of places.filter((x) => x.in === p.key && !x.area)) order.push(q);
  };
  for (const d of places.filter((p) => p.area === "district")) put(d);
  for (const p of places) if (!order.includes(p)) order.push(p);
  const items = places.map((p) => ({ area: of(p.key) }));
  return `${toolsOf(world, items, "places", "Find a place, or who’s there")}<div class="wn-board wn-places">${order.map((p) => placeFold(world, p, ln, doc)).join("")}</div>`;
}

// Every person, the Faces first in the board's order, then everyone else.
export function peopleOf(world, ln = linkerOf(world)) {
  const doc = docOf(world);
  const { of } = districtsOf(world);
  const people = world.people ?? [];
  const faces = world.factions.map((f) => f.faceOf).filter(Boolean);
  const order = [...faces.map((k) => people.find((p) => p.key === k)).filter(Boolean), ...people.filter((p) => !faces.includes(p.key))];
  const items = people.map((p) => ({ area: of(p.at) }));
  return `${toolsOf(world, items, "people", "Find someone, or a tag")}<div class="wn-board wn-people">${order.map((p) => personFold(world, p, ln, doc)).join("")}</div>`;
}

// The map as it's drawn at build time: the picture, and every pin as a link
// to its page underneath, so it all reads with no script. world-ui.js puts it
// in the viewer, to be moved and zoomed in one hand with the pins on it.
export function mapOf(world) {
  if (!world.map) return "";
  const { by } = districtsOf(world);
  const groups = (world.places ?? []).filter((p) => p.area === "district");
  const under = (d) => (world.places ?? []).filter((p) => p.key !== d.key && districtsOf(world).of(p.key) === d.key);
  return `<div class="wn-map" id="wn-map">${drawMap(world.map, { uid: "wnm", label: `A map of ${world.name}: its ${wordsOf(world).district[1]}, their ${wordsOf(world).part[1]}, the main roads and every place with a pin` })}</div>
    <div class="wn-pins" id="wn-pins"><p class="wn-sub">Every pin on the map</p>${groups.map((d) => `<p><a class="wn-ln" href="#p-${esc(d.key)}">${esc(d.card.name)}</a>: ${under(d).map((p) => `<a class="wn-ln" href="#p-${esc(p.key)}">${esc(by.get(p.key).card.name)}</a>`).join(", ")}</p>`).join("")}</div>`;
}
