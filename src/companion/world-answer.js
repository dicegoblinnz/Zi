// Building by answering (stage 8 of notes/builder-plan.md): the deck on her
// phone, in Build the world after the ground, beside going faction by faction
// and Deal it all. world-make.js draws the screens round it and hands it the
// world in progress, and world-deck.js plays the deck.
//
// The card's held in one hand: swiped one way or the other, or an answer
// tapped at its foot. As it leans, the factions that answer touches light up
// in the tiles along the top, which fill in as each faction forms, and a tile
// opens that faction's card so far. An answer that asks for a name or a
// detail turns the card over to the question, with three suggestions off the
// tables, a field for her own words, and Skip it. Not this one deals another
// card for the same need, Undo takes the last answer back, and Deal the rest
// ends the deck there and deals what's still open round what the answers
// made. Once the deck's done, How it came to be is on the same screen, and
// Next is the board. Every word on a card comes off the tables, or she
// writes it.
//
// The deck's kept in the world in progress (W.deck, in zi-make), so it
// carries on after a reload or with no signal. While it's on and she's
// answered a card, the asking and the ground it's playing on stay as they
// are, till she starts it again. Under reduce-motion the card doesn't tilt or
// fly, and the answers are taps.
import { AGES, PARTS, answer, calledOf, current, deckOf, fillPrompt, finish, formedOf, historyOf, notThis, playedOf, prompted, startDeck, undo as undoDeck } from "./world-deck.js";
import { cardsOf, fill, options, resume } from "./world-engine.js";
import { die as kitDie } from "../kit/kit.js";

export const AGE_NAMES = { 1: "Long ago", 2: "In living memory", 3: "This last year", 0: "The rest of it" };
const AGE_LEADS = {
  1: "Where each faction came from, what it took and what it’s like.",
  2: "The deals and the feuds between them, and who owes whom.",
  3: "What’s live now: their agendas, their Faces and their Secrets.",
};
const PART_NAMES = { like: "what it’s like", keep: "what it took", foe: "a rival", friend: "an ally or a debt", agenda: "its agenda", secret: "its Secret", face: "its Face" };
// Who's who, dealt with the ground, and everything past it, which the deck
// forms and its end deals.
const WHO = ["seat", "size", "type", "exc"];
const PAST = ["method", "want", "res", "assets", "agenda", "face", "secret", "name"];
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A deck that's on: started, and its end not dealt yet.
export const deckOn = (W) => Boolean(W?.deck && !W.deck.finished);
// The deck's been played to its end (or Deal the rest ended it there).
export const deckOver = (W) => Boolean(W?.deck?.finished);
// The factions are only who's who: nothing past where they sit, how big they
// are and what they are has been dealt, so the deck can play on them.
export const whoOnly = (W) => Boolean(W) && W.factions.every((f) => f.held || PAST.every((s) => f[s] == null));
// The asking and the ground stay as they are once she's answered a card,
// since the cards were played on them, till she starts the deck again.
export const fixedBy = (W) => (W?.deck?.base ? W.deck.pos ?? 0 : 0);

// How it came to be, a line for every answer, by age, with the names they've
// got now. A line's hers when its answer made a Secret, so it never leaves her
// phone (Mo's pick, 30 Oct: the crew's shown it an age at a time).
export function linesOf(T, W) {
  if (!W?.deck) return [];
  const D = deckOf(T, W.recipe);
  const o = W.deck.open;
  // The card says whether its answer made a Secret. One from before it said
  // so is looked up, and one the tables haven't got any more is hers.
  const hers = (h) => {
    const said = W.deck.cards[h.pos]?.secret;
    if (typeof said === "boolean") return said;
    const m = D.byId.get(h.m);
    return !m || Boolean(m.answers?.[h.side]?.does?.some((fx) => fx.k === "secret"));
  };
  return historyOf(T, W)
    .filter((h) => !o || h.pos !== o.pos)
    .map((h) => ({ pos: h.pos, age: h.age, text: h.text, a: h.a, b: h.b, hers: hers(h) }));
}

