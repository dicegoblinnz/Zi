// The faction turn on every phone in a campaign (stage 2 of notes/worlds-plan.md).
//
// It's at the top of the World screen and the World tab (world.js), and it's
// kept with the campaign's live table (table.js and the Table object), so
// every change reaches every phone in the campaign as it's made, and each
// phone keeps the last of it for when there's no signal. turn-rules.js has
// the rules both sides use.
//
// The GM runs it a step at a time, the way the book does: hiring, then every
// faction's action telegraphed at once, then the crew's action, then the
// landing, Obstructs first. Her phone rolls the factions' dice, the crew's
// phone rolls the crew's and whatever it's going at, and anyone can tap in
// real dice instead. Each action that lands changes the cards in a tap: the
// board through world.js and the party sheet through party.js, so only she
// ever changes the board.
import { BONDS, OUTCOMES, find, minisOf, moneyOf, standingOf, stepsOf } from "./board.js";
import { diceLabel, rollDie, stepsToDice } from "./dice.js";
import { lower } from "./table-rules.js";
import { MAX, STEPS, allDice, allFaces, best, crewDice, crewResult, crewSteps, defOf, diceOf, landed, rolled, shapeOf, spentOf, stateOfAct } from "./turn-rules.js";
import { die as kitDie } from "../kit/kit.js";

const SIZES = [2, 4, 6, 8, 10, 12];
const STEP_NAMES = { hire: "Hiring", tele: "Telegraphs", crew: "The crew", land: "Landing" };
const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const newId = () => `${random(8)}${Date.now().toString(36).slice(-4)}`;
const online = () => navigator.onLine !== false;
const time = (ms) => new Date(ms).toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "";
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "");
const poss = (name) => `${name}’s`;
// Someone's words, starting a phrase partway through a sentence.
const midway = (t) => String(t ?? "").charAt(0).toLowerCase() + String(t ?? "").slice(1);
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
const stepsSay = (n) => `${n} ${n === 1 ? "step" : "steps"}`;
// What a faction's doing, as the card's band says it.
const WHAT_NAMES = { agenda: "Its agenda", write: "A new agenda", comes: "Comes for the crew" };
// The crew's moves on a faction, as the book names them, then the rest.
const MOVE_NAMES = { "Set back": "Set back its agenda", "Work for it": "Work for it", Goal: "Chase the Goal", Project: "Work a project", Else: "Something else" };

