// Places and people on the World screen (stage 3 of notes/worlds-plan.md): a
// page for each, written by the GM, linked to each other and to the factions
// on the board, with a part of each kept for her alone.
//
// The World screen has a Places and a People section under the board, and a
// page opens full screen (/characters/?camp=<id>&world&p=<page>). Everything
// starts hidden: she shows the crew a page in a tap, then how a person fights
// and its Secret each in a tap of their own, the Secret on a second tap. A
// player's phone only ever gets what's been shown (pagesForPlayer() in
// pages.js). Names link wherever a page says them, a page's own name and what
// else it's called, and she links any two in a tap as well. The crew sees a
// link once they've been shown both ends of it, and a name only links to a
// page they've been shown.
//
// What she brings in or rolls comes from public/world-book.json, built off the
// chapters (Twenty Places, the Steeplands' cities and every frame's places,
// Building Your World's tables, the Threat Builder, the Bestiary and the
// frames' threats, and Appendix B's tags), read when a World screen opens and
// kept for offline by the service worker. A page out of the book remembers it
// as it was, so when the book changes it she gets a note and picks: take the
// book's changes, or keep hers. Typo fixes go in quietly.
//
// world.js keeps the world in step with the Worker and hands its changes on;
// this draws the pages and makes the changes to them.
import { PMAX, findPage, linksTo, mentionsIn, mentionsOf, namePattern, namesOf } from "./pages.js";
import { rollDie } from "./dice.js";
import { typo } from "./marks.js";
import { die as kitDie, tag as kitTag } from "../kit/kit.js";

const MARK = {
  place: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10.5l8-6 8 6V20"/><path d="M9.5 20v-5.5h5V20"/><path d="M3 20h18"/></svg>',
  person: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c1-4.2 3.8-6.3 7.2-6.3s6.2 2.1 7.2 6.3"/></svg>',
};
const KIND = { place: "Place", person: "Person" };
const TAG_KINDS = [["comes", "Comes at you"], ["keeps", "Keeps it going"], ["drives", "Drives it"], ["weak", "Weak to"], ["", "Tags"]];
const PART_SAY = { page: "it", threat: "how they fight", secret: "its Secret" };
const HONORIFICS = /^(Old|Young|Big|Little|Lord|Lady|Dame|Sir|Master|Madam|Mister|Mr|Mrs|Ms|Mother|Sister|Brother|Father|Abbot|Abbess|Captain|Sergeant|Widow|Commodore|Factor|Inspector|Duke|Duchess|Queen|King|Prince|Princess|Director|Councillor|Doctor|Dr|Saint)$/;

