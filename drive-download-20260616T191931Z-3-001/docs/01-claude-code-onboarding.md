# 01 · Claude Code Onboarding

The defining idea of a VC HQ: **Claude is the operator.** You don't hand-edit data files — you tell Claude what changed in plain English, and it mines the context, updates the right files, and pushes. This doc is how to set that up well.

## How Claude operates the site

A typical session looks like:

1. You open the repo in Claude Code (CLI, desktop, or claude.ai/code).
2. Claude **automatically reads `CLAUDE.md`** at session start — that's its operating manual for your fund.
3. You give an instruction: *"Update Acme Fusion — they closed the lead, Lowercarbon is in for $20M."*
4. Claude searches Gmail/Slack for corroborating context, edits `data.js` + the dashboard status in `app.js`, and commits + pushes.
5. Netlify auto-deploys. Done in minutes.

The leverage comes from `CLAUDE.md` being good enough that a *fresh* session — with zero prior context — is productive immediately.

## Writing a great `CLAUDE.md`

`CLAUDE.md` lives at the repo root and is loaded into context on every session. The template (`templates/CLAUDE.md`) gives you the skeleton; fill in every `<PLACEHOLDER>`. A strong handover has these sections:

| Section | Why it matters |
|---|---|
| **Project at a glance** | One paragraph: what the site is, that it's a living tool, what most sessions involve. |
| **Critical access** | Site URL, password, repo, Netlify project, deploy method. (Secrets stay in env vars — see doc 07.) |
| **Stack / file map** | A table of every file and its job. Claude uses this to know where to make a change. |
| **Portfolio companies** | A table of your portcos with `id`, sector, urgency, one-line status. |
| **Team responsibility matrix** | Who owns what; the initials that become owner chips. |
| **Guardrails / sensitivities** | A numbered list of non-negotiables (see doc 07). The highest-value section. |
| **Common workflows** | Step-by-step recipes: "mining context for one portco", "adding a pairings round", etc. |
| **Recent work log** | Chronological notes so the next session knows what just changed. |

**Keep it current in the same commit as the change.** When you restructure the site or add a system, update `CLAUDE.md` so it never drifts from reality. A stale handover is worse than none.

### Style notes that pay off
- Be terse and precise. Claude mirrors the tone of the handover.
- State things as rules ("NEVER commit `.netlify/`"), not suggestions.
- Cite specifics — file names, function names, dates, named contacts.
- Record confidential context plainly; the repo is private. Don't make Claude ask permission to record routine deal state.

## Parallel agents — the speed multiplier

For anything that fans out across your portfolio (a full mining sweep, a pairings expansion, a verification pass), tell Claude to **spawn one background agent per company**. Nine portcos get mined simultaneously instead of one at a time.

When you do this, each agent needs a **self-contained brief** — agents don't share your session's context. Give them: what the company is, what's already on the site (so they don't re-surface it), the sensitivity guardrails, and the exact output format you want (e.g. "return one JSON block of `{newPairings:[…]}`").

## Skills — packaging repeatable jobs

A **Skill** is a named, reusable procedure stored in `.claude/skills/<name>/SKILL.md` (plus any helper scripts). Any session can invoke it. The kit ships two working examples:

- **`governance-tab`** — point it at a shareholders' agreement / financing doc and it extracts share classes, governance bodies and decision rules into the Governance tab.
- **`pitchbook-investor-profile`** — drop a PitchBook PDF and it enriches the matching investor record with firmographics, team and portfolio.

Build your own Skill for any task you find yourself repeating. The pattern: a `SKILL.md` describing when to use it and the steps, plus optional `extract.py` / `validate.js` helpers.

## Project settings (`.claude/settings.json`)

The template ships a `.claude/settings.json` that:
- **Pre-allows** the read-only connector calls and the safe local scripts, so unattended routines don't stall on permission prompts.
- Sets a **`SessionStart` hook** that activates the `.githooks` directory (so the `pre-push` guardrail is always live — see doc 07).

Commit `.claude/settings.json` and `.claude/skills/` (the template `.gitignore` tracks exactly these and ignores personal session state).

Next: **`02-architecture-and-stack.md`**.
