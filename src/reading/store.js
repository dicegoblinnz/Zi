// Where you're up to and your bookmarks, kept on this phone in one
// localStorage key, zi-reading, until accounts carry them. It's small, it's
// versioned, and a phone that can't store anything still reads fine.
//
//   { v: 1,
//     last: { slug, id, t, c, at },            the newest place you read
//     places: { [slug]: { id, t, at } },        where you're up to in each chapter
//     marks: [{ k: "sec", slug, id, t, c, at }, { k: "card", id, t, at }],
//     learn: { id, t, n, at },                  the card you're on in the deck
//     done: { [slug]: [id] } }                  the sections you've read to the end
const KEY = "zi-reading";

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data && data.v === 1) return { places: {}, marks: [], done: {}, ...data };
  } catch {}
  return { v: 1, last: null, places: {}, marks: [], learn: null, done: {} };
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

const keyOf = (m) => (m.k === "card" ? `card:${m.id}` : `sec:${m.slug}#${m.id}`);

export const marks = () => read().marks;
export const isMarked = (m) => read().marks.some((x) => keyOf(x) === keyOf(m));

// Bookmark it, or take the bookmark off. Hands back whether it's on now.
export function toggleMark(m) {
  const data = read();
  const key = keyOf(m);
  const on = !data.marks.some((x) => keyOf(x) === key);
  data.marks = on ? [{ ...m, at: Date.now() }, ...data.marks] : data.marks.filter((x) => keyOf(x) !== key);
  write(data);
  return on;
}

export const placeIn = (slug) => read().places[slug] ?? null;
export const lastPlace = () => read().last;

export function setPlace(slug, id, t, c) {
  const data = read();
  const at = Date.now();
  data.places[slug] = { id, t, at };
  data.last = { slug, id, t, c, at };
  write(data);
}

export const learnAt = () => read().learn;

export function setLearn(id, t, n) {
  const data = read();
  data.learn = { id, t, n, at: Date.now() };
  write(data);
}

// The sections of a chapter you've read to the end, for its contents.
export const doneIn = (slug) => read().done?.[slug] ?? [];

export function setDone(slug, id) {
  const data = read();
  const list = data.done[slug] ?? [];
  if (list.includes(id)) return;
  data.done[slug] = [...list, id];
  write(data);
}
