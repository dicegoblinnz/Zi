// The founding on every phone in a campaign (stage 9 of notes/builder-plan.md):
// the room and the asking. It's kept with the campaign's live table (table.js
// and the Table object), so every change reaches every phone as it's made,
// and each phone keeps the last of it for when there's no signal.
// found-rules.js has the rules both sides use.
//
// The GM sets it up on her campaign's page and opens the room. Her players
// join from their World tab, and once she starts it the turns go round the
// asking, the book's questions in its order, with the tension a d12 rolled
// as a turn of its own. Every phone deals the same three answers for a turn
// from the shared seed, off public/world-tables.json, so nothing's
// generated and nothing has to come from the server to deal. A player picks
// one or writes their own. Her phone can put one in for anyone without a
// phone, and it deals the rest when the clock runs out. Once the asking's
// done, she takes it into Build the world on her phone (world-make.js) and
// carries on there, the crew's answers locked.
import { AGES, ASKED, CLOCKS, PARTS, clockLeft, dialsOf, keyOf, leftOf, pickOf, timeUp, whoOf } from "./found-rules.js";
import { REGIONS, canDeal, choose, fill, newSeed, options, start, tensionAt } from "./world-engine.js";
import { rollDie } from "./dice.js";
import { die as kitDie } from "../kit/kit.js";

