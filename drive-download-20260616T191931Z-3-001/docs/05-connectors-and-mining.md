# 05 · Connectors & Mining

A VC HQ becomes a *living* tool when Claude can read your real context. That happens through **MCP connectors** — Gmail, Slack, Google Drive, Fireflies — wired into your Claude sessions.

## The connectors

| Connector | What Claude does with it |
|---|---|
| **Gmail** | Searches investor / portco threads for fresh state, last-touch dates, open follow-ups, deal terms. |
| **Slack** | Reads deal channels (`#dd-*`, `#portco-*`); powers the auto-update routines (doc 06). |
| **Google Drive** | Reads live outreach trackers and the fund master sheet (cap tables, cash flows). |
| **Fireflies** | Pulls meeting transcripts for conversation history. |

### Wiring them up

Connectors are enabled per environment in Claude:
- In **claude.ai/code**, connect them in your account's connector settings; for routines, ensure the routine's environment has the connector enabled.
- In **Claude Code CLI/desktop**, add the MCP servers to your config.

Once connected, the tools appear to Claude (e.g. Gmail `search_threads`/`get_thread`, Slack `slack_search_*`, Drive `search_files`/`read_file_content`). You don't call them — you ask Claude in plain English and it picks the right tool.

## Set boundaries explicitly

This is critical and belongs in `CLAUDE.md` as a guardrail:

- **Allow-list** what's in scope to mine — e.g. "threads about portfolio companies and their investors only."
- **Default-deny** everything else — other funds you advise, personal mail, unrelated businesses. Name them so Claude never surfaces them.
- **Never import contact emails** into any data file that could be shared. The repo is private, but keep that layer anyway.

A concrete pattern: *"When mining Gmail, only surface deltas about our portfolio companies and their cap-table/prospective investors. Never include content from `<other-fund>` or personal threads, even if they match a search."*

## The mining workflow

A typical "bring the site up to date on a company" session:

```
1. Search Gmail:  from:partner@fund.vc <Company>  +  subject:<Company>
2. Search Slack:  in:#<company> / in:#dd-<company>
3. Synthesize the new state into the per-company narrative doc
4. Update data.js (round size, lead, status) + ROUND_STATUS[id] in app.js
5. git commit + push   → auto-deploys
```

You can just say: *"Mine everything new on Acme Fusion since last week and update the site."* Claude runs the searches, reconciles against what's already there, and makes the edits.

## Parallelize a full sweep

To refresh the *whole* portfolio, have Claude spawn **one background agent per company** so they run concurrently. Each agent needs a **self-contained brief** (agents don't inherit your chat context):

- What the company is and its current known state.
- What's already on the site (so it doesn't re-surface old news).
- The sensitivity guardrails (what must never be externalized).
- The exact output format you want back (e.g. a single JSON block of new pairings/touchpoints).

Then you apply all the agents' outputs in one pass and run `node --check data.js`.

## Touchpoint mining

A high-value periodic job: mine Gmail/Slack/Fireflies for actual conversation history with each paired investor, and attach a `touchpoint` to the matching pairing (status, date, source, note — see doc 03). This turns the Pairings view from a cold list into a live CRM: you can filter to "anything in DD" or "active in the last 30 days."

Re-run it quarterly or after major events.

Next: **`06-automation-routines.md`**.
