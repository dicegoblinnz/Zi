// The kit: Zi'Dara's own objects, drawn once and used the same way in the
// rules, the companion and the builder. Every function returns HTML, so Astro
// can draw it at build time and the companion can draw it on the phone.
//
// Two looks share every drawing, picked by data-kit on any parent:
//   lit     light runs along a die's edges, and what matters glows
//   struck  solid pieces, like tokens punched from card
// The geometry is the same in both. Steps fill a die's six edges from the
// top round to the right, so a d2 is one edge, a d6 is half the ring and a
// d12 is the whole of it. Every six steps starts another die, exactly as the
// table in The Core says (#steps-into-dice).

import { stepsToDice } from "../companion/dice.js";
import { SIGILS } from "./sigils.js";

export { SIGILS };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${r1(p.x)},${r1(p.y)}`;

// ── Hex geometry, in a 100 box. Vertex k sits at 60k degrees clockwise from
// the right (y runs down), and the edge from vertex k to k+1 is edge k.
const C = { x: 50, y: 50 };
const vert = (R, k) => ({ x: C.x + R * Math.cos((Math.PI / 3) * k), y: C.y + R * Math.sin((Math.PI / 3) * k) });
const hex = (R) => [0, 1, 2, 3, 4, 5].map((k) => pt(vert(R, k))).join(" ");
const ORDER = [4, 5, 0, 1, 2, 3]; // the top edge first, then round to the right
const VIEW = "0 4 100 92";

function cross(p1, p2, p3, p4) {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  const a = p1.x * p2.y - p1.y * p2.x;
  const b = p3.x * p4.y - p3.y * p4.x;
  return { x: (a * (p3.x - p4.x) - (p1.x - p2.x) * b) / d, y: (a * (p3.y - p4.y) - (p1.y - p2.y) * b) / d };
}
// Edge k as a line, pulled in from the corners so each step can be counted.
function edge(R, k, trim) {
  const a = vert(R, k), b = vert(R, k + 1);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const u = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  return `x1="${r1(a.x + u.x * trim)}" y1="${r1(a.y + u.y * trim)}" x2="${r1(b.x - u.x * trim)}" y2="${r1(b.y - u.y * trim)}"`;
}
// The ring between two hexes, cut into six pieces with an even gap.
function piece(R, r, k, gap) {
  const ray = (t, s) => {
    const a = { x: C.x - Math.sin(t) * s, y: C.y + Math.cos(t) * s };
    return [a, { x: a.x + Math.cos(t), y: a.y + Math.sin(t) }];
  };
  const t0 = (Math.PI / 3) * k, t1 = (Math.PI / 3) * (k + 1);
  const [s0, s1] = ray(t0, gap / 2), [e0, e1] = ray(t1, -gap / 2);
  const O = [vert(R, k), vert(R, k + 1)], I = [vert(r, k), vert(r, k + 1)];
  return [cross(s0, s1, ...O), cross(e0, e1, ...O), cross(e0, e1, ...I), cross(s0, s1, ...I)].map(pt).join(" ");
}

// Drawn once and reused, since every die has the same bones.
const LIT_BODY = hex(44), LIT_FACE = hex(31);
const LIT_EDGES = ORDER.map((k) => edge(44, k, 4.5));
const STRUCK_RIM = hex(46), STRUCK_HUB = hex(24.5);
const STRUCK_PIECES = ORDER.map((k) => piece(43, 27, k, 3.2));

export const SIZES = [2, 4, 6, 8, 10, 12];
const stepsOf = (d) => Math.max(1, Math.min(6, Math.round(d / 2)));

function bones(n) {
  const lit = LIT_EDGES.map((e, i) => (i < n ? "" : `<line class="e" ${e}/>`)).join("");
  const glow = LIT_EDGES.slice(0, n).map((e) => `<line class="e on" ${e}/>`).join("");
  const pieces = STRUCK_PIECES.map((p, i) => `<polygon class="s${i < n ? " on" : ""}" points="${p}"/>`).join("");
  return `<g class="lit"><polygon class="body" points="${LIT_BODY}"/><polygon class="face" points="${LIT_FACE}"/><g class="edges">${lit}</g><g class="glow">${glow}</g></g>` +
    `<g class="struck"><polygon class="rim" points="${STRUCK_RIM}"/>${pieces}<polygon class="hub" points="${STRUCK_HUB}"/></g>`;
}

// One die. own: "you" (gold), "them" (violet) or "harm" (ember).
// face: the number it came up, or nothing for a die still to roll.
// state: "top" (its top face, so 1 Aura back), "low" (it lost) or "tie".
export function die(d, { own = "you", face = null, state = "", label = "", cls = "" } = {}) {
  const n = stepsOf(d);
  const rolled = face !== null && face !== undefined;
  const text = rolled ? String(face) : `d${d}`;
  const name = label || (rolled ? `A d${d} that came up ${face}` : `A d${d}, ${n} ${n === 1 ? "step" : "steps"}`);
  const classes = ["zd-die", `n${n}`, own, rolled ? "is-rolled" : "", state ? `is-${state}` : "", cls].filter(Boolean).join(" ");
  return `<svg class="${classes}" viewBox="${VIEW}" role="img" aria-label="${esc(name)}" data-d="${d}">${bones(n)}<text class="num${text.length > 2 ? " long" : ""}" x="50" y="51">${esc(text)}</text></svg>`;
}

// The dice a number of steps makes, straight off the table.
export function diceFor(steps, opts = {}) {
  const dice = stepsToDice(steps);
  return `<span class="zd-dice" data-steps="${steps}">${dice.map((d) => die(d, opts)).join("")}</span>`;
}

// A small die with no number, for running text: "That's 5 steps, a d10."
export function mini(d, { own = "you" } = {}) {
  return `<svg class="zd-mini n${stepsOf(d)} ${own}" viewBox="${VIEW}" aria-hidden="true">${bones(stepsOf(d))}</svg>`;
}
export const inline = (d, { own = "you", text = `d${d}` } = {}) => `<span class="zd-in ${own}">${mini(d, { own })}<b>${esc(text)}</b></span>`;

// Steps as the pieces of a die: each one's an edge (lit) or a piece (struck).
export function pips(n, { own = "you", label = "" } = {}) {
  return `<span class="zd-pips ${own}" role="img" aria-label="${esc(label || `${n} ${n === 1 ? "step" : "steps"}`)}">${"<i></i>".repeat(n)}</span>`;
}

// Aura: small gold hexes, one back on every top face.
const CHIT = `<svg class="zd-chit" viewBox="${VIEW}" aria-hidden="true"><polygon class="a" points="${hex(44)}"/><polygon class="b" points="${hex(22)}"/></svg>`;
export function aura(have, max = 5) {
  const chits = Array.from({ length: max }, (_, i) => CHIT.replace('class="zd-chit"', `class="zd-chit${i < have ? " on" : ""}"`)).join("");
  return `<span class="zd-aura" role="img" aria-label="Aura ${have} of ${max}">${chits}</span>`;
}
// Resolve: the bigger diamonds, one for every Title.
const GEM = `<svg class="zd-gem" viewBox="0 0 100 100" aria-hidden="true"><path class="a" d="M50 4 L94 50 L50 96 L6 50 Z"/><path class="b" d="M50 26 L72 50 L50 74 L28 50 Z"/></svg>`;
export function resolve(have, max = 2) {
  const gems = Array.from({ length: max }, (_, i) => GEM.replace('class="zd-gem"', `class="zd-gem${i < have ? " on" : ""}"`)).join("");
  return `<span class="zd-resolve" role="img" aria-label="Resolve ${have} of ${max}">${gems}</span>`;
}

// The Hurt track: bars of three. A full bar gets a Catch written in it.
export function hurt({ bars = 3, filled = 0, catches = [] } = {}) {
  let left = filled;
  const out = [];
  for (let b = 0; b < bars; b++) {
    const boxes = [0, 1, 2].map(() => `<i${left-- > 0 ? ' class="on"' : ""}></i>`).join("");
    const caught = catches[b];
    out.push(`<span class="bar${caught ? " caught" : ""}"><span class="boxes">${boxes}</span>${caught ? `<em>${esc(caught)}</em>` : ""}</span>`);
  }
  const said = `Hurt ${filled} of ${bars * 3}${catches.length ? `, with ${catches.map((c) => `the Catch ${c}`).join(" and ")}` : ""}`;
  return `<span class="zd-hurt" role="img" aria-label="${esc(said)}">${out.join("")}</span>`;
}

// A condition is a tag carrying a die. Against you is ember, for you is gold.
export function condition(name, d, { kind = "against" } = {}) {
  const own = kind === "against" ? "harm" : "you";
  return `<span class="zd-cond ${kind} ${own}" role="img" aria-label="${esc(`${name} d${d}, ${kind} whoever carries it`)}">${mini(d, { own })}<b>d${d}</b><em>${esc(name)}</em></span>`;
}
// A threat's tags, and the ones still hidden.
export function tag(name, { kind = "threat" } = {}) {
  if (kind === "hidden") return `<span class="zd-tag hidden"><em>${esc(name || "hidden")}</em></span>`;
  return `<span class="zd-tag ${kind}"><em>${esc(name)}</em></span>`;
}

// ── Sigils and crests
export function sigil(name, { cls = "" } = {}) {
  const art = SIGILS[name];
  if (!art) throw new Error(`The kit has no sigil for the ${name} archetype. Draw one in src/kit/sigils.js.`);
  return `<svg class="zd-sigil${cls ? ` ${cls}` : ""}" viewBox="0 0 24 24" aria-hidden="true">${art}</svg>`;
}
// A crest is the Zi'Dara mark made personal: the violet diamond, with the
// first Title's archetype in the middle. Taken twice, the diamond's doubled.
// A second archetype sits in a seal on the lower edge (big crests only).
export function crest(archetypes, { size = "lg", label = "" } = {}) {
  const [first, ...rest] = archetypes;
  const twice = rest.includes(first);
  const others = [...new Set(rest.filter((a) => a !== first))];
  const art = (name) => {
    if (!SIGILS[name]) throw new Error(`The kit has no sigil for the ${name} archetype. Draw one in src/kit/sigils.js.`);
    return SIGILS[name];
  };
  const seal = size === "lg" && others[0]
    ? `<g class="seal"><path class="sf" d="M48 34 L62 48 L48 62 L34 48 Z"/><path class="sc" d="M48 38.6 L57.4 48 L48 57.4 L38.6 48 Z"/><g class="sg" transform="translate(41.2 41.2) scale(0.567)">${art(others[0])}</g></g>`
    : "";
  const heart = seal ? `translate(14.6 14.6) scale(1.2)` : `translate(15.2 15.2) scale(1.4)`;
  const name = label || `${archetypes.join(" and ")}${twice ? " (twice)" : ""}`;
  return `<svg class="zd-crest ${size}${twice ? " twice" : ""}" viewBox="0 0 64 64" role="img" aria-label="${esc(name)}">` +
    `<path class="field" d="M32 2.6 L61.4 32 L32 61.4 L2.6 32 Z"/>` +
    `<path class="core" d="M32 9 L55 32 L32 55 L9 32 Z"/>` +
    (twice ? `<path class="ring" d="M32 6.2 L57.8 32 L32 57.8 L6.2 32 Z"/>` : "") +
    `<g class="heart" transform="${heart}">${art(first)}</g>${seal}</svg>`;
}

// What a telegraph's aimed at when it isn't someone: a stake (a clock, a
// door, a getaway) or a place (only whoever's there when it lands).
const AIMS = {
  stake: `<svg class="zd-aim" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M12 7 V12 L15.4 14.2"/></svg>`,
  place: `<svg class="zd-aim" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.4 C12 21.4 5 14.6 5 9.6 A7 7 0 0 1 19 9.6 C19 14.6 12 21.4 12 21.4 Z"/><circle cx="12" cy="9.6" r="2.6"/></svg>`,
};

