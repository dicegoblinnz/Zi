// Maps on the World screen and the World tab (stage 4 of notes/worlds-plan.md).
//
// A map's the GM's own picture: one she's made or found, or a phone photo of
// one drawn on paper, put up from her phone, several to a world. It opens full
// screen (/characters/?camp=<id>&world&m=<map>, with &pin=<pin> to go straight
// to a pin, or &put=<p or f>:<id> to pin a page or faction on it), dragged and
// pinched, or zoomed with the buttons under her thumb, and she drops pins on it
// that open her places, people and factions. Everything starts hidden: she
// shows the crew a map in a tap, then each pin in its own tap.
//
// The picture's shrunk on her phone to 2560 pixels on its long side before it
// goes up, which also leaves off where a photo was taken, and it's kept in the
// Worker's R2 bucket (src/worker/maps.js). A phone keeps every picture it's
// opened in its own cache, zi-maps, so a map seen once opens with no signal. A
// picture goes from it once its map's gone or hidden, and the lot goes when
// the account leaves the phone (sync.js).
//
// The map itself is one element kept from one redraw to the next, so a drag
// or a pinch carries on while the screen's drawn again, and the map's where
// she left it when she opens a page from a pin and comes back.
//
// world.js owns the screen, the changes and keeping it in step. This module
// draws the maps and handles their taps, forms and gestures, through the
// helpers world.js hands it.
import { MMAX, findMap, labelOf, openToCrew, pinsTo, targetOf } from "./maps-rules.js";

