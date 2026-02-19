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

// Scroll-jacking hero zoom: image zooms before page scrolls
const hero = document.querySelector(".hero--engineered");
const heroImg = hero ? hero.querySelector(".hero-media img") : null;

if (hero && heroImg) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scaleStart = 1.0;  // Start much more zoomed in
  const scaleEnd = 1.5;     // End at normal scale
  const maxDrift = 40;      // More vertical drift
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

    // Prevent default scroll while zooming
    e.preventDefault();

    // Increment zoom progress (slower = more scroll needed)
    const delta = e.deltaY || e.detail || 0;
    zoomProgress += Math.abs(delta) * 0.0008;  // Slower progress = more dramatic
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

  // Use non-passive listener to allow preventDefault
  window.addEventListener("wheel", handleScroll, { passive: false });
  window.addEventListener("resize", onResize);
  prefersReduced.addEventListener?.("change", onResize);
  updateHeroZoom();
}

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");


function closeNav() {
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
}

if (toggle && nav) {
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
}

// Active nav highlighting (IntersectionObserver)
const sectionIds = ["services", "process", "projects", "about", "contact"];
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

// Contact form -> mailto (no backend required)
// Contact form -> Google Sheets + Email (Apps Script)
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwmcU_7p0Q6eVvesD2-9ae5ltAyEZBPOvt8ity2qOnrVx1pZNtjPvPUtSSPClXFHFB60A/exec";

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg || "";
}

function setError(fieldId, message) {
  const el = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", Boolean(message));
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameEl = form.querySelector("#name");
    const emailEl = form.querySelector("#email");
    const messageEl = form.querySelector("#message");
    const companyEl = form.querySelector("#company"); // honeypot

    // Clear UI
    setStatus("");
    setError("name", "");
    setError("email", "");
    setError("message", "");

    // Honeypot: if filled, silently pretend success (spam)
    if (companyEl && companyEl.value.trim()) {
      form.reset();
      setStatus("Thanks — message sent.");
      return;
    }

    const name = nameEl?.value?.trim() || "";
    const email = emailEl?.value?.trim() || "";
    const message = messageEl?.value?.trim() || "";

    // Basic validation
    let ok = true;
    if (!name) { setError("name", "Please enter your name."); ok = false; }
    if (!email || !validEmail(email)) { setError("email", "Please enter a valid email."); ok = false; }
    if (!message || message.length < 10) { setError("message", "Please add a few details (at least 10 characters)."); ok = false; }
    if (!ok) return;

    // Disable button while sending
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.7";
      btn.textContent = "Sending…";
    }

    setStatus("Sending…");

    const payload = {
      name,
      email,
      message,
      source: "baseline-site",
    };

    try {
      // Send as text/plain to avoid CORS preflight headaches with Apps Script
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      form.reset();
      setStatus("Message sent — we’ll be in touch.");
    } catch (err) {
      setStatus("Something went wrong. Please email ben@baselinestudiodesign.com.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "";
        btn.textContent = "Send";
      }
    }
  });
}

// Start Project form handler
const startProjectForm = document.querySelector('.sp-form__card');

if (startProjectForm) {
  startProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameEl = startProjectForm.querySelector("#sp-name");
    const emailEl = startProjectForm.querySelector("#sp-email");
    const projectTypeEl = startProjectForm.querySelector("#sp-type");
    const budgetEl = startProjectForm.querySelector("#sp-budget");
    const messageEl = startProjectForm.querySelector("#sp-message");
    const honeypotEl = startProjectForm.querySelector('[name="_gotcha"]');

    // Honeypot check - silently reject spam
    if (honeypotEl && honeypotEl.value.trim()) {
      window.location.href = "./thanks.html";
      return;
    }

    const name = nameEl?.value?.trim() || "";
    const email = emailEl?.value?.trim() || "";
    const projectType = projectTypeEl?.value?.trim() || "";
    const budget = budgetEl?.value?.trim() || "";
    const message = messageEl?.value?.trim() || "";

    // Basic validation
    let ok = true;
    if (!name) { alert("Please enter your name."); ok = false; }
    if (!email || !validEmail(email)) { alert("Please enter a valid email."); ok = false; }
    if (!projectType) { alert("Please select a project type."); ok = false; }
    if (!budget) { alert("Please select a budget range."); ok = false; }
    if (!message || message.length < 10) { alert("Please add project details (at least 10 characters)."); ok = false; }
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
      project_type: projectType,
      budget,
      message,
      source: "start-project",
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
        btn.textContent = "Send request";
      }
    }
  });
}
