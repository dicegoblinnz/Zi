// The founding on every phone in a campaign (stages 9 and 11 of
// notes/builder-plan.md): the room and the asking, then the ground and the
// founding. It's kept with the campaign's live table (table.js and the Table
// object), so every change reaches every phone as it's made, and each phone
// keeps the last of it for when there's no signal. found-rules.js has the
// rules both sides use, and found-world.js the room's world, dealt the same
// on every phone.
//
// The GM sets it up on her campaign's page and opens the room. Her players
// join from their World tab, and once she starts it the turns go round the
// asking, the book's questions in its order, with the tension a d12 rolled
// as a turn of its own. Every phone deals the same three answers for a turn
// from the shared seed, off public/world-tables.json, so nothing's
// generated and nothing has to come from the server to deal. A player picks
// one or writes their own. Her phone can put one in for anyone without a
// phone, and it deals the rest when the clock runs out.
//
// Once the asking's done she rolls the ground's dice (on the server), and
// each player takes a die in turn, its face picking what kind of seat it
// deals, and keeps one of three seats or writes their own. Then she starts
// the founding: she picks each old power from three whole cards, and the
// players found a faction each, the last in the order first, a part at a
// time: a free seat, who had it before, who they owe, what they'll never do,
// what they are, how they work, what they want and their name. At the end
// of any age she can take it into Build the world on her phone
// (world-make.js), everything the crew made locked.
import { AGES, ASKED, ASKS, CARDS, CLOCKS, ENDS, FOUNDER, PARTS, RUNNING, clockLeft, diceLeft, dialsOf, facOf, keyOf, leftOf, missingOf, pickOf, seatAt, timeUp, whoOf } from "./found-rules.js";
import { calledIn, founderHand, freeSeats, keepName, lineIn, namable, oldHand, restOf, roleOf, roomBoard, roomWorld, seatHand, seatSize, wantWith } from "./found-world.js";
import { REGIONS, canDeal, choose, fill, newSeed, options, start, tensionAt } from "./world-engine.js";
import { rollDie } from "./dice.js";
import { die as kitDie, mini as kitMini } from "../kit/kit.js";

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
  // die: the ground's die each room's looking at. fj: the faction picked for a
  // founder's question. rolled: the rooms whose ground's dice have tumbled.
  const ui = { sure: "", setup: {}, change: "", own: "", roll: "", spin: "", focus: "", after: "", die: {}, fj: {}, rolled: new Set() };
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
    if (!f || !gmIn(id) || !RUNNING.includes(f.step) || (!f.out && !force)) return false;
    const left = f.step === "ask" ? leftOf(f).join(",") : f.step === "ground" ? diceLeft(f).join(",") : (f.fac ?? []).map((_, i) => missingOf(f, i).length).join(",");
    const mark = `${f.id}|${f.step}|${left}`;
    if (!force && dealt.has(mark)) return false;
    if (!tables()) {
      waitingDeal[id] = true;
      return false;
    }
    delete waitingDeal[id];
    if (!canDeal(T, f.recipe)) return false;
    // The ground and the founding: what's left of them, the way the engine
    // deals it (found-world.js). The ground waits for its dice.
    if (f.step !== "ask") {
      if (f.step === "ground" && !f.pool?.length) return false;
      let op = null;
      try {
        op = restOf(T, f);
      } catch {
        op = null;
      }
      if (!op) return false;
      dealt.add(mark);
      TB().push(id, op);
      return true;
    }
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
    const tools = gm && RUNNING.includes(f.step)
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
    const TITLES = { room: "The room’s open", ask: "The asking", asked: "The asking’s done", ground: "The ground", grounded: "The ground’s done", found: "The founding", founded: "The founding’s done", carried: "Building the rest" };
    const BODIES = { room: roomBody, ask: askBody, ground: groundBody, found: foundBody };
    const body = (BODIES[f.step] ?? doneBody)(id, f, gm);
    return `<section class="cc-sec fd is-${f.step}${gm ? " is-gm" : ""}" data-fd="${esc(id)}" aria-labelledby="${hid}">
      <div class="fd-head"><p class="kicker${gm ? " is-gm" : ""}">The founding · ${esc(mixSaid(f))}</p><h2 id="${hid}">${TITLES[f.step] ?? TITLES.asked}</h2></div>
      ${status(id)}${RUNNING.includes(f.step) ? clockRow(id, f, gm) : ""}${body}</section>`;
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
    const ownOpen = ui.own === `${id}|${f.id}|${part}|` && can;
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

  // The end of an age, and once she's taken it onto her phone. At the end of
  // each age, she starts the next or takes it into Build the world.
  function doneBody(id, f, gm) {
    const gmn = esc(gmName(id));
    const building = gm ? d.world().building?.(id) : null;
    const carry = (label = "Build the rest on your phone") => btn("carry", sureOf(`carry:${id}`) ? "Tap again to take it in" : label, { cls: f.step === "founded" ? "button primary" : "button", disabled: !T });
    const end = btn("end", sureOf(`end:${id}`) ? (f.step === "carried" ? "Tap again to clear it off" : "Tap again to end it") : f.step === "carried" ? "Clear it off" : "End it", { cls: f.step === "carried" ? "button" : "button danger" });
    const dropping = building ? '<p class="cc-small">You’ve got a build on the go on this phone already. Taking this into Build the world drops it.</p>' : "";
    const asking = f.step === "asked" || f.step === "carried" && !f.pool ? `${soFar(id, f, gm)}${dialsList(f)}` : pastFold(id, f, gm);
    if (f.step === "carried") {
      const lead = gm ? "You’ve taken it into Build the world on this phone, with what the crew made locked. Clear this off once you’re done with it, and it goes from your players’ phones too." : `${gmn}’s building the rest of the world from what the crew made. Whatever you’re shown of it turns up here.`;
      return `<p class="cc-lead">${lead}</p>${gm ? `<div class="cc-row fd-go"><a class="button primary" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;make=world" data-act="fd" data-do="nav">Carry on building</a>${end}</div>` : ""}${f.fac?.length ? boardList(id, f, gm) : ""}${f.pool ? seatList(id, f, gm) : ""}${asking}`;
    }
    if (f.step === "grounded") {
      const firstUp = first([...f.who].reverse()[0]?.name) || "the last in the order";
      const lead = gm ? `That’s the ground. Start the founding when the crew’s ready: you pick the old powers first, then they found a faction each, ${esc(firstUp)} first, since the turns go back the other way.` : `That’s the ground done. ${gmn} starts the founding next: the old powers first, then a faction each, ${esc(firstUp)} first.`;
      return `<p class="cc-lead">${lead}</p>${gm ? `<div class="cc-row fd-go">${btn("age", "Start the founding", { cls: "button primary" })}${carry()}${end}</div>${dropping}` : ""}${seatList(id, f, gm)}${asking}`;
    }
    if (f.step === "founded") {
      const lead = gm ? "That’s the founding. Take it into Build the world on your phone, everything the crew made locked, and deal the rest there: the old powers’ agendas, every Face and Secret, the web, and a friend and a foe for each of the crew." : `That’s the founding done. ${gmn} builds the rest from here, on her phone.`;
      return `<p class="cc-lead">${lead}</p>${gm ? `<div class="cc-row fd-go">${carry()}${end}</div>${dropping}` : ""}${boardList(id, f, gm)}${seatList(id, f, gm)}${asking}`;
    }
    const lead = gm ? "That’s the crew’s asking. Roll the ground’s dice and the turns go round again, a die each for a seat. Or take it into Build the world on your phone and carry on from the ground there, the crew’s answers locked." : `That’s the asking done. ${gmn} rolls the ground’s dice next.`;
    return `<p class="cc-lead">${lead}</p>${gm ? `<div class="cc-row fd-go">${btn("ground", "Roll the ground", { cls: "button primary" })}${carry()}${end}</div>${dropping}` : ""}${asking}`;
  }

  // ------------------------------------------------------------ the ground

  // The die a phone's looking at: the one it tapped, or the first still in
  // the pool, so a turn's one tap when the first die suits.
  function selDie(id, f) {
    const k = ui.die[`${id}|${f.id}`];
    const left = diceLeft(f);
    return left.includes(k) ? k : left[0] ?? null;
  }
  // The ground's dice, each a d6 with the keep its face picks under it, the
  // ones taken showing the seat they made. Anyone can tap one to see what it
  // deals, and only whoever's turn it is keeps one.
  function poolRow(id, f) {
    if (!f.pool?.length) return `<div class="fd-rolling" role="status"><p>${online() ? "Rolling the ground’s dice…" : "The ground’s dice roll once there’s a signal."}</p></div>`;
    const sel = selDie(id, f);
    const spin = !ui.rolled.has(f.id);
    return `<div class="fd-pool" role="group" aria-label="The ground’s dice">${f.pool.map((face, k) => {
      const keep = keepName(roleOf(T, f, k));
      const s = f.seats?.[k];
      const dieSvg = kitDie(6, { own: "them", face, hide: true, spin: spin && !d.calm() });
      if (s) return `<span class="fd-die is-taken"><span class="fd-die-d">${dieSvg}</span><span class="fd-die-k">${esc(s.text)}</span><span class="sr-only">, a ${face}, taken</span></span>`;
      return `<button type="button" class="fd-die${sel === k ? " is-on" : ""}" data-act="fd" data-do="die" data-k="${k}"${pressed(sel === k)} aria-label="A ${face}: ${esc(keep)}"><span class="fd-die-d">${dieSvg}</span><span class="fd-die-k">${esc(keep)}</span></button>`;
    }).join("")}</div>`;
  }
  // A hand, dealt once for what it reads, so a redraw never deals again.
  function handFor(key, deal) {
    if (!tables()) return null;
    if (!hands.has(key)) {
      let cards = [];
      try {
        cards = deal() ?? [];
      } catch {
        cards = [];
      }
      hands.set(key, cards);
      if (hands.size > 80) hands.delete(hands.keys().next().value);
    }
    return hands.get(key);
  }
  const stateKey = (f) => JSON.stringify([f.id, f.seed, f.asking, f.tension, f.pool, f.seats, f.fac]);
  // The cards a turn deals, as buttons for whoever can tap them, or to look
  // at for everyone else. A tap for someone else takes a second, on her phone.
  function hand(id, f, gm, cards, doit, inner, { label, sureKey }) {
    const mine = f.turn?.key === myKey(id);
    const can = mine || (gm && f.turn?.key !== "") || (gm && f.turn?.part === "old");
    const name = f.turn?.key ? nameOf(f, f.turn.key) : "";
    if (cards == null) return failed ? `<p class="cc-small">This phone couldn’t get the tables, so there’s nothing to deal yet.${can ? " You can still write your own." : ""}</p><div class="cc-row">${btn("retry", "Try again", { cls: "button sm" })}</div>` : '<p class="cc-small" role="status">Dealing…</p>';
    if (!cards.length) return '<p class="cc-small">This phone’s tables can’t deal this. Reload the page to get the new ones, or write your own.</p>';
    return `<div class="wk-hand fd-hand" role="group" aria-label="${esc(label)}">${cards.map((c, i) => {
      if (!can) return `<div class="wk-card is-static">${inner(c)}</div>`;
      const sure = gm && !mine && f.turn?.key !== "" && sureOf(`${sureKey}:${i}`);
      return `<button type="button" class="wk-card${sure ? " is-sure" : ""}" data-act="fd" data-do="${doit}" data-c="${i}">${inner(c)}${sure ? `<span class="fd-sure">Tap again to put this in for ${esc(name)}</span>` : ""}</button>`;
    }).join("")}</div>`;
  }
  const strangeMark = (c) => (c.strange ? '<span class="wk-card-m"><span class="wk-mark is-strange">Strange</span></span>' : "");
  // Write my own, for whoever's turn it is, or hers for them.
  function ownTools(id, f, gm, form, fields) {
    const mine = f.turn?.key === myKey(id);
    if (!mine && !gm) return "";
    const key = `${id}|${f.id}|${f.turn.part}|${f.turn.i ?? ""}`;
    const open = ui.own === key;
    const name = nameOf(f, f.turn.key);
    return `<div class="wk-tools">${btn("own", gm && !mine ? "Write theirs" : "Write my own", { cls: "button sm wk-tool", attrs: ` aria-expanded="${open ? "true" : "false"}"` })}</div>
      ${open ? `<form class="cc-form pt-form wk-own fd-own" data-form="${form}">${fields(gm && !mine ? `${esc(name)}’s` : "Your")}
        <div class="cc-row"><button type="submit" class="button primary">Put it in</button>${btn("own", "Cancel")}</div></form>` : ""}`;
  }

  function groundBody(id, f, gm) {
    const gmn = esc(gmName(id));
    const up = timeUp(f, now(id));
    let turn = "";
    if (f.turn?.part === "seat") turn = seatTurn(id, f, gm, up);
    else if (f.out) turn = outCard(id, f, gm, "ground");
    else if (!f.pool?.length) turn = `<div class="card fd-turn">${poolRow(id, f)}</div>`;
    else if (!f.who.length) turn = `<div class="card fd-turn"><p>${gm ? "Nobody’s in. Put someone in to carry on." : "Nobody’s in right now."}</p></div>`;
    return `${turn}${strip(id, f)}${seatList(id, f, gm)}${pastFold(id, f, gm)}${toolsFold(id, f, gm, "the ground")}`;
  }
  function seatTurn(id, f, gm, up) {
    const mine = f.turn.key === myKey(id);
    const name = nameOf(f, f.turn.key);
    const done = (f.seats ?? []).filter(Boolean).length;
    const head = `<p class="fd-turn-k"><span>${turnWho(id, f)}</span><span class="fd-turn-n">Seat ${done + 1} of ${f.pool?.length || f.seats?.length || 0}</span></p><h3 class="fd-q">Take a die for a seat</h3>`;
    if (!f.pool?.length) return `<div class="card fd-turn" data-fdk="seat">${head}${poolRow(id, f)}</div>`;
    const k = selDie(id, f);
    const role = roleOf(T, f, k);
    const lead = mine ? "Each die’s face picks what kind of seat it deals. Tap a die, then keep one of its three seats, or write your own." : gm ? `${esc(name)}’s taking a die. If they haven’t got a phone with them, tap one in for them.` : `${esc(name)}’s taking a die. Tap one to see what it deals.`;
    const cards = k == null ? [] : handFor(`seat|${stateKey(f)}|${k}`, () => seatHand(T, f, k));
    const keep = T?.keeps?.[role];
    const inner = (c) => `<span class="wk-card-n">${esc(fill(c.text, {}))}</span><span class="wk-card-w">${esc(c.notice)}</span>${c.role !== role ? `<span class="wk-card-m"><span class="wk-mark">${esc(keepName(c.role))}</span></span>` : ""}${strangeMark(c)}`;
    const own = ownTools(id, f, gm, "fd-seat-own", (whose) => `<label class="cc-field">${whose} seat’s name <input name="name" maxlength="60" autocomplete="off" required></label>
      <label class="cc-field">What a stranger notices there <input name="notice" maxlength="160" autocomplete="off" required></label>`);
    return `<div class="card fd-turn${mine ? " is-mine" : ""}${gm && !mine ? " is-theirs" : ""}" data-fdk="seat">${head}<p class="cc-small fd-turn-l">${lead}</p>${poolRow(id, f)}
      ${keep && k != null ? `<p class="fd-keep"><b>A ${f.pool[k]} is ${esc(String(role))}:</b> ${esc(keep.charAt(0).toLowerCase() + keep.slice(1))}.</p>` : ""}
      ${hand(id, f, gm, cards, "seat", inner, { label: "Seats this die deals", sureKey: `seat:${id}:${f.turn.key}:${k}` })}${own}${up ? '<p class="cc-small fd-late">Time’s up. Once this turn’s done, the tables deal the rest of the ground.</p>' : ""}</div>`;
  }
  // The seats so far, in the order they were taken, with who took each, and
  // Take it back on the last for whoever took it, or for her.
  function seatList(id, f, gm) {
    const me = myKey(id);
    const gmn = esc(gmName(id));
    const taken = (f.seats ?? []).map((s, k) => (s ? { s, k } : null)).filter(Boolean).sort((a, b) => (a.s.at ?? 0) - (b.s.at ?? 0));
    if (!taken.length) return "";
    const held = (k) => (f.fac ?? []).findIndex((_, i) => seatAt(f, i) === k);
    const W = f.fac?.length && T ? roomWorld(T, f) : null;
    const items = taken.map(({ s, k }) => {
      const name = esc(first(s.byName) || "Someone");
      const by = s.deal ? "Dealt by the tables" : s.gm ? (gm ? `${name}’s, put in by you` : s.by === me ? `Yours, put in by ${gmn}` : `${name}’s, put in by ${gmn}`) : s.by === me ? (s.own ? "Yours, in your own words" : "Yours") : s.own ? `${name}’s own words` : name;
      const last = f.last?.part === "seat" && f.last.k === k && (gm || f.last.key === me) && ["ground", "grounded"].includes(f.step);
      const h = held(k);
      const holder = h >= 0 && W ? ` · ${esc(calledIn(T, W, h))} sit${W.factions[h]?.name ? "s" : ""} here` : "";
      return `<li class="fd-a fd-seat${s.own ? " is-own" : ""}${last ? " is-last" : ""}" data-fdk="seat-${k}"><span class="fd-a-d">${kitDie(6, { own: "them", face: f.pool?.[k] ?? "", hide: true })}</span><div class="fd-a-in"><p class="fd-a-n">${esc(fill(s.text, {}))}</p><p class="fd-a-w">${esc(s.notice)}</p>
        <p class="fd-a-by"><span>${by} · ${esc(keepName(s.role))}${holder}</span></p>
        ${last ? btn("back", sureOf(`back:${id}:seat:${f.last.key}`) ? "Tap again to take it back" : "Take it back", { cls: "button sm fd-back", attrs: ` data-part="seat" data-die="${k}"` }) : ""}</div></li>`;
    }).join("");
    return `<h3 class="fd-h3">The ground${f.step === "ground" ? " so far" : ""}</h3><ol class="fd-asked fd-seats">${items}</ol>`;
  }

  // ------------------------------------------------------------ the founding

  // What each part of a founder's turn asks.
  const FQ = { "f-seat": "Where do they found it?", before: "Who had it before them?", owes: "Who do they owe?", never: "What will they never do?", type: "What are they?", method: "How do they work?", want: "What do they want?", name: "What are they called?" };
  const FLEAD = {
    "f-seat": "Any seat nobody holds. The old powers are on theirs already.",
    before: "Pick the faction that had it, or nobody. Whoever had it holds a grudge, so the words are theirs.",
    owes: "Pick who they owe, then what’s owed.",
    never: "It’s a promise their own people hold them to.",
    type: "Pick one of the three, or write your own.",
    method: "Pick one of the three, or write your own.",
    want: "Pick one of the three, or write your own. Their resources, people and agenda are dealt with it.",
    name: "Pick one of the three, or write your own.",
  };
  const SHORT_F = { "f-seat": "the seat", before: "who had it before", owes: "who they owe", never: "what they’ll never do", type: "what they are", method: "how they work", want: "what they want", name: "their name", old: "the old power" };

  function foundBody(id, f, gm) {
    let turn = "";
    const up = timeUp(f, now(id));
    if (f.turn?.part === "old") turn = oldTurn(id, f, gm, up);
    else if (FOUNDER.includes(f.turn?.part)) turn = founderTurn(id, f, gm, up);
    else if (f.out) turn = outCard(id, f, gm, "founding");
    else if (!f.who.length) turn = `<div class="card fd-turn"><p>${gm ? "Nobody’s in. Put someone in to carry on." : "Nobody’s in right now."}</p></div>`;
    return `${turn}${lastLine(id, f, gm)}${strip(id, f)}${boardList(id, f, gm)}${seatFold(id, f, gm)}${pastFold(id, f, gm)}${toolsFold(id, f, gm, "the founding")}`;
  }
  // An old power, hers to pick: three whole cards, each already on its seat.
  function oldTurn(id, f, gm, up) {
    const i = f.turn.i;
    const gmn = esc(gmName(id));
    const head = `<p class="fd-turn-k"><span>${gm ? "Your turn" : `${gmn}’s turn`}</span><span class="fd-turn-n">Old power ${i + 1} of ${f.olds}</span></p><h3 class="fd-q">${gm ? "Deal an old power" : "The old powers"}</h3>`;
    const lead = gm ? "Pick one of the three. It’s on its seat already, City or Great, and its resources and people come with it. Its agenda, Face and Secret wait for you, on your phone." : `${gmn}’s picking the old powers, the money that was here first. Everyone founds their own once they’re in.`;
    const sizes = T?.regions?.[f.recipe.region]?.sizes ?? {};
    const cards = handFor(`old|${stateKey(f)}|${i}`, () => oldHand(T, f, i));
    const W = cards?.length ? roomWorld(T, f) : null;
    const inner = (c) => {
      const seat = W?.seats[c.seat];
      const seatText = seat ? { text: seat.text, name: true } : "";
      return `<span class="wk-card-n">${esc(fill(c.name.text, { seat: seatText }))}</span><span class="wk-card-w">${esc(fill(T.core.templates.about, { type: c.type.text, method: c.method.text }))} ${esc(fill(T.core.templates.seat, { seat: seatText }))}</span>
        <span class="wk-card-w fd-card-want">Want: ${esc(fill(c.want.text, {}))}</span><span class="wk-card-m"><span class="wk-nudge">${esc(cap(sizes[c.size.size] ?? c.size.size))}, d${c.size.die}</span>${[c.type, c.method, c.want].some((x) => x.strange) ? '<span class="wk-mark is-strange">Strange</span>' : ""}</span>`;
    };
    return `<div class="card fd-turn${gm ? " is-mine" : ""}" data-fdk="old">${head}<p class="cc-small fd-turn-l">${lead}</p>${hand(id, f, gm, cards, "old", inner, { label: "The old powers you can deal", sureKey: `old:${id}:${i}` })}${up ? '<p class="cc-small fd-late">Time’s up. Once this one’s in, the tables deal the rest of the founding.</p>' : ""}</div>`;
  }
  // A founder's turn, a part at a time: where it sits, its three questions,
  // then three cards each for what it is, how it works, its Want and its name.
  function founderTurn(id, f, gm, up) {
    const t = f.turn;
    const i = t.i;
    const mine = t.key === myKey(id);
    const can = mine || gm;
    const name = nameOf(f, t.key);
    const n = FOUNDER.indexOf(t.part);
    const founders = f.fac.filter((x) => !x.old);
    const which = founders.indexOf(facOf(f, i)) + 1;
    const W = T ? roomWorld(T, f) : null;
    const seatK = seatAt(f, i);
    const seatName = W && seatK != null ? fill(W.seats[seatK]?.text ?? "", {}) : "";
    const q = t.part === "before" && seatName ? `Who had ${seatName.replace(/^The /, "the ")} before them?` : FQ[t.part];
    const segs = `<ol class="fd-segs" aria-hidden="true">${FOUNDER.map((p, k) => `<li class="${k < n ? "is-done" : k === n ? "is-on" : ""}"></li>`).join("")}</ol>`;
    const head = `<p class="fd-turn-k"><span>${turnWho(id, f)}</span><span class="fd-turn-n">${n + 1} of ${FOUNDER.length}</span></p>
      <p class="fd-turn-f">${mine ? "Founding your faction" : `${esc(name)}’s founding a faction`}, ${which} of ${founders.length}</p>${segs}<h3 class="fd-q">${esc(q)}</h3>`;
    const lead = mine ? FLEAD[t.part] : gm ? `${esc(name)}’s answering this. If they haven’t got a phone with them, tap one in for them.` : `${esc(name)}’s answering this. Talk it over.`;
    const sureKey = `f:${id}:${t.key}:${i}:${t.part}`;
    let body = "";
    if (!W) body = failed ? `<p class="cc-small">This phone couldn’t get the tables.</p><div class="cc-row">${btn("retry", "Try again", { cls: "button sm" })}</div>` : '<p class="cc-small" role="status">Dealing…</p>';
    else if (t.part === "f-seat") {
      const free = freeSeats(f, i).map((k) => ({ k, s: f.seats[k] }));
      body = hand(id, f, gm, free, "fseat", (c) => `<span class="wk-card-n">${esc(fill(c.s.text, {}))}</span><span class="wk-card-w">${esc(c.s.notice)}</span><span class="wk-card-m"><span class="wk-mark">${esc(keepName(c.s.role))}</span></span>`, { label: "Seats nobody holds", sureKey });
    } else if (ASKS.includes(t.part)) {
      const pickKey = `${id}|${f.id}|${i}|${t.part}`;
      const j = t.part === "never" ? null : ui.fj[pickKey] ?? null;
      const chips = t.part === "never" ? "" : `<div class="fd-chips" role="group" aria-label="${esc(t.part === "before" ? "Who had it" : "Who they owe")}">${namable(f, i).map((x) => {
        const on = j === x;
        const label = cap(calledIn(T, W, x));
        return can ? `<button type="button" class="chip pt-chip wk-chip${on ? " is-on" : ""}" data-act="fd" data-do="fj" data-j="${x}"${pressed(on)}>${esc(label)}</button>` : `<span class="chip pt-chip wk-chip is-static">${esc(label)}</span>`;
      }).join("")}${t.part === "before" ? (can ? `<button type="button" class="chip pt-chip wk-chip${gm && !mine && sureOf(`${sureKey}:nobody`) ? " is-sure" : ""}" data-act="fd" data-do="fj" data-j="-1">${gm && !mine && sureOf(`${sureKey}:nobody`) ? `Tap again: nobody, for ${esc(name)}` : "Nobody"}</button>` : '<span class="chip pt-chip wk-chip is-static">Nobody</span>') : ""}</div>`;
      if (t.part === "never" || j != null) {
        const cards = handFor(`line|${stateKey(f)}|${i}|${t.part}|${j}`, () => founderHand(T, f, i, t.part, j));
        body = `${chips}${hand(id, f, gm, cards, "fline", (c) => `<span class="wk-card-w">${esc(lineIn(T, W, i, t.part, c.text, j))}</span>${strangeMark(c)}`, { label: q, sureKey: `${sureKey}:${j}` })}
          ${ownTools(id, f, gm, "fd-found-own", (whose) => `<label class="cc-field">${whose} words <input name="text" maxlength="160" autocomplete="off" required></label>`)}`;
      } else body = `${chips}<p class="cc-small fd-pick-first">${can ? "Tap a faction, and its three lines come up." : `${esc(name)} picks a faction first.`}</p>`;
    } else {
      const cards = handFor(`card|${stateKey(f)}|${i}|${t.part}`, () => founderHand(T, f, i, t.part));
      const inner = (c) => `<span class="${t.part === "name" ? "wk-card-n" : "wk-card-w"}">${esc(t.part === "name" ? fill(c.text, { seat: seatName ? { text: seatName, name: true } : "" }) : fill(c.text, {}))}</span>${c.why ? `<span class="wk-why">${esc(c.why)}</span>` : ""}${strangeMark(c)}`;
      body = `${hand(id, f, gm, cards, "fcard", inner, { label: q, sureKey })}${ownTools(id, f, gm, "fd-found-own", (whose) => `<label class="cc-field">${whose} answer <input name="text" maxlength="${t.part === "name" ? 60 : 160}" autocomplete="off" required></label>`)}`;
    }
    return `<div class="card fd-turn${mine ? " is-mine" : ""}${gm && !mine ? " is-theirs" : ""}" data-fdk="${t.part}">${head}<p class="cc-small fd-turn-l">${lead}</p>${body}${up ? '<p class="cc-small fd-late">Time’s up. Once this faction’s founded, the tables deal the rest.</p>' : ""}</div>`;
  }
  // The last answer in the founding, with Take it back for whoever gave it,
  // or for her, till someone answers after it.
  function lastLine(id, f, gm) {
    const l = f.last;
    if (!l || (l.part !== "old" && !FOUNDER.includes(l.part))) return "";
    const me = myKey(id);
    if (!gm && l.key !== me) return "";
    const x = facOf(f, l.i);
    if (!x) return "";
    const W = T ? roomWorld(T, f) : null;
    const what = l.part === "old" ? (W ? calledIn(T, W, l.i) : "the old power") : SHORT_F[l.part];
    const whose = l.part === "old" ? "Your last old power" : l.key === me ? "Your last answer" : `${esc(first(x.name) || "Their")}’s last answer`;
    return `<div class="fd-last"><p class="cc-small">${whose}: ${esc(what)}.</p>${btn("back", sureOf(`back:${id}:${l.part}:${l.key}`) ? "Tap again to take it back" : "Take it back", { cls: "button sm fd-back", attrs: ` data-part="${esc(l.part)}" data-i="${l.i}"` })}</div>`;
  }
  // Every faction that's started, a fold each, the one that's on open.
  function boardList(id, f, gm) {
    if (!T || !f.fac?.length) return "";
    const B = roomBoard(T, f);
    const started = B.factions.filter((x) => (x.old ? f.fac[x.i].card : x.seat != null));
    const waiting = B.factions.filter((x) => !x.old && x.seat == null).map((x) => first(x.who) || "someone");
    if (!started.length && !waiting.length) return "";
    return `<h3 class="fd-h3">The factions${f.step === "found" ? " so far" : ""}</h3><div class="fd-facs">${started.map((x) => facCard(id, f, B, x)).join("")}</div>${waiting.length && f.step === "found" ? `<p class="cc-small fd-wait">Still to found one: ${esc(andList(waiting))}.</p>` : ""}`;
  }
  function facCard(id, f, B, x) {
    const on = f.turn?.i === x.i;
    const key = `fd-fac-${id}-${f.id}-${x.i}`;
    const open = on || d.isOpen(key);
    const name = (j) => cap(B.factions[j]?.name ?? "");
    const kick = x.old ? "Old power" : `${esc(first(x.who) || "Someone")}’s`;
    const lines = [];
    if (x.about || x.sits) lines.push(`<p class="fd-fac-w">${esc([x.about, x.sits].filter(Boolean).join(" "))}</p>`);
    if (x.size) lines.push(`<p class="fd-fac-s">${kitMini(x.die ?? 4, { own: "them" })}<span>${esc(cap(x.sizeWord))}, d${x.die} · Power ${x.steps}</span></p>`);
    if (x.want) lines.push(`<p class="fd-fac-w"><b>Want:</b> ${esc(x.want)}</p>`);
    if (x.res.length) lines.push(`<p class="bd-label">Resources</p><p class="fd-fac-l">${esc(x.res.join(" · "))}</p>`);
    if (x.assets.length) lines.push(`<p class="bd-label">Assets</p><ul class="fd-fac-ul">${x.assets.map((a) => `<li>${esc(a.text)}${a.power ? ' <small class="fd-pow">people who turn up</small>' : ""}</li>`).join("")}</ul>`);
    if (x.agenda) lines.push(`<p class="bd-label">Agenda</p><p class="fd-fac-s">${kitMini(x.agenda.die, { own: "them" })}<span>${esc(x.agenda.text)}</span></p>`);
    const threads = [...x.holds.map((t) => ({ ...t, line: `Toward ${name(t.to)}` })), ...x.toward.map((t) => ({ ...t, line: `${name(t.from)}, toward them` }))];
    if (threads.length) lines.push(`<p class="bd-label">Threads</p><ul class="fd-threads">${threads.map((t) => `<li class="is-${t.kind}"><span class="fd-th-k">${esc(t.line)}</span> <i>${esc(t.text)}</i></li>`).join("")}</ul>`);
    if (x.loy) lines.push(`<p class="bd-label">Loyalty</p><p class="fd-fac-w"><i>${esc(x.loy)}</i></p>`);
    const glance = x.done ? esc(x.sizeWord ? `${cap(x.sizeWord)}, d${x.die}` : "") : on ? "Being founded" : "Still to finish";
    return `<details class="cc-fold fd-fac${x.old ? " is-old" : ""}${on ? " is-on" : ""}" data-open="${esc(key)}"${open ? " open" : ""}><summary><span class="fd-fac-k">${kick}</span><h4 class="cc-fold-t">${esc(cap(x.name))}</h4><span class="cc-fold-g">${glance}</span></summary><div class="cc-fold-b">${lines.join("") || '<p class="cc-small">Nothing yet.</p>'}</div></details>`;
  }
  // The ground, folded, once the founding's on.
  function seatFold(id, f, gm) {
    if (!f.seats?.some(Boolean)) return "";
    const key = `fd-seats-${id}`;
    return `<details class="cc-fold fd-past" data-open="${esc(key)}"${d.isOpen(key) ? " open" : ""}><summary><h3 class="cc-fold-t">The ground</h3><span class="cc-fold-g">${f.seats.filter(Boolean).length} seats</span></summary><div class="cc-fold-b">${seatList(id, f, gm).replace(/^<h3[^>]*>.*?<\/h3>/, "")}</div></details>`;
  }
  // The asking, folded, once the room's past it.
  function pastFold(id, f, gm) {
    const key = `fd-asking-${id}`;
    return `<details class="cc-fold fd-past" data-open="${esc(key)}"${d.isOpen(key) ? " open" : ""}><summary><h3 class="cc-fold-t">The asking</h3><span class="cc-fold-g">${esc(pickOf(f, "holds")?.text ?? "")}</span></summary><div class="cc-fold-b">${soFar(id, f, gm).replace(/^<h3[^>]*>.*?<\/h3>/, "")}${dialsList(f)}</div></details>`;
  }
  // Out of time, or nobody in left to take what's left: her phone deals it.
  function outCard(id, f, gm, age) {
    const gmn = esc(gmName(id));
    const t = now(id);
    const said = timeUp(f, t) ? "Time’s up" : "Nobody’s left to take it";
    return `<div class="card fd-turn is-out" role="status"><p class="fd-turn-k">${said}</p>
      <p>${gm ? `The tables are dealing what’s left of ${age} on this phone.` : `The rest of ${age}’s dealt on ${gmn}’s phone.`}</p>
      ${gm ? `<div class="cc-row">${btn("rest", "Deal the rest", { cls: "button primary" })}${timeUp(f, t) ? btn("clock", "Five more minutes", { attrs: ' data-v="add" data-m="5"' }) : ""}</div>` : ""}</div>`;
  }
  // Her tools while an age is on: who's in, Deal the rest and End it.
  function toolsFold(id, f, gm, age) {
    if (!gm) return "";
    return `<details class="cc-fold fd-tools" data-open="fd-tools-${esc(id)}"${d.isOpen(`fd-tools-${id}`) ? " open" : ""}><summary><h3 class="cc-fold-t">Who’s in, Deal the rest and End it</h3><span class="cc-fold-g">${esc(andList(f.who.map((w) => first(w.name))))}</span></summary>
        <div class="cc-fold-b">${whoRows(id, f)}
        <div class="cc-row fd-go">${btn("rest", sureOf(`rest:${id}`) ? "Tap again to deal the rest" : "Deal the rest", { attrs: ' data-sure="1"' })}${btn("end", sureOf(`end:${id}`) ? "Tap again to end it" : "End it", { cls: "button danger" })}</div>
        <p class="cc-small">Deal the rest lets the tables answer everything that’s left of ${age}, this turn included. Ending it drops the lot, and nothing’s on the board.</p></div></details>`;
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
    if (RUNNING.includes(f.step) && f.turn?.key === me) return `<div class="cc-note fd-point" role="status"><p>It’s your turn in the founding, on ${where}.</p></div>`;
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

  // An answer for the turn that's on: the asking's, a seat (with its die),
  // an old power, or a founder's (with its faction).
  function answer(id, pick, extra = {}) {
    const f = foundOf(id);
    if (!f?.turn) return;
    const part = f.turn.part;
    if (push(id, { o: "fd-answer", part, pick, ...(f.turn.i != null ? { i: f.turn.i } : {}), ...extra })) {
      ui.own = "";
      ui.roll = "";
      ui.sure = "";
      if (part === "tension") ui.spin = `${f.id}|tension`;
      ui.after = id;
    }
    d.render();
  }

  // A Want goes up with what's dealt with it on this phone: the faction's
  // resources, its people and assets, and its agenda at d4.
  function withDealt(f, t, pick) {
    if (t.part !== "want" || !T) return pick;
    let got = null;
    try {
      got = wantWith(T, f, t.i, pick);
    } catch {
      got = null;
    }
    return got ? { ...pick, with: got } : pick;
  }
  // Her tap for someone else's turn takes a second, so a look never answers
  // for them. True when this tap's only armed it.
  function secondTap(id, f, key) {
    if (!gmIn(id) || f.turn.key === myKey(id) || f.turn.key === "" || sureOf(key)) return false;
    arm(key);
    d.render();
    return true;
  }
  const tidy = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  const ACT = {
    ground(el, id) {
      if (push(id, { o: "fd-ground" })) ui.focus = id;
      d.render();
    },
    age(el, id) {
      if (push(id, { o: "fd-age" })) ui.focus = id;
      d.render();
    },
    die(el, id) {
      const f = foundOf(id);
      if (!f) return;
      ui.die[`${id}|${f.id}`] = Number(el.dataset.k);
      ui.own = "";
      d.render();
    },
    seat(el, id) {
      const f = foundOf(id);
      if (f?.turn?.part !== "seat") return;
      const k = selDie(id, f);
      const c = k == null ? null : handFor(`seat|${stateKey(f)}|${k}`, () => seatHand(T, f, k))?.[Number(el.dataset.c)];
      if (!c) return;
      if (secondTap(id, f, `seat:${id}:${f.turn.key}:${k}:${el.dataset.c}`)) return;
      answer(id, c, { die: k });
    },
    old(el, id) {
      const f = foundOf(id);
      if (f?.turn?.part !== "old" || !gmIn(id)) return;
      const c = handFor(`old|${stateKey(f)}|${f.turn.i}`, () => oldHand(T, f, f.turn.i))?.[Number(el.dataset.c)];
      if (c) answer(id, c);
    },
    fseat(el, id) {
      const f = foundOf(id);
      if (f?.turn?.part !== "f-seat") return;
      const k = freeSeats(f, f.turn.i)[Number(el.dataset.c)];
      if (k == null || !T) return;
      if (secondTap(id, f, `f:${id}:${f.turn.key}:${f.turn.i}:f-seat:${el.dataset.c}`)) return;
      // Its size at Local goes up with its seat, dealt on this phone.
      answer(id, { k, size: seatSize(T, f, f.turn.i, k) });
    },
    fj(el, id) {
      const f = foundOf(id);
      const t = f?.turn;
      if (!t || !["before", "owes"].includes(t.part)) return;
      const j = Number(el.dataset.j);
      if (j < 0) {
        if (secondTap(id, f, `f:${id}:${t.key}:${t.i}:${t.part}:nobody`)) return;
        return answer(id, { j: null });
      }
      ui.fj[`${id}|${f.id}|${t.i}|${t.part}`] = j;
      ui.own = "";
      d.render();
    },
    fline(el, id) {
      const f = foundOf(id);
      const t = f?.turn;
      if (!t || !ASKS.includes(t.part)) return;
      const j = t.part === "never" ? null : ui.fj[`${id}|${f.id}|${t.i}|${t.part}`] ?? null;
      if (t.part !== "never" && j == null) return;
      const c = handFor(`line|${stateKey(f)}|${t.i}|${t.part}|${j}`, () => founderHand(T, f, t.i, t.part, j))?.[Number(el.dataset.c)];
      if (!c) return;
      if (secondTap(id, f, `f:${id}:${t.key}:${t.i}:${t.part}:${j}:${el.dataset.c}`)) return;
      answer(id, t.part === "never" ? c : { j, ...c });
    },
    fcard(el, id) {
      const f = foundOf(id);
      const t = f?.turn;
      if (!t || !CARDS.includes(t.part)) return;
      const c = handFor(`card|${stateKey(f)}|${t.i}|${t.part}`, () => founderHand(T, f, t.i, t.part))?.[Number(el.dataset.c)];
      if (!c) return;
      if (secondTap(id, f, `f:${id}:${t.key}:${t.i}:${t.part}:${el.dataset.c}`)) return;
      answer(id, withDealt(f, t, c));
    },
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
      const key = `${id}|${f.id}|${f.turn.part}|${f.turn.i ?? ""}`;
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
      const { part, die, i } = el.dataset;
      push(id, { o: "fd-back", part, ...(die != null ? { die: Number(die) } : {}), ...(i != null ? { i: Number(i) } : {}) });
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
      if (!f || !ENDS.includes(f.step) || !T) return;
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
    if (ui.sure && !["pick", "roll", "back", "rest", "carry", "end", "seat", "fseat", "fj", "fline", "fcard"].includes(doit)) ui.sure = "";
    ACT[doit]?.(el, id, e);
  }

  function submit(kind, form, fd) {
    const id = campOf(form);
    if (!id) return;
    const f = foundOf(id);
    const t = f?.turn;
    if (kind === "fd-seat-own") {
      // A seat in their own words: its name and what a stranger notices, of
      // the keep its die picked.
      const k = t?.part === "seat" ? selDie(id, f) : null;
      const name = tidy(fd.get("name"), 60);
      const notice = tidy(fd.get("notice"), 160);
      if (k == null || !name || !notice || !T) return;
      return answer(id, { own: true, text: name, notice, role: roleOf(T, f, k) }, { die: k });
    }
    if (kind === "fd-found-own") {
      if (!t) return;
      const text = tidy(fd.get("text"), t.part === "name" ? 60 : 160);
      if (!text) return;
      if (t.part === "before" || t.part === "owes") {
        const j = ui.fj[`${id}|${f.id}|${t.i}|${t.part}`];
        if (j == null) return d.toast("Pick a faction first.");
        return answer(id, { j, own: true, text });
      }
      return answer(id, withDealt(f, t, { own: true, text }));
    }
    if (kind !== "fd-own") return;
    const text = tidy(fd.get("text"), 160);
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
      const scope = app.querySelector(`[data-fd="${CSS.escape(ui.after)}"]`);
      const a = scope?.querySelector(".fd-a.is-last") ?? scope?.querySelector(".fd-turn.is-mine .fd-q, .fd-last");
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
    // The ground's dice tumble once on each phone, the first time it sees them.
    for (const pool of app.querySelectorAll(".fd-pool")) {
      const fid = pool.closest("[data-fd]")?.dataset.fd;
      const f = fid ? foundOf(fid) : null;
      if (f && !ui.rolled.has(f.id)) {
        ui.rolled.add(f.id);
        if (pool.querySelector("[data-spin]")) d.tumble(() => app.querySelector(".fd-pool"), () => {});
      }
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
