// How it came to be (stage 8 of notes/builder-plan.md), on the World screen
// and the World tab: the history a world built by answering came with, a
// line for each answer, by age. It's hers to show the crew an age at a time
// (Mo's pick, 30 Oct), and a line whose answer made a Secret never leaves her
// phone, whatever's shown. Before she shows them, she can change a line or
// take it out. A player's phone only ever gets the lines of the ages she's
// shown (buildForPlayer() in world-record.js), and a name in a line links to
// whatever of the world it's been shown.
import { AGE_ORDER } from "./world-record.js";
import { AGE_NAMES } from "./world-answer.js";

const AGE_SAY = { 1: "long ago", 2: "in living memory", 3: "this last year", 0: "and the rest" };
const MAX_LINE = 400;

export function makeStory(w) {
  const { d, esc, edit, docOf, isGm, gmName, plural, fold, richFor, ui, setEditing, lit } = w;
  const edKey = (l) => `hist:${l.id}`;

  function section(id) {
    const gm = isGm(id);
    const doc = docOf(id);
    const lines = doc.build?.history ?? [];
    if (!lines.length) return "";
    const rich = richFor(id, doc);
    const ages = AGE_ORDER.filter((a) => lines.some((l) => l.age === a));
    const glow = lit(id).includes("history") ? " is-new" : "";
    if (!gm) {
      return `<section class="cc-sec ws-sec${glow}" data-wb="${esc(id)}" aria-labelledby="ws-h"><h2 id="ws-h">How it came to be</h2>
        ${ages.map((a) => `<div class="ws-age"><h3>${AGE_NAMES[a]}</h3><ol class="ws-lines">${lines.filter((l) => l.age === a).map((l) => `<li class="ws-line"><p class="ws-text">${rich(l.text)}</p></li>`).join("")}</ol></div>`).join("")}</section>`;
    }
    const shown = new Set(doc.build.shown ?? []);
    const parts = ages.map((a) => {
      const these = lines.filter((l) => l.age === a);
      const on = shown.has(a);
      const hers = these.filter((l) => l.hers).length;
      const seen = these.length - hers;
      const glance = `${plural(these.length, "line", "lines")}, ${on ? (hers ? `${seen} of them shown to the crew` : "shown to the crew") : "hidden from the crew"}`;
      const say = on ? `The crew can read ${a ? `what happened ${AGE_SAY[a]}` : "these"}${hers ? `, bar ${hers === 1 ? "the line that’s" : "the lines that are"} yours` : ""}.` : "Only you see these.";
      const show = seen
        ? `<div class="wb-show ws-show${on ? " is-on" : ""}"><p class="cc-small">${say}</p><button type="button" class="button sm${on ? "" : " primary"}" data-act="w" data-do="hist-show" data-age="${a}" aria-pressed="${on}">${on ? "Hide it again" : "Show the crew"}</button></div>`
        : `<p class="cc-small">Every line here made a Secret, so it stays on your phone.</p>`;
      const badge = `<span class="wb-badge${on && seen ? " is-on" : ""}">${on && seen ? "Shown" : "Hidden"}</span>`;
      return fold(`hist-${a}`, AGE_NAMES[a], glance, `${show}<ol class="ws-lines">${these.map((l) => lineView(l, rich)).join("")}</ol>`, badge);
    });
    const hersAll = lines.filter((l) => l.hers).length;
    return `<section class="cc-sec ws-sec${glow}" data-wb="${esc(id)}" aria-labelledby="ws-h"><h2 id="ws-h">How it came to be</h2>
      <p class="cc-small wb-sum">${plural(lines.length, "line", "lines")} from the deck. You show the crew an age at a time${hersAll ? `, and ${hersAll === 1 ? "the line that made a Secret stays" : `the ${hersAll} lines that made Secrets stay`} on your phone` : ""}.</p>
      <div class="cc-folds">${parts.join("")}</div></section>`;
  }

  // A line of hers, and changing it: its words, or taking it out.
  function lineView(l, rich) {
    if (ui().editing === edKey(l)) {
      return `<li class="ws-line wb-editing"><form class="cc-form pt-form ws-form" data-form="w-hist" data-lid="${esc(l.id)}"><label class="cc-field">The line <textarea name="text" maxlength="${MAX_LINE}" rows="3">${esc(l.text)}</textarea></label>
        <div class="cc-row"><button type="submit" class="button primary">Save it</button><button type="button" class="button" data-act="w" data-do="hist-edit" data-lid="">Cancel</button><button type="button" class="button danger" data-act="w" data-do="hist-drop" data-lid="${esc(l.id)}">Take it out</button></div></form></li>`;
    }
    return `<li class="ws-line${l.hers ? " is-hers" : ""}"><div class="ws-line-in"><p class="ws-text">${rich(l.text)}</p>${l.hers ? '<p class="ws-hers">It made a Secret, so it stays on your phone.</p>' : ""}</div>
      <button type="button" class="pt-reword ws-change" data-act="w" data-do="hist-edit" data-lid="${esc(l.id)}" aria-label="Change the line: ${esc(l.text)}">Change</button></li>`;
  }

  // What's new for a player: an age she's just shown them.
  function news(id, was, now) {
    const had = new Set((was.build?.history ?? []).map((l) => l.id));
    const fresh = (now.build?.history ?? []).filter((l) => !had.has(l.id));
    if (!fresh.length) return { said: [], keys: [] };
    const ages = AGE_ORDER.filter((a) => fresh.some((l) => l.age === a)).map((a) => AGE_SAY[a]);
    return { said: [`${gmName(id)} showed you how it came to be${ages.length === 1 && ages[0] !== AGE_SAY[0] ? `, ${ages[0]}` : ""}.`], keys: ["history"] };
  }

  const ACT = {
    "hist-show": (el, id) => {
      const doc = docOf(id);
      const age = Number(el.dataset.age);
      if (!isGm(id) || !doc.build || !AGE_ORDER.includes(age)) return;
      const on = (doc.build.shown ?? []).includes(age);
      edit(id, [{ o: "wb-show", age, v: !on }], on ? `${AGE_NAMES[age]}’s hidden from the crew again.` : `The crew can read what happened ${AGE_SAY[age]} now.`);
    },
    "hist-edit": (el, id) => {
      const lid = el.dataset.lid;
      setEditing(lid ? `hist:${lid}` : "");
      d.render();
      if (lid) document.querySelector(".ws-form textarea")?.focus();
    },
    "hist-drop": (el, id) => {
      const lid = el.dataset.lid;
      if (!isGm(id) || !lid) return;
      setEditing("");
      edit(id, [{ o: "wb-drop", lid }], "Taken out of How it came to be.");
    },
  };
  function submit(kind, form, f, id) {
    const lid = form.dataset.lid;
    const text = String(f.get("text") ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LINE);
    if (kind !== "w-hist" || !lid || !isGm(id)) return;
    if (!text) return form.querySelector("textarea")?.focus();
    setEditing("");
    if (!edit(id, [{ o: "wb-edit", lid, v: text }], "Changed.")) d.render();
  }

  return { section, news, ACT, submit };
}
