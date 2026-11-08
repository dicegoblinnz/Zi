// Downtime on the phone: two slots, and what they buy lands on the sheet when
// the player finishes, with one undo for the lot. Every downtime starts with
// each track up a size, free. The choices are Downtime's: face a pressure,
// recover (6 sizes back on the tracks, or mend something), grow (a
// permission, the Aspiration, a bond, something to carry), a new awakening on
// an attuned thing, or a slot toward the crew. Swapping a permission, mending
// a strained bond thread and marking that you did right by someone you've a
// hostile thread with don't take a slot. The card's a draft until it's
// finished, kept on the page by character (not saved), so closing it and
// coming back keeps what's picked. Since the Roots change (8 Nov 2026) a
// permission's written with the Root and specialty it fits.

import { diceLabel, sizeUp, stepsToDice } from "./dice.js";
import * as R from "./roots.js";
import { bondKey, threadKey, threadState } from "./threads.js";
import { isBroken, keyOf, many, mend, nameOf, pieceAt, tickedOf, worn, yours } from "./armour.js";

const CHOICES = [
  ["Face a pressure", [["pressure", "Deal with a pressure"]]],
  ["Recover", [["heal", "Heal: 6 sizes back"], ["mend", "Mend something"]]],
  ["Grow", [["perm", "A new permission"], ["asp", "Chase your Aspiration"], ["thread", "Deepen a bond"], ["get", "Get something"]]],
  ["Attunement", [["awk", "A new awakening"]]],
  ["The crew", [["party", "Toward the crew"]]],
];
const LABEL = Object.fromEntries(CHOICES.flatMap(([, list]) => list));
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const ROOM = { equipment: 3, utility: 3 };
const TN = (t) => R.TRACK[t].name;
const andList = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");

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
const roomFor = (c, s, where) => (where === "bag" ? (c.carry.bag?.max ?? 10) - (c.carry.bag?.items?.length ?? 0) : ROOM[where] - (c.carry[where] ?? []).length) - s.picked.filter((p) => p.where === where).length;
// Each track a size up, the way every downtime starts.
const startOf = (s) => Object.fromEntries(R.TRACKS.map((t) => [t, sizeUp(s.tracks[t])]));

