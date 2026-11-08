// The character sheet options: A Reliquary, B Astrolabe, C Wayfarer.
// node sheet.mjs OUTDIR  → writes <opt>-<side>-<mode>.html
import fs from "node:fs";
import { FONTS, t, wrap, rule, box, tick, die, hex, blaze, smooth, scroll, leaf, wobble, sigil, parchment, polar, r2, esc } from "./lib.mjs";

const OUT = process.argv[2] || "out";
fs.mkdirSync(OUT, { recursive: true });

// ── Vesk, as her sheet stands on the Roots branch (03b), for the filled pages.
const VESK = {
  name: "Vesk", pronouns: "she/her", player: "Kai",
  roots: { Body: 5, Mind: 3, Soul: 0 },
  track: { Body: 12, Mind: 12, Soul: 12 },
  armour: { Body: [["Common worn leathers", 1]], Mind: [], Soul: [] },
  aura: 5, actions: 2, stride: 5,
  specialties: [["Locks", 4], ["Stealth", 2], ["Climbing", 2], ["Knives", 2], ["Black market", 2]],
  kit: { equipment: ["Common worn leathers", "A knife"], utility: ["A purse of gold", "A smoke bomb", "A perfect set of picks"], keepsake: "The first coin she ever stole", bag: [] },
  aspiration: "Own the score of a lifetime",
  titles: [
    { name: "The best cat burglar in the city", root: "Body", specs: ["Stealth", "Climbing", "Locks"], perms: [["move unseen", "Body", "Stealth"], ["run the rooftops", "Body", "Climbing"], ["pick a mechanical lock", "Body", "Locks"]] },
    { name: "Raised by the Guild", root: "Mind", specs: ["Locks", "Knives", "Black market"], perms: [["know how a lock’s built", "Mind", "Locks"], ["fight dirty with a knife", "Body", "Knives"], ["find a buyer for anything", "Mind", "Black market"]] },
  ],
  archetypes: [
    { name: "Shadow", home: "Stamina", mech: "Dice you roll to hide go in your shadow pool, for any roll after.", abil: [["Push: +3 to hide, or to a shadow die", "1"], ["Vanish: hidden again, no roll", "1"]] },
    { name: "Shadow", home: "Stamina", mech: "Taken twice, so her Push is +3.", abil: [] },
  ],
  attune: { thing: "A grappling line", stage: "Awakened", aura: "1 the first time each scene she gets somewhere nobody else could follow", awak: [["Anywhere I can throw a hook", "passive"]] },
  bonds: [
    { who: "Dorrie", th: [["We have pulled a dozen jobs. I trust her with my life.", "bond"], ["We came up on the same streets. She never asks why.", "bond"]] },
    { who: "Bram", th: [["He once carried me out of a fire. I have never said thank you.", "bond"]] },
    { who: "Isolde", th: [["She stole the book that started all this.", "hostile"]] },
    { who: "Wren", th: [["I owe her for the night she hid me from the watch.", "bond"]] },
  ],
  notes: ["The fence: I owe a debt I would rather not discuss. (hostile)", "Trouble that follows her: wanted in three districts, owes the Guild."],
};

const ROOTS = ["Body", "Mind", "Soul"];
const TRACK = { Body: "Stamina", Mind: "Confidence", Soul: "Resolve" };
const SIZES = [12, 10, 8, 6, 4, 2];

// ── Styles: aged (parchment, inks, gilt) and ink (one ink, no fills).
function css(mode) {
  const aged = mode === "aged";
  const ink = aged ? "#33230f" : "#151515";
  const soft = aged ? "#5b4329" : "#555";
  const line = aged ? "rgba(84,58,30,0.62)" : "#8d8d8d";
  const pen = "#1c2846";
  const tint = { Body: aged ? "#a0533a" : "none", Mind: aged ? "#4d5a8c" : "none", Soul: aged ? "#b58a2c" : "none" };
  return `${FONTS}
  @page { size: A4; margin: 0 }
  html,body{margin:0;background:#888}
  .page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff}
  svg.sheet{position:absolute;inset:0;width:210mm;height:297mm}
  .lab{font-family:Cinzel;font-weight:600;font-size:2px;letter-spacing:0.3px;fill:${ink}}
  .lab-s{font-family:Cinzel;font-weight:600;font-size:1.62px;letter-spacing:0.22px;fill:${ink}}
  .ttl{font-family:Cinzel;font-weight:700;font-size:3.2px;letter-spacing:0.45px;fill:${aged ? "#2a1a08" : "#111"}}
  .ttl-l{font-family:Cinzel;font-weight:700;font-size:4.2px;letter-spacing:0.5px;fill:${aged ? "#2a1a08" : "#111"}}
  .hint{font-family:'Alegreya Sans';font-style:italic;font-size:1.95px;fill:${soft}}
  .hint-s{font-family:'Alegreya Sans';font-style:italic;font-size:1.7px;fill:${soft}}
  .val{font-family:'Alegreya Sans';font-weight:500;font-size:3.1px;fill:${pen}}
  .val-s{font-family:'Alegreya Sans';font-weight:500;font-size:2.55px;fill:${pen}}
  .val-n{font-family:'Alegreya Sans';font-weight:700;font-size:3.6px;fill:${pen}}
  .name{font-family:'Cinzel Decorative';font-weight:700;font-size:6.6px;fill:${pen};letter-spacing:0.4px}
  .rootnum{font-family:Cinzel;font-weight:700;font-size:9px;fill:${pen}}
  .word{font-family:Cinzel;font-weight:700;letter-spacing:0.6px;fill:${aged ? "#2a1a08" : "#111"}}
  .rule{stroke:${line};stroke-width:0.17}
  .rule-d{stroke:${line};stroke-width:0.17;stroke-dasharray:0.5 0.6}
  .bx{fill:${aged ? "rgba(255,249,232,0.42)" : "none"};stroke:${aged ? "#4a3218" : "#444"};stroke-width:0.24}
  .tk{fill:${aged ? "rgba(255,249,232,0.5)" : "none"};stroke:${aged ? "#4a3218" : "#444"};stroke-width:0.22}
  .pen-mark{fill:none;stroke:${pen};stroke-width:0.38;stroke-linecap:round;stroke-linejoin:round}
  .pen-ring{fill:none;stroke:${pen};stroke-width:0.34}
  .dz .tok{fill:${aged ? "rgba(255,248,228,0.55)" : "#fff"};stroke:${ink};stroke-linejoin:round}
  .dz .cut{stroke:${ink}}
  .dz .hub{fill:${aged ? "#f7edd3" : "#fff"};stroke:${ink};stroke-linejoin:round}
  .dz .dnum{font-family:'Alegreya Sans';font-weight:800;fill:${ink};text-anchor:middle;dominant-baseline:central}
  .scar-x{stroke:${pen};stroke-width:0.35}
  .hexp{fill:${aged ? "rgba(255,249,232,0.5)" : "#fff"};stroke:${ink};stroke-width:0.24}
  .hexp.over{stroke-dasharray:0.55 0.45;fill:none}
  .hexp.on{fill:${aged ? "rgba(181,138,44,0.55)" : "#fff"}}
  .blaze{fill:${aged ? "#8e2c1f" : "none"};stroke:${aged ? "#5a1a10" : ink};stroke-width:0.22}
  .orn{fill:none;stroke:${aged ? "#4a3218" : "#6a6a6a"};stroke-width:${aged ? 0.3 : 0.22};stroke-linecap:round;stroke-linejoin:round}
  .orn-t{fill:none;stroke:${aged ? "#4a3218" : "#8a8a8a"};stroke-width:${aged ? 0.16 : 0.13}}
  .orn-f{fill:${aged ? "#4a3218" : "#6a6a6a"}}
  .gilt{fill:${aged ? "url(#gilt)" : "none"};stroke:${aged ? "#6a4a14" : "#555"};stroke-width:0.24}
  .gilt-s{stroke:${aged ? "url(#giltS)" : "#666"};fill:none}
  .plate{fill:${aged ? "rgba(255,248,226,0.6)" : "#fff"};stroke:${aged ? "#4a3218" : "#444"};stroke-width:0.26}
  .disc{fill:${aged ? "rgba(255,247,224,0.75)" : "#fff"};stroke:${ink};stroke-width:0.3}
  .bead{fill:${aged ? "#6a4a14" : "#777"}}
  .sig{fill:none;stroke:${ink};stroke-linecap:round;stroke-linejoin:round}
  .tint-Body{fill:${tint.Body}} .tint-Mind{fill:${tint.Mind}} .tint-Soul{fill:${tint.Soul}}
  .root-Body{--t:${tint.Body}} .root-Mind{--t:${tint.Mind}} .root-Soul{--t:${tint.Soul}}
  .wax{stroke:${aged ? "rgba(40,10,5,0.55)" : "#444"};stroke-width:0.3}
  .frame-bg{fill:${aged ? "rgba(255,250,236,0.30)" : "none"};stroke:none}
  .pic-empty{fill:${aged ? "rgba(255,250,236,0.35)" : "#fff"}}
  .foot{font-family:'Alegreya Sans';font-size:1.7px;fill:${soft}}
  `;
}
const TINT = (mode, root) => (mode === "aged" ? { Body: "#b0644a", Mind: "#5f6ea3", Soul: "#c49a3a" }[root] : "none");

