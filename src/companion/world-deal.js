// /deal/ (stage 3 of notes/builder-plan.md): every table the world builder
// deals from, and sample boards dealt from them a tap at a time, with the
// same engine the World screen uses (world-engine.js). The board's in the
// address (?r=town&g=medieval&n=6&s=ash-lantern-ford), so Back and Forward
// step through the boards dealt, and a board sent in a message deals again
// just as it was. The tables come from /world-tables.json, so it needs a
// signal, and it's kept off phones like /kit/.
import { canDeal, cardsOf, dealWorld, newSeed } from "./world-engine.js";
import { die, esc, inline, tag } from "../kit/kit.js";

const app = document.getElementById("wd");
const KINDS = {
  house: "Noble houses",
  traders: "Merchants",
  crooks: "Crooks",
  faith: "Temples and orders",
  office: "Crown offices",
  society: "Secret societies",
  soldiers: "Soldiers",
  makers: "Craft guilds",
  family: "Family businesses",
  rebels: "Rebels",
  keepers: "Keepers of old things",
  old: "Something old",
};
const BONDS = { pub: "Public Sentiment", mor: "Morale", loy: "Loyalty" };
const SIZE_NAMES = { small: "Small", local: "Local", city: "City", great: "Great" };
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const low = (s) => String(s ?? "").charAt(0).toLowerCase() + String(s ?? "").slice(1);
const list = (xs, sep = ", ") => xs.filter(Boolean).join(sep);

let T = null;
const view = { tab: "boards", region: "town", genre: "medieval", n: 6, seed: "", find: "" };
// How many boards back the one showing is, so Back knows when there's one to go to.
let at = 0;

// ── The address
function readAddress() {
  const q = new URLSearchParams(location.search);
  if (q.get("t") === "tables") view.tab = "tables";
  else view.tab = "boards";
  if (T.regions[q.get("r")]) view.region = q.get("r");
  if (T.genres[q.get("g")]) view.genre = q.get("g");
  const n = Number(q.get("n"));
  if (n >= 4 && n <= 12) view.n = Math.floor(n);
  const s = q.get("s") ?? "";
  view.seed = /^[a-z]{2,12}(-[a-z]{2,12}){2}$/.test(s) ? s : "";
}
function address() {
  const q = new URLSearchParams();
  if (view.tab === "tables") q.set("t", "tables");
  q.set("r", view.region);
  q.set("g", view.genre);
  q.set("n", String(view.n));
  if (view.seed) q.set("s", view.seed);
  return `${location.pathname}?${q}`;
}
function go(push) {
  const url = address();
  if (push) history.pushState({ i: ++at }, "", url);
  else history.replaceState({ i: at }, "", url);
  draw();
}

// ── What can deal
const recipeOf = (g) => ({ region: view.region, era: g.era, twist: g.twist ?? null });
const deals = (g, region = view.region) => canDeal(T, { region, era: g.era, twist: g.twist ?? null });
const genres = () => Object.values(T.genres);
const regionDeals = (r) => genres().some((g) => deals(g, r));
function settle() {
  if (!regionDeals(view.region)) view.region = Object.keys(T.regions).find(regionDeals) ?? view.region;
  const g = T.genres[view.genre];
  if (!g || !deals(g)) view.genre = genres().find((x) => deals(x))?.id ?? view.genre;
  if (!view.seed) view.seed = newSeed(T);
}

// ── Drawing
function draw() {
  settle();
  const tabs = `<div class="seg wd-tabs" role="group" aria-label="Show">
      <button type="button" data-tab="boards" aria-pressed="${view.tab === "boards"}">Boards</button>
      <button type="button" data-tab="tables" aria-pressed="${view.tab === "tables"}">Tables</button>
    </div>`;
  app.innerHTML = tabs + (view.tab === "boards" ? boardView() : tablesView()) + `<p class="wd-status" role="status"></p>`;
  if (view.tab === "tables") fillOpen();
  document.body.classList.toggle("wd-on-boards", view.tab === "boards");
}

