# 07 · Guardrails & Security

This site holds your fund's most sensitive data. These are the non-negotiables. Encode them as a numbered list in your `CLAUDE.md` so every session — and every routine — follows them.

## Secrets

- **Never commit `.netlify/`.** It contains auth tokens. The template `.gitignore` already excludes it; don't add an exception.
- **Secrets live only in Netlify env vars** — never in the repo, never in a data file. That includes the GitHub PAT, the edit key, and any service-account key.
- **Use a fine-grained GitHub token** for the edit function: scoped to *only this repo*, Contents read+write, nothing else.
- **Keep the repo private** forever and the site password-protected. Treat every file as confidential.

## Data integrity

- **Never hard-code investor contact emails** into any data file. The repo is private and the site is gated, but keep that layer regardless — emails should stay in the narrative docs, not the structured data.
- **Every new pairing carries a citable `verificationUrl`.** No fabricated funds, no guessed LinkedIn slugs. If a source can't be found, the pairing is unverified — mark it, don't invent one.
- **Flag, don't silently "fix", anything that looks wrong.** If a company name, round size, or fact seems off, surface it and verify before persisting.

## Sensitivities — the "never externalize" list

Most of the value of `CLAUDE.md`'s guardrails is in fund-specific sensitivities. Write down anything that must never appear in externally-facing material or agent output, for example:

- Internal CEO/founder dynamics or succession plans.
- Cap-table tensions between strategics and financial investors.
- Unannounced rebrands, pivots, or financings.
- A portfolio conflict you've discovered but not disclosed.

Each one should be a concrete rule: *"Never mention `<X>` in any externally-shareable material; it's sensitive internal context."* These bind agents too — include them in every agent brief.

## The `edits.js` overlay guardrail

This is the subtlest and most important technical guardrail, so understand it before pushing.

**The problem:** the in-browser Edit mode lets teammates save data fixes directly. The `save-edits` Netlify function writes those into `edits.js` and commits them **straight to `main` via the GitHub API** — *out-of-band* from any Claude session, which works off a clone snapshotted when its container started. A code push built on a stale snapshot could silently **revert** newer user-saved edits. That's data loss with no other source of truth.

**The rules:**
1. A code commit must **never modify `edits.js`** (only the API function does).
2. **Always rebase onto the latest `origin/main` before pushing** — a clean fast-forward then can't revert it.
3. **Never force-push `main`.**

**The enforcement:** a committed `pre-push` hook (`.githooks/pre-push`) blocks any push to `main` whose `edits.js` differs from live `origin/main`. The hook is activated each session by the `SessionStart` hook in `.claude/settings.json` (`git config core.hooksPath .githooks`).

If the hook blocks you: restore `edits.js` from `origin/main` (`bash scripts/sync-live-data.sh`), then re-commit / amend / rebase and push again.

This pattern generalizes: any file written out-of-band (by a function or external process) should be added to the hook's protected list. Files regenerated from a durable source (outreach trackers, fund sheet) self-heal and don't need protection; `edits.js` has no other source, so it does.

## The `save-edits` function security model

```
- The GitHub token lives ONLY in the GITHUB_TOKEN env var (server-side).
- Writes require the caller to present EDIT_KEY in the x-edit-key header.
- Without the matching key, the function refuses (401).
- The token is a fine-grained PAT scoped to ONLY this repo, Contents R/W.
- The overlay is shape-guarded: only known keys, bounded size.
```

So the worst case if the edit key leaks is overwriting `edits.js` in your private repo — not arbitrary repo access, and never token exposure to the browser.

## A starting guardrail list for your `CLAUDE.md`

1. Never commit `.netlify/` or any secret; secrets live only in Netlify env vars.
2. Never hard-code investor emails into structured data.
3. Every new pairing needs a citable `verificationUrl`.
4. Never let a code push revert `edits.js`; always rebase before pushing; never force-push `main`.
5. `<Your fund's sensitivity #1>` — never externalize.
6. `<Your fund's sensitivity #2>` — never externalize.
7. Flag anything factually suspect before persisting it.

That's the full handover. Return to `00-getting-started.md` for the build sequence, or open `templates/CLAUDE.md` and start filling it in.
