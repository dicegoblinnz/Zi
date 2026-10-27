// Write dist/sw.js after the build: the service worker from scripts/sw.js,
// with the list of files to keep on the phone and a version that changes
// whenever any of them does. It keeps every page except the not-found page,
// the CSS and scripts, the Latin fonts, the figures and the favicon, and the
// blank character sheet, which the companion fills in to print a character,
// openings.json, which the pop-ups read, and world-book.json, the places,
// people and threats a GM brings in or rolls for her world.
// Search (dist/pagefind/) needs a signal, so it's left out.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "pagefind") walk(path);
    } else files.push(path);
  }
})(DIST);

// The kit (/kit/) is a design board for Mo, so it stays off everyone's phone:
// its page, and any script or style only that page asks for. The companion
// draws with the kit too, so whatever another page uses is kept, and so is
// every Latin font, the 800 weight included, since the dice's numbers use it.
const refs = (html) => [...html.matchAll(/(?:src|href)="\/(_astro\/[^"]+)"/g)].map((m) => m[1]);
const kitPage = join(DIST, "kit", "index.html");
const kitRefs = new Set(existsSync(kitPage) ? refs(readFileSync(kitPage, "utf8")) : []);
const others = new Set(files.filter((p) => p.endsWith(".html") && p !== kitPage).flatMap((p) => refs(readFileSync(p, "utf8"))));
const kitOnly = (rel) => rel.startsWith("kit/") || (kitRefs.has(rel) && !others.has(rel));
const keep = (rel) => !kitOnly(rel) && ((/\.(html|css|js|svg)$/.test(rel) && !["sw.js", "404.html"].includes(rel)) || /latin.*\.woff2$/.test(rel) || rel === "sheets/zidara-character-sheet.pdf" || rel === "openings.json" || rel === "world-book.json");
const hash = createHash("sha1");
const urls = [];
for (const path of files.sort()) {
  const rel = relative(DIST, path).split(sep).join("/");
  if (!keep(rel)) continue;
  hash.update(rel).update(readFileSync(path));
  urls.push(`/${rel.replace(/(^|\/)index\.html$/, "$1")}`);
}
const version = hash.digest("hex").slice(0, 10);
const source = readFileSync(join(ROOT, "scripts", "sw.js"), "utf8");
writeFileSync(join(DIST, "sw.js"), source.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(urls)));
console.log(`sw.js: ${urls.length} files kept for offline, version ${version}`);
