// Turns projects.json into a static page in dist/.
// The HTML and CSS are written into one file ahead of time, so the first screen needs no JavaScript.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const { owner, flagship, projects } = JSON.parse(readFileSync("projects.json", "utf8"));
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const link = (url) => esc(url.replace("{github}", owner.github));

const FRAMES = { laptop: { width: 1280, height: 800 }, phone: { width: 390, height: 780 } };

// Theme tokens become CSS variables on the section, so styles.css stays app-agnostic.
function themeVars(t, name) {
  const vars = {
    bg: t.background, ink: t.text, accent: t.accent, "on-accent": t.onAccent, font: t.font,
    "head-font": t.headFont, "head-weight": t.headWeight, surface: t.surface, "surface-ink": t.surfaceInk,
    line: t.line, stamp: t.stamp, dot: t.dot, bezel: t.bezel, chars: name.length,
  };
  return Object.entries(vars).filter(([, v]) => v !== undefined).map(([k, v]) => `--${k}:${v}`).join(";");
}

function image(m) {
  const { width, height } = FRAMES[m.frame];
  const sources = m.imageSmall
    ? `src="${esc(m.imageSmall)}" srcset="${esc(m.imageSmall)} 640w, ${esc(m.image)} 1280w" sizes="(min-width: 1100px) 1040px, 92vw"`
    : `src="${esc(m.image)}"`;
  return `<img ${sources} width="${width}" height="${height}" loading="lazy" decoding="async" alt="${esc(m.alt)}">`;
}

// Desk's own mark for "the one priority": a hand-drawn ink circle.
const inkCircle = `<svg class="ink-circle" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M34 16C96 2 238 0 282 24c26 16-8 44-92 50C96 80 8 70 6 44 4 24 60 8 150 6"/></svg>`;

function section(p) {
  const m = p.media, t = p.theme;
  return `<section class="show${m.frame === "phone" ? " has-phone" : ""}" id="${esc(p.id)}" data-texture="${esc(t.texture)}" data-reveal="${esc(t.reveal)}" data-status="${esc(t.statusStyle)}" style="${esc(themeVars(t, p.name))}">
  <div class="show-inner">
    <p class="status">${esc(p.status)}</p>
    <h2 class="name"><span class="name-text">${esc(p.name)}</span>${t.reveal === "circle" ? inkCircle : ""}</h2>
    <p class="pitch">${esc(p.pitch)}</p>
    <figure class="device device-${esc(m.frame)}"${m.video ? ` data-video="${esc(m.video)}"` : ""}>
      <div class="screen">
        ${image(m)}
      </div>
    </figure>
    <div class="foot">
      <ul class="blurb">
        ${p.blurb.map((line) => `<li>${esc(line)}</li>`).join("\n        ")}
      </ul>
      <div class="actions">
        <a class="btn btn-try" href="${link(p.links.try)}">${esc(p.links.tryLabel || "Try it")}</a>
        <a class="btn btn-feedback" href="${link(p.links.feedback)}">Send feedback</a>
      </div>
    </div>
  </div>
</section>`;
}

// The signal trace is the brand mark: one line, drawn in the hero and again on the flagship.
const trace = `<svg class="trace" viewBox="0 0 420 200" fill="none" aria-hidden="true"><path class="trace-base" d="M0 100h420"/><path class="trace-line" pathLength="1" d="M0 100h60l14-60 22 120 22-150 22 170 20-110 16 50 14-20h40l12-40 18 80 16-60 12 20h132"/></svg>`;
const num = (i) => String(i).padStart(2, "0");

// Link row: the flagship is 01, then each project. A game hosted on this site opens straight away.
const bioLink = (p, i) => {
  const href = p.links.try.startsWith("play/") ? link(p.links.try) : `#${esc(p.id)}`;
  return `<a href="${href}" style="--swatch:${esc(p.theme.accent)}"><small>${num(i + 2)} · ${esc(p.kind)}</small>${esc(p.name)}</a>`;
};

// A teaser: it names the field and the stage, and nothing about what the thing does.
const flagshipSection = `<section class="flagship" id="flagship">
  <div class="flagship-inner">
    <p class="flagship-label">01 · ${esc(flagship.label)}</p>
    <h2>${esc(flagship.name)}</h2>
    <p class="flagship-pitch">${esc(flagship.pitch)}</p>
    ${trace}
    <dl>
      ${flagship.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n      ")}
    </dl>
    <p class="flagship-note">${esc(flagship.note)}</p>
  </div>
</section>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(owner.name)}</title>
<meta name="description" content="${esc(owner.line)}">
<meta name="theme-color" content="#0B0E12">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%230B0E12'/%3E%3Cpath fill='%23FF7A1A' d='M6.5 3h3L9 9.5H7zM6.7 11h2.6v2.5H6.700z'/%3E%3C/svg%3E">
<link rel="preload" href="fonts/jetbrains-mono-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>
${readFileSync("styles.css", "utf8")}</style>
<script>document.documentElement.classList.add("js")</script>
<script src="site.js" defer></script>
</head>
<body>
<header class="hero">
  <div class="hero-top"><span><b>●</b> ${esc(owner.name)}</span><span>${esc(owner.fields)}</span></div>
  ${trace}
  <h1 aria-label="${esc(owner.name)}" style="--chars:${owner.wordmark.length}"><span aria-hidden="true"><i>${esc(owner.wordmark[0])}</i>${esc(owner.wordmark.slice(1))}</span></h1>
  <p class="hero-line">${esc(owner.line)}</p>
</header>
<nav class="bio" aria-label="Projects">
  <a class="bio-flag" href="#flagship"><small>01 · ${esc(flagship.label)}</small>${esc(flagship.name)}</a>
  ${projects.map(bioLink).join("\n  ")}
</nav>
<main>
${flagshipSection}
${projects.map(section).join("\n")}
</main>
<footer class="site-foot">&copy; ${new Date().getFullYear()} ${esc(owner.name)}. All rights reserved. Portfolio ${esc(version)}</footer>
</body>
</html>
`;

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
writeFileSync("dist/index.html", html);
for (const path of ["site.js", "media", "fonts", "play"]) cpSync(path, `dist/${path}`, { recursive: true });
console.log(`Built ${projects.length} section(s) into dist/`);
