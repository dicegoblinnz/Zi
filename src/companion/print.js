// Print a character: the two-page sheet from the Sheets page, filled in on the
// phone with everything the companion knows, the sheet and where they are now,
// and handed over as a PDF to print or keep. Its fields stay fillable. pdf-lib
// only loads when someone prints, and the service worker keeps it and the
// blank sheet on the phone, so it works offline. The field names are the
// sheet's own (src/companion/sheet-fields.js, which the sheet's build draws
// every one of), and a name the blank sheet hasn't got comes back in missing,
// so a renamed field never goes quietly. tests/check-companion.mjs reads a
// printed character back field by field.
import { threadState } from "./threads.js";
import { nameOf, piecesOf, tickedOf, withQuality } from "./armour.js";
import * as R from "./roots.js";
import { ROWS } from "./sheet-fields.js";

const SHEET = "/sheets/zidara-character-sheet.pdf";
// A Boon as it's written on the paper.
const boonLine = (b) => `Boon, ${b.name ? `${b.name} (${b.lever})` : b.lever}${b.on ? `, ${b.on}` : ""}: ${b.text}`;
const PRONOUNS = { her: "she, her", him: "he, him", them: "they, them" };
const TIMES = ["", "", "twice", "three times", "four times"];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const TN = (t) => R.TRACK[t]?.name ?? t;
const key = (r) => r.toLowerCase();

