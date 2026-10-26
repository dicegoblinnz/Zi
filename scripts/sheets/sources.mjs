// What each printable sheet is built from, and a short hash of it. The build
// stamps the hash into each PDF, and tests/check-site.mjs works it out again
// from the files as they are now, so a sheet that's fallen behind the rules
// (the player reference behind Appendix D, say) fails the check.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Both are drawn with the kit in its Paper theme, and both draw the steps
// ladder from the companion's dice table, so those count too.
const shared = ["scripts/sheets/print.css", "scripts/build-sheets.mjs", "src/kit/kit.js", "src/kit/sigils.js", "src/styles/kit.css", "src/companion/dice.js"];
export const SHEETS = {
  "character-sheet": {
    file: "zidara-character-sheet.pdf",
    title: "Zi’Dara character sheet",
    sources: ["scripts/sheets/character-sheet.mjs", ...shared],
  },
  "player-reference": {
    file: "zidara-player-reference.pdf",
    title: "Zi’Dara player reference",
    sources: ["content/rules/33-appendix-d-quick-reference.md", "scripts/sheets/player-reference.mjs", ...shared],
  },
};

export function sourceHash(name) {
  const hash = createHash("sha256");
  for (const rel of SHEETS[name].sources) {
    hash.update(`${rel}\0${readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n")}\0`);
  }
  return hash.digest("hex").slice(0, 12);
}

// The stamp goes in the PDF's keywords as "source:<hash>", and in the footer.
export const stampedHash = (keywords) => (keywords || "").match(/source:([0-9a-f]{12})/)?.[1] || null;
