// The table screen (/table/#<code>): a campaign's live table up on a TV, a
// laptop or a screen shared on a call, read from across the room. It shows
// one round at a time, its telegraphs as big kit cards with what landed and
// what was stopped plain at a glance, the scene, and the crew with what each
// of them has done this round, in both themes.
//
// It never signs in. The code from the GM's phone (The table screen, on her
// campaign's page) rides after the #, so it never reaches a server's logs,
// and the Worker answers it with screenOf() from table-rules.js, which is
// only ever what the crew sees. Nothing goes back up but ping and view.
//
// While it's showing, it keeps the screen awake, hides the pointer when it's
// still, shrinks everything to fit a landscape screen rather than scroll,
// and keeps trying when the signal drops, saying so in the bar.

import { crest as kitCrest, die as kitDie, esc, tag as kitTag, telegraph as kitTele } from "../kit/kit.js";

// The phone's socket rules: ping this often, and a socket that hasn't
// answered in QUIET is dead. When sockets won't connect at all, the screen
// asks plainly every POLL.
const BEAT = 25000;
const QUIET = 10000;
const POLL = 15000;
const CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;

const DATA = (() => {
  try {
    return JSON.parse(document.getElementById("zi-screen")?.textContent || "{}");
  } catch {
    return {};
  }
})();
// The six crew's archetypes, by who they are, for the crests of anyone who
// started as one of them.
const CREW = DATA.crew ?? {};
const app = document.getElementById("ts");

const MARK = '<svg class="mark" width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path class="edge" d="M16 2.5 L29.5 16 L16 29.5 L2.5 16 Z"></path><path class="core" d="M16 10 L22 16 L16 22 L10 16 Z"></path></svg>';
const ICON = {
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
};

const words = (n) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
// "The left Warden" in the middle of a sentence, the way table-rules.js says it.
const lower = (name) => String(name ?? "").replace(/^(A|An|The|His|Her|Their|Its) /, (m) => m.toLowerCase());
// A sentence that ends in a full stop, however the GM wrote it.
const stop = (s) => `${String(s ?? "").trim().replace(/[.\s]+$/, "")}.`;
const norm = (s) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const grouped = (code, sep = " ") => (code.match(/.{1,4}/g) ?? []).join(sep);

const st = { code: "", view: null, why: "", note: "", typed: "", seen: null };
const net = { ws: null, open: false, tries: 0, failed: 0, timer: 0, steady: 0, beat: 0, wait: 0, poll: 0, down: false, asking: false };

// ------------------------------------------------------------ the words

const MORE = { resolve: "1 Resolve", held: "held last round", hiding: "out of hiding", fired: "fired-up Confidence", trait: "a trait or a Boon" };
const GOOD = new Set(["stopped", "held", "clear"]);
const BAD = new Set(["hit", "landed", "through"]);
// The best die on an answer: the one that won it, or the highest that didn't.
const best = (a) => Math.max(...a.dice.filter((x) => x.out === "beat" || x.out === "won").map((x) => x.total), ...(a.won ? [] : a.dice.map((x) => x.total)));
const withWho = (a) => (a.with?.length ? `, with ${andList(a.with)} in it,` : "");
const against = (t) => (t.kind === "fear" ? "Confidence" : "Defend");
// Archetypes for someone's crest: the book's for one of the crew, their own
// build's otherwise, and whatever they've grown in downtime.
const archOf = (p) => (p ? [...(CREW[p.crew] ?? p.arch ?? []), ...(p.grown ?? [])] : []);
const crestOf = (arch) => kitCrest(arch, { size: "sm", strict: false });

// What one at a stake or an event did when it landed, in a sentence.
function didSaid(t) {
  const did = t.did;
  if (!did) return "";
  const name = t.at;
  if (did.none) return { won: `the crew had ${name} already, so it did nothing`, lost: `${name} was lost already, so it did nothing`, done: `${name} had happened already, so it did nothing`, full: `${name} can’t hold another tag, so it did nothing`, clock: `${name} hasn’t got a clock to drop, so it did nothing` }[did.none] ?? `${name}’s gone from the scene, so it did nothing`;
  if (did.tag) return t.ifLands.replace(/ goes in the way /, " is in the way ").replace(/^it’s a new tag/, "there’s a new tag");
  if (did.out === "lost") return `${name}’s clock ran out, so it’s lost`;
  if (did.out === "done") return did.clock ? `the scene clock’s run out${did.what ? `: ${did.what.replace(/[.\s]+$/, "")}` : ""}` : `${name} happened${did.what ? `: ${did.what.replace(/[.\s]+$/, "")}` : ""}`;
  return t.on === "stake" ? `${name}’s clock dropped to d${did.to}` : `${name} dropped to d${did.to}`;
}

