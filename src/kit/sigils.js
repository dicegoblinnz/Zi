// A sigil for every archetype, drawn on a 24 grid in strokes of the current
// colour, so each look can draw them its own way. A character's crest is
// built from these (kit.js). Keep them to a few strokes each: they have to
// read at 14px on a telegraph and at 30px on a crest.
// When an archetype's added or renamed in 03a-the-archetypes.md, the kit page
// stops the build until it has a sigil here.

export const SIGILS = {
  // A lyre: nerve, voices, the song that lifts the crew.
  Bard: `<path d="M9.2 19.6 C7.6 16.6 6.6 12.8 6.2 9.2 C6 7.4 5.2 5.8 3.8 4.6"/><path d="M14.8 19.6 C16.4 16.6 17.4 12.8 17.8 9.2 C18 7.4 18.8 5.8 20.2 4.6"/><path d="M6.4 9.4 H17.6"/><path d="M8.6 19.6 H15.4"/><path d="M10.4 9.4 V19.6 M13.6 9.4 V19.6"/>`,
  // A drop of blood with a cut across it: stronger every time you're hurt.
  Bloodsworn: `<path d="M12 3.2 C12 3.2 5.8 10.4 5.8 14.6 A6.2 6.2 0 0 0 18.2 14.6 C18.2 10.4 12 3.2 12 3.2 Z"/><path d="M8.8 14.2 L15.2 12.6"/>`,
  // A flame: the element thrown across a whole area.
  Elementalist: `<path d="M12 2.8 C12.6 6.6 18.4 9.2 18.4 14.6 A6.4 6.4 0 0 1 5.6 14.6 C5.6 11.6 7.2 9.6 8.6 8 C8.8 10.4 9.8 11.6 11 12.2 C10.6 9 11 5.6 12 2.8 Z"/><path d="M12 19.6 C10.6 19.6 9.8 18.6 9.8 17.4 C9.8 15.9 11.2 14.9 12 13.4 C12.8 14.9 14.2 15.9 14.2 17.4 C14.2 18.6 13.4 19.6 12 19.6 Z"/>`,
  // A mask: getting into a threat's head.
  Face: `<path d="M3.4 8.2 C6.4 6.2 9.4 7 12 8.8 C14.6 7 17.6 6.2 20.6 8.2 C20.6 13.6 17.4 17.6 12 18.8 C6.6 17.6 3.4 13.6 3.4 8.2 Z"/><path d="M6.6 11.6 Q8.5 9.8 10.5 11.8 Q8.4 13 6.6 11.6 Z"/><path d="M17.4 11.6 Q15.5 9.8 13.5 11.8 Q15.6 13 17.4 11.6 Z"/>`,
  // A shield: standing in front of the crew.
  Guardian: `<path d="M12 2.8 L19.6 5.6 V11.4 C19.6 16 16.6 19.4 12 21.2 C7.4 19.4 4.4 16 4.4 11.4 V5.6 Z"/><path d="M12 6.4 V17.6"/>`,
  // A leaf with its vein: patching people up mid-scene.
  Healer: `<path d="M4.6 19.4 C4.6 11 10.2 4.6 19.4 4.6 C19.4 13.8 13 19.4 4.6 19.4 Z"/><path d="M4.6 19.4 L14.2 9.8"/><path d="M9 15 L8.6 11.6 M11.6 12.4 L14.8 12.8"/>`,
  // A mark on the prey.
  Hunter: `<circle cx="12" cy="12" r="6.8"/><path d="M12 2.6 V7 M12 17 V21.4 M2.6 12 H7 M17 12 H21.4"/><circle class="dot" cx="12" cy="12" r="1.7"/>`,
  // A shape and the copy they believe in.
  Illusionist: `<path d="M8 5.6 L14.4 12 L8 18.4 L1.6 12 Z"/><path class="dash" d="M16 5.6 L22.4 12 L16 18.4 L9.6 12 Z"/>`,
  // Rank: handing your steps out to the crew.
  Leader: `<path d="M5 9.4 L12 4.4 L19 9.4"/><path d="M5 14.4 L12 9.4 L19 14.4"/><path d="M5 19.4 L12 14.4 L19 19.4"/>`,
  // A hammer: giving an item something extra.
  Maker: `<g transform="rotate(-38 12 12)"><path d="M6.6 4 H17.4 V8.8 H6.6 Z"/><path d="M12 8.8 V21.2"/></g>`,
  // An eye: seeing what's coming.
  Oracle: `<path d="M2.4 12 C5.4 7 8.8 5 12 5 C15.2 5 18.6 7 21.6 12 C18.6 17 15.2 19 12 19 C8.8 19 5.4 17 2.4 12 Z"/><circle cx="12" cy="12" r="3.4"/><circle class="dot" cx="12" cy="12" r="1.3"/>`,
  // An open book: Study that makes something true.
  Scholar: `<path d="M12 6.4 C9.6 4.9 6.6 4.6 3.4 5.4 V18.6 C6.6 17.8 9.6 18.1 12 19.6 C14.4 18.1 17.4 17.8 20.6 18.6 V5.4 C17.4 4.6 14.4 4.9 12 6.4 Z"/><path d="M12 6.4 V19.6"/>`,
  // A crescent: watching from where nobody's looking.
  Shadow: `<path d="M14.6 3.6 A8.6 8.6 0 1 0 20.6 15.8 A7 7 0 0 1 14.6 3.6 Z"/>`,
  // Claws: what animals can do.
  Shifter: `<path d="M5.6 4.4 C8.8 8.8 9.8 14 8.8 19.8"/><path d="M11 3.4 C14.2 8.2 15.2 13.6 14.2 19.8"/><path d="M16.4 4.6 C19.4 8.8 20.2 13.6 19.2 18.6"/>`,
  // A soul lantern: the souls it's caught, ready to call back out.
  Summoner: `<circle cx="12" cy="3.6" r="1.5"/><path d="M9.2 6.4 H14.8 L16.8 9 V17 L14.8 19.6 H9.2 L7.2 17 V9 Z"/><path d="M12 10 C13.5 11.9 14.3 12.9 14.3 14.3 A2.3 2.3 0 0 1 9.7 14.3 C9.7 12.9 10.5 11.9 12 10 Z"/>`,
  // A jump from one spot to the next.
  Teleporter: `<circle class="dot" cx="4.8" cy="17.4" r="2"/><path class="dash" d="M6.2 14.6 C7.8 5.4 16.2 5.4 17.8 14"/><circle cx="19" cy="17.4" r="2.6"/>`,
  // A blade: fighting with dice that don't stop at their top face.
  Warrior: `<path d="M12 2.4 L14 4.8 V15 H10 V4.8 Z"/><path d="M6.8 15 H17.2"/><path d="M12 15 V19.4"/><circle class="dot" cx="12" cy="20.8" r="1.4"/>`,
};
