// /deal/: deal sample boards from the world builder's tables, and read every
// table (stage 3 of notes/builder-plan.md). It uses the same engine the World
// screen will, on public/world-tables.json, so what Mo judges here is what a
// GM gets. Nothing's saved: the address holds the region, the genre (or the
// mix), how many factions and the seed, so a link deals the same board again,
// and its # is left for the links between a board's seats and factions.
import { REGIONS, canDeal, cardsOf, dealWorld, newSeed } from "../companion/world-engine.js";
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
const CHECK_NAMES = { whole: "a card with a hole", power: "Power", rival: "a rival each", block: "a blocked trade", secret: "a Secret naming another faction", unique: "an asset held twice", aims: "an agenda aimed at nothing", strange: "something strange" };

let T = null;
const want = { region: "town", genre: "medieval", era: null, twist: null, n: 6, seed: null };
let shown = null;

// ── The address: ?region=town&genre=medieval&factions=6&seed=ash-lantern-ford,
// or a mix of its own as genre=mix&era=medieval&twist=magic.
function readAddress() {
  const q = new URLSearchParams(location.search);
  const region = q.get("region");
  if (REGIONS.includes(region)) want.region = region;
  const genre = q.get("genre");
  if (genre === MIX) Object.assign(want, { genre: MIX, era: q.get("era") || null, twist: q.get("twist") || null });
  else if (genre) want.genre = genre;
  const n = Number(q.get("factions"));
  if (n >= 4 && n <= 12) want.n = Math.floor(n);
  const seed = q.get("seed");
  if (seed) want.seed = seed.slice(0, 40);
}
function writeAddress() {
  const q = new URLSearchParams({ region: want.region, genre: want.genre });
  if (want.genre === MIX) {
    q.set("era", want.era ?? "");
    if (want.twist) q.set("twist", want.twist);
  }
  q.set("factions", String(want.n));
  if (want.seed) q.set("seed", want.seed);
  history.replaceState(null, "", `${location.pathname}?${q}`);
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

// ── The controls.
function drawControls() {
  const none = [];
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
  $$(".dl-step button").forEach((b) => (b.disabled = (b.dataset.n === "-1" && want.n <= 4) || (b.dataset.n === "1" && want.n >= 12)));
  drawButton();
}
function drawButton() {
  const r = recipe();
  const ok = Boolean(r && canDeal(T, r));
  const typed = $("#seed").value.trim();
  const button = $("#deal");
  button.disabled = !ok;
  button.textContent = typed && typed !== shown?.seed ? "Deal this seed" : shown ? "Deal another" : "Deal";
}

// ── A board, drawn.
const why = (p) => (p?.why ? `<span class="why">${esc(p.why)}</span>` : "");
const chips = (items) => `<ul class="dl-chips">${items.join("")}</ul>`;
const factionLink = (C, j) => (C.factions[j] ? `<a href="#f-${j}">${esc(C.factions[j].name)}</a>` : "someone");

function drawBoard(W) {
  const C = cardsOf(T, W);
  const reg = T.regions[W.recipe.region];
  const seat = (k) => C.seats.find((s) => s.k === k);
  const failed = (W.checks ?? []).filter((c) => !c.ok).map((c) => CHECK_NAMES[c.k] ?? c.k);
  const fixed = [...new Set(W.fixes.map((f) => CHECK_NAMES[f.k] ?? f.k))];
  const dial = (k) => {
    const v = W.dials[k];
    return `<li><span>${esc(DIAL_NAMES[k])}</span><span class="dl-pips" role="img" aria-label="${esc(`${DIAL_NAMES[k]}: ${v} of 2`)}">${[0, 1].map((x) => `<i${x < v ? ' class="on"' : ""}></i>`).join("")}</span></li>`;
  };
  const head = `
    <header class="dl-world-head card">
      <p class="dl-seed"><span class="sr">Seed </span>${W.seed.split("-").map((w) => `<b>${esc(w)}</b>`).join('<i aria-hidden="true">·</i>')}</p>
      <p class="dl-recipe">${esc(reg.name)} · ${esc(genreName(W.recipe))} · ${W.n} factions on ${W.s} seats</p>
      <ul class="dl-dials" aria-label="The dials, set by the asking">${Object.keys(DIAL_NAMES).map(dial).join("")}</ul>
      <button type="button" class="button dl-copy" data-copy>Copy the link</button>
    </header>`;
  const asking = `
    <section class="dl-sec" aria-labelledby="h-asking">
      <h2 id="h-asking">The asking</h2>
      <dl class="dl-ask">${QUESTIONS.map(([q, label]) => `<div><dt>${esc(label)}</dt><dd>${esc(W.asking[q]?.text ?? "")}</dd></div>`).join("")}</dl>
      <div class="dl-tension">${die(12, { own: "them", face: W.tension?.roll ?? "", label: `The tension, a d12 that came up ${W.tension?.roll}` })}<p><span>What’s pulling it apart</span>${esc(W.tension?.text ?? "")}</p></div>
    </section>`;
  const ground = `
    <section class="dl-sec" aria-labelledby="h-ground">
      <h2 id="h-ground">The ground</h2>
      <ol class="dl-seats">${C.seats
        .map(
          (s) => `<li id="s-${s.k}"${W.seats[s.k]?.strange ? ' class="strange"' : ""}>
            <p class="dl-seatname"><b>${esc(s.name)}</b><span class="dl-keep">${esc(s.role)}</span></p>
            <p class="dl-notice">${esc(s.notice)}</p>
            <p class="dl-held">${s.held >= 0 ? `Held by ${factionLink(C, s.held)}` : "Nobody holds it yet"}</p>
          </li>`,
        )
        .join("")}</ol>
    </section>`;
  const factions = C.factions.map((f, i) => drawFaction(W, C, f, i, reg, seat)).join("");
  const checks = failed.length
    ? `Still failing: ${failed.join(", ")}.`
    : `Every check passed${fixed.length ? `, with ${fixed.join(" and ")} dealt again` : ""}${W.fallbacks.length ? `, and a fallback from core for ${W.fallbacks.join(", ")}` : ""}.`;
  $("#board").innerHTML = `<article class="dl-world">${head}${asking}${ground}
    <section class="dl-sec" aria-labelledby="h-factions"><h2 id="h-factions">The factions</h2><div class="dl-factions">${factions}</div></section>
    <p class="dl-checks">${esc(checks)}</p></article>`;
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
  if (f.threads.length) lines.push(["Threads", `<ul class="dl-threads">${f.threads.map((t) => `<li class="${t.kind}"><span class="dl-to">${t.kind === "hostile" ? "Hostile" : "Bond"} toward ${factionLink(C, t.to)}</span><em>${esc(t.text)}</em></li>`).join("")}</ul>`]);
  return `
    <article class="dl-fac card${w.type?.strange ? " strange" : ""}" id="f-${i}" aria-labelledby="fn-${i}">
      <header class="dl-fac-head">
        <div>
          <h3 id="fn-${i}">${esc(f.name)}</h3>
          <p class="dl-size">${esc(cap(f.size))}, ${esc(reg.sizes[f.size] ?? "")} · ${f.steps} ${f.steps === 1 ? "step" : "steps"}${s ? ` · on <a href="#s-${s.k}">${esc(s.name)}</a>` : ""}</p>
        </div>
        ${die(f.die, { own: "them", label: `Power d${f.die}` })}
      </header>
      <p class="dl-about">${esc(f.about)}${why(w.type)}</p>
      ${f.exception ? `<p class="dl-break"><b>Breaks the logic</b> ${esc(f.exception.text)}, ${esc(f.exception.reason)}.</p>` : ""}
      <dl class="dl-lines">${lines.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </article>`;
}
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);