function recipeForm() {
  const regions = Object.values(T.regions)
    .map((r) => {
      const ok = regionDeals(r.id);
      return `<label class="${ok ? "" : "off"}"><input type="radio" name="r" value="${esc(r.id)}"${r.id === view.region ? " checked" : ""}${ok ? "" : " disabled"}><span>${esc(r.name)}</span></label>`;
    })
    .join("");
  const opts = genres()
    .map((g) => `<option value="${esc(g.id)}"${g.id === view.genre ? " selected" : ""}${deals(g) ? "" : " disabled"}>${esc(g.name)}${deals(g) ? "" : " (coming)"}</option>`)
    .join("");
  return `<form class="wd-recipe" aria-label="What to deal">
      <fieldset class="wd-regions"><legend>Region</legend><div class="wd-seg5">${regions}</div></fieldset>
      <div class="wd-pair">
        <label class="wd-field"><span>Genre</span><select name="g">${opts}</select></label>
        <div class="wd-step" role="group" aria-labelledby="wd-n">
          <span id="wd-n" class="wd-step-name">Factions</span>
          <button type="button" data-n="-1" aria-label="One faction fewer"${view.n <= 4 ? " disabled" : ""}>−</button>
          <output aria-live="off">${view.n}</output>
          <button type="button" data-n="1" aria-label="One faction more"${view.n >= 12 ? " disabled" : ""}>+</button>
        </div>
      </div>
    </form>`;
}

function boardView() {
  const g = T.genres[view.genre];
  let W;
  try {
    W = dealWorld(T, { recipe: recipeOf(g), seed: view.seed, factions: view.n });
  } catch (err) {
    return recipeForm() + `<p class="wd-warn">That one won't deal: ${esc(err.message)}</p>`;
  }
  const C = cardsOf(T, W);
  const reg = T.regions[W.recipe.region];
  const mix = `${T.eras[g.era]}${g.twist ? ` and ${T.twists[g.twist]}` : ""}`;
  const story = `<section class="card wd-story" aria-labelledby="wd-story-h">
      <div class="wd-board-top">
        <h2 id="wd-story-h">${esc(g.name)} ${esc(low(reg.name))}</h2>
        <p class="wd-seed"><span class="visually-hidden">Seed </span>${esc(W.seed)}</p>
      </div>
      <p class="wd-mix">${esc(mix)} · ${W.n} factions · ${W.s} seats</p>
      <dl class="wd-ask">
        <div><dt>Holds it together</dt><dd>${esc(W.asking.holds?.text)}</dd></div>
        <div><dt>Runs it</dt><dd>${esc(W.asking.runs?.text)}</dd></div>
        <div><dt>A stranger notices</dt><dd>${esc(W.asking.notices?.text)}</dd></div>
        <div class="wd-tension"><dt>Pulling it apart</dt><dd>${die(12, { own: "them", face: W.tension?.roll, label: `The tension, a d12 that came up ${W.tension?.roll}` })}<span>${esc(W.tension?.text)}</span></dd></div>
      </dl>
      <p class="wd-dials">${["tense", "strange", "rich", "ruled"].map((k) => `<span><b>${cap(k)}</b> ${dial(W.dials[k])}</span>`).join("")}</p>
      <button type="button" class="wd-copy" data-act="copy">Copy this board's link</button>
    </section>`;
  const seats = `<section aria-labelledby="wd-ground-h">
      <h2 id="wd-ground-h" class="wd-h2">The ground <span>${C.seats.length} seats</span></h2>
      <ul class="wd-seats">${C.seats
        .map((s) => {
          const who = s.held >= 0 ? `<a href="#wd-f${s.held + 1}">${esc(C.factions[s.held].name)}</a>` : `<span class="free">Free</span>`;
          return `<li><div class="wd-seat-top"><b>${esc(s.name)}</b><span class="wd-keep">${esc(cap(s.role))}</span></div><p>${esc(s.notice)}</p><p class="wd-held">${who}</p></li>`;
        })
        .join("")}</ul>
    </section>`;
  const factions = `<section aria-labelledby="wd-f-h">
      <h2 id="wd-f-h" class="wd-h2">The factions <span>${C.factions.length}</span></h2>
      ${C.factions.map((f, i) => factionCard(W, C, f, i, reg)).join("")}
    </section>`;
  return recipeForm() + story + seats + factions + checksOf(W) + bar();
}

