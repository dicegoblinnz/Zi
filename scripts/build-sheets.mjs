// Build the printable sheets into public/sheets/:
//
//   npm run sheets
//
// The character sheet (two A4 pages, back to back, fillable) and the player
// reference (Appendix D on four A4 pages). Each is an HTML page drawn with the
// kit (src/kit/kit.js) in its Paper theme (src/styles/kit.css) and
// scripts/sheets/print.css, and printed by the Playwright Chromium the site's
// checks already use, so the PDFs carry the real fonts. The character sheet's
// fields are added afterwards with pdf-lib, over the boxes the page drew.
// Each PDF is stamped with the date and a hash of what it was built from, and
// tests/check-site.mjs fails when that hash no longer matches.
//
// Workers Builds can't run Chromium, so the PDFs are committed. Rebuild them
// whenever Appendix D, the kit or anything in scripts/sheets/ changes.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import {
  PDFArray, PDFDict, PDFDocument, PDFName, PDFRef, PDFStream, PDFString, StandardFonts, TextAlignment, rgb,
  drawEllipse, drawRectangle, drawSvgPath, drawLine, pushGraphicsState, popGraphicsState,
} from "pdf-lib";
import { ROOT, SHEETS, sourceHash } from "./sheets/sources.mjs";
import { characterSheet } from "./sheets/character-sheet.mjs";
import { playerReference, REFERENCE_PAGES } from "./sheets/player-reference.mjs";

const OUT = join(ROOT, "public", "sheets");
const INK = rgb(0x1d / 255, 0x15 / 255, 0x26 / 255);
const PX = 0.75; // CSS px to PDF points

// The date in Auckland, where the game's played.
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
const nice = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function fonts() {
  const face = (family, pkg, file, weight, style = "normal") =>
    `@font-face{font-family:"${family}";src:url("${pathToFileURL(join(ROOT, "node_modules", "@fontsource", pkg, "files", file)).href}") format("woff2");font-weight:${weight};font-style:${style};}`;
  return [
    face("Cinzel", "cinzel", "cinzel-latin-700-normal.woff2", 700),
    ...[400, 500, 700].flatMap((w) => ["normal", "italic"].map((s) => face("Alegreya Sans", "alegreya-sans", `alegreya-sans-latin-${w}-${s}.woff2`, w, s))),
    // The numbers on the kit's dice.
    face("Alegreya Sans", "alegreya-sans", "alegreya-sans-latin-800-normal.woff2", 800),
  ].join("\n");
}

// The kit's look first, in its Paper theme, then the sheets' own.
function page(title, body) {
  const kit = readFileSync(join(ROOT, "src", "styles", "kit.css"), "utf8");
  const css = readFileSync(join(ROOT, "scripts", "sheets", "print.css"), "utf8");
  return `<!doctype html><html lang="en-NZ" data-theme="paper"><head><meta charset="utf-8"><title>${title}</title><style>${fonts()}\n${kit}\n${css}</style></head><body>${body}</body></html>`;
}

async function print(browser, name, html, measure) {
  const file = join(tmpdir(), `zidara-${name}.html`);
  writeFileSync(file, html);
  const tab = await browser.newPage();
  await tab.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  const missing = await tab.evaluate(() => [...document.fonts].filter((f) => f.status !== "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`));
  const used = await tab.evaluate(() => document.fonts.check("700 10pt Cinzel") && document.fonts.check("400 10pt 'Alegreya Sans'"));
  if (!used) throw new Error(`${name}: the fonts didn't load (${missing.join(", ")})`);
  const fields = measure ? await tab.evaluate(measureFields) : [];
  // A page that's too full shows how far over it is, in mm.
  const over = await tab.evaluate(() => [...document.querySelectorAll(".page")].map((p, i) => [i + 1, ((p.scrollHeight - p.clientHeight) * 25.4) / 96]).filter(([, mm]) => mm > 0.3));
  if (over.length) {
    const say = over.map(([p, mm]) => `page ${p} by ${mm.toFixed(1)}mm`).join(", ");
    if (!process.env.SHEETS_DRAFT) throw new Error(`${name}: too much to fit, ${say}`);
    console.warn(`${name}: too much to fit, ${say}`);
  }
  const pdf = await tab.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true, tagged: !measure, outline: !measure });
  await tab.close();
  return { pdf, fields };
}

// Every write-in space on the page, where it is, in CSS px from its page's top left.
function measureFields() {
  const pages = [...document.querySelectorAll(".page")];
  return [...document.querySelectorAll("[data-f], [data-cb], [data-radio]")].map((el) => {
    const pageEl = el.closest(".page");
    const p = pageEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      page: pages.indexOf(pageEl),
      x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height,
      kind: el.dataset.f ? "text" : el.dataset.cb ? "check" : "radio",
      name: el.dataset.f || el.dataset.cb || el.dataset.radio,
      value: el.dataset.value || null,
      look: el.dataset.look || null,
      size: el.dataset.size !== undefined ? Number(el.dataset.size) : 9,
      align: el.dataset.align || "left",
      multi: el.hasAttribute("data-multi"),
    };
  });
}

