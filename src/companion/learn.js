// The learning round, at /characters/?learn. The brute swings his club at
// Isolde, and a new player answers it with Wren and Bram, the way it goes in
// Answering a Telegraph (#s-answering). Isolde's Defend and wound die and
// Wren's and Bram's Fight come off their sheets, so the round follows the
// rules. The club is the book's own d8. Nothing in it is saved.

import { sizeUp, stepsToDice } from "./dice.js";

const CLUB = 8;
const STEPS = ["The GM telegraphs", "Answer it", "Roll", "That’s a round"];
// How the card moves: slides on to the next step or back, turns over for the
// roll, and shows what the dice did once they land.
const TURN = { next: "cc-go-next", back: "cc-go-back", flip: "cc-flip", reveal: "cc-reveal" };

// How often a die stops another when ties go to the one stopping it, as the
// smallest "x times in y".
function odds(mine, theirs) {
  let wins = 0;
  for (let a = 1; a <= mine; a++) wins += Math.min(a, theirs);
  const all = mine * theirs;
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  const g = gcd(wins, all);
  return [wins / g, all / g];
}

// "a d12 and a d6", "the d12 and the d6", "2 d12s and a d4".
function named(dice, art) {
  const counts = new Map();
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1);
  const parts = [...counts].map(([d, n]) => (n > 1 ? `${art === "the" ? "the " : ""}${n} d${d}s` : `${art} d${d}`));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0] ?? "";
}

// The steps-into-dice table, said the way you'd say it at the table.
function howDice(total) {
  if (total < 6) return `Your die is your steps times 2, so that’s ${named(stepsToDice(total), "a")}`;
  const left = total % 6;
  return `Every 6 steps makes a d12${left ? `, and the ${left} left over make${left === 1 ? "s" : ""} a d${left * 2}` : ""}, so that’s ${named(stepsToDice(total), "a")}`;
}