// ── The telegraph card: what it's doing, who or what it's aimed at, how hard.
// aim: "someone" (give atCrest), "stake" or "place".
export function telegraph({ who, does, at = "", atCrest = null, aim = atCrest ? "someone" : "stake", d, round = 1, one = "", level = 3 }) {
  const mark = aim === "someone" && atCrest ? crest(atCrest, { size: "sm", label: at }) : AIMS[aim] || AIMS.stake;
  const h = `h${level}`;
  return `<article class="zd-tele at-${aim}">` +
    `<header><span class="k">Telegraph</span><span class="r">Round ${round}</span></header>` +
    `<div class="tb">${die(d, { own: "them", label: `${who}'s d${d}` })}<div><${h}>${esc(who)}</${h}><p>${esc(does)}</p></div></div>` +
    (one ? `<p class="one"><b>Only one answer.</b> ${esc(one)}</p>` : "") +
    `<footer><span class="at">${mark}<span>At ${esc(at)}</span></span><span class="when">${aim === "place" ? "Hits whoever's there when it lands" : "Lands at the end of the round"}</span></footer>` +
    `</article>`;
}

// A cost in running text, like "1 Aura": the token, then the words.
export const cost = (n, what = "Aura") => `<span class="zd-cost">${what === "Aura" ? CHIT.replace('class="zd-chit"', 'class="zd-chit on"') : GEM.replace('class="zd-gem"', 'class="zd-gem on"')}${n} ${esc(what)}</span>`;

// The hidden bits every glow and hatch needs, once per page.
export const DEFS = `<svg class="zd-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>` +
  `<filter id="zd-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<filter id="zd-glow-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<pattern id="zd-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><path d="M0 0 V6" stroke="#111" stroke-width="2.4"/></pattern>` +
  `</defs></svg>`;
