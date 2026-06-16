# 03 · Data Model

Everything the site shows comes from a few plain-JS arrays in `data.js`. Three are core: `COMPANIES`, `INVESTORS`, `PAIRINGS`. Get these right and the rest of the site renders itself.

You rarely write these by hand — paste your raw data into Claude and ask it to match the schema. But you should understand the shape so you can sanity-check.

---

## `COMPANIES`

One object per portfolio company. The `id` is a permanent, lowercase, hyphenated key used everywhere else (pairings, status objects, routes). **Never change an `id`** once set.

```js
const COMPANIES = [
  {
    id: 'acme-fusion',                    // permanent key
    name: 'Acme Fusion',
    website: 'https://acmefusion.com/',
    sector: 'Fusion energy',
    stage: 'Series A',
    hq: 'Boston, MA',
    raised: '~$25M cumulative',
    lastRound: '$12M Seed (2024) led by …',
    status: 'Active raise — $40M Series A',  // short status label
    tagline: 'Compact tokamak; first net-energy demo targeted 2027.',
    milestones: [
      'DOE grant awarded Jan 2026',
      'Net-energy demo targeted Q3 2027'
    ],
    notes: 'Founder background, strategic backers, key context…',
    pitchAsk: '$40M @ $180M pre-money'
  },
  // …one per company
];
```

The dashboard tile, the company mini-site header, and the pairings all key off this record.

### Companion: dashboard status (in `app.js`)

The dashboard's urgency/colour comes from a `ROUND_STATUS` object in `app.js`, keyed by the same `id`:

```js
const ROUND_STATUS = {
  'acme-fusion': {
    urgency: 'hot',                       // hot | warm | cold
    statusLabel: '$40M Series A',
    ask: '$40M @ $180M pre',
    state: 'Lead in DD; close targeted Q4.',
    actions: ['Finish data room', 'Confirm co-lead']
  },
};
```

> **Gotcha:** the `ROUND_STATUS` key must match the `COMPANIES` `id` *exactly* — hyphens and all.

---

## `INVESTORS`

Your funding universe — funds, angels, strategics. Each record carries research plus structured tags the filters use.

```js
const INVESTORS = [
  {
    id: 'lowercarbon',                    // permanent key, referenced by pairings
    name: 'Lowercarbon Capital',
    type: 'non-aaf',                      // your source classification
    hq: 'US',
    website: 'https://lowercarbon.com/',
    thesis: 'Climate deep-tech; will lead Series A.',
    ticket: '$10–25M, leads',
    // structured tags (used by the filter UI):
    stagesTag: ['seed','series-a','series-b'],
    geosTag: ['us','global'],
    ticketMin: 10, ticketMax: 25,         // USD millions
    leadCapable: 'yes',                   // yes | maybe | no
    isGrant: false,
    coInvestorOf: null,                   // a company id if already on a cap table
    contactStatus: 'cold',                // aggregated from touchpoints
    verified: true                        // true if any pairing has a citable source
  },
];
```

You can start minimal (`id`, `name`, `type`, `thesis`, `ticket`) and let a later "tag-derivation" pass fill the structured fields from the free text.

---

## `PAIRINGS`

The heart of the matchmaking engine: every investor × company match, ranked.

```js
const PAIRINGS = [
  {
    rank: 1,                              // integer primary key
    tier: 1,                              // 1 | 2 | 3 | "avoid"
    investor: 'lowercarbon',              // → INVESTORS id
    company: 'acme-fusion',               // → COMPANIES id
    conviction: 5,                        // 0–5
    contact: 'Clay Dumas, Partner',
    contactLinkedIn: 'https://www.linkedin.com/in/…',   // or null
    killerAngle: 'Backed 3 fusion plays 2024–25; deep-tech lead.',
    checkAsk: '$15–20M lead',
    introPath: 'Warm via shared LP …',
    ticketMatch: 'yes',                   // yes | tight | no
    stageMatch: 'yes',                    // yes | tight | no
    verificationUrl: 'https://techcrunch.com/…',  // citable 2024–26 source
    touchpoint: {                         // optional — real conversation history
      date: '2026-05-20', status: 'in-dd',
      source: 'gmail', tpContact: 'Clay Dumas',
      note: 'Data room shared; IC scheduled.'
    }
  },
];
```

### Field discipline that keeps the universe honest

- **`verificationUrl` is mandatory for every new pairing.** A citable 2024–26 source proving the fund is actively investing in the right sector at the right stage. This single rule is what prevents fabricated funds and stale partner names from creeping in.
- **`tier`** drives the colour-coded badge: `1` = pursue now, `2` = timing/positioning, `3` = future rounds, `"avoid"` = conflict.
- **`touchpoint.status`** enum: `active` / `ts-stage` / `in-dd` / `discussion` / `intro` / `ghosted` / `passed` / `passive`.
- **Rank allocation:** reserve a block of ranks per expansion round so parallel agents don't collide (e.g. round 1 = ranks 100–199, round 2 = 200–299).

---

## Validation

After any edit to `data.js`, always run:

```bash
node --check data.js
```

This catches the single most common mistake — a missing comma when splicing a new record before the closing `];`. Make it a reflex; Claude should run it after every apply.

## Other arrays

`data.js` can also hold `SECTORS`, `EXPERTS`, and any survey data your fund tracks. The pattern is identical: a plain array of objects, read by a render function in `app.js`. Add fields freely — unknown fields are simply ignored by renderers that don't use them.

Next: **`04-netlify-deploy.md`**.