function dial(v) {
  const n = Number(v) || 0;
  return `<span class="wd-dial" role="img" aria-label="${n} of 2">${[0, 1].map((k) => `<i class="${k < n ? "on" : ""}"></i>`).join("")}</span>`;
}
// Why a step went the way it did, once a card: the same reason under every
// line it steered says nothing new.
let said = new Set();
const because = (why) => (why && !said.has(why) ? (said.add(why), `<span class="wd-why">${esc(low(why))}</span>`) : "");

function factionCard(W, C, f, i, reg) {
  said = new Set();
  const w = W.factions[i];
  const seat = C.seats.find((s) => s.k === f.seat);
  const size = `${SIZE_NAMES[f.size] ?? cap(f.size)}, ${reg.sizes[f.size] ?? ""}`;
  const exc = f.exception ? `<p class="wd-exc"><b>Breaks the logic.</b> ${esc(f.exception.text)}, ${esc(low(f.exception.reason))}.</p>` : "";
  const res = f.res.map((r, k) => `<li>${esc(r.text)}${because(w.res?.[k]?.why)}</li>`).join("");
  const spare = f.res.length - f.assets.filter((a) => !a.off).length;
  const assets = f.assets
    .map((a, k) => {
      const pick = w.assets?.[k];
      const mark = a.off ? `<span class="wd-need">a need, nothing paying for it</span>` : a.power ? `<span class="wd-pow">+1 Power</span>` : "";
      return `<li${a.off ? ' class="off"' : ""}><span class="wd-asset">${esc(a.text)}</span>${mark}${a.does && !a.power ? `<span class="wd-does">${esc(a.does)}</span>` : ""}${because(pick?.why)}</li>`;
    })
    .join("");
  const ag = f.agendas[0];
  const face = f.threat
    ? `<dd><span class="wd-face">${esc(f.face)}</span>, Challenge ${f.ch}<span class="wd-is">${esc(f.threat.is)}</span><span class="wd-tags">${f.threat.tags.map((t) => tag(t.text)).join("")}</span></dd>`
    : `<dd>${esc(f.face)}</dd>`;
  const threads = f.threads
    .map((t) => `<li class="${t.kind === "hostile" ? "hostile" : "bond"}"><span class="wd-tk">${t.kind === "hostile" ? "Hostile" : "Bond"}</span> <span class="wd-to">toward <a href="#wd-f${t.to + 1}">${esc(C.factions[t.to]?.name)}</a></span><span class="wd-tt">${esc(t.text)}</span></li>`)
    .join("");
  const offers = f.offers.map((o) => `<li><span class="wd-tk">${esc(BONDS[o.bond])}, ${o.kind === "hostile" ? "hostile" : "bond"}</span><span class="wd-tt">${esc(o.text)}</span></li>`).join("");
  return `<article class="card wd-f" id="wd-f${i + 1}" aria-labelledby="wd-f${i + 1}-h">
      <header class="wd-f-top">
        ${die(f.die, { own: "them", label: `Power: a d${f.die}` })}
        <div><h3 id="wd-f${i + 1}-h">${esc(f.name)}</h3><p class="wd-size">${esc(size)} · on ${esc(seat?.name ?? "nowhere")} · ${f.steps} ${f.steps === 1 ? "step" : "steps"}</p></div>
      </header>
      <p class="wd-about">${esc(f.about)}${because(w.type?.why)}${because(w.method?.why)}</p>
      ${exc}
      <dl class="wd-lines">
        <div><dt>Wants</dt><dd>${esc(f.want)}${because(w.want?.why)}</dd></div>
        <div><dt>Resources</dt><dd><ul>${res}</ul>${spare > 0 ? `<p class="wd-spare">${spare} extra, paying for nothing</p>` : ""}</dd></div>
        <div><dt>Assets</dt><dd><ul>${assets}</ul></dd></div>
        <div><dt>Agenda</dt><dd class="wd-agenda">${ag ? `${inline(ag.die, { own: "them" })}<span>${esc(ag.text)}</span>${because(w.agenda?.why)}` : ""}</dd></div>
        <div><dt>Face</dt>${face}</div>
        <div class="wd-secret"><dt>Secret</dt><dd><b>${esc(f.secret)}.</b> ${esc(f.more)}</dd></div>
        ${threads ? `<div><dt>Threads</dt><dd><ul class="wd-threads">${threads}</ul></dd></div>` : ""}
        ${offers ? `<div><dt>Offered</dt><dd><ul class="wd-threads offered">${offers}</ul></dd></div>` : ""}
      </dl>
    </article>`;
}