export function makeLearn(k) {
  const { crew, esc, hex, steps, rules, ruleHtml, isOpen, lineOf, lineLabel, throwDie, feel, tumble, calm, sound, render, gauge } = k;
  const isolde = crew.get("isolde");
  const wren = crew.get("wren");
  const bram = crew.get("bram");
  const fight = (c) => c?.actions.find((a) => a.name === "Fight");
  // Isolde's Defend, rolled when the club lands: her best die is the one that counts against it.
  const guard = () => Math.max(...stepsToDice(isolde.actions.find((a) => a.name === "Defend")?.steps ?? 1));
  let L;
  let stop = null;
  const reset = () => {
    stop?.();
    stop = null;
    L = { step: 0, in: [], dice: [], opp: 0, rolled: false, real: false, pads: null, tumbling: false, paid: false, lost: false, turn: null, focus: null, fresh: false };
  };
  reset();

  const ready = () => Boolean(isolde && wren && bram && fight(wren) && fight(bram));
  const total = () => fight(wren).steps + fight(bram).steps;
  const best = () => Math.max(...L.dice.map((d) => d.nat));
  // beat, won (a tie paid for), tie (still to choose), or lands.
  const outcome = () => {
    const b = best();
    if (b > L.opp) return "beat";
    if (b === L.opp && !L.lost) return L.paid ? "won" : "tie";
    return "lands";
  };

  const rule = (id) => (rules[id] ? `<details class="cc-rulebox ln-rule" data-open="ln-${id}"${isOpen(`ln-${id}`) ? " open" : ""}><summary>${esc(rules[id].title)}, from the rules</summary><div class="cc-rule">${ruleHtml(id)}</div></details>` : "");
  const btn = (what, label, cls = "", extra = "") => `<button type="button" class="button${cls ? ` ${cls}` : ""}" data-act="learn" data-do="${what}"${extra}>${label}</button>`;

  function stepTelegraph() {
    const die = guard();
    const [x, y] = odds(die, CLUB);
    return `<p>Every round starts with the GM saying what’s coming, before anything’s rolled: what it’s doing, who it’s aimed at, and how hard, in dice. That’s a <b>telegraph</b>.</p>
    <p class="ln-gm"><b>GM:</b> The brute swings his club at Isolde. That’s a d${CLUB}.</p>
    <div class="ln-vs"><div class="ln-who">${hex(`d${CLUB}`, "big them")}<span>The brute’s club</span></div><span class="ln-arrow" aria-hidden="true">↓</span><div class="ln-who">${hex(`d${die}`, "big")}<span>Isolde’s Defend</span></div></div>
    <p>If nobody answers it, it lands at the end of the round, and Isolde rolls her Defend against it. The club has to beat her roll to get through, and ties go to her. A d${die} against a d${CLUB} stops it ${x} times in ${y}, so you’re going to answer it with Wren and Bram.</p>
    <p>Bram’s a Guardian, so he could intercept it for free and take it on his own Defend instead. This time you’re going to stop it before it lands.</p>
    ${rule("s-telegraphs")}
    <div class="cc-row ln-foot">${btn("next", "Answer it", "primary")}</div>`;
  }

  const tile = (who, c, a) => {
    const on = L.in.includes(who);
    const lines = a.lines.map((key) => lineOf(c, key)).filter(Boolean);
    return `<div class="ln-pick"><button type="button" class="tile card ln-tile${on ? " is-in" : ""}" data-act="learn" data-do="pick" data-who="${who}" aria-pressed="${on}"><span class="tile-name">${esc(c.name)}’s ${esc(a.name)}</span><span class="tile-die hex on">${esc(a.die)}</span><span class="tile-steps">${steps(a.steps)}</span></button>
      ${lines.length ? `<ul class="ln-lines">${lines.map((l) => `<li>${lineLabel(l)}</li>`).join("")}</ul>` : ""}</div>`;
  };

  function stepAnswer() {
    const wf = fight(wren);
    const bf = fight(bram);
    const both = L.in.length === 2;
    const dice = stepsToDice(total());
    return `<p>To answer a telegraph, you spend your action and roll against its dice, with the set action that fits how you’re stopping it.</p>
    <p>Wren puts an arrow into the brute’s arm, so that’s her ${esc(wf.name)}. Tap it to put her action in.</p>
    ${tile("wren", wren, wf)}
    ${L.in.includes("wren") ? `<p>Bram puts his action into the same thing, getting his hammer under the club. Two actions going into one thing is a <b>combo</b>: you add the set actions together and one of you rolls the lot. Tap Bram’s ${esc(bf.name)}.</p>${tile("bram", bram, bf)}` : ""}
    ${both ? `<div class="ln-sum"><div class="ln-dice">${dice.map((d) => hex(`d${d}`, "big on")).join("")}</div>
      <p><b>${wf.steps} steps and ${bf.steps} steps is ${steps(total())}</b> from two actions. ${howDice(total())}. A combo doesn’t cost Aura.</p>
      <p>Both dice go on the club, and your best die counts.</p></div>${rule("s-teamwork")}` : rule("s-answering")}
    <div class="cc-row ln-foot">${btn("back", "Back")}${btn("next", "Roll it", "primary", both ? "" : " disabled")}</div>`;
  }

  function stepPads() {
    const dice = stepsToDice(total());
    const pad = (label, key, size) => `<fieldset class="cc-pad"><legend>${label}</legend><div class="cc-nums">${Array.from({ length: size }, (_, j) => `<button type="button" class="cc-num" data-act="learn" data-do="pad" data-k="${key}" data-v="${j + 1}" aria-pressed="${L.pads[key] === j + 1}">${j + 1}</button>`).join("")}</div></fieldset>`;
    const done = dice.every((_, i) => L.pads[i]) && L.pads.opp;
    return `<p>Roll them, then tap what each one came up.</p>
    ${dice.map((d, i) => pad(`Your d${d}`, i, d)).join("")}${pad(`The brute’s d${CLUB}`, "opp", CLUB)}
    <div class="cc-row ln-foot">${btn("unpad", "Back")}${btn("pad-done", "See how it went", "primary", done ? "" : " disabled")}</div>`;
  }

  function stepRoll() {
    if (L.pads) return stepPads();
    const dice = stepsToDice(total());
    if (!L.rolled) {
      return `<p>Wren rolls the lot: ${named(dice, "the")} against the brute’s d${CLUB}. Beat it and it never lands. Lose, and it lands on Isolde at once, and nobody rolls a defence against it. A tie’s a loss, unless you pay 1 Aura.</p>
      <div class="cc-row ln-foot">${btn("back", "Back")}${btn("real", "Roll real dice")}${btn("roll", "Roll the dice", "primary")}</div>`;
    }
    const spin = L.tumbling;
    const b = best();
    const out = spin ? null : outcome();
    const first = L.dice.findIndex((d) => d.nat === b);
    const die = (size, nat, cls) => (spin ? `<span class="hex big ${cls}" data-spin="${size}">${nat}</span>` : hex(nat, `big ${cls}`));
    const mark = { beat: "beat", won: "won", tie: "tie", lands: "under" }[out];
    const rows = L.dice.map((d, i) => `<li class="res is-${spin ? "spin" : i === first ? mark : "none"}">${die(d.size, d.nat, "on")}<span class="res-die">d${d.size}</span>${!spin && i === first ? '<b class="res-out">Your best</b>' : ""}${!spin && d.nat === d.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("");
    const tops = L.dice.filter((d) => d.nat === d.size);
    const topLine = tops.length ? `<p>${tops.length === 1 ? `The d${tops[0].size} came up ${tops[0].size}, its top face` : `That’s ${tops.length} top faces`}, so Wren gets ${tops.length} Aura back. Whoever rolls gets the Aura for every top face, friends’ dice included, and if her Aura’s full she gives it to a friend in the scene.</p>` : "";
    const from = isolde.numbers.wound ?? 2;
    const to = sizeUp(from);
    const hurt = `<div class="ln-hurt"><span class="k">Isolde’s wound die</span>${gauge(to, from, L.fresh)}${hex(`d${to}`, "on")}</div>`;
    const words = {
      beat: `<h3 id="ln-out" tabindex="-1">It never lands</h3><p>Your ${b} beats the brute’s ${L.opp}, so the club never comes down. Isolde’s fine, and Wren and Bram have both used their action for the round.</p>`,
      won: `<h3 id="ln-out" tabindex="-1">It never lands</h3><p>You pay 1 Aura, so the tie’s yours, and the club never comes down. Isolde’s fine, and Wren and Bram have both used their action for the round.</p>`,
      tie: `<h3 id="ln-out" tabindex="-1">A tie</h3><p>Your ${b} ties the brute’s ${L.opp}. A tie’s a loss, unless you pay 1 Aura.</p><div class="cc-row">${btn("win", "Win the tie: 1 Aura")}${btn("lose", "Let it land")}</div>`,
      lands: `<h3 id="ln-out" tabindex="-1">It lands on Isolde</h3><p>${b === L.opp ? `Your ${b} ties the brute’s ${L.opp}, and a tie’s a loss` : `The brute’s ${L.opp} beats your best, a ${b}`}, so the club lands on Isolde at once, and nobody rolls a defence against it. Answering’s a gamble, and this one didn’t pay off.</p>
        <p>The GM names what a blow costs. Say she calls it a Hurt: Isolde’s wound die goes up a size, from d${from} to d${to}.</p>${hurt}`,
    };
    return `<div class="ln-roll"${spin ? ' data-act="learn" data-do="skip"' : ""}>
      <div class="cc-them"><span class="k">The brute’s d${CLUB}</span>${die(CLUB, L.opp, "them")}</div>
      <ul class="cc-res">${rows}</ul></div>
    ${spin ? '<p class="cc-small">Tap the dice to skip.</p>' : `<div class="ln-out">${words[out]}${topLine}</div>`}
    ${spin || out === "tie" ? "" : `<div class="cc-row ln-foot">${btn("next", "Next", "primary")}</div>`}`;
  }

  function stepRound() {
    const landed = outcome() === "lands";
    return `<p>That’s a round. The GM telegraphs, everyone takes one action, and whatever nobody answered lands at the end. Then she telegraphs the next one.</p>
    <p>${landed ? "The club’s already landed on Isolde, so there’s nothing left to land, and the round’s over." : "There was only the club, and you stopped it, so nothing lands and the round’s over."}</p>
    <p>Your own character works the same way. Tap a set action and the phone builds the roll, with the lines that cost Aura marked in gold, and does the counting for you.</p>
    ${rule("s-round")}
    <div class="cc-row ln-foot">${btn("again", "Play it again")}<a class="button primary" href="/characters/" data-act="nav">Pick a character</a></div>`;
  }

  function view() {
    const head = `<div class="cc-topbar"><a class="cc-back" href="/characters/" data-act="nav">${k.icon.back}Characters</a>${sound()}</div>
    <header class="cc-head"><p class="kicker">Step ${L.step + 1} of ${STEPS.length}</p><h1>Learn to play</h1>
      <p class="cc-small">One round with Isolde, Wren and Bram. You play Wren and Bram, and the phone does the counting.</p>
      <ol class="ln-dots" aria-hidden="true">${STEPS.map((_, i) => `<li${i <= L.step ? ' class="on"' : ""}></li>`).join("")}</ol></header>`;
    if (!ready()) return `${head}<div class="cc-note is-warn"><p>The learning round needs Isolde, Wren and Bram from the crew, and one of them isn’t in the rules right now.</p></div>`;
    const turn = L.turn;
    L.turn = null;
    const body = [stepTelegraph, stepAnswer, stepRoll, stepRound][L.step]();
    return `${head}<section class="card ln-card${turn ? ` ${TURN[turn]}` : ""}" aria-labelledby="ln-h"><h2 id="ln-h" tabindex="-1">${STEPS[L.step]}</h2>${body}</section>`;
  }

  // After a draw: put focus where a screen reader should be, then forget it.
  function after(app) {
    const id = L.focus;
    L.focus = null;
    L.fresh = false;
    if (id) app.querySelector(`#${id}`)?.focus({ preventScroll: id === "ln-out" });
  }

  // The roll has landed: the outcome shows, and gets its sounds.
  function landed(knock) {
    L.tumbling = false;
    const out = outcome();
    L.fresh = out === "lands";
    L.turn = "reveal";
    L.focus = "ln-out";
    render();
    if (knock) feel.land();
    if (L.dice.some((d) => d.nat === d.size)) feel.top();
    if (out === "lands") feel.hurt();
  }

  function act(el) {
    const what = el.dataset.do;
    if (what === "next" || what === "back") {
      L.step = Math.max(0, Math.min(STEPS.length - 1, L.step + (what === "next" ? 1 : -1)));
      L.turn = what === "next" ? "next" : "back";
      L.focus = "ln-h";
      if (L.step < 2) Object.assign(L, { rolled: false, pads: null, paid: false, lost: false });
      if (L.step === 2 && what === "back") Object.assign(L, { rolled: false, pads: null, paid: false, lost: false });
      scrollTo(0, 0);
    } else if (what === "pick") {
      const who = el.dataset.who;
      L.in = L.in.includes(who) ? L.in.filter((w) => w !== who && (who !== "wren" || w !== "bram")) : [...L.in, who];
    } else if (what === "roll") {
      L.dice = stepsToDice(total()).map((size) => ({ size, nat: throwDie(size) }));
      L.opp = throwDie(CLUB);
      Object.assign(L, { rolled: true, real: false, paid: false, lost: false, tumbling: !calm(), turn: "flip" });
      render();
      if (!L.tumbling) return landed(true);
      stop = tumble(() => document.querySelector(".ln-roll"), () => {
        stop = null;
        landed(false);
      });
      return;
    } else if (what === "skip") {
      stop?.();
      stop = null;
      if (L.tumbling) return landed(true);
    } else if (what === "real") {
      Object.assign(L, { pads: {}, turn: "flip", focus: "ln-h" });
    } else if (what === "unpad") {
      Object.assign(L, { pads: null, focus: "ln-h" });
    } else if (what === "pad") {
      L.pads[el.dataset.k] = Number(el.dataset.v);
    } else if (what === "pad-done") {
      const dice = stepsToDice(total());
      if (!dice.every((_, i) => L.pads[i]) || !L.pads.opp) return;
      L.dice = dice.map((size, i) => ({ size, nat: L.pads[i] }));
      L.opp = L.pads.opp;
      Object.assign(L, { pads: null, rolled: true, real: true, paid: false, lost: false });
      return landed(false);
    } else if (what === "win") {
      L.paid = true;
      L.focus = "ln-out";
    } else if (what === "lose") {
      L.lost = true;
      L.fresh = true;
      L.focus = "ln-out";
      render();
      feel.hurt();
      return;
    } else if (what === "again") {
      reset();
      L.turn = "next";
      L.focus = "ln-h";
      scrollTo(0, 0);
    }
    render();
  }

  // Opening the round from the list starts it fresh, with focus on its heading.
  const open = () => {
    reset();
    L.focus = "ln-h";
  };
  // Leaving the round mid-tumble settles the dice where they'll be found.
  const halt = () => {
    stop?.();
    stop = null;
    L.tumbling = false;
  };
  return { view, act, after, open, stop: halt };
}
