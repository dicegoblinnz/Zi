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

// ---------------------------------------------------------------- in a campaign
// Shared by the phone (party.js) and the Worker (src/worker/party.js).
//
// A thread with someone in the crew goes on both your sheets and counts for
// both of you, so in a campaign it's one thread on both phones: if either of
// you strains it, mends it or snaps it, it's done on both. A thread's two
// ends are "<user>:<character>", one for each of the players, so nobody
// else's thread is ever touched, and one with a character who's left the
// campaign is no one else's business.
export const STATES = ["whole", "strained", "snapped"];

// Whether the name on a thread is someone's character: the same name, or
// their first name ("Kael" for Kael Ashborn), however it's typed.
const plain = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/\s+/g, " ").trim();
export function sameName(person, name) {
  const p = plain(person);
  const n = plain(name);
  return Boolean(p && n) && (p === n || p === n.split(" ")[0]);
}

// The words a thread's known by, however its quotes and spaces were typed.
export const wordsKey = (text) => plain(text).replace(/[“”"]/g, "'").replace(/[.,]+$/, "");

// FNV-1a, run twice with different starts, so two threads in a campaign
// never come out the same.
function fnv(text, h) {
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
export const endsOf = (a, b) => (a < b ? [a, b] : [b, a]);
export function bondId(a, b, text) {
  const key = `${endsOf(a, b).join(" ")}|${wordsKey(text)}`;
  return `${fnv(key, 0x811c9dc5)}${fnv(key, 0x2f1b7c4d)}`;
}

// Where a thread ends up when someone moves it while somebody else might
// have too. Straining it (or doing right by them, for a hostile one) always
// counts, on top of wherever it's got to, so two strains that cross snap it,
// the same as at the table. A step back (mending it, wronging them again, or
// an undo) only lands if nobody's moved it since. from is null for a thread a
// phone's only just met in the campaign, and then it's whichever's further on,
// since a thread strained by either of you is strained for both.
export function moved(now, from, to) {
  const at = STATES.indexOf(now);
  const next = STATES.indexOf(to);
  if (next < 0) return now;
  if (at < 0) return to;
  if (from == null) return STATES[Math.max(at, next)];
  const was = STATES.indexOf(from);
  if (was < 0) return now;
  if (next > was) return STATES[Math.min(2, at + (next - was))];
  return now === from ? to : now;
}
