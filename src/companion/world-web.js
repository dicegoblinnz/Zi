// The faction web (stage 6 of notes/builder-plan.md): the factions round a
// ring, their threads drawn between them, bond and hostile, with the crew in
// the middle. It draws whatever board it's handed, so a player only ever
// gets what they've been shown (forPlayer() in board.js has had its say
// before the board reaches their phone), the GM gets all of it, and the
// world builder's board screen draws the web it's dealt.
//
// webOf(nodes, threads) lays it out. A node's { id, name, dice (its Power as
// dice, or null when the crew doesn't know it), mini, parent, hidden }, in
// the board's order, and a thread's { from, to (a node's id, or "crew"),
// kind (bond or hostile), s (whole, strained or snapped), text }. The
// factions go round the ring so the ones with threads between them sit near
// each other, each mini faction straight after the faction that made it,
// and the board's first faction at the top. drawWeb() is the picture with a
// button on every faction and the crew, and panelOf() is what goes under it:
// a key, or the threads of the faction (or the crew) that's been tapped.
import { die as kitDie } from "../kit/kit.js";

// How far round from the middle the factions sit, in a hundredth of the
// ring's width. More factions, a wider ring and smaller names, and past
// twelve the ring's as wide as it needs to be for every faction to have
// room for a thumb, and slides sideways in its own box.
const radius = (n) => (n <= 6 ? 34 : n <= 12 ? 36 : 40);
const MANY = 12;
// What a line stops short of, so its arrow shows: a faction's die, the crew's.
const NODE = 5.4;
const CREW = 8.2;
// How wide a berth a line between two factions gives the crew.
const CLEAR = 11;

