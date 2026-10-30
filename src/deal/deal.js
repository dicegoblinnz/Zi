// /deal/: deal sample boards from the world builder's tables, and read every
// table (stage 3 of notes/builder-plan.md). It uses the same engine the World
// screen will, on public/world-tables.json, so what Mo judges here is what a
// GM gets. Nothing's saved: the address holds the region, the genre (or the
// mix), how many factions, the seed, and how many of the book's crew there
// are, with something worth taking on their party sheet or not (stage 6), so
// a link deals the same board again, and its # is left for the links between
// a board's seats and factions.
//
// Answer a deck (stage 7) makes the same world off the deck a card at a time
// with world-deck.js: the card that's up with its two answers, Not this one,
// Undo and Answer the rest at random, a prompt's three suggestions, the
// factions' tiles filling in and How it came to be, then the board the end
// deals. The address keeps every answer too (deck=1, a for the answers and n
// for the Not this ones on the card that's up), so a link plays it again.
import { REGIONS, canDeal, cardsOf, dealWorld, newSeed, start } from "../companion/world-engine.js";
import { AGES, PARTS, answer, calledOf, current, fillPrompt, finish, formedOf, historyOf, notThis, playRest, playedOf, prompted, replay, startDeck, undo } from "../companion/world-deck.js";
import { die, esc } from "../kit/kit.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MIX = "mix";
const QUESTIONS = [
  ["holds", "What holds it together?"],
  ["runs", "Who runs it, really?"],
  ["notices", "What does a stranger notice first?"],
];
const DIAL_NAMES = { tense: "tense", strange: "strange", rich: "rich", ruled: "ruled" };
const BOND_NAMES = { pub: "Public Sentiment", mor: "Morale", loy: "Loyalty" };
const CHECK_NAMES = { whole: "a card with a hole", power: "Power", rival: "a rival each", block: "a blocked trade", secret: "a Secret naming another faction", unique: "an asset held twice", aims: "an agenda aimed at nothing", crew: "a faction after something the crew’s got", strange: "something strange" };
// The book's crew, the first so many of them, each dealt a friend and a foe.
const CREW = ["Vesk", "Bram", "Isolde", "Dorrie", "Ash", "Wren"];
// The deck's three ages, and what each forms of a faction.
const AGE_NAMES = { 1: "Long ago", 2: "In living memory", 3: "This last year" };
const PART_NAMES = { like: "what it’s like", keep: "what it took", foe: "a rival", friend: "an ally or a debt", agenda: "its agenda", secret: "its Secret", face: "its Face" };

let T = null;
const want = { region: "town", genre: "medieval", era: null, twist: null, n: 6, seed: null, crew: 0, sheet: false, deck: false };
// A deck's answers and Not this ones, as the address had them.
const asked = { log: [], nots: 0 };
let shown = null;

// ── The address: ?region=town&genre=medieval&factions=6&seed=ash-lantern-ford,
// or a mix of its own as genre=mix&era=medieval&twist=magic, and a deck's
// answers as deck=1&a=…&n=….
function readAddress() {
  const q = new URLSearchParams(location.search);
  const region = q.get("region");
  if (REGIONS.includes(region)) want.region = region;
  const genre = q.get("genre");
  if (genre === MIX) Object.assign(want, { genre: MIX, era: q.get("era") || null, twist: q.get("twist") || null });
  else if (genre) want.genre = genre;
  const n = Number(q.get("factions"));
  if (n >= 4 && n <= 12) want.n = Math.floor(n);
  want.seed = q.get("seed")?.slice(0, 40) || null;
  const crew = Number(q.get("crew"));
  if (crew >= 0 && crew <= CREW.length) want.crew = Math.floor(crew);
  want.sheet = q.get("sheet") === "1";
  want.deck = q.get("deck") === "1";
  asked.log = want.deck ? logOf(q.get("a") ?? "") : [];
  asked.nots = want.deck ? Math.max(0, Math.min(999, Math.floor(Number(q.get("n")) || 0))) : 0;
}
function writeAddress({ push = false } = {}) {
  const q = new URLSearchParams({ region: want.region, genre: want.genre });
  if (want.genre === MIX) {
    q.set("era", want.era ?? "");
    if (want.twist) q.set("twist", want.twist);
  }
  q.set("factions", String(want.n));
  if (want.seed) q.set("seed", want.seed);
  if (want.crew) q.set("crew", String(want.crew));
  if (want.sheet) q.set("sheet", "1");
  if (want.deck) {
    q.set("deck", "1");
    const D = shown?.deck;
    if (D?.log.length) q.set("a", logText(D.log));
    if (D?.nots.length) q.set("n", String(D.nots.length));
  }
  history[push ? "pushState" : "replaceState"](null, "", `${location.pathname}?${q}`);
  wrote = location.search;
}
let wrote = "";
// A deck's answers in the address: each one's side, how many Not this ones
// came before it and what its prompt got (a suggestion's number, her own
// words, or null when it was skipped), as JSON in base64url.
const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
function logText(log) {
  const rows = log.map((e) => {
    const x = [e.side];
    if (e.nots || e.prompt) x.push(e.nots ?? 0);
    if (e.prompt) x.push(e.prompt.skip ? null : typeof e.prompt.text === "string" ? e.prompt.text : e.prompt.pick);
    return x;
  });
  return b64(JSON.stringify(rows));
}
function logOf(s) {
  if (!s) return [];
  try {
    const rows = JSON.parse(unb64(s));
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 80).map((x) => {
      const row = Array.isArray(x) ? x : [];
      const e = { side: row[0] === 1 ? 1 : 0, nots: Math.max(0, Math.min(999, Math.floor(Number(row[1]) || 0))) };
      if (row.length > 2) e.prompt = typeof row[2] === "string" ? { text: row[2].slice(0, 60) } : Number.isInteger(row[2]) ? { pick: row[2] } : { skip: true };
      return e;
    });
  } catch {
    return [];
  }
}

// ── What's being asked for, as the engine's recipe.
function recipe() {
  if (want.genre === MIX) return { region: want.region, era: want.era, twist: want.twist || null };
  const g = T.genres[want.genre];
  return g ? { region: want.region, era: g.era, twist: g.twist } : null;
}
const dealsAt = (g, region) => canDeal(T, { region, era: g.era, twist: g.twist });
const genreName = (r) => {
  const g = Object.values(T.genres).find((x) => x.era === r.era && x.twist === r.twist);
  const mix = `${T.eras[r.era] ?? r.era}${r.twist ? ` and ${T.twists[r.twist] ?? r.twist}` : ""}`;
  return g ? g.name : mix;
};
// The book's crew and their party sheet, as many as are asked for.
const crewWanted = () =>
  want.crew || want.sheet ? { who: CREW.slice(0, want.crew).map((name) => ({ k: name.toLowerCase(), name })), res: [], assets: want.sheet ? [{ id: "ship", text: "A Ship" }, { id: "safehouses", text: "Safehouses" }] : [] } : null;

