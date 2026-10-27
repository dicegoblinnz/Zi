// Campaigns (27 Oct 2026). Anyone signed in starts one and is its GM, and
// players join with its link, each bringing one of their own characters, a
// different one in each campaign if they like. A campaign is its own group:
// the server checks every request against the campaign it's for
// (src/worker/index.js), and this only draws what it's given.
//
//   /characters/?camp=<id>              a campaign: the party and its join link
//                                       for its GM, who's in it for a player
//   /characters/?camp=<id>&look=<who>   the GM looking at a player's character
//   /characters/?join                   joining from a link (/join/#<code>)
//
// What the phone last saw of each campaign stays on it (zi-campaigns), so a GM
// still has her party with no signal. Starting and joining need one. A join
// link's code waits in zi-join while you sign in or make a character.
import { printSheet } from "./print.js";
import { lookView, trackLine } from "./look.js";

const KEEP = "zi-campaigns";
const JOIN = "zi-join";
const HOURS = 3600000;
const POLL = 20000;

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const online = () => navigator.onLine !== false;
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "them";
const players = (n) => (n === 1 ? "1 player" : n ? `${n} players` : "nobody’s joined yet");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const byName = (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.id.localeCompare(b.id);
const time = (ms) => new Date(ms).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
// A join link's code comes in after the # (/join/ sends it on), and waits two
// hours at most, for someone signing in or making a character on the way. A
// phone that won't keep anything still has it while the page is open.
const CODE = /^[A-Za-z0-9_-]{16,64}$/;
let held = null;
function takeLink() {
  let code = "";
  try {
    code = decodeURIComponent(location.hash.slice(1));
  } catch {}
  if (!CODE.test(code)) return;
  held = { code, at: Date.now() };
  write(JOIN, held);
  history.replaceState(history.state, "", location.pathname + location.search);
}
const waiting = () => {
  const j = read(JOIN) ?? held;
  return j && typeof j.code === "string" && CODE.test(j.code) && Date.now() - (j.at || 0) < 2 * HOURS ? j : null;
};

export function makeCampaigns(d) {
  const { esc, sync, store, ICON } = d;
  // why: a campaign that wouldn't open, "gone" (you're not in it) or "net".
  const st = { list: null, at: 0, camps: {}, why: {}, join: null, busy: "", sure: "", note: "", picking: null, switching: false, printing: false, qr: null, user: null };
  let view = { name: "" };
  let timer = 0;

  // ------------------------------------------------------------ kept on the phone

  function load() {
    const me = sync.me?.id ?? null;
    if (st.user === me) return;
    st.user = me;
    const kept = read(KEEP);
    const ok = kept && me && kept.user === me;
    st.list = ok ? kept.list : null;
    st.at = ok ? kept.at : 0;
    st.camps = ok && kept.camps ? kept.camps : {};
  }
  const keep = () => {
    if (st.user) write(KEEP, { user: st.user, list: st.list, at: st.at, camps: st.camps });
  };

  async function call(method, path, body) {
    const res = await fetch(path, { method, cache: "no-store", credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, got: await res.json().catch(() => ({})) };
  }
  const tryCall = (method, path, body) => call(method, path, body).catch(() => ({ ok: false, status: 0, got: {} }));

  async function refreshList() {
    load();
    if (!sync.me || sync.out || !online()) return;
    const r = await tryCall("GET", "/api/campaigns");
    if (r.status === 401) return signedOut();
    if (!r.ok) return;
    st.list = r.got.campaigns || [];
    st.at = Date.now();
    for (const id of Object.keys(st.camps)) if (!st.list.some((k) => k.id === id)) delete st.camps[id];
    d.party.keepOnly(st.list.map((k) => k.id));
    d.table.keepOnly(st.list.map((k) => k.id));
    d.world.keepOnly(st.list.map((k) => k.id));
    keep();
    d.render();
  }

  // One campaign, if it's changed since the phone last looked.
  async function refresh(id) {
    load();
    if (!sync.me || !online()) return;
    const have = st.camps[id];
    const r = await tryCall("GET", `/api/campaigns/${encodeURIComponent(id)}${have?.v ? `?v=${encodeURIComponent(have.v)}` : ""}`);
    if (r.ok && r.got.same && have) {
      have.at = Date.now();
      keep();
      return;
    }
    if (r.status === 401) return signedOut();
    if (r.ok && r.got.campaign) {
      st.camps[id] = { ...r.got, at: Date.now() };
      delete st.why[id];
      const item = st.list?.find((k) => k.id === id);
      if (item) {
        item.name = r.got.campaign.name;
        item.players = r.got.players.length;
        st.list.sort(byName);
      }
      keep();
      return quietRender();
    }
    if (r.status === 404) return gone(id);
    if (!have && !st.why[id]) {
      st.why[id] = "net";
      d.render();
    }
  }

  // A campaign this phone's player isn't in any more goes from the phone,
  // its party sheet too, and the page says so.
  function gone(id) {
    load();
    delete st.camps[id];
    if (st.list) st.list = st.list.filter((k) => k.id !== id);
    st.why[id] = "gone";
    keep();
    d.party.drop(id);
    d.table.drop(id);
    d.world.drop(id);
    d.render();
  }

  // The session's run out: the phone says so, like it does for characters.
  function signedOut() {
    sync.signedOutHere();
    d.render();
  }
  // A change that comes in while someone's typing (renaming the campaign, say)
  // waits for the next redraw, so it doesn't take their words away.
  const quietRender = () => {
    if (!document.activeElement?.matches?.("#app input:not([type=radio]), #app textarea")) d.render();
  };

  // While a campaign's open and the phone's looking at it, it checks for
  // changes now and then, so a GM sees her party's trackers move.
  function poll() {
    clearInterval(timer);
    timer = 0;
    if (view.name !== "camp" && view.name !== "look") return;
    refresh(view.id);
    timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh(view.id);
    }, POLL);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (view.name === "camp" || view.name === "look") refresh(view.id);
    else if (view.name === "list") refreshList();
  });
  addEventListener("online", () => (view.name === "join" ? check() : view.name === "list" ? refreshList() : poll()));

  // ------------------------------------------------------------ the list

  const metaOf = (k) => (k.role === "gm" ? `You’re the GM · ${players(k.players)}` : `${k.character ? `Playing ${esc(k.character.name)}` : "No character here yet"} · run by ${esc(k.gm)}`);
  const initial = (name) => esc(Array.from(String(name || "?").trim())[0] || "?");

  function section() {
    load();
    if (!sync.me || sync.out) return "";
    const list = st.list || [];
    const card = (k) => `<li><a class="card cc-saved cc-camp" href="/characters/?camp=${encodeURIComponent(k.id)}" data-act="k" data-do="open" data-id="${esc(k.id)}">
      <span class="die${k.role === "gm" ? " is-gm" : ""}" aria-hidden="true">${initial(k.name)}</span>
      <span class="cc-saved-text"><b>${esc(k.name)}</b><small>${metaOf(k)}</small></span></a></li>`;
    const lead = st.list == null ? `<p class="cc-lead">${online() ? "Checking for your campaigns…" : "Your campaigns show up here when you’ve got a signal."}</p>`
      : list.length ? "" : '<p class="cc-lead">Start one and you’re its GM. Your players join with its link, each bringing one of their characters, and you see every character in it. Got a link from your GM? Open it and you can join.</p>';
    const stale = !online() && st.list ? `<p class="cc-small">No signal, so these are as they were at ${time(st.at)}.</p>` : "";
    return `<section class="cc-sec" id="cc-camps" aria-labelledby="cc-camps-h"><h2 id="cc-camps-h">Campaigns</h2>
      ${list.length ? `<ul class="cc-mine">${list.map(card).join("")}</ul>` : ""}${lead}${stale}
      <div class="cc-row"><button type="button" class="button" data-act="k" data-do="start">Start a campaign</button></div></section>`;
  }

  // ------------------------------------------------------------ a campaign

  const topbar = (href, label) => `<div class="cc-topbar"><a class="cc-back" href="${esc(href)}" data-act="k" data-do="back">${ICON.back}${esc(label)}</a><div class="cc-tools">${d.tools()}</div></div>`;

  // Every campaign you're in, a tap apart, each by its full name.
  function strip(id) {
    const list = st.list || [];
    if (list.length < 2) return "";
    return `<nav class="cc-strip" aria-label="Your campaigns"><div class="cc-strip-in">${list.map((k) => `<a class="cc-strip-a${k.role === "gm" ? " is-gm" : ""}" href="/characters/?camp=${encodeURIComponent(k.id)}" data-act="k" data-do="switch" data-id="${esc(k.id)}"${k.id === id ? ' aria-current="page"' : ""}><span>${esc(k.name)}</span>${k.role === "gm" ? "<small>GM</small>" : ""}</a>`).join("")}</div></nav>`;
  }

  const linkOf = (code) => `${location.origin}/join/#${code}`;
  const sure = (key, yes, no) => (st.sure === key ? yes : no);
  const off = (what) => (st.busy ? ` disabled${st.busy === what ? ' aria-busy="true"' : ""}` : "");
  const warn = () => (st.note ? `<div class="cc-note is-warn" role="alert"><p>${esc(st.note)}</p></div>` : "");

  function campView(id) {
    load();
    const k = st.camps[id];
    const item = st.list?.find((x) => x.id === id);
    if (!k) {
      const why = !sync.me ? 'Sign in to see your campaigns. <a href="/account/">Sign in</a>'
        : st.why[id] === "gone" ? "You’re not in that campaign any more. Your GM might’ve ended it or taken you out of it."
        : !online() ? "No signal, and this phone hasn’t opened this campaign before. Open it again when you’ve got a signal."
        : st.why[id] === "net" ? "That didn’t open. Check your signal and try again." : "";
      return `${topbar("/characters/", "Characters")}<header class="cc-camp-head"><p class="kicker">Campaign</p><h1>${esc(item?.name ?? "A campaign")}</h1>
        ${why ? "" : '<p class="lede">Opening it…</p>'}</header>${why ? `<div class="cc-note is-warn"><p>${why}</p></div>` : ""}`;
    }
    const c = k.campaign;
    const gm = c.role === "gm";
    const party = k.players;
    const mine = gm ? null : party.find((p) => p.id === sync.me?.id);
    const myChar = mine?.character ?? null;
    const kicker = gm ? "You’re the GM" : myChar ? `Playing ${esc(myChar.name)}` : "No character here yet";
    const stale = !online() ? `<p class="cc-small">No signal, so this is how it was at ${time(k.at)}.</p>` : "";
    const head = `${topbar("/characters/", "Characters")}${strip(id)}
      <header class="cc-camp-head"><p class="kicker${gm ? " is-gm" : ""}">${kicker}</p><h1>${esc(c.name)}</h1>
        <p class="cc-small">${gm ? cap(players(party.length)) : `Run by ${esc(c.gm)} · ${players(party.length)}`}</p></header>${warn()}${stale}`;
    if (gm) {
      const bring = bringView(c);
      const partyHtml = `<section class="cc-sec" aria-labelledby="k-party"><h2 id="k-party">The party</h2>
        ${party.length ? `<ul class="cc-mine cc-party">${party.map((p) => memberCard(c, p)).join("")}</ul>` : '<p class="cc-lead">Nobody’s joined yet. When they do, their characters show up here, and you can open each one’s sheet.</p>'}</section>`;
      const sheet = d.party.sheet(id);
      // The round's telegraphs come first, since they're what she taps most in a fight.
      return `${head}${d.table.section(id)}${d.world.tile(id)}${party.length ? partyHtml + sheet + bring : bring + partyHtml + sheet}${thisView(c)}`;
    }
    return `${head}${d.table.pointer(id)}${youView(c, myChar)}${d.world.tile(id)}${d.party.sheet(id)}
      <section class="cc-sec" aria-labelledby="k-party"><h2 id="k-party">Who’s in it</h2>
        <ul class="cc-mine cc-names"><li class="card cc-name"><b>${esc(c.gm)}</b><small>the GM</small></li>${party.map((p) => `<li class="card cc-name"><b>${p.character ? esc(p.character.name) : "No character yet"}</b><small>${p.id === sync.me?.id ? "you" : esc(p.name)}</small></li>`).join("")}</ul></section>
      <section class="cc-sec" aria-labelledby="k-leave"><h2 id="k-leave">Leaving</h2>
        <p class="cc-lead">Leave and you’re out of ${esc(c.name)}. ${myChar ? `${esc(myChar.name)} stays yours.` : ""}</p>
        <div class="cc-row"><button type="button" class="button danger" data-act="k" data-do="leave"${off("leave")}>${sure("leave", "Tap again to leave", `Leave ${esc(c.name)}`)}</button></div></section>`;
  }

  // The join link, to send or to show at the table, and a way to stop it working.
  function bringView(c) {
    const share = typeof navigator.share === "function";
    return `<section class="cc-sec cc-bring" aria-labelledby="k-bring"><h2 id="k-bring">Bring your players in</h2>
      <p class="cc-lead">Anyone with this link can join ${esc(c.name)} with one of their characters. Send it to your group chat, or show the code at the table and they scan it with their phone.</p>
      <label class="cc-field" for="k-link">The join link</label><input id="k-link" class="ac-link" readonly value="${esc(linkOf(c.code))}">
      <div class="cc-row">${share ? '<button type="button" class="button primary" data-act="k" data-do="share">Share the link</button>' : ""}<button type="button" class="button${share ? "" : " primary"}" data-act="k" data-do="copy">Copy the link</button><button type="button" class="button" data-act="k" data-do="qr">Show the code</button></div>
      <p class="cc-lead">Link getting around? Reset it and the old one stops working. Everyone who’s joined stays in.</p>
      <div class="cc-row"><button type="button" class="button" data-act="k" data-do="reset"${off("reset")}>${sure("reset", "Tap again to reset it", "Reset the link")}</button></div></section>`;
  }

  // A player's card for the GM: their character and how they're doing, which
  // opens their sheet.
  function memberCard(c, p) {
    try {
      return card(c, p);
    } catch {
      // A sheet this phone can't read still leaves the GM a way to take them out.
      return `<li class="cc-member"><div class="card cc-saved"><span class="die ghost" aria-hidden="true">?</span><span class="cc-saved-text"><b>${esc(p.name)}</b><small>Their character’s sheet couldn’t be read here</small></span></div>${removeButton(p)}</li>`;
    }
  }
  function card(c, p) {
    const ch = p.character ? structuredClone(p.character) : null;
    const sheet = ch ? d.normal(ch) : null;
    if (!ch || !sheet) {
      return `<li class="cc-member"><div class="card cc-saved"><span class="die ghost" aria-hidden="true">?</span><span class="cc-saved-text"><b>${esc(p.name)}</b><small>${ch ? `${esc(ch.name)}’s sheet isn’t in the rules any more` : "Hasn’t got a character here right now"}</small></span></div>${removeButton(p)}</li>`;
    }
    const s = ch.state;
    return `<li class="cc-member"><a class="card cc-saved cc-look-card${s.dead ? " is-dead" : ""}" href="/characters/?camp=${encodeURIComponent(c.id)}&amp;look=${encodeURIComponent(p.id)}" data-act="k" data-do="look" data-id="${esc(p.id)}">
      <span class="cc-mini-crest" aria-hidden="true">${d.crestOf(sheet)}</span>
      <span class="cc-saved-text"><b>${esc(ch.name)}</b><small>${esc(p.name)}${sheet.title ? ` · <em>${esc(sheet.title)}</em>` : ""}${s.dead ? " · died in play" : ""}</small>${trackLine(sheet, s, esc)}</span></a></li>`;
  }
  // Taking a player out, which asks for a second tap. It's on their character's
  // page, so the party's a list of cards with nothing to tap by mistake.
  const removeButton = (p, cls = "button sm cc-remove") => `<button type="button" class="${cls}" data-act="k" data-do="remove" data-id="${esc(p.id)}"${off(`remove-${p.id}`)}>${sure(`remove-${p.id}`, `Tap again to take ${esc(first(p.name))} out`, `Take ${esc(first(p.name))} out`)}</button>`;

  // The GM's own: its name, and ending it.
  function thisView(c) {
    return `<section class="cc-sec" aria-labelledby="k-this"><h2 id="k-this">This campaign</h2>
      <form class="ac-make" data-form="k-rename"><label class="cc-field" for="k-name-now">Its name</label>
        <div class="cc-row"><input id="k-name-now" name="name" maxlength="40" autocomplete="off" required value="${esc(c.name)}"><button type="submit" class="button"${off("rename")}>Rename it</button></div></form>
      <p class="cc-lead">Ending it takes everyone out. Their characters are their own, so they keep them.</p>
      <div class="cc-row"><button type="button" class="button danger" data-act="k" data-do="end"${off("end")}>${sure("end", "Tap again to end it for everyone", `End ${esc(c.name)}`)}</button></div></section>`;
  }

  // A player's own part: who they're playing here, and bringing someone else.
  function youView(c, myChar) {
    const here = myChar ? store.data.characters.find((x) => x.id === myChar.id) : null;
    const picking = st.switching || !myChar;
    return `<section class="cc-sec" aria-labelledby="k-you"><h2 id="k-you">${picking ? "Who are you bringing?" : "You"}</h2>
      ${myChar && !picking ? `<p class="cc-lead">You’re playing ${esc(myChar.name)} here, and ${esc(c.gm)} sees ${{ her: "her", him: "his" }[here && d.sheetFor(here)?.pronoun] ?? "their"} sheet as you play.</p>
        <div class="cc-row">${here ? `<a class="button primary" href="/characters/?c=${encodeURIComponent(here.id)}" data-act="nav" data-id="${esc(here.id)}">Play ${esc(here.name)}</a>` : ""}<button type="button" class="button" data-act="k" data-do="switch-char">Bring someone else</button></div>`
        : `<form class="cc-joinform" data-form="k-bring">${picker(myChar?.id)}
          <div class="cc-joinbar"><button type="submit" class="button primary" data-act="k" data-do="none"${pickOff()}>${pickLabel("Play {name} here", "Pick who you’re bringing")}</button>${myChar ? `<button type="button" class="button" data-act="k" data-do="keep-char">Keep playing ${esc(myChar.name)}</button>` : ""}</div></form>`}</section>`;
  }

  // ------------------------------------------------------------ picking who to bring

  const chars = () => store.data.characters;
  // Where a character's playing already. They play in one campaign at a time,
  // so what they do in one never reaches another campaign's GM.
  const playingIn = (id) => (st.list || []).filter((k) => k.role === "player" && k.character?.id === id && !(view.name === "camp" && k.id === view.id)).map((k) => k.name);
  const pickOff = () => (!chars().some((x) => x.id === st.picking) || st.busy ? " disabled" : "");
  // The button that goes with the pick, in plain text: "Join with Vesk".
  const pickText = (yes, no) => {
    const ch = chars().find((x) => x.id === st.picking);
    return ch ? yes.replace("{name}", ch.name) : no;
  };
  const pickLabel = (yes, no) => esc(pickText(yes, no));

  function picker(now) {
    const list = chars().filter((x) => x.id !== now);
    if (!list.some((x) => x.id === st.picking && !playingIn(x.id).length)) st.picking = null;
    const row = (ch) => {
      const sheet = d.sheetFor(ch);
      const busy = playingIn(ch.id);
      const notes = [esc(sheet?.title ?? ""), ...busy.map((n) => `playing in ${esc(n)}`), ch.acct ? "" : "only on this phone, so it goes into your account", ch.state?.dead ? "died in play" : ""].filter(Boolean);
      return `<li><label class="card cc-saved cc-pick${busy.length ? " is-busy" : ""}"><input type="radio" name="k-pick" value="${esc(ch.id)}"${st.picking === ch.id ? " checked" : ""}${busy.length ? " disabled" : ""}>
        <span class="die ghost" aria-hidden="true">${initial(ch.name)}</span><span class="cc-saved-text"><b>${esc(ch.name)}</b><small>${notes.join(" · ")}</small></span></label></li>`;
    };
    return `${list.length ? `<fieldset class="cc-picks"><legend class="sr-only">Your characters</legend><ul class="cc-mine">${list.map(row).join("")}</ul></fieldset>` : '<p class="cc-lead">You haven’t got anyone else on this phone yet.</p>'}
      <div class="cc-row"><button type="button" class="button" data-act="k" data-do="build">Make someone new</button></div>
      <p class="cc-lead">Or bring one of the crew, straight off their sheet:</p>
      <div class="cc-row cc-crewpicks">${d.crew().map((c) => `<button type="button" class="button sm" data-act="k" data-do="crew" data-c="${esc(c.id)}">${esc(c.name)}</button>`).join("")}</div>`;
  }

  // A character made on the way (the builder, or one of the crew) comes back
  // to where they were picking, picked.
  function made(ch) {
    const j = read(JOIN);
    if (!j?.make || Date.now() - (j.madeAt || 0) > 2 * HOURS) return false;
    write(JOIN, { ...j, make: null });
    const joining = j.make === "/characters/?join";
    d.go(j.make, { replace: true });
    st.picking = ch.id;
    st.switching = !joining;
    d.render();
    d.toast(`${ch.name}’s ready. ${joining ? "Join with them below." : "Bring them in below."}`);
    return true;
  }
  const makeFor = (back) => write(JOIN, { ...(read(JOIN) || {}), make: back, madeAt: Date.now() });

  // ------------------------------------------------------------ joining

  // The link's checked first: which campaign, who's its GM, and whether you're
  // in it already. Then you sign in if you need to, and pick who to bring.
  async function check() {
    takeLink();
    const j = waiting();
    const me = sync.me;
    st.join = { code: j?.code ?? null, about: null, state: !j ? "none" : !online() ? "offline" : "checking", providers: st.join?.providers ?? [], signedIn: Boolean(me) };
    d.render();
    if (st.join.state !== "checking") return;
    const who = await tryCall("GET", "/api/me");
    st.join.providers = who.got.providers || [];
    if (who.status === 503 || (who.ok && !who.got.user && !st.join.providers.length)) {
      st.join.state = "off";
      return d.render();
    }
    if (who.ok && who.got.user) {
      if (sync.me?.id !== who.got.user.id || sync.out) await sync.signedIn(who.got.user);
      load();
      st.join.signedIn = true;
    } else {
      if (sync.me) sync.signedOutHere();
      st.join.signedIn = false;
    }
    const r = await tryCall("POST", "/api/join", { code: j.code });
    if (r.ok) Object.assign(st.join, { about: r.got.campaign, state: r.got.campaign.role ? "in" : st.join.signedIn ? "pick" : "out" });
    else Object.assign(st.join, { state: r.status === 404 ? "bad" : "broken", error: r.got.error });
    d.render();
  }

  function joinView() {
    const j = st.join ?? { state: "checking" };
    const a = j.about;
    const params = new URLSearchParams(location.search);
    const failed = params.get("error");
    const back = '<div class="cc-row"><a class="button" href="/characters/" data-act="k" data-do="back">Characters</a></div>';
    let body = "";
    if (j.state === "none") body = `<div class="cc-note"><p>Open the join link your GM sent you, and it brings you here.</p></div>${back}`;
    else if (j.state === "offline") body = `<div class="cc-note is-warn"><p>Joining needs a signal. Your characters are on this phone, so play them, and open the link again when you’ve got a signal.</p></div>${back}`;
    else if (j.state === "checking") body = '<p class="lede">Checking the link…</p>';
    else if (j.state === "off") body = `<div class="cc-note is-warn"><p>Sign-in isn’t switched on here, so you can’t join a campaign yet.</p></div>${back}`;
    else if (j.state === "bad" || j.state === "broken") body =`<div class="cc-note is-warn" role="alert"><p>${esc(j.error || "The site didn’t answer. Try again in a minute.")}</p></div>${back}`;
    else if (j.state === "in") body = `<div class="cc-note" role="status"><p>${a.role === "gm" ? `You run ${esc(a.name)}. Send your players the link.` : `You’re already in ${esc(a.name)}.`}</p></div><div class="cc-row"><a class="button primary" href="/characters/?camp=${encodeURIComponent(a.id)}" data-act="k" data-do="open" data-id="${esc(a.id)}">Open ${esc(a.name)}</a></div>`;
    else if (j.state === "out") {
      body = `${failed ? `<div class="cc-note is-warn" role="alert"><p>That didn’t sign you in. Try again, and if you’ve signed in before, use the same way you did then. <small>(It said ${esc(failed)}.)</small></p></div>` : ""}
        <p class="cc-lead">Sign in first. It’s free, it keeps your characters on every phone you use, and it’s how ${esc(a.gm)} sees your character’s sheet as you play.</p>
        <div class="cc-row">${j.providers.map((p) => `<button type="button" class="button primary" data-act="k" data-do="in" data-p="${esc(p)}"${off(`in-${p}`)}>Sign in with ${esc({ google: "Google", discord: "Discord" }[p] || p)}</button>`).join("")}</div>
        <p class="cc-small">First time here? Signing in makes your account. It keeps your name, your email and your characters, and nothing else.</p>`;
    } else if (j.state === "pick") {
      body = `<form class="cc-joinform" data-form="k-join"><h2>Who are you bringing?</h2>
        <p class="cc-lead">Pick one of your characters. ${esc(a.gm)} sees their sheet as you play.</p>${picker(null)}
        <div class="cc-joinbar"><button type="submit" class="button primary" data-act="k" data-do="none"${pickOff()}>${pickLabel("Join with {name}", "Pick who you’re bringing")}</button></div></form>`;
    }
    return `${topbar("/characters/", "Characters")}<header class="cc-camp-head"><p class="kicker">Join a campaign</p><h1>${a ? esc(a.name) : "Join a campaign"}</h1>${a ? `<p class="cc-small">Run by ${esc(a.gm)}</p>` : ""}</header>${warn()}${body}`;
  }

  async function joinWith(id) {
    const j = waiting();
    const ch = chars().find((x) => x.id === id);
    if (!j || !ch) return;
    st.busy = "join";
    st.note = "";
    d.render();
    const kept = await sync.keepNow(ch);
    if (!kept) {
      st.busy = "";
      st.note = `${ch.name} didn’t reach your account, so you can’t join with them yet. Try again when you’ve got a better signal.`;
      return d.render();
    }
    const r = await tryCall("POST", "/api/join", { code: j.code, character: id });
    st.busy = "";
    if (!r.ok || !r.got.campaign?.id) {
      st.note = r.got.error || "That didn’t get you in. Try again in a minute.";
      return d.render();
    }
    write(JOIN, null);
    held = null;
    st.picking = null;
    const a = r.got.campaign;
    await refreshList();
    d.go(`/characters/?camp=${encodeURIComponent(a.id)}`, { replace: true });
    d.toast(`You’re in ${a.name}, playing ${ch.name}.`);
  }

  // ------------------------------------------------------------ the dialogs

  function dialog(roll) {
    const close = `<button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button>`;
    if (roll.what === "start") {
      return `<form class="cc-dlgform" data-form="k-start"><div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Start a campaign</h2></div>${close}</div>
        <div class="dlg-body"><label class="cc-field" for="k-name">What’s it called?</label><input id="k-name" name="name" maxlength="40" autocomplete="off" required value="${esc(roll.name ?? "")}">
          <p class="cc-lead">A name your players will know it by, like the night you play or where it’s set. You can change it later.</p>
          ${roll.error ? `<p class="cc-warn" role="alert">${esc(roll.error)}</p>` : ""}</div>
        <div class="dlg-foot"><button type="submit" class="button primary"${roll.busy ? ' disabled aria-busy="true"' : ""}>Start it</button></div></form>`;
    }
    if (roll.what === "qr") {
      const k = st.camps[roll.id]?.campaign;
      if (!k) return "";
      const svg = st.qr?.code === k.code ? st.qr.svg : "";
      return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Join ${esc(k.name)}</h2><p class="cc-small">Point your phone’s camera at the code and open the link.</p></div>${close}</div>
        <div class="dlg-body cc-qr-body"><div class="cc-qr"${svg ? ` role="img" aria-label="A code to scan for the link to join ${esc(k.name)}"` : ""}>${svg || '<p class="cc-lead">Drawing the code…</p>'}</div>
          <p class="cc-qr-link">${esc(linkOf(k.code).replace(/^https?:\/\//, ""))}</p></div>
        <div class="dlg-foot"><button type="button" class="button primary" data-act="close">Done</button></div>`;
    }
    return "";
  }

  // The code's drawn on the phone, black on white so every camera reads it.
  async function drawCode(code) {
    if (st.qr?.code === code) return;
    const { encode } = await import("uqr");
    const qr = encode(linkOf(code), { ecc: "M", border: 0 });
    const n = qr.size;
    let path = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.data[y][x]) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    st.qr = { code, svg: `<svg viewBox="0 0 ${n + 8} ${n + 8}" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${path}"/></svg>` };
  }

  // ------------------------------------------------------------ doing

  const at = () => (view.name === "camp" || view.name === "look" ? st.camps[view.id] : null);
  // From a look back to the campaign, the way it came if it can, so the party's
  // where the GM left it.
  const toCamp = (replace = false) => {
    if (history.state?.from === `camp:${view.id}`) return history.back();
    d.go(`/characters/?camp=${encodeURIComponent(view.id)}`, { replace: replace || view.name === "look" });
  };
  // What went wrong, by the button in the join, or as a toast anywhere else.
  const fail = (r, fallback) => {
    const why = r.got?.error || (r.status === 0 ? "That needs a signal. Try again when you’ve got one." : fallback);
    st.busy = "";
    if (view.name === "join") st.note = why;
    d.render();
    if (view.name !== "join") d.toast(why);
  };
  // Tap once and the button asks, tap again and it's done.
  const twice = (key) => {
    if (st.sure === key) {
      st.sure = "";
      return true;
    }
    st.sure = key;
    d.render();
    return false;
  };

  const ACT = {
    open(el, e) {
      e.preventDefault();
      d.go(`/characters/?camp=${encodeURIComponent(el.dataset.id)}`);
    },
    switch(el, e) {
      e.preventDefault();
      if (el.dataset.id !== view.id) d.go(`/characters/?camp=${encodeURIComponent(el.dataset.id)}`, { replace: true });
    },
    look(el, e) {
      e.preventDefault();
      d.go(`/characters/?camp=${encodeURIComponent(view.id)}&look=${encodeURIComponent(el.dataset.id)}`, { from: `camp:${view.id}` });
    },
    back(el, e) {
      e.preventDefault();
      if (view.name === "look") return toCamp();
      d.go(el.getAttribute("href"));
    },
    start() {
      if (!online()) return d.toast("Starting a campaign needs a signal.");
      d.openDialog({ kind: "camp", what: "start" });
    },
    async copy() {
      const k = at()?.campaign;
      if (!k) return;
      try {
        await navigator.clipboard.writeText(linkOf(k.code));
        d.toast("Copied. Paste it in your group chat.");
      } catch {
        document.getElementById("k-link")?.select();
      }
    },
    share() {
      const k = at()?.campaign;
      if (k) navigator.share({ title: `Join ${k.name}`, text: `Join ${k.name} on Zi’Dara`, url: linkOf(k.code) }).catch(() => {});
    },
    async qr() {
      const k = at()?.campaign;
      if (!k) return;
      d.openDialog({ kind: "camp", what: "qr", id: k.id });
      try {
        await drawCode(k.code);
      } catch {
        st.qr = { code: k.code, svg: '<p class="cc-lead">The code couldn’t be drawn. Open the page once with a signal, then try again.</p>' };
      }
      d.renderDialog();
    },
    async reset() {
      const k = at()?.campaign;
      if (!k || !twice("reset")) return;
      st.busy = "reset";
      d.render();
      const r = await tryCall("POST", `/api/campaigns/${encodeURIComponent(k.id)}/link`);
      if (!r.ok) return fail(r, "That didn’t reset the link. Try again in a minute.");
      st.busy = "";
      k.code = r.got.code;
      st.qr = null;
      at().v = "";
      keep();
      d.render();
      d.toast("That’s a new link. The old one won’t work any more.");
    },
    async remove(el) {
      const k = at();
      const p = k?.players.find((x) => x.id === el.dataset.id);
      if (!p || !twice(`remove-${p.id}`)) return;
      st.busy = `remove-${p.id}`;
      d.render();
      const r = await tryCall("DELETE", `/api/campaigns/${encodeURIComponent(k.campaign.id)}/members/${encodeURIComponent(p.id)}`);
      if (!r.ok && r.status !== 404) return fail(r, "That didn’t take them out. Try again in a minute.");
      st.busy = "";
      k.players = k.players.filter((x) => x.id !== p.id);
      k.v = "";
      const item = st.list?.find((x) => x.id === k.campaign.id);
      if (item) item.players = k.players.length;
      keep();
      if (view.name === "look") toCamp(true);
      else d.render();
      d.toast(`${first(p.name)}’s out of ${k.campaign.name}. Their characters are still theirs.`);
    },
    async end() {
      const k = at()?.campaign;
      if (!k || !twice("end")) return;
      st.busy = "end";
      d.render();
      const r = await tryCall("DELETE", `/api/campaigns/${encodeURIComponent(k.id)}`);
      if (!r.ok && r.status !== 404) return fail(r, "That didn’t end it. Try again in a minute.");
      st.busy = "";
      delete st.camps[k.id];
      if (st.list) st.list = st.list.filter((x) => x.id !== k.id);
      keep();
      d.go("/characters/", { replace: true });
      d.toast(`You’ve ended ${k.name}. Everyone’s characters are still their own.`);
    },
    async leave() {
      const k = at();
      if (!k || !twice("leave")) return;
      st.busy = "leave";
      d.render();
      const r = await tryCall("DELETE", `/api/campaigns/${encodeURIComponent(k.campaign.id)}/members/${encodeURIComponent(sync.me.id)}`);
      if (!r.ok && r.status !== 404) return fail(r, "That didn’t take you out. Try again in a minute.");
      st.busy = "";
      delete st.camps[k.campaign.id];
      if (st.list) st.list = st.list.filter((x) => x.id !== k.campaign.id);
      keep();
      d.go("/characters/", { replace: true });
      d.toast(`You’ve left ${k.campaign.name}.`);
    },
    "switch-char"() {
      st.switching = true;
      st.picking = null;
      d.render();
      document.querySelector('[name="k-pick"]')?.focus();
    },
    "keep-char"() {
      st.switching = false;
      st.picking = null;
      d.render();
    },
    build() {
      makeFor(view.name === "join" ? "/characters/?join" : `/characters/?camp=${encodeURIComponent(view.id)}`);
      d.newBuild();
    },
    crew(el) {
      makeFor(view.name === "join" ? "/characters/?join" : `/characters/?camp=${encodeURIComponent(view.id)}`);
      d.playCrew(el.dataset.c);
    },
    async in(el) {
      const p = el.dataset.p;
      st.busy = `in-${p}`;
      st.note = "";
      d.render();
      const r = await tryCall("POST", "/api/auth/sign-in/social", { provider: p, callbackURL: "/characters/?join", errorCallbackURL: "/characters/?join" });
      if (r.ok && r.got.url) return location.assign(r.got.url);
      fail(r, "That didn’t work. Try again in a minute.");
    },
    async print() {
      const k = at();
      const p = k?.players.find((x) => x.id === view.who);
      if (!p?.character || st.printing) return;
      const ch = structuredClone(p.character);
      const c = d.normal(ch);
      if (!c) return;
      st.printing = true;
      d.render();
      try {
        const { short } = await printSheet(ch, c, ch.state, { goal: d.party.goalIn(view.id) });
        d.toast(`${ch.name}’s sheet is filled in and ready to print.${short ? " Notes ran out of room on the paper, so the end got cut off." : ""}`);
      } catch {
        d.toast("The sheet couldn’t be filled in. Open the companion once with a signal, then try again.");
      } finally {
        st.printing = false;
        d.render();
      }
    },
    none() {},
  };

  async function submit(kind, form, f) {
    if (kind === "k-start") {
      const roll = d.roll();
      const name = String(f.get("name") ?? "");
      roll.name = name;
      roll.busy = true;
      roll.error = "";
      d.renderDialog();
      const r = await tryCall("POST", "/api/campaigns", { name });
      roll.busy = false;
      if (!r.ok) {
        roll.error = r.got.error || (r.status === 0 ? "Starting a campaign needs a signal." : "That didn’t start it. Try again in a minute.");
        return d.renderDialog();
      }
      const k = r.got.campaign;
      st.list = [...(st.list || []), k].sort(byName);
      st.camps[k.id] = { campaign: { id: k.id, name: k.name, gm: k.gm, gmId: sync.me?.id, role: "gm", code: k.code }, players: [], v: "", at: Date.now() };
      keep();
      d.leaveDialog(`/characters/?camp=${encodeURIComponent(k.id)}`);
      d.toast(`You’re the GM of ${k.name}. Send your players the link.`);
    } else if (kind === "k-rename") {
      const k = at()?.campaign;
      if (!k) return;
      st.busy = "rename";
      st.note = "";
      d.render();
      const r = await tryCall("PATCH", `/api/campaigns/${encodeURIComponent(k.id)}`, { name: String(f.get("name") ?? "") });
      if (!r.ok) return fail(r, "That didn’t rename it. Try again in a minute.");
      st.busy = "";
      k.name = r.got.name;
      at().v = "";
      const item = st.list?.find((x) => x.id === k.id);
      if (item) item.name = k.name;
      st.list?.sort(byName);
      keep();
      d.render();
      d.toast(`It’s called ${k.name} now.`);
    } else if (kind === "k-join") {
      if (st.picking) joinWith(st.picking);
    } else if (kind === "k-bring") {
      const k = at();
      const ch = chars().find((x) => x.id === st.picking);
      if (!k || !ch) return;
      st.busy = "bring";
      st.note = "";
      d.render();
      if (!(await sync.keepNow(ch))) {
        st.busy = "";
        st.note = `${ch.name} didn’t reach your account, so you can’t bring them in yet. Try again when you’ve got a better signal.`;
        return d.render();
      }
      const r = await tryCall("PUT", `/api/campaigns/${encodeURIComponent(k.campaign.id)}/me`, { character: ch.id });
      if (!r.ok) return fail(r, "That didn’t change who you’re playing. Try again in a minute.");
      st.busy = "";
      st.switching = false;
      st.picking = null;
      k.v = "";
      await refresh(k.campaign.id);
      await refreshList();
      d.toast(`You’re playing ${ch.name} in ${k.campaign.name} now.`);
    }
  }

  // Picking a character relabels the button that joins or brings them, with
  // no redraw, so focus stays on the list.
  document.addEventListener("change", (e) => {
    if (e.target.name !== "k-pick") return;
    st.picking = e.target.value;
    const btn = e.target.form?.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = Boolean(st.busy);
    btn.textContent = pickText(view.name === "join" ? "Join with {name}" : "Play {name} here", "Pick who you’re bringing");
  });

  return {
    section,
    gone,
    // The campaigns this phone last saw, for the party sheet.
    list() {
      load();
      return st.list;
    },
    // One campaign as this phone last saw it (its players, and whether this
    // player runs it), for the live table.
    campaign(id) {
      load();
      return st.camps[id] ?? null;
    },
    // Where the companion's going, so the campaigns can get ready for it.
    route(next) {
      const was = view;
      view = next;
      if (was.name !== next.name || was.id !== next.id) {
        st.sure = "";
        st.note = "";
        st.busy = "";
        st.switching = false;
      }
      // A character's only made on the way to joining while you're on the way.
      if (!["join", "camp", "build"].includes(next.name) && read(JOIN)?.make) write(JOIN, { ...read(JOIN), make: null });
      if (next.name === "join" && was.name !== "join") check();
      if (next.name === "list" && was.name !== "list") refreshList();
      poll();
    },
    view(v) {
      if (v.name === "join") return joinView();
      if (v.name === "look") return look(v);
      return campView(v.id);
    },
    title(v) {
      load();
      const k = st.camps[v.id]?.campaign ?? st.list?.find((x) => x.id === v.id);
      if (v.name === "join") return "Join a campaign";
      if (v.name === "look") return st.camps[v.id]?.players.find((p) => p.id === v.who)?.character?.name ?? k?.name ?? "Campaign";
      return k?.name ?? "Campaign";
    },
    after(app) {
      const cur = app.querySelector(".cc-strip [aria-current]");
      if (cur) cur.parentElement.scrollLeft = Math.max(0, cur.offsetLeft - 16);
    },
    act(el, e) {
      ACT[el.dataset.do]?.(el, e);
    },
    submit,
    dialog,
    made,
  };

  function look(v) {
    const k = st.camps[v.id];
    const p = k?.campaign.role === "gm" ? k.players.find((x) => x.id === v.who) : null;
    const back = { href: `/characters/?camp=${encodeURIComponent(v.id)}`, label: k?.campaign.name ?? "The campaign" };
    if (!p?.character) {
      const why = !k ? (st.why[v.id] === "gone" ? "You’re not in that campaign any more." : "This phone hasn’t got that campaign. Open it again when you’ve got a signal.")
        : k.campaign.role !== "gm" ? "Only the GM sees each character’s sheet." : "That character isn’t in the campaign any more.";
      return `${topbar(back.href, back.label)}<div class="cc-note is-warn"><p>${why}</p></div>`;
    }
    const who = esc(first(p.name));
    const ch = structuredClone(p.character);
    const out = `<section class="cc-sec" aria-labelledby="lk-out"><h2 id="lk-out">${who} in ${esc(k.campaign.name)}</h2>
      <p class="cc-lead">Take ${who} out and they’re out of ${esc(k.campaign.name)}. Their character stays theirs. The join link still works for them, so reset it too if they shouldn’t come back.</p>
      <div class="cc-row">${removeButton(p, "button danger")}</div></section>`;
    const cant = (why) => `${topbar(back.href, back.label)}<div class="cc-note is-warn"><p>${why}</p></div>${out}`;
    try {
      const c = d.normal(ch);
      if (!c) return cant(`${esc(ch.name)}’s sheet isn’t in the rules any more, so there’s nothing to show.`);
      // Where a thread with someone else in the campaign has got to, which can
      // be ahead of what this player's phone last sent.
      const bond = (person, t) => d.party.bondFor(v.id, p.id, ch.id, person, t);
      return lookView(ch, c, { ...d.look, esc, player: first(p.name), back, tools: d.tools(), printing: st.printing, icon: ICON, extra: out, bond });
    } catch {
      return cant(`${esc(String(ch?.name ?? "Their character"))}’s sheet couldn’t be read here.`);
    }
  }
}