// The factions in their order round the ring: each faction with its mini
// factions after it, the blocks swapped round till the ones tied together
// sit as close as they can, then turned so the board's first is at the top.
function orderOf(nodes, threads) {
  const at = new Set(nodes.map((n) => n.id));
  const top = nodes.filter((n) => !(n.mini && n.parent && at.has(n.parent)));
  const blocks = top.map((n) => [n.id, ...nodes.filter((m) => m.mini && m.parent === n.id).map((m) => m.id)]);
  const blockOf = new Map();
  blocks.forEach((b, k) => b.forEach((id) => blockOf.set(id, k)));
  const ties = new Map();
  for (const t of threads) {
    const a = blockOf.get(t.from);
    const b = blockOf.get(t.to);
    if (a == null || b == null || a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    ties.set(key, (ties.get(key) ?? 0) + 1);
  }
  const B = blocks.length;
  const pos = blocks.map((_, k) => k);
  const pairs = [...ties.entries()].map(([key, w]) => [...key.split("|").map(Number), w]);
  const cost = () => pairs.reduce((c, [a, b, w]) => {
    const d = Math.abs(pos[a] - pos[b]);
    return c + w * Math.min(d, B - d);
  }, 0);
  if (B > 3 && pairs.length) {
    let best = cost();
    for (let pass = 0; pass < 6; pass++) {
      let moved = false;
      for (let a = 0; a < B; a++) {
        for (let b = a + 1; b < B; b++) {
          [pos[a], pos[b]] = [pos[b], pos[a]];
          const c = cost();
          if (c < best) {
            best = c;
            moved = true;
          } else [pos[a], pos[b]] = [pos[b], pos[a]];
        }
      }
      if (!moved) break;
    }
  }
  const shift = pos[0];
  return blocks.map((b, k) => ({ b, slot: (pos[k] - shift + B) % B })).sort((x, y) => x.slot - y.slot).flatMap((x) => x.b);
}

export function webOf(nodes, threads) {
  const order = orderOf(nodes, threads);
  const n = order.length;
  const r = radius(n);
  const byId = new Map(nodes.map((x) => [x.id, x]));
  const pts = new Map([["crew", { x: 50, y: 50 }]]);
  const out = order.map((id, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const p = { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
    pts.set(id, p);
    return { ...byId.get(id), ...p };
  });
  return { nodes: out, threads: threads.filter((t) => t.from !== t.to && pts.has(t.from) && pts.has(t.to)), pts, n };
}

// The lines: a faction's threads toward another (or the crew) by kind, two
// the same kind going both ways being one line with no arrow, and lines
// between the same two bowing apart, every line between two factions
// bowing round the crew.
function linesOf(L) {
  const groups = new Map();
  for (const t of L.threads) {
    const key = `${t.from}>${t.to}>${t.kind}`;
    const g = groups.get(key) ?? { a: t.from, b: t.to, kind: t.kind, strained: false, snapped: true };
    if (t.s === "strained") g.strained = true;
    if (t.s !== "snapped") g.snapped = false;
    groups.set(key, g);
  }
  const lines = [];
  const used = new Set();
  for (const [key, g] of groups) {
    if (used.has(key)) continue;
    used.add(key);
    const backKey = `${g.b}>${g.a}>${g.kind}`;
    const back = g.b === "crew" ? null : groups.get(backKey);
    if (back && !used.has(backKey) && !g.snapped && !back.snapped) {
      used.add(backKey);
      lines.push({ ...g, both: true, strained: g.strained || back.strained });
    } else lines.push({ ...g, both: false });
  }
  const pair = (x) => [x.a, x.b].sort().join("|");
  const count = new Map();
  for (const x of lines) count.set(pair(x), (count.get(pair(x)) ?? 0) + 1);
  const seen = new Map();
  for (const x of lines) {
    const k = pair(x);
    const total = count.get(k);
    const i = seen.get(k) ?? 0;
    seen.set(k, i + 1);
    x.bow = total === 1 ? 0 : -1 + (2 * i) / (total - 1);
  }
  return lines;
}

const f1 = (v) => Math.round(v * 10) / 10;
function pathOf(L, x) {
  // Worked out from one end to the other the same way whichever way the
  // thread goes, so two between the same pair bow to either side.
  const [lo, hi] = [x.a, x.b].sort();
  const p = L.pts.get(lo);
  const q = L.pts.get(hi);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const crew = x.b === "crew" || x.a === "crew";
  // Between two factions, a line that would cross the crew bows round it.
  let off = x.bow * (crew ? 3.2 : 5);
  if (!crew) {
    const side = (50 - p.x) * nx + (50 - p.y) * ny;
    const near = Math.abs(side);
    if (near < CLEAR) {
      const away = side > 0 ? -1 : 1;
      off += away * 2 * (CLEAR - near);
    }
  }
  const mx = (p.x + q.x) / 2 + nx * off;
  const my = (p.y + q.y) / 2 + ny * off;
  // Each end stops short of what's drawn there.
  const cut = (s, end) => {
    const r = end === "crew" ? CREW : NODE;
    const ex = mx - s.x;
    const ey = my - s.y;
    const d = Math.hypot(ex, ey) || 1;
    return { x: s.x + (ex / d) * r, y: s.y + (ey / d) * r };
  };
  const from = x.a === lo ? p : q;
  const to = x.a === lo ? q : p;
  const s = cut(from, x.a);
  const e = cut(to, x.b);
  return `M${f1(s.x)} ${f1(s.y)}Q${f1(mx)} ${f1(my)} ${f1(e.x)} ${f1(e.y)}`;
}

// The picture, and a button on every faction and the crew. opts:
//   esc       escapes words for the page
//   sel       the tapped faction's id, or "crew"
//   attrs     (id) => the button's attributes, for its tap
//   label     (node) => what a screen reader hears for a faction
//   crew      { name, dice } for the crew in the middle
//   uid       a word to keep its arrows apart from another web's
export function drawWeb(L, opts) {
  const { esc, sel = null, uid = "w" } = opts;
  const lines = linesOf(L);
  const touches = (x, id) => x.a === id || x.b === id;
  const near = new Set();
  if (sel) for (const x of lines) if (touches(x, sel)) near.add(x.a === sel ? x.b : x.a);
  const svg = lines.map((x) => {
    const cls = [`ww-l is-${x.kind}`, x.strained ? "is-strained" : "", x.snapped ? "is-snapped" : "", sel ? (touches(x, sel) ? "is-hi" : "is-dim") : ""].filter(Boolean).join(" ");
    const arrow = x.both ? "" : ` marker-end="url(#ww-${uid}-${x.kind === "hostile" ? "h" : "b"})"`;
    return `<path class="${cls}" d="${pathOf(L, x)}"${arrow}/>`;
  }).join("");
  const marker = (k) => `<marker id="ww-${uid}-${k}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="3.6" markerHeight="3.6" orient="auto"><path class="ww-arrow is-${k === "h" ? "hostile" : "bond"}" d="M0 0L6 3L0 6Z"/></marker>`;
  const nodes = L.nodes.map((nd) => {
    const cls = ["ww-node", nd.mini ? "is-mini" : "", nd.hidden ? "is-hidden" : "", sel === nd.id ? "is-sel" : sel && sel !== nd.id && !near.has(nd.id) ? "is-dim" : ""].filter(Boolean).join(" ");
    const die = nd.dice?.length ? kitDie(nd.dice[0], { own: "them", hide: true }) : '<span class="ww-unknown" aria-hidden="true">?</span>';
    return `<button type="button" class="${cls}" style="left:${f1(nd.x)}%;top:${f1(nd.y)}%" ${opts.attrs(nd.id)} aria-pressed="${sel === nd.id}" aria-label="${esc(opts.label(nd))}"><span class="ww-die" aria-hidden="true">${die}</span><span class="ww-name" aria-hidden="true">${esc(String(nd.name ?? "").replace(/^The /, ""))}</span></button>`;
  }).join("");
  const c = opts.crew ?? {};
  const crewCls = ["ww-crew", sel === "crew" ? "is-sel" : sel && !near.has("crew") ? "is-dim" : ""].filter(Boolean).join(" ");
  const crewDie = c.dice?.length ? kitDie(c.dice[0], { hide: true }) : '<span class="ww-unknown is-crew" aria-hidden="true">?</span>';
  const crew = `<button type="button" class="${crewCls}" style="left:50%;top:50%" ${opts.attrs("crew")} aria-pressed="${sel === "crew"}" aria-label="${esc(c.label ?? "The crew")}"><span class="ww-die" aria-hidden="true">${crewDie}</span><span class="ww-name" aria-hidden="true">${esc(c.name || "The crew")}</span></button>`;
  const size = L.n > MANY ? " is-many" : L.n > 8 ? " is-more" : "";
  const wide = L.n > MANY ? ` style="--ww-min:${L.n * 24}px"` : "";
  return `<div class="ww-wrap"><div class="ww-ring${size}${sel ? " is-sel" : ""}"${wide}><svg class="ww-lines" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>${marker("b")}${marker("h")}</defs>${svg}</svg>${nodes}${crew}</div></div>`;
}

// What a line looks like, for the key.
export function keyOf() {
  const swatch = (cls) => `<svg class="ww-swatch" viewBox="0 0 28 8" aria-hidden="true" focusable="false"><path class="ww-l ${cls}" d="M1 4H27"/></svg>`;
  return `<ul class="ww-key"><li>${swatch("is-bond")}Bond</li><li>${swatch("is-hostile")}Hostile</li><li>${swatch("is-bond is-strained")}Strained</li><li>${swatch("is-hostile is-snapped")}Snapped</li></ul>`;
}