function defs(mode) {
  return `<defs>
  <linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#b8892f"/><stop offset="0.35" stop-color="#e3c372"/><stop offset="0.55" stop-color="#a87a26"/><stop offset="0.8" stop-color="#d9b45a"/><stop offset="1" stop-color="#8a6420"/>
  </linearGradient>
  <linearGradient id="giltS" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7a5418"/><stop offset="0.5" stop-color="#b8892f"/><stop offset="1" stop-color="#6a4a14"/>
  </linearGradient>
  <radialGradient id="pic-sky" cx="62%" cy="30%" r="80%">
    <stop offset="0" stop-color="#f6e7c2"/><stop offset="0.5" stop-color="#e3caa0"/><stop offset="1" stop-color="#b8956a"/>
  </radialGradient>
  </defs>`;
}

// ── Vesk's picture, our own: a hooded profile over the rooftops by moonlight.
// Drawn in a 100 × 130 box. mode aged: sepia ink wash. ink: line only.
export const SIL = "M14 130 C15 116 18 104 26 96 C20 86 19 70 24 58 C29 42 40 31 53 29 C64 27.5 72 32 75 39 C76.5 42 75 44 72.5 44.2 C72.8 47 73.2 49.5 74 51 C74.8 52.6 76.8 55.3 77.6 57.2 C77.9 58.5 75.8 58.9 74.6 59.2 C75.4 60.2 75.3 61 74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6 C70.2 69.7 67.6 69.6 65.4 69 C67 72.6 70.2 74.6 73.6 77.4 C79.6 83 84.6 93 88 105 C89.6 112 90.8 121 91.4 130 Z";
export const FACE = "M72.5 44.2 C72.8 47 73.2 49.5 74 51 C74.8 52.6 76.8 55.3 77.6 57.2 C77.9 58.5 75.8 58.9 74.6 59.2 C75.4 60.2 75.3 61 74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6 C70.2 69.7 67.6 69.6 65.4 69 C63.6 63 63.4 55 65 49.6 C66.2 45.8 69 44.2 72.5 44.2 Z";
export const RIM = "M72.6 44.6 C72.9 47.2 73.3 49.6 74.1 51.1 C74.9 52.7 76.9 55.4 77.6 57.2 M74.9 61.7 C75.6 62.4 75.4 63.3 74.6 63.9 C74.6 65.8 74.1 67.6 72.4 68.6";
export const ROOFS = "M0 130 L0 108 L7 108 L7 100 L12 95 L17 100 L17 106 L24 106 L24 98 L27 98 L27 93 L30 93 L30 98 L36 98 L36 104 L43 104 L48 99 L53 104 L53 101 L58 101 L58 112 L64 112 L64 104 L67 100 L70 104 L70 98 L76 98 L76 92 L79 88 L82 92 L82 103 L90 103 L90 97 L95 97 L95 102 L100 102 L100 130 Z";
function portraitArt(mode, clipId) {
  // hatching for the sky, and a few stars
  let hatch = "";
  for (let i = -130; i < 130; i += 2.1) hatch += `M${i} 0 L${i + 130} 130 `;
  const stars = [[12, 14], [24, 9], [88, 12], [93, 30], [8, 40], [34, 20], [90, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="#fff6dc" opacity="0.85"/>`).join("");
  return `<g clip-path="url(#${clipId})">
    <rect x="0" y="0" width="100" height="130" fill="url(#pic-sky)"/>
    <path d="${hatch}" stroke="#6e4a22" stroke-opacity="0.12" stroke-width="0.32"/>
    ${stars}
    <circle cx="62" cy="40" r="25" fill="#fcf3da"/>
    <circle cx="62" cy="40" r="25" fill="none" stroke="#e8cf98" stroke-width="2.4" opacity="0.6"/>
    <circle cx="70" cy="33" r="3.2" fill="#ead6aa" opacity="0.7"/><circle cx="55" cy="47" r="2.2" fill="#ead6aa" opacity="0.6"/><circle cx="66" cy="52" r="1.6" fill="#ead6aa" opacity="0.6"/>
    <path d="${ROOFS}" fill="#7e5a36" opacity="0.62"/>
    <rect x="21" y="109" width="1.8" height="2.4" fill="#f6d68c"/><rect x="32" y="101" width="1.6" height="2.2" fill="#f6d68c"/><rect x="73" y="101" width="1.6" height="2.2" fill="#f6d68c"/><rect x="85" y="107" width="1.8" height="2.4" fill="#f6d68c"/>
    <path d="${SIL}" fill="#2f1d0e"/>
    <path d="${FACE}" fill="#5a3a1f"/>
    <path d="M70.6 52.6 C71.4 52 72.4 52 73 52.6 C72.3 53.1 71.4 53.2 70.6 52.6Z" fill="#2a180a"/>
    <path d="${RIM}" fill="none" stroke="#f3dca6" stroke-width="0.55" stroke-linecap="round" opacity="0.9"/>
    <path d="M53 29.4 C64 28 72 32.4 75 39" fill="none" stroke="#f0d9a2" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>
  </g>`;
}
// The empty frame's quiet word, for a blank sheet.
function emptyPic(cx, cy) {
  return t(cx, cy - 1, "your picture", "hint", { a: "middle", size: 2.4 }) + t(cx, cy + 2.6, "printed here from the companion, or drawn in", "hint-s", { a: "middle" });
}

// ── A track of dice, d12 down to d2 and the Blaze. pts: 7 points.
function track(root, pts, mode, data, s = 5.4, scarPts = null) {
  const cur = data ? data.track[root] : null;
  let g = "";
  SIZES.forEach((d, i) => {
    const p = pts[i];
    g += die(d, p.x, p.y, s, { tint: TINT(mode, root), ring: cur === d });
  });
  const b = pts[6];
  g += blaze(b.x, b.y, s * 0.82);
  if (scarPts) {
    // a scar locks the lowest open size: d2 first, up to d10
    [5, 4, 3, 2, 1].forEach((i, k) => { const p = scarPts[i]; g += tick(p.x - 0.75, p.y - 0.75, 1.5); });
  }
  return g;
}
const arcPts = (cx, cy, r, a0, a1, n = 7) => Array.from({ length: n }, (_, i) => polar(cx, cy, r, a0 + ((a1 - a0) * i) / (n - 1)));
const rowPts = (x0, y, gap, n = 7) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * gap, y }));

// ── An armour plate for one Root: two pieces, three boxes each.
function armour(x, y, w, root, mode, data, { title = true, scars = false } = {}) {
  const pieces = data ? data.armour[root] : [];
  let g = "";
  if (title) g += t(x, y + 2, `Armour · ${root}`, "lab-s");
  for (let i = 0; i < 2; i++) {
    const yy = y + 6.4 + i * 4.6;
    g += rule(x, yy, x + w - 11, "rule");
    for (let k = 0; k < 3; k++) g += tick(x + w - 9.4 + k * 3.2, yy - 2.3, 2.3);
    const p = pieces[i];
    if (p) g += t(x + 0.4, yy - 0.7, p[0], "val-s");
  }
  return g;
}

// ── Section frame: a title on a tab and a hint.
function section(x, y, w, h, title, hint, skin) {
  let g = "";
  if (skin === "A") {
    g += `<rect class="frame-bg" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    g += `<rect class="orn" x="${x}" y="${y}" width="${w}" height="${h}"/><rect class="orn-t" x="${x + 0.9}" y="${y + 0.9}" width="${w - 1.8}" height="${h - 1.8}"/>`;
    for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) g += `<path class="orn-f" d="M${cx} ${cy - 1.3}L${cx + 1.3} ${cy}L${cx} ${cy + 1.3}L${cx - 1.3} ${cy}Z"/>`;
    const tw = title.length * 2.45 + 7;
    g += `<path class="plate" d="M${x + 4} ${y - 2.6}H${x + 4 + tw}L${x + 5.6 + tw} ${y}L${x + 4 + tw} ${y + 2.6}H${x + 4}L${x + 2.4} ${y}Z"/>`;
    g += t(x + 4 + tw / 2, y + 1.1, title, "ttl", { a: "middle" });
    if (hint) g += t(x + w - 2, y + 3.6, hint, "hint", { a: "end" });
  } else if (skin === "B") {
    g += `<rect class="frame-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6"/>`;
    g += `<rect class="orn" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6"/>`;
    // ticks along the top edge, like an instrument's scale
    let ticks = "";
    for (let tx = x + 3; tx < x + w - 2; tx += 1.5) ticks += `M${r2(tx)} ${y}V${r2(y + ((Math.round((tx - x - 3) / 1.5) % 5 === 0) ? 1.1 : 0.55))}`;
    g += `<path class="orn-t" d="${ticks}"/>`;
    const tw = title.length * 2.45 + 6;
    g += `<rect class="plate" x="${x + 3}" y="${y - 2.5}" width="${tw}" height="5" rx="2.5"/>`;
    g += star(x + 3, y, 1.1) + star(x + 3 + tw, y, 1.1);
    g += t(x + 3 + tw / 2, y + 1.1, title, "ttl", { a: "middle" });
    if (hint) g += t(x + w - 2, y + 3.6, hint, "hint", { a: "end" });
  } else {
    g += `<path class="orn" d="${wobble(x, y, x + w, y, 0.14, x * 7 + y)}${wobble(x + w, y, x + w, y + h, 0.14, y * 3 + 1).replace("M", "L")}${wobble(x + w, y + h, x, y + h, 0.14, x + 5).replace("M", "L")}${wobble(x, y + h, x, y, 0.14, y + 2).replace("M", "L")}"/>`;
    g += t(x + 1.5, y + 3.6, title, "ttl", { size: 3 });
    if (hint) g += t(x + w - 2, y + 3.6, hint, "hint", { a: "end" });
  }
  return g;
}
function star(cx, cy, r, cls = "orn-f") {
  const pts = [];
  for (let i = 0; i < 8; i++) pts.push(polar(cx, cy, i % 2 ? r * 0.38 : r, -90 + i * 45));
  return `<path class="${cls}" d="M${pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join("L")}Z"/>`;
}

