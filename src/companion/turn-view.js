// The faction turn on every phone in a campaign (stage 2 of
// notes/worlds-plan.md): the GM runs it from the World screen, and the crew
// sees it on the World screen and the World tab. The rules are in turn.js,
// and world.js keeps the world in step with the Worker.
//
// The GM: she starts it once a session's over. Hiring comes first (who the
// crew's paying, and who the factions are paying), and meanwhile she gets every
// faction's action ready, each one telegraphed to the crew or kept off-screen.
// She sends the telegraphs, the crew picks its action, and then the actions
// land: Obstructs first, then the rest, rolled in a tap or with real dice
// tapped in, and each outcome goes on the cards in a tap.
//
// The crew: they see the telegraphs she's sent, pay a faction with an extra
// resource while hiring's open, pick the crew's action on any phone, and roll
// the crew's dice once the actions land, rolling again for 1 Resolve or taking
// a tie with an extra resource.
import { BONDS, OUTCOMES, find, moneyOf, stepsOf } from "./board.js";
import { VS, actorsOf, againstOf, agendaOf, bondThreads, knownTo, partsFor, resultsMine, resultsOf, spentOf, stepsFor, tooBig, towardOf } from "./turn.js";
import { diceLabel, rollDie, stepsToDice } from "./dice.js";
import { die as kitDie, mini as kitMini } from "../kit/kit.js";

const SIZES = [2, 4, 6, 8, 10, 12];
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const words = (n) => WORDS[n] ?? String(n);
const plural = (n, one, many) => `${words(n)} ${n === 1 ? one : many}`;
const bare = (t) => String(t ?? "").replace(/[.!?…]+$/, "");
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
// "The Vane Estate" in the middle of a sentence, and whose it is.
const lower = (name) => String(name ?? "").replace(/^(A|An|The) /, (m) => m.toLowerCase());
const poss = (name) => (/s$/.test(name) ? `${name}’` : `${name}’s`);
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const random = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => (x % 36).toString(36)).join("");
const newId = () => `${random(6)}${Date.now().toString(36).slice(-3)}`;
const STEP_NAMES = { hire: "Hiring", tele: "Telegraphs", land: "Landing", done: "Done" };
const MOVES = { back: "Set back its agenda", work: "Work for it", else: "Something else" };
// What each part of a faction's card is called, for the lines it's after.
const LIST_NAME = { res: "resource", assets: "asset" };

