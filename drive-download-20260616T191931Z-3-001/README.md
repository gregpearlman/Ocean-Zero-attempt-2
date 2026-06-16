# VC HQ Starter Kit

Everything a fund needs to stand up its own **Claude-operated portfolio operations dashboard** — the same architecture that runs Exa VC HQ.

A VC HQ is a password-protected internal website that is the single source of truth for your fund's live deal book (portfolio companies, investor universe, investor×company pairings, fund performance, to-dos, pipeline) — and a *living tool* that Claude keeps current by mining your Gmail, Slack and Google Drive.

It is a **plain static site** (HTML/CSS/JS, no build step, no framework) hosted on Netlify, edited in plain English through Claude Code, and auto-deployed on every `git push`.

---

## What's in this kit

| Folder | Contents |
|---|---|
| **`slides/`** | `build-your-vc-hq.html` — a self-contained slide deck walking through the whole build, step by step. Open it in any browser; arrow keys to navigate, `F` for fullscreen. |
| **`docs/`** | Eight numbered guides — the full onboarding + handover documentation (read in order). |
| **`templates/`** | A working static-site skeleton you copy into a fresh repo: `index.html`, `styles.css`, `app.js`, `data.js`, deploy config, guardrail `pre-push` hook, Netlify edit function, and example Claude Skills. Plus a fill-in-the-blanks `CLAUDE.md`. |

## How to use it

1. **Watch the deck** — open `slides/build-your-vc-hq.html` for the 10-minute overview.
2. **Read the docs** in order, starting with `docs/00-getting-started.md`.
3. **Copy the template** into a new private GitHub repo and start filling in `data.js` + `CLAUDE.md`.
4. **Hand it to Claude** — open the repo in Claude Code and say *"read CLAUDE.md and let's get started."*

## The docs, in order

| # | Doc | Covers |
|---|---|---|
| 00 | `00-getting-started.md` | The 10-step path from zero to live, prerequisites, decisions to make first |
| 01 | `01-claude-code-onboarding.md` | How Claude operates the site; writing a great `CLAUDE.md`; sessions, agents, skills |
| 02 | `02-architecture-and-stack.md` | File-by-file map of the static site and how rendering works |
| 03 | `03-data-model.md` | The `COMPANIES` / `INVESTORS` / `PAIRINGS` schemas in full |
| 04 | `04-netlify-deploy.md` | Connecting Netlify, auto-deploy, password protection, env vars |
| 05 | `05-connectors-and-mining.md` | Gmail/Slack/Drive MCP connectors and the mining workflow |
| 06 | `06-automation-routines.md` | Slack scanner, email scout, Drive sync — unattended upkeep |
| 07 | `07-guardrails-and-security.md` | The non-negotiables: secrets, sensitivities, data integrity, the edit-overlay hook |

## A note on confidentiality

The real VC HQ holds confidential deal data — investor names, deal terms, cap tables, conversation state. **This kit ships only the architecture and templates, scrubbed of any fund's private data.** When you build your own, keep the repo private and treat every file as confidential.

---

*Generated as a sister-fund onboarding package. The reference implementation is Exa VC HQ.*