// ── The controls.
function drawControls() {
  const none = [];
  for (const input of $$('input[name="how"]')) input.checked = input.value === (want.deck ? "deck" : "all");
  for (const input of $$('input[name="region"]')) {
    const any = Object.keys(T.eras).some((era) => canDeal(T, { region: input.value, era }));
    input.disabled = !any;
    input.checked = input.value === want.region;
    if (!any) none.push(T.regions[input.value]?.name ?? input.value);
  }
  const hint = $("#region-hint");
  hint.hidden = !none.length;
  hint.textContent = none.length === 1 ? `${none[0]} has nothing to deal till its packs are in.` : none.length ? `${none.slice(0, -1).join(", ")} and ${none.at(-1)} have nothing to deal till their packs are in.` : "";
  const genre = $("#genre");
  genre.innerHTML =
    Object.values(T.genres)
      .map((g) => `<option value="${esc(g.id)}"${dealsAt(g, want.region) ? "" : " disabled"}>${esc(g.name)}${dealsAt(g, want.region) ? "" : " (not in yet)"}</option>`)
      .join("") + `<option value="${MIX}">Mix your own</option>`;
  // A genre that doesn't deal at the region gives way to one that does. Where
  // nothing deals at all it stays as it is, so the next region deals it.
  const anyHere = Object.keys(T.eras).some((era) => canDeal(T, { region: want.region, era }));
  if (want.genre !== MIX && !(T.genres[want.genre] && dealsAt(T.genres[want.genre], want.region))) {
    want.genre = Object.values(T.genres).find((g) => dealsAt(g, want.region))?.id ?? (anyHere ? MIX : T.genres[want.genre] ? want.genre : "medieval");
  }
  genre.value = want.genre;
  const mix = want.genre === MIX;
  $("#mix").hidden = !mix;
  if (mix) {
    if (!want.era || !canDeal(T, { region: want.region, era: want.era })) want.era = Object.keys(T.eras).find((era) => canDeal(T, { region: want.region, era })) ?? (T.eras[want.era] ? want.era : Object.keys(T.eras)[0]);
    $("#era").innerHTML = Object.entries(T.eras)
      .map(([id, name]) => `<option value="${esc(id)}"${canDeal(T, { region: want.region, era: id }) ? "" : " disabled"}>${esc(name)}${canDeal(T, { region: want.region, era: id }) ? "" : " (not in yet)"}</option>`)
      .join("");
    $("#era").value = want.era;
    $("#twist").innerHTML =
      `<option value="">No twist</option>` +
      Object.entries(T.twists)
        .map(([id, name]) => `<option value="${esc(id)}"${canDeal(T, { region: want.region, era: want.era, twist: id }) ? "" : " disabled"}>${esc(name)}${canDeal(T, { region: want.region, era: want.era, twist: id }) ? "" : " (not in yet)"}</option>`)
        .join("");
    if (want.twist && !canDeal(T, { region: want.region, era: want.era, twist: want.twist })) want.twist = null;
    $("#twist").value = want.twist ?? "";
  }
  $("#count").value = String(want.n);
  $("#count").textContent = String(want.n);
  $$(".dl-step button[data-n]").forEach((b) => (b.disabled = (b.dataset.n === "-1" && want.n <= 4) || (b.dataset.n === "1" && want.n >= 12)));
  $("#crew").value = String(want.crew);
  $("#crew").textContent = String(want.crew);
  $$(".dl-step button[data-c]").forEach((b) => (b.disabled = (b.dataset.c === "-1" && want.crew <= 0) || (b.dataset.c === "1" && want.crew >= CREW.length)));
  $("#sheet").checked = want.sheet;
  drawButton();
}
function drawButton() {
  const r = recipe();
  const ok = Boolean(r && canDeal(T, r));
  const typed = $("#seed").value.trim();
  const button = $("#deal");
  button.disabled = !ok;
  const deck = want.deck && shown?.deck;
  button.textContent = typed && typed !== shown?.seed ? "Deal this seed" : want.deck ? (deck ? "New deck" : "Deal a deck") : shown && !shown.deck ? "Deal another" : "Deal";
}

// ── A board, drawn, a part at a time, so a deck draws the same parts.
const why = (p) => (p?.why ? `<span class="why">${esc(p.why)}</span>` : "");
const chips = (items) => `<ul class="dl-chips">${items.join("")}</ul>`;
const factionLink = (C, j) => (C.factions[j] ? `<a href="#f-${j}">${esc(C.factions[j].name)}</a>` : "someone");
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");

function headOf(W) {
  const reg = T.regions[W.recipe.region];
  const dial = (k) => {
    const v = W.dials[k];
    return `<li><span>${esc(DIAL_NAMES[k])}</span><span class="dl-pips" role="img" aria-label="${esc(`${DIAL_NAMES[k]}: ${v} of 2`)}">${[0, 1].map((x) => `<i${x < v ? ' class="on"' : ""}></i>`).join("")}</span></li>`;
  };
  return `
    <header class="dl-world-head card">
      <p class="dl-seed"><span class="sr">Seed </span>${W.seed.split("-").map((w) => `<b>${esc(w)}</b>`).join('<i aria-hidden="true">·</i>')}</p>
      <p class="dl-recipe">${esc(reg.name)} · ${esc(genreName(W.recipe))} · ${W.n} factions on ${W.s} seats</p>
      <ul class="dl-dials" aria-label="The dials, set by the asking">${Object.keys(DIAL_NAMES).map(dial).join("")}</ul>
      <button type="button" class="button dl-copy" data-copy>Copy the link</button>
    </header>`;
}
const askingOf = (W) => `
    <section class="dl-sec" aria-labelledby="h-asking">
      <h2 id="h-asking">The asking</h2>
      <dl class="dl-ask">${QUESTIONS.map(([q, label]) => `<div><dt>${esc(label)}</dt><dd>${esc(W.asking[q]?.text ?? "")}</dd></div>`).join("")}</dl>
      <div class="dl-tension">${die(12, { own: "them", face: W.tension?.roll ?? "", label: `The tension, a d12 that came up ${W.tension?.roll}` })}<p><span>What’s pulling it apart</span>${esc(W.tension?.text ?? "")}</p></div>
    </section>`;
// The ground, with whoever holds each seat linked: to its card on a board,
// or its tile while a deck's still forming it.
const groundOf = (W, C, held) => `
    <section class="dl-sec" aria-labelledby="h-ground">
      <h2 id="h-ground">The ground</h2>
      <ol class="dl-seats">${C.seats
        .map(
          (s) => `<li id="s-${s.k}"${W.seats[s.k]?.strange ? ' class="strange"' : ""}>
            <p class="dl-seatname"><b>${esc(s.name)}</b><span class="dl-keep">${esc(s.role)}</span></p>
            <p class="dl-notice">${esc(s.notice)}</p>
            <p class="dl-held">${s.held >= 0 ? `Held by ${held(s.held)}` : "Nobody holds it yet"}</p>
          </li>`,
        )
        .join("")}</ol>
    </section>`;
