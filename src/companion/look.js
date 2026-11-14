// A GM looking at one of her players' characters (campaigns.js), read only:
// the trackers, the Roots and the dice each rolls on its own, the last roll,
// the rest of the sheet in folds that read at a glance (where each Root's
// points came from among them), and print. It's drawn with the same pieces as
// the player's own screen (app.js hands them over), from what their phone last
// sent to their account.
import { diceLabel, stepsToDice } from "./dice.js";
import { die as kitDie, mini as kitMini } from "../kit/kit.js";
import { threadKey } from "./threads.js";
import * as R from "./roots.js";

const PRONOUN = { her: ["she", "her"], him: ["he", "his"], them: ["they", "their"] };

// When their phone last saved them: a time today, or a day and a time.
export function whenOf(at) {
  const t = Date.parse(at || "");
  if (!t) return "";
  const d = new Date(t);
  const time = d.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
  return d.toDateString() === new Date().toDateString() ? `at ${time}` : `on ${d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })} at ${time}`;
}

// The trackers in a line, for a card in the party: each track and its Scars,
// and Aura.
export function trackLine(c, s, esc) {
  const scars = R.TRACKS.reduce((t, k) => t + (s.scars?.[k]?.length ?? 0), 0);
  return `<span class="cc-glance">${R.TRACKS.map((t) => `<span>${kitMini(s.tracks[t])}${R.TRACK[t].name} d${s.tracks[t]}</span>`).join("")}<span>Aura ${s.aura}/${c.numbers.aura}${scars ? `, ${scars} ${scars === 1 ? "Scar" : "Scars"}` : ""}</span></span>${s.conditions.length ? `<span class="cc-glance">${s.conditions.map((x) => `<span class="cc-tag is-${x.kind}">${kitMini(x.die, { own: x.kind === "for" ? "you" : "harm" })}<em>${esc(x.name)}</em> d${x.die}</span>`).join("")}</span>` : ""}`;
}

export function lookView(ch, c, x) {
  const { esc, crestOf, lastRollView, player, back, tools, printing, trackView, sheetFolds, archNames } = x;
  const s = ch.state;
  const n = c.numbers;
  const [they] = PRONOUN[c.pronoun] ?? PRONOUN.them;
  const when = whenOf(ch.saved || ch.made);
  // Where a thread with someone else in the campaign has got to, which can be
  // ahead of what this player's phone last sent.
  if (typeof x.bond === "function") {
    for (const p of c.threads) for (const t of p.threads) {
      const now = x.bond(p.person, t);
      if (now) s.threads[threadKey(p.person, t)] = now;
    }
  }
  const diceOf = (k) => stepsToDice(k).map((d, j) => kitDie(d, { hide: true, cls: j ? "is-next" : "" })).join("");
  // The Roots as the dice each one rolls on its own. Everything on the sheet
  // that fits comes on top, a step each.
  const roots = R.ROOTS.map((root) => `<div class="tile card is-root"><span class="tile-dice" aria-hidden="true">${c.roots[root] ? diceOf(c.roots[root]) : kitDie(2, { hide: true })}</span><span class="tile-name">${root}</span><span class="tile-says"><span class="tile-steps">${c.roots[root]} ${c.roots[root] === 1 ? "step" : "steps"}</span><span class="tile-die">${c.roots[root] ? esc(diceLabel(stepsToDice(c.roots[root]))) : "a d2"}</span></span></div>`).join("");

  return `<div class="cc-topbar"><a class="cc-back" href="${esc(back.href)}" data-act="k" data-do="back">${x.icon.back}${esc(back.label)}</a><div class="cc-tools">${tools}</div></div>
  <header class="cc-head cc-char">${crestOf(c)}<div class="cc-who"><h1>${esc(ch.name)}</h1><p class="cc-title"><em>${esc(c.title)}</em></p>
    <p class="cc-small">${esc(player)}’s character${c.archetypes.length ? ` · ${archNames(c).map(esc).join(" · ")}` : ""} · Stride ${n.stride}</p></div></header>
  <p class="cc-small cc-fresh">${when ? `Last changed on ${esc(player)}’s phone ${when}. ` : ""}It’s ${esc(player)}’s to play, so you see it as it stands.</p>
  ${s.dead ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} ${s.retired ? "retired" : "died"} in play.</b></p></div>` : s.blaze ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} Blazed,</b> and ${they}${they === "they" ? "’re" : "’s"} deciding what comes of it.</p></div>` : ""}
  ${trackView(ch, c)}
  <section class="cc-sec cc-play cc-look-play" aria-labelledby="lk-roots"><h2 id="lk-roots" class="cc-h3 cc-play-h">Roots <small>and everything that fits on top</small></h2>
    <div class="cc-tiles cc-roots">${roots}</div>
    ${lastRollView(s.last)}</section>
  <div class="cc-folds">${sheetFolds(ch, c)}</div>
  <div class="cc-row cc-look-foot"><button type="button" class="button" data-act="k" data-do="print"${printing ? " disabled" : ""}>${printing ? "Filling in the sheet…" : `Print ${esc(ch.name)}’s sheet`}</button></div>${x.extra ?? ""}`;
}
