// A sheet that comes up from the bottom of the screen: the pop-ups, a
// chapter's contents, the deck's list of cards and the deck's Read more.
// It's a <dialog class="zs"> holding one .zs-in, so focus stays inside it,
// Esc closes it and a tap outside it does too. It slides up, follows a
// finger dragging its top down and goes on a flick or a long enough drag.
// Under reduce-motion it just appears and goes.
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

const wired = new WeakSet();

function settle() {
  if (!document.querySelector("dialog.zs[open]")) document.documentElement.classList.remove("zs-open");
}

export function openSheet(dialog) {
  wire(dialog);
  if (dialog.open) return;
  dialog.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  delete dialog.dataset.closing;
  dialog.style.transform = "";
  dialog.showModal();
  document.documentElement.classList.add("zs-open");
  if (still()) return;
  dialog.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 360, easing: DRAWER });
  fade(dialog, [0, 1], 240);
}

export function closeSheet(dialog, then) {
  if (!dialog.open || dialog.dataset.closing) return;
  let gone = false;
  const done = () => {
    if (gone) return;
    gone = true;
    delete dialog.dataset.closing;
    dialog.close();
    dialog.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    dialog.style.transform = "";
    settle();
    then?.();
  };
  if (still()) return done();
  dialog.dataset.closing = "1";
  const from = dialog.style.transform || "translateY(0)";
  const away = dialog.animate([{ transform: from }, { transform: "translateY(100%)" }], { duration: 220, easing: DRAWER, fill: "forwards" });
  fade(dialog, [1, 0], 200);
  away.onfinish = done;
  away.oncancel = done;
}

// The backdrop fades with the sheet where the browser can animate it.
function fade(dialog, [from, to], duration) {
  try {
    dialog.animate([{ opacity: from }, { opacity: to }], { duration, easing: "ease-out", pseudoElement: "::backdrop", fill: "forwards" });
  } catch {}
}

function wire(dialog) {
  if (wired.has(dialog)) return;
  wired.add(dialog);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeSheet(dialog);
  });
  // A tap on the backdrop lands on the dialog itself, never on .zs-in.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeSheet(dialog);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target.closest?.(".zs-close")) closeSheet(dialog);
  });
  drag(dialog);
}

// Drag the top of the sheet down to put it away. A quick flick does it from
// anywhere, and a slow drag past a third of its height. Dragging up meets
// more and more friction, and a short drag springs back.
function drag(dialog) {
  let start = null;
  const handle = () => dialog.querySelector("[data-drag]");
  dialog.addEventListener("pointerdown", (e) => {
    const top = handle();
    if (start || !e.isPrimary || !top?.contains(e.target) || e.target.closest("button, a, input")) return;
    start = { y: e.clientY, t: performance.now(), id: e.pointerId, dy: 0 };
    top.setPointerCapture(e.pointerId);
  });
  dialog.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id) return;
    const raw = e.clientY - start.y;
    start.dy = raw >= 0 ? raw : -Math.sqrt(-raw) * 2;
    dialog.style.transform = `translateY(${start.dy}px)`;
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const { dy, t } = start;
    start = null;
    const speed = dy / Math.max(1, performance.now() - t);
    if (dy > dialog.offsetHeight / 3 || (dy > 12 && speed > 0.11)) return closeSheet(dialog);
    const from = dialog.style.transform;
    dialog.style.transform = "";
    if (!still() && from) dialog.animate([{ transform: from }, { transform: "translateY(0)" }], { duration: 200, easing: DRAWER });
  };
  dialog.addEventListener("pointerup", end);
  dialog.addEventListener("pointercancel", end);
}