function factionsOf(W, C) {
  const reg = T.regions[W.recipe.region];
  const seat = (k) => C.seats.find((s) => s.k === k);
  return `<section class="dl-sec" aria-labelledby="h-factions"><h2 id="h-factions">The factions</h2><div class="dl-factions">${C.factions.map((f, i) => drawFaction(W, C, f, i, reg, seat)).join("")}</div></section>`;
}
// The mini factions the deck's answers made, each a short card with what
// it does and its Loyalty thread toward the faction that made it.
const OUTCOMES = { destroy: "Destroy", undermine: "Undermine", obstruct: "Obstruct", influence: "Influence", acquire: "Acquire", establish: "Establish" };
function minisOf(C) {
  if (!C.minis?.length) return "";
  const card = (m, k) => `
    <article class="dl-fac dl-mini card" id="m-${k}" aria-labelledby="mn-${k}">
      <header class="dl-fac-head">
        <div>
          <h3 id="mn-${k}">${esc(m.name)}</h3>
          <p class="dl-size">Made by ${factionLink(C, m.parent)} · ${m.steps} ${m.steps === 1 ? "step" : "steps"}</p>
        </div>
        ${die(m.die, { own: "them", label: `Power d${m.die}` })}
      </header>
      <dl class="dl-lines">
        <div><dt>What it does</dt><dd>${esc(list(m.outs.map((o) => OUTCOMES[o] ?? o)))}</dd></div>
        <div><dt>Resources</dt><dd>${chips(m.res.map((r) => `<li class="dl-chip">${esc(r.text)}</li>`))}</dd></div>
        <div><dt>Assets</dt><dd>${chips(m.assets.map((a) => `<li class="dl-chip${a.power ? " people" : ""}"><span class="dl-chipname">${esc(a.text)}${a.power ? `<span class="dl-plus">+1 Power</span>` : ""}</span>${!a.power && a.does ? `<span class="dl-does">${esc(a.does)}</span>` : ""}</li>`))}</dd></div>
        ${m.loy.length ? `<div><dt>Threads</dt><dd><ul class="dl-threads">${m.loy.map((t) => `<li class="bond"><span class="dl-to">Loyalty toward ${factionLink(C, m.parent)}</span><em>${esc(t.text)}</em></li>`).join("")}</ul></dd></div>` : ""}
      </dl>
    </article>`;
  return `<section class="dl-sec" aria-labelledby="h-minis"><h2 id="h-minis">Mini factions</h2><div class="dl-factions">${C.minis.map(card).join("")}</div></section>`;
}
// The crew: each character's friend and foe, and what's worth taking off them.
function crewOf(W, C) {
  if (!W.crew) return "";
  const side = (c, k) => {
    const p = c[k];
    const t = p ? C.factions[p.j]?.threads.find((x) => x.tie === `c:${c.k}:${k}`) : null;
    return t ? `<li class="${k === "foe" ? "hostile" : "bond"}"><span class="dl-to">A ${k} in ${factionLink(C, p.j)}</span><em>${esc(t.text)}</em>${why(p)}</li>` : "";
  };
  return `<section class="dl-sec" aria-labelledby="h-crew"><h2 id="h-crew">The crew</h2>
      ${W.crew.who.length ? `<div class="dl-crew">${W.crew.who.map((c) => `<div class="dl-who card"><h3>${esc(c.name)}</h3><ul class="dl-threads">${side(c, "friend")}${side(c, "foe")}</ul></div>`).join("")}</div>` : ""}
      <p class="dl-tnote">${W.crew.things.length ? `Worth taking off them: ${esc(W.crew.things.map((x) => x.text).join(", "))}.` : "Nothing on their party sheet worth taking yet."}</p></section>`;
}
function checksOf(W) {
  const failed = (W.checks ?? []).filter((c) => !c.ok).map((c) => CHECK_NAMES[c.k] ?? c.k);
  const fixed = [...new Set(W.fixes.map((f) => CHECK_NAMES[f.k] ?? f.k))];
  const line = failed.length
    ? `Still failing: ${failed.join(", ")}.`
    : `Every check passed${fixed.length ? `, with ${fixed.join(" and ")} dealt again` : ""}${W.fallbacks.length ? `, and a fallback from core for ${W.fallbacks.join(", ")}` : ""}.`;
  return `<p class="dl-checks">${esc(line)}</p>`;
}
function drawBoard(W) {
  const C = cardsOf(T, W);
  $("#board").innerHTML = `<article class="dl-world">${headOf(W)}${askingOf(W)}${groundOf(W, C, (j) => factionLink(C, j))}${factionsOf(W, C)}${crewOf(W, C)}${checksOf(W)}</article>`;
}

function drawFaction(W, C, f, i, reg, seat) {
  const w = W.factions[i];
  const s = seat(f.seat);
  const extra = f.res.length - f.assets.filter((a) => !a.off).length;
  const res = f.res.map((r, k) => `<li class="dl-chip">${esc(r.text)}${why(w.res?.[k])}</li>`);
  const assets = f.assets.map((a, k) => {
    const pick = a.off ? null : w.assets?.[k];
    const cls = a.off ? "dl-chip need" : a.power ? "dl-chip people" : "dl-chip";
    const note = a.off ? `<span class="dl-note">a need, with nothing paying for it</span>` : a.power ? `<span class="dl-plus">+1 Power</span>` : "";
    return `<li class="${cls}"><span class="dl-chipname">${esc(a.text)}${note}</span>${!a.power && a.does ? `<span class="dl-does">${esc(a.does)}</span>` : ""}${why(pick)}</li>`;
  });
  const ag = f.agendas[0];
  const lines = [
    ["Want", `${esc(f.want)}${why(w.want)}`],
    ["Resources", `${chips(res)}${extra > 0 ? `<p class="dl-extra">${extra} extra, with nothing to pay for</p>` : ""}`],
    ["Assets", chips(assets)],
    ["Agenda", ag ? `<p class="dl-agenda">${die(ag.die, { own: "them", label: `at d${ag.die}` })}<span>${esc(ag.text)}</span></p>${why(w.agenda)}` : ""],
    ["Face", `<p>${esc(f.face)}, Challenge ${f.ch}</p>${f.threat?.tags?.length ? `<p class="dl-tags">${f.threat.tags.map((t) => `<span class="zd-tag threat"><em>${esc(t.text)}</em></span>`).join("")}</p>` : ""}`],
    ["Secret", `<div class="dl-secret"><p><em>${esc(f.secret)}</em></p><p>${esc(f.more)}</p></div>${why(w.secret)}`],
  ];
  if (f.offers.length) lines.push(["Could start with", `<ul class="dl-offers">${f.offers.map((o) => `<li class="${o.kind}">${esc(BOND_NAMES[o.bond])}, ${o.kind === "hostile" ? "hostile" : "bond"}: <em>${esc(o.text)}</em></li>`).join("")}</ul>`]);
  if (f.threads.length) lines.push(["Threads", `<ul class="dl-threads">${f.threads.map((t) => `<li class="${t.kind}"><span class="dl-to">${t.kind === "hostile" ? "Hostile" : "Bond"} toward ${t.to === "crew" ? "the crew" : factionLink(C, t.to)}</span><em>${esc(t.text)}</em></li>`).join("")}</ul>`]);
  return `
    <article class="dl-fac card${w.type?.strange ? " strange" : ""}" id="f-${i}" aria-labelledby="fn-${i}">
      <header class="dl-fac-head">
        <div>
          <h3 id="fn-${i}">${esc(f.name)}</h3>
          <p class="dl-size">${esc(cap(f.size))}, ${esc(reg.sizes[f.size] ?? "")} · ${f.steps} ${f.steps === 1 ? "step" : "steps"}${s ? ` · on <a href="#s-${s.k}">${esc(s.name)}</a>` : ""}</p>
        </div>
        ${die(f.die, { own: "them", label: `Power d${f.die}` })}
      </header>
      <p class="dl-about">${esc([f.about, f.sits].filter(Boolean).join(" "))}${why(w.type)}</p>
      ${f.exception ? `<p class="dl-break"><b>Breaks the logic</b> ${esc(f.exception.text)}, ${esc(f.exception.reason)}.</p>` : ""}
      <dl class="dl-lines">${lines.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </article>`;
}
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);

