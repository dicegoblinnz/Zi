// node shoot.mjs DIR [filter] [scale] → a picture of every .html in DIR
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const dir = process.argv[2];
const only = process.argv[3] || "";
const scale = Number(process.argv[4] || 2);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".html") && f.includes(only))) {
  const phone = f.startsWith("home") || f.startsWith("play");
  const page = await browser.newPage({ viewport: phone ? { width: 1000, height: 900 } : { width: 794, height: 1123 }, deviceScaleFactor: scale });
  await page.goto("file://" + path.resolve(dir, f));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const base = path.resolve(dir, f.replace(/\.html$/, ""));
  if (phone) {
    const el = await page.$(".board");
    await el.screenshot({ path: base + ".png" });
  } else {
    const jpg = f.includes("aged");
    await page.screenshot({ path: base + (jpg ? ".jpg" : ".png"), type: jpg ? "jpeg" : "png", quality: jpg ? 86 : undefined, clip: { x: 0, y: 0, width: 794, height: 1123 } });
  }
  await page.close();
}
await browser.close();
console.log("shot");
