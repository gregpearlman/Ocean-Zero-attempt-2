# 06 · Automation Routines

Routines are scheduled Claude jobs (set up at **claude.ai/code/routines**) that keep the site fresh without you in the loop. They're optional — the site works fully hand-driven — but they're what makes it feel alive.

## The routine pattern

Every routine follows the same shape:
1. Runs on a schedule (hourly / weekly).
2. Reads a source (Slack channel, Gmail, a Drive sheet).
3. Edits the relevant files.
4. `git commit` + `git push` (Netlify auto-deploys).
5. Keeps a **cursor file** so it never re-processes the same input twice.

Each routine needs its environment to have the right connectors enabled and a network allow-list that includes the services it calls (e.g. `slack.com`, `googleapis.com`).

## Routine 1 — Slack scanner ("edit the site from Slack")

Watches a dedicated channel (e.g. `#website`) and treats every new message as a plain-English instruction to edit the site.

- Pulls new messages since the last-seen timestamp (stored in a cursor file like `.cursor-website.txt`).
- Makes the edit, commits with a `Source: <slack permalink>` footer, pushes.
- Replies in-thread with the resulting commit SHA.

**Dedup is two-layered:** the cursor file *and* the `Source:` footer (the routine greps `git log` for the permalink before acting). Both must miss for a message to be reprocessed — so a reverted cursor can't cause a full-channel replay.

> This is the killer feature: anyone on the team can update the fund's dashboard by typing a sentence in Slack.

## Routine 2 — Email scout

Sweeps the inbox (within your allow-list, doc 05) for new investor/portco developments since its cursor, and posts each as a **proposed update** to Slack — for a human to ✅-react before it's applied. This keeps a human in the loop on what gets written from email.

A common design merges the scout into the Slack scanner as a first "pass": scan email → propose in Slack → apply human-approved proposals → apply direct human instructions.

## Routine 3 — Drive sync (outreach trackers + fund sheet)

Weekly pull of each live spreadsheet into its `.js` file:

- **Outreach trackers:** each company's investor-outreach sheet → `<company>-outreach.js` → a searchable, filterable table on that company's page.
- **Fund master sheet:** cap tables / cash flows / valuations → `fund-performance.js` → the Fund Performance view.

The refresh is **diff-gated** — it regenerates the file but only commits if the *data* actually changed (ignoring the timestamp), so a quiet week produces no noise.

```bash
# pattern: scripts/<thing>-refresh.sh
#   1. download the sheet to a temp file
#   2. regenerate the .js payload
#   3. diff against the committed file (ignoring fetchedAt)
#   4. commit + push ONLY if changed
```

### Why the renderer is column-agnostic

The outreach table renderer reads whatever columns the sheet has and auto-builds filters for small-cardinality columns, ✓/· for booleans, and colour-coded status chips. So you can wire a new company's tracker with **no code change** — just point a refresh script at its Drive file id and add a `<script>` tag.

## Routine 4 — Verify / dedup passes

Periodic agent sweeps that keep the investor universe honest:
- Re-verify each pairing's `verificationUrl`, that the named partner is still at the fund, and that LinkedIn slugs resolve.
- Merge duplicate investor records that crept in from parallel agents (same fund, different `id`).

Run quarterly. VC partners move funds every 6–18 months, so citations and contact names go stale fast.

## Build-time vs routine data pulls

There are two ways to refresh live data; you can use either or both:
- **Routine pull** (recommended): a Claude routine reads Drive via the MCP connector and commits the result. No service account needed; the committed file survives deploys.
- **Build-time pull** (optional): `scripts/build-meta.sh` pulls via a service account during the Netlify build. Only activate this if you want hands-off refresh independent of routines — and design it to **skip without overwriting** when creds are absent.

## Disabling a routine

Toggle it off in the claude.ai routines UI. Don't delete its cursor file — that would cause the next run to reprocess everything from the start.

Next: **`07-guardrails-and-security.md`**.
