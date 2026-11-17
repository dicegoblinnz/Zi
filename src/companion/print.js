// Print a character: the two-page sheet from the Sheets page, filled in on the
// phone with everything the companion knows, the sheet and where they are now,
// and handed over as a PDF to print or keep. Its fields stay fillable. pdf-lib
// only loads when someone prints, and the service worker keeps it and the
// blank sheet on the phone, so it works offline. The field names are the
// sheet's own (src/companion/sheet-fields.js, which the sheet's build draws
// every one of), and a name the blank sheet hasn't got comes back in missing,
// so a renamed field never goes quietly. tests/check-companion.mjs reads a
// printed character back field by field. On the new core (16 Nov 2026) the
// front has each Root's number and dice, what's locked and what it holds,
// its points now, its wound and its Scars, with Toll and Aura, and each
// awakening rings the Root it locks. Since the fixes (17 Nov) it has six
// items, each with its kind and tier, the Root armour soaks on and a box for
// each point of soak used or charge held, the Resources said, and the
// keepsake. There are no Boons.
import { threadState } from "./threads.js";
import * as R from "./roots.js";
import { ROWS } from "./sheet-fields.js";
import { diceLabel, stepsToDice } from "./dice.js";

const SHEET = "/sheets/zidara-character-sheet.pdf";
const PRONOUNS = { her: "she, her", him: "he, him", them: "they, them" };
const TIMES = ["", "", "twice", "three times", "four times"];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const key = (r) => r.toLowerCase();

