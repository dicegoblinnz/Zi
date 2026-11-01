// A moment on every crew phone when she shows them something (stage 3 of
// notes/faction-feel-plan.md): the faction's seal breaks open and the part
// writes in, as a sheet over whatever's on the screen, with the same moment
// on the table screen. What's shown is only ever what the crew's been shown
// (forPlayer() in board.js), and it lands on the faction's page marked New
// till it's opened.
//
// world.js makes it with makeReveal() and hands it every change a player's
// phone sees in its world (news(), from take(), with the board before and
// after, as forPlayer() made them, and what newsOf() made of them). Stage 3
// fills it in.

export function makeReveal({ d, esc }) {
  return {
    // A player's phone has just taken a new world: was and now are the board
    // before and after, and news is { said, keys } from newsOf().
    news: (id, was, now, news) => {},
    // Its taps, keyed like world.js's own (data-act="reveal" data-do="…").
    ACT: {},
    after: (app) => {},
  };
}
