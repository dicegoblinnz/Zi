// Question bubbles (Mo's 14 Nov ask, notes/stacking-plan.md): every
// explanation in the companion is a small ? beside what it explains, and a
// tap opens it over the screen instead of it taking up room on the screen.
// It's the native popover, so it needs no script: a tap anywhere else or
// Escape closes it, it sits over a dialog too, and its words are in the page,
// so it reads with no signal. This is prompt 0's first cut, and prompt 4 of
// the plan makes it look and feel right.
//
// tip(id, html, label): id makes the bubble's id (keep it unique on the
// screen), html is what it says, trusted and already escaped, and label is
// what a screen reader hears on the ?. The bubble's a span, so it can sit in
// a heading, a legend or a line of text, and what it says should be phrasing
// (text, em, strong, a link, br) when it sits inside a paragraph.

const attr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export const tipId = (id) => `tip-${String(id ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "x"}`;

export function tip(id, html, label = "What’s this?") {
  const key = tipId(id);
  return `<button type="button" class="tip" popovertarget="${key}" aria-label="${attr(label)}"><span aria-hidden="true">?</span></button><span id="${key}" class="tip-card" popover>${html}</span>`;
}
