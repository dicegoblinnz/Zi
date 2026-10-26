// A sheet that comes up from the bottom of the screen: the pop-ups, a
// chapter's contents, the deck's list of cards and the deck's Read more.
// It's a <dialog class="zs"> holding one .zs-in, so focus stays inside it,
// Esc closes it and a tap outside it does too. It slides up, follows a
// finger dragging its top down and goes on a flick or a long enough drag.
// Opened again on its way down, it comes straight back up. Under
// reduce-motion it just appears and goes.
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

const wired = new WeakSet();
const states = new WeakMap();
const stateOf = (dialog) => {
  if (!states.has(dialog)) states.set(dialog, { away: null, thens: [] });
  return states.get(dialog);
};

function settle() {
  if (!document.querySelector("dialog.zs[open]")) document.documentElement.classList.remove("zs-open");
}

export function openSheet(dialog) {
  wire(dialog);
  const state = stateOf(dialog);
  if (state.away) {
    const from = getComputedStyle(dialog).transform;
    state.away.onfinish = null;
    state.away = null;
    state.thens = [];
    dialog.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    delete dialog.dataset.closing;
    dialog.style.transform = "";
    if (!still() && from && from !== "none") dialog.animate([{ transform: from }, { transform: "translateY(0)" }], { duration: 240, easing: DRAWER });
    return;
  }
  if (dialog.open) return;
  dialog.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  dialog.style.transform = "";
  dialog.showModal();
  document.documentElement.classList.add("zs-open");
  if (still()) return;
  dialog.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 360, easing: DRAWER });
  fade(dialog, [0, 1], 240);
}

// Put it away, then do whatever comes next (then), once it's gone.
export function closeSheet(dialog, then) {
  const state = stateOf(dialog);
  if (then) state.thens.push(then);
  if (!dialog.open || still()) return finish(dialog, state);
  if (state.away) return;
  dialog.dataset.closing = "1";
  const from = dialog.style.transform || "translateY(0)";
  const away = dialog.animate([{ transform: from }, { transform: "translateY(100%)" }], { duration: 220, easing: DRAWER, fill: "forwards" });
  fade(dialog, [1, 0], 200);
  state.away = away;
  away.onfinish = () => {
    if (state.away === away) finish(dialog, state);
  };
}

function finish(dialog, state) {
  state.away = null;
  delete dialog.dataset.closing;
  if (dialog.open) dialog.close();
  for (const a of dialog.getAnimations({ subtree: true })) {
    a.onfinish = null;
    a.cancel();
  }
  dialog.style.transform = "";
  settle();
  for (const then of state.thens.splice(0)) then();
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

// Drag the top of the sheet down to put it away: past a third of its height,
// or a flick, judged by how fast the finger's going at the end, so a slip
// doesn't do it and a flick after a pause does. Dragging up meets more and
// more friction, and a short drag springs back.
function drag(dialog) {
  let held = null;
  const handle = () => dialog.querySelector("[data-drag]");
  dialog.addEventListener("pointerdown", (e) => {
    const top = handle();
    if (held || !e.isPrimary || !top?.contains(e.target) || e.target.closest("button, a, input")) return;
    held = { y: e.clientY, id: e.pointerId, dy: 0, trail: [{ y: e.clientY, t: performance.now() }] };
    top.setPointerCapture(e.pointerId);
  });
  dialog.addEventListener("pointermove", (e) => {
    if (!held || e.pointerId !== held.id) return;
    const raw = e.clientY - held.y;
    held.dy = raw >= 0 ? raw : -Math.sqrt(-raw) * 2;
    held.trail.push({ y: e.clientY, t: performance.now() });
    if (held.trail.length > 12) held.trail.shift();
    dialog.style.transform = `translateY(${held.dy}px)`;
  });
  const end = (e) => {
    if (!held || e.pointerId !== held.id) return;
    const { dy, trail } = held;
    held = null;
    const now = performance.now();
    const recent = trail.filter((p) => now - p.t <= 80);
    const first = recent[0] ?? trail[trail.length - 1];
    const last = trail[trail.length - 1];
    const speed = (last.y - first.y) / Math.max(1, last.t - first.t);
    if (dy > dialog.offsetHeight / 3 || (dy > 24 && speed > 0.5)) return closeSheet(dialog);
    const from = dialog.style.transform;
    dialog.style.transform = "";
    if (!still() && from) dialog.animate([{ transform: from }, { transform: "translateY(0)" }], { duration: 200, easing: DRAWER });
  };
  dialog.addEventListener("pointerup", end);
  dialog.addEventListener("pointercancel", end);
}
