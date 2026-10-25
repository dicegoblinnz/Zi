// The kit: Zi'Dara's own objects, drawn once and used the same way in the
// rules, the companion and the builder. Every function returns HTML, so Astro
// can draw it at build time and the companion can draw it on the phone.
//
// The look is Struck (Mo's pick, 26 Oct 2026): tokens punched out of card, the
// same in every theme. Every die is its real shape, so its size shows before
// you read it: a d2's a coin, a d4 a triangle, a d6 a square, a d8 a diamond,
// a d10 a kite and a d12 a pentagon. Its faces are solid pieces in the owner's
// colour round a hub the same shape, with the number on the hub. A die that
// changes size grows into the next shape (grow()). The geometry's in
// notes/design-26oct.md.

import { stepsToDice } from "../companion/dice.js";
import { SIGILS } from "./sigils.js";

export { SIGILS };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;
const P = (p) => `${r1(p.x)} ${r1(p.y)}`;

// ── The six shapes, in a 100 box, every outline clockwise from the top.
// c is the centre the hub and the pieces shrink towards, hub how far in the
// hub sits, and num where the number goes and how big it is against the rest.
const around = (n, r, cx, cy) => Array.from({ length: n }, (_, k) => {
  const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
});
export const SHAPES = {
  2: { name: "coin", c: { x: 50, y: 50 }, r: 46, hub: 0.62, num: { y: 50, k: 1 } },
  4: { name: "triangle", c: { x: 50, y: 61 }, pts: around(3, 54, 50, 61), hub: 0.6, num: { y: 64, k: 0.84 } },
  6: { name: "square", c: { x: 50, y: 50 }, pts: [{ x: 8, y: 8 }, { x: 92, y: 8 }, { x: 92, y: 92 }, { x: 8, y: 92 }], hub: 0.6, num: { y: 50, k: 1 } },
  8: { name: "diamond", c: { x: 50, y: 50 }, pts: [{ x: 50, y: 2 }, { x: 98, y: 50 }, { x: 50, y: 98 }, { x: 2, y: 50 }], hub: 0.58, num: { y: 50, k: 0.92 } },
  10: { name: "kite", c: { x: 50, y: 45 }, pts: [{ x: 50, y: 2 }, { x: 95, y: 40 }, { x: 50, y: 98 }, { x: 5, y: 40 }], hub: 0.62, num: { y: 47, k: 0.86 } },
  12: { name: "pentagon", c: { x: 50, y: 54 }, pts: around(5, 50, 50, 54), hub: 0.62, num: { y: 56, k: 0.92 } },
};
export const SIZES = [2, 4, 6, 8, 10, 12];
const shapeOf = (d) => SHAPES[d] ?? SHAPES[SIZES.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a))];
const toward = (p, c, k) => ({ x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k });

// A shape's outline pulled in towards its centre, as a path.
function pathOf(S, k = 1) {
  if (!S.pts) {
    const r = r1(S.r * k);
    return `M${r1(S.c.x)} ${r1(S.c.y - r)}A${r} ${r} 0 1 1 ${r1(S.c.x)} ${r1(S.c.y + r)}A${r} ${r} 0 1 1 ${r1(S.c.x)} ${r1(S.c.y - r)}Z`;
  }
  return `M${S.pts.map((p) => P(toward(p, S.c, k))).join("L")}Z`;
}
// The cuts between the pieces: one at each corner, from the ring to the hub.
// The coin's two halves are cut at 9 and 3 o'clock.
function cutsOf(S) {
  const corners = S.pts ?? [{ x: S.c.x - S.r, y: S.c.y }, { x: S.c.x + S.r, y: S.c.y }];
  return corners.map((p) => {
    const a = toward(p, S.c, 0.9), b = toward(p, S.c, S.hub);
    return `<line class="cut" x1="${r1(a.x)}" y1="${r1(a.y)}" x2="${r1(b.x)}" y2="${r1(b.y)}"/>`;
  }).join("");
}
// Drawn once and reused: the token, the pieces round the hub, and the hub.
const BODY = Object.fromEntries(SIZES.map((d) => {
  const S = SHAPES[d];
  return [d, `<path class="tok" d="${pathOf(S)}"/><g class="pcs"><path class="pc" fill-rule="evenodd" d="${pathOf(S, 0.9)}${pathOf(S, S.hub)}"/>${cutsOf(S)}</g><path class="hub" d="${pathOf(S, S.hub)}"/>`];
}));

