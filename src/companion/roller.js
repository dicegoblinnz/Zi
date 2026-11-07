// The dice roller, off the play screen and the Characters list: any dice of
// yours against any of theirs, with no telegraph or threat to set up. Tap the
// dice onto each side, say who's going at who, and they all roll together,
// on the phone or as real dice tapped in. roller-rules.js reads it: what beat
// what, what's stopped and what gets through, matched so the most get
// stopped, with a swap. It's only dice, so it never touches a character, and
// the set-up's kept on the phone as zi-dice for next time.
import { MOST, SIDES, readDice, setupOf, swapped } from "./roller-rules.js";
import { diceLabel } from "./dice.js";
import { die as kitDie } from "../kit/kit.js";

const KEY = "zi-dice";
const WORDS = { beat: "Beat it", tie: "Tie", under: "Under", stopped: "Stopped", through: "Gets through" };
const WHOSE = { you: ["Your", "yours"], them: ["Their", "theirs"] };

// k: esc, icon, throwDie, calm, tumble, feel, open (turns the dialog to a
// state), roll (the dialog's state), redraw (draws the dialog again, with
// what the dice did coming up once they've landed) and spinning (hands over
// a tumble's stop, so closing the dialog stops it).
export function makeRoller(k) {
  const { esc } = k;
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const off = (no) => (no ? " disabled" : "");
  const b = (dz, label, extra = "", cls = "button") => `<button type="button" class="${cls}" data-act="dz" data-dz="${dz}"${extra}>${label}</button>`;

  const load = () => {
    try {
      return setupOf(JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return setupOf(null);
    }
  };
  const keep = (r) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ you: r.you, them: r.them, def: r.def, each: r.each }));
    } catch {}
  };

  // from: "play" off a character's play screen, where the sheet's a tap
  // away, or "list" off the Characters list.
  function open(from = "list") {
    k.open({ kind: "dice", mode: "set", from, ...load(), mine: [], theirs: [], assign: null, swap: null, spinning: false, real: false, fresh: null });
  }

  const both = (r) => r.you.length > 0 && r.them.length > 0;
  // With one of yours against several of theirs, they could be one thing
  // rolling them all or several things defending on their own.
  const asksEach = (r) => r.def === "them" && r.you.length === 1 && r.them.length > 1;
  const setSaid = (r) => (both(r) ? `${diceLabel(r.you)} against ${diceLabel(r.them)}`
    : r.you.length ? `${diceLabel(r.you)}, with nothing to beat`
    : r.them.length ? `Their ${diceLabel(r.them)}, with nothing of yours`
    : "No dice on yet.");

  // One side's dice, each tapped to take it off, and a die of every size to
  // tap one on.
  function side(r, who) {
    const [Whose, whose] = WHOSE[who];
    const list = r[who];
    const own = who === "you" ? "you" : "them";
    const fresh = r.fresh?.side === who ? r.fresh.i : -1;
    const dice = list.map((d, i) => `<button type="button" class="dz-die${i === fresh ? " is-new" : ""}" data-act="dz" data-dz="off" data-side="${who}" data-i="${i}" aria-label="${Whose} d${d}. Tap to take it off.">${kitDie(d, { own, hide: true })}</button>`).join("");
    const none = who === "you" ? "None yet. Tap a die below to put it on." : "None yet. Leave it empty when there’s nothing to beat.";
    return `<section class="dz-side is-${own}" aria-labelledby="dz-${who}">
      <div class="dz-side-head"><h3 id="dz-${who}">${who === "you" ? "Yours" : "Theirs"}</h3>${list.length ? `<span class="dz-count">${esc(diceLabel(list))}</span>${b("clear", "Clear", ` data-side="${who}" aria-label="Clear ${whose}"`, "button sm dz-clear")}` : ""}</div>
      <div class="dz-tray">${dice || `<p class="dz-none">${none}</p>`}</div>
      <div class="dz-add" role="group" aria-label="Put a die on ${whose}">${SIDES.map((d) => `<button type="button" class="dz-adddie" data-act="dz" data-dz="add" data-side="${who}" data-d="${d}" aria-label="Add a d${d} to ${whose}"${off(list.length >= MOST)}>${kitDie(d, { own, hide: true })}</button>`).join("")}</div>
    </section>`;
  }

  function whoView(r) {
    if (!both(r)) return "";
    const one = r.them.length === 1;
    const lead = r.def === "you"
      ? "Each of your dice stops one of theirs it beats or ties, since ties are yours. Whatever’s left gets through."
      : asksEach(r)
        ? r.each ? "Everyone in your area or sweep defends on their own, a die each, against your one die. A tie’s theirs, unless you pay 1 Aura." : "One thing’s rolling all their dice, so its best one stands, the way a <em>Layered</em> threat’s does. A tie’s theirs, unless you pay 1 Aura."
        : `Each of your dice has to beat their roll${one ? "" : ", and it’s their best die that stands, the way a <em>Layered</em> threat’s does"}. A tie’s theirs, unless you pay 1 Aura.`;
    const each = asksEach(r) ? `<h3 class="dz-q" id="dz-each">One target, or several?</h3>
      <div class="cc-chips" role="group" aria-labelledby="dz-each">${b("each", "One", ` data-v="0"${pressed(!r.each)}`, "cc-chipbtn")}${b("each", "Several", ` data-v="1"${pressed(r.each)}`, "cc-chipbtn")}</div>` : "";
    return `<fieldset class="cc-group dz-who"><legend>Who’s going at who?</legend>
      <div class="cc-chips">${b("def", "You’re going at them", ` data-v="them"${pressed(r.def === "them")}`, "cc-chipbtn")}${b("def", "They’re coming at you", ` data-v="you"${pressed(r.def === "you")}`, "cc-chipbtn")}</div>
      ${each}<p class="cc-lead">${lead}</p></fieldset>`;
  }

  function setView(r) {
    const none = !r.you.length && !r.them.length;
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small">${esc(setSaid(r))}</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button></div>
    <div class="dlg-body dz">
      <p class="cc-lead">Any dice you like, yours and theirs, all rolled together.${r.from === "play" ? " It’s only dice, so your sheet stays as it is." : ""}</p>
      ${side(r, "you")}${side(r, "them")}${whoView(r)}
    </div>
    <div class="dlg-foot">${b("go", "Roll", off(none), "button primary")}${b("real", "Roll real dice", off(none))}</div>`;
  }

  // Real dice: tap in what each one came up.
  function padView(r) {
    const name = (list, i, who) => {
      const same = list.filter((d) => d.size === list[i].size).length;
      const nth = list.slice(0, i + 1).filter((d) => d.size === list[i].size).length;
      return `${WHOSE[who][0]} d${list[i].size}${same > 1 ? ` (${nth} of ${same})` : ""}`;
    };
    const pad = (list, who, key) => list.map((d, i) => `<fieldset class="cc-pad is-${who}"><legend>${name(list, i, who)}</legend><div class="cc-nums">${Array.from({ length: d.size }, (_, j) => `<button type="button" class="cc-num" data-act="dz" data-dz="pad" data-k="${key}" data-i="${i}" data-v="${j + 1}"${pressed(d.v === j + 1)}>${j + 1}</button>`).join("")}</div></fieldset>`).join("");
    const ready = [...r.mine, ...r.theirs].every((d) => d.v > 0);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small">Roll them, then tap what each one came up.</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button></div>
    <div class="dlg-body">${pad(r.mine, "you", "m")}${pad(r.theirs, "them", "t")}</div>
    <div class="dlg-foot">${b("back", "Back")}${b("pad-done", "See how it went", off(!ready), "button primary")}</div>`;
  }

  // What the dice did, said once: a line to read at a glance (main), and a
  // tie that's theirs unless you pay for it (note). One die says it under
  // itself, so it gets no line of its own.
  const ties = (n) => (n === 1 ? "One’s a tie, and it’s theirs unless you pay 1 Aura." : n ? `${n} are ties, and they’re theirs unless you pay 1 Aura each.` : "");
  function verdict(r, x) {
    if (x.way === "free") {
      const list = r.mine.length ? r.mine : r.theirs;
      return list.length === 1 ? { main: "", note: "" } : { main: `Added up, ${x.total}.`, note: "That’s only if it’s a Move, the one roll where dice add." };
    }
    if (x.way === "defend") {
      const n = x.lanes.length;
      const main = !x.through ? (n === 1 ? "It’s stopped." : `All ${n} stopped, so nothing gets through.`)
        : !x.stopped ? (n === 1 ? "It gets through." : `None stopped, so all ${n} get through.`)
        : `${x.stopped} stopped, and ${x.through === 1 ? "one gets" : `${x.through} get`} through.`;
      return { main, note: "" };
    }
    if (x.way === "each") {
      const n = x.lanes.length;
      const v = r.mine[0].v;
      return { main: x.beat === n ? `Your ${v} beats all ${n} of them.` : x.beat ? `Your ${v} beats ${x.beat} of the ${n}.` : `Your ${v} doesn’t beat any of them.`, note: ties(x.ties) };
    }
    const n = x.outs.length;
    if (n === 1) return { main: "", note: x.outs[0] === "tie" ? "It’s theirs, unless you pay 1 Aura." : "" };
    return { main: x.beat === n ? `All ${n} beat it.` : x.beat ? `${x.beat} of ${n} beat it.` : "None of them beat it.", note: ties(x.ties) };
  }

  function resultView(r) {
    const x = readDice({ mine: r.mine, theirs: r.theirs, def: r.def, each: r.each, assign: r.assign });
    const spin = r.spinning;
    const skip = spin ? ' data-act="dz" data-dz="skip"' : "";
    const top = (d) => d.v === d.size;
    // Each die as the kit draws it: a top face of yours lights the whole token,
    // and one that lost, or one of theirs that was beaten or stopped, goes dark.
    const mineDie = (d, state = "") => kitDie(d.size, { face: d.v, spin, state: spin ? "" : top(d) ? "top" : state, label: spin ? `Your d${d.size}, rolling` : `Your d${d.size} came up ${d.v}` });
    const theirDie = (d, state = "") => kitDie(d.size, { own: "them", face: d.v, spin, state: spin ? "" : state, label: spin ? `Their d${d.size}, rolling` : `Their d${d.size} came up ${d.v}` });
    // A die in a lane, with its size under it.
    const sized = (drawn, d) => `<span class="dz-d">${drawn}<small aria-hidden="true">d${d.size}</small></span>`;
    let dice = "";
    if (x.way === "free") {
      const mine = r.mine.length > 0;
      const list = mine ? r.mine : r.theirs;
      dice = `<div class="cc-stage n${Math.min(4, list.length)}"><ul class="cc-res"${skip}>${list.map((d) => `<li class="res is-${spin ? "spin" : "none"}">${mine ? mineDie(d) : theirDie(d)}<span class="res-die">${mine ? "your" : "their"} d${d.size}</span>${!spin && mine && top(d) ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul></div>`;
    } else if (x.way === "act") {
      const lost = x.outs.every((o) => o === "beat");
      const label = r.theirs.length > 1 ? `Their best of ${r.theirs.length}` : `Their d${r.theirs[0].size}`;
      dice = `<div class="cc-stage n${Math.min(4, r.mine.length)}">
        <ul class="cc-res"${skip}>${r.mine.map((d, i) => `<li class="res is-${spin ? "spin" : x.outs[i]}">${mineDie(d, x.outs[i] === "under" ? "low" : x.outs[i] === "tie" ? "tie" : "")}<span class="res-die">d${d.size}</span>${spin ? "" : `<b class="res-out">${WORDS[x.outs[i]]}</b>`}${!spin && top(d) ? '<span class="res-note">Top face</span>' : ""}</li>`).join("")}</ul>
        <div class="cc-them dz-them"${skip}><span class="vs" aria-hidden="true">against</span><span class="k">${label}</span>${r.theirs.map((d, j) => theirDie(d, lost || (r.theirs.length > 1 && j !== x.at) ? "low" : "")).join("")}</div>
        ${!spin && r.theirs.length > 1 ? `<p class="cc-small dz-stands">Their ${x.stands} stands against every one of yours.</p>` : ""}</div>`;
    } else if (x.way === "each") {
      const d = r.mine[0];
      dice = `<div class="dz-one"${skip}><span class="k">Your d${d.size}</span>${mineDie(d)}${!spin && top(d) ? '<span class="res-note">Top face</span>' : ""}</div>
        <ul class="dz-lanes"${skip}>${x.lanes.map((l) => `<li class="dz-lane is-${spin ? "spin" : l.out}"><span class="dz-pair">${sized(theirDie(r.theirs[l.j], l.out === "beat" ? "low" : ""), r.theirs[l.j])}</span>${spin ? "" : `<b class="res-out">${WORDS[l.out]}</b>`}</li>`).join("")}</ul>`;
    } else {
      // They're coming at you: each of theirs in a lane, with the die of yours
      // that's on it, or a gap where there's none left.
      const canSwap = !spin && x.lanes.length > 1;
      const lane = (l) => {
        const t = r.theirs[l.j];
        const m = l.i >= 0 ? r.mine[l.i] : null;
        const swap = canSwap ? b("swap", "Swap", ` data-j="${l.j}"${pressed(r.swap === l.j)} aria-label="Swap the die on their d${t.size}, which came up ${t.v}"`, "cc-chipbtn sm cc-swap") : "";
        return `<li class="dz-lane is-${spin ? "spin" : l.out}"><span class="dz-pair">${sized(theirDie(t, l.out === "stopped" ? "low" : ""), t)}<span class="vs" aria-hidden="true">vs</span>${m ? sized(mineDie(m, l.out === "through" ? "low" : ""), m) : '<span class="dz-d"><span class="dz-gap" role="img" aria-label="No die of yours left for it"></span><small aria-hidden="true">none</small></span>'}</span>${spin ? "" : `<b class="res-out">${WORDS[l.out]}</b>`}${swap}</li>`;
      };
      dice = `<ul class="dz-lanes"${skip}>${x.lanes.map(lane).join("")}</ul>
        ${x.spare.length ? `<div class="dz-spare"><span class="k">Not needed</span>${x.spare.map((i) => mineDie(r.mine[i])).join("")}</div>` : ""}
        ${canSwap ? `<p class="cc-small" role="status">${r.swap == null ? "The phone’s matched your dice so the most get stopped. Tap Swap on two to trade the dice on them." : "Now tap Swap on the other one."}</p>` : ""}`;
    }
    const tops = x.tops.length;
    const topNote = !spin && tops ? `<p class="cc-topnote">${tops === 1 ? `Top face on your d${r.mine[x.tops[0]].size}` : `${tops} top faces`}, so ${tops} Aura back.</p>` : "";
    // How it's read, with a tap to read the same dice the other way round when
    // it was set the wrong way.
    const how = { act: "You’re going at them, so ties are theirs.", each: "Everyone defends on their own, and ties are theirs.", defend: "They’re coming at you, so ties are yours.", free: "Nothing to beat, so it’s just the numbers." }[x.way];
    const flip = both(r) ? ` ${b("def", "Read it the other way", ` data-v="${r.def === "you" ? "them" : "you"}" aria-label="Read it as ${r.def === "you" ? "you going at them" : "them coming at you"} instead"`, "dz-flip")}` : "";
    const said = spin ? { main: "Rolling…", note: "" } : verdict(r, x);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Dice roller</h2><p class="cc-small dz-how">${esc(how)}${flip}</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${k.icon.close}</button></div>
    <div class="dlg-body cc-moment dz-result">
      <div role="status">${said.main ? `<p class="dz-verdict">${esc(said.main)}</p>` : ""}${said.note ? `<p class="dz-note">${esc(said.note)}</p>` : ""}</div>
      ${dice}
      ${spin ? '<p class="cc-small cc-skip">Tap the dice to skip.</p>' : ""}
      ${topNote}
    </div>
    <div class="dlg-foot">${b("back", "Change the dice")}${b("go", "Roll again", "", "button primary")}</div>`;
  }

  const view = (r) => (r.mode === "pad" ? padView(r) : r.mode === "result" ? resultView(r) : setView(r));

  // The dice have settled: a knock if they came up with no tumble, and a
  // chime and a buzz for a top face of yours.
  function landed(r, knock) {
    if (knock) k.feel.land();
    if (r.mine.some((d) => d.v === d.size)) k.feel.top();
  }

  function roll(r) {
    // Yours first, then theirs, the order the checks line them up in.
    r.mine = r.you.map((size) => ({ size, v: k.throwDie(size) }));
    r.theirs = r.them.map((size) => ({ size, v: k.throwDie(size) }));
    Object.assign(r, { mode: "result", assign: null, swap: null, real: false, spinning: !k.calm() });
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

  function act(el) {
    const r = k.roll();
    const what = el.dataset.dz;
    if (what === "open") return open(el.dataset.from === "play" ? "play" : "list");
    if (!r || r.kind !== "dice") return;
    const who = el.dataset.side === "them" ? "them" : "you";
    // Only a die just put on pops in.
    if (what !== "add") r.fresh = null;
    if (what === "add") {
      if (r[who].length >= MOST) return;
      r[who].push(Number(el.dataset.d));
      r.fresh = { side: who, i: r[who].length - 1 };
    } else if (what === "off") {
      r[who].splice(Number(el.dataset.i), 1);
    } else if (what === "clear") {
      r[who] = [];
    } else if (what === "def") {
      r.def = el.dataset.v === "you" ? "you" : "them";
      Object.assign(r, { assign: null, swap: null });
    } else if (what === "each") {
      r.each = el.dataset.v === "1";
    } else if (what === "go") {
      if (!r.you.length && !r.them.length) return;
      keep(r);
      return roll(r);
    } else if (what === "real") {
      if (!r.you.length && !r.them.length) return;
      keep(r);
      Object.assign(r, { mode: "pad", real: true, mine: r.you.map((size) => ({ size, v: 0 })), theirs: r.them.map((size) => ({ size, v: 0 })) });
    } else if (what === "pad") {
      const list = el.dataset.k === "t" ? r.theirs : r.mine;
      const d = list[Number(el.dataset.i)];
      if (d) d.v = Number(el.dataset.v);
    } else if (what === "pad-done") {
      if (![...r.mine, ...r.theirs].every((d) => d.v > 0)) return;
      Object.assign(r, { mode: "result", assign: null, swap: null, spinning: false });
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
      const first = r.swap;
      if (first == null || first === j) r.swap = first === j ? null : j;
      else {
        const x = readDice({ mine: r.mine, theirs: r.theirs, def: r.def, each: r.each, assign: r.assign });
        Object.assign(r, { assign: swapped(x.assign, first, j), swap: null });
      }
    } else return;
    if (["add", "off", "clear", "def", "each"].includes(what)) keep(r);
    k.redraw();
  }

  return { open, view, act };
}
