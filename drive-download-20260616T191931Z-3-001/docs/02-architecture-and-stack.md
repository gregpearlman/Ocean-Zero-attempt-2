# 02 · Architecture & Stack

The whole site is **plain static HTML/CSS/JS with no build step**. There is no framework, no bundler, no `npm install`. You can open `index.html` directly in a browser and it works. Netlify serves the same files unchanged.

This is a deliberate choice: it means *any* edit — by a teammate or a Claude session — is a one-line change to a plain file, with no toolchain to break.

## File map

| File | Role |
|---|---|
| `index.html` | Page structure: the sidebar nav and one `<section>` per view. No data — just the skeleton + `<script>` tags. |
| `styles.css` | The design system. Dark, GitHub-style palette defined as CSS variables in `:root`. Responsive sidebar → mobile topbar. |
| `app.js` | **All** rendering and interactivity. Holds the per-view render functions, the dashboard status object, the to-do lists, filters, charts, and the router. |
| `data.js` | The core dataset: `COMPANIES`, `INVESTORS`, `PAIRINGS` (+ sectors, experts). Edited most often. |
| `edits.js` | An overlay of edits saved through the in-browser Edit mode. Layered over `data.js` at runtime. (See doc 07.) |
| `*-outreach.js` | Per-company live outreach trackers synced from Drive sheets. |
| `fund-performance.js` | Fund master-sheet data: cap tables, cash flows, valuations. |
| `version.js` / `history.js` | Generated at Netlify build time (deploy metadata + git-log history). |
| `netlify.toml` | Deploy config: publish dir, build command, security headers, functions dir. |
| `scripts/build-meta.sh` | The Netlify build entry point: writes `version.js`, generates `history.js`, optionally pulls live data. |
| `netlify/functions/save-edits.js` | Serverless function backing in-browser Edit mode. |
| `CLAUDE.md` | The handover brief (doc 01). |
| `.claude/` | Project settings + reusable Skills. |
| `.githooks/pre-push` | Guardrail hook protecting `edits.js` (doc 07). |

## How rendering works

There is no virtual DOM and no reactive framework — just functions that build HTML strings and write them into a container.

1. `index.html` defines a `<section class="view" id="view-dashboard">` (etc.) for each view, plus a sidebar of `<a data-view="…">` links.
2. At the bottom, `<script>` tags load the data files (`data.js`, `*-outreach.js`, …) then `app.js`.
3. `app.js` reads the global arrays (`COMPANIES`, `INVESTORS`, `PAIRINGS`) and, for each view, has a render function that builds the table/grid/cards and injects them.
4. A small hash router (`route()`) shows/hides the right `<section>` based on `location.hash` (e.g. `#pairings`, `#company/acme-fusion/round`).

So "adding data" is just editing the arrays in `data.js`; "changing how it looks" is editing a render function in `app.js`; "adding a view" is a new `<section>` + nav link + render function.

## The design system

`styles.css` opens with a `:root` block of CSS variables — the single place to change the look:

```css
:root {
  --bg: #0d1117;          /* page background */
  --bg-elev: #161b22;     /* cards / elevated surfaces */
  --border: #2d333b;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #58a6ff;      /* links, highlights */
  --green: #3fb950;  --amber: #d29922;  --red: #f85149;  /* status colors */
  --radius: 8px;
  --sidebar-w: 260px;
}
```

Change these to re-skin the whole site. The layout is a fixed left sidebar on desktop that collapses to a hamburger topbar on mobile (a media query swaps `#sidebar` for `#mobile-topbar`).

## Loading order matters

In `index.html`, data files load **before** `app.js`, and `edits.js` loads **before** `data.js`-consuming logic so the overlay is available. If you add a new data file, add its `<script>` tag in the same block — before `app.js` — and the global it defines (`window.YOUR_DATA`) will be available to the renderers.

## External dependencies

Exactly one, loaded from a CDN: `marked.js` (Markdown → HTML, for the Documents view). Everything else is hand-written vanilla JS. No `node_modules`.

Next: **`03-data-model.md`**.