// ── Dealing.
// The board says why there's nothing on it, and a screen reader hears a
// line about the deal rather than the whole board again.
const say = (line) => ($("#dealt").textContent = line);
function nothing(r) {
  const reg = T.regions[want.region]?.name ?? want.region;
  const line = !r ? "Pick a genre to deal." : Object.keys(T.eras).some((era) => canDeal(T, { region: r.region, era })) ? `Nothing deals at ${reg} for ${genreName(r)} till its packs are in.` : `Nothing deals at ${reg} till its packs are in.`;
  $("#board").innerHTML = `<p class="dl-wait">${esc(line)}</p>`;
  say(line);
  drawButton();
}
function seedFor(fresh) {
  const typed = $("#seed").value.trim();
  return typed && typed !== shown?.seed ? typed : fresh || !want.seed ? newSeed(T) : want.seed;
}
function deal({ fresh = true } = {}) {
  const r = recipe();
  if (!r || !canDeal(T, r)) return nothing(r);
  const seed = seedFor(fresh);
  try {
    const W = dealWorld(T, { recipe: r, seed, factions: want.n, crew: crewWanted() });
    want.seed = W.seed;
    shown = W;
    $("#seed").value = W.seed;
    writeAddress();
    drawBoard(W);
    say(`Dealt ${W.seed}: ${genreName(r)} at ${T.regions[r.region].name}, ${want.n} factions${want.crew ? `, and a crew of ${want.crew}` : ""}.`);
  } catch (err) {
    $("#board").innerHTML = `<p class="dl-wait">That one wouldn’t deal: ${esc(err.message)}</p>`;
    say("That one wouldn’t deal.");
  }
  drawButton();
}
const redeal = (opts) => (want.deck ? dealDeck(opts) : deal(opts));

// ── A deck: the ground dealt, then the deck answered a card at a time.
// A new deck over one with answers goes into the browser's history, so Back
// brings the old one back.
function dealDeck({ fresh = true, log = [], nots = 0, back = false } = {}) {
  const r = recipe();
  if (!r || !canDeal(T, r)) return nothing(r);
  const seed = seedFor(fresh);
  const push = !back && Boolean(shown?.deck?.log.length);
  try {
    const W0 = startDeck(T, start(T, { recipe: r, seed, factions: want.n, crew: crewWanted() }));
    const W = log.length ? replay(T, W0.deck.base, log) : W0;
    for (let x = 0; x < nots && !W.deck.open; x++) notThis(T, W);
    settle(W);
    want.seed = W.seed;
    shown = W;
    $("#seed").value = W.seed;
    writeAddress({ push });
    drawDeck(W, { moved: !back && fresh });
    say(`A deck for ${W.seed}: ${genreName(r)} at ${T.regions[r.region].name}, ${want.n} factions${want.crew ? `, and a crew of ${want.crew}` : ""}.`);
  } catch (err) {
    $("#board").innerHTML = `<p class="dl-wait">That one wouldn’t deal: ${esc(err.message)}</p>`;
    say("That one wouldn’t deal.");
  }
  drawButton();
}
// Once there's no card up and no prompt waiting, the deck's run out, and the
// end deals the rest round what the answers made, once.
function settle(W) {
  if (!W.checks && !prompted(W) && !current(T, W)) finish(T, W);
  return W;
}
// A tap on the deck: the world after it, the address, the deck drawn again,
// and a line for a screen reader.
function move(kind, fn) {
  const W = fn();
  shown = settle(W && W.deck ? W : shown);
  writeAddress();
  drawDeck(shown, { moved: true });
  const D = shown.deck;
  const o = prompted(shown);
  if (shown.checks) say(`That’s the deck: ${D.cards.length} cards, and the board’s dealt.`);
  else if (o) say(o.ask);
  else if (kind === "not") say("Another card for the same thing.");
  else if (kind === "undo") say("Taken back.");
  else if (D.cards.length) say(playedOf(T, shown, D.cards.length - 1)?.line ?? "");
  drawButton();
}

