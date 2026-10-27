// Maps on the World screen and the World tab (stage 4 of notes/worlds-plan.md),
// under places and people, and each map full screen.
//
// The GM puts a map up from a photo of one she's drawn or any picture on her
// phone. Her phone shrinks it to 4096 pixels on its longest side and a small
// copy for lists, turns it if the photo came out sideways, and sends both to
// the Worker (src/worker/maps.js), which keeps them under the campaign. The
// map itself, its name and its pins, goes in the world like everything else
// (maps.js), so it's changed and kept in step the same way. Everything starts
// hidden: she shows the crew a map in a tap, and each pin in its own. A pin
// shows the crew its name, and opens its page once she's shown them that too.
//
// A map opens full screen, moved and zoomed in one hand (mapview.js). She
// drops a pin by moving the map till the spot's under the cross in the middle,
// which is easier to get right than a thumb that covers what it's pointing at.
//
// The pictures are kept on the phone in the cache zi-maps, by the address
// they came from, so a map that's been seen once opens with no signal. The
// service worker leaves that cache alone, a picture the crew's no longer
// shown comes off the phone the next time the world comes in, and signing
// out takes the lot (sync.js).
import { MMAX, findMap, labelOf, shownToCrew, targetOf } from "./maps.js";
import { findPage } from "./pages.js";
import { makeViewer } from "./mapview.js";

