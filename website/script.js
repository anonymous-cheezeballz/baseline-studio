// Baseline Studio — minimal JS: reveal, hero glide, menu, active nav, form -> mailto, year

// Photographic hero: native scrolling controls a paused video behind the HTML.
function initDeskHeroVideo() {
  const hero = document.querySelector(".hp-hero--desk");
  const video = hero?.querySelector(".hp-hero__video");
  const content = hero?.querySelector(".hp-hero__main");
  const sequence = hero?.closest(".hp-hero-sequence");
  const pin = hero?.closest(".hp-hero-pin");
  if (!video || !sequence || !pin) return;
  const mobile = window.matchMedia("(max-width: 620px)");
  const stable = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let previousTime = 0;
  let position = 0;
  let failed = false;
  const enabled = () => !stable.matches && !failed && !document.hidden;

  function fadeContent(progress) {
    if (!content) return;
    if (mobile.matches) {
      const details = Math.max(0, Math.min(1, (0.48 - progress) / 0.36));
      const title = Math.max(0, Math.min(1, (0.72 - progress) / 0.44));
      content.style.opacity = "1";
      content.inert = title === 0;
      hero.style.setProperty("--mobile-details-opacity", details);
      hero.style.setProperty("--mobile-title-opacity", title);
      const actions = content.querySelector(".hp-hero__actions");
      if (actions) actions.inert = details === 0;
      return;
    }
    const opacity = progress <= 0.25 ? 1
      : progress <= 0.5 ? 1 - (progress - 0.25) * 0.6 / 0.25
      : progress < 0.65 ? 0.4 * (0.65 - progress) / 0.15
      : 0;
    content.style.opacity = String(opacity);
    // Fully invisible actions should not accept clicks or keyboard focus.
    content.inert = opacity === 0;
  }

  function tick(now) {
    frame = 0;
    if (!enabled() || !Number.isFinite(video.duration) || video.readyState < 2) return;
    // CSS supplies the sticky travel: 100svh desktop, 75svh mobile.
    const rect = sequence.getBoundingClientRect();
    const scrubDistance = Math.max(1, rect.height - pin.getBoundingClientRect().height);
    const progress = Math.max(0, Math.min(1, -rect.top / scrubDistance));
    fadeContent(progress);
    // Stay within the final decoded frame of this 24 fps asset.
    const target = progress * Math.max(0, video.duration - 1 / 24);
    const elapsed = previousTime ? Math.min(now - previousTime, 64) : 16;
    previousTime = now;
    position += (target - position) * (1 - Math.exp(-elapsed / 90));
    if (progress === 0 || progress === 1 || Math.abs(target - position) < 0.008) position = target;
    if (mobile.matches) {
      const visualProgress = position / Math.max(0.001, video.duration - 1 / 24);
      hero.style.setProperty("--mobile-media-y", `${4 * (1 - visualProgress)}px`);
      hero.style.setProperty("--mobile-overlay-opacity", 1 - 0.45 * visualProgress);
    }
    // Let each seek finish rather than repeatedly interrupting the decoder.
    if (!video.seeking && Math.abs(video.currentTime - position) > 0.008) {
      video.currentTime = position;
    }
    if (position !== target || video.seeking || Math.abs(video.currentTime - target) > 0.008) {
      frame = requestAnimationFrame(tick);
    } else {
      previousTime = 0;
    }
  }
  function schedule() {
    if (enabled() && !frame) frame = requestAnimationFrame(tick);
  }
  function applyMode() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    video.pause();
    hero.style.removeProperty("--mobile-media-y");
    hero.style.removeProperty("--mobile-overlay-opacity");
    if (!mobile.matches) {
      hero.style.removeProperty("--mobile-details-opacity");
      hero.style.removeProperty("--mobile-title-opacity");
      const actions = content?.querySelector(".hp-hero__actions");
      if (actions) actions.inert = false;
    }
    if (stable.matches || failed) fadeContent(0);
    if (!enabled()) return;
    if (!video.getAttribute("src")) {
      video.muted = true;
      video.src = video.dataset.src;
      video.load();
    }
    schedule();
  }
  video.addEventListener("loadedmetadata", schedule);
  video.addEventListener("loadeddata", () => {
    video.classList.add("is-ready");
    schedule();
  });
  video.addEventListener("seeked", schedule);
  video.addEventListener("error", () => {
    failed = true;
    fadeContent(0);
    video.classList.remove("is-ready");
    cancelAnimationFrame(frame);
    frame = 0;
  });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", applyMode);
  document.addEventListener("visibilitychange", applyMode);
  stable.addEventListener("change", applyMode);
  mobile.addEventListener("change", applyMode);
  applyMode();
}
initDeskHeroVideo();

// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

function runHeroReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach((el) => el.classList.add("is-visible"));
    });
  });
}

// Run reveal as soon as DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runHeroReveal);
} else {
  runHeroReveal();
}

// 🔑 ADD THIS LINE
window.addEventListener("load", runHeroReveal);

function initHomepageSplineEntrance() {
  const orb = document.querySelector(".hp-hero__orb");
  const viewer = orb ? orb.querySelector("spline-viewer") : null;
  if (!orb || !viewer) return;

  const desktopSplineUrl = viewer.dataset.desktopUrl;
  const mobileSplineUrl = viewer.dataset.mobileUrl;
  const mobileViewport = window.matchMedia("(max-width: 620px)");
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let revealed = false;
  let fallbackTimer = null;
  let loadedStateTimer = null;

  function applySplineScene() {
    const nextUrl = mobileViewport.matches
      ? mobileSplineUrl
      : desktopSplineUrl;

    if (!nextUrl || viewer.getAttribute("url") === nextUrl) return;

    viewer.setAttribute("url", nextUrl);
  }

  function revealOrb(source) {
    if (revealed) return;

    revealed = true;

    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (loadedStateTimer) window.clearInterval(loadedStateTimer);

    orb.dataset.splineEntrance = source;
    orb.classList.add("is-spline-loaded");
  }

  function onSplineLoaded(event) {
    requestAnimationFrame(() => revealOrb(event.type));
  }

  function onViewportChange() {
    applySplineScene();
  }

  if (typeof mobileViewport.addEventListener === "function") {
    mobileViewport.addEventListener("change", onViewportChange);
  } else {
    mobileViewport.addListener(onViewportChange);
  }

  if (prefersReduced.matches) {
    revealOrb("reduced-motion");
    applySplineScene();
    return;
  }

  viewer.addEventListener("load", onSplineLoaded, { once: true });
  viewer.addEventListener("load-complete", onSplineLoaded, { once: true });

  customElements.whenDefined("spline-viewer").then(() => {
    if (viewer._loaded) revealOrb("loaded-state");
  });

  loadedStateTimer = window.setInterval(() => {
    if (viewer._loaded) revealOrb("loaded-state");
  }, 250);

  fallbackTimer = window.setTimeout(
    () => revealOrb("fallback"),
    6500
  );

  applySplineScene();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomepageSplineEntrance);
} else {
  initHomepageSplineEntrance();
}

// Scroll-jacking hero zoom: image zooms before page scrolls
try {
  const hero = document.querySelector(".hero--engineered");
  const heroImg = hero ? hero.querySelector(".hero-media img") : null;

  if (hero && heroImg) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scaleStart = 1.0;
    const scaleEnd = 1.5;
    const maxDrift = 40;
    let zoomProgress = 0;
    let isZoomComplete = false;
    let ticking = false;

    function updateHeroZoom() {
      ticking = false;
      if (prefersReduced.matches) return;

      const scale = scaleStart + (scaleEnd - scaleStart) * zoomProgress;
      const y = -maxDrift * zoomProgress;

      hero.style.setProperty("--hero-media-y", `${y.toFixed(2)}px`);
      hero.style.setProperty("--hero-media-scale", scale.toFixed(4));
    }

    function handleScroll(e) {
      if (prefersReduced.matches) return;

      const heroRect = hero.getBoundingClientRect();
      const isHeroVisible = heroRect.top < window.innerHeight && heroRect.bottom > 0;

      if (!isHeroVisible || isZoomComplete) return;

      e.preventDefault();

      const delta = e.deltaY || e.detail || 0;
      zoomProgress += Math.abs(delta) * 0.0008;
      zoomProgress = Math.min(1, zoomProgress);

      if (zoomProgress >= 1) {
        isZoomComplete = true;
      }

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeroZoom);
      }
    }

    function onResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeroZoom);
      }
    }

    window.addEventListener("wheel", handleScroll, { passive: false });
    window.addEventListener("resize", onResize);
    prefersReduced.addEventListener?.("change", onResize);
    updateHeroZoom();
  }
} catch (err) {
  console.warn("Hero zoom init failed:", err);
}

// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!toggle || !nav) return;

  function closeNav() {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Close on link click
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => closeNav());
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;
    const clickedInside = nav.contains(t) || toggle.contains(t);
    if (!clickedInside) closeNav();
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
});

// Active nav highlighting (IntersectionObserver)
const sectionIds = ["services", "projects", "about", "contact"];
const links = new Map();

document.querySelectorAll(".nav-link").forEach((a) => {
  const href = a.getAttribute("href") || "";
  if (href.startsWith("#")) links.set(href.slice(1), a);
});

function setActive(id) {
  document
    .querySelectorAll(".nav-link")
    .forEach((a) => a.classList.remove("is-active"));
  const link = links.get(id);
  if (link) link.classList.add("is-active");
}

const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((x) => x.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) setActive(visible.target.id);
    },
    { root: null, threshold: [0.2, 0.35, 0.5, 0.65] },
  );

  sections.forEach((s) => io.observe(s));
}

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwmcU_7p0Q6eVvesD2-9ae5ltAyEZBPOvt8ity2qOnrVx1pZNtjPvPUtSSPClXFHFB60A/exec";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Start Project form handler
const startProjectForm = document.querySelector('.sp-form__card');

if (startProjectForm) {
  startProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameEl = startProjectForm.querySelector("#sp-name");
    const emailEl = startProjectForm.querySelector("#sp-email");
    const businessEl = startProjectForm.querySelector("#sp-business");
    const messageEl = startProjectForm.querySelector("#sp-message");
    const honeypotEl = startProjectForm.querySelector('[name="_gotcha"]');

    // Honeypot check - silently reject spam
    if (honeypotEl && honeypotEl.value.trim()) {
      window.location.href = "./thanks.html";
      return;
    }

    const name = nameEl?.value?.trim() || "";
    const email = emailEl?.value?.trim() || "";
    const businessName = businessEl?.value?.trim() || "";
    const message = messageEl?.value?.trim() || "";

    // Basic validation
    let ok = true;
    if (!name) { alert("Please enter your name."); ok = false; }
    if (!email || !validEmail(email)) { alert("Please enter a valid email."); ok = false; }
    if (!message || message.length < 10) { alert("Please add a few details (at least 10 characters)."); ok = false; }
    if (!ok) return;

    // Disable button while sending
    const btn = startProjectForm.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.7";
      btn.textContent = "Sending…";
    }

    const payload = {
      name,
      email,
      businessName,
      projectDetails: message,
      source: "website",
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // Redirect to thanks page on success
      window.location.href = "./thanks.html";
    } catch (err) {
      alert("Something went wrong. Please try again or email ben@baselinestudiodesign.com.");
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "";
        btn.textContent = "Send project details";
      }
    }
  });
}

// Homepage project rail: native scrolling remains available without JavaScript.
(() => {
  const rail = document.querySelector('.hp-editorial .hp-projects');
  const navigation = document.querySelector('.hp-project-nav');
  if (!rail || !navigation) return;
  const projects = [...rail.querySelectorAll('.hp-project')];
  const buttons = [...navigation.querySelectorAll('[data-project]')];
  navigation.hidden = false;
  function updateCurrent() {
    const left = rail.getBoundingClientRect().left;
    const current = projects.reduce((nearest, project) =>
      Math.abs(project.getBoundingClientRect().left - left) <
      Math.abs(nearest.getBoundingClientRect().left - left) ? project : nearest
    );
    buttons.forEach(button => {
      if (button.dataset.project === current.id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const project = projects.find(item => item.id === button.dataset.project);
    rail.scrollTo({ left: project.offsetLeft, behavior: 'instant' });
    updateCurrent();
  }));
  rail.addEventListener('scroll', updateCurrent, { passive: true });
  window.addEventListener('resize', updateCurrent);
  updateCurrent();
})();