// One die. own: "you" (gold), "them" (violet) or "harm" (ember).
// face: the number it came up, or nothing for a die still to roll.
// state: "top" (its top face, so 1 Aura back), "low" (it lost) or "tie".
// spin: it's tumbling (feel.js changes its number till it lands).
// hide: the words are somewhere beside it, so it's only a picture.
export function die(d, { own = "you", face = null, state = "", label = "", cls = "", spin = false, hide = false } = {}) {
  const S = shapeOf(d);
  const size = SIZES.includes(d) ? d : SIZES.find((x) => SHAPES[x] === S);
  const rolled = face !== null && face !== undefined && face !== "";
  const text = rolled ? String(face) : `d${size}`;
  const name = label || (rolled ? `A d${size} that came up ${face}` : `A d${size}`);
  const fit = text.length >= 3 ? 0.8 : text.length === 2 ? 0.84 : 1;
  const fs = r1((rolled ? 38 : 27) * S.num.k * fit);
  const classes = ["zd-die", own, rolled ? "is-rolled" : "", state ? `is-${state}` : "", cls].filter(Boolean).join(" ");
  const named = hide ? 'aria-hidden="true"' : `role="img" aria-label="${esc(name)}"`;
  return `<svg class="${classes}" viewBox="0 0 100 100" ${named} data-d="${size}"${spin ? ` data-spin="${size}"` : ""}>${BODY[size]}<text class="num" x="50" y="${S.num.y}" font-size="${fs}">${esc(text)}</text></svg>`;
}

// The dice a number of steps makes, straight off the table.
export function diceFor(steps, opts = {}) {
  const dice = stepsToDice(steps);
  return `<span class="zd-dice" data-steps="${steps}">${dice.map((d) => die(d, opts)).join("")}</span>`;
}

// A small die with no number, for running text: "That's 5 steps, a d10."
export function mini(d, { own = "you" } = {}) {
  const S = shapeOf(d);
  const size = SIZES.find((x) => SHAPES[x] === S);
  return `<svg class="zd-mini ${own}" viewBox="0 0 100 100" aria-hidden="true" data-d="${size}">${BODY[size]}</svg>`;
}
export const inline = (d, { own = "you", text = `d${d}` } = {}) => `<span class="zd-in ${own}">${mini(d, { own })}<b>${esc(text)}</b></span>`;

// Steps, where a set action needs them: one pip a line.
export function pips(n, { own = "you", label = "" } = {}) {
  return `<span class="zd-pips ${own}" role="img" aria-label="${esc(label || `${n} ${n === 1 ? "step" : "steps"}`)}">${"<i></i>".repeat(n)}</span>`;
}

// ── Growing: a die that changes size grows into the next shape. Both
// outlines are walked from the top, clockwise, as 120 points, and each point
// moves to its place on the new one, with the hub following and the pieces
// fading out and back. The new die's already drawn, so a phone set to reduce
// motion just sees the swap.
const N = 120;
function walk(S) {
  if (!S.pts) return Array.from({ length: N }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
    return { x: S.c.x + S.r * Math.cos(a), y: S.c.y + S.r * Math.sin(a) };
  });
  const p = S.pts;
  // From the top corner, or the middle of the top edge when there isn't one.
  const top = p[0].x === S.c.x ? p[0] : { x: S.c.x, y: p[0].y };
  const line = p[0] === top ? [...p, p[0]] : [top, ...p.slice(1), p[0], top];
  const seg = line.slice(1).map((q, i) => Math.hypot(q.x - line[i].x, q.y - line[i].y));
  const total = seg.reduce((a, b) => a + b, 0);
  const out = [];
  let i = 0;
  let done = 0;
  for (let k = 0; k < N; k++) {
    const t = (k * total) / N;
    while (i < seg.length - 1 && done + seg[i] < t) done += seg[i++];
    const f = seg[i] ? (t - done) / seg[i] : 0;
    out.push({ x: line[i].x + (line[i + 1].x - line[i].x) * f, y: line[i].y + (line[i + 1].y - line[i].y) * f });
  }
  return out;
}
const WALKS = Object.fromEntries(SIZES.map((d) => [d, walk(SHAPES[d])]));
const still = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function grow(svg, from, to, { ms = 320 } = {}) {
  if (!svg || from === to || still() || !SHAPES[from] || !SHAPES[to]) return false;
  const tok = svg.querySelector(".tok");
  const hub = svg.querySelector(".hub");
  if (!tok || !hub) return false;
  const A = WALKS[from], B = WALKS[to], SA = SHAPES[from], SB = SHAPES[to];
  const ends = [tok.getAttribute("d"), hub.getAttribute("d")];
  const line = (pts) => `M${pts.map(P).join("L")}Z`;
  // Ease-out, gentle enough that the eye follows the shape changing.
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const start = performance.now();
  svg.classList.add("is-grown");
  svg.animate([{ transform: "scale(1)" }, { transform: "scale(1.07)", offset: 0.45 }, { transform: "scale(1)" }], { duration: ms, easing: "ease-out" });
  svg.querySelector(".pcs")?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: ms + 140, easing: "ease-out" });
  const frame = (now) => {
    if (!svg.isConnected) return;
    const t = Math.min(1, (now - start) / ms);
    const e = ease(t);
    if (t >= 1) {
      tok.setAttribute("d", ends[0]);
      hub.setAttribute("d", ends[1]);
      return;
    }
    const at = A.map((a, i) => ({ x: a.x + (B[i].x - a.x) * e, y: a.y + (B[i].y - a.y) * e }));
    const c = { x: SA.c.x + (SB.c.x - SA.c.x) * e, y: SA.c.y + (SB.c.y - SA.c.y) * e };
    const k = SA.hub + (SB.hub - SA.hub) * e;
    tok.setAttribute("d", line(at));
    hub.setAttribute("d", line(at.map((p) => toward(p, c, k))));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}

