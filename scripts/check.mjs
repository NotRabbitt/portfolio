// Milestone check of the built page. Usage: node scripts/check.mjs <output-folder>
import { chromium } from "playwright";
import { join } from "node:path";

const outDir = process.argv[2] || ".";
const URL = "http://127.0.0.1:4872/";
const browser = await chromium.launch();

for (const [label, options] of [
  ["phone", { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["calm", { viewport: { width: 375, height: 812 }, reducedMotion: "reduce" }],
]) {
  const page = await (await browser.newContext(options)).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

  await page.goto(URL, { waitUntil: "load" });
  await page.screenshot({ path: join(outDir, `${label}-top.png`) });
  const firstLoad = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.name.endsWith(".webm")).length);

  // Walk down the page the way a visitor does and note how many videos play at each stop.
  const playingAtEachStop = [];
  const ids = await page.$$eval(".show", (els) => els.map((e) => e.id));
  for (const id of ids) {
    await page.evaluate((i) => {
      const s = document.getElementById(i), d = s.querySelector(".device");
      const top = window.scrollY + d.getBoundingClientRect().top;
      window.scrollTo({ top: top - 40, behavior: "instant" });
    }, id);
    await page.waitForTimeout(1600);
    playingAtEachStop.push(await page.$$eval("video", (vs) => vs.filter((v) => !v.paused).length));
    await page.screenshot({ path: join(outDir, `${label}-${id}.png`) });
  }

  // Each Try it button must stay uncovered for a real scroll distance, or a phone user can't tap it.
  const tappable = [];
  for (const id of ids.slice(0, -1)) {
    tappable.push(await page.evaluate(async (i) => {
      const btn = document.querySelector(`#${i} .btn-try`);
      const onTop = () => {
        const b = btn.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return b.bottom <= innerHeight && b.top >= 0 && hit === btn;
      };
      window.scrollTo({ top: 0, behavior: "instant" });
      let y = 0, px = 0;
      const end = document.documentElement.scrollHeight;
      while (y < end) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise(requestAnimationFrame);
        if (onTop()) px += 40; else if (px) break;
        y += 40;
      }
      return px;
    }, id));
  }

  const state = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    videos: document.querySelectorAll("video").length,
    allStatusVisible: [...document.querySelectorAll(".status")].every((s) => getComputedStyle(s).opacity === "1"),
    namesFit: [...document.querySelectorAll(".name")].every((n) => n.getBoundingClientRect().right <= innerWidth),
  }));
  console.log(label, JSON.stringify({ webmAtLoad: firstLoad, playingAtEachStop, tappablePx: tappable, ...state }), errors.length ? `ERRORS: ${errors.join(", ")}` : "no errors");
}
await browser.close();
