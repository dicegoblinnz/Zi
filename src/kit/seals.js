// Faction seals and the faction turn's outcome glyphs (stages 1 and 5 of
// notes/faction-feel-plan.md). Every faction gets a wax seal: a charge for
// the kind of faction it is, on a field split the way heraldry splits a
// shield, with a mark when two of a kind need telling apart. Seals are told
// apart by shape, never by colour, so violet keeps meaning theirs and a seal
// prints in one ink. kit.js draws them (seal() and glyph()).
//
// A faction keeps its seal as { c, f, d } (board.js): a charge's id, a
// field's id and a mark's id ("" for none). Ids stay stable once a seal's
// been dealt, since boards keep them, so retire one rather than renaming it.
//
// CHARGES and MARKS are line art in a 24 box, drawn like the archetype
// sigils (stroked, round caps and joins, a few strokes each) but never one of
// them, since a seal and a crest can sit on the same screen. A charge has to
// read at a web node's size, 32px across the whole seal. FIELDS are filled
// shapes in the seal's 64 box, clipped to its face (a circle of radius 19.5
// round 32, 32). GLYPHS are the faction turn's outcomes, line art in a 24 box.
//
// A charge's kinds are the world builder's type roles it suits (core.yaml's
// types), and its tags the tables' tags that make it likelier when they're
// on a faction's type, so a pirate fleet's likelier a ship than a knife. A
// charge with no kinds is never dealt, only written into a whole world or
// picked by the GM. scripts/world-tables.mjs checks every type role has
// three charges at least.
//
// Every drawing here is our own, never a company's or a game's logo.

const r1 = (n) => Math.round(n * 100) / 100;
const at = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];
const poly = (pts) => `M${pts.map((p) => p.join(" ")).join(" L")} Z`;

// A star, a burst or a cog's outline: points alternating between two radii.
const spiky = (n, outer, inner, turn = -90, cx = 12, cy = 12) => poly(Array.from({ length: n * 2 }, (_, k) => at(cx, cy, k % 2 ? inner : outer, turn + (180 * k) / n)));
// A cog: flat-topped teeth, each its own four corners.
function cog(n, outer, inner, cx = 12, cy = 12) {
  const pts = [];
  const step = 360 / n;
  for (let k = 0; k < n; k++) {
    const a = -90 + step * k;
    pts.push(at(cx, cy, inner, a - step * 0.32), at(cx, cy, outer, a - step * 0.2), at(cx, cy, outer, a + step * 0.2), at(cx, cy, inner, a + step * 0.32));
  }
  return poly(pts);
}
// A rose: five petals round a middle, only their outer edges drawn.
function rose(cx = 12, cy = 12, rc = 4.6, rp = 4.2) {
  const petals = Array.from({ length: 5 }, (_, k) => at(cx, cy, rc, -90 + 72 * k));
  // Where two neighbouring petals' circles cross, on the outside.
  const meet = (a, b) => {
    const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
    const h = Math.sqrt(Math.max(0, rp * rp - d * d));
    const [ux, uy] = [(mx - cx) / Math.hypot(mx - cx, my - cy), (my - cy) / Math.hypot(mx - cx, my - cy)];
    return [r1(mx + ux * h), r1(my + uy * h)];
  };
  const pts = petals.map((p, k) => meet(petals[(k + 4) % 5], p));
  let d = `M${pts[0].join(" ")}`;
  for (let k = 0; k < 5; k++) d += ` A${rp} ${rp} 0 1 1 ${pts[(k + 1) % 5].join(" ")}`;
  return `${d} Z`;
}
// Spokes from the hub out to the rim.
const spokes = (n, from, to, turn = -90, cx = 12, cy = 12) => Array.from({ length: n }, (_, k) => `M${at(cx, cy, from, turn + (360 * k) / n).join(" ")} L${at(cx, cy, to, turn + (360 * k) / n).join(" ")}`).join(" ");