// ── Page borders, one for each look.
function borderA() {
  let g = `<rect class="orn" x="5" y="5" width="200" height="287" style="stroke-width:0.55"/><rect class="orn-t" x="6.5" y="6.5" width="197" height="284"/>`;
  const corner = (x, y, sx, sy) => {
    let c = `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">`;
    c += `<circle class="orn" cx="6.2" cy="6.2" r="3.1"/><path class="orn-f" d="M6.2 3.6L8.8 6.2L6.2 8.8L3.6 6.2Z"/>`;
    const s1 = scroll(9.6, 4.4, 0, 9, 2.3, 1, 1.2), s2 = scroll(4.4, 9.6, 90, 9, 2.3, -1, 1.2);
    c += `<path class="orn" d="${s1.d}"/><path class="orn" d="${s2.d}"/>`;
    c += `<path class="orn-f" d="${leaf(13, 4.4, -28, 3.2, 1.3)}"/><path class="orn-f" d="${leaf(4.4, 13, 118, 3.2, 1.3)}"/>`;
    c += `<path class="orn-t" d="M22 3.4H36M3.4 22V36"/>`;
    return c + `</g>`;
  };
  g += corner(3.4, 3.4, 1, 1) + corner(206.6, 3.4, -1, 1) + corner(3.4, 293.6, 1, -1) + corner(206.6, 293.6, -1, -1);
  // diamonds at the middle of each edge
  for (const [x, y] of [[105, 5], [105, 292], [5, 148.5], [205, 148.5]]) g += `<path class="plate" d="M${x} ${y - 1.8}L${x + 1.8} ${y}L${x} ${y + 1.8}L${x - 1.8} ${y}Z"/>`;
  return g;
}
function borderB() {
  let g = `<rect class="orn" x="5" y="5" width="200" height="287" rx="3" style="stroke-width:0.45"/><rect class="orn-t" x="6.3" y="6.3" width="197.4" height="284.4" rx="2.4"/>`;
  let ticks = "";
  for (let x = 12; x <= 198; x += 2) ticks += `M${x} 6.3V${x % 10 === 0 ? 7.6 : 7}M${x} 290.7V${x % 10 === 0 ? 289.4 : 290}`;
  for (let y = 12; y <= 286; y += 2) ticks += `M6.3 ${y}H${y % 10 === 0 ? 7.6 : 7}M203.7 ${y}H${y % 10 === 0 ? 202.4 : 203}`;
  g += `<path class="orn-t" d="${ticks}"/>`;
  for (const [x, y] of [[6.3, 6.3], [203.7, 6.3], [6.3, 290.7], [203.7, 290.7]]) g += `<circle class="plate" cx="${x}" cy="${y}" r="3.3"/>` + star(x, y, 2.8);
  for (const [x, y] of [[105, 5], [105, 292]]) g += `<circle class="plate" cx="${x}" cy="${y}" r="2.2"/>` + star(x, y, 1.8);
  // a crescent and small stars, top left and bottom right
  g += `<path class="orn-f" d="M16 284 a3.2 3.2 0 1 0 3.6 4.2 a2.6 2.6 0 1 1 -3.6 -4.2Z" opacity="0.8"/>`;
  return g;
}
function borderC() {
  let g = "";
  g += `<path class="orn" d="${wobble(11, 6, 203, 6, 0.2, 3)}${wobble(203, 6, 203, 291, 0.2, 5).replace("M", "L")}${wobble(203, 291, 11, 291, 0.2, 7).replace("M", "L")}${wobble(11, 291, 11, 6, 0.2, 9).replace("M", "L")}" style="stroke-width:0.4"/>`;
  g += `<path class="orn-t" d="${wobble(12.5, 7.5, 201.5, 7.5, 0.25, 4)}${wobble(201.5, 7.5, 201.5, 289.5, 0.25, 6).replace("M", "L")}${wobble(201.5, 289.5, 12.5, 289.5, 0.25, 8).replace("M", "L")}${wobble(12.5, 289.5, 12.5, 7.5, 0.25, 10).replace("M", "L")}"/>`;
  // the binding: stitches down the left
  let st = "";
  for (let y = 10; y < 290; y += 6) st += `<circle class="orn" cx="7.2" cy="${y}" r="0.55"/><path class="orn" d="M7.2 ${y + 0.6}V${y + 5.4}"/>`;
  g += st;
  // brass corner caps on the right
  for (const [y, sy] of [[3, 1], [294, -1]]) {
    g += `<g transform="translate(207 ${y}) scale(-1 ${sy})"><path class="gilt" d="M0 0H13L0 13Z"/><circle class="bead" cx="3" cy="3" r="0.7"/><circle class="bead" cx="8" cy="2.2" r="0.5"/><circle class="bead" cx="2.2" cy="8" r="0.5"/></g>`;
  }
  // a sprig at the top left and bottom right
  const sprig = (x, y, a, k) => {
    const s = scroll(x, y, a, 7 * k, 2 * k, 1, 1);
    return `<path class="orn" d="${s.d}"/><path class="orn-f" d="${leaf(x + 3 * k * Math.cos((a * Math.PI) / 180), y + 3 * k * Math.sin((a * Math.PI) / 180), a - 50, 3 * k, 1.2 * k)}"/><path class="orn-f" d="${leaf(x + 5 * k * Math.cos((a * Math.PI) / 180), y + 5 * k * Math.sin((a * Math.PI) / 180), a + 50, 2.6 * k, 1.1 * k)}"/>`;
  };

  return g;
}

// ── The medallion: a Root's number with its name round the rim.
function medallion(cx, cy, r, root, mode, data, skin, id) {
  const val = data ? data.roots[root] : null;
  let g = "";
  const tid = `${id}-${root}`;
  if (skin === "A") {
    for (let a = 0; a < 360; a += 7.5) { const p = polar(cx, cy, r + 1.05, a); g += `<circle class="bead" cx="${r2(p.x)}" cy="${r2(p.y)}" r="0.32"/>`; }
    g += `<circle class="gilt" cx="${cx}" cy="${cy}" r="${r}"/>`;
    g += `<circle class="disc" cx="${cx}" cy="${cy}" r="${r - 2.4}"/>`;
    g += `<circle class="orn-t" cx="${cx}" cy="${cy}" r="${r - 3.2}"/>`;
  } else if (skin === "B") {
    g += `<circle class="gilt" cx="${cx}" cy="${cy}" r="${r}"/>`;
    let ticks = "";
    for (let a = 0; a < 360; a += 10) { const p1 = polar(cx, cy, r - 0.4, a), p2 = polar(cx, cy, r - (a % 30 === 0 ? 1.6 : 1), a); ticks += `M${r2(p1.x)} ${r2(p1.y)}L${r2(p2.x)} ${r2(p2.y)}`; }
    g += `<path class="orn" d="${ticks}" style="stroke-width:0.2"/>`;
    g += `<circle class="disc" cx="${cx}" cy="${cy}" r="${r - 2.1}"/>`;
  } else {
    // wax: a blobby seal with a pressed rim
    const pts = [];
    for (let i = 0; i < 20; i++) { const a = i * 18; const rr = r + Math.sin(i * 2.7) * 0.7 + Math.cos(i * 1.3) * 0.5; pts.push(polar(cx, cy, rr, a)); }
    const waxFill = mode === "aged" ? { Body: "#7e2a1f", Mind: "#2f3b6a", Soul: "#9a7120" }[root] : "#fff";
    g += `<path class="wax" d="${smooth(pts, true)}" style="fill:${waxFill}"/>`;
    if (mode === "aged") g += `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.35}" fill="#fff" opacity="0.12"/>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${r - 2.4}" fill="${mode === "aged" ? "rgba(255,240,215,0.88)" : "#fff"}" stroke="${mode === "aged" ? "rgba(30,10,5,0.4)" : "#444"}" stroke-width="0.35"/>`;
  }
  // name round the top, track round the bottom (A and B); a ribbon on C
  if (skin !== "C") {
    const rr = skin === "A" ? r - 1.25 : r - 1.05;
    g += `<path id="${tid}-top" d="M${r2(cx - rr)} ${cy} A${rr} ${rr} 0 0 1 ${r2(cx + rr)} ${cy}" fill="none"/>`;
    g += `<path id="${tid}-bot" d="M${r2(cx - rr)} ${cy} A${rr} ${rr} 0 0 0 ${r2(cx + rr)} ${cy}" fill="none"/>`;
    const onRim = mode === "aged" ? "#2a1a08" : "#111";
    g += `<text class="lab" style="font-size:2.05px;letter-spacing:0.5px;fill:${onRim};dominant-baseline:central"><textPath href="#${tid}-top" startOffset="50%" text-anchor="middle">${root.toUpperCase()}</textPath></text>`;
    g += `<text class="lab-s" style="font-size:1.45px;letter-spacing:0.3px;fill:${onRim};dominant-baseline:central"><textPath href="#${tid}-bot" startOffset="50%" text-anchor="middle">${TRACK[root].toUpperCase()}</textPath></text>`;
  } else {
    g += `<path class="plate" d="M${cx - 14} ${cy + r + 0.6}H${cx + 14}L${cx + 15.5} ${cy + r + 2.4}L${cx + 14} ${cy + r + 4.2}H${cx - 14}L${cx - 15.5} ${cy + r + 2.4}Z"/>`;
    g += t(cx, cy + r + 3.2, `${root.toUpperCase()} · ${TRACK[root].toUpperCase()}`, "lab-s", { a: "middle" });
  }
  if (val !== null && val !== undefined) g += t(cx, cy + 3.2, String(val), "rootnum", { a: "middle", size: skin === "B" ? 7.4 : 9 });
  return g;
}

