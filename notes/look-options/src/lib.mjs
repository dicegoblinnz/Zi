// Shared drawing pieces for the look options: everything in millimetres on
// an A4 SVG (viewBox 0 0 210 297), so the boxes are where the PDF's fields
// would go.
import { SHAPES } from "../../../src/kit/kit.js";
import { SIGILS } from "../../../src/kit/sigils.js";
export { SIGILS };

const FS = new URL("../../../node_modules/@fontsource/", import.meta.url).pathname;
const face = (fam, file, w, style = "normal") =>
  `@font-face{font-family:'${fam}';src:url('file://${FS}${file}') format('woff2');font-weight:${w};font-style:${style}}`;
export const FONTS = [
  face("Cinzel", "cinzel/files/cinzel-latin-500-normal.woff2", 500),
  face("Cinzel", "cinzel/files/cinzel-latin-600-normal.woff2", 600),
  face("Cinzel", "cinzel/files/cinzel-latin-700-normal.woff2", 700),
  face("Cinzel", "cinzel/files/cinzel-latin-900-normal.woff2", 900),
  face("Cinzel Decorative", "cinzel-decorative/files/cinzel-decorative-latin-700-normal.woff2", 700),
  face("Cinzel Decorative", "cinzel-decorative/files/cinzel-decorative-latin-900-normal.woff2", 900),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-400-normal.woff2", 400),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-400-italic.woff2", 400, "italic"),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-500-normal.woff2", 500),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-500-italic.woff2", 500, "italic"),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-700-normal.woff2", 700),
  face("Alegreya Sans", "alegreya-sans/files/alegreya-sans-latin-800-normal.woff2", 800),
].join("\n");

export const r2 = (n) => Math.round(n * 100) / 100;
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rad = (a) => (a * Math.PI) / 180;
export const polar = (cx, cy, r, a) => ({ x: cx + r * Math.cos(rad(a)), y: cy + r * Math.sin(rad(a)) });

