// The learning round, at /characters/?learn, on stacking (14 Nov 2026). The
// brute swings his club at Isolde's Body, and a new player answers it with
// Wren and Bram, the way it goes in Answering a Telegraph (#s-answering):
// Wren's Body and everything of hers that fits an arrow into his arm (both her
// Titles, Hunter twice, her longbow and Long shot), and everything of Bram's
// that fits getting his hammer under the club (the wall that held the harbour
// gate, guard one person, Guardian, his war hammer and Ring the bell), in one
// roll. Everything comes off their sheets (roots.js), so the round follows the
// rules: Isolde's Stamina if nobody answers, Aura for every die that wins and
// every top face, past Wren's maximum while she's acting, and a size off
// Isolde's Stamina if the answer loses. The club is the book's own d8.
// Explanations are question bubbles, so each step's lesson is what's on the
// screen. Nothing in it is saved.

import { sizeDown, stepsToDice } from "./dice.js";
import * as R from "./roots.js";
import { tip } from "./tip.js";
import { aura as kitAura, die as kitDie } from "../kit/kit.js";

const CLUB = 8;
const STEPS = ["The GM telegraphs", "Answer it", "Roll", "That’s a round"];
// How the card moves: slides on to the next step or back, turns over for the
// roll, and shows what the dice did once they land.
const TURN = { next: "cc-go-next", back: "cc-go-back", flip: "cc-flip", reveal: "cc-reveal" };
const WORDS = ["no", "one", "two", "three", "four", "five", "six"];
const stepsSaid = (n) => `${n} ${n === 1 ? "step" : "steps"}`;
const thingsSaid = (n) => `${WORDS[n] ?? n} ${n === 1 ? "thing" : "things"}`;

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

// "a d12 and a d6", "the two d12s", "a d12 and a d2".
function named(dice, art) {
  const counts = new Map();
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1);
  const parts = [...counts].map(([d, n]) => (n > 1 ? `${art === "the" ? "the " : ""}${WORDS[n] ?? n} d${d}s` : `${art} d${d}`));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0] ?? "";
}

// The steps-into-dice table, said the way you'd say it at the table.
function howDice(total) {
  if (total < 6) return `Your die is your steps times 2, so that’s ${named(stepsToDice(total), "a")}`;
  const left = total % 6;
  return `Every 6 steps makes a d12${left ? `, and the ${left} left over make${left === 1 ? "s" : ""} a d${left * 2}` : ""}, so that’s ${named(stepsToDice(total), "a")}`;
}

