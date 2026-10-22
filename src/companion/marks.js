// Gold marks: when a rule changes, every line it changes on a saved character
// gets a gold mark showing old and new. A character keeps what each line of
// its sheet said when the phone last saw it (state.seen, by a line's place on
// the sheet), and each line's compared with what the rules say now. A typo
// fix stays quiet: the same words with a letter or two out, or only the case,
// the punctuation or an accent changed, and never a number or a word like
// "not" or "more".

const plain = (html) => String(html ?? "").replace(/<[^>]+>/g, "").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const note = (x) => (x ? ` (${x})` : "");
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"];

// Where each line sits. Lines from the rules count in order, and anything the
// player grew counts by its own number (g0, g1...), so a rule that adds or
// drops a line never makes their own look like it changed.
export function placesOf(c) {
  const at = (list) => {
    let n = 0;
    return list.map((x) => (x.g != null ? `g${x.g}` : String(n++)));
  };
  return {
    titles: at(c.titles),
    perms: c.titles.map((t) => at(t.permissions)),
    traits: at(c.traits),
    attuned: c.attuned.map((a) => at(a.permissions)),
    threads: Object.fromEntries(c.threads.map((p) => [p.person, at(p.threads)])),
  };
}

// Every line on a sheet: where it sits, what it says, and what to call it.
export function linesOf(c) {
  const out = [];
  const add = (id, text, name) => out.push({ id, text, name });
  const n = c.numbers;
  const P = placesOf(c);
  add("num:aura", `Aura ${n.aura}`, "Aura");
  add("num:resolve", `Resolve ${n.resolve}`, "Resolve");
  add("num:stride", `Stride ${n.stride}${note(n.strideNote)}`, "Stride");
  add("num:armour", `Armour d${n.armour}${note(n.armourNote)}`, "Armour");
  add("num:conf", `Confidence starts every scene on d${n.confidence}${note(n.confidenceNote)}${n.dressed ? `, or d${n.dressed.die} in ${n.dressed.what} when they fit the scene` : ""}`, "Confidence");
  add("num:hurt", `${n.hurtBars} Hurt bars${note(n.hurtNote)}`, "Hurt bars");
  for (const a of c.actions) add(`act:${a.name}`, `${a.steps} step${a.steps === 1 ? "" : "s"}, ${a.die}`, a.name);
  c.titles.forEach((t, i) => {
    const title = `your ${ORD[i] ?? "next"} Title`;
    add(`title:${P.titles[i]}`, `${t.name}${note(t.archetype)}`, `Your ${ORD[i] ?? "next"} Title`);
    t.permissions.forEach((p, j) => add(`perm:${P.titles[i]}:${P.perms[i][j]}`, p.text, `A permission on ${title}`));
  });
  for (const a of c.archetypeRules) add(`arch:${a.name}`, `${plain(a.summary)}${a.aura ? ` 1 Aura: ${plain(a.auraHtml || a.aura)}` : ""}`, a.name);
  c.traits.forEach((t, i) => add(`trait:${P.traits[i]}`, `${t.name}${note(t.type)}: ${plain(t.html)}`, t.name));
  const kit = c.carry;
  add("kit:equipment", `${kit.equipment.items.join(", ") || kit.equipment.note || "nothing"}, ${kit.equipment.items.length} of ${kit.equipment.max}`, "Equipment");
  add("kit:utility", `${kit.utility.items.join(", ") || kit.utility.note || "nothing"}, ${kit.utility.items.length} of ${kit.utility.max}`, "Utility");
  if (kit.keepsake) add("kit:keepsake", kit.keepsake, "Keepsake");
  add("kit:bag", `${kit.bag.name}${kit.bag.items?.length ? `: ${kit.bag.items.join(", ")}` : ""}`, "The bag");
  c.attuned.forEach((a, i) => {
    add(`att:${i}`, `${a.name}${note(a.props)}, ${a.stage || "Awakened"}${a.catch ? `, its Catch ${a.catch}` : ""}${a.burden ? `, its Burden ${a.burden}` : ""}`, a.name.charAt(0).toUpperCase() + a.name.slice(1));
    a.permissions.forEach((p, j) => add(`att:${i}:${P.attuned[i][j]}`, p.text, `A permission on ${a.name.replace(/^(A|An|The|His|Her|Their) /, (m) => m.toLowerCase())}`));
  });
  for (const p of c.threads) p.threads.forEach((t, j) => add(`thr:${p.person}:${P.threads[p.person][j]}`, `${t.text}${note(t.note)}`, `A thread with ${p.person}`));
  if (c.aspiration?.text) add("asp", c.aspiration.text, "Your Aspiration");
  if (c.trouble?.length) add("trouble", c.trouble.join(" · "), "Trouble that follows you");
  return out;
}
export const said = (c) => Object.fromEntries(linesOf(c).map((l) => [l.id, l.text]));