export function makeDowntime({ B, esc, steps, link, icon, throwDie, crewNames, isOpen, rule }) {
  const drafts = new Map();
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const off = (no) => (no ? " disabled" : "");
  const blank = () => ({ k: "" });

  function start(ch) {
    const d = drafts.get(ch.id) ?? { kind: "downtime", id: ch.id, slots: [blank(), blank()], swaps: [], boons: [], mends: [], rights: [], sure: false };
    d.boons ??= [];
    d.sure = false;
    drafts.set(ch.id, d);
    return d;
  }
  const done = (ch) => drafts.delete(ch.id);
  const at = (d, where) => (String(where)[0] === "w" ? d.swaps[Number(String(where).slice(1))] : String(where)[0] === "b" ? d.boons?.[Number(String(where).slice(1))] : d.slots[Number(where)]);

  function can(k, c, s) {
    if (k === "mend") return crossed(c, s).length > 0;
    if (k === "perm") return c.titles.some((t) => R.slotsOf(t) < R.MAX_PERMS);
    if (k === "awk") return c.attuned.length > 0;
    return true;
  }

  function fresh(k, c, s) {
    const firstTitle = Math.max(0, c.titles.findIndex((t) => R.slotsOf(t) < R.MAX_PERMS));
    return {
      pressure: { k, text: "" }, mend: { k, key: crossed(c, s)[0]?.key ?? "" },
      heal: { k, n: Object.fromEntries(R.TRACKS.map((t) => [t, 0])) },
      perm: { k, t: firstTitle, text: "", root: c.titles[firstTitle]?.root ?? "Body", spec: "" },
      asp: { k, root: R.bestRoot(c), spec: "", dice: null, opp: null, real: false, pads: [], padOpp: "", rerolls: 0, tie: false, take: "", text: "", troot: "Body", specs: ["", "", ""], perm: "", proot: "Body", pspec: "", arch: "", name: "", aura: "", wname: "", wkind: "passive", wtext: "" },
      thread: { k, person: "", text: "", tkind: "bond" }, get: { k, text: "", where: "bag" },
      awk: { k, a: 0, name: "", kind: "passive", text: "", catch: "", burden: "", up: false }, party: { k, text: "" },
    }[k] ?? blank();
  }

  // What the slots before this one have done, so the second builds on the
  // first: permissions on each Title, awakenings on each attuned thing and a
  // stage gone up, a Catch or Burden written, sizes healed, and the
  // Aspiration's die. Resolve paid to roll again counts across both.
  function earlier(d, i, s) {
    const out = { perms: {}, awk: {}, up: {}, catch: {}, burden: {}, healed: Object.fromEntries(R.TRACKS.map((t) => [t, 0])), asp: s.asp, waiting: false };
    for (const sl of d.slots.slice(0, i)) {
      if (sl.k === "perm" && sl.text.trim()) out.perms[sl.t] = (out.perms[sl.t] ?? 0) + 1;
      if (sl.k === "heal") for (const t of R.TRACKS) out.healed[t] += sl.n[t] ?? 0;
      if (sl.k === "awk") {
        if (sl.name.trim()) out.awk[sl.a] = (out.awk[sl.a] ?? 0) + 1;
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
  // Resolve to pay with: downtime's free size first, less what's been paid.
  const resolveRoom = (d, s) => Math.max(0, (startOf(s).resolve - R.lowOf(s, "resolve")) / 2 - spent(d));
  // An attuned thing as it stands once the earlier slot's done.
  function thingAt(c, d, i, j, s) {
    const a = c.attuned[j];
    if (!a) return null;
    const e = earlier(d, i, s);
    const r = R.attunedRoom(a);
    const stage = e.up[j] && r.next ? r.next : r.stage;
    return { ...a, stage, catch: a.catch || e.catch[j] || null, burden: a.burden || e.burden[j] || null, awakenings: { length: a.awakenings.length + (e.awk[j] ?? 0) }, wentUp: Boolean(e.up[j]) };
  }
  // How many sizes a heal slot can put back on a track: up to d12, after the
  // free size downtime starts with and what an earlier slot healed.
  const healRoom = (s, d, i, t) => Math.max(0, (12 - startOf(s)[t]) / 2 - earlier(d, i, s).healed[t]);

  // ---------------------------------------------------------------- drawing

  const chips = (where, field, items, now, label) => `<div class="cc-chips" role="group" aria-label="${esc(label)}">${items.map(([v, text, dis]) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="set" data-s="${where}" data-f="${field}" data-v="${esc(v)}"${pressed(String(now) === String(v))}${off(dis)}>${text}</button>`).join("")}</div>`;
  const field = (where, f, label, value, extra = "") => `<label class="cc-field">${label} <input data-dt="${where}" data-f="${f}" value="${esc(value)}" maxlength="${/text$/.test(f) ? 200 : 80}" autocomplete="off"${extra}></label>`;
  const ruleBox = (key, title, id) => `<details class="cc-own" data-open="${key}"${isOpen(key) ? " open" : ""}><summary>${title}</summary><div class="cc-rule">${rule(id)}</div></details>`;
  const quickTest = () => (B.quickTest?.length ? `<details class="cc-own" data-open="dt-test"${isOpen("dt-test") ? " open" : ""}><summary>The quick test</summary><ol class="cc-rule dt-test">${B.quickTest.map((q) => `<li>${q}</li>`).join("")}</ol></details>` : "");
  const roots = (where, f, now) => chips(where, f, R.ROOTS.map((r) => [r, r]), now, "Its Root");
  // A specialty: one they've got, or a new one written in.
  const specPick = (where, f, now, c, label = "Its specialty") => `${chips(where, f, c.specialties.map((x) => [x.name, esc(x.name)]), c.specialties.find((x) => R.specKey(x.name) === R.specKey(now))?.name ?? "", label)}
    ${field(where, f, "Or a new one", c.specialties.some((x) => R.specKey(x.name) === R.specKey(now)) ? "" : now)}`;
  const die = (n, cls = "on") => `<span class="hex ${cls}">${esc(n)}</span>`;

  function aspView(sl, i, c, s, d) {
    const e = earlier(d, i, s);
    const asp = e.asp;
    const total = Math.max(1, c.roots[sl.root] + R.specSteps(c, sl.spec));
    const dice = stepsToDice(total);
    const head = `<p class="cc-dice">${dice.map((x) => die(`d${x}`)).join("")}${die(`d${asp}`, "them")}<span><b>${steps(total)}</b>, ${diceLabel(dice)}, against its d${asp}</span></p>`;
    let body = "";
    if (sl.dice) {
      const best = Math.max(...sl.dice);
      const beat = best > sl.opp || sl.tie;
      const tie = best === sl.opp && !sl.tie;
      const climbs = asp >= 12 ? "It climbs past d12 and resolves." : `It climbs to d${sizeUp(asp)}.`;
      const verdict = beat ? (sl.tie ? `The crew takes the tie. ${climbs}` : `${best} against ${sl.opp}. Beat it. ${climbs}`) : tie ? `${best} against ${sl.opp}. A tie goes to the Aspiration, so it holds at d${asp}.` : `${best} against ${sl.opp}. It holds at d${asp}.`;
      const takes = [["title", "A new Title"], ["arch", "A new archetype"], ["attune", "A new attuned thing"]];
      body = `<p class="cc-dice">${sl.dice.map((n) => die(String(n))).join("")}${die(String(sl.opp), "them")}<span>${dice.length > 1 ? "Your best die counts. " : ""}${esc(verdict)}</span></p>
        ${beat ? "" : `<div class="cc-row">${resolveRoom(d, s) >= 1 ? `<button type="button" class="button sm" data-act="dt" data-do="asp-again" data-s="${i}">Roll yours again: 1 Resolve</button>` : ""}${tie ? `<button type="button" class="button sm" data-act="dt" data-do="asp-tie" data-s="${i}">The crew spends an extra resource to take the tie</button>` : ""}</div>
        <p class="cc-lead">There’s no Aura in downtime. Taking the tie spends one of the crew’s extra resources, so ask the table first.</p>`}
        ${beat && asp >= 12 ? `<h3>What it gives you</h3>${chips(i, "take", takes.map(([v, t]) => [v, t]), sl.take, "What your Aspiration gives you")}
          ${sl.take === "title" ? `${field(i, "text", "Your new Title", sl.text)}<p class="cc-lead">Its Root</p>${roots(i, "troot", sl.troot)}
            <p class="cc-lead">Three specialties that fit it, 1 each</p><div class="dt-specs">${[0, 1, 2].map((j) => `<input data-dt="${i}" data-f="specs" data-j="${j}" value="${esc(sl.specs[j])}" maxlength="40" autocomplete="off" list="dt-speclist" aria-label="Specialty ${j + 1}">`).join("")}</div>
            ${field(i, "perm", "Its permission", sl.perm)}<p class="cc-lead">The permission’s Root</p>${roots(i, "proot", sl.proot)}${specPick(i, "pspec", sl.pspec, c, "The permission’s specialty")}` : ""}
          ${sl.take === "arch" ? `<label class="cc-field">The archetype <select id="dt-arch-${i}" data-dt="${i}" data-f="arch"><option value="">Pick one</option>${B.archetypes.map((a) => `<option value="${esc(a.name)}"${sl.arch === a.name ? " selected" : ""}>${esc(a.name)}${c.archetypes.some((x) => x.name === a.name) ? " again" : ""}</option>`).join("")}</select></label>
            ${B.archetypes.find((a) => a.name === sl.arch) ? `<p class="cc-lead">${esc(B.archetypes.find((a) => a.name === sl.arch).summary)} Its abilities come with it, and it’s one more action you can buy a round.</p>` : ""}` : ""}
          ${sl.take === "attune" ? `${field(i, "name", "The thing", sl.name)}${field(i, "aura", "Its own way to Aura", sl.aura)}${field(i, "wname", "Its first awakening", sl.wname)}
            ${chips(i, "wkind", [["passive", "Passive: it holds Aura"], ["active", "Active: it spends it"]], sl.wkind, "Passive or active")}${field(i, "wtext", "What it does", sl.wtext)}` : ""}
          <p class="cc-lead">Your Aspiration starts again at d2. Write the new one on the Sheet tab.</p>` : ""}`;
    } else if (sl.real) {
      body = `<div class="dt-pads">${dice.map((x, j) => `<label class="cc-field">Your d${x} <input type="number" inputmode="numeric" min="1" max="${x}" data-dt="${i}" data-f="pad" data-j="${j}" value="${esc(sl.pads[j] ?? "")}"></label>`).join("")}
        ${sl.rerolls ? "" : `<label class="cc-field">Its d${asp} <input type="number" inputmode="numeric" min="1" max="${asp}" data-dt="${i}" data-f="padOpp" value="${esc(sl.padOpp)}"></label>`}</div>
        <div class="cc-row"><button type="button" class="button primary" data-act="dt" data-do="asp-call" data-s="${i}">That’s what they rolled</button></div>`;
    } else if (e.waiting) {
      body = `<p class="cc-lead">Roll your first slot’s Aspiration first, since this one rolls against whatever die it leaves.</p>`;
    } else {
      body = `<p class="cc-lead">The Root that fits what you’re doing about it</p>${roots(i, "root", sl.root)}${specPick(i, "spec", sl.spec, c, "And the specialty")}
        <div class="cc-row"><button type="button" class="button primary" data-act="dt" data-do="asp-roll" data-s="${i}">Roll</button><button type="button" class="button" data-act="dt" data-do="asp-real" data-s="${i}">Roll real dice</button></div>`;
    }
    return `<p class="cc-lead">Roll against its die, built from whatever you’re doing about it. Ties go to the Aspiration. ${link("s-aspiration", "How Aspiration works")}</p>
      ${ruleBox("dt-rolls", "Rolling in downtime", "s-downtime-rolls")}${head}${body}`;
  }

  function awkView(sl, i, c, s, d) {
    const a = thingAt(c, d, i, sl.a, s);
    const items = c.attuned.map((x, j) => [j, esc(x.name)]);
    if (!a) return chips(i, "a", items, sl.a, "Which attuned thing");
    const r = R.attunedRoom(a);
    const stage = sl.up && r.next ? r.next : r.stage;
    const s2 = R.attunedRoom({ ...a, stage });
    const price = { Awakened: "a Catch", Tempered: "a Burden", Perfected: "a Burden and a Catch" };
    const full = r.n >= s2.all;
    const extra = r.n + 1 > s2.base;
    return `${items.length > 1 ? chips(i, "a", items, sl.a, "Which attuned thing") : ""}
      <p class="cc-lead">${esc(cap(a.name))} is ${r.stage}, with ${r.n} awakening${r.n === 1 ? "" : "s"}${a.wentUp ? " once your first slot’s done" : ""}. ${r.stage} holds ${r.base}, and ${r.base} more with ${price[r.stage]}. ${link("attunement-stages", "The three stages")}</p>
      ${r.next && !a.wentUp ? `<button type="button" class="cc-line" data-act="dt" data-do="flip" data-s="${i}" data-f="up"${pressed(sl.up)}><span class="tick" aria-hidden="true"></span><span>It’s got its material, so it goes up to ${r.next} <small>found in the story or bought</small></span></button>` : ""}
      ${full && !sl.up ? `<p class="cc-warn">It’s full at ${r.stage}. It goes up a stage once it’s got its material.</p>` : `
      ${extra && !a.catch && s2.needs.includes("catch") ? field(i, "catch", `Its Catch <small>it needs one to hold more than ${s2.base}</small>`, sl.catch) : ""}
      ${extra && !a.burden && s2.needs.includes("burden") ? field(i, "burden", `Its Burden <small>a permanent cost, like <em>Bad Knee</em>, and it needs one to hold more than ${s2.base}</small>`, sl.burden) : ""}
      ${field(i, "name", "The awakening", sl.name)}
      ${chips(i, "kind", [["passive", "Passive: it holds Aura"], ["active", "Active: it spends it"]], sl.kind, "Passive or active")}
      ${field(i, "text", "What it does", sl.text)}
      <p class="cc-lead">Write it as something the thing itself does. A passive one holds up to 2 Aura and works for as much as it holds, like +1 on one die for each Aura in it. An active one spends Aura when you use it, more for more.</p>`}`;
  }

  function formView(sl, i, c, s, d) {
    switch (sl.k) {
      case "pressure":
        return `${field(i, "text", "What you’re dealing with", sl.text)}<p class="cc-lead">One slot usually settles a pressure, and the GM says if it needs two. If something pushes back, roll for it.</p>`;
      case "heal": {
        const total = R.TRACKS.reduce((t, x) => t + (sl.n[x] ?? 0), 0);
        const start = startOf(s);
        return `<p class="cc-lead">Put ${R.RECOVER} sizes back on your tracks, spread however you like. Nothing goes past d12, and nothing heals a Scar. ${total} of ${R.RECOVER} put back.</p>
          ${R.TRACKS.map((t) => {
            const room = healRoom(s, d, i, t);
            const n = sl.n[t] ?? 0;
            return `<div class="cc-stepper"><span>${TN(t)} <small>d${start[t]} after the free size${n ? `, d${Math.min(12, start[t] + 2 * n)} with this` : ""}</small></span><span class="cc-step"><button type="button" class="cc-stepbtn" data-act="dt" data-do="heal" data-s="${i}" data-f="${t}" data-v="-1" aria-label="${TN(t)}: one size less"${off(n <= 0)}>−</button><output>${n}</output><button type="button" class="cc-stepbtn" data-act="dt" data-do="heal" data-s="${i}" data-f="${t}" data-v="1" aria-label="${TN(t)}: one size more"${off(n >= room || total >= R.RECOVER)}>+</button></span></div>`;
          }).join("")}${ruleBox("dt-heal", "Recover, from the rules", "recover")}`;
      }
      case "mend":
        return `${chips(i, "key", crossed(c, s).map((x) => [x.key, `${esc(x.name)}${x.note ? ` <small>${esc(x.note)}</small>` : ""}`]), sl.key, "What you’re mending")}<p class="cc-lead">Mending something usually takes a purse of gold as well. Mended armour has every box clear. ${link("s-armour-quality", "Armour’s boxes")}</p>`;
      case "perm": {
        const t = c.titles[sl.t];
        const e = earlier(d, i, s);
        const has = (j) => R.slotsOf(c.titles[j]) + (e.perms[j] ?? 0);
        return `${chips(i, "t", c.titles.map((x, j) => [j, `<em>${esc(x.name)}</em> <small>${has(j)} of ${R.MAX_PERMS}</small>`, has(j) >= R.MAX_PERMS]), sl.t, "Which Title")}
          ${t ? `<p class="cc-lead">It has to fit inside <em>${esc(t.name)}</em>, and the story should say where you learned it.</p>` : ""}
          ${field(i, "text", "The permission", sl.text)}${quickTest()}
          <p class="cc-lead">It adds 1 to a Root and 1 to a specialty, the ones it fits.</p>${roots(i, "root", sl.root)}${specPick(i, "spec", sl.spec, c)}`;
      }
      case "asp":
        return aspView(sl, i, c, s, d);
      case "thread": {
        // Someone you've already got a bond with, or someone new. Either
        // way it goes under their one bond.
        const people = c.threads.map((p) => p.person);
        const mine = people.find((p) => bondKey(p) === bondKey(sl.person));
        return `${chips(i, "tkind", [["bond", "A bond thread"], ["hostile", "A hostile thread"]], sl.tkind ?? "bond", "What kind of thread")}
          ${people.length ? `<p class="cc-lead">Who it’s with: one of your bonds, or someone new.</p>${chips(i, "person", people.map((p) => [p, esc(p)]), mine ?? "", "Who it’s with")}` : ""}
          ${field(i, "person", people.length ? "Or someone new" : "Who it’s with", mine ? "" : sl.person)}${field(i, "text", "The thread", sl.text)}<p class="cc-lead">A bond thread or a hostile one, whichever the story’s given you. It goes under your bond with them. If they’re in the crew, it goes on both your sheets, so agree on it together.</p>`;
      }
      case "get": {
        const room = roomFor(c, s, sl.where);
        return `${field(i, "text", "What you’re getting", sl.text)}
          <label class="cc-field">It goes in <select id="dt-where-${i}" data-dt="${i}" data-f="where">${[["bag", "the bag"], ["utility", "utility"], ["equipment", "equipment"]].map(([v, t]) => `<option value="${v}"${sl.where === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
          ${room < 1 ? `<p class="cc-warn">There’s no room there.</p>` : ""}
          <p class="cc-lead">Something to carry, a purse of gold, or the material an attuned thing needs for its next stage, whether it’s bought, made, won or owed.</p>`;
      }
      case "awk":
        return awkView(sl, i, c, s, d);
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
      ${w.j >= 0 ? `${field(where, "text", "What it becomes", w.text)}<p class="cc-lead">Its Root and specialty</p>${roots(where, "root", w.root)}${specPick(where, "spec", w.spec, c)}` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="swap-off" data-s="${n}">Leave it as it was</button></div></div>`;
  }

  // Two permissions on one Title for a Boon, which takes their two slots.
  // Fewer go when the Title's got slots free.
  const BOON_ON = { Armour: "Which piece of armour", Conditions: "Which condition can’t touch you", "Getting around": "Climbing, swimming or rough ground" };
  // How many permissions have to go, counting the ones this downtime's slots
  // put on the same Title first.
  const goes = (t, j, d, s) => Math.max(0, R.BOON_SLOTS - (R.MAX_PERMS - R.slotsOf(t) - (earlier(d, d.slots.length, s).perms[j] ?? 0)));
  function boonView(w, n, c, d, s) {
    const where = `b${n}`;
    const t = c.titles[w.t];
    const need = t ? goes(t, w.t, d, s) : 0;
    const rule = (B.boons ?? []).find((x) => x.lever === w.lever);
    return `<div class="dt-swap">${chips(where, "t", c.titles.map((x, j) => [j, `<em>${esc(x.name)}</em>`]), w.t, "Which Title")}
      ${t && need ? `<p class="cc-lead">${need === 1 ? "Pick the permission that goes." : "Pick the two permissions that go."}</p><div class="cc-chips" role="group" aria-label="The permissions going">${t.permissions.map((p, j) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="boon-drop" data-s="${where}" data-v="${j}"${pressed(w.drop.includes(j))}><em>${esc(p.text)}</em></button>`).join("")}</div>` : t ? `<p class="cc-lead">${esc(t.name)} has two slots free, so nothing has to go.</p>` : ""}
      ${chips(where, "lever", (B.boons ?? []).map((x) => [x.lever, esc(x.lever)]), w.lever, "Which Boon")}
      ${rule ? `<p class="cc-lead">${esc(cap(rule.text))}.</p>${field(where, "name", "Its name from the story, if you like", w.name)}${BOON_ON[w.lever] ? field(where, "on", BOON_ON[w.lever], w.on) : ""}` : ""}
      <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="boon-off" data-s="${n}">Leave it as it was</button></div></div>`;
  }

  function view(c, s, ch, d) {
    const n = 2;
    while (d.slots.length < n) d.slots.push(blank());
    if (d.slots.length > n) d.slots.length = n;
    const picked = d.slots.filter((x) => x.k).length;
    const strained = strainedOf(c, s);
    const grudges = grudgesOf(c, s);
    const warn = d.sure ? warnings(d, c, s) : [];
    const free = ["swaps", "Boons", ...(strained.length ? ["mending"] : []), ...(grudges.length ? ["hostile threads"] : [])];
    const start = startOf(s);
    const up = R.TRACKS.filter((t) => start[t] > s.tracks[t]);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Downtime</h2><p class="cc-small">${picked} of ${n} slots picked</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${icon.close}</button></div>
    <div class="dlg-body">
      <p class="cc-lead">Every downtime starts with each of your tracks up a size, free${up.length ? `: ${andList(up.map((t) => `${TN(t)} d${s.tracks[t]} to d${start[t]}`))}` : ", and they’re all on d12"}. Then pick what each of your two slots is for, and it lands on your sheet when you finish. ${link("what-you-can-do-with-a-slot", "What a slot can do")}</p>
      ${ruleBox("dt-how", "Your slots, from the rules", "your-slots")}
      <datalist id="dt-speclist">${c.specialties.map((x) => `<option value="${esc(x.name)}">`).join("")}</datalist>
      ${d.slots.map((_, i) => slotView(d, i, c, s)).join("")}
      <details class="cc-group" data-open="dt-free"${isOpen("dt-free") || d.swaps.length || d.boons.length || d.mends.length || d.rights.length ? " open" : ""}><summary>Without a slot <small>${andList(free)}</small></summary>
        <h3>Swap a permission</h3>
        <p class="cc-lead">Swap any permission for another that fits its Title, as long as it makes sense for your character.</p>
        ${d.swaps.map((w, k) => swapView(w, k, c)).join("")}
        <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="swap-add">${d.swaps.length ? "Swap another" : "Swap a permission"}</button></div>
        <h3>Two permissions for a Boon</h3>
        <p class="cc-lead">Two permissions on one Title can go for a Boon, which takes their two slots. A Boon can go back for two permissions the same way, from Change. ${link("s-boons", "Boons and Burdens")}</p>
        ${d.boons.map((w, k) => boonView(w, k, c, d, s)).join("")}
        <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="boon-add">${d.boons.length ? "Another Boon" : "Two permissions for a Boon"}</button></div>
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

  const empty = (x) => !String(x ?? "").trim();
  function warnings(d, c, s) {
    const out = [];
    const titled = new Set();
    for (const w of d.boons ?? []) {
      const t = c.titles[w.t];
      if (!t || !w.lever) continue;
      if (titled.has(w.t)) out.push(`${t.name} takes one Boon a downtime here, so the second waits for the next.`);
      else if (w.drop.filter((j) => t.permissions[j]).length < goes(t, w.t, d, s)) out.push(`${t.name} needs ${goes(t, w.t, d, s) === 1 ? "a permission" : "two permissions"} picked to make room for ${w.name.trim() || `the ${w.lever} Boon`}.`);
      titled.add(w.t);
    }
    d.slots.forEach((sl, i) => {
      const which = `Your ${ORD[i]} slot`;
      if (!sl.k) out.push(`${which} isn’t picked yet, so it goes to waste.`);
      else if (sl.k === "heal" && !R.TRACKS.some((t) => sl.n[t])) out.push(`${which} hasn’t put any sizes back yet.`);
      else if (sl.k === "perm" && (empty(sl.text) || empty(sl.spec))) out.push(`${which} needs the new permission’s words and its specialty.`);
      else if (sl.k === "perm" && c.titles[sl.t] && R.slotsOf(c.titles[sl.t]) + (earlier(d, i, s).perms[sl.t] ?? 0) >= R.MAX_PERMS) out.push(`${which} would be a seventh permission on ${c.titles[sl.t].name}, and six is the most a Title holds.`);
      else if (sl.k === "asp" && !sl.dice) out.push(`${which} hasn’t rolled at your Aspiration yet.`);
      else if (sl.k === "asp" && earlier(d, i, s).asp >= 12 && (Math.max(...sl.dice) > sl.opp || sl.tie)) {
        if (!sl.take) out.push(`${which} resolves your Aspiration, so pick a new Title, archetype or attuned thing.`);
        else if (sl.take === "title" && (empty(sl.text) || sl.specs.filter((x) => !empty(x)).length < 3 || empty(sl.perm) || empty(sl.pspec))) out.push(`${which} needs your new Title, its three specialties and its permission.`);
        else if (sl.take === "arch" && !sl.arch) out.push(`${which} needs the archetype.`);
        else if (sl.take === "attune" && (empty(sl.name) || empty(sl.wname))) out.push(`${which} needs the thing you’re attuning and its first awakening.`);
      } else if (sl.k === "thread" && (empty(sl.person) || empty(sl.text))) out.push(`${which} needs who the thread’s with, and the thread.`);
      else if (sl.k === "get" && empty(sl.text)) out.push(`${which} needs what you’re getting.`);
      else if (sl.k === "get" && roomFor(c, s, sl.where) < 1) out.push(`${which} has nowhere to put it.`);
      else if (sl.k === "awk") {
        const a = thingAt(c, d, i, sl.a, s);
        if (!a || (empty(sl.name) && !sl.up)) out.push(`${which} needs the awakening’s name.`);
        else if (!empty(sl.name)) {
          const r = R.attunedRoom(a);
          const stage = sl.up && r.next ? r.next : r.stage;
          const s2 = R.attunedRoom({ ...a, stage, catch: a.catch || sl.catch.trim(), burden: a.burden || sl.burden.trim() });
          if (r.n + 1 > s2.all) out.push(`${a.name} is full at ${r.stage}. It goes up a stage once it’s got its material.`);
          else if (r.n + 1 > s2.base && s2.missing.length) out.push(`${a.name} needs ${s2.missing.map((x) => (x === "catch" ? "its Catch" : "its Burden")).join(" and ")} for that awakening.`);
        }
      }
    });
    return out;
  }

  // Everything the card says goes onto the state, and growth into
  // state.grown. It returns what happened, for the toast.
  function apply(s, c, d) {
    const said = [];
    s.grown = Array.isArray(s.grown) ? s.grown : [];
    const grow = (g) => s.grown.push(g);
    // Every track up a size, free, then Resolve paid for rolling again.
    const up = R.TRACKS.filter((t) => R.trackUp(s, t));
    if (up.length) said.push(`Every track’s up a size: ${andList(up.map((t) => `${TN(t)} d${s.tracks[t]}`))}`);
    for (let k = 0; k < spent(d); k++) R.payTrack(s, "resolve");
    d.slots.forEach((sl, i) => {
      const text = String(sl.text ?? "").trim();
      if (sl.k === "pressure") said.push(text ? `${text}: done` : "A pressure dealt with");
      else if (sl.k === "heal") {
        const back = [];
        for (const t of R.TRACKS) {
          const n = Math.min(sl.n[t] ?? 0, Math.max(0, (12 - s.tracks[t]) / 2));
          if (n > 0 && R.trackUp(s, t, n)) back.push(`${TN(t)} d${s.tracks[t]}`);
        }
        if (back.length) said.push(`You heal: ${andList(back)}`);
      } else if (sl.k === "mend" && (s.crossed[sl.key] || s.boxes?.[sl.key])) {
        const [where, ...rest] = sl.key.split("|");
        const a = pieceAt(c, sl.key);
        mend(s, sl.key);
        said.push(a ? `${cap(yours(a, { quality: true }))} ${many(a) ? "are" : "is"} mended, every box clear` : `${nameOf(c, where, rest.join("|"))} is mended`);
      } else if (sl.k === "perm" && text && !empty(sl.spec) && c.titles[sl.t] && R.slotsOf(c.titles[sl.t]) + (earlier(d, i, s).perms[sl.t] ?? 0) < R.MAX_PERMS) {
        grow({ k: "perm", t: sl.t, text, root: sl.root, spec: sl.spec.trim() });
        said.push(`“${text}” goes on your ${ORD[sl.t] ?? ""} Title, and your ${sl.root} and your ${sl.spec.trim()} are 1 more`);
      } else if (sl.k === "asp" && sl.dice) {
        const beat = Math.max(...sl.dice) > sl.opp || sl.tie;
        if (!beat) said.push(`Your Aspiration holds at d${s.asp}`);
        else if (s.asp >= 12) {
          s.asp = 2;
          if (sl.take === "title" && text) {
            grow({ k: "title", text, root: sl.troot, specs: sl.specs.map((x) => x.trim()).filter(Boolean).slice(0, 3), perm: sl.perm.trim() ? { text: sl.perm.trim(), root: sl.proot, spec: sl.pspec.trim() } : null });
            said.push(`Your Aspiration resolves, and ${text} is your new Title`);
          } else if (sl.take === "arch" && sl.arch) {
            grow({ k: "arch", arch: sl.arch });
            said.push(`Your Aspiration resolves, and you’re a ${sl.arch} too`);
          } else if (sl.take === "attune" && sl.name.trim()) {
            grow({ k: "attune", name: sl.name.trim(), aura: sl.aura.trim(), awk: sl.wname.trim() ? { name: sl.wname.trim(), kind: sl.wkind, text: sl.wtext.trim() } : null });
            said.push(`Your Aspiration resolves, and ${sl.name.trim()} is attuned to you`);
          } else said.push("Your Aspiration resolves");
          said.push("Write your new Aspiration on the Sheet tab");
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
      } else if (sl.k === "awk") {
        const a = thingAt(c, d, i, sl.a, s);
        const next = a && R.attunedRoom(a).next;
        const wentUp = Boolean(sl.up && next && !a.wentUp);
        const name = sl.name.trim();
        if (a && wentUp) grow({ k: "stage", a: sl.a, to: next });
        if (a && name) grow({ k: "awk", a: sl.a, name, kind: sl.kind, text: sl.text.trim(), catch: sl.catch.trim(), burden: sl.burden.trim() });
        if (a && (name || wentUp)) said.push(`${cap(a.name)}${wentUp ? ` goes up to ${next}` : ""}${name ? `${wentUp ? " and" : ""} gets ${name}` : ""}`);
      } else if (sl.k === "party") said.push(text ? `A slot toward ${text}` : "A slot toward the crew");
    });
    for (const w of d.swaps) {
      const t = c.titles[w.t];
      const from = t?.permissions[w.j]?.text;
      const text = w.text.trim();
      if (!from || !text || empty(w.spec) || (text === from && t.permissions[w.j].root === w.root && R.specKey(t.permissions[w.j].specialty) === R.specKey(w.spec))) continue;
      grow({ k: "swap", t: w.t, j: w.j, text, root: w.root, spec: w.spec.trim() });
      said.push(`“${from}” becomes “${text}”`);
    }
    const titled = new Set();
    for (const w of d.boons ?? []) {
      const t = c.titles[w.t];
      if (!t || !w.lever || titled.has(w.t)) continue;
      const drop = [...new Set(w.drop)].filter((j) => t.permissions[j]).slice(0, R.BOON_SLOTS);
      if (drop.length < goes(t, w.t, d, s)) continue;
      titled.add(w.t);
      const name = w.name.trim() || `the ${w.lever} Boon`;
      grow({ k: "boon", t: w.t, lever: w.lever, name: w.name.trim(), on: w.on.trim(), drop });
      said.push(drop.length ? `${andList(drop.map((j) => `“${t.permissions[j].text}”`))} ${drop.length === 1 ? "goes" : "go"} for ${name}` : `${t.name} takes ${name}`);
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

  const aspDice = (sl, c) => stepsToDice(Math.max(1, c.roots[sl.root] + R.specSteps(c, sl.spec)));
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
      sl[f] = ["t", "j", "a"].includes(f) ? Number(v) : v;
      if (String(el.dataset.s)[0] === "b" && f === "t") sl.drop = [];
      // A swap starts from the permission it's swapping: its words, Root and specialty.
      if (String(el.dataset.s)[0] === "w") {
        if (f === "t") sl.j = -1;
        if (f === "j") {
          const p = c.titles[sl.t]?.permissions[sl.j];
          Object.assign(sl, { text: p?.text ?? "", root: p?.root ?? "Body", spec: p?.specialty ?? "" });
        }
      }
      // A new permission starts on its Title's Root.
      if (sl.k === "perm" && f === "t") sl.root = c.titles[sl.t]?.root ?? sl.root;
      if (f === "a") Object.assign(sl, { up: false, catch: "", burden: "" });
    } else if (go === "heal" && sl) {
      const n = (sl.n[f] ?? 0) + Number(v);
      const total = R.TRACKS.reduce((t, x) => t + (x === f ? 0 : sl.n[x] ?? 0), 0);
      if (n >= 0 && n <= healRoom(s, d, i, f) && total + n <= R.RECOVER) sl.n[f] = n;
    } else if (go === "flip" && sl) sl[f] = !sl[f];
    else if (go === "asp-roll" && sl && !earlier(d, i, s).waiting) {
      sl.dice = aspDice(sl, c).map((size) => throwDie(size));
      sl.opp = throwDie(earlier(d, i, s).asp);
    } else if (go === "asp-real" && sl) sl.real = true;
    else if (go === "asp-call" && sl) {
      const dice = aspDice(sl, c);
      const nums = dice.map((size, j) => Math.min(size, Math.max(1, Math.round(Number(sl.pads[j]) || 0))));
      const asp = earlier(d, i, s).asp;
      const opp = sl.rerolls ? sl.opp : Math.min(asp, Math.max(1, Math.round(Number(sl.padOpp) || 0)));
      if (nums.some((x, j) => !(Number(sl.pads[j]) > 0)) || (!sl.rerolls && !(Number(sl.padOpp) > 0))) {
        d.say = "Put in every die’s number first.";
        return;
      }
      sl.dice = nums;
      sl.opp = opp;
    } else if (go === "asp-again" && sl && resolveRoom(d, s) >= 1) {
      sl.rerolls += 1;
      if (sl.real) {
        sl.dice = null;
        sl.pads = [];
      } else sl.dice = aspDice(sl, c).map((size) => throwDie(size));
    } else if (go === "asp-tie" && sl) sl.tie = true;
    else if (go === "swap-add") d.swaps.push({ t: 0, j: -1, text: "", root: "Body", spec: "" });
    else if (go === "boon-add") d.boons.push({ t: 0, drop: [], lever: "", name: "", on: "" });
    else if (go === "boon-off") d.boons.splice(Number(el.dataset.s), 1);
    else if (go === "boon-drop" && sl) {
      const j = Number(v);
      const k = sl.drop.indexOf(j);
      if (k >= 0) sl.drop.splice(k, 1);
      else sl.drop = [...sl.drop, j].slice(-R.BOON_SLOTS);
    }
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
    else if (f === "specs") sl.specs[Number(el.dataset.j)] = el.value.slice(0, 40);
    else sl[f] = el.value.slice(0, /text$/.test(f) ? 200 : 120);
    d.sure = false;
  }

  return { start, done, view, act, input, apply, warnings };
}
