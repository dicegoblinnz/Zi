// A GM looking at one of her players' characters (campaigns.js), read only:
// the trackers, the set actions and the dice they roll, the rest of the sheet
// in folds that read at a glance, and print. It's drawn the same way as the
// player's own screen, from what their phone last sent to their account.
import { diceLabel, stepsToDice } from "./dice.js";
import { aura as kitAura, die as kitDie, mini as kitMini, pips as kitPips, resolve as kitResolve, scars as kitScars } from "../kit/kit.js";
import { threadLabel, threadState } from "./threads.js";

const PRONOUN = { her: ["she", "her"], him: ["he", "his"], them: ["they", "their"] };

// When their phone last saved them: a time today, or a day and a time.
export function whenOf(at) {
  const t = Date.parse(at || "");
  if (!t) return "";
  const d = new Date(t);
  const time = d.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, "").toLowerCase();
  return d.toDateString() === new Date().toDateString() ? `at ${time}` : `on ${d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })} at ${time}`;
}

// The trackers in a line, for a card in the party.
export function trackLine(c, s, esc) {
  return `<span class="cc-glance"><span>${kitMini(s.conf)}Confidence d${s.conf}</span><span>${kitMini(s.wound, { own: "harm" })}Wound d${s.wound}${s.scars.length ? `, ${s.scars.length} ${s.scars.length === 1 ? "Scar" : "Scars"}` : ""}</span><span>Aura ${s.aura}/${c.numbers.aura}</span><span>Resolve ${s.resolve}/${c.numbers.resolve}</span></span>${s.conditions.length ? `<span class="cc-glance">${s.conditions.map((x) => `<span class="cc-tag is-${x.kind}">${kitMini(x.die, { own: x.kind === "for" ? "you" : "harm" })}<em>${esc(x.name)}</em> d${x.die}</span>`).join("")}</span>` : ""}`;
}

