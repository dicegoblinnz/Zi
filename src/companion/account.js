// The account page (/account/): signing in with Google or Discord, joining
// from an invite link (/account/?invite=<code>), moving this phone's characters
// into the account with one tap, invites for Mo and the GMs he picks, who's a
// GM, your data, and signing out. The server decides who can do what
// (src/worker/index.js), and this only draws it.
import { openStore } from "./store.js";
import { makeSync } from "./sync.js";

const box = document.getElementById("acct");
const toastBox = document.getElementById("cc-toast");
const store = openStore();
const sync = makeSync(store, { onChange: () => draw() });
const params = new URLSearchParams(location.search);
const invite = /^[A-Za-z0-9_-]{16,64}$/.test(params.get("invite") || "") ? params.get("invite") : "";
const NAMES = { google: "Google", discord: "Discord" };
const st = { state: "loading", me: null, providers: [], invites: null, people: null, made: null, sure: "", busy: "", note: "" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const day = (ms) => new Date(ms).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
const linkOf = (code) => `${location.origin}/account/?invite=${code}`;
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
    out: invite ? "You’ve been invited. Pick how you’d like to sign in, and use the same way next time." : "Sign in to keep your characters in your account, on every phone you use. Accounts are invite-only for now, so if you’re new, open the invite link you were sent.",
    in: me ? `Signed in as <b>${esc(me.name)}</b>${me.email ? ` (${esc(me.email)})` : ""}.` : "",
  }[st.state];
  let html = `<header class="cc-intro"><p class="kicker">Your characters, everywhere</p><h1>${st.state === "out" && invite ? "Join Zi’Dara" : "Account"}</h1><p class="lede">${lede}</p></header>`;
  if (st.note) html += `<div class="cc-note is-warn" role="alert"><p>${esc(st.note)}</p></div>`;
  if (st.state === "out") html += outView();
  else if (st.state === "in") html += inView();
  else if (st.state !== "loading") html += '<div class="cc-row"><a class="button primary" href="/characters/">Characters</a></div>';
  const focus = document.activeElement?.closest?.("#acct") ? document.activeElement.dataset.act : null;
  box.innerHTML = html;
  if (focus) box.querySelector(`[data-act="${focus}"]:not([disabled])`)?.focus();
}

function outView() {
  const verb = invite ? "Join" : "Sign in";
  let html = "";
  if (params.has("gone")) html += '<div class="cc-note" role="status"><p>Your account’s gone, along with everything it held.</p></div>';
  else if (params.has("error") && !st.note) html += '<div class="cc-note is-warn" role="alert"><p>That didn’t sign you in. If you’ve signed in before, use the same way you did then. If you’re new, you’ll need an invite link from Mo or your GM.</p></div>';
  if (sync.me) html += '<div class="cc-note" role="status"><p>You’ve been signed out on this phone. Your characters are still here, and they’ll catch up with your account when you sign in again.</p></div>';
  html += `<div class="cc-row">${st.providers.map((p) => `<button type="button" class="button primary" data-act="in" data-p="${esc(p)}"${busy(`in-${p}`)}>${verb} with ${esc(NAMES[p] || p)}</button>`).join("")}</div>`;
  html += '<p class="cc-lead">An account keeps your name, your email and your characters, and nothing else. Once you’re in, you can download it all or delete it from here.</p>';
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
  if (me.role === "admin" || me.role === "gm") html += invitesView();
  if (me.role === "admin") html += peopleView();
  html += `<section class="cc-sec" aria-labelledby="ac-you"><h2 id="ac-you">Your account</h2>
    <div class="cc-row"><button type="button" class="button" data-act="out"${busy("out")}>Sign out</button></div>
    <p class="cc-lead">Download everything your account holds, or delete it and its characters for good.</p>
    <div class="cc-row"><a class="button" href="/api/me/data" download>Download my data</a><button type="button" class="button danger" data-act="delete"${busy("delete")}>${st.sure === "delete" ? "Tap again to delete it all for good" : "Delete my account"}</button></div></section>`;
  return html;
}

function invitesView() {
  const now = Date.now();
  const row = (i) => {
    const live = i.used < i.uses && i.expiresAt > now;
    const status = i.used >= i.uses ? (i.uses === 1 ? "Used" : `All ${i.uses} used`) : i.expiresAt <= now ? "Run out" : `${i.uses > 1 ? `${i.used} of ${i.uses} used, ` : "Waiting, "}until ${day(i.expiresAt)}`;
    const from = st.me.role === "admin" && i.by && i.by !== st.me.name ? ` · from ${esc(i.by)}` : "";
    return `<li class="card ac-item"><span class="ac-text"><b>${esc(i.note || "An invite")}</b><small>${esc(status)}${from}</small></span>
      ${live ? `<span class="cc-row"><button type="button" class="button sm" data-act="copy" data-code="${esc(i.code)}">Copy link</button><button type="button" class="button sm" data-act="cancel" data-code="${esc(i.code)}">Cancel</button></span>` : ""}</li>`;
  };
  const made = st.made ? `<div class="cc-note" role="status"><p>Here’s the link${st.made.note ? ` for <b>${esc(st.made.note)}</b>` : ""}. Send it however you like. It makes one account and runs out on ${day(st.made.expiresAt)}.</p>
    <label class="cc-field" for="ac-link">The invite link</label><input id="ac-link" class="ac-link" readonly value="${esc(linkOf(st.made.code))}">
    <div class="cc-row"><button type="button" class="button" data-act="copy" data-code="${esc(st.made.code)}">Copy link</button>${navigator.share ? `<button type="button" class="button" data-act="share" data-code="${esc(st.made.code)}">Share</button>` : ""}</div></div>` : "";
  return `<section class="cc-sec" aria-labelledby="ac-invites"><h2 id="ac-invites">Invites</h2>
    <p class="cc-lead">Make a link for each new player. It makes one account and runs out after two weeks.</p>
    <form class="ac-make" data-form="invite"><label class="cc-field" for="ac-note">Who’s it for?</label>
      <div class="cc-row"><input id="ac-note" name="note" maxlength="60" autocomplete="off"><button type="submit" class="button primary"${busy("invite")}>Make an invite link</button></div></form>
    ${made}
    ${st.invites?.length ? `<ul class="cc-mine">${st.invites.map(row).join("")}</ul>` : st.invites ? '<p class="cc-lead">No invites yet.</p>' : ""}</section>`;
}

