// A moment on every crew phone when she shows them something (stage 3 of
// notes/faction-feel-plan.md): the faction's seal breaks open and the part
// writes in, as a sheet over whatever's on the screen, with the same moment
// on the table screen (table-screen.js). What's shown is only ever what the
// crew's been shown: revealsOf() in reveal-rules.js works it out from the
// board before and after, as forPlayer() made it for this phone.
//
// world.js makes it with makeReveal() and hands it every change a player's
// phone sees in its world (news(), from take(), with the board before and
// after). A few at once come a faction's part at a time, Got it moving on;
// more than three, from a phone that's been away, come as one list. Sound and
// buzz go through feel.js, when the player's turned them on, and a polite
// live region says it in a line. It never takes the focus, and the sheet
// only covers the bottom of the screen, so the page under it still works.
// A faction the crew's met through a telegraph in the faction turn is the
// turn's news (turn.js marks those factions on its section, data-ftf), so its
// card alone doesn't get a sheet.
import { seal as kitSeal } from "../kit/kit.js";
import { calm, feel } from "./feel.js";
import { PART_SAID, revealsOf } from "./reveal-rules.js";

const MANY = 3;
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "";

export function makeReveal({ d, esc }) {
  const q = [];
  let on = null;
  let host = null;
  let sheet = null;
  let say = null;
  let gone = 0;
  // Where Got it's got to: the one on the sheet, of how many.
  const count = { at: 0, of: 0 };

  const gmName = (id) => first(d.list?.()?.find((x) => x.id === id)?.gm ?? d.campaign?.(id)?.campaign?.gm ?? "") || "Your GM";
  const pageOf = (id, f) => `/characters/?camp=${encodeURIComponent(id)}&world&f=${encodeURIComponent(f)}`;

  function mount() {
    if (host?.isConnected) return;
    host = document.createElement("div");
    host.className = "zr-host";
    host.innerHTML = `<p class="visually-hidden" id="zr-say" aria-live="polite"></p><section class="zr" role="dialog" aria-labelledby="zr-t" hidden></section>`;
    (document.querySelector("main.companion") ?? document.body).append(host);
    say = host.querySelector("#zr-say");
    sheet = host.querySelector(".zr");
    sheet.addEventListener("click", tap);
  }

  // A line of what it says. A Secret's tag is big, and a list is a list.
  function words(x) {
    const listed = ["res", "assets", "agenda"].includes(x.part);
    const lines = x.lines.map((l, i) => {
      const at = ` style="--i:${i}"`;
      if (l.big) return `<p class="zr-big"${at}><em>${esc(l.text)}</em></p>`;
      if (listed) return `<li${at}>${esc(l.text)}</li>`;
      return `<p${at}>${l.label ? `<b class="zr-k">${esc(l.label)}</b> ` : ""}${l.label === "Want" ? `<em>${esc(l.text)}</em>` : esc(l.text)}</p>`;
    });
    return listed ? `<ul class="zr-list">${lines.join("")}</ul>` : lines.join("");
  }

  function sealOf(x, size = "lg") {
    const label = x.part === "card" ? `${x.name}’s seal` : "";
    const opened = x.part === "card"
      ? `<span class="zr-half is-l">${kitSeal(null, { size, blank: true })}</span><span class="zr-half is-r">${kitSeal(null, { size, blank: true })}</span>`
      : "";
    return `<div class="zr-seal is-${x.part === "card" ? "met" : "part"}"><span class="zr-real">${kitSeal(x.seal, { size, label })}</span>${opened}<svg class="zr-crack" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path pathLength="1" d="M34 5 L29 20 L36 31 L27 43 L33 59"/></svg></div>`;
  }

  // One reveal on the sheet.
  function drawOne({ id, x }, at, of) {
    const who = gmName(id);
    sheet.className = `zr is-${x.part}${x.part === "secret" ? " is-big" : ""}`;
    sheet.innerHTML = `<span class="zr-grab" aria-hidden="true"></span>${sealOf(x)}
      <h2 id="zr-t" class="zr-t">${esc(x.title)}</h2>
      <div class="zr-w">${words(x)}</div>
      <p class="zr-n">${esc(who)}’s shown the crew ${esc(PART_SAID[x.part])}.${of > 1 ? ` <b>${at} of ${of}</b>` : ""}</p>
      <div class="zr-do"><a class="button" href="${esc(pageOf(id, x.f))}" data-zr="page">Its page</a><button type="button" class="button primary" data-zr="ok">Got it</button></div>`;
  }

  // A phone that's been away: everything it's found out, as one list.
  function drawMany(id, list) {
    const who = gmName(id);
    sheet.className = "zr is-many";
    sheet.innerHTML = `<span class="zr-grab" aria-hidden="true"></span>
      <h2 id="zr-t" class="zr-t">You’ve found out ${list.length} things</h2>
      <ul class="zr-many">${list.map(({ x }, i) => `<li style="--i:${i}"><a href="${esc(pageOf(id, x.f))}" data-zr="page">${kitSeal(x.seal, { size: "sm" })}<span><b>${esc(x.title)}</b><small>${esc(x.lines.find((l) => l.big)?.text ?? x.lines[0]?.text ?? "")}</small></span></a></li>`).join("")}</ul>
      <p class="zr-n">${esc(who)}’s shown the crew all of this since this phone last looked.</p>
      <div class="zr-do"><button type="button" class="button primary" data-zr="all">Got it</button></div>`;
  }

  function lineFor(id, x) {
    const secret = x.part === "secret" ? x.lines.find((l) => l.big)?.text : "";
    return `${gmName(id)}’s shown the crew ${x.part === "card" ? x.name : x.title}${secret ? `: ${secret}` : ""}.`;
  }

  function show() {
    mount();
    clearTimeout(gone);
    if (!q.length) return close();
    const id = q[0].id;
    const same = q.filter((y) => y.id === id);
    if (same.length > MANY) {
      on = { many: same };
      drawMany(id, same);
      say.textContent = `${gmName(id)}’s shown the crew ${same.length} things since this phone last looked.`;
    } else {
      on = q[0];
      if (sheet.hidden || !count.of) Object.assign(count, { at: 0, of: same.length });
      count.at += 1;
      count.of = Math.max(count.of, count.at + same.length - 1);
      drawOne(on, count.at, count.of);
      say.textContent = lineFor(id, on.x);
    }
    sheet.classList.toggle("is-calm", calm());
    sheet.classList.remove("is-down");
    if (sheet.hidden) {
      sheet.hidden = false;
      sheet.classList.add("is-up");
    }
    // The seal breaks again for the next one.
    sheet.classList.remove("is-go");
    void sheet.offsetWidth;
    sheet.classList.add("is-go");
    feel.reveal?.(on.many ? false : on.x.part === "secret");
  }

  function next() {
    if (on?.many) q.splice(0, q.length, ...q.filter((y) => !on.many.includes(y)));
    else if (on) q.splice(q.indexOf(on), 1);
    on = null;
    show();
  }

  function close() {
    on = null;
    Object.assign(count, { at: 0, of: 0 });
    if (!sheet || sheet.hidden) return;
    if (calm()) {
      sheet.hidden = true;
      return;
    }
    sheet.classList.add("is-down");
    gone = setTimeout(() => {
      sheet.hidden = true;
      sheet.classList.remove("is-down", "is-up", "is-go");
    }, 200);
  }

  function tap(e) {
    const el = e.target.closest("[data-zr]");
    if (!el) return;
    if (el.dataset.zr === "ok") return next();
    if (el.dataset.zr === "all") {
      q.length = 0;
      return close();
    }
    if (el.dataset.zr === "page") {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const href = el.getAttribute("href");
      q.length = 0;
      close();
      d.go?.(href);
    }
  }

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet && !sheet.hidden) {
      q.length = 0;
      close();
    }
  });

  return {
    // A player's phone has just taken a new world: was and now are the board
    // before and after, as forPlayer() made them.
    news: (id, was, now) => {
      const turn = new Set((document.querySelector("#app [data-ftf]")?.dataset.ftf ?? "").split(" ").filter(Boolean));
      const got = revealsOf(was, now).filter((x) => !(x.part === "card" && turn.has(x.f)));
      if (!got.length) return;
      q.push(...got.map((x) => ({ id, x })));
      if (!on) show();
      else if (!on.many) {
        count.of = count.at + q.filter((y) => y.id === on.id).length - 1;
        drawOne(on, count.at, count.of);
      }
    },
    // Its taps are its own (the sheet sits outside the app, so a redraw never
    // takes it away).
    ACT: {},
    after: () => mount(),
  };
}
