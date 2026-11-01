// A faction's seal on the GM's phone (stage 1 of notes/faction-feel-plan.md):
// a fold on its page where she picks its charge, field and mark from the kit
// (src/kit/seals.js), or takes the one the world builder dealt it, as one
// change, { o: "seal", id, v } (board.js). The crew never sees this fold, and
// only sees the seal once they've been shown the faction's card.
//
// world.js makes it with makeSealPick() and puts fold() among the GM's parts
// of a faction's page, and its ACT beside the others. Stage 1 fills it in.

export function makeSealPick({ d, esc, edit, fold }) {
  return {
    // The fold on her faction's page, or nothing.
    fold: (id, f, doc) => "",
    // Its taps, keyed like world.js's own (data-act="seal" data-do="…").
    ACT: {},
    after: (app) => {},
  };
}
