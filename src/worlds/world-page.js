// A whole world on its own page, /worlds/<universe>/ (notes/builder-plan.md,
// A whole world): the board, the web and How it came to be, drawn from a
// year's world as scripts/worlds.mjs wrote it. Pure, so the page draws it at
// build time and world-ui.js draws the web again on a tap, the same way.
// Every faction's a fold that reads at a glance while it's shut, the way the
// World screen holds a faction, and its name anywhere on the page is a link
// to it.

import { die, esc } from "../kit/kit.js";
import { diceLabel, stepsToDice } from "../companion/dice.js";
import { drawWeb, keyOf as webKey, webOf } from "../companion/world-web.js";

export const AGE_NAMES = { 1: "Long ago", 2: "In living memory", 3: "This last year" };
const BONDS = [["pub", "Public Sentiment"], ["mor", "Morale"], ["loy", "Loyalty"]];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");

// Every faction's name as a link to its card, longest first so the Mox's
// Lizzie's Bar never cuts into a longer name. A name with "The" in front
// links with or without it.
export function linkerOf(world) {
  const names = [];
  for (const f of world.factions) {
    const n = f.card.name;
    names.push([n, f.key]);
    if (/^The /.test(n)) names.push([n.slice(4), f.key]);
  }
  names.sort((a, b) => b[0].length - a[0].length);
  const rx = names.length ? new RegExp(`(?<![\\w’'-])(${names.map(([n]) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w-])`, "g") : null;
  const keyOf = new Map(names.map(([n, k]) => [n, k]));
  return (text, self = "") => {
    const s = String(text ?? "");
    if (!rx) return esc(s);
    let out = "";
    let at = 0;
    for (const m of s.matchAll(rx)) {
      const k = keyOf.get(m[1]);
      out += esc(s.slice(at, m.index));
      out += k && k !== self ? `<a class="wn-ln" href="#f-${esc(k)}">${esc(m[1])}</a>` : esc(m[1]);
      at = m.index + m[1].length;
    }
    return out + esc(s.slice(at));
  };
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
  if (!mini) lines.push(["Want", `<p>${ln(c.want, f.key)}</p>`]);
  if (c.face) lines.push(["Face", `<p>${ln(c.face, f.key)}</p>`]);
  if (mini) lines.push(["What it does", `<p>${esc(list(c.outs))}</p>`]);
  lines.push([
    `Power <span class="wn-dl">${esc(diceLabel(dice))}</span>`,
    `<p class="wn-sum">${people.length ? "1 step, and a step for each of these." : "Just its 1 step, with nobody who turns up yet."}</p>${chips(people.map((a) => chip(`<span class="wn-cn">${esc(a.text)}${times(a.x)}<span class="wn-plus">+1 Power</span></span>${a.does.replace(/^\+1 Power\.?\s*/, "") ? `<span class="wn-does">${ln(a.does.replace(/^\+1 Power\.?\s*/, ""), f.key)}</span>` : ""}`, "is-people")))}`,
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
          return chip(`<span class="wn-cn">${esc(a.text)}${times(a.x)}</span><span class="wn-does">${ln(a.does, f.key)}</span>${need}`, a.off ? "is-need" : "");
        }),
      ),
    ]);
  }
  if (c.agendas.length) {
    lines.push([
      c.agendas.length > 1 ? "Agendas" : "Agenda",
      `<ul class="wn-ags">${c.agendas.map((a) => `<li>${die(a.die, { own: "them", label: `at d${a.die}` })}<div><p>${ln(a.text, f.key)}</p>${a.then ? `<p class="wn-then">When it happens: ${ln(a.then, f.key)}</p>` : ""}</div></li>`).join("")}</ul>`,
    ]);
  }
  const bonds = BONDS.filter(([k]) => c[k]?.length);
  if (bonds.length) lines.push(["Bonds", bonds.map(([k, label]) => `<p class="wn-sub">${label}</p><ul class="wn-ts">${c[k].map((t) => threadLi(t, ln, "", f.key)).join("")}</ul>`).join("")]);
  if (c.threads.length) lines.push(["Threads", `<ul class="wn-ts">${c.threads.map((t) => threadLi(t, ln, `toward ${linkTo(t.to)}`, f.key)).join("")}</ul>`]);
  const back = world.factions.flatMap((g) => g.card.threads.filter((t) => t.to === f.key).map((t) => ({ ...t, from: g.key })));
  if (back.length) lines.push(["Toward it", `<ul class="wn-ts">${back.map((t) => threadLi(t, ln, `from ${linkTo(t.from)}`, f.key)).join("")}</ul>`]);
  const made = world.factions.filter((g) => g.of === f.key);
  if (made.length) lines.push(["Mini factions", `<p>${made.map((g) => linkTo(g.key)).join(", ")}</p>`]);
  if (c.secret) lines.push(["Secret", `<div class="wn-secret"><p><em>${esc(c.secret)}</em></p>${c.more ? `<p>${ln(c.more, f.key)}</p>` : ""}</div>`]);
  if (c.note) lines.push(["Her note", `<p>${ln(c.note, f.key)}</p>`]);

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
        <p class="wn-about">${ln(c.about, f.key)}</p>
        <dl class="wn-lines">${lines.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
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
  return [plural(world.factions.length, "faction", "factions"), plural(threads, "thread", "threads"), plural(world.history.length, "line of history", "lines of history")];
}
