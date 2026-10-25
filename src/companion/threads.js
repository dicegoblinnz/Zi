// Threads, shared by the build (scripts/build-content.mjs) and the phone. A
// thread is one truth between you and a bond, and it's a bond thread
// (something good) or a hostile thread (something that's gone bad). Either
// kind can be strained, which means it's nearly snapped. On a sheet each one
// is { text, kind, whose, strained, note }, where whose is "Dorrie’s" when
// it's in someone else's words, and note is how the book writes it after the
// thread: "bond", "Dorrie’s, hostile", "bond, strained".

export const KINDS = ["bond", "hostile"];

export const threadNote = (t) => [t.whose || null, t.kind === "hostile" ? "hostile" : "bond", t.strained ? "strained" : null].filter(Boolean).join(", ");

// In play, a thread's whole, strained or snapped. The sheet says where it
// starts (a crew sheet can say strained), and what happens at the table is
// kept in the character's state by person and words: state.threads.
export const threadKey = (person, t) => `${person}|${t.text}`;
export function threadState(s, person, t) {
  const now = s?.threads?.[threadKey(person, t)];
  if (now === "snapped" || now === "strained" || now === "whole") return now;
  return t.strained ? "strained" : "whole";
}

// The five places a thread can sit, for one person: bond, bond strained,
// neutral (no thread at all, or one that's snapped), hostile strained, hostile.
export function threadPlace(t, state) {
  if (state === "snapped") return 2;
  if (t.kind === "hostile") return state === "strained" ? 3 : 4;
  return state === "strained" ? 1 : 0;
}
export const PLACES = ["Bond", "Bond, strained", "Neutral", "Hostile, strained", "Hostile"];
export const threadLabel = (t, state) => (state === "snapped" ? "Snapped" : PLACES[threadPlace(t, state)]);