function drawDeck(W, { moved = false } = {}) {
  const D = W.deck;
  const done = Boolean(W.checks);
  const C = cardsOf(T, W);
  const F = formedOf(T, W);
  const o = done ? null : prompted(W);
  const c = done || o ? null : current(T, W);
  const card = o ? D.cards[o.pos] : c;
  const on = card ? { a: card.a, b: card.b } : {};
  const held = (j) => (done ? factionLink(C, j) : `<a href="#t-${j}">${esc(cap(calledOf(T, W, j)))}</a>`);

  // What the last answer did, above the card that's up, or what to do first.
  const before = o ? o.pos - 1 : D.cards.length - 1;
  const last = before >= 0 ? playedOf(T, W, before) : null;
  const did = last
    ? `<div class="dl-did"><span>What card ${last.pos + 1} did</span><p>${esc(last.line)}</p></div>`
    : `<div class="dl-did first"><span>The first card</span><p>Tap an answer. Each one forms the factions on the card and writes a line of how it came to be.</p></div>`;
  const up = done ? endCard(W) : o ? promptCard(W, o) : c ? momentCard(c) : "";
  const moves = done
    ? `<div class="dl-moves one"><button type="button" class="button" data-undo${D.log.length ? "" : " disabled"}>Undo the last answer</button></div>`
    : `<div class="dl-moves">
        <button type="button" class="button" data-not${!c || c.chain ? " disabled" : ""}>Not this one</button>
        <button type="button" class="button" data-undo${D.log.length ? "" : " disabled"}>Undo</button>
      </div>
      ${c?.chain ? `<p class="dl-hint">It follows on from card ${c.from + 1}, so it can’t be passed over.</p>` : ""}
      <button type="button" class="button dl-rest" data-rest>Answer the rest at random</button>`;
  const play = `<section class="dl-play" aria-labelledby="h-play">
      <h2 class="sr" id="h-play">The deck</h2>
      ${agesOf(F, done)}
      ${did}
      ${up}
      ${moves}
    </section>`;
  const tiles = done
    ? ""
    : `<section class="dl-sec" aria-labelledby="h-tiles"><h2 id="h-tiles">The factions</h2>
      <ul class="dl-tiles">${F.factions.map((f) => tileOf(f, on, F.age)).join("")}</ul></section>`;
  // How it came to be, by age, bar the card whose prompt's still waiting.
  const H = historyOf(T, W).filter((h) => !o || h.pos !== o.pos);
  const lines = H.length
    ? AGES.filter((a) => H.some((h) => h.age === a))
        .map((a) => `<h3>${AGE_NAMES[a]}</h3><ol class="dl-hist">${H.filter((h) => h.age === a).map((h) => `<li><span class="dl-hnum"><span class="sr">Card </span>${h.pos + 1}</span><span>${esc(h.text)}</span></li>`).join("")}</ol>`)
        .join("")
    : `<p class="dl-tnote">Nothing yet. Every answer writes a line here.</p>`;
  const story = `<section class="dl-sec dl-history" aria-labelledby="h-history"><h2 id="h-history">How it came to be</h2>${lines}</section>`;
  $("#board").innerHTML = `<article class="dl-world dl-deck">${headOf(W)}<div class="dl-top">${play}${tiles}</div>${story}${askingOf(W)}${groundOf(W, C, held)}${done ? `${factionsOf(W, C)}${minisOf(C)}${crewOf(W, C)}${checksOf(W)}` : ""}</article>`;
  if (moved) bring();
}
// The three ages, the one that's on filled as far as its parts are formed.
function agesOf(F, done) {
  const need = F.factions.length * PARTS[F.age].length;
  const left = F.factions.reduce((n, f) => n + f.left.filter((p) => PARTS[F.age].includes(p)).length, 0);
  const p = need ? 1 - left / need : 1;
  return `<ol class="dl-ages" aria-label="The ages">${AGES.map((a) => {
    const state = done || a < F.age ? "past" : a === F.age ? "now" : "later";
    const fill = state === "past" ? 1 : state === "now" ? p : 0;
    return `<li class="${state}"${state === "now" ? ' aria-current="step"' : ""} style="--p:${fill.toFixed(3)}">${AGE_NAMES[a]}</li>`;
  }).join("")}</ol>`;
}
function momentCard(c) {
  const flags = [c.chain ? `Follows on from card ${c.from + 1}` : "", c.last ? "The last card" : ""].filter(Boolean);
  return `<div class="dl-card card${c.strange ? " strange" : ""}" id="up" tabindex="-1" aria-labelledby="up-who up-says">
      <p class="dl-cardtop"><span>Card ${c.pos + 1}</span>${flags.map((x) => `<span>${esc(x)}</span>`).join("")}${c.strange ? '<span class="odd">Strange</span>' : ""}</p>
      <p class="dl-speaker" id="up-who">${esc(c.speaker)}</p>
      <p class="dl-says" id="up-says">“${esc(c.text)}”</p>
      <div class="dl-answers">${c.answers.map((a, k) => `<button type="button" class="button dl-ans" data-side="${k}">${esc(a.text)}</button>`).join("")}</div>
    </div>`;
}
// A prompt: the card it came off, its question, three suggestions, her own
// words, or skipped. A skipped name's dealt at the end, and anything else
// skipped is the first suggestion.
function promptCard(W, o) {
  const p = playedOf(T, W, o.pos);
  const skip = o.kind === "name" ? "Skip it and a name’s dealt at the end." : "Skip it and the first one goes in.";
  return `<div class="dl-card dl-prompt card" id="up" tabindex="-1" aria-labelledby="up-ask">
      <p class="dl-cardtop"><span>Card ${o.pos + 1}</span><span>Then</span></p>
      ${p ? `<p class="dl-recap">${esc(p.speaker)}: “${esc(p.text)}” <b>${esc(p.answer)}.</b></p>` : ""}
      <p class="dl-q" id="up-ask">${esc(o.ask)}</p>
      ${o.ideas.length ? `<div class="dl-ideas">${o.ideas.map((x, k) => `<button type="button" class="button dl-idea" data-pick="${k}">${esc(cap(x.text))}</button>`).join("")}</div>` : ""}
      <form class="dl-own" data-own autocomplete="off">
        <label class="dl-field"><span>Or your own</span><input name="own" type="text" maxlength="60" spellcheck="true" /></label>
        <button type="submit" class="button">Use it</button>
      </form>
      <div class="dl-skiprow"><button type="button" class="button dl-skip" data-skip>Skip it</button><p class="dl-hint">${skip}</p></div>
    </div>`;
}
function endCard(W) {
  const n = W.deck.cards.length;
  return `<div class="dl-card dl-end card" id="up" tabindex="-1" aria-labelledby="up-end">
      <p class="dl-cardtop"><span>${n} ${n === 1 ? "card" : "cards"}</span></p>
      <p class="dl-q" id="up-end">That’s the deck.</p>
      <p>Whatever the answers left open is dealt to fit what they made, and the board’s below.</p>
      <div class="dl-jump"><a class="button" href="#h-history">How it came to be</a><a class="button" href="#h-factions">The factions</a></div>
    </div>`;
}
// A faction's tile: what it's called, and a mark for each part that's
// formed, by age, with the age that's on brightest.
function tileOf(f, on, age) {
  const role = on.a === f.i ? "Brings it" : on.b === f.i ? "About them" : "";
  const groups = AGES.map((a) => `<span class="dl-tage${a === age ? " now" : ""}">${PARTS[a].map((p) => `<i${f.parts[p] != null ? ' class="on"' : ""}></i>`).join("")}</span>`).join("");
  const got = AGES.flatMap((a) => PARTS[a]).filter((p) => f.parts[p] != null).map((p) => PART_NAMES[p]);
  const left = f.left.map((p) => PART_NAMES[p]);
  const sr = `${got.length ? `Formed: ${list(got)}.` : "Nothing formed yet."}${left.length ? ` Still to come: ${list(left)}.` : ""}`;
  return `<li class="dl-tile${role ? " on" : ""}" id="t-${f.i}">
      <p class="dl-tname">${esc(cap(f.name))}</p>
      <p class="dl-tparts"><span class="dl-tmarks" aria-hidden="true">${groups}</span><span class="sr">${esc(sr)}</span></p>
      ${role ? `<p class="dl-trole">${role}</p>` : ""}
    </li>`;
}
// After a tap, the card that's up comes back into view if it's gone off the
// screen, and takes the focus, so a keyboard or a screen reader's on it.
function bring() {
  const play = $(".dl-play");
  const up = $("#up");
  if (!play || !up) return;
  const top = $(".topbar")?.getBoundingClientRect().bottom ?? 0;
  const bar = $("#bar").hidden ? 0 : $("#bar").getBoundingClientRect().height;
  const box = up.getBoundingClientRect();
  if (play.getBoundingClientRect().top < top || box.bottom > innerHeight - bar) {
    play.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  up.focus({ preventScroll: true });
}

// ── Every table, read once, the first time the tab opens.
// A twist's row written for some of its eras: Medieval only.
const erasSay = (eras) => `${list(eras.map((x) => T.eras[x] ?? x))} only`;
const meta = (r, { role = true } = {}) => {
  const bits = [];
  if (role && r.role) bits.push(T.book.assets[r.role]?.name ?? T.types[r.role] ?? r.role);
  if (r.regions) bits.push(r.regions.map((x) => T.regions[x]?.name ?? x).join(", "));
  if (r.eras) bits.push(erasSay(r.eras));
  if (r.sizes) bits.push(r.sizes.join(", "));
  if (r.tags?.length) bits.push(r.tags.join(", "));
  if (r.needs?.length) bits.push(`needs ${r.needs.join(" and ")}`);
  if (r.out?.length) bits.push(`never with ${r.out.join(", ")}`);
  if (r.leans?.length) bits.push(`leans to ${r.leans.map((l) => T.book.assets[l]?.name ?? l).join(", ")}`);
  if (r.faces?.length) {
    const who = r.faces.map((x) => (T.book.threats.find((t) => t.key === x)?.name ?? x).toLowerCase());
    bits.push(`its Face is ${who.length > 1 ? `${who.slice(0, -1).join(", ")} or ${who.at(-1)}` : who[0]}`);
  }
  if (r.die) bits.push(`d${r.die}`);
  if (r.dials && Object.keys(r.dials).length) bits.push(Object.entries(r.dials).map(([k, v]) => `${v > 0 ? "more" : "less"} ${k}`).join(", "));
  if (r.w === 1) bits.push("rare");
  if (r.strange) bits.push("strange");
  return bits.length ? `<span class="dl-meta">${esc(bits.join(" · "))}</span>` : "";
};
const row = (words, r, sub = "", opts) => `<li><span class="dl-w">${esc(words)}</span>${r ? meta(r, opts) : ""}${sub ? `<span class="dl-sub">${sub}</span>` : ""}</li>`;
const table = (title, items, { open = false, note = "", cls = "", count = items.filter((x) => !x.includes("dl-group")).length } = {}) =>
  `<details class="dl-table"${open ? " open" : ""}><summary><span>${esc(title)}</span><span class="dl-count" data-of="${count}">${count}</span></summary>${note ? `<p class="dl-tnote">${esc(note)}</p>` : ""}<ul class="dl-rows${cls ? ` ${cls}` : ""}">${items.join("")}</ul></details>`;
const byRole = (rows, names) => {
  const out = new Map();
  for (const r of rows) out.set(r.role, [...(out.get(r.role) ?? []), r]);
  return [...out.entries()].map(([role, list]) => ({ role, name: names(role), list }));
};
// A moment, the way its YAML says it: who's on it, then each answer with its
// line of history and what it does, written the way the table writes it.
const kindsOf = (ks) => list(ks.map((k) => (T.types[k] ?? k).replace(/^(a|an)\s+/i, "")));
const fxOf = (f) => [f.k, f.what, f.on, f.from, f.to, ...(f.outs ?? []), ...(f.tags ?? [])].filter((x) => x != null).join(" ");
function momentRow(m) {
  const bits = [];
  if (m.a) bits.push(`brought by ${kindsOf(m.a)}`);
  if (m.seat) bits.push("about a seat nobody holds");
  else if (m.b) bits.push(`about ${kindsOf(m.b)}`);
  for (const t of ["res", "asset", "people"]) if (m[t]) bits.push(`{${t}} is ${m[t] === "seat" ? "the seat’s" : `${m[t]}’s`}`);
  if (m.person) bits.push("names someone");
  if (m.crew) bits.push("one of the crew");
  if (m.chain) bits.push(`follows on, as ${m.key}`);
  else if (m.key) bits.push(`key ${m.key}`);
  if (m.last) bits.push("a last card");
  if (m.regions) bits.push(m.regions.map((x) => T.regions[x]?.name ?? x).join(", "));
  if (m.eras) bits.push(erasSay(m.eras));
  if (m.tags?.length) bits.push(m.tags.join(", "));
  if (m.needs?.length) bits.push(`needs ${m.needs.join(" and ")}`);
  if (m.out?.length) bits.push(`never with ${m.out.join(", ")}`);
  if (m.w === 1) bits.push("rare");
  if (m.strange) bits.push("strange");
  const answers = m.answers
    .map((a) => {
      const more = [
        a.does.map(fxOf).join(", "),
        a.tags?.length ? `tags ${a.tags.join(", ")}` : "",
        a.thread ? `thread: ${a.thread}` : "",
        a.back ? `back: ${a.back}` : "",
        a.prompt ? `asks: ${a.prompt.ask}${a.prompt.ideas ? ` (${a.prompt.ideas.join(", ")})` : ""}` : "",
        a.then ? `then ${a.then}` : "",
      ].filter(Boolean);
      return `<span class="dl-sub dl-answer"><b>${esc(a.text)}</b> ${esc(a.line)}<span class="dl-meta">${esc(more.join(" · "))}</span></span>`;
    })
    .join("");
  return `<li><span class="dl-w">${esc(m.text)}</span>${bits.length ? `<span class="dl-meta">${esc(bits.join(" · "))}</span>` : ""}${answers}</li>`;
}
const deckTable = (moments, note) =>
  table(
    "The deck",
    AGES.flatMap((a) => {
      const these = moments.filter((m) => m.age === a);
      return these.length ? [`<li class="dl-group">${esc(AGE_NAMES[a])}</li>`, ...these.map(momentRow)] : [];
    }),
    { note },
  );

function drawTables() {
  const core = T.core;
  const parts = [];
  parts.push(`</section><section class="dl-partsec"><h2 class="dl-part">The core</h2><p class="dl-tnote">Everything that isn’t genre, the same on every board. The wants, how it works, the Secrets, the agendas and the tension are Building a Faction’s and Building Your World’s own rows.</p>`);
  parts.push(table("Seed words", core.seeds.map((w) => `<li>${esc(w)}</li>`), { cls: "dl-seeds" }));
  parts.push(table("Keeps", Object.entries(T.keeps).map(([k, v]) => row(k, null, esc(v)))));
  parts.push(table("Kinds of faction", Object.entries(T.types).map(([k, v]) => row(v, null, esc(k)))));
  parts.push(table("Sizes", Object.entries(core.sizes).map(([k, v]) => row(cap(k), null, `comes up ${v} in ${Object.values(core.sizes).reduce((a, b) => a + b, 0)}`))));
  parts.push(table("How a card reads", [...Object.entries(core.templates).map(([k, v]) => row(v, null, esc(k))), ...Object.entries(core.because).map(([k, v]) => row(v || "(says nothing, since it’s obvious)", null, esc(`because, for ${k}`)))]));
  parts.push(table("What it wants", core.wants.map((r) => row(r.text, r, r.offers?.length ? esc(r.offers.map((o) => `could start with ${BOND_NAMES[o.bond]}, ${o.kind}: ${o.text}`).join(" · ")) : ""))));
  parts.push(table("How it works", core.methods.map((r) => row(r.text, r))));
  parts.push(table("Secrets", core.secrets.map((r) => row(r.tag, r, esc([r.more, `Ways in: ${r.ways.join(", or ")}`].filter(Boolean).join(" "))))));
  parts.push(table("Agendas", core.agendas.map((r) => row(r.text, r))));
  for (const [q, label] of QUESTIONS) parts.push(table(`The asking: ${label}`, core.asking[q].map((r) => row(r.text, r))));
  parts.push(table("The tension (d12)", core.tension.map((r, k) => row(`${k + 1}. ${r.text}`, r))));
  const KINDS = { rival: "Rivals", ally: "Allies", debt: "Debts", wildcard: "Wildcards", blocked: "Blocked trades" };
  parts.push(table("Ties between factions", core.ties.map((r) => row(r.text, null, esc([`${KINDS[r.kind] ?? r.kind}${r.bond ? `, ${r.bond}` : ""}`, r.back ? `back: ${r.back}` : ""].filter(Boolean).join(" · "))))));
  if (core.crew) {
    parts.push(table("The crew: a friend", core.crew.friends.map((r) => row(r.text, r)), { note: "A character’s friend: that faction’s bond thread toward the crew, named for them." }));
    parts.push(table("The crew: a foe", core.crew.foes.map((r) => row(r.text, r)), { note: "A character’s foe: that faction’s hostile thread toward the crew, named for them." }));
    parts.push(table("The crew: what nobody’s after", core.crew.qualities.map((k) => row(T.book.assets[k]?.name ?? k, null, "what the crew’s like, not something it’s got")), { note: "A faction can want something on the party sheet, but never these, or people who turn up, or the new crew’s card." }));
  }
  if (core.deck?.length) parts.push(deckTable(core.deck, "The moments Answer a deck deals, a card at a time: someone from one faction ({a}) about another ({b}) or a seat nobody holds, with two answers, each with its line of history and what it does."));
  if (core.loyal?.length) parts.push(table("A mini faction’s Loyalty", core.loyal.map((r) => row(r.text, null)), { note: "A mini faction an answer makes: its Loyalty thread toward the faction that made it ({b})." }));
  if (core.founding) {
    parts.push(table("The founding: who had the seat before", core.founding.before.map((r) => row(r.text, r)), { note: "A founder’s first question, in the founding: the hostile thread whoever had its seat holds toward the newcomers ({b}), about that seat ({seat}). A founder’s called the newcomers till it’s named." }));
    parts.push(table("The founding: who they owe", core.founding.owes.map((r) => row(r.text, r)), { note: "The second: the newcomers’ bond thread toward whoever they owe ({b}), saying what’s owed." }));
    parts.push(table("The founding: what they’ll never do", core.founding.never.map((r) => row(r.text, r)), { note: "The third: a bond thread on their own Loyalty, a promise their people hold them to." }));
  }
  parts.push(table("Faces", Object.entries(core.faces).map(([k, v]) => row(T.types[k] ?? k, null, esc(v.map((x) => T.book.threats.find((t) => t.key === x)?.name ?? x).join(", "))))));
  parts.push(table("Fallbacks", Object.entries(core.fallbacks).map(([k, r]) => row(r.tag || r.text, r, esc(`when ${k} still fails`)))));

  parts.push(`</section><section class="dl-partsec"><h2 class="dl-part">The regions</h2>`);
  for (const reg of Object.values(T.regions)) {
    parts.push(
      table(reg.name, [
        row("A faction", null, esc(reg.faction)),
        row("A seat", null, esc(reg.seat)),
        row("A mini faction", null, esc(reg.mini)),
        row("The sizes", null, esc(Object.entries(reg.sizes).map(([k, v]) => `${k}: ${v}`).join(" · "))),
        row("The d6 for the founding", null, esc(reg.d6.map((x, k) => `${k + 1} ${x}`).join(" · "))),
        row("Pressure from one size up", null, esc(reg.pressure)),
      ]),
    );
  }
  parts.push(`</section><section class="dl-partsec"><h2 class="dl-part">The genres</h2>`);
  parts.push(
    table(
      "Genres",
      Object.values(T.genres).map((g) => {
        const at = REGIONS.filter((x) => dealsAt(g, x)).map((x) => T.regions[x].name);
        return row(g.name, null, esc(`${T.eras[g.era]}${g.twist ? ` and ${T.twists[g.twist]}` : ""} · ${at.length ? `deals at ${at.join(", ")}` : "waiting on its packs"}`));
      }),
      { open: true },
    ),
  );
  const frames = Object.entries(T.frames ?? {});
  const setDials = (f) => Object.entries(f.dials ?? {}).map(([k, v]) => `${DIAL_NAMES[k] ?? k} ${v} of 2`);
  if (frames.length) parts.push(table("The book’s boards", frames.map(([k, f]) => row(f.name ?? k, null, esc([`${genreName(f)} at ${T.regions[f.region]?.name ?? f.region}`, ...setDials(f)].join(" · ") + ", for a faction added to it")))));
  for (const pack of Object.values(T.packs)) {
    const written = pack.eras?.length ? `, written for ${list(pack.eras.map((x) => T.eras[x] ?? x))}` : "";
    parts.push(`</section><section class="dl-partsec"><h2 class="dl-part">${esc(pack.name)}</h2><p class="dl-tnote">${esc(`${pack.kind === "era" ? "An era" : "A twist"}${written}, at ${pack.fits.map((x) => T.regions[x].name).join(", ")}.`)}</p>`);
    for (const region of pack.fits) {
      const seats = pack.seats.filter((r) => !r.regions || r.regions.includes(region));
      parts.push(table(`Seats at ${T.regions[region].name}`, byRole(seats, (k) => k).flatMap((g) => [`<li class="dl-group">${esc(g.name)}</li>`, ...g.list.map((r) => row(r.text, r, esc(r.notice), { role: false }))])));
    }
    parts.push(table("Resources", byRole(pack.resources, (k) => k).flatMap((g) => [`<li class="dl-group">${esc(g.name)}</li>`, ...g.list.map((r) => row(r.text, r, "", { role: false }))])));
    parts.push(table("Assets", byRole(pack.assets, (k) => T.book.assets[k]?.name ?? k).flatMap((g) => [`<li class="dl-group">${esc(g.name)}<small>${esc(T.book.assets[g.role]?.does ?? "")}</small></li>`, ...g.list.map((r) => row(r.text, r, r.does ? esc(r.does) : "", { role: false }))])));
    parts.push(table("Kinds of faction", byRole(pack.types, (k) => T.types[k] ?? k).flatMap((g) => [`<li class="dl-group">${esc(g.name)}</li>`, ...g.list.map((r) => row(r.text, r, "", { role: false }))])));
    if (pack.methods.length) parts.push(table("How it works", pack.methods.map((r) => row(r.text, r))));
    if (pack.wants.length) parts.push(table("What it wants", pack.wants.map((r) => row(r.text, r))));
    if (pack.secrets.length) parts.push(table("Secrets", pack.secrets.map((r) => row(r.tag, r, esc([r.more, `Ways in: ${r.ways.join(", or ")}`].filter(Boolean).join(" "))))));
    if (pack.exceptions.length) parts.push(table("Exceptions", pack.exceptions.map((r) => row(r.text, null, esc(`${r.reason} · when ${r.when.join(" and ")} · won’t ${r.drops.join(", ")}${r.gives?.length ? ` · gives ${r.gives.join(", ")}` : ""}`)))));
    if (pack.deck?.length) parts.push(deckTable(pack.deck, `${pack.name}’s own moments, dealt beside the core’s.`));
    parts.push(table("Faction names", byRole(pack.names.factions, (k) => (k ? T.types[k] ?? k : "Any kind")).flatMap((g) => [`<li class="dl-group">${esc(g.name)}</li>`, ...g.list.map((r) => row(r.text, r, "", { role: false }))])));
    parts.push(table("People’s names", pack.names.people.map((r) => row(r.text, r))));
  }
  $("#tables-body").innerHTML = `${parts.join("").replace(/^<\/section>/, "")}</section>`;
}

// Find a row: every table with one that matches opens, and the rest close,
// till it's cleared and they're back the way they were.
function find(q) {
  const words = q.trim().toLowerCase().replace(/[’']/g, "'");
  let hits = 0;
  for (const d of $$("#tables-body details")) {
    if (words && d.dataset.was == null) d.dataset.was = d.open ? "open" : "";
    if (!words && d.dataset.was != null) {
      d.open = d.dataset.was === "open";
      delete d.dataset.was;
    }
    let mine = 0;
    for (const li of $$(".dl-rows > li", d)) {
      const hit = !words || li.textContent.toLowerCase().replace(/[’']/g, "'").includes(words);
      li.hidden = !hit && !li.classList.contains("dl-group");
      if (hit && !li.classList.contains("dl-group")) mine++;
    }
    for (const g of $$(".dl-rows > li.dl-group", d)) {
      let next = g.nextElementSibling;
      let any = false;
      while (next && !next.classList.contains("dl-group")) {
        if (!next.hidden) any = true;
        next = next.nextElementSibling;
      }
      g.hidden = Boolean(words) && !any;
    }
    const count = $(".dl-count", d);
    count.textContent = words ? `${mine} of ${count.dataset.of}` : count.dataset.of;
    d.hidden = Boolean(words) && !mine;
    if (words) d.open = mine > 0;
    hits += mine;
  }
  for (const part of $$("#tables-body .dl-partsec")) part.hidden = Boolean(words) && !$$("details", part).some((d) => !d.hidden);
  $("#found").textContent = words ? (hits ? `${hits} ${hits === 1 ? "row" : "rows"} with “${q.trim()}”` : `Nothing with “${q.trim()}”`) : "";
}

// ── The tabs.
function show(tab) {
  const tables = tab === "tables";
  $("#tab-boards").setAttribute("aria-selected", String(!tables));
  $("#tab-tables").setAttribute("aria-selected", String(tables));
  $("#tab-boards").tabIndex = tables ? -1 : 0;
  $("#tab-tables").tabIndex = tables ? 0 : -1;
  $("#boards").hidden = tables;
  $("#tables").hidden = !tables;
  $("#bar").hidden = tables;
  if (tables && T && !$("#tables-body").childElementCount) drawTables();
}

// What the address asks for, dealt: a deck plays its answers again.
function fromAddress() {
  drawControls();
  $("#seed").value = want.seed ?? "";
  if (want.deck) dealDeck({ fresh: !want.seed, log: want.seed ? asked.log : [], nots: want.seed ? asked.nots : 0, back: true });
  else deal({ fresh: !want.seed });
}

async function boot() {
  readAddress();
  const tabs = [$("#tab-boards"), $("#tab-tables")];
  tabs.forEach((t, k) => {
    t.addEventListener("click", () => show(k ? "tables" : "boards"));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(k + 1) % 2];
      next.focus();
      show(next === tabs[1] ? "tables" : "boards");
    });
  });
  try {
    const res = await fetch("/world-tables.json");
    if (!res.ok) throw new Error(String(res.status));
    T = await res.json();
  } catch {
    const none = `<p class="dl-wait">There aren’t any tables to deal from yet.</p>`;
    $("#board").innerHTML = none;
    $("#tables-body").innerHTML = none;
    return;
  }
  fromAddress();

  $("#set").addEventListener("change", (e) => {
    if (e.target.name === "how") want.deck = e.target.value === "deck";
    if (e.target.name === "region") want.region = e.target.value;
    if (e.target.id === "genre") want.genre = e.target.value;
    if (e.target.id === "era") want.era = e.target.value;
    if (e.target.id === "twist") want.twist = e.target.value || null;
    if (e.target.id === "sheet") want.sheet = e.target.checked;
    if (e.target.id === "seed") return drawButton();
    drawControls();
    redeal({ fresh: false });
  });
  $("#set").addEventListener("submit", (e) => {
    e.preventDefault();
    redeal({ fresh: true });
  });
  $("#seed").addEventListener("input", drawButton);
  $$(".dl-step button[data-n]").forEach((b) =>
    b.addEventListener("click", () => {
      want.n = Math.max(4, Math.min(12, want.n + Number(b.dataset.n)));
      drawControls();
      redeal({ fresh: false });
    }),
  );
  $$(".dl-step button[data-c]").forEach((b) =>
    b.addEventListener("click", () => {
      want.crew = Math.max(0, Math.min(CREW.length, want.crew + Number(b.dataset.c)));
      drawControls();
      redeal({ fresh: false });
    }),
  );
  $("#deal").addEventListener("click", () => redeal({ fresh: true }));
  $("#board").addEventListener("click", async (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      try {
        await navigator.clipboard.writeText(location.href);
        copy.textContent = "Copied";
      } catch {
        copy.textContent = "Copy it from the address bar";
      }
      setTimeout(() => (copy.textContent = "Copy the link"), 2000);
      return;
    }
    // The deck's buttons.
    const b = e.target.closest("button");
    if (!b || b.disabled || !want.deck || !shown?.deck || e.detail > 1) return;
    const W = shown;
    if (b.dataset.side != null) move("answer", () => (answer(T, W, Number(b.dataset.side)), W));
    else if ("not" in b.dataset) move("not", () => notThis(T, W));
    else if ("undo" in b.dataset) move("undo", () => undo(T, W));
    else if ("rest" in b.dataset) move("rest", () => playRest(T, W));
    else if (b.dataset.pick != null) move("prompt", () => fillPrompt(T, W, { pick: Number(b.dataset.pick) }));
    else if ("skip" in b.dataset) move("prompt", () => fillPrompt(T, W, { skip: true }));
  });
  // Her own words for a prompt.
  $("#board").addEventListener("submit", (e) => {
    const form = e.target.closest("[data-own]");
    if (!form || !shown?.deck) return;
    e.preventDefault();
    const field = form.elements.own;
    const text = field.value.replace(/\s+/g, " ").trim();
    if (!text) return field.focus();
    const W = shown;
    move("prompt", () => fillPrompt(T, W, { text }));
  });
  // Back and Forward deal what the address says, but a link to a faction or
  // a seat on the board only moves down the page.
  addEventListener("popstate", () => {
    if (location.search === wrote) return;
    readAddress();
    shown = null;
    fromAddress();
  });
  let timer = 0;
  $("#find").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => find(e.target.value), 120);
  });
}
boot();