const MIX = "mix";
const SHORT = { holds: "What holds it together", tension: "What’s pulling it apart", runs: "Who runs it", notices: "What a stranger notices" };
const DIALS = [["tense", "How tense"], ["strange", "How strange"], ["rich", "How rich"], ["ruled", "How ruled"]];
const DIAL_WORDS = ["low", "middling", "high"];
const NUDGE = { tense: ["calmer", "more tense"], strange: ["less strange", "stranger"], rich: ["poorer", "richer"], ruled: ["less ruled", "more ruled"] };
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const newId = () => `${random(8)}${Date.now().toString(36).slice(-4)}`;
const online = () => navigator.onLine !== false;
const time = (ms) => new Date(ms).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "";
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
// A countdown, as minutes and seconds.
const clockText = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function makeFound(d) {
  const { esc } = d;
  let T = null;
  let loading = null;
  let failed = false;
  // sure: a button waiting on its second tap. setup: what she's picking before
  // the room opens, by campaign. change: the room whose setup she's changing.
  // own: the turn she's writing an answer for. roll: the turn whose real roll
  // she's tapping in. spin: the roll this phone's just made, which tumbles once.
  const ui = { sure: "", setup: {}, change: "", own: "", roll: "", spin: "", focus: "", after: "" };
  // The three answers dealt for a turn, kept so a redraw never deals again.
  const hands = new Map();
  // The rest of an asking her phone's dealt, so time running out deals once,
  // and the campaigns waiting on the tables to deal it.
  const dealt = new Set();
  const waitingDeal = {};

  const TB = () => d.table();
  const local = (id) => TB().local(id);
  const foundOf = (id) => local(id).found ?? null;
  const gmIn = (id) => TB().roleIn(id) === "gm";
  const gmName = (id) => cap(TB().gmName(id));
  // This phone's player in a campaign, as the room knows them.
  const myKey = (id) => {
    const w = TB().whoIn(id);
    return w.role === "player" && w.ch ? keyOf(w.user, w.ch) : null;
  };
  const now = (id) => TB().serverNow(id);
  const sureOf = (key) => ui.sure === key;
  const arm = (key) => {
    ui.sure = key;
  };

  // ------------------------------------------------------------ the tables

  // Fetched once. If it can't be had (no signal and never seen), it says so
  // and tries again when the signal's back, never in a loop.
  function tables() {
    if (T) return T;
    if (failed && !loading) failed = false;
    loading ??= fetch("/world-tables.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((j) => {
        if (j?.core && j.packs) {
          T = j;
          failed = false;
        } else {
          failed = true;
          // Asked for again next time something needs them.
          loading = null;
        }
        d.quietRender();
        for (const id of Object.keys(waitingDeal)) dealRest(id);
      });
    return null;
  }
  addEventListener("online", () => {
    if (T || !failed) return;
    failed = false;
    loading = null;
    d.quietRender();
  });
  const regionName = (r) => T?.regions?.[r]?.name ?? cap(r);
  function genreName(r) {
    if (!T) return cap(r.era);
    const g = Object.values(T.genres).find((x) => x.era === r.era && (x.twist ?? null) === (r.twist ?? null));
    return g ? g.name : `${T.eras[r.era] ?? cap(r.era)}${r.twist ? ` and ${T.twists[r.twist] ?? cap(r.twist)}` : ""}`;
  }
  const mixSaid = (f) => `${genreName(f.recipe)} at ${regionName(f.recipe.region)}`;

  // A pick the room keeps, as the engine reads one.
  const asEngine = (p) => (p.own ? { own: true, text: p.text } : { id: p.id, text: p.text, tags: p.tags ?? [], dials: p.dials ?? {}, strange: p.strange === true, why: "", ...(p.roll ? { roll: p.roll } : {}) });
  // A card, as it goes up.
  const asPick = (c) => ({ id: c.id, text: fill(c.text, {}), tags: c.tags ?? [], dials: c.dials ?? {}, strange: c.strange === true });
  // The world as the room has it so far, for dealing what's next: every
  // phone builds the same one from the shared seed and what's been answered.
  function worldOf(f, upTo) {
    const W = start(T, { recipe: f.recipe, seed: f.seed, factions: f.n });
    for (const part of PARTS.slice(0, PARTS.indexOf(upTo))) {
      const p = pickOf(f, part);
      if (p) choose(T, W, part === "tension" ? "tension" : `ask:${part}`, asEngine(p));
    }
    return W;
  }
  // A turn's three answers: the same on every phone, since they're dealt
  // from the shared seed and what came before. null while there are no
  // tables, and [] when the tables can't deal this world.
  function handOf(f, part) {
    if (!tables()) return null;
    const key = `${f.id}|${f.seed}|${f.n}|${JSON.stringify(f.recipe)}|${part}|${PARTS.slice(0, PARTS.indexOf(part)).map((p) => pickOf(f, p)?.text ?? "").join("|")}`;
    if (!hands.has(key)) {
      let cards = [];
      try {
        if (canDeal(T, f.recipe)) cards = options(T, worldOf(f, part), `ask:${part}`, 3).map(asPick);
      } catch {
        cards = [];
      }
      hands.set(key, cards);
    }
    return hands.get(key);
  }

  // ------------------------------------------------------------ dealing the rest

  // Time's run out, and the turn that was on has finished: her phone deals
  // whatever's left of the asking, the way the engine deals it, in order.
  function dealRest(id, { force = false } = {}) {
    const f = foundOf(id);
    if (!f || !gmIn(id) || f.step !== "ask" || (!f.out && !force)) return false;
    const mark = `${f.id}|${leftOf(f).join(",")}`;
    if (!force && dealt.has(mark)) return false;
    if (!tables()) {
      waitingDeal[id] = true;
      return false;
    }
    delete waitingDeal[id];
    if (!canDeal(T, f.recipe)) return false;
    const picks = {};
    const sofar = structuredClone(f);
    for (const part of leftOf(f)) {
      const W = worldOf(sofar, part);
      const c = options(T, W, part === "tension" ? "tension" : `ask:${part}`, 1)[0];
      if (!c) return false;
      const p = part === "tension" ? { ...asPick(c), roll: c.roll, real: false } : asPick(c);
      picks[part] = p;
      if (part === "tension") sofar.tension = p;
      else sofar.asking[part] = p;
    }
    dealt.add(mark);
    TB().push(id, { o: "fd-rest", picks });
    return true;
  }
  addEventListener("zi-found", (e) => dealRest(e.detail));

  // ------------------------------------------------------------ small pieces

  const btn = (doit, label, { cls = "button", attrs = "", disabled = false } = {}) => `<button type="button" class="${cls}" data-act="fd" data-do="${doit}"${attrs}${disabled ? " disabled" : ""}>${label}</button>`;
  const nudges = (dials) => Object.entries(dials ?? {}).filter(([k, v]) => NUDGE[k] && v).map(([k, v]) => `<span class="wk-nudge">${NUDGE[k][v > 0 ? 1 : 0]}</span>`).join("");
  function dialsList(f) {
    const dl = dialsOf(f);
    return `<ul class="wk-dials fd-dials" aria-label="What the asking’s set">${DIALS.map(([k, label]) => `<li><span>${label}</span><span class="wk-pips" role="img" aria-label="${label}: ${DIAL_WORDS[dl[k]]}">${[0, 1, 2].map((x) => `<i${x <= dl[k] ? ' class="on"' : ""}></i>`).join("")}</span></li>`).join("")}</ul>`;
  }
  // How the phone's getting on with the table, in a line, when it's not live.
  function status(id) {
    const waiting = TB().waiting(id);
    const at = TB().seenAt(id);
    const bits = [
      !online() ? (at ? `No signal, so this is the room as it was at ${time(at)}.` : "No signal, and this phone hasn’t seen the room yet.") : "",
      waiting ? (online() ? "Sending…" : `${waiting === 1 ? "Your change goes" : "Your changes go"} up when you’ve got a signal.`) : "",
    ].filter(Boolean);
    return bits.length ? `<p class="cc-small pt-status fd-status" role="status">${bits.join(" ")}</p>` : "";
  }
  const nameOf = (f, key) => first(whoOf(f, key)?.name) || "Someone";
  // Whose turn, said for whoever's holding the phone.
  const turnWho = (id, f) => (f.turn?.key === myKey(id) ? "Your turn" : `${esc(nameOf(f, f.turn?.key))}’s turn`);

  // The clock for the age that's on, counted down on the phone from the
  // server's time, with her buttons under it.
  function clockRow(id, f, gm) {
    if (!f.clock) return "";
    const t = now(id);
    const left = clockLeft(f, t);
    const up = timeUp(f, t);
    const run = Boolean(f.clock.run);
    const label = f.clock.age === 1 ? "The asking and the ground" : AGES[f.clock.age - 1];
    const tools = gm && f.step === "ask"
      ? `<div class="fd-clock-b">${btn("clock", run ? "Stop" : "Run", { cls: "button sm", attrs: ` data-v="${run ? "stop" : "run"}"`, disabled: !run && !left })}${btn("clock", "−5", { cls: "button sm", attrs: ' data-v="add" data-m="-5" aria-label="Five minutes off"', disabled: !left })}${btn("clock", "+5", { cls: "button sm", attrs: ' data-v="add" data-m="5" aria-label="Five more minutes"' })}</div>`
      : "";
    const said = up ? "Time’s up" : clockText(left);
    return `<div class="fd-clock${up ? " is-up" : ""}${run ? "" : " is-stopped"}"><p class="fd-clock-k">${esc(label)}</p>
      <p class="fd-clock-t" role="timer"${run && !up ? ` data-fd-clock="${esc(id)}"` : ""}>${said}${run || up ? "" : ' <small>stopped</small>'}</p>${tools}</div>`;
  }

  // Everyone in, in the order the turns go round, with whose turn it is.
  function strip(id, f) {
    const me = myKey(id);
    return `<ol class="fd-who" aria-label="Who’s in, in the order the turns go round">${f.who.map((w) => {
      const on = f.turn?.key === w.key;
      return `<li class="fd-who-i${on ? " is-on" : ""}${w.key === me ? " is-me" : ""}"${on ? ' aria-current="step"' : ""}><span class="fd-who-n">${esc(first(w.name) || "Someone")}</span><span class="fd-who-c">${w.key === me ? "you" : esc(w.cname)}</span></li>`;
    }).join("")}</ol>`;
  }

  // ------------------------------------------------------------ her campaign page

  // The way in, on a campaign with nothing on its board yet and no founding
  // on, and her setup once she's tapped it.
  function tile(id) {
    if (!gmIn(id) || foundOf(id)) return "";
    if (ui.setup[id]) return setupView(id);
    const doc = d.world().docIn(id);
    if (doc?.factions?.length) return "";
    const players = TB().rosterOf(id).length;
    return `<section class="cc-sec fd-tile" data-fd="${esc(id)}" aria-labelledby="fd-tile-${esc(id)}"><div class="card fd-tile-in">
      <p class="kicker is-gm">The founding</p><h2 id="fd-tile-${esc(id)}">Found the world with the crew</h2>
      <p>A session zero on everyone’s phone. Your players answer the asking a turn each, round the table, from three answers the tables deal or their own words. Nothing goes on the board till you put it there.</p>
      ${players ? `<div class="cc-row">${btn("setup", "Set it up", { cls: "button primary" })}</div>` : '<p class="cc-small">Once your players have joined, you can set it up here.</p>'}</div></section>`;
  }

  // Her picks before the room opens: where, what kind, how many factions and
  // the clocks. The same pieces change the setup while the room's open.
  function firstSetup(id) {
    const n = Math.max(4, Math.min(12, TB().rosterOf(id).length + 2));
    const region = T ? REGIONS.find((r) => Object.keys(T.eras).some((era) => canDeal(T, { region: r, era }))) ?? "town" : "town";
    const g = T ? Object.values(T.genres).find((x) => canDeal(T, { region, era: x.era, twist: x.twist })) : null;
    return { region, genre: g?.id ?? MIX, era: g ? null : Object.keys(T?.eras ?? {})[0] ?? "medieval", twist: null, n, clocks: [...CLOCKS] };
  }
  function recipeOf(s) {
    if (!T || !s) return null;
    if (s.genre === MIX) return s.era ? { region: s.region, era: s.era, twist: s.twist || null } : null;
    const g = T.genres[s.genre];
    return g ? { region: s.region, era: g.era, twist: g.twist ?? null } : null;
  }
  const genresAt = (region) => Object.values(T.genres).filter((g) => canDeal(T, { region, era: g.era, twist: g.twist }));
  function settle(s) {
    if (s.genre !== MIX && !genresAt(s.region).some((g) => g.id === s.genre)) s.genre = genresAt(s.region)[0]?.id ?? MIX;
    if (s.genre === MIX) {
      if (!s.era || !canDeal(T, { region: s.region, era: s.era })) s.era = Object.keys(T.eras).find((era) => canDeal(T, { region: s.region, era })) ?? null;
      if (s.twist && !canDeal(T, { region: s.region, era: s.era, twist: s.twist })) s.twist = null;
    }
    return s;
  }
  // A setup from a room that's open, for changing it.
  function setupFrom(f) {
    const g = T ? Object.values(T.genres).find((x) => x.era === f.recipe.era && (x.twist ?? null) === (f.recipe.twist ?? null)) : null;
    return { region: f.recipe.region, genre: g?.id ?? MIX, era: g ? null : f.recipe.era, twist: g ? null : f.recipe.twist, n: f.n, clocks: [...f.clocks] };
  }
  function setupFields(s) {
    const deals = REGIONS.filter((r) => Object.keys(T.eras).some((era) => canDeal(T, { region: r, era })));
    const regions = REGIONS.map((r) => {
      const ok = deals.includes(r);
      return `<button type="button" class="wk-pick${s.region === r ? " is-on" : ""}" data-act="fd" data-do="set" data-k="region" data-v="${r}"${pressed(s.region === r)}${ok ? "" : " disabled"}><b>${esc(regionName(r))}</b><span>${ok ? esc(cap(T.regions[r]?.faction ?? "")) : "Coming, once its tables are in"}</span></button>`;
    }).join("");
    const here = genresAt(s.region);
    const later = Object.values(T.genres).filter((g) => !here.includes(g)).map((g) => g.name);
    const genres = [...here.map((g) => `<button type="button" class="wk-pick${s.genre === g.id ? " is-on" : ""}" data-act="fd" data-do="set" data-k="genre" data-v="${esc(g.id)}"${pressed(s.genre === g.id)}><b>${esc(g.name)}</b><span>${esc(g.twist ? `${T.eras[g.era]} and ${T.twists[g.twist]}` : `${T.eras[g.era]} on its own`)}</span></button>`), `<button type="button" class="wk-pick${s.genre === MIX ? " is-on" : ""}" data-act="fd" data-do="set" data-k="genre" data-v="${MIX}"${pressed(s.genre === MIX)}><b>Mix your own</b><span>Any era with any twist</span></button>`].join("");
    const chip = (k, v, label, ok, on) => `<button type="button" class="chip pt-chip wk-chip${on ? " is-on" : ""}" data-act="fd" data-do="set" data-k="${k}" data-v="${esc(v)}"${pressed(on)}${ok ? "" : " disabled"}>${esc(label)}${ok ? "" : " <small>coming</small>"}</button>`;
    const mix = s.genre === MIX ? `<div class="wk-mix"><p class="bd-label">The era</p><div class="cc-row wk-chips">${Object.entries(T.eras).map(([k, name]) => chip("era", k, name, canDeal(T, { region: s.region, era: k }), s.era === k)).join("")}</div>
      <p class="bd-label">The twist</p><div class="cc-row wk-chips">${chip("twist", "", "No twist", true, !s.twist)}${Object.entries(T.twists).map(([k, name]) => chip("twist", k, name, Boolean(s.era) && canDeal(T, { region: s.region, era: s.era, twist: k }), s.twist === k)).join("")}</div></div>` : "";
    const stepper = (k, v, lo, hi, label, unit = "", i = "") => `<div class="wk-count fd-count"><button type="button" class="button wk-step-b" data-act="fd" data-do="set" data-k="${k}" data-i="${i}" data-v="-1" aria-label="${esc(label)}: less"${v <= lo ? " disabled" : ""}>−</button><output class="wk-count-n" aria-live="polite" aria-label="${esc(label)}" data-fdn="${k}${i}">${v}${unit ? `<small>${unit}</small>` : ""}</output><button type="button" class="button wk-step-b" data-act="fd" data-do="set" data-k="${k}" data-i="${i}" data-v="1" aria-label="${esc(label)}: more"${v >= hi ? " disabled" : ""}>+</button></div>`;
    const clocks = AGES.map((age, i) => `<li class="fd-age"><span class="fd-age-n">${esc(age)}</span>${stepper("clock", s.clocks[i], 5, 120, `${age}’s clock, in minutes`, "min", i)}</li>`).join("");
    return `<section class="wk-sec" aria-labelledby="fd-region"><h3 id="fd-region">Where it’s set</h3><div class="wk-picks">${regions}</div></section>
      <section class="wk-sec" aria-labelledby="fd-genre"><h3 id="fd-genre">What kind of world</h3><div class="wk-picks">${genres}</div>${mix}
      ${later.length ? `<p class="cc-small wk-later">Coming as their tables go in: ${esc(later.join(", "))}.</p>` : ""}</section>
      <section class="wk-sec" aria-labelledby="fd-count"><h3 id="fd-count">How many factions</h3>${stepper("n", s.n, 4, 12, "How many factions")}
      <p class="cc-small">It starts at your players and two more, and it’s never fewer than four.</p></section>
      <section class="wk-sec" aria-labelledby="fd-clocks"><h3 id="fd-clocks">The clocks</h3><ul class="fd-ages">${clocks}</ul>
      <p class="cc-small">Each age gets its own clock. The asking’s part of the ground, so the first one starts with it. When a clock runs out, the turn that’s on finishes and the tables deal whatever’s left.</p></section>`;
  }
  function setupView(id) {
    if (!tables()) return `<section class="cc-sec fd is-gm" data-fd="${esc(id)}" aria-labelledby="fd-setup-h"><p class="kicker is-gm">The founding</p><h2 id="fd-setup-h">Set it up</h2><p class="cc-lead" role="status">${failed ? "The tables didn’t come through. Check your signal and try again." : "Getting the tables…"}</p><div class="cc-row">${failed ? btn("retry", "Try again", { cls: "button primary" }) : ""}${btn("unsetup", "Cancel")}</div></section>`;
    if (ui.setup[id].pending) ui.setup[id] = firstSetup(id);
    const s = settle(ui.setup[id]);
    const r = recipeOf(s);
    return `<section class="cc-sec fd fd-setup is-gm" data-fd="${esc(id)}" aria-labelledby="fd-setup-h"><p class="kicker is-gm">The founding</p><h2 id="fd-setup-h">Set it up</h2>
      <p class="cc-lead">Pick where it’s set and what kind of world it is. Once the room’s open, your players join it from their World tab, and you start it when everyone’s in.</p>
      ${setupFields(s)}
      <div class="cc-row fd-go">${btn("open", "Open the room", { cls: "button primary", disabled: !r || !canDeal(T, r) })}${btn("unsetup", "Cancel")}</div></section>`;
  }

  // ------------------------------------------------------------ the room

  // The room on her campaign page, while there's a founding on.
  function top(id) {
    if (!gmIn(id)) return "";
    const f = foundOf(id);
    return f ? room(id, f, true) : "";
  }
  // The room on a player's World tab (and their World screen).
  function tab(id) {
    if (gmIn(id)) return "";
    const f = foundOf(id);
    return f ? room(id, f, false) : "";
  }

  function room(id, f, gm) {
    tables();
    const hid = `fd-h-${esc(id)}`;
    const title = f.step === "room" ? "The room’s open" : f.step === "ask" ? "The asking" : "The asking’s done";
    const body = f.step === "room" ? roomBody(id, f, gm) : f.step === "ask" ? askBody(id, f, gm) : doneBody(id, f, gm);
    return `<section class="cc-sec fd is-${f.step}${gm ? " is-gm" : ""}" data-fd="${esc(id)}" aria-labelledby="${hid}">
      <div class="fd-head"><p class="kicker${gm ? " is-gm" : ""}">The founding · ${esc(mixSaid(f))}</p><h2 id="${hid}">${title}</h2></div>
      ${status(id)}${f.step === "ask" ? clockRow(id, f, gm) : ""}${body}</section>`;
  }

  function roomBody(id, f, gm) {
    const me = myKey(id);
    const mine = whoOf(f, me);
    const gmn = esc(gmName(id));
    if (!gm) {
      const list = `<ol class="fd-in">${f.who.map((w) => `<li><span class="fd-in-n">${esc(first(w.name) || "Someone")}${w.key === me ? " <small>you</small>" : ""}</span><span class="fd-in-s${w.joined ? " is-here" : ""}">${w.joined ? "Here" : "Not here yet"}</span></li>`).join("")}</ol>`;
      if (mine?.joined) return `<p class="cc-lead">You’re in. ${gmn} starts it once everyone’s here, and the turns go round in this order.</p>${list}`;
      if (f.outs.includes(me)) return `<p class="cc-lead">${gmn}’s left you out of this one. Whatever the crew’s shown of the world turns up here.</p>`;
      return `<p class="cc-lead">${gmn}’s opened the founding. The crew builds the world together, a turn each, round the table, starting with the asking. It’s ${esc(mixSaid(f))}, with ${WORDS[f.n] ?? f.n} factions.</p>
        <div class="cc-row fd-go">${btn("join", "Join it", { cls: "button primary" })}</div>${f.who.length ? `<h3 class="fd-h3">Who’s in</h3>${list}` : ""}`;
    }
    const changing = ui.change === id && T;
    const summary = `<div class="card fd-set"><p>${esc(mixSaid(f))}, with ${WORDS[f.n] ?? f.n} factions. The ground gets ${f.clocks[0]} minutes, the founding ${f.clocks[1]} and the strife ${f.clocks[2]}.</p>
      ${btn("change", changing ? "Cancel" : "Change it", { cls: "button sm", attrs: ` aria-expanded="${changing ? "true" : "false"}"` })}</div>`;
    const rows = f.who.map((w, i) => `<li class="fd-row"><div class="fd-row-in"><b>${esc(first(w.name) || "Someone")}</b><small>playing ${esc(w.cname || "someone")}</small></div>
      <span class="fd-in-s${w.joined ? " is-here" : ""}">${w.joined ? "Here" : "Not here yet"}</span>
      <div class="fd-row-b">${i ? btn("move", "Move up", { cls: "button sm", attrs: ` data-key="${esc(w.key)}" aria-label="Move ${esc(first(w.name))} up"` }) : ""}${btn("in", "Take out", { cls: "button sm", attrs: ` data-key="${esc(w.key)}" data-on="0" aria-label="Take ${esc(first(w.name))} out"` })}</div></li>`).join("");
    const outs = TB().rosterOf(id).filter((m) => !whoOf(f, keyOf(m.user, m.ch)));
    const outRows = outs.map((m) => `<li class="fd-row is-out"><div class="fd-row-in"><b>${esc(first(m.name) || "Someone")}</b><small>playing ${esc(m.cname || "someone")}</small></div><span class="fd-in-s">Out</span>
      <div class="fd-row-b">${btn("in", "Put in", { cls: "button sm", attrs: ` data-key="${esc(keyOf(m.user, m.ch))}" data-on="1" aria-label="Put ${esc(first(m.name))} in"` })}</div></li>`).join("");
    return `<p class="cc-lead">Your players join it from their World tab. Put them in the order you want the turns to go round, then start it.</p>
      ${summary}${changing ? `<div class="fd-change">${setupFields(ui.setup[id] ?? setupFrom(f))}<div class="cc-row">${btn("save", "Save it", { cls: "button primary" })}</div></div>` : ""}
      <h3 class="fd-h3">Who’s in</h3><ol class="fd-rows">${rows || '<li class="cc-small">Nobody yet.</li>'}${outRows}</ol>
      <div class="cc-row fd-go">${btn("start", "Start the asking", { cls: "button primary", disabled: !f.who.length })}${btn("end", sureOf(`end:${id}`) ? "Tap again to end it" : "End it", { cls: "button danger" })}</div>`;
  }

  function askBody(id, f, gm) {
    const t = now(id);
    const up = timeUp(f, t);
    const gmn = esc(gmName(id));
    let turn = "";
    if (f.turn) turn = turnCard(id, f, gm, up);
    else if (f.out) {
      turn = `<div class="card fd-turn is-out" role="status"><p class="fd-turn-k">Time’s up</p>
        <p>${gm ? "The tables are dealing what’s left of the asking on this phone." : `The rest of the asking’s dealt on ${gmn}’s phone.`}</p>
        ${gm ? `<div class="cc-row">${btn("rest", "Deal the rest", { cls: "button primary" })}${btn("clock", "Five more minutes", { attrs: ' data-v="add" data-m="5"' })}</div>` : ""}</div>`;
    } else if (!f.who.length) turn = `<div class="card fd-turn"><p>${gm ? "Nobody’s in. Put someone in to carry on." : "Nobody’s in right now."}</p></div>`;
    const tools = gm ? `<details class="cc-fold fd-tools" data-open="fd-tools-${esc(id)}"${d.isOpen(`fd-tools-${id}`) ? " open" : ""}><summary><h3 class="cc-fold-t">Who’s in, Deal the rest and End it</h3><span class="cc-fold-g">${esc(andList(f.who.map((w) => first(w.name))))}</span></summary>
        <div class="cc-fold-b">${whoRows(id, f)}
        <div class="cc-row fd-go">${btn("rest", sureOf(`rest:${id}`) ? "Tap again to deal the rest" : "Deal the rest", { attrs: ' data-sure="1"' })}${btn("end", sureOf(`end:${id}`) ? "Tap again to end it" : "End it", { cls: "button danger" })}</div>
        <p class="cc-small">Deal the rest lets the tables answer everything that’s left, this turn included. Ending it drops the lot, and nothing’s on the board.</p></div></details>` : "";
    return `${turn}${strip(id, f)}${soFar(id, f, gm)}${dialsList(f)}${tools}`;
  }

  // Her list during the asking: take someone out (their turn goes on to
  // whoever's after them) or put them back in at the end.
  function whoRows(id, f) {
    const rows = f.who.map((w) => `<li class="fd-row"><div class="fd-row-in"><b>${esc(first(w.name) || "Someone")}</b><small>playing ${esc(w.cname || "someone")}</small></div>
      <div class="fd-row-b">${btn("in", "Take out", { cls: "button sm", attrs: ` data-key="${esc(w.key)}" data-on="0" aria-label="Take ${esc(first(w.name))} out"` })}</div></li>`).join("");
    const outs = TB().rosterOf(id).filter((m) => !whoOf(f, keyOf(m.user, m.ch))).map((m) => `<li class="fd-row is-out"><div class="fd-row-in"><b>${esc(first(m.name) || "Someone")}</b><small>playing ${esc(m.cname || "someone")}</small></div>
      <div class="fd-row-b">${btn("in", "Put in", { cls: "button sm", attrs: ` data-key="${esc(keyOf(m.user, m.ch))}" data-on="1" aria-label="Put ${esc(first(m.name))} in"` })}</div></li>`).join("");
    return `<ol class="fd-rows">${rows}${outs}</ol>`;
  }

  // The turn that's on: the question and its three answers, or the d12.
  function turnCard(id, f, gm, up) {
    const part = f.turn.part;
    const mine = f.turn.key === myKey(id);
    const can = mine || gm;
    const name = nameOf(f, f.turn.key);
    const n = PARTS.indexOf(part) + 1;
    const head = `<p class="fd-turn-k"><span>${turnWho(id, f)}</span><span class="fd-turn-n">${n} of ${PARTS.length}</span></p><h3 class="fd-q">${esc(ASKED[part])}</h3>`;
    const late = up ? `<p class="cc-small fd-late">Time’s up. Once this turn’s done, the tables deal the rest.</p>` : "";
    if (part === "tension") return `<div class="card fd-turn${mine ? " is-mine" : ""}" data-fdk="tension">${head}${tensionBody(id, f, gm, mine, name)}${late}</div>`;
    const hand = handOf(f, part);
    const ownOpen = ui.own === `${id}|${f.id}|${part}` && can;
    let cards;
    if (hand == null) cards = failed ? `<p class="cc-small">This phone couldn’t get the tables, so there’s nothing to deal yet.${can ? " You can still write your own." : ""}</p><div class="cc-row">${btn("retry", "Try again", { cls: "button sm" })}</div>` : '<p class="cc-small" role="status">Dealing…</p>';
    else if (!hand.length) cards = '<p class="cc-small">This phone’s tables can’t deal this world. Reload the page to get the new ones, or write your own.</p>';
    else {
      cards = `<div class="wk-hand fd-hand" role="group" aria-label="${esc(ASKED[part])}">${hand.map((c, i) => {
        const inner = `<span class="wk-card-w">${esc(c.text)}</span>${nudges(c.dials) || c.strange ? `<span class="wk-card-m">${nudges(c.dials)}${c.strange ? '<span class="wk-mark is-strange">Strange</span>' : ""}</span>` : ""}`;
        if (!can) return `<div class="wk-card is-static">${inner}</div>`;
        const sure = gm && !mine && sureOf(`pick:${id}:${f.turn.key}:${part}:${i}`);
        return `<button type="button" class="wk-card${sure ? " is-sure" : ""}" data-act="fd" data-do="pick" data-c="${i}">${inner}${sure ? `<span class="fd-sure">Tap again to put this in for ${esc(name)}</span>` : ""}</button>`;
      }).join("")}</div>`;
    }
    const lead = mine ? "Pick one of the three, or write your own. A card that makes the world more tense or richer says so under it." : gm ? `${esc(name)}’s picking one of these, or writing their own. If they haven’t got a phone with them, tap one in for them.` : `${esc(name)}’s picking one of these, or writing their own.`;
    const own = can ? `<div class="wk-tools">${btn("own", `${gm && !mine ? "Write theirs" : "Write my own"}`, { cls: "button sm wk-tool", attrs: ` aria-expanded="${ownOpen ? "true" : "false"}"` })}</div>
      ${ownOpen ? `<form class="cc-form pt-form wk-own fd-own" data-form="fd-own" data-part="${part}"><label class="cc-field">${gm && !mine ? `${esc(name)}’s answer` : "Your answer"} <input name="text" maxlength="160" autocomplete="off" required></label>
        <div class="cc-row"><button type="submit" class="button primary">Put it in</button>${btn("own", "Cancel")}</div></form>` : ""}` : "";
    return `<div class="card fd-turn${mine ? " is-mine" : ""}${gm && !mine ? " is-theirs" : ""}" data-fdk="${part}">${head}<p class="cc-small fd-turn-l">${lead}</p>${cards}${own}${late}</div>`;
  }

  function tensionBody(id, f, gm, mine, name) {
    const can = mine || gm;
    const rolling = ui.roll === `${id}|${f.id}`;
    const big = kitDie(12, { own: gm && !mine ? "them" : "you", hide: true, label: "A d12" });
    const lead = mine ? "Roll the d12 on the book’s tension table, or tap in a roll of your own dice." : gm ? `${esc(name)}’s rolling the d12 on the tension table. If they haven’t got a phone with them, roll it for them or tap in their roll.` : `${esc(name)}’s rolling the d12 on the tension table.`;
    if (!can) return `<div class="fd-roll"><span class="fd-roll-d" aria-hidden="true">${big}</span><p class="cc-small">${lead}</p></div>`;
    const sure = gm && !mine && sureOf(`roll:${id}:${f.turn.key}`);
    const grid = rolling ? `<div class="wk-roll" role="group" aria-label="The roll you got"><p class="cc-small">What did ${mine ? "your" : "their"} d12 come up?</p><div class="wk-roll-g">${Array.from({ length: 12 }, (_, k) => btn("real", String(k + 1), { cls: "button sm", attrs: ` data-v="${k + 1}"` })).join("")}</div></div>` : "";
    return `<div class="fd-roll"><span class="fd-roll-d" aria-hidden="true">${big}</span><p class="cc-small">${lead}</p></div>
      <div class="cc-row fd-roll-b">${btn("roll", sure ? `Tap again to roll it for ${esc(name)}` : mine ? "Roll the d12" : `Roll it for ${esc(name)}`, { cls: "button primary", disabled: !tables() })}${btn("tap", "Tap in a real roll", { cls: "button", attrs: ` aria-expanded="${rolling ? "true" : "false"}"`, disabled: !tables() })}</div>${grid}`;
  }

  // Every answer so far, in the book's order, with who gave it, and Take it
  // back on the last for whoever gave it, or for her.
  function soFar(id, f, gm) {
    const me = myKey(id);
    const gmn = esc(gmName(id));
    const done = PARTS.filter((p) => pickOf(f, p));
    if (!done.length) return "";
    const items = done.map((part) => {
      const p = pickOf(f, part);
      const name = esc(first(p.byName) || "Someone");
      const by = p.deal ? "Dealt by the tables" : p.gm ? (gm ? `${name}’s, put in by you` : p.by === me ? `Yours, put in by ${gmn}` : `${name}’s, put in by ${gmn}`) : p.by === me ? (p.own ? "Yours, in your own words" : "Yours") : p.own ? `${name}’s own words` : name;
      const last = f.last?.part === part && (gm || f.last.key === me) && ["ask", "asked"].includes(f.step);
      const die = part === "tension" && p.roll ? `<span class="fd-a-d">${kitDie(12, { own: "them", face: p.roll, hide: true, spin: ui.spin === `${f.id}|tension` && !d.calm(), label: `The d12 came up ${p.roll}` })}</span>` : "";
      return `<li class="fd-a${p.own ? " is-own" : ""}${f.last?.part === part ? " is-last" : ""}" data-fdk="${part}-done">${die}<div class="fd-a-in"><p class="fd-a-q">${SHORT[part]}</p><p class="fd-a-w">${esc(p.text)}</p>
        <p class="fd-a-by"><span>${by}${part === "tension" && p.roll ? ` · ${[8, 11].includes(p.roll) ? "an" : "a"} ${p.roll}${p.real ? " on real dice" : ""}` : ""}</span>${nudges(p.dials)}</p>
        ${last ? btn("back", sureOf(`back:${id}:${part}:${f.last.key}`) ? "Tap again to take it back" : "Take it back", { cls: "button sm fd-back", attrs: ` data-part="${part}"` }) : ""}</div></li>`;
    }).join("");
    return `<h3 class="fd-h3">${f.step === "ask" ? "So far" : "The answers"}</h3><ol class="fd-asked">${items}</ol>`;
  }

  function doneBody(id, f, gm) {
    const gmn = esc(gmName(id));
    const answers = soFar(id, f, gm);
    if (f.step === "carried") {
      const lead = gm ? "You’ve taken it into Build the world on this phone, with the crew’s answers locked. Clear this off once you’re done with it, and it goes from your players’ phones too." : `${gmn}’s building the rest of the world from the crew’s answers. Whatever you’re shown of it turns up here.`;
      return `<p class="cc-lead">${lead}</p>${gm ? `<div class="cc-row fd-go"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=world" data-act="fd" data-do="nav">Carry on building</a>${btn("end", sureOf(`end:${id}`) ? "Tap again to clear it off" : "Clear it off", { cls: "button" })}</div>` : ""}${answers}${dialsList(f)}`;
    }
    const building = gm ? d.world().building?.(id) : null;
    const lead = gm ? "That’s the crew’s asking. Take it into Build the world on your phone and carry on from the ground there, the crew’s answers locked." : `That’s the asking done. ${gmn} takes it from here.`;
    const carry = gm ? `<div class="cc-row fd-go">${btn("carry", sureOf(`carry:${id}`) ? "Tap again to take it in" : "Build the rest on your phone", { cls: "button primary", disabled: !T })}${btn("end", sureOf(`end:${id}`) ? "Tap again to end it" : "End it", { cls: "button danger" })}</div>${building ? '<p class="cc-small">You’ve got a build on the go on this phone already. Taking this into Build the world drops it.</p>' : ""}` : "";
    return `<p class="cc-lead">${lead}</p>${carry}${answers}${dialsList(f)}`;
  }

  // ------------------------------------------------------------ a player's campaign page

  // A line on a player's campaign page while the room's waiting on them.
  function pointer(id) {
    if (gmIn(id)) return "";
    const f = foundOf(id);
    const me = myKey(id);
    if (!f || !me) return "";
    const w = TB().whoIn(id);
    const where = `<a href="/characters/?c=${encodeURIComponent(w.ch)}&amp;t=world">${esc(w.cname || "your character")}’s World tab</a>`;
    if (f.step === "room" && !f.outs.includes(me) && !whoOf(f, me)?.joined) return `<div class="cc-note fd-point" role="status"><p>${esc(gmName(id))}’s opened the founding. Join it on ${where}.</p></div>`;
    if (f.step === "ask" && f.turn?.key === me) return `<div class="cc-note fd-point" role="status"><p>It’s your turn in the founding, on ${where}.</p></div>`;
    return "";
  }

  // ------------------------------------------------------------ doing things

  // A change, tried on the room as this phone has it first, so one that
  // won't count says why straight away. It goes up as soon as there's a signal.
  function push(id, op) {
    const res = TB().check(id, op);
    if (!res.ok) {
      d.toast(res.why);
      return false;
    }
    TB().push(id, op);
    return true;
  }
  const campOf = (el) => el.closest("[data-fd]")?.dataset.fd ?? null;

  function answer(id, pick) {
    const f = foundOf(id);
    if (!f?.turn) return;
    const part = f.turn.part;
    if (push(id, { o: "fd-answer", part, pick })) {
      ui.own = "";
      ui.roll = "";
      ui.sure = "";
      if (part === "tension") ui.spin = `${f.id}|tension`;
      ui.after = id;
    }
    d.render();
  }

  const ACT = {
    setup(el, id) {
      // Till the tables are in, it says it's getting them, then opens.
      ui.setup[id] = tables() ? firstSetup(id) : { pending: true };
      d.render();
    },
    unsetup(el, id) {
      delete ui.setup[id];
      d.render();
    },
    set(el, id) {
      const f = foundOf(id);
      const s = f && ui.change === id ? (ui.setup[id] ??= setupFrom(f)) : ui.setup[id];
      if (!s || !T) return;
      const { k, v } = el.dataset;
      if (k === "region") s.region = v;
      else if (k === "genre") s.genre = v;
      else if (k === "era") s.era = v;
      else if (k === "twist") s.twist = v || null;
      else if (k === "n") s.n = Math.max(4, Math.min(12, s.n + Number(v)));
      else if (k === "clock") {
        const i = Number(el.dataset.i);
        s.clocks[i] = Math.max(5, Math.min(120, s.clocks[i] + 5 * Number(v)));
      }
      settle(s);
      d.render();
    },
    open(el, id) {
      const s = ui.setup[id];
      const recipe = recipeOf(s);
      if (!recipe || !canDeal(T, recipe)) return;
      const who = TB().rosterOf(id).map((m) => keyOf(m.user, m.ch));
      if (push(id, { o: "fd-open", id: newId(), recipe, factions: s.n, seed: newSeed(T), clocks: s.clocks, who })) {
        delete ui.setup[id];
        ui.focus = id;
      }
      d.render();
    },
    change(el, id) {
      const f = foundOf(id);
      if (!f) return;
      if (ui.change === id) {
        ui.change = "";
        delete ui.setup[id];
      } else if (tables()) {
        ui.change = id;
        ui.setup[id] = setupFrom(f);
      }
      d.render();
    },
    save(el, id) {
      const s = ui.setup[id];
      const recipe = recipeOf(s);
      if (!recipe || !canDeal(T, recipe)) return;
      if (push(id, { o: "fd-set", recipe, factions: s.n, clocks: s.clocks })) {
        ui.change = "";
        delete ui.setup[id];
      }
      d.render();
    },
    join(el, id) {
      push(id, { o: "fd-join" });
      d.render();
    },
    in(el, id) {
      push(id, { o: "fd-in", key: el.dataset.key, on: el.dataset.on === "1" });
      d.render();
    },
    move(el, id) {
      push(id, { o: "fd-move", key: el.dataset.key });
      d.render();
    },
    start(el, id) {
      if (push(id, { o: "fd-start" })) ui.focus = id;
      d.render();
    },
    pick(el, id) {
      const f = foundOf(id);
      if (!f?.turn) return;
      const i = Number(el.dataset.c);
      const c = handOf(f, f.turn.part)?.[i];
      if (!c) return;
      // Hers for someone else takes a second tap, so one meant for a look
      // doesn't answer for them.
      const key = `pick:${id}:${f.turn.key}:${f.turn.part}:${i}`;
      if (gmIn(id) && f.turn.key !== myKey(id) && !sureOf(key)) {
        arm(key);
        return d.render();
      }
      answer(id, c);
    },
    own(el, id) {
      const f = foundOf(id);
      if (!f?.turn) return;
      const key = `${id}|${f.id}|${f.turn.part}`;
      ui.own = ui.own === key ? "" : key;
      d.render();
      if (ui.own) setTimeout(() => document.querySelector(".fd-own input")?.focus(), 0);
    },
    roll(el, id) {
      const f = foundOf(id);
      if (!f?.turn || f.turn.part !== "tension" || !tables()) return;
      if (gmIn(id) && f.turn.key !== myKey(id) && !sureOf(`roll:${id}:${f.turn.key}`)) {
        arm(`roll:${id}:${f.turn.key}`);
        return d.render();
      }
      const t = tensionAt(T, rollDie(12));
      if (t) answer(id, { ...asPick(t), roll: t.roll, real: false });
    },
    tap(el, id) {
      const f = foundOf(id);
      if (!f) return;
      const key = `${id}|${f.id}`;
      ui.roll = ui.roll === key ? "" : key;
      d.render();
    },
    real(el, id) {
      const t = T ? tensionAt(T, Number(el.dataset.v)) : null;
      if (t) answer(id, { ...asPick(t), roll: t.roll, real: true });
    },
    back(el, id) {
      const f = foundOf(id);
      const key = `back:${id}:${el.dataset.part}:${f?.last?.key ?? ""}`;
      if (!sureOf(key)) {
        arm(key);
        return d.render();
      }
      ui.sure = "";
      push(id, { o: "fd-back", part: el.dataset.part });
      d.render();
    },
    rest(el, id) {
      if (el.dataset.sure && !sureOf(`rest:${id}`)) {
        arm(`rest:${id}`);
        return d.render();
      }
      ui.sure = "";
      if (!dealRest(id, { force: true }) && !T) d.toast("The tables haven’t come through yet. Try again when there’s a signal.");
      d.render();
    },
    clock(el, id) {
      const v = el.dataset.v;
      push(id, v === "add" ? { o: "fd-clock", do: "add", m: Number(el.dataset.m) } : { o: "fd-clock", do: v });
      d.render();
    },
    carry(el, id) {
      const f = foundOf(id);
      if (!f || f.step !== "asked" || !T) return;
      if (d.world().building?.(id) && !sureOf(`carry:${id}`)) {
        arm(`carry:${id}`);
        return d.render();
      }
      ui.sure = "";
      const ok = TB().check(id, { o: "fd-carry" });
      if (!ok.ok) return d.toast(ok.why);
      if (!d.world().fromFound?.(id, f, T)) return d.toast("This phone’s tables can’t deal this world. Reload the page to get the new ones.");
      push(id, { o: "fd-carry" });
      d.go(`/characters/?camp=${encodeURIComponent(id)}&world&make=world`);
    },
    end(el, id) {
      const f = foundOf(id);
      if (!sureOf(`end:${id}`)) {
        arm(`end:${id}`);
        return d.render();
      }
      ui.sure = "";
      push(id, { o: "fd-end", id: f?.id });
      d.render();
    },
    retry() {
      loading = null;
      failed = false;
      tables();
      d.render();
    },
    nav(el, id, e) {
      e.preventDefault();
      d.go(el.getAttribute("href"));
    },
  };

  function act(el, e) {
    const id = campOf(el);
    if (!id) return;
    const doit = el.dataset.do;
    // A tap anywhere else lets go of a button that was waiting on its second.
    if (ui.sure && !["pick", "roll", "back", "rest", "carry", "end"].includes(doit)) ui.sure = "";
    ACT[doit]?.(el, id, e);
  }

  function submit(kind, form, fd) {
    const id = campOf(form);
    if (kind !== "fd-own" || !id) return;
    const text = String(fd.get("text") ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!text) return;
    answer(id, { own: true, text });
  }

  // ------------------------------------------------------------ after a redraw

  // The clock counts down every second, without drawing the page again, till
  // it runs out. A roll this phone's just made tumbles, once.
  let tick = 0;
  function after(app) {
    clearInterval(tick);
    // The room, once she's opened or started it, comes to the top of the
    // screen, so the button she tapped doesn't leave her down the page.
    // An answer that's gone in takes the focus to it, with Take it back.
    if (ui.after) {
      const a = app.querySelector(`[data-fd="${CSS.escape(ui.after)}"] .fd-a.is-last`);
      ui.after = "";
      if (a) {
        a.setAttribute("tabindex", "-1");
        setTimeout(() => a.focus({ preventScroll: true }), 0);
      }
    }
    if (ui.focus) {
      const h = app.querySelector(`[data-fd="${CSS.escape(ui.focus)}"] h2`);
      ui.focus = "";
      if (h) {
        h.setAttribute("tabindex", "-1");
        setTimeout(() => {
          h.scrollIntoView({ block: "start" });
          h.focus({ preventScroll: true });
        }, 0);
      }
    }
    const clocks = [...app.querySelectorAll("[data-fd-clock]")];
    if (clocks.length) {
      const step = () => {
        for (const el of clocks) {
          const id = el.dataset.fdClock;
          const f = foundOf(id);
          if (!f?.clock) continue;
          const left = clockLeft(f, now(id));
          const text = left > 0 ? clockText(left) : "Time’s up";
          if (el.firstChild?.nodeValue !== text) el.firstChild ? (el.firstChild.nodeValue = text) : el.append(text);
          if (left <= 0) {
            clearInterval(tick);
            d.quietRender();
            return;
          }
        }
      };
      tick = setInterval(step, 1000);
    }
    if (ui.spin) {
      const scope = () => app.querySelector('[data-fdk="tension-done"]');
      if (!scope()?.querySelector("[data-spin]")) return;
      ui.spin = "";
      d.tumble(scope, () => {});
    }
  }

  return { top, tile, tab, pointer, act, submit, after, on: (id) => Boolean(foundOf(id)) };
}