// The deck as the record keeps it: which way each card went, without the
// world it started from, so the record stays inside what a world holds.
export const keptDeck = (deck) => (deck ? { ...deck, base: null, up: null, nots: [], open: null } : null);

export function makeAnswer(k) {
  const { d, esc, tables, entryOf, worldOf, setWorld, save, snap, unsnap, changed, to, sureOf, arm, plural } = k;
  // The tile that's open on the card's place, and what to bring into view
  // once the screen's drawn again.
  let tile = -1;
  let tileIn = "";
  let fresh = "";

  // Once there's no card up and no prompt waiting, the deck's run out, and the
  // end deals the rest round what the answers made, once.
  function settle(W) {
    const D = W?.deck;
    if (!D || D.finished || D.open) return false;
    if (!D.done && current(tables(), W)) return false;
    end(W);
    return true;
  }
  function end(W) {
    try {
      finish(tables(), W);
    } finally {
      W.deck.finished = true;
    }
  }
  // Arriving at the deck: it starts, unless she's gone faction by faction
  // (the factions are dealt past who's who), and it's settled.
  function ready(W) {
    if (!W) return false;
    if (!W.deck && whoOnly(W)) {
      startDeck(tables(), W);
      return true;
    }
    return settle(W);
  }
  // Who's who for every faction that's lost some of it (a new seat clears
  // what's on it), and nothing past it.
  function dealWho(W) {
    const T = tables();
    W.factions.forEach((f, i) => {
      if (f.held) return;
      for (const step of WHO) {
        if (step === "exc" ? f.exc !== undefined : f[step] != null) continue;
        f[step] = options(T, W, `f:${i}:${step}`, 1)[0] ?? null;
        if (f[step] == null && step !== "exc") break;
      }
    });
  }
  // Back to who's who, for answering the deck after going faction by faction:
  // everything past it goes, what she'd locked and written on it too.
  function toWho(e, W) {
    W.factions.forEach((f, i) => {
      if (f.held) return;
      for (const step of PAST) {
        f[step] = null;
        delete W.locks[`f:${i}:${step}`];
      }
      f.offers = [];
      for (const k of ["got", "leans", "lost", "spare", "voice"]) delete f[k];
    });
    for (const c of W.crew?.who ?? []) {
      for (const side of ["friend", "foe"]) {
        c[side] = null;
        delete W.locks[`crew:${c.k}:${side}`];
      }
    }
    Object.assign(W, { web: null, needs: null, checks: null, fixes: [], fallbacks: [], deck: null, made: null, minis: [] });
    for (const key of Object.keys(e.hands ?? {})) if (key.startsWith("f:") || key.startsWith("crew:")) delete e.hands[key];
    e.cut = [];
  }

  // ------------------------------------------------------------ drawing it

  // The screen's heading, for world-make.js's head().
  function headOf(W) {
    const D = W?.deck;
    if (!D) return { kicker: "Building the world · The factions", title: "The factions", lead: "You’re going through the factions one at a time, and Next is the first of them." };
    if (D.finished) return { kicker: `Building the world · The deck, ${plural(D.cards.length, "card", "cards")}`, title: "How it came to be", lead: "That’s the deck, and whatever your answers left open is dealt to fit what they made. Next is the board." };
    return { kicker: "Building the world · The deck", title: AGE_NAMES[D.age], lead: AGE_LEADS[D.age] };
  }

  // The three ages, the one that's on filled as far as its parts are formed.
  function ages(F, done) {
    const need = F.factions.length * PARTS[F.age].length;
    const left = F.factions.reduce((n, f) => n + f.left.filter((p) => PARTS[F.age].includes(p)).length, 0);
    const p = need ? 1 - left / need : 1;
    return `<ol class="wa-ages" aria-label="The ages">${AGES.map((a) => {
      const state = done || a < F.age ? "past" : a === F.age ? "now" : "later";
      const fill = state === "past" ? 1 : state === "now" ? p : 0;
      return `<li class="is-${state}"${state === "now" ? ' aria-current="step"' : ""} style="--p:${fill.toFixed(3)}"><span>${AGE_NAMES[a]}</span></li>`;
    }).join("")}</ol>`;
  }
  // A faction's tile: what it's called, and a mark for each part that's
  // formed, by age, with the age that's on brightest.
  function tileOf(f, on, age) {
    const role = on.a === f.i ? "Bringing the card" : on.b === f.i ? "On the card" : "";
    const marks = AGES.map((a) => `<span class="wa-tm${a === age ? " is-now" : ""}">${PARTS[a].map((p) => `<i${f.parts[p] != null ? ' class="on"' : ""}></i>`).join("")}</span>`).join("");
    const got = AGES.flatMap((a) => PARTS[a]).filter((p) => f.parts[p] != null).map((p) => PART_NAMES[p]);
    const left = f.left.map((p) => PART_NAMES[p]);
    const sr = `${cap(f.name)}. ${got.length ? `Formed: ${list(got)}.` : "Nothing formed yet."}${left.length ? ` Still to come: ${list(left)}.` : ""}${role ? ` ${role}.` : ""} Opens its card so far.`;
    return `<li><button type="button" class="wa-tile${role ? " is-card" : ""}${tile === f.i ? " is-open" : ""}" data-act="w" data-do="mk-tile" data-i="${f.i}" aria-pressed="${tile === f.i}" aria-label="${esc(sr)}">
      <span class="wa-tile-n">${esc(cap(f.name))}</span><span class="wa-tile-m" aria-hidden="true">${marks}</span></button></li>`;
  }

  // The card that's up: who's bringing it and their words, and an answer at
  // each side of its foot, each saying which factions it touches.
  function cardOf(c, isNew) {
    const flags = [c.chain ? `Follows on from card ${c.from + 1}` : "", c.last ? "The last card" : ""].filter(Boolean);
    const answers = c.answers.map((a, side) => `<button type="button" class="wa-ans is-${side ? "right" : "left"}" data-act="w" data-do="mk-ans" data-side="${side}" data-touch="${a.touches.join(" ")}"${a.prompt ? ' data-prompt="1"' : ""}><span class="wa-ans-w">${esc(a.text)}</span></button>`).join("");
    return `<article class="wa-card${c.strange ? " is-strange" : ""}${isNew ? " is-new" : ""}" id="wa-up" tabindex="-1" aria-labelledby="wa-who wa-says" data-swipe="1">
      <header class="wa-band"><span>Card ${c.pos + 1}</span>${flags.map((x) => `<span>${esc(x)}</span>`).join("")}${c.strange ? '<span class="wa-odd">Strange</span>' : ""}</header>
      <div class="wa-card-in"><p class="wa-who" id="wa-who">${esc(c.speaker)}</p>
      <p class="wa-says" id="wa-says">“${esc(c.text)}”</p></div>
      <div class="wa-answers" role="group" aria-label="Answer it">${answers}</div></article>`;
  }
  // A prompt: the card it came off turned over to its question, three
  // suggestions, her own words, or skipped. A skipped name's dealt at the
  // end, and anything else skipped is the first suggestion.
  function promptOf(T, W, o, isNew) {
    const p = playedOf(T, W, o.pos);
    const skip = o.kind === "name" ? "Skip it and a name’s dealt at the end." : "Skip it and the first one goes in.";
    const max = 60;
    return `<article class="wa-card is-prompt${isNew ? " is-new" : ""}" id="wa-up" tabindex="-1" aria-labelledby="wa-ask">
      <header class="wa-band"><span>Card ${o.pos + 1}</span><span>Then</span></header>
      <div class="wa-card-in">${p ? `<p class="wa-recap"><span>${esc(p.speaker)}:</span> “${esc(p.text)}” <b>${esc(p.answer)}.</b></p>` : ""}
      <p class="wa-ask" id="wa-ask">${esc(o.ask)}</p>
      ${o.ideas.length ? `<div class="wa-ideas" role="group" aria-labelledby="wa-ask">${o.ideas.map((x, n) => `<button type="button" class="wa-idea" data-act="w" data-do="mk-idea" data-k="${n}">${esc(cap(x.text))}</button>`).join("")}</div>` : ""}
      <form class="cc-form wa-own" data-form="w-mk-word" autocomplete="off"><label class="cc-field">Or your own <input name="own" maxlength="${max}" spellcheck="true" autocomplete="off" enterkeyhint="done"></label><button type="submit" class="button">Use it</button></form>
      <div class="wa-skip"><button type="button" class="button" data-act="w" data-do="mk-skip">Skip it</button><p class="cc-small">${skip}</p></div></div></article>`;
  }
  // A faction's card so far, on the card's place till she goes back to it.
  function soFar(T, W, i) {
    const C = cardsOf(T, W);
    const c = C.factions[i];
    const f = W.factions[i];
    const F = formedOf(T, W).factions.find((x) => x.i === i);
    if (!c || !f || !F) return "";
    const seat = f.seat?.k != null && W.seats[f.seat.k] ? { text: W.seats[f.seat.k].text, name: true } : "";
    const what = f.type ? cap(fill(f.type.text, { seat })).replace(/[.]?$/, ".") : "";
    const size = f.size ? `${cap(f.size.size)}, ${T.regions[W.recipe.region]?.sizes?.[f.size.size] ?? ""}` : "";
    const got = AGES.flatMap((a) => PARTS[a]).filter((p) => F.parts[p] != null).map((p) => PART_NAMES[p]);
    const holds = [...c.res.map((r) => r.text), ...c.assets.filter((a) => !a.off).map((a) => a.text)];
    const row = (h, body) => (body ? `<div><dt>${h}</dt><dd>${body}</dd></div>` : "");
    const did = linesOf(T, W).filter((l) => l.a === i || l.b === i).slice(-6);
    return `<article class="wa-card is-sofar" id="wa-up" tabindex="-1" aria-labelledby="wa-sofar-h">
      <header class="wa-band"><span>So far</span><span>${esc(size)}</span></header>
      <div class="wa-card-in"><div class="wa-sofar-top">${f.size?.die ? kitDie(f.size.die, { own: "them", label: `Power d${f.size.die}` }) : ""}<h2 id="wa-sofar-h">${esc(cap(calledOf(T, W, i)))}</h2></div>
      <p class="wa-sofar-is">${esc([what, c.sits].filter(Boolean).join(" "))}</p>
      <dl class="wa-sofar-dl">${row("Formed", got.length ? esc(cap(list(got))) : "Nothing yet")}${row("Still to come", F.left.length ? esc(cap(list(F.left.map((p) => PART_NAMES[p])))) : "")}
        ${row("It holds", holds.length ? esc(holds.join(" · ")) : "")}${row("Its agenda", f.agenda ? esc(c.agendas[0]?.text ?? "") : "")}${row("Its Face", f.voice?.name ? esc(f.voice.name) : "")}
        ${row("Its Secret", f.secret ? `<em>${esc(c.secret)}.</em> ${esc(c.more)}` : "")}</dl>
      ${c.threads.length ? `<ul class="wa-threads">${c.threads.map((t) => `<li class="is-${t.kind}"><em>${esc(t.text)}</em></li>`).join("")}</ul>` : ""}
      ${did.length ? `<p class="bd-label">What it’s done</p><ol class="wa-did-list">${did.map((l) => `<li>${esc(l.text)}</li>`).join("")}</ol>` : ""}
      <div class="cc-row wa-back"><button type="button" class="button primary" data-act="w" data-do="mk-tile" data-i="-1">Back to the card</button></div></div></article>`;
  }
  // How it came to be, by age: on the deck's last screen, and at Done.
  function storyOf(T, W) {
    const L = linesOf(T, W);
    if (!L.length) return `<p class="cc-small">No cards were answered, so there’s no history to tell. The tables dealt it all.</p>`;
    return AGES.filter((a) => L.some((l) => l.age === a)).map((a) => `<section class="wa-age" aria-labelledby="wa-age-${a}"><h2 id="wa-age-${a}">${AGE_NAMES[a]}</h2>
      <ol class="wa-lines">${L.filter((l) => l.age === a).map((l) => `<li${l.hers ? ' class="is-hers"' : ""}><span class="wa-num"><span class="sr-only">Card </span>${l.pos + 1}</span><span class="wa-line">${esc(l.text)}${l.hers ? '<small class="wa-hers">It made a Secret, so it stays on your phone</small>' : ""}</span></li>`).join("")}</ol></section>`).join("");
  }

  function body(id, e, W) {
    const T = tables();
    const D = W.deck;
    if (!D) {
      const sure = sureOf("deck", id);
      return `<div class="wa-way card"><p>You’ve dealt the factions a step at a time. Answering the deck instead deals them again from where they sit, how big they are and what they are, and what you’ve locked or written on them past that goes.</p>
        <div class="cc-row"><button type="button" class="button${sure ? " danger" : ""}" data-act="w" data-do="mk-deck">${sure ? "Tap again to answer the deck" : "Answer the deck instead"}</button></div></div>`;
    }
    const F = formedOf(T, W);
    if (D.finished) {
      return `${ages(F, true)}<div class="wa-story">${storyOf(T, W)}</div>
        <p class="cc-small wa-after">It all goes on the board hidden. On the World screen you show the crew How it came to be an age at a time, and a line that made a Secret never leaves your phone.</p>`;
    }
    const o = prompted(W);
    const c = o ? null : current(T, W);
    const card = o ? D.cards[o.pos] : c;
    const on = card ? { a: card.a, b: card.b } : {};
    if (tile >= 0 && (tileIn !== id || !F.factions.some((f) => f.i === tile))) tile = -1;
    const key = o ? `p${o.pos}` : c ? `c${c.pos}:${c.m}` : "";
    const isNew = key !== fresh;
    fresh = key;
    const stage = tile >= 0 ? soFar(T, W, tile) : o ? promptOf(T, W, o, isNew) : c ? cardOf(c, isNew) : "";
    // What the last answer did, under the card.
    const before = o ? o.pos - 1 : D.cards.length - 1;
    const last = before >= 0 ? playedOf(T, W, before) : null;
    const did = last ? `<p class="wa-did" role="status"><span>Card ${last.pos + 1}</span> ${esc(last.line)}</p>` : `<p class="wa-did is-first" role="status">${still() ? "Tap an answer" : "Swipe the card one way or the other, or tap an answer"}. Each one forms the factions on the card and writes a line of how it came to be.</p>`;
    const moves = `<div class="wa-moves">
        <button type="button" class="button wa-move" data-act="w" data-do="mk-not"${!c || c.chain || tile >= 0 ? " disabled" : ""}>Not this one</button>
        <button type="button" class="button wa-move" data-act="w" data-do="mk-undo" data-c="${esc(id)}"${D.log.length ? "" : " disabled"}>Undo</button></div>
      ${c?.chain && tile < 0 ? `<p class="cc-small wa-hint-l">It follows on from card ${c.from + 1}, so it can’t be passed over.</p>` : ""}`;
    const way = D.pos === 0 && !o ? `<div class="wa-alt"><button type="button" class="pt-reword" data-act="w" data-do="mk-way">Go faction by faction instead</button></div>` : "";
    return `${ages(F, false)}<div class="wa-tiles-w"><ul class="wa-tiles" aria-label="The factions">${F.factions.map((f) => tileOf(f, on, F.age)).join("")}</ul></div>
      <div class="wa-stage">${stage}</div>${tile >= 0 ? "" : did}${moves}${way}`;
  }

  // The bar's own button on the deck: Deal the rest while it's on (a tap
  // again, since it ends the deck there), and Next once it's done.
  function go(id, W) {
    if (deckOn(W)) {
      const sure = sureOf("rest", id);
      return `<button type="button" class="button bd-next${sure ? " danger" : ""}" data-act="w" data-do="mk-rest"><span>${sure ? "Tap again" : "Deal the rest"}</span><small>${sure ? "It ends the deck here" : "Then the board"}</small></button>`;
    }
    return "";
  }

  // ------------------------------------------------------------ taps

  // A tap on the deck: the world after it, drawn again, with the card in view.
  function moved(id, W, say = "") {
    settle(W);
    save(id);
    changed(id, say, Boolean(say));
    requestAnimationFrame(bring);
  }
  // The card that's up takes the focus, and comes into view if it's gone
  // off the screen, so a keyboard or a screen reader's on it.
  function bring() {
    const up = document.getElementById("wa-up");
    if (!up) return;
    const box = up.getBoundingClientRect();
    const bar = document.querySelector(".wk .bd-foot")?.getBoundingClientRect().height ?? 0;
    if (box.top < 0 || box.bottom > innerHeight - bar) up.scrollIntoView({ block: "center", behavior: still() ? "auto" : "smooth" });
    up.focus({ preventScroll: true });
  }
  const ACT = {
    "mk-ans": (el, id) => {
      const W = worldOf(id);
      const side = Number(el.dataset.side);
      if (!W?.deck || W.deck.finished || (side !== 0 && side !== 1)) return;
      snap(id);
      if (!answer(tables(), W, side)) return unsnap(id);
      tile = -1;
      moved(id, W);
    },
    "mk-not": (el, id) => {
      const W = worldOf(id);
      const c = W?.deck && !W.deck.finished ? current(tables(), W) : null;
      if (!c || c.chain) return;
      snap(id);
      notThis(tables(), W);
      moved(id, W);
    },
    "mk-idea": (el, id) => {
      const W = worldOf(id);
      const o = W ? prompted(W) : null;
      const n = Number(el.dataset.k);
      if (!o || !o.ideas[n]) return;
      snap(id);
      fillPrompt(tables(), W, { pick: n });
      moved(id, W);
    },
    "mk-skip": (el, id) => {
      const W = worldOf(id);
      if (!W || !prompted(W)) return;
      snap(id);
      fillPrompt(tables(), W, { skip: true });
      moved(id, W);
    },
    "mk-tile": (el, id) => {
      const i = Number(el.dataset.i);
      tile = Number.isInteger(i) && i >= 0 && i !== tile ? i : -1;
      tileIn = id;
      d.render();
      requestAnimationFrame(bring);
    },
    // Going faction by faction instead, before the first answer.
    "mk-way": (el, id) => {
      const W = worldOf(id);
      if (!W?.deck || W.deck.pos) return;
      snap(id);
      W.deck = null;
      save(id);
      to(id, "f:0:1", "next");
    },
    // Answering the deck after all, which deals the factions again from who's who.
    "mk-deck": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      if (!e || !W || W.deck) return;
      if (!sureOf("deck", id)) {
        arm("deck", id);
        return d.render();
      }
      snap(id);
      toWho(e, W);
      startDeck(tables(), W);
      tile = -1;
      moved(id, W, "The factions are back to where they sit, how big they are and what they are, and the deck’s on its first card.");
    },
    // Starting the deck again, so the asking and the ground can change: back to
    // the world before its first card.
    "mk-restart": (el, id) => {
      const e = entryOf(id);
      const W = worldOf(id);
      if (!e || !fixedBy(W)) return;
      if (!sureOf("restart-deck", id)) {
        arm("restart-deck", id);
        return d.render();
      }
      snap(id);
      const back = resume(tables(), JSON.parse(JSON.stringify(W.deck.base)));
      back.deck = null;
      setWorld(id, back);
      // What was dealt for the factions and the crew goes with it.
      for (const key of Object.keys(e.hands ?? {})) if (key.startsWith("f:") || key.startsWith("crew:")) delete e.hands[key];
      e.cut = [];
      tile = -1;
      save(id);
      changed(id, "The deck’s back before its first card. Change what you like here, and it starts again when you get to it.");
    },
  };
  // Her own words for a prompt.
  function submit(kind, form, f, id) {
    if (kind !== "w-mk-word") return false;
    const W = worldOf(id);
    if (!W || !prompted(W)) return true;
    const text = String(f.get("own") ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (!text) {
      form.querySelector("input")?.focus();
      return true;
    }
    snap(id);
    fillPrompt(tables(), W, { text });
    moved(id, W);
    return true;
  }
  // Undo with nothing kept to take back (after a reload): the last answer
  // played back off the deck itself, since the ground can't have moved.
  function undoLast(id) {
    const W = worldOf(id);
    if (!deckOn(W) || !W.deck.log.length || !W.deck.base) return false;
    const back = undoDeck(tables(), W);
    setWorld(id, back);
    tile = -1;
    save(id);
    return true;
  }

  // ------------------------------------------------------------ the swipe

  // The card follows a thumb sideways and tilts, the answer it's leaning to
  // fills, and the tiles that answer touches light up. Far enough, or a
  // flick, and it flies off that way and that's the answer.
  function after(root, id) {
    const el = root?.querySelector(".wa-card[data-swipe]");
    if (!el || el.dataset.wired) return;
    el.dataset.wired = "1";
    const tiles = [...root.querySelectorAll(".wa-tile")];
    const answers = [...el.querySelectorAll(".wa-ans")];
    const light = (side) => {
      const on = side == null ? [] : (answers[side]?.dataset.touch ?? "").split(" ").filter(Boolean);
      for (const t of tiles) t.classList.toggle("is-touch", on.includes(t.dataset.i));
      answers.forEach((a, n) => a.classList.toggle("is-lean", n === side));
    };
    // A keyboard or a pointer on an answer lights what it touches, too.
    for (const a of answers) {
      const side = Number(a.dataset.side);
      a.addEventListener("focus", () => light(side));
      a.addEventListener("blur", () => light(null));
      a.addEventListener("pointerenter", (ev) => ev.pointerType === "mouse" && light(side));
      a.addEventListener("pointerleave", (ev) => ev.pointerType === "mouse" && light(null));
    }
    el.addEventListener("keydown", (ev) => {
      if (ev.target !== el || (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight")) return;
      ev.preventDefault();
      ACT["mk-ans"](answers[ev.key === "ArrowLeft" ? 0 : 1], id);
    });
    if (still()) return;
    let x0 = null;
    let y0 = 0;
    let t0 = 0;
    let dx = 0;
    let on = false;
    let gone = false;
    // A drag that started on an answer isn't a tap on it as well.
    let dragged = false;
    el.addEventListener("click", (c) => {
      if (!dragged) return;
      c.stopPropagation();
      c.preventDefault();
    }, { capture: true });
    const lean = () => (Math.abs(dx) > 24 ? (dx < 0 ? 0 : 1) : null);
    el.addEventListener("pointerdown", (ev) => {
      if (gone || (ev.pointerType === "mouse" && ev.button !== 0)) return;
      x0 = ev.clientX;
      y0 = ev.clientY;
      t0 = ev.timeStamp;
      dx = 0;
      on = false;
    });
    el.addEventListener("pointermove", (ev) => {
      if (x0 == null || gone) return;
      dx = ev.clientX - x0;
      if (!on && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(ev.clientY - y0) * 1.3) {
        on = true;
        el.setPointerCapture?.(ev.pointerId);
        el.classList.add("is-moving");
      }
      if (!on) return;
      el.style.transform = `translateX(${dx}px) rotate(${(dx / el.offsetWidth) * 10}deg)`;
      light(lean());
    });
    const stop = (ev) => {
      if (x0 == null || gone) return;
      const flick = Math.abs(dx) > 40 && Math.abs(dx) / Math.max(1, ev.timeStamp - t0) > 0.6;
      const far = Math.abs(dx) > Math.min(130, el.offsetWidth * 0.32);
      const side = on && (far || flick) ? (dx < 0 ? 0 : 1) : null;
      x0 = null;
      el.classList.remove("is-moving");
      if (!on) return;
      on = false;
      dragged = true;
      setTimeout(() => (dragged = false), 0);
      if (side == null) {
        el.style.transform = "";
        return light(null);
      }
      gone = true;
      const dir = side ? 1 : -1;
      const fly = el.animate([{ transform: el.style.transform || "none" }, { transform: `translateX(${dir * 115}%) rotate(${dir * 16}deg)`, opacity: 0 }], { duration: 200, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
      fly.onfinish = () => ACT["mk-ans"](answers[side], id);
    };
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", () => {
      x0 = null;
      on = false;
      el.classList.remove("is-moving");
      el.style.transform = "";
      light(null);
    });
  }

  return { ready, settle, end, dealWho, headOf, body, go, ACT, submit, undoLast, after, storyOf, reset: () => (tile = -1) };
}