// ── The strip of steps into dice.
function ladder(x, y, w, mode) {
  const steps = [[1, [2]], [2, [4]], [3, [6]], [4, [8]], [5, [10]], [6, [12]], [7, [12, 2]], [8, [12, 4]], [9, [12, 6]], [10, [12, 8]], [11, [12, 10]], [12, [12, 12]], [18, [12, 12, 12]], [24, [12, 12, 12, 12]]];
  const gap = w / steps.length;
  let g = t(x, y - 1.2, "Steps into dice", "lab-s");
  steps.forEach(([n, dice], i) => {
    const cx = x + gap * i + gap / 2;
    g += t(cx, y + 2.2, String(n), "val-n", { a: "middle", size: 2.6, fill: mode === "aged" ? "#33230f" : "#151515" });
    const s = dice.length > 2 ? 2.6 : 3.3;
    const tot = dice.length * s + (dice.length - 1) * 0.4;
    dice.forEach((d, k) => { g += die(d, cx - tot / 2 + s / 2 + k * (s + 0.4), y + 5.6, s, { text: "" }); });
    g += t(cx, y + 9.6, dice.length > 2 ? `${dice.length}d12` : dice.map((d) => `d${d}`).join("+"), "lab-s", { a: "middle", size: 1.45 });
  });
  return g;
}

// ── The lower half of the front: the same pieces on every option, placed by y.
function lowerFront(y0, mode, data, skin, opts = {}) {
  let g = "";
  const X0 = 13, X1 = 197;
  const specRows = opts.specRows ?? 6, RG = 5.8;
  const hS = 7.2 + specRows * RG;
  g += section(X0, y0, X1 - X0, hS, "Specialties", "a roll's one Root and one specialty that fits how you're doing it · its steps", skin);
  const colW = (X1 - X0 - 8) / 2;
  for (let c = 0; c < 2; c++) {
    const cx = X0 + 3 + c * (colW + 2);
    for (let r = 0; r < specRows; r++) {
      const yy = y0 + 9.4 + r * RG;
      g += rule(cx, yy + 2.4, cx + colW - 12) + box(cx + colW - 10, yy - 2.1, 8, 4.9);
      const sp = data?.specialties[c * specRows + r];
      if (sp) { g += t(cx + 0.6, yy + 1.7, sp[0], "val"); g += t(cx + colW - 6, yy + 1.7, String(sp[1]), "val-n", { a: "middle" }); }
    }
  }
  let y = y0 + hS + 3;
  if (opts.ladder !== false) { g += ladder(X0 + 2, y + 2, X1 - X0 - 4, mode); y += 15.6; }
  // Conditions | Scars
  const CR = 5, hC = 6.4 + 4 * CR;
  const half = (X1 - X0 - 4) / 2;
  g += section(X0, y, half, hC, "Conditions", "its die, and what it stops", skin);
  for (let r = 0; r < 4; r++) { const yy = y + 10.2 + r * CR; g += rule(X0 + 3, yy, X0 + half - 13) + box(X0 + half - 11, yy - 3.7, 8.4, 4.4); }
  g += section(X0 + half + 4, y, half, hC, "Scars", "each one a Catch · ring its Root", skin);
  for (let r = 0; r < 4; r++) {
    const yy = y + 10.2 + r * CR, x = X0 + half + 7;
    g += rule(x, yy, x + half - 19);
    ["B", "M", "S"].forEach((L, k) => { g += t(x + half - 15.4 + k * 4.2, yy - 0.5, L, "lab-s", { a: "middle", size: 1.9 }); g += `<circle class="orn-t" cx="${r2(x + half - 15.4 + k * 4.2)}" cy="${r2(yy - 1.1)}" r="1.5"/>`; });
  }
  y += hC + 3.5;
  // Kit
  const KR = 4.4, hK = 9.4 + 5 * KR;
  g += section(X0, y, X1 - X0, hK, "What you carry", "an item's +1 on a roll you use it in", skin);
  const cw = (X1 - X0 - 6) / 4;
  const kx = (c) => X0 + 3 + c * cw;
  g += t(kx(0), y + 7.4, "Equipment", "lab-s") + t(kx(0) + 17, y + 7.4, "what you wear or wield", "hint-s");
  g += t(kx(1), y + 7.4, "Utility", "lab-s") + t(kx(1) + 11, y + 7.4, "cross it off once it's used", "hint-s");
  g += t(kx(2), y + 7.4, "Bag", "lab-s") + t(kx(2) + 7, y + 7.4, "holds 10 · getting something out takes your action", "hint-s");
  for (let r = 0; r < 5; r++) {
    const yy = y + 12.4 + r * KR;
    if (r < 4) { g += rule(kx(0), yy, kx(0) + cw - 3); g += rule(kx(1), yy, kx(1) + cw - 3); }
    g += rule(kx(2), yy, kx(2) + cw - 3) + rule(kx(3), yy, kx(3) + cw - 3);
    const e = data?.kit.equipment[r], u = data?.kit.utility[r];
    if (e) g += t(kx(0) + 0.4, yy - 0.7, e, "val-s");
    if (u) g += t(kx(1) + 0.4, yy - 0.7, u, "val-s");
  }
  const ky = y + 12.4 + 4 * KR;
  g += t(kx(0), ky - 0.3, "Keepsake", "lab-s") + rule(kx(0) + 13.5, ky, kx(1) + cw - 3);
  if (data) g += t(kx(0) + 14, ky - 0.7, data.kit.keepsake, "val-s");
  y += hK + 3.5;
  // Growth: the Aspiration's five things, points banked, the Party Goal
  const hG = 289.5 - y;
  const aw = 112;
  g += section(X0, y, aw, hG, "Aspiration", "five things to finish it · a downtime slot gets you one", skin);
  g += t(X0 + 3, y + 9.6, "Name", "lab-s") + rule(X0 + 11.5, y + 10, X0 + aw - 3);
  if (data) g += t(X0 + 12, y + 9.3, data.aspiration, "val");
  const tw = (aw - 9) / 2;
  const tg = Math.min(5.2, (hG - 14) / 3);
  for (let i = 0; i < 5; i++) {
    const col = i < 3 ? 0 : 1, row = i < 3 ? i : i - 3;
    const xx = X0 + 3 + col * (tw + 3), yy = y + 15.6 + row * tg;
    g += t(xx, yy - 0.3, String(i + 1), "lab-s", { size: 1.6 }) + tick(xx + 2.4, yy - 2.4, 2.4) + rule(xx + 6, yy, xx + tw);
  }
  g += t(X0 + 3 + tw + 3, y + 15.6 + 2 * tg - 0.3, "all five: it's done", "hint-s");
  const px = X0 + aw + 4, pw = 30;
  g += section(px, y, pw, hG, "Points", "", skin);
  g += box(px + 5, y + 6.4, pw - 10, 10.2, "bx", 1.2);
  g += t(px + pw / 2, y + 19.8, "banked", "lab-s", { a: "middle" });
  g += t(px + pw / 2, y + 22.6, "2 a session ·", "hint-s", { a: "middle" });
  g += t(px + pw / 2, y + 24.8, "spend in downtime", "hint-s", { a: "middle" });
  const gx = px + pw + 4, gw = X1 - gx;
  g += section(gx, y, gw, hG, "Party Goal", "", skin);
  g += t(gx + 2.5, y + 8.6, "ring how far it's got", "hint-s");
  [2, 4, 6, 8, 10, 12].forEach((d, i) => { const col = i % 3, row = Math.floor(i / 3); g += die(d, gx + 7 + col * 7.4, y + 14.4 + row * 7, 5.2, { tint: "none" }); });
  return g;
}

