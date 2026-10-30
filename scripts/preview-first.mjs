// The last step of `npm run build`, and it only does anything in Workers
// Builds on a branch that isn't main.
//
// Cloudflare starts a branch's first Preview from the Preview base settings in
// the dashboard as well as wrangler.jsonc's previews block, and since 23 Oct
// every new Preview of zi has failed while the ones already there (website)
// keep building. So the build makes the branch's Preview first from the
// previews block alone (--ignore-base-config), and the Preview command that
// Workers Builds runs next finds it there and updates it, the way it updates
// the website Preview. If it can't (no signal to Cloudflare, or no token in
// the build step), the build carries on and the Preview command tries as it
// always has.
import { execFileSync } from "node:child_process";

const branch = process.env.WORKERS_CI_BRANCH;
if (process.env.WORKERS_CI !== "1" || !branch || branch === "main") process.exit(0);

try {
  execFileSync("npx", ["wrangler", "preview", "--ignore-base-config"], { stdio: "inherit" });
  console.log(`preview-first: the Preview for ${branch} is made from wrangler.jsonc, ready for the Preview command.`);
} catch (e) {
  console.log(`preview-first: couldn't make the Preview for ${branch} first (${e.message.split("\n")[0]}), so the Preview command will try on its own.`);
}
