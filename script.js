// Baseline Studio — minimal JS: reveal, hero glide, menu, active nav, form -> mailto, year

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

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealed = false;
  let fallbackTimer = null;
  let loadedStateTimer = null;

  function revealOrb(source) {
    if (revealed) return;
    revealed = true;
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    if (loadedStateTimer) window.clearInterval(loadedStateTimer);
    orb.dataset.splineEntrance = source;
    orb.classList.add("is-spline-loaded");
  }

  if (prefersReduced.matches) {
    revealOrb("reduced-motion");
    return;
  }

  function onSplineLoaded(event) {
    requestAnimationFrame(() => revealOrb(event.type));
  }

  viewer.addEventListener("load", onSplineLoaded, { once: true });
  viewer.addEventListener("load-complete", onSplineLoaded, { once: true });

  customElements.whenDefined("spline-viewer").then(() => {
    if (viewer._loaded) revealOrb("loaded-state");
  });

  loadedStateTimer = window.setInterval(() => {
    if (viewer._loaded) revealOrb("loaded-state");
  }, 250);

  fallbackTimer = window.setTimeout(() => revealOrb("fallback"), 6500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomepageSplineEntrance);
} else {
  initHomepageSplineEntrance();
}

function initMobileSplineCanvasBlend() {
  const viewer = document.querySelector(".hp-hero__orb spline-viewer");
  if (!viewer) return;

  window.__baselineSplineBlendHook = "initialized";

  const mobileQuery = window.matchMedia("(max-width: 620px)");
  const edgeMask =
    "radial-gradient(ellipse closest-side at 58% 46%, #000 0%, #000 66%, rgba(0, 0, 0, 0.78) 85%, transparent 100%)";
  let attempts = 0;
  let retryTimer = null;

  function applyCanvasBlend() {
    const canvas = viewer.shadowRoot?.querySelector("canvas");
    if (!canvas) {
      attempts += 1;
      if (attempts < 160) retryTimer = window.setTimeout(applyCanvasBlend, 250);
      return;
    }

    canvas.style.setProperty("background", "#000000");
    canvas.style.setProperty("background-color", "#000000");
    window.__baselineSplineBlendHook = mobileQuery.matches ? "mobile-canvas" : "desktop-clear";

    if (mobileQuery.matches) {
      canvas.style.setProperty("-webkit-mask-image", edgeMask);
      canvas.style.setProperty("mask-image", edgeMask);
      canvas.style.setProperty("-webkit-mask-repeat", "no-repeat");
      canvas.style.setProperty("mask-repeat", "no-repeat");
    } else {
      canvas.style.removeProperty("-webkit-mask-image");
      canvas.style.removeProperty("mask-image");
      canvas.style.removeProperty("-webkit-mask-repeat");
      canvas.style.removeProperty("mask-repeat");
    }
  }

  viewer.addEventListener("load", applyCanvasBlend);
  viewer.addEventListener("load-complete", applyCanvasBlend);
  window.addEventListener("load", applyCanvasBlend);
  customElements.whenDefined("spline-viewer").then(applyCanvasBlend);
  mobileQuery.addEventListener?.("change", applyCanvasBlend);
  applyCanvasBlend();

  window.addEventListener("pagehide", () => {
    if (retryTimer) window.clearTimeout(retryTimer);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMobileSplineCanvasBlend);
} else {
  initMobileSplineCanvasBlend();
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
    if (!businessName) { alert("Please enter your business name."); ok = false; }
    if (!message || message.length < 10) { alert("Please add a few project details (at least 10 characters)."); ok = false; }
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
        btn.textContent = "Request a quote";
      }
    }
  });
}