// ── Option A: the Reliquary.
function frontA(mode, data) {
  const id = "A";
  let g = borderA();
  // wordmark
  g += `<path class="gilt" d="M17 11.4L20.4 14.8L17 18.2L13.6 14.8Z"/><path class="orn-f" d="M17 13.4L18.4 14.8L17 16.2L15.6 14.8Z" style="fill:${mode === "aged" ? "#4b2f7a" : "#666"}"/>`;
  g += t(22.4, 16.4, "ZI’DARA", "word", { size: 4.6 }) + t(22.6, 19.6, "CHARACTER SHEET", "lab-s", { ls: 0.55 });
  // player, pronouns
  g += t(146, 15.6, "Player", "lab-s") + rule(160, 16.2, 196) + t(146, 22.6, "Pronouns", "lab-s") + rule(160, 23.2, 196);
  if (data) { g += t(161, 15.5, data.player, "val") + t(161, 22.5, data.pronouns, "val"); }
  // the portrait: a gilt arch under Soul's keystone
  const px = 79, pw = 52, top = 47, bot = 111, ar = pw / 2;
  const arch = (k) => `M${px - k} ${bot + k}V${top + ar}A${ar + k} ${ar + k} 0 0 1 ${px + pw + k} ${top + ar}V${bot + k}Z`;
  // rays behind the arch
  if (mode === "aged") {
    let rays = "";
    for (let a = 180; a <= 360; a += 7.5) { const p1 = polar(105, top + ar, ar + 7, a), p2 = polar(105, top + ar, ar + 15 + (a % 15 === 0 ? 5 : 0), a); rays += `M${r2(p1.x)} ${r2(p1.y)}L${r2(p2.x)} ${r2(p2.y)}`; }
    g += `<path class="orn-t" d="${rays}" style="stroke-opacity:0.55"/>`;
  }
  g += `<path class="gilt" d="${arch(3.2)}"/><path class="orn" d="${arch(3.2)}" style="stroke-width:0.4"/>`;
  g += `<path class="orn-t" d="${arch(1.7)}"/>`;
  // beads on the arch's band
  for (let a = 185; a <= 355; a += 10) { const p = polar(105, top + ar, ar + 1.6, a); g += `<circle class="bead" cx="${r2(p.x)}" cy="${r2(p.y)}" r="0.42" style="fill:${mode === "aged" ? "#fff3cc" : "#777"}"/>`; }
  g += `<clipPath id="A-pic"><path d="${arch(0)}"/></clipPath>`;
  g += `<path class="pic-empty" d="${arch(0)}"/>`;
  if (data) g += `<g clip-path="url(#A-pic)"><g transform="translate(${px} ${bot - 130 * (pw / 100)}) scale(${pw / 100})">${portraitArt(mode, "A-pic-l")}</g></g><clipPath id="A-pic-l"><rect x="0" y="0" width="100" height="130"/></clipPath>`;
  else g += emptyPic(105, 82);
  g += `<path class="orn" d="${arch(0)}" style="stroke-width:0.35"/>`;
  // name plaque, a ribbon under the picture
  const ny = 118;
  g += `<path class="plate" d="M70 ${ny - 4.4}H140L143.5 ${ny - 2.4}L140.5 ${ny + 0.2}L143.5 ${ny + 2.8}L140 ${ny + 4.8}H70L66.5 ${ny + 2.8}L69.5 ${ny + 0.2}L66.5 ${ny - 2.4}Z"/>`;
  g += `<path class="orn-t" d="M72 ${ny - 3.2}H138M72 ${ny + 3.6}H138"/>`;
  g += t(74, ny - 0.6, "Name", "lab-s", { size: 1.4 });
  if (data) g += t(105, ny + 2.2, data.name, "name", { a: "middle" });
  // Soul, the keystone, its track over the top
  const S = { x: 105, y: 33, r: 12 };
  g += track("Soul", arcPts(S.x, S.y, 18, 203, 337), mode, data, 5.2, arcPts(S.x, S.y, 22.4, 203, 337));
  g += medallion(S.x, S.y, S.r, "Soul", mode, data, "A", id);
  // Body and Mind either side, tracks round underneath
  const B = { x: 40, y: 60, r: 14 }, M = { x: 170, y: 60, r: 14 };
  g += track("Body", arcPts(B.x, B.y, 20, 155, 25), mode, data, 5.6, arcPts(B.x, B.y, 25, 155, 25));
  g += track("Mind", arcPts(M.x, M.y, 20, 155, 25), mode, data, 5.6, arcPts(M.x, M.y, 25, 155, 25));
  g += medallion(B.x, B.y, B.r, "Body", mode, data, "A", id) + medallion(M.x, M.y, M.r, "Mind", mode, data, "A", id);
  // chains from the seals to the arch
  const chain = (x1, y1, x2, y2) => { let c = ""; const n = 7; for (let i = 0; i <= n; i++) { const f = i / n; c += `<circle class="bead" cx="${r2(x1 + (x2 - x1) * f)}" cy="${r2(y1 + (y2 - y1) * f)}" r="0.45"/>`; } return c; };
  g += chain(B.x + B.r + 1.6, B.y - 2, px - 4.5, 70) + chain(M.x - M.r - 1.6, M.y - 2, px + pw + 4.5, 70);
  // scar note and armour under each side seal; Soul's armour to the right of the keystone
  g += t(B.x, 91.2, "tick a box to lock a size with a Scar", "hint-s", { a: "middle" });
  g += t(M.x, 91.2, "tick a box to lock a size with a Scar", "hint-s", { a: "middle" });
  g += armour(16, 94, 50, "Body", mode, data) + armour(144, 94, 50, "Mind", mode, data);
  // Soul's armour on a plate top left, and what a hit does top right
  g += `<rect class="plate" x="13.5" y="25" width="52" height="16.5" rx="1"/>` + armour(16, 25.2, 48, "Soul", mode, data);
  g += `<rect class="plate" x="144.5" y="26.5" width="52" height="15" rx="1"/>`;
  g += t(170.5, 30.4, "When a hit gets through", "lab-s", { a: "middle" });
  g += t(170.5, 33.6, "its track drops a size · pay 2 from", "hint-s", { a: "middle" });
  g += t(170.5, 35.9, "the other two and it stays put (2:1)", "hint-s", { a: "middle" });
  g += t(170.5, 38.2, "below d2 is the Blaze", "hint-s", { a: "middle" });
  // Aura, actions, stride
  const ay = 127;
  g += t(14, ay + 1.4, "Aura", "ttl");
  for (let i = 0; i < 5; i++) g += hex(35 + i * 6.2, ay, 2.6, { on: data && i < data.aura });
  g += t(66.6, ay - 1.2, "full every scene,", "hint-s") + t(66.6, ay + 1.2, "past 5 on your turn", "hint-s");
  for (let i = 0; i < 3; i++) g += hex(81 + i * 5, ay, 2, { over: true });
  g += t(98, ay + 1.4, "Actions", "ttl") + box(118, ay - 3.4, 9, 6.8) + t(129, ay - 0.6, "one for each", "hint-s") + t(129, ay + 1.7, "archetype", "hint-s");
  g += t(146, ay + 1.4, "Stride", "ttl") + box(161, ay - 3.4, 9, 6.8) + t(172, ay - 0.6, "how far you", "hint-s") + t(172, ay + 1.7, "move for free", "hint-s");
  if (data) { g += t(122.5, ay + 1.4, String(data.actions), "val-n", { a: "middle" }) + t(165.5, ay + 1.4, String(data.stride), "val-n", { a: "middle" }); }
  g += lowerFront(133.5, mode, data, "A");
  g += t(105, 294.6, "zidara.world/sheets · Character sheet · two pages, print both sides on A4", "foot", { a: "middle" });
  return g;
}