export function makeLearn(k) {
  const { crew, esc, rules, ruleHtml, isOpen, throwDie, feel, tumble, calm, sound, render } = k;
  const isolde = crew("isolde");
  const wren = crew("wren");
  const bram = crew("bram");
  // What fits, off their sheets, found by what each thing is so the book can
  // reorder a sheet: for Wren's arrow, her Titles, her archetypes, her bow and
  // its passive awakening, and for Bram getting his hammer under the club,
  // the Title that makes him a wall, guard one person, Guardian, his hammer
  // and its passive awakening.
  const thingsOf = (c) => (c ? R.thingsOf(c, R.freshRoots(c)) : []);
  const bowOf = (c) => c?.attuned.findIndex((a) => /bow\b/i.test(a.name)) ?? -1;
  const hammerOf = (c) => c?.attuned.findIndex((a) => /\bhammer\b/i.test(a.name)) ?? -1;
  const passiveOn = (c, i) => thingsOf(c).find((x) => x.kind === "awk" && x.a === i && x.passive);
  const wrenFits = () => {
    const all = thingsOf(wren);
    const bow = bowOf(wren);
    return [...all.filter((x) => x.kind === "title" || x.kind === "arch"), all.find((x) => x.kind === "attuned" && x.a === bow), passiveOn(wren, bow)];
  };
  const bramFits = () => {
    const all = thingsOf(bram);
    const hammer = hammerOf(bram);
    return [all.find((x) => x.kind === "title" && /\bwall\b/i.test(x.name)), all.find((x) => x.kind === "perm" && /^guard one person$/i.test(x.name)), all.find((x) => x.kind === "arch" && x.name === "Guardian"), all.find((x) => x.kind === "attuned" && x.a === hammer), passiveOn(bram, hammer)];
  };
  const ready = () => Boolean(isolde && wren && bram && bowOf(wren) >= 0 && hammerOf(bram) >= 0 && wrenFits().every(Boolean) && bramFits().every(Boolean));
  const wrenRoll = (friends = []) => R.countRoll(wren, R.freshRoots(wren), { root: "Body", using: wrenFits().map((x) => x.key), friends });
  const bramSteps = () => bramFits().length;
  const total = () => wrenRoll([bramSteps()]).total;
  const auraMax = () => wren.numbers.aura ?? 5;
  const stamina = () => isolde.numbers.stamina?.die ?? 12;
  const thing = (c, i) => c.attuned[i].name.replace(/^(Her|His|Their) /, (m) => m.toLowerCase());
  // "both her Titles, Hunter twice, her longbow and Long shot", off the sheet.
  const said = (list, whose) => {
    const titles = list.filter((x) => x.kind === "title");
    const archs = list.filter((x) => x.kind === "arch");
    const same = archs.length > 1 && archs.every((x) => x.name === archs[0].name);
    const parts = [
      titles.length > 1 ? `both ${whose} Titles` : titles.map((x) => `<em>${esc(x.name.replace(/^The /, "the "))}</em>`)[0],
      ...list.filter((x) => x.kind === "perm").map((x) => `<em>${esc(x.name)}</em>`),
      same ? `${esc(archs[0].name)} twice` : archs.map((x) => esc(x.name)).join(" and "),
      ...list.filter((x) => x.kind === "attuned").map((x) => esc(x.name.replace(/^(Her|His|Their) /, (m) => m.toLowerCase()))),
      ...list.filter((x) => x.kind === "awk").map((x) => `<em>${esc(x.name)}</em>`),
    ].filter(Boolean);
    return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0] ?? "";
  };
  let L;
  let stop = null;
  const reset = () => {
    stop?.();
    stop = null;
    L = { step: 0, in: [], dice: [], opp: 0, rolled: false, real: false, pads: null, tumbling: false, paid: false, lost: false, turn: null, focus: null };
  };
  reset();

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
  const die = (d, opts = {}) => kitDie(d, { hide: true, ...opts });

  function stepTelegraph() {
    const [x, y] = odds(stamina(), CLUB);
    return `<p>Every round starts with the GM saying what’s coming, before anything’s rolled. That’s a <b>telegraph</b>. ${tip("ln-tele", "What it’s doing, who it’s aimed at and which Root, and how hard, in dice, so everyone can see it coming and choose what to stop.", "What a telegraph says")}</p>
    <p class="ln-gm"><b>GM:</b> The brute swings his club at Isolde’s Body. That’s a d${CLUB}.</p>
    <div class="ln-vs"><div class="ln-who">${die(CLUB, { own: "them" })}<span>The brute’s club</span></div><span class="ln-arrow" aria-hidden="true">↓</span><div class="ln-who">${die(stamina())}<span>Isolde’s Stamina</span></div></div>
    <p>If nobody answers it, it lands at the end of the round, and Isolde rolls her Stamina against it. ${tip("ln-ride", [`Stamina’s the track for her Body. Ties go to her, so a d${stamina()} against a d${CLUB} stops it ${x} times in ${y}.`, "If it gets through, it costs her a size of Stamina."], "Letting it land")}</p>
    <p>This time you’re going to stop it before it ever lands. ${tip("ln-why", ["Bram’s a Guardian, so he could intercept it for free and take it on his own Stamina.", "Answering it’s better than that: every die of yours that wins is Aura."], "Why answer it")}</p>
    ${rule("s-telegraphs")}
    <div class="cc-row ln-foot">${btn("next", "Answer it", "primary")}</div>`;
  }

  const tile = (who, title, says, steps) => {
    const on = L.in.includes(who);
    return `<div class="ln-pick"><button type="button" class="tile card ln-tile${on ? " is-in" : ""}" data-act="learn" data-do="pick" data-who="${who}" aria-pressed="${on}"><span class="tile-dice" aria-hidden="true">${stepsToDice(steps).map((d, j) => die(d, { cls: j ? "is-next" : "" })).join("")}</span><span class="tile-name">${esc(title)}</span><span class="tile-says">${says}</span></button></div>`;
  };

  function stepAnswer() {
    const w = wrenRoll();
    const bs = bramSteps();
    const both = L.in.length === 2;
    const sum = wrenRoll([bs]);
    const dice = stepsToDice(sum.total);
    const all = dice.length === 2 ? "Both dice" : `All ${WORDS[dice.length] ?? dice.length} dice`;
    return `<p>To answer a telegraph, you spend your action and pick the Root that fits the way you’re stopping it. Then everything on your sheet that fits goes in, a step each. ${tip("ln-fits", ["Your Root’s number is its steps, and every Title, permission, archetype, ability, attuned thing, awakening and item you’re using is 1 more.", "Anything that plainly fits is free. Anything you have to explain to make it fit is 1 Aura."], "What goes in")}</p>
    <p>Wren puts an arrow into the brute’s arm, so that’s her Body, and ${said(wrenFits(), "her")} all fit. Tap it to put her action in.</p>
    ${tile("wren", "Wren’s arrow", `Body ${w.rootN}, and ${thingsSaid(w.using.length)} that fit · ${stepsSaid(w.total)}`, w.total)}
    ${L.in.includes("wren") ? `<p>Bram puts his action into the same thing, getting his hammer under the club. Two actions going into one thing is a <b>combo</b>: one of you rolls, on their own Root, and everyone who put an action in adds everything of theirs that fits. ${tip("ln-combo", [`For Bram that’s ${said(bramFits(), "his")}. His Root stays out of it, since it’s Wren’s roll.`], "What Bram puts in")} Tap Bram’s hammer.</p>${tile("bram", "Bram’s hammer", `${thingsSaid(bs)} that fit, and no Root · ${stepsSaid(bs)}`, bs)}` : ""}
    ${both ? `<div class="ln-sum"><div class="ln-dice">${dice.map((d) => die(d, { cls: "big" })).join("")}</div>
      <p><b>${stepsSaid(w.total)} and ${stepsSaid(bs)} is ${stepsSaid(sum.total)}</b> from two actions, on Wren’s Body. ${howDice(sum.total)}. ${tip("ln-split", "A combo doesn’t cost Aura, and every action in it gives you a split, so Wren could break those dice into more, smaller ones.", "What a combo costs")}</p>
      <p>${all} go on the club, and your best die counts.</p></div>${rule("s-teamwork")}` : rule("s-answering")}
    <div class="cc-row ln-foot">${btn("back", "Back")}${btn("next", "Roll it", "primary", both ? "" : " disabled")}</div>`;
  }

  function stepPads() {
    const dice = stepsToDice(total());
    const pad = (label, key, size) => `<fieldset class="cc-pad"><legend>${label}</legend><div class="cc-nums">${Array.from({ length: size }, (_, j) => `<button type="button" class="cc-num" data-act="learn" data-do="pad" data-k="${key}" data-v="${j + 1}" aria-pressed="${L.pads[key] === j + 1}">${j + 1}</button>`).join("")}</div></fieldset>`;
    const done = dice.every((_, i) => L.pads[i]) && L.pads.opp;
    return `<p>Roll them, then tap what each one came up.</p>
    ${dice.map((d, i) => pad(`Your d${d}${dice.length > 1 ? `, the ${["first", "second", "third"][i] ?? "next"}` : ""}`, i, d)).join("")}${pad(`The brute’s d${CLUB}`, "opp", CLUB)}
    <div class="cc-row ln-foot">${btn("unpad", "Back")}${btn("pad-done", "See how it went", "primary", done ? "" : " disabled")}</div>`;
  }

  // The Aura Wren's roll pays her: 1 for every die that won and every top
  // face, as they land. A tie bought with Aura pays nothing back. She's
  // acting, so it can go past her maximum till she's finished.
  function auraOf(out) {
    const won = L.dice.filter((d) => d.nat > L.opp).length;
    const tops = L.dice.filter((d) => d.nat === d.size).length;
    const paid = out === "won" ? 1 : 0;
    return { won, tops, n: won + tops, paid, now: auraMax() - paid + won + tops };
  }
  function auraView(out) {
    const a = auraOf(out);
    const max = auraMax();
    const said = [a.won ? `${a.won === 1 ? "one die" : `${WORDS[a.won] ?? a.won} dice`} won` : "", a.tops ? `${a.tops === 1 ? "one came up on its top face" : `${WORDS[a.tops] ?? a.tops} came up on their top faces`}` : ""].filter(Boolean).join(", and ");
    const pays = tip("ln-pays", "Every die that wins pays 1 Aura, and so does every top face, and whoever rolls gets it.", "What pays Aura");
    const head = out === "won" ? `Wren paid 1 Aura for the tie, and a tie that’s bought pays nothing back${a.n ? `, but ${said}, so that’s ${a.n} Aura` : ""}.` : a.n ? `${said[0].toUpperCase()}${said.slice(1)}, so Wren gets ${a.n} Aura back.` : "None of Wren’s dice won and none came up on a top face, so there’s no Aura in it.";
    const past = a.now > max ? ` She’s acting, so she’s on ${a.now}, past her ${max}. ${tip("ln-past", `Once she’s finished acting, anything over ${max}’s gone, so she’d spend it first: on an extra action for ${R.extraCost(0)}, or on <em>Hit anything I can see</em>.`, "Past her maximum")}` : "";
    return `<div class="ln-aura"><p>${head} ${pays}${past}</p><p class="ln-hex"><span class="k">Wren’s Aura</span>${kitAura(a.now, Math.max(max, a.now))}<b>${a.now}</b></p></div>`;
  }

  function stepRoll() {
    if (L.pads) return stepPads();
    const dice = stepsToDice(total());
    if (!L.rolled) {
      return `<p>Wren rolls the lot: ${named(dice, "the")} against the brute’s d${CLUB}. Beat it and it never lands. ${tip("ln-lose", ["Lose, and it lands on Isolde at once, and nobody rolls her Stamina against it.", "A tie’s a loss, unless you pay 1 Aura."], "If it loses")}</p>
      <div class="cc-row ln-foot">${btn("back", "Back")}${btn("real", "Roll real dice")}${btn("roll", "Roll the dice", "primary")}</div>`;
    }
    const spin = L.tumbling;
    const b = best();
    const out = spin ? null : outcome();
    const first = L.dice.findIndex((d) => d.nat === b);
    const mark = { beat: "beat", won: "won", tie: "tie", lands: "under" }[out];
    const face = (d, i) => kitDie(d.size, { face: d.nat, spin, state: spin ? "" : d.nat === d.size ? "top" : out === "lands" ? "low" : out === "tie" && i === first ? "tie" : "", label: `Wren’s d${d.size} came up ${d.nat}` });
    const rows = L.dice.map((d, i) => `<li class="res is-${spin ? "spin" : i === first ? mark : "none"}">${face(d, i)}<span class="res-die">d${d.size}</span>${!spin && i === first ? '<b class="res-out">Your best</b>' : ""}${!spin && d.nat === d.size ? '<span class="res-note">Top face</span>' : ""}</li>`).join("");
    const from = stamina();
    const to = sizeDown(from);
    const coat = (isolde.armour ?? []).find((a) => a.root !== "Body");
    const words = {
      beat: `<h3 id="ln-out" tabindex="-1">It never lands</h3><p>Your ${b} beats the brute’s ${L.opp}, so the club never comes down. Isolde’s fine, and Wren and Bram have both used their action for the round.</p>`,
      won: `<h3 id="ln-out" tabindex="-1">It never lands</h3><p>You pay 1 Aura, so the tie’s yours, and the club never comes down. Isolde’s fine, and Wren and Bram have both used their action for the round.</p>`,
      tie: `<h3 id="ln-out" tabindex="-1">A tie</h3><p>Your ${b} ties the brute’s ${L.opp}. A tie’s a loss, unless you pay 1 Aura.</p><div class="cc-row">${btn("win", "Win the tie: 1 Aura")}${btn("lose", "Let it land")}</div>`,
      lands: `<h3 id="ln-out" tabindex="-1">It lands on Isolde</h3><p>${b === L.opp ? `Your ${b} ties the brute’s ${L.opp}, and a tie’s a loss` : `The brute’s ${L.opp} beats your best, a ${b}`}, so the club lands on Isolde at once, and nobody rolls her Stamina against it. Answering’s a gamble, and this one didn’t pay off.</p>
        <p>The GM names what it costs, and for a blow that’s usually a size off the track for that Root, so Isolde’s Stamina drops from d${from} to d${to}.${coat ? ` Armour on her Body could have taken it instead, but ${coat.name.replace(/^an? /i, "her ")} is on her ${coat.root}.` : ""}</p>
        <div class="ln-hurt"><span class="k">Isolde’s Stamina</span>${die(from)}<span class="cc-swing-to" aria-hidden="true">→</span><span class="sr-only">to</span>${kitDie(to, { label: `Isolde’s Stamina is d${to}` })}</div>`,
    };
    return `<div class="ln-roll"${spin ? ' data-act="learn" data-do="skip"' : ""}>
      <div class="cc-them"><span class="k">The brute’s d${CLUB}</span>${kitDie(CLUB, { own: "them", face: L.opp, spin, state: !spin && (out === "beat" || out === "won") ? "low" : "", label: `The brute’s d${CLUB} came up ${L.opp}` })}</div>
      <ul class="cc-res">${rows}</ul></div>
    ${spin ? '<p class="cc-small">Tap the dice to skip.</p>' : `<div class="ln-out">${words[out]}${out === "tie" ? "" : auraView(out)}${out === "tie" ? "" : rule("s-aura")}</div>`}
    ${spin || out === "tie" ? "" : `<div class="cc-row ln-foot">${btn("next", "Next", "primary")}</div>`}`;
  }

  function stepRound() {
    const landed = outcome() === "lands";
    return `<p>That’s a round. The GM telegraphs, everyone takes one action, and whatever nobody answered lands at the end. ${tip("ln-round", ["What lands rolls against the tracks for the Roots it’s at. Then she telegraphs the next one.", `Want more than one action? Buy another with Aura, ${R.extraCost(0)} for the first in a round, then ${R.extraCost(1)}, then ${R.extraCost(2)}.`], "How a round goes")}</p>
    <p>${landed ? "The club’s already landed on Isolde, so there’s nothing left to land, and the round’s over." : "There was only the club, and you stopped it, so nothing lands and the round’s over."}</p>
    <p>Your own character works the same way: pick a Root, tap everything on your sheet that fits, and the phone does the counting.</p>
    ${rule("s-round")}
    <div class="cc-row ln-foot">${btn("again", "Play it again")}<a class="button primary" href="/characters/" data-act="nav">Pick a character</a></div>`;
  }

  function view() {
    const head = `<div class="cc-topbar"><a class="cc-back" href="/characters/" data-act="nav">${k.icon.back}Characters</a>${sound()}</div>
    <header class="cc-head"><p class="kicker">Step ${L.step + 1} of ${STEPS.length}</p><h1>Learn to play</h1>
      <p class="cc-small">One round with Isolde, Wren and Bram. You play Wren and Bram, and the phone does the counting.</p>
      <ol class="ln-dots" aria-hidden="true">${STEPS.map((_, i) => `<li${i <= L.step ? ' class="on"' : ""}></li>`).join("")}</ol></header>`;
    if (!ready()) return `${head}<div class="cc-note is-warn"><p>The learning round needs Isolde, Wren and Bram from the crew, with Wren’s longbow and <em>Long shot</em>, and Bram’s war hammer and <em>Ring the bell</em>, Guardian, <em>guard one person</em> and the Title that makes him a wall, and one of them isn’t in the rules right now.</p></div>`;
    const turn = L.turn;
    L.turn = null;
    const body = [stepTelegraph, stepAnswer, stepRoll, stepRound][L.step]();
    return `${head}<section class="card ln-card${turn ? ` ${TURN[turn]}` : ""}" aria-labelledby="ln-h"><h2 id="ln-h" tabindex="-1">${STEPS[L.step]}</h2>${body}</section>`;
  }

  // After a draw: put focus where a screen reader should be, then forget it.
  function after(app) {
    const id = L.focus;
    L.focus = null;
    if (id) app.querySelector(`#${id}`)?.focus({ preventScroll: id === "ln-out" });
  }

  // The roll has landed: the outcome shows, and gets its sounds.
  function landed(knock) {
    L.tumbling = false;
    const out = outcome();
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
