// Sharing a copy of a character (31 Oct 2026). Share a copy, at the top of a
// character's Sheet tab, gives them to someone you play with (your GM, a
// player in a campaign you run, or someone else in one you play in), who finds
// them under Given to you on their Characters page and takes them or turns
// them down. Or it makes a link anyone can take a copy from for a week, signed
// in or not, to send or to show at the table as a code. Either way the copy's
// the character as they are when they're shared (share-rules.js), and whoever
// takes it gets a character of their own, on their phone and in their account
// when they're signed in (adopt() in app.js). Yours stays yours, and nothing
// either of you does after that reaches the other.
//
//   /characters/?take    taking a copy from a link (/take/#<code> sends the
//                        code on here, where it waits in zi-take for two hours
//                        while you sign in)
//
// The Worker's side is src/worker/share.js. Sharing needs a signal, and so
// does taking a copy, but once it's taken it's on the phone like any other.
import { SHARE_CODE } from "./share-rules.js";
import { trackLine, whenOf } from "./look.js";
import { qrSvg } from "./qr.js";

const TAKE = "zi-take";
const HOURS = 3600000;
const PRONOUN = { her: ["she", "her", "her", "is", "she’s"], him: ["he", "him", "his", "is", "he’s"], them: ["they", "them", "their", "are", "they’re"] };

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
const initial = (name) => String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
// The day a link runs out, kept on one line: "7 Nov".
const till = (ms) => new Date(ms).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }).replace(/\s/g, "\u00a0");
const linkOf = (code) => `${location.origin}/take/#${code}`;

// A link's code comes in after the # (/take/ sends it on), so it never reaches
// a server's log, and waits on the phone while someone signs in. A phone that
// won't keep anything still has it while the page is open.
let held = null;
function takeLink() {
  let code = "";
  try {
    code = decodeURIComponent(location.hash.slice(1));
  } catch {}
  if (!SHARE_CODE.test(code)) return;
  held = { code, at: Date.now() };
  write(TAKE, held);
  history.replaceState(history.state, "", location.pathname + location.search);
}
const waiting = () => {
  const j = read(TAKE) ?? held;
  return j && typeof j.code === "string" && SHARE_CODE.test(j.code) && Date.now() - (j.at || 0) < 2 * HOURS ? j : null;
};