// ── Option B: the Astrolabe.
function frontB(mode, data) {
  const id = "B";
  let g = borderB();
  // name ribbon across the top
  g += `<path class="plate" d="M62 11H148L152 16L148 21H62L58 16Z"/><path class="orn-t" d="M63.5 12.4H146.5M63.5 19.6H146.5"/>`;
  g += t(64.5, 14.6, "Name", "lab-s", { size: 1.4 });
  if (data) g += t(105, 18.6, data.name, "name", { a: "middle" });
  g += star(55.5, 16, 1.6) + star(154.5, 16, 1.6);
  g += `<path class="gilt" d="M16 11.8L19 14.8L16 17.8L13 14.8Z"/>` + t(21, 16.2, "ZI’DARA", "word", { size: 4 }) + t(21.2, 19.2, "CHARACTER SHEET", "lab-s", { ls: 0.5, size: 1.4 });
  g += t(160, 13.8, "Player", "lab-s") + rule(172, 14.4, 197) + t(160, 19.8, "Pronouns", "lab-s") + rule(172, 20.4, 197);
  if (data) g += t(173, 13.7, data.player, "val-s") + t(173, 19.7, data.pronouns, "val-s");
  // the dial
  const C = { x: 105, y: 84 }, R1 = 50.2, R2 = 58.4;
  g += `<circle class="gilt" cx="${C.x}" cy="${C.y}" r="${R2}"/>`;
  g += `<circle class="disc" cx="${C.x}" cy="${C.y}" r="${R2 - 0.9}" style="stroke-width:0.2"/>`;
  g += `<circle class="orn" cx="${C.x}" cy="${C.y}" r="${R1}"/><circle class="orn-t" cx="${C.x}" cy="${C.y}" r="${R1 - 1.2}"/>`;
  let ticks = "";
  for (let a = 0; a < 360; a += 2.5) { const p1 = polar(C.x, C.y, R1, a), p2 = polar(C.x, C.y, R1 + (a % 15 === 0 ? 1.3 : 0.7), a); ticks += `M${r2(p1.x)} ${r2(p1.y)}L${r2(p2.x)} ${r2(p2.y)}`; }
  g += `<path class="orn-t" d="${ticks}"/>`;
  // steps into dice round the rim, upright
  const steps = [[1, [2]], [2, [4]], [3, [6]], [4, [8]], [5, [10]], [6, [12]], [7, [12, 2]], [8, [12, 4]], [9, [12, 6]], [10, [12, 8]], [11, [12, 10]], [12, [12, 12]], [18, [12, 12, 12]], [24, [12, 12, 12, 12]]];
  steps.forEach(([n, dice], i) => {
    const a = -90 + (360 * i) / steps.length;
    const p = polar(C.x, C.y, (R1 + R2) / 2 + 0.1, a);
    const s = dice.length > 2 ? 2.2 : 2.9;
    const tot = dice.length * s + (dice.length - 1) * 0.3;
    g += t(p.x - tot / 2 - 0.6, p.y + 1, String(n), "val-n", { a: "end", size: 2.9, fill: mode === "aged" ? "#33230f" : "#151515" });
    dice.forEach((d, k) => { g += die(d, p.x - tot / 2 + s / 2 + k * (s + 0.3) + 0.6, p.y, s, { text: "" }); });
  });
  g += t(C.x, C.y - R2 - 1.6, "steps into dice", "lab-s", { a: "middle", size: 1.5 });
  // the picture in the middle, a rope ring round it
  const PR = 18.6;
  g += `<circle class="gilt" cx="${C.x}" cy="${C.y}" r="${PR + 2.4}"/>`;
  for (let a = 0; a < 360; a += 9) { const p = polar(C.x, C.y, PR + 1.2, a); g += `<circle class="bead" cx="${r2(p.x)}" cy="${r2(p.y)}" r="0.42" style="fill:${mode === "aged" ? "#fff3cc" : "#888"}"/>`; }
  g += `<clipPath id="B-pic"><circle cx="${C.x}" cy="${C.y}" r="${PR}"/></clipPath>`;
  g += `<circle class="pic-empty" cx="${C.x}" cy="${C.y}" r="${PR}"/>`;
  if (data) g += `<g clip-path="url(#B-pic)"><g transform="translate(${C.x - 0.42 * 58} ${C.y + PR - 0.42 * 130 + 2}) scale(0.42)">${portraitArt(mode, "B-pic-l")}</g></g><clipPath id="B-pic-l"><rect x="0" y="0" width="100" height="130"/></clipPath>`;
  else g += emptyPic(C.x, C.y);
  g += `<circle class="orn" cx="${C.x}" cy="${C.y}" r="${PR}" style="stroke-width:0.35"/>`;
  // the three on the dial
  const OR = 31.6, MR = 11.6;
  const at = { Soul: -90, Body: 150, Mind: 30 };
  for (const root of ROOTS) {
    const p = polar(C.x, C.y, OR, at[root]);
    // track round the outside of the seal, d12 first from the top end
    const a = at[root];
    const [a0, a1] = root === "Soul" ? [a - 64, a + 64] : root === "Body" ? [a + 62, a - 62] : [a - 62, a + 62];
    g += track(root, arcPts(p.x, p.y, 15.6, a0, a1), mode, data, 4.6);
    g += medallion(p.x, p.y, MR, root, mode, data, "B", id);
  }
  // left: Aura, actions, stride
  const lx = 13.5;
  g += t(lx, 35.6, "Aura", "ttl");
  for (let i = 0; i < 5; i++) g += hex(lx + 3.2, 42.4 + i * 5.6, 2.6, { on: data && i < data.aura });
  g += t(lx + 7.6, 54.4, "5 at most,", "hint-s") + t(lx + 7.6, 56.7, "full every", "hint-s") + t(lx + 7.6, 59, "scene", "hint-s");
  g += t(lx, 72.4, "past 5 on your turn", "hint-s");
  for (let i = 0; i < 3; i++) g += hex(lx + 3.2 + i * 5.4, 76.4, 2, { over: true });
  g += t(lx, 87, "Actions", "ttl") + box(lx, 89, 10, 7) + t(lx + 12, 92, "one for each", "hint-s") + t(lx + 12, 94.4, "archetype", "hint-s");
  g += t(lx, 106, "Stride", "ttl") + box(lx, 108, 10, 7) + t(lx + 12, 111, "how far you", "hint-s") + t(lx + 12, 113.4, "move free", "hint-s");
  if (data) g += t(lx + 5, 94, String(data.actions), "val-n", { a: "middle" }) + t(lx + 5, 113, String(data.stride), "val-n", { a: "middle" });
  g += t(lx, 127, "a hit that gets through", "hint-s") + t(lx, 129.3, "drops its track a size ·", "hint-s") + t(lx, 131.6, "2:1 keeps it · below d2", "hint-s") + t(lx, 133.9, "is the Blaze", "hint-s");
  // right: armour and scars for each Root
  const rx = 166, rw = 31;
  g += t(rx, 34, "By Root", "ttl");
  ROOTS.forEach((root, i) => {
    const y = 39 + i * 27;
    g += `<rect class="plate" x="${rx}" y="${y}" width="${rw}" height="24" rx="1.4"/>`;
    g += t(rx + 1.6, y + 3.4, root.toUpperCase(), "lab");
    g += t(rx + 1.6, y + 6.6, "armour", "hint-s");
    for (let k = 0; k < 2; k++) { const yy = y + 10.6 + k * 4.4; g += rule(rx + 1.6, yy, rx + rw - 9.6) + [0, 1, 2].map((j) => tick(rx + rw - 8.6 + j * 2.6, yy - 2, 2)).join(""); const p = data?.armour[root][k]; if (p) g += t(rx + 1.8, yy - 0.6, p[0], "val-s", { size: 1.9 }); }
    g += t(rx + 1.6, y + 21.4, "scars lock", "hint-s");
    ["d2", "d4", "d6", "d8", "d10"].forEach((dd, j) => { g += tick(rx + 12.4 + j * 3.6, y + 19.1, 2); g += t(rx + 13.4 + j * 3.6, y + 23.3, dd, "lab-s", { a: "middle", size: 1.2 }); });
  });
  g += lowerFront(147, mode, data, "B", { specRows: 6, ladder: false });
  g += t(105, 294.6, "zidara.world/sheets · Character sheet · two pages, print both sides on A4", "foot", { a: "middle" });
  return g;
}