export const CHARGES = {
  // A navy, a harbour's law, anyone who owns the docks.
  anchor: { name: "An anchor", kinds: ["traders", "soldiers"], tags: ["coast"], art: `<circle cx="12" cy="4.6" r="1.9"/><path d="M12 6.5 V20.2"/><path d="M8.2 9.4 H15.8"/><path d="M4.4 14.2 C4.6 18 7.8 20.2 12 20.2 C16.2 20.2 19.4 18 19.6 14.2"/><path d="M2.6 16 L4.4 14 L6.4 15.6 M21.4 16 L19.6 14 L17.6 15.6"/>` },
  // Sea traders, pirates, a pilgrim fleet.
  ship: { name: "A ship", kinds: ["traders", "crooks"], tags: ["coast", "foreign", "river"], art: `<path d="M3.2 14.6 H20.8 L18.2 19.4 H5.8 Z"/><path d="M12 3.4 V14.6"/><path d="M12 4.6 C15.8 6.4 17.6 9.4 18 12.4 H12"/><path d="M12 6.4 C9.4 7.8 8.1 9.9 7.6 12.4 H12"/>` },
  // The sea itself, a river, something that came up out of the water.
  wave: { name: "A wave", kinds: ["old"], tags: ["coast", "river", "marsh"], art: `<path d="M3 19.4 H21"/><path d="M3.2 15.8 C6.6 15.8 7.4 8.6 12.4 7.2 C16.2 6.2 19.6 8.4 19.6 11.6 C19.6 14 17.6 15.2 15.9 14.5 C14.3 13.8 14.4 11.8 15.9 11.4"/>` },
  // A trading house, a bank, a court.
  scales: { name: "Scales", kinds: ["traders", "office"], tags: ["law", "market"], art: `<path d="M12 3.6 V19.4"/><path d="M8.4 19.6 H15.6"/><path d="M4.4 7 H19.6"/><path d="M4.4 7 L2.2 12.4 M4.4 7 L6.6 12.4 M19.6 7 L17.4 12.4 M19.6 7 L21.8 12.4"/><path d="M1.8 12.4 Q4.4 16 7 12.4 Z M17 12.4 Q19.6 16 22.2 12.4 Z"/>` },
  // Money: a bank, a family business, whoever holds the debts.
  coins: { name: "Coins", kinds: ["traders", "family"], tags: ["wealth", "debt", "market"], art: `<ellipse cx="12" cy="5.6" rx="6.8" ry="2.4"/><path d="M5.2 5.6 V9.8 C5.2 11.2 8.2 12.2 12 12.2 C15.8 12.2 18.8 11.2 18.8 9.8 V5.6"/><path d="M5.2 9.8 V14 C5.2 15.4 8.2 16.4 12 16.4 C15.8 16.4 18.8 15.4 18.8 14 V9.8"/><path d="M5.2 14 V18.2 C5.2 19.6 8.2 20.6 12 20.6 C15.8 20.6 18.8 19.6 18.8 18.2 V14"/>` },
  // Thieves, keepers of what's locked away, the keys of the city.
  key: { name: "A key", kinds: ["crooks", "keepers", "office", "society"], tags: ["secret", "debt", "law"], art: `<circle cx="7.4" cy="7.4" r="4"/><path d="M10.2 10.2 L20.4 20.4"/><path d="M16.4 16.4 L18.7 14.1 M19 19 L21.1 16.9"/>` },
  // Smugglers, a watch, the ones who work by night.
  lamp: { name: "A lantern", kinds: ["crooks", "society", "keepers"], tags: ["secret", "magic"], art: `<path d="M12 2.4 V4.4"/><path d="M8.2 7.6 L9.8 4.4 H14.2 L15.8 7.6 Z"/><path d="M9 7.6 V16.4 L10.4 18.4 H13.6 L15 16.4 V7.6"/><path d="M12 10.2 C10.8 11.7 10.8 13.2 12 14.3 C13.2 13.2 13.2 11.7 12 10.2 Z"/><path d="M10.6 18.4 V20.6 H13.4 V18.4"/>` },
  // A street gang, a blade for hire, a knife in the dark.
  knife: { name: "A knife", kinds: ["crooks", "society"], tags: ["poor", "blood"], art: `<path d="M8.4 13.4 L20.6 3.4 L10.6 15.6 Z"/><path d="M6.2 12.6 L11.4 17.8"/><path d="M8.8 15.2 L4.4 19.6"/><circle class="dot" cx="3.6" cy="20.4" r="1.3"/>` },
  // Raiders, the plague, something long dead.
  skull: { name: "A skull", kinds: ["crooks", "old", "soldiers"], tags: ["war", "plague"], art: `<path d="M12 3.2 C7.4 3.2 4.6 6.4 4.6 10.4 C4.6 13 5.8 14.6 7.6 15.6 V19.6 H16.4 V15.6 C18.2 14.6 19.4 13 19.4 10.4 C19.4 6.4 16.6 3.2 12 3.2 Z"/><circle cx="9" cy="10.8" r="1.9"/><circle cx="15" cy="10.8" r="1.9"/><path d="M12 13.2 L11 15 H13 Z"/><path d="M10.4 19.6 V17.2 M13.6 19.6 V17.2"/>` },
  // A temple, a church, a choir.
  bell: { name: "A bell", kinds: ["faith"], tags: ["holy"], art: `<path d="M10.4 4.8 C10.4 2.6 13.6 2.6 13.6 4.8"/><path d="M4.8 17.2 C6.6 16.4 7.2 14.6 7.2 11.6 C7.2 7.4 9.4 4.6 12 4.6 C14.6 4.6 16.8 7.4 16.8 11.6 C16.8 14.6 17.4 16.4 19.2 17.2 Z"/><circle cx="12" cy="19.4" r="1.6"/>` },
  // An order, a sacrament, a blood oath.
  chalice: { name: "A cup", kinds: ["faith", "society"], tags: ["holy", "blood"], art: `<path d="M6.2 3.8 H17.8 C17.8 9 15.4 11.8 12 11.8 C8.6 11.8 6.2 9 6.2 3.8 Z"/><path d="M12 11.8 V18"/><path d="M10.2 14.8 H13.8"/><path d="M7.6 20.4 C8.2 18.8 9.8 18 12 18 C14.2 18 15.8 18.8 16.4 20.4 Z"/>` },
  // A faith with its god in the sky, a crown that says it's holy.
  sun: { name: "A sun", kinds: ["faith", "house"], tags: ["holy", "magic"], art: `<circle cx="12" cy="12" r="4.3"/><path d="${spokes(8, 6.6, 9.8, -90)}"/>` },
  // A noble house, a royal line, a kingdom.
  crown: { name: "A crown", kinds: ["house"], tags: ["crown", "blood"], art: `<path d="M4.6 17.4 L3.2 8.4 L8.2 11.8 L12 5.8 L15.8 11.8 L20.8 8.4 L19.4 17.4 Z"/><path d="M4.6 20.4 H19.4"/><circle cx="3.2" cy="6.4" r="1.3"/><circle cx="12" cy="3.6" r="1.3"/><circle cx="20.8" cy="6.4" r="1.3"/>` },
  // A keep, a garrison, a lord's seat, a tower over the city.
  tower: { name: "A tower", kinds: ["house", "soldiers", "office"], tags: ["wall", "stone", "hill"], art: `<path d="M5.8 20.2 V4.2 H8.5 V6.8 H10.7 V4.2 H13.3 V6.8 H15.5 V4.2 H18.2 V20.2"/><path d="M3.8 20.2 H20.2"/><path d="M10.2 20.2 V16 A1.8 1.8 0 0 1 13.8 16 V20.2"/><path d="M12 9.6 V12"/>` },
  // The law, the courts, an office that's stood for centuries.
  column: { name: "A column", kinds: ["office", "keepers"], tags: ["law", "crown", "old"], art: `<path d="M4.6 4.2 H19.4"/><path d="M6.4 4.2 C6.4 6.4 7.2 7.2 8.4 7.2 H15.6 C16.8 7.2 17.6 6.4 17.6 4.2"/><path d="M8.6 7.2 V17.6 M15.4 7.2 V17.6 M12 9.4 V15.4"/><path d="M6.8 17.6 H17.2 M5.2 20.4 H18.8"/>` },
  // Records, charters, the tax rolls, a library.
  scroll: { name: "A scroll", kinds: ["office", "keepers"], tags: ["law", "print", "old"], art: `<rect x="4.4" y="3.4" width="15.2" height="3.4" rx="1.7"/><rect x="4.4" y="17.2" width="15.2" height="3.4" rx="1.7"/><path d="M6.6 6.8 V17.2 M17.4 6.8 V17.2"/><path d="M9.4 10.4 H14.6 M9.4 13.6 H14.6"/>` },
  // A secret society (what's said under the rose stays there), a family.
  rose: { name: "A rose", kinds: ["society", "family", "house"], tags: ["secret", "blood"], art: `<path d="${rose()}"/><circle cx="12" cy="12" r="2.2"/>` },
  // A mercenary company, a warband, a rising.
  swords: { name: "Crossed swords", kinds: ["soldiers", "rebels"], tags: ["war", "metal"], art: `<path d="M7.8 16.2 L19.8 4.2 M16.2 16.2 L4.2 4.2"/><path d="M5.7 14.1 L9.9 18.3 M18.3 14.1 L14.1 18.3"/><path d="M7.8 16.2 L5 19 M16.2 16.2 L19 19"/><circle class="dot" cx="4.3" cy="19.7" r="1.2"/><circle class="dot" cx="19.7" cy="19.7" r="1.2"/>` },
  // Soldiers, a garrison, the watch in armour.
  helm: { name: "A helm", kinds: ["soldiers", "office"], tags: ["war", "wall"], art: `<path d="M5.4 20 V10.6 C5.4 6.2 8.4 3.4 12 3.4 C15.6 3.4 18.6 6.2 18.6 10.6 V20 Z"/><path d="M8 11 H16"/><path d="M12 11 V17.4"/>` },
  // A craft guild, smiths, whoever makes the swords.
  anvil: { name: "An anvil", kinds: ["makers"], tags: ["metal", "mine", "guild"], art: `<path d="M2.6 7.4 C5 7.4 6.4 6.8 7.4 6.4 H20.6 V9.4 C18 9.4 16 10.4 15.4 12.4 H9.8 C9.4 10.6 7.4 9.4 2.6 7.4 Z"/><path d="M9.8 12.4 L7.6 17.2 H16.6 L15.4 12.4"/><path d="M5.4 19.8 H18.6"/>` },
  // Mills, clockwork, a works, the machines.
  cog: { name: "A cog", kinds: ["makers"], tags: ["guild", "powder", "grain"], art: `<path d="${cog(8, 9.6, 7.2)}"/><circle cx="12" cy="12" r="2.8"/>` },
  // A family, a clan, roots older than the town.
  tree: { name: "A tree", kinds: ["family", "rebels", "old"], tags: ["forest", "land", "wild", "grain"], art: `<circle cx="12" cy="9" r="6.4"/><path d="M12 15.4 V20.6"/><path d="M8.2 20.6 H15.8"/><path d="M12 13 L9.6 10.6 M12 11.6 L14.4 9.2"/>` },
  // Carters, caravans, a spinning wheel, people always on the road.
  wheel: { name: "A wheel", kinds: ["traders", "family", "makers"], tags: ["road", "cloth", "foreign"], art: `<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="2.1"/><path d="${spokes(6, 2.1, 8.6, -90)}"/>` },
  // Rebels, the ones who broke free.
  chain: { name: "A broken chain", kinds: ["rebels"], tags: ["poor", "law"], art: `<path d="M9.6 13.4 L7.4 15.6 A3 3 0 0 1 3.2 11.4 L6.6 8 A3 3 0 0 1 10.2 7.4"/><path d="M14.4 10.6 L16.6 8.4 A3 3 0 0 1 20.8 12.6 L17.4 16 A3 3 0 0 1 13.8 16.6"/><path d="M12 4.2 V6.6 M12 17.4 V19.8 M4.8 19.2 L6.4 17.6 M19.2 4.8 L17.6 6.4"/>` },
  // Something old that wears a human face, a secret that bites.
  serpent: { name: "A serpent", kinds: ["old", "society"], tags: ["old", "secret", "magic", "wild"], art: `<path d="M5 20.4 C2.6 19.8 2.8 16.4 5.8 15.8 C9.4 15 14.8 15.6 16.4 12.2 C17.8 9.2 14.8 7 11.8 8.2 C9.8 9 8.6 7.4 9.6 5.8 C10.8 3.8 14.4 3.4 16.6 4.8"/><path d="M16.6 4.8 L19.6 3.6 M16.6 4.8 L19.4 6.6"/>` },
  // The hills, the mines, a nation up in the mountains.
  mountain: { name: "A mountain", kinds: ["house", "makers", "rebels"], tags: ["hill", "mine", "stone", "wild"], art: `<path d="M2.4 19.6 L9.2 7.2 L13.2 14 L15.6 10.4 L21.6 19.6 Z"/><path d="M6.8 11.6 L9.2 13.2 L11.2 11.2"/>` },
  // News, broadcasts, whoever's listening in. Never dealt: a whole world's,
  // or hers to pick.
  signal: { name: "A signal", kinds: [], tags: [], art: `<path d="M12 9.6 V20.6"/><path d="M8.4 20.6 H15.6"/><circle cx="12" cy="8" r="1.6"/><path d="M8.4 4.8 C7 6.6 7 9.4 8.4 11.2 M15.6 4.8 C17 6.6 17 9.4 15.6 11.2"/><path d="M5.4 2.8 C2.8 5.8 2.8 10.2 5.4 13.2 M18.6 2.8 C21.2 5.8 21.2 10.2 18.6 13.2"/>` },
};

