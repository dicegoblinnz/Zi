// Places and people on the World screen and the World tab (stage 3 of
// notes/worlds-plan.md), drawn under the faction board.
//
// Every place and person is a page. The GM writes her own, or brings one in
// from the book: a place from Twenty Places comes with its people as pages of
// their own, and a threat from the Bestiary comes as a person written as a
// threat. Any page's name written on another page links to it by itself
// (linker() in pages.js), and so does any faction's. Everything starts hidden:
// she shows the crew a page in a tap, then each part of it in its own tap,
// and a Secret takes a second one. Telegraphs, hooks, a person's voice, the
// Elsewhere note and her own note are hers alone and never leave the Worker.
//
// What the book has to bring in is public/world-book.json, built off the
// chapters, fetched the first time the World screen needs it and kept by the
// service worker, so it's there with no signal once it's been seen. A page
// she brought in remembers the book's version, so when the book changes it
// she gets a note and picks, the same as a faction.
//
// world.js owns the screen, the changes and keeping it in step. This module
// draws the pages and handles their taps and forms, through the helpers
// world.js hands it.
import { findMap } from "./maps-rules.js";
import { PLISTS, PMAX, findPage, linker, mentionsOf, pageCardOf } from "./pages.js";
import { typo } from "./marks.js";
import { die as kitDie, mini as kitMini, tag as kitTag } from "../kit/kit.js";

const DICE = [2, 4, 6, 8, 10, 12];
const SORT = (t) => String(t ?? "").replace(/^(The|A|An) /i, "").toLowerCase();
const flat = (t) => String(t ?? "").replace(/\*/g, "");
// The parts the crew's shown a tap at a time, and how each one's said.
const PART = { place: ["here", "ground", "stakes", "clock", "twist", "secret"], person: ["want", "threat", "secret"] };
const own = (name) => `${name}${/s$/.test(name) ? "’" : "’s"}`;
const partSay = (name, k) => ({ here: `who’s at ${name}`, ground: `${own(name)} ground`, stakes: `${own(name)} stakes`, clock: `${own(name)} scene clock`, twist: `${own(name)} complication`, secret: `${own(name)} Secret`, want: `what ${name} wants`, threat: `${own(name)} Challenge and tags` })[k];
const MANY = new Set(["stakes", "threat"]);
const TAG_HEADS = [["comes", "Comes at you"], ["keeps", "Keeps it going"], ["drives", "Drives it"], ["weak", "Weak to"], ["power", "Powers"], ["", "Tags"]];
const TAG_KIND_NAMES = { comes: "How it comes at you", keeps: "What keeps it going", drives: "What drives it", weak: "A weakness", power: "A power", "": "Just a tag" };
// A mark for a place or a person with no Challenge to show.
const MARK = {
  place: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11"/><path d="M9.5 20v-6h5v6"/><path d="M2.5 20h19"/></svg>',
  person: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c.8-4.2 3.8-6.5 7.5-6.5s6.7 2.3 7.5 6.5"/></svg>',
};