export function lookView(ch, c, x) {
  const { esc, link, steps, crestOf, stepsNow, lineOf, lineLabel, isOut, lastRollView, isOpen, player, back, tools, printing } = x;
  const s = ch.state;
  const n = c.numbers;
  const [they] = PRONOUN[c.pronoun] ?? PRONOUN.them;
  const when = whenOf(ch.saved || ch.made);

  // The same trackers as the player's play screen, with nothing to tap.
  const quiet = (html) => html.replace('role="img"', 'aria-hidden="true"');
  const stat = (key, label, body) => `<div class="cc-stat t-${key}"><span class="k">${label}</span>${body}</div>`;
  const mood = s.conf <= 2 ? '<span class="cc-mood">Shaken</span>' : s.conf >= 12 ? '<span class="cc-mood is-fired">Fired up</span>' : "";
  const conds = s.conditions.length
    ? `<span class="v cc-conds-now">${s.conditions.map((y) => `<span class="cc-tag is-${y.kind}">${kitMini(y.die, { own: y.kind === "for" ? "you" : "harm" })}<em>${esc(y.name)}</em> d${y.die}</span>`).join("")}</span>`
    : '<span class="v cc-none">None on them</span>';
  const track = `<div class="cc-track is-look" role="group" aria-label="${esc(ch.name)}’s Confidence, wound die, Aura, Resolve and conditions">
    ${stat("conf", "Confidence", `${kitDie(s.conf, { hide: true, bare: true })}<span class="cc-now"><span class="v">d${s.conf}</span>${mood}</span>`)}${stat("wound", "Wound die", `${kitDie(s.wound, { own: "harm", hide: true, bare: true })}<span class="cc-now"><span class="v">d${s.wound}</span>${kitScars(s.scars.length)}</span>`)}
    ${stat("aura", "Aura", `<span class="cc-row-in">${quiet(kitAura(s.aura, n.aura))}<span class="v">${s.aura}<small>/${n.aura}</small></span></span>`)}${stat("resolve", "Resolve", `<span class="cc-row-in">${quiet(kitResolve(s.resolve, n.resolve))}<span class="v">${s.resolve}<small>/${n.resolve}</small></span></span>`)}
    ${stat("cond", "Conditions", conds)}
  </div>`;

  const diceOf = (k) => stepsToDice(k).map((d, j) => kitDie(d, { hide: true, cls: j ? "is-next" : "" })).join("");
  const defend = c.actions.find((a) => a.name === "Defend") ?? { name: "Defend", steps: 1, lines: [] };
  const tiles = c.actions.map((a) => {
    const now = stepsNow(c, s, a);
    return `<div class="tile card${now < a.steps ? " is-short" : ""}"><span class="tile-dice" aria-hidden="true">${diceOf(now)}</span><span class="tile-name">${esc(a.name)}</span><span class="tile-says"><span class="tile-steps">${steps(now)}${now < a.steps ? ` <small>${a.steps - now} crossed out</small>` : ""}</span> · <span class="tile-die">${esc(diceLabel(stepsToDice(now)))}</span></span></div>`;
  }).join("");

  // The rest of the sheet, each part a fold that reads at a glance while it's
  // shut. They stay open or shut as the GM leaves them, between looks.
  const fold = (key, title, glance, body) => `<details class="cc-fold" data-open="lk-${key}"${isOpen(`lk-${key}`) ? " open" : ""}><summary><h2 class="cc-fold-t">${title}</h2>${glance ? `<span class="cc-fold-g">${glance}</span>` : ""}</summary><div class="cc-fold-b">${body}</div></details>`;
  const few = (items, max) => (items.length > max ? `${items.slice(0, max).join(" · ")} <small>and ${items.length - max} more</small>` : items.join(" · "));

  const acts = c.actions.map((a) => {
    const now = stepsNow(c, s, a);
    const lines = a.lines.map((key) => lineOf(c, key)).filter(Boolean);
    return `<li class="cc-act"><span class="cc-act-dice" aria-hidden="true">${diceOf(now)}</span><div class="cc-act-in"><p><b>${esc(a.name)}</b> <small>${steps(now)}, ${esc(diceLabel(stepsToDice(now)))}${now < a.steps ? `, ${a.steps - now} crossed out` : ""}</small></p>
      <ul class="cc-act-lines">${lines.map((l) => `<li${isOut(s, l) ? ' class="is-out"' : ""}>${kitPips(1)}<span>${isOut(s, l) ? `<s>${lineLabel(l)}</s>` : lineLabel(l)}</span></li>`).join("")}<li>${kitPips(1)}<span>${lines.length ? "The action" : "The action on its own"}</span></li></ul></div></li>`;
  }).join("");
  const actsAt = c.actions.map((a) => `<span class="cc-gl">${kitMini(stepsToDice(stepsNow(c, s, a))[0])}<b>${esc(a.name)}</b> <small>${esc(diceLabel(stepsToDice(stepsNow(c, s, a))))}</small></span>`).join("");

  const titles = c.titles.map((t) => `<div class="cc-item"><p><b><em>${esc(t.name)}</em></b> <small>${t.archetypeId ? link(t.archetypeId, esc(t.archetype)) : esc(t.archetype)}</small></p>
    <ul class="cc-look-list">${t.permissions.map((p) => `<li><em>${esc(p.text)}</em></li>`).join("")}</ul></div>`).join("");
  const titlesAt = c.titles.map((t) => `<span class="cc-gl-line"><em>${esc(t.name)}</em> <small>${esc(t.archetype)} · ${t.permissions.length} ${t.permissions.length === 1 ? "permission" : "permissions"}</small></span>`).join("");

  const traits = c.traits.map((t) => `<div class="cc-item"><p><b>${esc(t.name)}</b> <span class="chip sm">${esc(t.type)}</span>${s.used[t.name] ? ' <span class="chip sm is-used">Gone off this scene</span>' : ""}</p><p>${t.html}</p></div>`).join("");

  const crossed = (where, name) => Boolean(s.crossed[`${where}|${name}`]);
  const thing = (where, name) => `<li${crossed(where, name) ? ' class="is-out"' : ""}>${crossed(where, name) ? `<s>${esc(name)}</s> <small>crossed out</small>` : esc(name)}</li>`;
  const picked = (where) => s.picked.filter((p) => p.where === where).map((p) => p.name);
  const slot = (where, title) => {
    const list = [...(where === "bag" ? c.carry.bag.items ?? [] : c.carry[where].items), ...picked(where)];
    return list.length ? `<h3 class="cc-h3">${title}</h3><ul class="cc-look-list">${list.map((y) => thing(where, y)).join("")}</ul>` : "";
  };
  const carried = [...c.carry.equipment.items.map((y) => ["equipment", y]), ...c.carry.utility.items.map((y) => ["utility", y]), ...(c.carry.keepsake ? [["keepsake", c.carry.keepsake]] : []), ...(c.carry.bag.items ?? []).map((y) => ["bag", y]), ...s.picked.map((p) => [p.where, p.name])]
    .map(([where, y]) => (crossed(where, y) ? `<s>${esc(y)}</s>` : esc(y)));
  const attuned = c.attuned.map((a) => `<div class="cc-item"><p><b>${esc(a.name)}</b>${a.stage ? ` <span class="chip sm">${esc(a.stage)}</span>` : ""}</p><ul class="cc-look-list">${a.permissions.map((p) => `<li><em>${esc(p.text)}</em></li>`).join("")}</ul>${a.catch ? `<p>Its Catch: <em>${esc(a.catch)}</em></p>` : ""}${a.burden ? `<p>Its Burden: <em>${esc(a.burden)}</em></p>` : ""}</div>`).join("");
  const kit = `${slot("equipment", "Equipment")}${slot("utility", "Utility")}${c.carry.keepsake ? `<h3 class="cc-h3">Keepsake</h3><ul class="cc-look-list">${thing("keepsake", c.carry.keepsake)}</ul>` : ""}${slot("bag", `The bag <span class="cc-small">(${esc(c.carry.bag.name)})</span>`)}${c.attuned.length ? `<h3 class="cc-h3">Attuned</h3>${attuned}` : ""}`;

  // In a campaign, a thread with someone else in it is wherever the campaign
  // has it, which can be ahead of what this player's phone last sent.
  const stateOf = (person, t) => x.bond?.(person, t) ?? threadState(s, person, t);
  const threads = c.threads.map((p) => `<div class="cc-person"><h3>${esc(p.person)}</h3><ul class="cc-look-list">${p.threads.map((t) => {
    const st = stateOf(p.person, t);
    return `<li class="cc-thread is-${t.kind === "hostile" ? "hostile" : "bond"} is-${st}"><p><em>${esc(t.text)}</em>${t.whose ? ` <small>(${esc(t.whose)} words)</small>` : ""} <span class="chip sm">${threadLabel(t, st)}</span></p></li>`;
  }).join("")}</ul></div>`).join("");
  const threadsAt = c.threads.map((p) => {
    const states = p.threads.map((t) => ({ t, st: stateOf(p.person, t) }));
    const hostile = states.some((y) => y.t.kind === "hostile");
    const worst = states.find((y) => y.st === "snapped") ?? states.find((y) => y.st === "strained");
    return `${esc(p.person)}${hostile || worst ? ` <small>${[hostile ? "hostile" : "", worst ? worst.st : ""].filter(Boolean).join(", ")}</small>` : ""}`;
  });
  const bites = [...c.attuned.filter((a) => a.catch).map((a) => a.catch), ...s.scars.filter(Boolean), ...c.trouble];
  const notes = String(s.notes ?? "").trim();

  return `<div class="cc-topbar"><a class="cc-back" href="${esc(back.href)}" data-act="k" data-do="back">${x.icon.back}${esc(back.label)}</a><div class="cc-tools">${tools}</div></div>
  <header class="cc-head cc-char">${crestOf(c)}<div class="cc-who"><h1>${esc(ch.name)}</h1><p class="cc-title"><em>${esc(c.title)}</em></p>
    <p class="cc-small">${esc(player)}’s character${c.archetypes.length ? ` · ${c.archetypes.map(esc).join(" · ")}` : ""} · Stride ${n.stride}</p></div></header>
  <p class="cc-small cc-fresh">${when ? `Last changed on ${esc(player)}’s phone ${when}. ` : ""}It’s ${esc(player)}’s to play, so you see it as it stands.</p>
  ${s.dead ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} died in play.</b></p></div>` : s.blaze ? `<div class="cc-note is-warn"><p><b>${esc(ch.name)} Blazed,</b> and ${they}${they === "they" ? "’re" : "’s"} deciding what comes of it.</p></div>` : ""}
  ${track}
  <section class="cc-sec cc-play cc-look-play" aria-labelledby="lk-actions"><h2 id="lk-actions" class="sr-only">Set actions</h2>
    <div class="cc-tiles">${tiles}<div class="tile card tile-defend"><span class="tile-dice" aria-hidden="true">${diceOf(stepsNow(c, s, defend))}</span><span class="tile-name">When it lands</span><span class="tile-sub">Defend ${esc(diceLabel(stepsToDice(stepsNow(c, s, defend))))} · Confidence d${s.conf}</span></div></div>
    ${lastRollView(s.last)}</section>
  <div class="cc-folds">
    ${fold("acts", "Set actions", `<span class="cc-gl-wrap">${actsAt}</span>`, `<ul class="cc-acts">${acts}</ul>`)}
    ${fold("titles", c.titles.length === 1 ? "Title and permissions" : "Titles and permissions", titlesAt, titles)}
    ${c.traits.length ? fold("traits", "Traits", few(c.traits.map((t) => esc(t.name)), 6), traits) : ""}
    ${fold("kit", "Kit", `${few(carried, 7)}${c.attuned.length ? `<span class="cc-gl-line"><small>Attuned:</small> ${c.attuned.map((a) => esc(a.name)).join(" · ")}</span>` : ""}`, kit)}
    ${fold("threads", "Threads", few(threadsAt, 5) || "None yet", threads || '<p class="cc-lead">None yet.</p>')}
    ${bites.length ? fold("trouble", "Catches and trouble", few(bites.map((b) => `<em>${esc(b)}</em>`), 3), `<ul class="cc-look-list">${bites.map((b) => `<li><em>${esc(b)}</em></li>`).join("")}</ul>`) : ""}
    ${fold("asp", "Aspiration", `<span class="cc-gl">${kitMini(s.asp)}<em>${esc(s.aspText || c.aspiration.text)}</em> <small>d${s.asp}</small></span>`, `<p><em>${esc(s.aspText || c.aspiration.text)}</em>, against a d${s.asp}.</p>`)}
    ${fold("notes", "Notes", notes ? esc(notes.split("\n")[0].length > 70 ? `${notes.split("\n")[0].slice(0, 68)}…` : notes.split("\n")[0]) : "Nothing written yet", notes ? `<p class="cc-look-notes">${esc(notes)}</p>` : '<p class="cc-lead">Nothing written yet.</p>')}
  </div>
  <div class="cc-row cc-look-foot"><button type="button" class="button" data-act="k" data-do="print"${printing ? " disabled" : ""}>${printing ? "Filling in the sheet…" : `Print ${esc(ch.name)}’s sheet`}</button></div>${x.extra ?? ""}`;
}