function checksOf(W) {
  const failed = (W.checks ?? []).filter((c) => !c.ok).map((c) => c.k);
  const again = [...new Set((W.fixes ?? []).map((f) => f.k))];
  const parts = [failed.length ? `failed: ${failed.join(", ")}` : "every check passed"];
  if (again.length) parts.push(`dealt again for ${again.join(", ")}`);
  if (W.fallbacks?.length) parts.push(`fallbacks for ${[...new Set(W.fallbacks)].join(", ")}`);
  return `<p class="wd-checks">${esc(cap(parts.join(", ")))}.</p>`;
}

function bar() {
  return `<nav class="wd-bar" aria-label="Deal">
      <button type="button" class="wd-back" data-act="back"${at > 0 ? "" : " disabled"}>Back</button>
      <button type="button" class="button primary wd-deal" data-act="deal">Deal another</button>
    </nav>`;
}

// ── The tables
function parts() {
  const C = T.core;
  const out = [
    { group: "The core", note: "Everything that isn't genre, the same in every world.", items: [
      { id: "holds", name: "What holds it together", rows: C.asking.holds },
      { id: "runs", name: "Who runs it", rows: C.asking.runs },
      { id: "notices", name: "What a stranger notices first", rows: C.asking.notices },
      { id: "tension", name: "What's pulling it apart, a d12", rows: C.tension, num: true },
      { id: "wants", name: "What it wants", rows: C.wants },
      { id: "methods", name: "How it works", rows: C.methods },
      { id: "secrets", name: "Its secret", rows: C.secrets },
      { id: "agendas", name: "What it's doing", rows: C.agendas },
      ...["rival", "ally", "debt", "wildcard", "blocked"].map((k) => ({ id: `ties-${k}`, name: TIE_NAMES[k], rows: C.ties.filter((t) => t.kind === k) })),
      { id: "fallbacks", name: "When a check still fails", rows: Object.entries(C.fallbacks).map(([k, r]) => ({ ...r, fall: k })) },
      { id: "faces", name: "Faces, by kind", rows: Object.entries(C.faces).map(([k, v]) => ({ id: `face-${k}`, text: KINDS[k], list: v.map((x) => T.book.threats.find((t) => t.key === x)?.name ?? x) })) },
      { id: "keeps", name: "Where the money comes from", rows: Object.entries(T.keeps).map(([k, v]) => ({ id: `keep-${k}`, text: cap(k), line: v })) },
      { id: "kinds", name: "What it is underneath", rows: Object.entries(T.types).map(([k, v]) => ({ id: `kind-${k}`, text: KINDS[k], line: v })) },
      { id: "because", name: "Why it went that way", rows: Object.entries(C.because).map(([k, v]) => ({ id: `because-${k}`, text: v || "(it's obvious, so nothing's said)", line: `steered by its ${k}` })) },
      { id: "seeds", name: "Seed words", rows: [{ id: "seeds", text: C.seeds.join(" · ") }] },
    ] },
    { group: "The regions", note: "What each size is, and the words the builder shows for it.", items: Object.values(T.regions).map((r) => ({
      id: `region-${r.id}`, name: r.name, rows: [
        { id: `${r.id}-f`, text: cap(r.faction), line: "a faction" },
        { id: `${r.id}-s`, text: cap(r.seat), line: "a seat" },
        { id: `${r.id}-m`, text: cap(r.mini), line: "a mini faction" },
        ...Object.entries(r.sizes).map(([k, v]) => ({ id: `${r.id}-${k}`, text: cap(v), line: `${SIZE_NAMES[k]}` })),
        { id: `${r.id}-p`, text: cap(r.pressure), line: "pressure from one size up" },
        { id: `${r.id}-d6`, text: r.d6.map(cap).join(" · "), line: "the founding's d6, 1 to 6" },
      ] })) },
    { group: "The genres", note: "A genre's an era and maybe a twist. One deals once its packs are in.", items: [
      { id: "genres", name: "Genres", rows: genres().map((g) => ({ id: `g-${g.id}`, text: g.name, line: `${T.eras[g.era]}${g.twist ? ` and ${T.twists[g.twist]}` : ""}`, deal: Object.keys(T.regions).filter((r) => deals(g, r)).map((r) => T.regions[r].name) })) },
    ] },
  ];
  for (const [key, p] of Object.entries(T.packs)) {
    const items = [];
    for (const r of p.fits) {
      const seats = p.seats.filter((x) => !x.regions || x.regions.includes(r)).sort((a, b) => a.role.localeCompare(b.role));
      items.push({ id: `${key}-seats-${r}`, name: `Seats in a ${low(T.regions[r].name)}`, rows: seats, keep: true });
    }
    items.push({ id: `${key}-res`, name: "Resources", rows: [...p.resources].sort((a, b) => a.role.localeCompare(b.role)), keep: true });
    const assetsBy = (rows) => [...rows].sort((a, b) => (T.book.assets[a.role]?.name ?? "").localeCompare(T.book.assets[b.role]?.name ?? ""));
    items.push({ id: `${key}-people`, name: "People who turn up", rows: assetsBy(p.assets.filter((a) => a.power)), asset: true });
    items.push({ id: `${key}-assets`, name: "Assets that do one thing", rows: assetsBy(p.assets.filter((a) => !a.power)), asset: true });
    for (const k of Object.keys(KINDS)) items.push({ id: `${key}-types-${k}`, name: `What it is: ${low(KINDS[k])}`, rows: p.types.filter((t) => t.role === k) });
    if (p.methods.length) items.push({ id: `${key}-methods`, name: "How it works", rows: p.methods });
    if (p.wants.length) items.push({ id: `${key}-wants`, name: "What it wants", rows: p.wants });
    items.push({ id: `${key}-secrets`, name: "Its secret", rows: p.secrets });
    items.push({ id: `${key}-exceptions`, name: "Breaking the logic", rows: p.exceptions });
    items.push({ id: `${key}-names`, name: "Faction names", rows: [...p.names.factions].sort((a, b) => (a.role ?? "").localeCompare(b.role ?? "")), kind: true });
    items.push({ id: `${key}-people-names`, name: "People's names", rows: p.names.people });
    out.push({ group: p.name, note: p.kind === "era" ? `The ${p.name} era's own words, for ${p.fits.map((r) => low(T.regions[r].name)).join(", ").replace(/, ([^,]*)$/, " and $1")}.` : `The ${p.name} twist, every row strange.`, items });
  }
  return out;
}
const TIE_NAMES = { rival: "Rivals", ally: "Allies", debt: "Debts", wildcard: "Wildcards", blocked: "A trade blocked" };

