// A whole world's map, drawn in code (notes/builder-plan.md, A whole world):
// shapes in the map's own numbers, the ground every year shares (the sea, the
// water and the hills) and a year's districts, their parts, the main roads and
// the landmarks you'd steer by, drawn as SVG in the site's tokens so it
// follows the light switch and stays sharp at any zoom. Pure, so the page,
// the World screen and the tests all draw it the same way. Names aren't drawn
// here: every place has a pin, and the pins carry the names (mapview.js), so
// they stay one size and wait for room when they'd crowd.

// What a landmark can be, each a small mark of its own.
export const MARKS = ["tower", "stadium", "docks", "dam", "turbines", "oil", "farms", "blocks", "wall", "plant", "pier"];

const f1 = (v) => Math.round(v * 10) / 10;
const pts = (s) => s.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
const path = (s) => `M${s.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}Z`;
const line = (s) => `M${s.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}`;

// Whether a point's inside a shape, or within tol of its edge.
export function inShape([x, y], shape, tol = 0) {
  let inside = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const [xi, yi] = shape[i];
    const [xj, yj] = shape[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  if (inside || !tol) return inside;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) if (toEdge([x, y], shape[j], shape[i]) <= tol) return true;
  return false;
}
function toEdge([x, y], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

// The middle of a shape, by its area, for whatever needs a spot inside it.
export function middleOf(shape) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const [x0, y0] = shape[j];
    const [x1, y1] = shape[i];
    const k = x0 * y1 - x1 * y0;
    a += k;
    cx += (x0 + x1) * k;
    cy += (y0 + y1) * k;
  }
  if (!a) return shape[0] ?? [0, 0];
  return [cx / (3 * a), cy / (3 * a)];
}

// A landmark's mark, centred on its spot, in the map's numbers. r is how big
// a mark is on this map.
function markOf(kind, [x, y], r) {
  const at = (dx, dy) => `${f1(x + dx * r)} ${f1(y + dy * r)}`;
  switch (kind) {
    case "tower":
      return `<path class="dm-m is-tower" d="M${at(0, -1.6)}L${at(0.55, 0.9)}L${at(-0.55, 0.9)}Z"/>`;
    case "stadium":
      return `<ellipse class="dm-m is-ring" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.3)}" ry="${f1(r * 0.85)}"/><ellipse class="dm-m is-in" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.35)}"/>`;
    case "docks":
      return `<path class="dm-m is-line" d="M${at(-1.2, -0.8)}H${f1(x + 1.2 * r)}M${at(-1.2, 0)}H${f1(x + 1.2 * r)}M${at(-1.2, 0.8)}H${f1(x + 1.2 * r)}"/>`;
    case "pier":
      return `<path class="dm-m is-line" d="M${at(0, -1)}V${f1(y + 1.3 * r)}M${at(-0.6, 1.3)}H${f1(x + 0.6 * r)}"/>`;
    case "dam":
      return `<path class="dm-m is-dam" d="M${at(-1.3, 0.2)}Q${at(0, -0.9)} ${at(1.3, 0.2)}"/>`;
    case "turbines":
      return [[-0.8, 0], [0.8, 0.3]].map(([dx, dy]) => `<path class="dm-m is-line" d="M${at(dx, dy + 0.9)}V${f1(y + (dy - 0.2) * r)}M${at(dx - 0.55, dy - 0.55)}L${at(dx + 0.55, dy + 0.15)}M${at(dx, dy - 0.2)}L${at(dx, dy - 0.95)}"/>`).join("");
    case "oil":
      return `<path class="dm-m is-line" d="M${at(-0.9, 0.9)}L${at(0, -0.9)}L${at(0.9, 0.9)}M${at(-0.5, 0.1)}H${f1(x + 0.5 * r)}"/>`;
    case "farms":
      return `<path class="dm-m is-line" d="M${at(-1.3, -0.6)}H${f1(x + 1.3 * r)}M${at(-1.3, 0)}H${f1(x + 1.3 * r)}M${at(-1.3, 0.6)}H${f1(x + 1.3 * r)}"/>`;
    case "blocks":
      return `<rect class="dm-m is-block" x="${f1(x - 1.1 * r)}" y="${f1(y - 0.9 * r)}" width="${f1(r * 0.9)}" height="${f1(r * 1.8)}"/><rect class="dm-m is-block" x="${f1(x + 0.2 * r)}" y="${f1(y - 0.5 * r)}" width="${f1(r * 0.9)}" height="${f1(r * 1.4)}"/>`;
    case "plant":
      return `<rect class="dm-m is-block" x="${f1(x - 1.1 * r)}" y="${f1(y - 0.3 * r)}" width="${f1(r * 2.2)}" height="${f1(r * 1.1)}"/><path class="dm-m is-line" d="M${at(-0.6, -0.3)}V${f1(y - 1.2 * r)}M${at(0.3, -0.3)}V${f1(y - 1 * r)}"/>`;
    case "wall":
      return `<path class="dm-m is-wall" d="M${at(-1.2, 0)}H${f1(x + 1.2 * r)}"/>`;
    default:
      return "";
  }
}

