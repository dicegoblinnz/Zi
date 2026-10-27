// How a telegraph from Twenty Places reads: who's telegraphing and what it's
// doing, and what it's aimed at. The build reads the book's this way for the
// live table's composer (scripts/build-content.mjs), and the GM's phone reads
// a place page's the same way when she telegraphs one of hers (table.js), so
// a page brought in from the book aims the way the book does.

const curly = (s = "") => String(s).replace(/'/g, "’");
// A line of speech in the book has straight quotes, curled the way
// smartypants curls them on the page.
export const curlyQuotes = (s = "") => [...String(s)].map((c, i, all) => (c === '"' ? (i === 0 || /[\s([]/.test(all[i - 1]) ? "“" : "”") : c)).join("");
const flat = (s = "") => String(s).replace(/\*/g, "").replace(/\s+/g, " ").trim();

// Where a telegraph's line splits into who's telegraphing and what it's doing,
// so it reads on the card like any other ("Dace" and "grabs his towel and
// heads for the changing room."). A name, or a title and a name, with a
// possessive taking the next word (Thorne's voice). After an article, the
// noun phrase up to its verb: the first plain word ending in s, unless it's a
// plural straight after the article (The horses spook) or the next word's the
// verb (grey shapes levels). A line that opens on something else (Halfway
// over, the ferry lurches) is the place's own (fallback).
const LEADS = new Set(["A", "An", "The", "One", "Two", "Three", "Four", "Some", "Every", "Each"]);
const NOT_VERBS = new Set(["his", "its", "this", "is", "was", "as", "us", "has", "hers", "ours", "theirs", "yours", "across", "less", "thus", "plus"]);
export function whoAndDoes(sentence, fallback) {
  const s = curlyQuotes(curly(flat(sentence)));
  const words = s.split(" ");
  const bare = (w = "") => w.replace(/[,:]$/, "");
  const stops = (w) => /[,:]$/.test(w);
  const verb = (w) => /^[a-z]+s$/.test(w) && !NOT_VERBS.has(w);
  let n = 0;
  if (LEADS.has(words[0])) {
    n = 1;
    for (let i = 1; i < words.length; i++) {
      if (stops(words[i])) {
        n = i + 1;
        break;
      }
      if (verb(bare(words[i]))) {
        n = i === 1 ? 2 : verb(bare(words[i + 1])) ? i + 1 : i;
        break;
      }
      n = i + 1;
    }
  } else if (!/^[A-Z][a-z]+ [a-z]+, (the|a|an) /.test(s)) {
    for (let i = 0; i < words.length; i++) {
      const w = bare(words[i]);
      if (!/^[A-Z]/.test(w)) break;
      n = i + 1;
      if (stops(words[i])) break;
      if (/’s$/.test(w)) {
        n = i + 2;
        break;
      }
    }
  }
  const who = words.slice(0, n).join(" ").replace(/[,:]$/, "");
  const does = words.slice(n).join(" ");
  return n && does ? { who, does } : { who: fallback, does: s };
}

// What it's aimed at, read off what follows its die: "Defend, Grabbed" is one
// of the crew, against Defend, and Grabbed if it lands; "the deal" is one of
// the place's stakes (stakes: their names), found by its name or the words it
// starts or ends with (the ship, for The ship in the bay); "the scene clock";
// and "everyone on the gallery, Defend, Staggered" is a part of the place.
// One at a stake puts a new tag in its way if it lands: the one in italics
// after the stake, if it names one, or the telegraph's own words (line). It
// gives { why } when it can't tell.
export function readAim(text, stakes, line = "") {
  const parts = String(text ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const j = parts.findIndex((x) => x === "Defend" || x === "Confidence");
  const target = j >= 0 ? parts.slice(0, j) : parts;
  const out = { kind: j >= 0 && parts[j] === "Confidence" ? "fear" : "blow", aim: "crew", one: j >= 0 ? curly(flat(parts.slice(j + 1).join(", "))).replace(/^[a-z]/, (c) => c.toUpperCase()) : "" };
  const head = flat(target[0] ?? "");
  if (!head) return j >= 0 ? out : { why: "it isn't aimed at anything" };
  if (/^the scene clock$/i.test(head)) return target.length > 1 ? { why: "it says more than the table can hold" } : { ...out, aim: "clock" };
  if (/^(everyone|anyone|whoever['’]s) /i.test(head)) return target.length > 1 ? { why: "it says more than the table can hold" } : { ...out, aim: "place", place: curly(head) };
  const key = (s) => flat(s).toLowerCase().replace(/[’']/g, "'").replace(/^(the|a|an) /, "");
  const want = key(head);
  const names = (stakes ?? []).map((s) => String(typeof s === "string" ? s : s?.name ?? ""));
  const exact = names.filter((n) => key(n) === want);
  const near = names.filter((n) => key(n).startsWith(`${want} `) || key(n).endsWith(` ${want}`));
  const stake = exact.length === 1 ? exact[0] : !exact.length && near.length === 1 ? near[0] : null;
  if (!stake || j >= 0) return { why: `"${head}" isn't one of its stakes, the scene clock or a part of the place` };
  if (target.length > 2) return { why: "it says more than the table can hold" };
  const named = target[1]?.match(/^\*([^*]+)\*$/)?.[1] ?? "";
  return { ...out, aim: "stake", stake, tag: curly(flat(named || line).replace(/[.\s]+$/, "")).replace(/,/g, "") };
}
