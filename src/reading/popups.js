// Pop-ups: tap a link to another section, in the rules, the change log or a
// Learn card, and a sheet comes up from the bottom with that section's opening,
// so you don't lose your place. Read more goes to the whole section, and Close
// puts you back where you were. A link inside a pop-up opens in the same
// sheet, with Back to the one before.
//
// The openings are built from the chapters into /openings.json (one file the
// service worker keeps, so they work offline), keyed by the address a link to
// that section has. A link whose section hasn't got an opening, because it
// starts with a table or an example, goes to its page the usual way.
import { closeSheet, openSheet } from "./sheet.js";

let openings = null;
let loading = null;

export function loadOpenings() {
  if (openings) return Promise.resolve(openings);
  loading ??= fetch("/openings.json")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (openings = data?.s ?? null))
    .catch(() => null)
    .finally(() => {
      loading = null;
    });
  return loading;
}

// The address a link has, the way the openings are keyed, if it's one of ours.
export function keyOf(a) {
  const href = a.getAttribute("href");
  if (!href || /^(mailto|tel):/.test(href)) return null;
  const url = new URL(href, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith("/rules/")) return null;
  return url.pathname + url.hash;
}

let sheet = null;
const stack = [];
let onMore = null;

function build() {
  sheet = document.createElement("dialog");
  sheet.className = "zs zp";
  sheet.setAttribute("aria-labelledby", "zp-t");
  sheet.innerHTML = `<div class="zs-in">
    <div class="zs-top" data-drag>
      <span class="zs-grab" aria-hidden="true"></span>
      <div class="zs-heading">
        <button type="button" class="zs-back zp-back" hidden><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Back</button>
        <p class="zs-where" id="zp-c"></p>
        <h2 class="zs-title" id="zp-t"></h2>
      </div>
    </div>
    <div class="zs-body" tabindex="-1" autofocus><div class="zp-text prose" data-pops></div></div>
    <div class="zs-foot">
      <a class="button primary zp-more" href="/rules/">Read more</a>
      <button type="button" class="button zs-close">Close</button>
    </div>
  </div>`;
  document.body.append(sheet);
  sheet.querySelector(".zp-back").addEventListener("click", () => {
    stack.pop();
    fill(stack[stack.length - 1]);
    settleFocus();
  });
  sheet.querySelector(".zp-more").addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    more(stack[stack.length - 1].key);
  });
  return sheet;
}

function fill({ key, entry }) {
  sheet.querySelector("#zp-c").textContent = entry.c;
  sheet.querySelector("#zp-t").textContent = entry.t;
  sheet.querySelector(".zp-text").innerHTML = entry.h;
  const link = sheet.querySelector(".zp-more");
  link.href = key;
  const which = document.createElement("span");
  which.className = "visually-hidden";
  which.textContent = `: ${entry.t}`;
  link.replaceChildren("Read more", which);
  sheet.querySelector(".zp-back").hidden = stack.length < 2;
  sheet.querySelector(".zs-body").scrollTop = 0;
}

// Read more: the deck keeps you in the deck (onMore), and anywhere else it's
// the section itself, on this page or the one it's on.
function more(key) {
  if (onMore) return closeSheet(sheet, () => onMore(key));
  const url = new URL(key, location.href);
  if (url.pathname !== location.pathname) location.href = key;
  else closeSheet(sheet, () => jump(url.hash));
}

// Straight to a section on this page, even one you've been to already, so
// Back in the browser comes back to where you were. A chapter read a section
// at a time on a phone opens that section instead (setJump, from lookup.js).
let onJump = null;
export const setJump = (fn) => {
  onJump = fn;
};
export function jump(hash) {
  if (onJump?.(hash)) return;
  const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return window.scrollTo(0, 0);
  history.pushState(null, "", hash);
  target.scrollIntoView();
}

// What had focus (Back, or a link in the opening) is gone once the sheet's
// filled again, so focus goes to its text, and a screen reader reads on.
function settleFocus() {
  sheet.querySelector(".zs-body").focus({ preventScroll: true });
}

export function showOpening(key, entry) {
  if (!sheet) build();
  const showing = sheet.open && !sheet.dataset.closing;
  if (!showing) stack.length = 0;
  if (stack[stack.length - 1]?.key !== key) stack.push({ key, entry });
  fill(stack[stack.length - 1]);
  openSheet(sheet);
  if (showing) settleFocus();
}

// Links inside anything marked data-pops pop up, apart from the lists that are
// there to jump about the page.
export function enablePopups(options = {}) {
  onMore = options.onMore ?? null;
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1200));
  idle(() => loadOpenings());
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.("a[href]");
    if (!a || !a.closest("[data-pops]") || a.closest(".whats-new, [data-no-pop]")) return;
    const key = keyOf(a);
    if (!key) return;
    if (openings) {
      if (!openings[key]) return;
      e.preventDefault();
      return showOpening(key, openings[key]);
    }
    // Not loaded yet: give it a moment, and if it's slow, the link goes to
    // its page the usual way rather than doing nothing.
    e.preventDefault();
    const slow = new Promise((done) => setTimeout(done, 350, null));
    Promise.race([loadOpenings(), slow]).then((data) => {
      if (data?.[key]) showOpening(key, data[key]);
      else location.href = a.href;
    });
  });
}
