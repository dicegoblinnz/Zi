// The account page (/account/): signing in with Google or Discord, moving this
// phone's characters into the account with one tap, where campaigns are, who's
// signed up (for Mo), your data, and signing out. Anyone can sign up, and
// signing in the first time makes the account. The server decides who can do
// what (src/worker/index.js), and this only draws it.
import { openStore } from "./store.js";
import { makeSync } from "./sync.js";

const box = document.getElementById("acct");
const toastBox = document.getElementById("cc-toast");
const store = openStore();
const sync = makeSync(store, { onChange: () => draw() });
const params = new URLSearchParams(location.search);
const NAMES = { google: "Google", discord: "Discord" };
const st = { state: "loading", me: null, providers: [], people: null, total: 0, sure: "", busy: "", note: "" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const day = (ms) => new Date(ms).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
const busy = (what) => (st.busy ? ` disabled${st.busy === what ? ' aria-busy="true"' : ""}` : "");
const send = (method, path, body) => fetch(path, { method, cache: "no-store", credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
const answer = (res) => res.json().catch(() => ({}));

let toastTimer = 0;
function toast(text) {
  toastBox.innerHTML = `<p>${esc(text)}</p>`;
  toastBox.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 4000);
}

// ---------------------------------------------------------------- drawing

function draw() {
  const me = st.me;
  const lede = {
    loading: "Checking whether you’re signed in…",
    offline: "You’re offline. Signing in needs a signal, but your characters are on this phone, so carry on with those.",
    off: "Sign-in isn’t switched on yet. Your characters are saved on this phone in the meantime.",
    broken: "The site didn’t answer. Try again in a minute.",
    out: "Sign in to keep your characters in your account, on every phone you use, and to start a campaign or join one. First time here? Signing in makes your account.",
    in: me ? `Signed in as <b>${esc(me.name)}</b>${me.email ? ` (${esc(me.email)})` : ""}.` : "",
  }[st.state];
  let html = `<header class="cc-intro"><p class="kicker">Your characters, everywhere</p><h1>Account</h1><p class="lede">${lede}</p></header>`;
  if (st.note) html += `<div class="cc-note is-warn" role="alert"><p>${esc(st.note)}</p></div>`;
  if (st.state === "out") html += outView();
  else if (st.state === "in") html += inView();
  else if (st.state !== "loading") html += '<div class="cc-row"><a class="button primary" href="/characters/">Characters</a></div>';
  const focus = document.activeElement?.closest?.("#acct") ? document.activeElement.dataset.act : null;
  box.innerHTML = html;
  if (focus) box.querySelector(`[data-act="${focus}"]:not([disabled])`)?.focus();
}

// Why a sign-in came back, in plain words, with what the site said on the end
// so a player can tell Mo.
const WHY = {
  state_mismatch: "That sign-in went stale. Start it again from this page.",
  please_restart_the_process: "That sign-in went stale. Start it again from this page.",
  access_denied: "Signing in was cancelled.",
};
const why = (code) => `${WHY[code] || "That didn’t sign you in. Try again, and if you’ve signed in before, use the same way you did then."} <small>(It said ${esc(code || "nothing")}.)</small>`;

function outView() {
  let html = "";
  if (params.has("gone")) html += '<div class="cc-note" role="status"><p>Your account’s gone, along with everything it held.</p></div>';
  else if (params.has("error") && !st.note) html += `<div class="cc-note is-warn" role="alert"><p>${why(params.get("error"))}</p></div>`;
  if (sync.me) html += '<div class="cc-note" role="status"><p>You’ve been signed out on this phone. Your characters are still here, and they’ll catch up with your account when you sign in again.</p></div>';
  html += `<div class="cc-row">${st.providers.map((p) => `<button type="button" class="button primary" data-act="in" data-p="${esc(p)}"${busy(`in-${p}`)}>Sign in with ${esc(NAMES[p] || p)}</button>`).join("")}</div>`;
  html += '<p class="cc-lead">An account keeps your name, your email, your characters and the campaigns you’re in, and nothing else. Once you’re in, you can download it all or delete it from here.</p>';
  return html;
}

function inView() {
  const me = st.me;
  const loose = sync.loose();
  const kept = store.data.characters.filter((c) => c.acct === me.id).length;
  let html = `<section class="cc-sec" aria-labelledby="ac-chars"><h2 id="ac-chars">Your characters</h2>
    <p class="cc-lead">${kept ? `${kept === 1 ? "One character is" : `${kept} characters are`} in your account, so ${kept === 1 ? "they’re" : "they’re all"} on every phone you sign in on.` : "Nothing’s in your account yet. Anything you build or pick from the crew while you’re signed in goes straight in."}</p>`;
  if (loose.length) {
    const n = loose.length;
    html += `<div class="cc-note" role="status"><p>${n === 1 ? "This one is" : `These ${n} are`} only on this phone: ${loose.map((c) => esc(c.name)).join(", ")}.</p>
      <div class="cc-row"><button type="button" class="button primary" data-act="move"${busy("move")}>Move ${n === 1 ? esc(loose[0].name) : `all ${n}`} into your account</button></div></div>`;
  }
  html += `<div class="cc-row"><a class="button${loose.length ? "" : " primary"}" href="/characters/">Characters</a></div></section>`;
  html += `<section class="cc-sec" aria-labelledby="ac-camps"><h2 id="ac-camps">Campaigns</h2>
    <p class="cc-lead">Start a campaign and you’re its GM, or open the join link your GM sent you. They’re on the Characters page, with your characters.</p>
    <div class="cc-row"><a class="button" href="/characters/#cc-camps">Your campaigns</a></div></section>`;
  if (me.role === "admin") html += peopleView();
  html += `<section class="cc-sec" aria-labelledby="ac-you"><h2 id="ac-you">Your account</h2>
    <div class="cc-row"><button type="button" class="button" data-act="out"${busy("out")}>Sign out</button></div>
    <p class="cc-lead">Download everything your account holds, or delete it and its characters for good. Deleting it takes you out of every campaign you’re in and ends the ones you run.</p>
    <div class="cc-row"><a class="button" href="/api/me/data" download>Download my data</a><button type="button" class="button danger" data-act="delete"${busy("delete")}>${st.sure === "delete" ? "Tap again to delete it all for good" : "Delete my account"}</button></div></section>`;
  return html;
}

// Who's signed up, newest first. Only Mo sees this.
function peopleView() {
  const row = (p) => `<li class="card ac-item"><span class="ac-text"><b>${esc(p.name)}</b><small>${esc(p.email)} · ${p.role === "admin" ? "that’s you" : `since ${esc(day(p.createdAt))}`}</small></span></li>`;
  const more = st.people && st.total > st.people.length ? `<p class="cc-lead">And ${st.total - st.people.length} more before them.</p>` : "";
  return `<section class="cc-sec" aria-labelledby="ac-people"><h2 id="ac-people">People</h2>
    <p class="cc-lead">${st.people ? `Everyone who’s signed up, newest first. That’s ${st.total} ${st.total === 1 ? "person" : "people"} so far.` : "Everyone who’s signed up, newest first."}</p>
    ${st.people ? `<ul class="cc-mine">${st.people.map(row).join("")}</ul>${more}` : ""}</section>`;
}

// ---------------------------------------------------------------- doing

async function signIn(provider) {
  st.busy = `in-${provider}`;
  st.note = "";
  draw();
  try {
    const res = await send("POST", "/api/auth/sign-in/social", { provider, callbackURL: "/account/", errorCallbackURL: "/account/" });
    const got = await answer(res);
    if (!res.ok || !got.url) throw new Error("");
    location.assign(got.url);
  } catch (err) {
    st.busy = "";
    st.note = err.message || "That didn’t work. Try again in a minute.";
    draw();
  }
}

const act = {
  in: (el) => signIn(el.dataset.p),
  async move() {
    st.busy = "move";
    draw();
    const n = await sync.moveIn().catch(() => 0);
    st.busy = "";
    draw();
    toast(sync.unsent() ? "They’re in your account, and they’ll finish going up when there’s a signal." : `${n === 1 ? "It’s" : `All ${n} are`} in your account now.`);
  },
  async out() {
    st.busy = "out";
    st.note = "";
    draw();
    try {
      await sync.signOut();
      location.assign("/account/");
    } catch (err) {
      st.busy = "";
      st.note = err.message === "unsent" ? "Some changes haven’t reached your account yet, so you’re still signed in. Try again when there’s a better signal." : "That didn’t sign you out. Try again in a minute.";
      draw();
    }
  },
  async delete() {
    if (st.sure !== "delete") {
      st.sure = "delete";
      return draw();
    }
    st.sure = "";
    st.busy = "delete";
    draw();
    const res = await send("POST", "/api/auth/delete-user", {}).catch(() => null);
    if (res?.ok) {
      sync.forget();
      location.assign("/account/?gone");
      return;
    }
    const got = res ? await answer(res) : {};
    st.busy = "";
    st.note = got.code === "SESSION_EXPIRED" ? "Deleting needs a fresh sign-in. Sign out, sign back in, and delete it straight after." : "That didn’t delete your account. Try again in a minute.";
    draw();
  },
};

box.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (el && act[el.dataset.act] && !el.disabled) act[el.dataset.act](el);
});

// ---------------------------------------------------------------- start

async function start() {
  if (navigator.onLine === false) {
    st.state = "offline";
    return draw();
  }
  try {
    const res = await send("GET", "/api/me");
    const got = res.ok ? await answer(res) : null;
    if (res.status === 503 || (got && !got.user && !got.providers?.length)) st.state = "off";
    else if (!got) st.state = "broken";
    else {
      st.me = got.user;
      st.providers = got.providers || [];
      st.state = got.user ? "in" : "out";
    }
  } catch {
    st.state = "offline";
  }
  if (st.state === "out") sync.signedOutHere();
  draw();
  if (st.state !== "in") return;
  sync.signedIn(st.me).then(draw);
  if (st.me.role === "admin") {
    const res = await send("GET", "/api/people").catch(() => null);
    const got = res?.ok ? await answer(res) : null;
    if (got) {
      st.people = got.people || [];
      st.total = got.total ?? st.people.length;
    }
    draw();
  }
}
start();
