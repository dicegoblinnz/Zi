// The dice roller, off the play screen and the Characters list: any dice of
// yours against any of theirs, with no telegraph or threat to set up. Tap the
// dice onto each side, say who's going at who, and they all roll together,
// on the phone or as real dice tapped in. A throw can be more than one action
// (Mo's 14 Nov ask), each with its own dice of yours, theirs and who's going
// at who, like your d12 and d8 at the brute's d10, your d6 at the archer's d4
// and their d8 coming at you. The action being set up is open and the rest
// fold into a line each, so one action looks the way the roller always has.
// roller-rules.js reads it: each action on its own (what beat what, what's
// stopped and what gets through, matched so the most get stopped, with a
// swap), and the Aura from every win and top face added up across them. It's
// only dice, so it never touches a character, and the set-up's kept on the
// phone as zi-dice for next time. What it's for and how it reads sit behind
// question bubbles (tip.js), so they don't take up the screen.
import { ACTIONS, MOST, SIDES, hasDice, readDice, readLanes, setupOf, swapped } from "./roller-rules.js";
import { diceLabel } from "./dice.js";
import { tip } from "./tip.js";
import { die as kitDie, inline } from "../kit/kit.js";

const KEY = "zi-dice";
const WORDS = { beat: "Beat it", tie: "Tie", under: "Under", stopped: "Stopped", through: "Gets through" };
const WHOSE = { you: ["Your", "yours"], them: ["Their", "theirs"] };
// How an action's read: in the head with one action, and on each action's
// own head with several.
const HOW = { act: "You’re going at them, so ties are theirs.", each: "Everyone defends on their own, and ties are theirs.", defend: "They’re coming at you, so ties are yours.", free: "Nothing to beat, so it’s just the numbers." };
const SHORT = { act: "You’re going at them.", each: "Everyone defends on their own.", defend: "They’re coming at you.", free: "Nothing to beat." };
const WAY = { them: "You’re going at them", you: "They’re coming at you" };

// The question bubbles' words.
const ABOUT = "Any dice you like, yours and theirs, all rolled together.";
const SHEET = " It’s only dice, so your sheet stays as it is.";
const MORE = " Add another action to go at more than one thing in the same throw, or to have something coming at you as well. Each action’s read on its own, and the Aura’s added up across them: 1 for every die of yours that wins and 1 for every top face.";
const WHO = "<b>You’re going at them:</b> each of your dice has to beat their roll, and a tie’s theirs unless you pay 1 Aura. When they’ve got more than one die, it’s one thing rolling them all, so their best one stands, the way a <em>Layered</em> threat’s does.<br><b>They’re coming at you:</b> each of your dice stops one of theirs it beats or ties, since ties are yours, and whatever’s left gets through.";
const EACH = "<b>One:</b> one thing’s rolling all their dice, so its best one stands, the way a <em>Layered</em> threat’s does.<br><b>Several:</b> everyone in your area or sweep defends on their own, a die each, against your one die, and whatever you beat, your intent happens to it.";
const MOVE = "That’s only if it’s a Move, the one roll where dice add. Anything else, each die counts on its own.";
const SWAP = "The phone’s matched your dice so the most get stopped. Tap Swap on two of theirs to trade the dice of yours on them.";