const CACHE = "zi-maps";
const LONGEST = 2560;
const SORT = (t) => String(t ?? "").replace(/^(The|A|An) /i, "").toLowerCase();
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const icon = (d, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const I = {
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  minus: icon('<path d="M5 12h14"/>'),
  fit: icon('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  pin: icon('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>', 18),
  list: icon('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>', 18),
  map: icon('<path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z"/><path d="M9 4v13.6M15 6.4V20"/>', 18),
  close: icon('<path d="M6 6l12 12M18 6 6 18"/>', 22),
  big: icon('<path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z"/><path d="M9 4v13.6M15 6.4V20"/>', 26),
};
// A pin: a drop punched out of card, with what it opens in the middle.
const DROP = '<path class="wm-drop" d="M15 36.2c-1.2-3.5-3.4-6.4-6.3-9.4C5.3 23.3 2.6 20.2 2.6 14.6a12.4 12.4 0 0 1 24.8 0c0 5.6-2.7 8.7-6.1 12.2-2.9 3-5.1 5.9-6.3 9.4z"/>';
const INNER = {
  place: '<path d="M10 19.6v-5.4l5-3.5 5 3.5v5.4M13.4 19.6v-3h3.2v3"/>',
  person: '<circle cx="15" cy="12.2" r="2.5"/><path d="M10.3 19.8c.5-2.7 2.4-4.3 4.7-4.3s4.2 1.6 4.7 4.3"/>',
  faction: '<path d="M11.6 20.4V9.4M11.6 9.9h7l-1.7 2.5 1.7 2.5h-7"/>',
  none: '<circle class="wm-dot" cx="15" cy="14.6" r="3.3"/>',
};
const markOf = (kind) => `<svg class="wm-mk" viewBox="0 0 30 38" width="30" height="38" aria-hidden="true" focusable="false">${DROP}<g class="wm-in">${INNER[kind] ?? INNER.none}</g></svg>`;

export function makeMaps(w) {
  const { d, esc, edit, docOf, isGm, camp, gmName, online, newId, bare, plural } = w;
  let ui = fresh();
  // The map on screen: one element kept from one redraw to the next.
  let V = null;
  // Where each map was left, for coming back to it.
  const views = new Map();
  // Each picture this phone has open, as a blob: address, by its address.
  const blobs = new Map();
  const loading = new Map();
  let up = null;

  function fresh() {
    return { map: "", panel: "", pin: "", mode: "", draft: null, form: "", sure: "", centre: "", reveal: false, from: "", put: "", preset: null };
  }

  // ------------------------------------------------------------ addresses

  const enc = encodeURIComponent;
  const srcOf = (id, m) => `/api/campaigns/${enc(id)}/maps/${enc(m.id)}?v=${enc(m.file)}`;
  const mapHref = (id, mid, more = "") => `/characters/?camp=${enc(id)}&world&m=${enc(mid)}${more}`;
  const targetHref = (id, t) => `/characters/?camp=${enc(id)}&world&${t.kind === "f" ? "f" : "p"}=${enc(t.id)}`;
  const kindOf = (t) => (!t ? "none" : t.kind === "f" ? "faction" : t.page.kind === "place" ? "place" : "person");
  const kindWord = (t) => ({ faction: "A faction", place: "A place", person: "A person" })[kindOf(t)] ?? "";

  // ------------------------------------------------------------ pictures

  const cacheOpen = async () => {
    try {
      return await caches.open(CACHE);
    } catch {
      return null;
    }
  };
  // A map's picture, from this phone's cache or else the Worker, kept in the
  // cache once it's come. It says why when there's none.
  function picture(id, m) {
    const url = srcOf(id, m);
    if (blobs.has(url)) return Promise.resolve({ src: blobs.get(url) });
    if (loading.has(url)) return loading.get(url);
    const p = (async () => {
      const cache = await cacheOpen();
      let res = cache ? await cache.match(url).catch(() => null) : null;
      if (!res) {
        if (!online()) return { fail: "offline" };
        const net = await fetch(url, { credentials: "same-origin" }).catch(() => null);
        if (!net) return { fail: online() ? "error" : "offline" };
        if (net.status === 404) return { fail: "gone" };
        if (!net.ok) return { fail: "error" };
        if (cache) await cache.put(url, net.clone()).catch(() => {});
        res = net;
      }
      const blob = await res.blob();
      const src = URL.createObjectURL(blob);
      blobs.set(url, src);
      return { src };
    })().catch(() => ({ fail: "error" })).finally(() => loading.delete(url));
    loading.set(url, p);
    return p;
  }
  // A picture this phone has already, for a map's thumbnail. Never fetched
  // for that alone, so a list of maps costs no signal.
  async function kept(url) {
    if (blobs.has(url)) return blobs.get(url);
    const cache = await cacheOpen();
    const res = cache ? await cache.match(url).catch(() => null) : null;
    if (!res) return null;
    const src = URL.createObjectURL(await res.blob());
    blobs.set(url, src);
    return src;
  }
  // Only the pictures of the maps this phone can still see stay on it.
  async function prune(id, maps) {
    const keep = new Set(maps.map((m) => srcOf(id, m)));
    const pre = `/api/campaigns/${enc(id)}/maps/`;
    for (const [url, src] of blobs) {
      if (url.startsWith(pre) && !keep.has(url) && V?.src !== src) {
        URL.revokeObjectURL(src);
        blobs.delete(url);
      }
    }
    const cache = await cacheOpen();
    if (!cache) return;
    for (const req of await cache.keys().catch(() => [])) {
      const u = new URL(req.url);
      if (u.pathname.startsWith(pre) && !keep.has(u.pathname + u.search)) await cache.delete(req).catch(() => {});
    }
  }
  // Only these campaigns' pictures stay on the phone.
  async function keepCampaigns(ids) {
    const keep = new Set(ids.map((x) => `/api/campaigns/${enc(x)}/maps/`));
    const ours = (path) => [...keep].some((k) => path.startsWith(k));
    for (const [url, src] of blobs) {
      if (!ours(url)) {
        URL.revokeObjectURL(src);
        blobs.delete(url);
      }
    }
    const cache = await cacheOpen();
    if (!cache) return;
    for (const req of await cache.keys().catch(() => [])) if (!ours(new URL(req.url).pathname)) await cache.delete(req).catch(() => {});
  }

  // A photo, shrunk to 2560 pixels on its long side and drawn again, so it
  // goes up small and nothing comes with it but the picture: no camera, no
  // place. WebP where the phone can make one, a JPEG where it can't.
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) throw new Error("empty");
      const k = Math.min(1, LONGEST / Math.max(nw, nh));
      const cw = Math.max(1, Math.round(nw * k));
      const ch = Math.max(1, Math.round(nh * k));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const g = canvas.getContext("2d");
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, cw, ch);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, cw, ch);
      const blobOf = (type, q) => new Promise((done) => canvas.toBlob(done, type, q));
      let blob = await blobOf("image/webp", 0.85);
      if (!blob || blob.type !== "image/webp") blob = await blobOf("image/jpeg", 0.86);
      if (!blob) throw new Error("no picture");
      return { blob, w: cw, h: ch };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Up to the Worker, saying how far it's got.
  function send(id, mid, name, blob, onProgress) {
    return new Promise((done) => {
      const x = new XMLHttpRequest();
      x.open("POST", `/api/campaigns/${enc(id)}/maps/${enc(mid)}${name ? `?name=${enc(name)}` : ""}`);
      x.timeout = 120000;
      x.setRequestHeader("content-type", blob.type);
      x.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      x.onload = () => {
        let got = {};
        try {
          got = JSON.parse(x.responseText);
        } catch {}
        done({ ok: x.status >= 200 && x.status < 300, status: x.status, got });
      };
      x.onerror = x.ontimeout = () => done({ ok: false, status: 0, got: {} });
      x.send(blob);
    });
  }

  // A picture going up: shrunk, sent, and kept on this phone straight away,
  // so it opens without coming back down.
  async function putUp(id, mid, name, file, { replacing = false } = {}) {
    if (up) return d.toast("A picture’s still going up. Give it a moment.", false);
    if (!file || !file.size) return d.toast("Pick a picture first.", false);
    if (!online()) return d.toast("Putting up a picture needs a signal.", false);
    const say = (text) => {
      up.text = text;
      const el = document.querySelector(".wm-up");
      if (el) el.textContent = text;
    };
    up = { mid, replacing, text: "Shrinking the picture on this phone…" };
    d.render();
    try {
      let small;
      try {
        small = await shrink(file);
      } catch {
        up = null;
        d.render();
        return d.toast("This phone can’t read that picture. Try a photo, a JPEG or a PNG.", false);
      }
      say("Sending it… 0%");
      const r = await send(id, mid, name, small.blob, (f) => say(`Sending it… ${Math.round(f * 100)}%`));
      if (r.status === 401) {
        up = null;
        return d.signedOut?.();
      }
      if (!r.ok) {
        up = null;
        d.render();
        return d.toast(r.got?.error || (r.status ? "That picture didn’t go up. Try again." : "The signal went before it got there. Try again."), false);
      }
      const m = r.got?.world?.maps?.find((x) => x.id === mid);
      if (m) {
        const cache = await cacheOpen();
        await cache?.put(srcOf(id, m), new Response(small.blob, { headers: { "content-type": small.blob.type } })).catch(() => {});
      }
      up = null;
      w.took(id, r.got);
      if (replacing) {
        ui.panel = "";
        d.render();
        d.toast("The new picture’s up. Its pins stayed where they were on it.", false);
      } else {
        ui = { ...fresh(), map: `${id}:${mid}` };
        d.go(mapHref(id, mid), { from: location.pathname + location.search });
        d.toast("The map’s up, and nothing on it shows on the crew’s phones yet. Tap Add a pin to drop your first one.", false);
      }
    } catch {
      up = null;
      d.render();
      d.toast("That picture didn’t go up. Try again.", false);
    }
  }

  // ------------------------------------------------------------ the World screen

  function token(id, m, gm) {
    const shown = m.pins.filter((p) => p.shown).length;
    const glance = gm
      ? m.pins.length ? `${plural(m.pins.length, "pin", "pins")}, ${shown ? `${shown} shown to the crew` : "none shown yet"}` : "No pins yet"
      : m.pins.length ? plural(m.pins.length, "pin", "pins") : "Nothing marked on it yet";
    const badge = gm ? `<span class="wb-k"><span class="wb-badge${m.shown ? " is-on" : ""}">${m.shown ? "Shown" : "Hidden"}</span></span>` : "";
    const glow = w.lit(id).includes(m.id) ? " is-new" : "";
    // Its picture, when this phone has it open already, or the map mark till
    // it's found in the cache.
    const src = blobs.get(srcOf(id, m));
    const thumb = src ? `<span class="wm-thumb has-pic" aria-hidden="true"><img src="${src}" alt=""></span>` : `<span class="wm-thumb" data-wm-thumb="${esc(srcOf(id, m))}" aria-hidden="true">${I.big}</span>`;
    return `<li class="wm-tok${glow}"><a class="card wb-tok-a wm-tok-a" href="${esc(mapHref(id, m.id))}" data-act="w" data-do="nav">
      ${thumb}
      <span class="wm-tok-in">${badge}<b class="wm-tok-n">${esc(m.name)}</b><span class="wm-tok-w">${glance}</span></span></a></li>`;
  }

  function upForm() {
    return `<form class="cc-form pt-form wm-up-form" data-form="w-mp-up">
      <p class="cc-lead">Any picture of a map works, one you’ve made or a photo of one drawn on paper. It’s shrunk on this phone before it goes up, and where a photo was taken stays off it. Nothing on it shows on your players’ phones till you show it to them.</p>
      <label class="cc-field">Its name <input name="name" maxlength="${MMAX.name}" autocomplete="off" required placeholder="like The Steeplands, or Under the Copper Baths"></label>
      <label class="cc-field wm-file">The picture <input type="file" name="pic" accept="image/*" required></label>
      <div class="cc-row"><button type="submit" class="button primary"${up ? " disabled" : ""}>Put it up</button></div>
      <p class="cc-small wm-up" role="status">${up && !up.replacing ? esc(up.text) : ""}</p></form>`;
  }

  // Maps, under places and people on the World screen and the World tab.
  function section(id) {
    const gm = isGm(id);
    const doc = docOf(id);
    const maps = doc.maps ?? [];
    if (!gm && !maps.length) return "";
    const shown = maps.filter((m) => m.shown).length;
    const lead = !gm ? ""
      : maps.length ? `<p class="cc-small wb-sum">${plural(maps.length, "map", "maps")}, ${shown ? `${shown} shown to the crew` : "none shown to the crew yet"}.</p>`
      : '<p class="cc-small">No maps yet. Put up a picture of one, and drop pins on it that open your places, people and factions. Nothing shows on your players’ phones till you show it to them.</p>';
    const list = maps.length ? `<ul class="wm-toks">${maps.map((m) => token(id, m, gm)).join("")}</ul>` : "";
    const add = gm ? `<div class="cc-folds wb-adds">${maps.length >= MMAX.maps ? `<p class="cc-small">That’s ${MMAX.maps} maps, which is as many as a world holds.</p>` : w.fold("mup", "Put up a map", "A picture, or a photo of one drawn on paper", upForm())}</div>` : "";
    return `<section class="cc-sec wm-sec" data-wb="${esc(id)}" aria-labelledby="wm-h"><h2 id="wm-h">Maps</h2>${lead}${list}${add}</section>`;
  }

  // On a page or a faction's page: the maps it's pinned on, and for her, a
  // way to pin it on one.
  function onMaps(id, target) {
    const gm = isGm(id);
    const doc = docOf(id);
    const hits = pinsTo(doc, target);
    const links = hits.map(({ map, pin }) => `<li><a class="pt-reword" href="${esc(mapHref(id, map.id, `&pin=${enc(pin.id)}`))}" data-act="w" data-do="nav">${esc(map.name)}</a>${gm && !(map.shown && pin.shown) ? " <small>Only you see it there</small>" : ""}</li>`).join("");
    const free = gm ? (doc.maps ?? []).filter((m) => m.pins.length < MMAX.pins) : [];
    const put = free.length ? `<p class="cc-small wm-put">Pin it on ${free.map((m) => `<a class="pt-reword" href="${esc(mapHref(id, m.id, `&put=${target.kind}:${enc(target.id)}`))}" data-act="w" data-do="nav">${esc(m.name)}</a>`).join(" · ")}</p>` : "";
    if (!links && !put) return "";
    return `<section class="cc-sec wm-on" aria-labelledby="wm-on-h"><h2 id="wm-on-h">On the map</h2>${links ? `<ul class="wp-ment-list">${links}</ul>` : ""}${put}</section>`;
  }

  // What's new for a player: a map they've just been shown, or a pin on one.
  function news(id, was, now) {
    const said = [];
    const keys = [];
    const before = new Map((was.maps ?? []).map((m) => [m.id, m]));
    for (const m of now.maps ?? []) {
      const b = before.get(m.id);
      if (!b) {
        said.push(`${gmName(id)} showed you a map, ${bare(m.name)}.`);
        keys.push(m.id);
        continue;
      }
      const pins = m.pins.filter((p) => !b.pins.some((x) => x.id === p.id));
      if (pins.length) {
        said.push(pins.length === 1 ? `There’s a new pin on ${bare(m.name)}${pins[0].label ? `, ${bare(pins[0].label)}` : ""}.` : `There are new pins on ${bare(m.name)}.`);
        keys.push(m.id);
      }
    }
    return { said, keys };
  }

  // ------------------------------------------------------------ one map, full screen

  function pinHtml(id, m, pin, doc, gm) {
    const t = targetOf(doc, pin.to);
    const name = labelOf(doc, pin);
    const say = `${name || "A pin with no name yet"}${t && t.name !== name ? `, ${t.name}` : ""}${gm && !(m.shown && pin.shown) ? ", only you see it" : ""}`;
    const cls = [gm && !pin.shown ? "is-hidden" : "", ui.pin === pin.id && ui.panel ? "is-on" : "", ui.mode === "move" && ui.pin === pin.id ? "is-moving" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="wm-pin ${cls}" style="left:${(pin.x * 100).toFixed(3)}%;top:${(pin.y * 100).toFixed(3)}%" data-act="w" data-do="mpin" data-pin="${esc(pin.id)}" aria-label="${esc(say)}">${markOf(kindOf(t))}${name ? `<span class="wm-pin-l" aria-hidden="true">${esc(name)}</span>` : ""}</button>`;
  }

  function pinsHtml(id, m, doc, gm) {
    const draft = ui.panel === "form" && ui.form === "new" && ui.draft
      ? `<span class="wm-pin is-draft" style="left:${(ui.draft.x * 100).toFixed(3)}%;top:${(ui.draft.y * 100).toFixed(3)}%" aria-hidden="true">${markOf("none")}</span>` : "";
    return m.pins.map((p) => pinHtml(id, m, p, doc, gm)).join("") + draft;
  }

  const sure = (key, yes, no) => (ui.sure === key ? yes : no);
  const sheet = (title, body, { cls = "" } = {}) => `<section class="wm-sheet${cls}" aria-labelledby="wm-sheet-h"><div class="wm-sheet-top"><h2 id="wm-sheet-h">${title}</h2><button type="button" class="cc-x" data-act="w" data-do="mclose" aria-label="Close">${I.close}</button></div>${body}</section>`;

  // One pin: what it is, what it opens, and for her, the crew's view of it
  // and her taps.
  function pinSheet(id, m, pin, doc, gm) {
    const t = targetOf(doc, pin.to);
    const name = labelOf(doc, pin) || (gm ? "A pin" : "Something’s here");
    const open = t && (gm || openToCrew(t)) ? `<a class="button primary wm-open" href="${esc(targetHref(id, t))}" data-act="w" data-do="nav">Open ${esc(t.name)}</a>` : "";
    const what = t ? `<p class="cc-small wm-what">${kindWord(t)}${t.name !== name ? `, ${esc(t.name)}` : ""}</p>` : "";
    if (!gm) {
      return sheet(esc(name), `${what}${open ? `<div class="cc-row">${open}</div>` : "<p class=\"cc-small\">That’s all the crew’s been shown about it so far.</p>"}`);
    }
    // What the crew sees of it: its own name, or the name of what it opens
    // once they've been shown that, and till then no name at all.
    const them = t && t.kind === "p" && t.page.kind === "person" ? "who they are" : "that";
    const how = pin.label
      ? `as <b>${esc(pin.label)}</b>${t ? (openToCrew(t) ? `, and it opens ${esc(t.name)} for them` : `. It opens ${esc(t.name)} for them once you’ve shown them ${them}`) : ""}`
      : !t ? "with no name" : openToCrew(t) ? `as <b>${esc(t.name)}</b>, and it opens it for them` : `with no name till you’ve shown them ${esc(t.name)}, then it takes that name and opens it for them`;
    const seen = pin.shown
      ? `The crew can see this pin${m.shown ? "" : " once you show them the map"}. They see it ${how}.`
      : `Only you see this pin. Shown, the crew sees it ${how}.`;
    // What it opens, shown to the crew from here too, so a pin and its page
    // can go out together without leaving the map.
    const also = t && !openToCrew(t) ? `<button type="button" class="button sm" data-act="w" data-do="mtshow" data-pin="${esc(pin.id)}">Show them ${esc(t.name)}${pin.shown ? " too" : ""}</button>` : "";
    const show = `<div class="wb-show${pin.shown ? " is-on" : ""}"><p class="cc-small">${seen}</p><div class="cc-row wm-shows"><button type="button" class="button sm${pin.shown ? "" : " primary"}" data-act="w" data-do="mpinshow" data-pin="${esc(pin.id)}" aria-pressed="${pin.shown}">${pin.shown ? "Hide it from the crew" : "Show the crew this pin"}</button>${also}</div></div>`;
    const acts = `<div class="cc-row wm-acts">${open}<button type="button" class="button sm" data-act="w" data-do="mmove" data-pin="${esc(pin.id)}">Move it</button><button type="button" class="button sm" data-act="w" data-do="medit" data-pin="${esc(pin.id)}">Change it</button><button type="button" class="button sm danger" data-act="w" data-do="munpin" data-pin="${esc(pin.id)}">${sure(`unpin-${pin.id}`, "Tap again to take it off", "Take it off")}</button></div>`;
    return sheet(esc(name), `${what}${show}${acts}`);
  }

  // A new pin, or one she's changing: what it opens, and its name on the map.
  function pinForm(id, m, pin, doc) {
    const to = pin?.to ? `${pin.to.k}:${pin.to.id}` : ui.preset ? `${ui.preset.k}:${ui.preset.id}` : "";
    const opt = (v, name) => `<option value="${esc(v)}"${v === to ? " selected" : ""}>${esc(name)}</option>`;
    const sorted = (list) => [...list].sort((a, b) => SORT(a.name).localeCompare(SORT(b.name)));
    const group = (label, items) => (items.length ? `<optgroup label="${label}">${items.join("")}</optgroup>` : "");
    const places = sorted(doc.pages.filter((p) => p.kind === "place")).map((p) => opt(`p:${p.id}`, p.name));
    const people = sorted(doc.pages.filter((p) => p.kind === "person")).map((p) => opt(`p:${p.id}`, p.name));
    const facs = sorted(doc.factions).map((f) => opt(`f:${f.id}`, f.name));
    const none = !places.length && !people.length && !facs.length ? '<p class="cc-small">Your places, people and factions show up here to pick from once they’re in the world.</p>' : "";
    return sheet(pin ? "Change this pin" : "A new pin", `<form class="cc-form wm-form" data-form="w-mp-pin" data-map="${esc(m.id)}" data-pin="${esc(pin?.id ?? "")}">
      <label class="cc-field">What it opens <select name="to"><option value="">Nothing, it’s just a name on the map</option>${group("Places", places)}${group("People", people)}${group("Factions", facs)}</select></label>
      <label class="cc-field">Its name on the map <input name="label" maxlength="${MMAX.label}" autocomplete="off" value="${esc(pin?.label ?? "")}" placeholder="The name of what it opens"></label>
      ${none}<div class="cc-row"><button type="submit" class="button primary">${pin ? "Save" : "Put the pin here"}</button><button type="button" class="button" data-act="w" data-do="mcancel">Cancel</button></div></form>`);
  }

  // Every pin on it, for the one she's after, or for anyone who'd rather pick
  // from a list than find it on the map.
  function listSheet(id, m, doc, gm) {
    const pins = [...m.pins].sort((a, b) => SORT(labelOf(doc, a)).localeCompare(SORT(labelOf(doc, b))));
    const items = pins.map((p) => {
      const t = targetOf(doc, p.to);
      const badge = gm ? `<span class="wb-badge${p.shown ? " is-on" : ""}">${p.shown ? "Shown" : "Hidden"}</span>` : "";
      return `<li><button type="button" class="wm-li${ui.pin === p.id ? " is-on" : ""}" data-act="w" data-do="mgo" data-pin="${esc(p.id)}"><span class="wm-li-m">${markOf(kindOf(t))}</span><span class="wm-li-n">${esc(labelOf(doc, p) || "A pin")}</span>${badge}</button></li>`;
    }).join("");
    const none = gm ? "No pins yet. Tap Add a pin, then say what it opens." : `${esc(gmName(id))} hasn’t shown the crew anything on this map yet.`;
    return sheet(`Pins on ${esc(m.name)}`, items ? `<ul class="wm-list">${items}</ul>` : `<p class="cc-small">${none}</p>`);
  }

  // The map itself, hers: showing it, its name, a new picture, and taking it out.
  function mapSheet(id, m) {
    const show = `<div class="wb-show wb-show-card${m.shown ? " is-on" : ""}"><p>${m.shown ? "The crew can see this map, and the pins you’ve shown them." : "The crew can’t see this map yet. Show it when they’ve got hold of it, or found their way here."}</p><button type="button" class="button${m.shown ? "" : " primary"}" data-act="w" data-do="mshow" aria-pressed="${m.shown}">${m.shown ? "Hide it from the crew" : "Show the crew this map"}</button></div>`;
    const name = `<form class="cc-form wm-form" data-form="w-mp-name" data-map="${esc(m.id)}"><label class="cc-field">Its name <input name="name" maxlength="${MMAX.name}" autocomplete="off" required value="${esc(m.name)}"></label><div class="cc-row"><button type="submit" class="button">Save the name</button></div></form>`;
    const pic = `<form class="cc-form wm-form" data-form="w-mp-pic" data-map="${esc(m.id)}"><label class="cc-field wm-file">A new picture for it <input type="file" name="pic" accept="image/*" required></label>
      <p class="cc-small">Its pins stay where they are on the picture, so a better photo of the same map keeps them close.</p>
      <div class="cc-row"><button type="submit" class="button"${up ? " disabled" : ""}>Put up the new picture</button></div><p class="cc-small wm-up" role="status">${up?.replacing ? esc(up.text) : ""}</p></form>`;
    const gone = `<div class="cc-row"><button type="button" class="button danger" data-act="w" data-do="mgone">${sure("gone", "Tap again: it goes, picture and pins", "Take it out of the world")}</button></div>`;
    return sheet(esc(m.name), `${show}${name}${pic}${gone}`);
  }

  function view(id, mid, v = {}) {
    const gm = isGm(id);
    const doc = docOf(id);
    const m = findMap(doc, mid);
    const [back, backLabel] = w.backOf(id);
    const top = w.topbar(back, backLabel);
    if (!m) {
      return `${top}<header class="cc-camp-head"><p class="kicker">The world</p><h1>Not in the world</h1></header>
        <div class="cc-note is-warn"><p>${camp(id).at || !online() ? "That map isn’t in the world any more, or the crew hasn’t been shown it." : "Opening the world…"}</p></div>`;
    }
    const key = `${id}:${mid}`;
    if (ui.map !== key) ui = { ...fresh(), map: key };
    // Straight to a pin, from a page it opens or the list.
    if ((v.pin || "") !== ui.from) {
      ui.from = v.pin || "";
      if (m.pins.some((p) => p.id === ui.from)) Object.assign(ui, { pin: ui.from, panel: "pin", centre: ui.from, mode: "" });
    }
    // A page or faction to pin on it, from its page.
    if (gm && (v.put || "") !== ui.put) {
      ui.put = v.put || "";
      const [k, tid] = ui.put.split(":");
      if ((k === "p" || k === "f") && tid) Object.assign(ui, { mode: "place", panel: "", pin: "", preset: { k, id: tid } });
    }
    const pin = m.pins.find((p) => p.id === ui.pin) ?? null;
    if (!pin && (ui.panel === "pin" || (ui.panel === "form" && ui.form !== "new"))) ui.panel = "";
    const placing = gm && ui.mode;
    const badge = gm ? `<span class="wb-badge${m.shown ? " is-on" : ""}">${m.shown ? "Shown" : "Only you"}</span>` : "";
    const n = m.pins.length;
    const bar = placing
      ? `<div class="wm-bar is-placing"><p class="wm-hint">${ui.mode === "move" ? "Move the map till the point’s where the pin goes." : "Move the map till the point’s where it goes, or tap the spot."}</p><div class="wm-bar-row"><button type="button" class="button" data-act="w" data-do="mcancel">Cancel</button><button type="button" class="button primary" data-act="w" data-do="mput">Put it here</button></div></div>`
      : `<div class="wm-bar">${gm ? `<button type="button" class="button primary" data-act="w" data-do="madd"${n >= MMAX.pins ? " disabled" : ""}>${I.pin}Add a pin</button>` : ""}<button type="button" class="button" data-act="w" data-do="mlist" aria-pressed="${ui.panel === "list"}">${I.list}Pins <span class="wm-n">${n}</span></button>${gm ? `<button type="button" class="button" data-act="w" data-do="mset" aria-pressed="${ui.panel === "map"}">${I.map}This map</button>` : ""}</div>`;
    const panel = ui.panel === "pin" && pin ? pinSheet(id, m, pin, doc, gm)
      : ui.panel === "form" && gm ? pinForm(id, m, ui.form === "new" ? null : pin, doc)
      : ui.panel === "list" ? listSheet(id, m, doc, gm)
      : ui.panel === "map" && gm ? mapSheet(id, m)
      : "";
    const zoom = panel ? "" : `<div class="wm-zoom" role="group" aria-label="Zoom"><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="in" aria-label="Zoom in">${I.plus}</button><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="out" aria-label="Zoom out">${I.minus}</button><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="fit" aria-label="See all of it">${I.fit}</button></div>`;
    return `<div class="wm" data-wb="${esc(id)}">${top}
      <header class="wm-head"><p class="kicker${gm ? " is-gm" : ""}">Map ${badge}</p><h1>${esc(m.name)}</h1></header>
      <div class="wm-frame${panel ? " has-sheet" : ""}${placing ? " is-placing" : ""}"><div class="wm-slot" data-wm-stage="${esc(key)}"></div>${zoom}${panel || bar}</div></div>`;
  }

  // ------------------------------------------------------------ the map itself

  // One map on screen: its picture in a layer that's moved and scaled as a
  // whole, with the pins on it counter-scaled so they stay the same size.
  // s is pixels on screen for each pixel of the picture, tx and ty where its
  // top left corner sits in the frame.
  function viewer(id, m) {
    const el = document.createElement("div");
    el.className = "wm-stage";
    el.tabIndex = 0;
    el.setAttribute("role", "region");
    el.setAttribute("aria-roledescription", "map");
    el.innerHTML = `<div class="wm-layer"><img class="wm-img" alt="" draggable="false" decoding="async"><div class="wm-pins"></div></div>
      <div class="wm-cross" aria-hidden="true">${markOf("none")}</div><div class="wm-msg" role="status"></div>`;
    const v = { id, mid: m.id, key: `${id}:${m.id}`, file: "", el, layer: el.querySelector(".wm-layer"), img: el.querySelector(".wm-img"), pinsEl: el.querySelector(".wm-pins"), msg: el.querySelector(".wm-msg"), w: m.w, h: m.h, W: 0, H: 0, s: 1, tx: 0, ty: 0, fit: 1, smax: 2, ready: false, src: "", anim: 0, placed: false };
    v.img.addEventListener("load", () => {
      if (!v.img.src) return;
      v.ready = true;
      el.classList.add("is-ready");
      v.msg.textContent = "";
    });
    // A picture that won't open comes off this phone, so trying again
    // fetches it fresh.
    v.img.addEventListener("error", () => {
      if (!v.img.src || V !== v) return;
      forget(srcOf(v.id, { id: v.mid, file: v.file }));
      stuck(v, '<p>The map didn’t open.</p><button type="button" class="button sm" data-act="w" data-do="mretry">Try again</button>');
    });
    bind(v);
    v.ro = new ResizeObserver(() => relayout(v));
    v.ro.observe(el);
    return v;
  }

  function load(v, m) {
    // A new picture of another size starts again from where it was left.
    if (v.placed && (v.w !== m.w || v.h !== m.h)) {
      remember(v);
      v.placed = false;
    }
    v.file = m.file;
    v.w = m.w;
    v.h = m.h;
    v.ready = false;
    v.el.classList.remove("is-ready", "is-stuck");
    v.layer.style.width = `${m.w}px`;
    v.layer.style.height = `${m.h}px`;
    v.msg.innerHTML = '<p>Opening the map…</p>';
    const file = m.file;
    picture(v.id, m).then((r) => {
      if (V !== v || v.file !== file) return;
      if (r.src) {
        v.src = r.src;
        v.img.src = r.src;
        return;
      }
      if (r.fail === "offline") return stuck(v, "<p>No signal, and this phone hasn’t opened this map before. It opens once there’s a signal.</p>");
      if (r.fail !== "gone") return stuck(v, '<p>The map didn’t open.</p><button type="button" class="button sm" data-act="w" data-do="mretry">Try again</button>');
      // Its picture's changed since this phone looked, most likely: the
      // world again, and the new one opens. If it's still this one, it's gone.
      v.msg.innerHTML = "<p>That map’s got a new picture. Opening it…</p>";
      Promise.resolve(w.refresh?.(v.id)).finally(() => {
        if (V === v && v.file === file && !v.ready) stuck(v, "<p>That map’s picture isn’t there any more.</p>");
      });
    });
  }
  function stuck(v, html) {
    v.el.classList.add("is-stuck");
    v.msg.innerHTML = html;
  }
  // A picture off this phone, from memory and the cache.
  function forget(url) {
    const src = blobs.get(url);
    if (src) URL.revokeObjectURL(src);
    blobs.delete(url);
    cacheOpen().then((c) => c?.delete(url)).catch(() => {});
  }

  const fitOf = (v) => Math.min(v.W / v.w, v.H / v.h);
  // Far enough in to read a hand-drawn map's writing, and never less than
  // three times what fits.
  const smaxOf = (v) => Math.max(v.fit * 3, 1.25);
  function bounds(v, s = v.s) {
    const sw = v.w * s;
    const sh = v.h * s;
    const x = sw <= v.W ? [(v.W - sw) / 2, (v.W - sw) / 2] : [v.W - sw, 0];
    const y = sh <= v.H ? [(v.H - sh) / 2, (v.H - sh) / 2] : [v.H - sh, 0];
    return { x, y };
  }
  const inside = (v, s, tx, ty) => {
    const b = bounds(v, s);
    return [clamp(tx, b.x[0], b.x[1]), clamp(ty, b.y[0], b.y[1])];
  };
  // Past an edge, it gives a little and pulls back when it's let go.
  const give = (x, lo, hi) => (x < lo ? lo - (lo - x) * 0.35 : x > hi ? hi + (x - hi) * 0.35 : x);
  function soft(v) {
    const b = bounds(v);
    v.tx = give(v.tx, b.x[0], b.x[1]);
    v.ty = give(v.ty, b.y[0], b.y[1]);
  }

  let frameQueued = 0;
  // A busy map shows its pins' names once it's zoomed in a way, so they
  // don't pile up on each other. The pin that's open always has its name.
  function draw(v) {
    v.layer.style.transform = `translate3d(${v.tx}px, ${v.ty}px, 0) scale(${v.s})`;
    v.layer.style.setProperty("--inv", String(1 / v.s));
    v.el.classList.toggle("is-crowded", v.crowd && v.s < v.fit * 1.8);
  }
  function frame(v) {
    if (frameQueued) return;
    frameQueued = requestAnimationFrame(() => {
      frameQueued = 0;
      draw(v);
    });
  }
  function stop(v) {
    cancelAnimationFrame(v.anim);
    v.anim = 0;
  }
  // To a new view, eased over a moment, with the pins scaled every frame so
  // they never change size on the way. Under reduce-motion it's just there.
  function to(v, s, tx, ty, ms = 240) {
    stop(v);
    if (calm() || ms <= 0) {
      Object.assign(v, { s, tx, ty });
      return draw(v);
    }
    const from = { s: v.s, tx: v.tx, ty: v.ty };
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - k) ** 3;
      v.s = from.s + (s - from.s) * e;
      v.tx = from.tx + (tx - from.tx) * e;
      v.ty = from.ty + (ty - from.ty) * e;
      draw(v);
      v.anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    v.anim = requestAnimationFrame(step);
  }
  // In or out by so much, keeping the point under (px, py) where it is.
  function zoomAt(v, factor, px, py, ms = 240) {
    const s = clamp(v.s * factor, v.fit, v.smax);
    const ix = (px - v.tx) / v.s;
    const iy = (py - v.ty) / v.s;
    const [tx, ty] = inside(v, s, px - ix * s, py - iy * s);
    to(v, s, tx, ty, ms);
  }
  function fitAll(v, ms = 240) {
    const [tx, ty] = inside(v, v.fit, 0, 0);
    to(v, v.fit, tx, ty, ms);
  }
  // Back inside its edges and its zoom, the way a drag or a pinch left it.
  function settle(v) {
    const s = clamp(v.s, v.fit, v.smax);
    const cx = (v.W / 2 - v.tx) / v.s;
    const cy = (v.H / 2 - v.ty) / v.s;
    const [tx, ty] = inside(v, s, s === v.s ? v.tx : v.W / 2 - cx * s, s === v.s ? v.ty : v.H / 2 - cy * s);
    if (s !== v.s || tx !== v.tx || ty !== v.ty) to(v, s, tx, ty, 200);
    remember(v, s, tx, ty);
  }
  // Where it was left, as how far in and what's in the middle, so it comes
  // back the same on another size of screen.
  const remember = (v, s = v.s, tx = v.tx, ty = v.ty) => {
    if (v.W) views.set(v.key, { rel: s / v.fit, cx: (v.W / 2 - tx) / s / v.w, cy: (v.H / 2 - ty) / s / v.h });
  };
  // A pin in view: centred across, and high enough to be seen over whatever's
  // open at the bottom. Zoomed in a little if it's all the way out.
  function centreOn(v, pin, { zoom = false, high = 0.4 } = {}) {
    const s = zoom && v.s < v.fit * 1.9 ? Math.min(v.smax, v.fit * 2.2) : v.s;
    const [tx, ty] = inside(v, s, v.W / 2 - pin.x * v.w * s, v.H * high - pin.y * v.h * s);
    to(v, s, tx, ty);
  }
  // The frame's size, from the screen. It keeps what's in the middle and how
  // far in it is when the phone turns, and starts where the map was left.
  function relayout(v) {
    if (!v.el.isConnected) return;
    const W = v.el.clientWidth;
    const H = v.el.clientHeight;
    if (!W || !H || (W === v.W && H === v.H && v.placed)) return;
    const was = v.placed ? { rel: v.s / v.fit, cx: (v.W / 2 - v.tx) / v.s / v.w, cy: (v.H / 2 - v.ty) / v.s / v.h } : views.get(v.key);
    v.W = W;
    v.H = H;
    v.fit = fitOf(v);
    v.smax = smaxOf(v);
    v.s = clamp((was?.rel ?? 1) * v.fit, v.fit, v.smax);
    const cx = was?.cx ?? 0.5;
    const cy = was?.cy ?? 0.5;
    [v.tx, v.ty] = inside(v, v.s, W / 2 - cx * v.w * v.s, H / 2 - cy * v.h * v.s);
    v.placed = true;
    stop(v);
    draw(v);
    pending(v);
  }
  // What a redraw asked for once the frame has its size: a pin to go to.
  function pending(v) {
    if (!v.placed) return;
    const m = findMap(docOf(v.id), v.mid);
    if (ui.centre) {
      const pin = m?.pins.find((p) => p.id === ui.centre);
      ui.centre = "";
      ui.reveal = false;
      if (pin) centreOn(v, pin, { zoom: true });
    } else if (ui.reveal) {
      ui.reveal = false;
      const pin = m?.pins.find((p) => p.id === ui.pin);
      const sheet = v.el.parentElement?.querySelector(".wm-sheet");
      if (pin && sheet) {
        const y = pin.y * v.h * v.s + v.ty;
        const room = v.H - sheet.offsetHeight;
        if (y > room - 12 || y < 48) centreOn(v, pin, { high: Math.max(0.2, (room / v.H) * 0.55) });
      }
    }
  }
  const spotAt = (v, px, py) => ({ x: (px - v.tx) / v.s / v.w, y: (py - v.ty) / v.s / v.h });
  const onMap = (p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  const tidy = (p) => ({ x: Math.round(clamp(p.x, 0, 1) * 10000) / 10000, y: Math.round(clamp(p.y, 0, 1) * 10000) / 10000 });

  // Drag with a finger or the mouse, pinch with two, double-tap to go in,
  // the wheel or a trackpad's pinch, and the keys. A tap on a pin is the
  // pin's own button, and a drag that starts on one moves the map instead.
  function bind(v) {
    const el = v.el;
    const pts = new Map();
    let g = null;
    let moved = 0;
    let swallow = false;
    let last = { t: 0, x: 0, y: 0 };
    let tapTimer = 0;
    const rel = (p) => {
      const r = el.getBoundingClientRect();
      return { x: p.x - r.left, y: p.y - r.top };
    };
    const pinchStart = () => {
      const [a, b] = [...pts.values()];
      const mid = rel({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      g = { kind: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: v.s, ix: (mid.x - v.tx) / v.s, iy: (mid.y - v.ty) / v.s };
      moved = 99;
      for (const pid of pts.keys()) {
        try {
          el.setPointerCapture(pid);
        } catch {}
      }
      el.classList.add("is-moving");
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".wm-msg")) return;
      // A first finger starts afresh, whatever a lost gesture left behind.
      if (e.isPrimary) {
        pts.clear();
        g = null;
      }
      stop(v);
      d.holdRenders?.(true);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        g = { kind: "pan", x0: e.clientX, y0: e.clientY, tx0: v.tx, ty0: v.ty, on: e.target, caught: false };
        moved = 0;
      } else if (pts.size === 2) pinchStart();
    });
    el.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId) || !g) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.kind === "pan") {
        const dx = e.clientX - g.x0;
        const dy = e.clientY - g.y0;
        moved = Math.max(moved, Math.hypot(dx, dy));
        if (!g.caught && moved > 6) {
          g.caught = true;
          try {
            el.setPointerCapture(e.pointerId);
          } catch {}
          el.classList.add("is-moving");
        }
        if (!g.caught) return;
        v.tx = g.tx0 + dx;
        v.ty = g.ty0 + dy;
      } else {
        const [a, b] = [...pts.values()];
        const mid = rel({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        let s = (g.s0 * Math.hypot(a.x - b.x, a.y - b.y)) / g.d0;
        s = s < v.fit ? v.fit - (v.fit - s) * 0.4 : s > v.smax ? v.smax + (s - v.smax) * 0.4 : s;
        v.s = s;
        v.tx = mid.x - g.ix * s;
        v.ty = mid.y - g.iy * s;
      }
      soft(v);
      frame(v);
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      // One finger off a pinch: the other carries on dragging.
      if (g?.kind === "pinch" && pts.size === 1) {
        const [p] = pts.values();
        g = { kind: "pan", x0: p.x, y0: p.y, tx0: v.tx, ty0: v.ty, on: null, caught: true };
        return;
      }
      if (pts.size) return;
      const was = g;
      g = null;
      el.classList.remove("is-moving");
      if (moved > 6) swallow = true;
      else if (was && e.type === "pointerup" && !was.on?.closest?.(".wm-pin")) tap(rel({ x: e.clientX, y: e.clientY }));
      settle(v);
      d.holdRenders?.(false);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    // A finger let go off the map (the bar, or past the edge) still ends it.
    addEventListener("pointerup", end, true);
    addEventListener("pointercancel", end, true);
    v.unbind = () => {
      removeEventListener("pointerup", end, true);
      removeEventListener("pointercancel", end, true);
    };
    // The click at the end of a drag that started on a pin isn't a tap on it.
    el.addEventListener("click", (e) => {
      if (!swallow) return;
      swallow = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);
    el.addEventListener("pointerdown", () => {
      swallow = false;
    }, true);
    function tap(p) {
      // Placing a pin: a tap on the map puts it there.
      if (ui.mode) {
        const at = spotAt(v, p.x, p.y);
        if (!onMap(at)) return d.toast("Put it on the map itself.", false);
        return put(v, tidy(at));
      }
      const now = performance.now();
      if (now - last.t < 320 && Math.hypot(p.x - last.x, p.y - last.y) < 30) {
        clearTimeout(tapTimer);
        last = { t: 0, x: 0, y: 0 };
        if (v.s >= v.smax * 0.92) fitAll(v);
        else zoomAt(v, 2.4, p.x, p.y);
        setTimeout(() => remember(v), 260);
        return;
      }
      last = { t: now, x: p.x, y: p.y };
      clearTimeout(tapTimer);
      // A tap on the map itself, away from the pins, puts away what's open.
      tapTimer = setTimeout(() => {
        if (ui.panel && ui.panel !== "form" && V === v && !pts.size) {
          ui.panel = "";
          ui.pin = "";
          d.render();
        }
      }, 330);
    }
    el.addEventListener("wheel", (e) => {
      if (!v.placed) return;
      e.preventDefault();
      const p = rel({ x: e.clientX, y: e.clientY });
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      zoomAt(v, k, p.x, p.y, 0);
      clearTimeout(v.wheel);
      v.wheel = setTimeout(() => remember(v), 200);
    }, { passive: false });
    el.addEventListener("keydown", (e) => {
      if (!v.placed || e.target !== el) return;
      const by = 64;
      const pan = (dx, dy) => {
        const [tx, ty] = inside(v, v.s, v.tx + dx, v.ty + dy);
        to(v, v.s, tx, ty, 120);
      };
      if (e.key === "ArrowLeft") pan(by, 0);
      else if (e.key === "ArrowRight") pan(-by, 0);
      else if (e.key === "ArrowUp") pan(0, by);
      else if (e.key === "ArrowDown") pan(0, -by);
      else if (e.key === "+" || e.key === "=") zoomAt(v, 1.6, v.W / 2, v.H / 2);
      else if (e.key === "-" || e.key === "_") zoomAt(v, 1 / 1.6, v.W / 2, v.H / 2);
      else if (e.key === "0") fitAll(v);
      else if (e.key === "Escape" && (ui.panel || ui.mode)) {
        Object.assign(ui, { panel: "", mode: "", draft: null, form: "" });
        d.render();
      } else return;
      e.preventDefault();
      setTimeout(() => remember(v), 260);
    });
  }

  // Where the pin she's placing goes: a new one opens its form, and one she's
  // moving goes straight there.
  function put(v, at) {
    const id = v.id;
    if (ui.mode === "move") {
      const m = findMap(docOf(id), v.mid);
      const pin = m?.pins.find((p) => p.id === ui.pin);
      ui.mode = "";
      if (!pin) return d.render();
      ui.panel = "pin";
      if (!edit(id, [{ o: "m-pin", id: m.id, pin: { ...pin, ...at } }], "Moved.")) d.render();
      return;
    }
    Object.assign(ui, { mode: "", draft: at, panel: "form", form: "new", pin: "" });
    d.render();
  }

  // The map's element into the screen just drawn, with its pins as the world
  // now has them.
  function after(app) {
    const slot = app.querySelector("[data-wm-stage]");
    document.documentElement.classList.toggle("cc-mapping", Boolean(slot));
    thumbs(app);
    if (!slot) {
      // Off the map, placing a pin stops.
      if (ui.mode || ui.panel === "form") Object.assign(ui, { mode: "", draft: null, panel: ui.panel === "form" ? "" : ui.panel });
      return;
    }
    const [id, mid] = slot.dataset.wmStage.split(":");
    const doc = docOf(id);
    const m = findMap(doc, mid);
    if (!m) return;
    if (!V || V.key !== `${id}:${mid}`) {
      if (V?.placed) remember(V);
      V?.ro.disconnect();
      V?.unbind?.();
      V = viewer(id, m);
    }
    if (V.file !== m.file) load(V, m);
    slot.replaceWith(V.el);
    V.el.setAttribute("aria-label", `${m.name}. Drag to move it, and pinch or use the buttons to zoom.`);
    V.pinsEl.innerHTML = pinsHtml(id, m, doc, isGm(id));
    V.crowd = m.pins.length > 12;
    V.el.classList.toggle("is-placing", Boolean(ui.mode));
    if (V.placed && V.W === V.el.clientWidth && V.H === V.el.clientHeight) {
      draw(V);
      pending(V);
    } else relayout(V);
  }

  // The thumbnails of maps this phone has seen, each in once it's ready.
  function thumbs(app) {
    for (const el of app.querySelectorAll("[data-wm-thumb]")) {
      kept(el.dataset.wmThumb).then((src) => {
        if (!src || !el.isConnected) return;
        const img = new Image();
        img.alt = "";
        img.onload = () => {
          if (!el.isConnected) return;
          el.replaceChildren(img);
          el.classList.add("has-pic");
        };
        img.src = src;
      }).catch(() => {});
    }
  }

  // ------------------------------------------------------------ taps

  const here = (el) => {
    const id = el.closest("[data-wb]")?.dataset.wb;
    const m = id ? findMap(docOf(id), ui.map.split(":")[1]) : null;
    return { id, m, doc: id ? docOf(id) : null };
  };
  const again = (key) => {
    if (ui.sure === key) return true;
    ui.sure = key;
    d.render();
    return false;
  };

  const ACT = {
    mpin(el) {
      const pid = el.dataset.pin;
      if (ui.mode) return;
      Object.assign(ui, { pin: pid, panel: "pin", sure: "", reveal: true });
      d.render();
    },
    mgo(el) {
      Object.assign(ui, { pin: el.dataset.pin, panel: "pin", sure: "", centre: el.dataset.pin });
      d.render();
    },
    mclose() {
      Object.assign(ui, { panel: "", pin: "", sure: "", form: "", draft: null });
      d.render();
      V?.el.focus({ preventScroll: true });
    },
    mlist() {
      Object.assign(ui, { panel: ui.panel === "list" ? "" : "list", sure: "" });
      d.render();
    },
    mset() {
      Object.assign(ui, { panel: ui.panel === "map" ? "" : "map", sure: "" });
      d.render();
    },
    mzoom(el) {
      if (!V?.placed) return;
      const z = el.dataset.z;
      if (z === "fit") fitAll(V);
      else zoomAt(V, z === "in" ? 1.6 : 1 / 1.6, V.W / 2, V.H / 2);
      setTimeout(() => V && remember(V), 260);
    },
    madd(el) {
      const { m } = here(el);
      if (!m) return;
      if (m.pins.length >= MMAX.pins) return d.toast(`That’s ${MMAX.pins} pins, which is as many as a map holds.`, false);
      Object.assign(ui, { mode: "place", panel: "", pin: "", sure: "", draft: null });
      d.render();
    },
    mput() {
      if (!V?.placed || !ui.mode) return;
      const at = spotAt(V, V.W / 2, V.H / 2);
      if (!onMap(at)) return d.toast("Move the map till the point’s on it.", false);
      put(V, tidy(at));
    },
    mcancel() {
      const back = ui.form && ui.form !== "new" ? "pin" : ui.mode === "move" ? "pin" : "";
      Object.assign(ui, { mode: "", draft: null, form: "", panel: back, preset: back ? ui.preset : null });
      d.render();
    },
    mmove(el) {
      const { m } = here(el);
      const pin = m?.pins.find((p) => p.id === el.dataset.pin);
      if (!pin) return;
      Object.assign(ui, { mode: "move", panel: "", pin: pin.id, sure: "" });
      d.render();
      if (V?.placed) centreOn(V, pin, { zoom: true, high: 0.5 });
    },
    medit(el) {
      Object.assign(ui, { panel: "form", form: el.dataset.pin, pin: el.dataset.pin, sure: "" });
      d.render();
    },
    munpin(el) {
      const { id, m, doc } = here(el);
      const pin = m?.pins.find((p) => p.id === el.dataset.pin);
      if (!pin || !again(`unpin-${pin.id}`)) return;
      Object.assign(ui, { panel: "", pin: "", sure: "" });
      edit(id, [{ o: "m-unpin", id: m.id, pin: pin.id }], "That pin’s off the map.");
    },
    mpinshow(el) {
      const { id, m, doc } = here(el);
      const pin = m?.pins.find((p) => p.id === el.dataset.pin);
      if (!pin) return;
      const v = !pin.shown;
      ui.sure = "";
      edit(id, [{ o: "m-pin-show", id: m.id, pin: pin.id, v }], v ? `The crew can see ${labelOf(doc, pin) || "that pin"} now${m.shown ? "" : ", once you show them the map"}.` : "Hidden from the crew again.");
    },
    // What a pin opens, shown to the crew: a page, or a faction's card.
    mtshow(el) {
      const { id, m, doc } = here(el);
      const pin = m?.pins.find((p) => p.id === el.dataset.pin);
      const t = pin ? targetOf(doc, pin.to) : null;
      if (!t || openToCrew(t)) return;
      ui.sure = "";
      edit(id, [t.kind === "f" ? { o: "show", id: t.id, p: "card", v: true } : { o: "p-show", id: t.id, p: "page", v: true }], `The crew can see ${bare(t.name)} now${pin.shown ? ", and the pin opens it for them" : ""}.`);
    },
    mshow(el) {
      const { id, m } = here(el);
      if (!m) return;
      const v = !m.shown;
      ui.sure = "";
      edit(id, [{ o: "m-show", id: m.id, v }], v ? `The crew can see ${bare(m.name)} now, with whichever pins you’ve shown them.` : "Hidden from the crew again.");
    },
    mgone(el) {
      const { id, m } = here(el);
      if (!m || !again("gone")) return;
      ui = fresh();
      if (edit(id, [{ o: "m-gone", id: m.id }], "", { undoable: false, quiet: true })) {
        d.go(`/characters/?camp=${enc(id)}&world`, { replace: true });
        d.toast("That map’s out of the world, picture and pins.", false);
      }
    },
    mretry() {
      if (!V) return;
      const m = findMap(docOf(V.id), V.mid);
      if (!m) return;
      V.img.removeAttribute("src");
      load(V, m);
    },
  };

  function submit(kind, form, f, id) {
    const doc = docOf(id);
    const text = (name, max) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    if (kind === "w-mp-up") {
      const name = text("name", MMAX.name);
      if (!name) return d.toast("Give it a name first.", false);
      if ((doc.maps ?? []).length >= MMAX.maps) return d.toast(`That’s ${MMAX.maps} maps, which is as many as a world holds.`, false);
      return putUp(id, newId(), name, f.get("pic"));
    }
    const m = findMap(doc, form.dataset.map);
    if (!m) return;
    if (kind === "w-mp-pic") return putUp(id, m.id, "", f.get("pic"), { replacing: true });
    if (kind === "w-mp-name") {
      const name = text("name", MMAX.name);
      if (!name) return d.toast("Give it a name first.", false);
      ui.panel = "";
      if (!edit(id, [{ o: "m-set", id: m.id, f: "name", v: name }], "Renamed.")) d.render();
      return;
    }
    if (kind === "w-mp-pin") {
      const [k, tid] = String(f.get("to") ?? "").split(":");
      const to = (k === "p" || k === "f") && tid ? { k, id: tid } : null;
      let label = text("label", MMAX.label);
      const t = targetOf(doc, to);
      // Its name's what it opens unless she says otherwise.
      if (t && label === t.name) label = "";
      if (!to && !label) return d.toast("Give it a name, or pick what it opens.", false);
      const old = form.dataset.pin ? m.pins.find((p) => p.id === form.dataset.pin) : null;
      if (old) {
        Object.assign(ui, { panel: "pin", form: "" });
        if (!edit(id, [{ o: "m-pin", id: m.id, pin: { ...old, label, to } }], "Saved.")) d.render();
        return;
      }
      const at = ui.draft;
      if (!at) return;
      if (m.pins.length >= MMAX.pins) return d.toast(`That’s ${MMAX.pins} pins, which is as many as a map holds.`, false);
      const pin = { id: newId(), x: at.x, y: at.y, label, to };
      Object.assign(ui, { panel: "pin", form: "", draft: null, pin: pin.id, preset: null });
      edit(id, [{ o: "m-pin", id: m.id, pin }], "Pinned. Only you see it till you show the crew.");
    }
  }

  return {
    section,
    view,
    after,
    onMaps,
    news,
    ACT,
    submit,
    title: (id, mid) => findMap(docOf(id), mid)?.name ?? "A map",
    count: (doc) => (doc.maps ?? []).length,
    shownCount: (doc) => (doc.maps ?? []).filter((m) => m.shown).length,
    prune: (id) => prune(id, docOf(id).maps ?? []).catch(() => {}),
    keepCampaigns: (ids) => keepCampaigns(ids).catch(() => {}),
  };
}
