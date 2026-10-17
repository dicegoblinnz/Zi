// Gold marks: when a rule changes, every line it changes on a saved character
// gets a gold mark showing old and new. A character keeps what each line of
// its sheet said when the phone last saw it (state.seen, by a line's place on
// the sheet), and each line's compared with what the rules say now. A typo
// fix stays quiet: the same words with a letter or two out, or only the case,
// the punctuation or an accent changed, and never a number or a word like
// "not" or "more".

const plain = (html) => String(html ?? "").replace(/<[^>]+>/g, "").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const note = (x) => (x ? ` (${x})` : "");

// Every line on a sheet, by where it sits.
export function said(c) {
  const out = {};
  const n = c.numbers;
  out["num:aura"] = `Aura ${n.aura}`;
  out["num:resolve"] = `Resolve ${n.resolve}`;
  out["num:stride"] = `Stride ${n.stride}${note(n.strideNote)}`;
  out["num:armour"] = `Armour d${n.armour}${note(n.armourNote)}`;
  out["num:conf"] = `Confidence starts every scene on d${n.confidence}${note(n.confidenceNote)}${n.dressed ? `, or d${n.dressed.die} in ${n.dressed.what} when they fit the scene` : ""}`;
  out["num:hurt"] = `${n.hurtBars} Hurt bars${note(n.hurtNote)}`;
  for (const a of c.actions) out[`act:${a.name}`] = `${a.steps} step${a.steps === 1 ? "" : "s"}, ${a.die}`;
  c.titles.forEach((t, i) => {
    out[`title:${i}`] = `${t.name}${note(t.archetype)}`;
    t.permissions.forEach((p, j) => (out[`perm:${i}:${j}`] = p.text));
  });
  for (const a of c.archetypeRules) out[`arch:${a.name}`] = `${plain(a.summary)}${a.aura ? ` 1 Aura: ${plain(a.auraHtml || a.aura)}` : ""}`;
  c.traits.forEach((t, i) => (out[`trait:${i}`] = `${t.name}${note(t.type)}: ${plain(t.html)}`));
  const kit = c.carry;
  for (const where of ["equipment", "utility"]) out[`kit:${where}`] = `${kit[where].items.join(", ") || kit[where].note || "nothing"}, ${kit[where].items.length} of ${kit[where].max}`;
  if (kit.keepsake) out["kit:keepsake"] = kit.keepsake;
  out["kit:bag"] = `${kit.bag.name}${kit.bag.items?.length ? `: ${kit.bag.items.join(", ")}` : ""}`;
  c.attuned.forEach((a, i) => {
    out[`att:${i}`] = `${a.name}${note(a.props)}, ${a.stage || "Awakened"}${a.catch ? `, its Catch ${a.catch}` : ""}${a.burden ? `, its Burden ${a.burden}` : ""}`;
    a.permissions.forEach((p, j) => (out[`att:${i}:${j}`] = p.text));
  });
  for (const p of c.threads) p.threads.forEach((t, j) => (out[`thr:${p.person}:${j}`] = `${t.text}${note(t.note)}`));
  if (c.aspiration?.text) out.asp = c.aspiration.text;
  if (c.trouble?.length) out.trouble = c.trouble.join(" · ");
  return out;
}

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

export function typo(was, now) {
  const a = words(was);
  const b = words(now);
  if (a.join(" ") === b.join(" ")) return true;
  if ((String(was).match(/\d+/g) ?? []).join() !== (String(now).match(/\d+/g) ?? []).join()) return false;
  if (a.length !== b.length) return false;
  const off = a.map((w, i) => [w, b[i]]).filter(([x, y]) => x !== y);
  if (off.length > 2) return false;
  return off.every(([x, y]) => !MEANS.has(x) && !MEANS.has(y) && Math.min(x.length, y.length) >= 3 && apart(x, y) <= (Math.max(x.length, y.length) >= 7 ? 2 : 1));
}

// What's changed since the phone last saw the sheet: lines with a gold mark
// (a new line has no old), lines that have gone, and typo fixes to take
// quietly.
export function changesOf(seen, c) {
  const now = said(c);
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
  return { now, marks, gone, quiet };
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