export function makeTurn(d) {
  const { esc } = d;
  const BOOK = d.W?.turn ?? { does: [], outcomes: [], comes: [], moves: [] };
  const AGENDAS = d.W?.build?.agendas ?? [];
  // sure: a button waiting on its second tap. spin: the roll this phone's just
  // made, which tumbles once.
  const ui = { sure: "", spin: null };

  // ------------------------------------------------------------ what this phone's got

  const T = () => d.table();
  const local = (id) => T().local(id);
  const turnOf = (id) => local(id).turn ?? null;
  const lastOf = (id) => local(id).last ?? null;
  const gmIn = (id) => T().roleIn(id) === "gm";
  const boardOf = (id) => d.world().docIn(id);
  const sheetOf = (id) => d.party().docIn(id);
  const crewOf = (id) => d.party().crewIn(id);
  const gmName = (id) => cap(T().gmName(id));
  const me = () => d.sync.me?.id ?? null;
  // Who this phone's player plays in the campaign, if they're a player in it.
  const mine = (id) => {
    const w = T().whoIn(id);
    return w.role === "player" && w.ch ? { user: w.user, ch: w.ch, cname: w.cname || "Your character" } : null;
  };
  const push = (id, op) => T().push(id, op);
  const crewName = (id) => crewOf(id).name || "The crew";
  // The crew's extra resources still to spend this downtime.
  const extrasLeft = (id, t) => Math.max(0, crewOf(id).money.extra - spentOf(t));

  const them = (dice, opts = {}) => dice.map((x, i) => kitDie(x, { own: "them", hide: true, cls: i ? "is-next" : "", ...opts })).join("");
  const ruleLink = (rid, text) => `<button type="button" class="pt-reword pt-rule" data-act="rule" data-r="${rid}">${text}</button>`;
  const btn = (doit, label, { cls = "button", attrs = "", disabled = false } = {}) => `<button type="button" class="${cls}" data-act="ft" data-do="${doit}"${attrs}${disabled ? " disabled" : ""}>${label}</button>`;
  const choice = (doit, on, label, sub = "", attrs = "") => `<button type="button" class="cc-line" data-act="ft" data-do="${doit}"${attrs}${pressed(on)}><span class="tick" aria-hidden="true"></span><span>${label}${sub ? ` <small>${sub}</small>` : ""}</span></button>`;
  const sizesRow = (doit, on, own = "them") => `<div class="tg-sizes">${SIZES.map((x) => `<button type="button" class="tg-size" data-act="ft" data-do="${doit}" data-d="${x}"${pressed(on === x)} aria-label="A d${x}">${kitDie(x, { own, hide: true, bare: true })}<span>d${x}</span></button>`).join("")}</div>`;
  const head = (title, kicker = "") => `<div class="dlg-head"><div class="cc-live">${kicker ? `<p class="kicker tg-k">${kicker}</p>` : ""}<h2 id="dlg-title">${title}</h2></div><button type="button" class="cc-x" data-act="close" aria-label="Close">${d.icon.close}</button></div>`;

  // Every faction on the board, each mini faction under the faction that made it.
  function boardOrder(doc) {
    const order = [];
    for (const f of doc.factions) {
      if (f.mini && f.parent && f.parent !== "crew" && find(doc, f.parent)) continue;
      order.push(f);
      if (!f.mini) order.push(...minisOf(doc, f.id));
    }
    return order;
  }
  // A faction's bond threads that are whole, any of which can be a step on its roll.
  function fitsOf(f) {
    const out = [];
    for (const [l, label] of BONDS) for (const x of f[l] ?? []) if (x.kind === "bond" && x.s === "whole") out.push({ id: x.id, text: x.text, where: label });
    for (const x of f.threads ?? []) if (x.kind === "bond" && x.s === "whole") out.push({ id: x.id, text: x.text, where: "A thread" });
    return out;
  }
  const powerOf = (f) => stepsToDice(stepsOf(f));
  // The crew's Power, from the party sheet.
  const crewPower = (id) => stepsToDice(crewOf(id).steps);

  // ------------------------------------------------------------ the section

  function status(id) {
    const waiting = T().waiting(id);
    const at = T().seenAt(id);
    const bits = [
      !online() ? (at ? `No signal, so this is the downtime as it was at ${time(at)}.` : "No signal, and this phone hasn’t seen this downtime yet.") : "",
      waiting ? (online() ? "Sending…" : `${waiting === 1 ? "Your change goes" : "Your changes go"} up when you’ve got a signal.`) : "",
    ].filter(Boolean);
    return bits.length ? `<p class="cc-small pt-status">${bits.join(" ")}</p>` : "";
  }

  function strip(id, t, gm) {
    const at = STEPS.indexOf(t.step);
    return `<ol class="ft-steps" aria-label="Where the faction turn’s got to">${STEPS.map((s, i) => {
      const can = gm && s !== t.step && (t.sent ? s !== "hire" : s === "hire" || s === "tele");
      const cls = `ft-step${i < at ? " is-past" : ""}${i === at ? " is-on" : ""}`;
      const inner = can ? `<button type="button" class="ft-step-b" data-act="ft" data-do="step" data-s="${s}">${STEP_NAMES[s]}</button>` : `<span class="ft-step-b">${STEP_NAMES[s]}</span>`;
      return `<li class="${cls}"${i === at ? ' aria-current="step"' : ""}>${inner}</li>`;
    }).join("")}</ol>`;
  }

  function lastFold(last, open = false) {
    if (!last?.said?.length) return "";
    const k = `ft-last-${last.n}`;
    return `<details class="cc-fold ft-last" data-open="${k}"${open || d.isOpen(k) ? " open" : ""}><summary><h3 class="cc-fold-t">What changed last downtime</h3><span class="cc-fold-g">${esc(last.said[last.said.length - 1].text)}</span></summary>
      <div class="cc-fold-b"><ul class="ft-said">${last.said.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ul></div></details>`;
  }

  function section(id) {
    const t = turnOf(id);
    const gm = gmIn(id);
    const last = lastOf(id);
    const hid = `ft-h-${esc(id)}`;
    if (!t) {
      const lastHtml = lastFold(last);
      if (!gm) return lastHtml ? `<section class="cc-sec ft is-idle" data-ft="${esc(id)}" aria-labelledby="${hid}"><h2 id="${hid}">Downtime</h2>${lastHtml}</section>` : "";
      const n = boardOf(id).factions.length;
      return `<section class="cc-sec ft is-idle" data-ft="${esc(id)}" aria-labelledby="${hid}"><h2 id="${hid}">Downtime</h2>
        <p class="cc-lead">Every faction on the board takes one action a downtime, and so does the crew. ${n ? "Start the faction turn when the crew’s week starts, and it goes step by step from there, the same as the book." : "Put a faction or two on the board first."} ${ruleLink("s-faction-turn", "The faction turn")}</p>
        ${n ? btn("start", "Start the faction turn", { cls: "button primary ft-go" }) : ""}${lastHtml}</section>`;
    }
    const body = t.step === "hire" ? hireBody(id, t, gm) : t.step === "tele" ? teleBody(id, t, gm) : t.step === "crew" ? crewBody(id, t, gm) : landBody(id, t, gm);
    return `<section class="cc-sec ft is-${t.step}" data-ft="${esc(id)}" aria-labelledby="${hid}">
      <div class="ft-head"><h2 id="${hid}">Downtime ${t.n} <small>the faction turn</small></h2></div>
      ${strip(id, t, gm)}${status(id)}${body}</section>`;
  }

  // A line for the campaign page's way into the world, while a turn's on.
  function glance(id) {
    const t = turnOf(id);
    if (!t) return "";
    return t.step === "hire" ? `Downtime ${t.n}: hiring.` : t.step === "tele" ? `Downtime ${t.n}: the factions are moving.` : t.step === "crew" ? `Downtime ${t.n}: the crew’s action.` : `Downtime ${t.n}: the actions are landing.`;
  }

  // ------------------------------------------------------------ hiring

  function hireRow(id, t, h, canTake) {
    const key = `unhire:${h.id}`;
    return `<li class="ft-hire"><div class="ft-hire-in"><p><b>${esc(h.toName)}</b> <small>${h.by === "crew" ? "paid by the crew" : `paid by ${esc(h.byName)}`}</small></p><p>${esc(h.job)}</p></div>
      ${canTake && !t.sent ? btn("unhire", ui.sure === key ? "Tap again" : "Take it back", { cls: "button sm", attrs: ` data-h="${esc(h.id)}" aria-label="Take back paying ${esc(h.toName)}"` }) : ""}</li>`;
  }

  function hireBody(id, t, gm) {
    const left = extrasLeft(id, t);
    const ours = t.hires.filter((h) => h.by === "crew");
    const theirs = t.hires.filter((h) => h.by !== "crew");
    const can = gm || Boolean(mine(id));
    const money = left ? `The crew’s got ${left === 1 ? "1 extra resource" : `${left} extra resources`} to spend this downtime.` : ours.length ? "That’s the crew’s extra resources spent." : "The crew hasn’t got an extra resource to spend this downtime.";
    const lead = gm
      ? `<p class="cc-lead">Hiring comes first. The crew says who it’s paying with an extra resource, and you say who the factions are paying. A hired faction spends its one action on the job, so once the actions are out, nobody can buy one off. ${ruleLink("s-crew-wealth", "Extra resources")}</p>`
      : `<p class="cc-lead">Hiring comes first. If the crew’s paying a faction to do something this downtime, say who and what for. It spends its one action on the job, rolled with its own dice. ${esc(gmName(id))}’s getting the factions’ actions ready.</p>`;
    const list = (hs, mineToo) => (hs.length ? `<ul class="ft-hires">${hs.map((h) => hireRow(id, t, h, mineToo)).join("")}</ul>` : "");
    return `${lead}
      <h3 class="ft-h3">The crew’s paying</h3>${list(ours, can) || '<p class="cc-small">Nobody yet.</p>'}<p class="cc-small">${money}</p>
      ${left && can ? `<div class="tg-do">${btn("hire", "Pay a faction", { attrs: ' data-by="crew"' })}</div>` : ""}
      ${gm ? `<h3 class="ft-h3">The factions are paying</h3>${list(theirs, true) || '<p class="cc-small">Nobody yet. Only you see these.</p>'}
        <div class="tg-do">${btn("hire", "A faction pays someone", { attrs: ' data-by="faction"' })}</div>
        <div class="tg-do tg-bar">${btn("step", "On to the factions’ actions", { cls: "button primary", attrs: ' data-s="tele"' })}</div>` : ""}`;
  }

  // ------------------------------------------------------------ the factions' actions

  function facRow(id, t, f) {
    const a = t.acts.find((x) => x.f === f.id);
    const hired = t.hires.find((h) => h.to === f.id);
    const tags = [a?.off ? "Off-screen" : "", a && t.pressure === a.id ? "Faction pressure" : "", hired ? `Paid by ${hired.byName === "The crew" ? "the crew" : hired.byName}` : ""].filter(Boolean);
    return `<li><button type="button" class="card ft-fac${a ? " is-set" : ""}" data-act="ft" data-do="pick" data-f="${esc(f.id)}">
      <span class="ft-fac-die" aria-hidden="true">${them(powerOf(f))}</span>
      <span class="ft-fac-in"><span class="wb-k">${f.mini ? "Mini faction" : "Faction"}${tags.map((x) => ` <span class="ft-tag">${esc(x)}</span>`).join("")}</span><b class="ft-fac-n">${esc(f.name)}</b>
      <span class="ft-fac-a">${a ? esc(a.does) : hired ? `Its job: ${esc(hired.job)}` : "Pick its action"}</span></span></button></li>`;
  }

  // The factions the crew hasn't been shown that a telegraph names, which
  // sending shows them.
  function toShow(id, t) {
    const doc = boardOf(id);
    const ids = new Set();
    for (const a of t.acts) {
      if (a.off) continue;
      ids.add(a.f);
      if (a.at.f && a.at.f !== "crew") ids.add(a.at.f);
    }
    return [...ids].map((x) => find(doc, x)).filter((f) => f && !f.shown.card);
  }

  function teleBody(id, t, gm) {
    if (!gm) return `<p class="cc-lead">${esc(gmName(id))}’s picking every faction’s action. They show up here the moment they’re telegraphed.</p>${t.hires.length ? `<h3 class="ft-h3">The crew’s paying</h3><ul class="ft-hires">${t.hires.map((h) => hireRow(id, t, h, false)).join("")}</ul>` : ""}`;
    const doc = boardOf(id);
    const order = boardOrder(doc);
    const send = ui.sure === `send:${id}`;
    const hidden = toShow(id, t);
    const picked = t.acts.filter((a) => order.some((f) => f.id === a.f)).length;
    const note = hidden.length ? `Telegraphing them shows the crew ${andList(hidden.map((f) => f.name))} too, since ${hidden.length === 1 ? "it’s" : "they’re"} in a telegraph.` : "";
    return `<p class="cc-lead">Pick every faction’s action, one each: what it’s doing, at what, and its dice. Nothing goes to the crew’s phones till you telegraph them. With a big board, move the ones the crew can’t reach off-screen. ${ruleLink("s-faction-turn", "The faction turn")}</p>
      <p class="cc-small ft-sum">${picked} of ${order.length} picked${t.acts.some((a) => !a.off) && !t.pressure ? ". Mark whichever matters most to the crew as the faction pressure." : "."}</p>
      <ul class="ft-facs">${order.map((f) => facRow(id, t, f)).join("")}</ul>
      <div class="tg-do tg-bar">${send && note ? `<p class="cc-small">${esc(note)}</p>` : ""}${btn("send", send ? "Tap again to telegraph them" : "Telegraph them to the crew", { cls: "button primary" })}${btn("step", "Back to hiring", { attrs: ' data-s="hire"' })}</div>`;
  }

  // ------------------------------------------------------------ an action's card

  function whenOf(t, a) {
    const s = stateOfAct(a, t);
    if (a.stop?.won) return a.stop.by === "crew" ? "The crew stopped it" : `Stopped by ${t.acts.find((x) => x.id === a.stop.by)?.name ?? "a faction"}`;
    if (s === "done") return !a.won ? "Done" : a.won.main || !a.roll ? (a.roll ? "Landed" : "It happened") : "Didn’t land";
    if (s === "won") return a.roll ? "Landed" : "It happens";
    if (s === "lost") return "Didn’t land";
    if (a.off) return "Off-screen, no roll";
    return a.roll ? "Lands when downtime’s rolled" : "Happens unless someone stops it";
  }
  const dieWon = (x, i) => (i < x.main.length ? x.won?.main : x.won?.split);

  // What happened, under the card.
  function verdict(id, t, a) {
    if (a.done) return `<div class="tg-v"><p><b>What changed:</b> ${esc(a.done)}</p></div>`;
    if (a.done != null && !a.stop?.won) return "";
    if (a.stop?.won) {
      const by = a.stop.by === "crew" ? crewName(id) : t.acts.find((x) => x.id === a.stop.by)?.name ?? "A faction";
      return `<div class="tg-v is-good"><p><b>${esc(by)} stopped it.</b> It doesn’t land this downtime.</p></div>`;
    }
    if (!a.won) {
      if (a.stop && !a.stop.won) return `<div class="tg-v"><p>${esc(a.stop.by === "crew" ? crewName(id) : t.acts.find((x) => x.id === a.stop.by)?.name ?? "A faction")} tried to stop it, and didn’t. It still lands.</p></div>`;
      return "";
    }
    if (!a.roll) return `<div class="tg-v"><p>${a.off ? "It moved off-screen." : "Nobody stopped it, so it happens."}</p></div>`;
    const def = defOf(t, a);
    const nameOf = (f) => (f === "crew" ? crewName(id) : find(boardOf(id), f)?.name ?? "");
    const mine2 = a.main.length > 1 ? `Its best die came up ${best(a.faces.main)}` : `Its d${a.main[0]} came up ${a.faces.main[0]}`;
    const theirs = a.vs.k === "power" ? `${poss(lower(nameOf(a.vs.f) || "its"))} ${diceLabel(t.power[a.vs.f]?.d ?? a.vs.d)} came up ${def}`
      : a.vs.k === "act" ? `${poss(lower(nameOf(a.vs.f) || "its"))} dice came up ${def}`
      : a.what === "agenda" ? `the agenda’s d${a.vs.d[0]} came up ${def}` : `the d${a.vs.d[0]} it was up against came up ${def}`;
    const main = `${mine2}, and ${theirs}, so ${a.won.main ? "it worked" : "it didn’t land, and it’s a little angrier about it"}.`;
    const split = a.split ? ` Its d${a.split.d} to ${midway(a.split.for)} came up ${a.faces.split}, so ${a.won.split ? "that worked too" : "that didn’t"}.` : "";
    return `<div class="tg-v${a.won.main ? "" : " is-wait"}"><p>${esc(main)}${esc(split)}</p></div>`;
  }

  function actCard(id, t, a, gm, controls = "") {
    const s = stateOfAct(a, t);
    const pressure = t.pressure === a.id;
    const k = a.off ? "Off-screen" : pressure ? "Faction pressure" : "Telegraph";
    const faces = a.faces ? allFaces(a.faces) : null;
    const spin = ui.spin === a.id && !d.calm() && faces;
    const dice = allDice(a).map((x, i) => kitDie(x, { own: "them", face: faces ? faces[i] : null, state: faces && a.won && !dieWon(a, i) ? "low" : "", spin, cls: "ft-d", label: faces ? `${a.name}’s d${x}, which came up ${faces[i]}` : `${a.name}’s d${x}` })).join("");
    const what = a.what === "comes" || a.what === "agenda" || a.what === "write" ? WHAT_NAMES[a.what] : a.what;
    const hired = a.job ? t.hires.find((h) => h.id === a.job) : null;
    const extra = [
      a.split ? `<p class="ft-split">${them(a.main)} ${a.main.length > 1 ? "on" : "for"} ${esc(midway(a.does))} · ${them([a.split.d])} to ${esc(midway(a.split.for))}</p>` : "",
      a.comes ? `<p class="one"><b>${a.comes.n} on the d12.</b> ${esc(a.comes.text)}</p>` : "",
      hired ? `<p class="one"><b>Paid by ${esc(hired.by === "crew" ? "the crew" : hired.byName)}.</b> ${esc(hired.job)}</p>` : "",
    ].join("");
    return `<li class="tg ft-act is-${s}${pressure ? " is-pressure" : ""}${a.off ? " is-off" : ""}" data-ftk="${esc(a.id)}"><article class="zd-tele ft-tele${s === "stopped" ? " is-stopped" : s === "lost" ? " is-held" : s === "won" || s === "done" ? " is-landed" : ""}">
      <header><span class="k">${k}</span><span class="r">${esc(what)}</span></header>
      <div class="tb"><span class="ft-dice">${dice}</span><div><h3>${esc(a.name)}</h3><p>${esc(a.does)}</p></div></div>${extra}
      <footer><span class="at">${a.at.name && a.at.f !== a.f ? `At ${esc(lower(a.at.name))}` : ""}</span><span class="when">${esc(whenOf(t, a))}</span></footer>
    </article>${verdict(id, t, a)}${controls}</li>`;
  }

  // Everything she's telegraphed, the faction pressure first, and for her,
  // the ones moving off-screen in a fold.
  function teleCards(id, t, gm, controls = () => "") {
    const seen = t.acts.filter((a) => !a.off).sort((a, b) => (b.id === t.pressure) - (a.id === t.pressure));
    const off = gm ? t.acts.filter((a) => a.off) : [];
    const offHtml = off.length ? `<details class="cc-fold ft-offs" data-open="ft-off"${d.isOpen("ft-off") ? " open" : ""}><summary><h3 class="cc-fold-t">Off-screen</h3><span class="cc-fold-g">${off.length === 1 ? "1 action" : `${off.length} actions`} the crew won’t see coming</span></summary>
      <div class="cc-fold-b"><ol class="tg-list ft-list">${off.map((a) => actCard(id, t, a, gm, controls(a))).join("")}</ol></div></details>` : "";
    if (!seen.length) return `<p class="cc-lead">No faction’s doing anything the crew can see coming this downtime.</p>${offHtml}`;
    return `<h3 class="ft-h3">What the factions are doing</h3><ol class="tg-list ft-list">${seen.map((a) => actCard(id, t, a, gm, controls(a))).join("")}</ol>${offHtml}`;
  }

  // ------------------------------------------------------------ the crew's action

  function crewVs(id, t, c, gm) {
    const vs = c.vs;
    if (vs.k === "none") return "No roll. It happens.";
    if (vs.k === "act") {
      const a = t.acts.find((x) => x.id === vs.act);
      return `Against ${a ? poss(lower(a.name)) : "its"} ${diceLabel(vs.d)}. Ties go to the faction.`;
    }
    const kept = vs.k === "power" ? t.power[vs.f] : null;
    if (kept) return `Against its Power, ${diceLabel(kept.d)}, which came up ${best(kept.v)} already this downtime. That roll stands.`;
    if (vs.set) return `Against ${diceLabel(vs.d)}. Ties go to whoever’s defending.`;
    return gm ? "Say what it’s up against, and the crew can roll." : `Waiting on ${esc(gmName(id))} to say what it’s up against.`;
  }

  // Going at a bigger faction's Power, or stopping its action, takes the
  // crew's action and a personal slot on the same move.
  function biggerNote(id, t, c) {
    if (c.slot || c.how !== "crew") return "";
    const doc = boardOf(id);
    const f = c.at.f && c.at.f !== "crew" ? find(doc, c.at.f) : null;
    const gm = gmIn(id);
    let theirs = null;
    if (c.vs.k === "act") theirs = c.vs.d;
    else if (c.at.part === "power" && f && (gm || f.shown.power)) theirs = powerOf(f);
    if (!theirs) return "";
    const ours = crewPower(id);
    const bigger = best(theirs) > best(ours) || theirs.length > ours.length;
    return bigger ? `<p class="cc-warn">${esc(f?.name ?? "That faction")}’s Power is bigger than the crew’s, so this takes a personal slot as well as the crew’s action. Without one, go at something smaller: one thing out on its own, its agenda or its face. ${ruleLink("s-faction-crew", "Going at a bigger faction")}</p>` : "";
  }

  function crewPanel(id, t, gm) {
    const c = t.crew;
    const place = mine(id);
    const can = gm || Boolean(place);
    if (!c) {
      return `<div class="ft-crew card"><h3 class="ft-h3">The crew’s action</h3>
        <p class="cc-lead">The crew gets one action this downtime, like every faction: a move on one of them, the Goal, a project, or anything else its action can be. It can go at a faction before that faction’s action lands. ${ruleLink("s-faction-crew", "The crew and the factions")}</p>
        ${can ? `<div class="tg-do">${btn("crew", "Pick the crew’s action", { cls: "button primary" })}</div>` : ""}</div>`;
    }
    const dice = crewDice(c);
    const all = allDice(dice);
    const faces = c.faces ? allFaces(c.faces) : null;
    const spin = ui.spin === "crew" && !d.calm() && faces;
    const def = defOf(t, c);
    const diceHtml = all.map((x, i) => kitDie(x, { own: "you", face: faces ? faces[i] : null, state: faces && c.won && !(i < dice.main.length ? c.won.main : c.won.split) ? "low" : "", spin, cls: "ft-d", label: faces ? `The crew’s d${x}, which came up ${faces[i]}` : `The crew’s d${x}` })).join("");
    const steps = crewSteps(c);
    const how = c.how === "own" ? `${esc(c.who?.name ?? "Someone")}’s own permissions, ${stepsSay(c.steps)}` : `The crew’s Power${c.fits.length ? ` and ${andList(c.fits.map((x) => `<em>${esc(x)}</em>`))}` : ""}, ${stepsSay(c.steps)}`;
    const slot = c.slot
      ? `<p class="ft-slot is-on">${esc(c.slot.name)} put a personal slot in, so everything counts twice: ${stepsSay(steps)}, ${diceLabel(stepsToDice(steps))}.</p>${place && c.slot.user === me() && !rolled(c) ? `<div class="tg-do">${btn("slot", `Take ${esc(place.cname)}’s slot out`, { attrs: ' data-on="0"' })}</div>` : ""}`
      : !rolled(c) && place ? `<p class="ft-slot">Put one of ${esc(place.cname)}’s personal slots in and everything counts twice.</p><div class="tg-do">${btn("slot", `Put ${esc(place.cname)}’s slot in`, { attrs: ' data-on="1"' })}</div>` : "";
    let foot = "";
    if (!rolled(c)) {
      const ready = c.vs.set;
      foot = `<div class="tg-do">${gm && !ready ? btn("vs", "Say what it’s up against", { cls: "button primary" }) : ""}
        ${can && ready ? `${btn("roll", c.vs.k === "none" ? "It happens" : "Roll it", { cls: "button primary" })}${c.vs.k === "none" ? "" : btn("real", "Real dice", { attrs: ' data-x="crew"' })}` : ""}
        ${can ? btn("crew", "Change it", { cls: "button" }) : ""}${gm && ready && c.vs.k !== "act" && c.vs.k !== "none" ? btn("vs", "Change what it’s up against") : ""}</div>`;
    } else if (c.done == null) {
      const tied = c.faces && ((best(c.faces.main) === def && !c.tie.main) || (c.faces.split != null && c.faces.split === def && !c.tie.split));
      const lostAny = c.faces && (!c.won.main || c.won.split === false);
      const opts = [];
      const ch = place ? d.character(place.ch) : null;
      if (place && lostAny && ch) opts.push(btn("again", `Roll again for 1 Resolve <small>${esc(place.cname)}’s got ${ch.resolve}</small>`, { disabled: ch.resolve < 1 }));
      if (tied && can) opts.push(btn("tie", extrasLeft(id, t) ? "Take the tie with an extra resource" : "No extra resource left for the tie", { disabled: !extrasLeft(id, t), attrs: ` data-w="${best(c.faces.main) === def && !c.tie.main ? "main" : "split"}"` }));
      if (gm) opts.push(btn("out", "Make the changes", { cls: "button primary", attrs: ' data-x="crew"' }));
      foot = opts.length ? `<div class="tg-do">${opts.join("")}</div>` : "";
    }
    const result = c.won
      ? c.vs.k === "none" ? `<div class="tg-v is-good"><p><b>It happens.</b> ${c.done ? `What changed: ${esc(c.done)}` : ""}</p></div>`
        : `<div class="tg-v ${c.won.main ? "is-good" : "is-bad"}"><p><b>${cap(crewResult(c))}.</b> The crew’s best came up ${best(c.faces.main)} against ${def}${c.tie.main ? ", and an extra resource bought the tie" : ""}.${c.again.length ? ` ${andList(c.again.map((x) => esc(x.name)))} spent Resolve to roll it again.` : ""}${c.real ? ' <span class="tg-real">Real dice</span>' : ""}</p>${c.done ? `<p><b>What changed:</b> ${esc(c.done)}</p>` : ""}</div>`
      : "";
    return `<div class="ft-crew card" data-ftk="crew"><h3 class="ft-h3">The crew’s action <small>${esc(MOVE_NAMES[c.move] ?? c.move)}</small></h3>
      <div class="ft-crew-tb"><span class="ft-dice">${diceHtml}</span><div><p class="ft-crew-does">${esc(c.does)}</p>${c.at.name ? `<p class="cc-small">At ${esc(lower(c.at.name))}</p>` : ""}</div></div>
      <p class="cc-small">${how}.${c.split ? ` Its d${dice.split} is for “${esc(c.split.for)}”.` : ""}</p>${slot}
      <p class="cc-small ft-vs">${crewVs(id, t, c, gm)}</p>${rolled(c) ? "" : biggerNote(id, t, c)}${result}${foot}</div>`;
  }

  function saidList(id, t, gm) {
    const list = t.said.length ? `<h3 class="ft-h3">What changed</h3><ul class="ft-said">${t.said.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ul>` : "";
    const form = gm ? `<form class="cc-form ft-say" data-form="ft-say"><label class="cc-field">Anything else that changed <input name="line" maxlength="${MAX.line}" autocomplete="off" placeholder="The Night Boats moved upriver"></label><div class="cc-row"><button type="submit" class="button">Say it</button></div></form>` : "";
    return list + form;
  }

  function crewBody(id, t, gm) {
    return `${teleCards(id, t, gm)}${crewPanel(id, t, gm)}${saidList(id, t, gm)}
      ${gm ? `<div class="tg-do tg-bar">${btn("step", "On to the landing", { cls: "button primary", attrs: ' data-s="land"' })}${btn("step", "Change the factions’ actions", { attrs: ' data-s="tele"' })}</div>` : ""}`;
  }

  // ------------------------------------------------------------ the landing

  // Obstructs first, then the rest, then the ones moving off-screen.
  const landOrder = (t) => [...t.acts.filter((a) => !a.off && a.what === "Obstruct"), ...t.acts.filter((a) => !a.off && a.what !== "Obstruct"), ...t.acts.filter((a) => a.off)];
  // Whatever's trying to stop it has to be settled before it lands.
  function blockedBy(t, a) {
    const crew = t.crew?.move === "Obstruct" && t.crew.vs.act === a.id && !rolled(t.crew) ? t.crew : null;
    if (crew) return "The crew’s trying to stop it, so the crew rolls first.";
    const by = t.acts.find((x) => x.what === "Obstruct" && !x.off && x.vs.act === a.id && !rolled(x));
    return by ? `${by.name}’s trying to stop it, so that goes first.` : "";
  }
  const readyToLand = (t, a) => !landed(a) && a.done == null && !blockedBy(t, a);

  function landControls(id, t, a) {
    if (a.done != null) return "";
    if (a.stop?.won) return `<div class="tg-do">${btn("done", "That’s that", { attrs: ` data-x="${esc(a.id)}"` })}</div>`;
    if (a.won) return `<div class="tg-do">${btn("out", a.won.main || !a.roll ? "Make the changes" : "Say what happened", { cls: "button primary", attrs: ` data-x="${esc(a.id)}"` })}</div>`;
    const why = blockedBy(t, a);
    if (why) return `<p class="cc-small ft-wait">${esc(why)}</p>`;
    if (a.off || !a.roll) return `<div class="tg-do">${btn("land", a.off ? "It moves" : "It happens", { cls: "button primary", attrs: ` data-x="${esc(a.id)}"` })}</div>`;
    return `<div class="tg-do">${btn("land", "Land it", { cls: "button primary", attrs: ` data-x="${esc(a.id)}"` })}${btn("real", "Real dice", { attrs: ` data-x="${esc(a.id)}"` })}</div>`;
  }

  function landBody(id, t, gm) {
    const ready = gm ? landOrder(t).filter((a) => readyToLand(t, a)) : [];
    const left = t.acts.filter((a) => a.done == null && !(a.stop?.won)).length + (t.crew && t.crew.done == null ? 1 : 0);
    const end = ui.sure === `end:${id}`;
    const crew = t.crew ? crewPanel(id, t, gm) : gm ? `<div class="ft-crew card"><h3 class="ft-h3">The crew’s action</h3><p class="cc-small">The crew hasn’t taken one this downtime.</p><div class="tg-do">${btn("step", "Back to the crew’s action", { attrs: ' data-s="crew"' })}</div></div>` : "";
    const cards = landOrder(t).filter((a) => gm || !a.off);
    return `${gm ? `<p class="cc-lead">Obstructs go first, then the rest. A faction’s Power is rolled once, the first time anything goes at it, and that roll stands all downtime. When one lands, make its changes on the cards. ${ruleLink("s-faction-outcomes", "The six outcomes")}</p>` : `<p class="cc-lead">${esc(gmName(id))}’s landing the factions’ actions. Each one shows up here as it does.</p>`}
      ${crew}
      ${cards.length ? `<h3 class="ft-h3">The actions land</h3><ol class="tg-list ft-list">${cards.map((a) => actCard(id, t, a, gm, gm ? landControls(id, t, a) : "")).join("")}</ol>` : ""}
      ${gm && ready.length > 1 ? `<div class="tg-do">${btn("landall", `Roll the rest at once <small>${ready.length}</small>`)}</div>` : ""}
      ${saidList(id, t, gm)}
      ${gm ? `<div class="tg-do tg-bar">${end && left ? `<p class="cc-small">${left === 1 ? "One action hasn’t" : `${left} actions haven’t`} been finished. Ending it leaves ${left === 1 ? "it" : "them"} as they are.</p>` : ""}${btn("end", end ? "Tap again to end the downtime" : "End the downtime", { cls: "button primary" })}${btn("step", "Back to the crew’s action", { attrs: ' data-s="crew"' })}</div>` : ""}`;
  }

  // ------------------------------------------------------------ dialogs: paying a faction

  function hireView(r) {
    const id = r.camp;
    const t = turnOf(id);
    const doc = boardOf(id);
    const gm = gmIn(id);
    if (!t) return closed();
    const crewPays = r.by === "crew";
    const paying = (f) => t.hires.filter((h) => h.by === f.id).length;
    const payers = crewPays ? [] : boardOrder(doc).filter((f) => moneyOf(f).extra > paying(f));
    const takers = boardOrder(doc).filter((f) => f.id !== r.payer && !t.hires.some((h) => h.to === f.id) && (!crewPays || standingOf(f) !== "hostile"));
    const card = (doit, f, on, sub) => `<button type="button" class="tg-target" data-act="ft" data-do="${doit}" data-f="${esc(f.id)}"${pressed(on)}><span class="ft-fac-die" aria-hidden="true">${them(gm || f.shown.power ? powerOf(f) : [])}</span><span><b>${esc(f.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span></button>`;
    const lead = crewPays
      ? `<p class="cc-lead">Pay a faction with one of the crew’s extra resources and it spends its one action that downtime where the crew says, rolled with its own dice. The money buys the action, not the win, and a faction that’s hostile to the crew won’t take it.</p>`
      : `<p class="cc-lead">A faction with an extra resource can pay another to spend its one action on a job. The crew doesn’t see who paid, only the job when it’s telegraphed.</p>`;
    return `${head(crewPays ? "Pay a faction" : "A faction pays someone", `Downtime ${t.n} · hiring`)}
      <div class="dlg-body ft-dlg">${lead}
        ${crewPays ? "" : `<fieldset class="cc-group"><legend>Who’s paying</legend>${payers.length ? `<div class="tg-targets">${payers.map((f) => card("payer", f, r.payer === f.id, `${moneyOf(f).extra - paying(f)} extra to spend`)).join("")}</div>` : '<p class="cc-small">No faction’s got an extra resource to spend.</p>'}</fieldset>`}
        <fieldset class="cc-group"><legend>Who’s being paid</legend>${takers.length ? `<div class="tg-targets">${takers.map((f) => card("taker", f, r.to === f.id, "")).join("")}</div>` : '<p class="cc-small">There’s nobody left to pay.</p>'}</fieldset>
        <label class="tg-label" for="ft-job">What for</label>
        <input id="ft-job" data-ft="job" maxlength="${MAX.line}" autocomplete="off" placeholder="Burn the Vane vineyards" value="${esc(r.job)}">
      </div>
      <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}${btn("savehire", "Pay them", { cls: "button primary" })}</div>`;
  }

  function saveHire(r) {
    const id = r.camp;
    const t = turnOf(id);
    const doc = boardOf(id);
    const to = find(doc, r.to);
    const payer = r.by === "crew" ? null : find(doc, r.payer);
    const err = r.by !== "crew" && !payer ? "Pick who’s paying." : !to ? "Pick who’s being paid." : !String(r.job).trim() ? "Say what the job is." : r.by === "crew" && !extrasLeft(id, t) ? "The crew hasn’t got an extra resource left to pay with." : "";
    if (err) {
      r.err = err;
      return d.renderDialog();
    }
    push(id, { o: "ft-hire", h: { id: newId(), by: payer ? payer.id : "crew", byName: payer?.name ?? "The crew", to: to.id, toName: to.name, job: String(r.job).trim().slice(0, MAX.line) } });
    d.closeDialog();
    d.toast(r.by === "crew" ? `The crew’s paying ${lower(to.name)}. ${esc(gmName(id))} turns the job into its action.` : `${payer.name} is paying ${lower(to.name)}.`, false);
  }

  // ------------------------------------------------------------ dialogs: a faction's action

  // A draft from the action she's picked already, or a fresh one.
  function actDraft(id, t, f) {
    const a = t.acts.find((x) => x.f === f.id);
    const hired = t.hires.find((h) => h.to === f.id) ?? null;
    if (a) {
      return {
        id: a.id, f: f.id, what: a.what, ag: a.what === "agenda" ? a.at.lid : null, tf: a.at.f, item: a.at.l && a.at.lid && a.what !== "agenda" ? { l: a.at.l, lid: a.at.lid } : null,
        oact: a.at.act, against: a.vs.k === "die" ? "die" : a.vs.k === "none" ? "none" : "power", dieD: a.vs.k === "die" ? a.vs.d[0] : 0,
        fits: [], split: a.split ? { ...a.split } : null, does: a.does, edited: true, off: a.off, pressure: t.pressure === a.id,
        comes: a.comes, est: a.what === "Establish" ? a.at.name : "", agenda: a.what === "write" ? { text: a.at.name, die: a.at.d ?? 0 } : { text: "", die: 0 }, job: a.job, d6: null, extraSteps: a.steps - stepsOf(f),
      };
    }
    return {
      id: newId(), f: f.id, what: null, ag: null, tf: null, item: null, oact: null, against: "power", dieD: 0, fits: [], split: null,
      does: hired ? hired.job : "", edited: Boolean(hired), off: false, pressure: false, comes: null, est: "", agenda: { text: "", die: 0 }, job: hired?.id ?? null, d6: null, extraSteps: 0,
    };
  }

  // Whatever the action's going at, worked out from the draft.
  function actOf(id, t, r) {
    const doc = boardOf(id);
    const a = r.a;
    const f = find(doc, a.f);
    if (!f) return null;
    const fits = fitsOf(f);
    const chosen = a.fits.length ? fits.filter((x) => a.fits.includes(x.id)).length : a.extraSteps;
    const steps = stepsOf(f) + chosen;
    const tgt = a.tf && a.tf !== "crew" ? find(doc, a.tf) : null;
    const sheet = sheetOf(id);
    let at = { f: null, name: "" };
    let vs = { k: "none" };
    let does = "";
    switch (a.what) {
      case "agenda": {
        const ag = f.agendas.find((x) => x.id === a.ag) ?? f.agendas.find((x) => !x.done);
        if (!ag) return null;
        at = { f: f.id, name: ag.text, l: "agendas", lid: ag.id };
        vs = { k: "die", d: [ag.die] };
        does = `Work its agenda, ${bare(ag.text)}`;
        break;
      }
      case "write":
        at = { f: f.id, name: bare(a.agenda.text), d: a.agenda.die };
        does = `Write a new agenda: ${bare(a.agenda.text)}`;
        break;
      case "comes":
        at = { f: "crew", name: crewName(id) === "The crew" ? "the crew" : crewName(id) };
        does = "Come for the crew";
        break;
      case "Obstruct": {
        const o = t.acts.find((x) => x.id === a.oact);
        if (!o) return null;
        at = { f: o.f, name: `${poss(o.name)} action`, act: o.id };
        vs = { k: "act" };
        does = `Stop ${poss(lower(o.name))} action`;
        break;
      }
      case "Establish":
        at = { f: f.id, name: bare(a.est) };
        vs = a.against === "die" && a.dieD ? { k: "die", d: [a.dieD] } : { k: "none" };
        does = a.est ? `Establish ${bare(a.est).charAt(0).toLowerCase()}${bare(a.est).slice(1)}` : "Establish something new";
        break;
      default: {
        const list = a.item ? (a.tf === "crew" ? sheet[a.item.l] : tgt?.[a.item.l]) : null;
        const item = list?.find((x) => x.id === a.item.lid);
        const tname = a.tf === "crew" ? crewName(id) : tgt?.name ?? "";
        at = { f: a.tf, name: item ? `${poss(tname)} ${item.text}` : tname, l: item ? a.item.l : null, lid: item ? item.id : null };
        if (a.against === "die" && a.dieD) vs = { k: "die", f: a.tf, d: [a.dieD] };
        else if (a.tf === "crew") vs = { k: "power", f: "crew", d: crewPower(id) };
        else if (tgt) vs = { k: "power", f: tgt.id, d: powerOf(tgt) };
        const verb = { Destroy: "Hit", Undermine: "Undermine", Influence: "Win over", Acquire: "Take" }[a.what] ?? a.what;
        does = `${verb} ${lower(at.name) || "someone"}`;
      }
    }
    return { id: a.id, f: f.id, name: f.name, mini: f.mini, what: a.what, at, does: a.edited && a.does ? a.does : does, job: a.job, steps, split: a.split?.for ? a.split : null, vs, off: a.off, comes: a.what === "comes" ? a.comes : null };
  }

  function actView(r) {
    const id = r.camp;
    const t = turnOf(id);
    const doc = boardOf(id);
    const f = t ? find(doc, r.a.f) : null;
    if (!t || !f) return closed();
    const a = r.a;
    const hired = t.hires.find((h) => h.to === f.id) ?? null;
    const outs = f.mini ? f.outs : OUTCOMES;
    const undone = f.agendas.filter((x) => !x.done);
    const others = boardOrder(doc).filter((x) => x.id !== f.id);
    const built = actOf(id, t, r);
    const fits = fitsOf(f);
    const chosen = a.fits.length ? fits.filter((x) => a.fits.includes(x.id)).length : a.extraSteps;
    const steps = stepsOf(f) + chosen;
    const dice = diceOf(steps, a.split?.s && a.split.s < steps ? a.split : null);
    const whatBtn = (w, label, sub = "") => choice("what", a.what === w, label, sub, ` data-w="${w}"`);
    const whats = [
      undone.length ? whatBtn("agenda", "Work its agenda", undone.map((x) => `${bare(x.text)}, d${x.die}`).join(" · ")) : "",
      ...outs.map((o) => whatBtn(o, o, BOOK.outcomes.find((x) => x.name === o)?.text ?? "")),
      !f.mini && f.agendas.length < 2 ? whatBtn("write", "Write a new agenda", "It takes its action, and it’s got room for two") : "",
      !f.mini ? whatBtn("comes", "Come for the crew", `It doesn’t roll against the crew. Whatever comes up happens, unless they stop it`) : "",
    ].join("");
    // What it's going at.
    let at = "";
    if (a.what === "agenda" && undone.length > 1) at = `<fieldset class="cc-group"><legend>Which agenda</legend>${undone.map((x) => choice("ag", a.ag === x.id, esc(x.text), `d${x.die}`, ` data-id="${esc(x.id)}"`)).join("")}</fieldset>`;
    if (["Destroy", "Undermine", "Influence", "Acquire"].includes(a.what)) {
      const crewToo = a.what === "Destroy" || a.what === "Acquire";
      const tgt = a.tf === "crew" ? null : find(doc, a.tf);
      const items = a.tf === "crew" ? [...sheetOf(id).res.map((x) => ({ ...x, l: "res" })), ...sheetOf(id).assets.map((x) => ({ ...x, l: "assets" }))] : tgt ? [...tgt.res.map((x) => ({ ...x, l: "res" })), ...tgt.assets.map((x) => ({ ...x, l: "assets" }))] : [];
      at = `<fieldset class="cc-group"><legend>At who</legend><div class="tg-targets">${others.map((x) => `<button type="button" class="tg-target" data-act="ft" data-do="tf" data-f="${esc(x.id)}"${pressed(a.tf === x.id)}><span class="ft-fac-die" aria-hidden="true">${them(powerOf(x))}</span><span><b>${esc(x.name)}</b><small>${diceLabel(powerOf(x))}</small></span></button>`).join("")}
        ${crewToo ? `<button type="button" class="tg-target" data-act="ft" data-do="tf" data-f="crew"${pressed(a.tf === "crew")}><span class="ft-fac-die" aria-hidden="true">${kitDie(crewPower(id)[0] ?? 2, { own: "you", hide: true })}</span><span><b>${esc(crewName(id))}</b><small>the crew, ${diceLabel(crewPower(id))}</small></span></button>` : ""}</div></fieldset>
        ${(a.what === "Destroy" || a.what === "Acquire") && items.length ? `<fieldset class="cc-group"><legend>What it’s after</legend><div class="cc-chips">${items.map((x) => `<button type="button" class="cc-chipbtn sm" data-act="ft" data-do="item" data-l="${x.l}" data-id="${esc(x.id)}"${pressed(a.item?.lid === x.id)}>${esc(x.text)}${x.x > 1 ? ` <small>×${x.x}${x.left < x.x ? `, ${x.left} left` : ""}</small>` : ""}</button>`).join("")}</div></fieldset>` : ""}
        ${a.tf ? `<fieldset class="cc-group"><legend>What it rolls against</legend>${choice("against", a.against === "power", a.tf === "crew" ? "The crew’s Power" : "Its Power", a.tf === "crew" ? diceLabel(crewPower(id)) : tgt ? `${diceLabel(powerOf(tgt))}, rolled once this downtime` : "", ' data-v="power"')}
          ${choice("against", a.against === "die", "Something with a die of its own", "one thing out on its own, a stake or someone", ' data-v="die"')}${a.against === "die" ? sizesRow("died", a.dieD) : ""}</fieldset>` : ""}`;
    }
    if (a.what === "Obstruct") {
      const acts = t.acts.filter((x) => x.f !== f.id && !x.off);
      at = `<fieldset class="cc-group"><legend>Which action it’s stopping</legend>${acts.length ? acts.map((x) => choice("oact", a.oact === x.id, esc(x.name), `${esc(x.does)} · ${diceLabel(allDice(x))}`, ` data-id="${esc(x.id)}"`)).join("") : '<p class="cc-small">Pick the other factions’ actions first. Obstruct stops one of them.</p>'}</fieldset>`;
    }
    if (a.what === "Establish") {
      at = `<label class="tg-label" for="ft-est">What it builds</label><input id="ft-est" data-ft="est" maxlength="${MAX.at}" autocomplete="off" placeholder="A new asset, a resource, or a mini faction" value="${esc(a.est)}">
        <fieldset class="cc-group"><legend>Is anyone in the way?</legend>${choice("against", a.against !== "die", "Nobody’s in the way", "so it happens, unless someone stops it", ' data-v="none"')}${choice("against", a.against === "die", "Something’s in the way", "it rolls against that", ' data-v="die"')}${a.against === "die" ? sizesRow("died", a.dieD) : ""}</fieldset>`;
    }
    if (a.what === "write") {
      at = `<label class="tg-label" for="ft-agenda">Its new agenda</label><input id="ft-agenda" data-ft="agenda" maxlength="${MAX.at}" autocomplete="off" placeholder="Find the painted box" value="${esc(a.agenda.text)}">
        ${AGENDAS.length ? `<div class="cc-chips tg-verbs">${btn("rollag", "Roll for one on the agendas table", { cls: "cc-chipbtn sm" })}</div>` : ""}
        <fieldset class="cc-group"><legend>Where it starts</legend>${sizesRow("agd", a.agenda.die)}</fieldset>`;
    }
    if (a.what === "comes") {
      const t12 = comesTable(id, t, f);
      at = `<fieldset class="cc-group"><legend>The d12, rolled now so the crew knows what’s coming</legend>
        <p class="cc-small">${t12.why}</p>
        ${a.comes ? `<p class="ft-comes"><b>${a.comes.n}.</b> ${esc(a.comes.text)}</p>` : ""}
        <div class="tg-do">${btn("d12", a.comes ? "Roll it again" : "Roll the d12", { cls: a.comes ? "button" : "button primary" })}</div>
        <p class="cc-small">Rolled a real one? Tap what it came up.</p><div class="ft-nums">${Array.from({ length: 12 }, (_, i) => `<button type="button" class="tg-size ft-num" data-act="ft" data-do="d12n" data-n="${i + 1}"${pressed(a.comes?.n === i + 1)}>${i + 1}</button>`).join("")}</div></fieldset>`;
    }
    const rolledD6 = a.d6 ? BOOK.does.find((x) => a.d6 >= x.from && a.d6 <= x.to) : null;
    const preview = built ? actCard(id, { ...t, pressure: a.pressure ? built.id : null }, previewOf(built), true) : "";
    const splitMax = Math.min(6, steps - 1);
    return `${head(f.name, `Downtime ${t.n} · ${f.mini ? "a mini faction’s action" : "its action"}`)}
      <div class="dlg-body ft-dlg tg-compose">
        ${preview ? `<ol class="tg-list tg-preview" aria-hidden="true">${preview}</ol>` : ""}
        ${hired ? `<p class="tg-for"><span class="k">Paid by ${esc(hired.by === "crew" ? "the crew" : hired.byName)}</span>${esc(hired.job)}. Its one action is the job.</p>` : ""}
        ${f.mini ? `<p class="cc-small">A mini faction only does its two outcomes, and it doesn’t act in the downtime it’s made.</p>` : ""}
        <fieldset class="cc-group"><legend>What it’s doing</legend>
          <div class="cc-chips tg-verbs">${btn("d6", "Not sure? Roll the d6", { cls: "cc-chipbtn sm" })}</div>
          ${rolledD6 ? `<p class="ft-comes"><b>${a.d6} on the d6.</b> ${esc(rolledD6.text)}</p>` : ""}
          ${whats}</fieldset>
        ${at}
        ${a.what ? `<fieldset class="cc-group"><legend>Its dice</legend>
          <p class="cc-small">Its Power’s ${diceLabel(powerOf(f))}, ${stepsSay(stepsOf(f))}. Each bond thread that fits is a step.</p>
          ${fits.map((x) => choice("fit", a.fits.includes(x.id), `<em>${esc(x.text)}</em>`, esc(x.where), ` data-id="${esc(x.id)}"`)).join("")}
          <p class="ft-total">${them(dice.main)}${dice.split ? them([dice.split]) : ""} <span>${stepsSay(steps)}, ${diceLabel(allDice(dice))}</span></p>
          ${splitMax >= 1 ? `${choice("split", Boolean(a.split), "Split it", "one action gives it one split: two dice, each its own outcome")}
            ${a.split ? `<div class="cc-chips">${Array.from({ length: splitMax }, (_, i) => `<button type="button" class="cc-chipbtn sm" data-act="ft" data-do="splits" data-s="${i + 1}"${pressed(a.split.s === i + 1)}>A d${(i + 1) * 2}</button>`).join("")}</div>
              <label class="tg-label" for="ft-splitfor">What that die’s for</label><input id="ft-splitfor" data-ft="splitfor" maxlength="${MAX.at}" autocomplete="off" placeholder="Keep its name out of it" value="${esc(a.split.for)}">` : ""}` : ""}</fieldset>
        <label class="tg-label" for="ft-does">What the crew sees</label>
        <input id="ft-does" data-ft="does" maxlength="${MAX.line}" autocomplete="off" value="${esc(built?.does ?? a.does)}">
        <fieldset class="cc-group"><legend>On the table</legend>
          ${choice("pressure", a.pressure && !a.off, "It’s the faction pressure", "whichever action matters most to the crew")}
          ${choice("off", a.off, "Move it off-screen", "no telegraph and no roll, and you say what changed")}</fieldset>` : ""}
      </div>
      <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}${btn("saveact", "Save it", { cls: "button primary" })}${t.acts.some((x) => x.id === a.id) ? btn("dropact", ui.sure === `drop:${a.id}` ? "Tap again to take it off" : "Take it off", { cls: "button danger" }) : ""}</div>`;
  }

  // The card as it'll go out, while she's still picking.
  function previewOf(built) {
    const dice = diceOf(built.steps, built.split?.s < built.steps ? built.split : null);
    return { ...built, main: dice.main, split: built.split && dice.split ? { ...built.split, d: dice.split } : null, roll: true, faces: null, won: null, stop: null, done: null };
  }

  // Which of the two d12 tables a faction comes for the crew on: mostly
  // hostile threads, the first, mostly bond threads, the second, and neither,
  // a d2 first. Paid to do it, the payer's threads decide.
  function comesTable(id, t, f) {
    const hired = t.hires.find((h) => h.to === f.id);
    const payer = hired && hired.by !== "crew" ? find(boardOf(id), hired.by) : null;
    const who = payer ?? f;
    const s = standingOf(who);
    const whose = payer ? `${payer.name}’s paying, so it’s ${poss(lower(payer.name))} threads toward the crew that count.` : "";
    if (s === "hostile") return { t: "hostile", why: `${whose} ${cap(lower(who.name))}’s threads toward the crew are mostly hostile, so it’s the first table.`.trim() };
    if (s === "friendly") return { t: "bond", why: `${whose} ${cap(lower(who.name))}’s threads toward the crew are mostly bond threads, so it’s the second table.`.trim() };
    return { t: null, why: `${whose} ${cap(lower(who.name))} has as many bond threads as hostile toward the crew, or none, so a d2 picks the table first.`.trim() };
  }

  function saveAct(r) {
    const id = r.camp;
    const t = turnOf(id);
    const a = r.a;
    const built = t ? actOf(id, t, r) : null;
    const err = !a.what ? "Pick what it’s doing." : a.what === "agenda" && !built ? "Pick which agenda." : ["Destroy", "Undermine", "Influence", "Acquire"].includes(a.what) && !a.tf ? "Pick who it’s going at." : a.what === "Obstruct" && !a.oact ? "Pick which action it’s stopping." : a.what === "write" && !a.agenda.text.trim() ? "Write its new agenda." : a.what === "write" && !a.agenda.die ? "Pick where its new agenda starts." : a.what === "comes" && !a.comes ? "Roll the d12, so the crew knows what’s coming." : a.against === "die" && !a.dieD && (a.what === "Establish" || ["Destroy", "Undermine", "Influence", "Acquire"].includes(a.what)) ? "Pick the die it’s up against." : a.split && !a.split.for.trim() ? "Say what the split die’s for." : !built ? "That doesn’t add up yet." : "";
    if (err) {
      r.err = err;
      return d.renderDialog();
    }
    push(id, { o: "ft-act", a: built });
    if (a.pressure && !a.off && t.pressure !== built.id) push(id, { o: "ft-pressure", id: built.id });
    if ((!a.pressure || a.off) && t.pressure === built.id) push(id, { o: "ft-pressure", id: null });
    d.closeDialog();
  }

  // ------------------------------------------------------------ dialogs: the crew's action

  function crewDraft(id, t) {
    const c = t.crew;
    const place = mine(id);
    if (c && !rolled(c)) {
      return { id: c.id, move: c.move, tf: c.at.f, part: c.at.part, lid: c.at.lid, l: c.at.l, oact: c.at.act, thing: c.at.part === "thing" && !c.at.lid ? c.at.name.replace(/^.*’s /, "") : "", est: c.move === "Establish" || c.move === "Else" ? c.does : "", inWay: c.move === "Establish" && c.vs.k !== "none", how: c.how, ownCh: c.who?.ch ?? place?.ch ?? null, ownSteps: c.how === "own" ? c.steps : 1, fits: [...c.fits], split: c.split ? { ...c.split } : null, does: c.does, edited: true, slot: Boolean(c.slot && c.slot.user === me()) };
    }
    return { id: newId(), move: null, tf: null, part: null, lid: null, l: null, oact: null, thing: "", est: "", inWay: false, how: "crew", ownCh: place?.ch ?? null, ownSteps: 1, fits: [], split: null, does: "", edited: false, slot: false };
  }

  // The crew's Reputations and the bond threads toward it that the crew can
  // see, any of which can be a step when it fits.
  function crewFits(id) {
    const out = sheetOf(id).reps.map((x) => ({ text: x.text, where: "A Reputation" }));
    for (const f of boardOf(id).factions) for (const x of f.threads) if (x.to === "crew" && x.kind === "bond" && x.s === "whole") out.push({ text: x.text, where: `${poss(f.name)} thread toward the crew` });
    return out;
  }

  function crewOfDraft(id, t, r) {
    const c = r.c;
    const doc = boardOf(id);
    const sheet = sheetOf(id);
    const gm = gmIn(id);
    const f = c.tf && c.tf !== "crew" ? find(doc, c.tf) : null;
    let at = { f: c.tf, name: f?.name ?? "", part: c.part };
    let vs = { k: "none" };
    let does = "";
    const goal = sheet.goal;
    switch (c.move) {
      case "Obstruct": {
        const o = t.acts.find((x) => x.id === c.oact);
        if (!o) return null;
        at = { f: o.f, name: `${poss(o.name)} action`, act: o.id, part: "act" };
        vs = { k: "act" };
        does = `Stop ${poss(lower(o.name))} action`;
        break;
      }
      case "Set back": {
        if (!f) return null;
        const ag = f.agendas.find((x) => x.id === c.lid);
        at = { f: f.id, name: ag ? `${poss(f.name)} agenda, ${bare(ag.text)}` : `${poss(f.name)} agenda`, part: "agenda", l: ag ? "agendas" : null, lid: ag?.id ?? null };
        vs = { k: "die", f: f.id, d: ag ? [ag.die] : [] };
        does = `Set back ${poss(lower(f.name))} agenda`;
        break;
      }
      case "Work for it":
        if (!f) return null;
        at = { f: f.id, name: f.name, part: null };
        does = `Work for ${lower(f.name)}`;
        break;
      case "Establish":
        at = { f: "crew", name: bare(c.est) };
        vs = c.inWay ? { k: "die", d: [] } : { k: "none" };
        does = c.est ? bare(c.est) : "Build something new";
        break;
      case "Goal":
        at = { f: "crew", name: goal.text ? `the Goal, ${bare(goal.text)}` : "the Goal", part: "goal" };
        vs = { k: "die", d: [goal.die] };
        does = "Chase the Goal";
        break;
      case "Project": {
        const p = sheet.projects.find((x) => x.id === c.lid);
        if (!p) return null;
        at = { f: "crew", name: p.text, part: "project", lid: p.id };
        vs = { k: "die", d: [p.die] };
        does = `Work on ${bare(p.text).charAt(0).toLowerCase()}${bare(p.text).slice(1)}`;
        break;
      }
      case "Else":
        at = { f: null, name: "" };
        does = c.est ? bare(c.est) : "";
        break;
      default: {
        if (!f) return null;
        const part = c.part ?? "power";
        const items = [...f.res.map((x) => ({ ...x, l: "res" })), ...f.assets.map((x) => ({ ...x, l: "assets" }))];
        const item = part === "thing" ? items.find((x) => x.id === c.lid) : null;
        const thing = item?.text ?? bare(c.thing);
        at = { f: f.id, name: part === "thing" ? `${poss(f.name)} ${thing || "thing out on its own"}` : part === "face" ? `${poss(f.name)} face` : f.name, part, l: item?.l ?? null, lid: item?.id ?? null };
        vs = part === "power" ? { k: "power", f: f.id, d: gm ? powerOf(f) : f.shown.power ? powerOf(f) : [] } : { k: "die", f: f.id, d: [] };
        const verb = { Destroy: "Hit", Undermine: "Undermine", Influence: "Win over", Acquire: "Take" }[c.move] ?? c.move;
        does = `${verb} ${lower(at.name)}`;
      }
    }
    const fits = c.how === "crew" ? c.fits : [];
    const steps = c.how === "own" ? Math.max(1, c.ownSteps) : crewOf(id).steps + fits.length;
    const who = c.how === "own" ? T().rosterOf(id).find((p) => p.ch === c.ownCh) : null;
    return { id: c.id, move: c.move, at, does: c.edited && c.does ? c.does : does, how: who ? "own" : "crew", who: who ? { user: who.user, ch: who.ch } : null, steps, fits, split: c.split?.for ? c.split : null, vs };
  }

  function crewView(r) {
    const id = r.camp;
    const t = turnOf(id);
    if (!t) return closed();
    const c = r.c;
    const doc = boardOf(id);
    const gm = gmIn(id);
    const sheet = sheetOf(id);
    const place = mine(id);
    const facs = boardOrder(doc).filter((f) => !f.mini || f.parent !== "crew");
    const moveBtn = (m, sub) => choice("move", c.move === m, MOVE_NAMES[m] ?? m, sub, ` data-m="${m}"`);
    const moveSub = (name) => BOOK.moves.find((x) => x.name === name || x.name.startsWith(name))?.win ?? "";
    const facCards = (list) => `<div class="tg-targets">${list.map((f) => `<button type="button" class="tg-target" data-act="ft" data-do="ctf" data-f="${esc(f.id)}"${pressed(c.tf === f.id)}><span class="ft-fac-die" aria-hidden="true">${gm || f.shown.power ? them(powerOf(f)) : '<span class="wb-unknown">?</span>'}</span><span><b>${esc(f.name)}</b><small>${gm || f.shown.power ? diceLabel(powerOf(f)) : "Power not known"}</small></span></button>`).join("")}</div>`;
    let at = "";
    if (["Destroy", "Undermine", "Influence", "Acquire", "Set back", "Work for it"].includes(c.move)) {
      at = `<fieldset class="cc-group"><legend>At which faction</legend>${facs.length ? facCards(facs) : '<p class="cc-small">The crew hasn’t been shown any factions yet.</p>'}</fieldset>`;
      const f = c.tf ? find(doc, c.tf) : null;
      if (f && ["Destroy", "Undermine", "Influence", "Acquire"].includes(c.move)) {
        const parts = c.move === "Destroy" || c.move === "Acquire" ? [["power", "Its Power", "the whole faction"], ["thing", "One thing out on its own", "only what’s guarding it, like a warehouse on the docks"]] : [["face", "Its face", c.move === "Influence" ? "the crew’s action can always go at its face on its own" : "its face, in person"], ["power", "Its Power", "the whole faction"]];
        const items = [...f.res.map((x) => ({ ...x, l: "res" })), ...f.assets.map((x) => ({ ...x, l: "assets" }))];
        at += `<fieldset class="cc-group"><legend>Going at</legend>${parts.map(([p, label, sub]) => choice("part", (c.part ?? parts[0][0]) === p, label, sub, ` data-p="${p}"`)).join("")}
          ${(c.part ?? parts[0][0]) === "thing" ? `${items.length ? `<div class="cc-chips">${items.map((x) => `<button type="button" class="cc-chipbtn sm" data-act="ft" data-do="cthing" data-id="${esc(x.id)}"${pressed(c.lid === x.id)}>${esc(x.text)}</button>`).join("")}</div>` : ""}
            <label class="tg-label" for="ft-thing">${items.length ? "Or name it" : "What it is"}</label><input id="ft-thing" data-ft="thing" maxlength="${MAX.name}" autocomplete="off" placeholder="The vineyards up in the hills" value="${esc(c.thing)}">` : ""}</fieldset>`;
      }
      if (f && c.move === "Set back") {
        const ags = f.agendas.filter((x) => !x.done);
        at += ags.length ? `<fieldset class="cc-group"><legend>Which agenda</legend>${ags.map((x) => choice("cag", c.lid === x.id, esc(x.text), `d${x.die}`, ` data-id="${esc(x.id)}"`)).join("")}</fieldset>` : `<p class="cc-small">The crew hasn’t been shown its agenda, so ${esc(gmName(id))} says what die it’s at.</p>`;
      }
    }
    if (c.move === "Obstruct") {
      const acts = t.acts.filter((x) => !x.off);
      at = `<fieldset class="cc-group"><legend>Which action</legend>${acts.length ? acts.map((x) => choice("coact", c.oact === x.id, esc(x.name), `${esc(x.does)} · ${diceLabel(allDice(x))}`, ` data-id="${esc(x.id)}"`)).join("") : '<p class="cc-small">There’s nothing telegraphed to stop.</p>'}</fieldset>`;
    }
    if (c.move === "Project") at = `<fieldset class="cc-group"><legend>Which project</legend>${sheet.projects.filter((p) => !p.done).length ? sheet.projects.filter((p) => !p.done).map((p) => choice("cproj", c.lid === p.id, esc(p.text), `d${p.die}`, ` data-id="${esc(p.id)}"`)).join("") : '<p class="cc-small">There are no projects on the party sheet.</p>'}</fieldset>`;
    if (c.move === "Goal") at = `<p class="tg-for"><span class="k">The Party Goal, d${sheet.goal.die}</span>${esc(sheet.goal.text || "No Goal on the party sheet yet.")}</p>`;
    if (c.move === "Establish" || c.move === "Else") {
      at = `<label class="tg-label" for="ft-est">${c.move === "Establish" ? "What the crew builds" : "What the crew’s doing"}</label><input id="ft-est" data-ft="est" maxlength="${MAX.at}" autocomplete="off" placeholder="${c.move === "Establish" ? "Muscle, paid for with Salt Contracts" : "Hold back the festival"}" value="${esc(c.est)}">
        ${c.move === "Establish" ? `<p class="cc-small">A new asset paid for with an extra resource, a mini faction, or something the crew’s lost, built back.</p>${choice("inway", c.inWay, "Something’s in the way", `so ${esc(gmName(id))} says what it’s up against`)}` : ""}`;
    }
    const built = c.move ? crewOfDraft(id, t, r) : null;
    const fits = crewFits(id);
    const roster = T().rosterOf(id);
    const baseSteps = c.how === "own" ? Math.max(1, c.ownSteps) : crewOf(id).steps + c.fits.length;
    const slotIn = (t.crew?.slot && t.crew.slot.user !== me()) || c.slot;
    const total = baseSteps * (slotIn ? 2 : 1);
    const dice = diceOf(total, c.split?.s && c.split.s < total ? c.split : null);
    const splitMax = Math.min(6, total - 1);
    const withHtml = c.move && c.move !== "Work for it" && c.move !== "Else" ? `<fieldset class="cc-group"><legend>What it rolls</legend>
        ${choice("how", c.how === "crew", "The crew’s Power, and what fits", `${diceLabel(crewPower(id))}, plus a step for every Reputation and bond thread that fits`, ' data-v="crew"')}
        ${c.how === "crew" ? fits.map((x) => choice("cfit", c.fits.includes(x.text), `<em>${esc(x.text)}</em>`, esc(x.where), ` data-t="${esc(x.text)}"`)).join("") : ""}
        ${choice("how", c.how === "own", "Someone’s own permissions", "when one of the crew’s plainly the right person for it: 1 step for the action, plus everything that fits", ' data-v="own"')}
        ${c.how === "own" ? `${gm ? `<div class="cc-chips">${roster.map((p) => `<button type="button" class="cc-chipbtn sm" data-act="ft" data-do="ownch" data-ch="${esc(p.ch)}"${pressed(c.ownCh === p.ch)}>${esc(p.cname)}</button>`).join("")}</div>` : ""}
          <div class="ft-stepper"><span>${esc(roster.find((p) => p.ch === c.ownCh)?.cname ?? place?.cname ?? "Their")} rolls</span>${btn("own", "−", { cls: "button sm", attrs: ' data-by="-1" aria-label="One step fewer"' })}<b>${stepsSay(Math.max(1, c.ownSteps))}</b>${btn("own", "+", { cls: "button sm", attrs: ' data-by="1" aria-label="One more step"' })}</div>` : ""}
        ${place && !gm ? choice("cslot", c.slot, `Put one of ${esc(place.cname)}’s personal slots in`, "two slots on one move count everything twice") : ""}
        <p class="ft-total">${dice.main.map((x, i) => kitDie(x, { own: "you", hide: true, cls: i ? "is-next" : "" })).join("")}${dice.split ? kitDie(dice.split, { own: "you", hide: true }) : ""} <span>${stepsSay(total)}${slotIn ? ", counted twice" : ""}, ${diceLabel(allDice(dice))}</span></p>
        ${splitMax >= 1 ? `${choice("csplit", Boolean(c.split), "Split it", "two dice, each with its own intent")}
          ${c.split ? `<div class="cc-chips">${Array.from({ length: splitMax }, (_, i) => `<button type="button" class="cc-chipbtn sm" data-act="ft" data-do="csplits" data-s="${i + 1}"${pressed(c.split.s === i + 1)}>A d${(i + 1) * 2}</button>`).join("")}</div>
            <label class="tg-label" for="ft-csplitfor">What that die’s for</label><input id="ft-csplitfor" data-ft="csplitfor" maxlength="${MAX.at}" autocomplete="off" placeholder="Keep it quiet" value="${esc(c.split.for)}">` : ""}` : ""}</fieldset>` : "";
    const warn = built && c.how === "crew" && !slotIn ? biggerNote(id, t, { ...built, slot: null, at: built.at, vs: { ...built.vs, d: built.vs.k === "act" ? allDice(t.acts.find((x) => x.id === built.at.act) ?? { main: [], split: null }) : built.vs.d } }) : "";
    return `${head("The crew’s action", `Downtime ${t.n} · one action, like every faction`)}
      <div class="dlg-body ft-dlg tg-compose">
        <fieldset class="cc-group"><legend>A move on a faction</legend>
          ${["Destroy", "Undermine", "Obstruct", "Influence", "Acquire", "Establish"].map((m) => moveBtn(m, moveSub(m))).join("")}
          ${moveBtn("Set back", moveSub("Set back its agenda"))}${moveBtn("Work for it", moveSub("Work for it"))}</fieldset>
        <fieldset class="cc-group"><legend>Or something else</legend>${moveBtn("Goal", `against the Goal’s die, d${sheet.goal.die}`)}${moveBtn("Project", "against the project’s die")}${moveBtn("Else", "advance a world event, support an Aspiration, anything else")}</fieldset>
        ${at}${withHtml}${warn}
        ${c.move ? `<label class="tg-label" for="ft-cdoes">In a line</label><input id="ft-cdoes" data-ft="cdoes" maxlength="${MAX.line}" autocomplete="off" value="${esc(built?.does ?? c.does)}">` : ""}
        <p class="cc-small">Ties go to the faction. There’s no Aura in downtime, but a player can spend 1 Resolve to roll the crew’s dice again, or the crew can spend an extra resource and take the tie. ${ruleLink("s-downtime-rolls", "Rolling in downtime")}</p>
      </div>
      <div class="dlg-foot">${r.err ? `<p class="cc-warn" role="alert">${esc(r.err)}</p>` : ""}${btn("savecrew", "That’s the crew’s action", { cls: "button primary" })}${t.crew && !rolled(t.crew) ? btn("dropcrew", ui.sure === "dropcrew" ? "Tap again to clear it" : "Clear it", { cls: "button danger" }) : ""}</div>`;
  }

  function saveCrew(r) {
    const id = r.camp;
    const t = turnOf(id);
    const c = r.c;
    const built = t && c.move ? crewOfDraft(id, t, r) : null;
    const err = !c.move ? "Pick what the crew’s doing." : ["Destroy", "Undermine", "Influence", "Acquire", "Set back", "Work for it"].includes(c.move) && !c.tf ? "Pick which faction." : c.move === "Obstruct" && !c.oact ? "Pick which action the crew’s stopping." : c.move === "Project" && !c.lid ? "Pick which project." : (c.move === "Establish" || c.move === "Else") && !c.est.trim() ? "Say what the crew’s doing." : c.how === "own" && !c.ownCh ? "Pick whose permissions." : c.split && !c.split.for.trim() ? "Say what the split die’s for." : !built || !built.does ? "That doesn’t add up yet." : "";
    if (err) {
      r.err = err;
      return d.renderDialog();
    }
    push(id, { o: "ft-crew", c: built });
    const slotNow = Boolean(t.crew?.slot && t.crew.slot.user === me());
    if (!gmIn(id) && c.slot !== slotNow) push(id, { o: "ft-slot", on: c.slot });
    d.closeDialog();
  }

  // ------------------------------------------------------------ dialogs: what the crew's up against

  function vsView(r) {
    const id = r.camp;
    const t = turnOf(id);
    const c = t?.crew;
    if (!c) return closed();
    const f = c.at.f && c.at.f !== "crew" ? find(boardOf(id), c.at.f) : null;
    const kept = c.vs.k === "power" ? t.power[c.vs.f] : null;
    const suggest = c.at.part === "power" && f ? powerOf(f) : c.at.part === "agenda" && f ? (() => {
      const ag = f.agendas.find((x) => x.id === c.at.lid) ?? f.agendas.find((x) => !x.done);
      return ag ? [ag.die] : null;
    })() : null;
    const thing = c.at.part === "thing" && f ? 1 + f.assets.filter((a) => a.power && !a.off).length : null;
    return `${head("What it’s up against", `Downtime ${t.n} · the crew’s action`)}
      <div class="dlg-body ft-dlg tg-compose">
        <p class="tg-for"><span class="k">The crew’s going at</span>${esc(c.at.name || "something")}: ${esc(c.does)}.</p>
        ${kept ? `<p class="cc-lead">${esc(f?.name ?? "Its")} Power came up ${best(kept.v)} on its ${diceLabel(kept.d)} already this downtime, and that roll stands.</p>` : ""}
        ${suggest && !kept ? `<div class="tg-do">${btn("vsd", `${c.at.part === "power" ? "Its Power" : "Its agenda"}, ${diceLabel(suggest)}`, { cls: "button primary", attrs: ` data-d="${suggest.join(",")}" data-k="${c.at.part === "power" ? "power" : "die"}"` })}</div><p class="cc-small">Or pick another die.</p>` : ""}
        ${thing && !kept ? `<p class="cc-small">One thing out on its own only has what’s guarding it: 1 step, plus each asset that adds Power and is really there. With every one there, that’s ${diceLabel(stepsToDice(thing))}.</p>` : ""}
        ${kept ? "" : sizesRow("vsd", c.vs.d.length === 1 ? c.vs.d[0] : 0)}
        ${biggerNote(id, t, c)}
      </div>
      <div class="dlg-foot">${kept ? btn("vsd", "That’s it", { cls: "button primary", attrs: ` data-d="${kept.d.join(",")}" data-k="power"` }) : '<p class="cc-small">A tap picks it, and the crew can roll.</p>'}</div>`;
  }

  // ------------------------------------------------------------ dialogs: real dice

  // Each die in a roll still to come up, the GM's and the crew's: the
  // action's own, and whatever it's going at, unless that's rolled already.
  function rowsFor(id, t, x) {
    const rows = [];
    const crew = x === "crew";
    const it = crew ? t.crew : t.acts.find((a) => a.id === x);
    if (!it) return rows;
    const dice = crew ? crewDice(it) : shapeOf(it);
    if (!it.faces) {
      dice.main.forEach((d2, i) => rows.push({ key: `m${i}`, label: `${crew ? "The crew’s" : poss(it.name)} d${d2}`, size: d2, v: 0 }));
      if (dice.split) rows.push({ key: "s", label: `${crew ? "The crew’s" : poss(it.name)} d${dice.split} for “${it.split.for}”`, size: dice.split, v: 0 });
    }
    const vs = it.vs;
    if (vs.k === "power" && !t.power[vs.f]) vs.d.forEach((d2, i) => rows.push({ key: `v${i}`, label: `${vs.f === "crew" ? "The crew’s" : poss(boardOf(id).factions.find((f) => f.id === vs.f)?.name ?? "Its")} Power, a d${d2}`, size: d2, v: 0 }));
    if (vs.k === "die") vs.d.forEach((d2, i) => rows.push({ key: `v${i}`, label: `What it’s up against, a d${d2}`, size: d2, v: 0 }));
    if (vs.k === "act") {
      const target = t.acts.find((a) => a.id === vs.act);
      if (target && !target.faces) allDice(target).forEach((d2, i) => rows.push({ key: `t${i}`, label: `${poss(target.name)} d${d2}`, size: d2, v: 0 }));
    }
    return rows;
  }

  function realView(r) {
    const id = r.camp;
    const t = turnOf(id);
    if (!t) return closed();
    const all = r.rows.every((x) => x.v);
    return `${head("Real dice", `Downtime ${t.n}`)}
      <div class="dlg-body ft-dlg"><p class="cc-lead">Roll them at the table, then tap what each one came up.</p>
        ${r.rows.map((x, i) => `<fieldset class="cc-group"><legend>${esc(x.label)}</legend><div class="ft-nums">${Array.from({ length: x.size }, (_, n) => `<button type="button" class="tg-size ft-num" data-act="ft" data-do="realn" data-i="${i}" data-n="${n + 1}"${pressed(x.v === n + 1)}>${n + 1}</button>`).join("")}</div></fieldset>`).join("")}</div>
      <div class="dlg-foot">${btn("saveroll", "That’s the roll", { cls: "button primary", disabled: !all })}</div>`;
  }

  // The faces a roll's ops carry, from rolling on this phone or from real
  // dice tapped in (rows).
  function facesOf(id, t, x, rows = null) {
    const crew = x === "crew";
    const it = crew ? t.crew : t.acts.find((a) => a.id === x);
    const dice = crew ? crewDice(it) : shapeOf(it);
    const got = (key, size) => (rows ? rows.find((y) => y.key === key)?.v : null) ?? rollDie(size);
    const out = {};
    if (!it.faces) out.faces = { main: dice.main.map((s, i) => got(`m${i}`, s)), split: dice.split ? got("s", dice.split) : null };
    const vs = it.vs;
    if ((vs.k === "power" && !t.power[vs.f]) || vs.k === "die") out.vsFaces = vs.d.map((s, i) => got(`v${i}`, s));
    if (vs.k === "act") {
      const target = t.acts.find((a) => a.id === vs.act);
      if (target && !target.faces) {
        const td = allDice(target);
        const v = td.map((s, i) => got(`t${i}`, s));
        out.tFaces = { main: v.slice(0, target.main.length), split: target.split ? v[v.length - 1] : null };
      }
    }
    if (rows) out.real = true;
    return out;
  }

  // ------------------------------------------------------------ dialogs: what changes

  // The line for what changed, as it'll read on everyone's phone.
  function lineOf(id, t, x) {
    const crew = x === t.crew;
    const who = crew ? crewName(id) : x.name;
    const tn = x.at.name || "";
    if (x.stop?.won) return "";
    if (!crew && x.what === "comes") {
      const said = bare(x.comes?.text);
      return `${who} came for the crew: ${said.charAt(0).toLowerCase()}${said.slice(1)}.`;
    }
    const move = crew ? x.move : x.what;
    if (move === "Else") return `${bare(x.does)}.`;
    if (x.won && !x.won.main && x.vs.k !== "none") return crew ? `The crew went at ${lower(tn) || "it"} and didn’t get there.` : `${who} went after ${lower(tn) || "something"} and didn’t get there. It’s a little angrier about it.`;
    switch (move) {
      case "Destroy": return `${who} hit ${lower(tn)}.`;
      case "Undermine": return `${who} undermined ${lower(tn)}.`;
      case "Influence": return `${who} won ${lower(tn)} over.`;
      case "Acquire": return `${who} took ${lower(tn)}.`;
      case "Establish": return `${who} built something new: ${lower(bare(tn) || "a new asset")}.`;
      case "Obstruct": return `${who} stopped ${lower(tn)}.`;
      case "agenda": return `${poss(who)} agenda climbed: ${bare(tn)}.`;
      case "write": return `${who} wants something new: ${bare(tn)}.`;
      case "Set back": return `The crew set back ${lower(tn)}.`;
      case "Work for it": return `${cap(lower(tn))} has a job for the crew next session.`;
      case "Goal": return "The crew’s Goal climbed.";
      case "Project": return `The crew’s project climbed: ${bare(tn)}.`;
    }
    return "";
  }

  const ago = (die) => ({ 2: "years off", 4: "a season or more away", 6: "a month or two away", 8: "a week or two away", 10: "days away", 12: "any day now" })[die] ?? "";

  // What a win changes on the cards: a button for each change, and a little
  // form for the ones that need words.
  function changes(id, t, x, r) {
    const crew = x === t.crew;
    const doc = boardOf(id);
    const sheet = sheetOf(id);
    const actor = crew ? "crew" : x.f;
    const actorName = crew ? crewName(id) : x.name;
    const move = crew ? x.move : x.what;
    const T2 = x.at.f && x.at.f !== "crew" ? find(doc, x.at.f) : null;
    const onCrew = x.at.f === "crew" && !crew;
    const won = x.won?.main;
    const out = [];
    const tap = (doit, label, attrs = "") => btn(doit, label, { cls: "button ft-chg", attrs });
    const open = (key) => r.form === key;
    const form = (key, label, inner) => (open(key) ? `<form class="cc-form ft-form" data-form="ft-${key}">${inner}<div class="cc-row"><button type="submit" class="button primary">Put it on</button>${btn("form", "Cancel", { attrs: ' data-k=""' })}</div></form>` : tap("form", label, ` data-k="${key}"`));
    const threadForm = (key, kind, label) => form(key, label, `<label class="cc-field">The thread <input name="text" maxlength="120" autocomplete="off" required placeholder="${kind === "hostile" ? "They took our contracts" : "They kept their word"}"></label>
      <fieldset class="cc-group"><legend>Where it goes</legend>
        <label class="pt-check"><input type="radio" name="where" value="to" checked> A thread toward ${esc(lower(actorName))}</label>
        ${BONDS.map(([l, name]) => `<label class="pt-check"><input type="radio" name="where" value="${l}"> ${name}</label>`).join("")}</fieldset><input type="hidden" name="kind" value="${kind}">`);
    if (!won && x.vs.k !== "none" && !(x.won && !x.roll)) {
      // It missed: nothing changes, unless they know who tried.
      if (T2 && actor !== T2.id) out.push(threadForm("hostile", "hostile", `They know who tried: ${esc(T2.name)} writes a hostile thread`));
      return out.join("");
    }
    if (move === "Destroy" || move === "Acquire") {
      const items = T2 ? [...T2.res.map((y) => ({ ...y, l: "res" })), ...T2.assets.map((y) => ({ ...y, l: "assets" }))] : onCrew ? [...sheet.res.map((y) => ({ ...y, l: "res" })), ...sheet.assets.map((y) => ({ ...y, l: "assets" }))] : [];
      const target = items.find((y) => y.id === x.at.lid);
      // It was after one thing, and that's gone: it's done.
      if (x.at.lid && !target) out.push(`<p class="ft-done-note">${esc(x.at.name)}: ${move === "Destroy" ? "gone" : `it’s ${crew ? "the crew’s" : poss(lower(actorName))} now`}.</p>`);
      const list = target ? [target] : x.at.lid ? [] : items;
      for (const y of list) {
        const ticks = y.x > 1 ? ` <small>${y.left} of ${y.x} left</small>` : "";
        if (move === "Destroy") out.push(tap("tick", `${onCrew ? "Take" : "Tick one off"} ${esc(y.text)}${onCrew ? " off the party sheet" : ""}${ticks}`, ` data-l="${y.l}" data-id="${esc(y.id)}"`));
        else out.push(tap("take", `${y.left > 1 ? "Tick one off" : "Take"} ${esc(y.text)}${y.left > 1 ? ticks : ` <small>it’s ${crew ? "the crew’s" : poss(lower(actorName))} now</small>`}`, ` data-l="${y.l}" data-id="${esc(y.id)}"`));
      }
      if (T2 && list.some((y) => y.x > 1)) out.push(`<p class="cc-small">A multiplier takes that many wins. Every hostile thread that fits adds a tick, so tap again for each.</p>`);
      if (!list.length && !x.at.lid) out.push(`<p class="cc-small">There’s nothing left there to ${move === "Destroy" ? "tick off" : "take"}.</p>`);
    }
    if (move === "Undermine" && T2) {
      const threads = [...BONDS.flatMap(([l, name]) => T2[l].filter((y) => y.kind === "bond" && y.s !== "snapped").map((y) => ({ ...y, l, name }))), ...T2.threads.filter((y) => y.kind === "bond" && y.s !== "snapped").map((y) => ({ ...y, l: "threads", name: "A thread" }))];
      for (const y of threads) out.push(tap("strain", `${y.s === "strained" ? "Strain it again and snap it" : "Strain"}: <em>${esc(y.text)}</em> <small>${esc(y.name)}</small>`, ` data-l="${y.l}" data-id="${esc(y.id)}"`));
      out.push(threadForm("hostile", "hostile", "Write a hostile thread"));
    }
    if (move === "Influence" && T2) {
      const strained = [...BONDS.flatMap(([l, name]) => T2[l].filter((y) => y.s === "strained").map((y) => ({ ...y, l, name }))), ...T2.threads.filter((y) => y.s === "strained").map((y) => ({ ...y, l: "threads", name: "A thread" }))];
      for (const y of strained) out.push(tap("mend", `Mend: <em>${esc(y.text)}</em> <small>${esc(y.name)}</small>`, ` data-l="${y.l}" data-id="${esc(y.id)}"`));
      out.push(threadForm("bond", "bond", crew ? "It writes a bond thread toward the crew" : "Write a bond thread"));
    }
    if (move === "Establish") {
      out.push(form("asset", crew ? "A new asset on the party sheet" : "A new asset", `<label class="cc-field">What it’s called <input name="text" maxlength="60" autocomplete="off" required></label><label class="cc-field">What it does <input name="does" maxlength="240" autocomplete="off"></label><label class="pt-check"><input type="checkbox" name="power"> It adds Power</label>`));
      out.push(form("res", crew ? "A resource the crew lost, built back" : "A new resource", `<label class="cc-field">What it is <input name="text" maxlength="60" autocomplete="off" required placeholder="A new mine, a new route or a new racket"></label>`));
      const maker = crew ? null : find(doc, x.f);
      const res = crew ? sheet.res : maker?.res ?? [];
      const assets = crew ? sheet.assets : maker?.assets ?? [];
      if ((crew || (maker && !maker.mini)) && minisOf(doc, actor).length < 3) {
        out.push(form("mini", "A mini faction", `<label class="cc-field">Its name <input name="name" maxlength="60" autocomplete="off" required placeholder="The Night Boats"></label>
          <label class="cc-field">The resource ${crew ? "the crew hands" : "it hands"} over <select name="res">${res.map((y) => `<option value="${esc(y.id)}">${esc(y.text)}</option>`).join("")}</select></label>
          <label class="cc-field">The asset ${crew ? "the crew hands" : "it hands"} over <select name="asset">${assets.map((y) => `<option value="${esc(y.id)}">${esc(y.text)}</option>`).join("")}</select></label>
          <fieldset class="cc-group"><legend>Its two outcomes</legend>${OUTCOMES.map((o) => `<label class="pt-check"><input type="checkbox" name="out-${o}"> ${o}</label>`).join("")}</fieldset>
          <label class="cc-field">Its Loyalty thread toward ${crew ? "the crew" : esc(lower(actorName))} <input name="loy" maxlength="120" autocomplete="off" placeholder="The Guild pays better than the river ever did"></label>`));
      }
    }
    if (move === "agenda") {
      const f = find(doc, x.f);
      const ag = f?.agendas.find((y) => y.id === x.at.lid);
      if (ag && !ag.done) out.push(tap("climb", `Climb it: ${esc(bare(ag.text))} <small>d${ag.die} to ${ag.die >= 12 ? "past d12, so it happens" : `d${ag.die + 2}, ${ago(ag.die + 2)}`}</small>`, ` data-id="${esc(ag.id)}"`));
      if (ag?.done) {
        out.push(`<div class="ft-happened"><p class="cc-lead"><b>${esc(bare(ag.text))} happened.</b> Three things follow. ${ruleLink("when-an-agenda-happens", "When an agenda happens")}</p>
          ${form("changed", "The world changes: say how, on the party sheet", `<label class="cc-field">How, in one sentence <input name="text" maxlength="160" autocomplete="off" required placeholder="The Vanes are back in the city"></label>`)}
          ${form("asset", "It grows: a new asset", `<label class="cc-field">What it’s called <input name="text" maxlength="60" autocomplete="off" required></label><label class="cc-field">What it does <input name="does" maxlength="240" autocomplete="off"></label><label class="pt-check"><input type="checkbox" name="power"> It adds Power</label>`)}
          ${form("res", "Or a new resource", `<label class="cc-field">What it is <input name="text" maxlength="60" autocomplete="off" required></label>`)}
          ${form("next", "It writes a new agenda", `<label class="cc-field">What it wants next <input name="text" maxlength="120" autocomplete="off" required></label><label class="cc-field">Where it starts <select name="die">${SIZES.map((s) => `<option value="${s}">d${s}, ${ago(s)}</option>`).join("")}</select></label>`)}</div>`);
      }
    }
    if (move === "write") {
      const f = find(doc, x.f);
      const on = f?.agendas.some((y) => keyOf(y.text) === keyOf(x.at.name));
      out.push(on ? `<p class="cc-small">It’s on ${esc(poss(lower(x.name)))} card.</p>` : f && f.agendas.length >= 2 ? `<p class="cc-small">${esc(x.name)} has two agendas already. Take one off its card first.</p>` : tap("write", `Put it on its card: ${esc(bare(x.at.name))} <small>at d${x.at.d ?? 2}</small>`));
    }
    if (move === "Set back" && T2) {
      const ag = T2.agendas.find((y) => y.id === x.at.lid) ?? T2.agendas.find((y) => !y.done);
      if (ag) out.push(ag.die > 2 ? tap("setback", `Step it down: ${esc(bare(ag.text))} <small>d${ag.die} to d${ag.die - 2}</small>`, ` data-id="${esc(ag.id)}" data-f="${esc(T2.id)}"`) : `<p class="cc-small">${esc(bare(ag.text))} is at d2 already, and it never goes lower.</p>`);
    }
    if (move === "Goal" && !sheet.goal.done) out.push(tap("goal", `Climb the Goal <small>d${sheet.goal.die} to ${sheet.goal.die >= 12 ? "past d12, so it’s done" : `d${sheet.goal.die + 2}`}</small>`));
    if (move === "Project") {
      const p = sheet.projects.find((y) => y.id === x.at.lid);
      if (p && !p.done) out.push(tap("project", `Climb it: ${esc(p.text)} <small>d${p.die} to ${p.die >= 12 ? "past d12, so it’s done" : `d${p.die + 2}`}</small>`, ` data-id="${esc(p.id)}"`));
    }
    // Nothing changes till they know, and that's what a second die's for.
    if (T2 && actor !== T2.id && move !== "Undermine" && move !== "Influence" && move !== "Work for it" && move !== "Set back") out.push(threadForm("hostile", "hostile", `They know who did it: ${esc(T2.name)} writes a hostile thread`));
    return out.join("");
  }
  const keyOf = (s) => String(s ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  function outView(r) {
    const id = r.camp;
    const t = turnOf(id);
    const x = !t ? null : r.x === "crew" ? t.crew : t.acts.find((a) => a.id === r.x);
    if (!x) return closed();
    const crew = r.x === "crew";
    const title = crew ? "The crew’s action" : x.name;
    const summary = crew ? `<p class="tg-for"><span class="k">${esc(MOVE_NAMES[x.move] ?? x.move)}</span>${esc(x.does)}${x.won && x.vs.k !== "none" ? `: ${esc(crewResult(x))}` : ""}.</p>` : `<ol class="tg-list">${actCard(id, t, x, true)}</ol>`;
    const changesHtml = changes(id, t, x, r);
    const line = r.line ?? lineOf(id, t, x);
    return `${head(title, `Downtime ${t.n} · what changes`)}
      <div class="dlg-body ft-dlg">${summary}
        ${changesHtml ? `<fieldset class="cc-group"><legend>${x.won?.main || x.vs.k === "none" || (!crew && !x.roll) ? "On the cards" : "Nothing changes, unless they know"}</legend><div class="ft-chgs">${changesHtml}</div><p class="cc-small">Each change is made as you tap it, with Undo if you need it.</p></fieldset>` : ""}
        <label class="tg-label" for="ft-line">What changed, in a line for everyone</label>
        <input id="ft-line" data-ft="line" maxlength="${MAX.line}" autocomplete="off" value="${esc(line)}">
        <p class="cc-small">${x.off ? "It moved off-screen, so this is all the crew hears of it. Leave it empty and they hear nothing." : "Leave it empty if it’s nobody’s news."}</p>
      </div>
      <div class="dlg-foot">${btn("saveout", "That’s what changed", { cls: "button primary" })}</div>`;
  }

  const closed = () => `${head("The faction turn")}<div class="dlg-body"><p class="cc-lead">That’s moved on. The downtime might have ended, or it’s changed on another phone.</p></div>`;

  function dialog(r) {
    if (r.kind === "ft-hire") return hireView(r);
    if (r.kind === "ft-act") return actView(r);
    if (r.kind === "ft-crew") return crewView(r);
    if (r.kind === "ft-vs") return vsView(r);
    if (r.kind === "ft-real") return realView(r);
    if (r.kind === "ft-out") return outView(r);
    return "";
  }

  // Typing in a dialog keeps what's typed, and redraws nothing, so the
  // keyboard stays put. The telegraph's card changes as she types.
  function input(el, r) {
    const k = el.dataset.ft;
    const v = el.value;
    r.err = "";
    if (r.kind === "ft-hire" && k === "job") r.job = v;
    if (r.kind === "ft-out" && k === "line") r.line = v;
    if (r.kind === "ft-act") {
      const a = r.a;
      if (k === "does") {
        a.does = v;
        a.edited = Boolean(v.trim());
      }
      if (k === "est") a.est = v;
      if (k === "agenda") a.agenda.text = v;
      if (k === "splitfor" && a.split) a.split.for = v;
      if (k !== "does" && !a.edited) {
        const built = actOf(r.camp, turnOf(r.camp), r);
        const box = el.closest(".dlg-body")?.querySelector("#ft-does");
        if (box && built) box.value = built.does;
      }
      const box = el.closest(".dlg-body")?.querySelector(".tg-preview");
      const t = turnOf(r.camp);
      const built = t ? actOf(r.camp, t, r) : null;
      if (box && built) box.innerHTML = actCard(r.camp, { ...t, pressure: a.pressure ? built.id : null }, previewOf(built), true);
    }
    if (r.kind === "ft-crew") {
      const c = r.c;
      if (k === "cdoes") {
        c.does = v;
        c.edited = Boolean(v.trim());
      }
      if (k === "est") c.est = v;
      if (k === "thing") {
        c.thing = v;
        c.lid = null;
      }
      if (k === "csplitfor" && c.split) c.split.for = v;
      if (k !== "cdoes" && !c.edited) {
        const built = crewOfDraft(r.camp, turnOf(r.camp), r);
        const box = el.closest(".dlg-body")?.querySelector("#ft-cdoes");
        if (box && built) box.value = built.does;
      }
    }
  }

  // ------------------------------------------------------------ taps

  // A change to the board from her phone, with Undo.
  const board = (id, ops, say) => d.world().edit(id, ops, say);
  const party = (id, ops, say) => d.party().edit(id, ops, say);

  function rollCrew(id, rows = null) {
    const t = turnOf(id);
    const c = t?.crew;
    if (!c || rolled(c)) return;
    if (!c.vs.set) return d.toast(`${gmName(id)}’s still to say what it’s up against.`, false);
    const extra = c.vs.k === "none" ? {} : facesOf(id, t, "crew", rows);
    ui.spin = rows ? null : "crew";
    push(id, { o: "ft-croll", ...extra });
  }

  function land(id, x, rows = null) {
    const t = turnOf(id);
    const a = t?.acts.find((y) => y.id === x);
    if (!a || landed(a)) return;
    const why = blockedBy(t, a);
    if (why) return d.toast(why, false);
    const extra = a.off || !a.roll ? {} : facesOf(id, t, x, rows);
    ui.spin = rows || a.off || !a.roll ? null : x;
    push(id, { o: "ft-land", id: x, ...extra });
  }

  const ACT = {
    start(el, id) {
      push(id, { o: "ft-start", id: newId() });
    },
    step(el, id) {
      ui.sure = "";
      push(id, { o: "ft-step", step: el.dataset.s });
      requestAnimationFrame(() => document.querySelector(`#app [data-ft="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "start", behavior: d.calm() ? "auto" : "smooth" }));
    },
    hire(el, id) {
      d.openDialog({ kind: "ft-hire", camp: id, by: el.dataset.by === "crew" ? "crew" : "faction", payer: null, to: null, job: "", err: "" });
    },
    unhire(el, id) {
      const key = `unhire:${el.dataset.h}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return d.render();
      }
      ui.sure = "";
      push(id, { o: "ft-unhire", id: el.dataset.h });
    },
    pick(el, id) {
      const t = turnOf(id);
      const f = find(boardOf(id), el.dataset.f);
      if (!t || !f) return;
      d.openDialog({ kind: "ft-act", camp: id, a: actDraft(id, t, f), err: "" });
    },
    send(el, id) {
      const t = turnOf(id);
      if (!t) return;
      if (!t.acts.length) return d.toast("Pick at least one faction’s action first, or move them all off-screen.", false);
      const key = `send:${id}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return d.render();
      }
      ui.sure = "";
      // Telegraphing a faction shows the crew its card (Mo, 27 Oct).
      const show = toShow(id, t);
      if (show.length) d.world().edit(id, show.map((f) => ({ o: "show", id: f.id, p: "card", v: true })), "", { undoable: false, quiet: true });
      push(id, { o: "ft-send" });
      d.toast(`Telegraphed. ${t.acts.filter((a) => !a.off).length ? "They’re on the crew’s phones now." : "They’re all off-screen."}`, false);
    },
    crew(el, id) {
      const t = turnOf(id);
      if (!t) return;
      d.openDialog({ kind: "ft-crew", camp: id, c: crewDraft(id, t), err: "" });
    },
    slot(el, id) {
      push(id, { o: "ft-slot", on: el.dataset.on === "1" });
    },
    vs(el, id) {
      d.openDialog({ kind: "ft-vs", camp: id });
    },
    roll(el, id) {
      rollCrew(id);
    },
    real(el, id) {
      const t = turnOf(id);
      if (!t) return;
      const rows = rowsFor(id, t, el.dataset.x);
      if (!rows.length) return el.dataset.x === "crew" ? rollCrew(id) : land(id, el.dataset.x);
      d.openDialog({ kind: "ft-real", camp: id, x: el.dataset.x, rows });
    },
    again(el, id) {
      const t = turnOf(id);
      const c = t?.crew;
      const place = mine(id);
      if (!c?.faces || !place) return;
      if (!d.spendResolve(place.ch)) return d.toast(`${place.cname} hasn’t got any Resolve to spend.`, false);
      const dice = crewDice(c);
      ui.spin = "crew";
      push(id, { o: "ft-again", faces: { main: dice.main.map((s) => rollDie(s)), split: dice.split ? rollDie(dice.split) : null } });
    },
    tie(el, id) {
      push(id, { o: "ft-tie", which: el.dataset.w === "split" ? "split" : "main" });
    },
    land(el, id) {
      land(id, el.dataset.x);
    },
    landall(el, id) {
      // In order, each one rolled against the board as the last left it, so a
      // Power rolled once stands for the rest.
      const tried = new Set();
      for (let guard = 0; guard < MAX.acts; guard++) {
        const t = turnOf(id);
        const next = t ? landOrder(t).find((a) => readyToLand(t, a) && !tried.has(a.id)) : null;
        if (!next) break;
        tried.add(next.id);
        land(id, next.id);
      }
      ui.spin = null;
    },
    out(el, id) {
      d.openDialog({ kind: "ft-out", camp: id, x: el.dataset.x, form: "", line: null });
    },
    done(el, id) {
      push(id, { o: "ft-done", id: el.dataset.x, line: "" });
    },
    end(el, id) {
      const key = `end:${id}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return d.render();
      }
      ui.sure = "";
      push(id, { o: "ft-end" });
      d.toast("That downtime’s done. What changed stays here for the crew.", false);
    },
  };

  // Taps inside the dialogs.
  const DLG = {
    payer: (el, r) => (r.payer = el.dataset.f),
    taker: (el, r) => (r.to = el.dataset.f),
    savehire: (el, r) => saveHire(r),
    what(el, r) {
      const a = r.a;
      a.what = el.dataset.w;
      a.against = a.what === "Establish" ? "none" : "power";
      a.dieD = 0;
      if (!a.job) a.edited = false;
    },
    d6(el, r) {
      const n = rollDie(6);
      const a = r.a;
      const f = find(boardOf(r.camp), a.f);
      a.d6 = n;
      const pick = n <= 2 ? "agenda" : n === 3 ? (f?.agendas.length === 1 ? "write" : "Establish") : n === 4 ? "Destroy" : n === 5 ? "comes" : moneyOf(f).extra ? null : "Acquire";
      const allowed = (w) => (f?.mini ? f.outs.includes(w) : true) && (w !== "agenda" || f?.agendas.some((x) => !x.done)) && (w !== "write" || (f && !f.mini && f.agendas.length < 2)) && (w !== "comes" || !f?.mini);
      if (pick && allowed(pick)) {
        a.what = pick;
        a.against = pick === "Establish" ? "none" : "power";
        if (!a.job) a.edited = false;
      }
    },
    ag: (el, r) => (r.a.ag = el.dataset.id),
    tf(el, r) {
      r.a.tf = el.dataset.f;
      r.a.item = null;
    },
    item: (el, r) => (r.a.item = r.a.item?.lid === el.dataset.id ? null : { l: el.dataset.l, lid: el.dataset.id }),
    oact: (el, r) => (r.a.oact = el.dataset.id),
    against(el, r) {
      r.a.against = el.dataset.v;
      if (r.a.against !== "die") r.a.dieD = 0;
    },
    died: (el, r) => (r.a.dieD = Number(el.dataset.d)),
    agd: (el, r) => (r.a.agenda.die = Number(el.dataset.d)),
    rollag(el, r) {
      const x = AGENDAS[rollDie(AGENDAS.length) - 1];
      if (x) r.a.agenda = { text: x.text, die: x.die };
    },
    d12(el, r) {
      const f = find(boardOf(r.camp), r.a.f);
      const tbl = comesTable(r.camp, turnOf(r.camp), f);
      const t = tbl.t ?? (rollDie(2) === 1 ? "hostile" : "bond");
      const n = rollDie(12);
      const row = BOOK.comes.find((x) => x.n === n);
      r.a.comes = { t, n, text: row?.[t] ?? "" };
    },
    d12n(el, r) {
      const f = find(boardOf(r.camp), r.a.f);
      const tbl = comesTable(r.camp, turnOf(r.camp), f);
      const t = r.a.comes?.t ?? tbl.t ?? (rollDie(2) === 1 ? "hostile" : "bond");
      const n = Number(el.dataset.n);
      r.a.comes = { t, n, text: BOOK.comes.find((x) => x.n === n)?.[t] ?? "" };
    },
    fit(el, r) {
      const a = r.a;
      const f = find(boardOf(r.camp), a.f);
      if (!a.fits.length && a.extraSteps && f) a.fits = fitsOf(f).slice(0, a.extraSteps).map((x) => x.id);
      a.fits = a.fits.includes(el.dataset.id) ? a.fits.filter((x) => x !== el.dataset.id) : [...a.fits, el.dataset.id];
      a.extraSteps = 0;
    },
    split: (el, r) => (r.a.split = r.a.split ? null : { s: 1, for: "" }),
    splits: (el, r) => r.a.split && (r.a.split.s = Number(el.dataset.s)),
    pressure: (el, r) => (r.a.pressure = !r.a.pressure),
    off(el, r) {
      r.a.off = !r.a.off;
      if (r.a.off) r.a.pressure = false;
    },
    saveact: (el, r) => saveAct(r),
    dropact(el, r) {
      const key = `drop:${r.a.id}`;
      if (ui.sure !== key) {
        ui.sure = key;
        return;
      }
      ui.sure = "";
      push(r.camp, { o: "ft-drop", id: r.a.id });
      d.closeDialog();
      return "closed";
    },
    move(el, r) {
      const c = r.c;
      c.move = el.dataset.m;
      c.part = null;
      c.lid = null;
      c.oact = null;
      if (!c.edited || !c.does) c.edited = false;
      c.edited = false;
    },
    ctf(el, r) {
      r.c.tf = el.dataset.f;
      r.c.lid = null;
      r.c.part = null;
    },
    part(el, r) {
      r.c.part = el.dataset.p;
      r.c.lid = null;
    },
    cthing(el, r) {
      r.c.lid = r.c.lid === el.dataset.id ? null : el.dataset.id;
      r.c.thing = "";
    },
    cag: (el, r) => (r.c.lid = el.dataset.id),
    coact: (el, r) => (r.c.oact = el.dataset.id),
    cproj: (el, r) => (r.c.lid = el.dataset.id),
    inway: (el, r) => (r.c.inWay = !r.c.inWay),
    how: (el, r) => (r.c.how = el.dataset.v === "own" ? "own" : "crew"),
    cfit: (el, r) => (r.c.fits = r.c.fits.includes(el.dataset.t) ? r.c.fits.filter((x) => x !== el.dataset.t) : [...r.c.fits, el.dataset.t].slice(0, MAX.fits)),
    ownch: (el, r) => (r.c.ownCh = el.dataset.ch),
    own: (el, r) => (r.c.ownSteps = Math.min(MAX.steps, Math.max(1, r.c.ownSteps + Number(el.dataset.by)))),
    cslot: (el, r) => (r.c.slot = !r.c.slot),
    csplit: (el, r) => (r.c.split = r.c.split ? null : { s: 1, for: "" }),
    csplits: (el, r) => r.c.split && (r.c.split.s = Number(el.dataset.s)),
    savecrew: (el, r) => saveCrew(r),
    dropcrew(el, r) {
      if (ui.sure !== "dropcrew") {
        ui.sure = "dropcrew";
        return;
      }
      ui.sure = "";
      push(r.camp, { o: "ft-crew", c: null });
      d.closeDialog();
      return "closed";
    },
    vsd(el, r) {
      const dice = String(el.dataset.d).split(",").map(Number).filter((x) => SIZES.includes(x));
      if (!dice.length) return;
      push(r.camp, { o: "ft-vs", d: dice, ...(el.dataset.k ? { k: el.dataset.k } : {}) });
      d.closeDialog();
      return "closed";
    },
    realn(el, r) {
      const row = r.rows[Number(el.dataset.i)];
      if (row) row.v = Number(el.dataset.n);
    },
    saveroll(el, r) {
      if (!r.rows.every((x) => x.v)) return;
      d.closeDialog();
      if (r.x === "crew") rollCrew(r.camp, r.rows);
      else land(r.camp, r.x, r.rows);
      return "closed";
    },
    form(el, r) {
      r.form = el.dataset.k || "";
      if (r.form) requestAnimationFrame(() => document.querySelector(".ft-form input:not([type=hidden]):not([type=radio]):not([type=checkbox])")?.focus());
    },
    saveout(el, r) {
      const id = r.camp;
      const t = turnOf(id);
      const x = r.x === "crew" ? t?.crew : t?.acts.find((a) => a.id === r.x);
      if (!x) return;
      push(id, { o: "ft-done", id: r.x, line: String(r.line ?? lineOf(id, t, x)).trim() });
      d.closeDialog();
      return "closed";
    },
    // The changes, each made the moment it's tapped.
    tick(el, r) {
      const id = r.camp;
      const t = turnOf(id);
      const x = r.x === "crew" ? t.crew : t.acts.find((a) => a.id === r.x);
      if (x.at.f === "crew") party(id, [{ o: "drop", l: el.dataset.l, id: el.dataset.id }], "Off the party sheet.");
      else board(id, [{ o: "tick", id: x.at.f, l: el.dataset.l, lid: el.dataset.id, by: 1 }], "Ticked off.");
    },
    take(el, r) {
      const id = r.camp;
      const t = turnOf(id);
      const crew = r.x === "crew";
      const x = crew ? t.crew : t.acts.find((a) => a.id === r.x);
      const doc = boardOf(id);
      const l = el.dataset.l;
      if (x.at.f === "crew") {
        // A faction takes something off the party sheet.
        const y = sheetOf(id)[l]?.find((z) => z.id === el.dataset.id);
        if (!y) return;
        const item = l === "assets" ? { id: newId().slice(0, 12), text: y.text, does: y.does, power: y.power, x: 1 } : { id: newId().slice(0, 12), text: y.text, x: 1 };
        party(id, [{ o: "drop", l, id: y.id }], "");
        board(id, [{ o: "add", id: x.f, l, item }], `${y.text} is ${poss(lower(x.name))} now.`);
        return;
      }
      const f = find(doc, x.at.f);
      const y = f?.[l]?.find((z) => z.id === el.dataset.id);
      if (!y) return;
      if (y.left > 1) return board(id, [{ o: "tick", id: f.id, l, lid: y.id, by: 1 }], "Ticked off.");
      if (crew) {
        // The crew takes it: off the faction's card and onto the party sheet.
        board(id, [{ o: "drop", id: f.id, l, lid: y.id }], "");
        party(id, [{ o: "add", l, item: l === "assets" ? { id: newId().slice(0, 12), text: y.text, does: y.does, power: y.power, off: false } : { id: newId().slice(0, 12), text: y.text } }], `${y.text} is the crew’s now.`);
        return;
      }
      // When the last one goes, it's theirs, multiplier and all.
      board(id, [{ o: "move", id: f.id, l, lid: y.id, to: x.f }, ...Array.from({ length: y.x - 1 }, () => ({ o: "tick", id: x.f, l, lid: y.id, by: -1 }))], `${y.text} is ${poss(lower(x.name))} now.`);
    },
    strain(el, r) {
      const id = r.camp;
      const x = r.x === "crew" ? turnOf(id).crew : turnOf(id).acts.find((a) => a.id === r.x);
      const f = find(boardOf(id), x.at.f);
      const y = f?.[el.dataset.l]?.find((z) => z.id === el.dataset.id);
      if (!y) return;
      board(id, [{ o: "edit", id: f.id, l: el.dataset.l, lid: y.id, f: "s", v: y.s === "strained" ? "snapped" : "strained" }], y.s === "strained" ? "Snapped." : "Strained.");
    },
    mend(el, r) {
      const id = r.camp;
      const x = r.x === "crew" ? turnOf(id).crew : turnOf(id).acts.find((a) => a.id === r.x);
      board(id, [{ o: "edit", id: x.at.f, l: el.dataset.l, lid: el.dataset.id, f: "s", v: "whole" }], "Mended.");
    },
    climb(el, r) {
      const id = r.camp;
      const x = turnOf(id).acts.find((a) => a.id === r.x);
      board(id, [{ o: "climb", id: x.f, lid: el.dataset.id, by: 1 }], "It climbs.");
    },
    write(el, r) {
      const id = r.camp;
      const x = turnOf(id).acts.find((a) => a.id === r.x);
      board(id, [{ o: "add", id: x.f, l: "agendas", item: { id: newId().slice(0, 12), text: bare(x.at.name), die: x.at.d ?? 2, done: false, then: "" } }], "It’s on its card.");
    },
    setback(el, r) {
      board(r.camp, [{ o: "climb", id: el.dataset.f, lid: el.dataset.id, by: -1 }], "Stepped down.");
    },
    goal(el, r) {
      party(r.camp, [{ o: "climb", by: 1 }], "The Goal climbs.");
    },
    project(el, r) {
      party(r.camp, [{ o: "climb", by: 1, id: el.dataset.id }], "The project climbs.");
    },
  };

  function act(el, e) {
    const r = d.roll();
    const inDialog = Boolean(el.closest("dialog"));
    if (inDialog && r?.kind?.startsWith("ft-")) {
      const fn = DLG[el.dataset.do];
      if (!fn) return;
      if (!["dropact", "dropcrew"].includes(el.dataset.do)) ui.sure = ui.sure === "dropcrew" || ui.sure.startsWith("drop:") ? "" : ui.sure;
      r.err = "";
      if (fn(el, r) === "closed") return;
      return d.renderDialog();
    }
    const id = el.closest("[data-ft]")?.dataset.ft;
    if (!id || !ACT[el.dataset.do]) return;
    if (!["send", "end", "unhire"].includes(el.dataset.do)) ui.sure = "";
    ACT[el.dataset.do](el, id, e);
    // Whatever this phone's just changed shows at once, before it's gone up.
    if (!document.querySelector("dialog[open]")) d.render();
  }

  // The forms: anything else that changed, and the changes that need words.
  function submit(kind, form, f) {
    const r = d.roll();
    const text = (name, max = 120) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    if (kind === "ft-say") {
      const id = form.closest("[data-ft]")?.dataset.ft;
      const line = text("line", MAX.line);
      if (!id || !line) return;
      push(id, { o: "ft-say", id: newId(), line });
      d.render();
      return;
    }
    if (!r || r.kind !== "ft-out") return;
    const id = r.camp;
    const t = turnOf(id);
    const crew = r.x === "crew";
    const x = crew ? t?.crew : t?.acts.find((a) => a.id === r.x);
    if (!x) return;
    const doc = boardOf(id);
    const actor = crew ? "crew" : x.f;
    const move = crew ? x.move : x.what;
    const T2 = x.at.f && x.at.f !== "crew" ? find(doc, x.at.f) : null;
    const lid = () => newId().slice(0, 12);
    r.form = "";
    if (kind === "ft-hostile" || kind === "ft-bond") {
      const words = bare(text("text"));
      if (!words || !T2) return d.renderDialog();
      const where = String(f.get("where") ?? "to");
      const kindOf = kind === "ft-hostile" ? "hostile" : "bond";
      const item = { id: lid(), text: words, kind: kindOf, s: "whole" };
      if (where === "to") board(id, [{ o: "add", id: T2.id, l: "threads", item: { ...item, to: actor } }], `${T2.name} writes a ${kindOf} thread.`);
      else board(id, [{ o: "add", id: T2.id, l: where, item }], `${T2.name} writes a ${kindOf} thread.`);
      return;
    }
    if (kind === "ft-asset" || kind === "ft-res") {
      const name = bare(text("text", 60));
      if (!name) return d.renderDialog();
      const l = kind === "ft-asset" ? "assets" : "res";
      if (crew) party(id, [{ o: "add", l, item: l === "assets" ? { id: lid(), text: name, does: text("does", 240), power: f.get("power") === "on", off: false } : { id: lid(), text: name } }], `On the party sheet: ${name}.`);
      else board(id, [{ o: "add", id: x.f, l, item: l === "assets" ? { id: lid(), text: name, does: text("does", 240), power: f.get("power") === "on", x: 1 } : { id: lid(), text: name, x: 1 } }], `${name} is on ${poss(lower(x.name))} card.`);
      return;
    }
    if (kind === "ft-mini") {
      const name = bare(text("name", 60));
      const outs = OUTCOMES.filter((o) => f.get(`out-${o}`) === "on");
      if (!name) return d.toast("Give it a name first.", false);
      if (outs.length !== 2) return d.toast("A mini faction picks two of the six outcomes, and only two.", false);
      const loy = bare(text("loy"));
      const base = { id: lid(), name, about: "", want: "", face: "", secret: "", more: "", outs, loy: loy ? [{ id: lid(), text: loy, kind: "bond", s: "whole" }] : [], agendas: [], pub: [], mor: [], threads: [] };
      if (crew) {
        // The crew's own: what it hands over comes off the party sheet, and
        // the crew sees the whole of it.
        const sheet = sheetOf(id);
        const res = sheet.res.find((y) => y.id === f.get("res"));
        const asset = sheet.assets.find((y) => y.id === f.get("asset"));
        const mf = { ...base, mini: true, parent: "crew", res: res ? [{ id: lid(), text: res.text, x: 1 }] : [], assets: asset ? [{ id: lid(), text: asset.text, does: asset.does, power: asset.power, x: 1 }] : [], shown: { card: true, power: true, res: true, assets: true, agenda: true, bonds: true, threads: true, secret: true } };
        if (!board(id, [{ o: "new", f: mf }], "")) return d.toast("That mini faction couldn’t go on the board.", false);
        party(id, [...(res ? [{ o: "drop", l: "res", id: res.id }] : []), ...(asset ? [{ o: "drop", l: "assets", id: asset.id }] : [])], `${name}’s the crew’s mini faction now. It sits out this downtime.`);
        return;
      }
      board(id, [{ o: "mini", id: x.f, res: String(f.get("res") ?? ""), asset: String(f.get("asset") ?? ""), f: { ...base, res: [], assets: [], shown: {} } }], `${x.name} made ${name}. It sits out this downtime, and takes its own action from the next.`);
      return;
    }
    if (kind === "ft-changed") {
      const line = bare(text("text", 160));
      if (!line) return d.renderDialog();
      party(id, [{ o: "add", l: "changed", item: { id: lid(), text: `${line}.` } }], "It’s on the party sheet, under What has changed.");
      if (!r.line) r.line = `${line}.`;
      return;
    }
    if (kind === "ft-next") {
      const words = bare(text("text"));
      const die = Number(f.get("die")) || 2;
      if (!words || move !== "agenda") return d.renderDialog();
      const fac = find(doc, x.f);
      const done = fac?.agendas.find((y) => y.id === x.at.lid && y.done);
      board(id, [...(done ? [{ o: "drop", id: x.f, l: "agendas", lid: done.id }] : []), { o: "add", id: x.f, l: "agendas", item: { id: lid(), text: words, die, done: false, then: "" } }], `${x.name} wants something new: ${words}.`);
      return;
    }
    d.renderDialog();
  }

  // A roll this phone's just made tumbles, once.
  function after(app) {
    if (!ui.spin) return;
    const key = ui.spin;
    const scope = () => app.querySelector(`[data-ftk="${CSS.escape(key)}"]`);
    if (!scope()?.querySelector("[data-spin]")) return;
    ui.spin = null;
    d.tumble(scope, () => {});
  }

  return { section, glance, dialog, input, act, submit, after };
}