// ── Option C: the Wayfarer.
function frontC(mode, data) {
  const id = "C";
  let g = borderC();
  // the name on a luggage tag, top left
  g += `<path class="plate" d="M22 11H86V31H22L15 26V16Z"/><circle class="orn" cx="19.4" cy="21" r="1.4"/><path class="orn" d="M18 21C14 18 13 14 15 10.5" style="stroke-width:0.25"/>`;
  g += t(24, 15, "Name", "lab-s", { size: 1.4 });
  g += rule(24, 23, 84);
  if (data) g += t(25, 22, data.name, "name", { size: 6 });
  g += t(24, 27.4, "Player", "lab-s", { size: 1.35 }) + rule(33, 28, 56) + t(58, 27.4, "Pronouns", "lab-s", { size: 1.35 }) + rule(70, 28, 84);
  if (data) g += t(33.4, 27.6, data.player, "val-s", { size: 2.2 }) + t(70.4, 27.6, data.pronouns, "val-s", { size: 2.2 });
  // wordmark top right on a stamp
  g += `<rect class="plate" x="156" y="11" width="40" height="11" rx="1"/><rect class="orn-t" x="157" y="12" width="38" height="9" rx="0.6"/>`;
  g += t(176, 16.6, "ZI’DARA", "word", { a: "middle", size: 3.8 }) + t(176, 19.7, "A WAYFARER'S RECORD", "lab-s", { a: "middle", size: 1.3, ls: 0.4 });
  // the miniature: an oval in a gilt frame with a ribbon bow
  const P = { x: 105, y: 58, rx: 21, ry: 27 };
  g += `<ellipse class="gilt" cx="${P.x}" cy="${P.y}" rx="${P.rx + 3}" ry="${P.ry + 3}"/><ellipse class="orn-t" cx="${P.x}" cy="${P.y}" rx="${P.rx + 1.5}" ry="${P.ry + 1.5}"/>`;
  g += `<clipPath id="C-pic"><ellipse cx="${P.x}" cy="${P.y}" rx="${P.rx}" ry="${P.ry}"/></clipPath>`;
  g += `<ellipse class="pic-empty" cx="${P.x}" cy="${P.y}" rx="${P.rx}" ry="${P.ry}"/>`;
  if (data) g += `<g clip-path="url(#C-pic)"><g transform="translate(${P.x - 0.52 * 58} ${P.y + P.ry - 0.52 * 130 + 1}) scale(0.52)">${portraitArt(mode, "C-pic-l")}</g></g><clipPath id="C-pic-l"><rect x="0" y="0" width="100" height="130"/></clipPath>`;
  else g += emptyPic(P.x, P.y);
  g += `<ellipse class="orn" cx="${P.x}" cy="${P.y}" rx="${P.rx}" ry="${P.ry}" style="stroke-width:0.35"/>`;
  // bow
  const by = P.y - P.ry - 3.4;
  g += `<path class="plate" d="M${P.x} ${by}C${P.x - 6} ${by - 5} ${P.x - 11} ${by - 1} ${P.x - 7} ${by + 2}C${P.x - 4} ${by + 3.5} ${P.x - 2} ${by + 1} ${P.x} ${by}C${P.x + 2} ${by + 1} ${P.x + 4} ${by + 3.5} ${P.x + 7} ${by + 2}C${P.x + 11} ${by - 1} ${P.x + 6} ${by - 5} ${P.x} ${by}Z"/><circle class="plate" cx="${P.x}" cy="${by}" r="1.3"/>`;
  // the seals: Body left, Mind right, Soul below; each track a straight row
  const seal = (root, cx, cy, rowX, rowY, armX, armY) => {
    let s = "";
    s += medallion(cx, cy, 11, root, mode, data, "C", id);
    // ribbon behind the row
    s += `<path class="plate" d="M${rowX - 4} ${rowY - 4}H${rowX + 6 * 7 + 1}L${rowX + 6 * 7 + 3} ${rowY}L${rowX + 6 * 7 + 1} ${rowY + 4}H${rowX - 4}L${rowX - 2} ${rowY}Z"/>`;
    s += track(root, rowPts(rowX, rowY, 6.8), mode, data, 5.2);
    // scar ticks under d10..d2
    [1, 2, 3, 4, 5].forEach((i) => { s += tick(rowX + i * 6.8 - 0.8, rowY + 4.6, 1.6); });
    s += t(rowX - 3.6, rowY + 6.1, "scar", "hint-s", { size: 1.5 });
    s += armour(armX, armY, 48, root, mode, data);
    return s;
  };
  g += seal("Body", 38, 44, 17, 66, 14, 74);
  g += seal("Mind", 172, 44, 151, 66, 148, 74);
  g += seal("Soul", 105, 97, 85, 118.6, 0, 0).replace(/<text[^>]*>Armour · Soul<\/text>[\s\S]*$/, "");
  // Soul's armour beside its seal, what a hit does on the other side
  g += armour(14, 98, 48, "Soul", mode, data);
  g += t(148, 101.4, "When a hit gets through", "lab-s");
  g += t(148, 104.6, "its track drops a size · pay 2 from the", "hint-s") + t(148, 106.9, "other two and it stays put (2:1)", "hint-s") + t(148, 109.2, "below d2 is the Blaze", "hint-s");
  // Aura, actions, stride on a strip
  const ay = 131;
  g += t(14, ay + 1.4, "Aura", "ttl");
  for (let i = 0; i < 5; i++) g += hex(35 + i * 6.2, ay, 2.6, { on: data && i < data.aura });
  g += t(66.6, ay - 1.2, "full every scene,", "hint-s") + t(66.6, ay + 1.2, "past 5 on your turn", "hint-s");
  for (let i = 0; i < 3; i++) g += hex(81 + i * 5, ay, 2, { over: true });
  g += t(98, ay + 1.4, "Actions", "ttl") + box(118, ay - 3.4, 9, 6.8) + t(129, ay - 0.6, "one for each", "hint-s") + t(129, ay + 1.7, "archetype", "hint-s");
  g += t(146, ay + 1.4, "Stride", "ttl") + box(161, ay - 3.4, 9, 6.8) + t(172, ay - 0.6, "how far you", "hint-s") + t(172, ay + 1.7, "move for free", "hint-s");
  if (data) { g += t(122.5, ay + 1.4, String(data.actions), "val-n", { a: "middle" }) + t(165.5, ay + 1.4, String(data.stride), "val-n", { a: "middle" }); }
  g += lowerFront(137.5, mode, data, "C", { specRows: 6 });
  g += t(105, 294.6, "zidara.world/sheets · Character sheet · two pages, print both sides on A4", "foot", { a: "middle" });
  return g;
}

