// Downtime on the phone: two slots, and what they buy lands on the sheet when
// the player finishes, with one undo for the lot. On the new core (Mo's 16
// Nov rework, prompt 5 of notes/core-plan.md), every downtime starts with
// everything back, free: every Root full, every wound gone and Toll cleared,
// so there's no slot to recover in any more. The choices are Downtime's: face
// a pressure, mend something, grow (a permission, an ability, the
// Aspiration, a bond, something to carry), a new awakening on an attuned
// thing, or a slot toward the crew. A slot buys what a point does: a
// permission written with its Root, an ability off an archetype's list, or an
// awakening with the Root it locks a point of, a slot each. An Aspiration
// has no roll (Mo's answer, 16 Nov): a slot's a point in it, and at 5 it
// comes good, bringing a new Title (its 5 Root points spread and its one
// permission), a new archetype (with the ability it comes with) or a new
// attuned thing (with its awakening). A slot can go on a Scar too, and its
// third grows it into a Trait. Swapping a permission, two
// permissions for a Boon, mending a strained bond thread and marking that you
// did right by someone you've a hostile thread with don't take a slot. The
// card's a draft until it's finished, kept on the page by character (not
// saved), so closing it and coming back keeps what's picked. Every
// explanation on it is a question bubble (tip.js).
// Till the play screen's on the new core (prompt 4), the state it hands this
// card is stacking's, with tracks and no points, so everything back is every
// track on d12, and its Scars are by track, read as the Root each was on.

import { nudgeSpread } from "./builder.js";
import * as R from "./roots.js";
import { tip } from "./tip.js";
import { bondKey, threadKey, threadState } from "./threads.js";
import { isBroken, keyOf, many, mend, nameOf, pieceAt, tickedOf, worn, yours } from "./armour.js";

const CHOICES = [
  ["Face a pressure", [["pressure", "Deal with a pressure"]]],
  ["Mend", [["mend", "Mend something"]]],
  ["Grow", [["perm", "A new permission"], ["ability", "A new ability"], ["asp", "A point in your Aspiration"], ["scar", "Grow a Scar"], ["thread", "Deepen a bond"], ["get", "Get something"]]],
  ["Attunement", [["awk", "A new awakening"]]],
  ["The crew", [["party", "Toward the crew"]]],
];
const LABEL = Object.fromEntries(CHOICES.flatMap(([, list]) => list));
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const ROOM = { equipment: 3, utility: 3 };
const TN = (t) => R.TRACK[t].name;
// The state's on the new core once it's got points (s.pts).
const onCore = (s) => Boolean(s?.pts && typeof s.pts === "object");
const andList = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "");
const noRoots = () => ({ Body: 0, Mind: 0, Soul: 0 });
const sumOf = (roots) => R.ROOTS.reduce((t, r) => t + (roots?.[r] ?? 0), 0);

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
// Everything back, the way every downtime starts: on the new core every Root
// full, wounds and Toll gone (a copy, put back by R.downtimeRest), and on
// stacking's state every track on d12.
function restedOf(c, s) {
  const r = JSON.parse(JSON.stringify(s));
  if (onCore(s)) R.downtimeRest(c, r);
  else for (const t of R.TRACKS) if (r.tracks?.[t] != null) r.tracks[t] = 12;
  return r;
}
// What coming back puts back, in words.
function backOf(c, s) {
  const r = restedOf(c, s);
  if (!onCore(s)) return R.TRACKS.filter((t) => s.tracks?.[t] < 12).map((t) => `${TN(t)} d${s.tracks[t]} to d12`);
  return [
    ...R.ROOTS.filter((x) => (r.pts[x] ?? 0) > (s.pts[x] ?? 0)).map((x) => `${x} ${s.pts[x]} to ${r.pts[x]}`),
    ...R.ROOTS.filter((x) => s.wound?.[x]).map((x) => `${R.WOUNDS[x]} gone`),
    ...(s.toll ? [`${s.toll} Toll gone`] : []),
  ];
}
// Every Scar, by the Root it's on and its place there, with its slots toward
// its Trait. Stacking's state keeps them by track, each on the Root it was on.
const TRACK_ROOT = { stamina: "Body", confidence: "Mind", resolve: "Soul" };
function scarsOf(s) {
  const out = [];
  for (const root of R.ROOTS) {
    const list = onCore(s) ? s.scars?.[root] ?? [] : s.scars?.[Object.keys(TRACK_ROOT).find((t) => TRACK_ROOT[t] === root)] ?? [];
    list.forEach((text, i) => out.push({ key: R.scarKey(root, i), root, i, text: String(text || "a Scar"), ...R.scarGrowOf(s, root, i) }));
  }
  return out;
}
// An archetype's abilities it hasn't got yet, leaving out what another of the
// same archetype has, since that's the one ability, and what's taken.
const spareOf = (c, i, taken = []) => {
  const a = c.archetypes[i];
  if (!a || (a.have?.length ?? 0) >= R.MAX_ABILITIES) return [];
  const held = new Set(c.archetypes.flatMap((x) => (x.name === a.name ? x.have ?? [] : [])));
  return (a.abilities ?? []).filter((x) => !held.has(x.name) && !taken.includes(x.name));
};
// The book's own abilities for an archetype, for one an Aspiration brings.
const abilitiesOf = (B, name) => (B.archetypes ?? []).find((a) => a.name === name)?.abilities ?? [];