// The card's Only one answer line. One at the scene says what it does if it lands.
const oneOf = (t) => (t.aim === "stake" ? (t.ifLands ? `If it lands, ${t.ifLands}.` : "") : t.one);

// What goes at the foot of the card while it's coming.
function whenOf(t, v) {
  if (t.state !== "coming") return "";
  if (t.aim === "place") return t.kind === "fear" ? "Hits whoever’s there, against Confidence" : "Hits whoever’s there when it lands";
  if (t.aim === "stake") return "";
  if (t.icp) return `${t.icp.name} took it for ${t.at}`;
  return t.kind === "fear" ? "Lands on Confidence at the end of the round" : "";
}

// How it went, in a band across the bottom of the card: the word to read from
// across the room, then the roll that settled it.
function verdict(t) {
  const s = t.state;
  if (s === "coming") return "";
  const a = t.ans;
  const dice = a ? a.dice.map((x) => kitDie(x.size, { face: x.total, hide: true, state: x.out === "under" || x.out === "tie" ? "low" : "" })).join("") : "";
  let word = "";
  let lines = [];
  if (t.aim === "stake") {
    if (s === "stopped") [word, lines] = ["Stopped", [`${a.name} answered it${withWho(a)} with ${a.act}: ${best(a)} against its ${a.opp}.`]];
    else if (s === "hit") [word, lines] = ["Landed then and there", [`${a.name}’s ${a.act}${withWho(a)} came up ${best(a)} against its ${a.opp}.`, didSaid(t) ? stop(cap(didSaid(t))) : ""]];
    else [word, lines] = ["Landed", [didSaid(t) ? stop(cap(didSaid(t))) : ""]];
  } else if (t.aim === "place") {
    const inIt = (t.there ?? []).filter((p) => p.in);
    const names = andList(inIt.map((p) => p.name));
    if (s === "stopped") [word, lines] = ["Stopped", [`${a.name} answered it${withWho(a)} with ${a.act}: ${best(a)} against its ${a.opp}, so it missed everyone.`]];
    else if (s === "hit") [word, lines] = ["Landed then and there", [`${a.name}’s ${a.act}${withWho(a)} came up ${best(a)} against its ${a.opp}, ${inIt.length ? `so it hit ${names} with no defence.` : `but nobody was ${t.where}.`}`]];
    else if (s === "clear") [word, lines] = ["Landed on nobody", [`Nobody was ${t.where}.`]];
    else {
      word = s === "landed" ? `Landed on ${names}` : s === "held" ? "Stopped when it landed" : "It got through";
      // Everyone still to roll in one line, then how it went for each of the rest.
      const toRoll = inIt.filter((p) => !p.def).map((p) => p.name);
      lines = [
        toRoll.length ? `${andList(toRoll)} ${toRoll.length === 1 ? "rolls" : "roll"} When it lands.` : "",
        ...inIt.filter((p) => p.def).map((p) => (p.def.stopped ? `${p.name} stopped it: ${p.def.mine} against its ${p.def.v}.` : `It got through to ${p.name}: ${p.def.mine == null ? `no die left on their ${against(t)}` : `${p.def.mine} against its ${p.def.v}`}.`)),
      ];
    }
  } else {
    // Whoever it lands on: whoever took it for them, or whoever it's aimed at.
    const on = t.icp ? t.icp.name : t.at;
    const took = t.icp ? `${t.icp.name} took it for ${t.at}. ` : "";
    if (s === "stopped") [word, lines] = ["Stopped", [`${a.name} answered it${a.k !== t.k ? ` for ${t.at}` : ""}${withWho(a)} with ${a.act}: ${best(a)} against its ${a.opp}.`]];
    else if (s === "hit") {
      const own = a.k != null && a.k === (t.icp ? t.icp.k : t.k);
      [word, lines] = ["Landed then and there", [`${a.name}’s ${a.act}${withWho(a)} came up ${best(a)} against its ${a.opp}, ${own ? `so it hit ${on} with no defence.` : "so it landed with no defence."}`]];
    } else if (s === "landed") [word, lines] = [`Landed on ${on}`, [`${took}${on} rolls When it lands.`]];
    else if (s === "held") [word, lines] = ["Stopped when it landed", [`${took}${on}’s ${against(t)} came up ${t.def.mine} against its ${t.def.v}.`]];
    else [word, lines] = ["It got through", [`${took}${t.def.mine == null ? `There was no die left on ${on}’s ${against(t)} for it.` : `${on}’s ${against(t)} came up ${t.def.mine} against its ${t.def.v}.`}`]];
  }
  lines = lines.filter(Boolean);
  return `<div class="ts-v ${GOOD.has(s) ? "is-good" : "is-bad"}"><div class="ts-vt"><p class="ts-vw">${esc(word)}</p>${lines.map((l) => `<p class="ts-vl">${esc(l)}</p>`).join("")}</div>${dice ? `<span class="ts-vd" aria-hidden="true">${dice}</span>` : ""}</div>`;
}