const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const newId = () => `${random(6)}${Date.now().toString(36).slice(-3)}`;
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const keyOf = (t) => String(t ?? "").normalize("NFKD").toLowerCase().replace(/['’‘`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const capFirst = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const roll = (n) => rollDie(n) - 1;
const copy = (x) => JSON.parse(JSON.stringify(x));

// What else someone's called: their first and last names, without an
// honorific. A name starting with "The" keeps its whole name.
export function akaOf(name) {
  if (/^the\b/i.test(name)) return [];
  const w = String(name).split(/\s+/).filter(Boolean);
  while (w.length > 1 && HONORIFICS.test(w[0])) w.shift();
  if (w.length === 1) return w[0] === name ? [] : [w[0]];
  return [...new Set([w[0], w[w.length - 1]])];
}

export function makePlaces(w) {
  const { d } = w;
  const esc = d.esc;
  let WB = null;
  let loading = null;

  // ------------------------------------------------------------ the book

  // The book's places and people, read once, from the service worker's copy
  // when there's no signal.
  function book() {
    if (WB || loading) return WB;
    loading = fetch("/world-book.json", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && Array.isArray(j.places)) {
          WB = j;
          w.booked();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!WB) setTimeout(() => (loading = null), 15000);
      });
    return WB;
  }
  const tagDoes = (t) => WB?.tags?.[t]?.does ?? "";
  // The book's version of a page she brought in, as the build has it now.
  function bookPage(p) {
    if (!WB || !p.book) return null;
    if (p.book.from === "places") {
      for (const pl of WB.places) {
        if (pl.key === p.book.key) return pl;
        const who = pl.people.find((x) => x.key === p.book.key);
        if (who) return who;
      }
      return null;
    }
    return WB.worlds.find((x) => x.id === p.book.from)?.places.find((x) => x.key === p.book.key) ?? null;
  }
  // A page out of the book, with ids of its own and nothing shown to the crew.
  function fromBook(b, kind, from, extra = {}) {
    const { h, at, link, people, group, ...was } = b;
    const threat = b.threat ? { ...b.threat, tags: b.threat.tags.map((t) => ({ ...t, id: newId() })), tele: b.threat.tele.map((text) => ({ id: newId(), text })) } : null;
    return {
      id: newId(), kind, name: b.name, about: b.about ?? "", text: b.text ?? "", want: b.want ?? "", comp: "", c: b.c ?? 0,
      secret: b.secret ?? "", more: b.more ?? "", note: b.note ?? "", hooks: (b.hooks ?? []).map((text) => ({ id: newId(), text })),
      aka: b.aka ?? [], threat, scene: b.scene ?? null, shown: {}, book: { from, key: b.key, h, at, was: { ...was, hooks: b.hooks ?? [] } }, ...extra,
    };
  }

  // ------------------------------------------------------------ words that link

  const hrefOf = (id, doc, to) => `/characters/?camp=${encodeURIComponent(id)}&world&${findPage(doc, to) ? "p" : "f"}=${encodeURIComponent(to)}`;
  function linker(id, doc, self) {
    const names = namesOf(doc);
    return { id, doc, names, re: namePattern(names), self };
  }
  // A run of words, with every name in it a link, except the page's own.
  function linkify(s, L) {
    const found = L ? mentionsIn(s, L.names, L.re).filter((m) => m.to !== L.self) : [];
    let out = "";
    let at = 0;
    for (const m of found) {
      out += `${esc(s.slice(at, m.at))}<a class="wp-link" href="${esc(hrefOf(L.id, L.doc, m.to))}" data-act="w" data-do="nav">${esc(s.slice(m.at, m.end))}</a>`;
      at = m.end;
    }
    return out + esc(s.slice(at));
  }
  // One line, with the book's *italics* and **bold** kept and its names linked.
  function inline(s, L) {
    const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let out = "";
    let at = 0;
    for (const m of String(s ?? "").matchAll(re)) {
      out += linkify(s.slice(at, m.index), L);
      out += m[1] != null ? `<b>${linkify(m[1], L)}</b>` : `<em>${linkify(m[2], L)}</em>`;
      at = m.index + m[0].length;
    }
    return out + linkify(String(s ?? "").slice(at), L);
  }
  // A few lines, each its own paragraph.
  const rich = (s, L, cls = "") => String(s ?? "").split("\n").filter(Boolean).map((l) => `<p${cls ? ` class="${cls}"` : ""}>${inline(l, L)}</p>`).join("");

  // ------------------------------------------------------------ the lists

  const linkedPlaces = (doc, p) => linksTo(doc, p.id).map((x) => findPage(doc, x)).filter((x) => x?.kind === "place");
  function token(id, p, doc, gm) {
    const threat = p.threat && (gm || p.shown.threat) ? p.threat : null;
    const mark = threat
      ? `<span class="wb-tok-die" role="img" aria-label="Challenge ${threat.c}, d${threat.c * 2}">${kitDie(threat.c * 2, { own: "them", hide: true })}</span>`
      : `<span class="wb-tok-die wp-mark" aria-hidden="true">${MARK[p.kind]}</span>`;
    const shown = gm ? `<span class="wb-badge${p.shown.page ? " is-on" : ""}">${p.shown.page ? "Shown" : "Hidden"}</span>` : "";
    const where = p.kind === "person" ? linkedPlaces(doc, p).map((x) => x.name) : [];
    const glow = w.lit(id).includes(p.id) ? " is-new" : "";
    return `<li class="wb-tok wp-tok is-${p.kind}${glow}"><a class="card wb-tok-a" href="${esc(hrefOf(id, doc, p.id))}" data-act="w" data-do="nav">${mark}
      <span class="wb-tok-in"><span class="wb-k">${KIND[p.kind]}${shown}</span><b class="wb-tok-n">${esc(p.name)}</b>${p.about ? `<span class="wb-tok-w">${esc(p.about)}</span>` : ""}${where.length ? `<span class="cc-small wp-where">At ${esc(andList(where))}</span>` : ""}</span></a></li>`;
  }

  // The Places and People sections, under the board. A player only gets the
  // ones with something in them.
  function sections(id) {
    const gm = w.isGm(id);
    const doc = w.docOf(id);
    if (gm) book();
    const out = [];
    for (const kind of ["place", "person"]) {
      const list = doc.pages.filter((p) => p.kind === kind);
      if (!gm && !list.length) continue;
      const head = kind === "place" ? "Places" : "People";
      const toks = list.length ? `<ul class="wb-toks">${list.map((p) => token(id, p, doc, gm)).join("")}</ul>` : "";
      let body = toks;
      if (gm) {
        const shownN = list.filter((p) => p.shown.page).length;
        const lead = list.length
          ? `<p class="cc-small wb-sum">${plural(list.length, kind === "place" ? "place" : "person", kind === "place" ? "places" : "people")}, ${shownN ? `${shownN} shown to the crew` : "none of them shown to the crew yet"}.</p>`
          : `<p class="cc-lead">${kind === "place" ? "No places yet. Bring one in from the book, or write your own." : "Nobody yet. A place from Twenty Places brings its people with it, a faction’s Face gets a page in a tap from its card, or write your own."}</p>`;
        const adds = kind === "place" ? `${bringFold(id, doc)}${newFold(id, "place")}` : newFold(id, "person");
        body = `${lead}${toks}<div class="cc-folds wb-adds">${adds}</div>`;
      }
      out.push(`<section class="cc-sec wb-sec wp-sec" id="wp-${kind}" data-wb="${esc(id)}" aria-labelledby="wp-${kind}-h"><h2 id="wp-${kind}-h">${head}</h2>${body}</section>`);
    }
    if (!gm) w.lit(id).length = 0;
    return out.join("");
  }
  // The strip at the top of the World screen, to jump down it.
  function jumps(id) {
    const gm = w.isGm(id);
    const doc = w.docOf(id);
    const has = (k) => gm || doc.pages.some((p) => p.kind === k);
    if (!gm && !doc.pages.length) return "";
    const items = [["wb-h", "The board"], ...(has("place") ? [["wp-place-h", "Places"]] : []), ...(has("person") ? [["wp-person-h", "People"]] : [])];
    return `<nav class="wp-jumps" aria-label="On this screen">${items.map(([to, label]) => `<button type="button" class="chip sm" data-act="w" data-do="pjump" data-to="${to}">${label}</button>`).join("")}</nav>`;
  }

  function bringFold(id, doc) {
    if (!WB) return w.fold("pbring", "Bring in places from the book", "Twenty Places, the Steeplands and the frames", `<p class="cc-lead">${navigator.onLine === false ? "No signal, and this phone hasn’t got the book’s places yet." : "Opening the book’s places…"}</p>`);
    const have = new Set(doc.pages.filter((p) => p.book).map((p) => `${p.book.from}|${p.book.key}`));
    const worlds = WB.worlds.map((x) => {
      const left = x.places.filter((p) => !have.has(`${x.id}|${p.key}`));
      return `<li class="wb-bring card"><p class="wb-k">${x.id === "steeplands" ? "A world in two pages" : "A frame"}</p><h4>${esc(x.name)}</h4><p class="cc-small">${x.places.map((p) => esc(p.name)).join(" · ")}</p>
        <div class="cc-row">${left.length ? `<button type="button" class="button" data-act="w" data-do="pworld" data-b="${esc(x.id)}">${left.length === x.places.length ? `Bring in its ${x.places.length}` : "Bring in the rest"}</button>` : '<span class="chip sm pt-chip is-on">In your world</span>'}<a class="pt-reword" href="${esc(x.link)}">Read it in the book</a></div></li>`;
    }).join("");
    const twenty = WB.places.map((p) => `<li class="wb-bring card wp-bring"><h4>${esc(p.name)}</h4><p>${esc(p.about)}</p><p class="cc-small">With ${esc(andList(p.people.map((x) => x.name)))}</p>
      <div class="cc-row">${have.has(`places|${p.key}`) ? '<span class="chip sm pt-chip is-on">In your world</span>' : `<button type="button" class="button" data-act="w" data-do="pbring" data-k="${esc(p.key)}" aria-label="Bring in ${esc(p.name)}">Bring it in</button>`}<a class="pt-reword" href="${esc(p.link)}">Read it in the book</a></div></li>`).join("");
    return w.fold("pbring", "Bring in places from the book", doc.pages.some((p) => p.kind === "place") ? "Twenty Places, the Steeplands and the frames" : `${WB.places.length} ready to run, and every frame’s`,
      `<p class="cc-lead">Each one comes in as a page, the way the book writes it, and it’s yours to change from then on. A place from Twenty Places brings its people, each written as a threat. Nothing’s shown to the crew till you show it.</p>
      <h3 class="wp-h3">Twenty Places</h3><ul class="wb-brings">${twenty}</ul>
      <h3 class="wp-h3">The Steeplands and the frames</h3><ul class="wb-brings">${worlds}</ul>`);
  }

  function newFold(id, kind) {
    const T = WB?.tables;
    const opts = (rows, list) => (rows?.length ? `<datalist id="${list}">${rows.map((r) => `<option value="${esc(r)}"></option>`).join("")}</datalist>` : "");
    const place = kind === "place";
    const fields = place
      ? `<label class="cc-field">Its name <input name="name" maxlength="${PMAX.name}" autocomplete="off" required placeholder="like The Drowned Bell"></label>
        <label class="cc-field">What it is <input name="about" maxlength="${PMAX.line}" autocomplete="off" placeholder="like A tavern built in a beached ship"></label>
        <label class="cc-field">What the crew sees there <textarea name="text" maxlength="${PMAX.text}" rows="3"></textarea></label>
        <label class="cc-field">Its complication, only yours <input name="comp" maxlength="${PMAX.line}" autocomplete="off" list="wp-comps"></label>${opts(T?.comp, "wp-comps")}
        <label class="cc-field">Its Secret <input name="secret" maxlength="${PMAX.more}" autocomplete="off"></label>`
      : `<label class="cc-field">Their name <input name="name" maxlength="${PMAX.name}" autocomplete="off" required placeholder="like Hesper Vole"></label>
        <label class="cc-field">Who they are <input name="about" maxlength="${PMAX.line}" autocomplete="off" placeholder="like The Guild’s night clerk"></label>
        <label class="cc-field">What they want <input name="want" maxlength="${PMAX.words}" autocomplete="off" list="wp-wants"></label>${opts(T?.want, "wp-wants")}
        <label class="cc-field">What they’re hiding, their Secret <input name="secret" maxlength="${PMAX.more}" autocomplete="off" list="wp-hides"></label>${opts(T?.hiding, "wp-hides")}
        <label class="cc-field">What the crew sees <textarea name="text" maxlength="${PMAX.text}" rows="3"></textarea></label>`;
    const rollLabel = place ? "Roll its complication" : "Roll what they want and hide";
    return w.fold(`pnew-${kind}`, place ? "A place of your own" : "A person of your own", "Rolled or picked off Building Your World",
      `<form class="cc-form pt-form wb-new" data-form="w-pnew" data-kind="${kind}">
        <p class="cc-lead">${place ? "A few plain sentences, the trouble in it and a secret. Roll on the book’s table or read down it and pick." : "A few plain sentences, something they want and a secret. Roll on the book’s tables or read down them and pick. You can write them as a threat on their page."}</p>
        ${T ? `<div class="cc-row"><button type="button" class="button" data-act="w" data-do="prollnew" data-kind="${kind}">${rollLabel}</button></div>` : ""}
        ${fields}
        <div class="cc-row"><button type="submit" class="button primary">${place ? "Put it in the world" : "Put them in the world"}</button></div>
        ${WB ? `<p class="cc-small"><a class="pt-reword" href="${esc(`${WB.links.world}#${place ? "s-world-places" : "people"}`)}">${place ? "Places" : "People"}, in Building Your World</a></p>` : ""}</form>`);
  }

  // ------------------------------------------------------------ one page

  const editKey = (p, k) => `${p.id}:${k}`;
  const badge = (p, k) => `<span class="wb-badge${p.shown.page && p.shown[k] ? " is-on" : ""}">${p.shown.page && p.shown[k] ? "Shown" : "Hidden"}</span>`;
  // Show it to the crew, or hide it again: the top of each part, hers.
  function shower(p, k) {
    if (!p.shown.page) return `<p class="cc-small wb-show">Show the crew ${esc(p.name)} first, then this.</p>`;
    const on = p.shown[k];
    const label = on ? "Hide it from the crew" : k === "secret" ? w.sure(`psecret-${p.id}`, "Tap again to show the Secret", "Show the crew its Secret") : "Show the crew";
    return `<div class="wb-show${on ? " is-on" : ""}"><p class="cc-small">${on ? "The crew’s been shown this." : "Only you see this."}</p><button type="button" class="button sm${on ? "" : k === "secret" ? " danger" : " primary"}" data-act="w" data-do="pshow" data-p="${esc(p.id)}" data-k="${k}" aria-pressed="${on}">${label}</button></div>`;
  }
  const saveRow = `<div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button></div>`;

  // How a person fights, the way the Threat Builder writes it.
  function tagView(t) {
    const label = `${kitTag(t.text)}${t.x > 1 ? ` <b class="wp-x">×${t.x}</b>` : ""}${t.note ? ` <small>(${esc(t.note)})</small>` : ""}`;
    const does = tagDoes(t.text);
    return does ? `<details class="wp-tag"><summary>${label}</summary><p>${esc(does)}</p></details>` : `<span class="wp-tag">${label}</span>`;
  }
  function threatBody(p, gm, L) {
    const t = p.threat;
    const groups = TAG_KINDS.map(([k, label]) => {
      const tags = t.tags.filter((g) => g.part === k);
      if (!tags.length && k !== "keeps") return "";
      return `<div><dt>${label}</dt><dd>${tags.length ? tags.map(tagView).join("") : "<span>Nothing. One good win.</span>"}</dd></div>`;
    }).join("");
    const hers = gm ? [
      t.tele.length ? `<div class="wp-hers-b"><h3>Telegraphs <small>only you see these</small></h3><ul class="wp-teles">${t.tele.map((x) => `<li>${inline(x.text, L)}</li>`).join("")}</ul></div>` : "",
      t.voice ? `<div class="wp-hers-b"><h3>Voice</h3><p class="wp-voice">${inline(t.voice, L)}</p></div>` : "",
      t.forms ? `<div class="wp-hers-b"><h3>Forms</h3>${rich(t.forms, L)}</div>` : "",
    ].join("") : "";
    return `<div class="wp-threat"><div class="wp-c" role="img" aria-label="Challenge ${t.c}, d${t.c * 2}">${kitDie(t.c * 2, { own: "them", hide: true })}<p><span class="wb-k">Challenge</span><b>${t.c}</b> <small>d${t.c * 2}</small></p></div>
      <dl class="wp-tags">${groups}</dl>${hers}</div>`;
  }
  function threatForm(p) {
    const t = p.threat ?? { c: 3, tags: [], tele: [], voice: "", forms: "" };
    const rows = [...t.tags, ...Array.from({ length: 2 }, () => ({ id: "", text: "", x: 1, part: "", note: "" }))];
    const names = WB ? Object.keys(WB.tags) : [];
    const row = (g, i) => `<fieldset class="wp-trow"><legend class="sr-only">Tag ${i + 1}</legend>
      <label class="cc-field">Tag <input name="tag-${i}" maxlength="${PMAX.tag}" autocomplete="off" value="${esc(g.text)}" list="wp-tagnames"></label>
      <div class="wp-trow-in"><label class="cc-field">Kind <select name="part-${i}">${TAG_KINDS.map(([k, label]) => `<option value="${k}"${g.part === k ? " selected" : ""}>${k ? label : "Just a tag"}</option>`).join("")}</select></label>
      <label class="cc-field">Wins <select name="x-${i}">${Array.from({ length: 9 }, (_, n) => `<option value="${n + 1}"${n + 1 === g.x ? " selected" : ""}>×${n + 1}</option>`).join("")}</select></label>
      <label class="cc-field">Note <input name="note-${i}" maxlength="40" autocomplete="off" value="${esc(g.note)}" list="wp-notes" placeholder="like first"></label></div></fieldset>`;
    return `<form class="cc-form pt-form wb-editing wp-tform" data-form="w-pthreat" data-p="${esc(p.id)}" data-rows="${rows.length}">
      <label class="cc-field">Challenge, the die the crew has to beat <select name="c">${[1, 2, 3, 4, 5, 6].map((c) => `<option value="${c}"${c === t.c ? " selected" : ""}>${c}, d${c * 2}</option>`).join("")}</select></label>
      ${rows.map(row).join("")}
      ${names.length ? `<datalist id="wp-tagnames">${names.map((n) => `<option value="${esc(n)}"></option>`).join("")}</datalist>` : ""}<datalist id="wp-notes"><option value="first"></option><option value="weak point"></option></datalist>
      <label class="cc-field">Telegraphs, one to a line, only yours <textarea name="tele" rows="3" maxlength="${PMAX.tele1 * PMAX.tele}">${esc(t.tele.map((x) => x.text).join("\n"))}</textarea></label>
      <label class="cc-field">Voice, a line to say in character <input name="voice" maxlength="${PMAX.words}" autocomplete="off" value="${esc(t.voice)}"></label>
      <label class="cc-field">Forms, if it changes shape <textarea name="forms" rows="2" maxlength="${PMAX.forms}">${esc(t.forms)}</textarea></label>
      <p class="cc-small">Its hidden tag is its Secret, further down.</p>${saveRow}</form>`;
  }
  function threatPart(id, p, gm, L) {
    const key = editKey(p, "threat");
    if (gm && w.ui().editing === key) return w.part(`pthreat-${p.id}`, "How they fight", "Changing it", threatForm(p), badge(p, "threat"));
    if (!p.threat) {
      if (!gm) return "";
      const groups = WB ? [...new Set(WB.threats.map((t) => t.group))] : [];
      const pick = WB ? `<form class="cc-form pt-form pt-add" data-form="w-pthreatbook" data-p="${esc(p.id)}"><label class="cc-field">Start from a threat in the book <select name="t">${groups.map((g) => `<optgroup label="${esc(g)}">${WB.threats.map((t, i) => (t.group === g ? `<option value="${i}">${esc(t.name)}, Challenge ${t.threat.c}</option>` : "")).join("")}</optgroup>`).join("")}</select></label><div class="cc-row"><button type="submit" class="button">Use it</button></div></form>` : "";
      return w.part(`pthreat-${p.id}`, "How they fight", "Not a threat yet",
        `<p class="cc-lead">A threat’s a Challenge and a few tags. Roll one on the Threat Builder, start from one in the book, or write your own.</p>
        <div class="cc-row">${WB ? '<button type="button" class="button primary" data-act="w" data-do="pthreatroll" data-p="' + esc(p.id) + '">Roll one</button>' : ""}<button type="button" class="button" data-act="w" data-do="edit" data-k="${esc(key)}">Write it yourself</button></div>${pick}
        <p class="cc-small">${w.ruleLink("building-a-threat", "Building a threat")}</p>`);
    }
    const t = p.threat;
    const glance = `Challenge ${t.c} <small>· d${t.c * 2} · ${plural(t.tags.length, "tag", "tags")}</small>`;
    const tools = gm ? `<div class="cc-row"><button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">Change how they fight</button><button type="button" class="pt-reword" data-act="w" data-do="pthreatoff" data-p="${esc(p.id)}">${w.sure(`pthreatoff-${p.id}`, "Tap again to take it off", "Not a threat after all")}</button></div>` : "";
    return w.part(`pthreat-${p.id}`, "How they fight", glance,
      `${gm ? shower(p, "threat") : ""}${threatBody(p, gm, L)}${tools}<p class="cc-small">${w.ruleLink("s-hidden", "Hidden tags and weak points")}</p>`, gm ? badge(p, "threat") : "");
  }

  // Everything it's linked to: the links she's made, and every page or
  // faction its words name or that names it.
  function linkedPart(id, x, doc, gm, L) {
    const made = new Set(linksTo(doc, x.id));
    const named = mentionsOf(doc, x.id, L.names, L.re);
    const all = [...new Set([...made, ...named])];
    if (!gm && !all.length) return "";
    const groups = [["place", "Places"], ["person", "People"], ["faction", "Factions"]].map(([k, label]) => {
      const items = all.map((to) => findPage(doc, to) ?? doc.factions.find((f) => f.id === to)).filter((y) => y && (k === "faction" ? !y.kind : y.kind === k));
      if (!items.length) return "";
      return `<div class="wp-linked"><h3>${label}</h3><ul class="wp-links">${items.map((y) => `<li><a class="wp-chip" href="${esc(hrefOf(id, doc, y.id))}" data-act="w" data-do="nav">${esc(y.name)}</a>${y.kind ? (y.about ? ` <small>${esc(y.about)}</small>` : "") : y.want ? ` <small>${esc(y.want)}</small>` : ""}
        ${gm && made.has(y.id) ? `<button type="button" class="button sm wp-unlink" data-act="w" data-do="punlink" data-a="${esc(x.id)}" data-b="${esc(y.id)}" aria-label="Unlink ${esc(y.name)}">Unlink</button>` : gm && !made.has(y.id) ? ' <small class="wp-named">named</small>' : ""}</li>`).join("")}</ul></div>`;
    }).join("");
    let form = "";
    if (gm) {
      const others = [...doc.pages.filter((y) => y.id !== x.id && !made.has(y.id)), ...doc.factions.filter((f) => f.id !== x.id && !made.has(f.id))];
      const opt = (y) => `<option value="${esc(y.id)}">${esc(y.name)}</option>`;
      form = others.length ? `<form class="cc-form pt-form pt-add" data-form="w-plink" data-p="${esc(x.id)}"><label class="cc-field">Link it to <select name="to">
        ${[["place", "Places"], ["person", "People"]].map(([k, label]) => (others.some((y) => y.kind === k) ? `<optgroup label="${label}">${others.filter((y) => y.kind === k).map(opt).join("")}</optgroup>` : "")).join("")}
        ${others.some((y) => !y.kind) ? `<optgroup label="Factions">${others.filter((y) => !y.kind).map(opt).join("")}</optgroup>` : ""}</select></label>
        <div class="cc-row"><button type="submit" class="button">Link them</button></div>
        <p class="cc-small">The crew sees a link once they’ve been shown both ends of it. A name in your own part only links for you, so keep a link that’d give something away there.</p></form>` : "";
    }
    const count = all.length;
    return w.part(`plinks-${x.id}`, x.kind ? "Linked" : "Places and people", count ? few(all.map((to) => (findPage(doc, to) ?? doc.factions.find((f) => f.id === to))?.name).filter(Boolean)) : "Nothing yet", `${groups || '<p class="cc-small">Nothing linked yet.</p>'}${form}`);
  }
  const few = (names) => esc(names.length > 3 ? `${names.slice(0, 3).join(" · ")} and ${names.length - 3} more` : names.join(" · "));

  // Her part: what's only ever hers.
  function hersPart(id, p, gm, L) {
    if (!gm) return "";
    const key = editKey(p, "hers");
    const T = WB?.tables;
    const place = p.kind === "place";
    const form = w.ui().editing === key
      ? `<form class="cc-form pt-form wb-editing" data-form="w-phers" data-p="${esc(p.id)}">
        ${place ? `<label class="cc-field">Its Challenge, for Study and its own telegraphs <select name="c"><option value="0">None</option>${[1, 2, 3, 4, 5, 6].map((c) => `<option value="${c}"${c === p.c ? " selected" : ""}>${c}, d${c * 2}</option>`).join("")}</select></label>
        <label class="cc-field">Its complication <input name="comp" maxlength="${PMAX.line}" autocomplete="off" value="${esc(p.comp)}" list="wp-comps-e"></label>${T ? `<datalist id="wp-comps-e">${T.comp.map((r) => `<option value="${esc(r)}"></option>`).join("")}</datalist>` : ""}` : ""}
        <label class="cc-field">Your note <textarea name="note" maxlength="${PMAX.note}" rows="6">${esc(p.note)}</textarea></label>
        <p class="cc-small">A line to a paragraph, with *stars* round a tag to put it in italics.</p>${saveRow}</form>`
      : `${place && (p.c || p.comp) ? `<dl class="wb-words">${p.c ? `<div><dt>Challenge</dt><dd>${p.c} <small>d${p.c * 2}, for Study and its own telegraphs</small></dd></div>` : ""}${p.comp ? `<div><dt>Trouble</dt><dd>${inline(p.comp, L)}</dd></div>` : ""}</dl>` : ""}
        ${p.note ? `<div class="wp-note">${rich(p.note, L)}</div>` : '<p class="cc-small">No note yet.</p>'}
        <button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">${place ? "Change these" : p.note ? "Change your note" : "Write a note"}</button>`;
    // The trouble that brings the crew in.
    const hooks = `<div class="wp-hooks"><h3>Hooks</h3>${p.hooks.length ? `<ul class="pt-lines">${p.hooks.map((h) => `<li class="pt-line"><div class="pt-line-in"><p>${inline(h.text, L)}</p></div><div class="cc-row wb-line-row"><button type="button" class="button sm" data-act="w" data-do="phookoff" data-p="${esc(p.id)}" data-h="${esc(h.id)}" aria-label="Take off the hook ${esc(h.text)}">${w.sure(`phook-${h.id}`, "Tap again", "Take it off")}</button></div></li>`).join("")}</ul>` : '<p class="cc-small">None yet.</p>'}
      ${p.hooks.length < PMAX.hooks ? `<form class="cc-form pt-form pt-add" data-form="w-phook" data-p="${esc(p.id)}"><label class="cc-field">A new hook <input name="text" maxlength="${PMAX.words}" autocomplete="off" list="wp-hooks"></label>${T ? `<datalist id="wp-hooks">${T.hooks.map((r) => `<option value="${esc(r)}"></option>`).join("")}</datalist>` : ""}
        <div class="cc-row"><button type="submit" class="button">Add it</button>${T ? '<button type="button" class="button" data-act="w" data-do="prollhook">Roll one</button>' : ""}</div></form>` : ""}</div>`;
    // A place out of Twenty Places has its scene ready for the live table.
    const sc = place && p.scene ? (d.places ?? []).find((x) => x.id === p.scene) : null;
    const lowerThe = (s) => String(s).replace(/^(The|A|An) /, (m) => m.toLowerCase());
    const scene = sc ? `<div class="wp-scene"><h3>Its scene</h3><p class="cc-small">${esc(andList(sc.ground.map((g) => g.name)))} to use, ${esc(andList(sc.stakes.map((s) => lowerThe(s.name))))} at stake, and the scene clock on d${sc.clock.d}: ${esc(bare(sc.clock.what))}.</p>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="ptable" data-p="${esc(p.id)}">${w.sure(`ptable-${p.id}`, "Tap again, it takes the place of the scene that’s on", "Put its scene on the live table")}</button></div></div>` : "";
    const glance = [place && p.c ? `Challenge ${p.c}` : "", p.hooks.length ? plural(p.hooks.length, "hook", "hooks") : "", p.note ? "a note" : ""].filter(Boolean).join(" · ") || "Only you see it";
    return w.part(`phers-${p.id}`, "Just for you", glance, `<p class="cc-lead">Never shown to the crew.</p>${form}${hooks}${scene}`);
  }

  // What the book's changed on a page she brought in, since she brought it
  // in or last looked: each change in words, and the changes that take it.
  function bookNews(p) {
    const now = bookPage(p);
    if (!now || !p.book || now.h === p.book.h || (now.at ?? 0) < (p.book.at ?? 0)) return null;
    const was = p.book.was;
    const real = [];
    const realOps = [];
    const quietOps = [];
    for (const [k, label] of [["name", "Its name"], ["about", "What it is"], ["text", "What the crew sees"], ["want", "What they want"], ["secret", "Its Secret"], ["more", "The rest of its Secret"], ["note", "Your part, from the book"]]) {
      const a = was[k] ?? "";
      const b = now[k] ?? "";
      if (a === b) continue;
      if (typo(a, b)) {
        if (p[k] === a) quietOps.push({ o: "pset", id: p.id, f: k, v: b });
      } else {
        real.push(`${label}: ${b ? `<em>${esc(bare(b).slice(0, 160))}</em>` : "nothing"}`);
        if (p[k] !== b && (k !== "name" || b)) realOps.push({ o: "pset", id: p.id, f: k, v: b });
      }
    }
    if ((now.c ?? 0) !== (was.c ?? 0) && p.kind === "place") {
      real.push(`Its Challenge: ${now.c || "none"}`);
      realOps.push({ o: "pset", id: p.id, f: "c", v: now.c ?? 0 });
    }
    const hooksA = was.hooks ?? [];
    const hooksB = now.hooks ?? [];
    const gone = hooksA.filter((x) => !hooksB.includes(x));
    const added = hooksB.filter((x) => !hooksA.includes(x));
    for (const x of gone) {
      const y = added.find((z) => typo(x, z));
      const hers = p.hooks.find((h) => h.text === x);
      if (y) {
        added.splice(added.indexOf(y), 1);
        if (hers) quietOps.push({ o: "pedit", id: p.id, l: "hooks", lid: hers.id, f: "text", v: y });
        continue;
      }
      real.push(`A hook gone: <s>${esc(x)}</s>`);
      if (hers) realOps.push({ o: "pdrop", id: p.id, l: "hooks", lid: hers.id });
    }
    for (const y of added) {
      real.push(`A new hook: <em>${esc(y)}</em>`);
      if (!p.hooks.some((h) => keyOf(h.text) === keyOf(y))) realOps.push({ o: "padd", id: p.id, l: "hooks", item: { id: newId(), text: y } });
    }
    // How they fight: what the book's changed goes onto hers, and the rest of
    // hers stays the way she's got it.
    if (p.kind === "person" && JSON.stringify(was.threat ?? null) !== JSON.stringify(now.threat ?? null)) {
      const a = was.threat ?? { c: 0, tags: [], tele: [], voice: "", forms: "" };
      const b = now.threat ?? { c: 0, tags: [], tele: [], voice: "", forms: "" };
      const mine = p.threat ? copy(p.threat) : { c: b.c || 1, tags: [], tele: [], voice: "", forms: "" };
      const said = [];
      if (a.c !== b.c) {
        said.push(`Challenge ${b.c}`);
        mine.c = b.c || mine.c;
      }
      for (const g of a.tags.filter((x) => !b.tags.some((y) => keyOf(y.text) === keyOf(x.text)))) {
        said.push(`<s>${esc(g.text)}</s> gone`);
        mine.tags = mine.tags.filter((x) => keyOf(x.text) !== keyOf(g.text));
      }
      for (const g of b.tags) {
        const x = a.tags.find((y) => keyOf(y.text) === keyOf(g.text));
        const hers = mine.tags.find((y) => keyOf(y.text) === keyOf(g.text));
        if (!x) {
          said.push(`<em>${esc(g.text)}</em> new`);
          if (!hers) mine.tags.push({ ...g, id: newId() });
        } else if (x.x !== g.x || x.part !== g.part || x.note !== g.note) {
          said.push(`<em>${esc(g.text)}</em>${g.x > 1 ? ` ×${g.x}` : ""}`);
          if (hers) Object.assign(hers, { x: g.x, part: g.part, note: g.note });
        }
      }
      for (const t of a.tele.filter((x) => !b.tele.includes(x))) mine.tele = mine.tele.filter((x) => x.text !== t);
      for (const t of b.tele.filter((x) => !a.tele.includes(x))) if (!mine.tele.some((x) => x.text === t)) mine.tele.push({ id: newId(), text: t });
      if (a.tele.join("\n") !== b.tele.join("\n")) said.push("its telegraphs");
      for (const k of ["voice", "forms"]) {
        if (a[k] === b[k]) continue;
        said.push(k === "voice" ? "its voice" : "its Forms");
        mine[k] = b[k];
      }
      if (said.length) {
        real.push(`How they fight: ${said.join(", ")}`);
        realOps.push({ o: "threat", id: p.id, t: mine });
      }
    }
    const { h, at, link, people, group, ...card } = now;
    return { real, realOps, quietOps, book: { o: "pbook", id: p.id, card, h, at } };
  }
  // Typo fixes, and changes that don't touch her page, go in without a word.
  function quiet(doc) {
    if (!WB) return [];
    const ops = [];
    for (const p of doc.pages) {
      const news = bookNews(p);
      if (news && !news.real.length) ops.push(...news.quietOps, news.book);
    }
    return ops;
  }

  function pageView(id, pid) {
    const gm = w.isGm(id);
    const doc = w.docOf(id);
    const p = findPage(doc, pid);
    book();
    // A player who came from a character's World tab goes back to it, and
    // anyone who came from another page goes back to that.
    const from = String(history.state?.from ?? "");
    const tab = /^\/characters\/\?c=[^&]+&t=world$/.test(from);
    const back = tab ? from : /[?&]world&[pf]=/.test(from) ? from : `/characters/?camp=${encodeURIComponent(id)}&world`;
    const top = w.topbar(back, tab ? "The world" : /[?&]world&[pf]=/.test(from) ? "Back" : "The world");
    if (!p) {
      return `${top}<header class="cc-camp-head"><p class="kicker">The world</p><h1>Not in the world</h1></header>
        <div class="cc-note is-warn"><p>${w.camp(id).at || navigator.onLine === false ? "That page isn’t in the world any more, or the crew hasn’t been shown it." : "Opening the world…"}</p></div>`;
    }
    const L = linker(id, doc, p.id);
    const say = w.status(id);
    const place = p.kind === "place";

    // What the crew sees once she shows it: its name, what it is, what the
    // crew sees, and what a person wants.
    const wordsKey = editKey(p, "words");
    const words = gm && w.ui().editing === wordsKey
      ? `<form class="cc-form pt-form wb-editing" data-form="w-pwords" data-p="${esc(p.id)}">
        <label class="cc-field">${place ? "Its name" : "Their name"} <input name="name" maxlength="${PMAX.name}" autocomplete="off" required value="${esc(p.name)}"></label>
        <label class="cc-field">${place ? "What it is" : "Who they are"} <input name="about" maxlength="${PMAX.line}" autocomplete="off" value="${esc(p.about)}"></label>
        <label class="cc-field">What the crew sees <textarea name="text" maxlength="${PMAX.text}" rows="5">${esc(p.text)}</textarea></label>
        ${place ? "" : `<label class="cc-field">What they want <input name="want" maxlength="${PMAX.words}" autocomplete="off" value="${esc(p.want)}" list="wp-wants-e"></label>${WB ? `<datalist id="wp-wants-e">${WB.tables.want.map((r) => `<option value="${esc(r)}"></option>`).join("")}</datalist>` : ""}`}
        <label class="cc-field">Also called, so these link too <input name="aka" maxlength="${PMAX.name * PMAX.aka}" autocomplete="off" value="${esc(p.aka.join(", "))}" placeholder="like Orla, the baths"></label>
        <p class="cc-small">A line to a paragraph. Names of other places, people and factions link on their own.</p>${saveRow}</form>`
      : `${p.text ? `<div class="wp-text">${rich(p.text, L)}</div>` : gm ? '<p class="cc-small">Nothing for the crew to see yet.</p>' : ""}
        ${!place && p.want ? `<dl class="wb-words"><div><dt>Wants</dt><dd><em>${inline(p.want, L)}</em></dd></div></dl>` : ""}
        ${gm ? `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(wordsKey)}">Change what the crew sees</button>` : ""}`;
    // A player only gets the card when there's something on it.
    const card = gm || p.text || (!place && p.want);
    const head = `<header class="cc-camp-head wb-head"><p class="kicker is-gm">${KIND[p.kind]}</p><h1>${esc(p.name)}</h1>${p.about ? `<p class="cc-small wp-about">${inline(p.about, L)}</p>` : ""}${p.aka.length && gm ? `<p class="cc-small">Also called ${esc(andList(p.aka))}</p>` : ""}</header>
      ${card ? `<div class="wb-card card wp-card" data-glow="${w.lit(id).includes(p.id) ? "1" : ""}">${words}</div>` : ""}`;
    const showCard = gm ? `<div class="wb-show wb-show-card${p.shown.page ? " is-on" : ""}"><p>${p.shown.page ? `The crew can see ${place ? "it" : "them"}: the name, ${place ? "what it is and what they see there" : "who they are, what the crew sees and what they want"}, and whatever else you’ve shown them.` : `The crew can’t see ${place ? "it" : "them"} yet. Show ${place ? "it when they get there or hear of it" : "them when the crew meets them or hears of them"}.`}</p>
      <button type="button" class="button${p.shown.page ? "" : " primary"}" data-act="w" data-do="pshow" data-p="${esc(p.id)}" data-k="page" aria-pressed="${p.shown.page}">${p.shown.page ? "Hide it from the crew" : `Show the crew ${esc(p.name)}`}</button></div>` : "";

    const news = gm ? bookNews(p) : null;
    const bookNote = news?.real.length ? `<div class="cc-note is-gold wb-book" role="status"><p><b>The book’s changed ${esc(p.name)} since you brought ${place ? "it" : "them"} in.</b></p><ul>${news.real.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="pbook" data-p="${esc(p.id)}" data-take="1">Take the book’s changes</button><button type="button" class="button" data-act="w" data-do="pbook" data-p="${esc(p.id)}" data-take="0">Keep mine</button></div>
      <p class="cc-small">Taking them only changes what the book changed, and the rest stays yours.</p></div>` : "";

    const parts = [];
    if (!place) parts.push(threatPart(id, p, gm, L));
    if (gm || p.shown.secret) {
      const key = editKey(p, "secret");
      const body = gm && w.ui().editing === key
        ? `<form class="cc-form pt-form wb-editing" data-form="w-psecret" data-p="${esc(p.id)}"><label class="cc-field">Its Secret, the hidden tag <input name="secret" maxlength="${PMAX.line}" autocomplete="off" value="${esc(p.secret)}"${place ? "" : ' list="wp-hides-e"'}></label>${!place && WB ? `<datalist id="wp-hides-e">${WB.tables.hiding.map((r) => `<option value="${esc(r)}"></option>`).join("")}</datalist>` : ""}
          <label class="cc-field">The rest of it <textarea name="more" maxlength="${PMAX.more}" rows="4">${esc(p.more)}</textarea></label>${saveRow}</form>`
        : `${p.secret ? `<div class="wb-secret"><p><em>${linkify(bare(p.secret), L)}.</em></p>${rich(p.more, L)}</div>` : '<p class="cc-small">No Secret written yet.</p>'}${gm ? `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">Change its Secret</button>` : ""}`;
      parts.push(w.part(`psecret-${p.id}`, "Secret", p.secret ? `<em>${esc(bare(p.secret))}</em>` : "Not written yet", `${gm ? shower(p, "secret") : ""}${body}`, gm ? badge(p, "secret") : ""));
    }
    parts.push(linkedPart(id, p, doc, gm, L));
    parts.push(hersPart(id, p, gm, L));

    const source = gm && p.book ? (p.book.from === "places" ? { name: "Twenty Places", link: WB?.places.find((x) => x.key === p.book.key || x.people.some((y) => y.key === p.book.key))?.link } : WB?.worlds.find((x) => x.id === p.book.from)) : null;
    const hidden = !gm && ((!place && !p.shown.threat) || !p.shown.secret);
    const end = gm ? `<section class="cc-sec" aria-labelledby="wp-off"><h2 id="wp-off" class="sr-only">Taking it out</h2>${source?.link ? `<p class="cc-small">From ${esc(source.name)}. <a class="pt-reword" href="${esc(source.link)}">Read it in the book</a></p>` : ""}
      <div class="cc-row"><button type="button" class="button danger" data-act="w" data-do="pgone" data-p="${esc(p.id)}">${w.sure(`pgone-${p.id}`, "Tap again to take it out of the world", "Take it out of the world")}</button></div></section>`
      : hidden ? `<p class="cc-small wb-more">There’s more to ${esc(p.name)} you haven’t found out yet.</p>` : "";
    if (!gm) w.lit(id).length = 0;
    return `${top}<div class="wb wp" data-wb="${esc(id)}">${head}${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${showCard}${bookNote}<div class="cc-folds wb-parts">${parts.join("")}</div>${end}</div>`;
  }

  // ------------------------------------------------------------ a faction's page

  // A faction's words, with every name in them a link.
  const factionLine = (id, doc, f, text) => inline(text, linker(id, doc, f.id));
  // Its Face, a link to their page, or for her a page for them in a tap.
  function faceOf(f) {
    const raw = bare(String(f.face ?? "").trim());
    if (!raw) return null;
    const i = raw.indexOf(", ");
    const name = capFirst(i > 0 ? raw.slice(0, i) : raw).slice(0, PMAX.name);
    let about = i > 0 ? raw.slice(i + 2) : "";
    about = about.replace(/^who['’]s (\w+)/, (_, x) => (/ing$/.test(x) ? `is ${x}` : `has ${x}`)).replace(/^who /, "");
    return { name, about: about ? `${capFirst(about)}.` : "" };
  }
  function faceLine(id, doc, f, gm) {
    const L = linker(id, doc, f.id);
    const words = inline(f.face, L);
    if (!gm) return words;
    const named = mentionsIn(f.face, L.names, L.re).some((m) => findPage(doc, m.to)?.kind === "person");
    const face = faceOf(f);
    return named || !face ? words : `${words} <button type="button" class="pt-reword wp-face" data-act="w" data-do="pface" data-f="${esc(f.id)}">A page for ${esc(face.name)}</button>`;
  }
  const factionPart = (id, f, doc, gm) => linkedPart(id, f, doc, gm, linker(id, doc, f.id));

  // ------------------------------------------------------------ for players

  // What's new for a player: a page they've just been shown, or a part of one.
  function newsOf(gmName, was, now) {
    const said = [];
    const keys = [];
    const before = new Map((was.pages ?? []).map((p) => [p.id, p]));
    for (const p of now.pages ?? []) {
      const b = before.get(p.id);
      if (!b) {
        said.push(`${gmName} showed you ${bare(p.name)}.`);
        keys.push(p.id);
        continue;
      }
      const parts = ["threat", "secret"].filter((k) => p.shown[k] && !b.shown[k]);
      if (parts.length) {
        said.push(parts.length === 1 ? `You’ve found out ${parts[0] === "secret" ? `${bare(p.name)}’s Secret` : `how ${bare(p.name)} fights`}.` : `You’ve found out more about ${bare(p.name)}.`);
        keys.push(p.id);
      }
    }
    return { said, keys };
  }
  // The tile's words about places and people.
  function glance(doc) {
    const places = doc.pages.filter((p) => p.kind === "place").length;
    const people = doc.pages.length - places;
    return [places ? plural(places, "place", "places") : "", people ? plural(people, "person", "people") : ""].filter(Boolean).join(" and ");
  }

  // ------------------------------------------------------------ taps

  const bring = (id, ops, say) => w.edit(id, ops, say);
  const ACT = {
    pjump(el) {
      const to = document.getElementById(el.dataset.to);
      if (!to) return;
      to.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    },
    // One of Twenty Places, with its people, each linked to it.
    pbring(el, id) {
      const b = WB?.places.find((x) => x.key === el.dataset.k);
      if (!b) return;
      const doc = w.docOf(id);
      if (doc.pages.some((p) => p.book?.from === "places" && p.book.key === b.key)) return d.toast(`${bare(b.name)}’s in your world already.`, false);
      const want = doc.pages.length + 1 + b.people.length;
      if (want > PMAX.pages) return d.toast(`That’s more than the ${PMAX.pages} pages a world holds. Take some out first.`, false);
      const place = fromBook(b, "place", "places");
      const people = b.people.filter((x) => !doc.pages.some((p) => p.book?.key === x.key)).map((x) => fromBook(x, "person", "places"));
      const ops = [{ o: "page", p: place }, ...people.map((x) => ({ o: "page", p: x })), ...people.map((x) => ({ o: "link", a: place.id, b: x.id }))];
      bring(id, ops, `${bare(b.name)}’s in your world${people.length ? `, with ${andList(people.map((x) => x.name))}` : ""}. Nothing’s shown to the crew yet.`);
    },
    // The Steeplands' cities, or a frame's places, all at once.
    pworld(el, id) {
      const x = WB?.worlds.find((y) => y.id === el.dataset.b);
      if (!x) return;
      const doc = w.docOf(id);
      const left = x.places.filter((p) => !doc.pages.some((q) => q.book?.from === x.id && q.book.key === p.key));
      if (!left.length) return d.toast(`${bare(x.name)}’s places are in your world already.`, false);
      if (doc.pages.length + left.length > PMAX.pages) return d.toast(`That’s more than the ${PMAX.pages} pages a world holds. Take some out first.`, false);
      bring(id, left.map((p) => ({ o: "page", p: fromBook(p, "place", x.id) })), `${andList(left.map((p) => bare(p.name)))} ${left.length === 1 ? "is" : "are"} in your world. Nothing’s shown to the crew yet.`);
    },
    pshow(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      if (!p) return;
      const k = el.dataset.k;
      const v = !p.shown[k];
      // The Secret takes a second tap to show.
      if (v && k === "secret" && w.ui().sure !== `psecret-${p.id}`) {
        w.ui().sure = `psecret-${p.id}`;
        return d.render();
      }
      const say = k === "page"
        ? v ? `The crew can see ${bare(p.name)} now.` : `${bare(p.name)}’s hidden from the crew again.`
        : v ? `The crew can see ${bare(p.name)}’s ${k === "secret" ? "Secret" : "Challenge and tags"} now.` : `${bare(p.name)}’s ${k === "secret" ? "Secret is" : "Challenge and tags are"} hidden from the crew again.`;
      w.edit(id, [{ o: "pshow", id: p.id, p: k, v }], say);
    },
    pgone(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      if (!p) return;
      if (w.ui().sure !== `pgone-${p.id}`) {
        w.ui().sure = `pgone-${p.id}`;
        return d.render();
      }
      w.ui().editing = "";
      if (w.edit(id, [{ o: "unpage", id: p.id }], `${bare(p.name)}’s out of the world.`)) d.go(`/characters/?camp=${encodeURIComponent(id)}&world`, { replace: true });
    },
    pbook(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      const news = p ? bookNews(p) : null;
      if (!news) return d.render();
      if (el.dataset.take === "1") w.edit(id, [...news.quietOps, ...news.realOps, news.book], `${bare(p.name)} has the book’s changes now.`);
      else w.edit(id, [...news.quietOps, news.book], `${bare(p.name)} stays the way you’ve got ${p.kind === "place" ? "it" : "them"}.`);
    },
    // Building Your World's tables, rolled into the form.
    prollnew(el) {
      const form = el.closest("form");
      const T = WB?.tables;
      if (!form || !T) return;
      const put = (name, v) => {
        const input = form.elements.namedItem(name);
        if (input) input.value = v ?? "";
      };
      if (el.dataset.kind === "place") put("comp", T.comp[roll(12)]);
      else {
        put("want", T.want[roll(12)]);
        put("secret", T.hiding[roll(12)]);
      }
      d.toast("Rolled. Keep what fits and change the rest.", false);
    },
    prollhook(el) {
      const input = el.closest("form")?.elements.namedItem("text");
      if (!input || !WB) return;
      input.value = WB.tables.hooks[roll(20)];
      d.toast("Rolled a d20. Make it this place’s trouble, then add it.", false);
    },
    phookoff(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      const h = p?.hooks.find((x) => x.id === el.dataset.h);
      if (!h) return;
      if (w.ui().sure !== `phook-${h.id}`) {
        w.ui().sure = `phook-${h.id}`;
        return d.render();
      }
      w.edit(id, [{ o: "pdrop", id: p.id, l: "hooks", lid: h.id }], "That hook’s off.");
    },
    // The Threat Builder: what it is, then enough tags for a named threat.
    pthreatroll(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      const B = WB?.builder;
      if (!p || !B) return;
      const plain = B.what.filter((x) => !x.twice);
      const first = B.what[roll(B.what.length)];
      const what = first.twice ? (() => {
        const a = plain[roll(plain.length)];
        let b = a;
        for (let i = 0; i < 20 && b === a; i++) b = plain[roll(plain.length)];
        return [a, b];
      })() : [first];
      const kindOf = (t) => WB.tags[t]?.part ?? (B.comes.includes(t) ? "comes" : B.keeps.includes(t) ? "keeps" : B.drives.includes(t) ? "drives" : "");
      const tags = [];
      for (const x of what) for (const t of x.tags) if (!tags.some((g) => g.text === t)) tags.push({ text: t, part: kindOf(t) });
      // A named threat comes at you one way, has two things keeping it going,
      // and something driving it.
      for (const [part, n, table] of [["comes", 1, B.comes], ["keeps", 2, B.keeps], ["drives", 1, B.drives]]) {
        for (let i = 0; i < 40 && tags.filter((g) => g.part === part).length < n; i++) {
          const t = table[roll(table.length)];
          if (!tags.some((g) => g.text === t)) tags.push({ text: t, part });
        }
      }
      const c = Math.max(...what.map((x) => x.c));
      const t = { c, tags: tags.map((g) => ({ id: newId(), text: g.text, x: 1, part: g.part, note: "" })), tele: [], voice: "", forms: "" };
      w.edit(id, [{ o: "threat", id: p.id, t }], `Rolled ${andList(what.map((x) => x.name.toLowerCase()))}: Challenge ${c}, d${c * 2}. Change whatever doesn’t fit, and give ${bare(p.name)} a hidden tag as their Secret.`);
    },
    pthreatoff(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      if (!p?.threat) return;
      if (w.ui().sure !== `pthreatoff-${p.id}`) {
        w.ui().sure = `pthreatoff-${p.id}`;
        return d.render();
      }
      w.edit(id, [{ o: "threat", id: p.id, t: null }, ...(p.shown.threat ? [{ o: "pshow", id: p.id, p: "threat", v: false }] : [])], `${bare(p.name)}’s not a threat now.`);
    },
    punlink(el, id) {
      const doc = w.docOf(id);
      const b = findPage(doc, el.dataset.b) ?? doc.factions.find((f) => f.id === el.dataset.b);
      w.edit(id, [{ o: "unlink", a: el.dataset.a, b: el.dataset.b }], `Unlinked${b ? ` from ${bare(b.name)}` : ""}.`);
    },
    // A place's scene, straight onto the live table.
    ptable(el, id) {
      const p = findPage(w.docOf(id), el.dataset.p);
      if (!p?.scene || !d.toTable) return;
      if (d.sceneOn?.(id) && w.ui().sure !== `ptable-${p.id}`) {
        w.ui().sure = `ptable-${p.id}`;
        return d.render();
      }
      w.ui().sure = "";
      d.toTable(id, p.scene);
    },
    // A faction's Face, as a page of their own, linked to it.
    pface(el, id) {
      const doc = w.docOf(id);
      const f = doc.factions.find((x) => x.id === el.dataset.f);
      const face = f ? faceOf(f) : null;
      if (!face) return;
      if (doc.pages.length >= PMAX.pages) return d.toast(`That’s ${PMAX.pages} pages, which is as many as a world holds.`, false);
      const pid = newId();
      const ok = w.edit(id, [
        { o: "page", p: { id: pid, kind: "person", name: face.name, about: face.about || `The face of ${f.name}.`, aka: akaOf(face.name), shown: {} } },
        { o: "link", a: pid, b: f.id },
      ], `${bare(face.name)} has a page, linked to ${bare(f.name)}. Nothing’s shown to the crew yet.`);
      // Back from their page goes back to the faction's.
      if (ok) d.go(hrefOf(id, w.docOf(id), pid), { from: location.pathname + location.search });
    },
  };

  function submit(kind, form, f, id) {
    const doc = w.docOf(id);
    const p = form.dataset.p ? findPage(doc, form.dataset.p) : null;
    const text = (name, max) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    // A few lines: each tidied, blank ones gone.
    const lines = (name, max) => String(f.get(name) ?? "").split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n").slice(0, max);
    w.ui().editing = "";
    if (kind === "w-pnew") {
      const k = form.dataset.kind === "place" ? "place" : "person";
      const name = text("name", PMAX.name);
      if (!name) return d.toast("Give it a name first.", false);
      if (doc.pages.length >= PMAX.pages) return d.toast(`That’s ${PMAX.pages} pages, which is as many as a world holds.`, false);
      const secret = text("secret", PMAX.more);
      const tag = secret.match(/^(.+?[.?])\s+(.*)$/);
      const pid = newId();
      const ok = w.edit(id, [{ o: "page", p: {
        id: pid, kind: k, name, about: text("about", PMAX.line), text: lines("text", PMAX.text), want: k === "person" ? text("want", PMAX.words) : "", comp: k === "place" ? text("comp", PMAX.line) : "",
        secret: bare(tag ? tag[1] : secret).slice(0, PMAX.line), more: tag ? tag[2] : "", shown: {},
      } }], `${bare(name)}’s in the world. Nothing’s shown to the crew yet.`);
      if (ok) d.go(hrefOf(id, w.docOf(id), pid), { from: location.pathname + location.search });
      return;
    }
    if (!p) return d.render();
    const set = (k, v) => (v !== p[k] ? [{ o: "pset", id: p.id, f: k, v }] : []);
    if (kind === "w-pwords") {
      const name = text("name", PMAX.name);
      if (!name) return d.toast("It needs a name.", false);
      const aka = String(f.get("aka") ?? "").split(",").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
      const ops = [...set("name", name), ...set("about", text("about", PMAX.line)), ...set("text", lines("text", PMAX.text)), ...(p.kind === "person" ? set("want", text("want", PMAX.words)) : [])];
      if (aka.join("|") !== p.aka.join("|")) ops.push({ o: "pset", id: p.id, f: "aka", v: aka });
      if (!ops.length || !w.edit(id, ops, `${bare(name)}’s page is changed.`)) d.render();
      return;
    }
    if (kind === "w-psecret") {
      const ops = [...set("secret", bare(text("secret", PMAX.line))), ...set("more", lines("more", PMAX.more))];
      if (!ops.length || !w.edit(id, ops, `${bare(p.name)}’s Secret is changed.`)) d.render();
      return;
    }
    if (kind === "w-phers") {
      const ops = [...set("note", lines("note", PMAX.note))];
      if (p.kind === "place") ops.push(...set("comp", text("comp", PMAX.line)), ...set("c", Number(f.get("c")) || 0));
      if (!ops.length || !w.edit(id, ops, "Saved. Only you see it.")) d.render();
      return;
    }
    if (kind === "w-phook") {
      const v = text("text", PMAX.words);
      if (!v) return d.toast("Write it in first, or roll one.", false);
      if (w.edit(id, [{ o: "padd", id: p.id, l: "hooks", item: { id: newId(), text: v } }], `A hook on ${bare(p.name)}. Only you see it.`)) form.reset();
      return;
    }
    if (kind === "w-plink") {
      const to = String(f.get("to") ?? "");
      const y = findPage(doc, to) ?? doc.factions.find((x) => x.id === to);
      if (!y) return d.render();
      if (!w.edit(id, [{ o: "link", a: p.id, b: to }], `${bare(p.name)} and ${bare(y.name)} are linked.${p.shown.page && (y.kind ? y.shown.page : y.shown.card) ? " The crew can see it." : ""}`)) d.render();
      return;
    }
    if (kind === "w-pthreatbook") {
      const t = WB?.threats[Number(f.get("t"))];
      if (!t) return d.render();
      const ops = [{ o: "threat", id: p.id, t: { ...t.threat, tags: t.threat.tags.map((g) => ({ ...g, id: newId() })), tele: t.threat.tele.map((x) => ({ id: newId(), text: x })) } }];
      if (!p.secret && t.secret) ops.push({ o: "pset", id: p.id, f: "secret", v: t.secret }, { o: "pset", id: p.id, f: "more", v: t.more });
      if (!p.text && (t.about || t.text)) ops.push({ o: "pset", id: p.id, f: "text", v: [t.about, t.text].filter(Boolean).join(" ") });
      w.edit(id, ops, `${bare(p.name)} fights like ${bare(t.name).replace(/^The /, "the ")}: Challenge ${t.threat.c}, d${t.threat.c * 2}. Change whatever doesn’t fit.`);
      return;
    }
    if (kind === "w-pthreat") {
      const rows = Number(form.dataset.rows) || 0;
      const was = p.threat?.tags ?? [];
      const tags = [];
      for (let i = 0; i < rows && tags.length < PMAX.tags; i++) {
        const t = text(`tag-${i}`, PMAX.tag);
        if (!t) continue;
        tags.push({ id: was[i]?.id || newId(), text: t, x: Math.min(9, Math.max(1, Number(f.get(`x-${i}`)) || 1)), part: String(f.get(`part-${i}`) ?? ""), note: text(`note-${i}`, 40) });
      }
      const oldTele = p.threat?.tele ?? [];
      const tele = lines("tele", PMAX.tele1 * PMAX.tele).split("\n").filter(Boolean).slice(0, PMAX.tele).map((x, i) => ({ id: oldTele[i]?.text === x ? oldTele[i].id : newId(), text: x.slice(0, PMAX.tele1) }));
      const t = { c: Math.min(6, Math.max(1, Number(f.get("c")) || 3)), tags, tele, voice: text("voice", PMAX.words), forms: lines("forms", PMAX.forms) };
      if (!w.edit(id, [{ o: "threat", id: p.id, t }], `${bare(p.name)}’s threat is saved.`)) d.render();
    }
  }

  return {
    book,
    loaded: () => Boolean(WB),
    sections,
    jumps,
    pageView,
    factionLine,
    faceLine,
    factionPart,
    newsOf,
    glance,
    quiet,
    ACT,
    submit,
    title: (doc, pid) => findPage(doc, pid)?.name ?? "A page",
  };
}