const CACHE = "zi-maps";
const SORT = (t) => String(t ?? "").replace(/^(The|A|An) /i, "").toLowerCase();
const flat = (t) => String(t ?? "").replace(/\*/g, "");
const KIND = { p: "Page", place: "Place", person: "Person", f: "Faction", name: "Pin" };
const svg = (body) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK = {
  place: svg('<path d="M4 20V9l8-5 8 5v11"/><path d="M9.5 20v-6h5v6"/>'),
  person: svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c.8-4.2 3.8-6.5 7.5-6.5s6.7 2.3 7.5 6.5"/>'),
  faction: svg('<path d="M6 21V3.5"/><path d="M6 4h12l-3 4.5 3 4.5H6"/>'),
  name: svg('<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>'),
  map: svg('<path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.4 5.5-2.2V4.2L15 6.4z"/><path d="M9 4v13.6M15 6.4V20"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  whole: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  pin: svg('<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  turn: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
};

export function makeMaps(w) {
  const { d, esc, edit, docOf, isGm, camp, gmName, status, online, newId, bare, plural } = w;
  // What's open on the map screen: the pin whose card's up, the list of pins,
  // and dropping, moving or picking for a pin.
  let ui = { at: "", pin: "", panel: false, placing: null, picking: null, naming: "", focus: "", asked: "", lit: [] };
  // A picture on its way up: { id, map, src, w, h, turn, name, of, preview, busy, pct, error }
  let draft = null;
  // The map on screen, kept through the screen being drawn again around it.
  let view = null;
  let find = "";

  // ------------------------------------------------------------ the pictures, kept on the phone

  const urls = new Map();
  const loading = new Map();
  const addr = (id, m, small = false) => `/api/campaigns/${encodeURIComponent(id)}/maps/${encodeURIComponent(m.id)}?k=${encodeURIComponent(m.key)}${small ? "&t=1" : ""}`;
  const full = (src) => new URL(src, location.origin).href;
  const box = async () => {
    try {
      return await caches.open(CACHE);
    } catch {
      return null;
    }
  };
  // A picture's address on this phone: from memory, the phone's copy, or the
  // Worker (and kept), or null if it hasn't got it and can't get it.
  function picture(src) {
    if (urls.has(src)) return Promise.resolve(urls.get(src));
    if (loading.has(src)) return loading.get(src);
    const job = (async () => {
      const c = await box();
      let res = (await c?.match(full(src)).catch(() => null)) ?? null;
      if (!res && online()) {
        const r = await fetch(src, { credentials: "same-origin", cache: "no-store" }).catch(() => null);
        if (r?.ok && /^image\//.test(r.headers.get("content-type") || "")) {
          await c?.put(full(src), r.clone()).catch(() => {});
          res = r;
        }
      }
      if (!res) return null;
      const url = URL.createObjectURL(await res.blob());
      urls.set(src, url);
      return url;
    })().catch(() => null).finally(() => loading.delete(src));
    loading.set(src, job);
    return job;
  }
  // Kept on the phone without opening it, for later.
  async function stash(src) {
    if (urls.has(src) || loading.has(src)) return;
    const c = await box();
    if (!c || (await c.match(full(src)).catch(() => null))) return;
    const r = await fetch(src, { credentials: "same-origin", cache: "no-store" }).catch(() => null);
    if (r?.ok && /^image\//.test(r.headers.get("content-type") || "")) await c.put(full(src), r).catch(() => {});
  }
  async function keep(src, blob) {
    const c = await box();
    await c?.put(full(src), new Response(blob, { headers: { "content-type": blob.type } })).catch(() => {});
  }
  // The world's come in: pictures it doesn't have any more come off the
  // phone, and the ones it has that the phone hasn't got yet come down, one
  // at a time, so the maps open with no signal later.
  let fetching = Promise.resolve();
  async function got(id) {
    const doc = docOf(id);
    const mine = new Set(doc.maps.flatMap((m) => [addr(id, m), addr(id, m, true)]));
    const base = `/api/campaigns/${encodeURIComponent(id)}/maps/`;
    const c = await box();
    if (c) for (const req of await c.keys().catch(() => [])) if (req.url.startsWith(full(base)) && !mine.has(req.url.slice(location.origin.length))) await c.delete(req).catch(() => {});
    for (const [src, url] of urls) {
      if (!src.startsWith(base) || mine.has(src) || view?.src === src) continue;
      URL.revokeObjectURL(url);
      urls.delete(src);
    }
    if (!online() || navigator.connection?.saveData) return;
    for (const m of doc.maps) fetching = fetching.then(() => picture(addr(id, m, true))).then(() => stash(addr(id, m)));
    fetching = fetching.then(() => thumbs());
  }
  // Small pictures on the World screen fill in as they come.
  function thumbs() {
    for (const el of document.querySelectorAll("#app [data-thumb]")) {
      const src = el.dataset.thumb;
      if (urls.has(src)) {
        if (!el.querySelector("img")) el.innerHTML = `<img src="${urls.get(src)}" alt="">`;
        continue;
      }
      picture(src).then((url) => {
        if (url && el.isConnected && !el.querySelector("img")) el.innerHTML = `<img src="${url}" alt="">`;
      });
    }
  }

  // ------------------------------------------------------------ reading the world

  const mapHref = (id, m, pin = "") => `/characters/?camp=${encodeURIComponent(id)}&world&m=${encodeURIComponent(m.id ?? m)}${pin ? `&pin=${encodeURIComponent(pin)}` : ""}`;
  const pageHref = (id, to) => `/characters/?camp=${encodeURIComponent(id)}&world&${to.k}=${encodeURIComponent(to.id)}`;
  // What a pin is: a place, a person, a faction, or a pin that's only a name.
  function kindOf(doc, pin) {
    const t = targetOf(doc, pin.to);
    if (!t) return "name";
    return pin.to.k === "f" ? "faction" : t.kind;
  }
  const kindName = (k) => ({ place: "Place", person: "Person", faction: "Faction", name: "Pin" })[k];
  const theName = (k) => (k === "faction" ? "the faction" : "the page");
  // Everything a pin can open, for her to pick from: places, people, factions.
  function targets(doc) {
    const pages = [...doc.pages].sort((a, b) => (a.kind === b.kind ? SORT(a.name).localeCompare(SORT(b.name)) : a.kind === "place" ? -1 : 1));
    return [
      ...pages.map((p) => ({ k: "p", id: p.id, name: p.name, kind: p.kind })),
      ...[...doc.factions].sort((a, b) => SORT(a.name).localeCompare(SORT(b.name))).map((f) => ({ k: "f", id: f.id, name: f.name, kind: "faction" })),
    ];
  }

  // ------------------------------------------------------------ the World screen

  function token(id, m, gm, lit) {
    const shownN = m.pins.filter((p) => p.shown).length;
    const glance = m.pins.length ? `${plural(m.pins.length, "pin", "pins")}${gm ? `, ${shownN ? `${shownN} shown to the crew` : "none shown yet"}` : ""}` : "No pins yet";
    const src = addr(id, m, true);
    const pic = urls.has(src) ? `<img src="${urls.get(src)}" alt="">` : `<span class="wm-thumb-mark">${MARK.map}</span>`;
    const badge = gm ? `<span class="wb-k"><span class="wb-badge${m.shown ? " is-on" : ""}">${m.shown ? "Shown" : "Hidden"}</span></span>` : "";
    return `<li class="wm-tok${lit ? " is-new" : ""}"><a class="card wm-tok-a" href="${esc(mapHref(id, m))}" data-act="w" data-do="nav">
      <span class="wm-thumb" data-thumb="${esc(src)}">${pic}</span>
      <span class="wm-tok-in">${badge}<b class="wm-tok-n">${esc(m.name)}</b><span class="wm-tok-w">${glance}</span></span></a></li>`;
  }

  function section(id) {
    const gm = isGm(id);
    const doc = docOf(id);
    if (!gm && !doc.maps.length) return "";
    const lit = w.lit(id);
    const shownN = doc.maps.filter((m) => m.shown).length;
    const lead = !gm ? ""
      : doc.maps.length ? `<p class="cc-small wb-sum">${plural(doc.maps.length, "map", "maps")}, ${shownN ? `${shownN} shown to the crew` : "none shown to the crew yet"}.</p>`
      : '<p class="cc-small">No maps yet. Put one up from a photo of one you’ve drawn, or any picture on your phone. Nothing shows on your players’ phones till you show it to them.</p>';
    const list = doc.maps.length ? `<ul class="wm-toks">${doc.maps.map((m) => token(id, m, gm, lit.includes(m.id))).join("")}</ul>` : "";
    const add = gm ? `<div class="cc-folds wb-adds">${putUp(id, doc)}</div>` : "";
    return `<section class="cc-sec wm-sec" data-wb="${esc(id)}" aria-labelledby="wm-h"><h2 id="wm-h">Maps</h2>${lead}${list}${add}</section>`;
  }

  // Putting a map up: pick a picture, turn it if it came out sideways, name it.
  const chooser = (id, label, map = "") => `<label class="button${map ? "" : " primary"} wm-choose">${map ? "" : MARK.map}${label}<input type="file" accept="image/*" data-wmfile="${esc(id)}"${map ? ` data-wmmap="${esc(map)}"` : ""}></label>`;
  function draftBody(id, doc, dr) {
    const places = doc.pages.filter((p) => p.kind === "place").sort((a, b) => SORT(a.name).localeCompare(SORT(b.name)));
    const busy = dr.busy ? `<p class="cc-small wm-busy" role="status">${esc(dr.busy)}${dr.pct ? ` ${dr.pct}%` : ""}</p>` : "";
    const error = dr.error ? `<p class="cc-note is-warn wm-err" role="alert">${esc(dr.error)}</p>` : "";
    if (!dr.preview) return `${busy}${error}${dr.error ? `<div class="cc-row">${chooser(id, "Choose another picture", dr.map)}</div>` : ""}`;
    const naming = dr.map ? "" : `<label class="cc-field">Its name <input name="name" maxlength="${MMAX.name}" autocomplete="off" required value="${esc(dr.name ?? "")}" placeholder="like The Steeplands" data-wmdraft="name"></label>
      ${places.length ? `<label class="cc-field">A map of <select name="of" data-wmdraft="of"><option value="">Nowhere in particular</option>${places.map((p) => `<option value="${esc(p.id)}"${dr.of === p.id ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>` : ""}`;
    return `<div class="wm-draft">
      <div class="wm-draft-pic"><img src="${dr.preview}" width="${dr.pw}" height="${dr.ph}" alt="The picture, the way it’ll go up"></div>
      <div class="cc-row wm-draft-tools"><button type="button" class="button" data-act="w" data-do="mturn"${dr.busy ? " disabled" : ""}>${MARK.turn}Turn it</button>${chooser(id, "Pick another", dr.map)}</div>
      <form class="cc-form pt-form wm-draft-form" data-form="w-map-new">${naming}
        ${busy}${error}
        <div class="cc-row"><button type="submit" class="button primary"${dr.busy ? " disabled" : ""}>${dr.map ? "Put the new picture up" : "Put it up"}</button><button type="button" class="button" data-act="w" data-do="mdraftx">Cancel</button></div>
        ${online() ? "" : '<p class="cc-small">You’ll need a signal to put it up.</p>'}</form></div>`;
  }
  function putUp(id, doc) {
    const dr = draft?.id === id && !draft.map ? draft : null;
    const maxed = doc.maps.length >= MMAX.maps;
    const body = dr ? draftBody(id, doc, dr)
      : maxed ? `<p class="cc-small">That’s ${MMAX.maps} maps, which is as many as a world holds. Take one down to put up another.</p>`
      : `<p class="cc-lead">A photo of one you’ve drawn works, or any picture on your phone. Shoot a paper map flat, from straight above, in good light. It goes up sharp enough to read close up, and only you see it till you show the crew.</p>
        <div class="cc-row">${chooser(id, "Choose a picture")}</div>${online() ? "" : '<p class="cc-small">You’ll need a signal to put it up.</p>'}`;
    return w.fold("mput", "Put up a map", dr ? (dr.busy ? "Getting it ready" : "Ready to go up") : "From a photo, or a picture on your phone", body);
  }

  // ------------------------------------------------------------ getting a picture ready

  // A picture, opened the right way up, whatever the phone wrote in it.
  async function open(file) {
    try {
      const b = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { pic: b, w: b.width, h: b.height };
    } catch {}
    const url = URL.createObjectURL(file);
    try {
      const im = new Image();
      im.src = url;
      await im.decode();
      return { pic: im, w: im.naturalWidth, h: im.naturalHeight, url };
    } catch {
      URL.revokeObjectURL(url);
      return null;
    }
  }
  // Drawn no bigger than max on its longest side, turned a quarter at a time.
  function canvasOf(src, turn, max) {
    const k = Math.min(1, max / Math.max(src.w, src.h));
    const cw = Math.max(1, Math.round(src.w * k));
    const ch = Math.max(1, Math.round(src.h * k));
    const side = turn % 2 === 1;
    const c = document.createElement("canvas");
    c.width = side ? ch : cw;
    c.height = side ? cw : ch;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.translate(c.width / 2, c.height / 2);
    g.rotate((turn * Math.PI) / 2);
    g.drawImage(src.pic, -cw / 2, -ch / 2, cw, ch);
    return c;
  }
  const blobOf = (c, type, q) => new Promise((ok) => c.toBlob((b) => ok(b), type, q));
  // WebP where the phone can make it, a JPEG where it can't, and smaller
  // till it fits.
  async function squeeze(c, max) {
    for (const q of [0.86, 0.76, 0.64, 0.5]) {
      let b = await blobOf(c, "image/webp", q);
      if (!b || b.type !== "image/webp") b = await blobOf(c, "image/jpeg", q + 0.02);
      if (b && b.size <= max) return b;
    }
    return null;
  }
  async function preview(dr) {
    const c = canvasOf(dr.src, dr.turn, 900);
    const b = await blobOf(c, "image/jpeg", 0.8);
    // Its size, so the screen keeps room for it while it's drawn again.
    [dr.pw, dr.ph] = [c.width, c.height];
    c.width = c.height = 0;
    if (dr.preview) URL.revokeObjectURL(dr.preview);
    dr.preview = b ? URL.createObjectURL(b) : "";
  }
  function dropDraft() {
    if (!draft) return;
    if (draft.preview) URL.revokeObjectURL(draft.preview);
    if (draft.src?.url) URL.revokeObjectURL(draft.src.url);
    draft.src?.pic?.close?.();
    draft = null;
  }
  async function choose(id, file, map = "") {
    if (!file) return;
    dropDraft();
    const dr = { id, map, turn: 0, name: "", of: "", busy: "Opening it…", pct: 0, error: "" };
    draft = dr;
    d.render();
    const src = await open(file);
    if (draft !== dr) return src?.pic?.close?.();
    if (!src || !src.w || !src.h) {
      dr.busy = "";
      dr.error = "That picture didn’t open on this phone. Try a photo, a JPEG or a PNG.";
      return d.render();
    }
    dr.src = src;
    await preview(dr);
    dr.busy = "";
    d.render();
  }

  // Up it goes: the picture and its small copy to the Worker, then the map
  // (or its new picture) in the world.
  function send(id, pic, thumb, onPct) {
    return new Promise((ok) => {
      const x = new XMLHttpRequest();
      x.open("POST", `/api/campaigns/${encodeURIComponent(id)}/maps`);
      x.withCredentials = true;
      x.timeout = 120000;
      x.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
      x.onload = () => {
        let got = {};
        try {
          got = JSON.parse(x.responseText);
        } catch {}
        ok({ status: x.status, got });
      };
      x.onerror = x.ontimeout = () => ok({ status: 0, got: {} });
      const f = new FormData();
      f.append("pic", pic, "map");
      f.append("thumb", thumb, "thumb");
      x.send(f);
    });
  }
  async function putItUp(id, form) {
    const dr = draft;
    if (!dr || dr.id !== id || !dr.src || dr.busy) return;
    const name = String(new FormData(form).get("name") ?? dr.name ?? "").replace(/\s+/g, " ").trim().slice(0, MMAX.name);
    if (!dr.map && !name) return d.toast("Give it a name first.", false);
    if (!online()) return d.toast("You’ll need a signal to put it up.", false);
    if (!dr.map && docOf(id).maps.length >= MMAX.maps) return d.toast(`That’s ${MMAX.maps} maps, which is as many as a world holds.`, false);
    dr.name = name;
    dr.error = "";
    dr.busy = "Getting it ready…";
    d.render();
    // A beat for the screen to say so before the phone gets busy.
    await new Promise((r) => setTimeout(r, 30));
    const big = canvasOf(dr.src, dr.turn, MMAX.side);
    const small = canvasOf(dr.src, dr.turn, 640);
    const [pic, thumb] = [await squeeze(big, 8 * 1024 * 1024), await squeeze(small, 380 * 1024)];
    const size = { w: big.width, h: big.height };
    big.width = big.height = small.width = small.height = 0;
    if (draft !== dr) return;
    if (!pic || !thumb) {
      dr.busy = "";
      dr.error = "This phone couldn’t shrink that picture enough. Try a smaller one.";
      return d.render();
    }
    dr.busy = "Sending it up…";
    d.render();
    const r = await send(id, pic, thumb, (pct) => {
      dr.pct = pct;
      const el = document.querySelector("#app .wm-busy");
      if (el) el.textContent = `Sending it up… ${pct}%`;
    });
    if (draft !== dr) return;
    dr.busy = "";
    dr.pct = 0;
    if (r.status !== 200 || !r.got.key) {
      if (r.status === 401) return d.signedOut?.();
      dr.error = r.got.error || "It didn’t go up. Try again when the signal’s better.";
      return d.render();
    }
    const key = r.got.key;
    const m = dr.map ? findMap(docOf(id), dr.map) : { id: newId(), name, key, w: size.w, h: size.h, of: dr.of };
    if (!m) return dropDraft();
    // Her phone has it already, so it never has to come back down.
    await keep(addr(id, { ...m, key }), pic);
    await keep(addr(id, { ...m, key }, true), thumb);
    dropDraft();
    if (dr.map) {
      edit(id, [{ o: "m-pic", id: m.id, key, w: size.w, h: size.h }], "The new picture’s up. The pins are where they were on it.");
      return;
    }
    edit(id, [{ o: "m-new", m: { ...m, shown: false, pins: [] } }], `${bare(name)} is up. Only you can see it till you show the crew.`);
    d.go(mapHref(id, m), { from: location.pathname + location.search });
  }

  document.addEventListener("change", (e) => {
    const input = e.target.closest?.("input[data-wmfile]");
    if (input) {
      choose(input.dataset.wmfile, input.files?.[0], input.dataset.wmmap ?? "");
      input.value = "";
      return;
    }
    const field = e.target.closest?.("[data-wmdraft]");
    if (field && draft) draft[field.dataset.wmdraft] = field.value;
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches?.("input[data-wmdraft]") && draft) draft.name = e.target.value;
    if (!e.target.matches?.("[data-wmfind]")) return;
    find = e.target.value.slice(0, 60);
    filter(find);
  });
  const filter = (q) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const li of document.querySelectorAll("#app .wm-picks li")) li.hidden = words.length > 0 && !words.every((x) => li.dataset.find.includes(x));
  };

  // ------------------------------------------------------------ a map, full screen

  // A card or a list slides up the first time it's drawn, and not again each
  // time the screen's drawn with it still up.
  let up = "";
  const fresh = (what, key) => {
    const k = `${what}:${key}`;
    if (up === k) return "";
    up = k;
    return " is-fresh";
  };

  // Back to where she came from: a page that has the map's pin, or the world.
  function backOf(id) {
    const from = String(history.state?.from ?? "");
    if (/^\/characters\/\?c=[^&]+&t=world$/.test(from)) return [from, "The world"];
    const m = from.match(/^\/characters\/\?camp=([^&]+)&world&(p|f)=([^&]+)$/);
    if (m && decodeURIComponent(m[1]) === id) {
      const doc = docOf(id);
      const name = m[2] === "p" ? findPage(doc, decodeURIComponent(m[3]))?.name : doc.factions.find((f) => f.id === decodeURIComponent(m[3]))?.name;
      if (name) return [from, name];
    }
    return [`/characters/?camp=${encodeURIComponent(id)}&world`, "The world"];
  }

  // A pin on the map, as the viewer draws it.
  function pinDraw(id, doc, gm, lit) {
    return (p) => {
      const pin = p.pin;
      const k = kindOf(doc, pin);
      const name = labelOf(doc, pin) || "A pin";
      const cls = `wm-pin is-${k}${gm && !pin.shown ? " is-hidden" : ""}${ui.pin === pin.id ? " is-on" : ""}${lit.includes(pin.id) ? " is-new" : ""}${ui.placing?.pid === pin.id ? " is-lifted" : ""}`;
      const say = `${name}, ${kindName(k).toLowerCase()}${gm ? (pin.shown ? ", shown to the crew" : ", hidden from the crew") : ""}`;
      return { cls, html: `<span class="wm-pin-head">${MARK[k]}</span><span class="wm-pin-n">${esc(name)}</span>`, attrs: { "data-act": "w", "data-do": "mpin", "data-pid": pin.id, "aria-label": say, "aria-pressed": String(ui.pin === pin.id) } };
    };
  }

  // The card for the pin she's tapped, over the bottom of the map.
  function card(id, doc, m, gm) {
    const pin = m.pins.find((p) => p.id === ui.pin);
    if (!pin) return "";
    const k = kindOf(doc, pin);
    const t = targetOf(doc, pin.to);
    const name = labelOf(doc, pin) || "A pin";
    const head = `<div class="wm-card-top"><span class="wm-card-mark is-${k}${gm && !pin.shown ? " is-hidden" : ""}">${MARK[k]}</span>
      <div class="wm-card-t"><p class="wb-k">${kindName(k)}${gm ? `<span class="wb-badge${pin.shown ? " is-on" : ""}">${pin.shown ? "Shown" : "Hidden"}</span>` : ""}</p><h2 class="wm-card-n" id="wm-card-h">${esc(name)}</h2></div>
      <button type="button" class="cc-x" data-act="w" data-do="mclose" aria-label="Close">${d.icon.close}</button></div>`;
    const opener = t && (gm || pin.to) ? `<a class="button primary" href="${esc(pageHref(id, pin.to))}" data-act="w" data-do="nav">Open ${theName(k)}</a>` : "";
    if (!gm) {
      return `<section class="wm-card card${fresh("card", pin.id)}" aria-labelledby="wm-card-h">${head}${opener ? `<div class="cc-row">${opener}</div>` : '<p class="cc-small wm-card-say">That’s all you know about it so far.</p>'}</section>`;
    }
    const lines = [];
    if (pin.name && t) lines.push(`The crew calls it <em>${esc(pin.name)}</em>, and it opens ${esc(t.name)}.`);
    else if (!t && pin.to) lines.push("What it opened isn’t in the world any more.");
    else if (!t) lines.push("It doesn’t open anything yet.");
    lines.push(!pin.shown ? "Only you can see this pin." : t && !shownToCrew(doc, pin.to) ? `The crew sees its name. They can open it once you’ve shown them ${esc(t.name)} too.` : "The crew can see this pin.");
    const naming = ui.naming === pin.id ? `<form class="cc-form pt-form wm-name" data-form="w-map-pinname">
        <label class="cc-field">What the crew calls it <input name="name" maxlength="${MMAX.name}" autocomplete="off" value="${esc(pin.name)}" placeholder="like smoke on the ridge"${t ? "" : " required"}></label>
        ${t ? `<p class="cc-small">Leave it blank and it goes by ${esc(t.name)}.</p>` : ""}
        <div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="mnameoff">Cancel</button></div></form>` : "";
    const showIt = `<button type="button" class="button${pin.shown ? "" : " primary"}" data-act="w" data-do="mpinshow" aria-pressed="${pin.shown}">${pin.shown ? "Hide it" : "Show the crew"}</button>`;
    const too = pin.shown && t && !shownToCrew(doc, pin.to) ? `<button type="button" class="button" data-act="w" data-do="mpinpage">Show them ${esc(t.name)} too</button>` : "";
    const make = !t ? `<button type="button" class="button" data-act="w" data-do="mmake">Make it a place of your own</button>` : "";
    const sure = w.ui().sure === `munpin-${pin.id}`;
    return `<section class="wm-card card${fresh("card", pin.id)}" aria-labelledby="wm-card-h">${head}<p class="cc-small wm-card-say">${lines.join(" ")}</p>${naming}
      <div class="cc-row">${opener}${showIt}${too}</div>
      <div class="cc-row wm-card-more">${make}<button type="button" class="button" data-act="w" data-do="mmove">Move it</button><button type="button" class="button" data-act="w" data-do="mname">Rename it</button><button type="button" class="button${sure ? " danger" : ""}" data-act="w" data-do="munpin">${sure ? "Tap again to take it off" : "Take it off"}</button></div></section>`;
  }

  // Every pin in a list, for finding one without hunting for it, and for her,
  // the map's own name, place, picture and taking it down.
  function panel(id, doc, m, gm) {
    if (!ui.panel) return "";
    const rows = [...m.pins].sort((a, b) => SORT(labelOf(doc, a)).localeCompare(SORT(labelOf(doc, b)))).map((p) => {
      const k = kindOf(doc, p);
      return `<li><button type="button" class="wm-row" data-act="w" data-do="mfind" data-pid="${esc(p.id)}"><span class="wm-row-mark is-${k}${gm && !p.shown ? " is-hidden" : ""}">${MARK[k]}</span><span class="wm-row-in"><b>${esc(labelOf(doc, p) || "A pin")}</b><small>${kindName(k)}${gm ? (p.shown ? " · Shown" : " · Hidden") : ""}</small></span></button></li>`;
    }).join("");
    const empty = gm ? "No pins yet. Tap Drop a pin, move the map till the spot’s under the cross, and pin it." : "No pins on this one yet.";
    let mine = "";
    if (gm) {
      const places = doc.pages.filter((p) => p.kind === "place").sort((a, b) => SORT(a.name).localeCompare(SORT(b.name)));
      const sure = w.ui().sure === `mgone-${m.id}`;
      const dr = draft?.id === id && draft.map === m.id ? draft : null;
      mine = `<h2 class="wm-panel-h2">This map</h2>
        <form class="cc-form pt-form" data-form="w-map-set">
          <label class="cc-field">Its name <input name="name" maxlength="${MMAX.name}" autocomplete="off" required value="${esc(m.name)}"></label>
          ${places.length ? `<label class="cc-field">A map of <select name="of"><option value="">Nowhere in particular</option>${places.map((p) => `<option value="${esc(p.id)}"${m.of === p.id ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>` : ""}
          <div class="cc-row"><button type="submit" class="button">Save</button></div></form>
        <h3 class="wm-panel-h3">A new picture</h3>${dr ? draftBody(id, doc, dr) : `<p class="cc-small">For when you’ve drawn more of it. The pins stay where they are on the picture.</p><div class="cc-row">${chooser(id, "Choose a new picture", m.id)}</div>`}
        <div class="cc-row wm-gone"><button type="button" class="button danger" data-act="w" data-do="mgone">${sure ? "Tap again to take it down" : "Take the map down"}</button></div>`;
    }
    return `<section class="wm-panel card${fresh("panel", m.id)}" aria-labelledby="wm-panel-h"><div class="wm-card-top"><h2 id="wm-panel-h" class="wm-panel-t">${m.pins.length ? `Pins <small>${m.pins.length}</small>` : "Pins"}</h2><button type="button" class="cc-x" data-act="w" data-do="mpanel" aria-label="Close">${d.icon.close}</button></div>
      ${rows ? `<ul class="wm-rows">${rows}</ul>` : `<p class="cc-small">${empty}</p>`}${mine}</section>`;
  }

  // A new pin's down: what does it open?
  function picker(id, doc) {
    if (!ui.picking) return "";
    const all = targets(doc);
    const list = all.length ? `<label class="cc-field">Find a place, person or faction <input type="search" data-wmfind enterkeyhint="search" autocomplete="off" value="${esc(find)}"></label>
      <ul class="wm-picks">${all.map((t) => `<li data-find="${esc(t.name.toLowerCase())}"><button type="button" class="wm-row" data-act="w" data-do="mto" data-k="${t.k}" data-id="${esc(t.id)}"><span class="wm-row-mark is-${t.kind}">${MARK[t.kind]}</span><span class="wm-row-in"><b>${esc(t.name)}</b><small>${kindName(t.kind)}</small></span></button></li>`).join("")}</ul>`
      : '<p class="cc-small">There’s nothing in your world to pin yet. Give it a name instead, and make it a page later.</p>';
    if (find) requestAnimationFrame(() => filter(find));
    return `<section class="wm-panel wm-pick card${fresh("pick", `${ui.picking.x},${ui.picking.y}`)}" aria-labelledby="wm-pick-h"><div class="wm-card-top"><h2 id="wm-pick-h" class="wm-panel-t">What’s here?</h2><button type="button" class="cc-x" data-act="w" data-do="mcancel" aria-label="Cancel">${d.icon.close}</button></div>
      ${list}
      <form class="cc-form pt-form wm-justname" data-form="w-map-name"><label class="cc-field">Or just a name for it <input name="name" maxlength="${MMAX.name}" autocomplete="off" required placeholder="like smoke on the ridge"></label>
        <div class="cc-row"><button type="submit" class="button primary">Pin it</button></div></form></section>`;
  }

  function mapView(id, mid, focus) {
    const gm = isGm(id);
    const doc = docOf(id);
    const m = findMap(doc, mid);
    const at = `${id}:${mid}`;
    if (ui.at !== at) {
      ui = { at, pin: "", panel: false, placing: null, picking: null, naming: "", focus: "", asked: "", lit: [] };
      find = "";
    }
    // Opened from a page's pin: that pin, once.
    if ((focus || "") !== ui.asked) {
      ui.asked = focus || "";
      ui.focus = ui.asked;
    }
    const [back, backLabel] = backOf(id);
    const top = w.topbar(back, backLabel);
    if (!m) {
      return `${top}<header class="cc-camp-head"><p class="kicker">The world</p><h1>Not in the world</h1></header>
        <div class="cc-note is-warn"><p>${camp(id).at || !online() ? "That map isn’t in the world any more, or the crew hasn’t been shown it." : "Opening the world…"}</p></div>`;
    }
    if (ui.pin && !m.pins.some((p) => p.id === ui.pin)) ui.pin = "";
    const say = status(id);
    const showBtn = gm ? `<button type="button" class="button sm${m.shown ? "" : " primary"} wm-show" data-act="w" data-do="mshow" aria-pressed="${m.shown}">${m.shown ? "Hide it from the crew" : "Show the crew"}</button>` : "";
    const placing = ui.placing;
    const bar = placing
      ? `<div class="wm-bar is-placing"><p class="wm-hint" role="status">Move the map till the spot’s under the cross.</p><div class="wm-bar-row"><button type="button" class="button" data-act="w" data-do="mcancel">Cancel</button><button type="button" class="button primary" data-act="w" data-do="mplace">${placing.pid ? "Put it here" : "Pin it here"}</button></div></div>`
      : `<div class="wm-bar"><div class="wm-bar-row"><button type="button" class="button wm-pins-btn" data-act="w" data-do="mpanel" aria-expanded="${ui.panel}">Pins${m.pins.length ? ` <b>${m.pins.length}</b>` : ""}</button>${gm ? `<button type="button" class="button primary" data-act="w" data-do="mdrop"${m.pins.length >= MMAX.pins ? " disabled" : ""}>${MARK.pin}Drop a pin</button>` : ""}</div></div>`;
    const zoom = `<div class="wm-zoom" role="group" aria-label="Zoom"><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="in" aria-label="Zoom in">${MARK.plus}</button><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="out" aria-label="Zoom out">${MARK.minus}</button><button type="button" class="wm-z" data-act="w" data-do="mzoom" data-z="whole" aria-label="The whole map">${MARK.whole}</button></div>`;
    const overlay = ui.picking ? picker(id, doc) : ui.panel ? panel(id, doc, m, gm) : placing ? "" : card(id, doc, m, gm);
    if (!overlay) up = "";
    // A pin that's just been shown lights up once.
    ui.lit = w.lit(id).slice();
    if (!gm) w.unlit(id);
    return `<div class="wm-screen" data-wb="${esc(id)}">
      <div class="wm-top">${top}
        <header class="wm-head"><div class="wm-title"><p class="kicker${gm ? " is-gm" : ""}">Map${gm ? ` <span class="wb-badge${m.shown ? " is-on" : ""}">${m.shown ? "Shown" : "Hidden"}</span>` : ""}</p><h1>${esc(m.name)}</h1></div>${showBtn}</header>
        ${say ? `<p class="cc-small pt-status wm-status">${say}</p>` : ""}</div>
      <div class="wm-body${placing ? " is-placing" : ""}">
        <div class="wm-slot" data-map="${esc(at)}"></div>
        <p class="sr-only" id="wm-how">Drag to move it. Double tap to zoom in, or double tap and hold, then slide down to zoom in and up to zoom out. With a keyboard, the arrow keys move it, plus and minus zoom, and 0 shows the whole map.</p>
        <p class="wm-note" data-wmnote hidden></p>
        ${zoom}${overlay}${bar}
      </div></div>`;
  }

  // Leaving a map: its viewer goes, and so does its picture from memory (it's
  // still kept on the phone).
  function drop() {
    if (!view) return;
    view.v.destroy();
    if (view.src && urls.has(view.src)) {
      URL.revokeObjectURL(urls.get(view.src));
      urls.delete(view.src);
    }
    view = null;
  }

  // The map's viewer goes back in its place each time the screen's drawn.
  function after(app) {
    document.documentElement.classList.toggle("cc-map", Boolean(app.querySelector(".wm-screen")));
    thumbs();
    // The list stays scrolled where it was.
    const list = app.querySelector(".wm-panel");
    if (list) {
      if (!list.classList.contains("is-fresh")) list.scrollTop = ui.scroll || 0;
      else ui.scroll = 0;
      list.addEventListener("scroll", () => {
        ui.scroll = list.scrollTop;
      }, { passive: true });
    }
    const slot = app.querySelector(".wm-slot");
    if (!slot) {
      if (view && !app.querySelector(".wm-screen")) drop();
      return;
    }
    const [id, mid] = slot.dataset.map.split(":");
    const doc = docOf(id);
    const m = findMap(doc, mid);
    if (!m) return;
    const gm = isGm(id);
    const key = `${id}:${mid}:${m.key}:${m.w}x${m.h}`;
    if (view?.key !== key) {
      drop();
      const v = makeViewer({
        w: m.w, h: m.h, label: m.name, how: "wm-how",
        drawPin: (p) => view.draw(p),
        onTap: () => {
          if (ui.placing || ui.picking) return;
          if (ui.pin || ui.panel) {
            ui.pin = "";
            ui.panel = false;
            ui.naming = "";
            d.render();
          }
        },
      });
      view = { key, v, src: "", draw: null };
    }
    slot.replaceWith(view.v.el);
    view.v.el.setAttribute("aria-label", m.name);
    view.draw = pinDraw(id, doc, gm, ui.lit);
    view.v.pins(m.pins.map((pin) => ({ id: pin.id, x: pin.x, y: pin.y, pin, rank: (ui.pin === pin.id ? 4 : 0) + (pin.shown ? 1 : 0), always: ui.pin === pin.id })));
    view.v.placing(Boolean(ui.placing));
    // The bar along the bottom covers the bottom of the map, so the whole map
    // shows above it.
    const row = app.querySelector(".wm-bar-row");
    if (row) view.v.pad(view.v.el.getBoundingClientRect().bottom - row.getBoundingClientRect().top + 10);
    // The picture: the phone's copy if it's got one, the small one first if
    // the big one's still coming.
    const big = addr(id, m);
    const note = app.querySelector("[data-wmnote]");
    const say = (t) => {
      if (!note) return;
      note.hidden = !t;
      note.textContent = t;
    };
    if (urls.has(big)) {
      view.src = big;
      view.v.show(urls.get(big));
    } else {
      const small = addr(id, m, true);
      view.v.show(urls.get(small) ?? "");
      say(online() ? "Opening the map…" : "");
      const was = view.key;
      Promise.all([picture(small), picture(big)]).then(([s, b]) => {
        if (view?.key !== was) return;
        const live = document.querySelector("#app [data-wmnote]");
        const put = (t) => {
          if (!live) return;
          live.hidden = !t;
          live.textContent = t;
        };
        if (b) {
          view.src = big;
          view.v.show(b);
          return put("");
        }
        if (s) view.v.show(s);
        put(online() ? "The picture didn’t come through. Try again in a moment." : "No signal, and this phone hasn’t got this map’s picture yet.");
      });
    }
    // Opened from a page's pin: straight to it, with its card up.
    if (ui.focus) {
      const pin = m.pins.find((p) => p.id === ui.focus);
      ui.focus = "";
      if (pin) {
        ui.pin = pin.id;
        requestAnimationFrame(() => {
          view?.v.centreOn(pin.x, pin.y);
          d.render();
        });
      }
    }
  }

  // ------------------------------------------------------------ taps

  const here = () => {
    const [id, mid] = ui.at.split(":");
    const doc = docOf(id);
    return { id, doc, m: findMap(doc, mid) };
  };
  const pinOn = (m) => m?.pins.find((p) => p.id === ui.pin) ?? null;
  const ACT = {
    mshow() {
      const { id, m } = here();
      if (!m) return;
      edit(id, [{ o: "m-show", id: m.id, v: !m.shown }], m.shown ? `The crew can’t see ${bare(m.name)} now.` : `The crew can see ${bare(m.name)} now, and the pins you’ve shown on it.`);
    },
    mpin(el) {
      ui.pin = ui.pin === el.dataset.pid ? "" : el.dataset.pid;
      ui.panel = false;
      ui.naming = "";
      w.setSure("");
      d.render();
      if (ui.pin) requestAnimationFrame(() => document.querySelector("#app .wm-card .button, #app .wm-card .cc-x")?.focus({ preventScroll: true }));
    },
    mclose() {
      const was = ui.pin;
      ui.pin = "";
      ui.naming = "";
      d.render();
      requestAnimationFrame(() => document.querySelector(`#app .wm-pin[data-pid="${CSS.escape(was)}"]`)?.focus({ preventScroll: true }));
    },
    mpanel() {
      ui.panel = !ui.panel;
      ui.pin = "";
      ui.naming = "";
      w.setSure("");
      d.render();
      requestAnimationFrame(() => document.querySelector(ui.panel ? "#app .wm-panel .cc-x" : "#app .wm-pins-btn")?.focus({ preventScroll: true }));
    },
    mfind(el) {
      const { m } = here();
      const pin = m?.pins.find((p) => p.id === el.dataset.pid);
      if (!pin) return;
      ui.panel = false;
      ui.pin = pin.id;
      d.render();
      view?.v.centreOn(pin.x, pin.y);
    },
    mzoom(el) {
      if (!view) return;
      const z = el.dataset.z;
      if (z === "in") view.v.zoomIn();
      else if (z === "out") view.v.zoomOut();
      else view.v.fit();
    },
    mdrop() {
      const { m } = here();
      if (!m) return;
      if (m.pins.length >= MMAX.pins) return d.toast(`That’s ${MMAX.pins} pins, which is as many as a map holds.`, false);
      ui.placing = {};
      ui.pin = "";
      ui.panel = false;
      d.render();
    },
    mmove() {
      const { m } = here();
      const pin = pinOn(m);
      if (!pin) return;
      ui.placing = { pid: pin.id };
      d.render();
      view?.v.centreOn(pin.x, pin.y, false);
    },
    mplace() {
      const { id, m } = here();
      if (!m || !ui.placing || !view) return;
      const at = view.v.middle();
      const was = ui.placing;
      ui.placing = null;
      if (was.pid) {
        ui.pin = was.pid;
        edit(id, [{ o: "m-pinset", id: m.id, pid: was.pid, f: "at", v: at }], "Moved.");
        return;
      }
      ui.picking = at;
      find = "";
      d.render();
      requestAnimationFrame(() => document.querySelector("#app .wm-pick input")?.focus({ preventScroll: true }));
    },
    mcancel() {
      const back = ui.placing?.pid ?? "";
      ui.placing = null;
      ui.picking = null;
      ui.pin = back;
      d.render();
    },
    mto(el) {
      const { id, m } = here();
      if (!m || !ui.picking) return;
      const pin = { id: newId(), x: ui.picking.x, y: ui.picking.y, to: { k: el.dataset.k, id: el.dataset.id }, name: "", shown: false };
      ui.picking = null;
      ui.pin = pin.id;
      edit(id, [{ o: "m-pin", id: m.id, pin }], "Pinned. Only you can see it till you show the crew.");
    },
    mpinshow() {
      const { id, m } = here();
      const pin = pinOn(m);
      if (!pin) return;
      edit(id, [{ o: "m-pinset", id: m.id, pid: pin.id, f: "shown", v: !pin.shown }], pin.shown ? "The crew can’t see that pin now." : m.shown ? "The crew can see the pin." : `The crew will see the pin once you show them ${bare(m.name)}.`);
    },
    // The pin's shown, and now what it opens too.
    mpinpage() {
      const { id, doc, m } = here();
      const pin = pinOn(m);
      const t = pin && targetOf(doc, pin.to);
      if (!t) return;
      edit(id, [pin.to.k === "p" ? { o: "p-show", id: t.id, p: "page", v: true } : { o: "show", id: t.id, p: "card", v: true }], `The crew can open ${bare(t.name)} from the pin now.`);
    },
    mname() {
      ui.naming = ui.pin;
      d.render();
      requestAnimationFrame(() => document.querySelector("#app .wm-name input")?.focus());
    },
    mnameoff() {
      ui.naming = "";
      d.render();
    },
    munpin() {
      const { id, m } = here();
      const pin = pinOn(m);
      if (!pin) return;
      const key = `munpin-${pin.id}`;
      if (w.ui().sure !== key) {
        w.setSure(key);
        return d.render();
      }
      ui.pin = "";
      edit(id, [{ o: "m-unpin", id: m.id, pid: pin.id }], "Taken off.");
    },
    // A pin that's only a name becomes a place of her own, and opens it.
    mmake() {
      const { id, m } = here();
      const pin = pinOn(m);
      if (!pin || pin.to || !pin.name) return;
      const pid = newId();
      const page = { id: pid, kind: "place", name: pin.name.charAt(0).toUpperCase() + pin.name.slice(1), aka: [], line: "", ch: 0, look: "", shown: {} };
      edit(id, [{ o: "p-new", p: page }, { o: "m-pinset", id: m.id, pid: pin.id, f: "to", v: { k: "p", id: pid } }, { o: "m-pinset", id: m.id, pid: pin.id, f: "name", v: "" }], `${bare(page.name)} is a page of its own now.`);
    },
    mgone() {
      const { id, m } = here();
      if (!m) return;
      const key = `mgone-${m.id}`;
      if (w.ui().sure !== key) {
        w.setSure(key);
        return d.render();
      }
      ui.panel = false;
      edit(id, [{ o: "m-gone", id: m.id }], `${bare(m.name)} is down.`);
      d.go(`/characters/?camp=${encodeURIComponent(id)}&world`, { replace: true });
    },
    mturn() {
      if (!draft?.src || draft.busy) return;
      draft.turn = (draft.turn + 1) % 4;
      preview(draft).then(() => d.render());
    },
    mdraftx() {
      dropDraft();
      d.render();
    },
  };

  function submit(kind, form, f, id) {
    const text = (name) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, MMAX.name);
    if (kind === "w-map-new") return putItUp(id, form);
    const { m } = here();
    if (!m) return;
    if (kind === "w-map-name") {
      const name = text("name");
      if (!name || !ui.picking) return;
      const pin = { id: newId(), x: ui.picking.x, y: ui.picking.y, to: null, name, shown: false };
      ui.picking = null;
      ui.pin = pin.id;
      return edit(id, [{ o: "m-pin", id: m.id, pin }], "Pinned. Only you can see it till you show the crew.");
    }
    if (kind === "w-map-pinname") {
      const pin = pinOn(m);
      if (!pin) return;
      ui.naming = "";
      const name = text("name");
      if (!name && !pin.to) return d.toast("A pin that doesn’t open anything needs a name.", false);
      if (name === pin.name) return d.render();
      return edit(id, [{ o: "m-pinset", id: m.id, pid: pin.id, f: "name", v: name }], name ? `The crew calls it ${name} now.` : "It goes by its page’s name again.");
    }
    if (kind === "w-map-set") {
      const name = text("name");
      if (!name) return d.toast("Give it a name first.", false);
      const of = String(f.get("of") ?? "");
      const ops = [];
      if (name !== m.name) ops.push({ o: "m-set", id: m.id, f: "name", v: name });
      if (of !== m.of) ops.push({ o: "m-set", id: m.id, f: "of", v: of });
      if (!ops.length) return d.toast("Nothing’s changed.", false);
      return edit(id, ops, "Saved.");
    }
  }

  // Esc puts away whatever's open over the map.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !document.querySelector("#app .wm-screen") || document.querySelector("dialog[open]")) return;
    if (ui.picking || ui.placing) ACT.mcancel();
    else if (ui.naming) ACT.mnameoff();
    else if (ui.panel) ACT.mpanel();
    else if (ui.pin) ACT.mclose();
  });

  // ------------------------------------------------------------ elsewhere

  // On a page or a faction's page: the maps it's pinned on, and a place's own maps.
  function onMaps(id, to) {
    const gm = isGm(id);
    const doc = docOf(id);
    const rows = [];
    for (const m of doc.maps) {
      if (to.k === "p" && m.of === to.id) rows.push(`<li><a class="pt-reword" href="${esc(mapHref(id, m))}" data-act="w" data-do="nav">${esc(m.name)}</a> <small>Its own map${gm && !m.shown ? " · Hidden" : ""}</small></li>`);
      for (const p of m.pins) {
        if (p.to?.k !== to.k || p.to.id !== to.id) continue;
        rows.push(`<li><a class="pt-reword" href="${esc(mapHref(id, m, p.id))}" data-act="w" data-do="nav">${esc(m.name)}</a> <small>${gm ? (m.shown && p.shown ? "Pinned, shown" : "Pinned, hidden") : "Pinned"}</small></li>`);
      }
    }
    return rows.length ? `<section class="cc-sec wp-ment wm-on" aria-labelledby="wm-on-h"><h2 id="wm-on-h">${rows.length === 1 ? "On the map" : "On the maps"}</h2><ul class="wp-ment-list">${rows.join("")}</ul></section>` : "";
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
      const fresh = m.pins.filter((p) => !b.pins.some((q) => q.id === p.id));
      if (fresh.length === 1) said.push(`There’s a new pin on ${bare(m.name)}: ${bare(fresh[0].name)}.`);
      else if (fresh.length > 1) said.push(`There are ${fresh.length} new pins on ${bare(m.name)}.`);
      if (fresh.length) keys.push(m.id, ...fresh.map((p) => p.id));
    }
    return { said, keys };
  }

  return {
    ACT,
    section,
    mapView,
    after,
    submit,
    onMaps,
    news,
    got,
    title(id, mid) {
      return findMap(docOf(id), mid)?.name ?? "A map";
    },
    count: (doc) => doc.maps.length,
  };
}

// Signing out: every map's picture comes off the phone.
export function forgetMaps() {
  try {
    caches.delete(CACHE).catch(() => {});
  } catch {}
}
