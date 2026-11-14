// A faction's seal on the GM's phone (stage 1 of notes/faction-feel-plan.md):
// a fold on its page with its seal big, Deal another, and a picker for what's
// on it (its charge), how it's split (its field) and a mark, out of the kit
// (src/kit/seals.js). Each tap's one change, { o: "seal", id, v } (board.js),
// undone the same way. The crew never sees this fold, and only sees the seal
// once they've been shown the faction's card.
//
// No two factions on a board share a seal. Dealing another never gives one
// that's on the board, and a pick that would be another faction's takes a
// mark to tell the two apart, the way a younger son's arms do, and says so.
// A mark that would make it another faction's can't be picked.
//
// world.js makes it with makeSealPick() and puts fold() among the GM's parts
// of a faction's page, and its ACT beside the others (data-act="w" with the
// data-do of one of these).

import { CHARGES, FIELDS, MARKS, chargeWeights, dealSeal, sealIn, sealKey, sealWords } from "../kit/seals.js";
import { seal as kitSeal } from "../kit/kit.js";
import { tip } from "./tip.js";

const lower = (t) => String(t ?? "").charAt(0).toLowerCase() + String(t ?? "").slice(1);

export function makeSealPick({ d, esc, edit, fold }) {
  // The board her faction's page was last drawn from, for the taps.
  let last = { id: "", doc: null };
  // The faction whose seal's just changed, so it's pressed into the wax.
  let stamped = "";

  const othersOf = (doc, f) => doc.factions.filter((x) => x.id !== f.id && x.seal);
  const holderOf = (doc, f, s) => othersOf(doc, f).find((x) => sealKey(x.seal) === sealKey(s))?.name ?? "";
  // A seal with nobody else's on the board: as it is, or with the first free
  // mark, or failing that the first free field. null when there's none.
  function free(doc, f, s) {
    const taken = new Set(othersOf(doc, f).map((x) => sealKey(x.seal)));
    if (!taken.has(sealKey(s))) return s;
    for (const m of Object.keys(MARKS)) if (!taken.has(sealKey({ ...s, d: m }))) return { ...s, d: m };
    for (const fl of Object.keys(FIELDS)) for (const m of ["", ...Object.keys(MARKS)]) if (!taken.has(sealKey({ c: s.c, f: fl, d: m }))) return { c: s.c, f: fl, d: m };
    return null;
  }
  // What she's told: what it is now, and why it's got a mark if it took one.
  function said(doc, f, want, got) {
    const now = `${esc(f.name)}’s seal is now ${esc(lower(sealWords(got)))}.`;
    if (sealKey(want) === sealKey(got)) return now;
    const like = holderOf(doc, f, want);
    return `${now}${like ? ` That tells it apart from ${esc(like)}.` : ""}`;
  }
  const setSeal = (id, f, v, say) => {
    stamped = f.id;
    if (!edit(id, [{ o: "seal", id: f.id, v }], say)) {
      stamped = "";
      d.render();
    }
  };
  const factionAt = (el, id) => (last.id === id ? last.doc?.factions.find((x) => x.id === el.dataset.f) : null);

  // One option in the picker: the seal it'd make, small, pressed if it's hers.
  const option = (f, part, v, s, label, { on = false, off = "" } = {}) =>
    `<button type="button" class="sp-o${v === "" ? " is-none" : ""}" data-act="w" data-do="seal-set" data-f="${esc(f.id)}" data-part="${part}" data-v="${esc(v)}" aria-pressed="${on}" aria-label="${esc(off ? `${label}, which ${off} has` : label)}"${off ? " disabled" : ""}>${s ? kitSeal(s, { size: "sm" }) : `<span class="sp-none" aria-hidden="true">None</span>`}</button>`;

  function body(f, doc) {
    const s = sealIn(f.seal);
    const words = s ? sealWords(s) : "";
    const big = kitSeal(s, { size: "lg", label: words ? `Its seal: ${words}` : "No seal yet", cls: stamped === f.id ? "is-new" : "" });
    const top = `<div class="sp-top">${big}<div class="sp-say"><p class="sp-w">${words ? esc(words) : "No seal yet."} ${tip(`sp-${f.id}`, "The crew sees a faction’s seal with its card, and never before.", "When the crew sees it")}</p>
      <button type="button" class="button" data-act="w" data-do="seal-deal" data-f="${esc(f.id)}">${s ? "Deal another" : "Deal one"}</button></div></div>`;
    const charges = Object.keys(CHARGES).map((c) => option(f, "c", c, { c, f: s?.f ?? "plain", d: "" }, CHARGES[c].name, { on: s?.c === c })).join("");
    if (!s) return `${top}<fieldset class="sp-set"><legend>Or pick what’s on it</legend><div class="sp-grid">${charges}</div></fieldset>`;
    const fields = Object.keys(FIELDS).map((fl) => option(f, "f", fl, { c: s.c, f: fl, d: "" }, FIELDS[fl].name, { on: s.f === fl })).join("");
    const marks = ["", ...Object.keys(MARKS)].map((m) => {
      const want = { c: s.c, f: s.f, d: m };
      return option(f, "d", m, m ? want : null, m ? MARKS[m].name : "No mark", { on: s.d === m, off: s.d === m ? "" : holderOf(doc, f, want) });
    }).join("");
    return `${top}
      <fieldset class="sp-set"><legend>What’s on it</legend><div class="sp-grid">${charges}</div></fieldset>
      <fieldset class="sp-set"><legend>How it’s split</legend><div class="sp-grid">${fields}</div></fieldset>
      <fieldset class="sp-set"><legend>A mark, to tell it from another</legend><div class="sp-grid">${marks}</div></fieldset>`;
  }

  return {
    // The fold on her faction's page. Its heading's an h2, like the parts
    // beside it.
    fold: (id, f, doc) => {
      last = { id, doc };
      const s = sealIn(f.seal);
      const glance = s ? esc(sealWords(s)) : "None yet";
      return fold(`seal-${f.id}`, "Its seal", glance, `<div class="sp">${body(f, doc)}</div>`, "", 2);
    },
    ACT: {
      // A fresh one nobody on the board has, likelier one of its charge's
      // kinds (a temple's another temple's), never the one it's got.
      "seal-deal"(el, id) {
        const f = factionAt(el, id);
        if (!f) return d.render();
        const s = sealIn(f.seal);
        const kinds = s ? CHARGES[s.c].kinds : [];
        const base = chargeWeights(null);
        const weights = Object.fromEntries(Object.keys(base).map((c) => [c, kinds.some((k) => CHARGES[c].kinds.includes(k)) ? 5 : 1]));
        const v = dealSeal(Math.random, { taken: [...othersOf(last.doc, f).map((x) => x.seal), ...(s ? [s] : [])], weights });
        if (!v) return d.toast("Every seal the kit has is on the board already.", false);
        setSeal(id, f, v, said(last.doc, f, v, v));
      },
      // One part picked: what's on it, how it's split, or its mark.
      "seal-set"(el, id) {
        const f = factionAt(el, id);
        const part = el.dataset.part;
        if (!f || !["c", "f", "d"].includes(part)) return d.render();
        const s = sealIn(f.seal) ?? { c: "", f: "plain", d: "" };
        const want = { ...s, [part]: el.dataset.v ?? "" };
        if (!sealIn(want)) return d.render();
        if (sealKey(want) === sealKey(s)) return;
        // A mark that'd make it another faction's is never offered, so only
        // what's on it and how it's split ever need one.
        const got = part === "d" ? want : free(last.doc, f, want);
        if (!got || (part === "d" && holderOf(last.doc, f, want))) return d.toast("Another faction on the board has that one.", false);
        setSeal(id, f, got, said(last.doc, f, want, got));
      },
    },
    // Once it's been pressed into the wax, it's just there.
    after: () => {
      stamped = "";
    },
  };
}