// Text. size and widths in mm.
export function t(x, y, s, cls = "lab", { a = "start", size, ls, fill, w, style = "" } = {}) {
  const at = a === "middle" ? "middle" : a === "end" ? "end" : "start";
  const st = [size ? `font-size:${size}px` : "", ls !== undefined ? `letter-spacing:${ls}px` : "", fill ? `fill:${fill}` : "", style].filter(Boolean).join(";");
  return `<text x="${r2(x)}" y="${r2(y)}" class="${cls}" text-anchor="${at}"${st ? ` style="${st}"` : ""}${w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(s)}</text>`;
}
// Rough wrap for Alegreya Sans at a size (mm): ~0.47 em a character.
export function wrap(s, width, size, k = 0.47) {
  const per = Math.max(4, Math.floor(width / (size * k)));
  const words = String(s).split(/\s+/);
  const out = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > per) { if (line) out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

// A writing line, a box, a tick.
export const rule = (x1, y, x2, c = "rule") => `<line class="${c}" x1="${r2(x1)}" y1="${r2(y)}" x2="${r2(x2)}" y2="${r2(y)}"/>`;
export const box = (x, y, w, h, c = "bx", rx = 0.8) => `<rect class="${c}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${rx}"/>`;
export const tick = (x, y, s = 2.2, on = false, c = "tk") => `<rect class="${c}${on ? " on" : ""}" x="${r2(x)}" y="${r2(y)}" width="${s}" height="${s}" rx="0.35"/>` + (on ? `<path class="pen-mark" d="M${r2(x + 0.4)} ${r2(y + s * 0.55)} L${r2(x + s * 0.42)} ${r2(y + s - 0.35)} L${r2(x + s + 0.5)} ${r2(y - 0.5)}"/>` : "");

// The game's dice in their real shapes (kit geometry), drawn for paper.
const toward = (p, c, k) => ({ x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k });
function pathOf(S, k = 1) {
  if (!S.pts) { const r = S.r * k; return `M${S.c.x} ${S.c.y - r}A${r} ${r} 0 1 1 ${S.c.x} ${S.c.y + r}A${r} ${r} 0 1 1 ${S.c.x} ${S.c.y - r}Z`; }
  return `M${S.pts.map((p) => { const q = toward(p, S.c, k); return `${r2(q.x)} ${r2(q.y)}`; }).join("L")}Z`;
}
function cutsOf(S) {
  const corners = S.pts ?? [{ x: S.c.x - S.r, y: S.c.y }, { x: S.c.x + S.r, y: S.c.y }];
  return corners.map((p) => { const a = toward(p, S.c, 0.9), b = toward(p, S.c, S.hub); return `M${r2(a.x)} ${r2(a.y)}L${r2(b.x)} ${r2(b.y)}`; }).join("");
}
// d: 2..12. s: width in mm. tint: the pieces' fill. text: what's on the hub.
export function die(d, cx, cy, s, { tint = "none", text = `d${d}`, cls = "dz", ring = false, scar = false, num = 0 } = {}) {
  const S = SHAPES[d];
  const k = s / 100;
  const sw = (mm) => r2(mm / k);
  const fs = r2((text.length > 2 ? 23 : 27) * S.num.k);
  let g = `<g class="${cls}" transform="translate(${r2(cx - s / 2)} ${r2(cy - s / 2)}) scale(${r2(k)})">`;
  g += `<path class="tok" d="${pathOf(S)}" style="stroke-width:${sw(0.28)}"/>`;
  g += `<path class="pc" fill-rule="evenodd" d="${pathOf(S, 0.9)}${pathOf(S, S.hub)}" style="fill:${tint}"/>`;
  g += `<path class="cut" d="${cutsOf(S)}" style="stroke-width:${sw(0.18)}"/>`;
  g += `<path class="hub" d="${pathOf(S, S.hub)}" style="stroke-width:${sw(0.2)}"/>`;
  if (text) g += `<text class="dnum" x="50" y="${S.num.y}" style="font-size:${fs}px">${esc(num ? String(num) : text)}</text>`;
  g += `</g>`;
  if (scar) g += `<path class="scar-x" d="M${r2(cx - s * 0.42)} ${r2(cy - s * 0.42)}L${r2(cx + s * 0.42)} ${r2(cy + s * 0.42)}M${r2(cx + s * 0.42)} ${r2(cy - s * 0.42)}L${r2(cx - s * 0.42)} ${r2(cy + s * 0.42)}"/>`;
  if (ring) g += `<ellipse class="pen-ring" cx="${r2(cx + 0.15)}" cy="${r2(cy + 0.1)}" rx="${r2(s * 0.68)}" ry="${r2(s * 0.62)}" transform="rotate(-8 ${r2(cx)} ${r2(cy)})"/>`;
  return g;
}

// Aura's hex.
export function hex(cx, cy, r, { on = false, over = false } = {}) {
  const pts = [0, 60, 120, 180, 240, 300].map((a) => polar(cx, cy, r, a)).map((p) => `${r2(p.x)},${r2(p.y)}`).join(" ");
  return `<polygon class="hexp${over ? " over" : ""}${on ? " on" : ""}" points="${pts}"/>`;
}

// A blaze: a small flame.
export function blaze(cx, cy, s, cls = "blaze") {
  const k = s / 10;
  return `<path class="${cls}" transform="translate(${r2(cx - 5 * k)} ${r2(cy - 5 * k)}) scale(${r2(k)})" d="M5 0.4 C6.4 2.6 8.6 3.8 8.4 6.4 C8.2 8.6 6.6 9.8 5 9.8 C3.2 9.8 1.6 8.6 1.6 6.6 C1.6 5 2.6 4 3.2 3.2 C3.2 4.4 3.8 5.2 4.6 5.4 C4.2 3.6 4.4 1.8 5 0.4Z"/>`;
}

// Smooth path through points (Catmull-Rom).
export function smooth(pts, close = false) {
  if (pts.length < 2) return "";
  const P = close ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${r2(P[1].x)} ${r2(P[1].y)}`;
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(p2.x)} ${r2(p2.y)}`;
  }
  return d + (close ? "Z" : "");
}
// A scroll: a stem from (x,y) heading at angle a for len, curling into a
// spiral of radius r turning dir (1 clockwise, -1 anticlockwise).
export function scroll(x, y, a, len, r, dir = 1, turns = 1.15) {
  const pts = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) pts.push(polar(x, y, (len * i) / steps, a));
  const end = pts[pts.length - 1];
  // the spiral's centre sits off to the side the curl turns to
  const c = polar(end.x, end.y, r, a + 90 * dir);
  const a0 = a - 90 * dir;
  const n = Math.round(28 * turns);
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const ang = a0 + dir * 360 * turns * f;
    const rr = r * (1 - 0.72 * f);
    pts.push(polar(c.x, c.y, rr, ang));
  }
  return { d: smooth(pts), end: pts[pts.length - 1], c };
}
// An almond leaf at (x,y) pointing at angle a.
export function leaf(x, y, a, len, w) {
  const tip = polar(x, y, len, a);
  const m1 = polar(x, y, len * 0.5, a);
  const l = polar(m1.x, m1.y, w / 2, a - 90), rgt = polar(m1.x, m1.y, w / 2, a + 90);
  return `M${r2(x)} ${r2(y)}Q${r2(l.x)} ${r2(l.y)} ${r2(tip.x)} ${r2(tip.y)}Q${r2(rgt.x)} ${r2(rgt.y)} ${r2(x)} ${r2(y)}Z`;
}
// A wobbly hand-ruled line, for the journal look.
export function wobble(x1, y1, x2, y2, amp = 0.18, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5;
  const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 9));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
    const o = i === 0 || i === n ? 0 : rnd() * amp * 2;
    pts.push({ x: x1 + (x2 - x1) * f + (nx / L) * o, y: y1 + (y2 - y1) * f + (ny / L) * o });
  }
  return smooth(pts);
}