export function makeTurnView(w) {
  const { d, esc, W } = w;
  const T = W.turn ?? { d6: [], comes: { hostile: [], bond: [] } };
  // What's being changed, and its form as it's being filled in.
  let tu = { editing: "", draft: null, sure: "", d6: null, real: "" };

  // ------------------------------------------------------------ reading it

  const crew = (id) => d.crewIn(id) ?? { name: "", steps: 2, money: { extra: 0 }, res: [], list: [] };
  const crewName = (id) => crew(id).name || "The crew";
  // A faction's name, or the crew's, whoever's looking.
  function nameIn(id, doc, x) {
    if (x === "crew") return crewName(id);
    return find(doc, x)?.name ?? doc.turn?.acts.find((a) => a.by === x)?.byName ?? doc.turn?.acts.find((a) => a.to === x)?.toName ?? "a faction";
  }

  // An act put the same way for the GM's phone and a player's: its words, its
  // dice, what it's against and how it's gone.
  function cardOf(id, doc, a, gm, results) {
    const t = doc.turn;
    const name = (x) => nameIn(id, doc, x);
    const parts = gm ? partsFor(doc, a) : a.parts;
    const vs = gm ? againstOf(doc, a) : { kind: a.vs === "power" ? "power" : a.vs === "act" ? "act" : a.vs === "none" ? "none" : "roll", dice: a.vsDice ?? [], got: a.vs === "power" ? t.def[a.to] ?? null : a.vs === "act" ? t.acts.find((x) => x.by === a.stops)?.r?.flat() ?? null : a.vr };
    const ag = gm ? agendaOf(doc, a) : a.agText ? { text: a.agText, die: a.agDie } : null;
    const thing = gm ? (a.thing ? find(doc, a.to)?.[a.thing.l].find((x) => x.id === a.thing.lid) : null) : a.thingText ? { text: a.thingText } : null;
    const hire = t.hires.find((h) => h.to === a.by) ?? null;
    return { id, doc, a, by: a.by, byName: name(a.by), toName: a.to ? name(a.to) : "", parts, vs, ag, thing, hire, res: results.get(a.by) ?? null };
  }

  // What it's doing, in a line.
  function doesOf(c) {
    const a = c.a;
    const to = lower(c.toName);
    const thing = c.thing ? `${poss(to)} ${c.thing.text}` : to;
    let s;
    if (a.what === "agenda") s = `Works its agenda, ${c.ag ? `${c.ag.text}, at d${c.ag.die}` : "the one it’s on"}`;
    else if (a.what === "new") s = `Writes a new agenda, ${a.nt}, at d${a.nd}`;
    else if (a.what === "comes") s = "Comes for the crew";
    else if (a.what === "back") s = `Sets back ${poss(to)} agenda${c.ag ? `, ${c.ag.text}` : ""}`;
    else if (a.what === "work") s = `Works for ${to}`;
    else if (a.what === "else") s = a.text;
    else if (a.out === "Obstruct") s = `Obstructs ${poss(to)} action`;
    else if (a.out === "Establish") s = a.about ? `Establishes ${a.about}` : "Establishes something new";
    else s = `${a.out}: ${a.about && !c.thing ? `${poss(to)} ${a.about}` : thing}`;
    const two = c.parts.length > 1 ? (a.p2 === "else" && a.p2text ? `, and ${a.p2text}` : a.by === "crew" ? ", and keeps the crew’s name out of it" : ", and keeps its name out of it") : "";
    return `${cap(s)}${two}.`;
  }
  // What it's doing, short enough to pick out of a list.
  function shortOf(c) {
    const a = c.a;
    if (a.what === "agenda") return "works its agenda";
    if (a.what === "new") return "writes a new agenda";
    if (a.what === "comes") return "comes for the crew";
    if (a.out === "Obstruct") return `Obstructs ${lower(c.toName)}`;
    if (a.out === "Establish") return "Establishes";
    return `${a.out}${c.toName ? ` at ${lower(c.toName)}` : ""}`;
  }
  // What it rolls against, in a line.
  function vsOf(c) {
    const a = c.a;
    const dice = c.vs.dice.length ? diceLabel(c.vs.dice) : "";
    if (a.what === "comes") return "It doesn’t roll against the crew. Whatever comes up happens, unless the crew Obstructs it.";
    if (a.vs === "none") return a.what === "else" ? "Rolled on the party sheet or a character’s own." : "No roll. It happens unless someone Obstructs it.";
    if (a.vs === "power") return `Against ${poss(lower(c.toName))} Power${dice ? `, ${dice}` : ""}.`;
    if (a.vs === "own") return `Against what’s guarding it out on its own${dice ? `, ${dice}` : ", which the GM says"}.`;
    if (a.vs === "face") return `Against ${poss(lower(c.toName))} face${dice ? `, ${dice}` : ""}.`;
    if (a.vs === "die") return `Against ${dice ? `a ${dice}` : "whatever’s in its way"}.`;
    if (a.vs === "agenda") return `Against the agenda’s ${dice || "die"}. A die that’s climbing defends.`;
    return `Against ${poss(lower(c.toName))} dice, and a tie goes to ${lower(c.toName)}.`;
  }

  // A part's outcome, said once it's rolled.
  function partLine(c, i, gm) {
    const r = c.res?.parts[i];
    if (!r) return "";
    const a = c.a;
    const quiet = i === 1 && a.p2 === "quiet";
    const target = lower(c.toName);
    const by = c.res.stopped ? (c.res.stopped === "crew" ? "the crew" : c.res.stopped === "someone" ? "someone" : lower(nameIn(c.id, c.doc, c.res.stopped))) : "";
    if (r.st === "stopped") return i ? "" : `Stopped. ${cap(by)} beat its dice, so it doesn’t land this downtime.`;
    if (r.st === "free") return i ? "" : a.shown === false ? "Off-screen, with no roll. Say what changed." : "No roll needed, so it happens.";
    if (r.st === "waiting") return i ? "" : "Still to roll.";
    const score = `${r.mine} ${r.st === "won" ? "beats" : r.st === "tie" ? "ties" : "against"} ${r.theirs}`;
    if (quiet) return r.st === "won" ? `${score}: its name stays out of it.` : `${score}: ${target} knows exactly who did it.`;
    if (i === 1) return r.st === "won" ? `${score}: ${a.p2text || "that lands too"}.` : `${score}: that misses.`;
    if (r.st === "tie") return `${score}, and a tie goes to ${a.vs === "act" ? target : a.vs === "agenda" ? "the agenda" : "the defender"}${a.by === "crew" && !a.tie?.[i] ? ", unless the crew takes it" : ""}.`;
    if (r.st === "lost") return `${score}. Nothing happens this downtime${a.by === "crew" ? "" : ", and it’s a little angrier about it"}.`;
    if (a.vs === "act") return `${score}: ${target}’s action is stopped.`;
    if (a.what === "agenda" || a.what === "back") return `${score}: the agenda ${a.what === "back" ? "steps back down" : "climbs"}.`;
    return `${score}: it wins.`;
  }

  // A die, rolled or not: theirs, the crew's, or what it's against.
  const diceHtml = (sizes, got, own) => sizes.map((s, i) => kitDie(s, { own, face: got?.[i]?.v ?? null, hide: true, cls: i ? "is-next" : "" })).join("");

  // The telegraph card: who's acting, what it's doing, its dice and what it's
  // against, and once it's rolled, each die's outcome.
  function tele(id, c, gm, extra = "") {
    const a = c.a;
    const t = c.doc.turn;
    const crewAct = a.by === "crew";
    const state = c.res ? (c.res.stopped ? "stopped" : c.res.parts.every((p) => p.st === "lost" || p.st === "tie") ? "held" : "") : "";
    const own = crewAct ? "you" : "them";
    const dice = c.parts.map((p, i) => `<span class="wt-part">${diceHtml(p.dice, a.r?.[i], own)}</span>`).join('<span class="wt-and" aria-hidden="true">+</span>');
    const vsDice = c.vs.dice.length && a.what !== "comes" ? `<span class="wt-vs"><small>against</small>${diceHtml(c.vs.dice, c.vs.got, "them")}</span>` : "";
    const label = `${c.byName}: ${c.parts.map((p) => diceLabel(p.dice)).join(" and ")}${c.vs.dice.length ? `, against ${diceLabel(c.vs.dice)}` : ""}`;
    const kicker = crewAct ? "The crew’s action" : a.shown === false ? "Off-screen" : "Telegraph";
    const lines = c.res ? c.parts.map((_, i) => partLine(c, i, gm)).filter(Boolean) : [];
    const splitWhat = c.parts.length > 1 ? `<p class="wt-split">${c.parts.map((p, i) => `<span>${diceLabel(p.dice)}: ${i ? (a.p2 === "else" ? esc(a.p2text || "something else") : "keeping its name out of it") : esc(a.what === "out" ? a.out : "the action")}</span>`).join("")}</p>` : "";
    const comes = a.what === "comes" && a.table ? `<p class="wt-comes"><b>${a.table.d2 ? `d2: ${a.table.d2}, so ` : ""}d12: ${a.table.r}.</b> ${esc(T.comes[a.table.k]?.[a.table.r - 1] ?? "")}</p>` : "";
    const hired = c.hire && (gm || c.hire.by === "crew") ? `<p class="wt-hired">${c.hire.by === "crew" ? "The crew’s paying it" : `${esc(nameIn(id, c.doc, c.hire.by))} is paying it`}${c.hire.text ? `: ${esc(c.hire.text)}` : "."}</p>` : "";
    const wordsLine = a.words ? esc(a.words) : esc(doesOf(c));
    const bits = [crewAct && a.slot ? `${a.slotBy ? `${esc(a.slotBy)}’s` : "A"} personal slot’s in, so everything counts twice` : "", crewAct && a.who ? `${esc(a.who)} rolls their own permissions` : "", crewAct && a.again ? `Rolled again ${a.again === 1 ? "once" : `${words(a.again)} times`}` : "", crewAct && a.tie?.some(Boolean) ? "Took the tie with an extra resource" : "", a.real ? "Real dice" : ""].filter(Boolean);
    return `<article class="zd-tele wt-tele${crewAct ? " is-crew" : ""}${a.shown === false ? " is-off" : ""}${state ? ` is-${state}` : ""}" aria-label="${esc(label)}">
      <header><span class="k">${kicker}</span><span class="r">Downtime ${t.n}</span></header>
      <div class="tb"><div class="wt-col"><div class="wt-dice">${dice}</div>${vsDice}</div><div><h4>${esc(c.byName)}</h4><p>${wordsLine}</p></div></div>
      ${splitWhat}${comes}${hired}
      ${bits.length ? `<p class="wt-bits">${bits.join(" · ")}</p>` : ""}
      ${lines.length ? `<ul class="wt-res">${lines.map((l, i) => `<li class="is-${c.res.parts[i]?.st ?? ""}">${esc(l)}</li>`).join("")}</ul>` : ""}
      <footer><span class="at"><span>${a.to ? `At ${esc(lower(c.toName))}` : a.what === "comes" ? "At the crew" : a.what === "agenda" || a.what === "new" ? "At its own agenda" : a.what === "else" ? "The crew’s own" : "On its own card"}</span></span><span class="when">${esc(vsOf(c))}</span></footer>
      ${extra}</article>`;
  }

  // ------------------------------------------------------------ the section

  function section(id) {
    const doc = w.docOf(id);
    const gm = w.isGm(id);
    const t = doc.turn;
    if (!gm && !t) return "";
    const head = `<h2 id="wt-h">${t && t.step !== "done" ? `Downtime ${t.n}: the faction turn` : "The faction turn"}</h2>`;
    let body;
    if (!t || t.step === "done") body = gm ? startView(id, doc) : summary(id, doc);
    else {
      const strip = `<ol class="wt-steps" aria-label="Where the faction turn’s got to">${["hire", "tele", "land"].map((s) => `<li class="${s === t.step ? "is-on" : STEP_ORDER[s] < STEP_ORDER[t.step] ? "is-done" : ""}"${s === t.step ? ' aria-current="step"' : ""}>${STEP_NAMES[s]}</li>`).join("")}</ol>`;
      body = strip + (gm ? gmLive(id, doc) : playerLive(id, doc));
    }
    return `<section class="cc-sec wt" data-wb="${esc(id)}" aria-labelledby="wt-h">${head}${body}</section>`;
  }
  const STEP_ORDER = { hire: 0, tele: 1, land: 2, done: 3 };

  function startView(id, doc) {
    const t = doc.turn;
    const n = (t?.n ?? 0) + 1;
    const none = !doc.factions.length;
    return `<p class="cc-lead">Every downtime, every faction on the board takes one action, and so does the crew. Start it once the session’s over: hiring first, then the telegraphs, the crew’s action, and the actions land.</p>
      ${none ? '<p class="cc-small">Put some factions on the board first.</p>' : `<div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="t-start">Start downtime ${n}’s faction turn</button></div>`}
      ${t ? summary(id, doc) : ""}${w.ruleLink("s-faction-turn", "How the faction turn works")}`;
  }

  // How the last downtime went, for everyone, a line an action.
  function summary(id, doc) {
    const t = doc.turn;
    if (!t) return "";
    const gm = w.isGm(id);
    const results = gm ? resultsOf(doc) : resultsMine(t);
    const acts = ordered(doc, t.acts, gm);
    const lines = acts.map((a) => {
      const c = cardOf(id, doc, a, gm, results);
      const how = c.res ? c.parts.map((_, i) => partLine(c, i, gm)).filter(Boolean).join(" ") : "";
      return `<li><b>${esc(c.byName)}.</b> ${esc(a.words || doesOf(c))} ${how ? `<small>${esc(how)}</small>` : ""}</li>`;
    }).join("");
    return w.fold(`wt-sum-${t.id}`, `Downtime ${t.n}: how it went`, lines ? plural(acts.length, "action", "actions") : "Nothing happened", lines ? `<ul class="wt-sum">${lines}</ul>` : '<p class="cc-small">Nobody did anything.</p>');
  }

  // Obstructs first (the crew's before any faction's), then the rest in board
  // order, and the crew's last.
  function ordered(doc, acts, gm) {
    const pos = new Map(doc.factions.map((f, i) => [f.id, i]));
    const rank = (a) => (a.vs === "act" ? (a.by === "crew" ? 0 : 1) : a.by === "crew" ? 3 : 2);
    return [...acts].filter((a) => gm || a.by === "crew" || a.shown !== false).sort((x, y) => rank(x) - rank(y) || (pos.get(x.by) ?? 1e5) - (pos.get(y.by) ?? 1e5));
  }

  // Whether a die's outcome still has to go on the cards: a win (or an action
  // with no roll) that changes a card, a second die that went for something
  // else and won, or one that was keeping its name out of it and lost.
  // Stopping an action, coming for the crew and working for a faction change
  // no card, so they don't wait on her.
  function needsPut(a, i, st) {
    if (a.put[i]) return false;
    const kind = a.what === "out" ? a.out : a.what;
    if (i === 1) return a.p2 === "quiet" ? st === "lost" || st === "tie" : st === "won";
    if (["Obstruct", "comes", "work", "else"].includes(kind)) return false;
    return st === "won" || st === "free";
  }
  // Anything still to roll or to go on the cards.
  function pendingIn(doc) {
    const t = doc.turn;
    const res = resultsOf(doc);
    return t.acts.some((a) => res.get(a.by)?.parts.some((p, i) => p.st === "waiting" || needsPut(a, i, p.st)));
  }

  // ------------------------------------------------------------ the GM's side

  function gmLive(id, doc) {
    const t = doc.turn;
    if (t.step === "land") return landView(id, doc, true);
    const results = resultsOf(doc);
    const actors = actorsOf(doc);
    // The crew's own mini factions first, then each faction with its minis.
    const order = [...actors.filter((f) => f.mini && f.parent === "crew")];
    for (const f of actors) {
      if (f.mini && (f.parent === "crew" || (f.parent && find(doc, f.parent)))) continue;
      order.push(f, ...actors.filter((m) => m.mini && m.parent === f.id));
    }
    const sitting = doc.factions.filter((f) => !actors.includes(f));
    const set = t.acts.filter((a) => a.by !== "crew");
    const unset = order.filter((f) => !set.some((a) => a.by === f.id));
    const rows = order.map((f) => rowView(id, doc, f, results)).join("");
    const hire = t.step === "hire" ? hireView(id, doc, true) : "";
    // Sending tells the crew about every faction named in a telegraph.
    const named = [...new Set(set.filter((a) => a.shown).flatMap((a) => [a.by, a.to]).filter((x) => x && !find(doc, x)?.shown.card))].map((x) => find(doc, x)?.name).filter(Boolean);
    const send = t.step === "hire"
      ? `<div class="wt-go"><p class="cc-small">${set.length ? `${plural(set.filter((a) => a.shown).length, "telegraph", "telegraphs")} ready, ${plural(set.filter((a) => !a.shown).length, "action", "actions")} off-screen.` : "No actions ready yet."}${unset.length ? ` ${plural(unset.length, "faction has", "factions have")} no action.` : ""}${named.length ? ` Sending them tells the crew ${andList(named.map(esc))} ${named.length === 1 ? "is" : "are"} out there.` : ""}</p>
        <button type="button" class="button primary" data-act="w" data-do="t-step" data-v="tele">${tu.sure === "send" ? "Tap again to send them" : "Send the telegraphs to the crew"}</button></div>`
      : `<div class="wt-go"><p class="cc-small">${t.acts.some((a) => a.by === "crew") ? "The crew’s picked its action." : "The crew hasn’t picked its action yet."} Once it has, the actions land.</p><button type="button" class="button primary" data-act="w" data-do="t-step" data-v="land">${tu.sure === "land" ? "Tap again to land them" : "The actions land"}</button>
        <button type="button" class="pt-reword" data-act="w" data-do="t-step" data-v="hire">Back to hiring</button></div>`;
    return `${t.step === "hire" ? `<p class="cc-lead">Hiring comes first, and meanwhile get every faction’s action ready. Nothing goes to the crew’s phones till you send the telegraphs.</p>` : `<p class="cc-lead">The telegraphs are on the crew’s phones. You can still change one, and the crew picks its action now.</p>`}
      ${hire}
      <h3 class="wt-h3">What every faction does</h3>
      <p class="cc-small">One action each. Telegraph it to the crew, or keep it off-screen and just say what changed. ${T.d6.length ? "Don’t know what one does? Roll for it on its card." : ""}</p>
      <ul class="wt-rows">${rows}</ul>
      ${sitting.length ? `<p class="cc-small">${andList(sitting.map((f) => esc(f.name)))} ${sitting.length === 1 ? "sits" : "sit"} this one out, the downtime ${sitting.length === 1 ? "it was" : "they were"} made in.</p>` : ""}
      ${t.step === "tele" ? crewView(id, doc, true) : ""}
      ${send}
      <p class="cc-small">${w.ruleLink("s-faction-turn", "The faction turn")} ${w.ruleLink("s-faction-outcomes", "The six outcomes")}</p>`;
  }

  // One faction in the list: its action, or the form for it.
  function rowView(id, doc, f, results) {
    const t = doc.turn;
    const a = t.acts.find((x) => x.by === f.id) ?? null;
    const key = `act:${f.id}`;
    const hire = t.hires.find((h) => h.to === f.id);
    const dice = stepsToDice(stepsOf(f));
    const maker = f.mini ? (f.parent === "crew" ? "the crew" : find(doc, f.parent)?.name ?? "") : "";
    const c = a ? cardOf(id, doc, a, true, results) : null;
    const badge = a ? `<span class="wb-badge${a.shown ? " is-on" : ""}">${a.shown ? "Telegraphed" : "Off-screen"}</span>` : "";
    const editing = tu.editing === key;
    return `<li class="wt-row card${editing ? " is-editing" : ""}">
      <div class="wt-row-top"><span class="wt-row-die" role="img" aria-label="Power ${diceLabel(dice)}">${dice.map((x, i) => kitDie(x, { own: "them", hide: true, cls: i ? "is-next" : "" })).join("")}</span>
        <div class="wt-row-in"><p class="wb-k">${f.mini ? `Mini faction${maker ? ` of ${esc(maker)}` : ""}` : "Faction"}${badge}</p><b class="wt-row-n">${esc(f.name)}</b>
        ${hire ? `<p class="wt-hired">${hire.by === "crew" ? "The crew’s paying it" : `${esc(find(doc, hire.by)?.name ?? "Someone")}’s paying it`}${hire.text ? `: ${esc(hire.text)}` : "."}</p>` : ""}
        <p class="wt-row-a">${c ? `${esc(a.words || doesOf(c))} <small>${c.parts.map((p) => diceLabel(p.dice)).join(" and ")}</small>` : "No action yet."}</p></div></div>
      ${editing ? factionForm(id, doc, f) : `<div class="cc-row"><button type="button" class="button sm" data-act="w" data-do="t-edit" data-k="${esc(key)}" aria-label="${a ? "Change it" : "Set its action"}: ${esc(f.name)}">${a ? "Change it" : "Set its action"}</button></div>`}</li>`;
  }

  // ------------------------------------------------------------ hiring

  function hireView(id, doc, gm) {
    const t = doc.turn;
    const extra = crew(id).money.extra;
    const left = Math.max(0, extra - spentOf(t));
    const mine = t.hires.filter((h) => h.by === "crew");
    const theirs = gm ? t.hires.filter((h) => h.by !== "crew") : [];
    const name = (x) => nameIn(id, doc, x);
    const hireLine = (h) => `<li class="pt-line"><div class="pt-line-in"><p>${h.by === "crew" ? "The crew’s paying" : `${esc(name(h.by))} is paying`} <b>${esc(h.toName || name(h.to))}</b>${h.text ? `: ${esc(h.text)}` : "."}</p></div>${h.by === "crew" || gm ? `<button type="button" class="button sm" data-act="w" data-do="t-unhire" data-h="${esc(h.id)}">Take it back</button>` : ""}</li>`;
    // The factions the crew could pay: ones it knows about, that aren't paid
    // for already. On the GM's phone, the ones hostile to the crew say so.
    const known = knownFactions(id, doc).filter((x) => !t.hires.some((h) => h.to === x.id));
    const crewForm = left > 0 && known.length ? `<form class="cc-form pt-form" data-form="w-thire">
        <label class="cc-field">Pay <select name="to">${known.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}${gm && find(doc, x.id) && towardOf(find(doc, x.id), "crew") === "hostile" ? " (hostile, it won’t take it)" : ""}</option>`).join("")}</select></label>
        <label class="cc-field">To do what, the job <input name="text" maxlength="140" autocomplete="off" placeholder="like Burn the Estate’s warehouse"></label>
        <div class="cc-row"><button type="submit" class="button">Pay it, with an extra resource</button></div></form>` : "";
    const crewSay = extra ? `The crew’s got ${plural(extra, "extra resource", "extra resources")} this downtime${spentOf(t) ? `, and ${words(spentOf(t))} ${spentOf(t) === 1 ? "is" : "are"} spent` : ""}.` : "The crew hasn’t got an extra resource this downtime, so it can’t pay anyone. A resource that isn’t paying for an asset is an extra one.";
    const payers = gm ? doc.factions.filter((f) => t.hires.filter((h) => h.by === f.id).length < moneyOf(f).extra) : [];
    const gmForm = gm && payers.length ? `<form class="cc-form pt-form" data-form="w-thire" data-by="faction">
        <label class="cc-field">Who’s paying <select name="by">${payers.map((f) => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select></label>
        <label class="cc-field">Pays <select name="to">${doc.factions.filter((f) => !t.hires.some((h) => h.to === f.id)).map((f) => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select></label>
        <label class="cc-field">To do what <input name="text" maxlength="140" autocomplete="off"></label>
        <div class="cc-row"><button type="submit" class="button">Hire it</button></div></form>` : gm ? '<p class="cc-small">No faction’s got an extra resource to pay anyone with.</p>' : "";
    return `<div class="wt-hire"><h3 class="wt-h3">Hiring comes first</h3>
      <p class="cc-small">${gm ? "Before you telegraph, the crew says who it’s paying with an extra resource, and you decide who the factions are paying. A hired faction spends its one action on the job, and the payer still takes its own." : `Before ${esc(w.gmName(id))} telegraphs, the crew can pay a faction with an extra resource. It spends its one action on the crew’s job, rolled with its own dice, and the crew still takes its own.`}</p>
      <p>${crewSay}</p>
      ${mine.length ? `<ul class="pt-lines">${mine.map(hireLine).join("")}</ul>` : ""}${crewForm}
      ${gm ? `<h4 class="wt-h4">Factions paying factions</h4>${theirs.length ? `<ul class="pt-lines">${theirs.map(hireLine).join("")}</ul>` : ""}${gmForm}` : ""}
      ${w.ruleLink("s-wealth", "Hiring and extra resources")}</div>`;
  }

  // The factions the crew knows about: the ones it's been shown, and the ones
  // in the telegraphs that are out. On the GM's phone, every one.
  function knownFactions(id, doc) {
    const t = doc.turn;
    const out = new Map();
    for (const f of doc.factions) if (w.isGm(id) || f.shown.card || knownTo(doc, f.id)) out.set(f.id, { id: f.id, name: f.name });
    if (!w.isGm(id) && t && t.step !== "hire") {
      for (const a of t.acts) {
        if (a.by !== "crew" && !out.has(a.by)) out.set(a.by, { id: a.by, name: a.byName });
        if (a.to && a.toName && !out.has(a.to)) out.set(a.to, { id: a.to, name: a.toName });
      }
    }
    return [...out.values()];
  }

  // ------------------------------------------------------------ a faction's action

  // The draft of a faction's action, from its act or a blank one.
  function draftFor(doc, f) {
    const had = doc.turn.acts.find((a) => a.by === f.id);
    if (had) return { ...structuredClone(had), splitOn: Boolean(had.split) };
    const ag = f.agendas.find((x) => !x.done);
    const what = f.mini ? "out" : ag ? "agenda" : "new";
    return { by: f.id, what, out: f.mini ? f.outs[0] ?? "Acquire" : null, ag: ag?.id ?? null, to: null, thing: null, vs: what === "agenda" ? "agenda" : "none", there: [], vsteps: 0, left: [], fits: [], split: null, splitOn: false, p2: "quiet", p2text: "", shown: f.shown.card, words: "", nt: "", nd: 6 };
  }
  const whatKey = (a) => (a.what === "agenda" ? `agenda:${a.ag}` : a.what === "out" ? a.out : a.what);

  function factionForm(id, doc, f) {
    const key = `act:${f.id}`;
    if (tu.draft?.key !== key) tu.draft = { key, v: draftFor(doc, f) };
    const v = tu.draft.v;
    const t = doc.turn;
    const kind = v.what === "out" ? v.out : v.what;
    const others = doc.factions.filter((x) => x.id !== f.id);
    const opt = (val, label, on) => `<option value="${esc(val)}"${on ? " selected" : ""}>${esc(label)}</option>`;
    const whats = f.mini
      ? f.outs.map((o) => opt(o, o, kind === o))
      : [...f.agendas.filter((x) => !x.done).map((x) => opt(`agenda:${x.id}`, `Works its agenda, ${x.text}, at d${x.die}`, v.what === "agenda" && v.ag === x.id)),
        ...(f.agendas.length < 2 ? [opt("new", "Writes a new agenda", v.what === "new")] : []), ...OUTCOMES.map((o) => opt(o, o, kind === o)), opt("comes", "Comes for the crew", v.what === "comes")];
    const target = find(doc, v.to);
    const fields = [];
    if (v.what === "new") {
      fields.push(`<label class="cc-field">Its new agenda <input name="nt" maxlength="120" autocomplete="off" value="${esc(v.nt)}" list="wt-agendas" placeholder="like Find the painted box"></label><datalist id="wt-agendas">${W.build.agendas.map((x) => `<option value="${esc(x.text)}"></option>`).join("")}</datalist>
        <label class="cc-field">It starts at <select name="nd">${SIZES.map((s) => opt(s, `d${s}`, s === v.nd)).join("")}</select></label>`);
    }
    if (v.what === "out" && v.out === "Obstruct") {
      const acts = t.acts.filter((a) => a.by !== f.id && a.by !== "crew" && find(doc, a.by));
      fields.push(acts.length ? `<label class="cc-field">Which action it’s stopping <select name="act">${acts.map((a) => opt(a.by, `${find(doc, a.by).name}: ${shortOf(cardOf(id, doc, a, true, new Map()))}`, v.to === a.by)).join("")}</select></label>` : '<p class="cc-small wt-warn">There’s no other faction’s action to Obstruct yet. Set theirs first.</p>');
    } else if (v.what === "out" && v.out !== "Establish") {
      fields.push(`<label class="cc-field">At <select name="to">${others.map((x) => opt(x.id, x.name, v.to === x.id)).join("")}</select></label>`);
      if ((v.out === "Destroy" || v.out === "Acquire") && target) {
        fields.push(`<label class="cc-field">What it’s after <select name="thing">${opt("", "Whatever it can get", !v.thing)}${["res", "assets"].flatMap((l) => target[l].map((x) => opt(`${l}:${x.id}`, `${x.text} (${LIST_NAME[l]}${x.x > 1 ? ` ×${x.x}` : ""})`, v.thing?.lid === x.id))).join("")}</select></label>`);
      }
    }
    // What it's against.
    const vsNames = { power: `Its Power${target ? `, ${diceLabel(stepsToDice(stepsOf(target)))}` : ""}`, own: "What’s guarding it out on its own", face: "Its face", die: kind === "Establish" ? "Somebody’s in its way: a die" : "A die of its own, a stake or a person", none: "Nothing’s in its way, so no roll", agenda: "", act: "" };
    const choices = VS[kind] ?? ["none"];
    if (choices.length > 1) fields.push(`<label class="cc-field">Against <select name="vs">${choices.map((x) => opt(x, vsNames[x], v.vs === x)).join("")}</select></label>`);
    if (v.vs === "own" && target) {
      const guards = target.assets.filter((x) => x.power && !x.off);
      fields.push(`<fieldset class="wt-checks"><legend>What’s really there, guarding it: 1 step, plus each of these</legend><input type="hidden" name="has-there" value="1">${guards.length ? guards.map((x) => `<label class="pt-check"><input type="checkbox" name="there-${esc(x.id)}"${v.there.includes(x.id) ? " checked" : ""}> ${esc(x.text)}</label>`).join("") : '<p class="cc-small">It’s got nothing that adds Power.</p>'}</fieldset>`);
    }
    if (v.vs === "face" || v.vs === "die") fields.push(`<label class="cc-field">${v.vs === "face" ? "Its face defends with" : "The die"} <select name="vsteps">${SIZES.map((s) => opt(s / 2, `d${s}`, (v.vsteps || (v.vs === "face" && target ? Math.min(6, stepsOf(target)) : 3)) === s / 2)).join("")}</select></label>`);
    // Its dice: its Power, less what doesn't fit, plus bond threads that do.
    const powerAssets = f.assets.filter((x) => x.power && !x.off);
    const threads = bondThreads(f);
    const steps = stepsFor(doc, v);
    const shapes = steps > 1 ? Array.from({ length: steps - 1 }, (_, i) => steps - 1 - i) : [];
    const first = v.split && v.split < steps ? v.split : Math.ceil(steps / 2);
    const preview = partsFor(doc, { ...v, split: v.splitOn ? first : null });
    const dice = `<div class="wt-preview" role="img" aria-label="${esc(preview.map((p) => diceLabel(p.dice)).join(" and "))}">${preview.map((p) => p.dice.map((x, i) => kitDie(x, { own: "them", hide: true, cls: i ? "is-next" : "" })).join("")).join('<span class="wt-and" aria-hidden="true">+</span>')}<span class="cc-small">${steps} ${steps === 1 ? "step" : "steps"}</span></div>`;
    const comesNote = v.what === "comes" ? `<p class="cc-small">When you save it, the phone rolls its d12 on the right table, as you telegraph it: ${(() => {
      const hire = t.hires.find((h) => h.to === f.id);
      const payer = hire ? (hire.by === "crew" ? null : find(doc, hire.by)) : f;
      const s = payer ? towardOf(payer, "crew") : "business";
      return s === "hostile" ? "mostly hostile threads toward the crew" : s === "friendly" ? "mostly bond threads toward the crew" : "no threads, or as many of each, so a d2 picks the table first";
    })()}${t.hires.find((h) => h.to === f.id && h.by !== f.id) ? ", the payer’s, since it’s been paid to come for them" : ""}.</p>` : "";
    const roll = tu.d6?.f === f.id ? `<p class="cc-note wt-d6" role="status"><b>d6: ${tu.d6.r}.</b> ${esc(T.d6[tu.d6.row]?.text ?? "")}</p>` : "";
    return `<form class="cc-form pt-form wt-form" data-form="w-tact" data-f="${esc(f.id)}">
      ${roll}
      <label class="cc-field">What ${esc(f.name)} does <select name="what">${whats.join("")}</select></label>
      ${!f.mini && T.d6.length ? `<div class="cc-row"><button type="button" class="button sm" data-act="w" data-do="t-d6" data-f="${esc(f.id)}">Roll for it, a d6</button></div>` : ""}
      ${fields.join("")}${comesNote}
      <fieldset class="wt-checks"><legend>Its dice: 1 step, plus each asset that adds Power and fits what it’s doing</legend><input type="hidden" name="has-use" value="1">
        ${powerAssets.map((x) => `<label class="pt-check"><input type="checkbox" name="use-${esc(x.id)}"${v.left.includes(x.id) ? "" : " checked"}> ${esc(x.text)}</label>`).join("") || '<p class="cc-small">Nothing that adds Power, so it’s 1 step.</p>'}
        ${threads.length ? `<p class="cc-small">A bond thread that fits is a step too.</p>${threads.map((x) => `<label class="pt-check"><input type="checkbox" name="fit-${esc(x.id)}"${v.fits.includes(x.id) ? " checked" : ""}> <em>${esc(x.text)}</em></label>`).join("")}` : ""}</fieldset>
      ${dice}
      ${steps > 1 ? `<label class="pt-check"><input type="checkbox" name="split"${v.splitOn ? " checked" : ""}> Split it, so it goes for two things in the same job</label>` : ""}
      ${v.splitOn && steps > 1 ? `<label class="cc-field">The first die, then the second <select name="first">${shapes.map((k) => opt(k, `${diceLabel(stepsToDice(k))} and ${diceLabel(stepsToDice(steps - k))}`, k === first)).join("")}</select></label>
        <fieldset class="wt-checks"><legend>What the second die’s for</legend><label class="pt-check"><input type="radio" name="p2" value="quiet"${v.p2 !== "else" ? " checked" : ""}> Keeping its name out of it</label><label class="pt-check"><input type="radio" name="p2" value="else"${v.p2 === "else" ? " checked" : ""}> Something else</label></fieldset>
        ${v.p2 === "else" ? `<label class="cc-field">The second thing <input name="p2text" maxlength="120" autocomplete="off" value="${esc(v.p2text)}"></label>` : ""}` : ""}
      <label class="pt-check"><input type="checkbox" name="shown"${v.shown ? " checked" : ""}> Telegraph it to the crew</label>
      ${!v.shown ? '<p class="cc-small">Off-screen, it moves with no roll. Once the actions land, you say what changed.</p>' : ""}
      <label class="cc-field">What the crew’s told, if you’d rather say it yourself <input name="words" maxlength="140" autocomplete="off" value="${esc(v.words)}" placeholder="${esc(doesOf(cardOf(id, doc, { ...v, split: v.splitOn ? first : null }, true, new Map())))}"></label>
      <div class="cc-row"><button type="submit" class="button primary">Save its action</button><button type="button" class="button" data-act="w" data-do="t-cancel">Cancel</button>${t.acts.some((a) => a.by === f.id) ? `<button type="button" class="button" data-act="w" data-do="t-unact" data-f="${esc(f.id)}">It does nothing</button>` : ""}</div></form>`;
  }

  // The form as it stands, read into the draft.
  function readFaction(form, doc) {
    const f = find(doc, form.dataset.f);
    if (!f || !tu.draft) return null;
    const fd = new FormData(form);
    const v = { ...tu.draft.v };
    const what = String(fd.get("what") ?? whatKey(v));
    const was = whatKey(v);
    if (what.startsWith("agenda:")) Object.assign(v, { what: "agenda", ag: what.slice(7), out: null });
    else if (OUTCOMES.includes(what)) Object.assign(v, { what: "out", out: what });
    else Object.assign(v, { what, out: null });
    const kind = v.what === "out" ? v.out : v.what;
    if (what !== was) {
      // A new kind of action starts with what it's most likely against.
      const others = doc.factions.filter((x) => x.id !== f.id);
      v.vs = VS[kind]?.[0] ?? "none";
      v.thing = null;
      if (kind === "Obstruct") v.to = doc.turn.acts.find((a) => a.by !== f.id && a.by !== "crew")?.by ?? null;
      else if (v.what === "out" && kind !== "Establish") v.to = v.to && v.to !== f.id && find(doc, v.to) ? v.to : others[0]?.id ?? null;
      else v.to = null;
    } else {
      if (fd.has("to")) v.to = String(fd.get("to"));
      if (fd.has("act")) v.to = String(fd.get("act"));
      if (fd.has("vs")) v.vs = String(fd.get("vs"));
      if (fd.has("thing")) {
        const [l, lid] = String(fd.get("thing")).split(":");
        v.thing = lid ? { l, lid } : null;
      }
    }
    if (fd.has("nt")) v.nt = String(fd.get("nt")).slice(0, 120);
    if (fd.has("nd")) v.nd = Number(fd.get("nd")) || 6;
    if (fd.has("vsteps")) v.vsteps = Number(fd.get("vsteps")) || 0;
    if (fd.has("has-there")) v.there = [...fd.keys()].filter((k) => k.startsWith("there-")).map((k) => k.slice(6));
    if (fd.has("has-use")) v.left = f.assets.filter((x) => x.power && !x.off && fd.get(`use-${x.id}`) !== "on").map((x) => x.id);
    if (fd.has("has-use")) v.fits = bondThreads(f).filter((x) => fd.get(`fit-${x.id}`) === "on").map((x) => x.id);
    v.splitOn = fd.get("split") === "on";
    if (fd.has("first")) v.split = Number(fd.get("first")) || null;
    if (fd.has("p2")) v.p2 = fd.get("p2") === "else" ? "else" : "quiet";
    if (fd.has("p2text")) v.p2text = String(fd.get("p2text")).slice(0, 120);
    v.shown = fd.get("shown") === "on";
    v.words = String(fd.get("words") ?? "").slice(0, 140);
    tu.draft.v = v;
    return v;
  }

  // The act to save, from the draft.
  function actFromDraft(doc, v) {
    const steps = stepsFor(doc, v);
    const split = v.splitOn && steps > 1 ? Math.min(steps - 1, Math.max(1, v.split || Math.ceil(steps / 2))) : null;
    const a = { by: v.by, what: v.what, out: v.out, ag: v.ag, to: v.to, act: v.what === "out" && v.out === "Obstruct" ? v.to : undefined, thing: v.thing, vs: v.vs, there: v.there, vsteps: v.vsteps, left: v.left, fits: v.fits, split, p2: v.p2, p2text: v.p2text, shown: v.shown, words: v.words.trim() };
    if (v.what === "new") Object.assign(a, { nt: bare(v.nt.trim()), nd: v.nd });
    return a;
  }

  // Comes for the crew: its d12 on the right table, rolled as it's telegraphed,
  // by its threads toward the crew (or the payer's, if it's been paid to).
  function comesTable(doc, f) {
    const hire = doc.turn.hires.find((h) => h.to === f.id);
    const payer = hire && hire.by !== "crew" ? find(doc, hire.by) ?? f : f;
    const s = towardOf(payer, "crew");
    const d2 = s === "business" ? rollDie(2) : 0;
    return { k: s === "hostile" || d2 === 1 ? "hostile" : "bond", r: rollDie(12), d2 };
  }

  // ------------------------------------------------------------ the crew's action

  function crewView(id, doc, gm) {
    const t = doc.turn;
    const a = t.acts.find((x) => x.by === "crew") ?? null;
    const editing = tu.editing === "crew";
    const results = gm ? resultsOf(doc) : resultsMine(t);
    const card = a && !editing ? tele(id, cardOf(id, doc, a, gm, results)) : "";
    const can = t.step === "hire" || t.step === "tele";
    return `<div class="wt-crew"><h3 class="wt-h3">The crew’s action</h3>
      <p class="cc-small">One a downtime, the same as every faction, and nothing buys another. Anyone can put a personal slot in as well, and everything counts twice. ${w.ruleLink("s-faction-crew", "The crew’s moves")}</p>
      ${card}
      ${editing ? crewForm(id, doc, gm) : can ? `<div class="cc-row"><button type="button" class="button${a ? "" : " primary"}" data-act="w" data-do="t-edit" data-k="crew">${a ? "Change the crew’s action" : "Pick the crew’s action"}</button>${a ? `<button type="button" class="button" data-act="w" data-do="t-unact" data-f="crew">Take it off</button>` : ""}</div>` : ""}</div>`;
  }

  function crewDraft(id, doc) {
    const had = doc.turn.acts.find((a) => a.by === "crew");
    if (had) return { ...structuredClone(had), whoOn: Boolean(had.who), splitOn: Boolean(had.split) };
    const tele = doc.turn.step !== "hire" ? doc.turn.acts.find((a) => a.by !== "crew" && a.shown !== false) : null;
    const out = tele ? "Obstruct" : "Destroy";
    return { by: "crew", what: "out", out, to: tele?.by ?? knownFactions(id, doc)[0]?.id ?? null, ag: null, thing: null, vs: tele ? "act" : "power", there: [], vsteps: 0, power: crew(id).steps, own: 2, who: "", whoOn: false, fit: 0, slot: false, slotBy: "", about: "", text: "", split: null, splitOn: false, p2: "quiet", p2text: "" };
  }

  function crewForm(id, doc, gm) {
    if (tu.draft?.key !== "crew") tu.draft = { key: "crew", v: crewDraft(id, doc) };
    const v = tu.draft.v;
    v.power = crew(id).steps;
    const t = doc.turn;
    const kind = v.what === "out" ? v.out : v.what;
    const opt = (val, label, on) => `<option value="${esc(val)}"${on ? " selected" : ""}>${esc(label)}</option>`;
    const known = knownFactions(id, doc);
    const teles = t.acts.filter((a) => a.by !== "crew" && a.shown !== false && (gm ? find(doc, a.by) : true));
    const fields = [];
    if (v.what === "else") fields.push(`<label class="cc-field">What the crew’s doing <input name="text" maxlength="140" autocomplete="off" value="${esc(v.text ?? "")}" placeholder="like Chase the Goal"></label>`);
    else if (kind === "Obstruct") fields.push(teles.length ? `<label class="cc-field">Which telegraph <select name="act">${teles.map((a) => opt(a.by, `${nameIn(id, doc, a.by)}: ${shortOf(cardOf(id, doc, a, gm, new Map()))}`, v.to === a.by)).join("")}</select></label>` : '<p class="cc-small wt-warn">There’s nothing telegraphed to Obstruct yet.</p>');
    else if (kind !== "Establish") fields.push(known.length ? `<label class="cc-field">At <select name="to">${known.map((x) => opt(x.id, x.name, v.to === x.id)).join("")}</select></label>` : '<p class="cc-small wt-warn">The crew doesn’t know about any faction yet.</p>');
    if (["Destroy", "Acquire", "Undermine", "Influence", "Establish"].includes(kind)) fields.push(`<label class="cc-field">${kind === "Establish" ? "What it’s building" : "What it’s after, if it’s one thing"} <input name="about" maxlength="120" autocomplete="off" value="${esc(v.about)}" placeholder="${kind === "Establish" ? "like A safehouse in the Low Market" : "like the vineyards"}"></label>`);
    const vsNames = { power: "Its Power", own: "One thing out on its own (the GM says what’s guarding it)", face: "Its face", die: "Whatever’s in its way (the GM says its die)", none: "Nothing, unless something’s in the way" };
    const choices = (VS[kind] ?? ["none"]).filter((x) => x !== "die" || gm);
    if (choices.length > 1) fields.push(`<label class="cc-field">Against <select name="vs">${choices.map((x) => opt(x, vsNames[x], v.vs === x)).join("")}</select></label>`);
    if (gm && v.vs === "own" && find(doc, v.to)) fields.push(`<fieldset class="wt-checks"><legend>What’s really there, guarding it: 1 step, plus each of these</legend><input type="hidden" name="has-there" value="1">${find(doc, v.to).assets.filter((x) => x.power && !x.off).map((x) => `<label class="pt-check"><input type="checkbox" name="there-${esc(x.id)}"${v.there.includes(x.id) ? " checked" : ""}> ${esc(x.text)}</label>`).join("")}</fieldset>`);
    if (gm && (v.vs === "face" || v.vs === "die")) fields.push(`<label class="cc-field">It defends with <select name="vsteps">${SIZES.map((s) => opt(s / 2, `d${s}`, (v.vsteps || 3) === s / 2)).join("")}</select></label>`);
    const roll = !["work", "else"].includes(v.what);
    const steps = stepsFor(doc, v);
    const shapes = steps > 1 ? Array.from({ length: steps - 1 }, (_, i) => steps - 1 - i) : [];
    const first = v.split && v.split < steps ? v.split : Math.ceil(steps / 2);
    const preview = partsFor(doc, { ...v, split: v.splitOn ? first : null });
    const big = roll && (gm ? tooBig(doc, { ...v, act: v.to }) : bigToCrew(doc, v));
    const target = v.to ? nameIn(id, doc, v.to) : "";
    const crewDice = stepsToDice(v.power);
    return `<form class="cc-form pt-form wt-form" data-form="w-tcrew">
      <label class="cc-field">The crew’s move <select name="what">${[...OUTCOMES.map((o) => opt(o, o, kind === o)), ...["back", "work", "else"].map((m) => opt(m, MOVES[m], v.what === m))].join("")}</select></label>
      ${fields.join("")}
      ${roll ? `<fieldset class="wt-checks"><legend>Who rolls</legend>
        <label class="pt-check"><input type="radio" name="whoOn" value="crew"${v.whoOn ? "" : " checked"}> The crew’s Power, ${diceLabel(crewDice)}, plus a step for every Reputation and bond thread that fits</label>
        <label class="pt-check"><input type="radio" name="whoOn" value="one"${v.whoOn ? " checked" : ""}> One of us, plainly the right person, with their own permissions</label></fieldset>
        ${v.whoOn ? `<label class="cc-field">Who <input name="who" maxlength="60" autocomplete="off" value="${esc(v.who)}" placeholder="like Dorrie"></label>
          <label class="cc-field">Their steps: 1 for the action, plus everything that fits <select name="own">${Array.from({ length: 12 }, (_, i) => opt(i + 1, `${i + 1} ${i ? "steps" : "step"}`, (v.own || 2) === i + 1)).join("")}</select></label>`
          : `<label class="cc-field">Reputations and bond threads that fit <select name="fit">${Array.from({ length: 7 }, (_, i) => opt(i, i ? `+${i} ${i === 1 ? "step" : "steps"}` : "None", v.fit === i)).join("")}</select></label>`}
        <label class="pt-check"><input type="checkbox" name="slot"${v.slot ? " checked" : ""}> A personal slot’s in as well, so everything counts twice</label>
        ${v.slot ? `<label class="cc-field">Whose slot <input name="slotBy" maxlength="60" autocomplete="off" value="${esc(v.slotBy)}" placeholder="like Bram"></label>` : ""}
        <div class="wt-preview" role="img" aria-label="${esc(preview.map((p) => diceLabel(p.dice)).join(" and "))}">${preview.map((p) => p.dice.map((x, i) => kitDie(x, { own: "you", hide: true, cls: i ? "is-next" : "" })).join("")).join('<span class="wt-and" aria-hidden="true">+</span>')}<span class="cc-small">${steps} ${steps === 1 ? "step" : "steps"}</span></div>
        ${steps > 1 ? `<label class="pt-check"><input type="checkbox" name="split"${v.splitOn ? " checked" : ""}> Split it, so it goes for two things in the same job</label>` : ""}
        ${v.splitOn && steps > 1 ? `<label class="cc-field">The first die, then the second <select name="first">${shapes.map((k) => opt(k, `${diceLabel(stepsToDice(k))} and ${diceLabel(stepsToDice(steps - k))}`, k === first)).join("")}</select></label>
          <fieldset class="wt-checks"><legend>What the second die’s for</legend><label class="pt-check"><input type="radio" name="p2" value="quiet"${v.p2 !== "else" ? " checked" : ""}> Keeping the crew’s name out of it</label><label class="pt-check"><input type="radio" name="p2" value="else"${v.p2 === "else" ? " checked" : ""}> Something else</label></fieldset>
          ${v.p2 === "else" ? `<label class="cc-field">The second thing <input name="p2text" maxlength="120" autocomplete="off" value="${esc(v.p2text)}"></label>` : ""}` : ""}` : ""}
      ${big ? `<p class="cc-warn" role="alert">${esc(target)} is bigger than the crew, so going at its Power takes a personal slot in as well. Or go at something smaller: one thing out on its own, its agenda, its face or its people.</p>` : ""}
      <div class="cc-row"><button type="submit" class="button primary"${big ? " disabled" : ""}>Save the crew’s action</button><button type="button" class="button" data-act="w" data-do="t-cancel">Cancel</button></div></form>`;
  }

  function bigToCrew(doc, v) {
    if (v.slot || !v.to || (v.vs !== "power" && v.vs !== "act")) return false;
    const f = find(doc, v.to);
    const tele = doc.turn.acts.find((a) => a.by === v.to);
    const steps = f?.shown.power ? stepsOf(f) : tele ? tele.parts.reduce((n, p) => n + p.steps, 0) : 0;
    return steps > v.power;
  }

  function readCrew(form, id, doc) {
    if (!tu.draft) return null;
    const fd = new FormData(form);
    const v = { ...tu.draft.v };
    const what = String(fd.get("what") ?? (v.what === "out" ? v.out : v.what));
    const was = v.what === "out" ? v.out : v.what;
    if (OUTCOMES.includes(what)) Object.assign(v, { what: "out", out: what });
    else Object.assign(v, { what, out: null });
    const kind = v.what === "out" ? v.out : v.what;
    if (what !== was) {
      v.vs = VS[kind]?.[0] ?? "none";
      if (kind === "Obstruct") v.to = doc.turn.acts.find((a) => a.by !== "crew" && a.shown !== false)?.by ?? null;
      else if (kind === "Establish" || kind === "else") v.to = null;
      else if (!knownFactions(id, doc).some((x) => x.id === v.to)) v.to = knownFactions(id, doc)[0]?.id ?? null;
    } else {
      if (fd.has("to")) v.to = String(fd.get("to"));
      if (fd.has("act")) v.to = String(fd.get("act"));
      if (fd.has("vs")) v.vs = String(fd.get("vs"));
    }
    if (fd.has("text")) v.text = String(fd.get("text")).slice(0, 140);
    if (fd.has("about")) v.about = String(fd.get("about")).slice(0, 120);
    if (fd.has("has-there")) v.there = [...fd.keys()].filter((k) => k.startsWith("there-")).map((k) => k.slice(6));
    if (fd.has("vsteps")) v.vsteps = Number(fd.get("vsteps")) || 0;
    if (fd.has("whoOn")) v.whoOn = fd.get("whoOn") === "one";
    if (fd.has("who")) v.who = String(fd.get("who")).slice(0, 60);
    if (fd.has("own")) v.own = Number(fd.get("own")) || 2;
    if (fd.has("fit")) v.fit = Number(fd.get("fit")) || 0;
    if (fd.has("whoOn")) v.slot = fd.get("slot") === "on";
    if (fd.has("slotBy")) v.slotBy = String(fd.get("slotBy")).slice(0, 60);
    if (fd.has("whoOn")) v.splitOn = fd.get("split") === "on";
    if (fd.has("first")) v.split = Number(fd.get("first")) || null;
    if (fd.has("p2")) v.p2 = fd.get("p2") === "else" ? "else" : "quiet";
    if (fd.has("p2text")) v.p2text = String(fd.get("p2text")).slice(0, 120);
    if (!v.whoOn) v.who = "";
    tu.draft.v = v;
    return v;
  }

  function crewFromDraft(id, doc, v) {
    const power = crew(id).steps;
    const who = v.whoOn ? v.who.trim() || "One of the crew" : "";
    const base = { ...v, power, who };
    const steps = stepsFor(doc, base);
    const split = v.splitOn && steps > 1 && !["work", "else"].includes(v.what) ? Math.min(steps - 1, Math.max(1, v.split || Math.ceil(steps / 2))) : null;
    return { by: "crew", what: v.what, out: v.out, ag: v.ag, to: v.to, act: v.what === "out" && v.out === "Obstruct" ? v.to : undefined, thing: v.thing, vs: v.vs, there: v.there, vsteps: v.vsteps, power, own: who ? v.own : 0, who, fit: who ? 0 : v.fit, slot: v.slot, slotBy: v.slot ? v.slotBy.trim() : "", about: v.about.trim(), text: (v.text ?? "").trim(), split, p2: v.p2, p2text: v.p2text };
  }

  // ------------------------------------------------------------ the crew's side

  function playerLive(id, doc) {
    const t = doc.turn;
    const gmn = esc(w.gmName(id));
    if (t.step === "land") return landView(id, doc, false);
    const results = resultsMine(t);
    const teles = ordered(doc, t.acts.filter((a) => a.by !== "crew"), false).map((a) => `<li>${tele(id, cardOf(id, doc, a, false, results))}</li>`).join("");
    if (t.step === "hire") return `<p class="cc-lead">${gmn}’s started downtime ${t.n}’s faction turn. Her telegraphs come next, once hiring’s done.</p>${hireView(id, doc, false)}${crewView(id, doc, false)}`;
    return `<p class="cc-lead">${gmn}’s telegraphed what the factions are doing this downtime. The crew can move against one before it lands.</p>
      <h3 class="wt-h3">What the factions are doing</h3>
      ${teles ? `<ul class="wt-teles">${teles}</ul>` : `<p class="cc-small">Nothing’s been telegraphed to the crew. Whatever the factions are doing, it’s off where you can’t see it.</p>`}
      ${crewView(id, doc, false)}`;
  }

  // ------------------------------------------------------------ landing

  function landView(id, doc, gm) {
    const t = doc.turn;
    const results = gm ? resultsOf(doc) : resultsMine(t);
    const acts = ordered(doc, t.acts, gm);
    const obs = acts.filter((a) => a.vs === "act");
    const rest = acts.filter((a) => a.vs !== "act");
    const card = (a) => {
      const c = cardOf(id, doc, a, gm, results);
      return `<li>${tele(id, c, gm, landControls(id, doc, c, gm))}</li>`;
    };
    const toRoll = gm && acts.some((a) => a.by !== "crew" && a.shown !== false && !a.r && (againstOf(doc, a).kind !== "none" || obs.some((o) => o.to === a.by)));
    return `<p class="cc-lead">${gm ? "The actions land. Obstructs first, then the rest. Roll them all in a tap, or one at a time, and tap in real dice if you’d rather roll them at the table." : "The actions are landing. Obstructs first, then the rest."}</p>
      ${gm && toRoll ? `<div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="t-rollall">Roll the factions’ dice</button></div><p class="cc-small">The crew rolls its own. You can roll it for them on its card.</p>` : ""}
      ${obs.length ? `<h3 class="wt-h3">Obstructs first</h3><ul class="wt-teles">${obs.map(card).join("")}</ul>` : ""}
      ${rest.length ? `<h3 class="wt-h3">${obs.length ? "Then the rest" : "The actions"}</h3><ul class="wt-teles">${rest.map(card).join("")}</ul>` : '<p class="cc-small">Nothing else this downtime.</p>'}
      ${gm ? `<div class="wt-go"><p class="cc-small">Once everything’s on the cards, that downtime’s done. It stays here, with how it went, till the next one.</p><button type="button" class="button${pendingIn(doc) ? "" : " primary"}" data-act="w" data-do="t-step" data-v="done">${tu.sure === "done" ? "Something’s still to roll or to go on the cards. Tap again to finish anyway" : "That downtime’s done"}</button>${acts.every((a) => !a.r) ? '<button type="button" class="pt-reword" data-act="w" data-do="t-step" data-v="tele">Back to the telegraphs</button>' : ""}</div>` : ""}`;
  }

  // Under a card while the actions land: rolling it, and putting what it did
  // on the cards.
  function landControls(id, doc, c, gm) {
    const a = c.a;
    const t = doc.turn;
    const crewAct = a.by === "crew";
    const out = [];
    const needs = c.res && c.res.parts.some((p) => p.st === "waiting");
    const realKey = `real:${a.by}`;
    // Rolling it: the GM rolls the factions', and the crew rolls its own (or
    // she rolls it for them).
    if (needs && (gm || crewAct) && !(a.shown === false)) {
      if (tu.real === realKey) out.push(realForm(id, doc, c, gm));
      else out.push(`<div class="cc-row"><button type="button" class="button primary" data-act="w" data-do="t-roll" data-by="${esc(a.by)}">${crewAct ? (gm ? "Roll it for the crew" : "Roll the crew’s dice") : "Roll it"}</button><button type="button" class="button" data-act="w" data-do="t-real" data-by="${esc(a.by)}">Real dice</button></div>`);
    } else if (gm && a.r && tu.real === realKey) out.push(realForm(id, doc, c, gm));
    else if (gm && a.r) out.push(`<button type="button" class="pt-reword" data-act="w" data-do="t-real" data-by="${esc(a.by)}">Put what it rolled straight</button>`);
    // The crew's ways out of a loss or a tie: 1 Resolve to roll again, or an
    // extra resource to take the tie.
    if (crewAct && a.r && c.res && t.step === "land") {
      const tied = c.res.parts.map((p, i) => (p.st === "tie" ? i : -1)).filter((i) => i >= 0);
      const lost = c.res.parts.some((p) => p.st === "lost" || p.st === "tie");
      const left = crew(id).money.extra - spentOf(t);
      if (lost) out.push(`<div class="cc-row wt-outs">${`<button type="button" class="button sm" data-act="w" data-do="t-again">Roll again, for 1 Resolve</button>`}${tied.map((i) => `<button type="button" class="button sm" data-act="w" data-do="t-tie" data-p="${i}"${left > 0 ? "" : " disabled"}>Take the tie${c.parts.length > 1 ? ` on the ${i ? "second" : "first"} die` : ""}, with an extra resource</button>`).join("")}</div>
        <p class="cc-small">Rolling again is the crew’s own dice only, and whoever rolls takes the Resolve off their sheet.${tied.length && left <= 0 ? " The crew hasn’t got an extra resource left for the tie." : ""}</p>`);
    }
    if (gm) out.push(...outcomes(id, doc, c));
    return out.length ? `<div class="wt-land">${out.join("")}</div>` : "";
  }

  // Real dice, tapped in: a select for each die that's still to roll.
  function realForm(id, doc, c, gm) {
    const a = c.a;
    const t = doc.turn;
    const sel = (name, size, v) => `<label class="cc-field wt-pad">d${size} <select name="${name}">${Array.from({ length: size }, (_, i) => `<option value="${i + 1}"${v === i + 1 ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>`;
    const own = !a.r || gm ? c.parts.flatMap((p, i) => p.dice.map((s, j) => sel(`r-${i}-${j}`, s, a.r?.[i]?.[j]?.v))) : [];
    const vs = c.vs;
    const fix = gm && Boolean(a.r);
    const theirs = [];
    if (vs.kind === "power" && (!vs.got || fix)) theirs.push(...vs.dice.map((s, j) => sel(`def-${j}`, s, vs.got?.[j]?.v)));
    if (vs.kind === "roll" && (!vs.got || fix)) theirs.push(...vs.dice.map((s, j) => sel(`vr-${j}`, s, vs.got?.[j]?.v)));
    if (vs.kind === "act") {
      const b = gm ? vs.act : t.acts.find((x) => x.by === a.stops);
      if (b && (!b.r || fix)) {
        const bp = gm ? partsFor(doc, b) : b.parts;
        theirs.push(...bp.flatMap((p, i) => p.dice.map((s, j) => sel(`at-${i}-${j}`, s, b.r?.[i]?.[j]?.v))));
      }
    }
    return `<form class="cc-form pt-form wt-real" data-form="w-treal" data-by="${esc(a.by)}">
      <p class="cc-small">What each die came up.</p>
      ${own.length ? `<div class="wt-pads"><span class="wt-pads-k">${a.by === "crew" ? "The crew’s" : `${esc(poss(c.byName))}`}</span>${own.join("")}</div>` : ""}
      ${theirs.length ? `<div class="wt-pads"><span class="wt-pads-k">${vs.kind === "act" ? `${esc(poss(c.toName))} dice` : vs.kind === "power" ? `${esc(poss(c.toName))} Power` : "What it’s against"}</span>${theirs.join("")}</div>` : ""}
      <div class="cc-row"><button type="submit" class="button primary">That’s what they came up</button><button type="button" class="button" data-act="w" data-do="t-real" data-by="">Cancel</button></div></form>`;
  }

  // The rolls for one act, as a change: its own dice, and whatever it's
  // against that nobody's rolled yet, since a faction's Power is rolled once,
  // the first time anyone goes at it, and an action's dice stand once they're
  // rolled. fix: the GM putting a roll straight, so what's rolled is rolled
  // again from what she taps in. pick(size, where, had) gives a die's face.
  function rollOp(doc, c, gm, pick = (s) => rollDie(s), fix = false) {
    const a = c.a;
    const t = doc.turn;
    const op = { o: "t-roll", id: t.id, by: a.by };
    if (!a.r || fix) op.r = c.parts.map((p, i) => p.dice.map((s, j) => ({ d: s, v: pick(s, `r-${i}-${j}`, a.r?.[i]?.[j]?.v) })));
    const vs = c.vs;
    if (vs.kind === "power" && (!vs.got || fix) && vs.dice.length) op.def = { f: a.to, r: vs.dice.map((s, j) => ({ d: s, v: pick(s, `def-${j}`, vs.got?.[j]?.v) })) };
    if (vs.kind === "roll" && (!vs.got || fix) && vs.dice.length) op.vr = vs.dice.map((s, j) => ({ d: s, v: pick(s, `vr-${j}`, vs.got?.[j]?.v) }));
    if (vs.kind === "act") {
      const b = gm ? vs.act : t.acts.find((x) => x.by === a.stops);
      if (b && (!b.r || fix)) {
        const bp = gm ? partsFor(doc, b) : b.parts;
        op.at = bp.map((p, i) => p.dice.map((s, j) => ({ d: s, v: pick(s, `at-${i}-${j}`, b.r?.[i]?.[j]?.v) })));
      }
    }
    return op;
  }

  // ------------------------------------------------------------ the outcomes

  // Putting what it did on the cards, a die at a time, once it's won or
  // happens with no roll.
  function outcomes(id, doc, c) {
    const a = c.a;
    const out = [];
    if (!c.res) return out;
    const kind = a.what === "out" ? a.out : a.what;
    c.res.parts.forEach((p, i) => {
      if (a.put[i]) {
        out.push(`<p class="wt-put"><span class="chip sm pt-chip is-on">On the cards</span>${c.parts.length > 1 ? ` <small>${i ? "the second die" : "the first die"}</small>` : ""} <button type="button" class="pt-reword" data-act="w" data-do="t-put" data-by="${esc(a.by)}" data-p="${i}" data-v="0">Not yet</button></p>`);
        return;
      }
      if (i === 1 && a.p2 === "quiet" && needsPut(a, i, p.st)) out.push(knowsForm(id, doc, c, i));
      else if (i === 1 && needsPut(a, i, p.st)) out.push(`<p class="cc-small">${esc(cap(a.p2text || "The second thing"))}: put that on the cards yourself.</p>${leave(a, i, "Done")}`);
      else if (i === 0 && (needsPut(a, i, p.st) || ((p.st === "won" || p.st === "free") && ["comes", "work", "else"].includes(kind)))) out.push(outcomeFor(id, doc, c));
    });
    // What happens when an agenda climbs past d12.
    const ag = agendaOf(doc, a);
    if (ag?.done && (a.what === "agenda")) out.push(happened(id, doc, find(doc, a.by), ag));
    return out;
  }

  const leave = (a, i, label) => `<div class="cc-row wt-outs"><button type="button" class="button sm" data-act="w" data-do="t-put" data-by="${esc(a.by)}" data-p="${i}" data-v="1">${esc(label)}</button></div>`;

  // The die that kept its name out of it lost: the target knows exactly who did it.
  function knowsForm(id, doc, c, i) {
    const a = c.a;
    const target = find(doc, a.to);
    if (!target) return leave(a, i, "Done");
    const suggest = c.thing ? `Took our ${c.thing.text}` : a.out ? `${a.out === "Destroy" ? "Wrecked" : a.out === "Acquire" ? "Took" : a.out === "Undermine" ? "Turned our people" : "Came at"} us` : "";
    return `<form class="cc-form pt-form wt-out" data-form="w-tknow" data-by="${esc(a.by)}" data-p="${i}">
      <p>${esc(target.name)} knows exactly who did it, so it writes a hostile thread toward ${a.by === "crew" ? "the crew" : esc(lower(c.byName))}.</p>
      <label class="cc-field">Its thread <input name="text" maxlength="120" autocomplete="off" value="${esc(suggest)}"></label>
      <div class="cc-row"><button type="submit" class="button sm primary">Write it</button><button type="button" class="button sm" data-act="w" data-do="t-put" data-by="${esc(a.by)}" data-p="${i}" data-v="1">Leave it</button></div></form>`;
  }

  // What a won outcome does to the cards.
  function outcomeFor(id, doc, c) {
    const a = c.a;
    const target = find(doc, a.to);
    const by = a.by;
    const done = (label = "Leave it") => `<button type="button" class="button sm" data-act="w" data-do="t-put" data-by="${esc(by)}" data-p="0" data-v="1">${label}</button>`;
    const kind = a.what === "out" ? a.out : a.what;
    if (kind === "agenda") {
      const ag = agendaOf(doc, a);
      return ag ? `<div class="cc-row wt-outs"><button type="button" class="button sm primary" data-act="w" data-do="t-climb" data-by="${esc(by)}">${ag.die >= 12 ? "It happens" : `It climbs to d${ag.die + 2}`}</button>${done()}</div>` : `<div class="cc-row wt-outs">${done("Done")}</div>`;
    }
    if (kind === "back") {
      const ag = agendaOf(doc, a);
      return ag ? `<div class="cc-row wt-outs"><button type="button" class="button sm primary" data-act="w" data-do="t-back" data-by="${esc(by)}">${ag.done ? "It hasn’t happened yet" : ag.die > 2 ? `It steps back to d${ag.die - 2}` : "It’s at d2 already"}</button>${done()}</div>` : `<div class="cc-row wt-outs">${done("Done")}</div>`;
    }
    if (kind === "new") {
      const f = find(doc, by);
      return f && f.agendas.length < 2 ? `<div class="cc-row wt-outs"><button type="button" class="button sm primary" data-act="w" data-do="t-newag" data-by="${esc(by)}">Write it on its card, at d${a.nd}</button>${done()}</div>` : `<p class="cc-small">It’s got two agendas on the go already. Take one off its card first.</p><div class="cc-row wt-outs">${done()}</div>`;
    }
    if (kind === "comes") return `<p class="cc-small">It happens next session, unless something stops it first. Bring it to the table.</p>`;
    if (kind === "work") return `<p class="cc-small">${esc(c.toName)} gives the crew a job, a scene next session. Do it, and it writes a bond thread toward the crew and pays: a purse of gold each, a favour, or for a big job, a resource.</p>`;
    if (kind === "else") return `<p class="cc-small">That’s rolled on the party sheet, or on the sheet of whoever’s doing it.</p>`;
    if (!target && kind !== "Establish") return `<div class="cc-row wt-outs">${done("Done")}</div>`;
    const actor = by === "crew" ? "the crew" : lower(c.byName);
    if (kind === "Destroy" || kind === "Acquire") {
      const things = ["res", "assets"].flatMap((l) => target[l].map((x) => ({ l, x })));
      const pick = a.thing && target[a.thing.l].some((x) => x.id === a.thing.lid) ? a.thing : things[0] ? { l: things[0].l, lid: things[0].x.id } : null;
      const hostile = ["pub", "mor", "loy"].flatMap((l) => target[l].filter((t) => t.kind === "hostile" && t.s === "whole"));
      return `<form class="cc-form pt-form wt-out" data-form="w-tout" data-by="${esc(by)}">
        <label class="cc-field">${kind === "Destroy" ? "Tick one off" : "Take"} <select name="thing">${things.map(({ l, x }) => `<option value="${l}:${esc(x.id)}"${pick?.lid === x.id ? " selected" : ""}>${esc(x.text)}${x.x > 1 ? ` (${x.left} of ${x.x} left)` : ""}</option>`).join("")}</select></label>
        ${hostile.length ? `<fieldset class="wt-checks"><legend>A hostile thread that fits ticks once more</legend>${hostile.map((t) => `<label class="pt-check"><input type="checkbox" name="hx-${esc(t.id)}"> <em>${esc(t.text)}</em></label>`).join("")}</fieldset>` : ""}
        <label class="pt-check"><input type="checkbox" name="knows"${a.split && a.p2 === "quiet" ? "" : " checked"}> ${esc(target.name)} knows who did it, so it writes a hostile thread toward ${esc(actor)}</label>
        <div class="cc-row"><button type="submit" class="button sm primary"${things.length ? "" : " disabled"}>${kind === "Destroy" ? "Put it on the card" : `It’s ${by === "crew" ? "the crew’s" : "theirs"} when the ticks run out`}</button>${done()}</div></form>`;
    }
    if (kind === "Undermine") {
      const whole = ["pub", "mor", "loy"].flatMap((l) => target[l].filter((t) => t.kind === "bond" && t.s === "whole").map((t) => ({ l, t })));
      return `<div class="wt-out"><p class="cc-small">Strain one of ${esc(poss(lower(target.name)))} bond threads, or write a hostile one.</p>
        ${whole.length ? `<ul class="pt-lines">${whole.map(({ l, t }) => `<li class="pt-line"><div class="pt-line-in"><p><em>${esc(t.text)}</em> <small>${BONDS.find((b) => b[0] === l)[1]}</small></p></div><button type="button" class="button sm" data-act="w" data-do="t-strain" data-by="${esc(by)}" data-l="${l}" data-lid="${esc(t.id)}">Strain it</button></li>`).join("")}</ul>` : ""}
        <form class="cc-form pt-form" data-form="w-tbond" data-by="${esc(by)}" data-kind="hostile"><label class="cc-field">On its <select name="l">${BONDS.map(([l, n]) => `<option value="${l}">${n}</option>`).join("")}</select></label>
        <label class="cc-field">A hostile thread <input name="text" maxlength="120" autocomplete="off"></label><div class="cc-row"><button type="submit" class="button sm">Write it</button>${done()}</div></form></div>`;
    }
    if (kind === "Influence") {
      const strained = [...["pub", "mor", "loy"].flatMap((l) => target[l].filter((t) => t.s === "strained" && t.kind === "bond").map((t) => ({ l, t }))), ...target.threads.filter((t) => t.to === by && t.s === "strained" && t.kind === "bond").map((t) => ({ l: "threads", t }))];
      return `<div class="wt-out"><p class="cc-small">${esc(target.name)} writes a bond thread, or mends a strained one.</p>
        ${strained.length ? `<ul class="pt-lines">${strained.map(({ l, t }) => `<li class="pt-line"><div class="pt-line-in"><p><em>${esc(t.text)}</em></p></div><button type="button" class="button sm" data-act="w" data-do="t-mend" data-by="${esc(by)}" data-l="${l}" data-lid="${esc(t.id)}">Mend it</button></li>`).join("")}</ul>` : ""}
        <form class="cc-form pt-form" data-form="w-tbond" data-by="${esc(by)}" data-kind="bond"><label class="cc-field">Where <select name="l"><option value="threads">Toward ${esc(actor)}</option>${BONDS.map(([l, n]) => `<option value="${l}">On its ${n}</option>`).join("")}</select></label>
        <label class="cc-field">A bond thread <input name="text" maxlength="120" autocomplete="off"></label><div class="cc-row"><button type="submit" class="button sm">Write it</button>${done()}</div></form></div>`;
    }
    if (kind === "Establish" && by === "crew") return crewEstablish(id, doc, c);
    if (kind === "Establish") {
      return `<form class="cc-form pt-form wt-out" data-form="w-tbuild" data-by="${esc(by)}">
        <label class="cc-field">It adds <select name="l"><option value="assets">An asset, with an extra resource paying for it</option><option value="res">A resource, from somewhere in the story</option></select></label>
        <label class="cc-field">What it is <input name="text" maxlength="60" autocomplete="off" value="${esc(a.about ?? "")}"></label>
        <label class="cc-field">What it does, for an asset <input name="does" maxlength="240" autocomplete="off"></label>
        <label class="pt-check"><input type="checkbox" name="power"> It adds Power (people who turn up when it calls)</label>
        <div class="cc-row"><button type="submit" class="button sm primary">Put it on its card</button>${done()}</div>
        <p class="cc-small">A mini faction’s made on its card, under Mini factions.</p></form>`;
    }
    return `<div class="cc-row wt-outs">${done("Done")}</div>`;
  }

  // The crew's Establish: something on the party sheet, or a mini faction of
  // its own, handed one of its resources and one of its assets.
  function crewEstablish(id, doc, c) {
    const me = crew(id);
    const opt = (x) => `<option value="${esc(x.id)}">${esc(x.text)}</option>`;
    const minis = doc.factions.filter((f) => f.mini && f.parent === "crew").length;
    return `<div class="wt-out">
      <form class="cc-form pt-form" data-form="w-tcbuild" data-by="crew"><p class="cc-small">On the party sheet: a new asset with an extra resource paying for it, or one the crew’s lost, built back.</p>
        <label class="cc-field">It adds <select name="l"><option value="assets">An asset</option><option value="res">A resource the crew’s lost, built back</option></select></label>
        <label class="cc-field">What it is <input name="text" maxlength="60" autocomplete="off" value="${esc(c.a.about ?? "")}"></label>
        <label class="cc-field">What it does, for an asset <input name="does" maxlength="240" autocomplete="off"></label>
        <label class="pt-check"><input type="checkbox" name="power"> It adds Power</label>
        <div class="cc-row"><button type="submit" class="button sm primary">Put it on the party sheet</button></div></form>
      ${minis < 3 ? `<form class="cc-form pt-form" data-form="w-tcmini" data-by="crew"><p class="cc-small">Or a mini faction of the crew’s own. The crew hands it one of its resources and one of its assets, and it takes its own action from the next downtime.</p>
        <label class="cc-field">Its name <input name="name" maxlength="60" autocomplete="off" placeholder="like The Kittiwake’s Lads"></label>
        <label class="cc-field">The resource it’s handed <select name="res">${me.res.map(opt).join("")}</select></label>
        <label class="cc-field">The asset it’s handed <select name="asset">${me.list.map((x) => `<option value="${esc(x.id)}">${esc(x.text)}${x.power ? " (+1 Power)" : ""}</option>`).join("")}</select></label>
        <fieldset class="wb-outs"><legend>The two outcomes it can do</legend>${OUTCOMES.map((o) => `<label class="pt-check"><input type="checkbox" name="out-${o}"> ${o}</label>`).join("")}</fieldset>
        <label class="cc-field">Its Loyalty thread toward the crew <input name="loy" maxlength="120" autocomplete="off" placeholder="like We owe the crew our boat"></label>
        <div class="cc-row"><button type="submit" class="button sm">Make it</button></div></form>` : '<p class="cc-small">The crew’s got three mini factions, which is as many as it can make.</p>'}
      <div class="cc-row wt-outs"><button type="button" class="button sm" data-act="w" data-do="t-put" data-by="crew" data-p="0" data-v="1">Leave it</button></div></div>`;
  }

  // Past d12, it happens: the world changes (a line on the party sheet), the
  // faction grows, and it writes a new agenda.
  function happened(id, doc, f, ag) {
    if (!f) return "";
    return `<div class="wt-happened cc-note is-warn"><p><b>${esc(ag.text)} has happened.</b></p>
      <form class="cc-form pt-form" data-form="w-tchanged" data-f="${esc(f.id)}"><label class="cc-field">How the world’s changed, in one sentence <input name="text" maxlength="160" autocomplete="off" value="${esc(ag.then ?? "")}"></label>
        <div class="cc-row"><button type="submit" class="button sm primary">Write it on the party sheet</button></div></form>
      <p class="cc-small">Then ${esc(lower(f.name))} grows (a new asset or resource on its card, and a new asset needs something paying for it), and writes a new agenda. Both are on its card.</p>
      <a class="pt-reword" href="/characters/?camp=${encodeURIComponent(id)}&amp;world&amp;f=${encodeURIComponent(f.id)}" data-act="w" data-do="nav">Open ${esc(f.name)}</a></div>`;
  }

  // ------------------------------------------------------------ taps

  const ACT = {
    "t-start"(el, id) {
      const doc = w.docOf(id);
      tu = { editing: "", draft: null, sure: "", d6: null, real: "" };
      w.edit(id, [{ o: "t-start", id: newId() }], `Downtime ${(doc.turn?.n ?? 0) + 1}’s faction turn has started. Hiring comes first.`);
    },
    "t-step"(el, id) {
      const doc = w.docOf(id);
      const t = doc.turn;
      if (!t) return;
      const v = el.dataset.v;
      const sureKey = v === "tele" ? "send" : v === "land" ? "land" : v === "done" ? "done" : "";
      // A second tap when something's missing: factions with no action, the
      // crew with none, or results still to go on the cards.
      const missing = v === "tele" ? actorsOf(doc).some((f) => !t.acts.some((a) => a.by === f.id)) : v === "land" ? !t.acts.some((a) => a.by === "crew") : v === "done" ? pendingIn(doc) : false;
      if (sureKey && missing && tu.sure !== sureKey) {
        tu.sure = sureKey;
        return d.render();
      }
      tu.sure = "";
      tu.editing = "";
      tu.draft = null;
      const ops = [{ o: "t-step", id: t.id, v }];
      // Sending the telegraphs shows the crew every faction named in one.
      if (v === "tele") for (const x of new Set(t.acts.filter((a) => a.by !== "crew" && a.shown).flatMap((a) => [a.by, a.to]).filter(Boolean))) if (find(doc, x) && !find(doc, x).shown.card) ops.push({ o: "show", id: x, p: "card", v: true });
      const say = { hire: "Back to hiring.", tele: "The telegraphs are on the crew’s phones. The crew picks its action now.", land: "The actions land. Obstructs first, then the rest.", done: `That’s downtime ${t.n} done.` }[v];
      w.edit(id, ops, say);
    },
    "t-edit"(el, id) {
      tu.editing = el.dataset.k;
      tu.draft = null;
      tu.d6 = null;
      d.render();
      requestAnimationFrame(() => document.querySelector("#app .wt-form select, #app .wt-form input")?.focus());
    },
    "t-cancel"() {
      tu.editing = "";
      tu.draft = null;
      tu.d6 = null;
      d.render();
    },
    "t-unact"(el, id) {
      const t = w.docOf(id).turn;
      if (!t) return;
      tu.editing = "";
      tu.draft = null;
      const by = el.dataset.f;
      w.edit(id, [{ o: "t-unact", id: t.id, by }], by === "crew" ? "The crew’s action is off." : "It does nothing this downtime.");
    },
    "t-unhire"(el, id) {
      const t = w.docOf(id).turn;
      if (t) w.edit(id, [{ o: "t-unhire", id: t.id, hid: el.dataset.h }], "That hire’s taken back.");
    },
    // Roll for it: the book's d6, when she doesn't know what a faction does.
    "t-d6"(el, id) {
      const doc = w.docOf(id);
      const f = find(doc, el.dataset.f);
      const form = el.closest("form");
      if (!f || !form) return;
      readFaction(form, doc);
      const r = rollDie(6);
      const row = r <= 2 ? 0 : r - 2;
      tu.d6 = { f: f.id, r, row };
      const v = tu.draft.v;
      const ag = f.agendas.find((x) => !x.done);
      const extra = Math.max(0, f.res.length - f.assets.filter((x) => !x.off).length) - doc.turn.hires.filter((h) => h.by === f.id).length;
      const pick = row === 0 ? (ag ? "agenda" : "new") : row === 1 ? (f.agendas.length === 1 ? "new" : "Establish") : row === 2 ? "Destroy" : row === 3 ? "comes" : extra > 0 ? "" : "Acquire";
      if (pick === "agenda") Object.assign(v, { what: "agenda", ag: ag.id, out: null, vs: "agenda", to: null });
      else if (pick === "new" || pick === "comes") Object.assign(v, { what: pick, out: null, vs: "none", to: null });
      else if (pick) Object.assign(v, { what: "out", out: pick, vs: VS[pick][0], to: pick === "Establish" ? null : v.to ?? doc.factions.find((x) => x.id !== f.id)?.id ?? null });
      d.render();
    },
    "t-roll"(el, id) {
      const doc = w.docOf(id);
      const gm = w.isGm(id);
      const a = doc.turn?.acts.find((x) => x.by === el.dataset.by);
      if (!a) return;
      const c = cardOf(id, doc, a, gm, gm ? resultsOf(doc) : resultsMine(doc.turn));
      w.edit(id, [rollOp(doc, c, gm)], a.by === "crew" ? "The crew’s rolled." : `${c.byName} rolled.`, { undoable: false });
    },
    "t-rollall"(el, id) {
      const doc = w.docOf(id);
      const t = doc.turn;
      if (!t) return;
      const res = resultsOf(doc);
      const ops = [];
      // One at a time, so a Power rolled once stands for everyone after.
      const test = structuredClone(doc);
      for (const a of ordered(doc, t.acts, true)) {
        if (a.by === "crew" || a.shown === false) continue;
        const ta = test.turn.acts.find((x) => x.by === a.by);
        if (ta.r) continue;
        const vs = againstOf(test, ta);
        if (vs.kind === "none" && !t.acts.some((o) => o.vs === "act" && o.to === a.by)) continue;
        const op = rollOp(test, cardOf(id, test, ta, true, res), true);
        ops.push(op);
        // Put it on the copy, so the next one sees what's been rolled.
        ta.r = op.r;
        if (op.def && !test.turn.def[op.def.f]) test.turn.def[op.def.f] = op.def.r;
        if (op.vr) ta.vr = op.vr;
        if (op.at && vs.act) test.turn.acts.find((x) => x.by === vs.act.by).r = op.at;
      }
      if (!ops.length) return d.toast("The factions’ dice are rolled.", false);
      w.edit(id, ops, `${plural(ops.length, "faction’s", "factions’")} dice rolled.`, { undoable: false });
    },
    "t-real"(el) {
      tu.real = el.dataset.by ? `real:${el.dataset.by}` : "";
      d.render();
      requestAnimationFrame(() => document.querySelector("#app .wt-real select")?.focus());
    },
    "t-again"(el, id) {
      const doc = w.docOf(id);
      const gm = w.isGm(id);
      const a = doc.turn?.acts.find((x) => x.by === "crew");
      if (!a) return;
      const parts = gm ? partsFor(doc, a) : a.parts;
      w.edit(id, [{ o: "t-roll", id: doc.turn.id, by: "crew", again: true, r: parts.map((p) => p.dice.map((s) => ({ d: s, v: rollDie(s) }))) }], "Rolled again, for 1 Resolve. Take it off whoever rolled’s sheet.", { undoable: false });
    },
    "t-tie"(el, id) {
      const t = w.docOf(id).turn;
      if (t) w.edit(id, [{ o: "t-tie", id: t.id, p: Number(el.dataset.p) || 0, v: true }], "The crew takes the tie, with an extra resource.");
    },
    "t-put"(el, id) {
      const t = w.docOf(id).turn;
      if (t) w.edit(id, [{ o: "t-put", id: t.id, by: el.dataset.by, p: Number(el.dataset.p) || 0, v: el.dataset.v === "1" }], el.dataset.v === "1" ? "Done." : "Not on the cards yet.");
    },
    "t-climb"(el, id) {
      const doc = w.docOf(id);
      const a = doc.turn?.acts.find((x) => x.by === el.dataset.by);
      const ag = a && agendaOf(doc, a);
      if (!ag) return;
      w.edit(id, [{ o: "climb", id: a.by, lid: ag.id, by: 1 }, { o: "t-put", id: doc.turn.id, by: a.by, p: 0, v: true }], ag.die >= 12 ? `${bare(ag.text)} has happened.` : `${bare(ag.text)} climbs to d${ag.die + 2}.`);
    },
    "t-back"(el, id) {
      const doc = w.docOf(id);
      const a = doc.turn?.acts.find((x) => x.by === "crew");
      const ag = a && agendaOf(doc, a);
      if (!ag) return;
      w.edit(id, [{ o: "climb", id: a.to, lid: ag.id, by: -1 }, { o: "t-put", id: doc.turn.id, by: "crew", p: 0, v: true }], `${bare(ag.text)} steps back down.`);
    },
    "t-newag"(el, id) {
      const doc = w.docOf(id);
      const a = doc.turn?.acts.find((x) => x.by === el.dataset.by);
      if (!a || a.what !== "new") return;
      w.edit(id, [{ o: "add", id: a.by, l: "agendas", item: { id: newId(), text: a.nt, die: a.nd, done: false, then: "" } }, { o: "t-put", id: doc.turn.id, by: a.by, p: 0, v: true }], `${bare(a.nt)} is on its card, at d${a.nd}.`);
    },
    "t-strain"(el, id) {
      const doc = w.docOf(id);
      const a = doc.turn?.acts.find((x) => x.by === el.dataset.by);
      if (!a) return;
      w.edit(id, [{ o: "edit", id: a.to, l: el.dataset.l, lid: el.dataset.lid, f: "s", v: "strained" }, { o: "t-put", id: doc.turn.id, by: a.by, p: 0, v: true }], "Strained. It stops counting till it’s mended.");
    },
    "t-mend"(el, id) {
      const doc = w.docOf(id);
      const a = doc.turn?.acts.find((x) => x.by === el.dataset.by);
      if (!a) return;
      w.edit(id, [{ o: "edit", id: a.to, l: el.dataset.l, lid: el.dataset.lid, f: "s", v: "whole" }, { o: "t-put", id: doc.turn.id, by: a.by, p: 0, v: true }], "Mended.");
    },
  };

  function act(el, id, e) {
    const fn = ACT[el.dataset.do];
    if (!fn) return false;
    fn(el, id, e);
    return true;
  }

  // ------------------------------------------------------------ forms

  function submit(kind, form, f, id) {
    const doc = w.docOf(id);
    const t = doc.turn;
    if (!t) return d.render();
    const text = (name, max = 120) => String(f.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const a = form.dataset.by ? t.acts.find((x) => x.by === form.dataset.by) : null;
    if (kind === "w-tact") {
      const v = readFaction(form, doc);
      const fac = find(doc, form.dataset.f);
      if (!v || !fac) return d.render();
      if (v.what === "new" && !v.nt.trim()) return d.toast("Write its new agenda first.", false);
      const act = actFromDraft(doc, v);
      if (act.what === "comes") {
        const had = t.acts.find((x) => x.by === fac.id);
        act.table = had?.what === "comes" && had.table ? had.table : comesTable(doc, fac);
      }
      tu.editing = "";
      tu.draft = null;
      tu.d6 = null;
      w.edit(id, [{ o: "t-act", id: t.id, a: act }], `${bare(fac.name)}’s action is ready${act.shown ? `, and it’ll be telegraphed${t.step === "tele" ? " now" : " when you send them"}` : ", off-screen"}.`);
      return;
    }
    if (kind === "w-tcrew") {
      const v = readCrew(form, id, doc);
      if (!v) return d.render();
      if (v.what === "else" && !(v.text ?? "").trim()) return d.toast("Say what the crew’s doing first.", false);
      const act = crewFromDraft(id, doc, v);
      tu.editing = "";
      tu.draft = null;
      w.edit(id, [{ o: "t-act", id: t.id, a: act }], "That’s the crew’s action. Everyone in the campaign can see it.");
      return;
    }
    if (kind === "w-thire") {
      const to = String(f.get("to") ?? "");
      const by = form.dataset.by === "faction" ? String(f.get("by") ?? "") : "crew";
      if (!to || !by) return d.render();
      const name = nameIn(id, doc, to);
      w.edit(id, [{ o: "t-hire", id: t.id, h: { id: newId(), by, to, text: text("text", 140) } }], by === "crew" ? `The crew’s paying ${bare(name)}, with an extra resource.` : `${bare(nameIn(id, doc, by))} is paying ${bare(name)}.`);
      return;
    }
    if (kind === "w-treal") {
      if (!a) return d.render();
      const gm = w.isGm(id);
      const c = cardOf(id, doc, a, gm, gm ? resultsOf(doc) : resultsMine(t));
      const op = rollOp(doc, c, gm, (s, k, had) => Math.min(s, Math.max(1, Number(f.get(k)) || had || 1)), gm && Boolean(a.r));
      op.real = true;
      tu.real = "";
      w.edit(id, [op], "In, as they came up.", { undoable: false });
      return;
    }
    if (!w.isGm(id)) return d.render();
    if (kind === "w-tout" && a) {
      const target = find(doc, a.to);
      const [l, lid] = String(f.get("thing") ?? "").split(":");
      const item = target?.[l]?.find((x) => x.id === lid);
      if (!item) return d.render();
      const hostile = ["pub", "mor", "loy"].flatMap((g) => target[g]).filter((x) => f.get(`hx-${x.id}`) === "on").length;
      const ticks = 1 + hostile;
      const acquire = a.out === "Acquire";
      const gone = ticks >= item.left;
      // The ticks, a win at a time, and the last one takes it off the card,
      // or, for Acquire, hands it over, multiplier and all.
      const ops2 = [];
      if (gone && acquire && a.by !== "crew") ops2.push({ o: "move", id: target.id, l, lid, to: a.by, full: true });
      else for (let i = 0; i < Math.min(ticks, item.left); i++) ops2.push({ o: "tick", id: target.id, l, lid });
      if (f.get("knows") === "on") ops2.push({ o: "add", id: target.id, l: "threads", item: { id: newId(), text: acquire ? `Took our ${item.text}` : `Wrecked our ${item.text}`, kind: "hostile", s: "whole", to: a.by } });
      ops2.push({ o: "t-put", id: t.id, by: a.by, p: 0, v: true });
      // The crew taking it: it goes on the party sheet, and off the faction's card.
      let party = null;
      if (acquire && a.by === "crew" && gone) party = [{ o: "add", l: l === "assets" ? "assets" : "res", item: l === "assets" ? { id: newId(), text: item.text.slice(0, 60), does: item.does ?? "", power: item.power === true } : { id: newId(), text: item.text.slice(0, 120) } }];
      w.edit(id, ops2, gone ? (acquire ? `${bare(item.text)} ${a.by === "crew" ? "is the crew’s now, on the party sheet" : `is ${poss(bare(nameIn(id, doc, a.by)))} now`}.` : `${bare(item.text)} is gone.`) : `${ticks === 1 ? "One win" : `${words(ticks)} wins`} ticked off ${bare(item.text)}.`, { party });
      return;
    }
    if (kind === "w-tknow" && a) {
      const words2 = text("text");
      if (!words2) return d.toast("Write its thread first, or leave it.", false);
      w.edit(id, [{ o: "add", id: a.to, l: "threads", item: { id: newId(), text: bare(words2), kind: "hostile", s: "whole", to: a.by } }, { o: "t-put", id: t.id, by: a.by, p: Number(form.dataset.p) || 1, v: true }], `${bare(nameIn(id, doc, a.to))} knows who did it.`);
      return;
    }
    if (kind === "w-tbond" && a) {
      const l = String(f.get("l") ?? "");
      const words2 = text("text");
      if (!words2) return d.toast("Write the thread first.", false);
      if (!["pub", "mor", "loy", "threads"].includes(l)) return d.render();
      const item = { id: newId(), text: bare(words2), kind: form.dataset.kind === "hostile" ? "hostile" : "bond", s: "whole", ...(l === "threads" ? { to: a.by } : {}) };
      w.edit(id, [{ o: "add", id: a.to, l, item }, { o: "t-put", id: t.id, by: a.by, p: 0, v: true }], "Written on its card.");
      return;
    }
    if (kind === "w-tbuild" && a) {
      const l = f.get("l") === "res" ? "res" : "assets";
      const words2 = text("text", 60);
      if (!words2) return d.toast("Say what it is first.", false);
      const item = l === "res" ? { id: newId(), text: bare(words2), x: 1, left: 1 } : { id: newId(), text: bare(words2), does: text("does", 240), power: f.get("power") === "on", x: 1, left: 1, off: false };
      w.edit(id, [{ o: "add", id: a.by, l, item }, { o: "t-put", id: t.id, by: a.by, p: 0, v: true }], `${bare(words2)} is on its card.`);
      return;
    }
    if (kind === "w-tcbuild") {
      const l = f.get("l") === "res" ? "res" : "assets";
      const words2 = text("text", 60);
      if (!words2) return d.toast("Say what it is first.", false);
      const item = l === "res" ? { id: newId(), text: bare(words2) } : { id: newId(), text: bare(words2), does: text("does", 240), power: f.get("power") === "on" };
      w.edit(id, [{ o: "t-put", id: t.id, by: "crew", p: 0, v: true }], `${bare(words2)} is on the party sheet.`, { party: [{ o: "add", l, item }] });
      return;
    }
    if (kind === "w-tcmini") {
      const name = text("name", 60);
      if (!name) return d.toast("Give the mini faction a name first.", false);
      const outs = OUTCOMES.filter((o) => f.get(`out-${o}`) === "on");
      if (outs.length !== 2) return d.toast("Pick two of the six outcomes for it, and only two.", false);
      const me = crew(id);
      const res = me.res.find((x) => x.id === f.get("res"));
      const asset = me.list.find((x) => x.id === f.get("asset"));
      if (!res || !asset) return d.toast("The crew hands it one of its resources and one of its assets.", false);
      const loy = text("loy");
      const mid = newId();
      w.edit(id, [{ o: "new", f: {
        id: mid, name: bare(name), about: "A mini faction of the crew’s own.", want: "", face: "", secret: "", more: "", mini: true, parent: "crew", outs, born: t.n,
        res: [{ id: newId(), text: res.text.slice(0, 60), x: 1, left: 1 }], assets: [{ id: newId(), text: asset.text.slice(0, 60), does: asset.does ?? "", power: asset.power === true, x: 1, left: 1, off: false }],
        agendas: [], pub: [], mor: [], loy: loy ? [{ id: newId(), text: bare(loy), kind: "bond", s: "whole" }] : [], threads: [], shown: { card: true },
      } }, { o: "t-put", id: t.id, by: "crew", p: 0, v: true }], `${bare(name)} is the crew’s own now, under its card on the board. It sits out this downtime, and acts from the next.`, { party: [{ o: "drop", l: "res", id: res.id }, { o: "drop", l: "assets", id: asset.id }] });
      return;
    }
    if (kind === "w-tchanged") {
      const words2 = text("text", 160);
      if (!words2) return d.toast("Say how the world’s changed first.", false);
      w.party(id, [{ o: "add", l: "changed", item: { id: newId(), text: words2 } }], "It’s on the party sheet, under What has changed.");
      return;
    }
    d.render();
  }

  // A form that changes as it's filled in: what's picked decides what it asks next.
  function change(el, id) {
    const form = el.closest("form[data-form]");
    if (!form || !["w-tact", "w-tcrew"].includes(form.dataset.form)) return false;
    const doc = w.docOf(id);
    if (!doc.turn) return false;
    if (form.dataset.form === "w-tact") readFaction(form, doc);
    else readCrew(form, id, doc);
    // Text fields don't change what's asked, so typing's left alone.
    if (el.tagName === "INPUT" && (el.type === "text" || !el.type)) return true;
    const name = el.name;
    const f = form.dataset.form === "w-tact" ? find(doc, form.dataset.f) : null;
    const html = form.dataset.form === "w-tact" ? (f ? factionForm(id, doc, f) : "") : crewForm(id, doc, w.isGm(id));
    if (!html) return true;
    form.outerHTML = html;
    requestAnimationFrame(() => document.querySelector(`#app form[data-form="${form.dataset.form}"] [name="${CSS.escape(name)}"]${el.type === "radio" ? `[value="${CSS.escape(el.value)}"]` : ""}`)?.focus());
    return true;
  }

  // A line for the campaign's page while a turn's going.
  function glance(id) {
    const t = w.docOf(id).turn;
    if (!t || t.step === "done") return "";
    return t.step === "hire" ? `Downtime ${t.n}’s faction turn: hiring.` : t.step === "tele" ? `Downtime ${t.n}’s faction turn: the telegraphs are out.` : `Downtime ${t.n}’s faction turn: the actions are landing.`;
  }

  return {
    section,
    act,
    submit,
    change,
    glance,
    reset() {
      tu = { editing: "", draft: null, sure: "", d6: null, real: "" };
    },
  };
}
