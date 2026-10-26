// The Learn deck (content/learn.md): the core rules as cards, in book order,
// one idea to a card. scripts/build-content.mjs builds them into book.json, and
// tests/check-companion.mjs reads them the same way, so the two never differ.
//
//   ::::card[Title]{#l-id teaches=s-section}
//   The rule.
//
//   :::example
//   The crew at the table.
//   :::
//   ::::
//
// teaches is the id of the section the card teaches: a heading, a box, or a
// chapter's own id for its opening. Read more opens that section.

export const CARD_WORDS = [40, 120];
export const DECK_SIZE = [30, 40];
export const CREW = ["Vesk", "Dorrie", "Bram", "Isolde", "Wren", "Ash"];

const CARD = /^::::card\[([^\]\n]+)\]\{([^}\n]*)\}[ \t]*\n([\s\S]*?)\n::::[ \t]*$/gm;

// Every card, in the order they're written, and anything that stops one being read.
export function readCards(body) {
  const cards = [];
  const problems = [];
  for (const m of body.matchAll(CARD)) {
    const [, title, attrs, text] = m;
    const id = attrs.match(/(?:^|\s)#([A-Za-z0-9_-]+)/)?.[1] ?? null;
    const teaches = attrs.match(/\bteaches=["']?([A-Za-z0-9_-]+)/)?.[1] ?? null;
    if (!id) problems.push(`the card "${title}" hasn't got an #id`);
    if (!teaches) problems.push(`the card "${title}" doesn't say which section it teaches`);
    const example = text.match(/^:::example[^\n]*\n([\s\S]*?)\n:::[ \t]*$/m)?.[1] ?? "";
    cards.push({ id, title: title.trim(), teaches, text: text.trim(), example: example.trim(), words: wordsOf(text) });
  }
  const opened = [...body.matchAll(/^::::card\b/gm)].length;
  if (opened !== cards.length) problems.push(`there are ${opened} cards, but only ${cards.length} could be read (each one is ::::card[Title]{#id teaches=id}, closed with ::::)`);
  const seen = new Set();
  for (const c of cards) {
    if (c.id && seen.has(c.id)) problems.push(`two cards are called #${c.id}`);
    seen.add(c.id);
  }
  return { cards, problems };
}

// Words as you'd count them reading the card out: the box fences, the
// Markdown and the link targets don't count, and "d8" or "+3" does.
export function wordsOf(md) {
  const text = md
    .replace(/^:::.*$/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

// The newest change log entry: its date and every section it links to.
export function newestChange(changesBody) {
  const entries = [...changesBody.matchAll(/^## (.+?) \{#c-(\d{4}-\d{2}-\d{2})\}[ \t]*$/gm)].map((m) => ({ title: m[1], iso: m[2], at: m.index }));
  if (!entries.length) return null;
  const newest = entries.reduce((a, e) => (e.iso > a.iso ? e : a));
  const rest = changesBody.slice(newest.at).split("\n").slice(1).join("\n");
  const end = rest.search(/^## /m);
  const text = end === -1 ? rest : rest.slice(0, end);
  return { title: newest.title, iso: newest.iso, links: [...new Set([...text.matchAll(/\]\(#([A-Za-z0-9_-]+)\)/g)].map((m) => m[1]))] };
}

// The ids a card's section holds, and the sections around it, from the
// chapters' Markdown. A change that links to any of them touches the card.
export function reachOf(docs, id) {
  for (const doc of docs) {
    if (doc.meta?.id === id) {
      const first = doc.body.search(/^#{2,4} /m);
      const opening = first === -1 ? doc.body : doc.body.slice(0, first);
      return { inside: [id, ...idsIn(opening)], around: [] };
    }
    const head = doc.body.match(new RegExp(`^(#{2,4}) [^\\n]*\\{#${id}\\}[^\\n]*$`, "m"));
    if (head) {
      const rest = doc.body.slice(head.index + head[0].length);
      const end = rest.search(new RegExp(`^#{2,${head[1].length}} `, "m"));
      const inside = [id, ...idsIn(end === -1 ? rest : rest.slice(0, end))];
      return { inside, around: [doc.meta?.id, ...headsAbove(doc.body, head.index, head[1].length)].filter(Boolean) };
    }
    const at = doc.body.indexOf(`{#${id}}`);
    if (at !== -1) return { inside: [id], around: [doc.meta?.id, ...headsAbove(doc.body, at, 5)].filter(Boolean) };
  }
  return null;
}

const idsIn = (text) => [...text.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)].map((m) => m[1]);

// The headings a spot in a chapter sits under: the nearest one of each level
// above it, bigger than the level it's at.
function headsAbove(body, at, level) {
  const out = [];
  let want = level - 1;
  const before = body.slice(0, at).split("\n").reverse();
  for (const line of before) {
    const m = line.match(/^(#{2,4}) [^\n]*\{#([A-Za-z0-9_-]+)\}/);
    if (m && m[1].length <= want) {
      out.push(m[2]);
      want = m[1].length - 1;
      if (want < 2) break;
    }
  }
  return out;
}

// The cards a change touches: when it's newer than the date the deck was last
// checked, any card whose section it links to, or a section inside or around it.
export function staleCards(cards, change, checked, reach) {
  if (!change || (checked && String(checked) >= change.iso)) return [];
  const linked = new Set(change.links);
  return cards.filter((c) => {
    const r = reach(c.teaches);
    return r && [...r.inside, ...r.around].some((id) => linked.has(id));
  });
}