// The archetype sigil on a 24 grid, placed at (cx,cy) s mm wide.
export function sigil(name, cx, cy, s, cls = "sig") {
  const k = s / 24;
  return `<g class="${cls}" transform="translate(${r2(cx - s / 2)} ${r2(cy - s / 2)}) scale(${r2(k)})" style="stroke-width:${r2(0.32 / k)}">${SIGILS[name] ?? ""}</g>`;
}

// The parchment: mottled, grained, stained, worn at the edges.
export function parchment(id = "pp", seed = 3) {
  return `
<defs>
  <filter id="${id}-mottle" x="0" y="0" width="210" height="297" filterUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.12  0 0 0 0.62 -0.18"/>
  </filter>
  <filter id="${id}-grain" x="0" y="0" width="210" height="297" filterUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="${seed + 4}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.20  0 0 0 0 0.10  0 0 0 0.55 -0.2"/>
  </filter>
  <filter id="${id}-fibre" x="0" y="0" width="210" height="297" filterUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.9" numOctaves="2" seed="${seed + 9}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.98  0 0 0 0 0.94  0 0 0 0 0.84  0 0 0 0.5 -0.22"/>
  </filter>
  <filter id="${id}-edge" x="-10" y="-10" width="230" height="317" filterUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="${seed + 2}" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="1.1"/>
  </filter>
  <filter id="${id}-blur2"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="${id}-blur05"><feGaussianBlur stdDeviation="0.5"/></filter>
  <radialGradient id="${id}-vig" cx="50%" cy="48%" r="72%">
    <stop offset="0.55" stop-color="#6b4420" stop-opacity="0"/>
    <stop offset="0.86" stop-color="#6b4420" stop-opacity="0.16"/>
    <stop offset="1" stop-color="#4a2c12" stop-opacity="0.42"/>
  </radialGradient>
  <radialGradient id="${id}-stain" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#8a5a24" stop-opacity="0.06"/>
    <stop offset="0.82" stop-color="#8a5a24" stop-opacity="0.09"/>
    <stop offset="0.93" stop-color="#7a4a18" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#7a4a18" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${id}-spot" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#6a3c14" stop-opacity="0.38"/>
    <stop offset="1" stop-color="#6a3c14" stop-opacity="0"/>
  </radialGradient>
</defs>
<g class="paper">
  <rect width="210" height="297" fill="#fbf7ef"/>
  <rect x="2.2" y="2.2" width="205.6" height="292.6" rx="2" fill="#e9d7ae" filter="url(#${id}-edge)"/>
  <rect x="4" y="4" width="202" height="289" fill="#ecdcb6"/>
  <rect x="2.2" y="2.2" width="205.6" height="292.6" filter="url(#${id}-mottle)" opacity="0.9"/>
  <rect x="2.2" y="2.2" width="205.6" height="292.6" filter="url(#${id}-fibre)" opacity="0.55"/>
  <rect x="2.2" y="2.2" width="205.6" height="292.6" filter="url(#${id}-grain)" opacity="0.5"/>
  <ellipse cx="168" cy="236" rx="23" ry="21" fill="url(#${id}-stain)" transform="rotate(-14 168 236)"/>
  <ellipse cx="37" cy="41" rx="15" ry="13.5" fill="url(#${id}-stain)" opacity="0.7"/>
  <ellipse cx="146" cy="31" rx="9" ry="6" fill="url(#${id}-spot)" opacity="0.35"/>
  <circle cx="22" cy="172" r="1.4" fill="url(#${id}-spot)"/>
  <circle cx="184" cy="118" r="1.1" fill="url(#${id}-spot)"/>
  <circle cx="96" cy="276" r="1.6" fill="url(#${id}-spot)"/>
  <circle cx="61" cy="207" r="0.9" fill="url(#${id}-spot)"/>
  <circle cx="191" cy="61" r="1.3" fill="url(#${id}-spot)"/>
  <circle cx="132" cy="153" r="0.8" fill="url(#${id}-spot)"/>
  <line x1="105" y1="3" x2="105" y2="294" stroke="#7a5326" stroke-opacity="0.07" stroke-width="0.9" filter="url(#${id}-blur05)"/>
  <line x1="105.6" y1="3" x2="105.6" y2="294" stroke="#fff6df" stroke-opacity="0.22" stroke-width="0.5"/>
  <line x1="3" y1="148.5" x2="207" y2="148.5" stroke="#7a5326" stroke-opacity="0.06" stroke-width="0.9" filter="url(#${id}-blur05)"/>
  <rect x="2.2" y="2.2" width="205.6" height="292.6" fill="url(#${id}-vig)"/>
</g>`;
}