// k: esc, icon, throwDie, calm, tumble, feel, dialog, open (turns the dialog
// to a state), roll (the dialog's state), redraw (draws the dialog again,
// with what the dice did coming up once they've landed) and spinning (hands
// over a tumble's stop, so closing the dialog stops it).
export function makeRoller(k) {
  const { esc } = k;
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const off = (no) => (no ? " disabled" : "");
  const b = (dz, label, extra = "", cls = "button") => `<button type="button" class="${cls}" data-act="dz" data-dz="${dz}"${extra}>${label}</button>`;
  const sr = (text) => `<span class="sr-only">${esc(text)}</span>`;

  const load = () => {
    try {
      return setupOf(JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return setupOf(null);
    }
  };
  // The actions with dice on, or the one that's open when none have any, so
  // its way's kept.
  const keep = (r) => {
    const full = r.acts.filter(hasDice);
    try {
      localStorage.setItem(KEY, JSON.stringify({ acts: (full.length ? full : [r.acts[r.at]]).map(({ you, them, def, each }) => ({ you, them, def, each })) }));
    } catch {}
  };

  // from: "play" off a character's play screen, where the sheet's a tap
  // away, or "list" off the Characters list. acts are the actions, at the one
  // that's open, and thrown each action's dice once they're rolled.
  function open(from = "list") {
    k.open({ kind: "dice", mode: "set", from, acts: load().acts, at: 0, thrown: [], swap: null, spinning: false, real: false, fresh: null });
  }

  const many = (r) => r.acts.length > 1;
  const nameOf = (a) => `Action ${a + 1}`;
  const both = (x) => x.you.length > 0 && x.them.length > 0;
  // With one of yours against several of theirs, they could be one thing
  // rolling them all or several things defending on their own.
  const asksEach = (x) => x.def === "them" && x.you.length === 1 && x.them.length > 1;
  const said = (x) => (both(x) ? `${diceLabel(x.you)} against ${diceLabel(x.them)}`
    : x.you.length ? `${diceLabel(x.you)}, with nothing to beat`
    : x.them.length ? `Their ${diceLabel(x.them)}, with nothing of yours`
    : "No dice on yet.");
  const setSaid = (r) => (many(r) ? `${r.acts.length} actions, all rolled together.` : said(r.acts[0]));
  // The dice on one side as small tokens, two the same as one: d12 + 2d6.
  const tokens = (list, own) => {
    const sizes = [...new Set([...list].sort((p, q) => q - p))];
    return sizes.map((d) => {
      const n = list.filter((x) => x === d).length;
      return inline(d, { own, text: `${n > 1 ? n : ""}d${d}` });
    }).join(" + ");
  };

  // One side's dice, each tapped to take it off, and a die of every size to
  // tap one on.
  function side(r, a, who, h) {
    const [Whose, whose] = WHOSE[who];
    const list = r.acts[a][who];
    const id = `dz-${who}-${a}`;
    const fresh = r.fresh?.a === a && r.fresh.side === who ? r.fresh.i : -1;
    const at = ` data-a="${a}" data-side="${who}"`;
    const dice = list.map((d, i) => `<button type="button" class="dz-die${i === fresh ? " is-new" : ""}" data-act="dz" data-dz="off"${at} data-i="${i}" aria-label="${Whose} d${d}. Tap to take it off.">${kitDie(d, { own: who, hide: true })}</button>`).join("");
    const none = who === "you" ? "None yet. Tap a die below to put it on." : "None yet. Leave it empty when there’s nothing to beat.";
    return `<section class="dz-side is-${who}" aria-labelledby="${id}">
      <div class="dz-side-head"><${h} id="${id}">${who === "you" ? "Yours" : "Theirs"}</${h}>${list.length ? `<span class="dz-count">${esc(diceLabel(list))}</span>${b("clear", "Clear", `${at} aria-label="Clear ${whose}"`, "button sm dz-clear")}` : ""}</div>
      <div class="dz-tray">${dice || `<p class="dz-none">${none}</p>`}</div>
      <div class="dz-add" role="group" aria-label="Put a die on ${whose}">${SIDES.map((d) => `<button type="button" class="dz-adddie" data-act="dz" data-dz="add"${at} data-d="${d}" aria-label="Add a d${d} to ${whose}"${off(list.length >= MOST)}>${kitDie(d, { own: who, hide: true })}</button>`).join("")}</div>
    </section>`;
  }

  // Who's going at who, with how each way's read behind its bubble.
  function whoView(r, a, h) {
    const x = r.acts[a];
    if (!both(x)) return "";
    const at = ` data-a="${a}"`;
    const each = asksEach(x) ? `<${h} class="dz-q"><span id="dz-each-${a}">One target, or several?</span>${tip(`dz-each-${a}`, EACH, "What one and several mean")}</${h}>
      <div class="cc-chips" role="group" aria-labelledby="dz-each-${a}">${b("each", "One", `${at} data-v="0"${pressed(!x.each)}`, "cc-chipbtn")}${b("each", "Several", `${at} data-v="1"${pressed(x.each)}`, "cc-chipbtn")}</div>` : "";
    return `<fieldset class="cc-group dz-who" aria-labelledby="dz-who-${a}"><legend><span id="dz-who-${a}">Who’s going at who?</span>${tip(`dz-who-${a}`, WHO, "How each way’s read")}</legend>
      <div class="cc-chips">${b("def", WAY.them, `${at} data-v="them"${pressed(x.def === "them")}`, "cc-chipbtn")}${b("def", WAY.you, `${at} data-v="you"${pressed(x.def === "you")}`, "cc-chipbtn")}</div>
      ${each}</fieldset>`;
  }

  // The action being set up, whole. With several, it has its number and a
  // way to take it off.
  function openAct(r, a) {
    const several = many(r);
    const h = several ? "h4" : "h3";
    const head = several ? `<div class="dz-act-head"><h3 id="dz-act-${a}" tabindex="-1">${nameOf(a)}</h3>${b("drop", `Take it off${sr(`, ${nameOf(a)}`)}`, ` data-a="${a}"`, "button sm dz-drop")}</div>` : "";
    return `<section class="dz-act is-open"${several ? ` aria-labelledby="dz-act-${a}"` : ""}>${head}${side(r, a, "you", h)}${side(r, a, "them", h)}${whoView(r, a, h)}</section>`;
  }

  // Any other action, folded into a line that opens it in a tap.
  function shutAct(r, a) {
    const x = r.acts[a];
    const dice = both(x) ? `${tokens(x.you, "you")} <span class="dz-vs">against</span> ${tokens(x.them, "them")}`
      : x.you.length ? `${tokens(x.you, "you")}<span class="dz-sum-note">, nothing to beat</span>`
      : x.them.length ? `${tokens(x.them, "them")}<span class="dz-sum-note">, nothing of yours</span>`
      : '<span class="dz-sum-note">No dice yet</span>';
    const way = both(x) ? ` <span class="dz-sum-way">${asksEach(x) && x.each ? "Everyone defends on their own" : WAY[x.def]}</span>` : "";
    return `<section class="dz-act is-shut" aria-label="${nameOf(a)}">
      <button type="button" class="dz-sum" data-act="dz" data-dz="pick" data-a="${a}"><span class="dz-sum-n">${nameOf(a)}</span> <span class="dz-sum-dice">${dice}</span>${way}</button>
      ${b("drop", `${k.icon.close}${sr(`Take ${nameOf(a).toLowerCase()} off`)}`, ` data-a="${a}"`, "cc-x dz-drop")}
    </section>`;
  }

  function setView(r) {
    const none = !r.acts.some(hasDice);
    const full = r.acts.length >= ACTIONS;
    return `<div class="dlg-head"><div class="cc-live"><div class="dz-title"><h2 id="dlg-title">Dice roller</h2>${tip("dz-about", `${ABOUT}${r.from === "play" ? SHEET : ""}${MORE}`, "What the dice roller does")}</div><p class="cc-small">${esc(setSaid(r))}</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button></div>
    <div class="dlg-body dz${many(r) ? " is-many" : ""}">
      ${r.acts.map((_, a) => (a === r.at ? openAct(r, a) : shutAct(r, a))).join("")}
      <div class="dz-moreline">${b("more", `<span aria-hidden="true">+</span> Add another action`, off(full || !hasDice(r.acts[r.at])), "button dz-more")}${full ? `<p class="cc-small">That’s ${ACTIONS}, the most a throw holds.</p>` : ""}</div>
    </div>
    <div class="dlg-foot">${b("go", "Roll", off(none), "button primary")}${b("real", "Roll real dice", off(none))}</div>`;
  }

  // Real dice: tap in what each one came up, an action at a time when
  // there's more than one.
  function padView(r) {
    const name = (list, i, who) => {
      const same = list.filter((d) => d.size === list[i].size).length;
      const nth = list.slice(0, i + 1).filter((d) => d.size === list[i].size).length;
      return `${WHOSE[who][0]} d${list[i].size}${same > 1 ? ` (${nth} of ${same})` : ""}`;
    };
    const pad = (list, who, key, a) => list.map((d, i) => `<fieldset class="cc-pad is-${who}"><legend>${name(list, i, who)}</legend><div class="cc-nums">${Array.from({ length: d.size }, (_, j) => `<button type="button" class="cc-num" data-act="dz" data-dz="pad" data-a="${a}" data-k="${key}" data-i="${i}" data-v="${j + 1}"${pressed(d.v === j + 1)}>${j + 1}</button>`).join("")}</div></fieldset>`).join("");
    const pads = (t, a) => `${pad(t.mine, "you", "m", a)}${pad(t.theirs, "them", "t", a)}`;
    const body = r.thrown.length > 1
      ? `<div class="dz-pads">${r.thrown.map((t, a) => `<section class="dz-padact" aria-labelledby="dz-pad-${a}"><h3 id="dz-pad-${a}">${nameOf(a)}</h3>${pads(t, a)}</section>`).join("")}</div>`
      : pads(r.thrown[0], 0);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small">Roll them, then tap what each one came up.</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button></div>
    <div class="dlg-body">${body}</div>
    <div class="dlg-foot">${b("back", "Back")}${b("pad-done", "See how it went", off(!r.thrown.every(tapped)), "button primary")}</div>`;
  }
  const tapped = (t) => [...t.mine, ...t.theirs].every((d) => d.v > 0);

  // An action as it was thrown, the way roller-rules.js reads one.
  const laneOf = (r, a) => ({ mine: r.thrown[a].mine, theirs: r.thrown[a].theirs, def: r.acts[a].def, each: r.acts[a].each, assign: r.thrown[a].assign });

  // What an action's dice did, said once: a line to read at a glance (main),
  // a tie that's theirs unless you pay for it (note), and whether it's dice
  // added up, which only a Move does (move). One die says it under itself,
  // so it gets no line of its own.
  const ties = (n) => (n === 1 ? "One’s a tie, and it’s theirs unless you pay 1 Aura." : n ? `${n} are ties, and they’re theirs unless you pay 1 Aura each.` : "");
  function verdict(t, x) {
    if (x.way === "free") {
      const list = t.mine.length ? t.mine : t.theirs;
      return list.length === 1 ? { main: "", note: "", move: false } : { main: `Added up, ${x.total}.`, note: "", move: true };
    }
    if (x.way === "defend") {
      const n = x.lanes.length;
      const main = !x.through ? (n === 1 ? "It’s stopped." : `All ${n} stopped, so nothing gets through.`)
        : !x.stopped ? (n === 1 ? "It gets through." : `None stopped, so all ${n} get through.`)
        : `${x.stopped} stopped, and ${x.through === 1 ? "one gets" : `${x.through} get`} through.`;
      return { main, note: "", move: false };
    }
    if (x.way === "each") {
      const n = x.lanes.length;
      const v = t.mine[0].v;
      return { main: x.beat === n ? `Your ${v} beats all ${n} of them.` : x.beat ? `Your ${v} beats ${x.beat} of the ${n}.` : `Your ${v} doesn’t beat any of them.`, note: ties(x.ties), move: false };
    }
    const n = x.outs.length;
    if (n === 1) return { main: "", note: x.outs[0] === "tie" ? "It’s theirs, unless you pay 1 Aura." : "", move: false };
    return { main: x.beat === n ? `All ${n} beat it.` : x.beat ? `${x.beat} of ${n} beat it.` : "None of them beat it.", note: ties(x.ties), move: false };
  }
  // The same, as one sentence for a screen reader, for an action among several.
  function aloud(t, x) {
    const s = verdict(t, x);
    const one = x.way === "act" ? `${WORDS[x.outs[0]]}.` : `It came up ${(t.mine[0] ?? t.theirs[0])?.v}.`;
    return [s.main || one, s.note].filter(Boolean).join(" ");
  }
  // The verdict and its note, with a bubble when it's dice added up.
  function saidView(s, a, live) {
    const lines = `${s.main ? `<p class="dz-verdict">${esc(s.main)}</p>` : ""}${s.note ? `<p class="dz-note">${esc(s.note)}</p>` : ""}`;
    const move = s.move ? tip(`dz-move-${a}`, MOVE, "Why they’re added up") : "";
    if (!live && !lines) return "";
    return `<div class="dz-said"><div class="dz-lines"${live ? ' role="status"' : ""}>${lines}</div>${move}</div>`;
  }

  // The Aura the whole throw pays, as the dice land: 1 for every die of yours
  // that won and 1 for every top face, the way the roll card says it.
  function auraSaid(read) {
    if (!read.aura) return "";
    const n = read.wins;
    const dice = n === 1 ? "one die" : `${n} dice`;
    const won = !n ? "" : read.stops === n ? `${dice} stopped ${n === 1 ? "one" : "one each"}` : `${dice} won`;
    const tops = read.tops === 1 ? "a top face" : read.tops ? `${read.tops} top faces` : "";
    const line = [won, tops].filter(Boolean).join(" and ");
    return `${line[0].toUpperCase()}${line.slice(1)}, so ${read.aura} Aura.`;
  }

  // A tap to read the same dice the other way round, when it was set the
  // wrong way.
  function flipOf(r, a) {
    const t = r.thrown[a];
    if (!t.mine.length || !t.theirs.length) return "";
    const def = r.acts[a].def;
    return ` ${b("def", `Read it the other way${sr(`${r.thrown.length > 1 ? `, ${nameOf(a)},` : ","} as ${def === "you" ? "you going at them" : "them coming at you"}`)}`, ` data-a="${a}" data-v="${def === "you" ? "them" : "you"}"`, "dz-flip")}`;
  }

  // An action's dice as the kit draws them: a top face of yours lights the
  // whole token, and one that lost, or one of theirs that was beaten or
  // stopped, goes dark.
  function diceView(r, a, x) {
    const t = r.thrown[a];
    const spin = r.spinning;
    const skip = spin ? ' data-act="dz" data-dz="skip"' : "";
    const top = (d) => d.v === d.size;
    const mineDie = (d, state = "") => kitDie(d.size, { face: d.v, spin, state: spin ? "" : top(d) ? "top" : state, label: spin ? `Your d${d.size}, rolling` : `Your d${d.size} came up ${d.v}` });
    const theirDie = (d, state = "") => kitDie(d.size, { own: "them", face: d.v, spin, state: spin ? "" : state, label: spin ? `Their d${d.size}, rolling` : `Their d${d.size} came up ${d.v}` });
    // A die in a lane, with its size under it.
    const sized = (drawn, d) => `<span class="dz-d">${drawn}<small aria-hidden="true">d${d.size}</small></span>`;
    if (x.way === "free") {
      const mine = t.mine.length > 0;
      const list = mine ? t.mine : t.theirs;
      return `<div class="cc-stage n${Math.min(4, list.length)}"><ul class="cc-res"${skip}>${list.map((d) => `<li class="res is-${spin ? "spin" : "none"}">${mine ? mineDie(d) : theirDie(d)}<span class="res-die">${mine ? "your" : "their"} d${d.size}</span>${!spin && mine && top(d) ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul></div>`;
    }
    if (x.way === "act") {
      const lost = x.outs.every((o) => o === "beat");
      const label = t.theirs.length > 1 ? `Their best of ${t.theirs.length}` : `Their d${t.theirs[0].size}`;
      return `<div class="cc-stage n${Math.min(4, t.mine.length)}">
        <ul class="cc-res"${skip}>${t.mine.map((d, i) => `<li class="res is-${spin ? "spin" : x.outs[i]}">${mineDie(d, x.outs[i] === "under" ? "low" : x.outs[i] === "tie" ? "tie" : "")}<span class="res-die">d${d.size}</span>${spin ? "" : `<b class="res-out">${WORDS[x.outs[i]]}</b>`}${!spin && top(d) ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
        <div class="cc-them dz-them"${skip}><span class="vs" aria-hidden="true">against</span><span class="k">${label}</span>${t.theirs.map((d, j) => theirDie(d, lost || (t.theirs.length > 1 && j !== x.at) ? "low" : "")).join("")}</div>
        ${!spin && t.theirs.length > 1 ? `<p class="cc-small dz-stands">Their ${x.stands} stands against every one of yours.</p>` : ""}</div>`;
    }
    if (x.way === "each") {
      const d = t.mine[0];
      return `<div class="dz-one"${skip}><span class="k">Your d${d.size}</span>${mineDie(d)}${!spin && top(d) ? '<span class="res-note">Top face</span>' : ""}</div>
        <ul class="dz-lanes"${skip}>${x.lanes.map((l) => `<li class="dz-lane is-${spin ? "spin" : l.out}"><span class="dz-pair">${sized(theirDie(t.theirs[l.j], l.out === "beat" ? "low" : ""), t.theirs[l.j])}</span>${spin ? "" : `<b class="res-out">${WORDS[l.out]}</b>`}</li>`).join("")}</ul>`;
    }
    // They're coming at you: each of theirs in a lane, with the die of yours
    // that's on it, or a gap where there's none left.
    const canSwap = !spin && x.lanes.length > 1;
    const waiting = r.swap?.a === a;
    const lane = (l) => {
      const th = t.theirs[l.j];
      const m = l.i >= 0 ? t.mine[l.i] : null;
      const swap = canSwap ? b("swap", "Swap", ` data-a="${a}" data-j="${l.j}"${pressed(waiting && r.swap.j === l.j)} aria-label="Swap the die on their d${th.size}, which came up ${th.v}"`, "cc-chipbtn sm cc-swap") : "";
      return `<li class="dz-lane is-${spin ? "spin" : l.out}"><span class="dz-pair">${sized(theirDie(th, l.out === "stopped" ? "low" : ""), th)}<span class="vs" aria-hidden="true">vs</span>${m ? sized(mineDie(m, l.out === "through" ? "low" : ""), m) : '<span class="dz-d"><span class="dz-gap" role="img" aria-label="No die of yours left for it"></span><small aria-hidden="true">none</small></span>'}</span>${spin ? "" : `<b class="res-out">${WORDS[l.out]}</b>`}${swap}</li>`;
    };
    return `<ul class="dz-lanes"${skip}>${x.lanes.map(lane).join("")}</ul>
      ${x.spare.length ? `<div class="dz-spare"><span class="k">Not needed</span>${x.spare.map((i) => mineDie(t.mine[i])).join("")}</div>` : ""}
      ${canSwap ? `<div class="dz-swaps"><p class="cc-small" role="status">${waiting ? "Now tap Swap on the other one." : "Matched so the most get stopped."}</p>${waiting ? "" : tip(`dz-swap-${a}`, SWAP, "How to swap")}</div>` : ""}`;
  }

  function resultView(r) {
    const read = readLanes(r.thrown.map((_, a) => laneOf(r, a)));
    const spin = r.spinning;
    const total = spin ? "" : auraSaid(read);
    const totalLine = total ? `<p class="cc-topnote dz-total">${esc(total)}</p>` : "";
    const close = `<button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button>`;
    const skipNote = spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : "";
    const foot = `<div class="dlg-foot">${b("back", "Change the dice")}${b("go", "Roll again", "", "button primary")}</div>`;
    if (r.thrown.length === 1) {
      const x = read.lanes[0];
      const s = spin ? { main: "Rolling…", note: "", move: false } : verdict(r.thrown[0], x);
      return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small dz-how">${esc(HOW[x.way])}${flipOf(r, 0)}</p></div>${close}</div>
    <div class="dlg-body cc-moment dz-result">
      ${saidView(s, 0, true)}
      ${diceView(r, 0, x)}
      ${skipNote}
      ${totalLine}
    </div>${foot}`;
    }
    // Several actions: the Aura across them first, then each one on its own.
    const heard = spin ? "Rolling…" : read.lanes.map((x, a) => `${nameOf(a)}: ${aloud(r.thrown[a], x)}`).join(" ");
    const blocks = read.lanes.map((x, a) => {
      const free = x.way === "free" && !r.thrown[a].mine.length ? "Nothing of yours on it." : SHORT[x.way];
      return `<section class="dz-out is-${x.way}" aria-labelledby="dz-out-${a}">
        <div class="dz-out-head"><h3 id="dz-out-${a}">${nameOf(a)}</h3><p class="dz-out-how">${esc(free)}${flipOf(r, a)}</p></div>
        ${spin ? "" : saidView(verdict(r.thrown[a], x), a, false)}
        ${diceView(r, a, x)}
      </section>`;
    }).join("");
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small dz-how">${r.thrown.length} actions, each read on its own.</p></div>${close}</div>
    <div class="dlg-body cc-moment dz-result is-many">
      <div class="dz-heard" role="status">${spin ? '<p class="dz-verdict">Rolling…</p>' : `${totalLine}<p class="sr-only">${esc(heard)}</p>`}</div>
      ${blocks}
      ${skipNote}
    </div>${foot}`;
  }

  const view = (r) => (r.mode === "pad" ? padView(r) : r.mode === "result" ? resultView(r) : setView(r));

  // The dice have settled: a knock if they came up with no tumble, and a
  // chime and a buzz for a top face of yours.
  function landed(r, knock) {
    if (knock) k.feel.land();
    if (r.thrown.some((t) => t.mine.some((d) => d.v === d.size))) k.feel.top();
  }

  // Before a throw, an action with no dice on comes off.
  function tidy(r) {
    const open = r.acts[r.at];
    r.acts = r.acts.filter(hasDice);
    r.at = Math.max(0, r.acts.indexOf(open));
  }

  function roll(r) {
    // Each action's dice, yours first, then theirs, the order the checks line
    // them up in.
    r.thrown = r.acts.map((x) => ({ mine: x.you.map((size) => ({ size, v: k.throwDie(size) })), theirs: x.them.map((size) => ({ size, v: k.throwDie(size) })), assign: null }));
    Object.assign(r, { mode: "result", swap: null, real: false, spinning: !k.calm() });
    k.redraw();
    if (!r.spinning) return landed(r, true);
    k.spinning(k.tumble(k.dialog, () => {
      k.spinning(null);
      if (!r.spinning || k.roll() !== r) return;
      r.spinning = false;
      k.redraw({ reveal: true });
      landed(r, false);
    }));
  }

  // Put the phone on an action that's just been opened: focus on its number,
  // and all of it showing, with the lines above it too when there's room.
  function lookAt(a) {
    const h = k.dialog.querySelector(`#dz-act-${a}`);
    if (!h) return;
    h.focus({ preventScroll: true });
    h.closest(".dz-act").scrollIntoView({ block: "nearest" });
  }

  function act(el) {
    const r = k.roll();
    const what = el.dataset.dz;
    if (what === "open") return open(el.dataset.from === "play" ? "play" : "list");
    if (!r || r.kind !== "dice") return;
    const a = Math.min(Math.max(0, Math.trunc(Number(el.dataset.a)) || 0), r.acts.length - 1);
    const x = r.acts[a];
    const who = el.dataset.side === "them" ? "them" : "you";
    let look = null;
    // Only a die just put on pops in.
    if (what !== "add") r.fresh = null;
    if (what === "add") {
      if (x[who].length >= MOST) return;
      x[who].push(Number(el.dataset.d));
      r.fresh = { a, side: who, i: x[who].length - 1 };
    } else if (what === "off") {
      x[who].splice(Number(el.dataset.i), 1);
    } else if (what === "clear") {
      x[who] = [];
    } else if (what === "def") {
      x.def = el.dataset.v === "you" ? "you" : "them";
      if (r.thrown[a]) r.thrown[a].assign = null;
      if (r.swap?.a === a) r.swap = null;
    } else if (what === "each") {
      x.each = el.dataset.v === "1";
    } else if (what === "more") {
      // A new action's going at them, since several things to go at is what
      // more than one action's mostly for.
      if (r.acts.length >= ACTIONS || !hasDice(r.acts[r.at])) return;
      r.acts.push({ you: [], them: [], def: "them", each: false });
      r.at = look = r.acts.length - 1;
    } else if (what === "pick") {
      r.at = look = a;
    } else if (what === "drop") {
      if (r.acts.length < 2) return;
      r.acts.splice(a, 1);
      if (a < r.at) r.at -= 1;
      r.at = Math.min(r.at, r.acts.length - 1);
      look = r.at;
    } else if (what === "go") {
      if (!r.acts.some(hasDice)) return;
      tidy(r);
      keep(r);
      return roll(r);
    } else if (what === "real") {
      if (!r.acts.some(hasDice)) return;
      tidy(r);
      keep(r);
      r.thrown = r.acts.map((y) => ({ mine: y.you.map((size) => ({ size, v: 0 })), theirs: y.them.map((size) => ({ size, v: 0 })), assign: null }));
      Object.assign(r, { mode: "pad", real: true, swap: null });
    } else if (what === "pad") {
      const t = r.thrown[Math.trunc(Number(el.dataset.a)) || 0];
      const d = t && (el.dataset.k === "t" ? t.theirs : t.mine)[Number(el.dataset.i)];
      if (d) d.v = Number(el.dataset.v);
    } else if (what === "pad-done") {
      if (!r.thrown.every(tapped)) return;
      for (const t of r.thrown) t.assign = null;
      Object.assign(r, { mode: "result", swap: null, spinning: false });
      k.redraw({ reveal: true });
      return landed(r, false);
    } else if (what === "back") {
      k.spinning(null);
      Object.assign(r, { mode: "set", spinning: false });
    } else if (what === "skip") {
      k.spinning(null);
      if (!r.spinning) return;
      r.spinning = false;
      k.redraw({ reveal: true });
      return landed(r, true);
    } else if (what === "swap") {
      const j = Number(el.dataset.j);
      const first = r.swap?.a === a ? r.swap.j : null;
      if (first == null || first === j) r.swap = first === j ? null : { a, j };
      else {
        r.thrown[a].assign = swapped(readDice(laneOf(r, a)).assign, first, j);
        r.swap = null;
      }
    } else return;
    if (["add", "off", "clear", "def", "each", "more", "drop"].includes(what)) keep(r);
    k.redraw();
    if (look != null) lookAt(look);
  }

  return { open, view, act };
}