function rowHtml(r, part, k) {
  const meta = [];
  if (part.keep && r.role) meta.push(`<span class="wd-m keep">${esc(cap(r.role))}</span>`);
  if (part.asset && r.role) meta.push(`<span class="wd-m keep">${esc(T.book.assets[r.role]?.name ?? r.role)}</span>`);
  if (part.kind) meta.push(`<span class="wd-m keep">${esc(r.role ? KINDS[r.role] : "Any kind")}</span>`);
  if (r.regions) meta.push(`<span class="wd-m">${esc(r.regions.map((x) => T.regions[x]?.name ?? x).join(", "))}</span>`);
  if (r.sizes) meta.push(`<span class="wd-m">${esc(r.sizes.map((x) => SIZE_NAMES[x]).join(", "))}</span>`);
  if (r.die) meta.push(`<span class="wd-m">starts at d${r.die}</span>`);
  if (r.tags?.length) meta.push(`<span class="wd-m">${esc(r.tags.join(", "))}</span>`);
  if (r.needs?.length) meta.push(`<span class="wd-m">needs ${esc(r.needs.join(", "))}</span>`);
  if (r.out?.length) meta.push(`<span class="wd-m">never with ${esc(r.out.join(", "))}</span>`);
  if (r.dials && Object.keys(r.dials).length) meta.push(`<span class="wd-m">${esc(Object.entries(r.dials).map(([d, v]) => `${d} ${v > 0 ? "+" : ""}${v}`).join(", "))}</span>`);
  if (r.w === 1) meta.push(`<span class="wd-m rare">rare</span>`);
  if (r.strange) meta.push(`<span class="wd-m strange">strange</span>`);
  if (r.deal) meta.push(`<span class="wd-m ${r.deal.length ? "keep" : ""}">${r.deal.length ? `deals at ${esc(r.deal.join(", "))}` : "coming"}</span>`);
  if (r.fall) meta.push(`<span class="wd-m keep">${esc(r.fall)}</span>`);
  let words = esc(r.text);
  let under = "";
  if (r.tag) {
    words = esc(r.tag);
    under = [r.more, r.ways?.length ? `Ways in: ${r.ways.map(low).join(", or ")}.` : ""].filter(Boolean).map((x) => `<span class="wd-under">${esc(x)}</span>`).join("");
  }
  if (r.notice) under += `<span class="wd-under">${esc(r.notice)}</span>`;
  if (r.line) under += `<span class="wd-under">${esc(r.line)}</span>`;
  if (r.list) under += `<span class="wd-under">${esc(r.list.join(", "))}</span>`;
  if (r.back) under += `<span class="wd-under">Back: ${esc(r.back)}</span>`;
  if (r.kind === "wildcard") meta.push(`<span class="wd-m">${r.bond === "hostile" ? "hostile" : "bond"}</span>`);
  if (r.reason) under += `<span class="wd-under">${esc(cap(r.reason))}. When ${esc(r.when.join(", "))}, never ${esc(r.drops.join(", "))}${r.gives?.length ? `, and it's ${esc(r.gives.join(", "))}` : ""}.</span>`;
  for (const o of r.offers ?? []) under += `<span class="wd-under">Offers a ${esc(BONDS[o.bond])} thread, ${o.kind}: ${esc(o.text)}</span>`;
  const num = part.num ? `<span class="wd-n">${k + 1}</span>` : "";
  return `<li>${num}<span class="wd-words">${words}</span>${under}${meta.length ? `<span class="wd-meta">${meta.join("")}</span>` : ""}</li>`;
}
const findText = (r) => [r.text, r.tag, r.more, ...(r.ways ?? []), r.notice, r.line, r.back, r.reason, ...(r.list ?? []), ...(r.tags ?? []), r.role, ...(r.offers ?? []).map((o) => o.text)].filter(Boolean).join(" ").toLowerCase();