// Which of three tones each district's drawn in, so two that share a border
// never look the same: each takes the first tone none of its neighbours
// before it has, neighbours being districts with a corner in common.
// A world's lands only count as neighbours where they meet on land (on, a
// test for a corner), since their shapes meet out at sea too, and they're
// toned as a whole rather than one at a time, so a continent's three tones
// go round it with no two that touch the same.
export function tonesOf(districts, on) {
  const keys = Object.keys(districts);
  const corners = new Map(keys.map((k) => [k, new Set(districts[k].map(([x, y]) => `${x},${y}`))]));
  if (on) return tonesRound(keys, corners, on);
  const tone = {};
  for (const k of keys) {
    const near = keys.filter((o) => o !== k && tone[o] != null && [...corners.get(k)].some((c) => corners.get(o).has(c)));
    tone[k] = [0, 1, 2].find((t) => !near.some((o) => tone[o] === t)) ?? 0;
  }
  return tone;
}
function tonesRound(keys, corners, on) {
  const near = new Map(keys.map((k) => [k, new Set()]));
  const owners = new Map();
  for (const k of keys) for (const c of corners.get(k)) owners.set(c, [...(owners.get(c) ?? []), k]);
  for (const [c, ks] of owners) {
    if (ks.length < 2 || ks.every((a) => ks.every((b) => a === b || near.get(a).has(b))) || !on(c.split(",").map(Number))) continue;
    for (const a of ks) for (const b of ks) if (a !== b) near.get(a).add(b);
  }
  // The most neighbours first, each tried in every tone till all fit.
  const order = [...keys].sort((a, b) => near.get(b).size - near.get(a).size || keys.indexOf(a) - keys.indexOf(b));
  const tone = {};
  const fit = (i) => {
    if (i === order.length) return true;
    const k = order[i];
    for (const t of [0, 1, 2]) {
      if ([...near.get(k)].some((o) => tone[o] === t)) continue;
      tone[k] = t;
      if (fit(i + 1)) return true;
    }
    delete tone[k];
    return false;
  };
  if (!fit(0)) for (const k of order) tone[k] = [0, 1, 2].find((t) => ![...near.get(k)].some((o) => tone[o] === t)) ?? 0;
  return tone;
}

// The whole map as SVG. opts.label is what a screen reader hears for it, and
// opts.uid keeps its patterns apart from another map's on the same page. A
// district in map.wilds is open country (the Badlands round a city), drawn as
// the land itself, stippled, rather than as a district's plate. A world of
// seas and continents gives its land rather than its sea, and is drawn as one
// (drawWorld()).
export function drawMap(map, opts = {}) {
  if (map.ground.land) return drawWorld(map, opts);
  const [w, h] = map.size;
  const g = map.ground;
  const uid = opts.uid ?? "dm";
  const r = Math.max(w, h) / 110;
  const wilds = new Set(map.wilds ?? []);
  const districts = Object.entries(map.districts);
  const town = Object.fromEntries(districts.filter(([k]) => !wilds.has(k)));
  const tone = tonesOf(town);
  const parts = Object.entries(map.parts);
  const out = [];
  out.push(`<defs><pattern id="${uid}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path class="dm-hatch" d="M0 0V9"/></pattern><pattern id="${uid}-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle class="dm-dot" cx="4" cy="4" r="1.15"/><circle class="dm-dot" cx="12" cy="12" r="1.15"/></pattern><pattern id="${uid}-waves" width="24" height="10" patternUnits="userSpaceOnUse"><path class="dm-wave" d="M0 6Q6 3 12 6T24 6"/></pattern><pattern id="${uid}-grid" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><path class="dm-street" d="M0 0H22M0 0V22"/></pattern></defs>`);
  out.push(`<rect class="dm-land" width="${w}" height="${h}"/>`);
  out.push(`<rect class="dm-wild" width="${w}" height="${h}" fill="url(#${uid}-dots)"/>`);
  // The town's plates, with their streets, then the hills over them.
  for (const [k, s] of districts) if (!wilds.has(k)) out.push(`<path class="dm-d is-t${tone[k]} is-${k}" d="${path(s)}"/><path class="dm-grid" d="${path(s)}" fill="url(#${uid}-grid)"/>`);
  for (const s of g.hills) out.push(`<path class="dm-hill" d="${path(s)}"/><path class="dm-hill-in" d="${path(s)}" fill="url(#${uid}-hatch)"/>`);
  for (const [k, s] of parts) out.push(`<path class="dm-p is-${k}" d="${path(s)}"/>`);
  for (const [k, s] of districts) if (!wilds.has(k)) out.push(`<path class="dm-de is-${k}" d="${path(s)}"/>`);
  // The water over everything a district's shape takes into it, so the shapes
  // can run out past the coast and the coast's the only edge you see.
  for (const s of g.water) out.push(`<path class="dm-water" d="${path(s)}"/>`);
  out.push(`<path class="dm-sea" d="${path(g.sea)}"/><path class="dm-sea-in" d="${path(g.sea)}" fill="url(#${uid}-waves)"/>`);
  for (const rd of map.roads) out.push(`<path class="dm-road-c" d="${line(rd.pts)}"/><path class="dm-road" d="${line(rd.pts)}"/>`);
  out.push(`<path class="dm-coast" d="${path(g.sea)}"/>`);
  for (const m of map.marks) out.push(`<g class="dm-mark">${markOf(m.kind, m.at, r)}</g>`);
  const label = opts.label ? ` role="img" aria-label="${String(opts.label).replace(/"/g, "&quot;")}"` : ' aria-hidden="true"';
  return `<svg class="dm" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" focusable="false"${label}>${out.join("")}</svg>`;
}