// What a ticked box looks like: a cross for a snapped thread, a tick for a
// strained one, Resolve's gem cut solid the way the kit fills one you've got,
// and a ring round the die (or the stage, or bond or hostile) you're on.
// The gem's the kit's own (src/kit/kit.js), on the same 100 box.
const GEM = "M30 10 H70 L94 37 L50 94 L6 37 Z";
const FACETS = "M6 37 H94 M30 10 L39 37 L50 94 L61 37 L70 10";
const WHITE = rgb(1, 1, 1);
function marks(look, w, h) {
  const g = (ops) => [pushGraphicsState(), ...ops, popGraphicsState()];
  switch (look) {
    case "fill":
      return g(drawRectangle({ x: 1.2, y: 1.2, width: w - 2.4, height: h - 2.4, borderWidth: 0, color: INK, borderColor: undefined, rotate: { type: "degrees", angle: 0 }, xSkew: { type: "degrees", angle: 0 }, ySkew: { type: "degrees", angle: 0 } }));
    case "cross": {
      const i = Math.min(w, h) * 0.18;
      const line = (a, b) => drawLine({ start: a, end: b, thickness: 0.9, color: INK, lineCap: 1 });
      return g([...line({ x: i, y: i }, { x: w - i, y: h - i }), ...line({ x: i, y: h - i }, { x: w - i, y: i })]);
    }
    case "check":
      return g(drawSvgPath(`M ${w * 0.18} ${h * 0.52} L ${w * 0.42} ${h * 0.78} L ${w * 0.86} ${h * 0.2}`, { x: 0, y: h, scale: 1, color: undefined, borderColor: INK, borderWidth: 1, borderLineCap: 1 }));
    case "gem": {
      const s = Math.min(w, h) / 100;
      const at = { x: (w - 100 * s) / 2, y: h - (h - 100 * s) / 2, scale: s };
      return g([
        ...drawSvgPath(GEM, { ...at, color: INK, borderColor: INK, borderWidth: 4.6 * s, borderLineCap: 1 }),
        ...drawSvgPath(FACETS, { ...at, color: undefined, borderColor: WHITE, borderWidth: 2.6 * s, borderLineCap: 1 }),
      ]);
    }
    case "ring":
      return g(drawEllipse({ x: w / 2, y: h / 2, xScale: w / 2 - 1.1, yScale: h / 2 - 1.1, color: undefined, borderColor: INK, borderWidth: 1.25 }));
    default:
      throw new Error(`no look called ${look}`);
  }
}
const provider = (look) => (field, widget) => {
  const { width, height } = widget.getRectangle();
  return { normal: { on: marks(look, width, height), off: [] } };
};

async function addFields(bytes, fields) {
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const seen = new Set();
  const radios = new Map();
  const custom = [];
  const place = (f) => {
    const page = pages[f.page];
    const { height } = page.getSize();
    return { x: f.x * PX, y: height - (f.y + f.h) * PX, width: f.w * PX, height: f.h * PX, borderWidth: 0, backgroundColor: undefined, borderColor: undefined, textColor: INK };
  };
  const mm = (px) => (px * 25.4) / 96;
  const small = fields.filter((f) => mm(f.h) < (f.kind === "text" ? 3.5 : 2.5) || mm(f.w) < (f.kind === "text" ? 5 : 2.5));
  if (small.length) throw new Error(`fields too small to use: ${small.map((f) => `${f.name} ${mm(f.w).toFixed(1)}x${mm(f.h).toFixed(1)}mm`).join(", ")}`);
  for (const f of fields) {
    if (f.kind === "radio") {
      if (!radios.has(f.name)) {
        if (seen.has(f.name)) throw new Error(`two fields called ${f.name}`);
        seen.add(f.name);
        radios.set(f.name, form.createRadioGroup(f.name));
      }
      radios.get(f.name).addOptionToPage(f.value, pages[f.page], place(f));
      continue;
    }
    if (seen.has(f.name)) throw new Error(`two fields called ${f.name}`);
    seen.add(f.name);
    if (f.kind === "check") {
      const box = form.createCheckBox(f.name);
      box.addToPage(pages[f.page], place(f));
      custom.push([box, f.look]);
    } else {
      const text = form.createTextField(f.name);
      if (f.multi) text.enableMultiline();
      text.disableRichFormatting();
      text.addToPage(pages[f.page], { ...place(f), font });
      if (f.align === "center") text.setAlignment(TextAlignment.Center);
      // A size of 0 fits the text to the box, for the few that run long.
      text.acroField.setDefaultAppearance(`/${font.name} ${f.size} Tf 0.114 0.082 0.149 rg`);
    }
  }
  for (const group of radios.values()) group.enableOffToggling();
  form.updateFieldAppearances(font);
  for (const [box, look] of custom) box.updateAppearances(provider(look));
  for (const group of radios.values()) group.updateAppearances(provider("ring"));
  // pdf-lib names each radio button's state by its number and keeps the
  // names in /Opt. Name the states after what they are instead, so a filled
  // form reads confidence = d8, not confidence = 3.
  for (const [name, group] of radios) {
    const values = fields.filter((f) => f.kind === "radio" && f.name === name).map((f) => f.value);
    group.acroField.getWidgets().forEach((widget, i) => {
      const ap = widget.dict.lookup(PDFName.of("AP"), PDFDict);
      for (const kind of ["N", "D"]) {
        const states = ap.lookupMaybe(PDFName.of(kind), PDFDict);
        const stream = states?.get(PDFName.of(String(i)));
        if (!stream) continue;
        states.delete(PDFName.of(String(i)));
        states.set(PDFName.of(values[i]), stream);
      }
    });
    group.acroField.dict.delete(PDFName.of("Opt"));
  }
  // The font a viewer types in, where viewers look for it.
  form.acroForm.dict.set(PDFName.of("DR"), pdf.context.obj({ Font: { [font.name]: font.ref } }));
  form.acroForm.dict.set(PDFName.of("DA"), PDFString.of(`/${font.name} 0 Tf 0 g`));
  return { pdf, count: seen.size };
}