// Words that change what a line means however close they look.
const MEANS = new Set("not no nor never cant can cannot wont dont doesnt didnt isnt arent wasnt once twice more less most least all none any every each one two three four five six half up down own before after he she they him her them his hers their".split(" "));
const fold = (s) => String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’‘`]/g, "");
const words = (s) => fold(s).split(/[^a-z0-9+]+/).filter(Boolean);
function apart(a, b) {
  // Letters added, dropped, changed or swapped round.
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// "unnoticed" and "noticed" are a letter or two apart and mean the opposite.
const NOT = /^(un|in|im|il|ir|dis|non)/;
const flips = (x, y) => x.replace(NOT, "") === y || y.replace(NOT, "") === x;
// How far apart two words can be and still be a typo: none in a short word
// (heal and deal), bar two letters swapped round.
const slack = (x, y) => {
  const len = Math.max(x.length, y.length);
  if (len >= 7) return 2;
  if (len >= 5) return 1;
  return x.length === y.length && [...x].sort().join() === [...y].sort().join() ? 1 : 0;
};

export function typo(was, now) {
  const a = words(was);
  const b = words(now);
  const nums = (t) => (String(t).match(/[-−+]?\d+/g) ?? []).map((x) => x.replace("−", "-")).join();
  if (nums(was) !== nums(now)) return false;
  if (a.join(" ") === b.join(" ") || a.join("") === b.join("")) return true;
  if (a.length !== b.length) return false;
  const off = a.map((w, i) => [w, b[i]]).filter(([x, y]) => x !== y);
  if (off.length > 2) return false;
  return off.every(([x, y]) => ((x === "a" && y === "an") || (x === "an" && y === "a")) || (!MEANS.has(x) && !MEANS.has(y) && !flips(x, y) && Math.min(x.length, y.length) >= 3 && apart(x, y) <= slack(x, y)));
}

// What's changed since the phone last saw the sheet: lines with a gold mark
// (a new line has no old), lines that have gone, and typo fixes to take
// quietly.
export function changesOf(seen, c) {
  const all = linesOf(c);
  const now = Object.fromEntries(all.map((l) => [l.id, l.text]));
  const names = Object.fromEntries(all.map((l) => [l.id, l.name]));
  const marks = {};
  const quiet = [];
  for (const [id, text] of Object.entries(now)) {
    if (!(id in seen)) marks[id] = { was: null, now: text };
    else if (seen[id] !== text) {
      if (typo(seen[id], text)) quiet.push(id);
      else marks[id] = { was: seen[id], now: text };
    }
  }
  const gone = Object.keys(seen).filter((id) => !(id in now)).map((id) => ({ id, was: seen[id] }));
  return { now, names, marks, gone, quiet };
}

// After the player changes their own sheet (a downtime, the builder), the
// lines they changed are already seen, and a line the rules changed keeps its
// gold mark until they've seen it.
export function ownChanges(seen, before, after) {
  const out = { ...seen };
  for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[id] === after[id]) continue;
    if (id in seen && id in before && seen[id] !== before[id] && !typo(seen[id], before[id])) continue;
    if (id in after) out[id] = after[id];
    else delete out[id];
  }
  return out;
}
