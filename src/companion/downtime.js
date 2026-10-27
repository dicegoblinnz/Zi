// Downtime on the phone: two slots, and what they buy lands on the sheet when
// the player finishes, with one undo for the lot. The choices are Downtime's:
// face a pressure, recover, grow, or put a slot toward the crew. Swapping a
// permission, mending a strained bond thread and marking that you did right
// by someone you've a hostile thread with don't take a slot, and wounds clear
// for free when it's over. The card's a draft until it's finished, kept on
// the page by character (not saved), so closing it and coming back keeps
// what's picked.

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";
import { MAX_PERMS, attunedRoom } from "./grow.js";
import { threadKey, threadState } from "./threads.js";
import { isBroken, keyOf, many, mend, nameOf, pieceAt, tickedOf, worn, yours } from "./armour.js";

const CHOICES = [
  ["Face a pressure", [["pressure", "Deal with a pressure"]]],
  ["Recover", [["mend", "Mend something"]]],
  ["Grow", [["perm", "A new permission"], ["trait", "A new trait"], ["asp", "Chase your Aspiration"], ["thread", "Deepen a bond"], ["get", "Get something"], ["att", "Attune"]]],
  ["The crew", [["party", "Toward the crew"]]],
];
const LABEL = Object.fromEntries(CHOICES.flatMap(([, list]) => list));
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"];
// A permission goes on two set actions at most, Defend included.
const MAX_ON = 2;
// Where downtime clears the wound die to: d2, a size up for each Scar.
const floorNow = (c, s) => Math.min(12, (c.numbers.wound ?? 2) + 2 * (Array.isArray(s.scars) ? s.scars.length : 0));
// What a slot can mend: anything crossed out, and a piece of armour with
// boxes ticked, every box at once.
function crossed(c, s) {
  const out = Object.keys(s.crossed).filter((k) => s.crossed[k]).map((key) => {
    const [where, ...rest] = key.split("|");
    return { key, name: nameOf(c, where, rest.join("|")), note: "" };
  });
  for (const a of worn(c, s)) if (!isBroken(s, a)) out.push({ key: keyOf(a), name: nameOf(c, "equipment", a.name), note: `${tickedOf(s, a)} of ${a.boxes} ${a.boxes === 1 ? "box" : "boxes"} ticked` });
  return out;
}
// Every thread with where it stands now.
const threadsOf = (c, s) => c.threads.flatMap((p) => p.threads.map((t) => ({ key: threadKey(p.person, t), person: p.person, text: t.text, kind: t.kind, sheet: t.strained, st: threadState(s, p.person, t) })));
// A strained bond thread is what downtime mends.
const strainedOf = (c, s) => threadsOf(c, s).filter((t) => t.kind !== "hostile" && t.st === "strained");
// A hostile thread that's still there: doing right by them strains it, and
// doing right by them again snaps it.
const grudgesOf = (c, s) => threadsOf(c, s).filter((t) => t.kind === "hostile" && t.st !== "snapped");
const roomFor = (c, s, where) => (where === "bag" ? c.carry.bag.max - (c.carry.bag.items?.length ?? 0) : c.carry[where].max - c.carry[where].items.length) - s.picked.filter((p) => p.where === where).length;