// One at a place: who's in it and who's out of it, by crest and name.
function there(t, v) {
  if (t.aim !== "place") return "";
  const chip = (p) => `<li class="ts-chip${p.in ? "" : " is-out"}"><span aria-hidden="true">${crestOf(archOf(v.crew[p.k]))}</span>${esc(p.name)}</li>`;
  const inIt = (t.there ?? []).filter((p) => p.in);
  const out = (t.there ?? []).filter((p) => !p.in);
  return `<div class="ts-there">${inIt.length ? `<p class="ts-tk">${esc(cap(t.where))}</p><ul class="ts-chips">${inIt.map(chip).join("")}</ul>` : `<p class="ts-tk">Nobody’s ${esc(t.where)}</p>`}${out.length ? `<p class="ts-tk">Out of it</p><ul class="ts-chips">${out.map(chip).join("")}</ul>` : ""}</div>`;
}

// One thing one of the crew did this round, in a line.
function actLine(a) {
  if (a.k === "answer") return `answering ${lower(a.who)} with ${a.act}: ${a.won ? "stopped" : "it landed"}`;
  if (a.k === "join") return a.by ? `in on ${lower(a.who)} with ${a.by}: ${a.won ? "stopped" : "it landed"}` : `${a.act} into whoever answers ${lower(a.who)}`;
  if (a.k === "work") {
    const d = a.did;
    const did = d ? (d.won ? `won it${d.tag ? `, ${d.tag} gone` : ""}` : d.tag ? `${d.tag} gone` : d.out ? "driven, and it happens" : d.to != null ? `${a.aim === "drive" ? "driven" : "slowed"} to d${d.to}` : "it held") : "it held";
    return `${a.ev ? "engaging" : "working"} ${lower(a.name || "something on the scene")} with ${a.act}: ${did}`;
  }
  if (a.k === "ground") return `using ${lower(a.name || "the ground")}${a.act ? `, with ${a.act}` : ""}`;
  if (a.k === "took") return `took ${lower(a.who)} for ${a.for}${a.free ? ", free" : ""}`;
  return a.act;
}

// ------------------------------------------------------------ drawing

const light = () => document.documentElement.getAttribute("data-theme") === "light";
const canFull = () => Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
function tools() {
  const full = canFull() ? `<button type="button" class="ts-tool" data-do="full" aria-label="${document.fullscreenElement ? "Leave full screen" : "Full screen"}">${document.fullscreenElement ? ICON.shrink : ICON.full}</button>` : "";
  return `<div class="ts-tools">${full}<button type="button" class="ts-tool" data-do="theme" aria-label="${light() ? "Switch to dark mode" : "Switch to light mode"}">${light() ? ICON.moon : ICON.sun}</button></div>`;
}

