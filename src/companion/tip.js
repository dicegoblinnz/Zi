// Question bubbles (Mo's 14 Nov ask, notes/stacking-plan.md): every
// explanation in the companion is a small ? beside what it explains, and a
// tap opens it as a card over the screen instead of it taking up room on it.
//
// tip(id, html, label): id makes the bubble's id (keep it unique on the
// screen), html is what it says, trusted and already escaped (a list of
// strings is a paragraph each), and label is what the card's called, which is
// also what a screen reader hears on the ? ("How hiring works"). The bubble's
// inline, so it can sit in a heading, a legend or a line of text, and what it
// says has to be phrasing (text, b, em, small, a link, a button) for the same
// reason. Never put one inside a button, a link, a label or a summary. Its
// insides are elements of its own (zi-tip and the rest), so a screen's rules
// for the spans in it never reach the card.
//
// It's the native popover, so it opens and closes with no script and its
// words are in the page, which reads with no signal. The little script at the
// bottom, put in once, does what the popover can't on its own:
// - A tap anywhere else only closes it, so nothing under the tap gets pressed
//   by the same tap (a Next or an End the round, say).
// - Escape closes only the bubble, never the dialog or the map it's in, and
//   puts you back on its ?.
// - Moving on with the keyboard closes it, so one's never left open behind
//   you.
// - The screen's drawn again whenever something comes in (the world, the
//   table, the party sheet), so a bubble that's open when it is opens again on
//   the new screen, where it was, without its little arrival.
// The card's a dialog named by its title and described by its words, and it
// takes the focus when it opens (autofocus, and the script for a browser that
// doesn't do that for a popover), so a screen reader reads it out whole.

const attr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const text = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const tipId = (id) => `tip-${String(id ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "x"}`;

const ASK = "What’s this?";

export function tip(id, html, label = ASK) {
  const key = tipId(id);
  const words = Array.isArray(html) ? html.filter(Boolean).map((p) => `<zi-tip-p>${p}</zi-tip-p>`).join("") : html;
  // A bubble with a name of its own wears it as its title. One left on "What's
  // this?" has no title, since that says nothing.
  const named = label && label !== ASK;
  const name = named ? `aria-labelledby="${key}-h"` : `aria-label="${attr(label || ASK)}"`;
  return `<button type="button" class="tip" popovertarget="${key}" aria-label="${attr(label || ASK)}" style="anchor-name:--${key}"><zi-q aria-hidden="true">?</zi-q></button>`
    + `<zi-tip id="${key}" class="tip-card" popover role="dialog" ${name} aria-describedby="${key}-b" tabindex="-1" autofocus style="position-anchor:--${key}">`
    + `${named ? `<zi-tip-h id="${key}-h">${text(label)}</zi-tip-h>` : ""}<zi-tip-b id="${key}-b">${words}</zi-tip-b></zi-tip>`;
}

// What the script needs to know: the bubble that's open (`open`, by its id
// too, since a redraw makes a new one), and whether the tap going on started
// outside it while it was open (`swallow`).
const live = { open: null, id: null, swallow: false };
const isCard = (el) => el instanceof Element && el.classList.contains("tip-card");
const askFor = (card) => (card?.id ? document.querySelector(`[popovertarget="${CSS.escape(card.id)}"]`) : null);
const isOpen = (card) => Boolean(card?.isConnected && card.matches(":popover-open"));

function shut(card, back) {
  if (!isOpen(card)) return;
  card.hidePopover();
  if (back) askFor(card)?.focus({ preventScroll: true });
}

function install() {
  if (window.__ziTips) return;
  window.__ziTips = true;

  document.addEventListener("beforetoggle", (e) => {
    if (!isCard(e.target)) return;
    if (e.newState === "open") {
      live.open = e.target;
      live.id = e.target.id;
    } else if (live.open === e.target) {
      live.open = null;
      live.id = null;
    }
  }, true);

  // A browser that doesn't focus a popover's autofocus puts the focus in it here.
  document.addEventListener("toggle", (e) => {
    if (!isCard(e.target) || e.newState !== "open") return;
    if (!e.target.contains(document.activeElement)) e.target.focus({ preventScroll: true });
  }, true);

  // The tap that closes it is only that: the click it makes, and on a phone
  // the focus it would put in a box, go nowhere. A drag that scrolls makes no
  // click, and a key never starts one of these.
  addEventListener("pointerdown", (e) => {
    const card = live.open;
    live.swallow = isOpen(card) && !card.contains(e.target) && !askFor(card)?.contains(e.target);
  }, true);
  addEventListener("pointercancel", () => { live.swallow = false; }, true);
  addEventListener("mousedown", (e) => {
    if (live.swallow) e.preventDefault();
  }, true);
  addEventListener("click", (e) => {
    const swallow = live.swallow && e.detail !== 0;
    live.swallow = false;
    if (!swallow) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen(live.open)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    shut(live.open, true);
  }, true);

  document.addEventListener("focusout", (e) => {
    const card = live.open;
    const to = e.relatedTarget;
    if (!isOpen(card) || !to || !card.contains(e.target)) return;
    if (card.contains(to) || askFor(card)?.contains(to)) return;
    shut(card, false);
  }, true);

  // The screen's drawn again under an open bubble: open the new one.
  new MutationObserver(() => {
    if (!live.id || live.open?.isConnected) return;
    const card = document.getElementById(live.id);
    if (!isCard(card) || isOpen(card) || !card.isConnected) {
      live.open = null;
      live.id = null;
      return;
    }
    card.classList.add("is-kept");
    try {
      card.showPopover({ source: askFor(card) ?? undefined });
    } catch {
      live.open = null;
      live.id = null;
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof window !== "undefined" && typeof document !== "undefined" && typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype) install();
