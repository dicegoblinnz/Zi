// Print a character: the two-page sheet from the Sheets page, filled in on the
// phone with everything the companion knows, the sheet and where they are now,
// and handed over as a PDF to print or keep. Its fields stay fillable. pdf-lib
// only loads when someone prints, and the service worker keeps it and the
// blank sheet on the phone, so it works offline.
import { threadState } from "./threads.js";
import { nameOf, piecesOf, tickedOf } from "./armour.js";

const SHEET = "/sheets/zidara-character-sheet.pdf";
const FIXED = ["defend", "fight", "move", "sneak", "study", "talk"];
const SCARS = 5;
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"];
const PRONOUNS = { her: "she, her", him: "he, him", them: "they, them" };

const textOf = (html) => new DOMParser().parseFromString(html ?? "", "text/html").body.textContent.trim();
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function fillSheet(ch, c, s, { goal = null } = {}) {
  const [{ PDFDocument, StandardFonts }, blank] = await Promise.all([
    import("pdf-lib"),
    fetch(SHEET).then((res) => {
      if (!res.ok) throw new Error(`couldn't fetch the sheet (${res.status})`);
      return res.arrayBuffer();
    }),
  ]);
  const pdf = await PDFDocument.load(blank);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // The sheet's fields use a font every PDF viewer has, which can't draw every
  // letter, so a ā prints as a, and anything else it can't draw is left out.
  const can = new Set(font.getCharacterSet());
  const ok = (ch) => ch === "\n" || can.has(ch.codePointAt(0));
  const clean = (v) => [...String(v ?? "").normalize("NFC")].map((ch) => (ok(ch) ? ch : [...ch.normalize("NFD")].filter(ok).join(""))).join("").trim();

  // How many lines a multiline field wraps text into, the way pdf-lib does.
  const linesAt = (text, size, room) => text.split("\n").reduce((n, para) => {
    let lines = 1;
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) >= room) {
        lines += 1;
        line = word;
      } else line = next;
    }
    return n + lines;
  }, 0);

  // Text goes in at the field's own size, smaller when it would run over.
  const put = (name, value) => {
    const f = form.getFieldMaybe(name);
    const text = clean(value);
    if (!text || typeof f?.setText !== "function") return true;
    f.setText(text);
    const { width, height } = f.acroField.getWidgets()[0].getRectangle();
    const room = width - 2;
    const fits = f.isMultiline()
      ? (size) => linesAt(text, size, room) * font.heightAtSize(size) * 1.2 <= height - 2
      : (size) => font.widthOfTextAtSize(text, size) <= room;
    let size = Number(f.acroField.getDefaultAppearance()?.match(/([\d.]+) Tf/)?.[1]) || 9;
    while (size > 5 && !fits(size)) size -= 0.5;
    f.setFontSize(size);
    return fits(size);
  };
  const tick = (name) => {
    const f = form.getFieldMaybe(name);
    if (typeof f?.check === "function") f.check();
  };
  const ring = (name, value) => {
    const f = form.getFieldMaybe(name);
    if (typeof f?.select === "function" && f.getOptions().includes(value)) f.select(value);
  };

  const n = c.numbers;
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";

  // The front: who, the numbers, the wound die and Scars, set actions, traits and kit.
  put("name", ch.name);
  put("pronouns", PRONOUNS[c.pronoun]);
  put("aura_now", s.aura);
  put("aura_max", n.aura);
  for (let i = 1; i <= Math.min(7, s.resolve); i++) tick(`resolve_${i}`);
  put("resolve_max", n.resolve);
  put("stride", n.stride);
  ring("confidence", `d${s.conf}`);
  s.conditions.slice(0, 4).forEach((x, i) => {
    put(`condition_${i + 1}`, x.name);
    ring(`condition_${i + 1}_die`, `d${x.die}`);
  });

  // The wound die's ringed where it is, and each Scar's Catch goes on its
  // line, the floor it sets printed beside it. One that hasn't been written
  // yet still takes its line.
  ring("wound_die", `d${s.wound}`);
  s.scars.slice(0, SCARS).forEach((x, i) => put(`scar_${i + 1}`, x || "a Scar"));
  put("aspiration", s.aspText || c.aspiration.text);
  ring("aspiration_die", `d${s.asp}`);
  // In a campaign, the Party Goal's where the party sheet has it.
  if (goal?.text) {
    put("party_goal", goal.done ? `${goal.text} (done)` : goal.text);
    ring("party_goal_die", `d${goal.die}`);
  }

  // A Title on a set action is its number on the back, and an attuned thing's
  // permission is the thing, so each row stays short.
  const titleNo = new Map(c.titles.map((t, i) => [t.key, NUMERALS[i] ?? String(i + 1)]));
  const label = (key) => {
    const l = c.lines.find((x) => x.key === key);
    if (!l) return "";
    return l.kind === "title" ? `Title ${titleNo.get(key)}` : l.kind === "attuned" ? l.item : l.label;
  };
  // Something crossed out prints as it is on the sheet, with "(broken)" after it.
  const out = (key) => {
    const l = c.lines.find((x) => x.key === key);
    return l?.kind === "kit" && Object.keys(s.crossed).some((k) => s.crossed[k] && k.endsWith(`|${l.label}`));
  };
  let row = 0;
  for (const a of c.actions) {
    const fixed = FIXED.find((f) => f === a.name.toLowerCase());
    const at = fixed ?? (row < 6 ? String(++row) : null);
    if (!at) continue;
    if (!fixed) put(`set_${at}_name`, a.name);
    put(`set_${at}_lines`, [...new Set(a.lines.map((key) => (label(key) && out(key) ? `${label(key)} (broken)` : label(key))).filter(Boolean))].join(", "));
    put(`set_${at}_steps`, a.steps);
    put(`set_${at}_die`, a.die);
  }
  c.traits.slice(0, 3).forEach((t, i) => {
    put(`trait_${i + 1}`, t.name);
    put(`trait_${i + 1}_type`, t.type);
    put(`trait_${i + 1}_does`, textOf(t.html));
  });

  // What they carry, with anything picked up in play. Broken and used things
  // say so, and a list too long for its lines shares the last one. Armour
  // says its quality first, and each of its ticked boxes is ticked beside it.
  const kit = (where, list, note) => {
    const all = [...list, ...s.picked.filter((p) => p.where === where).map((p) => p.name)].map((x) => (s.crossed[`${where}|${x}`] ? `${nameOf(c, where, x)} (${where === "equipment" ? "broken" : "used"})` : nameOf(c, where, x)));
    return all.length || !note ? all : [note.charAt(0).toUpperCase() + note.slice(1)];
  };
  const lines = (prefix, list, rows) => list.slice(0, rows).forEach((x, i) => put(`${prefix}_${i + 1}`, i === rows - 1 ? list.slice(i).join(", ") : x));
  lines("equipment", kit("equipment", c.carry.equipment.items, c.carry.equipment.note), 3);
  const worn = [...c.carry.equipment.items, ...s.picked.filter((p) => p.where === "equipment").map((p) => p.name)];
  worn.slice(0, 3).forEach((x, i) => {
    const a = piecesOf(c).find((p) => p.name === x);
    if (!a || (i === 2 && worn.length > 3)) return;
    for (let j = 1; j <= Math.min(3, tickedOf(s, a)); j++) tick(`equipment_${i + 1}_box_${j}`);
  });
  lines("utility", kit("utility", c.carry.utility.items, c.carry.utility.note), 3);
  if (c.carry.keepsake) put("keepsake", s.crossed[`keepsake|${c.carry.keepsake}`] ? `${c.carry.keepsake} (used)` : c.carry.keepsake);
  lines("bag", kit("bag", c.carry.bag.items ?? []), 10);

  // The paper sheet has nowhere else for trouble, clothes, a fourth trait, a
  // seventh Title, a third attuned thing, a seventh bond or a fifth thread.
  // On its own line a thread says whose words they are, and its kind is ringed.
  const threadOf = (t) => (t.whose ? `${t.text} (${t.whose} words)` : t.text);
  const strain = (p, t) => ({ strained: " (strained)", snapped: " (snapped)" })[threadState(s, p.person, t)] ?? "";
  const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
  // At its smallest size it still might not fit, and then print says so.
  const roomy = put("notes", [
    c.trouble.length ? `Trouble that follows ${them}: ${c.trouble.join(", ")}.` : "",
    n.dressed ? `Confidence starts on d${n.dressed.die} in ${n.dressed.what} when they fit the scene.` : "",
    ...c.traits.slice(3).map((t) => `${t.name} (${t.type}): ${textOf(t.html)}`),
    ...c.titles.slice(6).map((t, i) => `Title ${NUMERALS[i + 6] ?? i + 7}, ${t.name}${t.archetype ? ` (${t.archetype})` : ""}: ${t.permissions.map((p) => p.text).join(", ") || "no permissions yet"}`),
    ...c.attuned.slice(0, 2).filter((a) => a.burden).map((a) => `${a.name}’s Burden: ${a.burden}`),
    ...c.attuned.slice(2).map((a) => `Attuned, ${a.props ? `${a.name} (${a.props})` : a.name}, ${a.stage || "Awakened"}${a.catch ? `, its Catch ${a.catch}` : ""}${a.burden ? `, its Burden ${a.burden}` : ""}: ${a.permissions.map((p) => p.text).join(", ")}`),
    ...c.threads.slice(0, 6).flatMap((p) => p.threads.slice(4).map((t) => `A ${kindOf(t)} thread with ${p.person}: ${threadOf(t)}${strain(p, t)}`)),
    ...c.threads.slice(6).flatMap((p) => p.threads.map((t) => `A ${kindOf(t)} thread with ${p.person}: ${threadOf(t)}${strain(p, t)}`)),
    s.notes,
  ].filter(Boolean).join("\n"));

  // The back: Titles, attuned things and bonds. A thread in someone else's
  // words says whose, the way the companion does.
  c.titles.slice(0, 6).forEach((t, i) => {
    put(`title_${i + 1}`, t.name);
    put(`title_${i + 1}_archetype`, t.archetype);
    t.permissions.slice(0, 6).forEach((p, j) => put(`title_${i + 1}_permission_${j + 1}`, p.text));
  });
  c.attuned.slice(0, 2).forEach((a, i) => {
    const at = `attune_${i + 1}`;
    put(`${at}_thing`, a.props ? `${a.name} (${a.props})` : a.name);
    ring(`${at}_stage`, (a.stage || "Awakened").toLowerCase());
    put(`${at}_catch`, a.catch);
    a.permissions.slice(0, 6).forEach((p, j) => put(`${at}_permission_${j + 1}`, p.text));
  });
  c.threads.slice(0, 6).forEach((p, i) => {
    const at = `bond_${i + 1}`;
    put(at, p.person);
    p.threads.slice(0, 4).forEach((t, j) => {
      put(`${at}_thread_${j + 1}`, threadOf(t));
      ring(`${at}_thread_${j + 1}_kind`, kindOf(t));
      const st = threadState(s, p.person, t);
      if (st !== "whole") tick(`${at}_thread_${j + 1}_strained`);
      if (st === "snapped") tick(`${at}_thread_${j + 1}_snapped`);
    });
  });

  form.updateFieldAppearances(font);
  pdf.setTitle(`${ch.name}, a Zi’Dara character`, { showInWindowTitleBar: true });
  return { bytes: await pdf.save({ updateFieldAppearances: false }), file: `${slug(ch.name) || "character"}-zidara-sheet.pdf`, short: !roomy };
}

// Fill the sheet and hand it over as a download. It says whether Notes ran short.
export async function printSheet(ch, c, s, extra = {}) {
  const { bytes, file, short } = await fillSheet(ch, c, s, extra);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: file });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { short };
}
