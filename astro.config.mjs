// The Zi'Dara website. Pages are built ahead of time from content/ (see
// scripts/build-content.mjs) and served as static files by Cloudflare.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://zidara.world",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