let PARTS = null;
function tablesView() {
  PARTS ??= parts();
  const q = view.find.trim().toLowerCase();
  let total = 0;
  const groups = PARTS.map((g) => {
    const items = g.items
      .map((it) => {
        const rows = q ? it.rows.filter((r) => findText(r).includes(q)) : it.rows;
        if (q && !rows.length) return "";
        total += rows.length;
        return `<details class="wd-part" data-part="${esc(it.id)}"${q ? " open" : ""}><summary><span>${esc(it.name)}</span><span class="wd-count">${rows.length}</span></summary><ol class="wd-rows"></ol></details>`;
      })
      .join("");
    if (!items) return "";
    return `<section class="wd-group"><h2 class="wd-h2">${esc(g.group)}</h2><p class="wd-note">${esc(g.note)}</p>${items}</section>`;
  }).join("");
  return `<div class="wd-find"><label for="wd-q">Find a row</label><input id="wd-q" type="search" value="${esc(view.find)}" placeholder="A word in any table" autocomplete="off" enterkeyhint="search"></div>
    ${q ? `<p class="wd-found">${total} ${total === 1 ? "row" : "rows"} with “${esc(view.find.trim())}”</p>` : ""}
    ${groups || `<p class="wd-found">Nothing has that in it.</p>`}`;
}
function fillPart(d) {
  const ol = d.querySelector(".wd-rows");
  if (!ol || ol.dataset.done) return;
  const it = PARTS.flatMap((g) => g.items).find((x) => x.id === d.dataset.part);
  if (!it) return;
  const q = view.find.trim().toLowerCase();
  const rows = q ? it.rows.filter((r) => findText(r).includes(q)) : it.rows;
  ol.innerHTML = rows.map((r, k) => rowHtml(r, it, k)).join("");
  ol.dataset.done = "1";
}
const fillOpen = () => app.querySelectorAll("details.wd-part[open]").forEach(fillPart);

