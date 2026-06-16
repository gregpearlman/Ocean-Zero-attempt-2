# CLAUDE.md — <YOUR FUND> VC HQ Handover

This file is loaded automatically when Claude Code opens a new session in this repo. It's the complete brief so a fresh context becomes productive immediately. **Fill in every `<PLACEHOLDER>` and keep it current.**

---

## Project at a glance

**<YOUR FUND> VC HQ** is the internal portfolio operations dashboard for <YOUR FUND>. It tracks <N> portfolio companies, an active pipeline of pre-investment DD, and a per-person to-do list.

The site is a **plain static HTML/CSS/JS app** (no build step) hosted on Netlify with visitor password protection. All content is confidential — investor names, deal terms, cap tables, conversation state mined from Gmail + Slack + Drive.

It is also a **living tool**, not a one-off report. Most sessions involve:
- Mining the team's Gmail and Slack for fresh investor/portco context
- Updating per-portco state in `data.js` and `app.js`
- Adjusting the dashboard, To-Do, or Pipeline views
- Pushing to GitHub which auto-deploys to Netlify

---

## Critical access

| Item | Value |
|---|---|
| Site URL | `<https://your-fund-hq.netlify.app>` |
| Site password | _(stored out-of-band; never in this repo)_ |
| GitHub repo | `<your-fund/vc-hq>` (private) |
| Netlify project | `<project-name>` |
| Auto-deploy | **ON** — `git push origin main` triggers a Netlify build automatically. |

---

## Stack

| File | Purpose |
|---|---|
| `index.html` | Structure: sidebar nav, view sections, mobile topbar |
| `styles.css` | Design system — dark theme; tokens in `:root` |
| `app.js` | All rendering + interactions; holds `ROUND_STATUS`, render functions, the router |
| `data.js` | `COMPANIES`, `INVESTORS`, `PAIRINGS` (+ sectors/experts) — the core dataset |
| `edits.js` | Overlay of in-browser edits (written out-of-band by `save-edits`). NEVER let a code push revert it. |
| `version.js` / `history.js` | Generated at Netlify build time by `scripts/build-meta.sh` |
| `netlify.toml` | Deploy config |
| `netlify/functions/save-edits.js` | Serverless function backing in-browser Edit mode |
| `.githooks/pre-push` | Guardrail: blocks a push that would revert `edits.js` |
| `.claude/` | Project settings + reusable Skills |

_(Add rows as you add data files: `<company>-outreach.js`, `fund-performance.js`, etc.)_

---

## Deploy

```bash
git add -A
git commit -m "your message"
git push   # auto-triggers Netlify build (~30-60s to live)
```

Always **rebase onto the latest `origin/main` before pushing** (the `pre-push` hook requires that a push never revert `edits.js`; a clean fast-forward satisfies it).

---

## Portfolio companies (<N>)

Each has full state in `data.js → COMPANIES`, dashboard state in `app.js → ROUND_STATUS[id]`. The `id` used as the key is in parentheses.

| # | Name | id | Sector | Urgency | Status |
|---|------|----|--------|---------|--------|
| 1 | `<Company>` | `<company-id>` | `<sector>` | HOT/WARM/COLD | `<one-line status>` |

**ID conventions:** the `ROUND_STATUS` key must match the company `id` exactly (hyphens included — common gotcha).

---

## Team responsibility matrix

In `app.js → EXA_OWNERS` (rename to your fund). Shown as owner chips on dashboard tiles.

| Person | Code | Primary on | Secondary on |
|---|---|---|---|
| `<Name>` | `<XX>` | `<companies>` | `<companies>` |

---

## Investor pairings universe

Pairings live in `data.js → PAIRINGS`, ranked by `tier` + `conviction`. **Every new pairing must carry a citable `verificationUrl`** (a 2024-onwards source proving the fund is actively investing in the right sector + stage).

**Rank allocation** (so parallel agents don't collide): reserve a block per expansion round, e.g. round 1 = 100-199, round 2 = 200-299, …

**Schema:** see `docs/03-data-model.md`. Key fields: `rank`, `tier` (1/2/3/avoid), `investor`, `company`, `conviction` (0-5), `contact`, `killerAngle`, `checkAsk`, `introPath`, `ticketMatch`, `stageMatch`, `verificationUrl`, optional `touchpoint`.

After any `data.js` edit: **`node --check data.js`**.

---

## Critical sensitivities / guardrails

_(These are the highest-value section. Make them concrete and fund-specific.)_

1. **NEVER commit `.netlify/`** or any secret. Secrets live ONLY in Netlify env vars.
2. **NEVER hard-code investor emails** into structured data files.
3. **Every new pairing needs a citable `verificationUrl`** — no fabricated funds or guessed LinkedIn slugs.
4. **NEVER let a code push revert `edits.js`.** Always rebase before pushing; never force-push `main`. Enforced by `.githooks/pre-push`. If blocked: `bash scripts/sync-live-data.sh` then re-commit/amend.
5. **`<Sensitive deal context #1>`** — never externalize.
6. **`<Sensitive deal context #2>`** — never externalize.
7. **Mining boundaries:** only mine `<in-scope sources>`. Default-deny everything else (`<off-limits sources>`), even on a matching search.
8. Flag anything factually suspect before persisting it.

---

## Common workflows

### Mining investor context for a single portco
```
1. Search Gmail: from:<partner> <PortcoName> + subject:<PortcoName>
2. Search Slack: in:#<portco-channel>
3. Synthesize new state into the per-portco narrative
4. Update ROUND_STATUS[id] in app.js if state changed
5. Update COMPANIES entry in data.js if structural (round size, lead, sector)
6. git commit + push (auto-deploys)
```

### Spawning parallel research agents
Use the Agent tool with `run_in_background: true`. Always pass a self-contained brief (agents have no context from the session), a list of what's already on the site, the sensitivity guardrails, and the exact output format.

### Adding a pairings expansion round
1. Allocate the next rank block.
2. Build per-portco briefs requiring `verificationUrl` on every pairing.
3. Spawn one agent per company; each returns a JSON block of new investors/pairings.
4. Apply, then `node --check data.js`.
5. Dispatch a verify-pass (spot-check citations; catch stale partner names / fake slugs).

---

## Recent major work (chronological — most recent first)

- **<DATE>** — `<what changed this session>`

---

*Last updated: <DATE> by <whom>. Keep this handover current — update it in the same commit as any structural change.*