// How a field splits the face. Plain first, since it has nothing.
export const FIELDS = {
  plain: { name: "Plain", art: "" },
  bend: { name: "Split on the slant", art: `<path d="M0 0 L64 64 L64 0 Z"/>` },
  pale: { name: "Split down the middle", art: `<rect x="32" y="0" width="32" height="64"/>` },
  fess: { name: "Split across", art: `<rect x="0" y="32" width="64" height="32"/>` },
  chevron: { name: "A chevron", art: `<path d="M8 46 L32 22 L56 46 L56 56 L32 32 L8 56 Z"/>` },
  wavy: { name: "Waves", art: `<path d="M0 37 Q4 33.6 8 37 T16 37 T24 37 T32 37 T40 37 T48 37 T56 37 T64 37 V64 H0 Z"/>` },
  quarterly: { name: "Quartered", art: `<path d="M0 0 H32 V32 H0 Z M32 32 H64 V64 H32 Z"/>` },
  pile: { name: "A wedge", art: `<path d="M19 0 H45 L32 43 Z"/>` },
};

// The marks that tell two of the same charge on the same field apart, the
// way a younger son's arms carry a small mark of his own. Drawn in a 24 box
// and set small in a badge on the seal's rim.
export const MARKS = {
  bar: { name: "A bar", art: `<path d="M3.6 8 H20.4"/><path d="M7.4 8 V16 M12 8 V16 M16.6 8 V16"/>` },
  crescent: { name: "A crescent", art: `<path d="M3.6 8.4 A8.4 8.4 0 0 0 20.4 8.4 A10.4 10.4 0 0 1 3.6 8.4 Z"/>` },
  star: { name: "A star", art: `<path d="${spiky(5, 9, 3.8)}"/>` },
  ring: { name: "A ring", art: `<circle cx="12" cy="12" r="6.6"/>` },
  cross: { name: "A cross", art: `<path d="M12 3.6 V20.4 M3.6 12 H20.4"/>` },
  dot: { name: "A dot", art: `<circle class="dot" cx="12" cy="12" r="5.4"/>` },
};