// A world of seas and continents (Abnu): the sea's the ground, its deepest
// water darker and a shelf of shallows round every coast, and the land's
// every continent and island. Each land's plate is clipped to the land, so a
// land's shape can run out to sea to hold all its islands in one and only
// its own ground shows. k is how much bigger the map is than a city's
// thousand across, as the lines and patterns grow with it (--dm-k), so they
// read the same as a city's when the whole of it's on a screen.
function drawWorld(map, opts) {
  const [w, h] = map.size;
  const g = map.ground;
  const uid = opts.uid ?? "dm";
  const k = Math.round(Math.sqrt(Math.max(w, h) / 1000) * 100) / 100;
  const s = (n) => f1(n * k);
  const coast = g.land.map(path).join("");
  const districts = Object.entries(map.districts);
  const tone = tonesOf(map.districts, (c) => g.land.some((r) => inShape(c, r, 0.5)));
  const out = [];
  out.push(`<defs><pattern id="${uid}-waves" width="${s(24)}" height="${s(10)}" patternUnits="userSpaceOnUse"><path class="dm-wave" d="M0 ${s(6)}Q${s(6)} ${s(3)} ${s(12)} ${s(6)}T${s(24)} ${s(6)}"/></pattern><clipPath id="${uid}-land"><path d="${coast}"/></clipPath></defs>`);
  out.push(`<rect class="dm-sea" width="${w}" height="${h}"/><rect class="dm-sea-in" width="${w}" height="${h}" fill="url(#${uid}-waves)"/>`);
  for (const d of g.deep ?? []) out.push(`<path class="dm-deep" d="${path(d)}"/>`);
  out.push(`<path class="dm-shelf" d="${coast}"/><path class="dm-shelf-in" d="${coast}"/>`);
  out.push(`<g clip-path="url(#${uid}-land)"><path class="dm-land" d="${coast}"/>`);
  for (const [key, sh] of districts) out.push(`<path class="dm-d is-t${tone[key]} is-${key}" d="${path(sh)}"/>`);
  for (const [key, sh] of Object.entries(map.parts)) out.push(`<path class="dm-p is-${key}" d="${path(sh)}"/>`);
  for (const [key, sh] of districts) out.push(`<path class="dm-de is-${key}" d="${path(sh)}"/>`);
  out.push("</g>");
  for (const sh of g.water) out.push(`<path class="dm-water" d="${path(sh)}"/>`);
  for (const rd of map.roads) out.push(`<path class="dm-road-c" d="${line(rd.pts)}"/><path class="dm-road" d="${line(rd.pts)}"/>`);
  out.push(`<path class="dm-coast" d="${coast}"/>`);
  for (const m of map.marks) out.push(`<g class="dm-mark">${markOf(m.kind, m.at, 9 * k)}</g>`);
  const label = opts.label ? ` role="img" aria-label="${String(opts.label).replace(/"/g, "&quot;")}"` : ' aria-hidden="true"';
  return `<svg class="dm is-world" style="--dm-k:${k}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" focusable="false"${label}>${out.join("")}</svg>`;
}

export { pts as pointsOf };