export function makeDowntime({ B, esc, steps, link, icon, throwDie, crewNames, isOpen, rule }) {
  const drafts = new Map();
  const pressed = (on) => ` aria-pressed="${on ? "true" : "false"}"`;
  const off = (no) => (no ? " disabled" : "");
  const blank = () => ({ k: "" });
  // A rule from the book as a question bubble's paragraphs, since a bubble
  // says its words in a line.
  const paras = (html) => String(html ?? "").replace(/<\/(?:p|li|h\d)>/g, "\n").replace(/<(?:p|li|ul|ol|h\d|div)(?:\s[^>]*)?>|<\/(?:ul|ol|div)>/g, "\n").split(/\n+/).map((x) => x.trim()).filter(Boolean);

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
    if (k === "ability") return c.archetypes.some((_, i) => spareOf(c, i).length > 0);
    if (k === "awk") return c.attuned.length > 0;
    if (k === "scar") return scarsOf(s).some((x) => !x.trait);
    return true;
  }

  function fresh(k, c, s) {
    const firstTitle = Math.max(0, c.titles.findIndex((t) => R.slotsOf(t) < R.MAX_PERMS));
    const firstArch = Math.max(0, c.archetypes.findIndex((_, i) => spareOf(c, i).length > 0));
    return {
      pressure: { k, text: "" }, mend: { k, key: crossed(c, s)[0]?.key ?? "" },
      perm: { k, t: firstTitle, text: "", root: R.mostOf(c.titles[firstTitle]?.roots ?? {}) || "Body" },
      ability: { k, a: firstArch, name: "" },
      asp: { k, take: "", text: "", roots: noRoots(), perm: "", proot: "Body", arch: "", ability: "", name: "", wname: "", wroot: R.bestRoot(c), wtext: "" },
      scar: { k, key: scarsOf(s).find((x) => !x.trait)?.key ?? "", trait: "" },
      thread: { k, person: "", text: "", tkind: "bond" }, get: { k, text: "", where: "bag" },
      awk: { k, a: 0, name: "", root: R.bestRoot(c), text: "", catch: "", burden: "", up: false }, party: { k, text: "" },
    }[k] ?? blank();
  }

  // What the slots before this one have done, so the second builds on the
  // first: permissions on each Title, abilities on each archetype,
  // awakenings on each attuned thing and a stage gone up, a Catch or Burden
  // written, the points in the Aspiration, and the slots on each Scar.
  function earlier(d, i, s) {
    const out = { perms: {}, abil: {}, awk: {}, up: {}, catch: {}, burden: {}, asp: R.aspOf(s), scar: {} };
    for (const sl of d.slots.slice(0, i)) {
      if (sl.k === "perm" && sl.text.trim()) out.perms[sl.t] = (out.perms[sl.t] ?? 0) + 1;
      if (sl.k === "ability" && sl.name) out.abil[sl.a] = [...(out.abil[sl.a] ?? []), sl.name];
      if (sl.k === "awk") {
        if (sl.name.trim()) out.awk[sl.a] = (out.awk[sl.a] ?? 0) + 1;
        if (sl.up) out.up[sl.a] = true;
        if (sl.catch.trim()) out.catch[sl.a] = sl.catch.trim();
        if (sl.burden.trim()) out.burden[sl.a] = sl.burden.trim();
      }
      if (sl.k === "asp") out.asp = out.asp + 1 >= R.ASP_PTS ? 0 : out.asp + 1;
      if (sl.k === "scar" && sl.key) out.scar[sl.key] = (out.scar[sl.key] ?? 0) + 1;
    }
    return out;
  }
  // Abilities an earlier slot's taking, on this archetype or another of the same.
  const takenBefore = (c, d, i, a) => c.archetypes.flatMap((x, k) => (x.name === c.archetypes[a]?.name ? earlier(d, i, { aspPts: 0 }).abil[k] ?? [] : []));
  // A Scar's slots once the earlier slot's done, and whether this one's the
  // third, the one that grows it into a Trait.
  const scarAt = (s, d, i, key) => {
    const x = scarsOf(s).find((y) => y.key === key);
    return x ? { ...x, n: x.n + (earlier(d, i, s).scar[key] ?? 0) } : null;
  };
  // An attuned thing as it stands once the earlier slot's done.
  function thingAt(c, d, i, j, s) {
    const a = c.attuned[j];
    if (!a) return null;
    const e = earlier(d, i, s);
    const r = R.attunedRoom(a);
    const stage = e.up[j] && r.next ? r.next : r.stage;
    return { ...a, stage, catch: a.catch || e.catch[j] || null, burden: a.burden || e.burden[j] || null, awakenings: { length: a.awakenings.length + (e.awk[j] ?? 0) }, wentUp: Boolean(e.up[j]) };
  }

  // ---------------------------------------------------------------- drawing

  const chips = (where, field, items, now, label) => `<div class="cc-chips" role="group" aria-label="${esc(label)}">${items.map(([v, text, dis]) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="set" data-s="${where}" data-f="${field}" data-v="${esc(v)}"${pressed(String(now) === String(v))}${off(dis)}>${text}</button>`).join("")}</div>`;
  const field = (where, f, label, value, extra = "") => `<label class="cc-field">${label} <input data-dt="${where}" data-f="${f}" value="${esc(value)}" maxlength="${/text$/.test(f) ? 200 : 80}" autocomplete="off"${extra}></label>`;
  // A line that stays on the card, with the rest of what it means behind a ?.
  const say = (line, id, words, label) => `<p class="cc-lead dt-say">${line} ${tip(id, words, label)}</p>`;
  const quickTest = () => (B.quickTest?.length ? `The quick test: ${B.quickTest.map((q) => q.replace(/\?$/, "")).join("? ")}? Four yeses and it’s a permission.` : "");
  const roots = (where, f, now, label = "Its Root") => chips(where, f, R.ROOTS.map((r) => [r, r]), now, label);

  // A new Title's 5 Root points: All on for one Root in a tap, and a stepper
  // on each, the builder's way (nudgeSpread).
  function spreadView(sl, i) {
    const sum = sumOf(sl.roots);
    const step = (r) => `<div class="cc-stepper"><span>${r}</span><span class="cc-step"><button type="button" class="cc-stepbtn" data-act="dt" data-do="tnudge" data-s="${i}" data-v="${r}" data-n="-1" aria-label="${r}: one less"${off(!sl.roots[r])}>−</button><output>${sl.roots[r]}</output><button type="button" class="cc-stepbtn" data-act="dt" data-do="tnudge" data-s="${i}" data-v="${r}" data-n="1" aria-label="${r}: one more${sum >= R.TITLE_ROOTS ? ", off the biggest of the others" : ""}"${off(sl.roots[r] >= R.TITLE_ROOTS)}>+</button></span></div>`;
    return `<p class="cc-lead dt-say">Its 5 Root points${sum ? `: ${R.ROOTS.filter((r) => sl.roots[r]).map((r) => `${r} ${sl.roots[r]}`).join(", ")}${sum < R.TITLE_ROOTS ? `, ${R.TITLE_ROOTS - sum} to go` : ""}` : ""} ${tip(`dt-spread-${i}`, ["A Title puts 5 on your Roots, spread however you like. Put them where the Title lives.", "All on puts all 5 on one Root, and + moves one more onto a Root, off the biggest of the others."], "Spreading a Title")}</p>
      <div class="cc-chips" role="group" aria-label="All 5 on one Root">${R.ROOTS.map((r) => `<button type="button" class="cc-chipbtn sm" data-act="dt" data-do="tall" data-s="${i}" data-v="${r}"${pressed(sl.roots[r] === R.TITLE_ROOTS)}>All on ${r}</button>`).join("")}</div>
      ${R.ROOTS.map(step).join("")}`;
  }

  // A point in the Aspiration, and when it's the fifth, what it brings.
  function aspView(sl, i, c, s, d) {
    const had = earlier(d, i, s).asp;
    const good = had + 1 >= R.ASP_PTS;
    const takes = [["title", "A new Title"], ["arch", "A new archetype"], ["attune", "A new attuned thing"]];
    const arch = (B.archetypes ?? []).find((a) => a.name === sl.arch);
    const others = new Set(c.archetypes.filter((x) => x.name === sl.arch).flatMap((x) => x.have ?? []));
    const pips = `<span class="dt-pips" aria-hidden="true">${Array.from({ length: R.ASP_PTS }, (_, k) => `<i class="${k < had ? "on" : k === had ? "new" : ""}"></i>`).join("")}</span>`;
    const head = `<p class="cc-lead dt-say">${pips}<span>${good ? `This slot’s its fifth point, so it comes good.` : `It’s got ${had} of ${R.ASP_PTS}, and this slot makes it ${had + 1}.`}</span> ${tip(`dt-asp-${i}`, ["Your Aspiration takes 5 points to get there, and there’s no roll. Every downtime slot you spend on it is a point in it, and a setback takes one back off.", "When it’s got all 5 it comes good: you get what you were after, and a new Title, archetype or attuned thing, the same as 5 points buy when you make a character.", link("s-aspiration", "How Aspiration works")], "Your Aspiration")}</p>`;
    if (!good) return head;
    return `${head}<h3>What it gives you</h3>${chips(i, "take", takes.map(([v, t]) => [v, t]), sl.take, "What your Aspiration gives you")}
      ${sl.take === "title" ? `${field(i, "text", "Your new Title", sl.text)}${spreadView(sl, i)}
        ${field(i, "perm", "The permission it comes with", sl.perm)}<p class="cc-lead">Its Root</p>${roots(i, "proot", sl.proot, "The permission’s Root")}` : ""}
      ${sl.take === "arch" ? `<label class="cc-field">The archetype <select id="dt-arch-${i}" data-dt="${i}" data-f="arch"><option value="">Pick one</option>${B.archetypes.map((a) => `<option value="${esc(a.name)}"${sl.arch === a.name ? " selected" : ""}>${esc(a.name)}${c.archetypes.some((x) => x.name === a.name) ? " again" : ""}</option>`).join("")}</select></label>
        ${arch ? `<p class="cc-lead">${arch.summary}</p><p class="cc-lead dt-say">The ability it comes with ${tip(`dt-abl-${i}`, ["An archetype comes with one ability, your pick. It costs Aura when you use it, like any ability, and more come a downtime slot each."], "Its ability")}</p>
          <div class="cc-chips" role="group" aria-label="The ability it comes with">${abilitiesOf(B, arch.name).map((x) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="set" data-s="${i}" data-f="ability" data-v="${esc(x.name)}"${pressed(sl.ability === x.name)}${off(others.has(x.name))}>${esc(x.name)}${others.has(x.name) ? " <small>you’ve got it</small>" : ""}</button>`).join("")}</div>` : ""}` : ""}
      ${sl.take === "attune" ? `${field(i, "name", "The thing", sl.name)}${field(i, "wname", "The awakening it comes with", sl.wname)}
        <p class="cc-lead">The Root it fits</p>${roots(i, "wroot", sl.wroot, "The Root the awakening fits")}${field(i, "wtext", "What it does", sl.wtext)}
        ${say("Its awakening locks a point of its Root.", `dt-att-${i}`, ["A new attuned thing starts at Awakened with the one awakening it comes with. That awakening locks a point of the Root it fits, and it’s 2 steps on any roll it fits. Attuned things don’t touch your Aura."], "A new attuned thing")}` : ""}
      <p class="cc-lead">Your new Aspiration starts with nothing in it. Write it on the Sheet tab.</p>`;
  }

  // A slot on a Scar, and on its third, the Trait it grows into.
  function scarView(sl, i, c, s, d) {
    const list = scarsOf(s);
    const now = scarAt(s, d, i, sl.key);
    const third = now && now.n + 1 >= R.SCAR_SLOTS;
    return `${chips(i, "key", list.map((x) => [x.key, `<em>${esc(x.text)}</em> <small>${x.root}, ${x.trait ? "a Trait already" : `${x.n + (earlier(d, i, s).scar[x.key] ?? 0)} of ${R.SCAR_SLOTS}`}</small>`, Boolean(x.trait) || x.n + (earlier(d, i, s).scar[x.key] ?? 0) >= R.SCAR_SLOTS]), sl.key, "Which Scar")}
      ${now ? say(third ? "This slot’s its third, so it grows into a Trait." : `This slot makes it ${now.n + 1} of ${R.SCAR_SLOTS}.`, `dt-scar-${i}`, ["Three downtime slots on a Scar, in one downtime or across a few, grow it into a Trait: something that grew out of what happened to you, always true, worked out with the GM.", "It’s still a Scar, so it still holds you and its point’s still locked, but now it gives as well. A lost eye that sees magic, a burn that knows where fire goes.", link("s-blaze", "Scars")], "Growing a Scar") : ""}
      ${third ? field(i, "trait", "The Trait it grows into", sl.trait) : ""}`;
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
      ${say(`${esc(cap(a.name))} is ${r.stage}, with ${r.n} awakening${r.n === 1 ? "" : "s"}${a.wentUp ? " once your first slot’s done" : ""}.`, `dt-stage-${i}`, [`${r.stage} holds ${r.base}, and ${r.base} more with ${price[r.stage]}. Each new stage needs a material, found in the story or bought, and every new awakening takes a slot.`, link("attunement-stages", "The three stages")], "The three stages")}
      ${r.next && !a.wentUp ? `<button type="button" class="cc-line" data-act="dt" data-do="flip" data-s="${i}" data-f="up"${pressed(sl.up)}><span class="tick" aria-hidden="true"></span><span>It’s got its material, so it goes up to ${r.next} <small>found in the story or bought</small></span></button>` : ""}
      ${full && !sl.up ? `<p class="cc-warn">It’s full at ${r.stage}. It goes up a stage once it’s got its material.</p>` : `
      ${extra && !a.catch && s2.needs.includes("catch") ? field(i, "catch", `Its Catch <small>it needs one to hold more than ${s2.base}</small>`, sl.catch) : ""}
      ${extra && !a.burden && s2.needs.includes("burden") ? field(i, "burden", `Its Burden <small>a permanent cost, like <em>Bad Knee</em>, and it needs one to hold more than ${s2.base}</small>`, sl.burden) : ""}
      ${field(i, "name", "The awakening", sl.name)}
      <p class="cc-lead">The Root it fits</p>${roots(i, "root", sl.root, "The Root it fits")}
      ${field(i, "text", "What it does", sl.text)}
      ${say("Write it as something the thing itself does.", `dt-awk-${i}`, ["Write it as something the thing itself does, the way you’d write a permission, with the Root it fits.", "It locks a point of that Root, so you hold a point less there, but you still roll all of it. It’s 2 steps on any roll it fits, and 2 more for each Aura you put in it."], "Awakenings")}`}`;
  }

  function formView(sl, i, c, s, d) {
    switch (sl.k) {
      case "pressure":
        return `${field(i, "text", "What you’re dealing with", sl.text)}${say("One slot usually settles it.", `dt-press-${i}`, ["Pay the debt, answer the letter, lie low, meet the man. One slot usually settles a pressure, and the GM says if it needs two. If something pushes back, roll for it."], "Facing a pressure")}`;
      case "mend":
        return `${chips(i, "key", crossed(c, s).map((x) => [x.key, `${esc(x.name)}${x.note ? ` <small>${esc(x.note)}</small>` : ""}`]), sl.key, "What you’re mending")}${say("Mending usually takes a purse of gold as well.", `dt-mend-${i}`, ["Mending something usually takes a purse of gold as well. Mended armour has every box clear.", link("s-armour-quality", "Armour’s boxes")], "Mending")}`;
      case "perm": {
        const t = c.titles[sl.t];
        const e = earlier(d, i, s);
        const has = (j) => R.slotsOf(c.titles[j]) + (e.perms[j] ?? 0);
        return `${chips(i, "t", c.titles.map((x, j) => [j, `<em>${esc(x.text ?? x.name)}</em> <small>${has(j)} of ${R.MAX_PERMS}</small>`, has(j) >= R.MAX_PERMS]), sl.t, "Which Title")}
          ${t ? say(`It has to fit inside <em>${esc(t.text ?? t.name)}</em>.`, `dt-perm-${i}`, ["It has to fit inside its Title, and the story should say where you learned it. It puts 1 on the Root it’s written with: a step more when you roll it, and a point more to take hits with and spend. It’s one more thing that can bring a Root in, too.", quickTest()].filter(Boolean), "A new permission") : ""}
          ${field(i, "text", "The permission", sl.text)}
          <p class="cc-lead">Its Root</p>${roots(i, "root", sl.root)}`;
      }
      case "ability": {
        const e = earlier(d, i, s);
        const pickable = c.archetypes.map((x, j) => [j, `${esc(x.name)} <small>${(x.have ?? []).length} of ${(x.abilities ?? []).length}</small>`, !spareOf(c, j, takenBefore(c, d, i, j)).length]);
        const a = c.archetypes[sl.a];
        const spare = a ? spareOf(c, sl.a, takenBefore(c, d, i, sl.a)) : [];
        return `${chips(i, "a", pickable, sl.a, "Which archetype")}
          ${a ? `${say(`One more off the ${esc(a.name)}’s list.`, `dt-ab-${i}`, ["An ability costs Aura each time you use it, 1 unless it says. An archetype holds six at most, and one you’ve got on another of the same archetype is the one ability."], "A new ability")}
            ${spare.length ? `<div class="dt-abils" role="group" aria-label="The ability">${spare.map((x) => `<button type="button" class="bd-tok dt-abil" data-act="dt" data-do="set" data-s="${i}" data-f="name" data-v="${esc(x.name)}"${pressed(sl.name === x.name)}><b>${esc(x.name)}</b><span class="bd-for">${String(x.html ?? esc(x.text)).replace(/<a [^>]*>|<\/a>/g, "")}</span></button>`).join("")}</div>` : `<p class="cc-warn">${esc(a.name)} has every ability it can${e.abil[sl.a]?.length ? " once your first slot’s done" : ""}.</p>`}` : ""}`;
      }
      case "asp":
        return aspView(sl, i, c, s, d);
      case "scar":
        return scarView(sl, i, c, s, d);
      case "thread": {
        // Someone you've already got a bond with, or someone new. Either
        // way it goes under their one bond.
        const people = c.threads.map((p) => p.person);
        const mine = people.find((p) => bondKey(p) === bondKey(sl.person));
        return `${chips(i, "tkind", [["bond", "A bond thread"], ["hostile", "A hostile thread"]], sl.tkind ?? "bond", "What kind of thread")}
          ${people.length ? `<p class="cc-lead">Who it’s with: one of your bonds, or someone new.</p>${chips(i, "person", people.map((p) => [p, esc(p)]), mine ?? "", "Who it’s with")}` : ""}
          ${field(i, "person", people.length ? "Or someone new" : "Who it’s with", mine ? "" : sl.person)}${field(i, "text", "The thread", sl.text)}${say("It goes under your bond with them.", `dt-thread-${i}`, ["A bond thread or a hostile one, whichever the story’s given you. It goes under your bond with them. If they’re in the crew, it goes on both your sheets, so agree on it together."], "Deepening a bond")}`;
      }
      case "get": {
        const room = roomFor(c, s, sl.where);
        return `${field(i, "text", "What you’re getting", sl.text)}
          <label class="cc-field">It goes in <select id="dt-where-${i}" data-dt="${i}" data-f="where">${[["bag", "the bag"], ["utility", "utility"], ["equipment", "equipment"]].map(([v, t]) => `<option value="${v}"${sl.where === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
          ${room < 1 ? `<p class="cc-warn">There’s no room there.</p>` : ""}
          ${say("Bought, made, won or owed.", `dt-get-${i}`, ["Something to carry, a purse of gold, or the material an attuned thing needs for its next stage, whether it’s bought, made, won or owed."], "Getting something")}`;
      }
      case "awk":
        return awkView(sl, i, c, s, d);
      case "party":
        return `${field(i, "text", "What it’s for", sl.text)}${say("Play this at the table.", `dt-party-${i}`, ["The crew gets one action a downtime, on the party sheet. Put your slot into the crew’s action and two slots on one move count everything twice. Or chase the Goal, work a project or help someone’s Aspiration with it on its own. It can never be a second move on a faction."], "The crew’s action")}`;
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
    return `<div class="dt-swap">${chips(where, "t", c.titles.map((x, j) => [j, `<em>${esc(x.text ?? x.name)}</em>`]), w.t, "Which Title")}
      ${t ? chips(where, "j", t.permissions.map((p, j) => [j, `<em>${esc(p.text)}</em>`]), w.j, "The permission going") : ""}
      ${w.j >= 0 ? `${field(where, "text", "What it becomes", w.text)}<p class="cc-lead">Its Root</p>${roots(where, "root", w.root)}` : ""}
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
    const rul = (B.boons ?? []).find((x) => x.lever === w.lever);
    return `<div class="dt-swap">${chips(where, "t", c.titles.map((x, j) => [j, `<em>${esc(x.text ?? x.name)}</em>`]), w.t, "Which Title")}
      ${t && need ? `<p class="cc-lead">${need === 1 ? "Pick the permission that goes." : "Pick the two permissions that go."}</p><div class="cc-chips" role="group" aria-label="The permissions going">${t.permissions.map((p, j) => `<button type="button" class="cc-chipbtn" data-act="dt" data-do="boon-drop" data-s="${where}" data-v="${j}"${pressed(w.drop.includes(j))}><em>${esc(p.text)}</em></button>`).join("")}</div>` : t ? `<p class="cc-lead">${esc(t.text ?? t.name)} has two slots free, so nothing has to go.</p>` : ""}
      ${chips(where, "lever", (B.boons ?? []).map((x) => [x.lever, esc(x.lever)]), w.lever, "Which Boon")}
      ${rul ? `<p class="cc-lead">${esc(cap(rul.text))}.</p>${field(where, "name", "Its name from the story, if you like", w.name)}${BOON_ON[w.lever] ? field(where, "on", BOON_ON[w.lever], w.on) : ""}` : ""}
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
    const back = backOf(c, s);
    return `<div class="dlg-head"><div class="cc-live"><h2 id="dlg-title">Downtime</h2><p class="cc-small">${picked} of ${n} slots picked</p></div>
      <button type="button" class="cc-x" data-act="close" aria-label="Close">${icon.close}</button></div>
    <div class="dlg-body">
      <p class="cc-lead">Every downtime starts with everything back, free${back.length ? `: ${andList(back)}` : onCore(s) ? ", and you’re full already" : ", and they’re all on d12"}. Then pick what each of your two slots is for. ${tip("dt-how", [...paras(rule("your-slots")), "A slot buys what a point does when you make a character: a permission, an ability, an awakening or something to carry. What it buys lands on your sheet when you finish.", link("what-you-can-do-with-a-slot", "What a slot can do")], "Your slots")}</p>
      ${d.slots.map((_, i) => slotView(d, i, c, s)).join("")}
      <details class="cc-group" data-open="dt-free"${isOpen("dt-free") || d.swaps.length || d.boons.length || d.mends.length || d.rights.length ? " open" : ""}><summary>Without a slot <small>${andList(free)}</small></summary>
        <h3><span>Swap a permission</span> ${tip("dt-swap", ["Swap any permission for another that fits its Title, as long as it makes sense for your character. Your Roots change with it."], "Swapping a permission")}</h3>
        ${d.swaps.map((w, k) => swapView(w, k, c)).join("")}
        <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="swap-add">${d.swaps.length ? "Swap another" : "Swap a permission"}</button></div>
        <h3><span>Two permissions for a Boon</span> ${tip("dt-boon", ["Two permissions on one Title can go for a Boon, which takes their two slots. A Boon can go back for two permissions the same way, from Change.", link("s-boons", "Boons and Burdens")], "Boons")}</h3>
        ${d.boons.map((w, k) => boonView(w, k, c, d, s)).join("")}
        <div class="cc-row"><button type="button" class="button sm" data-act="dt" data-do="boon-add">${d.boons.length ? "Another Boon" : "Two permissions for a Boon"}</button></div>
        ${strained.length ? `<h3><span>Mend a strained bond thread</span> ${tip("dt-strain", ["Make it right with them, whatever suits them, and play it out at the table.", link("s-downtime-threads", "Mending threads")], "Mending a thread")}</h3>
          ${strained.map((t) => `<button type="button" class="cc-line" data-act="dt" data-do="mend" data-v="${esc(t.key)}"${pressed(d.mends.includes(t.key))}><span class="tick" aria-hidden="true"></span><span><em>${esc(t.text)}</em> <small>${esc(t.person)}</small></span></button>`).join("")}` : ""}
        ${grudges.length ? `<h3><span>Did right by them</span> ${tip("dt-right", ["Doing right by someone you’ve a hostile thread with, like paying what you owe, strains it, and doing right by them again snaps it. Tick the ones you did right by this week."], "Doing right by them")}</h3>
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
      const tname = t.text ?? t.name;
      if (titled.has(w.t)) out.push(`${tname} takes one Boon a downtime here, so the second waits for the next.`);
      else if (w.drop.filter((j) => t.permissions[j]).length < goes(t, w.t, d, s)) out.push(`${tname} needs ${goes(t, w.t, d, s) === 1 ? "a permission" : "two permissions"} picked to make room for ${w.name.trim() || `the ${w.lever} Boon`}.`);
      titled.add(w.t);
    }
    d.slots.forEach((sl, i) => {
      const which = `Your ${ORD[i]} slot`;
      if (!sl.k) out.push(`${which} isn’t picked yet, so it goes to waste.`);
      else if (sl.k === "perm" && (empty(sl.text) || !R.ROOTS.includes(sl.root))) out.push(`${which} needs the new permission’s words and its Root.`);
      else if (sl.k === "perm" && c.titles[sl.t] && R.slotsOf(c.titles[sl.t]) + (earlier(d, i, s).perms[sl.t] ?? 0) >= R.MAX_PERMS) out.push(`${which} would be a seventh permission on ${c.titles[sl.t].text ?? c.titles[sl.t].name}, and six is the most a Title holds.`);
      else if (sl.k === "ability" && (!sl.name || !spareOf(c, sl.a, takenBefore(c, d, i, sl.a)).some((x) => x.name === sl.name))) out.push(`${which} needs the ability.`);
      else if (sl.k === "scar" && !scarAt(s, d, i, sl.key)) out.push(`${which} needs the Scar it’s going on.`);
      else if (sl.k === "scar" && scarAt(s, d, i, sl.key).n + 1 >= R.SCAR_SLOTS && empty(sl.trait)) out.push(`${which} grows your Scar into a Trait, so it needs the Trait.`);
      else if (sl.k === "asp" && earlier(d, i, s).asp + 1 >= R.ASP_PTS) {
        if (!sl.take) out.push(`${which} resolves your Aspiration, so pick a new Title, archetype or attuned thing.`);
        else if (sl.take === "title" && (empty(sl.text) || sumOf(sl.roots) !== R.TITLE_ROOTS || empty(sl.perm))) out.push(`${which} needs your new Title, its 5 Root points spread and the permission it comes with.`);
        else if (sl.take === "arch" && (!sl.arch || !sl.ability)) out.push(`${which} needs the archetype and the ability it comes with.`);
        else if (sl.take === "attune" && (empty(sl.name) || empty(sl.wname) || !R.ROOTS.includes(sl.wroot))) out.push(`${which} needs the thing you’re attuning, the awakening it comes with and the Root that fits.`);
      } else if (sl.k === "thread" && (empty(sl.person) || empty(sl.text))) out.push(`${which} needs who the thread’s with, and the thread.`);
      else if (sl.k === "get" && empty(sl.text)) out.push(`${which} needs what you’re getting.`);
      else if (sl.k === "get" && roomFor(c, s, sl.where) < 1) out.push(`${which} has nowhere to put it.`);
      else if (sl.k === "awk") {
        const a = thingAt(c, d, i, sl.a, s);
        if (!a || (empty(sl.name) && !sl.up)) out.push(`${which} needs the awakening’s name.`);
        else if (!empty(sl.name) && !R.ROOTS.includes(sl.root)) out.push(`${which} needs the Root the awakening fits.`);
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
    const fresh = [];
    const grow = (g) => {
      s.grown.push(g);
      fresh.push(g);
    };
    // Everything back first, free.
    const back = backOf(c, s);
    if (onCore(s)) R.downtimeRest(c, s);
    else for (const t of R.TRACKS) R.trackUp(s, t, Math.max(0, (12 - (s.tracks?.[t] ?? 12)) / 2));
    if (back.length) said.push(`Everything’s back: ${andList(back)}`);
    d.slots.forEach((sl, i) => {
      const text = String(sl.text ?? "").trim();
      if (sl.k === "pressure") said.push(text ? `${text}: done` : "A pressure dealt with");
      else if (sl.k === "mend" && (s.crossed[sl.key] || s.boxes?.[sl.key])) {
        const [where, ...rest] = sl.key.split("|");
        const a = pieceAt(c, sl.key);
        mend(s, sl.key);
        said.push(a ? `${cap(yours(a, { quality: true }))} ${many(a) ? "are" : "is"} mended, every box clear` : `${nameOf(c, where, rest.join("|"))} is mended`);
      } else if (sl.k === "perm" && text && R.ROOTS.includes(sl.root) && c.titles[sl.t] && R.slotsOf(c.titles[sl.t]) + (earlier(d, i, s).perms[sl.t] ?? 0) < R.MAX_PERMS) {
        grow({ k: "perm", t: sl.t, text, root: sl.root });
        said.push(`“${text}” goes on your ${ORD[sl.t] ?? ""} Title, and your ${sl.root} is 1 more`);
      } else if (sl.k === "ability" && sl.name && spareOf(c, sl.a, takenBefore(c, d, i, sl.a)).some((x) => x.name === sl.name)) {
        grow({ k: "ability", a: sl.a, name: sl.name });
        said.push(`Your ${c.archetypes[sl.a].name} gets ${sl.name}`);
      } else if (sl.k === "asp") {
        // A point in it, and at 5 it comes good and starts again with nothing.
        const pts = R.aspOf(s) + 1;
        if (pts < R.ASP_PTS) {
          s.aspPts = pts;
          said.push(`Your Aspiration’s got ${pts} of ${R.ASP_PTS}`);
        } else {
          s.aspPts = 0;
          if (sl.take === "title" && text && sumOf(sl.roots) === R.TITLE_ROOTS) {
            grow({ k: "title", text, roots: { ...sl.roots }, perm: sl.perm.trim() ? { text: sl.perm.trim(), root: sl.proot } : null });
            said.push(`Your Aspiration comes good, and ${text} is your new Title`);
          } else if (sl.take === "arch" && sl.arch) {
            grow({ k: "arch", arch: sl.arch, have: sl.ability ? [sl.ability] : [] });
            said.push(`Your Aspiration comes good, and you’re a ${sl.arch} too${sl.ability ? `, with ${sl.ability}` : ""}`);
          } else if (sl.take === "attune" && sl.name.trim()) {
            grow({ k: "attune", name: sl.name.trim(), awk: sl.wname.trim() ? { name: sl.wname.trim(), root: sl.wroot, text: sl.wtext.trim() } : null });
            said.push(`Your Aspiration comes good, and ${sl.name.trim()} is attuned to you`);
          } else said.push("Your Aspiration comes good");
          said.push("Write your new Aspiration on the Sheet tab");
        }
        // Stacking's play screen still shows a die, so it's kept in step.
        s.asp = Math.min(12, 2 + 2 * s.aspPts);
      } else if (sl.k === "scar") {
        const x = scarsOf(s).find((y) => y.key === sl.key);
        if (x && !x.trait) {
          const n = Math.min(R.SCAR_SLOTS, x.n + 1);
          const trait = n >= R.SCAR_SLOTS ? String(sl.trait ?? "").trim().slice(0, 200) : "";
          s.scarGrow = { ...(s.scarGrow ?? {}), [x.key]: trait ? { n, trait } : { n } };
          said.push(trait ? `Your Scar, ${x.text}, grows into a Trait: ${trait}` : `Your Scar, ${x.text}, is ${n} of ${R.SCAR_SLOTS} toward its Trait`);
        }
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
        if (a && name) grow({ k: "awk", a: sl.a, name, root: sl.root, text: sl.text.trim(), catch: sl.catch.trim(), burden: sl.burden.trim() });
        if (a && (name || wentUp)) said.push(`${cap(a.name)}${wentUp ? ` goes up to ${next}` : ""}${name ? `${wentUp ? " and" : ""} gets ${name}` : ""}`);
      } else if (sl.k === "party") said.push(text ? `A slot toward ${text}` : "A slot toward the crew");
    });
    for (const w of d.swaps) {
      const t = c.titles[w.t];
      const from = t?.permissions[w.j]?.text;
      const text = w.text.trim();
      if (!from || !text || !R.ROOTS.includes(w.root) || (text === from && t.permissions[w.j].root === w.root)) continue;
      grow({ k: "swap", t: w.t, j: w.j, text, root: w.root });
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
      said.push(drop.length ? `${andList(drop.map((j) => `“${t.permissions[j].text}”`))} ${drop.length === 1 ? "goes" : "go"} for ${name}` : `${t.text ?? t.name} takes ${name}`);
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
    // What it grew lands on a character who's full, so every Root's full on
    // the sheet it makes (a new permission's point included, and less a point
    // a new awakening locks).
    if (onCore(s)) {
      const c2 = R.growRoots(JSON.parse(JSON.stringify(c)), fresh, B);
      c2.roots = R.countRoots(c2.titles).roots;
      for (const r of R.ROOTS) s.pts[r] = R.capOf(c2, s, r);
    }
    return said;
  }

  // A second slot's ability can't be one the first one's taking.
  function act(el, d, c, s) {
    act1(el, d, c, s);
    d.slots.forEach((sl, j) => {
      if (sl.k === "ability" && sl.name && !spareOf(c, sl.a, takenBefore(c, d, j, sl.a)).some((x) => x.name === sl.name)) sl.name = "";
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
      sl[f] = ["t", "j", "a"].includes(f) ? Number(v) : v;
      if (String(el.dataset.s)[0] === "b" && f === "t") sl.drop = [];
      // A swap starts from the permission it's swapping: its words and Root.
      if (String(el.dataset.s)[0] === "w") {
        if (f === "t") sl.j = -1;
        if (f === "j") {
          const p = c.titles[sl.t]?.permissions[sl.j];
          Object.assign(sl, { text: p?.text ?? "", root: p?.root ?? "Body" });
        }
      }
      // A new permission starts on the Root its Title puts most on.
      if (sl.k === "perm" && f === "t") sl.root = R.mostOf(c.titles[sl.t]?.roots ?? {}) || sl.root;
      if (sl.k === "ability" && f === "a") sl.name = "";
      if (sl.k === "awk" && f === "a") Object.assign(sl, { up: false, catch: "", burden: "" });
    } else if (go === "tall" && sl) sl.roots = nudgeSpread(sl.roots, v, "all");
    else if (go === "tnudge" && sl) sl.roots = nudgeSpread(sl.roots, v, Number(el.dataset.n) > 0 ? "up" : "down");
    else if (go === "flip" && sl) sl[f] = !sl[f];
    else if (go === "swap-add") d.swaps.push({ t: 0, j: -1, text: "", root: "Body" });
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
    else {
      sl[f] = el.value.slice(0, /text$/.test(f) ? 200 : 120);
      // A different archetype from an Aspiration has different abilities.
      if (f === "arch") sl.ability = "";
    }
    d.sure = false;
  }

  return { start, done, view, act, input, apply, warnings };
}