// ── Aura and Resolve. Aura's small gold hexes, one back on every top face,
// and since no die's a hex they never look like one.
const hex = (R) => [0, 1, 2, 3, 4, 5].map((k) => {
  const a = (Math.PI / 3) * k;
  return `${r1(50 + R * Math.cos(a))},${r1(50 + R * Math.sin(a))}`;
}).join(" ");
const CHIT = `<svg class="zd-chit" viewBox="0 4 100 92" aria-hidden="true"><polygon class="a" points="${hex(44)}"/><polygon class="b" points="${hex(22)}"/></svg>`;
export function aura(have, max = 5) {
  const chits = Array.from({ length: max }, (_, i) => CHIT.replace('class="zd-chit"', `class="zd-chit${i < have ? " on" : ""}"`)).join("");
  return `<span class="zd-aura" role="img" aria-label="Aura ${have} of ${max}">${chits}</span>`;
}
// Resolve's a cut gem, one for every Title: a flat top, shoulders and a point,
// so it never looks like the d8's diamond.
const GEM = `<svg class="zd-gem" viewBox="0 0 100 100" aria-hidden="true"><path class="a" d="M30 10 H70 L94 37 L50 94 L6 37 Z"/><path class="b" d="M6 37 H94 M30 10 L39 37 L50 94 L61 37 L70 10"/></svg>`;
export function resolve(have, max = 2) {
  const gems = Array.from({ length: max }, (_, i) => GEM.replace('class="zd-gem"', `class="zd-gem${i < have ? " on" : ""}"`)).join("");
  return `<span class="zd-resolve" role="img" aria-label="Resolve ${have} of ${max}">${gems}</span>`;
}

// ── Scars, beside the wound die: each one's a Catch, and each starts the wound
// die a size bigger. With slots, all five show, since five Scars means the
// next Blaze is the last.
export const MAX_SCARS = 5;
export function scars(n, { max = MAX_SCARS, slots = false } = {}) {
  const shown = slots ? max : Math.min(n, max);
  if (!shown) return "";
  const marks = Array.from({ length: shown }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("");
  return `<span class="zd-scars harm" role="img" aria-label="${n} ${n === 1 ? "Scar" : "Scars"}${slots ? ` of ${max}` : ""}">${marks}</span>`;
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
// The build stops on an archetype with no sigil. On the phone (strict: false)
// one's left out instead, since a saved character can outlive an archetype.
export function crest(archetypes, { size = "lg", label = "", strict = true } = {}) {
  const known = strict ? archetypes : archetypes.filter((a) => SIGILS[a]);
  const [first, ...rest] = known;
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
    (first ? `<g class="heart" transform="${heart}">${art(first)}</g>` : `<path class="heart-plain" d="M32 22 L42 32 L32 42 L22 32 Z"/>`) + `${seal}</svg>`;
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

// The hatching the GM's pieces get on paper, once per page.
export const DEFS = `<svg class="zd-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>` +
  `<pattern id="zd-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><path d="M0 0 V6" stroke="#111" stroke-width="2.4"/></pattern>` +
  `</defs></svg>`;
