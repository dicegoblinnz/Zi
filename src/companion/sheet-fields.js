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
  archetypes: 3, abilities: 7,
  attuned: 2, awakenings: 6,
  conditions: 4, scars: 2, grow: 3, aspiration: 5,
  bonds: 4, threads: 3,
  // Six items, each with a box for every tier it could have, ticked for
  // armour's soak used or filled for a vessel's charge, and three Resources.
  items: 6, itemBoxes: 6, resources: 3,
  notes: 4,
};
export const ROOTS = ["body", "mind", "soul"];
// An item's kind, by its name on the paper.
export const KINDS = ["weapon", "tool", "guard", "armour", "pack", "vessel"];
// Each Root's wound, by its name on the paper.
export const WOUNDS = { body: "Bloodied", mind: "Frayed", soul: "Hollow" };
export const DICE = ["d2", "d4", "d6", "d8", "d10", "d12"];
export const STAGES = ["awakened", "tempered", "perfected"];
export const THREADS = ["bond", "hostile"];

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

export function sheetFields() {
  const out = [];
  const text = (name) => out.push({ name, kind: "text" });
  const check = (name) => out.push({ name, kind: "check" });
  const radio = (name, values) => out.push({ name, kind: "radio", values });

  // The front: who, Aura, Toll and stride, then each Root (on the new core,
  // 16 Nov 2026): its number and its dice, where its points came from, what
  // it holds once its awakenings and Scars have locked theirs, the points it
  // has now, its wound and its Scars (each with its slots toward a Trait).
  // Then conditions, the Aspiration, the Party Goal, points, your six items
  // (17 Nov), your Resources, the keepsake and your attuned things, each
  // awakening with the Root it locks.
  for (const f of ["name", "pronouns", "player", "aura_now", "aura_max", "toll", "stride"]) text(f);
  for (const r of ROOTS) {
    for (const f of ["", "_dice"]) text(`root_${r}${f}`);
    for (const i of range(ROWS.titles)) text(`root_${r}_title_${i}`);
    for (const f of ["permissions", "locked", "holds", "now"]) text(`root_${r}_${f}`);
    check(`root_${r}_wound`);
    // Each Scar's negative permission, and a box for each downtime slot
    // that grows it into a Trait.
    for (const i of range(ROWS.scars)) {
      text(`root_${r}_scar_${i}`);
      for (const j of range(ROWS.grow)) check(`root_${r}_scar_${i}_grow_${j}`);
    }
  }
  for (const i of range(ROWS.conditions)) {
    text(`condition_${i}`);
    radio(`condition_${i}_die`, DICE);
  }
  // The Aspiration's words, and a box for each of its 5 points.
  text("aspiration");
  for (const i of range(ROWS.aspiration)) check(`aspiration_${i}`);
  text("party_goal");
  radio("party_goal_die", DICE);
  for (const f of ["points_spent", "points_start", "points_banked"]) text(f);
  // Each item: its words, its kind and its tier, the Root armour soaks on,
  // and its boxes. Then your Resources (how many, and a line and a tick for
  // each one said) and the keepsake.
  for (const i of range(ROWS.items)) {
    text(`item_${i}`);
    radio(`item_${i}_kind`, KINDS);
    text(`item_${i}_tier`);
    radio(`item_${i}_root`, ROOTS);
    for (const j of range(ROWS.itemBoxes)) check(`item_${i}_box_${j}`);
  }
  text("resources");
  for (const i of range(ROWS.resources)) {
    text(`resource_${i}`);
    check(`resource_${i}_used`);
  }
  text("keepsake");
  for (const a of range(ROWS.attuned)) {
    for (const f of ["thing", "material"]) text(`attune_${a}_${f}`);
    radio(`attune_${a}_stage`, STAGES);
    for (const f of ["catch", "burden"]) text(`attune_${a}_${f}`);
    for (const i of range(ROWS.awakenings)) {
      text(`attune_${a}_awakening_${i}`);
      radio(`attune_${a}_awakening_${i}_root`, ROOTS);
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
