// Characters kept in an account. The phone's own list (store.js) is still what
// the companion plays from, so everything works with no signal. A character in
// an account carries acct, the account's id, and this keeps it in step with the
// account's copy: a change on the phone goes up a moment later, and a change
// made on another phone comes down when the page opens, comes back into view or
// gets its signal back. When two phones changed the same character, the one
// saved last wins. A character deleted on one phone goes from all of them.
//
//   zi-account  who's signed in on this phone ({ id, name, role }), so a page
//               knows with no signal. The account page sets it.
//   zi-sync     for each character, the account's version of it and a hash of
//               what this phone last sent or got, so it can tell who changed what,
//               and the ones deleted here that the account hasn't heard about.
//   zi-unsent-<account>  changes that hadn't gone up when someone else signed
//               in on this phone, kept for when that account's back.
//   zi-campaigns  the account's campaigns as this phone last saw them
//               (campaigns.js). It goes when the account's characters do.
//   zi-party    their party sheets and the threads between the crew, with any
//               changes still to go up (party.js). It goes with them too.
//   zi-table    their campaigns' live tables, the round's telegraphs and the
//               answers still to go up (table.js), and that goes too.
//   zi-world    their campaigns' worlds, the faction boards and the GM's
//               changes still to go up (world.js), and that goes as well.
//   zi-make     a world she's building, or a faction she's adding, that
//               isn't on the board yet (world-make.js), and that goes too.
//   zi-maps     (a cache, not localStorage) the pictures of their campaigns'
//               maps (mapsui.js, mapcache.js), and that goes too.
//
// Only a delete on this phone deletes from the account. A character that's
// just missing here (the phone's list got lost) comes back down.
import { forgetMaps } from "./mapcache.js";

