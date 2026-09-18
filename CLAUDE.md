# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Baseline Studio is a static marketing/portfolio website for a web design studio. There is no build step, no bundler, and no npm dependencies — just HTML, CSS, and vanilla JS served directly.

## Running locally

Open any `.html` file in `website/` directly in a browser, or serve the website directory with a local server to avoid path issues:

```sh
python3 -m http.server 8080 --directory website
# then visit http://localhost:8080
```

There are no tests, no lint scripts, and no CI pipeline.

## File structure

| File / folder | Purpose |
|---|---|
| `website/index.html` | Homepage — hero, portfolio preview |
| `website/about.html` | About page (marked **LOCKED LAYOUT**) |
| `website/portfolio.html` | Portfolio grid |
| `website/start-project.html` | Quote-request form (primary conversion page) |
| `website/thanks.html` | Post-form redirect confirmation |
| `website/work/nole-protein.html` | Individual project case-study page |
| `website/style.css` | Single shared stylesheet for every Baseline Studio page |
| `website/script.js` | Single shared JS: reveal animation, hero zoom, mobile nav, active nav, form submission |
| `website/nole/` | Separate client site (Nole Protein) — has its own HTML pages but shares `website/style.css` via relative path |
| `website/assets/` | Images (PNG/SVG/WebP) used across pages |
| `website/_header.html` | Reference snippet — not included dynamically |
| `references/` | Design reference files — do not ship |

## Architecture

**CSS:** A single `website/style.css` is used by every page (including `website/work/*.html` via `../style.css` and `website/nole/*.html`). CSS custom properties live at `:root`. Adding page-specific styles means adding scoped selectors or a new file linked only to that page — never removing or renaming existing classes, as they may be used across multiple pages.

**JS:** A single `website/script.js` handles everything. It is defensive — each block checks `if (element)` before acting, so it runs safely on pages that don't have every element.

**Form:** `website/start-project.html` posts to a Google Apps Script endpoint (`GOOGLE_SCRIPT_URL` in `website/script.js`) with `mode: "no-cors"`. Success always redirects to `website/thanks.html`. A hidden honeypot field (`name="_gotcha"`) provides basic spam filtering.

**Hero zoom:** `website/index.html` uses a scroll-jacking zoom effect on `.hero--engineered`. It intercepts `wheel` events and prevents default scrolling until `zoomProgress >= 1`. Respects `prefers-reduced-motion`.

**Reveal animation:** Elements with class `.reveal` fade/slide in. `website/script.js` adds `.is-visible` via `requestAnimationFrame` on both `DOMContentLoaded` and `load`.

**Design tokens (CSS variables):**
- `--bg: #0A0A0B` — page background
- `--electric-blue: #2f6bff` — accent color
- `--text: #E8EDF2`, `--muted: #9AA4B2`
- `--header-h: 64px` — fixed header height; all `scroll-padding-top` / `scroll-margin-top` are derived from this
- `--container: 1120px` — max content width; applied via `.container`
- `--radius: 18px`, `--radius-sm: 12px`

## Change discipline

- **Prefer additive changes.** Add new classes/selectors rather than modifying existing ones that are shared across pages.
- **Do not rename or remove existing CSS classes** — they may be used on pages you're not currently editing.
- **Do not redesign existing pages** or refactor global CSS structure.
- **Do not touch `website/assets/`** unless explicitly asked.
- `website/about.html` is marked **LOCKED LAYOUT** — only modify with explicit intent and justification.
- After any change, note: files changed, what changed, and how to verify.

## Adding a new portfolio project

1. Create `website/work/<project-name>.html` — copy `website/work/nole-protein.html` as a template; update paths (`../assets/`, `../style.css`, `../script.js`).
2. Add a card in `website/portfolio.html` pointing to the new file.
3. Add/update the preview card in `website/index.html` (`#deliverables` section) if needed.
4. Add project screenshots to `website/assets/images/`.
