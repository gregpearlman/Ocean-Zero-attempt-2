# 00 · Getting Started

This is the fast path from nothing to a live, Claude-operated VC HQ. Each step has its own deep-dive doc; this page is the map.

## What you're building

A password-protected internal website that is your fund's single source of truth:

- **Dashboard** — one round-status tile per portfolio company, sorted hot → cold.
- **Fund Performance** — capital deployed, NAV, MOIC, per-company returns from your master sheet.
- **To-Do** — operational + investor-outreach streams, per team member, refreshed weekly.
- **Companies** — each portco as its own mini-site (round, cap table, board, governance, competitors, exit comps).
- **Investors / Pairings** — your funding universe × companies, ranked and tier-scored with citable sources.
- **Pipeline / Outreach / Documents** — DD pipeline, scored outreach queue, live narrative docs.

It's a **plain static site** — no framework, no build step — so any teammate or any Claude session can edit it instantly. Push to GitHub, Netlify auto-deploys in ~30–60s.

## Decisions to make first

1. **Portfolio companies** — list them and assign each a stable, lowercase, hyphenated `id` (e.g. `acme-fusion`). The `id` is a permanent key; never change it later.
2. **Team** — who's on the fund and their initials (these become "owner chips" on the dashboard).
3. **Data sources** — which Gmail accounts / Slack channels / Drive folders are *in scope* for Claude to mine, and which are strictly off-limits. Write both lists down.
4. **Confidentiality posture** — what context must never appear in anything externally shareable (specific deal tensions, cap-table dynamics, unannounced rebrands, etc.).

## The 10 steps

| Step | Do this | Deep dive |
|---|---|---|
| 1 | Create a **private** GitHub repo; copy in `templates/` | `02-architecture-and-stack.md` |
| 2 | Populate `data.js` with your portfolio | `03-data-model.md` |
| 3 | Add your first investors + pairings to `data.js` | `03-data-model.md` |
| 4 | Connect Netlify; set the site password | `04-netlify-deploy.md` |
| 5 | Fill in `CLAUDE.md` (fund, team, guardrails) | `01-claude-code-onboarding.md` |
| 6 | Wire Gmail / Slack / Drive connectors | `05-connectors-and-mining.md` |
| 7 | Run your first mining session | `05-connectors-and-mining.md` |
| 8 | Hook up a live outreach tracker + fund sheet | `06-automation-routines.md` |
| 9 | (Optional) Stand up the Slack-scanner routine | `06-automation-routines.md` |
| 10 | Configure `save-edits` for in-browser editing | `07-guardrails-and-security.md` |

## Prerequisites

- **GitHub** account + the `gh` CLI (or the web UI).
- **Netlify** account. The free tier deploys fine; **Pro** ($19/mo) is needed for visitor-password protection.
- **Claude** — Claude Code (CLI, desktop app, or web at claude.ai/code).
- **MCP connectors** (optional but transformative): Gmail, Slack, Google Drive, Fireflies.

You do **not** need a coding background. You drive Claude in plain English; the templates give it the scaffold to work from.

## The shortest possible start

```bash
gh repo create your-fund/vc-hq --private --clone
cd vc-hq
cp -r /path/to/starter-kit/templates/. .
git add -A && git commit -m "scaffold vc-hq from starter kit"
git push -u origin main
```

Then open the repo in Claude Code and say:

> Read `CLAUDE.md`. Help me fill in our fund details and replace the example data in `data.js` with our real portfolio.

Next: **`01-claude-code-onboarding.md`**.