// The faction turn's outcomes, and its two other moves.
export const GLYPHS = {
  // A blow that breaks something: tick one off, and at zero it's gone.
  destroy: { name: "Destroy", art: `<path d="${spiky(8, 10, 4.4, -90)}"/>` },
  // A thread pulled apart: strain a bond, or write a hostile one.
  undermine: { name: "Undermine", art: `<path d="M2.4 12 C4.4 9.4 6.4 14.6 8.6 12 C6.4 9.4 4.4 14.6 2.4 12 Z"/><path d="M8.6 12 C11.6 10.8 14 8.2 15.6 5.2 M8.6 12 C11.6 13.2 14 15.8 15.6 18.8"/><path d="M18.4 4.4 L21.4 3.2 M18.6 19.6 L21.6 20.8"/>` },
  // An action stopped at a wall.
  obstruct: { name: "Obstruct", art: `<path d="M2.6 12 H13.6"/><path d="M10 8.4 L13.6 12 L10 15.6"/><path d="M18 4.2 V19.8"/><path d="M18 4.2 H21 M18 19.8 H21"/>` },
  // Two drawn together: write a bond, or mend a strained one.
  influence: { name: "Influence", art: `<circle cx="8.8" cy="12" r="5.6"/><circle cx="15.2" cy="12" r="5.6"/>` },
  // Taken and kept: an asset or a resource into its own hands.
  acquire: { name: "Acquire", art: `<path d="M12 2.8 V13"/><path d="M8.4 9.4 L12 13 L15.6 9.4"/><path d="M4.4 12.8 V17.4 C4.4 19.2 5.8 20.6 7.6 20.6 H16.4 C18.2 20.6 19.6 19.2 19.6 17.4 V12.8"/>` },
  // A flag planted: an asset, a resource or a mini faction added.
  establish: { name: "Establish", art: `<path d="M7.6 19 V3.8"/><path d="M7.6 4.4 H18 L15.6 8 L18 11.6 H7.6"/><path d="M3 20.4 C6.4 17.8 15.6 17.8 21 20.4"/>` },
  // Climbing toward it: its agenda's die goes up.
  agenda: { name: "Its agenda", art: `<path d="M3.4 19.6 H8 V15 H12.6 V10.4 H17.2 V5.6"/><path d="M14.2 8.4 L17.2 5.4 L20.2 8.4"/>` },
  // Aimed at the crew's diamond.
  crew: { name: "Comes for the crew", art: `<path d="M2.6 12 H10.6"/><path d="M7.6 8.8 L10.8 12 L7.6 15.2"/><path d="M17.6 6.8 L22.8 12 L17.6 17.2 L12.4 12 Z"/>` },
};

