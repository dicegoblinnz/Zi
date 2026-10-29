// Deal boards as text, for a recipe and a seed (stage 2 of
// notes/builder-plan.md), with the same engine the World screen uses.
//
//   node scripts/deal-world.mjs [--tables FILE_OR_FOLDER] [--region city]
//        [--genre ID | --era ID [--twist ID]] [--seed ash-lantern-ford]
//        [--factions 6] [--dials tense=2,strange=0] [--boards 1]
//
//   --tables   public/world-tables.json (from npm run content) unless it's
//              given, or a folder of YAML, like tests/world-pack, which is
//              checked against the book first (npm run content makes the
//              book's parts it needs)
//   --genre    one of genres.yaml's named genres, or --era with any --twist
//   --seed     three words: the same seed and tables deal the same board
//   --dials    fixed, instead of the asking setting them
//   --boards   how many to deal, each seed after the first made from it
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cardsOf, dealWorld, newSeed, rngOf } from "../src/companion/world-engine.js";
import { bookFor, compileTables, readTablesDir } from "./world-tables.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const m = process.argv[i].match(/^--([a-z]+)(?:=(.*))?$/);
  if (!m) continue;
  args[m[1]] = m[2] ?? (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[++i] : "true");
}
const stop = (msg) => {
  console.error(msg);
  process.exit(1);
};

// The tables, compiled, or read straight from a folder of YAML.
export function loadTables(at = join(ROOT, "public", "world-tables.json"), { minimums = false } = {}) {
  if (!existsSync(at)) stop(`No tables at ${at}. Run npm run content once there are tables, or pass --tables tests/world-pack.`);
  if (!statSync(at).isDirectory()) return JSON.parse(readFileSync(at, "utf8"));
  const bookAt = join(ROOT, "src", "generated", "book.json");
  const worldAt = join(ROOT, "public", "world-book.json");
  if (!existsSync(bookAt) || !existsSync(worldAt)) stop("The book's parts aren't built yet. Run npm run content first.");
  const book = JSON.parse(readFileSync(bookAt, "utf8"));
  const wb = JSON.parse(readFileSync(worldAt, "utf8"));
  const { src, problems: unread } = readTablesDir(at);
  const { tables, problems } = compileTables(src, bookFor(book.companion.worlds, wb), { minimums });
  if (!tables) stop(`The tables in ${at} have problems:\n  ${[...unread, ...problems].join("\n  ")}`);
  return tables;
}

// One board, as text.
export function boardText(T, W) {
  const C = cardsOf(T, W);
  const g = Object.values(T.genres).find((x) => x.era === W.recipe.era && x.twist === W.recipe.twist);
  const mix = `${T.eras[W.recipe.era]}${W.recipe.twist ? ` and ${T.twists[W.recipe.twist]}` : ""}`;
  const out = [];
  const say = (s = "") => out.push(s);
  say(`${W.seed} · ${T.regions[W.recipe.region].name} · ${g ? `${g.name} (${mix})` : mix} · ${W.n} factions`);
  say(`Dials: ${Object.entries(W.dials).map(([k, v]) => `${k} ${v}`).join(" · ")}${W.fixed ? " (fixed)" : ""}`);
  say(`Holds it together: ${W.asking.holds?.text ?? "-"}`);
  say(`Runs it: ${W.asking.runs?.text ?? "-"}`);
  say(`A stranger notices: ${W.asking.notices?.text ?? "-"}`);
  say(`Tension (${W.tension?.roll}): ${W.tension?.text ?? "-"}`);
  say();
  say(`The ground, ${C.seats.length} seats:`);
  for (const s of C.seats) say(`  ${s.name} (${s.role}${s.held >= 0 ? `, ${C.factions[s.held].name}` : ", free"}): ${s.notice}`);
  C.factions.forEach((f, i) => {
    const w = W.factions[i];
    say();
    say(`${i + 1}. ${f.name}: ${f.size}, d${f.die} (${f.steps} ${f.steps === 1 ? "step" : "steps"}), on ${C.seats.find((s) => s.k === f.seat)?.name ?? "-"}`);
    say(`   ${[f.about, f.sits].filter(Boolean).join(" ")}${w.type?.why ? `  [${w.type.why}]` : ""}`);
    if (f.exception) say(`   Breaks the logic: ${f.exception.text}, ${f.exception.reason}`);
    say(`   Wants: ${f.want}${w.want?.why ? `  [${w.want.why}]` : ""}`);
    const extra = f.res.length - f.assets.filter((a) => !a.off).length;
    say(`   Resources: ${f.res.map((r) => r.text).join(" · ")}${extra > 0 ? ` (${extra} extra)` : ""}`);
    say(`   Assets: ${f.assets.map((a) => `${a.text}${a.power ? " (+1 Power)" : ""}${a.off ? " (a need, nothing paying for it)" : ""}`).join(" · ")}`);
    say(`   Agenda: ${f.agendas.map((a) => `${a.text} d${a.die}`).join("")}${w.agenda?.why ? `  [${w.agenda.why}]` : ""}`);
    say(`   Face: ${f.face}, Challenge ${f.ch} (${(f.threat?.tags ?? []).map((t) => t.text).join(", ")})`);
    say(`   Secret: ${f.secret}. ${f.more}`);
    for (const o of f.offers) say(`   Offered: ${o.bond} ${o.kind}, ${o.text}`);
    for (const t of f.threads) say(`   ${t.kind === "hostile" ? "Hostile" : "Bond"} toward ${C.factions[t.to]?.name}: ${t.text}`);
  });
  say();
  const failed = (W.checks ?? []).filter((c) => !c.ok).map((c) => c.k);
  say(`Checks: ${failed.length ? `failed ${failed.join(", ")}` : "all passed"}${W.fixes.length ? `, ${W.fixes.length} dealt again (${[...new Set(W.fixes.map((f) => f.k))].join(", ")})` : ""}${W.fallbacks.length ? `, fallbacks: ${W.fallbacks.join(", ")}` : ""}`);
  return out.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const T = loadTables(args.tables ? join(process.cwd(), args.tables) : undefined);
  const region = args.region ?? "city";
  let era = args.era;
  let twist = args.twist ?? null;
  if (args.genre) {
    const g = T.genres[args.genre];
    if (!g) stop(`No genre called ${args.genre}. The tables have: ${Object.keys(T.genres).join(", ")}`);
    ({ era, twist } = g);
  }
  if (!era) {
    const g = Object.values(T.genres).find((x) => T.packs[`era:${x.era}`]?.fits.includes(region) && (!x.twist || T.packs[`twist:${x.twist}`]));
    if (!g) stop(`Nothing in the tables deals at ${region}.`);
    ({ era, twist } = g);
  }
  const dials = args.dials ? Object.fromEntries(args.dials.split(",").map((x) => x.split("=")).map(([k, v]) => [k.trim(), Number(v)])) : null;
  let seed = args.seed ?? newSeed(T);
  for (let b = 0; b < Number(args.boards ?? 1); b++) {
    if (b) {
      console.log("\n----------------------------------------\n");
      seed = newSeed(T, rngOf(seed, "next"));
    }
    try {
      console.log(boardText(T, dealWorld(T, { recipe: { region, era, twist }, dials, seed, factions: Number(args.factions ?? 6) })));
    } catch (err) {
      stop(err.message);
    }
  }
}
