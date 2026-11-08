// Print a character: the two-page sheet from the Sheets page, filled in on the
// phone with everything the companion knows, the sheet and where they are now,
// and handed over as a PDF to print or keep. Its fields stay fillable. pdf-lib
// only loads when someone prints, and the service worker keeps it and the
// blank sheet on the phone, so it works offline. The field names are the
// sheet's own (scripts/sheets/character-sheet.mjs), so rename one there and
// it's renamed here too.
import { threadState } from "./threads.js";
import { nameOf, piecesOf, tickedOf, withQuality } from "./armour.js";
import * as R from "./roots.js";

const SHEET = "/sheets/zidara-character-sheet.pdf";
// What the paper has room for: anything past it goes in Notes.
const ROWS = { specs: 12, scars: 5, titles: 6, perms: 6, archetypes: 3, abilities: 6, awakenings: 6, armour: 2, conditions: 4, bonds: 4, threads: 3, equipment: 3, utility: 3, bag: 10 };
const PRONOUNS = { her: "she, her", him: "he, him", them: "they, them" };
const TIMES = ["", "", "twice", "three times", "four times"];
const TN = (t) => R.TRACK[t].name;

const textOf = (html) => new DOMParser().parseFromString(html ?? "", "text/html").body.textContent.trim();
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function fillSheet(ch, c, s, { goal = null, B = null } = {}) {
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
  const ok = (ch2) => ch2 === "\n" || can.has(ch2.codePointAt(0));
  const clean = (v) => [...String(v ?? "").normalize("NFC")].map((ch2) => (ok(ch2) ? ch2 : [...ch2.normalize("NFD")].filter(ok).join(""))).join("").trim();

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
  const notes = [];

  // The front: who, Aura, actions and stride, the three tracks with their
  // Scars and armour, Roots and specialties, conditions, Scars, the
  // Aspiration and the Party Goal, kit and notes.
  put("name", ch.name);
  put("pronouns", PRONOUNS[c.pronoun]);
  put("aura_now", s.aura);
  put("aura_max", n.aura);
  put("actions", R.actionsMax(c));
  put("stride", n.stride);
  for (const t of R.TRACKS) {
    ring(t, `d${s.tracks[t]}`);
    // A Scar locks a track's smallest size, from d2 up.
    for (let k = 0; k < s.scars[t].length && k < R.MAX_SCARS; k++) tick(`${t}_scar_${2 + 2 * k}`);
    const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === R.TRACK[t].root);
    pieces.slice(0, ROWS.armour).forEach((a, i) => {
      const broken = Boolean(s.crossed[`equipment|${a.name}`]);
      put(`${t}_armour_${i + 1}`, `${withQuality(a.name, a.quality)}${a.when ? `, ${a.when}` : ""}${broken ? " (broken)" : ""}`);
      for (let j = 1; j <= Math.min(3, tickedOf(s, a)); j++) tick(`${t}_armour_${i + 1}_box_${j}`);
    });
    for (const a of pieces.slice(ROWS.armour)) notes.push(`Armour on ${R.TRACK[t].root}: ${withQuality(a.name, a.quality)}, ${tickedOf(s, a)} of ${a.boxes} ${a.boxes === 1 ? "box" : "boxes"} ticked.`);
  }
  put("root_body", c.roots.Body);
  put("root_mind", c.roots.Mind);
  put("root_soul", c.roots.Soul);
  c.specialties.slice(0, ROWS.specs).forEach((sp, i) => {
    put(`spec_${i + 1}_name`, sp.name);
    put(`spec_${i + 1}_steps`, sp.steps);
  });
  if (c.specialties.length > ROWS.specs) notes.push(`More specialties: ${c.specialties.slice(ROWS.specs).map((sp) => `${sp.name} ${sp.steps}`).join(", ")}.`);
  s.conditions.slice(0, ROWS.conditions).forEach((x, i) => {
    put(`condition_${i + 1}`, x.name);
    ring(`condition_${i + 1}_die`, `d${x.die}`);
  });
  // Each Scar's Catch goes on its line with the track it's on. One that
  // hasn't been written yet still takes its line.
  const scars = R.TRACKS.flatMap((t) => s.scars[t].map((x) => `${x || "a Scar"} (${TN(t)})`));
  scars.slice(0, ROWS.scars).forEach((x, i) => put(`scar_${i + 1}`, x));
  if (scars.length > ROWS.scars) notes.push(`More Scars: ${scars.slice(ROWS.scars).join(", ")}.`);
  put("aspiration", s.aspText || c.aspiration.text);
  ring("aspiration_die", `d${s.asp}`);
  // In a campaign, the Party Goal's where the party sheet has it.
  if (goal?.text) {
    put("party_goal", goal.done ? `${goal.text} (done)` : goal.text);
    ring("party_goal_die", `d${goal.die}`);
  }

  // What they carry, with anything picked up in play. Broken and used things
  // say so, and a list too long for its lines shares the last one. Armour
  // says its quality first.
  const kit = (where, list) => [...list, ...s.picked.filter((p) => p.where === where).map((p) => p.name)].map((x) => (s.crossed[`${where}|${x}`] ? `${nameOf(c, where, x)} (${where === "equipment" ? "broken" : "used"})` : nameOf(c, where, x)));
  const lines = (prefix, list, rows) => list.slice(0, rows).forEach((x, i) => put(`${prefix}_${i + 1}`, i === rows - 1 ? list.slice(i).join(", ") : x));
  lines("equipment", kit("equipment", c.carry.equipment), ROWS.equipment);
  lines("utility", kit("utility", c.carry.utility), ROWS.utility);
  if (c.carry.keepsake) put("keepsake", s.crossed[`keepsake|${c.carry.keepsake}`] ? `${c.carry.keepsake} (used)` : c.carry.keepsake);
  lines("bag", kit("bag", c.carry.bag?.items ?? []), ROWS.bag);

  // The back: Titles, archetypes, the attuned thing and bonds.
  c.titles.slice(0, ROWS.titles).forEach((t, i) => {
    put(`title_${i + 1}`, t.name);
    put(`title_${i + 1}_root`, t.root);
    put(`title_${i + 1}_specialties`, (t.specialties ?? []).join(", "));
    t.permissions.slice(0, ROWS.perms).forEach((p, j) => put(`title_${i + 1}_permission_${j + 1}`, `${p.text} (${p.root}, ${p.specialty})`));
  });
  for (const t of c.titles.slice(ROWS.titles)) notes.push(`Title, ${t.name} (${t.root}; ${(t.specialties ?? []).join(", ")}): ${t.permissions.map((p) => `${p.text} (${p.root}, ${p.specialty})`).join(", ") || "no permissions yet"}.`);
  const archs = R.archetypesOf(c, B);
  archs.slice(0, ROWS.archetypes).forEach((a, i) => {
    put(`archetype_${i + 1}`, a.times > 1 ? `${a.name}, ${TIMES[a.times] ?? `${a.times} times`}` : a.name);
    ring(`archetype_${i + 1}_track`, a.home);
    put(`archetype_${i + 1}_mechanic`, a.for || a.summary);
    a.abilities.slice(0, ROWS.abilities).forEach((x, j) => put(`archetype_${i + 1}_ability_${j + 1}`, `${x.name} (1 ${TN(a.home)}): ${textOf(x.html)}`));
  });
  for (const a of archs.slice(ROWS.archetypes)) notes.push(`Archetype, ${a.name} (home ${TN(a.home)}): ${a.abilities.map((x) => x.name).join(", ")}.`);
  const thing = c.attuned[0];
  if (thing) {
    put("attune_1_thing", thing.props ? `${thing.name} (${thing.props})` : thing.name);
    ring("attune_1_stage", (thing.stage || "Awakened").toLowerCase());
    put("attune_1_aura", thing.aura);
    put("attune_1_catch", thing.catch);
    put("attune_1_burden", thing.burden);
    // What a passive awakening's holding is ticked beside it, shared across
    // the same awakening taken twice.
    const held = {};
    thing.awakenings.slice(0, ROWS.awakenings).forEach((w, j) => {
      put(`attune_1_awakening_${j + 1}`, `${w.name}: ${w.text}`);
      ring(`attune_1_awakening_${j + 1}_kind`, w.kind === "active" ? "active" : "passive");
      if (w.kind !== "active") {
        const key = `0|${w.name}`;
        const left = (s.store[key] ?? 0) - (held[key] ?? 0);
        const here = Math.max(0, Math.min(R.HOLDS, left));
        for (let k = 1; k <= here; k++) tick(`attune_1_awakening_${j + 1}_aura_${k}`);
        held[key] = (held[key] ?? 0) + here;
      }
    });
    for (const w of thing.awakenings.slice(ROWS.awakenings)) notes.push(`${thing.name}, ${w.name} (${w.kind}): ${w.text}.`);
  }
  for (const a of c.attuned.slice(1)) notes.push(`Attuned, ${a.props ? `${a.name} (${a.props})` : a.name}, ${a.stage}${a.aura ? `, its Aura ${a.aura}` : ""}${a.catch ? `, its Catch ${a.catch}` : ""}${a.burden ? `, its Burden ${a.burden}` : ""}: ${a.awakenings.map((w) => `${w.name} (${w.kind}), ${w.text}`).join("; ") || "no awakenings yet"}.`);

  // A thread in someone else's words says whose, the way the companion does,
  // and its kind's ringed.
  const threadOf = (t) => (t.whose ? `${t.text} (${t.whose} words)` : t.text);
  const strain = (p, t) => ({ strained: " (strained)", snapped: " (snapped)" })[threadState(s, p.person, t)] ?? "";
  const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
  c.threads.slice(0, ROWS.bonds).forEach((p, i) => {
    const at = `bond_${i + 1}`;
    put(at, p.person);
    p.threads.slice(0, ROWS.threads).forEach((t, j) => {
      put(`${at}_thread_${j + 1}`, threadOf(t));
      ring(`${at}_thread_${j + 1}_kind`, kindOf(t));
      const st = threadState(s, p.person, t);
      if (st !== "whole") tick(`${at}_thread_${j + 1}_strained`);
      if (st === "snapped") tick(`${at}_thread_${j + 1}_snapped`);
    });
    for (const t of p.threads.slice(ROWS.threads)) notes.push(`A ${kindOf(t)} thread with ${p.person}: ${threadOf(t)}${strain(p, t)}.`);
  });
  for (const p of c.threads.slice(ROWS.bonds)) for (const t of p.threads) notes.push(`A ${kindOf(t)} thread with ${p.person}: ${threadOf(t)}${strain(p, t)}.`);

  // The paper sheet has nowhere else for trouble or whatever didn't fit, and
  // at its smallest size Notes still might not fit, and then print says so.
  const roomy = put("notes", [c.trouble.length ? `Trouble that follows ${them}: ${c.trouble.join(", ")}.` : "", ...notes, s.notes].filter(Boolean).join("\n"));

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
