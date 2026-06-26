---
name: governance-tab
description: >-
  Populate or update a portfolio company's Governance tab from a constitutional or
  financing document — a shareholders' agreement (SHA), certificate of incorporation,
  bylaws, articles of association, company constitution, operating agreement,
  convertible note / SAFE, or cap table (PDF or DOCX). Use whenever the user points at
  such a file and asks to build, populate, or update the governance page for a company
  (e.g. "populate <company> governance from this SHA", "build the governance tab for X").
  Extracts the decision-making rules, governance bodies, share classes and instruments
  into governance.js, validates the render, and (on confirmation) deploys.
---

# Governance tab populator

Turns a company's legal/financing documents into one `GovernanceProfile` in
`governance.js`, rendered by the Governance sub-page (`#company/<id>/governance`).
The tab answers one question, document-grade and neutral: **"How are decisions made
here, and by whom?"** Once you have a few profiles built, keep one per jurisdiction
as a gold reference — read whichever matches before you start, e.g.:

- a **US Delaware C-corporation** (charter + bylaws + DGCL).
- a **UK private company limited by shares** (Articles + Companies Act 2006 + Model Articles).
- a **Singapore Pte Ltd** (Shareholders' Agreement + Companies Act 1967).

## Inputs

1. The document(s) — a path (the user usually attaches files) or a Drive/URL reference.
2. The **company id** — must match a `COMPANIES` record id in `data.js` exactly.
   Hyphenated ids **must be quoted** as object keys.

If the company id is ambiguous, confirm it before writing.

## Procedure

### 1 — Extract the text
```bash
python3 .claude/skills/governance-tab/extract.py <file> [<file> ...]
```
Writes `/tmp/gov-extract/<stem>.txt`. Then **map the document** by grepping for clause
headings (`reserved matter`, `board`, `quorum`, `director`, `drag`, `tag`,
`pre-emption`, `resolution`, `class of share`, `transfer`, `votes`, `variation`,
`general meeting`, `winding`, `allot`) and read the relevant clauses in full with the
`Read` tool. If `extract.py` flags a PDF as scanned/image-only, that file has no
machine text — fall back to the other documents or ask the user for a text copy.

### 2 — Read the architecture
Read the **schema** documented at the top of `governance.js` and mirror the closest
existing profile. The renderer + interactivity live in `app.js` (search
`// ====== Governance tab`); you do not normally edit `app.js` — only add data.

### 3 — Pick the jurisdiction vocabulary
Set `bodyLabels` so the body badges and the "Share capital & voting" column headers
read in the company's own register:

| Jurisdiction | Members called | `bodyLabels` |
|---|---|---|
| US (DE/other) | Stockholders | *(omit — default is "Stockholders" / "Board + Stockholders")* |
| UK / Singapore / most Commonwealth | Shareholders | `{ stockholders: 'Shareholders', both: 'Board + Shareholders' }` |
| Japan KK | Shareholders' Meeting | `{ stockholders: "Shareholders' Meeting", both: "Board + Shareholders' Meeting" }` |

Use body keys `board`, `stockholders` (= the members, whatever they're called), `both`
(a decision needing/served by both bodies), and `officers` only where there is a real
officer tier. `companyNumber` renders as a Snapshot card — use it for the registered
number (UK CRN, Singapore UEN, etc.).

### 4 — Fill the profile, section by section
Build the object from the documents + the governing default law. Keep the tone neutral
and factual — state the rule and the threshold, never editorialize. Every field is
optional and the section drops out cleanly if absent, so **omit what the documents
don't say rather than guessing** (e.g. leave `incorporated` out if it isn't stated).

- **company** — registered **legal name** (not a brand; see guardrails), entity type,
  jurisdiction, `companyNumber`, registered office in `hq`, `stage`, `asOf` (today).
- **controlSummary** — 1–3 neutral sentences on where authority sits.
- **structure** — parent + any subsidiaries (entity / jurisdiction / role / function).
  For an entity whose internal rules live in an unreviewed operating agreement, mark it
  "per operating agreement — TBD" rather than inventing thresholds.
- **bodies** — the decision-makers, each with a rules-focused `description`. List named
  individuals only where the documents name an officer tier *and* it isn't already on
  the Board tab; otherwise describe the rules and let the Board/Cap-table tabs show people.
- **decisions** — *the centerpiece.* One row per matter: `matter`, `decidedBy` (a body
  key), `threshold` (human-readable rule), `source` (cite the clause/section, e.g.
  "SHA cl. 5", "Bylaws §2.1", "DGCL §242", "CA 2006 s.168"), `category`
  (`operational` | `capital` | `personnel` | `structural`). Capture reserved matters,
  consent/veto rights, quorums, written-resolution rules, drag/tag, pre-emption,
  transfer restrictions, and the statutory defaults where the documents are silent.
- **voting** — `classes[]` (name, votesPerShare, authorized, outstanding) + the board &
  member quorum/vote/written-consent rules.
- **instruments** — only if convertibles/SAFEs/notes exist. Render-facing fields are
  `type` + `governanceRights`; put caps, amounts, prices and investor/lender names in
  `economicNotes`, which is **never rendered** (see guardrails).
- **documents / sources / disclaimer** — list the constitutional docs (gate them),
  cite the sources incl. the governing statute, and adapt the disclaimer to the
  jurisdiction (e.g. "Companies House" for UK, "ACRA" for Singapore).

### 5 — Default-law cheat sheet
- **US / Delaware** — DGCL: ordinary matters majority; charter amend / merger /
  dissolution = board + majority of outstanding (DGCL §§242/251/271/275); director
  election by plurality; written consent per the bylaws.
- **UK** — Companies Act 2006 + Model Articles: ordinary resolution >50%, special ≥75%
  (s.21 articles, s.630 class rights), director removal s.168, pre-emption ss.561–562.
- **Singapore** — Companies Act 1967: ordinary >50%, special ≥75%, class rights s.74,
  director removal s.152; an SHA typically overlays reserved matters + board seats and
  prevails over the Constitution.

### 6 — Guardrails (read CLAUDE.md "Critical sensitivities" too)
- **Use the registered legal name** on this document-grade tab. Where a brand differs
  from the legal entity, use the legal name and note "operating as <brand>".
- **Never put the cap table on this tab.** Individual shareholders and their
  holdings/percentages belong on the Cap table tab. Name investors here **only** as
  governance actors — e.g. a party that appoints a board seat or holds a consent right.
- **Keep instrument economics out of the render.** Caps, discounts, amounts, conversion
  prices and lender/investor names go in `economicNotes` (not rendered). `validate.js`
  fails the build if any `economicNotes` string appears in the rendered HTML.
- **Don't fabricate.** Omit fields the documents don't establish; don't invent dates,
  thresholds, or LLC sub-entity rules.
- Never commit `.netlify/` or any secret.

### 7 — Write & validate
Add the profile to the `window.GOVERNANCE` object in `governance.js` (quote hyphenated
keys). Then:
```bash
node --check governance.js
node .claude/skills/governance-tab/validate.js <companyId>
```
`validate.js` checks the render for unbalanced sections, template artifacts, and
economicNotes leaks. Fix anything it flags before proceeding.

### 8 — Human review gate
Governance changes at every financing, so before going live present a concise summary:
the entity + jurisdiction, the board composition, the key consent/reserved-matter
thresholds, and the source citations — and the explicit note that cap-table holders and
instrument economics were kept off the tab. Let the user confirm or correct. (Skip the
pause only if the user has said to proceed without review.)

### 9 — Commit & deploy
The site auto-deploys from `main`. Commit on the working branch, then land on `main`:
```bash
git add governance.js                  # + .claude/skills/... only if you changed the skill
git commit -m "Governance tab: populate <Company> (<entity type>)"
git fetch origin main
git rebase origin/main                  # main moves often (hourly routines); rebase keeps it clean
node --check governance.js && node .claude/skills/governance-tab/validate.js
git checkout main && git merge --ff-only <workingBranch>
git push origin main                    # triggers the Netlify build (~30–60s)
git checkout <workingBranch> && git push --force-with-lease origin <workingBranch>
```
Report the entity, what was encoded, the guardrail handling, and the live deep link
(`#company/<id>/governance`).

## Extending the renderer
Most documents fit the existing schema. If a new jurisdiction needs different body
vocabulary, prefer adding a `bodyLabels` entry (data-only) over editing `app.js`. Only
touch the renderer for a genuinely new section type — and keep every section conditional
so absent data degrades gracefully. If you move the `// ====== Governance tab` marker in
`app.js`, update `validate.js` (it slices on that marker).

## A routine on top (optional)
This skill is the on-demand core. To make it hands-off, a claude.ai **routine** can
watch a Google Drive folder (or a Slack channel) for new constitutional/financing docs
and run this same playbook per new file — mirror the structure of
`scripts/*-outreach-routine.md`. The routine just invokes this skill's procedure; it
isn't a substitute for it.