// ── Dealing one. A seal's the same seal wherever its mark's "" or missing.
export const sealKey = (s) => (s ? `${s.c}|${s.f}|${s.d || ""}` : "");
// A seal as it came from somewhere else: a charge and a field the kit has, and
// a mark it has or none. Anything else is no seal at all.
export function sealIn(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = String(raw.c ?? ""), f = String(raw.f ?? ""), d = String(raw.d ?? "");
  if (!Object.hasOwn(CHARGES, c) || !Object.hasOwn(FIELDS, f)) return null;
  return { c, f, d: d && Object.hasOwn(MARKS, d) ? d : "" };
}
// How likely each charge is for a kind of faction: three for one that suits
// its type role, and two for each of its type's tags it has. With no role (her
// own words, or a faction that wasn't dealt), every charge that can be dealt
// is as likely as the rest.
export function chargeWeights(role = null, tags = []) {
  const out = {};
  for (const [id, c] of Object.entries(CHARGES)) {
    if (!c.kinds.length) continue;
    out[id] = role ? (c.kinds.includes(role) ? 3 : 0) + 2 * tags.filter((t) => c.tags.includes(t)).length : 1;
  }
  return Object.values(out).some((w) => w > 0) ? out : chargeWeights(null);
}
// A seal none of taken has, from rand: a charge by its weight (one already on
// the board a quarter as likely, so a board spreads across them), then a
// field no seal in taken has with that charge, and a mark only once every
// field's gone with it. null when there's nothing left at all.
export function dealSeal(rand, { taken = [], weights = chargeWeights() } = {}) {
  const have = new Set(taken.map(sealKey));
  const used = new Set(taken.map((s) => s?.c));
  const pool = Object.entries(weights).filter(([, w]) => w > 0).map(([c, w]) => ({ c, w: w * (used.has(c) ? 0.25 : 1) }));
  const fieldIds = Object.keys(FIELDS);
  const markIds = Object.keys(MARKS);
  const mix = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1)) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  while (pool.length) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let x = rand() * total;
    let j = 0;
    for (; j < pool.length - 1; j++) {
      x -= pool[j].w;
      if (x < 0) break;
    }
    const { c } = pool.splice(j, 1)[0];
    const fields = mix(fieldIds);
    for (const f of fields) if (!have.has(`${c}|${f}|`)) return { c, f, d: "" };
    for (const d of mix(markIds)) for (const f of fields) if (!have.has(`${c}|${f}|${d}`)) return { c, f, d };
  }
  return null;
}
// A mini faction's seal: its maker's charge and field with a mark of its own,
// the first that's free, or a field of its own when the marks have run out.
export function cadetSeal(maker, taken = []) {
  const m = sealIn(maker);
  if (!m) return null;
  const have = new Set(taken.map(sealKey));
  for (const d of Object.keys(MARKS)) if (!have.has(`${m.c}|${m.f}|${d}`)) return { c: m.c, f: m.f, d };
  for (const f of Object.keys(FIELDS)) for (const d of Object.keys(MARKS)) if (!have.has(`${m.c}|${f}|${d}`)) return { c: m.c, f, d };
  return null;
}
// What a seal is, in words, for a screen reader and the GM's picker.
export function sealWords(s) {
  const v = sealIn(s);
  if (!v) return "";
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const field = v.f === "plain" ? "" : `, ${lower(FIELDS[v.f].name)}`;
  return `${CHARGES[v.c].name}${field}${v.d ? `, with ${lower(MARKS[v.d].name)}` : ""}`;
}