// ── Dealing.
function deal({ fresh = true } = {}) {
  const r = recipe();
  // The board says why there's nothing on it, and a screen reader hears a
  // line about the deal rather than the whole board again.
  const say = (line) => ($("#dealt").textContent = line);
  if (!r || !canDeal(T, r)) {
    const reg = T.regions[want.region]?.name ?? want.region;
    const line = !r ? "Pick a genre to deal." : Object.keys(T.eras).some((era) => canDeal(T, { region: r.region, era })) ? `Nothing deals at ${reg} for ${genreName(r)} till its packs are in.` : `Nothing deals at ${reg} till its packs are in.`;
    $("#board").innerHTML = `<p class="dl-wait">${esc(line)}</p>`;
    say(line);
    drawButton();
    return;
  }
  const typed = $("#seed").value.trim();
  const seed = typed && typed !== shown?.seed ? typed : fresh || !want.seed ? newSeed(T) : want.seed;
  try {
    const W = dealWorld(T, { recipe: r, seed, factions: want.n });
    want.seed = W.seed;
    shown = W;
    $("#seed").value = W.seed;
    writeAddress();
    drawBoard(W);
    say(`Dealt ${W.seed}: ${genreName(r)} at ${T.regions[r.region].name}, ${want.n} factions.`);
  } catch (err) {
    $("#board").innerHTML = `<p class="dl-wait">That one wouldn’t deal: ${esc(err.message)}</p>`;
    say("That one wouldn’t deal.");
  }
  drawButton();
}

// ── Every table, read once, the first time the tab opens.
const meta = (r, { role = true } = {}) => {
  const bits = [];
  if (role && r.role) bits.push(T.book.assets[r.role]?.name ?? T.types[r.role] ?? r.role);
  if (r.regions) bits.push(r.regions.map((x) => T.regions[x]?.name ?? x).join(", "));
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
    parts.push(`</section><section class="dl-partsec"><h2 class="dl-part">${esc(pack.name)}</h2><p class="dl-tnote">${esc(`${pack.kind === "era" ? "An era" : "A twist"}, at ${pack.fits.map((x) => T.regions[x].name).join(", ")}.`)}</p>`);
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
  drawControls();
  $("#seed").value = want.seed ?? "";
  deal({ fresh: !want.seed });

  $("#set").addEventListener("change", (e) => {
    if (e.target.name === "region") want.region = e.target.value;
    if (e.target.id === "genre") want.genre = e.target.value;
    if (e.target.id === "era") want.era = e.target.value;
    if (e.target.id === "twist") want.twist = e.target.value || null;
    if (e.target.id === "seed") return drawButton();
    drawControls();
    deal({ fresh: false });
  });
  $("#set").addEventListener("submit", (e) => {
    e.preventDefault();
    deal({ fresh: true });
  });
  $("#seed").addEventListener("input", drawButton);
  $$(".dl-step button").forEach((b) =>
    b.addEventListener("click", () => {
      want.n = Math.max(4, Math.min(12, want.n + Number(b.dataset.n)));
      drawControls();
      deal({ fresh: false });
    }),
  );
  $("#deal").addEventListener("click", () => deal({ fresh: true }));
  $("#board").addEventListener("click", async (e) => {
    const copy = e.target.closest("[data-copy]");
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Copy it from the address bar";
    }
    setTimeout(() => (copy.textContent = "Copy the link"), 2000);
  });
  let timer = 0;
  $("#find").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => find(e.target.value), 120);
  });
}
boot();
