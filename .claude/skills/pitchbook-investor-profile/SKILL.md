---
name: pitchbook-investor-profile
description: >-
  Bulk up an investor profile in the Investors/Pairings database from a PitchBook
  PDF export (Venture Capital / PE-Buyout / Impact Investing profile). Use whenever
  the user attaches one or more PitchBook profile PDFs and asks to enrich, bulk up,
  add, or refresh an investor/fund profile (e.g. "bulk up investor profiles with
  this", "add the PitchBook data for Ara Partners", "enrich Just Climate from this
  PDF"). Parses the firmographics, key team and portfolio, attaches a structured
  `pitchbook` snapshot to the matching INVESTORS record, additively enriches the
  displayed fields, validates the render, and deploys.
---

# PitchBook investor-profile enricher

Turns a PitchBook profile PDF into a structured **`pitchbook` snapshot** on the
matching investor record in `data.js`, rendered by `pitchbookSection()` in the
investor detail pane (Investors view → click the fund → "📊 PitchBook snapshot").
Three records are gold references — read whichever matches the fund type before you
start (all in `data.js`, search the id):

- **`future-ventures`** — Venture Capital profile (seed/early-stage VC).
- **`ara`** — PE/Buyout profile (control PE, dry powder, trade association).
- **`just-climate`** — Impact Investing profile (LLP, registration number, establishedBy).

## Inputs

1. The PitchBook PDF(s) — usually attached. One per fund.
2. The **investor id** in `data.js`. Find it by name; **mind the ID-fragmentation
   gotcha** — the same fund can appear under several ids if parallel agents added it
   independently. Enrich the **canonical** record (the one with the most
   pairings), and flag any duplicate to the user rather than
   enriching both. If the fund isn't in the DB at all, say so and add a minimal
   record first (or ask) — this skill enriches existing records, it doesn't mint them.

## Currency

PitchBook displays this account's figures in **GBP (£)**. Keep them verbatim in the
`pitchbook` object and in any `notes` line — do **not** invent USD conversions. The
snapshot header labels the block "figures GBP" so the £ signs aren't mistaken for the
USD used elsewhere on the record.

## Procedure

### 1 — Extract the text (layout-preserved)
```bash
python3 .claude/skills/pitchbook-investor-profile/extract.py <file.pdf> [<file.pdf> ...]
```
Writes `/tmp/pb-extract/<stem>.txt`. PitchBook profiles are **columnar**, so this uses
`pdftotext -layout` (poppler, auto-installed) — not pypdf, which scrambles the columns.
Everything you need is in the **first ~150 lines** (General Information, Contact, Current
Team, Top 25 Lead Partners) plus the **All Investments** and **Exits** tables.

### 2 — Map the profile
Read these sections from the `.txt`:
- **General Information** — Website, Entity/Investor Types, Legal Name, *Also/Formerly
  Known As*, Investor Status, Year Founded, **AUM**, **Dry Powder**, Trade Association,
  and the right-hand stats: Total Investments, Active Portfolio, Investments (TTM),
  Exits, Med. Round Amount, Med. Valuation, # of Professionals.
- **Investment Style Summary** — the Deal Type / Industry / Geography percentage mixes
  (use the "All Years" column unless the fund has clearly pivoted, then note both).
- **Contact / Current Team / Top 25 Lead Partners** — the verified partner names +
  exact titles + deal/board counts. These are gold for fixing stale `leadPartner`
  strings (CLAUDE.md's #1 data-quality problem is wrong/stale partner names).
- **All Investments / Exits** — dated, verified portfolio companies (and any that are
  **portco-relevant**: a co-investor in one of your companies, or a close peer — call these out).

### 3 — Build the enrichment patch
Write `/tmp/pb-patch.json` keyed by investor id. Per id, all ops optional:

```json
{
  "<id>": {
    "set":          { "hq": "City, Country", "leadPartner": "…", "funds": "…" },
    "appendNote":   "PitchBook (<asOf>): <one dense factual line>",
    "addPortfolio": ["Company (round, £size, date)", "…"],
    "pitchbook":    { …the snapshot object, schema below… }
  }
}
```

Rules:
- **Additive by default.** Use `appendNote` / `addPortfolio` (they preserve curated
  prose and dedup). Reserve `set` for fields PitchBook genuinely improves: `hq`,
  `funds` (append dry powder/AUM), and a `leadPartner` refresh with correct titles.
- **Never destroy curated narrative** (killer quotes, thesis ties, sensitivity
  notes). Append to `notes`, don't replace it.
- **Don't import emails** — names + titles only, never the `@fund` address.
- **Omit what PitchBook doesn't state** — leave a `pitchbook` field out rather than guessing.

The **`pitchbook` object** schema (every field optional; the renderer drops absent ones):

| field | type | notes |
|---|---|---|
| `asOf` | "YYYY-MM-DD" | the PDF's "Last Updated" date |
| `pbId` | string | the header `pbId` (provenance) |
| `website` | string | |
| `legalName` / `alsoKnownAs` / `formerlyKnownAs` | string | |
| `registration` | string | e.g. UK LLP "OC…" number |
| `yearFounded` | number | |
| `hq` | string | primary office city, country |
| `altOffices` | string[] | other offices |
| `entityTypes` / `investorTypes` | string[] | |
| `status` | string | "Actively Seeking New Investments" etc. |
| `establishedBy` | string | parent/sponsor (e.g. Generation IM) |
| `isRIA` | bool | Registered Investment Adviser |
| `tradeAssociation` | string | e.g. PRI |
| `aum` / `dryPowder` | "£…" | verbatim GBP |
| `totalInvestments` / `activePortfolio` / `investmentsTTM` / `exits` | number | |
| `medRoundAmount` / `medValuation` | "£…" | verbatim GBP |
| `professionals` | number | PitchBook "# of Professionals" |
| `dealTypes` / `industries` / `geographies` | `[label, pct][]` | the mix bars; pct is a number |
| `keyTeam` | `{name,title,deals?,boards?}[]` | verified partners, most senior first |

### 4 — Reconcile structured tags with any recent verification pass
`stagesTag` / `geosTag` / `ticketMin/Max` / `leadCapable` drive the filters and are
frequently re-tuned by the Slack/deep-dive routines that push to `main` hourly. Before
overriding any of them in `set`, **diff your target record against `origin/main`** — if
a recent commit already refined a tag, **merge with it, don't clobber it**:
```bash
git fetch origin main
git show origin/main:data.js > /tmp/main-data.js   # then compare the record's fields
```
Only correct a tag when PitchBook **demonstrably** contradicts it (e.g. a fund tagged
`asean` whose deals are 92% US → set `us`), and prefer **adding** a geo over removing one.

### 5 — Apply, then validate the render
```bash
node .claude/skills/pitchbook-investor-profile/enrich.js /tmp/pb-patch.json
node .claude/skills/pitchbook-investor-profile/validate.js          # all pitchbook records
```
`enrich.js` mutates each record's one-line JSON in place and runs `node --check`
itself (writes nothing if any id is missing or any line won't parse). `validate.js`
renders `pitchbookSection()` for every enriched record and fails on artifacts,
unbalanced `<div>`s, missing core fields, or a renderer that isn't wired in.

### 6 — The renderer is already wired
`pitchbookSection(i)` lives in `app.js` (search `function pitchbookSection`) and is
invoked in `openInvestorDetail` right after the "At a glance" section
(`${pitchbookSection(i)}`); its CSS is the `.pb-*` block in `styles.css` (it reuses
`.rating-*` for the mix bars). It's **guarded** (`if (!pb) return ''`), so records
without a `pitchbook` field render nothing. You normally **edit data only**. If the
function is missing (fresh checkout that predates it), re-add it from the `ara` gold
reference and insert the `${pitchbookSection(i)}` call + the `.pb-*` CSS; `validate.js`
will tell you if the wiring is absent.

### 7 — Guardrails (read CLAUDE.md "Critical sensitivities" too)
- **Never import investor emails** (#10) — names/titles only.
- **Never let a code push revert `edits.js`** (#11) — your commit must not touch it;
  rebase onto `origin/main` before pushing; never force-push `main`.
- **Don't fabricate** — omit unknown fields; keep £ figures verbatim (no invented FX).
- **Preserve prior verification** — merge with recent deep-dive/Slack edits (step 4).
- Never commit `.netlify/` or any secret.

### 8 — Commit & deploy
The site auto-deploys from `main`. Keep the change tightly scoped (the 1–3 data lines
+ the skill, nothing else):
```bash
git add data.js                         # + app.js styles.css only if you had to re-add the renderer
git commit -m "Investors: add PitchBook snapshot to <Fund(s)>"
git fetch origin main
git rebase origin/main                   # main moves often (hourly routines) — rebase keeps edits.js intact
node --check data.js && node .claude/skills/pitchbook-investor-profile/validate.js
git checkout main && git merge --ff-only <workingBranch>
git push origin main                     # triggers the Netlify build (~30–60s)
git checkout <workingBranch> && git push --force-with-lease origin <workingBranch>
```
Report: the fund(s) enriched, headline firmographics added (AUM / founded / exits /
key team), any portco-relevant portfolio finding (co-investor or close peer), any tag
correction made, and any duplicate-id you spotted for the user to merge.

## Batch / multiple PDFs
Extract all PDFs, build one `/tmp/pb-patch.json` with several ids, and run `enrich.js`
once — it applies every id in a single pass and validates the whole file. Keep one
commit per logical batch.