export function makeShare(d) {
  const { esc, sync, ICON } = d;
  // list: who you play with, what's waiting for you and what you've shared,
  // as the server last said, for whoever was signed in then.
  // taken: copies taken on this phone whose drop hadn't got through, so they
  // don't show again and go off the server at the next chance.
  const st = { list: null, at: 0, why: "", busy: "", sure: "", take: null, qr: null, taken: new Set() };
  let view = { name: "" };

  async function call(method, path, body) {
    const res = await fetch(path, { method, cache: "no-store", credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    return { ok: res.ok, status: res.status, got: await res.json().catch(() => ({})) };
  }
  const tryCall = (method, path, body) => call(method, path, body).catch(() => ({ ok: false, status: 0, got: {} }));
  const listNow = () => (st.list && st.list.user === sync.me?.id ? st.list : null);
  const quietRender = () => {
    if (!document.activeElement?.matches?.("#app input:not([type=radio]), #app textarea")) d.render();
  };
  const off = (what) => (st.busy ? ` disabled${st.busy === what ? ' aria-busy="true"' : ""}` : "");
  const sure = (key, yes, no) => (st.sure === key ? yes : no);
  // Tap once and the button asks, tap again and it's done.
  const twice = (key, redraw) => {
    if (st.sure === key) {
      st.sure = "";
      return true;
    }
    st.sure = key;
    redraw();
    return false;
  };
  const fail = (r, fallback) => {
    st.busy = "";
    d.toast(r.got?.error || (r.status === 0 ? "That needs a signal. Try again when you’ve got one." : fallback));
  };

  // Who you play with and what's waiting, whenever the Characters page or a
  // share card opens, and when the page comes back into view.
  async function refresh() {
    if (!sync.me || sync.out || !online()) return;
    const me = sync.me.id;
    const r = await tryCall("GET", "/api/shares");
    if (r.status === 401) {
      sync.signedOutHere();
      return d.render();
    }
    if (sync.me?.id !== me) return;
    if (!r.ok) {
      st.why = "net";
      if (d.roll()?.kind === "share") d.renderDialog();
      return;
    }
    st.why = "";
    const given = (r.got.given || []).filter((g) => !st.taken.has(g.code));
    for (const g of r.got.given || []) if (st.taken.has(g.code)) tryCall("POST", "/api/shares/drop", { code: g.code });
    st.list = { user: me, people: r.got.people || [], given, sent: r.got.sent || [] };
    st.at = Date.now();
    if (view.name === "list") quietRender();
    if (d.roll()?.kind === "share") d.renderDialog();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && view.name === "list" && Date.now() - st.at > 15000) refresh();
  });

  // ------------------------------------------------------------ given to you

  function section() {
    const given = listNow()?.given ?? [];
    if (!sync.me || sync.out || !given.length) return "";
    const card = (g) => `<li class="card sh-gift"><div class="sh-gift-who"><span class="die" aria-hidden="true">${esc(initial(g.name))}</span><span class="cc-saved-text"><b>${esc(g.name)}</b><small>A copy from ${esc(g.from)}, given ${esc(whenOf(new Date(g.at).toISOString()))}</small></span></div>
      <div class="cc-row"><button type="button" class="button primary" data-act="sh" data-do="take" data-code="${esc(g.code)}"${off(`take-${g.code}`)}>Take ${esc(g.name)}</button><button type="button" class="button" data-act="sh" data-do="no" data-code="${esc(g.code)}"${off(`no-${g.code}`)}>${sure(`no-${g.code}`, "Tap again to turn it down", "No thanks")}</button></div></li>`;
    return `<section class="cc-sec" id="cc-given" aria-labelledby="cc-given-h"><h2 id="cc-given-h">Given to you</h2>
      <p class="cc-lead">Take one and they’re yours to play and change. Whoever gave them to you keeps their own.</p>
      <ul class="cc-mine">${given.map(card).join("")}</ul></section>`;
  }

  // ------------------------------------------------------------ the share card

  const sentFor = (id) => (listNow()?.sent ?? []).filter((x) => x.character === id);
  const linkFor = (id) => sentFor(id).find((x) => !x.to) ?? null;
  const giftFor = (id, who) => sentFor(id).find((x) => x.to?.id === who) ?? null;
  // Where they play together, in a line: "Your GM in Tuesday Lair".
  const whereOf = (p) => [
    p.gm.length ? `Your GM in ${p.gm.map(esc).join(" and ")}` : "",
    p.plays.length ? `Plays in ${p.plays.map(esc).join(" and ")}` : "",
    p.with.length ? `In ${p.with.map(esc).join(" and ")} with you` : "",
  ].filter(Boolean).join(" · ");

  function dialog(roll) {
    const ch = d.chars().find((x) => x.id === roll.id);
    const c = ch ? d.sheetFor(ch) : null;
    if (!ch || !c) return "";
    const [they, them, their, are, theyre] = PRONOUN[c.pronoun] ?? PRONOUN.them;
    const name = esc(ch.name);
    const close = `<button type="button" class="cc-x" data-act="close" aria-label="Close">${ICON.close}</button>`;
    const link = linkFor(ch.id);
    if (roll.what === "qr" && link) {
      const svg = st.qr?.code === link.code ? st.qr.svg : "";
      return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">A copy of ${name}</h2><p class="cc-small">Point your phone’s camera at the code and open the link.</p></div>${close}</div>
        <div class="dlg-body cc-qr-body"><div class="cc-qr"${svg ? ` role="img" aria-label="A code to scan for the link to a copy of ${name}"` : ""}>${svg || '<p class="cc-lead">Drawing the code…</p>'}</div>
          <p class="cc-qr-link">${esc(linkOf(link.code).replace(/^https?:\/\//, ""))}</p></div>
        <div class="dlg-foot"><button type="button" class="button" data-act="sh" data-do="card">Back</button><button type="button" class="button primary" data-act="close">Done</button></div>`;
    }
    const head = `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Share a copy of ${name}</h2><p class="cc-small">Whoever takes it gets ${name} as ${they} ${are} right now, to play and change as their own. Yours stays just as ${they} ${are}.</p></div>${close}</div>`;
    const foot = '<div class="dlg-foot"><button type="button" class="button primary" data-act="close">Done</button></div>';
    const list = listNow();
    let body;
    if (!sync.me || sync.out) {
      body = `<p class="cc-lead">Sign in to share a copy. It comes from your account, so it’s ${name} as ${they} ${are} on every phone you use.</p><div class="cc-row"><a class="button primary" href="/account/">Sign in</a></div>`;
    } else if (!list) {
      body = `<p class="cc-lead" role="status">${!online() ? "Sharing needs a signal. Try again when you’ve got one." : st.why ? "That didn’t load. Check your signal, then close this and try again." : "Checking who you play with…"}</p>`;
    } else {
      const person = (p) => {
        const gift = giftFor(ch.id, p.id);
        return `<li class="card sh-person"><span class="sh-who"><b>${esc(p.name)}</b><small>${whereOf(p)}</small></span>
          ${gift ? `<span class="sh-sent"><small>Waiting for ${esc(first(p.name))} to take ${them}</small><button type="button" class="button sm" data-act="sh" data-do="unsend" data-code="${esc(gift.code)}"${off(`unsend-${gift.code}`)}>Take it back</button></span>`
            : `<button type="button" class="button" data-act="sh" data-do="give" data-to="${esc(p.id)}"${off(`give-${p.id}`)}>Give ${esc(first(p.name))} a copy</button>`}</li>`;
      };
      const give = list.people.length
        ? `<ul class="cc-mine sh-people">${list.people.map(person).join("")}</ul><p class="cc-small">They find ${them} on their Characters page, and take ${them} or turn ${them} down.</p>`
        : '<p class="cc-lead">Nobody yet. Once you’re in a campaign, its GM and the other players show up here, and so does everyone in the ones you run.</p>';
      const share = typeof navigator.share === "function";
      const linked = link
        ? `<p class="cc-lead">Anyone with the link can take a copy, signed in or not, till ${esc(till(link.until))}. Send it to your group chat, or show the code at the table and they scan it with their phone.</p>
          <label class="cc-field" for="sh-link">The link</label><input id="sh-link" class="ac-link" readonly value="${esc(linkOf(link.code))}">
          <div class="cc-row">${share ? '<button type="button" class="button primary" data-act="sh" data-do="send">Share the link</button>' : ""}<button type="button" class="button${share ? "" : " primary"}" data-act="sh" data-do="copy">Copy the link</button><button type="button" class="button" data-act="sh" data-do="qr">Show the code</button></div>
          <p class="cc-small">It has ${name} as ${they} ${are === "are" ? "were" : "was"} ${esc(whenOf(new Date(link.at).toISOString()))}. Changed ${them} since? Bring it up to date, and the same link has ${them} as ${they} ${are} now.</p>
          <div class="cc-row"><button type="button" class="button" data-act="sh" data-do="link"${off("link")}>Bring it up to date</button><button type="button" class="button" data-act="sh" data-do="stop"${off("stop")}>${sure("stop", "Tap again to stop it", "Stop sharing it")}</button></div>`
        : `<p class="cc-lead">Anyone with the link can take a copy for a week, signed in or not. Send it to your group chat, or show the code at the table.</p>
          <div class="cc-row"><button type="button" class="button" data-act="sh" data-do="link"${off("link")}>Make a link</button></div>`;
      body = `${ch.acct ? "" : `<p class="cc-note">${name}’s only on this phone, so sharing puts ${them} in your account first.</p>`}
        <p class="cc-lead">Everything on ${their} sheet goes with ${them}: where ${theyre} at, ${their} threads and ${their} notes.</p>
        <h3 class="cc-h3">Give ${them} to someone you play with</h3>${give}
        <h3 class="cc-h3">Or send a link</h3>${linked}`;
    }
    return `${head}<div class="dlg-body sh-card">${body}</div>${foot}`;
  }

  // What's shared comes from the account, so the character's latest goes up first.
  async function upFirst(ch) {
    if (await sync.keepNow(ch)) return true;
    st.busy = "";
    d.renderDialog();
    d.toast(`${ch.name} didn’t reach your account, so there’s nothing to share yet. Try again when you’ve got a better signal.`);
    return false;
  }
  const openCard = () => d.chars().find((x) => x.id === d.roll()?.id) ?? null;
  // What the server said it shared, in place of what was there for the same character and person.
  const noteSent = (s) => {
    const list = listNow();
    if (!list) return;
    list.sent = [{ ...s, to: s.to ? list.people.find((p) => p.id === s.to) ?? { id: s.to, name: "" } : null }, ...list.sent.filter((x) => !(x.character === s.character && (x.to?.id ?? null) === (s.to ?? null)))];
  };
  const forget = (code) => {
    const list = listNow();
    if (!list) return;
    list.sent = list.sent.filter((x) => x.code !== code);
    list.given = list.given.filter((x) => x.code !== code);
  };

  // ------------------------------------------------------------ taking a copy from a link

  async function check() {
    takeLink();
    const j = waiting();
    st.take = { code: j?.code ?? null, state: !j ? "none" : !online() ? "offline" : "checking", share: null, preview: null, providers: st.take?.providers ?? [] };
    d.render();
    if (st.take.state !== "checking") return;
    const who = await tryCall("GET", "/api/me");
    st.take.providers = who.got.providers || [];
    if (who.status === 503) {
      st.take.state = "off";
      return d.render();
    }
    if (who.ok && who.got.user) {
      if (sync.me?.id !== who.got.user.id || sync.out) await sync.signedIn(who.got.user);
    } else if (who.ok && sync.me) sync.signedOutHere();
    const r = await tryCall("POST", "/api/shares/open", { code: j.code });
    if (!r.ok || !r.got.share) {
      Object.assign(st.take, { state: r.status === 404 || r.status === 429 ? "bad" : "broken", error: r.got.error });
      return d.render();
    }
    const preview = d.adopt(r.got.share.data, r.got.share.from, { save: false });
    Object.assign(st.take, { state: preview ? "ready" : "unreadable", share: r.got.share, preview });
    d.render();
  }

  function takeView() {
    const t = st.take ?? { state: "checking" };
    const s = t.share;
    const from = s ? esc(s.from) : "";
    const back = '<div class="cc-row"><a class="button" href="/characters/" data-act="sh" data-do="back">Characters</a></div>';
    let body = "";
    if (t.state === "none") body = `<div class="cc-note"><p>Open the link someone sent you, and it brings you here.</p></div>${back}`;
    else if (t.state === "offline") body = `<div class="cc-note is-warn"><p>Taking a copy needs a signal. Your characters are on this phone, so play them, and open the link again when you’ve got one.</p></div>${back}`;
    else if (t.state === "checking") body = '<p class="lede">Checking the link…</p>';
    else if (t.state === "off") body = `<div class="cc-note is-warn"><p>Sign-in isn’t switched on here, so there’s nothing to take yet.</p></div>${back}`;
    else if (t.state === "bad" || t.state === "broken") body = `<div class="cc-note is-warn" role="alert"><p>${esc(t.error || "The site didn’t answer. Try again in a minute.")}</p></div>${back}`;
    else if (t.state === "unreadable") body = `<div class="cc-note is-warn" role="alert"><p>${esc(s.name)}’s sheet couldn’t be read here. The rules might’ve changed since, so ask ${from} to share them again.</p></div>${back}`;
    else if (t.state === "ready") {
      const { ch, c } = t.preview;
      const [, them] = PRONOUN[c.pronoun] ?? PRONOUN.them;
      const name = esc(ch.name);
      const signedIn = Boolean(sync.me && !sync.out);
      const about = [c.title ? `<em>${esc(c.title)}</em>` : "", ...c.archetypes.map(esc)].filter(Boolean).join(" · ");
      body = `<div class="card cc-saved sh-preview"><span class="cc-mini-crest" aria-hidden="true">${d.crestOf(c)}</span><span class="cc-saved-text"><b>${name}</b>${about ? `<small>${about}</small>` : ""}${trackLine(c, ch.state, esc)}</span></div>
        ${s.mine ? `<div class="cc-note"><p>This is your own link for ${name}. Take a copy and you’ve got two of ${them}.</p></div>` : ""}
        <p class="cc-lead">Take a copy and ${name}’s yours, ${signedIn ? "in your account, on every phone you sign in on" : "on this phone"}. ${s.mine ? "" : `${from} keeps theirs, and nothing either of you does after this reaches the other.`}</p>
        <div class="cc-row"><button type="button" class="button primary" data-act="sh" data-do="takelink"${off("takelink")}>Take a copy of ${name}</button></div>
        ${!signedIn && t.providers.length ? `<p class="cc-lead">Sign in first and the copy goes in your account too, on every phone you use.</p>
          <div class="cc-row">${t.providers.map((p) => `<button type="button" class="button" data-act="sh" data-do="in" data-p="${esc(p)}"${off(`in-${p}`)}>Sign in with ${esc({ google: "Google", discord: "Discord" }[p] || p)}</button>`).join("")}</div>` : ""}`;
    }
    return `<div class="cc-topbar"><a class="cc-back" href="/characters/" data-act="sh" data-do="back">${ICON.back}Characters</a><div class="cc-tools">${d.tools()}</div></div>
      <header class="cc-camp-head"><p class="kicker">A copy to take</p><h1>${s ? esc(s.name) : "Take a copy"}</h1>${s ? `<p class="cc-small">Shared by ${from}</p>` : ""}</header>${body}`;
  }

  // A copy taken becomes this phone's own, and opens. From a link, the page
  // that took it gives way to them, so Back doesn't offer it again.
  function took(ch, from, { mine = false, replace = false } = {}) {
    d.go(`/characters/?c=${encodeURIComponent(ch.id)}`, { replace });
    d.toast(`${ch.name}’s yours now, ${ch.acct ? "in your account" : "on this phone"}.${mine ? "" : ` ${first(from)} keeps theirs.`}`);
  }

  // ------------------------------------------------------------ doing

  const ACT = {
    back(el, e) {
      e.preventDefault();
      d.go("/characters/");
    },
    open() {
      const ch = d.current();
      if (!ch) return;
      st.sure = "";
      st.busy = "";
      st.why = "";
      d.openDialog({ kind: "share", id: ch.id, what: "card" });
      refresh();
    },
    card() {
      const r = d.roll();
      if (r?.kind === "share") r.what = "card";
      d.renderDialog();
    },
    async give(el) {
      const ch = openCard();
      const to = el.dataset.to;
      if (!ch || !to || st.busy) return;
      st.busy = `give-${to}`;
      d.renderDialog();
      if (!(await upFirst(ch))) return;
      const r = await tryCall("POST", "/api/shares", { character: ch.id, to });
      if (!r.ok || !r.got.share) {
        fail(r, "That didn’t give them the copy. Try again in a minute.");
        return d.renderDialog();
      }
      st.busy = "";
      noteSent(r.got.share);
      d.renderDialog();
      const p = listNow()?.people.find((x) => x.id === to);
      d.toast(`Given. It’s waiting for ${first(p?.name)} on their Characters page.`);
    },
    async unsend(el) {
      const code = el.dataset.code;
      if (!SHARE_CODE.test(code || "") || st.busy) return;
      st.busy = `unsend-${code}`;
      d.renderDialog();
      const r = await tryCall("POST", "/api/shares/drop", { code });
      if (!r.ok) {
        fail(r, "That didn’t take it back. Try again in a minute.");
        return d.renderDialog();
      }
      st.busy = "";
      forget(code);
      d.renderDialog();
      d.toast(r.got.ok ? "Taken back. It’s gone from their list." : "They’d already taken it or turned it down.");
    },
    // Making the link, or bringing it up to date: it keeps its code.
    async link() {
      const ch = openCard();
      if (!ch || st.busy) return;
      const had = Boolean(linkFor(ch.id));
      st.busy = "link";
      st.sure = "";
      d.renderDialog();
      if (!(await upFirst(ch))) return;
      const r = await tryCall("POST", "/api/shares", { character: ch.id });
      if (!r.ok || !r.got.share) {
        fail(r, "That didn’t make the link. Try again in a minute.");
        return d.renderDialog();
      }
      st.busy = "";
      noteSent(r.got.share);
      d.renderDialog();
      const [they, , , are] = PRONOUN[d.sheetFor(ch)?.pronoun] ?? PRONOUN.them;
      d.toast(had ? `The link has ${ch.name} as ${they} ${are} now.` : "That’s the link. Share it, copy it or show the code.");
    },
    async stop() {
      const ch = openCard();
      const link = ch ? linkFor(ch.id) : null;
      if (!link || st.busy || !twice("stop", () => d.renderDialog())) return;
      st.busy = "stop";
      d.renderDialog();
      const r = await tryCall("POST", "/api/shares/drop", { code: link.code });
      if (!r.ok) {
        fail(r, "That didn’t stop it. Try again in a minute.");
        return d.renderDialog();
      }
      st.busy = "";
      forget(link.code);
      d.renderDialog();
      d.toast("That link won’t work any more. Anyone who took a copy keeps it.");
    },
    async copy() {
      const ch = openCard();
      const link = ch ? linkFor(ch.id) : null;
      if (!link) return;
      try {
        await navigator.clipboard.writeText(linkOf(link.code));
        d.toast("Copied. Paste it wherever they’ll see it.");
      } catch {
        document.getElementById("sh-link")?.select();
      }
    },
    send() {
      const ch = openCard();
      const link = ch ? linkFor(ch.id) : null;
      if (link) navigator.share({ title: `A copy of ${ch.name}`, text: `A copy of ${ch.name} to play on Zi’Dara`, url: linkOf(link.code) }).catch(() => {});
    },
    async qr() {
      const ch = openCard();
      const link = ch ? linkFor(ch.id) : null;
      if (!link) return;
      d.roll().what = "qr";
      d.renderDialog();
      try {
        if (st.qr?.code !== link.code) st.qr = { code: link.code, svg: await qrSvg(linkOf(link.code)) };
      } catch {
        st.qr = { code: link.code, svg: '<p class="cc-lead">The code couldn’t be drawn. Open the page once with a signal, then try again.</p>' };
      }
      d.renderDialog();
    },
    // A copy given to you, taken: it's on this phone first, then off the list.
    async take(el) {
      const code = el.dataset.code;
      const gift = listNow()?.given.find((g) => g.code === code);
      if (!gift || st.busy) return;
      st.busy = `take-${code}`;
      d.render();
      const r = await tryCall("POST", "/api/shares/open", { code });
      if (!r.ok || !r.got.share) {
        if (r.status === 404) forget(code);
        fail(r, "That copy didn’t come through. Try again in a minute.");
        return d.render();
      }
      const ch = d.adopt(r.got.share.data, r.got.share.from);
      if (!ch) {
        st.busy = "";
        d.render();
        return d.toast(`${gift.name}’s sheet couldn’t be read here, so they’re still waiting. Ask ${first(gift.from)} to give them to you again.`);
      }
      st.taken.add(code);
      const gone = await tryCall("POST", "/api/shares/drop", { code });
      if (gone.ok) st.taken.delete(code);
      st.busy = "";
      forget(code);
      took(ch, gift.from);
    },
    async no(el) {
      const code = el.dataset.code;
      if (!listNow()?.given.some((g) => g.code === code) || st.busy || !twice(`no-${code}`, () => d.render())) return;
      st.busy = `no-${code}`;
      d.render();
      const r = await tryCall("POST", "/api/shares/drop", { code });
      if (!r.ok) {
        fail(r, "That didn’t turn it down. Try again in a minute.");
        return d.render();
      }
      st.busy = "";
      forget(code);
      d.render();
      d.toast("Turned down. It’s gone from your list.");
    },
    takelink() {
      const t = st.take;
      if (t?.state !== "ready" || st.busy) return;
      const ch = d.adopt(t.share.data, t.share.from);
      if (!ch) {
        t.state = "unreadable";
        return d.render();
      }
      write(TAKE, null);
      held = null;
      st.take = null;
      took(ch, t.share.from, { mine: t.share.mine, replace: true });
    },
    async in(el) {
      const p = el.dataset.p;
      st.busy = `in-${p}`;
      d.render();
      const r = await tryCall("POST", "/api/auth/sign-in/social", { provider: p, callbackURL: "/characters/?take", errorCallbackURL: "/characters/?take" });
      if (r.ok && r.got.url) return location.assign(r.got.url);
      fail(r, "That didn’t work. Try again in a minute.");
      d.render();
    },
  };

  return {
    section,
    dialog,
    view: takeView,
    title: () => (st.take?.share ? `A copy of ${st.take.share.name}` : "Take a copy"),
    // Where the companion's going, so the share can get ready for it.
    route(next) {
      const was = view;
      view = next;
      if (was.name !== next.name) {
        st.sure = "";
        st.busy = "";
      }
      if (next.name === "take" && was.name !== "take") check();
      if (next.name === "list" && was.name !== "list") refresh();
    },
    act(el, e) {
      const fn = ACT[el.dataset.do];
      if (fn) fn(el, e);
    },
  };
}