// ── What the page does
const say = (text) => {
  const s = app.querySelector(".wd-status");
  if (s) s.textContent = text;
};
app.addEventListener("toggle", (e) => {
  if (e.target.matches?.("details.wd-part") && e.target.open) fillPart(e.target);
}, true);
app.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.tab) {
    view.tab = b.dataset.tab;
    go(false);
    window.scrollTo(0, 0);
  } else if (b.dataset.n) {
    view.n = Math.max(4, Math.min(12, view.n + Number(b.dataset.n)));
    go(false);
    say(`${view.n} factions.`);
  } else if (b.dataset.act === "deal") {
    view.seed = newSeed(T);
    go(true);
    window.scrollTo(0, 0);
    say(`Dealt ${view.seed}.`);
  } else if (b.dataset.act === "back") {
    history.back();
  } else if (b.dataset.act === "copy") {
    try {
      await navigator.clipboard.writeText(location.href);
      say("This board's link is copied.");
    } catch {
      say("Couldn't copy it. The address bar has the link.");
    }
  }
});
app.addEventListener("change", (e) => {
  const t = e.target;
  if (t.name === "r") view.region = t.value;
  else if (t.name === "g") view.genre = t.value;
  else return;
  go(false);
  say(`${T.genres[view.genre].name} ${low(T.regions[view.region].name)}.`);
});
let finding = 0;
app.addEventListener("input", (e) => {
  if (e.target.id !== "wd-q") return;
  view.find = e.target.value;
  clearTimeout(finding);
  finding = setTimeout(() => {
    const at = e.target.selectionStart;
    go(false);
    const input = app.querySelector("#wd-q");
    input?.focus();
    input?.setSelectionRange(at, at);
  }, 180);
});
window.addEventListener("popstate", (e) => {
  at = Number(e.state?.i) || 0;
  readAddress();
  draw();
});

(async function load() {
  try {
    const res = await fetch("/world-tables.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    T = await res.json();
  } catch {
    app.innerHTML = `<p class="wd-warn">The tables won't load. This page needs a signal, so try again once you've got one.</p>`;
    return;
  }
  readAddress();
  settle();
  at = Number(history.state?.i) || 0;
  history.replaceState({ i: at }, "", address());
  draw();
})();