function bar(v) {
  const name = v ? `<div class="ts-title"><p class="ts-k">Table screen</p><h1>${esc(v.name || "The campaign")}</h1></div>` : "";
  const down = v && net.down ? '<p class="ts-net" role="status"><span class="ts-dot" aria-hidden="true"></span>No signal. This is how it was, and it’s trying again.</p>' : "";
  return `<header class="ts-bar"><a class="ts-brand" href="/">${MARK}<span>Zi’Dara</span></a>${name}${down}${tools()}</header>`;
}

// No code yet, or one that didn't work: where to type it in.
function entry() {
  const why = {
    shape: "That code doesn’t look right. It’s 12 letters and numbers.",
    bad: st.note || "That code didn’t work. Your GM might’ve reset it, so ask them for the new one.",
    reset: "Your GM reset the screen’s link, so this one’s stopped. Type the new code in to carry on.",
    ended: "That campaign’s ended, so there’s nothing more to show.",
    many: "The table’s up on eight screens already, so this one’s stopped. Close one of the others and open it again.",
    off: st.note || "Live play isn’t switched on here yet.",
  }[st.why] ?? st.note;
  const opening = st.code && !st.why;
  return `${bar(null)}<div class="ts-entry-wrap"><section class="ts-entry card" aria-labelledby="ts-eh">
      <p class="kicker">Live play</p><h1 id="ts-eh">The table screen</h1>
      <p class="lede">Put the round up where the whole table can see it, on a TV, a laptop or a screen you share on a call. It shows the telegraphs, the scene and what everyone’s done, and only ever what the crew sees.</p>
      ${opening ? `<p class="ts-opening" role="status">${esc(st.note || (net.down ? "No signal. It’ll open as soon as it’s back." : "Opening the table…"))}</p>` : `${why ? `<p class="ts-warn" role="alert">${esc(why)}</p>` : ""}
      <form class="ts-form" data-form="code" novalidate>
        <label for="ts-code">The screen’s code</label>
        <div class="ts-row"><input id="ts-code" name="code" class="ts-input" value="${esc(st.typed)}" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" aria-describedby="ts-hint"><button type="submit" class="button primary">Open it</button></div>
        <p id="ts-hint" class="ts-hint">The GM’s got it. It’s under The table screen on the campaign’s page, in Characters.</p>
      </form>`}
    </section></div>`;
}

function card(t, v, i) {
  const was = st.seen?.get(t.id);
  const motion = st.seen && was === undefined ? " is-new" : was && was !== t.state ? " is-moved" : "";
  const person = t.aim === "someone" && t.k != null ? v.crew[t.k] : null;
  const arch = t.aim === "someone" ? (archOf(person).length ? archOf(person) : t.arch ?? []) : null;
  const face = t.ans ? t.ans.opp : t.def ? t.def.v : (t.there ?? []).find((p) => p.def)?.def.v ?? null;
  return `<li class="ts-tg is-${t.state}${motion}" style="--i:${i}">${kitTele({ who: t.who, does: t.does, at: t.at, atCrest: arch, aim: t.aim, d: t.d, round: v.round.n, one: oneOf(t), face, state: t.state === "coming" ? "" : t.state, when: whenOf(t, v), extra: there(t, v) + verdict(t), strict: false })}</li>`;
}

function roundPart(v) {
  const r = v.round;
  if (!r) {
    return `<h2 id="ts-rh" class="visually-hidden">The round</h2><div class="ts-wait"><p class="ts-wait-k">${v.fight > 1 ? "That fight’s over" : "No round on yet"}</p><p class="ts-wait-l">When the GM sends a round, its telegraphs come up here.</p></div>`;
  }
  const count = (set) => r.tele.filter((t) => set.has(t.state)).length;
  const coming = r.tele.filter((t) => t.state === "coming").length;
  const tally = [
    coming ? `<li class="is-coming"><b>${coming}</b> coming</li>` : "",
    count(GOOD) ? `<li class="is-good"><b>${count(GOOD)}</b> stopped</li>` : "",
    count(BAD) ? `<li class="is-bad"><b>${count(BAD)}</b> landed</li>` : "",
  ].join("");
  const state = r.over ? "It’s over. Here’s how it went." : coming ? "Answer what’s coming at you on your phone." : "Everything’s answered.";
  const body = r.tele.length
    ? `<ul class="ts-teles" data-n="${Math.min(r.tele.length, 5)}">${r.tele.map((t, i) => card(t, v, i)).join("")}</ul>`
    : '<div class="ts-wait is-small"><p class="ts-wait-l">Nothing’s telegraphed this round, so it’s the scene’s clocks that move.</p></div>';
  return `<div class="ts-rhead"><h2 id="ts-rh">Round ${r.n}</h2>${tally ? `<ul class="ts-tally" aria-label="This round">${tally}</ul>` : ""}<p class="ts-rstate">${state}</p></div>${body}`;
}