export function makeDowntime({ B, esc, hex, steps, link, icon, lineLabel, throwDie, crewNames, isOpen, rule }) {
  const drafts = new Map();
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const off = (no) => (no ? " disabled" : "");
  const blank = () => ({ k: "" });

  function start(ch) {
    const d = drafts.get(ch.id) ?? { kind: "downtime", id: ch.id, slots: [blank(), blank()], swaps: [], mends: [], rights: [], sure: false };
    d.rights ??= [];
    d.sure = false;
    drafts.set(ch.id, d);
    return d;
  }
  const done = (ch) => drafts.delete(ch.id);
  const at = (d, where) => (String(where)[0] === "w" ? d.swaps[Number(String(where).slice(1))] : d.slots[Number(where)]);

  function can(k, c, s) {
    if (k === "mend") return crossed(c, s).length > 0;
    if (k === "perm") return c.titles.some((t) => t.permissions.length < MAX_PERMS);
    if (k === "att") return c.attuned.some((a) => a.permissions.length < MAX_PERMS);
    return true;
  }

  function fresh(k, c, s) {
    const firstTitle = Math.max(0, c.titles.findIndex((t) => t.permissions.length < MAX_PERMS));
    const firstThing = Math.max(0, c.attuned.findIndex((a) => a.permissions.length < MAX_PERMS));
    return {
      pressure: { k, text: "" }, mend: { k, key: crossed(c, s)[0]?.key ?? "" },
      perm: { k, t: firstTitle, text: "", on: [] },
      trait: { k, name: "", own: false, oname: "", otype: "", otext: "", on: [] },
      asp: { k, on: [], dice: null, opp: null, real: false, pads: [], padOpp: "", rerolls: 0, tie: false, arch: "", text: "", perm: "", tOn: [], pOn: [] },
      thread: { k, person: "", text: "", tkind: "bond" }, get: { k, text: "", where: "bag" },
      att: { k, a: firstThing, text: "", on: [], catch: "", burden: "", up: false }, party: { k, text: "" },
    }[k] ?? blank();
  }

  // What the slots before this one have done, so the second builds on the
  // first: permissions on each Title and attuned thing, a stage gone up, a
  // Catch or Burden written, and the Aspiration's die. Resolve spent on
  // rerolls counts across both.
  function earlier(d, i, s) {
    const out = { perms: {}, att: {}, up: {}, catch: {}, burden: {}, asp: s.asp, waiting: false };
    for (const sl of d.slots.slice(0, i)) {
      if (sl.k === "perm" && sl.text.trim()) out.perms[sl.t] = (out.perms[sl.t] ?? 0) + 1;
      if (sl.k === "att") {
        if (sl.text.trim()) out.att[sl.a] = (out.att[sl.a] ?? 0) + 1;
        if (sl.up) out.up[sl.a] = true;
        if (sl.catch.trim()) out.catch[sl.a] = sl.catch.trim();
        if (sl.burden.trim()) out.burden[sl.a] = sl.burden.trim();
      }
      if (sl.k === "asp") {
        if (!sl.dice) out.waiting = true;
        else if (Math.max(...sl.dice) > sl.opp || sl.tie) out.asp = out.asp >= 12 ? 2 : sizeUp(out.asp);
      }
    }
    return out;
  }
  const spent = (d) => d.slots.reduce((t, sl) => t + (sl.k === "asp" ? sl.rerolls : 0), 0);
  // An attuned thing as it stands once the earlier slot's done.
  function thingAt(c, d, i, j, s) {
    const a = c.attuned[j];
    if (!a) return null;
    const e = earlier(d, i, s);
    const r = attunedRoom(a);
    return { ...a, stage: e.up[j] && r.next ? r.next : r.stage, catch: a.catch || e.catch[j] || null, burden: a.burden || e.burden[j] || null, permissions: { length: a.permissions.length + (e.att[j] ?? 0) }, wentUp: Boolean(e.up[j]) };
  }

  // ---------------------------------------------------------------- drawing

  const toggles = (where, field, list, c) => `<div class="dt-toggles">${c.actions.map((a) => `<button type="button" class="cc-line" data-act="dt" data-do="on" data-s="${where}" data-f="${field}" data-v="${esc(a.name)}"${pressed(list.includes(a.name))}><span class="tick" aria-hidden="true"></span><span>${esc(a.name)} <small>${steps(a.steps)} now</small></span></button>`).join("")}</div>`;
  const chips = (where, field, items, now, label) => `<div class="cc-chips" role="group" aria-label="${esc(label)}">${items.map(([v, text, dis]) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="set" data-s="${where}" data-f="${field}" data-v="${esc(v)}"${pressed(String(now) === String(v))}${off(dis)}>${text}</button>`).join("")}</div>`;
  const field = (where, f, label, value, extra = "") => `<label class="cc-field">${label} <input data-dt="${where}" data-f="${f}" value="${esc(value)}" maxlength="${f === "otext" ? 200 : 120}" autocomplete="off"${extra}></label>`;
  const ruleBox = (key, title, id) => `<details class="cc-own" data-open="${key}"${isOpen(key) ? " open" : ""}><summary>${title}</summary><div class="cc-rule">${rule(id)}</div></details>`;
  const quickTest = () => (B.quickTest?.length ? `<details class="cc-own" data-open="dt-test"${isOpen("dt-test") ? " open" : ""}><summary>The quick test</summary><ol class="cc-rule dt-test">${B.quickTest.map((q) => `<li>${q}</li>`).join("")}</ol></details>` : "");

  function aspView(sl, i, c, s, d) {
    const e = earlier(d, i, s);
    const asp = e.asp;
    const total = 1 + sl.on.length;
    const dice = stepsToDice(total);
    const groups = [["title", "Titles"], ["permission", "Permissions"], ["attuned", "Attuned"], ["trait", "Traits"], ["kit", "What you carry"]].map(([kind, title]) => {
      const list = c.lines.filter((l) => l.kind === kind && (kind !== "trait" || l.step));
      return list.length ? `<h3>${title}</h3>${list.map((l) => `<button type="button" class="cc-line" data-act="dt" data-do="on" data-s="${i}" data-f="on" data-v="${l.key}"${pressed(sl.on.includes(l.key))}${off(sl.dice)}><span class="tick" aria-hidden="true"></span><span>${lineLabel(l)}</span></button>`).join("")}` : "";
    }).join("");
    const head = `<p class="cc-dice">${dice.map((x) => hex(`d${x}`, "on")).join("")}${hex(`d${asp}`, "them")}<span><b>${steps(total)}</b>, ${diceLabel(dice)}, against its d${asp}</span></p>`;
    let body = "";
    if (sl.dice) {
      const best = Math.max(...sl.dice);
      const beat = best > sl.opp || sl.tie;
      const tie = best === sl.opp && !sl.tie;
      const climbs = asp >= 12 ? "It climbs past d12 and resolves." : `It climbs to d${sizeUp(asp)}.`;
      const verdict = beat ? (sl.tie ? `The crew takes the tie. ${climbs}` : `${best} against ${sl.opp}. Beat it. ${climbs}`) : tie ? `${best} against ${sl.opp}. A tie goes to the Aspiration, so it holds at d${asp}.` : `${best} against ${sl.opp}. It holds at d${asp}.`;
      body = `<p class="cc-dice">${sl.dice.map((n, j) => hex(String(n), "on")).join("")}${hex(String(sl.opp), "them")}<span>${dice.length > 1 ? "Your best die counts. " : ""}${esc(verdict)}</span></p>
        ${beat ? "" : `<div class="cc-row">${s.resolve > spent(d) ? `<button type="button" class="button sm" data-act="dt" data-do="asp-again" data-s="${i}">Spend 1 Resolve to roll yours again</button>` : ""}${tie ? `<button type="button" class="button sm" data-act="dt" data-do="asp-tie" data-s="${i}">The crew spends an extra resource to take the tie</button>` : ""}</div>
        <p class="cc-lead">There’s no Aura in downtime. Taking the tie spends one of the crew’s extra resources, so ask the table first.</p>`}
        ${beat && asp >= 12 ? `<h3>Your new Title</h3>
          <label class="cc-field">Its archetype <select id="dt-arch-${i}" data-dt="${i}" data-f="arch"><option value="">Pick one</option>${B.archetypes.map((a) => `<option value="${esc(a.name)}"${sl.arch === a.name ? " selected" : ""}>${esc(a.name)}${c.titles.some((t) => t.archetype === a.name) ? " again" : ""}</option>`).join("")}</select></label>
          ${field(i, "text", "Name it", sl.text)}<p class="cc-lead">Set actions the Title fits</p>${toggles(i, "tOn", sl.tOn, c)}
          ${field(i, "perm", "Its permission", sl.perm)}<p class="cc-lead">Set actions the permission fits</p>${toggles(i, "pOn", sl.pOn, c)}
          <p class="cc-lead">Your Resolve goes up by one with it, and your Aspiration starts again at d2. Write the new one on the Sheet tab.</p>` : ""}`;
    } else if (sl.real) {
      body = `<div class="dt-pads">${dice.map((d, j) => `<label class="cc-field">Your d${d} <input type="number" inputmode="numeric" min="1" max="${d}" data-dt="${i}" data-f="pad" data-j="${j}" value="${esc(sl.pads[j] ?? "")}"></label>`).join("")}
        ${sl.rerolls ? "" : `<label class="cc-field">Its d${asp} <input type="number" inputmode="numeric" min="1" max="${asp}" data-dt="${i}" data-f="padOpp" value="${esc(sl.padOpp)}"></label>`}</div>
        <div class="cc-row"><button type="button" class="button primary" data-act="dt" data-do="asp-call" data-s="${i}">That’s what they rolled</button></div>`;
    } else if (e.waiting) {
      body = `<p class="cc-lead">Roll your first slot’s Aspiration first, since this one rolls against whatever die it leaves.</p>`;
    } else {
      body = `<div class="cc-row"><button type="button" class="button primary" data-act="dt" data-do="asp-roll" data-s="${i}">Roll</button><button type="button" class="button" data-act="dt" data-do="asp-real" data-s="${i}">Roll real dice</button></div>`;
    }
    return `<p class="cc-lead">Roll against its die. You get 1 step for the slot, and one for every line of yours that fits what you’re doing about it. Ties go to the Aspiration. ${link("s-aspiration", "How Aspiration works")}</p>
      ${ruleBox("dt-rolls", "Rolling in downtime", "s-downtime-rolls")}${head}${sl.dice ? "" : `<details class="cc-own" data-open="dt-asp"${isOpen("dt-asp") || sl.on.length ? " open" : ""}><summary>What fits <small>${steps(total)}</small></summary>${groups}</details>`}${body}`;
  }

  function attView(sl, i, c, s, d) {
    const a = thingAt(c, d, i, sl.a, s);
    const items = c.attuned.map((x, j) => [j, esc(x.name), x.permissions.length >= MAX_PERMS]);
    if (!a) return chips(i, "a", items, sl.a, "Which attuned thing");
    const r = attunedRoom(a);
    const stage = sl.up && r.next ? r.next : r.stage;
    const s2 = attunedRoom({ ...a, stage });
    const price = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };
    const full = r.n >= MAX_PERMS;
    const extra = r.n + 1 > s2.base;
    return `${chips(i, "a", items, sl.a, "Which attuned thing")}
      <p class="cc-lead">${esc(a.name.charAt(0).toUpperCase() + a.name.slice(1))} is ${r.stage}, with ${r.n} permission${r.n === 1 ? "" : "s"}${a.wentUp ? " once your first slot’s done" : ""}. ${r.stage} holds ${r.base}, and ${r.base} more with ${price[r.stage]}. ${link("attunement-stages", "The three stages")}</p>
      ${full ? `<p class="cc-warn">Six permissions is the most anything holds.</p>` : `
      ${r.next && !a.wentUp ? `<button type="button" class="cc-line" data-act="dt" data-do="flip" data-s="${i}" data-f="up"${pressed(sl.up)}><span class="tick" aria-hidden="true"></span><span>It’s got its material, so it goes up to ${r.next} <small>found in the story or bought</small></span></button>` : ""}
      ${extra && !a.catch && s2.needs.includes("catch") ? field(i, "catch", `Its Catch <small>it needs one to hold more than ${s2.base}</small>`, sl.catch) : ""}
      ${extra && !a.burden && s2.needs.includes("burden") ? field(i, "burden", `Its Burden <small>a permanent cost, like <em>Bad Knee</em>, and it needs one to hold more than ${s2.base}</small>`, sl.burden) : ""}
      ${field(i, "text", "The permission", sl.text)}
      <p class="cc-lead">Write it as something the thing itself does. Put it on every set action it fits nearly every time.</p>${toggles(i, "on", sl.on, c)}`}`;
  }

  function formView(sl, i, c, s, d) {
    switch (sl.k) {
      case "pressure":
        return `${field(i, "text", "What you’re dealing with", sl.text)}<p class="cc-lead">One slot usually settles a pressure, and the GM says if it needs two. If something pushes back, roll for it.</p>`;
      case "mend":
        return `${chips(i, "key", crossed(c, s).map((x) => [x.key, `${esc(x.name)}${x.note ? ` <small>${esc(x.note)}</small>` : ""}`]), sl.key, "What you’re mending")}<p class="cc-lead">Mending something usually takes a purse of gold as well. Mended armour goes back on your Defend, and every box on it’s clear. ${link("recovering-armour", "Broken armour")}</p>`;
      case "perm": {
        const t = c.titles[sl.t];
        const e = earlier(d, i, s);
        const has = (j) => c.titles[j].permissions.length + (e.perms[j] ?? 0);
        return `${chips(i, "t", c.titles.map((x, j) => [j, `<em>${esc(x.name)}</em> <small>${has(j)} of ${MAX_PERMS}</small>`, has(j) >= MAX_PERMS]), sl.t, "Which Title")}
          ${t ? `<p class="cc-lead">It has to fit inside <em>${esc(t.name)}</em>, and the story should say where you learned it.</p>` : ""}
          ${field(i, "text", "The permission", sl.text)}${quickTest()}
          <p class="cc-lead">Put it on the two set actions it helps most, Defend included. Anywhere else, it’s 1 Aura to bring in.</p>${toggles(i, "on", sl.on, c)}`;
      }
      case "trait": {
        const have = new Set(c.traits.map((t) => t.name));
        const r = B.traits.find((t) => t.name === sl.name);
        const groups = [...new Set(B.traits.map((t) => t.group))];
        return `${chips(i, "own", [["0", "From the list"], ["1", "Write your own"]], sl.own ? "1" : "0", "Where it comes from")}
          ${sl.own ? `${field(i, "oname", "Its name", sl.oname)}${field(i, "otype", "When it works <small>like Passive, or Once per scene</small>", sl.otype)}${field(i, "otext", "What it does", sl.otext)}
            <p class="cc-lead">Write it in the same shape as the list’s. If it gives +1 step, put it on the set actions it fits.</p>${toggles(i, "on", sl.on, c)}`
            : `<label class="cc-field">The trait <select id="dt-trait-${i}" data-dt="${i}" data-f="name"><option value="">Pick a trait</option>${groups.map((g) => `<optgroup label="${esc(g)}">${B.traits.filter((t) => t.group === g && !have.has(t.name)).map((t) => `<option value="${esc(t.name)}"${t.name === sl.name ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</optgroup>`).join("")}</select></label>
            ${r ? `<div class="cc-rule"><p><b>${esc(r.name)}</b> <span class="chip sm">${esc(r.type)}</span></p><p>${r.html}</p></div>${r.step ? `<p class="cc-lead">It’s a step on the set actions it fits.</p>${toggles(i, "on", sl.on, c)}` : ""}` : ""}`}`;
      }
      case "asp":
        return aspView(sl, i, c, s, d);
      case "thread":
        return `${chips(i, "tkind", [["bond", "A bond thread"], ["hostile", "A hostile thread"]], sl.tkind ?? "bond", "What kind of thread")}
          ${field(i, "person", "Who it’s with", sl.person)}${field(i, "text", "The thread", sl.text)}<p class="cc-lead">A bond thread or a hostile one, whichever the story’s given you. If they’re in the crew, it goes on both your sheets, so agree on it together.</p>`;
      case "get": {
        const room = roomFor(c, s, sl.where);
        return `${field(i, "text", "What you’re getting", sl.text)}
          <label class="cc-field">It goes in <select id="dt-where-${i}" data-dt="${i}" data-f="where">${[["bag", "the bag"], ["utility", "utility"], ["equipment", "equipment"]].map(([v, t]) => `<option value="${v}"${sl.where === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
          ${room < 1 ? `<p class="cc-warn">There’s no room there.</p>` : ""}
          <p class="cc-lead">Something to carry, a purse of gold, or the material an attuned thing needs for its next stage, whether it’s bought, made, won or owed.</p>`;
      }
      case "att":
        return attView(sl, i, c, s, d);
      case "party":
        return `${field(i, "text", "What it’s for", sl.text)}<p class="cc-lead">The crew gets one action a downtime, on the party sheet, so play this at the table. Put your slot into the crew’s action and two slots on one move count everything twice. Or chase the Goal, work a project or help someone’s Aspiration with it on its own. It can never be a second move on a faction.</p>`;
      default:
        return "";
    }
  }

  function slotView(d, i, c, s) {
    const sl = d.slots[i];
    const name = `Your ${ORD[i]} slot`;
    if (!sl.k) {
      const groups = CHOICES.map(([title, list]) => {
        const open = list.filter(([k]) => can(k, c, s));
        return open.length ? `<h3>${title}</h3><div class="cc-row">${open.map(([k, label]) => `<button type="button" class="button sm" data-act="dt" data-do="pick" data-s="${i}" data-v="${k}">${label}</button>`).join("")}</div>` : "";
      }).join("");
      return `<fieldset class="cc-group dt-slot"><legend>${name}</legend>${groups}</fieldset>`;
    }
    return `<fieldset class="cc-group dt-slot is-picked"><legend>${name}: ${LABEL[sl.k]}</legend>${formView(sl, i, c, s, d)}
      <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="clear" data-s="${i}">Pick something else</button></div></fieldset>`;
  }

  function swapView(w, n, c) {
    const where = `w${n}`;
    const t = c.titles[w.t];
    return `<div class="dt-swap">${chips(where, "t", c.titles.map((x, j) => [j, `<em>${esc(x.name)}</em>`]), w.t, "Which Title")}
      ${t ? chips(where, "j", t.permissions.map((p, j) => [j, `<em>${esc(p.text)}</em>`]), w.j, "The permission going") : ""}
      ${w.j >= 0 ? `${field(where, "text", "What it becomes", w.text)}<p class="cc-lead">Set actions the new one fits</p>${toggles(where, "on", w.on, c)}` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="swap-off" data-s="${n}">Leave it as it was</button></div></div>`;
  }

  function view(c, s, ch, d) {
    const picked = d.slots.filter((x) => x.k).length;
    const strained = strainedOf(c, s);
    const grudges = grudgesOf(c, s);
    const warn = d.sure ? warnings(d, c, s) : [];
    const free = ["swaps", ...(strained.length ? ["mending"] : []), ...(grudges.length ? ["hostile threads"] : [])];
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Downtime</h2><p class="cc-small">${picked} of 2 slots picked</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${icon.close}</button></div>
    <div class="dlg-body">
      <p class="cc-lead">Pick what each of your two slots is for, and it lands on your sheet when you finish. Three things don’t cost a slot: once-per-downtime traits refresh, all your Resolve comes back, and your wound die goes back to d${floorNow(c, s)}${s.scars?.length ? ", where your Scars keep it" : ""}. ${link("what-you-can-do-with-a-slot", "What a slot can do")}</p>
      ${ruleBox("dt-how", "Your slots, from the rules", "your-slots")}
      ${slotView(d, 0, c, s)}${slotView(d, 1, c, s)}
      <details class="cc-group" data-open="dt-free"${isOpen("dt-free") || d.swaps.length || d.mends.length || d.rights.length ? " open" : ""}><summary>Without a slot <small>${free.length > 1 ? `${free.slice(0, -1).join(", ")} and ${free[free.length - 1]}` : free[0]}</small></summary>
        <h3>Swap a permission</h3>
        <p class="cc-lead">Swap any permission for another that fits its Title, as long as it makes sense for your character.</p>
        ${d.swaps.map((w, n) => swapView(w, n, c)).join("")}
        <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="swap-add">${d.swaps.length ? "Swap another" : "Swap a permission"}</button></div>
        ${strained.length ? `<h3>Mend a strained bond thread</h3><p class="cc-lead">Make it right with them, whatever suits them, and play it out at the table. ${link("s-downtime-threads", "Mending threads")}</p>
          ${strained.map((t) => `<button type="button" class="cc-line" data-act="dt" data-do="mend" data-v="${esc(t.key)}"${pressed(d.mends.includes(t.key))}><span class="tick" aria-hidden="true"></span><span><em>${esc(t.text)}</em> <small>${esc(t.person)}</small></span></button>`).join("")}` : ""}
        ${grudges.length ? `<h3>Did right by them</h3><p class="cc-lead">Doing right by someone you’ve a hostile thread with, like paying what you owe, strains it, and doing right by them again snaps it. Tick the ones you did right by this week.</p>
          ${grudges.map((t) => `<button type="button" class="cc-line" data-act="dt" data-do="right" data-v="${esc(t.key)}"${pressed(d.rights.includes(t.key))}><span class="tick" aria-hidden="true"></span><span><em>${esc(t.text)}</em> <small>${esc(t.person)}, ${t.st === "strained" ? "strained, so it snaps" : "so it strains"}</small></span></button>`).join("")}` : ""}
      </details>
    </div>
    <div class="dlg-foot">${d.say ? `<p class="cc-warn" role="alert">${esc(d.say)}</p>` : ""}${warn.length ? `<div class="cc-warn" role="alert">${warn.map((x) => `<p>${esc(x)}</p>`).join("")}</div>` : ""}
      <button type="button" class="button primary" data-act="dt" data-do="finish">${warn.length ? "Finish anyway" : "Finish downtime"}</button></div>`;
  }

  // ---------------------------------------------------------------- doing

  function warnings(d, c, s) {
    const out = [];
    const tooMany = (on) => on.filter((a) => c.actions.some((x) => x.name === a)).length > MAX_ON;
    d.slots.forEach((sl, i) => {
      const which = `Your ${ORD[i]} slot`;
      const empty = (x) => !String(x ?? "").trim();
      if (!sl.k) out.push(`${which} isn’t picked yet, so it goes to waste.`);
      else if (sl.k === "perm" && empty(sl.text)) out.push(`${which} needs the new permission’s words.`);
      else if (sl.k === "perm" && c.titles[sl.t] && c.titles[sl.t].permissions.length + (earlier(d, i, s).perms[sl.t] ?? 0) >= MAX_PERMS) out.push(`${which} would be a seventh permission on ${c.titles[sl.t].name}, and six is the most a Title holds.`);
      else if (sl.k === "perm" && tooMany(sl.on)) out.push(`${which} puts the new permission on ${sl.on.length} set actions, and a permission goes on two at most.`);
      else if (sl.k === "trait" && (sl.own ? empty(sl.oname) : !sl.name)) out.push(`${which} needs a trait.`);
      else if (sl.k === "asp" && !sl.dice) out.push(`${which} hasn’t rolled at your Aspiration yet.`);
      else if (sl.k === "asp" && earlier(d, i, s).asp >= 12 && (Math.max(...sl.dice) > sl.opp || sl.tie) && (empty(sl.text) || !sl.arch || empty(sl.perm))) out.push(`${which} needs your new Title’s archetype, its name and its permission.`);
      else if (sl.k === "asp" && sl.dice && tooMany(sl.pOn)) out.push(`${which} puts your new Title’s permission on ${sl.pOn.length} set actions, and a permission goes on two at most.`);
      else if (sl.k === "thread" && (empty(sl.person) || empty(sl.text))) out.push(`${which} needs who the thread’s with, and the thread.`);
      else if (sl.k === "get" && empty(sl.text)) out.push(`${which} needs what you’re getting.`);
      else if (sl.k === "get" && roomFor(c, s, sl.where) < 1) out.push(`${which} has nowhere to put it.`);
      else if (sl.k === "att") {
        const a = thingAt(c, d, i, sl.a, s);
        if (!a || (empty(sl.text) && !sl.up)) out.push(`${which} needs the attuned permission’s words.`);
        else if (!empty(sl.text)) {
          const r = attunedRoom(a);
          const stage = sl.up && r.next ? r.next : r.stage;
          const s2 = attunedRoom({ ...a, stage, catch: a.catch || sl.catch.trim(), burden: a.burden || sl.burden.trim() });
          if (r.n + 1 > s2.all) out.push(`${a.name} is full at ${r.stage}. It goes up a stage once it’s got its material.`);
          else if (r.n + 1 > s2.base && s2.missing.length) out.push(`${a.name} needs ${s2.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")).join(" and ")} for that permission.`);
        }
      }
    });
    d.swaps.forEach((w) => {
      const t = c.titles[w.t];
      if (t && w.j >= 0 && w.text.trim() && tooMany(w.on)) out.push(`The swap puts “${w.text.trim()}” on ${w.on.length} set actions, and a permission goes on two at most.`);
    });
    return out;
  }

  // Everything the card says goes onto the state, and growth into
  // state.grown. It returns what happened, for the toast.
  function apply(s, c, d) {
    const said = [];
    s.grown = Array.isArray(s.grown) ? s.grown : [];
    const grow = (g) => s.grown.push(g);
    d.slots.forEach((sl, i) => {
      const text = String(sl.text ?? "").trim();
      if (sl.k === "pressure") said.push(text ? `${text}: done` : "A pressure dealt with");
      else if (sl.k === "mend" && (s.crossed[sl.key] || s.boxes?.[sl.key])) {
        const [where, ...rest] = sl.key.split("|");
        const a = pieceAt(c, sl.key);
        mend(s, sl.key);
        said.push(a ? `${cap(yours(a, { quality: true }))} ${many(a) ? "are" : "is"} mended, every box clear` : `${nameOf(c, where, rest.join("|"))} is mended`);
      } else if (sl.k === "perm" && text && c.titles[sl.t] && c.titles[sl.t].permissions.length + (earlier(d, i, s).perms[sl.t] ?? 0) < MAX_PERMS) {
        grow({ k: "perm", t: sl.t, text, on: [...sl.on] });
        said.push(`“${text}” goes on your ${ORD[sl.t] ?? ""} Title`);
      } else if (sl.k === "trait") {
        const name = (sl.own ? sl.oname : sl.name).trim();
        if (name) {
          grow(sl.own ? { k: "trait", name, on: [...sl.on], own: { type: sl.otype.trim(), text: sl.otext.trim() } } : { k: "trait", name, on: [...sl.on] });
          said.push(`${name} is yours`);
        }
      } else if (sl.k === "asp" && sl.dice) {
        const beat = Math.max(...sl.dice) > sl.opp || sl.tie;
        if (!beat) said.push(`Your Aspiration holds at d${s.asp}`);
        else if (s.asp >= 12) {
          s.asp = 2;
          if (text) grow({ k: "title", arch: sl.arch, text, on: [...sl.tOn], perm: sl.perm.trim(), permOn: [...sl.pOn] });
          said.push(`Your Aspiration resolves${text ? `, and ${text} is your new Title` : ""}. Write your new Aspiration on the Sheet tab`);
        } else {
          s.asp = sizeUp(s.asp);
          said.push(`Your Aspiration climbs to d${s.asp}`);
        }
        if (sl.tie) said.push("The crew spends an extra resource for the tie");
      } else if (sl.k === "thread" && text && sl.person.trim()) {
        const kind = sl.tkind === "hostile" ? "hostile" : "bond";
        grow({ k: "thread", person: sl.person.trim(), text, kind });
        said.push(`A new ${kind} thread with ${sl.person.trim()}${crewNames().has(sl.person.trim()) ? ", so tell them" : ""}`);
      } else if (sl.k === "get" && text && roomFor(c, s, sl.where) > 0) {
        s.picked.push({ where: sl.where, name: text });
        said.push(`${text} goes in ${sl.where === "bag" ? "the bag" : `your ${sl.where}`}`);
      } else if (sl.k === "att") {
        const a = thingAt(c, d, i, sl.a, s);
        const next = a && attunedRoom(a).next;
        const up = Boolean(sl.up && next && !a.wentUp);
        if (a && (text || up)) {
          grow({ k: "att", a: sl.a, text, on: [...sl.on], catch: sl.catch.trim(), burden: sl.burden.trim(), up });
          const name = a.name.charAt(0).toUpperCase() + a.name.slice(1);
          said.push(`${name}${up ? ` goes up to ${next}` : ""}${text ? `${up ? " and" : ""} gets “${text}”` : ""}`);
        }
      } else if (sl.k === "party") said.push(text ? `A slot toward ${text}` : "A slot toward the crew");
    });
    for (const w of d.swaps) {
      const t = c.titles[w.t];
      const from = t?.permissions[w.j]?.text;
      const text = w.text.trim();
      if (!from || !text || text === from) continue;
      grow({ k: "swap", t: w.t, j: w.j, from, text, on: [...w.on] });
      said.push(`“${from}” becomes “${text}”`);
    }
    const now = new Map(threadsOf(c, s).map((t) => [t.key, t]));
    for (const key of d.mends) {
      const t = now.get(key);
      if (!t || t.kind === "hostile" || t.st !== "strained") continue;
      if (t.sheet) s.threads[key] = "whole";
      else delete s.threads[key];
      said.push(`Your thread with ${t.person} is mended`);
    }
    for (const key of d.rights) {
      const t = now.get(key);
      if (!t || t.kind !== "hostile" || t.st === "snapped") continue;
      s.threads[key] = t.st === "strained" ? "snapped" : "strained";
      said.push(t.st === "strained" ? `You did right by ${t.person} again, so that thread snaps and the grudge is over` : `You did right by ${t.person}, so your hostile thread’s strained`);
    }
    return said;
  }

  // A second slot's Aspiration roll was made against the die the first one
  // left, so it's rolled again if that changes.
  function act(el, d, c, s) {
    const basis = d.slots.map((x, j) => earlier(d, j, s).asp);
    act1(el, d, c, s);
    d.slots.forEach((sl, j) => {
      if (sl.k === "asp" && (sl.dice || sl.real) && earlier(d, j, s).asp !== basis[j]) Object.assign(sl, { dice: null, opp: null, real: false, pads: [], padOpp: "", rerolls: 0, tie: false });
    });
  }

  function act1(el, d, c, s) {
    const go = el.dataset.do;
    const i = Number(el.dataset.s);
    const sl = el.dataset.s != null ? at(d, el.dataset.s) : null;
    const f = el.dataset.f;
    const v = el.dataset.v;
    d.sure = false;
    d.say = "";
    if (go === "pick") d.slots[Number(el.dataset.s)] = fresh(v, c, s);
    else if (go === "clear") d.slots[Number(el.dataset.s)] = blank();
    else if (go === "set" && sl) {
      sl[f] = f === "key" || f === "tkind" ? v : f === "own" ? v === "1" : Number(v);
      // A swap's set actions start where the old permission was.
      if (String(el.dataset.s)[0] === "w") {
        if (f === "t") sl.j = -1;
        if (f === "j") {
          const key = c.titles[sl.t]?.permissions[sl.j]?.key;
          sl.on = c.actions.filter((a) => a.lines.includes(key)).map((a) => a.name);
        }
      }
      if (f === "a") Object.assign(sl, { up: false, catch: "", burden: "" });
    } else if (go === "on" && sl) {
      const list = sl[f];
      const at2 = list.indexOf(v);
      // A new permission goes on two set actions at most, the same as in the builder.
      const perm = String(el.dataset.s)[0] === "w" || (f === "on" && (sl.k === "perm" || sl.k === "att")) || (sl.k === "asp" && f === "pOn");
      if (at2 < 0 && perm && list.filter((a) => c.actions.some((x) => x.name === a)).length >= MAX_ON) {
        d.say = "A permission goes on two set actions at most, so tap one of them off first.";
        return;
      }
      if (at2 >= 0) list.splice(at2, 1);
      else list.push(v);
    } else if (go === "flip" && sl) sl[f] = !sl[f];
    else if (go === "asp-roll" && sl && !earlier(d, i, s).waiting) {
      sl.dice = stepsToDice(1 + sl.on.length).map((size) => throwDie(size));
      sl.opp = throwDie(earlier(d, i, s).asp);
    } else if (go === "asp-real" && sl) sl.real = true;
    else if (go === "asp-call" && sl) {
      const dice = stepsToDice(1 + sl.on.length);
      const nums = dice.map((size, j) => Math.min(size, Math.max(1, Math.round(Number(sl.pads[j]) || 0))));
      const asp = earlier(d, i, s).asp;
      const opp = sl.rerolls ? sl.opp : Math.min(asp, Math.max(1, Math.round(Number(sl.padOpp) || 0)));
      if (nums.some((x, j) => !(Number(sl.pads[j]) > 0)) || (!sl.rerolls && !(Number(sl.padOpp) > 0))) {
        d.say = "Put in every die’s number first.";
        return;
      }
      sl.dice = nums;
      sl.opp = opp;
    } else if (go === "asp-again" && sl && s.resolve > spent(d)) {
      sl.rerolls += 1;
      if (sl.real) {
        sl.dice = null;
        sl.pads = [];
      } else sl.dice = stepsToDice(1 + sl.on.length).map((size) => throwDie(size));
    } else if (go === "asp-tie" && sl) sl.tie = true;
    else if (go === "swap-add") d.swaps.push({ t: 0, j: -1, text: "", on: [] });
    else if (go === "swap-off") d.swaps.splice(Number(el.dataset.s), 1);
    else if (go === "mend" || go === "right") {
      const list = go === "mend" ? d.mends : d.rights;
      const at2 = list.indexOf(v);
      if (at2 >= 0) list.splice(at2, 1);
      else list.push(v);
    }
  }

  function input(el, d) {
    const sl = at(d, el.dataset.dt);
    if (!sl) return;
    const f = el.dataset.f;
    if (f === "pad") sl.pads[Number(el.dataset.j)] = el.value;
    else sl[f] = el.value.slice(0, f === "otext" ? 200 : 120);
    d.sure = false;
  }

  return { start, done, view, act, input, apply, warnings };
}
