// A character built on the phone before the Roots change (8 Nov 2026), or
// made their own from the crew, shown as it was: their set actions with the
// dice they rolled, their Titles and permissions, traits, what they carry,
// threads and where they'd got to. It's read straight off what's saved, so
// nothing's lost, and none of it plays: the builder rebuilds them on Roots
// once it's on the new rules (stage 4 of notes/roots-plan.md).
import { diceLabel, stepsToDice } from "./dice.js";
import { threadKey } from "./threads.js";

const ORD = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];
const text = (v) => (typeof v === "string" ? v.trim() : typeof v?.text === "string" ? v.text.trim() : "");
const list = (v) => (Array.isArray(v) ? v : []);

export function beforeView(ch, { esc, link, back, tools }) {
  const b = ch.build && typeof ch.build === "object" ? ch.build : {};
  const s = ch.state && typeof ch.state === "object" ? ch.state : {};
  const titles = list(b.titles).filter((t) => text(t) || list(t?.perms).some(text));
  const lines = [
    ...titles.flatMap((t) => [{ label: `Title: ${text(t)}`, on: list(t.on) }, ...list(t.perms).filter(text).map((p) => ({ label: text(p), on: list(p.on) }))]),
    ...["equipment", "utility"].flatMap((w) => list(b[w]).filter(text).map((x) => ({ label: text(x), on: list(x.on) }))),
    ...(text(b.keepsake) ? [{ label: text(b.keepsake), on: list(b.keepsake?.on) }] : []),
    ...list(b.attuned).flatMap((a) => list(a?.perms).filter(text).map((p) => ({ label: `${text(p)} (${text(a.name) || "attuned"})`, on: list(p.on) }))),
  ];
  // A set action was a step for every line on it, and one for the action.
  const acts = list(b.actions).filter((a) => typeof a === "string").map((name) => {
    const on = lines.filter((l) => l.on.includes(name));
    const n = on.length + 1;
    return `<li class="cc-item"><p><b>${esc(name)}</b> <small>${n} step${n === 1 ? "" : "s"}, ${esc(diceLabel(stepsToDice(n)))}</small></p>${on.length ? `<p class="cc-lead">${on.map((l) => esc(l.label)).join(" · ")}</p>` : ""}</li>`;
  }).join("");
  const perms = titles.map((t, i) => `<li class="cc-item"><p class="eyebrow">${ORD[i] ?? ""} Title${text(t.arch) ? ` · ${esc(text(t.arch))}` : ""}</p><p><b><em>${esc(text(t))}</em></b></p>${list(t.perms).filter(text).length ? `<p class="cc-lead">${list(t.perms).filter(text).map((p) => `<em>${esc(text(p))}</em>`).join(" · ")}</p>` : ""}</li>`).join("");
  const traits = list(b.traits).filter((t) => text(t?.name)).map((t) => `<li class="cc-item"><p><b>${esc(text(t.name))}</b>${text(t.own) ? ` ${esc(text(t.own))}` : ""}</p></li>`).join("");
  const carried = [...["equipment", "utility"].flatMap((w) => list(b[w]).map(text)), text(b.keepsake), ...String(b.bag ?? "").split("\n").map((x) => x.trim())].filter(Boolean);
  const attuned = list(b.attuned).filter((a) => text(a?.name)).map((a) => `<li class="cc-item"><p><b>${esc(text(a.name))}</b> <small>${esc(text(a.stage) || "Awakened")}</small></p>${list(a.perms).filter(text).length ? `<p class="cc-lead">${list(a.perms).filter(text).map((p) => `<em>${esc(text(p))}</em>`).join(" · ")}</p>` : ""}</li>`).join("");
  const threads = list(b.threads).filter((t) => text(t?.person) && text(t?.text)).map((t) => {
    const st = s.threads?.[threadKey(text(t.person), { text: text(t.text) })];
    return `<li class="cc-item"><p><b>${esc(text(t.person))}</b> <em>${esc(text(t.text))}</em> <small>${t.kind === "hostile" ? "hostile" : "bond"}${st && st !== "whole" ? `, ${st}` : ""}</small></p></li>`;
  }).join("");
  const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
  const numbers = [num(s.aura) != null && `Aura ${num(s.aura)}`, num(s.resolve) != null && `Resolve ${num(s.resolve)}`, num(s.conf) != null && `Confidence d${num(s.conf)}`, num(s.wound) != null && `wound die d${num(s.wound)}`, Array.isArray(s.scars) && s.scars.length && `${s.scars.length} ${s.scars.length === 1 ? "Scar" : "Scars"}`].filter(Boolean);
  const sec = (title, body) => (body ? `<section class="cc-sec"><h2 class="cc-h3">${title}</h2><ul class="cc-list">${body}</ul></section>` : "");
  return `<div class="cc-topbar"><a class="cc-back" href="/characters/" data-act="nav">${back}Characters</a><div class="cc-tools">${tools}</div></div>
  <header class="cc-head cc-char"><div class="cc-who"><h1>${esc(ch.name)}</h1>${text(b.blurb) ? `<p class="cc-title"><em>${esc(text(b.blurb))}</em></p>` : ""}<p class="cc-small">Your own, from before the Roots change</p></div></header>
  <div class="cc-note is-gold" role="status"><p><b>${esc(ch.name)} was built before the Roots change, so here’s the sheet as it was.</b> Every roll’s a Root and a specialty now, with three tracks to keep you standing, and ${esc(ch.name)} gets rebuilt on them once the builder’s on the new rules. Nothing here’s lost in the meantime. ${link("s-roots", "Roots in the rules")}</p></div>
  ${numbers.length ? `<p class="cc-lead">Where ${esc(ch.name)} had got to: ${esc(numbers.join(", "))}.${text(s.aspText) || text(b.aspiration) ? ` Aspiration: <em>${esc(text(s.aspText) || text(b.aspiration))}</em>${num(s.asp) ? `, d${num(s.asp)}` : ""}.` : ""}</p>` : ""}
  ${sec("Set actions", acts)}${sec("Titles and permissions", perms)}${sec("Traits", traits)}
  ${carried.length ? `<section class="cc-sec"><h2 class="cc-h3">What they carried</h2><p>${carried.map(esc).join(" · ")}</p></section>` : ""}
  ${sec("Attuned", attuned)}${sec("Threads", threads)}
  ${text(s.notes) ? `<section class="cc-sec"><h2 class="cc-h3">Notes</h2><p class="cc-notes-read">${esc(text(s.notes)).replace(/\n/g, "<br>")}</p></section>` : ""}
  <div class="cc-row"><button type="button" class="button danger" data-act="delete">Delete ${esc(ch.name)} from this phone</button></div>`;
}