// pdf-lib draws a default look for every tick box as it's added, and keeps it
// after the sheet's own look replaces it. Drop whatever nothing points to.
function dropOrphans(pdf) {
  const { context } = pdf;
  const seen = new Set();
  const walk = (obj) => {
    if (obj instanceof PDFRef) {
      if (seen.has(obj.tag)) return;
      seen.add(obj.tag);
      walk(context.lookup(obj));
    } else if (obj instanceof PDFDict) for (const [, v] of obj.entries()) walk(v);
    else if (obj instanceof PDFArray) for (const v of obj.asArray()) walk(v);
    else if (obj instanceof PDFStream) walk(obj.dict);
  };
  for (const root of [context.trailerInfo.Root, context.trailerInfo.Info]) if (root) walk(root);
  let dropped = 0;
  for (const [ref] of context.enumerateIndirectObjects()) if (!seen.has(ref.tag)) { context.delete(ref); dropped++; }
  return dropped;
}

async function finish(pdf, name, hash) {
  const sheet = SHEETS[name];
  pdf.setTitle(sheet.title, { showInWindowTitleBar: true });
  pdf.setAuthor("Zi’Dara");
  pdf.setSubject(`${sheet.title}, built ${today} from the rules at ${hash}`);
  pdf.setKeywords(["zidara", `built:${today}`, `source:${hash}`]);
  pdf.setCreator("zidara.world");
  pdf.setProducer("scripts/build-sheets.mjs");
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("en-NZ"));
  dropOrphans(pdf);
  const bytes = await pdf.save({ updateFieldAppearances: false });
  writeFileSync(join(OUT, sheet.file), bytes);
  built[name] = { file: `/sheets/${sheet.file}`, pages: pdf.getPageCount(), kb: Math.round(bytes.length / 1024), built: today, source: hash };
  return bytes.length;
}
// What the Sheets page says about each download.
const built = {};

mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, "src", "data"), { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
try {
  {
    const name = "character-sheet";
    const hash = sourceHash(name);
    const stamp = `Character sheet · built ${nice} · ${hash}`;
    const { pdf, fields } = await print(browser, name, page(SHEETS[name].title, characterSheet(stamp)), true);
    const { pdf: doc, count } = await addFields(pdf, fields);
    if (doc.getPageCount() !== 2) throw new Error(`the character sheet is ${doc.getPageCount()} pages, not 2`);
    const size = await finish(doc, name, hash);
    console.log(`${SHEETS[name].file}: 2 pages, ${count} fields, ${Math.round(size / 1024)} KB, ${hash}`);
  }
  {
    const name = "player-reference";
    const hash = sourceHash(name);
    const stamp = `Player reference · built ${nice} · ${hash}`;
    const { pdf } = await print(browser, name, page(SHEETS[name].title, playerReference(stamp)), false);
    const doc = await PDFDocument.load(pdf);
    if (doc.getPageCount() !== REFERENCE_PAGES) throw new Error(`the player reference is ${doc.getPageCount()} pages, not ${REFERENCE_PAGES}`);
    const size = await finish(doc, name, hash);
    console.log(`${SHEETS[name].file}: ${doc.getPageCount()} pages, ${Math.round(size / 1024)} KB, ${hash}`);
  }
} finally {
  await browser.close();
}
writeFileSync(join(ROOT, "src", "data", "sheets.json"), `${JSON.stringify(built, null, 2)}\n`);
