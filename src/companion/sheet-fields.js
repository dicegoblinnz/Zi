// The character sheet's fields by name: what the paper holds, and how many of
// each. scripts/sheets/character-sheet.mjs draws every one of them somewhere
// on its two pages, scripts/build-sheets.mjs stops if the page it drew hasn't
// got exactly these, and print.js fills them by these names. So a new look
// can lay them out however it likes, and print still finds every one, and
// the checks read a printed character back against this list.
//
// A field's kind is text (typed in), check (a box to tick) or radio (one of
// its values to ring, by name: a die, a Root, a stage). Words that can run
// past a line (a Title, a mechanic, a Trait, Notes) get a field for each ruled line,
// since text typed into one tall box never sits on the lines under it, and
// print.js carries the words on from one to the next.

export const ROWS = {
  titles: 6, perms: 6,
  archetypes: 3, abilities: 6,
  attuned: 2, awakenings: 6, powering: 2,
  armour: 2, boxes: 3,
  conditions: 4, scars: 5,
  bonds: 4, threads: 3,
  equipment: 3, utility: 3, bag: 10,
  notes: 4,
};
export const ROOTS = ["body", "mind", "soul"];
export const TRACKS = ["stamina", "confidence", "resolve"];
export const DICE = ["d2", "d4", "d6", "d8", "d10", "d12"];
// The sizes a Scar can lock on a track, from the bottom up.
export const LOCKS = [2, 4, 6, 8, 10];
export const STAGES = ["awakened", "tempered", "perfected"];
export const WAKES = ["passive", "active"];
export const THREADS = ["bond", "hostile"];

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

export function sheetFields() {
  const out = [];
  const text = (name) => out.push({ name, kind: "text" });
  const check = (name) => out.push({ name, kind: "check" });
  const radio = (name, values) => out.push({ name, kind: "radio", values });

  // The front: who, Aura and stride, each Root with where it comes from and
  // its track, conditions, Scars, the Aspiration, the Party Goal, points,
  // what you carry and your attuned things.
  for (const f of ["name", "pronouns", "player", "aura_now", "aura_max", "aura_powering", "stride"]) text(f);
  ROOTS.forEach((r, k) => {
    text(`root_${r}`);
    for (const i of range(ROWS.titles)) text(`root_${r}_title_${i}`);
    text(`root_${r}_permissions`);
    const t = TRACKS[k];
    radio(t, DICE);
    for (const d of LOCKS) check(`${t}_scar_${d}`);
    for (const i of range(ROWS.armour)) {
      text(`${t}_armour_${i}`);
      for (const j of range(ROWS.boxes)) check(`${t}_armour_${i}_box_${j}`);
    }
  });
  for (const i of range(ROWS.conditions)) {
    text(`condition_${i}`);
    radio(`condition_${i}_die`, DICE);
  }
  for (const i of range(ROWS.scars)) text(`scar_${i}`);
  text("aspiration");
  radio("aspiration_die", DICE);
  text("party_goal");
  radio("party_goal_die", DICE);
  for (const f of ["points_spent", "points_start", "points_banked"]) text(f);
  for (const i of range(ROWS.equipment)) text(`equipment_${i}`);
  for (const i of range(ROWS.utility)) text(`utility_${i}`);
  text("keepsake");
  for (const i of range(ROWS.bag)) text(`bag_${i}`);
  for (const a of range(ROWS.attuned)) {
    for (const f of ["thing", "material"]) text(`attune_${a}_${f}`);
    radio(`attune_${a}_stage`, STAGES);
    for (const f of ["catch", "burden"]) text(`attune_${a}_${f}`);
    for (const i of range(ROWS.awakenings)) {
      text(`attune_${a}_awakening_${i}`);
      radio(`attune_${a}_awakening_${i}_kind`, WAKES);
      for (const j of range(ROWS.powering)) check(`attune_${a}_awakening_${i}_aura_${j}`);
    }
  }

  // The back: Titles with their spread and their permissions' Roots,
  // archetypes with their Trait and abilities, bonds and notes.
  for (const i of range(ROWS.titles)) {
    text(`title_${i}`);
    text(`title_${i}_more`);
    for (const r of ROOTS) text(`title_${i}_${r}`);
    for (const j of range(ROWS.perms)) {
      text(`title_${i}_permission_${j}`);
      radio(`title_${i}_permission_${j}_root`, ROOTS);
    }
  }
  for (const a of range(ROWS.archetypes)) {
    text(`archetype_${a}`);
    radio(`archetype_${a}_track`, TRACKS);
    for (const f of ["mechanic", "mechanic_more", "trait", "trait_more"]) text(`archetype_${a}_${f}`);
    for (const k of range(ROWS.abilities)) text(`archetype_${a}_ability_${k}`);
  }
  for (const b of range(ROWS.bonds)) {
    text(`bond_${b}`);
    for (const t of range(ROWS.threads)) {
      text(`bond_${b}_thread_${t}`);
      radio(`bond_${b}_thread_${t}_kind`, THREADS);
      check(`bond_${b}_thread_${t}_strained`);
      check(`bond_${b}_thread_${t}_snapped`);
    }
  }
  for (const i of range(ROWS.notes)) text(`notes_${i}`);
  return out;
}