// A stake's or an event's line for the round: who's at it, what its die came
// up, or what the end of the round did to it.
function elState(el, v, stake) {
  const r = v.round;
  const who = el.at.map((p) => p.name);
  if (el.out === "won") return "The crew’s got it.";
  if (el.out === "lost") return "Lost. The clock ran out.";
  if (el.out === "done") return el.what ? `It’s happened: ${stop(el.what)}` : "It’s happened.";
  if (who.length) {
    return r?.over
      ? `${andList(who)} ${stake ? "worked" : "engaged"} it in round ${r.n}${el.roll != null ? `, and its die came up ${el.roll}` : ""}.`
      : `${andList(who)} ${who.length === 1 ? "is" : "are"} at it this round${el.roll != null ? `, and its die came up ${el.roll}, which stands` : ""}.`;
  }
  if (el.moved) return `Nobody ${stake ? "worked" : "engaged"} it, so ${stake ? "its clock" : "it"} stepped down to d${el.moved.to}.`;
  return "";
}

function scenePart(v) {
  const s = v.scene;
  const clocks = s.events.filter((e) => e.scene);
  const events = s.events.filter((e) => !e.scene);
  const line = (text, cls = "ts-est") => (text ? `<p class="${cls}">${esc(text)}</p>` : "");
  const clock = (el) => {
    const named = !/^(the )?scene clock$/i.test(el.name.trim());
    return `<div class="ts-clock${el.out ? ` is-${el.out}` : ""}">${kitDie(el.d, { own: "harm", label: `The scene clock, a d${el.d}` })}<div class="ts-elb"><p class="ts-k is-harm">Scene clock</p>${named ? `<h3 class="ts-eln">${esc(el.name)}</h3>` : ""}${el.out ? "" : line(el.what ? `When it runs out: ${stop(el.what)}` : "", "ts-ewhat")}${line(elState(el, v, false))}</div></div>`;
  };
  const stake = (el) => `<li class="ts-el is-stake${el.out ? ` is-${el.out}` : ""}"><div class="ts-el-top">${kitDie(el.d, { own: "them", label: `${el.name}, Challenge ${el.c}, a d${el.d}` })}<div class="ts-elb"><h4 class="ts-eln">${esc(el.name)}</h4><p class="ts-esub">Challenge ${el.c}${el.note ? ` · ${esc(el.note)}` : ""}</p></div>${el.clock ? `<span class="ts-eclock">${kitDie(el.clock, { own: "harm", hide: true })}<small>clock</small></span>` : ""}</div>
      ${el.tags.length ? `<div class="ts-tags">${el.tags.map((g) => kitTag(g.name, { kind: g.gone ? "threat gone" : "threat" })).join("")}</div>` : ""}${line(elState(el, v, true))}</li>`;
  const event = (el) => `<li class="ts-el is-event${el.out ? ` is-${el.out}` : ""}"><div class="ts-el-top">${kitDie(el.d, { own: "them", label: `${el.name}, a d${el.d}` })}<div class="ts-elb"><h4 class="ts-eln">${esc(el.name)}</h4>${el.out ? "" : line(el.what ? `When it steps past d2: ${stop(el.what)}` : "", "ts-esub")}</div></div>${line(elState(el, v, false))}</li>`;
  const ground = (el) => `<li><span class="ts-gn">${esc(el.name)}</span>${el.text ? `<span class="ts-gt">${esc(el.text)}</span>` : ""}${el.at.length ? `<span class="ts-gw">${esc(andList(el.at.map((p) => p.name)))} ${el.at.length === 1 ? "is" : "are"} using it</span>` : ""}</li>`;
  return `<div class="ts-shead">${s.place ? `<p class="ts-k">The scene</p><h2 id="ts-sh">${esc(s.place)}</h2>` : '<h2 id="ts-sh">The scene</h2>'}</div>
    ${clocks.map(clock).join("")}
    ${s.stakes.length ? `<h3 class="ts-sub">${s.stakes.length === 1 ? "The stake" : "The stakes"}</h3><ul class="ts-els">${s.stakes.map(stake).join("")}</ul>` : ""}
    ${events.length ? `<h3 class="ts-sub">${events.length === 1 ? "An event" : "Events"}</h3><ul class="ts-els">${events.map(event).join("")}</ul>` : ""}
    ${s.ground.length ? `<h3 class="ts-sub">The ground</h3><ul class="ts-ground">${s.ground.map(ground).join("")}</ul>` : ""}`;
}

