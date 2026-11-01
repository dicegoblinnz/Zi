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
// sigils (stroked, round caps and joins). FIELDS are filled shapes in the
// seal's 64 box, clipped to its face (a circle of radius 19.5 round 32, 32).
// GLYPHS are the faction turn's outcomes, line art in a 24 box.
//
// This first set is a placeholder for the stage to replace: the charges and
// glyphs are Mo's to say yes to on /kit/ before anything goes live.

export const CHARGES = {
  // A crowned anchor: a navy, a fleet, a harbour's law.
  anchor: { name: "An anchor", art: `<circle cx="12" cy="5.4" r="1.9"/><path d="M12 7.3 V20"/><path d="M8.2 10.2 H15.8"/><path d="M5 14.6 C5 17.9 8 20 12 20 C16 20 19 17.9 19 14.6"/>` },
  // Scales: a trading house, a bank, a court of law.
  scales: { name: "Scales", art: `<path d="M12 4.2 V19"/><path d="M8.2 19.4 H15.8"/><path d="M4.4 7 H19.6"/><path d="M4.4 7 L2.2 12.6 H6.6 Z"/><path d="M19.6 7 L17.4 12.6 H21.8 Z"/>` },
  // A lantern: smugglers, a watch, the ones who work by night.
  lamp: { name: "A lantern", art: `<path d="M9.4 5.8 H14.6"/><path d="M12 3.2 V5.8"/><path d="M9 5.8 L7.8 9 V16.8 L9 19.4 H15 L16.2 16.8 V9 L15 5.8"/><path d="M12 10.8 C10.6 12.4 10.7 14 12 15 C13.3 14 13.4 12.4 12 10.8 Z"/>` },
  // A bell under the water: a temple, a choir, something drowned.
  bell: { name: "A bell", art: `<path d="M8.2 17 V12.6 A3.8 3.8 0 0 1 15.8 12.6 V17 L17 18.6 H7 Z"/><path d="M10.8 20.4 A1.3 1.3 0 0 0 13.2 20.4"/><path d="M3 5.6 C4.5 5.6 4.5 4.4 6 4.4 S7.5 5.6 9 5.6 S10.5 4.4 12 4.4 S13.5 5.6 15 5.6 S16.5 4.4 18 4.4 S19.5 5.6 21 5.6"/>` },
};

export const FIELDS = {
  plain: { name: "Plain", art: "" },
  bend: { name: "Split on the slant", art: `<path d="M8 8 L56 56 L56 8 Z"/>` },
  pale: { name: "Split down the middle", art: `<rect x="32" y="8" width="28" height="48"/>` },
  chevron: { name: "A chevron", art: `<path d="M8 52 L32 28 L56 52 L56 58 L8 58 Z"/>` },
  wavy: { name: "Waves", art: `<path d="M8 36 q6 -4 12 0 t12 0 t12 0 t12 0 V58 H8 Z"/>` },
};

export const MARKS = {};

// The faction turn's outcomes, and its two other moves.
export const GLYPHS = {
  destroy: { name: "Destroy", art: `<path d="M5 5 L19 19 M19 5 L5 19"/>` },
  undermine: { name: "Undermine", art: `<path d="M4 18 H20"/><path d="M8 18 L11 11 L13 14 L16 8"/>` },
  obstruct: { name: "Obstruct", art: `<path d="M4 12 H20"/><path d="M12 5 V19"/>` },
  influence: { name: "Influence", art: `<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>` },
  acquire: { name: "Acquire", art: `<path d="M5 12 H17"/><path d="M13 7 L18 12 L13 17"/>` },
  establish: { name: "Establish", art: `<path d="M6 19 V9 L12 5 L18 9 V19 Z"/>` },
  agenda: { name: "Its agenda", art: `<path d="M5 17 L10 12 L13 15 L19 8"/><path d="M15 8 H19 V12"/>` },
  crew: { name: "Comes for the crew", art: `<path d="M4 12 H16"/><path d="M12 7 L17 12 L12 17"/><path d="M20 6 V18"/>` },
};
