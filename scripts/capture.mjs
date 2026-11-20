// Captures real hero media from a locally running app.
// Usage: node scripts/capture.mjs better-canvas
// The app server must already be running. Saved settings are never written:
// settings are patched in the browser and every PUT is dropped.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const SIZE = { width: 1280, height: 800 };

const APPS = {
  "better-canvas": {
    url: "http://127.0.0.1:4871/",
    settings: { theme: "typewriter", mode: "bright" },
    // The app's demo data uses real-looking course codes. The capture swaps in generic ones.
    rewrite: { "MATH 093": "MATH 101", "COMP 051": "CS 110", "CORE 002": "HIST 102", "WRIT 010": "COMM 105", "IDEA 010": "ENGR 120" },
    forbid: ["MATH 093", "COMP 051", "CORE 002", "WRIT 010", "IDEA 010"],
    settle: 4500,
    // What the visitor sees in the loop: a slow scroll down the board.
    async record(page) {
      await page.waitForTimeout(700);
      await page.mouse.move(640, 400);
      for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 8); await page.waitForTimeout(50); }
      await page.waitForTimeout(800);
    },
  },
  // Desk on scripts/demo_vault.py's made-up student, never the real vault.
  desk: {
    url: "http://127.0.0.1:4875/",
    readOnly: true,
    async record(page) {
      await page.waitForTimeout(600);
      await page.mouse.click(1047, 669);
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: "Got it" }).click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      await page.mouse.move(640, 420);
      for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 9); await page.waitForTimeout(50); }
      await page.waitForTimeout(1200);
      for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, -9); await page.waitForTimeout(30); }
      await page.waitForTimeout(600);
    },
  },
  "fab-run": {
    url: pathToFileURL(join(homedir(), "source", "repos", "fab-run", "index.html")).href,
    size: { width: 390, height: 780 },
    async record(page) {
      await page.waitForTimeout(800);
      await page.getByRole("button", { name: "Electrical Eng" }).click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Start your run" }).click();
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: "5 minutes" }).click();
      await page.waitForTimeout(2500);
    },
  },
};

const name = process.argv[2];
const app = APPS[name];
if (!app) throw new Error(`Unknown app: ${name}. Known: ${Object.keys(APPS).join(", ")}`);

const out = join("media", name);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const size = app.size || SIZE;
const context = await browser.newContext({ viewport: size, colorScheme: "dark" });
const page = await context.newPage();

// Apps that can write get every POST refused, so a capture never changes anything.
if (app.readOnly) await page.route("**/*", (route) => (route.request().method() === "POST" ? route.fulfill({ status: 403, body: "{}" }) : route.continue()));

// Text swaps run on every API answer, in the browser only.
const swap = (text) => Object.entries(app.rewrite || {}).reduce((t, [from, to]) => t.split(from).join(to), text);
if (app.rewrite) await page.route("**/api/**", async (route) => {
  const res = await route.fetch();
  return route.fulfill({ response: res, body: swap(await res.text()) });
});

if (app.settings) await page.route("**/api/settings**", async (route) => {
  if (route.request().method() !== "GET") return route.fulfill({ json: { ok: false } });
  const res = await route.fetch();
  const body = await res.json();
  if (body.settings) Object.assign(body.settings.look, app.settings);
  return route.fulfill({ response: res, body: swap(JSON.stringify(body)) });
});

// Recording starts after the app has settled, so the video never opens on a blank page.
await page.goto(app.url, { waitUntil: "load" });
await page.waitForTimeout(app.settle || 1500);
if (app.prepare) await app.prepare(page);
const refuse = async () => {
  const text = await page.evaluate(() => document.body.innerText);
  for (const word of app.forbid || []) if (text.includes(word)) throw new Error(`Refusing to capture "${word}"`);
};
await refuse();
await page.screencast.start({ path: join(out, "hero.webm"), size });
await app.record(page);
await refuse();
await page.screencast.stop();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
const shot = await page.screenshot({ type: "png" });
await context.close();
await browser.close();

await sharp(shot).webp({ quality: 78 }).toFile(join(out, "hero-1280.webp"));
await sharp(shot).resize(Math.min(640, size.width)).webp({ quality: 74 }).toFile(join(out, "hero-640.webp"));
console.log(`Saved media for ${name} in ${out}`);