// ── The back: who you are. Same parts on every option, in its own frames.
function back(mode, data, skin) {
  let g = skin === "A" ? borderA() : skin === "B" ? borderB() : borderC();
  const X0 = skin === "C" ? 15 : 13, X1 = 197;
  // header: a small copy of the picture and the name
  const hx = X0 + 1;
  const HY = 17;
  if (skin === "B") g += `<circle class="gilt" cx="${hx + 6.5}" cy="${HY}" r="7.4"/>`; else g += `<ellipse class="gilt" cx="${hx + 6.5}" cy="${HY}" rx="6.6" ry="8"/>`;
  g += `<clipPath id="bk-pic">${skin === "B" ? `<circle cx="${hx + 6.5}" cy="${HY}" r="6"/>` : `<ellipse cx="${hx + 6.5}" cy="${HY}" rx="5.4" ry="6.8"/>`}</clipPath>`;
  g += skin === "B" ? `<circle class="pic-empty" cx="${hx + 6.5}" cy="${HY}" r="6"/>` : `<ellipse class="pic-empty" cx="${hx + 6.5}" cy="${HY}" rx="5.4" ry="6.8"/>`;
  if (data) g += `<g clip-path="url(#bk-pic)"><g transform="translate(${hx + 6.5 - 0.15 * 58} ${HY + 7 - 0.15 * 130 + 1}) scale(0.15)">${portraitArt(mode, "bk-l")}</g></g><clipPath id="bk-l"><rect x="0" y="0" width="100" height="130"/></clipPath>`;
  g += t(hx + 16, 14, "Who you are", "lab-s", { ls: 0.6 });
  g += rule(hx + 16, 21, hx + 92);
  if (data) g += t(hx + 16.6, 20, data.name, "name", { size: 5.4 });
  g += t(X1, 16, "ZI’DARA", "word", { a: "end", size: 3.6 }) + t(X1, 19.2, "CHARACTER SHEET · PAGE 2", "lab-s", { a: "end", size: 1.35, ls: 0.45 });
  // Titles: six cards, six permissions each
  let y = 28.5;
  const CH = 45.5, hT = 2 * CH + 9;
  g += section(X0, y, X1 - X0, hT, "Titles", "a Title's +1 on a Root and +1 on three specialties · a permission's +1 on a Root and a specialty that fit it · six at most", skin);
  const cw = (X1 - X0 - 8) / 3;
  for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = X0 + 3 + col * (cw + 1), cy = y + 6 + row * (CH + 1.5);
    const T = data?.titles[i];
    g += `<rect class="orn-t" x="${r2(cx)}" y="${r2(cy)}" width="${r2(cw - 1)}" height="${CH}" rx="${skin === "B" ? 1.2 : 0}"/>`;
    const num = ["I", "II", "III", "IV", "V", "VI"][i];
    if (skin === "C") g += `<circle class="wax" cx="${cx + 4}" cy="${cy + 4.2}" r="3" style="fill:${mode === "aged" ? "#7e2a1f" : "#fff"}"/>` + t(cx + 4, cy + 5.2, num, "lab", { a: "middle", fill: mode === "aged" ? "#f6e3c4" : "#111", size: 2.2 });
    else g += `<path class="gilt" d="M${cx + 4} ${cy + 0.8}L${cx + 7.4} ${cy + 4.2}L${cx + 4} ${cy + 7.6}L${cx + 0.6} ${cy + 4.2}Z"/>` + t(cx + 4, cy + 5.1, num, "lab", { a: "middle", size: 2.1, fill: mode === "aged" ? "#2a1a08" : "#111" });
    g += rule(cx + 9, cy + 6, cx + cw - 3);
    if (T) g += t(cx + 9.4, cy + 5.3, T.name, "val-s", { size: T.name.length > 26 ? 2.45 : 2.75 });
    g += t(cx + 2.4, cy + 10.8, "Root", "lab-s");
    ["Body", "Mind", "Soul"].forEach((R, k) => { const rx = cx + 12.6 + k * 8; g += t(rx, cy + 10.8, R, "hint", { a: "middle", size: 1.9 }); if (T && T.root === R) g += `<ellipse class="pen-ring" cx="${rx}" cy="${cy + 10.2}" rx="3.4" ry="1.8"/>`; });
    g += t(cx + 2.4, cy + 14.8, "Specialties", "lab-s");
    for (let k = 0; k < 3; k++) { const sx = cx + 2.4 + k * ((cw - 5) / 3); g += rule(sx, cy + 18.8, sx + (cw - 5) / 3 - 1.4); if (T) g += t(sx + 0.2, cy + 18.2, T.specs[k], "val-s", { size: 2.2 }); }
    g += t(cx + 2.4, cy + 22.4, "Permissions", "lab-s") + t(cx + cw - 3, cy + 22.4, "its Root · specialty", "hint-s", { a: "end", size: 1.5 });
    for (let k = 0; k < 6; k++) {
      const ly = cy + 26.6 + k * 3.55;
      g += rule(cx + 2.4, ly, cx + cw - 3);
      const p = T?.perms[k];
      if (p) { g += t(cx + 2.7, ly - 0.55, p[0], "val-s", { size: 2.25 }); g += t(cx + cw - 3.2, ly - 0.55, `${p[1]} · ${p[2]}`, "val-s", { a: "end", size: 1.7 }); }
    }
  }
  y += hT + 4;
  // Archetypes
  const hA = 52;
  g += section(X0, y, X1 - X0, hA, "Archetypes", "its mechanic's free · each ability's 1 of its home track, or 2 from the other two", skin);
  for (let i = 0; i < 3; i++) {
    const cx = X0 + 3 + i * (cw + 1), cy = y + 6;
    const A = data?.archetypes[i];
    g += `<rect class="orn-t" x="${r2(cx)}" y="${r2(cy)}" width="${r2(cw - 1)}" height="${hA - 8}" rx="${skin === "B" ? 1.2 : 0}"/>`;
    g += `<circle class="orn" cx="${cx + 5.2}" cy="${cy + 5.2}" r="4"/>`;
    if (A) g += sigil(A.name, cx + 5.2, cy + 5.2, 5.4);
    g += rule(cx + 11, cy + 5.4, cx + cw - 3);
    if (A) g += t(cx + 11.4, cy + 4.7, A.name, "val");
    g += t(cx + 11, cy + 9.6, "home", "lab-s");
    ["Stamina", "Confidence", "Resolve"].forEach((R, k) => { const rx = cx + 24.4 + k * 10.4; g += t(rx, cy + 9.6, R, "hint", { a: "middle", size: 1.75 }); if (A && A.home === R) g += `<ellipse class="pen-ring" cx="${rx}" cy="${cy + 9}" rx="4.8" ry="1.75"/>`; });
    g += t(cx + 2.4, cy + 13.4, "Mechanic", "lab-s");
    g += rule(cx + 2.4, cy + 17.2, cx + cw - 3) + rule(cx + 2.4, cy + 20.8, cx + cw - 3);
    if (A) { const ml = wrap(A.mech, cw - 6, 2.2); g += t(cx + 2.7, cy + 16.6, ml[0], "val-s", { size: 2.15 }); if (ml[1]) g += t(cx + 2.7, cy + 20.2, ml.slice(1).join(" "), "val-s", { size: 2.15 }); }
    g += t(cx + 2.4, cy + 24, "Abilities", "lab-s") + t(cx + cw - 3, cy + 24, "cost", "hint-s", { a: "end", size: 1.5 });
    for (let k = 0; k < 6; k++) {
      const ly = cy + 27.4 + k * 3.3;
      g += rule(cx + 2.4, ly, cx + cw - 7) + rule(cx + cw - 6, ly, cx + cw - 3);
      const ab = A?.abil[k];
      if (ab) { g += t(cx + 2.7, ly - 0.5, ab[0], "val-s", { size: 2.1 }); g += t(cx + cw - 4.5, ly - 0.5, ab[1], "val-s", { a: "middle", size: 2.1 }); }
    }
  }
  y += hA + 4;
  // Attunement
  const hAt = 33;
  g += section(X0, y, X1 - X0, hAt, "Attunement", "one thing, bound to you · it can't break", skin);
  const at = data?.attune;
  const ax = X0 + 3;
  g += t(ax, y + 9, "Thing", "lab-s") + rule(ax + 9, y + 9.4, ax + 70) + t(ax + 74, y + 9, "Material", "lab-s") + rule(ax + 87, y + 9.4, ax + 118);
  if (at) g += t(ax + 9.4, y + 8.7, at.thing, "val-s");
  ["Awakened", "Tempered", "Perfected"].forEach((st, k) => { const sx = ax + 131 + k * 17; g += t(sx, y + 9, st, "hint", { a: "middle", size: 2 }); if (at && at.stage === st) g += `<ellipse class="pen-ring" cx="${sx}" cy="${y + 8.3}" rx="7.6" ry="2.1"/>`; });
  g += t(ax, y + 14, "Its Aura", "lab-s") + rule(ax + 13, y + 14.4, ax + 118);
  if (at) g += t(ax + 13.4, y + 13.7, at.aura, "val-s", { size: 2.15 });
  g += t(ax + 122, y + 14, "Catch", "lab-s") + rule(ax + 131, y + 14.4, X1 - 3);
  g += t(ax + 122, y + 18.8, "Burden", "lab-s") + rule(ax + 133, y + 19.2, X1 - 3);
  g += t(ax, y + 18.8, "Awakenings", "lab-s") + t(ax + 18, y + 18.8, "a passive one holds up to 2 Aura, pumped in on your turn · stored Aura goes at the end of the scene", "hint-s");
  const aw = (X1 - X0 - 9) / 2;
  for (let k = 0; k < 6; k++) {
    const col = Math.floor(k / 3), row = k % 3;
    const lx = ax + col * (aw + 3), ly = y + 23.4 + row * 3.9;
    g += rule(lx, ly, lx + aw - 22);
    g += t(lx + aw - 20.5, ly - 0.4, "passive · active", "hint-s", { size: 1.55 });
    g += tick(lx + aw - 6.4, ly - 2, 2) + tick(lx + aw - 3.6, ly - 2, 2);
    const w = at?.awak[k];
    if (w) { g += t(lx + 0.3, ly - 0.5, w[0], "val-s", { size: 2.15 }); g += `<ellipse class="pen-ring" cx="${lx + aw - 17.9}" cy="${ly - 0.95}" rx="2.7" ry="1.15"/>`; }
  }
  y += hAt + 4;
  // Bonds
  const hB = 2 * 18.6 + 7.6;
  g += section(X0, y, X1 - X0, hB, "Bonds", "ring each thread bond or hostile · tick it strained, then snapped", skin);
  const bw = (X1 - X0 - 9) / 2;
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = X0 + 3 + col * (bw + 3), by = y + 6.6 + row * 19;
    const B = data?.bonds[i];
    g += t(bx, by + 3.2, "Who", "lab-s") + rule(bx + 7, by + 3.6, bx + 46);
    if (B) g += t(bx + 7.4, by + 3, B.who, "val");
    g += t(bx + bw - 9, by + 3.2, "strained", "hint-s", { a: "middle", size: 1.45 }) + t(bx + bw - 3.6, by + 3.2, "snapped", "hint-s", { a: "middle", size: 1.45 });
    for (let k = 0; k < 3; k++) {
      const ly = by + 8 + k * 3.85;
      g += rule(bx, ly, bx + bw - 26);
      g += t(bx + bw - 22, ly - 0.4, "bond", "hint-s", { a: "middle", size: 1.55 }) + t(bx + bw - 16.6, ly - 0.4, "hostile", "hint-s", { a: "middle", size: 1.55 });
      g += tick(bx + bw - 10, ly - 2, 2) + tick(bx + bw - 4.6, ly - 2, 2);
      const th = B?.th[k];
      if (th) {
        const fits = wrap(th[0], bw - 27, 2.05);
        g += t(bx + 0.3, ly - 0.5, fits.length > 1 ? th[0] : th[0], "val-s", { size: fits.length > 1 ? 1.75 : 2.05 });
        g += `<ellipse class="pen-ring" cx="${th[1] === "bond" ? bx + bw - 22 : bx + bw - 16.6}" cy="${ly - 0.9}" rx="${th[1] === "bond" ? 2.2 : 2.8}" ry="1.25"/>`;
      }
    }
  }
  y += hB + 4;
  // Notes
  const hN = 290 - y - 0.5;
  g += section(X0, y, X1 - X0, hN, "Notes", "a second attuned thing, more bonds, trouble that follows you", skin);
  for (let k = 0; ; k++) { const ly = y + 9.6 + k * 4.6; if (ly > y + hN - 1.5) break; g += rule(X0 + 3, ly, X1 - 3); if (data?.notes[k]) g += t(X0 + 3.4, ly - 0.7, data.notes[k], "val-s"); }
  g += t(105, 294.6, "zidara.world/sheets · Character sheet, page 2", "foot", { a: "middle" });
  return g;
}

function page(mode, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(mode)}</style></head><body><div class="page"><svg class="sheet" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">${defs(mode)}${mode === "aged" ? parchment("pp", 5) : ""}${inner}</svg></div></body></html>`;
}

const FRONT = { A: frontA, B: frontB, C: frontC };
for (const opt of ["A", "B", "C"]) {
  fs.writeFileSync(`${OUT}/${opt}-front-aged.html`, page("aged", FRONT[opt]("aged", VESK)));
  fs.writeFileSync(`${OUT}/${opt}-back-aged.html`, page("aged", back("aged", VESK, opt)));
  fs.writeFileSync(`${OUT}/${opt}-front-ink.html`, page("ink", FRONT[opt]("ink", null)));
  fs.writeFileSync(`${OUT}/${opt}-back-ink.html`, page("ink", back("ink", null, opt)));
}
console.log("ok");