function crewPart(v) {
  const r = v.round;
  const person = (p) => {
    const lines = p.acts.map(actLine);
    const on = r && !r.over && p.left != null;
    const left = on ? (p.left ? `${p.left === 1 ? "One action" : `${cap(words(p.left))} actions`} left` : "Done this round") : "";
    const more = p.more.length ? `${p.more.length === 1 ? "An extra action" : `${cap(words(p.more.length))} extra actions`}: ${p.more.map((k) => MORE[k] ?? k).join(", ")}` : "";
    const none = !r ? "" : r.over ? "Didn’t act this round" : "Hasn’t acted yet";
    return `<li class="ts-p card${on && !p.left ? " is-done" : ""}"><span class="ts-pc" aria-hidden="true">${crestOf(archOf(p))}</span><div class="ts-pb"><h3 class="ts-pn">${esc(p.name)}</h3>${lines.length ? `<ul class="ts-pa">${lines.map((x) => `<li>${esc(cap(x))}</li>`).join("")}</ul>` : none ? `<p class="ts-pq">${none}</p>` : ""}${left || more ? `<p class="ts-pl">${esc([left, more].filter(Boolean).join(" · "))}</p>` : ""}</div></li>`;
  };
  return `<h2 id="ts-ch" class="visually-hidden">The crew</h2><ul class="ts-people">${v.crew.map(person).join("")}</ul>`;
}

function screen(v) {
  const s = v.scene;
  const scene = s.stakes.length + s.events.length + s.ground.length > 0;
  return `${bar(v)}<div class="ts-main${scene ? " has-scene" : ""}">
      <section class="ts-round" aria-labelledby="ts-rh">${roundPart(v)}</section>
      ${scene ? `<section class="ts-scene card" aria-labelledby="ts-sh">${scenePart(v)}</section>` : ""}
      ${v.crew.length ? `<section class="ts-crew" aria-labelledby="ts-ch">${crewPart(v)}</section>` : ""}
    </div>`;
}

function render() {
  const v = st.view;
  document.title = v?.name ? `${v.name} · The table screen · Zi’Dara` : "The table screen · Zi’Dara";
  const focused = document.activeElement?.id === "ts-code";
  app.innerHTML = v ? screen(v) : entry();
  document.documentElement.classList.toggle("ts-live", Boolean(v));
  if (focused) document.getElementById("ts-code")?.focus();
  // What each telegraph was, so the next view can tell what's new and what's moved.
  if (v) st.seen = new Map((v.round?.tele ?? []).map((t) => [t.id, t.state]));
  else st.seen = null;
  requestAnimationFrame(fit);
}

// A landscape screen shows it all at once (the same question's in
// table-screen.css). The round and the crew are in rem, so shrinking the root
// a step at a time shrinks them till they fit, and the scene's in em, so it
// shrinks on its own, however long it is.
const WIDE = matchMedia("(min-width: 900px) and (min-height: 480px) and (min-aspect-ratio: 6/5)");
let fitting = 0;
// The biggest size between lo and 1 that fits, found by halving.
function biggest(set, fits, lo) {
  set(1);
  if (fits()) return true;
  set(lo);
  if (!fits()) return false;
  let hi = 1;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    set(mid);
    if (fits()) lo = mid;
    else hi = mid;
  }
  set(lo);
  return true;
}
function fit() {
  const root = document.documentElement;
  const scene = app.querySelector(".ts-scene");
  root.classList.remove("ts-tall");
  root.style.setProperty("--ts-fit", "1");
  scene?.style.setProperty("--ts-sfit", "1");
  if (!st.view || !WIDE.matches) return;
  const over = (el) => Boolean(el) && el.scrollHeight > el.clientHeight + 1;
  const round = app.querySelector(".ts-round");
  const page = biggest((k) => root.style.setProperty("--ts-fit", k.toFixed(4)), () => !over(round) && root.scrollHeight <= innerHeight + 1, 0.5);
  // A round too big for one screen scrolls instead, at a size that still reads.
  if (!page) {
    root.classList.add("ts-tall");
    root.style.setProperty("--ts-fit", "0.75");
    return;
  }
  if (scene && !biggest((s) => scene.style.setProperty("--ts-sfit", s.toFixed(4)), () => !over(scene), 0.5)) scene.classList.add("is-tall");
}
addEventListener("resize", () => {
  cancelAnimationFrame(fitting);
  fitting = requestAnimationFrame(fit);
});