// Words off the book, which can carry a little HTML, as plain text.
const ENT = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };
const plain = (v) => String(v ?? "").replace(/<[^>]*>/g, "").replace(/&(#\d+|[a-z]+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m)).replace(/\s+/g, " ").trim();
// A line for Notes, with one full stop at the end however its words end.
const said = (x) => (/[.!?…]$/.test(x) ? x : `${x}.`);
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// A Title's spread in words, for Notes: Body 2, Mind 1.
const spreadWords = (t) => R.ROOTS.filter((r) => t.roots?.[r]).map((r) => `${r} ${t.roots[r]}`).join(", ");
const permWords = (p) => (R.ROOTS.includes(p.root) ? `${p.text} (${p.root})` : p.text);
// An archetype's Trait, the way the book writes one: its name, then what it does.
const traitLine = (t) => {
  const name = plain(t?.name);
  const said = plain(t?.text);
  return name && said ? `${name}${/[.!?]$/.test(name) ? "" : "."} ${said}` : name || said;
};

// blank is the sheet's bytes, when they're to hand already (the checks pass
// them), and otherwise it's fetched, from the service worker when offline.
export async function fillSheet(ch, c, s, { goal = null, B = null, blank = null } = {}) {
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
  const flow = (names, value, min = 6, start = null) => {
    const fs = names.map(field);
    const text = clean(value);
    if (!text || fs.some((f) => typeof f?.setText !== "function")) return true;
    const rooms = fs.map(roomOf);
    let size = start ?? Math.min(...fs.map(sizeOf));
    let laid = lay(text, size, rooms);
    while (laid.left.length && size > min) {
      size -= 0.5;
      laid = lay(text, size, rooms);
    }
    if (laid.left.length) {
      const last = laid.rows.length - 1;
      let words = laid.rows[last].split(" ");
      while (words.length > 1 && wide(`${words.join(" ")}…`, size) > rooms[last]) words = words.slice(0, -1);
      laid.rows[last] = `${words.join(" ").replace(/[\s,.;:]+$/, "")}…`;
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
    return fits(size);
  };
  // Several things down a card's rows, all at one size: each gets the rows
  // it needs, at the rows' own size or smaller (down to 6) till they all fit,
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
    while (total(need) > names.length && size > 6) {
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
    if (typeof f?.select !== "function") return;
    if (f.getOptions().includes(value)) f.select(value);
    else missing.push(`${name}=${value}`);
  };

  const n = c.numbers;
  const them = c.pronoun === "him" ? "him" : c.pronoun === "her" ? "her" : "them";
  const notes = [];

  // The front: who, Aura, what's powering awakenings off its maximum, and
  // stride, each Root with where its points came from and its track, Scars
  // and armour, conditions, Scars, the Aspiration and the Party Goal,
  // points, kit and attuned things.
  put("name", ch.name);
  put("pronouns", PRONOUNS[c.pronoun]);
  put("aura_now", s.aura);
  put("aura_max", n.aura);
  num("aura_powering", R.poweredOf(s));
  put("stride", n.stride);
  for (const r of R.ROOTS) {
    put(`root_${key(r)}`, c.roots[r] ?? 0);
    c.titles.slice(0, ROWS.titles).forEach((t, i) => num(`root_${key(r)}_title_${i + 1}`, t.roots?.[r]));
    num(`root_${key(r)}_permissions`, c.titles.reduce((k, t) => k + t.permissions.filter((p) => p.root === r).length, 0));
  }
  for (const t of R.TRACKS) {
    ring(t, `d${s.tracks[t]}`);
    // A Scar locks a track's smallest size, from d2 up.
    for (let k = 0; k < s.scars[t].length && k < R.MAX_SCARS; k++) tick(`${t}_scar_${2 + 2 * k}`);
    // Each piece of armour on this Root, its boxes ticked on its first line,
    // and a piece that's said when it counts gets the next line too if it's free.
    const pieces = piecesOf(c).filter((a) => (a.root ?? "Body") === R.TRACK[t].root);
    const shown = pieces.slice(0, ROWS.armour);
    const rows = Array.from({ length: ROWS.armour }, (_, i) => `${t}_armour_${i + 1}`);
    share(rows, shown.map((a) => `${withQuality(a.name, a.quality)}${a.when ? `, ${a.when}` : ""}${s.crossed[`equipment|${a.name}`] ? " (broken)" : ""}`)).forEach((r, i) => {
      for (let j = 1; j <= Math.min(ROWS.boxes, tickedOf(s, shown[i])); j++) tick(`${rows[r]}_box_${j}`);
    });
    for (const a of pieces.slice(ROWS.armour)) notes.push(`Armour on ${R.TRACK[t].root}: ${withQuality(a.name, a.quality)}, ${tickedOf(s, a)} of ${a.boxes} ${a.boxes === 1 ? "box" : "boxes"} ticked.`);
  }
  s.conditions.slice(0, ROWS.conditions).forEach((x, i) => {
    put(`condition_${i + 1}`, x.name);
    ring(`condition_${i + 1}_die`, `d${x.die}`);
  });
  for (const x of s.conditions.slice(ROWS.conditions)) notes.push(`Condition, ${x.name} (d${x.die}).`);
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
  // Points: what they were made with, of what they started on. Banked is
  // the player's to write in.
  if (c.points) {
    put("points_spent", c.points.spent);
    put("points_start", c.points.start);
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

  // Each attuned thing, with its awakenings and what's powering each passive
  // one, ticked beside it and shared across the same awakening taken twice.
  const power = s.power ?? {};
  const powering = (i, list) => {
    const held = {};
    return list.map((w) => {
      if (w.kind === "active") return 0;
      const k = `${i}|${w.name}`;
      const here = Math.max(0, Math.min(R.HOLDS, (power[k] ?? 0) - (held[k] ?? 0)));
      held[k] = (held[k] ?? 0) + here;
      return here;
    });
  };
  const thingName = (a) => (a.props ? `${a.name} (${a.props})` : a.name);
  c.attuned.slice(0, ROWS.attuned).forEach((a, i) => {
    const at = `attune_${i + 1}`;
    put(`${at}_thing`, thingName(a));
    ring(`${at}_stage`, (a.stage || "Awakened").toLowerCase());
    put(`${at}_catch`, a.catch);
    put(`${at}_burden`, a.burden);
    const held = powering(i, a.awakenings);
    const shown = a.awakenings.slice(0, ROWS.awakenings);
    const rows = Array.from({ length: ROWS.awakenings }, (_, j) => `${at}_awakening_${j + 1}`);
    share(rows, shown.map((w) => `${w.name}: ${w.text}`)).forEach((r, j) => {
      const w = shown[j];
      ring(`${rows[r]}_kind`, w.kind === "active" ? "active" : "passive");
      for (let k = 1; k <= Math.min(ROWS.powering, held[j]); k++) tick(`${rows[r]}_aura_${k}`);
    });
    a.awakenings.slice(ROWS.awakenings).forEach((w, j) => notes.push(said(`${a.name}, ${w.name} (${w.kind}${held[ROWS.awakenings + j] ? `, ${held[ROWS.awakenings + j]} Aura powering it` : ""}): ${w.text}`)));
  });
  c.attuned.slice(ROWS.attuned).forEach((a, k) => {
    const i = ROWS.attuned + k;
    const held = powering(i, a.awakenings);
    notes.push(`Attuned, ${thingName(a)}, ${a.stage}${a.catch ? `, its Catch ${a.catch}` : ""}${a.burden ? `, its Burden ${a.burden}` : ""}: ${a.awakenings.map((w, j) => `${w.name} (${w.kind}${held[j] ? `, ${held[j]} Aura powering it` : ""}), ${w.text.replace(/[.]$/, "")}`).join(" · ") || "no awakenings yet"}.`);
  });

  // The back: Titles with their spread and each permission's Root, the
  // archetypes with their Trait and abilities, and bonds.
  c.titles.slice(0, ROWS.titles).forEach((t, i) => {
    const at = `title_${i + 1}`;
    flow([at, `${at}_more`], t.text ?? t.name);
    for (const r of R.ROOTS) num(`${at}_${key(r)}`, t.roots?.[r]);
    // A Boon takes two of the six rows, its words carrying on from the first
    // to the second, and it rings no Root.
    const rows = [...t.permissions.map((p) => ({ text: p.text, root: p.root })), ...(t.boons ?? []).map((b) => ({ text: boonLine(b), boon: true }))];
    let j = 0;
    const over = [];
    for (const x of rows) {
      const room = x.boon ? 2 : 1;
      if (j + room > ROWS.perms) {
        over.push(x);
        continue;
      }
      const row = (k) => `${at}_permission_${j + k + 1}`;
      if (x.boon) {
        flow([row(0), row(1)], x.text, 5.5);
        if (!form.getFieldMaybe(row(1))?.getText()) put(row(1), "(the Boon above takes this line too)");
      } else {
        put(row(0), x.text);
        if (R.ROOTS.includes(x.root)) ring(`${row(0)}_root`, key(x.root));
      }
      j += room;
    }
    if (over.length) notes.push(said(`On Title ${NUMERALS[i]}: ${over.map((x) => (x.root ? `${x.text} (${x.root})` : x.text)).join(", ")}`));
  });
  c.titles.slice(ROWS.titles).forEach((t, k) => notes.push(`Title ${NUMERALS[ROWS.titles + k] ?? ROWS.titles + k + 1}, ${t.text ?? t.name} (${spreadWords(t) || "nothing spread yet"}): ${[...t.permissions.map(permWords), ...(t.boons ?? []).map(boonLine)].join(", ") || "no permissions yet"}.`));
  const ability = (a, x) => `${x.name} (1 ${TN(a.home)}): ${plain(x.text ?? x.html)}`;
  const archs = R.archetypesOf(c, B);
  archs.slice(0, ROWS.archetypes).forEach((a, i) => {
    const at = `archetype_${i + 1}`;
    put(at, a.times > 1 ? `${a.name}, ${TIMES[a.times] ?? `${a.times} times`}` : a.name);
    ring(`${at}_track`, a.home);
    flow([`${at}_mechanic`, `${at}_mechanic_more`], plain(a.for || a.summary));
    flow([`${at}_trait`, `${at}_trait_more`], traitLine(a.trait));
    share(Array.from({ length: ROWS.abilities }, (_, j) => `${at}_ability_${j + 1}`), a.abilities.slice(0, ROWS.abilities).map((x) => ability(a, x)));
    for (const x of a.abilities.slice(ROWS.abilities)) notes.push(said(`${a.name}’s ${ability(a, x)}`));
  });
  for (const a of archs.slice(ROWS.archetypes)) {
    const trait = traitLine(a.trait);
    notes.push(`Archetype, ${a.times > 1 ? `${a.name}, ${TIMES[a.times] ?? `${a.times} times`}` : a.name} (home ${TN(a.home)})${trait ? `, its Trait ${trait.replace(/\.$/, "")}` : ""}: ${a.abilities.map((x) => x.name).join(", ") || "no abilities yet"}.`);
  }

  // A thread in someone else's words says whose, the way the companion does,
  // and its kind's ringed.
  const threadOf = (t) => (t.whose ? `${t.text} (${t.whose} words)` : t.text);
  const strain = (p, t) => ({ strained: ", strained", snapped: ", snapped" })[threadState(s, p.person, t)] ?? "";
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
    for (const t of p.threads.slice(ROWS.threads)) notes.push(said(`A ${kindOf(t)} thread with ${p.person}${strain(p, t)}: ${threadOf(t)}`));
  });
  for (const p of c.threads.slice(ROWS.bonds)) for (const t of p.threads) notes.push(said(`A ${kindOf(t)} thread with ${p.person}${strain(p, t)}: ${threadOf(t)}`));

  // The paper sheet has nowhere else for trouble, a Shadow's pool, the
  // player's own notes or whatever didn't fit, in that order, so their own
  // words come before anything the sheet's run out of room for. At its
  // smallest size Notes still might not fit, and then print says so.
  const pool = Array.isArray(s.pool) && s.pool.length ? `Shadow’s pool: ${s.pool.map((d) => `d${d}`).join(", ")}.` : "";
  const roomy = flow(Array.from({ length: ROWS.notes }, (_, j) => `notes_${j + 1}`), [c.trouble.length ? `Trouble that follows ${them}: ${c.trouble.join(", ")}.` : "", pool, s.notes, ...notes].filter(Boolean).join("\n"));

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