const HINT = "zi-account";
const STATE = "zi-sync";
const STASH = "zi-unsent-";
const CAMPS = "zi-campaigns";
const PARTY = "zi-party";
const TABLE = "zi-table";
const WORLD = "zi-world";
const MAKE = "zi-make";

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
const bare = (ch) => {
  const { acct, ...rest } = ch;
  return rest;
};
// FNV-1a. It's only ever compared with itself.
function hash(ch) {
  const text = JSON.stringify(bare(ch));
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
const when = (ch) => String(ch?.saved || ch?.made || "");
const online = () => navigator.onLine !== false;

export function makeSync(store, { onChange = () => {} } = {}) {
  let me = read(HINT);
  let st = read(STATE);
  const fresh = () => ({ user: me?.id ?? null, v: {}, h: {}, gone: [] });
  if (!st || st.user !== (me?.id ?? null) || !st.v || !st.h) st = fresh();
  if (!Array.isArray(st.gone)) st.gone = [];
  let out = false; // signed out on this phone, with the account's characters still here
  let timer = 0;
  let lastPull = 0;
  let chain = Promise.resolve();
  const run = (fn) => {
    const p = chain.then(fn);
    chain = p.catch(() => {});
    return p;
  };

  const all = () => store.data.characters;
  const mine = () => (me ? all().filter((c) => c.acct === me.id) : []);
  const loose = () => all().filter((c) => !c.acct);
  const keep = () => write(STATE, st);
  const took = (c, v) => {
    st.v[c.id] = v;
    st.h[c.id] = hash(c);
  };
  const forgot = (id) => {
    delete st.v[id];
    delete st.h[id];
  };
  const remove = (id) => {
    const i = all().findIndex((c) => c.id === id && c.acct === me?.id);
    if (i >= 0) all().splice(i, 1);
  };
  // In place, so whatever's holding the character keeps holding it.
  const swap = (c, theirs) => {
    for (const k of Object.keys(c)) delete c[k];
    Object.assign(c, theirs);
  };
  // The account's characters leave this phone (signing out, or someone else
  // signing in on it). Anything that hadn't gone up is kept to one side.
  const changedHere = (c) => hash(c) !== st.h[c.id];
  const drop = (stash = true) => {
    const left = all().filter((c) => c.acct && c.acct === st.user && changedHere(c));
    if (stash && st.user && (left.length || st.gone.length)) {
      const pick = (map) => Object.fromEntries(left.filter((c) => map[c.id] != null).map((c) => [c.id, map[c.id]]));
      write(`${STASH}${st.user}`, { characters: left, v: pick(st.v), h: pick(st.h), gone: st.gone });
    }
    store.data.characters = all().filter((c) => !c.acct);
    save();
    // The campaigns this phone last saw (campaigns.js) were theirs too, and
    // their party sheets (party.js).
    write(CAMPS, null);
    write(PARTY, null);
    write(TABLE, null);
    write(WORLD, null);
    write(MAKE, null);
    forgetMaps();
  };
  // This phone starts keeping step with an account, picking up anything it had
  // kept to one side for it.
  const adopt = (user) => {
    me = { id: user.id, name: user.name, role: user.role };
    st = fresh();
    const kept = read(`${STASH}${me.id}`);
    if (!kept) return;
    for (const c of kept.characters || []) if (!all().some((x) => x.id === c.id)) all().push({ ...c, acct: me.id });
    Object.assign(st.v, kept.v);
    Object.assign(st.h, kept.h);
    st.gone = Array.isArray(kept.gone) ? kept.gone : [];
    write(`${STASH}${me.id}`, null);
    save();
  };

  // Every save on the phone sends what changed a moment later.
  const save = store.save;
  const quiet = () => save();
  store.save = () => {
    const ok = save();
    if (me && !out) soon();
    return ok;
  };
  function soon() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = 0;
      run(push);
    }, 800);
  }

  async function call(method, path, body) {
    const res = await fetch(path, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: body ? { "content-type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      out = true;
      onChange();
      throw new Error("signed out");
    }
    return res;
  }
  const put = (c, v) => call("PUT", `/api/characters/${encodeURIComponent(c.id)}`, { v, data: bare(c) });

  async function pull() {
    if (!me || !online()) return;
    lastPull = Date.now();
    const res = await call("GET", "/api/characters");
    if (!res.ok) return;
    const got = await res.json();
    if (got.me?.id !== me.id) {
      drop();
      adopt(got.me);
    }
    me = got.me;
    write(HINT, me);
    out = false;
    const here = new Map(mine().map((c) => [c.id, c]));
    let changed = false;
    for (const s of got.characters) {
      if (st.gone.includes(s.id)) continue; // deleted here, and that goes up below
      const c = here.get(s.id);
      if (s.data == null) {
        if (c) {
          remove(c.id);
          changed = true;
        }
        forgot(s.id);
        continue;
      }
      const theirs = { ...s.data, acct: me.id };
      if (!c) {
        all().push(theirs);
        took(theirs, s.v);
        changed = true;
      } else if (s.v !== st.v[s.id]) {
        // Changed on another phone. Theirs comes down unless this phone's
        // changed too and saved it later, and then this one goes up over it.
        if (hash(c) === st.h[s.id] || when(theirs) > when(c)) {
          swap(c, theirs);
          took(c, s.v);
          changed = true;
        } else st.v[s.id] = s.v;
      }
    }
    keep();
    if (changed) {
      quiet();
      onChange();
    }
    await push();
  }

  async function push() {
    if (!me || out || !online()) return;
    clearTimeout(timer);
    timer = 0;
    for (const id of [...st.gone]) {
      const res = await call("DELETE", `/api/characters/${encodeURIComponent(id)}`);
      if (!res.ok) return keep();
      st.gone = st.gone.filter((x) => x !== id);
      forgot(id);
    }
    for (const c of mine()) {
      const h = hash(c);
      if (h === st.h[c.id]) continue;
      let res = await put(c, st.v[c.id] ?? 0);
      if (res.status === 409) {
        const s = await res.json();
        if (s.data == null && s.v > 0 && st.v[c.id] != null) {
          // Deleted on another phone while this one was changing it.
          remove(c.id);
          forgot(c.id);
          quiet();
          onChange();
          continue;
        }
        if (s.data && when(s.data) > when(c)) {
          swap(c, { ...s.data, acct: me.id });
          took(c, s.v);
          quiet();
          onChange();
          continue;
        }
        res = await put(c, s.v);
      }
      if (res.status === 400 || res.status === 413) {
        // The account won't take this one (it's full, or this one's too big),
        // so it stays on this phone instead of holding up the rest.
        delete c.acct;
        forgot(c.id);
        quiet();
        onChange();
        continue;
      }
      if (!res.ok) return keep();
      st.v[c.id] = (await res.json()).v;
      st.h[c.id] = h;
    }
    keep();
  }

  // Leaving the page: anything still waiting goes now, without waiting for an
  // answer. The next pull sorts out the versions.
  addEventListener("pagehide", () => {
    if (!timer || !me || out) return;
    clearTimeout(timer);
    timer = 0;
    for (const id of st.gone) fetch(`/api/characters/${encodeURIComponent(id)}`, { method: "DELETE", keepalive: true, credentials: "same-origin" }).catch(() => {});
    for (const c of mine()) {
      if (hash(c) === st.h[c.id]) continue;
      fetch(`/api/characters/${encodeURIComponent(c.id)}`, { method: "PUT", keepalive: true, credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ v: st.v[c.id] ?? 0, data: bare(c) }) }).catch(() => {});
    }
  });
  addEventListener("online", () => me && run(pull));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && me && Date.now() - lastPull > 15000) run(pull);
  });
  addEventListener("storage", (e) => {
    if (e.key === HINT) me = read(HINT);
    if (e.key === STATE || e.key === HINT) st = read(STATE) || fresh();
  });

  return {
    get me() {
      return me;
    },
    // Signed out on this phone, but the account's characters are still here.
    get out() {
      return out;
    },
    // Characters on this phone that aren't in an account.
    loose,
    // How many of the account's characters have changes that haven't gone up yet.
    unsent: () => mine().filter(changedHere).length + st.gone.length,
    // A character deleted on this phone goes from the account too.
    gone(ch) {
      if (me && ch?.acct === me.id && !st.gone.includes(ch.id)) {
        st.gone.push(ch.id);
        keep();
      }
    },
    // A new character goes straight into the account when someone's signed in.
    claim(ch) {
      if (me && !out) ch.acct = me.id;
    },
    pull: () => run(pull).catch(() => {}),
    // Someone else's characters leave the phone. The same person signing in
    // again picks up where this phone left off, unsent changes and all.
    signedIn(user) {
      const other = me && me.id !== user.id;
      if (other) drop();
      if (other || st.user !== user.id) adopt(user);
      me = { id: user.id, name: user.name, role: user.role };
      out = false;
      write(HINT, me);
      keep();
      return run(pull).catch(() => {});
    },
    signedOutHere() {
      if (me) out = true;
    },
    // The one tap: everything on this phone goes into the account.
    moveIn() {
      if (!me || out) return Promise.resolve(0);
      const list = loose();
      for (const c of list) c.acct = me.id;
      quiet();
      return run(push).then(() => list.length);
    },
    // One character into the account now, for something that needs it there
    // (joining a campaign with them). True once the account has them.
    async keepNow(ch) {
      if (!me || out || !ch) return false;
      if (!ch.acct) {
        ch.acct = me.id;
        quiet();
      }
      if (ch.acct !== me.id) return false;
      await run(push).catch(() => {});
      return st.v[ch.id] != null && ch.acct === me.id;
    },
    // What's waiting goes up first, then the account's characters leave this
    // phone. Anything that couldn't go up stops it.
    async signOut() {
      await run(push);
      if (mine().some(changedHere) || st.gone.length) throw new Error("unsent");
      const res = await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error("sign-out");
      this.forget();
    },
    forget() {
      clearTimeout(timer);
      timer = 0;
      if (st.user) write(`${STASH}${st.user}`, null);
      drop(false);
      me = null;
      out = false;
      st = fresh();
      write(HINT, null);
      write(STATE, null);
    },
  };
}