// ------------------------------------------------------------ the table

function take(m, { plain = false } = {}) {
  // An answer to a plain ask can arrive after a newer one off the socket.
  if (plain && st.view && m.fight === st.view.fight && m.v < st.view.v) return;
  st.view = m;
  st.why = "";
  st.note = "";
  net.down = false;
  render();
  wake();
}

// The screen's done with this code: reset, ended, or it never worked.
function gone(why, note = "") {
  shut();
  st.view = null;
  st.why = why;
  st.note = note;
  render();
  sleep();
}

function shut() {
  const ws = net.ws;
  net.ws = null;
  net.open = false;
  for (const k of ["timer", "steady", "wait"]) clearTimeout(net[k]);
  clearInterval(net.beat);
  clearInterval(net.poll);
  net.poll = 0;
  try {
    ws?.close();
  } catch {}
}

// The view once, plainly: to open the table, and whenever the socket won't.
async function ask() {
  if (!st.code || net.asking) return false;
  net.asking = true;
  const code = st.code;
  let res = null;
  let body = null;
  try {
    res = await fetch(`/api/screen/${encodeURIComponent(code)}`, { headers: { accept: "application/json" }, cache: "no-store" });
    body = await res.json().catch(() => null);
  } catch {}
  net.asking = false;
  if (code !== st.code) return false;
  if (res?.ok && body?.crew) {
    take(body, { plain: true });
    return true;
  }
  if (res?.status === 404) gone("bad", body?.error ?? "");
  else if (res?.status === 503) gone("off", body?.error ?? "");
  else {
    // No signal, or too many tries: say so, and keep what's on screen.
    net.down = !res;
    st.note = res?.status === 429 ? body?.error ?? "" : st.note;
    render();
  }
  return false;
}

async function begin() {
  if (await ask()) connect();
  else if (st.code && !st.why) later();
}

