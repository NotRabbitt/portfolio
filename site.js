// Scroll reveals, stacked sections, Desk's particles, and video that loads and plays only while on screen.
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = navigator.connection && navigator.connection.saveData;
const sections = [...document.querySelectorAll(".show")];

const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("is-seen");
    seen.unobserve(e.target);
  }
}, { threshold: 0.2 });
sections.forEach((s) => seen.observe(s));

// A section taller than the screen must scroll to its bottom before it pins, so it pins at a negative offset.
if (!calm) {
  const pin = () => {
    for (const s of sections) s.style.setProperty("--stick", `${Math.min(0, innerHeight - s.offsetHeight)}px`);
  };
  const sizes = new ResizeObserver(pin);
  sections.forEach((s) => sizes.observe(s));
  addEventListener("resize", pin);
  pin();
  document.querySelector("main").classList.add("stack");
}

// A pinned section still counts as on screen after the next one covers it, so an
// IntersectionObserver would leave its video running. This measures what is really visible.
function visibleShare(el) {
  const box = el.getBoundingClientRect();
  const next = el.closest(".show").nextElementSibling;
  const bottom = Math.min(box.bottom, innerHeight, next ? next.getBoundingClientRect().top : innerHeight);
  return Math.max(0, bottom - Math.max(box.top, 0)) / Math.min(box.height, innerHeight);
}

const watchers = [];
let queued = false;
const check = () => { queued = false; watchers.forEach((watch) => watch()); };
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
addEventListener("scroll", queue, { passive: true });
addEventListener("resize", queue);

// The video is created on first view, so it costs nothing until someone scrolls to it.
// Without motion or WebM support the screenshot stays, which is a complete fallback.
const canPlay = document.createElement("video").canPlayType("video/webm; codecs=vp9");
if (!calm && !saveData && canPlay) {
  document.querySelectorAll("[data-video]").forEach((device) => {
    let video = null;
    watchers.push(() => {
      const show = visibleShare(device) >= 0.4;
      if (show && !video) {
        video = document.createElement("video");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("aria-hidden", "true");
        video.src = device.dataset.video;
        video.addEventListener("playing", () => video.classList.add("is-playing"), { once: true });
        device.querySelector(".screen").append(video);
      }
      if (!video) return;
      if (show && video.paused) video.play().catch(() => {});
      else if (!show && !video.paused) video.pause();
    });
  });
}

// Slow grey particles behind Desk. The loop only runs while the section is on screen.
function drift(section) {
  const canvas = document.createElement("canvas");
  canvas.className = "particles";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const motes = Array.from({ length: 42 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 0.00006, vy: -0.00004 - Math.random() * 0.00008, a: 0.12 + Math.random() * 0.3,
  }));
  const fit = () => {
    canvas.width = section.offsetWidth * dpr;
    canvas.height = section.offsetHeight * dpr;
  };
  let frame = 0, last = 0;
  const step = (now) => {
    const dt = Math.min(now - last, 50);
    last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const m of motes) {
      m.x = (m.x + m.vx * dt + 1) % 1;
      m.y = (m.y + m.vy * dt + 1) % 1;
      ctx.globalAlpha = m.a;
      ctx.fillStyle = "#d6d6d6";
      ctx.beginPath();
      ctx.arc(m.x * canvas.width, m.y * canvas.height, m.r * dpr, 0, 7);
      ctx.fill();
    }
    frame = requestAnimationFrame(step);
  };
  new ResizeObserver(fit).observe(section);
  let running = false;
  watchers.push(() => {
    const show = visibleShare(section) > 0;
    if (show === running) return;
    running = show;
    cancelAnimationFrame(frame);
    if (show) { last = performance.now(); frame = requestAnimationFrame(step); }
  });
}
if (!calm) document.querySelectorAll('[data-texture="particles"]').forEach(drift);
queue();
