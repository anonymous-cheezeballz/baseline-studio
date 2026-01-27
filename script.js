// Baseline Studio — minimal JS: menu, active nav, form -> mailto, year

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

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
  document.querySelectorAll(".nav-link").forEach((a) => a.classList.remove("is-active"));
  const link = links.get(id);
  if (link) link.classList.add("is-active");
}

const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const io = new IntersectionObserver(
    (entries) => {
      // Choose the most visible intersecting section
      const visible = entries
        .filter((x) => x.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) setActive(visible.target.id);
    },
    { root: null, threshold: [0.2, 0.35, 0.5, 0.65] }
  );

  sections.forEach((s) => io.observe(s));
}

// Contact form -> mailto (no backend required)
const form = document.getElementById("contact-form");

function setError(fieldId, message) {
  const el = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", Boolean(message));
}

function validEmail(email) {
  // Simple, practical email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#name");
    const email = form.querySelector("#email");
    const message = form.querySelector("#message");

    // Reset errors
    setError("name", "");
    setError("email", "");
    setError("message", "");

    let ok = true;

    if (!name?.value.trim()) {
      setError("name", "Please enter your name.");
      ok = false;
    }
    if (!email?.value.trim() || !validEmail(email.value.trim())) {
      setError("email", "Please enter a valid email.");
      ok = false;
    }
    if (!message?.value.trim() || message.value.trim().length < 10) {
      setError("message", "Please add a few details (at least 10 characters).");
      ok = false;
    }

    if (!ok) return;

    const to = "ben@baselinestudiodesign.com";
    const subject = encodeURIComponent(`Baseline Studio inquiry — ${name.value.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\n\n${message.value.trim()}\n`
    );

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}