function socketUrl() {
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/screen/${encodeURIComponent(st.code)}`;
}
function connect() {
  if (net.ws || !st.code || st.why || document.visibilityState === "hidden") return;
  let ws;
  try {
    ws = new WebSocket(socketUrl());
  } catch {
    return later();
  }
  net.ws = ws;
  let opened = false;
  ws.addEventListener("open", () => {
    if (net.ws !== ws) return;
    opened = true;
    net.open = true;
    net.failed = 0;
    clearInterval(net.poll);
    net.poll = 0;
    // The backoff starts again only once a socket's stayed up a while.
    clearTimeout(net.steady);
    net.steady = setTimeout(() => {
      if (net.ws === ws) net.tries = 0;
    }, 10000);
    clearInterval(net.beat);
    net.beat = setInterval(() => {
      if (net.ws === ws && net.open) ping(ws);
    }, BEAT);
  });
  ws.addEventListener("message", (e) => {
    if (net.ws !== ws) return;
    if (e.data === "pong") return clearTimeout(net.wait);
    let m = null;
    try {
      m = JSON.parse(e.data);
    } catch {}
    if (m?.t === "view") take(m);
    else if (m?.t === "out") gone(m.why === "ended" ? "ended" : "reset");
  });
  ws.addEventListener("close", (e) => {
    if (net.ws !== ws) return;
    net.ws = null;
    net.open = false;
    clearTimeout(net.steady);
    clearTimeout(net.wait);
    clearInterval(net.beat);
    if (st.why) return;
    if (e.code === 4000) return gone("many");
    net.down = true;
    // A socket that never opened might've been turned away: asking plainly
    // says why, and gets the table meanwhile. Twice and it keeps asking.
    if (!opened) {
      net.failed += 1;
      ask();
      if (net.failed >= 2 && !net.poll) net.poll = setInterval(() => !net.open && ask(), POLL);
    }
    later();
    render();
  });
}
function later() {
  clearTimeout(net.timer);
  const ms = Math.min(30000, 1000 * 2 ** Math.min(5, net.tries));
  net.tries += 1;
  net.timer = setTimeout(() => (st.view ? connect() : begin()), ms);
}
function ping(ws) {
  try {
    ws.send("ping");
  } catch {}
  clearTimeout(net.wait);
  net.wait = setTimeout(() => {
    if (net.ws === ws) ws.close();
  }, QUIET);
}

// A new code from the address, or none.
function start() {
  shut();
  net.tries = 0;
  net.failed = 0;
  net.down = false;
  st.view = null;
  st.seen = null;
  st.note = "";
  st.why = "";
  let raw = "";
  try {
    raw = decodeURIComponent(location.hash.slice(1));
  } catch {}
  const code = norm(raw);
  st.code = CODE.test(code) ? code : "";
  if (raw && !st.code) {
    st.why = "shape";
    st.typed = raw;
  }
  render();
  if (st.code) begin();
}

// ------------------------------------------------------------ the room

// The screen stays awake while it's showing the table.
let lock = null;
let locking = false;
async function wake() {
  if (lock || locking || !st.view || document.visibilityState !== "visible" || !navigator.wakeLock) return;
  locking = true;
  try {
    lock = await navigator.wakeLock.request("screen");
    lock.addEventListener("release", () => {
      lock = null;
    });
  } catch {
    lock = null;
  }
  locking = false;
}
function sleep() {
  try {
    lock?.release();
  } catch {}
  lock = null;
}

// The pointer hides once it's been still a few seconds.
let still = 0;
addEventListener("pointermove", () => {
  document.documentElement.classList.remove("ts-still");
  clearTimeout(still);
  still = setTimeout(() => document.documentElement.classList.add("ts-still"), 3000);
}, { passive: true });

function toggleTheme() {
  const root = document.documentElement;
  const toLight = !light();
  if (toLight) root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem("zi-theme", toLight ? "light" : "dark");
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", toLight ? "#f5f2f7" : "#120d18");
  render();
  app.querySelector('[data-do="theme"]')?.focus();
}
async function toggleFull() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {}
}
document.addEventListener("fullscreenchange", () => {
  const b = app.querySelector('[data-do="full"]');
  if (!b) return;
  b.setAttribute("aria-label", document.fullscreenElement ? "Leave full screen" : "Full screen");
  b.innerHTML = document.fullscreenElement ? ICON.shrink : ICON.full;
});

app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-do]");
  if (b?.dataset.do === "theme") toggleTheme();
  if (b?.dataset.do === "full") toggleFull();
});
app.addEventListener("input", (e) => {
  if (e.target.id === "ts-code") st.typed = e.target.value;
});
app.addEventListener("submit", (e) => {
  const form = e.target.closest('[data-form="code"]');
  if (!form) return;
  e.preventDefault();
  const code = norm(form.elements.code.value);
  st.typed = form.elements.code.value;
  if (!CODE.test(code)) {
    st.why = "shape";
    render();
    document.getElementById("ts-code")?.focus();
    return;
  }
  const hash = `#${grouped(code, "-")}`;
  if (location.hash === hash) start();
  else location.hash = hash;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  wake();
  if (!st.code || st.why) return;
  if (!net.ws) {
    clearTimeout(net.timer);
    st.view ? connect() : begin();
  } else if (net.open) {
    // A screen that's been asleep might have a dead socket, or have missed a change.
    ping(net.ws);
    try {
      net.ws.send("view");
    } catch {}
  }
});
addEventListener("online", () => {
  if (!st.code || st.why || net.ws) return;
  clearTimeout(net.timer);
  net.tries = 0;
  st.view ? connect() : begin();
});
addEventListener("offline", () => {
  net.down = true;
  render();
});
addEventListener("hashchange", start);

start();