export function makePlaces(w) {
  const { d, esc, edit, docOf, isGm, camp, gmName, status, online, newId, bare, plural, keyOf } = w;
  let BOOK = null;
  let loading = null;
  let find = "";

  // ------------------------------------------------------------ the book's places and people

  function book() {
    if (BOOK) return BOOK;
    loading ??= fetch("/world-book.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && Array.isArray(j.places)) {
          BOOK = j;
          w.bookLoaded();
        } else loading = null;
      })
      .catch(() => {
        loading = null;
      });
    return null;
  }
  // The book's version of a page she brought in, as it is now.
  function bookCard(p) {
    const B = BOOK;
    if (!B || !p.book) return null;
    if (p.book.from === "bestiary") return B.threats.find((t) => t.key === p.book.key) ?? null;
    if (p.book.from !== "places") return null;
    const [place, person] = p.book.key.split("/");
    const c = B.places.find((x) => x.key === place);
    return person ? c?.people.find((x) => x.key === person) ?? null : c ?? null;
  }
  const strip = (c) => {
    const { h, at, link, people, group, ...was } = c;
    return was;
  };
  const ids = (list) => (list ?? []).map((x) => (typeof x === "string" ? { id: newId(), text: x } : { id: newId(), ...x }));
  // A card out of the book, as a page with ids of its own and nothing shown.
  function fromBook(c, from, key) {
    const was = strip(c);
    return {
      ...was, id: newId(), aka: [], note: "",
      here: ids(c.here), ground: ids(c.ground), stakes: ids(c.stakes), tags: ids(c.tags), teles: ids(c.teles), hooks: ids(c.hooks),
      shown: {}, book: { from, key, h: c.h, at: c.at, was },
    };
  }

  // What the book's changed on a page she brought in, since she brought it in
  // (or last looked), the same way a faction's note works: each change in
  // words, and the changes to her page that take it. A typo fix is quiet.
  const WORD_NAMES = [["name", "Its name"], ["line", "What it is"], ["ch", "Challenge"], ["look", "What it’s like"], ["clockD", "The scene clock’s die"], ["clock", "The scene clock"], ["rules", "What else it does"], ["elsewhere", "Elsewhere"], ["voice", "Voice"], ["secret", "Its Secret"], ["more", "The rest of its Secret"], ["weak", "The weak point"]];
  const LIST_NAMES = { here: "Who’s here", ground: "The ground", stakes: "Stakes", tags: "Tags", teles: "Telegraphs", hooks: "Hooks" };
  const said = (v, k) => (typeof v === "boolean" ? (v ? "yes" : "no") : typeof v === "number" ? (v ? (k === "clockD" ? `d${v}` : String(v)) : "none") : v ? `<em>${esc(bare(flat(v)))}</em>` : "nothing");
  function pageNews(p) {
    const now0 = bookCard(p);
    if (!now0 || !p.book || now0.h === p.book.h || (now0.at ?? 0) < (p.book.at ?? 0)) return null;
    const now = pageCardOf(strip(now0));
    const was = p.book.was;
    const real = [];
    const realOps = [];
    const quietOps = [];
    for (const [k, label] of WORD_NAMES) {
      const a = was[k];
      const b = now[k];
      if (a === b) continue;
      if (typeof a === "string" && typeof b === "string" && typo(a, b)) {
        if (p[k] === a) quietOps.push({ o: "p-set", id: p.id, f: k, v: b });
        continue;
      }
      real.push(`${label}: ${said(b, k)}${a !== "" && a !== 0 && a !== false ? ` <small>(was ${said(a, k)})</small>` : ""}`);
      if (p[k] !== b && (k !== "name" || b)) realOps.push({ o: "p-set", id: p.id, f: k, v: b });
    }
    const textOfItem = (x) => (typeof x === "string" ? x : x.text);
    for (const l of Object.keys(LIST_NAMES)) {
      if (!PLISTS[p.kind].includes(l)) continue;
      const a = was[l] ?? [];
      const b = now[l] ?? [];
      const mine = p[l];
      const gone = a.filter((x) => !b.some((y) => keyOf(textOfItem(y)) === keyOf(textOfItem(x))));
      const added = b.filter((y) => !a.some((x) => keyOf(textOfItem(x)) === keyOf(textOfItem(y))));
      const out = [];
      for (const x of [...gone]) {
        const y = added.find((z) => typo(textOfItem(x), textOfItem(z)));
        if (!y) continue;
        gone.splice(gone.indexOf(x), 1);
        added.splice(added.indexOf(y), 1);
        const hers = mine.find((m) => m.text === textOfItem(x));
        if (hers) quietOps.push({ o: "p-edit", id: p.id, l, lid: hers.id, f: "text", v: textOfItem(y) });
      }
      for (const x of gone) {
        out.push(`<s>${esc(flat(textOfItem(x)))}</s> gone`);
        const hers = mine.find((m) => keyOf(m.text) === keyOf(textOfItem(x)));
        if (hers) realOps.push({ o: "p-drop", id: p.id, l, lid: hers.id });
      }
      for (const y of added) {
        out.push(`<em>${esc(flat(textOfItem(y)))}</em> new`);
        if (!mine.some((m) => keyOf(m.text) === keyOf(textOfItem(y)))) realOps.push({ o: "p-add", id: p.id, l, item: typeof y === "string" ? { id: newId(), text: y } : { id: newId(), ...y } });
      }
      // The same line, changed: a tag's multiplier or kind, a telegraph's die or aim.
      for (const y of b) {
        if (typeof y === "string") continue;
        const x = a.find((z) => keyOf(z.text) === keyOf(y.text));
        const hers = mine.find((m) => keyOf(m.text) === keyOf(y.text));
        if (!x) continue;
        for (const f of ["x", "kind", "d", "at"]) {
          if (!(f in y) || x[f] === y[f]) continue;
          out.push(`<em>${esc(flat(y.text))}</em>: ${f === "x" ? `×${y.x}` : f === "d" ? `d${y.d}` : esc(y[f] || "nothing")}`);
          if (hers && hers[f] !== y[f]) realOps.push({ o: "p-edit", id: p.id, l, lid: hers.id, f, v: y[f] });
        }
      }
      if (out.length) real.push(`${LIST_NAMES[l]}: ${out.join(", ")}`);
    }
    return { real, realOps, quietOps, book: { o: "p-book", id: p.id, card: now, h: now0.h, at: now0.at } };
  }
  // Typo fixes, and changes that don't touch her page, go in without a word.
  function quiet(doc) {
    const ops = [];
    for (const p of doc.pages) {
      const news = pageNews(p);
      if (news && !news.real.length) ops.push(...news.quietOps, news.book);
    }
    return ops;
  }

  // What's new for a player: a page they've just been shown, or a part of one.
  function news(id, was, now) {
    const said = [];
    const keys = [];
    const before = new Map((was.pages ?? []).map((p) => [p.id, p]));
    for (const p of now.pages ?? []) {
      const b = before.get(p.id);
      if (!b) {
        said.push(`${gmName(id)} showed you ${bare(p.name)}.`);
        keys.push(p.id);
        continue;
      }
      const parts = PART[p.kind].filter((k) => p.shown[k] && !b.shown[k]);
      if (parts.length) {
        said.push(parts.length === 1 ? `You’ve found out ${partSay(bare(p.name), parts[0])}.` : `You’ve found out more about ${bare(p.name)}.`);
        keys.push(p.id);
      }
    }
    return { said, keys };
  }

  // ------------------------------------------------------------ drawing

  const href = (id, e) => `/characters/?camp=${encodeURIComponent(id)}&world&${e.kind === "f" ? "f" : "p"}=${encodeURIComponent(e.id)}`;
  const linksIn = (id, doc) => linker(doc, (e) => href(id, e));
  const ui = () => w.ui();
  const sure = (key, yes, no) => (ui().sure === key ? yes : no);
  const ek = (p, k) => `${p.id}:${k}`;
  const dieOf = (ch) => (ch > 0 ? Math.min(12, ch * 2) : 0);
  const chLabel = (ch) => `Challenge ${ch}, a d${dieOf(ch)}`;
  const chOptions = (ch) => `<option value="0"${!ch ? " selected" : ""}>None</option>${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === ch ? " selected" : ""}>${n}, a d${n * 2}</option>`).join("")}`;
  const field = (name, label, value = "", max = PMAX.words, extra = "") => `<label class="cc-field">${label} <input name="${name}" maxlength="${max}" autocomplete="off" value="${esc(value)}"${extra}></label>`;
  const area = (name, label, value = "", max = PMAX.look, rows = 4) => `<label class="cc-field">${label} <textarea name="${name}" maxlength="${max}" rows="${rows}">${esc(value)}</textarea></label>`;
  const saveRow = (more = "") => `<div class="cc-row"><button type="submit" class="button primary">Save</button><button type="button" class="button" data-act="w" data-do="cancel">Cancel</button>${more}</div>`;
  const reword = (key, label) => `<button type="button" class="pt-reword" data-act="w" data-do="edit" data-k="${esc(key)}">${label}</button>`;
  const opts = (rows) => rows.map((r) => `<option value="${esc(r)}"></option>`).join("");
  const pageDie = (p) => (p.ch > 0 ? kitDie(dieOf(p.ch), { own: "them", hide: true }) : `<span class="wp-mark" aria-hidden="true">${MARK[p.kind]}</span>`);
  const badge = (p, k) => `<span class="wb-badge${p.shown.page && p.shown[k] ? " is-on" : ""}">${p.shown.page && p.shown[k] ? "Shown" : "Hidden"}</span>`;
  const hers = '<span class="wb-badge wp-hers">Only you</span>';
  const fold = (key, title, glance, body, badgeHtml = "") => w.part(key, title, glance, body, badgeHtml);

  // A page in a list: a glance and a tap to it.
  function token(id, p, gm) {
    const shown = gm ? `<span class="wb-k"><span class="wb-badge${p.shown.page ? " is-on" : ""}">${p.shown.page ? "Shown" : "Hidden"}</span></span>` : "";
    const glow = w.lit(id).includes(p.id) ? " is-new" : "";
    const label = p.ch > 0 ? chLabel(p.ch) : p.kind === "place" ? "A place" : "A person";
    return `<li class="wp-tok${glow}" data-find="${esc(`${p.name} ${p.aka.join(" ")} ${flat(p.line)}`.toLowerCase())}"><a class="card wb-tok-a wp-tok-a" href="${esc(href(id, { kind: "p", id: p.id }))}" data-act="w" data-do="nav">
      <span class="wp-tok-die" role="img" aria-label="${label}">${pageDie(p)}</span>
      <span class="wp-tok-in">${shown}<b class="wp-tok-n">${esc(p.name)}</b>${p.line ? `<span class="wp-tok-w">${esc(flat(p.line))}</span>` : ""}</span></a></li>`;
  }

  // Places and people, under the board on the World screen and the World tab.
  function sections(id) {
    const gm = isGm(id);
    const doc = docOf(id);
    if (gm) book();
    const out = [];
    const many = doc.pages.length > 8;
    if (many) out.push(`<div class="wp-find" data-wb="${esc(id)}"><label class="cc-field">Find a place or person <input type="search" data-wfind enterkeyhint="search" autocomplete="off" value="${esc(find)}"></label></div>`);
    for (const kind of ["place", "person"]) {
      const pages = doc.pages.filter((p) => p.kind === kind).sort((a, b) => SORT(a.name).localeCompare(SORT(b.name)));
      if (!gm && !pages.length) continue;
      const title = kind === "place" ? "Places" : "People";
      const shownN = pages.filter((p) => p.shown.page).length;
      const list = pages.length ? `<ul class="wp-toks">${pages.map((p) => token(id, p, gm)).join("")}</ul>` : "";
      const lead = !gm ? ""
        : pages.length ? `<p class="cc-small wb-sum">${plural(pages.length, kind === "place" ? "place" : "person", kind === "place" ? "places" : "people")}, ${shownN ? `${shownN} shown to the crew` : "none shown to the crew yet"}.</p>`
        : `<p class="cc-small">${kind === "place" ? "No places yet. Bring one in from Twenty Places, or write your own." : "Nobody yet. Bring in a place and its people come with it, or bring in a threat from the Bestiary, or write someone of your own."} Nothing shows on your players’ phones till you show it to them.</p>`;
      const adds = gm ? `<div class="cc-folds wb-adds">${kind === "place" ? bringPlaces(id, doc) + newPlace() : bringThreats(id, doc) + newPerson()}</div>` : "";
      out.push(`<section class="cc-sec wp-sec" data-wb="${esc(id)}" aria-labelledby="wp-h-${kind}"><h2 id="wp-h-${kind}">${title}</h2>${lead}${list}${adds}</section>`);
    }
    if (find && many) requestAnimationFrame(() => filter(find));
    return out.join("");
  }

  function waitingBook() {
    return `<p class="cc-small">${online() ? "Opening the book…" : "No signal, and this phone hasn’t got the book’s places and people yet."}</p>`;
  }

  function bringPlaces(id, doc) {
    const B = BOOK;
    const have = new Set(doc.pages.filter((p) => p.book?.from === "places" && !p.book.key.includes("/")).map((p) => p.book.key));
    const cards = B ? B.places.map((c) => {
      const on = have.has(c.key);
      return `<li class="wb-bring wp-bring card"><div class="wp-bring-top"><span class="wp-bring-die" role="img" aria-label="${chLabel(c.ch)}">${kitDie(dieOf(c.ch), { own: "them", hide: true })}</span><div><h4>${esc(c.name)}</h4><p>${esc(flat(c.line))}.</p></div></div>
        ${c.people.length ? `<p class="cc-small">${c.people.map((x) => esc(x.name)).join(" · ")}</p>` : ""}
        <div class="cc-row">${on ? '<span class="chip sm pt-chip is-on">In your world</span>' : `<button type="button" class="button" data-act="w" data-do="pbring" data-k="${esc(c.key)}">Bring it in</button>`}
        <a class="pt-reword" href="${esc(c.link)}">Read it in the book</a></div></li>`;
    }).join("") : "";
    return w.fold("pbring", "Bring in a place from Twenty Places", B ? `${B.places.length} ready to run` : "From the book", `<p class="cc-lead">Each one comes in whole, with its people as pages of their own, and it’s yours to change from then on. If the book changes it later, you’ll get a note and you pick which to keep. They’re in the book for anyone to read, so change whatever you’d rather keep a surprise.</p>${B ? `<ul class="wb-brings">${cards}</ul>` : waitingBook()}`);
  }

  function bringThreats(id, doc) {
    const B = BOOK;
    const have = new Set(doc.pages.filter((p) => p.book?.from === "bestiary").map((p) => p.book.key));
    const groups = B ? [...new Set(B.threats.map((t) => t.group))] : [];
    const list = B ? groups.map((g) => `<h3 class="wp-group">${esc(g)}</h3><ul class="pt-lines">${B.threats.filter((t) => t.group === g).map((t) => `<li class="pt-line wp-pick"><span class="wp-pick-die" aria-hidden="true">${kitMini(dieOf(t.ch), { own: "them" })}</span><div class="pt-line-in"><p><b>${esc(t.name)}</b> <small>${chLabel(t.ch)}</small></p><p class="pt-does">${esc(flat(t.line))}</p></div>${have.has(t.key) ? '<span class="chip sm pt-chip is-on">In your world</span>' : `<button type="button" class="button sm" data-act="w" data-do="pthreat" data-k="${esc(t.key)}" aria-label="Bring in ${esc(t.name)}">Bring in</button>`}</li>`).join("")}</ul>`).join("") : waitingBook();
    return w.fold("pthreats", "Bring in a threat from the Bestiary", B ? `${B.threats.length} built and ready` : "From the book", `<p class="cc-lead">Each one comes in as a person written as a threat, with its tags, telegraphs, voice and hidden tag, ready to rename and make your own.</p>${list}${B ? `<p class="cc-small"><a class="pt-reword" href="${esc(B.links.bestiary)}">Read the Bestiary</a></p>` : ""}`);
  }

  function newPlace() {
    const B = BOOK;
    return w.fold("pnew-place", "A place of your own", "Written by you, with the book’s table to roll on", `<form class="cc-form pt-form wp-new" data-form="w-pg-new" data-kind="place">
      <label class="cc-field">Its name <input name="name" maxlength="${PMAX.name}" autocomplete="off" required></label>
      ${field("line", "What it is", "", PMAX.line, ' placeholder="like A bathhouse where the city’s deals get made"')}
      <label class="cc-field">Its Challenge, to Study it and the die it telegraphs with <select name="ch">${chOptions(3)}</select></label>
      ${area("look", "What it’s like inside", "", PMAX.look, 3)}
      <label class="cc-field">Its complication <input name="twist" maxlength="${PMAX.words}" autocomplete="off" list="wp-twists"></label>${B ? `<datalist id="wp-twists">${opts(B.tables.complication)}</datalist>` : ""}
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="proll" data-r="place"${B ? "" : " disabled"}>Roll the complication</button><button type="submit" class="button primary">Put it in your world</button></div></form>`);
  }

  function newPerson() {
    const B = BOOK;
    const what = B ? B.tables.what.map((x, i) => `<option value="${i}">${esc(x.name)}${x.ch ? `, Challenge ${x.ch}` : ""}</option>`).join("") : "";
    return w.fold("pnew-person", "Someone of your own", "With the book’s tables, and as a threat if they need one", `<form class="cc-form pt-form wp-new" data-form="w-pg-new" data-kind="person">
      <label class="cc-field">Their name <input name="name" maxlength="${PMAX.name}" autocomplete="off" required></label>
      ${field("line", "Who they are", "", PMAX.line, ' placeholder="like the moneylender"')}
      ${area("look", "What you notice first", "", PMAX.look, 2)}
      <label class="cc-field">What they want <input name="want" maxlength="${PMAX.words}" autocomplete="off" list="wp-wants"></label>${B ? `<datalist id="wp-wants">${opts(B.tables.want)}</datalist>` : ""}
      <label class="cc-field">What they’re hiding, their Secret <input name="secret" maxlength="${PMAX.secret}" autocomplete="off" list="wp-hiding"></label>${B ? `<datalist id="wp-hiding">${opts(B.tables.hiding)}</datalist>` : ""}
      <label class="cc-field">As a threat, what they are <select name="what"><option value="">Not a threat yet</option>${what}</select></label>
      <div class="cc-row"><button type="button" class="button" data-act="w" data-do="proll" data-r="person"${B ? "" : " disabled"}>Roll on the tables</button><button type="submit" class="button primary">Put them in your world</button></div>
      <p class="cc-small">${B ? `<a class="pt-reword" href="${esc(B.links.threat)}">Building a threat</a> has the rest: size, what keeps it going, what drives it and its hidden tag.` : ""}</p></form>`);
  }

  // ------------------------------------------------------------ one page

  // Back to wherever she came from on the World screen, or the World tab.
  function backOf(id, home = "The world") {
    const from = String(history.state?.from ?? "");
    if (/^\/characters\/\?c=[^&]+&t=world$/.test(from)) return [from, "The world"];
    // A page, a faction's page, or a map (with a pin open on it, maybe).
    const m = from.match(/^\/characters\/\?camp=([^&]+)&world&(p|f|m)=([^&]+)(?:&(?:pin|put)=[^&]*)?$/);
    if (m && decodeURIComponent(m[1]) === id) {
      const doc = docOf(id);
      const key = decodeURIComponent(m[3]);
      const name = m[2] === "p" ? findPage(doc, key)?.name : m[2] === "f" ? doc.factions.find((f) => f.id === key)?.name : findMap(doc, key)?.name;
      if (name) return [from, name];
    }
    return [`/characters/?camp=${encodeURIComponent(id)}&world`, home];
  }

  // Show it to the crew, or hide it again: the top of each part, hers.
  function shower(p, k) {
    if (!p.shown.page) return `<p class="cc-small wb-show">Show the crew ${esc(p.name)} first, then this.</p>`;
    const on = p.shown[k];
    const label = on ? "Hide it from the crew" : k === "secret" ? sure(`psecret-${p.id}`, "Tap again to show the Secret", "Show the crew the Secret") : "Show the crew";
    return `<div class="wb-show${on ? " is-on" : ""}"><p class="cc-small">${on ? "The crew’s been shown this." : "Only you see this."}</p><button type="button" class="button sm${on ? "" : k === "secret" ? " danger" : " primary"}" data-act="w" data-do="pshow" data-id="${esc(p.id)}" data-p="${k}" aria-pressed="${on}">${label}</button></div>`;
  }

  // A line on one of a page's lists, with Change for hers.
  function lineView(id, p, l, x, gm, L) {
    const key = ek(p, `${l}:${x.id}`);
    if (gm && ui().editing === key) return `<li class="pt-line wb-editing">${lineForm(p, l, x)}</li>`;
    let body = `<p class="wp-text">${L.rich(x.text, p.id)}</p>`;
    let more = "";
    if (l === "teles") {
      body = `<div class="wp-tele">${kitMini(x.d, { own: "them" })}<div class="pt-line-in"><p class="wp-text"><em>${L.rich(x.text, p.id)}</em></p><p class="pt-does">d${x.d}, ${esc(x.at)}</p></div></div>`;
      // Any of them, since the live table takes one at a stake, the scene
      // clock or a part of the place too.
      if (gm && d.tele) more = `<button type="button" class="button sm" data-act="w" data-do="ptele" data-id="${esc(p.id)}" data-lid="${esc(x.id)}">Telegraph it</button>`;
    }
    if (!gm) return `<li class="pt-line"><div class="pt-line-in">${body}</div></li>`;
    return `<li class="pt-line"><div class="pt-line-in">${body}</div><div class="cc-row wb-line-row">${more}<button type="button" class="button sm" data-act="w" data-do="edit" data-k="${esc(key)}" aria-label="Change ${esc(flat(x.text).slice(0, 40))}">Change</button></div></li>`;
  }
  const dieSelect = (name, v, none = false) => `<select name="${name}">${none ? `<option value="0"${!v ? " selected" : ""}>None</option>` : ""}${DICE.map((x) => `<option value="${x}"${x === v ? " selected" : ""}>d${x}</option>`).join("")}</select>`;
  const kindSelect = (v = "") => `<label class="cc-field">What kind of tag <select name="kind">${Object.entries(TAG_KIND_NAMES).map(([k, n]) => `<option value="${k}"${k === v ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
  const timesSelect = (v = 1) => `<label class="cc-field">Its multiplier, the wins it takes <select name="x">${Array.from({ length: PMAX.x }, (_, i) => i + 1).map((n) => `<option value="${n}"${n === v ? " selected" : ""}>×${n}</option>`).join("")}</select></label>`;
  function lineForm(p, l, x) {
    const del = `<button type="button" class="button danger" data-act="w" data-do="pdrop" data-id="${esc(p.id)}" data-l="${l}" data-lid="${esc(x.id)}">${sure(`pdrop-${x.id}`, "Tap again to take it off", "Take it off")}</button>`;
    const extra = l === "tags" ? `${kindSelect(x.kind)}${timesSelect(x.x)}` : l === "teles" ? `<label class="cc-field">Its die ${dieSelect("d", x.d)}</label>${field("at", "What it’s aimed at", x.at, PMAX.name, ' placeholder="like Defend, or a stake"')}` : "";
    return `<form class="cc-form pt-form" data-form="w-pg-line" data-id="${esc(p.id)}" data-l="${l}" data-lid="${esc(x.id)}">
      <label class="cc-field">Its words <input name="text" maxlength="${l === "tags" ? PMAX.name : PMAX.item}" autocomplete="off" required value="${esc(x.text)}"></label>${extra}${saveRow(del)}</form>`;
  }
  function addForm(p, l, label, { list = "", roll = "" } = {}) {
    const extra = l === "tags" ? `${kindSelect()}${timesSelect()}` : l === "teles" ? `<label class="cc-field">Its die ${dieSelect("d", p.ch > 0 ? dieOf(p.ch) : 6)}</label>${field("at", "What it’s aimed at", "", PMAX.name, ' placeholder="like Defend, or a stake"')}` : "";
    return `<form class="cc-form pt-form pt-add" data-form="w-pg-add" data-id="${esc(p.id)}" data-l="${l}">
      <label class="cc-field">${label} <input name="text" maxlength="${l === "tags" ? PMAX.name : PMAX.item}" autocomplete="off"${list ? ` list="${list}"` : ""}></label>${extra}
      <div class="cc-row"><button type="submit" class="button">Add it</button>${roll}</div></form>`;
  }
  const lines = (id, p, l, gm, L) => (p[l].length ? `<ul class="pt-lines">${p[l].map((x) => lineView(id, p, l, x, gm, L)).join("")}</ul>` : "");
  const few = (items, n) => (items.length > n ? `${items.slice(0, n).join(" · ")} <small>and ${items.length - n} more</small>` : items.join(" · "));
  const namesIn = (list) => list.map((x) => esc(flat(x.text.match(/^\*([^*]+)\*/)?.[1] ?? x.text.split(/[,(:]/)[0]).trim()));

  // One word part: what she wrote, with Change (hers), or the form.
  function wordPart(p, f, label, gm, L, { max = PMAX.words, longer = false, place = "" } = {}) {
    const key = ek(p, f);
    if (gm && ui().editing === key) return `<form class="cc-form pt-form wb-editing" data-form="w-pg-set" data-id="${esc(p.id)}" data-f="${f}">${longer ? area("v", label, p[f], max, 4) : field("v", label, p[f], max, place ? ` placeholder="${esc(place)}"` : "")}${saveRow()}</form>`;
    const body = p[f] ? (longer ? `<div class="wp-words">${L.block(p[f], p.id)}</div>` : `<p class="wp-words">${L.rich(p[f], p.id)}</p>`) : '<p class="cc-small">Nothing yet.</p>';
    return `${body}${gm ? reword(key, p[f] ? "Change it" : "Write it") : ""}`;
  }

  // A person as a threat: their Challenge, their tags in the Threat Builder's
  // groups, and what each tag does from Appendix B.
  function threatBody(id, p, gm, L) {
    const key = ek(p, "ch");
    const chForm = gm && ui().editing === key ? `<form class="cc-form pt-form wb-editing" data-form="w-pg-ch" data-id="${esc(p.id)}"><label class="cc-field">Their Challenge <select name="ch">${chOptions(p.ch)}</select></label>${saveRow()}</form>` : "";
    const head = chForm || `<div class="wp-ch">${p.ch > 0 ? `<p><b>${chLabel(p.ch)}</b>. They telegraph with their Challenge die.</p>` : '<p class="cc-small">No Challenge yet.</p>'}${gm ? reword(key, p.ch ? "Change it" : "Give them one") : ""}</div>`;
    const groups = TAG_HEADS.map(([k, label]) => {
      const tags = p.tags.filter((t) => t.kind === k);
      if (!tags.length) return "";
      const editing = gm ? tags.find((t) => ui().editing === ek(p, `tags:${t.id}`)) : null;
      const chips = tags.map((t) => {
        const name = `${t.text}${t.x > 1 ? ` ×${t.x}` : ""}`;
        return gm ? `<button type="button" class="wp-tagbtn" data-act="w" data-do="edit" data-k="${esc(ek(p, `tags:${t.id}`))}" aria-pressed="${t === editing}" aria-label="Change ${esc(name)}">${kitTag(name)}</button>` : kitTag(name);
      }).join("");
      return `<div class="wp-tags"><h3>${label}</h3><div class="wp-tag-row">${chips}</div>${editing ? `<div class="wb-editing">${lineForm(p, "tags", editing)}</div>` : ""}</div>`;
    }).join("");
    const known = BOOK ? p.tags.map((t) => BOOK.tags.find((x) => keyOf(x.name) === keyOf(t.text))).filter(Boolean) : [];
    const what = known.length ? `<details class="cc-group wp-what" data-open="wp-what-${esc(p.id)}"${d.isOpen(`wp-what-${p.id}`) ? " open" : ""}><summary>What these tags do <small>Appendix B</small></summary><dl>${[...new Set(known)].map((t) => `<div><dt>${esc(t.name)}</dt><dd>${esc(t.does)}</dd></div>`).join("")}</dl></details>` : "";
    const rules = p.rules || gm ? `<h3 class="wp-sub">What else they do</h3>${wordPart(p, "rules", "What else they do, like Forms", gm, L, { max: PMAX.rules, longer: true })}` : "";
    const B = BOOK;
    const add = gm ? `${addForm(p, "tags", "A new tag", { list: B ? "wp-tag-names" : "" })}${B ? `<datalist id="wp-tag-names">${opts(B.tags.map((t) => t.name))}</datalist>` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="w" data-do="proll" data-r="threat" data-id="${esc(p.id)}"${B ? "" : " disabled"}>Roll a tag from each table</button></div>` : "";
    return `${head}${groups || (gm ? "" : '<p class="cc-small">No tags.</p>')}${what}${rules}${add}`;
  }

  function secretBody(p, gm, L) {
    const key = ek(p, "secret");
    if (gm && ui().editing === key) {
      return `<form class="cc-form pt-form wb-editing" data-form="w-pg-secret" data-id="${esc(p.id)}">${field("secret", "Its Secret, the hidden tag", p.secret, PMAX.secret)}${area("more", "The rest of it", p.more, PMAX.more, 4)}
        <label class="pt-check"><input type="checkbox" name="weak"${p.weak ? " checked" : ""}> It’s the weak point</label>${saveRow()}</form>`;
    }
    const body = p.secret ? `<div class="wb-secret wp-secret"><p><em>${esc(p.secret)}</em>${p.weak ? " (weak point)" : ""}.</p>${L.block(p.more, p.id)}</div>` : '<p class="cc-small">No Secret written yet.</p>';
    return `${body}${gm ? reword(key, p.secret ? "Change its Secret" : "Write one") : ""}`;
  }

  // Her place as the live table's scene: each piece of ground written as a tag
  // with what it does, each stake with its Challenge, what's in the way and
  // what it's for, and the scene clock, the way Twenty Places writes them.
  function sceneFrom(p) {
    const ground = p.ground.map((x) => x.text.match(/^\*([^*]+)\*(?::\s*(.+))?$/)).filter(Boolean).map((m) => ({ name: m[1].trim().slice(0, 60), text: flat(m[2] ?? "").trim().slice(0, 140) })).slice(0, 8);
    const stakes = p.stakes.map((x) => x.text.match(/^\*([^*]+)\*,?\s*Challenge ([1-6])(?::\s*(.+?))?(?:\s*\(([^)]+)\))?$/)).filter(Boolean)
      .map((m) => ({ name: m[1].trim().slice(0, 60), c: Number(m[2]), tags: [...(m[3] ?? "").matchAll(/\*([^*]+)\*/g)].map((t) => t[1].trim()).slice(0, 8), note: (m[4] ?? "").trim().slice(0, 140) })).slice(0, 6);
    const clock = p.clockD ? { d: p.clockD, what: flat(p.clock).replace(/\.$/, "").slice(0, 140) } : null;
    // Which page it is, so the composer has its telegraphs ready while it's
    // on the table (table.js).
    return { name: p.name, ground, stakes, clock, place: { id: p.id, name: p.name, page: true }, teles: p.teles ?? [] };
  }

  function pageView(id, pid) {
    const gm = isGm(id);
    const doc = docOf(id);
    const p = findPage(doc, pid);
    const [back, backLabel] = backOf(id);
    const top = w.topbar(back, backLabel);
    book();
    if (!p) {
      return `${top}<header class="cc-camp-head"><p class="kicker">The world</p><h1>Not in the world</h1></header>
        <div class="cc-note is-warn"><p>${camp(id).at || !online() ? "That page isn’t in the world any more, or the crew hasn’t been shown it." : "Opening the world…"}</p></div>`;
    }
    const L = linksIn(id, doc);
    const place = p.kind === "place";
    const say = status(id);
    const chShown = gm || place || p.shown.threat;

    // Its words: name, other names, what it is or who they are, its
    // Challenge (a place's) and what it's like or what you notice first.
    const wordsKey = ek(p, "words");
    const words = gm && ui().editing === wordsKey
      ? `<form class="cc-form pt-form wb-editing" data-form="w-pg-words" data-id="${esc(p.id)}">
        <label class="cc-field">${place ? "Its name" : "Their name"} <input name="name" maxlength="${PMAX.name}" autocomplete="off" required value="${esc(p.name)}"></label>
        ${field("aka", "Other names, if the crew might call them something else", p.aka.join(", "), PMAX.name * PMAX.aka, ' placeholder="like Orla, with commas between"')}
        ${field("line", place ? "What it is" : "Who they are", p.line, PMAX.line)}
        ${place ? `<label class="cc-field">Its Challenge <select name="ch">${chOptions(p.ch)}</select></label>` : ""}
        ${area("look", place ? "What it’s like inside" : "What you notice first", p.look, PMAX.look, 4)}${saveRow()}</form>`
      : `${p.look ? `<div class="wp-look">${L.block(p.look, p.id)}</div>` : gm ? `<p class="cc-small">${place ? "Nothing yet about what it’s like inside." : "Nothing yet about what you notice first."}</p>` : ""}
        ${p.aka.length ? `<p class="cc-small wp-aka">Also called ${p.aka.map((a) => esc(a)).join(", ")}</p>` : ""}
        ${gm ? reword(wordsKey, place ? "Change its name and what it says" : "Change their name and what it says") : ""}`;
    const card = gm || p.look || p.aka.length || (p.ch > 0 && chShown);
    const head = `<header class="cc-camp-head wb-head"><p class="kicker is-gm">${place ? "Place" : "Person"}</p><h1>${esc(p.name)}</h1>${p.line ? `<p class="wp-line">${L.rich(p.line, p.id)}${place && !/[.?!”]$/.test(p.line) ? "." : ""}</p>` : ""}</header>
      ${card ? `<div class="wb-card card wp-card" data-glow="${w.lit(id).includes(p.id) ? "1" : ""}">
        ${p.ch > 0 && chShown ? `<div class="wb-card-top"><div class="wb-card-die" role="img" aria-label="${chLabel(p.ch)}">${kitDie(dieOf(p.ch), { own: "them", hide: true })}</div><div class="wb-card-p"><p class="wb-k">Challenge</p><p class="wb-card-v">${p.ch}, a d${dieOf(p.ch)}</p></div></div>` : ""}
        ${words}</div>` : ""}`;
    const showCard = gm ? `<div class="wb-show wb-show-card${p.shown.page ? " is-on" : ""}"><p>${p.shown.page ? (place ? "The crew can see it: its name, what it is, its Challenge and what it’s like inside, and whatever else you’ve shown them." : "The crew can see them: who they are and what you notice first, and whatever else you’ve shown them.") : `The crew can’t see ${place ? "it" : "them"} yet. Show ${place ? "it" : "them"} when the crew finds out ${place ? "it’s there" : "who they are"}.`}</p>
      <button type="button" class="button${p.shown.page ? "" : " primary"}" data-act="w" data-do="pshow" data-id="${esc(p.id)}" data-p="page" aria-pressed="${p.shown.page}">${p.shown.page ? `Hide ${place ? "it" : "them"} from the crew` : `Show the crew ${esc(p.name)}`}</button></div>` : "";

    const onTable = gm && place && d.scene ? `<div class="wb-show wp-table"><p>When the crew’s here, its ground, stakes and scene clock go on the live table, face up on every phone.</p><button type="button" class="button" data-act="w" data-do="pscene" data-id="${esc(p.id)}">${sure(`pscene-${p.id}`, "Tap again to put it in place of what’s there", "Put it on the table")}</button></div>` : "";
    const nw = gm ? pageNews(p) : null;
    const bookNote = nw?.real.length ? `<div class="cc-note is-gold wb-book" role="status"><p><b>The book’s changed ${esc(p.name)} since you brought ${place ? "it" : "them"} in.</b></p><ul>${nw.real.map((x) => `<li>${x}</li>`).join("")}</ul>
      <div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="pbook" data-id="${esc(p.id)}" data-take="1">Take the book’s changes</button><button type="button" class="button" data-act="w" data-do="pbook" data-id="${esc(p.id)}" data-take="0">Keep mine</button></div>
      <p class="cc-small">Taking them only changes what the book changed, and leaves what you’ve written alone.</p></div>` : "";

    const parts = [];
    const B = BOOK;
    const show = (k) => (gm ? shower(p, k) : "");
    if (place) {
      if (gm || p.shown.here) parts.push(fold(`here-${p.id}`, "Who’s here", p.here.length ? few(namesIn(p.here), 3) : "Nobody yet", `${show("here")}<p class="cc-lead">Everyone here, with their Challenge and the tags that matter most. They telegraph with their own Challenge dice.</p>${lines(id, p, "here", gm, L)}${gm ? addForm(p, "here", "Someone new here") : ""}`, gm ? badge(p, "here") : ""));
      if (gm || p.shown.ground) parts.push(fold(`ground-${p.id}`, "The ground", p.ground.length ? few(namesIn(p.ground), 3) : "Nothing yet", `${show("ground")}<p class="cc-lead">Tags on the place itself, there for anyone to use.</p>${lines(id, p, "ground", gm, L)}${gm ? addForm(p, "ground", "A new tag on the ground") : ""}`, gm ? badge(p, "ground") : ""));
      if (gm || p.shown.stakes) parts.push(fold(`stakes-${p.id}`, "Stakes", p.stakes.length ? few(namesIn(p.stakes), 2) : "None yet", `${show("stakes")}<p class="cc-lead">What there is to win here, each with its Challenge and what’s in the way.</p>${lines(id, p, "stakes", gm, L)}${gm ? addForm(p, "stakes", "A new stake") : ""}`, gm ? badge(p, "stakes") : ""));
      if (gm || p.shown.clock) {
        const key = ek(p, "clock");
        const body = gm && ui().editing === key
          ? `<form class="cc-form pt-form wb-editing" data-form="w-pg-clock" data-id="${esc(p.id)}"><label class="cc-field">Its die ${dieSelect("clockD", p.clockD, true)}</label>${field("clock", "What happens when it runs out", p.clock, PMAX.words)}${saveRow()}</form>`
          : `${p.clockD || p.clock ? `<div class="wp-clock">${p.clockD ? kitDie(p.clockD, { own: "them", hide: true }) : ""}<p>${p.clockD ? `<b>d${p.clockD}</b> ` : ""}${L.rich(p.clock, p.id)}</p></div>` : '<p class="cc-small">No scene clock yet.</p>'}${gm ? reword(key, p.clockD ? "Change it" : "Give it one") : ""}`;
        parts.push(fold(`clock-${p.id}`, "Scene clock", p.clockD ? `d${p.clockD}${p.clock ? `: ${esc(flat(p.clock).slice(0, 60))}${p.clock.length > 60 ? "…" : ""}` : ""}` : "None", `${show("clock")}<p class="cc-lead">A die on the whole scene, face up from the start. It steps down, and past d2 the scene turns.</p>${body}`, gm ? badge(p, "clock") : ""));
      }
      if ((gm && (p.twist || !p.book)) || p.shown.twist) parts.push(fold(`twist-${p.id}`, "The complication", p.twist ? esc(flat(p.twist)) : "None", `${show("twist")}${wordPart(p, "twist", "Its complication", gm, L, { place: "like It’s watched" })}`, gm ? badge(p, "twist") : ""));
    } else {
      if (gm || p.shown.want) parts.push(fold(`want-${p.id}`, "What they want", p.want ? esc(flat(p.want)) : "Not written yet", `${show("want")}${wordPart(p, "want", "What they want", gm, L, { place: "like To be free of a debt" })}`, gm ? badge(p, "want") : ""));
      if (gm || p.shown.threat) {
        const glance = p.ch || p.tags.length ? `${p.ch ? `Challenge ${p.ch}` : ""}${p.ch && p.tags.length ? " · " : ""}${few(p.tags.map((t) => esc(`${t.text}${t.x > 1 ? ` ×${t.x}` : ""}`)), 3)}` : "Not a threat yet";
        parts.push(fold(`threat-${p.id}`, "As a threat", glance, `${show("threat")}${threatBody(id, p, gm, L)}`, gm ? badge(p, "threat") : ""));
      }
    }
    if (gm || p.shown.secret) parts.push(fold(`secret-${p.id}`, "Secret", p.secret ? `<em>${esc(p.secret)}</em>` : "Not written yet", `${show("secret")}${secretBody(p, gm, L)}`, gm ? badge(p, "secret") : ""));
    if (gm) {
      parts.push(fold(`teles-${p.id}`, "Telegraphs", p.teles.length ? plural(p.teles.length, "ready to go", "ready to go") : "None yet", `<p class="cc-lead">A starting point, so add your own. They come out of your round budget like any others${d.tele ? ", and Telegraph it puts one on the round from here" : ""}.</p>${lines(id, p, "teles", gm, L)}${addForm(p, "teles", "A new telegraph")}`, hers));
      if (!place) parts.push(fold(`voice-${p.id}`, "Voice", p.voice ? esc(flat(p.voice).slice(0, 70)) : "Not written yet", `<p class="cc-lead">A line for you to say as them.</p>${wordPart(p, "voice", "Their voice", gm, L)}`, hers));
      const trouble = B ? `<datalist id="wp-trouble">${opts(B.tables.trouble)}</datalist>` : "";
      parts.push(fold(`hooks-${p.id}`, "Hooks", p.hooks.length ? few(p.hooks.map((x) => esc(flat(x.text))), 1) : "None yet", `<p class="cc-lead">${place ? "Ways to get the crew here." : "Ways to get the crew mixed up with them."}</p>${lines(id, p, "hooks", gm, L)}${addForm(p, "hooks", "A new hook", { list: B ? "wp-trouble" : "", roll: `<button type="button" class="button" data-act="w" data-do="proll" data-r="hook"${B ? "" : " disabled"}>Roll one</button>` })}${trouble}`, hers));
      if (place && (p.elsewhere || p.book)) parts.push(fold(`elsewhere-${p.id}`, "Elsewhere", p.elsewhere ? esc(flat(p.elsewhere).slice(0, 70)) + (p.elsewhere.length > 70 ? "…" : "") : "Nothing", `<p class="cc-lead">How it looks in another kind of game.</p>${wordPart(p, "elsewhere", "Elsewhere", gm, L, { max: PMAX.elsewhere })}`, hers));
      parts.push(fold(`note-${p.id}`, "Your note", p.note ? esc(p.note.slice(0, 80)) + (p.note.length > 80 ? "…" : "") : "Only you see it", `<p class="cc-lead">Anything you want to remember. It never goes to the crew.</p>${wordPart(p, "note", "Your note", gm, L, { max: PMAX.note, longer: true })}`, hers));
    }

    // Where else it comes up: every faction and page that names it.
    const ment = mentionsOf(doc, p);
    const elsewhere = ment.length ? `<section class="cc-sec wp-ment" aria-labelledby="wp-ment-h"><h2 id="wp-ment-h">Where else ${place ? "it comes" : "they come"} up</h2><ul class="wp-ment-list">${ment.map((m) => `<li><a class="pt-reword" href="${esc(href(id, m))}" data-act="w" data-do="nav">${esc(m.name)}</a> <small>${m.kind === "f" ? "Faction" : m.page.kind === "place" ? "Place" : "Person"}</small></li>`).join("")}</ul></section>` : "";

    const from = gm && p.book ? (p.book.from === "bestiary" ? "the Bestiary" : "Twenty Places") : "";
    const fromCard = gm && p.book ? bookCard(p) : null;
    const hiddenParts = !gm && PART[p.kind].some((k) => !p.shown[k]);
    const end = gm ? `<section class="cc-sec" aria-labelledby="wp-off"><h2 id="wp-off" class="sr-only">Taking it off</h2>${from ? `<p class="cc-small">From ${from}.${fromCard?.link ? ` <a class="pt-reword" href="${esc(fromCard.link)}">Read it in the book</a>` : ""}</p>` : ""}
      <div class="cc-row"><button type="button" class="button danger" data-act="w" data-do="pgone" data-id="${esc(p.id)}">${sure(`pgone-${p.id}`, "Tap again to take it out of the world", "Take it out of the world")}</button></div></section>`
      : hiddenParts ? `<p class="cc-small wb-more">There’s more to ${esc(p.name)} you haven’t found out yet.</p>` : "";
    if (!gm) w.unlit(id);
    return `${top}<div class="wb wp" data-wb="${esc(id)}">${head}${say ? `<p class="cc-small pt-status">${say}</p>` : ""}${showCard}${onTable}${bookNote}<div class="cc-folds wb-parts">${parts.join("")}</div>${elsewhere}${w.onMaps?.(id, { kind: "p", id: p.id }) ?? ""}${end}</div>`;
  }

  // On a faction's page, her way to make its Face a person of their own: from
  // the Bestiary if it's got them, or a new page with the name from the Face.
  function faceOf(id, f, doc) {
    if (!f.face) return "";
    const L = linksIn(id, doc);
    if (/class="wl"[^>]*&amp;p=/.test(L.rich(f.face, f.id))) return "";
    const name = f.face.replace(/[.!?]+$/, "").split(/,\s|\s+who\s|\s+-\s/)[0].trim();
    if (!name) return "";
    book();
    const t = BOOK?.threats.find((x) => keyOf(x.name) === keyOf(name) || keyOf(x.name) === keyOf(`The ${name}`));
    const doing = t ? `Bring in ${esc(t.name)} from the Bestiary` : `Make a page for ${esc(name.charAt(0).toUpperCase() + name.slice(1))}`;
    return `<button type="button" class="pt-reword wp-face" data-act="w" data-do="pface" data-f="${esc(f.id)}">${doing}</button>`;
  }

  // The Face and other words on a faction's card, with their links.
  const richFor = (id, doc) => {
    const L = linksIn(id, doc);
    return (text, self) => L.rich(text, self);
  };

  // Where else a faction comes up.
  function factionMentions(id, f, doc) {
    const ment = mentionsOf(doc, f);
    return ment.length ? `<section class="cc-sec wp-ment" aria-labelledby="wp-ment-h"><h2 id="wp-ment-h">Where else it comes up</h2><ul class="wp-ment-list">${ment.map((m) => `<li><a class="pt-reword" href="${esc(href(id, m))}" data-act="w" data-do="nav">${esc(m.name)}</a> <small>${m.kind === "f" ? "Faction" : m.page.kind === "place" ? "Place" : "Person"}</small></li>`).join("")}</ul></section>` : "";
  }

  // Finding a page as you type, without drawing the screen again.
  function filter(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const li of document.querySelectorAll("#app .wp-tok")) li.hidden = words.length > 0 && !words.every((x) => li.dataset.find.includes(x));
  }
  document.addEventListener("input", (e) => {
    if (!e.target.matches?.("[data-wfind]")) return;
    find = e.target.value.slice(0, 60);
    filter(find);
  });

  // ------------------------------------------------------------ taps

  const roll = (n) => Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * n);
  const goTo = (id, pid) => d.go(`/characters/?camp=${encodeURIComponent(id)}&world&p=${encodeURIComponent(pid)}`);
  const names = (list) => list.join(", ").replace(/, ([^,]*)$/, " and $1");
  const ACT = {
    pbring(el, id) {
      const c = BOOK?.places.find((x) => x.key === el.dataset.k);
      if (!c) return d.toast("The book’s places haven’t reached this phone yet. Try again with a signal.", false);
      const doc = docOf(id);
      if (doc.pages.some((p) => p.book?.from === "places" && p.book.key === c.key)) return d.toast(`${bare(c.name)}’s in your world already.`, false);
      const place = fromBook(c, "places", c.key);
      const ops = [{ o: "p-new", p: place }];
      const came = [];
      for (const x of c.people) {
        if (doc.pages.some((p) => keyOf(p.name) === keyOf(x.name))) continue;
        ops.push({ o: "p-new", p: fromBook(x, "places", `${c.key}/${x.key}`) });
        came.push(x.name);
      }
      if (doc.pages.length + ops.length > PMAX.pages) return d.toast(`That’s more than the ${PMAX.pages} pages a world holds. Take some out first.`, false);
      if (edit(id, ops, `${bare(c.name)}’s in your world${came.length ? `, with ${names(came)}` : ""}. Nothing’s shown to the crew yet.`)) goTo(id, place.id);
    },
    pthreat(el, id) {
      const t = BOOK?.threats.find((x) => x.key === el.dataset.k);
      if (!t) return d.toast("The Bestiary hasn’t reached this phone yet. Try again with a signal.", false);
      const doc = docOf(id);
      if (doc.pages.length >= PMAX.pages) return d.toast(`That’s ${PMAX.pages} pages, which is as many as a world holds.`, false);
      const p = fromBook(t, "bestiary", t.key);
      if (edit(id, [{ o: "p-new", p }], `${bare(t.name)}’s in your world, ready to rename and change. Nothing’s shown to the crew yet.`)) goTo(id, p.id);
    },
    pshow(el, id) {
      const p = findPage(docOf(id), el.dataset.id);
      if (!p) return;
      const k = el.dataset.p;
      const v = !p.shown[k];
      if (v && k === "secret" && ui().sure !== `psecret-${p.id}`) {
        w.setSure(`psecret-${p.id}`);
        return d.render();
      }
      const name = bare(p.name);
      const part = k === "page" ? "" : partSay(name, k);
      const say = k === "page" ? (v ? (p.kind === "place" ? `The crew can see ${name} now: its name, what it is, its Challenge and what it’s like inside.` : `The crew can see ${name} now: who they are and what you notice first.`) : `${name}’s hidden from the crew again.`)
        : v ? `The crew can see ${part} now.` : `${part.charAt(0).toUpperCase()}${part.slice(1)} ${MANY.has(k) ? "are" : "is"} hidden from the crew again.`;
      edit(id, [{ o: "p-show", id: p.id, p: k, v }], say);
    },
    pdrop(el, id) {
      const p = findPage(docOf(id), el.dataset.id);
      const x = p?.[el.dataset.l]?.find((y) => y.id === el.dataset.lid);
      if (!x) return;
      if (ui().sure !== `pdrop-${x.id}`) {
        w.setSure(`pdrop-${x.id}`);
        return d.render();
      }
      w.setEditing("");
      edit(id, [{ o: "p-drop", id: p.id, l: el.dataset.l, lid: x.id }], `${bare(flat(x.text).slice(0, 60))}’s off ${bare(p.name)}.`);
    },
    pgone(el, id) {
      const p = findPage(docOf(id), el.dataset.id);
      if (!p) return;
      if (ui().sure !== `pgone-${p.id}`) {
        w.setSure(`pgone-${p.id}`);
        return d.render();
      }
      w.setEditing("");
      if (edit(id, [{ o: "p-gone", id: p.id }], `${bare(p.name)}’s out of the world.`)) d.go(`/characters/?camp=${encodeURIComponent(id)}&world`, { replace: true });
    },
    pbook(el, id) {
      const p = findPage(docOf(id), el.dataset.id);
      const nw = p ? pageNews(p) : null;
      if (!nw) return d.render();
      if (el.dataset.take === "1") edit(id, [...nw.quietOps, ...nw.realOps, nw.book], `${bare(p.name)} has the book’s changes now.`);
      else edit(id, [...nw.quietOps, nw.book], `${bare(p.name)} stays the way you’ve got ${p.kind === "place" ? "it" : "them"}.`);
    },
    // The book's tables, rolled into the form, or a tag off each of the
    // Threat Builder's tables onto a person.
    proll(el, id) {
      const B = BOOK;
      if (!B) return;
      const r = el.dataset.r;
      if (r === "threat") {
        const p = findPage(docOf(id), el.dataset.id);
        if (!p) return;
        const have = new Set(p.tags.map((t) => keyOf(t.text)));
        const picks = [["comes", B.tables.comes], ["keeps", B.tables.keeps], ["drives", B.tables.drives]].map(([kind, rows]) => ({ kind, text: rows[roll(rows.length)] })).filter((t) => t.text && !have.has(keyOf(t.text)));
        if (!picks.length) return d.toast("Rolled ones they’ve got already. Roll again.", false);
        if (p.tags.length + picks.length > PMAX.list) return d.toast(`That’s ${PMAX.list} tags, which is as many as a page holds.`, false);
        edit(id, picks.map((t) => ({ o: "p-add", id: p.id, l: "tags", item: { id: newId(), text: t.text, x: 1, kind: t.kind } })), `Rolled ${names(picks.map((t) => t.text))}. Keep what fits and change the rest.`);
        return;
      }
      const form = el.closest("form");
      if (!form) return;
      const put = (name, v) => {
        const input = form.elements.namedItem(name);
        if (input) input.value = v ?? "";
      };
      if (r === "place") put("twist", B.tables.complication[roll(12)]);
      if (r === "hook") put("text", B.tables.trouble[roll(20)]);
      if (r === "person") {
        put("want", B.tables.want[roll(12)]);
        put("secret", B.tables.hiding[roll(12)]);
        put("what", String(roll(20)));
      }
      d.toast("Rolled. Keep what fits and change the rest.", false);
    },
    pface(el, id) {
      const doc = docOf(id);
      const f = doc.factions.find((x) => x.id === el.dataset.f);
      if (!f?.face) return;
      const raw = f.face.replace(/[.!?]+$/, "");
      const name0 = raw.split(/,\s|\s+who\s|\s+-\s/)[0].trim();
      const name = name0.charAt(0).toUpperCase() + name0.slice(1);
      const rest = raw.slice(name0.length).replace(/^,\s*/, "").trim();
      const t = BOOK?.threats.find((x) => keyOf(x.name) === keyOf(name) || keyOf(x.name) === keyOf(`The ${name}`));
      const p = t ? fromBook(t, "bestiary", t.key) : { id: newId(), kind: "person", name, line: rest, shown: {} };
      if (edit(id, [{ o: "p-new", p }], t ? `${bare(t.name)}’s in your world, from the Bestiary, and ${bare(f.name)}’s Face links to them.` : `${bare(name)} has a page now, and ${bare(f.name)}’s Face links to it. Write them as a threat if they need it.`)) goTo(id, p.id);
    },
    // Her place onto the live table's scene, in place of what's there, which
    // takes a second tap if there's anything there already.
    pscene(el, id) {
      const p = findPage(docOf(id), el.dataset.id);
      if (!p || !d.scene) return;
      const sc = sceneFrom(p);
      if (!sc.ground.length && !sc.stakes.length && !sc.clock) return d.toast("There’s nothing on it for the table yet. Give it ground, stakes or a scene clock first.", false);
      const now = d.sceneOf?.(id);
      if (now && (now.ground.length || now.stakes.length || now.events.length) && ui().sure !== `pscene-${p.id}`) {
        w.setSure(`pscene-${p.id}`);
        return d.render();
      }
      w.setSure("");
      d.scene(id, sc);
      d.render();
    },
    // One of her telegraphs, onto the round, through the live table's own
    // card: she picks who it's aimed at and sends it.
    ptele(el, id) {
      const doc = docOf(id);
      const p = findPage(doc, el.dataset.id);
      const t = p?.teles.find((x) => x.id === el.dataset.lid);
      if (!t || !d.tele) return;
      const cond = t.at.split(",").map((x) => x.trim()).filter((x) => !/^(Defend|Confidence)$/.test(x) && /^[A-Z][a-z]+$/.test(x));
      // A place's telegraph that starts with someone in it is theirs:
      // "Orla raps her cane" is Orla Strand's.
      let who = p.name;
      const lead = flat(t.text).match(/^([A-Z][\p{L}’'-]{2,})/u)?.[1];
      if (p.kind === "place" && lead) {
        const here = p.here.map((x) => flat(x.text)).join(" ");
        who = doc.pages.find((q) => q.kind === "person" && q.name.split(/\s+/).includes(lead) && here.includes(q.name))?.name ?? who;
      }
      // Its words and what it's aimed at go too, so one at a stake, the scene
      // clock or a part of the place comes aimed there (table.js).
      d.tele(id, { who: who.slice(0, 60), does: `${flat(t.text)}${cond.length ? ` (${cond.join(", ")})` : ""}`.slice(0, 140), d: t.d, kind: /\bConfidence\b/.test(t.at) ? "fear" : "blow", text: flat(t.text), at: t.at, page: p.name });
    },
  };

  // ------------------------------------------------------------ forms

  function submit(kind, form, f, id) {
    const doc = docOf(id);
    const text = (name, max = PMAX.words) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const long = (name, max) => String(f.get(name) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
    w.setEditing("");
    if (kind === "w-pg-new") {
      const pk = form.dataset.kind === "person" ? "person" : "place";
      const name = text("name", PMAX.name);
      if (!name) return d.toast(pk === "place" ? "Give it a name first." : "Give them a name first.", false);
      if (doc.pages.length >= PMAX.pages) return d.toast(`That’s ${PMAX.pages} pages, which is as many as a world holds.`, false);
      const p = { id: newId(), kind: pk, name, line: text("line", PMAX.line), look: long("look", PMAX.look), shown: {} };
      if (pk === "place") Object.assign(p, { ch: Number(f.get("ch")) || 0, twist: text("twist") });
      else {
        Object.assign(p, { want: text("want"), secret: text("secret", PMAX.secret).replace(/[.!?]+$/, "") });
        const wh = BOOK?.tables.what[Number(f.get("what"))];
        if (f.get("what") !== "" && wh) {
          const rest = BOOK.tables.what.filter((x) => !x.twice);
          const a = roll(rest.length);
          const b = (a + 1 + roll(rest.length - 1)) % rest.length;
          const pick = wh.twice ? [rest[a], rest[b]] : [wh];
          const tags = [];
          for (const x of pick) for (const t of x.tags) if (!tags.some((y) => keyOf(y.text) === keyOf(t.text))) tags.push({ id: newId(), ...t });
          Object.assign(p, { ch: Math.max(...pick.map((x) => x.ch)), tags, rules: pick.map((x) => x.also).filter(Boolean).join(" "), line: p.line || pick.map((x) => x.is).join(", fused with ") });
        }
      }
      if (edit(id, [{ o: "p-new", p }], `${bare(name)}’s in your world. Nothing’s shown to the crew yet.`)) goTo(id, p.id);
      return;
    }
    const p = findPage(doc, form.dataset.id);
    if (!p) return d.render();
    const changed = (ops, say) => {
      const real = ops.filter((op) => JSON.stringify(op.v) !== JSON.stringify(op.f === "aka" ? p.aka : p[op.f]));
      if (!real.length || !edit(id, real, say)) d.render();
    };
    if (kind === "w-pg-words") {
      const name = text("name", PMAX.name);
      if (!name) return d.toast(p.kind === "place" ? "It needs a name." : "They need a name.", false);
      const ops = [{ o: "p-set", id: p.id, f: "name", v: name }, { o: "p-set", id: p.id, f: "aka", v: text("aka", PMAX.name * PMAX.aka).split(",").map((x) => x.trim()).filter(Boolean) }, { o: "p-set", id: p.id, f: "line", v: text("line", PMAX.line) }, { o: "p-set", id: p.id, f: "look", v: long("look", PMAX.look) }];
      if (p.kind === "place") ops.push({ o: "p-set", id: p.id, f: "ch", v: Number(f.get("ch")) || 0 });
      return changed(ops, `${bare(name)}’s changed.`);
    }
    if (kind === "w-pg-set") {
      const k = form.dataset.f;
      if (!["want", "twist", "voice", "elsewhere", "rules", "note"].includes(k)) return d.render();
      const v = ["rules", "note"].includes(k) ? long("v", k === "note" ? PMAX.note : PMAX.rules) : text("v", k === "elsewhere" ? PMAX.elsewhere : PMAX.words);
      return changed([{ o: "p-set", id: p.id, f: k, v }], k === "note" ? "Your note’s saved. Only you see it." : `Changed on ${bare(p.name)}.`);
    }
    if (kind === "w-pg-clock") return changed([{ o: "p-set", id: p.id, f: "clockD", v: Number(f.get("clockD")) || 0 }, { o: "p-set", id: p.id, f: "clock", v: text("clock") }], `${bare(p.name)}’s scene clock is changed.`);
    if (kind === "w-pg-secret") return changed([{ o: "p-set", id: p.id, f: "secret", v: text("secret", PMAX.secret).replace(/[.!?]+$/, "") }, { o: "p-set", id: p.id, f: "more", v: long("more", PMAX.more) }, { o: "p-set", id: p.id, f: "weak", v: f.get("weak") === "on" }], `${bare(p.name)}’s Secret is changed.`);
    if (kind === "w-pg-ch") return changed([{ o: "p-set", id: p.id, f: "ch", v: Number(f.get("ch")) || 0 }], `${bare(p.name)}’s Challenge is changed.`);
    const l = form.dataset.l;
    if (!PLISTS[p.kind].includes(l)) return d.render();
    const max = l === "tags" ? PMAX.name : PMAX.item;
    if (kind === "w-pg-add") {
      const words = text("text", max);
      if (!words) return d.toast("Write it in first.", false);
      if (p[l].length >= PMAX.list) return d.toast(`That’s ${PMAX.list} already, which is as many as a page holds.`, false);
      const it = { id: newId(), text: l === "tags" ? words.replace(/[.!?]+$/, "") : words };
      if (l === "tags") Object.assign(it, { kind: String(f.get("kind") ?? ""), x: Number(f.get("x")) || 1 });
      if (l === "teles") Object.assign(it, { d: Number(f.get("d")) || 6, at: text("at", PMAX.name) });
      if (edit(id, [{ o: "p-add", id: p.id, l, item: it }], `On ${bare(p.name)} now.`)) form.reset();
      return;
    }
    if (kind === "w-pg-line") {
      const x = p[l].find((y) => y.id === form.dataset.lid);
      if (!x) return d.render();
      const words = text("text", max);
      if (!words) return d.toast("It needs its words. Take it off instead, if it’s gone.", false);
      const ops = [];
      const put = (fld, v) => {
        if (v !== x[fld]) ops.push({ o: "p-edit", id: p.id, l, lid: x.id, f: fld, v });
      };
      put("text", words);
      if (l === "tags") {
        put("kind", String(f.get("kind") ?? ""));
        put("x", Number(f.get("x")) || 1);
      }
      if (l === "teles") {
        put("d", Number(f.get("d")) || 6);
        put("at", text("at", PMAX.name));
      }
      if (!ops.length || !edit(id, ops, `Changed on ${bare(p.name)}.`)) d.render();
    }
  }

  return { sections, pageView, backOf, faceOf, richFor, factionMentions, ACT, submit, news, quiet, title: (id, pid) => findPage(docOf(id), pid)?.name ?? "A page", count: (doc) => ({ places: doc.pages.filter((p) => p.kind === "place"), people: doc.pages.filter((p) => p.kind === "person") }) };
}