function peopleView() {
  const row = (p) => `<li class="card ac-item"><span class="ac-text"><b>${esc(p.name)}</b><small>${esc(p.email)}${p.role === "admin" ? " · that’s you" : p.role === "gm" ? " · GM" : ""}${p.invitedBy ? ` · invited by ${esc(p.invitedBy)}` : ""}</small></span>
    ${p.role === "admin" ? "" : `<button type="button" class="button sm" data-act="role" data-id="${esc(p.id)}" data-role="${p.role === "gm" ? "member" : "gm"}">${p.role === "gm" ? "No longer a GM" : "Make a GM"}</button>`}</li>`;
  return `<section class="cc-sec" aria-labelledby="ac-people"><h2 id="ac-people">People</h2>
    <p class="cc-lead">Everyone with an account. A GM can hand out invites too.</p>
    ${st.people ? `<ul class="cc-mine">${st.people.map(row).join("")}</ul>` : ""}</section>`;
}

// ---------------------------------------------------------------- doing

async function signIn(provider) {
  st.busy = `in-${provider}`;
  st.note = "";
  draw();
  try {
    if (invite) {
      const res = await send("POST", "/api/invite", { code: invite });
      if (!res.ok) throw new Error((await answer(res)).error || "");
    }
    const back = invite ? `/account/?invite=${invite}` : "/account/";
    const res = await send("POST", "/api/auth/sign-in/social", { provider, callbackURL: "/account/", errorCallbackURL: back });
    const got = await answer(res);
    if (!res.ok || !got.url) throw new Error("");
    location.assign(got.url);
  } catch (err) {
    st.busy = "";
    st.note = err.message || "That didn’t work. Try again in a minute.";
    draw();
  }
}

async function load(key, path) {
  const res = await send("GET", path).catch(() => null);
  if (res?.ok) st[key] = (await answer(res))[key] || [];
  draw();
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
  async copy(el) {
    const code = el.dataset.code;
    try {
      await navigator.clipboard.writeText(linkOf(code));
      toast("Link copied. Send it to them however you like.");
    } catch {
      st.made = st.invites?.find((i) => i.code === code) ?? st.made;
      draw();
      box.querySelector(".ac-link")?.select();
    }
  },
  share: (el) => navigator.share({ title: "Join Zi’Dara", url: linkOf(el.dataset.code) }).catch(() => {}),
  async cancel(el) {
    const code = el.dataset.code;
    const res = await send("DELETE", `/api/invites/${encodeURIComponent(code)}`).catch(() => null);
    if (!res?.ok) return toast("That didn’t cancel it. Try again in a minute.");
    st.invites = (st.invites || []).filter((i) => i.code !== code);
    if (st.made?.code === code) st.made = null;
    draw();
    toast("That invite won’t work any more.");
  },
  async role(el) {
    const p = st.people?.find((x) => x.id === el.dataset.id);
    const res = p && (await send("POST", `/api/people/${encodeURIComponent(p.id)}`, { role: el.dataset.role }).catch(() => null));
    if (!res?.ok) return toast("That didn’t change. Try again in a minute.");
    p.role = el.dataset.role;
    draw();
    toast(p.role === "gm" ? `${p.name} can hand out invites now.` : `${p.name} can’t hand out invites any more.`);
  },
};

box.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (el && act[el.dataset.act] && !el.disabled) act[el.dataset.act](el);
});
box.addEventListener("submit", async (e) => {
  if (e.target.dataset.form !== "invite") return;
  e.preventDefault();
  st.busy = "invite";
  st.note = "";
  const note = e.target.note.value;
  draw();
  const res = await send("POST", "/api/invites", { note }).catch(() => null);
  const got = res ? await answer(res) : {};
  st.busy = "";
  if (res?.ok) {
    st.made = got.invite;
    st.invites = [got.invite, ...(st.invites || [])];
  } else st.note = got.error || "That didn’t make an invite. Try again in a minute.";
  draw();
  box.querySelector(".ac-link")?.select();
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
  if (st.me.role === "admin" || st.me.role === "gm") load("invites", "/api/invites");
  if (st.me.role === "admin") load("people", "/api/people");
}
start();