// Words off the book, which can carry a little HTML or a chapter's *italics*,
// as plain text.
const ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };
const plain = (v) => String(v ?? "").replace(/<[^>]*>/g, "").replace(/&(#\d+|[a-z]+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m)).replace(/\*\*?([^*]+?)\*\*?/g, "$1").replace(/\s+/g, " ").trim();
// A line for Notes, with one full stop at the end however its words end.
const said = (x) => (/[.!?…]$/.test(x) ? x : `${x}.`);
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// A Title's spread in words, for Notes: Body 2, Mind 1.
const spreadWords = (t) => R.ROOTS.filter((r) => t.roots?.[r]).map((r) => `${r} ${t.roots[r]}`).join(", ");
// What a Title past the sixth puts on the Roots, for Notes, since the boxes
// for where a Root's points came from stop at VI.
const spreadNote = (t) => (spreadWords(t) ? `${spreadWords(t)} on your Roots` : "nothing on your Roots yet");
const permWords = (p) => (R.ROOTS.includes(p.root) ? `${p.text} (${p.root})` : p.text);
// An archetype's Trait, the way the book writes one: its name, then what it
// does, in Appendix D's few words when the book's given them (the whole rule
// won't fit on two lines).
const traitLine = (t) => {
  const name = plain(t?.name);
  const said = plain(t?.short || t?.text);
  return name && said ? `${name}${/[.!?]$/.test(name) ? "" : "."} ${said}` : name || said;
};

// blank is the sheet's bytes, when they're to hand already (the checks pass
// them), and otherwise it's fetched, from the service worker when offline.
export async function fillSheet(ch, c, s0, { goal = null, B = null, blank = null } = {}) {
  // Where they are now, on the fixes: a state from before them is read the
  // way it'll move across (one from stacking every Root full and a track's
  // Scars on its Root, and one from the new core with its soak back).
  const s = R.normalCore(s0, c);
  const [{ PDFDocument, StandardFonts }, bytes] = await Promise.all([
    import("pdf-lib"),
    blank ?? fetch(SHEET).then((res) => {
      if (!res.ok) throw new Error(`couldn't fetch the sheet (${res.status})`);
      return res.arrayBuffer();
    }),
  ]);
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const missing = [];
  const field = (name) => {
    const f = form.getFieldMaybe(name);
    if (!f) missing.push(name);
    return f;
  };

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

  const sizeOf = (f) => Number(f.acroField.getDefaultAppearance()?.match(/([\d.]+) Tf/)?.[1]) || 9;
  const roomOf = (f) => f.acroField.getWidgets()[0].getRectangle().width - 2;
  const wide = (text, size) => font.widthOfTextAtSize(text, size);

  // Words laid along rows, the way a hand writes them on ruled lines: as many
  // as fit on a row at size, then on to the next, a new paragraph starting a
  // new row. A word too long for any row goes on one anyway. It hands back
  // the rows and whatever didn't fit.
  const lay = (text, size, rooms) => {
    const rows = rooms.map(() => "");
    const paras = text.split("\n").map((p) => p.split(/\s+/).filter(Boolean)).filter((p) => p.length);
    let r = 0;
    for (const [k, words] of paras.entries()) {
      for (const [i, word] of words.entries()) {
        while (r < rows.length && rows[r] && wide(`${rows[r]} ${word}`, size) > rooms[r]) r += 1;
        if (r >= rows.length) return { rows, left: [...words.slice(i), ...paras.slice(k + 1).flat()] };
        rows[r] = rows[r] ? `${rows[r]} ${word}` : word;
      }
      r += 1;
    }
    return { rows, left: [] };
  };
  // Text along a run of single-line fields, at their own size, smaller (down
  // to min) when that's what it takes, and whatever still won't fit ends the
  // last row in an ellipsis. It says whether it all went in.
  // A line that's cut short goes in Notes in full, so nothing's lost.
  const cut = [];
  const flow = (names, value, min = 6, start = null, keep = true) => {
    const fs = names.map(field);
    const text = clean(value);
    if (!text || fs.some((f) => typeof f?.setText !== "function")) return true;
    const rooms = fs.map(roomOf);
    let size = Math.max(min, start ?? Math.min(...fs.map(sizeOf)));
    let laid = lay(text, size, rooms);
    while (laid.left.length && size > min) {
      size = Math.max(min, size - 0.5);
      laid = lay(text, size, rooms);
    }
    if (laid.left.length) {
      const last = laid.rows.length - 1;
      let words = laid.rows[last].split(" ");
      while (words.length > 1 && wide(`${words.join(" ")}…`, size) > rooms[last]) words = words.slice(0, -1);
      let end = words.join(" ").replace(/[\s,.;:]+$/, "");
      while (end.length > 1 && wide(`${end}…`, size) > rooms[last]) end = end.slice(0, -1);
      laid.rows[last] = `${end}…`;
      if (keep) cut.push(text.replace(/\n/g, " "));
    }
    fs.forEach((f, i) => {
      if (!laid.rows[i]) return;
      f.setText(laid.rows[i]);
      f.setFontSize(size);
    });
    return !laid.left.length;
  };
  // Text goes in at the field's own size, smaller when it would run over. A
  // box that holds more than a line (a thread) wraps, and a line that still
  // won't fit at its smallest ends in an ellipsis.
  const put = (name, value) => {
    const f = field(name);
    const text = clean(value);
    if (!text || typeof f?.setText !== "function") return true;
    if (!f.isMultiline()) return flow([name], text, 5);
    f.setText(text);
    const { height } = f.acroField.getWidgets()[0].getRectangle();
    const fits = (size) => linesAt(text, size, roomOf(f)) * font.heightAtSize(size) * 1.2 <= height - 2;
    let size = sizeOf(f);
    while (size > 5 && !fits(size)) size -= 0.5;
    f.setFontSize(size);
    if (!fits(size)) cut.push(text);
    return fits(size);
  };
  // Several things down a card's rows, all at one size: each gets the rows
  // it needs, at the rows' own size or smaller (down to 5.5) till they all fit,
  // so a thing with one awakening gets its words in full. When even that's
  // too many, each gets a row and the spare ones go to whichever wraps, first
  // come first served. It hands back each one's first row.
  const share = (names, texts) => {
    const f0 = form.getFieldMaybe(names[0]);
    const room = f0 ? roomOf(f0) : 100;
    const needAt = (size) => texts.map((t) => {
      let k = 1;
      while (k < names.length && lay(clean(t), size, Array(k).fill(room)).left.length) k += 1;
      return k;
    });
    let size = f0 ? sizeOf(f0) : 8;
    let need = needAt(size);
    const total = (list) => list.reduce((a, b) => a + b, 0);
    while (total(need) > names.length && size > 5.5) {
      size -= 0.5;
      need = needAt(size);
    }
    const got = texts.map(() => 1);
    let spare = names.length - texts.length;
    for (const [i, k] of need.entries()) {
      const more = Math.max(0, Math.min(spare, k - 1));
      got[i] += more;
      spare -= more;
    }
    let at = 0;
    return texts.map((t, i) => {
      const first = at;
      flow(names.slice(at, at + got[i]), t, 5.5, size);
      at += got[i];
      return first;
    });
  };
  // A number in a box, left empty when it's nothing.
  const num = (name, n) => put(name, n ? String(n) : "");
  const tick = (name) => {
    const f = field(name);
    if (typeof f?.check === "function") f.check();
  };
  const ring = (name, value) => {
    const f = field(name);
    if (typeof f?.select !== "function" || /undefined|null|NaN/.test(String(value))) return;
    if (f.getOptions().includes(value)) f.select(value);
    else missing.push(`${name}=${value}`);
  };

  const n = c.numbers;
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";
  const notes = [];

  // The front: who, Aura, Toll and stride, each Root with its dice, where
  // its points came from, what's locked and what it holds, its points now,
  // its wound, its Scars and its armour, then conditions, the Aspiration and
  // the Party Goal, points, kit and attuned things.
  put("name", ch.name);
  put("pronouns", PRONOUNS[c.pronoun]);
  put("aura_now", s.aura);
  put("aura_max", R.auraMax(c, s));
  num("toll", s.toll);
  put("stride", n.stride);
  const locked = R.lockedOf(c, s);
  for (const r of R.ROOTS) {
    const at = `root_${key(r)}`;
    const total = c.roots[r] ?? 0;
    put(at, total);
    put(`${at}_dice`, total ? diceLabel(stepsToDice(total)) : "nothing");
    c.titles.slice(0, ROWS.titles).forEach((t, i) => num(`${at}_title_${i + 1}`, t.roots?.[r]));
    num(`${at}_permissions`, c.titles.reduce((k, t) => k + t.permissions.filter((p) => p.root === r).length, 0));
    num(`${at}_locked`, locked[r]);
    // What it holds, less the half a wound takes, said on Notes.
    put(`${at}_holds`, Math.max(0, total - locked[r]));
    put(`${at}_now`, s.pts?.[r] ?? 0);
    if (s.wound?.[r]) {
      tick(`${at}_wound`);
      notes.push(`${R.WOUNDS[r]}: your ${r} heals only to ${R.capOf(c, s, r)} till downtime.`);
    }
    // Each Scar on its line, what it stops them doing and, once it's grown,
    // its Trait, with a box ticked for each slot toward it. One that hasn't
    // been written yet still takes its line.
    const scars = (s.scars?.[r] ?? []).map((x, i) => {
      const g = R.scarGrowOf(s, r, i);
      return { text: g.trait ? `${x || "a Scar"}, its Trait: ${g.trait}` : x || "a Scar", n: g.n };
    });
    scars.slice(0, ROWS.scars).forEach((x, i) => {
      put(`${at}_scar_${i + 1}`, x.text);
      for (let j = 1; j <= Math.min(ROWS.grow, x.n); j++) tick(`${at}_scar_${i + 1}_grow_${j}`);
    });
    if (scars.length > ROWS.scars) notes.push(`More Scars on ${r}: ${scars.slice(ROWS.scars).map((x) => (x.n && x.n < R.SCAR_SLOTS ? `${x.text} (${x.n} of ${R.SCAR_SLOTS} toward its Trait)` : x.text)).join(", ")}.`);
  }
  if (s.blaze) notes.push(`A Scar on your ${s.blaze} waits to be written in.`);
  s.conditions.slice(0, ROWS.conditions).forEach((x, i) => {
    put(`condition_${i + 1}`, x.name);
    ring(`condition_${i + 1}_die`, `d${x.die}`);
  });
  for (const x of s.conditions.slice(ROWS.conditions)) notes.push(`Condition, ${x.name} (d${x.die}).`);
  put("aspiration", s.aspText || c.aspiration.text);
  for (let i = 1; i <= Math.min(ROWS.aspiration, R.aspOf(s)); i++) tick(`aspiration_${i}`);
  // In a campaign, the Party Goal's where the party sheet has it.
  if (goal?.text) {
    put("party_goal", goal.done ? `${goal.text} (done)` : goal.text);
    if (goal.die) ring("party_goal_die", `d${goal.die}`);
  }
  // Points: what they were made with, of what they started on. Banked is
  // the player's to write in.
  if (c.points) {
    put("points_spent", c.points.spent);
    put("points_start", c.points.start);
  }

  // Their items, each with its kind and tier ringed and written, the Root
  // armour soaks on, and a box ticked for each point of soak it's used or
  // charge a vessel holds. A weapon says its properties, and an attuned thing
  // or a broken one says so. Past six they go in Notes.
  const itemLine = (it) => `${it.name}${it.props?.length ? ` (${it.props.join(", ")})` : ""}${it.attuned != null ? ", attuned" : ""}${s.crossed[it.key] && it.attuned == null ? " (broken)" : ""}${it.when ? `, ${it.when}` : ""}`;
  const gear = c.items ?? [];
  gear.slice(0, ROWS.items).forEach((it, i) => {
    const at = `item_${i + 1}`;
    put(at, itemLine(it));
    ring(`${at}_kind`, it.kind);
    put(`${at}_tier`, it.tier);
    if (it.kind === "armour") ring(`${at}_root`, key(it.root ?? "Body"));
    const marked = it.kind === "armour" ? R.soakLeft(s, it) < it.tier ? it.tier - R.soakLeft(s, it) : 0 : it.kind === "vessel" ? R.chargeOf(c, s, it.key) : 0;
    for (let j = 1; j <= Math.min(ROWS.itemBoxes, marked); j++) tick(`${at}_box_${j}`);
  });
  for (const it of gear.slice(ROWS.items)) notes.push(said(`Item, ${itemLine(it)} (${it.kind}, tier ${it.tier}${it.kind === "armour" ? `, on your ${it.root ?? "Body"}` : ""})`));
  // Resources: how many they've got, and each one said since downtime,
  // ticked, the ones past the lines in Notes.
  put("resources", R.resOf(c));
  const res = Array.isArray(s.res) ? s.res : [];
  res.slice(0, ROWS.resources).forEach((x, i) => {
    put(`resource_${i + 1}`, x);
    tick(`resource_${i + 1}_used`);
  });
  if (res.length > ROWS.resources) notes.push(said(`Resources said: ${res.slice(ROWS.resources).join(", ")}`));
  if (c.keepsake) put("keepsake", c.keepsake);

  // Each attuned thing, with its awakenings and the Root each one locks,
  // ringed beside it.
  const thingName = (a) => plain(a.props ? `${a.name} (${a.props})` : a.name);
  const wakeLine = (w) => `${plain(w.name)}: ${plain(w.text)}`;
  const wakeNote = (w) => `${plain(w.name)} (${w.root || "no Root yet"})`;
  c.attuned.slice(0, ROWS.attuned).forEach((a, i) => {
    const at = `attune_${i + 1}`;
    put(`${at}_thing`, thingName(a));
    ring(`${at}_stage`, (a.stage || "Awakened").toLowerCase());
    put(`${at}_catch`, plain(a.catch));
    put(`${at}_burden`, plain(a.burden));
    const shown = a.awakenings.slice(0, ROWS.awakenings);
    const rows = Array.from({ length: ROWS.awakenings }, (_, j) => `${at}_awakening_${j + 1}`);
    share(rows, shown.map(wakeLine)).forEach((r, j) => {
      if (R.ROOTS.includes(shown[j].root)) ring(`${rows[r]}_root`, key(shown[j].root));
    });
    a.awakenings.slice(ROWS.awakenings).forEach((w) => notes.push(said(`${thingName(a)}, ${wakeNote(w)}: ${plain(w.text)}`)));
  });
  c.attuned.slice(ROWS.attuned).forEach((a) => {
    notes.push(`Attuned, ${thingName(a)}, ${a.stage}${a.catch ? `, its Catch ${plain(a.catch)}` : ""}${a.burden ? `, its Burden ${plain(a.burden)}` : ""}: ${a.awakenings.map((w) => `${wakeNote(w)}, ${plain(w.text).replace(/[.]$/, "")}`).join(" · ") || "no awakenings yet"}.`);
  });

  // The back: Titles with their spread and each permission's Root, the
  // archetypes with their Trait and abilities, and bonds.
  c.titles.slice(0, ROWS.titles).forEach((t, i) => {
    const at = `title_${i + 1}`;
    flow([at, `${at}_more`], t.text ?? t.name);
    for (const r of R.ROOTS) num(`${at}_${key(r)}`, t.roots?.[r]);
    t.permissions.slice(0, ROWS.perms).forEach((p, j) => {
      put(`${at}_permission_${j + 1}`, p.text);
      if (R.ROOTS.includes(p.root)) ring(`${at}_permission_${j + 1}_root`, key(p.root));
    });
    const over = t.permissions.slice(ROWS.perms);
    if (over.length) notes.push(said(`On Title ${NUMERALS[i]}: ${over.map(permWords).join(", ")}`));
  });
  c.titles.slice(ROWS.titles).forEach((t, k) => notes.push(said(`Title ${NUMERALS[ROWS.titles + k] ?? ROWS.titles + k + 1}, ${t.text ?? t.name} (${spreadNote(t)}): ${t.permissions.map(permWords).join(", ") || "no permissions yet"}`)));
  // Every ability says what it costs in Aura.
  const ability = (a, x) => `${x.name} (${Math.max(1, Number(x.cost) || 1)} Aura): ${plain(x.text ?? x.html)}`;
  const archs = R.archetypesOf(c, B);
  archs.slice(0, ROWS.archetypes).forEach((a, i) => {
    const at = `archetype_${i + 1}`;
    put(at, a.times > 1 ? `${a.name}, ${TIMES[a.times] ?? `${a.times} times`}` : a.name);
    flow([`${at}_mechanic`, `${at}_mechanic_more`], plain(a.for || a.summary));
    flow([`${at}_trait`, `${at}_trait_more`], traitLine(a.trait));
    share(Array.from({ length: ROWS.abilities }, (_, j) => `${at}_ability_${j + 1}`), a.abilities.slice(0, ROWS.abilities).map((x) => ability(a, x)));
    for (const x of a.abilities.slice(ROWS.abilities)) notes.push(said(`${a.name}’s ${ability(a, x)}`));
  });
  for (const a of archs.slice(ROWS.archetypes)) {
    const trait = traitLine(a.trait);
    notes.push(`Archetype, ${a.times > 1 ? `${a.name}, ${TIMES[a.times] ?? `${a.times} times`}` : a.name}${trait ? `, its Trait ${trait.replace(/\.$/, "")}` : ""}: ${a.abilities.map((x) => x.name).join(", ") || "no abilities yet"}.`);
  }

  // A thread in someone else's words says whose, the way the companion does,
  // and its kind's ringed.
  const threadOf = (t) => (t.whose ? `${t.text} (${t.whose} words)` : t.text);
  const strain = (p, t) => ({ strained: ", strained", snapped: ", snapped" })[threadState(s, p.person, t)] ?? "";
  const kindOf = (t) => (t.kind === "hostile" ? "hostile" : "bond");
  const threadNote = (p, t) => said(`A ${kindOf(t)} thread with ${p.person}${t.whose ? `, in ${t.whose} words` : ""}${strain(p, t)}: ${t.text}`);
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
    for (const t of p.threads.slice(ROWS.threads)) notes.push(threadNote(p, t));
  });
  for (const p of c.threads.slice(ROWS.bonds)) for (const t of p.threads) notes.push(threadNote(p, t));

  // The paper sheet has nowhere else for trouble, a Shadow's pool, the
  // player's own notes or whatever didn't fit, in that order, so their own
  // words come before anything the sheet's run out of room for. At its
  // smallest size Notes still might not fit, and then print says so.
  const pool = Array.isArray(s.pool) && s.pool.length ? `Shadow’s pool: ${s.pool.map((d) => `d${d}`).join(", ")}.` : "";
  const items = [c.trouble.length ? `Trouble that follows ${them}: ${c.trouble.join(", ")}.` : "", pool, s.notes, ...notes, ...cut.map((x) => said(`In full: ${x}`))].map(clean).filter(Boolean);
  const rows = Array.from({ length: ROWS.notes }, (_, j) => `notes_${j + 1}`);
  const f0 = form.getFieldMaybe(rows[0]);
  const apiece = f0 && !lay(items.join("\n"), sizeOf(f0), rows.map(() => roomOf(f0))).left.length;
  const roomy = flow(rows, items.join(apiece ? "\n" : " "), 6, null, false);

  form.updateFieldAppearances(font);
  pdf.setTitle(`${ch.name}, a Zi’Dara character`, { showInWindowTitleBar: true });
  return { bytes: await pdf.save({ updateFieldAppearances: false }), file: `${slug(ch.name) || "character"}-zidara-sheet.pdf`, short: !roomy, missing };
}

// Fill the sheet and hand it over as a download. It says whether Notes ran
// short. A field the sheet hasn't got is a mistake in this file or the
// sheet's, so it's said on the console for whoever's looking.
export async function printSheet(ch, c, s, extra = {}) {
  const { bytes, file, short, missing } = await fillSheet(ch, c, s, extra);
  if (missing.length) console.warn(`print: the sheet hasn't got ${missing.join(", ")}`);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: file });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { short };
}
