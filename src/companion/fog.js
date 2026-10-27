// The fog on a map (stage 5 of notes/worlds-plan.md), drawn and rubbed on a
// phone. The fog itself, which squares are covered, is in maps.js, so the
// phone and the Worker read it the same way. This is the drawing: the fog
// over the picture, a thumb rubbing it off or on, and the crew's own picture,
// made on her phone with every covered square painted over so what's under
// the fog never leaves it.
import { gridOf, squareCovered } from "./maps.js";

// What the crew's picture has where it's covered. Their phone draws the fog
// over it in their own colours, so this only shows if something's gone wrong.
export const FILL = "#2b2433";
// Each square's drawn as SUB by SUB, so the fog's edge can be soft.
const SUB = 4;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A colour the page can name (a token's hex, rgb(), anything), as [r, g, b].
const rgbs = new Map();
export function rgbOf(css) {
  if (rgbs.has(css)) return rgbs.get(css);
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#000";
  g.fillStyle = css;
  g.fillRect(0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data;
  const out = [d[0], d[1], d[2]];
  rgbs.set(css, out);
  return out;
}

// A little grain that's the same every time it's drawn, so the fog doesn't
// shimmer as she rubs it.
const grain = (u, v) => {
  let n = Math.imul(u, 374761393) + Math.imul(v, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) & 255) / 255 - 0.5;
};

// The fog, drawn into a canvas the size of the grid (sub to a square, fewer
// for a small picture) that the page stretches over the picture. A covered
// square's solid all the way to its edge, and the fog thins out over the
// uncovered side, so the edge is soft but nothing covered ever shows through.
export function drawFog(cv, b, w, h, colour, sub = SUB) {
  const n = sub;
  const { gw, gh } = gridOf(w, h);
  const W = gw * n;
  const H = gh * n;
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  const g = cv.getContext("2d");
  if (!b) return g.clearRect(0, 0, W, H);
  // Covered or not, a fine square at a time.
  const hard = new Uint8Array(W * H);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      if (!squareCovered(b, gw, i, j)) continue;
      for (let v = j * n; v < (j + 1) * n; v++) hard.fill(1, v * W + i * n, v * W + (i + 1) * n);
    }
  }
  // Then the fog's edge, soft and rounded over about a square: the covered
  // squares half a square wider all round, and how much of that's within a
  // square of each fine one, each worked out along the rows and then down the
  // columns.
  const slide = (src, out, rad, rows) => {
    const [len, lines, step, jump] = rows ? [W, H, 1, W] : [H, W, W, 1];
    for (let l = 0; l < lines; l++) {
      const o = l * jump;
      let sum = 0;
      for (let k = 0; k < Math.min(rad, len); k++) sum += src[o + k * step];
      for (let k = 0; k < len; k++) {
        if (k + rad < len) sum += src[o + (k + rad) * step];
        if (k - rad - 1 >= 0) sum -= src[o + (k - rad - 1) * step];
        out[o + k * step] = sum;
      }
    }
  };
  const half = Math.max(1, Math.round(n / 2));
  const a1 = new Uint8Array(W * H);
  const a2 = new Uint8Array(W * H);
  slide(hard, a1, half, true);
  for (let k = 0; k < a1.length; k++) a1[k] = a1[k] ? 1 : 0;
  slide(a1, a2, half, false);
  for (let k = 0; k < a2.length; k++) a2[k] = a2[k] ? 1 : 0;
  slide(a2, a1, n, true);
  const near = new Uint16Array(W * H);
  slide(a1, near, n, false);
  const area = (2 * n + 1) ** 2;
  const [r, gr, bl] = rgbOf(colour);
  const img = g.createImageData(W, H);
  const px = img.data;
  for (let v = 0; v < H; v++) {
    for (let u = 0; u < W; u++) {
      const k = v * W + u;
      // Thinned over the edge by how much of the wider fog is round it.
      const a = hard[k] ? 1 : near[k] / area;
      if (!a) continue;
      const t = 1 + grain(u, v) * 0.14;
      px[k * 4] = clamp(Math.round(r * t), 0, 255);
      px[k * 4 + 1] = clamp(Math.round(gr * t), 0, 255);
      px[k * 4 + 2] = clamp(Math.round(bl * t), 0, 255);
      px[k * 4 + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
}

// A thumb rubbed from (ax, ay) to (zx, zy) on the picture, in its pixels, r
// pixels round: every square whose middle's within r of that line, and always
// the square under the thumb, comes off (or goes on, with cover). It says
// whether anything changed.
export function rub(b, w, h, ax, ay, zx, zy, r, cover) {
  const { gw, gh } = gridOf(w, h);
  const cw = w / gw;
  const ch = h / gh;
  // Zoomed right in, a small brush still reaches every square the thumb
  // crosses, however quick the rub.
  r = Math.max(r, Math.hypot(cw, ch) / 2);
  const i0 = clamp(Math.floor((Math.min(ax, zx) - r) / cw), 0, gw - 1);
  const i1 = clamp(Math.floor((Math.max(ax, zx) + r) / cw), 0, gw - 1);
  const j0 = clamp(Math.floor((Math.min(ay, zy) - r) / ch), 0, gh - 1);
  const j1 = clamp(Math.floor((Math.max(ay, zy) + r) / ch), 0, gh - 1);
  const dx = zx - ax;
  const dy = zy - ay;
  const len = dx * dx + dy * dy;
  let changed = false;
  const set = (i, j) => {
    const k = j * gw + i;
    const bit = 1 << (k & 7);
    const on = (b[k >> 3] & bit) !== 0;
    if (on === cover) return;
    b[k >> 3] = cover ? b[k >> 3] | bit : b[k >> 3] & ~bit;
    changed = true;
  };
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const px = (i + 0.5) * cw;
      const py = (j + 0.5) * ch;
      const t = len ? clamp(((px - ax) * dx + (py - ay) * dy) / len, 0, 1) : 0;
      const qx = ax + t * dx - px;
      const qy = ay + t * dy - py;
      if (qx * qx + qy * qy <= r * r) set(i, j);
    }
  }
  // A thumb off the edge of the picture rubs nothing there.
  if (zx >= 0 && zx < w && zy >= 0 && zy < h) set(Math.floor(zx / cw), Math.floor(zy / ch));
  return changed;
}

// The crew's picture: hers, with every covered square painted over solid,
// edge to edge on whole pixels, so not a pixel of what's under the fog is
// in it, even blended into its edge.
export function crewCanvas(pic, w, h, b) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d", { alpha: false });
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(pic, 0, 0, w, h);
  g.fillStyle = FILL;
  const { gw, gh } = gridOf(w, h);
  for (let j = 0; j < gh; j++) {
    const y0 = Math.floor((j * h) / gh);
    const y1 = Math.ceil(((j + 1) * h) / gh);
    for (let i = 0; i < gw; ) {
      if (!squareCovered(b, gw, i, j)) {
        i++;
        continue;
      }
      let k = i;
      while (k < gw && squareCovered(b, gw, k, j)) k++;
      const x0 = Math.floor((i * w) / gw);
      const x1 = Math.ceil((k * w) / gw);
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      i = k;
    }
  }
  return cv;
}
